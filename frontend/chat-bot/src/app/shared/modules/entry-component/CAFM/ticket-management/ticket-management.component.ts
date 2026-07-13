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
import { Component, Inject, Input, OnInit, Optional, ViewChild } from '@angular/core'
import { routerTransition } from '../../../../../router.animations';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService, ConfigurationService, WorkflowService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TaskManagmentComponent } from '../../task-managment/task-managment.component';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { EventStatusTrackingComponent } from '../../event-status-tracking/event-status-tracking.component';
import { AppToastService } from '../../../../services/toaster.service';
import { ManageAssetComponent } from '../../manage-asset/manage-asset.component';
import { GatePassComponent } from '../../gate-pass/gate-pass.component';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { LookupTermService } from '../../../../lookup-term.service';

@Component({
  selector: "app-ticket-management",
  templateUrl: "./ticket-management.component.html",
  styleUrls: ["./ticket-management.component.scss"],
  animations: [routerTransition()],
})
export class TicketManagementComponent implements OnInit {
  public activate_btn: any;
  public today = new Date();
  public ticketDataSource : any =[];
  public displayedColumns = [];
  public displayedData = []
  public ticketStatusOptions = [];
  @Input() entityData: any;
  @Input() requestType: any = 'ticket';
  @Input() nestedView: any = false;
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageStart = 0;
  pageSize = 10;
  expandedRow: any = null;
  totalParentRecords = 0;
  currentStatus = [];
  isParentRow = (_: number, row: any) => !row.detailRow;
  isDetailRow = (_: number, row: any) => row.detailRow;
  public iconColumns=['Edit','Date','View']
  @Input() disableEditPermission= true;
  loginUserId = localStorage.getItem(btoa('userId'));
  roleId = localStorage.getItem('userlevel');
  private prevStatus = [];
  public showActions=[];
  selectedAction = null;
  ticketStatusFlow = 'non-task';
  public ticketdisplayedColumns = ['ID','Category','Activity','Date','Status','Created by','Modified by','Assigned To','View'];
  public ticketdisplayedData = ['requestIdentifier','activityCategoryName','activityName','scheduleStartTime','statusName','userName','modifiedByName','performerName',''];
  public workOrderdisplayedColumns = ['Identifier','Ticket Id','Category','Activity','Date','Status','Created by','Modified by','Assigned To','View'];
  public workOrderdisplayedData = ['requestIdentifier','parentIdentifier','activityCategoryName','activityName','scheduleStartTime','statusName','userName','modifiedByName','performerName',''];
  public allColumns = ['expand','type', ...this.ticketdisplayedColumns];

