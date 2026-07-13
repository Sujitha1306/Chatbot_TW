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
 import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Output,
  QueryList,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatOption } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { MatInput } from "@angular/material/input";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { routerTransition } from "../../../router.animations";
import {  Subscription } from "rxjs";
import { WorkflowService, CommonService, HospitalService, SseService } from "../../../shared";
import { FormControl, FormGroup } from "@angular/forms";
import {
  PorterRequestHistoryComponent,
  PorterRequestNewComponent
} from "./../../../shared/modules/entry-component/porter-request/porter-request.component";
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { ActivatedRoute } from "@angular/router";
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../../../app.module";
import { environment } from '../../../../environments/environment';
import { CreateUserComponent } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { CookieService } from "ngx-cookie-service";
import { CoasterComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { BreakDialogComponent } from "../../../shared/modules/entry-component/break-dialog/break-dialog.component";
import { ResourceRemarksComponent } from "../../../shared/modules/entry-component/resource-remarks/resource-remarks.component";
import { AppToastService } from "../../../shared/services/toaster.service";
import { RequestComponent } from "../../../shared/modules/entry-component/request/request.component";
import { ConfigCacheService } from "../../../shared/config-cache.service";
import { LookupTermService } from "../../../shared/lookup-term.service";
import { ChatBotComponent } from "../../../shared/modules/entry-component/chat-bot/chat-bot.component";
import { TwColumnDef, TwPaginationConfig } from "../../../shared/modules/entry-component/tw-data-table/tw-data-table.models";

@Component({
  selector: "app-porter",
  templateUrl: "./porter-new.component.html",
  styleUrls: ["./porter.component.scss"],
  animations: [routerTransition()],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ],
})

export class PorterNewComponent implements OnInit, OnDestroy {
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
  MTDisplayedColumns: string[] = ['Device', 'Name', 'Porter ID','Role', 'Current Location', 'Schedule', 'Porter Pool / Location', 'Status','Break Status'];
  RDDisplayedColumns: string[] = ['Ack','Login Name', 'Ack By','Ack Time','Request ID', 'IP Issue No','IP No','Patient Name' ,'Location','Delivery Location','Status','Remarks', 'Assigned Time', 'Order Time','Delivered Time','Category', 'TAT'];
  RDGridConfig: any = null;
  PRGridConfig: any = null;
  phPRGridConfig: any = null;
  RDColumns: any = null;
  RDiconHeader = [];
  RDiconColumn = ['Ack','Order Time','Assigned Time','Delivered Time','Ack Time'];
  RDsortColumn = [];
  displayedColumns1: string[] = [];
  timeColumns = ["Time","Drop Time"]
  dateTimeColumns = ["Assigned Time"]
  RDTimeColumns = ['Ack Time', 'Assigned Time', 'Order Time','Delivered Time']
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  responseColumns = [];
  permissionControl = ["BT_ALLE"];
  eventColumn = [];
  tableColColor = null;
  tableRowColor = null;
  dataSource = new MatTableDataSource();
  filterForm = new FormGroup({
    allReqStatus: new FormControl(),
    myReqStatus: new FormControl(),
    fromDate: new FormControl(),
    toDate: new FormControl(),
    locationId: new FormControl(),
    allReqPorter: new FormControl(),
    myReqPorter: new FormControl(),
    rdStatus: new FormControl(),
    rdDate: new FormControl(),
    rdLocation: new FormControl(),
    isGender: new FormControl(0),
    isPorterPool: new FormControl(0),
    isporterLoc: new FormControl(0)
  });

  @Output() dateChange: EventEmitter<MatDatepickerInputEvent<any>>;
  @ViewChild(MatInput) matInputs: QueryList<MatInput>;
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild('paginatorMy') paginatorMy: MatPaginator;
  @ViewChild('paginatorSpec') paginatorSpec: MatPaginator;
  @ViewChild('paginatorDept') paginatorDept: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('allReqSelected') private readonly allReqSelected: MatOption;
  @ViewChild('myReqSelected') private readonly myReqSelected: MatOption;
  @ViewChild('allReqPorterSelected') private readonly allReqPorterSelected: MatOption;
  @ViewChild('myReqPorterSelected') private readonly myReqPorterSelected: MatOption;

  public parentFilter = [];
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
  public selectedTabIndex = 1;
  public porterInterval: any;
  public twTableVersionData: number = 1;
  public loading = false;
  public locationFilter: any;
  public tableData: any = [];
  public selectedView = "table";
  public selectDropdown = null;
  showAction1 = [
    { id: "create", value: "Create Request" }
  ];
  showActions = this.showAction1;
  showAction2 =[{ id: "modify", value: "Modify Request" }];
  public subscription: Subscription;
  defaultRequest: any;
  public enableTab = true;
  public QryStr: any;
  public gridLoc: any = null;
  porterGroupFilter: any=[];
  porterGroupDefault: any[];
  requestStatusItems: any=[];
  rdLocList: any=[];
  porterGroupFilterItems: any=[];
  porterGroupId = null;
  public porterConfig = null;
  pageSize:number =50;
  pageStart:number=0;
  length:number=0;
  name =null;
  refreshDetail =  {
    'interval' : environment.base_value.set_interval,
    'is_active' : true,
    'updateInterval' : 10,
    'lastUpdate' : null
  }
  genderList: any;
  userPoolList: any[];
  locationPoolList: any;
  selectedGender = ['All'];
  selectedPool = ['All'];
  selectedPoolLoc = ['All'];
  porterStatus: string;
  porterlocId = ['All'];
  porterReqFilter = [
    {
      id: 'status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'location',
      value: 'Location',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'group',
      value: 'porter Group',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    }
  ];
  mtFilter = [
    {
      id: 'porterGender',
      value: 'Gender',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'porterPool',
      value: 'Porter Pool',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'poolLocation',
      value: 'Pool Location',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ];
  pharmacyFilter = [
    {
      id: 'pharmacyStatus',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
  ];
  pharmacyStatus: any[];
  pharmacyType = 'TAT-PA';
  isPharamcyOtp = false;
  private selectedRequestDetails = [];  
  public fetchPharmacy = false;
  sla = null;
  ratingDayLimit = null;
  public sseSub!: Subscription;
  private sseUrl = '';
  
  constructor(
    private readonly dialog: MatDialog,
    private readonly workflowService: WorkflowService,
    public hospitalService: HospitalService,
    private readonly cookieService: CookieService,
    private readonly sidenav: ElementRef,
    public commonService: CommonService,
    private readonly route: ActivatedRoute,
    public datepipe: DatePipe, public toastr: AppToastService,
    private readonly configCacheService: ConfigCacheService,
    private readonly lookupTermService: LookupTermService,
    private sseService: SseService
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    if (this.activate_btn && (this.activate_btn.indexOf('TB_WFPAR') > -1)) {
      this.enableTab = false;
    } else {
      this.enableTab = true;
    }
    this.commonService.getAppTerms('PoolName').subscribe(res => {
      let porterfilter = res.results.filter(item=> item.code !== 'PN-PH');
      this.porterGroupFilter = porterfilter;
      this.porterGroupFilterItems = [...this.porterGroupFilter.map(item => item.code),0];
      this.porterGroupDefault = [...this.porterGroupFilter.map(item => item.code)];
      this.porterGroupId = this.porterGroupDefault;
      const porterGroupFilter = this.parentFilter.find(filter => filter.id === 'group');
      if(porterGroupFilter){
        porterGroupFilter.subFilters = porterfilter.map(({ code, value }) => ({ code, value }));
        porterGroupFilter.defaultSelected = this.porterGroupDefault
      }
      if(this.cookieService.check('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')))) {
        if(JSON.parse(this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')))) === null ||
        JSON.parse(this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')))) === '') {
          this.filterForm.controls['allReqPorter'].patchValue(this.porterGroupDefault);
          this.filterForm.controls['myReqPorter'].patchValue(this.porterGroupDefault);
        } else {
          const porterGroup = JSON.parse(this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
          this.filterForm.controls['allReqPorter'].patchValue(porterGroup);
          this.filterForm.controls['myReqPorter'].patchValue(porterGroup);
        }
      }
    });
    this.getDynamicTableColumn('porter');
    this.filterForm.controls['fromDate'].setValue(this.selectedDate);
    this.filterForm.controls['fromDate'].updateValueAndValidity();
    this.filterForm.controls['locationId'].setValue('All');
    this.filterForm.controls['locationId'].updateValueAndValidity();
    this.commonService.getConfigFile('porter-config').subscribe(res => {
      this.gridLoc = res.results.contentObject
      this.QryStr = this.gridLoc.specialityLocQryStr
      if (this.gridLoc.hasOwnProperty('pharmacy') && this.gridLoc.pharmacy.hasOwnProperty('type')) {
        this.pharmacyType = this.gridLoc.pharmacy.type;
      }
      if (this.gridLoc.hasOwnProperty('sla')) {
        this.sla = this.gridLoc.sla;
      }
      if (this.gridLoc.hasOwnProperty('ratingDayLimit')) {
        this.ratingDayLimit = this.gridLoc.ratingDayLimit;
      }
      if (this.gridLoc.hasOwnProperty('pharmacy')&& this.gridLoc.pharmacy.hasOwnProperty('verifyUser')){
        this.isPharamcyOtp= this.gridLoc.pharmacy.verifyUser;
      }else{
        this.isPharamcyOtp =false;
      }
      
      const locationFilter = this.porterReqFilter.find(filter => filter.id === 'location');
      if(this.gridLoc.specialityLocQryStr){
        this.commonService.getSpecialityQryStr(this.QryStr).subscribe(res => {
          this.locationFilter = res.results;
          if(locationFilter){
            locationFilter.subFilters = this.locationFilter.map(({ id, name }) => ({code: id, value: name}));
          }
        });
      } else {
        this.commonService.getSpecialityLoc('CS-GE', null).subscribe(res => {
          this.locationFilter = res.results;
          if(locationFilter){
            locationFilter.subFilters = this.locationFilter.map(({ id, name }) => ({code: id, value: name}));
          }
        });
      }
    });
    this.getInterval()
  }
  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(data => {
      let menuCode = localStorage.getItem(btoa('menuCode'));
      if (data?.results ) {
        const contentData = JSON.parse(data.results.content);
        if (contentData.hasOwnProperty(menuCode)){
          this.refreshDetail['is_active'] = contentData[menuCode].is_active;
          this.refreshDetail['interval'] = contentData[menuCode].interval * 1000;
          this.refreshDetail['updateInterval'] = contentData[menuCode].updateInterval;
          this.refreshDetail['lastUpdate'] = null;
        }
      }
    });
  }

  ngOnInit() {
    this.getRequestStatus();
    this.getMTeamFilterOpt()
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
      if (msg.length) {
        msg = msg[0];
        if (msg['ctx'] === 'Porter' || msg['ctx'] === 'Request') {
          if(msg['data'][0]['ctxTypeId'] == "RQT-PO") {
            this.porterStatusBinding(msg);
          }
        }
      }
    });
    this.parentFilter = this.porterReqFilter;
    this.connectToSse();
  }
  connectToSse(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }

