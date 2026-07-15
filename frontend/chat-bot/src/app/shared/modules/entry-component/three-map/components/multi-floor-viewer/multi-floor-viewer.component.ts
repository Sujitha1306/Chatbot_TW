import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
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
  PersonMovementService
} from '../../services';

// Helpers
import { applyRoomHighlight, createPerson, createStatusMarker } from '../../helpers';

// Constants
import {
  FLOOR_MAX_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_MULTIPLIER,
  FLOOR_MIN_DISTANCE_ABSOLUTE,
  CAMERA_ZOOM_IN_FACTOR,
  CAMERA_ZOOM_OUT_FACTOR,
  PERSON_BASE_MOVE_SPEED,
  HIGHLIGHT_START_COLOR,
  HIGHLIGHT_DESTINATION_COLOR,
  MARKER_BOB_SPEED,
  MARKER_BOB_HEIGHT,
  MARKER_HEIGHT_OFFSET
} from '../../constants/map.constants';

import { CompassState } from '../../services/compass-control.service';
import { MovementState } from '../../services/person-movement.service';

@Component({
  selector: 'app-multi-floor-viewer',
  standalone: false,
  templateUrl: './multi-floor-viewer.component.html',
  styleUrls: ['./multi-floor-viewer.component.scss'],
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
export class MultiFloorViewerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvasContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private roomMeshes: RoomMesh[] = [];
  private hoveredRoom: RoomMesh | null = null;
  private selectedRoomMesh: RoomMesh | null = null;

  selectedRoom: LocationData | null = null;
  isLoading = true;
  isRotateMode = false;
  private floorSize = 200;
  public zoomValue: number = 0; // Zoom percentage (0-200)

  // Pathfinding state - disabled for multi-floor view
  startRoom: RoomMesh | null = null;
  endRoom: RoomMesh | null = null;
  private routeGroup: THREE.Group | null = null;
  private startMarker: THREE.Group | null = null;
  private endMarker: THREE.Group | null = null;
  public routeDistance: string = '';
  public routeTime: string = '';

  // Person journey state - disabled for multi-floor view
  private person: THREE.Group | null = null;
  private pathPoints: THREE.Vector3[] = [];
  private moveSpeed = PERSON_BASE_MOVE_SPEED;
  private movementState: MovementState = {
    isMoving: false,
    currentPathIndex: 0,
    moveProgress: 0
  };

  // (no graph visualization in multi-floor viewer)

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

  get pivotX(): number { return this.compassState.pivotX; }
  get pivotY(): number { return this.compassState.pivotY; }

  // Floor configuration - positioned side-by-side horizontally
  private floors = [
    { name: 'First Floor', id: 22484, xOffset: -150, zOffset: 0, yOffset: 0 },
    { name: 'Ground Floor', id: 22456, xOffset: 150, zOffset: 0, yOffset: 0 }
  ];

  private resizeListener: () => void;

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
    private personMovementService: PersonMovementService
  ) {
    this.resizeListener = this.onResize.bind(this);
  }

  ngAfterViewInit(): void {
    this.initScene();
    this.loadMultipleFloors();
    this.setupInteraction();
    this.animationService.startAnimation(() => this.animate());
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
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
    window.removeEventListener('resize', this.resizeListener);
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
  }

  private async loadMultipleFloors(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await fetch('assets/three-js/floor_list.json');
      /* JSON to API Migration Example:
      const response = await fetch('https://your-api.com/api/v1/floors');
      */
      if (!response.ok) throw new Error('Failed to load floor_list.json');
      const allFloorLayouts = await response.json();

      let maxFloorSize = 0;

      for (const floor of this.floors) {
        const data = allFloorLayouts[floor.id];
        if (!data) {
          console.warn(`No layout found for floor ID ${floor.id}`);
          continue;
        }

        // Build floor plan with X, Z, Y offsets
        // isBaseFloor = true, includeSurroundings = false for multi-floor view
        const result = this.floorPlanService.buildFloorPlan(data, this.scene, floor.xOffset, floor.zOffset, floor.yOffset, true, true, false);
        this.roomMeshes.push(...result.roomMeshes);
        maxFloorSize = Math.max(maxFloorSize, result.floorSize);
      }

      this.floorSize = maxFloorSize;

      // Set camera distance limits
      this.controlsService.updateDistanceLimits(
        this.floorSize * FLOOR_MAX_DISTANCE_MULTIPLIER,
        Math.min(this.floorSize * FLOOR_MIN_DISTANCE_MULTIPLIER, FLOOR_MIN_DISTANCE_ABSOLUTE)
      );

      // Frame ALL loaded floors using their combined bounds (better than fixed angle).
      this.cameraAnimationService.focusOnFloor(
        this.roomMeshes,
        this.camera,
        this.controls,
        0.85,
        () => this.updateLabelVisibility()
      );
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading floor plans:', error);
      this.isLoading = false;
    }
  }

  // Routing and graph visualization are not implemented in multi-floor viewer

  private setupInteraction(): void {
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // Contextual Controls: Rotate on Building, Pan on Background
    this.renderer.domElement.addEventListener('mousedown', (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.interactionService.updateMousePosition(event, rect);

      const isOverBuilding = this.interactionService.isPointOnBuilding(this.camera, this.roomMeshes);

      if (!this.isRotateMode) {
        // Left drag pans when 3D rotate is disabled
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      } else if (isOverBuilding) {
        // Dragging building -> Rotate
        this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      } else {
        // Dragging background -> Pan
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      }
    });

    this.renderer.domElement.style.cursor = 'grab';

    this.controls.addEventListener('start', () => {
      this.renderer.domElement.style.cursor = 'grabbing';
    });
    this.controls.addEventListener('end', () => {
      this.renderer.domElement.style.cursor = 'grab';
    });

    this.controls.addEventListener('change', () => {
      this.updateLabelVisibility();
    });
  }

  private updateLabelVisibility(): void {
    this.labelVisibilityService.updateLabelVisibility(
      this.roomMeshes,
      this.camera,
      this.controls,
      this.floorSize,
      (room: RoomMesh) => this.floorPlanService.getRoomCenter(room),
      true, // showLabels
      true, // showIcons
      this.zoomValue
    );
  }

  private onMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.interactionService.updateMousePosition(event, rect);

    const roomMesh = this.interactionService.getIntersectedRoom(this.camera, this.roomMeshes);

    if (this.hoveredRoom && this.hoveredRoom !== this.selectedRoomMesh) {
      applyRoomHighlight(
        this.hoveredRoom,
        false,
        false,
        false,
        false
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
        false,
        false
      );
      this.renderer.domElement.style.cursor = 'pointer';
    } else if (roomMesh === this.selectedRoomMesh) {
      this.renderer.domElement.style.cursor = 'pointer';
    }
  };

  private onClick = (): void => {
    if (this.hoveredRoom) {
      if (this.selectedRoomMesh === this.hoveredRoom) {
        this.deselectRoom();
      } else {
        if (this.selectedRoomMesh) {
          this.deselectRoom();
        }
        this.selectedRoomMesh = this.hoveredRoom;
        this.selectedRoom = this.hoveredRoom.data;
        applyRoomHighlight(
          this.selectedRoomMesh,
          true,
          false,
          false,
          false
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

  public deselectRoom(): void {
    if (this.selectedRoomMesh) {
      applyRoomHighlight(
        this.selectedRoomMesh,
        false,
        false,
        false,
        false
      );
      this.selectedRoomMesh = null;
      this.selectedRoom = null;
    }
  }

  public resetCamera(): void {
    // Re-frame based on combined bounds of all floors.
    this.cameraAnimationService.focusOnFloor(
      this.roomMeshes,
      this.camera,
      this.controls,
      0.85,
      () => this.updateLabelVisibility()
    );
  }

  public toggleRotateMode(): void {
    this.isRotateMode = !this.isRotateMode;
    if (this.controls) {
      this.controls.enableRotate = this.isRotateMode;
    }
  }

  public toggleWireframe(): void {
    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).wireframe =
            !(mesh.material as THREE.MeshStandardMaterial).wireframe;
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
    this.controlsService.update();
    this.updateZoomValue();
    this.compassState = this.compassControlService.update(this.compassState, this.camera, this.controls);
    this.rendererService.render(this.scene, this.camera);
  }

  private updateZoomValue(): void {
    if (this.camera && this.controls) {
      const current = this.camera.position.distanceTo(this.controls.target);
      const min = (this.controls as any).minDistance;
      const max = (this.controls as any).maxDistance;

      if (max > min) {
        const percentage = ((max - current) / (max - min)) * 200;
        this.zoomValue = Math.round(Math.max(0, Math.min(200, percentage)));
      } else {
        this.zoomValue = 0;
      }
    }
  }

  private onResize(): void {
    const w = this.container.nativeElement.clientWidth;
    const h = this.container.nativeElement.clientHeight;
    this.cameraService.updateAspect(w, h);
    this.rendererService.setSize(w, h);
  }

  // No routing/journey methods in multi-floor viewer
}
