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
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../../services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SessionStorageService } from '../../../../services/session.storage.service';
import { CreateTask } from '../../workflow-management/workflow-management.model';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { LightboxOnlineMenuDialogComponent } from '../../../../../ovitag/configuration/asset/asset.component';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { AssignTaskComponent } from '../../../../../ovitag/workflow/task/task.component';
import { ConfirmationDialog } from '../../confirmation-dialog/confirmation-dialog.component';
import { PushNotificationsService } from '../../../../services/push.notification.service';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-manage-pwa-task',
  templateUrl: './manage-pwa-task.component.html',
  styleUrls: ['./manage-pwa-task.component.scss']
})
export class ManagePwaTaskComponent implements OnInit {
  public taskForm: FormGroup;
    public createTask: CreateTask
    public contestList: any;
    public selectedTask = "PR-AT";
    categoryList: any;
    taskActivitiesList: any;
    locationListItems: any;
    locationList: any = [];
    locationEnabled: boolean = false;
    requireLocationMatchVal: any;
    assignTypeList: any;
    activate_btn: any[];
    taskInchargeId: null;
    taskInchargeList: any = [];
    taskInchargeEnabled: boolean = false;
    toHit = false;
    taskInchargeListRes: any;
    entityType = 'Patient';
    entityId = null;
    entityName = null;
    nonPerformerInfo: any[];
    performerInfo: any[];
    assetListItems: any;
    assetList: any = [];
    assetNameEnabled: boolean = false;
    requireAssetMatchVal: any;
    patientListItems: any;
    patientList: any = [];
    patientNameEnabled: boolean;
    requirePatientMatchVal: any;
    bannerData = []
    canAutoAllocate: boolean = false;
    autoComplete: boolean = false;
    inchargeId: any;
    locationId: any;
    toDay: any = new Date();
    public currentDate = this.dateFormat.transform(this.toDay, 'yyyy-MM-ddTHH:mm')
    requireInchargeMatchVal: any;
    taskData = null;
    assetId = null;
    patientId = null;
    destinationId = null;
    public attachmentData: any[] = [];
    public ticketEvents = [];
    public selectedIndex=null;
    public itemForm: any = FormGroup;
    public itemList=[];
    public itemLinked = false;
    public dataSourceItem = []
    editInventory = false;
    editId =null;
    editItemId = null;
    modelNo = null;
    batchList =[];
    availableQuantity =null;
    editdeliveryDetailsId = null;
    itemBatchName = null;
    selectedItemId = null;
    assetTypeId =null;
    editRequestId=null;
    attachFiles = [];
    formTemplate = [];
    formData=null;
    ticketformBuilderSource=[];
    entityForms: any=[];
    assetData: any;
    isContext: boolean = false;
    roleIds: any[];
    departmentIds: any;
    orginalAssignTypeList: any;
    public entityData = {"id":null,"entityId":null,"entityType":'Request',"parentId":null,"parentType":'Location','entityDetails':null,'entityGroupTypeId':'EGTI-LOC','entityTypeId':null,'formTemplateType' :null};
    public tabChangeTriggered = false;
    taskByreminderData = null;
    isReminderFormValid: boolean = false  
    statusList: any[];
    actualStatusList: any[];
    scheduleType: any;
    activityScheduleType = 'SAT-BTM';
    tomorrowDate = null;
    isDateTime: boolean = true;
    priorityLevel: any;
    public codeMap: Record<string, string> = {
      'PR-LC': 'EGTI-LOC',
      'PR-PA': 'EGTI-PA',
      'PR-AT': 'EGTI-AS',
      'PR-GL': null,
    };
    displayAssetName = null;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any, public bottomSheetRef: MatBottomSheetRef<ManagePwaTaskComponent>, public form: FormBuilder, private readonly commonService: CommonService, 
      private readonly configurationService: ConfigurationService,private readonly workflowService:WorkflowService, protected sanitizer: DomSanitizer,
      private readonly dateFormat: DatePipe, public toastr: AppToastService,  public dialog: MatDialog,private readonly hospitalService:HospitalService,private readonly sessionService:SessionStorageService) {
      this.activate_btn = this.commonService.getActivePermission('button');
      if(this.data){
         let modifyData = this.data[0]
         this.data = modifyData
      }
    }

  ngOnInit() {
      if(this.data.hasOwnProperty('contextType')){
        this.isContext = true;
      }
      this.commonService.getAppTermsLink('RQT-TASK', 'PorterRequestType').subscribe(res => {
        this.contestList = res.results
        const sortOrder = ["Location", "Asset", "Patient", "General"];
        this.contestList.sort((a, b) => sortOrder.indexOf(a.value) - sortOrder.indexOf(b.value));
        this.selectedTask = this.contestList.some(x => x.code === 'PR-AT') ? 'PR-AT' : this.contestList[0].code;
      })
      this.bulidForm()
      if (this.data.type === 'modify') {
        this.getTaskDetails()
      } else if (this.data.type === "asset") {
        this.selectedTask = this.data.contextType;
        if (this.data.contextType === 'PR-AT') {
          let assetName = this.data?.entityDetail?.assetName;
          let assetSerialNo = this.data?.entityDetail?.assetSerialNumber;
          this.assetId = this.data?.nonPerformerId;
          this.commonService.getAssetSearch(null, assetName).subscribe((res) => {
            this.assetList = res.results.filter(val => val.assetId === this.data?.nonPerformerId);
          if(this.assetList.length){
            this.displayAssetName =assetSerialNo ? `${assetName} (${assetSerialNo})` : assetName;
            this.taskForm.get('assetId').setValue(assetSerialNo ? `${assetName} (${assetSerialNo})`: assetName);
            this.taskForm.get('assetId').updateValueAndValidity();
            this.assetTypeId = this.assetList[0].assetTypeId;
            this.modelNo = this.assetList[0].modelNumber;
            this.getFromInfo();
            }
          });
        }
  
      } else if (this.data.type === 'location') {
        this.selectedTask = this.data.contextType;
        if (this.data.contextType === 'PR-LC') {
          this.locationId = this.data?.nonPerformerId;
          this.commonService.getLocationById(this.locationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.taskForm.get('locationId').setValue(locationName)
              this.locationId = this.locationList[0].id
            }
            this.taskForm.get('locationId').updateValueAndValidity();
            this.getFromInfo();
          });
        }
  
      } else if(this.data.type === 'patient'){
        this.selectedTask = this.data.contextType;
        if (this.data.contextType === 'PR-PA'){
          this.patientId = this.data?.patientId;
          this.commonService.searchInpatient(null, this.patientId).subscribe((res) => {
            this.patientList = res.results;
            this.taskForm.get('patientId').setValue(this.patientList[0].fullName)
            this.taskForm.get('patientId').updateValueAndValidity();
          });
        }
        if (this.data.destinationId !== null){
          this.destinationId = this.data?.destinationId;
          this.commonService.getLocationById(this.destinationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.locationEnabled = true;
              this.taskForm.get('destinationId').setValue(locationName)
              this.locationId = this.locationList[0].id
            }
            this.taskForm.get('destinationId').updateValueAndValidity();
          });
        }
        if(this.data.description !== null){
          this.taskForm.get('description').setValue(this.data.description);
        }
      }
      if(this.data.type !== 'modify'){
        this.getCategoryList()
      }
      this.updateSelectedEntityData();
      this.commonService.getAppTerms('RecipientType,RequestStatus,ScheduleActivityType,CalenderWeek,PriorityLevel').subscribe(res => {
        this.orginalAssignTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code == 'RT-US' || resFilter.code == 'RT-RO' || resFilter.code == 'RT-DT'));
        this.statusList = res.results.filter(resFilter => resFilter.groupName === 'RequestStatus' && (resFilter.code === 'RQ-CR' || resFilter.code === 'RQ-IP' || resFilter.code === 'RQ-CO' || resFilter.code === 'RQ-CA' || resFilter.code === 'RQ-SH'));
        this.scheduleType = res.results.filter(resFilter => resFilter.groupName === 'ScheduleActivityType' && (resFilter.code === 'SAT-BTM' || resFilter.code === 'SAT-ATM' || resFilter.code === 'SAT-RGAT' || resFilter.code === 'SAT-RGBT'));
        this.priorityLevel = res.results.filter(resFilter => resFilter.groupName === 'PriorityLevel')
        this.displayStatus('RQ-CR', null);
      })
      this.validateControl()
    }
  
    displayStatus(event: string, type: string | null) {
      const statusMap: { [key: string]: string[] } = {
        'RQ-CR_RT-US': ['RQ-CR', 'RQ-IP', 'RQ-CO', 'RQ-CA'],
        'RQ-CR_null': ['RQ-CR'],
        'RQ-CR_RT-RO': ['RQ-CR', 'RQ-CO', 'RQ-CA'],
        'RQ-CR_RT-DT': ['RQ-CR', 'RQ-CO', 'RQ-CA'],
        'RQ-IP_any': ['RQ-IP', 'RQ-CO'],
        'RQ-SH_any': ['RQ-SH', 'RQ-CA']
      };
      const key = `${event}_${type ?? 'null'}`;
      const fallbackKey = `${event}_any`;
      const allowedCodes = statusMap[key] || statusMap[fallbackKey] || ['RQ-CO'];
      this.actualStatusList = this.statusList.filter(res => allowedCodes.includes(res.code));
    }

    getFromInfo(){
      if(this.data.type !== 'modify')
      this.getFormDetails();
      this.getEntityDetails();
    }
    
  
    getTaskDetails() {
      this.workflowService.getTaskById(this.data.requestId).subscribe((res) => {
        this.taskData = res.results[0];
        const data = this.taskData
        data['dataType'] = 'get';
        data['id'] = data.requestId;
        this.taskByreminderData = data;
        setTimeout(() => {
          if (this.taskData !== null) {
            this.displayStatus(this.taskData?.statusId, this.taskData?.performerType);
            this.selectedTask = this.taskData?.requestCategoryId;
            this.updateSelectedEntityData();
            if (!['SAT-BTM', 'SAT-RGBT'].includes(this.taskData?.scheduleActivityTypeId)) {
              this.isDateTime = false
            }
            if(this.taskData?.scheduleActivityTypeId){
              this.activityScheduleType = this.taskData?.scheduleActivityTypeId;
            }
            if(this.taskData?.scheduleStartTime) {
              const currentDateObj = new Date(this.taskData?.scheduleStartTime);
              let tomorrowDateObj = new Date(currentDateObj.getTime() + 24 * 60 * 60 * 1000);
              this.currentDate = this.dateFormat.transform(currentDateObj,'yyyy-MM-dd HH:mm')
              this.tomorrowDate = this.dateFormat.transform(tomorrowDateObj, 'yyyy-MM-dd HH:mm');
            }
            if(this.taskData?.requestTypeId === 'RQT-ROU'){
              let selectedContext = null
              if(this.selectedTask === 'PR-PA'){
                selectedContext = 'RC-PAT'
              } else if(this.selectedTask === 'PR-AT') {
                selectedContext = 'RC-AST'
              } else if(this.selectedTask === 'PR-LC'){
                selectedContext = 'RC-LOC'
              } else {
                selectedContext ='RC-SAF'
              }
              this.commonService.getAppTermsLink(selectedContext, 'RoutineType').subscribe(res =>{
                this.categoryList = res.results;
              })
            } else {
              this.commonService.getAppTermsLink(this.selectedTask, 'ActivityCategory').subscribe(res => {
                this.categoryList = res.results;
              })
            }
            if (this.taskData?.activityCategoryId !== null) {
              
              this.getTaskList(this.taskData?.routineTypeId, this.taskData?.activityCategoryId);
            }
            if (this.selectedTask === 'PR-LC') {
              this.locationId = this.taskData?.nonPerformerId ? this.taskData?.nonPerformerId : null
              this.commonService.getLocationById(this.locationId).subscribe(res => {
                this.locationList = [res.results];
                if (this.locationList.length) {
                  let locationName = this.locationList[0].fullName;
                  this.taskForm.get('locationId').setValue(locationName)
                }
                this.taskForm.get('locationId').updateValueAndValidity();
              });
            } else if (this.selectedTask === 'PR-AT') {
              this.assetId = this.taskData?.nonPerformerId ?? null;
              if(this.assetId !== null){
                this.commonService.getAssetSearch(this.assetId , null).subscribe((res) => {
                  this.assetList = res.results.filter(val => val.assetId === this.taskData?.nonPerformerId);
                  if(this.assetList.length){
                    this.displayAssetName = this.taskData?.nonPerformerName;
                    this.taskForm.get('assetId').updateValueAndValidity();
                    this.assetTypeId = this.assetList[0].assetTypeId;
                    this.modelNo = this.assetList[0].modelNumber;
                  }
                });
              }
              this.taskForm.get('assetId').updateValueAndValidity();
            } else if (this.selectedTask === 'PR-PA') {
              let patientName = this.taskData?.nonPerformerName;
              this.patientId = this.taskData?.nonPerformerId;
              this.commonService.searchInpatient(null, this.patientId).subscribe((res) => {
                this.patientList = res.results.filter(val => val.id === this.taskData?.nonPerformerId);
                this.taskForm.get('patientId').setValue(this.patientList[0].fullName)
                this.taskForm.get('patientId').updateValueAndValidity();
              });
            }
            if (this.taskData?.destinationLocationId !== null) {
              this.destinationId = this.taskData?.destinationLocationId ? this.taskData?.destinationLocationId : null
              this.commonService.getLocationById(this.destinationId).subscribe(res => {
                this.locationList = [res.results];
                this.locationEnabled = true;
                if (this.locationList.length) {
                  let locationName = this.locationList[0].fullName;
                  this.taskForm.get('destinationId').setValue(locationName)
                }
                this.taskForm.get('destinationId').updateValueAndValidity();
              });
            }
  
            setTimeout(() => {
              if (this.taskData?.performerId !== null) {
                let type = this.taskData?.performerType;
                this.inchargeId = this.taskData?.performerId;
                if (type == 'RT-RO') {
                  this.configurationService.getRecipientName('', type).subscribe(res => {
                    this.taskInchargeList = res.results.filter(val => val.id === this.taskData?.performerId);
                    this.taskInchargeEnabled = true;
                    if (this.taskInchargeList.length) {
                      let name = this.taskInchargeList[0].name
                      this.taskForm.get('assignId').setValue(name)
                    }
                    this.taskForm.get('assignId').updateValueAndValidity();
                  });
                } else if (type == 'RT-US') {
                  let roles = this.roleIds.join(',');
                  let departments = this.departmentIds && this.departmentIds.join(',');
                  this.configurationService.getRoleUser(null, roles, departments, this.taskData?.performerId).subscribe(res => {
                    this.taskInchargeList = res.results
                    this.taskInchargeEnabled = true;
                    if (this.taskInchargeList.length) {
                      let name = this.taskInchargeList[0].name;
                      this.taskForm.get('assignId').setValue(name);
                    }
                    this.taskForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
                  });
                } else if (type == 'RT-DT') {
                  this.commonService.getAllDepartments().subscribe(res => {
                    this.taskInchargeList = res.results.filter(val => val.id === this.taskData?.performerId);
                    this.taskInchargeEnabled = true;
                    if (this.taskInchargeList.length) {
                      let name = this.taskInchargeList[0].name;
                      this.taskForm.get('assignId').setValue(name);
                    }
                  });
                }
              }
            }, 250);
            this.bulidForm();
            this.validateControl();
          }
        }, 200);
      })
      //  this.getAllAttachments(this.data.requestId)
      setTimeout(() => {
      this.getAllTktHist(this.data.requestId);
      this.getFormDetails();
      this.getEntityDetails();
      },500);
    }
  
    bulidForm() {
      this.taskForm = this.form.group({
        categoryId: [(this.taskData?.requestTypeId === 'RQT-ROU' && this.taskData?.routineTypeId) ? this.taskData?.routineTypeId : this.taskData?.activityCategoryId ? this.taskData?.activityCategoryId : null, [Validators.required]],
        taskId: [this.taskData?.activityId ? this.taskData.activityId : null, [Validators.required]],
        locationId: ['', [this.validateLocationSelection.bind(this)]],
        assetId: [null, [this.validateAssetSelection.bind(this)]],
        patientId: [null, [this.validatePatientSelection.bind(this)]],
        general:[this.taskData?.title ? this.taskData.title : null],
        destinationId: [null, [this.validateLocationSelection.bind(this)]],
        description: [this.taskData?.comments ? this.taskData?.comments : null],
        assignType: [this.taskData?.performerType ? this.taskData?.performerType : null, [Validators.required]],
        assignId: ['', [Validators.required, this.validateInchargeSelection.bind(this)]],
        comments: [this.taskData?.remarks ? this.taskData.remarks : null],
        statusId: [this.taskData?.statusId ? this.taskData.statusId : 'RQ-CR'],
        scheduleTypeId: [this.taskData?.scheduleActivityTypeId ? this.taskData?.scheduleActivityTypeId : this.activityScheduleType, [Validators.required]],
        startDate: [this.taskData?.scheduleStartTime ? this.dateFormat.transform(this.taskData?.scheduleStartTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : this.currentDate],
        scheduleEndTime: [this.taskData?.scheduleEndTime ? this.dateFormat.transform(this.taskData.scheduleEndTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'): this.tomorrowDate],
        priorityLevelId: [this.taskData?.priorityLevelId ? this.taskData.priorityLevelId : null],
        formTemplateId :[null]
      })
      this.itemForm = this.form.group({
        itemMasterId: [null,[Validators.required,this.validateItemSelection.bind(this)]],
        batchId:[this.editInventory ? this.itemBatchName :null,[Validators.required]],
        quantity: [1,[Validators.required]],
      });
      if (this.data.type === 'modify') {
        if (this.taskData?.activityCategoryId === null) {
          this.taskForm.get('categoryId').setValue('AC-OT');
          this.taskForm.get('taskId').setValue(this.taskData?.title);
        }
        if(this.taskData?.scheduleActivityTypeId)
        setTimeout(() => {
          this.taskForm.get('startDate').setValue(this.dateFormat.transform(this.taskData?.scheduleStartTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'))
        })
      }
    }
  
    private validateLocationSelection(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.locationList || this.locationList.length === 0) {
          return { invalidLocation: true };
        }
  
        let selectedLocation = this.locationList.find(val => {
          let combinedName = `${val.fullName}`;
          return val.id === selectedId || combinedName === selectedId;
        });
        if (!selectedLocation) {
          return { invalidLocation: true };
        }
      }
      return null;
    }
  
    private validateAssetSelection(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.assetList || this.assetList.length === 0) {
          return { invalidAsset: true };
        }

        let selectedAsset = this.assetList.some(val => {
          const displayValue = val.serialNo ? `${val.assetName} (${val.serialNo})` : val.assetName;
          const assetIdMatch = val.assetId === selectedId || val.assetId === Number(selectedId);
          const displayMatch = displayValue === selectedId;
          return assetIdMatch || displayMatch;
        });

        if (!selectedAsset) {
          return { invalidAsset: true };
        }
      }
      return null;
    }
  
    private validatePatientSelection(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.patientList || this.patientList.length === 0) {
          return { invalidPatient: true };
        }
  
        let selectedPatient = this.patientList.find(val => val.id === selectedId || val.fullName === selectedId);
        if (!selectedPatient) {
          return { invalidPatient: true };
        }
      }
      return null;
    }
  
    private validateInchargeSelection(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.taskInchargeList || this.taskInchargeList.length === 0) {
          return { invalidIncharge: true };
        }
  
        let selectedPatient = this.taskInchargeList.find(val => val.id === selectedId || val.name === selectedId);
        if (!selectedPatient) {
          return { invalidIncharge: true };
        }
      }
      return null;
    }
  
    getSelectTask(event) {
      this.selectedTask = event
      this.bulidForm();
      this.getCategoryList();
      this.validateControl();
      this.updateSelectedEntityData();
      this.ticketformBuilderSource =[];
      this.formTemplate=null;
    }
  
  updateSelectedEntityData() {
    if (this.tabChangeTriggered) return;
    this.tabChangeTriggered = true;

    const entityGroup = {
      "PR-LC": { entityGroupTypeId: "EGTI-LOC", parentType: "Location" },
      "PR-AT": { entityGroupTypeId: "EGTI-AS", parentType: "Asset" },
      "PR-PA": { entityGroupTypeId: "EGTI-PA", parentType: "Patient" }
    };

    const entityType = this.selectedTask || this.data?.['Context Id'] || this.taskData?.['requestCategory'] || "PR-LC";
    const selectedGroup = entityGroup[entityType] || entityGroup["PR-LC"];
    const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
    const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
    const parentId = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null;
    const newEntityData = {
      id: null,
      entityId: this.data?.requestId || null,
      entityType: "Request",
      parentId: parentId,
      parentType: selectedGroup.parentType,
      entityDetails: null,
      entityGroupTypeId: selectedGroup.entityGroupTypeId,
      entityTypeId: null,
      formTemplateType: null
    };

    if (JSON.stringify(this.entityData) !== JSON.stringify(newEntityData)) {
      this.entityData = newEntityData;
    }
    setTimeout(() => (this.tabChangeTriggered = false), 100);
  }
     
  
    validateControl() {
      const requiredFields = {
        'PR-LC': 'locationId',
        'PR-AT': 'assetId',
        'PR-PA': 'patientId',
        'PR-GN': 'generalId',
      };
      const fields = ['locationId', 'assetId', 'patientId', 'generalId'];
      fields.forEach(field => {
        const control = this.taskForm.get(field);
        if (control) {
          if (requiredFields[this.selectedTask] === field) {
            if (field === 'locationId') {
              control.setValidators([
                ...(this.taskData?.title ? [] : [Validators.required]),
                this.validateLocationSelection.bind(this)
              ]);
            } else if (field === 'assetId') {
              control.setValue(this.taskData?.nonPerformerName);
              control.setValidators([
                ...(this.taskData?.title ? [] : [Validators.required]),
                this.validateAssetSelection.bind(this)
              ]);
            } else if (field === 'patientId') {
              control.setValue(this.taskData?.nonPerformerName);
              control.setValidators([
                Validators.required,
                this.validatePatientSelection.bind(this)
              ]);
            } else {
              control.setValidators([Validators.required]);
            }
          } else {
            control.setValidators([]);
            control.setValue(null);
          }
          control.updateValueAndValidity();
        }
      });
    }
  
    getCategoryList() {
      this.commonService.getAppTermsLink(this.selectedTask, 'ActivityCategory').subscribe(res => {
        this.categoryList = res.results
      })
    }
  
    getTaskList(type, data) {
      this.taskForm.get('taskId').setValue(null);
      this.taskForm.get('taskId').updateValueAndValidity()
      this.taskForm.get('assignId').setValue(null);
      this.taskForm.get('taskId').updateValueAndValidity()
      this.taskForm.get('assignType').setValue(null);
      this.taskForm.get('assignType').updateValueAndValidity();
      this.configurationService.getTaskActivities(type, data).subscribe(res => {
        this.taskActivitiesList = res.results;
        if (data === this.taskData?.activityCategoryId) {
          const activityTask = this.taskActivitiesList.find(val => val.id === this.taskData.activityId)
          this.roleIds = activityTask.roleIds;
          this.departmentIds = activityTask.departmentIds;
          this.updateAssignTypeList(activityTask.roleIds, activityTask.departmentIds);
          this.taskForm.get('description').setValue(this.taskData?.comments);
        } else {
          let activityData = this.taskActivitiesList && this.taskActivitiesList[0];
          if (activityData) {
            this.taskForm.get('taskId').setValue(activityData.id);
            this.taskForm.get('taskId').updateValueAndValidity()
            this.roleIds = activityData.roleIds;
            this.departmentIds = activityData.departmentIds;
            this.updateAssignTypeList(activityData.roleIds, activityData.departmentIds);
            this.taskInchargeEnabled = false;
            let activityId: any = {};
            activityId['value'] = activityData.id;
            this.selectedTaskActivity(activityId)
          }
        }
      });
    }
  
    getTaskAssignList(id) {
      if (id) {
        const taskIncharge = this as any as { id: string, name: string }[];
        const matched = taskIncharge.find(obj => obj.id === id || obj.name === id);
        return matched ? matched.name : '';
      } else {
        return '';
      }
    }
  
    getLocationList(id) {
      if (id !== null) {
        const location = this as any as { id: string,fullName: string }[]
        const locationId = location.find(obj => obj.id === id).fullName;
        return locationId;
      } else {
        return '';
      }
    }
  
    getAssetList=(id)=>{
      this.displayAssetName = null
      if (!id || !this.assetList?.length) return '';
      const asset = this.assetList.find(asset => asset.assetId === id);
      if (!asset) return '';
      const name = asset.assetName ?? '';
      const serial = asset.serialNo ? ` (${asset.serialNo})` : '';
      this.displayAssetName = `${name}${serial}`;
      return `${name}${serial}`;
    }
  
    getPatientList(id) {
      if (id !== null) {
        const patient = this as any as { id: string, fullName: string }[]
        const patientId = patient.find(obj => obj.id === id).fullName;
        return patientId;
      } else {
        return '';
      }
    }
  
    searchLocationList(event) {
      if (event.text.length >= 2) {
        if (event.toHit == true) {
          this.configurationService.getLocationData(event.text).subscribe(res => {
            this.locationListItems = res.results;
            this.locationList = this.locationListItems;
            this.locationEnabled = true;
            if(this.selectedTask === 'PR-LC'){
              this.taskForm.get('locationId').updateValueAndValidity();
            } else {
              this.taskForm.get('destinationId').updateValueAndValidity();
            }
          });
        } else {
          this.locationList = this.locationListItems;
          this.locationEnabled = true;
        }
      } else {
        this.locationList = [];
        this.locationEnabled = false;
      }
    }
  
    searchAssetList(event) {
      if (event.text.length >= 2) {
        if (event.toHit == true) {
          this.commonService.getAssetSearch(null, event.text).subscribe((res) => {
            this.assetListItems = res.results;
            this.assetList = this.assetListItems;
            this.assetNameEnabled = true;
            this.taskForm.get('assetId').updateValueAndValidity();
          });
        } else {
          this.assetList = this.assetListItems;
          this.assetNameEnabled = true;
        }
      } else {
        this.assetList = [];
        this.displayAssetName = null;
        this.assetNameEnabled = false;
      }
    }
  
    searchPatientList(event) {
      if (event.text.length >= 2) {
        if (event.toHit == true) {
          this.commonService.searchInpatient(event.text).subscribe((res) => {
            this.patientListItems = res.results;
            this.patientList = this.patientListItems;
            this.patientNameEnabled = true;
            this.taskForm.get('patientId').updateValueAndValidity();
          });
        } else {
          this.patientList = this.patientListItems;
          this.patientNameEnabled = true;
        }
      } else {
        this.patientList = [];
        this.patientNameEnabled = false;
      }
    }
  
    selectedTaskActivity(event) {
      this.assignTypeList = [];
      this.taskInchargeList = [];
      this.taskInchargeEnabled = false
      const selectedTask = this.taskActivitiesList.find(task => task.id === event.value);
      this.taskByreminderData = selectedTask
      this.roleIds = selectedTask.roleIds !== null ? selectedTask.roleIds : [];
      this.departmentIds = selectedTask.departmentIds !== null ? selectedTask.departmentIds : [];
      this.updateAssignTypeList(this.roleIds, this.departmentIds);
      if (selectedTask && selectedTask.inchargeId !== null) {
        let type = selectedTask.inchargeType;
        let text = selectedTask.inchargeName;
        this.inchargeId = selectedTask.inchargeId;
        if (type == 'RT-RO') {
          this.configurationService.getRecipientName('', type).subscribe(res => {
            this.taskInchargeList = res.results.filter(val => val.id === this.inchargeId);
            this.taskInchargeEnabled = true;
            if (this.taskInchargeList.length) {
              let name = this.taskInchargeList[0].name
              this.taskForm.get('assignId').setValue(name)
            }
            this.taskForm.get('assignId').updateValueAndValidity();
          });
        }
  
        if (type == 'RT-US') {
          let roles = this.roleIds.length ? this.roleIds.join(',') : null;
          let departments = this.departmentIds.length ? this.departmentIds.join(',') : null;
          this.configurationService.getRoleUser(null, roles, departments, this.inchargeId).subscribe(res => {
            this.taskInchargeList = res.results.filter(val => val.id === this.inchargeId)
            this.taskInchargeEnabled = true;
            if (this.taskInchargeList.length) {
              let name = this.taskInchargeList[0].name;
              this.taskForm.get('assignId').setValue(name);
            }
            this.taskForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
          });
        }
  
        if(type == 'RT-DT'){
          this.commonService.getAllDepartments().subscribe(res => {
            this.taskInchargeList = res.results.filter(val => val.id === this.inchargeId);
            this.taskInchargeEnabled = true;
            if (this.taskInchargeList.length) {
              let name = this.taskInchargeList[0].name
              this.taskForm.get('assignId').setValue(name)
            }
            this.taskForm.get('assignId').updateValueAndValidity();
          });
        }
      }
      if (selectedTask) {
        this.canAutoAllocate = selectedTask.canAutoAllocate;
        this.autoComplete = selectedTask.autoComplete;
        this.inchargeId = selectedTask.inchargeId;
        if(selectedTask.destinationId !== null){
          this.locationId = selectedTask.destinationId
        }
        if(this.selectedTask === 'PR-GN'){
          this.taskForm.get('general').setValue(selectedTask.name)
        }
        this.taskForm.patchValue({
          'assignType': selectedTask.inchargeType,
          'assignId': selectedTask.inchargeName,
          'description': selectedTask.description,
          'comments': selectedTask.remarks,
          'easyTaskLocation': selectedTask.destinationName,
          'priorityLevelId': selectedTask.priorityLevelId
        });
      }
    }
  
    private updateAssignTypeList(selectedRoles: any[], selectedDepartments: any[]) {
      let filteredList: any[] = [];
      if (selectedRoles?.length) {
        filteredList.push(...this.orginalAssignTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
      }
      if (selectedDepartments?.length) {
        filteredList.push(...this.orginalAssignTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
      }
      this.assignTypeList = [...new Set(filteredList)];
    }
  
    getTaskIncharge(type) {
      this.taskInchargeList = []
      this.taskInchargeEnabled = false;
      this.taskInchargeId = null;
      this.taskForm.get('assignId').setValue(null);
      this.taskForm.get('assignId').updateValueAndValidity();
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
          this.taskInchargeEnabled = true;
        });
      } else if(type === 'RT-DT') {
        this.commonService.getAllDepartments().subscribe(res => {
          this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
          this.taskInchargeEnabled = true;
        });
      } else if(type === 'RT-US') {
        let departmentsString = this.departmentIds;
        let roles = this.roleIds.length ? this.roleIds.join(',') : null;
        let department = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
        this.configurationService.getRoleUser('', roles, department).subscribe(res => {
          this.taskInchargeList = res.results;
          this.taskInchargeListRes = res.results;
          this.taskInchargeEnabled = true;
        })
      } else {
        this.taskInchargeList = [];
        this.taskInchargeEnabled = false;
      }
    }
    searchTaskUserNamelist(event) {
      console.log(event)
      this.toHit = event.toHit;
      this.taskInchargeId = null;
      let type = this.taskForm.controls['assignType'].value;
      if (type === 'RT-US') {
        if ((event.type === 'taskIncharge') && event.text.length >= 2 && this.toHit == true) {
          let text = event.text;
          let departmentsString = this.departmentIds;
          let roles = this.roleIds.length ? this.roleIds.join(',') : null;
          let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
          this.configurationService.getRoleUser(text, roles, departments).subscribe(res => {
            this.taskInchargeList = res.results;
            this.taskInchargeEnabled = true;
            this.taskForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
          });
        } else {
          this.taskInchargeList = this.taskInchargeListRes;
          this.taskInchargeEnabled = true;
        }
      } else {
        if (type === 'RT-RO') {
          this.configurationService.getRecipientName('', type).subscribe(res => {
            this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
            this.taskInchargeEnabled = true;
          });
        } else if(type === 'RT-DT'){
          this.commonService.getAllDepartments().subscribe(res => {
            this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
            if (this.taskInchargeList.length) {
              let name = this.taskInchargeList[0].name
              this.taskForm.get('assignId').setValue(name)
            }
            this.taskForm.get('assignId').updateValueAndValidity();
          });
        }
      }
    }
  
      getFormTemplateInfo(){
        this.configurationService.getFormTemplates(this.taskForm.controls['formTemplateId'].value).subscribe(res =>{
          if(res.statusCode === 1){
            let formEntityIndex = -1;
            let formTempData = res.results[0];
            let jsonValue = JSON.parse(formTempData.jsonValue);
            let pfFormTemplateId =  formTempData['id'];          
            let formTemplateName = formTempData['name'];
            let entityFormStatusId = 'EFS-DR';
            if(jsonValue.hasOwnProperty('status') && jsonValue.status.length) {
              let statusList = this.commonService.sortByKey(jsonValue.status, 'level');
              entityFormStatusId = statusList[0]['code']
            }           
            if(jsonValue.hasOwnProperty('dataScope') && jsonValue['dataScope'] == 'type'){
              formEntityIndex = this.ticketformBuilderSource.findIndex(res => res.pfFormTemplateId == this.taskForm.controls['formTemplateId'].value);
            }
            if(formEntityIndex != -1){
              let entityData = this.ticketformBuilderSource[formEntityIndex];
              this.formBuilder(entityData);
            }else{
              this.formBuilder(null);
              this.taskForm.controls.formTemplateId.setValue(null);
              // this.postFormData(pfFormTemplateId, formTemplateName, entityFormStatusId)         
            }   
          }
        })
      }
      postFormData(pfFormTemplateId, formTemplateName?, entityFormStatusId?, formValue?) {
        const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
        const type = typeMap[entityType] || 'location';
        const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
        const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
        const postData = {
          id: null,
          entityId: this.data?.requestId ?? null,
          entityType: 'request',
          parentId: id,
          parentType: type,
          pfFormTemplateId,
          status: true,
          formValue: formValue ? formValue : {},
          name: formTemplateName,
          entityFormStatusId,
          comments: null
        };
      
        if (this.data.type !== 'modify') {  
          if(postData['entityId'] == null) {
            postData["startDate"] = new Date();
            postData["entityFormStatusName"] = entityFormStatusId == 'EFS-CR' ? 'Created' : entityFormStatusId == 'EFS-DF' ? 'Draft' : null;
            postData["modifiedUser"] = localStorage.getItem(btoa('current_user'));
            if(this.entityForms.length) {
              let findIndex = this.entityForms.findIndex(val => val.pfFormTemplateId == pfFormTemplateId)
              if (findIndex != -1) {
                this.entityForms.splice(findIndex, 1);
              }
            }
            this.entityForms.push(postData);
            this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms)); 
          } else {
            this.entityForms.push(postData);
            this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms));
          }
          console.log(this.ticketformBuilderSource)
        } else {
          this.formBuilder(postData);
        }
      }
      
  
      getFormDetails() {
        const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
        const type = typeMap[entityType] || 'location';
        const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
        const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
        if(this.data.requestId != null||this.data.requestId != undefined){
        this.commonService.getFormDetails(this.data.requestId,'request').subscribe(res => {
          if (res.statusCode == 1) {
            let result = res.results.filter(res => res.status);
            this.ticketformBuilderSource = result.reverse();
          }
        });
      }
      }
    
      getFormTemplate() {
        const contextValue = this.selectedTask ?? (this.data.hasOwnProperty('Context Id') ? this.data['Context Id'] : this.taskData['requestCategory']);
        const formTemplateTypeMap = {'PR-LC': 'FTT-LOC','PR-AT': 'FTT-AT'};
        const formtemplateType = formTemplateTypeMap[contextValue] || 'FTT-OT';
        const departmentValue = localStorage.getItem(btoa('departmentId'));
        const departmentId = departmentValue !== null && departmentValue !== "null" ? Number(departmentValue) : null;      
        const identifyingType = contextValue ==='PR-LC' ? 'categoryId':'assetType';
        const identifyingValue =contextValue ==='PR-LC' ? this.assetData.locationCategoryId: this.assetData.assetTypeId;
          this.configurationService.getEntityAssociatedForms('FS-PU',formtemplateType,'QLF-ASG',departmentId,identifyingType,identifyingValue).subscribe(res => {
            this.formTemplate = res.results;
          });
         }
      
      getEntityDetails() {
        const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
        const type = typeMap[entityType] || 'location';
        const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
        const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
        if(id !=null){
        const fetchDetails = type === 'asset'? this.configurationService.getAllAsset(id): this.hospitalService.getLogicalLocationById(id);
        fetchDetails.subscribe(res => {
          this.assetData = res.results[0];
          this.getFormTemplate()
        });
        }
      }
      
      formBuilder(data) {
        const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
        const type = typeMap[entityType] || 'location';
        const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
        const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
        if(data !== null) {
          this.formData = { "id" :data.id ,"parentId" :id, "parentType":type ,"entityId":this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.assetData,"entityFormStatus":data['entityFormStatusId']};
        } else {
          const pfFormTemplateId = this.taskForm.controls['formTemplateId'].value;
          this.formData = { "id" : null, "parentId" :id, "parentType":type ,"entityId":this.data.requestId ? this.data.requestId : null, "entityType":"request", "pfFormTemplateId" : pfFormTemplateId, "content" : "form","entityData": this.assetData};
        }
        const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
          panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          if(result != ''){
            if(this.data.requestId) {        
              this.entityForms=[result];
              this.editTask(this.data?.requestId,'form')
            } else {
              this.taskForm.controls.formTemplateId.setValue(null)
              this.postFormData(result?.pfFormTemplateId, result.name, result.entityFormStatusId,result.formValue)         
            }
          }
        });
      }
    
      viewHistory(data){
        const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
        const type = typeMap[entityType] || 'location';
        const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
        const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
        this.formData = { "id" : data.id ,"parentId" :id, "parentType":type ,"entityId":this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.taskForm.value,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
        const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
          panelClass: ['fullscreen-form-dialog'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          this.formData = null;
        });
      }
  
    getAllTktHist(id) {
      this.commonService.getPorterHistory(id).subscribe((res) => {
        if (res.statusCode === 1) {
          let ticketEvents = res.results;
          ticketEvents.forEach(element => {
            if (element.eventTime) {
              element.eventTime = this.dateFormat.transform(element.eventTime, 'dd/MM/yyyy hh:mm a');
            }
          });
          // for attaching Document attachment against event 
          // const attach = ticketEvents.map(el => ({
          //   ...el,
          //   ...this.attachmentData.find(arr1El => arr1El.entityId === el.id),
          // })); 
          this.ticketEvents = ticketEvents
        }
      });
     
    }
  
    getAllAttachments(id) {
      this.commonService.getAllAttachments(id, 'Request').subscribe((res) => {
        this.attachmentData = res.results;
        this.getAllTktHist(id);
      });
    }
  
    getTicketInventoryDetails(id){
      this.commonService.getTicketInventoryDetails(id).subscribe(res=>{
       if (res.results && res.results.length > 0) {
       this.dataSourceItem=res.results;
       } else {
         this.dataSourceItem = [];
       }
      })
   }
    private validateItemSelection(control: FormControl): { [key: string]: any } | null {
      this.selectedItemId = control.value;
      if (control.value) {
        if (!this.selectedItemId || !this.itemList || this.itemList.length === 0) {
          return { 'invalidItemSelection': true };
        }
        let selectedItem = this.itemList.find(item => item.id == this.selectedItemId);
        if (this.editInventory && selectedItem === undefined) {
          selectedItem = this.itemList.find(item => item.name === this.selectedItemId);
        } 
        if (control.value !== null && selectedItem === undefined) {
          return { 'invalidItemSelection': true };
        }
      }
      return null;
    }
  
    getAssetLoction(event){
      if(event.locationId){
        let locationId = event.locationId
        this.commonService.getLocationById(locationId).subscribe(res => {
          this.locationList = [res.results];
          this.locationEnabled = true;
          if (this.locationList.length) {
            let locationName = this.locationList[0].fullName;
            this.taskForm.get('destinationId').setValue(locationName)
          }
          this.taskForm.get('destinationId').updateValueAndValidity();
        });
      }
    }
  
    selectedActivitySchedule(code) {
      this.activityScheduleType = code;
      this.isDateTime = true
      let selectedStartDate = this.toDay;
      const tomorrowDateObj = new Date(selectedStartDate.getTime() + 24 * 60 * 60 * 1000);
      this.tomorrowDate = this.dateFormat.transform(tomorrowDateObj, 'yyyy-MM-dd HH:mm');
      if (code === 'SAT-BTM' || code === 'SAT-RGBT') {
        setTimeout(() => {
          if (code === 'SAT-RGBT') {
            this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd HH:mm'))
            this.taskForm.get('scheduleEndTime').setValue(this.tomorrowDate);
          } else {
            this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd HH:mm'));
            this.taskForm.get('scheduleEndTime').setValue(null);
          }
        }, 200)
      } else {
        this.isDateTime = false
        let tomorrowDateObj = new Date(selectedStartDate.getTime() + 24 * 60 * 60 * 1000);
        this.tomorrowDate = this.dateFormat.transform(tomorrowDateObj, 'yyyy-MM-dd HH:mm')
        setTimeout(() => {
          if (code === 'SAT-RGAT') {
            this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(this.tomorrowDate, 'yyyy-MM-dd'));
            this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd'))
          } else {
            this.taskForm.get('scheduleEndTime').setValue(null);
            this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd'))
          }
        }, 200)
      }
    }
  
    getDateValue(event, type) {
      const inputElement = event.target as HTMLInputElement;
      const selectedDate = inputElement.value;
      const currentDateObj = new Date(selectedDate);
      let tomorrowDateObj = new Date(currentDateObj.getTime() + 24 * 60 * 60 * 1000);
      this.currentDate = this.dateFormat.transform(selectedDate, 'yyyy-MM-dd HH:mm');
      this.tomorrowDate = this.dateFormat.transform(tomorrowDateObj, 'yyyy-MM-dd HH:mm')
      if (type === 'SAT-RGBT') {
        this.taskForm.get('startDate').setValue(this.currentDate);
        this.taskForm.get('scheduleEndTime').setValue(this.tomorrowDate);
      } else if (type === 'SAT-RGAT') {
        this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(this.tomorrowDate, 'yyyy-MM-dd'));
        this.taskForm.get('startDate').setValue(this.dateFormat.transform(this.currentDate, 'yyyy-MM-dd'))
      } else if (type === 'SAT-BTM') {
        this.taskForm.get('startDate').setValue(this.dateFormat.transform(this.currentDate, 'yyyy-MM-dd HH:mm'));
        this.taskForm.get('scheduleEndTime').setValue(null);
      } else {
        this.taskForm.get('startDate').setValue(this.dateFormat.transform(this.currentDate, 'yyyy-MM-dd'));
        this.taskForm.get('scheduleEndTime').setValue(null);
      }
    } 
  
    private formatScheduleDate(date: any): string | null {
      if (!date) return null;
      const format = this.isDateTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd 00:00:00';
      return this.dateFormat.transform(date, format);
    }

  deleteForm(data) {
    if (this.data.type !== 'modify') {
      const index = this.entityForms.findIndex(item => item.pfFormTemplateId === data.pfFormTemplateId);
      if (index !== -1) {
        this.entityForms.splice(index, 1)
        this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms));
      }
    } else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: 'confirmation-popup',
        data: {
          title: 'Confirmation', message: 'Are you sure you want to delete?',
          buttonText: { ok: 'Yes', cancel: 'No' }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == "Yes") {
          let formTempId = data?.id;
          let formIndex = this.ticketformBuilderSource.findIndex(res => res.id == formTempId);
          this.ticketformBuilderSource[formIndex]['status'] = false;
          this.configurationService.updateEntiryFormTemplates(formTempId, this.ticketformBuilderSource[formIndex]).subscribe(res => {
            if (res.statusCode === 1) {
              this.getFormDetails();
            }
          })
        }
      })
    }
  }
  
    saveTask(canCreate?: boolean) {
      let locationId = typeof this.taskForm.controls['locationId'].value === 'string' ? this.locationId : this.taskForm.controls['locationId'].value
      let assetId = typeof this.taskForm.controls['assetId'].value === 'string' ? this.assetId : this.taskForm.controls['assetId'].value;
      let patientId = typeof this.taskForm.controls['patientId'].value === 'string' ? this.patientId : this.taskForm.controls['patientId'].value;
      let performerId = this.selectedTask === 'PR-LC' ? locationId : this.selectedTask === 'PR-AT' ? assetId : this.selectedTask === 'PR-PA' ? patientId : null;
      let destinationId = typeof this.taskForm.controls['destinationId'].value === 'string' ? this.destinationId : this.taskForm.controls['destinationId'].value;
      this.taskForm.controls['patientId'].value;
      this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null,null,null);
      this.createTask.pfActivityId = this.taskForm.controls['taskId'].value;
      this.createTask.comments = this.taskForm.controls['description'].value;
      this.createTask.remarks = this.taskForm.controls['comments'].value;
      this.createTask.type = this.data.requestedType;
      this.createTask.requestCategory = this.selectedTask;
      this.createTask.scheduleActivityTypeId = 'SAT-ATM';
      this.createTask.scheduleStartTime = this.formatScheduleDate(this.taskForm.controls['startDate'].value);
      this.createTask.scheduleEndTime = this.formatScheduleDate(this.taskForm.controls['scheduleEndTime'].value);
      this.createTask.priorityLevelId = this.taskForm.controls['priorityLevelId'].value;
      if (this.selectedTask === 'PR-LC') {
        this.createTask.destinationId = locationId;
      } else {
        this.createTask.destinationId = destinationId;
      }
      if (this.selectedTask === 'PR-GN') {
        this.nonPerformerInfo = [];
      } else {
        this.nonPerformerInfo = [{
          id: performerId,
          type: this.selectedTask == 'PR-LC' ? 'Location' : this.selectedTask == 'PR-AT' ? 'Asset' : 'Patient',
        }];
      }
      let inchargeId = typeof this.taskForm.controls['assignId'].value === 'string' ? this.inchargeId : this.taskForm.controls['assignId'].value
      this.performerInfo = [{
        id: inchargeId,
        type: this.taskForm.controls['assignType'].value,
      }];
      this.createTask.title = this.taskForm.controls['general'].value;
      this.createTask.isautoAssigned = this.canAutoAllocate;
      this.createTask.isAutoComplete = this.autoComplete;
      this.createTask.performer = this.performerInfo;
      this.createTask.nonPerformer = this.nonPerformerInfo;
      this.createTask.attachFiles = this.attachFiles;
      if(canCreate) {
        this.createTask.canCreate = true;
      }
      // this.createTask.configValue = null;
      this.commonService.saveTask(this.createTask).subscribe(async res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            if(this.isReminderFormValid){
            }
            // Based on entityforms length formData are saved during create time of task
              if (this.entityForms.length !== 0 && res.results?.requestId) {
                // Update entityId for all objects
  
                // remove column keys from the table data
                const keysToRemove = ["startDate", "entityFormStatusName", "modifiedUser"];              
                this.entityForms = this.entityForms.map(form => {
                  const formTemplate = { ...form };
                  keysToRemove.forEach(key => {
                    delete formTemplate[key as keyof typeof form];
                  });
                  return formTemplate;
                });
                this.entityForms = this.entityForms.map(obj => ({
                  ...obj,
                  entityId: res.results.requestId
                }));
                try {
                  for (const form of this.entityForms) {
                    await this.configurationService.saveEntityForm(form).toPromise();
                  }
                  this.close();
                } catch (error) {
                  console.log(error);
                }
              }else {
              this.close()
            }
          }
        },
        error => {
        if(error.error.errorCode === "TWAPI0008") {
          const dialogRef = this.dialog.open(ConfirmationDialog, {
            panelClass:['confirmation-popup'],
            disableClose: true,
            data: {
              title: 'Confirmation',
              message: error.error.message + '.' + ' Do you want to create a ticket again?',
              buttonText: { cancel: 'No', ok: 'Yes' }, customMsg: true,
              checkAvailablePorter: true,
              isRemark: 1,
            },
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result === 'Yes') {
              this.saveTask(true);
            }
          });
        } else {
          this.toastr.error('Error', `${error.error.message}`);
        }
      });
    }
  
    editTask(id?,type?) {
      let locationId = typeof this.taskForm.controls['locationId'].value === 'string' ? this.locationId : this.taskForm.controls['locationId'].value;
      let assetId = typeof this.taskForm.controls['assetId'].value === 'string' ? this.assetId : this.taskForm.controls['assetId'].value;
      let patientId = typeof this.taskForm.controls['patientId'].value === 'string' ? this.patientId : this.taskForm.controls['patientId'].value;
      let performerId = this.selectedTask === 'PR-LC' ? locationId : this.selectedTask === 'PR-AT' ? assetId : this.selectedTask === 'PR-PA' ? patientId : null;
      let destinationId = typeof this.taskForm.controls['destinationId'].value === 'string' ? this.destinationId : this.taskForm.controls['destinationId'].value;
      this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null, null,null);
      this.createTask.pfActivityId = this.taskForm.controls['taskId'].value;
      this.createTask.title = this.taskForm.controls['general'].value;
      this.createTask.comments = this.taskForm.controls['description'].value;
      this.createTask.remarks = this.taskForm.controls['comments'].value;
      this.createTask.type = this.data.requestedType;
      this.createTask.requestCategory = this.selectedTask;
      this.createTask.scheduleActivityTypeId = 'SAT-ATM';
      this.createTask.scheduleStartTime = this.formatScheduleDate(this.taskForm.controls['startDate'].value);
      this.createTask.scheduleEndTime = this.formatScheduleDate(this.taskForm.controls['scheduleEndTime'].value);
      this.createTask.priorityLevelId = this.taskForm.controls['priorityLevelId'].value;
      if (this.selectedTask === 'PR-LC') {
        this.createTask.destinationId = locationId;
      } else {
        this.createTask.destinationId = destinationId;
      }
  
      if (this.selectedTask === 'PR-GN') {
        this.nonPerformerInfo = []
      } else {
        if(performerId) {
          this.nonPerformerInfo = [{
            id: performerId,
            type: this.selectedTask == 'PR-LC' ? 'Location' : this.selectedTask == 'PR-AT' ? 'Asset' : 'Patient',
          }];
        }
      }
      let inchargeId = typeof this.taskForm.controls['assignId'].value === 'string' ? this.inchargeId : this.taskForm.controls['assignId'].value
      this.performerInfo = [{
        id: inchargeId,
        type: this.taskForm.controls['assignType'].value,
      }];
      this.createTask.isautoAssigned = this.canAutoAllocate;
      this.createTask.isAutoComplete = this.autoComplete;
      this.createTask.performer = this.performerInfo;
      this.createTask.nonPerformer = this.nonPerformerInfo;
      this.createTask.status = this.taskForm.controls['statusId'].value;
  
      this.createTask.attachFiles = this.attachFiles;
      this.createTask.entityForms = this.entityForms;
      this.createTask.ticketId = id ? id : null;
      this.commonService.editTask(this.data.requestId, this.createTask).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          if(this.isReminderFormValid){
          }
          this.taskForm.reset();
          if(type == 'form') {
            this.getTaskDetails()
          } else {
           this.close()
          }
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
    close(){
      this.bottomSheetRef.dismiss()
    }
  

  uploadfile() {
    let data = {entityCode: this.codeMap[this.selectedTask]};
    const dialogRef = this.dialog.open(PwaUploadTaskComponent, {
      data: data, height: '250px',maxWidth:'none', panelClass: ['mdm-Confirmation-popup'],
      disableClose: true});
    dialogRef.afterClosed().subscribe(res => {
      if(res !== ''){
        this.attachFiles.push(res);
      }
    })
  }

  getFileDownload(element) {
    element['isPwa'] =true;
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  removeAttachment(data){
    if (data['attachmentId'] != null) {
      this.commonService.deleteItemAttachment(data['attachmentId']).subscribe(res => {
    });
    }
    const index: number = this.attachFiles.findIndex(d => d === data);
    console.log(index)
    this.attachFiles.splice(index, 1);
  }
  fixClick() {
    console.log('')
  }
}

