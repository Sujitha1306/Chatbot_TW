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

import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../services';
import { FormBuilder, FormControl, FormGroup,  Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTask } from '../workflow-management/workflow-management.model';
import { DatePipe } from '@angular/common';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { SessionStorageService } from '../../../services/session.storage.service';
import { ResourceRemarksComponent } from '../resource-remarks/resource-remarks.component';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../services/toaster.service';
import { map } from 'rxjs/operators';
import { MatTabGroup } from '@angular/material/tabs';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-task-managment',
  templateUrl: './task-managment.component.html',
  styleUrls: ['./task-managment.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class TaskManagmentComponent implements OnInit,OnDestroy {

  public taskForm: FormGroup;
  public createTask: CreateTask
  public contestList: any;
  public selectedTask = "PR-AT";
  categoryList: any;
  taskActivitiesList: any;
  locationListItems: any;
  locationList: any = [];
  locationEnabled: boolean = false;
  assignTypeList: any;
  activate_btn: any[];
  taskInchargeId: null;
  taskInchargeList: any = [];
  taskInchargeEnabled: boolean = false;
  toHit = false;
  taskInchargeListRes: any;
  entityType = 'Patient';
  entityId = null;
  nonPerformerInfo: any[];
  performerInfo: any[];
  assetListItems: any;
  assetList: any = [];
  assetNameEnabled: boolean = false;
  patientListItems: any;
  patientList: any = [];
  patientNameEnabled: boolean;
  canAutoAllocate: boolean = false;
  autoComplete: boolean = false;
  inchargeId: any;
  locationId: any;
  toDay: any = new Date();
  public currentDate = this.dateFormat.transform(this.toDay, 'yyyy-MM-ddTHH:mm')
  taskData = null;
  assetId = null;
  patientId = null;
  destinationId = null;
  public ticketEvents = [];
  public selectedIndex= 0;
  public selectedTab='Documents';
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
  attachFiles=[];
  formTemplate:any=[];
  formData=null;
  ticketformBuilderSource=[];
  entityForms: any=[];
  assetData: any;
  roleIds: any[];
  departmentIds: any[];
  orginalAssignTypeList: any;
  public entityData = {"id":null,"entityId":null,"entityType":'Request',"parentId":null,"parentType":'Location','entityDetails':null,'entityGroupTypeId':'EGTI-LOC','entityTypeId':null,'formTemplateType' :null};
  public workOrderDetail = null;
  public configType = 'create';
  public entityConfigType: any;
  taskByreminderData = null;
  isReminderFormValid: boolean = false;
  isReminderEdited: boolean = false;
  statusList: any[];
  actualStatusList: any[];
  scheduleType: any;
  activityScheduleType = 'SAT-BTM';
  tomorrowDate = new Date(this.toDay.getTime() + 24 * 60 * 60 * 1000);
  isDateTime: boolean = true;
  priorityLevel: any;
  actionTypeList: any;
  isServiceType:boolean = false;
  displayAssetName = null;
  private enableTabChange = false;
  public  showDocuments = true;
  public selectedRoutineTypeId = 'TAC-TKT';
  configData: any;
  public loginUserId = localStorage.getItem('dXNlcklk');
  public userRoleId = localStorage.getItem('userlevel');
  public userdepartmentIds = localStorage.getItem('ZGVwYXJ0bWVudElkcw==');
  ischeckConfig: boolean = true;
  isLoading = false;
  onLoadWO: boolean = true;
  activityDuration = null;
  hitReminerView: boolean = false;
  tabDisable = [];
  showWorkorderForCategory : boolean = false;
  tabRemove = [];
  isAcknowledge = false;
  displayAcknowledge = false;
  enableHistory = false;
  historyDisplayColumn =['Type','Activity','Assigned To','Status','Time','Action Type', 'Remarks','Updated By'];
  historyColumn =['requestTypeName','activityName','name','statusName', 'eventTime','statusReasonName', 'comments','createdUser']
  ticketStatusFlow ='Non-Task';
  taskStatus ={
    "defaultStatus": "RQ-NEW",
    "displayAcknowledge": true,
    "hideRemarks":true,
    "roleStatusMapping":{
     },
    "statusMapping": {
      "RQ-NEW_null": [
        "RQ-NEW"
      ],
      "RQ-NEW_any": [
        "RQ-NEW",
        "RQ-OP",
        "RQ-CL"
      ],
      "RQ-OP_RT-US": [
        "RQ-OP",
        "RQ-IP",
        "RQ-CO"
      ],
      "RQ-OP_any": [
        "RQ-OP",
        "RQ-CO"
      ],
      "RQ-PEN_RT-US": [
        "RQ-PEN",
        "RQ-OP",
        "RQ-IP",
        "RQ-CO"
      ],
      "RQ-PEN_any": [
        "RQ-PEN",
        "RQ-OP",
        "RQ-CO"
      ],
      "RQ-IP_any": [
        "RQ-IP",
        "RQ-CO"
      ],
      "RQ-CO_any": [
        "RQ-CO",
        "RQ-CL",
        "RQ-ROP"
      ],
      "RQ-CL_any": [
        "RQ-CL",
        "RQ-ROP"
      ],
      "RQ-ROP_any": [
        "RQ-ROP"
      ]
    }
  }
  nonTaskStatus = {
    "defaultStatus": "RQ-CR",
    "displayAcknowledge": false,
    "hideRemarks": false,
    "statusMapping": {
      "RQ-CR_RT-US": [
        "RQ-CR",
        "RQ-IP",
        "RQ-CO",
        "RQ-CA"
      ],
      "RQ-CR_any": [
        "RQ-CR",
        "RQ-CO",
        "RQ-CA"
      ],
      "RQ-CR_null": [
        "RQ-CR"
      ],
      "RQ-PEN_RT-US": [
        "RQ-PEN",
        "RQ-IP",
        "RQ-CO",
        "RQ-CA"
      ],
      "RQ-PEN_any": [
        "RQ-PEN",
        "RQ-CO",
        "RQ-CA"
      ],
      "RQ-SH_any": [
        "RQ-SH",
        "RQ-CO", 
        "RQ-CA"
      ],
      "RQ-IP_any": [
        "RQ-IP",
        "RQ-CO"
      ],
      "RQ-CO_any": [
        "RQ-CO",
        "RQ-CL",
        "RQ-ROP"
      ],
      "RQ-CL_any": [
        "RQ-CL",
        "RQ-ROP"
      ],
      "RQ-CA_any": [
        "RQ-CA"
      ],
      "RQ-ROP_any": [
        "RQ-ROP"
      ]
    }
  }
  hideRemarks = false;
  isSubmit = false;
  approvalMsg = null;
  workflowLevelId = null;
  matchedWorkflowLevel = null;
  workflowLevelIdExists = false;
  mandatoryFields = [];
  @ViewChild('tabGroup') tabGroup: MatTabGroup;
  displayWorkOrder: boolean = false;
  requestConfig: any;
  isConfigLoaded = false;
  pendingDisplayStatus: {
    event: string,
    type: string | null,
    routineTypeId: string
  } = null;
  public workflowList =[];
  private resizeObserver!: ResizeObserver;
  displayToggleLayout = false;
  gridMandatoryEnabled = false;
  isRoleBasedCategoryEnabled = false;
  @ViewChild('scrollContainer')set scrollContainerSetter(
    content: ElementRef<HTMLDivElement>) {
    if (!content?.nativeElement) {
      return;
    }
    this.scrollContainer = content;
    setTimeout(() => {
      this.updateArrows();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      })
      this.resizeObserver.observe(content.nativeElement);
    })
  }
  scrollContainer!: ElementRef<HTMLDivElement>;
  showLeftArrow = false;
  showRightArrow = false;
  isGridView = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService,private readonly workflowService:WorkflowService, protected sanitizer: DomSanitizer,
    private readonly dateFormat: DatePipe, public toastr: AppToastService,  public dialog: MatDialog,public thisDialogRef: MatDialogRef<TaskManagmentComponent>,private readonly hospitalService:HospitalService,private readonly sessionService:SessionStorageService,
    private readonly lookupService : LookupTermService) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  async ngOnInit() {
    this.selectedRoutineTypeId = this.data?.routineTypeId ? this.data.routineTypeId :'TAC-TKT';
    this.lookupService.getAppTermsLinkWrapper('RQT-TASK').subscribe(res => {
      this.contestList = res?.PorterRequestType ?? [];
      const sortOrder = ["Location", "Asset", "Patient", "General"];
      this.contestList.sort((a, b) => sortOrder.indexOf(a.value) - sortOrder.indexOf(b.value));
      this.selectedTask = this.contestList.some(s => s.code === 'PR-AT') ? 'PR-AT' : this.contestList[0]?.code;
    })
    this.bulidForm();
    await this.getDynamicConfigs();
    if (this.data.type === 'modify') {
      this.isLoading = true
      this.selectedTab = this.data?.selectedTab ? this.data.selectedTab : null;
      this.getTaskDetails()
    } else if (this.data.type === "asset") {
      this.selectedTask = this.data.contextType;
      if (this.data.contextType === 'PR-AT') {
        let assetName = this.data?.entityDetail?.assetName;
        let assetSerialNo = this.data?.entityDetail?.assetSerialNumber;
        this.assetId = this.data?.nonPerformerId;
        this.commonService.getAssetSearch(this.assetId , null, null, null).subscribe((res) => {
          this.assetList = res.results.filter(val => val.assetId === this.data?.nonPerformerId);
          if(this.assetList.length){
            this.displayAssetName =assetSerialNo ? `${assetName} (${assetSerialNo})` : assetName;
            this.taskForm.get('assetId').setValue(this.assetId);
            this.taskForm.get('assetId').updateValueAndValidity();
            this.assetTypeId = this.assetList[0].assetTypeId;
            this.modelNo = this.assetList[0].modelNumber;
            this.getAssetLoction(this.assetList[0]);
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
            this.taskForm.get('locationId').setValue(this.locationId)
            this.locationId = this.locationList[0].id
          }
          this.taskForm.get('locationId').updateValueAndValidity();
        });
      }

    } else if(this.data.type === 'patient'){
      this.selectedTask = this.data.contextType;
      if (this.data.contextType === 'PR-PA'){
        if(this.data?.page == "nurseCall"){
          this.selectedRoutineTypeId = "TAC-PC"
        }
        this.patientId = this.data?.patientId; 
        this.commonService.searchInpatient(null, this.patientId).subscribe((res) => {
          this.patientList = res.results;
          this.taskForm.get('patientId').setValue(this.patientId)
          this.taskForm.get('patientId').updateValueAndValidity();
        });
      }
      if (this.data?.destinationId !== null && this.data.destinationId !== undefined){
        this.destinationId = this.data?.destinationId;
        this.commonService.getLocationById(this.destinationId).subscribe(res => {
          this.locationList = [res.results];
          if (this.locationList.length) {
            let locationName = this.locationList[0].fullName;
            this.locationEnabled = true;
            this.taskForm.get('destinationId').setValue(this.destinationId)
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
      this.validateControl()
      this.updateSelectedEntityData();
    }
    this.lookupService.getAppTermsWrapper('RecipientType,RequestStatus,ScheduleActivityType,CalenderWeek,PriorityLevel').subscribe(res => {
      this.orginalAssignTypeList = res?.RecipientType.filter(resFilter => resFilter.code == 'RT-US' || resFilter.code == 'RT-RO' || resFilter.code == 'RT-DT');
      this.statusList = res?.RequestStatus;
      this.scheduleType = res?.ScheduleActivityType.filter(resFilter => resFilter.code === 'SAT-BTM' || resFilter.code === 'SAT-ATM' || resFilter.code === 'SAT-RGAT' || resFilter.code === 'SAT-RGBT');
      this.priorityLevel = res?.PriorityLevel ?? [];
      if(this.data.type !== 'modify'){ // create time status binding logic based on config 
        let initialStatus;
        const roleId = localStorage.getItem('roleId');
        const isTaskRoutine = (this.selectedRoutineTypeId === 'TAC-TKT' && this.ticketStatusFlow === 'Task')|| this.selectedRoutineTypeId == 'TAC-TASK';
        if(isTaskRoutine) {
          const mapping = this.taskStatus?.roleStatusMapping || {};
          if(roleId && Object.prototype.hasOwnProperty.call(mapping, roleId)) {
            initialStatus = mapping[roleId];
          }else{
            initialStatus = this.taskStatus?.defaultStatus || 'RQ-NEW';
          }
        }else{
          initialStatus = this.nonTaskStatus?.defaultStatus || 'RQ-CR';
        }
        this.displayStatus(initialStatus, null,this.selectedRoutineTypeId);
      }else{
        if (this.pendingDisplayStatus) {
          const { event, type, routineTypeId } = this.pendingDisplayStatus;
          this.displayStatus(event, type, routineTypeId);
        }
      }
    })
    this.totalCostCalculation();
  }

  displayStatus(event: string, type: string | null, routineTypeId) {
    if (!this.isConfigLoaded || !this.statusList?.length) { // flag to check for config/statuslist  is loaded or not if not loaded store values in key then force it after config/statuslist loaded
      this.pendingDisplayStatus = { event, type, routineTypeId };
      return;
    }
    const isTaskFlow = (routineTypeId === 'TAC-TKT' && this.ticketStatusFlow === 'Task') || routineTypeId === 'TAC-TASK';
    // Status Mapping is based on isTaskflow flag
    const statusMap = isTaskFlow ? this.taskStatus?.statusMapping : this.nonTaskStatus?.statusMapping;
    // Key generation based on status and nonperformertype 
      let key = `${event}_any`; // default Key mapped
    // To  avoid incorrect statusmapping when role based status mapping done .
      if (type === null) { // create scenario
        key = `${event}_null`;
        if(event === 'RQ-OP'|| event === 'RQ-CL'){
          this.isAcknowledge = true;
        }else{
          this.isAcknowledge = false;
        }
      } else if(isTaskFlow) {// modify scenario
        if (['RQ-OP','RQ-PEN'].includes(event) && type === 'RT-US') {
          key = `${event}_RT-US`;
        }
      }else{// isNonTask Based Mapping
        if (routineTypeId === 'ROU-ASM') {
          if (event === 'RQ-PEN' && type === 'RT-US') {
            key = `${event}_RT-US`;
          } else if(event === 'RQ-CR'&&['RT-US', 'RT-RO'].includes(type)){
            key = `${event}_any`;
          }
        } else {
          if (['RQ-CR','RQ-PEN'].includes(event) && type === 'RT-US') {
            key = `${event}_RT-US`;
          }
        }
      }
      const allowedCodes = statusMap?.[key] ?? statusMap?.[`${event}_any`] ??[];
      const allowedSet = new Set(allowedCodes);
      const permissionMap: Record<string, string> = {
        'RQ-CL': 'BT_TMCL',
        'RQ-OP': 'BT_TMOP',
        'RQ-CA': 'BT_TMCA',
        'RQ-ROP': 'BT_TMROP'
      }
      const hasOpenWorkOrders = this.taskData?.openedWorkOrders > 0;
      const hasOpenForms = this.taskData?.openForms > 0;
      this.actualStatusList = this.statusList?.filter(res => {
        if (!allowedSet.has(res.code)) return false;
        const permissionKey = permissionMap[res.code];
        if (permissionKey && event !== res.code &&!this.activate_btn.includes(permissionKey)) {
          return false;
        }
        if ((hasOpenWorkOrders || hasOpenForms) && res.code === 'RQ-CO') {
          return false;
        }
        return true;
      })
      this.taskForm.controls.statusId.setValue(event);
  }

  getDynamicConfigs(): Promise<any> {
    return new Promise((resolve) => {
      this.commonService.getConfigFile('request-config').subscribe({next: (res) => {
          try {
            if (res?.results) {
              let configData = res.results['contentObject'];
              this.requestConfig = configData;
              if (configData?.rolePermission?.hasOwnProperty('assignTypeId')) {
                this.configData = configData.rolePermission['assignTypeId'];
                const tabDisable = configData.taskManageConfig?.['tabDisable'] || {};
                const tabRemove = configData.taskManageConfig?.['tabRemove'] || {};
                const showWorkorderForCategory = configData.taskManageConfig?.['showWorkorderForCategory'] || [];
                this.tabDisable = tabDisable[this.userRoleId];
                this.tabRemove = tabRemove[this.userRoleId];
                this.showWorkorderForCategory = showWorkorderForCategory?.includes(this.data?.activityCategoryId);
              }
              if(configData?.['Task']){
                this.taskStatus = configData?.['Task'] ?? this.taskStatus;
                this.displayAcknowledge = this.taskStatus?.displayAcknowledge ?? false;
                this.hideRemarks = this.taskStatus?.hideRemarks ?? false;
              }
              if(configData?.['Non-Task']){
                this.nonTaskStatus = configData?.['Non-Task'] ?? this.nonTaskStatus;
                this.displayAcknowledge = this.nonTaskStatus?.displayAcknowledge ?? false;
                this.hideRemarks = this.nonTaskStatus?.hideRemarks ?? false;
              }
              this.ticketStatusFlow = configData?.['TAC-TKT'] ?? this.ticketStatusFlow;
              this.hideRemarks = this.ticketStatusFlow !='Task'? this.nonTaskStatus?.hideRemarks : this.taskStatus?.hideRemarks;
              this.historyDisplayColumn = configData?.historyDisplayColumn ?? this.historyDisplayColumn;
              this.historyColumn = configData?.historyColumn ?? this.historyColumn;
              this.mandatoryFields = configData?.mandatoryFields ?? this.mandatoryFields;
              this.displayToggleLayout = configData?.displayToggle ?? false;
              this.gridMandatoryEnabled = configData?.enableGridMandatoryFields ?? false;
              this.isRoleBasedCategoryEnabled = configData?.enableRoleBasedCategoryEnabled ?? false;
              this.applyMandatoryFields();
            }
          } catch (e) {
            console.log('error', e);
          }
          this.isConfigLoaded = true;
          if (this.pendingDisplayStatus) { // key  if value exists before config loaded then force it
            const { event, type, routineTypeId } = this.pendingDisplayStatus;
            this.pendingDisplayStatus = null;
            this.displayStatus(event, type, routineTypeId);
          }
          resolve(true);
        },

        error: (err) => {
          // console.error('Config API failed → using fallback', err);
          this.isConfigLoaded = true;
          if (this.pendingDisplayStatus) {// key  if value exists before config loaded then force it
            const { event, type, routineTypeId } = this.pendingDisplayStatus;
            this.pendingDisplayStatus = null;
            this.displayStatus(event, type, routineTypeId);
          }
          resolve(false);
        }
      });
    });
  }
  
  applyMandatoryFields() {
    if (['TAC-TASK','TAC-TKT','TAC-WOR','ROU-ASM'].includes(this.selectedRoutineTypeId)) {
      for (const field of this.mandatoryFields) {
        const control = this.taskForm.get(field);
        if (control) {
          const existingValidators = control.validator ? [control.validator] : [];
          control.setValidators([...existingValidators, Validators.required]);
          control.updateValueAndValidity();
        }
      }
    }
  }

  getTaskDetails() {
    this.workflowService.getTaskById(this.data.requestId).subscribe((res) => {
      this.taskData = res.results[0];
      this.isAcknowledge =  this.taskData?.acknowledgedById ? true : false;
      this.selectedRoutineTypeId = this.taskData?.routineTypeId ??'TAC-TKT';
      setTimeout(() => {
        if (this.taskData !== null) {
          this.displayStatus(this.taskData?.statusId, this.taskData?.performerType, this.taskData?.routineTypeId);//modify time status binding handling
          this.displayStatusBasedActivityList(); // Load activityList based on status using apptermslink
          this.selectedTask = this.taskData?.requestCategoryId;
          this.loadEntityList();
          if (!['SAT-BTM', 'SAT-RGBT'].includes(this.taskData?.scheduleActivityTypeId)) {
            this.isDateTime = false
          }
          if(this.taskData?.scheduleActivityTypeId){
            this.activityScheduleType = this.taskData?.scheduleActivityTypeId;
          }
          if(this.taskData?.scheduleStartTime) {
            const currentDateObj = new Date(this.taskData?.scheduleStartTime);
            this.currentDate = this.dateFormat.transform(currentDateObj,'yyyy-MM-dd HH:mm')
            this.tomorrowDate = new Date(currentDateObj.getTime() + 24 * 60 * 60 * 1000)
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
          } else if(this.taskData?.requestTypeId === 'RQT-WRK') {
            let selectedWorkOrder = null;
            if(this.selectedTask === 'PR-PA'){
              selectedWorkOrder = 'WOC-PA'
            } else if(this.selectedTask === 'PR-AT') {
              selectedWorkOrder = 'WOC-AS'
            } else if(this.selectedTask === 'PR-LC'){
              selectedWorkOrder = 'WOC-LOC'
            } else {
              selectedWorkOrder ='WOC-OT'
            }
          }
          if (this.taskData?.activityCategoryId !== null) {
            this.showWorkorderForCategory = this.requestConfig?.taskManageConfig['showWorkorderForCategory']?.includes(this.taskData?.activityCategoryId) ?? false ; 
            this.getTaskList(this.taskData?.routineTypeId, this.taskData?.activityCategoryId);
          }
          if (this.taskData?.destinationLocationId !== null && this.selectedTask !== 'PR-LC') {
            this.destinationId = this.taskData?.destinationLocationId ? this.taskData?.destinationLocationId : null
            this.commonService.getLocationById(this.destinationId).subscribe(res => {
              this.locationList = [res.results];
              this.locationEnabled = true;
              if (this.locationList.length) {
                let locationName = this.locationList[0].fullName;
                this.taskForm.get('destinationId').setValue(this.destinationId)
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
                  this.isLoading = false
                });
              } else if (type == 'RT-US') {
                let roles = this.roleIds?.join(',');
                let departments = this.departmentIds && this.departmentIds?.join(',');
                if (this.taskData?.performerId) {
                  roles = null;
                  departments = null;
                }
                this.configurationService.getRoleUser(null, roles, departments, this.taskData?.performerId).subscribe(res => {
                  this.taskInchargeList = res.results
                  this.taskInchargeEnabled = true;
                  if (this.taskInchargeList.length) {
                    let name = this.taskInchargeList[0].name;
                    this.taskForm.get('assignId').setValue(name);
                  }
                  this.taskForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
                  this.isLoading = false
                });
              } else if (type == 'RT-DT') {
                this.commonService.getAllDepartments().subscribe(res => {
                  this.taskInchargeList = res.results.filter(val => val.id === this.taskData?.performerId);
                  this.taskInchargeEnabled = true;
                  if (this.taskInchargeList.length) {
                    let name = this.taskInchargeList[0].name;
                    this.taskForm.get('assignId').setValue(name);
                  }
                  this.isLoading = false
                });
              }
            } else { 
              setTimeout(() => {
              this.isLoading = false;
              }, 2000)
            }
          }, 0);
          this.updateSelectedEntityData();
          this.bulidForm();
          // this.validateControl();
        }
      }, 0);
    })
    if(this.selectedTab == 'Forms'){
      this.getFormDetails();
      this.getEntityDetails();
    }
  }

  displayStatusBasedActivityList(){
    if(!this.taskData || !this.taskData?.statusId) return;
    this.lookupService.getAppTermsLinkWrapper(this.taskData?.statusId, 'RequestCancelReason').subscribe(res => {
      this.actionTypeList = res.RequestCancelReason ?? [];
    })
  }

  bulidForm() {
    this.taskForm = this.form.group({
      categoryId: [{value: (this.taskData?.requestTypeId === 'RQT-ROU' && this.taskData?.routineTypeId) ? this.taskData?.routineTypeId : this.taskData?.activityCategoryId ? this.taskData?.activityCategoryId : null, disabled: this.data.type == 'modify'}, [Validators.required]],
      taskId: [{value: this.taskData?.activityId ? this.taskData.activityId : null, disabled: this.data.type == 'modify'}, [Validators.required]],
      locationId: [this.taskData?.nonPerformerId ? this.taskData?.nonPerformerId : null],
      assetId: [this.taskData?.nonPerformerId ? this.taskData?.nonPerformerId : null],
      patientId: [this.taskData?.nonPerformerId ? this.taskData?.nonPerformerId : null],
      general: [this.taskData?.title ? this.taskData.title : null],
      destinationId: [{value: this.taskData?.destinationId ? this.taskData?.destinationId : null, disabled: this.taskData?.statusId === 'RQ-CO' ||  this.taskData?.statusId === 'RQ-CA'}, [this.validateLocationSelection.bind(this)]],
      description: [{value:this.taskData?.comments ? this.taskData?.comments : null, disabled: this.taskData?.comments?.trim() != null && this.data.type == 'modify'}],
      assignType: [{value: this.taskData?.performerType ? this.taskData?.performerType : null, disabled: this.taskData?.statusId === 'RQ-IP' || this.taskData?.statusId === 'RQ-CO' || this.taskData?.statusId === 'RQ-CA'}, [Validators.required]],
      assignId: ['', [Validators.required, this.validateInchargeSelection.bind(this)]],
      comments: [null, [Validators.maxLength(250)]],
      statusId: [{value: this.taskData?.statusId ? this.taskData.statusId : 'RQ-CR', disabled:  this.taskData?.statusId === 'RQ-CA'}],
      scheduleTypeId: [{value: this.taskData?.scheduleActivityTypeId ? this.taskData?.scheduleActivityTypeId : this.activityScheduleType, disabled: this.taskData?.statusId === 'RQ-CO' ||  this.taskData?.statusId === 'RQ-CA'}, [Validators.required]],
      startDate: [{value: this.taskData?.scheduleStartTime ? this.dateFormat.transform(this.taskData?.scheduleStartTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : this.currentDate, disabled: this.taskData?.statusId === 'RQ-CO' ||  this.taskData?.statusId === 'RQ-CA'}],
      scheduleEndTime: [{value: this.taskData?.scheduleEndTime ? this.dateFormat.transform(this.taskData.scheduleEndTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'): this.dateFormat.transform(this.currentDate, 'yyyy-MM-dd 23:59'), disabled:this.taskData?.statusId === 'RQ-CO' ||  this.taskData?.statusId === 'RQ-CA'}],
      priorityLevelId: [{value: this.taskData?.priorityLevelId ? this.taskData.priorityLevelId : 'PRL-LW', disabled: this.taskData?.statusId === 'RQ-CO' ||  this.taskData?.statusId === 'RQ-CA'}],
      actionTypeId: [this.data.type != 'modify'? 'RCR-INIT' : null],
      formTemplateId : [null]
    })
    this.applyMandatoryFields();
    this.itemForm = this.form.group({
      itemMasterId: [null,[Validators.required,this.validateItemSelection.bind(this)]],
      batchId:[this.editInventory ? this.itemBatchName :null,],
      quantity: [1],
      cost: [null],
      serviceCost :[null],
      comments:[null]
    });
    this.autoCostCalculation();
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

  loadEntityList() {
    const { nonPerformerId: id, nonPerformerName: name } = this.taskData || {};
    if (!id || !name) return;

    const config = {
      'PR-AT': {
        listKey: 'assetList',
        formKey: 'assetId',
        value: { assetId: id, assetName: name }
      },
      'PR-LC': {
        listKey: 'locationList',
        formKey: 'locationId',
        value: { id: id, fullName: name }
      },
      'PR-PA': {
        listKey: 'patientList',
        formKey: 'patientId',
        value: { id: id, fullName: name }
      }
    };

    const selected = config[this.selectedTask];
    if (!selected) return;
    this.assetList = [];
    this.locationList = [];
    this.patientList = [];
    this[selected.listKey] = [selected.value];
    this.taskForm.patchValue( { [selected.formKey]: id });
  }

  onTabChanged(event) { 
    // To restrict continuous mat-tab switching by using set Timeout of 500ms
    if (this.enableTabChange) {
      return;
    }
    this.enableTabChange = true;
    setTimeout(() => this.enableTabChange = false, 500);
    this.selectedIndex = event?.index ?? this.selectedIndex;
    this.selectedTab = event?.tab?.textLabel ?? this.selectedTab;
    if(this.selectedTab == 'Forms'){
      this.getFormDetails();
      this.getEntityDetails();
    }else if(this.selectedTab == 'History'){
      this.getAllTktHist(this.data.requestId);
    }else if (this.selectedTab =='Parts/Services'){
      this.getTicketInventoryDetails(this.data.requestId)
    }else if (this.selectedTab == 'Documents'){
        this.showDocuments = false;
        this.updateSelectedEntityData();
    }else if (this.selectedTab == 'Notification'){
      if(this.data.type === 'modify'){
        this.entityConfigType = 'request';
        this.configType = 'modify';
        const data = this.taskData;
        data['dataType'] = 'get';
        data['id'] = data.requestId;
        this.taskByreminderData = data;
        this.hitReminerView = true;
      }
    } else if(this.selectedTab == 'WorkFlow Sequence'){
      if (this.requestConfig?.hasOwnProperty('allowTaskHistoryManage') && this.taskData?.requestTypeId =='RQT-TASK'){
        if(this.requestConfig['allowTaskHistoryManage'].includes(this.taskData.activityCategoryId)){
          this.allowedTaskEventHistory(this.taskData);
        } else {
          this.getTaskEventHistory(this.taskData);
        }
      } else {
        this.getTaskEventHistory(this.taskData);
      }
    }
  }

  allowedTaskEventHistory(data) {
    this.commonService.getCategoryTaskList(data.activityCategoryId, data.requestId).subscribe((res) => {
      this.workflowList = res.results['workOrderFlow'];
    })
  }

  getTaskEventHistory(data) {
    this.commonService.getPorterHistory(data.requestId).subscribe((res) => {
      if (res.statusCode === 1) {
        this.workflowList = res.results.reverse();
      }
    })
  }

  statusBasedAcknowledge(existingStatus ,statusValue){
    if (existingStatus === 'RQ-NEW' && (this.selectedRoutineTypeId === 'TAC-TKT' ||this.selectedRoutineTypeId === 'TAC-TASK') && (statusValue === 'RQ-OP' || statusValue === 'RQ-CL')) {
      this.isAcknowledge = true;
    }else{
      this.isAcknowledge = this.taskData?.acknowledgedById ? true : false;
    }
  }

  checkNotifiValidityChange(valid: boolean){
    this.isReminderFormValid = valid['formValidation'];
    this.isReminderEdited = valid['editValidation'];
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

  private applyGridValidators() {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.clearValidators();
      this.taskForm.get(key)?.setErrors(null);
    });
    this.taskForm.get('statusId')?.setValidators([Validators.required]);
    this.taskForm.get('assignType')?.setValidators([Validators.required]);
    this.taskForm.get('assignId')?.setValidators([Validators.required, this.validateInchargeSelection.bind(this)]);
    this.taskForm.get('destinationId')?.setValidators([this.validateLocationSelection.bind(this)]);
    this.validateControl();
    if (this.gridMandatoryEnabled) {
      this.applyMandatoryFields();
    }
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  getSelectTask(event) {
    this.showDocuments = false;
    this.selectedTask = event.code
    this.bulidForm();
    this.getCategoryList();
    this.validateControl();
    this.updateSelectedEntityData();
    this.ticketformBuilderSource =[];
    this.formTemplate=null;
    if(this.isGridView) {
      this.applyGridValidators();
    }
    if(this.data?.type !== 'modify'){ // create time status binding logic based on config 
        let initialStatus;
        const roleId = localStorage.getItem('roleId');
        const isTaskRoutine = (this.selectedRoutineTypeId === 'TAC-TKT' && this.ticketStatusFlow === 'Task')|| this.selectedRoutineTypeId == 'TAC-TASK';
        if(isTaskRoutine) {
          const mapping = this.taskStatus?.roleStatusMapping || {};
          if(roleId && Object.prototype.hasOwnProperty.call(mapping, roleId)) {
            initialStatus = mapping[roleId];
          }else{
            initialStatus = this.taskStatus?.defaultStatus || 'RQ-NEW';
          }
        }else{
          initialStatus = this.nonTaskStatus?.defaultStatus || 'RQ-CR';
        }
        this.displayStatus(initialStatus, null,this.selectedRoutineTypeId);
      }
    // this.onTabChanged({index: this.selectedIndex,tab: { textLabel:this.selectedTab }});
  }

  updateSelectedEntityData() {
    this.showDocuments = false;
    this.categoryList = [];
    this.taskActivitiesList = [];
    const entityGroup = {
      "PR-LC": { entityGroupTypeId: "EGTI-LOC", parentType: "Location" },
      "PR-AT": { entityGroupTypeId: "EGTI-AS", parentType: "Asset" },
      "PR-PA": { entityGroupTypeId: "EGTI-PA", parentType: "Patient" }
    };

    const entityType = this.selectedTask || this.data?.['Context Id'] || this.taskData?.['requestCategory'] || "PR-LC";
    const selectedGroup = entityGroup[entityType] || entityGroup["PR-LC"];
    const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
    const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
    const parentId = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
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
    setTimeout(() => (this.showDocuments = true), 100);
    if (this.data?.type === 'modify' && this.onLoadWO && this.selectedTab == null ) {
      this.getWorkOrderDetails();
    }else if (this.selectedTab != null){
      const tabNames = this.tabGroup?._tabs?.toArray();
      const index = tabNames?.findIndex(tab => tab?.textLabel?.trim() === this.selectedTab?.trim());
      if (index >= 0) {
        this.selectedIndex = index;
        this.onTabChanged({index: this.selectedIndex, tab:{textLabel: this.selectedTab}});
      }
    }
  }

  getWorkOrderDetails() {
    // Retry only if assetData not ready and  nonPerformerId exists alone
    if (!this.assetData && this.taskData?.nonPerformerId != null) {
      this.getEntityDetails(() => this.getWorkOrderDetails());
      return;
    } else{ // fallback to entitytaskworkflow  when even nonperformerId is null
      this.getTaskWorkflow(this.taskData);
    }
    // flag to check display of workorder tab
    this.displayWorkOrder = this.activate_btn?.includes('BT_TA_WK') && this.data.type === 'modify' && this.taskData?.requestTypeId !== 'RQT-WRK' && this.showWorkorderForCategory;

    this.workOrderDetail = {
      ...this.entityData,
      reqDetail: this.taskData,
      reqType: 'RQT-WRK',
      entityId: this.entityData.parentId,
      entityType: this.entityData.parentType,
      entityTypeId: 'TAT-AS',
      formTemplateType: 'FTT-AT',
      entityDetails: this.assetData,
      parentId: null,
      parentType: null
    };
        this.tabGroup.selectedIndex = 0;
        this.selectedTab = 'History';
        this.selectedIndex = 0;
        this.onTabChanged({ index: 0, tab: { textLabel: 'History' } });
        this.onLoadWO = false;
  }

  getTaskWorkflow(data){
    if(!data?.requestId) return;
    this.commonService.getEntityWorkFlow(data.requestId,'request').subscribe(res => {
      if(res?.statusCode !== 1 || !res?.results?.length){
        this.isSubmit = false;
        return;
      }
      const workflows = res.results.filter(w => w.isActive == true).sort((a, b) => Number(a.workflowLevelId) - Number(b.workflowLevelId));
      this.workflowLevelIdExists = workflows?.length > 0;
      if (!workflows.length) {
        this.isSubmit = false;
        this.workflowLevelId = null;
        this.taskForm.controls['statusId'].enable();
        return;
      }
      const workflowsForStatus = workflows.filter(w => w.entityStatusId === data.statusId);
      if (!workflowsForStatus.length) {
        this.isSubmit = false;
        this.workflowLevelId = null;
        this.taskForm.controls['statusId'].enable();
        return;
      }
      const highestWorkflowLevel = Math.max(...workflows.map(w => Number(w.workflowLevelId)));
      const lowestLevel = Math.min(...workflowsForStatus.map(w => Number(w.workflowLevelId)));
      const highestLevelEntityStatusId = workflows.find(w => Number(w.workflowLevelId) === highestWorkflowLevel)?.entityStatusId;
      let currentLevel = data.workflowLevelId != null ? Number(data.workflowLevelId) : null;
      const firstWorkflowForStatus = workflowsForStatus[0];
      if (currentLevel == null ||(
          currentLevel === highestWorkflowLevel &&
          data.statusId === firstWorkflowForStatus?.entityStatusId &&
          data.statusId !== highestLevelEntityStatusId
        )){
        currentLevel = null;
      }
      let statusWorkflows:any[] = [];
      if(currentLevel === null){
        statusWorkflows = workflowsForStatus.filter(w => Number(w.workflowLevelId) === lowestLevel);
      }else{
        const nextLevel = Math.min(...workflowsForStatus.map(w => Number(w.workflowLevelId)).filter(level => level > currentLevel));
        if (isFinite(nextLevel)) {
          statusWorkflows = workflowsForStatus.filter(w => Number(w.workflowLevelId) === nextLevel);
        } else {
          statusWorkflows = [];
        }
      }
      const buildApprovalMsg = (workflowsArray: any[]): string | null => {
        if (!workflowsArray.length) return null;
        const labels: string[] = [];
        for (const w of workflowsArray) {
          if (w.identifyingType === 'RT-EO') {
            labels.push(`${data.userName} (${w.comments})`);
          } else if (w.identifyingType === 'RT-OW') {
            labels.push(`${this.assetData?.ownerName} (${w.comments})`);
          } else if (w.identifyingValue) {
            labels.push(`${w.identifyingValue} (${w.comments})`);
          }
        }
        if (!labels.length) return null;
        return `Next Approval : ${labels.join(' / ')}`;
      }
      let matchedWorkflow = null;
      for(const w of statusWorkflows) {
        if(w.identifyingType === 'RT-US' && Number(w.identifyingId) === Number(this.loginUserId)) {
          matchedWorkflow = w;
          break;
        }
        if(w.identifyingType === 'RT-RO' && Number(w.identifyingId) === Number(this.userRoleId)) {
          matchedWorkflow = w;
          break;
        }
        if(w.identifyingType === 'RT-EO' && Number(data.userId) === Number(this.loginUserId)) {
          matchedWorkflow = w;
          break;
        }
        if(w.identifyingType === 'RT-OW' && Number(this.assetData?.ownerId) === Number(this.loginUserId)) {
          matchedWorkflow = w;
          break;
        }
      }

      this.matchedWorkflowLevel = matchedWorkflow;

      if (statusWorkflows.length > 0) {
        this.taskForm.controls['statusId'].disable();
        if (matchedWorkflow) {
          this.isSubmit = true;
          this.approvalMsg = null;
          this.workflowLevelId = Number(matchedWorkflow.workflowLevelId);
        } else {
          this.isSubmit = false;
          this.workflowLevelId = null;
          this.approvalMsg = buildApprovalMsg(statusWorkflows);
        }
      } else {
        this.isSubmit = false;
        this.workflowLevelId = null;
        this.taskForm.controls['statusId'].enable();
        this.approvalMsg = null;
      }
    });
  }
   

  validateControl() {
    const requiredFields = {
      'PR-LC': 'locationId',
      'PR-AT': 'assetId',
      'PR-PA': 'patientId',
      'PR-GN': 'general',
    };
    const fields = ['locationId', 'assetId', 'patientId', 'general'];
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
    if (this.data.requestedType !== 'RQT-WRK') {
      let parentCode = this.data?.page == 'nurseCall' ? 'TAC-PC' : this.selectedTask;
      if(this.isRoleBasedCategoryEnabled){
        this.configurationService.getEntityform(this.userRoleId, 'role', this.selectedTask).subscribe(res => {
          this.categoryList = res?.results?.map((item) => ({ code: item.identifyingValue, value: item.identifyingValueName })) ?? [];
        })
      } else{
        this.lookupService.getAppTermsLinkWrapper(parentCode, 'ActivityCategory').subscribe(res => {
          this.categoryList = res?.ActivityCategory ?? [];
        })
      }
    } else {
      let selectedWorkOrder = null;
      if (this.selectedTask === 'PR-PA') {
        selectedWorkOrder = 'WOC-PA'
      } else if (this.selectedTask === 'PR-AT') {
        selectedWorkOrder = 'WOC-AS'
      } else if (this.selectedTask === 'PR-LC') {
        selectedWorkOrder = 'WOC-LOC'
      } else {
        selectedWorkOrder = 'WOC-OT'
      }
      if(this.isRoleBasedCategoryEnabled){
        this.configurationService.getEntityform(this.userRoleId, 'role', this.selectedTask).subscribe(res => {
          this.categoryList = res?.results?.map((item) => ({ code: item.identifyingValue, value: item.identifyingValueName })) ?? [];
        })
      } else{
        this.lookupService.getAppTermsLinkWrapper(selectedWorkOrder, 'ActivityCategory').subscribe(res => {
          this.categoryList = res?.ActivityCategory ?? [];
        })
      }
    }
  }

  getTaskList(type, data) {
    if(this.data.requestedType === 'RQT-WRK'){
      type = "TAC-WOR"
    }
    this.taskForm.get('taskId').setValue(null);
    this.taskForm.get('taskId').updateValueAndValidity()
    this.taskForm.get('assignId').setValue(null);
    this.taskForm.get('taskId').updateValueAndValidity()
    this.taskForm.get('assignType').setValue(null);
    this.taskForm.get('assignType').updateValueAndValidity();
    this.configurationService.getTaskActivities(type, data).subscribe(res => {
      this.taskActivitiesList = res.results;
      this.activityDuration = this.taskActivitiesList.minDuration;
      if (data === this.taskData?.activityCategoryId) {
        const activityTask = this.taskActivitiesList.find(val => val.id === this.taskData.activityId)
        this.roleIds = activityTask?.roleIds;
        this.departmentIds = activityTask?.departmentIds;
        if (this.configData) {
          let configAllowed = this.configData[this.userRoleId] || [];
          if (configAllowed.length) {
            this.ischeckConfig = configAllowed.includes(this.taskData.performerType)
            if(!this.ischeckConfig) {
              this.taskForm.get('assignType').disable();
            }
          }
        }
        this.updateAssignTypeList(activityTask?.roleIds, activityTask?.departmentIds);
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
          if (this.isGridView) {
            const assignType = this.taskForm.get('assignType')?.value;
            if (assignType) {
              this.getTaskIncharge(assignType);
            }
          }
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

  getLocationList=(id)=> {
    if (!id || !this.locationList?.length) return '';
    const location = this.locationList?.find(location => location.id === id);
    return location ? location.fullName : '';
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

  getPatientList=(id)=>{
    if (!id || !this.patientList?.length) return '';
    const patient = this.patientList?.find(patient => patient.id === id);
    return patient ? patient.fullName : '';
  }

  searchLocationList(event, isReadOnly: boolean) {
    if (!isReadOnly) {
      if (event.text.length >= 2) {
        if (event.toHit == true) {
          this.configurationService.getLocationData(event.text).subscribe(res => {
            this.locationListItems = res.results;
            this.locationList = this.locationListItems;
            this.locationEnabled = true;
            if (this.selectedTask === 'PR-LC') {
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
  }

  searchAssetList(event, isReadOnly: boolean) {
    if (!isReadOnly) {
      if (event.text.length >= 2) {
        if (event.toHit == true) {
          this.commonService.getAssetSearch(null, event.text, this.loginUserId, this.userdepartmentIds).subscribe((res) => {
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
  }

  searchPatientList(event, isReadOnly: boolean) {
    if (!isReadOnly) {
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
  }

  selectedTaskActivity(event) {
    this.assignTypeList = [];
    this.taskInchargeList = [];
    this.taskInchargeEnabled = false
    const allowedAssignTypes =(this.configData && this.configData[this.userRoleId])? this.configData[this.userRoleId]
      : ['RT-RO', 'RT-US', 'RT-DT'];
    const selectedTask = this.taskActivitiesList.find(task => task.id === event.value);
    this.entityConfigType = 'pf_activity';
    selectedTask['dataType'] = 'get';
    this.taskByreminderData = selectedTask
    this.hitReminerView = true;
    this.roleIds = selectedTask.roleIds !== null ? selectedTask.roleIds : [];
    this.departmentIds = selectedTask.departmentIds !== null ? selectedTask.departmentIds : [];
    this.updateAssignTypeList(this.roleIds, this.departmentIds);
    this.activityDuration = selectedTask.minDuration
    let getEndTime = new Date(this.toDay.getTime() + (this.activityDuration * 60 *1000));
    this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(getEndTime, this.isDateTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'))
    if (selectedTask && selectedTask.inchargeId !== null) {
      let type = selectedTask.inchargeType;
      this.inchargeId = selectedTask.inchargeId;
      if (!allowedAssignTypes.includes(type)) {
        return;
      }
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
      let type = selectedTask.inchargeType;
      let name = selectedTask.inchargeName;
      if (allowedAssignTypes.includes(type)) {
        this.taskForm.patchValue({
          assignType: type,
          assignId: name,
        });
      } else {
        this.taskForm.patchValue({
          assignType: null,
          assignId: null
        });
      }
      this.taskForm.patchValue({
        'description': selectedTask.description,
        'comments': selectedTask.remarks,
        'easyTaskLocation': selectedTask.destinationName,
        'priorityLevelId': selectedTask.priorityLevelId ? selectedTask.priorityLevelId : 'PRL-LW'
      });
    }
  }

  private updateAssignTypeList(selectedRoles: any[], selectedDepartments: any[]) {
    let filteredList: any[] = [];
    const allowedAssignTypes =
      (this.configData && this.configData[this.userRoleId]) && this.ischeckConfig
        ? this.configData[this.userRoleId]
        : ['RT-RO', 'RT-US', 'RT-DT'];

    if (selectedRoles?.length) {
      filteredList.push(...this.orginalAssignTypeList.filter(item =>
          allowedAssignTypes.includes(item.code)
        )
      );
    }
    if (selectedDepartments?.length) {
      filteredList.push(...this.orginalAssignTypeList.filter(item =>
        item.code === 'RT-DT' && allowedAssignTypes.includes('RT-DT')
      )
      );
    }
    this.assignTypeList = filteredList.filter(
      (item, idx, self) => idx === self.findIndex(t => t.code === item.code)
    );
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
        this.syncAssignIdFromName();  
      });
    } else if(type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
        this.taskInchargeEnabled = true;
        this.syncAssignIdFromName();  
      });
    } else if(type === 'RT-US') {
      let departmentsString = this.departmentIds;
      let roles = this.roleIds.length ? this.roleIds.join(',') : null;
      let department = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
      this.configurationService.getRoleUser('', roles, department).subscribe(res => {
        this.taskInchargeList = res.results;
        this.taskInchargeListRes = res.results;
        this.taskInchargeEnabled = true;
        this.syncAssignIdFromName();  
      })
    } else {
      this.taskInchargeList = [];
      this.taskInchargeEnabled = false;
    }
  }
  searchTaskUserNamelist(event, isReadOnly: boolean) {
    this.toHit = event.toHit;
    this.taskInchargeId = null;
    let type = this.taskForm.controls['assignType'].value;
    if (!isReadOnly) {
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
          let text = event.text;
          if(text.length == 0){
            text = ''
          }
          this.configurationService.getRecipientName(text, type).subscribe(res => {
            this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
            this.taskInchargeEnabled = true;
          });
        } else if (type === 'RT-DT') {
           let text = event.text;
          if(text.length == 0){
            text = null
          }
          this.commonService.getAllDepartments(text).subscribe(res => {
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
  }

    triggerAction(event){
      if(event.key === 'preview'){
        this.formBuilder(event.data)  
      }else if(event.key === 'view'){
        this.viewHistory(event.data)
      }else if (event.key === 'delete') {
        if (this.data.type !== 'modify') {
          const index = this.entityForms.findIndex(item => item.pfFormTemplateId === event.data.pfFormTemplateId);
          if (index !== -1) {
            this.entityForms.splice(index,1)
            this.ticketformBuilderSource = JSON.parse(JSON.stringify(this.entityForms)); 
          }
        } else {
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass:'confirmation-popup',
            data: {
              title: 'Confirmation', message: 'Are you sure you want to delete?',
              buttonText: { ok: 'Yes', cancel: 'No' }
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result == "Yes") {
              let formTempId = event.data?.id;
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
      }else if(event.key ==='edit'){
        if(event.data.deliveryDetails){
        this.editInventoryData(event.data)
        }else{
          this.remarks(event.data)
        }
      }else if (event.key === 'attachment'){
        this.getFileDownload(event.data)
      }
    }

    getFileDownload(element){
      const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
        { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
      });
    }

    getFormTemplateInfo(){
      const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
      const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
      const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
      const type = typeMap[entityType] || 'location';
      const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
      let entitType = "request"
      this.configurationService.getFormTemplates(this.taskForm.controls['formTemplateId'].value, this.data?.requestId, entitType, id, type).subscribe(res =>{
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
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
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
          postData["modifiedUser"] = null;
          postData["createdUser"] = localStorage.getItem(btoa('current_user'));
          postData["createdOn"] = new Date();
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
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
      if(this.data?.requestId != null){
      this.commonService.getFormDetails(this.data.requestId,'request').subscribe(res => {
        if (res.statusCode == 1) {
          let result = res.results.filter(res => res.status);
          this.ticketformBuilderSource = result.reverse();
        }else{
          this.ticketformBuilderSource = [];
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
      const identifyingValue =contextValue ==='PR-LC' ? this.assetData?.locationCategoryId: this.assetData?.assetTypeId ?? null;
      if(contextValue !== 'PR-AT') {
        this.loadAssociationBasedForms(formtemplateType,departmentId,identifyingType,identifyingValue);
        return
      }
      this.handleAssetFormTemplate(identifyingValue,departmentId,formtemplateType,identifyingType);
    }

  handleAssetFormTemplate(identifyingValue,departmentId,formtemplateType,identifyingType) {
    const hasValidInput = identifyingValue != null || this.taskData?.nonPerformerId != null;
      if (!hasValidInput) {
        const payload = [{
          entityType: 'pf_form_template',
          qualifier: 'Asset',
          identifyingType: null,
          identifyingId: null
        }];
        this.loadFormTemplate(payload);
        return
      }
        let manufacturer = this.assetData?.manufacturer ?? null;
        let modelNo = this.assetData?.modelId ?? null;
        const payload: any = [];
        if (identifyingValue !== null) {
          payload.push({
            entityType: 'pf_form_template',
            qualifier: 'Asset',
            identifyingType: 'assetType',
            identifyingId: identifyingValue
          })
        }
        if (departmentId !== null) {
          payload.push({
            entityType: 'pf_form_template',
            qualifier: 'Asset',
            identifyingType: 'department',
            identifyingId: departmentId
          })
        }
        if (manufacturer !== null && modelNo !== null && identifyingValue !== null) {
          payload.push({
            entityType: 'pf_form_template',
            qualifier: 'Asset',
            identifyingType: 'manufacturer_model_assetType',
            identifyingId: `${manufacturer}_${modelNo}_${identifyingValue}`
          })
        }
    if(payload?.length > 0) {
      this.loadFormTemplate(payload);
    } else {
      this.loadAssociationBasedForms(formtemplateType,departmentId,identifyingType,identifyingValue);
    }
  }

  loadFormTemplate(payload) {
    this.configurationService.getformTemplatesByEntityFilter(payload).subscribe(res => {
        if (res.statusCode == 1) {
          this.formTemplate = res.results.map(item => ({
          ...item,
          id: item.entityId,
          name: item.entityName
        }));
      }
    })
  }

  private loadAssociationBasedForms(formtemplateType,departmentId,identifyingType,identifyingValue) {
    this.configurationService.getEntityAssociatedForms('FS-PU',formtemplateType,'QLF-ASG',departmentId,identifyingType,identifyingValue).subscribe(res => {
      if(res.statusCode === 1){
        this.formTemplate = res.results;
      }
    })
  }
    
    getEntityDetails(callback?) {
      const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
      const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
      const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
      const type = typeMap[entityType] || 'location';
      const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
      if(id !=null){
        const fetchDetails = type === 'asset'? this.configurationService.getAllAsset(id): type === 'patient' ?  this.commonService.searchInpatient(null, id) : this.hospitalService.getLogicalLocationById(id);
        fetchDetails?.subscribe(res => {
          this.assetData = res.results[0];
          if (this.data?.type === 'modify' && this.taskData) {
            this.assetData = { ...this.assetData, ...this.taskData };
          }
          if (this.data?.type === 'modify') {// fallback to entitytaskworkflow  when even nonperformerId is null
            this.getTaskWorkflow(this.taskData);
          }
          this.getFormTemplate()
          if(callback)  callback();
        });
      }else{
        this.getFormTemplate();
        if (this.data?.type === 'modify') {// fallback to entitytaskworkflow  when even nonperformerId is null
          this.getTaskWorkflow(this.taskData);
        }
      }
    }
    
    formBuilder(data) {
      const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
      const typeMap = { 'PR-AT': 'asset', 'PR-LC': 'location', 'PR-PA': 'patient' };
      const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
      const type = typeMap[entityType] || 'location';
      const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
      if(data !== null) {
        this.formData = { "id" :data.id ,"parentId" : data?.id ? data?.parentId : id, "parentType": data?.id ? data?.parentType :type ,"entityId": data?.id ? data?.entityId : this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.assetData,"entityFormStatus":data['entityFormStatusId']};
      } else {
        const pfFormTemplateId = this.taskForm.controls['formTemplateId'].value;
        this.formData = { "id" : null, "parentId" :id, "parentType":type ,"entityId":this.data.requestId ? this.data.requestId : null, "entityType":"request", "pfFormTemplateId" : pfFormTemplateId, "content" : "form","entityData": this.assetData};
      }
      const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
        panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result != '' && result != null && result != undefined){
          if(this.data.requestId) {        
            this.entityForms=[result];
            this.editTask(this.data.requestId,'form')
          } else {
            this.taskForm.controls.formTemplateId.setValue(null)
            this.postFormData(result.pfFormTemplateId, result.name, result.entityFormStatusId,result.formValue)         
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
      const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
      this.formData = { "id" : data.id ,"parentId" :id, "parentType":type ,"entityId":this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.taskForm.value,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
      const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
        panelClass: ['fullscreen-form-dialog'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.formData = null;
        this.getFormDetails()
        this.getTaskDetails()
      });
    }

  getAllTktHist(id) {
    this.enableHistory = false;
    this.commonService.getPorterHistory(id).pipe(map(res => {
      if (res.statusCode !== 1) return [];
      return res.results.map(e => ({
        ...e, eventTime: e.eventTime ?
          this.dateFormat.transform(e.eventTime, 'dd/MM/yyyy hh:mm a') : '-',
        statusReasonName: e.statusReasonName != null ? e.statusReasonName : 'N/A',
        comments: e.comments != null ? e.comments : 'N/A',
      }));
    })).subscribe(data => {
      this.ticketEvents = [...data];
      this.enableHistory = this.ticketEvents?.length > 0 ? true : false;
    });
  }

  getTicketInventoryDetails(id){
    this.commonService.getTicketInventoryDetails(id).subscribe(res=>{
     if (res.results && res.results.length > 0) {
      this.dataSourceItem = res.results.map(item => {
      const firstDetail = item.deliveryDetails?.[0];
          if (firstDetail) {
              item.unitCost =
                firstDetail.serviceCost != null && firstDetail.serviceCost !== ''
                  ? firstDetail.serviceCost
                  : firstDetail.deliveryDetailUnitCost;
          }
          return item;
        });
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
  getItemSearch(event) {
    if (event.text.length >= 2) {
      if (event.toHit) {
        this.commonService.getItemSearch(this.assetTypeId,this.modelNo,event.text).subscribe((res) => {
          this.itemList = res.results.map(item => ({
            id: item.itemId,
            name: item.itemName
          }));
          this.itemLinked = this.itemList.length > 0;
        });
      }
    } else {
      this.itemList = [];
      this.itemLinked = false;
    }
  }
  
  getItemName(id) {
    if (id) {
      const itemName = this as any as { id: string, name: string }[]
      const itemId = itemName.find(obj => obj.id === id).name;
      return itemId;
    } else {
      return '';
    }
  }

  getBatchList(id){
    let type ;
    this.commonService.getItemType(id).subscribe(res =>{
      type = res.results.find(item => item.itemId === id);
      this.isServiceType = (type.itemTypeId === 'IT-SER')
      if(type.itemTypeId != 'IT-SER'){
      this.commonService.getBatchId(id).subscribe(res => {
          this.batchList = res.results;
          this.onBatchSelect(this.itemForm.controls.batchId.value)
        })
      }
    })
  }

  onBatchSelect(id){
    const selectedBatch = this.batchList.find(batch => batch.batchId === id);
    if (selectedBatch) {
      this.availableQuantity= selectedBatch.balanceQuantity;
      this.itemForm.controls['quantity'].setValidators([
        Validators.required,Validators.min(1),Validators.max(this.availableQuantity)
      ]);
      this.itemForm.controls['quantity'].updateValueAndValidity();
    } else {
      this.availableQuantity = null;
      this.itemForm.controls['quantity'].clearValidators();
      this.itemForm.controls['quantity'].setValidators([Validators.required, Validators.min(1)]);
      this.itemForm.controls['quantity'].updateValueAndValidity();
    }
  }

  totalCostCalculation() {
    const recalcCost = () => {
      const batchId = this.itemForm.get('batchId')?.value;
      const quantity = this.itemForm.get('quantity')?.value || 1;
      if (!batchId) return;
      const batch = this.batchList.find(b => b.batchId === batchId);
      if (!batch) return;
      const unitCost = batch.unitCost || 0;
      const totalCost = quantity * unitCost;
      this.itemForm.patchValue({ cost: totalCost }, { emitEvent: false });
    };
    this.itemForm.get('quantity')?.valueChanges.subscribe(recalcCost);
    this.itemForm.get('batchId')?.valueChanges.subscribe(recalcCost);
  }

  autoCostCalculation() {
    this.itemForm.get('quantity')?.valueChanges.subscribe(() => this.totalCostCalculation());
    this.itemForm.get('batchId')?.valueChanges.subscribe(() => this.totalCostCalculation());
    this.totalCostCalculation();
  }

  getAssetLoction(event){
    this.taskForm.get('destinationId').setValue(null);
    if(event.locationId){
      let locationId = event.locationId
      this.commonService.getLocationById(locationId).subscribe(res => {
        this.locationList = [res.results];
        this.locationEnabled = true;
        if (this.locationList.length) {
          let locationName = this.locationList[0].fullName;
          this.destinationId = locationId;
          this.taskForm.get('destinationId').setValue(this.destinationId);
        }
        this.taskForm.get('destinationId').updateValueAndValidity();
      });
    }
  }


  saveItem() {
    const controlValue = this.taskForm.controls.assetId.value;
    const id = this.data?.type !== 'modify' && typeof controlValue !== 'string' ? controlValue !=null : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
    const deliveryRequest: any = {
      approvedByUserId: null,
      comments: null,
      deliveryDetails: [
        {
          allocatedQuantity: this.itemForm.controls.quantity.value,
          deliveredDatetime: null,
          batchId: this.itemForm.controls.batchId.value,
          itemMasterId: this.editInventory ? this.editItemId : this.itemForm.controls.itemMasterId.value,
          requestedQuantity: this.itemForm.controls.quantity.value,
          status:true,
          unitCost : parseInt(this.itemForm.controls.cost.value),
          serviceCost : parseInt(this.itemForm.controls.serviceCost.value),
          comments : this.itemForm.controls.comments.value,
        }
      ],
      deliveryStatusId:"DLS-DLD",
      requestUserDepartmentId: Number(localStorage.getItem(btoa('departmentId'))),
      requestedByUserId: Number(localStorage.getItem(btoa('userId'))),
      status: true,
      requestId: this.data.requestId,
      assetId: id
    };

    if (this.editInventory) { 
      this.editInventory = false;
      deliveryRequest.id = this.editRequestId; 
      deliveryRequest.deliveryDetails[0].id = this.editdeliveryDetailsId;
      this.commonService.modifyRequestDelivery(this.editRequestId, deliveryRequest).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.getTicketInventoryDetails(this.data.requestId)
         this.itemForm.reset()
         this.itemForm.controls.quantity.setValue(1);
         this.editInventory = false;
         this.itemList =[];
         this.batchList=[];
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    } else {
      this.commonService.createRequestDelivery(deliveryRequest).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.getTicketInventoryDetails(this.data.requestId);
         this.itemForm.reset();
         this.itemForm.controls.quantity.setValue(1);
         this.editInventory = false;
         this.itemList=[];
         this.batchList=[];
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    } 
  }

  resetItemForm(){
     this.itemForm.controls.itemMasterId.setValue(null);
     this.itemForm.controls.batchId.setValue(null);
     this.itemForm.controls.quantity.setValue(1);
     this.itemForm.controls.cost.reset();
     this.itemForm.controls.serviceCost.reset();
     this.editInventory = false;
     this.itemList=[];
  }

  editInventoryData(data){
    this.editInventory = true;
    this.editId = data.deliveryDetails[0].id;
    this.editdeliveryDetailsId =data.deliveryDetails[0].id;
    this.editItemId = data.deliveryDetails[0].itemMasterId;
    this.itemBatchName = data.deliveryDetails[0].batchId;
    this.editRequestId = data.deliveryDetails[0].deliveryRequestId;
    const itemName=data.deliveryDetails[0].itemMasterName;
    this.workflowService.getAllIterm(null, itemName).subscribe(res => {
      this.itemList = res.results.filter(val => val.id == data.deliveryDetails[0].itemMasterId);
      this.selectedItemId = this.itemList[0].id;
      this.itemForm.controls.itemMasterId.updateValueAndValidity();
    })
    this.itemForm.patchValue({
      itemMasterId: data.deliveryDetails[0].itemMasterName,
      batchId:data.deliveryDetails[0].batchId,
      quantity: data.deliveryDetails[0].requestedQuantity,
      cost : data.deliveryDetails[0].unitCost,
      serviceCost : data.deliveryDetails[0].serviceCost
    });
    this.getBatchList(this.editItemId)
  }

  remarks(data){
          const dialogRef = this.dialog.open(ResourceRemarksComponent,
           {data: data, panelClass: ['confirmation-popup'], disableClose: true , height: '300px', width: '450px'
      });
       dialogRef.afterClosed().subscribe(result => {
        this.getAllTktHist(this.data.requestId);
       })
        }

  handleDocumentEvent(event) {
    this.attachFiles = [];
    this.attachFiles = event.attachFiles;
    const entityType = this.selectedTask ?? this.data?.['Context Id'] ?? this.taskData?.['requestCategory'];
    const typeMap = { 'PR-AT': 'Asset', 'PR-LC': 'Location', 'PR-PA': 'Patient' };
    const controlMap = { 'PR-LC': 'locationId', 'PR-AT': 'assetId', 'PR-PA': 'patientId' };
    const type = typeMap[entityType] || 'Location';
    const controlValue = this.taskForm.controls[controlMap[entityType]]?.value;
    const id = (this.data?.type !== 'modify'|| (this.data?.type == 'modify' && this.taskData?.nonPerformerId == null)) && typeof controlValue !== 'string' ? controlValue : (this.data?.nonPerformerId ?? this.taskData?.nonPerformerId ?? null);
    this.attachFiles = this.attachFiles.map(item => ({
      ...item,
      entityId: this.data?.requestId ?? null,
      entityType: 'Request',
      parentId: id,
      parentType: type
    }));
  }

  selectedActivitySchedule(code) {
    this.activityScheduleType = code;
    this.isDateTime = true
    let selectedStartDate = this.toDay;
    this.currentDate = this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd HH:mm');
    this.tomorrowDate = new Date(selectedStartDate.getTime() + 24 * 60 * 60 * 1000);
    if (code === 'SAT-BTM' || code === 'SAT-RGBT') {
      setTimeout(() => {
        this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd HH:mm'))
        this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(code === 'SAT-BTM' ? this.activityDuration ? 
          new Date(selectedStartDate.getTime() + this.activityDuration * 60 * 1000) : selectedStartDate : this.tomorrowDate, 
          (code === 'SAT-BTM' && this.activityDuration === null) ? 'yyyy-MM-dd 23:59' : 'yyyy-MM-dd HH:mm'));
      }, 200)
    } else {
      this.isDateTime = false
      this.tomorrowDate = new Date(selectedStartDate.getTime() + 24 * 60 * 60 * 1000);
      setTimeout(() => {
        this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedStartDate, 'yyyy-MM-dd'));
        this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(code === 'SAT-ATM' ? selectedStartDate : this.tomorrowDate, 'yyyy-MM-dd'));
      }, 200)
    }
  }

  getDateValue(event, type) {
    const inputElement = event.target as HTMLInputElement;
    let selectedDate = new Date(inputElement.value);
    this.tomorrowDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
    if (type === 'SAT-RGBT' || type === 'SAT-BTM') {
      this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedDate, 'yyyy-MM-dd HH:mm'));
      this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(this.activityScheduleType === 'SAT-BTM' ? this.activityDuration ? 
          new Date(selectedDate.getTime() + this.activityDuration * 60 * 1000) : selectedDate : this.tomorrowDate, 
          (this.activityScheduleType === 'SAT-BTM' && this.activityDuration === null) ? 'yyyy-MM-dd 23:59' : 'yyyy-MM-dd HH:mm'));
    } else if (type === 'SAT-RGAT' || type === 'SAT-ATM') {
      this.taskForm.get('scheduleEndTime').setValue(this.dateFormat.transform(this.tomorrowDate, 'yyyy-MM-dd'));
      this.taskForm.get('startDate').setValue(this.dateFormat.transform(selectedDate, 'yyyy-MM-dd'))
    }
  } 

  private formatScheduleDate(date: any): string | null {
    if (!date) return null;
    const format = this.isDateTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd 00:00:00';
    return this.dateFormat.transform(date, format);
  }


  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  onResize() {
    requestAnimationFrame(() => {
      const el = this.scrollContainer?.nativeElement;

      this.showLeftArrow = el.scrollLeft > 0;
      this.showRightArrow =
        el.scrollWidth > el.clientWidth &&
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    });
  }

  scrollLeft() {
    this.scrollContainer?.nativeElement.scrollBy({
      left: -250,
      behavior: 'smooth'
    });
  }

  scrollRight() {
    this.scrollContainer?.nativeElement.scrollBy({
      left: 250,
      behavior: 'smooth'
    });
  }

  onScroll() {
    this.updateArrows();
  }

  updateArrows() {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    this.showLeftArrow = el.scrollLeft > 0;
    this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  onLayoutToggle(type){
    const isGrid = type === 'grid';
    if (this.isGridView === isGrid) return;
    const preservedStatus = this.taskForm.get('statusId')?.value;
    this.taskForm.patchValue({
      categoryId: null,
      taskId: null,
      assignType: null,
      assignId: null,
      locationId: null,
      assetId: null,
      patientId: null,
      general: null,
      description: null,
      comments: null,
      destinationId: null
    });
    this.taskActivitiesList = [];
    this.locationList = [];
    this.assetList = [];
    this.patientList = [];
    this.taskInchargeList = [];
    this.taskInchargeEnabled = false;
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.clearValidators();
      this.taskForm.get(key)?.setErrors(null);
    });
    if (isGrid) {
      this.taskForm.get('statusId')?.setValidators([Validators.required]);
      this.taskForm.get('assignType')?.setValidators([Validators.required]);
      this.taskForm.get('assignId')?.setValidators([Validators.required, this.validateInchargeSelection.bind(this)]);
      this.taskForm.get('destinationId')?.setValidators([this.validateLocationSelection.bind(this)]);
      this.validateControl();
      if (this.gridMandatoryEnabled) {
        this.applyMandatoryFields();
      }
    } else {
      this.validateControl();   
      this.applyMandatoryFields();   
    }

    if (preservedStatus) {
      this.taskForm.get('statusId')?.setValue(preservedStatus, { emitEvent: false });
    } else {
      const roleId = localStorage.getItem('roleId');
      const isTaskRoutine = (this.selectedRoutineTypeId === 'TAC-TKT' && this.ticketStatusFlow === 'Task') || this.selectedRoutineTypeId === 'TAC-TASK';
      let defaultStatus = isTaskRoutine ? (this.taskStatus?.defaultStatus || 'RQ-NEW') : (this.nonTaskStatus?.defaultStatus || 'RQ-CR');
      this.taskForm.get('statusId')?.setValue(defaultStatus, { emitEvent: false });
    }
    if (this.taskData?.statusId) {
      this.displayStatus(this.taskData.statusId, this.taskData.performerType, this.taskData.routineTypeId);
    } else {
      const currentStatus = this.taskForm.get('statusId')?.value;
      if (currentStatus) {
        this.displayStatus(currentStatus, null, this.selectedRoutineTypeId);
      }
    }
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
    this.taskForm.markAsPristine();
    this.taskForm.markAsUntouched();
    this.isGridView = isGrid;
  }
  
  onCategorySelect(category){
    this.taskForm.patchValue({ categoryId: category.code, taskId: null });
    this.getTaskList(this.selectedRoutineTypeId, category.code);
  }

  onTaskSelect(task) {
    this.taskForm.patchValue({ taskId: task.id });
    this.selectedTaskActivity({ value: task.id });
    const assignType = this.taskForm.get('assignType')?.value;
    if (assignType) {
      this.getTaskIncharge(assignType);
    }
  }

  getDynamicFieldLabel(){
    switch (this.selectedTask) {
      case 'PR-AT': return 'Asset';
      case 'PR-LC': return 'Location';
      case 'PR-PA': return 'Patient';
      default: return 'Name';
    }
  }

  isDynamicFieldInvalid() {
    if (this.selectedTask === 'PR-AT') {
      return this.taskForm.get('assetId')?.touched && this.taskForm.get('assetId')?.invalid;
    }
    if (this.selectedTask === 'PR-LC') {
      return this.taskForm.get('locationId')?.touched && this.taskForm.get('locationId')?.invalid;
    }
    if (this.selectedTask === 'PR-PA') {
      return this.taskForm.get('patientId')?.touched && this.taskForm.get('patientId')?.invalid;
    }
    return false;
  }
  
  getTaskAssignListBind = (id: any): string => {
    if (!id || !this.taskInchargeList?.length) return '';
    const matched = this.taskInchargeList.find(item => item.id === id);
    return matched ? matched.name : '';
  }

  private readonly categoryIconMap: Record<string, string> = {
    'AC-AMC': 'verified',
    'AC-PMS': 'autorenew',
    'AC-COR': 'build',
    'AC-CAL': 'straighten',
    'AC-EST': 'bolt',
    'AC-HAZ': 'warning',
    'AC-WAR': 'verified_user',
    'AC-OT': 'more_horiz',
    'AC-QCAP': 'fact_check',
    'AC-REAP': 'assignment_return',
    'AC-GEXP': 'logout',
    'AC-GPENP': 'vpn_key',
    'AC-NUR': 'medical_services',
    'AC-AID': 'local_hospital',
    'AC-FB': 'restaurant',
    'AC-HK': 'cleaning_services',
    'AC-PR': 'sentiment_satisfied',
    'AC-BILL': 'receipt_long',
    'AC-DOC': 'stethoscope',
    'AC-SEC': 'security',
    'AC-IT': 'computer',
    'AC-LAB': 'science',
    'AC-PHA': 'medication',
    'AC-ADM': 'admin_panel_settings',
    'AC-ENV': 'eco',
    'AC-LOG': 'local_shipping',
    'AC-PUR': 'shopping_cart',
    'AC-TRN': 'school',
    'AC-WST': 'delete',
    'AC-GAT': 'lock_open',
    'AC-MOV': 'move_up',
    'AC-INF': 'coronavirus',
    'AC-LND': 'local_laundry_service',
    'AC-ENG': 'engineering',
    'AC-FAC': 'home_repair_service',
    'AC-FIN': 'payments',
    'AC-HR': 'group',
    'AC-MTG': 'meeting_room',
    'AC-PRK': 'local_parking',
    'AC-SAN': 'sanitizer',
    'AC-WAT': 'water_drop',
    'AC-LIN': 'bed',
    'AC-ISO': 'shield',
    'AC-BIO': 'biotech',
    'AC-RAD': 'camera_alt',
    'AC-THE': 'healing',
    'AC-DNT': 'face',
    'AC-EYE': 'visibility',
    'AC-ENT': 'hearing',
    'AC-CRD': 'favorite',
    'AC-ORT': 'accessible',
    'AC-GYN': 'pregnant_woman',
    'AC-PED': 'child_care',
    'AC-PSY': 'mood',
    'AC-DER': 'palette',
    'AC-NEP': 'opacity',
    'AC-PUL': 'air',
    'AC-GST': 'assignment',
    'AC-END': 'monitor_weight',
    'AC-NRL': 'psychology',
    'AC-OPH': 'remove_red_eye',
    'AC-OTO': 'record_voice_over',
    'AC-URO': 'water',
    'AC-VAS': 'favorite_border',
  };

  private fallbackIcon(index: number): string {
    const safe = ['list_alt', 'assignment', 'task', 'check_circle', 'radio_button_unchecked', 'star', 'favorite', 'home', 'search', 'settings', 'info', 'help', 'build', 'delete', 'add', 'done', 'menu'];
    return safe[Math.abs(index) % safe.length];
  }

  private getCategoryIcon(code: string, index = -1): string {
    if (this.categoryIconMap[code]) {
      return this.categoryIconMap[code];
    }
    return this.fallbackIcon(index);
  }

  private readonly taskIconKeywords: [RegExp, string][] = [
    [/inspector|inspect|check|exam|audit|review/i, 'check_circle'],
    [/clean|wash|sanitize|disinfect|housekeep|janitor|mop|scrub/i, 'refresh'],
    [/repair|fix|corrective|breakdown|restore/i, 'build'],
    [/maintain|preventive|pms|service|overhaul|tune.?up/i, 'refresh'],
    [/calibrat|tune|adjust|alignment/i, 'settings'],
    [/electrical|wiring|power|volt|energy|circuit|breaker/i, 'build'],
    [/plumb|water|drain|pipe|faucet|toilet|sink/i, 'build'],
    [/hvac|cooling|heating|ac |air.?cond|ventilation|furnace/i, 'settings'],
    [/paint|color|coating|wallpaper|plaster/i, 'build'],
    [/safety|hazard|fire|emergency|evacuat|drill/i, 'warning'],
    [/warranty|guarantee/i, 'check_circle'],
    [/deliver|logistic|transport|shifting|porter|courier/i, 'local_shipping'],
    [/install|setup|deploy|commission|assembl/i, 'build'],
    [/nurse|patient|bedside|care|call\s*bell|round/i, 'local_hospital'],
    [/food|meal|kitchen|diet|nourish|cater|breakfast|lunch|dinner/i, 'star'],
    [/doctor|physician|clinical|medic|surgery|operation/i, 'local_hospital'],
    [/bill|invoice|payment|finance|cost|budget|expense/i, 'description'],
    [/document|paper|record|file|attachment|folder|archive/i, 'description'],
    [/approve|authorize|signoff|review|accept|endorse/i, 'check_circle'],
    [/transfer|relocate|move|shift|relocate|migrate/i, 'arrow_forward'],
    [/purchase|procure|order|buy|requisition|vendor/i, 'shopping_cart'],
    [/request|inquire|query|ask|submit|raised/i, 'assignment'],
    [/train|educate|workshop|learn|teach|orientation/i, 'school'],
    [/report|audit|analysis|analytic|statistic|metric/i, 'assessment'],
    [/waste|disposal|garbage|trash|recycl/i, 'delete'],
    [/gate\s*pass|entry|exit|gatepass|access/i, 'lock_open'],
    [/asset|equipment|device|machine|tool|instrument/i, 'build'],
    [/general|other|misc|miscellaneous|generic/i, 'more_horiz'],
    [/security|guard|patrol|surveillance|camera/i, 'security'],
    [/it |computer|laptop|printer|network|server|software|hardware/i, 'computer'],
    [/lab|test|sample|specimen|culture/i, 'school'],
    [/pharmacy|drug|medication|prescription|dispense/i, 'local_hospital'],
    [/admin|office|clerk|secretary|desk/i, 'settings'],
    [/environment|green|sustain|eco|garden|landscap/i, 'star'],
    [/logistic|fleet|vehicle|driver|dispatch/i, 'local_shipping'],
    [/inventory|stock|supply|warehouse|store|material/i, 'description'],
    [/replacement|replace|spare|renew|substitute|swap/i, 'refresh'],
    [/oxygen|nitrogen|gas|cylinder|ventilator|respirator/i, 'star'],
    [/change|alter|modify|update|upgrade|revise/i, 'refresh'],
    [/daily|routine|checklist|todo|tasklist/i, 'assignment'],
    [/barcode|qrcode|qr.?code|tag|label|serial/i, 'assignment'],
    [/visit|round|walkthrough|tour|site|inspection.?round/i, 'person'],
    [/laundry|linen|uniform|garment|fabric/i, 'refresh'],
    [/engineer|technical|mechanical|mechanic/i, 'build'],
    [/facility|build|infrastructure|dorm|room/i, 'build'],
    [/finance|account|audit|tax|payroll|ledger/i, 'account_balance'],
    [/hr |human.?resource|hire|recruit|staff|personnel/i, 'group'],
    [/meeting|conference|seminar|gather|brief/i, 'business'],
    [/parking|valet|garage/i, 'local_parking'],
    [/sanitation|hygiene|soap|hand.?wash/i, 'check_circle'],
    [/water|irrigation|sprinkler|plumbing/i, 'star'],
    [/bed|mattress|pillow|sheet|furniture/i, 'star'],
    [/isolation|quarantine|contain/i, 'security'],
    [/bio|hazard.?waste|medical.?waste/i, 'school'],
    [/radiology|xray|x.?ray|imaging|scan|mri/i, 'favorite'],
    [/therapy|rehab|physical|occupational|speech/i, 'local_hospital'],
    [/dental|dentist|teeth|oral/i, 'face'],
    [/eye|vision|optometr|ophthalm/i, 'visibility'],
    [/cardio|heart|cardiac|bp|blood.?pressure/i, 'favorite'],
    [/ortho|bone|joint|fracture|cast/i, 'person'],
    [/pediatric|child|baby|infant|newborn/i, 'person'],
    [/psych|mental|behavior|counsel|therapy/i, 'face'],
    [/diet|nutrition|meal.?plan|calorie/i, 'star'],
    [/weight|scale|weigh/i, 'assessment'],
    [/ent |ear|nose|throat|hearing/i, 'settings'],
    [/uro|kidney|bladder|renal/i, 'star'],
    [/vascula|vein|artery|blood.?flow/i, 'favorite'],
  ];

  getGridIcon(name: string, isCode = false, index = -1): string {
    if (!name) return 'list_alt';
    name = name.trim();
    if (isCode) {
      return this.getCategoryIcon(name, index);
    }
    const lower = name.toLowerCase();
    for (const [pattern, icon] of this.taskIconKeywords) {
      if (pattern.test(lower)) {
        return icon;
      }
    }
    return this.fallbackIcon(index);
  }

  getGridIconColor(index: number): string {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  }

  getCategoryName(code) {
    const cat = this.categoryList?.find(c => c.code === code);
    return cat ? cat.value : '';
  }

  getTaskName(id){
    const task = this.taskActivitiesList?.find(t => t.id === id);
    return task ? task.name : '';
  }

  private syncAssignIdFromName(){
    const currentValue = this.taskForm.get('assignId')?.value;
    if (currentValue && typeof currentValue === 'string') {
      const matched = this.taskInchargeList.find(item => item.name === currentValue);
      if (matched) {
        // Only update if the value is still the same name (avoid race conditions)
        if (this.taskForm.get('assignId')?.value === currentValue) {
          this.taskForm.patchValue({ assignId: matched.id });
        }
      }
    }
  }

  saveTask(canCreate?: boolean) {
    this.isLoading = true;
    let locationId = typeof this.taskForm.controls['locationId'].value === 'string' ? this.locationId : this.taskForm.controls['locationId'].value
    let assetId = typeof this.taskForm.controls['assetId'].value === 'string' ? this.assetId : this.taskForm.controls['assetId'].value;
    let patientId = typeof this.taskForm.controls['patientId'].value === 'string' ? this.patientId : this.taskForm.controls['patientId'].value;
    let performerId = this.selectedTask === 'PR-LC' ? locationId : this.selectedTask === 'PR-AT' ? assetId : this.selectedTask === 'PR-PA' ? patientId : null;
    let destinationId = typeof this.taskForm.controls['destinationId'].value === 'string' ? this.destinationId : this.taskForm.controls['destinationId'].value;
    this.taskForm.controls['patientId'].value;
    this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null,null,null);
    this.createTask.pfActivityId = this.taskForm.controls['taskId'].value;
    this.createTask.comments = this.taskForm.controls['description'].value;
    this.createTask.remarks = this.taskForm.controls['comments'].value;
    this.createTask.type = this.data.requestedType;
    this.createTask.requestCategory = this.selectedTask;
    this.createTask.scheduleActivityTypeId = this.taskForm.controls['scheduleTypeId'].value
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
    this.createTask.statusReasonId = this.hideRemarks ? null : this.taskForm.controls['actionTypeId'].value;
    this.createTask.status = this.taskForm.controls['statusId'].value;
    if(this.isAcknowledge){
      this.createTask.acknowledgedById = this.taskData?.acknowledgedById ?? this.loginUserId ? Number(this.loginUserId) : null;
    }
    if(this.data.hasOwnProperty('page') && this.data.page === 'nurseCall'){
      this.createTask.srcIdentifyingType = 'iot_alert';
      this.createTask.srcIdentifyingId = this.data.iotAlertId;
    }
    if(this.data.requestedType === 'RQT-WRK'){
      this.createTask.parentId = this.data.requestId;
    }
    if(canCreate) {
      this.createTask.canCreate = true;
    }

    // this.createTask.configValue = null;
    console.log(this.createTask)
    if (this.isGridView) {
      const allowedKeys = [
        'pfActivityId',
        'comments',
        'description',
        'remarks',
        'type',
        'requestCategory',
        'performer',
        'nonPerformer',
        'status',
        'destinationId',
        'scheduleStartTime',
        'startTime',
        'scheduleActivityTypeId',
        'canCreate'
      ];

      Object.keys(this.createTask).forEach(key => {
        if(key ==='scheduleActivityTypeId'){
          this.createTask['scheduleActivityTypeId'] = "SAT-ATM";
        }else if (!allowedKeys.includes(key)) {
          this.createTask[key] = null;
        }
      });
    }
    this.commonService.saveTask(this.createTask).subscribe(async res => {
        if (res.statusCode === 1) {
          this.isLoading = false;
          this.toastr.success('Success', `${res.message}`);
          if(this.isReminderEdited){
            this.entityConfigType = 'request';
            const data = res.results;
            data['dataType'] = 'create'
            data['id'] = data.requestId;
            this.taskByreminderData = data;
          }
          // Based on entityforms length formData are saved during create time of task
            if (this.entityForms?.length !== 0 && res.results?.requestId) {
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
                this.isLoading = false;
                this.thisDialogRef.close('confirm');
                this.onDialogClose();
              } catch (error) {
                this.isLoading = false;
                console.log(error);
              }
            }else {
            this.isLoading = false;
            this.thisDialogRef.close('confirm');
            this.onDialogClose();
          }
        }
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
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
        } else if(error.error.errorCode === "TWAPI54"){
          this.isLoading = false;
          this.toastr.warning('Warning', `${error.error.message}`);
        } else {
          this.isLoading = false;
          this.toastr.error('Error', `${error.error.message}`);
        }
      });
  }

  editTask(id?,type?,approval?) {
    this.isLoading = true;
    let locationId = typeof this.taskForm.controls['locationId'].value === 'string' ? this.locationId : this.taskForm.controls['locationId'].value;
    let assetId = typeof this.taskForm.controls['assetId'].value === 'string' ? this.assetId : this.taskForm.controls['assetId'].value;
    let patientId = typeof this.taskForm.controls['patientId'].value === 'string' ? this.patientId : this.taskForm.controls['patientId'].value;
    let performerId = this.selectedTask === 'PR-LC' ? locationId : this.selectedTask === 'PR-AT' ? assetId : this.selectedTask === 'PR-PA' ? patientId : null;
    let destinationId = typeof this.taskForm.controls['destinationId'].value === 'string' ? this.destinationId : this.taskForm.controls['destinationId'].value;
    this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null, null,null,null,null,null);
    this.createTask.pfActivityId = this.taskForm.controls['taskId'].value;
    this.createTask.title = this.taskForm.controls['general'].value;
    this.createTask.comments = this.taskForm.controls['description'].value;
    this.createTask.remarks = this.taskForm.controls['comments'].value;
    this.createTask.type = this.taskData.requestTypeId;
    this.createTask.requestCategory = this.selectedTask;
    this.createTask.scheduleActivityTypeId = this.taskForm.controls['scheduleTypeId'].value
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
    this.createTask.statusReasonId = this.taskForm.controls['actionTypeId'].value;
    this.createTask.attachFiles = this.attachFiles;
    this.createTask.entityForms = this.entityForms;
    this.createTask.ticketId = id ? id : null;
    if(this.taskData.requestTypeId === 'RQT-WRK'){
      this.createTask.parentId = this.taskData.parentId;
    }
    if(this.isAcknowledge){
      this.createTask.acknowledgedById = this.taskData?.acknowledgedById ?? this.loginUserId ? Number(this.loginUserId) : null;
    }
    if(this.createTask.status == 'RQ-ROP' && this.activate_btn.includes('BT_TMOP')){
      this.createTask['resourceCode'] = 'BT_TMOP';
    }
    if(this.workflowLevelIdExists){
        const isApprove = approval === true;
        const isRejectOrReturn = ['RQ-RJ','RQ-RTN'].includes(approval);
        let statusId = this.taskForm.controls.statusId.value;
        let selectedWorkflow = null;
        if (isRejectOrReturn && this.matchedWorkflowLevel?.options?.status) {
          const mappedStatus = this.matchedWorkflowLevel.options.status[approval];
          if (mappedStatus) {
            statusId = mappedStatus?.entityStatus;
            selectedWorkflow = mappedStatus.level != null ? Number(mappedStatus?.level): null;
          }
        }
        if (isApprove) {
          selectedWorkflow = this.matchedWorkflowLevel;
        }
        this.createTask.status = statusId;
        const levelDescription = this.matchedWorkflowLevel?.comments || '';
        const comment = this.taskForm.controls['comments']?.value || null;
        const remarks = isApprove ? [levelDescription?.trim(), comment?.trim()].filter(Boolean).join(' - ') : comment;
        this.createTask.remarks = remarks;
        this.createTask['workflowLevelId'] = isApprove ? this.workflowLevelId : selectedWorkflow || null;
        this.createTask['approval']= approval ? {
          statusId: isApprove ? this.matchedWorkflowLevel?.entityStatusId : approval,
          id: this.matchedWorkflowLevel?.id,
          identifyingType: 'RT-US' ,
          identifyingId: this.loginUserId,
          comments: this.matchedWorkflowLevel?.comments ?? null,
          // remarks: remarks
        } : {};
    }
    console.log(this.createTask);
    this.commonService.editTask(this.data.requestId, this.createTask).subscribe(res => {
      if (res.statusCode === 1) {
        this.isLoading = false;
        this.toastr.success('Success', `${res.message}`);
        if(this.isReminderEdited){
          this.hitReminerView = true;
          this.entityConfigType = 'request';
          const data = res.results;
          data['id'] = this.data.requestId;
          data['dataType'] = 'update'
          this.taskByreminderData = data;
        }
        this.attachFiles = [];
        this.taskForm.reset();
        if(type == 'form') {
          this.isLoading = false;
          this.getTaskDetails();
          this.onDialogClose();
        } else {
          this.isLoading = false;
          this.thisDialogRef.close('confirm');          
          this.onDialogClose()
        }
      }
      this.isLoading = false;
    },
      error => {
        this.isLoading = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  onDialogClose(){ // To trigger delete existing data in angular service 
    this.sessionService.deleteAttachFiles()
  }
  fixClick() {
    console.log('')
  }
}
