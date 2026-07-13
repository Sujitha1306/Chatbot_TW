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

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {Clipboard} from '@angular/cdk/clipboard';
import { ErrorStateMatcherService } from '../../../../../shared/services/error-state-matcher.service';
import { AppToastService } from '../../../../../shared/services/toaster.service';
import { CommonService, ConfigurationService, HospitalService } from '../../../../../shared';

@Component({
  selector: 'app-manage-location-leaflet',
  templateUrl: './manage-location-leaflet.component.html',
  styleUrls: ['./manage-location-leaflet.component.scss']
})
export class ManageLocationLeafletComponent implements OnInit {

  public matcher = new ErrorStateMatcherService();
  locationForm: FormGroup;
  locationTypes=[];
  careSettingList=[];
  categoryList=[];
  polygonColorList=[];
  workFlowList=[];
  statusList = [{id : 'Active', name : 'Active'},{id : 'Inactive', name : 'Inactive' }];
  public openAutocom: boolean = false;
  public windWidth = window.innerWidth;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  @ViewChild('autocompleteTrigger') matACTrigger: MatAutocompleteTrigger;
  

  constructor(
    private readonly fb: FormBuilder, public toastr: AppToastService,private readonly dialogRef: MatDialogRef<ManageLocationLeafletComponent> ,private readonly hosipitalService:HospitalService, 
    private readonly commonService:CommonService, private readonly configurationServices:ConfigurationService, @Inject(MAT_DIALOG_DATA) public data: any,private readonly clipboard: Clipboard,
  ) {}

  ngOnInit(): void {
    this.buildform();
    this.getLocationTypes();
    if(this.data?.polygon === undefined || this.data?.polygon === null){
    this.configurationServices.getConfigFile('location-config').subscribe(res => {
      const polygonColorList = res.results?.contentObject?.polygonColor;
      if (polygonColorList) {
        this.polygonColorList = Object.keys(polygonColorList).map(key => ({
          id: key, 
          name: polygonColorList[key]
        }));
      }
    });
    this.locationForm.get('locationTypeId').valueChanges.subscribe(() => {
      this.locationForm.controls.polygonColor.setValue(null);
      const locationTypeId = this.locationForm.get('locationTypeId').value;
      const matchingColor = this.polygonColorList.find(item => item.id === locationTypeId.toString());
      if (matchingColor) {
        this.locationForm.controls.polygonColor.setValue(matchingColor.name);
      } else {
        this.locationForm.controls.polygonColor.setValue('blue');
      }
    });
    this.locationForm.get('locationCategoryId').valueChanges.subscribe(() => {
      this.locationForm.controls.polygonColor.setValue(null);
      const locationCategoryId = this.locationForm.get('locationCategoryId').value;
      const matchingColor = this.polygonColorList.find(item => item.id === locationCategoryId.toString());
      if (matchingColor) {
        this.locationForm.controls.polygonColor.setValue(matchingColor.name);
      } else {
        this.locationForm.controls.polygonColor.setValue('blue');
      }
    });
    }
    this.commonService.getAppTerms('CareSetting,LocationCategory,WorkFlow').subscribe(res => {
      this.careSettingList = res.results.filter(val => val.groupName === 'CareSetting');
      this.categoryList = res.results.filter(val => val.groupName === 'LocationCategory');
      this.workFlowList = res.results.filter(val => val.groupName === 'WorkFlow');
    });
  }

  buildform(){
    let labelStyle= this.data.polygon?.labelStyle? this.data.polygon.labelStyle: null;
    let labelstyle
    try{
      labelstyle = JSON.parse(labelStyle)
    }catch{
      labelstyle = labelStyle
    }
    this.locationForm = this.fb.group({
      locationTypeId:[this.data.polygon?this.data.polygon.locationTypeId : 17, [Validators.required]],
      name:[this.data.polygon?.name || null, [Validators.required]],
      polygonColor:[this.data.polygon?.polygonStyle || 'blue'],
      locationCategoryId:[this.data.polygon?.locationCategoryId || null, [Validators.required]],
      careSettingId:[this.data.polygon?.careSettingId || null, [Validators.required]],
      status:[this.data.polygon?.status || 'Active', [Validators.required]],
      shortName:[this.data.polygon?.shortName || null],
      locationIdentifier:[this.data.polygon?.locationIdentifier || null],
      locationDescription:[this.data.polygon?.locationDescription || null],
      labelStyle:[labelstyle?.web ? labelstyle.web : null],  
      labelStyleMobile:[labelstyle?.mob ? JSON.stringify(labelstyle.mob) : null, [this.customValidateMobile()]],
      point :[this.data.polygon?.point ? this.data.polygon.point : null],
      rotate :[this.data.polygon?.rotateAngle ? this.data.polygon.rotateAngle : null],
      workFlowId :[this.data?.workflowId || null]
    })
  }

  getLocationTypes(){
      this.hosipitalService.getAllLogicalLocationType(this.data.floorId).subscribe(res=> {
          this.locationTypes=res.results;
      })
  }

  customValidateMobile():ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; 
      }
      try {
        JSON.parse(value); 
        return null;
      } catch {
        return { invalidJson: true }; 
      }
    };
  }

  localcopy(value){
    this.clipboard.copy(value)
  }

  locStyling(){
    this.openAutocom = true;
    this.matACTrigger.openPanel()
  }

  changeStyle(event){
    this.openAutocom = false;
    this.matACTrigger.closePanel()
    this.locationForm.controls['labelStyle'].setValue(event)
  }

  closeStyle(event){
    this.openAutocom = false;
    this.matACTrigger.closePanel()
  }

  saveData() {
      const labelStyleWeb = this.locationForm.controls.labelStyle.value;
      let labelStyleMobile = JSON.parse(this.locationForm.controls.labelStyleMobile.value);
      const labelStyle = JSON.stringify({ web: labelStyleWeb, mob: labelStyleMobile, point : this.locationForm.controls.point.value, rotate : this.locationForm.controls.rotate.value});
      const data = {
        locationTypeId: this.locationForm.controls.locationTypeId.value,
        name:this.locationForm.controls.name.value,
        status: this.locationForm.controls.status.value,
        polygonStyle: this.locationForm.controls.polygonColor.value,
        locationCategoryId : this.locationForm.controls.locationCategoryId.value,
        careSettingId : this.locationForm.controls.careSettingId.value,
        logicalParentId:this.data?.logicalParentId ?? this.data?.floorId,
        parentId:this.data?.parentId ?? this.data?.floorId,
        coordinates:this.data.coordinates,
        shortName: this.locationForm.controls.shortName.value,
        locationIdentifier: this.locationForm.controls.locationIdentifier.value,
        locationDescription: this.locationForm.controls.locationDescription.value,
        workflowId: this.locationForm.controls.workFlowId.value,
        labelStyle: labelStyle,
        ...(this.data?.polygon && { id: this.data.polygon.id }), 
      };
      const apiCall = this.data?.polygon ? this.hosipitalService.editLocation(data): this.hosipitalService.saveLocation(data);
      apiCall.subscribe(
        res => {
          if (res?.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close();
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
  }

  ngDoCheck(){
    this.windWidth = window.innerWidth;
    if(this.openAutocom){
      this.matACTrigger.openPanel()
    }
  }
}
