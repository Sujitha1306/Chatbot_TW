/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
******************************************************************************/

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import * as html2canvas from 'html2canvas';
import { MatDialog } from '@angular/material/dialog';
import { StyleLoaderService } from '../../../services/style-loader.service ';
import { HospitalService } from '../../../services/hospital.service';
import { AppToastService } from '../../../services/toaster.service';
import { environment } from '../../../../../environments/environment';
import { MapCropResultDialogComponent } from './map-crop-result-dialog.component';

interface ShapePoint { lat: number; lng: number; }

interface ShapeInfo {
  type: string;
  latlngs: ShapePoint[];
  pointCount: number;
  dimensions: { length: number; width: number };
  area: number;
  perimeter: number;
  radius: number | null;
}

interface AdditionalShape {
  id: number;
  label: string;
  type: string;
  layer: any;
  geometry: any;
}

const LATLNG_RE = /^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/;
const DEFAULT_MAP_CENTER: L.LatLngTuple = [13.0827, 80.2707]; // Chennai, Tamil Nadu
const DEFAULT_MAP_ZOOM = 12;
// Fixed zoom used to project/unproject the floor's aspect space onto the map.
// Must NOT be map.getMaxZoom() — that value depends on which layers are
// currently attached (it drops to Infinity once the OSM tile layer, the only
// layer with a maxZoom, is removed in Floor Plan mode), which would silently
// break the projection math for any shape drawn after the floor image loads.
const FLOOR_PROJECTION_ZOOM = 19;

