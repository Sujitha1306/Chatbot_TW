import * as THREE from 'three';
import {
    MARKER_PIN_RADIUS,
    MARKER_PIN_SEGMENTS,
    MARKER_PIN_CONE_HEIGHT,
    MARKER_PIN_CONE_RADIUS,
    MARKER_HEIGHT_OFFSET
} from '../constants/map.constants';

/**
 * Create a 3D Pin Marker (Sphere + Cone)
 */
export function createStatusMarker(text: string, color: number, position: THREE.Vector3, scene: THREE.Scene): THREE.Group {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2
    });

    // 1. Sphere (Head of the pin)
    const sphereGeom = new THREE.SphereGeometry(MARKER_PIN_RADIUS, MARKER_PIN_SEGMENTS, MARKER_PIN_SEGMENTS);
    const sphere = new THREE.Mesh(sphereGeom, material);
    sphere.position.y = MARKER_PIN_CONE_HEIGHT + MARKER_PIN_RADIUS / 2; // Sit on top of cone
    sphere.castShadow = true;
    group.add(sphere);

    // 2. Cone (Body of the pin)
    const coneGeom = new THREE.ConeGeometry(MARKER_PIN_CONE_RADIUS, MARKER_PIN_CONE_HEIGHT, MARKER_PIN_SEGMENTS);
    const cone = new THREE.Mesh(coneGeom, material);
    cone.position.y = MARKER_PIN_CONE_HEIGHT / 2;
    cone.rotation.x = Math.PI; // Point down (actually ConeGeometry points up by default usually, but we want point at 0,0,0)
    // ConeGeometry(radius, height) is centered at height/2. 
    // To have the tip at 0, we move it up by height/2 (so center is at height/2). 
    // Wait, Cone points up (+Y). To point down, rotate X 180 (Math.PI).
    // If rotated, the base is at +Y and tip at -Y relative to center.
    // Let's just create it pointing up and invert the group or just rotate the mesh.
    // Simpler: Cylinder decreasing radius? Or just specific placement.
    // Cone default: Base at -height/2, Tip at +height/2.
    // If we Rotate X PI: Base at +height/2, Tip at -height/2.
    // We want Tip at 0. So we move the mesh UP by height/2 (so local tip is at 0 relative to group origin).

    // Let's stick to a simple placement:
    // We want the TIP of the pin to be at (0,0,0) of the group.

    // Cone default center is (0,0,0). Height H.
    // Top (Tip) is at +H/2. Bottom (Base) is at -H/2.
    // We want Tip at 0. So shift Y by -H/2. Now Tip is at 0, Base is at -H.
    // Then Rotate Z 180 to flip it? No.
    // Let's just use Cylinder with radiusTop > radiusBottom=0?
    // ConeGeometry(radius, height)
    // Standard cone points UP. 
    // We want it to point DOWN.
    // Rotate X Math.PI. Now Tip is at -H/2. 
    // We want Tip at 0. So Position Y at +H/2.
    cone.rotation.x = Math.PI;
    cone.position.y = MARKER_PIN_CONE_HEIGHT / 2;
    group.add(cone);

    // Sphere on top: 
    // Base of cone is at Y = MARKER_PIN_CONE_HEIGHT.
    // Sphere center should be slightly embedded or just on top.
    sphere.position.y = MARKER_PIN_CONE_HEIGHT + (MARKER_PIN_RADIUS * 0.7); // 0.7 intersection looks nice

    group.position.copy(position);
    group.position.y += MARKER_HEIGHT_OFFSET;

    // Optional: Add text label inside/above sphere? 
    // User asked for "3D location pin" usually implies just the shape, but "Start" text might be nice?
    // Let's keep it simple shape first as per "pin object". 

    scene.add(group);
    return group;
}