  constructor(
      public form: FormBuilder,
      public dialog: MatDialog,
      protected sanitizer: DomSanitizer,
      public toastr: AppToastService,
      public snackbar: MatSnackBar,
      @Optional() public thisDialogRef: MatDialogRef<any>,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly commonService: CommonService,
      private readonly dateFormat: DatePipe,
      private readonly workflowService: WorkflowService,
      private readonly configurationService : ConfigurationService,
      private readonly lookupService : LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button'),
    this.getPermissionDropDown()
    this.today.setDate(this.today.getDate());
  }
    
  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission?.dropdown || [];
    const taskAction = dropdown?.filter(x => x.page === 'Task');
    const createActionCodes = ['WD_TA_TKT', 'WD_TA_TASK'];
    const createActions = taskAction?.filter(item =>createActionCodes.includes(item.code));
    const mapAction = (list: any[]) =>list.map(x => ({ code: x.code, value: x.name }));
    this.showActions.push(...mapAction(createActions));
  }
    
  ngOnInit() {
   this.loadStatusOptions();
  }

  private loadStatusOptions() {
    this.commonService.getConfigFile('request-config').pipe(switchMap(configRes => {
        if (configRes?.results) {
          const configData = configRes.results['contentObject'];
          this.ticketStatusFlow = configData?.['TAC-TKT']? configData['TAC-TKT'] : 'non-task';
          this.ticketdisplayedColumns= configData?.ticketdisplayedColumns ?? this.ticketdisplayedColumns;
          this.ticketdisplayedData = configData?.ticketdisplayedData ?? this.ticketdisplayedData;
          this.workOrderdisplayedColumns = configData?.workOrderdisplayedColumns ?? this.workOrderdisplayedColumns;
          this.workOrderdisplayedData = configData?.workOrderdisplayedData ?? this.workOrderdisplayedData;
          this.allColumns = this.ticketdisplayedColumns? ['expand','type', ...this.ticketdisplayedColumns] : this.allColumns;
        }
        return this.lookupService.getAppTermsWrapper('RequestStatus');
      })
    ).subscribe(res=> {
      const allowedCodes = this.getAllowedStatusCodes();
      const filtered = res?.RequestStatus.filter(r =>allowedCodes.includes(r.code)) ?? [];
      this.ticketStatusOptions = [{ code: 'all', value: 'All' },...filtered];
      this.currentStatus = this.ticketStatusOptions.map(o => o.code);
      this.prevStatus = [...this.currentStatus];
      this.onEventChange();
    });
  }

  private getAllowedStatusCodes(){
    const workOrderStatusCodes = ['RQ-PEN', 'RQ-CR', 'RQ-IP','RQ-CO','RQ-CA'];
    const taskStatusCodes = ['RQ-NEW', 'RQ-OP','RQ-IP','RQ-PEN','RQ-CL','RQ-CO'];
    if (this.requestType === 'workOrder') {
      return workOrderStatusCodes;
    }else {
      const hasTask = this.hasAction('WD_TA_TASK');
      const hasTicket = this.hasAction('WD_TA_TKT');
      let ticketStatus = [];
      if (hasTicket) {
        ticketStatus = this.ticketStatusFlow === 'Task'? taskStatusCodes: workOrderStatusCodes;
      }
      if (hasTask) {
        ticketStatus =[...ticketStatus, ... taskStatusCodes];
      }
      return ticketStatus;
    }
  }

  private hasAction(code: string){
    return this.showActions?.some(a => a.code === code);
  }

  triggerAction(event)  {
    if(event.key === 'edit'){
      this.createTicket({...event.data, 
        type : event? event.type : this.requestType
      });
    } else if (event.key === 'report') {
      this.getReportLayout(event.data);
    } else if (event.key ==='view'){
      this.getTaskHistory(event.data);
    } else if(event.key ==='TicketId'){
      this.openTicket(event.data);
    }
  }

  onCreateAction(code: string | null){
    if (!code) {
      return;
    }
    this.selectedAction=code === 'WD_TA_TASK'? 'TAC-TASK': 'TAC-TKT';
    this.createTicket(null, this.selectedAction);
  }

  createTicket(data ,routinetype?) {
    if(this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true){
      if(data?.activityCategoryId ==='AC-QCAP' || data?.activityCategoryId === 'AC-REAP'){
        this.navigateToTransfer(data);
        return
      }
      if(data?.activityCategoryId =='AC-GEXP'|| data?.activityCategoryId =='AC-GPENP'|| data?.activityCategoryId =='AC-GEXP'){
        this.navigateToGatepass(data);
        return
      }
    }
    let ticketData
    let rowclick = data;
    let  type = this.entityData.entityType.toLowerCase();
    let contextId = this.entityData.entityType == 'Asset'? 'PR-AT': 
    this.entityData.entityType == 'Patient'? 'PR-PA' : 
    this.entityData.entityType == 'Location' ? 'PR-LC' : 'PR-GN'
    if(rowclick !== null) {
      ticketData = { "id" :null , "requestId":rowclick.requestId, "nonPerformerId" : this.entityData.entityId, "data": rowclick, "entityDetail" : this.entityData.entityDetails,"type":'modify', "contextType":contextId,'formTemplateType':this.entityData.formTemplateType};
    } else {
      ticketData = { "id" :null , "nonPerformerId" : this.entityData.entityId, "entityDetail" : this.entityData.entityDetails,"type":type,"contextType":contextId,"formTemplateType":this.entityData.formTemplateType};
    }
    ticketData['requestedType'] = 'RQT-TASK';
    ticketData['routineTypeId'] = routinetype;
    if((data?.type ?? this.requestType) =='workOrder'){
      ticketData['requestedType'] ='RQT-WRK';
      ticketData['routineTypeId'] = 'TAC-WOR'
    }
    if(this.entityData.hasOwnProperty('reqType')) {
        if(data && data.parentId !== null){
          ticketData['requestId'] = data.requestId;
          ticketData['parentId'] = data.parentId;
        } else {
          ticketData['requestId'] = this.entityData['reqDetail'].requestId;
        }
        ticketData['routineTypeId'] = 'TAC-WOR'
        ticketData['reqDetails'] = this.entityData['reqDetail'];
        ticketData['requestedType'] = this.entityData['reqType'];
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent,
      { data: ticketData,panelClass: ['large-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.onEventChange();
    });
  }
  getReportLayout(data) {
    data['content'] = 'layout'
    data['linkedResourceCode'] = data['requestTypeId'] == 'RQT-WRK' ? 'BT_WRKRQRPT' : 'BT_TKTRQRPT';
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: false });
  }

  onEventStatusChange(selected) {
    const ALL = 'all';
    const allKeys = this.ticketStatusOptions.map(o => o.code);
    const subKeys = allKeys.filter(k => k !== ALL);
    const hadAllBefore = this.prevStatus.includes(ALL);
    const hasAllNow = selected.includes(ALL);

    if(!hadAllBefore && hasAllNow) {
      this.currentStatus = [...allKeys];
    }else if (hadAllBefore && !hasAllNow) {
      this.currentStatus = [];
    }else if (hadAllBefore && selected.filter(s => s !== ALL).length < subKeys.length) {
      this.currentStatus = selected.filter(s => s !== ALL);
    }else if (subKeys.every(k => selected.includes(k))) {
      this.currentStatus = [...allKeys];
    }else {
      this.currentStatus = selected.filter(s => s !== ALL);
    }
    this.prevStatus = [...this.currentStatus];
    this.onEventChange();
  }
  
  onEventChange(){
    this.selectedAction = null;
    let contextType = this.entityData.entityType == 'Asset'? 'PR-AT': this.entityData.entityType == 'Patient'? 'PR-PA' : this.entityData.entityType == 'Location' ? 'PR-LC' : 'PR-GN';
    let entityValue = this.requestType==='workOrder'? 'RQT-WRK':'RQT-TASK';
    this.displayedColumns = this.requestType==='workOrder'? this.workOrderdisplayedColumns: this.ticketdisplayedColumns;
    this.displayedData = this.requestType==='workOrder'? this.workOrderdisplayedData: this.ticketdisplayedData;
    if(this.nestedView) {
      this.getNestedEntityData(this.pageStart, this.pageSize);
      return;
    }
    const{ reqType, parentId } = this.getRequestDetails();
    if (reqType !== 'RQT-WRK') {
      this.loadTaskHistory(contextType, entityValue);
    } else {
      this.loadWorkOrderTasks(reqType, parentId);
    }
  }
  
  getRequestDetails() {
    let reqType = 'RQT-TASK';
    let parentId = null;
    if(this.entityData.hasOwnProperty('reqType')) {
      reqType = this.entityData.reqType;
      parentId = this.entityData?.reqDetail?.requestId;
    }
    return { reqType, parentId };
  }

  loadTaskHistory(contextType, entityValue) {
      const statusValue = this.getStatus();
      this.workflowService.getEntityTaskHistory(this.entityData?.entityId, contextType,entityValue,statusValue).subscribe(res=>{
        this.ticketDataSource = res.results.map(item => ({
          ...item,
          editPermission: this.getEditPermission(item)
        }));
        this.ticketDataSource.sort = this.sort;
      });
  }

  loadWorkOrderTasks(reqType, parentId) {
      let status = this.getStatus();
      let selectedToDate = this.dateFormat.transform(this.today, 'yyyy-MM-dd')
      let context = this.entityData.reqDetail?.requestCategoryId
      this.displayedColumns = this.ticketdisplayedColumns;
      this.displayedData = this.ticketdisplayedData;  
      this.workflowService.getAllTask(null, selectedToDate, context, status, null, null, null, reqType, null, null, this.pageStart, this.pageSize, parentId).subscribe((res) => {
        const hasActualTime = res.results?.some(item => item.hasOwnProperty('actualTime') && item.actualTime !== undefined);
          this.ticketDataSource = res.results.map(item => ({
          ...item,
          actualTime: hasActualTime ? item.actualTime : item.scheduleDate,
          editPermission: this.getEditPermission(item)
        }));
        this.ticketDataSource.sort = this.sort;
      });
  }

  getTaskHistory(data) {
    this.workflowService.getTaskById(data.requestId).subscribe((res) => {
      let taskData = res.results[0];
      this.dialog.open(EventStatusTrackingComponent, {
        data: taskData,
        panelClass: ['medium-popup'],
        disableClose: true,
      });
    })
  }
  
  openTicket(data){
    const ticketData = {
      requestId: data?.parentId,
      type: 'modify',
      requestedType:'RQT-TKT'
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent, {
      data: ticketData,
      panelClass: ['large-popup'],
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.onEventChange();
    });
  }
  
  fixClick(){
    console.log('')
  }

  toggleExpand(row) {
    this.ticketDataSource = this.ticketDataSource.filter(r => !r.detailRow);
    if(this.expandedRow === row) {
      this.expandedRow = null;
    } else {
      this.expandedRow = row;
      const index = this.ticketDataSource.indexOf(row);
      const detailRow: any = { detailRow: true, workOrders: row.workOrders || [] };
      this.ticketDataSource.splice(index + 1,0,detailRow);
    }
  }

  isExpanded(row){
    return this.expandedRow === row;
  }

  onPageChange(event) {
    this.pageStart = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getNestedEntityData(this.pageStart,this.pageSize)
  }

  getNestedEntityData(pageStart,pageSize){
    let status = this.getStatus()
    this.displayedColumns = this.ticketdisplayedColumns
    this.displayedData = this.ticketdisplayedData;
    this.workflowService.getEntityTaskNestedView(this.entityData?.entityId, this.entityData?.entityType, 'RQT-TASK',pageStart,pageSize,status).subscribe(res => {
      this.ticketDataSource = res.results.map(parent => ({
        ...parent,
        editPermission: this.getEditPermission(parent),
        workOrders: (parent.workorders || []).map(wo => ({
          ...wo,
          editPermission: this.getEditPermission(wo)   
        }))
      }));
      this.totalParentRecords =res.totalRecords;
    });
  }

  private getEditPermission(row){
    if (!row) return false;
    const isOwnerOrPerformer =row.userId == this.loginUserId ||row.performerId == this.loginUserId ||row.userId == this.roleId || row.performerId == this.roleId;
    const isRestrictedStatus =['RQ-CA'].includes(row.statusId);
    return (this.disableEditPermission || isOwnerOrPerformer) && !isRestrictedStatus;
  }

  private getStatus(){
    if (!this.currentStatus || this.currentStatus.length === 0) {
      return null;
    }
    const filtered = this.currentStatus.filter(s => s !== 'all');
    return filtered.length > 0 ? filtered.join(',') : null;
  }

  navigateToTransfer(data) {
    let categoryAssignedDepartment = data?.departmentIds ??[];
    if (data?.requestCategoryId == 'PR-AT' && data?.nonPerformerId && data.statusId == 'RQ-CR') {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results[0];
          const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
          const isReturnStatus = returnStatus.includes(assetData.assetTransferTypeId);
          const permission1 = isReturnStatus ? this.activate_btn.includes('BT_AM_RAT') : this.activate_btn.includes('BT_AM_AT');
          const permission2 = isReturnStatus ? this.activate_btn.includes('BT_AM_RATA') : this.activate_btn.includes('BT_AM_ATA');
          this.commonService.getLatestTransferDetail(assetData.id).subscribe(department => {
            const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
            const transfer = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
            const isStatus = transfer.includes(assetData.assetTransferTypeId);
            const statusId = department?.results?.eventStatusId ?? null;
            assetData['transferEventStatusId'] = statusId;
            if (statusId === 'ATE-COM' || statusId == null) {
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
            const isPendingStatus = (statusId === 'ATE-PEN' || statusId === 'ATE-GENP') && pending;
            if (isApprovedStatus || isPendingStatus) {
              const targetStatus = isApprovedStatus ? 'ATE-PEN' : 'ATE-COM';
              const permission = isApprovedStatus ? permission1 : permission2;
              this.commonService.getLatestTransferDetail(assetData.id).subscribe(latest => {
                let sourceId = latest.results.transferType == "TRT-DEP" ? assetData.ownerDepartmentId : latest.results.transferType == "TRT-FAC" ? localStorage.getItem(btoa('facilityId')) : assetData?.homeLocationId;
                const jsondata = {
                  transferType: latest.results.transferType,
                  transferId: latest.results.transferId,
                  sourceIdentifier: sourceId,
                  destinationIdentifier: latest.results.transferId,
                  assetTransferType: assetData.assetTransferTypeId,
                  eventId: 'ATT-ACEV',
                  eventStatusId: targetStatus,
                  id: assetData.id,
                  isExcludeParent: false,
                  linkedAssets: [],
                  comments: null
                };
                if (permission) {
                  this.getAssetTransferDetails(assetData, jsondata);
                } else {
                  this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
                  this.onEventChange();
                }
              });
            } else{
              this.toastr.warning('Warning', 'The User doesnot have Permission to acknowledge Asset');
              this.onEventChange();
            }
          });
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
      this.onEventChange();
    }
  }

  getAssetTransferDetails(event, jsondata) {
    this.commonService.getAssetTransferDetails(event.id, event.assetTransferTypeId).subscribe(details => {
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
        this.onEventChange();
      });
    });
    this.onEventChange();
  }

  navigateToGatepass(data) {
    if (data?.requestCategoryId === 'PR-AT' && data?.nonPerformerId && (data.statusId === 'RQ-CR' ||data.statusId === 'RQ-CO' ))  {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results?.[0];
          assetData['gatePassStatusId'] = data.activityCategoryId =='AC-GEXP'?'ATE-GISD':data.activityCategoryId =='AC-GPENP'
          ? data.statusId === 'RQ-CR'? 'ATE-GEXP': data.statusId === 'RQ-CO'? 'ATE-GENP': null: null;
          assetData['hideButton'] = data?.statusId ==='RQ-CO' ? true : false;
          this.manageEventGatePass(assetData);
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
      this.onEventChange();
    }
  }

  manageEventGatePass(data) {
    this.commonService.getLatestTransferDetail(data.id).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP" ? departmentIds.includes(Number(department.results.sourceTransferId)) : true;
      if (!isApproved) {
        this.toastr.warning('Warning', 'User does not have permission to authorize Gatepass for this asset');
        return;
      }
      this.manageGetAllAsset(data, department);
    })
  }

  manageGetAllAsset(data, department) {
     let rowData
    this.configurationService.getAllAsset(data.id).subscribe(res => {
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
      }
      const isTransfer = data.assetTransferTypeId === 'ATT-TR';
      let sourceId = department.results.sourceTransferId;
      let source = department.results.sourceTransferName;
      let destinationId = department.results.transferId;
      let destination = department.results.transferName;
      rowData['transferType'] = department.results.transferType,
      rowData['sourceIdentifier'] = isTransfer ? sourceId : destinationId;
      rowData['destinationIdentifier'] = isTransfer ? destinationId : sourceId;
      rowData['assignedLocationName'] = isTransfer ? destination : source;
      rowData['homeLocationName'] = isTransfer ? source : destination;
      rowData['isGatePassIssued'] = true;
      rowData['hideButton'] = data.hideButton;
      rowData['gatePassStatusId'] = data.gatePassStatusId ?? null;
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(result => {
        this.onEventChange();
      });
    });
    this.onEventChange();
  }
}