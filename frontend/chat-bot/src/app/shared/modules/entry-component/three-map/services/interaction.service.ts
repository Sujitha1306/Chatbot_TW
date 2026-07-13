import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh } from '../models';

@Injectable({
    providedIn: 'root'
})
export class InteractionService {
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    updateMousePosition(event: MouseEvent, rect: DOMRect): void {
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getIntersectedRoom(
        camera: THREE.PerspectiveCamera,
        roomMeshes: RoomMesh[]
    ): RoomMesh | null {
        this.raycaster.setFromCamera(this.mouse, camera);

        const interactiveObjects: THREE.Mesh[] = [];
        roomMeshes.forEach(rm => {
            interactiveObjects.push(rm.floor);
            interactiveObjects.push(...rm.walls);
        });

        const intersects = this.raycaster.intersectObjects(interactiveObjects);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object as THREE.Mesh;
            let roomMesh = roomMeshes.find(rm => rm.floor === intersectedObject);
            if (!roomMesh) {
                roomMesh = roomMeshes.find(rm => rm.walls.includes(intersectedObject));
            }
            return roomMesh || null;
        }

        return null;
    }

    /**
     * Get the first object intersected from a specific list
     */
    getIntersectedObject(
        camera: THREE.PerspectiveCamera,
        objects: THREE.Object3D[]
    ): THREE.Object3D | null {
        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObjects(objects);
        return intersects.length > 0 ? intersects[0].object : null;
    }

    /**
     * Check if the current mouse position is over any part of the building (floors or walls)
     */
    isPointOnBuilding(
        camera: THREE.PerspectiveCamera,
        roomMeshes: RoomMesh[]
    ): boolean {
        this.raycaster.setFromCamera(this.mouse, camera);

        const interactiveObjects: THREE.Mesh[] = [];
        roomMeshes.forEach(rm => {
            interactiveObjects.push(rm.floor);
            interactiveObjects.push(...rm.walls);
        });

        const intersects = this.raycaster.intersectObjects(interactiveObjects);
        return intersects.length > 0;
    }
}
