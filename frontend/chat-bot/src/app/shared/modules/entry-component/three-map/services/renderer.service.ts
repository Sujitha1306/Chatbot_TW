import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RENDERER_PIXEL_RATIO_MAX } from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class RendererService {
    private renderer!: THREE.WebGLRenderer;

    initRenderer(width: number, height: number): THREE.WebGLRenderer {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, RENDERER_PIXEL_RATIO_MAX));

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        return this.renderer;
    }

    getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    setSize(width: number, height: number): void {
        this.renderer.setSize(width, height);
    }

    render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
        this.renderer.render(scene, camera);
    }

    dispose(): void {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
