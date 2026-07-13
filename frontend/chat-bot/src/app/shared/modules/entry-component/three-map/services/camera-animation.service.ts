import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { easeInOutCubic } from '../helpers';
import {
    CAMERA_FOCUS_DURATION,
    CAMERA_ZOOM_DURATION,
    CAMERA_ROTATION_RESET_DURATION,
    CAMERA_DISTANCE_RATIO,
    CAMERA_DEFAULT_POSITION_RATIO,
    FOCUS_ROOM_MIN_DISTANCE,
    FOCUS_ROOM_DISTANCE_MULTIPLIER
} from '../constants/map.constants';
import { RoomMesh } from '../models';

@Injectable({
    providedIn: 'root'
})
export class CameraAnimationService {

    private activeAnimationFrame: number | null = null;
    private animationToken = 0;

    /**
     * Animate camera smoothly to target position
     */
    animateCamera(
        camera: THREE.PerspectiveCamera,
        controls: any,
        startCam: THREE.Vector3,
        targetCam: THREE.Vector3,
        startTarget: THREE.Vector3,
        endTarget: THREE.Vector3,
        duration: number,
        onUpdate?: () => void
    ): void {
        this.animationToken += 1;
        const token = this.animationToken;
        if (this.activeAnimationFrame !== null) {
            cancelAnimationFrame(this.activeAnimationFrame);
            this.activeAnimationFrame = null;
        }

        const startTime = Date.now();

        const step = () => {
            if (token !== this.animationToken) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(progress);

            camera.position.lerpVectors(startCam, targetCam, eased);
            controls.target.lerpVectors(startTarget, endTarget, eased);
            controls.update();

            if (onUpdate) onUpdate();

            if (progress < 1) {
                this.activeAnimationFrame = requestAnimationFrame(step);
            } else if (token === this.animationToken) {
                this.activeAnimationFrame = null;
            }
        };
        step();
    }

    /**
     * Focus camera on a specific room
     */
    focusOnRoom(
        roomMesh: RoomMesh,
        camera: THREE.PerspectiveCamera,
        controls: any,
        onUpdate?: () => void
    ): void {
        const targetPos = new THREE.Vector3();
        new THREE.Box3().setFromObject(roomMesh.floor).getCenter(targetPos);

        const startTarget = controls.target.clone();
        const startCam = camera.position.clone();

        const box = new THREE.Box3().setFromObject(roomMesh.floor);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.z);
        const zoomDist = Math.max(maxDim * FOCUS_ROOM_DISTANCE_MULTIPLIER, FOCUS_ROOM_MIN_DISTANCE);

        // Preserve the current camera direction (rotation angle) — only shift the orbit
        // target to the room centre and pull the camera in to the zoom distance.
        const currentDir = new THREE.Vector3()
            .subVectors(startCam, startTarget)
            .normalize();
        const targetCam = new THREE.Vector3()
            .addVectors(targetPos, currentDir.multiplyScalar(zoomDist));

        this.animateCamera(camera, controls, startCam, targetCam, startTarget, targetPos, CAMERA_FOCUS_DURATION, onUpdate);
    }

    /**
     * Focus camera on entire floor
     */
    focusOnFloor(
        roomMeshes: RoomMesh[],
        camera: THREE.PerspectiveCamera,
        controls: any,
        distanceMultiplier: number = 1,
        onUpdate?: () => void
    ): void {
        if (roomMeshes.length === 0) return;

        const bounds = new THREE.Box3();
        roomMeshes.forEach(room => {
            bounds.expandByObject(room.floor);
        });

        const center = new THREE.Vector3();
        bounds.getCenter(center);
        const size = new THREE.Vector3();
        bounds.getSize(size);

        const maxDim = Math.max(size.x, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const baseCameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        const cameraZ = baseCameraZ * distanceMultiplier;

        controls.target.copy(center);
        camera.position.set(
            center.x + cameraZ * CAMERA_DEFAULT_POSITION_RATIO,
            center.y + cameraZ,
            center.z + cameraZ * CAMERA_DEFAULT_POSITION_RATIO
        );
        controls.update();

        if (onUpdate) {
            setTimeout(onUpdate, 100);
        }
    }

    /**
     * Smooth zoom in/out
     */
    smoothZoom(
        factor: number,
        camera: THREE.PerspectiveCamera,
        controls: any,
        onUpdate?: () => void
    ): void {
        const startCam = camera.position.clone();
        const target = controls.target.clone();

        const diff = new THREE.Vector3().subVectors(startCam, target);
        diff.multiplyScalar(factor);

        const targetCam = new THREE.Vector3().addVectors(target, diff);

        const newDist = targetCam.distanceTo(target);
        if (newDist < controls.minDistance || newDist > controls.maxDistance) return;

        this.animateCamera(camera, controls, startCam, targetCam, target, target, CAMERA_ZOOM_DURATION, onUpdate);
    }

    /**
     * Fit camera to a precomputed world-space bounding box (e.g. the route path).
     * Uses the same FOV-based distance formula as focusOnFloor but animates smoothly.
     */
    focusOnBounds(
        bounds: THREE.Box3,
        camera: THREE.PerspectiveCamera,
        controls: any,
        onUpdate?: () => void,
        distanceMultiplier: number = 1.5
    ): void {
        if (bounds.isEmpty()) return;

        const center = new THREE.Vector3();
        bounds.getCenter(center);
        const size = new THREE.Vector3();
        bounds.getSize(size);

        const maxDim = Math.max(size.x, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const baseDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        const dist = Math.max(baseDist * distanceMultiplier, FOCUS_ROOM_MIN_DISTANCE);

        const startCam = camera.position.clone();
        const startTarget = controls.target.clone();
        const targetCam = new THREE.Vector3(
            center.x + dist * CAMERA_DEFAULT_POSITION_RATIO,
            center.y + dist,
            center.z + dist * CAMERA_DEFAULT_POSITION_RATIO
        );

        this.animateCamera(camera, controls, startCam, targetCam, startTarget, center, CAMERA_FOCUS_DURATION, onUpdate);
    }

    /**
     * Reset camera rotation to default angle
     */
    resetRotation(
        camera: THREE.PerspectiveCamera,
        controls: any,
        onUpdate?: () => void
    ): void {
        const startCam = camera.position.clone();
        const target = controls.target.clone();

        const dist = startCam.distanceTo(target);

        const cameraZ = dist * CAMERA_DISTANCE_RATIO;
        const targetCam = new THREE.Vector3(
            target.x + cameraZ * CAMERA_DEFAULT_POSITION_RATIO,
            cameraZ,
            target.z + cameraZ * CAMERA_DEFAULT_POSITION_RATIO
        );

        this.animateCamera(camera, controls, startCam, targetCam, target, target, CAMERA_ROTATION_RESET_DURATION, onUpdate);
    }
}