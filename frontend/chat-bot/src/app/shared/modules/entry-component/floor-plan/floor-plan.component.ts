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
import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, DoCheck } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService, DashboardService, HospitalService } from '../../../services';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';
import { environment } from './../../../../../environments/environment';
import { StyleLoaderService } from '../../../services/style-loader.service ';

@Component({
  selector: 'app-floor-planmap',
  templateUrl: './floor-plan.component.html',
  styleUrls: ['./floor-plan.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FloorPlanmapComponent implements OnInit, DoCheck {
  @Input() fxFlex: number;
  @Output() childToParentAction = new EventEmitter<string>();

  public leftarrow = false;
  public rightarrow = true;
  public dataSource: any;
  public map: any;
  public imageUrl: string;
  public blockList: Array<any> = [];
  public polygonData: any = null;
  public dataSourceActive: any;
  public obj = new BehaviorSubject<Object>([]);

  constructor(private readonly styleLoader: StyleLoaderService,private readonly hospitalService: HospitalService,
    public dialog: MatDialog, private readonly commonService: CommonService, public dashboardService: DashboardService) {
  }

  ngOnInit() {
    this.styleLoader.loadStyleByType('leafletCss')
    this.getBlockList();
  }

  ngDoCheck() {
    if (this.commonService.contextChanged === true) {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      this.getBlockList();
      this.commonService.contextChanged = false;
    }
  }

  getBlockList() {
    this.hospitalService.getBlockList().subscribe(res => {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      this.map = L.map('blockId', {
        minZoom: -3,
        maxZoom: 0,
        center: [-850, 750],
        zoom: -2,
        zoomControl: false,
        crs: L.CRS.Simple,
        attributionControl: false
      });
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.scrollWheelZoom.disable();
      this.map.boxZoom.disable();
      this.map.keyboard.disable();
      this.obj.next((this.map));
      const southWest =  this.map.unproject([0, 1700], this.map.getMaxZoom());
      const northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
      const bounds = new L.LatLngBounds(southWest, northEast);
      this.dataSourceActive = 0;
      if (res.statusCode === 1) {
        this.blockList = res.results;
        this.getBlockDetail(this.blockList[0]);
      } else {
        L.imageOverlay('/assets/Alert/common_icons/default-block.jpg', bounds, {opacity: 0.1}).addTo(this.map);
        this.map.setMaxBounds(bounds);
      }
    });
  }
  getBehaviorBlockListView(): Observable<any> {
    console.log('getBehaviorBlockListView');
    return this.obj.asObservable();
  }

  getBlockDetail(blockData) {
    this.hospitalService.getLogicalLocationWithChildren(blockData.id).subscribe(res => {
    const data = res.results;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.dataSource = data;
    this.map = L.map('blockId', {
      minZoom: data.minZoom ? data.minZoom / 20 - 10 : -3,
      maxZoom: data.maxZoom ? data.maxZoom / 20 - 10 : 0,
      zoom: data.defaultZoom ? data.defaultZoom / 20 - 10 : -2,
      center: [0, 0],
      zoomControl: false,
      crs: L.CRS.Simple,
      attributionControl: false
    });
    this.map.touchZoom.disable();
    this.map.doubleClickZoom.disable();
    this.map.scrollWheelZoom.disable();
    this.map.boxZoom.disable();
    this.map.keyboard.disable();
    let southWest =  this.map.unproject([0, 1700], this.map.getMaxZoom());
    let northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
    if (data.aspects) {
      const coodata = JSON.parse(data.aspects);
      const width = coodata[0] * 100;
      const height = coodata[1] * 100;
      southWest =  this.map.unproject([0, height], this.map.getMaxZoom());
      northEast = this.map.unproject([width, 0], this.map.getMaxZoom());
    }
    const bounds = new L.LatLngBounds(southWest, northEast);
    this.rightarrow = this.blockList.length === 1 ? false : true;
    this.imageUrl = environment.api_base_url_new + 'api/location/get-location-image/' + data.id + '?date=' + (new Date());
    L.imageOverlay(this.imageUrl, bounds).addTo(this.map);
    this.map.setMaxBounds(bounds);
    this.getPolygon(data);
    });
  }
  getPolygon(data) {
    this.polygonData = null;
    const floorList = data.children;
    for (const i in floorList) {
      if (floorList[i] && floorList[i].coordinates) {
        const area = JSON.parse(floorList[i].coordinates);
        const poly = area.geometry.coordinates;
        const points: any = [];
        for (const i in poly) {
          points.push([poly[i][1] * -100, poly[i][0] * 100]);
        }
        const polyBound = L.polygon(points, {color: floorList[i].polygonStyle ? floorList[i].polygonStyle :  '#ffa500cc'});
        polyBound.addTo(this.map);
        const labelName = floorList[i].name;
        const labelStyle = floorList[i].labelStyle ? floorList[i].labelStyle : 'color: #A9A9A9 !important;font-size: 12px;';
        polyBound.bindTooltip('<div style=' + labelStyle + '>' + labelName + '</div>',
          {permanent: true, direction: 'center', className: 'polytooltip'}).openTooltip();
        polyBound.on('click', this.commonLeaflet.bind(this, data.id, floorList[i]));
      }
    }
  }
  commonLeaflet(blockId, floorList) {
    const data = {
      'blockId' : blockId,
      'floorId' : floorList.id,
      'tagSerialNumber' : null,
      'tagType' : null,
      'tagTypeId' : null
    };
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: data ,  panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  pointOnClick(data) {
    const floorId = '{ id: ' + data.id + ', action: "Maximize"}';
    this.childToParentAction.emit(floorId);
  }
  arrow_right(id: number) {
    this.dataSourceActive = id + 1;
    if (this.blockList.length > this.dataSourceActive) {
      this.getBlockDetail(this.blockList[this.dataSourceActive]);
    }
    this.rightarrow = this.blockList.length - this.dataSourceActive === 1 ? false : true;
    this.leftarrow = this.dataSourceActive > 0 ? true : false;
  }
  arrow_left(id: number) {
    this.dataSourceActive = id - 1;
    if (this.dataSourceActive >= 0) {
        this.getBlockDetail(this.blockList[this.dataSourceActive]);
    }
    this.rightarrow = this.dataSourceActive < this.blockList.length ? true : false;
    this.leftarrow = this.dataSourceActive === 0 ? false : true;
  }
  fixClick() {
    console.log('')
  }
}
