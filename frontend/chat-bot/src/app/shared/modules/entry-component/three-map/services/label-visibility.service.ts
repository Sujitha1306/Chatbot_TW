import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh } from '../models';
import {
    LABEL_VISIBILITY_THRESHOLD_RATIO,
    LABEL_FOCUS_RADIUS_MIN,
    LABEL_FOCUS_RADIUS_MAX
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class LabelVisibilityService {

    private readonly ICON_DOT_SCALE = 2.5;
    // Reference camera distance at which labels/icons were designed — scale is adjusted
    // proportionally so apparent screen size stays constant at any zoom level.
    private readonly LABEL_REFERENCE_DISTANCE = 200;

    // Camera distance = room diagonal × multiplier → threshold at which that label/icon appears.
    // Larger rooms (corridors, lobbies) cross the threshold sooner → visible when zoomed out.
    // Smaller rooms only appear when you zoom in close — matching Google Maps behaviour.
    private readonly LABEL_TEXT_DISTANCE_MULTIPLIER = 12;
    private readonly LABEL_ICON_DISTANCE_MULTIPLIER = 20;
    // Rooms with a very small polygon still get a usable threshold via this floor.
    private readonly MIN_LABEL_DIAGONAL = 4;

    /**
     * Compute (and cache) the XZ diagonal of the room's floor mesh bounding box.
     * Cached in userData['labelDiagonal'] so Box3 is only built once per room.
     */
    private getRoomDiagonal(room: RoomMesh): number {
        if (!room.floor) return this.MIN_LABEL_DIAGONAL;
        if (typeof room.floor.userData['labelDiagonal'] === 'number') {
            return room.floor.userData['labelDiagonal'];
        }
        const box = new THREE.Box3().setFromObject(room.floor);
        const size = new THREE.Vector3();
        box.getSize(size);
        const diagonal = Math.max(this.MIN_LABEL_DIAGONAL, Math.sqrt(size.x * size.x + size.z * size.z));
        room.floor.userData['labelDiagonal'] = diagonal;
        return diagonal;
    }

    /**
     * Update label and icon visibility using polygon-size-based adaptive thresholds.
     *
     * Each room's visibility threshold is derived from its own floor polygon diagonal:
     *   full label (text + icon)  →  camera dist ≤ diagonal × LABEL_TEXT_DISTANCE_MULTIPLIER  (12)
     *   icon dot only             →  camera dist ≤ diagonal × LABEL_ICON_DISTANCE_MULTIPLIER  (20)
     *   nothing shown             →  beyond both thresholds
     *
     * This mirrors Google Maps: large areas (corridors, lobbies) show names even when
     * zoomed out; small rooms only reveal their name when the camera is close.
     */
    updateLabelVisibility(
        roomMeshes: RoomMesh[],
        camera: any,
        controls: any,
        _floorSize: number,
        _getRoomCenter: (room: RoomMesh) => THREE.Vector3,
        showLabels: boolean = true,
        showIcons: boolean = true,
        _zoomValue: number = 0
    ): void {
        // Use camera-to-target for visibility thresholds (cheap, good approximation)
        const dist = camera.position.distanceTo(controls.target);
        const camPos = camera.position;

        roomMeshes.forEach(room => {
            if (!room.label) return;

            const diagonal = this.getRoomDiagonal(room);
            const isRouteMarker = room.label.userData['isRouteMarker'] === true;
            const showFullLabel = isRouteMarker || (showLabels && dist <= diagonal * this.LABEL_TEXT_DISTANCE_MULTIPLIER);
            const showIconOnly  = !isRouteMarker && showIcons && !showFullLabel && dist <= diagonal * this.LABEL_ICON_DISTANCE_MULTIPLIER;

            room.label.visible = showFullLabel;

            if (showFullLabel) {
                // Per-label distance gives truly constant screen size regardless of
                // where the label sits relative to the camera target.
                const labelPos = new THREE.Vector3();
                room.label.getWorldPosition(labelPos);
                const labelDist = camPos.distanceTo(labelPos);
                const distFactor = labelDist / this.LABEL_REFERENCE_DISTANCE;
                const fsx = (room.label.userData['fixedSX'] ?? 6.84) * distFactor;
                const fsy = (room.label.userData['fixedSY'] ?? 1.46) * distFactor;

                const parentScale = new THREE.Vector3(1, 1, 1);
                if (room.label.parent) {
                    room.label.parent.getWorldScale(parentScale);
                }
                const px = parentScale.x || 1;
                const py = parentScale.y || 1;
                const pz = parentScale.z || 1;

                room.label.scale.set(fsx / px, fsy / py, 1 / pz);
            }

            if (room.labelIcon) {
                const isIconRouteMarker = room.labelIcon.userData['isRouteMarker'] === true;
                const iconPos = new THREE.Vector3();
                room.labelIcon.getWorldPosition(iconPos);
                const iconDist = camPos.distanceTo(iconPos);
                const ratio = iconDist / this.LABEL_REFERENCE_DISTANCE;
                const iconFactor = ratio > 1 ? Math.sqrt(ratio) : ratio;
                const desiredScale = this.ICON_DOT_SCALE * iconFactor;

                const parentScale = new THREE.Vector3(1, 1, 1);
                if (room.labelIcon.parent) {
                    room.labelIcon.parent.getWorldScale(parentScale);
                }
                const px = parentScale.x || 1;
                const py = parentScale.y || 1;
                const pz = parentScale.z || 1;

                room.labelIcon.scale.set(desiredScale / px, desiredScale / py, 1 / pz);
                room.labelIcon.visible = isIconRouteMarker || showIconOnly;
            }
        });
    }

    /**
     * Update visibility for generic sprites (readers) based on zoom
     */
    updateSpriteVisibility(
        sprites: THREE.Sprite[],
        camera: any,
        controls: any,
        floorSize: number,
        showIcons: boolean = true
    ): void {
        const zoomDist = camera.position.distanceTo(controls.target);
        const checkThreshold = floorSize * LABEL_VISIBILITY_THRESHOLD_RATIO;

        sprites.forEach(sprite => {
            if (zoomDist < checkThreshold) {
                const spritePos = new THREE.Vector3();
                sprite.getWorldPosition(spritePos);
                const distToFocus = controls.target.distanceTo(spritePos);

                const zoomFactor = 1.0 - (zoomDist / checkThreshold);
                const focusRadius = zoomDist * (LABEL_FOCUS_RADIUS_MIN + zoomFactor * LABEL_FOCUS_RADIUS_MAX);

                sprite.visible = distToFocus < focusRadius && showIcons;
            } else {
                sprite.visible = false;
            }
        });
    }
}
