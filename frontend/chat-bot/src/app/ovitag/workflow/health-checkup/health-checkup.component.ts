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
import { Component, OnInit, ViewChild, Inject, Input,  Output, EventEmitter, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, WorkflowService } from '../../../shared';
import { SelectionModel } from '@angular/cdk/collections';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { CreateMergeRecord } from '../workflow.models';
import { DatePipe } from '@angular/common';
import { EnrollPatientComponent, EnrollRegisterPatientComponent, CoasterComponent} from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from './../../../../app/app.module';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { MatTabGroup } from '@angular/material/tabs';
import { AssignTokenComponent } from '../../../shared/modules/entry-component/assign-token/assign-token.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-health-checkup',
  templateUrl: './health-checkup.component.html',
  styleUrls: ['./health-checkup.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class HealthCheckupComponent implements OnInit, AfterViewInit {
  public loading = false;
  public matcher = new ErrorStateMatcherService();
  public selectedName: any;
  public dataSource;
  public day = ['Today', 'Yesterday', 'Week'];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  HCDataSource = new MatTableDataSource();
  FPDataSource = new MatTableDataSource();
  tableData: any;
  tableDataFP: any;
  HCdynamicDisplaycolumns : string[] = [];
  HCdynamicDateTimeColumns =['Test Event Time']
  HCdynamicDateColumns =['DOB']
  HCdyanmicColumns: string[] = [];
  followupdynamicDisplaycolumns : string[] = [];
  followupdynamicDateColumns = ['DOB']
  followupcolumns: [];
  followupeventColumn: ["Name", "Visit Status"];
  followupsortColumn: [];
  followupiconHeader: ['Device','Gender','Diabetic'];
  eventColumn =['Visit Status','Device', 'Visit Identifier', 'Name'];
  iconHeader = ['Device','Gender','Token No','Diabetic'];
  iconColumn = ['Device','Gender','DOB', 'Report Status'];
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
  public fullData = [];

  floorForm = new FormGroup({
    assignedFloor: new FormControl()
  });

  HCDisplayedData = [
    /**Determine the old column data
      { 'colName': 'Device', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/mob_coaster.svg"  alt="mob_coaster" >', 'dataName': 'device' },
      { 'colName': 'Gender', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/gender_male_female.svg" alt="gender" >', 'dataName': 'gender' },
      { 'colName': 'Token No', 'title': '<img width="25" height="25" src="/assets/Alert/common_icons/token.svg" alt="token" >', 'dataName': 'checkin_time' },
      { 'colName': 'Diabetic', 'title': '<img width="25" height="25" src="/assets/Alert/common_icons/diabetic.svg" alt="diabetic" >', 'dataName': 'isDiabetic' },
      { 'colName': 'Name', 'title': 'Name', 'dataName': 'name' },
      { 'colName': 'UHID', 'title': 'UHID', 'dataName': 'uhid' },
      { 'colName': 'Visit Id', 'title': 'Visit Identifier', 'dataName': 'visitId' },
      { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile_no' },
      { 'colName': 'Current Location', 'title': 'Current Location', 'dataName': 'currentLocationName' },
      { 'colName': 'Consultant Name', 'title': 'Consultant Name', 'dataName': 'consultantName' },
      { 'colName': 'Visit Status', 'title': 'Visit Status', 'dataName': 'status' },
      { 'colName': 'Health Plan', 'title': 'Health Plan', 'dataName': 'health_plan_name' },
      { 'colName': 'Report Status', 'title': 'Report Status', 'dataName': 'reportStatusName' },
      { 'colName': 'Sample Collected', 'title': 'Sample Collected', 'dataName': 'isSampleCollected' },
      { 'colName': 'DOB', 'title': 'DOB', 'dataName': 'birthdate' },
      { 'colName': 'Floor', 'title': 'Floor', 'dataName': 'floor_name' },
      { 'colName': 'Test Name', 'title': 'Test Name', 'dataName': 'testName' },
      { 'colName': 'Test Status', 'title': 'Test status', 'dataName': 'testStatus' },
      { 'colName': 'Location Name', 'title': 'Location', 'dataName': 'locationName' },
      { 'colName': 'Wait Time (mins)', 'title': 'Waiting Time', 'dataName': 'waitingTime' },
      { 'colName': 'Visit Type', 'title': 'Visit Type', 'dataName': 'visit_type' },
      { 'colName': 'Visit Identifier', 'title': 'Visit Identifier', 'dataName': 'visitIdentifier' }
  */ 
  ];

  displayedColumns_: string[] = ['uhid', 'patientName', 'Age', 'gender', 'packageName', 'date', 'Current_Location', 'Status'];
  HCRemoveColumns = ['Test Name', 'Test Status', 'Location Name', 'Wait Time (mins)', 'Visit Type', 'Visit Identifier'];
    DQRemoveColumns = ['Device', 'DOB', 'Mobile', 'Sample Collected', 'Diabetic', 'Visit Status', 'Floor', 'Consultant Name', 'Visit Id'];
  public hcForm: FormGroup;
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  public isClearDropdown = true;
  public isRouter: boolean = true;
  public assignFloorId = '';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') input;
  @ViewChild(MatSort) sort: MatSort;
  @Input() matTabindex: any;
  @Output() multiViewAction = new EventEmitter<any>();
  public height: number;
  width: number;
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;
  public pageStart = 0;
  public pageSize = 50;
  public length = 0;
  public pageStartFP = 0;
  public pageSizeFP = 50;
  public lengthFP = 0;

  constructor(public dialog: MatDialog, private readonly router: Router, public fb: FormBuilder,
    public datepipe: DatePipe, private readonly dateAdapter: DateAdapter<Date>,
    private readonly commonService: CommonService, private readonly route: ActivatedRoute,
    public toastr: AppToastService) {
    this.getPatientHealthPlan(1);
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
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.TabChange(event);
    }); 
  }

  ngAfterViewInit() {
    let label = 'Health Checkup';
    const tabNames = this.tabGroup._tabs.toArray();
    const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
    if (index >= 0) {
      this.selectedIndex = index;
      this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
    }
  }
   
  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
    this.isRouter = false;
  }

  TabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.loading = true;
    this.tableData = [];
    this.selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');

    if(this.selectedTab === 'Health Checkup') {
      if(this.matTabindex === 4) {      
        /** Determine the old displayed Column this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.DQRemoveColumns.indexOf(item) < 0);
        this.getHCPatientByWaitTime(this.selectedDate); */
        this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.DQRemoveColumns.indexOf(item) < 0);
        this.getdqWaitlistDynamicTableColumn();
      } else if (this.matTabindex === 0) {
        /** Determine the old displayed Column this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.HCRemoveColumns.indexOf(item) < 0);*/
        this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.HCRemoveColumns.indexOf(item) < 0);
        this.getdqOverallDynamicTableColumn();
      } else {
        /** Determine the old displayed Column this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.HCRemoveColumns.indexOf(item) < 0);
        this.gethcDetails(this.selectedDate, true);*/
        this.HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName).filter(item => this.HCRemoveColumns.indexOf(item) < 0);
        this.getDynamicTableColumn(this.isRouter);
      }
    } else {
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      this.getFollowUpList(this.selectedDate, this.pageStartFP, this.pageSizeFP, this.applyFilterValue);
    }
  }

  getDynamicTableColumn(routerEvent?: boolean) {
    this.commonService.getDynamicTableColumn('hc').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.HCdynamicDisplaycolumns = dynamicColumns.displayedColumns;
        dynamicColumns.HCdynamicDateTimeColumns && (this.HCdynamicDateTimeColumns = dynamicColumns.HCdynamicDateTimeColumns);
        dynamicColumns.HCdynamicDateColumns && (this.HCdynamicDateColumns = dynamicColumns.HCdynamicDateColumns);

        this.HCDisplayedColumns = dynamicColumns.displayedColumns;
        this.HCdyanmicColumns = dynamicColumns.columns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.followupdynamicDisplaycolumns = dynamicColumns.followupdisplayedColumns;
        if(dynamicColumns.followupdynamicDateColumns){
        this.followupdynamicDateColumns = dynamicColumns.followupdynamicDateColumns
        }
        this.followupcolumns = dynamicColumns.followupcolumns;
        this.followupeventColumn = dynamicColumns.followupeventColumn;
        this.followupsortColumn = dynamicColumns.followupsortColumn;
        this.followupiconHeader = dynamicColumns.followupiconHeader;
      }
      this.gethcDetails(this.selectedDate, routerEvent);
    });
  }

  getdqWaitlistDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('dqView-waitinglist').subscribe((res) => {
      if (res.statusCode === 1) {
        console.log(res.results)
        const dynamicColumns = res.results.contentObject;
        this.HCdynamicDisplaycolumns = dynamicColumns.displayedColumns;
        dynamicColumns.HCdynamicDateTimeColumns && (this.HCdynamicDateTimeColumns = dynamicColumns.HCdynamicDateTimeColumns);
        dynamicColumns.HCdynamicDateColumns && (this.HCdynamicDateColumns = dynamicColumns.HCdynamicDateColumns);
        this.HCdyanmicColumns = dynamicColumns.columns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.followupdynamicDisplaycolumns = dynamicColumns.followupdisplayedColumns;
        this.followupcolumns = dynamicColumns.followupcolumns;
        if(dynamicColumns.followupdynamicDateColumns){
        this.followupdynamicDateColumns = dynamicColumns.followupdynamicDateColumns
        }
        this.followupeventColumn = dynamicColumns.followupeventColumn;
        this.followupsortColumn = dynamicColumns.followupsortColumn;
        this.followupiconHeader = dynamicColumns.followupiconHeader;
      }
      this.getHCPatientByWaitTime(this.selectedDate);
    });
  }

  getdqOverallDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('dqView-Overall').subscribe((res) => {
      if (res.statusCode === 1) {
        console.log(res.results)
        const dynamicColumns = res.results.contentObject;
        this.HCdynamicDisplaycolumns = dynamicColumns.displayedColumns;
        this.HCdyanmicColumns = dynamicColumns.columns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.followupdynamicDisplaycolumns = dynamicColumns.followupdisplayedColumns;
        this.followupcolumns = dynamicColumns.followupcolumns;
        this.followupeventColumn = dynamicColumns.followupeventColumn;
        this.followupsortColumn = dynamicColumns.followupsortColumn;
        this.followupiconHeader = dynamicColumns.followupiconHeader;
      }
      this.getDQdetails(this.selectedDate)
    });
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

  getFollowUpList(date, pageStart, pageSize, name) {
    if (name !== null && name !== undefined) {
      name = name.trim();
    }
    this.commonService.getFollowUp(date, pageStart, pageSize, name).subscribe((res) => {
      this.FPDataSource = new MatTableDataSource(res.results);
      this.lengthFP = res.totalRecords;
      this.tableDataFP = res.results;
      /** Determine the old displayed Column const Columns = ['tagId', 'gender', 'isDiabetic', 'name', 'uhid', 'visit_identifier', 'mobile_no', 'consultantName', 'status', 'health_plan_name', 'reportStatusName', 'birthDate'];
      this.FPDisplayedColumns = ['Device', 'Gender', 'Diabetic', 'Name', 'UHID', 'Visit Id', 'Mobile', 'Consultant Name', 'Visit Status', 'Health Plan', 'Report Status', 'DOB'];*/
      for (let i = 0; i <= this.followupcolumns.length; i++) {
        this.tableDataFP.map(data => {
          data[this.followupdynamicDisplaycolumns[i]] = data[this.followupcolumns[i]]; 
        });
      }
      this.loading = false;

      if (res.results.hasOwnProperty('floor_count')) {
        this.floorDetails = res.results.floor_count;
      }

      this.FPDataSource.paginator = this.paginator;
      this.FPDataSource.sort = this.sort;
    });
  }
  
  gethcDetails(dateValue, routerEvent?: boolean): void {
    this.loading = true;
    this.selection.clear();
    this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.healthCheckup.results.data;
      this.HCDataSource = new MatTableDataSource(this.route.snapshot.data.healthCheckup.results.data);
      /** Determine the old displayed Column const Columns = ['tagId','gender','token_no','isDiabetic','name','uhid','visit_identifier','mobile_no','currentLocationName','consultantName','status','health_plan_name','reportStatusName','issampleCollected','birthDate','floor_name'];*/
        for(let i=0; i<= this.HCdyanmicColumns.length; i++){
        this.tableData.map(data => {
          data[this.HCdynamicDisplaycolumns[i]] = data[this.HCdyanmicColumns[i]];
        });
      }
      this.length = this.tableData.length;
       if (this.route.snapshot.data.healthCheckup.results.hasOwnProperty('floor_count')) {
        this.floorDetails = this.route.snapshot.data.healthCheckup.results.floor_count;
        }
        if (this.applyFilterValue != null) {
          this.HCDataSource.filter = this.applyFilterValue;
          this.tableData = this.applyFilterValue;
        }
        this.HCDataSource.paginator = this.paginator;
        this.HCDataSource.sort = this.sort;
        this.loading = false;
        this.fullData = this.tableData;
    } else {
      this.commonService.getHcPatientList(this.selectedDate).subscribe((res) => {
        this.HCDataSource = new MatTableDataSource(res.results.data);
        this.tableData = res.results.data;
        if(this.applyFilterValue !== null && this.applyFilterValue !== undefined){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        /** Determine the old displayed Column const Columns = ['tagId','gender','token_no','isDiabetic','name','uhid','visit_identifier','mobile_no','currentLocationName','consultantName','status','health_plan_name','reportStatusName','issampleCollected','birthDate','floor_name'];*/
        for(let i=0; i<= this.HCdyanmicColumns.length; i++){
        this.tableData.map(data => {
          data[this.HCdynamicDisplaycolumns[i]] = data[this.HCdyanmicColumns[i]];
        });
        this.length = this.tableData.length;
        this.fullData = this.tableData;
        this.loading = false;
      }

        if (res.results.hasOwnProperty('floor_count')) {
          this.floorDetails = res.results.floor_count;
        }
        
        this.HCDataSource.paginator = this.paginator;
        this.HCDataSource.sort = this.sort;
      });
    }
  }

  selectedViewAction(key) {
    this.multiViewAction.emit(key);
  }
  getHCPatientByWaitTime(dateValue) {
    this.loading = true;
    this.selection.clear();
    this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.commonService.getHCPatientListByWaitTime(this.selectedDate).subscribe((res) => {

      this.HCDataSource = new MatTableDataSource(res.results);
      this.tableData = res.results;
      this.length = this.tableData.length;
      this.fullData = this.tableData;
      /** Determine the old displayed Column const Columns = ['gender','token_no','firstName','uhid','currentLocationName','health_plan_name','reportStatusName', 'healthTestName', 'testStatusName', 'locationName', 'waitingTime', 'visit_type', 'visitIdentifier'];*/
      for(let i=0; i<= this.HCdyanmicColumns.length; i++){
      this.tableData.map(data => {
        data[this.HCdynamicDisplaycolumns[i]] = data[this.HCdyanmicColumns[i]];
      });
      this.loading = false;
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
    const { key, data } = event;
    const isAssignToken = data.status === 'Assign Token' || data.status === 'Open';
    const isVisitKey = key === 'Visit Status' || key === 'Visit Identifier';

    if (key === 'Name') {
      this.viewPatient(data);
      return;
    } else if (isVisitKey) {
      if (!isAssignToken) {
        this.patientInfo(data);
      } else {
        data['type'] = data.status;
        this.openAssignTokenDialog(data);
      }
      return;
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
       if(this.selectedTab === 'Health Checkup'){
        this.getDetails();
      } else {
        this.pageSizeFP = event.data.pageSize;
        this.pageStartFP = event.data.pageIndex;
        this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
        this.getFollowUpList(this.selectedDate, this.pageStartFP, this.pageSizeFP, this.applyFilterValue);
      }
    } else if (event.key === 'Report Status') {
      let userId = parseInt(localStorage.getItem(btoa('userId')));
      this.commonService.getAppTermsVerion2('ReportStatus').subscribe(res => {
        let reportStatus = res.results;
        if(event?.data?.reportStatusId === 'RS-DIS') {
          reportStatus = res.results?.filter(x => x.code !== 'RS-PEN');
        }
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass:['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Manage Report', message: 'Do you want to change the report status of the patient ' + '"' + event?.data?.name + '"?',
            buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, 'testStatus': true, 'testStatusList': reportStatus, customMsg: true,
            'defaultStatus': event?.data?.reportStatusId
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result?.confirmButtonText === 'Yes') {
            let today = new Date();
            const report = {
              "reportCollectedDate": this.datepipe.transform(today, 'yyyy-MM-dd HH:mm:ss'),
              "reportBy": userId,
              "reportStatusId": result?.statusId,
              "eventTypeId": "HET-RPT",
              "patientId": event?.data?.patientId,
              "patientVisitId": event?.data?.visit_id,
            }
            this.commonService.updateClinicalDetails(report).subscribe(resDate => {
              if (resDate.statusCode === 1) {
                  this.toastr.success('Success', `${resDate.message}`);
                }
              },
              error => {
                this.toastr.error('Error', `${error.error.message}`);
              });
            this.selection.clear();
            this.refreshPage();
          }
        });
      });
      console.log(event);
    } else {
      this.manageCoster(data);
    }
  }

  getDetails() {
    this.loading = true
    this.tableData = this.fullData;
    this.HCDataSource.data = this.fullData;
      for(let i=0; i<= this.HCdyanmicColumns.length; i++){
        this.tableData.map(data => {
          data[this.HCdynamicDisplaycolumns[i]] = data[this.HCdyanmicColumns[i]];    
        });
      }
    this.loading= false
  }


  private openAssignTokenDialog(data) {
    localStorage.setItem('user_guide_menu_code', 'MN_OTHC_ATK');
    const dialogRef = this.dialog.open(AssignTokenComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
  }
  
  viewPatient(patientInfo) {
    let data = { 
      id        : patientInfo.patientId, 
      mainidentifier :  patientInfo.uhid,
      visitType : "VT-HC",   
      tempPatientId:patientInfo.tempPatientId
    };
    localStorage.setItem('user_guide_menu_code', 'MN_OTHC_MD');
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: data, panelClass: ["small-popup"], disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();      
    });
  }
  patientInfo(data) {
    data['type'] = '1';
    const dialogRef = this.dialog.open(PatientInfoComponent, { 
      data: data, panelClass: ['medium-popup'], disableClose: true 
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
        this.refreshPage();
    });
  }
  getPatientHealthPlan(val) {
    console.log(val)
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

  refreshList(dateOptions) {
    this.getPatientHealthPlan(dateOptions);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data, '');
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      if (this.matTabindex === 0) {
        this.getDQdetails(this.selectedDate)
      } else {
        this.gethcDetails(this.selectedDate)
      }
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
    } else if(value === 'merge'){
      this.getAllMergeRecords('');
    }
  }

  applyFilter(filterValue: string, clear) {
    this.pageStart = 0;
    let coasterId: any;
    if(this.selectedTab === 'Health Checkup') {
      if (filterValue.lastIndexOf('~') > -1 && filterValue != null) {
        const splitValue = filterValue.split('=');
        coasterId = splitValue[1].substring(0, 9);
        filterValue = coasterId
        this.input.nativeElement.value = filterValue
        this.applyFilterValue = filterValue.trim().toLowerCase();
        
        this.HCDataSource.filter = filterValue.trim().toLowerCase();      
      } else {
        this.applyFilterValue = filterValue.trim().toLowerCase();
        coasterId = this.HCDataSource.filter;
       const val = filterValue.trim().toLowerCase();
        const filtered = this.fullData.filter(item =>
          item.token_no?.toLowerCase().includes(val) ||
          item.tagId?.toLowerCase().includes(val) ||
          item.name?.toLowerCase().includes(val) ||
          item.uhid?.toLowerCase().includes(val) ||
          item.visit_identifier?.toLowerCase().includes(val) ||
          item.mobile_no?.toLowerCase().includes(val) ||
          item.status?.toLowerCase().includes(val)
        );
        this.length = filtered.length;
        this.tableData = filtered;
        this.HCDataSource.data = this.tableData;
        for (let i = 0; i <= this.HCdyanmicColumns.length; i++) {
          this.tableData.map(data => {
            data[this.HCDisplayedColumns[i]] = data[this.HCdyanmicColumns[i]];
          });
        }
      }
      const filteredRow = this.HCDataSource.data.filter (filter => filter['tagId'] === coasterId);
      if (filteredRow.length > 0 && this.HCDataSource.filter != null && !clear) {
        filteredRow[0]['type'] = 1;  
        this.dialog.open(PatientInfoComponent,
        { data: filteredRow[0], panelClass: ['medium-popup'], disableClose: true });
      }
      if (this.isClearDropdown === true) {
        this.assignFloorId = '';
        this.buildForm();
      }
    } else {
      this.applyFilterForFollowUp(filterValue, coasterId);
    }
  }

  applyFilterForFollowUp(filterValue, coasterId) {
    if (filterValue.lastIndexOf('~') > -1 && filterValue != null) {
      const splitValue = filterValue.split('=');
      coasterId = splitValue[1].substring(0, 9);
      filterValue = coasterId
      this.input.nativeElement.value = filterValue
      this.applyFilterValue = filterValue.trim().toLowerCase();
    } else {
      coasterId = this.HCDataSource.filter;
      this.applyFilterValue = filterValue.trim().toLowerCase();
    }
    this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    this.getFollowUpList(this.selectedDate, this.pageStartFP, this.pageSizeFP, this.applyFilterValue);
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
    if(this.selectedTab === 'Health Checkup') {
      if (this.matTabindex === 4) {
        this.getHCPatientByWaitTime(this.selectedDate);
      } else if (this.matTabindex === 0) {
        this.getDQdetails(this.selectedDate)
      } else {
        this.gethcDetails(this.selectedDate);
      }
    } else {
      this.getFollowUpList(this.selectedDate, this.pageStartFP, this.pageSizeFP, this.applyFilterValue)
    }
  }
  getDQdetails(dateValue) {
    this.selection.clear();
    this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    this.commonService.getDQAllWaitList(this.selectedDate).subscribe((res) => {
      this.HCDataSource = new MatTableDataSource(res.results.data);
      this.tableData = res.results.data;
      this.length = res.results?.data?.length;
      if(this.applyFilterValue !== null && this.applyFilterValue !== undefined){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      this.loading = false;
      /** Determine the old displayed Column const Columns = ['tagId','gender','token_no','isDiabetic','name','uhid', 'visit_type','visit_identifier','mobile_no','consultantName','status','health_plan_name','reportStatusName','issampleCollected','birthDate'];
      this.HCDisplayedColumns = ['Device', 'Gender', 'Token No', 'Diabetic', 'Name', 'UHID', 'Visit Type', 'Visit Id', 'Mobile', 'Consultant Name', 'Visit Status', 'Health Plan', 'Report Status', 'Sample Collected', 'DOB'];*/
      for(let i=0; i<= this.HCdyanmicColumns.length; i++){
        this.tableData.map(data => {
          data[this.HCdynamicDisplaycolumns[i]] = data[this.HCdyanmicColumns[i]];    
        });
      }
      if (res.results.hasOwnProperty('floor_count')) {
        this.floorDetails = res.results.floor_count;
      }      
      this.HCDataSource.paginator = this.paginator;
      this.HCDataSource.sort = this.sort;
    });
  }

  calculateAge(dob){
    if(dob) {
    let currentYear = new Date().getFullYear()
    let year = new Date(dob).getFullYear();
    let age = currentYear - year;
    return age + ' yrs'
    } else {
      return null
    }
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-HC';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    data['age'] = this.calculateAge(data['birthDate']);
    data['gender'] = data.gender;
    localStorage.setItem('user_guide_menu_code', 'MN_OTHC_DAD');
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    const menu = JSON.parse(localStorage.getItem('currentMenu'))
    localStorage.setItem('user_guide_menu_code', menu[0].code);
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }


  openDialog(elements) {
    const dialogRef = this.dialog.open(PatientInfoComponent,
      { data: elements,  panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  registerPatient(id) {
    this.showActions = null;
    localStorage.setItem('user_guide_menu_code', 'MN_OTHC_CR');
    const dialogRef = this.dialog.open(EnrollPatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-HC', 'date': this.selectedDate, 'isRefresh': true },  
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      if (result === 'confirm' || result === '' || result === null) {
        this.refreshPage();
      }
    });
  }

  getAllMergeRecords(data) {
    this.showActions = null;
    if (data === null || data === '') {
      data = {};
    }
    const dialogRef = this.dialog.open(GetAllMergeDataComponent, {
      data: data, panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      const e = eval;
      this.mergeDetails = e(result);
      if (this.mergeDetails) {
        this.patientInfo(this.mergeDetails);
      }
      this.showActions = this.showActions1;
    });
  }

  mergeRecord() {
    const rowLength = this.selection.selected.length;

    if (rowLength >= 1) {
      this.selectedRows = this.selection.selected;
      let selectedRowData = this.selectedRows;
      this.dialog.open(MergeRecordComponent, {
        data: { 'data': selectedRowData },  panelClass: 'medium-popup', disableClose: true
      });
    }
  }


  rowClick(data) {
    this.selectedName = data.id;
  }

  public createHealthCheckup(data) { 
    this.dialog.open(PatientInfoComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    this.selectedName = data.id;
  }
}

@Component({
  selector: 'get-all-merge-data',
  templateUrl: './get-all-merge-data.component.html',
  styleUrls: ['./health-checkup.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ],
})

export class GetAllMergeDataComponent implements OnInit {

  rightDisplayedColumns: string[] = ['select', 'tokenNo' , 'firstName', 'mobileNo'];
  leftDisplayedColumns: string[] = ['select', 'firstName', 'mainidentifier', 'mobileNo', 'packageId'];

  dataSource = new MatTableDataSource();
  rightDataSource = new MatTableDataSource();
  leftDataSource = new MatTableDataSource();

  public selectedName: any;
  public rowData: any = [];
  public mergeData = [];
  public activate_btn: any = [];
  public filtervalue: string;
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  selectedRows: Array<any> = [];
  public mergeForm: FormGroup;
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public maxHeight: any;
  public tempPatientList: Array<any> = [];
  public MMPatientList: Array<any> =  [];
  public mergeDetails: any;
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  today = new Date();


  constructor(public toastr: AppToastService, public datepipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialog: MatDialog,
    public commonService: CommonService, private readonly workflowService: WorkflowService,
    public thisDialogRef: MatDialogRef<GetAllMergeDataComponent>, public fb: FormBuilder, private readonly dateAdapter: DateAdapter<Date>
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.today.setDate(this.today.getDate());
  }

  ngOnInit() {
    this.buildForm();

    this.getAllMergeData(this.selectedDate);

    if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
      this.maxHeight = 700;
    } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
      this.maxHeight = 350;
    } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
      this.maxHeight = 350;
    } else if (window.innerWidth <= 768) {
      this.maxHeight = 350;
    } else {
      this.maxHeight = 700;
    }
  }

  onResize(event) {
    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.maxHeight = 700;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.maxHeight = 350;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
      this.maxHeight = 350;
    } else if (event.target.innerWidth <= 768) {
      this.maxHeight = 350;
    } else {
      this.maxHeight = 700;
    }
  }

  buildForm() {
    this.mergeForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
    });
  }



  applyFilterBilled(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.leftDataSource.filter = filterValue.trim().toLowerCase();
  }

   
  applyFilterEnrolled(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.rightDataSource.filter = filterValue.trim().toLowerCase();
  }

  
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if (this.dataSource?.data?.length) {
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }
  }

  
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  public getAllMergeData(date) {
    if (date != null) {
      this.selectedDate = this.datepipe.transform(new Date(date), 'yyyy-MM-dd');
    } else {
      this.selectedDate = '';
    }

    if (this.data?.hasOwnProperty('name')) {
      this.MMPatientList = [{
        'fullName': this.data.name,
        'mainidentifier': this.data.uhid,
        'mobileNo': this.data.mobile_no,
        'packageName': this.data.health_plan_name,
        'gender': this.data.gender,
        'birthDate': this.data.birthDate,
        'isExistingPatient': 'In Progress',
        'firstName': this.data.firstName,
        'middleName': this.data.middleName,
        'lastName': this.data.lastName,
        'tempPatientId': this.data.patientId
      }];

      this.workflowService.getPatientMergeData().subscribe(res => {
        for (const result of res.results) {
          result.isExistingPatient = result.isExistingPatient === true ? 'Enrolled' : 'In Progress';
        }
        this.tempPatientList = [];
        this.MMPatientList = [];
        this.tempPatientList = res.results;
        this.rightDataSource = new MatTableDataSource<any>(this.tempPatientList);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
      this.leftDataSource = new MatTableDataSource<any>(this.MMPatientList);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    } else {
      this.workflowService.getAllMergeData(this.selectedDate).subscribe(res => {
        this.data = res.results;
        this.tempPatientList = [];
        this.MMPatientList = [];
        for (const item of this.data) {
          if (item.isExistingPatient === true) {
            item.isExistingPatient = 'Enrolled';
            this.tempPatientList.push(item);
          } else {
            item.isExistingPatient = 'In Progress';
            this.MMPatientList.push(item);
          }
        }
        this.rightDataSource = new MatTableDataSource<any>(this.tempPatientList);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;

        this.leftDataSource = new MatTableDataSource<any>(this.MMPatientList);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
    }
  }


  selectedCheckBoxValue() {
    this.selectedRows = this.selection.selected;
    const checkbox_values = this.selectedRows.length;

    if (checkbox_values >= 1) {
        setTimeout(() => {
          this.selectedRows = this.selection.selected;
 
          this.selectedRows = [this.selectedRows]
          this.selectedRows.sort((a, b) => (a.isExistingPatient > b.isExistingPatient) ? 1 : ((b.isExistingPatient > a.isExistingPatient) ? -1 : 0)
          ); 
          if (this.selectedRows[0].isExistingPatient !== this.selectedRows[1].isExistingPatient) {

            const dialogRef = this.dialog.open(MergeRecordComponent, {
            data: { 'data': this.selectedRows },  panelClass: 'medium-popup', disableClose: true
          });
          dialogRef.afterClosed().subscribe(result => {
            const e = eval;
            this.mergeDetails = e(result);
            this.thisDialogRef.close(this.mergeDetails);
          });
        } else {
          this.toastr.warning('Warning', `Select one 'MM' & 'TW' Table!`);
        }
        });
      }
      setTimeout(() => {
        this.selection.clear();
    }, 10000);
  }
  fixClick() {
    console.log('')
  }    
}

@Component({
  selector: 'merge-record',
  templateUrl: './merge-record.component.html',
  styleUrls: ['./health-checkup.component.scss'],
  providers: [DatePipe],
})

export class MergeRecordComponent implements OnInit {

  displayedColumns: string[] = ['name', 'mainidentifier', 'Gender', 'dob', 'mobileNumber', 'package', 'lastVisitDate', 'status'];
  displayedData = [
    { 'colName': 'name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'mainidentifier', 'title': 'UHID', 'dataName': 'mainidentifier' },
    { 'colName': 'Gender', 'title': 'Gender', 'dataName': 'gender' },
    { 'colName': 'dob', 'title': 'DOB', 'dataName': 'dob' },
    { 'colName': 'mobileNumber', 'title': 'Mobile', 'dataName': 'mobileNumber' },
    { 'colName': 'lastVisitDate', 'title': 'Date', 'dataName': 'lastVisitDate' },
    { 'colName': 'package', 'title': 'Package', 'dataName': 'package' },
    { 'colName': 'status', 'title': 'Status', 'dataName': 'status' },

  ];

  dataSource: MatTableDataSource<any>;
  public createMergeRecord: CreateMergeRecord;

  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public filtervalue: string;
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public mergeList: any = [];

  public firstName: string;
  public middleName: string;
  public lastName: string;
  public birthDate: string;
  public mobileNo: number;
  public patientId: number;
  public tokenNo: number;
  public tempPatientId: number;

  selectedRows: Array<{}> = [];
  selection = new SelectionModel<any>(true, []);

  tempFirstName: boolean;
  tempMiddleName: boolean;
  tempLastName: boolean;
  tempMobileNo: boolean;
  tempBirthDate: boolean;

  originalFirstName: boolean;
  originalMiddleName: boolean;
  originalLastName: boolean;
  originalMobileNo: boolean;
  originalBirthDate: boolean;
  public tokenEnrollFlow: boolean;
  public patientVisitId: any;
  public patientSummaryList: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public datepipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any, public toastr: AppToastService,
    private readonly dialog: MatDialog,
    public commonService: CommonService, private readonly workflowService: WorkflowService,
    public thisDialogRef: MatDialogRef<MergeRecordComponent>,
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.filtervalue = data;
console.log('MERGE DATA >>', data)
  }

  ngOnInit() {
    this.tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));

    if (this.tokenEnrollFlow === true) {
      this.originalFirstName = true;
      this.originalMiddleName = true;
      this.originalLastName = true;
      this.originalMobileNo = true;
      this.originalBirthDate = true;

      const tempMergeDetails = this.data.data.filter(res => res.isExistingPatient === 'In Progress');
      const MergeDetails = this.data.data.filter(res => res.isExistingPatient === 'Enrolled');

      if (MergeDetails) {
        this.patientId = MergeDetails[0].patientId;
        this.patientVisitId = MergeDetails[0].patientVisitId;
        this.tokenNo = MergeDetails[0].tokenNo;
      }

      if (tempMergeDetails) {
        this.firstName = tempMergeDetails[0].firstName;
        this.middleName = tempMergeDetails[0].middleName;
        this.lastName = tempMergeDetails[0].lastName;
        this.mobileNo = tempMergeDetails[0].mobileNo;
        this.birthDate = tempMergeDetails[0].birthDate;
        this.tempPatientId = tempMergeDetails[0].tempPatientId;
      }
    }
  }



  twoRowData(event, data) {
    if (data.data[0].patientId != null && data.data[0].isExistingPatient === 'Enrolled') {
      this.patientId = data.data[0].patientId;
    } else if (data.data[1].patientId != null && data.data[1].isExistingPatient === 'Enrolled') {
      this.patientId = data.data[1].patientId;
    }
    if (data.data[0].tempPatientId != null && data.data[0].isExistingPatient !== 'Enrolled') {
      this.tempPatientId = data.data[0].tempPatientId;
    } else if (data.data[1].tempPatientId != null && data.data[1].isExistingPatient !== 'Enrolled') {
      this.tempPatientId = data.data[1].tempPatientId;
    }
  }

  compareTwoData(event, data, type) {
    if (type === 'tempFirstName') {
      this.firstName = data;
      this.setTempFirstName(event);
    } else if (type === 'originalFirstName') {
      this.firstName = data;
      this.setOriginalFirstName(event);
    } else if (type === 'tempMiddleName') {
      this.middleName = data;
      this.setTempMiddleName(event);
    } else if (type === 'originalMiddleName') {
      this.middleName = data;
      this.setOriginalMiddleName(event);
    } else if (type === 'tempLastName') {
      this.lastName = data;
      this.setTempLastName(event);
    } else if (type === 'originalLastName') {
      this.lastName = data;
      this.setOriginalLastName(event);
    } else if (type === 'tempMobileNo') {
      this.mobileNo = data;
      this.setTempMobileNo(event);
    } else if (type === 'originalMobileNo') {
      this.mobileNo = data;
      this.setOriginalMobileNo(event);
    } else if (type === 'tempBirthDate') {
      this.birthDate = data;
      this.setTempBirthDate(event);
    } else if (type === 'originalBirthDate') {
      this.birthDate = data;
      this.setOriginalBirthDate(event);
    }
  }

  setTempFirstName(event) {
    if (event.checked === true) {
      this.tempFirstName = true;
      this.originalFirstName = false;
    }
  }
  setOriginalFirstName(event) {
    if (event.checked === true) {
      this.originalFirstName = true;
      this.tempFirstName = false;
    }
  }
  setTempMiddleName(event) {
    if (event.checked === true) {
      this.tempMiddleName = true;
      this.originalMiddleName = false;
    }
  }
  setOriginalMiddleName(event) {
    if (event.checked === true) {
      this.originalMiddleName = true;
      this.tempMiddleName = false;
    }
  }
  setTempLastName(event) {
    if (event.checked === true) {
      this.tempLastName = true;
      this.originalLastName = false;
    }
  }
  setOriginalLastName(event) {
    if (event.checked === true) {
      this.originalLastName = true;
      this.tempLastName = false;
    }
  }
  setTempMobileNo(event) {
    if (event.checked === true) {
      this.tempMobileNo = true;
      this.originalMobileNo = false;
    }
  }
  setOriginalMobileNo(event) {
    if (event.checked === true) {
      this.originalMobileNo = true;
      this.tempMobileNo = false;
    }
  }
  setTempBirthDate(event) {
    if (event.checked === true) {
      this.tempBirthDate = true;
      this.originalBirthDate = false;
    }
  }
  setOriginalBirthDate(event) {
    if (event.checked === true) {
      this.originalBirthDate = true;
      this.tempBirthDate = false;
    }
  }

  public saveMergeRecord() {
    this.createMergeRecord = new CreateMergeRecord(null, null, null, null, null, null, null, null);
    this.createMergeRecord.firstName = this.firstName;
    this.createMergeRecord.middleName = this.middleName;
    this.createMergeRecord.lastName = this.lastName;
    this.createMergeRecord.mobileNo = this.mobileNo;
    this.createMergeRecord.tokenNo = this.tokenNo;
    this.createMergeRecord.birthDate = this.birthDate;
    this.createMergeRecord.patientId = this.patientId;
    this.createMergeRecord.tempPatientId = this.tempPatientId;

    this.commonService.saveMergeRecord(this.createMergeRecord).subscribe(res => {

      this.patientSummaryList = {
        'patientId': this.patientId,
        'patinetVisitId': this.patientVisitId,
        'tokenNo':this.tokenNo
      };

      console.log(this.patientSummaryList, this.createMergeRecord);

      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close(this.patientSummaryList);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
}
