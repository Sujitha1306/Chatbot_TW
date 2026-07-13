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

import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DateAdapter,   MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {  MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { MY_FORMATS } from '../../../app.module';
import { CommonService, ConfigurationService, DashboardService } from '../../../shared';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CoasterComponent, } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
// import { EnrollTruckComponent, TruckInfoComponent } from '../../../shared/modules/entry-component/enroll-truck/enroll-truck.component';


@Component({
  selector: 'app-truck',
  templateUrl: './truck.component.html',
  styleUrls: ['./truck.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class TruckComponent implements OnInit {
  public selectedName: any;
  public dataSource;
  public day = ['Today', 'Yesterday', 'Week'];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  HCDataSource = new MatTableDataSource();
  tableData: any;
  eventColumn =['Visit Status','Device', 'Visit Identifier'];
  iconHeader = ['Device','Gender','Token No','Diabetic'];
  iconColumn = ['Device','Gender','DOB', 'Current Location'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  public floors: any[] = [];
  public floorList: any;
  public floorId = 0;
  public maxHeight: any;
  public maxElementCheckbox = 2;
  selectedRows: Array<{}> = [];
  checkbox_values: number;
  today = new Date();
  public mergeDetails: any;
  public floorDetails: any;
  public activate_btn: any = [];
  public applyFilterValue: any;
  public isAutoRefresh = false;
  public HCDisplayedColumns: any;
  public showActions1 = [{ id: 'enroll', value: 'Enroll' },{ id: 'merge', value: 'Merge' }];
  public showActions = this.showActions1;
  public selectDropdown: any;
  public selectedView = 'table';

  floorForm = new FormGroup({
    assignedFloor: new FormControl()
  });

  HCDisplayedData = [
  { 'colName': 'Device', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/mob_coaster.svg" alt="coaster" >', 'dataName': 'device' },
  { 'colName': 'Gender', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/gender_male_female.svg" alt="gender">', 'dataName': 'gender' },
  { 'colName': 'Token No', 'title': '<img width="25" height="25" src="/assets/Alert/common_icons/token.svg" alt="token">', 'dataName': 'checkin_time' },
  { 'colName': 'Diabetic', 'title': '<img width="25" height="25" src="/assets/Alert/common_icons/diabetic.svg" alt="diabetic">', 'dataName': 'isDiabetic' },
  { 'colName': 'Truck Number', 'title': 'Truck Number', 'dataName': 'name' },
  { 'colName': 'UHID', 'title': 'UHID', 'dataName': 'uhid' },
  { 'colName': 'Visit Id', 'title': 'Visit Identifier', 'dataName': 'visitId' },
  { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile_no' },
  { 'colName': 'Remarks', 'title': 'Remarks', 'dataName': 'consultantName' },
  { 'colName': 'Visit Status', 'title': 'Visit Status', 'dataName': 'status' },
  { 'colName': 'Boarding Plan', 'title': 'Boarding Plan', 'dataName': 'health_plan_name' },
  { 'colName': 'Comments', 'title': 'Comments', 'dataName': 'isSampleCollected' },
  { 'colName': 'DTB', 'title': 'DTB', 'dataName': 'birthdate' },
  { 'colName': 'Bay', 'title': 'Bay', 'dataName': 'floor_name' },
  { 'colName': 'Test Name', 'title': 'Test Name', 'dataName': 'testName' },
  { 'colName': 'Test Status', 'title': 'Test status', 'dataName': 'testStatus' },
  { 'colName': 'Current Location', 'title': 'Current Location', 'dataName': 'locationName' },
  { 'colName': 'Location Name', 'title': 'Location', 'dataName': 'locationName' },
  { 'colName': 'Wait Time (mins)', 'title': 'Waiting Time', 'dataName': 'waitingTime' },
  { 'colName': 'Visit Type', 'title': 'Visit Type', 'dataName': 'visit_type' },
  { 'colName': 'Visit Identifier', 'title': 'Visit Identifier', 'dataName': 'visitIdentifier' }
  ];

  displayedColumns_: string[] = ['uhid', 'patientName', 'Age', 'gender', 'packageName', 'date', 'Current_Location', 'Status'];
  HCRemoveColumns = [ 'Diabetic', 'UHID', 'DTB', 'Bay','Test Name', 'Test Status', 'Location Name', 'Wait Time (mins)', 'Visit Type', 'Visit Identifier'];
  DQRemoveColumns = ['Device', 'DOB', 'Mobile', 'Comments', 'Diabetic', 'Visit Status', 'Bay', 'Remarks', 'Visit Id'];
  public hcForm: FormGroup;
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  public isClearDropdown = true;
  public assignFloorId = '';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') input;
  @ViewChild(MatSort) sort: MatSort;
  @Input() matTabindex: any;
  public height: number;
  width: number;

  constructor(public dialog: MatDialog, private readonly router: Router, public fb: FormBuilder,
    public datepipe: DatePipe, private readonly dateAdapter: DateAdapter<Date>,
    private readonly commonService: CommonService, private readonly configurationService : ConfigurationService, private readonly dashboardService : DashboardService, private readonly route: ActivatedRoute) {
  
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate());
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.height = window.innerHeight - 165;
    this.buildForm();
    this.getFloors();

    if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
      this.maxHeight = 450;
    } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
      this.maxHeight = 400;
    } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
      this.maxHeight = 400;
    } else if (window.innerWidth <= 768) {
      this.maxHeight = 350;
    } else {
      this.maxHeight = 450;
    }
    if (this.matTabindex === 4) {
      this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.DQRemoveColumns.indexOf(item) < 0);
      this.getHCPatientByWaitTime(this.selectedDate);
    } else {
      this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.HCRemoveColumns.indexOf(item) < 0);
      this.gethcDetails(this.selectedDate, true);
    }
  }

  onResize(event) {
    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.maxHeight = 450;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.maxHeight = 400;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
      this.maxHeight = 400;
    } else if (event.target.innerWidth <= 768) {
      this.maxHeight = 350;
    } else {
      this.maxHeight = 450;
    }
  }

  buildForm() {
    this.hcForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      assignFloorId: [this.assignFloorId ? this.assignFloorId : ''],
    });
  }

  getFloors() {
    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.floors = res.results.contentObject['assign-floor'];
      }
    });
  }

  gethcDetails(dateValue, routerEvent?: boolean): void {
    this.selection.clear();
    this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.healthCheckup.results.data;
      this.HCDataSource = new MatTableDataSource(this.route.snapshot.data.healthCheckup.results.data);
      const Columns = ['tagId','gender','token_no','name','visit_identifier','mobile_no','consultantName','status','health_plan_name','issampleCollected'];
        for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.HCDisplayedColumns[i]] = data[Columns[i]];
        });
      }
      
        if (this.tableData.hasOwnProperty('floor_count')) {
          this.floorDetails = this.tableData.floor_count;
        }
        if (this.applyFilterValue != null) {
          this.HCDataSource.filter = this.applyFilterValue;
          this.tableData = this.applyFilterValue;
        }
        this.HCDataSource.paginator = this.paginator;
        this.HCDataSource.sort = this.sort;
    } else {
      this.commonService.getHcPatientList(this.selectedDate).subscribe((res) => {
        this.HCDataSource = new MatTableDataSource(res.results.data);
        this.tableData = res.results.data;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['tagId','gender','token_no','name','visit_identifier','mobile_no','consultantName','status','health_plan_name','issampleCollected','birthDate','floor_name'];
        for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.HCDisplayedColumns[i]] = data[Columns[i]];
        });
      }

        if (res.results.hasOwnProperty('floor_count')) {
          this.floorDetails = res.results.floor_count;
        }
        
        this.HCDataSource.paginator = this.paginator;
        this.HCDataSource.sort = this.sort;
      });
    }
  }

  getHCPatientByWaitTime(dateValue) {
    this.selection.clear();
    this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.commonService.getHCPatientListByWaitTime(this.selectedDate).subscribe((res) => {

      this.HCDataSource = new MatTableDataSource(res.results);
      this.tableData = res.results;
      const Columns = ['gender','token_no','firstName','uhid','health_plan_name','healthTestName', 'testStatusName', 'locationName', 'waitingTime', 'visit_type', 'visitIdentifier'];
      for(let i=0; i<= Columns.length; i++){
      this.tableData.map(data => {
        data[this.HCDisplayedColumns[i]] = data[Columns[i]];
      });
    }
      if (this.applyFilterValue != null) {
        this.HCDataSource.filter = this.applyFilterValue;
        this.tableData = this.applyFilterValue;
      }
      this.HCDataSource.paginator = this.paginator;
      this.HCDataSource.sort = this.sort;
    });
  }

  eventAction(event) {
    if(event.key == 'Visit Status' || event.key == 'Visit Identifier') {
      this.patientInfo(event.data);
    } else {
      this.manageCoster(event.data);
    }
  }

  patientInfo(data) {
    data['type'] = '1';
    // const dialogRef = this.dialog.open(TruckInfoComponent, { 
    //   data: data, panelClass: ['medium-popup'], disableClose: true 
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //     this.refreshPage();
    // });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if (this.HCDataSource?.data?.length) {
      const numRows = this.HCDataSource.data.length;
      return numSelected === numRows;
    }

  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.HCDataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  assignFloor(patient) {
    if (patient.length) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: 'Assign Floor', message: 'Do you want to assign the selected patient to the floor?',
          buttonText: { ok: 'Save', cancel: 'Cancel' },
          'patient': patient, 'floorId': patient[0].floor_id, 'isRemark': 1, 'enableSelectBox': true, 'assignFloor': true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.selection.clear();
          this.gethcDetails(this.selectedDate);
        }
      });
    }
  }


  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data, '');
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.gethcDetails(this.selectedDate)
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  manageAction(value, data) {
    if (value === 'enroll'){
      this.registerPatient('');
    }
  }

  applyFilter(filterValue: string, clear) {
    let coasterId: any;
    if (filterValue.lastIndexOf('~') > -1 && filterValue != null) {
      const splitValue = filterValue.split('=');
      coasterId = splitValue[1].substring(0, 9);
      filterValue = coasterId
      this.input.nativeElement.value = filterValue
      this.applyFilterValue = filterValue.trim().toLowerCase();
      
      this.HCDataSource.filter = filterValue.trim().toLowerCase();      
    }
  
  else {
      coasterId = this.HCDataSource.filter;
      this.applyFilterValue = filterValue.trim().toLowerCase();
      this.HCDataSource.filter = filterValue.trim().toLowerCase();
    }

    const filteredRow = this.HCDataSource.data.filter (filter => filter['tagId'] === coasterId);

    if (filteredRow.length > 0 && this.HCDataSource.filter != null && !clear) {
      filteredRow[0]['type'] = 1;  
      // this.dialog.open(TruckInfoComponent,
      // { data: filteredRow[0], maxWidth: '95vw', panelClass: ['custom-dialog-container','popup-dialog-container2'], disableClose: true });

    }

    if (this.isClearDropdown === true) {
      this.assignFloorId = '';
      this.buildForm();
    }
  }

  filterByFloorName(floor_id, floorName) {
    if (floor_id != null) {
      this.isClearDropdown = false;
      this.applyFilter(floorName, '');
      this.isClearDropdown = true;
    } else {
      this.gethcDetails(this.selectedDate);
    }
  }

  getHcPatientList(dateValue, floorId): void {
    this.selectedDate = dateValue;
    this.commonService.getHcPatientList(this.selectedDate).subscribe((res) => {
      this.HCDataSource = new MatTableDataSource(res.results.data);
      this.tableData = res.results.data;
      this.HCDataSource.paginator = this.paginator;
    });
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    if (this.matTabindex === 4) {
      this.getHCPatientByWaitTime(this.selectedDate);

    } else {
      this.gethcDetails(this.selectedDate);
    }
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-STF';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    data['id'] = data.patientId;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'confirm') {
        this.AdminTestComplete(data)
      }
    });
  }
  AdminTestComplete(patientInfo) {
    this.commonService.getPatientInfo(patientInfo.id, patientInfo.visit_id, false, patientInfo.visitTypeId, patientInfo.visitEventTypeId, patientInfo.visitEventId).subscribe(res => {
      if(res.statusCode == 1 && res.results.tagId) {
        let info = res.results;
        let gateTest = info.testStatuses.filter(val => val.testCategoryId == "TC-GT")
        if(gateTest.length) {
          info.testCategoryId = "TC-GT";
          info.healthTestId = gateTest[0]['healthTestId']
          info.patientQueueId  = gateTest[0]['patientQueueId']
        }
        if(info.testCategoryId == "TC-GT") {
          this.checkTestLocationInfo(info.patientQueueId,info.healthTestId)
        } else {
          this.refreshPage()
        }
      }   else {
        this.refreshPage()
      }    
    })
  }
  checkTestLocationInfo(queueId, testId) {
    this.configurationService.getAllHealthchecks().subscribe(res => {
      if(res.statusCode == 1) {
        let testFilter = res.results.filter(val => val.testId == testId)[0]
        if(testFilter.testLocations.length) {
          this.updatePatientstatus(queueId, testFilter.testLocations[0]['locationId'],testFilter.testLocations[0]['floorId'], 'QS-CO')
        }
      }

    })
  }
  updatePatientstatus(queueId, locationId, floorId, status) {
    const payload = { 
      'statusId': status, 
      'locationId': locationId,
      'floorId': floorId
    };
    this.dashboardService.updatePatientQueueStatus(queueId, payload).subscribe(res =>  {
      if(res.statusCode == 1) {
        this.refreshPage();
      }
    })
  }


  openDialog(elements) {
    // const dialogRef = this.dialog.open(TruckInfoComponent,
    //   { data: elements, maxWidth: '95vw', panelClass: ['custom-dialog-container','popup-dialog-container2'], disableClose: true });
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log(`Dialog result: ${result}`);
    // });
  }

  registerPatient(id) {
    this.showActions = null;
    this.buildForm();
    
    // const dialogRef = this.dialog.open(EnrollTruckComponent, {
    //   data: { 'id': id, 'workflowTypeId': 'WF-HC', 'visitType': 'VT-HC' }, width: '95%', panelClass: ['custom-dialog-container2','popup-dialog-container'], disableClose: true
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   this.refreshPage();
    // });
  }

  

  rowClick(data) {
    this.selectedName = data.id;
  }

  public createHealthCheckup(data) {
    // this.dialog.open(TruckInfoComponent,
    //   { data: data, maxWidth: '95vw', panelClass: ['custom-dialog-container','popup-dialog-container2'], disableClose: true });
    this.selectedName = data.id;
  }
}
