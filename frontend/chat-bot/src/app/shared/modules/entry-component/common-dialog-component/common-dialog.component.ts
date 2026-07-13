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

import { Component, OnInit,  ViewEncapsulation, Inject,  ViewChild, ElementRef, Input, Optional } from '@angular/core';
import { ConfigurationService, DashboardService } from '../../../services';
import { FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppToastService } from '../../../services/toaster.service';

@Component({
    selector: 'app-common-dialog',
    templateUrl: './common-dialog.component.html',
    styleUrls: ['./common-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
  })

  
export class CommonDialogComponent implements OnInit {
  @ViewChild('video', { static: true }) videoElement!: ElementRef;
  @ViewChild('canvas', { static: true }) canvasElement!: ElementRef;
  imageData: string | undefined;
  videoStream: MediaStream | undefined; 
  @Input() injectdata: any;
  @Input() editable: boolean;
  public selectedBlock = null;
  public selectedFloor = null;
  public tagId = null;
  public tagType = null;
  public popupType = '';
  public selectedLoc: any;
  public type = "popup";
  public reqDetail: any = null;
  public reqType: any = null;
  public contextOptions = {'show' : {
    'navbar' : true,
    'navMenu': true,
    'blockSelect': true,
    'floorSelect': true,
    'searchBox' : true,
    'navBlkImg': true,
    'navBlkContent': true,
    'navBlkList': true,
    'filterOption': true,
    'mobileView' : false,
    'editable' : true,
    'header' : true
  }};
  public maxHeight;
  public content = null;
  public contentDetail:any = {};
  public performerId = new FormControl();
  displayedColumns: string[] = ['blockName','fromTime','toTime','duration'];
  dataSourceViewHistory = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  perfomerList: any = [{}];
  perfom: any;
  layoutInfo:any = {'isActive' : false};
  constructor(public toastr: AppToastService,  private readonly configurationServices: ConfigurationService,public fb: FormBuilder,private readonly _dateFormat: DatePipe,
    private readonly dashboardService : DashboardService,@Optional() public dialog: MatDialog,  @Optional() public dialogRef?: MatDialogRef<CommonDialogComponent>, @Optional() @Inject(MAT_DIALOG_DATA) public data?: any){
  if(this.data){
  if(data.hasOwnProperty('content')) {
      this.content = data['content'];
      this.contentDetail = data;
    } else {
      this.contentDetail['content'] = 'floorplan';
    }
    this.contextOptions.show.editable = data.editable
  }
  }
  ngOnInit(){
     if(this.injectdata){
      this.data = this.injectdata
       this.content =this.data['content'];
      this.contentDetail =this.data;
       this.contextOptions.show.editable = this.data.editable 
       this.contextOptions.show.header = this.data.header
       console.log(this.data)
       console.log(this.content)
    }
    if(this.contentDetail['content'] == 'layout') {
      if(this.contentDetail.hasOwnProperty('linkedResourceCode')) {
        this.getDashboardLayout(this.contentDetail['linkedResourceCode'])
      }      
    }
    if(this.contentDetail['content'] == 'history'){
      this.perfomerList = this.data.performer
      if(this.perfomerList.length) {
        this.perfomerList = this.perfomerList.filter(val => val.status == "RQ-CO");
        this.performerId.setValue(this.perfomerList[0]['id']);
      }
      this.poterTrackHistory();
    }
    if(this.data.hasOwnProperty('type') && this.data.type == "track") {
      this.contextOptions["show"]["navbar"] = false;
      this.contextOptions["show"]["filterOption"] = false;
      this.reqDetail = this.data.data;
      this.reqType = this.data.type;
    }
    this.maxHeight = window.innerHeight-60;
    if(this.data.reqType && this.data.reqType == 'porter'){
      this.contextOptions.show.navMenu = false;
      this.popupType = this.data.reqType.toUpperCase();
      this.reqDetail = this.data.reqDetail;
      this.reqType = this.data.reqType;
      this.selectedFloor = this.data.reqDetail.sourceFloorId;
      // porter floor shown first
      if(this.reqDetail['performer'].length) {
        let performerList = this.reqDetail['performer'].filter(val => val.status != 'RQ-RJ' && val.floorId != null)
        if(performerList.length) {
          this.selectedFloor = performerList[0].floorId
        }
      }
    } else{
    this.selectedFloor = parseInt(this.data.floorId);
    this.tagId = this.data.tagSerialNumber;
    if(this.data.type && this.data.type == 'globalSearch'){
      this.reqType = this.data.type;
    }
    if(this.data.tagTypeId != null){
      this.tagType = this.data.tagTypeId;
    } else if(this.data.tagTypeId == null){
      if(this.data.category == 'Asset' || this.data.tagType == 'Asset'){
        this.tagType = 'TAT-AS';
      }
    }
    if(this.data.category != null){
    this.popupType = this.data.category.toUpperCase();
    } else if(this.data.tagType != null){
      this.popupType = this.data.tagType.toUpperCase();
    }
    this.contextOptions['show'].navMenu = true;
    }
    this.selectedLoc = null;
    if (window.innerWidth <= 599) {
      this.contextOptions.show.mobileView = true;
    } else {
      this.contextOptions.show.mobileView = false;
    }
  }
  reportHeaderAction(event) {
    if(this.layoutInfo) {
      this.layoutInfo.inputAction = null;
      let type = event.key;
      if(this.contentDetail.content == 'layout') {
        if(this.contentDetail.hasOwnProperty('requestId')) {
          event.data = event.data + '&reqId='+this.contentDetail.requestId
          event.paramJson['reqId'] = this.contentDetail.requestId;
        }
        if(this.contentDetail.hasOwnProperty('assetId')) {
          event.data = event.data ? event.data + '&aid='+this.contentDetail.assetId : 'aid='+this.contentDetail.assetId;
          event.paramJson['aid'] = this.contentDetail.assetId;

          event.data = event.data ? event.data + '&assetId='+this.contentDetail.assetId : 'assetId='+this.contentDetail.assetId;
          event.paramJson['assetId'] = this.contentDetail.assetId;
        }
        if(this.contentDetail.hasOwnProperty('entityRoutineId')){
          event.data = event.data +'&entityRoutineId='+this.contentDetail.entityRoutineId
          event.paramJson['entityRoutineId'] = this.contentDetail.entityRoutineId;
        }
      }
      if(event.key === 'excel' || event.key === 'pdf' || event.key === 'refresh') {
          this.layoutInfo.inputAction = {type, inputParams: event.data, isEnabled : true, dashId: this.layoutInfo.dashboardId, resourceCode: this.layoutInfo.resourceCode, dashData: this.layoutInfo.dashData, paramJson : event.paramJson};
      } else {
          this.layoutInfo.inputAction = {type, inputParams: event.data, dashId: this.layoutInfo.dashboardId, resourceCode: this.layoutInfo.resourceCode, dashData: this.layoutInfo.dashData, paramJson : event.paramJson};
      }
      console.log(this.layoutInfo.inputAction)
    }
  }
  getDashboardLayout(resourceCode = null) {
    const roleId = localStorage.getItem('userlevel');
    const userId = localStorage.getItem(btoa('userId'));
    this.layoutInfo['isActive'] = false;
    this.dashboardService.getCurrentDashboard(userId,roleId, resourceCode).subscribe(res => {
      if (res.statusCode === 1) {
        this.layoutInfo['resourceCode'] = resourceCode;
        this.layoutInfo['dashData'] = res.results;
        this.layoutInfo['headerName'] = {"name" : res.results.linkedResourceName, "icon" : null};
        this.layoutInfo['dynamicInput'] = JSON.parse(res.results?.configValue);
        if(this.layoutInfo['dynamicInput']){
          this.layoutInfo['filterInputs'] = this.layoutInfo['dynamicInput']['dynamicHeader']['filterInputs'];
          this.layoutInfo['enableExcel'] = this.layoutInfo['dynamicInput']['dynamicHeader']['enableExcel'];
          this.layoutInfo['enablePdf'] = this.layoutInfo['dynamicInput']['dynamicHeader']['enablePdf'];
          this.layoutInfo['enableRefresh'] = this.layoutInfo['dynamicInput']['dynamicHeader']['enableRefresh'];
          this.layoutInfo['enableHeader'] = this.layoutInfo['dynamicInput']['dynamicHeader']['enableHeader'];
          this.layoutInfo['showLayoutSetting'] = false;
          
          this.layoutInfo['pdfConfigSelected'] = this.layoutInfo['dynamicInput']?.pdfConfig?.selected;
        }
        this.layoutInfo['dashboardId'] = res.results.dashboardId;
        this.layoutInfo['isActive'] = true;
      } else {
        console.log('no report layout')
      }
    });
  }
  ngAfterViewInit() {
    if(this.contentDetail['content'] == 'webcam'){
      this.startWebcam()
    }
  }
  public formInputUpdatedData(data){
    if (data.statusCode === 1) {
      this.toastr.success('Success', `${data.message}`);
    } else {
      this.toastr.warning('Warning', `${data.message}`);
    }
    this.dialogRef.close(data);
  }
  // Method to access the user's webcam
  startWebcam() {
    setTimeout(() => {}, 1000);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.videoStream = stream; // Store the stream
          this.videoElement.nativeElement.srcObject = stream;
        })
        .catch((err) => {
          console.error('Error accessing webcam: ', err);
        });
    }
  }
  closeDialog() {
    this.stopWebcam();
    this.dialogRef.close()
  }
   captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.font = '30px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'left';
  
    const timestamp = new Date().toLocaleString();
    context.fillText(timestamp, 10, canvas.height - 40);
  
    if (typeof window.navigator !== 'undefined' && window.navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude.toFixed(2);
        const lon = position.coords.longitude.toFixed(2);
        const locationText = `Lat ${lat}, Lon ${lon}`;          
        context.fillText(locationText, 10, canvas.height - 20);      
        this.imageData = canvas.toDataURL('image/png');
  
        // Your code to draw the location on the canvas
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    } else {
      console.error("Navigator or Geolocation not available.");
    }
  }
  stopWebcam() {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop());
        this.videoElement.nativeElement.srcObject = null;
      }
  }
  

  public poterTrackHistory(){
    let actualTime = this._dateFormat.transform(this.data.actualTime, 'yyyy-MM-dd');
    let actualDropTime = this._dateFormat.transform(this.data.actualDropTime, 'yyyy-MM-dd');
    this.configurationServices.getStaffLocations(actualTime, actualDropTime, this.performerId.value).subscribe(res =>{
      if(res.statusCode == 1 || res.results.data.length ) {
        let results = res.results['data']['journey '];
        this.dataSourceViewHistory = new MatTableDataSource<any>(results);
        this.dataSourceViewHistory.paginator = this.paginator;
      }
    })
  }
}
