/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 ******************************************************************************/

import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { HospitalService } from '../../../services/hospital.service';
import { AppToastService } from '../../../services/toaster.service';
import { environment } from '../../../../../environments/environment';

export interface MapCropResultData {
  imageDataUrl: string | null;
  shapeInfo: {
    type: string;
    latlngs: { lat: number; lng: number }[];
    pointCount: number;
    dimensions: { length: number; width: number };
    area: number;
    perimeter: number;
    radius: number | null;
  };
  formattedJson: string;
}

@Component({
  selector: 'app-map-crop-result-dialog',
  templateUrl: './map-crop-result-dialog.component.html',
  styleUrls: ['./map-crop-result-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapCropResultDialogComponent implements OnInit {

  private static readonly ASPECT_PATTERN = /^\[\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*\]$/;

  copied = false;

  editableAspect = '';
  editableCoordinates = '';

  floorList: any[] = [];
  filteredFloorList: any[] = [];
  floorSearchControl = new FormControl('');
  selectedFloorId: any = null;
  selectedFloor: any = null;
  isLoadingFloors = false;
  isUpdating = false;

  uploadedImageDataUrl: string | null = null;
  uploadedFileName: string | null = null;

  jsonExpanded = false;

  constructor(
    public dialogRef: MatDialogRef<MapCropResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MapCropResultData,
    private readonly hospitalService: HospitalService,
    private readonly toastr: AppToastService
  ) {}

  ngOnInit(): void {
    const { width, length } = this.data.shapeInfo.dimensions;
    this.editableAspect = JSON.stringify([Math.round(width), Math.round(length)]);
    this.editableCoordinates = this.data.formattedJson;

    this.isLoadingFloors = true;
    this.hospitalService.getBlockWithFloors().subscribe({
      next: (res: any) => {
        const blocks = res?.results ?? [];
        this.floorList = [];
        for (const block of blocks) {
          const floors = (block.children ?? []).filter((f: any) => f.imageUrl != null || f.locationTypeId == 23);
          for (const floor of floors) {
            this.floorList.push({ ...floor, blockName: block.name });
          }
        }
        this.filteredFloorList = this.floorList;
        this.isLoadingFloors = false;
      },
      error: () => { this.isLoadingFloors = false; }
    });
  }

  filterFloors(search: string): void {
    const term = (search || '').toLowerCase().trim();
    this.filteredFloorList = !term
      ? this.floorList
      : this.floorList.filter(f =>
          f.name?.toLowerCase().includes(term) || f.blockName?.toLowerCase().includes(term)
        );
  }

  onFloorChange(floorId: any): void {
    this.selectedFloor = floorId ? (this.floorList.find(f => f.id === floorId) ?? null) : null;
    if (!this.selectedFloor) {
      this.removeUploadedImage();
    }
  }

  getFloorImageUrl(floor: any): string | null {
    if (!floor?.imageUrl) { return null; }
    return environment.api_base_url_new + floor.imageUrl + '?date=' + new Date().getTime();
  }

  onImageFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) { return; }

    if (file.size >= 2 * 1000000) { // 2MB cap, matches manage-location's upload limit
      this.toastr.warning('Warning', 'Upload image file should be less than 2MB');
      event.target.value = '';
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onloadend = () => {
      this.uploadedImageDataUrl = reader.result as string;
      this.uploadedFileName = file.name;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeUploadedImage(): void {
    this.uploadedImageDataUrl = null;
    this.uploadedFileName = null;
  }

  updateFloor(): void {
    if (!this.selectedFloor || !this.uploadedImageDataUrl) { return; }

    const aspects = this.editableAspect.trim();
    const coordinates = this.editableCoordinates.trim();

    if (!MapCropResultDialogComponent.ASPECT_PATTERN.test(aspects)) {
      this.toastr.warning('Warning', 'Aspect must be in the format [width, length]');
      return;
    }
    try {
      JSON.parse(coordinates);
    } catch {
      this.toastr.warning('Warning', 'Coordinates must be valid JSON');
      return;
    }

    const { blockName, ...floorData } = this.selectedFloor;
    const payload = {
      ...floorData,
      aspects,
      coordinates,
      imageData: this.uploadedImageDataUrl
    };

    this.isUpdating = true;
    this.hospitalService.editLocation(payload).subscribe({
      next: (res: any) => {
        this.isUpdating = false;
        this.toastr.success('Success', res?.message ?? 'Floor updated successfully');
        this.selectedFloor = { ...this.selectedFloor, aspects: payload.aspects, coordinates: payload.coordinates };
        const idx = this.floorList.findIndex(f => f.id === this.selectedFloor.id);
        if (idx > -1) { this.floorList[idx] = this.selectedFloor; }
        this.removeUploadedImage();
      },
      error: (err: any) => {
        this.isUpdating = false;
        this.toastr.error('Error', err?.error?.message ?? 'Failed to update floor');
      }
    });
  }

  toggleJson(): void {
    this.jsonExpanded = !this.jsonExpanded;
  }

  copyJson(): void {
    navigator.clipboard.writeText(this.data.formattedJson).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  downloadImage(): void {
    if (!this.data.imageDataUrl) { return; }
    const { width, length } = this.data.shapeInfo.dimensions;
    const aspect  = `${Math.round(width)}x${Math.round(length)}`;
    const link    = document.createElement('a');
    link.download = `map-${this.data.shapeInfo.type}-${aspect}.png`;
    link.href     = this.data.imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDistance(meters: number): string {
    if (meters == null) { return '—'; }
    return meters >= 1000
      ? `${(meters / 1000).toFixed(2)} km`
      : `${Math.round(meters)} m`;
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
}
