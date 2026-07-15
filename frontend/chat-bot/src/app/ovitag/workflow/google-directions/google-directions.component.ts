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

import { Component,  ViewChild, ElementRef, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../shared';
import { DatePipe } from '@angular/common';
import { StyleLoaderService } from '../../../shared/services/style-loader.service ';
import { connect, MqttClient } from 'mqtt';
import { GoogleMapsLoaderService } from '../../../shared/modules/entry-component/google-map/google-map.component';


declare let google: any;
@Component({
  selector: 'app-google-directions',
  templateUrl: './google-directions.component.html',
  styleUrls: ['./google-directions.component.scss']
})
export class GoogleDirectionsComponent implements OnInit, OnDestroy {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  map: any;
  directionsService: any;
  directionsRenderer: any;
  googleKey = null;
  tagId = null;
  marker: any;
  customMarker = null
  lat = null;
  lng = null;
  lastMqttUpdateTime: Date | null = null;
  private _client: MqttClient;
  requestDetails : any;
  origin: string = '13.0827, 80.2707';
  destination: string = '13.0500, 80.2824';
  completedWayPoints = [];
  geoLocationInterval: any;
  public ambulanceIcon = 'assets/Alert/common_icons/small-circle-ambulance-green.png';
  public hospitalIcon = 'assets/Alert/common_icons/hospital-marker.png';
  public patientIcon = 'assets/Alert/common_icons/patient-marker.png';
  mqttWatchdogInterval: any;
  lastRouteRequestTime = 0;
  minRouteRefreshInterval = 15000; // ms — min gap between Directions API recomputes

  constructor(public thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService, public datepipe: DatePipe,
    private readonly styleLoader: StyleLoaderService, private googleMapsLoader : GoogleMapsLoaderService) {
    commonService.getConfigFile('google').subscribe(res => {
      if (res.results != null) {
        this.googleKey = res.results.contentObject['map']['API_KEY'];
        localStorage.setItem('API_KEY', this.googleKey);
        this.styleLoader.loadStyleByType('google')
        this.googleMapsLoader.load(this.googleKey).then(() => { });    
        setTimeout(() => { this.initMap() }, 1000); 
      }
    });
  }

  ngOnInit() {
    if(this.data.hasOwnProperty('reqDetail')) {
      this.tagId = this.data.reqDetail.tagId
    }
    this.getMqtt();
    this.requestDetails = this.data.reqDetail;
  }

  ngAfterViewInit() {
    setTimeout(() => {this.initMap() }, 1000); 
  }

  initMap() {
    const mapOptions = {
      center: new google.maps.LatLng(12.9716, 77.5946),
      zoom: 7,
      streetViewControl: false,
      mapTypeControl: false,    
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeOpacity: 1,
        strokeWeight: 5
      }
    });
    this.directionsRenderer.setMap(this.map);
    if(this.data) {
      if (this.data.reqStatus === 'RQ-CO') {
    let actualTime = this.datepipe.transform(this.data.reqDetail.startedDatetime, 'yyyy-MM-dd HH:mm');
    let actualDropTime = this.datepipe.transform(this.data.reqDetail.endTime, 'yyyy-MM-dd HH:mm');
    this.commonService.getCompletedPath(actualTime, actualDropTime, this.data.reqDetail.ambulanceId).subscribe(res=> {
      if(res.results.statusCode === 200) {
        this.completedWayPoints = res.results?.data?.set1;
        if (this.completedWayPoints?.length >= 2) {
          this.drawCompletedRoute();
        } else {
          this.googleDirection();
        }
      } else {
        this.googleDirection();
      }
    });
      } else {
        this.googleDirection();
        this.startMqttWatchdog();
      }
    }
  }

  isMqttStale(): boolean {
    if (!this.lastMqttUpdateTime) return true;

    const diff = Date.now() - this.lastMqttUpdateTime.getTime();
    return diff > 20 * 1000;
  }

  startMqttWatchdog() {
    this.mqttWatchdogInterval = setInterval(() => {
      if (this.data.reqStatus === 'RQ-CO') {
        this.stopGeoPolling();
        return;
      }

      if (this.isMqttStale()) {
        this.startGeoPolling();
      } else {
        this.stopGeoPolling();
      }
    }, 5000);
  }

  startGeoPolling() {
    if (this.geoLocationInterval) return; 
    this.geoLocationInterval = setInterval(() => {
      this.commonService.getGeoLocation(this.data.reqDetail.tagId).subscribe(res => {
        if (res.results.data.length !== 0) {
          let latLng = res.results.data;
          let geo = latLng[latLng.length - 1];
          console.log(geo)
          this.lat = geo.lat;
          this.lng = geo.lng;
          // const now = Date.now();
          // if (now - this.lastRouteRequestTime < this.minRouteRefreshInterval) {
          //   return; // throttled — skip this recompute, next tick will use latest lat/lng
          // }
          // this.lastRouteRequestTime = now;
          this.addCustomMarker(this.lat, this.lng);
        }
      });
    }, 30000);
  }

  stopGeoPolling() {
    if (this.geoLocationInterval) {
      clearInterval(this.geoLocationInterval);
      this.geoLocationInterval = null;
    }
  }

  googleDirection() {
    let src = this.data.origin;
    let dest = this.data.destination;
    if(this.isMqttStale() && this.data?.lastGeoData && this.data.reqStatus !== 'RQ-CO') {
      this.lat = this.data.lastGeoData.lat;
      this.lng = this.data.lastGeoData.lng;
      this.lastRouteRequestTime = Date.now();
      this.getDirections(src, dest, { lat: this.lat, lng: this.lng });
      return;
    } else if(this.data.waypoints) {
      [this.lat, this.lng] = this.data.waypoints.split(',').map(Number);
      this.lastRouteRequestTime = Date.now();
      this.getDirections(src, dest, { lat: this.lat, lng: this.lng });
      return;
    }
    this.getDirections(src, dest);
  }

  drawCompletedRoute() {
    if (!this.completedWayPoints || this.completedWayPoints.length < 2) {
      return;
    }

    const firstPoint = this.completedWayPoints[0];
    const origin = new google.maps.LatLng(
      Number(firstPoint.lat),
      Number(firstPoint.lng)
    );

    const midPoint = new google.maps.LatLng(
      Number(this.data.origin.split(',')[0]),
      Number(this.data.origin.split(',')[1])
    );

    const destination = new google.maps.LatLng(
      Number(this.data.destination.split(',')[0]),
      Number(this.data.destination.split(',')[1])
    );

    const waypoints = [
      {
        location: midPoint,
        stopover: true
      }
    ];

    const request = {
      origin,
      destination,
      waypoints,
      optimizeWaypoints: false,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request, (result: any, status: any) => {

      if (status === 'OK') {
        const route = result.routes[0];
        const leg = route.legs[0];
        const greenPath = leg.steps.flatMap((step: any) => step.path);
        new google.maps.Polyline({
          path: greenPath,
          map: this.map,
          strokeColor: '#f25454',
          strokeOpacity: 1,
          strokeWeight: 4,
          zIndex: 999
        });
        this.directionsRenderer.setDirections(result);
        const bounds = new google.maps.LatLngBounds();
        result.routes[0].legs.forEach((leg: any) => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        this.map.fitBounds(bounds);
        //approach 1
        // const routePath = result.routes[0].overview_path;
        // this.completedWayPoints.forEach((point: any, index: number) => {
        //   const lat = Number(point.lat);
        //   const lng = Number(point.lng);
        //   const snappedPosition = this.getNearestPoint(
        //     routePath,
        //     lat,
        //     lng
        //   );
        //   let bestIndex = 0;
        //   let minDist = Infinity;
        //   routePath.forEach((p: any, idx: number) => {
        //     const d = google.maps.geometry.spherical.computeDistanceBetween(
        //       p,
        //       snappedPosition
        //     );

        //     if (d < minDist) {
        //       minDist = d;
        //       bestIndex = idx;
        //     }
        //   });
        //   const prev = routePath[Math.max(bestIndex - 1, 0)];
        //   const next = routePath[Math.min(bestIndex + 1, routePath.length - 1)];
        //   const heading = google.maps.geometry.spherical.computeHeading(
        //     prev,
        //     next
        //   );
        //   const side = index % 2 === 0 ? 1 : -1;
        //   const offsetMeters = 2;
        //   const finalPosition = google.maps.geometry.spherical.computeOffset(
        //     snappedPosition,
        //     offsetMeters,
        //     heading + (90 * side)
        //   );
        //   const div = document.createElement("div");
        //   div.innerHTML = `
        //   <div style="
        //     background:#1a73e8;
        //     color:#fff;
        //     padding:3px 8px;
        //     border-radius:12px;
        //     font-size:11px;
        //     font-weight:600;
        //     white-space:nowrap;
        //     box-shadow:0 1px 3px rgba(0,0,0,0.3);
        //   ">
        //     ${point.distance}
        //   </div>
        // `;

        //   const overlay = new google.maps.OverlayView();
        //   overlay.onAdd = function () {
        //     const panes = this.getPanes();
        //     panes.overlayMouseTarget.appendChild(div);
        //   };

        //   overlay.draw = function () {
        //     const projection = this.getProjection();
        //     const position = projection.fromLatLngToDivPixel(finalPosition);

        //     if (position) {
        //       div.style.position = "absolute";
        //       div.style.left = position.x + "px";
        //       div.style.top = position.y + "px";
        //       div.style.transform = "translate(-50%, -50%)";
        //     }
        //   };

        //   overlay.setMap(this.map);
        // });
        //approach 2
        // const routePath = result.routes[0].overview_path;
        // this.completedWayPoints.forEach((point: any, index: number) => {

        //   const snappedPosition = this.getNearestPoint(
        //     routePath,
        //     Number(point.lat),
        //     Number(point.lng)
        //   );
        //   const i = routePath.indexOf(snappedPosition);
        //   const prev = routePath[i - 1] || routePath[i];
        //   const next = routePath[i + 1] || routePath[i];
        //   const heading = google.maps.geometry.spherical.computeHeading(prev, next);
        //   // SIDE SHIFT (LEFT/RIGHT of road)
        //   const side = index % 2 === 0 ? 1 : -1;
        //   const offsetMeters = 2;
        //   const finalPosition = google.maps.geometry.spherical.computeOffset(
        //     snappedPosition,
        //     offsetMeters,
        //     heading + (90 * side)   // perpendicular shift
        //   );
        //   const div = document.createElement('div');
        //   div.innerHTML = `
        //     <div style="
        //       background:#1a73e8;
        //       color:#fff;
        //       padding:3px 8px;
        //       border-radius:12px;
        //       font-size:11px;
        //       font-weight:600;
        //       white-space:nowrap;
        //       box-shadow:0 1px 3px rgba(0,0,0,0.3);
        //     ">
        //       ${point.distance}
        //     </div>
        //   `;
        //   const overlay = new google.maps.OverlayView();
        //   overlay.onAdd = function () {
        //     this.getPanes().overlayLayer.appendChild(div);
        //   };
        //   overlay.draw = function () {
        //     const proj = this.getProjection();
        //     const pos = proj.fromLatLngToDivPixel(finalPosition);
        //     if (pos) {
        //       div.style.position = 'absolute';
        //       div.style.left = pos.x + 'px';
        //       div.style.top = pos.y + 'px';
        //       div.style.transform = 'translate(-50%, -100%)';
        //     }
        //   };
        //   overlay.setMap(this.map);
        // });
        const infoWindow = new google.maps.InfoWindow();
        const startMarker = new google.maps.Marker({
          position: origin,
          map: this.map,
          icon: {
            url: this.ambulanceIcon,
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        startMarker.addListener('mouseover', () => {
          infoWindow.setContent(`<div style="font-size:11px;padding:2px 5px;white-space: nowrap;">${this.data.reqDetail?.ambulanceName}</div>`);
          infoWindow.open(this.map, startMarker);
          setTimeout(() => {
            const closeBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement;
            if (closeBtn) { closeBtn.style.display = 'none'; }
          }, 0);
        });
        startMarker.addListener('mouseout', () => {
          infoWindow.close();
        });
        const midMarker = new google.maps.Marker({
          position: midPoint,
          map: this.map,
          // label: 'A'
          icon: {
            url: this.data?.reqDetail?.sourceGeoCoordinate?.hasOwnProperty('landmark') ? this.patientIcon : this.hospitalIcon,
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        midMarker.addListener('mouseover', () => {
          infoWindow.setContent(`<div style="font-size:11px;padding:2px 5px;white-space: nowrap;">${this.data.reqDetail?.sourceAddress}</div>`);
          infoWindow.open(this.map, midMarker);
          setTimeout(() => {
            const closeBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement;
            if (closeBtn) { closeBtn.style.display = 'none'; }
          }, 0);
        });
        midMarker.addListener('mouseout', () => {
          infoWindow.close();
        });
        const destinationMarker = new google.maps.Marker({
          position: destination,
          map: this.map,
          icon: {
            url: this.data?.reqDetail?.destinationGeoCoordinate?.hasOwnProperty('landmark') ? this.patientIcon : this.hospitalIcon,
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        destinationMarker.addListener('mouseover', () => {
          infoWindow.setContent(`<div style="font-size:11px;padding:2px 5px;white-space: nowrap;">${this.data.reqDetail?.destinationAddress}</div>`);
          infoWindow.open(this.map, destinationMarker);
          setTimeout(() => {
            const closeBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement;
            if (closeBtn) { closeBtn.style.display = 'none'; }
          }, 0);
        });

        destinationMarker.addListener('mouseout', () => {
          infoWindow.close();
        });
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }

  getNearestPoint(routePath: any[], lat: number, lng: number) {
    let minDist = Infinity;
    let nearest = routePath[0];
    const target = new google.maps.LatLng(lat, lng);
    routePath.forEach(p => {
      const d = google.maps.geometry.spherical.computeDistanceBetween(
        target,
        p
      );
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    });
    return nearest;
  }

  // addCustomMarker(lat, lng) {
  //   this.removeCustomMarker();
  //   const position = new google.maps.LatLng(lat, lng);
  //   this.customMarker = new google.maps.Marker({
  //     position: position,
  //     map: this.map,
  //     title: this.data.reqDetail.tagId,
  //     icon: {
  //       url: 'assets/Alert/common_icons/small-circle-ambulance-green.png',
  //       scaledSize: new google.maps.Size(40, 40), // Optional: resize icon
  //     }
  //   });
    
  // }

  addCustomMarker(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    const position = new google.maps.LatLng(lat, lng);
    this.placeAmbulanceMarker(position);
  }

  placeAmbulanceMarker(position: any) {
    this.removeCustomMarker();
    this.customMarker = new google.maps.Marker({
      position: position,
      map: this.map,
      title: this.data.reqDetail.tagId,
      icon: {
        url: 'assets/Alert/common_icons/small-circle-ambulance-green.png',
        scaledSize: new google.maps.Size(40, 40), // Optional: resize icon
      }
    });
  }

  removeCustomMarker() {
    if (this.customMarker) {
      this.customMarker.setMap(null);
      this.customMarker = null;
    }
  }

  getDirections(src?, dest?, waypointPos?: { lat: number, lng: number }) {
    let origin = null;
    let destination = null;
    if (src == null) {
      const [originLat, originLng] = this.origin.split(',').map(Number);
      const [destLat, destLng] = this.destination.split(',').map(Number);
      origin = new google.maps.LatLng(originLat, originLng);
      destination = new google.maps.LatLng(destLat, destLng);
    } else {
      const [originLat, originLng] = src.split(',').map(Number);
      const [destLat, destLng] = dest.split(',').map(Number);
      origin = new google.maps.LatLng(originLat, originLng);
      destination = new google.maps.LatLng(destLat, destLng);
    }

    const request: any = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    if (waypointPos) {
      request.waypoints = [{
        location: new google.maps.LatLng(waypointPos.lat, waypointPos.lng),
        stopover: true
      }];
      request.optimizeWaypoints = false;
    }

    this.directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          const zoom = this.map.getZoom();
          const center = this.map.getCenter();

          this.directionsRenderer.setDirections(result);

          this.map.setCenter(center);
          this.map.setZoom(zoom);
          new google.maps.Marker({
            position: origin,
            map: this.map,
            icon: {
              url: this.data?.reqDetail?.sourceGeoCoordinate?.hasOwnProperty('landmark') ? this.patientIcon : this.hospitalIcon,
              scaledSize: new google.maps.Size(40, 40)
            }
          });
          new google.maps.Marker({
            position: destination,
            map: this.map,
            icon: {
              url: this.data?.reqDetail?.destinationGeoCoordinate?.hasOwnProperty('landmark') ? this.patientIcon : this.hospitalIcon,
              scaledSize: new google.maps.Size(40, 40)
            }
          });

          if (waypointPos) {
            const snappedAmbulancePos = result.routes[0].legs[0].end_location;
            this.placeAmbulanceMarker(snappedAmbulancePos);
          }
        } else {
        alert('Failed to get route: ' + status);
        }
    });
  }
  getMqtt() {
    if (this._client) {
      this._client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res => {
      if (res.results?.length) {
        let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
        let cloudConnect = {
          protocol: brokerInfo[0]['wprotocol'],
          host: brokerInfo[0]['host'],
          password: brokerInfo[0]['password'],
          username: brokerInfo[0]['username'],
          port: brokerInfo[0]['wport'],
          connectTimeout: 30000,
          keepalive: 60
        }
        this._client = connect(cloudConnect);
        this.mqttSubscribe()
      }
    })
  }
  mqttSubscribe() {
    if (this._client) {
      this._client.subscribe('tw/r/gloc/#');
      this._client.on('message', (topic, message) => {
        const msg = message.toString();
        let tagData = JSON.parse('[' + msg + ']')
        tagData = tagData[0];
        if (tagData.tag_id == this.tagId && this.data.reqStatus !== 'RQ-CO') {
          this.lastMqttUpdateTime = new Date();
          this.stopGeoPolling();
          if (tagData.lat?.toFixed(5) !== this.lat?.toFixed(5) || tagData.lng?.toFixed(5) !== this.lng?.toFixed(5)) {
            this.lat = tagData.lat;
            this.lng = tagData.lng;
            this.addCustomMarker(this.lat, this.lng)
            
          }
        }
      })
    }
  }
  ngOnDestroy(): void {
    if(this._client) {
      this._client.end(true);
    }
    this.stopGeoPolling();
    if (this.mqttWatchdogInterval) {
      clearInterval(this.mqttWatchdogInterval);
    }
  }
  
}
