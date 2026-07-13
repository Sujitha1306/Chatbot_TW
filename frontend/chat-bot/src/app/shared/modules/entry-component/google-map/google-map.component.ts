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

import { Component, OnInit, Inject, OnDestroy, Optional, Input, Injectable} from '@angular/core';
import * as L from 'leaflet';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GeoSearchControl,  GoogleProvider } from 'leaflet-geosearch';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonService } from '../../../services/common.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { connect } from 'mqtt';
// import { AgmInfoWindow } from "@agm/core"
import { DatePipe } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private apiLoaded = false;

  load(key): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.apiLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=` + key + `&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.apiLoaded = true;
        resolve();
      };
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }
}

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapComponent implements OnInit, OnDestroy {
  @Input() type = null;
  public interval: any;
  public map: any;
  public fixed_latlong = [];
  public current_latlong = [];
  public icon1 = 'assets/Alert/common_icons/map-icon.svg';
  public icon2 = 'assets/Alert/common_icons/icon2.svg';
  public ambulance3Icon = 'assets/Alert/common_icons/red-ambulance.png';
  public redAmbulance = 'assets/Alert/common_icons/circle-ambulance-red.png';
  public greenAmbulance = 'assets/Alert/common_icons/circle-ambulance-green.png';
  public hospitalIcon = 'assets/Alert/common_icons/hospital.png';
  public commitLatLong = [];
  public ambulanceLat: any;
  public ambulanceLong: any;
  public selectLatLng: any;
  public selectCircle: any;
  public title: string;
  public threshold: string;
  searchLatLang: any;
  searchText = null;
  popWidth: number;
  popHeight: number;
  contentHeight: number;
  searchedLatLng = null;
  ambulance: any = {};
  availableAmbulance: any=[];
  public googleKey: any = [];
  formattedAddress = null;
  searchControl: any;
  existPrivateUser = false;
  spreadMarkers = [];
  zoomListenerAdded = false;
  mapInitialized = false;
  constructor(@Optional() public thisDialogRef: MatDialogRef<GoogleMapComponent>, 
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  private readonly commonService: CommonService,
  private readonly googleMapsLoader: GoogleMapsLoaderService) { }
  ngOnInit() {
    this.existPrivateUser = 'privateUser' in localStorage;
    this.commonService.getConfigFile('google').subscribe(res => {
      if (res.results != null) {
        this.googleKey = res.results.contentObject['map']['API_KEY'];
        localStorage.setItem('API_KEY', res.results.contentObject['API_KEY']);
        
      }
    });
    setTimeout(() => this.loadMap(), 300);
    setTimeout(() => [window.dispatchEvent(new Event('resize')), this.map.invalidateSize()], 400);
  }
  loadMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    let tiles = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      zoom: 18,
      maxZoom: 21,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    if (this.data && this.data["ambulanceLatlong"] !== null) {
      this.ambulanceLat = this.data.ambulanceLatlong.lat;
      this.ambulanceLong = this.data.ambulanceLatlong.lng;
    }
    if(this.data && this.data.ambulanceLatlong !== null) {
      this.map = L.map('locationMap', {
        center: new L.LatLng(this.ambulanceLat, this.ambulanceLong),
        zoom: 18,
        layers: [tiles],
        zoomControl: true, attributionControl: false
      });
    } else {
      this.map = L.map('locationMap', {
        center: new L.LatLng(45.78771148665357, 15.967683792394526),
        zoom: 18,
        layers: [tiles],
        zoomControl: true, attributionControl: false
      });
    }
    if (this.data && this.data["type"] == "latlong") {
      if (this.data["threshold"] != null) {
        this.threshold = this.data["threshold"].toString()
      } else {
        this.threshold = this.data["threshold"];
      }
      if (this.data["data"] != null) {

        let location = this.data["data"].split(',');
        this.commitLatLong = [parseFloat(location[0]), parseFloat(location[1])];
        const icon = L.icon({
          iconUrl: this.icon2,
          iconSize: [20, 20], iconAnchor: [10, 10]
        });
        this.selectLatLng = L.marker(this.commitLatLong).addTo(this.map);
        this.selectLatLng.setIcon(icon);
        this.map.setView(this.commitLatLong, 15);
        if (this.threshold != null) {
          this.selectCircle = L.circle(this.commitLatLong, {
            color: "red",
            fillColor: "#f03",
            fillOpacity: 0.5,
            radius: parseFloat(this.threshold)
          }).addTo(this.map);
          this.selectCircle.on('click', (e: any) => {
            const currentZoom = this.map.getZoom();
            this.getLatLong('d', {
              latlng: e.latlng,
              type: 'click'
            });
            setTimeout(() => {
              this.map.setZoom(currentZoom);
            },0);
          });
        }
      } else {
        if(this.ambulanceLat) {
          this.map.setView([this.ambulanceLat, this.ambulanceLong], 12);
        } else {
          this.map.setView([13.053277, 80.249496], 12);
        }
      }
      this.map.on('click', this.getLatLong.bind(this, 'd') );
      this.mapLatLong(this.data.searchText);
      // this.initAutocomplete();      
      if(this.data.hasOwnProperty('searchLatLng') && this.data.searchLatLng !== null) {
        this.searchedLatLng = this.data.searchLatLng;
        this.getLatLong(null, this.data.searchLatLng);
      }
    } else {
      this.getAmbulanceLocation();
      if(this.type == 'manage') {
        this.interval = setInterval(val => this.getAmbulanceLocation(), environment.base_value.set_amb_interval);        
      }
    }
  }
  getAmbulanceLocation() {
    this.commonService.getGeoAmbulanceLocation().subscribe(res => {
      if(res.results.length !== 0) {
        const ambList = res.results;
        this.ambulanceBind(ambList)
      }
    });
  }
  ambulanceBind(ambList) {
    const iconAmbGreen = L.icon({
      iconUrl: this.greenAmbulance,
    iconSize: [45, 45], iconAnchor: [10, 10],
    });
    const iconAmbRed = L.icon({
      iconUrl: this.redAmbulance,
    iconSize: [45, 45], iconAnchor: [10, 10],
    });
    this.availableAmbulance = [];

    // store spread markers globally
    if (!this.spreadMarkers) {
      this.spreadMarkers = [];
    }

    // grouping
    const latLngMap = {};

    for (let i = 0; i < ambList.length; i++) {
      const lat = ambList[i].latitude;
      const lng = ambList[i].longitude;
      const key = lat + '_' + lng;

      if (!latLngMap[key]) {
        latLngMap[key] = [];
      }
      latLngMap[key].push(ambList[i]);
    }

    for (let i = 0; i < ambList.length; i++) {

      if (this.ambulance.hasOwnProperty(ambList[i]['assetId'])) {
        this.map.removeLayer(this.ambulance[ambList[i]['assetId']]);
      }

      let latlng = [ambList[i].latitude, ambList[i].longitude];
      this.availableAmbulance.push(latlng);

      const key = ambList[i].latitude + '_' + ambList[i].longitude;
      const group = latLngMap[key];

      let marker = L.marker(latlng).addTo(this.map);

      // ===========================
      // ICON WITH COUNT BADGE
      // ===========================
      if (group.length > 1) {

        const countIcon = L.divIcon({
          html: `
          <div style="position:relative; width:45px; height:45px;">
            
            <img src="${ambList[i].isBusy ? this.redAmbulance : this.greenAmbulance}" 
                 style="width:45px;height:45px;">
            
            <div style="
              position:absolute;
              top:-10px;
              left:50%;
              transform:translateX(-50%);
              background:#7AC943;
              color:#fff;
              border-radius:50%;
              width:26px;
              height:26px;
              font-size:13px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:bold;
              box-shadow:0 0 5px rgba(0,0,0,0.3);
            ">
              ${group.length}
            </div>
          </div>
        `,
          className: '',
          iconSize: [45, 45],
          iconAnchor: [22, 40]
        });

        marker.setIcon(countIcon);

        // ===========================
        // CLICK → SPREAD MARKERS
        // ===========================
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const radius = 0.0002;

          this.spreadMarkers.forEach(m => {
            if (this.map.hasLayer(m)) {
              this.map.removeLayer(m);
            }
          });
          this.spreadMarkers = [];

          // skip first → show remaining only
          const remaining = group.slice(1);

          remaining.forEach((amb, idx) => {

            const angle = (2 * Math.PI * idx) / remaining.length;

            const newLatLng = [
              latlng[0] + radius * Math.cos(angle),
              latlng[1] + radius * Math.sin(angle)
            ];

            let m = L.marker(newLatLng).addTo(this.map);
            m.setIcon(amb.isBusy ? iconAmbRed : iconAmbGreen);

            m.on('mouseover', () => {
              L.popup({ autoClose: true })
                .setLatLng(newLatLng)
                .setContent(amb.assetName)
                .openOn(this.map);
            });

            m.on('mouseout', () => this.map.closePopup());

            this.spreadMarkers.push(m);
          });

        });
      } else {
        // NORMAL ICON
        marker.setIcon(ambList[i].isBusy ? iconAmbRed : iconAmbGreen);
      }

      // ===========================
      // ORIGINAL LOGIC (UNCHANGED)
      // ===========================
      // this.map.setView(latlng, this.map.getZoom());
      if (!this.mapInitialized) {
        this.map.setView(latlng, this.map.getZoom());
        this.mapInitialized = true;
      }
      let msg = '';

      if (group.length > 1) {
        msg = ambList[0].assetName;
      } else {
        msg = ambList[i].assetName;
      }

      marker.on('mouseover', () => {
        L.popup({ autoClose: true })
          .setLatLng(latlng)
          .setContent(msg)
          .openOn(this.map);
      });

      marker.on('mouseout', () => {
        this.map.closePopup();
      });

      this.ambulance[ambList[i]['assetId']] = marker;
    }

    // ===========================
    // REMOVE SPREAD ONLY ON ZOOM
    // ===========================
    if (!this.zoomListenerAdded) {
      this.zoomListenerAdded = true;

      this.map.on('zoomstart', () => {
        this.spreadMarkers.forEach(m => this.map.removeLayer(m));
        this.spreadMarkers = []; ''
      });
    }
  }
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
  // initAutocomplete(): void {
  //   this.googleMapsLoader.load(this.googleKey).then(() => {
  //   const input = document.getElementById('autocomplete') as HTMLInputElement;
  //   const autocompleteOptions: any = {};
  //   if (this.data && this.data.biasLatLng) {
  //     const biasLatLng = new google.maps.LatLng(this.data.biasLatLng.lat, this.data.biasLatLng.lng);
  //     autocompleteOptions.bounds = new google.maps.Circle({
  //       center: biasLatLng,
  //       radius: 200000
  //     }).getBounds();
  //   }
  //   const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
  //   autocomplete.addListener('place_changed', () => {
  //     const place = autocomplete.getPlace();
  //     if (!place.geometry || !place.geometry.location) {
  //       alert('No details available for input: ' + place.name);
  //       return;
  //     }
  //     const lat = place.geometry.location.lat();
  //     const lng = place.geometry.location.lng();
  //     if(this.selectLatLng) {
  //       this.map.removeLayer(this.selectLatLng);
  //       this.map.removeLayer(this.selectCircle);
  //     }
  //     this.commitLatLong = [lat, lng];
  //     this.searchLatLang = {'latlng':{'lat': lat,'lng': lng, 'label': place.formatted_address}}
  //     this.formattedAddress = place.formatted_address;
  //     this.selectLatLng = L.marker(this.commitLatLong).addTo(this.map);
  //     this.map.setView(this.commitLatLong, 15);
  //     this.selectCircle = L.circle(this.commitLatLong, {
  //       color: "red",
  //       fillColor: "#f03",
  //       fillOpacity: 0.5,
  //       radius: parseFloat(this.threshold)
  //     }).addTo(this.map);
  //     this.selectCircle.on('click', (e: any) => {
  //       const currentZoom = this.map.getZoom();
  //       this.getLatLong('d', {
  //         latlng: e.latlng,
  //         type: 'click'
  //       });
  //       setTimeout(() => {
  //         this.map.setZoom(currentZoom);
  //       },0);
  //     });
  //     this.map.setView([lat, lng], 13);
      
  //     this.selectLatLng.setLatLng([lat, lng]).bindPopup(place.formatted_address).openPopup();
  //   });
  //   });
  // }
  getLocationDetail(threshold) {

    if (this.fixed_latlong.length > 0) {
      let greenIcon1 = '';
      if (this.data["data"]["alertType"] == null) {
        greenIcon1 = L.icon({
          iconUrl: 'assets/AlertIcons/safezone.svg',
          iconSize: [20, 20], iconAnchor: [10, 10]
        });
      } else {
        greenIcon1 = L.icon({
          iconUrl: 'assets/AlertIcons/' + this.data["data"]["alertType"] + '.svg',
          iconSize: [20, 20], iconAnchor: [10, 10]
        });
      }
      let sourceMarker1 = L.marker(this.fixed_latlong).addTo(this.map);
      sourceMarker1.bindPopup("<b>Name :</b>" + this.data["data"]["firstName"] + "<br> <b>Mobile No :</b>" + this.data["data"]["mobileNumber"] + "<br> <b>LatLong :</b>" + this.data["data"]["location"]);
      sourceMarker1.setIcon(greenIcon1);
      this.map.setView(this.fixed_latlong, 15);
      if (threshold != null) {
        this.selectCircle = L.circle(this.fixed_latlong, {
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.5,
          radius: parseFloat(threshold)
        }).addTo(this.map);
        this.selectCircle.on('click', (e: any) => {
          const currentZoom = this.map.getZoom();
          this.getLatLong('d', {
            latlng: e.latlng,
            type: 'click'
          });
          setTimeout(() => {
            this.map.setZoom(currentZoom);
          },0);
        });
      }
    }

    if (this.current_latlong.length > 0) {
      const greenIcon2 = L.icon({
        iconUrl: this.icon2,
        iconSize: [20, 20], iconAnchor: [10, 10]
      });
      let sourceMarker2 = L.marker(this.current_latlong).addTo(this.map);
      sourceMarker2.bindPopup("<b>LatLong :</b>" + this.current_latlong[0].toString() + ',' + this.current_latlong[1].toString());
      sourceMarker2.setIcon(greenIcon2);
      this.map.setView(this.current_latlong, 15);
    }
  }
  mapLatLong(value ?: string) {
    const providerParams: any = {
      key: this.googleKey,
    };
    if (this.data && this.data.biasLatLng) {
      const dLat = 2;
      const dLng = 2;
      providerParams.bounds = `${this.data.biasLatLng.lat - dLat},${this.data.biasLatLng.lng - dLng}|${this.data.biasLatLng.lat + dLat},${this.data.biasLatLng.lng + dLng}`;
    }
    const provider = new GoogleProvider({
      params: providerParams,
    });
    if(this.data.searchText !== null && this.data.searchText !== '' && this.searchedLatLng === null) {
      const result = provider.search({ query: value });
      result.then(e => {
        if(e.length !== 0) {
          let results = e;
          if (this.data && this.data.biasLatLng) {
            results = [...e].sort((a, b) => {
              const distA = Math.pow(a.y - this.data.biasLatLng.lat, 2) + Math.pow(a.x - this.data.biasLatLng.lng, 2);
              const distB = Math.pow(b.y - this.data.biasLatLng.lat, 2) + Math.pow(b.x - this.data.biasLatLng.lng, 2);
              return distA - distB;
            });
          }
          this.searchLatLang = {'latlng':{'lat': results[0].y,'lng': results[0].x, 'label': results[0].label}}
        }
        if(this.searchLatLang){
          this.getLatLong(null, this.searchLatLang );
        }
      });
    }
    this.searchControl = new GeoSearchControl({
      provider: provider,
      autoclose: true,
      style: 'bar'
    });
    this.map.addControl(this.searchControl);
    this.map.on('geosearch/showlocation', e => {
      this.map.removeLayer(this.selectLatLng);
      this.map.removeLayer(this.selectCircle);
      this.commitLatLong = [e.location.y, e.location.x];
      this.searchLatLang = {'latlng':{'lat': e.location.y,'lng': e.location.x, 'label': e.location.label}}
      this.formattedAddress = e.location.label;
      this.selectLatLng = L.marker(this.commitLatLong).addTo(this.map);
      this.map.setView(this.commitLatLong, 15);
      this.selectCircle = L.circle(this.commitLatLong, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: parseFloat(this.threshold)
      }).addTo(this.map);
      this.selectCircle.on('click', (e: any) => {
        const currentZoom = this.map.getZoom();
        this.getLatLong('d', {
          latlng: e.latlng,
          type: 'click'
        });
        setTimeout(() => {
          this.map.setZoom(currentZoom);
        },0);
      });
    });
  }

  getLatLong(data1, data) {
    this.searchControl.getContainer().onclick = e => { e.stopPropagation(); };
    if (data1 === 'd') {
      const latlng = [data.latlng.lat, data.latlng.lng];
      const provider = new GoogleProvider({
        params: {
          key: this.googleKey,
          latlng: latlng,
        },
      });
      const result = provider.search({ query: '' });
      result.then(e => {
        if(e.length !== 0) {
          this.formattedAddress = e[0].raw.formatted_address;
        } else {
          this.formattedAddress = null;
        }
      });
    } else {
      const provider = new GoogleProvider({
        params: {
          key: this.googleKey,
        },
      });
      const result = provider.search({ query: this.data.searchText });
      result.then(e => {
        if(e.length !== 0) {
          this.formattedAddress = e[0].raw.formatted_address;
        } else {
          this.formattedAddress = null;
        }
      });
    }
    if (this.commitLatLong.length > 0) {
      this.map.removeLayer(this.selectLatLng);
    }
    if (this.threshold != null && this.commitLatLong.length > 0) {
      this.map.removeLayer(this.selectCircle);
    }
    this.commitLatLong = [data.latlng.lat, data.latlng.lng];
    if(data.type !== 'click') {
      this.searchLatLang = {'latlng':{'lat': data.latlng.lat,'lng': data.latlng.lng, 
      'label': this.searchText !== null ? this.searchText : data.latlng.label}};
    } else {
      this.searchLatLang = {'latlng':{'lat': data.latlng.lat,'lng': data.latlng.lng, 
      'label': this.searchText !== null ? this.searchText : 
      (this.searchLatLang ? this.searchLatLang.latlng.label : null)}};
    }
    const icon = L.icon({
      iconUrl: this.icon1,
      iconSize: [30, 30], iconAnchor: [15, 23],
    });
    this.selectLatLng = L.marker(this.commitLatLong).addTo(this.map);
    this.selectLatLng.setIcon(icon);
    if(data?.type !== 'click') {
      this.map.setView(this.commitLatLong, 15);
    } else {
      this.map.setView(this.commitLatLong, this.map.getZoom());
    }
    if(data.type !== 'click' && this.searchedLatLng === null
    && this.searchLatLang && this.searchLatLang.latlng.label !== null &&
     this.searchLatLang.latlng.label !== ''){
      const popup = L.popup({autoClose: false})
          .setLatLng(this.commitLatLong)
          .setContent(this.searchLatLang.latlng.label)
          .openOn(this.map);
    }
    if (this.threshold != null) {
      this.selectCircle = L.circle(this.commitLatLong, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: parseFloat(this.threshold)
      }).addTo(this.map);
      this.selectCircle.on('click', (e: any) => {
        const currentZoom = this.map.getZoom();
        this.getLatLong('d', {
          latlng: e.latlng,
          type: 'click'
        });
        setTimeout(() => {
          this.map.setZoom(currentZoom);
        },0);
      });
    }
    if(this.data.availableAmbulance) {
      let ambList = this.data.availableAmbulance;
      this.ambulanceBind(ambList)      
    }
  }

  commitLatLongClose(data) {
    if(data) {
      data['formattedAddress'] = this.formattedAddress;
    }
    this.thisDialogRef.close(data);
  }

  onWindowResizedWidth(size) {
    if(this.map) {
      this.map.invalidateSize();
    }
    this.popWidth = size - 50;
  }
  onWindowResized(size) {
    if(this.map) {
      this.map.invalidateSize();
    }
    this.popHeight = size;
    if(size >= 1218) {
      this.contentHeight = size - 150;
    } else {
      this.contentHeight = size - 140;
    }
  }
}

