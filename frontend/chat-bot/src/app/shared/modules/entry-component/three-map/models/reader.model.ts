import * as THREE from 'three';

export interface ReaderData {
    id: number;
    readerName: string;
    macId: string;
    readerTypeName: string;
    floorId: number;
    floorName: string;
    locationId: number;
    locationName: string;
    coordinate: string; // "[x,z]"
    status: string;
}

export interface ReaderSprite extends THREE.Sprite {
    readerData: ReaderData;
    position : any;
    name : string;
    scale : any;
}
