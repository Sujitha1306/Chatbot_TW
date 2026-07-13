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
  typeName: string;
  floorId: number;
  floorName: string;
  floor: any;
  node: NavNode;
  data: LocationData;
}
import { FOCUS_ROOM_MIN_DISTANCE, PERSON_BASE_MOVE_SPEED } from '../../constants/map.constants';
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
  endRoom: RoomMesh | null = null;
  private routeGroup: THREE.Group | null = null;
  private person: THREE.Group | null = null;
  @ViewChild('sourceMarkerEl') private sourceMarkerEl?: ElementRef<HTMLDivElement>;
  @ViewChild('destMarkerEl') private destMarkerEl?: ElementRef<HTMLDivElement>;

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

  private focusOnBoundsForView(bounds: THREE.Box3, distanceMultiplier: number): void {
    if (this.viewMode !== '2d') {
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
    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const targetCam = new THREE.Vector3(center.x, center.y + dist, center.z);

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

  private focusOnDestinationRoom(room: RoomMesh): void {
    const bounds = new THREE.Box3().setFromObject(room.floor);
    if (bounds.isEmpty()) return;
    this.focusOnBoundsForView(bounds, this.viewMode === '2d' ? 3.0 : 3.5);
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
        room.label.userData['fixedSY'] = (room.label.userData['fixedSY'] ?? 1.41) * ratio;
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
  get availableBlocks(): any[] { return this.blocks; }

  onFloorSelect(floor: any): void {
    if (floor?.id === this.selectedFloor?.id) return;
    this.isLoading = true;
    this.clearStartSelection();
    this.clearNavigation();
    this.fetchFloorDetails(floor);
  }

  onBlockSelect(block: any): void {
    if (block?.id === this.selectedBlock?.id) return;
    this.selectedBlock = block;
    this.filteredFloors = block.children || [];
    this.invalidateAllFloorSearch();
    if (this.filteredFloors.length) {
      this.isLoading = true;
      this.clearStartSelection();
      this.clearNavigation();
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
    // showSurroundings is passed as isBaseFloor to FloorPlanService — controls OSM tile building
    this.showSurroundings = this.mapViewMode !== 'default';
    await super.loadBlockFloors();

    // Skip fallback if scene is not yet ready (base already deferred via pendingFloorLoad)
    if (!this.scene) return;

    // If the auto-selected floor produced no rooms, walk filteredFloors to find the first with data
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
        await super.loadBlockFloors();
        if (this.roomMeshes.length > 0) break;
      }
    }
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
    if (this.pendingNavConfig) {
      await this.applyPendingNavConfig();
      return;
    }
    if (this.isSourceFromConfig && this.mapConfig.webIndoor?.sourceRoomId) {
      const room = this.roomMeshes.find(r => r.id === this.mapConfig.webIndoor!.sourceRoomId);
      if (room) {
        this.assignStart(room);
        this.resetViewAfterLanding();
        return;
      }
    }
    if (IndoorPathComponent.savedSourceId !== null) {
      const room = this.getNavRooms().find(r => r.id === IndoorPathComponent.savedSourceId);
      if (room) this.setStartRoom(room);
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
          if (room) this.setStartRoom(room);
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
    }
    const destRoom = nav.dli != null ? this.roomMeshes.find(r => r.id === nav.dli) : null;
    if (destRoom) {
      this.setEndRoom(destRoom);
      if (sourceRoom) this.calculateRoute(); // auto-navigate for QR deep-link
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
        || option.floorName.toLowerCase().includes(q)
        || (option.typeName ?? '').toLowerCase().includes(q);
    });
  }

  private getOptionLabel(option: IndoorNavLocationOption): string {
    const name = (option.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    return match?.[1] ?? name;
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
    this.clearStartSelection();
    this.clearNavigation();
    await this.ensureFloorDetailsForSearch(floor);
    await this.fetchFloorNodes(floor.id);
    this.selectedFloor = floor;
    this.selectedFloorId = floor.id;
    await super.loadBlockFloors();
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
      if (t >= 1) { this.pathAnimating = false; this.pathAnimComplete = true; }
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
    applyRoomHighlight(room, false, false, false, true);
    this.keepRoomLabelMapSized(room);
  }

  private isValidNavRoom(id: number): boolean {
    return this.navNodes.some(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === id);
  }

  private getRoomLabel(room: RoomMesh): string {
    const name = (room?.data?.name ?? room?.name ?? '').trim();
    const match = name.match(/\b(\d{1,6})\b/);
    return match?.[1] ?? name;
  }

  // --- Search/autocomplete ---

  getNavRooms(): RoomMesh[] {
    return this.getActiveRoomMeshes().filter(r => this.isValidNavRoom(r.id));
  }

  getDestSuggestions(): IndoorNavLocationOption[] {
    return this.getAllFloorSuggestions(this.destinationSearchValue, this.startRoom?.id);
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
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setEndRoom(room);
  }

  /** Direct room setter — bypasses nav-node re-validation (room is already from getNavRooms()) */
  private setEndRoom(room: RoomMesh): void {
    if (this.endRoom && this.endRoom !== room) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.clearRouteVisual();
    }
    this.endRoom = room;
    this.destinationSearchValue = room.data?.name ?? this.getRoomLabel(room);
    this.destinationSelectedRoomId = room.id;
    applyRoomHighlight(room, false, false, false, true);
    this.keepRoomLabelMapSized(room);
    this.focusOnDestinationRoom(room);
  }

  /** Direct room setter for start — used by Settings panel */
  private setStartRoom(room: RoomMesh): void {
    if (this.startRoom && this.startRoom !== room) {
      applyRoomHighlight(this.startRoom, false, false, false, false);
    }
    this.startRoom = room;
    this.sourceLabel = room.data?.name ?? this.getRoomLabel(room);
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
  }

  clearDestination(): void {
    this.destinationSearchValue = '';
    this.destinationSelectedRoomId = null;
    this.isDestDropdownOpen = false;
    if (this.endRoom) {
      applyRoomHighlight(this.endRoom, false, false, false, false);
      this.endRoom = null;
    }
    this.clearRouteVisual();
  }

  // --- Route calculation ---

  private calculateRoute(): void {
    if (!this.startRoom || !this.endRoom) return;
    this.clearRouteVisual();

    const startNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === this.startRoom?.id);
    const endNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === this.endRoom?.id);
    if (!startNode || !endNode) {
      console.warn('[IndoorPath] No nav nodes for selected rooms');
      return;
    }

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
    const result = this.routeVizService.visualizeRoute(pts, parent);
    this.routeGroup = result.routeGroup;
    this.pathPoints = result.pathPoints;
    this.moveSpeed = result.moveSpeed;

    // Precompute path length for tip-follow camera
    this.pathTotalLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      this.pathTotalLength += this.pathPoints[i].distanceTo(this.pathPoints[i - 1]);
    }
    // Scale animation duration to path length: ~10 units/sec (near-walking), clamped 2s – 10s
    this.pathAnimDuration = Math.min(Math.max(this.pathTotalLength / 10 * 1000, 2000), 10000);
    this.pathRevealTriggered = false;

    // Kick off draw animation — ribbon starts invisible and reveals over pathAnimDuration ms
    this.routeRibbonMesh = this.routeGroup?.children[0] ?? null;
    if (this.routeRibbonMesh?.geometry?.index) {
      this.routeRibbonTotalIndices = this.routeRibbonMesh.geometry.index.count;
      this.routeRibbonMesh.geometry.setDrawRange(0, 0);
    }
    this.pathAnimating = false;
    this.pathAnimComplete = false;

    this.focusOnRouteStartForNavigation();
    this.startRouteRevealAfterCameraFit();

    const frames = result.totalDistance / this.moveSpeed;
    this.routeDistance = `${result.totalDistance.toFixed(0)}m`;
    this.routeTime = `${Math.ceil(frames / 60)}s`;

    // Generate turn-by-turn steps
    this.pathSteps = this.generatePathSteps(result.pathPoints);
    this.isStepsOpen = false;

    this.generateNavQrUrl(startNode.id, endNode.id);

    // Camera starts at the source, follows the path, then fits the full route at arrival.
  }

  private focusOnRouteStartForNavigation(): void {
    const bounds = new THREE.Box3();
    if (this.startRoom) bounds.expandByObject(this.startRoom.floor);

    const previewCount = Math.max(2, Math.ceil(this.pathPoints.length * 0.25));
    this.pathPoints.slice(0, previewCount).forEach(point => bounds.expandByPoint(this.getRouteWorldPoint(point)));
    if (bounds.isEmpty()) return;

    const multiplier = this.getResponsiveRouteFitMultiplier() * 1.25;
    if (this.viewMode === '2d') {
      this.focusOnBoundsForView(bounds, multiplier);
      this.controls.enablePan = false;
    } else {
      this.focusOnRouteBounds3d(bounds, multiplier);
    }

    this.routeCameraFollowActive = true;
  }

  private fitFullRouteAfterArrival(): void {
    const bounds = this.getRouteBounds();
    if (bounds.isEmpty()) return;

    const multiplier = this.getResponsiveRouteFitMultiplier();
    if (this.viewMode === '2d') {
      this.focusOnBoundsForView(bounds, multiplier);
      this.controls.enablePan = false;
    } else {
      this.focusOnRouteBounds3d(bounds, multiplier);
    }
  }

  private getRouteBounds(): THREE.Box3 {
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

  private startRouteRevealAfterCameraFit(): void {
    if (this.routeAnimationTimer) clearTimeout(this.routeAnimationTimer);
    this.routeAnimationTimer = setTimeout(() => {
      this.routeAnimationTimer = null;
      this.pathAnimStartTime = performance.now();
      this.pathAnimating = true;
    }, this.routeCameraTransitionDuration + 80);
  }

  private focusOnRouteBounds3d(bounds: THREE.Box3, distanceMultiplier: number): void {
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
    const startName = this.startRoom?.data?.name ?? this.sourceLabel;
    const endName = this.endRoom?.data?.name ?? this.destinationSearchValue;

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
    if (!this.startRoom || !this.endRoom || !this.selectedFloor) return;
    const navObj = {
      sfi: this.selectedFloor.id,
      sli: this.startRoom.id,
      sni,
      dfi: this.selectedFloor.id,
      dli: this.endRoom.id,
      dni,
      slp: null,
      dlp: null
    };
    const navStr = btoa(JSON.stringify(navObj));
    const gtk = this.mapConfig.webIndoor?.guestToken ?? 'eyJZfgZ2ajdGsiOiJENjUwOFQ5OTExMjQ1MDEzOTVPPT0iLCJmaWQiOiIwMjUwIn0=';
    const base = this.mapConfig.webIndoor?.navBaseUrl ?? window.location.origin;
    this.navQrUrl = `${base}/ovitag/organization/indoor-path?gtk=${gtk}&nav=${navStr}`;
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

  private updateNavMarkerPositions(): void {
    const src = this.sourceMarkerEl?.nativeElement;
    if (src) {
      const pos = this.startRoom ? this.projectNavNodeToScreen(this.startRoom) : null;
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
      const pos = this.endRoom ? this.projectNavNodeToScreen(this.endRoom) : null;
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
    if (!this.startRoom) return this.qaCategories;
    return this.qaCategories.filter(cat =>
      cat.rooms.some(r => r.id !== this.startRoom!.id)
    );
  }

  // Count for a category, excluding the selected source room
  getQaCategoryCount(cat: LocationCategory): number {
    return cat.rooms.filter(r => r.id !== this.startRoom?.id).length;
  }

  // Locations in selected category, excluding the already-set source
  getQaLocations(): IndoorNavLocationOption[] {
    if (!this.selectedQaCategory) return [];
    return this.selectedQaCategory.rooms.filter(r => r.id !== this.startRoom?.id);
  }

  openQa(): void {
    if (this.hideQuickAccessAndSearch) return;
    this.isQaOpen = true;
    this.selectedQaCategory = null;
    void this.ensureAllFloorNavOptions().then(() => this.refreshQaCategories());
  }
  closeQa(): void { this.isQaOpen = false; this.selectedQaCategory = null; }
  getQaSingleLocation(cat: LocationCategory): IndoorNavLocationOption | null {
    const locs = cat.rooms.filter(r => r.id !== this.startRoom?.id);
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
    const room = await this.resolveSearchOptionRoom(option);
    if (!room) return;
    this.setEndRoom(room);
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
  }

  public swapLocations(): void {
    if (!this.startRoom || !this.endRoom || this.isSourceFromConfig) return;
    const wasRouteShown = !!this.routeDistance;
    this.clearRouteVisual();
    const tmp = this.startRoom;
    this.startRoom = this.endRoom;
    this.endRoom = tmp;
    this.sourceLabel = this.getRoomLabel(this.startRoom);
    this.destinationSearchValue = this.getRoomLabel(this.endRoom);
    this.destinationSelectedRoomId = this.endRoom.id;
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
    this.calculateRoute();
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
    this.mapConfig.buildingLat = parseFloat(loc.lat);
    this.mapConfig.buildingLng = parseFloat(loc.lon);
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
