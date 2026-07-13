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

import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../services';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import 'leaflet-easyprint';
import { StyleLoaderService } from '../../../services/style-loader.service ';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-hazmat-map',
  templateUrl: './hazmat-map.component.html',
  styleUrls: ['./hazmat-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HazmatMapComponent implements OnInit {
  @Input() hazardActivity: any;
  @Input() hazardType: any;
  @Input() hazmatLocation: any;
  @Input() mrssi: any;
  @Input() configValue: any;
  @Input() openActivities = false;
  @Output() createStatus = new EventEmitter<any>();
  @Input() acivityUpdatedData: any;
  @Input() acivityData: any;
  @Input() valRAYE?: any;
  locationForm: FormGroup;
  requireLocationMatchVal: any = [];
  locationListItems: any = [];
  locationIdEnabled = false;
  public locationDetails: any = [];
  displayedColumns: string[] = ["S.No", "identifyingValue", "Value", "Haz", "isActive"];
  dataSource: MatTableDataSource<any>;
  isBeaconExist = false;
  locationId = null;
  height: number;
  kitList: any=[];
  hazardTypeList: any=[];
  beaconList: any=[];
  height1: number;
  beaconData: any=[];
  locationName = null;
  activityId = null;
  activityListItems: any=[];
  activityDetails: any=[];
  activityIdEnabled = false;
  kmlDetails = null;
  rExceed = false;
  aExceed = false;
  yExceed = false;
  eExceed = false;
//map
  public map: any;
  public mapZoomCntrl = null;
  public multiReaderInfo = {
    "id" : null,
    "readerName" : null,
    "selectedIndex" : null,
    "floorId" : null,
    "floorName" : null,
    "activityId" : null,
    "activityIndex" : null,
    "activityFloorId" : null,
    "activityFloorName" : null,
    "activityName" : null,
    "selectedReader" : null,
    "readersList"    : [],
    "locations"    : {},
    "HazardDistance"    : {},
    "showReaders"      : false,
    "showLabel"      : true,
    "updateAction"      : false,
    "enabled"   : false,
    "floorValidate" : true
  }
  public info = {
    "facility": null,
    "data": null,
    "id": "",
    "coordinates": null,
    "location": null,
    "floors": [],
    "locationDetail": [],
    "all_reader": [],
    "all_reader_id": {},
    "all_reader_name": {},
    "status": false,
  }
  public maps = {
    "floors": {},
    "floor_id": null,
    "position": null,
    "reader_postion": {},
    'kmlPolygons' : [],
    "icon1": new L.Icon({ iconUrl: '/assets/Alert/common_icons/green-dot.png', iconSize: [20, 20],
    iconAnchor: [10, 10],
    labelAnchor: [6, 0]}),
    "icon2": new L.Icon({ iconUrl: '/assets/Alert/common_icons/pink-dot.png', iconSize: [20, 20],
    iconAnchor: [10, 10],
    labelAnchor: [6, 0]}),
    "icon3": new L.Icon({ iconUrl: '/assets/Alert/common_icons/red-dot.png', iconSize: [20, 20],
    iconAnchor: [10, 10],
    labelAnchor: [6, 0]}),
    "location": {},
    "active_location": null
  }
    hideHaz = null;
    aspects = null;
    position: any={};
    activityName = null;
    activityData: any;
    seperationExist = false;
    preHaz = null;
    floorId = null;
    fileInfo: string;
    easyPrint: any;
    showautomanual = false;
     geoJsonData =null;
     editedValue = new FormControl(null);
    editConfigValue = false;
    editedRow = null;
    sourcePoint = null;
    destinationPoint= null;
    ellipses = [];
    selectedType = null;
    activeMarker = null;
    selectedMarker = null;

  constructor(
    private readonly styleLoader: StyleLoaderService,
    public form: FormBuilder,
    public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private readonly commonService: CommonService, 
    public thisDialogRef: MatDialogRef<any>, 
    public toastr: AppToastService,
    private readonly configurationServices: ConfigurationService,
    private readonly commonServices: CommonService,
    private readonly _snackBar: MatSnackBar) {
        this.getAllReader()
        this.info["facility"] = localStorage.getItem('ZmFjaWxpdHlJZA==');
        if (this.data.readerName) {
            this.info["data"] = this.data;
            this.info["id"] = this.data.id;
            this.info["coordinates"] = this.data.coordinate ? JSON.parse(this.data.coordinate) : null;
            this.info["status"] = this.data.configStatusId
            this.info["meshType"] = this.data.meshTypeId
            this.maps["floor_id"] = this.data.floorId ? this.data.floorId : null
            this.info["location"] = this.data.locationId
        } else {
            this.info["data"] = {}
            this.info["id"] = null
        }
        this.multiReaderInfo.enabled = true;            
        this.info["data"] = {}
        this.info["id"] = null
        this.getAllDetails();
    }
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
            duration: 5000,
        });
  }
  getAllReader() {
    this.configurationServices.getAllReaders().subscribe(res => {
        this.info["all_reader"] = [];
        for (let i in res.results) {
            if (res.results[i].id != this.info["id"]) {
                res.results[i]['enableUpdate'] = false;
                this.multiReaderInfo["readersList"].push(res.results[i])
                this.info["all_reader_name"][res.results[i].readerName] = res.results[i];
            }
        }
        this.commonService.getEntityGroup('EGTI-KIT').subscribe(res => {
            this.kitList = res.results;
            if(this.configValue !== null && this.configValue !== undefined) {
                if(this.configValue?.kitId) {
                    this.locationForm.controls['kitId'].setValue(this.configValue?.kitId[0]);
                    if(this.configValue?.b_id?.length !== 0) {
                        this.addKit();
                    }
                }
                if(this.acivityData?.activityId) {
                    this.activityId = this.acivityData?.activityId;
                    this.locationForm.controls['activityId'].setValue(this.acivityData?.activityName);
                    this.locationForm.controls['activityId'].updateValueAndValidity();
                    this.acivityData['configValue'] = JSON.parse(this.acivityData?.configValue);
                    this.getConfig(this.acivityData);
                }
            }
        });
    });
  }
  ngOnInit(): void {
    this.styleLoader.loadStyleByType('leaflet')
    this.commonService.getAppTerms('HazardType').subscribe(res => {
        this.hazardTypeList = res.results.filter(resFilter => resFilter.groupName === 'HazardType');
    });
    this.buildForm();
    if (this.maps["floor_id"] in this.maps["floors"]) {
      this.info["locationDetail"] =  this.maps["floors"][this.maps["floor_id"]].locations
    }
    if(this.hazardType !== null && this.hazardType !== 'none') {
        this.locationForm.controls['hazardType'].setValue(this.hazardType);
    }
    if(this.hazmatLocation !== null && this.hazmatLocation !== undefined) {
        this.locationId = this.hazmatLocation.id;
        this.floorId = this.hazmatLocation.parentId;
        this.locationName = this.hazmatLocation.name;
        this.locationForm.controls['locationId'].setValue(this.hazmatLocation.name);
        this.locationForm.controls['locationId'].disable();
        this.clear();
    }
    if(this.configValue !== null && this.configValue !== undefined) {
        this.locationId = this.configValue?.locationId;
        this.floorId = this.configValue?.floorId;
        this.locationName = this.configValue?.locationName;
        this.locationForm.controls['locationId'].setValue(this.configValue?.locationName);
    }
  }
  ngOnChanges() {
    if(this.acivityUpdatedData && this.acivityUpdatedData !== null) {
        this.activityIdEnabled = false;
        this.commonServices.getActivitySearch(this.acivityUpdatedData?.name, 'activity', 'ROU-TSK').subscribe(res => {
            this.activityListItems = res.results.filter(x => x.activityCategoryId === "AC-HAZ");
            this.activityDetails = this.activityListItems;
            if(this.acivityUpdatedData && this.acivityUpdatedData !== null) {
                this.activityDetails = this.activityDetails.filter(x => x.id === this.acivityUpdatedData?.id);
                this.activityId = this.acivityUpdatedData?.id;
                this.locationForm.controls['activityId'].setValue(this.acivityUpdatedData?.name);
                this.locationForm.controls['activityId'].updateValueAndValidity();
                this.getConfig(this.activityDetails[0]);
            }
        });
    }
    if(this.hazmatLocation !== null && this.hazmatLocation !== undefined) {
        this.locationId = this.hazmatLocation.id;
        this.floorId = this.hazmatLocation.parentId;
        this.locationName = this.hazmatLocation.name;
        this.locationForm?.controls['locationId'].setValue(this.hazmatLocation.name);
        this.locationForm?.controls['locationId'].disable();
        this.clear();
        if (this.maps["floors"][this.hazmatLocation.parentId]) {
            if(this.hazmatLocation !== null) {
                this.getLocName(this.hazmatLocation);
                this.getFloorDetail(this.hazmatLocation.parentId);                
            }
        }
    }
  }
  onWindowResized(size) {
    this.height = size - 60;
    this.height1 = size - 75;
  }
  buildForm() {
    this.locationForm = this.form.group({
      locationId:[null, this.requireLocationMatch.bind(this)],
      hazardType: [null],
      activityId: [null],
      hazardCount: [1],
      beaconPosition: [false],
      kitId: [this.configValue?.kitId ? this.configValue?.kitId[0] : null],
      r: [this.data.configValue?.r ? this.data.configValue?.r : this.valRAYE ? this.valRAYE.r : null, Validators.pattern('^[0-9-+()]*$')],
      a: [this.data.configValue?.a ? this.data.configValue?.a : this.valRAYE ? this.valRAYE.a : null, Validators.pattern('^[0-9-+()]*$')],
      y: [this.data.configValue?.y ? this.data.configValue?.y : this.valRAYE ? this.valRAYE.y : null, Validators.pattern('^[0-9-+()]*$')],
      e: [this.data.configValue?.e ? this.data.configValue?.e : this.valRAYE ? this.valRAYE.e : null, Validators.pattern('^[0-9-+()]*$')]
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
        this.configurationServices.getLocationData(event.text).subscribe(res => {
          this.locationListItems = res.results.filter(x => x.locationTypeId === 17);
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
          this.commonServices.getActivitySearch(event.text, 'activity', 'ROU-TSK').subscribe(res => {
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
  setBeaconPosition(value){
    this.locationForm.controls['beaconPosition'].setValue(value);
    this.openActivities = false;
    this.checkStatus();
  }
  validate_r_a_y_e(value, key) {
    if(value && value > this.configValue?.max_value ||
    value < this.locationForm.controls[key].value) {
      if(key === "r") {
        this.rExceed = true;
      } else if(key === "a") {
        this.aExceed = true;
      } else if(key === "y") {
        this.yExceed = true;
      } else if(key === "e") {
        this.eExceed = true;
      }
    } else {
      if(key === "r") {
        this.rExceed = false;
      } else if(key === "a") {
        this.aExceed = false;
      } else if(key === "y") {
        this.yExceed = false;
      } else if(key === "e") {
        this.eExceed = false;
      }
    }
    this.checkStatus();
  }
  addKit() {
    this.editConfigValue = false;
    if(this.locationForm.controls['kitId'].value !== null) {
        const kit = this.kitList.filter(x => x.id === this.locationForm.controls['kitId'].value);
        if(kit && kit[0]?.['groupMapping'].length !== 0){
            this.beaconData = kit[0]?.['groupMapping'];
            this.isBeaconExist = true;
            this.dataSource = new MatTableDataSource<any>(kit[0]?.['groupMapping']);
            let tempData = this.dataSource.data? this.dataSource.data : [];
            this.dataSource.data = tempData.map(row => ({ ...row, isEditing: false, isEdited: false }));
            if(this.configValue?.hazardCount) {
                this.locationForm.controls['hazardCount'].setValue(this.configValue?.hazardCount);
            }
            if(this.hazardActivity?.hazard?.value !== null && this.hazardActivity?.hazard?.value !== undefined) {
                if(this.configValue?.hazard_id?.length !== 0 && this.configValue?.kitId[0] === this.locationForm.controls['kitId'].value) {
                    for(let i = 0; i < this.configValue?.hazard_id.length; i++) {
                            this['haz' + this.preHaz] = 0;
                            if(this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                                this.getAPValue();
                            } else {
                                this.beaconList.push(this.beaconData[this.beaconData?.length-1]?.identifyingValue);
                                this['haz' + this.beaconData[this.beaconData?.length-1]?.identifyingValue] = i+1;
                                this.preHaz = this.beaconData[this.beaconData?.length-1]?.identifyingValue;
                            }
                    }
                    this.openActivities = false; 
                    this.checkStatus('hazard');
                } else {
                    if(this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                        this.getAPValue();
                        this.openActivities = false;
                        this.checkStatus('hazard');
                    } else {
                        this.setHazard(this.hazardActivity?.hazard?.value === 'min' ? this.beaconData[0].identifyingValue : (this.beaconData?.length <= 5 ? this.beaconData[this.beaconData?.length-1].identifyingValue :
                            this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP' ? this.beaconData[5].identifyingValue : this.beaconData[this.beaconData?.length-1].identifyingValue));
                    }
                }
            } else {
                this.mrssi = null;
                if(this.configValue?.hazard_id?.length !== 0 && this.configValue?.kitId[0] === this.locationForm.controls['kitId'].value) {
                    this.activityData["configValue"]['b_id'] = this["temp_b_id"];
                    this.activityData["configValue"]['b_pos'] = this["temp_b_pos"];
                    const filteredItems = this.configValue?.b_id[0][0] === parseInt(this.beaconData[0]?.identifyingValue);
                    if(filteredItems === true) {
                        for(let i = 0; i < this.configValue?.hazard_id.length; i++) {
                                this['haz' + this.preHaz] = 0;
                                if(this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                                    this.getAPValue();
                                } else {
                                    this.beaconList.push(this.beaconData[this.beaconData?.length-1]?.identifyingValue);
                                    this['haz' + this.beaconData[this.beaconData?.length-1]?.identifyingValue] = i+1;
                                    this.preHaz = this.beaconData[this.beaconData?.length-1]?.identifyingValue;
                                }
                        }
                        for(let j = 0; j < this.configValue?.b_id.length; j++) {
                            const id = this.beaconList.filter(x => this.configValue?.b_id[j][0].toString() === x);
                            if(id.length === 0) {
                                this['haz' + this.configValue?.b_id[j][0]] = 0;
                            }
                        }
                        this.mrssi = this.configValue?.mrssi;
                        this.openActivities = false; 
                        this.checkStatus('hazard');
                    } else {
                        this.mrssi = this.configValue?.mrssi;
                        if(this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                            this.getAPValue();
                            this.openActivities = false;
                            this.checkStatus('hazard');
                        } else {
                            this.setHazard(this.configValue?.value_type === 'min' ? this.beaconData[0].identifyingValue : (this.beaconData?.length <= 5 ? this.beaconData[this.beaconData?.length-1].identifyingValue :
                                this.hazardType?.substring(0,5) === 'HT-AP'  || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP' ? this.beaconData[5].identifyingValue : this.beaconData[this.beaconData?.length-1].identifyingValue));
                        }
                        this.openActivities = false;
                        this.checkStatus('hazard');
                    }
                } else {
                    this.activityData["configValue"]['b_id'] = [];
                    this.activityData["configValue"]['b_pos'] = [];
                    this.mrssi = this.configValue?.mrssi;
                    let level = this.activityData?.configValue?.level?.split(',') ? this.activityData?.configValue.level.split(',') : [];
                    let index = null;
                    let val = null;
                    let oxyVal = null;
                    for(let i=0; i< this.beaconData?.length; i++) {
                        if(this.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-AP') {
                            if(this.activityData?.configValue?.max_value == 2) {  // FOR AP4C CH 
                              index = i%2 == 0 ? 1 : 2;
                            }
                            if(this.activityData?.configValue?.max_value != 2) {
                              index = 6 >= (i+1) && 5 >= (this.dataSource.data?.length / 2) ? i+1 : (i+1) > 6 && this.dataSource.data?.length > 6 && 5 >= (this.dataSource.data?.length / 2) ? 6-((i+1)-6) :
                              (this.dataSource.data?.length / 2) > 5 && Math.round(this.dataSource.data?.length / 2) >= (i+1) ? 
                              i+1 : (this.dataSource.data?.length / 2) > 5 && (i+1) > Math.round(this.dataSource.data?.length / 2) ? (Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2))) === 0 ? 1 :
                              Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2)) : ''
                            }
                          } else if(this.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
                            index = i === 0 ? parseInt(this.activityData?.configValue?.min_value) : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
                            ((Math.trunc((parseInt(this.activityData?.configValue?.max_value)-parseInt(this.activityData?.configValue?.min_value))/(this.dataSource.data?.length-2)) * i)+parseInt(this.activityData?.configValue?.min_value)) : (this.dataSource.data?.length === (i+1) ? 
                            parseInt(this.activityData?.configValue?.max_value) : ''));
                            oxyVal = i === 0 ? parseInt(this.activityData?.configValue?.maxOxygen_value) : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
                            Math.trunc(parseInt(this.activityData?.configValue?.maxOxygen_value)-(((parseInt(this.activityData?.configValue?.maxOxygen_value)-parseInt(this.activityData?.configValue?.minOxygen_value))/(this.dataSource.data?.length-2)) * i)) : (this.dataSource.data?.length === (i+1) ? 
                            parseInt(this.activityData?.configValue?.minOxygen_value) : ''));
                          } else if(this.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-IM') {
                            index = this.dataSource.data?.length === (i+1) ? (parseInt(this.activityData?.configValue?.max_value)) : this.getLogicIntensValue(i);
                          } else if(this.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-UR') {
                            index = i === 0 ? parseInt(this.activityData?.configValue?.min_value) : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
                            (Math.trunc((this.activityData?.configValue?.max_value-(this.activityData?.configValue?.min_value))/(this.dataSource.data?.length-1)) * i)+parseInt(this.activityData?.configValue?.min_value) : (this.dataSource.data?.length === (i+1) ? 
                            parseInt(this.activityData?.configValue?.max_value) : ''));
                          }
                        if(level?.length !== 0) {
                            for(let j = 0; j < level?.length; j++) {
                              if(parseInt(level[j]) === index) {
                                const alarm = 'L' + (j+1);
                                if(this.activityData?.configValue?.max_value != 2) {
                                  this[this.beaconData[i].identifyingValue + 'level'] = alarm;
                                }
                              }
                            }
                          }
                          if(this[this.beaconData[i].identifyingValue + 'level']) {
                            if(this.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
                              index = this.beaconData[i].hasOwnProperty('hazardValue') ? this.beaconData[i]['hazardValue'] : index;
                                this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index * 10, this[this.beaconData[i].identifyingValue + 'level'], Number.isNaN(oxyVal) ? null : oxyVal * 10]);
                            } else {
                                this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index, this[this.beaconData[i].identifyingValue + 'level']]);
                            }
                          } else {
                            if(this.activityData?.configValue?.hazard_type?.substring(0,4) === 'HT-G') {
                              index = this.beaconData[i].hasOwnProperty('hazardValue') ?this.beaconData[i]['hazardValue'] : index;
                              this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index * 10, Number.isNaN(oxyVal) ? null : oxyVal * 10]);
                            } else if(this.activityData?.configValue?.hazard_type?.substring(0,5) === 'HT-IM') {
                              if(index === 0) {
                                this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index * 100, 'L1']);
                              } else {
                                this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index * 100]);
                              }
                            } else {
                                this.activityData["configValue"]['b_id'].push([parseInt(this.beaconData[i].identifyingValue), index]);
                            }
                          }
                    }
                    if(this.configValue?.hazard_type?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                        this.getAPValue();
                        this.openActivities = false;
                        this.checkStatus('hazard');
                    } else {
                        this.setHazard(this.configValue?.value_type === 'min' ? this.beaconData[0].identifyingValue : (this.beaconData?.length <= 5 ? this.beaconData[this.beaconData?.length-1].identifyingValue :
                            this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP' ? this.beaconData[5].identifyingValue : this.beaconData[this.beaconData?.length-1].identifyingValue));
                    }
                }
            }
        } else {
            this.isBeaconExist = false;
        }
    }
  }
  clear() {
    this.isBeaconExist=false;
    this.beaconList = [];
    this.openActivities = false; 
    this.checkStatus();
    if(this.maps["reader_postion"]) {
        const key = Object.keys(this.maps["reader_postion"]);
        key.forEach(id => {
            this.map.removeLayer(this.maps["reader_postion"][id]);
            this.map.removeLayer(this.maps["reader_postion"][id+"label"]);    
        });   
    }
  }
  setHazard(beacon) {
    if(this.beaconList.length !== 0) {
        const list = this.beaconList.filter(x => beacon.indexOf(x) === 0);
        if(list.length === 0) {
            if(this.beaconList.length === this.locationForm.controls['hazardCount'].value) {
                this['haz' + this.beaconList[this.beaconList.length -1]] = 0;
                this.beaconList.pop();
            }
            this.beaconList.push(beacon);
            this['haz' + beacon] = this.beaconList.length;
        } else {
            if(this['haz' + beacon] === this.beaconList.length) {
                this.beaconList = this.beaconList.filter(x => beacon.indexOf(x) === -1);
                this['haz' + beacon] = 0;
            }
        }
    } else {
        if(this.beaconList.length === this.locationForm.controls['hazardCount'].value) {
            this['haz' + this.beaconList[this.beaconList.length -1]] = 0;
            this.beaconList.pop();
        }
        this['haz' + this.preHaz] = 0;
        this.beaconList.push(beacon);
        this['haz' + beacon] = this.beaconList.length;
        this.preHaz = beacon;
    }
    this.openActivities = false;
    this.checkStatus('hazard');
  }
  getAPValue() {
    let vals = [];
    let min = 1;
    let max = 6;
    if(this.configValue.max_value) {
        min = this.configValue.min_value;
        max = this.configValue.max_value;
    }
    for(let i = 0; i <= this.beaconData?.length; i++) {
        if(max == 2) {
            let val = i %2 == 0 ? 1 : 2;
            vals.push(val)
        }
        if(max == 6) {
        vals.push(6 >= (i+1) && 5 >= (this.dataSource.data?.length / 2) ? i+1 : (i+1) > 6 && this.dataSource.data?.length > 6 && 5 >= (this.dataSource.data?.length / 2) ? 6-((i+1)-6) :
        (this.dataSource.data?.length / 2) > 5 && Math.round(this.dataSource.data?.length / 2) >= (i+1) ? 
        i+1 : (this.dataSource.data?.length / 2) > 5 && (i+1) > Math.round(this.dataSource.data?.length / 2) ? (Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2))) === 0 ? 1 :
        Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2)) : '')
        }        
    }
    this['haz' + this.preHaz] = 0;
    const value = vals.indexOf(Math.max(...vals));
    this.beaconList.push(this.beaconData[value]?.identifyingValue);
    this['haz' + this.beaconData[value]?.identifyingValue] = 1;
    this.preHaz = this.beaconData[value]?.identifyingValue;
  }
  openActivity(data?: any) {
    this.openActivities = true;
    this.activityData = null;
    if(this.activityId !== null) {
        const option = this.activityDetails.filter(x => x.id === this.activityId);
        this.activityData = option[0];
    } else {
        const option = this.activityDetails.filter(x => x.id === this.locationForm.controls['activityId'].value);
        this.activityData = option[0];
    }
    this.checkStatus(null);
  }
  getConfig(data) {
    this.openActivities = false;
    this.configValue = null;
    this.activityData = null;
    this.activityName = data?.name;
    if(data && data?.configValue) {
        this.configValue = data.configValue;
        this.locationForm.controls['kitId'].setValue(this.configValue?.kitId[0]);
        this.locationForm.controls['r'].setValue(this.configValue?.r);
        this.locationForm.controls['a'].setValue(this.configValue?.a);
        this.locationForm.controls['y'].setValue(this.configValue?.y);
        this.locationForm.controls['e'].setValue(this.configValue?.e);
    }
    this.activityData = data;
    this["temp_b_id"] = this.activityData["configValue"]['b_id'];
    this["temp_b_pos"] = this.activityData["configValue"]['b_pos'];
    this.hazardActivity = [];
    this.hazardActivity['max'] = {'value': this.activityData?.configValue?.max_value};
    this.hazardActivity['min'] = {'value': this.activityData?.configValue?.min_value};
    this.beaconList = [];
    this.addKit();
    this.checkStatus(null);
  }
  checkStatus(type?: any) {
    this.editedRow = null;
    let haz = null;
    let loc = null;
    let locName = null;
    let act = null;
    let actName = null;
    if(this.hazardType !== 'none') {
        haz = this.locationForm?.controls['hazardType'].value;
    } else {
        haz = this.locationForm?.controls['activityId'].value;
    }
    if (this.locationId !== null) {
        loc = this.locationId;
        locName = this.locationName;
    } else {
        loc = this.locationForm.controls['locationId'].value;
        locName = this.locationName;
    } 
    if (this.activityId !== null) {
        act = this.activityId;
        actName = this.locationForm?.controls['activityId'].value;
    } else {
        act = this.locationForm?.controls['activityId'].value;
        actName = this.activityName;
    } 
    if(this.hazmatLocation && (type === 'beaconList' || type === 'hazard')) {
        this.show_map(this.hazmatLocation.parentId);
    } else if(this.configValue && (type === 'beaconList' || type === 'hazard')) {
        this.show_map(this.configValue?.floorId);
    } else {
        if(type === 'beaconList' || type === 'hazard') {
            this.show_map(this.maps["floor_id"]);
        }
    }
    if(this.configValue?.hasOwnProperty('hazard_type')) {
        this.locationForm.controls.hazardType.setValue(this.configValue.hazard_type);
    }
    const data = {
        "enableCreate" : this.beaconList.length === this.locationForm.controls['hazardCount'].value && haz !== null ? true : false,
        "beaconList": this.beaconData,
        "position": this.position,
        "hazard": this.beaconList,
        "locationId":loc,
        "floorId": this.floorId,
        "locationName":locName,
        "hazardType": this.locationForm.controls['hazardType'].value,
        "hazardCount": this.locationForm.controls['hazardCount'].value,
        "positionType": this.locationForm.controls['beaconPosition'].value,
        "kitId": this.locationForm.controls['kitId'].value,
        "openActivities": this.openActivities,
        "activityData": this.activityData && this.activityData !== null ? this.activityData : '',
        "activityId":act,
        "activityName":actName,
        "kmlDetails" : this.kmlDetails,
        "editConfigValue":  this.editConfigValue,
        "r": parseInt(this.locationForm.controls['r'].value),
        "a": parseInt(this.locationForm.controls['a'].value),
        "y": parseInt(this.locationForm.controls['y'].value),
        "e": parseInt(this.locationForm.controls['e'].value)
    }
    this.createStatus.emit(data);
  }
  //map
  getAllDetails() {
    this.commonServices.getAllLocation().subscribe(res => {
        for (let a in res.results) {
            for (let b in res.results[a].children) {
                for (let c in res.results[a].children[b].children) {
                    let floor_id = res.results[a].children[b].children[c].id
                    this.multiReaderInfo.locations[floor_id] = res.results[a].children[b].children[c];
                    for (let d in res.results[a].children[b].children[c].children) {
                        let locationId = res.results[a].children[b].children[c].children[d].id
                        let location = {
                                            "id": res.results[a].children[b].children[c].children[d].id,
                                            "name": res.results[a].children[b].children[c].children[d].name,
                                            "locationTypeId": res.results[a].children[b].children[c].children[d].locationTypeId,
                                            "imageUrl": res.results[a].children[b].children[c].children[d].imageUrl,
                                            "coordinates": res.results[a].children[b].children[c].children[d].coordinates,
                                            "polygonStyle" : res.results[a].children[b].children[c].children[d].polygonStyle,
                                            "labelStyle" : res.results[a].children[b].children[c].children[d].labelStyle
                                        }
                        if (floor_id in this.maps["floors"]) {
                            this.maps["floors"][floor_id].locations.push(location)
                        } else {
                            this.maps["floors"][floor_id] = {
                                "aspects": res.results[a].children[b].children[c].aspects,
                                "coordinates": res.results[a].children[b].children[c].coordinates,
                                "defaultZoom": res.results[a].children[b].children[c].defaultZoom,
                                "maxZoom": res.results[a].children[b].children[c].maxZoom,
                                "minZoom": res.results[a].children[b].children[c].minZoom,
                                "disLocLevel": res.results[a].children[b].children[c].disLocLevel,
                                "labelStyle": res.results[a].children[b].children[c].labelStyle,
                                "polygonStyle": res.results[a].children[b].children[c].polygonStyle,
                                "id": res.results[a].children[b].children[c].id,
                                "imageUrl": res.results[a].children[b].children[c].imageUrl,
                                "locationTypeId": res.results[a].children[b].children[c].locationTypeId,
                                "name": res.results[a].children[b].children[c].name,
                                "locations": [location]
                            }
                            this.info["floors"].push({"id": floor_id, "name": res.results[a].children[b].children[c].name, "blockName": res.results[a].children[b].name })
                        }
                        this.multiReaderInfo.locations[locationId] = res.results[a].children[b].children[c].children[d];
                        for (let e in res.results[a].children[b].children[c].children[d].children) {
                            let locId = res.results[a].children[b].children[c].children[d].children[e].id
                            this.multiReaderInfo.locations[locId] = res.results[a].children[b].children[c].children[d].children[e];
                        }                            
                    }
                }
            }
        }
        if (this.maps["floor_id"] in this.maps["floors"]) {
            this.info["locationDetail"] =  this.maps["floors"][this.maps["floor_id"]].locations
        }
        if(this.hazmatLocation !== null && this.hazmatLocation !== undefined) {
            this.getLocName(this.hazmatLocation);
            this.getFloorDetail(this.hazmatLocation.parentId);            
        }
        if(this.configValue !== null && this.configValue !== undefined) {
            this.getFloorDetail(this.configValue?.floorId);
        }
        this.show_map(this.maps["floor_id"]);
    });
    
    if(this.multiReaderInfo.enabled) {
        // this.configurationServices.getAllActivities().subscribe(res => {
        //     if(res.statusCode == 1) {
        //         this.activityList = res.results.filter(val => val.activityCategoryId == 'AC-HAZ')
        //     }
        // })
    }
}
ShowLabel() {
    this.multiReaderInfo.showLabel = !this.multiReaderInfo.showLabel;
    for(let i in this.info['all_reader']) {
        this.reader_position_hide(this.multiReaderInfo.showLabel ? 'open' : 'hide', i, null)
    }
}
getLocName(data) {
    this.locationName = data.name;
    this.locationId = data.id;
    this.floorId = data.parentId;
    this.openActivities = false;
    this.checkStatus();
}
getFloorDetail(floor_id) {
    if (this.maps["floors"][floor_id]) {
        this.maps["floor_id"] = floor_id
        if(this.multiReaderInfo.enabled) {
            this.multiReaderInfo.floorId = floor_id
            this.multiReaderInfo.floorName = this.maps["floors"][floor_id].name
            this.multiReaderInfo.floorValidate = this.multiReaderInfo.activityFloorId == null || this.multiReaderInfo.activityFloorId == floor_id ? true : false;
            this.multiReaderInfo.activityFloorName = this.multiReaderInfo.floorValidate ? this.multiReaderInfo.floorName : this.multiReaderInfo.activityFloorName;
            this.multiReaderInfo.updateAction = false;
        }
        this.info["locationDetail"] = this.maps["floors"][this.maps["floor_id"]].locations
        this.show_map(floor_id)
    }
    
}

