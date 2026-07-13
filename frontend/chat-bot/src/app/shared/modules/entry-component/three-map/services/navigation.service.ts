import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh, NavNode } from '../models';
import {
    CORRIDOR_KEYWORDS,
    ROOM_TO_ROOM_THRESHOLD,
    CORRIDOR_TO_CORRIDOR_THRESHOLD,
    ROOM_TO_CORRIDOR_THRESHOLD
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    /**
     * Construct navigation graph for pathfinding (Geometry-based fallback)
     */
    constructNavigationGraph(roomMeshes: RoomMesh[], getRoomCenter: (room: RoomMesh) => THREE.Vector3): Map<number, number[]> {
        const navigationGraph = new Map<number, number[]>();

        const isCorridor = (room: RoomMesh) => {
            const name = room.name.toLowerCase();
            return CORRIDOR_KEYWORDS.some(key => name.includes(key));
        };

        roomMeshes.forEach(roomA => {
            const neighbors: number[] = [];
            const centerA = getRoomCenter(roomA);
            const isACorridor = isCorridor(roomA);

            roomMeshes.forEach(roomB => {
                if (roomA.id === roomB.id) return;

                const centerB = getRoomCenter(roomB);
                const dist = centerA.distanceTo(centerB);
                const isBCorridor = isCorridor(roomB);

                if (isACorridor && isBCorridor) {
                    if (dist < CORRIDOR_TO_CORRIDOR_THRESHOLD) neighbors.push(roomB.id);
                } else if (isACorridor || isBCorridor) {
                    if (dist < ROOM_TO_CORRIDOR_THRESHOLD) neighbors.push(roomB.id);
                } else {
                    if (dist < ROOM_TO_ROOM_THRESHOLD) neighbors.push(roomB.id);
                }
            });

            // FALLBACK: Ensure every room has at least one corridor connection if possible
            if (!isACorridor && neighbors.filter(id => isCorridor(roomMeshes.find(r => r.id === id)!)).length === 0) {
                const nearestCorridor = roomMeshes
                    .filter(r => isCorridor(r))
                    .sort((a, b) => centerA.distanceTo(getRoomCenter(a)) - centerA.distanceTo(getRoomCenter(b)))[0];

                if (nearestCorridor) {
                    neighbors.push(nearestCorridor.id);
                }
            }

            navigationGraph.set(roomA.id, neighbors);
        });

        return navigationGraph;
    }

    /**
     * Construct navigation graph from explicit NavNodes
     */
    constructNodeGraph(nodes: NavNode[]): Map<number, number[]> {
        const navigationGraph = new Map<number, number[]>();
        nodes.forEach(node => {
            const neighbors = (node.links ?? [])
                .map((l: any) => l.link_node_id ?? l.linkNodeId)
                .filter((id: any) => id !== undefined && id !== null)
                .map((id: any) => Number(id));
            navigationGraph.set(node.id, neighbors);
        });
        return navigationGraph;
    }

    /**
     * Find shortest path using Dijkstra's algorithm (Room-based fallback)
     */
    findShortestPath(
        startId: number,
        endId: number,
        roomMeshes: RoomMesh[],
        navigationGraph: Map<number, number[]>,
        getRoomCenter: (room: RoomMesh) => THREE.Vector3
    ): number[] | null {
        const distances: Map<number, number> = new Map();
        const previous: Map<number, number | null> = new Map();
        const nodes = new Set<number>();

        roomMeshes.forEach(room => {
            distances.set(room.id, Infinity);
            previous.set(room.id, null);
            nodes.add(room.id);
        });

        distances.set(startId, 0);

        while (nodes.size > 0) {
            let closestNode: number | null = null;
            nodes.forEach(node => {
                if (closestNode === null || (distances.get(node) ?? Infinity) < (distances.get(closestNode) ?? Infinity)) {
                    closestNode = node;
                }
            });

            if (closestNode === null || distances.get(closestNode) === Infinity) break;
            if (closestNode === endId) {
                const path: number[] = [];
                let curr: number | null = closestNode;
                while (curr !== null) {
                    path.unshift(curr);
                    curr = previous.get(curr) ?? null;
                }
                return path;
            }

            nodes.delete(closestNode);

            const neighbors = navigationGraph.get(closestNode) || [];
            neighbors.forEach(neighborId => {
                if (!nodes.has(neighborId)) return;

                const roomA = roomMeshes.find(r => r.id === closestNode);
                const roomB = roomMeshes.find(r => r.id === neighborId);
                if (!roomA || !roomB) return;

                const dist = getRoomCenter(roomA).distanceTo(getRoomCenter(roomB));
                const newDist = (distances.get(closestNode!) ?? Infinity) + dist;

                if (newDist < (distances.get(neighborId) ?? Infinity)) {
                    distances.set(neighborId, newDist);
                    previous.set(neighborId, closestNode);
                }
            });
        }

        return null;
    }

    /**
     * Find shortest path between explicit NavNodes
     */
    findShortestNodePath(
        startNodeId: number,
        endNodeId: number,
        nodes: NavNode[],
        navigationGraph: Map<number, number[]>
    ): number[] | null {
        const distances: Map<number, number> = new Map();
        const previous: Map<number, number | null> = new Map();
        const unvisited = new Set<number>();

        nodes.forEach(node => {
            distances.set(node.id, Infinity);
            previous.set(node.id, null);
            unvisited.add(node.id);
        });

        distances.set(startNodeId, 0);

        while (unvisited.size > 0) {
            let closestNodeId: number | null = null;
            unvisited.forEach(id => {
                if (closestNodeId === null || (distances.get(id) ?? Infinity) < (distances.get(closestNodeId) ?? Infinity)) {
                    closestNodeId = id;
                }
            });

            if (closestNodeId === null || distances.get(closestNodeId) === Infinity) break;
            if (closestNodeId === endNodeId) {
                const path: number[] = [];
                let curr: number | null = closestNodeId;
                while (curr !== null) {
                    path.unshift(curr);
                    curr = previous.get(curr) ?? null;
                }
                return path;
            }

            unvisited.delete(closestNodeId);

            const neighbors = navigationGraph.get(closestNodeId) || [];
            neighbors.forEach(neighborId => {
                if (!unvisited.has(neighborId)) return;

                const nodeA = nodes.find(n => n.id === closestNodeId);
                const nodeB = nodes.find(n => n.id === neighborId);
                if (!nodeA || !nodeB) return;

                // Simple cartesian distance since they are already coordinate nodes
                const dist = Math.sqrt(Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2));
                const newDist = (distances.get(closestNodeId!) ?? Infinity) + dist;

                if (newDist < (distances.get(neighborId) ?? Infinity)) {
                    distances.set(neighborId, newDist);
                    previous.set(neighborId, closestNodeId);
                }
            });
        }

        return null;
    }
}
