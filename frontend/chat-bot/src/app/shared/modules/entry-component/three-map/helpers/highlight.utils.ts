import * as THREE from 'three';
import { RoomMesh } from '../models';
import {
    HIGHLIGHT_SELECTED_COLOR,
    HIGHLIGHT_SELECTED_INTENSITY,
    HIGHLIGHT_SELECTED_WALL_INTENSITY,
    HIGHLIGHT_HOVER_COLOR,
    HIGHLIGHT_HOVER_INTENSITY,
    HIGHLIGHT_HOVER_WALL_INTENSITY,
    HIGHLIGHT_START_COLOR,
    HIGHLIGHT_DESTINATION_COLOR,
    WALL_COLOR,
    WALL_EMISSIVE_INTENSITY
} from '../constants/map.constants';

/**
 * Apply visual highlight to a room (selected or hovered)
 */
export function applyRoomHighlight(roomMesh: RoomMesh, selected: boolean, hover: boolean, isStart: boolean = false, isEnd: boolean = false): void {
    const floorMaterial = roomMesh.floor.material as any;

    if (floorMaterial.emissive) {
        floorMaterial.color.setHex(roomMesh.originalColor);
        if (isStart) {
            floorMaterial.emissive.setHex(HIGHLIGHT_START_COLOR);
            floorMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_INTENSITY;
        } else if (isEnd) {
            floorMaterial.emissive.setHex(HIGHLIGHT_DESTINATION_COLOR);
            floorMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_INTENSITY;
        } else if (selected) {
            floorMaterial.emissive.setHex(HIGHLIGHT_SELECTED_COLOR);
            floorMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_INTENSITY;
        } else if (hover) {
            floorMaterial.emissive.setHex(HIGHLIGHT_HOVER_COLOR);
            floorMaterial.emissiveIntensity = HIGHLIGHT_HOVER_INTENSITY;
        } else {
            floorMaterial.emissive.setHex(0x000000);
            floorMaterial.emissiveIntensity = 0;
        }
    } else {
        if (isStart) {
            floorMaterial.color.setHex(HIGHLIGHT_START_COLOR);
        } else if (isEnd) {
            floorMaterial.color.setHex(HIGHLIGHT_DESTINATION_COLOR);
        } else if (selected) {
            floorMaterial.color.setHex(HIGHLIGHT_SELECTED_COLOR);
        } else if (hover) {
            floorMaterial.color.setHex(HIGHLIGHT_HOVER_COLOR);
        } else {
            floorMaterial.color.setHex(roomMesh.originalColor);
        }
    }

    roomMesh.walls.forEach(wall => {
        const wallMaterial = wall.material as THREE.MeshStandardMaterial;
        if (isStart) {
            wallMaterial.emissive.setHex(HIGHLIGHT_START_COLOR);
            wallMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_WALL_INTENSITY;
        } else if (isEnd) {
            wallMaterial.emissive.setHex(HIGHLIGHT_DESTINATION_COLOR);
            wallMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_WALL_INTENSITY;
        } else if (selected) {
            wallMaterial.emissive.setHex(HIGHLIGHT_SELECTED_COLOR);
            wallMaterial.emissiveIntensity = HIGHLIGHT_SELECTED_WALL_INTENSITY;
        } else if (hover) {
            wallMaterial.emissive.setHex(HIGHLIGHT_HOVER_COLOR);
            wallMaterial.emissiveIntensity = HIGHLIGHT_HOVER_WALL_INTENSITY;
        } else {
            wallMaterial.emissive.setHex(WALL_COLOR);
            wallMaterial.emissiveIntensity = WALL_EMISSIVE_INTENSITY;
        }
    });

    if (roomMesh.label) {
        (roomMesh.label.material as THREE.SpriteMaterial).color.setHex(0xffffff);
        const setTextColor: ((c: string | null, bold?: boolean) => void) | undefined = roomMesh.label.userData['setTextColor'];
        const setHighlightScale: ((active: boolean) => void) | undefined = roomMesh.label.userData['setHighlightScale'];
        if (isStart) {
            setTextColor?.(`#${HIGHLIGHT_START_COLOR.toString(16).padStart(6, '0')}`, false);
            setHighlightScale?.(true);
        } else if (isEnd) {
            setTextColor?.(`#${HIGHLIGHT_DESTINATION_COLOR.toString(16).padStart(6, '0')}`, false);
            setHighlightScale?.(true);
        } else if (selected) {
            setTextColor?.('#0d47a1', false);
            setHighlightScale?.(false);
        } else {
            setTextColor?.(null, false);
            // Only reset scale if this room was previously boosted to 1.3×.
            // Calling setHighlightScale(false) on a plain hover would override
            // the zoom-adjusted scale that LabelVisibilityService applied.
            if (roomMesh.label.userData['highlightScaleActive']) {
                setHighlightScale?.(false);
            }
        }
    }
}