@Component({
  selector: 'app-map-crop',
  templateUrl: './map-crop.component.html',
  styleUrls: ['./map-crop.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapCropComponent implements OnInit, AfterViewInit, OnDestroy {

  private map: L.Map;
  private drawnItems: L.FeatureGroup;
  private currentLayer: any = null;
  private baseMapLayer: L.TileLayer | null = null;
  private floorImageLayer: L.ImageOverlay | null = null;

  viewMode: 'map' | 'floor' = 'map';
  isSettingsOpen = false;
  searchQuery   = '';
  blockList: any[] = [];
  floorList: any[] = [];
  selectedBlockId: number | null = null;
  selectedFloorId: number | null = null;
  isLoadingBlocks = false;
  isLoadingFloors = false;
  isSearching   = false;
  showResults   = false;
  searchResults: any[] = [];
  isCapturing   = false;
  shapeInfo: ShapeInfo | null = null;
  drawHint: string | null = null;

  // ── Additional coordinates (Map View only) ─────────────────────
  additionalShapes: AdditionalShape[] = [];
  pendingShapeType: string | null = null;
  pendingShapeLayer: any = null;
  shapeLabelInput = '';
  readonly shapeLabelPresets = ['wall', 'door', 'window', 'obstacle'];
  additionalCoordinatesJson: string | null = null;
  isSavingCoordinates = false;
  private shapeIdSeq = 0;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly styleLoader: StyleLoaderService,
    private readonly dialog: MatDialog,
    private readonly hospitalService: HospitalService,
    private readonly toastr: AppToastService
  ) {}

  ngOnInit(): void {
    this.styleLoader.loadStyleByType('leaflet');
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  // ── Close search results on outside click ────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const overlay = document.querySelector('.mc-search-overlay');
    if (overlay && !overlay.contains(event.target as Node) && this.showResults) {
      this.showResults = false;
    }

    const settingsControl = document.querySelector('.mc-settings-control');
    if (settingsControl && !settingsControl.contains(event.target as Node) && this.isSettingsOpen) {
      this.isSettingsOpen = false;
    }

    this.cdr.detectChanges();
  }

  toggleSettingsPanel(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  // ── Map init — plain Angular zone, same pattern as common-leaflet
  private initMap(): void {
    this.map = L.map('map-crop-map', {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      zoomControl: true
    });

    // crossOrigin required so html2canvas can read OSM tile pixels
    this.baseMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      crossOrigin: true as any
    });
    this.baseMapLayer.addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    const drawOptions: any = {
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: true,
          shapeOptions: { color: '#3f51b5', weight: 2.5, fillOpacity: 0.15 }
        },
        rectangle: {
          showArea: false,
          shapeOptions: { color: '#e91e63', weight: 2.5, fillOpacity: 0.15 }
        },
        circle: {
          showRadius: true,
          shapeOptions: { color: '#009688', weight: 2.5, fillOpacity: 0.15 }
        },
        polyline:     false,
        marker:       false,
        circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    };

    // Use L.Control.Draw directly — same as common-leaflet
    const drawControl = new L.Control.Draw(drawOptions);
    this.map.addControl(drawControl);

    // ── Draw hint while tool is active ──────────────────────────
    this.map.on('draw:drawstart', (e: any) => {
      const hints: Record<string, string> = {
        rectangle : 'Click and drag to draw a rectangle',
        polygon   : 'Click to add points — double-click to finish',
        circle    : 'Click and drag to draw a circle'
      };
      this.drawHint = hints[e.layerType] ?? null;
      this.cdr.detectChanges();
    });

    this.map.on('draw:drawstop', () => {
      this.drawHint = null;
      this.cdr.detectChanges();
    });

    // ── Shape created ───────────────────────────────────────────
    this.map.on('draw:created', (e: any) => {
      this.drawHint       = null;
      const layer         = e.layer;
      const layerType     = e.layerType as string;

      // Pixel-based guard: a bare click produces ≤ 2 px in each dimension;
      // require ≥ 15 px so accidental clicks are always rejected.
      if (layerType === 'rectangle') {
        const b    = (layer as any).getBounds() as L.LatLngBounds;
        const nePx = this.map.latLngToContainerPoint(b.getNorthEast());
        const swPx = this.map.latLngToContainerPoint(b.getSouthWest());
        if (Math.abs(nePx.x - swPx.x) < 15 || Math.abs(nePx.y - swPx.y) < 15) {
          this.drawnItems.removeLayer(layer);
          this.drawHint = 'Click and drag to draw a rectangle — drag further to cover the area';
          this.cdr.detectChanges();
          setTimeout(() => { this.drawHint = null; this.cdr.detectChanges(); }, 3000);
          return;
        }
      }

      // Floor Plan mode: shapes accumulate as labelled "additional coordinates"
      // for the selected floor — each one is kept on the map and prompts for
      // a label instead of replacing the previous shape.
      if (this.viewMode === 'floor') {
        if (!this.isWithinFloorBounds(layer)) {
          this.drawnItems.removeLayer(layer);
          this.toastr.warning('Warning', 'Coordinates must stay within the floor plan\'s aspect range');
          return;
        }

        this.drawnItems.addLayer(layer);
        this.pendingShapeType  = layerType;
        this.pendingShapeLayer = layer;
        this.shapeLabelInput   = '';
        this.cdr.detectChanges();
        return;
      }

      // Map View — original single crop-shape tool, unchanged.
      this.drawnItems.clearLayers();
      this.currentLayer = layer;
      this.drawnItems.addLayer(layer);
      this.extractShapeInfo(layerType, layer);

      // Auto-open result dialog after the map settles post-fitBounds
      setTimeout(() => this.openResultDialog(), 600);
    });

    // ── Shape edited ────────────────────────────────────────────
    this.map.on('draw:edited', () => {
      if (this.currentLayer && this.shapeInfo) {
        this.extractShapeInfo(this.shapeInfo.type, this.currentLayer);
      }
    });

    // ── Shape deleted ───────────────────────────────────────────
    this.map.on('draw:deleted', (e: any) => {
      const deletedLayers: any[] = [];
      e.layers.eachLayer((l: any) => deletedLayers.push(l));

      if (this.currentLayer && deletedLayers.includes(this.currentLayer)) {
        this.shapeInfo    = null;
        this.currentLayer = null;
      }

      if (this.additionalShapes.length > 0) {
        const remaining = this.additionalShapes.filter(shape => !deletedLayers.includes(shape.layer));
        if (remaining.length !== this.additionalShapes.length) {
          this.additionalShapes = remaining;
          this.additionalCoordinatesJson = null;
        }
      }

      this.cdr.detectChanges();
    });
  }

  // ── Additional coordinates (Floor Plan mode) ───────────────────

  pickLabelPreset(label: string): void {
    this.shapeLabelInput = label;
  }

  confirmShapeLabel(): void {
    const label = this.shapeLabelInput.trim().toLowerCase();
    if (!label || !this.pendingShapeLayer || !this.pendingShapeType) { return; }

    this.additionalShapes.push({
      id: ++this.shapeIdSeq,
      label,
      type: this.pendingShapeType,
      layer: this.pendingShapeLayer,
      geometry: this.buildAdditionalGeometry(this.pendingShapeType, this.pendingShapeLayer)
    });

    this.pendingShapeLayer = null;
    this.pendingShapeType  = null;
    this.shapeLabelInput   = '';
    this.additionalCoordinatesJson = null;
    this.cdr.detectChanges();
  }

  cancelShapeLabel(): void {
    if (this.pendingShapeLayer) {
      this.drawnItems.removeLayer(this.pendingShapeLayer);
    }
    this.pendingShapeLayer = null;
    this.pendingShapeType  = null;
    this.shapeLabelInput   = '';
    this.cdr.detectChanges();
  }

  removeAdditionalShape(id: number): void {
    const idx = this.additionalShapes.findIndex(shape => shape.id === id);
    if (idx === -1) { return; }
    this.drawnItems.removeLayer(this.additionalShapes[idx].layer);
    this.additionalShapes.splice(idx, 1);
    this.additionalCoordinatesJson = null;
    this.cdr.detectChanges();
  }

  private clearAdditionalShapes(): void {
    for (const shape of this.additionalShapes) {
      this.drawnItems.removeLayer(shape.layer);
    }
    if (this.pendingShapeLayer) {
      this.drawnItems.removeLayer(this.pendingShapeLayer);
    }
    this.additionalShapes = [];
    this.pendingShapeLayer = null;
    this.pendingShapeType  = null;
    this.shapeLabelInput   = '';
    this.additionalCoordinatesJson = null;
  }

  saveAdditionalCoordinates(): void {
    if (this.additionalShapes.length === 0) { return; }

    const selectedFloor = this.floorList.find((floor: any) => floor.id === this.selectedFloorId);
    if (!selectedFloor) {
      this.toastr.warning('Warning', 'Select a floor before saving coordinates');
      return;
    }

    const grouped: Record<string, any[]> = {};
    for (const shape of this.additionalShapes) {
      grouped[shape.label] = grouped[shape.label] || [];
      grouped[shape.label].push(shape.geometry);
    }

    this.additionalCoordinatesJson = JSON.stringify(grouped, null, 2);
    const additionalCoordinates = JSON.stringify(grouped);

    this.isSavingCoordinates = true;
    this.cdr.detectChanges();

    this.hospitalService.editLocation({ ...selectedFloor, additionalCoordinates: additionalCoordinates }).subscribe({
      next: (res: any) => {
        this.isSavingCoordinates = false;
        this.toastr.success('Success', res?.message ?? 'Coordinates saved for this floor');

        const idx = this.floorList.findIndex((floor: any) => floor.id === this.selectedFloorId);
        if (idx > -1) {
          this.floorList[idx] = { ...this.floorList[idx], additionalCoordinates: additionalCoordinates };
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSavingCoordinates = false;
        this.toastr.error('Error', err?.error?.message ?? 'Failed to save coordinates');
        this.cdr.detectChanges();
      }
    });
  }

  copyAdditionalCoordinatesJson(): void {
    if (!this.additionalCoordinatesJson) { return; }
    navigator.clipboard?.writeText(this.additionalCoordinatesJson)
      .then(() => this.toastr.success('Success', 'Copied to clipboard'));
  }

  // Drawn shapes must stay inside the selected floor's aspect range — the
  // floor image's own bounds define that range on the map.
  private isWithinFloorBounds(layer: any): boolean {
    if (!this.floorImageLayer || typeof layer.getBounds !== 'function') { return true; }
    return this.floorImageLayer.getBounds().contains(layer.getBounds());
  }

  // Additional-coordinate geometry is stored in the floor's own aspect space
  // (0..aspects[0] × 0..aspects[1]) rather than the fake lat/lng the floor
  // image is projected onto — otherwise saved coordinates carry meaningless
  // values near the Mercator projection's origin instead of the floor's
  // actual width/height range.
  private buildAdditionalGeometry(shapeType: string, layer: any): any {
    const floorPoints: ShapePoint[] = this.extractLatLngs(shapeType, layer).map(p => {
      const [u, v] = this.latLngToFloorCoord(L.latLng(p.lat, p.lng));
      return { lat: v, lng: u };
    });
    return this.toGeometry(shapeType, floorPoints);
  }

  private latLngToFloorCoord(latlng: L.LatLng): [number, number] {
    const point = this.map.project(latlng, FLOOR_PROJECTION_ZOOM);
    return [+(point.x / 100).toFixed(3), +(point.y / 100).toFixed(3)];
  }

  private extractLatLngs(shapeType: string, layer: any): ShapePoint[] {
    if (shapeType === 'rectangle') {
      const b: L.LatLngBounds = layer.getBounds();
      return [b.getNorthWest(), b.getNorthEast(), b.getSouthEast(), b.getSouthWest()]
        .map(p => ({ lat: p.lat, lng: p.lng }));
    }
    if (shapeType === 'polygon') {
      return (layer.getLatLngs()[0] as L.LatLng[]).map(p => ({ lat: p.lat, lng: p.lng }));
    }
    if (shapeType === 'circle') {
      const center: L.LatLng = layer.getLatLng();
      return [{ lat: center.lat, lng: center.lng }];
    }
    return [];
  }

  private toGeometry(shapeType: string, latlngs: ShapePoint[]): any {
    if (shapeType === 'circle') {
      return {
        type: 'Point',
        coordinates: [+latlngs[0].lng.toFixed(7), +latlngs[0].lat.toFixed(7)]
      };
    }
    const ring = latlngs.map(p => [+p.lng.toFixed(7), +p.lat.toFixed(7)]);
    ring.push(ring[0]);
    return { type: 'Polygon', coordinates: ring };
  }

  // ── Map / Floor-plan mode toggle ──────────────────────────────
  onViewModeChange(mode: 'map' | 'floor'): void {
    if (this.viewMode === mode) { return; }
    this.viewMode = mode;
    this.clearAdditionalShapes();

    if (mode === 'map') {
      this.clearSelectedFloorImage();
      // Floor Plan positions the map using a local (non-geographic) projection of
      // the floor's aspect values — reset to the real-world default so Map View
      // never shows that leftover position.
      this.map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    } else if (this.blockList.length === 0) {
      this.loadBlockHierarchy();
    } else {
      this.loadSelectedFloorImage();
    }
    this.cdr.detectChanges();
  }

  private loadBlockHierarchy(): void {
    this.isLoadingBlocks = true;
    this.isLoadingFloors = true;
    this.hospitalService.getBlockWithFloors().subscribe({
      next: (res: any) => {
        const blocks = (res?.results ?? []).filter((block: any) => Array.isArray(block.children) && block.children.length > 0);
        this.blockList = blocks.map((block: any) => ({ ...block, children: [...(block.children ?? [])] }));

        if (this.blockList.length > 0) {
          const firstBlock = this.blockList[0];
          this.selectedBlockId = firstBlock.id;
          this.floorList = this.getValidFloors(firstBlock.children || []);
          this.selectedFloorId = this.floorList[0]?.id ?? null;
          this.loadSelectedFloorImage();
        } else {
          this.floorList = [];
          this.selectedBlockId = null;
          this.selectedFloorId = null;
          this.clearSelectedFloorImage();
        }

        this.isLoadingBlocks = false;
        this.isLoadingFloors = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingBlocks = false;
        this.isLoadingFloors = false;
        this.toastr.error('Error', 'Failed to load blocks and floors');
        this.cdr.detectChanges();
      }
    });
  }

  onBlockChange(blockId: number | null): void {
    this.clearAdditionalShapes();
    this.selectedBlockId = blockId;
    const selectedBlock = this.blockList.find((block: any) => block.id === blockId);
    this.floorList = this.getValidFloors(selectedBlock?.children || []);
    this.selectedFloorId = this.floorList[0]?.id ?? null;
    this.loadSelectedFloorImage();
  }

  onFloorChange(floorId: number | null): void {
    this.clearAdditionalShapes();
    this.selectedFloorId = floorId;
    this.loadSelectedFloorImage();
  }

  private getValidFloors(children: any[] = []): any[] {
    return (children || []).filter((floor: any) => floor.imageUrl != null || floor.locationTypeId == 23);
  }

  private getFloorImageUrl(floor: any): string | null {
    if (!floor?.imageUrl) { return null; }
    return environment.api_base_url_new + floor.imageUrl + '?date=' + new Date().getTime();
  }

  private clearSelectedFloorImage(): void {
    if (this.floorImageLayer) {
      this.map.removeLayer(this.floorImageLayer);
      this.floorImageLayer = null;
    }
    if (this.baseMapLayer && !this.map.hasLayer(this.baseMapLayer)) {
      this.baseMapLayer.addTo(this.map);
    }
    this.cdr.detectChanges();
  }

  private loadSelectedFloorImage(): void {
    const selectedFloor = this.floorList.find((floor: any) => floor.id === this.selectedFloorId);
    if (!selectedFloor) {
      this.clearSelectedFloorImage();
      return;
    }

    const floorImageUrl = this.getFloorImageUrl(selectedFloor);
    if (!floorImageUrl) {
      this.clearSelectedFloorImage();
      return;
    }

    this.clearSelectedFloorImage();
    const bounds = this.getFloorBounds(selectedFloor);
    if (!bounds) {
      this.toastr.warning('Warning', 'No valid aspect values available for selected floor');
      return;
    }

    // Floor plan replaces the base map entirely — drop the OSM tiles so only the layout shows.
    if (this.baseMapLayer && this.map.hasLayer(this.baseMapLayer)) {
      this.map.removeLayer(this.baseMapLayer);
    }

    this.floorImageLayer = L.imageOverlay(floorImageUrl, bounds, {
      opacity: 1,
      interactive: false
    }) as L.ImageOverlay;
    this.floorImageLayer.on('error', () => {
      this.toastr.error('Error', 'Failed to load the floor plan image');
    });
    this.floorImageLayer.addTo(this.map);
    this.drawnItems.bringToFront();

    this.map.fitBounds(bounds, { padding: [24, 24], animate: false });
    setTimeout(() => { this.map.invalidateSize(); }, 0);
    this.cdr.detectChanges();
  }

  private getFloorBounds(floor: any): L.LatLngBounds | null {
    const aspects = this.parseAspects(floor?.aspects);
    if (!aspects || aspects.length < 2 || aspects[0] <= 0 || aspects[1] <= 0) { return null; }
    const southWest = this.map.unproject([0, aspects[1] * 100], FLOOR_PROJECTION_ZOOM);
    const northEast = this.map.unproject([aspects[0] * 100, 0], FLOOR_PROJECTION_ZOOM);
    return new L.LatLngBounds(southWest, northEast);
  }

  private parseAspects(aspects: any): number[] | null {
    if (!aspects) { return null; }
    try {
      const parsed = typeof aspects === 'string' ? JSON.parse(aspects) : aspects;
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.map((value: any) => Number(value)).filter((value: number) => !Number.isNaN(value));
      }
    } catch (e) {
      // fallback below
    }

    const match = String(aspects).match(/-?\d+(?:\.\d+)?/g);
    if (match && match.length >= 2) {
      return match.slice(0, 2).map(value => Number(value));
    }
    return null;
  }

  // ── Shape info extraction ─────────────────────────────────────

  private extractShapeInfo(shapeType: string, layer: any): void {
    let latlngs: ShapePoint[] = [];
    let rawLL: L.LatLng[]     = [];
    let dimensions            = { length: 0, width: 0 };
    let area = 0, perimeter = 0;
    let radius: number | null = null;

    if (shapeType === 'rectangle') {
      const b: L.LatLngBounds = layer.getBounds();
      const nw = b.getNorthWest(), ne = b.getNorthEast(),
            se = b.getSouthEast(), sw = b.getSouthWest();
      rawLL   = [nw, ne, se, sw];
      latlngs = rawLL.map(p => ({ lat: p.lat, lng: p.lng }));
      const w = nw.distanceTo(ne), h = nw.distanceTo(sw);
      dimensions = { length: Math.round(h), width: Math.round(w) };
      area      = w * h;
      perimeter = 2 * (w + h);

    } else if (shapeType === 'polygon') {
      rawLL   = layer.getLatLngs()[0] as L.LatLng[];
      latlngs = rawLL.map(p => ({ lat: p.lat, lng: p.lng }));
      const b: L.LatLngBounds = layer.getBounds();
      const nw = b.getNorthWest(), ne = b.getNorthEast(), sw = b.getSouthWest();
      dimensions = {
        length: Math.round(nw.distanceTo(sw)),
        width:  Math.round(nw.distanceTo(ne))
      };
      area      = this.geodesicArea(rawLL);
      perimeter = this.calcPerimeter(rawLL);

    } else if (shapeType === 'circle') {
      const center: L.LatLng = layer.getLatLng();
      radius  = Math.round(layer.getRadius());
      rawLL   = [center];
      latlngs = [{ lat: center.lat, lng: center.lng }];
      dimensions = { length: radius * 2, width: radius * 2 };
      area      = Math.PI * radius * radius;
      perimeter = 2 * Math.PI * radius;
    }

    this.shapeInfo = {
      type: shapeType, latlngs,
      pointCount: latlngs.length,
      dimensions, area, perimeter, radius
    };

    if (typeof layer.getBounds === 'function') {
      this.map.fitBounds(layer.getBounds(), { padding: [40, 40] });
    }
    this.cdr.detectChanges();
  }

  // ── Geometry helpers ─────────────────────────────────────────

  private geodesicArea(ll: L.LatLng[]): number {
    if (ll.length < 3) { return 0; }
    const R = 6378137; let area = 0;
    for (let i = 0; i < ll.length; i++) {
      const p1 = ll[i], p2 = ll[(i + 1) % ll.length];
      area += (p2.lng - p1.lng) * (Math.PI / 180) *
              (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    return Math.abs(area * R * R / 2);
  }

  private calcPerimeter(ll: L.LatLng[]): number {
    let t = 0;
    for (let i = 0; i < ll.length; i++) { t += ll[i].distanceTo(ll[(i + 1) % ll.length]); }
    return t;
  }

  // ── Format helpers used in template ─────────────────────────

  formatDistance(meters: number): string {
    if (meters == null) { return '—'; }
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
  }

  formatArea(sqm: number): string {
    return sqm >= 1_000_000
      ? `${(sqm / 1_000_000).toFixed(4)} km²`
      : `${Math.round(sqm).toLocaleString()} m²`;
  }

  formatAspect(width: number, length: number): string {
    if (!width || !length) { return '—'; }
    return `[${Math.round(width)}, ${Math.round(length)}]`;
  }

  // ── Address / Lat-Lng search ──────────────────────────────────

  searchAddress(): void {
    const q = this.searchQuery.trim();
    if (!q) { return; }

    const m = q.match(LATLNG_RE);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        this.map.flyTo([lat, lng], 15);
        L.marker([lat, lng]).addTo(this.map)
          .bindPopup(`${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();
        this.showResults = false;
        this.searchResults = [];
        this.cdr.detectChanges();
        return;
      }
    }

    this.isSearching = true;
    this.showResults = false;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
      { headers: { Accept: 'application/json' } }
    )
      .then(r => r.json())
      .then((res: any[]) => {
        this.searchResults = res;
        this.showResults   = res.length > 0;
        this.isSearching   = false;
        if (res.length === 1) { this.flyToResult(res[0]); }
        this.cdr.detectChanges();
      })
      .catch(() => { this.isSearching = false; this.cdr.detectChanges(); });
  }

  flyToResult(r: any): void {
    this.map.flyTo([parseFloat(r.lat), parseFloat(r.lon)], 14);
    this.showResults  = false;
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  // ── Actions ──────────────────────────────────────────────────

  clearShape(): void {
    if (this.currentLayer) {
      this.drawnItems.removeLayer(this.currentLayer);
    }
    this.currentLayer = null;
    this.shapeInfo    = null;
    this.cdr.detectChanges();
  }

  // ── Result dialog ─────────────────────────────────────────────

  async openResultDialog(): Promise<void> {
    if (!this.shapeInfo || !this.currentLayer) { return; }

    this.isCapturing = true;
    this.drawHint    = 'Preparing preview…';
    this.cdr.detectChanges();

    let imageDataUrl: string | null = null;

    try {
      const bounds: L.LatLngBounds = this.currentLayer.getBounds();
      this.map.fitBounds(bounds, { padding: [10, 10], animate: false });
      await this.waitForTiles();

      const mapEl = document.getElementById('map-crop-map');
      if (mapEl) {
        // Keep the OSM tiles (with labels/icons) visible, but hide the drawn shape's
        // colored border/fill so the capture is a clean crop of exactly the selected area.
        this.map.removeLayer(this.drawnItems);
        await new Promise<void>(r => setTimeout(r, 80));

        try {
          const full = await (html2canvas as any)(mapEl, {
            useCORS: true, allowTaint: false, logging: false, scale: 1, imageTimeout: 15000
          });

          const ne = this.map.latLngToContainerPoint(bounds.getNorthEast());
          const sw = this.map.latLngToContainerPoint(bounds.getSouthWest());
          const x  = Math.floor(Math.min(ne.x, sw.x));
          const y  = Math.floor(Math.min(ne.y, sw.y));
          const w  = Math.ceil(Math.abs(ne.x - sw.x));
          const h  = Math.ceil(Math.abs(ne.y - sw.y));

          const cropped = document.createElement('canvas');
          cropped.width = w; cropped.height = h;
          const ctx = cropped.getContext('2d');
          if (ctx) { ctx.drawImage(full, x, y, w, h, 0, 0, w, h); }
          imageDataUrl = cropped.toDataURL('image/png');
        } finally {
          this.map.addLayer(this.drawnItems);
        }
      }
    } catch (err) {
      console.error('Map capture failed:', err);
    }

    this.isCapturing = false;
    this.drawHint    = null;
    this.cdr.detectChanges();

    this.dialog.open(MapCropResultDialogComponent, {
      width: '1280px',
      maxWidth: '98vw',
      maxHeight: '94vh',
      data: {
        imageDataUrl,
        shapeInfo: this.shapeInfo,
        formattedJson: this.buildShapeJson(this.shapeInfo)
      }
    });
  }

  private buildShapeJson(info: ShapeInfo): string {
    const geometry = this.toGeometry(info.type, info.latlngs);
    return JSON.stringify(
      { type: 'Feature', shapeType: info.type, unit: 'latlng', geometry }
    );
  }

  async downloadCroppedImage(): Promise<void> {
    if (!this.currentLayer || typeof this.currentLayer.getBounds !== 'function') { return; }
    this.isCapturing = true;
    this.cdr.detectChanges();

    const bounds: L.LatLngBounds = this.currentLayer.getBounds();
    this.map.fitBounds(bounds, { padding: [0, 0], animate: false });
    await this.waitForTiles();

    const mapEl = document.getElementById('map-crop-map');
    if (!mapEl) { this.isCapturing = false; return; }

    // Keep the OSM tiles (with labels/icons) visible, but hide the drawn shape's
    // colored border/fill so the saved image is a clean crop of exactly the selected area.
    this.map.removeLayer(this.drawnItems);
    await new Promise<void>(r => setTimeout(r, 80));

    try {
      const full = await (html2canvas as any)(mapEl, {
        useCORS: true, allowTaint: false, logging: false, scale: 1, imageTimeout: 15000
      });

      const ne = this.map.latLngToContainerPoint(bounds.getNorthEast());
      const sw = this.map.latLngToContainerPoint(bounds.getSouthWest());
      const x  = Math.floor(Math.min(ne.x, sw.x));
      const y  = Math.floor(Math.min(ne.y, sw.y));
      const w  = Math.ceil(Math.abs(ne.x - sw.x));
      const h  = Math.ceil(Math.abs(ne.y - sw.y));

      const cropped = document.createElement('canvas');
      cropped.width = w; cropped.height = h;
      const ctx = cropped.getContext('2d');
      if (ctx) { ctx.drawImage(full, x, y, w, h, 0, 0, w, h); }

      const dims    = this.shapeInfo?.dimensions;
      const aspect  = dims ? `${Math.round(dims.width)}x${Math.round(dims.length)}` : 'na';
      const link    = document.createElement('a');
      link.download = `map-${this.shapeInfo?.type}-${aspect}.png`;
      link.href     = cropped.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Map capture failed:', err);
    } finally {
      this.map.addLayer(this.drawnItems);
    }

    this.isCapturing = false;
    this.cdr.detectChanges();
  }

  private waitForTiles(): Promise<void> {
    return new Promise(resolve => {
      let pending = 0; let settled = false;
      const done  = () => {
        if (settled) { return; } settled = true;
        this.map.off('tileloadstart', onStart);
        this.map.off('tileload', onEnd);
        this.map.off('tileerror', onEnd);
        resolve();
      };
      const onStart = () => pending++;
      const onEnd   = () => { if (--pending <= 0) { done(); } };
      this.map.on('tileloadstart', onStart);
      this.map.on('tileload', onEnd);
      this.map.on('tileerror', onEnd);
      setTimeout(() => { if (pending === 0) { done(); } }, 400);
      setTimeout(done, 5000);
    });
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); }
  }
}