@Component({
  selector: 'app-google-map-direction',
  templateUrl: './google-map-direction.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapDirectionComponent  implements OnInit {
  urlSafe: SafeResourceUrl;  
  popWidth: number;
  popHeight: number;
  contentHeight: number;
  trackLocation: any;

  constructor(public thisDialogRef: MatDialogRef<GoogleMapComponent>, @Inject(MAT_DIALOG_DATA) public data: any, 
  public sanitizer: DomSanitizer, private readonly commonService: CommonService) { }

  ngOnInit() {
    this.commonService.getConfigFile('google').subscribe(res => {
      if (res.results != null) {
        this.trackLocation += '?key=' + res.results.contentObject['API_KEY'];
        localStorage.setItem('API_KEY', res.results.contentObject['API_KEY']);
      }
    });
    if (this.data.googleDirectioAPI !== null) {
      this.trackLocation = this.data.googleDirectioAPI;
    }
    if (this.data.origin !== null && this.data.origin !== '') {
      this.trackLocation += '&origin=' + this.data.origin;
    }
    if (this.data.destination !== null && this.data.destination !== '') {
      this.trackLocation += '&destination=' + this.data.destination;
    }
    if (this.data.waypoints !== null && this.data.waypoints !== '') {
      this.trackLocation += '&waypoints=' + this.data.waypoints;
    }
    if (this.data.origin !== null && this.data.origin !== '' && this.data.destination !== null && this.data.destination !== '') {
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.trackLocation + '&avoid=tolls|highways');
    }
  }

  onWindowResizedWidth(size) {
    this.popWidth = size - 60;
  }
  onWindowResized(size) {
    this.popHeight = size;
    if(size >= 1218) {
      this.contentHeight = size - 150;
    } else {
      this.contentHeight = size - 140;
    }
  }
}
@Component({
  selector: 'app-google-map-marker',
  templateUrl: './google-map-marker.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapMarkerComponent implements OnInit, OnDestroy{
  lat: number;
  lng: number;
  popWidth: number;
  popHeight: any;
  contentHeight: number;
  markers = [];
  originLat: number;
  originLng: number;
  public ambulanceIcon = 'assets/Alert/common_icons/small-circle-ambulance-green.png';
  public hospitalIcon = 'assets/Alert/common_icons/hospital-marker.png';
  public patientIcon = 'assets/Alert/common_icons/patient-marker.png';
  tagId = null;
  googleMapWayPoints = null;
  public subscription: Subscription;
  interval: any;
  waypointsLat: number;
  waypointsLng: number;
  waypoints: { location: { lat: number; lng: number; }; stopover: boolean; }[];
  renderOptions: any;
  markerOptions = null;
  client: any;
  // public infoWindow: AgmInfoWindow = undefined
  set1: any=[];
  set2: any=[];
  directions=[];
  getSets = false;
  toggleMap = true;
  googleKey = null;
  showMap = false;

  constructor(public thisDialogRef: MatDialogRef<GoogleMapComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
  private readonly commonService: CommonService, public datepipe : DatePipe) {
    commonService.getConfigFile('google').subscribe(res => {
      if (res.results != null) {
        this.googleKey = res.results.contentObject['map']['API_KEY'];
        localStorage.setItem('API_KEY', this.googleKey);
      }
    });
   }

  ngOnInit() {
    if(this.googleKey !== null){
      this.showMap = true;
    }
    this.tagId = this.data.tagId;

    const loc = this.data.destination.split(',');
    this.lat = parseFloat(loc[0]);
    this.lng = parseFloat(loc[1]);

    const origin = this.data.waypoints.split(',');
    this.originLat = parseFloat(origin[0]);
    this.originLng = parseFloat(origin[1]);

    const waypoints = this.data.origin.split(',');
    this.waypointsLat = parseFloat(waypoints[0]);
    this.waypointsLng = parseFloat(waypoints[1]);
    this.waypoints = [
      {
        location: { lat: this.waypointsLat, lng: this.waypointsLng },
        stopover: false,
      }
    ]

    this.markerOptions = {
      origin: {
          icon: this.ambulanceIcon,
      },
      waypoints: {
          icon: this.patientIcon,
      },
      destination: {
          icon: this.hospitalIcon,
      }
    }
    this.markers = [
      {
        lat: this.waypointsLat,
        lng: this.waypointsLng,
        draggable: false,
        url: this.patientIcon
      }
    ]
    if(this.data.reqStatus === 'RQ-CO' || this.data.reqStatus === 'RQ-RJ') {
      const loc = this.data.destination.split(',');
      this.lat = parseFloat(loc[0]);
      this.lng = parseFloat(loc[1]);

      const origin = this.data.origin.split(',');
      this.originLat = parseFloat(origin[0]);
      this.originLng = parseFloat(origin[1]);

      const waypoints = this.data.destination.split(',');
      this.waypointsLat = parseFloat(waypoints[0]);
      this.waypointsLng = parseFloat(waypoints[1]);

      let points = this.data.reqDetail.Distance !== null && this.data.reqDetail.Distance !== 0 ? this.data.reqDetail.Distance * 20 : 20;
      let actualTime = this.datepipe.transform(this.data.reqDetail.actualTime, 'yyyy-MM-dd HH:mm');
      let actualDropTime = this.datepipe.transform(this.data.reqDetail.actualDropTime, 'yyyy-MM-dd HH:mm');
      let arrivalTime = this.datepipe.transform(this.data.reqDetail.arrivalTime, 'yyyy-MM-dd HH:mm');
      this.commonService.getGeoPath(actualTime, actualDropTime, this.data.reqDetail.ambulanceId, arrivalTime, points).subscribe(res=> {
        if(res.results.statusCode === 200) {
          this.getSets = true;
          this.waypoints = [];
          this.set1 = [];
          const nodes = res.results.data.set1;
          for(let i=0; i<nodes.length; i++) {
            if(nodes.length !== 0) {
              this.set1.push({
              location: { lat: nodes[i].lat, lng: nodes[i].lng },
              stopover: false,
              });
            }
          }
          this.set2 = [];
          const nodes1 = res.results.data.set2;
          this.set2.push({location: { lat: this.originLat, lng: this.originLng},stopover: false});
          for(let i=0; i<nodes1.length; i++) {
            if(nodes1.length !== 0) {
              this.set2.push({
              location: { lat: nodes1[i].lat, lng: nodes1[i].lng },
              stopover: false,
              });
            }
          }
          this.set2.push({location: { lat: this.lat, lng: this.lng},stopover: false});
          this.directions=[{
            waypoints: this.set1
          },
          {
          waypoints: this.set2
          }
        ]
        } else {
          this.getSets = false;
          this.waypoints = [
            {
              location: { lat: this.waypointsLat, lng: this.waypointsLng },
              stopover: false,
            }
          ],
          this.directions= [{
            waypoints: this.waypoints,
            renderOptions: {
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: { strokeColor: '#808080' }
            }
          }]
        }
      });

      this.markerOptions = {
        origin: {
            icon: this.patientIcon,
            infoWindow : 
            "<div style='font-weight:600;'>Pickup Details : </div><br>" + 
            "<div>Time : " + this.datepipe.transform(this.data.reqDetail["actualPickupTime"], 'hh:mm a, d MMM') +"</div>" +
            "<div>Location : " + this.data.reqDetail["Pickup"] + "</div>"
        },
        destination: {
            icon: this.hospitalIcon,
            infoWindow : 
            "<div style='font-weight:600;'>Drop Details : </div><br>" + 
            "<div>Time : " + this.datepipe.transform(this.data.reqDetail["actualDropTime"], 'hh:mm a, d MMM') +"</div>" +
            "<div>Location : " + this.data.reqDetail["Drop"] + "</div>"
        }
      }
      this.markers = [];
    }
    
    if(this.data.reqStatus !== 'RQ-CO') {
      this.renderOptions = {
        suppressMarkers: true,
        preserveViewport: true,
      }
    }
    if(this.data.reqStatus !== 'RQ-CO' && this.data.reqStatus !== 'RQ-RJ') {
      this.getMqtt();
    }
  }
  
  getMqtt() {
    if(this.client) {
        this.client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res=> {
        if (res.results != null && res.results.length) {
          let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
          let cloudConnect = {
              protocol        : brokerInfo[0]['wprotocol'],
              host            : brokerInfo[0]['host'],
              password        : brokerInfo[0]['password'],
              username        : brokerInfo[0]['username'],
              port            : brokerInfo[0]['wport'],
              connectTimeout  : 30000,
              keepalive       : 60
          }
            this.client = connect(cloudConnect);
            this.subscribeData()
        } else {
            res.message = 'mqtt ' + res.message;
        }
    })
  }
  subscribeData(){
    if(this.client) {
        this.client.subscribe('tw/r/gloc/#');
        this.client.on('message', (topic, message, packet) => {
              let msg = message.toString();
              let tagData = JSON.parse('[' + msg + ']')
              tagData = tagData[0]
              if(tagData.tag_id === this.tagId) {
                if(tagData.lat.toFixed(3) !== this.originLat.toFixed(3) || tagData.lng.toFixed(3) !== this.originLng.toFixed(3)) {
                  this.originLat = tagData.lat;
                  this.originLng = tagData.lng;
                }
              }
        });
    }
  }
  checkInterval() {
    clearInterval(this.interval);
    this.interval = setInterval(val => this.getGoogleDirectionMultiPath(), environment.base_value.set_geo_loc_interval);
  }
  ngOnDestroy(): void {
    if(this.client) {
      this.client.end(true);
    }
    clearInterval(this.interval);
  }
  getGoogleDirectionMultiPath() {
    this.checkInterval();
    if(this.tagId !== null) {
      this.commonService.getGeoLocation(this.tagId).subscribe(res => {
        if(res.results.data.length !== 0) {
          const latLng = res.results.data;
          const geo = latLng[0];
          this.googleMapWayPoints = geo.lat + ',' + geo.lng;
          if(this.googleMapWayPoints !== null) {
            const origin = this.googleMapWayPoints.split(',');
            this.originLat = parseFloat(origin[0]);
            this.originLng = parseFloat(origin[1]);
          }
        }
      });
    }
  }
  onWindowResizedWidth(size) {
    this.popWidth = size - 60;
  }
  onWindowResized(size) {
    this.popHeight = size;
    if(size >= 1218) {
      this.contentHeight = size - 150;
    } else {
      this.contentHeight = size - 140;
    }
  }
}
