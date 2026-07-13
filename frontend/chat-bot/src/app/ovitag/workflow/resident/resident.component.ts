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
 import { Component, OnInit, } from "@angular/core";
 import { MatDialog } from "@angular/material/dialog";
 import { FormGroup, FormBuilder, FormControl,  } from "@angular/forms";
 import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
 import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
 import { EnrollRegisterPatientComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
 import { routerTransition } from "../../../router.animations";
 import { CommonService, WorkflowService } from "../../../shared";
 import { PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
 import { WorkflowManagementComponent } from "../../../shared/modules/entry-component/workflow-management/workflow-management.component";
 import { ActivatedRoute } from "@angular/router";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
 
 @Component({
   selector: "app-resident",
   templateUrl: "./resident.component.html",
   styleUrls: ["./resident.component.scss"],
   animations: [routerTransition()],
 })
 export class ResidentComponent implements OnInit {
   public matcher = new ErrorStateMatcherService();
   displayedColumns: string[] = ["ID", "Alert", "Bed No", "UHID", "Resident Name", "Gender", "Age", "Consulting Doctor", "Nurse Call", "Routine", "Length of stay", "Status"];
   iconHeader = ['ID', 'Gender'];
   iconColumn = ['ID', 'Gender', 'Alert', 'Nurse Call', 'Routine'];
   sortColumn = ['ID'];
   permissionControl = ['BT_ALLE'];
   eventColumn = ['Resident Name', 'Routine', 'Status'];
 
   public selectedName: any;
   public rowData: any = [];
   public activate_btn: any = [];
   public review = false;
   public inPatientInfo: any;
   public cols: any = 4;
   public selectedView = 'table';
   public applyFilterValue: any;
   public isAutoRefresh = false;
   public isCheck = false;
   public checkPatientId = null;
   public userInput = null;
   Routine = [
     { value: 'test - 01' },
     { value: 'test - 02' },
     { value: 'test - 03' },
     { value: 'test - 04' },
     { value: 'test - 05' }
   ];
   showAction1 = [{ id: 'enroll', value: 'Enroll' },{ id: 'porter', value: 'Porter Request' }];
   showAction2 = [
     { id: 'porter', value: 'Porter Request' },
     { id: 'routine', value: 'Manage Routine' }
   ];
   filterForm = new FormGroup({
     status: new FormControl(),
     fromDate: new FormControl(),
     toDate: new FormControl(),
   });
   today = new Date();
   public selectDropdown = null;
   public rowFilter: any;
   public name = null;
   public locationId = null;
   public worklistForm: FormGroup;
   public user = null;
   public showActions = this.showAction1;
   tableData: any;
   height: number;
   public selectFilter = [{ id: 'ward', value: 'WARD' }];
 
   constructor(
     private readonly workflowService: WorkflowService,
     public dialog: MatDialog,
     public fb: FormBuilder,
     public commonService: CommonService,
     private readonly route: ActivatedRoute
   ) {
     this.activate_btn = this.commonService.getActivePermission('button');
   }
 
   ngOnInit() {
     this.searchLoc('ward');
     this.getInpatientList(this.name, null, true);
    
   }
 
   onWindowResizedCol(size){
     this.cols = size;
   }
 
   onWindowResized(size){
     this.height = size;
 
   }
 

 
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim();
     filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     if(this.selectedView === 'card' || this.selectedView === 'new card') {
       this.getInpatientList(filterValue, this.locationId);
     }
   }
 
   refreshPage() {
     this.selectedName = null;
     this.applyFilterValue = null;
     this.name = null;
     this.checkPatientId = null;
     this.isCheck = false;
     this.selectDropdown = null;
     this.showActions = this.showAction1;
     this.getInpatientList(this.applyFilterValue, this.locationId);
   }
   rowClick(data) {
     if (this.selectedName && data.patientVisitId == this.selectedName.patientVisitId) {
       this.checkPatientId = null;
       this.isCheck = false;
       this.selectedName = null;
       this.selectDropdown = null;
       this.showActions = this.showAction1;
     } else {
       this.checkPatientId = data.patientVisitId;
       this.isCheck = true;
       this.selectedName = data;
       this.showActions = this.showAction2;
     }
   }
   searchLoc(id) {
     if(id === 'ward'){
      this.commonService.getSpecialityLoc('CS-GE', null).subscribe(res => {
         this.rowFilter = res.results;
       });
     }
   }
   manageWorklist(locId) {
     this.locationId = locId;
     this.getInpatientList(this.name, this.locationId);
   }
 
   manageAction(value, data) {
     if (value === 'routine') {
       data['RType'] = 'resident';
       data['permissionTab'] = ['Manage Routine'];
       this.selectDropdown = 'routine';
       data["entityType"] = 'Patient';
       data["entityId"] = data.patientId;
       const dialogRef = this.dialog.open(WorkflowManagementComponent,
         { data: data, panelClass: ['large-popup'], disableClose: true });
       dialogRef.afterClosed().subscribe((result) => {
         this.selectDropdown = null;
         this.getInpatientList(this.name, this.locationId);
       });
     } else if (value === 'porter' && data !== true) {
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
           data: {type: 'PR-PA', id: data.patientId, name: data.patientName},
           panelClass: ['medium-popup'],
           disableClose: true,
         });
         dialogRef.afterClosed().subscribe((result) => {
           this.selectDropdown = null;
           this.refreshPage();
         });
       }
     } else if (value === 'porter' && data === true) {
       this.showActions = null;
       const dialogRef = this.dialog.open(PorterRequestNewComponent, {
         data: {type: 'PR-OT', id: '0', name: 'others'},
         panelClass: ['medium-popup'],
         disableClose: true,
       });
       dialogRef.afterClosed().subscribe((result) => {
         this.selectDropdown = null;
         this.getInpatientList(this.name, this.locationId);
       });
     }else if (value === 'enroll') {
       this.selectDropdown = 'enroll';
       const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
         data: { 'id': data.id, 'workflowTypeId': 'WF-IP', 'visitType': 'VT-RE' },
        panelClass: ['small-popup'], disableClose: true
       });
       dialogRef.afterClosed().subscribe(result => {
         this.selectDropdown = null;
         if (!data.id) {
           this.locationId = null;
           this.selectedName = null;
         }
         this.refreshPage();
       });
     }
   }
   onCheck(data) {
     this.selectDropdown = null;
     if (data.patientVisitId !== this.checkPatientId) {
       this.checkPatientId = data.patientVisitId;
       this.isCheck = true;
       this.selectedName = data;
     } else {
       this.checkPatientId = null;
       this.isCheck = false;
       this.selectedName = null;
       this.selectDropdown = null;
     }
   }
   checkUser(value) {
     if (value !== '') {
       this.user = value;
     } else {
       this.user = null;
     }
   }
   addUser() {
     this.Routine.push({ value: this.user });
     this.user = null;
     this.userInput = null;
   }
   headerEventAction(event) {
     if (event.key === 'applyFilter') {
       this.applyFilter(event.data);
     } else if (event.key === 'manageWorklist') {
       this.manageWorklist(event.data);
     } else if (event.key === 'enroll') {
       this.registerPatient(event.data);
     } else if (event.key === 'manageAction') {
       this.manageAction(event.data, event.keyVal);
     } else if (event.key === 'manageView') {
       this.getInpatientList(this.name, this.locationId);
     } else if(event.key === 'manageFilter') {
       this.searchLoc(event.data);
     } else {
       this.locationId = null;
       this.selectedName = null;
       this.refreshPage();
     }
   }
   selectedViewAction(key) {
     if (key !== null) {
       this.selectedView = key;
     }
   }
   eventAction(event) {
     if (event.key === 'Resident Name') {
       this.registerPatient(event.data.patientVisitId);
     } else if (event.key === 'nurse-call' || event.key === 'fall-risk') {
       this.cancelAlert(event.data, event.key);
     } else if (event.key === 'Routine') {
       this.manageAction('routine', event.data)
     } else {
       this.patientInfo(event.data);
     }
   }
   registerPatient(id) {
     const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
       data: { 'id': id, 'workflowTypeId': 'WF-IP', 'visitType': 'VT-RE' }, 
        panelClass: ['small-popup'], disableClose: true
     });
     dialogRef.afterClosed().subscribe(result => {
       if (!id) {
         this.locationId = null;
         this.selectedName = null;
       }
       this.refreshPage();
     });
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
 
   patientInfo(data) {
     data['type'] = '1';
     data['visitTypeId'] = 'VT-IP';
     const dialogRef = this.dialog.open(PatientInfoComponent, {
       data: data, panelClass: ['medium-popup'], disableClose: true
     });
     dialogRef.afterClosed().subscribe(result => {
       this.refreshPage();
     });
   }
 
   getInpatientList(name?: string, locationId?: any, routerEvent?: boolean): void {
     this.selectedName = null;
     this.showActions = this.showAction1;
     if (routerEvent) {
       this.inPatientInfo = this.route.snapshot.data.resident.results;
       this.tableData = this.route.snapshot.data.resident.results;
       const Columns = ["ID", "alerts", "bedNo", "uhid", "patientName", "gender", "age", "doctor", "alerts", "routineEventStatusName", "lengthOfStay", "visitStatus"];
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map(data => {
           data[this.displayedColumns[i]] = data[Columns[i]];
         });
       }
      } else {
         if (name === null) {
           name = '';
         }
         if (locationId === null || locationId === 'All') {
           locationId = 'All';
         }
         this.workflowService.getInpatientList(name, locationId, 'VT-RE').subscribe((res) => {
           this.tableData = res.results;
           const Columns = ["ID", "alerts", "bedNo", "uhid", "patientName", "gender", "age", "doctor", "alerts", "routineEventStatusName", "lengthOfStay", "visitStatus"];
           for (let i = 0; i <= Columns.length; i++) {
             this.tableData.map(data => {
               data[this.displayedColumns[i]] = data[Columns[i]];
             });
           }
           this.inPatientInfo = res.results;
         });
       }
     }
   fixClick() {
     console.log('')
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
 
