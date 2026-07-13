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

import { Component,  Inject, Input, Optional, Output, ViewChild, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../../../shared';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {  Observable, Subject } from 'rxjs';
import { startWith, map, debounceTime } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createVisitor,editVisitor } from '../../../../ovitag/workflow/workflow.models';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { ApptermsService } from '../../../services/appterms.service';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-manage-visitor',
  templateUrl: './manage-visitor.component.html',
  styleUrls: ['./manage-visitor.component.scss']
})
export class ManageVisitorComponent {
  patientList: any = [];
  public patientSub: Subject<any> = new Subject();
  public LocSub: Subject<any> = new Subject();
  public visitorForm: FormGroup;
  public genderList: any[] = null;
  public countrycodeList = [];
  public getVisitor = [];
  public countryOptions: Observable<any>;
  VisitorStatus: any[];
  visitorType: any[];
  @Input() visitorDetail = null;
  @Input() viewType = null;
  @Output() updateStatus = new EventEmitter<string>();
  identifyingTypeList =[{
    "code":"ENT-PA",
    "value":"Patient"},{"code":"ENT-ST",
    "value":"Staff"}];
    attachFiles: any[]=[]; 
    isUploadTable: boolean = false;
    isFileSelected: boolean = false;
    fileType: string = '';
    base64Data_global: string = '';
    atchData: any;
    uploadName: string = '';
  search :any[];
  selectedPatientId: number | null = null;
  selectedPatientName: string = '';
  userId = localStorage.getItem(btoa('userId'));
  userName = localStorage.getItem(btoa('current_user'));
  searchControl = new FormControl('');
  public CreateVisitorForm: createVisitor;
  public EditVisitor: editVisitor;
  searchError = false;
  identifyingTypeValue : any;
  identifyingTypeCode : any;
  assetList:any[];
  userList=[];
  locationList : any[];
  @ViewChild('input', { read: MatAutocompleteTrigger }) autoTrigger: MatAutocompleteTrigger;
  minDate: string; 
  idTypeList:any[];
  fileInfo: string;
  maxVisitorLimit: number = 5;
  selectedScheduleType = '';
  public toggleDisable = false;
  displayedColumns: string[] = ['type', 'admit', 'pattern', 'scheduleTime','actions'];
  dataSource = new MatTableDataSource([]); 
  DocumentTypeList: any[];
  ScheduleTypeList: any[];
  visitTypeList : any[];
  today = new Date();
  isExclude = false;
  selectedFileName: string = '';
  weeklist =[
    { "code": 1, "value": "Monday" },
    { "code": 2, "value": "Tuesday" },
    { "code": 3, "value": "Wednesday" },
    { "code": 4, "value": "Thursday" },
    { "code": 5, "value": "Friday" },
    { "code": 6, "value": "Saturday" },
    { "code": 7, "value": "Sunday" }
  ]
  daylist =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  attachmentId = null
  typeList: any[];
  selectedRowIndex: number | null = null;
  scheduleIds : any;
  accessList: any[];
  countryList : any[];
  public visitorAck = new FormControl(false);  
  departmentList: any[];
  visitorData = null
  attachment=[];
  minScheduleDate :string; 
  maxScheduleDate :string; 
  primarySchedule: any;
  constructor(public fb: FormBuilder, private readonly commonService: CommonService, public form: FormBuilder,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,private readonly apptermsService: ApptermsService,
    public toastr: AppToastService, public dateformat: DatePipe, private readonly lookupService: LookupTermService,
    @Optional() public thisDialogRef: MatDialogRef<ManageVisitorComponent>,
    protected sanitizer: DomSanitizer,public Dialog : MatDialog)
    {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
    this.minDate = now.toISOString().slice(0, 16); 
    
  }