@Component({
   selector: 'app-pwa-task-upload',
   templateUrl: './pwa-task-upload.component.html',
   styleUrls: ['./manage-pwa-task.component.scss'],
 })

export class PwaUploadTaskComponent implements OnInit {
  documentType: any;
  documentForm: FormGroup;
  fileType: string;
  isFileSelected: boolean = false
  image: any;
  imageData: any[] = [];
  attachFiles: any[] = [];
  public base64Data_global: string;
  fileInfo: string;

  constructor( public form: FormBuilder,
      public dialog: MatDialog,
      protected sanitizer: DomSanitizer,
      private readonly commonService: CommonService,
      public toastr: AppToastService,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly dateFormat: DatePipe,
      public dialogRef: MatDialogRef<PwaUploadTaskComponent>
    ){ }
  
  ngOnInit(): void {
    this.buildForm()
    this.commonService.getAppTermsLink(this.data.entityCode).subscribe(res =>{
      this.documentType = res.results
    })
  }

  buildForm() {
    this.documentForm = this.form.group({
      attachFiles: this.form.array([this.getFiles()]),
      documentTypeId: [null],
    })
  }

  private getFiles() {
    return this.form.group({
      base64Data: [''],
      fileType: [''],
      documentTypeId: [''],
      documentName: [''],
    });
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  handleFileSelect(evt) {
    const files = evt.target.files;
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowed_types.includes(evt.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (const file of files) {
      if (file) {
        this.fileType = file.type;
        const reader = new FileReader();

        reader.onload = (function (f) {
          return function (readerEvt) {


            const binaryString = readerEvt.target.result

            this.base64Data_global = btoa(binaryString);

            this.isFileSelected = true;

            if (f.type.includes('image')) {
              const url = this.safeUrl('data:image/png;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/pdf') {
              const url = this.safeUrl('data:application/pdf;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/msword') {
              const url = this.safeUrl('data:application/msword;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'text/plain') {
              const url = this.safeUrl('data:text/plain;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: reader.result,
                mimeType: f.type
              }
            }
            this.isAddDoc = true;
          };
        })(file).bind(this);
        reader.readAsBinaryString(file);
      }
    }
    // setTimeout(() => {
    //   this.addDocRow()
    // }, 500)
  }

  onFileSelect(input: HTMLInputElement) {
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

  addDocRow() {
      let documentTypeName = this.documentType.filter(val => val.code == this.documentForm.controls['documentTypeId'].value);
      let fileData = {
        documentTypeId: this.documentForm.controls['documentTypeId'].value,
        fileName: null,
        documentTypeName: documentTypeName[0].value,
        fileType: this.image.mimeType,
        base64Data: this.base64Data_global,
        attachmentId: null,
        image: this.image.file,
        createdBy: localStorage.getItem(btoa('current_user')),
        createdOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
        modifiedOn:null,
        modifyByName:null
      }
      this.dialogRef.close(fileData);
    }
}

@Component({
    selector: 'app-manage-pwa-info',
    templateUrl: './manage-pwa-info.component.html',
    styleUrls: ['./manage-pwa-task.component.scss']
 })

export class ManagePwaInfoComponent {
  public createTask: CreateTask
  public tabs = [
    { name: 'Info', iconType: 'icon', iconName: 'info' },
    { name: 'Document', iconType: 'img', iconName: '../../../../../assets/Menus/task-document.svg' },
    { name: 'Form', iconType: 'img', iconName: '../../../../../assets/Menus/task-form.svg' },
    { name: 'History', iconType: 'icon', iconName: 'update' }
  ];
  public codeMap: Record<string, string> = {
    'PR-LC': 'EGTI-LOC',
    'PR-PA': 'EGTI-PA',
    'PR-AT': 'EGTI-AS',
    'PR-GL': null,
  };
  public selectedTab = 'Info'
  attachFiles = [];
  ticketformBuilderSource = [];
  assetData: any;
  formTemplate: any;
  formData: { id: any; parentId: any; parentType: any; entityId: any; entityType: string; pfFormTemplateId: any; content: string; entityData: any; entityFormStatus: any; };
  entityForms: any;
  ticketEvents: any[] = [];
  statusId = null;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any, public bottomSheetRef: MatBottomSheetRef<ManagePwaInfoComponent>,
    private readonly commonService: CommonService, public dialog: MatDialog, private readonly configurationService: ConfigurationService,
    private readonly hospitalService: HospitalService, public toastr: AppToastService, private readonly dateFormat: DatePipe,
    private readonly workflowService: WorkflowService, public PushNotificationsService : PushNotificationsService) {
    if (this.data) {
      let modifyData = this.data[0]
      this.data = modifyData
    }
  }



  selectTab(event) {
    this.selectedTab = event;
    if (event === 'Document') {
      this.updateSelectedEntityDataAttachment();
    } else if (event === 'Form') {
      this.getFormDetails();
      this.getEntityDetails();
    } else if (event === 'History') {
      this.getTaskHistory()
    }
  }

  reAssign(event) {
    const data = event;
    data['launchType'] = "isTask";
    data['launchAssign'] = null;
    data['selectedTabIndex'] = event.requestCategoryId;
    const dialogRef = this.dialog.open(AssignTaskComponent, {
      data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
       this.workflowService.getTaskById(this.data.requestId).subscribe((res) => {
        this.data = res.results[0];
       });
    });
  }

  statusUpdate(event) {
    this.statusId = event
    let statusName = this.statusId === 'RQ-CO' ? 'Complete Task' : this.statusId === 'RQ-IP' ? 'Manage Task' : 'Cancel Task'
    let statusMsg = this.statusId === 'RQ-CO' ? 'Do you want to complete the task ?' : this.statusId === 'RQ-IP' ? 'Do you want to inprogress the task ?' : 'Do you want to cancel the task ?'
    const completeData = {
      "comments": this.data.comments, "type": "RQT-TASK",
      "status": event, "userType": this.data.performerType
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title: statusName, message: statusMsg,
        buttonText: { ok: 'Yes', cancel: 'No' },
        'completeTask': true, 'requestId': this.data.requestId, 'completeData': completeData
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'confirm') {
        this.PushNotificationsService.triggerNotificationRefresh();
         this.workflowService.getTaskById(this.data.requestId).subscribe((res) => {
          this.data = res.results[0];
        });
      }
    });
  }

  updateSelectedEntityDataAttachment() {
    const entityGroup = {
      "PR-LC": { entityGroupTypeId: "EGTI-LOC", parentType: "Location" },
      "PR-AT": { entityGroupTypeId: "EGTI-AS", parentType: "Asset" },
      "PR-PA": { entityGroupTypeId: "EGTI-PA", parentType: "Patient" }
    };

    const entityType = this.data.requestCategoryId;
    const selectedGroup = entityGroup[entityType];
    const parentId = this.data.nonPerformerId;
    const newEntityData = {
      id: null,
      entityId: this.data?.requestId || null,
      entityType: "Request",
      parentId: parentId,
      parentType: selectedGroup.parentType,
      entityDetails: null,
      entityGroupTypeId: selectedGroup.entityGroupTypeId,
      entityTypeId: null,
      formTemplateType: null
    };
    this.commonService.getAllAttachments(newEntityData.entityId, newEntityData.entityType, newEntityData.parentId, newEntityData.parentType).subscribe(res => {
      if (res.results.length > 0 && !this.attachFiles?.length) {
        this.attachFiles = res.results;
      }
    });
  }

  uploadfile() {
    let data = {entityCode: this.codeMap[this.data.requestCategoryId]};
    const dialogRef = this.dialog.open(PwaUploadTaskComponent, {
      data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
      disableClose: true});
    dialogRef.afterClosed().subscribe(res => {
      if(res !== ''){
        this.attachFiles.push(res);
        this.editTask(this.data.requestId)
      }
    })
  }

  getFileDownload(element) {
    element['isPwa'] =true;
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  removeAttachment(data) {
    if (data['attachmentId'] != null) {
      this.commonService.deleteItemAttachment(data['attachmentId']).subscribe(res => {
      });
    }
    const index: number = this.attachFiles.findIndex(d => d === data);
    this.attachFiles.splice(index, 1);
  }

  getFormDetails() {
    const entityType = this.data.requestCategoryId;
    const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
    const type = typeMap[entityType] || 'location';
    const id = this.data.nonPerformerId;
    if (this.data.requestId != null || this.data.requestId != undefined) {
      this.commonService.getFormDetails(this.data.requestId, 'request').subscribe(res => {
        if (res.statusCode == 1) {
          let result = res.results.filter(res => res.status);
          this.ticketformBuilderSource = result.reverse();
        }
      });
    }
  }

  getEntityDetails() {
    const entityType = this.data['requestCategoryId'];
    const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
    const type = typeMap[entityType] || 'location';
    const id = this.data.nonPerformerId;
    if (id != null) {
      const fetchDetails = type === 'asset' ? this.configurationService.getAllAsset(id) : this.hospitalService.getLogicalLocationById(id);
      fetchDetails.subscribe(res => {
        this.assetData = res.results[0];
        this.getFormTemplate()
      });
    }
  }

  getFormTemplate() {
    const contextValue = this.data['requestCategory'];
    const formTemplateTypeMap = { 'PR-LC': 'FTT-LOC', 'PR-AT': 'FTT-AT' };
    const formtemplateType = formTemplateTypeMap[contextValue] || 'FTT-OT';
    const departmentValue = localStorage.getItem(btoa('departmentId'));
    const departmentId = departmentValue !== null && departmentValue !== "null" ? Number(departmentValue) : null;
    const identifyingType = contextValue === 'PR-LC' ? 'categoryId' : 'assetType';
    const identifyingValue = contextValue === 'PR-LC' ? this.assetData.locationCategoryId : this.assetData.assetTypeId;
    this.configurationService.getEntityAssociatedForms('FS-PU', formtemplateType, 'QLF-ASG', departmentId, identifyingType, identifyingValue).subscribe(res => {
      this.formTemplate = res.results;
    });
  }

  postFormData(pfFormTemplateId, formTemplateName?, entityFormStatusId?, formValue?) {
        const entityType = this.data['requestCategory'];
        const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
        const type = typeMap[entityType] || 'location';
        const id = this.data?.nonPerformerId;
        const postData = {
          id: null,
          entityId: this.data?.requestId ?? null,
          entityType: 'request',
          parentId: id,
          parentType: type,
          pfFormTemplateId,
          status: true,
          formValue: formValue ? formValue : {},
          name: formTemplateName,
          entityFormStatusId,
          comments: null
        };
      
        if (this.data.type !== 'modify') {  
          if(postData['entityId'] == null) {
            postData["startDate"] = new Date();
            postData["entityFormStatusName"] = entityFormStatusId == 'EFS-CR' ? 'Created' : entityFormStatusId == 'EFS-DF' ? 'Draft' : null;
            postData["modifiedUser"] = localStorage.getItem(btoa('current_user'));
            if(this.entityForms.length) {
              let findIndex = this.entityForms.findIndex(val => val.pfFormTemplateId == pfFormTemplateId)
              if (findIndex != -1) {
                this.entityForms.splice(findIndex, 1);
              }
            }
            this.entityForms.push(postData);
            this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms)); 
          } else {
            this.entityForms.push(postData);
            this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms));
          }
          console.log(this.ticketformBuilderSource)
        } else {
          this.formBuilder(postData);
        }
      }

