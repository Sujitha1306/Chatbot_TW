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

import { Component, OnInit, ViewChild,  Input,  OnDestroy, ViewEncapsulation, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl,  } from '@angular/forms';
import { MatDialog,   } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, ConfigurationService, ExcelService, HospitalService, WorkflowService } from '../../../shared';
import { SelectionModel } from '@angular/cdk/collections';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { DatePipe } from '@angular/common';
import { DigitalQueueModel, DigitalQueueModelCols, DigitalQueueModelRows, DigitalQueueModelId } from './ot.component.model';
import { CoasterComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MY_FORMATS } from './../../../../app/app.module';
import { PorterRequestHistoryComponent, PorterRequestNewComponent } from '../../../shared/modules/entry-component/porter-request/porter-request.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { ChartType } from 'angular-google-charts';
import * as ExcelJS from "exceljs/dist/exceljs.min.js";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { AppOtNewComponent } from '../../../shared/modules/entry-component/app-ot-new/app-ot-new.component';
import { ManagePatientComponent } from '../../../shared/modules/entry-component/manage-patient/manage-patient/manage-patient.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';


@Component({
  selector: 'app-ot',
  templateUrl: './ot.component.html',
  styleUrls: ['./ot.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class OTComponent implements OnInit, OnDestroy {
  public matcher = new ErrorStateMatcherService();
  public selectedName: any = null;
  public dataSource;
  public day = ['Today', 'Yesterday', 'Week'];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  OTDataSource = new MatTableDataSource();
  public floors: any[] = [];
  public floorList: any;
  public floorId = 0;
  public maxHeight: any;
  public maxElementCheckbox = 2;
  selectedRows: Array<{}> = [];
  checkbox_values: number;
  public selectedTabIndex = 0;
  public selectedTab = 'Planned Surgeries';
  public matTabIndex: any = 0;
  public today = new Date();
  public mergeDetails: any;
  public floorDetails: any;
  public activate_btn: any = [];
  public applyFilterValue: any = null;
  public isAutoRefresh = false;
  public list_height: any;
  public gridCols: any = 4;
  public digitalQueueModel: DigitalQueueModel;
  public digitalQueueModelCols: DigitalQueueModelCols;
  public digitalQueueModelRows: DigitalQueueModelRows;
  public digitalQueueModelId: DigitalQueueModelId;
  public digitalQueueList_new: Array<any> = [];
  public otCardInfo:Array<any> = [];
  public statusCountInfo:Array<any> = [];
  public loading = true;
  public current_Location = false;
  porterDetails: any;
  PRDisplayedColumns: string[] = [
    "ID","Requester","Description","Type", "Patient Name","Bed Name","Gender","Needed","Group","Time",	"Pickup",	"Drop",	"Porter", "Count", "Status", "Priority", "Remarks", "Assigned Time", "Drop Time", 'Manual Complete', "Location"];
  iconColumnPR = ["ID","Requester","Gender","Time","Location","Status","Assigned Time","Drop Time","Description","Pickup","Drop","Remarks","Priority"];
  iconHeaderPR = ["ID", "Device", "Gender"];
  PRDTimeColumns = ["Time","Drop Time"]
  PRDDateTimeColumns = ["Assigned Time"]
  currentYear: number;
  floorForm = new FormGroup({
    assignedFloor: new FormControl()
  });
  timelineChart = {};
  public totalRecords :number;
  public doctorList=[];
  public locationList=[];
  public surgeryList=[]

  

  HCDisplayedData = [
  {'colName': 'ID', 'title': 'ID', 'dataName': 'ID' },
  { 'colName': 'Device', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/mob_coaster.svg" alt="coaster" >', 'dataName': 'device' },
  { 'colName': 'Gender', 'title': '<img width="30" height="30" src="/assets/Alert/common_icons/gender_male_female.svg" alt="gender" >', 'dataName': 'gender' },
  { 'colName': 'Token No', 'title': 'Token No', 'dataName': 'token_no' },
  { 'colName': 'Porter', 'title': 'Porter', 'dataName': 'porterRequestId' },
  { 'colName': 'Icons', 'title': 'Icons', 'dataName': 'Icons' },
  { 'colName': 'Name', 'title': 'Name', 'dataName': 'name' },
  { 'colName': 'UHID', 'title': 'UHID', 'dataName': 'uhid' },
  { 'colName': 'Schedule Time', 'title': 'Schedule Time', 'dataName': 'visitEventFrmTime' },
  { 'colName': 'End Time', 'title': 'End Time', 'dataName': 'scheduleEndTime' },
  { 'colName': 'Tag ID', 'title': 'Tag', 'dataName': 'tagId' },
  { 'colName': 'OT Location', 'title': 'OT Location', 'dataName': 'eventLocationName' },
  { 'colName': 'Doctor Name', 'title': 'Doctor', 'dataName': 'consultantName' },
  { 'colName': 'Status', 'title': 'Status', 'dataName': 'status' },
  { 'colName': 'Current Location', 'title': 'Floor', 'dataName': 'floor_name' },
  { 'colName': 'Surgery Name', 'title': 'Surgery', 'dataName': 'otProcedureName' },
  { 'colName': 'DOB', 'title': 'Date Of Birth', 'dataName': 'birthdate' },
  { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile_no' },
  ];

  HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName);
  timeColumns=["Schedule Time"]
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
  eventColumn = ['Porter','Device','Status'];
  iconHeader = ['ID','Device','Gender','Token No', 'Icons'];
  iconColumn = ['ID','Device','Gender','Porter','Icons','DOB', 'Current Location','Schedule Time','End Time','Name','DOB','Mobile', 'Surgery Name'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  width: number;
  selectedView = 'table';
  showAction1 = [
    { id: 'enroll', value: 'Enroll' },{ id: 'porter', value: 'Porter Request' }
  ];
  showAction2 = [
    { id: 'porter', value: 'Porter Request' },
    { id: 'modify', value: 'Modify' }
  ];
  showAction3 = [
    { id: 'porter', value: 'Porter Request' },
    { id: 'modify', value: 'Modify' },
    { id: 'cancel', value: 'Cancel Request' }
  ];
  public showActions = this.showAction1;
  selectDropdown: string;
  rowData = null;
  public otInterval : any;
  refreshValue:number = 300*1000;
  isChartLoading: boolean = true;
  calendarData = null;
  @ViewChild('timelineElement', { static: false }) timelineElement: ElementRef;
  public parentFilter = [{
    id: 'ward',
    value: 'Ward',
    isAll: true,
    selectionType: 'multi',
    subFilters: [],
    defaultSelected: ['All']
  },
  {
    id: 'status',
    value: 'Status',
    isAll: true,
    selectionType: 'multi',
    subFilters: [],
    defaultSelected: ['All']
  }];
  location = null;
  visitEventStatuses = null;
  configdataColums: any;

  constructor(public dialog: MatDialog, private readonly router: Router, public fb: FormBuilder,
    public excelService: ExcelService, private readonly lookupTermService: LookupTermService,
    public datepipe: DatePipe, private readonly dateAdapter: DateAdapter<Date>,
    private readonly commonService: CommonService, private readonly hospitalService: HospitalService, private readonly configurationServices:ConfigurationService,
    private readonly workflowService: WorkflowService, private readonly route: ActivatedRoute, public toastr: AppToastService) {
    this.getDynamicTableColumn()
    this.digitalQueueModelId = new DigitalQueueModelId();
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate());
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getInterval()
  }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.height = window.innerHeight - 215;
    this.CardHeight = window.innerHeight - 135;
    this.getPermissionDropDown();
    this.buildForm();
    this.getFloors();
    this.calenderDetails();

    this.commonService.getSpecialityLoc("CS-OT", null).subscribe((res) => {
      if (res.statusCode === 1) {
        const locationList = this.parentFilter.find(res => res.id === 'ward')
        if (locationList) {
          locationList.subFilters = res.results.map(({ id, name }) => ({code: id, value: name}));
        }
      }
    });

    this.commonService.getAppTerms('VisitStatus').subscribe(res => {
      if (res.statusCode === 1) {
        const statusList = this.parentFilter.find(res => res.id === 'status');
        if (statusList) {
          const statusFilterInfo = ['VS-CL', 'VS-CO', 'VS-IP', 'VS-PL', 'VS-SH'];
          const statusFilterList = res.results.filter(res => statusFilterInfo.includes(res.code));
          statusList.subFilters = statusFilterList.map(({ code, value }) => ({ code, value }));
        }
      }
    });
    
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
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('ot-view').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.HCDisplayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.permissionControl = dynamicColumns.permissionControl;
        this.configdataColums = dynamicColumns.columns
        if(dynamicColumns.timeColumns){
        this.timeColumns = dynamicColumns.timeColumns
        }
      }
      this.gethcDetails(this.selectedDate, true, this.applyFilterValue)
    });
  }

  getChartData(){
    let selectedDate1 = new Date(this.selectedDate);
    let year = selectedDate1.getFullYear();
    let month = selectedDate1.getMonth();
    let day = selectedDate1.getDate(); 
    this.timelineChart = {
      chartType : ChartType.Timeline,
      columns : [
        { type: 'string', id: 'Name' },
        { type: 'string', id: 'Status' },
        { type: 'string', role: 'style' },
        { type: 'date', id: 'Start' },
        { type: 'date', id: 'End' }
      ],
      dataTable: [
        ['OT 1', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 6, 0), new Date(0, 0, 0, 10, 0)],
        ['OT 2', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 7, 0), new Date(0, 0, 0, 12, 0)],
        ['OT 3', 'Ram (Dr. Ameer)', new Date(0, 0, 0, 6, 0), new Date(0, 0, 0, 8, 0)],
        ['OT 1', 'Kuppusamy (Dr. Alexander)', new Date(0, 0, 0, 10, 0), new Date(0, 0, 0, 14, 0)],
        ['OT 4', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 10, 0), new Date(0, 0, 0, 12, 0)],
        ['OT 1', 'Karthikeyan (Dr. Ameer)', new Date(0, 0, 0, 14, 0), new Date(0, 0, 0, 18, 0)],
        ['OT 5', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 8, 0), new Date(0, 0, 0, 10, 0)],
        ['OT 3', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 13, 0), new Date(0, 0, 0, 18, 0)],
        ['OT 5', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 16, 0), new Date(0, 0, 0, 18, 0)],
        ['OT 3', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 18, 0), new Date(0, 0, 0, 20, 0)],
        ['OT 1', 'Durai (Dr. James)', new Date(0, 0, 0, 20, 0), new Date(0, 0, 0, 23, 0)],
        ['OT 6', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 13, 0), new Date(0, 0, 0, 18, 0)],
        ['OT 7', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 16, 0), new Date(0, 0, 0, 18, 0)],
        ['OT 8', 'Ramasamy (Dr. Ameer)', new Date(0, 0, 0, 18, 0), new Date(0, 0, 0, 20, 0)],
        ['OT 8', 'Durai (Dr. James)', new Date(0, 0, 0, 20, 0), new Date(0, 0, 0, 23, 0)],
      ],
      options: {
        timeline: { 
          colorByRowLabel: true,
          rowLabelStyle: { fontSize: 14, color: '#000', bold: true }
        },
        avoidOverlappingGridLines: false,
        backgroundColor: '#ffffff',
        hAxis: {
          format: 'HH:mm', 
          textStyle: {
            fontSize: 12, 
            color: '#333'
          },
          minValue: new Date(year, month, day, 0, 0),  
          maxValue: new Date(year, month, day, 23, 59) 
        }
      }
    };
    let param = '/fdt=' + this.selectedDate+ '&tdt=' + this.selectedDate;
    this.timelineChart['dataTable'] = [];
    this.commonService.getReportData('OT-daily-chart',param).subscribe(res =>{
      if(res.results?.data?.dataTable?.length){
        let chartDat = res.results.data.dataTable;
        chartDat = chartDat.map(subArray => subArray.slice(0, -1));
        for(let chart of chartDat){
          let tmpDate = new Date(chart[2]);
          let tmpDate1 = new Date(chart[3]);
          chart[2] = chart[4];
          chart[3] = tmpDate;
          chart[4] = tmpDate1;
        }
        this.timelineChart['dataTable'] = chartDat;
      }
    });
    
  }

  loadChartData() {
    this.getChartData();
    setTimeout(() => {
      this.isChartLoading = false;
    }, 1000); // Simulate a delay for loading
  }

  onResizeWindow1(event) {
    const height = (event.target.innerHeight - 202) / 46;
    console.log(height)
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

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.tableData = [];
    this.matTabIndex = tabChangeEvent;
    this.selectedTab = this.matTabIndex.tab.textLabel;
    if (this.selectedTab === 'Planned Surgeries') {
      this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
    } else if(this.selectedTab === 'OT Complex'){
      this.getOtCardInfo();
    }  else if (this.selectedTab === 'Timeline') {
      this.calenderDetails();
    } else if(this.selectedTab === 'My Porter Request'){
      this.getPorterReq();
    }else{
      this.loadChartData();
    }
  }

  calenderDetails() {
    let selectedCalenderDate = this.datepipe.transform(new Date(this.selectedDate), 'EEE MMM dd yyyy HH:mm:ss zzz');
    if (this.selectedTab === 'Timeline') {
      this.calendarData = {};
      this.calendarData = {
        "entityId": null,
        "entityType": 'CAL-OT',
        'fromDate': this.selectedDate,
        'toDate': selectedCalenderDate,
        'fromTime': null,
        'toTime': null,
        'status': 'CAL-TL',
        'options': {},
        'refresh': null,
        'location': this.location
      }
    }
  }


  ngOnDestroy() {
    clearInterval(this.otInterval);
    this.lookupTermService.clearCache('Gender,CountryCode');
  }

  checkInterval() {
    this.selectedDate = this.datepipe.transform(this.hcForm.controls['fromDate'].value, 'yyyy-MM-dd');
    this.hcForm.controls['fromDate'].setValue(this.selectedDate);
    clearInterval(this.otInterval);
    this.otInterval = setInterval(() => {
     if(this.selectedTab === 'Planned Surgeries') {
        this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
      } else if(this.selectedTab === 'OT Complex') {
        this.getOtCardInfo();
      }
    }, this.refreshValue);
  }

  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(data => {
      let menuCode = localStorage.getItem(btoa('menuCode'));
      if (data?.results ) {
        const contentData = JSON.parse(data.results?.content);
        if (contentData.hasOwnProperty(menuCode)){
          this.refreshValue = contentData[menuCode].interval * 1000;
        }
        }
        this.checkInterval();
    });
  }

  headerEventAction(event) {
    console.log(event)
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data, '');
    } else if (event.key === 'enroll') {
      this.registerPatient(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.hcForm.controls['fromDate'].setValue(this.selectedDate);
      this.calenderDetails();
      this.getDataDetails(this.selectedDate);
    } else if (event.key === 'manageAction') {
      if (event.data === 'cancel') {
        this.scheduleCancel(event.keyVal);
      } else {
        clearInterval(this.otInterval)
        this.manageAction(event.data, event.keyVal);
      }
    } else if (event.key === 'groupFilter') {
        this.manageGroupFilter(event);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  getDataDetails(selectedDate) {
    if (this.selectedTab === 'Planned Surgeries') {
      this.gethcDetails(selectedDate,false,this.applyFilterValue);
    } else if(this.selectedTab === 'OT Complex'){
      this.getOtCardInfo();
    }else if(this.selectedTab === 'My Porter Request'){
      this.getPorterReq();
    }else{
      this.getChartData();
    }
  }

  manageGroupFilter(event) {
    let filterInfo = event.data;
    let location = [];
    let statusData = [];
    location = filterInfo.filter(filter => filter.id === 'ward').map(code => code.data);
    statusData = filterInfo.filter(res => res.id === 'status').map(code => code.data);
    this.location = location.length > 0 ? location : null;
    this.visitEventStatuses = statusData.length > 0 ? statusData :  null;
    if (this.selectedTab === 'Planned Surgeries') {
      this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
    } else if(this.selectedTab === 'OT Complex'){
      this.getOtCardInfo();
    }  else if (this.selectedTab === 'Timeline') {
      this.calenderDetails();
    }
  }

  currentLocationData(rowData: any, event: any) {
    if (rowData.tagId != null && rowData.currentFloorId != null) {
      const data = {
        'floorId' : rowData.currentFloorId, 'tagSerialNumber' : rowData.tagId,
        'tagType' : 'Patient', 'tagTypeId' : 'TAT-PA',
        'type' : 'globalSearch'
      };
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        data: data,
        panelClass: ['large-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.getOTOverall();
      });
    } else {
      this.toastr.warning('Warning', 'Currently tag is unavailable');
    }
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
      const dialogRef = this.dialog.open(ManagePatientComponent, {
        data: { 'id': data.id, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate, 'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT', 'isActive' : false},
        panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    }else if (value==='BT_HPISDOEP'){
      this.selectDropdown="BT_HPISDOEP";
      this.downloadPatient();
    }else if (value==='WD_OTDPD'){
      this.selectDropdown="WD_OTDPD";
      this.downloadExcel();
    } else if(value === 'modify'){
      const selectedData = this.rowData;
      const dialogRef = this.dialog.open(ManagePatientComponent, {
        data: { 'id': selectedData?.visit_id, 'patientId' : selectedData?.patientId, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate,
              'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT', 'mainidentifer' :  selectedData?.uhid, 'eventDetails' : selectedData.eventDetails,
              'startTime' : selectedData.scheduleStartTime, 'endTime' : selectedData.scheduleEndTime,'isActive' : true,'visitEventId' : selectedData.visitEventId},
        panelClass: ['medium-popup'], disableClose: true
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
    this.commonService.getDigitalQueueSummary(this.selectedDate).subscribe(res => {
      this.digitalQueueList_new = res.results;
    });
  }

  getOtCardInfo(){
    this.getStatusCount();
    this.commonService.getOtCardSummary(this.selectedDate, null, null, this.location).subscribe(res => {
      if(res.statusCode == 1){
        this.getOtCardInfoDetails(res.results);
      } else{
        this.otCardInfo = [];
      }
    });
  }

  getOtCardInfoDetails(data) {
    this.otCardInfo = data;
    this.otCardInfo.forEach(category => {
        this.processCategory(category);
    });
  }

  processCategory(category) {
      category.tests.forEach(test => {
          if (test.hasOwnProperty('patients')) {
              this.processTestPatients(test.patients);
          }
      });
  }

  processTestPatients(patients) {
      patients.forEach(patient => {
          this.setThreatsTooltip(patient);
      });
  }

  setThreatsTooltip(patient) {
    if (patient.threats && patient.threats.length > 0) {
        patient.threatsTooltip = patient.threats.map(threat => threat.name).join(",");
    } else {
        patient.threatsTooltip = null;
    }
  }

  getStatusCount() {
    this.commonService.getPatientQueueStatusCount(this.selectedDate).subscribe(res => {
      if(res.statusCode == 1){
        this.statusCountInfo = res.results;
      }else{
        this.statusCountInfo = [];
      }
    });
  }

  getPorterReq(){
    this.tableData = [];
    this.commonService.getPorterRequest(this.selectedDate, true, null, null).subscribe((res) => {
      this.tableData = res.results;
      this.loading = false;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = [
        "ID","userName","comments","requestCategoryName", "patientName","bedName", "gender", "assetCategoryName", "poolNameValue", "requestTime","sourceLocationName","destinationLocationName",
        "porterNames","porterCount","statusName", "prioity","remarks","actualPickupTime","actualDropTime", 'compManually', "Location"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.PRDisplayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  gethcDetails(dateValue, routerEvent?: boolean ,name ?:string): void {
    if (this.selectedTab === 'Planned Surgeries') {
      this.loading = true;
      this.selection.clear();
      this.showActions = this.showAction1;
      this.fromDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
      this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
      if (routerEvent) {
        this.OTDataSource = new MatTableDataSource(this.route.snapshot.data.OT.results.data);
        this.tableData = this.route.snapshot.data.OT.results.data;
        this.loading = false;
        const dataColumns = ['ID', 'tagId', 'gender', 'token_no', 'porterRequestId','','name', 'uhid','visitEventFrmTime', 'scheduleEndTime', 'tagId', 'eventLocationName', 'consultantName', 'visitEventStatusName', 'currentLocationName', 'otProcedureName', 'birthDate', 'mobile_no'];
        const Columns = this.configdataColums ? this.configdataColums : dataColumns;
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            if(this.HCDisplayedColumns[i] != 'Icons'){
              data[this.HCDisplayedColumns[i]] = data[Columns[i]];
            }
            if (data.threats && data.threats.length > 0) {
              data['threatsTooltip'] = data.threats.map((threat) => threat.name).join(",");
            } else {
              data['threatsTooltip']  = null;
            }
            if(data['delayScheduleStartTime'] !== null) {
              const date1 = this.datepipe.transform(data['visitEventFrmTime'], 'yyyy-MM-dd HH:mm:ss');
              const date2 = this.datepipe.transform(data['delayScheduleStartTime'], 'yyyy-MM-dd HH:mm:ss');
              const diff = new Date(date1).getTime() - new Date(date2).getTime();
              const mins = (Math.abs(Math.round(diff / 60000)));
              data['delayStartTime'] = mins;
            }
            if(data['delayScheduleEndTime'] !== null) {
              const date1 = this.datepipe.transform(data['scheduleEndTime'], 'yyyy-MM-dd HH:mm:ss');
              const date2 = this.datepipe.transform(data['delayScheduleEndTime'], 'yyyy-MM-dd HH:mm:ss');
              const diff = new Date(date1).getTime() - new Date(date2).getTime();
              const mins = (Math.abs(Math.round(diff / 60000)));
              data['delayEndTime'] = mins;
            }
          });
        }
        if (this.tableData.hasOwnProperty('floor_count')) {
          this.floorDetails = this.tableData.floor_count;
        }
        this.OTDataSource.paginator = this.paginator;
        this.OTDataSource.sort = this.sort;
      } else {
        this.commonService.getHcPatientList(this.selectedDate, 'HP-OT', this.location,name, this.visitEventStatuses).subscribe((res) => {
          this.OTDataSource = new MatTableDataSource(res.results.data);
          this.tableData = res.results.data;
          this.loading = false;
          if (this.applyFilterValue !== null) {
            this.applyFilterValue = this.applyFilterValue + ' ';
          }
          const dataColumns = ['ID', 'tagId', 'gender', 'token_no', 'porterRequestId','','name', 'uhid','visitEventFrmTime', 'scheduleEndTime', 'tagId', 'eventLocationName', 'consultantName', 'visitEventStatusName', 'currentLocationName', 'otProcedureName', 'birthDate', 'mobile_no'];
          const Columns = this.configdataColums ? this.configdataColums : dataColumns;
          for (let i = 0; i <= Columns.length; i++) {
            this.tableData.map(data => {
              if(this.HCDisplayedColumns[i] != 'Icons'){
                data[this.HCDisplayedColumns[i]] = data[Columns[i]];
              }
              if (data.threats && data.threats.length > 0) {
                data['threatsTooltip'] = data.threats.map((threat) => threat.name).join(",");
              } else {
                data['threatsTooltip']  = null;
              }
              if(data['delayScheduleStartTime'] !== null) {
                const date1 = this.datepipe.transform(data['visitEventFrmTime'], 'yyyy-MM-dd HH:mm:ss');
                const date2 = this.datepipe.transform(data['delayScheduleStartTime'], 'yyyy-MM-dd HH:mm:ss');
                const diff = new Date(date1).getTime() - new Date(date2).getTime();
                const mins = (Math.abs(Math.round(diff / 60000)));
                data['delayStartTime'] = mins;
              }
              if(data['delayScheduleEndTime'] !== null) {
                const date1 = this.datepipe.transform(data['scheduleEndTime'], 'yyyy-MM-dd HH:mm:ss');
                const date2 = this.datepipe.transform(data['delayScheduleEndTime'], 'yyyy-MM-dd HH:mm:ss');
                const diff = new Date(date1).getTime() - new Date(date2).getTime();
                const mins = (Math.abs(Math.round(diff / 60000)));
                data['delayEndTime'] = mins;
              }
            });
          }
          if (res.results.hasOwnProperty('floor_count')) {
            this.floorDetails = res.results.floor_count;
          }
          this.OTDataSource.paginator = this.paginator;
          this.OTDataSource.sort = this.sort;
        });
      }
    }
  }
  rowClick(data) {
    if (this.selectedName === null || this.selectedName !== data.patientId) {
      if (data.visitEventStatusId === 'VS-SH') {
        this.showActions = this.showAction3;
        this.selectedName = data.patientId;
        this.rowData = data;
      } else {
        this.showActions = this.showAction2;
        this.selectedName = data.patientId;
        this.rowData = data;
      }
    } else {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    }
  }

  scheduleCancel(dataId) {
    if (this.rowData?.patientId == dataId) {
      const id = this.rowData.visitEventId;
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'],
        disableClose: true,
        data: {
          title: 'Cancel Surgery Schedule',
          message: 'Are you sure you want to cancel the surgery schedule?',
          buttonText: { cancel: 'No', ok: 'Yes' },
          status: 'RQ-SC',
          scheduleCancelRequest: true,
          isRemark: 1,
          visitId: id,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
      });
    }
  }

  currentLocation(data) {
    if (data === "close") {
      this.current_Location = false;
    } else {
      this.current_Location = true;
      if (data.hasOwnProperty("performer") && data.performer.length > 0) {
        this.porterDetails = {
          type: "porter",
          floorid: data.performer[0].floorId,
          requestId: data.requestId,
          requestInfo: data,
        };
      }
    }
  }
  getPorterFloorPlan(data){
    const reqDetail = data;
    const reqType = 'porter';
    const reqId = null;
    let details = {reqDetail: reqDetail, reqType: reqType, reqId: reqId}
    const dialogRef = this.dialog.open(CommonDialogComponent, {
    data: details,
    panelClass: ['medium-popup'],
    disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }
  getViewHistory(data) {
    const formData = data;
    data['content'] = 'history';
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    }); dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
   }
  getPorterHistory(data) {
    const dialogRef = this.dialog.open(PorterRequestHistoryComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }
 eventAction(event) {
  if(event.key === 'Status') {
    if(this.selectedTab === 'Planned Surgeries'){
      this.patientInfo(event.data);
    }else {
      this.getPorterHistory(event.data);
    }
   } else if (event.key === 'Current Location') {
    this.currentLocationData(event.data, '');
   } else if (event.key === 'Requester') {
    const dialogRef = this.dialog.open(PorterRequestNewComponent, {
      data: event.data,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  } else if(event.key == 'Location') {
    this.currentLocation(event.data);
    this.getPorterFloorPlan(event.data);
  } else if (event.key === "Porter") {
    this.getNewPorter('Porter', event.data);
  } else if(event.key === "viewHistory") {
    this.getViewHistory(event.data);
  } else if (event.key === "Name") {
    this.scheduleInfo(event.data)
  } else if(event.key === 'Schedule Time') {
    this.getDelay(event?.data, 'otStartDelayTime');
  } else if(event.key === 'End Time') {
    this.getDelay(event?.data, 'otEndDelayTime');
  } else {
    this.manageCoster(event.data);
  }
 }

 getDelay(data, type) {
    const selectedData = data;
    const dialogRef = this.dialog.open(ManagePatientComponent, {
      data: { 'otDelayTime': type, 'id': selectedData?.visit_id, 'patientId' : selectedData?.patientId, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate,
            'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT', 'mainidentifer' :  selectedData?.uhid, 'eventDetails' : selectedData.eventDetails,
            'startTime' : selectedData.scheduleStartTime, 'endTime' : selectedData.scheduleEndTime,'isActive' : true,'visitEventId' : selectedData.visitEventId,
            'delayScheduleStartTime': selectedData.delayScheduleStartTime,'delayScheduleEndTime': selectedData.delayScheduleEndTime,
            'otDelayStartReasonId': selectedData.otDelayStartReasonId,'otDelayEndReasonId': selectedData.otDelayEndReasonId,
            'delayStartRemarks': selectedData.delayStartRemarks,'delayEndRemarks': selectedData.delayEndRemarks,
            'delayStartTime': selectedData.delayStartTime, 'delayEndTime': selectedData.delayEndTime},
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
 }

 getNewPorter(value, data) {
  if (typeof(data) == 'object' && data.porterRequestId === null) {
    const dialogRef = this.dialog.open(PorterRequestNewComponent, {
      data: { type: "PR-PA", id: data.patientId, name: data.name, patientVisitStatus : data.visitStatusId, visitEventId : data.visitEventId, visitId : data.visit_id},
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectDropdown = null;
    });
  } else if(data.requestId && data.requestId !== null) {
    this.workflowService.getPorterRequest(data.requestId).subscribe((res) => {
      if(res.results.length !== 0) {
        const porterData = res.results[0];
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: porterData,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.selectDropdown = null;
          
        });
      }
    });
  }
 }
 scheduleInfo(data) {
  const selectedData = data;
  const dialogRef = this.dialog.open(ManagePatientComponent, {
    data: { 'id': selectedData?.visit_id, 'patientId' : selectedData?.patientId, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate,
          'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT', 'mainidentifer' :  selectedData?.uhid, 'eventDetails' : selectedData.eventDetails,
          'startTime' : selectedData.scheduleStartTime, 'endTime' : selectedData.scheduleEndTime,'isActive' : true,'visitEventId' : selectedData.visitEventId},
    panelClass: ['medium-popup'], disableClose: true
  });
  dialogRef.afterClosed().subscribe(result => {
    this.selectDropdown = null;
    this.refreshPage();
  });
 }
  patientInfo(data) {
    data['type'] = '1';
    data['from'] = 'OP-list';
    let tempData = {
      "sideNav": false,
      'selectedDate':this.selectedDate,
      "selectedPatient" : {
        "id": data['patientId'],
        "name": data.hasOwnProperty('name') ?  data['name'] : data['firstName'],
        "mainIdentifier": data['uhid'],
        "birthDate": data['birthDate'],
        "packageId": data['health_plan_id'],
        "packageName": data['health_plan_name'],
        "doctorId": data['consultantId'],
        "doctorName": data['consultantName'],
        "queueId": data[''],
        "queueStatusId": data[''],
        "queueStatusName": data[''],
        "patientVisitId": data['visit_id'],
        "waitingTime": data[''],
        "startTime": data[''],
        "locationId": data[''],
        "locationName": data[''],
        "tagId": data['tagId'],
        "tagTypeId": data[''],
        "tagTypeName": data[''],
        "gender": data['gender'],
        "otProcedureId": data['otProcedureId'],
        "otProcedureName": data['otProcedureName'],
        "vipTypeId": data['vipTypeId'],
        "isVulnerable": data['isVulnerable'],
        "threatsTooltip": data['threatsTooltip'],
        "threats": data['threats'],
        "surgeryTypeId": data['surgeryTypeId'],
        "visitEventId" : data['visitEventId'],
        "token_no" : data['token_no']
      },
      data,
    }
    const dialogRef = this.dialog.open(AppOtNewComponent, {
      panelClass: ['medium-popup'], disableClose: true, data: tempData
    });
    dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
    });
  }

  assignFloor(patient) {
    if (patient.length) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'],disableClose: true,
        data: {
          title: 'Assign Floor', message: 'Do you want to assign the selected patient to the floor?',
          buttonText: { ok: 'Save', cancel: 'Cancel' },
          'patient': patient, 'floorId': patient[0].floor_id, 'isRemark': 1, 'enableSelectBox': true, 'assignFloor': true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.selection.clear();
          this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
        }
      });
    }
  }

  applyFilter(filterValue: string, clear) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    if (this.applyFilterValue.length > 2){
      this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
    }else if (this.applyFilterValue.length == 0){
      this.gethcDetails(this.selectedDate,false,null);
    }
    if (this.isClearDropdown === true) {
      this.assignFloorId = '';
      this.buildForm();
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.selectedName = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
  

    if (this.selectedTab === 'Planned Surgeries' ) {
      this.gethcDetails(this.selectedDate,false,this.applyFilterValue);
    } else if(this.selectedTab === 'OT Complex'){
      this.getOtCardInfo();
    } else if (this.selectedTab === 'Timeline') {
      this.calenderDetails();
    } else if(this.selectedTab === 'My Porter Request'){
      this.getPorterReq();
    } else{
      this.loadChartData();
    }
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-OT';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    data['patientVisitEventId'] = data.visitEventId;
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

  registerPatient(id) {
    const dialogRef = this.dialog.open(ManagePatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-OT', 'date': this.selectedDate, 'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT' },
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  locationInfo(id, name, status, testId, count, testType, group) {
    const visitStatusId = group?.visitStatusId;
    const planTypeId = group?.planTypeId;
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
  downloadExcel() {
    if (this.tableData.length) {
      let tempTable = [...this.tableData];
      const result: Array<{ [key: string]: any }> = [];

      tempTable.forEach(row => {
        const filteredRow: { [key: string]: any } = {};
        this.HCDisplayedColumns.forEach(column => {
          if (column in row && column != 'ID' && column != 'Porter') {
            filteredRow[column] = row[column];  
          }
        });
        result.push(filteredRow);
      });
      this.excelService.singleSheet(result, 'Planned_Surgery', 'Ot_Details', this.selectedDate);
    }
    this.selectDropdown =null;
    this.refreshPage();
  }
  
  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission.dropdown;
    const createAction = dropdown.filter(x => x.page === "workflow" && x.parentCode ==='MN_OTOTM');
    for(const action of createAction) {
      this.showAction1.push({ id: action.code, value: action.name });
    } 
    this.showActions = this.showAction1;
  }
  downloadPatient() {
    this.loading = true;
    const headers = ['patientId', 'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'mobileNo', 'doctorName', 'scheduleDate', 'startTime(HH:MM)','endTime(HH:MM)', 'location', 'surgeryName'];
    let mandatoryFields = [];
    const dateFields = ['scheduleDate', 'dateOfBirth'];
    const timeFields = ['startTime(HH:MM)','endTime(HH:MM)'];
  
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
    //Mandatory fields enabled based config's value
    this.commonService.getConfigFile('ip-view').toPromise().then(configRes => {
        if (configRes?.results?.contentObject?.otScheduleBook && this.activate_btn.includes('BT_OTS')) {
          mandatoryFields = ['patientId', 'firstName', 'gender','scheduleDate', 'startTime(HH:MM)', 'surgeryName'];
        } else {
          mandatoryFields = []; // no mandatory fields
        }
    const headerRow = mainSheet.addRow(headers);
  
    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (mandatoryFields.includes(header)) {
        const cell = headerRow.getCell(index + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' },
        };
      }
    });
  
    let doctorList = [];
    let surgeryList = [];
    let locationList = [];
  
    const apiPromises = [
      this.commonService.searchDoctor('', 'UT_DOCTOR', 'RO-DO').toPromise().then(res => doctorList = res.results.map(({ name }) => name) || []),
      this.commonService.searchEntityAvailablity('LC_OT','location',this.datepipe.transform(this.today, "YYYY-MM-dd HH:mm:ss"),'','',this.datepipe.transform(this.today, "YYYY-MM-dd HH:mm:ss")).toPromise().then(res => locationList = res.results.map(({ name }) => name) || []),
      this.configurationServices.getAllOtProcedure('','','').toPromise().then(res => surgeryList = res.results.map(({ name }) => name) || []),
      this.configurationServices.getConfigFile('excel-config').toPromise()
    ];
  
    Promise.all(apiPromises).then(([configRes]) => {
      this.totalRecords = configRes?.results?.contentObject?.patient ? configRes.results.contentObject.patient + 1 : 1001;
  
      const dataLists = {
        gender: ['Male', 'Female'],
        doctorName: doctorList,
        location: locationList,
        healthPlanId: surgeryList,
        surgeryName: surgeryList,
      };
  
      Object.entries(dataLists).forEach(([key, list], index) => {
        const col = index + 1;
        apiSheet.getColumn(col).values = [key, ...list];
        apiSheet.getColumn(col).width = 30;
      });
  
      apiSheet.protect('twDevEx$123', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });
  
      headers.forEach((header, colIndex) => {
        if (dataLists[header]) {
        const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
          const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range
  
          for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
            const cell = mainSheet.getCell(rowIndex, colIndex + 1);
            const validation = {
              type: 'list',
              allowBlank: true,
              formulae: [rangeAddress],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Input',
              error: 'Value must be from the list',
            };
            cell.dataValidation = validation;
          }
        }
        // Dynamic column letter for data validation const colLetter = String.fromCharCode(65 + colIndex); 
        if (dateFields.includes(header)) {
          for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
            const cell = mainSheet.getCell(rowIndex, colIndex + 1);
            const currentYear = new Date().getFullYear();
        
            const startDate = new Date(1900, 0, 1); 
            const endDate = new Date(currentYear + 2, 11, 31); 
            const startDateExcel = startDate.getTime() / (1000 * 60 * 60 * 24) + 25569;
            const endDateExcel = endDate.getTime() / (1000 * 60 * 60 * 24) + 25569;
        
            const dateValidation = {
              type: 'whole',
              operator: 'between',
              formulae: [startDateExcel, endDateExcel], 
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Date',
              error: `Date must be between 01-01-1900 and ${endDate.toLocaleDateString()}`,
            };
        
            cell.dataValidation = dateValidation;
            cell.numFmt = 'DD/MM/YYYY';  // Excel format for dd/mm/yyyy
          }
        }
      
        if (timeFields.includes(header)) {
          for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
            const cell = mainSheet.getCell(rowIndex, colIndex + 1);
            cell.numFmt = 'hh:mm AM/PM';
          }
        }        
      });
  
      return workbook.xlsx.writeBuffer();
    })
    .then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.loading = false;
      saveAs(blob, 'download-patient.xlsx');
      this.selectDropdown =null;
      this.refreshPage();
  })
  })
  }
  
  
  async patientsImport(event) {
    this.loading = true;
    const file = event.target.files[0];
    try {
      const [doctorRes, surgeryRes, locationRes] = await Promise.all([
        this.commonService.searchDoctor('', 'UT_DOCTOR', 'RO-DO').toPromise(),
        this.configurationServices.getAllOtProcedure('', '', '').toPromise(),
        this.commonService.searchEntityAvailablity('LC_OT','location',this.datepipe.transform(this.today, "YYYY-MM-dd HH:mm:ss"),'','',this.datepipe.transform(this.today, "YYYY-MM-dd HH:mm:ss")).toPromise(),
      ]);

      this.doctorList = doctorRes.results.map(({ id, name }) => ({ id, name }));
      this.surgeryList = surgeryRes.results.map(({ id, healthPlanId, name }) => ({ id, healthPlanId, name }));
      this.locationList = locationRes.results.map(({ id, name }) => ({ id, name }));
  
      const fileReaderResult: ArrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
  
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
      const workbook = XLSX.read(fileReaderResult, { type: 'array', cellText: false, cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
      const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
      const expectedHeader = ['patientId', 'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'mobileNo', 'doctorName', 'scheduleDate', 'startTime(HH:MM)', 'endTime(HH:MM)', 'location', 'surgeryName'];
  
      if (headerRow.join(",") !== expectedHeader.join(",")) {
        this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
        return;
      }
  
      const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd hh:mm:ss;@' });
      const jsonData = arrayList.map(row => {
        const safeTrim = (value) => value ? value.toString().trim() : '';
  
        const mapField = (fieldName, list, codeField, valueField) => {
          const fieldValue = safeTrim(fieldName);
          const match = list.find(item => item[valueField]?.trim().toLowerCase() === fieldValue.toLowerCase());
          return match ? match[codeField] : null;
        };
  
        const scheduleDate = row['scheduleDate']?.split(' ')[0] || null;
        const startTime = row['startTime(HH:MM)']?.split(' ')[1] || '00:00:00';
        const endTime = row['endTime(HH:MM)']?.split(' ')[1] || '00:00:00';
        return {
          doctorId: mapField(row['doctorName'], this.doctorList, 'id', 'name'),
          healthPlanId: mapField(row['surgeryName'], this.surgeryList, 'healthPlanId', 'name'),
          otProcedureId: mapField(row['surgeryName'], this.surgeryList, 'id', 'name'),
          locationId: mapField(row['location'], this.locationList, 'id', 'name'),
          mainidentifier: row['patientId']?.trim() || null,
          firstName: row['firstName'] || null,
          middleName: row['middleName'] || null,
          lastName: row['lastName'] || null,
          mobileNo: row['mobileNo']?.toString() || null,
          gender: row['gender'] || null,
          birthDate: row['dateOfBirth']?.split(' ')[0] || null,
          scheduleStartTime: scheduleDate ? `${scheduleDate} ${startTime}` : null,
          scheduleEndTime: scheduleDate ? `${scheduleDate} ${endTime}` : null,
          visitTypeId: 'VT-IP',
          eventType: 'VE-OT'
        };
      }).filter(obj => Object.keys(obj).length > 0);

      if (jsonData.length === 0) {
        this.toastr.warning('Warning', 'Invalid data for Import. Please check the file.');
        return;
      }

      this.hospitalService.importBulkPatient(jsonData).subscribe({
        next: res => {
          this.toastr.success('Success', `${res.message} ${res.results.note}`);
          this.gethcDetails(this.selectedDate, false, this.applyFilterValue);
        },
        error: err => {
          this.toastr.error('Error', `${err.error?.message || 'Something went wrong.'}`);
        }
      });
    }catch (error){
      this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    }finally{
      this.loading = false;
      event.target.value = '';
    }
  }

  downloadPdf() {
    let node = document.getElementById('timelineElement');
    let img;
    let filename = "OtTimeline-" + this.today + ".pdf";
    let headerName = "OT Timeline";
    let newImage;
  
    domtoimage.toPng(node, { width: node.scrollWidth, height: node.scrollHeight })
      .then((dataUrl) => {
        img = new Image();
        img.src = dataUrl;
        newImage = img.src;
        img.onload = () => {
          let pdfWidth = img.width;
          let pdfHeight = img.height;
          let doc;
          if (pdfWidth > pdfHeight) {
            doc = new jsPDF('l', 'px', 'a4');
          } else {
            doc = new jsPDF('p', 'px', 'a4');
          }
          let width = doc.internal.pageSize.getWidth();
          let height = doc.internal.pageSize.getHeight();
          doc.text(headerName, 450, 35); // x, y
          doc.addImage(newImage, 'PNG', 0, 0, width, height);
          doc.save(filename);
        };
      })
      .catch((error) => console.error(error));
  }
  fixClick() {
    console.log('')
  }    
}
