import { Injectable } from '@angular/core';
import * as THREE from 'three';
import {
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_FAR,
    CAMERA_INITIAL_POSITION
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class CameraService {
    private camera!: THREE.PerspectiveCamera;

    initCamera(width: number, height: number): THREE.PerspectiveCamera {
        this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR);
        this.camera.position.set(
            CAMERA_INITIAL_POSITION.x,
            CAMERA_INITIAL_POSITION.y,
            CAMERA_INITIAL_POSITION.z
        );
        this.camera.lookAt(0, 0, 0);

        return this.camera;
    }

    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    updateAspect(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}