  ngOnInit(){
    if(this.viewType == 'pwa') {
      this.data = this.visitorDetail;
    }
    this.buildForm();

    if (this.data?.id) {
      if(this.data?.identifyingId){
      this.visitorForm.patchValue({
        Search: this.data.search || ''
      });
    }
  }

    this.visitorForm.get('identifyingType')?.valueChanges.subscribe(value => {
      const selectedOption = this.identifyingTypeList.find(o => o.code === value);
      if (selectedOption) {
        this.identifyingTypeValue = selectedOption.value;
      }
      this.commonService.getAppTermsLink(value,'visitorType').subscribe(res => {
        this.visitorType = res.results;
      });
      if (value !== null && !this.visitorForm.contains('Search')) {
        this.visitorForm.addControl('Search', new FormControl(null,[Validators.required]));
      } else if (value === null && this.visitorForm.contains('Search')) {
        this.visitorForm.removeControl('Search'); 
      }
    });

    this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getPatients(searchTextValue);
    });
    this.LocSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getLoc(searchTextValue);
    });
    
    this.commonService.getVisitorGroupMapping().subscribe(res => {
      this.accessList = res.results;
      console.log("Acesss",this.accessList)
    });

    this.commonService.getAllDepartments().subscribe(res => {
    this.departmentList =res.results
    console.log("department",this.departmentList)
    })
    this.lookupService.getAppTermsWrapper('VisitorScheduleType,DocumentType,CountryCode,Gender,VisitorStatus,Country').subscribe(res => {
      const allowedDocumentCodes = ['DT-DLS', 'DT-ADR', 'DT-PAN'];
      this.ScheduleTypeList = res.VisitorScheduleType.filter(
        item => item.code !== 'VST-SNG'
      );
      this.DocumentTypeList = res.DocumentType.filter(
        item => allowedDocumentCodes.includes(item.code)
      );
      this.countrycodeList = res.CountryCode ?? [];
      if(!this.data?.countryCode && !this.data?.id){
        this.apptermsService.setDefaultValue( this.visitorForm,'countryCode',this.countrycodeList ,'code');
      }
      this.genderList = res.Gender ?? [];
      this.VisitorStatus = res.VisitorStatus ?? [];
      this.countryList = res.Country ?? [];
      this.setupCountryCodeAutocomplete();
    });
   this.commonService.getAppTermsLink(this.visitorForm.controls['identifyingType'].value,'visitorType').subscribe(res => {
        this.visitorType = res.results;
      });
    this.visitorForm.get('departureDatetime')?.valueChanges.subscribe(() => {
      this.updateDurationOrDeparture();
    });
    this.visitorForm.get('scheduleTime')?.valueChanges.subscribe((value) => {
      this.minScheduleDate = value
      this.visitorForm.get('startTime')?.reset();
    })
    this.visitorForm.get('endDate')?.valueChanges.subscribe((value) => {
      this.maxScheduleDate = value
      this.visitorForm.get('startTime')?.reset();
    })
       this.visitorForm.get('duration')?.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.updateDepartureFromDuration();   
        });
    this.visitorForm.get('countryCode')?.valueChanges.subscribe(value => {
      if (value === '+971') {
        this.visitorForm.get('mobileNo')?.setValidators(Validators.pattern('^([4-9][0-9]{8})$'));
      } else {
        this.visitorForm.get('mobileNo')?.setValidators(Validators.pattern('^([6-9][0-9]{9})$'));
      }
      this.visitorForm.get('mobileNo')?.updateValueAndValidity();
    });

    if (this.data?.id) {
      this.commonService.getVisitorById(this.data.id).subscribe(res => {
        console.log(res)
         this.visitorData= res.results
         this.buildForm()
         if (this.visitorData?.schedules && this.visitorData.schedules.length > 0) {
          this.dataSource.data = this.visitorData.schedules.filter(schedules => schedules.isPrimary !== true)
        .map(schedules => ({
          id:schedules.id,
          type: schedules.scheduleTypeName ,
          scheduleTypeId: schedules.scheduleTypeId,
          isInclude:schedules.isInclude == "true" || schedules.isInclude === true ? "YES" : "NO",
          pattern:this.getPatternDisplayValue(schedules.scheduleTypeId, schedules.dayPattern) ,
          scheduleTime: schedules.dateTime ,
      }));
          console.log("Formatted DataSource:", this.dataSource.data);
      } else {
          console.warn("Schedules data is missing or empty");
      }
        if (this.visitorData) {
          if (this.visitorData.schedules.length > 0) {
            this.primarySchedule = this.visitorData.schedules.find(schedule => schedule.isPrimary === true);
            if (this.primarySchedule) {
              if (this.primarySchedule.scheduleTypeId === 'VST-MN') {
                this.visitorForm.controls['mnPattern'].setValue(this.primarySchedule.dayPattern);
              } else {
                this.visitorForm.controls['Pattern'].setValue(this.primarySchedule.dayPattern);
              }
            }
          }
        }
        this.typeLoad(this.data.scheduleTypeId);
      })
      this.commonService.getItemAttachment(this.data.id, "Visitor").subscribe(res => {
        console.log("documents",res)
        if (res && res.results) {
          this.attachment = { ...res.results }; 
      }
      console.log("attachment ",this.attachment)
        this.attachmentId = res.results.find(p => p.attachmentId)?.attachmentId
      })
    }
  }
  getPatientsCheck(key) {
    this.patientSub.next(key);
  }
  getLocationCheck(key){
    this.LocSub.next(key);
  }
  getLoc(key){
    if (key.target.value !== "") {
      let val = key.target.value;
      if (val.length >= 2) {
      this.commonService.getLocationSearch(val).subscribe((res) => {
        this.locationList = res.results
      })
    }
  }
  }
  getPatients(key) {
    if (key.target.value !== "") {
      let val = key.target.value;
      if (val.length >= 2) {
        if(this.identifyingTypeValue==='Patient'){
        this.commonService.searchPatients(key.target.value, false).subscribe((res) => {
          this.patientList = res.results.filter(res => res.uhid != null);
        });
        }
        else if(this.identifyingTypeValue==='Asset'){
          this.commonService.getAssetSearch(null, val).subscribe((res) => {
            this.assetList = res.results
            })
        }
        else if(this.identifyingTypeValue==='Location'){
          this.commonService.getLocationSearch(val).subscribe((res) => {
            this.locationList = res.results
            })
        }else if(this.identifyingTypeValue==='Staff'|| this.visitorForm.get('identifyingType')?.value === 'ENT-ST'){
          this.commonService.getAssociatedUser(null, val).subscribe((res) => {
            this.userList = res.results
            })
        }
      } else {
        this.patientList = [];
        this.assetList=[];
        this.locationList=[];
        this.userList=[];
      }
    } else {
      this.patientList = [];
      this.assetList=[];
      this.locationList=[];
      this.userList=[];
    }
  }

  buildForm(): void {
    this.visitorForm = this.form.group({
      firstName: [{ value : this.visitorData ? this.visitorData.firstName :null, disabled: this.viewType === 'pwa' ? true : false },Validators.required],
      lastName: [this.visitorData ? this.visitorData.lastName : null],
      phoneNumber: [{ value : this.visitorData ? this.visitorData.phoneNumber : null, disabled :this.viewType === 'pwa' ? true : false },  [Validators.required, Validators.pattern(/^[0-9]{9,12}$/)]],
      gender: [this.visitorData ? this.visitorData.gender : null],
      countryCode: [{ value : this.visitorData ? this.visitorData.countryCode : null, disabled : this.viewType === 'pwa' ? true : false },Validators.required],
      visitorTypeId: [this.visitorData ? this.visitorData.visitorTypeId : null, Validators.required],
      email: [{ value : this.visitorData ? this.visitorData.email : null, disabled : this.viewType === 'pwa' ? true : false }, Validators.email],
      birthDate: [this.visitorData ? this.visitorData.birthDate : null],
      address: [this.visitorData ? this.visitorData.address : null],
      purpose: [this.visitorData ? this.visitorData.purpose : null],
      scheduleTime: [{ value : this.visitorData ? this.visitorData.scheduleTime : null, disabled : this.viewType === 'pwa' ? true : false },Validators.required],
      VisitorStatus: [this.visitorData ? this.visitorData.VisitorStatus : "VIS-RQ"],
      identifyingType: [this.visitorData ? this.visitorData.identifyingType : "ENT-ST"],
      idType : [this.visitorData ? this.visitorData.documentTypeId : null],
      idNO : [this.visitorData ? this.visitorData.documentId : null],      
      Organization : [this.visitorData ? this.visitorData.organizationName : ''],      
      visitorCount : [this.visitorData ? this.visitorData.addVisitorCount : 0],
      endDate : [{ value : this.visitorData ?this.visitorData.endTime : null, disabled : this.viewType === 'pwa' ? true : false }],
      scheduleType : [{ value : this.visitorData ?this.visitorData.scheduleTypeId : "VST-DNR", disabled : this.viewType === 'pwa' ? true : false }],
      duration : [{ value : this.visitorData ?this.visitorData.duration : null, disabled : this.viewType === 'pwa' ? true : false }, Validators.pattern('^[0-9]*$')],
      Pattern : [{ value : this.visitorData ?this.visitorData.Pattern : null, disabled : this.viewType === 'pwa' ? true : false }],
      mnPattern : [{ value : this.visitorData ?this.visitorData.schedules.pattern : null, disabled : this.viewType === 'pwa' ? true : false }],
      isInclude : [this.visitorData ?this.visitorData.isInclude : "true"],
      isSingle : [this.visitorData ?this.visitorData.isSingle : ''],
      Type : [this.visitorData ?this.visitorData.Type : "VST-SNG"],
      startTime : [this.visitorData ?this.visitorData.startTime : null],
      Search: [{ value : this.userId ,disabled : this.data || this.viewType === 'pwa' ? true : false }],
      location:[this.visitorData?this.visitorData.locationId : null],
      pfEntityGroupId : [this.visitorData ?this.visitorData.pfEntityGroupId : null],
      middleName: [this.visitorData ? this.visitorData.middleName : null],
      departureDatetime :[this.visitorData ? this.visitorData.depatureDatetime : null],
      state :[this.visitorData ? this.visitorData.state : null],
      organizationLocationId : [this.visitorData ? this.visitorData.organizationLocationId : null],
      citizenshipCountryId :[this.visitorData ? this.visitorData.citizenshipCountryId : null],
      birthCountryId :[this.visitorData ? this.visitorData.birthCountryId : null],
      departmentId :[this.visitorData ? this.visitorData.departmentId : null],
      isTechnicalAccess :[this.visitorData ? this.visitorData.isTechnicalAccess : null],
      exceptionMnPattern :[this.visitorData ? this.visitorData.exceptionMnPattern : null],
      exceptionPattern :[this.visitorData ? this.visitorData.exceptionPattern : null]
      });
    }
  AcceptRequest(visitorDetail) {
    let data = { 
      "statusId": "VIS-AC",
    }
    this.commonService.updateVisitoryStatus(visitorDetail.id, data).subscribe(res => {
      if(res.statusCode == 1) {
        console.log(res.results);
        this.updateStatus.emit('update');
      }
    })
  }


  createVisitor() {

    this.CreateVisitorForm = new createVisitor(null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null);
    this.CreateVisitorForm.firstName = this.visitorForm.controls['firstName'].value;
    this.CreateVisitorForm.lastName = this.visitorForm.controls['lastName'].value;
    this.CreateVisitorForm.gender = this.visitorForm.controls['gender'].value;
    this.CreateVisitorForm.visitorTypeId = this.visitorForm.controls['visitorTypeId'].value;
    this.CreateVisitorForm.identifyingId = this.visitorForm.controls['Search'].value;
    this.CreateVisitorForm.address = this.visitorForm.controls['address'].value;
    this.CreateVisitorForm.birthDate = this.dateformat.transform(this.visitorForm.controls['birthDate'].value, "YYYY-MM-dd");
    this.CreateVisitorForm.countryCode = this.visitorForm.controls['countryCode'].value;
    this.CreateVisitorForm.email = this.visitorForm.controls['email'].value;
    this.CreateVisitorForm.identifyingType = this.visitorForm.controls['identifyingType'].value;
    this.CreateVisitorForm.phoneNumber = this.visitorForm.controls['phoneNumber'].value;
    this.CreateVisitorForm.purpose = this.visitorForm.controls['purpose'].value;
    this.CreateVisitorForm.scheduleTime = this.dateformat.transform(this.visitorForm.controls['scheduleTime'].value, "YYYY-MM-dd HH:mm:ss");;
    this.CreateVisitorForm.visitorStatusId = this.visitorForm.controls['VisitorStatus'].value;
    this.CreateVisitorForm.userId = this.userId
    this.CreateVisitorForm.duration =this.visitorForm.controls['duration'].value;
    this.CreateVisitorForm.addVisitorCount =this.visitorForm.controls['visitorCount'].value;
    this.CreateVisitorForm.documentTypeId =this.visitorForm.controls['idType'].value;
    this.CreateVisitorForm.documentId =this.visitorForm.controls['idNO'].value;
    this.CreateVisitorForm.organizationName =this.visitorForm.controls['Organization'].value;
    this.CreateVisitorForm.endTime =this.dateformat.transform(this.visitorForm.controls['endDate'].value, "YYYY-MM-dd HH:mm:ss");
    this.CreateVisitorForm.dateTime =this.dateformat.transform(this.visitorForm.controls['startTime'].value, "YYYY-MM-dd HH:mm:ss");
    this.CreateVisitorForm.scheduleTypeId =this.visitorForm.controls['scheduleType'].value;
    this.CreateVisitorForm.isSingle =this.visitorForm.controls['isSingle'].value;
    this.CreateVisitorForm.locationId = this.visitorForm.controls['location'].value
    this.CreateVisitorForm.isTechnicalAccess = this.visitorForm.controls['isTechnicalAccess'].value
    this.CreateVisitorForm.state = this.visitorForm.controls['state'].value
    this.CreateVisitorForm.pfEntityGroupId = this.visitorForm.controls['pfEntityGroupId'].value
    this.CreateVisitorForm.organizationLocationId = this.visitorForm.controls['organizationLocationId'].value
    this.CreateVisitorForm.middleName = this.visitorForm.controls['middleName'].value
    this.CreateVisitorForm.depatureDatetime = this.dateformat.transform(this.visitorForm.controls['departureDatetime'].value, "YYYY-MM-dd HH:mm:ss");
    this.CreateVisitorForm.departmentId = this.visitorForm.controls['departmentId'].value
    this.CreateVisitorForm.birthCountryId = this.visitorForm.controls['birthCountryId'].value
    this.CreateVisitorForm.citizenshipCountryId = this.visitorForm.controls['citizenshipCountryId'].value
    if(this.CreateVisitorForm.identifyingId === null){ 
      this.CreateVisitorForm.identifyingId = this.userId
     }

     this.CreateVisitorForm.schedules = JSON.parse(JSON.stringify(this.dataSource.data));
     this.CreateVisitorForm.schedules.map(val => {
      val.isInclude = val.isInclude == "NO" ? false : true;
    }) 
     console.log("schedules",this.CreateVisitorForm.schedules);
    if (this.CreateVisitorForm.scheduleTypeId != "VST-DNR" ) {
      const pat = this.CreateVisitorForm.scheduleTypeId
      let value ;
      if(pat == "VST-WK" ){
        value =this.visitorForm.controls['Pattern'].value
      }
      else{
        value =this.visitorForm.controls['mnPattern'].value
      }
      this.CreateVisitorForm.schedules.push({
          dateTime: this.CreateVisitorForm.dateTime,
          dayPattern: value, 
          isInclude: true,
          isPrimary: true,
          scheduleTypeId: this.visitorForm.controls['scheduleType'].value
      });
  }

    if (!Array.isArray(this.CreateVisitorForm.attachFiles)) {
      this.CreateVisitorForm.attachFiles = []; 
    }
    console.log("attach files",this.attachFiles)
    if(this.attachFiles.length){
    this.CreateVisitorForm.attachFiles=[...this.attachFiles]
    console.log("document",this.CreateVisitorForm.attachFiles)
    }
    
    console.log(this.CreateVisitorForm.attachFiles)
    console.log(this.CreateVisitorForm)
      this.commonService.createRegisterVisitor(this.CreateVisitorForm).subscribe(res => {
      this.toastr.success('Success', `${res.message}`,);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateVisitor(data) {
    console.log('update')
    this.EditVisitor = new editVisitor(null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null, null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null);
    this.EditVisitor.firstName = this.visitorForm.controls['firstName'].value;
    this.EditVisitor.lastName = this.visitorForm.controls['lastName'].value;
    this.EditVisitor.gender = this.visitorForm.controls['gender'].value;
    this.EditVisitor.visitorTypeId = this.visitorForm.controls['visitorTypeId'].value;
    this.EditVisitor.address = this.visitorForm.controls['address'].value;
    this.EditVisitor.birthDate = this.dateformat.transform(this.visitorForm.controls['birthDate'].value, "YYYY-MM-dd");
    this.EditVisitor.countryCode = this.visitorForm.controls['countryCode'].value;
    this.EditVisitor.email = this.visitorForm.controls['email'].value;
    this.EditVisitor.identifyingType = this.data.identifyingType;
    this.EditVisitor.phoneNumber = this.visitorForm.controls['phoneNumber'].value;
    this.EditVisitor.purpose = this.visitorForm.controls['purpose'].value;
    this.EditVisitor.scheduleTime = this.dateformat.transform(this.visitorForm.controls['scheduleTime'].value, "YYYY-MM-dd HH:mm:ss");
    this.EditVisitor.userId = this.userId;
    this.EditVisitor.id = this.data.id;
    this.EditVisitor.duration =this.visitorForm.controls['duration'].value;
    this.EditVisitor.addVisitorCount =this.visitorForm.controls['visitorCount'].value;
    this.EditVisitor.documentTypeId =this.visitorForm.controls['idType'].value;
    this.EditVisitor.documentId =this.visitorForm.controls['idNO'].value;
    this.EditVisitor.organizationName =this.visitorForm.controls['Organization'].value;
    this.EditVisitor.endTime =this.dateformat.transform(this.visitorForm.controls['endDate'].value, "YYYY-MM-dd HH:mm:ss");
    this.EditVisitor.dateTime =this.dateformat.transform(this.visitorForm.controls['scheduleTime'].value, "YYYY-MM-dd HH:mm:ss");
    this.EditVisitor.dayPattern =this.visitorForm.controls['Pattern'].value;
    this.EditVisitor.isInclude =this.visitorForm.controls['isInclude'].value;
    this.EditVisitor.isSingle =this.visitorForm.controls['isSingle'].value;
    this.EditVisitor.scheduleTypeId=this.visitorForm.controls['scheduleType'].value
    this.EditVisitor.locationId = this.visitorForm.controls['location'].value
    this.EditVisitor.isTechnicalAccess = this.visitorForm.controls['isTechnicalAccess'].value
    this.EditVisitor.state = this.visitorForm.controls['state'].value
    this.EditVisitor.pfEntityGroupId = this.visitorForm.controls['pfEntityGroupId'].value
    this.EditVisitor.organizationLocationId = this.visitorForm.controls['organizationLocationId'].value
    this.EditVisitor.middleName = this.visitorForm.controls['middleName'].value
    this.EditVisitor.depatureDatetime = this.dateformat.transform(this.visitorForm.controls['departureDatetime'].value, "YYYY-MM-dd HH:mm:ss");
    this.EditVisitor.departmentId = this.visitorForm.controls['departmentId'].value
    this.EditVisitor.birthCountryId = this.visitorForm.controls['birthCountryId'].value
    this.EditVisitor.citizenshipCountryId = this.visitorForm.controls['citizenshipCountryId'].value
    if (this.EditVisitor.scheduleTypeId != "VST-DNR") {
      const pat = this.EditVisitor.scheduleTypeId
      let value = pat == "VST-WK" ? this.visitorForm.controls['Pattern'].value : this.visitorForm.controls['mnPattern'].value
      
      if (this.primarySchedule) {
        this.primarySchedule.dayPattern = value;
        this.commonService.updateSchedule(this.primarySchedule.id, this.primarySchedule).subscribe()
      } else {
        let newSchedule = {
          dateTime: this.EditVisitor.scheduleTime,
          dayPattern: value,
          isInclude: true,
          isPrimary: true,
          scheduleTypeId: this.visitorForm.controls['scheduleType'].value,
          visitorId: this.data.id
        }
        this.commonService.schedule(newSchedule).subscribe(res => {
        });
      }
    } else {
      if (this.primarySchedule) {
        this.primarySchedule.isActive = false
        this.commonService.updateSchedule(this.primarySchedule.id, this.primarySchedule).subscribe()
      }
    }

    if (this.attachFiles.length > 0) {
      this.commonService.saveFile(this.attachFiles).subscribe(res => {
        console.log(res.message)
      });
    }
    this.commonService.updateRegisterVisitor(this.EditVisitor).subscribe(res => {
      this.toastr.success('Success', `${res.message}`,);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  private setupCountryCodeAutocomplete(): void {
    this.countryOptions = this.visitorForm.get('countryCode')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCountryCodes(value || ''))
    );
  }

  private filterCountryCodes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.countrycodeList.filter(country => country.code.toLowerCase().includes(filterValue));
  }

  displayPatientName = (patientId: number): string => {
    const patient = this.patientList.find(p => p.patientId === patientId);
    return patient ? patient.patientName:this.data? this.data.entityName: null;
  };

  displayAssetName = (assetId: number ): string => {
    const asset = this.assetList.find(a => a.assetId === assetId);
    return asset ? asset.assetName : null;
  };
  displayLocationName = (L: number ): string => { 
    if (!this.locationList || this.locationList.length === 0) {
    return this.visitorData?.locationName ?? '';
  }

  const location = this.locationList.find(a => a.id === L);
  
  return location ? location.name : this.visitorData?.locationName ?? '';
  };
  displayUserName = (L: number ): string => {
    const username = this.userList.find(a => a.id === this.data?this.data.locationId : L);
    return username ? username.fullName : this.data? this.data.entityName: this.userName;
  };

  onPatientSelected(event: MatAutocompleteSelectedEvent) {
    this.selectedPatientId = event.option.value;
    const patient = this.patientList.find(p => p.patientId === this.selectedPatientId);
    this.searchControl.setValue(patient ? patient.patientName : this.data ? this.data.entityName: this.userName);
  }
  validateSelection(){
     const searchControl = this.visitorForm.get('location');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.locationList.some(location => location.id === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null);  
  }
  
  validateEntitySelection() {
   if(this.visitorForm.controls['identifyingType'].value==='ENT-PA'){
    const searchControl = this.visitorForm.get('Search');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.patientList.some(patient => patient.patientId === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null); 
   }
   else if(this.visitorForm.controls['identifyingType'].value==='ENT-LOC'){
    const searchControl = this.visitorForm.get('Search');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.locationList.some(location => location.id === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null); 
   }
   else if(this.visitorForm.controls['identifyingType'].value==='ENT-AS'){
    const searchControl = this.visitorForm.get('Search');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.assetList.some(asset => asset.assetId === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null); 
   }
   else if(this.visitorForm.controls['identifyingType'].value==='ENT-ST'){
    const searchControl = this.visitorForm.get('Search');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.userList.some(user => user.id === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null);  
   }
   else{
    const searchControl = this.visitorForm.get('location');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.locationList.some(location => location.id === enteredValue);
    this.searchError = !isValid; 
    if (!isValid) searchControl.setValue(null);  
   }
  }
  onFileSelect(input: HTMLInputElement): void {
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
  handleFileSelect(evt) {
    const files = evt.target.files;
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowed_types.includes(evt.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (files && file) {
        this.fileType = file.type;
        const reader = new FileReader();

        reader.onload = (function (f) {
          return function (readerEvt) {
            const binaryString = readerEvt.target.result

            this.base64Data_global = btoa(binaryString);

            this.isFileSelected = true;

            if (f.type.includes('image')) {
              const url = this.safeUrl('data:image/png;base64,' + this.base64Data_global);
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/pdf') {
              const url = this.safeUrl('data:application/pdf;base64,' + this.base64Data_global);
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/msword') {
              const url = this.safeUrl('data:application/msword;base64,' + this.base64Data_global);
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'text/plain') {
              const url = this.safeUrl('data:text/plain;base64,' + this.base64Data_global);
              this.image = {
                file: reader.result,
                mimeType: f.type
              }
            }
            if(file.size < 2 * 1000000){
              this.atchData = this.image
              this.addUploadRow();
            }else {
              this.atchData = null;
              this.isFileSelected = false;
              this.toastr.warningToastr('Warning', `Upload image file should be less that 2MB`, { animate: 'slideFromRight', showCloseButton: true });
            }
            this.isAddUpload = true;
          };
        })(file).bind(this);
        reader.readAsBinaryString(file); 
      }
    }
  }
  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  } 
  addUploadRow() {
    this.attachment=[]
    this.uploadName = localStorage.getItem(btoa('current_user'));
    if(this.data){
      this.attachFiles.push({
      fileType: this.atchData.mimeType,
      base64Data: this.base64Data_global,
      attachmentId: this.attachmentId ,
      image: this.atchData.file,
      userName: this.uploadName,
      documentTypeId : this.visitorForm.controls.idType.value,
      entityType :"Visitor",
      entityId : this.data.id,
      fileName: "visitorDoc",
    });
  } else{
    this.attachFiles.push({
      fileType: this.atchData.mimeType,
      base64Data: this.base64Data_global,
      image: this.atchData.file,
      userName: this.uploadName,
      documentTypeId : this.visitorForm.controls.idType.value,
    });
  }
  this.attachment = this.attachFiles.map(obj => ({
    ...obj,
    fileUrl: obj.image 
  }));
    this.isUploadTable = true;
    this.fileInfo = null;
    this.isFileSelected = false;
  }

  onFileChange(event: Event, fileInput: HTMLInputElement): void {
    this.handleFileSelect(event); 
    this.onFileSelect(fileInput); 
    
    if (fileInput.files && fileInput.files.length > 0) {
        this.selectedFileName = Array.from(fileInput.files).map(file => file.name).join(', ');
        this.isFileSelected = true;
    } else {
        this.selectedFileName = '';
        this.isFileSelected = false;
    }
}

  updateVisitorCount(action: string): void {
    let currentCount = this.visitorForm.controls['visitorCount'].value;

    if (action === 'increment' && currentCount < this.maxVisitorLimit) {
      this.visitorForm.controls['visitorCount'].setValue(currentCount + 1);
    } 
    else if (action === 'decrement' && currentCount > 0) {
      this.visitorForm.controls['visitorCount'].setValue(currentCount - 1);
    }
  }

  onToggleChange(event: any): void {
    this.selectedScheduleType = event.target.checked ? 'Range' : 'single';
  }

  typeLoad(code){
    if(code === 'VST-DLY'){
      this.isExclude=true;
      this.lookupService.getAppTermsWrapper('VisitorScheduleType').subscribe(res => {
        this.typeList = res.VisitorScheduleType.filter(item => item.code !== 'VST-DNR' && item.code !== 'VST-DLY');
      });
    }
    if(code === 'VST-MN'|| code === 'VST-WK'){
      this.isExclude=true;
      this.lookupService.getAppTermsWrapper('VisitorScheduleType').subscribe(res => {
        this.typeList = res.VisitorScheduleType.filter(item => item.code !== 'VST-DNR' && item.code === 'VST-SNG');
      });
    }
    
  }


  populateTable(){
    let patternValue = this.visitorForm.controls['exceptionPattern'].value ? this.visitorForm.controls['exceptionPattern'].value : this.visitorForm.controls['exceptionMnPattern']?.value ;
    let updatedData = {
      id:this.selectedRowIndex !== null ? this.scheduleIds : null,
      type:this.visitorForm.controls['Type'].value === "VST-SNG" ? "Day" : this.visitorForm.controls['Type'].value === "VST-MN" ? "Monthly" : "Weekly",
      scheduleTypeId: this.visitorForm.controls['Type'].value,
      isInclude: this.visitorForm.controls['isInclude'].value === "true" ? "YES" : "NO",
      pattern: this.visitorForm.controls['Type'].value === 'VST-SNG' ? null : this.getPatternDisplayValue(this.visitorForm.controls['Type'].value, patternValue),
      dayPattern:   this.visitorForm.controls['Type'].value === 'VST-SNG' ? null :patternValue,
      dateTime: this.dateformat.transform(this.visitorForm.controls['startTime'].value, "YYYY-MM-dd HH:mm:ss"),
      isPrimary: false,
      scheduleTime: this.dateformat.transform(this.visitorForm.controls['startTime'].value, "YYYY-MM-dd HH:mm:ss")
    };

    if(this.data && this.selectedRowIndex === null){
      let selectedType = this.visitorForm.controls['Type'].value; 
      let patternValue = this.visitorForm.controls['Pattern'].value ? this.visitorForm.controls['Pattern'].value : this.visitorForm.controls['mnPattern']?.value ;
      let value 
      if(this.visitorForm.controls['isInclude'].value === "true"){
        value = "YES"
      }else{
        value = "NO"
      }
      let newSchedule = {
        type: this.getScheduleTypeName(selectedType), 
        scheduleTypeId :this.visitorForm.controls['Type'].value,
        isInclude: value,
        dayPattern: selectedType === 'VST-SNG' ? null : patternValue, 
        pattern: selectedType === 'VST-SNG' ? null : this.getPatternDisplayValue(this.visitorForm.controls['Type'].value, patternValue), 
        scheduleTime: selectedType === 'VST-SNG' ? this.dateformat.transform(this.visitorForm.controls['startTime'].value, "YYYY-MM-dd HH:mm:ss") : null ,
        dateTime: this.dateformat.transform(this.visitorForm.controls['startTime'].value, "YYYY-MM-dd HH:mm:ss"),
        isPrimary : false,
        visitorId :this.data.id
      };
      if (newSchedule && newSchedule.isInclude !== undefined) {
        newSchedule.isInclude = newSchedule.isInclude === 'Yes' ? "true" : "false";
      }
      this.commonService.schedule(newSchedule).subscribe(res => {
              this.dataSource._updateChangeSubscription(); 
      });
    };

  
    if (this.selectedRowIndex !== null) {
      let data = this.dataSource.data;
      updatedData.isInclude=updatedData.isInclude === "YES" ? "true" : "false"
      updatedData.id = this.scheduleIds
      if( updatedData.scheduleTypeId != "VST-SNG"){
        updatedData.dateTime = null;
        updatedData.scheduleTime = null;
      }else if( updatedData.scheduleTypeId === "VST-SNG"){
        updatedData.dayPattern = [];
      }
      data[this.selectedRowIndex] = updatedData;  
      
      if(this.data){
        console.log("the selected ",data[this.selectedRowIndex])
      this.commonService.updateSchedule(this.scheduleIds,data[this.selectedRowIndex]).subscribe(res => { 
           const updatedId = res.results.id;
            const data = [...this.dataSource.data];
             let newSchedule = {
        type: res.results.scheduleTypeId === "VST-SNG" ? "Day"
          : res.results.scheduleTypeId === "VST-MN" ? "Monthly"
          : "Weekly",
        scheduleTypeId :this.visitorForm.controls['Type'].value,
        isInclude: res.results.scheduleTypeId === "true" ? "YES" : "NO",
        dayPattern: res.results.scheduleTypeId === 'VST-SNG' ? null : patternValue, 
        pattern: res.results.scheduleTypeId === 'VST-SNG' ? null : this.getPatternDisplayValue(res.results.scheduleTypeId, res.results.dayPattern), 
        scheduleTime: res.results.scheduleTypeId === 'VST-SNG' ? this.dateformat.transform(res.results.dateTime, "YYYY-MM-dd HH:mm:ss") : null ,
        dateTime: res.results.dateTime,
        isPrimary : false,
        visitorId :this.data.id
      };
            const rowIndex = data.findIndex(row => row.id === updatedId);

            if (rowIndex !== -1) {
              data[rowIndex] = {
               ...newSchedule
              };
            } 
            this.dataSource.data = data;
            this.dataSource._updateChangeSubscription(); 
              });
    }

    } else {
      this.dataSource.data = [...this.dataSource.data, updatedData];
      this.dataSource._updateChangeSubscription(); 
    }
  
    this.visitorForm.patchValue({
      Type: '',
      isInclude: "true",
      Pattern: null,
      startTime: null
    });
  }
  
  getScheduleTypeName = (scheduleTypeId: number): string => {
    const scheduleType = this.ScheduleTypeList.find(type => type.id === scheduleTypeId); 
    return scheduleType ? scheduleType.name : '';
  };

selectRow(element: any, index: number) {
  this.selectedRowIndex = index;
  const matchedType = this.typeList.find(item => item.value === element.type);
  console.log("Row Selected:", element); 
  this.scheduleIds = element.id;
   let parsedPattern: number[] = [];

  if (element.pattern && element.scheduleTypeId === "VST-WK") {
    parsedPattern = element.pattern
      .split(',')
      .map(day => this.dayNameToNumberMap[day.trim()])
      .filter(val => val !== undefined); 
  }

 
  if (element.pattern && element.scheduleTypeId === "VST-MN") {
    parsedPattern = element.pattern
      .split(',')
      .map(val => parseInt(val.trim(), 10));
  }
  

  this.visitorForm.patchValue({
    Type: element.scheduleTypeId,
    isInclude: element.isInclude === "YES" ? "true" : "false",
    exceptionPattern: element.scheduleTypeId === "VST-WK" ?parsedPattern : null,
    exceptionMnPattern : element.scheduleTypeId === "VST-MN" ?parsedPattern : null,
    startTime: element.scheduleTime
  });
  }

  dayNameToNumberMap: { [key: string]: number } = {
  Sunday: 7,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

  getFileDownload(element){
    console.log(element)
    const dialogRef = this.Dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  updateDurationOrDeparture() {
    const schedule = this.visitorForm.get('scheduleTime')?.value;
    const departure = this.visitorForm.get('departureDatetime')?.value;
  
    if (schedule && departure) {
      const start = new Date(schedule);
      const end = new Date(departure);
  
      const sameDate =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
  
      const durationInHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  
      if (sameDate && !isNaN(durationInHours) && durationInHours > 0 && durationInHours <= 24) {
        this.visitorForm.get('duration')?.setValue(durationInHours, { emitEvent: false });
      } else {
        this.visitorForm.get('duration')?.reset();
      }
    }
  }
  
  updateDepartureFromDuration() {
    const schedule = this.visitorForm.get('scheduleTime')?.value;
    const duration = this.visitorForm.get('duration')?.value;
  
    if (schedule && duration ) {
      const start = new Date(schedule);
      const updatedDeparture = new Date(start.getTime() + duration * 60 * 60 * 1000);
      const formatted = this.formatDateToLocalInputString(updatedDeparture);
  
      this.visitorForm.get('departureDatetime')?.setValue(formatted, { emitEvent: false });
    }
  }

  formatDateToLocalInputString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  deleteRow(row: any) {
    const updatedRow = {
      ...row,
      isActive: false ,
      isInclude: row.isInclude === 'Yes' ? true : false
    };
    this.commonService.updateSchedule(updatedRow.id,updatedRow).subscribe(res => {
      console.log(res.message)
    });
    const index = this.dataSource.data.indexOf(row);
    if (index >= 0) {
      this.dataSource.data.splice(index, 1);
      this.dataSource._updateChangeSubscription(); 
    }
  }

  getPatternDisplayValue(scheduleTypeId: string, dayPattern: number[] | string): string {
    const WEEKDAY_MAP: { [key: number]: string } = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      7: "Sunday"
    };
  
    if (!dayPattern) return '';
  
    if (scheduleTypeId === 'VST-WK') {
      let daysArray: number[] = [];
  
      if (typeof dayPattern === 'string') {
        daysArray = dayPattern.split(',').map(d => +d.trim());
      } else if (Array.isArray(dayPattern)) {
        daysArray = dayPattern;
      }
  
      return daysArray.map(d => WEEKDAY_MAP[d] || d).join(', ');
    }
  
    return typeof dayPattern === 'string' ? dayPattern : dayPattern.join(', ');
  }

  removeAttachment(){
    if(this.attachmentId==null){
      this.attachFiles=[];
      this.attachment=[];
    }else{
    this.commonService.deleteItemAttachment(this.attachmentId).subscribe(res => {
      this.attachment=[]
      this.attachmentId=null
    });
  }
  }

  scheduleSelection(value){
      if(value === 'VST-DNR'){
          this.visitorForm.controls['endDate']?.setValue(null)
          this.visitorForm.controls['pattern']?.reset()
          this.visitorForm.controls['mnPattern']?.reset()
        }else{
          this.visitorForm.controls['departureDatetime']?.setValue(null)
        }
        if(this.isExclude === true){
          this.typeLoad(value)
        } 
  }

  typeSelection(value){
    if (value === 'VST-SNG') {
        this.visitorForm.controls['exceptionPattern'].setValue(null);
        this.visitorForm.controls['exceptionMnPattern'].setValue(null);
      } else if (value === 'VST-MN') {
        this.visitorForm.controls['exceptionPattern'].setValue(null);
        this.visitorForm.controls['startTime'].setValue(null);
      }else{
        this.visitorForm.controls['exceptionMnPattern'].setValue(null);
        this.visitorForm.controls['startTime'].setValue(null);
      }
  }
  fixClick() {
    console.log('')
  }
}