getKMLCoordinate(location, data) {
    this.selectedMarker = null;
    this.position_change(data.latlng, location);
}
getCoordinate(location, data) {
    if (this.maps['active_location'] != null ) {
        if (this.maps['active_location'] != location) {
            // this.editLocation(this.maps['active_location'])
            // this.editLocation(location)
        }
    } else {
        // this.editLocation(location)
    }
    let valid = null
    if (valid == null) {
        if(this.selectedMarker == 'beacon') {
            this.position_change(data.latlng, location);
            this.selectedMarker = null;
        }
    } else {
        console.log("invalid postion")
        this.toastr.error('Error', `invalid postion`);
    }
}
position_change(xy, location) {
    this.info["coordinates"] = JSON.parse('[' + (xy.lng / 100).toFixed(3) + ',' + (xy.lat / -100).toFixed(3) + ']');
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
        this.info["coordinates"] = JSON.parse('[' + xy.lat.toFixed(8) + ',' + xy.lng.toFixed(8) + ']');
    }    
    this.info["location"] = location
    let locDetail = this.multiReaderInfo['locations'][location]
    let readerDetail = this.info['all_reader'][this.multiReaderInfo['selectedIndex']];
    if(this.multiReaderInfo['selectedIndex'] == null) {
        return
    }    
    if(this.maps["reader_postion"][readerDetail.id]) {
        this.map.removeLayer(this.maps["reader_postion"][readerDetail.id]);
        this.map.removeLayer(this.maps["reader_postion"][readerDetail.id+"label"]);
    }
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['coordinate'] = JSON.stringify(this.info["coordinates"])
    this.position[readerDetail.readerName] = JSON.parse('[' + (xy.lng / 100).toFixed(3) + ',' + (xy.lat / -100).toFixed(3) + ']');
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
        this.position[readerDetail.readerName] = JSON.parse('[' + xy.lat.toFixed(8) + ',' + xy.lng.toFixed(8) + ']');
    }    
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['locationId'] = locDetail.id
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['locationName'] = locDetail['name']
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['enableUpdate'] = true;
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['readerLocation'] = '[' + locDetail.id + ']'
    this.info['all_reader'][this.multiReaderInfo.selectedIndex]['floorId'] = locDetail.parentId;
    
    let readerPoints = [this.info["coordinates"][1] * -100, this.info["coordinates"][0] * 100];
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
        readerPoints = this.info["coordinates"];
    }
    let hazardDistance = this.multiReaderInfo['HazardDistance'][readerDetail.readerName];
    if(this.kmlDetails) {
        let origin = this.configValue.value_type == 'max' ? this.kmlDetails.destination : this.kmlDetails.source;
        let distance = this.GetCoordinateDistance(origin, JSON.parse('[' + xy.lat.toFixed(8) + ',' + xy.lng.toFixed(8) + ']'))
        let h_value = Math.round(distance * this.kmlDetails.hazardValue)
        this.beaconData[this.multiReaderInfo.selectedIndex]['hazardValue'] = h_value;
        hazardDistance = h_value
    }
    if(this.multiReaderInfo.showLabel) {
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div>" + readerDetail.readerName + " <br><span style='font-weight: 100;'>" + "HV : " + hazardDistance +"</span></div>",
                className: this.beaconList.includes(readerDetail.readerName) ? 'text-below-marker-red' : 'text-below-marker',
            })
        }).on('click', this.reader_position_hide.bind(this, "hide", readerDetail.id)).addTo(this.map);
        this.maps["reader_postion"][readerDetail.id+"label"] = readerPositionLabel;            
    } else {
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div><span style='font-size: 9px; font-weight: 800;'>Open</span><br>"+ "" + hazardDistance +"</div>",
                className: this.beaconList.includes(readerDetail.readerName) ? 'text-below-marker-hide-red' : 'text-below-marker-hide',
            })
        }).on('click', this.reader_position_hide.bind(this, "hide", readerDetail.id)).addTo(this.map);
        this.maps["reader_postion"][readerDetail.id+"label"] = readerPositionLabel;            
    }
    const readerPosition = L.marker(readerPoints, {icon: this.beaconList.includes(readerDetail.readerName) ? this.maps["icon3"] : this.maps["icon1"]});
    readerPosition.on('click', this.reader_link.bind(this, readerDetail.readerName));
    readerPosition.addTo(this.map);            
    this.maps["reader_postion"][readerDetail.id] = readerPosition;
    this.openActivities = false;
    this.checkStatus()
}
show_map(floor_id) {
    if (this.map) {
        this.map.remove();
        this.map = null;
    }
    let floor_info = this.maps["floors"][floor_id]
    if(floor_info) {
        if(floor_info['locationTypeId'] == 23) {
            let mapUrl:any = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            mapUrl =  'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        this.map = L.map('locationId', {
            center: new L.LatLng(45.78771148665357, 15.967683792394526),
            minZoom: floor_info.minZoom/10 <= 22 ? floor_info.minZoom/10 : 22,
            maxZoom: floor_info.maxZoom/10 <= 22 ? floor_info.maxZoom/10  : 22,
            zoom: floor_info.defaultZoom/10 <= 22 ? floor_info.defaultZoom/10  : 22,
            zoomControl: true, attributionControl: false
        });
        L.tileLayer(mapUrl,{
            maxZoom : 22,
            subdomains:['mt0','mt1','mt2','mt3']
        }).addTo(this.map);
        this.map.on('zoomend', this.zoomCntrlLabel.bind(this));
        this.map.on('click', this.addMarker.bind(this) );
        
    } else {    
        let minimumZoom = -3, maximumZoom = 0, defaultZoom = -2;
        if(floor_info.defaultZoom != null && floor_info.minZoom != null && floor_info.maxZoom != null){
            minimumZoom = -10;
            maximumZoom = floor_info.maxZoom/20 - 10;
            defaultZoom = floor_info.defaultZoom/20 - 10;
        }
    this.map = L.map('locationId', {
        minZoom: minimumZoom,
        maxZoom: maximumZoom,
        center: [10, 0],
        zoom: defaultZoom,
        crs: L.CRS.Simple,
        zoomControl:true,
        attributionControl: false,
        closePopupOnClick: false
    });
    let floorImage = environment.api_base_url_new + floor_info.imageUrl + '?date=' + (new Date());
    let southWest = null, northEast = null 
    if (floor_info.aspects != null) {
        const e = eval;
        let aspects = e(floor_info.aspects)
        this.aspects = aspects;
        southWest = this.map.unproject([0, aspects[1] * 100], this.map.getMaxZoom());
        northEast = this.map.unproject([aspects[0] * 100, 0], this.map.getMaxZoom());
    } else {
        southWest = this.map.unproject([0, 1700], this.map.getMaxZoom());
        northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
    }
    let bounds = new L.LatLngBounds(southWest, northEast);
    L.imageOverlay(floorImage, bounds).addTo(this.map);
    this.map.on('zoomend', this.zoomCntrlLabel.bind(this));
    this.map.on('click', this.addMarker.bind(this) );
    if(this.data.id && this.data["floorId"] == floor_id) {
        let readerpos = JSON.parse(this.data['coordinate'])
        let center = { "lat": readerpos[1] * -100, "lng": readerpos[0] * 100 }
        this.map.setView(center, defaultZoom); 
    } else {
        this.map.setView(bounds.getCenter(), defaultZoom); 
    }
    }
    for (let i in floor_info.locations) {
        if (floor_info.locations[i].coordinates) {
            this.drawLocation(floor_info.locations[i], '#e0ebeb', floor_id);
        }
    }
    this.zoomCntrlLabel();
    this.easyPrint = L.easyPrint({
        tileLayer: '',
        sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
        filename: 'myMap',
        exportOnly: true,
        hideControlContainer: true
    }).addTo(this.map);
    if(this.multiReaderInfo.enabled) {
        this.ShowLabel()
    }
    }
    }
