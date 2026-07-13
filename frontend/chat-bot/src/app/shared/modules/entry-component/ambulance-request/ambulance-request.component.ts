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
 import { Component, OnInit, ViewChild, Inject, AfterViewInit } from "@angular/core";
 import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
 import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
 import { MatInput } from "@angular/material/input";
 import {
   FormGroup,
   FormBuilder,
   Validators,
   FormControl,
   ValidationErrors
 } from "@angular/forms";
 import { CommonService } from "../../../services/common.service";
 import "rxjs/add/observable/interval";
 import { DatePipe } from "@angular/common";
 import { ConfirmationDialog } from "../confirmation-dialog/confirmation-dialog.component";
 import { CookieService } from "ngx-cookie-service";
import { CreateAmbulanceRequest, EditAmbulanceRequest } from "./ambulance-request.model";
import { GoogleMapComponent } from "../google-map/google-map.component";
import { ErrorStateMatcherService } from "../../../services/error-state-matcher.service";
import { AppToastService } from "../../../services/toaster.service";

@Component({
  selector: "app-ambulance-request",
  templateUrl: "./ambulance-request.component.html",
  styleUrls: ["./ambulance-request.component.scss"],
  providers: [DatePipe],
})

export class AmbulanceRequestComponent implements OnInit, AfterViewInit {
  public ambulanceRequestForm: any = FormGroup;
  public autoAssign = false; // auto assign input defaultly set as Manual by Rahul at Feb 21 2023
  public locFromId = null;
  public srcLocationTypeId = null;
  public destLocationTypeId = null;
  public srcParentLocationId = null;
  public destParentLocationId = null;
  public locToId = null;
  public ambulanceId: any;
  public matcher = new ErrorStateMatcherService();
  public searchSourceLocList: any = [];
  public searchDestLocList: any = [];
  public searchAmbulanceList: any = [];
  public performerInfo: any = [];
  public nonPerformerInfo: Array<any>;
  public reqAmbulanceDetails: any = [];
  public selectedAmbulance: any = [];
  public editAction = false;
  public statusBasedFieldDisabled = true;
  public disableField = false;
  public filterFromTime = null;
  public filterToTime = null;
  public currentDate: any = new Date();
  public scheduleDate: any = new Date();
  public curDate = this._dateFormat.transform(this.currentDate, 'yyyy-MM-ddTHH:mm');
  public dropDate = this._dateFormat.transform(new Date(this.currentDate.getTime() + (15 * 60 * 1000)), 'yyyy-MM-ddTHH:mm');
  public ambulanceRequestType: any = [];
  public requestStatus: any[] = [];
  public selectedRequestStatus: any;
  public sourceId = null;
  public destinationId = null;
  requireDestMatchVal: any[];
  requiresourceMatchVal: any[];
  public fromTime: any;
  ambulanceDetail: {};
  isChecked: boolean;
  checkedDataDetail: any;
  checkedDataDetails: any = [];
  checkedDetails: any;
  isDeletable: boolean;
  locSourceOption = null;
  locDestOption = null;
  fromLocValue = '';
  toLocValue='';
  public sourceListItem = [];
  public destListItem = [];
  public ambulanceStatusCheck = false;
  public modifyId = null;
  public isloading: boolean = false;
  isambulanceAdditionalExpanded = false;
  @ViewChild('comments') commentsInput: MatInput;
  @ViewChild('destinationId', { static: true }) destInput: MatInput;
  @ViewChild('sourceId', { static: true }) srcInput: MatInput;
  @ViewChild('destauto', { read: MatAutocompleteTrigger, static: true })
  autoComplete: MatAutocompleteTrigger;
  public assetType = null;
  public activate_btn: any = [];
  requestStatusDetail: any;
  isSaved = false;
  sourceLocName = null;
  initSearchLocList: any = [];
  searchLoc: any = [];
  location: any = [];
  storage: any = [];
  destLocName = null;
  pastPickupTime = false;
  isSourceLoc = true;
  isDestinationLoc = true;
  public cannotAutoComplete = [];
  public priorityFromLocation = [];
  public priorityToLocation = [];
  public defaultPool: any;
  public isAutoComplete = false;
  public checkPriorityConfig = false;
  public mandatoryFields = [];
  @ViewChild('availableambulance') ambulanceInput: MatInput;
  assetCount: any;
  ambulanceGroup = [];
  genderList: any;
  ambRequestCategory: any=[];
  requestCondition: any;
  zoneList: any;
  ambulanceValue: number;
  popHeight: any = 700;
  contentHeight: number = 400;
  public poolName = null;
  public gender = null;
  public isPriority = false;
  destinationGeoCoordinate: {};
  sourceGeoCoordinate: any ={};
  facilityId = null;
  searchText = null;
  loc: any = null;
  geoLoc: any = {};
  public getGeoAmbulanceDetails: any = null;
  ambulanceName = null;
  public patientGender = null;
  public assetUserDetails: any;
  requireEMTMatchVal: any=[];
  emtList: any=[];
  emtId = null;
  doctorId = null;
  pilotListRes = [];
  pilotList = [];
  pilotEnabled = false;
  assetCategoryId = null;
  requireDoctorMatchVal: any=[];
  doctorList: any=[];
  doctorListRes: any=[];
  doctorEnabled = false;
  toHit = false;
  emtListRes: any=[];
  emtEnabled = false;
  defaultLoc = null;
  reasonList: any=[];
  AssetAmbType: any=[];
  locationTo: any=[];
  statusDropdown: any=[];
  selectedRequestStatusList = [];
  othersExist = false;
  statusReasonList: any=[];
  hiddenInputs = [];
  requiredInputs = [];
  driverAvailable = true;
  ambAvailable = true;
  status = null;
  isSwapped = false;

  constructor(
    public fb: FormBuilder,
    public commonService: CommonService,
    public thisDialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public toastr: AppToastService,
    private readonly cookieService: CookieService,
    private readonly _dateFormat: DatePipe
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
    const permission = JSON.parse(localStorage.getItem('permission'));
    this.statusDropdown = permission.dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAB");
    if (data && data.status === 'RQ-CO') {
      this.disableField = true;
    }
    if (data && data.requestId) {
      this.modifyId = this.data.requestId;
      this.editAction = true;
      this.autoAssign = this.data.isAutoAssigned;
      this.searchAmbulance();
      if(this.data?.destinationGeoCoordinate?.hasOwnProperty('landmark')) {
        this.isSwapped = true;
      }
      if(this.isSwapped) {
        this.sourceGeoCoordinate = this.data.destinationGeoCoordinate;
      } else {
        this.sourceGeoCoordinate = this.data.sourceGeoCoordinate;
      }
      this.patientGender = this.data.patient ? this.data.patient.gender : null;
      if (data.status === 'RQ-PLN') {
        this.statusBasedFieldDisabled = true;
      }
    }
  }


