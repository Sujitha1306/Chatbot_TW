import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Injector,
  Input,
  HostListener,
  Output,
  EventEmitter
} from '@angular/core';
import { Router } from '@angular/router';
import * as THREE from 'three';

import { ThreeMapBase } from '../three-map-base.component';
import { RoomMesh, NavNode } from '../../models';
import {
  SceneService,
  CameraService,
  RendererService,
  ControlsService,
  AnimationService,
  CleanupService,
  CameraAnimationService,
  LabelVisibilityService,
  InteractionService,
  RouteVisualizationService
} from '../../services';
import { MqttService, IMqttMessage } from '../../services/mqtt.service';
import { ROUTE_RIBBON_WIDTH } from '../../constants/map.constants';
import { applyRoomHighlight } from '../../helpers';



/** Human-readable label for each tag type */
const TTP_LABELS: Record<string, string> = {
  'TAT-AS': 'Asset', 'TAT-IN': 'Infant', 'TAT-PA': 'Patient',
  'TAT-PO': 'Porter', 'TAT-US': 'User', 'TAT-STD': 'Student',
  'TAT-STF': 'Staff', 'TAT-WH': 'Wheelchair', 'TAT-MR': 'Motorised',
  'TAT-DAT': 'Unassigned'
};

export interface TrackedTag {
  tid: string;
  ttp: string;
  tvl?: string;
  tan?: string;   // tag associate name — human-readable name from MQTT payload
  flr: number;
  position: THREE.Vector3;
  lastSeen: number;
}

