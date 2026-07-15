import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Injector,
  HostListener
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { Vector2 as ThreeVector2 } from 'three';

import { ThreeMapBase } from '../three-map-base.component';
import { LocationData, NavNode, RoomMesh } from '../../models';
import {
  SceneService,
  CameraService,
  RendererService,
  ControlsService,
  AnimationService,
  CleanupService,
  CameraAnimationService,
  LabelVisibilityService,
  RouteVisualizationService,
  PersonMovementService,
  InteractionService
} from '../../services';
import { applyRoomHighlight, createPerson, getCategoryColor, getCategoryMaterialIcon } from '../../helpers';

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
import { FOCUS_ROOM_MIN_DISTANCE, PERSON_BASE_MOVE_SPEED, FLOOR_MAX_DISTANCE_MULTIPLIER, FLOOR_MIN_DISTANCE_MULTIPLIER, FLOOR_MIN_DISTANCE_ABSOLUTE, ROUTE_RIBBON_WIDTH } from '../../constants/map.constants';
import { environment } from '../../../../../../../environments/environment';
import { MovementState } from '../../services/person-movement.service';
import { AppToastService } from '../../../../../../shared/services/toaster.service';

@Component({
  selector: 'app-indoor-path',
  standalone: false,
  templateUrl: './indoor-path.component.html',
  styleUrls: ['./indoor-path.component.scss'],
  providers: [
    SceneService,
    CameraService,
    RendererService,
    ControlsService,
    AnimationService,
    CleanupService,
    CameraAnimationService,
    LabelVisibilityService
  ]
})
export class IndoorPathComponent extends ThreeMapBase implements OnInit, OnDestroy {

  /** Persists source room ID for the app session across component re-creation */
  private static savedSourceId: number | null = null;

  /** Decoded nav query-param waiting to be applied once the target floor is loaded */
  private pendingNavConfig: { sfi: number; sli: number; sni: number; dfi: number | null; dli: number | null; dni: number | null } | null = null;

  // Map view mode: 'default' = no surroundings, 'urban' = OSM tiles
  mapViewMode: 'urban' | 'default' = 'default';

  @ViewChild('canvasContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;

  @ViewChild('youAreHereEl')
  private youAreHereEl?: ElementRef<HTMLDivElement>;

  @ViewChild('destCalloutEl')
  private destCalloutEl?: ElementRef<HTMLDivElement>;

  // --- Navigation state ---
  startRoom: RoomMesh | null = null;
  selectedStartLocation: IndoorNavLocationOption | null = null;
  endRoom: RoomMesh | null = null;
  private routeGroup: THREE.Group | null = null;
  private person: THREE.Group | null = null;
  @ViewChild('sourceMarkerEl') private sourceMarkerEl?: ElementRef<HTMLDivElement>;
  @ViewChild('destMarkerEl') private destMarkerEl?: ElementRef<HTMLDivElement>;

  // --- Multi-floor state ---
  multiFloorRouteActive = false;
  selectedDestinationLocation: IndoorNavLocationOption | null = null;
  multiFloorStartLiftNode: NavNode | null = null;
  multiFloorDestLiftNode: NavNode | null = null;
  multiFloorStartLiftLocationId: number | null = null;
  multiFloorDestLiftLocationId: number | null = null;
  activePathStartNode: NavNode | null = null;
  activePathEndNode: NavNode | null = null;
  private animatedFloors = new Set<number>();

  // Path draw animation
  private pathAnimating = false;
  pathAnimComplete = false;
  private pathAnimStartTime = 0;
  private pathAnimDuration = 1200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private routeRibbonMesh: any = null;
  private routeRibbonTotalIndices = 0;
  private pathTotalLength = 0;
  private pathRevealTriggered = false;
  private routeCameraFollowActive = false;
  private routeAnimationTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFrameTime = 0;
  private pathPoints: THREE.Vector3[] = [];
  private moveSpeed = PERSON_BASE_MOVE_SPEED;
  private movementState: MovementState = { isMoving: false, currentPathIndex: 0, moveProgress: 0 };

  routeDistance = '';
  routeTime = '';
  isJourneyStarted = false;
  navQrUrl = '';
  isQrModalOpen = false;
  qrCopied = false;

  openQrModal(): void { this.isQrModalOpen = true; }
  closeQrModal(): void { this.isQrModalOpen = false; this.qrCopied = false; }

  copyNavUrl(): void {
    if (!this.navQrUrl) return;
    navigator.clipboard.writeText(this.navQrUrl).then(() => {
      this.qrCopied = true;
      setTimeout(() => { this.qrCopied = false; }, 2000);
    });
  }

  // --- Source (pre-configured or manual) ---
  sourceLabel = 'Select source location';
  isSourceFromConfig = false;

  // --- Destination search ---
  destinationSearchValue = '';
  destinationSelectedRoomId: number | null = null;
  isDestDropdownOpen = false;
  isNavSearchLoading = false;
  private allFloorNavOptions: IndoorNavLocationOption[] = [];
  private allFloorSearchPromise: Promise<void> | null = null;

  // --- Quick Access panel ---
  isQaOpen = true;
  selectedQaCategory: LocationCategory | null = null;
  qaCategories: LocationCategory[] = [];
  qaLocCardTop = 0;
  private locationCategoryMap: Map<string, string> = new Map();
  private locationCategoryMapLoaded = false;

  // --- Rotate mode toggle ---
  isRotateMode = false;

  toggleRotateMode(): void {
    this.isRotateMode = !this.isRotateMode;
    this.allowRotate = this.isRotateMode;
    this.controls.mouseButtons.LEFT = this.isRotateMode ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
  }

  // --- 2D / 3D view mode ---
  viewMode: '2d' | '3d' = '3d';

  private outdoorBlock: any = null;
  private outdoorFloorId: number | null = null;
  private outdoorGroup: THREE.Group | null = null;
  private outdoorRoomMeshes: RoomMesh[] = [];
  private lastBuildingOpacity: number | null = null;
  private originalMaterialState = new WeakMap<THREE.Material, {
    color?: THREE.Color;
    opacity?: number;
    transparent?: boolean;
  }>();

  // --- Label size (S=0.75 / M=1.0 / L=1.3 / XL=1.6 relative to compact map-label base) ---
  private readonly indoorLabelBaseScale = 2.2;
  protected override labelScale = this.indoorLabelBaseScale;
  locationFontSize: 12 | 14 | 16 | 18 = 14;
  private currentLabelMultiplier = 1.0;
  isNavSettingsSaving = false;
  navSettingsSaveStatus: '' | 'success' | 'error' = '';
  private navSettingsSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private landingResetTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly routeCameraTransitionDuration = 1000;

  onViewModeChange(mode: '2d' | '3d'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    if (mode === '2d') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
      if (this.isRotateMode) {
        this.isRotateMode = false;
        this.allowRotate = false;
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        this.renderer.domElement.style.cursor = 'grab';
      }
      const target = this.controls.target.clone();
      const dist = this.camera.position.distanceTo(target);
      const topDownCam = new THREE.Vector3(target.x, dist, target.z);
      this.cameraAnimationService.animateCamera(
        this.camera, this.controls,
        this.camera.position.clone(), topDownCam,
        target, target, 600, () => this.updateLabelVisibility()
      );
    } else {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI / 4;
      this.controls.enableRotate = true;
      // Restore pan if it was locked while showing a route in 2D
      this.controls.enablePan = true;
      this.controls.update();
    }
  }

