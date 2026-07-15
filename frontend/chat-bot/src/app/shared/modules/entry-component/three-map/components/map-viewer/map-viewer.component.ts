import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import * as THREE from 'three';

// Models
import { LocationData, RoomMesh, NavNode } from '../../models';

// Services
import {
  SceneService,
  CameraService,
  RendererService,
  ControlsService,
  InteractionService,
  AnimationService,
  CleanupService,
  FloorPlanService,
  NavigationService,
  RouteVisualizationService,
  CameraAnimationService,
  CompassControlService,
  LabelVisibilityService,
  PersonMovementService,
  ReaderService,
  RegionalLocationNameService
} from '../../services';

// Helpers
import { applyRoomHighlight, createPerson, latLonToMeters, createLabel, getCategoryColor, getCategoryMaterialIcon } from '../../helpers';

// Constants
import {
  FLOOR_MAX_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_ABSOLUTE,
  FLOOR_STACK_HEIGHT,
  CAMERA_ZOOM_IN_FACTOR,
  CAMERA_ZOOM_OUT_FACTOR,
  ROUTE_ANIMATION_SCALE_MIN,
  ROUTE_ANIMATION_SCALE_MAX,
  ROUTE_ANIMATION_SPEED,
  ROUTE_ANIMATION_OFFSET,
  PERSON_BASE_MOVE_SPEED,
  GPS_PRIMARY,
  GPS_SECONDARY,
  PERSON_BODY_COLOR,
  PERSON_HEAD_COLOR,
  WALL_THICKNESS,
  WALL_HEIGHT,
  WALL_COLOR,
  LABEL_HEIGHT,
  FOCUS_ROOM_MIN_DISTANCE,
  ROUTE_RIBBON_WIDTH
} from '../../constants/map.constants';

import { CompassState } from '../../services/compass-control.service';
import { MqttService, IMqttMessage } from '../../services/mqtt.service';
import { MovementState } from '../../services/person-movement.service';
import { HospitalService, CommonService } from '../../../../../services';

export interface LocationCategory {
  name: string;
  catId: string;
  color: string;
  icon: string;
  rooms: IndoorNavLocationOption[];
}

export interface PathStep {
  instruction: string;
  distance: string;
  icon: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'arrive';
}

export interface IndoorNavLocationOption {
  id: number;
  name: string;
  displayName: string;
  regionalName?: string;
  typeName: string;
  floorId: number;
  floorName: string;
  floor: any;
  node: NavNode;
  data: LocationData;
}

