import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Injector,
  Input
} from '@angular/core';
import { Router } from '@angular/router';
import * as THREE from 'three';

import { ThreeMapBase } from '../three-map-base.component';
import { RoomMesh } from '../../models';
import {
  SceneService,
  CameraService,
  RendererService,
  ControlsService,
  AnimationService,
  CleanupService,
  CameraAnimationService,
  LabelVisibilityService,
  InteractionService
} from '../../services';
import { MqttService, IMqttMessage } from '../../services/mqtt.service';

/** Tag type → accent color mapping (matches common-leaflet palette) */
const TTP_COLORS: Record<string, number> = {
  'TAT-AS':  0x3B82F6,  // asset    - blue
  'TAT-IN':  0x10B981,  // infant   - emerald
  'TAT-PA':  0xF59E0B,  // patient  - amber
  'TAT-PO':  0xEF4444,  // porter   - red
  'TAT-US':  0x8B5CF6,  // user     - violet
  'TAT-STD': 0x6366F1,  // student  - indigo
  'TAT-STF': 0x0EA5E9,  // staff    - sky
  'TAT-WH':  0x6B7280,  // wheelchair - gray
  'TAT-MR':  0xF97316,  // motorised round - orange
  'TAT-DAT': 0x94A3B8,  // disassociated - slate
};

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
  name?: string;
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

  protected override showSurroundings = false;

  // --- View mode / controls ---
  viewMode: '2d' | '3d' = '3d';
  isRotateMode = false;
  isSettingsOpen = false;

  // label scale tracking — applied from webIndoor.labelScale (multiplier over base 4.0)
  private ltLabelMultiplier = 1.0;
  private readonly ltLabelBaseScale = 4.0;

  get availableFloors(): any[] { return this.filteredFloors; }

  // --- Marker tracking (keyed by cluster position key, not tid) ---
  private markers = new Map<string, THREE.Group>();         // posKey → group
  private markerTargets = new Map<string, THREE.Vector3>(); // posKey → world pos
  private clusterTids = new Map<string, Set<string>>();     // posKey → Set<tid>
  private tidToCluster = new Map<string, string>();          // tid → posKey
  private tagIndex = new Map<string, TrackedTag>();          // tid → TrackedTag
  private textureCache = new Map<string, THREE.Texture>();   // ttp → texture
  private mqttSubscription: any;

  // --- Filter / display ---
  availableTtps: string[] = [];
  selectedTtps = new Set<string>();                          // empty = show all
  tagCounts = new Map<string, number>();                     // ttp → count

  // --- Active popup ([] = closed, [t] = single tag, [t1,t2,...] = cluster list) ---
  activeTags: TrackedTag[] = [];
  popupPos = { x: 0, y: 0 };

  // --- Connection status ---
  isConnected = false;

  // --- Mustering: emergency location highlighting ---
  private incidentLocationIds = new Set<number>();
  private emergencyRooms: RoomMesh[] = [];
  private emergencyMarkers: any[] = [];
  private incidentDataFetched = false;
  private isEarthquake = false;
  private activityCategoryId = '';

  private readonly mqttService: MqttService;
  private readonly interactionService: InteractionService;

  constructor(injector: Injector, private router: Router) {
    super(injector);
    this.mqttService = injector.get(MqttService);
    this.interactionService = injector.get(InteractionService);
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
    this.applyViewModeConstraints();
    this.applyFloorDefaultCamera();
    // Live MQTT tracking is irrelevant in mustering mode
    if (this.requestType !== 'mustering') this.connectMqtt();
    if (this.requestType === 'mustering') {
      if (this.requestId && !this.incidentDataFetched) {
        this.fetchIncidentLocations();
      } else if (this.incidentLocationIds.size > 0 || this.isEarthquake) {
        this.applyEmergencyHighlight();
      }
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
        this.isEarthquake = this.activityCategoryId === 'AC-EAQU';
        if (!this.isEarthquake) {
          const locations: { id: number; name: string }[] = task.incidentLocations || [];
          locations.forEach(loc => this.incidentLocationIds.add(Number(loc.id)));
        }
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
    });
    this.removeEmergencyMarkers();
    this.emergencyRooms = [];

    if (this.isEarthquake) {
      this.createEarthquakeCenterPin();
      return;
    }

    this.roomMeshes.forEach(room => {
      if (this.incidentLocationIds.has(room.id)) {
        this.emergencyRooms.push(room);
        const mat = room.floor.material as any;
        if (this.activityCategoryId === 'AC-FIRE') {
          mat.color.setHex(0xff4400);
          mat.emissive.setRGB(1, 0.15, 0);
          mat.emissiveIntensity = 0.7;
          this.createFireEffect(room);
        } else {
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

  private createEarthquakeCenterPin(): void {
    const pos = this.getFloorMapCenter();
    const group = new THREE.Group();
    group.name = 'em-pin-earthquake';
    group.position.set(pos.x, 0, pos.z);
    group.userData['isEarthquake'] = true;

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

    // Emergency pin icon — uncomment to show the floating marker above the earthquake center
    // const spriteMat = new THREE.SpriteMaterial({
    //   map: this.createEmergencyPinTexture(),
    //   transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: true
    // });
    // const sprite = new THREE.Sprite(spriteMat);
    // sprite.name = 'em-sprite';
    // sprite.scale.set(12, 17, 1);
    // sprite.position.y = 18;
    // sprite.renderOrder = 200;
    // group.add(sprite);

    (this.buildingGroup ?? this.scene).add(group);
    this.emergencyMarkers.push(group);
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
    sprite.renderOrder = 200;
    group.add(sprite);

    (this.buildingGroup ?? this.scene).add(group);
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

  private getFloorMapCenter(): any {
    if (this.roomMeshes.length === 0) return new THREE.Vector3(0, 0, 0);
    const box = new THREE.Box3();
    this.roomMeshes.forEach(room => box.expandByObject(room.floor));
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      worldCenter.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
    }
    return worldCenter;
  }

  // ── Fire effect (AC-FIRE) ─────────────────────────────────────

  private createFireEffect(room: RoomMesh): void {
    room.floor.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(room.floor);
    if (this.buildingGroup) {
      this.buildingGroup.updateWorldMatrix(true, false);
      box.applyMatrix4(new THREE.Matrix4().copy(this.buildingGroup.matrixWorld).invert());
    }

    const xMin = box.min.x, xMax = box.max.x;
    const zMin = box.min.z, zMax = box.max.z;
    const w = xMax - xMin;
    const d = zMax - zMin;
    const margin = Math.min(w, d) * 0.08;
    const count = Math.max(5, Math.min(14, Math.floor(w * d * 0.08)));
    const texture = this.createFlameTexture();

    const group = new THREE.Group();
    group.name = `em-fire-${room.id}`;
    group.userData['isFire'] = true;

    for (let i = 0; i < count; i++) {
      const x = xMin + margin + Math.random() * Math.max(0.1, w - margin * 2);
      const z = zMin + margin + Math.random() * Math.max(0.1, d - margin * 2);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture, transparent: true,
        depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x, 0.5, z);
      sprite.userData['phase'] = i / count;
      sprite.userData['speed'] = 0.6 + Math.random() * 0.6;
      sprite.userData['maxH']  = 2.5 + Math.random() * 2;
      sprite.userData['baseScale'] = 1.2 + Math.random() * 1.0;
      sprite.renderOrder = 160;
      group.add(sprite);
    }

    (this.buildingGroup ?? this.scene).add(group);
    this.emergencyMarkers.push(group);
  }

  private createFlameTexture(): any {
    const W = 48, H = 80;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const grad = ctx.createLinearGradient(cx, H, cx, 0);
    grad.addColorStop(0,    'rgba(255,  60,   0, 0.95)');
    grad.addColorStop(0.25, 'rgba(255, 120,   0, 0.90)');
    grad.addColorStop(0.55, 'rgba(255, 200,   0, 0.70)');
    grad.addColorStop(0.80, 'rgba(255, 240, 100, 0.35)');
    grad.addColorStop(1,    'rgba(255, 255, 200, 0.00)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(cx, H);
    ctx.bezierCurveTo(cx - W * 0.5, H * 0.85, cx - W * 0.45, H * 0.4, cx, 0);
    ctx.bezierCurveTo(cx + W * 0.45, H * 0.4, cx + W * 0.5,  H * 0.85, cx, H);
    ctx.closePath();
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
      if (group.userData['isFire']) {
        group.children.forEach((sprite: any) => {
          const lifePhase = ((t * sprite.userData['speed'] + sprite.userData['phase']) % 1);
          sprite.position.y = 0.5 + lifePhase * sprite.userData['maxH'];
          const taper   = 1 - lifePhase * 0.65;
          const flicker = 0.85 + Math.sin(t * 8 * sprite.userData['speed']) * 0.15;
          const bs = sprite.userData['baseScale'];
          sprite.scale.set(bs * taper * flicker, bs * 1.8 * flicker, 1);
          sprite.material.opacity = (1 - lifePhase * 0.85) * 0.9;
        });
        return;
      }

      const isEq = !!group.userData['isEarthquake'];
      const ringSpeed = isEq ? 0.38 : 0.65;
      const bobSpeed  = isEq ? 1.1  : 1.8;

      const sprite: any = group.getObjectByName('em-sprite');
      if (sprite) sprite.position.y = 18 + Math.sin(t * bobSpeed) * 2.2;

      for (let i = 0; i < 3; i++) {
        const ring: any = group.getObjectByName(`em-ring-${i}`);
        if (!ring) continue;
        const phase = ((t * ringSpeed) + (ring.userData['phase'] as number)) % 1;
        ring.scale.setScalar(1 + phase * 9);
        ring.material.opacity = (1 - phase) * 0.55;
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
    if (this.activityCategoryId === 'AC-FIRE') {
      const t = Date.now() / 1000;
      this.emergencyRooms.forEach(room => {
        const mat = room.floor.material as any;
        const flicker = 0.7 + Math.sin(t * 5.5 + room.id * 1.3) * 0.3;
        mat.emissiveIntensity = flicker;
        mat.emissive.setRGB(1, 0.12 + Math.sin(t * 4 + room.id * 2.1) * 0.08, 0);
      });
      return;
    }
    const t = Date.now();
    // Hard blink: red for 600 ms, original color for 400 ms per cycle
    const isRed = (t % 1000) < 600;
    this.emergencyRooms.forEach(room => {
      const mat = room.floor.material as any;
      if (isRed) {
        mat.color.setHex(0xff0000);
        mat.emissive.setHex(0xff0000);
        mat.emissiveIntensity = 1.2;
      } else {
        mat.color.setHex(room.originalColor);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }

  private clearEmergencyHighlight(): void {
    this.emergencyRooms.forEach(room => {
      const mat = room.floor.material as any;
      mat.color.setHex(room.originalColor);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    });
    this.emergencyRooms = [];
    this.removeEmergencyMarkers();
    this.incidentLocationIds.clear();
    this.incidentDataFetched = false;
    this.isEarthquake = false;
    this.activityCategoryId = '';
  }

  // ---- Rendering ----

  protected animate(): void {
    if (!this.scene || !this.camera || !this.controls) return;
    this.controlsService.update();
    this.updateZoomValue();
    this.animateMarkers();
    this.animateEmergencyRooms();
    this.animateEmergencyMarkers();
    this.rendererService.render(this.scene, this.camera);
  }

  // Target icon size in screen pixels — constant at every zoom level
  private readonly ICON_PX = 36;

  private animateMarkers(): void {
    if (!this.camera || !this.controls) return;

    // Exact world-space size that renders as ICON_PX pixels on screen at this camera distance.
    // Derived from the perspective projection: worldSize = 2 * tan(fov/2) * camDist / canvasHeight * px
    const camDist = this.camera.position.distanceTo(this.controls.target);
    const canvasH = this.renderer.domElement.clientHeight || 600;
    const fovY = THREE.MathUtils.degToRad((this.camera as any).fov ?? 50);
    const iconSize = 2 * Math.tan(fovY / 2) * camDist / canvasH * this.ICON_PX;

    this.markers.forEach((group, tid) => {
      const target = this.markerTargets.get(tid);
      if (target) group.position.lerp(target, 0.12);

      // Exact constant screen-size: scale from camera geometry, position.y anchors bottom at coordinate
      const sprite = group.getObjectByName('icon-sprite');
      if (sprite) {
        sprite.scale.set(iconSize, iconSize, 1);
        sprite.position.y = iconSize / 2;
      }

      const ring = group.getObjectByName('pulse-ring') as THREE.Mesh;
      if (ring) {
        const mat = ring.material as any;
        ring.scale.addScalar(0.04);
        mat.opacity -= 0.025;
        if (mat.opacity <= 0) { ring.scale.setScalar(1); mat.opacity = 0.9; }
      }
    });
  }

  // ---- Mouse click for tag popup ----

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
        this.activeTags = [...tids]
          .map(tid => this.tagIndex.get(tid))
          .filter((t): t is TrackedTag => !!t);
        const world = new THREE.Vector3();
        hit.getWorldPosition(world);
        world.project(this.camera);
        const hw = this.renderer.domElement.clientWidth / 2;
        const hh = this.renderer.domElement.clientHeight / 2;
        this.popupPos = { x: world.x * hw + hw, y: -(world.y * hh) + hh };
      }
    } else {
      this.activeTags = [];
    }
  }

  // ---- MQTT ----

  private mqttConnected = false;

  private connectMqtt(): void {
    // Only establish the connection once — subsequent floor switches reuse it
    if (this.mqttConnected) return;

    this.commonService.getmqttBroker().subscribe((res: any) => {
      if (!res?.results?.length) return;

      const brokerInfo = res.results.find((b: any) => b.brokerTypeId === 'BT-CL');
      if (!brokerInfo) return;

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

      this.mqttService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
        if (connected) {
          const facilityId = localStorage.getItem(btoa('facilityId'));
          this.mqttService.subscribe(`tw/tag/location_nav/${facilityId}/#`);
        }
      });
      this.mqttConnected = true;
    });
  }

  private handleMqttTag(data: any): void {
    if (!data?.tid || !data?.cxy) return;
    let { tid, cxy, flr, ttp, tvl } = data;
    if (!ttp) return;

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
    this.tagIndex.set(tid, { tid, ttp, tvl, flr, position: worldPos, lastSeen: Date.now() });
    this.updateTtpIndex(ttp);

    // Create or refresh the cluster marker (tagIndex is now populated)
    if (!this.markers.has(newKey)) {
      this.markers.set(newKey, this.buildClusterMarker(newKey, worldPos));
    } else {
      this.refreshClusterSprite(newKey);
    }
  }

  // Cluster position key — rounds to 1 world-unit grid so tags at the same spot share a marker
  private posKey(pos: any): string {
    return `${Math.round(pos.x)}_${Math.round(pos.z)}`;
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
    sprite.position.y = 2.5;
    sprite.renderOrder = 100;
    group.add(sprite);

    // Pulse ring — accent colour from the first tag in this cluster
    const firstTid = [...(this.clusterTids.get(key) ?? [])][0];
    const firstTag = this.tagIndex.get(firstTid ?? '');
    const ringColor = TTP_COLORS[firstTag?.ttp ?? ''] ?? 0x4F46E5;
    const ringGeo = new THREE.RingGeometry(0.15, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor, transparent: true, opacity: 0.9, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'pulse-ring';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

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

  // Render a compact bright badge: filled circle + white count text
  private makeCountTexture(count: number): THREE.CanvasTexture {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    // Smaller radius → occupies ~55 % of canvas width, leaving transparent padding
    const r = S * 0.28;

    // Bright emerald fill (#10b981) — vivid, distinct from any single-tag colour
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Thin white ring for contrast against the map
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = S * 0.055;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r - S * 0.028, 0, Math.PI * 2);
    ctx.stroke();

    // White bold count
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(r * 1.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 9 ? '9+' : String(count), S / 2, S / 2);

    return new THREE.CanvasTexture(canvas);
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
    const colorHex = TTP_COLORS[ttp] ?? 0x4F46E5;
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
    return '#' + (TTP_COLORS[ttp] ?? 0x4F46E5).toString(16).padStart(6, '0');
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

  closePopup(): void { this.activeTags = []; }

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
    this.loadBlockFloors();
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
  }

  public goBack(): void {
    this.router.navigate(['/ovitag/organization/three-map']);
  }

  override ngOnDestroy(): void {
    this.clearEmergencyHighlight();
    if (this.mqttSubscription) this.mqttSubscription.unsubscribe();
    this.mqttService.disconnect();
    this.textureCache.forEach(t => t.dispose());
    this.textureCache.clear();
    super.ngOnDestroy();
  }
}
