import { Directive, ElementRef, Injector, OnDestroy, OnInit, Input } from '@angular/core';
import * as THREE from 'three';

import { RoomMesh, NavNode } from '../models';
import {
  SceneService,
  CameraService,
  RendererService,
  ControlsService,
  AnimationService,
  CleanupService,
  FloorPlanService,
  NavigationService,
  CameraAnimationService,
  LabelVisibilityService,
  RegionalLocationNameService
} from '../services';
import {
  FLOOR_MAX_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_ABSOLUTE,
  WALL_THICKNESS,
  WALL_HEIGHT,
  LABEL_HEIGHT
} from '../constants/map.constants';
import { HospitalService, CommonService } from '../../../../services';

export interface MapConfig {
  skipLocByCat: string[];
  skipLocCatByCat: string[];
  skipLocNameByCat?: string[];
  threeDFloorByCat?: string[];
  threeDHeight?: Record<string, number>;
  categoryColors?: Record<string, string>;
  categoryIcons?: Record<string, string>;
  categoryQuickAccess?: Record<string, boolean>;
  floorDefaults?: Record<string, { distance: number; theta: number; phi: number }>;
  mapTileType?: string;
  webIndoor?: {
    sourceRoomId?: number;
    sourceFloorId?: number;
    sourceLabel?: string;
    guestToken?: string;
    navBaseUrl?: string;
    viewMode?: '2d' | '3d';
    mapViewMode?: 'standard' | 'urban';
    labelScale?: number;
  };
}

/**
 * Abstract base for focused three-map views (indoor-path, live-tracking).
 * Handles scene init, floor loading, camera, and cleanup.
 * Subclasses provide the concrete @Component decorator, template, and feature logic.
 */
@Directive()
export abstract class ThreeMapBase implements OnInit, OnDestroy {
  abstract container: ElementRef<HTMLDivElement>;

  @Input() blockId: number | null = null;
  @Input() floorId: number | null = null;
  @Input() locFlr: number | null = null;
  @Input() tagId: string | null = null;
  @Input() tagType: string | null = null;
  @Input() type: string = '';

  protected scene!: THREE.Scene;
  protected camera!: THREE.PerspectiveCamera;
  protected renderer!: THREE.WebGLRenderer;
  protected controls: any;

  protected blocks: any[] = [];
  protected selectedBlock: any = null;
  protected selectedBlockId: number | null = null;
  protected filteredFloors: any[] = [];
  protected selectedFloor: any = null;
  selectedFloorId: number | null = null;
  protected blockWithFloorList: any[] = [];
  protected floorDetails: Record<number, any> = {};

  protected buildingGroup: THREE.Group | null = null;
  protected floorGroups: THREE.Group[] = [];
  protected roomMeshesByFloor: RoomMesh[][] = [];
  protected roomMeshes: RoomMesh[] = [];
  protected surroundingsGroup: THREE.Object3D | null = null;
  protected floorImageMeshes: THREE.Mesh[] = [];
  protected foundationMeshes: THREE.Mesh[] = [];
  protected doorMeshes: THREE.Group[] = [];

  protected navNodes: NavNode[] = [];
  protected allNodes: Record<number, NavNode[]> = {};
  private nodeFetchPromises: Record<number, Promise<void>> = {};
  private floorDetailFetchPromises: Record<number, Promise<void>> = {};
  protected nodeNavigationGraph = new Map<number, number[]>();
  protected navigationGraph = new Map<number, number[]>();

  protected floorSize = 200;
  protected baseFloorCenter = new THREE.Vector2(0, 0);
  protected rawFloorCenter = new THREE.Vector2(0, 0);
  protected floorHasGeoAlign = false;
  protected floorWidth = 0;
  protected floorHeight = 0;

  mapConfig: MapConfig = { skipLocByCat: [], skipLocCatByCat: [] };
  protected mapConfigRecord: any = null;
  protected mapConfigId: number | null = null;

