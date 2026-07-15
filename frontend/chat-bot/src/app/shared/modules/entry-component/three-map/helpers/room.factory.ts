import * as THREE from 'three';
import {
    FLOOR_OPACITY,
    FLOOR_3D_EXTRUDE_HEIGHT,
    WALL_HEIGHT,
    WALL_THICKNESS,
    WALL_COLOR,
    WALL_OPACITY,
    WALL_ROUGHNESS,
    WALL_METALNESS,
    MIN_WALL_LENGTH,
    WALL_EMISSIVE_INTENSITY
} from '../constants/map.constants';

/**
 * Create a floor mesh from polygon coordinates
 */
export function createFloorMesh(coordinates: number[][], color: number, opacity?: number, strokeColor?: number): THREE.Mesh | null {
    if (coordinates.length < 3) return null;

    const shape = new THREE.Shape();

    coordinates.forEach((coord, index) => {
        const [x, z] = coord;
        if (index === 0) {
            shape.moveTo(x, z);
        } else {
            shape.lineTo(x, z);
        }
    });

    const geometry = new THREE.ShapeGeometry(shape);
    const resolvedOpacity = opacity !== undefined ? opacity : FLOOR_OPACITY;
    const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        opacity: resolvedOpacity
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.1;
    mesh.receiveShadow = false;
    mesh.renderOrder = 4;

    // Create and add the outline (border) matching Leaflet style!
    const points: THREE.Vector3[] = [];
    coordinates.forEach(coord => {
        points.push(new THREE.Vector3(coord[0], coord[1], 0.005));
    });
    const outlineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const resolvedStrokeColor = strokeColor !== undefined ? strokeColor : color;
    const outlineMat = new THREE.LineBasicMaterial({
        color: resolvedStrokeColor,
        transparent: true,
        opacity: 0.8
    });
    const outline = new THREE.LineLoop(outlineGeo, outlineMat);
    outline.renderOrder = 6;
    mesh.add(outline);

    return mesh;
}

/**
 * Create a 3D extruded floor mesh from polygon coordinates.
 * After rotation.x = Math.PI/2, local +Z maps to world -Y, so the extrusion
 * goes downward. We compensate by lifting position.y = FLOOR_3D_EXTRUDE_HEIGHT + 0.05
 * so the top face sits at that height and the bottom face sits at y ≈ 0.05.
 */
export function createExtrudedFloorMesh(coordinates: number[][], color: number, height: number = FLOOR_3D_EXTRUDE_HEIGHT): THREE.Mesh | null {
    if (coordinates.length < 3) return null;

    const shape = new THREE.Shape();
    coordinates.forEach((coord, index) => {
        const [x, z] = coord;
        if (index === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    });

    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: height,
        bevelEnabled: false
    });

    const material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.FrontSide,
        transparent: false,
        roughness: 0.4,
        metalness: 0.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = height + 0.05;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

/**
 * Create wall meshes from polygon coordinates
 */
export interface WallGap {
    segmentIndex: number; // Index in coordinates array [i] -> [i+1]
    center: THREE.Vector3;
    width: number;
}

/**
 * Create wall meshes from polygon coordinates, optionally with gaps for doors
 */
export function createWallsFromCoordinates(coordinates: number[][], gaps: WallGap[] = [], wallThickness: number = WALL_THICKNESS, wallHeight: number = WALL_HEIGHT): THREE.Mesh[] {
    const walls: THREE.Mesh[] = [];

    for (let i = 0; i < coordinates.length - 1; i++) {
        const [x1, z1] = coordinates[i];
        const [x2, z2] = coordinates[i + 1];

        const gap = gaps.find(g => g.segmentIndex === i);

        if (gap) {
            // Create two partial walls instead of one full wall
            createSplitWall(x1, z1, x2, z2, gap.width, walls, wallThickness, wallHeight);
        } else {
            // Standard wall
            createSingleWallSegment(x1, z1, x2, z2, walls, wallThickness, wallHeight);
        }
    }

    return walls;
}

function createSingleWallSegment(x1: number, z1: number, x2: number, z2: number, walls: THREE.Mesh[], wallThickness: number, wallHeight: number = WALL_HEIGHT): void {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);

    if (length < MIN_WALL_LENGTH) return;

    const geometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
    const material = new THREE.MeshStandardMaterial({
        color: WALL_COLOR,
        transparent: true,
        opacity: WALL_OPACITY,
        roughness: WALL_ROUGHNESS,
        metalness: WALL_METALNESS,
        emissive: WALL_COLOR,
        emissiveIntensity: WALL_EMISSIVE_INTENSITY
    });

    const wall = new THREE.Mesh(geometry, material);

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    wall.position.set(midX, wallHeight / 2, midZ);

    const angle = Math.atan2(dz, dx);
    wall.rotation.y = -angle;

    wall.castShadow = true;
    wall.receiveShadow = false;
    wall.renderOrder = 5;

    walls.push(wall);
}

function createSplitWall(x1: number, z1: number, x2: number, z2: number, gapWidth: number, walls: THREE.Mesh[], wallThickness: number, wallHeight: number = WALL_HEIGHT): void {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const fullLength = Math.sqrt(dx * dx + dz * dz);

    // If the wall is too small for a door, just skip the door or create a tiny wall?
    // Let's assume valid geometry.
    if (fullLength <= gapWidth) return; // No wall left

    const remaining = fullLength - gapWidth;
    const partLength = remaining / 2; // Split equally for centered door

    // We need 2 segments: Start->DoorStart and DoorEnd->End

    // Vector direction
    const unitX = dx / fullLength;
    const unitZ = dz / fullLength;

    // Segment 1: Start to (Start + partLength)
    const sx1 = x1 + unitX * (partLength / 2);
    const sz1 = z1 + unitZ * (partLength / 2);
    createWallParams(sx1, sz1, partLength, Math.atan2(dz, dx), walls, wallThickness, wallHeight);

    // Segment 2: (End - partLength) to End
    const sx2 = x2 - unitX * (partLength / 2);
    const sz2 = z2 - unitZ * (partLength / 2);
    createWallParams(sx2, sz2, partLength, Math.atan2(dz, dx), walls, wallThickness, wallHeight);
}

function createWallParams(cx: number, cz: number, length: number, angle: number, walls: THREE.Mesh[], wallThickness: number, wallHeight: number = WALL_HEIGHT): void {
    const geometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
    const material = new THREE.MeshStandardMaterial({
        color: WALL_COLOR,
        transparent: true,
        opacity: WALL_OPACITY,
        roughness: WALL_ROUGHNESS,
        metalness: WALL_METALNESS,
        emissive: WALL_COLOR,
        emissiveIntensity: WALL_EMISSIVE_INTENSITY
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(cx, wallHeight / 2, cz);
    wall.rotation.y = -angle;
    wall.castShadow = true;
    wall.receiveShadow = false;
    wall.renderOrder = 5;
    walls.push(wall);
}