@Component({
  selector: 'app-live-tracking',
  standalone: false,
  templateUrl: './live-tracking.component.html',
  styleUrls: ['./live-tracking.component.scss'],
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
export class LiveTrackingComponent extends ThreeMapBase implements OnInit, OnDestroy, OnChanges {

  @ViewChild('canvasContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;
  @Input() requestId: any;
  @Input() requestType: string = '';
  @Input() reqTagDetail: any;

  @Output() floorChanged = new EventEmitter<number>();
  @Output() blockChanged = new EventEmitter<number>();

  private routeVisualizationService: RouteVisualizationService;
  private porterTrackedTags = new Set<string>();
  private porterRouteGroup: THREE.Group | null = null;
  private highlightedStartRoom: RoomMesh | null = null;
  private highlightedDestRoom: RoomMesh | null = null;

  protected override showSurroundings = false;

  // --- View mode / controls ---
  viewMode: '2d' | '3d' = '3d';
  isRotateMode = false;
  isSettingsOpen = false;
  isBlockDropdownOpen = false;

  protected override labelScale = 3.0;
  // label scale tracking — applied from webIndoor.labelScale (multiplier over base 3.0)
  private ltLabelMultiplier = 1.0;
  private readonly ltLabelBaseScale = 3.0;

  get availableFloors(): any[] { return this.filteredFloors; }
  get availableBlocks(): any[] { return this.blocks; }

  // --- Marker tracking (keyed by cluster position key, not tid) ---
  private markers = new Map<string, THREE.Group>();         // posKey → group
  private markerTargets = new Map<string, THREE.Vector3>(); // posKey → world pos
  private clusterTids = new Map<string, Set<string>>();     // posKey → Set<tid>
  private tidToCluster = new Map<string, string>();          // tid → posKey
  private tagIndex = new Map<string, TrackedTag>();          // tid → TrackedTag
  private textureCache = new Map<string, THREE.Texture>();   // ttp → texture
  private mqttSubscription: any;
  private mqttConnectionSubscription: any;

  // --- Adaptive clustering ---
  // Threshold: world-space radius equivalent to this many pixels at the current zoom.
  // Markers within this radius collapse into one cluster badge.
  private readonly CLUSTER_PX = 56;
  private lastClusterCamDist = -1;
  private lastReclusterTime = 0;

  // --- Filter / display ---
  availableTtps: string[] = [];
  selectedTtps = new Set<string>();                          // empty = show all
  tagCounts = new Map<string, number>();                     // ttp → count

  // --- Active location panel ([] = closed, populated on marker click) ---
  activeTags: TrackedTag[] = [];
  activeClusterKey: string | null = null;

  // --- Connection status ---
  isConnected = false;

  get allowFullHeight(): boolean {
    return this.type === 'popup' || this.type === 'container' || (this.requestId && this.requestType === 'mustering');
  }

  // --- Mustering: emergency location highlighting ---
  private incidentLocationIds = new Set<number>();
  private emergencyRooms: RoomMesh[] = [];
  private emergencyMarkers: any[] = [];
  private incidentDataFetched = false;
  private isEarthquake = false;
  private activityCategoryId = '';
  private earthquakeStencilMeshes: any[] = [];
  private buildingBorderGroups: THREE.Group[] = [];

  private readonly mqttService: MqttService;
  private readonly interactionService: InteractionService;

  constructor(injector: Injector, private router: Router) {
    super(injector);
    this.mqttService = injector.get(MqttService);
    this.interactionService = injector.get(InteractionService);
    this.routeVisualizationService = injector.get(RouteVisualizationService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestId']) {
      if (this.requestId && this.requestType === 'mustering') {
        this.incidentDataFetched = false;
        this.incidentLocationIds.clear();
        this.isEarthquake = false;
        this.activityCategoryId = '';
        this.fetchIncidentLocations();
      } else {
        this.clearEmergencyHighlight();
      }
    }

    if (changes['reqTagDetail']) {
      this.initPorterTracking();
    }

    if (changes['floorId'] && !changes['floorId'].firstChange) {
      const newFloorId = Number(changes['floorId'].currentValue);
      if (newFloorId && newFloorId !== this.selectedFloorId) {
        let foundFloor: any = null;
        for (const block of this.blockWithFloorList) {
          const f = (block.children || []).find((f: any) => Number(f.id) === newFloorId);
          if (f) { foundFloor = f; break; }
        }
        if (foundFloor) {
          this.fetchFloorDetails(foundFloor);
        }
      }
    }

    if (changes['locFlr']) {
      const newLocId = Number(changes['locFlr'].currentValue);
      if (newLocId) {
        const targetRoom = this.roomMeshes.find(r => Number(r.id) === newLocId);
        if (targetRoom) {
          if (!changes['locFlr'].firstChange) {
            this.cameraAnimationService.focusOnRoom(
              targetRoom, this.camera, this.controls,
              () => this.updateLabelVisibility()
            );
          }
          this.applyLocFlrHighlight();
        }
      } else {
        this.clearEmergencyHighlight();
      }
    }
  }

  protected override onMapConfigLoaded(): void {
    const wi = this.mapConfig.webIndoor;

    // Restore saved view mode
    if (wi?.viewMode) this.viewMode = wi.viewMode;

    // Restore saved label scale (stored as multiplier, e.g. 0.75 / 1.0 / 1.3 / 1.6)
    if (typeof wi?.labelScale === 'number') {
      this.applyLabelMultiplier(wi.labelScale);
    }

    // If the floor was already loaded before mapConfig arrived, re-apply now.
    // This covers the race where onFloorLoaded() ran before the API response.
    if (this.roomMeshes.length > 0 && this.controls) {
      this.applyViewModeConstraints();
      this.applyFloorDefaultCamera();
    }
  }

  // Apply a label scale multiplier both to the base scale (used for future floor builds)
  // and to any already-rendered labels via a proportional ratio.
  private applyLabelMultiplier(mult: number): void {
    const ratio = this.ltLabelMultiplier !== 0 ? mult / this.ltLabelMultiplier : 1;
    if (ratio !== 1 && this.roomMeshes.length > 0) {
      for (const room of this.roomMeshes) {
        if (room.label) {
          room.label.userData['fixedSX'] = (room.label.userData['fixedSX'] ?? room.label.scale.x) * ratio;
          room.label.userData['fixedSY'] = (room.label.userData['fixedSY'] ?? room.label.scale.y) * ratio;
        }
      }
      this.updateLabelVisibility();
    }
    this.labelScale = this.ltLabelBaseScale * mult;
    this.ltLabelMultiplier = mult;
  }

  protected override async onFloorLoaded(): Promise<void> {
    // Purge all tag/marker state from the previous floor. Floor changes driven
    // by the parent's floorId input skip onFloorSelect (and its clear), leaving
    // old-floor tags in tagIndex that reclusterAll() would otherwise resurrect
    // on the new floor. The broker flush below repopulates the current floor.
    this.clearAllMarkers();
    this.applyViewModeConstraints();
    this.applyFloorDefaultCamera();
    this.connectMqtt();
    // If already connected (floor switch), isConnected$ won't re-fire,
    // so request the current tag cache directly.
    if (this.isConnected) {
      this.requestCurrentTags();
    }
    if (this.requestType === 'mustering') {
      if (this.requestId && !this.incidentDataFetched) {
        this.fetchIncidentLocations();
      } else if (this.incidentLocationIds.size > 0 || this.isEarthquake) {
        this.applyEmergencyHighlight();
      }
    }
    if (this.requestType === 'porter') {
      this.drawPorterRoute();
    }
    if (this.locFlr) {
      this.applyLocFlrHighlight();
    }
  }

  private applyViewModeConstraints(): void {
    if (!this.controls) return;
    if (this.viewMode === '2d') {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = 0;
      this.controls.enableRotate = false;
      if (this.isRotateMode) {
        this.isRotateMode = false;
        this.allowRotate = false;
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        this.renderer.domElement.style.cursor = 'grab';
      }
    } else {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI / 2.1;
      this.controls.enableRotate = true;
    }
  }

  private applyFloorDefaultCamera(): void {
    const def = this.mapConfig.floorDefaults?.[String(this.selectedFloorId)];
    if (!def || !this.controls || !this.camera) return;

    const clamped = Math.max(
      this.controls.minDistance,
      Math.min(this.controls.maxDistance, def.distance)
    );

    if (this.viewMode === '2d') {
      const target = this.controls.target.clone();
      this.camera.position.set(target.x, clamped, target.z);
    } else {
      const spherical = new THREE.Spherical(clamped, def.phi, def.theta);
      const offset = new THREE.Vector3().setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(offset);
    }

    this.controls.update();
    this.updateLabelVisibility();
  }

  private fetchIncidentLocations(): void {
    if (this.incidentDataFetched || !this.requestId || this.requestType !== 'mustering') return;
    this.incidentDataFetched = true;
    this.commonService.getTasksByRequestId(this.requestId).subscribe((res: any) => {
      if (res?.statusCode === 1 && res?.results?.length > 0) {
        const task = res.results[0];
        this.activityCategoryId = task.activityCategoryId || '';
        this.isEarthquake = this.activityCategoryId === 'AC-EARTHQUAKE' || this.activityCategoryId === 'AC-EAQU';
        const locations: { id: number; name: string }[] = task.incidentLocations || [];
        locations.forEach(loc => this.incidentLocationIds.add(Number(loc.id)));
        this.applyEmergencyHighlight();
      }
    });
  }

  private applyEmergencyHighlight(): void {
    this.emergencyRooms.forEach(room => {
      const mat = room.floor.material as any;
      mat.color.setHex(room.originalColor);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      room.floor.scale.x = 1;
      room.floor.scale.z = 1;
      if (room.floor.userData['vibOrigX'] !== undefined) {
        room.floor.position.x = room.floor.userData['vibOrigX'];
        room.floor.position.z = room.floor.userData['vibOrigZ'];
        delete room.floor.userData['vibOrigX'];
        delete room.floor.userData['vibOrigZ'];
      }
    });
    this.removeEmergencyMarkers();
    this.emergencyRooms = [];

    // EARTHQUAKE: affects entire floor, no incident locations needed
    if (this.isEarthquake) {
      this.roomMeshes.forEach(room => {
        this.emergencyRooms.push(room);
        room.floor.userData['vibOrigX'] = room.floor.position.x;
        room.floor.userData['vibOrigZ'] = room.floor.position.z;
        room.walls.forEach(wall => {
          const wmat = wall.material as any;
          wall.userData['origColor']             = wmat.color?.getHex()    ?? 0x888888;
          wall.userData['origEmissive']          = wmat.emissive?.getHex() ?? 0x000000;
          wall.userData['origEmissiveIntensity'] = wmat.emissiveIntensity  ?? 0;
          if (wmat.color)    wmat.color.setHex(0x0044ff);
          if (wmat.emissive) { wmat.emissive.setHex(0x0044ff); wmat.emissiveIntensity = 2.0; }
        });
      });
      // Stencil masks for ALL rooms to clip ripple to floor boundaries
      if (this.earthquakeStencilMeshes.length === 0) {
        this.roomMeshes.forEach(r => this.addStencilMask(r));
      }
      this.createEarthquakeEffect();
      return;
    }

    this.roomMeshes.forEach(room => {
      if (this.incidentLocationIds.has(room.id)) {
        const mat = room.floor.material as any;
        if (this.activityCategoryId === 'AC-FIRE') {
          this.emergencyRooms.push(room);
          room.walls.forEach(wall => {
            const wmat = wall.material as any;
            wall.userData['origColor']             = wmat.color?.getHex()    ?? 0x888888;
            wall.userData['origEmissive']          = wmat.emissive?.getHex() ?? 0x000000;
            wall.userData['origEmissiveIntensity'] = wmat.emissiveIntensity  ?? 0;
            if (wmat.color)    wmat.color.setHex(0xff0000);
            if (wmat.emissive) { wmat.emissive.setHex(0xff0000); wmat.emissiveIntensity = 2.0; }
          });
          this.createFireEffect(room);
          this.highlightBuildingBorder(room);
        } else {
          this.emergencyRooms.push(room);
          mat.color.setHex(0xff1a1a);
          mat.emissive.setHex(0xff0000);
          mat.emissiveIntensity = 0.8;
          this.createEmergencyPin(room);
        }
      }
    });
  }

  // ── Emergency pin / marker ─────────────────────────────────────

  private createEmergencyPin(room: RoomMesh): void {
    this.spawnEmergencyPinAt(this.getEmergencyPinPosition(room), false, `em-pin-${room.id}`);
  }

  private createEarthquakeEffect(): void {
    // Compute floor center from all room meshes (geometric center of the floor)
    const floorBox = new THREE.Box3();
    this.roomMeshes.forEach(r => floorBox.expandByObject(r.floor));
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      floorBox.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
    }
    const center = new THREE.Vector3();
    floorBox.getCenter(center);

    // Floor inscribed radius for max ring scale
    const fsz = new THREE.Vector3();
    floorBox.getSize(fsz);
    const floorInscribedR = Math.min(fsz.x, fsz.z) / 2;

    const group = new THREE.Group();
    group.name = 'em-quake-center';
    group.position.set(center.x, 0, center.z);
    group.userData['isEarthquake'] = true;
    group.userData['maxScale'] = Math.max(2, floorInscribedR / 2.4);

    // Center glow - soft red
    const glowTex = this.createQuakeGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.6,
      depthTest: false, depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.name = 'em-quake-glow';
    glowSprite.scale.set(8, 8, 1);
    glowSprite.position.y = 0.1;
    glowSprite.renderOrder = 98;
    group.add(glowSprite);

    // 4 concentric seismic ripple rings - red emergency-colored, clipped to floor via stencil
    const NUM_RINGS = 4;
    const ringColors = [0xb71c1c, 0xd32f2f, 0xe53935, 0xef5350];
    for (let i = 0; i < NUM_RINGS; i++) {
      const ringGeo = new THREE.RingGeometry(1, 2.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[i], transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false, depthTest: true,
        stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = `em-ring-${i}`;
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.3;
      ring.userData['phase'] = i / NUM_RINGS;
      ring.renderOrder = 100;
      group.add(ring);
    }

    (this.buildingGroup ?? this.scene).add(group);

    const parentScale = new THREE.Vector3(1, 1, 1);
    group.getWorldScale(parentScale);
    const px = parentScale.x || 1;
    const py = parentScale.y || 1;
    const pz = parentScale.z || 1;
    glowSprite.scale.set(8 / px, 8 / py, 1 / pz);

    this.emergencyMarkers.push(group);
  }

  private createQuakeGlowTexture(): THREE.CanvasTexture {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9);
    grad.addColorStop(0, 'rgba(229, 57, 53, 0.8)');        // #E53935 primary
    grad.addColorStop(0.3, 'rgba(239, 83, 80, 0.4)');      // #EF5350 secondary
    grad.addColorStop(0.6, 'rgba(229, 57, 53, 0.15)');     // fade
    grad.addColorStop(1, 'rgba(200, 40, 30, 0)');          // transparent
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // ── Building polygon border highlight (AC-FIRE) ────────────────

  private highlightBuildingBorder(room: RoomMesh, showGlow = true): void {
    room.floor.updateWorldMatrix(true, false);
    const worldPts: { x: number; z: number }[] = [];

    const geom = room.floor.geometry as any;
    if (geom?.parameters?.shapes) {
      // ExtrudeGeometry (3D floor)
      const shapes = geom.parameters.shapes;
      const shapeArray = Array.isArray(shapes) ? shapes : [shapes];
      shapeArray.forEach(shape => {
        if (typeof shape.getPoints === 'function') {
          const points2d = shape.getPoints();
          points2d.forEach((p2d: any) => {
            const v = new THREE.Vector3(p2d.x, p2d.y, 0);
            v.applyMatrix4(room.floor.matrixWorld);
            if (this.buildingGroup) this.buildingGroup.worldToLocal(v);
            worldPts.push({ x: v.x, z: v.z });
          });
        }
      });
    } else {
      // LineLoop fallback (2D floor)
      const outline = room.floor.children.find((c: any) => c.type === 'LineLoop') as THREE.LineLoop | undefined;
      if (outline) {
        const pos = outline.geometry.getAttribute('position');
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), 0);
            v.applyMatrix4(room.floor.matrixWorld);
            if (this.buildingGroup) this.buildingGroup.worldToLocal(v);
            worldPts.push({ x: v.x, z: v.z });
          }
        }
      }
    }

    if (worldPts.length < 3) return;

    // Use floor mesh position Y plus a slight offset (0.05) to ensure it sits slightly above floor surface
    const y = room.floor.position.y + 0.05;
    const borderPts = worldPts.map(p => new THREE.Vector3(p.x, y, p.z));

    // Centroid for glow expansion
    const cx = worldPts.reduce((s, p) => s + p.x, 0) / worldPts.length;
    const cz = worldPts.reduce((s, p) => s + p.z, 0) / worldPts.length;
    const glowPts = worldPts.map(p => {
      const dx = p.x - cx, dz = p.z - cz;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      return new THREE.Vector3(p.x + dx / dist * 0.15, y - 0.02, p.z + dz / dist * 0.15);
    });

    const group = new THREE.Group();
    group.name = 'em-building-border';

    const geo = new THREE.BufferGeometry().setFromPoints(borderPts);
    const mat = new THREE.LineBasicMaterial({
      color: 0xd32f2f, transparent: true, opacity: 0.85, depthTest: false,
    });
    const line = new THREE.LineLoop(geo, mat);
    line.name = 'em-building-border-line';
    line.renderOrder = 200;
    group.add(line);

    if (showGlow) {
      const glowGeo = new THREE.BufferGeometry().setFromPoints(glowPts);
      const glowMat = new THREE.LineBasicMaterial({
        color: 0xf44336, transparent: true, opacity: 0.25, depthTest: false,
      });
      const glow = new THREE.LineLoop(glowGeo, glowMat);
      glow.name = 'em-building-border-glow';
      glow.renderOrder = 199;
      group.add(glow);
    }

    (this.buildingGroup ?? this.scene).add(group);
    this.buildingBorderGroups.push(group);
  }

  private removeBuildingBorder(): void {
    const parent = this.buildingGroup ?? this.scene;
    this.buildingBorderGroups.forEach(group => {
      parent?.remove(group);
      group.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.buildingBorderGroups = [];
  }

  private addStencilMask(room: RoomMesh): void {
    const mat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: false, depthTest: false,
      stencilWrite: true, stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    });
    const mask = new THREE.Mesh(room.floor.geometry, mat);
    mask.position.copy(room.floor.position);
    mask.rotation.copy(room.floor.rotation);
    mask.scale.copy(room.floor.scale);
    mask.renderOrder = -100;
    room.floor.parent?.add(mask);
    this.earthquakeStencilMeshes.push({ mesh: mask, parent: room.floor.parent });
  }

  private spawnEmergencyPinAt(pos: any, isEarthquake: boolean, name: string): void {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(pos.x, 0, pos.z);
    group.userData['isEarthquake'] = isEarthquake;

    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(1, 2.4, 40);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff1a1a, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = `em-ring-${i}`;
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.4;
      ring.userData['phase'] = i / 3;
      group.add(ring);
    }

    const spriteMat = new THREE.SpriteMaterial({
      map: this.createEmergencyPinTexture(),
      transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'em-sprite';
    sprite.scale.set(12, 17, 1);
    sprite.position.y = 18;
    sprite.renderOrder = 1020;
    group.add(sprite);

    (this.buildingGroup ?? this.scene).add(group);

    const parentScale = new THREE.Vector3(1, 1, 1);
    group.getWorldScale(parentScale);
    const px = parentScale.x || 1;
    const py = parentScale.y || 1;
    const pz = parentScale.z || 1;
    sprite.scale.set(12 / px, 17 / py, 1 / pz);

    this.emergencyMarkers.push(group);
  }

  private getEmergencyPinPosition(room: RoomMesh): any {
    room.floor.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(room.floor);
    const world = new THREE.Vector3();
    box.getCenter(world);
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      world.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
    }
    return world;
  }

  // ── Fire effect (AC-FIRE) ─────────────────────────────────────

  private createFireEffect(room: RoomMesh): void {
    const pos = this.getEmergencyPinPosition(room);

    const roomBox = new THREE.Box3().setFromObject(room.floor);
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      roomBox.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
    }
    const rsz = new THREE.Vector3();
    roomBox.getSize(rsz);
    const roomInscribedR = Math.min(rsz.x, rsz.z) / 2 * 0.88;
    const groupScale = Math.min(1, (roomInscribedR * 0.85) / 3.8);
    const maxScale = 0.15;

    const group = new THREE.Group();
    group.name = `em-fire-${room.id}`;
    group.position.set(pos.x, 0, pos.z);
    group.userData['isFire'] = true;
    group.userData['maxScale'] = maxScale;

    // 1. Heat Glow - soft radial gradient under the fire
    const glowTex = this.createHeatGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.7,
      depthTest: false, depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.name = 'em-heat-glow';
    glowSprite.scale.set(8, 8, 1);
    glowSprite.position.y = 0.1;
    glowSprite.renderOrder = 98;
    group.add(glowSprite);

    // 2. Fire Lighting - subtle red ambient glow around the flame
    const lightTex = this.createFireLightTexture();
    const lightMat = new THREE.SpriteMaterial({
      map: lightTex, transparent: true, opacity: 0.35,
      depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lightSprite = new THREE.Sprite(lightMat);
    lightSprite.name = 'em-fire-light';
    lightSprite.scale.set(18, 18, 1);
    lightSprite.position.y = 0.5;
    lightSprite.renderOrder = 97;
    group.add(lightSprite);

    // 2b. Outer Warm Glow - subtle golden halo around the pulse rings
    const outerGlowTex = this.createOuterGlowTexture();
    const outerGlowMat = new THREE.SpriteMaterial({
      map: outerGlowTex, transparent: true, opacity: 0.2,
      depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const outerGlowSprite = new THREE.Sprite(outerGlowMat);
    outerGlowSprite.name = 'em-outer-glow';
    outerGlowSprite.scale.set(24, 24, 1);
    outerGlowSprite.position.y = 0.05;
    outerGlowSprite.renderOrder = 96;
    group.add(outerGlowSprite);

    // 4. Ember particles - tiny glowing specks that float upward
    const emberTex = this.createEmberTexture();
    for (let i = 0; i < 8; i++) {
      const emat = new THREE.SpriteMaterial({
        map: emberTex, transparent: true, opacity: 0,
        depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xff6d00,
      });
      const ember = new THREE.Sprite(emat);
      ember.name = `em-ember-${i}`;
      ember.position.set((Math.random() - 0.5) * 1.8, Math.random() * 2, (Math.random() - 0.5) * 1.8);
      ember.userData['phase'] = i / 8;
      ember.userData['speed'] = 0.25 + Math.random() * 0.2;
      ember.userData['driftX'] = (Math.random() - 0.5) * 2.5;
      ember.userData['driftZ'] = (Math.random() - 0.5) * 2.5;
      ember.userData['life'] = 0.6 + Math.random() * 0.4;
      ember.renderOrder = 103;
      group.add(ember);
    }

    // 5. Pulse Rings - 4 concentric rings with heat color gradient
    const ringConfigs = [
      { inner: 0.300, outer: 0.883, color: 0xb71c1c, opacity: 0.70 }, // Dark Red - closest
      { inner: 0.883, outer: 1.467, color: 0xa62c04, opacity: 0.60 }, // Dark Red-Orange
      { inner: 1.467, outer: 2.050, color: 0xbf360c, opacity: 0.50 }, // Deep Orange
      { inner: 2.050, outer: 2.633, color: 0xd68910, opacity: 0.40 }, // Burnt Orange-Yellow
      { inner: 2.633, outer: 3.217, color: 0xc9950c, opacity: 0.30 }, // Dark Mustard Yellow
      { inner: 3.217, outer: 3.800, color: 0xb8860b, opacity: 0.20 }, // Dark Goldenrod - outer
    ];
    group.userData['ringCount'] = ringConfigs.length;
    ringConfigs.forEach((cfg, i) => {
      const ringGeo = new THREE.RingGeometry(cfg.inner, cfg.outer, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false, depthTest: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = `em-ring-${i}`;
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.3;
      ring.userData['phase'] = i / ringConfigs.length;
      ring.userData['baseOpacity'] = cfg.opacity;
      ring.renderOrder = 100;
      group.add(ring);
    });

    // 6. Smoke Particles - 4 rising sprites
    const smokeTex = this.createSmokeTexture();
    for (let i = 0; i < 4; i++) {
      const smat = new THREE.SpriteMaterial({
        map: smokeTex, transparent: true, opacity: 0,
        depthTest: false, depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const sp = new THREE.Sprite(smat);
      sp.name = `em-smoke-${i}`;
      sp.position.set(
        (i % 2 === 0 ? 1 : -1) * (0.8 + i * 0.4),
        4.8 + i * 0.6,
        (i < 2 ? 1 : -1) * (0.4 + i * 0.3)
      );
      sp.userData['phase']     = i / 4;
      sp.userData['driftX']    = (i % 2 === 0 ? 1 : -1) * 1.5;
      sp.userData['baseScale'] = 3.0 + i * 0.5;
      sp.renderOrder = 102;
      group.add(sp);
    }

    group.scale.setScalar(groupScale);

    (this.buildingGroup ?? this.scene).add(group);
    this.emergencyMarkers.push(group);
  }

  private createSmokeTexture(): any {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;

    // Dark wispy smoke body
    const outer = ctx.createRadialGradient(c, c, 0, c, c, c * 0.98);
    outer.addColorStop(0,    'rgba(45, 45, 52, 0.82)');
    outer.addColorStop(0.35, 'rgba(38, 38, 44, 0.60)');
    outer.addColorStop(0.65, 'rgba(28, 28, 34, 0.28)');
    outer.addColorStop(1,    'rgba(18, 18, 24, 0.00)');
    ctx.fillStyle = outer;
    ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();

    // Offset secondary blob for asymmetric wispy appearance
    const bx = c - S * 0.12, by = c - S * 0.10;
    const blob = ctx.createRadialGradient(bx, by, 0, bx, by, S * 0.32);
    blob.addColorStop(0, 'rgba(55, 55, 65, 0.55)');
    blob.addColorStop(1, 'rgba(30, 30, 40, 0.00)');
    ctx.fillStyle = blob;
    ctx.beginPath(); ctx.arc(bx, by, S * 0.32, 0, Math.PI * 2); ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private createEmberTexture(): THREE.CanvasTexture {
    const S = 16;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
    grad.addColorStop(0.4, 'rgba(255, 180, 50, 0.9)');
    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  private createHeatGlowTexture(): THREE.CanvasTexture {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.95);
    grad.addColorStop(0, 'rgba(244, 67, 54, 0.9)');      // #F44336 bright red
    grad.addColorStop(0.25, 'rgba(211, 47, 47, 0.6)');    // #D32F2F primary
    grad.addColorStop(0.5, 'rgba(183, 28, 28, 0.35)');    // #B71C1C dark
    grad.addColorStop(0.75, 'rgba(130, 18, 18, 0.12)');   // darker
    grad.addColorStop(1, 'rgba(60, 8, 8, 0)');            // transparent
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.95, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private createFireLightTexture(): THREE.CanvasTexture {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9);
    grad.addColorStop(0, 'rgba(244, 67, 54, 0.5)');       // #F44336 bright red
    grad.addColorStop(0.3, 'rgba(211, 47, 47, 0.25)');    // #D32F2F primary
    grad.addColorStop(0.6, 'rgba(183, 28, 28, 0.1)');     // #B71C1C dark
    grad.addColorStop(1, 'rgba(60, 8, 8, 0)');             // transparent
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private createOuterGlowTexture(): THREE.CanvasTexture {
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;

    const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.95);
    grad.addColorStop(0, 'rgba(255, 179, 0, 0)');
    grad.addColorStop(0.2, 'rgba(255, 179, 0, 0.05)');
    grad.addColorStop(0.4, 'rgba(255, 179, 0, 0.12)');
    grad.addColorStop(0.6, 'rgba(255, 179, 0, 0.2)');
    grad.addColorStop(0.8, 'rgba(255, 179, 0, 0.15)');
    grad.addColorStop(1, 'rgba(255, 179, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.95, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private createEmergencyPinTexture(): any {
    const W = 128, H = 188;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const r  = W * 0.37;
    const cy = r + 6;

    // Soft outer glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.7);
    glow.addColorStop(0, 'rgba(255,60,60,0.40)');
    glow.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2); ctx.fill();

    // Pin circle body — radial gradient for 3-D depth
    const bodyGrad = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.06, cx, cy, r);
    bodyGrad.addColorStop(0, '#FF4F4F');
    bodyGrad.addColorStop(0.55, '#E53935');
    bodyGrad.addColorStop(1,  '#B71C1C');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(90,0,0,0.55)'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Crisp white ring border
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2); ctx.stroke();

    // Exclamation mark — bar
    const barW  = r * 0.16;
    const barH  = r * 0.58;
    const barX  = cx - barW / 2;
    const barY  = cy - r * 0.50;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(barX + barW * 0.4, barY);
    ctx.lineTo(barX + barW * 0.6, barY);
    ctx.lineTo(barX + barW, barY + barH);
    ctx.lineTo(barX, barY + barH);
    ctx.closePath(); ctx.fill();

    // Exclamation mark — dot
    ctx.beginPath();
    ctx.arc(cx, barY + barH + barW * 1.7, barW * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Teardrop tail
    const tailTop = cy + r * 0.84;
    const tailBot = H - 10;
    const tailCtrl = tailTop + (tailBot - tailTop) * 0.45;
    ctx.fillStyle = '#E53935';
    ctx.shadowColor = 'rgba(90,0,0,0.35)'; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.36, tailTop);
    ctx.quadraticCurveTo(cx - r * 0.14, tailCtrl, cx, tailBot);
    ctx.quadraticCurveTo(cx + r * 0.14, tailCtrl, cx + r * 0.36, tailTop);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    return new THREE.CanvasTexture(canvas);
  }

  private animateEmergencyMarkers(): void {
    if (this.emergencyMarkers.length === 0) return;
    const t = Date.now() / 1000;
    this.emergencyMarkers.forEach(group => {
      const isFire = !!group.userData['isFire'];
      const isEq   = !!group.userData['isEarthquake'];
      const maxScale  = group.userData['maxScale'] || 9;

      // ── Fire Animation ────────────────────────────────────────
      if (isFire) {
        const heatGlow: any = group.getObjectByName('em-heat-glow');
        const fireLight: any = group.getObjectByName('em-fire-light');

        // Dynamic glow linked to outer flame flicker
        if (heatGlow) {
          const glowPulse = Math.sin(t * 5.7) * 0.15;
          heatGlow.material.opacity = 0.55 + glowPulse;
          const s = 8 + Math.sin(t * 5.4) * 0.8;
          heatGlow.scale.set(s, s, 1);
        }

        // Fire light ambient — responds to flame
        if (fireLight) {
          fireLight.material.opacity = 0.3 + Math.sin(t * 5.1) * 0.12;
        }

        // Ember particles — float upward, fade, and loop
        for (let i = 0; i < 8; i++) {
          const ember: any = group.getObjectByName(`em-ember-${i}`);
          if (!ember) continue;
          const cycle = ((t * ember.userData['speed']) + ember.userData['phase']) % 1;
          const progress = cycle;
          const life = ember.userData['life'];
          if (progress < life * 0.15) {
            ember.material.opacity = (progress / (life * 0.15)) * 0.7;
          } else {
            ember.material.opacity = Math.max(0, (1 - progress) / (1 - life * 0.15)) * 0.7;
          }
          ember.position.y = progress * 4.5;
          ember.position.x += Math.sin(t * 2.2 + i * 0.7) * 0.004;
          ember.position.z += Math.cos(t * 1.9 + i * 0.5) * 0.004;
          const es = 0.4 + progress * 1.8;
          ember.scale.set(es, es, 1);
        }

        // Pulse rings - concentric rings with heat color gradient
        const ringSpeed = 0.4;
        const ringCount = group.userData['ringCount'] || 4;
        for (let i = 0; i < ringCount; i++) {
          const ring: any = group.getObjectByName(`em-ring-${i}`);
          if (!ring) continue;
          const phase = ((t * ringSpeed) + i / ringCount) % 1;
          const eased = phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2;
          ring.scale.setScalar(1 + eased * maxScale);
          ring.material.opacity = (1 - eased) * ring.userData['baseOpacity'];
        }

        // Building border highlight pulse
        const phase = t * (Math.PI / 0.9); // ~1.8s full cycle
        const pulse = 0.85 + Math.sin(phase) * 0.15; // 0.70 → 1.00 range
        this.buildingBorderGroups.forEach(group => {
          const line: any = group.getObjectByName('em-building-border-line');
          if (line) line.material.opacity = pulse;
          const glow: any = group.getObjectByName('em-building-border-glow');
          if (glow) glow.material.opacity = 0.25 + Math.sin(phase) * 0.1; // 0.15 → 0.35
        });

        // Smoke particles - rise, drift, fade
        for (let i = 0; i < 4; i++) {
          const smoke: any = group.getObjectByName(`em-smoke-${i}`);
          if (!smoke) continue;
          const sp = ((t * 0.15) + i / 4) % 1;
          smoke.position.y = 4.8 + sp * 12;
          smoke.position.x = smoke.userData['driftX'] * Math.sin(sp * Math.PI * 0.8 + i);
          const sc = smoke.userData['baseScale'] * (0.3 + sp * 1.8);
          smoke.scale.set(sc, sc, 1);
          smoke.material.opacity = sp < 0.15
            ? (sp / 0.15) * 0.4
            : (1 - sp) * 0.4;
        }
      }

      // ── Earthquake Animation ──────────────────────────────────
      else if (isEq) {
        const glow: any = group.getObjectByName('em-quake-glow');
        if (glow) {
          glow.material.opacity = 0.4 + Math.sin(t * 1.5) * 0.15;
          const s = 8 + Math.sin(t * 1.2) * 1;
          glow.scale.set(s, s, 1);
        }

        // Seismic ripple rings - multiple concentric red layers expanding with easing
        const ringSpeed = 0.25;
        const NUM_RINGS = 4;
        const ringHexColors = [0xb71c1c, 0xd32f2f, 0xe53935, 0xef5350];
        for (let i = 0; i < NUM_RINGS; i++) {
          const ring: any = group.getObjectByName(`em-ring-${i}`);
          if (!ring) continue;
          const phase = ((t * ringSpeed) + i / NUM_RINGS) % 1;
          const eased = 1 - Math.pow(1 - phase, 1.8);
          ring.scale.setScalar(1 + eased * maxScale);
          ring.material.opacity = (1 - eased) * 0.5;
          const base = new THREE.Color(ringHexColors[i] || 0xe53935);
          const l = 1 + eased * 0.25;
          ring.material.color.setRGB(
            Math.min(1, base.r * l),
            Math.min(1, base.g * l),
            Math.min(1, base.b * l)
          );
        }
      }

      // ── Generic Emergency Animation ───────────────────────────
      else {
        const sprite: any = group.getObjectByName('em-sprite');
        if (sprite) sprite.position.y = 18 + Math.sin(t * 1.8) * 2.2;

        const ringSpeed = 0.65;
        for (let i = 0; i < 3; i++) {
          const ring: any = group.getObjectByName(`em-ring-${i}`);
          if (!ring) continue;
          const phase = ((t * ringSpeed) + i / 3) % 1;
          ring.scale.setScalar(1 + phase * 9);
          ring.material.opacity = (1 - phase) * 0.72;
          ring.material.color.setRGB(1.0, phase * 0.45, phase * 0.45);
        }
      }
    });
  }

  private removeEmergencyMarkers(): void {
    const parent = this.buildingGroup ?? this.scene;
    this.emergencyMarkers.forEach(group => {
      parent?.remove(group);
      group.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose());
        else if (mat) mat.dispose();
      });
    });
    this.emergencyMarkers = [];
  }

  private animateEmergencyRooms(): void {
    if (this.emergencyRooms.length === 0) return;

    // Earthquake: gentle vibration + floor pulse on all rooms
    if (this.isEarthquake) {
      const t = Date.now() / 1000;
      this.emergencyRooms.forEach(room => {
        const floor = room.floor;
        const pulse = 1 + Math.sin(t * 4 + room.id * 0.1) * 0.003;
        floor.scale.x = pulse;
        floor.scale.z = pulse;
        const origX = floor.userData['vibOrigX'] ?? floor.position.x;
        const origZ = floor.userData['vibOrigZ'] ?? floor.position.z;
        floor.position.x = origX + Math.sin(t * 25 + room.id) * 0.008;
        floor.position.z = origZ + Math.cos(t * 23 + room.id * 1.5) * 0.008;
      });
      return;
    }

    // Fire: no floor blink (only red border walls set once on apply)
    if (this.activityCategoryId === 'AC-FIRE' && this.requestType === 'mustering') return;

    if (this.requestType !== 'mustering') {
      // Glow Breathe Animation: pulsing ceiling/floor opacity and emissive from normal red to bold bright red
      const t = Date.now() / 1000;
      const pulseFactor = 0.5 + Math.sin(t * 3.5) * 0.5; // 0 to 1, speed increased to 3.5
      const currentOpacity = 0.18 + pulseFactor * 0.37; // 0.18 (normal red) to 0.55 (bold bright red)
      const currentEmissiveIntensity = 0.1 + pulseFactor * 1.4; // 0.1 to 1.5 range
      const pulseColorHex = 0xff0000; // purely red, no green/blue shifting (no pink)

      this.emergencyRooms.forEach(room => {
        const geom = room.floor.geometry as any;
        const is3D = geom?.type === 'ExtrudeGeometry';
        const mats = room.floor.material as any;

        if (is3D) {
          // 3D view: animate the cap material (ceiling) only; leave the side material static red
          if (Array.isArray(mats) && mats.length > 0) {
            const capMat = mats[0];
            if (capMat) {
              capMat.opacity = currentOpacity;
              if (capMat.color) capMat.color.setHex(pulseColorHex);
              if (capMat.emissive) {
                capMat.emissive.setHex(pulseColorHex);
                capMat.emissiveIntensity = currentEmissiveIntensity;
              }
            }
          }
        } else {
          // 2D view: animate the main floor mesh material only; leave wall meshes static red
          if (mats && !Array.isArray(mats)) {
            mats.opacity = currentOpacity;
            if (mats.color) mats.color.setHex(pulseColorHex);
            if (mats.emissive) {
              mats.emissive.setHex(pulseColorHex);
              mats.emissiveIntensity = currentEmissiveIntensity;
            }
          }
        }
      });
      return;
    }

    // Default mustering: hard floor blink (safe against array materials)
    const t = Date.now();
    const isRed = (t % 1000) < 600;
    this.emergencyRooms.forEach(room => {
      const mats = room.floor.material as any;
      const matList = Array.isArray(mats) ? mats : [mats];
      matList.forEach(mat => {
        if (mat?.color) {
          if (isRed) {
            mat.color.setHex(0xff0000);
            if (mat.emissive) { mat.emissive.setHex(0xff0000); mat.emissiveIntensity = 1.2; }
          } else {
            mat.color.setHex(room.originalColor);
            if (mat.emissive) { mat.emissive.setHex(0x000000); mat.emissiveIntensity = 0; }
          }
        }
      });
    });
  }

  private clearEmergencyHighlight(): void {
    this.emergencyRooms.forEach(room => {
      if (room.floor.userData['origMaterial'] !== undefined) {
        const currentMat = room.floor.material as any;
        if (Array.isArray(currentMat)) {
          currentMat.forEach(m => {
            if (m !== room.floor.userData['origMaterial']) {
              m.dispose();
            }
          });
        }
        room.floor.material = room.floor.userData['origMaterial'];
        delete room.floor.userData['origMaterial'];
      } else {
        const mat = room.floor.material as any;
        if (mat.color)    mat.color.setHex(room.originalColor);
        if (mat.emissive) { mat.emissive.setHex(0x000000); mat.emissiveIntensity = 0; }
        if (room.floor.userData['origOpacity'] !== undefined) {
          mat.opacity = room.floor.userData['origOpacity'];
          mat.transparent = room.floor.userData['origTransparent'];
          delete room.floor.userData['origOpacity'];
          delete room.floor.userData['origTransparent'];
        }
      }
      room.floor.scale.x = 1;
      room.floor.scale.z = 1;
      if (room.floor.userData['vibOrigX'] !== undefined) {
        room.floor.position.x = room.floor.userData['vibOrigX'];
        room.floor.position.z = room.floor.userData['vibOrigZ'];
        delete room.floor.userData['vibOrigX'];
        delete room.floor.userData['vibOrigZ'];
      }
      room.walls.forEach(wall => {
        const wmat = wall.material as any;
        if (wall.userData['origColor'] !== undefined) {
          if (wmat.color)    wmat.color.setHex(wall.userData['origColor']);
          if (wmat.emissive) {
            wmat.emissive.setHex(wall.userData['origEmissive'] ?? 0x000000);
            wmat.emissiveIntensity = wall.userData['origEmissiveIntensity'] ?? 0;
          }
          if (wall.userData['origOpacity'] !== undefined) {
            wmat.opacity = wall.userData['origOpacity'];
            wmat.transparent = wall.userData['origTransparent'];
            delete wall.userData['origOpacity'];
            delete wall.userData['origTransparent'];
          }
        }
      });
    });
    this.emergencyRooms = [];
    this.removeEmergencyMarkers();
    this.removeBuildingBorder();
    this.removeEarthquakeStencilMasks();
    this.incidentLocationIds.clear();
    this.incidentDataFetched = false;
    this.isEarthquake = false;
    this.activityCategoryId = '';
  }

  private applyLocFlrHighlight(): void {
    this.clearEmergencyHighlight();

    if (!this.locFlr) return;

    const targetRoom = this.roomMeshes.find(r => Number(r.id) === Number(this.locFlr));
    if (targetRoom) {
      this.emergencyRooms.push(targetRoom);

      const geom = targetRoom.floor.geometry as any;
      const is3D = geom?.type === 'ExtrudeGeometry';

      if (is3D) {
        // Highlight 3D room mesh dynamically using array materials
        const origMat = targetRoom.floor.material as THREE.MeshStandardMaterial;
        if (targetRoom.floor.userData['origMaterial'] === undefined) {
          targetRoom.floor.userData['origMaterial'] = origMat;
        }

        // Cap Material (Ceiling): transparent red with reduced opacity (0.18)
        const capMat = origMat.clone();
        capMat.transparent = true;
        capMat.opacity = 0.18;
        if (capMat.color) capMat.color.setHex(0xff1a1a);
        if (capMat.emissive) {
          capMat.emissive.setHex(0xff0000);
          capMat.emissiveIntensity = 0.1;
        }
        capMat.needsUpdate = true;

        // Side Material (Walls/Sides): full opacity glowing red
        const sideMat = origMat.clone();
        sideMat.transparent = false;
        sideMat.opacity = 1.0;
        if (sideMat.color) sideMat.color.setHex(0xff0000);
        if (sideMat.emissive) {
          sideMat.emissive.setHex(0xff0000);
          sideMat.emissiveIntensity = 2.0;
        }
        sideMat.needsUpdate = true;

        targetRoom.floor.material = [capMat, sideMat];
      } else {
        // Highlight 2D floor mesh in transparent red with reduced opacity (0.18)
        const mat = targetRoom.floor.material as any;
        if (targetRoom.floor.userData['origOpacity'] === undefined) {
          targetRoom.floor.userData['origOpacity']     = mat.opacity ?? 1.0;
          targetRoom.floor.userData['origTransparent'] = mat.transparent ?? false;
        }
        if (mat.color) mat.color.setHex(0xff1a1a);
        mat.transparent = true;
        mat.opacity = 0.18;
        if (mat.emissive) {
          mat.emissive.setHex(0xff0000);
          mat.emissiveIntensity = 0.1;
          mat.needsUpdate = true;
        }

        // Highlight separate walls (side parts) with full opacity glowing red in 2D
        targetRoom.walls.forEach(wall => {
          const wmat = wall.material as any;
          if (wall.userData['origColor'] === undefined) {
            wall.userData['origColor']             = wmat.color?.getHex()    ?? 0x888888;
            wall.userData['origEmissive']          = wmat.emissive?.getHex() ?? 0x000000;
            wall.userData['origEmissiveIntensity'] = wmat.emissiveIntensity  ?? 0;
            wall.userData['origOpacity']           = wmat.opacity            ?? 1.0;
            wall.userData['origTransparent']       = wmat.transparent        ?? false;
          }
          if (wmat.color) wmat.color.setHex(0xff0000);
          wmat.transparent = false;
          wmat.opacity = 1.0;
          if (wmat.emissive) {
            wmat.emissive.setHex(0xff0000);
            wmat.emissiveIntensity = 2.0;
            wmat.needsUpdate = true;
          }
        });
      }

      this.highlightBuildingBorder(targetRoom, false);
    }
  }

  private removeEarthquakeStencilMasks(): void {
    this.earthquakeStencilMeshes.forEach(({ mesh, parent }) => {
      parent?.remove(mesh);
      mesh.geometry?.dispose();
      (mesh.material as any)?.dispose();
    });
    this.earthquakeStencilMeshes = [];
  }

  // ---- Rendering ----

  protected animate(): void {
    if (!this.scene || !this.camera || !this.controls) return;
    this.controlsService.update();
    this.updateZoomValue();
    this.checkRecluster();
    this.animateMarkers();
    this.animateEmergencyRooms();
    this.animateEmergencyMarkers();
    this.rendererService.render(this.scene, this.camera);
  }
  // Target icon size in screen pixels — constant at every zoom level
  private readonly ICON_PX = 52;

  private animateMarkers(): void {
    if (!this.camera || !this.controls) return;

    // Exact world-space size that renders as ICON_PX pixels on screen at this camera distance.
    // Derived from the perspective projection: worldSize = 2 * tan(fov/2) * camDist / canvasHeight * px
    const camDist = this.camera.position.distanceTo(this.controls.target);
    const canvasH = this.renderer.domElement.clientHeight || 600;
    const fovY = THREE.MathUtils.degToRad((this.camera as any).fov ?? 50);
    const calculatedSize = 2 * Math.tan(fovY / 2) * camDist / canvasH * this.ICON_PX;
    const iconSize = Math.max(1.5, calculatedSize);

    this.markers.forEach((group, tid) => {
      if (!group.visible) return;

      const target = this.markerTargets.get(tid);
      if (target) group.position.lerp(target, 0.12);

      // Exact constant screen-size: scale from camera geometry, position.y anchors bottom at coordinate
      const sprite = group.getObjectByName('icon-sprite') as THREE.Sprite;
      if (sprite) {
        const parentScale = new THREE.Vector3(1, 1, 1);
        group.getWorldScale(parentScale);
        const px = parentScale.x || 1;
        const py = parentScale.y || 1;
        const pz = parentScale.z || 1;
        sprite.scale.set(iconSize / px, iconSize / py, 1 / pz);
        sprite.position.y = 0.02;
        sprite.center.set(0.5, 0.05);
      }

      const t = Date.now() / 1000;
      const pulseSpeed = 0.55; // Slower, elegant pulse frequency
      const phase = (t * pulseSpeed) % 1;

      const ring = group.getObjectByName('pulse-ring') as THREE.Mesh;
      if (ring) {
        const mat = ring.material as any;
        ring.scale.setScalar(1 + phase * 2.2);
        mat.opacity = (1 - phase) * 0.9;
      }

      const baseCircle = group.getObjectByName('base-circle') as THREE.Mesh;
      if (baseCircle) {
        const mat = baseCircle.material as any;
        baseCircle.scale.setScalar(1 + phase * 1.8);
        mat.opacity = (1 - phase) * 0.6;
      }
    });
  }

  // ---- Mouse click for tag panel ----

  protected override onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.interactionService.updateMousePosition(event, rect);

    const allSprites: any[] = [];
    this.markers.forEach(g => {
      const s = g.getObjectByName('icon-sprite');
      if (s) allSprites.push(s);
    });

    const hit = this.interactionService.getIntersectedObject(this.camera, allSprites) as any;
    if (hit) {
      const group: any = hit.parent;
      const key = group.userData['clusterKey'] as string;
      const tids = this.clusterTids.get(key);
      if (tids) {
        this.activeClusterKey = key;
        this.activeTags = [...tids]
          .map(tid => this.tagIndex.get(tid))
          .filter((t): t is TrackedTag => !!t);
      }
    } else {
      this.activeTags = [];
      this.activeClusterKey = null;
    }
  }

  // Returns the room/location name for the currently-open cluster panel.
  getClusterLocationName(): string {
    if (!this.activeClusterKey) return 'Location';
    const pos = this.markerTargets.get(this.activeClusterKey);
    if (!pos) return 'Location';
    return this.findRoomNameForPosition(pos);
  }

  private findRoomNameForPosition(buildingLocalPos: THREE.Vector3): string {
    if (!this.roomMeshes?.length) return 'Location';

    // Convert building-group-local position to world space for comparison
    // with Box3.setFromObject (which returns world-space boxes).
    const worldPos = buildingLocalPos.clone();
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      worldPos.applyMatrix4(this.buildingGroup.matrixWorld);
    }

    let bestRoom: RoomMesh | null = null;
    let bestDist = Infinity;

    for (const room of this.roomMeshes) {
      const box = new THREE.Box3().setFromObject(room.floor);
      if (box.containsPoint(worldPos)) {
        return room.name || `Room ${room.id}`;
      }
      const center = new THREE.Vector3();
      box.getCenter(center);
      const dist = center.distanceTo(worldPos);
      if (dist < bestDist) {
        bestDist = dist;
        bestRoom = room;
      }
    }

    return bestRoom?.name || 'Location';
  }

  // ---- MQTT ----

  private mqttConnected = false;
  private mqttConnecting = false;
  private lastCurrentTagsRequestKey = '';

  private connectMqtt(): void {
    // Only establish the connection once — subsequent floor switches reuse it
    if (this.mqttConnected || this.mqttConnecting) return;
    this.mqttConnecting = true;

    // Broker record is cached for the session — repeat opens skip this API call
    this.threeMapCache.getMqttBroker().subscribe((res: any) => {
      if (!res?.results?.length) {
        this.mqttConnecting = false;
        return;
      }

      const brokerInfo = res.results.find((b: any) => b.brokerTypeId === 'BT-CL');
      if (!brokerInfo) {
        this.mqttConnecting = false;
        return;
      }

      this.mqttService.connect({
        hostname: brokerInfo.host,
        port: brokerInfo.wport,
        path: brokerInfo.path ?? '/mqtt',
        protocol: (brokerInfo.wprotocol ?? 'wss') as 'wss',
        username: brokerInfo.username,
        password: brokerInfo.password
      });
      this.mqttSubscription = this.mqttService.messages$.subscribe((msg: IMqttMessage) => {
        if (msg.topic.includes('tw/tag/location_nav')) {
          this.handleMqttTag(msg.payload);
        }
      });

      this.mqttConnectionSubscription = this.mqttService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
        if (connected) {
          const facilityId = localStorage.getItem(btoa('facilityId'));
          this.mqttService.subscribe(`tw/tag/location_nav/${facilityId}/#`);
          // Request the broker to flush current tag positions immediately so
          // the map populates without waiting for the next live MQTT update.
          this.requestCurrentTags();
        }
      });
      this.mqttConnected = true;
      this.mqttConnecting = false;
    });
  }

  // Publishes a cache-request to the broker (same pattern as common-leaflet's
  // getCurrentTags) so the backend re-emits all current tag locations to the
  // subscribed topic — called on initial connect and on every floor switch.
  private requestCurrentTags(): void {
    const facilityId = localStorage.getItem(btoa('facilityId'));
    const blockId = this.selectedBlock?.id ?? '';
    const requestKey = `${facilityId ?? ''}|${this.selectedFloorId ?? ''}|${blockId}`;

    if (requestKey === this.lastCurrentTagsRequestKey) return;
    this.lastCurrentTagsRequestKey = requestKey;

    const data = {
      topic: 'tw/cache/gw/<fid>',
      message: {
        typ: 'cache',
        ctx: 'current_location',
        operation: '',
        dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        data: [
          {
            facility_id: facilityId,
            floor_id: [this.selectedFloorId],
            block_id: blockId ? [blockId] : []
          }
        ],
        event: {}
      }
    };
    this.commonService.savePublisMqtt(data).subscribe();
  }

  private handleMqttTag(data: any): void {
    // Ignore messages while a floor is (re)building: geo-align offsets and the
    // building group still belong to the previous floor, so positions computed
    // now would be wrong. The post-load broker flush re-delivers current tags.
    if (this.isLoading) return;
    if (!data?.tid || !data?.cxy) return;
    let { tid, cxy, flr, ttp, tvl, tan } = data;
    if (!ttp) return;

    // For the notification alert popup's live tracking only, filter tags to match the selected notification tagId
    if (this.type === 'popup') {
      if (this.requestType === 'porter') {
        if (!this.porterTrackedTags.has(String(tid).trim())) {
          return;
        }
      } else {
        if (!this.tagId || String(tid).trim() !== String(this.tagId).trim()) {
          return;
        }
      }
    }

    // Apply same ttp transformations as common-leaflet
    if (ttp === 'TAT-AS' && data.sat === 'AT-WH') ttp = 'TAT-WH';
    if (ttp === 'TAT-US' && data.ust) {
      ttp = data.ust === 'UT_STUDENT' ? 'TAT-STD' : data.ust === 'UT_STAFF' ? 'TAT-STF' : 'TAT-US';
    }
    if (ttp === 'TAT-CO' || ttp === 'TT-CO') ttp = 'TAT-PA';

    // Only render markers on the current selected floor
    if (this.selectedFloorId && flr !== this.selectedFloorId) return;

    const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
    const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;
    const worldPos = new THREE.Vector3(cxy[0] - xOff, 0, cxy[1] - zOff);

    const newKey = this.posKey(worldPos);
    const oldKey = this.tidToCluster.get(tid);

    // Remove tid from its old cluster when it has moved to a different position
    if (oldKey && oldKey !== newKey) {
      const oldSet = this.clusterTids.get(oldKey);
      if (oldSet) {
        oldSet.delete(tid);
        if (oldSet.size === 0) {
          const g = this.markers.get(oldKey);
          if (g) (this.buildingGroup ?? this.scene)?.remove(g);
          this.markers.delete(oldKey);
          this.markerTargets.delete(oldKey);
          this.clusterTids.delete(oldKey);
        } else {
          this.refreshClusterSprite(oldKey);
        }
      }
    }

    // Add to new cluster
    if (!this.clusterTids.has(newKey)) this.clusterTids.set(newKey, new Set());
    this.clusterTids.get(newKey)!.add(tid);
    this.tidToCluster.set(tid, newKey);

    // Update target position
    if (!this.markerTargets.has(newKey)) {
      this.markerTargets.set(newKey, worldPos.clone());
    } else {
      this.markerTargets.get(newKey)!.copy(worldPos);
    }

    // Update tag index FIRST so clusterTexture() can read the correct ttp during marker creation
    this.tagIndex.set(tid, { tid, ttp, tvl, tan: tan || undefined, flr, position: worldPos, lastSeen: Date.now() });
    this.updateTtpIndex(ttp);

    // Create or refresh the cluster marker (tagIndex is now populated)
    if (!this.markers.has(newKey)) {
      this.markers.set(newKey, this.buildClusterMarker(newKey, worldPos));
    } else {
      this.refreshClusterSprite(newKey);
    }

    // Keep location panel in sync when a tag moves
    if (this.activeClusterKey) {
      const activeTids = this.clusterTids.get(this.activeClusterKey);
      if (!activeTids || activeTids.size === 0) {
        this.activeTags = [];
        this.activeClusterKey = null;
      } else {
        this.activeTags = [...activeTids]
          .map(t => this.tagIndex.get(t))
          .filter((t): t is TrackedTag => !!t);
      }
    }
  }

  // ── Adaptive clustering ────────────────────────────────────────

  // World-space cell size such that CLUSTER_PX screen pixels = one cell at the current zoom.
  private getClusterCellSize(): number {
    if (!this.camera || !this.controls) return 2;
    const camDist = this.camera.position.distanceTo(this.controls.target);
    const canvasH = this.renderer?.domElement.clientHeight || 600;
    const fovY = THREE.MathUtils.degToRad((this.camera as any).fov ?? 50);
    const worldPerPx = 2 * Math.tan(fovY / 2) * camDist / canvasH;
    return Math.max(2, worldPerPx * this.CLUSTER_PX);
  }

  // Cluster position key based on adaptive cell size — changes with zoom.
  private posKey(pos: { x: number; z: number }): string {
    const cell = this.getClusterCellSize();
    return `${Math.round(pos.x / cell)}_${Math.round(pos.z / cell)}`;
  }

  // Exact centroid (average position) of all tags in a cluster.
  private clusterCentroid(tids: Set<string>) {
    const avg = new THREE.Vector3();
    let n = 0;
    for (const tid of tids) {
      const tag = this.tagIndex.get(tid);
      if (tag) { avg.add(tag.position); n++; }
    }
    if (n > 0) avg.divideScalar(n);
    return avg;
  }

  // Called every frame — triggers a full re-cluster when camera distance has
  // changed by ≥8 % since the last re-cluster, with a 150 ms debounce.
  private checkRecluster(): void {
    if (!this.camera || !this.controls || this.tagIndex.size === 0) return;
    const camDist = this.camera.position.distanceTo(this.controls.target);
    if (this.lastClusterCamDist < 0) { this.lastClusterCamDist = camDist; return; }
    const change = Math.abs(camDist - this.lastClusterCamDist) / this.lastClusterCamDist;
    const now = Date.now();
    if (change > 0.08 && now - this.lastReclusterTime > 150) {
      this.reclusterAll();
    }
  }

  // Recomputes every cluster assignment using the current zoom-level cell size,
  // then removes stale markers, creates new ones, and refreshes changed ones.
  private reclusterAll(): void {
    if (!this.camera || !this.controls) return;
    const parent = this.buildingGroup ?? this.scene;

    // ── 1. Recompute cluster membership ─────────────────────────
    const newClusterTids = new Map<string, Set<string>>();
    const newTidToCluster = new Map<string, string>();

    for (const [tid, tag] of this.tagIndex) {
      const key = this.posKey(tag.position);
      if (!newClusterTids.has(key)) newClusterTids.set(key, new Set());
      newClusterTids.get(key)!.add(tid);
      newTidToCluster.set(tid, key);
    }

    // ── 2. Commit state BEFORE touching markers ──────────────────
    // clusterTexture() / refreshClusterSprite() both read this.clusterTids,
    // so the new membership must be visible before any marker is built or refreshed.
    this.clusterTids  = newClusterTids;
    this.tidToCluster = newTidToCluster;

    // ── 3. Remove markers whose cluster no longer exists ─────────
    for (const [oldKey, group] of this.markers) {
      if (!newClusterTids.has(oldKey)) {
        parent?.remove(group);
        this.markers.delete(oldKey);
        this.markerTargets.delete(oldKey);
      }
    }

    // ── 4. Create or update markers for each current cluster ─────
    for (const [key, tids] of newClusterTids) {
      const centroid = this.clusterCentroid(tids);

      if (!this.markers.has(key)) {
        this.markerTargets.set(key, centroid.clone());
        this.markers.set(key, this.buildClusterMarker(key, centroid));
      } else {
        this.markerTargets.get(key)!.copy(centroid);
        this.refreshClusterSprite(key);
      }
    }

    // ── 5. Record timing ─────────────────────────────────────────
    this.lastClusterCamDist = this.camera.position.distanceTo(this.controls.target);
    this.lastReclusterTime  = Date.now();

    // ── 6. Sync location panel ───────────────────────────────────
    if (this.activeClusterKey) {
      const tids = this.clusterTids.get(this.activeClusterKey);
      if (!tids || tids.size === 0) {
        this.activeTags = [];
        this.activeClusterKey = null;
      } else {
        this.activeTags = [...tids]
          .map(t => this.tagIndex.get(t))
          .filter((t): t is TrackedTag => !!t);
      }
    }

    // Re-apply visibility filter after re-cluster
    this.applyFilter();
  }

  private updateTtpIndex(ttp: string): void {
    if (!this.availableTtps.includes(ttp)) {
      this.availableTtps = [...this.availableTtps, ttp];
    }
    let count = 0;
    this.tagIndex.forEach(t => { if (t.ttp === ttp) count++; });
    this.tagCounts.set(ttp, count);
  }

  // ---- Cluster marker creation ----

  private buildClusterMarker(key: string, position: any): THREE.Group {
    const group = new THREE.Group();
    group.name = `lt-cluster-${key}`;
    group.userData['clusterKey'] = key;
    group.position.copy(position);

    // Sprite (texture updated by refreshClusterSprite when count changes)
    const spriteMat = new THREE.SpriteMaterial({
      map: this.clusterTexture(key),
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'icon-sprite';
    sprite.scale.set(5, 5, 1);
    sprite.position.y = 0.02;
    sprite.center.set(0.5, 0.05);
    sprite.renderOrder = 1010;
    group.add(sprite);

    // Pulse ring — all tags set to red color
    const ringColor = 0xff0000;
    const ringGeo = new THREE.RingGeometry(0.15, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor, transparent: true, opacity: 0.9, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'pulse-ring';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    // Dynamic circle beneath pulse animation for the tag marker in popup live tracking
    if (this.type === 'popup') {
      const baseGeo = new THREE.CircleGeometry(0.35, 32);
      const baseMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      const baseCircle = new THREE.Mesh(baseGeo, baseMat);
      baseCircle.name = 'base-circle';
      baseCircle.rotation.x = -Math.PI / 2;
      baseCircle.position.y = 0.015;
      baseCircle.renderOrder = 1009;
      group.add(baseCircle);
    }

    // Shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.2, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.12
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    (this.buildingGroup ?? this.scene).add(group);
    return group;
  }

  // Swap the sprite texture when the cluster count changes
  private refreshClusterSprite(key: string): void {
    const group = this.markers.get(key);
    const sprite = group?.getObjectByName('icon-sprite') as any;
    if (!sprite) return;
    sprite.material.map = this.clusterTexture(key);
    sprite.material.needsUpdate = true;
  }

  // Single tag → SVG icon; multiple tags → count badge
  private clusterTexture(key: string): THREE.Texture {
    const tids = this.clusterTids.get(key);
    if (!tids || tids.size === 0) return this.loadTtpTexture('TAT-AS');
    if (tids.size === 1) {
      const tag = this.tagIndex.get([...tids][0]);
      // tag must exist (tagIndex updated before marker creation)
      return this.loadTtpTexture(tag?.ttp || 'TAT-AS');
    }
    return this.makeCountTexture(tids.size);
  }

  // Render a count badge: drop-shadow → dark outer ring → vivid fill → white count
  private makeCountTexture(count: number): THREE.CanvasTexture {
    const S = 256;                    // higher resolution canvas for crisp text
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2;

    // Radius fills ~86 % of canvas — matches single-tag SVG icon footprint
    const r = S * 0.43;

    // Soft drop-shadow so the badge reads against both light and dark backgrounds
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur  = S * 0.08;
    ctx.shadowOffsetY = S * 0.03;

    // Dark outer ring (improves legibility against light floors)
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Vivid emerald fill
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.90, 0, Math.PI * 2);
    ctx.fill();

    // White inner ring for contrast
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = S * 0.038;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.90 - S * 0.025, 0, Math.PI * 2);
    ctx.stroke();

    // White bold count — exact number, font scales for 3+ digits
    const text = String(count);
    const basePx  = Math.floor(r * 1.0);
    const fontSize = text.length > 2 ? Math.floor(basePx * 0.65) : basePx;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + S * 0.01);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  private loadTtpTexture(ttp: string): THREE.Texture {
    if (this.textureCache.has(ttp)) return this.textureCache.get(ttp)!;

    const SIZE = 128;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // Draw fallback immediately so the sprite is visible from the first frame
    this.drawFallbackIcon(ctx, ttp, SIZE);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    this.textureCache.set(ttp, tex);

    // Load SVG and repaint canvas using aspect-ratio-preserving fit (object-fit:contain).
    // This ensures every icon occupies the same bounding box regardless of its SVG viewBox,
    // preventing portrait SVGs from appearing larger/wider due to non-uniform stretching.
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const nw = img.naturalWidth > 0 ? img.naturalWidth : SIZE;
      const nh = img.naturalHeight > 0 ? img.naturalHeight : SIZE;
      const s = Math.min(SIZE / nw, SIZE / nh);
      ctx.drawImage(img, (SIZE - nw * s) / 2, (SIZE - nh * s) / 2, nw * s, nh * s);
      tex.needsUpdate = true;
    };
    img.src = `/assets/Floorplan/${ttp}.svg`;

    return tex;
  }

  private drawFallbackIcon(ctx: CanvasRenderingContext2D, ttp: string, size: number): void {
    const colorHex = 0xff0000;
    const color = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(size * 0.22)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ttp.replace('TAT-', ''), size / 2, size / 2);
  }

  // ---- Filter helpers (template-facing) ----

  getTtpLabel(ttp: string): string { return TTP_LABELS[ttp] ?? ttp; }
  getTtpColor(ttp: string): string {
    return '#ff0000';
  }
  getTagCount(ttp: string): number { return this.tagCounts.get(ttp) ?? 0; }
  getTotalCount(): number { return this.tagIndex.size; }

  isFilterActive(ttp: string): boolean { return this.selectedTtps.has(ttp); }
  hasActiveFilter(): boolean { return this.selectedTtps.size > 0; }

  toggleFilter(ttp: string): void {
    if (this.selectedTtps.has(ttp)) {
      this.selectedTtps.delete(ttp);
    } else {
      this.selectedTtps.add(ttp);
    }
    this.applyFilter();
  }

  clearFilters(): void {
    this.selectedTtps.clear();
    this.applyFilter();
  }

  private applyFilter(): void {
    const showAll = this.selectedTtps.size === 0;
    this.markers.forEach((group, key) => {
      const tids = this.clusterTids.get(key);
      const visible = showAll || (tids
        ? [...tids].some(tid => {
            const tag = this.tagIndex.get(tid);
            return tag ? this.selectedTtps.has(tag.ttp) : false;
          })
        : false);
      group.visible = visible;
    });
  }

  closePopup(): void { this.activeTags = []; this.activeClusterKey = null; }

  // ---- View mode / rotate ----

  toggleRotateMode(): void {
    this.isRotateMode = !this.isRotateMode;
    this.allowRotate = this.isRotateMode;
    this.controls.mouseButtons.LEFT = this.isRotateMode ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    this.renderer.domElement.style.cursor = this.isRotateMode ? 'crosshair' : 'grab';
  }

  onViewModeChange(mode: '2d' | '3d'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.applyViewModeConstraints();
    this.applyFloorDefaultCamera();
    if (!this.mapConfig.floorDefaults?.[String(this.selectedFloorId)]) {
      this.resetCamera();
    }
  }

  // ---- Floor selection ----

  onFloorSelect(floor: any): void {
    if (floor?.id === this.selectedFloor?.id) return;
    this.isLoading = true;
    this.clearAllMarkers();
    this.selectedFloor = floor;
    this.selectedFloorId = floor.id;
    this.fetchFloorDetails(floor);
    this.floorChanged.emit(floor.id);
  }

  onBlockSelect(block: any): void {
    if (block?.id === this.selectedBlock?.id) return;
    this.selectedBlock = block;
    this.filteredFloors = block.children || [];
    if (this.filteredFloors.length) {
      this.isLoading = true;
      this.clearAllMarkers();
      this.selectedFloor = this.filteredFloors[0];
      this.selectedFloorId = this.filteredFloors[0].id;
      this.fetchFloorDetails(this.filteredFloors[0]);
      this.blockChanged.emit(block.id);
      this.floorChanged.emit(this.selectedFloorId);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lt-settings-panel') && !target.closest('.lt-floor-settings-btn')) {
      this.isSettingsOpen = false;
    }
    if (!target.closest('.lt-block-pill')) {
      this.isBlockDropdownOpen = false;
    }
  }

  private clearAllMarkers(): void {
    const parent = this.buildingGroup ?? this.scene;
    this.markers.forEach(group => parent?.remove(group));
    this.markers.clear();
    this.markerTargets.clear();
    this.clusterTids.clear();
    this.tidToCluster.clear();
    this.tagIndex.clear();
    this.tagCounts.clear();
    this.availableTtps = [];
    this.activeTags = [];
    this.activeClusterKey = null;
    this.lastClusterCamDist = -1;
    // Markers are gone — the next requestCurrentTags() must not be deduped,
    // otherwise the map stays empty until tags happen to move.
    this.lastCurrentTagsRequestKey = '';
  }

  public override resetCamera(): void {
    super.resetCamera();
    this.applyFloorDefaultCamera();
    if (this.viewMode === '2d') {
      this.enforce2dCameraAngle();
    }
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

  public goBack(): void {
    this.router.navigate(['/ovitag/organization/three-map']);
  }

  private initPorterTracking(): void {
    this.porterTrackedTags.clear();
    if (!this.reqTagDetail) return;

    const performers = this.reqTagDetail.performer || [];
    const nonPerformers = this.reqTagDetail.nonPerformer || [];

    performers.forEach((p: any) => {
      if (p.status !== 'RQ-NR' && p.status !== 'RQ-RJ' && p.tagAssociationTypeId !== 'LOC' && p.tagId) {
        this.porterTrackedTags.add(String(p.tagId).trim());
      }
    });

    nonPerformers.forEach((np: any) => {
      if (np.tagAssociationTypeId !== 'LOC' && np.tagId) {
        this.porterTrackedTags.add(String(np.tagId).trim());
      }
    });

    this.drawPorterRoute();
  }

  private drawPorterRoute(): void {
    if (this.porterRouteGroup) {
      this.porterRouteGroup.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
          if (child.material.map) child.material.map.dispose();
        }
      });
      this.scene.remove(this.porterRouteGroup);
      this.porterRouteGroup = null;
    }

    if (this.highlightedStartRoom) {
      applyRoomHighlight(this.highlightedStartRoom, false, false, false, false);
      this.highlightedStartRoom = null;
    }
    if (this.highlightedDestRoom) {
      applyRoomHighlight(this.highlightedDestRoom, false, false, false, false);
      this.highlightedDestRoom = null;
    }

    if (this.requestType !== 'porter') return;

    if (!this.reqTagDetail || !this.navNodes || this.navNodes.length === 0) return;

    const sourceId = this.reqTagDetail.sourceId;
    const destId = this.reqTagDetail.destinationId;

    if (!sourceId || !destId) return;

    const startNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === Number(sourceId));
    const endNode = this.navNodes.find(n => this.isRoomNavNode(n) && this.getNodeLocationId(n) === Number(destId));

    if (!startNode || !endNode) {
      console.warn('[LiveTrackingComponent] start or end node not found on floor:', this.selectedFloorId);
      return;
    }

    const pathIds = this.navigationService.findShortestNodePath(
      startNode.id, endNode.id, this.navNodes, this.nodeNavigationGraph
    );

    if (!pathIds || pathIds.length === 0) {
      console.warn('[LiveTrackingComponent] No path found between:', startNode.id, endNode.id);
      return;
    }

    const xOff = this.floorHasGeoAlign ? this.rawFloorCenter.x : 0;
    const zOff = this.floorHasGeoAlign ? this.rawFloorCenter.y : 0;

    const points = pathIds.map(id => {
      const n = this.navNodes.find(n => n.id === id)!;
      return new THREE.Vector3(n.x - xOff, 0.05, n.y - zOff);
    });

    const customWidth = Math.max(0.25, ROUTE_RIBBON_WIDTH * Math.min(1.0, (this.floorSize || 200) / 200));
    const result = this.routeVisualizationService.visualizeRoute(points, this.scene, customWidth);
    if (result) {
      this.porterRouteGroup = result.routeGroup;

      if (points.length > 0) {
        // Calculate start and end heights based on room mesh floor bounding box maximum Y
        let startY = 0.05;
        const startRoom = this.roomMeshes.find(r => r.id === Number(sourceId));
        if (startRoom) {
          startRoom.floor.updateWorldMatrix(true, false);
          const box = new THREE.Box3().setFromObject(startRoom.floor);
          if (this.buildingGroup) {
            this.buildingGroup.updateWorldMatrix(true, false);
            box.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
          }
          startY = box.max.y + 0.05;

          // Highlight Start Room in Green
          applyRoomHighlight(startRoom, false, false, true, false);
          this.highlightedStartRoom = startRoom;
        }

        let endY = 0.05;
        const endRoom = this.roomMeshes.find(r => r.id === Number(destId));
        if (endRoom) {
          endRoom.floor.updateWorldMatrix(true, false);
          const box = new THREE.Box3().setFromObject(endRoom.floor);
          if (this.buildingGroup) {
            this.buildingGroup.updateWorldMatrix(true, false);
            box.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
          }
          endY = box.max.y + 0.05;

          // Highlight Destination Room in Red
          applyRoomHighlight(endRoom, false, false, false, true);
          this.highlightedDestRoom = endRoom;
        }

        const startPoint = points[0].clone();
        startPoint.y = startY;

        const endPoint = points[points.length - 1].clone();
        endPoint.y = endY;

        const startMarker = this.createRouteMarker(startPoint, 'start', customWidth);
        const endMarker = this.createRouteMarker(endPoint, 'end', customWidth);

        this.porterRouteGroup.add(startMarker);
        this.porterRouteGroup.add(endMarker);
      }
    }
  }

  private createRouteMarker(pos: THREE.Vector3, type: 'start' | 'end', ribbonWidth: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `porter-route-marker-${type}`;
    group.position.copy(pos);

    // Flat Pin Sprite scaled relative to the ribbon width (no animations/rings, bold flat style)
    const spriteMat = new THREE.SpriteMaterial({
      map: this.createRouteMarkerTexture(type),
      color: 0xffffff, // Ensure pure white to prevent texture color alteration
      transparent: true,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = `${type}-pin-sprite`;
    
    // Scale and position so the tip of the pin aligns with y = 0
    const height = ribbonWidth * 8.0; // Constant bold scale adjusted to ribbon width
    const width = height * (28 / 40); // Exact SVG aspect ratio
    sprite.scale.set(width, height, 1);
    sprite.position.y = height / 2;
    sprite.renderOrder = 1015;
    group.add(sprite);

    return group;
  }

  private createRouteMarkerTexture(type: 'start' | 'end'): THREE.CanvasTexture {
    const W = 280, H = 400; // Scaling up the 28x40 vector canvas by 10x for crisp rendering
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.scale(10, 10); // Scale draw coordinates to match 28x40 SVG viewBox

    // Pin Path: exact SVG path representation
    const p = new Path2D("M14 1C6.82 1 1 6.82 1 14c0 9.33 13 26 13 26s13-16.67 13-26C27 6.82 21.18 1 14 1Z");
    
    // Solid flat fills matching indoor-path markers
    ctx.fillStyle = type === 'start' ? '#1d4ed8' : '#ef4444';
    ctx.fill(p);
    
    // Solid stroke outline
    ctx.strokeStyle = type === 'start' ? '#1e40af' : '#c53030';
    ctx.lineWidth = 0.8;
    ctx.stroke(p);

    // Inner white circle (cx=14, cy=14, r=6)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(14, 14, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    // Explicitly configure colorSpace for vibrant sRGB colors (fixes desaturation/washed-out textures in newer ThreeJS versions)
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private isRoomNavNode(node: NavNode): boolean {
    return node.type === 'NT-RN';
  }

  private getNodeLocationId(node: NavNode): number | undefined {
    const locationId = node.location_id ?? (node as any).locationId;
    return locationId === undefined || locationId === null ? undefined : Number(locationId);
  }

  override ngOnDestroy(): void {
    this.clearEmergencyHighlight();
    if (this.mqttSubscription) this.mqttSubscription.unsubscribe();
    if (this.mqttConnectionSubscription) this.mqttConnectionSubscription.unsubscribe();
    this.mqttService.disconnect();
    this.textureCache.forEach(t => t.dispose());
    this.textureCache.clear();
    if (this.porterRouteGroup) {
      this.porterRouteGroup.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
          if (child.material.map) child.material.map.dispose();
        }
      });
      this.scene.remove(this.porterRouteGroup);
      this.porterRouteGroup = null;
    }
    if (this.highlightedStartRoom) {
      applyRoomHighlight(this.highlightedStartRoom, false, false, false, false);
      this.highlightedStartRoom = null;
    }
    if (this.highlightedDestRoom) {
      applyRoomHighlight(this.highlightedDestRoom, false, false, false, false);
      this.highlightedDestRoom = null;
    }
    super.ngOnDestroy();
  }
}