  protected showLabels = true;
  protected showIcons = true;
  protected showCorridorWalls = false;
  protected showRoomWalls = false;
  protected showDoors = false;
  protected showSurroundings = true;
  protected allowRotate = false;
  protected foundationColor = '#ffffff';
  protected wallWidth = WALL_THICKNESS;
  protected wallHeight = WALL_HEIGHT;
  protected labelHeight = LABEL_HEIGHT;
  protected labelScale = 4.0;
  protected zoomValue = 0;

  isLoading = true;
  noDataFound = false;

  protected savedMapState: any = null;
  private pendingFloorLoad = false;

  protected readonly sceneService: SceneService;
  protected readonly cameraService: CameraService;
  protected readonly rendererService: RendererService;
  protected readonly controlsService: ControlsService;
  protected readonly animationService: AnimationService;
  protected readonly cleanupService: CleanupService;
  protected readonly floorPlanService: FloorPlanService;
  protected readonly navigationService: NavigationService;
  protected readonly cameraAnimationService: CameraAnimationService;
  protected readonly labelVisibilityService: LabelVisibilityService;
  protected readonly regionalLocationNameService: RegionalLocationNameService;
  protected readonly hospitalService: HospitalService;
  protected readonly commonService: CommonService;

  private readonly _onResize: () => void;

  constructor(protected injector: Injector) {
    this.sceneService = injector.get(SceneService);
    this.cameraService = injector.get(CameraService);
    this.rendererService = injector.get(RendererService);
    this.controlsService = injector.get(ControlsService);
    this.animationService = injector.get(AnimationService);
    this.cleanupService = injector.get(CleanupService);
    this.floorPlanService = injector.get(FloorPlanService);
    this.navigationService = injector.get(NavigationService);
    this.cameraAnimationService = injector.get(CameraAnimationService);
    this.labelVisibilityService = injector.get(LabelVisibilityService);
    this.regionalLocationNameService = injector.get(RegionalLocationNameService);
    this.hospitalService = injector.get(HospitalService);
    this.commonService = injector.get(CommonService);
    this.animate = this.animate.bind(this);
    this._onResize = this.onResize.bind(this);
  }

  ngOnInit(): void {
    const prefsReady = this.loadUserPreferences();
    this.loadMapConfig();
    this.getBlockWithFloor(prefsReady);
    setTimeout(() => {
      this.initScene();
      this.setupBaseInteraction();
      this.animationService.startAnimation(() => this.animate());
      window.addEventListener('resize', this._onResize);
      prefsReady.then(() => {
        if (this.pendingFloorLoad) this.loadBlockFloors();
      });
    }, 2000);
  }

  private loadUserPreferences(): Promise<void> {
    return new Promise<void>(resolve => {
      const fallback = setTimeout(resolve, 3000);
      const userId = localStorage.getItem(btoa('userId'));
      const roleId = localStorage.getItem('userlevel');
      const obs = this.commonService.getPreference(userId, roleId);
      if (!obs) { clearTimeout(fallback); resolve(); return; }
      obs.subscribe({
        next: res => {
          clearTimeout(fallback);
          if (res?.results?.tm_map_viewer_state) {
            try { this.savedMapState = JSON.parse(res.results.tm_map_viewer_state.value); } catch {}
          }
          resolve();
        },
        error: () => { clearTimeout(fallback); resolve(); }
      });
    });
  }

