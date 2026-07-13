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
import { Component, OnInit, Input, ViewEncapsulation, OnDestroy, Inject, Optional } from '@angular/core';
import * as L from 'leaflet';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import {connect,  MqttClient } from 'mqtt';
import { HospitalService} from '../../../services/hospital.service';
import {  ConfigurationService } from '../../../services/configuration.service';
import { CommonService } from '../../../services/common.service';
import { environment } from './../../../../../environments/environment';
import  './../../../../../assets/script/moving-marker.js'
import GraphMasterData from "../../../model/masterDataForTheGraph";
import GraphNodeModel from "../../../model/graphNode.model";
import GraphModel from "../../../model/graph.model";
import DijkstraModel from "../../../model/dijkstra.model";
import { StyleLoaderService } from '../../../services/style-loader.service ';

export interface Foo {
    bar: string;
}
@Component({
  selector: 'app-common-map',
  templateUrl: './common-map.component.html',
  styleUrls: ['./common-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CommonMapComponent implements OnInit, OnDestroy {
    nodepointss = null
    @Input() porterData:any;
    public requestInfo: boolean = false;
    public title: string;
    public floorId: string;
    public requestId: string;
    public requestDetails: any;
    public porterRequestDetails: Array<any> = [];
    public porterRequestTags = {};
    public porterRequestTagsList: Array<any> = [];
    public porterRequestTagsName = {};
    public blockNodes: any = '';
    public tagId: string;
    public map: any;
    public osmUrl = '/assets/images/firstFloor.png';
    public osmUrl1 = '/assets/Alert/common_icons/grid-floorplan.png';
    public readerIcon = '/assets/Alert/common_icons/reader_icon.png';
    public cool_temp = '/assets/Alert/common_icons/blue_gif.gif';
    public normal_temp = '/assets/Alert/common_icons/green_gif.gif';
    public abnormal_temp = '/assets/Alert/common_icons/red_gif.gif';
    public reader_array: Array<any> = [];

    public iconImage;
    public markerObj;
    public markerObj1;
    public graphNode;
    public locId;
    public nearNode: Array<any> = [];
    public tagList: Array<any> = [];
    messages: Array<Foo> = [];
    public nodePoints: Array<any> = [];
    status: Array<string> = [];
    tagMar = {};
    movePoint = {};
    lastCord = {};
    tagtime = {};
    tagDirection = {};
    oldDirection = {};
    tagTimeObj:Array<any> = [];
    public newNode: any;
    public porterRequestList: Array<any> = []; 
    public porterMonitorTag: string;
    public porterMonitorTagFloor = {};
    public moveArray: Array<any> = [];
    public moveDirection: Array<any> = [];
    public moveTest: any;
    public oldCoordinate: Array<any> = [];
    public oldNode: Array<any> = [];
    public cloudConnect:any;
    public floorPloygon: Array<any>= [];
    public floorPloygonImage: string;
    public fitpolygonArray: Array<any> = [];
    public listSample: Array<any> = [];
    private readonly _client: MqttClient;
    private a = {};
    
    public lastNode = {};
    public zoomLevel:any;
    public lastZoom:any;
    public readerList:any;
    porterToAssetPath: Array<any> = [[16.94, 0.82], [14.2, 0.82], [10.91, 0.82], [10.91, 1.98], [10.91, 4.49], [7.39, 4.49], [3.63, 4.49], [3.63, 6.62], [1.7, 6.62], [1.1, 8.9]];
    assetToPatientPath: Array<any> = [[1.1, 8.9], [1.7, 6.62], [3.63, 6.62], [3.63, 8.63], [4.83, 8.63], [7.5, 8.63], [7.5, 10.0], [6.59, 10.9]];
    patientToDestPath: Array<any> = [];

    dijkstraModelObject = new DijkstraModel();
    graph = null;
    nodesArr = null;
    sourceNode = null;
    targetNode = null;
    dist = 0;
    cacheGraphResult = null;
    pathArr = [];
    // Node points working tool 
    
    public AddMarker:Array<any> = [];
    public enableMarker = false
    public floorDetail = null;
    
    node_configuration = false;
    config_time = false
    link_node = null
    link_parentNode = null
    link_completed = false
    configure_node_data = null
    configure_node = null
    node_number = 0;
    
    public myStyle = {
        "color": "#74b9ff",
        "weight": 5,
        "opacity": 0.65
    };

    constructor(private readonly styleLoader: StyleLoaderService,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
        public hospitalService: HospitalService,
        public dialog: MatDialog,
        public configurationService: ConfigurationService,
        public commonService: CommonService) {
            this.cloudConnect = JSON.parse(commonService._clientMqtt);
            if( environment.env_key == 'prod') {
                this._client = connect(this.cloudConnect)
            } else {
                this._client = connect(this.cloudConnect)
            }
    }
    ngOnInit() {
        this.styleLoader.loadStyleByType('leaflet')
        console.log(this.data)
        this.requestInfo = false;
        this.requestId = '';
        this.floorId = '';
        if (this.data === null && this.porterData !== null) {
            this.floorId = this.porterData.floorid;
            this.requestId = this.porterData.requestId;
            this.requestDetails = this.porterData.requestInfo;
            this.requestInfo = true;
        }
        else {
        if(this.data.type == 'search'){
            this.floorId = this.data.floorId;
            this.tagId = this.data.tagid;
            this.title = 'Tag Search';
        } else if(this.data.type == 'asset'){
            this.floorId = this.data.floorId != null ? this.data.floorId : '';
            this.tagId = this.data.tagSerialNumber;
            this.title = 'Asset Tracking';
        } else if(this.data.type == 'env'){
            this.floorId = this.data.floorid;
            this.title = 'Reader Temperature';
            this.getAllReader()    
        } else if(this.data.type == 'porter') {
            this.floorId = this.data.floorid;
            this.requestId = this.data.requestId;
            this.requestDetails = this.data.requestInfo;
            this.title = 'Porter Management';
            this.requestInfo = true;
        }
    }
    
               
        if(this.map){
            this.map.remove();
            this.map = null;
        }
        this.map = L.map('mapid', {
            minZoom: -3,
            maxZoom: 0,
            center: [10, 0],
            zoom: -2,
            crs: L.CRS.Simple,
            attributionControl: false
          });
        this.commonService.getAllLocationById(this.floorId).subscribe(res => {
            this.floorDetail = res.results[0]
            if (this.floorId == '') {
                this.floorId = res.results[0].id;
            }
            this.osmUrl1 = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
            if(res.results[0].coordinates != null && res.results[0].aspects != null){
                const e = eval;
                let floorData = e('['+res.results[0].coordinates+']');
                console.log(floorData[0].geometry.coordinates[0]);
                let adata = e(res.results[0].aspects)
                let southWest =  this.map.unproject([0, adata[1]*100], this.map.getMaxZoom());
                let northEast = this.map.unproject([adata[0]*100, 0], this.map.getMaxZoom());
                let bounds = new L.LatLngBounds(southWest, northEast);
                L.imageOverlay(this.osmUrl1, bounds).addTo(this.map);
                this.map.setMaxBounds(bounds);
            } else  {
                this.osmUrl1 = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
                let southWest =  this.map.unproject([0, 1700], this.map.getMaxZoom());
                let northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
                let bounds = new L.LatLngBounds(southWest, northEast);
                L.imageOverlay(this.osmUrl1, bounds).addTo(this.map);
                this.map.setMaxBounds(bounds);
            }
            
            this.floorPloygonImage = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
            let FloorChildren = res.results[0].locations;
            for(let i in FloorChildren) {
                if(FloorChildren[i].coordinates) {
                    this.loadBuild(FloorChildren[i],'#fffeef')
                }
            }
            this.map.on('zoomstart', this.setZoomLevel.bind(this))
            if (this.data === null && this.porterData !== null) {
                this.porterRequest();
            }else {
            if(this.data.type == 'search' || this.data.type == 'asset'){
                this.mapLoad();
               
            } else if(this.data.type == 'env'){
                this.readerEnvironment();
            } else if(this.data.type == 'porter'){
                this.porterRequest();
            }
        }
          });
          this.createGraph();
    }
    getAllReader() {
        this.configurationService.getAllReaders().subscribe(res => {
            this.readerList = res.results;
        });
    }  
        createGraph() {
          const graphNodesArr = [];
          this.graph = new GraphModel(GraphMasterData);
          console.log("%c this.graph ", "background: lime; color: black", this.graph);
          console.log(
            "%c typeof  ",
            'background: lime; color: black',
            typeof this.graph.nodes
          );
          this.nodesArr = Object.keys(this.graph.nodes).map(
            nodeKeys => this.graph.nodes[nodeKeys]
          );
          console.log(
            '%c nodesArr ',
            'background: lime; color: black',
            this.nodesArr
          );
          this.shortestpath();
        }
        runDijkstra(pathType, source, target) {
            const results = this.dijkstraModelObject.run(
              this.graph,
              pathType,
              source.id,
              target.id
            );
            this.dist = results.dist[target.id];
            this.cacheGraphResult = results;

            return results;
        }
        getShortestPath() {
            this.pathArr = this.dijkstraModelObject.getPath(
              this.cacheGraphResult.prev,
              this.cacheGraphResult.target
            );
        }
        shortestpath() {
            this.sourceNode = new GraphNodeModel(1, 1, 1, [2, 101]);
            console.log('%c source Node ',
            'background: lime; color: black',
            this.sourceNode);
            this.targetNode = new GraphNodeModel(9, 1, 1, [36]);
            console.log('%c target Node ',
            'background: lime; color: black',
            this.targetNode);
            if (this.sourceNode && this.targetNode) {
                this.dijkstraModelObject = new DijkstraModel();
                const dijResults = this.runDijkstra(1, this.sourceNode, this.targetNode);
                const shortestPath = this.getShortestPath();
                console.log(
                  '%c dijkstra result ',
                  'background: aqua; color: black',
                  dijResults
                );
                console.log(this.pathArr);
              }

        }
    setZoomLevel() {
        this.zoomLevel = this.map.getZoom();
        this.lastZoom;
        let zoom = this.map.getZoom();
        if (zoom < -1 && (this.lastZoom || this.lastZoom >= -1)) {
          this.map.eachLayer(
            l => {
              if(l.getTooltip)
              {
                let toolTip = l.getTooltip();
                if (toolTip) {
                  this.map.closeTooltip(toolTip);
                }  
              }
            }
            
          );
        } else if (zoom >= -1 && (!this.lastZoom || this.lastZoom < -1)) {
          this.map.eachLayer(
            l => {
              if(l.getTooltip)
              {
                let toolTip = l.getTooltip();
                if (toolTip) {
                  this.map.addLayer(toolTip);
                }
              }
            }
            
          );
        }
        this.lastZoom = zoom;
    }
    loadBuild(data, color) {
        let area = JSON.parse(data.coordinates);
        if(area) {
            let poly = area.geometry.coordinates
            let test:any = [];
            for(let i in poly) {
            test.push([poly[i][1]*-100,poly[i][0]*100])
            }
            let polygonData = L.polygon(test, {color: color});
            polygonData.addTo(this.map)
            let name = data.name.split(" ").join("<br>")
            polygonData.bindTooltip(name, {permanent: true, direction: "center", className: "leaflet-tool-labels"}).openTooltip();
        }
    }
    porterRequest() {
            this.commonService.getLocationById(this.floorId).subscribe(res1 => {
                console.log(res1.results.parentId)
                this.commonService.getLocationById(res1.results.parentId).subscribe(res2 => {
                    console.log(res2.results.coordinates)
                    const e = eval;
                    let floorData = e('['+res2.results.coordinates+']');
                    this.blockNodes = floorData[0].properties
                    console.log(this.blockNodes);
                    this.commonService.getShortestPath(this.porterRequestDetails['locationFromId'], this.porterRequestDetails['locationToId'],this.porterRequestDetails['floorId']).subscribe(res => { 

                        console.log(res.results);
                        this.patientToDestPath = res.results;
                        this.multiFloorShorestPathLoad(this.porterRequestDetails['floorId']);
                       }, error => {
                        console.log(
                            '%c get shortest path from python ',
                            'background: aqua; color: black',
                            error
                          );
                       }); 
                }, error => {
                    console.log(
                        '%c get All Node by block id ',
                        'background: aqua; color: black',
                        error
                      );
                });

            }, error => {
                console.log(
                    '%c get block by floor id ',
                    'background: aqua; color: black',
                    error
                  );
            });
           
            this.subscribe()
        
    }
    multiFloorShorestPathLoad(id) {
       let floornode  = this.blockNodes[id]
       console.log(
        '%c chenge to floor shortest path ',
        'background: red; color: black',
        id
      );
       let pathnode = this.patientToDestPath['shortest_path'];
        let getpathpoints = this.patientToDestPath['node_xy'];
        let pathpoints = []
        for (let i = 0; pathnode.length > i; i++) {
            for (let j=0; floornode.length > j; j++) {

                if(floornode[j] == pathnode[i]) {
                    pathpoints.push(getpathpoints[i])
                }
            }

        }
        for (let k=0; pathpoints.length-1 > k; k++){
            if (k != 0){
                this.pathDirectionFind([pathpoints[k][1]*-100,pathpoints[k][0]*100], [pathpoints[k+1][1]*-100,pathpoints[k+1][0]*100]);
                }
                let myStyle = {
                    fillColor: '#1c9099',
                    color: '#4285F4',
                    weight: 6
                };
                let polygon = L.polygon([[pathpoints[k][1]*-100,pathpoints[k][0]*100],[pathpoints[k+1][1]*-100,pathpoints[k+1][0]*100]]);
                polygon.setStyle(myStyle).addTo(this.map);
            }
            let iconImage = new L.icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png',  iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [-3, -76]});

            L.marker([pathpoints[pathpoints.length-1][1]* - 100, pathpoints[pathpoints.length-1][0] * 100], {icon: iconImage}).addTo(this.map);
    

    }
    onSelectMonitorTag(data) {
        console.log(data.target.value);
        console.log(
            '%c change tag ',
            'background: aqua; color: black',
            data.target.value
          );
        this.porterMonitorTag = data.target.value;
        this.changeFloor(this.porterRequestDetails['floorId']);
        this.porterMonitorTagFloor = {};
        this.porterMonitorTagFloor[data.target.value] = this.porterRequestDetails['floorId'];
        this.multiFloorShorestPathLoad(this.porterRequestDetails['floorId'])
    }
    enableNode() {
        console.log(this.floorDetail.aspects)
        const e = eval;
        let aspect = e(this.floorDetail.aspects)
        console.log(typeof(aspect[0]))
        console.log(aspect[0])
        let iconImage = new L.icon({ iconUrl: '/assets/Alert/common_icons/pink-dot.png',  iconSize: [15, 15], iconAnchor: [10, 10], popupAnchor: [-3, -76]});
        for(let p=1; p<=aspect[0]*100;p=p+100){
            this.node_number+=1;
            for(let d=-1; d>=-(aspect[1]*100);d=d -100){
            let pointX = [d,p]
            let nodeX = new L.marker(pointX,{title: this.node_number,draggable:true,icon:iconImage }).on('click', this.nodeConfig.bind(this,this.AddMarker,pointX,event))
            nodeX.addTo(this.map);
            this.AddMarker.push(nodeX);
            }
        }
        this.enableMarker = true;
    }
    disableNode() {
        this.enableMarker = false;
    }
    nodeConfig(mark,coordinate,e) {
        console.log(e)
        console.log(coordinate)
        if(this.config_time) {
            let nodeLine = [{
                "type": "LineString",
                "coordinates": [[e.latlng.lng,e.latlng.lat],[this.configure_node_data.latlng.lng,this.configure_node_data.latlng.lat]]
            }];
            L.geoJSON(nodeLine, {
                style: this.myStyle
            }).addTo(this.map);
        }
        else{
            console.log(e)
            alert("Configuration for node: "+e.target._leaflet_id);
            this.configure_node_data = e;
            this.configure_node = e;
        }
    }
    addNodeConnection(direction){
        if(this.config_time== false){
            alert("No node selected!");
        }
        else{
            if(direction=="180"){
                this.link_node = direction;
                this.link_parentNode = "0";
            }
            else if(direction=="90"){
                this.link_node = direction;
                this.link_parentNode = "270";
            }
            else if(direction=="0"){
                this.link_node = direction;
                this.link_parentNode = "180";
            }
            else if(direction=="270"){
                this.link_node = direction;
                this.link_parentNode = "90";
            }
            this.config_time = true;
        }
    }
    readerEnvironment(){
        console.log(this.nodepointss)
        this.configurationService.getAllReaders().subscribe(res => {
            this.commonService.getAllReaderTempFloor(this.floorId).subscribe(res1 => {
                if(res.results.length != 0){
                let datas = JSON.parse(JSON.stringify(res1));
                let values = JSON.parse(datas.temperature);
                     for (let i=0;i<values[0][0].length;i++) {
                        let cool_temp_icon = null
                        if(values[0][0][i].temperature< 28){
                            cool_temp_icon = new L.Icon({ iconUrl: this.cool_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                        }
                        else if(values[0][0][i].temperature>=28 && values[0][0][i].temperature<=32){
                            cool_temp_icon = new L.Icon({ iconUrl: this.normal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                        }
                        else if(values[0][0][i].temperature>32){
                            cool_temp_icon = new L.Icon({ iconUrl: this.abnormal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                        }
                        else{
                            cool_temp_icon = new L.Icon({ iconUrl: this.abnormal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                        }
                           let readers = values[0][0][i].reader;
                           for (let j=0;j<res.results.length;j++) {
                               if(res.results[j].readerName == readers){

                                const e = eval;
                                let value = e(res.results[j].coordinate);
                                this.a[readers] = L.marker([value[1]* - 100, value[0] * 100], {icon: cool_temp_icon}).addTo(this.map).bindPopup('Reader_Temperature :'+ values[0][0][i].temperature);
                            
                               }
                        }
                    }
                }
                else {
                    console.log("Reader not found...");
                }
             });
            setInterval(()=>{
                 this.commonService.getAllReaderTempFloor(this.floorId).subscribe(res1 => {
                    if(res.results.length != 0){
                    let datas = JSON.parse(JSON.stringify(res1));
                    let values = JSON.parse(datas.temperature);
                   
                        for (let i=0;i<values[0][0].length;i++) {
                            let cool_temp_icon = null
                            if(values[0][0][i].temperature< 28){
                                cool_temp_icon = new L.Icon({ iconUrl: this.cool_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                            }
                            else if(values[0][0][i].temperature>=28 && values[0][0][i].temperature<=32){
                                cool_temp_icon = new L.Icon({ iconUrl: this.normal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                            }
                            else if(values[0][0][i].temperature>32){
                                cool_temp_icon = new L.Icon({ iconUrl: this.abnormal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                            }
                            else{
                                cool_temp_icon = new L.Icon({ iconUrl: this.abnormal_temp, iconSize: [20, 20], iconAnchor: [10, 10] });
                            }
                               let readers = values[0][0][i].readerName;
                               for (let j=0;j<res.results.length;j++) {
                                   if(res.results[j] == readers){
                                    this.a[readers].setIcon(cool_temp_icon);
                                    this.a[readers].bindPopup('Reader_Temperature :'+ values[0][0][i].temperature);
                                   }
                               
        
                            }
                           
                        }
                    }
                    else {
                        console.log("Reader not found...");
                    }
                 });
            },5000); 
        });
    }

    changeFloor(id) {
       
               
        if(this.map){
            this.map.remove();
            this.map = null;
        }
        this.map = L.map('mapid', {
            minZoom: -3,
            maxZoom: 0,
            center: [10, 0],
            zoom: -1,
            crs: L.CRS.Simple,
            attributionControl: false
          });
        this.commonService.getAllLocationById(id).subscribe(res => {
            this.osmUrl1 = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
            if(res.results[0].coordinates != null && res.results[0].aspects != null){
                const e = eval;
                let floorData = e('['+res.results[0].coordinates+']');
                console.log(floorData[0].geometry.coordinates[0]);
                let adata = e(res.results[0].aspects)
                let southWest =  this.map.unproject([0, adata[1]*100], this.map.getMaxZoom());
                let northEast = this.map.unproject([adata[0]*100, 0], this.map.getMaxZoom());
                let bounds = new L.LatLngBounds(southWest, northEast);
                L.imageOverlay(this.osmUrl1, bounds).addTo(this.map);
                this.map.setMaxBounds(bounds);
            } else  {
                this.osmUrl1 = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
                let southWest =  this.map.unproject([0, 1700], this.map.getMaxZoom());
                let northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
                let bounds = new L.LatLngBounds(southWest, northEast);
                L.imageOverlay(this.osmUrl1, bounds).addTo(this.map);
                this.map.setMaxBounds(bounds);
            }
            
            this.floorPloygonImage = environment.api_base_url_new+res.results[0].imageUrl+'?date='+(new Date());
            let FloorChildren = res.results[0].locations;
            for(let i in FloorChildren) {
                if(FloorChildren[i].coordinates) {
                    this.loadBuild(FloorChildren[i],'#e2d8d840')
                }
            }
            this.map.on('zoomstart', this.setZoomLevel.bind(this))
          });
    }
    subscribe(): void {
        let facilityId = localStorage.getItem(btoa('facilityId'));
        this._client.subscribe('tw/tag/location_nav/'+facilityId+'/#')
        this._client.on('message', (topic, message) => { 
        let msg = message.toString()
        const e = eval;
        let objEvent:Array<any> = e('['+msg+']')
        console.log(
            '%c tag id : '+objEvent[0].tid+' ',
            'background: aqua; color: black',
            msg
          );
        console.log(this.porterMonitorTag)
         if (this.porterMonitorTag == objEvent[0].tid) {
            console.log(this.porterMonitorTag)
            if (this.porterMonitorTagFloor[objEvent[0].tid]) {
                if (this.porterMonitorTagFloor[objEvent[0].tid] != objEvent[0].flr) {
                    this.changeFloor(objEvent[0].flr);
                    this.porterMonitorTagFloor = {};
                    this.porterMonitorTagFloor[objEvent[0].tid] = objEvent[0].flr;
                    console.log("not same floor id");
                } else {
                    console.log("same floor")
                }
                
            } else {
                this.porterMonitorTagFloor = {};
                this.porterMonitorTagFloor[objEvent[0].tid] = objEvent[0].flr;
                this.multiFloorShorestPathLoad(objEvent[0].flr)
            }
           
          }
        console.log(this.porterMonitorTagFloor[this.porterMonitorTag]);   
        if(objEvent[0].flr == this.porterMonitorTagFloor[this.porterMonitorTag] && this.porterRequestTags[objEvent[0].tid]) {
           
            if(objEvent.length && objEvent[0].htp == 'UWB') {            
                this.newNode = [objEvent[0].cxy.y, objEvent[0].cxy.x];
                let tagid = objEvent[0].tid;
                if(this.tagMar[tagid]) {
                    this.map.removeLayer(this.tagMar[tagid]);    
                } else {
                    this.moveArray = [];
                    this.moveArray.push(this.newNode);
                    this.movePoint[tagid] = this.moveArray;
                    console.log('new tag');
                }
                let tagdistance = null
                if(this.movePoint[tagid]) {
                    tagdistance = Math.sqrt( Math.pow((this.movePoint[tagid][0][1] - this.newNode[1]), 2) + Math.pow((this.movePoint[tagid][0][0] - this.newNode[0]), 2));
                }
                if(this.newNode[1] != this.movePoint[tagid][0][1] || this.newNode[0] != this.movePoint[tagid][0][0])
                {
                    let direction = this.findNewDirection(this.newNode[1], this.movePoint[tagid][0][1], this.newNode[0], this.movePoint[tagid][0][0], tagid);
                    if(!this.tagDirection[tagid]){
                    this.tagDirection[tagid] = [direction, direction];
                    this.oldDirection[tagid] = direction;
                    } 
                    if(this.tagDirection[tagid][1] == direction && this.tagDirection[tagid][0] == direction){
                    if(direction == 'x' || direction == '-x'){
                            this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                    } else {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                    } 
                    else if(this.tagDirection[tagid][1] != direction && this.tagDirection[tagid][0] != direction){
                        if(this.tagDirection[tagid][0] == this.tagDirection[tagid][1]){

                            if(this.tagDirection[tagid][0] == 'x' || this.tagDirection[tagid][0] == '-x'){
                                if(tagdistance >= 1.5){
                                this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]+0.25];
                                } else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                                }
                            } else {
                                if(tagdistance >= 2){
                                this.newNode = [this.movePoint[tagid][0][0]+0.25,this.movePoint[tagid][0][1]];
                                } else {
                                    this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                                }
                            }
                            this.tagDirection[tagid] = [direction, this.tagDirection[tagid][1]];
                        }  
                        else if(this.oldDirection[tagid] == direction && this.tagDirection[tagid][0] != this.tagDirection[tagid][1]){
                            if(direction == 'x' || direction == '-x'){
                                this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                        } else {
                            this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                        }
                        this.oldDirection[tagid] = direction;
                            this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                        } 
                        else {
                            if(this.tagDirection[tagid][1] == 'x' || this.tagDirection[tagid][1] == '-x'){
                                if(tagdistance >= 1.5){
                                    this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]];
                                } else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                                }
                            } else {
                            if(tagdistance >= 2){
                                    this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]];
                                }  else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];  
                                
                                }
                            }
                            this.tagDirection[tagid] = [direction, this.tagDirection[tagid][1]];
                        }
                    } 
                    else if(this.tagDirection[tagid][1] == direction) {
                        if(this.tagDirection[tagid][1] == 'x' || this.tagDirection[tagid][1] == '-x'){
                            this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                    } else {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                    } 
                    else if(this.tagDirection[tagid][0] == direction) {
                    if(direction == 'x') {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]+0.25];  
                    } else if(direction == '-x') {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]-0.25];  
                    }else if(direction == 'y') {
                        this.newNode = [this.movePoint[tagid][0][0]-0.25,this.newNode[1]];  
                    } else if(direction == '-y') {
                        this.newNode = [this.movePoint[tagid][0][0]+0.25,this.newNode[1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][0], direction];
                    }
                }
                this.movePoint[tagid].push(this.newNode);
                let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [5, 5], iconAnchor: [5, 5] });
                let animationMarker = L.Marker.movingMarker([[this.movePoint[tagid][0][0]*-100,this.movePoint[tagid][0][1]*100],[this.movePoint[tagid][1][0]*-100,this.movePoint[tagid][1][1]*100]], [500], {autostart: true});
                let greenIcon = L.icon({ iconUrl: '/assets/Floorplan/'+objEvent[0].ttp+'.svg', iconSize: [30, 30], iconAnchor: [30, 30]});
                animationMarker.options.icon = greenIcon;
                this.map.addLayer(animationMarker);
                animationMarker.on('click', function () {
                    animationMarker.bindPopup('<b>'+objEvent[0].tan+'</b>').openPopup();
                    setTimeout(function() {
                        animationMarker.closePopup();
                        animationMarker.unbindPopup();
                    }, 2000);
                });    
               
                this.tagMar[tagid] = animationMarker;
                this.movePoint[tagid].shift();
            }
            else if(objEvent[0].htp == 'BLE') {
                
              
                let tagid = objEvent[0].tid;
                let d = [];
                this.newNode = []
                if (objEvent[0].type == '1') {
                    this.newNode = [objEvent[0].cxy[1] * -100, objEvent[0].cxy[0] * 100];
                    if(this.tagMar[tagid]) {
                        this.map.removeLayer(this.tagMar[tagid]);   
                    } else {
                        this.moveArray = [];
                        this.moveArray.push(this.newNode);
                        this.movePoint[tagid] = this.moveArray;
                        this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                        console.log('new tag type1');
                    }
                    this.movePoint[tagid].push(this.newNode); 
                    let distance = Math.sqrt( Math.pow((this.lastNode[tagid][1] - objEvent[0].cxy[1]), 2) + Math.pow((this.lastNode[tagid][0] - objEvent[0].cxy[0]), 2));
                    d.push(this.float2int(distance)*500)
                    this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                    
                } else if (objEvent[0].type == '2') {
                    this.newNode = objEvent[0].cxy;
                    let last = this.newNode.length - 1;
                    let lastNodeType2 = this.newNode[last];
                    if(this.tagMar[tagid]) {
                        this.map.removeLayer(this.tagMar[tagid]);  
                        for (let i=0; this.newNode.length > i; i++) {
                            let distance = 0;
                            this.movePoint[tagid].push([this.newNode[i][1] * -100, this.newNode[i][0] * 100]);
                            if (this.newNode.length-1 != i) {
                                distance = Math.sqrt( Math.pow((this.newNode[i][1] -this.newNode[i+1][1]), 2) + Math.pow((this.newNode[i][0] - this.newNode[i+1][0]), 2));
                            } else {
                                distance = 500;
                            }
                           d.push(Math.round(distance)*500);
                        }
                    } else {
                        this.movePoint[tagid] = []
                        for (let i=0; this.newNode.length > i; i++) {
                            this.movePoint[tagid] = [[lastNodeType2[1]* -100, lastNodeType2[0]*100], [lastNodeType2[1]* -100, lastNodeType2[0]*100]];
                            let distance = 0;
                            d.push(Math.round(distance)*500);
                        }
                        console.log('new tat type2');
                    }
                    this.lastNode[tagid] = this.newNode[last];
                }
              
                let animationMarker = L.Marker.movingMarker(this.movePoint[tagid], d, {autostart: true});
                let greenIcon = L.icon({ iconUrl: '/assets/Floorplan/'+objEvent[0].ttp+'.svg', iconSize: [30, 30], iconAnchor: [30, 30]});
                animationMarker.options.icon = greenIcon;
                this.map.addLayer(animationMarker);
                animationMarker.on('click', function () {
                    animationMarker.bindPopup('<b>'+objEvent[0].tan+'</b>').openPopup();
                    setTimeout(function() {
                        animationMarker.closePopup();
                        animationMarker.unbindPopup();
                    }, 2000);
                });
                this.tagMar[tagid] = animationMarker;
                if(objEvent[0].type == '1') {
                    this.movePoint[tagid].shift();
                } else if(objEvent[0].type == '2'){
                    this.movePoint[tagid] = [[this.lastNode[tagid][1]* -100, this.lastNode[tagid][0]*100]];
                }
                
            }   
           
        }
    });
    }
    mapLoad(): void {
        let facilityId = localStorage.getItem(btoa('facilityId'));
        this._client.subscribe('tw/tag/location_nav/'+facilityId+'/'+this.floorId+'/#')
        this._client.on('message', (topic, message) => { 
        let msg = message.toString()
        const e = eval;
        let objEvent:Array<any> = e('['+msg+']')
        if(objEvent[0].flr == this.floorId && objEvent[0].tid == this.tagId) {         
            if(objEvent.length && objEvent[0].htp == 'UWB') {            
                this.newNode = [objEvent[0].cxy.y, objEvent[0].cxy.x];
                let tagid = objEvent[0].tid;
                if(this.tagMar[tagid]) {
                    this.map.removeLayer(this.tagMar[tagid]);    
                } else {
                    this.moveArray = [];
                    this.moveArray.push(this.newNode);
                    this.movePoint[tagid] = this.moveArray;
                    console.log('new tag');
                }
                let tagdistance = null;
                if(this.movePoint[tagid]) {
                    tagdistance = Math.sqrt( Math.pow((this.movePoint[tagid][0][1] - this.newNode[1]), 2) + Math.pow((this.movePoint[tagid][0][0] - this.newNode[0]), 2));
                }
                if(this.newNode[1] != this.movePoint[tagid][0][1] || this.newNode[0] != this.movePoint[tagid][0][0])
                {
                    let direction = this.findNewDirection(this.newNode[1], this.movePoint[tagid][0][1], this.newNode[0], this.movePoint[tagid][0][0], tagid);
                    if(!this.tagDirection[tagid]){
                    this.tagDirection[tagid] = [direction, direction];
                    this.oldDirection[tagid] = direction;
                    } 
                    if(this.tagDirection[tagid][1] == direction && this.tagDirection[tagid][0] == direction){
                    if(direction == 'x' || direction == '-x'){
                            this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                    } else {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                    } 
                    else if(this.tagDirection[tagid][1] != direction && this.tagDirection[tagid][0] != direction){
                        if(this.tagDirection[tagid][0] == this.tagDirection[tagid][1]){

                            if(this.tagDirection[tagid][0] == 'x' || this.tagDirection[tagid][0] == '-x'){
                                if(tagdistance >= 1.5){
                                this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]+0.25];
                                } else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                                }
                            } else {
                                if(tagdistance >= 2){
                                this.newNode = [this.movePoint[tagid][0][0]+0.25,this.movePoint[tagid][0][1]];
                                } else {
                                    this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                                }
                            }
                            this.tagDirection[tagid] = [direction, this.tagDirection[tagid][1]];
                        }  
                        else if(this.oldDirection[tagid] == direction && this.tagDirection[tagid][0] != this.tagDirection[tagid][1]){
                            if(direction == 'x' || direction == '-x'){
                                this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                        } else {
                            this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                        }
                        this.oldDirection[tagid] = direction;
                            this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                        } 
                        else {
                            if(this.tagDirection[tagid][1] == 'x' || this.tagDirection[tagid][1] == '-x'){
                                if(tagdistance >= 1.5){
                                    this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]];
                                } else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                                }
                            } else {
                            if(tagdistance >= 2){
                                    this.newNode = [this.movePoint[tagid][0][0],this.movePoint[tagid][0][1]];
                                }  else {
                                    this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];  
                                
                                }
                            }
                            this.tagDirection[tagid] = [direction, this.tagDirection[tagid][1]];
                        }
                    } 
                    else if(this.tagDirection[tagid][1] == direction) {
                        if(this.tagDirection[tagid][1] == 'x' || this.tagDirection[tagid][1] == '-x'){
                            this.newNode = [this.movePoint[tagid][0][0],this.newNode[1]];
                    } else {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][1], direction];
                    } 
                    else if(this.tagDirection[tagid][0] == direction) {
                    if(direction == 'x') {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]+0.25];  
                    } else if(direction == '-x') {
                        this.newNode = [this.newNode[0],this.movePoint[tagid][0][1]-0.25];  
                    }else if(direction == 'y') {
                        this.newNode = [this.movePoint[tagid][0][0]-0.25,this.newNode[1]];  
                    } else if(direction == '-y') {
                        this.newNode = [this.movePoint[tagid][0][0]+0.25,this.newNode[1]];  
                    }
                    this.oldDirection[tagid] = direction;
                    this.tagDirection[tagid] = [this.tagDirection[tagid][0], direction];
                    }
                }
                this.movePoint[tagid].push(this.newNode);
                let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [5, 5], iconAnchor: [5, 5] });
                let animationMarker = L.Marker.movingMarker([[this.movePoint[tagid][0][0]*-100,this.movePoint[tagid][0][1]*100],[this.movePoint[tagid][1][0]*-100,this.movePoint[tagid][1][1]*100]], [500], {autostart: true});
                let greenIcon = L.icon({ iconUrl: '/assets/Floorplan/'+objEvent[0].ttp+'.svg', iconSize: [30, 30], iconAnchor: [30, 30]});
                animationMarker.options.icon = greenIcon;
                this.map.addLayer(animationMarker);
                animationMarker.on('click', function () {
                    animationMarker.bindPopup('<b>'+objEvent[0].tan+'</b>').openPopup();
                    setTimeout(function() {
                        animationMarker.closePopup();
                        animationMarker.unbindPopup();
                    }, 2000);
                });    
                this.tagMar[tagid] = animationMarker;
                this.movePoint[tagid].shift();
            }
            else if(objEvent[0].htp == 'BLE') {
                let tagid = objEvent[0].tid;
                let d = [];
                this.newNode = []
                if (objEvent[0].type == '1') {
                    this.newNode = [objEvent[0].cxy[1] * -100, objEvent[0].cxy[0] * 100];
                    if(this.tagMar[tagid]) {
                        this.map.removeLayer(this.tagMar[tagid]);   
                    } else {
                        this.moveArray = [];
                        this.moveArray.push(this.newNode);
                        this.movePoint[tagid] = this.moveArray;
                        this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                        console.log('new tag type1');
                    }
                    this.movePoint[tagid].push(this.newNode); 
                    let distance = Math.sqrt( Math.pow((this.lastNode[tagid][1] - objEvent[0].cxy[1]), 2) + Math.pow((this.lastNode[tagid][0] - objEvent[0].cxy[0]), 2));
                    d.push(this.float2int(distance)*500)
                    this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                    
                } else if (objEvent[0].type == '2') {
                    this.newNode = objEvent[0].cxy;
                    let last = this.newNode.length - 1;
                    let lastNodeType2 = this.newNode[last];
                    if(this.tagMar[tagid]) {
                        this.map.removeLayer(this.tagMar[tagid]);  
                        for (let i=0; this.newNode.length > i; i++) {
                            let distance = 0;
                            this.movePoint[tagid].push([this.newNode[i][1] * -100, this.newNode[i][0] * 100]);
                            if (this.newNode.length-1 != i) {
                                distance = Math.sqrt( Math.pow((this.newNode[i][1] -this.newNode[i+1][1]), 2) + Math.pow((this.newNode[i][0] - this.newNode[i+1][0]), 2));
                            } else {
                                distance = 500;
                            }
                            d.push(Math.round(distance)*500);
                        }
                    } else {
                        this.movePoint[tagid] = []
                        for (let i=0; this.newNode.length > i; i++) {
                            this.movePoint[tagid] = [[this.lastNode[tagid][1]* -100, this.lastNode[tagid][0]*100], [lastNodeType2[1]* -100, lastNodeType2[0]*100]];
                            let distance = 0;
                            d.push(Math.round(distance)*500);
                        }
                        console.log('new tat type2');
                    }
                    this.lastNode[tagid] = this.newNode[last];
                } else {
                    this.newNode = [objEvent[0].cxy[1] * -100, objEvent[0].cxy[0] * 100];
                    if(this.tagMar[tagid]) {
                        this.map.removeLayer(this.tagMar[tagid]);   
                    } else {
                        this.moveArray = [];
                        this.moveArray.push(this.newNode);
                        this.movePoint[tagid] = this.moveArray;
                        this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                        console.log('new tag type1');
                    }
                    this.movePoint[tagid].push(this.newNode); 
                    let distance = Math.sqrt( Math.pow((this.lastNode[tagid][1] - objEvent[0].cxy[1]), 2) + Math.pow((this.lastNode[tagid][0] - objEvent[0].cxy[0]), 2));
                    d.push(this.float2int(distance)*500)
                    this.lastNode[tagid] = [objEvent[0].cxy[0], objEvent[0].cxy[1]];
                }
                let animationMarker = L.Marker.movingMarker(this.movePoint[tagid], d, {autostart: true});
                let greenIcon = L.icon({ iconUrl: '/assets/Floorplan/'+objEvent[0].ttp+'.svg', iconSize: [30, 30], iconAnchor: [30, 30]});
                animationMarker.options.icon = greenIcon;
                this.map.addLayer(animationMarker);
                animationMarker.on('click', function () {
                    animationMarker.bindPopup('<b>'+objEvent[0].tan+'</b>').openPopup();
                    setTimeout(function() {
                        animationMarker.closePopup();
                        animationMarker.unbindPopup();
                    }, 2000);
                });
                this.tagMar[tagid] = animationMarker;
                if(objEvent[0].type == '1') {
                    this.movePoint[tagid].shift();
                } else if(objEvent[0].type == '2'){
                    this.movePoint[tagid] = [[this.lastNode[tagid][1]* -100, this.lastNode[tagid][0]*100]];
                }
            }   
         }
    });
    }
    float2int(value) {
        return value | 0;
    }
    pathDirectionFind(node1, node2) {
        let arrowIcon = L.icon({
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAAAdpJREFUOBGFVDtOA0EMnewGCS7ACeAYUIISEtpAxRGgRaLlFijiFkCAlgqJDokT0CAqJD7ZxLznsScT2GR35IzXnzdvbG9CWPZIKOhuS3u3lLKroWZbllbvyxIB9gB5TIGZL9kaFQltxoDdDsB8dTTPfI0YKUBCy3VA3SQ4Ke/cHrKYZFuoSFihD0AdBZtmv1L2NM9iFmIkR3YyYEYKJeUYO4XrPovVpqX3WmXGbs8ACDIx8Vrua24jy6x7APDa/UDnpSnUufJaLmFp3UNCzq5KcFJWBkjQvrHUafh/23p23wbgDAnktgaWM3bdjAVr52C+T9QSr+4d/8NyvrO3Buj1ciDfCeW+nGWa3YAh9bnrNbBzUDL35SwVowBYge9ibEU9sb1Se3wRbBMT6iTAzlaqhxBziKH2Gbt+OjN2kx3lMJOVL+q00Zd3PLHM2R3biV/KAV8edha7JUGeKNTNRh/ZfkL4xFy/KU7z2uW1oc4GHSJ1DbIK/QAyguTsfBLi/yXhEXAN8fWOD22Iv61t+uoe+LYQfQF5S1lSXmksDAMaCyleIGdgsjkHwhqz2FG0k8kvYQM5p5BnAx608HKOgNdpmF6iQh8aHOeS9atgi511lDofSlKE4ggh679ecGIXq+UAsgAAAABJRU5ErkJggg==',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
            popupAnchor: [-3, -76]
        });
        let firstPoint = node1.slice(),
        secondPoint = node2.slice(),
        slope = ((secondPoint[1] - firstPoint[1]) / (secondPoint[0] - firstPoint[0])),
        angle = Math.atan(slope),
        rotation;
        secondPoint[0] = secondPoint[0] - firstPoint[0];
        secondPoint[1] = secondPoint[1] - firstPoint[1];
        console.log(secondPoint)
        //Fourth quadrant
        if (secondPoint[0] > 0 && secondPoint[1] <= 0) {
            rotation = (angle * 180/Math.PI)/2;
        }
        //Second quadrant
        else if (secondPoint[0] <= 0 && secondPoint[1] > 0) {
            rotation = (angle * 180/Math.PI);
        }
        //Third quadrant
        else if (secondPoint[0] <= 0 && secondPoint[1] < 0) {
            rotation =  (angle * 180/Math.PI);
        }
        //First quadrant
        else if (secondPoint[0] > 0 && secondPoint[1] > 0) {
            rotation = (angle * 180/Math.PI);
        }
        L.marker(node1, {icon: arrowIcon,iconAngle: rotation}).addTo(this.map);
            
    }
    liveTrackingProcess(objEvent){
       // Determines the objEvent console.log(objEvent[0]);
      }
      findNewDirection(x1,x2,y1,y2,tagid){
        let data = Math.atan2(y2-y1, x2-x1);
        let value;
        let moveFlag
        if(data > -0.79 && data < 0.79){
            value = '-x';
        }
        else if(data > 0.79 && data < 2.36) {
            value = 'y';
        }
        else if(data > 2.36 || data < -2.36) {
            value = 'x';
        }
        else if(data > -2.36 && data < -0.79) {
            value = '-y';
        }
        return value; 
      }
      findDirection(x1,x2,y1,y2,tagid){
          console.log(x1,x2,y1,y2,tagid);
        let data = Math.atan2(y2-y1, x2-x1);
        let value;
        let moveFlag
        if(parseFloat(data.toFixed(2)) == 0.79) {
            value = 'NW';
        }
        else if(data > -0.79 && data < 0.79){
            value = 'N';
        }
        else if(parseFloat(data.toFixed(2)) == 2.36) {
            value = 'SW';
        }
        else if(data > 0.79 && data < 2.36) {
            value = 'W';
        }
        else if(parseFloat(data.toFixed(2)) == -2.36) {
            value = 'SE';
        }
        else if(data > 2.36 || data < -2.36) {
            value = 'S';
        }
        else if(parseFloat(data.toFixed(2)) == -0.79) {
            value = 'NE';
        }
        else if(data > -2.36 && data < -0.79) {
            value = 'E';
        }
        
        if(!this.tagDirection[tagid]){
                this.moveDirection.push(value);  
                this.tagDirection[tagid] = this.moveDirection;
            }
            if(this.tagDirection[tagid].length ==1){
                if(this.tagDirection[tagid][0] != value){
                this.tagDirection[tagid].push(value); 
                moveFlag = 'false';
                } else { moveFlag = 'true'; }
            }
            else if(this.tagDirection[tagid].length ==2){
                if(this.tagDirection[tagid][0] == value ){
                    this.tagDirection[tagid].splice(1, 1);
                    moveFlag = 'true';
                } else if(this.tagDirection[tagid][1] == value ){
                    this.tagDirection[tagid].splice(0, 1); 
                    moveFlag = 'true'; 
                } else { 
                    this.tagDirection[tagid].splice(1, 1);
                    this.tagDirection[tagid].push(value);  
                    moveFlag = 'false'; 
                }
            
            }
           console.log('Direction : '+this.tagDirection[tagid]);
        return moveFlag;
      }
    
    ngOnDestroy(): void {
        this._client.end(true);
    }
}