  ngOnInit() {
    if(this.data?.destinationGeoCoordinate?.hasOwnProperty('landmark')) {
      this.isSwapped = true;
    }
    this.commonService.getAppTerms('AssetCategory,Zone,AmbRequestCategory,RequestStatus,PoolName,Gender,AssetType,RequestCondition,RequestCancelReason,RequestReassignReason').subscribe((res) => {
      this.requestStatus = res.results.filter(resFilter => resFilter.groupName === 'RequestStatus');
      this.genderList = res.results.filter(resFilter => resFilter.groupName === 'Gender');
      this.ambRequestCategory = res.results.filter(resFilter => resFilter.groupName === 'AmbRequestCategory');
      this.requestCondition = res.results.filter(resFilter => resFilter.groupName === 'RequestCondition');
      this.zoneList = res.results.filter(resFilter => resFilter.groupName === 'Zone');
      this.statusReasonList = res.results.filter(resFilter => resFilter.groupName === 'RequestReassignReason');
    });
    this.getAppTermLink('RQT-AMB', 'RequestCancelReason');
    // this.getGeoAmbulanceLocation();
    if (this.data && this.data.requestId) {
      if(this.data.toStatus === null) {
        this.getAmbulanceAssetUserDetails(this.data.ambulanceId);
      }
      if (this.data && this.data.status === 'RQ-PLN' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-CO' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' ||
        rs.code === 'RQ-RTN' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-RJ' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RAS' ||
        rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-CA' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' ||
        rs.code === this.data.status);
      } else if (this.data && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === this.data.status);
      } else {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-PLN' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
      }
      this.statusDropdown.forEach(element => {
        this.selectedRequestStatus.forEach( element1 => {
          if('DD_MD'+element1.code === element.code) {
            const status = this.selectedRequestStatus.filter(x => x.code === element1.code)
            this.selectedRequestStatusList.push(status[0]);

          }
        })
      })
      this.selectedRequestStatus = this.selectedRequestStatusList;
      this.modifyId =  this.data.requestId;
    }
    this.buildForm();
    if(this.data && this.data.requestId) {
      this.getComments(this.data.requestConditionId);
    }
    if(this.data && this.data.toStatus === 'RQ-RCR') {
      this.ambulanceRequestForm.get('status').setValue('RQ-RCR');
      this.ambulanceRequestForm.get('status').updateValueAndValidity();
      this.ambulanceStatusChange('RQ-RCR');
    }
    if(this.ambRequestCategory.length === 0) {
      this.commonService.getAppTerms('AmbRequestCategory').subscribe((res) => {
        this.ambRequestCategory = res.results.filter(resFilter => resFilter.groupName === 'AmbRequestCategory');
        if(this.ambRequestCategory.length === 1) {
          this.ambulanceRequestForm.controls['requestCategory'].setValue(this.ambRequestCategory[0].code);
        }
      });
    } else {
      if(this.ambRequestCategory.length === 1) {
        this.ambulanceRequestForm.controls['requestCategory'].setValue(this.ambRequestCategory[0].code);
      }
    }
    this.searchToLocation();
    this.getConfig()
  }

  getConfig() {
    this.commonService.getConfigFile('porter-config').subscribe(res => {
      if (res.results != null && res.statusCode == 1) {
        if (res.results.contentObject.hasOwnProperty('ambRequest') && res.results.contentObject.ambRequest.hasOwnProperty('hiddenInputs')) {
          this.hiddenInputs = res.results.contentObject.ambRequest.hiddenInputs;
        }
        if (res.results.contentObject.hasOwnProperty('ambRequest') && res.results.contentObject.ambRequest.hasOwnProperty('disabledInputs')) {
          let disabledInputs = res.results.contentObject.ambRequest.disabledInputs;
          for(let i in disabledInputs) {
            if(this.ambulanceRequestForm.get(disabledInputs[i])) {
              this.ambulanceRequestForm.get(disabledInputs[i]).disable();
            }
          }
        }
        if (res.results.contentObject.hasOwnProperty('ambRequest') && res.results.contentObject.ambRequest.hasOwnProperty('requiredInputs')) {
          this.requiredInputs = res.results.contentObject.ambRequest.requiredInputs;
          for(let i in this.requiredInputs) {
            this.ambulanceRequestForm.get(this.requiredInputs[i]).setValidators(Validators.required);
            this.ambulanceRequestForm.get(this.requiredInputs[i]).updateValueAndValidity();
          }
        }
      }
    });
  }

  private requireDoctorMatch(control: FormControl): ValidationErrors | null {
    if (this.doctorId == null) {
      if(control.value !== null && control.value !== '') {
      this.requireDoctorMatchVal = this.doctorList.filter(resFilter => resFilter.id === control.value);
      if (this.requireDoctorMatchVal.length > 0) {
        this.doctorId = this.requireDoctorMatchVal[0].id;
      }
      if (this.requireDoctorMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getAppTermLink(parentCode, groupName) {
    this.commonService.getAppTermsLink(parentCode).subscribe((res) => {
      if(res.statusCode == 1) {
        this.reasonList = res.results.filter(val => val.groupName == 'RequestCancelReason');
        this.AssetAmbType = res.results.filter(val => val.groupName === 'AssetCategory');
      }
    });
  }
  private requireEMTMatch(control: FormControl): ValidationErrors | null {
    if (this.emtId == null) {
      if(control.value !== null && control.value !== '') {
        this.requireEMTMatchVal = this.emtList.filter(resFilter => resFilter.id === control.value);
        if (this.requireEMTMatchVal.length > 0) {
          this.emtId = this.requireEMTMatchVal[0].id;
        }
        if (this.requireEMTMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getBindingList(id) {
    if (id) {
      const list = this as any as { id: string, name: string }[]
      const listId = list.find(obj => obj.id === id).name;
      return listId;
    } else {
      return '';
    }
  }
  getBindingEMTList(id) {
    if (id) {
      const list = this as any as { id: string, name: string }[]
      const listId = list.find(obj => obj.id === id).name;
      return listId;
    } else {
      return '';
    }
  }
  cancelReasonChange(reason) {
    this.ambulanceRequestForm.get('comments').clearValidators();
    this.ambulanceRequestForm.get('comments').updateValueAndValidity();
    if (reason === 'RCR-OT') {
      this.ambulanceRequestForm.get('comments').setValidators(Validators.required);
      this.ambulanceRequestForm.get('comments').updateValueAndValidity();
    }
  }
  ambulanceCheck(autoAssign) {
    if(autoAssign) {
      this.ambulanceRequestForm.get('ambulanceId').clearValidators();
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('pilotId').clearValidators();
      this.ambulanceRequestForm.get('pilotId').updateValueAndValidity();
    } else {
      this.ambulanceRequestForm.get('ambulanceId').setValidators(Validators.required);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('pilotId').setValidators(Validators.required);
      this.ambulanceRequestForm.get('pilotId').updateValueAndValidity();
    }
  }
  ambulanceStatusChange(status) {
    this.status = status;
    this.ambulanceRequestForm.get('cancelReasonId').clearValidators();
    this.ambulanceRequestForm.get('cancelReasonId').updateValueAndValidity();
    this.ambulanceRequestForm.get('ambulanceId').clearValidators();
    this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();        
    if (status !== null && status === 'RQ-RCR') {
      this.editAction = false;
      this.disableField = false;
      this.reqAmbulanceDetails = [];
      this.modifyId = null;
      this.assetCategoryId = null;
      this.emtEnabled = false;
      this.emtId = null;
      this.doctorEnabled = false;
      this.doctorId = null;
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceId').setValue(null);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceType').setValue(null);
      this.ambulanceRequestForm.get('ambulanceType').updateValueAndValidity();
      this.ambulanceRequestForm.get('pilotId').setValue(null);
      this.ambulanceRequestForm.get('pilotId').updateValueAndValidity();
      this.ambulanceRequestForm.get('doctorId').setValue(null);
      this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      this.ambulanceRequestForm.get('emtId').setValue(null);
      this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
    } else if (status !== null && (status === 'RQ-RAS' || status === 'RQ-CR') ) {
      this.modifyId = this.data.requestId;
      this.editAction = false;
      this.disableField = false;
      this.reqAmbulanceDetails = [];
      this.assetCategoryId = null;
      this.emtEnabled = false;
      this.emtId = null;
      this.doctorEnabled = false;
      this.doctorId = null;
      if(status == 'RQ-CR') {
        this.autoAssign = false;
        this.ambulanceRequestForm.get('isautoAssigned').setValue(this.autoAssign);
        this.ambulanceCheck(this.autoAssign);
        this.searchAmbulance(null)
      }
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceId').setValue(null);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceType').setValue(null);
      this.ambulanceRequestForm.get('ambulanceType').updateValueAndValidity();
      this.ambulanceRequestForm.get('pilotId').setValue(null);
      this.ambulanceRequestForm.get('pilotId').updateValueAndValidity();
      this.ambulanceRequestForm.get('doctorId').setValue(null);
      this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      this.ambulanceRequestForm.get('emtId').setValue(null);
      this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
      if(this.data && this.data.status == 'RQ-RJ') {
        this.searchAmbulance();
      }
    } else if (status !== null && status === 'RQ-PLN') {
      this.editAction = false;
      this.autoAssign = false;
      this.statusBasedFieldDisabled = true;
      this.assetCategoryId = null;
      this.emtEnabled = false;
      this.emtId = null;
      this.doctorEnabled = false;
      this.doctorId = null;
      this.ambulanceRequestForm.get('isautoAssigned').setValue(this.autoAssign);
      this.ambulanceRequestForm.get('isautoAssigned').updateValueAndValidity();
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceId').setValue(null);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceType').setValue(null);
      this.ambulanceRequestForm.get('ambulanceType').updateValueAndValidity();
      this.ambulanceRequestForm.get('pilotId').setValue(null);
      this.ambulanceRequestForm.get('pilotId').updateValueAndValidity();
      this.ambulanceRequestForm.get('doctorId').setValue(null);
      this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      this.ambulanceRequestForm.get('emtId').setValue(null);
      this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
    } else if(this.data.ambulanceId && status === this.data.status) {
      this.modifyId = this.data.requestId;
      this.editAction = true;
      this.ambulanceRequestForm.get('ambulanceId').setValue(this.data.ambulanceId);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.searchAmbulance();
      this.getAmbulanceAssetUserDetails(this.data.ambulanceId);
    } else {
      this.editAction = false;
      if(status == 'RQ-CA') {
        this.ambulanceRequestForm.get('cancelReasonId').setValidators(Validators.required);
        this.ambulanceRequestForm.get('cancelReasonId').updateValueAndValidity();
      }
    }
  }
  statusChange(status) {
    if(status === 'RQ-CA' || status === 'RQ-CO') {
      this.pastPickupTime = false;
    }
    if (status === 'RQ-CR') {
      this.editAction = true;
      this.statusBasedFieldDisabled = true;
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
    } else if (status === 'RQ-PLN') {
      this.editAction = true;
      this.autoAssign = false;
      this.ambulanceRequestForm.get('isautoAssigned').setValue(this.autoAssign);
      this.ambulanceRequestForm.get('isautoAssigned').updateValueAndValidity();
      this.statusBasedFieldDisabled = true;
    } else if (status === 'RQ-CA') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'],
        disableClose: true,
        data: {
          title: 'Ambulance Request Status',
          message: 'Do you want to change the status?',
          buttonText: { cancel: 'No', ok: 'Yes' },
          ambulanceReqStatusChange: true,
          isRemark: 1,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result !== 'Yes') {
          this.ambulanceRequestForm.get('status').setValue(this.data.status);
          this.ambulanceRequestForm.get('status').updateValueAndValidity();
        }
      });
    } else if (status === 'RQ-RTN' || status === 'RQ-RCR') {
      this.editAction = false;
      this.disableField = false;
      this.reqAmbulanceDetails = [];
      this.modifyId = null;
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      this.ambulanceRequestForm.get('ambulanceId').setValue([]);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      if (status === 'RQ-RTN') {
        if (this.data.sourceBedId) {
          this.getCurrentLocationDetails(this.data.sourceBedId, 'drop');
        } else {
          this.getCurrentLocationDetails(this.data.sourceId, 'drop');
        }
        if (this.data.destinationBedId !== null) {
          this.getCurrentLocationDetails(this.data.destinationBedId, 'pickup');
        } else {
          this.getCurrentLocationDetails(this.data.destinationId, 'pickup');
        }
      }
    } else if (status === 'RQ-CO' || status === 'RQ-RJ') {
      this.editAction = true;
      this.disableField = true;
      this.modifyId =  this.data.requestId;
      this.reqAmbulanceDetails = this.data.performer;
      this.ambulanceRequestForm.get('ambulanceId').setValue(this.selectedAmbulance);
      this.ambulanceRequestForm.get('ambulanceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('startTime').setValue(this.data.startTime);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      if (status === 'RQ-CO') {
        if (this.data.sourceBedId !== null) {
          this.getCurrentLocationDetails(this.data.sourceBedId, 'pickup');
        } else {
          this.getCurrentLocationDetails(this.data.sourceId, 'pickup');
        }
        if (this.data.destinationBedId !== null) {
          this.getCurrentLocationDetails(this.data.destinationBedId, 'drop');
        } else {
          this.getCurrentLocationDetails(this.data.destinationId, 'drop');
        }
      }
    }
  }
  getGeoAmbulanceLocation() {
    this.commonService.getGeoAmbulanceLocation().subscribe(res => {
      if(res.results.length !== 0) {
        this.getGeoAmbulanceDetails = res.results;
      }
    });
  }
  getLocation(value) {
    if(this.searchText === value && value !== null && this.geoLoc.hasOwnProperty('latlng')) {
      this.loc = {"type": "latlong", "threshold": 150, "ambulanceLatlong": this.defaultLoc, 
      "searchText": null,  "searchLatLng": this.geoLoc, availableAmbulance : this.getGeoAmbulanceDetails,
      biasLatLng: this.defaultLoc};
    } else {
      this.searchText = value;
      this.loc = {"type": "latlong", "threshold": 150, "ambulanceLatlong": this.defaultLoc, 
      "searchText": value,  "searchLatLng": null, availableAmbulance : this.getGeoAmbulanceDetails,
      biasLatLng: this.defaultLoc}
    }
    const dialogRef = this.dialog.open(GoogleMapComponent,
    { data: this.loc, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sourceGeoCoordinate = {
          "lat": result.latlng.lat,
          "lng": result.latlng.lng,
          "givenAddress": this.ambulanceRequestForm.get("sourceId").value,
          "address": result.formattedAddress
        };
        this.geoLoc = {'latlng': {'lat': result.latlng.lat, 'lng': result.latlng.lng, 
        "givenAddress": this.ambulanceRequestForm.get("sourceId").value,
        "address": result.formattedAddress}}
        this.ambulanceRequestForm.get('sourceId').setValue(result.formattedAddress);
        this.getNearestAmbFacility(result.latlng.lat, result.latlng.lng, true, true, 'K')
      } else {
        this.ambulanceRequestForm.get("sourceId").setValue(null);
        if(this.ambulanceRequestForm.get("sourceId").value !== null &&
        this.ambulanceRequestForm.get("sourceId").value !== '' &&
        this.geoLoc.hasOwnProperty('latlng')) {
          this.sourceGeoCoordinate = {
            "lat": this.geoLoc.latlng.lat,
            "lng": this.geoLoc.latlng.lng,
            "address": this.ambulanceRequestForm.get("sourceId").value,
          };
          this.getNearestAmbFacility(this.geoLoc.latlng.lat, this.geoLoc.latlng.lng, true, true, 'K')
        } else {
          this.sourceGeoCoordinate = {};
        }
      }
    });
  }
  getNearestAmbFacility(lat,lng, isAmb, isFacility, unit) {
    let fromTime = this._dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
    this.commonService.getNearestAmbFacility(fromTime,lat,lng, isAmb, isFacility, unit).subscribe(res => {
      if(res.statusCode == 1) {
        if(this.ambulanceRequestForm.controls.isautoAssigned.value == false && res.results.ambulance.length && this.autoAssign) {
          this.searchAmbulanceList = res.results.ambulance;
          this.ambulanceRequestForm.controls.ambulanceId.setValue(this.searchAmbulanceList[0]['id']);
          let event = {'value' :this.searchAmbulanceList[0]['id'], 'selected' : true};
          this.getAmbulanceDetails(this.searchAmbulanceList[0], event)
        }
        if(res.results.locations.length) {
          this.searchDestLocList = res.results.locations;
          console.log(this.searchDestLocList)
          this.bindDestLocation(false);
        }
      }      
    })
  }
  bindDestLocation(isFacility) {
    if (this.searchDestLocList.length !== 0) {
      const facilityId = localStorage.getItem(btoa('facilityId'));
      this.facilityId = this.searchDestLocList[0].facilityId;
      let loc = this.data?.destinationGeoCoordinate?.locationId
      if(this.isSwapped) {
        loc = this.data?.sourceGeoCoordinate?.locationId;
      }
      if(this.modifyId && this.data.destinationGeoCoordinate !== null) {
        this.locationTo = this.searchDestLocList.filter(res => res.locationId === loc);
      } else if(isFacility) {
        this.locationTo = this.searchDestLocList.filter(res => res.facilityId === facilityId);
      } else {
        this.locationTo = this.searchDestLocList;
      }
      if(this.locationTo.length !== 0) {
        this.defaultLoc = this.locationTo[0].geoCoordinate;
        this.ambulanceRequestForm.get('destinationId').setValue(this.locationTo[0].locationId);
        this.facilityId = this.locationTo[0].facilityId;
        if (this.defaultLoc !== null) {
          this.destinationGeoCoordinate = {
            "lat": this.defaultLoc.lat,
            "lng": this.defaultLoc.lng,
            "address": this.defaultLoc.address,
            "locationId": this.locationTo[0].locationId
          }
        } else {
          this.destinationGeoCoordinate = {};
        }
      } else {
        this.defaultLoc = this.searchDestLocList[0].geoCoordinate;
        this.ambulanceRequestForm.get('destinationId').setValue(this.searchDestLocList[0].locationId);
        if (this.defaultLoc !== null) {
          this.destinationGeoCoordinate = {
            "lat": this.defaultLoc.lat,
            "lng": this.defaultLoc.lng,
            "address": this.defaultLoc.address,
            "locationId": this.searchDestLocList[0].locationId
          }
        } else {
          this.destinationGeoCoordinate = {};
        }
      }
    }
  }

  ngAfterViewInit() {
    this.commonService.getAppTerms('RequestStatus').subscribe((res) => {
      if (this.data && this.data.status === 'RQ-PLN' && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-CA' || rs.code === 'RQ-CR' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-CO' && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-RCR' || rs.code === 'RQ-RTN' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-RJ' && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-RAS' || rs.code === 'RQ-CA' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-CA' && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-RCR' || rs.code === this.data.status);
      } else if (this.data && (this.data.status === 'RQ-IP' || this.data.status === 'RQ-AR' || this.data.status === 'RQ-AS' || this.data.status === 'RQ-CR') && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-CA' || rs.code === 'RQ-RAS' || rs.code === this.data.status);
      } else if (this.data && this.data.requestId != null) {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-CA' || rs.code === this.data.status);
      } else {
        this.selectedRequestStatus = res.results.filter(rs => rs.code === 'RQ-PLN' || 
        rs.code === 'RQ-CR' || rs.code === this.data.status);
      }
      if(this.modifyId) {
        this.statusDropdown.forEach(element => {
          this.selectedRequestStatus.forEach( element1 => {
            if('DD_MD'+element1.code === element.code) {
              const status = this.selectedRequestStatus.filter(x => x.code === element1.code)
              this.selectedRequestStatusList.push(status[0]);
            }
          })
        })
      } else {
        this.statusDropdown.forEach(element => {
          this.selectedRequestStatus.forEach( element1 => {
            if('DD_'+element1.code === element.code) {
              const status = this.selectedRequestStatus.filter(x => x.code === element1.code)
              this.selectedRequestStatusList.push(status[0]);
            }
          })
        })
      }
      this.selectedRequestStatus = this.selectedRequestStatusList;
    });
  }

  public buildForm() {
    this.ambulanceRequestForm = this.fb.group({
      isautoAssigned: [this.autoAssign ? this.autoAssign : false],
      ambulanceId: [this.data.ambulanceId ? this.data.ambulanceId : null],
      patientName: [this.data.patientName ? this.data.patientName : null],
      sourceId: [this.data.sourceAddress ? this.data.sourceAddress : null, [Validators.required]],
      destinationId: [ this.destinationId ? this.destinationId : null, [Validators.required]],
      startTime: [ this.data.startTime ? this.data.startTime : this.curDate, [Validators.required]],
      status: [this.data.status ? this.data.status: 'RQ-CR'],
      age: [this.data.patientAge ? this.data.patientAge : null],
      mobileNo: [this.data.patientMobileNo ? this.data.patientMobileNo : null, [Validators.maxLength(10), Validators.minLength(10), Validators.pattern(/^[0-9]*$/)]],
      gender: [this.patientGender ? this.patientGender : null],
      remarks: [this.data.remarks ? this.data.remarks : null, [Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9 _]*$/)]],
      requestCategory: [this.data.requestCategory ? this.data.requestCategory :null],
      callerName: [this.data.patient ? this.data.patient.callerName : null],
      alternateContact: [this.data.patient ? this.data.patient.alternateContact : null, [Validators.maxLength(10), Validators.minLength(10), Validators.pattern(/^[0-9]*$/)]],
      requestConditionId: [this.data.requestConditionId ? this.data.requestConditionId : null],
      ambulanceType: [null],
      pilotId: [this.data.pilotId ? this.data.pilotId : null],
      doctorId: [this.data.doctorName ? this.data.doctorName : null ,[this.requireDoctorMatch.bind(this)]],
      emtId: [this.data.emtName ? this.data.emtName : null , [this.requireEMTMatch.bind(this)]],
      zoneId: [this.data.zoneId ? this.data.zoneId : null],
      dutySlipNo: [this.data.dutySlipNo ? this.data.dutySlipNo : null],
      pcrNo: [this.data.pcrNo ? this.data.pcrNo : null],
      cancelReasonId: [this.data.cancelReasonId ? this.data.cancelReasonId : null],
      statusReasonId: [this.data.statusReasonId ? this.data.statusReasonId : null],
      isAcknowledge : [this.data.acknowledgeTime ? (this.data.acknowledgeTime !== null) : false],
      requestConditionText: [this.data.requestConditionText ? this.data.requestConditionText : null],
      lastModifiedOn: [this.data.lastModifiedOn ? this.data.lastModifiedOn : null],
      landmark: [null],
      comments: [this.data.comments ? this.data.comments : null],
      assignedAttender: [this.data?.nonPerformer?.find(item => item.tagAssociationTypeId === 'ASSIGNED_ATTENDANT')?.name ?? null],
      assignedMedicalOfficer: [this.data?.nonPerformer?.find(item => item.tagAssociationTypeId === 'ASSIGNED_MEDICAL_OFFICER')?.name ?? null],
      assignedNurse: [this.data?.nonPerformer?.find(item => item.tagAssociationTypeId === 'ASSIGNED_NURSE')?.name ?? null],
    });
    if(this.data.sourceGeoCoordinate && this.data.sourceGeoCoordinate.hasOwnProperty('landmark')) {
      this.ambulanceRequestForm.get('landmark').setValue(this.data.sourceGeoCoordinate['landmark']);
      this.ambulanceRequestForm.get('landmark').updateValueAndValidity();
    }
    if(this.isSwapped) {
      this.ambulanceRequestForm.get('sourceId').setValue(this.data.destinationAddress);
      this.ambulanceRequestForm.get('sourceId').updateValueAndValidity();
      this.ambulanceRequestForm.get('destinationId').setValue(this.data.sourceGeoCoordinate.locationId);
      this.ambulanceRequestForm.get('destinationId').updateValueAndValidity();
      if(this.data.destinationGeoCoordinate && this.data.destinationGeoCoordinate.hasOwnProperty('landmark')) {
        this.ambulanceRequestForm.get('landmark').setValue(this.data.destinationGeoCoordinate['landmark']);
        this.ambulanceRequestForm.get('landmark').updateValueAndValidity();
      }
    }
    if(!this.autoAssign) {
      this.searchAmbulance(null);
      this.ambulanceCheck(this.autoAssign);
    }
    
  }
  getComments(code) {
    if(code !== null && code === 'RCD-OT') {
      this.othersExist = true;
    } else {
      this.othersExist = false;
      this.ambulanceRequestForm.get('requestConditionText').setValue(null);
    }
  }
  searchDoctorNamelist(event) {
    this.toHit = event.toHit;
    this.doctorId = null;
    this.doctorEnabled = true;
    this.ambulanceRequestForm.get('doctorId').setValidators(this.requireDoctorMatch.bind(this));
    this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
    if(event.text.length >= 2) {
      if (this.toHit == true) {
        this.commonService.getRoleName(event.text, 'RO-DO').subscribe(res => {
          this.doctorListRes = res.results;
          this.doctorList = this.doctorListRes;
        });
      } else {
        this.doctorList = this.doctorListRes;
      }
    }
  }

  checkAvailability(data, type) {
    if (type === 'driver') {
      this.driverAvailable = data?.isAvailable;
    } else {
      this.ambAvailable = data?.isAvailable;
    }
    this.setStatus();
  }

  setStatus() {
    if (this.driverAvailable === false || this.ambAvailable === false) {
      this.ambulanceRequestForm.controls['status'].setValue('RQ-PLN');
    } else {
      this.ambulanceRequestForm.controls['status'].setValue(this.status !== null ? this.status : this.data.status ? this.data.status: 'RQ-CR');
    }
  }
  
  searchEMTNamelist(event) {
    this.toHit = event.toHit;
    this.emtId = null;
    this.emtEnabled = true;
    this.ambulanceRequestForm.get('emtId').setValidators(this.requireEMTMatch.bind(this));
    this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
    if(event.text.length >= 2) {
      if (this.toHit == true) {
        this.commonService.getRoleName(event.text, 'RO-EMT').subscribe(res => {
          this.emtListRes = res.results;
          this.emtList = this.emtListRes;
        });
      } else {
        this.emtList = this.emtListRes;
      }
    }
  }

  private requireDestLocationMatch(control: FormControl): ValidationErrors | null {
    if (this.destinationId == null) {
      if (control.value !== null && control.value !== '') {
      this.requireDestMatchVal = this.destListItem.filter(resFilter => resFilter.id === control.value);
      if (this.requireDestMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getDestinationLocationList(id: number) {
    if (id) {
      const dest = this as any as { id: number, name: string, fullName: string }[]
      return dest.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }
  public SaveRequest() {
    this.isloading = true;
    const validatePickupTime = this._dateFormat.transform(this.ambulanceRequestForm.controls['startTime'].value, 'yyyy-MM-ddTHH:mm');
    this.curDate = this._dateFormat.transform(new Date(), 'yyyy-MM-ddTHH:mm');
    if (validatePickupTime < this.curDate) {
      this.ambulanceRequestForm.get('startTime').setValue(this.curDate);
      this.ambulanceRequestForm.get('startTime').updateValueAndValidity();
      this.dateTimeValidation(this.curDate, 'pickup');
    }
    this.isSaved = true;
    const createAmbulanceRequest = new CreateAmbulanceRequest(null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, null);
    createAmbulanceRequest.type = "RQT-AMB";
    createAmbulanceRequest.patient = {
      "firstName": this.ambulanceRequestForm.controls["patientName"].value,
      "gender": this.ambulanceRequestForm.controls["gender"].value,
      "age": this.ambulanceRequestForm.controls["age"].value,
      "mobileNo": this.ambulanceRequestForm.controls["mobileNo"].value,
      "callerName": this.ambulanceRequestForm.controls["callerName"].value,
      "alternateContact": this.ambulanceRequestForm.controls["alternateContact"].value,
    };
    createAmbulanceRequest.remarks = this.ambulanceRequestForm.controls["remarks"].value;
    createAmbulanceRequest.facilityId = this.facilityId;
    // if(this.ambulanceRequestForm.get("sourceId").value !== null) {
    //   this.sourceGeoCoordinate['address'] = this.ambulanceRequestForm.get("sourceId").value
    // }
    if(this.isSwapped) {
      createAmbulanceRequest.destinationGeoCoordinate = this.sourceGeoCoordinate;
      createAmbulanceRequest.sourceGeoCoordinate = this.destinationGeoCoordinate;
      if(createAmbulanceRequest.destinationGeoCoordinate) {
        createAmbulanceRequest.destinationGeoCoordinate["landmark"] = this.ambulanceRequestForm.controls["landmark"].value;
      }
    } else {
      createAmbulanceRequest.sourceGeoCoordinate = this.sourceGeoCoordinate;
      createAmbulanceRequest.destinationGeoCoordinate = this.destinationGeoCoordinate;
      if(createAmbulanceRequest.sourceGeoCoordinate) {
        createAmbulanceRequest.sourceGeoCoordinate["landmark"] = this.ambulanceRequestForm.controls["landmark"].value;
      }
    }
    createAmbulanceRequest.startTime = this._dateFormat.transform(
      this.ambulanceRequestForm.controls["startTime"].value,
      "yyyy-MM-dd HH:mm:ss"
    );
    const date = this._dateFormat.transform(this.ambulanceRequestForm.controls["startTime"].value , "yyyy-MM-dd HH:mm:ss")
    createAmbulanceRequest.endTime = this._dateFormat.transform(
      new Date(date).getTime() + (5 * 60 * 1000) , "yyyy-MM-dd HH:mm:ss");
    createAmbulanceRequest.isautoAssigned = this.autoAssign;
    createAmbulanceRequest.porterCount = 1;
    if (!this.autoAssign) {
      createAmbulanceRequest.performer = [
        {
          "id": this.ambulanceId,
          "name": this.ambulanceName,
          "locationId": null,
          "type": "TAT-AS"
        }
      ];
    } else {
      createAmbulanceRequest.performer = [];
    }
    createAmbulanceRequest.nonPerformer = [];
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-PLN') {
      createAmbulanceRequest.status = 'RQ-PLN';
    } else {
      createAmbulanceRequest.status = 'RQ-CR';
    }
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-CA') {
      createAmbulanceRequest.cancelReasonId = this.ambulanceRequestForm.controls['cancelReasonId'].value;
    } else {
      createAmbulanceRequest.cancelReasonId = null;
    }
    createAmbulanceRequest.comments = this.ambulanceRequestForm.controls['comments'].value;
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-RAS') {
      createAmbulanceRequest.statusReasonId = this.ambulanceRequestForm.controls['statusReasonId'].value;
    } else {
      createAmbulanceRequest.statusReasonId = null;
    }
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-CO' &&
    this.ambulanceRequestForm.controls['isAcknowledge'].value === true) {
      createAmbulanceRequest.acknowledgeTime = this._dateFormat.transform(this.currentDate , "yyyy-MM-dd HH:mm:ss");
    } else {
      createAmbulanceRequest.acknowledgeTime = null;
    }

    if (this.ambulanceStatusCheck) {
      if (this._dateFormat.transform(this.ambulanceRequestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
          this._dateFormat.transform(this.scheduleDate.getTime() + (5 * 60 * 1000), 'yyyy-MM-dd HH:mm')) {
        createAmbulanceRequest.status = 'RQ-SH';
      } else {
        createAmbulanceRequest.status = 'RQ-PLN';
      }
    }
    createAmbulanceRequest.requestCategory = this.ambulanceRequestForm.controls["requestCategory"].value;
    createAmbulanceRequest.requestConditionId = this.ambulanceRequestForm.controls["requestConditionId"].value;
    createAmbulanceRequest.doctorId = this.doctorId;
    createAmbulanceRequest.emtId = this.emtId;
    createAmbulanceRequest.pilotId = this.ambulanceRequestForm.controls["pilotId"].value;
    createAmbulanceRequest.assetCategory = this.ambulanceRequestForm.controls["ambulanceType"].value;
    createAmbulanceRequest.pcrNo = this.ambulanceRequestForm.controls["pcrNo"].value;
    createAmbulanceRequest.zoneId = this.ambulanceRequestForm.controls["zoneId"].value;
    createAmbulanceRequest.dutySlipNo = this.ambulanceRequestForm.controls["dutySlipNo"].value;
    createAmbulanceRequest.initiatedTime = this.data.initiatedTime;
    createAmbulanceRequest.requestConditionText = this.ambulanceRequestForm.controls["requestConditionText"].value; 
    createAmbulanceRequest.lastModifiedOn = this.ambulanceRequestForm.controls["lastModifiedOn"].value;
    if(this.ambulanceRequestForm.controls["assignedAttender"].value) {
      createAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_ATTENDANT',
        name : this.ambulanceRequestForm.controls["assignedAttender"].value
      })
    }
    if(this.ambulanceRequestForm.controls["assignedMedicalOfficer"].value) {
      createAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_NURSE',
        name : this.ambulanceRequestForm.controls["assignedMedicalOfficer"].value
      })
    }
    if(this.ambulanceRequestForm.controls["assignedNurse"].value) {
      createAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_MEDICAL_OFFICER',
        name : this.ambulanceRequestForm.controls["assignedNurse"].value
      })
    }
    console.log(createAmbulanceRequest);
    this.commonService.saveAmbulanceRequest(createAmbulanceRequest).subscribe(
      (res) => {
        if (res.statusCode === 1) {
          this.isloading = false;
          this.thisDialogRef.close(res.results);
          this.ambulanceRequestForm.reset();
        }
        this.isSaved = false;
        this.toastr.success("Success", `${res.message}`);
      },
      (error) => {
        this.isloading = false;
        if (error.error.errorCode === 'TWAPI0029') {
          // this.toastr.error('Error', `${'Ambulance not available'}`);
          this.checkAvailableAmbulance('post')
        } else {
          this.toastr.error("Error", `${error.error.message}`);
        }
        this.isSaved = false;
      }
    );
  }
  UpdateRequestStatus(data, status) {
    if(data.performer.length > 0) {
      this.requestStatusDetail = {"requestDetailId": data.performer[0].requestDetailId,"status": status,
      "performerId": data.performer[0].id, "performerType": data.performer[0].tagAssociationTypeId,
      "lastModifiedOn" : this.ambulanceRequestForm.controls["lastModifiedOn"].value
      }
    }
  }
  UpdateRequest(id) {
    this.isloading = true;
    this.isSaved = true;
    const editAmbulanceRequest = new EditAmbulanceRequest(null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, null);
    editAmbulanceRequest.type = "RQT-AMB";
    editAmbulanceRequest.patient = {
      "id": this.data.patient.id,
      "firstName": this.ambulanceRequestForm.controls["patientName"].value,
      "gender": this.ambulanceRequestForm.controls["gender"].value,
      "age": this.ambulanceRequestForm.controls["age"].value,
      "mobileNo": this.ambulanceRequestForm.controls["mobileNo"].value,
      "callerName": this.ambulanceRequestForm.controls["callerName"].value,
      "alternateContact": this.ambulanceRequestForm.controls["alternateContact"].value,
    };
    if(this.ambulanceRequestForm.controls["remarks"].value !== null) {
      editAmbulanceRequest.remarks = this.ambulanceRequestForm.controls["remarks"].value.trim();
    } else {
      editAmbulanceRequest.remarks = this.ambulanceRequestForm.controls["remarks"].value;
    }
    editAmbulanceRequest.facilityId = this.facilityId;
    // if(this.ambulanceRequestForm.get("sourceId").value !== null) {
    //   this.sourceGeoCoordinate['address'] = this.ambulanceRequestForm.get("sourceId").value
    // }
    if(this.isSwapped) {
      editAmbulanceRequest.destinationGeoCoordinate = this.sourceGeoCoordinate;
      editAmbulanceRequest.sourceGeoCoordinate = this.destinationGeoCoordinate;
      if(editAmbulanceRequest.destinationGeoCoordinate){
        editAmbulanceRequest.destinationGeoCoordinate["landmark"] = this.ambulanceRequestForm.controls["landmark"].value;
      }
    } else {
      editAmbulanceRequest.sourceGeoCoordinate = this.sourceGeoCoordinate;
      editAmbulanceRequest.destinationGeoCoordinate = this.destinationGeoCoordinate;
      if(editAmbulanceRequest.sourceGeoCoordinate){
        editAmbulanceRequest.sourceGeoCoordinate["landmark"] = this.ambulanceRequestForm.controls["landmark"].value;
      }
    }
    editAmbulanceRequest.startTime = this._dateFormat.transform(
      this.ambulanceRequestForm.controls["startTime"].value,
      "yyyy-MM-dd HH:mm:ss"
    );
    const date = this._dateFormat.transform(this.ambulanceRequestForm.controls["startTime"].value , "yyyy-MM-dd HH:mm:ss")
    editAmbulanceRequest.endTime = this._dateFormat.transform(
      new Date(date).getTime() + (5 * 60 * 1000) , "yyyy-MM-dd HH:mm:ss");
    editAmbulanceRequest.isautoAssigned = this.autoAssign;
    editAmbulanceRequest.porterCount = 1;
    editAmbulanceRequest.requestId = id;
    if(!this.autoAssign) {
      if(this.data.status === this.ambulanceRequestForm.controls["status"].value) {
        editAmbulanceRequest.performer = this.data.performer;
      } else {
        editAmbulanceRequest.performer = [
          {
            "id": this.ambulanceId,
            "name": this.ambulanceName,
            "locationId": null,
            "type": "TAT-AS"
          }
        ];
      }
    } else {
      editAmbulanceRequest.performer = [];
    }
    editAmbulanceRequest.nonPerformer = [];
    editAmbulanceRequest.status = this.ambulanceRequestForm.controls["status"].value;
    if (this.ambulanceStatusCheck) {
      if (this._dateFormat.transform(this.ambulanceRequestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
          this._dateFormat.transform(this.scheduleDate.getTime() + (5 * 60 * 1000), 'yyyy-MM-dd HH:mm')) {
        editAmbulanceRequest.status = 'RQ-SH';
      } else {
        editAmbulanceRequest.status = 'RQ-WT';
      }
    }
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-CA') {
      editAmbulanceRequest.cancelReasonId = this.ambulanceRequestForm.controls['cancelReasonId'].value;
    } else {
      editAmbulanceRequest.cancelReasonId = null;
    }
    editAmbulanceRequest.comments = this.ambulanceRequestForm.controls['comments'].value;
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-RAS') {
      editAmbulanceRequest.statusReasonId = this.ambulanceRequestForm.controls['statusReasonId'].value;
    } else {
      editAmbulanceRequest.statusReasonId = null;
    }
    if (this.ambulanceRequestForm.controls['status'].value === 'RQ-CO' &&
    this.ambulanceRequestForm.controls['isAcknowledge'].value === true) {
      editAmbulanceRequest.acknowledgeTime = this._dateFormat.transform(this.currentDate , "yyyy-MM-dd HH:mm:ss");
    } else {
      editAmbulanceRequest.acknowledgeTime = null;
    }
    editAmbulanceRequest.requestCategory = this.ambulanceRequestForm.controls["requestCategory"].value;
    editAmbulanceRequest.requestConditionId = this.ambulanceRequestForm.controls["requestConditionId"].value;
    editAmbulanceRequest.doctorId = this.doctorId;
    editAmbulanceRequest.emtId = this.emtId;
    editAmbulanceRequest.pilotId = this.ambulanceRequestForm.controls["pilotId"].value;
    editAmbulanceRequest.assetCategory = this.ambulanceRequestForm.controls["ambulanceType"].value;
    editAmbulanceRequest.pcrNo = this.ambulanceRequestForm.controls["pcrNo"].value;
    editAmbulanceRequest.zoneId = this.ambulanceRequestForm.controls["zoneId"].value;
    editAmbulanceRequest.dutySlipNo = this.ambulanceRequestForm.controls["dutySlipNo"].value;
    editAmbulanceRequest.initiatedTime = this.data.initiatedTime;
    editAmbulanceRequest.requestConditionText = this.ambulanceRequestForm.controls["requestConditionText"].value;
    editAmbulanceRequest.lastModifiedOn = this.ambulanceRequestForm.controls["lastModifiedOn"].value;
    if(this.ambulanceRequestForm.controls["assignedAttender"].value) {
      editAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_ATTENDANT',
        name : this.ambulanceRequestForm.controls["assignedAttender"].value
      })
    }
    if(this.ambulanceRequestForm.controls["assignedMedicalOfficer"].value) {
      editAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_NURSE',
        name : this.ambulanceRequestForm.controls["assignedMedicalOfficer"].value
      })
    }
    if(this.ambulanceRequestForm.controls["assignedNurse"].value) {
      editAmbulanceRequest.nonPerformer.push({
        id: null,
        type: 'ASSIGNED_MEDICAL_OFFICER',
        name : this.ambulanceRequestForm.controls["assignedNurse"].value
      })
    }
    console.log(editAmbulanceRequest);
    this.commonService.updateAmbulanceRequest(editAmbulanceRequest).subscribe(
      (result) => {
        this.isSaved = false;
        if (result.statusCode === 1) {
          this.isloading = false;
          this.thisDialogRef.close(result.results);
          this.ambulanceRequestForm.reset();
        }
        this.toastr.success("Success", `${result.message}`);
      },
      (error) => {
        this.isSaved = false;
        this.isloading = false;
        if (error.error.errorCode === 'TWAPI0045') {
          this.toastr.error('Error', `${'Ambulance not available'}`);
        } else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }
  getCurrentLocationDetails(id, fieldName) {
    this.commonService.getRequestFromLocation(id).subscribe((res) => {
      if (fieldName === "pickup") {
        this.locFromId = id;
        this.locSourceOption = id;
        this.ambulanceRequestForm.controls["sourceId"].setValue(
          res.results.fullName
        );
        this.ambulanceRequestForm.get("sourceId").updateValueAndValidity();
        this.sourceId = res.results.fullName;
      } else {
        this.locToId = id;
        this.locDestOption = id;
        this.ambulanceRequestForm.controls["destinationId"].setValue(
          res.results.fullName
        );
        this.ambulanceRequestForm.get("destinationId").updateValueAndValidity();
        this.destinationId = res.results.fullName;
      }
    });
  }
  searchToLocation() {
    this.destinationId = null;
    const id = localStorage.getItem('customerId');
    this.commonService.getAmbulanceLocation(id).subscribe((res) => {
      this.searchDestLocList = res.results;
      this.bindDestLocation(true);
    });
  }
  getDestCoordinates(data) {
    this.facilityId = data.facilityId;
    if (data.geoCoordinate !== null) {
      this.defaultLoc = data.geoCoordinate;
      this.destinationGeoCoordinate = {
        "lat": data.geoCoordinate.lat,
        "lng": data.geoCoordinate.lng,
        "address": data.geoCoordinate.address,
        "locationId": data.locationId
      }
    } else {
      this.defaultLoc = null;
      this.destinationGeoCoordinate = {};
    }
  }
  getSearchDetails(data, type) {
    if (type === "pickup") {
      this.locFromId = data.id;
      this.locSourceOption = data.id;
      this.srcLocationTypeId = data.locationTypeId;
      this.srcParentLocationId = data.parentId;
      this.searchSourceLocList = [];
      this.sourceLocName = data.name;
      if(this.locFromId === null){
        this.isSourceLoc = false;
        this.ambulanceRequestForm.controls.sourceId.setValue(null);
      } else {
        this.isSourceLoc = true;
      }
    } else if (type === "drop") {
      this.locToId = data.id;
      this.locDestOption = data.id;
      this.destLocationTypeId = data.locationTypeId;
      this.destParentLocationId = data.parentId;
      this.searchDestLocList = [];
      this.destLocName = data.name;
      if(this.locToId === null) {
        this.isDestinationLoc = false;
        this.ambulanceRequestForm.controls.destinationId.setValue(null);
      } else {
        this.isDestinationLoc = true;
      }
    }
  }
  getAmbulanceDetails(data, event) {
    this.ambulanceId = data.id;
    this.ambulanceName = data.name;
    this.isChecked = event.selected;
    if (this.isChecked) {
      this.reqAmbulanceDetails = this.reqAmbulanceDetails.filter(x => x.id !== event.value);
      this.reqAmbulanceDetails.push({
        'currentLocationId': data.currentLocationId,
        'floorId': data.floorId,
        'floorName': data.floorName,
        'fullName': data.fullName,
        'id': data.id,
        'locationName': data.locationName,
        'name': data.name,
        'requestDetailId': data.requestDetailId,
        'status': data.status,
        'tagAssociationTypeId': data.tagAssociationTypeId,
        'tagId': data.tagId,
        'isDeletable': false,
      });
      this.doctorEnabled = false;
      this.emtEnabled = false;
      this.getAmbulanceAssetUserDetails(this.ambulanceId);
    } else {
      const locIndex = this.reqAmbulanceDetails.findIndex(res => res.id === event.value);
      if (locIndex !== -1 && this.reqAmbulanceDetails[locIndex].requestDetailId) {
        this.reqAmbulanceDetails[locIndex]['isDeletable'] = true;
        this.checkedDataDetails.push({
          'currentLocationId': this.reqAmbulanceDetails[locIndex].currentLocationId,
          'floorId': this.reqAmbulanceDetails[locIndex].floorId,
          'floorName': this.reqAmbulanceDetails[locIndex].floorName,
          'fullName': this.reqAmbulanceDetails[locIndex].fullName,
          'id': this.reqAmbulanceDetails[locIndex].id,
          'locationName': this.reqAmbulanceDetails[locIndex].locationName,
          'name': this.reqAmbulanceDetails[locIndex].name,
          'requestDetailId': this.reqAmbulanceDetails[locIndex].requestDetailId,
          'status': this.reqAmbulanceDetails[locIndex].status,
          'tagAssociationTypeId': this.reqAmbulanceDetails[locIndex].tagAssociationTypeId,
          'tagId': this.reqAmbulanceDetails[locIndex].tagId,
          'isDeletable': true,
        });
        for (let i=0; i < this.checkedDataDetails.length; i++) {
          this.reqAmbulanceDetails = this.reqAmbulanceDetails.filter(x => x.id !== this.checkedDataDetails[i].id);
          this.reqAmbulanceDetails.push(this.checkedDataDetails[i])
        }
      } else {
        this.reqAmbulanceDetails = this.reqAmbulanceDetails.filter(x => x.id !== event.value);
      }
      this.ambulanceId = data.id;
      this.ambulanceName = data.name;
    }
  }
  getAmbulanceAssetUserDetails(id) {
    if(id) {
    this.commonService.getAssetUserDetails(id).subscribe(res => {
      this.assetUserDetails = res.results[0];
      if (this.data && this.data.doctorId !== null && this.data.ambulanceId === id) {
        this.doctorEnabled = false;
        this.doctorId = this.data.doctorId;
        this.ambulanceRequestForm.patchValue({
          'doctorId': this.data.doctorName,
        });
        this.ambulanceRequestForm.get('doctorId').setValidators(null);
        this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      } else if(this.assetUserDetails.doctorId !== null && this.assetUserDetails.assetId === id) {
        this.doctorEnabled = false;
        this.doctorId = this.assetUserDetails.doctorId;
        this.ambulanceRequestForm.patchValue({
          'doctorId': this.assetUserDetails.doctorName,
        });
        this.ambulanceRequestForm.get('doctorId').setValidators(null);
        this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      } else {
        this.doctorEnabled = false;
        this.doctorId = null;
        this.ambulanceRequestForm.patchValue({
          'doctorId': null,
        });
        this.ambulanceRequestForm.get('doctorId').setValidators(this.requireDoctorMatch.bind(this));
        this.ambulanceRequestForm.get('doctorId').updateValueAndValidity();
      }
      if (this.data && this.data.emtId !== null && this.data.ambulanceId === id) {
        this.emtEnabled = false;
        this.emtId = this.data.emtId;
        this.ambulanceRequestForm.patchValue({
          'emtId': this.data.emtName,
        });
        this.ambulanceRequestForm.get('emtId').setValidators(null);
        this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
      } else if(this.assetUserDetails.emtId !== null && this.assetUserDetails.assetId === id) {
        this.emtEnabled = false;
        this.emtId = this.assetUserDetails.emtId;
        this.ambulanceRequestForm.patchValue({
          'emtId': this.assetUserDetails.emtName,
        });
        this.ambulanceRequestForm.get('emtId').setValidators(null);
        this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
      }  else {
        this.emtEnabled = false;
        this.emtId = null;
        this.ambulanceRequestForm.patchValue({
          'emtId': null,
        });
        this.ambulanceRequestForm.get('emtId').setValidators(this.requireEMTMatch.bind(this));
        this.ambulanceRequestForm.get('emtId').updateValueAndValidity();
      }
      if (this.assetUserDetails.pilotId != null) {
        this.ambulanceRequestForm.patchValue({
          'pilotId': this.assetUserDetails.pilotId,
        });
        if ((this.assetUserDetails?.pilotIsAvailable && this.assetUserDetails?.pilotIsAvailable === false) || this.driverAvailable === false || this.ambAvailable === false) {
          this.ambulanceRequestForm.controls['status'].setValue('RQ-PLN');
        } else {
          this.ambulanceRequestForm.controls['status'].setValue(this.status !== null ? this.status : this.data.status ? this.data.status: 'RQ-CR');
        }
      } else {
        this.driverAvailable = true;
        this.ambulanceRequestForm.patchValue({
          'pilotId': null,
        });
       this.setStatus();
      }
      if (this.data && this.data.requestId) {
        this.assetCategoryId = this.assetUserDetails.assetCategory;
        this.ambulanceRequestForm.patchValue({
          'ambulanceType': this.data.assetCategory,
        });
      } else if (this.assetUserDetails.assetCategoryId != null && !this.data.requestId) {
        this.assetCategoryId = this.assetUserDetails.assetCategoryId;
        this.ambulanceRequestForm.patchValue({
          'ambulanceType': this.assetUserDetails.assetCategoryId,
        });
      } else {
        this.assetCategoryId = null;
        this.ambulanceRequestForm.patchValue({
          'ambulanceType': null,
        });
      }
    });
    }
  }

  onWindowResized(size) {
    this.popHeight = size - 100;
    if(size >= 1218) {
      this.contentHeight = size - 200;
    } else {
      this.contentHeight = size - 180;
    }
  }
  searchAmbulance(fromTime?: string) {
    if (fromTime != null) {
      this.fromTime = fromTime;
      this.filterFromTime = this._dateFormat.transform(
        fromTime,
        "yyyy-MM-dd HH:mm:ss"
      );
    } else {
      this.filterFromTime = this._dateFormat.transform(
        this.curDate,
        "yyyy-MM-dd HH:mm:ss"
      );

    }
    if (!this.autoAssign) {
      let includePerformer = this.data && !this.data.id && this.data.performer && this.data.performer.length !== 0;
      if(this.ambulanceRequestForm.controls != undefined) {
        if(this.data.status == 'RQ-RJ' && this.data.status != this.ambulanceRequestForm.controls['status'].value) {
          includePerformer = false;
        }
      }
      this.commonService
        .searchPorter(null,null,this.filterFromTime,null,null,null,null,'RQT-AMB').subscribe((res) => {
          if (includePerformer) {
            this.searchAmbulanceList = [...res.results.filter(i => i.id !== this.data.performer[0].id), ...this.data.performer];
          } else {
            this.searchAmbulanceList = res.results;
          }
      });
      this.commonService
        .searchPorter(null, null, this.filterFromTime, null, null, null, null, null, 'pilot').subscribe(res => {
          this.pilotListRes = res.results;
          this.pilotList = this.pilotListRes;
          if(this.data?.pilotId !== null) {
            this.ambulanceRequestForm.controls['pilotId'].setValue(this.data.pilotId);
          }
      });
    }
  }
  dateTimeValidation(value,key) {
    const status = this.ambulanceRequestForm.controls['status'].value;
    if(value !== null && key === 'pickup' && status !== 'RQ-CA' && status !== 'RQ-CO') {
      const fromTime = this._dateFormat.transform(value, 'yyyy-MM-ddTHH:mm');
      if(fromTime < this.curDate) {
        this.pastPickupTime = true;
      } else {
        this.pastPickupTime = false;
      }
    }
  }
  checkAvailableAmbulance(action) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Do you want to create a request in waitinglist?, A Ambulance will be assigned as soon as they are available',
        buttonText: { cancel: 'No', ok: 'Yes' },
        checkAvailablePorter: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.ambulanceStatusCheck = true;
        if (action === 'post') {
          this.SaveRequest();
        } else {
          this.UpdateRequest(this.data.requestId);
        }
      }
    });
  }
   fixClick() {
    console.log('')
  } 
}