  protected loadMapConfig(): void {
    this.commonService.getConfigFile('map-config').subscribe(res => {
      if (res?.results) {
        this.mapConfigRecord = res.results;
        this.mapConfigId = res.results.ids ?? null;
      }
      if (!res?.results?.contentObject) return;
      const cfg = res.results.contentObject;
      const catColors: Record<string, string> = {};
      const catIcons: Record<string, string> = {};
      const catQuickAccess: Record<string, boolean> = {};
      if (cfg.iconByCat && typeof cfg.iconByCat === 'object') {
        for (const catId of Object.keys(cfg.iconByCat)) {
          const entry = cfg.iconByCat[catId];
          if (entry?.color) catColors[catId] = entry.color;
          if (entry?.icon) catIcons[catId] = entry.icon;
          if (typeof entry?.quickAccess === 'boolean') catQuickAccess[catId] = entry.quickAccess;
        }
      }
      this.mapConfig = {
        skipLocByCat: Array.isArray(cfg.skipLocByCat) ? cfg.skipLocByCat : [],
        skipLocCatByCat: Array.isArray(cfg.skipLocCatByCat) ? cfg.skipLocCatByCat : [],
        skipLocNameByCat: Array.isArray(cfg.skipLocNameByCat) ? cfg.skipLocNameByCat : [],
        threeDFloorByCat: Array.isArray(cfg.threeDFloorByCat) ? cfg.threeDFloorByCat : [],
        threeDHeight: (cfg.threeDHeight ?? cfg.threeDheight) && typeof (cfg.threeDHeight ?? cfg.threeDheight) === 'object' ? (cfg.threeDHeight ?? cfg.threeDheight) : undefined,
        categoryColors: Object.keys(catColors).length ? catColors : undefined,
        categoryIcons: Object.keys(catIcons).length ? catIcons : undefined,
        categoryQuickAccess: Object.keys(catQuickAccess).length ? catQuickAccess : undefined,
        floorDefaults: cfg.floorDefaults ?? {},
        mapTileType: cfg.mapTileType ?? 'osm',
        webIndoor: cfg.webIndoor && typeof cfg.webIndoor === 'object' ? {
          sourceRoomId: cfg.webIndoor.sourceRoomId,
          sourceFloorId: cfg.webIndoor.sourceFloorId,
          sourceLabel: cfg.webIndoor.sourceLabel,
          guestToken: cfg.webIndoor.guestToken,
          navBaseUrl: cfg.webIndoor.navBaseUrl,
          viewMode: (cfg.webIndoor.viewMode === '2d' || cfg.webIndoor.viewMode === '3d') ? cfg.webIndoor.viewMode : undefined,
          mapViewMode: (cfg.webIndoor.mapViewMode === 'standard' || cfg.webIndoor.mapViewMode === 'urban') ? cfg.webIndoor.mapViewMode : undefined,
          labelScale: typeof cfg.webIndoor.labelScale === 'number' ? cfg.webIndoor.labelScale : undefined,
        } : undefined,
      };
      this.onMapConfigLoaded();
    });
  }

  protected onMapConfigLoaded(): void {}

