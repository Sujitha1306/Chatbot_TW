import * as THREE from 'three';
import { LocationData } from './location.model';

export interface RoomMesh {
    id: number;
    name: string;
    floor: THREE.Mesh;
    walls: THREE.Mesh[];
    originalColor: number;
    data: LocationData;
    label?: THREE.Sprite;
    labelIcon?: THREE.Sprite;
}