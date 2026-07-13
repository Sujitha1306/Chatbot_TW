import { Injectable } from '@angular/core';
import * as THREE from 'three';
import {
    COMPASS_ROTATION_SENSITIVITY,
    COMPASS_TILT_SENSITIVITY,
    COMPASS_MIN_PHI,
    COMPASS_MAX_PHI,
    COMPASS_PIVOT_RADIUS,
    COMPASS_PIVOT_SENSITIVITY,
    COMPASS_DAMPING_FACTOR
} from '../constants/map.constants';

export interface CompassState {
    isRotating: boolean;
    lastAngle: number;
    lastMouseY: number;
    pivotX: number;
    pivotY: number;
    targetTheta: number;
    targetPhi: number;
    currentTheta: number;
    currentPhi: number;
    targetPivotX: number;
    targetPivotY: number;
    compassRect: DOMRect | null;
}

@Injectable({
    providedIn: 'root'
})
export class CompassControlService {

    /**
     * Start compass rotation
     */
    startRotation(event: MouseEvent, rect: DOMRect, camera: THREE.PerspectiveCamera, controls: any): CompassState {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;

        const angle = Math.atan2(dy, dx);
        const pivot = this.calculatePivot(dx, dy, rect.width / 2);

        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);

        return {
            isRotating: true,
            lastAngle: angle,
            lastMouseY: event.clientY,
            pivotX: pivot.x,
            pivotY: pivot.y,
            targetTheta: spherical.theta,
            targetPhi: spherical.phi,
            currentTheta: spherical.theta,
            currentPhi: spherical.phi,
            targetPivotX: pivot.x,
            targetPivotY: pivot.y,
            compassRect: rect
        };
    }

    /**
     * Handle compass mouse move - Updates targets only
     */
    handleMouseMove(
        event: MouseEvent,
        state: CompassState
    ): CompassState {
        if (!state.isRotating || !state.compassRect) return state;

        const rect = state.compassRect;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;

        const currentAngle = Math.atan2(dy, dx);
        let deltaAngle = currentAngle - state.lastAngle;

        if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
        if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

        const verticalDelta = event.clientY - state.lastMouseY;
        const pivot = this.calculatePivot(dx, dy, rect.width / 2);

        return {
            ...state,
            lastAngle: currentAngle,
            lastMouseY: event.clientY,
            targetTheta: state.targetTheta - (deltaAngle * COMPASS_ROTATION_SENSITIVITY),
            targetPhi: Math.max(COMPASS_MIN_PHI, Math.min(COMPASS_MAX_PHI, state.targetPhi + (verticalDelta * COMPASS_TILT_SENSITIVITY))),
            targetPivotX: pivot.x,
            targetPivotY: pivot.y
        };
    }

    /**
     * Smoothly animate the camera and UI toward their targets
     */
    update(state: CompassState, camera: THREE.PerspectiveCamera, controls: any): CompassState {
        // Always try to interpolate to provide consistent smoothness
        const thetaDiff = state.targetTheta - state.currentTheta;
        const phiDiff = state.targetPhi - state.currentPhi;
        const pivotXDiff = state.targetPivotX - state.pivotX;
        const pivotYDiff = state.targetPivotY - state.pivotY;

        // If almost reached targets and not rotating, we can skip expensive Three.js updates
        if (!state.isRotating &&
            Math.abs(thetaDiff) < 0.0001 &&
            Math.abs(phiDiff) < 0.0001 &&
            Math.abs(pivotXDiff) < 0.01 &&
            Math.abs(pivotYDiff) < 0.01) {
            return state;
        }

        // Interpolate camera spherical coordinates
        state.currentTheta += thetaDiff * COMPASS_DAMPING_FACTOR;
        state.currentPhi += phiDiff * COMPASS_DAMPING_FACTOR;

        // Interpolate UI pivot
        state.pivotX += pivotXDiff * COMPASS_DAMPING_FACTOR;
        state.pivotY += pivotYDiff * COMPASS_DAMPING_FACTOR;

        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const radius = offset.length();

        const spherical = new THREE.Spherical(
            radius,
            state.currentPhi,
            state.currentTheta
        );

        camera.position.setFromSpherical(spherical).add(controls.target);
        controls.update();

        return { ...state };
    }

    /**
     * Stop compass rotation
     */
    stopRotation(state: CompassState): CompassState {
        return {
            ...state,
            isRotating: false,
            targetPivotX: 0,
            targetPivotY: 0
        };
    }

    private calculatePivot(dx: number, dy: number, maxRadius: number): { x: number; y: number } {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const constraintRadius = maxRadius * COMPASS_PIVOT_RADIUS;
        const factor = Math.min(1, constraintRadius / dist);

        return {
            x: dx * factor * COMPASS_PIVOT_SENSITIVITY,
            y: dy * factor * COMPASS_PIVOT_SENSITIVITY
        };
    }
}