    const userId = localStorage.getItem(btoa('userId'));
    const base = `${environment.api_base_url_new}${environment.base_value.sse_chat}`;
    this.sseUrl = userId && false ? `${base}?userId=${userId}` : base;

    this.sseSub = this.sseService.connect(this.sseUrl).subscribe({
      next: (event: MessageEvent) => this.handleSseMessage(event),
      error: () => this.startPolling()
    });
  }

  handleSseMessage(event: MessageEvent): void {
    let item: any;
    try {
      item = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }
    if (item.eventType === 'NEW_MESSAGE' && item.conversationId != null) {
      if (this.iconColumn.includes('Message') && (this.selectedTabIndex === 0 || this.selectedTabIndex === 1)) {
        this.refreshPage()  
      }
    };
  }
  startPolling() {
    console.log('getting into polling');
  }

  saveUserPreferenceData() {
    let preferenceData = {};
    preferenceData = {
      "status": this.porterStatus,
      "location": this.porterlocId,
      "group": this.porterGroupId,
      "porterGender": this.selectedGender,
      "porterPool": this.selectedPool,
      "poolLocation": this.selectedPoolLoc,
      "pharmacyStatus": this.pharmacyStatus,
    };
    let lastData = JSON.stringify(preferenceData)
    this.commonService.validateUserPreference('porterFilters', lastData)
  }

  porterStatusBinding(msg) {
    if(((this.selectedTabIndex == 0 || this.selectedTabIndex == 1) && msg['data'][0]['serviceGroupId'] != 'SG-PH' ) || (msg['data'][0]['serviceGroupId'] == 'SG-PH' && this.selectedTabIndex == 4)) {
      if (this.tableData.length) {
        const reqIndex = this.tableData.findIndex(val => val.requestId === msg['data'][0]['requestId']);
        if (reqIndex > -1) {
          let performerIndex = this.tableData[reqIndex]['performer'].findIndex(val => val.requestDetailId === msg['data'][0]['requestDetailId']);
          this.bindPerformerIndex(performerIndex, reqIndex, msg);
        }  else {
          const typeId = msg['data'][0]['ctxTypeId'];
          if (typeId == 'RQT-PO') {
              this.refreshPage(true);
          }
        }
      }
    }
  }

  bindPerformerIndex(performerIndex, reqIndex, msg) {
    if (performerIndex > -1) {
      this.tableData[reqIndex]['status'] = msg['data'][0]['requestStatusId'];
      this.tableData[reqIndex]['statusName'] = msg['data'][0]['statusName'];
      this.tableData[reqIndex]['performer'][performerIndex]['status'] = msg['data'][0]['statusId'];
      this.tableData[reqIndex]['performer'][performerIndex]['statusName'] = msg['data'][0]['requestStatusName'];
    } else {
      const typeId = msg['data'][0]['ctxTypeId'];
      if (typeId == 'RQT-PO') {
        this.refreshPage(true);
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    clearInterval(this.porterInterval);
    
    if (this.sseSub) {
      this.sseSub.unsubscribe();
    }
    if (this.sseUrl) {
      this.sseService.disconnect(this.sseUrl);
    }

    this.configCacheService.clearCache('porter-config');
    this.lookupTermService.clearCache('ServiceGroup,RequestStatus,PoolName,Gender,AssetType,PorterRequestType');
    this.lookupTermService.clearCache('RQT-PO', 'PorterRequestType');
  }
  checkBoxAction(event){
    if(event){
      this.selectedRequestDetails = event
      if(event.length > 0){
        let actionDropdown = this.showAction1;
        if(actionDropdown.findIndex(x => x.id === 'sendAck') === -1){
          this.showActions = null;  
          actionDropdown.push({id: 'sendAck', value: 'Send Ack'})
        }
        this.showActions = JSON.parse(JSON.stringify(actionDropdown));
      } else {
        this.showActions = null;  
        this.showActions = JSON.parse(JSON.stringify(this.showAction1));;
      }
    }
  }

  headerEventAction(event){
    console.log(event)
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if(event.key === "dateFilter") {
      this.loading = true;
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd')
      this.manageDateFilter(this.selectedDate);
    } else if(event.data == 'create'){
      this.createRequest('');
    } else if(event.data == 'modify'){
      this.createRequest(this.selectedData);
    } else if(event.data == 'break'){
      let data = this.selectedData;
      const dialogRef = this.dialog.open(BreakDialogComponent, {
        panelClass:['mdm-Confirmation-popup'], disableClose: true,
        data: data
      });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage()
        this.selectedData = null;
      });
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else if(event.data == 'sendAck'){
        if(this.selectedRequestDetails.length > 0){
          this.requestDetailAck(this.selectedRequestDetails, true);
        }
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  manageDateFilter(selectedDate) {
    if(this.selectedTabIndex === 0 || this.selectedTabIndex === 1 || this.selectedTabIndex === 4){
      this.getAllRequest(selectedDate, null);
    } else { 
      this.getAllRequestDetail(selectedDate,null,null, this.name, this.pageStart, this.pageSize)
    }
  }

  manageGroupFilter(event) {
    if(this.selectedTabIndex === 0 || this.selectedTabIndex === 1 || this.selectedTabIndex === 4) {
      this.porterStatus = event.data.filter(item => item.id === 'status').map(code => code.data);
      this.porterlocId = event.data.filter(item => item.id === 'location').map(code => code.data);
      this.porterGroupId = event.data.filter(item => item.id === 'group').map(code => code.data);
      this.getAllRequest(this.selectedDate, null);
      this.saveUserPreferenceData();
    } else if(this.selectedTabIndex === 2){
      let mtFilterData = event.data
      this.selectedGender = mtFilterData.filter(item => item.id === 'porterGender').map(code => code.data);
      this.selectedPool = mtFilterData.filter(item => item.id === 'porterPool').map(code => code.data);
      this.selectedPoolLoc = mtFilterData.filter(item => item.id === 'poolLocation').map(code => code.data);
      this.getAllRequest(this.selectedDate, null);
      this.saveUserPreferenceData();
    } else if(this.selectedTabIndex === 3){
      this.pharmacyStatus = event.data.filter(item => item.id === 'pharmacyStatus').map(code => code.data);
      this.getAllRequestDetail(this.selectedDate,null,null, this.name, this.pageStart, this.pageSize)
      this.saveUserPreferenceData();
    }
  }

  eventAction(event) {
    if(event.data == 'create'){
      this.createRequest('');
    } else if(event.key == 'Requester'){
      this.getRequestById(event.data)
    } else if(event.key == 'Status'){
      this.getPorterHistory(event.data);
    } else if(event.key == 'Location'){
      this.currentLocation(event.data);
      this.getPorterFloorPlan(event.data);
    } else if(event.key == 'viewHistory'){
      this.porterLocationHistory(event.data);
    } else if (event.key === 'Schedule') {
      clearInterval(this.porterInterval);
      event['data']['selectedTab'] = 'Schedule';
      this.createUser(event);
    } else if (event?.key === 'Name') {
      clearInterval(this.porterInterval);
      this.createUser(event);
    } else if (event.key === "Device") {
      this.manageCoster(event.data);
    } else if(event.key == 'rdAck'){
      this.requestDetailAck(event.data, false);
    } else if (event.key == "pagination"){
      this.managePagination(event);
    } else if(event.key == "addBreak"){
      this.addBreak(event);
    } else if(event.key == "closeBreak"){
      let data = event.data;
      this.closeBreak(data)
    } else if (event.key === 'Current Location'){
      this.currentLocationData(event.data)
    } else if(event.key ==='Rating'){
      this.addRating(event);
    } else if (event.key === 'Message') {
      this.getRequestById(event.data, event.key)
    }
  }

  createMessage(rowData) {
    // this.showActions = null;
    rowData['userName'] = rowData?.userName;
    rowData['roleName'] = rowData?.porterTypeName;
    rowData['chatType'] = 'request';
    if (rowData?.unreadCount > 0 && rowData?.conversationId) {
      const userId = Number(localStorage.getItem(btoa('userId')));
      this.commonService.markChatAsRead(rowData?.conversationId, userId).subscribe((res) => {
        if (res.statusCode == 1) {
          rowData['unreadCount'] = 0;
        }
      });
    }
    const dialogRef = this.dialog.open(ChatBotComponent, {
      data: rowData,
      panelClass: 'chat-dialog',
      disableClose: true,
      position: { right: '0' },
      height: '100vh',
      width: '380px',
    });
  }

  addRating(event) {
    const data = event.data;
    data['type'] = 'porter';
    const userId = Number(localStorage.getItem(btoa('userId')));
    let limitDay = new Date(this.selectedDate); 
    if (this.ratingDayLimit != null) {
        limitDay.setDate(limitDay.getDate() + this.ratingDayLimit);
    }
    if (this.activate_btn.includes('BT_PORT_BTN') || data?.userId === userId ) {
      if(this.ratingDayLimit === null || (this.datepipe.transform(this.currentDate, 'yyyy-MM-dd') < this.datepipe.transform(limitDay, 'yyyy-MM-dd'))) {
         const dialogRef = this.dialog.open(ResourceRemarksComponent,
        {data : data, panelClass: 'confirmation-popup', disableClose: true ,height: '300px', width: '450px'});
        dialogRef.afterClosed().subscribe(result => {
          this.selectDropdown = null;
          this.refreshPage();
        });
      } else {
        this.toastr.warning('Warning', 'User must submit a rating within ' + this.ratingDayLimit + ' days');
      }
    } else {
      this.toastr.warning('Warning', 'User does not have permission to provide the  rating');
    }
  }

  addBreak(event) {
    let data = event.data;
    const dialogRef = this.dialog.open(BreakDialogComponent, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true,
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage()
    });
  }
  
  createUser(event) {
    const data = event.data;
    data['type'] = 'user';
    data['sizeType'] = 'medium';
    const dialogRef = this.dialog.open(CreateUserComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }

  managePagination(event) {
    this.loading = true;
    this.pageSize = event.data.pageSize;
    this.pageStart = event.data.pageIndex;
    if(this.applyFilterValue) {
      this.applyFilterValue = this.applyFilterValue.trim();
      this.applyFilterValue = this.applyFilterValue.toLowerCase();
    }
    if(this.selectedTabIndex === 3) {
      this.getAllRequestDetail(this.selectedDate,null, ['RQ-CO'],this.name,this.pageStart,this.pageSize);
    } else {
      this.getAllRequest(this.selectedDate,null,null,null,null,null,this.name,this.pageStart,this.pageSize);
    }
  }

  currentLocationData(data){
    if (data.tagSerialNumber !== null && data.floorId !== null  ){
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        data: data,
        panelClass: 'medium-popup',
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.getAllRequest(this.selectedDate,null,null,null,null,null,this.name,this.pageStart,this.pageSize);
      });
    }
    }
  closeBreak(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
      title: 'Cancel Break', message: 'Are you sure want to cancel the break?', 
      buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1, confirmation : true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result == 'Yes') {
        console.log(data)
        let payload = {
          "entityBookingId": data.breakId,
          "bookingStatusId": "BK-CMP",
          "entityId": data.id,
          "entityType": "Porter",
          "facilityId": localStorage.getItem(btoa('facilityId')),
          "eventDateTime": this.commonService.getUTCNowFormatted(),
          "status": true
        }
        this.commonService.cancelBreak(payload).subscribe(res => {
          if(res.statusCode == 1) {
            this.refreshPage();
          }
        })  
      }
    });
  }
  requestDetailAck(data, isMulti) {
    let dialogData = {}
    if(isMulti) {
      data = data.filter(item => item.hasOwnProperty('ackmobileById') && item.acknowledgedById === null);
      const allComments = data
        .map(item => item.comments)
        .filter(comment => comment) // removes null or undefined
        .join(',');
      const acknowledgedComments = data
        .map(item => item.acknowledgedComments)
        .filter(acknowledgedComments => acknowledgedComments) // removes null or undefined
        .join(',');
        const uniqueComments = Array.from(new Set(allComments.split(','))).join(',');
        const uniqueAckComments = Array.from(new Set(acknowledgedComments.split(','))).join(',');
        dialogData = {
          title: "Send Acknowledgement", 
          message: "The package " + '(' + uniqueComments + ')' + " has been acknowledged as arrived.",
          customMsg : true,
          buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0, pharmacyAck: true,
          isPartiallyCompleted : null,
          acknowledgedComments : uniqueAckComments,
          ackUser: null,
          'isPharmacyOtp':  this.isPharamcyOtp 
      }
    } else {
      dialogData = {
          title: "Send Acknowledgement", 
          message: "The package " + (data.comments ? "("+ data.comments +")" : "") + " has been acknowledged as arrived at " + data.perfLocFullName,
          customMsg : true,
          buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0, pharmacyAck: true,
          isPartiallyCompleted : data.hasOwnProperty('isPartiallyCompleted')?data['isPartiallyCompleted']:null,
          acknowledgedComments : data.hasOwnProperty('acknowledgedComments')?data['acknowledgedComments']:null,
          ackUser: data.hasOwnProperty('comments')?data['comments']:null,
          'isPharmacyOtp':  this.isPharamcyOtp 
      }
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true, height : "330px",width : "600px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result['confirmButtonText'] == 'Yes'){
        let postData = [];
        if(isMulti) {
          data.forEach((item) => {
            postData.push({
              "acknowledgedComments" : result['acknowledgedComments'],
              "isPartiallyCompleted" : result['isPartiallyCompleted'],
              "comments" : result['userName'],
              "requestDetailId" : item.id,
              "ackmobileById":result['ackmobileById']
            })
          });
        } else {  
          postData = [{
            // "detailsId":[data.id], 
            "acknowledgedComments" : result['acknowledgedComments'],
            "isPartiallyCompleted" : result['isPartiallyCompleted'],
            "comments" : result['userName'],
            "requestDetailId" : data.id,
            "ackmobileById":result['ackmobileById']
          }]
        }
        this.commonService.reqDetailAck(postData).subscribe(res => {
          if(res.statusCode == 1) {
            this.refreshPage();
          }
        })
      }
    });
  }

  manageCoster(data) {
    data['workflowTypeId']    = 'WF-STF';
    data['associationId']     = data.id;
    data['associationTypeId'] = data.associationTypeId ? data.associationTypeId : 'TAT-PO';
    data['associatedName']    = data.associationTypeId == 'TAT-PO' ? 'Porter' :  'User';
    data['tag_type_name']     = data.associationTypeId == 'TAT-PO' ? 'Porter' :  'User';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        this.refreshPage();
      }
    });
  }
  
  porterLocationHistory(data){
    const formData = data;
    data['content'] = 'history'
    clearInterval(this.porterInterval);
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    }); dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
    });
  }

  changeDate(dateType) {
    if (dateType== 'previous') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() - 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
      this.tableData = [];
    } else if (dateType== 'next') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() + 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
      this.tableData = [];
    }
    let dateValue = this.filterForm.controls['fromDate'].value
    if (this.selectedTabIndex === 1) {
      this.getAllRequest(dateValue, true);
    } else if (this.selectedTabIndex === 3) {
      if (dateType== 'previous') {
        this.currentDate.setDate(new Date(this.filterForm.controls['rdDate'].value).getDate() - 1);
      } else if (dateType== 'next') {
        this.currentDate.setDate(new Date(this.filterForm.controls['rdDate'].value).getDate() + 1);
      }
      
      this.filterForm.controls['rdDate'].setValue(this.currentDate);
      let dateValue = this.filterForm.controls['rdDate'].value
      this.getAllRequestDetail(dateValue, null,['RQ-CO'], this.name, this.pageStart, this.pageSize);
    } else{
      this.getAllRequest(dateValue, false);
    }
  }

  onWindowResized(size) {
    this.height = size;
  }

  getPorterHistory(data) {
    clearInterval(this.porterInterval);
    const dialogRef = this.dialog.open(PorterRequestHistoryComponent, {
      data: data,
      panelClass:['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
    });
  }

  tabChanged = (tabChangeEvent: any): void => {
    this.tableData = [];
    this.loading = true;
    this.selectedTabIndex = tabChangeEvent.index;
    this.pageStart = 0;
    this.filterForm.controls['allReqStatus'].patchValue(this.defaultRequest);
    this.filterForm.controls['myReqStatus'].patchValue(this.defaultRequest);
    this.filterForm.controls['locationId'].setValue('All');
    this.filterForm.controls['locationId'].updateValueAndValidity();
    if (this.selectedTabIndex === 0) {
      this.selectedDate = this.filterForm.controls['fromDate'].value;
      this.parentFilter = [];
      this.parentFilter = this.porterReqFilter
      this.filterForm.controls['allReqPorter'].patchValue(this.filterForm.controls['myReqPorter'].value);
      this.filterForm.controls['fromDate'].setValue(this.selectedDate);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getDynamicTableColumn('porter');
      this.checkUserPreference()
    } else if (this.selectedTabIndex === 1) {
      this.selectedDate = this.filterForm.controls['fromDate'].value;
      this.parentFilter = this.porterReqFilter
      this.filterForm.controls['myReqPorter'].patchValue(this.filterForm.controls['allReqPorter'].value);
      this.filterForm.controls['fromDate'].setValue(this.selectedDate);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getDynamicTableColumn('porter');
      this.checkUserPreference()
    } else if (this.selectedTabIndex === 2) {
      clearInterval(this.porterInterval);
      this.selectedDate = null;
      this.parentFilter = this.mtFilter;
      this.checkUserPreference()
    } else if (this.selectedTabIndex === 3) {
      if(this.RDGridConfig == null) {
        this.getDynamicTableColumn('porter-pharmacy');
      }
      this.parentFilter = this.pharmacyFilter;
      this.selectedDate = this.filterForm.controls['rdDate'].value;
      this.filterForm.controls['rdDate'].setValue(this.selectedDate);
      this.filterForm.controls['rdDate'].updateValueAndValidity();
      this.filterForm.controls['rdStatus'].setValue(['RQ-CO']);
      this.filterForm.controls['rdStatus'].updateValueAndValidity();
      this.filterForm.controls['rdLocation'].setValue('All');
      this.filterForm.controls['rdLocation'].updateValueAndValidity();
      this.checkUserPreference();
    } else if (this.selectedTabIndex === 4) {
      this.fetchPharmacy = true;
      this.getDynamicTableColumn('porter-pharmacy-req');
      this.selectedDate = this.filterForm.controls['fromDate'].value;
      this.parentFilter = [];
      this.parentFilter = this.porterReqFilter
      this.filterForm.controls['allReqPorter'].patchValue(this.filterForm.controls['myReqPorter'].value);
      this.filterForm.controls['fromDate'].setValue(this.selectedDate);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.checkUserPreference()
    }
  }
  updateGridConfig(contentObject) {
    this.fetchPharmacy = this.selectedTabIndex === 4 ? true : false;
    const dynamicColumns = contentObject;
    this.displayedColumns1 = dynamicColumns.displayedColumns1;
    this.iconColumn = dynamicColumns.iconColumn;
    this.sortColumn = dynamicColumns.sortColumn;
    this.iconHeader = dynamicColumns.iconHeader;
    this.timeColumns = dynamicColumns.timeColumns
    this.dateTimeColumns = dynamicColumns.dateTimeColumns
    this.responseColumns = dynamicColumns.columns;
    if (dynamicColumns.hasOwnProperty('color') && this.commonService.facilityConfig?.twTableVersion !== 2) {
      this.tableColColor = dynamicColumns['color']
    }
    if (dynamicColumns.hasOwnProperty('rowColor') && this.commonService.facilityConfig?.twTableVersion !== 2) {
      this.tableRowColor = dynamicColumns['rowColor']
    }
    if (dynamicColumns.hasOwnProperty('rowColorv2') && this.commonService.facilityConfig?.twTableVersion === 2) {
       this.tableRowColor = dynamicColumns['rowColorv2']
    }
    if (dynamicColumns.pageSize && dynamicColumns.pageSize !== null) {
      this.pageSize = dynamicColumns.pageSize;
    } else {
      this.pageSize = 50;
    }      
  }
  getDynamicTableColumn(tableName) {
    this.twTableVersionData = this.commonService.facilityConfig?.twTableVersion ?? 1;
    if((tableName === 'porter' && this.PRGridConfig != null) || (tableName === 'porter-pharmacy-req' && this.phPRGridConfig != null)) {
      this.updateGridConfig(this.selectedTabIndex === 4 ? this.phPRGridConfig : this.PRGridConfig);
    } 
    this.commonService.getDynamicTableColumn(tableName).subscribe((res) => {
      if (res.statusCode !== 0) {
        if (res.results.key === 'grid-config-porter' || res.results.key === 'grid-config-porter-pharmacy-req') {
          if(res.results.key === 'grid-config-porter') {
            this.PRGridConfig = res.results.contentObject;
            if (this.commonService.facilityConfig?.twTableVersion === 2) {
              this.PRGridConfig.displayedColumns1 = this.PRGridConfig.displayedColumns1.filter(col => col !== 'ID');
              this.PRGridConfig.columns = this.PRGridConfig.columns.filter(col => col !== 'ID');
            }
            this.updateGridConfig(this.PRGridConfig);
          } else if(res.results.key === 'grid-config-porter-pharmacy-req') {
            this.phPRGridConfig = res.results.contentObject;
            if (this.commonService.facilityConfig?.twTableVersion === 2) {
              this.phPRGridConfig.displayedColumns1 = this.phPRGridConfig.displayedColumns1.filter(col => col !== 'ID');
              this.phPRGridConfig.columns = this.phPRGridConfig.columns.filter(col => col !== 'ID');
            }
            this.updateGridConfig(this.phPRGridConfig);          
          }          
        } else if (res.results.key === 'grid-config-porter-pharmacy') {
          const pharmacyColumns = res.results.contentObject;
          this.RDGridConfig = res.results.contentObject;
          this.RDDisplayedColumns = pharmacyColumns.displayedColumns;
          this.RDiconColumn = pharmacyColumns.iconColumn;
          this.RDsortColumn = pharmacyColumns.sortColumn;
          this.RDiconHeader = pharmacyColumns.iconHeader;
          this.RDColumns = pharmacyColumns.columns;
          if(pharmacyColumns.RDTimeColumns){
          this.RDTimeColumns = pharmacyColumns.RDTimeColumns
          }
        }
      }
      /** Resolver ui calling changes Temporarily commented for pagination ui issue by Rahul at Feb 7

        if (this.selectedTabIndex === 1) {
          this.getAllRequest(this.selectedDate, true, true);
          } else {
          this.getAllRequest(this.selectedDate, false, true);
        } 
      */
    });
  }
  
  onLocationChange(value) {
    this.loading = true;
    if (value === 'All') {
      value = '';
    }
    this.filterForm.controls['locationId'].setValue(this.filterForm.controls['locationId'].value);
    this.filterForm.controls['locationId'].updateValueAndValidity();
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
      this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
      this.filterForm.controls['fromDate'].setValue(this.filterForm.controls['fromDate'].value);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getAllRequest(this.selectedDate, false, false, value);
    } else if (this.selectedTabIndex === 1) {
      this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
      this.filterForm.controls['fromDate'].setValue(this.filterForm.controls['fromDate'].value);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getAllRequest(this.selectedDate, true, false, null, value);
    } else if (this.selectedTabIndex === 2) { 
      this.getAllRequest(null, false, false, null, value);
    } else if (this.selectedTabIndex === 3) {
      let dateValue = this.filterForm.controls['rdDate'].value;
      this.getAllRequestDetail(dateValue,null,null,this.name, this.pageStart,this.pageSize)
    }
  }

  onPorterGroupChange(value, type) {
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
      if(type === 'click') {
        this.checkAllPorterRequest(value);
      } else {
        this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
        this.filterForm.controls['fromDate'].setValue(this.selectedDate);
        this.filterForm.controls['fromDate'].updateValueAndValidity();
        this.getAllRequest(this.selectedDate, false, false, value);
      }
    } else if (this.selectedTabIndex === 1) {
      if(type === 'click') {
        this.checkMyPorterRequest(value);
      } else {
        this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
        this.filterForm.controls['fromDate'].setValue(this.selectedDate);
        this.filterForm.controls['fromDate'].updateValueAndValidity();
        this.getAllRequest(this.selectedDate, true, false, value);
      }
    } else {
      this.getAllRequest(null, false, false, value);
    }
  }

  checkAllPorterRequest(value) {
    if (value === 0) {
      if (this.allReqPorterSelected.selected) {
        this.filterForm.controls['allReqPorter']
          .patchValue(this.porterGroupFilterItems);
      } else {
        this.filterForm.controls['allReqPorter'].patchValue([]);
      }
    } else {
      const request = this.filterForm.controls['allReqPorter'].value;
      console.log(request);
      if (this.allReqPorterSelected.selected) {
        this.allReqPorterSelected.deselect();
      }
      if(this.filterForm.controls['allReqPorter'].value.length === this.porterGroupFilter.length){
        this.allReqPorterSelected.select();
      }
    }
  }

  checkMyPorterRequest(value) {
    if (value === 0) {
      if (this.myReqPorterSelected.selected) {
        this.filterForm.controls['myReqPorter']
          .patchValue(this.porterGroupFilterItems);
      } else {
        this.filterForm.controls['myReqPorter'].patchValue([]);
      }
    } else {
      const request = this.filterForm.controls['myReqPorter'].value;
      console.log(request);
      if (this.myReqPorterSelected.selected) {
        this.myReqPorterSelected.deselect();
      }
      if (this.filterForm.controls['myReqPorter'].value.length === this.porterGroupFilter.length) {
        this.myReqPorterSelected.select();
      }
    }
  }

  onStatusChange(value, type) {
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
      if(type === 'click') {
        this.checkAllRequest(value);
      } else {
        this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
        this.filterForm.controls['fromDate'].setValue(this.selectedDate);
        this.filterForm.controls['fromDate'].updateValueAndValidity();
        this.loading = true;
        this.getAllRequest(this.selectedDate, false, false, value);
      }
    } else if (this.selectedTabIndex === 1) {
      if(type === 'click') {
        this.checkMyRequest(value);
      } else {
        this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
        this.filterForm.controls['fromDate'].setValue(this.selectedDate);
        this.filterForm.controls['fromDate'].updateValueAndValidity();
        this.loading = true;
        this.getAllRequest(this.selectedDate, true, false, value);
      }
    } else if (this.selectedTabIndex === 2) {
      this.getAllRequest(null, false, false, value);
    } else if (this.selectedTabIndex === 3) {
      let dateValue = this.filterForm.controls['rdDate'].value;
      this.getAllRequestDetail(dateValue,null,null, this.name, this.pageStart, this.pageSize)
    }
  }

  checkAllRequest(value) {
    if (value === 0) {
      if (this.allReqSelected.selected) {
        this.filterForm.controls['allReqStatus']
          .patchValue(this.requestStatusItems);
      } else {
        this.filterForm.controls['allReqStatus'].patchValue([]);
      }
    } else {
      if (this.allReqSelected.selected) {
        this.allReqSelected.deselect();
      }
      if(this.filterForm.controls['allReqStatus'].value.length === this.requestStatus.length){
        this.allReqSelected.select();
      }
    } 
  }

  checkMyRequest(value) {
    if (value === 0) {
      if (this.myReqSelected.selected) {
        this.filterForm.controls['myReqStatus']
          .patchValue(this.requestStatusItems);
      } else {
        this.filterForm.controls['myReqStatus'].patchValue([]);
      }
    } else  {
      if (this.myReqSelected.selected) {
        this.myReqSelected.deselect();
      }
      if(this.filterForm.controls['myReqStatus'].value.length === this.requestStatus.length){
        this.myReqSelected.select();
      }
    }
  }

  openedChange(isOpended, type) {
    if(!isOpended)
    {
      if(type === 'status') {
        let status = [];
        if (this.selectedTabIndex === 0) {
          status = this.filterForm.get('allReqStatus').value;
        } else if (this.selectedTabIndex === 1) {
          status = this.filterForm.get('myReqStatus').value;
        } else  if (this.selectedTabIndex === 4) {
          status = this.filterForm.get('allReqStatus').value;
        }
        this.onStatusChange(status, 'change');
      } else if(type === 'porter') {
        let porter = [];
        if (this.selectedTabIndex === 0) {
          porter = this.filterForm.get('allReqPorter').value;
        } else if (this.selectedTabIndex === 1) {
          porter = this.filterForm.get('myReqPorter').value;
        } else if (this.selectedTabIndex === 4) {
          porter = this.filterForm.get('allReqPorter').value;
        }
        this.onPorterGroupChange(porter, 'change');
      }
    }
  }

  checkInterval() {
  if (this.selectedTabIndex === 0) {
    this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
    this.filterForm.controls['fromDate'].setValue(this.selectedDate);
    this.filterForm.controls['fromDate'].updateValueAndValidity();
    clearInterval(this.porterInterval);
    if(this.applyFilterValue===null ||this.applyFilterValue===''){
    this.porterInterval = setInterval(val => this.refreshPage(true), this.refreshDetail.interval);
    }
  } else if (this.selectedTabIndex === 1) {
    clearInterval(this.porterInterval);
    if(this.applyFilterValue===null||this.applyFilterValue===''){
    this.porterInterval = setInterval(val => this.refreshPage(true), this.refreshDetail.interval);
    }
  } else if (this.selectedTabIndex === 2) {
    clearInterval(this.porterInterval);
    this.getAllRequest(null, false);
  } else if (this.selectedTabIndex === 3) {
    clearInterval(this.porterInterval);
  } else if (this.selectedTabIndex === 4){
    this.fetchPharmacy = true
    this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
    this.filterForm.controls['fromDate'].setValue(this.selectedDate);
    this.filterForm.controls['fromDate'].updateValueAndValidity();
    clearInterval(this.porterInterval);
    if(this.applyFilterValue===null ||this.applyFilterValue===''){
    this.porterInterval = setInterval(val => this.refreshPage(true), this.refreshDetail.interval);
    }
  }
  }
  getAllRequestDetail(dateFilter, locId?: string, status?: any, name?:string, pageStart?: number,pageSize?: number) {
    clearInterval(this.porterInterval);
    if(this.pharmacyStatus.length){
      if(this.pharmacyStatus.length === this.requestStatus.length) {
        status = null;
      } else {
        status = this.pharmacyStatus
      }
    } else {
      status = null;
    }
    let type = this.pharmacyType ? this.pharmacyType : 'TAT-PA';
    let serviceGroupId = 'SG-PH';
    this.commonService.getRequestDetail(type, this.selectedDate, locId, status,serviceGroupId, name,this.pageStart,this.pageSize).subscribe((res) => {
      this.length = res.totalRecords;
      this.loading = true;
      let result = res.results;
      this.tableData = res.results;
      if(locId) {
        this.tableData = this.tableData.filter(val => val.performerId == locId)
      }
      let Columns = ['acknowledgedByName','acknowledgedByName','ackmobileByName','acknowledgeTime','requestId','externalIdentifier','visitidentifier', 'performerName','perfLocFullName','porterLocation', 'statusName','acknowledgedComments', 'actualPickupTime','externalTime','completedTime','category','tatTime'];
      if(this.RDColumns?.length){
        Columns = [];
        Columns = this.RDColumns;
      }
      if(this.pharmacyType == 'LOC') {
        this.RDDisplayedColumns = this.RDDisplayedColumns.map(item => item.replace("Patient Name", "Location Name"));
      }

      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.RDDisplayedColumns[i]] = data[Columns[i]];
          if (Columns[i] == 'isPartiallyCompleted') {
            data[this.RDDisplayedColumns[i]] = data[Columns[i]] === true ? 'Yes' : data[Columns[i]] === false ? 'No' : data[Columns[i]];
          }
        });
      }
      let performerList = [];
      let locations = [];
      result.forEach((item) => {
        if(!locations.includes(item.performerId)) {
          locations.push(item.performerId)
          performerList.push(item)
        }
      });
      this.rdLocList = this.commonService.sortByKey(performerList, 'perfLocFullName')
      this.loading = false;
    });
  }
  getAllRequest(dateFilter, isCurrentUser ?: boolean, routerEvent?: boolean, status?: string, locId?: string, porterGroupId?: string,name?:string, pageStart?: number,pageSize?: number): void {
    if(this.selectedTabIndex == 4){
      this.fetchPharmacy = true ;
    } else{
      this.fetchPharmacy = false;
    }
    this.checkDateFilter(dateFilter);
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
      status = this.setPorterStatus();
      porterGroupId = this.setPorterGroupId();
    } else if (this.selectedTabIndex === 1) {
      status = this.setPorterStatus();
      porterGroupId = this.setPorterGroupId();
      isCurrentUser = true;
    }
    this.cookieService.set(
      'porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
      JSON.stringify(this.porterGroupId)
    );
    console.log(this.porterlocId)
    if (this.porterlocId[0] !== 'All') {
      locId = this.porterlocId[0]
    } else {
      locId = ''
    }
    this.filterForm.controls['locationId'].updateValueAndValidity();
    this.setDefaultDate(dateFilter);
    if (routerEvent) {
      this.getRouterEvent();
    } else {
      if (status?.length < 0) {
        status = null;
      }
      if (this.selectedTabIndex === 2) {
        this.getAllUsers();
      } else {
        this.getPorterRequest(isCurrentUser, locId, status, porterGroupId, name);
      }
    }
  }

  getRouterEvent() {
    this.loading = true;
    this.tableData = this.route.snapshot.data.porters.results;
    this.length = this.route.snapshot.data.porters.totalRecords;
    this.loading = false;
    for (let i = 0; i <= this.responseColumns.length; i++) {
      this.tableData.map((data) => {
        if(this.displayedColumns1[i] == 'Alert') {
              data[this.displayedColumns1[i]] = this.checkDuration(data);
            } else {
              data[this.displayedColumns1[i]] = data[this.responseColumns[i]];
            }
      });
    }
  }

  setDefaultDate(dateFilter) {
    if (dateFilter !== null) {
      this.setFromDate(dateFilter);
    } else {
      const index = this.selectedTabIndex;
      if(index == 2) {
        this.selectedDate = null;
      }
    }
  }

  checkDateFilter(dateFilter) {
    const date = new Date();
    if(dateFilter !== null && this.selectedTabIndex !== 2) {
      if(this.datepipe.transform(dateFilter, 'yyyy-MM-dd') !== this.datepipe.transform(date, 'yyyy-MM-dd')) {
        clearInterval(this.porterInterval);
      } else {
        this.checkInterval();
      }
    } else {
      const index = this.selectedTabIndex;
      if(index === 2){
        clearInterval(this.porterInterval);
      } else {
        this.checkInterval();
      }
    }
  }

  setFromDate(dateFilter) {
    if (this.datepipe.transform(this.today, 'yyyy-MM-dd') !== this.datepipe.transform(new Date(), 'yyyy-MM-dd')) {
      this.today = new Date();
      this.currentDate = new Date();
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    } else {
      this.selectedDate = this.datepipe.transform(dateFilter, 'yyyy-MM-dd');
    }
    this.filterForm.controls['fromDate'].setValue(this.datepipe.transform(this.selectedDate, 'yyyy-MM-dd'));
    this.filterForm.controls['fromDate'].updateValueAndValidity();
  }

  setPorterStatus() {
    if (this.porterStatus.length) {
      if(this.porterStatus.length ===  this.requestStatus.length) {
        return null;
      } else {
        return this.porterStatus;
      }
    } else {
      return null
    }
  }

  setPorterGroupId() {
    if (this.porterGroupId && this.porterGroupId.length) {
      if(this.porterGroupId.length === this.porterGroupFilter.length) {
        return null;
      } else {
        return this.porterGroupId;
      }
    } else {
      return null;
    }
  }

  getAllUsers() {
    let selectedPool = null;
    let selectedPoolLoc = null;
    this.loading = true;
    let selectGender = null
    if(this.selectedGender[0] === 'All') {
      selectGender = null;
    } else {
      selectGender = this.selectedGender[0];
    }
    if(this.selectedPool[0] === 'All'){
      selectedPool = null;
    } else {
      selectedPool = this.selectedPool[0]
    }

    if(this.selectedPoolLoc[0] === 'All'){
      selectedPoolLoc = null;
    } else {
      selectedPoolLoc = this.selectedPoolLoc[0]
    }
    this.hospitalService.getAllUsers(null, 'RO-PO',this.applyFilterValue,this.pageStart,this.pageSize, selectGender, selectedPool, selectedPoolLoc).subscribe((res) => {
      this.loading = true;
      this.refreshDetail.lastUpdate = Math.floor((new Date().getTime())/1000);
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.loading = false;
      const Columns = ['tagId', 'fullName', 'id', 'roleName', 'currentLocationName', 'shiftName', 'poolNameLocation', 'requestDetailStatusValue', 'breakId'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.MTDisplayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  getPorterRequest(isCurrentUser, locId, status, porterGroupId, name) {
    this.commonService.getPorterRequest(this.selectedDate, isCurrentUser, locId, status, null, null, porterGroupId, name, this.pageStart, this.pageSize,null, this.fetchPharmacy).subscribe((res) => {
      this.loading = true;
      this.refreshDetail.lastUpdate = Math.floor((new Date().getTime())/1000);
      if (status !== null) {
        this.manageFilter(res.results);
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.loading = false;
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map((data) => {
            if(this.displayedColumns1[i] == 'Alert') {
              data[this.displayedColumns1[i]] = this.checkDuration(data);
            } else {
              data[this.displayedColumns1[i]] = data[this.responseColumns[i]];
            }
          });
        }
      } else {
        this.manageFilter(res.results);
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.loading = false;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map((data, j) => {
            if(this.displayedColumns1[i] == 'Alert') {
              data[this.displayedColumns1[i]] = this.checkDuration(data);
            } else {
              data[this.displayedColumns1[i]] = data[this.responseColumns[i]];
            }
          });
        }
      }
    });
  }

  checkDuration(data) {
    let alert = [];
    if(this.sla !== null) {
      if(data?.status !== 'RQ-CA' && data?.status !== 'RQ-RJ') {
        let today = new Date();
        const endTime = data?.status === 'RQ-CO' ? data?.endTime : this.datepipe.transform(today, 'yyyy-MM-dd HH:mm:ss')
        const diff = new Date(data?.requestTime).getTime() - new Date(endTime).getTime();
        const mins = (Math.abs(Math.round(diff / 60000)));
        if(this.sla.hasOwnProperty(data?.poolNameId)) {
          if(this.sla[data?.poolNameId] < mins) {
            alert = ['This request exceeded the ' + this.sla[data?.poolNameId] + ' minute limit — total time ' + mins + ' minutes.'];
            return alert;
          } 
        } else if (this.sla['default'] < mins) {
          alert = ['This request exceeded the ' + this.sla['default'] + ' minute limit — total time ' + mins + ' minutes.'];
          return alert;
        } else {
          return null;
        }
      }
    } else {
      return null;
    }
  }

  manageFilter(data) {
    if(this.applyFilterValue !== null){
      this.applyFilterValue = this.applyFilterValue + ' ';
      if(data?.length === 0) {
        this.loading = false;
        return;
      }
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      if(this.refreshDetail.lastUpdate != null && (this.refreshDetail.updateInterval > Math.floor((new Date().getTime())/1000- this.refreshDetail.lastUpdate))) {
        return
      }
      this.applyFilterValue = null;
    }
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
      this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
      this.filterForm.controls['fromDate'].setValue(this.selectedDate);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getAllRequest(this.selectedDate, false);
    } else if (this.selectedTabIndex === 1) {
      this.selectedDate = this.datepipe.transform(this.filterForm.controls['fromDate'].value, 'yyyy-MM-dd');
      this.filterForm.controls['fromDate'].setValue(this.selectedDate);
      this.filterForm.controls['fromDate'].updateValueAndValidity();
      this.getAllRequest(this.selectedDate, true);
    } else if (this.selectedTabIndex === 2) {
      this.getAllRequest(null, false);
      this.selectedData = null;
    } else if (this.selectedTabIndex === 3) {
      let dateValue = this.filterForm.controls['rdDate'].value;
      this.getAllRequestDetail(dateValue, null,null,this.name,this.pageStart,this.pageSize);    
    }
  }
  getRequestStatus() {
    this.commonService.getAppTermsLink("RQT-PO","RequestStatus").subscribe((res) => {
      this.requestStatus = res.results;
      const statusFilter = this.porterReqFilter.find(filter => filter.id === 'status');
      const phaFilter = this.pharmacyFilter.find(filter => filter.id === 'pharmacyStatus')
      this.requestStatusItems = [...this.requestStatus.map(item => item.code), 0];
      const request = [...this.requestStatus.map(item => item.code)];
      this.defaultRequest = request.filter(x => 'RQ-CO'.indexOf(x));
      if (statusFilter) {
        statusFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
        statusFilter.defaultSelected = this.defaultRequest;
        this.porterStatus = this.defaultRequest;
      }
      if(phaFilter) {
        phaFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
        phaFilter.defaultSelected = ['RQ-CO']
        this.pharmacyStatus = ['RQ-CO'];
      }
      this.filterForm.controls['allReqStatus'].patchValue(this.defaultRequest);
      this.filterForm.controls['myReqStatus'].patchValue(this.defaultRequest);
      let selectMyReq = { 'index' : 1 }
      this.tabChanged(selectMyReq)
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.selectedTabIndex === 3) {
      const filter = this.applyFilterValue;
      if (filter?.length > 2){
        this.getAllRequestDetail(this.selectedDate,null, ['RQ-CO'],this.applyFilterValue,this.pageStart,this.pageSize);
      }else if (this.applyFilterValue.length == 0){
        this.loading = true;
        this.getAllRequestDetail(this.selectedDate,null, ['RQ-CO'],this.name,this.pageStart,this.pageSize);
      }
    } else {
      const filter = this.applyFilterValue;
      if (filter.length > 2){
        this.getAllRequest(this.selectedDate,null,null,null,null,null,this.applyFilterValue,this.pageStart,this.pageSize);
      }else if (this.applyFilterValue.length == 0){
        this.loading = true;
        this.getAllRequest(this.selectedDate,null,null,null,null,null,this.name,this.pageStart,this.pageSize);
      }
    }
  }
  rowClick(row) {
    if (this.selectedData && row.requestId == this.selectedData.requestId) {
      this.selectedData = null;
      this.statusUpdate = false;
      this.showActions = this.showAction1;
    } else {
      this.selectedData = row;
      this.showActions = this.showAction2;
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
        console.log("status updated");
        this.refreshPage();
      });
  }

  getRequestById(selectedRow, selectedKey?) {
    this.commonService.getRequestById(selectedRow).subscribe(res => {
      let reqDetail = res.results[0];
      if (res.statusCode === 1) {
        if (selectedKey === 'Message') {
          this.createMessage(reqDetail);
        } else {
          this.createRequest(reqDetail);
        }
      }
    })
  }

  createRequest(data) {
    let d1 = new Date();
    let utcTimeNow = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds()).getTime()/ 1000;
    let scheduleCheck = true;
    if(this.gridLoc.hasOwnProperty('createPorterTiming')) {
      const today = new Date();
      const dayShort = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      let startTime = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming']['from'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming']['from'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
      let endTime =  new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming']['to'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming']['to'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
      
      if(this.gridLoc['createPorterTiming']?.hasOwnProperty(dayShort)) {
        console.log(dayShort)
        startTime = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming'][dayShort]['from'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming'][dayShort]['from'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
        endTime =  new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming'][dayShort]['to'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming'][dayShort]['to'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
      }
      console.log(new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds()))
      console.log(new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming']['from'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming']['from'].split(":")[1]), d1.getUTCSeconds()))
      console.log(new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.gridLoc['createPorterTiming']['to'].split(":")[0]), parseInt(this.gridLoc['createPorterTiming']['to'].split(":")[1]), d1.getUTCSeconds()))
      
      scheduleCheck = utcTimeNow - startTime > 0 && endTime - utcTimeNow > 0;
    }
    if(scheduleCheck || typeof(data) == 'object') {
    this.showActions = null;
    clearInterval(this.porterInterval);
    let version: any = PorterRequestNewComponent;
    if (this.gridLoc.hasOwnProperty('designVersion') && this.gridLoc.designVersion === 3) {
      version = RequestComponent;
    }
    const dialogRef = this.dialog.open(version, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage()
        this.selectedData = null;
    });
    } else {
      this.toastr.warning('<span style=\'font-family:Open Sans;font-size:16px;\'>' + `${this.gridLoc['createPorterTiming']['error']}` + '</span>');
    }
  }

  getPorterFloorPlan(data){
    this.reqDetail = data;
    this.reqType = 'porter';
    this.reqId = null;
    let porterReqTagList = [...this.reqDetail.nonPerformer.filter(val => val.tagAssociationTypeId != 'LOC'), ...this.reqDetail.performer.filter(val => val.status != 'RQ-AB' && val.status != 'RQ-NR' && val.status != 'RQ-RJ')];
    if(porterReqTagList.length && porterReqTagList[0]['currentLocationId']) {
      if(porterReqTagList[0]['status'] == 'RQ-AS') {
        this.reqDetail['destFloorId'] = this.reqDetail['sourceFloorId']
        this.reqDetail['destinationId'] = this.reqDetail['sourceId']
        this.reqDetail['destinationLocName'] = this.reqDetail['sourceLocName']
      }
      this.reqDetail['sourceFloorId'] = porterReqTagList[0]['floorId']
      this.reqDetail['sourceId'] = porterReqTagList[0]['currentLocationId']
      this.reqDetail['sourceLocName'] = porterReqTagList[0]['locationName']      
    }
    let details = {reqDetail: this.reqDetail, reqType: this.reqType, reqId: this.reqId}
    clearInterval(this.porterInterval);
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

  getMTeamFilterOpt(){
    this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList  = res.results;
      const genderFilter = this.mtFilter.find(f => f.id === 'porterGender')
      if(genderFilter){
        genderFilter.subFilters = this.genderList;
      }
    });
    this.commonService.getAppTermsVerion2('PoolName').subscribe(res => {
      this.userPoolList = res.results;
      const poolNameFilter = this.mtFilter.find(f => f.id === 'porterPool')
      if(poolNameFilter){
        poolNameFilter.subFilters = this.userPoolList
      }
    });
    this.commonService.getAppTermsVerion2('PoolLocation').subscribe(res => {
      this.locationPoolList = res.results;
      const poolLocFilter = this.mtFilter.find(f => f.id === 'poolLocation')
      if(poolLocFilter){
        poolLocFilter.subFilters = this.locationPoolList
      }
    });
  }
  checkUserPreference() {
    if(this.commonService.userPreference?.hasOwnProperty('porterFilters')) {
      this.updateFilters()
    } else {
      this.commonService.validateUserPreference('porterFilters');
      setTimeout(() => {
        
        this.updateFilters()
        
      }, 1000);      
    }
  }
  
  updateFilters() {
    let myRequest = this.selectedTabIndex === 1
    if (this.commonService.userPreference.hasOwnProperty('porterFilters')) {
      let preferenceData = this.commonService.userPreference.porterFilters.value;
      preferenceData = JSON.parse(preferenceData);
      this.setPorterDataValues(preferenceData);
      let filtersBy = ['status', 'group', 'location', 'porterGender', 'porterPool', 'poolLocation', 'pharmacyStatus'];
      this.filterByData(filtersBy, preferenceData);
      if (this.selectedTabIndex === 3) {
        this.getAllRequestDetail(this.selectedData);
      } else {
        this.getAllRequest(this.selectedDate, myRequest);
      }
    } else {
      this.getAllRequest(this.selectedDate, myRequest)
    }
  }

  filterByData(filtersBy, preferenceData) {
    for (let i in filtersBy) {
      let indexReq = this.porterReqFilter.findIndex(filter => filter.id === filtersBy[i]);
      let indexMT = this.mtFilter.findIndex(filter => filter.id === filtersBy[i]);
      let indexphar = this.pharmacyFilter.findIndex(filter => filter.id === filtersBy[i]);
      if (this.selectedTabIndex === 1 || this.selectedTabIndex === 0 || this.selectedTabIndex === 4) {
        this.setDefaultPorterFilter(preferenceData, filtersBy, indexReq, i);
      }
      if (this.selectedTabIndex === 2) {
        if (indexMT != -1) {
          this.mtFilter[indexMT]['defaultSelected'] = preferenceData[filtersBy[i]]?.length ? preferenceData[filtersBy[i]] : ['All'];
        }
      }
      if (this.selectedTabIndex === 3) {
        if (indexphar != -1) {
          this.pharmacyFilter[indexphar]['defaultSelected'] = preferenceData[filtersBy[i]]?.length ? preferenceData[filtersBy[i]] : ['RQ-CO'];
        }
      }
    }
  }

  setPorterDataValues(preferenceData) {
    this.porterStatus = preferenceData.status?.length ? preferenceData.status : this.defaultRequest;
    this.porterlocId = preferenceData.location?.length ? preferenceData.location : ['All'];
    this.porterGroupId = preferenceData.group?.length ? preferenceData.group : this.porterGroupDefault;
    this.selectedGender = preferenceData.porterGender?.length ? preferenceData.porterGender : ['All'];
    this.selectedPool = preferenceData.porterPool?.length ? preferenceData.porterPool : ['All'];
    this.selectedPoolLoc = preferenceData.poolLocation?.length ? preferenceData.poolLocation : ['All'];
    this.pharmacyStatus = preferenceData.pharmacyStatus?.length ? preferenceData.pharmacyStatus : ['RQ-CO'];
  }

  setDefaultPorterFilter(preferenceData, filtersBy, indexReq, i) {
    if (indexReq != -1) {
      if (filtersBy[i] === 'status') {
        this.porterReqFilter[indexReq]['defaultSelected'] = preferenceData.status?.length ? preferenceData.status : this.defaultRequest;
      } else if (filtersBy[i] === 'group') {
        this.porterReqFilter[indexReq]['defaultSelected'] = preferenceData.group?.length ? preferenceData.group : this.porterGroupDefault;
      } else {
        this.porterReqFilter[indexReq]['defaultSelected'] = preferenceData.location?.length ? preferenceData.location : ['All'];
      }
    }
  }

  mtRowFilter(event, typeFilter){
    if(typeFilter === 'gender'){
      this.selectedGender = event.value;
    } else if(typeFilter === 'porter-pool'){
      this.selectedPool = event.value;
    } else {
      this.selectedPoolLoc = event.value;
    }
    this.getAllRequest(null, false);
  }

  // ─── tw-data-table helpers ────────────────────────────────────────────────

  /** Converts the flat legacy config arrays into a typed TwColumnDef[]. */
  buildTwColumnDefs(
    displayedCols: string[],
    iconCols: string[] = [],
    sortCols: string[] = [],
    eventCols: string[] = [],
    headerIcon: string[] = [],
    timeCols: string[] = ['Time', 'Drop Time', 'Order Time', 'Delivered Time'],
    dateTimeCols: string[]= ['Assigned Time'], 
    width: string[] =  ['Porter Pool Location', 'Drop', 'Requester', 'Description', 'Pickup', 'Assigned Time', 'Location', 'Group', 'Needed', 'Current Location', 'Name', 'Schedule', 'Porter Pool / Location', 'Patient Name'],
    minWidth: string[] =  ['Porter Pool Location', 'Drop', 'Requester', 'Description', 'Pickup', 'Assigned Time', 'Location', 'Group', 'Needed', 'Current Location', 'Name', 'Schedule', 'Porter Pool / Location', 'Patient Name'],
    maxWidth: string[] =  ['Porter Pool Location', 'Drop', 'Requester', 'Description', 'Pickup', 'Assigned Time', 'Location', 'Group', 'Needed', 'Current Location', 'Name', 'Schedule', 'Porter Pool / Location', 'Patient Name'],
    truncate: string[] =  ['Porter Pool Location', 'Drop', 'Requester', 'Description', 'Pickup', 'Assigned Time', 'Location', 'Group', 'Needed', 'Current Location', 'Name', 'Schedule', 'Porter Pool / Location', 'Patient Name'],
    align: string[] = ['Location'],
    cellColorCols: Record<string, Record<string, string>> = this.selectedTabIndex === 3 ? null : this.PRGridConfig?.color
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable  = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (timeCols.includes(key)) def.type = 'time';
      if (width.includes(key)) def.width = key == 'Porter Pool / Location' ? '300px' : '150px';
      if (minWidth.includes(key)) def.minWidth = key == 'Porter Pool / Location' ? '300px' : '150px';
      if (maxWidth.includes(key)) def.maxWidth = key == 'Porter Pool / Location' ? '350px' : '180px';
      if (truncate.includes(key)) def.truncate = key === 'Porter Pool / Location'? false : true;
      if (headerIcon.includes(key)) def.headerIcon = { src: key === 'Priority' ? '/assets/Alert/common_icons/priority_high.svg' : key === 'Device' ? '/assets/Alert/common_icons/mob_coaster.svg' :'' };
      if (align.includes(key)) def.align = 'left';
      if ( this.selectedTabIndex !== 3) {
        if (cellColorCols[key]) { def.type = 'cellColor';  def.colorCellMap = cellColorCols[key]}
      }
      else if (dateTimeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  /** TwColumnDef[] for All Requests / My Requests / Pharmacy Request tabs (0, 1, 4). */
  get porterTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns1, this.iconColumn, this.sortColumn,
      ['Requester', 'Location', 'Status'],this.iconHeader
    );
  }

  /** TwColumnDef[] for Manage Team tab (2). */
  get mtTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.MTDisplayedColumns,
      ['Device', 'Name', 'Current Location', 'Break Status'],
      this.sortColumn,
      ['Schedule', 'Device', 'Current Location', 'Name'], ['Device']
    );
  }

  /** TwColumnDef[] for Pharmacy Tasks tab (3). */
  get rdTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.RDDisplayedColumns, this.RDiconColumn, this.RDsortColumn,
      [], []
    );
  }

  get porterPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  /** Convert rowColor config (from API) to a row-colour function. */
  getPorterRowColorFn(): ((row: any) => string | null) | null {
    if (!this.tableRowColor) return null;
    const cfg = this.tableRowColor;
    return (row: any) => {
      const val = row?.[cfg.field ?? cfg.key];
      return (cfg.map ?? cfg.colorMap)?.[val] ?? null;
    };
  }

  /** Adapter: cellAction → existing eventAction handler. */
  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  /** Adapter for the RD tab Ack cell button (event key must be 'rdAck'). */
  onRdAck(row: any) {
    this.eventAction({ key: 'rdAck', data: row });
  }

  /** Adapter: rowClick from tw-data-table → existing rowClick method. */
  handleRowClick(row: any) {
    this.rowClick(row);
  }

  /** Adapter: pageChange from tw-data-table → existing pagination handler. */
  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }

  /** Adapter: selectionChange (tab 3 checkboxes) → checkBoxAction. */
  onSelectionChange(selected: any[]) {
    this.checkBoxAction(selected);
  }
}
