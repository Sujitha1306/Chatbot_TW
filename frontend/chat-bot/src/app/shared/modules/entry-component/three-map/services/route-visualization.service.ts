import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { RoomMesh, NavNode } from '../models';
import {
    ROUTE_PATH_COLOR,
    ROUTE_RIBBON_WIDTH,
    ROUTE_RIBBON_Y,
    ROUTE_RIBBON_SAMPLES,
    ROUTE_CORNER_RADIUS,
    PERSON_BASE_MOVE_SPEED,
    PERSON_MIN_MOVE_SPEED,
    PERSON_MAX_MOVE_SPEED,
    PERSON_MOVE_SPEED_REFERENCE_DISTANCE,
    GRAPH_LINK_COLOR,
    GRAPH_NODE_NN_COLOR,
    GRAPH_NODE_RN_COLOR,
    GRAPH_NODE_RADIUS,
    GRAPH_NODE_SEGMENTS
} from '../constants/map.constants';

@Injectable({
    providedIn: 'root'
})
export class RouteVisualizationService {

    /**
     * Visualize route as a flat ribbon lying on the floor.
     */
    visualizeRoute(
        pathPoints: THREE.Vector3[],
        parent: THREE.Scene | THREE.Group,
        customWidth?: number
    ): {
        routeGroup: THREE.Group;
        pathPoints: THREE.Vector3[];
        moveSpeed: number;
        totalDistance: number;
    } {
        const routeGroup = new THREE.Group();
        routeGroup.name = 'NavigationRoute';

        let totalDistance = 0;
        for (let i = 0; i < pathPoints.length - 1; i++) {
            totalDistance += pathPoints[i].distanceTo(pathPoints[i + 1]);
        }

        let moveSpeed = PERSON_BASE_MOVE_SPEED;
        if (totalDistance > 0) {
            moveSpeed = (PERSON_BASE_MOVE_SPEED * PERSON_MOVE_SPEED_REFERENCE_DISTANCE) / totalDistance;
            moveSpeed = Math.max(PERSON_MIN_MOVE_SPEED, Math.min(PERSON_MAX_MOVE_SPEED, moveSpeed));
        }

        console.log(`Path Distance: ${totalDistance.toFixed(2)}, Dynamic Speed: ${moveSpeed.toFixed(3)}`);

        if (pathPoints.length >= 2) {
            const smoothed = pathPoints.length >= 3
                ? this.smoothCornerPoints(pathPoints, ROUTE_CORNER_RADIUS)
                : pathPoints;
            const curve = new THREE.CatmullRomCurve3(smoothed);
            curve.curveType = 'centripetal';

            // Dense sample set → smooth corners without angular artefacts
            const sampled = curve.getPoints(ROUTE_RIBBON_SAMPLES);

            const ribbonWidth = customWidth ?? ROUTE_RIBBON_WIDTH;
            const geometry = this.buildRibbonGeometry(sampled, ribbonWidth, ROUTE_RIBBON_Y);
            const material = new THREE.MeshStandardMaterial({
                color: ROUTE_PATH_COLOR,
                transparent: true,
                opacity: 0.92,
                roughness: 0.6,
                metalness: 0.0,
                side: THREE.DoubleSide,
                depthWrite: false,
                // Always render on top of floor polygon layers
                depthTest: false
            });

            const mesh = new THREE.Mesh(geometry, material);
            // Render after all floor meshes (default renderOrder = 0) so the
            // ribbon is never occluded by room polygons in the depth pass.
            routeGroup.renderOrder = 10;
            mesh.renderOrder = 10;
            routeGroup.add(mesh);
            parent.add(routeGroup);
        }

        return { routeGroup, pathPoints, moveSpeed, totalDistance };
    }

    /**
     * Replace each sharp corner in `pts` with an entry + exit pair spaced
     * `cornerRadius` units from the corner vertex, then let CatmullRom
     * interpolate a smooth arc through the gap.
     */
    private smoothCornerPoints(pts: THREE.Vector3[], cornerRadius: number): THREE.Vector3[] {
        if (pts.length < 3) return pts;
        const out: THREE.Vector3[] = [pts[0].clone()];

        for (let i = 1; i < pts.length - 1; i++) {
            const A = pts[i - 1];
            const B = pts[i];
            const C = pts[i + 1];

            const lenAB = A.distanceTo(B);
            const lenBC = B.distanceTo(C);
            const r = Math.min(cornerRadius, lenAB * 0.4, lenBC * 0.4);

            const dirAB = new THREE.Vector3().subVectors(B, A).normalize();
            const dirBC = new THREE.Vector3().subVectors(C, B).normalize();

            // dot ≈ 1 → straight; dot ≈ 0 → 90° turn; dot < 0 → obtuse
            if (dirAB.dot(dirBC) > 0.98) {
                out.push(B.clone());
            } else {
                // entry: r units back from B along incoming direction
                out.push(new THREE.Vector3(
                    B.x - dirAB.x * r,
                    B.y - dirAB.y * r,
                    B.z - dirAB.z * r
                ));
                // exit: r units forward from B along outgoing direction
                out.push(new THREE.Vector3(
                    B.x + dirBC.x * r,
                    B.y + dirBC.y * r,
                    B.z + dirBC.z * r
                ));
            }
        }

        out.push(pts[pts.length - 1].clone());
        return out;
    }

