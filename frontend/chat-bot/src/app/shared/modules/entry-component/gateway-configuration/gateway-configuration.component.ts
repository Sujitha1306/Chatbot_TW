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
import { FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../services';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-gateway-configuration',
  templateUrl: './gateway-configuration.component.html',
  styleUrls: ['./gateway-configuration.component.scss']
})
export class GatewayConfigurationComponent implements OnInit {
  inputFields = [];
  configData: any = [];
  masterValue: any=[];
  configValue: any=[];
  configField: any=[];
  masterData: any=[];
  public configForm: any = FormGroup;
  config: any;
  configInput: {};
  facilityId = localStorage.getItem(btoa('facilityId'));
  invalidJson = false;
  invalidArray = false;
  isMultiple = false;
  appTermList: any=[];
  contentHeight: number;
  id = null;
  selectedData = null;
  configDataValue = null;
  configJson = null;
  isDisable = true;
  configLength = null;
  facilityList: any=[];
  locationId = null;
  locationListItems: any = [];
  locationDetails: any =[];
  locationIdEnabled = false;
  requireLocationMatchVal: any=[];
  editLocation = false;
  SelectedFacilityId = null;

  constructor( public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService) {}

  ngOnInit(): void {
    this.getAllConfig(this.data);
  }

  onWindowResized(size) {
    this.contentHeight = size - 160;
  }