  private getBlockWithFloor(prefsReady: Promise<void>): void {
    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if (res.statusCode !== 1) return;
      prefsReady.then(() => {
        this.blockWithFloorList = res.results.filter((v: any) =>
          v.hasOwnProperty('children')
        );
        let initialFloor: any = null;
        const targetFloorId = this.floorId ? Number(this.floorId) : (this.savedMapState?.floorId ? Number(this.savedMapState.floorId) : null);
        if (targetFloorId) {
          for (const block of this.blockWithFloorList as any[]) {
            const f = (block.children || []).find((f: any) => Number(f.id) === targetFloorId);
            if (f) { initialFloor = f; break; }
          }
        }
        if (!initialFloor && this.blockWithFloorList.length) {
          if (this.blockId) {
            const targetBlock = this.blockWithFloorList.find((b: any) => Number(b.id) === Number(this.blockId));
            if (targetBlock && targetBlock.children?.length) {
              initialFloor = targetBlock.children[0];
            }
          }
          if (!initialFloor) {
            initialFloor = (this.blockWithFloorList[0] as any).children?.[0];
          }
        }
        if (initialFloor) this.fetchFloorDetails(initialFloor);
      });
    });
  }

  protected fetchFloorDetails(floorData: any): void {
    void this.fetchFloorNodes(floorData.id);
    if (this.floorDetails.hasOwnProperty(floorData.id)) {
      this.onFloorDetailsReady(floorData);
      return;
    }
    this.fetchFloorLocationDetails(floorData).then(() => this.onFloorDetailsReady(floorData));
  }

  protected fetchFloorLocationDetails(floorData: any): Promise<void> {
    if (this.floorDetails.hasOwnProperty(floorData.id)) return Promise.resolve();
    if (this.floorDetailFetchPromises[floorData.id]) return this.floorDetailFetchPromises[floorData.id];

    this.floorDetailFetchPromises[floorData.id] = new Promise<void>(resolve => {
      this.hospitalService.getLogicalLocationWithChildren(floorData.id).subscribe({
        next: res => {
          const floorLayout = this.unwrapApiResult(res);
          this.floorDetails[floorData.id] = floorLayout;
          this.regionalLocationNameService.applyToFloor(floorData.id, floorLayout).finally(resolve);
        },
        error: () => resolve()
      });
    });
    return this.floorDetailFetchPromises[floorData.id];
  }

  protected fetchFloorNodes(floorId: number): Promise<void> {
    if (this.allNodes.hasOwnProperty(floorId)) return Promise.resolve();
    if (this.nodeFetchPromises[floorId]) return this.nodeFetchPromises[floorId];

    this.nodeFetchPromises[floorId] = new Promise<void>(resolve => {
      this.hospitalService.getNodePoints(floorId).subscribe({
        next: res => {
          const nodes = this.unwrapApiResult(res);
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

  private unwrapApiResult(res: any): any {
    return res?.results ?? res;
  }

  private onFloorDetailsReady(floorData: any): void {
    const blockA =
      this.blockWithFloorList.find((b: any) => (b.children || []).some((f: any) => f.id === floorData.id)) ||
      this.blockWithFloorList[0];
    if (!blockA) return;
    this.selectedBlockId = blockA.id;
    this.selectedBlock = blockA;
    this.filteredFloors = blockA.children || [];
    const floor = this.filteredFloors.find((f: any) => f.id === floorData.id) || this.filteredFloors[0];
    if (!floor) return;
    this.selectedFloor = floor;
    this.selectedFloorId = floor.id;
    this.blocks = this.blockWithFloorList;
    this.prefetchBlockFloorData(blockA);
    this.loadBlockFloors();
  }

  private prefetchBlockFloorData(block: any): void {
    (block.children ?? []).forEach((floor: any) => {
      void this.fetchFloorLocationDetails(floor);
      void this.fetchFloorNodes(floor.id);
    });
  }

  protected get activeFloorIndex(): number {
    if (this.roomMeshesByFloor.length <= 1) return 0;
    const idx = this.filteredFloors.indexOf(this.selectedFloor);
    return idx >= 0 ? idx : 0;
  }

  protected getActiveRoomMeshes(): RoomMesh[] {
    return this.roomMeshesByFloor[this.activeFloorIndex] ?? [];
  }

  protected initScene(): void {
    const el = this.container.nativeElement;
    this.scene = this.sceneService.initScene();
    this.camera = this.cameraService.initCamera(el.clientWidth, el.clientHeight);
    this.renderer = this.rendererService.initRenderer(el.clientWidth, el.clientHeight);
    el.appendChild(this.renderer.domElement);
    this.controls = this.controlsService.initControls(this.camera, this.renderer.domElement);
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 4;
    this.controls.addEventListener('change', () => this.updateLabelVisibility());
  }

  private setupBaseInteraction(): void {
    this.controls.mouseButtons.LEFT = this.allowRotate ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    this.renderer.domElement.addEventListener('mousedown', () => {
      this.controls.mouseButtons.LEFT = this.allowRotate ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    });
    this.renderer.domElement.style.cursor = 'grab';
    this.controls.addEventListener('start', () => { this.renderer.domElement.style.cursor = 'grabbing'; });
    this.controls.addEventListener('end', () => { this.renderer.domElement.style.cursor = 'grab'; });
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
  }

  protected onMouseMove(_event: MouseEvent): void {}
  protected onClick(_event: MouseEvent): void {}

  protected async loadBlockFloors(): Promise<void> {
    if (!this.selectedBlock || !this.selectedFloor) return;
    if (!this.scene) { this.pendingFloorLoad = true; return; }
    this.pendingFloorLoad = false;
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
      const result = this.floorPlanService.buildFloorPlan(
        layout, floorGroup, 0, 0, 0, true, this.showSurroundings, true,
        this.foundationColor, this.wallWidth, this.wallHeight, this.labelHeight, this.labelScale,
        this.showCorridorWalls, this.mapConfig,
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

      let roomFocused = false;
      if (this.locFlr) {
        const targetRoom = this.roomMeshes.find(r => Number(r.id) === Number(this.locFlr));
        if (targetRoom) {
          this.cameraAnimationService.focusOnRoom(
            targetRoom, this.camera, this.controls,
            () => this.updateLabelVisibility()
          );
          roomFocused = true;
        }
      }
      if (!roomFocused && this.shouldFocusOnFloorOnLoad()) {
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
      console.error('[ThreeMapBase] loadBlockFloors error', e);
      this.isLoading = false;
    }
  }

  protected clearCurrentFloor(): void {
    if (this.buildingGroup) {
      this.cleanupService.disposeGroup(this.buildingGroup, this.scene);
      this.buildingGroup = null;
    }
    if (this.surroundingsGroup) {
      // surroundingsGroup is THREE.Object3D but disposeGroup expects Group; safe cast
      this.cleanupService.disposeGroup(this.surroundingsGroup as any, this.scene);
      this.surroundingsGroup = null;
    }
    this.floorGroups = [];
    this.roomMeshesByFloor = [];
    this.roomMeshes = [];
    this.floorImageMeshes = [];
    this.foundationMeshes = [];
    this.doorMeshes = [];
  }

  protected abstract onFloorLoaded(): Promise<void>;
  protected abstract animate(): void;

  protected updateLabelVisibility(): void {
    this.roomMeshesByFloor.forEach(rooms => {
      rooms.forEach(r => {
        if (r.label) r.label.visible = false;
        if (r.labelIcon) r.labelIcon.visible = false;
      });
    });
    this.labelVisibilityService.updateLabelVisibility(
      this.getActiveRoomMeshes(), this.camera, this.controls, this.floorSize,
      (r: RoomMesh) => this.floorPlanService.getRoomCenter(r),
      this.showLabels, this.showIcons, this.zoomValue
    );
  }

  protected updateZoomValue(): void {
    if (!this.camera || !this.controls) return;
    const cur = this.camera.position.distanceTo(this.controls.target);
    const min = this.controls.minDistance;
    const max = this.controls.maxDistance;
    if (max > min) {
      this.zoomValue = Math.round(Math.max(0, Math.min(200, ((max - cur) / (max - min)) * 200)));
    }
  }

  public zoomIn(): void {
    this.cameraAnimationService.smoothZoom(0.8, this.camera, this.controls, () => this.updateLabelVisibility());
  }

  public zoomOut(): void {
    this.cameraAnimationService.smoothZoom(1.25, this.camera, this.controls, () => this.updateLabelVisibility());
  }

  public resetCamera(): void {
    this.cameraAnimationService.focusOnFloor(
      this.roomMeshes, this.camera, this.controls, 1,
      () => this.updateLabelVisibility()
    );
  }

  protected shouldFocusOnFloorOnLoad(): boolean {
    return true;
  }

  protected onResize(): void {
    const el = this.container.nativeElement;
    this.cameraService.updateAspect(el.clientWidth, el.clientHeight);
    this.rendererService.setSize(el.clientWidth, el.clientHeight);
  }

  ngOnDestroy(): void {
    this.animationService.stopAnimation();
    if (this.scene) {
      this.cleanupService.clearMapObjects(this.scene);
    }
    this.clearCurrentFloor();
    if (this.controls) {
      try {
        this.controls.dispose();
      } catch (e) {
        console.warn('Controls dispose failed:', e);
      }
    }
    this.rendererService.dispose();
    window.removeEventListener('resize', this._onResize);
  }
}
