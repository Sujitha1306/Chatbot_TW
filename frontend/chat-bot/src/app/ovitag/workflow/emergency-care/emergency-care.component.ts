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

import { Component, OnInit, ViewChild,  Input,  ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl,  } from '@angular/forms';
import { MatDialog,  } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, HospitalService, WorkflowService } from '../../../shared';
import { SelectionModel } from '@angular/cdk/collections';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { DatePipe } from '@angular/common';
import { DigitalQueueModel, DigitalQueueModelCols, DigitalQueueModelRows, DigitalQueueModelId } from './emergency-care.component.model';
import { EnrollRegisterPatientComponent, CoasterComponent} from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MY_FORMATS } from '../../../app.module';
import { PorterRequestNewComponent } from '../../../shared/modules/entry-component/porter-request/porter-request.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';

@Component({
  selector: 'app-emergency-care',
  templateUrl: './emergency-care.component.html',
  styleUrls: ['./emergency-care.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EmergencyCareComponent implements OnInit, OnDestroy {
  public matcher = new ErrorStateMatcherService();
  public selectedName: any = null;
  public dataSource;
  public day = ['Today', 'Yesterday', 'Week'];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  OTDataSource = new MatTableDataSource();
  public floors: any[] = [];
  public floorList: any;
  public maxHeight: any;
  public maxElementCheckbox = 2;
  selectedRows: Array<{}> = [];
  checkbox_values: number;
  public selectedTabIndex = 0;
  public matTabIndex: any = 0;
  public today = new Date();
  public mergeDetails: any;
  public floorDetails: any;
  public activate_btn: any = [];
  public applyFilterValue: any;
  public isAutoRefresh = false;
  public list_height: any;
  public gridCols: any = 4;
  public digitalQueueModel: DigitalQueueModel;
  public digitalQueueModelCols: DigitalQueueModelCols;
  public digitalQueueModelRows: DigitalQueueModelRows;
  public digitalQueueModelId: DigitalQueueModelId;
  public digitalQueueList_new: Array<any> = [];

  floorForm = new FormGroup({
    assignedFloor: new FormControl()
  });

  HCDisplayedData = [
  {'colName': 'ID', 'title': 'ID', 'dataName': 'ID' },
  { 'colName': 'Device', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/mob_coaster.svg" alt="mob_coaster" >', 'dataName': 'device' },
  { 'colName': 'Patient Type', 'title': 'Patient Type', 'dataName': 'patientType' },
  { 'colName': 'Gender', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/gender_male_female.svg" alt="gender" >', 'dataName': 'gender' },
  { 'colName': 'UHID', 'title': 'UHID', 'dataName': 'uhid' },
  { 'colName': 'Name', 'title': 'Name', 'dataName': 'name' },
  { 'colName': 'Age', 'title': 'Date Of Birth', 'dataName': 'birthdate' },
  { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile_no' },
  { 'colName': 'Doctor Name', 'title': 'Doctor', 'dataName': 'consultantName' },
  { 'colName': 'ER Start Time', 'title': 'ER Start Time', 'dataName': 'birthdate' },
  { 'colName': 'Status', 'title': 'Visit Status', 'dataName': 'status' },
  { 'colName': 'Length of stay (hh:mm)', 'title': 'Length of stay', 'dataName': 'birthdate' },
  { 'colName': 'Discharge Reason', 'title': 'Discharge Reason', 'dataName': 'birthdate' },  
  { 'colName': 'Current Location', 'title': 'Floor', 'dataName': 'floor_name' },
  ];

  HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName);

  public hcForm: FormGroup;
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  public isClearDropdown = true;
  public assignFloorId = '';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') input;
  @ViewChild(MatSort) sort: MatSort;
  @Input() matTabindex: any;
  height: number;
  CardHeight: number;
  tableData: any;
  eventColumn = ['Device','Status'];
  iconHeader = ['ID','Device','Gender', 'Patient Type'];
  iconColumn = ['ID','Device','Gender','DOB','Current Location', 'ER Start Time', 'Patient Type'];
  sortColumn = ['ID'];
  timeColumns = []
  dateTimeColumns = ['ER Start Time']
  permissionControl = ['BT_ALLE'];
  width: number;
  selectedView = 'table';
  showAction1 = [
    { id: 'enroll', value: 'Enroll' },{ id: 'porter', value: 'Porter Request' }
  ];
  showAction2 = [
    { id: 'porter', value: 'Porter Request' }
  ];
  public showActions = this.showAction1;
  public selectFilter = [{ id: "ward", value: "WARD" }];
  public rowFilter: any;
  selectDropdown: string;
  rowData = null;
  locationId: any;
  location = null;
   public contextOptions = {'show' : {
    'navbar' : true,
    'navMenu': false,
    'blockSelect': true,
    'floorSelect': true,
    'searchBox' : true,
    'navBlkImg': true,
    'navBlkContent': true,
    'navBlkList': true,
    'filterOption': true
  }}
  public floorId = null;
  public blockId = null;
  public otCardInfo:Array<any> = [];
  public statusCountInfo:Array<any> = [];
  public refreshInterval : any;
  refreshValue:number = 300*1000;

  constructor(public dialog: MatDialog, private readonly router: Router, public fb: FormBuilder,
    public datepipe: DatePipe, private readonly dateAdapter: DateAdapter<Date>,
    private readonly commonService: CommonService, private readonly hospitalService: HospitalService,
    private readonly workflowService: WorkflowService, private readonly route: ActivatedRoute) {
    this.digitalQueueModelId = new DigitalQueueModelId();
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate());
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getInterval();
  }

  ngOnInit() {
    this.height = window.innerHeight - 215;
    this.CardHeight = window.innerHeight - 135;
    this.searchLoc('ward');
    this.buildForm();
    this.getFloors();
    this.getOTOverall();

    
    if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
      this.gridCols = 4;
    } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
      this.gridCols = 4;
    } else if (window.innerWidth <= 1279 && window.innerWidth >= 900) {
      this.gridCols = 3;
    } else if (window.innerWidth <= 899 && window.innerWidth >= 600) {
      this.gridCols = 2;
    } else if (window.innerWidth <= 599) {
      this.gridCols = 1;
    } else {
      this.gridCols = 4;
    }
    this.gethcDetails(this.selectedDate, true);
  }

  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(data => {
      let menuCode = localStorage.getItem(btoa('menuCode'));
      if (data?.results ) {
        const contentData = JSON.parse(data.results.content);
        if (contentData.hasOwnProperty(menuCode)){
          this.refreshValue = contentData[menuCode].interval * 1000;
        }
      }
        this.checkInterval();
    });
  }

  checkInterval() {
    this.refreshInterval = setInterval(() => {
      this.gethcDetails(this.selectedDate, false);
    }, this.refreshValue);
  }

  onResizeWindow1(event) {
    const height = (event.target.innerHeight - 202) / 46;
    console.log(height);
  }

  onResizeWindowF(data) {
    const height = (data - 202) / 46;
    this.list_height = data - 310;
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }
  onResizeWindow(event) {
    const height = (event.target.innerHeight - 202) / 46;
    this.list_height = event.target.innerHeight - 310;
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }

  onResizeGridCols(event) {
    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 900) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 899 && event.target.innerWidth >= 600) {
      this.gridCols = 2;
    } else if (event.target.innerWidth <= 599) {
      this.gridCols = 1;
    } else {
      this.gridCols = 4;
    }
  }
  searchLoc(id) {
    if(id === 'ward'){
      this.commonService.getSpecialityLoc('CS-EC', null).subscribe(res => {
        this.rowFilter = res.results;
      });
    }
  }
  selectedTabAction(key) {
    if (key !== null) {
      this.selectedView = key;
      if (this.selectedView === 'table') {
        this.gethcDetails(this.selectedDate);
      } else {
        this.getOTOverall();
      }
    }
  }
  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.selectedView = null;
    this.selectedTabIndex = tabChangeEvent.index;
    if (this.selectedTabIndex === 0) {
      this.selectedView = 'table';
      this.gethcDetails(this.selectedDate);
    } else if(this.selectedTabIndex == 1) {
      this.selectedView = 'card';
      this.getOTOverall();
    } else if (false) {
      this.selectedView = null;
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data, '');
    } else if (event.key === 'enroll') {
      this.registerPatient(null);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd')
      this.refreshPage()
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'manageWorklist') {
      this.manageWorklist(event.data);
    } else if(event.key === 'manageFilter') {
      this.searchLoc(event.data);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  manageWorklist(locId) {
    this.locationId = locId;
  }
  manageAction(value, data) {
    if (value === 'porter' && data !== true) {
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
            this.selectedName = null;
            this.refreshPage();
          });
        });
      } else {
        const data = this.rowData;
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: {type: 'PR-PA', id: data.patientId, name: data.Name},
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.selectDropdown = null;
          this.selectedName = null;
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
        this.refreshPage();
      });
    } else if (value === 'enroll') {
      this.selectDropdown="enroll";
      const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
        data: { 'id': data.id, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate, 'isRefresh': true, 'visitType': 'VT-EC' },
        panelClass: ['small-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = null;
        this.refreshPage();
      });
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

  getOTOverall() {
    this.commonService.getPatientQueueStatusCount(this.selectedDate, 'VT-EC').subscribe(res => {
      if(res.statusCode == 1){
        this.statusCountInfo = res.results;
      }else{
        this.statusCountInfo = [];
      }
    }
    )
    this.commonService.getOtCardSummary(this.selectedDate, null, null, this.location , 'VT-EC').subscribe(res => {
      if(res.statusCode == 1){
        this.otCardInfo = res.results;
        this.otCardInfo.forEach((category) => {
          category.tests.forEach((test) => {
            this.setThreatsTooltip(test);
          });
      });
      }else{
        this.otCardInfo = [];
      }
    });
  }

  setThreatsTooltip(test) {
    if(test.hasOwnProperty('patients')){
      test.patients.forEach((patient) => {
        if (patient.threats && patient.threats.length > 0) {
            patient.threatsTooltip = patient.threats.map((threat) => threat.name).join(",");
        } else {
            patient.threatsTooltip = null;
        }
      });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  gethcDetails(dateValue,routerEvent?: boolean): void {
    this.selection.clear();
    this.showActions = this.showAction1;
      this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
      this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.OTDataSource = new MatTableDataSource(this.route.snapshot.data.emergencyCare.results.data);
      this.tableData = this.route.snapshot.data.emergencyCare.results.data;
        const Columns = ['ID', 'tagId','patientType', 'gender', 'uhid','name','birthDate','mobile_no', 'consultantName', 'visitDate','status','lengthOfStay','dischargeReasonValue','currentLocationName'];
        for(let i=0; i<= Columns.length; i++){
            this.tableData.map(data => {
              data['patientVisitId'] = data['visit_id'] ;
            if(this.HCDisplayedColumns[i] == 'Status' && data['visitStatusValue'] == 'Discharged') {
              data[this.HCDisplayedColumns[i]] = data['visitStatusValue'] ;
            } else if (this.HCDisplayedColumns[i] == 'Age') {
              data[this.HCDisplayedColumns[i]] = data['birthDate'] ? this.calculateAge(data['birthDate']) :  data['birthDate'];
            } else {
              data[this.HCDisplayedColumns[i]] = data[Columns[i]];
            }
          });
        }
        if (this.tableData.hasOwnProperty('floor_count')) {
          this.floorDetails = this.tableData.floor_count;
        }
        if (this.applyFilterValue != null) {
          this.OTDataSource.filter = this.applyFilterValue;
        }
        this.OTDataSource.paginator = this.paginator;
        this.OTDataSource.sort = this.sort;
    } else {
      this.commonService.getHcPatientList(this.selectedDate, 'HP-EC').subscribe((res) => {
        this.OTDataSource = new MatTableDataSource(res.results.data);
        this.tableData = res.results.data;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['ID', 'tagId','patientType', 'gender', 'uhid','name','birthDate','mobile_no', 'consultantName', 'visitDate','status','lengthOfStay','dischargeReasonValue','currentLocationName'];
        for(let i=0; i<= Columns.length; i++){
          this.tableData.map(data => {
            data['patientVisitId'] = data['visit_id'];
            if(this.HCDisplayedColumns[i] == 'Status' && data['visitStatusValue'] == 'Discharged') {
              data[this.HCDisplayedColumns[i]] = data['visitStatusValue'] ;
            } else if (this.HCDisplayedColumns[i] == 'Age') {
              data[this.HCDisplayedColumns[i]] = data['birthDate'] ? this.calculateAge(data['birthDate']) :  data['birthDate'];
            } else { 
              data[this.HCDisplayedColumns[i]] = data[Columns[i]];
            }
          });
        }
        if (res.results.hasOwnProperty('floor_count')) {
          this.floorDetails = res.results.floor_count;
        }
        if (this.applyFilterValue != null) {
          this.OTDataSource.filter = this.applyFilterValue;
        }
        this.OTDataSource.paginator = this.paginator;
        this.OTDataSource.sort = this.sort;
      });
    }
  }
  rowClick(data) {
    if (this.selectedName && data.patientId !== this.selectedName.patientId) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data.patientId;
      this.rowData = data;
    }
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

  manageEventStatus(event) {
    if(event.data.patientType == 'Ambulance') {
      event.data['tempPatientId'] = event.data.hasOwnProperty('patientId') ? event.data.patientId : null;
      event.data['patientId'] = null;
      event.data['mobileNo'] = event.data.hasOwnProperty('mobile_no') ? event.data.mobile_no : null;
      this.registerPatient(event.data);
    } else {
     this.patientInfo(event.data);
    }
  }

 eventAction(event) {
   if(event.key === 'Status') {
    this.manageEventStatus(event);
   } else if (event.key === 'Current Location'){
    this.currentLocationData(event.data);
   } else {
    this.callEvent(event);
   }
 }
 callEvent(event) {
  if(event.data.patientType == 'Ambulance') {
    event.data['tempPatientId'] = event.data.hasOwnProperty('patientId') ? event.data.patientId : null;
    event.data['patientId'] = null;
    event.data['mobileNo'] = event.data.hasOwnProperty('mobile_no') ? event.data.mobile_no : null;
    this.registerPatient(event.data);
  } else {
    this.manageCoster(event.data);
  }
 }

 currentLocationData(data){
  data['floorId'] = data.currentFloorId;
  data['tagTypeId'] = data['tag_associated_type'];
  data['tagSerialNumber'] = data['tagId']
  if (data.tagSerialNumber !== null && data.floorId !== null  ){
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: data,
      panelClass: 'medium-popup',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.gethcDetails(this.selectedDate);
    });
  }
 }
  patientInfo(data) {
    data['type'] = '1';
    data['from'] = 'OP-list';
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true 
    });
    dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
    });
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

  applyFilter(filterValue: string, clear) {
    let coasterId: any;

    if (filterValue.lastIndexOf('~') > -1 && filterValue != null) {
      const splitValue = filterValue.split('=');
      coasterId = splitValue[1].substring(0, 9);
      filterValue = coasterId;
      this.input.nativeElement.value = filterValue;
      this.applyFilterValue = filterValue.trim().toLowerCase();
      this.OTDataSource.filter = filterValue.trim().toLowerCase();
    } else {
      coasterId = this.OTDataSource.filter;
      this.applyFilterValue = filterValue.trim().toLowerCase();
      this.OTDataSource.filter = filterValue.trim().toLowerCase();
    }

    const filteredRow = this.OTDataSource.data.filter (filter => filter['tagId'] === coasterId);

    if (filteredRow.length > 0 && this.OTDataSource.filter != null && !clear) {
      filteredRow[0]['type'] = 1;
      this.dialog.open(PatientInfoComponent,
      { data: filteredRow[0], panelClass: ['medium-popup'], disableClose: true });
    }
    if (this.isClearDropdown === true) {
      this.assignFloorId = '';
      this.buildForm();
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    if (this.selectedView === 'table') {
      this.gethcDetails(this.selectedDate);
    } else if(this.selectedView === 'card') {
      this.getOTOverall();
    }
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-OT';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    data['patientVisitEventId'] = data.visitEventId;
    data['age'] = this.calculateAge(data['birthDate']);
    data['gender'] = data.gender;
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

  registerPatient(patientInfo) {
    let data = { 'id': patientInfo, 'workflowTypeId': 'WF-EC', 'date': this.selectedDate, 'isRefresh': true, 'visitType': 'VT-EC', tempPatientInfo : null}
    if(patientInfo) {
      data = patientInfo;
      data['tempPatientInfo'] = null
      data['workflowTypeId'] =  'WF-EC';
      data['date'] = this.selectedDate; 
      data['isRefresh'] = true; 
      data['visitType'] = 'VT-EC';
      if(patientInfo?.patientType == 'Ambulance' ) {
        data = {  'id': null, 'workflowTypeId': 'WF-EC', 'date': this.selectedDate, 
                  'isRefresh': true, 'visitType': 'VT-EC', 
                  tempPatientInfo : null
              };
        data['tempPatientInfo'] = patientInfo;
      }
    } 
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  locationInfo(id, name, status, testId, count, testType, visitStatusId, planTypeId) {
    if (count > 0) {
      const dialogRef = this.dialog.open(PatientInfoComponent, {
        data: { 'id': id, 'name': name, 'status': status, 'testId': testId, 'testType': testType, 'visitStatusId': visitStatusId, 'planTypeId': planTypeId },
         panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
          this.refreshPage();
      });
    }
  }
  fixClick() {
    console.log('')
  }    
}