@Component({
  selector: 'app-map-viewer',
  standalone: false,
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.scss'],
  providers: [
    SceneService,
    CameraService,
    RendererService,
    ControlsService,
    InteractionService,
    AnimationService,
    CleanupService,
    CameraAnimationService,
    CompassControlService,
    LabelVisibilityService
  ]
})
export class MapViewerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  @Input() showMultiMapButton: boolean = false;
  @Input() initialFloorId: number | null = null;
  @Input() compactUi: boolean = false;
  @Input() isFloorPlanPage: boolean = false;
  @Output() multipleMapView = new EventEmitter<void>();
  @Output() floorChanged = new EventEmitter<number>();
  @Output() blockChanged = new EventEmitter<number>();

  @ViewChild('canvasContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;

  @ViewChild('destCalloutEl')
  private destCalloutEl?: ElementRef<HTMLDivElement>;

  @ViewChild('youAreHereEl')
  private youAreHereEl?: ElementRef<HTMLDivElement>;

  @ViewChild('sourceMarkerEl')
  private sourceMarkerEl?: ElementRef<HTMLDivElement>;

  @ViewChild('destMarkerEl')
  private destMarkerEl?: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private floorData: any = null;

  private buildingGroup: THREE.Group | null = null;
  private secondaryBuildingGroup: THREE.Group | null = null;
  private floorGroups: THREE.Group[] = [];
  private secondaryFloorGroups: THREE.Group[] = [];
  private roomMeshesByFloor: RoomMesh[][] = [];
  private secondaryRoomMeshesByFloor: RoomMesh[][] = [];

  private originalMaterialState = new WeakMap<THREE.Material, {
    color?: THREE.Color;
    opacity?: number;
    transparent?: boolean;
  }>();

  private roomMeshes: RoomMesh[] = [];
  private readerSprites: THREE.Sprite[] = [];
  private readerSpritesByFloor: THREE.Sprite[][] = [];
  private hoveredRoom: RoomMesh | null = null;
  private selectedRoomMesh: RoomMesh | null = null;

  selectedRoom: LocationData | null = null;
  public blockWithFloorList = [];
  public floorDetails = {};
  isLoading = true;
  private floorSize = 200;

  // Pathfinding state
  startRoom: RoomMesh | null = null;
  endRoom: RoomMesh | null = null;
  private routeGroup: THREE.Group | null = null;
  private navigationGraph: Map<number, number[]> = new Map();
  public routeDistance: string = '';
  public routeTime: string = '';

  public startSearchValue: string = '';
  public destinationSearchValue: string = '';

  public startSelectedRoomId: number | null = null;
  public destinationSelectedRoomId: number | null = null;

  public isStartDropdownOpen = false;
  public isDestinationDropdownOpen = false;

  // Person journey state
  public isJourneyStarted = false;

  // --- Quick Access config & state ---
  isQuickAccessConfigOn = false;
  isQaOpen = false;
  selectedQaCategory: LocationCategory | null = null;
  qaCategories: LocationCategory[] = [];
  qaLocCardTop = 0;
  private locationCategoryMap: Map<string, string> = new Map();
  private locationCategoryMapLoaded = false;
  private allFloorNavOptions: IndoorNavLocationOption[] = [];
  private allFloorSearchPromise: Promise<void> | null = null;
  isNavSearchLoading = false;
  selectedStartLocation: IndoorNavLocationOption | null = null;
  selectedDestinationLocation: IndoorNavLocationOption | null = null;
  sourceLabel = 'Select source location';
  isSourceFromConfig = false;
  isDestDropdownOpen = false;

  // --- Multi-floor state ---
  multiFloorRouteActive = false;
  multiFloorStartLiftNode: NavNode | null = null;
  multiFloorDestLiftNode: NavNode | null = null;
  multiFloorStartLiftLocationId: number | null = null;
  multiFloorDestLiftLocationId: number | null = null;
  activePathStartNode: NavNode | null = null;
  activePathEndNode: NavNode | null = null;
  private animatedFloors = new Set<number>();

  // --- Path Animation & camera follow ---
  pathAnimating = false;
  pathAnimStartTime = 0;
  pathAnimDuration = 4000;
  pathAnimComplete = false;
  pathRevealTriggered = false;
  routeCameraFollowActive = false;
  pathTotalLength = 0;
  routeRibbonMesh: any = null;
  routeRibbonTotalIndices = 0;
  routeAnimationTimer: any = null;
  pathSteps: PathStep[] = [];
  isStepsOpen = false;
  private readonly routeCameraTransitionDuration = 1000;
  private landingResetTimer: any = null;
  private lastFrameTime = 0;
  private nodeFetchPromises: Record<number, Promise<void>> = {};
  private floorDetailFetchPromises: Record<number, Promise<void>> = {};

  public isActionLoading = false;
  private actionLoaderTimer: any = null;

  // Visibility Config State
  public showRooms = true;
  public showLabels = true;
  public showIcons = true;
  public showReaders = true;
  public canSelectRooms = false; // Default OFF
  public showMqttMarkers = false;
  public showLevels = false;
  public showFloorImage = true;
  public showFoundation = true; // New Toggle
  public showCorridorWalls = false; // New Toggle
  public showRoomWalls = false;
  public showDoors = false;
  public showGeoPolygon = true;
  public zoomValue: number = 0; // Absolute camera distance
  public wallColor = WALL_COLOR;
  public tempWallColor = WALL_COLOR;
  public wallWidth: number = WALL_THICKNESS;
  public tempWallWidth: number = WALL_THICKNESS;
  public wallHeight: number = WALL_HEIGHT;
  public tempWallHeight: number = WALL_HEIGHT;
  public labelHeight: number = LABEL_HEIGHT;
  public tempLabelHeight: number = LABEL_HEIGHT;
  public labelScale: number = 3.0;
  public tempLabelScale: number = 3.0;
  public isPerspectiveLock = true;
  public isEagleTopView = false;
  public viewMode: '2d' | '3d' = '3d';
  public isPanOnlyMode = false;
  public isRotateMode = false;
  public isWireframe = false;
  public showFog = false;
  public showSurroundings = true;
  public isConfigOpen = false;
  public isBlockDropdownOpen = false;
  private person: THREE.Group | null = null;
  private floorImageMeshes: THREE.Mesh[] = [];
  private foundationMeshes: THREE.Mesh[] = [];
  private doorMeshes: THREE.Group[] = [];
  private blockLabelSprite: any = null;
  private mapConfig: { skipLocByCat: string[], skipLocCatByCat: string[], skipLocNameByCat?: string[], threeDFloorByCat?: string[], threeDHeight?: Record<string, number>, categoryColors?: { [catId: string]: string }, categoryIcons?: { [catId: string]: string }, floorDefaults?: { [floorId: string]: { distance: number, theta: number, phi: number } }, mapTileType?: string, categoryQuickAccess?: { [catId: string]: boolean } } = { skipLocByCat: [], skipLocCatByCat: [] };
  private mapConfigRecord: any = null;
  private mapConfigId: number | null = null;
  public isFloorDefaultSaving = false;
  public floorDefaultSaveStatus: '' | 'success' | 'error' = '';
  public get floorDefaultExists(): boolean {
    return !!(this.selectedFloorId && this.mapConfig?.floorDefaults?.[String(this.selectedFloorId)]);
  }
  public get savedFloorDefaultTheta(): number | null {
    if (!this.selectedFloorId || !this.mapConfig?.floorDefaults) return null;
    const def = this.mapConfig.floorDefaults[String(this.selectedFloorId)];
    return def ? Math.round(def.theta * 180 / Math.PI) : null;
  }
  public get savedFloorDefaultZoom(): number | null {
    if (!this.selectedFloorId || !this.mapConfig?.floorDefaults || !this.controls) return null;
    const def = this.mapConfig.floorDefaults[String(this.selectedFloorId)];
    if (!def) return null;
    const min = this.controls.minDistance;
    const max = this.controls.maxDistance;
    return max > min ? Math.round(((max - def.distance) / (max - min)) * 200) : null;
  }
  public get currentRotationDeg(): number {
    const cam = this.getCameraState();
    return cam ? Math.round(cam.theta * 180 / Math.PI) : 0;
  }
  public foundationColor: string = '#f5f5f5';  // Default light white
  public tempFoundationColor: string = '#f5f5f5';
  private pathPoints: THREE.Vector3[] = [];
  private moveSpeed = PERSON_BASE_MOVE_SPEED;
  private movementState: MovementState = {
    isMoving: false,
    currentPathIndex: 0,
    moveProgress: 0
  };

  // Compass rotation state
  private compassState: CompassState = {
    isRotating: false,
    lastAngle: 0,
    lastMouseY: 0,
    pivotX: 0,
    pivotY: 0,
    targetTheta: 0,
    targetPhi: 0,
    currentTheta: 0,
    currentPhi: 0,
    targetPivotX: 0,
    targetPivotY: 0,
    compassRect: null
  };

  public isGraphVisible = false;
  private navNodes: NavNode[] = [];
  private allNodes: { [floorId: number]: any[] } = {};
  private nodeNavigationGraph = new Map<number, number[]>();
  private graphGroup: THREE.Group | null = null;
  public isFirstFloor = false;

  // Reader dialog state
  public activeReader: any = null;
  public readerDialogPos = { x: 0, y: 0 };

  get pivotX(): number { return this.compassState.pivotX; }
  get pivotY(): number { return this.compassState.pivotY; }

  blocks: any[] = [];
  selectedBlock: any = null;
  selectedBlockId: number | null = null;
  filteredFloors: any[] = [];
  selectedFloor: any = null;
  selectedFloorId: number | null = null;

  private outdoorBlock: any = null;
  private outdoorFloorId: number | null = null;
  private outdoorGroup: THREE.Group | null = null;
  private outdoorRoomMeshes: RoomMesh[] = [];
  private lastBuildingOpacity: number | null = null;

  private floorLayouts: any = null;
  public noDataFound = false;

  levelOptions: any[] = [];
  selectedLevel = 1;

  private get activeFloorIndex(): number {
    if (!this.selectedBlock || !this.selectedFloor) return 0;
    const index = this.filteredFloors.indexOf(this.selectedFloor);
    return index >= 0 ? index : 0;
  }

  private getActiveRoomMeshes(): RoomMesh[] {
    const primaryRooms = this.roomMeshesByFloor[this.activeFloorIndex] ?? [];
    // For Secondary, always return Level 1 rooms as "active" for interaction/labels
    const secondaryRooms = this.secondaryRoomMeshesByFloor[0] ?? [];
    return [...primaryRooms, ...secondaryRooms];
  }

  constructor(
    private sceneService: SceneService,
    private cameraService: CameraService,
    private rendererService: RendererService,
    private controlsService: ControlsService,
    private interactionService: InteractionService,
    private animationService: AnimationService,
    private cleanupService: CleanupService,
    private floorPlanService: FloorPlanService,
    private navigationService: NavigationService,
    private routeVisualizationService: RouteVisualizationService,
    private cameraAnimationService: CameraAnimationService,
    private compassControlService: CompassControlService,
    private labelVisibilityService: LabelVisibilityService,
    private personMovementService: PersonMovementService,
    private readerService: ReaderService,
    private regionalLocationNameService: RegionalLocationNameService,
    private mqttService: MqttService,
    private hospitalService: HospitalService,
    private commonService: CommonService
  ) {
    this.animate = this.animate.bind(this);
  }

  // MQTT Device Tracking
  private markers: Map<string, THREE.Group> = new Map();
  private markerTargets: Map<string, THREE.Vector3> = new Map();
  private clusterGroups: Map<string, string[]> = new Map(); // clusterId -> tids
  private clusterMeshes: Map<string, THREE.Group> = new Map(); // clusterId -> bubble mesh
  private clusterGroup: THREE.Group = new THREE.Group();
  private clusterDistance = 5.0; // Distance threshold for merging markers
  // public mapViewMode: 'landscape' | 'urban' | 'default' = 'landscape';
  public mapViewMode: 'urban' | 'default' = 'default';
  private surroundingsGroup: THREE.Object3D | null = null;
  private mqttSubscription: any;
  private wallMaterial: THREE.MeshStandardMaterial | null = null;
  private environmentGroup: THREE.Group = new THREE.Group();
  private baseFloorCenter: THREE.Vector2 = new THREE.Vector2(0, 0);
  private rawFloorCenter: THREE.Vector2 = new THREE.Vector2(0, 0);
  private floorHasGeoAlign: boolean = false;
  // Resolves once user preferences are fetched (or timed out). Gates floor selection
  // and loadSettings() so saved state is always applied on first render.
  private userPreferencesReady: Promise<void> = Promise.resolve();
  private floorWidth: number = 0;
  private floorHeight: number = 0;

  private savedMapState: any = null;
  private pendingFloorLoad = false;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFloorId'] && !changes['initialFloorId'].isFirstChange()) {
      const newFloorId = changes['initialFloorId'].currentValue;
      if (newFloorId !== null && newFloorId !== undefined && this.blocks && this.blocks.length > 0) {
        if (newFloorId !== this.selectedFloorId) {
          this.selectFloorById(newFloorId);
        }
      }
    }
  }

  private selectFloorById(floorId: number): void {
    let targetBlock = null;
    let targetFloor = null;

    for (const block of this.blocks) {
      const floor = (block.children || []).find((f: any) => f.id === floorId);
      if (floor) {
        targetBlock = block;
        targetFloor = floor;
        break;
      }
    }

    if (targetBlock && targetFloor) {
      this.selectedBlockId = targetBlock.id;
      this.selectedBlock = targetBlock;
      this.filteredFloors = targetBlock.children || [];
      this.selectedFloor = targetFloor;
      this.selectedFloorId = targetFloor.id;
      const index = this.filteredFloors.indexOf(targetFloor);
      this.selectedLevel = index + 1;
      this.isLoading = true;
      this.noDataFound = false;
      this.getFloorNode(this.selectedFloorId);
      if (this.floorDetails.hasOwnProperty(this.selectedFloorId)) {
        this.regionalLocationNameService.applyToFloor(this.selectedFloorId, this.floorDetails[this.selectedFloorId]).finally(() => this.loadBlockFloors());
      } else {
        this.hospitalService.getLogicalLocationWithChildren(this.selectedFloorId).subscribe(res => {
          this.floorDetails[this.selectedFloorId] = res.results;
          this.regionalLocationNameService.applyToFloor(this.selectedFloorId, this.floorDetails[this.selectedFloorId]).finally(() => {
            this.loadBlockFloors();
          });
        });
      }
    }
  }

  ngOnInit(): void {
    if(localStorage.hasOwnProperty('tm_mapViewMode')) {
      localStorage.removeItem('tm_mapViewMode');
    }
    // Start preference fetch immediately and capture the promise so downstream
    // steps can wait for it without blocking each other.
    this.userPreferencesReady = this.loadUserPreferences();
    this.loadMapConfig();
    this.getBlockWithFloor();
    setTimeout(() => {
      // Scene / renderer setup does not depend on saved preferences — runs at 2 s as before.
      void this.readerService.loadReaders();
      this.initScene();
      this.initEnvironment();
      this.setupInteraction();
      this.applyPanOnlyModeLimits();
      this.connectMqtt();
      // loadSettings() reads savedMapState for every toggle/color/mode — must wait for
      // preferences. If the API is slower than 2 s the .then() fires when it resolves;
      // if it already resolved the .then() fires on the next microtask tick.
      this.userPreferencesReady.then(() => {
        this.loadSettings();
        this.updateWallColors();
        if (this.pendingFloorLoad) {
          this.loadBlockFloors();
        }
      });
    }, 2000);
  }
  private loadUserPreferences(): Promise<void> {
    return new Promise<void>(resolve => {
      // 3 s hard timeout — never block the map if the preferences API is slow or down
      const fallback = setTimeout(resolve, 3000);
      const userId = localStorage.getItem(btoa('userId'));
      const roleId = localStorage.getItem('userlevel');
      const obs = this.commonService.getPreference(userId, roleId);
      if (!obs) { clearTimeout(fallback); resolve(); return; }
      obs.subscribe({
        next: res => {
          clearTimeout(fallback);
          if (res?.results?.tm_map_viewer_state) {
            try {
              this.savedMapState = JSON.parse(res.results.tm_map_viewer_state.value);
            } catch (e) {
              this.savedMapState = null;
            }
          }
          resolve();
        },
        error: () => { clearTimeout(fallback); resolve(); }
      });
    });
  }

  private loadMapConfig(): void {
    this.commonService.getConfigFile('map-config').subscribe(res => {
      if (res?.results) {
        this.mapConfigRecord = res.results;
        this.mapConfigId = res.results.ids ?? null;
      }
      if (res?.results?.contentObject) {
        const cfg = res.results.contentObject;
        const catColors: { [catId: string]: string } = cfg.categoryColors && typeof cfg.categoryColors === 'object' && !Array.isArray(cfg.categoryColors) ? { ...cfg.categoryColors } : {};
        const catIcons: { [catId: string]: string } = cfg.categoryIcons && typeof cfg.categoryIcons === 'object' && !Array.isArray(cfg.categoryIcons) ? { ...cfg.categoryIcons } : {};
        if (cfg.iconByCat && typeof cfg.iconByCat === 'object' && !Array.isArray(cfg.iconByCat)) {
          for (const catId of Object.keys(cfg.iconByCat)) {
            const entry = cfg.iconByCat[catId];
            if (entry?.color) catColors[catId] = entry.color;
            if (entry?.icon) catIcons[catId] = entry.icon;
          }
        }
        this.mapConfig = {
          skipLocByCat: Array.isArray(cfg.skipLocByCat) ? cfg.skipLocByCat : [],
          skipLocCatByCat: Array.isArray(cfg.skipLocCatByCat) ? cfg.skipLocCatByCat : [],
          skipLocNameByCat: Array.isArray(cfg.skipLocNameByCat) ? cfg.skipLocNameByCat : [],
          threeDFloorByCat: Array.isArray(cfg['threeDFloorByCat']) ? cfg['threeDFloorByCat'] : [],
          threeDHeight: (cfg.threeDHeight ?? cfg.threeDheight) && typeof (cfg.threeDHeight ?? cfg.threeDheight) === 'object' ? (cfg.threeDHeight ?? cfg.threeDheight) : undefined,
          categoryColors: Object.keys(catColors).length > 0 ? catColors : undefined,
          categoryIcons: Object.keys(catIcons).length > 0 ? catIcons : undefined,
          floorDefaults: cfg.floorDefaults && typeof cfg.floorDefaults === 'object' && !Array.isArray(cfg.floorDefaults) ? cfg.floorDefaults : {},
          mapTileType: typeof cfg.mapTileType === 'string' ? cfg.mapTileType : 'osm'
        };
      }
    });
  }

  getFloorNode(floorId) {
    if(this.allNodes.hasOwnProperty(floorId) == false) {
      this.hospitalService.getNodePoints(floorId).subscribe(res => {
        this.allNodes[floorId] = res.results;
      });
    }
  }
  getBlockWithFloor() {
    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if(res.statusCode == 1) {
        // Wait for preferences before deciding which floor to load so savedMapState
        // is guaranteed to be populated (or null on error/timeout) first.
        this.userPreferencesReady.then(() => {
          this.blockWithFloorList = res.results.filter((val: any) => val.hasOwnProperty('children'));

          let initialFloor = null;
          const targetFloorId = this.initialFloorId || this.savedMapState?.floorId;
          if (targetFloorId) {
            for (const block of this.blockWithFloorList as any[]) {
              const floor = (block.children || []).find((f: any) => f.id === targetFloorId);
              if (floor) { initialFloor = floor; break; }
            }
          }
          if (!initialFloor && this.blockWithFloorList.length && (this.blockWithFloorList[0] as any)['children'].length) {
            initialFloor = (this.blockWithFloorList[0] as any)['children'][0];
          }
          if (initialFloor) {
            this.getfloorDetails(initialFloor);
          }
        });
      }
    });
  }
  getfloorDetails(floorData) {
    this.getFloorNode(floorData.id)
    if(!this.floorDetails.hasOwnProperty(floorData.id)) {
      this.hospitalService.getLogicalLocationWithChildren(floorData.id).subscribe(res => {
        this.floorDetails[floorData.id] = res.results;
        this.regionalLocationNameService.applyToFloor(floorData.id, this.floorDetails[floorData.id]).finally(() => {
          this.selectedFloorId = floorData.id;
          this.loadMap();
        });
      })
    }
  }

  ngAfterViewInit(): void {
    // this.loadMap()
  }
  loadMap() {
    this.initializeData();
    this.animationService.startAnimation(() => this.animate());
    window.addEventListener('resize', () => this.onResize());
  }

  private async initializeData(): Promise<void> {
    this.isLoading = true;
    try {
      // const [blockRes, layoutRes] = await Promise.all([
      //   fetch('assets/three-js/block_with_floor.json'),
      //   fetch('assets/three-js/floor_list.json')
      //   /* JSON to API Migration Example:
      //   fetch('https://your-api.com/api/v1/blocks'),
      //   fetch('https://your-api.com/api/v1/floors')
      //   */
      // ]);

      // if (!blockRes.ok || !layoutRes.ok) throw new Error('Error loading map data');

      // this.blocks = await blockRes.json();
      // this.floorLayouts = await layoutRes.json();

      const [blocks, layouts] = await Promise.all([
        Promise.resolve(this.blockWithFloorList),
        Promise.resolve(this.floorDetails)
      ]);

      this.blocks = blocks.filter((b: any) => b.name?.toLowerCase() !== 'outdoor');
      this.floorLayouts = layouts;

      // Extract the outdoor block data to load in the background
      this.outdoorBlock = blocks.find((b: any) => b.name?.toLowerCase() === 'outdoor');
      if (this.outdoorBlock && this.outdoorBlock.children?.length > 0) {
        this.outdoorFloorId = this.outdoorBlock.children[0].id;
        // Pre-fetch outdoor floor location details if not already cached
        if (!this.floorDetails.hasOwnProperty(this.outdoorFloorId)) {
          this.hospitalService.getLogicalLocationWithChildren(this.outdoorFloorId).subscribe(res => {
            this.floorDetails[this.outdoorFloorId] = res.results;
            this.regionalLocationNameService.applyToFloor(this.outdoorFloorId, this.floorDetails[this.outdoorFloorId]);
            this.buildOutdoorMap();
          });
        } else {
          this.buildOutdoorMap();
        }
        this.getFloorNode(this.outdoorFloorId);
      }

      if (this.initialFloorId) {
        // Find block that contains this floor
        let targetBlock = null;
        let targetFloor = null;

        for (const block of this.blocks) {
          const floor = (block.children || []).find((f: any) => f.id === this.initialFloorId);
          if (floor) {
            targetBlock = block;
            targetFloor = floor;
            break;
          }
        }

        if (targetBlock && targetFloor) {
          this.selectedBlockId = targetBlock.id;
          this.selectedBlock = targetBlock;
          this.filteredFloors = targetBlock.children || [];
          this.selectedFloor = targetFloor;
          this.selectedFloorId = targetFloor.id;
          const index = this.filteredFloors.indexOf(targetFloor);
          this.selectedLevel = index + 1;
          this.loadBlockFloors();
          return;
        }
      }

      if (this.blocks.length > 0) {
        // Restore saved block/floor, fall back to Block A
        if (this.savedMapState?.blockId) {
          const savedBlock = this.blocks.find((b: any) => b.id === this.savedMapState.blockId);
          if (savedBlock) {
            this.selectedBlockId = savedBlock.id;
            this.selectedBlock = savedBlock;
            this.filteredFloors = savedBlock.children || [];
            const savedFloor = this.filteredFloors.find((f: any) => f.id === this.savedMapState.floorId);
            if (savedFloor) {
              this.selectedFloor = savedFloor;
              this.selectedFloorId = savedFloor.id;
              this.selectedLevel = this.filteredFloors.indexOf(savedFloor) + 1;
              this.loadBlockFloors();
              return;
            }
          }
        }
        const blockA = this.blocks.find(b => b.name === 'Block A') || this.blocks[0];
        this.selectedBlockId = blockA.id;
        this.onBlockChange();
      }
    } catch (error) {
      console.error('Error initializing map data:', error);
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.saveMapViewerState();
    if (this.actionLoaderTimer) clearTimeout(this.actionLoaderTimer);
    this.animationService.stopAnimation();
    if (this.scene) {
      this.cleanupService.clearMapObjects(this.scene);
    }
    if (this.controls) {
      try {
        this.controls.dispose();
      } catch (e) {
        console.warn('Controls dispose failed:', e);
      }
    }
    this.rendererService.dispose();
    if (this.mqttSubscription) {
      this.mqttSubscription.unsubscribe();
    }
    this.mqttService.disconnect();
  }

  private initScene(): void {
    const w = this.container.nativeElement.clientWidth;
    const h = this.container.nativeElement.clientHeight;

    this.scene = this.sceneService.initScene();
    this.camera = this.cameraService.initCamera(w, h);
    this.renderer = this.rendererService.initRenderer(w, h);
    this.container.nativeElement.appendChild(this.renderer.domElement);

    this.controls = this.controlsService.initControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = this.isRotateMode;
    this.applyPerspectiveLockLimits();

    this.clusterGroup.name = 'cluster-group';
    this.scene.add(this.clusterGroup);
  }


  private async loadNavigationNodes(): Promise<void> {
    try {
      this.navNodes = this.allNodes[this.selectedFloorId!] || [];
      if (this.navNodes.length === 0) {
        console.warn('No navigation nodes found in JSON.');
        return;
      }

      this.nodeNavigationGraph = this.navigationService.constructNodeGraph(this.navNodes);

      // Cleanup previous graph — it lives inside buildingGroup (or scene as fallback)
      if (this.graphGroup) {
        const graphParent = this.graphGroup.parent ?? this.scene;
        this.cleanupService.disposeGroup(this.graphGroup, graphParent as THREE.Scene);
        this.graphGroup = null;
      }

      const floorY = this.activeFloorIndex * (this.showLevels ? FLOOR_STACK_HEIGHT : 0);

      // Graph must live inside buildingGroup so the geo-alignment transforms (rotation,
      // scale, position) are inherited automatically.  Pass baseFloorCenter as the offset
      // so node coordinates are centred the same way room polygon vertices are centred.
      const graphParent: THREE.Object3D = this.buildingGroup ?? this.scene;
      // When geo-aligned, room polygons are shifted by -rawCenter so nodes must also subtract rawCenter.
      // When not geo-aligned, rooms are at raw coords so nodes also use raw coords (offset = 0).
      const graphXOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
      const graphZOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
      console.log('[NAV-GRAPH-DEBUG] hasGeoAlign:', this.floorHasGeoAlign, '| rawCenter:', this.rawFloorCenter.x, this.rawFloorCenter.y, '| graphOffset:', graphXOff, graphZOff);
      console.log('[NAV-GRAPH-DEBUG] first 3 nodes:', this.navNodes.slice(0, 3).map(n => ({ id: n.id, x: n.x, y: n.y })));
      this.graphGroup = this.routeVisualizationService.visualizeGraph(
        this.navNodes,
        graphParent,
        floorY,
        graphXOff,
        graphZOff
      );
      if (this.graphGroup) {
        this.graphGroup.visible = this.isGraphVisible;
      }
    } catch (error) {
      console.error('Error loading navigation nodes:', error);
    }
  }

  private clearCurrentFloor(): void {
    this.blockLabelSprite = null; // child of buildingGroup, disposed with it below
    if (this.buildingGroup) {
      this.cleanupService.disposeGroup(this.buildingGroup, this.scene);
      this.buildingGroup = null;
      this.floorGroups = [];
      this.roomMeshesByFloor = [];
      this.readerSpritesByFloor = [];
    }

    // Surroundings is added directly to scene (not buildingGroup), so clean up separately
    if (this.surroundingsGroup) {
      this.cleanupService.disposeGroup(this.surroundingsGroup, this.scene);
      this.surroundingsGroup = null;
    }

    if (this.secondaryBuildingGroup) {
      this.cleanupService.disposeGroup(this.secondaryBuildingGroup, this.scene);
      this.secondaryBuildingGroup = null;
      this.secondaryFloorGroups = [];
      this.secondaryRoomMeshesByFloor = [];
    }

    if (this.outdoorGroup) {
      this.cleanupService.disposeGroup(this.outdoorGroup, this.scene);
      this.outdoorGroup = null;
      this.outdoorRoomMeshes = [];
    }
    this.lastBuildingOpacity = null;

    // Clear rooms
    this.roomMeshes.forEach(room => {
      if (room.floor) this.scene.remove(room.floor);
      if (room.walls) room.walls.forEach(wall => this.scene.remove(wall));
      if (room.label) this.scene.remove(room.label);
      if (room.labelIcon) this.scene.remove(room.labelIcon);
    });
    this.roomMeshes = [];

    // Clear route and person
    this.clearRoute();

    // Clear reader sprites
    this.readerSprites = [];
    this.readerSpritesByFloor = [];
    this.floorImageMeshes = [];
    this.foundationMeshes = [];
    this.doorMeshes = [];

    // MQTT markers live inside buildingGroup (disposed above), so just clear the maps.
    this.markers.clear();
    this.markerTargets.clear();
  }

  public async toggleGraph(): Promise<void> {
    this.isGraphVisible = !this.isGraphVisible;
    this.navNodes = this.allNodes[this.selectedFloorId] || [];
    if (this.isGraphVisible && this.navNodes.length !== 0) {
      console.log('floor node length: ', this.navNodes.length)
      await this.loadNavigationNodes();
    }

    if (this.graphGroup) {
      this.graphGroup.visible = this.isGraphVisible;
    }
    this.saveMapViewerState();
  }

  public isValidNodeRoom(locationId: number): boolean {
    // if (!this.isFirstFloor) return true; // Fallback for other floors if any
    return this.navNodes.some(n => n.type === 'NT-RN' && n.location_id === locationId);
  }

  onBlockSelect(block: any): void {
    if (block?.id === this.selectedBlockId) return;
    this.selectedBlockId = block.id;
    this.blockChanged.emit(block.id);
    this.onBlockChange();
  }

  onFloorSelect(floor: any): void {
    if (floor?.id === this.selectedFloorId) return;
    this.selectedFloorId = floor.id;
    this.selectedFloor = floor;
    this.floorChanged.emit(floor.id);
    this.onFloorChange();
  }

  onBlockChange(event?: Event): void {
    if (event) {
      const select = event.target as HTMLSelectElement;
      this.selectedBlockId = Number(select.value);
    }

    this.isLoading = true;
    this.noDataFound = false;
    this.selectedBlock = this.blocks.find(b => b.id === this.selectedBlockId);
    if (this.selectedBlock) {
      this.filteredFloors = this.selectedBlock.children || [];
      if (this.filteredFloors.length > 0) {
        this.selectedFloor = this.filteredFloors[0];
        this.selectedFloorId = this.selectedFloor.id;
        this.onFloorChange();
      } else {
        this.filteredFloors = [];
        this.selectedFloor = null;
        this.selectedFloorId = null;
        this.isLoading = false;
        this.clearMapObjects();
        this.noDataFound = true;
      }
    } else {
      this.isLoading = false;
    }
  }

  resetToDefaultBlock(): void {
    if (this.blocks.length > 0) {
      const blockA = this.blocks.find(b => b.name === 'Block A') || this.blocks[0];
      this.selectedBlockId = blockA.id;
      this.onBlockChange();
    }
  }

  onFloorChange(event?: Event): void {
    if (event) {
      const select = event.target as HTMLSelectElement;
      this.selectedFloorId = Number(select.value);
      this.selectedFloor = this.filteredFloors.find(f => f.id === this.selectedFloorId);
    }

    if (this.selectedFloor) {
      this.isLoading = true;
      this.noDataFound = false;
      this.getFloorNode(this.selectedFloorId)
      if (this.floorDetails.hasOwnProperty(this.selectedFloorId)) {
        const index = this.filteredFloors.indexOf(this.selectedFloor);
        this.selectedLevel = index + 1;
        this.regionalLocationNameService.applyToFloor(this.selectedFloorId, this.floorDetails[this.selectedFloorId]).finally(() => this.loadBlockFloors());
      } else {
        this.hospitalService.getLogicalLocationWithChildren(this.selectedFloorId).subscribe(res => {
          this.floorDetails[this.selectedFloorId] = res.results;
          this.regionalLocationNameService.applyToFloor(this.selectedFloorId, this.floorDetails[this.selectedFloorId]).finally(() => {
            this.selectedFloorId = this.selectedFloorId;
            const index = this.filteredFloors.indexOf(this.selectedFloor);
            this.selectedLevel = index + 1;
            this.loadBlockFloors();
          });
        })
      }
    }
  }

  private async loadBlockFloors(): Promise<void> {
    if (!this.selectedBlock || !this.selectedFloor) return;

    if (!this.scene) {
      this.pendingFloorLoad = true;
      return;
    }
    this.pendingFloorLoad = false;

    this.isLoading = true;
    this.noDataFound = false;

    // Identify if First Floor is selected for pathfinding logic
    const isFirstFloorSelected = this.selectedFloorId === 22484 ||
      this.selectedFloor.name?.toLowerCase().includes('first floor');

    try {
      await this.readerService.loadReaders();
      // Clear previous buildings
      this.clearCurrentFloor();

      // Pre-fetch nav nodes so they are ready; graph is built AFTER the floor loop
      // once buildingGroup and baseFloorCenter are both initialised.
      this.navNodes = this.allNodes[this.selectedFloorId!] || [];

      this.buildingGroup = new THREE.Group();
      this.buildingGroup.name = 'primary-building-root';
      this.floorGroups = [];
      this.roomMeshesByFloor = [];
      this.readerSpritesByFloor = [];
      this.scene.add(this.buildingGroup);

      let maxFloorSize = 0;
      let hasAnyData = false;
      let baseGeoRotationY = 0;
      let baseGeoCenterX = 0, baseGeoCenterZ = 0;
      let baseGeoScaleX = 1, baseGeoScaleZ = 1;
      const topIndex = this.activeFloorIndex;

      // Tracks GF rawCenter so upper floors use the same XZ centering offset.
      let stackBaseRawCenter: [number, number] | null = null;

      // Check if selected floor has geo alignment / set points
      const selectedFloorLayout = this.selectedFloor ? this.floorLayouts[this.selectedFloor.id] : null;
      const baseFloorHasSetPoints = this.floorPlanService.hasGeoAlignment(selectedFloorLayout);

      // Render floors from index 0 up to selected index
      for (let i = 0; i <= topIndex; i++) {
        const isCurrentActive = i === topIndex;

        // If Show Levels is OFF, we only render the active floor to save resources and maintain Ground level
        if (!this.showLevels && !isCurrentActive) {
          this.floorGroups.push(new THREE.Group());
          this.roomMeshesByFloor.push([]);
          this.readerSpritesByFloor.push([]);
          continue;
        }

        const floor = this.filteredFloors[i];
        const layout = this.floorLayouts[floor.id];
        const floorGroup = new THREE.Group();

        // yOffset is 0 if levels are hidden, otherwise it's the stack height
        const yOffset = this.showLevels ? (i * FLOOR_STACK_HEIGHT) : 0;
        const includeImage = true;

        // In stacked view, only the bottom floor (i=0) gets OSM/Foundation.
        // In single floor view, the active floor acts as the base.
        const isBaseFloor = this.showLevels ? (i === 0) : true;

        // Non-base floors in stacked view are built with isMainBuilding=false, so
        // buildFloorPlan skips the geo-align centering (hasGeoAlign stays false).
        // We must manually apply the same XZ offset that GF uses so all levels
        // share a common local origin inside buildingGroup.
        const stackXOff = (this.showLevels && !isBaseFloor && stackBaseRawCenter)
          ? -stackBaseRawCenter[0] : 0;
        const stackZOff = (this.showLevels && !isBaseFloor && stackBaseRawCenter)
          ? -stackBaseRawCenter[1] : 0;

        if (layout) {
          // Restore OSM surroundings (true) as global context outside the green plain
          const result = this.floorPlanService.buildFloorPlan(
            layout,
            floorGroup,
            stackXOff,
            stackZOff,
            yOffset,
            includeImage,
            isBaseFloor,
            isBaseFloor && (baseFloorHasSetPoints || !this.outdoorFloorId),
            this.foundationColor,
            this.wallWidth,
            this.wallHeight,
            this.labelHeight,
            this.labelScale,
            this.showCorridorWalls,
            this.mapConfig
          );
          this.floorGroups.push(floorGroup);
          this.roomMeshesByFloor.push(result.roomMeshes);

          if (result.surroundingsMesh) {
            this.surroundingsGroup = result.surroundingsMesh;
            // Add OSM tiles directly to scene — NOT to buildingGroup — so rotating the building group
            // for geo polygon alignment doesn't affect the underlying map tiles
            this.scene.add(this.surroundingsGroup);
            this.applyGeoPolygonVisibility();
          }

          // Compute the same XZ offset that room meshes used on this floor so
          // reader sprites land at the correct position inside buildingGroup.
          const readerXOff = isBaseFloor
            ? (result.hasGeoAlign ? -result.rawCenter[0] : 0)
            : stackXOff;
          const readerZOff = isBaseFloor
            ? (result.hasGeoAlign ? -result.rawCenter[1] : 0)
            : stackZOff;

          // Add readers for this floor
          const floorReaders = this.readerService.createReadersForFloor(floor.id, floorGroup, yOffset, readerXOff, readerZOff);
          this.readerSprites.push(...floorReaders);
          this.readerSpritesByFloor.push(floorReaders);

          maxFloorSize = Math.max(maxFloorSize, result.floorSize);
          hasAnyData = true;

          if (isBaseFloor) {
            this.baseFloorCenter.set(result.center[0], result.center[1]);
            this.rawFloorCenter.set(result.rawCenter[0], result.rawCenter[1]);
            this.floorHasGeoAlign = result.hasGeoAlign;
            // Capture GF raw center so upper floors can apply the same offset.
            stackBaseRawCenter = result.rawCenter;
            this.floorWidth = result.floorWidth;
            this.floorHeight = result.floorHeight;
            if (result.geoRotationY !== 0) {
              baseGeoRotationY = result.geoRotationY;
              baseGeoCenterX = result.geoCenterX;
              baseGeoCenterZ = result.geoCenterZ;
              baseGeoScaleX = result.geoScaleX ?? 1;
              baseGeoScaleZ = result.geoScaleZ ?? 1;
            }
          }

          if (result.floorImageMesh) {
            this.floorImageMeshes.push(result.floorImageMesh);
            result.floorImageMesh.visible = this.showFloorImage;
          }

          if (result.foundationMesh) {
            this.foundationMeshes.push(result.foundationMesh);
            result.foundationMesh.visible = this.showFoundation;
          }

          result.doorMeshes.forEach(door => {
            door.visible = this.showDoors;
            this.doorMeshes.push(door);
          });

          result.roomMeshes.forEach(room => {
            room.floor.visible = this.showRooms;
            room.walls.forEach(wall => { wall.visible = this.showRoomWalls; });
          });
        } else {
          this.floorGroups.push(floorGroup);
          this.roomMeshesByFloor.push([]);
          this.readerSpritesByFloor.push([]);
          if (isCurrentActive) this.noDataFound = true;
        }
        this.buildingGroup.add(floorGroup);
      }

      if (!hasAnyData && topIndex >= 0) {
        this.noDataFound = true;
      }

      // Apply geo polygon alignment to building content (OSM tiles are in scene directly, unaffected)
      // Rooms are centered at local origin; buildingGroup.position places them at the geo polygon center.
      // buildingGroup.rotation.y rotates in-place before the translation is applied.
      if (this.floorHasGeoAlign) {
        this.buildingGroup.position.set(baseGeoCenterX, 0, baseGeoCenterZ);
        this.buildingGroup.rotation.y = baseGeoRotationY;
        this.buildingGroup.scale.set(baseGeoScaleX, 1, baseGeoScaleZ);
      }

      // Build the navigation graph now that buildingGroup and baseFloorCenter are ready.
      // The graph is added inside buildingGroup so it inherits geo-alignment transforms,
      // and baseFloorCenter is used as the offset so node coords match room polygon coords.
      await this.loadNavigationNodes();

      // Final Setup
      this.floorSize = maxFloorSize || 200;
      this.roomMeshes = this.getActiveRoomMeshes();
      this.isFirstFloor = isFirstFloorSelected;

      // Reset path nodes if not on first floor
      if (false && !this.isFirstFloor) {
        this.navNodes = [];
        this.nodeNavigationGraph.clear();
        if (this.graphGroup) {
          this.scene.remove(this.graphGroup);
          this.graphGroup = null;
        }
      }

      // Update camera distance limits
      this.controlsService.updateDistanceLimits(
        this.floorSize * FLOOR_MAX_DISTANCE_MULTIPLIER * 2,
        Math.min(this.floorSize * FLOOR_MIN_DISTANCE_MULTIPLIER, FLOOR_MIN_DISTANCE_ABSOLUTE)
      );

      this.navigationGraph = this.navigationService.constructNavigationGraph(
        this.getActiveRoomMeshes(),
        (room: RoomMesh) => this.floorPlanService.getRoomCenter(room)
      );

      this.updateVisibleFloors();
      this.applyFloorDimming();
      this.updateLabelVisibility();

      // Focus on the Primary building
      this.cameraAnimationService.focusOnFloor(this.getActiveRoomMeshes(), this.camera, this.controls, 1, () => this.updateLabelVisibility());
      this.shiftCameraToActiveFloorPreservingOffset();
      setTimeout(() => { if (!this.applySavedCameraState()) { this.applyFloorDefaultCamera(); } }, 700);

      this.blockLabelSprite = null;
      this.buildOutdoorMap();

      this.initEnvironment();
      this.updateMapView(); // Apply initial view mode
      this.updateWallColors();
      this.applyWireframe();
      this.isLoading = false;
      this.refreshQaCategories();
    } catch (error) {
      console.error('Error loading block floors:', error);
      this.isLoading = false;
    }
  }

  private buildOutdoorMap(): void {
    if (this.outdoorGroup) return; // already built

    if (this.outdoorFloorId && this.floorLayouts[this.outdoorFloorId]) {
      const selectedFloorLayout = this.selectedFloor ? this.floorLayouts[this.selectedFloor.id] : null;
      const baseFloorHasSetPoints = this.floorPlanService.hasGeoAlignment(selectedFloorLayout);

      const outdoorLayout = this.floorLayouts[this.outdoorFloorId];
      this.outdoorGroup = new THREE.Group();
      this.outdoorGroup.name = 'outdoor-building-root';
      this.scene.add(this.outdoorGroup);

      const outdoorFloorGroup = new THREE.Group();
      const outdoorResult = this.floorPlanService.buildFloorPlan(
        outdoorLayout,
        outdoorFloorGroup,
        0, // stackXOff
        0, // stackZOff
        0, // yOffset
        true, // includeImage
        true, // isBaseFloor
        this.showSurroundings && !baseFloorHasSetPoints, // includeSurroundings
        this.foundationColor,
        this.wallWidth,
        this.wallHeight,
        this.labelHeight,
        this.labelScale,
        this.showCorridorWalls,
        this.mapConfig
      );
      this.outdoorGroup.add(outdoorFloorGroup);
      this.outdoorRoomMeshes = outdoorResult.roomMeshes;

      if (outdoorResult.surroundingsMesh) {
        if (this.surroundingsGroup) {
          this.cleanupService.disposeGroup(this.surroundingsGroup, this.scene);
        }
        this.surroundingsGroup = outdoorResult.surroundingsMesh;
        this.scene.add(this.surroundingsGroup);
        this.applyGeoPolygonVisibility();
      }

      if (outdoorResult.geoRotationY !== 0) {
        this.outdoorGroup.position.set(outdoorResult.geoCenterX, 0, outdoorResult.geoCenterZ);
        this.outdoorGroup.rotation.y = outdoorResult.geoRotationY;
        this.outdoorGroup.scale.set(outdoorResult.geoScaleX ?? 1, 1, outdoorResult.geoScaleZ ?? 1);
      }

      // Sync visibility configurations on outdoor meshes
      this.outdoorRoomMeshes.forEach(room => {
        room.floor.visible = this.showRooms;
        room.walls.forEach(wall => { wall.visible = this.showRoomWalls; });
      });

      this.applyWireframe();
      if (this.outdoorGroup) {
        this.outdoorGroup.visible = this.zoomValue < 60;
      }
    }
  }

  private applyGroupOpacity(group: THREE.Group | null, opacity: number): void {
    if (!group) return;
    group.traverse((object) => {
      const anyObj = object as any;
      if (anyObj.isMesh || anyObj.isSprite) {
        if (anyObj.material) {
          this.applyMaterialOpacity(anyObj.material, opacity);
        }
      }
    });
  }

  private applyMaterialOpacity(
    materialOrArray: THREE.Material | THREE.Material[],
    opacityFactor: number
  ): void {
    if (Array.isArray(materialOrArray)) {
      materialOrArray.forEach(m => this.applyMaterialOpacity(m, opacityFactor));
      return;
    }

    const material = materialOrArray;

    if (!this.originalMaterialState.has(material)) {
      const anyMat = material as any;
      this.originalMaterialState.set(material, {
        color: anyMat.color?.clone?.(),
        opacity: typeof anyMat.opacity === 'number' ? anyMat.opacity : 1.0,
        transparent: typeof anyMat.transparent === 'boolean' ? anyMat.transparent : false
      });
    }

    const original = this.originalMaterialState.get(material)!;
    const anyMat = material as any;

    const targetOpacity = (original.opacity !== undefined ? original.opacity : 1.0) * opacityFactor;
    anyMat.opacity = targetOpacity;
    anyMat.transparent = targetOpacity < 1.0 || (original.transparent || false);
    anyMat.needsUpdate = true;
  }

  onLevelChange(event: Event): void {
    // Replaced by onFloorChange logic, but kept for compatibility if needed.
    // For this upgrade, Level dropdown is replaced by Block dropdown.
  }

  private shiftCameraToActiveFloorPreservingOffset(): void {
    const startTarget = this.controls.target.clone();
    const startCam = this.camera.position.clone();

    // Pure "elevator" shift: keep X/Z view identical and only move camera+target vertically
    const desiredTargetY = this.activeFloorIndex * FLOOR_STACK_HEIGHT;
    const deltaY = desiredTargetY - startTarget.y;

    const newTarget = startTarget.clone().add(new THREE.Vector3(0, deltaY, 0));
    const targetCam = startCam.clone().add(new THREE.Vector3(0, deltaY, 0));

    this.cameraAnimationService.animateCamera(
      this.camera,
      this.controls,
      startCam,
      targetCam,
      startTarget,
      newTarget,
      600,
      () => this.updateLabelVisibility()
    );
  }

  private updateVisibleFloors(): void {
    // Primary Building: respect selectedLevel
    for (let i = 0; i < this.floorGroups.length; i++) {
      this.floorGroups[i].visible = i < this.selectedLevel;
    }
    // Secondary Building: ALWAYS show Level 1 only
    for (let i = 0; i < this.secondaryFloorGroups.length; i++) {
      this.secondaryFloorGroups[i].visible = (i === 0);
    }
  }

  private applyFloorDimming(): void {
    // If Show Levels is OFF, we are only showing one floor at base level.
    // No need to dim floors as there is only one.
    if (!this.showLevels) {
      // Reset any previous dimming on the active meshes
      this.roomMeshes.forEach(room => {
        this.applyMaterialStyle(room.floor.material, 1, 1);
        room.walls.forEach(w => this.applyMaterialStyle(w.material, 1, 1));
      });
      return;
    }

    const activeIndex = this.activeFloorIndex;
    const dimColorFactor = 0.28;
    const dimOpacityFactor = 0.25;

    // Apply to Primary Building
    for (let floorIndex = 0; floorIndex < this.roomMeshesByFloor.length; floorIndex++) {
      if (floorIndex >= this.selectedLevel) continue;

      const isActive = floorIndex === activeIndex;
      const rooms = this.roomMeshesByFloor[floorIndex];
      const colorFactor = isActive ? 1 : dimColorFactor;
      const opacityFactor = isActive ? 1 : dimOpacityFactor;

      rooms.forEach(room => {
        this.applyMaterialStyle(room.floor.material, colorFactor, opacityFactor);
        room.walls.forEach(w => this.applyMaterialStyle(w.material, colorFactor, opacityFactor));
      });
    }

    // Apply to Secondary Building
    for (let floorIndex = 0; floorIndex < this.secondaryRoomMeshesByFloor.length; floorIndex++) {
      // Only Level 1 (index 0) is visible anyway
      if (floorIndex > 0) continue;

      const isActive = true; // Always active for the visible floor
      const rooms = this.secondaryRoomMeshesByFloor[floorIndex];
      const colorFactor = isActive ? 1 : dimColorFactor;
      const opacityFactor = isActive ? 1 : dimOpacityFactor;

      rooms.forEach(room => {
        this.applyMaterialStyle(room.floor.material, colorFactor, opacityFactor);
        room.walls.forEach(w => this.applyMaterialStyle(w.material, colorFactor, opacityFactor));
      });
    }
  }

  private applyMaterialStyle(
    materialOrArray: THREE.Material | THREE.Material[],
    colorFactor: number,
    opacityFactor: number
  ): void {
    if (Array.isArray(materialOrArray)) {
      materialOrArray.forEach(m => this.applyMaterialStyle(m, colorFactor, opacityFactor));
      return;
    }

    const material = materialOrArray;

    if (!this.originalMaterialState.has(material)) {
      const anyMat = material as any;
      this.originalMaterialState.set(material, {
        color: anyMat.color?.clone?.(),
        opacity: typeof anyMat.opacity === 'number' ? anyMat.opacity : undefined,
        transparent: typeof anyMat.transparent === 'boolean' ? anyMat.transparent : undefined
      });
    }

    const original = this.originalMaterialState.get(material)!;
    const anyMat = material as any;

    if (original.color && anyMat.color) {
      const dimMix = Math.max(0, Math.min(1, 1 - colorFactor));
      if (dimMix === 0) {
        anyMat.color.copy(original.color);
      } else {
        const hsl = { h: 0, s: 0, l: 0 };
        original.color.getHSL(hsl);

        // Keep hue but wash out the color (lower saturation) and slightly brighten it
        const dimmedColor = new THREE.Color().setHSL(
          hsl.h,
          hsl.s * 0.25,
          Math.min(1, hsl.l * 0.9 + 0.1)
        );

        anyMat.color.copy(original.color).lerp(dimmedColor, dimMix);
      }
    }

    if (typeof original.opacity === 'number') {
      anyMat.opacity = original.opacity * opacityFactor;
      if (opacityFactor < 1) {
        anyMat.transparent = true;
      } else if (typeof original.transparent === 'boolean') {
        anyMat.transparent = original.transparent;
      }
      anyMat.needsUpdate = true;
    }
  }

  private clearMapObjects(): void {
    this.cleanupService.clearMapObjects(this.scene);

    this.roomMeshes = [];
    this.hoveredRoom = null;
    this.selectedRoomMesh = null;
    this.selectedRoom = null;
    this.startRoom = null;
    this.endRoom = null;
    this.routeGroup = null;
    this.navigationGraph.clear();
    this.routeDistance = '';
    this.routeTime = '';

  }

  private setupInteraction(): void {
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    this.renderer.domElement.addEventListener('mousedown', (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.interactionService.updateMousePosition(event, rect);

      if (!this.isRotateMode) {
        // Left drag pans when 3D rotate is disabled
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      } else if (this.isEagleTopView) {
        // Eagle top view: only pan — no rotation or tilt
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      } else if (this.isPanOnlyMode) {
        // Pan-only mode: left drag = always pan; tilt is still available
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      } else {
        // Left drag rotates when 3D rotate is enabled
        this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      }
    });

    this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';

    this.controls.addEventListener('start', () => {
      this.renderer.domElement.style.cursor = 'grabbing';
    });
    this.controls.addEventListener('end', () => {
      this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
    });

    this.controls.addEventListener('change', () => {
      this.activeReader = null; // Hide reader tooltip on any camera change (zoom, rotate, pan)
      this.updateLabelVisibility();
    });
  }

  private updateLabelVisibility(): void {
    // Hide all labels initially (Primary)
    this.roomMeshesByFloor.forEach(floorRooms => {
      floorRooms.forEach(room => {
        if (room.label) room.label.visible = false;
        if (room.labelIcon) room.labelIcon.visible = false;
      });
    });

    // Hide all labels initially (Secondary)
    this.secondaryRoomMeshesByFloor.forEach(floorRooms => {
      floorRooms.forEach(room => {
        if (room.label) room.label.visible = false;
        if (room.labelIcon) room.labelIcon.visible = false;
      });
    });

    // Hide all labels initially (Outdoor)
    this.outdoorRoomMeshes.forEach(room => {
      if (room.label) room.label.visible = false;
      if (room.labelIcon) room.labelIcon.visible = false;
    });

    // Hide all readers initially
    this.readerSprites.forEach(sprite => sprite.visible = false);

    const ZOOM_FADE_START = 55;
    const ZOOM_FADE_END = 75;

    let buildingOpacity = 1.0;
    let outdoorOpacity = 0.0;
    let isZoomedOut = false;

    if (this.zoomValue >= ZOOM_FADE_END) {
      buildingOpacity = 1.0;
      outdoorOpacity = 0.0;
      isZoomedOut = false;
    } else if (this.zoomValue <= ZOOM_FADE_START) {
      buildingOpacity = 0.0;
      outdoorOpacity = 1.0;
      isZoomedOut = true;
    } else {
      buildingOpacity = (this.zoomValue - ZOOM_FADE_START) / (ZOOM_FADE_END - ZOOM_FADE_START);
      outdoorOpacity = 1.0 - buildingOpacity;
      isZoomedOut = this.zoomValue < 75; // midpoint threshold for label logic
    }

    // Lazy-build outdoor map if it becomes available late
    if (outdoorOpacity > 0.0 && !this.outdoorGroup) {
      this.buildOutdoorMap();
    }

    // Toggle Group Visibilities based on whether opacity is active
    if (this.outdoorGroup) {
      this.outdoorGroup.visible = outdoorOpacity > 0.0;
    }
    if (this.buildingGroup) {
      this.buildingGroup.visible = buildingOpacity > 0.0;
    }
    if (this.secondaryBuildingGroup) {
      this.secondaryBuildingGroup.visible = buildingOpacity > 0.0;
    }

    // Apply opacities to groups smoothly if updated
    if (buildingOpacity !== this.lastBuildingOpacity) {
      this.applyGroupOpacity(this.buildingGroup, buildingOpacity);
      this.applyGroupOpacity(this.secondaryBuildingGroup, buildingOpacity);
      this.applyGroupOpacity(this.outdoorGroup, outdoorOpacity);
      this.lastBuildingOpacity = buildingOpacity;
    }

    if (isZoomedOut) {
      // Zoomed out: Show outdoor labels only
      if (this.outdoorRoomMeshes.length > 0) {
        this.labelVisibilityService.updateLabelVisibility(
          this.outdoorRoomMeshes,
          this.camera,
          this.controls,
          this.floorSize,
          (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
          this.showLabels && this.showRooms,
          this.showIcons && this.showRooms,
          this.zoomValue
        );
      }
    } else {
      // Zoomed in: Show active floor labels for Primary & Secondary buildings
      const activeReaderSprites = this.readerSpritesByFloor[this.activeFloorIndex] ?? [];

      this.labelVisibilityService.updateLabelVisibility(
        this.getActiveRoomMeshes(),
        this.camera,
        this.controls,
        this.floorSize,
        (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
        this.showLabels && this.showRooms,
        this.showIcons && this.showRooms,
        this.zoomValue
      );

      // In stacked view, apply zoom-based icon visibility to lower floors
      if (this.showLevels) {
        for (let i = 0; i < this.activeFloorIndex; i++) {
          const lowerFloorRooms = this.roomMeshesByFloor[i] ?? [];
          if (lowerFloorRooms.length > 0) {
            this.labelVisibilityService.updateLabelVisibility(
              lowerFloorRooms,
              this.camera,
              this.controls,
              this.floorSize,
              (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
              false,
              this.showIcons,
              this.zoomValue
            );
          }
        }
      }

      // Update Reader Icon Visibility
      this.labelVisibilityService.updateSpriteVisibility(
        activeReaderSprites,
        this.camera,
        this.controls,
        this.floorSize,
        this.showReaders
      );
    }
  }

  // --- CONFIG / VISIBILITY CONTROLS ---

  private loadSettings(): void {
    this.showRooms = true;
    this.showLabels = true;
    this.showIcons = true;
    this.showReaders = true;
    this.canSelectRooms = false;
    this.showMqttMarkers = false;
    this.showLevels = false;
    this.showFloorImage = true;
    this.showFoundation = true;
    this.showCorridorWalls = false;
    this.showRoomWalls = false;
    this.showDoors = false;
    this.showGeoPolygon = true;
    this.isPerspectiveLock = true;
    this.isEagleTopView = false;
    this.isPanOnlyMode = false;
    this.showFog = false;
    this.showSurroundings = true;
    this.isWireframe = false;
    this.isGraphVisible = false;
    this.isRotateMode = false;
    this.wallColor = WALL_COLOR;
    this.tempWallColor = WALL_COLOR;
    this.wallWidth = WALL_THICKNESS;
    this.tempWallWidth = WALL_THICKNESS;
    this.wallHeight = WALL_HEIGHT;
    this.tempWallHeight = WALL_HEIGHT;
    this.labelHeight = LABEL_HEIGHT;
    this.tempLabelHeight = LABEL_HEIGHT;
    this.labelScale = 3.0;
    this.tempLabelScale = 3.0;
    this.foundationColor = '#ffffff';
    this.tempFoundationColor = '#ffffff';

    const s = this.savedMapState;
    if (s) {
      if (s.isQuickAccessConfigOn !== undefined) this.isQuickAccessConfigOn = s.isQuickAccessConfigOn;
      if (s.viewMode !== undefined) {
        this.viewMode = s.viewMode;
        this.isEagleTopView = this.viewMode === '2d';
      } else if (s.isEagleTopView !== undefined) {
        this.isEagleTopView = s.isEagleTopView;
        this.viewMode = this.isEagleTopView ? '2d' : '3d';
      }
      if (s.showRooms !== undefined) this.showRooms = s.showRooms;
      if (s.showLabels !== undefined) this.showLabels = s.showLabels;
      if (s.showIcons !== undefined) this.showIcons = s.showIcons;
      if (s.showReaders !== undefined) this.showReaders = s.showReaders;
      if (s.showMqttMarkers !== undefined) this.showMqttMarkers = s.showMqttMarkers;
      if (s.showLevels !== undefined) this.showLevels = s.showLevels;
      if (s.showFloorImage !== undefined) this.showFloorImage = s.showFloorImage;
      if (s.showFoundation !== undefined) this.showFoundation = s.showFoundation;
      if (s.showCorridorWalls !== undefined) this.showCorridorWalls = s.showCorridorWalls;
      if (s.showRoomWalls !== undefined) this.showRoomWalls = s.showRoomWalls;
      if (s.showDoors !== undefined) this.showDoors = s.showDoors;
      if (s.showGeoPolygon !== undefined) this.showGeoPolygon = s.showGeoPolygon;
      if (s.isPerspectiveLock !== undefined) this.isPerspectiveLock = s.isPerspectiveLock;
      if (s.isPanOnlyMode !== undefined) this.isPanOnlyMode = s.isPanOnlyMode;
      if (s.showFog !== undefined) this.showFog = s.showFog;
      if (s.showSurroundings !== undefined) this.showSurroundings = s.showSurroundings;
      if (s.wallColor) { this.wallColor = s.wallColor; this.tempWallColor = s.wallColor; }
      if (s.wallWidth !== undefined) { this.wallWidth = s.wallWidth; this.tempWallWidth = s.wallWidth; }
      if (s.wallHeight !== undefined) { this.wallHeight = s.wallHeight; this.tempWallHeight = s.wallHeight; }
      if (s.labelHeight !== undefined) { this.labelHeight = s.labelHeight; this.tempLabelHeight = s.labelHeight; }
      if (s.labelScale !== undefined) { this.labelScale = s.labelScale; this.tempLabelScale = s.labelScale; }
      if (s.foundationColor) { this.foundationColor = s.foundationColor; this.tempFoundationColor = s.foundationColor; }
      if (s.mapViewMode) {
        // Fallback from landscape mode to default (Standard) view
        this.mapViewMode = s.mapViewMode === 'landscape' ? 'default' : s.mapViewMode;
      }
      if (s.isWireframe !== undefined) this.isWireframe = s.isWireframe;
      if (s.isGraphVisible !== undefined) this.isGraphVisible = s.isGraphVisible;
      if (s.isRotateMode !== undefined) {
        this.isRotateMode = s.isRotateMode;
        if (this.controls) {
          this.controls.enableRotate = this.isRotateMode;
          this.controls.mouseButtons.LEFT = (this.isRotateMode && !this.isEagleTopView && !this.isPanOnlyMode)
            ? THREE.MOUSE.ROTATE
            : THREE.MOUSE.PAN;
          this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
        }
      }
      if (s.mapTileType !== undefined) {
        this.mapConfig.mapTileType = s.mapTileType;
      }
    }
    this.applyViewModeConstraints(false);
  }

  private getCameraState(): { distance: number; theta: number; phi: number } | null {
    if (!this.camera || !this.controls) return null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    return { distance: spherical.radius, theta: spherical.theta, phi: spherical.phi };
  }

  private applySavedCameraState(): boolean {
    if (!this.savedMapState?.camera) return false;
    const { distance, theta, phi } = this.savedMapState.camera;
    delete this.savedMapState.camera; // apply only once
    const clamped = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, distance));
    if (this.viewMode === '2d') {
      const target = this.controls.target.clone();
      this.camera.position.set(target.x, target.y + clamped, target.z);
    } else {
      const spherical = new THREE.Spherical(clamped, phi, theta);
      const offset = new THREE.Vector3().setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    this.controls.update();
    this.updateLabelVisibility();
    return true;
  }

  private applyFloorDefaultCamera(): void {
    if (!this.selectedFloorId || !this.mapConfig?.floorDefaults || !this.controls || !this.camera) return;
    const def = this.mapConfig.floorDefaults[String(this.selectedFloorId)];
    if (!def) return;
    const clamped = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, def.distance));
    if (this.viewMode === '2d') {
      const target = this.controls.target.clone();
      this.camera.position.set(target.x, target.y + clamped, target.z);
    } else {
      const spherical = new THREE.Spherical(clamped, def.phi, def.theta);
      const offset = new THREE.Vector3().setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    this.controls.update();
    this.updateLabelVisibility();
  }

  public saveFloorDefaultView(): void {
    if (!this.selectedFloorId || this.isFloorDefaultSaving) return;
    const cam = this.getCameraState();
    if (!cam) return;

    this.isFloorDefaultSaving = true;
    this.floorDefaultSaveStatus = '';

    const floorDefaults = { ...(this.mapConfig.floorDefaults || {}) };
    floorDefaults[String(this.selectedFloorId)] = { distance: cam.distance, theta: cam.theta, phi: cam.phi };

    const updatedContent = { ...(this.mapConfigRecord?.contentObject || {}), ...this.mapConfig, floorDefaults };
    let req;
    if(updatedContent) {
      
    if (this.mapConfigId) {
      req = this.commonService.updateConfigFile({
        id: 'map-config',
        ids: this.mapConfigRecord?.ids ?? null,
        comments: this.mapConfigRecord?.comments ?? null,
        contentData: updatedContent,
        facilityId: this.mapConfigRecord?.facilityId ?? null
      });
    } else {
      const facilityId = localStorage.getItem(btoa('facilityId'));
      req = this.commonService.saveConfigFile({ id: 'map-config', contentData: updatedContent, facilityId });
    }
    } else {  
      console.log('here')
      console.log(updatedContent)
      return
    }
    req.subscribe({
      next: (res: any) => {
        const newId = res?.results?.ids ?? res?.results?.id ?? null;
        if (!this.mapConfigId && newId) {
          this.mapConfigId = newId;
          this.mapConfigRecord = res.results;
        } else if (this.mapConfigRecord) {
          this.mapConfigRecord.contentObject = updatedContent;
        }
        this.mapConfig.floorDefaults = floorDefaults;
        this.floorDefaultSaveStatus = 'success';
        this.isFloorDefaultSaving = false;
        setTimeout(() => { this.floorDefaultSaveStatus = ''; }, 3000);
        this.clearAllCachesAfterSettingsSave();
      },
      error: () => {
        this.floorDefaultSaveStatus = 'error';
        this.isFloorDefaultSaving = false;
      }
    });
    
  }
  private clearAllCachesAfterSettingsSave(): void {
    this.commonService.clearcache({}).subscribe({
      error: err => console.warn('[IndoorPath] Failed to clear cache after settings save', err)
    });
  }

  public clearFloorDefault(): void {
    if (!this.selectedFloorId || this.isFloorDefaultSaving || !this.floorDefaultExists) return;

    this.isFloorDefaultSaving = true;
    this.floorDefaultSaveStatus = '';

    const floorDefaults = { ...(this.mapConfig.floorDefaults || {}) };
    delete floorDefaults[String(this.selectedFloorId)];

    const updatedContent = { ...(this.mapConfigRecord?.contentObject || {}), ...this.mapConfig, floorDefaults };

    this.commonService.updateConfigFile({
      id: this.mapConfigId,
      comments: this.mapConfigRecord?.comments ?? null,
      contentData: updatedContent,
      facilityId: this.mapConfigRecord?.facilityId ?? null
    }).subscribe({
      next: () => {
        this.mapConfig.floorDefaults = floorDefaults;
        if (this.mapConfigRecord) this.mapConfigRecord.contentObject = updatedContent;
        this.floorDefaultSaveStatus = 'success';
        this.isFloorDefaultSaving = false;
        setTimeout(() => { this.floorDefaultSaveStatus = ''; }, 3000);
      },
      error: () => {
        this.floorDefaultSaveStatus = 'error';
        this.isFloorDefaultSaving = false;
      }
    });
  }

  private saveMapViewerState(): void {
    const state = {
      blockId: this.selectedBlockId,
      floorId: this.selectedFloorId,
      wallColor: this.wallColor,
      wallWidth: this.wallWidth,
      wallHeight: this.wallHeight,
      labelHeight: this.labelHeight,
      labelScale: this.labelScale,
      foundationColor: this.foundationColor,
      mapViewMode: this.mapViewMode,
      showRooms: this.showRooms,
      showLabels: this.showLabels,
      showIcons: this.showIcons,
      showReaders: this.showReaders,
      showMqttMarkers: this.showMqttMarkers,
      showLevels: this.showLevels,
      showFloorImage: this.showFloorImage,
      showFoundation: this.showFoundation,
      showCorridorWalls: this.showCorridorWalls,
      showRoomWalls: this.showRoomWalls,
      showDoors: this.showDoors,
      showGeoPolygon: this.showGeoPolygon,
      isPerspectiveLock: this.isPerspectiveLock,
      isEagleTopView: this.isEagleTopView,
      viewMode: this.viewMode,
      isPanOnlyMode: this.isPanOnlyMode,
      showFog: this.showFog,
      showSurroundings: this.showSurroundings,
      mapTileType: this.mapConfig.mapTileType,
      isGraphVisible: this.isGraphVisible,
      isRotateMode: this.isRotateMode,
      isWireframe: this.isWireframe,
      isQuickAccessConfigOn: this.isQuickAccessConfigOn
    };
    this.commonService.validateUserPreference('tm_map_viewer_state', JSON.stringify(state));
  }

  private showActionLoader(): void {
    this.isActionLoading = true;
    if (this.actionLoaderTimer) clearTimeout(this.actionLoaderTimer);
    this.actionLoaderTimer = setTimeout(() => { this.isActionLoading = false; }, 600);
  }

  public toggleConfigMenu(): void {
    this.isConfigOpen = !this.isConfigOpen;
  }

  public toggleRooms(): void {
    this.showRooms = !this.showRooms;
    [this.roomMeshesByFloor, this.secondaryRoomMeshesByFloor].forEach(groupList => {
      groupList.forEach(floorRooms => {
        floorRooms.forEach(room => { room.floor.visible = this.showRooms; });
      });
    });
    this.updateLabelVisibility();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleLabels(): void {
    this.showLabels = !this.showLabels;
    this.updateLabelVisibility();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleIcons(): void {
    this.showIcons = !this.showIcons;
    this.updateLabelVisibility();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleReaders(): void {
    this.showReaders = !this.showReaders;
    this.updateLabelVisibility();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleRoomSelection(): void {
    this.canSelectRooms = !this.canSelectRooms;
    if (!this.canSelectRooms && this.selectedRoomMesh) {
      this.deselectRoom();
    }
    this.showActionLoader();
  }

  public toggleMqttMarkers(): void {
    this.showMqttMarkers = !this.showMqttMarkers;
    this.markers.forEach(m => m.visible = this.showMqttMarkers);
    this.clusterGroup.visible = this.showMqttMarkers;
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleShowLevels(): void {
    this.showLevels = !this.showLevels;
    this.loadBlockFloors();
    this.saveMapViewerState();
  }

  public toggleFloorImage(): void {
    this.showFloorImage = !this.showFloorImage;
    this.floorImageMeshes.forEach(mesh => {
      mesh.visible = this.showFloorImage;
    });
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleCorridorWalls(): void {
    this.showCorridorWalls = !this.showCorridorWalls;
    this.loadBlockFloors();
    this.saveMapViewerState();
  }

  public toggleRoomWalls(): void {
    this.showRoomWalls = !this.showRoomWalls;
    [this.roomMeshesByFloor, this.secondaryRoomMeshesByFloor].forEach(groupList => {
      groupList.forEach(floorRooms => {
        floorRooms.forEach(room => {
          room.walls.forEach(wall => { wall.visible = this.showRoomWalls; });
        });
      });
    });
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleDoors(): void {
    this.showDoors = !this.showDoors;
    this.doorMeshes.forEach(door => { door.visible = this.showDoors; });
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleGeoPolygon(): void {
    this.showGeoPolygon = !this.showGeoPolygon;
    this.applyGeoPolygonVisibility();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleSurroundings(): void {
    this.showSurroundings = !this.showSurroundings;
    this.updateMapView();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleFog(): void {
    this.showFog = !this.showFog;
    this.scene.fog = this.showFog ? new THREE.Fog(0xf8fafc, 300, 1200) : null;
    this.saveMapViewerState();
    this.showActionLoader();
  }

  private applyGeoPolygonVisibility(): void {
    if (!this.surroundingsGroup) return;
    this.surroundingsGroup.traverse((obj: any) => {
      if (obj.name === 'floor-geo-polygon-outline' || obj.name === 'floor-geo-polygon-fill') {
        obj.visible = this.showGeoPolygon;
      }
    });
  }

  public toggleFoundation(): void {
    this.showFoundation = !this.showFoundation;
    this.foundationMeshes.forEach(mesh => {
      mesh.visible = this.showFoundation;
    });
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public togglePerspectiveLock(): void {
    this.isPerspectiveLock = !this.isPerspectiveLock;
    this.applyPerspectiveLockLimits();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  private applyPerspectiveLockLimits(): void {
    if (!this.controls) return;
    if (this.viewMode === '2d' || this.isEagleTopView) {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.update();
      return;
    }
    const min = 0;
    const max = this.isPerspectiveLock || this.showLevels ? Math.PI / 3 : Math.PI / 2;
    this.controls.minPolarAngle = min;
    this.controls.maxPolarAngle = max;
    this.controls.update();
  }

  public onViewModeChange(mode: '2d' | '3d'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.isEagleTopView = (mode === '2d');
    this.applyViewModeConstraints(true);
    this.saveMapViewerState();
    this.showActionLoader();
  }

  private applyViewModeConstraints(animate: boolean = true): void {
    if (!this.controls || !this.camera) return;
    if (this.viewMode === '2d') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
      if (this.isRotateMode) {
        this.isRotateMode = false;
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        this.renderer.domElement.style.cursor = 'grab';
      }
      if (animate) {
        const target = this.controls.target.clone();
        const dist = this.camera.position.distanceTo(target);
        const topDownCam = new THREE.Vector3(target.x, target.y + dist, target.z);
        this.cameraAnimationService.animateCamera(
          this.camera, this.controls,
          this.camera.position.clone(), topDownCam,
          target, target, 600, () => this.updateLabelVisibility()
        );
      } else {
        const target = this.controls.target.clone();
        const dist = this.camera.position.distanceTo(target);
        this.camera.position.set(target.x, target.y + dist, target.z);
        this.controls.update();
        this.updateLabelVisibility();
      }
    } else {
      this.controls.minPolarAngle = 0;
      const max = this.isPerspectiveLock || this.showLevels ? Math.PI / 3 : Math.PI / 2;
      this.controls.maxPolarAngle = max;
      this.controls.enableRotate = this.isRotateMode;
      this.controls.mouseButtons.LEFT = (this.isRotateMode && !this.isPanOnlyMode)
        ? THREE.MOUSE.ROTATE
        : THREE.MOUSE.PAN;
      this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
      this.controls.update();
    }
  }

  public toggleEagleTopView(): void {
    this.isEagleTopView = !this.isEagleTopView;
    const mode = this.isEagleTopView ? '2d' : '3d';
    this.viewMode = this.isEagleTopView ? '3d' : '2d'; // flip to force onViewModeChange execution
    this.onViewModeChange(mode);
  }

  public togglePanOnlyMode(): void {
    this.isPanOnlyMode = !this.isPanOnlyMode;
    this.applyPanOnlyModeLimits();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public toggleRotateMode(): void {
    if (this.viewMode === '2d') return;
    this.isRotateMode = !this.isRotateMode;
    if (this.controls) {
      this.controls.enableRotate = this.isRotateMode;
      this.controls.mouseButtons.LEFT = (this.isRotateMode && !this.isPanOnlyMode)
        ? THREE.MOUSE.ROTATE
        : THREE.MOUSE.PAN;
      this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
    }
    this.saveMapViewerState();
    this.showActionLoader();
  }

  private applyPanOnlyModeLimits(): void {
    if (!this.controls) return;
    if (this.isPanOnlyMode) {
      // Lock azimuth at the current horizontal angle — tilt (phi) remains free
      // so the user can still change the vertical viewing angle but cannot spin the map.
      const state = this.getCameraState();
      if (state) {
        this.controls.minAzimuthAngle = state.theta;
        this.controls.maxAzimuthAngle = state.theta;
      }
    } else {
      // Restore full 360° horizontal freedom
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
    }
    this.controls.update();
  }

  public onMapViewModeChange(): void {
    if (this.mapViewMode === 'urban' && this.mapConfig.mapTileType !== 'osm') {
      this.mapConfig.mapTileType = 'osm';
      this.loadBlockFloors();
    } else {
      this.updateMapView();
    }
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public onTileTypeChange(): void {
    // Reload floors so the surroundings group rebuilds with the new tile provider
    this.loadBlockFloors();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  private updateMapView(): void {
    if (!this.environmentGroup) return;

    // Landscape: Everything visible (Commented out)
    // Urban: Hide Greenery, Show OSM
    // Default: Hide Both

    // const isLandscape = this.mapViewMode === 'landscape';
    const isLandscape = false;
    const isDefault = this.mapViewMode === 'default';

    // Toggle Greenery Group
    // this.environmentGroup.visible = isLandscape;
    this.environmentGroup.visible = false;

    // Fog is controlled exclusively by the Fog config toggle (showFog), default OFF.
    this.scene.fog = this.showFog ? new THREE.Fog(0xf8fafc, 300, 1200) : null;

    // OSM surroundings visibility is controlled exclusively by the Surroundings config toggle.
    if (this.surroundingsGroup) {
      this.surroundingsGroup.visible = isDefault ? false : this.showSurroundings;
    }
  }

  public applyWallColor(): void {
    this.wallColor = this.tempWallColor;
    this.updateWallColors();
    this.saveMapViewerState();
    this.showActionLoader();
  }

  public applyWallWidth(): void {
    this.wallWidth = this.tempWallWidth;
    this.loadBlockFloors(); // Reload the map with the new wall thickness
    this.saveMapViewerState();
  }

  public applyWallHeight(): void {
    this.wallHeight = this.tempWallHeight;
    this.loadBlockFloors(); // Reload the map with the new wall height
    this.saveMapViewerState();
  }

  public applyLabelHeight(): void {
    this.labelHeight = this.tempLabelHeight;
    this.loadBlockFloors(); // Reload the map with the new label height
    this.saveMapViewerState();
  }

  public applyLabelScale(): void {
    this.labelScale = this.tempLabelScale;
    this.loadBlockFloors(); // Reload the map with the new label scale
    this.saveMapViewerState();
  }

  private updateWallColors(): void {
    const color = new THREE.Color(this.wallColor);
    this.roomMeshes.forEach(room => {
      if (room.walls) {
        room.walls.forEach(wall => {
          if (wall.material instanceof THREE.MeshStandardMaterial) {
            wall.material.color.copy(color);
            wall.material.emissive.copy(color);
          }
        });
      }
    });

    // Also update secondary building groups if they exist
    [this.roomMeshesByFloor, this.secondaryRoomMeshesByFloor].forEach(groupList => {
      groupList.forEach(floorRooms => {
        floorRooms.forEach(room => {
          if (room.walls) {
            room.walls.forEach(wall => {
              if (wall.material instanceof THREE.MeshStandardMaterial) {
                wall.material.color.copy(color);
                wall.material.emissive.copy(color);
              }
            });
          }
        });
      });
    });
  }

  private applyFloorImageVisibility(): void {
    this.floorImageMeshes.forEach(mesh => {
      mesh.visible = this.showFloorImage;
    });
  }

  public applyFoundationColor(): void {
    this.foundationColor = this.tempFoundationColor;
    const color = new THREE.Color(this.foundationColor);
    this.foundationMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color.copy(color);
      }
    });
    this.saveMapViewerState();
    this.showActionLoader();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.isConfigOpen && !target.closest('.settings-toggle-btn') && !target.closest('.config-dropdown')) {
      this.isConfigOpen = false;
    }
    if (!target.closest('.mv-block-pill')) {
      this.isBlockDropdownOpen = false;
    }
  }

  private onMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.interactionService.updateMousePosition(event, rect);

    // If room selection is disabled, skip room-specific hover logic
    if (!this.canSelectRooms) {
      if (this.hoveredRoom && this.hoveredRoom !== this.selectedRoomMesh) {
        applyRoomHighlight(
          this.hoveredRoom,
          false,
          false,
          this.hoveredRoom === this.startRoom,
          this.hoveredRoom === this.endRoom
        );
        this.hoveredRoom = null;
      }
      this.renderer.domElement.style.cursor = 'grab';
      return;
    }

    const roomMesh = this.interactionService.getIntersectedRoom(this.camera, this.getActiveRoomMeshes());

    if (this.hoveredRoom && this.hoveredRoom !== this.selectedRoomMesh) {
      applyRoomHighlight(
        this.hoveredRoom,
        false,
        false,
        this.hoveredRoom === this.startRoom,
        this.hoveredRoom === this.endRoom
      );
      this.hoveredRoom = null;
      this.renderer.domElement.style.cursor = 'grab';
    }

    if (roomMesh && roomMesh !== this.selectedRoomMesh) {
      this.hoveredRoom = roomMesh;
      applyRoomHighlight(
        roomMesh,
        false,
        true,
        roomMesh === this.startRoom,
        roomMesh === this.endRoom
      );
      this.renderer.domElement.style.cursor = 'pointer';
    } else if (roomMesh === this.selectedRoomMesh) {
      this.renderer.domElement.style.cursor = 'pointer';
    }
  };

  private onClick = (): void => {
    // 1. Check for Reader Hits (Only on the active floor)
    const activeReaders = this.readerSpritesByFloor[this.activeFloorIndex] ?? [];
    const reader = this.interactionService.getIntersectedObject(this.camera, activeReaders) as any;
    if (reader && reader.readerData) {
      // Toggle logic: if clicking the same reader, hide it; otherwise show/update
      if (this.activeReader && this.activeReader.id === reader.readerData.id) {
        this.activeReader = null;
      } else {
        this.handleReaderClick(reader);
      }
      return;
    } else {
      this.activeReader = null;
    }

    // 2. Room Selection Logic (Only if enabled)
    if (!this.canSelectRooms) return;

    // 2. Clear current room selection if clicking away
    if (this.hoveredRoom) {
      if (this.selectedRoomMesh === this.hoveredRoom) {
        this.deselectRoom();
      } else {
        if (this.selectedRoomMesh) {
          this.deselectRoom();
        }
        this.selectedRoomMesh = this.hoveredRoom;
        this.selectedRoom = this.hoveredRoom.data;

        this.handleRoomClickPrefill(this.selectedRoomMesh);
        applyRoomHighlight(
          this.selectedRoomMesh,
          true,
          false,
          this.selectedRoomMesh === this.startRoom,
          this.selectedRoomMesh === this.endRoom
        );
        this.cameraAnimationService.focusOnRoom(
          this.selectedRoomMesh,
          this.camera,
          this.controls,
          () => this.updateLabelVisibility()
        );
      }
    }
  };

  private handleReaderClick(reader: any): void {
    this.activeReader = reader.readerData;

    // Calculate 2D position for the dialog
    const vector = new THREE.Vector3().copy(reader.position);
    // Important: The reader sprite might be in a building group with an offset
    reader.getWorldPosition(vector);

    vector.project(this.camera);

    const widthHalf = this.renderer.domElement.clientWidth / 2;
    const heightHalf = this.renderer.domElement.clientHeight / 2;

    this.readerDialogPos = {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };

    this.deselectRoom(); // Deselect room if a reader is clicked
  }

  private handleRoomClickPrefill(clickedRoom: RoomMesh): void {
    if (this.navNodes.length === 0) {
      void this.loadNavigationNodes();
    }

    if (!this.isValidNodeRoom(clickedRoom.id)) {
      this.startSearchValue = '';
      this.destinationSearchValue = '';
      this.startSelectedRoomId = null;
      this.destinationSelectedRoomId = null;
      return;
    }

    if (!this.startRoom) {
      this.startSearchValue = this.getRoomDisplayLabel(clickedRoom);
      this.startSelectedRoomId = clickedRoom.id;
    } else {
      this.destinationSearchValue = this.getRoomDisplayLabel(clickedRoom);
      this.destinationSelectedRoomId = clickedRoom.id;
    }
  }

  public getEligibleRouteRooms(): RoomMesh[] {
    return this.getActiveRoomMeshes().filter(r => this.isValidNodeRoom(r.id));
  }

  public getRoomDisplayLabel(room: RoomMesh): string {
    const translatedName = this.regionalLocationNameService.getDisplayName(room?.data);
    if (room?.data?.regionalName && translatedName) return translatedName;
    const name = (room?.data?.name ?? room?.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    if (match?.[1]) return match[1];
    return name;
  }

  public getStartSuggestions(): RoomMesh[] {
    const q = (this.startSearchValue ?? '').trim().toLowerCase();
    const eligible = this.getEligibleRouteRooms();

    // Filter out the room currently selected/picked as destination
    let filtered = eligible;
    if (this.destinationSelectedRoomId) {
      filtered = filtered.filter(r => r.id !== this.destinationSelectedRoomId);
    } else if (this.endRoom) {
      filtered = filtered.filter(r => r.id !== this.endRoom!.id);
    }

    if (!q) return filtered;
    return filtered.filter(r => {
      const display = this.getRoomDisplayLabel(r).toLowerCase();
      const name = (r.data?.name ?? r.name ?? '').toLowerCase();
      const regionalName = (r.data?.regionalName ?? '').toLowerCase();
      const displayName = this.regionalLocationNameService.getDisplayName(r.data).toLowerCase();
      return display.includes(q) || name.includes(q) || regionalName.includes(q) || displayName.includes(q);
    });
  }

  public getDestinationSuggestions(): RoomMesh[] {
    const q = (this.destinationSearchValue ?? '').trim().toLowerCase();
    const eligible = this.getEligibleRouteRooms();

    // Filter out the room currently selected/picked as start
    let filtered = eligible;
    if (this.startSelectedRoomId) {
      filtered = filtered.filter(r => r.id !== this.startSelectedRoomId);
    } else if (this.startRoom) {
      filtered = filtered.filter(r => r.id !== this.startRoom!.id);
    }

    if (!q) return filtered;
    return filtered.filter(r => {
      const display = this.getRoomDisplayLabel(r).toLowerCase();
      const name = (r.data?.name ?? r.name ?? '').toLowerCase();
      const regionalName = (r.data?.regionalName ?? '').toLowerCase();
      const displayName = this.regionalLocationNameService.getDisplayName(r.data).toLowerCase();
      return display.includes(q) || name.includes(q) || regionalName.includes(q) || displayName.includes(q);
    });
  }

  public onStartInputChanged(): void {
    this.isStartDropdownOpen = true;
    this.startSelectedRoomId = null;
  }

  public onDestinationInputChanged(): void {
    this.isDestinationDropdownOpen = true;
    this.destinationSelectedRoomId = null;
  }

  public openStartDropdown(): void {
    this.isStartDropdownOpen = true;
  }

  public openDestinationDropdown(): void {
    this.isDestinationDropdownOpen = true;
  }

  public closeStartDropdown(): void {
    window.setTimeout(() => {
      this.isStartDropdownOpen = false;
    }, 120);
  }

  public closeDestinationDropdown(): void {
    window.setTimeout(() => {
      this.isDestinationDropdownOpen = false;
    }, 120);
  }

  public selectStartSuggestion(room: RoomMesh): void {
    this.startSearchValue = this.getRoomDisplayLabel(room);
    this.startSelectedRoomId = room.id;
    this.isStartDropdownOpen = false;
  }

  public selectDestinationSuggestion(room: RoomMesh): void {
    this.destinationSearchValue = this.getRoomDisplayLabel(room);
    this.destinationSelectedRoomId = room.id;
    this.isDestinationDropdownOpen = false;
  }

  public clearStartInput(): void {
    this.startSearchValue = '';
    this.startSelectedRoomId = null;
    this.isStartDropdownOpen = false;
  }

  public clearDestinationInput(): void {
    this.destinationSearchValue = '';
    this.destinationSelectedRoomId = null;
    this.isDestinationDropdownOpen = false;
  }

  public hasValidStartSelection(): boolean {
    return this.startSelectedRoomId !== null;
  }

  public hasValidDestinationSelection(): boolean {
    return this.destinationSelectedRoomId !== null;
  }

  public confirmStartFromInput(): void {
    const room = this.startSelectedRoomId ? this.getEligibleRouteRooms().find(r => r.id === this.startSelectedRoomId) ?? null : null;
    if (!room) return;
    this.assignStartRoom(room);
  }

  public confirmDestinationFromInput(): void {
    const room = this.destinationSelectedRoomId ? this.getEligibleRouteRooms().find(r => r.id === this.destinationSelectedRoomId) ?? null : null;
    if (!room) return;
    this.assignEndRoom(room);
  }

  public swapStartAndDestination(): void {
    if (!this.startRoom || !this.endRoom) return;

    const oldStart = this.startRoom;
    const oldEnd = this.endRoom;

    this.startRoom = oldEnd;
    this.endRoom = oldStart;

    this.startSearchValue = this.getRoomDisplayLabel(this.startRoom);
    this.destinationSearchValue = this.getRoomDisplayLabel(this.endRoom);
    this.startSelectedRoomId = this.startRoom.id;
    this.destinationSelectedRoomId = this.endRoom.id;

    applyRoomHighlight(
      this.startRoom,
      this.startRoom === this.selectedRoomMesh,
      false,
      true,
      this.startRoom === this.endRoom
    );
    applyRoomHighlight(
      this.endRoom,
      this.endRoom === this.selectedRoomMesh,
      false,
      this.endRoom === this.startRoom,
      true
    );

    this.calculateRoute();
  }

  public deselectRoom(): void {
    if (this.selectedRoomMesh) {
      applyRoomHighlight(
        this.selectedRoomMesh,
        false,
        false,
        this.selectedRoomMesh === this.startRoom,
        this.selectedRoomMesh === this.endRoom
      );
      this.selectedRoomMesh = null;
      this.selectedRoom = null;
    }
  }

  public resetCamera(): void {
    this.cameraAnimationService.focusOnFloor(
      this.getActiveRoomMeshes(),
      this.camera,
      this.controls,
      1,
      () => this.updateLabelVisibility()
    );
    this.applyFloorDefaultCamera();
  }

  public toggleWireframe(): void {
    this.isWireframe = !this.isWireframe;
    this.applyWireframe();
    this.saveMapViewerState();
  }

  private applyWireframe(): void {
    if (!this.scene) return;
    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).wireframe = this.isWireframe;
        }
      }
    });
  }

  public zoomIn(): void {
    this.cameraAnimationService.smoothZoom(
      CAMERA_ZOOM_IN_FACTOR,
      this.camera,
      this.controls,
      () => this.updateLabelVisibility()
    );
  }

  public zoomOut(): void {
    this.cameraAnimationService.smoothZoom(
      CAMERA_ZOOM_OUT_FACTOR,
      this.camera,
      this.controls,
      () => this.updateLabelVisibility()
    );
  }

  private updateZoomValue(): void {
    if (this.camera && this.controls) {
      const current = this.camera.position.distanceTo(this.controls.target);
      const min = (this.controls as any).minDistance;
      const max = (this.controls as any).maxDistance;

      if (max > min) {
        // Map [max, min] distance range to [0, 200] percentage range
        // Fully zoomed out (max) = 0%
        // Fully zoomed in (min) = 200%
        const percentage = ((max - current) / (max - min)) * 200;
        this.zoomValue = Math.round(Math.max(0, Math.min(200, percentage)));
      } else {
        this.zoomValue = 0;
      }
    }
  }

  public resetRotation(): void {
    this.cameraAnimationService.resetRotation(
      this.camera,
      this.controls,
      () => this.updateLabelVisibility()
    );
  }

  public onCompassMouseDown(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.compassState = this.compassControlService.startRotation(event, rect, this.camera, this.controls);
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  public onWindowMouseMove(event: MouseEvent): void {
    if (this.compassState.isRotating) {
      this.compassState = this.compassControlService.handleMouseMove(
        event,
        this.compassState
      );
      this.updateLabelVisibility();
    }
  }

  @HostListener('window:mouseup')
  public onWindowMouseUp(): void {
    if (this.compassState.isRotating) {
      this.compassState = this.compassControlService.stopRotation(this.compassState);
    }
  }

  private animate(): void {
    if (!this.scene || !this.camera || !this.controls) return;
    this.controlsService.update();
    this.updateZoomValue();
    this.compassState = this.compassControlService.update(this.compassState, this.camera, this.controls);
    this.animateMarkers();
    this.updateMarkerClusters();

    const now = performance.now();
    // Progressive path reveal + camera tip-follow (target modified before controls.update)
    if (this.pathAnimating && this.routeRibbonMesh?.geometry?.index) {
      const elapsed = now - this.pathAnimStartTime;
      const t = Math.min(elapsed / this.pathAnimDuration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.routeRibbonMesh.geometry.setDrawRange(0, Math.floor(eased * this.routeRibbonTotalIndices));
      if (this.routeCameraFollowActive && this.pathTotalLength > 0) {
        this.panCameraTowardRoutePoint(this.getPathPositionAt(eased), this.viewMode === '2d' ? 0.09 : 0.07);
      }
      if (t >= 1) {
        this.pathAnimating = false;
        this.pathAnimComplete = true;
        if (this.selectedFloorId !== null && this.selectedFloorId !== undefined) {
          this.animatedFloors.add(this.selectedFloorId);
        }
      }
    }

    // Pull back to full route view once ribbon is complete (fires exactly once)
    if (this.pathAnimComplete && !this.pathRevealTriggered && this.routeGroup) {
      this.pathRevealTriggered = true;
      this.routeCameraFollowActive = false;
      this.fitFullRouteAfterArrival();
    }

    if (this.movementState.isMoving && this.person) {
      this.movementState = this.personMovementService.updateMovement(
        this.person,
        this.pathPoints,
        this.movementState,
        this.moveSpeed
      );
    }

    this.updateDestCalloutPosition();
    this.updateNavMarkerPositions();
    this.updateYouAreHerePosition();
    this.rendererService.render(this.scene, this.camera);
  }

  public startJourney(): void {
    if (this.pathPoints.length < 2) return;
    this.isJourneyStarted = true;

    // Person must live inside buildingGroup so its position (in local/path space)
    // maps to the same world space as the route tube and room meshes.
    this.person = createPerson(this.buildingGroup ?? this.scene, this.person);
    this.movementState = {
      isMoving: true,
      currentPathIndex: 0,
      moveProgress: 0
    };

    if (this.person) {
      this.person.position.copy(this.pathPoints[0]);
    }
  }

  private onResize(): void {
    const w = this.container.nativeElement.clientWidth;
    const h = this.container.nativeElement.clientHeight;
    this.cameraService.updateAspect(w, h);
    this.rendererService.setSize(w, h);
  }

  public setAsStart(): void {
    if (!this.selectedRoomMesh) return;
    this.assignStartRoom(this.selectedRoomMesh);
  }

  public setAsEnd(): void {
    if (!this.selectedRoomMesh) return;
    this.assignEndRoom(this.selectedRoomMesh);
  }

  private assignStartRoom(room: RoomMesh): void {
    if (!this.isValidNodeRoom(room.id)) return;

    // Clear previous start room highlight if different
    if (this.startRoom && this.startRoom !== room) {
      applyRoomHighlight(
        this.startRoom,
        this.startRoom === this.selectedRoomMesh,
        false,
        false,
        this.startRoom === this.endRoom
      );
      this.boostRouteLabel(this.startRoom, false);
    }

    this.startRoom = room;
    this.calculateRoute();

    // Apply new start highlight and boost the existing label
    applyRoomHighlight(
      this.startRoom,
      this.startRoom === this.selectedRoomMesh,
      false,
      true,
      this.startRoom === this.endRoom
    );
    this.boostRouteLabel(this.startRoom, true);
  }

  private assignEndRoom(room: RoomMesh): void {
    if (!this.isValidNodeRoom(room.id)) return;

    // Clear previous end room highlight if different
    if (this.endRoom && this.endRoom !== room) {
      applyRoomHighlight(
        this.endRoom,
        this.endRoom === this.selectedRoomMesh,
        false,
        this.endRoom === this.startRoom,
        false
      );
      this.boostRouteLabel(this.endRoom, false);
    }

    this.endRoom = room;
    this.calculateRoute();

    // Apply new end highlight and boost the existing label
    applyRoomHighlight(
      this.endRoom,
      this.endRoom === this.selectedRoomMesh,
      false,
      this.endRoom === this.startRoom,
      true
    );
    this.boostRouteLabel(this.endRoom, true);
  }

  public clearRoute(): void {
    // Reset room highlights before clearing references
    if (this.startRoom) {
      applyRoomHighlight(
        this.startRoom,
        this.startRoom === this.selectedRoomMesh, // Keep selected if it was selected
        false,
        false, // Remove start flag
        this.startRoom === this.endRoom
      );
    }
    if (this.endRoom) {
      applyRoomHighlight(
        this.endRoom,
        this.endRoom === this.selectedRoomMesh,
        false,
        this.endRoom === this.startRoom,
        false // Remove end flag
      );
    }

    // Restore boosted label scales
    this.boostRouteLabel(this.startRoom, false);
    this.boostRouteLabel(this.endRoom, false);

    this.cleanupService.disposeGroup(this.routeGroup, this.scene);
    this.routeGroup = null;

    this.cleanupService.disposeGroup(this.person, this.scene);
    this.person = null;

    this.movementState = {
      isMoving: false,
      currentPathIndex: 0,
      moveProgress: 0
    };
    this.pathPoints = [];
    this.startRoom = null;
    this.endRoom = null;
  }

  private boostRouteLabel(room: RoomMesh | null, boost: boolean): void {
    if (!room?.label) return;
    const label = room.label;
    const BOOST = 1.45;
    if (boost) {
      if (label.userData['routeOrigSX'] === undefined) {
        label.userData['routeOrigSX'] = label.userData['fixedSX'];
        label.userData['routeOrigSY'] = label.userData['fixedSY'];
      }
      label.userData['fixedSX'] = label.userData['routeOrigSX'] * BOOST;
      label.userData['fixedSY'] = label.userData['routeOrigSY'] * BOOST;
      label.userData['isRouteMarker'] = true;
      label.visible = true;
      if (room.labelIcon) {
        room.labelIcon.userData['isRouteMarker'] = true;
        room.labelIcon.visible = true;
      }
    } else {
      if (label.userData['routeOrigSX'] !== undefined) {
        label.userData['fixedSX'] = label.userData['routeOrigSX'];
        label.userData['fixedSY'] = label.userData['routeOrigSY'];
        delete label.userData['routeOrigSX'];
        delete label.userData['routeOrigSY'];
      }
      delete label.userData['isRouteMarker'];
      if (room.labelIcon) {
        delete room.labelIcon.userData['isRouteMarker'];
      }
    }
    this.updateLabelVisibility();
  }

  private calculateRoute(): void {
    if (this.isQuickAccessConfigOn) {
      if (this.isMultiFloorScenario() && !this.multiFloorRouteActive) {
        this.multiFloorRouteActive = true;
        this.animatedFloors.clear();
        void this.ensureAllFloorNavOptions().then(() => {
          const startLift = this.findNearestLiftOrStair(
            this.selectedStartLocation!.node,
            this.selectedStartLocation!.floorId
          );
          if (startLift) {
            this.multiFloorStartLiftNode = startLift.node;
            this.multiFloorStartLiftLocationId = startLift.locationId ?? null;

            const destLift = this.findMatchingLiftOrStairNode(
              startLift.name,
              this.selectedDestinationLocation!.floorId
            );
            if (destLift) {
              this.multiFloorDestLiftNode = destLift.node;
              this.multiFloorDestLiftLocationId = destLift.locationId ?? null;
            }
          } else {
            const destLift = this.findNearestLiftOrStair(
              this.selectedDestinationLocation!.node,
              this.selectedDestinationLocation!.floorId
            );
            if (destLift) {
              this.multiFloorDestLiftNode = destLift.node;
              this.multiFloorDestLiftLocationId = destLift.locationId ?? null;

              const startLiftMatching = this.findMatchingLiftOrStairNode(
                destLift.name,
                this.selectedStartLocation!.floorId
              );
              if (startLiftMatching) {
                this.multiFloorStartLiftNode = startLiftMatching.node;
                this.multiFloorStartLiftLocationId = startLiftMatching.locationId ?? null;
              }
            }
          }
          this.applyMultiFloorRoute();
        });
        return;
      }

      this.clearRouteVisual();

      let startNode: NavNode | undefined;
      let endNode: NavNode | undefined;

      if (this.multiFloorRouteActive) {
        const currentFloorId = this.selectedFloorId;
        if (currentFloorId === this.selectedStartLocation?.floorId) {
          startNode = this.navNodes.find(n => n.id === this.selectedStartLocation!.node.id);
          endNode = this.multiFloorStartLiftNode ? this.navNodes.find(n => n.id === this.multiFloorStartLiftNode!.id) : undefined;
        } else if (currentFloorId === this.selectedDestinationLocation?.floorId) {
          startNode = this.multiFloorDestLiftNode ? this.navNodes.find(n => n.id === this.multiFloorDestLiftNode!.id) : undefined;
          endNode = this.navNodes.find(n => n.id === this.selectedDestinationLocation!.node.id);
        }
      } else {
        if (!this.startRoom || !this.endRoom) return;
        startNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === this.startRoom?.id);
        endNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === this.endRoom?.id);
      }

      if (!startNode || !endNode) {
        console.warn('[MapViewer] No nav nodes for selected rooms');
        return;
      }

      this.activePathStartNode = startNode;
      this.activePathEndNode = endNode;

      const pathIds = this.navigationService.findShortestNodePath(
        startNode.id, endNode.id, this.navNodes, this.nodeNavigationGraph
      );
      if (!pathIds) { console.warn('[MapViewer] No path found'); return; }

      const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
      const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
      const floorY = this.activeFloorIndex * (this.showLevels ? FLOOR_STACK_HEIGHT : 0);
      const pts = pathIds.map(id => {
        const n = this.navNodes.find(n => n.id === id)!;
        return new THREE.Vector3(n.x - xOff, floorY, n.y - zOff);
      });

      const parent = this.buildingGroup ?? this.scene;
      const customWidth = Math.max(0.25, ROUTE_RIBBON_WIDTH * Math.min(1.0, (this.floorSize || 200) / 200));
      const result = this.routeVisualizationService.visualizeRoute(pts, parent, customWidth);
      this.routeGroup = result.routeGroup;
      this.pathPoints = result.pathPoints;
      this.moveSpeed = result.moveSpeed;

      // Precompute path length for tip-follow camera
      this.pathTotalLength = 0;
      for (let i = 1; i < this.pathPoints.length; i++) {
        this.pathTotalLength += this.pathPoints[i].distanceTo(this.pathPoints[i - 1]);
      }
      // Scale animation duration to path length: ~10 units/sec (near-walking), clamped 4s – 10s
      this.pathAnimDuration = Math.min(Math.max(this.pathTotalLength / 10 * 1000, 4000), 10000);
      this.pathRevealTriggered = false;

      // Kick off draw animation — ribbon starts invisible and reveals over pathAnimDuration ms
      const currentFloorId = this.selectedFloorId;
      const skipAnim = currentFloorId !== undefined && currentFloorId !== null && this.animatedFloors.has(currentFloorId);

      this.routeRibbonMesh = this.routeGroup?.children[0] ?? null;
      if (this.routeRibbonMesh?.geometry?.index) {
        this.routeRibbonTotalIndices = this.routeRibbonMesh.geometry.index.count;
        if (skipAnim) {
          this.routeRibbonMesh.geometry.setDrawRange(0, this.routeRibbonTotalIndices);
        } else {
          this.routeRibbonMesh.geometry.setDrawRange(0, 0);
        }
      }
      this.pathAnimating = false;
      this.pathAnimComplete = skipAnim;

      if (currentFloorId !== undefined && currentFloorId !== null) {
        this.animatedFloors.add(currentFloorId);
      }

      if (skipAnim) {
        this.fitFullRouteAfterArrival(true);
      } else {
        this.focusOnRouteStartForNavigation(this.multiFloorRouteActive);
        this.startRouteRevealAfterCameraFit(this.multiFloorRouteActive);
      }

      const frames = result.totalDistance / this.moveSpeed;
      this.routeDistance = `${result.totalDistance.toFixed(0)}m`;
      this.routeTime = `${Math.ceil(frames / 60)}s`;

      // Generate turn-by-turn steps
      this.pathSteps = this.generatePathSteps(result.pathPoints);
      this.isStepsOpen = false;
      return;
    }

    if (!this.startRoom || !this.endRoom) return;

    // Cleanup previous route
    if (this.routeGroup) {
      this.cleanupService.disposeGroup(this.routeGroup, this.scene);
      this.routeGroup = null;
    }

    console.log('Calculating route from', this.startRoom.name, 'to', this.endRoom.name);

    // Calculate the base elevation for the current floor
    const floorY = this.activeFloorIndex * (this.showLevels ? FLOOR_STACK_HEIGHT : 0);

    if (this.navNodes.length > 0) {
      // Find closest nodes to start and end rooms
      const startNode = this.navNodes.find(n => n.type === 'NT-RN' && n.location_id === this.startRoom?.id);
      const endNode = this.navNodes.find(n => n.type === 'NT-RN' && n.location_id === this.endRoom?.id);

      console.log('[ROUTE-DEBUG] startNode:', startNode ? `id=${startNode.id} loc=${startNode.location_id}` : 'NOT FOUND (no NT-RN node with location_id=' + this.startRoom?.id + ')');
      console.log('[ROUTE-DEBUG] endNode:', endNode ? `id=${endNode.id} loc=${endNode.location_id}` : 'NOT FOUND (no NT-RN node with location_id=' + this.endRoom?.id + ')');

      if (startNode && endNode) {
        const pathIds = this.navigationService.findShortestNodePath(
          startNode.id,
          endNode.id,
          this.navNodes,
          this.nodeNavigationGraph
        );

        console.log('[ROUTE-DEBUG] pathIds:', pathIds);

        if (pathIds) {
          // Apply the same floor-centroid offset used by the graph visualizer so the
          // route tube aligns with room meshes inside buildingGroup.
          const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
          const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
          const pathPoints = pathIds.map(id => {
            const node = this.navNodes.find(n => n.id === id)!;
            return new THREE.Vector3(node.x - xOff, floorY, node.y - zOff);
          });

          // Route must live inside buildingGroup so it inherits geo-alignment transforms.
          const routeParent = this.buildingGroup ?? this.scene;
          const customWidth = Math.max(0.25, ROUTE_RIBBON_WIDTH * Math.min(1.0, (this.floorSize || 200) / 200));
          const result = this.routeVisualizationService.visualizeRoute(pathPoints, routeParent, customWidth);
          this.routeGroup = result.routeGroup;
          this.pathPoints = result.pathPoints;
          this.moveSpeed = result.moveSpeed;

          // Calculate Stats
          const totalDistance = result.totalDistance;
          const estimatedFrames = totalDistance / this.moveSpeed;
          const estimatedSeconds = Math.ceil(estimatedFrames / 60);

          this.routeDistance = `${totalDistance.toFixed(0)}m`;
          this.routeTime = `${estimatedSeconds}s`;

          this.focusOnRoute();
          return;
        }
      }
      console.warn('Strict node-based pathfinding failed or no valid nodes found.');
      return; // Force strict mode for 1st floor
    }

    // Fallback to geometry-based ONLY for other floors, if implemented
    // if (this.isFirstFloor) return;

    const path = this.navigationService.findShortestPath(
      this.startRoom.id,
      this.endRoom.id,
      this.roomMeshes,
      this.navigationGraph,
      (room: RoomMesh) => this.floorPlanService.getRoomCenter(room)
    );

    if (path) {
      const pathPoints = path.map(id => {
        const room = this.roomMeshes.find(r => r.id === id)!;
        // Use floor elevation instead of hardcoded 0
        return this.floorPlanService.getRoomCenter(room).clone().setY(floorY);
      });

      const customWidth = Math.max(0.25, ROUTE_RIBBON_WIDTH * Math.min(1.0, (this.floorSize || 200) / 200));
      const result = this.routeVisualizationService.visualizeRoute(pathPoints, this.scene, customWidth);
      this.routeGroup = result.routeGroup;
      this.pathPoints = result.pathPoints;
      this.moveSpeed = result.moveSpeed;

      // Calculate Stats
      const totalDistance = result.totalDistance;
      const estimatedFrames = totalDistance / this.moveSpeed;
      const estimatedSeconds = Math.ceil(estimatedFrames / 60);

      this.routeDistance = `${totalDistance.toFixed(0)}m`;
      this.routeTime = `${estimatedSeconds}s`;

      this.focusOnRoute();
    } else {
      console.warn('No path found between rooms.');
    }
  }

  private focusOnRoute(): void {
    if (!this.startRoom || !this.endRoom) return;

    const bounds = new THREE.Box3();
    bounds.expandByObject(this.startRoom.floor);
    bounds.expandByObject(this.endRoom.floor);
    if (this.routeGroup) {
      bounds.expandByObject(this.routeGroup);
    }

    this.cameraAnimationService.focusOnBounds(
      bounds,
      this.camera,
      this.controls,
      () => this.updateLabelVisibility()
    );
  }


  // ==========================================================================
  // MQTT & REAL-TIME TRACKING
  // ==========================================================================

  private connectMqtt(): void {
    // Basic options matching user requirement
    const mqttOptions = {
      hostname: 'demos.trackerwave.com', // REPLACE WITH YOUR BROKER HOST
      port: 8883,                 // REPLACE WITH YOUR WEBSOCKET PORT (WSS)
      path: '/mqtt',              // REPLACE WITH YOUR BROKER PATH
      protocol: 'wss' as 'wss',
      username: 'twdemo',  // <--- REPLACE WITH YOUR USERNAME
      password: 'demo@2018'   // <--- REPLACE WITH YOUR PASSWORD
    };

    this.mqttService.connect(mqttOptions);

    this.mqttSubscription = this.mqttService.messages$.subscribe((msg: IMqttMessage) => {
      // console.log('📡 TOPIC:', msg.topic);
      // console.log('📦 PAYLOAD:', msg.payload);

      if (msg.topic.includes('tw/tag/location_nav')) {
        // console.log('✅ Match found for topic, updating marker...');
        this.updateMarkerFromMqtt(msg.payload);
      }
    });

    this.mqttService.isConnected$.subscribe(connected => {
      if (connected) {
        // console.log('Connected to MQTT Broker via Component');
        let facilityId = localStorage.getItem(btoa('facilityId'))
        this.mqttService.subscribe('tw/tag/location_nav/'+ facilityId +'/#');
      }
    });
  }

  private updateMarkerFromMqtt(data: any): void {
    if (!data || !data.tid || !data.cxy) return;

    const { tid, cxy, flr } = data;
    if(this.selectedFloorId == flr) {
      // Apply the same XZ centering offset used by room meshes so the marker
      // lands at the correct position inside buildingGroup.
      const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
      const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
      const x = cxy[0] - xOff;
      const z = cxy[1] - zOff;

      // Determine target elevation based on floor ID
      const y = this.getFloorElevation(flr);

      // Update or Create Target Position
      let target = this.markerTargets.get(tid);
      if (!target) {
        target = new THREE.Vector3(x, y, z);
        this.markerTargets.set(tid, target);
      } else {
        target.set(x, y, z);
      }

      // Create marker if it doesn't exist
      if (!this.markers.has(tid)) {
        this.createMarker(tid, target.clone());
      }

      console.log(`Marker Updated: ${tid} to [${x.toFixed(2)}, ${z.toFixed(2)}] on Elevation ${y.toFixed(2)}`);
    }
  }

  private createMarker(tid: string, position: THREE.Vector3): void {
    const group = new THREE.Group();
    group.name = `marker-${tid}`;
    group.position.copy(position);

    const pinColor = this.getMarkerColor(tid);

    // 1. 3D Pin Top (Sphere)
    const topGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const topMat = new THREE.MeshStandardMaterial({
      color: pinColor,
      emissive: pinColor,
      emissiveIntensity: 0.2
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 1.6;
    group.add(top);

    // 2. 3D Pin Body (Cone)
    const bodyGeo = new THREE.ConeGeometry(0.4, 1.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: pinColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.rotation.x = Math.PI; // Flip point down
    group.add(body);

    // 3. Pulse Ring (Ping Effect)
    const ringGeo = new THREE.RingGeometry(0.4, 0.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: pinColor,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.name = 'pulse-ring';
    pulseRing.rotation.x = -Math.PI / 2; // Flat on floor
    pulseRing.position.y = 0.02; // Slightly above floor
    group.add(pulseRing);

    group.visible = this.showMqttMarkers;
    // Add to buildingGroup so the marker inherits geo-alignment transforms
    // (rotation, scale, position) exactly like room meshes and readers do.
    (this.buildingGroup ?? this.scene).add(group);
    this.markers.set(tid, group);

    console.log("Marker Created:", tid);
  }

  private animateMarkers(): void {
    this.markers.forEach((marker, tid) => {
      const target = this.markerTargets.get(tid);
      if (target) {
        const oldPos = marker.position.clone();
        // Smoothly move marker towards target
        marker.position.lerp(target, 0.1);

        if (oldPos.distanceTo(marker.position) > 0.01) {
          // Marker is moving
        }
      }

      // Animate Pulse Ring
      const pulseRing = marker.getObjectByName('pulse-ring') as THREE.Mesh;
      if (pulseRing) {
        const material = pulseRing.material as THREE.MeshBasicMaterial;

        // Scale expansion
        pulseRing.scale.addScalar(0.04);

        // Fading effect
        material.opacity -= 0.02;

        // Reset Pulse
        if (material.opacity <= 0) {
          pulseRing.scale.set(1, 1, 1);
          material.opacity = 1.0;
        }
      }
    });
  }

  private updateMarkerClusters(): void {
    if (this.markers.size === 0) {
      this.clusterMeshes.forEach(m => this.clusterGroup.remove(m));
      this.clusterMeshes.clear();
      this.clusterGroups.clear();
      return;
    }

    // Dynamic Threshold based on zoom level
    if (this.controls) {
      const camDist = this.controls.getDistance();
      // Far (300) -> 12.0 units, Close (50) -> 1.5 units
      this.clusterDistance = Math.max(1.0, (camDist / 300) * 12.0);
    }

    const tids = Array.from(this.markers.keys());
    const usedTids = new Set<string>();
    const newClusterGroups = new Map<string, string[]>();

    // 1. Calculate Clusters (Distance-based)
    for (let i = 0; i < tids.length; i++) {
      const tidA = tids[i];
      if (usedTids.has(tidA)) continue;

      const markerA = this.markers.get(tidA)!;
      const currentCluster = [tidA];
      usedTids.add(tidA);

      for (let j = i + 1; j < tids.length; j++) {
        const tidB = tids[j];
        if (usedTids.has(tidB)) continue;

        const markerB = this.markers.get(tidB)!;
        if (markerA.position.distanceTo(markerB.position) < this.clusterDistance) {
          currentCluster.push(tidB);
          usedTids.add(tidB);
        }
      }

      const clusterId = currentCluster.sort().join('|');
      newClusterGroups.set(clusterId, currentCluster);
    }

    // 2. Sync Cluster Meshes
    // Remove old clusters
    this.clusterMeshes.forEach((mesh, id) => {
      if (!newClusterGroups.has(id)) {
        this.clusterGroup.remove(mesh);
        this.clusterMeshes.delete(id);
      }
    });

    // Add or Update Clusters
    // newClusterGroups.forEach((clusterTids, id) => {
    //   const avgPos = new THREE.Vector3();
    //   clusterTids.forEach(tid => {
    //     const m = this.markers.get(tid);
    //     if (m) avgPos.add(m.position);
    //   });
    //   avgPos.divideScalar(clusterTids.length);

    //   if (clusterTids.length > 1) {
    //     // Show Bubble, Hide Individuals
    //     let bubble = this.clusterMeshes.get(id);
    //     if (!bubble) {
    //       bubble = this.createBubbleMarker(id, clusterTids.length, avgPos);
    //       this.clusterMeshes.set(id, bubble);
    //       this.clusterGroup.add(bubble);
    //     } else {
    //       bubble.position.lerp(avgPos, 0.1);
    //       // Update count if it changed
    //       const sprite = bubble.getObjectByName('count-sprite') as THREE.Sprite;
    //       if (sprite && (sprite.userData as any).count !== clusterTids.length) {
    //         this.updateBubbleSprite(sprite, clusterTids.length);
    //       }
    //     }
    //     clusterTids.forEach(tid => {
    //       const m = this.markers.get(tid);
    //       if (m) m.visible = false;
    //     });
    //   } else {
    //     // Show Individual
    //     const m = this.markers.get(clusterTids[0]);
    //     if (m) m.visible = this.showMqttMarkers;
    //   }
    // });

    // this.clusterGroup.visible = this.showMqttMarkers;
    // this.clusterGroups = newClusterGroups;

    // 3. Animate Pulse Rings for Clusters
    this.clusterMeshes.forEach(cluster => {
      const pulseRing = cluster.getObjectByName('pulse-ring') as THREE.Mesh;
      if (pulseRing) {
        const material = pulseRing.material as THREE.MeshBasicMaterial;
        pulseRing.scale.addScalar(0.04);
        material.opacity -= 0.02;
        if (material.opacity <= 0) {
          pulseRing.scale.set(1, 1, 1);
          material.opacity = 1.0;
        }
      }
    });
  }

  private createBubbleMarker(id: string, count: number, position: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();
    group.name = `cluster-${id}`;
    group.position.copy(position);

    // Color based on density
    let color = 0x47e2b1; // Green
    if (count > 10) color = 0xff5e57; // Red
    else if (count > 5) color = 0xffd32a; // Yellow

    const scale = 5.3 + (count * 0.05); // Scale up slightly based on count

    // 1. 3D Pin Top (Sphere) - Scaled
    const topGeo = new THREE.SphereGeometry(0.5 * scale, 16, 16);
    const topMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 1.6 * scale;
    group.add(top);

    // 2. 3D Pin Body (Cone) - Scaled
    const bodyGeo = new THREE.ConeGeometry(0.4 * scale, 1.2 * scale, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8 * scale;
    body.rotation.x = Math.PI; // Flip point down
    group.add(body);

    // 3. Pulse Ring (Scaled)
    const ringGeo = new THREE.RingGeometry(0.4 * scale, 0.7 * scale, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.name = 'pulse-ring';
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 0.02;
    group.add(pulseRing);

    // Count Sprite - Positioned above the pin top
    const sprite = new THREE.Sprite();
    sprite.name = 'count-sprite';
    sprite.position.y = (1.6 * scale) + (0.5 * scale) + 0.5;
    this.updateBubbleSprite(sprite, count);
    group.add(sprite);

    return group;
  }

  private updateBubbleSprite(sprite: THREE.Sprite, count: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background Circle with shadow
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 128, 100, 0, Math.PI * 2);
      ctx.fill();

      // Premium Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 110px "Inter", "Outfit", "Arial"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count.toString(), 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    sprite.material = spriteMaterial;
    sprite.renderOrder = 1010;
    sprite.scale.set(4, 4, 1);
    (sprite.userData as any).count = count;
  }

  /**
   * Generates a unique, stable color based on the tid string
   */
  private getMarkerColor(tid: string): number {
    let hash = 0;
    for (let i = 0; i < tid.length; i++) {
      hash = tid.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL for better visual variety and brightness
    const h = Math.abs(hash % 360);
    const s = 75 + (Math.abs(hash % 20)); // High saturation (75-95%)
    const l = 50 + (Math.abs(hash % 10)); // Mid lightness (50-60%)

    const color = new THREE.Color().setHSL(h / 360, s / 100, l / 100);
    return color.getHex();
  }

  /**
   * Calculates the Y elevation for a given floor ID
   */
  private getFloorElevation(floorId: any): number {
    if (!this.filteredFloors || this.filteredFloors.length === 0) return 0;

    const floorIdNum = Number(floorId);

    // 1. Check Primary Building Floors
    const primaryIndex = this.filteredFloors.findIndex(f => f.id === floorIdNum);
    if (primaryIndex !== -1) {
      return primaryIndex * (this.showLevels ? FLOOR_STACK_HEIGHT : 0);
    }

    // 2. Check Secondary Building Floors (They are always at Level 1 for labels/interaction in this view)
    // But if they have IDs, we should check them.
    // In this project, secondary floors are usually static or mirrored.

    return 0;
  }

  // ==========================================================================
  // ENVIRONMENTAL GREENERY (NEW)
  // ==========================================================================

  private initEnvironment(): void {
    // Clear existing greenery for a clean refresh
    this.environmentGroup.clear();

    this.environmentGroup.name = 'environment-group';
    this.scene.add(this.environmentGroup);

    // Fog is managed by updateMapView() — only active in landscape mode (disabled).

    this.addEnvironmentGround();
    this.addEnvironmentRoad();
    this.addEnvironmentWater();

    // Trees are only visible when the Ground Floor (index 0) is the active floor focus
    if (this.activeFloorIndex === 0) {
      this.addEnvironmentTrees();
      console.log("🌳 Enhanced Environment initialized (Ground + Road + Water + Trees + Fog)");
    } else {
      console.log("🏙️ Clean Environment initialized (No trees for higher floor focus)");
    }
  }

  private addEnvironmentGround(): void {
    // Expanded circular ground (Baseplate style) to surround the building
    const geometry = new THREE.CircleGeometry(600, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x95D295, // Softer, lighter Meadow Green
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(geometry, material);

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15; // Directly below floor map base
    ground.receiveShadow = true;

    this.environmentGroup.add(ground);
  }

  private addEnvironmentRoad(): void {
    // Asphalt road leads from the edge toward the building
    const hw = this.floorWidth / 2;
    const roadWidth = 25;
    const roadLength = 1000;
    const geometry = new THREE.PlaneGeometry(roadWidth, roadLength);
    const material = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate/Asphalt grey
      roughness: 0.8
    });
    const road = new THREE.Mesh(geometry, material);

    road.rotation.x = -Math.PI / 2;
    // Position to the side of the building, reaching from the horizon
    road.position.set(this.baseFloorCenter.x + hw + 150, -0.14, this.baseFloorCenter.y);
    this.environmentGroup.add(road);

    // Subtle center line
    const lineGeo = new THREE.PlaneGeometry(1, roadLength);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, opacity: 0.5, transparent: true });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.name = 'road-line';
    line.rotation.x = -Math.PI / 2;
    line.position.set(road.position.x, -0.13, road.position.y);
    this.environmentGroup.add(line);
  }

  private addEnvironmentWater(): void {
    // An organic reflective pond/lake (not a perfect circle)
    const hh = this.floorHeight / 2;

    const waterShape = new THREE.Shape();
    // Create an irregular organic outline
    waterShape.moveTo(60, 0);
    waterShape.bezierCurveTo(70, 40, 30, 80, -20, 70);
    waterShape.bezierCurveTo(-60, 60, -80, 20, -70, -30);
    waterShape.bezierCurveTo(-60, -70, -20, -80, 20, -60);
    waterShape.bezierCurveTo(50, -50, 60, -20, 60, 0);

    const geometry = new THREE.ShapeGeometry(waterShape);
    const material = new THREE.MeshStandardMaterial({
      color: 0x93C5FD, // Realistic Light Blue
      metalness: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    const pond = new THREE.Mesh(geometry, material);

    pond.rotation.x = -Math.PI / 2;
    // Positioned in the "back" area relative to building
    pond.position.set(this.baseFloorCenter.x - 180, -0.13, this.baseFloorCenter.y - hh - 120);
    this.environmentGroup.add(pond);
  }

  private createConicalTree(x: number, z: number): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, -0.12, z);

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.25;
    treeGroup.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(1.2, 4, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 }); // Softer Green
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3.25;
    treeGroup.add(leaves);

    const s = 0.8 + Math.random() * 0.4;
    treeGroup.scale.set(s, s, s);
    return treeGroup;
  }

  private createRoundTree(x: number, z: number): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, -0.12, z);

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4E342E });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.4;
    treeGroup.add(trunk);

    const foliageGeo = new THREE.IcosahedronGeometry(1.8, 0);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A }); // Bright Leafy Green
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 3.5;
    treeGroup.add(foliage);

    const s = 0.7 + Math.random() * 0.5;
    treeGroup.scale.set(s, s, s);
    return treeGroup;
  }

  private createShrub(x: number, z: number): THREE.Group {
    const shrubGroup = new THREE.Group();
    shrubGroup.position.set(x, -0.12, z);

    const bushGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x388E3C });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.y = 0.4;
    shrubGroup.add(bush);

    const bush2 = bush.clone();
    bush2.scale.set(0.7, 0.7, 0.7);
    bush2.position.set(0.5, 0.3, 0.3);
    shrubGroup.add(bush2);

    const s = 0.8 + Math.random() * 0.6;
    shrubGroup.scale.set(s, s, s);
    return shrubGroup;
  }

  private addEnvironmentTrees(): void {
    const hw = this.floorWidth / 2;
    const hh = this.floorHeight / 2;
    const cx = this.baseFloorCenter.x;
    const cz = this.baseFloorCenter.y;

    // 1. Randomized Tree Groves (Clustered)
    // Create several "clumps" of trees for a natural forest look
    const groveCenters = [
      { x: cx - hw - 30, z: cz - hh - 10 }, // Top Left Cluster
      { x: cx + hw + 20, z: cz + hh + 15 }, // Bottom Right Cluster
      { x: cx - hw - 15, z: cz + hh + 40 }, // Front Left Cluster
      { x: cx + hw + 40, z: cz - hh - 20 }  // Back Right Cluster
    ];

    groveCenters.forEach(grove => {
      const treeCount = 6 + Math.floor(Math.random() * 8);
      for (let i = 0; i < treeCount; i++) {
        const jitterX = (Math.random() - 0.5) * 40;
        const jitterZ = (Math.random() - 0.5) * 40;
        const x = grove.x + jitterX;
        const z = grove.z + jitterZ;

        // Rectangular AABB check for safety (with larger tree buffer)
        if (Math.abs(x - cx) < hw + 12 && Math.abs(z - cz) < hh + 12) continue;

        const type = Math.random() > 0.5 ? 0 : 1;
        this.environmentGroup.add(type === 0 ? this.createConicalTree(x, z) : this.createRoundTree(x, z));
      }
    });

    // 3. Sparse Perimeter Fillers
    // A few individual trees to break up any remaining gaps
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(hw, hh) + 25 + Math.random() * 50;
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;

      // Final AABB safety check
      if (Math.abs(x - cx) < hw + 10 && Math.abs(z - cz) < hh + 10) continue;

      const type = Math.random() > 0.7 ? 0 : 1;
      this.environmentGroup.add(type === 0 ? this.createConicalTree(x, z) : this.createRoundTree(x, z));
    }

    console.log(`🌲 Rectangular AABB Environment set for building ${this.floorWidth}x${this.floorHeight} at center (${cx}, ${cz})`);
  }

  // --- Quick Access Helpers & Methods ---

  toggleQuickAccessConfig(): void {
    this.isQuickAccessConfigOn = !this.isQuickAccessConfigOn;
    if (this.isQuickAccessConfigOn) {
      this.openQa();
    } else {
      this.clearNavigation();
    }
    this.saveMapViewerState();
  }

  private async ensureAllFloorNavOptions(): Promise<void> {
    if (this.allFloorNavOptions.length > 0) return;
    if (this.allFloorSearchPromise) return this.allFloorSearchPromise;

    this.isNavSearchLoading = true;
    this.allFloorSearchPromise = (async () => {
      const floors = this.filteredFloors.length ? this.filteredFloors : (this.selectedFloor ? [this.selectedFloor] : []);
      await Promise.all(floors.map(floor => Promise.all([
        this.fetchFloorLocationDetails(floor),
        this.fetchFloorNodes(floor.id)
      ])));

      const options: IndoorNavLocationOption[] = [];
      floors.forEach(floor => {
        const floorData = this.floorDetails[floor.id];
        const nodes = this.allNodes[floor.id] ?? [];
        const roomNodes = nodes.filter(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) !== undefined);
        const roomNodeMap = new Map<number, NavNode>();
        roomNodes.forEach(node => roomNodeMap.set(this.getNodeLocationId(node)!, node));
        this.collectFloorNavOptions(floorData, floor, roomNodeMap, options);
      });
      this.allFloorNavOptions = options;
    })().finally(() => {
      this.isNavSearchLoading = false;
    });

    return this.allFloorSearchPromise;
  }

  private collectFloorNavOptions(
    location: LocationData | null | undefined,
    floor: any,
    roomNodeMap: Map<number, NavNode>,
    options: IndoorNavLocationOption[]
  ): void {
    if (!location) return;
    const node = roomNodeMap.get(location.id);
    if (node) {
      options.push({
        id: location.id,
        name: location.name,
        displayName: this.getLocationDisplayName(location),
        regionalName: location.regionalName,
        typeName: location.locationTypeName,
        floorId: floor.id,
        floorName: floor.name,
        floor,
        node,
        data: location
      });
    }
    (location.children ?? []).forEach(child => this.collectFloorNavOptions(child, floor, roomNodeMap, options));
  }

  private getCurrentFloorOption(room: RoomMesh): IndoorNavLocationOption | null {
    const node = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === room.id);
    if (!node || !this.selectedFloor) return null;
    return {
      id: room.id,
      name: room.data?.name ?? room.name,
      displayName: this.getLocationDisplayName(room.data),
      regionalName: room.data?.regionalName,
      typeName: room.data?.locationTypeName ?? 'Room',
      floorId: this.selectedFloor.id,
      floorName: this.selectedFloor.name,
      floor: this.selectedFloor,
      node,
      data: room.data
    };
  }

  private getOptionLabel(option: IndoorNavLocationOption): string {
    const name = (option.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    return match?.[1] ?? name;
  }

  getOptionDisplayName(option: IndoorNavLocationOption | null | undefined): string {
    return option?.displayName || option?.name || '';
  }

  private getLocationDisplayName(location: LocationData | null | undefined): string {
    return this.regionalLocationNameService.getDisplayName(location);
  }

  private isRoomNavNode(node: NavNode): boolean {
    return node.type === 'NT-RN';
  }

  private getNodeLocationId(node: NavNode): number | undefined {
    const locationId = node.location_id ?? (node as any).locationId;
    return locationId === undefined || locationId === null ? undefined : Number(locationId);
  }

  private refreshQaCategories(): void {
    this.qaCategories = this.getCategories();
    this.selectedQaCategory = null;
  }

  getCategories(): LocationCategory[] {
    const source = (this.allFloorNavOptions.length
      ? this.allFloorNavOptions
      : this.getNavRooms().map(r => this.getCurrentFloorOption(r)).filter((v): v is IndoorNavLocationOption => !!v)
    ).filter(option => option.floorId === this.selectedFloorId);
    const map = new Map<string, { name: string; rooms: IndoorNavLocationOption[] }>();
    source.forEach(option => {
      const catId = option.data?.locationCategoryId ?? 'other';
      const name = this.locationCategoryMap.get(catId) ?? this.formatCategoryName(catId);
      if (!map.has(catId)) map.set(catId, { name, rooms: [] });
      map.get(catId)!.rooms.push(option);
    });
    const qaFilter = this.mapConfig.categoryQuickAccess;
    return Array.from(map.entries())
      .filter(([catId]) => !qaFilter || qaFilter[catId] === true)
      .map(([catId, { name, rooms }]) => ({
        catId,
        name,
        color: getCategoryColor(catId, this.mapConfig.categoryColors),
        icon: getCategoryMaterialIcon(catId, this.mapConfig.categoryIcons),
        rooms
      }));
  }

  private formatCategoryName(catId: string): string {
    return catId
      .replace(/^lc[-_]/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Other';
  }

  getFilteredQaCategories(): LocationCategory[] {
    if (!this.selectedStartLocation) return this.qaCategories;
    return this.qaCategories.filter(cat =>
      cat.rooms.some(r => r.id !== this.selectedStartLocation!.id)
    );
  }

  getQaCategoryCount(cat: LocationCategory): number {
    return cat.rooms.filter(r => r.id !== this.selectedStartLocation?.id).length;
  }

  getQaLocations(): IndoorNavLocationOption[] {
    if (!this.selectedQaCategory) return [];
    return this.selectedQaCategory.rooms.filter(r => r.id !== this.selectedStartLocation?.id);
  }

  openQa(): void {
    this.isQaOpen = true;
    this.selectedQaCategory = null;
    void this.ensureAllFloorNavOptions().then(() => this.refreshQaCategories());
  }

  closeQa(): void { this.isQaOpen = false; this.selectedQaCategory = null; }

  getQaSingleLocation(cat: LocationCategory): IndoorNavLocationOption | null {
    const locs = cat.rooms.filter(r => r.id !== this.selectedStartLocation?.id);
    return locs.length === 1 ? locs[0] : null;
  }

  onQaCategoryClick(cat: LocationCategory, event: MouseEvent): void {
    const single = this.getQaSingleLocation(cat);
    if (single) {
      void this.selectFromQa(single);
    } else {
      this.selectQaCategory(cat, event);
    }
  }

  selectQaCategory(cat: LocationCategory, event: MouseEvent): void {
    this.selectedQaCategory = cat;
    const btn = event.currentTarget as HTMLElement;
    const wrap = btn.closest('.mv-qa-list');
    if (btn && wrap) {
      const btnRect = btn.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const rawTop = Math.max(0, Math.round(btnRect.top - wrapRect.top));
      const MIN_CARD_HEIGHT = 220;
      this.qaLocCardTop = Math.min(rawTop, Math.max(0, Math.round(wrapRect.height) - MIN_CARD_HEIGHT));
    } else {
      this.qaLocCardTop = 0;
    }
  }

  async selectFromQa(option: IndoorNavLocationOption): Promise<void> {
    this.closeQa();
    const isFloorSwitch = option.floorId !== this.selectedFloorId;
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setStartRoom(room, isFloorSwitch);
    this.selectedStartLocation = option;
    this.sourceLabel = option.displayName || option.name;
    this.clearDestination();
  }

  private fetchFloorLocationDetails(floorData: any): Promise<void> {
    if (this.floorDetails.hasOwnProperty(floorData.id)) return Promise.resolve();
    if (this.floorDetailFetchPromises[floorData.id]) return this.floorDetailFetchPromises[floorData.id];

    this.floorDetailFetchPromises[floorData.id] = new Promise<void>(resolve => {
      this.hospitalService.getLogicalLocationWithChildren(floorData.id).subscribe({
        next: res => {
          const floorLayout = res?.results ?? res;
          this.floorDetails[floorData.id] = floorLayout;
          this.regionalLocationNameService.applyToFloor(floorData.id, floorLayout).finally(resolve);
        },
        error: () => resolve()
      });
    });
    return this.floorDetailFetchPromises[floorData.id];
  }

  private fetchFloorNodes(floorId: number): Promise<void> {
    if (this.allNodes.hasOwnProperty(floorId)) return Promise.resolve();
    if (this.nodeFetchPromises[floorId]) return this.nodeFetchPromises[floorId];

    this.nodeFetchPromises[floorId] = new Promise<void>(resolve => {
      this.hospitalService.getNodePoints(floorId).subscribe({
        next: res => {
          const nodes = res?.results ?? res;
          this.allNodes[floorId] = Array.isArray(nodes) ? nodes : [];
          resolve();
        },
        error: () => {
          this.allNodes[floorId] = [];
          resolve();
        }
      });
    });
    return this.nodeFetchPromises[floorId];
  }

  private isValidNavRoom(id: number): boolean {
    return this.navNodes.some(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === id);
  }

  getNavRooms(): RoomMesh[] {
    return this.getActiveRoomMeshes().filter(r => this.isValidNavRoom(r.id));
  }

  private getRoomLabel(room: RoomMesh): string {
    const regionalLabel = this.getLocationDisplayName(room?.data);
    if (room?.data?.regionalName && regionalLabel) return regionalLabel;
    const name = (room?.data?.name ?? room?.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    return match?.[1] ?? name;
  }

  private keepRoomLabelMapSized(room: RoomMesh): void {
    const setHighlightScale: ((active: boolean) => void) | undefined = room.label?.userData['setHighlightScale'];
    setHighlightScale?.(false);
  }

  private setStartRoom(room: RoomMesh, isFloorSwitch = false): void {
    if (this.startRoom && this.startRoom !== room) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
    }
    this.startRoom = room;
    this.sourceLabel = this.getLocationDisplayName(room.data) || this.getRoomLabel(room);
    this.isSourceFromConfig = false;
    applyRoomHighlight(room, false, false, true, false);
    this.keepRoomLabelMapSized(room);
  }

  private setEndRoom(room: RoomMesh, instant = false): void {
    if (this.endRoom && this.endRoom !== room) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.clearRouteVisual();
    }
    this.endRoom = room;
    this.destinationSearchValue = this.getLocationDisplayName(room.data) || this.getRoomLabel(room);
    this.destinationSelectedRoomId = room.id;
    this.selectedDestinationLocation = this.getCurrentFloorOption(room);
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
    applyRoomHighlight(room, false, false, false, true);
    this.keepRoomLabelMapSized(room);
    this.focusOnDestinationRoom(room, instant);
  }

  private focusOnDestinationRoom(room: RoomMesh, instant = false): void {
    if (this.scene) {
      this.scene.updateMatrixWorld(true);
    }
    const bounds = new THREE.Box3().setFromObject(room.floor);
    if (bounds.isEmpty()) return;
    this.focusOnBoundsForView(bounds, this.viewMode === '2d' ? 3.0 : 3.5, instant);
  }

  private clearStartSelection(): void {
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    this.sourceLabel = 'Select source location';
    this.selectedStartLocation = null;
    this.animatedFloors.clear();
  }

  clearDestination(): void {
    this.destinationSearchValue = '';
    this.destinationSelectedRoomId = null;
    this.selectedDestinationLocation = null;
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
    this.isDestDropdownOpen = false;
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }
    this.clearRouteVisual();
  }

  private clearRouteVisual(): void {
    if (this.routeGroup) {
      this.cleanupService.disposeGroup(this.routeGroup, this.scene);
      this.routeGroup = null;
    }
    if (this.person) {
      this.cleanupService.disposeGroup(this.person, this.scene);
      this.person = null;
    }
    this.activePathStartNode = null;
    this.activePathEndNode = null;
    this.pathPoints = [];
    this.pathSteps = [];
    this.isStepsOpen = false;
    this.routeDistance = '';
    this.routeTime = '';
    this.isJourneyStarted = false;
    this.movementState = { isMoving: false, currentPathIndex: 0, moveProgress: 0 };
    if (this.routeAnimationTimer) {
      clearTimeout(this.routeAnimationTimer);
      this.routeAnimationTimer = null;
    }
    this.pathAnimating = false;
    this.pathAnimComplete = false;
    this.routeRibbonMesh = null;
    this.routeRibbonTotalIndices = 0;
    this.pathTotalLength = 0;
    this.pathRevealTriggered = false;
    this.routeCameraFollowActive = false;
    this.lastFrameTime = 0;
  }

  clearNavigation(): void {
    this.clearRouteVisual();
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }
    this.selectedStartLocation = null;
    this.selectedDestinationLocation = null;
    this.sourceLabel = 'Select source location';
    this.destinationSearchValue = '';
    this.destinationSelectedRoomId = null;
    this.isDestDropdownOpen = false;
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
    this.updateLabelVisibility();
  }

  // --- Search Box suggestions ---

  getDestSuggestions(): IndoorNavLocationOption[] {
    return this.getAllFloorSuggestions(this.destinationSearchValue, this.selectedStartLocation?.id);
  }

  onDestinationInput(): void {
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
      this.clearRouteVisual();
    }
    this.destinationSelectedRoomId = null;
    this.isDestDropdownOpen = true;
    void this.ensureAllFloorNavOptions();
  }

  openDestDropdown(): void {
    this.isDestDropdownOpen = true;
    void this.ensureAllFloorNavOptions();
  }

  async selectDestination(option: IndoorNavLocationOption): Promise<void> {
    this.isDestDropdownOpen = false;
    this.selectedDestinationLocation = option;
    const isFloorSwitch = option.floorId !== this.selectedFloorId;
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setEndRoom(room, isFloorSwitch);
  }

  private async resolveSearchOptionRoom(option: IndoorNavLocationOption): Promise<RoomMesh | null> {
    if (option.floorId !== this.selectedFloorId) {
      await this.switchToSearchFloor(option.floor);
    }
    return this.getNavRooms().find(room => room.id === option.id) ?? null;
  }

  private async switchToSearchFloor(floor: any): Promise<void> {
    if (floor?.id === this.selectedFloorId) return;
    this.isLoading = true;
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    this.clearRouteVisual();
    await this.fetchFloorLocationDetails(floor);
    await this.fetchFloorNodes(floor.id);
    this.selectedFloor = floor;
    this.selectedFloorId = floor.id;
    await this.loadBlockFloors();
  }

  // --- Multi-floor helpers ---

  private getLiftStairNodes(floorId: number): Array<{ node: NavNode; locationId?: number; name: string }> {
    const nodes = this.allNodes[floorId] || [];
    const floorLayout = this.floorDetails[floorId];
    
    const findLocationById = (loc: any, id: number): any => {
      if (!loc) return null;
      if (loc.id === id) return loc;
      for (const child of loc.children || []) {
        const found = findLocationById(child, id);
        if (found) return found;
      }
      return null;
    };

    const results: Array<{ node: NavNode; locationId?: number; name: string }> = [];

    nodes.forEach(node => {
      let isMatch = false;
      let name = '';
      const locId = node.location_id ?? (node as any).locationId;

      if (node.locationName && /lift|stair|elev|escalat/i.test(node.locationName)) {
        isMatch = true;
        name = node.locationName;
      }

      if (!isMatch && locId !== undefined && locId !== null && floorLayout) {
        const loc = findLocationById(floorLayout, Number(locId));
        if (loc) {
          const locName = loc.name || '';
          const dispName = loc.displayName || '';
          const typeName = loc.locationTypeName || '';
          const catId = loc.locationCategoryId || '';
          if (/lift|stair|elev|escalat/i.test(locName) ||
              /lift|stair|elev|escalat/i.test(dispName) ||
              /lift|stair|elev|escalat/i.test(typeName) ||
              /lift|stair|elev|escalat/i.test(catId)) {
            isMatch = true;
            name = dispName || locName;
          }
        }
      }

      if (isMatch) {
        results.push({
          node,
          locationId: locId ? Number(locId) : undefined,
          name: name || `Lift/Stair (${node.id})`
        });
      }
    });

    return results;
  }

  private findNearestLiftOrStair(
    fromNode: NavNode,
    floorId: number
  ): { node: NavNode; locationId?: number; name: string } | null {
    const liftStairNodes = this.getLiftStairNodes(floorId);
    if (liftStairNodes.length === 0) return null;

    let shortestPathLength = Infinity;
    let nearestNodeInfo: { node: NavNode; locationId?: number; name: string } | null = null;

    const nodes = this.allNodes[floorId] || [];
    const graph = this.navigationService.constructNodeGraph(nodes);

    liftStairNodes.forEach(info => {
      const path = this.navigationService.findShortestNodePath(
        fromNode.id, info.node.id, nodes, graph
      );
      if (path) {
        let dist = 0;
        for (let i = 1; i < path.length; i++) {
          const nA = nodes.find(n => n.id === path[i - 1])!;
          const nB = nodes.find(n => n.id === path[i])!;
          dist += Math.sqrt(Math.pow(nB.x - nA.x, 2) + Math.pow(nB.y - nA.y, 2));
        }
        if (dist < shortestPathLength) {
          shortestPathLength = dist;
          nearestNodeInfo = info;
        }
      }
    });

    if (!nearestNodeInfo) {
      let minStraightDist = Infinity;
      liftStairNodes.forEach(info => {
        const dx = info.node.x - fromNode.x;
        const dy = info.node.y - fromNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minStraightDist) {
          minStraightDist = dist;
          nearestNodeInfo = info;
        }
      });
    }

    return nearestNodeInfo;
  }

  private findMatchingLiftOrStairNode(
    sourceLiftName: string,
    targetFloorId: number
  ): { node: NavNode; locationId?: number; name: string } | null {
    const liftStairNodes = this.getLiftStairNodes(targetFloorId);
    if (liftStairNodes.length === 0) return null;

    const normalize = (s: string) => (s || '').toLowerCase().replace(/[\s-_]/g, '');
    const sourceNameNorm = normalize(sourceLiftName);

    let match = liftStairNodes.find(info => normalize(info.name) === sourceNameNorm);
    if (match) return match;

    match = liftStairNodes.find(info => {
      const nameNorm = normalize(info.name);
      return nameNorm.includes(sourceNameNorm) || sourceNameNorm.includes(nameNorm);
    });
    if (match) return match;

    if (this.selectedDestinationLocation) {
      const nearestToDest = this.findNearestLiftOrStair(
        this.selectedDestinationLocation.node,
        targetFloorId
      );
      if (nearestToDest) return nearestToDest;
    }

    return liftStairNodes[0];
  }

  private applyMultiFloorRoute(): void {
    if (!this.multiFloorRouteActive) return;

    const currentFloorId = this.selectedFloorId;
    if (!currentFloorId) return;

    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }

    if (currentFloorId === this.selectedStartLocation?.floorId) {
      const startRoomMesh = this.roomMeshes.find(r => r.id === this.selectedStartLocation!.id);
      if (startRoomMesh) {
        this.startRoom = startRoomMesh;
        applyRoomHighlight(startRoomMesh, false, false, true, false);
        this.keepRoomLabelMapSized(startRoomMesh);
      }
      if (this.multiFloorStartLiftLocationId) {
        const liftRoomMesh = this.roomMeshes.find(r => r.id === this.multiFloorStartLiftLocationId);
        if (liftRoomMesh) {
          this.endRoom = liftRoomMesh;
          applyRoomHighlight(liftRoomMesh, false, false, false, false);
          this.keepRoomLabelMapSized(liftRoomMesh);
        }
      }
    } else if (currentFloorId === this.selectedDestinationLocation?.floorId) {
      if (this.multiFloorDestLiftLocationId) {
        const liftRoomMesh = this.roomMeshes.find(r => r.id === this.multiFloorDestLiftLocationId);
        if (liftRoomMesh) {
          this.startRoom = liftRoomMesh;
          applyRoomHighlight(liftRoomMesh, false, false, false, false);
          this.keepRoomLabelMapSized(liftRoomMesh);
        }
      }
      const destRoomMesh = this.roomMeshes.find(r => r.id === this.selectedDestinationLocation!.id);
      if (destRoomMesh) {
        this.endRoom = destRoomMesh;
        applyRoomHighlight(destRoomMesh, false, false, false, true);
        this.keepRoomLabelMapSized(destRoomMesh);
      }
    }

    this.calculateRoute();
  }

  private getAllFloorSuggestions(query: string, excludeRoomId?: number | null): IndoorNavLocationOption[] {
    const q = (query ?? '').trim().toLowerCase();
    const source = this.allFloorNavOptions.length
      ? this.allFloorNavOptions
      : this.getNavRooms().map(room => this.getCurrentFloorOption(room)).filter((v): v is IndoorNavLocationOption => !!v);
    return source.filter(option => {
      if (option.id === excludeRoomId) return false;
      if (!q) return true;
      const label = this.getOptionLabel(option).toLowerCase();
      return label.includes(q)
        || option.name.toLowerCase().includes(q)
        || option.displayName.toLowerCase().includes(q)
        || (option.regionalName ?? '').toLowerCase().includes(q)
        || option.floorName.toLowerCase().includes(q)
        || (option.typeName ?? '').toLowerCase().includes(q);
    });
  }

  private findFloorById(floorId: number): any {
    for (const block of this.blockWithFloorList as any[]) {
      const floor = (block.children || []).find((f: any) => f.id === floorId);
      if (floor) return floor;
    }
    return null;
  }

  public switchToFloor(floorId: number | undefined): void {
    if (!floorId) return;
    const floor = this.findFloorById(floorId);
    if (floor) {
      this.selectedFloor = floor;
      this.selectedFloorId = floor.id;
      this.floorChanged.emit(floor.id);
      void this.loadBlockFloors().then(() => {
        this.applyMultiFloorRoute();
      });
    }
  }

  isMultiFloorScenario(): boolean {
    return !!this.selectedStartLocation && 
           !!this.selectedDestinationLocation && 
           this.selectedStartLocation.floorId !== this.selectedDestinationLocation.floorId;
  }

  public onDirectionClick(): void {
    this.isQaOpen = false;
    this.selectedQaCategory = null;
    this.animatedFloors.clear();

    if (this.isMultiFloorScenario()) {
      const startFloorId = this.selectedStartLocation!.floorId;
      if (this.selectedFloorId !== startFloorId) {
        this.multiFloorRouteActive = true;
        void this.ensureAllFloorNavOptions().then(() => {
          const startLift = this.findNearestLiftOrStair(
            this.selectedStartLocation!.node,
            this.selectedStartLocation!.floorId
          );
          if (startLift) {
            this.multiFloorStartLiftNode = startLift.node;
            this.multiFloorStartLiftLocationId = startLift.locationId ?? null;

            const destLift = this.findMatchingLiftOrStairNode(
              startLift.name,
              this.selectedDestinationLocation!.floorId
            );
            if (destLift) {
              this.multiFloorDestLiftNode = destLift.node;
              this.multiFloorDestLiftLocationId = destLift.locationId ?? null;
            }
          } else {
            const destLift = this.findNearestLiftOrStair(
              this.selectedDestinationLocation!.node,
              this.selectedDestinationLocation!.floorId
            );
            if (destLift) {
              this.multiFloorDestLiftNode = destLift.node;
              this.multiFloorDestLiftLocationId = destLift.locationId ?? null;

              const startLiftMatching = this.findMatchingLiftOrStairNode(
                destLift.name,
                this.selectedStartLocation!.floorId
              );
              if (startLiftMatching) {
                this.multiFloorStartLiftNode = startLiftMatching.node;
                this.multiFloorStartLiftLocationId = startLiftMatching.locationId ?? null;
              }
            }
          }
          this.switchToFloor(startFloorId);
        });
        return;
      }
    }

    this.calculateRoute();
  }

  // --- Animation Helpers ---

  private focusOnBoundsForView(bounds: THREE.Box3, distanceMultiplier: number, instant = false): void {
    if (this.landingResetTimer) {
      clearTimeout(this.landingResetTimer);
      this.landingResetTimer = null;
    }
    if (this.viewMode !== '2d') {
      if (instant) {
        const center = new THREE.Vector3();
        bounds.getCenter(center);
        const size = new THREE.Vector3();
        bounds.getSize(size);
        const maxDim = Math.max(size.x, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const baseDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        const dist = Math.max(baseDist * distanceMultiplier, FOCUS_ROOM_MIN_DISTANCE);
        
        const currentSpherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
        const def = this.mapConfig.floorDefaults?.[String(this.selectedFloorId)];
        const spherical = new THREE.Spherical(dist, def?.phi ?? currentSpherical.phi, def?.theta ?? currentSpherical.theta);
        const targetCam = center.clone().add(new THREE.Vector3().setFromSpherical(spherical));
        
        this.controls.target.copy(center);
        this.camera.position.copy(targetCam);
        this.controls.update();
        this.updateLabelVisibility();
        return;
      }
      this.cameraAnimationService.focusOnBounds(bounds, this.camera, this.controls, () => this.updateLabelVisibility(), distanceMultiplier);
      return;
    }

    if (bounds.isEmpty()) return;

    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    const maxDim = Math.max(size.x, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const baseDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    const dist = Math.max(baseDist * distanceMultiplier, FOCUS_ROOM_MIN_DISTANCE);
    const targetCam = new THREE.Vector3(center.x, center.y + dist, center.z);

    if (instant) {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
      this.controls.target.copy(center);
      this.camera.position.copy(targetCam);
      this.controls.update();
      this.updateLabelVisibility();
      return;
    }

    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = 0;
    this.controls.enableRotate = false;
    this.cameraAnimationService.animateCamera(
      this.camera, this.controls,
      startCam, targetCam,
      startTarget, center,
      this.routeCameraTransitionDuration,
      () => this.updateLabelVisibility()
    );
  }

  private getPathPositionAt(t: number): THREE.Vector3 {
    const pts = this.pathPoints;
    if (!pts.length) return new THREE.Vector3();
    if (t <= 0) return pts[0].clone();
    if (t >= 1) return pts[pts.length - 1].clone();
    const targetLen = t * this.pathTotalLength;
    let cum = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = pts[i].distanceTo(pts[i + 1]);
      if (cum + seg >= targetLen) {
        const lt = seg > 0 ? (targetLen - cum) / seg : 0;
        return new THREE.Vector3().lerpVectors(pts[i], pts[i + 1], lt);
      }
      cum += seg;
    }
    return pts[pts.length - 1].clone();
  }

  private fitFullRouteAfterArrival(instant = false): void {
    const bounds = this.getRouteBounds();
    if (bounds.isEmpty()) return;

    const multiplier = this.getResponsiveRouteFitMultiplier();
    if (this.viewMode === '2d') {
      this.focusOnBoundsForView(bounds, multiplier, instant);
      this.controls.enablePan = false;
    } else {
      this.focusOnRouteBounds3d(bounds, multiplier, instant);
    }
  }

  private getRouteBounds(): THREE.Box3 {
    if (this.scene) {
      this.scene.updateMatrixWorld(true);
    }
    const bounds = new THREE.Box3();
    if (this.startRoom) bounds.expandByObject(this.startRoom.floor);
    if (this.endRoom) bounds.expandByObject(this.endRoom.floor);
    if (this.routeGroup) bounds.expandByObject(this.routeGroup);
    return bounds;
  }

  private getRouteWorldPoint(point: THREE.Vector3): THREE.Vector3 {
    const worldPoint = point.clone();
    if (this.routeGroup?.parent) {
      this.routeGroup.parent.localToWorld(worldPoint);
    }
    return worldPoint;
  }

  private panCameraTowardRoutePoint(point: THREE.Vector3, factor: number): void {
    const worldPoint = this.getRouteWorldPoint(point);
    const target = new THREE.Vector3(worldPoint.x, this.controls.target.y, worldPoint.z);
    const delta = target.sub(this.controls.target).multiplyScalar(factor);
    this.controls.target.add(delta);
    this.camera.position.add(delta);
  }

  private getResponsiveRouteFitMultiplier(): number {
    const width = this.renderer?.domElement?.clientWidth ?? window.innerWidth;
    const height = this.renderer?.domElement?.clientHeight ?? window.innerHeight;
    const aspect = width / Math.max(height, 1);

    if (width < 640 || aspect < 0.9) return 2.5;
    if (width < 1024 || aspect < 1.2) return 2.15;
    return 1.8;
  }

  private focusOnRouteStartForNavigation(instant = false): void {
    if (this.scene) {
      this.scene.updateMatrixWorld(true);
    }
    const bounds = new THREE.Box3();
    if (this.startRoom) bounds.expandByObject(this.startRoom.floor);

    const previewCount = Math.max(2, Math.ceil(this.pathPoints.length * 0.25));
    this.pathPoints.slice(0, previewCount).forEach(point => bounds.expandByPoint(this.getRouteWorldPoint(point)));
    if (bounds.isEmpty()) return;

    const multiplier = this.getResponsiveRouteFitMultiplier() * 1.25;
    if (this.viewMode === '2d') {
      this.focusOnBoundsForView(bounds, multiplier, instant);
      this.controls.enablePan = false;
    } else {
      this.focusOnRouteBounds3d(bounds, multiplier, instant);
    }

    this.routeCameraFollowActive = true;
  }

  private startRouteRevealAfterCameraFit(instant = false): void {
    if (this.routeAnimationTimer) clearTimeout(this.routeAnimationTimer);
    const delay = instant ? 100 : (this.routeCameraTransitionDuration + 80);
    this.routeAnimationTimer = setTimeout(() => {
      this.routeAnimationTimer = null;
      this.pathAnimStartTime = performance.now();
      this.pathAnimating = true;
    }, delay);
  }

  private focusOnRouteBounds3d(bounds: THREE.Box3, distanceMultiplier: number, instant = false): void {
    if (this.landingResetTimer) {
      clearTimeout(this.landingResetTimer);
      this.landingResetTimer = null;
    }
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    const maxDim = Math.max(size.x, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const baseDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    const dist = Math.max(
      this.controls.minDistance,
      Math.min(this.controls.maxDistance, Math.max(baseDist * distanceMultiplier, FOCUS_ROOM_MIN_DISTANCE))
    );

    const currentSpherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const def = this.mapConfig.floorDefaults?.[String(this.selectedFloorId)];
    const spherical = new THREE.Spherical(dist, def?.phi ?? currentSpherical.phi, def?.theta ?? currentSpherical.theta);
    const targetCam = center.clone().add(new THREE.Vector3().setFromSpherical(spherical));

    if (instant) {
      this.controls.target.copy(center);
      this.camera.position.copy(targetCam);
      this.controls.update();
      this.updateLabelVisibility();
      return;
    }

    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    this.cameraAnimationService.animateCamera(
      this.camera, this.controls,
      startCam, targetCam,
      startTarget, center,
      this.routeCameraTransitionDuration,
      () => this.updateLabelVisibility()
    );
  }

  private generatePathSteps(pts: any[]): PathStep[] {
    if (pts.length < 2) return [];
    const steps: PathStep[] = [];
    const startName = this.startRoom ? this.getLocationDisplayName(this.startRoom.data) || this.sourceLabel : this.sourceLabel;
    const endName = this.endRoom ? this.getLocationDisplayName(this.endRoom.data) || this.destinationSearchValue : this.destinationSearchValue;

    steps.push({ instruction: `Start at ${startName}`, distance: '', icon: 'start' });

    let segDist = 0;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const dx = curr.x - prev.x;
      const dz = curr.z - prev.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      segDist += d;

      if (i < pts.length - 1) {
        const next = pts[i + 1];
        const v1 = new THREE.Vector2(dx, dz).normalize();
        const v2 = new THREE.Vector2(next.x - curr.x, next.z - curr.z).normalize();
        const cross = v1.x * v2.y - v1.y * v2.x;
        const dot = v1.dot(v2);
        const angleDeg = Math.abs(Math.atan2(Math.abs(cross), dot) * (180 / Math.PI));

        if (angleDeg > 20) {
          const distLabel = `${segDist.toFixed(0)}m`;
          if (angleDeg < 35) {
            steps.push({ instruction: cross > 0 ? 'Slight right' : 'Slight left', distance: distLabel, icon: cross > 0 ? 'turn-right' : 'turn-left' });
          } else if (angleDeg < 100) {
            steps.push({ instruction: cross > 0 ? 'Turn right' : 'Turn left', distance: distLabel, icon: cross > 0 ? 'turn-right' : 'turn-left' });
          } else {
            steps.push({ instruction: cross > 0 ? 'Sharp right' : 'Sharp left', distance: distLabel, icon: cross > 0 ? 'turn-right' : 'turn-left' });
          }
          segDist = 0;
        }
      }
    }

    if (segDist > 0.5) {
      steps.push({ instruction: 'Continue straight', distance: `${segDist.toFixed(0)}m`, icon: 'straight' });
    }
    steps.push({ instruction: `Arrive at ${endName}`, distance: '', icon: 'arrive' });
    return steps;
  }

  private updateDestCalloutPosition(): void {
    const el = this.destCalloutEl?.nativeElement;
    if (!el || !this.endRoom || !this.startRoom || this.routeDistance || !this.camera) {
      if (el) el.style.visibility = 'hidden';
      return;
    }

    const box = new THREE.Box3().setFromObject(this.endRoom.floor);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);
    worldCenter.y += 2;
    worldCenter.project(this.camera);

    if (worldCenter.z > 1) { el.style.visibility = 'hidden'; return; }

    const canvas = this.renderer?.domElement;
    if (!canvas) return;
    const x = (worldCenter.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-worldCenter.y * 0.5 + 0.5) * canvas.clientHeight;

    el.style.visibility = 'visible';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }

  private projectNodeToScreen(node: NavNode): { x: number; y: number } | null {
    if (!this.camera || !this.renderer || !node) return null;
    const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
    const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
    const worldPos = new THREE.Vector3(node.x - xOff, 0, node.y - zOff);
    if (this.buildingGroup) this.buildingGroup.localToWorld(worldPos);
    const projected = worldPos.clone().project(this.camera);
    if (projected.z > 1) return null;
    const canvas = this.renderer.domElement;
    return {
      x: (projected.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-projected.y * 0.5 + 0.5) * canvas.clientHeight,
    };
  }

  private updateNavMarkerPositions(): void {
    const src = this.sourceMarkerEl?.nativeElement;
    if (src) {
      const pos = this.activePathStartNode ? this.projectNodeToScreen(this.activePathStartNode) : null;
      if (pos) {
        src.style.visibility = 'visible';
        src.style.left = pos.x + 'px';
        src.style.top = pos.y + 'px';
      } else {
        src.style.visibility = 'hidden';
      }
    }
    const dst = this.destMarkerEl?.nativeElement;
    if (dst) {
      const pos = this.activePathEndNode ? this.projectNodeToScreen(this.activePathEndNode) : null;
      if (pos) {
        dst.style.visibility = 'visible';
        dst.style.left = pos.x + 'px';
        dst.style.top = pos.y + 'px';
      } else {
        dst.style.visibility = 'hidden';
      }
    }
  }

  private updateYouAreHerePosition(): void {
    const el = this.youAreHereEl?.nativeElement;
    if (!el || !this.startRoom || this.routeDistance || !this.camera) {
      if (el) el.style.visibility = 'hidden';
      return;
    }

    const box = new THREE.Box3().setFromObject(this.startRoom.floor);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);
    worldCenter.y += 2;
    worldCenter.project(this.camera);

    if (worldCenter.z > 1) { el.style.visibility = 'hidden'; return; }

    const canvas = this.renderer?.domElement;
    if (!canvas) return;
    const x = (worldCenter.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-worldCenter.y * 0.5 + 0.5) * canvas.clientHeight;

    el.style.visibility = 'visible';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }

  public getFormattedFloorName(floorName: string | undefined): string {
    if (!floorName) return '';
    const lower = floorName.toLowerCase().trim();
    if (lower === 'ground') return 'Ground Floor';
    if (lower === 'first') return 'First Floor';
    if (lower === 'second') return 'Second Floor';
    if (lower === 'third') return 'Third Floor';
    if (lower.endsWith('floor')) {
      return floorName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    const capitalized = floorName.charAt(0).toUpperCase() + floorName.slice(1).toLowerCase();
    return `${capitalized} Floor`;
  }

  refreshMapView(): void {
    const floorId = this.selectedFloorId;
    if (!floorId) return;

    this.isLoading = true;
    this.noDataFound = false;

    // Clear caches for the current floor so they are fetched fresh
    delete this.floorDetails[floorId];
    delete this.allNodes[floorId];

    // Re-fetch logical location details with children (layout)
    this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe({
      next: (res) => {
        this.floorDetails[floorId] = res.results;
        this.regionalLocationNameService.applyToFloor(floorId, this.floorDetails[floorId]).finally(() => {
          // Re-fetch navigation nodes
          this.hospitalService.getNodePoints(floorId).subscribe({
            next: (nodeRes) => {
              this.allNodes[floorId] = nodeRes.results;
              // Re-fetch readers and rebuild the scene
              this.loadBlockFloors().finally(() => {
                this.isLoading = false;
              });
            },
            error: (err) => {
              console.error('Error fetching navigation nodes during refresh:', err);
              // Fallback: try loading block floors anyway
              this.loadBlockFloors().finally(() => {
                this.isLoading = false;
              });
            }
          });
        });
      },
      error: (err) => {
        console.error('Error fetching floor details during refresh:', err);
        this.isLoading = false;
      }
    });
  }
}
