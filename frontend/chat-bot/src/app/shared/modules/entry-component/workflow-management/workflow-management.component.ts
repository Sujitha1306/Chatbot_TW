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
import { Component, OnInit, ViewChild,  Inject,  ElementRef } from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { FormGroup, FormBuilder, FormControl, Validators, ValidationErrors } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { CreateRoutine, EditRoutine, CreateRoutineActivity, EditRoutineActivity, AddRoutine, CreateRoleRoutineActivity, EditRoleRoutineActivity, ActivateRoutine, UpdateEntityRoutine, CreateTask, CreateTaskEasyPick } from "./workflow-management.model";
import { CommonService, ConfigurationService, WorkflowService } from "../../../services";
import { ConfirmationDialog, MY_FORMATS } from "../confirmation-dialog/confirmation-dialog.component";
import { NestedTreeControl } from "@angular/cdk/tree";
import { of as observableOf} from 'rxjs';
import { PorterRequestHistoryComponent, PorterRequestNewComponent } from "../porter-request/porter-request.component";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { locale_Json_Details } from "../../../../../localeJson/localeJson";
import { PushNotificationsService } from "../../../services/push.notification.service"
import { AppToastService } from "../../../services/toaster.service";
   
   @Component({
     selector: 'app-workflow-management',
     templateUrl: './workflow-management.component.html',
     styleUrls: ['./workflow-management.component.scss'],
     providers: [DatePipe,
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
   })
 
   export class WorkflowManagementComponent implements OnInit {
   
     public activity = false;
     public editActivities = false;
     public defaultTime = null;
     public routineActivities: any;
 
     ACdisplayedColumns: string[] = ["S.No", "activityName", "activityCategory", "inchargeName", "locationName", "scheduleTypeName", "schedule", "isActive", "Select"];
     TaskDisplayedColumns: string[] = ["S.No", "Type", "Name", "Time", "Task", "Details", "Incharge", "Location", "Status", "Icon", "Select"];
     TaskHisDisplayedColumns: string[] = ["S.No", "Type", "Name", "Task", "Details", "Incharge", "Location", "Time", "Completed Time","Status"];
     ACdataSource: MatTableDataSource<any>;
     public treeControl: NestedTreeControl<any>;
     public ACTreedataSource: MatTreeNestedDataSource<any>;
     TkdataSource: MatTableDataSource<any>; 
     TKHisDataSource: MatTableDataSource<any>;
     public routineID: any;
     public routineForm: FormGroup;
     public routineActivityForm: FormGroup;
     public editTaskForm: FormGroup;
     public createRoutine: CreateRoutine;
     public editRoutine: EditRoutine;
     public addRoutine: AddRoutine;
     public activateRoutine: ActivateRoutine;
     public createRoutineActivity: CreateRoutineActivity;
     public editRoutineActivity: EditRoutineActivity;
     public createRoleRoutineActivity: CreateRoleRoutineActivity;
     public editRoleRoutineActivity: EditRoleRoutineActivity;
     public updateEntityRoutine: UpdateEntityRoutine;
     public activities: any;
     public specialityList: any;
     public entityRoutineEventId = null;
 
    @ViewChild('scrollbottom', { static: true }) private readonly myScrollContainer: ElementRef;
     @ViewChild(MatPaginator) paginator: MatPaginator;
     @ViewChild(MatSort) sort: MatSort;
     today = new Date();
     public escalateToList: any;
     public inchargeList: any=[];
     public activityList: any=[];
     public isDisabled = false;
     public activityData = false;
     public edit = false;
     public routineEdit = false;
     public activityId = null;
     public schedule = null;
     public defaultscheduleTime =  this.dateFormat.transform(this.today, 'h:mm a');
     public showDes = true;
     public selectedName = null;
     public routineNameList = null;
     public identifyingId = null;
     public type = null;
     public entityRoutineId = null;
     allRoutineList: any;
     routineList: any;
     statusList: any;
     genderList: any;
     activitySubType: any = []; 
     scheduleType = [];
     inchargeTypeList: any;
     inchargeEnabled = false;
     status = false;
     activityEnabled = false;
     activityTypeList: any;
     inchargeId = null;
     locationEnabled = false;
     locationList: any=[];
     locationId = null;
     requireActivityMatchVal: any;
     requireInchargeMatchVal: any;
     requireLocationMatchVal: any;
     addRoutineID = null;
     routineType = null;
     activitiesDetails: any=[];
     time: string;
     timeExist = false;
     activitiesTime: any;
     scheduleTime = null;
     routineEventStatus = null;
     routineStatusId = null;
     trasactionRoutineId = null;
     isActivityList = false;
     toHit = false;
     routineNameListRes: any=[];
     requireNameMatchVal:any;
     public activitylistItems : any;
     public locationListItems : any;
     public listItems : any=[];
     popWidth: any;
     popHeight: any;
     contentHeight: number;
     isExpanded = false
     isTaskExpanded = true;
     patientInfo: any;
     public defaultTaskDate = this.dateFormat.transform(this.today, 'yyyy-MM-ddTHH:mm');
     
     public createTaskForm: FormGroup;
     public easyPickForm: FormGroup;
     taskExist = false;
     taskHisExist = false;
     taskData: any;
     requestType = null;
     public createTaskEasyPick: CreateTaskEasyPick;
     public createTask: CreateTask;
     taskInchargeTypeList: any;
     height: number;
     taskInchargeList: any = [];
     taskInchargeEnabled = false;
     taskInchargeId = null;
     canAutoAllocate = false;
     requireTaskInchargeMatchVal: any;
     taskInchargeListRes: any = [];
     public taskListItems: any;
     public taskList: any = [];
     public taskEnabled = false;
     public taskId = null;
     public requireTaskMatchVal: any;
     public performerInfo: any = [];
     public nonPerformerInfo: Array<any>;
     public currentDate: any = new Date();
     requestId = null;
     public detail: any;
     patientId: any;
     taskLocationId = null;
     taskLocationEnabled = false;
     taskLocationListRes: any;
     taskLocationList: any;
     public isEditTask = false;
     taskSelectedName: any;
    selectedReqId: any;
     tabType: any;
     public windWidth = window.innerWidth;
     public applyFilterValue: any;
     activityCategoryList: any=[];
     selectedTask: any=[];
     selectedTaskActivity: any=[];
     taskActivitiesList: any=[];
     task: any;
     taskStartTime = this.dateFormat.transform(this.today, 'yyyy-MM-ddTHH:mm');
     taskDescription: any;
     taskRemarks: any;
     routineData: any;
     selectedTab: any;
     permissionTab: any;
     selectedTabIndex: any;
     selectedRow = null;
     treeData: any=[];
     routineExist = true;
     activityExist = false;
     parent = null;
     isAddRoutine = false;
     patientVisitId: any;
     taskLocation: any;
     autoComplete = false;
     historyDate = null;
     search = null;
     mandatory: any;
     child: any;
     entityType = 'Patient';
     entityId = null;
     entityName = null;
     labeltext: string;
     public hazardConfigValue = null;
     public activityCategoryId = null;
     inchargeType: any;
     inchargeName: any;
     isTaskSelect = false;
     easyPickLocId = true;
     pageSize:number = 10;
     pageStart:number = 0;
     length: number = 0;
     pageHit = false;
     activate_btn: any[];
     roleIds: any;
     departmentIds: any;
     originalInchargeTypeList: any;
     departmentList: any;
     roleList: any;
     ipRoutineList: any;
     actScheduleTypeList: any[] = [];
     weekDaysList: any[] = [];
     selectedSchedule = null;
     activityScheduleId = null;
     contextList: any[] = [];
     hours: string = '00';
     minutes: string = '30';
     totalMinutes: number;
     staffRoutineData: any;
     constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<WorkflowManagementComponent>,
       public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService, public PushNotificationsService : PushNotificationsService,
       private readonly commonService: CommonService, private readonly dateFormat: DatePipe, private readonly workflowService: WorkflowService) {
        this.activate_btn = this.commonService.getActivePermission('button');
        }
 
     ngOnInit() {
       if(this.data) {
         this.permissionTab = this.data.permissionTab;
         this.routineData = this.data;
         this.routineEventStatus = this.data.routineEventStatus;
         this.routineStatusId = this.data.routineStatusId;
         this.data['entityName'] = this.data.userName;
         this.data['tabType'] = 'Staff'
         this.staffRoutineData = this.data;
         if(this.data && this.data.minDuration) {
          this.hours = Math.floor(this.data.minDuration / 60).toString().padStart(2, '0');
          this.minutes = (this.data.minDuration % 60).toString().padStart(2, '0');
          }
         if(this.data.routineTypeId){
          this.getScheduleType(this.data.routineTypeId);
         }
         const locale = localStorage.getItem(btoa('lang'))
         if(this.permissionTab?.indexOf('Task') > -1){
          if(locale === 'en-US' || locale === 'en'){
            this.labeltext = locale_Json_Details.en.taskLabel
          } else if(locale === 'ar'){
            this.labeltext = locale_Json_Details.ar.taskLabel
          }
        } else {
          if(locale === 'en-US' || locale === 'en'){
            this.labeltext = locale_Json_Details.en.taskListLabel
          } else if(locale === 'ar'){
            this.labeltext = locale_Json_Details.ar.taskListLabel
          }
        }
       }
     this.commonService.validateUserPreference('taskDefaultTab');
     if (this.commonService.userPreference !== null) {
       if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('taskDefaultTab')) {
         if(this.permissionTab.indexOf(this.commonService.userPreference.taskDefaultTab.value) > -1) {
           this.selectedTab = this.commonService.userPreference.taskDefaultTab.value;
           this.selectedTabIndex = this.permissionTab.indexOf(this.selectedTab)
         } else {
           this.selectedTab =  this.permissionTab[0];
           this.selectedTabIndex = 0;
         }
       } else {
           this.selectedTab =  this.permissionTab[0];
           this.selectedTabIndex = 0;
       }
     }
     if(this.data.RType) {
       this.type = this.data.RType;
     } else {
       this.type = null;
     }
     if (this.data.hasOwnProperty('entityType') && this.data.entityType !== null) {
      this.entityType = this.data.entityType;
     }
     if (this.data.hasOwnProperty('entityId') && this.data.entityId !== null) {
      this.entityId = this.data.entityId;
     }
     if (this.data.hasOwnProperty('entityName') && this.data.entityName !== null) {
      this.entityName = this.data.entityName;
     }
     if(this.data.patientDetail) {
      if (this.data.patientDetail.hasOwnProperty('entityType') && this.data.patientDetail.entityType !== null) {
        this.entityType = this.data.patientDetail.entityType;
       }
       if (this.data.patientDetail.hasOwnProperty('entityId') && this.data.patientDetail.entityId !== null) {
        this.entityId = this.data.patientDetail.entityId;
       }
       if (this.data.patientDetail.hasOwnProperty('entityName') && this.data.patientDetail.entityName !== null) {
        this.entityName = this.data.patientDetail.entityName;
       }
       this.detail = this.data.patientDetail;
       this.patientId = this.data.patientDetail.patientId;
       this.patientVisitId = this.data.patientDetail.patientVisitId;
       this.taskLocationId = this.data.patientDetail.destinationId ? this.data.patientDetail.destinationId : (this.data.patientDetail.destLocationId ? this.data.patientDetail.destLocationId : null);
       } else {
       this.detail = this.data;
       this.patientId = this.data.patientId;
       this.patientVisitId = this.data.patientVisitId;
       }
 
       if (this.selectedTab === 'Task') {
         this.isTaskExpanded = true;
         this.taskInchargeId = null;
         this.locationId = null;
       } else if(this.selectedTab === 'Easy Pick') {
         this.taskInchargeId = null;
         this.locationId = null;
         this.commonService.getAppTermsLink('ROU-TSK').subscribe(res => {
           this.activityCategoryList = res.results;
           this.selectedTask = res.results[0];
           if(this.selectedTask.length !== 0) {
             this.getTaskActivity(this.selectedTask);
           }
         });
       } else if(this.selectedTab === 'Task List' && this.data.type !== 'modify') {
         this.search = null;
         this.applyFilterValue = null;
         this.isTaskExpanded = false;
         this.getAllTask();
       } else if(this.selectedTab === 'Task History') { 
         this.historyDate = null;
         this.search = null;
         this.applyFilterValue = null; 
         this.taskSelectedName = null;
        this.selectedReqId = null;
         this.getAllHistoryTask();
       } else if(this.selectedTab === 'Manage Routine') {
         if (this.routineData.id && this.type === 'template') {
         this.activity = true;
         this.isAddRoutine = false;
         this.showDes = true;
         this.routineID = this.routineData.id;
         this.getActivity();
       } else {
         this.locationId = 0;
         if(this.type !== 'template') {
           this.getRoutine();
         } else {
           this.routineID = null;
         }
       }   
     }
     this.buildForm();
     if(this.selectedTab === 'Task List' && this.data.type === 'modify'){
       this.search = null;
       this.applyFilterValue = null;
       this.isEditTask = true;
       this.isTaskExpanded = true;
       this.requestId = this.data.identifyingId;
       this.taskId = this.data.activityName;
       this.taskInchargeId = this.data.assignedToId;
       this.requestType = this.data.srcIdentifyingTypeCode;
         this.createTaskForm.patchValue({
         'taskId': this.data.activityName,
         'taskInchargeType': this.data.assignedToType,
         'taskInchargeId': this.data.assignedTo,
         'gender': this.data.gender,
         'taskDescription': this.data.comments,
         'taskStartTime':  this.dateFormat.transform(this.data.scheduleDate, 'yyyy-MM-ddTHH:mm'),
       });
     } 
    //  this.commonService.getSpecialityLoc(null, 'LC_Specialty Room').subscribe(res => {
    //    this.specialityList = res.results;
    //  });
     this.commonService.getAppTerms('RoutineType,UserType,ActivityType,RecipientType,Status,Gender,ScheduleType,ActivitySubType,ScheduleActivityType,CalenderWeek,RoutineContext').subscribe(res => {
       this.allRoutineList = res.results.filter(resFilter => resFilter.groupName === 'RoutineType');
       this.ipRoutineList = this.allRoutineList.filter(resFilter => resFilter.code === 'ROU-IAP' || resFilter.code === 'ROU-IDC' ||resFilter.code === 'ROU-IDP' )
       this.escalateToList = res.results.filter(resFilter => resFilter.groupName === 'UserType');
      //  this.activityTypeList = res.results.filter(resFilter => resFilter.groupName === 'ActivityType');
       this.originalInchargeTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT'));
       this.taskInchargeTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code == 'RT-US' || resFilter.code == 'RT-RO'));
       this.statusList = res.results.filter(resFilter => resFilter.code === 'ST-AT' || resFilter.code === 'ST-IA');
       this.genderList = res.results.filter(resFilter => resFilter.code === 'Male' || resFilter.code === 'Female');
      //  this.scheduleType = res.results.filter(resFilter => resFilter.groupName === 'ScheduleType');
       this.activitySubType = res.results.filter(resFilter => resFilter.groupName === 'ActivitySubType');
       this.actScheduleTypeList = res.results.filter(resFilter => resFilter.groupName === 'ScheduleActivityType' && resFilter.code !== 'SAT-ODB' && resFilter.code !== 'SAT-ODA');
       this.weekDaysList = res.results.filter(resFilter => resFilter.groupName === 'CalenderWeek');
       this.contextList = res.results.filter(resFilter => resFilter.groupName === 'RoutineContext');
     });
     if(this.data.routineContextId !== null){
      this.getRoutineTypeList(this.data.routineContextId)
     }
     if(this.data.routineTypeId){
      this.commonService.getAppTermsLink(this.data.routineTypeId, 'ActivityCategory').subscribe(res => {
        this.activityTypeList = res.results;
      })
     }
    this.selectedRoutineSchedule(this.data.scheduleTypeId)
   }
   onTabChanged(event) {
       this.selectedTab = event.tab.textLabel;
       this.child = null;
       this.commonService.validateUserPreference('taskDefaultTab', this.selectedTab);
       if (this.selectedTab === 'Task') {
         this.isTaskExpanded = true;
         this.taskInchargeId = null;
         this.locationId = null;
         this.taskInchargeEnabled = false;
       } else if(this.selectedTab === 'Easy Pick') {
         this.taskInchargeId = null;
         this.locationId = null;
         this.taskInchargeEnabled = false;
         this.commonService.getAppTermsLink('ROU-TSK').subscribe(res => {
           this.activityCategoryList = res.results;
           this.selectedTask = res.results[0];
           if(this.selectedTask.length !== 0) {
             this.getTaskActivity(this.selectedTask);
           }
         });
       } else if(this.selectedTab === 'Task List') {
         this.search = null;
         this.applyFilterValue = null;
         this.isTaskExpanded = false;
         this.getAllTask();
       } else if(this.selectedTab === 'Task History') { 
         this.search = null;
         this.applyFilterValue = null;
         this.historyDate = null; 
         this.taskSelectedName = null;
        this.selectedReqId = null;
         this.getAllHistoryTask();
       } else if(this.selectedTab === 'Manage Routine'){
         this.taskSelectedName = null;
        this.selectedReqId = null;
        //  if (this.routineData.id && this.type === 'template') {
        //    this.activity = true;
        //    this.showDes = true;
        //    this.routineID = this.routineData.id;
        //    this.getActivity();
        //  } else {
        //    this.locationId = 0;
        //    this.getRoutine();
        //  }
       }
     }
     onWindowResizedWidth(size) {
       this.popWidth = size - 50 ;
     }
 
     onWindowResized(size) {
       this.popHeight = size ;
       this.contentHeight = size - 140;
     }
 
     scrollToDown(scrollbottom: HTMLDivElement): void {
       this.myScrollContainer.nativeElement.scroll({
         top: this.myScrollContainer.nativeElement.scrollHeight,
         left: 0,
         behavior: 'smooth'
       });
     }
     private requireNameMatch(control: FormControl): ValidationErrors | null{
       
       if (this.addRoutineID == null) {
         if(control.value !== null && control.value !== '' && this.toHit) {
         this.requireNameMatchVal = this.routineNameList.filter(resFilter => resFilter.id === control.value);
         if (this.requireNameMatchVal.length === 0) {
             return { requireMatch: true };
           }
         }
         return null;
       }
     }
 
     private requireActivityMatch(control: FormControl): ValidationErrors | null {
       if (this.activityId == null) {
         if(control.value !== null && control.value !== '') {
         this.requireActivityMatchVal = this.activityList.filter(resFilter => resFilter.id === control.value);
         if (this.requireActivityMatchVal.length === 0) {
             return { requireMatch: true };
           }
         }
         return null;
       }
     }
     private requireInchargeMatch(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.inchargeList || this.inchargeList.length === 0) {
          return { invalidAssign: true };
        }
        
        let selectedAsset = this.inchargeList.find(val => val.id === selectedId || val.name === selectedId);
        if (!selectedAsset) {
          return { invalidAssign: true };
        }
      }
      return null;
    }
     private requireLocationMatch(control: FormControl): ValidationErrors | null {
       if (this.locationId === null) {
         if(control.value !== null && control.value !== '') {
         this.requireLocationMatchVal = this.locationList.filter(resFilter => resFilter.id === control.value);
         if (this.requireLocationMatchVal.length === 0) {
             return { requireMatch: true };
           }
         }
         return null;
       }
     }
     private updateInchargeTypeList(selectedRoles: any[], selectedDepartments: any[]) {
       let filteredList: any[] = [];
       if (selectedRoles?.length) {
         filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
       }
       if (selectedDepartments?.length) {
         filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
       }
       this.inchargeTypeList = [...new Set(filteredList)];
     }
     public buildForm() {
      let is_dummy = false;
      if(this.data.hasOwnProperty('configValue') && this.data.configValue)
      {
        let config = JSON.parse(this.data.configValue);
        is_dummy = config.hasOwnProperty('is_dummy') ? config.is_dummy : is_dummy;
        this.activityCategoryId = 'AC-HAZ';
      }
       if (this.edit !== true) {
         this.routineForm = this.form.group({
           routineId: [this.data.id ? this.data.id : null],
           contextTypeId: [this.data.routineContextId ? this.data.routineContextId : null, [Validators.required]],
           routineTypeId: [this.data.routineTypeId ? this.data.routineTypeId : null, [Validators.required]],
           name: [this.data.name ? this.data.name : null, [Validators.required, this.requireNameMatch.bind(this)]],
          //  specialityId: [this.data.specialityId ? this.data.specialityId : null],
           description: [this.data.description ? this.data.description : null],
           startTime: [this.data.startTime ? this.data.startTime : null],
           scheduleStart: [this.data.scheduleStart ? this.dateFormat.transform(this.data.scheduleStart, 'yyyy-MM-dd') : this.today],
           scheduleEnd: [this.data.scheduleEnd ? this.dateFormat.transform(this.data.scheduleEnd, 'yyyy-MM-dd') : null],
           scheduleTime: [this.data.scheduleStart ? this.dateFormat.transform(this.data.scheduleStart, 'h:mm a') : this.defaultscheduleTime],
           scheduleTypeId: [this.data.scheduleTypeId ? this.data.scheduleTypeId : null, [Validators.required]],
           activityName: [this.data.name]
         });
       }
       let dayTypeIds = [];
        if (this.data?.dayTypes && Array.isArray(this.data.dayTypes)) {
          dayTypeIds = this.data.dayTypes.map(x => x.id);
        } else {
          dayTypeIds = null;
        }
       this.routineActivityForm = this.form.group({
         time: [this.data.schedule ? this.dateFormat.transform(this.data.schedule, 'HH:mm:ss') : null],
         activityIdentifyingType: [this.data.activityIdentifyingType ? this.data.activityIdentifyingType : 'activity', [Validators.required]],
         activityIdentifyingId: [this.data.activityName ? this.data.activityName : null, [Validators.required]],
         inchargeType: [this.data.inchargeType ? this.data.inchargeType : null, [Validators.required]],
         inchargeId: [this.data.inchargeName ? this.data.inchargeName : null, [Validators.required, this.requireInchargeMatch.bind(this)]],
         sequence: [this.data.sequence ? this.data.sequence : null],
         priority: [this.data.priority ? this.data.priority : null],
         hours: [this.hours],
         minutes: [this.minutes],
         locationId: [this.data.locationName ? this.data.locationName : null,[this.requireLocationMatch.bind(this)]],
         isActive: [this.data.hasOwnProperty('isActive') && this.data.isActive !== null ? (this.data.isActive ? 'ST-AT' : 'ST-IA') : 'ST-AT'],
         scheduleTypeId: [null],
         weightage: [this.data.weightage ? this.data.weightage : null, [Validators.min(1), Validators.max(100)]],
         mandatory: [this.data.mandatory ? this.data.mandatory : null],
         isRecurring: [this.data.isRecurring ? this.data.isRecurring : false],
         activityName: [this.data.activityName ? this.data.activityName : null],
         onDate: [dayTypeIds ? dayTypeIds : null],
         dayCount: [this.data.dayCount ? this.data.dayCount : null],
         isRepeat: [this.data.isRepeat ? this.data.isRepeat : null]
       });
 
       this.createTaskForm = this.form.group({
        workItemId : [this.data.workItemId ? this.data.workItemId : null],
        taskId: [null, [Validators.required, this.requireTaskMatch.bind(this)]],
        taskInchargeType: [this.data.inchargeType ? this.data.inchargeType : null, Validators.required],
        taskInchargeId: [this.data.inchargeName ? this.data.inchargeName : null, [Validators.required, this.requireTaskInchargeMatch.bind(this)]],
        isActive: [this.data.hasOwnProperty('isActive') && this.data.isActive !== null  ? (this.data.isActive ? 'ST-AT' : 'ST-IA') : 'ST-AT'],
        gender: [this.data.gender ? this.data.gender : null],
        taskDescription: [this.data.description ? this.data.description : null],
        taskStartTime: [this.data.startTime ? this.data.startTime : this.defaultTaskDate],
        taskLocationId: [this.data.destinationName ? this.data.destinationName : (this.data.destLocationName ? this.data.destLocationName : null)],
        remarks: [this.data.remarks ? this.data.remarks : null],
        isDummy : [is_dummy]
      });

      this.easyPickForm = this.form.group({
        easyTaskInchargeType: [this.data.inchargeType ? this.data.inchargeType : null, Validators.required],
        easyTaskInchargeId: [this.data.inchargeName ? this.data.inchargeName : null, [Validators.required, this.requireTaskInchargeMatch.bind(this)]],
        easyTaskDescription: [this.data.description ? this.data.description : null],
        easyTaskStartTime: [this.data.startTime ? this.data.startTime : this.defaultTaskDate],
        easyTaskLocation: [this.data.destinationName ? this.data.destinationName : (this.data.destLocationName ? this.data.destLocationName : null), [Validators.required]],
        easyTaskRemarks: [this.data.remarks ? this.data.remarks : null]
      });
     }
     getActivityType() {
       this.routineActivityForm.controls['activityIdentifyingId'].setValue(null);
       let selectedRoutineType = this.data.routineTypeId;
       let selectedActivityId = this.routineActivityForm.controls['activityIdentifyingType'].value;
       this.configurationService.getTaskActivities(selectedRoutineType, selectedActivityId).subscribe(res => {
        this.activityList = res.results;
       });
     }
     getScheduleType(event){
      let type = event
      if(type.hasOwnProperty('value')){
        type = event.value
      } else {
        type = event;
      }
      this.commonService.getAppTermsLink(type, 'ScheduleType').subscribe(res =>{
        this.scheduleType = res.results;
      })
     }
     scheduleValidation(event) {
       if (event.target.innerText === 'OK') {
         const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
         const time = date + ' ' + this.routineActivityForm.controls['time'].value;
         const dateTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
         this.time = this.dateFormat.transform(dateTime, 'h:mm a');
         if (this.type === 'template') {
           if (this.activityId === null) {
             this.activitiesTime = this.activitiesDetails.filter(res => this.dateFormat.transform(res.schedule, 'h:mm a') === this.time &&
             this.routineActivityForm.controls['activityIdentifyingId'].value === res.activityIdentifyingId);
           } else {
             this.activitiesTime = this.activitiesDetails.filter(res => this.dateFormat.transform(res.schedule, 'h:mm a') === this.time &&
             this.activityId === res.activityIdentifyingId && this.selectedName !== res.routineActivityId);
           }
         } else {
           if (this.activityId === null) {
             this.activitiesTime = this.activitiesDetails.filter(res => this.dateFormat.transform(res.schedule, 'h:mm a') === this.time &&
             this.routineActivityForm.controls['activityIdentifyingId'].value === res.activityIdentifyingId);
           } else {
             this.activitiesTime = this.activitiesDetails.filter(res => this.dateFormat.transform(res.schedule, 'h:mm a') === this.time &&
             this.activityId === res.activityIdentifyingId && this.selectedName !== res.entityRoutineActivityId);
           }
         }
         if (this.activitiesTime.length !== 0) {
           this.timeExist = true;
           this.routineActivityForm.controls['time'].setValue(null);
           this.defaultTime = null;
         } else {
           this.timeExist = false;
         }
       }
     }
     getRoutineTypeList(event){
      this.commonService.getAppTermsLink(event, 'RoutineType').subscribe(res =>{
        this.routineList = res.results;
      })
    }
     getActivityDetails(event) {
       this.inchargeId = 0;
       this.routineActivityForm.controls['time'].setValue(null);
       this.defaultTime = null;
       this.hours = null;
       this.minutes = null;
        this.routineActivityForm.patchValue({
          inchargeType: null,
          sequence: null,
          priority: null,
          hours: null,
          minutes: null,
          isRecurring: false
        });
        this.inchargeEnabled = false;
        this.locationId = null;
       this.configurationService.getActivitiesById(event.value).subscribe(res => {
         const data = res.results[0];
         this.roleIds = data.roleIds;
         this.departmentIds = data.departmentIds;
         this.updateInchargeTypeList(this.roleIds, this.departmentIds);
         this.inchargeId = data.inchargeId;
         this.hours = Math.floor(data.minDuration / 60).toString().padStart(2, '0');
         this.minutes = (data.minDuration % 60).toString().padStart(2, '0');
         this.routineActivityForm.patchValue({
           'inchargeType': data.inchargeType,
           'sequence': data.sequence ,
           'priority': data.priority,
           'hours': this.hours,
           'minutes': this.minutes,
           'isRecurring' : data.isRecurring
         });
         let type = data.inchargeType;
        if (type === 'RT-RO') {
          this.configurationService.getRecipientName('', type).subscribe(res => {
            if(this.inchargeId !== null){
              this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
            } else {
              this.inchargeList = res.results.filter(role => this.roleIds.includes(role.id));
            }
            this.inchargeEnabled = true;
            if (this.inchargeList.length && this.inchargeId) {
              let name = this.inchargeList[0].name
              this.routineActivityForm.get('inchargeId').setValue(name)
            }
            this.routineActivityForm.get('inchargeId').updateValueAndValidity();
          });
        } else if (type == 'RT-US') {
          let roles = this.roleIds.join(',');
          let departments = this.departmentIds && this.departmentIds.join(',');
          this.configurationService.getRoleUser(null, roles, departments, this.inchargeId).subscribe(res => {
            this.inchargeList = res.results
            this.inchargeEnabled = true;
            if (this.inchargeList.length) {
              let name = this.inchargeList[0].name;
              this.routineActivityForm.get('inchargeId').setValue(name);
            }
            this.routineActivityForm.get('inchargeId')?.updateValueAndValidity();
          });
        } else if (type == 'RT-DT') {
          this.commonService.getAllDepartments().subscribe(res => {
            this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
            this.inchargeEnabled = true;
            if (this.inchargeList.length) {
              let name = this.inchargeList[0].name;
              this.routineActivityForm.get('inchargeId').setValue(name);
            }
          });
        }
        if (data.destinationId !== null) {
          this.locationId = data.destinationId;
          this.commonService.getLocationById(data.destinationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.routineActivityForm.get('locationId').setValue(locationName)
            }
            this.routineActivityForm.get('locationId').updateValueAndValidity();
          });
        }
       });
     }
    //  searchActivitylist(event) {
    //    this.activityId = null;
    //    const type = this.routineActivityForm.controls['activityIdentifyingType'].value;
    //    if(event.type === 'activitySearch' && event.text.length >= 2) {
    //      if (event.toHit == true) {
    //        this.configurationService.searchActivities(event.text, type, null).subscribe(res => {
    //          this.activitylistItems = res.results;
    //          this.activityList = this.activitylistItems;
    //          this.activityEnabled = true;
    //        });
    //      } else {
    //        this.activityList = this.activitylistItems;
    //        this.activityEnabled = true;
    //      }
    //    } else {
    //      this.activityList = [];
    //        this.activityEnabled = false;
    //    }
    //  }
    //  getActivityList(id) {
    //    if (id !== null) {
    //      const activity = this as any as { id: string, name: string }[]
    //      const activityId = activity.find(obj => obj.id === id).name;
    //      return activityId;
    //    } else {
    //      return '';
    //    }
    //  }
     checkTaskActivity(subType) {
      this.taskListItems = [];
      this.taskList = [];
      this.createTaskForm.controls.taskId.setValue(null);
      this.createTaskForm.controls.taskId.updateValueAndValidity();
     }
     getIncharge(type) {
      this.routineActivityForm.controls['inchargeId'].setValue(null);
       if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          let selectedRoles = this.roleIds
          if (selectedRoles !== null) {
            this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
            this.inchargeEnabled = true;
            this.roleList = this.inchargeList;
          } else {
            this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
            this.inchargeEnabled = true;
            this.roleList = this.inchargeList;
          }
        });
      } else if (type === 'RT-DT') {
        this.commonService.getAllDepartments().subscribe(res => {
          let selectedDepartments = this.departmentIds
          if (selectedDepartments !== null) {
            this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
            this.inchargeEnabled = true;
            this.departmentList = this.inchargeList;
          } else {
            this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
            this.inchargeEnabled = true;
            this.departmentList = this.inchargeList;
          }
        });
      } else if (type === 'RT-US') {
        let departmentsString = this.departmentIds;
        let roles = this.roleIds;
        let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
        this.configurationService.getRoleUser(null, roles, departments).subscribe(res => {
          this.listItems = res.results;
          this.inchargeList = this.listItems;
          this.inchargeEnabled = true;
        });
      } else {
        this.inchargeList = [];
        this.inchargeEnabled = false;
      }
     }
     searchUserNamelist(event) {
       this.inchargeId = null;
       const type = this.routineActivityForm.controls['inchargeType'].value;
       if (event.type === 'inchargeSearch' && event.text.length >= 2) {
        if (event.toHit === true && type === 'RT-US') {
          let departmentsString = this.departmentIds;
          let roles = this.roleIds.join(',');
          let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
          this.configurationService.getRoleUser(event.text, roles, departments).subscribe(res => {
            this.inchargeList = res.results;
            this.inchargeEnabled = true;
          });
        } else {
          this.inchargeList = this.listItems;
          this.inchargeEnabled = true;
        }
      } else {
         if (type === 'RT-RO') {
           this.configurationService.getRecipientName('', type).subscribe(res => {
             let selectedRoles = this.roleIds
             if (selectedRoles !== null) {
               this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
               this.inchargeEnabled = true;
             } else {
               this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
               this.inchargeEnabled = true;
             }
           });
         } else if (type === 'RT-DT') {
           this.commonService.getAllDepartments().subscribe(res => {
            let selectedDepartments = this.departmentIds
            if (selectedDepartments !== null) {
              this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
              this.inchargeEnabled = true;
              this.departmentList = this.inchargeList;
            } else {
              this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
              this.inchargeEnabled = true;
              this.departmentList = this.inchargeList;
            }
          });
         } else {
           this.inchargeList = [];
           this.inchargeEnabled = false;
         }
      }
     }
     getInchargeList(id) {
       if (id !== null) {
         const incharge = this as any as { id: string, name: string }[]
         const inchargeId = incharge.find(obj => obj.id === id).name;
         return inchargeId;
       } else {
         return '';
       }
     }

     selectedActivitySchedule(code: string) {
        this.activityScheduleId = code;
        const validatorsMap = {
          'SAT-BTM': { time: Validators.required, dayCount: null, onDate: null },
          'SAT-DBT': { time: Validators.required, dayCount: null, onDate: Validators.required },
          'SAT-RGAT': { time: null, dayCount: Validators.required, onDate: null },
          'SAT-RGBT': { time: Validators.required, dayCount: Validators.required, onDate: null },
          'SAT-DAT': { time: null, dayCount: null, onDate: Validators.required },
        };
        const selectedValidators = validatorsMap[code] || { time: null, dayCount: null, onDate: null };
        Object.keys(selectedValidators).forEach((key) => {
          this.routineActivityForm.get(key).setValidators(selectedValidators[key]);
          this.routineActivityForm.get(key).updateValueAndValidity();
        });
        this.routineActivityForm.updateValueAndValidity();
     }

     selectedRoutineSchedule(event) {
      this.selectedSchedule = event;
      this.routineType = this.routineForm.controls['routineTypeId'].value;
      const formControls = this.routineActivityForm.controls;
      if (this.selectedSchedule === 'SCT-ALW' && this.routineType === 'ROU-EMG') {
        formControls['sequence'].setValidators(null);
        formControls['priority'].setValidators(null);
        formControls['hours'].setValidators([Validators.pattern(/^([01]\d|2[0-3])$/)]);
        formControls['minutes'].setValidators([Validators.pattern(/^[0-5]\d$/)]);
        formControls['scheduleTypeId'].setValidators(null);
      } else if (this.selectedSchedule === 'SCT-ALW') {
        formControls['sequence'].setValidators([Validators.required]);
        formControls['priority'].setValidators([Validators.required]);
        formControls['hours'].setValidators([Validators.required, Validators.pattern(/^([01]\d|2[0-3])$/)]);
        formControls['minutes'].setValidators([Validators.required, Validators.pattern(/^[0-5]\d$/)]);
        formControls['scheduleTypeId'].setValidators(null);
      } else {
        formControls['scheduleTypeId'].setValidators([Validators.required]);
        formControls['sequence'].setValidators(null);
        formControls['priority'].setValidators(null);
        formControls['hours'].setValidators([Validators.pattern(/^([01]\d|2[0-3])$/)]);
        formControls['minutes'].setValidators([Validators.pattern(/^[0-5]\d$/)]);
      }
      Object.keys(formControls).forEach(key => {
        formControls[key].updateValueAndValidity();
      });
    }
 
     searchLocationList(event) {
       this.locationId = null;
       if(event.type === 'locationSearch' && event.text.length >= 2) {
         if (event.toHit == true) {
           this.configurationService.getLocationData(event.text).subscribe(res => {
             this.locationListItems = res.results;
             this.locationList = this.locationListItems;
             this.locationEnabled = true;
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
     getLocationList(id) {
       if (id !== null) {
         const location = this as any as { id: string, fullName: string }[]
         const locationId = location.find(obj => obj.id === id).fullName;
         return locationId;
       } else {
         return '';
       }
     }
     checkRoutine(event) {
       this.addRoutineID = null;
       this.toHit = event.toHit;
       if (this.type === 'inpatient') {
         this.routineType = this.routineForm.controls['routineTypeId'].value;
       } else if (this.type === 'resident') {
         this.routineType = 'ROU-RES';
       } else {
         this.routineType = 'ROU-STF';
       }
       if(event.type === 'routineTemplate' && event.text.length >= 2) {
         if(this.toHit == true){
         this.configurationService.getRoutineName(event.text, this.routineType).subscribe(res => {
           this.routineNameListRes = res.results;
           this.routineNameList = this.routineNameListRes;
         });
         } else {
           this.routineNameList = this.routineNameListRes;
         }
       } else {
         this.routineNameList = [];
       }
     }
     hasChildren = (_: number, node: any) => {
       return node.activities && node.activities.length > 0
     }
     private makeGetChildrenFunction() {
       return node => observableOf(node.activities)
     }
     getTreeview(data, id?: number) {
       for (let i = 0; i < this.ACTreedataSource.data.length; i++) {
         if (this.ACTreedataSource.data[i].routineId === data[i].routineId) {
           this.ACTreedataSource.data.forEach((node) => {
             if (node.entityRoutineId) {
               if(node.entityRoutineId == id !== null && id !== undefined ? id : data[0].entityRoutineId) {
                 this.selectedRow = node;
                 this.treeControl.expand(node);
               }
             } else {
               if(node.routineId == data[0].routineId) {
                 this.selectedRow = node;
                 this.treeControl.expand(node);
               }
             }
           });
         }
       }
     }
     getRoutineId(id) {
       this.addRoutineID = id;
       this.configurationService.getRoutineActivities(id).subscribe(res => {
         if (res.statusCode === 1) {
           this.isActivityList = true;
           this.routineActivities = res.results[0].activities;
           this.ACdataSource = new MatTableDataSource<any>(res.results[0].activities);
           this.ACdataSource.sort = this.sort;
           this.activitiesDetails = res.results[0].activities;
           this.routineForm.get('scheduleTypeId').setValue(res.results[0].scheduleTypeId);
           if (res.results[0].activities.length > 0) {
             this.activityData = false;
           } else {
             this.activityData = true;
            //  this.routineActivityForm.get('scheduleTypeId').setValue(this.data.scheduleTypeId);
           }
           this.commonService.getAppTermsLink(res.results[0].routineTypeId, 'ScheduleType').subscribe(res =>{
            this.scheduleType = res.results;
           })
         }
       });
     }
     assignRoutine(data) {
       this.addRoutine = new AddRoutine(null, null, null, null, null, null, null, null, null, null, null);
       if (this.addRoutineID !== null) {
         this.addRoutine.identifiyingId = this.entityId;
         this.addRoutine.identifyingType = this.entityType;
         if (this.type === 'inpatient' || this.type === 'resident') {
           this.addRoutine.patientVisitId = this.patientVisitId;
         }
         const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
         const scheduleDate = this.dateFormat.transform(this.routineForm.controls['scheduleStart'].value, 'yyyy-MM-dd');
         const time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
         this.scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
         this.addRoutine.fromDate = date;
         this.addRoutine.routineId = this.addRoutineID;
         this.addRoutine.routineStatusId = data.routineStatus ? data.routineStatus : 'RQ-CR';
         this.addRoutine.routineType = this.routineType;
         this.addRoutine.tagId = data.tagId;
         this.addRoutine.scheduleStart = this.scheduleTime;
         this.addRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['scheduleEnd'].value, 'yyyy-MM-dd 23:59:00');
         this.addRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
         // console.log(data)
         // console.log(this.addRoutine)
         // return
         this.configurationService.addRoutine(this.addRoutine).subscribe(res => {
           if (res.statusCode === 1) {
             this.activity = true;
             this.isActivityList = true;
             this.isAddRoutine = false;
             this.routineID = res.results.id	;
             this.routineExist = true;
             this.entityRoutineEventId = res.results.entityRoutineEventId;
             this.locationId = 0;
             this.getRoutine();
             this.toastr.success('Success', `${res.message}`);
             this.isDisabled = true;
           }
         },
           error => {
             this.toastr.error('Error', `${error.error.message}`);
           });
       }
     }
     getRoutine(id?: number) {
       this.configurationService.getMultipleRoutine(this.entityType, this.entityId, this.patientVisitId).subscribe(res => {
         if (res.statusCode === 1 && res.results.length !== 0) {
           // else if ((this.routineData.routineEventStatus && this.routineData.routineEventStatus !== 'QS-CLS'  && this.routineData.entityRoutineId !== null)
           // || (this.routineData.routineStatus === 'QS-PE' && this.routineData.entityRoutineId !== null)) {
           //   this.activity = true;
           //   this.isAddRoutine = false;
           //   this.routineEdit = true;
           //   this.showDes = true;
           //   this.entityRoutineEventId = this.routineData.entityRoutineEventId;
           //   this.routineID = this.routineData.entityRoutineId;
           //   this.locationId = 0;
           //   this.getRoutine();
           // } 
           this.treeControl = new NestedTreeControl<any>(this.makeGetChildrenFunction());
           this.ACTreedataSource = new MatTreeNestedDataSource();
           this.treeData = [];
           this.treeData.push(res.results);
           this.cancelEditActivity();
           this.ACTreedataSource.data = res.results;
           this.activity = true;
           this.isActivityList = true;
           if (id !== null && id !== undefined) {
            this.getParentRoutine(id);
           } else {
            this.data = res.results[0];
            this.trasactionRoutineId = res.results[0].routineId;
            this.entityRoutineId = res.results[0].entityRoutineId;
            this.entityRoutineEventId = res.results[0].entityRoutineEventId;
            this.routineID = res.results[0].entityRoutineId;
            this.routineEventStatus = res.results[0].routineEventStatusId;
            this.routineStatusId = res.results[0].routineStatusId;
            this.buildForm();
            this.edit = false;
            this.routineEdit = true;
            this.showDes = false;
            this.selectedRow = this.selectedRow ? this.selectedRow : res.results.length ? res.results[0] : null;
            this.parent = res.results[0].entityRoutineId ? res.results[0].entityRoutineId : res.results[0].routineId;
            this.getTreeview(res.results);
            this.ACdataSource = new MatTableDataSource<any>(res.results[0].activities);
            this.ACdataSource.sort = this.sort;
            this.activitiesDetails = res.results[0].activities;
            if (res.results[0].activities.length > 0) {
              this.activityData = false;
            } else {
              this.activityData = true;
              // this.routineActivityForm.get('scheduleTypeId').setValue(this.data.scheduleTypeId);
            }
          }
         } else {
           this.activity = false;
           this.isAddRoutine = true;
           this.routineEdit = false;
           this.showDes = true;
           this.routineID = null;
           this.cancelEditActivity();
           this.addMultiRoutine();
         }
         // if (this.routineForm.controls['routineTypeId'].value === 'ROU-IP') {
         //   this.routineActivityForm.get('inchargeType').setValidators(Validators.required);
         //   this.routineActivityForm.get('inchargeType').updateValueAndValidity();
         //   this.routineActivityForm.get('inchargeId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
         //   this.routineActivityForm.get('inchargeId').updateValueAndValidity();
         // } else {
         //   this.routineActivityForm.get('inchargeType').setValidators(null);
         //   this.routineActivityForm.get('inchargeType').updateValueAndValidity();
         //   this.routineActivityForm.get('inchargeId').setValidators([null, this.requireInchargeMatch.bind(this)]);
         //   this.routineActivityForm.get('inchargeId').updateValueAndValidity();
         // }
         // if (this.routineForm.controls['routineTypeId'].value === 'ROU-STF') {
         //   this.routineActivityForm.get('locationId').setValidators([Validators.required, this.requireLocationMatch.bind(this)]);
         //   this.routineActivityForm.get('locationId').updateValueAndValidity();
         // } else {
         //   this.routineActivityForm.get('locationId').setValidators([this.requireLocationMatch.bind(this)]);
         //   this.routineActivityForm.get('locationId').updateValueAndValidity();
         // }
       });
     }
     expandTree(node) {
       if(this.treeControl.isExpanded(node)) {
         this.treeControl.collapse(node)
       } else {
         this.treeControl.expand(node)
       }
     }
     getParentRoutine(id, type?: string) {
      if (id !== null && id !== undefined) {
        for (let i = 0; i < this.treeData[0].length; i++) {
          const routine =  this.treeData[0].filter(res => res.entityRoutineId === id);
          const activity = this.treeData[0][i].activities.filter(res => res.entityRoutineActivityId === id);
          if(routine.length !== 0 || activity.length !== 0) {
            this.data = routine[0] ? routine[0] : this.treeData[0][i];
            this.trasactionRoutineId = routine[0] ? routine[0].routineId : this.treeData[0][i].routineId;
            this.entityRoutineId = routine[0] ? routine[0].entityRoutineId : this.treeData[0][i].entityRoutineId;
            this.entityRoutineEventId = routine[0] ? routine[0].entityRoutineEventId : this.treeData[0][i].entityRoutineEventId;
            this.routineID = routine[0] ? routine[0].entityRoutineId : this.treeData[0][i].entityRoutineId;
            this.routineEventStatus = routine[0] ? routine[0].routineEventStatusId : this.treeData[0][i].routineEventStatusId;
            this.routineStatusId = routine[0] ? routine[0].routineStatusId : this.treeData[0][i].routineStatusId;
            this.buildForm();
            this.edit = false;
            this.routineEdit = true;
            this.showDes = false;
            this.treeControl = new NestedTreeControl<any>(this.makeGetChildrenFunction());
            this.ACTreedataSource = new MatTreeNestedDataSource();
            this.ACTreedataSource.data = this.treeData[0];
            if(routine.length !== 0 || type === 'Routine') {
              this.routineExist = true;
              this.isActivityList = true;
              this.activityExist = false;
              this.parent = routine[0] ? routine[0].entityRoutineId : this.treeData[0][i].entityRoutineId;
            } else if(activity.length !== 0 && type !== 'Routine'){
              this.routineExist = false;
              this.isActivityList = false;
              this.activityExist = true;
              this.child = activity[0].entityRoutineActivityId;
              this.editActivity(activity[0], false);
            } else {
              this.activityExist = false;
            }
            this.selectedRow = this.selectedRow ? this.selectedRow : this.treeData[0].length ? routine[0] ? routine[0] : this.treeData[0][i] : null;
            const parent = routine[0] ? routine[0].entityRoutineId : this.treeData[0][i].entityRoutineId;
            this.getTreeview(this.treeData[0], parent);
            this.ACdataSource = new MatTableDataSource<any>(routine[0] ? routine[0].activities : this.treeData[0][i].activities);
            this.ACdataSource.sort = this.sort;
            this.activitiesDetails = routine[0] ? routine[0].activities : this.treeData[0][i].activities;
            if (routine[0] ? routine[0].activities.length > 0 : this.treeData[0][i].activities.length > 0) {
              this.activityData = false;
            } else {
              this.activityData = true;
              // this.routineActivityForm.get('scheduleTypeId').setValue(this.data.scheduleTypeId);
            }
          }
         }
       }
     }
     getRoutineActivityList(id) {
       this.isActivityList = true;
       this.isAddRoutine = false;
       // this.configurationService.getMultipleRoutine(this.patientId, this.patientVisitId).subscribe(res => {
       //   if (res.statusCode === 1) {
           const data = this.treeData[0].filter(res => res.routineId === id || res.entityRoutineId === id);
           this.ACdataSource = new MatTableDataSource<any>(data[0].activities);
           this.ACdataSource.sort = this.sort;
           this.trasactionRoutineId = data[0].routineId;
           this.entityRoutineId = data[0].entityRoutineId;
           this.entityRoutineEventId = data[0].entityRoutineEventId;
           this.routineID = data[0].entityRoutineId;
           this.routineEventStatus = data[0].routineEventStatusId;
           this.routineStatusId = data[0].routineStatusId;
           this.parent = data[0].entityRoutineId ? data[0].entityRoutineId : data[0].routineId;
           this.data = data[0];
           this.edit = false;
           this.buildForm();
           this.activitiesDetails = data[0].activities;
           if (data[0].activities.length > 0) {
             this.activityData = false;
           } else {
             this.activityData = true;
            //  this.routineActivityForm.get('scheduleTypeId').setValue(this.data.scheduleTypeId);
           }
       //   }
       // });
     }
     saveRoutine() {
       this.createRoutine = new CreateRoutine(null, null, null, null, null, null);
       this.createRoutine.routineTypeId = this.routineForm.controls['routineTypeId'].value;
       this.createRoutine.name = this.routineForm.controls['name'].value;
       this.createRoutine.routineContextId = this.routineForm.controls['contextTypeId'].value;
      //  this.createRoutine.specialityId = this.routineForm.controls['specialityId'].value;
       this.createRoutine.description = this.routineForm.controls['description'].value;
       this.createRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
       this.configurationService.saveRoutine(this.createRoutine).subscribe(res => {
         if (res.statusCode === 1) {
           this.routineID = res.results.id;
           this.data = res.results;
           this.edit = false;
           this.routineEdit = true;
           this.showDes = false;
           this.isAddRoutine = false;
           this.buildForm();
           this.toastr.success('Success', `${res.message}`);
           this.isDisabled = true;
         }
       },
         error => {
           this.toastr.error('Error', `${error.error.message}`);
         });
     }
     updateRoutine(data) {
       this.editRoutine = new EditRoutine(null,null, null, null, null, null);
       this.editRoutine.routineTypeId = this.routineForm.controls['routineTypeId'].value;
       this.editRoutine.name = this.routineForm.controls['name'].value;
       this.editRoutine.routineContextId = this.routineForm.controls['contextTypeId'].value;
      //  this.editRoutine.specialityId = this.routineForm.controls['specialityId'].value;
       this.editRoutine.description = this.routineForm.controls['description'].value;
       this.editRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
       this.configurationService.updateRoutine(this.routineID, this.editRoutine).subscribe(res => {
         if (res.statusCode === 1) {
           this.toastr.success('Success', `${res.message}`);
           this.isDisabled = true;
           this.thisDialogRef.close('confirm');
         }
       },
         error => {
           this.toastr.error('Error', `${error.error.message}`);
         });
     }
     getActivity(id?: string) {
       this.activity = true;
       this.routineEdit = false;
       this.routineExist = true;
       this.activityExist = false;
       this.isActivityList = true;
       this.configurationService.getRoutineActivities(this.routineID).subscribe(res => {
         if (res.statusCode === 1) {
           this.data = res.results[0];
           this.commonService.getAppTermsLink(this.data.routineTypeId, 'ActivityCategory').subscribe(res => {
            this.activityTypeList = res.results;
           })
           this.routineActivities = res.results[0].activities;
           this.ACdataSource = new MatTableDataSource<any>(res.results[0].activities);
           this.ACdataSource.sort = this.sort;
           this.treeControl = new NestedTreeControl<any>(this.makeGetChildrenFunction());
           this.ACTreedataSource = new MatTreeNestedDataSource();
           this.ACTreedataSource.data = res.results;
           this.selectedRow = this.selectedRow ? this.selectedRow : res.results.length ? res.results[0] : null;
           if(id !== null && id !== undefined) {
            this.parent = null;
            this.routineExist = false;
            this.isActivityList = false;
            this.activityExist = true;
            this.child = id;
            const activity = this.routineActivities.filter(res => res.activityIdentifyingId === id);
            // this.editActivity(activity[0], false);
          } else {
            this.routineExist = true;
            this.isActivityList = true;
            this.activityExist = false;
            this.parent = res.results[0].entityRoutineId ? res.results[0].entityRoutineId : res.results[0].routineId;
          }
           this.getTreeview(res.results);
           this.activitiesDetails = res.results[0].activities;
           if (res.results[0].activities.length > 0) {
             this.activityData = false;
           } else {
             this.activityData = true;
            //  this.routineActivityForm.get('scheduleTypeId').setValue(this.data.scheduleTypeId);
           }
         }
         // if (this.routineForm.controls['routineTypeId'].value === 'ROU-IP') {
         //   this.routineActivityForm.get('inchargeType').setValidators(Validators.required);
         //   this.routineActivityForm.get('inchargeType').updateValueAndValidity();
         //   this.routineActivityForm.get('inchargeId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
         //   this.routineActivityForm.get('inchargeId').updateValueAndValidity();
         // }
         // if (this.routineForm.controls['routineTypeId'].value === 'ROU-STF') {
         //   this.routineActivityForm.get('locationId').setValidators([Validators.required, this.requireLocationMatch.bind(this)]);
         //   this.routineActivityForm.get('locationId').updateValueAndValidity();
         // }
       });
     }
     addActivity(type) {
      this.routineActivityForm.get('activityIdentifyingType').setValue('activity')
       if (this.routineActivityForm.controls['time'].value !== null) {
         const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
         const time = date + ' ' + this.routineActivityForm.controls['time'].value;
         this.schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
       }
       let scheduleType = this.routineActivityForm.controls['scheduleTypeId'].value
       if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
         this.schedule = this.schedule
       } else {
         this.schedule = null;
       }
       if (this.routineActivityForm.controls['isActive'].value === 'ST-AT') {
         this.status = true;
       } else {
         this.status = false;
       }
       if  (this.activityId === null) {
         this.activityId = this.routineActivityForm.controls['activityIdentifyingId'].value; 
       }
       if (this.routineActivityForm.controls['mandatory'].value === true) {
         this.mandatory = true;
       } else {
         this.mandatory = false;
       }
       const hrs = Number(this.routineActivityForm.controls['hours'].value);
       const mins = Number(this.routineActivityForm.controls['minutes'].value);
       this.totalMinutes  =  hrs * 60 + mins;
       if (type !== 'template') {
         this.createRoleRoutineActivity = new CreateRoleRoutineActivity(null, null);
         this.activities = [
           {
             "schedule": this.schedule,
             "activityIdentifyingType": this.routineActivityForm.controls['activityIdentifyingType'].value,
             "activityIdentifyingId": this.routineActivityForm.controls['activityIdentifyingId'].value,
             "inchargeType": this.routineActivityForm.controls['inchargeType'].value,
             "inchargeId": typeof this.routineActivityForm.controls['inchargeId'].value === 'string' ? this.inchargeId : this.routineActivityForm.controls['inchargeId'].value,
             "sequence": this.routineActivityForm.controls['sequence'].value,
             "priority": this.routineActivityForm.controls['priority'].value,
             "minDuration": this.totalMinutes,
             "locationId": typeof this.routineActivityForm.controls['locationId'].value === 'string' ? this.locationId : this.routineActivityForm.controls['locationId'].value,
             "isActive": this.status,
             "scheduleTypeId": this.routineActivityForm.controls['scheduleTypeId'].value,
             "weightage": this.routineActivityForm.controls['weightage'].value,
             "mandatory": this.mandatory,
             "isRecurring": this.routineActivityForm.controls['isRecurring'].value,
             "dayTypeIds": this.routineActivityForm.controls['onDate'].value,
             "dayCount": this.routineActivityForm.controls['dayCount'].value,
             "isRepeat": this.routineActivityForm.controls['isRepeat'].value,
           }
         ];
         this.createRoleRoutineActivity.activities = this.activities;
         this.createRoleRoutineActivity.entityRoutineId = this.routineID;
         // console.log(this.createRoleRoutineActivity)
         // return
           this.configurationService.saveRoleRoutineActivities(this.createRoleRoutineActivity).subscribe(res => {
             if (res.statusCode === 1) {
               this.toastr.success('Success', `${res.message}`);
               this.parent = null;
               this.getRoutine(this.routineID);
               this.activityList = [];
               this.inchargeList = [];
               this.locationList = [];
               this.inchargeTypeList = [];
               this.activityId = null;
               this.defaultTime = '00:00';
               this.routineActivityForm.reset();
               this.activityExist = false;
               this.routineExist = true;
               this.routineActivityForm.controls.isActive.setValue('ST-AT');
             }
           },
             error => {
               this.toastr.error('Error', `${error.error.message}`);
             });
       } else {
         this.createRoutineActivity = new CreateRoutineActivity(null, null);
         this.activities = [
           {
             "schedule": this.schedule,
             "activityIdentifyingType": this.routineActivityForm.controls['activityIdentifyingType'].value,
             "activityIdentifyingId": this.activityId,
             "inchargeType": this.routineActivityForm.controls['inchargeType'].value,
             "inchargeId": typeof this.routineActivityForm.controls['inchargeId'].value === 'string' ? this.inchargeId : this.routineActivityForm.controls['inchargeId'].value,
             "sequence": this.routineActivityForm.controls['sequence'].value,
             "priority": this.routineActivityForm.controls['priority'].value,
             "minDuration": this.totalMinutes,
             "locationId": typeof this.routineActivityForm.controls['locationId'].value === 'string' ? this.locationId : this.routineActivityForm.controls['locationId'].value,
             "isActive": this.status,
             "scheduleTypeId": this.routineActivityForm.controls['scheduleTypeId'].value,
             "weightage": this.routineActivityForm.controls['weightage'].value,
             "mandatory": this.mandatory,
             "isRecurring": this.routineActivityForm.controls['isRecurring'].value,
             "dayTypeIds": this.routineActivityForm.controls['onDate'].value,
             "dayCount": this.routineActivityForm.controls['dayCount'].value,
             "isRepeat": this.routineActivityForm.controls['isRepeat'].value,      
           }
         ];
         this.createRoutineActivity.activities = this.activities;
         this.createRoutineActivity.routineId = this.routineForm.controls['routineId'].value;
         this.configurationService.saveRoutineActivities(this.createRoutineActivity).subscribe(res => {
           if (res.statusCode === 1) {
             this.toastr.success('Success', `${res.message}`);
             this.routineID = res.results.routineId;
             this.getActivity();
             this.activityId = null;
             this.activityList = [];
             this.inchargeList = [];
             this.locationList = [];
             this.inchargeTypeList = [];
             this.defaultTime = '00:00';
             this.routineActivityForm.reset();
             this.routineActivityForm.controls.isActive.setValue('ST-AT');
           }
         },
           error => {
             this.toastr.error('Error', `${error.error.message}`);
           });
       }
     }
     editActivity(data,scrollbottom) {
       this.inchargeEnabled = false;
       this.inchargeId = null;
       this.routineActivityForm.get('inchargeId').setValue(null)
       this.isExpanded = true
       this.scrollToDown(scrollbottom);
       this.activityList = [];
       this.inchargeList = [];
       this.locationList = [];
       this.inchargeTypeList = [];
       if (this.type === 'template') {
         this.selectedName = data.routineActivityId;
       } else {
         this.selectedName = data.entityRoutineActivityId;
       }
       this.activityId = data.activityIdentifyingId;
       this.locationId = data.locationId;
       this.inchargeId = data.inchargeId;
       this.editActivities = true;
       this.data = data;
       this.hours = Math.floor(data.minDuration / 60).toString().padStart(2, '0');
       this.minutes = (data.minDuration % 60).toString().padStart(2, '0');
       const schedule = this.dateFormat.transform(data.schedule, 'h:mm a');
       this.defaultTime = schedule;
       this.edit = true;
       this.configurationService.getActivitiesById(this.activityId).subscribe(res => {
        const actData = res.results[0];
        this.roleIds = actData.roleIds;
        this.departmentIds = actData.departmentIds;
        this.updateInchargeTypeList(this.roleIds, this.departmentIds)
        this.buildForm();
        this.routineActivityForm.get('scheduleTypeId').setValue(data.scheduleTypeId);
        this.selectedActivitySchedule(data.scheduleTypeId);
        let type = data.inchargeType;
        if (type === 'RT-RO') {
          this.configurationService.getRecipientName('', type).subscribe(res => {
            this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
            this.inchargeEnabled = true;
            if (this.inchargeList.length) {
              let name = this.inchargeList[0].name
              this.routineActivityForm.get('inchargeId').setValue(name)
            }
            this.routineActivityForm.get('inchargeId').updateValueAndValidity();
          });
        } else if (type == 'RT-US') {
          let roles = this.roleIds.join(',');
          let departments = this.departmentIds && this.departmentIds.join(',');
          this.configurationService.getRoleUser(null, roles, departments, this.inchargeId).subscribe(res => {
            this.inchargeList = res.results
            this.inchargeEnabled = true;
            if (this.inchargeList.length) {
              let name = this.inchargeList[0].name;
              this.routineActivityForm.get('inchargeId').setValue(name);
            }
            this.routineActivityForm.get('inchargeId')?.updateValueAndValidity();
          });
        } else if (type == 'RT-DT') {
          this.commonService.getAllDepartments().subscribe(res => {
            this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
            this.inchargeEnabled = true;
            if (this.inchargeList.length) {
              let name = this.inchargeList[0].name;
              this.routineActivityForm.get('inchargeId').setValue(name);
            }
          });
        }
       });
       // if (this.routineForm.controls['routineTypeId'].value === 'ROU-IP') {
       //   this.routineActivityForm.get('inchargeType').setValidators(Validators.required);
       //   this.routineActivityForm.get('inchargeType').updateValueAndValidity();
        //  this.routineActivityForm.get('inchargeId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
       //   this.routineActivityForm.get('inchargeId').updateValueAndValidity();
       // }
       // if (this.routineForm.controls['routineTypeId'].value === 'ROU-STF') {
       //   this.routineActivityForm.get('locationId').setValidators([Validators.required, this.requireLocationMatch.bind(this)]);
       //   this.routineActivityForm.get('locationId').updateValueAndValidity();
       // }
     }
     updateRoutineActivity(type, data) {
       if (this.routineActivityForm.controls['time'].value !== null) {
         if (this.routineActivityForm.controls['time'].value.length < 19) {
           const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
           const time = date + ' ' + this.routineActivityForm.controls['time'].value;
           this.schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
         } else {
           const time = this.routineActivityForm.controls['time'].value;
           this.schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
         }
       }
       let scheduleType = this.routineActivityForm.controls['scheduleTypeId'].value
       if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
        this.schedule = this.schedule
      } else {
        this.schedule = null;
      }
     if (this.routineActivityForm.controls['isActive'].value === 'ST-AT') {
       this.status = true;
     } else {
       this.status = false;
     }
     if  (this.activityId === null) {
       this.activityId = this.routineActivityForm.controls['activityIdentifyingId'].value; 
     }
     if (this.routineActivityForm.controls['mandatory'].value === true) {
       this.mandatory = true;
     } else {
       this.mandatory = false;
     }
      const hrs = Number(this.routineActivityForm.controls['hours'].value);
      const mins = Number(this.routineActivityForm.controls['minutes'].value);
      this.totalMinutes  =  hrs * 60 + mins;
     if (type !== 'template') {
       if (this.routineActivityForm.controls['activityIdentifyingId'].value !== null && this.routineActivityForm.dirty) {
         this.editRoleRoutineActivity = new EditRoleRoutineActivity(null, null);
         this.activities = [
           {
             "schedule": this.schedule,
             "routineActivityId": data.entityRoutineActivityId,
             "activityIdentifyingType": this.routineActivityForm.controls['activityIdentifyingType'].value,
             "activityIdentifyingId": this.routineActivityForm.controls['activityIdentifyingId'].value,
             "inchargeType": this.routineActivityForm.controls['inchargeType'].value,
             "inchargeId": typeof this.routineActivityForm.controls['inchargeId'].value === 'string' ? this.inchargeId : this.routineActivityForm.controls['inchargeId'].value,
             "sequence": this.routineActivityForm.controls['sequence'].value,
             "priority": this.routineActivityForm.controls['priority'].value,
             "minDuration": this.totalMinutes,
             "locationId": typeof this.routineActivityForm.controls['locationId'].value === 'string' ? this.locationId : this.routineActivityForm.controls['locationId'].value,
             "isActive": this.status,
             "scheduleTypeId": this.routineActivityForm.controls['scheduleTypeId'].value,
             "weightage": this.routineActivityForm.controls['weightage'].value,
             "mandatory": this.mandatory,
             "isRecurring": this.routineActivityForm.controls['isRecurring'].value,
             "dayTypeIds": this.routineActivityForm.controls['onDate'].value,
             "dayCount": this.routineActivityForm.controls['dayCount'].value,
             "isRepeat": this.routineActivityForm.controls['isRepeat'].value,
           }
         ];
         this.editRoleRoutineActivity.activities = this.activities;
         this.editRoleRoutineActivity.entityRoutineId = data.entityRoutineActivityId;
         // console.log(this.editRoleRoutineActivity);
         // return
           this.configurationService.updateRoleRoutineActivities(this.editRoleRoutineActivity).subscribe(res => {
             if (res.statusCode === 1) {
               this.toastr.success('Success', `${res.message}`);
               this.parent = null;
               this.getRoutine(data.entityRoutineActivityId);
               this.activityList = [];
               this.inchargeList = [];
               this.locationList = [];
               this.editActivities = false;
               this.activityId = null;
               this.defaultTime = null;
               this.edit = true;
               this.routineActivityForm.reset();
               this.routineActivityForm.controls.isActive.setValue('ST-AT');
               this.routineExist = true;
               this.activityExist = false;
             }
           },
             error => {
               this.toastr.error('Error', `${error.error.message}`);
             });
       }
     } else {
       if (this.routineActivityForm.controls['activityIdentifyingId'].value !== null && this.routineActivityForm.dirty) {
         this.editRoutineActivity = new EditRoutineActivity(null, null);
         this.activities = [
           {
             "schedule": this.schedule,
             "routineActivityId": data.routineActivityId,
             "activityIdentifyingType": this.routineActivityForm.controls['activityIdentifyingType'].value,
             "activityIdentifyingId": this.activityId,
             "inchargeType": this.routineActivityForm.controls['inchargeType'].value,
             "inchargeId": typeof this.routineActivityForm.controls['inchargeId'].value === 'string' ? this.inchargeId : this.routineActivityForm.controls['inchargeId'].value,
             "sequence": this.routineActivityForm.controls['sequence'].value,
             "priority": this.routineActivityForm.controls['priority'].value,
             "minDuration": this.totalMinutes,
             "locationId": typeof this.routineActivityForm.controls['locationId'].value === 'string' ? this.locationId : this.routineActivityForm.controls['locationId'].value,
             "isActive": this.status,
             "scheduleTypeId": this.routineActivityForm.controls['scheduleTypeId'].value,
             "weightage": this.routineActivityForm.controls['weightage'].value,
             "mandatory": this.mandatory,
             "isRecurring": this.routineActivityForm.controls['isRecurring'].value,
             "dayTypeIds": this.routineActivityForm.controls['onDate'].value,
             "dayCount": this.routineActivityForm.controls['dayCount'].value,
             "isRepeat": this.routineActivityForm.controls['isRepeat'].value,
           }
         ];
         this.editRoutineActivity.activities = this.activities;
         this.editRoutineActivity.routineId = this.routineForm.controls['routineId'].value;
         this.configurationService.updateRoutineActivities(this.editRoutineActivity).subscribe(res => {
           if (res.statusCode === 1) {
             this.toastr.success('Success', `${res.message}`);
             this.routineID = res.results.routineId;
             this.getActivity(data.activityIdentifyingId);
             this.activityList = [];
             this.inchargeList = [];
             this.locationList = [];
             this.editActivities = false;
             this.activityId = null;
             this.defaultTime = null;
             this.edit = true;
             this.routineActivityForm.reset();
             this.routineActivityForm.controls.activityIdentifyingType.setValue('activity');
             this.routineActivityForm.controls.scheduleTypeId.setValue(this.routineForm.controls['scheduleTypeId'].value);
             this.routineActivityForm.controls.isActive.setValue('ST-AT');
           }
         },
           error => {
             this.toastr.error('Error', `${error.error.message}`);
           });
       }
     }
   }
   addMultiRoutine() {
     this.parent = null;
     this.isAddRoutine=true;
     this.activityExist = false;
     this.routineExist = false;
     this.isActivityList = false;
     this.routineForm.reset();
     this.routineForm.patchValue({
       'scheduleStart': this.today,
       'scheduleTime': this.defaultscheduleTime,
     });
   }
   cancelEditActivity(data?: any) {
     this.isExpanded = false;
     this.isActivityList = true;
     this.activityList = [];
     this.inchargeList = [];
     this.locationList = [];
     this.editActivities = false;
     this.activityId = null;
     this.defaultTime = null;
     this.selectedName = null;
     this.routineActivityForm.reset();
     this.routineExist = true;
     this.activityExist = false
     this.roleIds = [];
     this.departmentIds = [];
     this.inchargeTypeList = [];
     this.routineActivityForm.controls.activityIdentifyingType.setValue('activity');
     this.routineActivityForm.controls.isActive.setValue('ST-AT');
     this.activityScheduleId = null;
     this.hours = '00';
     this.minutes = '30';
     this.routineActivityForm.get('scheduleTypeId').setValue(null);
     if (data !== null && data !== undefined) {
      this.child = false;
      if (data.entityRoutineActivityId) {
        this.getParentRoutine(data.entityRoutineActivityId, 'Routine');
      } else if (data.activityIdentifyingId) {
        this.parent = this.routineID;
      }
     }
    //  this.routineActivityForm.get('inchargeType').setValidators(null);
     this.routineActivityForm.get('inchargeId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
     this.routineActivityForm.get('inchargeId').updateValueAndValidity();
     // if (this.routineForm.controls['routineTypeId'].value === 'ROU-IP') {
     //   this.routineActivityForm.get('inchargeType').setValidators(Validators.required);
     //   this.routineActivityForm.get('inchargeType').updateValueAndValidity();
     //   this.routineActivityForm.get('inchargeId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
     //   this.routineActivityForm.get('inchargeId').updateValueAndValidity();
     // }
     // if (this.routineForm.controls['routineTypeId'].value === 'ROU-STF') {
     //   this.routineActivityForm.get('locationId').setValidators([Validators.required, this.requireLocationMatch.bind(this)]);
     //   this.routineActivityForm.get('locationId').updateValueAndValidity();
     // }
   }
   deleteRoutineActivities(type, data) {
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
       data: {
         title: 'Remove Activity', message: 'Do you want to delete the activity ?',
         buttonText: { ok: 'Delete', cancel: 'Cancel' },
         'isRemark': 1, 'routineActivities': true, 'RType': type, 'routineActivityId': data.routineActivityId,
         'entityRoutineActivityId': data.entityRoutineActivityId, 'deleteActivity': true
       }
     });
     if (type !== 'template') {
       dialogRef.afterClosed().subscribe(result => {
         this.getRoutine();
       });
     } else {
       dialogRef.afterClosed().subscribe(result => {
         this.getActivity();
       });
     }
   }
   endRoutine(data){
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
       data: {
         title: 'Remove Routine', message: 'Do you want to end the routine ?',
         buttonText: { ok: 'Yes', cancel: 'No' },
         'isRemark': 1, 'RoleEndRoutine': true, 'entityRoutineId': this.routineID, 'deleteRoutine': true
       }
     });
       dialogRef.afterClosed().subscribe(result => {
       if (result === 'No') {
         this.activity = true;
         this.routineEdit = true;
         this.showDes = true;
       } else {
         // this.activity = false;
         // this.routineEdit = false;
         this.activity = true;
         this.routineEdit = true;
         this.showDes = true;
         // this.routineID = null;
         // this.routineForm.reset();
         // this.thisDialogRef.close('confirm');
         this.getRoutine(this.routineID);
       }
       this.routineActivityForm.controls.activityIdentifyingType.setValue('activity');
       this.routineActivityForm.controls.isActive.setValue('ST-AT');
       });
   }
   cancelRoutine(data) {
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
       data: {
         title: 'Cancel Routine', message: 'Do you want to cancel the routine ?',
         buttonText: { ok: 'Yes', cancel: 'No' },
         'isRemark': 1, 'RoleCancelRoutine': true, 'entityRoutineEventId': this.entityRoutineEventId, 'cancelRoutine': true
       }
     });
       dialogRef.afterClosed().subscribe(result => {
       if (result === 'No') {
         this.activity = true;
         this.routineEdit = true;
         this.showDes = true;
       } else {
         // this.activity = false;
         // this.routineEdit = false;
         this.activity = true;
         this.routineEdit = true;
         this.showDes = true;
         // this.routineID = null;
         // this.routineForm.reset();
         //  this.thisDialogRef.close('confirm');
         this.getRoutine(data.entityRoutineId);
       }
       this.routineActivityForm.controls.activityIdentifyingType.setValue('activity');
       this.routineActivityForm.controls.isActive.setValue('ST-AT');
       });
   }
   activateEntityRoutine(data) {
     this.activateRoutine = new ActivateRoutine(null);
     this.activateRoutine.entityRoutineEventId = this.entityRoutineEventId;
     this.configurationService.activateEntityRoutine(this.activateRoutine).subscribe(res => {
       if (res.statusCode === 1) {
         this.toastr.success('Success', `${res.message}`);
         this.isDisabled = true;
         //  this.thisDialogRef.close('confirm');
         this.getRoutine(data.entityRoutineId);
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
   }
   saveEntityRoutine(data) {
     this.updateEntityRoutine = new UpdateEntityRoutine(null, null, null, null, null, null, null, null, null, null, null);
     this.updateEntityRoutine.identifiyingId = this.entityId;
     this.updateEntityRoutine.identifyingType = this.entityType;
     if (this.type === 'inpatient' || this.type === 'resident') {
       this.updateEntityRoutine.patientVisitId = this.patientVisitId;
     }
     const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
     const scheduleDate = this.dateFormat.transform(this.routineForm.controls['scheduleStart'].value, 'yyyy-MM-dd');
     const time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
     this.scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
     this.updateEntityRoutine.fromDate = date;
     this.updateEntityRoutine.routineId = this.data.routineId;
     this.updateEntityRoutine.routineStatusId = data.routineStatus ? data.routineStatus : 'RQ-CR';
     this.updateEntityRoutine.routineType = this.routineType;
     this.updateEntityRoutine.tagId = data.tagId;
     this.updateEntityRoutine.scheduleStart = this.scheduleTime;
     this.updateEntityRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['scheduleEnd'].value, 'yyyy-MM-dd 23:59:00');
     this.updateEntityRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
     this.configurationService.UpdateEntityRoutine(this.routineID, this.updateEntityRoutine).subscribe(res => {
       if (res.statusCode === 1) {
         this.routineID = res.results.id	;
        //  this.getRoutine();
         this.toastr.success('Success', `${res.message}`);
         //  this.thisDialogRef.close('confirm');
         this.getRoutine(this.data.routineId);
         this.isDisabled = true;
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
   }
 
   // TASK 
 
     getTaskIncharge(type) {
       this.taskInchargeId = null;
       this.createTaskForm.controls['taskInchargeId'].setValue(null);
       this.easyPickForm.controls['easyTaskInchargeId'].setValue(null);
       if (type === 'RT-RO') {
        let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
        let roleId = this.activate_btn.includes('API_TSKROLUSRSRCH') || this.activate_btn.includes('API_TSKEAROLEUSR')? localStorage.getItem('userlevel') : null
         this.configurationService.getRecipientName('', type, roleId, 'ROU-TSK', null, null, isTask).subscribe(res => {
           this.taskInchargeList = res.results;
           this.taskInchargeEnabled = true;
         });
       } else if(this.activate_btn.includes('API_TSKROLUSRSRCH') && type === 'RT-US'){
        let roleId = localStorage.getItem('userlevel')
        this.configurationService.getRecipientName('', type, roleId).subscribe(res => {
           this.taskInchargeList = res.results;
           this.taskInchargeEnabled = true;
         });
       } else {
         this.taskInchargeList = [];
         this.taskInchargeEnabled = false;
       }
     }
     searchTaskUserNamelist(event) {
       this.toHit = event.toHit;
       this.taskInchargeId = null;
      //  const type = this.createTaskForm.controls['taskInchargeType'].value;
      let type = null;
       if (event.type === 'taskIncharge') {
        type = this.createTaskForm.controls['taskInchargeType'].value;
       } else if(event.type === 'taskInchargeSearch') {
        type = this.easyPickForm.controls['easyTaskInchargeType'].value;
       }
       if ((event.type === 'taskIncharge' || event.type === 'taskInchargeSearch') && event.text.length >= 2 && type === 'RT-US') {
         if (this.toHit == true && type === 'RT-US') {
            let roleId = this.activate_btn.includes('API_TSKROLUSRSRCH') || this.activate_btn.includes('API_TSKEAROLEUSR') ? localStorage.getItem('userlevel') : null
            // let text = this.activate_btn.includes('API_TSKROLUSRSRCH')  ? '' : event.text;
            let text = event.text;
            let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
           this.configurationService.getRecipientName(text, type, roleId, null, null, null, isTask).subscribe(res => {
             this.taskInchargeListRes = res.results;
             this.taskInchargeList = this.taskInchargeListRes;
             this.taskInchargeEnabled = true;
           });
         } else {
           this.taskInchargeList = this.taskInchargeListRes;
           this.taskInchargeEnabled = true;
         }
       } else {
         if (type === 'RT-RO') {
            let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
            let roleId = this.activate_btn.includes('API_TSKROLUSRSRCH') || this.activate_btn.includes('API_TSKEAROLEUSR')? localStorage.getItem('userlevel') : null
           this.configurationService.getRecipientName('', type, null, 'ROU-TSK', null, null, isTask).subscribe(res => {
             this.taskInchargeList = res.results;
             this.taskInchargeEnabled = true;
           });
         }
         // this.taskInchargeList = [];
         // this.taskInchargeEnabled = false;
       }
     }
     getTaskList(id) {
       if (id !== null) {
         const task = this as any as { id: string, name: string }[]
         const taskId = task.find(obj => obj.id === id).name;
         return taskId;
       } else {
         return '';
       }
     }
     getTaskInchargeList(id) {
       if (id) {
         const taskIncharge = this as any as { id: string, name: string }[]
         const taskInchargeId = taskIncharge.find(obj => obj.id === id).name;
         return taskInchargeId;
       } else {
         return '';
       }
     }
     private requireTaskInchargeMatch(control: FormControl): ValidationErrors | null {
       if (this.taskInchargeId == null) {
         if(control.value !== null && control.value !== '') {
           this.requireTaskInchargeMatchVal = this.taskInchargeList.filter(resFilter => resFilter.id === control.value);
           if (this.requireTaskInchargeMatchVal.length === 0) {
             return { requireMatch: true };
           }
         }
         return null;
       }
     }
   
     private requireTaskMatch(control: FormControl): ValidationErrors | null {
       if (this.taskId == null) {
         if (control.value !== null && control.value !== '') {
         this.requireTaskMatchVal = this.taskList.filter(resFilter => resFilter.id === control.value);
         if (this.requireTaskMatchVal.length === 0) {
             return { requireMatch: true };
           }
         }
         return null;
       }
     }
 
     getTaskLocationList(id) {
     if (id) {
       const taskLocation = this as any as { id: string, name: string, fullName: string }[]
       return taskLocation.find(obj => obj.id === id).fullName;
     } else {
       return '';
     }
   }
 
   searchTaskLocationList(event) {
     this.taskLocationId = null;
     this.taskLocationEnabled = true;
     this.toHit = event.toHit;
     if (event.type === 'taskLocation' && event.text.length >= 2) {
       this.taskLocationId = null;
       this.taskLocationEnabled = true;  
       if (this.toHit === true) {
         this.configurationService.getLocationData(event.text).subscribe(res => {
           this.taskLocationListRes = res.results;
           this.taskLocationList = this.taskLocationListRes;
         });
       } else {
         this.taskLocationList = this.taskLocationListRes;
       }
     } else {
       this.easyPickLocId = true;
       this.taskLocationList = [];
       this.taskLocationEnabled = false;
     }
   }
   getTaskLocationID(locationID: any) {
    this.easyPickLocId = true;
    if(locationID != null){
      this.easyPickLocId = false;
      this.taskLocationId = locationID;
    }
   }
   getUserDetails(data, event) {
    if(data.id !== null) {
      this.commonService.getUserDetailByLocId(data).subscribe(res => {
        if(res.results.length !== 0) {
          this.taskInchargeId = res.results[0].id;
          this.easyPickForm.patchValue ({
            'easyTaskInchargeType': 'RT-US',
            'easyTaskInchargeId': res.results[0].name
          });
        } else {
          this.taskInchargeId = this.taskInchargeId; 
          this.easyPickForm.patchValue({
            'easyTaskInchargeType': this.inchargeType,
            'easyTaskInchargeId': this.inchargeName,
          })
        }
      });
    } else {
      this.taskInchargeId = event.inchargeId;
      this.easyPickForm.patchValue({
        'easyTaskInchargeType': event.inchargeType,
        'easyTaskInchargeId': event.inchargeName,
      })
    }
   }
     getTaskDetails(id) {
       this.configurationService.getActivitiesById(id).subscribe(res => {
         const data = res.results[0];
         let inchargeType = null;
         let inchargeName = null;
         this.activityCategoryId = data.activityCategoryId;
         if(this.entityType === 'User') {
          this.taskInchargeId = this.entityId;
          inchargeType = 'RT-US';
          inchargeName = this.entityName;
         } else {
          if(data.activityCategoryId === "AC-HAZ") {
            inchargeType = 'RT-US';
          } else {
            inchargeType = data.inchargeType;
          }
          this.taskInchargeId = data.inchargeId;
          inchargeName = data.inchargeName;
         }
         this.canAutoAllocate = data.canAutoAllocate;
         this.autoComplete = data.autoComplete;
         this.hazardConfigValue = data.configValue;
         this.taskLocationId = data.destinationId ? data.destinationId : (data.destLocationId ? data.destLocationId : null);
         if(this.data.hasOwnProperty('type') && this.data.type == 'RQT-NC'){ 
          data.description = this.data.description;
          data.destinationName = this.data.destinationName;
         }
         this.createTaskForm.patchValue({
             'taskInchargeType': inchargeType,
             'taskInchargeId': inchargeName,
              'gender': data.gender ,
             'taskDescription': data.description,
             'taskLocationId': data.destinationName ? data.destinationName : (data.destLocationName ? data.destLocationName : null),
         });
       });
     }
     searchTasklist(event) {
       this.taskId = null;
       if (event.text.length >= 2) {
         if (event.toHit === true) {
           let routineType = 'ROU-TSK'
           if(this.data.hasOwnProperty('RType')) {
            routineType = this.data.RType == "inpatient" ? 'ROU-IDP' : this.data.RType == "staffRoutine" ? 'ROU-STF' : routineType
           }
           let activitySubType = null;
           if(this.data.hasOwnProperty('type') && this.data.type == 'RQT-NC') {
            activitySubType = this.createTaskForm.controls.workItemId.value;
           }
           this.configurationService.searchActivities(event.text, 'activity', routineType, null, activitySubType).subscribe(res => {
             this.taskListItems = res.results;
             this.taskList = this.taskListItems;
             this.taskEnabled = true;
           });
         } else {
           this.taskList = this.taskListItems;
           this.taskEnabled = true;
         }
       } else {
         this.taskList = [];
         this.taskEnabled = false;
       }
     }
     getPorter(data) {
      this.selectedTask = data;
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-OT', id: '0', name: 'others'},
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectedTask = this.activityCategoryList[0];
        this.getTaskActivity(this.selectedTask);
      });
     }
     getTaskActivity(data) {
       this.selectedTask = data;
       this.configurationService.getTaskActivities('ROU-TSK', data.code).subscribe(res => {
         this.taskActivitiesList = res.results;
         this.selectedTaskActivity = [];
         this.easyPickForm.get('easyTaskDescription').setValue(null);
         this.easyPickForm.get('easyTaskStartTime').setValue(this.defaultTaskDate);
       });
     }
     getTaskActivityDetail(data) {
       this.selectedTaskActivity = data;
       this.task = data;
       let inchargeType = null;
       let inchargeName = null;
       if(this.entityType === 'User') {
       this.taskInchargeId = this.entityId;
       inchargeType = 'RT-US';
       inchargeName = this.entityName;
       } else {
       this.taskInchargeId = data.inchargeId;
       this.inchargeType = data.inchargeType;
       this.inchargeName = data.inchargeName;
       }
       this.hazardConfigValue = data.configValue;
       this.taskLocationId = data.destinationId ? data.destinationId : (data.destLocationId ? data.destLocationId : null);
       this.easyPickForm.patchValue ({
        'easyTaskInchargeType': this.inchargeType,
        'easyTaskInchargeId': this.inchargeName,
        'easyTaskDescription': data.description,
        'easyTaskRemarks': data.remarks,
        'easyTaskLocation': data.destinationName ? data.destinationName : (data.destLocationName ? data.destLocationName : null),
      });
      const locData = [];
      locData['id'] = data.destinationId ? data.destinationId : (data.destLocationId ? data.destLocationId : null);
      locData['parentId'] = null;
      locData['locationTypeId'] = null;
      this.getUserDetails(locData, data);
     }
     saveTaskEasyPick() {
       this.createTaskEasyPick = new CreateTaskEasyPick(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
       this.createTaskEasyPick.pfActivityId = this.task.id;
       this.createTaskEasyPick.gender = this.task.gender;
       this.createTaskEasyPick.comments = this.easyPickForm.controls['easyTaskDescription'].value;
       this.createTaskEasyPick.remarks = this.easyPickForm.controls['easyTaskRemarks'].value;
       this.createTaskEasyPick.startTime = this.dateFormat.transform(this.easyPickForm.controls['easyTaskStartTime'].value, 'yyyy-MM-dd HH:mm:ss');
       this.createTaskEasyPick.type = 'RQT-OT';
       if(this.patientId) {
        this.createTaskEasyPick.requestCategory = 'PR-PA';
       } else {
        this.createTaskEasyPick.requestCategory = 'PR-OT';
       }
       if (this.taskLocationId !== null) {
        this.createTaskEasyPick.destinationId = this.taskLocationId;
       } else {
        this.createTaskEasyPick.destinationId = '';
       }
       this.nonPerformerInfo = [];
       if(this.patientId) {
         this.nonPerformerInfo = [
           {
             entityId: this.patientId,
             entityType: 'Patient',
             locationId: this.taskLocationId,
           },
         ];
       } else {
         this.nonPerformerInfo = [];
       }
       this.performerInfo = [];
       if(this.entityType === 'User') {
        this.performerInfo = [
          {
           id: this.entityId,
           type: 'RT-US'
          },
        ];
       } else {
        this.performerInfo = [
          {
           id: this.taskInchargeId === null ? this.easyPickForm.controls['easyTaskInchargeId'].value : this.taskInchargeId,
           type: this.easyPickForm.controls['easyTaskInchargeType'].value
          },
        ];
       }
       const time = this.dateFormat.transform(this.easyPickForm.controls['easyTaskStartTime'].value, 'yyyy-MM-ddTHH:mm');
       if (time > this.defaultTaskDate) {
         this.createTaskEasyPick.status = 'RQ-SH';
       }
       this.createTaskEasyPick.isautoAssigned = this.canAutoAllocate;
       this.createTaskEasyPick.isAutoComplete = this.autoComplete;
       this.createTaskEasyPick.performer = this.performerInfo;
       this.createTaskEasyPick.nonPerformer = this.nonPerformerInfo;
       this.createTaskEasyPick.configValue = this.hazardConfigValue;
      // console.log(this.createTaskEasyPick);
      // return
       this.commonService.saveTask(this.createTaskEasyPick).subscribe(res => {
         if (res.statusCode === 1) {
           this.toastr.success('Success', `${res.message}`);
           this.thisDialogRef.close('confirm');
         }
       },
         error => {
           this.toastr.error('Error', `${error.error.message}`);
         });
     }
     saveAlertTask() {
      let payLoad = {
        "patientId": this.patientId,
        "alertId": this.data.iotAlertId,
        "identifyingId": this.createTaskForm.controls['taskInchargeId'].value,
        "identifyingType": this.createTaskForm.controls['taskInchargeType'].value,
        "comments": this.createTaskForm.controls['remarks'].value,
        "pfActivityId": this.createTaskForm.controls['taskId'].value,
        "gender": this.createTaskForm.controls.gender.value,
        "workItemId": this.createTaskForm.controls.workItemId.value
      }
      if(this.createTaskForm.controls['taskInchargeType'].value === 'RT-RO') {
        payLoad['identifyingId'] = this.taskInchargeId === null ? this.createTaskForm.controls['taskInchargeId'].value : this.taskInchargeId;
      }
      this.commonService.assignAlertById(payLoad).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
     }  
     saveTask() {
     if(this.data.hasOwnProperty('type') && this.data.type == 'RQT-NC') {
      this.saveAlertTask();
     } else {
     this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null);
     this.createTask.pfActivityId = this.createTaskForm.controls['taskId'].value;
     this.createTask.gender = this.createTaskForm.controls['gender'].value;
     this.createTask.comments = this.createTaskForm.controls['taskDescription'].value;
     this.createTask.remarks = this.createTaskForm.controls['remarks'].value;
     this.createTask.startTime = this.dateFormat.transform(this.createTaskForm.controls['taskStartTime'].value, 'yyyy-MM-dd HH:mm:ss');
     this.createTask.type = 'RQT-OT';
     if(this.patientId) {
      this.createTask.requestCategory = 'PR-PA';
     } else {
      this.createTask.requestCategory = 'PR-OT';
     }
     this.createTask.destinationId = this.taskLocationId != null ? this.taskLocationId : '';
     this.nonPerformerInfo = [];
     if(this.patientId) {
       this.nonPerformerInfo = [
         {
           entityId: this.patientId,
           entityType: 'Patient',
           locationId: this.taskLocationId,
         },
       ];
     } else {
       this.nonPerformerInfo = [];
     }
     this.performerInfo = [];
     if (this.taskInchargeId === null) {
       this.taskInchargeId = this.createTaskForm.controls['taskInchargeId'].value;
     }
     if(this.entityType === 'User') {
      this.performerInfo = [
        {
         id: this.entityId,
         type: 'RT-US'
        },
      ];
     } else {
      this.performerInfo = [
        {
          id: this.taskInchargeId,
          type: this.createTaskForm.controls['taskInchargeType'].value,
        },
      ];
     }
     const time = this.dateFormat.transform(this.createTaskForm.controls['taskStartTime'].value, 'yyyy-MM-ddTHH:mm');
     if (time > this.defaultTaskDate) {
       this.createTask.status = 'RQ-SH';
     }
     this.createTask.isautoAssigned = this.canAutoAllocate;
     this.createTask.isAutoComplete = this.autoComplete;
     this.createTask.performer = this.performerInfo;
     this.createTask.nonPerformer = this.nonPerformerInfo;
     this.createTask.configValue = this.hazardConfigValue;
     if(this.createTask.configValue) {
      this.createTask.configValue['is_dummy'] = this.createTaskForm.controls['isDummy'].value;
     }
      //  console.log(this.createTask);
     this.commonService.saveTask(this.createTask).subscribe(res => {
       if (res.statusCode === 1) {
         this.PushNotificationsService.triggerNotificationRefresh();
         this.toastr.success('Success', `${res.message}`);
         this.thisDialogRef.close('confirm');
       }
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
      }
   }
   taskRoutineStatusChange(event, type) {
     const deleteData = {
       "comments": event.comments, "type": event.requestTypeId,
       "status": type, "userType": event.performerType
     }
     const dialogRef = this.dialog.open(ConfirmationDialog, {
       panelClass: ['mdm-Confirmation-popup'], disableClose: true,
       data: {
         title: 'Manage Task', message: type == 'RQ-CR' ? 'Do you want to undo the task ?' :  
         type == 'RQ-IP' ? 'Do you want to inprogress the task ?' : 'Do you want to complete the task ?',
         buttonText: { ok: 'Yes', cancel: 'No' },
         'deleteTask': true, 'requestId': event.requestId, 'deleteData': deleteData
       }
     });
     dialogRef.afterClosed().subscribe(result => {
      if(result === 'confirm'){
        this.getAllTask();
      }
     });
   }
   getAllTask() {
     this.isTaskExpanded = false;
     let statusIds = ['RQ-CR','RQ-IP','RQ-PEN']
     this.workflowService.getAllJobs(null,null,null,statusIds,false, false,false, null,null, this.pageStart, this.pageSize, this.entityId).subscribe(res => {
      if(this.data.hasOwnProperty('taskIds')) {
        let result = res.results;
        let datasource = [];
        datasource = result.filter(val => this.data.taskIds.includes(val.requestId));
        this.TkdataSource = new MatTableDataSource<any>(datasource);
        this.TkdataSource.sort = this.sort;
        if (res.results.length !== 0) {
          this.taskExist = true;
        } else {
          this.taskExist = false;
        }
      }else {
       this.TkdataSource = new MatTableDataSource<any>(res.results);
       this.TkdataSource.sort = this.sort;
       if(this.applyFilterValue !== null) {
         this.TkdataSource.filter = this.applyFilterValue;
       }
       if (res.results.length !== 0) {
         this.taskExist = true;
       } else {
         this.taskExist = false;
       }
      }
     });
   }
   getAllHistoryTask() {
    let statusIds = ['RQ-CO','RQ-CA']
    let selectedDate = this.dateFormat.transform(this.historyDate, 'yyyy-MM-dd')
     this.workflowService.getAllJobs(null,selectedDate,null,statusIds,false, false,false, null, null, this.pageStart, this.pageSize, this.entityId).subscribe(res => {
      this.length = res.totalRecords;
      console.log(this.length)
      this.pageHit = true;
       // if (res.statusCode === 1) {
         this.TKHisDataSource = new MatTableDataSource<any>(res.results);
         this.TKHisDataSource.sort = this.sort;
         if (res.results.length !== 0) {
           this.taskHisExist = true;
         } else {
           this.taskHisExist = false;
         }
       // }
     });
   }
   selectTask(data, type) {
    if(type === 'Task') {
      this.taskSelectedName = data.requestId;
      this.selectedReqId = null;
    } else {
      this.taskSelectedName = null;
      this.selectedReqId = data.requestId;
    }
   }
   completeTask(data) {
     this.isTaskExpanded = false;
     this.requestId = data.requestId;
     this.taskSelectedName = data.requestId;
     const completeData = {"comments": data.description,
                           "type": data.requestType,
                           "status": 'RQ-CO',
                           "userType": data.inchargeType}
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
         data: {
           title: 'Complete Task', message: 'Do you want to complete the task ?',
           buttonText: { ok: 'Yes', cancel: 'No' },
           'completeTask': true, 'requestId': data.requestId, 'completeData': completeData
         }
       });
     dialogRef.afterClosed().subscribe(result => {
       this.requestId = null;
       this.taskSelectedName = null;
       this.getAllTask();
     });
   }
   selectRow(data,scrollbottom){
    this.isTaskSelect = !this.isTaskSelect;
    if(this.isTaskSelect){
      this.editTask(data,scrollbottom)
    } else {
      this.cancelTask()
    }
   }
   editTask(data,scrollbottom) {
     this.isTaskExpanded = true;
     this.isEditTask = true;
     this.scrollToDown(scrollbottom);
     this.requestId = data.requestId;
     this.requestType = data.requestType;
     this.taskId = data.activityName;
     this.selectedReqId = null;
     this.taskSelectedName = data.requestId;
     this.taskLocationId = data.destinationId ? data.destinationId : (data.destLocationId ? data.destLocationId : null);
     data['name'] = data.activityName;
     this.createTaskForm.get('taskInchargeId').setValidators(null);
     this.createTaskForm.patchValue({
       'taskId': data.activityName,
       'taskInchargeType': data.inchargeType,
       'taskInchargeId': data.inchargeName,
       'gender': data.gender,
       'taskDescription': data.description,
       'taskStartTime':  this.dateFormat.transform(data.schedule, 'yyyy-MM-ddTHH:mm'),
       'taskLocationId': data.destinationName ? data.destinationName : (data.destLocationName ? data.destLocationName : null),
     });
   }
   cancelTask() {
     this.isTaskSelect = false;
     this.isTaskExpanded = false;
     this.requestId = null;
     this.isEditTask = false;
     this.taskSelectedName = null;
     this.createTaskForm.reset();
   }
   updateTask() {
     const updateData = {"comments": this.createTaskForm.controls.taskDescription.value,
                         "remarks": this.createTaskForm.controls['remarks'].value,
                         "type": this.requestType}
     this.commonService.updateTask(this.requestId, updateData).subscribe(res => {
       if (res.statusCode === 1) {
         this.requestId = null;
         this.requestType = null;
         this.isEditTask = false;;
         if(this.data && this.data.type === 'modify'){
           this.thisDialogRef.close('confirm');
         } else {
         this.isTaskExpanded = false;
         this.taskSelectedName = null
         this.getAllTask();
         this.cancelTask();
         }
       this.toastr.success('Success', `${res.message}`);
       }
     },
     error => {
       this.toastr.error('Error', `${error.error.message}`);
     });
   }
   deleteTask(data) {
     this.isTaskExpanded = false;
     this.requestId = data.requestId;
     this.taskSelectedName = data.requestId;
     const deleteData = {"comments": data.description,
                         "type": data.requestType,
                         "status": 'RQ-CA',
                         "userType": data.inchargeType}
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
         data: {
           title: 'Cancel Task', message: 'Do you want to cancel the task ?',
           buttonText: { ok: 'Yes', cancel: 'No' },
           'deleteTask': true, 'requestId': data.requestId, 'deleteData': deleteData
         }
       });
     dialogRef.afterClosed().subscribe(result => {
       this.requestId = null;
       this.taskSelectedName = null;
       this.getAllTask();
     });
   }
   applyFilter(filterValue: string, type) {
     filterValue = filterValue.trim();
     filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     if(type === 'Task List') {
      this.TkdataSource.filter = filterValue;
     } else if(type === 'Task History') {
      this.TKHisDataSource.filter = filterValue;
     }
   }
   getAlertHis(data){
    const dialogRef = this.dialog.open(PorterRequestHistoryComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.cancelTask()
    })
  }
  eventTriggers(event){
    this.pageStart = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.getAllHistoryTask();
  }
  refershPage(){
    this.search = null;
    this.applyFilterValue = null;
    this.getAllTask()
  }
     fixClick() {
       console.log('')
     }
 }
 
