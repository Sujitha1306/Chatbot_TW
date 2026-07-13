import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh } from '../models';

@Injectable({
    providedIn: 'root'
})
export class CleanupService {
    /**
     * Clear all map objects from the scene
     */
    clearMapObjects(scene: THREE.Scene): void {
        const toRemove: THREE.Object3D[] = [];

        scene.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Group || child.name === 'label') {
                if (child.type !== 'Scene' && !(child instanceof THREE.Light)) {
                    toRemove.push(child);
                }
            }
        });

        toRemove.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
            if (obj instanceof THREE.Mesh) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            }
        });
    }

    /**
     * Dispose of a Three.js group and its children
     */
    disposeGroup(group: THREE.Group | null, scene: THREE.Scene): void {
        if (!group) return;

        // Remove from actual parent so it works whether group lives in scene or buildingGroup
        if (group.parent) {
            group.parent.remove(group);
        } else {
            scene.remove(group);
        }
        group.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
            }
        });
    }
}