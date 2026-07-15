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
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

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
            try {
                this.renderer.forceContextLoss();
            } catch (e) {
                console.warn('WebGL forceContextLoss failed:', e);
            }
            try {
                this.renderer.dispose();
            } catch (e) {
                console.warn('WebGLRenderer dispose failed:', e);
            }
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                try {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                } catch (e) {
                    console.warn('Failed to remove canvas element from DOM:', e);
                }
            }
        }
    }
}
