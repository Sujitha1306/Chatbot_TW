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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, HospitalService } from '../../../../../shared';
import { ConfirmDialogComponent } from '../../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { AppToastService } from '../../../../../shared/services/toaster.service';

@Component({
  selector: 'app-manage-location-view',
  templateUrl: './manage-location-view.component.html',
  styleUrls: ['./manage-location-view.component.scss']
})
export class ManageLocationViewComponent implements OnInit {

  public locationViewForm: FormGroup;
  public categoryList = [];
  public locationTypes = [];
  public floorList = [];
  public enableFloorAll = false;
  public enableTypeAll = false;
  public enableCategoryAll = false;
  public zoomOptions = [0,20,40,60,80, 100, 120, 140, 160, 180, 200];
  public fontSizes =[8,10,12,14,16];
  constructor( @Inject(MAT_DIALOG_DATA) public data: any,private readonly dialog: MatDialog,public toastr: AppToastService,
  private readonly dialogRef: MatDialogRef<ManageLocationViewComponent>,private readonly form: FormBuilder,private readonly commonService: CommonService,private readonly hospitalService: HospitalService) {
   }

  ngOnInit(): void {
    this.getBasicDetails();
    this.buildForm();
  }
  buildForm(){
    let fontSize= 12,color, fillColor = 'blue', fillOpacity;
    let labelstyle;
    if (this.data?.labelStyle) {
      try {
        labelstyle = JSON.parse(this.data.labelStyle);
      } catch (e) {
        console.log(e);
        labelstyle = this.data.labelStyle;
      }
    }
    let webStyle = labelstyle?.web;
    let polygonStyle = labelstyle?.polygon;

    if (webStyle && typeof webStyle === "string") {
      try {
        webStyle = JSON.parse(webStyle);
      } catch (e) {
        console.error("Error parsing webStyle:", e);
      }
    }
    
    if (webStyle && typeof webStyle === "object") {
      const size = webStyle["font-size"];
      fontSize = size ? parseInt(size.replace("px", ""), 10) : fontSize;
    }

    if (polygonStyle && typeof polygonStyle === "string") {
      try {
        polygonStyle = JSON.parse(polygonStyle);
      } catch (e) {
        console.error("Error parsing polygonStyle:", e);
      }
    }
    
    if(polygonStyle && typeof polygonStyle === "object") {
      fillColor = polygonStyle["color"] || this.data?.polygonStyle || fillColor;
      color = polygonStyle["fillColor"] || fillColor;
      fillOpacity= polygonStyle["fillOpacity"]?Number(polygonStyle["fillOpacity"]) : null;
    }
    
    this.locationViewForm = this.form.group({
      floors:[this.data?[this.data.parentId]:null,[Validators.required]],
      locType:[this.data?[this.data.locType]:null,[Validators.required]],
      category:[null ,[Validators.required]],
      polygonColor:[this.data?this.data.polygonStyle:null],
      labelStyle:[this.data?this.data.labelStyle:null],
      minZoom:[this.data?this.data.minZoom:null],
      maxZoom:[this.data?this.data.maxZoom:null],
      defaultZoom:[this.data?this.data.defaultZoom:null],
      disLocLevel:[this.data?this.data.disLocLevel:null],
      fontSize:[this.data?.labelStyle && webStyle ?fontSize: 12],
      color:[this.data?.labelStyle &&polygonStyle?.fillColor ? color : null],
      fillColor:[this.data?.labelStyle &&polygonStyle?.color? fillColor :null],
      fillOpacity:[this.data?.labelStyle &&polygonStyle?.fillOpacity? fillOpacity :0.2],
      polygonColorEnable:[false],
      labelStyleEnable:[false],
      minZoomEnable:[false],
      maxZoomEnable:[false],
      defaultZoomEnable:[false],
      disLocLevelEnable:[false],
      fontSizeEnable:[false],
      colorEnable:[false],
      fillColorEnable:[false],
      fillOpacityEnable:[false],
    })
  }

  colorPicker(event: MouseEvent,field) {
    event.stopPropagation();
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.position = 'absolute';
    colorPicker.style.zIndex = '1000';
    colorPicker.style.border = 'none';
    colorPicker.style.background = 'transparent';
    colorPicker.style.width = '40px';
    colorPicker.style.height = '40px';
    colorPicker.style.opacity = '0'; 
    colorPicker.value = this.locationViewForm.controls[field].value ;
    colorPicker.style.left = `${event.clientX}px`;
    colorPicker.style.top = `${event.clientY}px`;

    colorPicker.addEventListener('input', (event: any) => {
      this.locationViewForm.controls[field].setValue(event.target.value); // Update form control
      if (field === 'color') {
        this.locationViewForm.get('fillColor')?.setValue(event.target.value);
      }
    });
    const removePicker = (e: Event) => {
      if (e.target !== colorPicker) {
        if (document.body.contains(colorPicker)) {
          document.body.removeChild(colorPicker);
        }
        document.removeEventListener('click', removePicker);
      }
    };

    document.body.appendChild(colorPicker);
    colorPicker.click();
    setTimeout(() => {
      document.addEventListener('click', removePicker);
    }, 200);
  }

  clearPolygonColor(field) {
    this.locationViewForm.controls[field].setValue("blue");
  }

