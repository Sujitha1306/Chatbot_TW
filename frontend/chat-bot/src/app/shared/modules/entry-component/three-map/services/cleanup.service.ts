import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh } from '../models';

@Injectable({
    providedIn: 'root'
})
export class CleanupService {
    /**
     * Recursively disposes of all child objects, geometries, materials, and textures
     */
    private disposeObjectDeep(obj: THREE.Object3D): void {
        if (!obj) return;

        // Depth-first recursive disposal of children
        while (obj.children.length > 0) {
            const child = obj.children[0];
            obj.remove(child);
            this.disposeObjectDeep(child);
        }

        if (obj instanceof THREE.Mesh) {
            if (obj.geometry) {
                try {
                    obj.geometry.dispose();
                } catch (e) {
                    console.warn('Failed to dispose geometry:', e);
                }
            }
            if (obj.material) {
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (const mat of materials) {
                    if (mat) {
                        // Dispose of any textures assigned to material properties (e.g., map, lightMap, normalMap, etc.)
                        for (const key of Object.keys(mat)) {
                            const val = (mat as any)[key];
                            if (val && typeof val.dispose === 'function') {
                                try {
                                    val.dispose();
                                } catch (e) {
                                    console.warn(`Failed to dispose material property '${key}':`, e);
                                }
                            }
                        }
                        try {
                            mat.dispose();
                        } catch (e) {
                            console.warn('Failed to dispose material:', e);
                        }
                    }
                }
            }
        }
    }

    /**
     * Clear all map objects from the scene
     */
    clearMapObjects(scene: THREE.Scene): void {
        const toRemove: THREE.Object3D[] = [];

        // Collect top-level objects to remove (ignoring scene itself and lights)
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!(child instanceof THREE.Light) && child.type !== 'Scene') {
                toRemove.push(child);
            }
        }

        toRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            } else {
                scene.remove(obj);
            }
            this.disposeObjectDeep(obj);
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
        this.disposeObjectDeep(group);
    }
}