    /**
     * Build a flat ribbon BufferGeometry along sampled curve points.
     * The ribbon lies flat (XZ plane) at the Y of each sampled point + yOffset.
     */
    private buildRibbonGeometry(
        pts: Array<{ x: number; y: number; z: number }>,
        width: number,
        yOffset: number
    ) {
        const n = pts.length;
        const positions = new Float32Array(n * 2 * 3);
        const indices: number[] = [];
        const half = width * 0.5;

        for (let i = 0; i < n; i++) {
            const cur = pts[i];
            const y = cur.y + yOffset;

            // Central-difference tangent (XZ only) for stable perpendicular at every point
            const prev = pts[Math.max(0, i - 1)];
            const next = pts[Math.min(n - 1, i + 1)];
            const tx = next.x - prev.x;
            const tz = next.z - prev.z;
            const len = Math.sqrt(tx * tx + tz * tz) || 1;

            // 90° rotation of tangent in XZ plane → perpendicular direction
            const px = -tz / len;
            const pz = tx / len;

            const base = i * 6;
            // Left edge
            positions[base + 0] = cur.x - px * half;
            positions[base + 1] = y;
            positions[base + 2] = cur.z - pz * half;
            // Right edge
            positions[base + 3] = cur.x + px * half;
            positions[base + 4] = y;
            positions[base + 5] = cur.z + pz * half;

            if (i < n - 1) {
                const v = i * 2;
                indices.push(v, v + 2, v + 1);
                indices.push(v + 1, v + 2, v + 3);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }

    /**
     * Visualize the entire navigation graph using volumetric segments.
     * @param parent  The group to attach to — pass buildingGroup so geo-alignment transforms apply.
     * @param xOffset Floor centroid X (baseFloorCenter.x) — subtracted from node.x to centre in local space.
     * @param zOffset Floor centroid Z (baseFloorCenter.y) — subtracted from node.y to centre in local space.
     */
    visualizeGraph(
        nodes: NavNode[],
        parent: THREE.Object3D,
        yOffset: number = 0,
        xOffset: number = 0,
        zOffset: number = 0
    ): THREE.Group {
        const graphGroup = new THREE.Group();
        graphGroup.name = 'NavigationGraph';

        const linkMaterial = new THREE.MeshStandardMaterial({
            color: GRAPH_LINK_COLOR,
            transparent: true,
            opacity: 0.7,
            roughness: 0.5
        });

        const nnMaterial = new THREE.MeshStandardMaterial({
            color: GRAPH_NODE_NN_COLOR,
            transparent: true,
            opacity: 0.9,
            roughness: 0.4
        });

        const rnMaterial = new THREE.MeshStandardMaterial({
            color: GRAPH_NODE_RN_COLOR,
            emissive: GRAPH_NODE_RN_COLOR,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.95,
            roughness: 0.3
        });

        const baseCylinder = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
        const nodeSphere = new THREE.SphereGeometry(GRAPH_NODE_RADIUS, GRAPH_NODE_SEGMENTS, GRAPH_NODE_SEGMENTS);
        const seenLinks = new Set<string>();
        const graphLineY = yOffset + 0.4;

        nodes.forEach(node => {
            if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

            const start = new THREE.Vector3(node.x - xOffset, graphLineY, node.y - zOffset);

            // Render node sphere with color based on type
            const isRoomNode = node.type === 'NT-RN';
            const nodePoint = new THREE.Mesh(nodeSphere, isRoomNode ? rnMaterial : nnMaterial);
            nodePoint.position.copy(start);
            graphGroup.add(nodePoint);

            node.links.forEach(link => {
                if (!link || !link.link_node_id) return;

                const linkId = [node.id, link.link_node_id].sort().join('-');
                if (seenLinks.has(linkId)) return;
                seenLinks.add(linkId);

                const targetNode = nodes.find(n => n.id === link.link_node_id);
                if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
                    const end = new THREE.Vector3(targetNode.x - xOffset, graphLineY, targetNode.y - zOffset);

                    const segment = new THREE.Mesh(baseCylinder, linkMaterial);
                    const distance = start.distanceTo(end);
                    segment.scale.set(1, distance, 1);

                    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                    segment.position.copy(midPoint);

                    segment.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        new THREE.Vector3().subVectors(end, start).normalize()
                    );

                    graphGroup.add(segment);
                }
            });
        });

        // Add to parent (buildingGroup) so geo-alignment rotation/scale/position is inherited.
        parent.add(graphGroup);
        graphGroup.visible = false;
        return graphGroup;
    }
}