  formBuilder(data) {
    const entityType = this.data?.['requestCategory'];
    const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
    const type = typeMap[entityType] || 'location';
    const id = this.data?.nonPerformerId;
    if (data !== null) {
      this.formData = { "id": data.id, "parentId": id, "parentType": type, "entityId": this.data.requestId, "entityType": "request", "pfFormTemplateId": data.pfFormTemplateId, "content": "form", "entityData": this.assetData, "entityFormStatus": data['entityFormStatusId'] };
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: this.formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != '') {
        if (this.data.requestId) {
          this.entityForms = [result];
          this.editTask(this.data.requestId, 'form')
        }
      }
    });
  }

  editTask(id?, type?) {
    this.createTask.attachFiles = this.attachFiles;
    this.createTask.entityForms = this.entityForms;
    this.createTask.ticketId = id ? id : null;
    console.log(this.createTask);
    this.commonService.editTask(this.data.requestId, this.createTask).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.workflowService.getTaskById(this.data.requestId).subscribe((res) => {
          this.data = res.results[0];
        });
        this.statusId = null
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  getTaskHistory(){
    this.commonService.getPorterHistory(this.data.requestId).subscribe((res) => {
      if (res.statusCode === 1) {
        let ticketEvents = res.results;
        ticketEvents.forEach(element => {
          if (element.eventTime) {
            element.eventTime = this.dateFormat.transform(element.eventTime, 'dd/MM/yyyy hh:mm a');
          }
        });
        this.ticketEvents = ticketEvents
      }
    });
  }

  close() {
    this.bottomSheetRef.dismiss()
  }
  fixClick() {
    console.log('')
  }
}
