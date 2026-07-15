import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { ReaderData, ReaderSprite } from '../models';
import { ConfigurationService } from '../../../../services';

@Injectable({
    providedIn: 'root'
})
export class ReaderService {
    private readers: ReaderData[] = [];
    private iconCache = new Map<string, THREE.Texture>();
    private readersLoadedPromise: Promise<void> | null = null;

    private iconLoadingMap: Record<string, string> = {
        'WiFi Reader': 'assets/three-js/icons/wifi-reader.svg',
        'Location Beacon': 'assets/three-js/icons/beacon-reader.svg',
        'Mini Reader': 'assets/three-js/icons/mini-reader.svg',
        'Mini Reader - Sound Sensor': 'assets/three-js/icons/sound-reader.svg',
        'PoE Reader': 'assets/three-js/icons/poe-reader.svg'
    };

    constructor(private configurationServices : ConfigurationService) { }

    public loadReaders(): Promise<void> {
        if (this.readersLoadedPromise) {
            return this.readersLoadedPromise;
        }
        this.readersLoadedPromise = new Promise<void>((resolve) => {
            try {
                this.configurationServices.getAllReaders().subscribe({
                    next: (res) => {
                        this.readers = res?.results?.filter(val => val.readerTypeId !== 'RT-DS') || [];
                        console.log(`Loaded ${this.readers.length} readers.`);
                        resolve();
                    },
                    error: (error) => {
                        console.error('Error loading readers:', error);
                        resolve(); // Resolve to avoid blocking map initialization
                    }
                });
            } catch (error) {
                console.error('Sync error in loadReaders:', error);
                resolve();
            }
        });
        return this.readersLoadedPromise;
    }

    public createReadersForFloor(
        floorId: number,
        parent: THREE.Group,
        yOffset: number = 0,
        xOffset: number = 0,
        zOffset: number = 0
    ): ReaderSprite[] {
        const floorReaders = this.readers.filter(r => r.floorId === floorId);
        const sprites: ReaderSprite[] = [];

        floorReaders.forEach(data => {
            const sprite = this.createReaderSprite(data, yOffset, xOffset, zOffset);
            if (sprite) {
                parent.add(sprite);
                const parentScale = new THREE.Vector3(1, 1, 1);
                parent.getWorldScale(parentScale);
                const px = parentScale.x || 1;
                const py = parentScale.y || 1;
                const pz = parentScale.z || 1;
                sprite.scale.set(1.4 / px, 1.4 / py, 1 / pz);
                sprites.push(sprite);
            }
        });

        return sprites;
    }

    private createReaderSprite(
        data: ReaderData,
        yOffset: number = 0,
        xOffset: number = 0,
        zOffset: number = 0
    ): ReaderSprite | null {
        const coords = this.parseCoordinates(data.coordinate);
        if (!coords) return null;

        const iconPath = this.iconLoadingMap[data.readerTypeName] || 'assets/three-js/icons/default.svg';
        let texture = this.iconCache.get(iconPath);

        if (!texture) {
            const loader = new THREE.TextureLoader();
            texture = loader.load(iconPath);
            this.iconCache.set(iconPath, texture);
        }

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(material) as ReaderSprite;
        (sprite as any).renderOrder = 999;
        sprite.readerData = data;

        const y = yOffset + 0.8;
        // Apply the same XZ centering offset used by room meshes on this floor
        sprite.position.set(coords.x + xOffset, y, coords.z + zOffset);
        sprite.scale.set(1.4, 1.4, 1);
        sprite.name = `reader-${data.id}`;

        return sprite;
    }

    private parseCoordinates(coordStr: string): { x: number, z: number } | null {
        try {
            // coordStr can be "[x,z]" or "[[x,z]]"
            const cleaned = coordStr.replace(/\[/g, '').replace(/\]/g, '');
            const parts = cleaned.split(',').map(p => parseFloat(p.trim()));
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return { x: parts[0], z: parts[1] };
            }
        } catch (e) {
            console.error('Error parsing coordinates:', coordStr);
        }
        return null;
    }
}