  // --- Floor default camera (saved zoom / rotation per floor in map-config) ---
  private applyFloorDefaultCamera(): void {
    const def = this.mapConfig.floorDefaults?.[String(this.selectedFloorId)];
    if (!def || !this.controls || !this.camera) return;

    const clamped = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, def.distance));

    if (this.viewMode === '2d') {
      // 2D: apply zoom distance only — keep the top-down Y-axis position
      const target = this.controls.target.clone();
      this.camera.position.set(target.x, clamped, target.z);
    } else {
      // 3D: restore full spherical state (distance + tilt phi + rotation theta)
      const spherical = new THREE.Spherical(clamped, def.phi, def.theta);
      const offset = new THREE.Vector3().setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(offset);
    }

    this.controls.update();
    this.updateLabelVisibility();
  }

  private enforce2dCameraAngle(): void {
    if (!this.controls || !this.camera) return;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = 0;
    this.controls.enableRotate = false;
    const target = this.controls.target.clone();
    const dist = this.camera.position.distanceTo(target);
    this.camera.position.set(target.x, target.y + dist, target.z);
    this.controls.update();
    this.updateLabelVisibility();
  }

  private applyLoadedViewSettings(): void {
    if (!this.controls || !this.camera || !this.selectedFloorId || this.roomMeshes.length === 0) return;
    if (this.viewMode === '2d') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
      this.enforce2dCameraAngle();
    } else {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI / 4;
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.update();
    }
    this.applyFloorDefaultCamera();
  }

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

  private focusOnDestinationRoom(room: RoomMesh, instant = false): void {
    if (this.scene) {
      this.scene.updateMatrixWorld(true);
    }
    const bounds = new THREE.Box3().setFromObject(room.floor);
    if (bounds.isEmpty()) return;
    this.focusOnBoundsForView(bounds, this.viewMode === '2d' ? 3.0 : 3.5, instant);
  }

  private keepRoomLabelMapSized(room: RoomMesh): void {
    const setHighlightScale: ((active: boolean) => void) | undefined = room.label?.userData['setHighlightScale'];
    setHighlightScale?.(false);
  }

  // --- Label scale helpers ---
  private fontSizeToScale(size: number): number {
    const map: Record<number, number> = { 12: 0.75, 14: 1.0, 16: 1.3, 18: 1.6 };
    return map[size] ?? 1.0;
  }

  private scaleToFontSize(scale: number): 12 | 14 | 16 | 18 {
    const pairs: Array<[12 | 14 | 16 | 18, number]> = [[12, 0.75], [14, 1.0], [16, 1.3], [18, 1.6]];
    return pairs.reduce((best, [sz, sc]) =>
      Math.abs(sc - scale) < Math.abs(this.fontSizeToScale(best) - scale) ? sz : best, 14 as 12 | 14 | 16 | 18);
  }

  private applyLabelScale(newMultiplier: number): void {
    if (newMultiplier === this.currentLabelMultiplier && this.roomMeshes.length > 0) return;
    const ratio = this.currentLabelMultiplier !== 0 ? newMultiplier / this.currentLabelMultiplier : 1;
    for (const room of this.roomMeshes) {
      if (room.label) {
        room.label.userData['fixedSX'] = (room.label.userData['fixedSX'] ?? 6.84) * ratio;
        room.label.userData['fixedSY'] = (room.label.userData['fixedSY'] ?? 1.46) * ratio;
      }
    }
    this.labelScale = this.indoorLabelBaseScale * newMultiplier;
    this.currentLabelMultiplier = newMultiplier;
    this.updateLabelVisibility();
  }

  onFontSizeChange(): void {
    this.applyLabelScale(this.fontSizeToScale(this.locationFontSize));
  }

  saveIndoorNavSettings(): void {
    if (this.isNavSettingsSaving) return;
    this.isNavSettingsSaving = true;
    this.navSettingsSaveStatus = '';
    const savedMapViewMode: 'standard' | 'urban' = this.mapViewMode === 'default' ? 'standard' : 'urban';

    const updatedContent = {
      ...(this.mapConfigRecord?.contentObject || {}),
      ...this.mapConfig,
      webIndoor: {
        ...(this.mapConfigRecord?.contentObject?.webIndoor || {}),
        ...(this.mapConfig.webIndoor || {}),
        viewMode: this.viewMode,
        mapViewMode: savedMapViewMode,
        labelScale: this.currentLabelMultiplier,
      },
    };

    const req = this.mapConfigId
      ? this.commonService.updateConfigFile({
          id: 'map-config',
          ids: this.mapConfigRecord?.ids ?? null,
          comments: this.mapConfigRecord?.comments ?? null,
          contentData: updatedContent,
          facilityId: this.mapConfigRecord?.facilityId ?? null,
        })
      : this.commonService.saveConfigFile({
          id: 'map-config',
          contentData: updatedContent,
          facilityId: localStorage.getItem(btoa('facilityId')),
        });

    req.subscribe({
      next: (res: any) => {
        const newId = res?.results?.ids ?? res?.results?.id ?? null;
        if (!this.mapConfigId && newId) {
          this.mapConfigId = newId;
          this.mapConfigRecord = res.results;
        } else if (this.mapConfigRecord) {
          this.mapConfigRecord.contentObject = updatedContent;
        }
        this.mapConfig.webIndoor = {
          ...(this.mapConfig.webIndoor || {}),
          viewMode: this.viewMode,
          mapViewMode: savedMapViewMode,
          labelScale: this.currentLabelMultiplier
        };
        this.navSettingsSaveStatus = 'success';
        this.isNavSettingsSaving = false;
        this.clearAllCachesAfterSettingsSave();
        if (this.navSettingsSaveTimer) clearTimeout(this.navSettingsSaveTimer);
        this.navSettingsSaveTimer = setTimeout(() => { this.navSettingsSaveStatus = ''; }, 3000);
      },
      error: () => {
        this.navSettingsSaveStatus = 'error';
        this.isNavSettingsSaving = false;
      },
    });
  }

  private clearAllCachesAfterSettingsSave(): void {
    this.commonService.clearcache({}).subscribe({
      error: err => console.warn('[IndoorPath] Failed to clear cache after settings save', err)
    });
  }

  // --- Block dropdown (floor-selector area) ---
  isBlockDropdownOpen = false;

  // --- Settings panel (source selector) ---
  isLaunchedFromNavQr = false;
  isSettingsOpen = false;
  isDisplaySettingsOpen = false;
  settingsSourceSearch = '';

  get hideQuickAccessAndSearch(): boolean {
    return this.isLaunchedFromNavQr;
  }

  // --- Map location geocoding search ---
  mapLocationSearch = '';
  mapLocationSuggestions: Array<{ display_name: string; lat: string; lon: string }> = [];
  isMapLocationSearching = false;
  isMapLocationDropdownOpen = false;
  private mapLocationSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Settings authentication ---
  isAuthPopupOpen = false;
  authUsername = '';
  authPassword = '';
  isAuthLoading = false;

  // --- Path steps ---
  pathSteps: PathStep[] = [];
  isStepsOpen = false;

  // --- Contextual hint ---
  get navHint(): string {
    if (this.routeDistance) return '';
    if (this.startRoom && this.endRoom) return ''; // footer Direction button handles this
    if (!this.startRoom && !this.endRoom)
      return 'Use ⚙ Settings to set your start location, then search or use Quick Access for destination';
    if (!this.startRoom && this.endRoom)
      return 'Open ⚙ Settings to set your start location';
    if (this.startRoom && !this.endRoom)
      return 'Start set — search or use Quick Access to pick a destination';
    return '';
  }

  private readonly routeVizService: RouteVisualizationService;
  private readonly personMovementService: PersonMovementService;
  private readonly interactionService: InteractionService;
  private readonly toastService: AppToastService;
  private readonly http: HttpClient;
  private hoveredRoom: RoomMesh | null = null;

  // --- Expose protected base properties for template ---
  get wrapperHeight(): string {
    return localStorage.getItem('privateUser') === '1' ? '100%' : 'calc(100% - 50px)';
  }

  get customerName(): string {
    const raw = localStorage.getItem('Y3VzdG9tZXI=') ?? 'Hospital';
    return raw.split(',')[0].trim();
  }

  get customerLogoUrl(): string {
    const facilityId = localStorage.getItem(btoa('facilityId'));
    if (!facilityId) return '';
    return environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + facilityId;
  }

  get isPrivateUser(): boolean {
    return localStorage.getItem('privateUser') === '1';
  }

  get requireSettingsAuth(): boolean {
    return this.isPrivateUser;
  }

  get hospitalName(): string { return this.selectedBlock?.name ?? 'Indoor Navigation'; }
  get floorName(): string { return this.selectedFloor?.name ?? ''; }
  get availableFloors(): any[] { return this.filteredFloors; }
  get availableBlocks(): any[] {
    return (this.blocks || []).filter((b: any) => b.name?.toLowerCase() !== 'outdoor');
  }

  onFloorSelect(floor: any): void {
    if (floor?.id === this.selectedFloor?.id) return;
    this.isLoading = true;
    if (!this.multiFloorRouteActive) {
      if (this.startRoom) {
        this.startRoom = null;
      }
      this.clearNavigation();
    } else {
      this.clearRouteVisual();
    }
    this.fetchFloorDetails(floor);
  }

  onBlockSelect(block: any): void {
    if (block?.id === this.selectedBlock?.id) return;
    this.selectedBlock = block;
    this.filteredFloors = block.children || [];
    this.invalidateAllFloorSearch();
    if (this.filteredFloors.length) {
      this.isLoading = true;
      if (!this.multiFloorRouteActive) {
        if (this.startRoom) {
          this.startRoom = null;
        }
        this.clearNavigation();
      } else {
        this.clearRouteVisual();
      }
      this.fetchFloorDetails(this.filteredFloors[0]);
    }
  }

  constructor(injector: Injector, private router: Router) {
    super(injector);
    this.routeVizService = injector.get(RouteVisualizationService);
    this.personMovementService = injector.get(PersonMovementService);
    this.interactionService = injector.get(InteractionService);
    this.toastService = injector.get(AppToastService);
    this.http = injector.get(HttpClient);
  }

  override ngOnInit(): void {
    this.readNavQueryParam();
    super.ngOnInit();
  }

  private readNavQueryParam(): void {
    const params = new URLSearchParams(window.location.search);
    const navStr = params.get('nav') ?? '';
    if (!navStr) return;
    try {
      const nav = JSON.parse(atob(navStr));
      if (nav && typeof nav.sfi === 'number' && typeof nav.sli === 'number') {
        this.pendingNavConfig = {
          sfi: nav.sfi, sli: nav.sli, sni: nav.sni ?? 0,
          dfi: typeof nav.dfi === 'number' ? nav.dfi : null,
          dli: typeof nav.dli === 'number' ? nav.dli : null,
          dni: typeof nav.dni === 'number' ? nav.dni : null
        };
        this.isLaunchedFromNavQr = this.pendingNavConfig.sli != null && this.pendingNavConfig.dli != null;
        if (this.isLaunchedFromNavQr) this.closeQa();
      }
    } catch {}
  }

  // --- Base hooks ---

  protected override async loadBlockFloors(): Promise<void> {
    if (!this.selectedBlock || !this.selectedFloor) return;
    if (!this.scene) { (this as any).pendingFloorLoad = true; return; }
    (this as any).pendingFloorLoad = false;
    this.isLoading = true;
    this.noDataFound = false;

    // Yield control to allow the browser to repaint and show the loader
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      this.clearCurrentFloor();
      this.buildingGroup = new THREE.Group();
      this.buildingGroup.name = 'building-root';
      this.scene.add(this.buildingGroup);
      this.floorGroups = [];
      this.roomMeshesByFloor = [];

      const layout = this.floorDetails[this.selectedFloor.id];
      if (!layout) {
        this.noDataFound = true;
        this.isLoading = false;
        return;
      }

      let textureResolve: () => void;
      const texturePromise = new Promise<void>(resolve => {
        textureResolve = resolve;
      });

      const safetyTimeout = setTimeout(() => {
        textureResolve();
      }, 5000);

      const floorGroup = new THREE.Group();
      const baseFloorHasSetPoints = this.floorPlanService.hasGeoAlignment(layout);
      const shouldBuildBuildingSurroundings = this.mapViewMode !== 'default' && (baseFloorHasSetPoints || !this.outdoorFloorId);

      const result = this.floorPlanService.buildFloorPlan(
        layout,
        floorGroup,
        0,
        0,
        0,
        true,
        this.viewMode === '3d',
        shouldBuildBuildingSurroundings,
        this.foundationColor,
        this.wallWidth,
        this.wallHeight,
        this.labelHeight,
        this.labelScale,
        this.showCorridorWalls,
        this.mapConfig,
        () => {
          clearTimeout(safetyTimeout);
          textureResolve();
        }
      );

      this.floorGroups.push(floorGroup);
      this.roomMeshesByFloor.push(result.roomMeshes);
      this.buildingGroup.add(floorGroup);

      if (result.surroundingsMesh) {
        this.surroundingsGroup = result.surroundingsMesh;
        this.surroundingsGroup.traverse((obj: any) => {
          if (obj.name === 'floor-geo-polygon-outline' || obj.name === 'floor-geo-polygon-fill') {
            obj.visible = false;
          }
        });
        this.scene.add(this.surroundingsGroup);
      }
      if (result.floorImageMesh) this.floorImageMeshes.push(result.floorImageMesh);
      if (result.foundationMesh) this.foundationMeshes.push(result.foundationMesh);
      result.doorMeshes.forEach((d: any) => {
        d.visible = this.showDoors;
        this.doorMeshes.push(d);
      });
      result.roomMeshes.forEach((room: any) => {
        room.walls.forEach((wall: any) => { wall.visible = this.showRoomWalls; });
      });

      if (result.hasGeoAlign) {
        this.buildingGroup.position.set(result.geoCenterX, 0, result.geoCenterZ);
        this.buildingGroup.rotation.y = result.geoRotationY;
        this.buildingGroup.scale.set(result.geoScaleX ?? 1, 1, result.geoScaleZ ?? 1);
      }

      this.baseFloorCenter.set(result.center[0], result.center[1]);
      this.rawFloorCenter.set(result.rawCenter[0], result.rawCenter[1]);
      this.floorHasGeoAlign = result.hasGeoAlign;
      this.floorSize = result.floorSize || 200;
      this.floorWidth = result.floorWidth;
      this.floorHeight = result.floorHeight;
      this.roomMeshes = this.getActiveRoomMeshes();

      this.controlsService.updateDistanceLimits(
        this.floorSize * FLOOR_MAX_DISTANCE_MULTIPLIER * 2,
        Math.min(this.floorSize * FLOOR_MIN_DISTANCE_MULTIPLIER, FLOOR_MIN_DISTANCE_ABSOLUTE)
      );

      this.navigationGraph = this.navigationService.constructNavigationGraph(
        this.roomMeshes,
        (r: RoomMesh) => this.floorPlanService.getRoomCenter(r)
      );

      await this.fetchFloorNodes(this.selectedFloorId!);
      this.navNodes = this.allNodes[this.selectedFloorId!] || [];
      this.nodeNavigationGraph = new Map<number, number[]>();
      if (this.navNodes.length > 0) {
        this.nodeNavigationGraph = this.navigationService.constructNodeGraph(this.navNodes);
      }

      this.buildOutdoorMap();

      if (this.shouldFocusOnFloorOnLoad()) {
        this.cameraAnimationService.focusOnFloor(
          this.roomMeshes, this.camera, this.controls, 1,
          () => this.updateLabelVisibility()
        );
      }
      this.updateLabelVisibility();

      await texturePromise;

      await this.onFloorLoaded();
      this.isLoading = false;
    } catch (e) {
      console.error('[IndoorPathComponent] loadBlockFloors error', e);
      this.isLoading = false;
    }

    if (!this.scene) return;

    if (this.roomMeshes.length === 0 && this.filteredFloors.length > 1) {
      for (const floor of this.filteredFloors) {
        if (floor.id === this.selectedFloor?.id) continue;

        if (!this.floorDetails.hasOwnProperty(floor.id)) {
          try { await this.fetchFloorLocationDetails(floor); } catch { continue; }
        }
        if (!this.floorDetails[floor.id]) continue;

        void this.fetchFloorNodes(floor.id);
        this.selectedFloor = floor;
        this.selectedFloorId = floor.id;
        await this.loadBlockFloors();
        if (this.roomMeshes.length > 0) break;
      }
    }
  }

  protected override clearCurrentFloor(): void {
    super.clearCurrentFloor();
    if (this.outdoorGroup) {
      this.cleanupService.disposeGroup(this.outdoorGroup, this.scene);
      this.outdoorGroup = null;
      this.outdoorRoomMeshes = [];
    }
    this.lastBuildingOpacity = null;
  }

  private buildOutdoorMap(): void {
    if (this.outdoorGroup) return;

    if (this.outdoorFloorId && this.floorDetails[this.outdoorFloorId]) {
      const activeLayout = this.selectedFloor ? this.floorDetails[this.selectedFloor.id] : null;
      const baseFloorHasSetPoints = this.floorPlanService.hasGeoAlignment(activeLayout);

      const outdoorLayout = this.floorDetails[this.outdoorFloorId];
      this.outdoorGroup = new THREE.Group();
      this.outdoorGroup.name = 'outdoor-building-root';
      this.scene.add(this.outdoorGroup);

      const outdoorFloorGroup = new THREE.Group();
      const outdoorResult = this.floorPlanService.buildFloorPlan(
        outdoorLayout,
        outdoorFloorGroup,
        0,
        0,
        0,
        true,
        true,
        this.mapViewMode !== 'default' && !baseFloorHasSetPoints, // includeSurroundings
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
          this.cleanupService.disposeGroup(this.surroundingsGroup as any, this.scene);
        }
        this.surroundingsGroup = outdoorResult.surroundingsMesh;
        this.surroundingsGroup.traverse((obj: any) => {
          if (obj.name === 'floor-geo-polygon-outline' || obj.name === 'floor-geo-polygon-fill') {
            obj.visible = false;
          }
        });
        this.scene.add(this.surroundingsGroup);
      }

      if (outdoorResult.hasGeoAlign) {
        this.outdoorGroup.position.set(outdoorResult.geoCenterX, 0, outdoorResult.geoCenterZ);
        this.outdoorGroup.rotation.y = outdoorResult.geoRotationY;
        this.outdoorGroup.scale.set(outdoorResult.geoScaleX ?? 1, 1, outdoorResult.geoScaleZ ?? 1);
      }

      this.outdoorRoomMeshes.forEach(room => {
        room.floor.visible = true;
        room.walls.forEach(wall => { wall.visible = this.showRoomWalls; });
      });

      if (this.outdoorGroup) {
        this.outdoorGroup.visible = this.zoomValue < 60;
      }
    }
  }

  protected override updateLabelVisibility(): void {
    this.roomMeshesByFloor.forEach(rooms => {
      rooms.forEach(r => {
        if (r.label) r.label.visible = false;
        if (r.labelIcon) r.labelIcon.visible = false;
      });
    });

    this.outdoorRoomMeshes.forEach(room => {
      if (room.label) room.label.visible = false;
      if (room.labelIcon) room.labelIcon.visible = false;
    });

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
      isZoomedOut = this.zoomValue < 75;
    }

    if (outdoorOpacity > 0.0 && !this.outdoorGroup) {
      this.buildOutdoorMap();
    }

    if (this.outdoorGroup) {
      this.outdoorGroup.visible = outdoorOpacity > 0.0;
    }
    if (this.buildingGroup) {
      this.buildingGroup.visible = buildingOpacity > 0.0;
    }

    if (buildingOpacity !== this.lastBuildingOpacity) {
      this.applyGroupOpacity(this.buildingGroup, buildingOpacity);
      this.applyGroupOpacity(this.outdoorGroup, outdoorOpacity);
      this.lastBuildingOpacity = buildingOpacity;
    }

    if (isZoomedOut) {
      if (this.outdoorRoomMeshes.length > 0) {
        this.labelVisibilityService.updateLabelVisibility(
          this.outdoorRoomMeshes,
          this.camera,
          this.controls,
          this.floorSize,
          (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
          this.showLabels,
          this.showIcons,
          this.zoomValue
        );
      }
    } else {
      this.labelVisibilityService.updateLabelVisibility(
        this.getActiveRoomMeshes(),
        this.camera,
        this.controls,
        this.floorSize,
        (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
        this.showLabels,
        this.showIcons,
        this.zoomValue
      );
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

  protected override shouldFocusOnFloorOnLoad(): boolean {
    return !this.multiFloorRouteActive;
  }

  protected override onMapConfigLoaded(): void {
    const wi = this.mapConfig.webIndoor;
    if (wi?.sourceRoomId) {
      this.isSourceFromConfig = true;
      this.sourceLabel = wi.sourceLabel ?? 'Source (configured)';
    }

    // Restore saved view mode (controls not ready yet — enforced in onFloorLoaded)
    if (wi?.viewMode) {
      this.viewMode = wi.viewMode;
    }

    if (wi?.mapViewMode) {
      this.mapViewMode = wi.mapViewMode === 'standard' ? 'default' : 'urban';
    }

    // Restore saved label scale — update labelScale so next floor build uses it
    if (typeof wi?.labelScale === 'number') {
      const mult = wi.labelScale;
      this.locationFontSize = this.scaleToFontSize(mult);
      this.labelScale = this.indoorLabelBaseScale * mult;
      this.currentLabelMultiplier = mult;
    }

    this.applyLoadedViewSettings();

    this.commonService.getAppTerms('LocationCategory').subscribe((res: any) => {
      this.locationCategoryMap.clear();
      (res?.results ?? []).forEach((term: any) => {
        if (term?.code && term?.value) {
          this.locationCategoryMap.set(term.code, term.value);
        }
      });
      this.locationCategoryMapLoaded = true;
      this.refreshQaCategories();
    });
  }

  protected override async onFloorLoaded(): Promise<void> {
    // Cache outdoor block data to build the outdoor map in the background
    if (!this.outdoorBlock && this.blockWithFloorList && this.blockWithFloorList.length > 0) {
      this.outdoorBlock = this.blockWithFloorList.find((b: any) => b.name?.toLowerCase() === 'outdoor');
      if (this.outdoorBlock && this.outdoorBlock.children?.length > 0) {
        this.outdoorFloorId = this.outdoorBlock.children[0].id;
        // Pre-fetch outdoor floor location details if not already cached
        if (!this.floorDetails.hasOwnProperty(this.outdoorFloorId)) {
          this.hospitalService.getLogicalLocationWithChildren(this.outdoorFloorId).subscribe((res: any) => {
            this.floorDetails[this.outdoorFloorId] = res.results;
            this.regionalLocationNameService.applyToFloor(this.outdoorFloorId, this.floorDetails[this.outdoorFloorId]);
            this.buildOutdoorMap();
          });
        } else {
          this.buildOutdoorMap();
        }
        void this.fetchFloorNodes(this.outdoorFloorId);
      }
    }

    this.updateMapView();

    // Enforce view mode constraints — set both branches so stale state never leaks across floors
    if (this.viewMode === '2d') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
    } else {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI / 4;
      this.controls.enableRotate = true;
    }
    this.controls.update();

    // Apply saved floor default (zoom + rotation) from map-config, overriding focusOnFloor
    this.applyFloorDefaultCamera();

    if (this.isQaOpen) {
      void this.ensureAllFloorNavOptions().then(() => this.refreshQaCategories());
    } else if (this.locationCategoryMapLoaded) {
      this.refreshQaCategories();
    }
    this.invalidateAllFloorSearch();
    this.settingsSourceSearch = '';
    if (this.multiFloorRouteActive) {
      this.applyMultiFloorRoute();
      return;
    }
    if (this.pendingNavConfig) {
      await this.applyPendingNavConfig();
      return;
    }
    if (this.isSourceFromConfig && this.mapConfig.webIndoor?.sourceRoomId) {
      const room = this.roomMeshes.find(r => r.id === this.mapConfig.webIndoor!.sourceRoomId);
      if (room) {
        this.assignStart(room);
        this.selectedStartLocation = this.getCurrentFloorOption(room);
        this.resetViewAfterLanding();
        return;
      }
    }
    if (IndoorPathComponent.savedSourceId !== null) {
      const room = this.getNavRooms().find(r => r.id === IndoorPathComponent.savedSourceId);
      if (room) {
        this.setStartRoom(room);
        this.selectedStartLocation = this.getCurrentFloorOption(room);
      } else {
        void this.ensureAllFloorNavOptions();
      }
    }
    this.resetViewAfterLanding();
  }

  private resetViewAfterLanding(): void {
    if (this.pendingNavConfig || this.isLaunchedFromNavQr) return;
    if (this.landingResetTimer) clearTimeout(this.landingResetTimer);
    this.landingResetTimer = setTimeout(() => {
      this.landingResetTimer = null;
      this.resetCamera();
    }, 0);
  }

  private async applyPendingNavConfig(): Promise<void> {
    const nav = this.pendingNavConfig!;
    if (this.selectedFloorId !== nav.sfi) {
      const targetFloor = this.findFloorById(nav.sfi);
      if (targetFloor) {
        this.clearStartSelection();
        this.clearNavigation();
        this.fetchFloorDetails(targetFloor);
      } else {
        // Target floor not found — give up and restore normal source
        this.pendingNavConfig = null;
        this.isLaunchedFromNavQr = false;
        if (IndoorPathComponent.savedSourceId !== null) {
          const room = this.getNavRooms().find(r => r.id === IndoorPathComponent.savedSourceId);
          if (room) {
            this.setStartRoom(room);
            this.selectedStartLocation = this.getCurrentFloorOption(room);
          } else {
            void this.ensureAllFloorNavOptions();
          }
        }
      }
      return;
    }
    // On the correct floor — apply source then destination
    this.pendingNavConfig = null;
    const sourceRoom = this.roomMeshes.find(r => r.id === nav.sli);
    if (sourceRoom) {
      this.setStartRoom(sourceRoom);
      IndoorPathComponent.savedSourceId = sourceRoom.id;
      this.selectedStartLocation = this.getCurrentFloorOption(sourceRoom);
    }
    if (nav.dli != null) {
      if (nav.dfi !== null && nav.dfi !== nav.sfi) {
        // Multi-floor scenario: resolve the destination option from other floors
        await this.ensureAllFloorNavOptions();
        const destOption = this.allFloorNavOptions.find(opt => opt.id === nav.dli && opt.floorId === nav.dfi);
        if (destOption) {
          this.selectedDestinationLocation = destOption;
          this.destinationSearchValue = destOption.displayName || destOption.name;
          this.destinationSelectedRoomId = destOption.id;
          if (sourceRoom) {
            this.calculateRoute();
          }
        }
      } else {
        // Same-floor scenario: resolve room mesh from the current floor
        const destRoom = this.roomMeshes.find(r => r.id === nav.dli);
        if (destRoom) {
          this.setEndRoom(destRoom);
          if (sourceRoom) {
            this.calculateRoute();
          }
        }
      }
    }
  }

  private findFloorById(floorId: number): any {
    for (const block of this.blockWithFloorList as any[]) {
      const floor = (block.children || []).find((f: any) => f.id === floorId);
      if (floor) return floor;
    }
    return null;
  }

  private refreshQaCategories(): void {
    this.qaCategories = this.getCategories();
    this.selectedQaCategory = null;
  }

  private invalidateAllFloorSearch(): void {
    this.allFloorNavOptions = [];
    this.allFloorSearchPromise = null;
  }

  private async ensureFloorDetailsForSearch(floor: any): Promise<void> {
    return this.fetchFloorLocationDetails(floor);
  }

  private async ensureAllFloorNavOptions(): Promise<void> {
    if (this.allFloorNavOptions.length > 0) return;
    if (this.allFloorSearchPromise) return this.allFloorSearchPromise;

    this.isNavSearchLoading = true;
    this.allFloorSearchPromise = (async () => {
      const floors = this.filteredFloors.length ? this.filteredFloors : (this.selectedFloor ? [this.selectedFloor] : []);
      await Promise.all(floors.map(floor => Promise.all([
        this.ensureFloorDetailsForSearch(floor),
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
      if (IndoorPathComponent.savedSourceId !== null && !this.selectedStartLocation) {
        const found = this.allFloorNavOptions.find(opt => opt.id === IndoorPathComponent.savedSourceId);
        if (found) {
          this.selectedStartLocation = found;
          this.sourceLabel = found.displayName || found.name;
        }
      }
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

  private async resolveSearchOptionRoom(option: IndoorNavLocationOption): Promise<RoomMesh | null> {
    if (option.floorId !== this.selectedFloor?.id) {
      await this.switchToSearchFloor(option.floor);
    }
    return this.getNavRooms().find(room => room.id === option.id) ?? null;
  }

  private async switchToSearchFloor(floor: any): Promise<void> {
    if (floor?.id === this.selectedFloor?.id) return;
    this.isLoading = true;
    if (this.startRoom) {
      this.startRoom = null;
    }
    this.clearNavigation();
    await this.ensureFloorDetailsForSearch(floor);
    await this.fetchFloorNodes(floor.id);
    this.selectedFloor = floor;
    this.selectedFloorId = floor.id;
    await super.loadBlockFloors();
    if (this.surroundingsGroup) {
      this.surroundingsGroup.traverse((obj: any) => {
        if (obj.name === 'floor-geo-polygon-outline' || obj.name === 'floor-geo-polygon-fill') {
          obj.visible = false;
        }
      });
    }
  }

  protected animate(): void {
    if (!this.scene || !this.camera || !this.controls) return;

    // Delta time (seconds), clamped to prevent jumps after tab switch
    const now = performance.now();
    const rawDelta = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 1 / 60;
    const deltaTime = Math.min(rawDelta, 0.1);
    this.lastFrameTime = now;

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
        if (this.selectedFloor?.id !== undefined) {
          this.animatedFloors.add(this.selectedFloor.id);
        }
      }
    }

    // Pull back to full route view once ribbon is complete (fires exactly once)
    if (this.pathAnimComplete && !this.pathRevealTriggered && this.routeGroup) {
      this.pathRevealTriggered = true;
      this.routeCameraFollowActive = false;
      this.fitFullRouteAfterArrival();
    }

    // Camera gently trails the person during an active journey
    if (this.isJourneyStarted && this.movementState.isMoving && this.person) {
      const f = 0.025;
      this.controls.target.x += (this.person.position.x - this.controls.target.x) * f;
      this.controls.target.z += (this.person.position.z - this.controls.target.z) * f;
    }

    this.controlsService.update();
    this.updateZoomValue();
    this.updateYouAreHerePosition();
    this.updateDestCalloutPosition();
    this.updateNavMarkerPositions();

    if (this.movementState.isMoving && this.person) {
      this.movementState = this.personMovementService.updateMovement(
        this.person, this.pathPoints, this.movementState, this.moveSpeed, deltaTime
      );
    }
    this.rendererService.render(this.scene, this.camera);
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

  private updateYouAreHerePosition(): void {
    const el = this.youAreHereEl?.nativeElement;
    if (!el || !this.startRoom || this.routeDistance || !this.camera) return;

    // World-space center of the source room, lifted above the floor surface
    const box = new THREE.Box3().setFromObject(this.startRoom.floor);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);
    worldCenter.y += 2;

    // Project to NDC (-1..1 range)
    worldCenter.project(this.camera);

    // If behind the camera, hide
    if (worldCenter.z > 1) {
      el.style.visibility = 'hidden';
      return;
    }

    // Map NDC → canvas CSS pixel space
    const canvas = this.renderer.domElement;
    const x = (worldCenter.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-worldCenter.y * 0.5 + 0.5) * canvas.clientHeight;

    el.style.visibility = 'visible';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
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

    const canvas = this.renderer.domElement;
    const x = (worldCenter.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-worldCenter.y * 0.5 + 0.5) * canvas.clientHeight;

    el.style.visibility = 'visible';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }

  // --- Mouse interaction ---

  protected override onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.interactionService.updateMousePosition(event, rect);
    const hit = this.interactionService.getIntersectedRoom(this.camera, this.getActiveRoomMeshes());

    if (this.hoveredRoom && this.hoveredRoom !== this.startRoom && this.hoveredRoom !== this.endRoom) {
      applyRoomHighlight(this.hoveredRoom, false, false, false, false);
      this.hoveredRoom = null;
    }
    if (hit && hit !== this.startRoom && hit !== this.endRoom) {
      this.hoveredRoom = hit;
      applyRoomHighlight(hit, false, true, false, false);
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  protected override onClick(_event: MouseEvent): void {
    if (this.routeDistance) return; // locked while route is active
    if (!this.hoveredRoom) return;
    if (this.hoveredRoom !== this.startRoom) {
      this.assignEnd(this.hoveredRoom);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.ip-search-wrap')) {
      this.isDestDropdownOpen = false;
    }
    if (!target.closest('.ip-settings-panel') && !target.closest('.ip-settings-btn')) {
      this.isSettingsOpen = false;
      this.isDisplaySettingsOpen = false;
    }
    if (!target.closest('.ip-block-pill')) {
      this.isBlockDropdownOpen = false;
    }
  }

  // --- Source/Destination management ---

  private assignStart(room: RoomMesh): void {
    if (!this.isValidNavRoom(room.id)) return;
    if (this.startRoom && this.startRoom !== room) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
    }
    this.startRoom = room;
    this.sourceLabel = this.getRoomLabel(room);
    applyRoomHighlight(room, false, false, true, false);
    this.keepRoomLabelMapSized(room);
  }

  private assignEnd(room: RoomMesh, skipLabelUpdate = false): void {
    if (!this.isValidNavRoom(room.id)) return;
    if (this.endRoom && this.endRoom !== room) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
    }
    this.endRoom = room;
    if (!skipLabelUpdate) {
      // Only update search label when called from map click (QA/search callers set it themselves)
      this.destinationSearchValue = this.getRoomLabel(room);
      this.destinationSelectedRoomId = room.id;
    }
    this.selectedDestinationLocation = this.getCurrentFloorOption(room);
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
    applyRoomHighlight(room, false, false, false, true);
    this.keepRoomLabelMapSized(room);
  }

  private isValidNavRoom(id: number): boolean {
    return this.navNodes.some(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === id);
  }

  private getRoomLabel(room: RoomMesh): string {
    const regionalLabel = this.getLocationDisplayName(room?.data);
    if (room?.data?.regionalName && regionalLabel) return regionalLabel;
    const name = (room?.data?.name ?? room?.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    return match?.[1] ?? name;
  }

  // --- Search/autocomplete ---

  getNavRooms(): RoomMesh[] {
    return this.getActiveRoomMeshes().filter(r => this.isValidNavRoom(r.id));
  }

  getDestSuggestions(): IndoorNavLocationOption[] {
    return this.getAllFloorSuggestions(this.destinationSearchValue, this.selectedStartLocation?.id);
  }

  onDestinationInput(): void {
    // User changed text — clear any previously confirmed destination
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
    const isFloorSwitch = option.floorId !== this.selectedFloor?.id;
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setEndRoom(room, isFloorSwitch);
  }

  /** Direct room setter — bypasses nav-node re-validation (room is already from getNavRooms()) */
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

  /** Direct room setter for start — used by Settings panel */
  private setStartRoom(room: RoomMesh): void {
    if (this.startRoom && this.startRoom !== room) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
    }
    this.startRoom = room;
    this.sourceLabel = this.getLocationDisplayName(room.data) || this.getRoomLabel(room);
    this.isSourceFromConfig = false;
    applyRoomHighlight(room, false, false, true, false);
    this.keepRoomLabelMapSized(room);
  }

  private clearStartSelection(): void {
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    this.sourceLabel = 'Select source location';
    this.selectedStartLocation = null;
    IndoorPathComponent.savedSourceId = null;
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

  isMultiFloorScenario(): boolean {
    return !!this.selectedStartLocation && 
           !!this.selectedDestinationLocation && 
           this.selectedStartLocation.floorId !== this.selectedDestinationLocation.floorId;
  }

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

    // 1. Exact match
    let match = liftStairNodes.find(info => normalize(info.name) === sourceNameNorm);
    if (match) return match;

    // 2. Substring match
    match = liftStairNodes.find(info => {
      const nameNorm = normalize(info.name);
      return nameNorm.includes(sourceNameNorm) || sourceNameNorm.includes(nameNorm);
    });
    if (match) return match;

    // 3. Fallback to nearest to destination room on target floor
    if (this.selectedDestinationLocation) {
      const nearestToDest = this.findNearestLiftOrStair(
        this.selectedDestinationLocation.node,
        targetFloorId
      );
      if (nearestToDest) return nearestToDest;
    }

    // 4. First lift/stair on target floor
    return liftStairNodes[0];
  }

  private applyMultiFloorRoute(): void {
    if (!this.multiFloorRouteActive) return;

    const currentFloorId = this.selectedFloor?.id;
    if (!currentFloorId) return;

    // Reset current room highlight states first
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }

    if (currentFloorId === this.selectedStartLocation?.floorId) {
      // Start floor
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
      // Destination floor
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

    // Now calculate the route path for this floor!
    this.calculateRoute();
  }

  // --- Route calculation ---

  private calculateRoute(): void {
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
      const currentFloorId = this.selectedFloor?.id;
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
      console.warn('[IndoorPath] No nav nodes for selected rooms');
      return;
    }

    this.activePathStartNode = startNode;
    this.activePathEndNode = endNode;

    const pathIds = this.navigationService.findShortestNodePath(
      startNode.id, endNode.id, this.navNodes, this.nodeNavigationGraph
    );
    if (!pathIds) { console.warn('[IndoorPath] No path found'); return; }

    const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
    const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
    const pts = pathIds.map(id => {
      const n = this.navNodes.find(n => n.id === id)!;
      return new THREE.Vector3(n.x - xOff, 0, n.y - zOff);
    });

    const parent = this.buildingGroup ?? this.scene;
    const customWidth = Math.max(0.25, ROUTE_RIBBON_WIDTH * Math.min(1.0, (this.floorSize || 200) / 200));
    const result = this.routeVizService.visualizeRoute(pts, parent, customWidth);
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
    const currentFloorId = this.selectedFloor?.id;
    const skipAnim = currentFloorId !== undefined && this.animatedFloors.has(currentFloorId);

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

    if (currentFloorId !== undefined) {
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

    this.generateNavQrUrl(startNode.id, endNode.id);

    // Camera starts at the source, follows the path, then fits the full route at arrival.
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

    this.cameraAnimationService.animateCamera(
      this.camera,
      this.controls,
      this.camera.position.clone(),
      targetCam,
      this.controls.target.clone(),
      center,
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
        const v1 = new ThreeVector2(dx, dz).normalize();
        const v2 = new ThreeVector2(next.x - curr.x, next.z - curr.z).normalize();
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

  private generateNavQrUrl(sni: number, dni: number): void {
    if (!this.selectedStartLocation || !this.selectedDestinationLocation) return;
    const navObj = {
      sfi: this.selectedStartLocation.floorId,
      sli: this.selectedStartLocation.id,
      sni,
      dfi: this.selectedDestinationLocation.floorId,
      dli: this.selectedDestinationLocation.id,
      dni,
      slp: null,
      dlp: null
    };
    const navStr = btoa(JSON.stringify(navObj));
    const gtk = this.mapConfig.webIndoor?.guestToken ?? 'eyJZfgZ2ajdGsiOiJENjUwOFQ5OTExMjQ1MDEzOTVPPT0iLCJmaWQiOiIwMjUwIn0=';
    const base = this.mapConfig.webIndoor?.navBaseUrl ?? window.location.origin;
    this.navQrUrl = `${base}/ovitag/organization/indoor-path?gtk=${gtk}&nav=${navStr}&ts=${Date.now()}`;
  }

  private projectNavNodeToScreen(room: RoomMesh): { x: number; y: number } | null {
    if (!this.camera || !this.renderer) return null;
    const node = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === room.id);
    const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
    const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
    let worldPos: any;
    if (node) {
      worldPos = new THREE.Vector3(node.x - xOff, 0, node.y - zOff);
      if (this.buildingGroup) this.buildingGroup.localToWorld(worldPos);
    } else {
      const box = new THREE.Box3().setFromObject(room.floor);
      worldPos = new THREE.Vector3();
      box.getCenter(worldPos);
    }
    const projected = worldPos.clone().project(this.camera);
    if (projected.z > 1) return null;
    const canvas = this.renderer.domElement;
    return {
      x: (projected.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-projected.y * 0.5 + 0.5) * canvas.clientHeight,
    };
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
    this.navQrUrl = '';
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
    // Restore panning (may have been locked in 2D route mode)
    if (this.controls) this.controls.enablePan = true;
  }

  public startJourney(): void {
    if (this.pathPoints.length < 2) return;
    this.person = createPerson(this.buildingGroup ?? this.scene, this.person);
    if (this.person) this.person.position.copy(this.pathPoints[0]);
    this.movementState = { isMoving: true, currentPathIndex: 0, moveProgress: 0 };
    this.isJourneyStarted = true;
  }

  public clearNavigation(): void {
    this.clearRouteVisual();
    this.isLaunchedFromNavQr = false;
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }
    this.destinationSearchValue = '';
    this.destinationSelectedRoomId = null;
    this.selectedDestinationLocation = null;
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
    if (this.startRoom) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
      this.startRoom = null;
    }
    if (this.selectedStartLocation && this.selectedStartLocation.floorId === this.selectedFloor?.id) {
      const room = this.roomMeshes.find(r => r.id === this.selectedStartLocation!.id);
      if (room) {
        this.startRoom = room;
        applyRoomHighlight(room, false, false, true, false);
        this.keepRoomLabelMapSized(room);
      }
    }
    this.resetCamera();
  }

  public override resetCamera(): void {
    super.resetCamera();
    this.applyFloorDefaultCamera();
    if (this.viewMode === '2d') {
      this.enforce2dCameraAngle();
    }
    this.openQa();
  }

  public goBack(): void {
    this.router.navigate(['/ovitag/organization/three-map']);
  }

  // --- Quick Access ---

  private formatCategoryName(catId: string): string {
    return catId
      .replace(/^lc[-_]/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Other';
  }

  getCategories(): LocationCategory[] {
    const source = this.allFloorNavOptions.length
      ? this.allFloorNavOptions
      : this.getNavRooms().map(r => this.getCurrentFloorOption(r)).filter((v): v is IndoorNavLocationOption => !!v);
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

  // Categories visible in QA — hides categories where only the source room remains
  getFilteredQaCategories(): LocationCategory[] {
    if (!this.selectedStartLocation) return this.qaCategories;
    return this.qaCategories.filter(cat =>
      cat.rooms.some(r => r.id !== this.selectedStartLocation!.id)
    );
  }

  // Count for a category, excluding the selected source room
  getQaCategoryCount(cat: LocationCategory): number {
    return cat.rooms.filter(r => r.id !== this.selectedStartLocation?.id).length;
  }

  // Locations in selected category, excluding the already-set source
  getQaLocations(): IndoorNavLocationOption[] {
    if (!this.selectedQaCategory) return [];
    return this.selectedQaCategory.rooms.filter(r => r.id !== this.selectedStartLocation?.id);
  }

  openQa(): void {
    if (this.hideQuickAccessAndSearch) return;
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
    const wrap = btn.closest('.ip-qa-wrap') as HTMLElement;
    if (wrap) {
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
    const isFloorSwitch = option.floorId !== this.selectedFloor?.id;
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setEndRoom(room, isFloorSwitch);
  }

  // --- Settings (source selector) ---

  openSettings(): void {
    if (this.requireSettingsAuth) {
      this.authUsername = '';
      this.authPassword = '';
      this.isAuthPopupOpen = true;
    } else {
      this.isSettingsOpen = true;
      this.isDisplaySettingsOpen = false;
      this.settingsSourceSearch = '';
      void this.ensureAllFloorNavOptions();
    }
  }

  closeSettings(): void {
    this.isSettingsOpen = false;
    this.isDisplaySettingsOpen = false;
  }

  cancelAuth(): void {
    this.isAuthPopupOpen = false;
  }

  submitAuth(): void {
    if (!this.authUsername.trim() || !this.authPassword.trim()) {
      this.toastService.error('Please enter username and password');
      return;
    }
    this.isAuthLoading = true;
    const payload = {
      username: this.authUsername,
      password: this.commonService.encryptData(this.authPassword),
      isUserPreference: false,
      recaptchaResponse: null
    };
    this.commonService.login(payload).subscribe({
      next: (result: any) => {
        this.isAuthLoading = false;
        if (result?.statusCode === 1) {
          const buttons: string[] = result?.results?.permissions?.button ?? [];
          if (buttons.includes('BT_INSET')) {
            this.isAuthPopupOpen = false;
            this.isSettingsOpen = true;
            this.isDisplaySettingsOpen = false;
            this.settingsSourceSearch = '';
            void this.ensureAllFloorNavOptions();
          } else {
            this.toastService.error('You are not authorized to access settings.');
          }
        } else {
          this.toastService.error(result?.message ?? 'You are not able to access. Please check your credentials.');
        }
      },
      error: (err: any) => {
        this.isAuthLoading = false;
        const msg = err?.error?.message ?? 'You are not able to access. Please check your credentials.';
        this.toastService.error(msg);
      }
    });
  }

  logout(): void {
    const message = { type: 'navigation', operation: 'logout', response: null };
    window.parent.postMessage(message, '*');
    window.addEventListener('message', (event) => {
      const data = JSON.stringify(event.data);
      if ((window as any).Android?.receiveMessage) {
        (window as any).Android.receiveMessage(data);
      }
    }, { once: true });
  }

  reload(): void {
    const message = { type: 'navigation', operation: 'reload', response: null };
    window.parent.postMessage(message, '*');
    window.addEventListener('message', (event) => {
      const data = JSON.stringify(event.data);
      if ((window as any).Android?.receiveMessage) {
        (window as any).Android.receiveMessage(data);
      }
    }, { once: true });
  }

  onSourceInput(): void {
    void this.ensureAllFloorNavOptions();
  }

  onClearStart(): void {
    this.clearStartSelection();
  }

  getSourceSuggestions(): IndoorNavLocationOption[] {
    return this.getAllFloorSuggestions(this.settingsSourceSearch, this.endRoom?.id);
  }

  async selectSourceFromSettings(option: IndoorNavLocationOption): Promise<void> {
    this.closeSettings();
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setStartRoom(room);
    IndoorPathComponent.savedSourceId = room.id;
    this.selectedStartLocation = option;
    this.multiFloorRouteActive = false;
    this.multiFloorStartLiftNode = null;
    this.multiFloorDestLiftNode = null;
    this.multiFloorStartLiftLocationId = null;
    this.multiFloorDestLiftLocationId = null;
    this.animatedFloors.clear();
  }

  public swapLocations(): void {
    if (this.isSourceFromConfig) return;

    if (this.isMultiFloorScenario() || (this.selectedStartLocation && this.selectedDestinationLocation && this.selectedStartLocation.floorId !== this.selectedDestinationLocation.floorId)) {
      const wasRouteShown = !!this.routeDistance || this.multiFloorRouteActive;
      this.clearRouteVisual();

      const tmp = this.selectedStartLocation;
      this.selectedStartLocation = this.selectedDestinationLocation;
      this.selectedDestinationLocation = tmp;

      if (this.selectedStartLocation) {
        this.sourceLabel = this.selectedStartLocation.displayName || this.selectedStartLocation.name;
        IndoorPathComponent.savedSourceId = this.selectedStartLocation.id;
      } else {
        this.sourceLabel = 'Select source location';
        IndoorPathComponent.savedSourceId = null;
      }

      if (this.selectedDestinationLocation) {
        this.destinationSearchValue = this.selectedDestinationLocation.displayName || this.selectedDestinationLocation.name;
        this.destinationSelectedRoomId = this.selectedDestinationLocation.id;
      } else {
        this.destinationSearchValue = '';
        this.destinationSelectedRoomId = null;
      }

      this.multiFloorRouteActive = false;
      this.multiFloorStartLiftNode = null;
      this.multiFloorDestLiftNode = null;
      this.multiFloorStartLiftLocationId = null;
      this.multiFloorDestLiftLocationId = null;
      this.animatedFloors.clear();

      // Let's resolve the room mesh for start and end on the current floor
      if (this.startRoom) {
        applyRoomHighlight(this.startRoom, false, false, false, false);
        this.startRoom = null;
      }
      if (this.endRoom) {
        applyRoomHighlight(this.endRoom, false, false, false, false);
        this.endRoom = null;
      }

      if (this.selectedStartLocation && this.selectedStartLocation.floorId === this.selectedFloor?.id) {
        this.startRoom = this.roomMeshes.find(r => r.id === this.selectedStartLocation!.id) || null;
        if (this.startRoom) {
          applyRoomHighlight(this.startRoom, false, false, true, false);
          this.keepRoomLabelMapSized(this.startRoom);
        }
      }
      if (this.selectedDestinationLocation && this.selectedDestinationLocation.floorId === this.selectedFloor?.id) {
        this.endRoom = this.roomMeshes.find(r => r.id === this.selectedDestinationLocation!.id) || null;
        if (this.endRoom) {
          applyRoomHighlight(this.endRoom, false, false, false, true);
          this.keepRoomLabelMapSized(this.endRoom);
        }
      }

      if (wasRouteShown) {
        this.calculateRoute();
      }
      return;
    }

    if (!this.startRoom || !this.endRoom) return;
    const wasRouteShown = !!this.routeDistance;
    this.clearRouteVisual();
    const tmp = this.startRoom;
    this.startRoom = this.endRoom;
    this.endRoom = tmp;
    this.sourceLabel = this.getRoomLabel(this.startRoom);
    this.destinationSearchValue = this.getRoomLabel(this.endRoom);
    this.destinationSelectedRoomId = this.endRoom.id;
    this.selectedStartLocation = this.getCurrentFloorOption(this.startRoom);
    IndoorPathComponent.savedSourceId = this.startRoom.id;
    applyRoomHighlight(this.startRoom, false, false, true, false);
    applyRoomHighlight(this.endRoom, false, false, false, true);
    this.keepRoomLabelMapSized(this.startRoom);
    this.keepRoomLabelMapSized(this.endRoom);
    if (wasRouteShown) this.calculateRoute();
  }

  /** Called when user explicitly taps the Direction button in the footer */
  public onDirectionClick(): void {
    this.isQaOpen = false;
    this.selectedQaCategory = null;
    this.animatedFloors.clear();

    if (this.isMultiFloorScenario()) {
      const startFloorId = this.selectedStartLocation!.floorId;
      if (this.selectedFloor?.id !== startFloorId) {
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

  public switchToFloor(floorId: number | undefined): void {
    if (!floorId) return;
    const floor = this.findFloorById(floorId);
    if (floor) {
      this.onFloorSelect(floor);
    }
  }

  public getFloorCode(floorId: number | undefined): string {
    if (floorId === undefined) return '';
    const index = this.availableFloors.findIndex(f => f.id === floorId);
    if (index !== -1) {
      return `${index}F`;
    }
    const floor = this.findFloorById(floorId);
    return floor ? floor.name : '';
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

  // ==========================================================================
  // MAP VIEW MODE — urban / default
  // ==========================================================================

  public onMapViewModeChange(): void {
    if (this.mapViewMode !== 'default' && !this.surroundingsGroup) {
      void this.loadBlockFloors();
    } else {
      this.updateMapView();
    }
  }

  public onMapLocationInput(): void {
    if (this.mapLocationSearchTimer) clearTimeout(this.mapLocationSearchTimer);
    this.mapLocationSuggestions = [];
    if (!this.mapLocationSearch.trim()) {
      this.isMapLocationSearching = false;
      this.isMapLocationDropdownOpen = false;
      return;
    }
    this.isMapLocationSearching = true;
    this.isMapLocationDropdownOpen = true;
    this.mapLocationSearchTimer = setTimeout(() => this.searchMapLocation(), 450);
  }

  private searchMapLocation(): void {
    const q = this.mapLocationSearch.trim();
    if (!q) { this.isMapLocationSearching = false; return; }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`;
    this.http.get<Array<{ display_name: string; lat: string; lon: string }>>(url).subscribe({
      next: results => {
        this.mapLocationSuggestions = results;
        this.isMapLocationSearching = false;
      },
      error: () => { this.isMapLocationSearching = false; }
    });
  }

  public selectMapLocation(loc: { display_name: string; lat: string; lon: string }): void {
    this.mapLocationSearch = loc.display_name.split(',')[0].trim();
    this.mapLocationSuggestions = [];
    this.isMapLocationDropdownOpen = false;
    void this.loadBlockFloors();
  }

  public clearMapLocation(): void {
    this.mapLocationSearch = '';
    this.mapLocationSuggestions = [];
    this.isMapLocationDropdownOpen = false;
  }

  private updateMapView(): void {
    if (!this.scene || !this.surroundingsGroup) return;
    this.surroundingsGroup.visible = this.mapViewMode !== 'default';
  }

  // ==========================================================================

  override ngOnDestroy(): void {
    if (this.landingResetTimer) {
      clearTimeout(this.landingResetTimer);
      this.landingResetTimer = null;
    }
    if (this.routeAnimationTimer) {
      clearTimeout(this.routeAnimationTimer);
      this.routeAnimationTimer = null;
    }
    this.clearRouteVisual();
    super.ngOnDestroy();
  }
}
