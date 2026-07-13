import * as THREE from 'three';
import { WALL_THICKNESS, WALL_HEIGHT } from '../constants/map.constants';

const DOOR_WIDTH = 0.8;
const DOOR_COLOR = 0xB4B2AC;
const DOOR_FRAME_COLOR = 0x8A877E;
const DOOR_HEIGHT = 1.0;
const DOOR_FRAME_THICKNESS = 0.08;
const DOOR_OPEN_ANGLE = Math.PI / 3; // 60 degrees open

export interface DoorData {
    position: THREE.Vector3;
    rotation: number;
    width: number;
    segmentIndex: number;
}

// ============================================================
// DETECTION HELPERS
// ============================================================

function segmentLength(p1: number[], p2: number[]): number {
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dz * dz);
}

function segmentMidpoint(p1: number[], p2: number[]): [number, number] {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

function segmentAngle(p1: number[], p2: number[]): number {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

function pointToSegmentDist(point: number[], a: number[], b: number[]): number {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lenSq = dx * dx + dz * dz;
    if (lenSq === 0) return segmentLength(point, a);

    let t = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closest = [a[0] + t * dx, a[1] + t * dz];
    return segmentLength(point, closest);
}

/**
 * Checks if two segments are:
 * 1. Parallel (same angle within tolerance)
 * 2. Close to each other (within proximity threshold)
 * 3. Overlapping in length
 */
function areSegmentsNearlyParallelAndClose(
    p1: number[], p2: number[],
    q1: number[], q2: number[],
    proximityThreshold: number = 0.8
): boolean {
    // 1. Check Parallelism (angles must be within ~5 degrees)
    const angleP = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const angleQ = Math.atan2(q2[1] - q1[1], q2[0] - q1[0]);
    let angleDiff = Math.abs(angleP - angleQ);

    // Normalize angle difference to [0, PI]
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff;

    const ANGLE_TOL = 0.10; // ~5.7 degrees
    if (angleDiff > ANGLE_TOL) return false;

    // 2. Check proximity: the midpoints of segments should be close together
    const [mx, mz] = segmentMidpoint(p1, p2);
    const distMidToQ = pointToSegmentDist([mx, mz], q1, q2);
    if (distMidToQ > proximityThreshold) return false;

    // 3. Check overlap: project p1/p2 onto q's axis and see if they overlap
    const qDx = q2[0] - q1[0];
    const qDz = q2[1] - q1[1];
    const qLen = Math.sqrt(qDx * qDx + qDz * qDz);
    if (qLen < 0.001) return false;

    const unitQx = qDx / qLen;
    const unitQz = qDz / qLen;

    const projQ1 = 0;
    const projQ2 = qLen;
    const projP1 = (p1[0] - q1[0]) * unitQx + (p1[1] - q1[1]) * unitQz;
    const projP2 = (p2[0] - q1[0]) * unitQx + (p2[1] - q1[1]) * unitQz;

    const overlapStart = Math.max(Math.min(projP1, projP2), projQ1);
    const overlapEnd = Math.min(Math.max(projP1, projP2), projQ2);

    // Must overlap by at least DOOR_WIDTH to count
    return (overlapEnd - overlapStart) >= DOOR_WIDTH;
}

// ============================================================
// MAIN DOOR DETECTION
// ============================================================

/**
 * Strategy: Try to find a shared/adjacent wall between the room and any neighbor.
 * 1. First tries exact edge matching (fast).
 * 2. Falls back to collinearity + proximity check.
 * 3. Falls back to placing a door on the room's longest wall.
 */
export function findDoorPosition(
    roomCoords: number[][],
    neighborCoords: number[][]
): DoorData | null {
    // --- Pass 1: Exact edge match (original logic, threshold widened to 0.5m) ---
    for (let i = 0; i < roomCoords.length - 1; i++) {
        const r1 = roomCoords[i];
        const r2 = roomCoords[i + 1];

        for (let j = 0; j < neighborCoords.length - 1; j++) {
            const c1 = neighborCoords[j];
            const c2 = neighborCoords[j + 1];

            if (isExactSharedEdge(r1, r2, c1, c2, 0.5)) {
                return buildDoorData(r1, r2, i);
            }
        }
    }

    // --- Pass 2: Collinearity + proximity match ---
    for (let i = 0; i < roomCoords.length - 1; i++) {
        const r1 = roomCoords[i];
        const r2 = roomCoords[i + 1];

        // Skip very short segments (can't fit a door)
        if (segmentLength(r1, r2) < DOOR_WIDTH) continue;

        for (let j = 0; j < neighborCoords.length - 1; j++) {
            const c1 = neighborCoords[j];
            const c2 = neighborCoords[j + 1];

            if (areSegmentsNearlyParallelAndClose(r1, r2, c1, c2, 0.8)) {
                return buildDoorData(r1, r2, i);
            }
        }
    }

    return null;
}

/**
 * Fallback: Place a door on the longest wall segment of the room that can fit a door.
 */
export function findDoorOnLongestWall(roomCoords: number[][]): DoorData | null {
    let longestLen = -1;
    let longestIdx = -1;

    for (let i = 0; i < roomCoords.length - 1; i++) {
        const len = segmentLength(roomCoords[i], roomCoords[i + 1]);
        if (len > longestLen && len >= DOOR_WIDTH + 0.1) {
            longestLen = len;
            longestIdx = i;
        }
    }

    if (longestIdx < 0) return null;
    return buildDoorData(roomCoords[longestIdx], roomCoords[longestIdx + 1], longestIdx);
}

function isExactSharedEdge(p1: number[], p2: number[], q1: number[], q2: number[], threshold: number): boolean {
    const matchDirect = segmentLength(p1, q1) < threshold && segmentLength(p2, q2) < threshold;
    const matchReverse = segmentLength(p1, q2) < threshold && segmentLength(p2, q1) < threshold;
    return matchDirect || matchReverse;
}

function buildDoorData(p1: number[], p2: number[], segIndex: number): DoorData {
    const [midX, midZ] = segmentMidpoint(p1, p2);
    const angle = segmentAngle(p1, p2);
    return {
        position: new THREE.Vector3(midX, 0, midZ),
        rotation: -angle,
        width: segmentLength(p1, p2),
        segmentIndex: segIndex
    };
}

// ============================================================
// DOOR MESH CREATION
// ============================================================

export function createDoorMesh(doorData: DoorData, wallThickness: number = WALL_THICKNESS): THREE.Group {
    const group = new THREE.Group();
    group.position.copy(doorData.position);
    group.rotation.y = doorData.rotation;

    // Door Slab with pivot-based hinge
    const doorGeometry = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: DOOR_COLOR }); // 0xB4B2AC Light Greige (matching wall tones)
    const door = new THREE.Mesh(doorGeometry, doorMaterial);

    const pivot = new THREE.Group();
    pivot.position.set(-DOOR_WIDTH / 2, 0, 0);
    door.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0);
    pivot.rotation.y = DOOR_OPEN_ANGLE;
    pivot.add(door);
    group.add(pivot);

    // Frame material
    const frameMat = new THREE.MeshStandardMaterial({ color: DOOR_FRAME_COLOR }); // 0x8A877E Exactly matching wall color

    // Left Post
    const postGeo = new THREE.BoxGeometry(0.08, DOOR_HEIGHT, wallThickness + 0.02);
    const leftPost = new THREE.Mesh(postGeo, frameMat);
    leftPost.position.set(-DOOR_WIDTH / 2 - 0.04, DOOR_HEIGHT / 2, 0);
    group.add(leftPost);

    // Right Post
    const rightPost = new THREE.Mesh(postGeo, frameMat);
    rightPost.position.set(DOOR_WIDTH / 2 + 0.04, DOOR_HEIGHT / 2, 0);
    group.add(rightPost);

    // Lintel (Top)
    const topGeo = new THREE.BoxGeometry(DOOR_WIDTH + 0.16, 0.08, wallThickness + 0.02);
    const topPost = new THREE.Mesh(topGeo, frameMat);
    topPost.position.set(0, DOOR_HEIGHT + 0.04, 0);
    group.add(topPost);

    return group;
}
