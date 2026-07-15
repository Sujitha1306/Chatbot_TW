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
 import { Component, OnInit, ElementRef, ViewChild, Output, QueryList, EventEmitter, OnDestroy, } from "@angular/core";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatOption } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { MatInput } from "@angular/material/input";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabGroup } from "@angular/material/tabs";
import { routerTransition } from "../../../router.animations";
import { Subject, Subscription } from "rxjs";
import { WorkflowService, CommonService, HospitalService, ExcelService } from "../../../shared";
import { FormControl, FormGroup } from "@angular/forms";
import { PorterRequestHistoryComponent } from "./../../../shared/modules/entry-component/porter-request/porter-request.component";
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { ActivatedRoute } from "@angular/router";
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../../../app.module";
import { environment } from '../../../../environments/environment';
import { CreateUserComponent } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { AmbulanceRequestComponent } from "../../../shared/modules/entry-component/ambulance-request/ambulance-request.component";
import { GoogleMapComponent,} from "../../../shared/modules/entry-component/google-map/google-map.component";
import { CoasterComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { GoogleDirectionsComponent } from "../google-directions/google-directions.component";
import { TwMeetingComponent } from "../../../shared/modules/entry-component/tw-meeting/tw-meeting.component";
import { StreamPlayerComponentComponent } from "./stream-player-component/stream-player-component.component";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-ambulance",
  templateUrl: "./ambulance.component.html",
  styleUrls: ["./ambulance.component.scss"],
  animations: [routerTransition()],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class AmbulanceComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    "ID",
    "Requester Name",
    "Department",
    "Type",
    "Gender",
    "Needed",
    "Group",
    "Time",
    "Location From",
    "Location To",
    "Porter Name",
    "Porter Count",
    "Request Status",
    "porterRequestStatus",
    "Remarks",
  ];
  MTDisplayedColumns: string[] = ['Asset ID', 'Asset Name', 'Alerts', 'Driver','Doctor', 'EMT', 'Mobile No', 'Tag ID','Facility'];
  displayedColumns1: string[] = [];
  iconHeader = ["ID", 'Associate Driver','Call'];
  iconColumn: any = ['Call'];
  sortColumn: any = [];
  permissionControl = ["BT_ALLE"];
  eventColumn: any = ['Call'];
  dataSource = new MatTableDataSource();
  public groupFilter = [
     {
       id: 'requestStatus',
       value:'Status',
       isAll: true,
       selectionType: 'multi',
       subFilters: [],
       defaultSelected: []
     }
  ];

  @Output() dateChange: EventEmitter<MatDatepickerInputEvent<any>>;
  @ViewChild(MatInput) matInputs: QueryList<MatInput>;
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild('paginatorMy') paginatorMy: MatPaginator;
  @ViewChild('paginatorSpec') paginatorSpec: MatPaginator;
  @ViewChild('paginatorDept') paginatorDept: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('allReqSelected') private readonly allReqSelected: MatOption;
  @ViewChild('myReqSelected') private readonly myReqSelected: MatOption;

  public current_Location = false;
  public activate_btn: any = [];
  public requestStatus: any[] = [];
  isDisabledContent: boolean;
  nav_position = "end";
  statusUpdate = false;
  selectedData: any;
  selectedDataIndex = null;
  today = new Date();
  public porterDetails: any;
  public reqDetail: any;
  public reqType= '';
  public reqId:any = null;
  public applyFilterValue: any = null;
  public isAutoRefresh = false;
  maxHeight: number;
  height: number;
  width: number;
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedToDate = null;
  public statusList = [];
  pageSize: any = 50;
  public porterInterval: any;
  public loading = false;
  public locationFilter: any;
  public tableData: any = [];
  public selectedView = "table";
  public selectDropdown = null;
  showAction1 = [];
  showActions = [];
  showAction2 =[];
  public subscription: Subscription;
  defaultRequest: any;
  public enableTab = true;
  public customerId = localStorage.getItem('customerId');
  public sourceGeoCoordinate: {};
  latLng = [];
  geo: any = [];
  googleDirectionAPI = 'https://www.google.com/maps/embed/v1/directions';
  googleMapOrigin = null;
  googleMapDestination = null;
  googleMapWayPoints = null
  tagId = null;
  showMap = false;
  defaultLoc = null;
  responseColumns: any = [];
  now = new Date();
  min = this.now.setMonth(this.now.getMonth() - 1);
  minDate = this.datepipe.transform(this.min, 'yyyy-MM-dd');
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;
  public excelDisplayedColumns = [];
  public excelColumns = [];
  public displayExcel = false;
  displayDate: boolean = true;
  pageStart: any = 0;
  length: any;

  constructor(
    private readonly dialog: MatDialog,
    private readonly workflowService: WorkflowService,
    public hospitalService: HospitalService,
    private readonly sidenav: ElementRef,
    public commonService: CommonService,
    private readonly route: ActivatedRoute,
    public datepipe: DatePipe, 
    public activeRoute:ActivatedRoute,
    private readonly excelService: ExcelService
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    if (this.activate_btn && (this.activate_btn.indexOf('TB_WFAMBAR') > -1)) {
      this.enableTab = false;
      this.selectedTab = 'All Requests'
    } else if (this.activate_btn && (this.activate_btn.indexOf('TB_WFAMBMR') > -1)) {
      this.selectedTab = 'My Requests';
    } else if (this.activate_btn && (this.activate_btn.indexOf('TB_WFAMBMA') > -1)){
      this.enableTab = true;
      this.selectedTab = 'Manage Ambulance';
    }
    this.getPermissionDropDown();
    this.getDynamicTableColumn();
  }

  ngOnInit() { 
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.TabChange(event);
    });
    this.activeRoute.queryParams.subscribe(params => {
      if (params.hasOwnProperty('callId')) {
        const callIds = JSON.parse(params.callId);
        if (callIds) {
          this.callRequest(null, callIds.token, callIds.channelName,callIds.meetingId)
        }
      }
    })
    this.commonService.getSpecialityLoc('CS-GE', null).subscribe(res => {
      this.locationFilter = res.results;
    });
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
      if (msg.length) {
        msg = msg[0];
        if (msg['ctx'] === 'Request' && msg['ctxTypeId'] === 'RQT-AMB') {
          this.porterStatusBinding(msg);
        }
      }
    });
  }
  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission.dropdown;
    const createAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAB" && x.code.substring(0, 5) === 'DD_AB');
    this.showAction1.push(...createAction.map(x => ({ id: x.code, value: x.name })));
    const modifyAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAB" && x.code.substring(0, 7) === 'DD_MDAB');
    this.showAction2.push(...modifyAction.map(x => ({ id: x.code, value: x.name })));
    this.showActions = this.showAction1;
  }
  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('amb').subscribe((res) => {
      const dynamicColumns = res.results.contentObject;
      this.displayedColumns1 = dynamicColumns.displayedColumns;
      this.iconColumn = dynamicColumns.iconColumn;
      this.sortColumn = dynamicColumns.sortColumn;
      this.eventColumn = dynamicColumns.eventColumn;
      this.responseColumns = dynamicColumns.columns;
      if (dynamicColumns?.excel) {
        this.excelDisplayedColumns = dynamicColumns?.excel?.displayedColumns;
        this.excelColumns = dynamicColumns?.excel?.columns;
      } else {
        this.excelDisplayedColumns = dynamicColumns?.displayedColumns;
        this.excelColumns = dynamicColumns?.columns;
      }
      if(dynamicColumns.pageSize && dynamicColumns.pageSize !== null) {
        this.pageSize = dynamicColumns.pageSize;
      } else {
        this.pageSize = 50;
      }
      if(this.commonService.userPreference?.hasOwnProperty('ambMenuTab')) {
        let tabValue = JSON.parse(this.commonService.userPreference['ambMenuTab']['value']);
        let label = tabValue.textLabel;
        const tabNames = this.tabGroup._tabs.toArray();
        const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
        if (index >= 0) {
          this.selectedIndex = index;
          this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
          this.matTabChangeSub.pipe(debounceTime(300)).subscribe(event => {
            this.TabChange(event);
          });
        }
        setTimeout(() =>  this.checkInterval(), 1000);
      } else {
        let label = this.selectedTab;
        const tabNames = this.tabGroup._tabs.toArray();
        const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
        if (index >= 0) {
          this.selectedIndex = index;
          this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
          this.matTabChangeSub.pipe(debounceTime(300)).subscribe(event => {
            this.TabChange(event);
          });
        }
        if (this.selectedTab ===  'My Requests' || this.selectedTab === 'Manage Ambulance') {
          this.customerId = null;
        }
        setTimeout(() =>  this.checkInterval(), 1000);
      }
    });
  }

  porterStatusBinding(msg) {
    if (this.tableData.length && msg['operation'] === 'modify') {
      const reqIndex = this.tableData.findIndex(val => val.requestId === msg['data'][0]['requestId']);
      if (reqIndex > -1) {
        this.setPorterIndex(reqIndex, msg);
      }  else {
        this.callGetAllRequest(msg);
      }
    } else {
      this.callGetAllRequest(msg);
    }
  }

  callGetAllRequest(msg) {
    const message = msg['data'][0]['ctxTypeId'];
    if (message != 'RQT-PO') {
      if (this.selectedTab === 'My Requests') {
        this.getAllRequest(this.selectedDate, true);
      } else {
        this.getAllRequest(this.selectedDate, false);
      }
    }
  }

  setPorterIndex(reqIndex, msg) {
    let performerIndex = this.tableData[reqIndex]['performer'].findIndex(val => val.requestDetailId === msg['data'][0]['requestDetailId']);
      if (performerIndex > -1) {
        this.tableData[reqIndex]['status'] = msg['data'][0]['requestStatusId'];
        this.tableData[reqIndex]['statusName'] = msg['data'][0]['statusName'];
        this.tableData[reqIndex]['performer'][performerIndex]['status'] = msg['data'][0]['statusId'];
        this.tableData[reqIndex]['performer'][performerIndex]['statusName'] = msg['data'][0]['requestStatusName'];
      } else {
        const message = msg['data'][0]['ctxTypeId'];
        if (message != 'RQT-PO') {
          if (this.selectedTab === 'My Requests') {
            this.getAllRequest(this.selectedDate, true);
          } else {
            this.getAllRequest(this.selectedDate, false);
          }
        }
      }
  }
  ngOnDestroy() {
    clearInterval(this.porterInterval);
  }

  headerEventAction(event){
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if(event.data == 'DD_ABCR'){
      if(this.selectedTab === 'Manage View') {
        this.showMap = false;
      }
      this.createRequest([]);
    } else if(event.data == 'DD_MDABR') {
      this.createRequest(this.selectedData);
    } else if(event.data == 'recreate'){
      this.createRequest(this.selectedData, 'RQ-RCR');
    } else if (event.key === 'multiDate') {
      if (!event.data) {
        this.selectedToDate = this.selectedDate;
      } else {
        this.selectedToDate = null;
        this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      }
      this.getNavigateApiCall();
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event?.data, 'yyyy-MM-dd');
      this.getNavigateApiCall();
    } else if (event.key === 'toDateFilter') {
      this.selectedToDate = this.datepipe.transform(event?.data, 'yyyy-MM-dd');
      this.getNavigateApiCall();
    } else if (event.key === 'groupFilter') {
      this.statusList = event.data.filter(filter => filter.id === 'requestStatus').map(code => code.data);
      this.commonService.validateUserPreference('ambStatusFilter', JSON.stringify(this.statusList));
      this.getNavigateApiCall();
    } else if(event.key === 'downloadExcel') {
      this.downloadExcel();
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  eventAction(event) {
    if(event.data == 'create' || event.data == 'DD_ABCR'){
      this.createRequest([]);
    } else if(event.key == 'Requester' || event.key == 'Ambulance Name' || event.key == 'Patient Name'  || event.key == 'Driver' || event.key == 'Patient'){
      this.getRequestById(event?.data);
    } else if(event.key == 'Status'){
      this.getPorterHistory(event.data);
    } else if(event.key == 'Call' ){
      if (event.data.status ==='RQ-AS'|| event.data.status ==='RQ-AC'||event.data.status ==='RQ-AR'){
      this.callRequest(event.data,null,null,null);
      }
    } else if(event.key == 'Location'){
      this.getGoogleDirectionMultiPath(event.data);
    } else if (event.key === 'Schedule') {
      const data = event.data;
      data['type'] = 'task';
      const dialogRef = this.dialog.open(CreateUserComponent,
      {data : data, panelClass: 'medium-popup', disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    }else if(event.key === 'Live Video'){
      this.openStream(event.data)
    } else if(['Associate Driver','Asset Name', 'assetAlertCount', 'readerAlertCount'].includes(event.key)){
      let index = 0;
      if(event.key == "assetAlertCount") {
        index = 1;
      } else if(event.key == "readerAlertCount") {
        index = 2;
      }
      event.data['selectedTabIndex'] = index;
      this.assignDriver(event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getNavigateApiCall();
    }
  }

  getRequestById(data) {
    this.commonService.getAmbulanceRequestById(data?.requestId, 'RQT-AMB').subscribe(res => {
      if(res.results?.length !== 0) {
        this.createRequest(res.results[0]);
      }
    });
  }

  callRequest(data,token,channel,meetingId){
    let callData = data;
    if (callData != null) {
      callData['token'] = token;
      callData['channel'] = channel;
      callData['meetingId'] = meetingId;
    } else {
      callData = {
        token: token,
        channel: channel,
        meetingId : meetingId
      };
    }
    this.dialog.open(TwMeetingComponent, {
      data: callData, panelClass: ['large-popup'], disableClose: true,hasBackdrop: false,height:'0px'
    });
  }

  assignDriver(data) {
    data['associateAction'] = 'Ambulance';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,  
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });

  }

  onWindowResized(size) {
    this.height = size;
  }

  getPorterHistory(data) {
    data['historyType'] = 'Ambulance';
    this.dialog.open(PorterRequestHistoryComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
  }

  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
  }
  
  TabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.displayExcel =  ['All Requests','My Requests'].includes(this.selectedTab)? true : false;
    clearInterval(this.porterInterval);
    this.showMap = false;
    this.selectedData = null;
    this.showActions = this.showAction1;
    this.loading = true;
    this.selectedIndex = event.index;
    let postData = { index: event.index, textLabel: event.tab.textLabel }
    this.commonService.validateUserPreference('ambMenuTab', JSON.stringify(postData))
    if (this.selectedTab === 'All Requests') {
      this.displayDate = true;
      if (this.commonService.userPreference !== null) {
        if (this.commonService.userPreference?.hasOwnProperty('ambStatusFilter')) {
          this.statusList = JSON.parse(this.commonService.userPreference.ambStatusFilter.value);
          this.getRequestStatus(this.statusList);
        }
      }
      this.getAllRequest(this.selectedDate, false);
    } else if (this.selectedTab === 'My Requests') {
      this.displayDate = true;
      if (this.commonService.userPreference !== null) {
        if (this.commonService.userPreference?.hasOwnProperty('ambStatusFilter')) {
          this.statusList = JSON.parse(this.commonService.userPreference.ambStatusFilter.value);
          this.getRequestStatus(this.statusList);
        }
      }
      this.getAllRequest(this.selectedDate, true);
    } else if (this.selectedTab === 'Manage View') {
      this.displayDate = false;
      this.groupFilter = [];
      this.loading = false;
      this.showMap = true;
    } else {
      this.displayDate = false;
      this.getAllRequest(null, false);
    }
    setTimeout(() =>  this.checkInterval(), 1000);
  }

  checkInterval() {
  if (this.selectedTab === 'All Requests') {
    clearInterval(this.porterInterval);
    this.porterInterval = setInterval(val => this.getAllRequest(this.selectedDate, false), environment.base_value.set_interval);
  } else if (this.selectedTab === 'My Requests') {
    clearInterval(this.porterInterval);
    this.porterInterval = setInterval(val => this.getAllRequest(this.selectedDate, true), environment.base_value.set_interval);
  } else {
    clearInterval(this.porterInterval);
    this.porterInterval = setInterval(val => this.getAllRequest(null, false), environment.base_value.set_interval);
  }
  }

  getAllRequest(dateFilter, isCurrentUser ?: boolean, routerEvent?: boolean, status?: string, locId?: string): void {
    this.loading = true;
    this.checkStatus();
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.ambulance.results;
      this.length = this.route.snapshot.data.activities.totalRecords;
      if (this.commonService.userPreference?.hasOwnProperty('ambStatusFilter')) {
        this.defaultRequest = JSON.parse(this.commonService.userPreference.ambStatusFilter.value);
        if (this.defaultRequest.length > 0) {
          const requestStatuslist = this.groupFilter.find(x => x.id === 'requestStutas');
          if (requestStatuslist) {
            requestStatuslist.subFilters = this.defaultRequest;
          }
          this.getRequestStatus(this.defaultRequest);
          this.tableData = this.tableData.filter((amb) => this.defaultRequest.includes(amb.status));
        }
      }
      this.loading = false;
      for (let i = 0; i <= this.responseColumns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns1[i]] = data[this.responseColumns[i]];
        });
      }
    } else {
      this.getDataDetails(status, isCurrentUser, locId);
    }
  }

  getDataDetails(status, isCurrentUser, locId) {
  if (status === undefined) {
      status = null;
    }
    if (this.selectedTab === 'Manage Ambulance') {
      this.groupFilter = [];
      this.commonService.getAllAmbulance().subscribe((res) => {
        this.length = res.totalRecords;
        this.tableData = res.results;
        this.loading = false;
        const Columns = ['assetSerialNumber', 'name', 'assetAlertCount', 'pilotName', 'doctorName', 'emtName', 'mobileNo', 'tagId','facilityName'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.MTDisplayedColumns[i]] = data[Columns[i]];
          });
        }
      });
    } else {
      this.statusList = this.statusList?.length ?  this.statusList : null;
      locId = locId ?? '';
      this.commonService.getPorterRequest(this.selectedDate, isCurrentUser, locId, this.statusList, 'RQT-AMB', this.customerId, null, this.applyFilterValue, this.pageStart, this.pageSize, null, null, this.selectedToDate).subscribe((res) => {
        this.length = res.totalRecords;
        this.tableData = res.results;
        this.loading = false;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns1[i]] = data[this.responseColumns[i]];
          });
        }
      });
    }
  }

  checkStatus() {
    if (this.selectedTab === 'All Requests') {
      this.customerId = localStorage.getItem('customerId');
    } else if (this.selectedTab === 'My Requests') {
      this.customerId = null;
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showMap = false;
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    if (this.selectedTab === 'All Requests') {
      this.getAllRequest(this.selectedDate, false);
    } else if (this.selectedTab === 'My Requests') {
      this.getAllRequest(this.selectedDate, true);
    } else if (this.selectedTab === 'Manage View') {
      setTimeout(() =>  this.showMap = true, 100);
    } else {
      this.getAllRequest(null, false);
    }
  }
  getRequestStatus(ambStatusFilter? :any) {
    this.commonService.getAppTermsLink("RQT-AMB","RequestStatus").subscribe((res) => {
      this.requestStatus = res.results.filter(st => st.code !== 'RQ-RCR' && st.code !== 'RQ-NS' && st.code !== 'RQ-RTN');
      if (this.groupFilter.length === 0) {
        this.groupFilter = [
          {
            id: 'requestStatus',
            value: 'Status',
            isAll: true,
            selectionType: 'multi',
            subFilters: [],
            defaultSelected: []
          }
        ]
      }
      const requestStatusList = this.groupFilter.find(x => x.id === 'requestStatus');
      if (requestStatusList) {
        requestStatusList.subFilters = this.requestStatus.map(({code, value}) => ({code, value}));
        requestStatusList.defaultSelected = ambStatusFilter.length > 0 ? ambStatusFilter : null;
        this.groupFilter = [...this.groupFilter];
      }

      if (ambStatusFilter && ambStatusFilter.length > 0) {
        this.defaultRequest = ambStatusFilter;
        this.statusList = ambStatusFilter;
        this.commonService.validateUserPreference('ambStatusFilter',  JSON.stringify(this.defaultRequest));
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 3 || this.applyFilterValue.length === 0) {
      this.getNavigateApiCall();
    }
  }

  rowClick(row) {
    if (this.selectedData && row.requestId == this.selectedData.requestId) {
      this.selectedData = null;
      this.statusUpdate = false;
      this.showActions = this.showAction1;
    } else {
      this.selectedData = row;
      if(this.selectedData.status === 'RQ-CA') {
        this.showActions = [{ id: "DD_MDABR", value: "Modify Request" }, { id: "recreate", value: "Recreate" }];
      } else {
        this.showActions = this.showAction2;
      }
      if (
        row.porterRequestStatus != "Completed" &&
        row.porterRequestStatus != "Cancelled"
      ) {
        this.statusUpdate = true;
      } else {
        this.statusUpdate = false;
      }
    }
  }

  getSideMenuData(selectedData, type) {
    this.selectedDataIndex = this.dataSource.data.indexOf(selectedData);
    const length = this.dataSource.data.length;
    if (type == "previous") {
      if (this.selectedDataIndex > 0) {
        this.selectedData = this.dataSource.data[this.selectedDataIndex - 1];
      }
    } else {
      const index = this.selectedDataIndex;
      if (index < length - 1) {
        this.selectedData = this.dataSource.data[this.selectedDataIndex + 1];
      }
    }
  }

  showToDate(event) {
    this.isDisabledContent = true;
  }

  completRequest(id, status) {
    this.workflowService
      .updatePorterRequestById(id, status)
      .subscribe((res) => {
        this.refreshPage();
      });
  }

  createRequest(data, status?: string) {
    if(status !== undefined && status !== null) {
      data['toStatus'] = status;
    } else {
      data['toStatus'] = null;
    }
    this.showActions = null;
    data['initiatedTime'] = this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');;
    const dialogRef = this.dialog.open(AmbulanceRequestComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage()
        this.selectedData = null;
    });
  }

  getPorterFloorPlan(data){
    this.reqDetail = data;
    this.reqType = 'porter';
    this.reqId = null;
    let details = {reqDetail: this.reqDetail, reqType: this.reqType, reqId: this.reqId}
    const dialogRef = this.dialog.open(CommonDialogComponent, {
    data: details,
    panelClass: ['medium-popup'],
    disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
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

  getGoogleDirectionMultiPath(value) {
    if (value.sourceGeoCoordinate.hasOwnProperty('lat') && value.sourceGeoCoordinate.hasOwnProperty('lng')) {
      this.googleMapOrigin = value.sourceGeoCoordinate.lat + ',' + value.sourceGeoCoordinate.lng;
    }
    if (value.destinationGeoCoordinate.hasOwnProperty('lat') && value.destinationGeoCoordinate.hasOwnProperty('lng')) {
      this.googleMapDestination = value.destinationGeoCoordinate.lat + ',' + value.destinationGeoCoordinate.lng;
    }
    if(value.performer.length !== 0 && value.performer[0].hasOwnProperty('tagId') &&
      value.performer[0].tagId !== null) {
        this.tagId = value.performer[0].tagId;
        const fetchGeo = (openMap?: boolean) => {
          this.commonService.getGeoLocation(value.performer[0].tagId).subscribe(res => {
            if(res.results.data.length !== 0) {
              this.latLng = res.results.data;
              this.geo = this.latLng[this.latLng.length - 1];
              this.googleMapWayPoints = this.geo.lat + ',' + this.geo.lng;
            }
            console.log(openMap)
            if (openMap) {
              this.getMap(value, this.geo);
            }
          });
        };
        fetchGeo(true);
    }
  }
  getMap(value?, lastGeo?) {
    clearInterval(this.porterInterval);
      let data = {"googleDirectioAPI" : this.googleDirectionAPI, origin: this.googleMapOrigin, destination: this.googleMapDestination, waypoints: this.googleMapWayPoints, tagId: this.tagId, 
      reqStatus : value.status, reqDetail : value, lastGeoData: lastGeo};

      const dialogRef = this.dialog.open(GoogleDirectionsComponent,{
      data: data, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.sourceGeoCoordinate = {
            "lat": result.latlng.lat,
            "lng": result.latlng.lng,
            "address": result.latlng.label,
          };
        } else {
          this.sourceGeoCoordinate = {};
        }
        this.tagId = null;
        this.googleMapOrigin = null;
        this.googleMapDestination = null;
        this.googleMapWayPoints = null;
        this.refreshPage()
        this.selectedData = null;
      });
  }
  currentLocationForAmbulance(value) {
    if(value.performer.length !== 0 && value.performer[0].hasOwnProperty('tagId') &&
      value.performer[0].tagId !== null) {
      this.commonService.getGeoLocation(value.performer[0].tagId).subscribe(res => {
        if(res.results.data.length !== 0) {
          this.latLng = res.results.data;
          this.geo = this.latLng[0];
        }
      });
    }
    if (this.geo.length !== 0) {
      const id = localStorage.getItem('customerId');
      this.commonService.getAmbulanceLocation(id).subscribe((res) => {
        if (res.results.length !== 0) {
          const facilityId = localStorage.getItem(btoa('facilityId'));
          const loc = res.results.filter(res => res.facilityId === facilityId);
          if(loc.length !== 0) {
            this.defaultLoc = loc[0].geoCoordinate;
          } else {
            this.defaultLoc = res.results[0].geoCoordinate;
          }
        }
      });
      const loc = {'latlng': {'lat': this.geo.lat, 'lng': this.geo.lng}};
      let data = {"type": "latlong", "threshold": 150, "ambulanceLatlong": this.defaultLoc, "searchText": null, "searchLatLng": loc}
      const dialogRef = this.dialog.open(GoogleMapComponent,{
      data: data, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.sourceGeoCoordinate = {
            "lat": result.latlng.lat,
            "lng": result.latlng.lng,
            "address": result.latlng.label,
          };
        } else {
          this.sourceGeoCoordinate = {};
        }
      });
    }
  }

  openStream(data) {
    this.dialog.open(StreamPlayerComponentComponent, {
      width: '72vw',
      height: '90vh',
      data: data,
      disableClose: true
    });
  }

  downloadExcel() {
    let excelData = [],status =[],locId = null;
    if (this.applyFilterValue === '') {
      this.applyFilterValue = null;
    }
    this.checkStatus();
    let isCurrentUser = this.selectedTab ==='My Requests'? true : false;
    locId = locId ?? '';
      this.commonService.getPorterRequest(this.selectedDate, isCurrentUser, locId, this.statusList, 'RQT-AMB', this.customerId, null, null, null, this.length, null, null, this.selectedToDate).subscribe((res) => {
        excelData = res.results;
        this.downloadDynamicExcelData(excelData, this.selectedTab);
      });
  }

  downloadDynamicExcelData(excelData, name) {
    const transpose = false;
    const excelColumn = this.excelDisplayedColumns;
    let Columns = [];
    if (this.excelColumns.length) {
      Columns = this.excelColumns;
    }
    for (let i = 0; i <= Columns.length; i++) {
      excelData.map((data) => {
          data[this.excelDisplayedColumns[i]] = data[Columns[i]];
      });
    }
    this.excelService.exportAsExcelFile(excelData, name, transpose, this.selectedDate, 'report1', excelColumn);
  }
  fixClick() {
    console.log('')
  }

  getNavigateApiCall() {
    if (this.selectedTab === 'My Requests') {
      this.getAllRequest(this.selectedDate, true, false);
    } else {
      this.getAllRequest(this.selectedDate, false, false);
    }
  }
}
