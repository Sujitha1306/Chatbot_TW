import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    CONTROLS_DAMPING_FACTOR,
    CONTROLS_MAX_POLAR_ANGLE,
    CONTROLS_MAX_DISTANCE,
    CONTROLS_MIN_DISTANCE
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class ControlsService {
    private controls!: OrbitControls;

    initControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): OrbitControls {
        this.controls = new OrbitControls(camera, domElement);
        this.controls.enableDamping = false;
        this.controls.dampingFactor = CONTROLS_DAMPING_FACTOR;
        (this.controls as any).maxPolarAngle = CONTROLS_MAX_POLAR_ANGLE;
        this.controls.maxDistance = CONTROLS_MAX_DISTANCE;
        this.controls.minDistance = CONTROLS_MIN_DISTANCE;

        return this.controls;
    }

    getControls(): OrbitControls {
        return this.controls;
    }

    updateDistanceLimits(maxDistance: number, minDistance: number): void {
        if (!this.controls) return;
        this.controls.maxDistance = maxDistance;
        this.controls.minDistance = minDistance;
        this.controls.update();
    }

    update(): void {
        if (!this.controls) return;
        this.controls.update();
    }
}