zoomCntrlLabel(){
    let zoomVal = Math.round(this.map.getZoom()) * 10;
    if(this.maps["floors"][this.floorId]['locationTypeId'] != 23) {
        zoomVal = (Math.round(this.map.getZoom()) + 10) * 20;
    }
    if(this.mapZoomCntrl) {
      this.map.removeControl(this.mapZoomCntrl)
      this.mapZoomCntrl = null;
    }
    let showZoom = L.DomUtil.create("button");
    this.mapZoomCntrl = new L.Control();
    this.mapZoomCntrl.options = { position: "topleft" };
    this.mapZoomCntrl.onAdd = () => {
      showZoom.innerText = +zoomVal + ' %';
      return showZoom;
    };
    this.map.addControl(this.mapZoomCntrl);
}
editLocation(location_id) {
    console.log("edit location ", location_id)
    let color = "#ffcc99"
    
    if (location_id in this.maps['location']) {
        let locationDetail = this.maps['location'][location_id]['data']
        let area = JSON.parse(locationDetail.coordinates);
        this.map.removeLayer(this.maps['location'][location_id]['poly']);
        if (this.maps['location'][location_id]['color'] == color) {
            color = '#e0ebeb'
        }
        let poly = area.geometry.coordinates
        let test: any = [];
        for (let i in poly) {
            test.push([poly[i][1] * -100, poly[i][0] * 100])
        }
        const polygonData = L.polygon(test, { color: color});
        let className = 'reader-tooltip';
        polygonData.on('click', this.getCoordinate.bind(this, locationDetail.id));
        polygonData.addTo(this.map)
        let name = locationDetail.name.split(" ").join("<br>")
        polygonData.bindTooltip(name, { permanent: true, direction: "center", className: className }).openTooltip();
        this.maps['location'][locationDetail.id] = {
            "color": color,
            "poly": polygonData,
            "data": locationDetail
        }
        this.maps['active_location'] = location_id
    }
    
}
drawLocation(locationDetail, color, floorId) {
    let area = JSON.parse(locationDetail.coordinates);
    if (area) {
        let poly = area.geometry.coordinates
        let test: any = [];
        if(area.geometry.type == "Point") {
            test = [poly[1], poly[0]];
        } else {  
        for (let i in poly) {
            if(area.hasOwnProperty('unit') && area.unit == 'latlng') {
                test.push([poly[i][1],poly[i][0]])
            } else {
                test.push([poly[i][1] * -100, poly[i][0] * 100])
            }
        }
        }
        let polygonData = null;
        if(area.geometry.type == "Point") { 
        polygonData = L.marker(test);     
        } else {            
        polygonData = L.polygon(test, { color: locationDetail.polygonStyle ? locationDetail.polygonStyle : color});
        }
        let className = 'loc-tooltip';
        polygonData.on('click', this.getCoordinate.bind(this, locationDetail.id));
        polygonData.addTo(this.map)
        let name = locationDetail.name.split(" ").join("<br>")
        polygonData.bindTooltip(name, { permanent: true, direction: "center", className: className }).openTooltip();
        this.maps['location'][locationDetail.id] = {
            "color": locationDetail.polygonStyle ? locationDetail.polygonStyle : color,
            "poly": polygonData,
            "data": locationDetail
        }
        if(this.maps["floors"][floorId]['locationTypeId'] == 23) {
            if(locationDetail.id === this.locationId) {
                if(area.geometry.type == "Point") { 
                let bounds = [[poly[1], poly[0]], [poly[1], poly[0]]]
                this.map.fitBounds(bounds);
                } else {
                this.map.fitBounds(polygonData.getBounds());
                }
                this.checkBeacon(polygonData, this.maps["floors"][floorId], locationDetail)
            }
        } else {
            this.checkBeacon(polygonData, this.maps["floors"][floorId], locationDetail)
        }
    }
}
checkBeacon(polygonData, floorDetail, locationDetail) {
    if(this.mrssi) {
        if(floorDetail['locationTypeId'] == 23 || (this.aspects !== null && this.aspects[1] > (this.mrssi / 100) * this.beaconData.length)) {
            const center = polygonData?.getCenter();
            let beaconPoint = [(center.lng/4) / 100, center.lat / -100]
            if(floorDetail['locationTypeId'] == 23) {
                beaconPoint = [center.lat, center.lng]
            }
            this.position = {};
            this.info.all_reader = [];
            let max = this.configValue.max_value ? this.configValue.max_value : 6;
            for(let i = 0; i < this.beaconData.length; i++) {
                if(this.configValue.hasOwnProperty('b_pos') && this.configValue?.b_pos.hasOwnProperty(this.beaconData[i]?.identifyingValue)) {
                    const pos = this.configValue.locationId == locationDetail.id ? this.configValue?.b_pos[this.beaconData[i]?.identifyingValue] : beaconPoint;
                    this.position[this.beaconData[i]?.identifyingValue] = [pos[0], pos[1]];
                    beaconPoint = pos
                } else {
                    this.position[this.beaconData[i]?.identifyingValue] = beaconPoint;
                }
                if(this.hazardType?.substring(0,5) === 'HT-AP' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-AP') {
                    if(max == 6) {
                        this['index' + this.beaconData[i]?.identifyingValue] = (6 >= (i+1) && 5 >= (this.dataSource.data?.length / 2) ? i+1 : (i+1) > 6 && this.dataSource.data?.length > 6 && 5 >= (this.dataSource.data?.length / 2) ? 6-((i+1)-6) :
                        (this.dataSource.data?.length / 2) > 5 && Math.round(this.dataSource.data?.length / 2) >= (i+1) ? 
                        i+1 : (this.dataSource.data?.length / 2) > 5 && (i+1) > Math.round(this.dataSource.data?.length / 2) ? (Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2))) === 0 ? 1 :
                        Math.round(this.dataSource.data?.length / 2) - ((i+1) - Math.round(this.dataSource.data?.length / 2)) : '')
                    }
                    if(max == 2) {
                        this['index' + this.beaconData[i]?.identifyingValue] = i % 2 == 0 ? 1 : 2;
                    }
                } else if(this.hazardType?.substring(0,4) === 'HT-G' || this.activityData?.configValue?.hazard_type.substring(0,4) === 'HT-G') {
                    this['index' + this.beaconData[i]?.identifyingValue] = (i === 0 ? this.hazardActivity?.min?.value : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
                    (Math.trunc((this.hazardActivity?.max?.value-(this.hazardActivity?.min?.value))/(this.dataSource.data?.length-2)) * i)+parseInt(this.hazardActivity?.min?.value) : (this.dataSource.data?.length === (i+1) ?
                     this.hazardActivity?.max?.value : '')));
                } else if(this.hazardType?.substring(0,5) === 'HT-IM' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-IM') {
                    this['index' + this.beaconData[i]?.identifyingValue] = (this.dataSource.data?.length === (i+1) ? parseInt(this.hazardActivity?.max?.value) : this.getLogicIntensValue(i));
                } else if(this.hazardType?.substring(0,5) === 'HT-UR' || this.activityData?.configValue?.hazard_type.substring(0,5) === 'HT-UR') {
                    this['index' + this.beaconData[i]?.identifyingValue] = (i === 0 ? this.hazardActivity?.min?.value : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
                    (Math.trunc((this.hazardActivity?.max?.value-(this.hazardActivity?.min?.value))/(this.dataSource.data?.length-1)) * i)+parseInt(this.hazardActivity?.min?.value) : (this.dataSource.data?.length === (i+1) ?
                     this.hazardActivity?.max?.value : '')));
                }
                this.multiReaderInfo['HazardDistance'][this.beaconData[i]?.identifyingValue] = this['index' + this.beaconData[i]?.identifyingValue];
                if(this.data == undefined || this.info.all_reader_name.hasOwnProperty(this.beaconData[i]?.identifyingValue)) {
                    this.info.all_reader_name[this.beaconData[i]?.identifyingValue]['coordinate'] = "[" + beaconPoint.toString() + "]"
                    this.info.all_reader.push(this.info.all_reader_name[this.beaconData[i]?.identifyingValue])
                }

                if(floorDetail['locationTypeId'] == 23) {
                    beaconPoint = [beaconPoint[0], beaconPoint[1]  + (this.mrssi * (1/11111111))]
                } else {
                    beaconPoint = [beaconPoint[0] + (this.mrssi / 100), beaconPoint[1]]
                }                
            }
            if(this.kmlDetails) {
                this.bindKMLCoordinate(this.kmlDetails.geoJson)
            } else {
                this.reader_place()
            }
            if(this.position.length !== 0) {
                this.openActivities = false; 
                this.checkStatus();
            }
        } else {
            this.toastr.error('Error', `Seperation Distance Exist the Map`);
        }
    }
}
hazard_hide(type, id, data) {
    if(type === 'hide') {
        this.hideHaz = id;
        const readerPositionLabel = L.marker([data.latlng.lat, data.latlng.lng], {
            icon: L.divIcon({
                html: "<div>" + id + "<br>" + "" + "HV:" + this["index" + id] +"</div>",
                className: 'text-below-marker-hide',
              })
          }).on('click', this.hazard_hide.bind(this, "open", id)).addTo(this.map);
          this.beaconList.forEach( x => {
            if(x === id) {
                const readerPositionLabel = L.marker([data.latlng.lat, data.latlng.lng], {
                    icon: L.divIcon({
                        html: "<div>" + id + "<br>" + "" + "HV:" + this["index" + id] +"</div>",
                        className: 'text-below-marker-hide',
                    })
                }).on('click', this.hazard_hide.bind(this, "open", id)).addTo(this.map);
            }
        });
    } else {
        if(this.hideHaz !== null) {
            if(this["hazard_postion" + this.hideHaz]) {
                this.map.removeLayer(this["hazard_postion" +  this.hideHaz]); 
                delete this["hazard_postion" +  this.hideHaz];
            }  
            const readerPosition = L.marker([data.latlng.lat, data.latlng.lng], {icon: this.maps["icon1"]});
            readerPosition.addTo(this.map);
            const readerPositionLabel = L.marker([data.latlng.lat, data.latlng.lng], {
                icon: L.divIcon({
                    html: "<div>" + this.hideHaz + "<br>"+ "" + "HV:" + this["index" + this.hideHaz] +"</div>",
                    className: 'text-below-marker',
                })
            }).on('click', this.hazard_hide.bind(this, "hide", this.hideHaz)).addTo(this.map);
            this.beaconList.forEach( x => {
                if(x === this.hideHaz) {
                    const readerPosition = L.marker([data.latlng.lat, data.latlng.lng], {icon: this.maps["icon3"]});
                    readerPosition.addTo(this.map);
                    const readerPositionLabel = L.marker([data.latlng.lat, data.latlng.lng], {
                        icon: L.divIcon({
                            html: "<div>" + this.hideHaz + "<br>"+ "" + "HV:" + this["index" + this.hideHaz] +"</div>",
                            className: 'text-below-marker-red',
                        })
                    }).on('click', this.hazard_hide.bind(this, "hide", this.hideHaz)).addTo(this.map);
                }
            });
            this["hazard_postion" + this.hideHaz] = readerPositionLabel;
            this.position[this.hideHaz] = [data.latlng.lng / 100, data.latlng.lat / (-100)];
            this.hideHaz = null;
            this.openActivities = false; 
            this.checkStatus();
        }
    }
}
reader_link(reader, data) {
    let oldReaderDetail = JSON.parse(JSON.stringify(this.multiReaderInfo));
    if(oldReaderDetail.id != null && reader != oldReaderDetail.readerName) {
        let oldReaderIndex = this.info['all_reader'].findIndex(val => val.readerName == oldReaderDetail.readerName)
        let oldCoordinate = JSON.parse(this.info['all_reader'][oldReaderIndex]['coordinate'])
        this.map.removeLayer(this.maps["reader_postion"][oldReaderDetail.id]);
        let readerPoints = [oldCoordinate[1] * -100, oldCoordinate[0] * 100];
        if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
            readerPoints = oldCoordinate;
        }    
        const readerPosition = L.marker(readerPoints, {icon: this.beaconList.includes(oldReaderDetail.readerName) ? this.maps["icon3"] : this.maps["icon1"]});
        readerPosition.on('click', this.reader_link.bind(this, this.info['all_reader'][oldReaderIndex].readerName));
        readerPosition.addTo(this.map);
        this.maps["reader_postion"][oldReaderDetail.id] = readerPosition;        
    }    
    let readerIndex = this.info['all_reader'].findIndex(val => val.readerName == reader)
    this.multiReaderInfo.readerName = reader;
    this.multiReaderInfo.id = this.info['all_reader'][readerIndex]['id']
    this.multiReaderInfo.selectedIndex = readerIndex;
    this.selectedMarker = 'beacon';
    let coordinate = JSON.parse(this.info['all_reader'][readerIndex]['coordinate'])
    
    if(this.maps["reader_postion"][this.multiReaderInfo.id]) {
        this.map.removeLayer(this.maps["reader_postion"][this.multiReaderInfo.id]);

    }
    let readerPoints = [coordinate[1] * -100, coordinate[0] * 100];
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
        readerPoints = coordinate;
    }    
    const readerPosition = L.marker(readerPoints, {icon: this.maps["icon2"]});
    readerPosition.on('click', this.reader_link.bind(this, this.info['all_reader'][readerIndex].readerName));
    readerPosition.addTo(this.map);
    this.maps["reader_postion"][this.multiReaderInfo.id] = readerPosition;
}

