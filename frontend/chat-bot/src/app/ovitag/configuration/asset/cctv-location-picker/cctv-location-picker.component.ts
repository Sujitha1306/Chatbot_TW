import { Component, OnInit, OnDestroy, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as L from 'leaflet';
import { CommonService } from '../../../../shared';
import { environment } from '../../../../../environments/environment';
import { StyleLoaderService } from '../../../../shared/services/style-loader.service ';

export interface CctvLocationSelection {
  locationId: string;
  locationName: string;
  floorId: string;
  floorName: string;
  blockId: string;
  blockName: string;
  x: number;
  y: number;
  coordinates: string;
}

@Component({
  selector: 'app-cctv-location-picker',
  templateUrl: './cctv-location-picker.component.html',
  styleUrls: ['./cctv-location-picker.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CctvLocationPickerComponent implements OnInit, OnDestroy {

  blocks: { id: string; name: string }[] = [];
  allFloors: { id: string; name: string; blockId: string; blockName: string }[] = [];
  filteredFloors: { id: string; name: string }[] = [];

  selectedBlockId: string = null;
  selectedFloorId: string = null;
  selectedLocation: CctvLocationSelection = null;

  private map: any = null;
  private mapZoomControl: any = null;
  private floorData: { [floorId: string]: any } = {};

  public maps: any = {
    'floors': {},
    'floor_id': null,
    'location': {},
    'active_location': null,
    'position': null,
    'icon1': new L.Icon({
      iconUrl: '/assets/Alert/common_icons/green-dot.png',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  };

  constructor(
    public dialogRef: MatDialogRef<CctvLocationPickerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService,
    private readonly styleLoader: StyleLoaderService
  ) {}

  ngOnInit() {
    this.styleLoader.loadStyleByType('leaflet');
    this.loadLocationHierarchy();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadLocationHierarchy() {
    this.commonService.getAllLocation().subscribe(res => {
      if (res.results) {
        this.parseLocationHierarchy(res.results);
        if (this.data?.locationId) {
          // Wait for the dialog open animation (~225ms) so Leaflet gets correct container dimensions.
          setTimeout(() => {this.restoreFromData(),  this.restoreSelection()}, 300);
        }
      }
    });
  }

  private parseLocationHierarchy(facilities: any[]) {
    const blockIds = new Set<string>();

    for (const facility of facilities) {
      for (const block of (facility.children || [])) {
        if (!blockIds.has(block.id)) {
          blockIds.add(block.id);
          this.blocks.push({ id: block.id, name: block.name });
        }

        for (const floor of (block.children || [])) {
          this.allFloors.push({
            id: floor.id,
            name: floor.name,
            blockId: block.id,
            blockName: block.name
          });

          const locations: any[] = [];
          for (const loc of (floor.children || [])) {
            if (loc.coordinates) {
              locations.push({
                id: loc.id,
                name: loc.name,
                locationTypeId: loc.locationTypeId,
                coordinates: loc.coordinates
              });
            }
          }

          const floorEntry = {
            id: floor.id,
            name: floor.name,
            blockId: block.id,
            blockName: block.name,
            imageUrl: floor.imageUrl,
            aspects: floor.aspects,
            defaultZoom: floor.defaultZoom,
            maxZoom: floor.maxZoom,
            minZoom: floor.minZoom,
            locations: locations
          };
          this.floorData[floor.id] = floorEntry;
          this.maps['floors'][floor.id] = floorEntry;
        }
      }
    }
  }

  onBlockChange(blockId: string) {
    this.selectedBlockId = blockId;
    this.selectedFloorId = null;
    this.selectedLocation = null;
    this.maps['active_location'] = null;
    this.maps['location'] = {};
    this.maps['position'] = null;
    this.filteredFloors = this.allFloors.filter(f => f.blockId === blockId);
    this.clearMap();
  }

  onFloorChange(floorId: string) {
    this.selectedFloorId = floorId;
    this.selectedLocation = null;
    this.maps['active_location'] = null;
    this.maps['location'] = {};
    this.maps['position'] = null;
    this.maps['floor_id'] = floorId;
    this.show_map(floorId);
  }

  private show_map(floor_id: string) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const floor_info = this.maps['floors'][floor_id];
    if (floor_info) {
      const { minimumZoom, maximumZoom, defaultZoom } = this.getZoomLevels(floor_info);

      this.map = L.map('cctvLocationMap', {
        minZoom: minimumZoom,
        maxZoom: maximumZoom,
        center: [10, 0],
        zoom: defaultZoom,
        crs: L.CRS.Simple,
        zoomControl: true,
        attributionControl: false
      });

      const bounds = this.getMapBounds(floor_info);
      const floorImage = environment.api_base_url_new + floor_info.imageUrl + '?date=' + (new Date());
      L.imageOverlay(floorImage, bounds).addTo(this.map);
      this.map.on('zoomend', this.zoomCntrlLabel.bind(this));
      this.map.setView(bounds.getCenter(), defaultZoom);

      for (let i in floor_info.locations) {
        if (floor_info.locations[i].coordinates) {
          this.drawLocation(floor_info.locations[i], '#e0ebeb');
        }
      }

      this.zoomCntrlLabel();
      // Force Leaflet to recalculate dimensions after Angular has painted the container.
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 0);
    }
  }

  getZoomLevels(floor_info) {
    let minimumZoom = -3, maximumZoom = 0, defaultZoom = -2;
    if (floor_info.defaultZoom != null && floor_info.minZoom != null && floor_info.maxZoom != null) {
      minimumZoom = -10;
      maximumZoom = floor_info.maxZoom / 20 - 10;
      defaultZoom = floor_info.defaultZoom / 20 - 10;
    }
    return { minimumZoom, maximumZoom, defaultZoom };
  }

  getMapBounds(floor_info) {
    let southWest = null, northEast = null;
    if (floor_info.aspects != null) {
      const e = eval;
      let aspects = e(floor_info.aspects);
      southWest = this.map.unproject([0, aspects[1] * 100], this.map.getMaxZoom());
      northEast = this.map.unproject([aspects[0] * 100, 0], this.map.getMaxZoom());
    } else {
      southWest = this.map.unproject([0, 1700], this.map.getMaxZoom());
      northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
    }
    return new L.LatLngBounds(southWest, northEast);
  }

  zoomCntrlLabel() {
    let zoomVal = (Math.round(this.map.getZoom()) + 10) * 20;
    if (this.mapZoomControl) {
      this.map.removeControl(this.mapZoomControl);
      this.mapZoomControl = null;
    }
    let showZoom = L.DomUtil.create('button');
    this.mapZoomControl = new L.Control();
    this.mapZoomControl.options = { position: 'topleft' };
    this.mapZoomControl.onAdd = () => {
      showZoom.innerText = +zoomVal + ' %';
      return showZoom;
    };
    this.map.addControl(this.mapZoomControl);
  }

  drawLocation(locationDetail, color) {
    let area = JSON.parse(locationDetail.coordinates);
    if (area && area.geometry.type != 'Point') {
      let poly = area.geometry.coordinates;
      let test: any = [];
      for (let i in poly) {
        test.push([poly[i][1] * -100, poly[i][0] * 100]);
      }
      const polygonData = L.polygon(test, { color: color });
      let className = 'reader-tooltip';
      polygonData.on('click', (e) => this.getCoordinate(locationDetail, e));
      polygonData.addTo(this.map);
      let name = locationDetail.name.split(' ').join('<br>');
      polygonData.bindTooltip(name, { permanent: true, direction: 'center', className: className }).openTooltip();
      this.maps['location'][locationDetail.id] = {
        'color': color,
        'poly': polygonData,
        'data': locationDetail
      };
    }
  }

  editLocation(location_id) {
    let color = '#ffcc99';
    if (location_id in this.maps['location']) {
      let locationDetail = this.maps['location'][location_id]['data'];
      let area = JSON.parse(locationDetail.coordinates);
      if (area.geometry.type != 'Point') {
        this.map.removeLayer(this.maps['location'][location_id]['poly']);
        if (this.maps['location'][location_id]['color'] == color) {
          color = '#e0ebeb';
          if (this.selectedLocation?.locationId === location_id) {
            this.selectedLocation = null;
          }
          if (this.maps['position']) {
            this.map.removeLayer(this.maps['position']);
            this.maps['position'] = null;
          }
        }
        let poly = area.geometry.coordinates;
        let test: any = [];
        for (let i in poly) {
          test.push([poly[i][1] * -100, poly[i][0] * 100]);
        }
        const polygonData = L.polygon(test, { color: color });
        let className = 'reader-tooltip';
        polygonData.on('click', (e) => this.getCoordinate(locationDetail, e));
        polygonData.addTo(this.map);
        let name = locationDetail.name.split(' ').join('<br>');
        polygonData.bindTooltip(name, { permanent: true, direction: 'center', className: className }).openTooltip();
        this.maps['location'][locationDetail.id] = {
          'color': color,
          'poly': polygonData,
          'data': locationDetail
        };
        this.maps['active_location'] = location_id;
      }
    }
  }

  syncLocation(location_id) {
    if (this.maps['active_location'] != null) {
      if (this.maps['active_location'] != location_id) {
        this.editLocation(this.maps['active_location']);
        this.editLocation(location_id);
      }
    } else {
      this.editLocation(location_id);
    }
  }

  getCoordinate(locationDetail, e) {
    this.syncLocation(locationDetail.id);
    this.position_change(e.latlng, locationDetail);
  }

  position_change(xy, locationDetail) {
    if (this.maps['position']) {
      this.map.removeLayer(this.maps['position']);
      this.maps['position'] = null;
    }
    const marker = L.marker(xy, { icon: this.maps['icon1'] });
    marker.addTo(this.map);
    this.maps['position'] = marker;

    const coords = JSON.parse('[' + (xy.lng / 100).toFixed(3) + ',' + (xy.lat / -100).toFixed(3) + ']');
    const floorInfo = this.floorData[this.selectedFloorId];
    this.selectedLocation = {
      locationId: locationDetail.id,
      locationName: locationDetail.name,
      floorId: this.selectedFloorId,
      floorName: floorInfo?.name ?? '',
      blockId: floorInfo?.blockId ?? '',
      blockName: floorInfo?.blockName ?? '',
      x: coords[0],
      y: coords[1],
      coordinates: JSON.stringify(coords)
    };
  }

  private restoreFromData() {
    const targetLocationId = this.data.locationId;
    const targetCoordinates = this.data.coordinates;
    if (!targetLocationId) return;

    let targetFloorId: string = null;
    for (const floorId in this.floorData) {
      if (this.floorData[floorId].locations.find(l => l.id === targetLocationId)) {
        targetFloorId = floorId;
        break;
      }
    }
    if (!targetFloorId) return;

    const floorEntry = this.allFloors.find(f => f.id === targetFloorId);
    this.selectedBlockId = floorEntry?.blockId ?? null;
    this.filteredFloors = this.allFloors.filter(f => f.blockId === this.selectedBlockId);
    this.selectedFloorId = targetFloorId;
    this.maps['floor_id'] = targetFloorId;
    this.show_map(targetFloorId);

    // Defer highlight + marker placement so Leaflet's SVG layer is fully ready
    // and invalidateSize() (fired in show_map) has already run.
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();

      if (targetLocationId in this.maps['location']) {
        this.editLocation(targetLocationId);
      }

      if (targetCoordinates) {
        try {
          const coords = JSON.parse(targetCoordinates);
          const xy = { lat: coords[1] * -100, lng: coords[0] * 100 };
          const locData = this.maps['location'][targetLocationId]?.['data'];
          if (locData) {
            this.position_change(xy, locData);
          }
        } catch {}
      }
    }, 100);
  }

  private clearMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.mapZoomControl = null;
    }
    this.maps['location'] = {};
    this.maps['position'] = null;
  }

  confirm() {
    this.dialogRef.close(this.selectedLocation);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  private restoreSelection() {

    const floor = this.allFloors.find(f => f.id == this.data.floorId);

    if (floor) {
      this.selectedBlockId = floor.blockId;

      this.filteredFloors = this.allFloors.filter(
        f => f.blockId == this.selectedBlockId
      );

      this.selectedFloorId = floor.id;
    }
  }
}