/** Used rotation code from https://github.com/shramov/leaflet-plugins/blob/master/layer/Marker.Rotate.js
As its not availabel on CDN
*/

/*
 * Based on comments by @runanet and @coomsie 
 * https://github.com/CloudMade/Leaflet/issues/386
 *
 * Wrapping function is needed to preserve L.Marker.update function
 */ (function () {
    let _old__setPos = L.Marker.prototype._setPos;
    L.Marker.include({
        _updateImg: function (i, a, s) {
            a = L.point(s).divideBy(2)._subtract(L.point(a));
            let transform = '';
            transform += ' translate(' + -a.x + 'px, ' + -a.y + 'px)';
            transform += ' rotate(' + this.options.iconAngle + 'deg)';
            transform += ' translate(' + a.x + 'px, ' + a.y + 'px)';
            i.style[L.DomUtil.TRANSFORM] += transform;
        },

        setIconAngle: function (iconAngle) {
            this.options.iconAngle = iconAngle;
            if (this._map) this.update();
        },

        _setPos: function (pos) {
            if (this._icon) this._icon.style[L.DomUtil.TRANSFORM] = '';
            if (this._shadow) this._shadow.style[L.DomUtil.TRANSFORM] = '';

            _old__setPos.apply(this, [pos]);

            if (this.options.iconAngle) {
                let defaultIcon = new L.Icon.Default;
                let a = this.options.icon.options.iconAnchor || defaultIcon.options.iconAnchor;
                let s = this.options.icon.options.iconSize || defaultIcon.options.iconSize;
                let i;
                if (this._icon) {
                    i = this._icon;
                    this._updateImg(i, a, s);
                }
                if (this._shadow) {
                    if (this.options.icon.options.shadowAnchor) a = this.options.icon.options.shadowAnchor;
                    s = this.options.icon.options.shadowSize;
                    i = this._shadow;
                    this._updateImg(i, a, s);
                }
            }
        }
    });
}());
//Rotation code ends here
