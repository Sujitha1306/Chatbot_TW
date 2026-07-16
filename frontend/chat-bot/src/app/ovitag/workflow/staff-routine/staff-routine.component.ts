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
 import { Component, OnInit, OnDestroy } from "@angular/core";
 import { MatDialog } from "@angular/material/dialog";
 import {
   FormGroup,
   FormBuilder,
   FormControl,
 } from "@angular/forms";
 import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
 import { CoasterComponent,  } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
 import { routerTransition } from "../../../router.animations";
 import { CommonService, WorkflowService } from "../../../shared";
 import { PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
 import { WorkflowManagementComponent } from "../../../shared/modules/entry-component/workflow-management/workflow-management.component";
 import { RoutineHistoryComponent } from "../../../shared/modules/entry-component/routine-history/routine-history.component";
 import { ActivatedRoute } from "@angular/router";
 import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { CreateUserComponent } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { StatusEventComponent } from "../../../shared/modules/entry-component/status-event/status-event.component";
import { NotificationAlertPopupComponent } from "../../../shared/modules/entry-component/notification-alert-popup/notification-alert-popup.component";
import { Subscription } from "rxjs";
 
 @Component({
   selector: "app-staff-routine",
   templateUrl: "./staff-routine.component.html",
   styleUrls: ["./staff-routine.component.scss"],
   animations: [routerTransition()],
 })
 export class StaffRoutineComponent implements OnInit, OnDestroy {
   public matcher = new ErrorStateMatcherService();
   subscription: Subscription;
   displayedColumns: string[] = [
     "ID",
     'Device',
     'Alert',
     "Id",
     "Name",
     "Gender",
     "Tag ID",
     "Supervisor",
     "Department",
     "Home Location",
     "Task",
     "Current Location"
   ];
   timeColumns = ['Last Seen Time']
   iconHeader = ['ID', 'Gender', 'Device'];
   iconColumn = ['ID', 'Gender', 'Task', 'Current Location', 'Device', 'Alert'];
   sortColumn = ['ID'];
   permissionControl = ['BT_ALLE'];
   eventColumn = ['Task', 'Device', 'Status', 'Name', 'Last Seen Location'];
   responseColumns = [];
   public rowFilter: any = [];
   public selectFilter: any = [{ id: "depart", value: "DEPARTMENT" }];
   public selectedName: any;
   public rowData: any = [];
   public activate_btn: any = [];
   public review = false;
   public inPatientInfo: any;
   public cols: any;
   public selectedView = "table";
   public applyFilterValue: any;
   public isAutoRefresh = false;
   public isCheck = false;
   public checkPatientId = null;
   public userInput = null;
   Routine = [
     { value: "test - 01" },
     { value: "test - 02" },
     { value: "test - 03" },
     { value: "test - 04" },
     { value: "test - 05" },
   ];
   showActions1 = [
     { id: "routine", value: "Manage Routine" },
     { id: "enrollTask", value: "Create Task" },
     { id: "modify", value: "Modify" }
   ];
   showActions2 = [{ id: "create", value: "Enroll" }];
   showActions3 = [{ id: "modify", value: "Modify" }];
   showActions = this.showActions2
   filterForm = new FormGroup({
     status: new FormControl(),
     fromDate: new FormControl(),
     toDate: new FormControl(),
   });
   today = new Date();
   public selectDropdown = null;
   public specialityLoc: any;
   public name = null;
   public locationId = null;
   public worklistForm: FormGroup;
   public user = null;
   public userTypeId = 'UT_STAFF';
   tableData: any;
   height: number;
   selectedRowData: any;
   showTable = false;
   pageSize:number =50;
   pageStart:number=0;
   length:number=0;
   departmentId = null;
   sortDirection = null;
   sortColumnName = null;
 
   constructor(
     private readonly workflowService: WorkflowService,
     public dialog: MatDialog,
     public fb: FormBuilder,
     public commonService: CommonService,
     private readonly route: ActivatedRoute
   ) {
     this.activate_btn = this.commonService.getActivePermission("button");
     this.getDynamicTableColumn();
   }
 
   ngOnInit() {
     this.height = window.innerHeight - 170;
     this.searchDepartment('depart');
     this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
         if (msg?.length) {
           msg = msg[0];
           this.alertBinding(msg);
         }
     });
   }

 
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim(); 
     filterValue = filterValue.toLowerCase(); 
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
     if (this.applyFilterValue.length > 2){
       this.getStaffRoutineList(this.applyFilterValue,null)
     }else if (this.applyFilterValue.length == 0){
       this.getStaffRoutineList(null,null)
     }
   }
 
   refreshPage(isAutoRefresh?: boolean) {
     this.selectedName = null;
     this.name = null;
     this.checkPatientId = null;
     this.isCheck = false;
     this.selectDropdown = null;
     this.showActions = this.showActions2;
     this.sortColumnName = null;
     this.sortDirection = null;
     if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
     this.getStaffRoutineList(this.applyFilterValue,null);
   }
   rowClick(data) {
     if (
       this.selectedName &&
       data.userId == this.selectedName.userId
     ) {
       this.checkPatientId = null;
       this.isCheck = false;
       this.selectedName = null;
       this.selectDropdown = null;
       this.showActions = this.showActions2;
     } else {
      if(this.activate_btn.indexOf('BT_STFTSK') > -1){
        this.showActions = this.showActions1;
       }else{
        this.showActions = this.showActions3;
       }
       this.checkPatientId = data.patientVisitId;
       this.isCheck = true;
       this.selectedName = data;
     }// commented all for manage routine block
   }
   searchLoc() {
     this.commonService.getSpecialityLoc('CS-GE', null).subscribe((res) => {
       this.specialityLoc = res.results;
     });
   }

   searchDepartment(id){
    if(id === 'depart'){
      this.commonService.getAllDepartments().subscribe(res => {
        let departmentList = res.results;
        this.rowFilter = departmentList;
      })
    }
   }
 
   manageWorklist(locId) {
     this.locationId = locId;
     if(locId === "null"){
      this.departmentId = null;
     } else {
      this.departmentId = locId;
     }
     this.getStaffRoutineList();
   }
 
   manageAction(value, data) {
    if(typeof(data) != 'boolean') {
     data["RType"] = "staffRoutine";
    }
     if (value === 'porter') {
       this.selectDropdown = 'porter';
       if (data.porterRequestId && data.porterRequestId !== null) {
         this.workflowService.getPorterRequest(data.porterRequestId).subscribe((res) => {
           const porterData = res.results[0];
           const dialogRef = this.dialog.open(PorterRequestNewComponent, {
             data: porterData,
             panelClass: ['medium-popup'],
             disableClose: true,
           });
           dialogRef.afterClosed().subscribe((result) => {
             this.selectDropdown = null;
             this.refreshPage();
           });
         });
       } else {
         const dialogRef = this.dialog.open(PorterRequestNewComponent, {
           data: {type: 'PR-PA', id: data.userId, name: data.userName},
           panelClass: ['medium-popup'],
           disableClose: true,
         });
         dialogRef.afterClosed().subscribe((result) => {
           this.selectDropdown = null;
           this.refreshPage();
         });
       }
     } else if (value === "enrollTask") {
      this.selectedRowData = data;
      this.createTask(data);
    } else if(value === 'create'){
      this.createStaff(value);
    } else if(value === 'modify'){
      this. createStaff(value, data);
    }else {
      data["RType"] = "staffRoutine";
      data["entityType"] = 'staff';
      data["entityId"] = data.userId;
      data['permissionTab'] = ['Task List','Task History','Manage Routine'];
      this.selectDropdown = "routine";
      const dialogRef = this.dialog.open(WorkflowManagementComponent, {
        data: data,
        panelClass: ["large-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    }
   }
   headerEventAction(event) {
     if (event.key === "applyFilter") {
       this.applyFilter(event.data);
     } else if (event.key === "manageWorklist") {
       this.manageWorklist(event.data);
     } else if (event.key === "manageAction") {
       this.manageAction(event.data, event.keyVal);
     } else if (event.key === "manageView") {
       this.getStaffRoutineList();
     } else {
       this.locationId = null;
       this.selectedName = null;
       this.applyFilterValue = null;
       this.sortColumnName = null;
       this.sortDirection = null;
       this.refreshPage(true);
     }
   }
   createStaff(data, value?: any){
    this.showActions = null;
    if (data === 'create') {
      value = JSON.parse('{ "type" : "staff"}');
    } else {
      value['type'] = 'staff';
    }
    value['sizeType'] = 'medium';
    const dialogRef = this.dialog.open(CreateUserComponent,
      { data: value, panelClass: 'medium-popup', disableClose: true});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.refreshPage();
    });
   }
   eventAction(event) {
     if (event.key === "Routine") {
       this.getRoutineHistory(event.data.userId, 'User');
     } else if (event.key === 'Device') {
       this.manageCoster(event.data);
     }  else if (event.key === 'Current Location') {
       this.currentLocationData(event.data, '');
     }  else if (event.key === 'nurse-call' || event.key === 'fall-risk') {
       if (event.data && (event.data.eventCode === 'CE-SO' || event.data.alertCode === 'RU-GO')) {
         const patientDetails = this.tableData?.find((p: any) =>
           p.patientId === event.patientId || p.id === event.patientId
         ) || event.data;
         const alertObj = {
           id: event.data.iotAlertId,
           configName: event.data.eventName || 'Patient Care',
           message: event.data.message || 'Patient Care Alert',
           sentDatetime: event.data.message?.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s(?:AM|PM)/)?.[0],
           alertTypeId: 'AT-AL',
           ruleTypeId: 'CE-PC',
           identifyingType: 'Patient',
           identifyingId: patientDetails?.patientId || event.patientId,
           alertDetails: [
             { identifyingType: event.data.alertCode === 'RU-GO' ? 'Location' : null, identifyingValue: event.data.alertCode === 'RU-GO' ? 426 : null },
             { identifyingType: 'Tag', identifyingValue: patientDetails?.tagId },
             { identifyingType: 'Patient', identifyingValue: patientDetails?.patientId, identifyingValueName: patientDetails?.patientName }
           ]
         };
         const dialogRef = this.dialog.open(NotificationAlertPopupComponent, {
           data: {
             selectedAlert: alertObj,
             allAlerts: [],
             ruleFilterList: [],
             hideCamera: false,
             hideSidebar: true,
             patientDetails: patientDetails
           },
           panelClass: ['medium-popup'],
           disableClose: true
         });
         dialogRef.afterClosed().subscribe(() => { this.refreshPage(); });
       } else {
         this.cancelAlert(event.data, event.key);
       }
     } else if (event.key === "Task") {
      this.manageAction('routine', event.data)
    }  else if (event.key == "pagination"){
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
        this.getStaffRoutineList(this.applyFilterValue,null);
      }else{
        this.getStaffRoutineList(null,null);
      }
    } else if (event.key === 'Status') {
      this.dialog.open(StatusEventComponent, {
        data: event.data,
        panelClass: ['small-popup'],
        disableClose: true,
      });
    } else if (event.key === 'Name') {
      this.createStaff(event.key, event.data);
    } else if (event.key === 'sort') {
      const index = this.displayedColumns.indexOf(event.data.active);
      this.sortDirection = event.data.direction.toUpperCase();
      this.sortColumnName = this.responseColumns[index];
      this.getStaffRoutineList(null, null);
    } else if (event.key === 'Last Seen Location') {
      this.currentLocationData(event.data, event.key);
    }
   }
   cancelAlert(data, type) {
     if (type === 'fall-risk' && data.iotAlertId != null) {
       data['alertId'] = data.iotAlertId;
     }
 
     if (type === 'nurse-call' && data.iotAlertId != null) {
       data['alertId'] = data.iotAlertId;
     }
 
     const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
       data: {
         title: 'Cancel Notification', message: '',
         buttonText: { ok: 'Ok', cancel: 'Cancel' },
         'alertDetails': data, 'cancelAlert': true,
       }
     });
     dialogRef.afterClosed().subscribe(result => {
       if (result === 'confirm') {
         this.refreshPage();
       }
     });
   }
   manageCoster(data) {
     data['workflowTypeId']    = 'WF-STF';
     data['associationId']     = data.userId;
     data['associationTypeId'] = 'TAT-US';
     data['associatedName']    = 'User';
     data['tag_type_name']     = data.tagAssociationType;
     const dialogRef = this.dialog.open(CoasterComponent, {
       data: data, 
       panelClass: ['small-popup'], disableClose: true
     });
     dialogRef.afterClosed().subscribe(result => {
       if (result === 'confirm') {
         this.refreshPage();
       }
     });
   }
   createTask(data) {
    data["entityType"] = 'User';
    data["entityId"] = data.userId;
    data["entityName"] = data.userName;
    const dialogRef = this.dialog.open(WorkflowManagementComponent, {
      data: {'patientDetail' : data, 'permissionTab': ['Task','Easy Pick']},
      panelClass: ['large-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }
   currentLocationData(rowData: any, event: any) {
     this.rowData = rowData;
     this.selectedName = rowData.userId;
     rowData['tagType'] = 'User';
     const openDialog = (data) => {
       if (data.tagId != null && data.floorId != null) {
         data.tagSerialNumber = data.tagId;
         const dialogRef = this.dialog.open(CommonDialogComponent, {
           data: data,
           panelClass: 'medium-popup',
           disableClose: true,
         });
         dialogRef.afterClosed().subscribe((result) => {
           this.getStaffRoutineList();
         });
       }
     };

     if (event === 'Last Seen Location' && rowData['lastSeenLocationId'] != null) {
       this.commonService.getLocationById(rowData['lastSeenLocationId']).subscribe(res => {
         if (res && res.statusCode === 1 && res.results) {
           rowData['floorId'] = res.results.parentId;
         } else {
           rowData['floorId'] = rowData['lastSeenLocationId'];
         }
         openDialog(rowData);
       }, err => {
         rowData['floorId'] = rowData['lastSeenLocationId'];
         openDialog(rowData);
       });
     } else {
       openDialog(rowData);
     }
   }
   getRoutineHistory(id, type) {
     const dialogRef = this.dialog.open(RoutineHistoryComponent, {
       data: { id: id, type: type },
       panelClass: ['small-popup'],
       disableClose: true,
     });
     dialogRef.afterClosed().subscribe((result) => {
       if (!id) {
         this.locationId = null;
         this.selectedName = null;
       }
       this.refreshPage();
     });
   }
 
   getStaffRoutineList(filter?: string, routerEvent?: boolean): void {
     this.selectedName = null;
     if (routerEvent) {
       this.inPatientInfo = this.route.snapshot.data.staff.results;
       this.tableData = this.route.snapshot.data.staff.results;
       this.length = this.route.snapshot.data.staff.totalRecords;
       let Columns = [
        "ID",
        "tagId",
        "alerts",
        "mainIdentifier",
        "userName",
        "gender",
        "tagId",
        "managerName",
        "departmentName",
        "homeLocationName",
        "routineStatusName",
        "currentLocationName"
      ];
      if(this.responseColumns.length){
        Columns = this.responseColumns;
      }
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map((data) => {
           data[this.displayedColumns[i]] = data[Columns[i]];
         });
       }
     } else {
       this.workflowService.getStaffRoutineList(this.userTypeId,filter,this.pageStart,this.pageSize, this.departmentId, null, null, this.sortDirection, this.sortColumnName).subscribe((res) => {
         this.tableData = res.results;
         this.length = res.totalRecords;
         let Columns = [
           "ID",
           "tagId",
           "alerts",
           "mainIdentifier",
           "userName",
           "gender",
           "tagId",
           "managerName",
           "departmentName",
           "homeLocationName",
           "routineStatusName",
           "currentLocationName"
         ];
         if(this.responseColumns.length){
          Columns = this.responseColumns;
         }
        
         for (let i = 0; i <= Columns.length; i++) {
           this.tableData.map((data) => {
             data[this.displayedColumns[i]] = data[Columns[i]];
           });
         }
         this.inPatientInfo = res.results;
       });
     }
   }
   getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('staff').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.dataColumns;
        if(dynamicColumns?.timeColumns){this.timeColumns = dynamicColumns.timeColumns}
        this.showTable = true;
      }
      this.getStaffRoutineList(null, true);
    });
  }
 
   ngOnDestroy(): void {
     if (this.subscription) {
       this.subscription.unsubscribe();
     }
   }
 
   alertBinding(msg) {
    if (['RU-NC', 'RU-GO'].includes(msg?.data?.[0]?.ruleTypeId) && msg.data?.[0]?.identifyingType === 'User') {
      this.refreshPage();
    }
   }
 }
 
 export interface PatientData {
   id: number;
   patientId: string;
   tagId: string;
   name: string;
   location: string;
   routineName: string;
   speciality: string;
   currentLocation: string;
   lengthOfStay: string;
   admittedDr: string;
   status: string;
 }
 
 
