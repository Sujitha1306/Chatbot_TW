import { Injectable } from '@angular/core';
import * as THREE from 'three';
import {
    SCENE_BACKGROUND_COLOR,
    AMBIENT_LIGHT_COLOR,
    AMBIENT_LIGHT_INTENSITY,
    SUN_LIGHT_COLOR,
    SUN_LIGHT_INTENSITY,
    SUN_LIGHT_POSITION,
    SUN_SHADOW_MAP_SIZE,
    SUN_SHADOW_CAMERA_SIZE,
    FILL_LIGHT_COLOR,
    FILL_LIGHT_INTENSITY,
    FILL_LIGHT_POSITION
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class SceneService {
    private scene!: THREE.Scene;

    initScene(): THREE.Scene {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

        this.addLights();

        return this.scene;
    }

    private addLights(): void {
        this.scene.add(new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY));

        // Hemisphere light for warm, natural environmental lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xFFFAF0, 0.6);
        this.scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(SUN_LIGHT_COLOR, SUN_LIGHT_INTENSITY);
        sunLight.position.set(SUN_LIGHT_POSITION.x, SUN_LIGHT_POSITION.y, SUN_LIGHT_POSITION.z);

        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -SUN_SHADOW_CAMERA_SIZE;
        sunLight.shadow.camera.right = SUN_SHADOW_CAMERA_SIZE;
        sunLight.shadow.camera.top = SUN_SHADOW_CAMERA_SIZE;
        sunLight.shadow.camera.bottom = -SUN_SHADOW_CAMERA_SIZE;

        this.scene.add(sunLight);

        // Primary Fill Light
        const fillLight = new THREE.DirectionalLight(FILL_LIGHT_COLOR, FILL_LIGHT_INTENSITY);
        fillLight.position.set(FILL_LIGHT_POSITION.x, FILL_LIGHT_POSITION.y, FILL_LIGHT_POSITION.z);
        this.scene.add(fillLight);

        // Secondary Fill Light to eliminate dark sides
        const backFillLight = new THREE.DirectionalLight(FILL_LIGHT_COLOR, 0.4);
        backFillLight.position.set(50, 100, 50);
        this.scene.add(backFillLight);
    }

    getScene(): THREE.Scene {
        return this.scene;
    }
}
