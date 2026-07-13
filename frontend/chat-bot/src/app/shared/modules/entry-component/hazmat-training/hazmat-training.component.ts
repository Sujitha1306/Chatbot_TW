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

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../services';
import { FormBuilder,  FormGroup,  Validators } from '@angular/forms';
import { CreateActivities, EditActivities } from './hazmat-training.model';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-hazmat-training',
  templateUrl: './hazmat-training.component.html',
  styleUrls: ['./hazmat-training.component.scss']
})
export class HazmatTrainingComponent implements OnInit {
  mapData = {};
  isLinear = false;
  activitiesForm: FormGroup;
  selectedTabIndex = 0;
  public meters;
  public mrssi: number;
  height: number;
  routineList: any=[];
  statusList: any=[];
  hazardTypeList: any=[];
  minExceed = false;
  maxExceed = false;
  minOxygenExceed = false;
  maxOxygenExceed = false;
  isOxygenMinMax = false;
  alarmExceed = false;
  alarmLevel: any;
  alarmLevelExceed = false;
  hazardList = [{code: 'min', value:'Min'}, {code: 'max', value:'Max'}];
  enableCreate = false;
  mapEvent: any;
  beaconList: any=[];
  public createActivities: CreateActivities;
  public editActivities: EditActivities;
  hazardConfig = null;
  step = 1;
  editConfigValue = false;
  rExceed = false;
  aExceed = false;
  yExceed = false;
  eExceed = false;
  valRAYE: {};
  roleList: any[];
  constructor(
    public form: FormBuilder,
    public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private readonly commonService: CommonService, 
    private readonly configurationService: ConfigurationService, 
    public thisDialogRef: MatDialogRef<HazmatTrainingComponent>, 
    public toastr: AppToastService) {
  }
  ngOnInit(): void {
    this.buildForm();
    if(this.data.configValue?.hazard_type) {
      this.getConfigValidation(this.data.configValue?.hazard_type);
    }
    this.commonService.getAppTerms('RoutineType,RecipientType,Gender,Status,HazardType,ActivitySubType').subscribe(res => {
      this.routineList = res.results.filter(resFilter => resFilter.groupName === 'RoutineType');
      this.statusList = res.results.filter(resFilter => resFilter.code === 'ST-AT' || resFilter.code === 'ST-IA');
      this.hazardTypeList = res.results.filter(resFilter => resFilter.groupName === 'HazardType');
    });
    this.configurationService.getRecipientName('', 'RT-RO').subscribe(res => {
      this.roleList = res.results;
    });
  }
  tabChanged(event) {
    this.selectedTabIndex = event.index;
  }
  selectTab(index: number): void {
    this.selectedTabIndex = index;
    this.valRAYE = {"r": this.activitiesForm.controls['r']?.value !== null && this.activitiesForm.controls['r']?.value !== '' ? parseInt(this.activitiesForm.controls['r']?.value) : null,
      "a": this.activitiesForm.controls['a']?.value !== null && this.activitiesForm.controls['a']?.value !== '' ? parseInt(this.activitiesForm.controls['a']?.value) : null,
      "y": this.activitiesForm.controls['y']?.value !== null && this.activitiesForm.controls['y']?.value !== '' ? parseInt(this.activitiesForm.controls['y']?.value) : null,
      "e": this.activitiesForm.controls['e']?.value !== null && this.activitiesForm.controls['e']?.value !== '' ? parseInt(this.activitiesForm.controls['e']?.value) : null}
  }
  buildForm() {
    this.activitiesForm = this.form.group({
      routineTypeId: ['ROU-TSK'],
      name: [this.data.name ? this.data.name : null, [Validators.required]],
      isActive: [this.data.hasOwnProperty('isActive') && this.data.isActive !== null  ? (this.data.isActive ? 'ST-AT' : 'ST-IA') : 'ST-AT'],
      activityCategoryId: ['AC-HAZ'],
      hazardType: [this.data.configValue ? this.data.configValue.hazard_type : null,[Validators.required]],
      min:[this.data.configValue ? this.data.configValue.min_value : null],
      max:[this.data.configValue ? this.data.configValue.max_value : null],
      hazard:[this.data.configValue ? this.data.configValue.value_type : null],
      units:[this.data.configValue ? this.data.configValue.units : null],
      alarmLevel: [this.data.configValue ? this.data.configValue.level : null],
      rssiRange: [this.data.configValue ? this.data.configValue.rssi : 250],
      mrssiRange: [this.data.configValue ? this.data.configValue.mrssi : 500],
      configValue: [this.data.configValue ? JSON.stringify(this.data.configValue, undefined, 4) : null],
      minOxygen: [this.data.configValue ? this.data.configValue.minOxygen_value : null, [Validators.min(10),Validators.max(20)]],
      maxOxygen: [this.data.configValue ? this.data.configValue.maxOxygen_value : null, [Validators.min(11),Validators.max(21)]],
      roleIds: [this.data.roleIds ? this.data.roleIds : null, [Validators.required]],
      r: [this.data.configValue ? this.data.configValue.r : null, Validators.pattern('^[0-9-+()]*$')],
      a: [this.data.configValue ? this.data.configValue.a : null, Validators.pattern('^[0-9-+()]*$')],
      y: [this.data.configValue ? this.data.configValue.y : null, Validators.pattern('^[0-9-+()]*$')],
      e: [this.data.configValue ? this.data.configValue.e : null, Validators.pattern('^[0-9-+()]*$')]
    });
    this.centimeterChanged()
  }
  centimeterChanged() {
    this.meters = this.activitiesForm.value.rssiRange / 100;
    this.mrssi = this.activitiesForm.value.mrssiRange / 100;
  }
  minMaxValidation(type) {
    if (type === 'min') {
      if (parseInt(this.activitiesForm.get('min').value) >= parseInt(this.activitiesForm.get('max').value)) {
        this.minExceed = true;
        this.maxExceed = false;
      }
    } else {
    if (parseInt(this.activitiesForm.get('min').value) >= parseInt(this.activitiesForm.get('max').value)) {
        this.minExceed = false;
        this.maxExceed = true;
      }
    }
    if(this.activitiesForm.controls['alarmLevel'].value) {
      const value = this.activitiesForm.controls['alarmLevel'].value;
      this.validateAlarm(value);
    }
  }
  minMaxOxygenValidation(type) {
    if (type === 'minOxygen') {
      if (parseInt(this.activitiesForm.get('minOxygen').value) >= parseInt(this.activitiesForm.get('maxOxygen').value)) {
        this.minOxygenExceed = true;
        this.maxOxygenExceed = false;
      }
    } else {
    if (parseInt(this.activitiesForm.get('minOxygen').value) >= parseInt(this.activitiesForm.get('maxOxygen').value)) {
        this.minOxygenExceed = false;
        this.maxOxygenExceed = true;
      }
    }
  }
  validateAlarm(value) {
    const level = value.split(',');
    this.alarmLevel = level;
    if(this.alarmLevel && ((parseInt(this.alarmLevel[0]) > this.activitiesForm.controls['max'].value ||
    parseInt(this.alarmLevel[1]) > this.activitiesForm.controls['max'].value ||
    parseInt(this.alarmLevel[2]) > this.activitiesForm.controls['max'].value ||
    parseInt(this.alarmLevel[3]) > this.activitiesForm.controls['max'].value) ||
    (parseInt(this.alarmLevel[0]) < this.activitiesForm.controls['min'].value ||
      parseInt(this.alarmLevel[1]) < this.activitiesForm.controls['min'].value ||
      parseInt(this.alarmLevel[2]) < this.activitiesForm.controls['min'].value ||
      parseInt(this.alarmLevel[3]) < this.activitiesForm.controls['min'].value))) {
      this.alarmLevelExceed = true;
    } else {
      this.alarmLevelExceed = false;
    }
    if(level.length > 4) {
      this.alarmExceed = true;
    } else {
      this.alarmExceed = false;
    }
  }
  validate_r_a_y_e(value, key) {
    if(value && value > this.activitiesForm.controls['max'].value ||
    value < this.activitiesForm.controls[key].value) {
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
  }
  getConfigValidation(code) {
    if(code === "HT-G3" || code === "HT-G1" || code === "HT-G4" || code === "HT-G2") {
      this.isOxygenMinMax = true;
      this.activitiesForm.get('minOxygen').setValue(10);
      this.activitiesForm.get('minOxygen').updateValueAndValidity();
      this.activitiesForm.get('maxOxygen').setValue(21);
      this.activitiesForm.get('maxOxygen').updateValueAndValidity();
    } else {
      this.isOxygenMinMax = false;
      this.activitiesForm.get('minOxygen').setValue(null);
      this.activitiesForm.get('minOxygen').updateValueAndValidity();
      this.activitiesForm.get('maxOxygen').setValue(null);
      this.activitiesForm.get('maxOxygen').updateValueAndValidity();
    }
    this.commonService.getConfigFile('hazard-config').subscribe(res => {
      if(res.statusCode == 1) {
        this.hazardConfig = res.results['contentObject'][code];
        console.log(this.hazardConfig)
        if(this.hazardConfig && this.hazardConfig?.length !== 0) {
          this.hazardConfig.forEach(x => {
            this.activitiesForm.get(x.field).setValue(x.defaultValue);
            this[x.field + 'Mandatory'] = x.mandatory;
            this.activitiesForm.get(x.field).setValidators(x.mandatory === true ? Validators.required : null);
            if(x.min !== null) {
              this[x.field + 'Min'] = x.min;
              this.activitiesForm.get(x.field).setValidators(Validators.min(x.min));
            }
            if(x.max !== null) {
              this[x.field + 'Max'] = x.max;
              this.activitiesForm.get(x.field).setValidators(Validators.max(x.max));
            }
            if(x.disabled === true) {
              this.activitiesForm.get(x.field).disable();
            } else {
              this.activitiesForm.get(x.field).enable();
            }
            this.activitiesForm.get(x.field).updateValueAndValidity();
          });
        }
      }
    });
  }
  onWindowResized(size) {
    this.height = size - 50;
  }
  createStatus(event) {
    this.editConfigValue = event.editConfigValue;
    this.mapEvent = event;
    if(event?.enableCreate) {
      this.enableCreate = true;
    } else {
      this.enableCreate = false;
    }
    if(event?.openActivities) {
      this.selectTab(0);
    }
    if(event?.beaconList.length !== 0){
      this.beaconList = [];
      let level = this.activitiesForm.controls['alarmLevel'].value.split(',');
      let index = null;
      let val = null;
      let oxyVal = null;
      for(let i = 0; i < event?.beaconList.length; i++) {
        if(this.mapEvent?.hazardType?.substring(0,5) === 'HT-AP') {
          if(this.activitiesForm.controls.max.value == 2) {  // FOR AP4C CH 
            index = i%2 == 0 ? 1 : 2;
          }
          if(this.activitiesForm.controls.max.value != 2) {
            index = 6 >= (i+1) && 5 >= (event?.beaconList.length / 2) ? i+1 : (i+1) > 6 && event?.beaconList.length > 6 && 5 >= (event?.beaconList.length / 2) ? 6-((i+1)-6) :
            (event?.beaconList.length / 2) > 5 && Math.round(event?.beaconList.length / 2) >= (i+1) ? 
            i+1 : (event?.beaconList.length / 2) > 5 && (i+1) > Math.round(event?.beaconList.length / 2) ? (Math.round(event?.beaconList.length / 2) - ((i+1) - Math.round(event?.beaconList.length / 2))) === 0 ? 1 :
            Math.round(event?.beaconList.length / 2) - ((i+1) - Math.round(event?.beaconList.length / 2)) : ''
          }
        } else if(this.mapEvent?.hazardType?.substring(0,4) === 'HT-G') {
          index = i === 0 ? parseInt(this.activitiesForm.controls['min'].value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          ((Math.trunc((parseInt(this.activitiesForm.controls['max'].value)-parseInt(this.activitiesForm.controls['min'].value))/(event?.beaconList.length-2)) * i)+parseInt(this.activitiesForm.controls['min'].value)) : (event?.beaconList.length === (i+1) ? 
          parseInt(this.activitiesForm.controls['max'].value) : ''));
          oxyVal = i === 0 ? parseInt(this.activitiesForm.controls['maxOxygen'].value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          Math.trunc(parseInt(this.activitiesForm.controls['maxOxygen'].value)-(((parseInt(this.activitiesForm.controls['maxOxygen'].value)-parseInt(this.activitiesForm.controls['minOxygen'].value))/(event?.beaconList.length-2)) * i)) : (event?.beaconList.length === (i+1) ? 
          parseInt(this.activitiesForm.controls['minOxygen'].value) : ''));
        } else if(this.mapEvent?.hazardType?.substring(0,5) === 'HT-IM') {
          index = event?.beaconList.length === (i+1) ? (parseInt(this.activitiesForm.controls['max'].value)) : this.getLogicIntensValue(i, event);
        } else if(this.mapEvent?.hazardType?.substring(0,5) === 'HT-UR') {
          index = i === 0 ? parseInt(this.activitiesForm.controls['min'].value) : (i !== 0 && event?.beaconList.length !== (i+1) ? 
          (Math.trunc((this.activitiesForm.controls['max'].value-(this.activitiesForm.controls['min'].value))/(event?.beaconList.length-1)) * i)+parseInt(this.activitiesForm.controls['min'].value) : (event?.beaconList.length === (i+1) ? 
          parseInt(this.activitiesForm.controls['max'].value) : ''));
      }
        if(level?.length !== 0) {
          for(let j = 0; j < level?.length; j++) {
            if(parseInt(level[j]) === index) {
              const alarm = 'L' + (j+1);
              if(this.activitiesForm.controls.max.value != 2) { // To avoid AP4C CH hazard type level 
                this[event?.beaconList[i].identifyingValue + 'level'] = alarm;
              }
            }
          }
        }
        if(this[event?.beaconList[i].identifyingValue + 'level']) {
          if(this.mapEvent?.hazardType?.substring(0,4) === 'HT-G') {
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 10, this[event?.beaconList[i].identifyingValue + 'level'], oxyVal * 10]);
          } else {
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index, this[event?.beaconList[i].identifyingValue + 'level']]);
          }
        } else {
          if(this.mapEvent?.hazardType?.substring(0,4) === 'HT-G') {
            this.beaconList.push([parseInt(event?.beaconList[i].identifyingValue), index * 10, oxyVal * 10]);
          } else if(this.mapEvent?.hazardType?.substring(0,5) === 'HT-IM') {
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
    this.getMapData();
  }
  getLogicIntensValue(i, event) {
    const length = (event?.beaconList?.length-2) / 2;
    if(event?.beaconList?.length >= 9) {
        const value = i <= Math.trunc(length) ? Math.trunc((1999 - (parseInt(this.activitiesForm.controls['min'].value))) / 4) * i : 
        i > Math.trunc(length) && i < event?.beaconList?.length-1 ? (Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3) > 1000000 ?
        (i === 8 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / Math.trunc(length)) * (i-3)) : '';
        return value;
    } else if(event?.beaconList?.length <= 6) {
        const value = i <= 2 ? Math.trunc((1999 - (parseInt(this.activitiesForm.controls['min'].value))) / 2) * i : 
        i > 2 && i < event?.beaconList?.length-1 ? (Math.trunc((999999 - 2000) / 2) * (i-2) > 1000000 ?
        (i === 5 ? 1000000 - 2 : 1000000 - 1) : Math.trunc((999999 - 2000) / 2) * (i-2)) : '';
        return value;
    }
  }
  getMapData() {
    this.mapData = {
      "b_id": this.beaconList,
      "b_pos" : this.mapEvent?.position?.length !== 0 ? this.mapEvent?.position : [],
      "hazard_id": this.mapEvent?.hazard,
      "hazard_type": this.mapEvent?.hazardType,
      "locationId": this.mapEvent?.locationId,
      "locationName": this.mapEvent?.locationName,
      "floorId": this.mapEvent?.floorId,
      "kitId": [this.mapEvent?.kitId],
      "hazardCount": this.mapEvent?.hazardCount,
      "positionType": this.mapEvent?.positionType == true ? 'auto' : 'manual',
      "max_value": parseInt(this.activitiesForm.controls['max'].value),
      "min_value": parseInt(this.activitiesForm.controls['min'].value),
      "minOxygen_value": parseInt(this.activitiesForm.controls['minOxygen'].value),
      "maxOxygen_value": parseInt(this.activitiesForm.controls['maxOxygen'].value),
      "value_type": this.activitiesForm.controls['hazard'].value,
      "rssi": this.activitiesForm.controls['rssiRange'].value.toString(),
      "mrssi": this.activitiesForm.controls['mrssiRange'].value.toString(),
      "level": this.activitiesForm.controls['alarmLevel'].value,
      "units": this.activitiesForm.controls['units'].value,
      "r": parseInt(this.activitiesForm.controls['r'].value),
      "a": parseInt(this.activitiesForm.controls['a'].value),
      "y": parseInt(this.activitiesForm.controls['y'].value),
      "e": parseInt(this.activitiesForm.controls['e'].value)
    }
  }
  updatemrssi(type?: string) {
    const mapData = {
      "b_id": this.data?.configValue['b_id'],
      "b_pos" : this.data?.configValue['b_pos'],
      "hazard_id": this.data?.configValue['hazard_id'],
      "hazard_type": this.data?.configValue['hazard_type'],
      "locationId": this.data?.configValue['locationId'],
      "locationName": this.data?.configValue['locationName'],
      "floorId": this.data?.configValue['floorId'],
      "kitId": [this.data?.configValue['kitId']],
      "hazardCount": this.data?.configValue['hazardCount'],
      "positionType": this.data?.configValue['positionType'],
      "max_value": parseInt(this.activitiesForm.controls['max'].value),
      "min_value": parseInt(this.activitiesForm.controls['min'].value),
      "minOxygen_value": parseInt(this.activitiesForm.controls['minOxygen'].value),
      "maxOxygen_value": parseInt(this.activitiesForm.controls['maxOxygen'].value),
      "value_type": this.activitiesForm.controls['hazard'].value,
      "rssi": this.activitiesForm.controls['rssiRange'].value.toString(),
      "mrssi": this.activitiesForm.controls['mrssiRange'].value.toString(),
      "level": this.activitiesForm.controls['alarmLevel'].value,
      "units": this.activitiesForm.controls['units'].value,
      "r": parseInt(this.activitiesForm.controls['r'].value),
      "a": parseInt(this.activitiesForm.controls['a'].value),
      "y": parseInt(this.activitiesForm.controls['y'].value),
      "e": parseInt(this.activitiesForm.controls['e'].value)
    }
    this.editActivities = new EditActivities(null, null, null, null,null, null, null);
    if(type !== 'duplicate') {
     this.editActivities.id = this.data.id;
     this.editActivities.name = this.activitiesForm.controls['name'].value;
    } else {
    this.editActivities.name = this.activitiesForm.controls['name'].value + ' (copy)';
    }
    this.editActivities.routineTypeId = this.activitiesForm.controls['routineTypeId'].value;
    if (this.activitiesForm.controls['isActive'].value == 'ST-AT') {
    this.editActivities.isActive = true;
    } else {
    this.editActivities.isActive = false;
    }
    this.editActivities.activityCategoryId = this.activitiesForm.controls['activityCategoryId'].value; 
    this.editActivities.configValue =  JSON.parse(JSON.stringify(mapData));     
    console.log(this.editActivities);
    if(type === 'duplicate') {
     this.configurationService.saveActivities(this.editActivities).subscribe(res => {
       if (res.statusCode === 1) {
         this.toastr.success('Success', `${res.message}`);
         this.thisDialogRef.close('confirm');
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    } else {
     this.configurationService.updateActivities(this.editActivities).subscribe(result => {
       if (result.statusCode === 1) {
         this.toastr.success('Success', `${result.message}`);
         this.thisDialogRef.close({mrssi: this.mrssi, acivityUpdatedData: this.editActivities});
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    }
  }
  createConfig() {
    this.getMapData();
    if(this.editConfigValue){
      this.mapData['b_id'] = this.data?.configValue['b_id'];
    }
    this.createActivities = new CreateActivities(null, null, null,null, null, null, null);
    this.createActivities.name = this.activitiesForm.controls['name'].value;
      if (this.activitiesForm.controls['isActive'].value == 'ST-AT') {
      this.createActivities.isActive = true;
      } else {
      this.createActivities.isActive = false;
      }
    this.createActivities.routineTypeId = this.activitiesForm.controls['routineTypeId'].value; 
    this.createActivities.activityCategoryId = 'TAC-AHAZ';
    this.createActivities.activitySubTypeId = 'AST-RQ';
    this.createActivities.roleIds = this.activitiesForm.controls['roleIds'].value;
    this.createActivities.configValue = JSON.parse(JSON.stringify(this.mapData));

    console.log(this.createActivities);
    this.configurationService.saveActivities(this.createActivities).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  updateConfig(type?: string) {
    this.getMapData();
    if(this.editConfigValue){
      this.mapData['b_id'] = this.data?.configValue['b_id'];
    }
    this.editActivities = new EditActivities(null, null, null, null,null, null, null, null);
    if(type !== 'duplicate') {
     this.editActivities.id = this.data.id;
     this.editActivities.name = this.activitiesForm.controls['name'].value;
    } else {
    this.editActivities.name = this.activitiesForm.controls['name'].value + ' (copy)';
    }
    this.editActivities.routineTypeId = this.activitiesForm.controls['routineTypeId'].value;
    if (this.activitiesForm.controls['isActive'].value == 'ST-AT') {
    this.editActivities.isActive = true;
    } else {
    this.editActivities.isActive = false;
    }
    this.editActivities.configValue =  JSON.parse(JSON.stringify(this.mapData));     
    this.editActivities.activityCategoryId = 'TAC-AHAZ';
    this.editActivities.activitySubTypeId = 'AST-RQ';
    this.editActivities.roleIds = this.activitiesForm.controls['roleIds'].value;
    console.log(this.editActivities);
    if(type === 'duplicate') {
     this.configurationService.saveActivities(this.editActivities).subscribe(res => {
       if (res.statusCode === 1) {
         this.toastr.success('Success', `${res.message}`);
         this.thisDialogRef.close('confirm');
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    } else {
     this.configurationService.updateActivities(this.editActivities).subscribe(result => {
       if (result.statusCode === 1) {
         this.toastr.success('Success', `${result.message}`);
         this.thisDialogRef.close('confirm');
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    }
  }
  fixClick() {
    console.log('')
  }
}

