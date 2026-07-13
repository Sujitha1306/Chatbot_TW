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
import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { CommonService, HospitalService, ConfigurationService } from '../../../../shared';
import { environment } from '../../../../../environments/environment';
import * as L from 'leaflet';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import * as pointInPoly from 'point-in-polygon';
import { StyleLoaderService } from '../../../../shared/services/style-loader.service ';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
    selector: 'app-nodepoint-generator',
    templateUrl: './nodepoint-generator.component.html',
    styleUrls: ['./nodepoint-generator.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class NodePointsGenerator implements OnInit {
   public map: any;
   public blockId: any = null;
   public blockData: Array<any> = [];
   public floorId: any = null;
   public floorData: Array<any> = [];
   public floorLocations: Array<any> = [];
   public locationImage: any = null;
   public reader = {
    readerList : [],
    reader_points : [],
    reader_postion : {}
   };
   public ipSelect = {
    nodeTypes : [],
    exitNodeList : [],
    tempExitNodeList : [],
   };
   public ipButton = {
    isActiveNode : false,
    isGenerateNode : false,
    isShowReader : false,
    enableGeoDirect : false,
    isAllDelete: true,
    isNodeLink : false,
    selectedToggle : 'create',
    isDistOpen : false
   };
   public polylinePoints = [];
   public distPolyline = {}; 
   public mapNodes = {
    nodeData : [],
    newNodeData: [],
    nodePointData : [],
    exitPointData : [],
    activeNode : null,
    prevActiveNode : null,
    activeMarker : null,
    lastNode : 0,
    nodeDistance : 1,
    activeNodeId : null,
    typeValue : null,
    exitSpliceValue : null,
    exitNodeCount : 0,
    exitNodeFlag : 0,
    selectedExitList: [],
    isDelete : 0,
    noOfLinks : 0,
    noOfNodes : 0,
    distNodeList : [],
    distLinkId : null,
    origin : { v1 : [0, 0], v2 : [0,0]}
   };
   public newExitNode = [];
   public polyLatLng: any = {};
   public xValue = new FormControl(null);
   public yValue = new FormControl(null);
   public distanceValue = new FormControl(1);
   public selectedFloor = new FormControl(null);
   public selectedLocation = new FormControl(null);
   public selectedNodeDist = new FormControl(null);
   public nodeLink: any = [];
   public allNodes: any = [];
   public locations: any = [];
   public isShowCursorMovement  = false
   public redDot = new L.Icon({ iconUrl: '/assets/Alert/common_icons/red-dot.png', iconSize: [16, 16],
                  iconAnchor: [8, 8], popupAnchor: [-3, -76] });
   public blueDot = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [16, 16],
                  iconAnchor: [8, 8], popupAnchor: [-3, -76] });
   public greenDot = new L.Icon({ iconUrl: '/assets/Alert/common_icons/green-dot.png', iconSize: [16, 16],
                  iconAnchor: [8, 8], popupAnchor: [-3, -76] });
  previewLine: any;
  mouseMoveHandler: (event: any) => void;
   constructor(private readonly styleLoader: StyleLoaderService,public thisDialogRef: MatDialogRef<NodePointsGenerator>, private readonly hospitalServices: HospitalService,
      private readonly commonServices: CommonService, private readonly configurationServices: ConfigurationService, public toastr: AppToastService,
      private readonly snackbar: MatSnackBar, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog) {
   }
   ngOnInit() {
    this.styleLoader.loadStyleByType('leaflet')
    this.floorId = this.data.floorId;
    this.blockId = this.data.blockId;
    this.commonServices.getAllLocationById(this.blockId).subscribe(res => {
        for (const i in res.results) {
          const pushData = {'id': res.results[i].id, 'name': res.results[i].name};
          this.blockData.push(pushData);
        }
        this.selectedFloor.setValue(this.floorId);
        this.floorData = res.results.filter(val => val.id === this.floorId);

        this.floorLocations = this.floorData[0].locations;
        const floorData = this.floorData[0];
        this.floorLocations.unshift(floorData);

        this.getNodeMap(this.floorData[0]);
    });
    }
    getAngle(orgin, v1, v2) {
      let a = {x: this.mapNodes.origin['v2'][0] - this.mapNodes.origin['v1'][0], y: this.mapNodes.origin['v2'][1] - this.mapNodes.origin['v1'][1], z: 0};
      let b = {x: v2[0] - v1[0], y: v2[1] - v1[1], z: 0};
      
      let dot = (p1, p2)=>  p1.x * p2.x + p1.y * p2.y;
      let det = (p1, p2) => p1.x * p2.y - p1.y * p2.x;      
      let rad = Math.atan2(det(a, b), dot(a, b))
      let deg = rad * 180/3.14;
      if(deg < 0) {
        deg = 360 + deg;
      }
      deg = Math.round(deg)
      deg = 360 - deg
      deg = deg + 180 // for db linked_node_id insert problem
      if (deg >= 360) {
        deg = deg - 360
      }
      return {res : deg, radiant : rad};
    }
   getNodeMap(flrData) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.map = L.map('flrMap', {
      center: [0, 0],
      minZoom: flrData.minZoom ? flrData.minZoom / 20 - 10 : -4,
      maxZoom: flrData.maxZoom ? flrData.maxZoom / 20 - 10 : 0,
      zoom: flrData.defaultZoom ? flrData.defaultZoom / 20 - 10 : -2,
      zoomControl: true,
      crs: L.CRS.Simple, attributionControl: false
    });
    const e = eval;
    const locScale = e(flrData.aspects);
    const width = flrData.aspects ? locScale[0] * 100 : 1500;
    const height = flrData.aspects ? locScale[1] * 100 : 100;
    const locationUrl = environment.api_base_url_new +
                        environment.base_value.get_image_location_by_id + flrData.id + '?date=' + (new Date());
    const southWest = this.map.unproject([0, height], this.map.getMaxZoom());
    const northEast = this.map.unproject([width, 0], this.map.getMaxZoom());
    const bounds = new L.LatLngBounds(southWest, northEast);
    this.locationImage = L.imageOverlay(locationUrl, bounds, { interactive: true });
    this.locationImage.addTo(this.map);
    this.map.setMaxBounds(bounds);
    this.map.on('click', this.polyLineDist.bind(this))
    const floorChildren = flrData.locations;
    for (const i in floorChildren) {
        if (floorChildren[i].coordinates && !floorChildren[i].isLogicalParent && floorChildren[i]['locationTypeLevel'] !== 2) {
          this.drawLocations(floorChildren[i], 'red');
        }
    }
    this.drawMaxLimit(flrData)
    this.loadNodePoints();
   }
   drawMaxLimit(flrData) {
    let points = flrData.nodePoints;
    if(points) {
      try {
        points = JSON.parse(points);
        let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [10, 10], iconAnchor: [6, 6] });
        for(let i in points) {
          points[i]['lat'] = points[i].lat * -100;
          points[i]['lng'] = points[i].lng * 100;
        }
        for(let i in points){
          this.polylinePoints.push(points[i]);
          this.distPolyline[this.polylinePoints.length] = L.marker(points[i], { icon: iconImage});
          this.distPolyline[this.polylinePoints.length].addTo(this.map)
          if(this.polylinePoints.length == 2){
            this.mapNodes.origin = { v1 : [this.polylinePoints[0]['lng'], this.polylinePoints[0]['lat']], v2 : [this.polylinePoints[1]['lng'], this.polylinePoints[1]['lat']]};
            this.distPolyline['polyLine'] = L.polyline([this.polylinePoints[0],this.polylinePoints[1]], {color: 'gray'}).addTo(this.map);
            let point = JSON.parse('[[' + (this.polylinePoints[0].lng / 100).toFixed(3) + ',' + (this.polylinePoints[0].lat / -100).toFixed(3) + '],[' +(this.polylinePoints[1].lng / 100).toFixed(3) + ',' +(this.polylinePoints[1].lat / -100).toFixed(3) + ']]')
            const distance = Math.sqrt(Math.pow((point[0][1] - point[1][1]), 2) + Math.pow((point[0][0] - point[1][0]), 2));
            let content = "<div style='font-family:" + 'Open Sans' + "'>" + distance.toFixed(2) + " m</div>"
            this.distPolyline['polyLine'].bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
          }
        }
      } catch (e) {
        console.log('the node points data is not working')
      }
    }
   }
   drawLocations(childData, color) {
    const area = JSON.parse(childData.coordinates);
    if (area) {
        const poly = area.geometry.coordinates;
        const test: any = [];
        for (const i in poly) {
            test.push([poly[i][1] * -100, poly[i][0] * 100]);
        }
        let polygonData = null;
        if(area.geometry.type == "Point") { 
          polygonData = L.marker([poly[1], poly[0]]);     
        } else {
        polygonData = L.polygon(test, {color: childData.polygonStyle ? childData.polygonStyle :  '#ffa500cc'});
        }
        const className = 'leaf-tool-labels';
        polygonData.addTo(this.map);
        polygonData.on('click', this.getCoordinate.bind(this, childData.id));
        this.polyLatLng[childData.id] = polygonData;
        this.polyLatLng[childData.id]['editing']['poly'] = test;
        let tooltipStyle = "style='color:#808080d9;'";
        if (childData.labelStyle != null) {
            tooltipStyle = "style='" + childData.labelStyle + "'";
        }
        const name = '<div ' + tooltipStyle + '>' + childData.name.split(' ').join('<br>') + '</div>';
        polygonData.bindTooltip(name, { permanent: true, direction: 'center', className: className }).openTooltip();
    }
   }
   polyLineDist(pos){
    if(this.ipButton.enableGeoDirect){
      let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [10, 10], iconAnchor: [6, 6] });
      this.polylinePoints.push(pos.latlng);
      this.distPolyline[this.polylinePoints.length] = L.marker(pos.latlng, { icon: iconImage});
      this.distPolyline[this.polylinePoints.length].addTo(this.map)
      if(this.polylinePoints.length == 2){
        this.distPolyline['polyLine'] = L.polyline([this.polylinePoints[0],this.polylinePoints[1]], {color: 'gray'}).addTo(this.map);
        let point = JSON.parse('[[' + (this.polylinePoints[0].lng / 100).toFixed(3) + ',' + (this.polylinePoints[0].lat / -100).toFixed(3) + '],[' +(this.polylinePoints[1].lng / 100).toFixed(3) + ',' +(this.polylinePoints[1].lat / -100).toFixed(3) + ']]')
        const distance = Math.sqrt(Math.pow((point[0][1] - point[1][1]), 2) + Math.pow((point[0][0] - point[1][0]), 2));
        let content = "<div style='font-family:" + 'Open Sans' + "'>" + distance.toFixed(2) + " m</div>"
        this.distPolyline['polyLine'].bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
      } else if(this.polylinePoints.length > 2){
        for(let i in this.distPolyline){
            this.map.removeLayer(this.distPolyline[i])
            delete this.distPolyline[i]
        }
        this.polylinePoints = [];
        this.polyLineDist(pos)
      }
    }
  }
  toggleCursorMovement() {
    this.isShowCursorMovement = !this.isShowCursorMovement;
    if (this.isShowCursorMovement && this.mapNodes.activeMarker) {
      this.startPreviewFromActiveNode();
    } else {
      this.clearPreviewLine();
    }
  }
  getDirection(){
    this.ipButton.enableGeoDirect = !this.ipButton.enableGeoDirect;
    for(let i in this.distPolyline){
      this.map.removeLayer(this.distPolyline[i])
      delete this.distPolyline[i]
    }
    this.polylinePoints = []
    if(this.ipButton.enableGeoDirect){
      this.drawMaxLimit(this.floorData[0])
    }
  }
  saveLocationDirection() {
    for(let i in this.polylinePoints) {
      this.polylinePoints[i].lat = this.polylinePoints[i].lat/-100;
      this.polylinePoints[i].lng = this.polylinePoints[i].lng/100;
    }
    let postData = {
      'id' : this.floorData[0]['id'],
      'nodePoints' : JSON.stringify({'N' : this.polylinePoints[0], 'S' : this.polylinePoints[1]})  
    }
    this.hospitalServices.updateFloorDirection(postData).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.floorData[0]['nodePoints'] = postData['nodePoints']
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  showReader(event) {
     if (event) {
      for (const reader in this.reader.readerList) {
          const value =  JSON.parse(this.reader.readerList[reader].coordinate);
          if (value != null) {
            const hwType = this.reader.readerList[reader]['hardwareTypeId'];
            const readerPoints = [value[1] * -100, value[0] * 100];
            const iconImage = new L.Icon({ iconUrl: '/assets/Floorplan/' + hwType + '.svg', iconSize: [18, 18], iconAnchor: [7, 7]});
            const readerPosition = L.marker(readerPoints, {icon: iconImage});
            readerPosition.on('click', this.showReaderPopup.bind(this, this.reader.readerList[reader], 'show',
                  this.reader.readerList[reader].id ));
            this.reader.reader_points.push(readerPosition);
            readerPosition.addTo(this.map);
          }
      }
      } else {
          for (let i = 0; this.reader.reader_points.length > i ; i++) {
              this.map.removeLayer(this.reader.reader_points[i]);
          }
          for (let i in this.reader.readerList) {
              if (this.reader.reader_postion[this.reader.readerList[i].id + 'label']) {
                  this.map.removeLayer(this.reader.reader_postion[this.reader.readerList[i].id + 'label']);
                  delete this.reader.reader_postion[this.reader.readerList[i].id + 'label'];
              }
          }
          this.reader.reader_points = [];
      }
   }
   showReaderPopup(data, type, id,  val) {
    const value =  JSON.parse(data.coordinate);
    const readerPoints = [value[1] * -100, value[0] * 100];
    if (this.reader.reader_postion[id + 'label']) {
        this.map.removeLayer(this.reader.reader_postion[id + 'label']);
        delete this.reader.reader_postion[id + 'label'];
    }
    if (type === 'show') {
    const readerPositionLabel = L.marker(readerPoints, {
        icon: L.divIcon({
            html: "<div>" + data.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + data.hardwareTypeName + "</span></div>",
            className: 'popup-marker',
          })
      }).on('click', this.showReaderPopup.bind(this, data , 'hide', data.id));
        this.reader.reader_postion[data.id + 'label'] = readerPositionLabel;
        readerPositionLabel.addTo(this.map);
    }
   }
   loadNodePoints() {
    this.configurationServices.getAllReaders().subscribe(res => {
        this.reader.readerList = res.results.filter(val => val.floorId === this.floorId);
    });
    this.hospitalServices.getExitNodes().subscribe(res => {
        this.ipSelect.exitNodeList = res.results.filter(val => val.name !== 'Exit0');
        this.ipSelect.tempExitNodeList = this.ipSelect.exitNodeList;
    });
    this.hospitalServices.getType().subscribe(res => {
      if (res.statusCode === 1) {
        this.ipSelect.nodeTypes = res.results.filter(val => val.code !== 'NT-LN' && val.code !== 'NT-SN').reverse();
      }
    });
    this.hospitalServices.getNodePoints().subscribe(res => {
      this.allNodes = res.results;
      this.allNodes = this.allNodes.filter(val => val.nodes.length);
    });
    this.commonServices.getLocations().subscribe(res => {
      this.locations = res.results;
      // will use it for parent location change
    });

    this.getNodePoints();
   }

   getNodePoints() {
    this.hospitalServices.getNodePoints(this.floorId).subscribe(res => {
        this.mapNodes.nodeData = res.results;
        if (this.mapNodes.nodeData.length) {
            let nodePointMarker;
            for (const i in this.mapNodes.nodeData) {
              if ('exit' in this.mapNodes.nodeData[i]) {
                if (this.mapNodes.nodeData[i].exit !== 0) {
                  const id = this.mapNodes.nodeData[i].exit;
                  const data = this.ipSelect.tempExitNodeList.filter(val => val.id !== id);
                  this.ipSelect.tempExitNodeList = data;
                }
              }
                this.mapNodes.nodeData[i].x = this.mapNodes.nodeData[i].x * 100;
                this.mapNodes.nodeData[i].y = this.mapNodes.nodeData[i].y * -100;
                this.mapNodes.nodeData[i].flag = false;
                for (const j in this.mapNodes.nodeData[i].links) {
                  const linkedNodeid = this.mapNodes.nodeData[i].links[j].link_node_id;
                  const index = this.checkIndexOfNodeData(linkedNodeid, 'node');
                  if (index !== -1) {
                    this.mapNodes.nodeData[i].links[j].flagLink = false;
                      for (const k in this.mapNodes.nodeData[index].links) {
                        if (this.mapNodes.nodeData[index].links[k].link_node_id === this.mapNodes.nodeData[i].id) {
                            if (this.mapNodes.nodeData[index].links[k].flagLink === false) {
                              this.mapNodes.nodeData[index].links[k].flagLink = true;
                              this.mapNodes.nodeData[i].links[j].flagLink = true;
                              this.createLinkNodes(this.mapNodes.nodeData[i].x, this.mapNodes.nodeData[i].y,
                                                  this.mapNodes.nodeData[index].x, this.mapNodes.nodeData[index].y);
                              break;
                            }
                        }
                      }
                  }
                }
                const lat = this.mapNodes.nodeData[i].y;
                const lng = this.mapNodes.nodeData[i].x;
                nodePointMarker = L.marker([lat, lng], { icon: this.blueDot, draggable: false });
                nodePointMarker.on('click', this.makeLoadNodeActive.bind(this, nodePointMarker, 'existNode'));
                const nodeId = 'id' + this.mapNodes.nodeData[i].id;
                nodePointMarker.addTo(this.map);
                let MarkerText = L.divIcon(
                  {className: 'countPosition',
                   html: '<div>' + this.mapNodes.nodeData[i].exit + '</div>',
                   iconSize: null
                });
                if (this.mapNodes.nodeData[i].type === 'NT-RN') {
                  let markerLabel = '<div>R</div>';
                  const locFilter = this.floorLocations.filter(val => val.id === this.mapNodes.nodeData[i].location_id);
                  if (locFilter.length && locFilter[0]['locationTypeLevel'] === 2) {
                    markerLabel = '<div>F</div>';
                  }
                  if (locFilter.length && locFilter[0]['isLogicalParent']) {
                    markerLabel = '<div>L</div>';
                  }
                  MarkerText = L.divIcon(
                    {className: 'countPosition',
                     html: markerLabel,
                     iconSize: null
                  });
                }
                if (this.mapNodes.nodeData[i].exit !== 0 || this.mapNodes.nodeData[i].type === 'NT-RN') {
                  const label = L.marker([lat, lng], { icon: MarkerText, draggable: false });
                  label.on('click', this.makeLoadNodeActive.bind(this, nodePointMarker, 'existNode'));
                  label.addTo(this.map);
                  this.mapNodes.exitPointData[nodeId] = label;
                }
                this.mapNodes.nodePointData[nodeId] = nodePointMarker;
                const iconImg = nodePointMarker.options.icon;
                iconImg.options.iconUrl = '/assets/Alert/common_icons/blue-dot.png';
                this.mapNodes.nodePointData[nodeId].setIcon(iconImg);
            }
            this.mapNodes.activeNode = this.mapNodes.nodeData[this.mapNodes.nodeData.length - 1];
            this.setXYValue(this.mapNodes.activeNode);
            this.ipButton.isActiveNode = true;
            this.checkActiveNodeId();
            this.mapNodes.lastNode = 1;
            this.makeLoadNodeActive(nodePointMarker, 'existNode');
            this.mapNodes.lastNode = 0;
            this.startPreviewFromActiveNode();
        } else {
            this.mapNodes.nodeData = [];
            this.mapNodes.activeNode = null;
            this.ipButton.isActiveNode = false;
        }
    });
   }
   checkIndexOfNodeData(id, type) {
    let checkIndex;
    if (type === 'node') {
      checkIndex = this.mapNodes.nodeData.findIndex(res => res.id === id);
    } else if (type === 'newNode') {
      console.log(this.mapNodes.newNodeData);
      this.mapNodes.newNodeData.forEach((val, index) => {
        if (val != null && val.r_id === id) {
          checkIndex = index;
        }
      });
    }
    return checkIndex;
   }
   checkLatLngOfNodeData(x, y, type) {
    let checkIndex = -1;
    if (type === 'node') {
      this.mapNodes.nodeData.forEach((val, index) => {
        if (val != null && val.x === x && val.y === y) {
          checkIndex = index;
        }
      });
    } else if (type === 'newNode') {
      this.mapNodes.newNodeData.forEach((val, index) => {
        if (val != null && val.x === x && val.y === y) {
          checkIndex = index;
        }
      });
    }
    return checkIndex;
   }
   createLinkNodes(x1, y1, x2, y2) {
    const pointList = [[y1, x1], [y2, x2]];
    this.nodeLink[this.mapNodes.noOfLinks] = new L.Polyline(pointList, {
      color: 'red', weight: 3,
      opacity: 0.5, smoothFactor: 1
    });
    this.nodeLink[this.mapNodes.noOfLinks].addTo(this.map);
    this.mapNodes.noOfLinks = this.mapNodes.noOfLinks + 1;
   }
   checkLine(x1, y1, x2, y2) {
     for (const i in this.nodeLink) {
       const values = this.nodeLink[i].getLatLngs();
       if (
            (values[0].lng === x1 && values[0].lat === y1 && values[1].lng === x2 && values[1].lat === y2)
         || (values[0].lng === x2 && values[0].lat === y2 && values[1].lng === x1 && values[1].lat === y1)) {
         console.log(this.nodeLink[i]);
         this.map.removeLayer(this.nodeLink[i]);
         this.nodeLink.splice(i, 1);
         break;
       }
     }
   }
   getCoordinate(locId, data) {
    if(!this.ipButton.enableGeoDirect) {
    if (this.mapNodes.noOfNodes === 0 && this.mapNodes.nodeData.length === 0 && this.mapNodes.activeNode == null) {
      this.createNode(locId, data.latlng.lat, data.latlng.lng, 'create');
    } else if (this.mapNodes.noOfNodes !== 0 && (this.mapNodes.nodeData.length >= 0) && this.mapNodes.activeNode == null) {
      this.createNode(locId, data.latlng.lat, data.latlng.lng, 'create');
    } else {
      this.mapNodes.prevActiveNode = this.mapNodes.activeNode;
      if (this.mapNodes.prevActiveNode != null) {
        this.releasePrevNode();
      }
      if (this.ipButton.isGenerateNode) {
        if (this.mapNodes.prevActiveNode['location_id'] === locId) {
          const coordinatesArray = this.middleNode(this.mapNodes.prevActiveNode.x, this.mapNodes.prevActiveNode.y,
                                    data.latlng.lng, data.latlng.lat, 100);
          this.generateNodeFunction(coordinatesArray);
        } else {
          this.toastr.warning('Warning', `Generate Node should be within location`);
          const nodeIcon = this.mapNodes.activeMarker.options.icon;
          nodeIcon.options.iconUrl = '/assets/Alert/common_icons/red-dot.png';
          this.mapNodes.activeMarker.setIcon(nodeIcon);
          return;
        }
      } else {
      this.createNode(locId, data.latlng.lat, data.latlng.lng, 'create');
      this.createLink();
      const nodeIcon = this.mapNodes.activeMarker.options.icon;
      nodeIcon.options.iconUrl = '/assets/Alert/common_icons/red-dot.png';
      this.mapNodes.activeMarker.setIcon(nodeIcon);
      }
    }
    }
   }
   changeDistance(distance) {
    this.mapNodes.nodeDistance = distance;
   }

   generateNodeFunction(coordinatesArray) {
     console.log(coordinatesArray);
     for (const i in coordinatesArray) {
        let locId = this.mapNodes.activeNode.location_id;
        for (const j in this.polyLatLng) {
          if (this.polyLatLng[j].getBounds().contains({lat: coordinatesArray[i][1], lng: coordinatesArray[i][0]})) {
            locId = j;
            break;
          }
        }
      this.createNode(locId, parseInt(coordinatesArray[i][1], 10), parseInt(coordinatesArray[i][0], 10), 'generate');
      this.clearPreviewLine();
       this.createLink();
       this.mapNodes.prevActiveNode = this.mapNodes.activeNode;
       const nodeIcon = this.mapNodes.activeMarker.options.icon;
       nodeIcon.options.iconUrl = '/assets/Alert/common_icons/green-dot.png';
       this.mapNodes.activeMarker.setIcon(nodeIcon);
     }
     this.mapNodes.activeNode = this.mapNodes.prevActiveNode;
     console.log(this.mapNodes.activeNode);
     this.setXYValue(this.mapNodes.activeNode);
     this.checkActiveNodeId();
     this.ipButton.isActiveNode = true;
     this.makeLoadNodeActive(this.mapNodes.activeMarker, 'newNode');
     this.ipButton.isGenerateNode = false;
   }
   forceCreateNode(x, y) {
    this.mapNodes.noOfNodes = this.mapNodes.noOfNodes + 1;
    const locationId = this.mapNodes.activeNode.location_id;
    const newNodePoint = L.marker([y, x], { icon: this.greenDot, draggable: true });
    newNodePoint.on('click', this.makeLoadNodeActive.bind(this, newNodePoint, 'newNode'));
    newNodePoint.addTo(this.map);
    const keyVal = 'r_id' + this.mapNodes.noOfNodes;
    this.mapNodes.nodePointData[keyVal] = newNodePoint;
    this.mapNodes.activeMarker = newNodePoint;
    this.createJson(x, y, locationId);
  }
   releasePrevNode() {
     console.log('release');
     let check = null;
     const nodePoint = null;
     if (this.mapNodes.prevActiveNode != null) {
       check = (this.mapNodes.nodeData.findIndex(res => res.x === this.mapNodes.prevActiveNode.x
                && res.y === this.mapNodes.prevActiveNode.y) !== -1) ? 1 : 2;
     }
     if (check === 1) {
       const nodeIcon = this.mapNodes.activeMarker.options.icon;
       nodeIcon.options.iconUrl = '/assets/Alert/common_icons/blue-dot.png';
       this.mapNodes.activeMarker.setIcon(nodeIcon);
     } else {
        const nodeIcon = this.mapNodes.activeMarker.options.icon;
        nodeIcon.options.iconUrl = '/assets/Alert/common_icons/green-dot.png';
        this.mapNodes.activeMarker.setIcon(nodeIcon);
     }
      this.startPreviewFromActiveNode();
   }
   middleNode(x1, y1, x2, y2, d) {
    const coordinatesArray = [];
    const direction = this.findDirection(x1, x2, y1, y2, true);
    const distance = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    if (direction === 180 || direction === 0) {
      while (distance - d > 1) {
        const d2 = distance - d;
        const p1 = d * 100 / (d + d2);
        let coordinates = [];
        if (y1 === y2) {
          if (direction === 180) {
            coordinates = [x1 + d, y1];
          }
          if (direction === 0) {
            coordinates = [x1 - d, y1];
          }
        } else {
          const middle = [x2, y1];
          const distance_x = Math.sqrt(Math.pow((x1 - middle[0]), 2) + Math.pow((y1 - middle[1]), 2));
          const move_point_x = (distance_x) * p1 / 100;
          const distance_y = Math.sqrt(Math.pow((middle[0] - x2), 2) + Math.pow((middle[1] - y2), 2));
          const move_point_y = (distance_y) * p1 / 100;
          const middle_d = this.findDirection(middle[0], x2, middle[1], y2);
          if (direction === 180) {
            if (middle_d === 90) {
              coordinates = [parseInt(x1, 10) + move_point_x, parseInt(y1, 10) + move_point_y];
            }
            if (middle_d === 270) {
              coordinates = [parseInt(x1, 10) + move_point_x, parseInt(y1, 10) - move_point_y];
            }
          }
          if (direction === 0) {
            if (middle_d === 90) {
              coordinates = [parseInt(x1, 10) - move_point_x, parseInt(y1, 10) + move_point_y];
            }
            if (middle_d === 270) {
              coordinates = [parseInt(x1, 10) - move_point_x, parseInt(y1, 10) - move_point_y];
            }
          }

        }
        coordinates = [parseFloat(coordinates[0].toFixed(2)), parseFloat(coordinates[1].toFixed(2))];
        coordinatesArray.push(coordinates);
        d = d + 100;
      }
      console.log(coordinatesArray);
      return coordinatesArray;
    } else if (direction === 90 || direction === 270) {
      while (distance - d > 1) {
        const d2 = distance - d;
        const p1 = d * 100 / (d + d2);
        let coordinates = [];
        if (x1 === x2) {
          if (direction === 90) {
            coordinates = [x1, y1 + d];
          }
          if (direction === 0) {
            coordinates = [x1, y1 - d];
          }

        } else {
          const middle = [x1, y2];
          const distance_y = Math.sqrt(Math.pow((x1 - middle[0]), 2) + Math.pow((y1 - middle[1]), 2));
          const move_point_y = (distance_y) * p1 / 100;
          const distance_x = Math.sqrt(Math.pow((middle[0] - x2), 2) + Math.pow((middle[1] - y2), 2));
          const move_point_x = (distance_x) * p1 / 100;
          const middle_d = this.findDirection(middle[0], x2, middle[1], y2);
          if (direction === 90) {
            if (middle_d === 180) {
              coordinates = [parseInt(x1, 10) + move_point_x, parseInt(y1, 10) + move_point_y];
            }
            if (middle_d === 0) {
              coordinates = [parseInt(x1, 10) - move_point_x, parseInt(y1, 10) + move_point_y];
            }
          }
          if (direction === 270) {
            if (middle_d === 180) {
              coordinates = [parseInt(x1, 10) + move_point_x, parseInt(y1, 10) - move_point_y];
            }
            if (middle_d === 0) {
              coordinates = [parseInt(x1, 10) - move_point_x, parseInt(y1, 10) - move_point_y];
            }
          }

        }
        coordinates = [coordinates[0].toFixed(2), coordinates[1].toFixed(2)];
        coordinatesArray.push(coordinates);
        d = d + 100;
      }
      return coordinatesArray;
    }
  }
   createNode(locId, lat, lng, type) {
     console.log('create node');
     let locationId = locId;
     let image = this.redDot;
     if (type === 'generate') {
       locationId = locId;
       image = this.greenDot;
     }
     this.mapNodes.exitNodeFlag = 0;
     this.mapNodes.isDelete = 1;
     this.mapNodes.noOfNodes = this.mapNodes.noOfNodes + 1;
     const newNodePoint = L.marker([lat, lng], { icon: image, draggable: false });
     newNodePoint.on('click', this.makeLoadNodeActive.bind(this, newNodePoint, 'newNode'));
     newNodePoint.addTo(this.map);
     const keyVal = 'r_id' + this.mapNodes.noOfNodes;
     this.mapNodes.nodePointData[keyVal] = newNodePoint;
     this.mapNodes.activeMarker = newNodePoint;
     this.createJson(lng, lat, locationId);
   }
   createJson(lng, lat, locId) {
     const rid = this.mapNodes.noOfNodes;
     const x = lng;
     const y = lat;
     const type = 'NT-NN';
     const floorID = this.floorId;
     const link = [];
     const locationID = locId;
     const rexit = 0;
     const nodePoint = {  'r_id': rid, 'x': x, 'y': y, 'floor_id': floorID,
                          'location_id': locationID, 'type': type, 'links': link, 'flag': true, 'exit': rexit };
     this.mapNodes.activeNode = nodePoint;
     this.setXYValue(this.mapNodes.activeNode);
     this.checkActiveNodeId();
     this.ipButton.isActiveNode = true;
     this.mapNodes.newNodeData[rid] = nodePoint;
     const isNewNode = this.mapNodes.newNodeData.find(res => res != null);
     if (isNewNode === undefined) {
       this.ipButton.isAllDelete = true;
     } else {
       this.ipButton.isAllDelete = false;
     }
   }
   createLink() {
    let distance;
    let degree1;
    let degree2;
    distance = Math.sqrt(Math.pow(((this.mapNodes.activeNode.x / 100) - (this.mapNodes.prevActiveNode.x / 100)), 2) +
                Math.pow(((this.mapNodes.activeNode.y / 100) - (this.mapNodes.prevActiveNode.y / 100)), 2));
    degree1 = this.findDirection(this.mapNodes.activeNode.x, this.mapNodes.prevActiveNode.x,
                      this.mapNodes.activeNode.y, this.mapNodes.prevActiveNode.y);
    degree2 = this.findDirection(this.mapNodes.prevActiveNode.x, this.mapNodes.activeNode.x,
                      this.mapNodes.prevActiveNode.y, this.mapNodes.activeNode.y);
    let linkJson = null;
    let linkFlag = 0;
    const check1 = (this.mapNodes.nodeData.findIndex(res => res.x === this.mapNodes.prevActiveNode.x
                    && res.y === this.mapNodes.prevActiveNode.y) !== -1) ? 1 : 2;
    const check2 = (this.mapNodes.nodeData.findIndex(res => res.x === this.mapNodes.activeNode.x
                    && res.y === this.mapNodes.activeNode.y) !== -1) ? 1 : 2;
    if (check1 === 1 && check2 === 2) {
      for (const ii in this.mapNodes.activeNode.links) {
        if (this.mapNodes.activeNode.links[ii].link_node_id === this.mapNodes.prevActiveNode.id) {
          linkFlag = 1;
          break;
        }
      }
      if (linkFlag !== 1) {
        linkJson = { 'r_link_node_id': this.mapNodes.activeNode.r_id, 'degree': degree2, 'weight': distance };
        const index = this.checkIndexOfNodeData(this.mapNodes.prevActiveNode.id, 'node');
        this.mapNodes.nodeData[index].links.push(linkJson);
        this.mapNodes.nodeData[index].flag = true;
        linkJson = { 'link_node_id': this.mapNodes.prevActiveNode.id, 'degree': degree1, 'weight': distance };
        this.mapNodes.newNodeData[this.mapNodes.activeNode.r_id].links.push(linkJson);
      }
    } else if (check1 === 1 && check2 === 1) {
      for (const ii in this.mapNodes.activeNode.links) {
        if (this.mapNodes.activeNode.links[ii].link_node_id === this.mapNodes.prevActiveNode.id) {
          linkFlag = 1;
          break;
        }
      }
      if (linkFlag !== 1) {
        linkJson = { 'link_node_id': this.mapNodes.activeNode.id, 'degree': degree2, 'weight': distance };
        let index = this.checkIndexOfNodeData(this.mapNodes.prevActiveNode.id, 'node');
        this.mapNodes.nodeData[index].links.push(linkJson);
        this.mapNodes.nodeData[index].flag = true;
        linkJson = { 'link_node_id': this.mapNodes.prevActiveNode.id, 'degree': degree1, 'weight': distance };
        index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
        this.mapNodes.nodeData[index].links.push(linkJson);
        this.mapNodes.nodeData[index].flag = true;
      }
    } else if (check1 === 2 && check2 === 1) {
      for (const ii in this.mapNodes.activeNode.links) {
        if (this.mapNodes.activeNode.links[ii].r_link_node_id === this.mapNodes.prevActiveNode.r_id) {
          linkFlag = 1;
          break;
        }
      }
      if (linkFlag !== 1) {
        linkJson = { 'link_node_id': this.mapNodes.activeNode.id, 'degree': degree2, 'weight': distance };
        this.mapNodes.newNodeData[this.mapNodes.prevActiveNode.r_id].links.push(linkJson);
        linkJson = { 'r_link_node_id': this.mapNodes.prevActiveNode.r_id, 'degree': degree1, 'weight': distance };
        const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
        this.mapNodes.nodeData[index].links.push(linkJson);
        this.mapNodes.nodeData[index].flag = true;
      }
    } else {
      for (const ii in this.mapNodes.activeNode.links) {
        if (this.mapNodes.activeNode.links[ii].r_link_node_id === this.mapNodes.prevActiveNode.r_id) {
          linkFlag = 1;
          break;
        }
      }
      if (linkFlag !== 1) {
        linkJson = { 'r_link_node_id': this.mapNodes.activeNode.r_id, 'degree': degree2, 'weight': distance };
        this.mapNodes.newNodeData[this.mapNodes.prevActiveNode.r_id].links.push(linkJson);
        linkJson = { 'r_link_node_id': this.mapNodes.prevActiveNode.r_id, 'degree': degree1, 'weight': distance };
        this.mapNodes.newNodeData[this.mapNodes.activeNode.r_id].links.push(linkJson);
      }
    }
    if (linkFlag !== 1) {

      this.mapNodes.noOfLinks = this.mapNodes.noOfLinks + 2;
      const pointList = [ [this.mapNodes.activeNode.y, this.mapNodes.activeNode.x],
                          [this.mapNodes.prevActiveNode.y, this.mapNodes.prevActiveNode.x]];
      this.nodeLink[this.mapNodes.noOfLinks] = new L.Polyline(pointList, {
        color: 'red', weight: 3,
        opacity: 0.5, smoothFactor: 1
      });
      this.nodeLink[this.mapNodes.noOfLinks].addTo(this.map);
      this.mapNodes.noOfLinks = this.mapNodes.noOfLinks + 1;
    }
   }
   findDirection(x1, x2, y1, y2, isGenerate = false) {
     const data = Math.atan2(y2 - y1, x2 - x1);
     let value;
     if(isGenerate) {
      if (data > -0.79 && data < 0.79) {
        value = 180;
      } else if (data > 0.79 && data < 2.36) {
        value = 90;
      } else if (data > 2.36 || data < -2.36) {
        value = 0;
      } else if (data > -2.36 && data < -0.79) {
        value = 270;
      }
    } else {
      let a = { v1 : [x1,y1], v2 : [x2,y2]};
      let angle = this.getAngle(this.mapNodes.origin, a['v1'], a['v2'])
      value = angle['res'];  
    }
    return value;
   }
   makeLoadNodeActive(nodePoint, checkNode) {
    this.ipButton.isDistOpen = false;
       this.mapNodes.exitNodeFlag = 0;
       this.mapNodes.prevActiveNode = this.mapNodes.activeNode;
       if (this.mapNodes.prevActiveNode != null && 'id' in this.mapNodes.prevActiveNode &&
          'exit' in this.mapNodes.prevActiveNode && this.mapNodes.prevActiveNode.exit !== 0) {
         if (this.mapNodes.exitPointData.hasOwnProperty('id' + this.mapNodes.prevActiveNode.id)) {
          this.mapNodes.exitPointData['id' + this.mapNodes.prevActiveNode.id].options.icon.options.html =
                                  '<div>' + this.mapNodes.prevActiveNode.exit + '</div>';
          this.map.addLayer(this.mapNodes.exitPointData['id' + this.mapNodes.prevActiveNode.id]);
         }
       }
       const value = nodePoint.getLatLng();
       const nodeIcon = nodePoint.options.icon;
       nodeIcon.options.iconUrl = '/assets/Alert/common_icons/red-dot.png';
       nodePoint.setIcon(nodeIcon);
       if (this.mapNodes.prevActiveNode != null && this.mapNodes.lastNode === 0 && !this.ipButton.isGenerateNode) {
         console.log('release');
         this.releasePrevNode();
       }
       this.mapNodes.activeMarker = nodePoint;
       if (checkNode === 'existNode') {
        const index = this.checkLatLngOfNodeData(value.lng, value.lat, 'node');
          this.mapNodes.activeNode = this.mapNodes.nodeData[index];
       } else if (checkNode === 'newNode') {
        const index = this.checkLatLngOfNodeData(value.lng, value.lat, 'newNode');
        this.mapNodes.activeNode = this.mapNodes.newNodeData[index];
       }
       if ('r_exit' in this.mapNodes.activeNode &&
            (this.mapNodes.activeNode.type === 'NT-LN' || this.mapNodes.activeNode.type === 'NT-SN')) {
        this.mapNodes.exitNodeFlag = 1;
       }
        this.setXYValue(this.mapNodes.activeNode);
        this.checkActiveNodeId();
        if (this.mapNodes.activeNode != null && 'id' in this.mapNodes.activeNode
          && 'exit' in this.mapNodes.activeNode && this.mapNodes.activeNode.exit !== 0) {
          if (this.mapNodes.exitPointData.hasOwnProperty('id' + this.mapNodes.activeNode.id)) {
            this.map.removeLayer(this.mapNodes.exitPointData['id' + this.mapNodes.activeNode.id]);
          }
        }
        this.ipButton.isActiveNode = true;
        if (this.ipButton.isNodeLink) {
          console.log('link');
          this.ipButton.isNodeLink = false;
          this.createLink();
        }
   }
   setXYValue(node) {
    this.xValue.setValue((node.x / 100).toFixed(2));
    this.yValue.setValue(-(node.y / 100).toFixed(2));
   }
   checkActiveNodeId() {
    if ('id' in this.mapNodes.activeNode) {
      this.mapNodes.activeNodeId = 1;
    } else {
      this.mapNodes.activeNodeId = 2;
    }
  }
  getLinkData(node) {
    this.mapNodes.distNodeList = JSON.parse(JSON.stringify(node));
    const selectedLoc = this.floorLocations.find(res => res.id === this.mapNodes.distNodeList['location_id']);
    this.mapNodes.distNodeList['loc'] = (selectedLoc !== undefined && selectedLoc != null) ? selectedLoc.name : '';
    if (this.mapNodes.distNodeList != null) {
    for (const i in this.mapNodes.distNodeList['links']) {
      if (this.mapNodes.distNodeList['links'][i].hasOwnProperty('link_node_id')) {
        const val = this.mapNodes.nodeData.find(res => res.id === this.mapNodes.distNodeList['links'][i]['link_node_id']);
        if (val) {
          const loc = this.floorLocations.find(res => res.id === val.location_id);
          this.mapNodes.distNodeList['links'][i]['loc'] = (loc !== undefined && loc != null) ? loc.name : '';
          this.mapNodes.distNodeList['links'][i]['locId'] = val.location_id;
        } else {
          for (const j in this.allNodes) {
            const val1 = this.allNodes[j]['nodes'].filter(res => res.id === this.mapNodes.distNodeList['links'][i]['link_node_id']);
            if (val1.length) {
              const loc = this.locations.find(res => res.id === val1[0].location_id);
              this.mapNodes.distNodeList['links'][i]['loc'] = (loc !== undefined && loc != null) ? loc.name : '';
              this.mapNodes.distNodeList['links'][i]['locId'] = val1[0].location_id;
            }
          }
        }

      } else {
        let val = null;
        this.mapNodes.newNodeData.forEach((res, index) => {
          if (res.r_id === this.mapNodes.distNodeList['links'][i]['r_link_node_id']) {
            val = res;
          }
        });
        if (val != null) {
          const loc = this.floorLocations.find(res => res.id === val.location_id);
          this.mapNodes.distNodeList['links'][i]['loc'] = (loc !== undefined && loc != null) ? loc.name : '';
        }
      }
    }
    }
    this.ipButton.isDistOpen = !this.ipButton.isDistOpen;
  }
  editNode(node) {
    console.log(node);
    this.selectedNodeDist.setValue(node.weight);
    this.mapNodes.distLinkId = node.hasOwnProperty('r_link_node_id') ?
                                node.r_link_node_id : node.hasOwnProperty('link_node_id') ? node.link_node_id : null;
  }
  applyChanges(node, val) {
    console.log(val);
    console.log(this.mapNodes.activeNode);
    console.log(this.mapNodes.distLinkId);
    this.mapNodes.distLinkId = node.hasOwnProperty('r_link_node_id') ?
                                node.r_link_node_id : node.hasOwnProperty('link_node_id') ? node.link_node_id : null;
    const distVal = parseFloat(val);
    if ('id' in this.mapNodes.activeNode) {
      console.log('node');
      const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
      console.log(index);
      console.log(this.mapNodes.nodeData);
      console.log(this.mapNodes.nodeData[index]);
      for (const i in this.mapNodes.nodeData[index].links) {
        if (this.mapNodes.nodeData[index].links[i].hasOwnProperty('link_node_id')
          && this.mapNodes.nodeData[index].links[i].link_node_id === this.mapNodes.distLinkId) {
          console.log(this.mapNodes.nodeData[index].links[i].weight);
          this.mapNodes.nodeData[index].links[i].weight = distVal;
          this.mapNodes.nodeData[index].flag = true;
        } else if (this.mapNodes.nodeData[index].links[i].hasOwnProperty('r_link_node_id')
          && this.mapNodes.nodeData[index].links[i].r_link_node_id === this.mapNodes.distLinkId) {
          this.mapNodes.nodeData[index].links[i].weight = distVal;
          console.log(this.mapNodes.nodeData[index].links[i].weight);
        }
      }
    } else if ('r_id' in this.mapNodes.activeNode) {
      console.log('newNode');
      const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.r_id, 'newNode');
      console.log(index);
      console.log(this.mapNodes.newNodeData);
      console.log(this.mapNodes.newNodeData[index]);
      for (const i in this.mapNodes.newNodeData[index].links) {
        if (this.mapNodes.newNodeData[index].links[i].hasOwnProperty('link_node_id')
          &&  this.mapNodes.newNodeData[index].links[i].link_node_id === this.mapNodes.distLinkId) {
          console.log(this.mapNodes.newNodeData[index].links[i].weight);
          this.mapNodes.newNodeData[index].links[i].weight = distVal;
        } else if (this.mapNodes.newNodeData[index].links[i].hasOwnProperty('r_link_node_id')
          && this.mapNodes.newNodeData[index].links[i].r_link_node_id === this.mapNodes.distLinkId) {
          console.log(this.mapNodes.newNodeData[index].links[i].weight);
          this.mapNodes.newNodeData[index].links[i].weight = distVal;
        }
      }

    }
  }
  delete() {
    if (this.mapNodes.activeNode != null) {
      if ('id' in this.mapNodes.activeNode) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass:['confirmation-popup'],
          data: {
            title: 'Confirmation',
            message: 'Are you sure you want to delete existing node?',
            buttonText: { ok: 'Yes', cancel: 'No' }
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result === 'Yes') {
            this.deleteNode('existNode');
          }
        });
          
      } else {
        this.deleteNode('tempNode');
      }
    }
  }
  deleteLoadNode() {
    this.map.removeLayer(this.mapNodes.activeMarker);
    const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
    for (const i in this.mapNodes.nodeData[index].links) {
      if ('link_node_id' in this.mapNodes.nodeData[index].links[i]) {
        const linkedNodeid = this.checkIndexOfNodeData(this.mapNodes.nodeData[index].links[i].link_node_id, 'node');
        if (linkedNodeid !== -1) {
          for (const j in this.mapNodes.nodeData[linkedNodeid].links) {
            if (this.mapNodes.nodeData[linkedNodeid].links[j].link_node_id === this.mapNodes.activeNode.id) {
              this.mapNodes.nodeData[linkedNodeid].links.splice(j, 1);
              this.mapNodes.nodeData[linkedNodeid].flag = true;
              this.checkLine(this.mapNodes.nodeData[index].x, this.mapNodes.nodeData[index].y,
                              this.mapNodes.nodeData[linkedNodeid].x, this.mapNodes.nodeData[linkedNodeid].y);
            }
          }
        }
      }
    }
    const deleteNode = this.mapNodes.nodeData[index].id;
    this.mapNodes.nodeData[index] = null;
    this.hospitalServices.deleteNodePoint(deleteNode).subscribe(res => {
      console.log(this.floorId);
      this.snackbar.open(res.message, 'Success', {
          duration: 2000,
      });
      this.changeFloor(this.floorId, 'delete');
    });
  }
  deleteAllNode() {
    const param = '?locationId=' + this.floorId;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete all nodes?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.hospitalServices.deleteAllNodePoints(param).subscribe(res => {
          console.log(this.floorId);
          this.snackbar.open(res.message, 'Success', {
              duration: 2000,
          });
          this.changeFloor(this.floorId, 'delete');
        });
      }
    });
  }
  deleteNode(type) {
    let linkedNodeid = null;
    let lastNode = 0;
    if (this.mapNodes.activeNode.exit !== 0) {
      const exitJson = { 'id': this.mapNodes.activeNode.exit, 'name': 'Exit' + this.mapNodes.activeNode.exit };
      this.ipSelect.tempExitNodeList.push(exitJson);
    }
    this.map.removeLayer(this.mapNodes.activeMarker);
    let valIndex;
    if (type === 'tempNode') {
      valIndex = this.mapNodes.activeNode.r_id;
    } else if (type === 'existNode') {
      valIndex = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
    }
    if (type === 'tempNode') {
      this.mapNodes.newNodeData[valIndex].links.forEach((val, index) => {
        if (val.hasOwnProperty('link_node_id')) {
          linkedNodeid = this.checkIndexOfNodeData(val.link_node_id, 'node');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.nodeData[linkedNodeid].links) {
              if (this.mapNodes.nodeData[linkedNodeid].links[j].r_link_node_id === valIndex) {
                this.mapNodes.nodeData[linkedNodeid].links.splice(j, 1);
                this.mapNodes.nodeData[linkedNodeid].flag = true;
                this.checkLine(this.mapNodes.newNodeData[valIndex].x, this.mapNodes.newNodeData[valIndex].y,
                    this.mapNodes.nodeData[linkedNodeid].x, this.mapNodes.nodeData[linkedNodeid].y);
              }
            }
          }
          lastNode = 1;
        } else {
          linkedNodeid = this.checkIndexOfNodeData(val.r_link_node_id, 'newNode');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.newNodeData[linkedNodeid].links) {
              if (this.mapNodes.newNodeData[linkedNodeid].links[j].r_link_node_id === valIndex) {
                this.mapNodes.newNodeData[linkedNodeid].links.splice(j, 1);
                this.mapNodes.newNodeData[linkedNodeid].flag = true;
                this.checkLine(this.mapNodes.newNodeData[valIndex].x, this.mapNodes.newNodeData[valIndex].y,
                      this.mapNodes.newNodeData[linkedNodeid].x, this.mapNodes.newNodeData[linkedNodeid].y);
              }
            }
          }
          lastNode = 2;
        }
      });
    } else if (type === 'existNode') {
      this.mapNodes.nodeData[valIndex].links.forEach((val, index) => {
        if (val.hasOwnProperty('link_node_id')) {
          linkedNodeid = this.checkIndexOfNodeData(val.link_node_id, 'node');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.nodeData[linkedNodeid].links) {
              if (this.mapNodes.nodeData[linkedNodeid].links[j].link_node_id === this.mapNodes.activeNode.id) {
                this.mapNodes.nodeData[linkedNodeid].links.splice(j, 1);
                this.mapNodes.nodeData[linkedNodeid].flag = true;
                this.checkLine(this.mapNodes.nodeData[linkedNodeid].x, this.mapNodes.nodeData[linkedNodeid].y,
                      this.mapNodes.nodeData[valIndex].x, this.mapNodes.nodeData[valIndex].y);
              }
            }
          }
          lastNode = 1;
        } else {
          linkedNodeid = this.checkIndexOfNodeData(val.r_link_node_id, 'newNode');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.newNodeData[linkedNodeid].links) {
              if (this.mapNodes.newNodeData[linkedNodeid].links[j].link_node_id === this.mapNodes.activeNode.id) {
                this.mapNodes.newNodeData[linkedNodeid].links.splice(j, 1);
                this.mapNodes.newNodeData[linkedNodeid].flag = true;
                this.checkLine(this.mapNodes.newNodeData[linkedNodeid].x, this.mapNodes.newNodeData[linkedNodeid].y,
                    this.mapNodes.nodeData[valIndex].x, this.mapNodes.nodeData[valIndex].y);
              }
            }
          }
          lastNode = 2;
        }
      });
      const deleteNode = this.mapNodes.nodeData[valIndex].id;
      if (linkedNodeid > valIndex) {
        linkedNodeid = linkedNodeid - 1;
      }
      this.mapNodes.nodeData.splice(valIndex , 1);
      const param = '?nodeId=' + deleteNode;
      this.hospitalServices.deleteAllNodePoints(param).subscribe(res => {
        this.snackbar.open(res.message, 'Success', {
            duration: 2000,
        });
      });
    }
    this.mapNodes.activeNode = null;
    if (lastNode === 1) {
      let keyVal;
      if (type === 'tempNode') {
        keyVal = 'id' + this.mapNodes.nodeData[linkedNodeid].id;
      } else if (type === 'existNode') {
        if (linkedNodeid === -1 && this.mapNodes.nodeData.length) {
          keyVal = 'id' + this.mapNodes.nodeData[this.mapNodes.nodeData.length - 1].id;
        } else {
          keyVal = 'id' + this.mapNodes.nodeData[linkedNodeid].id;
        }
      }
      this.makeLoadNodeActive(this.mapNodes.nodePointData[keyVal], 'existNode');
      this.mapNodes.newNodeData[valIndex] = null;

    } else if (lastNode === 2) {
      const keyVal = 'r_id' + this.mapNodes.newNodeData[linkedNodeid].r_id;
      this.makeLoadNodeActive(this.mapNodes.nodePointData[keyVal], 'newNode');
      this.mapNodes.newNodeData[valIndex] = null;
    } else {
      this.mapNodes.newNodeData[valIndex] = null;
      if (type === 'existNode' && this.mapNodes.nodeData.length) {
        const keyVal = 'id' + this.mapNodes.nodeData[this.mapNodes.nodeData.length - 1].id;
        this.makeLoadNodeActive(this.mapNodes.nodePointData[keyVal], 'existNode');
      } else if (type === 'tempNode' && this.mapNodes.newNodeData.length) {
        const filData = this.mapNodes.newNodeData.filter(res => res != null);
        if (filData.length) {
          const keyVal = 'r_id' + filData[filData.length - 1].r_id;
          this.makeLoadNodeActive(this.mapNodes.nodePointData[keyVal], 'newNode');
        }
      }
      this.ipButton.isActiveNode = false;
    }
    const isNewNode = this.mapNodes.newNodeData.find(res => res != null);
    if (isNewNode === undefined) {
      this.ipButton.isAllDelete = true;
    } else {
      this.ipButton.isAllDelete = false;
    }
  }
  generateNode() {
    this.mapNodes.isDelete = 1;
    if (this.mapNodes.activeNode != null) {
      this.ipButton.isGenerateNode = !this.ipButton.isGenerateNode;
    }
  }
  linkNode() {
    if (this.mapNodes.activeNode != null) {
      this.mapNodes.isDelete = 1;
      this.ipButton.isNodeLink = true;
    }
  }
  changeType(typeValue) {
    console.log(this.ipSelect.tempExitNodeList);
    console.log(this.mapNodes.activeNode);
    this.mapNodes.isDelete = 1;
    let flag1 = 0;
    this.mapNodes.typeValue = typeValue;
    this.mapNodes.exitNodeFlag = 0;
    if (typeValue !== 'NT-RN' && typeValue !== 'NT-NN') {
      this.mapNodes.exitNodeFlag = 1;
      this.mapNodes.exitNodeCount = this.mapNodes.exitNodeCount + 1;
      if ('id' in this.mapNodes.activeNode) {
        const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
        delete this.mapNodes.nodeData[index].exit;
        this.mapNodes.nodeData[index].r_exit = this.mapNodes.exitNodeCount;
        this.mapNodes.nodeData[index].flag = true;
        this.mapNodes.nodeData[index].type = typeValue;
        this.mapNodes.activeNode = this.mapNodes.nodeData[index];
      } else {
        const index = this.mapNodes.activeNode.r_id;
        delete this.mapNodes.newNodeData[index].exit;
        this.mapNodes.newNodeData[index].r_exit = this.mapNodes.exitNodeCount;
        this.mapNodes.newNodeData[index].type = typeValue;
        this.mapNodes.activeNode = this.mapNodes.newNodeData[index];
      }
      this.mapNodes.exitSpliceValue = null;
    }
    if (typeValue === 'NT-RN') {
      for (const i in this.mapNodes.nodeData) {
        if (this.mapNodes.nodeData[i].location_id === this.mapNodes.activeNode.location_id) {
          if (this.mapNodes.nodeData[i].type === 'NT-RN') {
            flag1 = 1;
          }
        }
      }
      for (const i in this.mapNodes.newNodeData) {
        if (this.mapNodes.newNodeData[i].location_id === this.mapNodes.activeNode.location_id) {
          if (this.mapNodes.newNodeData[i].type === 'NT-RN') {
            flag1 = 1;
          }
        }
      }
      console.log(flag1);
      if (flag1 !== 1 || true) {
        if ('id' in this.mapNodes.activeNode) {
          const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
          this.mapNodes.nodeData[index].type = typeValue;
          this.mapNodes.nodeData[index].flag = true;
          this.mapNodes.nodeData[index].exit = 0;
          this.mapNodes.activeNode = this.mapNodes.nodeData[index];

        } else {
          const index = this.mapNodes.activeNode.r_id;
          if ('r_exit' in this.mapNodes.activeNode) {
            delete this.mapNodes.newNodeData[index].r_exit;
          }
          this.mapNodes.newNodeData[index].exit = 0;
          this.mapNodes.newNodeData[index].type = typeValue;
          this.mapNodes.activeNode = this.mapNodes.newNodeData[index];
        }
      }

    } else if (typeValue === 'NT-NN') {
      console.log(this.mapNodes.activeNode);
      if ('id' in this.mapNodes.activeNode) {
        const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
        this.mapNodes.nodeData[index].type = typeValue;
        this.mapNodes.nodeData[index].flag = true;
        this.mapNodes.nodeData[index].exit = 0;
        this.mapNodes.activeNode = this.mapNodes.nodeData[index];

      } else {
        const index = this.mapNodes.activeNode.r_id;
        if ('r_exit' in this.mapNodes.activeNode) {
          delete this.mapNodes.newNodeData[index].r_exit;
        }
        this.mapNodes.newNodeData[index].exit = 0;
        this.mapNodes.newNodeData[index].type = typeValue;
        this.mapNodes.activeNode = this.mapNodes.newNodeData[index];
      }
      console.log(this.mapNodes.activeNode);

    }
  }
  linkExit(val) {
    console.log(val);
    let value = JSON.parse(JSON.stringify(val));
    let i;
    if (val === 'new') {
      this.mapNodes.exitNodeCount = this.mapNodes.exitNodeCount + 1;
      value = this.mapNodes.exitNodeCount;
      value = parseInt(value, 10);
    } else {
      value = parseInt(value, 10);
      this.mapNodes.exitNodeCount = this.mapNodes.exitNodeCount - 1;
    }
    if ('id' in this.mapNodes.activeNode) {
      const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
      if (val === 'new') {
        delete this.mapNodes.nodeData[index].exit;
        this.mapNodes.nodeData[index].r_exit = value;
        this.mapNodes.selectedExitList.splice(this.mapNodes.activeNode.id, 1);
      } else {
        delete this.mapNodes.nodeData[index].r_exit;
        this.mapNodes.nodeData[index].exit = value;
        this.mapNodes.selectedExitList[this.mapNodes.activeNode.id] = value;
      }
      this.mapNodes.nodeData[index].type = this.mapNodes.activeNode.type;
      this.mapNodes.nodeData[index].flag = true;
    } else {
      const index = this.mapNodes.activeNode.r_id;
      if (val === 'new') {
        delete this.mapNodes.newNodeData[index].exit;
        this.mapNodes.newNodeData[index].r_exit = value;
        this.mapNodes.selectedExitList.splice(this.mapNodes.activeNode.r_id, 1);
      } else {
        delete this.mapNodes.newNodeData[index].r_exit;
        this.mapNodes.newNodeData[index].exit = value;
        this.mapNodes.selectedExitList[this.mapNodes.activeNode.r_id] = value;
      }
      this.mapNodes.newNodeData[index].type = this.mapNodes.activeNode.type;
    }
    for (i in this.ipSelect.tempExitNodeList) {
      if (this.ipSelect.tempExitNodeList[i].id === value) {
        break;
      }
    }

    this.mapNodes.exitSpliceValue = i;
    if (val !== 'new') {
      this.mapNodes.activeNode.exit = value;
    }
  }
  changeLocation(event) {
    console.log(event);
    const locId = parseInt(event, 10);
    if ('id' in this.mapNodes.activeNode) {
      const index = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
      this.mapNodes.nodeData[index].location_id = locId;
      this.mapNodes.nodeData[index].flag = true;
      this.mapNodes.activeNode = this.mapNodes.nodeData[index];

    } else {
      const index = this.mapNodes.activeNode.r_id;
      this.mapNodes.newNodeData[index].location_id = locId;
      this.mapNodes.activeNode = this.mapNodes.newNodeData[index];
    }
  }
  changeFloor(event, type) {
    console.log(event);
    this.reader.reader_points = [];
    this.reader.reader_postion = {};
    this.polyLatLng = {};
    this.ipButton.isActiveNode = false;
    this.ipButton.isGenerateNode = false;
    this.ipButton.isShowReader = false;
    this.ipButton.isNodeLink = false;
    this.ipButton.selectedToggle = this.ipButton.selectedToggle;
    this.ipButton.isDistOpen = false;
    this.mapNodes.nodeData = [];
    this.mapNodes.newNodeData = [];
    this.mapNodes.nodePointData = [];
    this.mapNodes.lastNode = 0;
    this.mapNodes.activeNodeId = null;
    this.mapNodes.typeValue = null;
    this.mapNodes.exitSpliceValue = null;
    this.mapNodes.exitNodeCount = 0;
    this.mapNodes.exitNodeFlag = 0;
    this.mapNodes.isDelete = 0;
    this.mapNodes.noOfLinks = 0;
    this.mapNodes.noOfNodes = 0;
    this.nodeLink = [];
    if (type === 'floorChange') {
      this.commonServices.getAllLocationById(event).subscribe(res => {
        console.log(res);
        this.floorId = event;
        this.floorData = res.results;

        this.floorLocations = this.floorData[0].locations;
        const floorData = this.floorData[0];
        this.floorLocations.unshift(floorData);

        this.getNodeMap(this.floorData[0]);
      });
    } else if (type === 'delete') {
      this.getNodeMap(this.floorData[0]);
    }
  }
  toggleChange(val) {
    console.log(val);
    this.ipButton.selectedToggle = val;
  }
  toggleMethod(value, target) {
    if (this.ipButton.selectedToggle === 'move') {
      this.moveNode(value, target);
    } else {
      this.createnewNodePoint(value);
    }
  }
  createnewNodePoint(value) {
    this.mapNodes.isDelete = 1;
    let valX = this.mapNodes.activeNode.x;
    let valY = this.mapNodes.activeNode.y;

    valX =  value === 'r' ? this.mapNodes.activeNode.x + (this.mapNodes.nodeDistance * 100) :
            value === 'l' ? this.mapNodes.activeNode.x - (this.mapNodes.nodeDistance * 100) :
            value === 'u' ? this.mapNodes.activeNode.x :
            value === 'd' ? this.mapNodes.activeNode.x : this.mapNodes.activeNode.x;

    valY =  value === 'r' ? this.mapNodes.activeNode.y :
            value === 'l' ? this.mapNodes.activeNode.y :
            value === 'u' ? this.mapNodes.activeNode.y + (this.mapNodes.nodeDistance * 100) :
            value === 'd' ? this.mapNodes.activeNode.y - (this.mapNodes.nodeDistance * 100) : this.mapNodes.activeNode.y;
    
    let checkNodelen1 = this.mapNodes['nodeData'].filter(val => val !=null && val.x == valX && val.y == valY);
    let checkNodelen2 = this.mapNodes['newNodeData'].filter(val => val !=null && val.x == valX && val.y == valY);
    if(checkNodelen1.length == 0 && checkNodelen2.length == 0) {
    let locId = this.mapNodes.activeNode.location_id;
    for (const i in this.polyLatLng) {
      if (this.polyLatLng[i].getBounds().contains({lat: valY, lng: valX})) {
        locId = i;
        if (pointInPoly([ valY, valX ], this.polyLatLng[i]['editing']['poly'])) {
          let checkNode1 = this.mapNodes['nodeData'].filter(val => val !=null && val.location_id == locId);
          let checkNode2 = this.mapNodes['newNodeData'].filter(val => val !=null && val.location_id == locId);
          checkNode1 = checkNode1.concat(checkNode2)
          for (const i in checkNode1) {
            const distance = Math.sqrt( 
              Math.pow((checkNode1[i]['x'] - valX), 2) + 
              Math.pow((checkNode1[i]['y'] - valY), 2)
            );
            if(distance <= 40) {
              this.toastr.warning('Warning', `We cant create node with minimum distance`);
              return
            }
          }
          break;
        }
      }
    }
    if (this.locationImage.getBounds().contains({lat: valY, lng: valX})) {
      this.mapNodes.prevActiveNode = this.mapNodes.activeNode;
      this.releasePrevNode();
      this.createNode(locId, valY, valX, 'create');
      this.createLink();
      const nodeIcon = this.mapNodes.activeMarker.options.icon;
      nodeIcon.options.iconUrl = '/assets/Alert/common_icons/red-dot.png';
      this.mapNodes.activeMarker.setIcon(nodeIcon);
    }
    } else {
      this.toastr.warning('Warning', `We cant create node in same coordinates..`);
    }
  }
  moveNode(value, target) {
    console.log('move node ');
    let val;
    if (value === 'r' && target === 1) {
      this.moveNodeFunc(10, 'x');
    } else if (value === 'l' && target === 1) {
      this.moveNodeFunc(-10, 'x');
    } else if (value === 'u' && target === 1) {
      this.moveNodeFunc(10, 'y');
    } else if (value === 'd' && target === 1) {
      this.moveNodeFunc(-10, 'y');
    } else {
      if (target === 'x') {
        val = this.mapNodes.activeNode.x - (value * 100);
        if (val < 1) { this.moveNodeFunc((-1) * val, 'x'); } else {
          this.moveNodeFunc((-1) * val, 'x');
        }
      } else {
        if (target === 'y') {
          val = this.mapNodes.activeNode.y - ((value * 100) * -1);
          if (val < 1) {
            this.moveNodeFunc((-1) * val, 'y');
          } else {
            this.moveNodeFunc((-1) * val, 'y');
          }
        }
      }
    }
    this.mapNodes.isDelete = 1;
  }
  moveNodeFunc(quant, ord) {
    console.log('move func');
    let dummy;
    const valX = JSON.parse(JSON.stringify(this.mapNodes.activeNode.x)) + quant;
    const valY = JSON.parse(JSON.stringify(this.mapNodes.activeNode.y)) + quant;
    if (this.locationImage.getBounds().contains({lat: valY, lng: valX})) {
    if ('id' in this.mapNodes.activeNode) {
      let linkedNodeid = null;
      const valIndex = this.checkIndexOfNodeData(this.mapNodes.activeNode.id, 'node');
      const oldNode = this.mapNodes.nodeData[valIndex];
      this.mapNodes.nodeData[valIndex].flag = true;
      this.mapNodes.nodeData[valIndex].links.forEach((val, index) => {
        if (val.hasOwnProperty('link_node_id')) {
          linkedNodeid = this.checkIndexOfNodeData(val.link_node_id, 'node');
          if (linkedNodeid !== -1) {
            this.mapNodes.prevActiveNode = this.mapNodes.nodeData[linkedNodeid];
            for (const j in this.mapNodes.nodeData[linkedNodeid].links) {
              if (this.mapNodes.nodeData[linkedNodeid].links[j].link_node_id === this.mapNodes.activeNode.id) {
                this.mapNodes.nodeData[linkedNodeid].flag = true;
                this.checkLine(oldNode.x, oldNode.y, this.mapNodes.nodeData[linkedNodeid].x, this.mapNodes.nodeData[linkedNodeid].y);
                dummy = j;
                break;
              }
            }
            this.getNodeLinkData(true, 'link_node_id' , linkedNodeid, oldNode, valIndex, dummy,
              index, this.mapNodes.nodeData, null, ord, quant);
          }
        } else {
          linkedNodeid = this.checkIndexOfNodeData(val.r_link_node_id, 'newNode');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.newNodeData[linkedNodeid].links) {
              if (this.mapNodes.newNodeData[linkedNodeid].links[j].link_node_id === this.mapNodes.activeNode.id) {
                this.mapNodes.newNodeData[linkedNodeid].flag = true;
                this.checkLine(oldNode.x, oldNode.y, this.mapNodes.newNodeData[linkedNodeid].x, this.mapNodes.newNodeData[linkedNodeid].y);
                dummy = j;
                break;
              }
            }
            this.getNodeLinkData(true, 'id' , linkedNodeid, oldNode, valIndex, dummy,
              index, this.mapNodes.nodeData, this.mapNodes.newNodeData, ord, quant);
          }
        }

      });
      if (ord === 'x') {
        this.mapNodes.nodeData[valIndex].x = this.mapNodes.nodeData[valIndex].x + quant;
      } else {
        this.mapNodes.nodeData[valIndex].y = this.mapNodes.nodeData[valIndex].y + quant;
      }
      const newLatLng = new L.LatLng(this.mapNodes.nodeData[valIndex].y, this.mapNodes.nodeData[valIndex].x);
      console.log(newLatLng);
      this.mapNodes.activeMarker.setLatLng(newLatLng);
      console.log(this.mapNodes.nodeData[valIndex]);
      for (const i in this.polyLatLng) {
        if (this.polyLatLng[i].getBounds().contains({lat: this.mapNodes.nodeData[valIndex].y, lng: this.mapNodes.nodeData[valIndex].x})) {
          const locId = i;
          this.mapNodes.nodeData[valIndex].location_id = locId;
          break;
        }
      }
      this.mapNodes.activeNode = this.mapNodes.nodeData[valIndex];
      this.setXYValue(this.mapNodes.activeNode);
    } else {
      let linkedNodeid = null;
      const valIndex = this.mapNodes.activeNode.r_id;
      const oldNode = this.mapNodes.newNodeData[valIndex];
      this.mapNodes.newNodeData[valIndex].flag = true;
      this.mapNodes.newNodeData[valIndex].links.forEach((val, index) => {
        if (val.hasOwnProperty('link_node_id')) {
          linkedNodeid = this.checkIndexOfNodeData(val.link_node_id, 'node');
          if (linkedNodeid !== -1) {
            this.mapNodes.prevActiveNode = this.mapNodes.nodeData[linkedNodeid];
            console.log( this.mapNodes.nodeData[linkedNodeid].links);
            for (const j in this.mapNodes.nodeData[linkedNodeid].links) {
              if (this.mapNodes.nodeData[linkedNodeid].links[j].r_link_node_id === valIndex) {
                this.mapNodes.nodeData[linkedNodeid].flag = true;
                this.checkLine(oldNode.x, oldNode.y, this.mapNodes.nodeData[linkedNodeid].x, this.mapNodes.nodeData[linkedNodeid].y);
                dummy = j;
                break;
              }
            }
            this.getNodeLinkData(false, 'id' , linkedNodeid, oldNode, valIndex, dummy,
                index, this.mapNodes.newNodeData, this.mapNodes.nodeData, ord, quant);
          }
        } else {
          linkedNodeid = this.checkIndexOfNodeData(val.r_link_node_id, 'newNode');
          if (linkedNodeid !== -1) {
            for (const j in this.mapNodes.newNodeData[linkedNodeid].links) {
              if (this.mapNodes.newNodeData[linkedNodeid].links[j].r_link_node_id === valIndex) {
                this.mapNodes.newNodeData[linkedNodeid].flag = true;
                this.checkLine(oldNode.x, oldNode.y, this.mapNodes.newNodeData[linkedNodeid].x, this.mapNodes.newNodeData[linkedNodeid].y);
                dummy = j;
                break;
              }
            }
            this.getNodeLinkData(false, 'link_node_id' , linkedNodeid, oldNode, valIndex, dummy,
                index, this.mapNodes.newNodeData, null, ord, quant);
          }
        }
      });
      if (ord === 'x') {
        this.mapNodes.newNodeData[valIndex].x = this.mapNodes.newNodeData[valIndex].x + quant;
      } else {
        this.mapNodes.newNodeData[valIndex].y = this.mapNodes.newNodeData[valIndex].y + quant;
      }
      const newLatLng = new L.LatLng(this.mapNodes.newNodeData[valIndex].y, this.mapNodes.newNodeData[valIndex].x);
      console.log(newLatLng);
      this.mapNodes.activeMarker.setLatLng(newLatLng);
      console.log(this.mapNodes.newNodeData[valIndex]);
      for (const i in this.polyLatLng) {
        if (this.polyLatLng[i].getBounds().contains(
            {lat: this.mapNodes.newNodeData[valIndex].y, lng: this.mapNodes.newNodeData[valIndex].x})) {
          const locId = i;
          this.mapNodes.newNodeData[valIndex].location_id = locId;
          break;
        }
      }
      this.mapNodes.activeNode = this.mapNodes.newNodeData[valIndex];
      this.setXYValue(this.mapNodes.activeNode);
    }
    }
  }
  getNodeLinkData(isId, isLink, linkedNodeid, oldNode, index, dummy, i, nodeData1, nodeData2, ord, quant) {
    let distance = 0;
    if ((isId && isLink === 'link_node_id') || (!isId && isLink === 'link_node_id')) {
      if (ord === 'x') {
        distance = Math.sqrt(Math.pow(((oldNode.x + quant) / 100 - (nodeData1[linkedNodeid].x) / 100), 2) +
                    Math.pow((oldNode.y / 100 - (nodeData1[linkedNodeid].y) / 100), 2));
        console.log(distance);
        nodeData1[index].links[i].degree = this.findDirection(oldNode.x + quant,
            nodeData1[linkedNodeid].x, oldNode.y, nodeData1[linkedNodeid].y);
        nodeData1[linkedNodeid].links[dummy].degree = this.findDirection(nodeData1[linkedNodeid].x,
            oldNode.x + quant, nodeData1[linkedNodeid].y, oldNode.y);
        nodeData1[index].links[i].weight = distance;
        nodeData1[linkedNodeid].links[dummy].weight = distance;
        this.createLinkNodes(oldNode.x + quant, oldNode.y, nodeData1[linkedNodeid].x, nodeData1[linkedNodeid].y);
      } else {
        distance = Math.sqrt(Math.pow((oldNode.x / 100 - (nodeData1[linkedNodeid].x) / 100), 2) +
          Math.pow(((oldNode.y + quant) / 100 - (nodeData1[linkedNodeid].y) / 100), 2));
        console.log(distance);
        nodeData1[index].links[i].degree = this.findDirection(oldNode.x, nodeData1[linkedNodeid].x,
            oldNode.y + quant, nodeData1[linkedNodeid].y);
        nodeData1[linkedNodeid].links[dummy].degree = this.findDirection(nodeData1[linkedNodeid].x,
            oldNode.x, nodeData1[linkedNodeid].y, oldNode.y + quant);
        nodeData1[index].links[i].weight = distance;
        nodeData1[linkedNodeid].links[dummy].weight = distance;
        this.createLinkNodes(oldNode.x, oldNode.y + quant, nodeData1[linkedNodeid].x, nodeData1[linkedNodeid].y);
      }
    } else if ((isId && isLink === 'id') || (!isId && isLink === 'id')) {
      if (ord === 'x') {
        distance = Math.sqrt(Math.pow(((oldNode.x + quant) / 100 - (nodeData2[linkedNodeid].x) / 100), 2) +
                    Math.pow((oldNode.y / 100 - (nodeData2[linkedNodeid].y) / 100), 2));
        nodeData1[index].links[i].degree = this.findDirection(oldNode.x + quant,
                    nodeData2[linkedNodeid].x, oldNode.y, nodeData2[linkedNodeid].y);
        nodeData2[linkedNodeid].links[dummy].degree = this.findDirection(nodeData2[linkedNodeid].x,
                    oldNode.x + quant, nodeData2[linkedNodeid].y, oldNode.y);
        nodeData1[index].links[i].weight = distance;
        nodeData2[linkedNodeid].links[dummy].weight = distance;
        this.createLinkNodes(oldNode.x + quant, oldNode.y, nodeData2[linkedNodeid].x, nodeData2[linkedNodeid].y);
      } else {
        distance = Math.sqrt(Math.pow((oldNode.x / 100 - (nodeData2[linkedNodeid].x) / 100), 2) +
                    Math.pow(((oldNode.y + quant) / 100 - (nodeData2[linkedNodeid].y) / 100), 2));
        nodeData1[index].links[i].degree = this.findDirection(oldNode.x, nodeData2[linkedNodeid].x,
                    oldNode.y + quant, nodeData2[linkedNodeid].y);
        nodeData2[linkedNodeid].links[dummy].degree = this.findDirection(nodeData2[linkedNodeid].x,
                    oldNode.x, nodeData2[linkedNodeid].y, oldNode.y + quant);
        nodeData1[index].links[i].weight = distance;
        nodeData2[linkedNodeid].links[dummy].weight = distance;
        this.createLinkNodes(oldNode.x, oldNode.y + quant, nodeData2[linkedNodeid].x, nodeData2[linkedNodeid].y);
      }
    }
  }
  saveNode(isClose) {
    let updateData = [];
    const finalUpdatenODE = [];
    if (this.mapNodes.nodeData != null) {
      updateData = this.mapNodes.nodeData.concat(this.mapNodes.newNodeData);
    } else {
      updateData = this.mapNodes.newNodeData;
    }
    for (const i in updateData) {
      if (updateData[i] != null) {
        updateData[i].x = updateData[i].x / 100;
        updateData[i].y = (updateData[i].y * -1) / 100;
        if (updateData[i].flag === true) {
          delete updateData[i].flag;
          finalUpdatenODE.push(updateData[i]);
        }
      }
    }
    console.log('constents to be saved');
    console.log(finalUpdatenODE);
    this.hospitalServices.saveNodePoints(finalUpdatenODE).subscribe(res => {
      if (res.message === 'Success' || res.message == null) {
        this.toastr.success('Success', `Node Points Saved Successfully`);
        if (isClose) {
          this.thisDialogRef.close('confirm');
        } else {
           this.changeFloor(this.floorId, 'floorChange');
        }
        
      }
    },
      error => {
        console.log('error');
        this.toastr.error('Error', `${error.message}`);
      });

  }
  startPreviewFromActiveNode() {
    // Clear any existing preview first
    this.clearPreviewLine();
    if (!this.mapNodes.activeMarker || !this.isShowCursorMovement) {
      return;
    }

    // Create a new preview line (initially just a point)
    this.previewLine = L.polyline([this.mapNodes.activeMarker.getLatLng(), this.mapNodes.activeMarker.getLatLng()],
      { color: 'blue', weight: 2, dashArray: '5, 10' }
    ).addTo(this.map);

    
    this.mouseMoveHandler = (event: any) => {
      if (!this.previewLine || !this.mapNodes.activeMarker) {
        return;
      }
      const floorPlanPane = document.getElementById('flrMap');
      if (!floorPlanPane) {
        return;
      }
      const rect = floorPlanPane.getBoundingClientRect();
      const isInsideFloorplan =
        event.originalEvent.clientX >= rect.left &&
        event.originalEvent.clientX <= rect.right &&
        event.originalEvent.clientY >= rect.top &&
        event.originalEvent.clientY <= rect.bottom;

      // Do nothing outside floorplan
      if (!isInsideFloorplan) {
        return;
      }
      const startPoint = this.mapNodes.activeMarker.getLatLng();
      this.previewLine.setLatLngs([startPoint, event.latlng]);
    };

    this.map.on('mousemove', this.mouseMoveHandler);
  }

  clearPreviewLine() {
    if (this.mouseMoveHandler) {
      this.map.off('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.previewLine) {
      this.map.removeLayer(this.previewLine);
      this.previewLine = null;
    }
  }
  
  fixClick() {
    console.log('')
  }
}
