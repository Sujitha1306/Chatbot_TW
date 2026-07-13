import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { LocationData, RoomMesh } from '../models';
import { shrinkPolygon, parseColor, createLabel, createLabelIconSprite, createFloorMesh, createExtrudedFloorMesh, createWallsFromCoordinates, getTileGrid, latLonToMeters } from '../helpers';
import {
    POLYGON_SHRINK_OFFSET,
    FLOOR_IMAGE_OPACITY,
    FLOOR_3D_EXTRUDE_HEIGHT,
    BUILDING_LATITUDE,
    BUILDING_LONGITUDE,
    OSM_ZOOM_LEVEL,
    WALL_THICKNESS,
    LABEL_HEIGHT,
    CORRIDOR_KEYWORDS
} from '../constants/map.constants';
import { createDoorMesh, findDoorPosition, findDoorOnLongestWall } from '../helpers/door.factory';
import { WallGap } from '../helpers/room.factory';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FloorPlanService {

    /**
     * Build floor plan from location data and return room meshes
     */
    buildFloorPlan(
        floorData: LocationData,
        parent: THREE.Object3D,
        xOffset: number = 0,
        zOffset: number = 0,
        yOffset: number = 0,
        includeFloorImage: boolean = true,
        isMainBuilding: boolean = true,
        includeSurroundings: boolean = true,
        foundationColor: string = '#f5f5f5',
        wallWidth: number = WALL_THICKNESS,
        labelHeight: number = LABEL_HEIGHT,
        labelScale: number = 1.0,
        showCorridorWalls: boolean = true,
        mapConfig: { skipLocByCat: string[], skipLocCatByCat: string[], skipLocNameByCat?: string[], threeDFloorByCat?: string[], buildingLat?: number, buildingLng?: number, categoryColors?: { [catId: string]: string }, categoryIcons?: { [catId: string]: string }, mapTileType?: string } = { skipLocByCat: [], skipLocCatByCat: [] }
    ): {

        roomMeshes: RoomMesh[];
        floorSize: number;
        floorWidth: number;
        floorHeight: number;
        center: [number, number];
        rawCenter: [number, number];
        hasGeoAlign: boolean;
        floorImageMesh: THREE.Mesh | null;
        surroundingsMesh: THREE.Object3D | null;
        foundationMesh: THREE.Mesh | null;
        doorMeshes: THREE.Group[];
        geoRotationY: number;
        geoCenterX: number;
        geoCenterZ: number;
        geoScaleX: number;
        geoScaleZ: number;
    } {
        const allCoords: number[][] = [];
        const roomMeshes: RoomMesh[] = [];
        const doorMeshes: THREE.Group[] = [];

        const collectCoords = (loc: LocationData) => {
            if (loc.coordinates) {
                try {
                    const data = JSON.parse(loc.coordinates);
                    const coords = this.normalizeCoordinates(data.geometry.coordinates);
                    allCoords.push(...coords);
                } catch (e) { }
            }
            if (loc.children) loc.children.forEach(collectCoords);
        };

        collectCoords(floorData);

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        allCoords.forEach(([x, z]) => {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        });

        const center: [number, number] = [(minX + maxX) / 2, (minZ + maxZ) / 2];

        // Override width and height from aspects if available
        let floorWidth = maxX - minX;
        let floorHeight = maxZ - minZ;

        if (floorData.aspects) {
            try {
                // aspects comes as a string representation of an array, e.g., "[225, 216]"
                const aspectsArr = JSON.parse(floorData.aspects);
                if (Array.isArray(aspectsArr) && aspectsArr.length >= 2) {
                    floorWidth = aspectsArr[0];
                    floorHeight = aspectsArr[1];
                }
            } catch (e) {
                console.warn('Error parsing aspects for floor:', floorData.id, e);
            }
        }

        // Extract geographic polygon; compute geo center and rotation for group-level transform
        let floorGeoPolygon: number[][] | undefined;
        let geoCenterX = 0, geoCenterZ = 0;
        let geoRotationY = 0;
        let geoScaleX = 1, geoScaleZ = 1;
        let hasGeoAlign = false;
        if (isMainBuilding && floorData.coordinates) {
            try {
                const gd = JSON.parse(floorData.coordinates);
                const pts = this.normalizeCoordinates(gd.geometry.coordinates);
                if (pts.length >= 3) {
                    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
                    const spanX = Math.max(...xs) - Math.min(...xs);
                    const spanY = Math.max(...ys) - Math.min(...ys);
                    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
                    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
                    if (cx >= -180 && cx <= 180 && cy >= -90 && cy <= 90 && spanX > 0 && spanX < 1.0 && spanY > 0 && spanY < 1.0) {
                        hasGeoAlign = true;
                        floorGeoPolygon = pts;
                        const anchorLat = mapConfig.buildingLat ?? BUILDING_LATITUDE;
                        const anchorLng = mapConfig.buildingLng ?? BUILDING_LONGITUDE;
                        const [anchorX, anchorY] = latLonToMeters(anchorLat, anchorLng);
                        const scenePoints = floorGeoPolygon.map(pt => {
                            const [ptX, ptY] = latLonToMeters(pt[1], pt[0]);
                            return { x: ptX - anchorX, z: anchorY - ptY };
                        });
                        // Geo polygon center — used to position the buildingGroup via group.position
                        geoCenterX = (Math.min(...scenePoints.map(p => p.x)) + Math.max(...scenePoints.map(p => p.x))) / 2;
                        geoCenterZ = (Math.min(...scenePoints.map(p => p.z)) + Math.max(...scenePoints.map(p => p.z))) / 2;
                        // Rotation from polygon's longest edge: aligns floor plan +X with building primary axis
                        let longestLen = 0;
                        for (let i = 0; i < floorGeoPolygon.length - 1; i++) {
                            const [p0X, p0Y] = latLonToMeters(floorGeoPolygon[i][1], floorGeoPolygon[i][0]);
                            const [p1X, p1Y] = latLonToMeters(floorGeoPolygon[i + 1][1], floorGeoPolygon[i + 1][0]);
                            const edgeLen = Math.sqrt((p1X - p0X) ** 2 + (p1Y - p0Y) ** 2);
                            if (edgeLen > longestLen) {
                                longestLen = edgeLen;
                                geoRotationY = Math.atan2(p1Y - p0Y, p1X - p0X);
                            }
                        }
                        // Project geo polygon into building-group local axes and compute scale to fit exactly
                        const cosA = Math.cos(geoRotationY);
                        const sinA = Math.sin(geoRotationY);
                        let minLx = Infinity, maxLx = -Infinity, minLz = Infinity, maxLz = -Infinity;
                        for (const pt of scenePoints) {
                            const relX = pt.x - geoCenterX;
                            const relZ = pt.z - geoCenterZ;
                            const lx = relX * cosA - relZ * sinA;
                            const lz = relX * sinA + relZ * cosA;
                            if (lx < minLx) minLx = lx;
                            if (lx > maxLx) maxLx = lx;
                            if (lz < minLz) minLz = lz;
                            if (lz > maxLz) maxLz = lz;
                        }
                        geoScaleX = floorWidth > 0 ? (maxLx - minLx) / floorWidth : 1;
                        geoScaleZ = floorHeight > 0 ? (maxLz - minLz) / floorHeight : 1;
                    }
                }
            } catch (e) {}
        }

        // When geo-aligned: center rooms at local origin so buildingGroup rotation/position work correctly.
        // buildingGroup.position will be set to geoCenterX/Z by the component.
        // When not geo-aligned: keep original xOffset/zOffset (no change to existing behaviour).
        const adjustedXOffset = hasGeoAlign ? (xOffset - center[0]) : xOffset;
        const adjustedZOffset = hasGeoAlign ? (zOffset - center[1]) : zOffset;

        if (floorData.children && floorData.children.length > 0) {
            // Collect ALL child polygon coordinates with metadata
            const allPolygons: { coords: number[][], isCorridor: boolean }[] = [];

            floorData.children.forEach(c => {
                if (c.coordinates) {
                    try {
                        const data = JSON.parse(c.coordinates);
                        const coords = this.normalizeCoordinates(data.geometry.coordinates);
                        const isCorridor = c.name.toLowerCase().includes('corridor') || c.name.toLowerCase().includes('lobby');
                        allPolygons.push({ coords, isCorridor });
                    } catch (e) {
                        console.error('Error parsing coords:', e);
                    }
                }
            });

            // Sort so we check Corridors FIRST
            allPolygons.sort((a, b) => (a.isCorridor === b.isCorridor) ? 0 : a.isCorridor ? -1 : 1);

            floorData.children.forEach(child => {
                const childDoors = this.processLocation(child, parent, roomMeshes, adjustedXOffset, adjustedZOffset, yOffset, allPolygons, wallWidth, labelHeight, labelScale, showCorridorWalls, mapConfig);
                doorMeshes.push(...childDoors);
            });
        }

        const maxDim = Math.max(floorWidth, floorHeight);

        // Calculate image center: use aspects if available for absolute alignment,
        // fallback to coordinate bounding box center.
        let imageCenterX = center[0];
        let imageCenterZ = center[1];

        if (floorData.aspects) {
            imageCenterX = floorWidth / 2;
            imageCenterZ = floorHeight / 2;
        }

        const floorImageMesh = includeFloorImage
            ? this.createFloorImage(imageCenterX, imageCenterZ, floorWidth, floorHeight, parent, adjustedXOffset, adjustedZOffset, yOffset, floorData.id)
            : null;

        const surroundingsMesh = (isMainBuilding && includeSurroundings)
            ? this.createSurroundingsMap(parent, yOffset, mapConfig.buildingLat, mapConfig.buildingLng, floorGeoPolygon, mapConfig.mapTileType ?? 'osm')
            : null;

        // Create an opaque foundation to mask OSM streets under the building (only for base floor)
        const foundationMesh = (isMainBuilding)
            ? this.createFoundation(imageCenterX, imageCenterZ, floorWidth, floorHeight, parent, adjustedXOffset, adjustedZOffset, yOffset, foundationColor)
            : null;

        return {
            roomMeshes,
            floorSize: maxDim,
            floorWidth: floorWidth,
            floorHeight: floorHeight,
            // When geo-aligned the world center is the geo polygon center (used for env decoration placement).
            // When not geo-aligned the world center is the local bounding-box center.
            center: hasGeoAlign ? [geoCenterX, geoCenterZ] as [number, number] : center,
            rawCenter: center,
            hasGeoAlign,
            floorImageMesh,
            surroundingsMesh,
            foundationMesh,
            doorMeshes,
            geoRotationY,
            geoCenterX,
            geoCenterZ,
            geoScaleX,
            geoScaleZ
        };
    }

    private processLocation(location: LocationData, parent: THREE.Object3D, roomMeshes: RoomMesh[], xOffset: number = 0, zOffset: number = 0, yOffset: number = 0, neighborPolygons: { coords: number[][], isCorridor: boolean }[] = [], wallWidth: number = WALL_THICKNESS, labelHeight: number = LABEL_HEIGHT, labelScale: number = 1.0, showCorridorWalls: boolean = true, mapConfig: { skipLocByCat: string[], skipLocCatByCat: string[], skipLocNameByCat?: string[], threeDFloorByCat?: string[], categoryColors?: { [catId: string]: string }, categoryIcons?: { [catId: string]: string } } = { skipLocByCat: [], skipLocCatByCat: [] }): any[] {
        const locCatId = location.locationCategoryId ?? '';
        if (mapConfig.skipLocByCat.includes(locCatId)) return [];
        if (!location.coordinates) return [];
        const skipIcon = mapConfig.skipLocCatByCat.includes(locCatId);
        const skipName = (mapConfig.skipLocNameByCat ?? []).includes(locCatId);
        const is3DFloor = (mapConfig.threeDFloorByCat ?? []).includes(locCatId);
        const collectedDoors: THREE.Group[] = [];

        try {
            const coordData = JSON.parse(location.coordinates);
            let rawCoordinates = this.normalizeCoordinates(coordData.geometry.coordinates);
            let coordinates = shrinkPolygon(rawCoordinates, POLYGON_SHRINK_OFFSET);

            let color = parseColor(location.polygonStyle);
            let floorOpacity: number | undefined;
            if (location.labelStyle) {
                try {
                    const ls = typeof location.labelStyle === 'string' ? JSON.parse(location.labelStyle) : location.labelStyle;
                    const poly = ls?.polygon;
                    if (poly) {
                        // if (poly.fillColor) color = parseColor(poly.fillColor);
                        if (typeof poly.fillOpacity === 'number') floorOpacity = poly.fillOpacity;
                    }
                } catch (e) { }
            }
            const floor = is3DFloor
                ? createExtrudedFloorMesh(coordinates, color)
                : createFloorMesh(coordinates, color, floorOpacity);

            if (floor) {
                const wallsGroup = new THREE.Group();
                wallsGroup.name = 'walls';

                const gaps: WallGap[] = [];

                // Door Logic
                // Universal Door Logic: Check against ALL neighbors, prioritizing corridors
                const isCorridor = CORRIDOR_KEYWORDS.some(keyword => location.name.toLowerCase().includes(keyword));

                if (!is3DFloor && neighborPolygons.length > 0 && !isCorridor) {
                    let doorFound = false;
                    for (const neighbor of neighborPolygons) {
                        const doorData = findDoorPosition(rawCoordinates, neighbor.coords);
                        if (doorData) {
                            gaps.push({
                                segmentIndex: doorData.segmentIndex,
                                center: doorData.position,
                                width: 0.9
                            });
                            const doorMesh = createDoorMesh(doorData, wallWidth);
                            doorMesh.position.y += yOffset;
                            doorMesh.position.x += xOffset;
                            doorMesh.position.z += zOffset;
                            parent.add(doorMesh);
                            collectedDoors.push(doorMesh);
                            doorFound = true;
                            break;
                        }
                    }

                    // Fallback: If NO neighbor matched, place door on the longest wall
                    if (!doorFound) {
                        const fallbackDoor = findDoorOnLongestWall(rawCoordinates);
                        if (fallbackDoor) {
                            gaps.push({
                                segmentIndex: fallbackDoor.segmentIndex,
                                center: fallbackDoor.position,
                                width: 0.9
                            });
                            const doorMesh = createDoorMesh(fallbackDoor, wallWidth);
                            doorMesh.position.y += yOffset;
                            doorMesh.position.x += xOffset;
                            doorMesh.position.z += zOffset;
                            parent.add(doorMesh);
                            collectedDoors.push(doorMesh);
                        }
                    }
                }

                let walls: THREE.Mesh[] = [];
                if (!is3DFloor && (showCorridorWalls || !isCorridor)) {
                    walls = createWallsFromCoordinates(coordinates, gaps, wallWidth);
                }

                roomMeshes.push({
                    id: location.id,
                    name: location.name,
                    floor: floor,
                    walls: walls,
                    originalColor: color,
                    data: location,
                    label: undefined,
                    labelIcon: undefined
                });

                floor.position.x += xOffset;
                floor.position.z += zOffset;
                floor.position.y += yOffset;
                walls.forEach(wall => {
                    wall.position.x += xOffset;
                    wall.position.z += zOffset;
                    wall.position.y += yOffset;
                    parent.add(wall);
                });
                parent.add(floor);

                const box = new THREE.Box3().setFromObject(floor);
                const centerVec = new THREE.Vector3();
                box.getCenter(centerVec);

                // For 3D extruded rooms the top face is at FLOOR_3D_EXTRUDE_HEIGHT above ground,
                // so labels and icons must be lifted above it.
                const textY = (is3DFloor ? FLOOR_3D_EXTRUDE_HEIGHT + labelHeight : labelHeight) + yOffset;
                const iconSize = 2.2;
                const iconY = textY; // same height as the combined label sprite

                // Place text on whichever side of the room centroid has more horizontal space.
                const textSide: 'right' | 'left' = (box.max.x - centerVec.x) >= (centerVec.x - box.min.x) ? 'right' : 'left';

                const label = createLabel(skipName ? '' : location.name, centerVec.x, centerVec.z, parent, skipIcon ? null : (location.locationCategoryId ?? null), textY, labelScale, location.disLocLevel ?? null, mapConfig.categoryColors, mapConfig.categoryIcons, textSide);
                roomMeshes[roomMeshes.length - 1].label = label;
                label.visible = false;

                if (!skipIcon) {
                    const labelIcon = createLabelIconSprite(
                        location.locationCategoryId ?? null,
                        centerVec.x,
                        iconY,
                        centerVec.z,
                        parent,
                        iconSize,
                        location.disLocLevel ?? null,
                        mapConfig.categoryColors,
                        mapConfig.categoryIcons
                    );
                    roomMeshes[roomMeshes.length - 1].labelIcon = labelIcon;
                    labelIcon.visible = false;
                }
            }

            if (location.children && location.children.length > 0) {
                location.children.forEach(child => {
                    const childDoors = this.processLocation(child, parent, roomMeshes, xOffset, zOffset, yOffset, [], wallWidth, labelHeight, labelScale, showCorridorWalls, mapConfig);
                    collectedDoors.push(...childDoors);
                });
            }
        } catch (error) {
            console.error(`Error processing location ${location.name}:`, error);
        }
        return collectedDoors;
    }

    private createFloorImage(
        x: number,
        z: number,
        width: number,
        height: number,
        parent: THREE.Object3D,
        xOffset: number = 0,
        zOffset: number = 0,
        yOffset: number = 0,
        floorId?: number
    ): THREE.Mesh {
        const loader = new THREE.TextureLoader();
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: FLOOR_IMAGE_OPACITY,
            alphaTest: 0.01
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'floorplan-image';
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x + xOffset, yOffset + 0.05, z + zOffset);
        parent.add(mesh);

        // Dynamic URL based on floorId
        const url = floorId
            ? `${environment.api_base_url_new}api/location/get-location-image/${floorId}?t=${Date.now()}`
            : 'assets/three-js/floor-plan.jpg';

        loader.load(url, (texture) => {
            material.map = texture;
            material.needsUpdate = true;
        });

        return mesh;
    }

    private createFoundation(x: number, z: number, width: number, height: number, parent: THREE.Object3D, xOffset: number = 0, zOffset: number = 0, yOffset: number = 0, color: string = '#f5f5f5'): THREE.Mesh {
        const geometry = new THREE.PlaneGeometry(width + 3.0, height + 3.0); // Larger expansion for clear visibility
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide // Only visible from top
        });

        // Use DoubleSide to ensure it masks correctly regardless of camera angle
        material.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'building-foundation-mask';
        mesh.rotation.x = -Math.PI / 2;

        // Positioned slightly below floors (yOffset) but above OSM map (-0.2)
        mesh.position.set(x + xOffset, yOffset, z + zOffset);
        parent.add(mesh);

        return mesh;
    }

    private createSurroundingsMap(parent: any, yOffset: number, lat: number = BUILDING_LATITUDE, lng: number = BUILDING_LONGITUDE, geoPolygon?: number[][], tileType: string = 'google_road'): any {
        const surroundingsGroup = new THREE.Group();
        surroundingsGroup.name = 'osm-surroundings-group';
        // NOT added to parent here — caller adds directly to scene so buildingGroup rotation doesn't affect OSM tiles

        const tiles = getTileGrid(lat, lng, OSM_ZOOM_LEVEL, tileType);
        const [buildingX, buildingY] = latLonToMeters(lat, lng);

        const loader = new THREE.TextureLoader();

        tiles.forEach(tile => {
            const geometry = new THREE.PlaneGeometry(tile.bounds.width, tile.bounds.height);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `osm-tile-${tile.x}-${tile.y}`;
            mesh.rotation.x = -Math.PI / 2;

            const posX = tile.bounds.centerX - buildingX;
            const posZ = buildingY - tile.bounds.centerY;

            mesh.position.set(posX, yOffset - 0.5, posZ);
            surroundingsGroup.add(mesh);

            loader.load(tile.url, (texture) => {
                texture.anisotropy = 16;
                material.map = texture;
                material.needsUpdate = true;
            });
        });

        // Draw floor geographic polygon on the OSM plane
        if (geoPolygon && geoPolygon.length >= 3) {
            // GeoJSON format is [longitude, latitude]
            const scenePoints = geoPolygon.map(pt => {
                const [ptX, ptY] = latLonToMeters(pt[1], pt[0]);
                return new THREE.Vector3(ptX - buildingX, yOffset - 0.1, buildingY - ptY);
            });

            // Outline — close the loop back to start
            const outlinePoints = [...scenePoints, scenePoints[0].clone()];
            const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePoints);
            const outlineMat = new THREE.LineBasicMaterial({ color: 0xff3300, linewidth: 2, depthTest: false });
            const outline = new THREE.Line(outlineGeo, outlineMat);
            outline.name = 'floor-geo-polygon-outline';
            surroundingsGroup.add(outline);

            // Semi-transparent fill — shape is in XY plane, rotate to lie flat in XZ
            // After rotation.x = -PI/2: shapeX→worldX, shapeY→world(-Z)
            const shape = new THREE.Shape();
            shape.moveTo(scenePoints[0].x, -scenePoints[0].z);
            for (let i = 1; i < scenePoints.length; i++) {
                shape.lineTo(scenePoints[i].x, -scenePoints[i].z);
            }
            shape.closePath();

            const fillGeo = new THREE.ShapeGeometry(shape);
            const fillMat = new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const fill = new THREE.Mesh(fillGeo, fillMat);
            fill.rotation.x = -Math.PI / 2;
            fill.position.y = yOffset - 0.15;
            fill.name = 'floor-geo-polygon-fill';
            surroundingsGroup.add(fill);
        }

        return surroundingsGroup;
    }

    getRoomCenter(room: RoomMesh): THREE.Vector3 {
        const box = new THREE.Box3().setFromObject(room.floor);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }

    private normalizeCoordinates(coords: any): number[][] {
        if (!Array.isArray(coords) || coords.length === 0) return [];
        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            return coords[0];
        }
        return coords;
    }
}
