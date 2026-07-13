import { Injectable } from '@angular/core';
import * as THREE from 'three';
import type { Group as ThreeGroup, Vector3 as ThreeVector3 } from 'three';
import {
    PERSON_MIN_SEGMENT_LENGTH,
    PERSON_ROTATION_SLERP_FACTOR,
    PERSON_BOB_AMPLITUDE,
    PERSON_BOB_FREQUENCY,
    PERSON_BODY_Y_OFFSET,
    PERSON_HEAD_Y_OFFSET
} from '../constants/map.constants';

export interface MovementState {
    isMoving: boolean;
    currentPathIndex: number;
    moveProgress: number;
}

@Injectable({
    providedIn: 'root'
})
export class PersonMovementService {

    /**
     * Update person movement along path
     */
    updateMovement(
        person: ThreeGroup,
        pathPoints: ThreeVector3[],
        state: MovementState,
        moveSpeed: number,
        deltaTime: number = 1 / 60
    ): MovementState {
        // Handle Base Ring Pulse (Always active even if not moving)
        const ring = person.getObjectByName('baseRing') as any;
        if (ring) {
            const time = Date.now() * 0.002;
            const pulse = 0.5 + Math.sin(time) * 0.2;
            (ring.material as any).opacity = pulse;
            const scale = 1 + Math.sin(time) * 0.05;
            ring.scale.set(scale, scale, 1);
        }

        if (state.currentPathIndex >= pathPoints.length - 1) {
            // Reset bobbing when stopped
            const torso = person.getObjectByName('torso');
            if (torso) torso.position.y = PERSON_BODY_Y_OFFSET;
            return { ...state, isMoving: false };
        }

        const start = pathPoints[state.currentPathIndex];
        const end = pathPoints[state.currentPathIndex + 1];

        const segmentLength = start.distanceTo(end);
        if (segmentLength < PERSON_MIN_SEGMENT_LENGTH) {
            return { ...state, currentPathIndex: state.currentPathIndex + 1 };
        }

        const step = (moveSpeed * deltaTime * 60) / segmentLength;
        const newProgress = state.moveProgress + step;

        if (newProgress >= 1) {
            const newIndex = state.currentPathIndex + 1;
            if (newIndex >= pathPoints.length - 1) {
                return { isMoving: false, currentPathIndex: newIndex, moveProgress: 0 };
            }
            return { isMoving: true, currentPathIndex: newIndex, moveProgress: 0 };
        }

        // Apply Position
        person.position.lerpVectors(start, end, newProgress);
        // person.position.y is naturally handled by lerpping between points with correct floor elevation

        // Apply Rotation
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(direction.x, 0, direction.z).normalize()
        );
        person.quaternion.slerp(targetQuaternion, PERSON_ROTATION_SLERP_FACTOR);

        // Apply Walking Bob (Sine wave based on progress and segment index)
        const torso = person.getObjectByName('torso');
        const head = person.getObjectByName('head');
        const leftArm = person.getObjectByName('leftArm');
        const rightArm = person.getObjectByName('rightArm');

        if (torso) {
            // Use segments and progress to create a continuous bob
            const bobFactor = (state.currentPathIndex + newProgress) * PERSON_BOB_FREQUENCY;
            const bobOffset = Math.sin(bobFactor) * PERSON_BOB_AMPLITUDE;

            torso.position.y = PERSON_BODY_Y_OFFSET + bobOffset;
            if (head) head.position.y = PERSON_HEAD_Y_OFFSET + bobOffset;

            // Subtle arm swing
            if (leftArm) leftArm.rotation.x = Math.sin(bobFactor) * 0.2;
            if (rightArm) rightArm.rotation.x = -Math.sin(bobFactor) * 0.2;
        }

        return { ...state, moveProgress: newProgress };
    }
}
