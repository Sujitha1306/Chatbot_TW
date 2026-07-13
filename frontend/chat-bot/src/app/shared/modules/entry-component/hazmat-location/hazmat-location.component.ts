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

import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, HospitalService } from '../../../services';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { of as observableOf} from 'rxjs';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GeoSearchControl,  OpenStreetMapProvider} from 'leaflet-geosearch';
import { environment } from '../../../../../environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { HazmatTrainingComponent } from '../hazmat-training/hazmat-training.component';
import { CreateTask } from './hazmat-location.model';
import { DatePipe } from '@angular/common';
import { MqttClient, connect } from 'mqtt';
import { CoasterComponent } from '../enroll-patient/enroll-patient.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { MatStepper } from '@angular/material/stepper';
import { SelectionModel } from '@angular/cdk/collections';
import { StyleLoaderService } from '../../../services/style-loader.service ';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-hazmat-location',
  templateUrl: './hazmat-location.component.html',
  styleUrls: ['./hazmat-location.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HazmatLocationComponent implements OnInit, OnDestroy, AfterViewInit {
  private client: MqttClient;
  isLinear = true;
  trainingForm: FormGroup;
  selectedTabIndex = 0;
  height: number;
  activityTypeList: any=[];
  requireLocationMatchVal: any = [];
  locationListItems: any = [];
  locationIdEnabled = false;
  public locationDetails: any = [];
  locationId = null;
  public locationList: any = [];
  public locations: any = {
    'all' : [],
    'parent' : [],
    'logical' : []    
  }; 
  public treeControl: NestedTreeControl<any>;
  public dataSource: MatTreeNestedDataSource<any>;
  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public TrainingdataSource = new MatTableDataSource<any>();
  public TRdataSource = new MatTableDataSource<any>();
  public selectedRow = null;
  public isLoading = false;
  public showChild = false;
  public enableSave = false;
  public isDeleted = false;
  public parentDetail = null;
  public locationTypes = [];
  public locallTypes = []
  public localTypes = {};
  public isAddlocation = null;
  public addMore = null;
  public level = 0;
  public windWidth = window.innerWidth;
  public id = 17939;
  public parentId = 17938;
  displayedColumns: string[] = ["#", "firstName", "tagId"];
  trainingColumns: string[] = ["#", "firstName", "tagId", "status", "loading"];
  public createTask: CreateTask;

  //map
  public mapRef = 'floorMap';
  public floorMap = null;
  public mapControl = {
    minZoom : 0,
    maxZoom : 220,
    defaultZoom : 100,
    disLocLevel : 100,
    orient : 0,
    coordinates : null,
    imageData   : null,
    direction : null,
    tooltip_polygon : {},
    zoomCtrl : null,
    distance : {
      enable : false,
      scale : null,
      polylinePoints : [],
      distPolyline : {}
    }
  }
  enableNext = false;
  searchUserListItems: any=[];
  searchUserlist: any=[];
  hazmatLocation = null;
  configValue: any;
  activityIdEnabled = false;
  activityDetails: any=[];
  activityListItems: any=[];
  activityId = null;
  nonPerformerInfo: any=[];
  performerInfo: any=[];
  userId = null;
  activityData: any;
  activityDataConfig: any;
  public defaultTaskDate = this.dateFormat.transform(new Date(), 'yyyy-MM-ddTHH:mm');
  mrssi = null;
  applyFilterValue = null;
  deviceId = null;
  beaconList: any=[];
  acivityUpdatedData = null;
  checkedUser: any=[];
  trainingListExist = false;
  checkedUserId: any=[];
  @ViewChild('stepper') stepper: MatStepper;
  scheduledUser: any=[];
  selection = new SelectionModel<any>(true, []);
  editConfigValue = false;
  locationName = null;
  activityName = null;

  constructor(
    private readonly styleLoader: StyleLoaderService,
    public form: FormBuilder,
    public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    private readonly hospitalService: HospitalService,
    public thisDialogRef: MatDialogRef<any>, 
    public toastr: AppToastService,
    private readonly dateFormat: DatePipe) {
  }
  ngOnInit(): void {
    this.styleLoader.loadStyleByType('leaflet')
    this.getMqtt();
    this.buildForm();
    this.selectedRow = this.data
    this.getBasicDetails()
    this.getAllLocation();
    this.commonService.getAppTerms('RoutineType,RecipientType,Gender,Status,HazardType,ActivitySubType').subscribe(res => {
      this.activityTypeList = res.results.filter(resFilter => resFilter.groupName === 'HazardType');
    });
    this.commonService.getScheduleUser(this.dateFormat.transform(new Date(), 'yyyy-MM-dd')).subscribe(res => {
      if (res.statusCode === 1) {
        this.scheduledUser = res.results;
        res.results.forEach(data => {
          this.checkedUser.push(data);
          this.checkedUserId.push((data?.id).toString());
        });
        this.TrainingdataSource = new MatTableDataSource<any>(this.scheduledUser);
        this.TrainingdataSource.paginator = this.paginator2;
        this.TrainingdataSource.sort = this.sort;
      }
    });
  }
          
  ngAfterViewInit() {
    if(this.data) {
      this.stepper.linear = false;
      this.selectedRow = '';
      setTimeout(() => {
          this.stepper.linear = true;
      });
    }
  }

  onWindowResized(size) {
    this.height = size - 65;
  }
  tabChanged(event) {
    this.selectedTabIndex = event.index;
  }
  selectTab(index: number): void {
    this.selectedTabIndex = index;
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
        } else {
            res.message = 'mqtt ' + res.message;
            this.toastr.warning('Warning', `${res.message}`);
        }
    })
  }
  buildForm() {
    this.trainingForm = this.form.group({
      locationId:[null, this.requireLocationMatch.bind(this)],
      activityType: [null],
      activityId: [null],
      user: [null]
    });
  }
  private requireLocationMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '' && this.locationIdEnabled) {
      this.requireLocationMatchVal = this.locationDetails.filter(resFilter => resFilter.id === control.value);
      if (this.requireLocationMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }
  getLocationSearch(event) {
    this.locationId = null;
    if(event.type === 'locationSearch' && event.text.length >= 2) {
      if (event.toHit === true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.locationListItems = res.results;
          this.locationDetails = this.locationListItems;
          this.locationIdEnabled = true;
        });
      } else {
        this.locationDetails = this.locationListItems;
        this.locationIdEnabled = true;
      }
    } else {
      this.locationDetails = [];
      this.locationIdEnabled = false;
    }
  }
  getLocationIdList(id) {
    if (id !== null) {
      const location = this as any as { id: string, name: string}[]
      const locationId = location.find(obj => obj.id === id).name;
      return locationId;
    } else {
      return '';
    }
  }
  getActivitySearch(event) {
    this.activityId = null;
    if(event.type === 'activitySearch' && event.text.length >= 2) {
        if (event.toHit === true) {
          this.commonService.getActivitySearch(event.text, 'activity', 'ROU-TSK').subscribe(res => {
            this.activityListItems = res.results.filter(x => x.activityCategoryId === "AC-HAZ");
            this.activityDetails = this.activityListItems;
            this.activityIdEnabled = true;
          });
        } else {
          this.activityDetails = this.activityListItems;
          this.activityIdEnabled = true;
        }
      } else {
        this.activityDetails = [];
        this.activityIdEnabled = false;
      }
  }
  getActivityIdList(id) {
    if (id !== null) {
      const activity = this as any as { id: string, name: string, fullName: string }[]
      const activityId = activity.find(obj => obj.id === id).name;
      return activityId;
    } else {
      return '';
    }
  }
  getBasicDetails() {
    this.hospitalService.getAllLocationType().subscribe(res => {
      this.locallTypes = res.results;
      this.localTypes = this.locallTypes.reduce((acc, item) => { 
        acc[item.id] = item; 
        return acc; 
      }, {} as Record<any, any>);
    });
    
    this.commonService.getLocations().subscribe(res => {
      this.locations['all'] = res.results;
    });
    
  }
  getAllLocation() {
    this.treeControl = new NestedTreeControl<any>(this.makeGetChildrenFunction());
    this.dataSource = new MatTreeNestedDataSource();
    this.dataSource.data = []
    this.isLoading = true;
    this.commonService.getLogicalLoction().subscribe(res => {
      for (let i = 0; i < res.results.length; i++) {
        res.results[i].locationTypeLevel = this.localTypes[res.results[i]['locationTypeId']]['level']
        if (res.results[i].locationTypeLevel === 0) {
          for (let j = 0; j < res.results[i].children.length; j++) {
            res.results[i].children[j].locationTypeLevel = this.localTypes[res.results[i].children[j]['locationTypeId']]['level']
            if (res.results[i].children[j].locationTypeLevel === 1) {
              for (let k = 0; k < res.results[i].children[j].children.length; k++) {
                this.selectedRow = res.results[i].children[j].children[0];
                res.results[i].children[j].children[k].locationTypeLevel = this.localTypes[res.results[i].children[j].children[k]['locationTypeId']]['level']
                if(res.results[i].children[j].children[k]?.children?.length !== 0) {
                  if(this.data.hasOwnProperty('destinationLocationId')) {
                    if((res.results[i].children[j].children[k].children[0].id === this.data?.destinationLocationId)) {
                      this['selectedRowData'] = res.results[i].children[j].children[k].children[0];
                    }
                  }
                  this.locationList.push(res.results[i].children[j].children[k]);
                  this.dataSource.data.push(res.results[i].children[j].children[k]);
                }
              }
            } 
          }
        }
      }
      this.isLoading = false;
      if(this.data.hasOwnProperty('destinationLocationId')) {
        this.getLocationType(this['selectedRowData'], this.isAddlocation);
      } else {
        this.getLocationType(this.selectedRow, this.isAddlocation);
      }
    }, error => { this.isLoading = false; });
  }
  getLocationType(data, isAdd) {
    this.hazmatLocation = null;
    if(data?.locationTypeId === 17) {
      this.hazmatLocation = data;
      this.enableSave = true;
    } else {
      this.enableSave = false;
    }
    this.selectedTabIndex = isAdd ? 0 : this.selectedTabIndex;
    if(this.isDeleted || this.addMore || this.selectedRow != data || (isAdd == null || isAdd != this.isAddlocation)) {
      this.isAddlocation = isAdd == null ? false : isAdd;
      this.selectedRow = data;
      this.isDeleted = false;
      let locationId = this.isAddlocation ? data.id : (data ? data.parentId : null);

      this.hospitalService.getAllLogicalLocationType(locationId).subscribe(res => {
        this.locationTypes = res.results;
        if(this.selectedRow && !this.isAddlocation) {
          this.level = this.selectedRow.locationTypeLevel
        } else if(this.locationTypes.length) {
            this.level = this.locationTypes[0].level
        }
        this.getLocationDetail(data);
      });
    } else {
      this.getTreeview(data)
    }
  }
  getLocationDetail(locData) {
    this.showChild = false;
    if(locData) {
      this.getTreeview(locData)
      let parentId = null;
      parentId = this.isAddlocation ? locData.id : this.level == 0 ? locData.id: locData.parentId
      let typeDetail = this.locallTypes.filter(val => val.id ==  locData.locationTypeId)[0]
      if(this.isAddlocation && typeDetail.isLogicalParent) {
        parentId = locData.parentId
      }
      this.isLoading = true;
      this.hospitalService.getLogicalLocationWithChildren(parentId).subscribe(res => {
        this.parentDetail = res.results;
        if(this.level === 4) {
          parentId = this.isAddlocation ? locData.parentId : this.parentDetail.parentId
          this.hospitalService.getLogicalLocationWithChildren(parentId).subscribe(res => {
            this.parentDetail = res.results;
            this.isLoading = false;
            this.getMap();
          }, error => { this.isLoading = false; });
        } else {
          this.isLoading = false;
          this.getMap();
        }
      }, error => { this.isLoading = false; });
    }
  }
  hasChildren = (_: number, node: any) => {
    return node.children && node.children.length > 0
  }
  private makeGetChildrenFunction() {
    return node => observableOf(node.children)
  }
  getTreeview(locData) {
    for (let i = 0; i < this.dataSource.data.length; i++) {
      if (this.dataSource.data[i].id === locData.id) {
        this.dataSource.data.forEach((node) => {
          if (node.id == locData.id) {
            this.selectedRow = node;
            this.treeControl.expand(node);
          }
        });
      } else {
        for (let j = 0; j < this.dataSource.data[i].children.length; j++) {
          if (this.dataSource.data[i].children[j].id === locData.id) {
            this.selectedRow = this.dataSource.data[i].children[j];
            this.parentId = this.dataSource.data[i].id;
            this.dataSource.data.forEach((node) => {
              if (node.id == this.parentId) {
                this.treeControl.expand(node);
                this.treeControl.expand(node.children[j]);
              }
            });
          } else {
            for (let k = 0; k < this.dataSource.data[i].children[j].children.length; k++) {
              if (this.dataSource.data[i].children[j].children[k].id === locData.id) {
                this.selectedRow = this.dataSource.data[i].children[j].children[k];
                this.parentId = this.dataSource.data[i].id;
                this.dataSource.data.forEach((node) => {
                  if (node.id == this.parentId) {
                    this.treeControl.expand(node);
                    this.treeControl.expand(node.children[j]);
                    this.treeControl.expand(node.children[j].children[k]);
                  }
                });
              } else {
                for (let l = 0; l < this.dataSource.data[i].children[j].children[k].children.length; l++) {
                  if (this.dataSource.data[i].children[j].children[k].children[l].id === locData.id) {
                    this.selectedRow = this.dataSource.data[i].children[j].children[k].children[l];
                    this.parentId = this.dataSource.data[i].id;
                    this.dataSource.data.forEach((node) => {
                      if (node.id == this.parentId) {
                        this.treeControl.expand(node);
                        this.treeControl.expand(node.children[j]);
                        this.treeControl.expand(node.children[j].children[k]);
                        this.treeControl.expand(node.children[j].children[k].children[l]);
                      }
                    });
                  } else {
                    if (this.dataSource.data[i].children[j].children[k].children[l].children.length !== 0) {
                      for (let m = 0; m < this.dataSource.data[i].children[j].children[k].children[l].children.length; m++) {
                        if (this.dataSource.data[i].children[j].children[k].children[l].children[m].id === locData.id) {
                          this.selectedRow = this.dataSource.data[i].children[j].children[k].children[l].children[m];
                          this.parentId = this.dataSource.data[i].id;
                          this.dataSource.data.forEach((node) => {
                            if (node.id == this.parentId) {
                              this.treeControl.expand(node);
                              this.treeControl.expand(node.children[j]);
                              this.treeControl.expand(node.children[j].children[k]);
                              this.treeControl.expand(node.children[j].children[k].children[l]);
                              this.treeControl.expand(node.children[j].children[k].children[l].children[m]);
                            }
                          });
                        } else {
                          for (let n = 0; n < this.dataSource.data[i].children[j].children[k].children[l].children[m].children.length; n++) {
                            if (this.dataSource.data[i].children[j].children[k].children[l].children[m].children[n].id === locData.id) {
                              this.selectedRow = this.dataSource.data[i].children[j].children[k].children[l].children[m].children[n];
                              this.parentId = this.dataSource.data[i].id;
                              this.dataSource.data.forEach((node) => {
                                if (node.id == this.parentId) {
                                  this.treeControl.expand(node);
                                  this.treeControl.expand(node.children[j]);
                                  this.treeControl.expand(node.children[j].children[k]);
                                  this.treeControl.expand(node.children[j].children[k].children[l]);
                                  this.treeControl.expand(node.children[j].children[k].children[l].children[m]);
                                  this.treeControl.expand(node.children[j].children[k].children[l].children[m].children[n]);
                                }
                              });
                            } else {
                              for (let p = 0; p < this.dataSource.data[i].children[j].children[k].children[l].children[m].children[n].children.length; p++) {
                                if (this.dataSource.data[i].children[j].children[k].children[l].children[m].children[n].children[p].id === locData.id) {
                                  this.selectedRow = this.dataSource.data[i].children[j].children[k].children[l].children[m].children[n].children[p]
                                  this.parentId = this.dataSource.data[i].id;
                                  this.dataSource.data.forEach((node) => {
                                    if (node.id == this.parentId) {
                                      this.treeControl.expand(node);
                                      this.treeControl.expand(node.children[j]);
                                      this.treeControl.expand(node.children[j].children[k]);
                                      this.treeControl.expand(node.children[j].children[k].children[l]);
                                      this.treeControl.expand(node.children[j].children[k].children[l].children[m]);
                                      this.treeControl.expand(node.children[j].children[k].children[l].children[m].children[n]);
                                    }
                                  });
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  getMap() {
    if(this.floorMap) {
      this.floorMap.remove();
      this.floorMap = null
    }
    let mapData = this.parentDetail
    if(this.selectedRow == null || this.level == 0 || (this.level == 1 && !this.showChild) || (this.parentDetail.locationTypeId == 23 || this.selectedRow.locationTypeId == 23)) {
      let mapUrl:any = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      mapUrl =  'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
      this.floorMap = L.map(this.mapRef, {
        center: new L.LatLng(45.78771148665357, 15.967683792394526),
        minZoom: this.mapControl.minZoom/10 <= 22 ? this.mapControl.minZoom/10 : 22,
        maxZoom: this.mapControl.maxZoom/10 <= 22 ? this.mapControl.maxZoom/10  : 22,
        zoom: this.mapControl.defaultZoom/10 <= 22 ? this.mapControl.defaultZoom/10  : 22,
        zoomControl: true, attributionControl: false
      });
      L.tileLayer(mapUrl,{
          maxZoom : 22,
          subdomains:['mt0','mt1','mt2','mt3']
      }).addTo(this.floorMap);
      const provider = new OpenStreetMapProvider();
      const searchControl = new GeoSearchControl({
        provider: provider,
        position: 'topleft'
      });
      this.floorMap.addControl(searchControl);
      this.floorMap.on('geosearch/showlocation', function(e) {
      });
      this.floorMap.on('geosearch/marker/dragend', function(e) {
      });
    
    } else {
      let locationId = this.isAddlocation ? this.selectedRow.id : (this.selectedRow ? this.selectedRow.parentId : null);
    if(this.showChild) {
        mapData = this.selectedRow
        this.floorMap = L.map(this.mapRef, {
          center: [0, 0],
          minZoom: this.mapControl.minZoom ? this.mapControl.minZoom/20 - 10 : -4,
          maxZoom: this.mapControl.maxZoom ? this.mapControl.maxZoom/20 - 10 : 0,
          zoom: this.mapControl.defaultZoom ? this.mapControl.defaultZoom/20 - 10 : -2,
          zoomControl: true,
          crs: L.CRS.Simple, attributionControl: false
        });
      } else {
        this.floorMap = L.map(this.mapRef, {
          center: [0, 0],
          minZoom: mapData.minZoom ? mapData.minZoom/20 - 10 : -4,
          maxZoom: mapData.maxZoom ? mapData.maxZoom/20 - 10 : 0,
          zoom: mapData.defaultZoom ? mapData.defaultZoom/20 - 10 : -2,
          zoomControl: true,
          crs: L.CRS.Simple, attributionControl: false
        });
      }
      
      let width = 1500;let height = 1700;
      if(mapData.aspects) {
        let coodata = JSON.parse(mapData.aspects);
        width = coodata[0]*100
        height = coodata[1]*100
      }
      let imageUrl = environment.api_base_url_new + 'api/location/get-location-image/'+mapData.id+'?date='+(new Date());
      let sw =  this.floorMap.unproject([0, height], this.floorMap.getMaxZoom());
      let ne = this.floorMap.unproject([width, 0], this.floorMap.getMaxZoom());
      let bounds = new L.LatLngBounds(sw, ne);
      L.imageOverlay(imageUrl, bounds).addTo(this.floorMap);
      this.floorMap.setMaxBounds(bounds);      
      this.zoomLabel()
    }
    this.floorMap.on('zoomend', this.displayLocation.bind(this,mapData));
    this.floorMap.on('click', this.polyLineDist.bind(this))
    this.getchildDetail(mapData)
  }
  getchildDetail(data) {
    if(data) {
      this.mapControl.tooltip_polygon = {};
      if((this.level != 1 || (this.level == 1 && !this.showChild)) && this.level != 2 && this.level != 3 && this.level != 4) {
        if(data.coordinates) {
          this.bindPolygon(data)
        }
      }
      if((this.parentDetail.locationTypeId == 23 || this.selectedRow.locationTypeId == 23) && data.coordinates) {
        this.bindPolygon(data)
      }
      let childData = data.children;
      for(let i in childData) {
        if(childData[i].coordinates) {
          this.bindPolygon(childData[i])
        }
        if(childData[i].locationTypeLevel > 2 && childData[i].children.length) {
          let innerChildData = childData[i].children
          for(let j in innerChildData) {
            if(innerChildData[j].coordinates) {
              this.bindPolygon(innerChildData[j])
            }
            if(innerChildData[j].locationTypeLevel > 2 && innerChildData[j].children.length) {
              let level2child = innerChildData[j].children;
              for(let k in level2child) {
                if(level2child[k].coordinates) {
                  this.bindPolygon(level2child[k])
                }
              } 
            }
          }        
        }
      }
    }
  }
  bindPolygon(data) {
    let area = JSON.parse(data.coordinates);
    if(area) {
      let poly = area.geometry.coordinates
      let polyValue = []
      if(area.geometry.type == "Point") {
        polyValue = [poly[1], poly[0]];
      } else {
      for(let i in poly) {
        if(area.hasOwnProperty('unit') && area.unit == 'latlng') {
          polyValue.push([poly[i][1],poly[i][0]])  
        } else {
        polyValue.push([poly[i][1]*-100,poly[i][0]*100])
        }
      }
      }
      let polyBound = null;
      if(area.geometry.type == "Point") { 
        polyBound = L.marker(polyValue);     
      } else {
      polyBound = L.polygon(polyValue, {color: data.polygonStyle ? data.polygonStyle :  '#ffa500cc'});
      }
      if(data.id === this.selectedRow.id) {
        if(this.mapControl.coordinates) {
          area = JSON.parse(this.mapControl.coordinates);
          let poly = area.geometry.coordinates
          let polyValue = [];
          if(area.geometry.type == "Point") {
            polyValue = [poly[1], poly[0]];
          } else {
          for(let i in poly) {
            if(area.hasOwnProperty('unit') && area.unit == 'latlng') {
              polyValue.push([poly[i][1],poly[i][0]])
            } else {
            polyValue.push([poly[i][1]*-100,poly[i][0]*100])
            }
          }
          }
          if(area.geometry.type == "Point") { 
            polyBound = L.marker(polyValue);     
          } else {
          polyBound = L.polygon(polyValue, {color: data.polygonStyle ? data.polygonStyle :  '#ffa500cc', dashArray: "10 10", weight: 5});
          }
          } else {
          if(area.geometry.type == "Point") { 
            polyBound = L.marker(polyValue);     
          } else {
            polyBound = L.polygon(polyValue, {color: data.polygonStyle ? data.polygonStyle :  '#ffa500cc', dashArray: "10 10", weight: 5});
          }
        }
      }
      polyBound.addTo(this.floorMap)
      let labelName = data.name;
      let labelStyle = data.labelStyle ? data.labelStyle : "color: #A9A9A9 !important;font-size: 12px;"
      polyBound.bindTooltip("<div style="+ labelStyle + ">"+labelName+"</div>", {permanent: true, direction: "center", className: "polytooltip"}).openTooltip()
      this.mapControl.tooltip_polygon[data.id] = polyBound;
      if(data.id ==this.selectedRow.id) {
        if(this.level == 0 || this.level == 1 || (this.parentDetail.locationTypeId == 23 || this.selectedRow.locationTypeId == 23)) {
          if(area.geometry.type == "Point") { 
            let bounds = [[poly[1], poly[0]], [poly[1], poly[0]]]
            this.floorMap.fitBounds(bounds);
          } else {
            this.floorMap.fitBounds(polyBound.getBounds());
          }
        }
        if(this.data.hasOwnProperty('destinationLocationId')) {
          this.stepper.selectedIndex = 1;
          this['configValueDetail'] = JSON.parse(this.data?.configValue);
          this.activityDataConfig = this['configValueDetail'];
          this.activityData = this.data;
          this.activityData['id'] = this.data?.activityId;
          this.activityData['comments'] = undefined;
          this.activityData['remarks'] = undefined;
          this.activityData['autoComplete'] = null;
          this.activityData['canAutoAllocate'] = null;
          this.getTrainee();
          this.commonService.getActivityPerformer(this.data?.activityId,this.data?.ActDate).subscribe(res => {
            if (res.statusCode === 1) {
              res.results.forEach( x => {
                x['firstName'] = x.name;
                x['status'] = x.statusName;
              });
              this.checkedUser = [];
              this.checkedUserId = []
              this.scheduledUser = res.results;
              res.results.forEach(data => {
                this.checkedUser.push(data);
                this.checkedUserId.push((data?.id).toString());
              });
              this.TrainingdataSource = new MatTableDataSource<any>(this.scheduledUser);
              this.TrainingdataSource.paginator = this.paginator2;
              this.TrainingdataSource.sort = this.sort;    
            }
            this.stepper.selectedIndex = 2;
          });
        }
      }
    }
  }
  zoomLabel() {
    let zoomVal = (this.floorMap.getZoom()) * 10;
    if(this.level > 1 || (this.level == 1 && this.showChild)) {
      zoomVal = this.parentDetail.locationTypeId == 23 || this.selectedRow.locationTypeId == 23 ? zoomVal : (this.floorMap.getZoom() + 10) * 20
    }
    
    if(this.mapControl.zoomCtrl) {
      this.floorMap.removeControl(this.mapControl.zoomCtrl)
      this.mapControl.zoomCtrl = null;
    }
    
    let showZoom = L.DomUtil.create("button");
    this.mapControl.zoomCtrl = new L.Control();
    this.mapControl.zoomCtrl.options = { position: "topleft" };
    this.mapControl.zoomCtrl.onAdd = () => {
      showZoom.innerText = +zoomVal + ' %';
      return showZoom;
    };
    this.floorMap.addControl(this.mapControl.zoomCtrl);
  }
  mapDraw() {
    let drawnItems = new L.FeatureGroup();
    this.floorMap.addLayer(drawnItems);
    let options = {
      position: 'topright',
      shapeOptions: { showArea: true, clickable: true },
      draw : {
        circle : false,
        polyline : false,
        marker : false,
        circlemarker : false,
        rectangle: { showArea: false },
      },
      metric: true,
      edit: { edit: false, remove: false, featureGroup: drawnItems }
    }
    let drawControl = new L.Control.Draw(options);
    this.floorMap.addControl(drawControl);

    this.floorMap.on('draw:created', this.getCoordinate.bind(this,drawnItems));
  }
  public getCoordinate(drawnItems, e) {
    let layer = e.layer
    let value = e.layer.toGeoJSON();
    let poly = value.geometry.coordinates
    let coordinates = [];
    for(let i in poly) {
      let value1 = poly[i]
      for(let j in value1) {
        coordinates.push([value1[j][0]/100,value1[j][1]/-100])
      }
    }
    value.geometry.coordinates = coordinates
    this.mapControl.coordinates = JSON.stringify(value);
    drawnItems.addLayer(layer);

  }
  getDistanceControl() {
    if(this.mapControl.distance.scale) {
      this.floorMap.removeControl(this.mapControl.distance.scale)
      this.mapControl.distance.scale = null;
    }
    if(this.level >= 2) {
      let distanceControl = L.DomUtil.create("button");
      this.mapControl.distance.scale = new L.Control();
      this.mapControl.distance.scale.options = { position: "topright" };
      this.mapControl.distance.scale.onAdd = () => {
        distanceControl.innerText = 'distance';
        return distanceControl;
      };
      distanceControl.onclick = () => {
        this.mapControl.distance.enable = !this.mapControl.distance.enable
        if(!this.mapControl.distance.enable){
            for(let i in this.mapControl.distance.distPolyline){
                this.floorMap.removeLayer(this.mapControl.distance.distPolyline[i])
                delete this.mapControl.distance.distPolyline[i]
            }
            this.mapControl.distance.polylinePoints = []
        }
      };
      this.floorMap.addControl(this.mapControl.distance.scale);
    }
  }
  displayLocation(mapData, e) {
    this.zoomLabel()
    let disLocation = []
    if(mapData) {
      for(let i in mapData.children){
        if(mapData.children[i].disLocLevel != null){
          let locLevel = this.level > 1 || (this.level == 1 && this.showChild) ? 
            mapData.children[i].disLocLevel/20 -10 : mapData.children[i].disLocLevel/10 <= 18 ? mapData.children[i].disLocLevel/10 : 18
          if(this.floorMap.getZoom() >= locLevel){
              disLocation.push(mapData.children[i].id)
          }
          let childLocation = mapData.children[i]
          for(let j in childLocation.children){
            let locLvl = this.level > 1 || (this.level == 1 && this.showChild) ? 
            childLocation.children[j].disLocLevel/20 -10 : childLocation.children[j].disLocLevel/10 <= 18 ? childLocation.children[j].disLocLevel/10 : 18
            if(this.floorMap.getZoom() >= locLvl){
                disLocation.push(childLocation.children[j].id)
            }
            let child2location = childLocation.children[j]
            for(let k in child2location.children){
              let locLvl = this.level > 1 || (this.level == 1 && this.showChild) ? 
              child2location.children[k].disLocLevel/20 -10 : child2location.children[k].disLocLevel/10 <= 18 ? child2location.children[k].disLocLevel/10 : 18
              if(this.floorMap.getZoom() >= locLvl){
                  disLocation.push(child2location.children[k].id)
              }
            }    
          }
        }
      }
      if(mapData.disLocLevel != null){
        let locLevel = this.level > 1 || (this.level == 1 && this.showChild) ? 
          mapData.disLocLevel/20 -10 : mapData.disLocLevel/10 <= 18 ? mapData.disLocLevel/10 : 18;
        if(this.floorMap.getZoom() >= locLevel){
            disLocation.push(mapData.id)
        }
      }
      for(let i in this.mapControl.tooltip_polygon){
          this.floorMap.removeLayer(this.mapControl.tooltip_polygon[i])
      }
      for(let i in disLocation){
          if(this.mapControl.tooltip_polygon[disLocation[i]] != undefined){
              this.floorMap.addLayer(this.mapControl.tooltip_polygon[disLocation[i]])
          }
      }
    }
  }
  polyLineDist(pos){
    if(this.mapControl.distance.enable){
      let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [10, 10], iconAnchor: [6, 6] });
      this.mapControl.distance.polylinePoints.push(pos.latlng);
      this.mapControl.distance.distPolyline[this.mapControl.distance.polylinePoints.length] = L.marker(pos.latlng, { icon: iconImage});
      this.mapControl.distance.distPolyline[this.mapControl.distance.polylinePoints.length].addTo(this.floorMap)
      if(this.mapControl.distance.polylinePoints.length == 2){
          this.mapControl.distance.distPolyline['polyLine'] = L.polyline([this.mapControl.distance.polylinePoints[0],this.mapControl.distance.polylinePoints[1]], {color: 'gray'}).addTo(this.floorMap);
          
          let point = JSON.parse('[[' + (this.mapControl.distance.polylinePoints[0].lng / 100).toFixed(3) + ',' + (this.mapControl.distance.polylinePoints[0].lat / -100).toFixed(3) + '],[' +(this.mapControl.distance.polylinePoints[1].lng / 100).toFixed(3) + ',' +(this.mapControl.distance.polylinePoints[1].lat / -100).toFixed(3) + ']]')
          if(this.level > 1 || (this.level == 1 && this.showChild)) {
          } else {
            this.getDistance()
          }

          const distance = Math.sqrt(Math.pow((point[0][1] - point[1][1]), 2) + Math.pow((point[0][0] - point[1][0]), 2));
          let content = "<div class='" + 'ovi-font-family' + "'> Distance : " + distance.toFixed(2) + " m</div>"
          this.mapControl.distance.distPolyline['polyLine'].bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
      } else if(this.mapControl.distance.polylinePoints.length > 2){
          for(let i in this.mapControl.distance.distPolyline){
              this.floorMap.removeLayer(this.mapControl.distance.distPolyline[i])
              delete this.mapControl.distance.distPolyline[i]
          }
          this.mapControl.distance.polylinePoints = []
        }
      }
  }
  getDistance() {
    let lat1 = this.mapControl.distance.polylinePoints[0]['lat']
    let lon1 = this.mapControl.distance.polylinePoints[1]['lat']
    let lat2 = this.mapControl.distance.polylinePoints[0]['lng']
    let lon2 = this.mapControl.distance.polylinePoints[1]['lng']
    let unit = 'K'
    let radlat1 = Math.PI * lat1/180
    let radlat2 = Math.PI * lat2/180
    let theta = lon1-lon2
    let radtheta = Math.PI * theta/180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
  }
  getAssociatedUser(event) {
    if(event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAssociatedUser(null, event.text).subscribe(res => {
          this.searchUserListItems = res.results;
          this.searchUserlist = this.searchUserListItems;
        });
      } else {
        this.searchUserlist = this.searchUserListItems;
      }
    } else {
      this.searchUserlist = [];
    }
  }
  getTrainee() {
    this.commonService.getAssociatedUser('RO-AD', null).subscribe(res => {
      if(res.results) {
        let ids = [];
        let user = [];
        if(this.scheduledUser !== null) {
          ids = this.scheduledUser?.map( x => x.id);
          user = res.results.filter(x => ids.indexOf(x.id) === -1);
        } else {
          user = res.results;
        }
        this.locationName = this.data ? this.data?.destinationLocationName : this.locationName;
        this.activityName = this.data ? this.data?.activityName : this.activityName;    
        this.TRdataSource = new MatTableDataSource<any>(user);
        if(this.applyFilterValue !== null){
          this.TRdataSource.filter = this.applyFilterValue;
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        this.TRdataSource.paginator = this.paginator1;
        this.TRdataSource.sort = this.sort;
      }
    });
  }
  createStatus(event) {
    this.editConfigValue = event.editConfigValue;
    if(event?.enableCreate) {
      this.enableNext = true;
    } else {
      this.enableNext = false;
    }
    if(event?.openActivities) {
      const data = event?.activityData;
      data['mapType'] = 'mapAssessment';
      const dialogRef = this.dialog.open(HazmatTrainingComponent,
        { data: data, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        if(result?.mrssi) {
          this.mrssi = result?.mrssi;
          this.acivityUpdatedData = result?.acivityUpdatedData; 
        }
      });
    }
    if(event?.beaconList.length !== 0){
      this.beaconList = [];
      let level = event?.activityData?.configValue?.level.split(',');
      for(let i = 0; i < event?.beaconList.length; i++) {
        const index = 6 >= (i+1) ? i+1 : (i+1) == 7 ? 5 : (i+1) == 8 ? 4 : (i+1) == 9 ? 3 : (i+1) == 10 ? 2 : (i+1) == 11 ? 1 : '';
        if(level?.length !== 0) {
          for(let j = 0; j < level?.length; j++) {
            if(parseInt(level[j]) === index) {
              const alarm = 'L' + (j+1);
              if(event?.activityData?.configValue?.max_value != 2) { // To avoid AP4C CH hazard type level 
                this[event?.beaconList[i].identifyingValue + 'level'] = alarm;            }
              }              
          }
        }
        if(this[event?.beaconList[i].identifyingValue + 'level']) {
          this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index, this[event?.beaconList[i].identifyingValue + 'level']]);
        } else {
          this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index]);
        }
      }
    }
    if(event?.beaconList.length !== 0){
      this.beaconList = [];
      let level = event?.activityData?.configValue?.level?.split(',') ? event?.activityData?.configValue.level.split(',') : [];
      let index = null;
      let val = null;
      let oxyVal = null;
      for(let i = 0; i < event?.beaconList.length; i++) {
        if(event?.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-AP') {
          if(event?.activityData?.configValue?.max_value == 2) {  // FOR AP4C CH 
            index = i%2 == 0 ? 1 : 2;
          }
          if(event?.activityData?.configValue?.max_value != 2) {
            index = 6 >= (i+1) && 5 >= (event?.beaconList.length / 2) ? i+1 : (i+1) > 6 && event?.beaconList.length > 6 && 5 >= (event?.beaconList.length / 2) ? 6-((i+1)-6) :
            (event?.beaconList.length / 2) > 5 && Math.round(event?.beaconList.length / 2) >= (i+1) ? 
            i+1 : (event?.beaconList.length / 2) > 5 && (i+1) > Math.round(event?.beaconList.length / 2) ? (Math.round(event?.beaconList.length / 2) - ((i+1) - Math.round(event?.beaconList.length / 2))) === 0 ? 1 :
            Math.round(event?.beaconList.length / 2) - ((i+1) - Math.round(event?.beaconList.length / 2)) : ''
          }
        } else if(event?.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
          index = i === 0 ? parseInt(event?.activityData?.configValue?.min_value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          ((Math.trunc((parseInt(event?.activityData?.configValue?.max_value)-parseInt(event?.activityData?.configValue?.min_value))/(event?.beaconList.length-2)) * i)+parseInt(event?.activityData?.configValue?.min_value)) : (event?.beaconList.length === (i+1) ? 
          parseInt(event?.activityData?.configValue?.max_value) : ''));
          oxyVal = i === 0 ? parseInt(event?.activityData?.configValue?.maxOxygen_value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          Math.trunc(parseInt(event?.activityData?.configValue?.maxOxygen_value)-(((parseInt(event?.activityData?.configValue?.maxOxygen_value)-parseInt(event?.activityData?.configValue?.minOxygen_value))/(event?.beaconList.length-2)) * i)) : (event?.beaconList.length === (i+1) ? 
          parseInt(event?.activityData?.configValue?.minOxygen_value) : ''));
        } else if(event?.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-IM') {
          index = event?.beaconList.length === (i+1) ? (parseInt(event?.activityData?.configValue?.max_value)) : this.getLogicIntensValue(i, event);
        } else if(event?.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-UR') {
          index = i === 0 ? parseInt(event?.activityData?.configValue?.min_value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          (Math.trunc((event?.activityData?.configValue?.max_value-(event?.activityData?.configValue?.min_value))/(event?.beaconList.length-1)) * i)+parseInt(event?.activityData?.configValue?.min_value) : (event?.beaconList.length === (i+1) ? 
          parseInt(event?.activityData?.configValue?.max_value) : ''));
        }
        if(level?.length !== 0) {
          for(let j = 0; j < level?.length; j++) {
            if(parseInt(level[j]) === index) {
              const alarm = 'L' + (j+1);
              if(event?.activityData?.configValue?.max_value != 2) {
                this[event?.beaconList[i].identifyingValue + 'level'] = alarm;
              }
            }
          }
        }
        if(this[event?.beaconList[i].identifyingValue + 'level']) {
          if(event?.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
            index = event?.beaconList[i].hasOwnProperty('hazardValue') ? event?.beaconList[i]['hazardValue'] : index;
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 10, this[event?.beaconList[i].identifyingValue + 'level'], oxyVal * 10]);
          } else {
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index, this[event?.beaconList[i].identifyingValue + 'level']]);
          }
        } else {
          if(event?.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
            index = event?.beaconList[i].hasOwnProperty('hazardValue') ? event?.beaconList[i]['hazardValue'] : index;
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 10, oxyVal * 10]);
          } else if(event?.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-IM') {
            if(index === 0) {
              this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 100, 'L1']);
            } else {
              this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 100]);
            }
          } else {
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index]);
          }
        }
      }
    }
    let mapData = {
      "b_id": this.beaconList,
      "b_pos" : event?.position,
      "hazard_id": event?.hazard,
      "hazard_type": event?.activityData?.configValue?.hazard_type,
      "locationId": event?.locationId,
      "locationName": event?.locationName,
      "floorId": event?.floorId,
      "kitId": [event?.kitId],
      "hazardCount": event?.hazardCount,
      "positionType": event?.positionType == true ? 'auto' : 'manual',
      "max_value": event?.activityData?.configValue?.max_value,
      "min_value": event?.activityData?.configValue?.min_value,
      "value_type": event?.activityData?.configValue?.value_type,
      "rssi": event?.activityData?.configValue?.rssi,
      "mrssi": event?.activityData?.configValue?.mrssi,
      "level": event?.activityData?.configValue?.level,
      "units": event?.activityData?.configValue?.units,
      "kmlDetails" : event?.activityData?.configValue?.kmlDetails,
      "aloho":event?.activityData?.configValue?.aloho,
      "r": event?.r,
      "a": event?.a,
      "y": event?.y,
      "e": event?.e
    }
    if(this.editConfigValue) {
      const con = JSON.parse(JSON.stringify(mapData));
      con['b_id'] = event.activityData?.configValue?.b_id;
      this.activityDataConfig = con;
    } else {
      this.activityDataConfig = JSON.parse(JSON.stringify(mapData));
    }
    this.activityData = event?.activityData;
    this.locationId = event?.locationId;
    this.activityId = event?.activityId;
    this.trainingForm.controls['activityId'].setValue(event?.activityName);
    this.trainingForm.controls['locationId'].setValue(event?.locationName);
    this.locationName = event?.locationName;
    this.activityName = event?.activityName;
  }
  getLogicIntensValue(i, event) {
    const length = (event?.beaconList?.length-2) / 2;
    if(event?.beaconList?.length >= 9) {
        const value = i <= Math.trunc(length) ? Math.trunc((1999 - (parseInt(event?.activityData?.configValue?.min_value))) / 4) * i : 
        i > Math.trunc(length) && i < event?.beaconList?.length-1 ? (Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3) > 1000000 ?
        (i === 8 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3)) : '';
        return value;
    } else if(event?.beaconList?.length <= 6) {
        const value = i <= 2 ? Math.trunc((1999 - (parseInt(event?.activityData?.configValue?.min_value))) / 2) * i : 
        i > 2 && i < event?.beaconList?.length-1 ? (Math.trunc((999999 - 2000) / 2) * (i-2) > 1000000 ?
        (i === 5 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / 2) * (i-2)) : '';
        return value;
    }
  }
  checkUser(data) {
    if(this.checkedUser.length === 0) {
      this.checkedUser.push(data);
      this.checkedUserId.push((data?.id).toString());
    } else {
      const user = this.checkedUser.filter(x => x.id === data?.id);
      if(user.length !== 0) {
        const id = (data?.id).toString();
        this.checkedUser = this.checkedUser.filter(x => x.id !== data?.id);
        this.checkedUserId = this.checkedUserId.filter(x => id.indexOf(x) === -1);
      } else {
        this.checkedUser.push(data);
        this.checkedUserId.push((data?.id).toString());
      }
    }
  }
  addTask() {
    let users = [];
    if(this.scheduledUser !== null) {
      users = this.scheduledUser;
      for(let i in this.checkedUser) {
        let index = users.findIndex(val => val.id == this.checkedUser[i]['id']);
        if(index != -1) {
          users.splice(index, 1)  
        }
        users.push(this.checkedUser[i])
      }
    } else {
      users = this.checkedUser;
    }
    this.TrainingdataSource = new MatTableDataSource<any>(users);
    this.TrainingdataSource.paginator = this.paginator2;
    this.TrainingdataSource.sort = this.sort;
  }
  back() {
    this.trainingListExist = false;
  }
  getUser(data) {
    if(data) {
      this.userId = data.id;
      this.deviceId = data.tagId; 
    } else {
      this.userId = null;
      this.deviceId = null; 
    }
  }
  checkToAddUser(data) {
    if(this.checkedUser.length === 0) {
      this.checkedUser.push(data);
      this.checkedUserId.push((data?.id).toString());
    } else {
      const user = this.checkedUser.filter(x => x.id === data?.id);
      if(user.length !== 0) {
        const id = (data?.id).toString();
        this.checkedUser = this.checkedUser.filter(x => x.id !== data?.id);
        this.checkedUserId = this.checkedUserId.filter(x => id.indexOf(x) === -1);
      } else {
        this.checkedUser.push(data);
        this.checkedUserId.push((data?.id).toString());
      }
    }
  }
  checkToRemoveUser(data) {
    if(this.checkedUser.length !== 0) {
      this.checkedUser = this.checkedUser.filter(x => x.id !== data.id);
    }
  }
  removeUser() {
    const id = this.checkedUser.map(x => x.id);
    this.checkedUserId = this.checkedUserId.filter(x => id.toString().indexOf(x) > -1);
    this.TrainingdataSource = new MatTableDataSource<any>(this.checkedUser);
    this.TrainingdataSource.paginator = this.paginator2;
    this.TrainingdataSource.sort = this.sort;
    this.groupUser();
    this.scheduledUser = this.checkedUser;
    this.getTrainee();
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if (this.TRdataSource && this.TRdataSource.data.length) {
      const numRows = this.TRdataSource.data.filter(row => row.tagId).length;
      return numSelected === numRows;
    }
  }
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.TRdataSource.data.forEach(row => row.tagId ? this.selection.select(row) : null);   
  }
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.TRdataSource.filter = filterValue;

  }
  manageCoster(data) {
    data['workflowTypeId']    = 'WF-STF';
    data['associationId']     = data.id;
    data['associationTypeId'] = 'TAT-US';
    data['associatedName']    = 'User';
    data['tag_type_name']     = data.tagAssociationType;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data, 
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.getTrainee();
      }
    });
  }
  saveTask(data) {
    this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createTask.pfActivityId = this.activityData?.id;
    this.createTask.gender = this.activityData?.gender;
    this.createTask.comments = this.activityData?.comments;
    this.createTask.remarks = this.activityData?.remarks;
    this.createTask.startTime = this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    this.createTask.type = 'RQT-OT';
     this.createTask.requestCategory = 'PR-OT';
    this.createTask.destinationId = this.locationId;
    this.nonPerformerInfo = [];
    this.performerInfo = [];
    this.performerInfo = [
       {
        id: data.id,
        type: 'RT-US'
       },
     ];
      this.createTask.status = 'RQ-CR';
    this.createTask.isautoAssigned = this.activityData?.canAutoAllocate;
    this.createTask.isAutoComplete = this.activityData?.autoComplete;
    this.createTask.performer = this.performerInfo;
    this.createTask.nonPerformer = this.nonPerformerInfo;
    if(this.data?.configValue) {
      this.createTask.configValue = this['configValueDetail'];
    } else {
      this.createTask.configValue = this.activityDataConfig;
    }
    this.commonService.saveTask(this.createTask).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.getTrainee();
        if(res.results?.requestId) {
          this[data?.id + 'req'] = res.results?.requestId;
          this['status' + data.Id] = 'Task Uploading';
          this.subscribeData(res.results.requestId);
        }
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  subscribeData(requestId) {
    if(this.client) {
      let topicName = 'tw/tack/gw/' + localStorage.getItem(btoa('facilityId')) +'/' + requestId +'/#';
      console.log(topicName)
      this.client.subscribe(topicName);
      this.client.on('message', (topic, message, packet) => {
          let msg = message.toString();
          let tagData = JSON.parse('[' + msg + ']')
          tagData = tagData[0]
          console.log(tagData);
          if(tagData.request_id === requestId) {
            if(tagData?.status === 'RQ-CR') {
              this['status' + tagData?.device_id] = 'Task Ready';
            }
          }
      })
    }
  }
  ngOnDestroy(): void {
    if(this.client) {
        this.client.end(true);
        console.log('client disconnected..')    
    }
  }
  deleteTask(data) {
    const deleteData = {"comments": data.description,
                        "type": 'RQT-OT',
                        "status": 'RQ-CA',
                        "userType": 'RT-US'}
    const dialogRef = this.dialog.open(ConfirmationDialog, {
     panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: 'Cancel Task', message: 'Do you want to cancel the task ?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'deleteTask': true, 'requestId': this[data?.id + 'req'], 'deleteData': deleteData
        }
      });
    dialogRef.afterClosed().subscribe(result => {
      if(result.statusCode === 1) {
        this['status' + this.deviceId] = 'Cancelled';
      }
    });
  }
  completeTask(data) {
   const completeData = {"comments": data.description,
                         "type": 'RQT-OT',
                         "status": 'RQ-CO',
                         "userType": 'RT-US'}
   const dialogRef = this.dialog.open(ConfirmationDialog, {
    panelClass:['confirmation-popup'], disableClose: true,
       data: {
         title: 'Complete Task', message: 'Do you want to complete the task ?',
         buttonText: { ok: 'Yes', cancel: 'No' },
         'completeTask': true, 'requestId': this[data?.id + 'req'], 'completeData': completeData
       }
     });
   dialogRef.afterClosed().subscribe(result => {
    if(result.statusCode === 1) {
      this['status' + this.deviceId] = 'Completed';
    }
   });
 }
 groupUser() {
  const userIds = this.checkedUser.map( x => x.id);
  const data = {
    "date": this.dateFormat.transform(new Date(), 'yyyy-MM-dd'),
    "entityType": "HazmatUser",
    "userIds": userIds
  }
  this.commonService.scheduleUser(data).subscribe(res => {
    if (res.statusCode === 1) {
      this.toastr.success('Success', `${res.message}`);
    }
  },
  error => {
    this.toastr.error('Error', `${error.error.message}`);
  });
}
  fixClick() {
    console.log('')
  }
}

