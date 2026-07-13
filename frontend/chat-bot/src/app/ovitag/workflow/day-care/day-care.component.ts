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
 import { Component, OnInit, ViewChild } from "@angular/core";
 import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
 import { FormGroup, FormBuilder, FormControl,} from "@angular/forms";
 import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
 import { MY_FORMATS, PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
 import { CoasterComponent, EnrollRegisterPatientComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
 import { routerTransition } from "../../../router.animations";
 import { CommonService, WorkflowService } from "../../../shared";
 import { PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
 import { WorkflowManagementComponent } from "../../../shared/modules/entry-component/workflow-management/workflow-management.component";
 import { ActivatedRoute } from "@angular/router";
 import { DatePipe } from "@angular/common";
 import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { MatPaginator } from "@angular/material/paginator";
import { AppToastService } from "../../../shared/services/toaster.service";
 
 @Component({
   selector: "app-day-care",
   templateUrl: "./day-care.component.html",
   styleUrls: ["./day-care.component.scss"],
   providers: [
     { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
     { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
   ],
   animations: [routerTransition()],
 })
 export class DayCareComponent implements OnInit {
   displayedColumns: string[] = ["ID", "Device", "Alert", "Bed No","UHID", "Name", "Gender", "Age", "Consulting Doctor", "Nurse Call", "Routine", "Schedule Time", 'Check-in', 'Check-out', 'Length of stay (hh:mm)', "Status", "Service"];
   iconHeader = ['ID', 'Device', 'Gender', "IN/OUT"];
   iconColumn = ['ID', 'Device', 'Gender', 'Alert', 'Nurse Call', 'Routine', "Schedule Time", 'Check-in', 'Check-out'];
   sortColumn = ['ID'];
   dateTimeColumns = ["Schedule Time", 'Check-in', 'Check-out', 'Length of stay (hh:mm)']
   timeColumns = ["Schedule Time",'Length of stay (hh:mm)']
   permissionControl = ['BT_ALLE'];
   eventColumn = ['Name', 'Device', 'Routine', 'Status'];
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild('paginatorMy') paginatorMy: MatPaginator;
  @ViewChild('paginatorSpec') paginatorSpec: MatPaginator;
  @ViewChild('paginatorDept') paginatorDept: MatPaginator;
   public matcher = new ErrorStateMatcherService();
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
   public loading = false;
   public today = new Date();
   public currentDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
   public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
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
   pageSize:number =50;
   pageStart:number=0;
   length: number=0;
   
   constructor(
     private readonly workflowService: WorkflowService,
     public dialog: MatDialog,
     public datepipe: DatePipe,
     public fb: FormBuilder,
     public commonService: CommonService,
     private readonly route: ActivatedRoute,
     public toastr: AppToastService
   ) {
     this.activate_btn = this.commonService.getActivePermission('button');
   }
   ngOnInit() {
     this.searchLoc('ward');
     this.getInpatientList(this.name, null, this.selectedDate, null,this.pageStart,this.pageSize);
   }
 
   onWindowResizedCol(size) {
     this.cols = size;
   }
 
   onWindowResized(size) {
     this.height = size;
 
   }
 

 
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim();
     filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
    if (this.selectedView === 'card' || this.selectedView === 'new card') {
      this.getInpatientList(this.applyFilterValue, this.locationId, this.selectedDate,null,this.pageStart,this.pageSize);
    } 
    else if (this.applyFilterValue.length > 2) {
      this.getInpatientList(this.applyFilterValue, this.locationId, this.selectedDate,null,this.pageStart,this.pageSize);
    } 
    else {
      this.getInpatientList(this.applyFilterValue, this.locationId, this.selectedDate,null,this.pageStart,this.pageSize);
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
     this.getInpatientList(this.applyFilterValue, this.locationId, this.selectedDate,null,this.pageStart, this.pageSize);
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
      this.commonService.getSpecialityLoc('CS-DC', null).subscribe(res => {
         this.rowFilter = res.results;
       });
     }
   }
   manageWorklist(locId) {
     this.locationId = locId;
     this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart, this.pageSize);
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
         this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart,this.pageSize);
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
         this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart, this.pageSize);
       });
     } else if(value === 'enroll'){
       this.selectDropdown = 'enroll';
       const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
         data: { 'id': data.id, 'workflowTypeId': 'WF-IP', 'visitType': 'VT-DC' },
         panelClass: ['small-popup'], disableClose: true
       });
       dialogRef.afterClosed().subscribe(result => {
         this.selectDropdown = null
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
     } else if (event.key === 'dateFilter') {
       this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
       this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart, this.pageSize);
     } else if (event.key === 'manageWorklist') {
       this.manageWorklist(event.data);
     } else if (event.key === 'enroll') {
       this.registerPatient(event.data);
     } else if (event.key === 'manageAction') {
       this.manageAction(event.data, event.keyVal);
     } else if (event.key === 'manageView') {
       this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart, this.pageSize);
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
   manageCoster(data) {
    data['workflowTypeId'] = 'WF-HC';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    data['visit_id'] = data.patientVisitId;
    data["tag_type_name"] = data.tagTypeName;
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
   eventAction(event) {
     if (event.key === 'Name') {
       this.registerPatient(event.data.patientVisitId);
     } else if (event.key == "pagination") {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getInpatientList(this.name, this.locationId, this.selectedDate, null, this.pageStart, this.pageSize);
     } else if (event.key === 'nurse-call' || event.key === 'fall-risk') {
       this.cancelAlert(event.data, event.key);
     } else if (event.key === 'Routine') {
       this.manageAction('routine', event.data)
     } else if (event.key === 'Device') {
       this.manageCoster(event.data);
     } else if(event.key === 'IN') {
      if(this.selectedDate === this.currentDate) {
        this.dayCareEvent(event.data, 'in')
      }
     } else if(event.key === 'OUT') {
      if(this.selectedDate === this.currentDate) {
        this.dayCareEvent(event.data, 'out')
      }
     } else {
       this.patientInfo(event.data);
     }
   }
   registerPatient(id) {
     const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
       data: { 'id': id, 'workflowTypeId': 'WF-IP', 'visitType': 'VT-DC' }, 
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
 
   dayCareEvent(data, type) {
     if (type === 'in') {
       const dayCareData = {
         'patientId': data.patientId,
         'patientVisitId': data.patientVisitId,
         'mainidentifier': data.uhid,
         'queueId' : data.queueId
       };
       this.commonService.dayCarePatient(dayCareData).subscribe(res => {
         if (res.statusCode === 1) {
           this.toastr.success('Success', `${res.message}`);
           this.refreshPage();
         }
       },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
     } else {
      const status = 'QS-CO';
      if(data.queueId != null) {
        const dayCareData = {
          'patientId': data.patientId,
          'patientVisitId': data.patientVisitId,
          'mainidentifier': data.uhid,
          'queueId' : data.queueId,
          'queueStatus' : status
        };
        this.commonService.dayCarePatient(dayCareData).subscribe(res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            this.refreshPage();
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      } else {
        const dischargeData = {
          'patientId': data.patientId,
          'patientVisitId': data.patientVisitId,
          'visitType': data.visitTypeId,
          'queueId' : data.queueId
        };
        this.commonService.dischargePatient(dischargeData).subscribe(res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            this.refreshPage();
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
 
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
 
   patientInfo(data) {
     data['type'] = '1';
     data['visitTypeId'] = 'VT-IP';
     data['workflow'] = 'DayCare';
     const dialogRef = this.dialog.open(PatientInfoComponent, {
       data: data, panelClass: ['medium-popup'], disableClose: true
       
     });
     dialogRef.afterClosed().subscribe(result => {
       this.refreshPage();
     });
   }
 
   getInpatientList(name?: string, locationId?: any, visitDate?: string, routerEvent?: boolean,pageStart?: number,pageSize?: number): void {
     this.loading = true;
     this.selectedName = null;
     this.showActions = this.showAction1;
     if (routerEvent) {
       this.inPatientInfo = this.route.snapshot.data.dayCare.results;
       this.tableData = this.route.snapshot.data.dayCare.results;
       const Columns = ["ID", "tagId", "alerts", "bedNo", "uhid", "patientName", "gender", "age", "doctor", "alerts", "routineEventStatusName",'visitTime', 'fromTime', 'toTime', "totalDuration", "visitStatus", "IN/OUT"];
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map(data => {
           data[this.displayedColumns[i]] = data[Columns[i]];
         });
       }
       this.loading = false;
      } else {
        const visitType = 'VT-DC';
         if (name === null) {
           name = '';
         }
         if (visitDate === null) {
           visitDate = this.selectedDate;
         }
         if (locationId === null || locationId === 'All') {
           locationId = 'All';
         }
         this.workflowService.getDayCarepatientList(name, locationId, visitType, visitDate, pageStart, pageSize).subscribe((res) => {
           this.tableData = res.results;
           this.length = res.totalRecords;
           const Columns = ["ID", "tagId", "alerts", "bedNo", "uhid", "patientName", "gender", "age", "doctor", "alerts", "routineEventStatusName",'visitTime', 'fromTime', 'toTime', "totalDuration", "visitStatus", "IN/OUT"];
           
           if(this.applyFilterValue !== null){
            this.applyFilterValue = this.applyFilterValue + ' ';
            if(res.results?.length === 0) {
              this.loading = false;
              return;
            }
          }
           for (let i = 0; i <= Columns.length; i++) {
             this.tableData.map(data => {
               data[this.displayedColumns[i]] = data[Columns[i]];
             });
           }
           this.inPatientInfo = res.results;
           this.loading = false;
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