reader_place() {    
    let readerDetail = this.info["all_reader"]
    for (const reader in readerDetail) {
        if (this.maps["reader_postion"] && this.maps["reader_postion"].hasOwnProperty(readerDetail[reader].id)) {
            this.map.removeLayer(this.maps["reader_postion"][readerDetail[reader].id+"label"]);            
            delete this.maps["reader_postion"][readerDetail[reader].id+"label"];
            this.map.removeLayer(this.maps["reader_postion"][readerDetail[reader].id]);
            delete this.maps["reader_postion"][readerDetail[reader].id];
        }
        if (readerDetail[reader].coordinate !== null) {
            const value =  JSON.parse(readerDetail[reader].coordinate);
            let readerPoints = [value[1] * -100, value[0] * 100];
            if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
                readerPoints = value;
            }
            let hazardDistance = this.multiReaderInfo['HazardDistance'][readerDetail[reader].readerName];
            const readerPositionLabel = L.marker(readerPoints, {
                icon: L.divIcon({
                    html: "<div>" + readerDetail[reader].readerName + " <br><span style='font-weight: 100;'>" + "HV : " + hazardDistance +"</span></div>",
                    className: this.beaconList.includes(readerDetail[reader].readerName) ? 'text-below-marker-red' : 'text-below-marker',
                })
            }).on('click', this.reader_position_hide.bind(this, "hide", readerDetail[reader].id)).addTo(this.map);
            const readerPosition = L.marker(readerPoints, {icon: this.beaconList.includes(readerDetail[reader].readerName) ? this.maps["icon3"] : this.maps["icon1"]});
            readerPosition.on('click', this.reader_link.bind(this, readerDetail[reader].readerName));

            readerPosition.addTo(this.map);            
            this.maps["reader_postion"][readerDetail[reader].id] = readerPosition;
            this.maps["reader_postion"][readerDetail[reader].id+"label"] = readerPositionLabel;            
        }
    }
}
reader_position_hide(type, id, data) {
    let reader_info = this.info["all_reader_id"][id];
    let index = null;
    if(this.multiReaderInfo.enabled) {
        index = id;
        if(data) {
            index = this.info['all_reader'].findIndex(val => val.id == id);
        }
        reader_info = this.info['all_reader'][index];
        id = this.info['all_reader'][index]['id'];
    }
    const value =  JSON.parse(reader_info.coordinate)
    
    let readerPoints = [value[1] * -100, value[0] * 100];
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
        readerPoints = value;
    }    
    if (this.maps["reader_postion"][id+"label"]) {
        this.map.removeLayer(this.maps["reader_postion"][id+"label"]);
        delete this.maps["reader_postion"][id+"label"];
    }
    if (type == "hide") {
        let hazardDistance = this.multiReaderInfo['HazardDistance'][reader_info.readerName];
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div><span style='font-size: 9px; font-weight: 800;'>Open</span><br>"+ "" + hazardDistance +"</div>",
                className: this.beaconList.includes(reader_info.readerName) ? 'text-below-marker-hide-red' : 'text-below-marker-hide',
                })
            }).on('click', this.reader_position_hide.bind(this, "open", reader_info.id)).addTo(this.map);
            this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
    } else {
        let hazardDistance = this.multiReaderInfo['HazardDistance'][reader_info.readerName];
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div>" + reader_info.readerName + " <br><span style='font-weight: 100;'>" + "HV : " + hazardDistance +"</span></div>",
                className: this.beaconList.includes(reader_info.readerName) ? 'text-below-marker-red' : 'text-below-marker',
            })
        }).on('click', this.reader_position_hide.bind(this, "hide", reader_info.id)).addTo(this.map);
        this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
    }
    let iconName = this.multiReaderInfo.enabled && this.multiReaderInfo.id == reader_info.id ? "icon1" : "icon2";
}
getLogicValue(i) {
    const value = i === 0 ? this.hazardActivity?.min?.value : (i !== 0 && this.dataSource.data?.length !== (i+1) ? 
    (Math.trunc((this.hazardActivity?.max?.value-(this.hazardActivity?.min?.value))/(this.dataSource.data?.length-2)) * i)+parseInt(this.hazardActivity?.min?.value) : 
    (this.dataSource.data?.length === (i+1) ? this.hazardActivity?.max?.value : ''));
    return value;
 }
 getLogicIntensValue(i) {
    const length = (this.dataSource.data?.length-2) / 2;
    if(this.dataSource.data?.length >= 9) {
        const value = i <= Math.trunc(length) ? Math.trunc((1999 - parseInt(this.hazardActivity?.min?.value)) / 4) * i : 
        i > Math.trunc(length) && i < this.dataSource.data?.length-1 ? (Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3) > 1000000 ?
        (i === 8 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3)) : '';
        return value;
    } else if(this.dataSource.data?.length <= 6) {
        const value = i <= 2 ? Math.trunc((1999 - parseInt(this.hazardActivity?.min?.value)) / 2) * i : 
        i > 2 && i < this.dataSource.data?.length-1 ? (Math.trunc((999999 - 2000) / 2) * (i-2) > 1000000 ?
        (i === 5 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / 2) * (i-2)) : '';
        return value;
    }
  }
  getLogicUltraValue(i) {
    const value = (Math.trunc((this.hazardActivity?.max?.value-(this.hazardActivity?.min?.value))/(this.dataSource.data?.length-1)) * i)+parseInt(this.hazardActivity?.min?.value);
    return value;
  }
  getAverageMidpoints(x1: number, y1: number, x2: number, y2: number, n: number, origin, hazardValue, kitDetails): { x: number, y: number, hazard : number }[] {
        const midpoints: { x: number, y: number, hazard : number }[] = [];
        this.position = {};
        for (let i = 0; i < n; i++) {
            const fraction = i / (n - 1);
            const midX = x1 + fraction * (x2 - x1);
            const midY = y1 + fraction * (y2 - y1);

            let distance = this.GetCoordinateDistance(origin, [midY, midX]);
            let detail = { x: Number(midX.toFixed(8)), y: Number(midY.toFixed(8)), hazard : Math.round(distance * hazardValue) }
            this.position[kitDetails[i]['identifyingValue']] = [detail['y'], detail['x']];
            midpoints.push(detail);
        }
        return midpoints;
    }
    bindKMLBeacon(kmlDetails) {
        this.isBeaconExist = false;
        kmlDetails['midPoints'].reverse();
        for(let i in this.info["all_reader"]) {
            this.info['all_reader'][i]['coordinate'] = "[" + kmlDetails['midPoints'][i]['y']+ ", " +kmlDetails['midPoints'][i]['x'] + "]";
            this.configValue['b_id'][i][1] = kmlDetails['midPoints'][i]['hazard'];
            this.beaconData[i]['hazardValue'] = kmlDetails['midPoints'][i]['hazard'];
            this.multiReaderInfo['HazardDistance'][this.info["all_reader"][i].readerName] = kmlDetails['midPoints'][i]['hazard'];
            this.beaconData[i]['coordinate'] = this.info['all_reader'][i]['coordinate'];
        }
        this.configValue['kmlDetails'] = kmlDetails
        this.dataSource = new MatTableDataSource<any>(this.beaconData);
        let tempData = this.dataSource.data? this.dataSource.data : [];
        this.dataSource.data = tempData.map(row => ({ ...row, isEditing: false , isEdited: false}));
        this.reader_place()
        this.checkStatus()
        this.isBeaconExist = true;
    }

  onFileSelect(input: HTMLInputElement): void {
    if(this.maps["floors"][this.floorId]['locationTypeId'] == 23) { 
            function formatBytes(bytes: number): string {
            const UNITS = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const factor = 1024;
            let index = 0;

            while (bytes >= factor) {
                bytes /= factor;
                index++;
            }
            return `${parseFloat(bytes.toFixed(2))} ${UNITS[index]}`;
            }
            const file = input.files[0];
            this.fileInfo = `${file.name} (${formatBytes(file.size)})`;
        }
    }
    bindKMLCoordinate(content) {
        if(this.maps.kmlPolygons.length)  {
            for(let i in this.maps.kmlPolygons) {
                try { this.maps.kmlPolygons[i].remove() } 
                catch(e) {}
            }
            this.maps.kmlPolygons = []
            this.kmlDetails = null;
        } else {
            this.kmlDetails = null;
        }
        let jsonValue = content;
        for(let i in jsonValue['features']) {
            let area = jsonValue['features'][i]
            if (area && area.geometry.type != "Point") {
                let poly = area.geometry.coordinates
                let polygonData = null;
                let color = area.properties.name.toLowerCase().includes('red') ? 'red' : 
                            area.properties.name.toLowerCase().includes('orange') ? 'orange' :
                            area.properties.name.toLowerCase().includes('yellow') ? 'yellow' : 'green';
                polygonData = L.polygon(poly, { color: color});
                polygonData.addTo(this.map)
                this.maps.kmlPolygons.push(polygonData)
                if(color == 'red') {
                    this.map.fitBounds(polygonData.getBounds());
                }
                if(color == 'red') {
                    let v1 = poly[0];
                    let v2 = poly[Math.round(poly.length/2 - 1)]
                    let distance:any = this.GetCoordinateDistance(v1, v2);
                    distance = Number(distance.toFixed(2));
                    this.kmlDetails = {
                        geoJson : jsonValue,
                        distance : distance,
                        source : poly[0],
                        destination : poly[Math.round(poly.length/2 - 1)],
                        hazardValue : this.configValue.max_value/distance
                    }
                    this.kmlDetails['midPoints'] = [];
                    polygonData.on('click', this.getKMLCoordinate.bind(this, this.locationId));
                    let origin = this.configValue.value_type == 'max' ? this.kmlDetails.destination : this.kmlDetails.source;
                    if(this.locationForm.controls['kitId'].value !== null) {
                        const kit = this.kitList.filter(x => x.id === this.locationForm.controls['kitId'].value);
                        if(kit.length) {
                            this.kmlDetails['kitDetails'] = kit[0]['groupMapping']
                            this.kmlDetails['midPoints'] = this.getAverageMidpoints(v1[1], v1[0], v2[1], v2[0], this.kmlDetails['kitDetails'].length, origin, this.kmlDetails.hazardValue, this.kmlDetails['kitDetails']);
                            this.bindKMLBeacon(this.kmlDetails)
                        }
                    }
                }
            }    
        }   
        
    }
    GetCoordinateDistance(p1, p2) {
        let distance = 0;
        if ((p1[1] == p2[1]) && (p1[0] == p2[0])) {
            return distance;
        }
        let r1 = Math.PI * p1[1]/180;
        let r2 = Math.PI * p2[1]/180;
        let t = p1[0] - p2[0];
        let rt = Math.PI * t/180;

        distance = Math.sin(r1) * Math.sin(r2) + Math.cos(r1) * Math.cos(r2) * Math.cos(rt);
        distance = distance > 1 ? 1 : distance;
        
        let res = Math.acos(distance);
        res = res * 180/Math.PI;
        res = res * 60 * 1.1515;

        res = res * 1.6093;
        res = res * 1000;
        return res;
    }

    onFileChange(evt) { 
        const files = evt.target.files;
        const allowed_types = ['application/vnd.google-earth.kml+xml'];
        if (files.length === 0 || !allowed_types.includes(files[0].type) && !files[0].name.endsWith('.kml')) {
          this.toastr.warning('Warning', `Please choose a valid KML file format!`);
          return;
        }
    
        const file = files[0];
        const reader = new FileReader();
    
        reader.onloadend = (readerEvt) => {
          const kmlData = readerEvt.target?.result as string;
          this.convertFileToGeoJSON(kmlData);
        };
    
        reader.readAsText(file);
    }
      convertFileToGeoJSON(kmldata){
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmldata, "application/xml");
        const features = [];
        const placemarks = Array.from(xmlDoc.getElementsByTagName("Placemark"));
        for (let placemark of placemarks) {
            const name = placemark.getElementsByTagName("name")[0]?.textContent || '';
            const coords = placemark.getElementsByTagName("coordinates")[0]?.textContent.trim() || '';
            if (coords) {
                const coordinates = coords.split(" ").map(coord => {
                    const [lng, lat] = coord.split(",").map(Number);
                    return [lat, lng]; 
                });
                const geometryType = coordinates.length > 1 ? "MultiPoint" : "Point";
                const geometry = {
                    type: geometryType,
                    coordinates: geometryType === "MultiPoint" ? coordinates : coordinates[0] 
                };
    
                const feature = {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        name: name
                    }
                };
    
                features.push(feature);
            }
        }
    
        const geojson = {
            type: "FeatureCollection",
            features: features
        };
        this.bindKMLCoordinate(geojson);
    }
    setEditedValue(row: any){
        const val = parseInt(row.identifyingValue);
        if(this.configValue.hasOwnProperty('kmlDetails') && this.configValue['kmlDetails'] !== null) {
            this.editedValue.setValue(row.hazardValue);
        } else {
            this.editedValue.setValue(this['index' + val]);
        }
        this.editedRow = row.identifyingValue;
    }
    saveRow(row: any) {
    if(this.editedValue.value){
        row['updatedValue'] = this.editedValue.value;
        row.isEdited = true;
        const val = parseInt(row.identifyingValue);
        for(let i = 0; i < this.activityData.configValue?.b_id.length; i++) {
            const type = this.locationForm.controls['hazardType'].value;
            if(this.configValue.hasOwnProperty('kmlDetails') && this.configValue['kmlDetails'] !== null) {
                this.activityData['configValue']['b_id'][i][1] = type?.substring(0,4) === 'HT-G' ? this.activityData["configValue"]['b_id'][i][1] * 10 : type?.substring(0,4) === 'HT-IM' ? this.activityData["configValue"]['b_id'][i][1] * 100 : this.activityData["configValue"]['b_id'][i][1];
                for(let j=0; j<this.kmlDetails['kitDetails']?.length; j++) {
                    if(this.kmlDetails['kitDetails'][j]?.identifyingValue === row.identifyingValue) {
                        this.kmlDetails['kitDetails'][j]['hazardValue'] = this.editedValue.value;
                        this.kmlDetails['midPoints'][j]['hazard'] = this.editedValue.value;
                    }
                }
            }
            if(this.activityData.configValue?.b_id[i][0] === val) {
                this.activityData['configValue']['b_id'][i][1] = type?.substring(0,4) === 'HT-G' ? this.editedValue.value * 10 : type?.substring(0,4) === 'HT-IM' ? this.editedValue.value * 100 : this.editedValue.value;
                this['index' + val] = this.editedValue.value;
                this.multiReaderInfo['HazardDistance'][val] = this['index' + val];
            }
        }
        this.editConfigValue = true;
        this.openActivities = false; 
        this.reader_place();
        this.checkStatus();
    }
    row.isEditing = false;
    }
    onTypeChange(option){
        this.selectedType = option.value
    }
 
    addMarker(e) {
        if (this.selectedMarker != 'beacon' && this.selectedType === 'alohaModel') {
            let marker;
            if (!this.sourcePoint) {
                this.sourcePoint = new L.marker(e.latlng, {icon: this.maps["icon3"],draggable: true});
                marker = this.sourcePoint;
                marker.type = 'source';
            } else if (!this.destinationPoint) {
                this.destinationPoint = new L.marker(e.latlng, {icon: this.maps["icon1"],draggable: true});
                marker = this.destinationPoint;
                marker.type = 'destination'; 
            } else {
                this.updateMarkerPosition(e.latlng);
                return;
            }
            marker.on('click', () => this.activateMarker(marker)); 
            marker.on('dragend', () => this.updateMarker(marker));  
            marker.addTo(this.map);
        }
    }
    
    updateMarkerPosition(newCoordinates) {
        if (this.activeMarker) {
            this.activeMarker.setLatLng(newCoordinates);
            this.activeMarker.setIcon(this.activeMarker.type === 'source' ? this.maps['icon3'] : this.maps['icon1']);
            this.activeMarker = null;
            this.drawEllipses(this.sourcePoint._latlng, this.destinationPoint._latlng);
        }
    }
    
    activateMarker(marker) {
        this.selectedMarker = marker.type;
        this.activeMarker = marker;
        marker.setIcon(this.maps['icon2']);
    }
    
    updateMarker(marker){
        if(marker.type === 'source') {
            this.sourcePoint = marker;
        }else if (marker.type === 'destination') {
            this.destinationPoint = marker;
        }
        this.drawEllipses(this.sourcePoint._latlng, this.destinationPoint._latlng);
    }
    
    drawEllipses(point1, point2) {
        this.sourcePoint.dragging.disable();
        this.destinationPoint.dragging.disable();
        if (this.ellipses != null) { // check for existing ellipses and remove old ellipses in map  and update ellipses with updated coordinates
            for (let i = 0; i < this.ellipses.length; i++) {
                this.map.removeLayer(this.ellipses[i].polygon);
            }
        }
         this.ellipses = [];
        let lat1,lng1,lat2,lng2
        lat1 = point1.lat,  lng1 = point1.lng
        lat2 = point2.lat,  lng2 = point2.lng
        const toRadians = (degrees) => (degrees * Math.PI) / 180; // degress to radian 
        const toDegrees = (radians) => (radians * 180) / Math.PI;  // radian to degree
        // Earth's radius in km
        const R = 6371;
        // Calculate distance using haversine formula
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // distance between 2 points in metres
        const semiMajorAxis = distance * 0.5 ; // half of distance
        const semiMinorAxis = semiMajorAxis * 0.3; // 0.3 of semiMajor axis
        const rotationAngle = Math.atan2(lng2 - lng1, lat2 - lat1);//directionAngle
        const drawEllipse = (semiMajor, semiMinor, color) => {
            const centerLat = lat1 + (semiMajor * Math.cos(rotationAngle)) / R * (180 / Math.PI);
            const centerLng = lng1 + (semiMajor * Math.sin(rotationAngle)) / (R * Math.cos(toRadians(lat1))) * (180 / Math.PI);
            const ellipsePoints = [];
            const ellipseCount = 36;  // Number of points to draw ellipse
            for (let i = 0; i < ellipseCount; i++) {
                const ellipseAngle = (i * 2 * Math.PI) / ellipseCount; // rotation angle for each  points
                const x = semiMajor * Math.cos(ellipseAngle);
                const y = semiMinor * Math.sin(ellipseAngle);
                // Apply the rotation to the ellipse points
                const rotatedX = x * Math.cos(rotationAngle) - y * Math.sin(rotationAngle);
                const rotatedY = x * Math.sin(rotationAngle) + y * Math.cos(rotationAngle);
                const lat = centerLat + rotatedX / R * (180 / Math.PI);
                const lng = centerLng + rotatedY / (R * Math.cos(toRadians(centerLat))) * (180 / Math.PI);
                ellipsePoints.push([lat, lng]);
            }
            
            const ellipsePolygon = L.polygon(ellipsePoints, {
                color: color,
                fillOpacity: 0, 
                interactive: color == 'red'
            });
            ellipsePolygon.addTo(this.map);
            if(color == 'red') {
                ellipsePolygon.on('click', this.getKMLCoordinate.bind(this, this.locationId));
            }
            const ellipseData = {
                color: color,
                points: ellipsePoints,
                polygon: ellipsePolygon,
            };
            this.ellipses.push(ellipseData);
        };
        drawEllipse(semiMajorAxis * 0.3, semiMinorAxis * 0.3, 'red');
        drawEllipse(semiMajorAxis * 0.7, semiMinorAxis * 0.7, 'orange');
        drawEllipse(semiMajorAxis, semiMinorAxis, 'yellow');
        this.EllipseDataToGeoJSON({
            ellipse: this.ellipses,
            sourcePoint: point1, 
            destinationPoint: point2, 
        });
    }   

    EllipseDataToGeoJSON(data) {
        const features = data.ellipse.map(ellipse => {
            const { points, color } = ellipse;
            const coordinates = [...points, points[0]];
    
            return {
                type: "Feature",
                properties: { color },
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates],
                },
            };
        });
    
        const geoJSON = {
            type: "FeatureCollection",
            features,
            sourcePoint:data.sourcePoint,
            destinationPoint:data.destinationPoint
        };
        this.configValue['aloho'] = geoJSON;// store geojsondata of ellipsis
    }
    fixClick() {
        console.log('')
    }
}