  getBasicDetails(){
    this.commonService.getAppTerms('LocationCategory').subscribe(res => {
      this.categoryList = res.results.filter(val => val.groupName === 'LocationCategory');
    });
    this.commonService.getAllLocationType().subscribe(res => {
      this.locationTypes = res.results
      this.setLocationType();
    })
    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if(res.statusCode == 1){
          let locationInfo = res.results;
          this.filterByLocationTypeId(locationInfo,2)
      }
    })
  }

  setLocationType(){
    let locTyp = this.data?.locType
    if(locTyp){
      let locLevel = this.locationTypes.filter(res => res.id == locTyp)
      if(locLevel.length){
        this.locationTypes = this.locationTypes.filter(res => res.level >= locLevel[0]['level'])
        if (this.data?.type === 'floorPlan') {
          this.locationViewForm.controls.locType.setValue([17]);
          this.locationViewForm.controls.locType.updateValueAndValidity();
          const excludeIds = [2, 18, 23, 24];
          this.locationTypes = this.locationTypes.filter(res => !excludeIds.includes(res.id));
        }
      }
    }
  }

  filterByLocationTypeId(locationInfo,locationTypeId,blockName?){
    if(locationInfo){
      locationInfo.forEach(location => {
        if (location.locationTypeId === 2) {
          location['blockName'] = blockName?blockName:'';
          this.floorList.push(location);
        }
        if (location.children) {
          this.filterByLocationTypeId(location.children, locationTypeId,location.name);
        }
    });
    }
  }

  toggleAll(type,value) {

    if(type === 'floors'){
      this.enableFloorAll = !this.enableFloorAll;
      if(value === 0 && this.enableFloorAll){
        this.locationViewForm.controls['floors']
            .patchValue([...this.floorList.map(item => item.id), 0]);
      } else {
        this.locationViewForm.controls['floors'].patchValue([]);
      }
    } else if (type === 'locType') {
      this.enableTypeAll = !this.enableTypeAll;
      if(value === 0 && this.enableTypeAll){
        this.locationViewForm.controls['locType']
            .patchValue([...this.locationTypes.map(item => item.id), 0]);
      } else {
        this.locationViewForm.controls['locType'].patchValue([]);
      }
    } else if (type === 'category') {
      this.enableCategoryAll = !this.enableCategoryAll;
      if(value === 0 && this.enableCategoryAll){
        this.locationViewForm.controls['category']
            .patchValue([...this.categoryList.map(item => item.code), 0]);
      } else {
        this.locationViewForm.controls['category'].patchValue([]);
      }
    }
  }

  UpdateLocationView(){
    const fontSizeValue = this.locationViewForm.controls.fontSize.value;
    const labelStyleValue = this.locationViewForm.controls.labelStyle.value;
    const colorValue = this.locationViewForm.controls.color.value;
    const fillColorValue = this.locationViewForm.controls.fillColor.value;
    const fillOpacityValue = this.locationViewForm.controls.fillOpacity.value;
    if (labelStyleValue) {
      try {
        let labelStyleObj = JSON.parse(labelStyleValue);
        if (!labelStyleObj["web"]) {
          labelStyleObj["web"] = `font-size:${fontSizeValue}px;`;
        } else if (typeof labelStyleObj["web"] === "string") {
          // nfa : regex replaced commented for sonar security issue by rahul
          // labelStyleObj["web"] =  labelStyleObj["web"]
          //   .replace(/font-size\s*:\s*[^;]+;/gi, '')
          //   .trim();          
          labelStyleObj["web"] =  labelStyleObj["web"].replace(/font-size\s*:\s*[^;]+;/gi, '');
          labelStyleObj["web"] += ` font-size:${fontSizeValue}px;`;
        } else if (typeof labelStyleObj["web"] === "object") {
          labelStyleObj["web"]["font-size"] = `${fontSizeValue}px`;
        }
    
        if (!labelStyleObj["polygon"]) {
          labelStyleObj["polygon"] = {};
        } else if (typeof labelStyleObj["polygon"] === "string") {
          labelStyleObj["polygon"] = JSON.parse(labelStyleObj["polygon"]);
        }
        labelStyleObj["polygon"] = {color: fillColorValue,fillColor: colorValue, fillOpacity:fillOpacityValue,weight:0.3,opacity: 1};
        this.locationViewForm.controls.labelStyle.patchValue(JSON.stringify(labelStyleObj));
      } catch (error) {
        console.error("Invalid JSON format in labelStyle:", error);
      }
    } 
    let postData = this.getPostData();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to apply locations?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.hospitalService.locationApplyAllNew(this.locationViewForm.get('floors').value,this.locationViewForm.get('locType').value,this.locationViewForm.get('category').value,postData).subscribe({next: (res) => {
          if(res.statusCode === 1){
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close();
          }else{
            this.toastr.error('Error', `${res.message}`);
          }
        },
        error: (err) => {
          this.toastr.error('Error', err?.error?.message);
        }
      });
      }
    });
  }

  getPostData() {
    const includeLabelStyle =
    this.locationViewForm.get('colorEnable').value ||
    this.locationViewForm.get('fillColorEnable').value ||
    this.locationViewForm.get('fillOpacityEnable').value ||
    this.locationViewForm.get('fontSizeEnable').value;
    const data = {
      "defaultZoom": this.locationViewForm.get('defaultZoomEnable').value?this.locationViewForm.get('defaultZoom').value:null,
      "disLocLevel": this.locationViewForm.get('disLocLevelEnable').value?this.locationViewForm.get('disLocLevel').value:null,
      "labelStyle": includeLabelStyle ?this.locationViewForm.get('labelStyle').value:null,
      "maxZoom": this.locationViewForm.get('maxZoomEnable').value?this.locationViewForm.get('maxZoom').value:null,
      "minZoom": this.locationViewForm.get('minZoomEnable').value?this.locationViewForm.get('minZoom').value:null,
      "polygonStyle": (this.locationViewForm.get('colorEnable').value ||this.locationViewForm.get('fillColorEnable').value )? this.locationViewForm.get('color').value: this.locationViewForm.get('polygonColor').value
    }
    return data;
  }
fixClick() {
    console.log('')
  }
}