  getAllConfig(data, clickedData?: any){
    this.configurationServices.getAllgatewayConfig(data.configType, data.masterIdentifyingId, data.identifyingType, data.groupTypeId).subscribe(res =>{
      if (res.statusCode === 1) {
        this.masterValue = JSON.parse(res.results[0]?.configValue);
        this.selectedData = clickedData || this.masterValue[0];
        if(this.masterValue) {
          this.configurationServices.getAllgatewayConfig(data.configType, data.identifyingId, data.identifyingType, data.groupConfigId).subscribe(res =>{
            if(res.results?.length !== 0) {
              this.configData = res.results[0];
              this.configJson = Object.keys(JSON.parse(this.configData?.configValue));
              this.triggerAction(this.selectedData);
            } else {
              this.configJson = null;
              this.triggerAction(this.selectedData);
            }
          });
        }
      } else {
        this.thisDialogRef.close('confirm');
        this.toastr.error('Error', `${res.message}`);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });      
  }

  triggerAction(value) {
    this.isMultiple = false;
    this.selectedData = null;

    if (!value) return;

    this.selectedData = value;
    this.masterData = value;
    this.configField = value?.input;
    this.config = value?.config;
    this.isDisable = value?.hasOwnProperty('is_multiple') ? value?.is_multiple : true;

    this.buildForm();

    if (this.masterData?.type !== "2") return;

    const data = value?.config;

    if (this.hasData(data)) {
      this.handleConfigDataWithData(data);
    } else {
      this.handleConfigDataWithoutData();
    }

    if (this.masterData?.type == 2 && this.masterData?.multiple) {
      this.isMultiple = true;
    }
  }

  hasData(data) {
    return data?.length !== 0 && Object.keys(data)?.length !== 0;
  }

  handleConfigDataWithData(data) {
    this.removeInputs(0, null);

    if (this.configData?.length !== 0) {
      this.setConfigValueFromConfigData();
    }

    if (this.configValue?.length !== 0) {
      this.pushInputsFromConfigValue();
    } else {
      this.pushInputsFromData(data);
    }
  }

  handleConfigDataWithoutData() {
    if (this.configData?.length !== 0) {
      this.setConfigValueFromConfigData();
    }

    if (this.configValue?.length !== 0) {
      this.removeInputs(0, null);
      this.pushInputsFromConfigValue();
    }
  }

  setConfigValueFromConfigData() {
    this.id = this.configData.id;
    this.configDataValue = this.configData?.configValue;
    let config = JSON.parse(this.configData?.configValue);

    if (Object.keys(config).indexOf(this.masterData?.id) > -1) {
      this.configValue = config?.[this.masterData?.id];
    }
  }

  pushInputsFromConfigValue() {
    this.configLength = this.configValue?.length;
    for (let i = 0; i < this.configValue?.length; i++) {
      this.config = this.configValue[i];
      const control = <FormArray>this.configForm.controls['inputList'];
      control.push(this.editInputs(i));
    }
  }

  pushInputsFromData(data) {
    for (let i = 0; i < data.length; i++) {
      this.config = data[i];
      const control = <FormArray>this.configForm.controls['inputList'];
      control.push(this.editInputs(i));
    }
  }

  buildForm() {
    this.configForm = this.form.group({
      inputList: this.form.array([this.editInputs(0)]),
    });
    console.log(this.configForm)
  }

  editInputs(i) {
    this.configValue = [];
    const form = this.form.group({});
    let value = null;

    this.initializeConfigValue();

    this.configField.forEach(field => {
      this.handleFieldAsyncData(field);

      value = this.getFieldValue(field);

      const control = field?.type === 'DDL' || field?.type === 'DML' 
        ? this.form.control(value, [this.requireLocationMatch.bind(this)])
        : this.form.control(value);

      if(field?.type === 'DML') {
        this.getDisplayNames(i, field?.id)
      }
      form.addControl(field.id, control);
    });

    return form;
  }

  checkLocationName(id, i, event, fieldId) {
    if (!this['locations' + i]) {
      this['locations' + i] = [];
    }

    const arrays = this.configForm.get('inputList') as FormArray;

    if (event.checked) {
      if (!this['locations' + i].includes(id)) {
        this['locations' + i].push(id);
      }
    } else {
      this['locations' + i] =
        this['locations' + i].filter(x => x !== id);
    }

    // ONLY IDs stored
    arrays.at(i).patchValue({
      [fieldId]: this['locations' + i]
    });
  }

  preventString(event: any, i: number, fieldId: string) {
    const value = event.target.value;

    // if user typing → prevent string from overriding IDs
    if (typeof value === 'string') {
      const control = (this.configForm.get('inputList') as FormArray).at(i);

      const existing = control.value[fieldId];

      // restore previous value (IDs)
      control.patchValue({
        [fieldId]: existing
      }, { emitEvent: false });
    }
  }

  displayLocation = (value: any): string => {
    if (!value) return '';

    if (typeof value === 'string') return value;

    if (Array.isArray(value)) {
      return value.map(id => {
        const obj = this.locationDetails.find(x => x.id === id);
        return obj ? `${obj.name}, ${obj.fullName}` : '';
      }).join(' | ');
    }

    const obj = this.locationDetails.find(x => x.id === value);
    return obj ? `${obj.name}, ${obj.fullName}` : '';
  };

  getDisplayNames(i, fieldId): string {
    const ids = this.configForm.get('inputList')['controls'][i].value[fieldId];

    if (!ids || !Array.isArray(ids)) return '';

    return ids.map(id => {
      const obj = this.locationDetails.find(x => x.id === id);
      return obj ? `${obj.name}, ${obj.fullName}` : '';
    }).join(' | ');
  }

  isSelected(id, i) {
    return this['locations' + i]?.includes(id);
  }

  initializeConfigValue() {
    if (this.masterData?.type !== 2 && this.configData?.length !== 0) {
      this.id = this.configData.id;
      this.configDataValue = this.configData?.configValue;

      const config = JSON.parse(this.configData?.configValue || '{}');
      if (Object.keys(config).indexOf(this.masterData?.id) > -1) {
        this.configValue = config?.[this.masterData?.id];
      }
    }
  }

  handleFieldAsyncData(field) {
    const { type, app_terms, id } = field;

    if (type === 'DDA' || type === 'DMA') {
      this.commonService.getAppTermsVerion2(app_terms).subscribe(res => {
        this[id + 'List'] = res.results;
      });
    }

    if (type === 'DDF') {
      this.configurationServices.getAllNewGateways(this.data?.gwId).subscribe(res => {
        this.facilityList = res.results[0]?.facilities.filter(val => val.facilityTopicType === 'FTT-FA');
      });
    }
  }

  getFieldValue(field) {
    const { id, type } = field;
    let value = null;
    let configVal = this.configValue?.[id];
    let fallbackConfig = this.config?.[id];

    if (type === 'TAO' || type === 'TAA') {
      if (configVal) {
        value = typeof configVal === 'string' ? configVal : JSON.stringify(configVal);
        configVal = value;
      } else if (fallbackConfig) {
        value = typeof fallbackConfig === 'string' ? fallbackConfig : JSON.stringify(fallbackConfig);
        fallbackConfig = value;
      } else {
        value = null;
      }
    }

    if (type === 'DDF') {
      if (configVal) {
        value = JSON.parse(configVal);
        configVal = value;
      } else if (fallbackConfig) {
        value = fallbackConfig;
        fallbackConfig = value;
      } else {
        value = null;
      }
    }

    return configVal ?? fallbackConfig ?? null;
  }



  revoveDuplicate(index, field, code) {
    const control = <FormArray>this.configForm.controls['inputList'];
    let arrays = this.configForm.get('inputList') as FormArray;
    for(let i = 0; i <= control?.value?.length; i++) {
      if(control?.value[i]?.[field] === code && control?.value[i]?.[field] !== null && i !== index) {
        this[field + index + 'exist'] = true;
        arrays.controls[index].patchValue({ [field] : null });
        return;
      } else  {
        this[field + index + 'exist'] = false;
        arrays.controls[index].patchValue({ [field] : code });
      }
    }
  }
  removeInputs(i: number, type) {
    const control = <FormArray>this.configForm.controls['inputList'];
    control.removeAt(i);
    this.configLength = this.configLength > i ? this.configLength-1 : this.configLength;
    if (type == 'clear' && control.length <= 0) {
      this.addInputs();
    }
  }

  addInputs() {
    const control = <FormArray>this.configForm.controls['inputList'];
    control.push(this.getInputs());
  }

  private getInputs() {
    const form = this.form.group({});
    let value = null;
    this.configField.forEach(field => {
      if(field?.type === 'DDA' || field?.type === 'DMA') {
        this.commonService.getAppTermsVerion2(field?.app_terms).subscribe(res => {
          this.appTermList = res.results;
        });
      }
      if(field?.type === 'TAO' || field?.type === 'TAA') {
        value = null;
      }
      if(field?.type === 'DDF') {
         this.configurationServices.getAllNewGateways(this.data?.gwId).subscribe((res) => {
          this.facilityList = res.results[0]?.facilities.filter(val => val.facilityTopicType === 'FTT-FA');
        });
      } else {
        value = null;
      }

      if(field?.type === 'DDL' || field?.type === 'DML') {
        form.addControl(field.id, this.form.control(value, [this.requireLocationMatch.bind(this)]));
      } else {
        form.addControl(field.id, this.form.control(value));
      }
    });
    return form
  }

  openedChange(isOpended, index, field)
  {
    if(!isOpended)
    {
      let code = this.configForm.controls.inputList.value[index][field]
      const control = <FormArray>this.configForm.controls['inputList'];
      let arrays = this.configForm.get('inputList') as FormArray;
      for(let i = 0; i <= control?.value?.length; i++) {
        if(control?.value[i]?.[field] === code && control?.value[i]?.[field] !== null && i !== index) {
          this[field + index + 'exist'] = true;
          arrays.controls[index].patchValue({ [field] : null });
          return;
        } else  {
          this[field + index + 'exist'] = false;
          arrays.controls[index].patchValue({ [field] : code });
        }
      }
    }
  }

  enableLocation(id, i) {
    this.locationDetails = [];
    this.configField.forEach(field => {
      if(field?.type === 'DDL' || field?.type === 'DML') {
        let arrays = this.configForm.get('inputList') as FormArray;
        arrays.controls[i].patchValue({ [field?.id] : null });
      }
    })
    if(this.configForm.controls.inputList.value[i][id] !== null && 
      this.configForm.controls.inputList.value[i][id] !== '') {
      this.SelectedFacilityId = this.configForm.controls.inputList.value[i][id];
      this.editLocation = true;
    } else {
      this.SelectedFacilityId = null;
      this.editLocation = false;
    }
  }

  getLocationSearch(event) {
    this.locationId = null;
    if (event.type === 'locationSearch' && event.text.length >= 2) {
      if (event.toHit === true) {
        this.configurationServices.getLocationData(event.text, null, this.SelectedFacilityId).subscribe(res => {
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
      const location = this as any as { id: string, name: string, fullName: string }[]
      const locationId = location.find(obj => obj.id === id).name + ',' + location.find(obj => obj.id === id).fullName;
      return locationId;
    } else {
      return '';
    }
  }

  private requireLocationMatch(control: FormControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !this.locationIdEnabled) return null;

    // ignore string (safety)
    if (typeof value === 'string') return null;

    if (Array.isArray(value)) {
      const invalid = value.some(id =>
        !this.locationDetails.some(loc => loc.id === id)
      );
      return invalid ? { requireMatch: true } : null;
    }

    const match = this.locationDetails.find(loc => loc.id === value);
    return match ? null : { requireMatch: true };
  }

  closeConfig(clickedData?:any) {
    this.configField = [];
    this.getAllConfig(this.data, clickedData);
  }

  addConfig() {
    const control = <FormArray>this.configForm.controls['inputList'];
    this.configInput = {
      [this.masterData?.id]: {}
    }
    if(this.configDataValue){
      this.configInput = JSON.parse(this.configDataValue);
      this.configInput[this.masterData?.id] = {};
    }
    if(this.masterData?.type == 2) {
      this.configInput[this.masterData?.id] = [];
      for (let i = 0; i < control.length; i++) {
        const data = this.configForm.controls['inputList'].value[i];
        let parse = data['bcn_config'];
        if(data.hasOwnProperty('bcn_config') && typeof(data['bcn_config']) != 'object') {
          parse = JSON.parse(data['bcn_config']);
          data['bcn_config'] = parse;
        }
        Object.keys(data)?.forEach(key => {
          const value = data[key];

          if (typeof value === 'string' && value?.startsWith('[')) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              // ignore invalid JSON
            }
          }
        });
        this.configInput[this.masterData?.id].push(data);
      }
    } else {
      for (let i = 0; i < control.length; i++) {
        const data = this.configForm.controls['inputList'].value[i];
        let parse = data['bcn_config'];
        if(data.hasOwnProperty('bcn_config') && typeof(data['bcn_config']) != 'object') {
          parse = JSON.parse(data['bcn_config']);
          data['bcn_config'] = parse;
        }
        this.configInput[this.masterData?.id] = data;
      }
    }
    let configData = [{
      "configType": this.data.configType,
      "configValue": JSON.stringify(this.configInput),
      "id": this.id,
      "groupTypeId": this.data.groupConfigId,
      "identifyingId": this.data.identifyingId,
      "identifyingType": this.data.identifyingType,
      "isActive": true,
    }];
    if (this.data?.hasOwnProperty('taskDetails')) {
      this.configurationServices.createGatewayJob(this.data?.taskDetails).subscribe((res) => {
        if (res.statusCode === 1) {
          configData[0]['identifyingId'] = res?.results?.id;
          this.data['identifyingId'] = res?.results?.id;
          console.log(configData)
          this.configurationServices.createJobConfig(configData).subscribe((res) => {
            if (res.statusCode === 1) {
              this.closeConfig(this.selectedData);
              this.toastr.success('Success', `${res.message}`);
            }
          },
            error => {
              this.toastr.error('Error', `${error.error.message}`);
            });
        }
      });
    } else {
      this.configurationServices.createJobConfig(configData).subscribe((res) => {
        if (res.statusCode === 1) {
          this.closeConfig(this.selectedData);
          this.toastr.success('Success', `${res.message}`);
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }

  updateConfig() {
    const control = <FormArray>this.configForm.controls['inputList'];
    this.configInput = JSON.parse(this.configDataValue);
    this.configInput[this.masterData?.id] = {};
    if(this.masterData?.type == 2) {
      this.configInput[this.masterData?.id] = [];
      for (let i = 0; i < control.length; i++) {
        const data = this.configForm.controls['inputList'].value[i];
        let parse = data['bcn_config'];
        if(data.hasOwnProperty('bcn_config') && typeof(data['bcn_config']) != 'object') {
          parse = JSON.parse(data['bcn_config']);
          data['bcn_config'] = parse;
        }
        Object.keys(data)?.forEach(key => {
          const value = data[key];

          if (typeof value === 'string' && value?.startsWith('[')) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              // ignore invalid JSON
            }
          }
        });

        this.configInput[this.masterData?.id].push(data);
      }
    } else {
      for (let i = 0; i < control.length; i++) {
        const data = this.configForm.controls['inputList'].value[i];
        let parse = data['bcn_config'];
        if(data.hasOwnProperty('bcn_config') && typeof(data['bcn_config']) != 'object') {
          parse = JSON.parse(data['bcn_config']);
          data['bcn_config'] = parse;
        }
        this.configInput[this.masterData?.id] = data;
      }
    }
    let configData = [{
      "configType": this.data.configType,
      "configValue": JSON.stringify(this.configInput),
      "id": this.id,
      "groupTypeId": this.data.groupConfigId,
      "identifyingId": this.data.identifyingId,
      "identifyingType": this.data.identifyingType,
      "isActive": true,
    }];
    this.configurationServices.createJobConfig(configData).subscribe((res) => {
    if (res.statusCode === 1) {
      this.closeConfig(this.selectedData);
      this.toastr.success('Success', `${res.message}`);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  deleteConfig() {
    this.configInput = JSON.parse(this.configDataValue);
    delete this.configInput[this.masterData?.id];
    let configData = [{
      "configType": this.data.configType,
      "configValue": JSON.stringify(this.configInput),
      "id": this.id,
      "groupTypeId": this.data.groupConfigId,
      "identifyingId": this.data.identifyingId,
      "identifyingType": this.data.identifyingType,
      "isActive": true,
    }];
    console.log(configData)
    this.configurationServices.createJobConfig(configData).subscribe((res) => {
    if (res.statusCode === 1) {
      this.closeConfig(this.selectedData);
      this.toastr.success('Success', `${res.message}`);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  customValidateJson(value) {
    let contentValue = value;
    if (contentValue !== null && contentValue !== '') {
      try {
        JSON.parse(contentValue);
        this.invalidJson = false;
      } catch (error) {
       this.invalidJson = true;
      }
    }
  }

  customValidateArray(value) {
    let contentValue = value;
    if (contentValue !== null && contentValue !== '') {
      try {
        JSON.parse(contentValue);
        this.invalidArray = false;
      } catch (error) {
       this.invalidArray = true;
      }
    }
  }

  fixClick() {
    console.log("");
  }
}
