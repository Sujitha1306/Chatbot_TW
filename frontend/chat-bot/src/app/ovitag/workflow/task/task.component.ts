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
 import { Component, OnInit, Inject, AfterViewInit, ViewChild, OnDestroy } from "@angular/core";
 import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTabChangeEvent, MatTabGroup } from "@angular/material/tabs";
import { FormGroup, FormBuilder, FormControl, Validators, ValidationErrors } from "@angular/forms";
import { CommonService, ConfigurationService, ExcelService, HospitalService, WorkflowService } from "../../../shared";
import { ActivatedRoute } from "@angular/router";
import { DatePipe } from "@angular/common";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { AssignToTask } from "../workflow.models";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { PushNotificationsService } from "../../../shared/services/push.notification.service" 
import { TaskManagmentComponent } from "../../../shared/modules/entry-component/task-managment/task-managment.component";
import { EventStatusTrackingComponent } from "../../../shared/modules/entry-component/event-status-tracking/event-status-tracking.component";
import { PrintStickerComponent } from "../print-sticker/print-sticker.component";
import { CreateAssetComponent } from "../../configuration/asset/asset.component";
import { Observable } from "rxjs/internal/Observable";
import { EditLocationManagementComponent } from "../location-management/location-management-new.component";
import { AppToastService } from "../../../shared/services/toaster.service";
import { ManageAssetComponent } from "../../../shared/modules/entry-component/manage-asset/manage-asset.component";
import { GatePassComponent } from "../../../shared/modules/entry-component/gate-pass/gate-pass.component";
import { Subscription } from "rxjs";
import { finalize } from 'rxjs/operators';
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
 
 @Component({
   selector: "app-task",
   templateUrl: "./task.component.html",
   styleUrls: ["./task.component.scss"],
   providers: [
     { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
     { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
   ],
 })
 export class TaskComponent implements OnInit, AfterViewInit, OnDestroy {
   displayedColumns: string[] = [];
   iconHeader = [];
   iconColumn = [];
   sortColumn = [];
   dateTimeColumns = ["Schedule Time"]
   permissionControl = ['BT_ALLE'];
   eventColumn = [];
   public selectedName: any;
   public activate_btn: any = [];
   public selectedView = 'table';
   public applyFilterValue = null;
   public currentDate = new Date();
   public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
   public tableData: any;
   public showActions1 = [];
   public showActions2 = [];
   public showActions3 = [];
   public showActions = this.showActions1;
   public selectedTabIndex = 0;
   public selectDropdown = null;
   public pageStart : number = 0;
   public pageSize: number = 50;
   public length = 0;
   identifyType = null;
   routineId = null;
   loading = false;
   taskData: any;
   public current_Location = false;
   porterDetails: any;
   selectedRow: any = [];
   public responseColumns = [];
   public myTaskCount = 0;
   public allTaskCount = 0;
   public taskcount = null;
   public allTaskFilter = [
    {
      id: 'department',
      value: 'Department',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment' ],
      dependentFilter: ['my department'],
    },
    {
      id: 'my department',
      value: 'My Department',
      isNoneAll: false,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
      enableEmpty: false,
    },
    {
      id: 'status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'context',
      value: 'Context',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All'],
      dependentFilter: ['category'],
      isLoadSubFilters: true
    },
    {
      id: 'category',
      value: 'Category',
      selectionType: 'multi',
      isAll: true,
      subFilters: [],
      defaultSelected: [],
    },
    {
      id: 'task',
      value: 'Show Only',
      isAll: false,
      selectionType: 'multi',
      subFilters: [{ code: 'myRequest', value: 'Created by me' }],
      defaultSelected: []
    }
   ];
   public routinTaskFilter = [
    {
      id: 'department',
      value: 'Department',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment' ],
      dependentFilter: ['my department'],
    },
    {
      id: 'my department',
      value: 'My Department',
      isNoneAll: false,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
      enableEmpty: false,
    },
    {
      id: 'routineStatus',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'context',
      value: 'Context',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All'],
      dependentFilter: ['category'],
      isLoadSubFilters: true
    },
    {
      id: 'category',
      value: 'Category',
      selectionType: 'multi',
      isAll: true,
      subFilters: [],
    },
    {
      id: 'routine',
      value: 'Routine',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'task',
      value: 'Show Only',
      isAll: false,
      selectionType: 'multi',
      subFilters: [{ code: 'myRequest', value: 'Created by me' }],
      defaultSelected: []
    }
   ]
   approvalFilter = [
    {  id: 'view',
       value: 'Approval View',
       isAll: false,
       selectionType: 'single',
       subFilters: [{code:'myApproval', value:'My Approval'}],
       defaultSelected: ['myApproval']
      },
     {
       id: 'requestType',
       value: 'Type',
       isAll: true,
       selectionType: 'multi',
       subFilters: [],
       defaultSelected: []
     },
     {
       id: 'requestStatus',
       value: 'Status',
       isAll: true,
       selectionType: 'multi',
       subFilters: [],
       defaultSelected: []
     }
   ];
   myJobChipFilter = {
    id: 'jobChipFilter',
    value: 'My Job',
    isAll: true,
    selectionType: 'multi',
    subFilters: [],
    defaultSelected: ['RT-RO']
   }
   public requestTypeIds: any = null;
   public requestStatusIds: any = null;
   public groupFilter:any = [];
   selectedContext = null;
   contestList: any;
   statusList: any[] = [];
   selectedStatus = ['RQ-CA','RQ-CO','RQ-CR','RQ-IP','RQ-CL','RQ-NEW','RQ-PEN','RQ-SH']
   isMyRole: boolean = true;
   isMyDepartment: boolean = false;
   taskColumns: any;
   jobColumns = null;
   approvalMatrixColums = null;
   jobFilters = [{code: 'RT-JO',value:'My Task', count: 0}, {code: 'RT-RO',value:'My Role', count: 0}, {code: 'RT-DT',value:'My Department',count: 0}];
   chipSelectedFilter = ['RT-RO'];
   sliderPosition: string = '0px';
   chipFilter = [];
   selectedTask = 'RQT-TASK';
   selectedRoutineType: any[] = [];
   routineList: any[] = [];
   allCounts: any;
   selectedJobCount = 0;
   routineStatusList: any[] = [];
   selectedRoutineStatus: any[] = [];
   selectedToDate = null;
   selectedJobChip = ['RT-RO'];
   countInfo = {
    label:[],
    values:[]
   }
   departmentId :any;
   myDepartment: any = 'myDepartment';
   departmentSelection = ['myDepartment'];
   myTask : any;
   routinedisplayedColumns= ["Type","Priority","Context Id","Context","Category","Identifier","Schedule Type","Name","Status","Schedule","Assigned Type","Assigned To","Location","Requested By","Action"];
   routineresponseColumns: ["routientTypeName","priorityLevelId","requestCategoryId","nonPerformerName","activityCategoryName","requestIdentifier","scheduleTypeName","activityName","statusName","scheduleDate","performerType","performerName","destinationLocationName","userName","Action"];
   selectedTabName: string = 'Ticket';
   @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
   excelDisplayedColumns = [];
   excelResponseColumns = [];
   isExcel: boolean = true
   activityCategory :any =null;
   categoryFilters: any[];
   rowData: any;
   taskRoutineConfig = null;
   taskWorkOrderConfig = null;
   ticketConfig = null;
   public subscription: Subscription;
   selectedTab: any;
   tabPermission = null;
   onLoad = true;
   isAllJobChipFilterSelected = false;
   public loginUserId = localStorage.getItem('dXNlcklk');
   viewApproval = 'myApproval';
   displayDate = true;
   constructor(
     private readonly workflowService: WorkflowService,
     public hospitalService: HospitalService,
     public configurationService: ConfigurationService,
     public dialog: MatDialog,
     public fb: FormBuilder,
     public datepipe: DatePipe,
     public commonService: CommonService,
     private readonly route: ActivatedRoute,
     public PushNotificationsService : PushNotificationsService,
     public toastr: AppToastService,
     private readonly excelService: ExcelService
   ) {
      this.activate_btn = this.commonService.getActivePermission('button');
      this.getPermissionDropDown()
      // this.getDynamicTableColumn();
   }
 
   ngOnInit() {
    const defaultTabName =this.activate_btn.includes('BT_TK_TKT') ? 'Ticket' :this.activate_btn.includes('BT_TK_ROU') ? 'Routine' :this.activate_btn.includes('BT_TA_WK') ? 'Work Order' :this.activate_btn.includes('BT_TA_JOB') ? 'My Job' : null;
    setTimeout(() => {
      if (this.commonService.userPreference?.hasOwnProperty('taskFilter')) {
        let preferenceData = this.commonService.userPreference.taskFilter.value;
        preferenceData = JSON.parse(preferenceData)
        if(preferenceData.hasOwnProperty('taskTabs')){
          if(this.activate_btn.includes(preferenceData.taskTabs.tabPermission) || preferenceData.taskTabs.tabPermission === 'job'){
            this.selectedTab = preferenceData.taskTabs;
            this.selectedTabIndex = this.selectedTab.tabIndex;
            this.selectedTabName = this.selectedTab.tabName;
            this.tabPermission = this.selectedTab.tabPermission;
          } else {
            this.selectedTab = preferenceData.taskTabs;
            this.selectedTabName=  defaultTabName;
          }
        }else{
          this.selectedTabName = defaultTabName;
        }
      } else {
        this.selectedTabName = defaultTabName;
      }
      if(this.selectedTabName != null){ //all mat-tabs have permission when selectedTab is null get call restriction 
        this.getDynamicTableColumn();
      }
     },0)
    this.myJobChipFilter['subFilters'] = this.jobFilters;
    // this.myJobChipFilter['defaultSelected'] = this.selectedJobChip;
    this.commonService.getAppTermsLink('RQT-TASK', 'RequestStatus').subscribe(res => {
      this.statusList = res.results.filter(resFilter => !['RQ-OP', 'RQ-PLN', 'RQ-RAS'].includes(resFilter.code));
      const status = this.allTaskFilter.find(f => f.id === 'status');
      status.subFilters = this.statusList;
      this.getFilterOptions();
     })
     this.commonService.getAppTermsLink('RQT-ROU', 'RequestStatus').subscribe(res => {
      this.routineStatusList = res.results
      const routineStatus = this.routinTaskFilter.find(f => f.id === 'routineStatus');
      routineStatus.subFilters = this.routineStatusList;
     })
     this.commonService.getAppTermsLink('RQT-TASK', 'PorterRequestType').subscribe(res => {
      this.contestList = res.results;
      const context = this.allTaskFilter.find(f => f.id === 'context');
      const routineContext = this.routinTaskFilter.find( f => f.id === 'context')
      context.subFilters = this.contestList;
      routineContext.subFilters = this.contestList;
      this.getFilterOptions();
     })
    this.initializeDepartmentFilter(this.allTaskFilter);
    this.initializeDepartmentFilter(this.routinTaskFilter);
    this.loadContextSubFilter(this.allTaskFilter);
    this.loadContextSubFilter(this.routinTaskFilter);

     this.commonService.getAppTerms('RoutineType').subscribe(res =>{
      this.routineList = res.results.filter(resFilter => resFilter.groupName === 'RoutineType');
      const routineFilt = this.routinTaskFilter.find(f => f.id === 'routine');
      if(routineFilt){
        routineFilt.subFilters = this.routineList;
      }
     })
     this.route.queryParams.subscribe(param => {
      this.identifyType = null;
      if (param.hasOwnProperty('identifyingType')) {
        this.identifyType = param['identifyingType'];
      }
    });
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
      if (msg.length) {
        msg = msg[0];
        this.alertBinding(msg);
      }
    });
   }

   alertBinding(msg) {
    if(msg['ctx'] != "AssetTransfer"){
      return;
    }else if(msg['ctx'] === "AssetTransfer"){
      this.refreshPage();
      return
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.saveAssetPreference();
  }

   ngAfterViewInit(): void {
     setTimeout(() => {
       const currentTab = this.tabGroup._tabs.get(this.selectedTabIndex);
       this.selectedTabName = currentTab?.textLabel || '';
       if(this.selectedTabName === 'Work Order'){
        this.selectedTask = "RQT-WRK"
       } else if (this.selectedTabName === 'Routine') {
        this.selectedTask = "RQT-ROU"
       } else if (this.selectedTabName === 'Ticket') {
        this.selectedTask = 'RQT-TASK';
       } else if (this.selectedTabName === 'My Job') {
        this.chipSelectedFilter = this.selectedJobChip ?? ['RT-RO'];
       }
     });
   }

   getFilterOptions() {
     this.groupFilter = this.allTaskFilter;
     this.selectedJobCount = this.allCounts?.myJob
   }

   getPermissionDropDown(){
      const permission = JSON.parse(localStorage.getItem('permission'));
      const dropdown = permission?.dropdown || [];
      const taskAction = dropdown?.filter(x => x.page === 'Task');
      const createActionCodes = ['WD_TA_TKT', 'WD_TA_TASK'];
      const createActions = taskAction?.filter(item =>createActionCodes.includes(item.code));
      const modifyActions = taskAction?.filter(item => item.code === 'WD_TA_MO');
      const printerStickerActions = dropdown?.filter(item => item.code ==='WD_AL_PS')
      const mapAction = (list: any[]) =>list.map(x => ({ id: x.code, value: x.name }));
      this.showActions1.push(...mapAction(createActions));
      this.showActions2.push(...mapAction(modifyActions));
      this.showActions3.push(...mapAction(createActions),...mapAction(printerStickerActions));
      this.showActions = this.showActions1;
   }

   initializeDepartmentFilter(filterArray) {
    const myDepartmentFilter = filterArray.find(filter => filter.id === 'my department');
    const departmentFilter = filterArray.find(filter => filter.id === 'department');
    if (myDepartmentFilter) {
      const userId = localStorage.getItem(btoa('userId'));
      this.commonService.getUserDepartmentLink(userId).subscribe(res => {
        if (res.statusCode === 1 && Array.isArray(res.results) && res.results.length > 0) {
          myDepartmentFilter.subFilters = res.results.map(({ departmentId, departmentName }) => ({
            code: departmentId,
            value: departmentName
          }));
          this.departmentSelection = departmentFilter?.defaultSelected;
          if (this.departmentSelection?.[0] === 'myDepartment') {
            myDepartmentFilter.defaultSelected = (this.departmentId?.length > 0)? this.departmentId : myDepartmentFilter.subFilters.map(item => item.code);
            this.departmentId = myDepartmentFilter.defaultSelected;
          }
        }
      });
    }

    if (departmentFilter && this.activate_btn.includes('BT_TKALL')) {
      departmentFilter.subFilters.push({ code: 'BT_TKALL', value: 'All' });
    }
  }

  loadContextSubFilter(filterArray) {
    let selectedContext = filterArray.find(filter=> filter.id === 'context');
     selectedContext.defaultSelected = this.selectedContext != null ?[this.selectedContext] :['All'];
    const category = filterArray.find(f => f.id === 'category');
    if (selectedContext?.defaultSelected?.[0] === 'All') {
      category.subFilters = [];
      this.activityCategory = null;
      return;
    }
    selectedContext = selectedContext?.defaultSelected?.[0]  ??'All';
    if (!selectedContext || selectedContext === 'All') return;
    this.commonService.getAppTermsLink(selectedContext, 'ActivityCategory').subscribe(res => {
        this.categoryFilters =category.subFilters = [...res.results.map(item => ({
          code: item.code,
          value: item.value
        }))];
        category.defaultSelected = this.activityCategory != null? this.activityCategory : [];
      });
  }

 
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim(); 
     filterValue = filterValue.toLowerCase(); 
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
     if(this.applyFilterValue.length > 3 || this.applyFilterValue.length === 0){
      if (this.selectedTabName === 'Approval Matrix') {
        this.displayDate = false;
        this.getApprovalMatrixData();
      } else {
        this.displayDate = true;
        this.getTaskDetails(false);
      }
     }
   }

   getDynamicTableColumn() {
      this.loading = true;
      let config = null;
      if(this.selectedTabName === 'Routine') {
        config = 'task-routine';
      } else if (this.selectedTabName === 'Work Order') {
        config = 'task-work-order';
      } else if (this.selectedTabName === 'Ticket'){
        config = 'task'; 
      }else if(this.selectedTabName === 'My Job'){
        config = 'task-job'
      } else if (this.selectedTabName === 'Approval Matrix') {
        config = 'approval-matrix'
      }
      this.commonService.getDynamicTableColumn(config).subscribe((res) => {
        if(res.statusCode === 1){
          const roleId = localStorage.getItem('roleId');
          if(roleId && res.results.contentObject?.role &&  res.results.contentObject.role[roleId]) {
            this.taskColumns = res.results.contentObject.role[roleId];
          }else{
            this.taskColumns = res.results.contentObject;
          }
          if(this.selectedTabName === 'Routine') {
            this.taskRoutineConfig = this.taskColumns;
            this.getTabBasedTaskDetails(this.taskRoutineConfig);
          } else if (this.selectedTabName === 'Work Order') {
            this.taskWorkOrderConfig = this.taskColumns;
            this.getTabBasedTaskDetails(this.taskWorkOrderConfig);
          } else if (this.selectedTabName === 'Ticket'){
            this.ticketConfig = this.taskColumns; 
            this.getTabBasedTaskDetails(this.ticketConfig);
          } else if (this.selectedTabName === 'Approval Matrix') {
            this.approvalMatrixColums = this.taskColumns;
            this.getTabBasedTaskDetails(this.approvalMatrixColums);
          } else{
            this.jobColumns = this.taskColumns;
            this.getTabBasedTaskDetails(this.jobColumns)
          }
        }
      });
      if(this.onLoad){
        this.checkUserPreference()
      }
  }

  checkUserPreference() {
    if(this.commonService.userPreference?.hasOwnProperty('taskFilter')) {
      this.updateFilters()
    } else {
      this.commonService.validateUserPreference('taskFilter');
      setTimeout(() => {
        this.updateFilters()
      }, 2000);      
    }
  }

   getApprovalMatrixData() {
     this.loading = true;
     let viewApproval = this.viewApproval == 'myApproval' ? true : null;
     let requestTypeIds = this.approvalFilter.find(f => f.id === 'requestType')?.subFilters?.length === this.requestTypeIds?.length ? null : this.requestTypeIds;
     let requestStatusIds = this.approvalFilter.find(f => f.id === 'requestStatus')?.subFilters?.length === this.requestStatusIds?.length ? null : this.requestStatusIds;
     this.commonService.getApprovalMatrix(this.pageStart, this.pageSize, requestTypeIds, requestStatusIds, this.applyFilterValue,null, null, viewApproval).subscribe(res => {
       this.loading = false;
       this.tableData = [];
       this.length = 0;
       if (res.statusCode === 1) {
         this.tableData = res.results;
         this.length = res.totalRecords
         const Columns = this.approvalMatrixColums.columns;
         for (let i = 0; i <= Columns.length; i++) {
           this.tableData.map(data => {
             data[this.displayedColumns[i]] = data[Columns[i]];
           });
         }
       }
     });
   }

  updateFilters() {
    if (this.commonService.userPreference?.hasOwnProperty('taskFilter')) {
      let preferenceData = this.commonService.userPreference.taskFilter.value;
      preferenceData = JSON.parse(preferenceData)
      const status = this.allTaskFilter.find(f => f.id === 'status');
      const context = this.allTaskFilter.find(f => f.id === 'context');
      const activity = this.allTaskFilter.find(f => f.id === 'category');
      const routineActivity = this.routinTaskFilter.find(f => f.id === 'category');
      const routineContext = this.routinTaskFilter.find(f => f.id === 'context');
      const routineStatus = this.allTaskFilter.find(f => f.id === 'routineStatus');
      const routine = this.routinTaskFilter.find(f => f.id === 'routine');
      const taskdepartmentContext = this.allTaskFilter.find(f =>f.id === 'department');
      const taskMydepartments = this.allTaskFilter.find(f =>f.id === 'my department');
      const routinedepartmentContext = this.routinTaskFilter.find(f =>f.id === 'department');
      const routineMydepartments = this.routinTaskFilter.find(f =>f.id === 'my department');
      const routineTaskContext  = this.routinTaskFilter.find(f =>f.id === 'task');
      const taskContext = this.allTaskFilter.find(f =>f.id === 'task');
      const departmentContext = preferenceData?.departmentContext || ['myDepartment'];
      this.departmentSelection = departmentContext|| ['myDepartment'];
      const departmentIds = preferenceData?.departmentIds || this.departmentId;
      const taskSelectedcontext = preferenceData?.myTaskContext || this.myTask;
      const jobChipFilter = preferenceData?.jobFilter || this.selectedJobChip;
      this.selectedJobChip = jobChipFilter || ['RT-RO'];
      this.myTask = taskSelectedcontext;
      this.setDepartment(departmentIds);
      this.setDataPreferene(status, context, routineContext,activity,routineActivity,activity,routineActivity, preferenceData);
      this.setRoutineDataPreferene(routine, routineStatus, routineTaskContext, taskContext, taskSelectedcontext,preferenceData);
      this.setDeptDataPreferene(departmentContext, taskdepartmentContext, routinedepartmentContext, taskMydepartments, routineMydepartments, preferenceData);

      this.selectedStatus = preferenceData.status ?? [];
      this.selectedContext = preferenceData.context ?? null;
      this.selectedRoutineType = preferenceData.routine ?? [];
      this.selectedRoutineStatus = preferenceData.routineStatus ?? [];
      this.activityCategory  = preferenceData?.activityCategory??this.activityCategory;
      setTimeout(() => {
        this.getTaskDetails(false);
        this.getTaskCount();
        this.onLoad = false;
      }, 200)
    } else {
      this.getTaskDetails(false);
      this.getTaskCount();
      this.onLoad = false;
    }
  }

  setDataPreferene(status, context, routineContext, activityCategory,routineActivityCategory,taskActivityType, routineTaskActivityType,preferenceData) {
    if (status) {
      status.defaultSelected = preferenceData.status || ['RQ-CA', 'RQ-CO', 'RQ-CR', 'RQ-IP']; 
    }
    if (context) {
      context.defaultSelected = preferenceData.context === null ? ['All'] : [preferenceData.context];
      routineContext.defaultSelected = preferenceData.context === null ? ['All'] : [preferenceData.context];
    }

    if(activityCategory){
      activityCategory.defaultSelected = preferenceData?.activityCategory ?? []
      routineActivityCategory.defaultSelected = preferenceData?.activityCategory ?? []
    }

    if(taskActivityType){
      taskActivityType.defaultSelected = preferenceData?.taskActivityType?? []
      routineTaskActivityType.defaultSelected = preferenceData?.taskActivityType ?? []
    }
  }
  setRoutineDataPreferene(routine, routineStatus, routineTaskContext, taskContext, taskSelectedcontext, preferenceData) {
    if (routine) {
      routine.defaultSelected = preferenceData.routine
    }
    if (routineStatus) {
      routineStatus.defaultSelected = preferenceData.routineStatus ||['RQ-CA', 'RQ-CO', 'RQ-CR', 'RQ-IP','RQ-SH'];
    }
    if (routineTaskContext && taskSelectedcontext) {
      routineTaskContext.defaultSelected = ['myRequest'];
    }
    if (taskContext && taskSelectedcontext) {
      taskContext.defaultSelected = ['myRequest'];
    }
  }
  setDeptDataPreferene(departmentContext, taskdepartmentContext, routinedepartmentContext, taskMydepartments, routineMydepartments, preferenceData) {
    if(departmentContext){
      taskdepartmentContext.defaultSelected = preferenceData.departmentContext;
      routinedepartmentContext.defaultSelected = preferenceData.departmentContext;
    } else {
      taskdepartmentContext.defaultSelected = ['myDepartment'];
      routinedepartmentContext.defaultSelected = ['myDepartment'];
    }
    if(this.departmentId && departmentContext[0] != 'myDepartment'){
      taskMydepartments.defaultSelected = this.departmentId;
      routineMydepartments.defaultSelected = this.departmentId
    }
  }
  filterDataDetection (){
    const myJobChipFilter =this.allTaskFilter.find(f => f.id === 'jobChipFilter');
    const taskMydepartments = this.allTaskFilter.find(f =>f.id === 'my department');
    const taskdepartmentContext = this.allTaskFilter.find(f =>f.id === 'department');
    const status = this.allTaskFilter.find(f => f.id === 'status');
    const context = this.allTaskFilter.find(f => f.id === 'context');
    const activity = this.allTaskFilter.find(f => f.id === 'category');
    const taskContext = this.allTaskFilter.find(f =>f.id === 'task');
    if(taskMydepartments){
      taskMydepartments.defaultSelected = this.myDepartment;
    }
    if(taskdepartmentContext){
      taskdepartmentContext.defaultSelected = this.departmentSelection;
    }
    if (status){
      status.defaultSelected = this.selectedStatus; 
    }
    if (context){
      context.defaultSelected = this.selectedContext === null ? ['All'] : [this.selectedContext];;
    }

    if(activity){
      activity.defaultSelected = [this.activityCategory];
    }

    if(taskContext){
      taskContext.defaultSelected = this.myTask;
    }

    if(myJobChipFilter){
      myJobChipFilter.defaultSelected = this.selectedJobChip;
    }

    this.groupFilter = [...this.allTaskFilter];
  }
  setDepartment(departmentIds) {
    this.departmentId = departmentIds;
    if(this.departmentSelection[0]  === 'myDepartment'){
      this.departmentId = departmentIds ;
    } else {
      this.departmentId = null;
    }
  }
   getTaskCount() {
    let type = this.selectedTabName === 'My Job' ? null : this.selectedTask;
    this.commonService.getTaskCount(this.selectedDate, this.myTask, type, this.departmentId).subscribe(res => {
      if (res.statusCode === 1) {
         this.allCounts = res.results;
         const jobMapping = {
            'RT-JO': 'myJob',
            'RT-RO': 'myRole',
            'RT-DT': 'myDepartment'
         };
        if (this.selectedTabName === 'My Job') {
          this.jobFilters = this.jobFilters.map(filter => ({
            ...filter,
            count: res.results[jobMapping[filter.code]] ?? filter.count
          }));
          this.chipFilter = this.jobFilters;
          const orderedKeys = ['allJobs','myJob', 'myDepartment', 'myRole'];
          let orderedValues = orderedKeys.map(key => res.results[key]);
          this.countInfo = {
            label: ['All Jobs','My Job', 'My Department', 'My Role'],
            values: orderedValues
          }
        } else {
          const orderedKeys = ['allTask', 'opened', 'completed', 'cancelled'];
          let orderedValues = orderedKeys.map(key => res.results[key]);
          this.countInfo = {
            label: ['All Task', 'Today Task', 'Completed', 'Cancelled'],
            values: orderedValues
          }
        }
      }
   });
   }
 
   setEventColumn() {
    this.selectedJobChip = this.chipSelectedFilter;
    const hasRole = this.chipSelectedFilter?.includes('RT-RO');
    const hasDepartment = this.chipSelectedFilter?.includes('RT-DT');
    const hasJob = this.chipSelectedFilter?.includes('RT-JO');
    if (hasRole && !hasDepartment && !hasJob) {// RT-RO only
      this.isMyRole = true;
      this.isMyDepartment = false;
      this.isAllJobChipFilterSelected = false;
    } else if (!hasRole && hasDepartment && !hasJob) {// RT-DT only
      this.isMyRole = false;
      this.isMyDepartment = true;
      this.isAllJobChipFilterSelected = false;
    } else if (!hasRole && !hasDepartment && hasJob) {// RT-JO only
      this.isMyRole = false;
      this.isMyDepartment = false;
      this.isAllJobChipFilterSelected = false;
    } else if (hasRole && hasDepartment && hasJob) { // when all is selected
      this.isMyRole = false;
      this.isMyDepartment = false;
      this.isAllJobChipFilterSelected = true;
    } else if ((hasRole && hasDepartment && !hasJob) ||(hasRole && !hasDepartment && hasJob) ||(!hasRole && hasDepartment && hasJob)) { // any 2 filters selected
      this.isMyRole = hasRole;
      this.isMyDepartment = hasDepartment;
      this.isAllJobChipFilterSelected = false
    } else {
      this.isMyRole = false;
      this.isMyDepartment = false;
      this.isAllJobChipFilterSelected = false;
    }
    this.eventColumn = this.jobColumns?.eventColumn;
   }
   refreshPage(isAutoRefresh?) {
     if(isAutoRefresh){
      this.applyFilterValue = null;
     }
     if (this.selectedTabName === 'Routine') {
      this.showActions = this.showActions3
     } else {
      this.showActions = this.showActions1
     }
     if(this.selectedTabName === 'My Job'){
      this.setEventColumn();
     } else {
       if (this.selectedTabName !== 'Approval Matrix') {
         if (this.selectedTask === 'RQT-ROU') {
           this.getRoutineTaskFilter();
         } else {
           this.getAllTaskFilter();
         }
        }
     }
     if (this.selectedTabName === 'Approval Matrix') {
       this.displayDate = false;
       this.getApprovalMatrixData();
     } else {
       this.displayDate = true;
       this.getTaskDetails(false);
       this.getTaskCount();
     }
   }

   getRoutineTaskFilter() {
    const routineStatus = this.routinTaskFilter.find(f => f.id === 'routineStatus');
    const routineContext = this.routinTaskFilter.find(f => f.id === 'context');
    const routineDepartment = this.routinTaskFilter.find(f => f.id === 'department');
    const routineDepartmentContext = this.routinTaskFilter.find( f=>f.id === 'my department');
    const routineTaskContext = this.routinTaskFilter.find( f=>f.id === 'task');
    const category = this.routinTaskFilter.find(f=>f.id === 'category');
    if(routineStatus){
      routineStatus.defaultSelected = this.selectedRoutineStatus;
    }
    if(routineContext){
      routineContext.defaultSelected = this.selectedContext === null ? ['All'] : [this.selectedContext];
    }
    if(routineDepartment){
      routineDepartment.defaultSelected = this.departmentSelection;
    }
    if (this.departmentSelection.includes('myDepartment')) {
      if (this.departmentId != null) {
        routineDepartmentContext.defaultSelected = this.departmentId;
      } else {
        routineDepartmentContext.defaultSelected = routineDepartmentContext.subFilters.map(item => item.code);
        this.departmentId = routineDepartmentContext.defaultSelected;
      }
    }
    if(routineTaskContext && this.myTask){
      routineTaskContext.defaultSelected = ['myRequest'];
    }
    if(category){
      category.defaultSelected =this.activityCategory;
    }
    this.groupFilter = this.routinTaskFilter;
    //this.selectedTask = this.chipSelectedFilter;
   }
 
   getAllTaskFilter() {
    const context = this.allTaskFilter.find(f => f.id === 'context')
    const taskDepartment = this.allTaskFilter.find(f => f.id === 'department');
    const taskDepartmentContext = this.allTaskFilter.find(f => f.id === 'my department');
    const taskcontext = this.allTaskFilter.find( f=>f.id === 'task');
    const category = this.allTaskFilter.find(f=>f.id === 'category');
    if(taskDepartment){
      taskDepartment.defaultSelected = this.departmentSelection;
    }
    if (this.departmentSelection.includes('myDepartment')) {
      if (this.departmentId != null) {
        taskDepartmentContext.defaultSelected = this.departmentId;
      } else {
        taskDepartmentContext.defaultSelected = taskDepartmentContext.subFilters.map(item => item.code);
        this.departmentId = taskDepartmentContext.defaultSelected;
      }
    }
    if(context){
      context.defaultSelected = this.selectedContext === null ? ['All'] : [this.selectedContext];
    }
    if(taskcontext && this.myTask){
      taskcontext.defaultSelected  = ['myRequest'];
    }
    if(category){
      category.defaultSelected =this.activityCategory
    }
    this.groupFilter = this.allTaskFilter;
    // this.selectedTask = this.chipSelectedFilter;
  }
 
   headerEventAction(event) {
     if (event.key === 'applyFilter') {
       this.applyFilter(event.data);
     } else if (event.data === 'WD_TA_TKT') {
       this. createTask('');
     } else if (event.key === 'manageAction' && event.data !='WD_TA_TASK') {
       this.manageAction(event.data, event.keyVal);
     } else if (event.key === 'dateFilter') {
       this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      //  this.getTaskCount()
       this.refreshPage()
     } else if (event.key === 'toDateFilter') {
        this.selectedToDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
        // this.getTaskCount()
        this.refreshPage()
     } else if (event.key === 'dateClear') {
       this.selectedDate = ""
       this.refreshPage()
     } else if (event.key === 'groupFilter') {
       if (this.selectedTabName === 'Approval Matrix') {
         this.manageAppFilterData(event);
       } else {
         this.manageGroupFilter(event);
       }
     } else if(event.key === 'multiDate') {
        this.manageMultiDate(event);
     } else if(event.key === 'downloadExcel') {
        this.downloadExcel();
     } else if(event.data ==='WD_TA_TASK'){
        this.createTask('',null,'','TAC-TASK')
     } else{
       this.selectedName = null;
       this.applyFilterValue = null;
       this.refreshPage(true);
     }
   }
   manageMultiDate(event) {
    if(!event.data){
      this.selectedToDate = this.selectedDate;
    } else {
      this.selectedToDate = null;
      this.selectedDate =  this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    }
    this.refreshPage();
   }
   manageGroupFilter(event) {
    let mytaskStatus = event.data.filter(filter => filter.id === "status").map(code => code.data);
    let contextList = event.data.filter(filter => filter.id === "context");
    let routineList = event.data.filter(filter => filter.id === 'routine').map(code => code.data);
    let routineStatusList = event.data.filter(filter => filter.id === 'routineStatus').map(code => code.data);
    let Department = event.data.filter(filter => filter.id === 'department');
    this.departmentSelection =Department.map(item=>item.data);
    let myDepartment = event.data.filter(filter => filter.id === 'my department');
    myDepartment = myDepartment.map(item=>item.data);   
    let assignTask = event.data.filter(filter=>filter.id === 'task')?.length ? true : null;
    let activityCategory = event.data.filter(f => f.id === 'category').map(f => f.data);
    let myJobChipFilter = event.data.filter(f => f.id === 'jobChipFilter');
    if(this.selectedTask !== 'RQT-ROU') {
      this.nonRoutineTask(mytaskStatus, contextList, myDepartment, assignTask,activityCategory,myJobChipFilter);
    } else {
      this.routineTask(routineList, routineStatusList, contextList, myDepartment, assignTask,activityCategory);
    }
    this.saveAssetPreference();
    this.refreshPage();
   }

   manageAppFilterData(event) {
     let requestType = event.data.filter(filter => filter.id === 'requestType').map(code => code.data);
     let requestStatus = event.data.filter(filter => filter.id === 'requestStatus').map(code => code.data);
     let selectedView = event.data?.filter(filter => filter.id === 'view')?.map(code => code.data);
     this.requestTypeIds = requestType;
     this.requestStatusIds = requestStatus;
     this.viewApproval = selectedView[0];
     this.saveAssetPreference('approval-matrix');
     this.getApprovalMatrixData();
   }

   nonRoutineTask(mytaskStatus, contextList, myDepartment, assignTask,activityCategory,jobChip) {
    this.selectedStatus = mytaskStatus.length ? mytaskStatus : [];
    this.selectedContext = contextList.length && contextList[0].data === 'All' ? null : contextList[0].data;
    this.myDepartment = myDepartment.length && this.departmentSelection?.[0] === 'myDepartment' ? myDepartment : null;
    this.departmentId = this.myDepartment;
    this.myTask = assignTask;
    this.activityCategory = activityCategory;
    this.selectedJobChip = jobChip?.length > 0 ? jobChip?.map(j => j.data) : this.selectedJobChip ?? ['RT-RO'];
    this.chipSelectedFilter = jobChip?.length > 0 ? jobChip?.map(j => j.data) : this.chipSelectedFilter ?? ['RT-RO'];
   }
   routineTask(routineList, routineStatusList, contextList, myDepartment, assignTask,activityCategory) {
      this.selectedContext = contextList.length && contextList[0].data === 'All' ? null : contextList[0].data;
      this.selectedRoutineStatus = routineStatusList.length ? routineStatusList : [];
      this.selectedRoutineType = routineList.length ? routineList : [];
      this.myDepartment = myDepartment.length && this.departmentSelection?.[0] === 'myDepartment' ? myDepartment : null;
      this.departmentId =this.myDepartment;
      this.myTask =assignTask;
      this.activityCategory = activityCategory;
      this.chipSelectedFilter = this.selectedJobChip;
      this.selectedJobChip = this.selectedJobChip;
    }
    toSentenceCase(str: string): string {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
   eventAction(event) {
     if (event.key === 'Assigned To') {
       const data = event.data;
       if(['RQ-CR', 'RQ-PEN', 'RQ-SH','RQ-OP'].includes(event.data.statusId)) {
        data['launchType'] = "isTask"
        if (this.isMyRole || this.isMyDepartment || this.isAllJobChipFilterSelected) {
          data['isAssignMe'] = true;
        } else {
          data['isAssignMe'] = false;
        }
        data['selectedTabIndex'] = this.selectedTabIndex;
        data['page'] = 'task';
        const dialogRef = this.dialog.open(AssignTaskComponent, {
          data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.refreshPage();
        });
       } else {
        this.toastr.warning('Warning', this.toSentenceCase('User assignment is not permitted because the request is ' + event.data.statusName));
       }
     } else if (event.key == 'Status' || event.key == 'View') {
       this.getTaskHistory(event.data);
     } else if (event.key == 'Complete') {
        if(this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true){
          if(event.data?.activityCategoryId ==='AC-QCAP' || event.data?.activityCategoryId === 'AC-REAP'){
            this.navigateToTransfer(event.data);
            return
          }
          if(event.data?.activityCategoryId =='AC-GEXP'|| event.data?.activityCategoryId =='AC-GPENP'){
            this.navigateToGatepass(event.data);
            return
          }
        }
       const completeData = {
         "comments": event.data.description, "type": "RQT-TASK",
         "status": 'RQ-CO', "userType": event.data.performerType
       }
       const dialogRef = this.dialog.open(ConfirmationDialog, {
         panelClass: ['mdm-Confirmation-popup'], disableClose: true,
         data: {
           title: 'Complete Task', message: 'Do you want to complete the task ?',
           buttonText: { ok: 'Yes', cancel: 'No' },
           'completeTask': true, 'requestId': event.data.requestId, 'completeData': completeData
         }
       });
       dialogRef.afterClosed().subscribe(result => {
         if (result == 'confirm') {
           this.PushNotificationsService.triggerNotificationRefresh();
         }
         this.selectedName = null;
         this.refreshPage();
       });
     } else if (event.key == 'Cancel') {
        if(this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true){
          if(event.data?.activityCategoryId ==='AC-QCAP' || event.data?.activityCategoryId === 'AC-REAP'){
            this.navigateToTransfer(event.data);
            return
          }
          if(event.data?.activityCategoryId =='AC-GEXP'|| event.data?.activityCategoryId =='AC-GPENP'){
            this.navigateToGatepass(event.data);
            return
          }
        }
       const deleteData = {
         "comments": event.data.description, "type": event.data.requestTypeId,
         "status": 'RQ-CA', "userType": event.data.performerType
       }
       const dialogRef = this.dialog.open(ConfirmationDialog, {
         panelClass: ['mdm-Confirmation-popup'], disableClose: true,
         data: {
           title: 'Cancel Task', message: 'Do you want to cancel the task ?',
           buttonText: { ok: 'Yes', cancel: 'No' },
           'deleteTask': true, 'requestId': event.data.requestId, 'deleteData': deleteData
         }
       });
       dialogRef.afterClosed().subscribe(result => {
         if (result == 'confirm') {
           this.PushNotificationsService.triggerNotificationRefresh();
         }
         this.selectedName = null;
         this.refreshPage();
       });
     } else if (event.key == 'InProgress') {
       const deleteData = {
         "comments": event.data.description, "type": "RQT-TASK",
         "status": 'RQ-IP', "userType": event.data.performerType
       }
       const dialogRef = this.dialog.open(ConfirmationDialog, {
         panelClass: ['mdm-Confirmation-popup'], disableClose: true,
         data: {
           title: 'Manage Task', message: 'Do you want to inprogress the task ?',
           buttonText: { ok: 'Yes', cancel: 'No' },
           'deleteTask': true, 'requestId': event.data.requestId, 'deleteData': deleteData
         }
       });
       dialogRef.afterClosed().subscribe(result => {
         if (result == 'confirm') {
           this.PushNotificationsService.triggerNotificationRefresh();
         }
         this.selectedName = null;
         this.refreshPage();
       });
     } else if (event.key == 'Open' || event.key == 'Close' || event.key =='ReOpen') {
       const deleteData = {
         "comments": event.data.description,
         "status":event.key == 'Open'? 'RQ-OP': event.key == 'ReOpen'? 'RQ-ROP':'RQ-CL',
         "acknowledgedById" : event?.data?.acknowledgedById ?? this.loginUserId ? Number(this.loginUserId) : null,
       }
       if (event.key === 'ReOpen' && this.activate_btn.includes('BT_TMOP')) {
          deleteData['resourceCode'] = 'BT_TMOP';
        }
       const dialogRef = this.dialog.open(ConfirmationDialog, {
         panelClass: ['mdm-Confirmation-popup'], disableClose: true,
         data: {
           title: 'Manage Ticket', message:event.key ==='Open'? 'Do you want to Open the ticket?' : event.key == 'ReOpen'? 'Do you want to ReOpen the ticket?':'Do you want to Close the ticket?' ,
           buttonText: { ok: 'Yes', cancel: 'No' },
           'deleteTask': true, 'requestId': event.data.requestId, 'deleteData': deleteData
         }
       });
       dialogRef.afterClosed().subscribe(result => {
         if (result == 'confirm') {
           this.PushNotificationsService.triggerNotificationRefresh();
         }
         this.selectedName = null;
         this.refreshPage();
       });
     } else if (event.key === 'pagination') {
       this.pageSize = event.data.pageSize;
       this.pageStart = event.data.pageIndex;
       if (this.selectedTabName === 'Approval Matrix') {
        this.displayDate = false;
        this.getApprovalMatrixData();
       } else {
        this.displayDate = true;
        this.getTaskDetails(false);
       }
     } else if (event.key === 'Identifier') {
       this.createTask('modify', event.data,'',event?.data?.routineTypeId)
     } else if (event.key === 'Parent ID') {
      if(event?.data?.parentId != null){
        event.data['requestId'] = event.data.parentId;
        this.createTask('modify', event.data,'RQT-TASK',event?.data?.routineTypeId)
      }
     } else if (event.key === 'Context') {
      this.manageEntity(event.data)
     } else if(event.key === 'Action'){
      let data = event.data;
      data['selectedTab']=event?.patientId ? event.patientId: null;
      this.createTask('modify', data,'',data?.routineTypeId)
     } else if(event.key === 'Report'){
      this.getReportLayout(event.data);
     } else if (event.key === 'Reference') {
      this.createApprovalInfo(event?.data);
     } else if (event.key === 'Asset Name'){
      this.manageAsset(event.data);
     } else if(event.key === 'Approve' || event.key === 'Reject'){
      this.manageApproval(event.key,event.data);
     }
   }
   selectTaskType(value) {
     this.chipSelectedFilter = value.code;
     this.selectedJobChip = value.code;
     this.selectedJobCount = value.count;
     this.filterDataDetection();
     this.refreshPage();
   }

   saveAssetPreference(key?: any){
    if (key === 'approval-matrix') {
      let appPreferenceData = {}
      appPreferenceData = {
      "requestType": this.requestTypeIds,
      "requestStatus": this.requestStatusIds,
      "view": this.viewApproval
    };
    let lastData = JSON.stringify(appPreferenceData)
    this.commonService.validateUserPreference('approvalMatrix', lastData)
    } else {
      let preferenceData = {};
      preferenceData = {
      "status": this.selectedStatus,
      "context": this.selectedContext,
      "routine": this.selectedRoutineType,
      "routineStatus": this.selectedRoutineStatus,
      "departmentIds":this.departmentId,
      "departmentContext":this.departmentSelection,
      'myTaskContext': this.myTask,
      'activityCategory':this.activityCategory,
      "taskTabs": this.selectedTab,
      "jobFilter": this.selectedJobChip
    };
    let lastData = JSON.stringify(preferenceData)
    this.commonService.validateUserPreference('taskFilter', lastData)
    }
  }
   manageTicket(row) {
    let formTemplateType = row['requestCategoryId']=='PR-LC'?'FTT-LOC':'FTT-AT'
    let data = { "id": null, "requestId":row['identifyingId'], "nonPerformerId" :row['contextId'], "data": null, "entityDetail" : row,"type":'modify','formTemplateType':formTemplateType,'contextType':row['requestCategoryId']};
    const dialogRef = this.dialog.open(TaskManagmentComponent, { 
      data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
   }

   manageAction(value, data) {
     if (value === 'WD_AL_PS') {
       this.stickerView()
     }else if(value ==='WD_TA_TASK'){
        this.createTask('',null,'','TAC-TASK')
     }
   }

   createApprovalInfo(data) {
    const requestId  = data?.requestId ?? parseInt(data.requestIdentifier.replace(/\D/g, ''), 10)
    this.workflowService.getTaskById(requestId).subscribe(res => {
      if (res.statusCode === 1) {
        const requestData = res.results[0];
        this.createTask('modify', requestData, '', requestData?.routineTypeId);
      }
    })
   }
 
   createTask(key, data?: any, keyValue?: any, routineTypeId?:any) {
     if(key === 'modify') {
      if(this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true){
        if((data?.activityCategoryId ==='AC-QCAP' || data?.activityCategoryId === 'AC-REAP') && !keyValue ){
          this.navigateToTransfer(data);
          return
        }
        if((data?.activityCategoryId =='AC-GEXP'|| data?.activityCategoryId =='AC-GPENP')&& !keyValue ){
          this.navigateToGatepass(data);
          return
        }
      }
      data['type'] = key;
      data['permissionTab'] = ['Task List'];
      data['requestedType'] = keyValue ? keyValue : this.selectedTask;
      data['routineTypeId']= routineTypeId;
      this.taskData = data;
     } else {
      const data = {'requestedType':'RQT-TASK'};
      data['routineTypeId']= routineTypeId;
      this.taskData = data;
    }
   const dialogRef = this.dialog.open(TaskManagmentComponent,
      {data: this.taskData, panelClass: ['large-popup'], disableClose: true });
     dialogRef.afterClosed().subscribe(result => {
       this.refreshPage();
       this.selectDropdown = null;
       this.selectedName = null;
     });
   }

   stickerView(){
     const dialogRef = this.dialog.open(PrintStickerComponent,
      { data: null, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.selectedName = null;
    });
  }
 
   getTaskHistory(data) {
    const dialogRef = this.dialog.open(EventStatusTrackingComponent, {
       data: data,
       panelClass: ['medium-popup'],
       disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.selectedName = null;
    });
   }

  manageAsset(data) {
    this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
      next: (res) => {
        if (res.results && res.results.length > 0) {
          this.rowData = res.results[0];
          const dialogRef = this.dialog.open(CreateAssetComponent, {
            data: this.rowData,
            panelClass: ['large-popup'],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe(() => {
            this.refreshPage();
            this.selectDropdown = null;
            this.selectedName = null;
          });
        } else {
          this.toastr.warning('Warning', 'No Data Found');
        }
      }
    })
  }

  manageApproval(key,data){
    // console.log(data)
    data['type'] = key;
    data['approval'] = true;
    let message = key === 'Approve' ? 'Are you sure you want to Approve?' : 'Are you sure you want to Reject?';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        ...data,
        title: 'Confirmation',
        message: message,
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 0,
      }
    })
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'No' || !result) { this.loading = false; this.refreshPage(); this.selectDropdown = null; this.selectedName = null; return; }
      this.loading = true;
      const isApprove = data.type === 'Approve';
      const isRejectAction = data.type === 'Reject';
      const rejectMapping = data?.options?.status?.['RQ-RJ'];
      let statusId = data?.requestStatus ?? null;
      let selectedWorkflow = null;
      if (isRejectAction && rejectMapping) {
        statusId = rejectMapping?.entityStatus;
        selectedWorkflow = rejectMapping.level != null ? Number(rejectMapping.level) : null;
      }
      if (isApprove) {
        selectedWorkflow = data.currentApproverLevel != null ? Number(data.currentApproverLevel) : null;
      }
      const levelComments = data?.approvalComments || '';
      const formComments = result?.comments ||'';
      const remarks = [levelComments?.trim(), formComments?.trim()].filter(Boolean).join(' - ');
      const createTask: any = {
        ticketId: data.requestId,
        status: isApprove ? data?.requestStatus : statusId,
        remarks: remarks,
        workflowLevelId: isApprove ? (data.currentApproverLevel != null ? Number(data.currentApproverLevel) : null) : selectedWorkflow || null,
        approval: {
          statusId: isApprove ? data?.requestStatus: statusId,
          id: data.entityWorkflowId,
          identifyingType: 'RT-US',
          identifyingId: this.loginUserId,
          comments: data?.approvalComments ?? null,
        }
      }
      this.commonService.editTask(data.requestId, createTask).pipe(
        finalize(() => {
          this.loading = false;
          this.refreshPage();
          this.selectDropdown = null;
          this.selectedName = null;
        })
      ).subscribe({
        next: (res) => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
          }
        },
        error: (error) => {
          this.toastr.error('Error', `${error.error?.message}`);
        }
      })
    })
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.isExcel = true;
    this.selectedTabIndex = tabChangeEvent.index;
    this.selectedTabName = tabChangeEvent['tab']['textLabel'];
    this.tabPermission = null;
    this.tableData = [];
    setTimeout(() => {
      this.displayDate = this.selectedTabName !== 'Approval Matrix';
      if (this.selectedTabName === 'Routine') {
        this.tabPermission = 'BT_TK_ROU';
        if (this.taskRoutineConfig === null) {
          this.getDynamicTableColumn();
        } else {
          this.getTabBasedTaskDetails(this.taskRoutineConfig);
        }
      } else if (this.selectedTabName === 'Work Order') {
        this.tabPermission = 'BT_TA_WK';
        if (this.taskWorkOrderConfig === null) {
          this.getDynamicTableColumn();
        } else {
          this.getTabBasedTaskDetails(this.taskWorkOrderConfig);
        }
      } else if (this.selectedTabName === 'Ticket') {
        this.tabPermission = 'BT_TK_TKT';
        if (this.ticketConfig === null) {
          this.getDynamicTableColumn();
        } else {
          this.getTabBasedTaskDetails(this.ticketConfig);
        }
      } else if (this.selectedTabName === 'My Job') {
        this.tabPermission = 'BT_TA_JOB';
        if(this.jobColumns === null){
          this.getDynamicTableColumn();
        }else{
        this.showActions = this.showActions1
        this.chipSelectedFilter = this.isAllJobChipFilterSelected ? ['RT-JO','RT-DT','RT-RO'] : this.selectedJobChip;
        this.displayedColumns = this.jobColumns?.displayedColumns;
        const dateTimeColumns =this.jobColumns?.dateTimeColumns
        if(dateTimeColumns){this.dateTimeColumns = dateTimeColumns;}
        this.iconColumn = this.jobColumns?.iconColumn;
        this.eventColumn = this.jobColumns?.eventColumn;
        this.sortColumn = this.jobColumns?.sortColumn;
        this.iconHeader = this.jobColumns?.iconHeader;
        this.responseColumns = this.jobColumns?.columns;
        this.myJobChipFilter['defaultSelected'] = this.isAllJobChipFilterSelected ? ['RT-JO','RT-DT','RT-RO'] :this.selectedJobChip;
        this.allTaskFilter =  this.allTaskFilter.some(f => f.id === 'jobChipFilter') ? this.allTaskFilter :[this.myJobChipFilter,...this.allTaskFilter];
        this.groupFilter = this.allTaskFilter;
        if (this.taskColumns?.excel) {
          this.excelDisplayedColumns = this.taskColumns?.excel?.displayedColumns;
          this.excelResponseColumns = this.taskColumns?.excel?.columns;
        } else {
          this.excelDisplayedColumns = this.taskColumns?.displayedColumns;
          this.excelResponseColumns = this.taskColumns?.columns;
        }
        this.setEventColumn();
      }
        this.getTaskDetails();
        this.getTaskCount();
      } else if (this.selectedTabName === 'Approval Matrix') {
        this.displayDate = false;
        this.groupFilter = [];
        this.getApprovalFilter();
        this.checkAppUserPreference();
        this.isExcel = false;
        if (this.approvalMatrixColums === null){
          this.getDynamicTableColumn();
        } else {
         this.getTabBasedTaskDetails(this.approvalMatrixColums);
        }
      }
      this.selectedTab = {
        'tabPermission': this.tabPermission,
        'tabIndex': this.selectedTabIndex,
        'tabName': this.selectedTabName
      }
    }, 0)
  }

   checkAppUserPreference() {
     if (this.commonService.userPreference?.hasOwnProperty('approvalMatrix')) {
       let preferenceData = this.commonService?.userPreference?.approvalMatrix.value;
       preferenceData = JSON.parse(preferenceData)
       const viewFilter = this.approvalFilter.find(f => f.id === 'view');
       const requestType = this.approvalFilter.find(f => f.id === 'requestType');
       const requestStatus = this.approvalFilter.find(f => f.id === 'requestStatus');
       this.viewApproval = preferenceData.view ?? 'myApproval';
       this.requestTypeIds = preferenceData.requestType ?? null;
       this.requestStatusIds = preferenceData.requestStatus ?? null;
       if (requestType) {
         requestType.defaultSelected = preferenceData.requestType;
       }
       if (requestStatus) {
         requestStatus.defaultSelected = preferenceData.requestStatus;
       }
       if(viewFilter) {
         viewFilter.defaultSelected = preferenceData.view ?? 'myApproval';
       }
     } else {
       this.commonService.validateUserPreference('approvalMatrix');
     }
   }

   getApprovalFilter() {
      const viewFilter = this.approvalFilter.find(f => f.id === 'view');
      if (viewFilter && this.activate_btn.includes('BT_APMVALL')&& !viewFilter.subFilters.some(s => s.code === 'BT_APMVALL')) {
        viewFilter.subFilters.push({ code: 'BT_APMVALL', value: 'All' });
      }
     this.commonService.getAppTerms('RequestStatus,RequestType').subscribe(res => {
       const requestStatusList = res.results.filter(res => res.groupName === 'RequestStatus' && res.code === 'RQ-PEN' || res.code === 'RQ-RJ' || res.code === 'RQ-AR');
       const requestStatus = this.approvalFilter.find(f => f.id === 'requestStatus');
       if (requestStatus) {
         requestStatus.subFilters = requestStatusList.map(({ code, value }) => ({ code, value }));
       }
       const requstTypelList = res.results.filter(res => res.groupName === 'RequestType' && res.code === 'RQT-TASK' || res.code === 'RQT-TKT' || res.code === 'RQT-WRK');
       const requestType = this.approvalFilter.find(f => f.id === 'requestType');
       if (requestType) {
         requestType.subFilters = requstTypelList.map(({ code, value }) => ({ code, value }));
       }
       this.groupFilter = [...this.approvalFilter];
     });
   }

  getTabBasedTaskDetails(columns) {
    this.displayedColumns = columns?.displayedColumns;
    const dateTimeColumns = columns?.dateTimeColumns;
    if(dateTimeColumns){this.dateTimeColumns = dateTimeColumns;}
    this.iconColumn = columns?.iconColumn;
    this.eventColumn = columns?.eventColumn;
    this.sortColumn = columns?.sortColumn;
    this.iconHeader = columns?.iconHeader;
    this.responseColumns = columns?.columns;
    if(columns?.excel) {
      this.excelDisplayedColumns = columns?.excel?.displayedColumns;
      this.excelResponseColumns = columns?.excel?.columns;
    } else {
      this.excelDisplayedColumns = columns?.displayedColumns;
      this.excelResponseColumns = columns?.columns;
    }
    this.isMyRole = false;
    this.isMyDepartment = false;
    if (this.selectedTabName === 'Routine') {
      this.displayDate = true;
      this.allTaskFilter = this.allTaskFilter.filter(f => f.id !== 'jobChipFilter');
      this.loadContextSubFilter(this.routinTaskFilter);
      this.groupFilter = this.routinTaskFilter;
    } else if(this.selectedTabName === 'My Job') {
      this.displayDate = true;
      this.tabPermission = 'BT_TA_JOB';
      this.chipSelectedFilter = this.isAllJobChipFilterSelected ? ['RT-JO','RT-DT','RT-RO'] : this.selectedJobChip;
      this.myJobChipFilter.defaultSelected = this.isAllJobChipFilterSelected ? ['RT-JO','RT-DT','RT-RO'] :this.selectedJobChip;
      if (!this.allTaskFilter.some(f => f.id === 'jobChipFilter')) {
        this.allTaskFilter = [this.myJobChipFilter, ...this.allTaskFilter];
      }
      this.loadContextSubFilter(this.allTaskFilter);
      this.groupFilter = this.allTaskFilter;
      this.setEventColumn();
    } else if (this.selectedTabName === 'Approval Matrix') {
      this.displayDate = false;
      this.getApprovalMatrixData();
    } else {
      this.displayDate = true;
      this.allTaskFilter = this.allTaskFilter.filter(f => f.id !== 'jobChipFilter');
      this.loadContextSubFilter(this.allTaskFilter);
      this.groupFilter = this.allTaskFilter;
    }
    this.selectedTask = 'RQT-TASK';
    if (this.selectedTabName === 'Work Order') {
      this.selectedTask = "RQT-WRK"
    } else if (this.selectedTabName === 'Routine') {
      this.selectedTask = "RQT-ROU"
    } else if (this.selectedTabName === 'Ticket') {
      this.selectedTask = "RQT-TASK"
    }
    if (this.selectedTabName === 'Routine') {
      this.showActions = this.showActions3
    } else {
      this.showActions = this.showActions1
    }
    if(!this.onLoad && this.selectedTabName !== 'Approval Matrix'){
      this.getTaskDetails();
      this.getTaskCount();
    }
  }
   getTaskDetails(routerEvent?: boolean, searchText?): void {
     this.loading = true
     let statusIds = null
     let routineIds = null;
     statusIds = this.getStatusId();
     if (this.applyFilterValue === '') {
       this.applyFilterValue = null;
     }
     if(this.routineList.length === this.selectedRoutineType.length){
      routineIds = null;
     } else {
      routineIds = this.selectedRoutineType.length ? this.selectedRoutineType : null;
     }
     if(this.departmentId === 'null'){
      this.departmentId = null;
     }
     if (routerEvent) {
       this.tableData = this.route.snapshot.data.task.results;
       this.length = this.route.snapshot.data.task.totalRecords;
       let Columns = [];
       if (this.responseColumns.length) {
         Columns = this.responseColumns;
       }
       this.loading = false;
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map((data) => {
            if(Columns[i] == 'nonPerformerName') {
              data[this.displayedColumns[i]] = data[Columns[i]] ? data[Columns[i]] : data['title'] ? '*'+data['title'] : data[Columns[i]];
            } else{
              data[this.displayedColumns[i]] = data[Columns[i]];
            }
         });
       }
     } else {
      const name = this.selectedTabName;
       if (name === 'Ticket' || name === 'Routine' || name === 'Work Order') {
         this.getAllTask(statusIds, routineIds);
       } else if(name === 'My Job'){
         this.getAllJobs(statusIds);
       }
     }
   }

   getStatusId() {
    this.allTaskFilter.find(f => f.id === 'status').defaultSelected = this.selectedStatus == null ?['All']: this.selectedStatus;
    this.routinTaskFilter.find(f => f.id === 'routineStatus').defaultSelected = this.selectedRoutineStatus == null ?['All']: this.selectedRoutineStatus;
    if(this.selectedTask !== 'RQT-ROU'){
      if (this.statusList?.length === this.selectedStatus?.length) {
        return null
      } else {
        const statusIds = this.selectedStatus?.length ? this.selectedStatus : null;
        return statusIds;
      }
     } else {
      const list = this.routineStatusList;
      const status = this.selectedRoutineStatus;
      if (list?.length === status?.length) {
        return null
      } else {
        const statusIds = this.selectedRoutineStatus?.length ? this.selectedRoutineStatus : null;
        return statusIds;
      }
     }
   }

   getAllTask(statusIds, routineIds) {
     let activityCategory = this.categoryFilters?.length === this.activityCategory?.length ? null : this.activityCategory;
     this.workflowService.getAllTask(this.selectedToDate, this.selectedDate, this.selectedContext, statusIds, this.departmentId, this.myTask, this.applyFilterValue, this.selectedTask, routineIds, activityCategory, this.pageStart, this.pageSize,).subscribe({
       next: (res) => {
         this.loading = false;

         if (res.statusCode === 1 || res.statusCode === 0) {
           this.length = res.totalRecords;

           const columns = this.responseColumns?.length
             ? this.responseColumns : [];

           this.tableData = res.results.map((row) => {
             const mappedRow = { ...row };

             columns.forEach((col, index) => {
               if (col === 'nonPerformerName') {
                 mappedRow[this.displayedColumns[index]] =
                   row[col] ?? (row.title ? '*' + row.title : null);
               } else {
                 mappedRow[this.displayedColumns[index]] = row[col];
               }
             });

             return mappedRow;
           });
         }
       },
       error: (error) => {
         this.loading = false;
         this.toastr.error('Error', error?.error?.message);
       },
     });
   }

   getAllJobs(statusIds) {
     let activityCategory = this.categoryFilters?.length === this.activityCategory?.length ? null : this.activityCategory;
     this.workflowService.getAllJobs(this.selectedToDate, this.selectedDate, this.selectedContext, statusIds, this.isMyRole, this.isMyDepartment,this.isAllJobChipFilterSelected, this.applyFilterValue, activityCategory, this.pageStart, this.pageSize).subscribe({
       next: (res) => {
         this.loading = false;

         if (res.statusCode === 1 || res.statusCode === 0) {
           this.length = res.totalRecords;

           const columns = this.responseColumns?.length
             ? this.responseColumns : [];

           this.tableData = res.results.map((row) => {
             const mappedRow = { ...row };

             columns.forEach((col, index) => {
               if (col === 'nonPerformerName') {
                 mappedRow[this.displayedColumns[index]] =
                   row[col] ?? (row.title ? '*' + row.title : null);
               } else {
                 mappedRow[this.displayedColumns[index]] = row[col];
               }
             });

             return mappedRow;
           });
         } else {
           this.tableData = res.results;
           this.length = res.totalRecords;
         }
       },
       error: (error) => {
         this.loading = false;
         this.toastr.error('Error', error?.error?.message);
       },
     });
   }
    fixClick() {
      console.log('')
    }  

    manageEntity(data) {
      const type = data?.requestCategoryId;
      const id = data?.nonPerformerId;
      if (!id) return;
      const configMap: Record<string, any> = {
        'PR-AT': {
          component: CreateAssetComponent,
          api: () => this.configurationService.getAllAsset(id),
          panelClass: 'large-popup'
        },
        'PR-LC': {
          component: EditLocationManagementComponent,
          api: () => this.commonService.getLocationById(id),
          panelClass: 'medium-popup'
        }
      };

      const config = configMap[type];
      if (!config) return;
      config.api().subscribe({
        next: (res) => {
          const entityData = res?.results
            ? (Array.isArray(res.results) ? res.results[0] : res.results)
            : null;
          if (!entityData) {
            this.toastr.warning('Warning', 'The Request EntityData is not Available');
            return
          }
          const dialogRef = this.dialog.open(config.component, {
            data: entityData,
            panelClass: [config.panelClass],
            disableClose: true,
          });

          dialogRef.afterClosed().subscribe((result) => {
          });
        },
        error: (err) => {
          console.error('Error fetching entity data:', err);
        }
      });
    }

   downloadExcel() {
     const name = this.selectedTabName;
     let excelData = [];
     let routineIds = null;
     let statusIds = this.getStatusId();
     if (this.applyFilterValue === '') {
       this.applyFilterValue = null;
     }
     if (this.routineList.length === this.selectedRoutineType.length) {
       routineIds = null;
     } else {
       routineIds = this.selectedRoutineType.length ? this.selectedRoutineType : null;
     }
     if (name === 'Ticket' || name === 'Routine' || name === 'Work Order') {
        let activityCategory = this.categoryFilters?.length === this.activityCategory?.length ? null :this.activityCategory;
       this.workflowService.getAllTask(this.selectedToDate, this.selectedDate, this.selectedContext, statusIds, this.departmentId, this.myTask, this.applyFilterValue, this.selectedTask, routineIds,activityCategory, this.pageStart, 2000).subscribe((res) => {
         excelData = res.results;
         this.downloadDynamicExcelData(excelData, name);
       });
     } else if(name ==='My Job') {
       let activityCategory = this.categoryFilters?.length === this.activityCategory?.length ? null :this.activityCategory;
       this.workflowService.getAllJobs(this.selectedToDate, this.selectedDate, this.selectedContext, statusIds, this.isMyRole, this.isMyDepartment,this.isAllJobChipFilterSelected, this.applyFilterValue,activityCategory, this.pageStart, 2000).subscribe((res) => {
         excelData = res.results;
         this.downloadDynamicExcelData(excelData, name);
       });
     }
   }

   downloadDynamicExcelData(excelData, name) {
    const transpose = false;
    const excelColumn = this.excelDisplayedColumns;
    let Columns = [];
    if (this.excelResponseColumns.length) {
      Columns = this.excelResponseColumns;
    }
    for (let i = 0; i <= Columns.length; i++) {
      excelData.map((data) => {
        if (Columns[i] == 'nonPerformerName') {
          data[this.excelDisplayedColumns[i]] = data[Columns[i]] ? data[Columns[i]] : data['title'] ? '*' + data['title'] : data[Columns[i]];
        } else {
          data[this.excelDisplayedColumns[i]] = this.getExcelData(data[Columns[i]]);
        }
      });
    }
    this.excelService.exportAsExcelFile(excelData, name, transpose, this.selectedDate, 'report1', excelColumn);
   }

   getExcelData(data) {
    return data === 'RT-DT' ? 'Department' : data === 'RT-US' ?
      'User' : data === 'RT-RO' ? 'Role' : data === 'PR-AT' ?
      'Asset' : data === 'PR-PA' ? 'Patient' : data === 'PR-LC' ?
      'Location' : data === 'PRL-HG' ? 'P1' : data === 'PRL-MM' ?
      'P2' : data === 'PRL-LW' ? 'P3' : data === 'PRL-NR' ? 'P4' : data;
   }

  navigateToTransfer(data) {
    this.loading = true;
    let categoryAssignedDepartment = data?.departmentIds ??[];
    if(data?.requestCategoryId =='PR-AT' && data?.nonPerformerId && data.statusId =='RQ-CR'){
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({next: (res) => {
          const assetData = res.results[0];
          const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
          const isReturnStatus = returnStatus.includes(assetData.assetTransferTypeId);
          const permission1 = isReturnStatus? this.activate_btn.includes('BT_AM_RAT'): this.activate_btn.includes('BT_AM_AT');
          const permission2 = isReturnStatus? this.activate_btn.includes('BT_AM_RATA'): this.activate_btn.includes('BT_AM_ATA');
          this.commonService.getLatestTransferDetail(assetData.id).subscribe(department => {
            const departmentIds:any = localStorage.getItem(btoa('departmentIds') || '[]');
            const transfer = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
            const isStatus = transfer.includes(assetData.assetTransferTypeId);
            const statusId = department?.results?.eventStatusId ?? null;
            assetData['transferEventStatusId'] = statusId;
            if(statusId ==='ATE-COM' || statusId == null) {
              this.loading = false;
              this.toastr.warning('Warning', 'The Request is Already Completed');
              return
            }
            let userId = Number(localStorage.getItem(btoa('userId')));
            let allowedUserforApproval = (assetData?.ownerId === userId) ||(data?.userId === userId);
            const approved = department?.results?.transferType === "TRT-DEP"? (isStatus || departmentIds.includes(Number(department.results.sourceTransferId))): true;
            const pending = department?.results?.transferType === "TRT-DEP"
                ? (Array.isArray(categoryAssignedDepartment) && categoryAssignedDepartment.length > 0 &&(isStatus || categoryAssignedDepartment.includes(Number(department.results.transferId))) )
                : department?.results?.transferType === "TRT-LOC"? allowedUserforApproval: true;
            const isApprovedStatus = statusId === 'ATE-INI' && approved;
            const isPendingStatus = (statusId === 'ATE-PEN' || statusId ==='ATE-GENP') && pending;
            if (isApprovedStatus || isPendingStatus) {
              const targetStatus = isApprovedStatus ? 'ATE-PEN' : 'ATE-COM';
              const permission = isApprovedStatus ? permission1 : permission2;
              this.commonService.getLatestTransferDetail(assetData.id).subscribe(latest => {
                let sourceId=  latest.results.transferType == "TRT-DEP" ? assetData.ownerDepartmentId : latest.results.transferType == "TRT-FAC"?localStorage.getItem(btoa('facilityId')): assetData?.homeLocationId;
                const jsondata = {
                  transferType: latest.results.transferType,
                  transferId: latest.results.transferId,
                  sourceIdentifier : sourceId,
                  destinationIdentifier: latest.results.transferId,
                  assetTransferType: assetData.assetTransferTypeId,
                  eventId: 'ATT-ACEV',
                  eventStatusId: targetStatus,
                  id: assetData.id,
                  isExcludeParent: false,
                  linkedAssets: [],
                  comments: null
                };
                if(permission){
                  this.getAssetTransferDetails(assetData, jsondata);
                }else{
                  this.loading = false;
                  this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
                  this.refreshPage();
                }
              });
            } else{
              this.loading = false;
              this.toastr.warning('Warning', 'The User doesnot have Permission to acknowledge Asset');
              this.refreshPage();
            }
          });
        }
      });
    } else{
        this.loading = false;
        let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
        if(data?.nonPerformerId == null){
           warningMessage = 'The Request is not linked to Asset';
        }
        if(data?.statusId !== 'RQ-CR'){
        const statusId = data.statusId;
          if (statusId === 'RQ-CO') {
            warningMessage = 'The Request is Already Completed';
          } else if (statusId === 'RQ-CA') {
            warningMessage = 'The Request is Already Cancelled';
          }
        }
        this.toastr.warning('Warning', warningMessage);
        this.refreshPage();
    }
  }

   getAssetTransferDetails(event, jsondata) {
     this.commonService.getAssetTransferDetails(event.id, event.assetTransferTypeId).subscribe(details => {
      this.loading = false;
      const dialogRef = this.dialog.open(ManageAssetComponent, {
        panelClass: ['small-popup'],
        disableClose: true,
        data: {
          assetdata: jsondata,
          assetInfo: event,
          transferData: details.results
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        this.loading = false;
        this.refreshPage();
      });
    });
  }

  navigateToGatepass(data) {
    this.loading = true;
    if (data?.requestCategoryId === 'PR-AT' && data?.nonPerformerId && (data.statusId === 'RQ-CR' ||data.statusId === 'RQ-CO' ))  {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({next: (res) => {
            const assetData = res.results?.[0];
            assetData['gatePassStatusId'] = data.activityCategoryId =='AC-GEXP'?'ATE-GISD':data.activityCategoryId =='AC-GPENP'
            ? data.statusId === 'RQ-CR'? 'ATE-GEXP': data.statusId === 'RQ-CO'? 'ATE-GENP': null: null;
            assetData['hideButton'] = data?.statusId ==='RQ-CO' ? true : false;
            this.manageEventGatePass(assetData);
          },
          error: () => {
            this.loading = false;
          }
        });
    } else {
       this.loading = false;
        let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
        if(data?.nonPerformerId == null){
           warningMessage = 'The Request is not linked to Asset';
        }
        if(data?.statusId !== 'RQ-CR'){
        const statusId = data.statusId;
          if (statusId === 'RQ-CO') {
            warningMessage = 'The Request is Already Completed';
          } else if (statusId === 'RQ-CA') {
            warningMessage = 'The Request is Already Cancelled';
          }
        }
        this.toastr.warning('Warning', warningMessage);
        this.refreshPage();
    }
  }

  manageEventGatePass(data) {
    this.commonService.getLatestTransferDetail(data.id).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP"? departmentIds.includes(Number(department.results.sourceTransferId)) :true;
      if (!isApproved) {
        this.loading = false;
        this.toastr.warning('Warning', 'User does not have permission to authorize Gatepass for this asset');
        return;
      }
      this.manageGetAllAsset(data, department);
    })
  }

  manageGetAllAsset(data, department) {
    this.configurationService.getAllAsset(data.id).subscribe(res => {
      if (res.results && res.results.length > 0) {
        this.loading = false;
        this.rowData = res.results[0];
      }
      const isTransfer = data.assetTransferTypeId === 'ATT-TR';
      let sourceId = department.results.sourceTransferId;
      let source =  department.results.sourceTransferName;
      let destinationId = department.results.transferId;
      let destination = department.results.transferName;
      this.rowData['transferType'] = department.results.transferType,
      this.rowData['sourceIdentifier'] = isTransfer? sourceId : destinationId;
      this.rowData['destinationIdentifier'] = isTransfer? destinationId: sourceId;
      this.rowData['assignedLocationName'] = isTransfer ? destination : source;
      this.rowData['homeLocationName'] = isTransfer ? source: destination;
      this.rowData['isGatePassIssued'] = true;
      this.rowData['hideButton'] = data.hideButton;
      this.rowData['gatePassStatusId'] = data.gatePassStatusId ?? null;
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: this.rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(result => {
        this.loading = false;
        this.refreshPage();
      });
    });
  }

  getReportLayout(data) {
    data['content'] = 'layout'
    data['linkedResourceCode'] = data['requestTypeId'] == 'RQT-WRK' ? 'BT_WRKRQRPT' : ['RQT-TKT','RQT-TASK','RQT-ROU'].includes(data['requestTypeId']) ? 'BT_TKTRQRPT' : 'BT_MAINRQRPT' ;
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: false });
  }

 }
 
 @Component({
   selector: 'app-assign-task',
   templateUrl: './assign-task.component.html',
   styleUrls: ['./task.component.scss']
 })
 
 export class AssignTaskComponent implements OnInit {
 
   public assignTaskForm: FormGroup;
  public assignForm: FormGroup;
   public assignToTask: AssignToTask;
   public assignTask = [{code: 'RT-US', value: 'User'}, {code: 'RT-RO', value: 'Role'}];
   public userNameList = [];
   public roleNameList = [];
   public userEnabled = false;
   public roleEnabled = false;
   roleId = null;
   public searchToCurrentRoleId = null;
   requireAssignNameMatchVal: any[];
   public AssignName: any;
   activate_btn: any[];
  orginalAssignTypeList: any[] = [];
  assignTypeList: any[];
  toHit: boolean = false;
  taskInchargeListRes: any;
  taskInchargeList: any;
  taskInchargeEnabled: boolean;
  roleIds: any[] = [];
  departmentIds: any[] = [];
  perfomerId = null;
  assignToList: any[];
  toChange: boolean = false;
  isAssignMe: boolean = false;
  assetData :any = [];
  isDisplayNotify=true;
  serviceMessage = null;
  loading = false;
  configData = null;
  public userRoleId = localStorage.getItem('userlevel')
  ischeckConfig: boolean = true;
  assignNameId = null;


   constructor(
   private readonly workflowService: WorkflowService,
   public configurationService: ConfigurationService,
   public thisDialogRef: MatDialogRef<AssignTaskComponent>,
   @Inject(MAT_DIALOG_DATA) public data: any,
   public form: FormBuilder,
   public datepipe: DatePipe,
   public commonService: CommonService, public toastr: AppToastService
   ) {
    this.activate_btn = this.commonService.getActivePermission('button');
      if(data.hasOwnProperty('page') && data.page === 'task'){
        this.getDynamicConfigs()
      }
   }
 
   ngOnInit() {
     if (this.data && this.data.assignedToRoleId !== null) {
       this.roleId = this.data.assignedToRoleId;
     }
     this.workflowService.getTaskServiceNotification(this.data.requestId, 'Request').subscribe(res => {
       if (res.statusCode == 1) {
         this.isDisplayNotify = false;
         this.serviceMessage = res.results;
         this.serviceMessage.dataTime = this.datepipe.transform(res.results.sentDatetime, 'dd/MM/yyyy, hh:mm:ss a');
       }
     })
     if (this.data && this.data.requestCategoryId == 'PR-AT') {
       this.configurationService.getAllAsset(this.data.nonPerformerId).subscribe(res => {
         this.assetData = res.results?.length ? res.results[0] : null;
         this.buildForm();
       })
     }
     this.buildForm();
     setTimeout(() => {
       if (this.data.launchType === 'isTask') {
         this.commonService.getAppTerms('RecipientType').subscribe(res => {
           this.orginalAssignTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code == 'RT-US' || resFilter.code == 'RT-RO' || resFilter.code == 'RT-DT'));
         })
         this.loading = true;
         this.configurationService.getActivitiesById(this.data.activityId).subscribe(res => {
           let activityData = res.results[0]
           this.roleIds = activityData.roleIds;
           this.departmentIds = activityData.departmentIds ? activityData.departmentIds : [];
           this.isAssignMe = this.data.isAssignMe;
           if (this.configData) {
             let configAllowed = this.configData[this.userRoleId] || [];
             if(configAllowed.length){
               this.ischeckConfig = configAllowed.includes(this.data.performerType)
               if (!this.ischeckConfig) {
                 this.assignTaskForm.get('assignTaskType').disable();
               }
             }
           }
           setTimeout(() => {
            this.updateAssignTypeList(this.roleIds, this.departmentIds)
           },200)
         });
         setTimeout(() => {
           this.getInchargeValues()
         }, 500)
       }
     })
     if (this.assignTaskForm.controls['assignTaskType'].value === 'RT-US' && this.activate_btn.includes('API_TSKROLUSRSRCH')) {
       let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
       this.configurationService.getRecipientName('', 'RT-US', localStorage.getItem('userlevel'), null, false, null, isTask).subscribe(res => {
         this.userNameList = res.results;
         this.userEnabled = true;
       })
     }
   }

   getDynamicConfigs() {
     this.commonService.getConfigFile('request-config').subscribe(res => {
      if (res.results) {
        let configData = res.results['contentObject'];
        if (configData.rolePermission.hasOwnProperty('assignTypeId')) {
          this.configData = res.results.contentObject.rolePermission['assignTypeId'];
        }
      }
     })
   }
   public buildForm() {
     this.assignTaskForm = this.form.group({
       assignTaskType: [this.data.performerType ? this.data.performerType : 'RT-US'],
       AssignNameId: [this.assignNameId ? this.assignNameId : null,[Validators.required, this.data.launchType !== 'isTask' ? this.requireUserNameMatch.bind(this) : this.validateInchargeSelection.bind(this)]],
       showServicePersonDetails: [false],
       serviceProviderName: [this.assetData ? this.assetData?.serviceProviderName :null,Validators.required],
       servicePersonEmail: [this.assetData ? this.assetData?.servicePersonEmail :null,[Validators.required,Validators.pattern(/(^\d{10}$)|(^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$)/)]]
     });
   }

   clearChild() {
    this.assignNameId = null;
    this.assignTaskForm.controls.AssignNameId.enable();
    this.assignTaskForm.controls.AssignNameId.setValue(null);
   }

   getAssignNameId(id) {
    if(id !== null) {
      this.assignNameId = id;
    } else {
      this.assignNameId = null;
    }
   }

   getInchargeValues(){
    let type = this.data.performerType;
    this.perfomerId = this.data.performerId;
    this.assignTaskForm.get('assignTaskType').setValue(type)
    if (type === 'RT-RO') {
      this.taskInchargeList = []
      this.configurationService.getRecipientName('', type).subscribe(res => {
        this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
        this.assignToList = res.results.filter(role => this.roleIds.includes(role.id));
        let selectedRole = this.assignToList.filter(val => val.id === this.perfomerId);
        this.taskInchargeEnabled = true;
        this.assignTaskForm.get('AssignNameId').setValue(selectedRole[0].name);
        this.assignNameId = selectedRole[0].name;
        this.loading = false;
      });
    } else if (type === 'RT-DT') {
      this.taskInchargeList = []
      this.commonService.getAllDepartments().subscribe(res => {
        this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
        this.assignToList = res.results.filter(dep => this.departmentIds.includes(dep.id));
        let selectedDepart = this.assignToList.filter(val => val.id === this.perfomerId)
        this.taskInchargeEnabled = true;
        this.assignTaskForm.get('AssignNameId').setValue(selectedDepart[0].name);
        this.assignNameId = selectedDepart[0].name;
        this.loading = false;
      });
    } else if (type === 'RT-US') {
      this.taskInchargeList = []
      let roles = this.roleIds.join(',');
      let departments = null;
      if (Array.isArray(this.departmentIds) && this.departmentIds.length) {
       departments = this.departmentIds.join(',');
      } else {
       departments = null;
      }
      if (this.perfomerId != null && this.perfomerId != undefined) {
        roles = null;
        departments = null;
      }
      this.configurationService.getRoleUser(null, roles, departments, this.perfomerId).subscribe(res => {
        this.loading = false;
        if (res.statusCode === 1) {
          this.taskInchargeList = res.results;
          this.taskInchargeEnabled = true;
          this.assignTaskForm.get('AssignNameId').setValue(this.taskInchargeList[0]?.name);
          this.assignNameId = this.taskInchargeList[0]?.name;
        }
      })
    }
   }

   getSelectedType(code) {
     this.data.assignedToType = code;
     this.assignTaskForm.controls.AssignNameId.reset()
     this.AssignName = [];
    if(code === 'RT-US' && this.activate_btn.includes('API_TSKROLUSRSRCH')){
      let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
      this.configurationService.getRecipientName('', 'RT-US', localStorage.getItem('userlevel'), null, false, null, isTask).subscribe(res => {
        this.userNameList = res.results
        this.userEnabled = true
      })
    } else {
      this.userEnabled = false;
    }
   }
   getRecipientName(serachText) {
     const type = this.assignTaskForm.controls.assignTaskType.value;
     if (type === 'RT-RO') {
       this.searchToCurrentRoleId = null;
     } else {
       this.searchToCurrentRoleId = this.data.assignedToRoleId;
     }
     let text = serachText.text;
     this.searchToCurrentRoleId = this.activate_btn.includes('API_TSKROLUSRSRCH') ? localStorage.getItem('userlevel') : type === 'RT-US' ? null : this.searchToCurrentRoleId
     const isAdmin = type === 'RT-US' ? false : true;
     let isTask = this.activate_btn.includes('API_TSKEAROLEUSR');
     this.configurationService.getRecipientName(text, type, this.searchToCurrentRoleId, null, isAdmin, null, isTask).subscribe(res => {
       if (type === 'RT-RO') {
         this.roleNameList = res.results;
         this.roleEnabled = true;
         this.AssignName = this.roleNameList;
       } else {
         this.userNameList = res.results;
         this.userEnabled = true;
         this.AssignName = this.userNameList;
       }
     });
   }
   getUserList(id) {
     if (id) {
       const userList = this as any as { id: string, name: string }[];
       const user = userList.find(obj => obj.id === id).name;
       return user;
     } else {
       return '';
     }
   }
   getRoleList(id) {
     if (id) {
       const roleList = this as any as { id: string, name: string }[];
       const role = roleList.find(obj => obj.id === id).name;
       return role;
     } else {
       return '';
     }
   }
   getTaskAssignList(id) {
    if (id) {
      const taskIncharge = this as any as { id: string, name: string }[]
      const taskInchargeId = taskIncharge.find(obj => obj.id === id).name;
      return taskInchargeId;
    } else {
      return '';
    }
  }
  private requireUserNameMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
      if(typeof this.AssignName !== 'undefined') {
        this.requireAssignNameMatchVal = this.AssignName.filter(resFilter => resFilter.id === control.value);
        if (this.requireAssignNameMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
    return null;
  }
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
   AssignTaskTo(isAssignMe?: boolean) {
     this.assignToTask = new AssignToTask(null, null, null, null, null);
     if(this.data.hasOwnProperty('launchType') && this.data.launchType === 'isTask'){
      if (!this.toChange) {
        this.assignToTask.entityId    = this.assignTaskForm.controls['AssignNameId'].value;
        this.assignToTask.entityType  = this.data.performerType;
      } else {
        this.assignToTask.entityId      = this.assignTaskForm.controls['AssignNameId'].value;
        this.assignToTask.entityType    = this.assignTaskForm.controls['assignTaskType'].value;
      }
      if (isAssignMe) {
        this.perfomerId = parseInt(localStorage.getItem('dXNlcklk'));
        this.assignToTask.entityId    = parseInt(this.perfomerId);
        this.assignToTask.entityType  = 'RT-US';
      }
      this.assignToTask.identifyingId   = this.data.requestId;
      this.assignToTask.identifyingType = "Request";
      this.assignToTask.entityBookingId = this.data.bookingId;
     } else {
      if (this.assignTaskForm.controls['assignTaskType'].value === 'RT-RO') {
        this.assignToTask.entityId    = this.roleId;
        this.assignToTask.entityType  = this.data.assignedToType;
      } else {
        this.assignToTask.entityId      = this.assignTaskForm.controls['AssignNameId'].value;
        this.assignToTask.entityType    = this.assignTaskForm.controls['assignTaskType'].value;
      }
      this.assignToTask.identifyingId   = this.data.identifyingId;
      this.assignToTask.identifyingType = this.data.identifyingType;
      this.assignToTask.entityBookingId = this.data.entityBookingId;
     }
     this.workflowService.assignToTask(this.assignToTask).subscribe(res => {
       if (res.statusCode === 1) {
         this.toastr.success('Success', `${res.message}`);
         this.thisDialogRef.close('confirm');
       }
     },
     error => {
       this.toastr.error('Error', `${error.error.message}`);
     });
   }

   private updateAssignTypeList(selectedRoles: any[], selectedDepartments: any[]) {
     let filteredList: any[] = [];
     const allowedAssignTypes =
       (this.configData && this.configData[this.userRoleId]) && this.ischeckConfig
         ? this.configData[this.userRoleId]
         : ['RT-RO', 'RT-US', 'RT-DT'];
     if (selectedRoles?.length) {
       filteredList.push(
         ...this.orginalAssignTypeList.filter(item =>
           allowedAssignTypes.includes(item.code) && item.code !== 'RT-DT'
         )
       );
     }
     if (selectedDepartments?.length) {
       filteredList.push(
         ...this.orginalAssignTypeList.filter(item =>
           item.code === 'RT-DT' && allowedAssignTypes.includes('RT-DT')
         )
       );
     }
     this.assignTypeList = filteredList.filter(
       (item, idx, self) => idx === self.findIndex(t => t.code === item.code)
     );
   }

 getTaskIncharge(type) {
   this.assignNameId = null;
   this.assignTaskForm.get('AssignNameId').setValue(null);
   this.assignTaskForm.get('AssignNameId').enable();
   this.assignTaskForm.get('AssignNameId').updateValueAndValidity();
   this.assignToList = []
   this.toChange = true;
   if (type === 'RT-RO') {
    this.taskInchargeList = []
     this.configurationService.getRecipientName('', type).subscribe(res => {
       this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
       this.taskInchargeEnabled = true;
     });
   } else if(type === 'RT-DT') {
    this.taskInchargeList = []
     this.commonService.getAllDepartments().subscribe(res => {
       this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
     });
   } else if(type === 'RT-US') {
    this.taskInchargeList = []
     let roles = this.roleIds.length ? this.roleIds.join(',') : null;
     let departments = null;
     if (Array.isArray(this.departmentIds) && this.departmentIds.length) {
        departments = this.departmentIds.join(',');
      } else {
        departments = null;
      }
     this.configurationService.getRoleUser('', roles, departments).subscribe(res => {
       this.taskInchargeList = res.results;
     })
   } else {
     this.taskInchargeList = this.assignToList;
     this.taskInchargeEnabled = false;
   }
 }

  searchTaskUserNamelist(event) {
     let type = this.assignTaskForm.controls['assignTaskType'].value;
     this.toChange = true;
     if (event.text.length >= 2 && type === 'RT-US') {
       this.getUserRole(event);
     } else {
      const RecipientType = type;
       if (RecipientType === 'RT-RO') {
         this.getRoleRecipientName(event, RecipientType);
       } else if (RecipientType === 'RT-DT') {
         this.getDepartmentName(event);
       } else {
         this.taskInchargeList = this.assignToList;
         this.taskInchargeEnabled = true;
       }
     }
  }

  getDepartmentName(event) {
    let text = event.text;
    if(text.length == 0){
    text = null
    }
    this.commonService.getAllDepartments().subscribe(res => {
      this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
      this.assignToList = res.results.filter(dep => this.departmentIds.includes(dep.id));
      this.taskInchargeEnabled = true;
    });
  }

  getRoleRecipientName(event, type) {
    let text = event.text;
    if(text.length == 0){
    text = ''
    }
    this.configurationService.getRecipientName(text, type).subscribe(res => {
      this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
      this.assignToList = res.results.filter(role => this.roleIds.includes(role.id));
      this.taskInchargeEnabled = true;
    });
  }
  getUserRole(event) {
   if (event.toHit === true) {
      let text = event.text;
      let roles = this.roleIds.join(',');
      let departments = null;
      if (Array.isArray(this.departmentIds) && this.departmentIds.length) {
      departments = this.departmentIds.join(',');
    } else {
      departments = null;
    }
      this.configurationService.getRoleUser(text, roles, departments).subscribe(res => {
        this.taskInchargeListRes = res.results;
        this.taskInchargeList = this.taskInchargeListRes;
        this.taskInchargeEnabled = true;
      });
    } else {
      this.taskInchargeList = this.taskInchargeListRes;
      this.taskInchargeEnabled = true;
    }
  }
  saveServicePermission(){
    const data = {
      assetId: this.data.nonPerformerId,
      servicePersonEmail: this.assignTaskForm.controls.servicePersonEmail.value,
      serviceProviderName: this.assignTaskForm.controls.serviceProviderName.value
    };

    this.workflowService.updateServicePersonDetails(this.data.requestId, data).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
 
