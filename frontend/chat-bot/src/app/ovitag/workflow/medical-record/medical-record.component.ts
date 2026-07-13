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
import { AfterViewInit, Component, OnInit, ViewChild, } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { MatTabGroup } from "@angular/material/tabs";
import { FormGroup, FormBuilder,} from "@angular/forms";
import { CommonService, WorkflowService } from "../../../shared";
import { ActivatedRoute } from "@angular/router";
import { MedicalRecordDispatchComponent } from "../../../shared/modules/entry-component/medical-record-dispatch/medical-record-dispatch.component";
import { EnrollRegisterPatientComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { DatePipe } from "@angular/common";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../../../app.module";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";


@Component({
  selector: "app-medical-record",
  templateUrl: "./medical-record.component.html",
  styleUrls: ["./medical-record.component.scss"],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class MedicalRecordComponent implements OnInit, AfterViewInit {
  public matcher = new ErrorStateMatcherService();
  displayedColumns: string[] = [
    "ID", 
    "Status",
    "UHID",
    "Name",
    "Volume",
    "Tag ID",
    "Department Name",
    "Current Location", 
    "Request ID",
    "Request Detail ID",
    "Requested Doctor",
    "Requested Volume",
    "Requested By",
    "Delivery Location",
    "Requested Date",
    "Dispatched Date",
    "Received Date",
    "File Age",
    "Reason",
    "Comments"
  ];
  iconHeader = ["ID"];
  iconColumn = ["ID", "Current Location", "Requested Date", "Dispatched Date", "Received Date"];
  sortColumn = ["ID"];
  dateColumns = ["Dispatched Date", "Received Date"]
  permissionControl = ["BT_ALLE"];
  eventColumn = ["Status", "Current Location"];

  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public cols: any;
  public selectedView = "table";
  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: "create", value: "Create Request" },
  ];
  showAction2 = [
    { id: "create", value: "Create Request" },
    { id: "modify", value: "Modify" }
  ];
  today = new Date();
  public selectDropdown = null;
  public rowFilter: any;
  mrType = [
    {id: 'MR-REQ', name: 'Requested'},
    {id: 'MR-DIS', name: 'Dispatched'},
    {id: 'MR-CAN', name: 'Cancelled'},
  ];
  public selectFilter = [{id: 'type', value: 'STATUS'}];
  public locationId = 'MR-REQ';
  public medicalRecordForm: FormGroup;
  public currentDate = new Date();
  
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public requestStatus = 'MR-REQ';
  public requestDetailStatus = null;
  tableData: any;
  height: number;
  showActions = this.showAction1;
  pageEvent: PageEvent;
  length: any;
  pageIndex: any;

  public pageStart = 0;
  public pageSize = 50;
  public paginationEvent: any;
  loading = false;
  width: number;
  public parentFilter = [
    {
      id: 'status',
      value: 'Status',
      isNoneAll: 'All',
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['MR-REQ']
    }
  ];
  medicalAppteam: any;
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;

  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public datepipe: DatePipe,
    public commonService: CommonService,
    private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
  }

  ngOnInit() {
    this.getStatusFilter();
    this.height = window.innerHeight - 170;
    this.searchLoc('type');
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.TabChange(event);
    });
    this.getMedicalRecordList(this.requestStatus, null, this.selectedDate, null, true);

  }
  getStatusFilter(){
    this.commonService.getAppTerms('MRRequestStatus').subscribe(res => {
      this.medicalAppteam = res.results; 
      const StatusTypeFilter = this.parentFilter.find(filter => filter.id === 'status');
      if (StatusTypeFilter) {
        const statusFilter = res.results.filter(x => x.code !== 'MR-REC')
        StatusTypeFilter.subFilters = statusFilter.map(({ code, value }) => ({ code, value }));
      }
    });
  }

  onWindowResizedWidth(size) {
    if(size > 1920) {
      this.width = size - 130;
    } else {
      this.width = size - 100;
    }
  }



  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  refreshPage() {
    if (this.selectedTab === 'MR History') {
      this.requestStatus = null;
    } else if (this.requestStatus === null && this.requestDetailStatus === 'MR-DIS') {
      this.requestStatus = null;
      this.requestDetailStatus = 'MR-DIS';
    } else {
      const code = 'MR-REQ';
      if (this.requestStatus === code) {
        this.requestStatus = code;
      } else if (this.requestStatus === 'MR-CAN') {
        this.requestStatus = 'MR-CAN';
      } else if (this.requestStatus === 'MR-DIS') {
        this.requestStatus = 'MR-DIS';
      } else {
        this.requestStatus = 'MR-REQ, MR-CAN';
      }
    }
    this.selectedName = null;
    this.showActions = this.showAction1;
    this.selectDropdown = null;
    this.getMedicalRecordList(this.requestStatus, this.requestDetailStatus);
  }
  rowClick(data) {
    if (this.selectedName && data.mrRequestId == this.selectedName.mrRequestId) {
      this.selectedName = null;
      this.showActions = this.showAction1;
      this.selectDropdown = null;
    } else {
      this.selectedName = data;
      this.showActions = this.showAction2;
    }
  }

  manageAction(value, data) {
    if (value === 'create') {
      this.registerPatient(null);
    } else if (value === 'modify') {
      const data = this.selectedName;
      data["status"] = "Request";
      this.getDispatch(data);
    }
  }

  searchLoc(id) {
    if(id === 'type'){
      this.rowFilter = this.mrType;
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.loading = true;
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      if (this.selectedTab === 'MR History') {
        this.requestStatus = null;
      } else {
        const code = 'MR-REQ';
        if(this.requestStatus !== null) {
          this.requestStatus = code;
        }
      }
      this.getMedicalRecordList(this.requestStatus, this.requestDetailStatus, this.selectedDate);
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'groupFilter') {
      this.loading = true;
      const statusFilter = event.data[0].data;
      this.manageWorklist(statusFilter);
      this.saveUserPreference(statusFilter);
    } else if(event.key === 'manageFilter') {
      this.searchLoc(event.data);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  eventAction(event) {
    if (event.key === 'Status') {
      this.getDispatch(event.data);
    }
    if (event.key === 'pagination') {
      this.onPaginateChange(event.data);
    }
  }
  saveUserPreference(status) {
    let preferenceData = null;
    let key = null;
    if(this.selectedTab === 'MR Requests') {
      key = 'MRRequestStatus';
      preferenceData = {
      "status": status
    };
    } else if(this.selectedTab === 'MR History') {
      key = 'MRHistoryStatus';
      preferenceData = {
        "status": status
      }
    }
    let lastData = JSON.stringify(preferenceData);
    this.commonService.validateUserPreference(key, lastData)
  }
  manageWorklist(status) {
    this.locationId = status;
    if (status === 'MR-REQ') {
      this.requestDetailStatus = null;
      this.requestStatus = status;
    } else if (status === 'MR-CAN') {
      this.requestDetailStatus = null;
      this.requestStatus = status;
    } else if (status === 'MR-DIS') {
      if (this.selectedTab === 'MR History') {
        this.selectedDate = null;
      }
      this.requestDetailStatus = status;
      this.requestStatus = null;
    } else if (status === 'MR-REC') {
      this.selectedDate = this.statusBasedDate();
      this.requestDetailStatus = status;
      this.requestStatus = null;
    } else if (this.selectedTab === 'MR History' && status === 'All'){
      this.selectedDate = this.statusBasedDate();
      this.requestStatus = 'MR-REQ, MR-CAN';
      this.requestDetailStatus = 'MR-DIS';
    } else {
      this.requestStatus = 'MR-REQ, MR-CAN';
      this.requestDetailStatus = 'MR-DIS';
    }
    this.getMedicalRecordList(this.requestStatus, this.requestDetailStatus);
  }

  statusBasedDate() {
    if(this.selectedTab === 'MR History') {
      if (this.selectedDate === null){
        const selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
        return selectedDate;
      } else {
        const selectedDate = this.datepipe.transform(this.selectedDate,'yyyy-MM-dd');
        return selectedDate;
      }
    }
  }

  onPaginateChange(event) {
    if (this.selectedTab === 'MR History') {
      this.requestStatus = null;
    } else {
      this.requestStatus = 'MR-REQ';
    }
    this.getMedicalRecordList(this.requestStatus, this.requestDetailStatus, null, event);
  }

  ngAfterViewInit() {
    let label = 'MR Requests';
    const tabNames = this.tabGroup._tabs.toArray();
    const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
    if (index >= 0) {
      this.selectedIndex = index;
      this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
    }
  }

  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
  }

  TabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.loading = true;
    this.tableData = [];
    if (this.selectedTab === 'MR Requests') {
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      this.checkUserPreference('MRRequestStatus');
    } else if (this.selectedTab === 'MR History') {
      this.checkUserPreference('MRHistoryStatus')
    } else {
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      this.rowFilter = [];
      this.locationId = null;
      this.requestDetailStatus = 'MR-REC';
      this.getMedicalRecordList(null, this.requestDetailStatus, this.selectedDate);
    }
  }

  checkUserPreference(key) {
    if(this.commonService.userPreference?.hasOwnProperty(key)) {
      this.updateFilters(key);
    } else {
      this.commonService.validateUserPreference(key);
      setTimeout(() => {
        
        this.updateFilters(key);
        
      }, 1000);      
    }
  }

  updateFilters(key) {
    if (this.commonService.userPreference.hasOwnProperty(key)) {
      let preferenceData = this.commonService.userPreference[key].value;
      preferenceData = JSON.parse(preferenceData);
      if(this.selectedTab === 'MR Requests') {
        this.parentFilter = [
          {
            id: 'status',
            value: 'Status',
            isNoneAll: 'All',
            selectionType: 'single',
            subFilters: [],
            defaultSelected: [preferenceData?.status]
          }
        ];
        this.getStatusFilter();
        this.manageWorklist(preferenceData?.status);
      } else if( this.selectedTab === 'MR History') {
        this.parentFilter = [
          {
            id: 'status',
            value: 'Status',
            isNoneAll: 'false',
            selectionType: 'single',
            subFilters: [],
            defaultSelected: [preferenceData?.status]
          }
        ];
        const historyData = this.parentFilter.find( res => res.id === 'status');
        if(historyData) {
          const historyFilter = this.medicalAppteam.filter(x => x.code !== 'MR-CAN' && x.code !== 'MR-REQ');
          historyData.subFilters = historyFilter.map(({code, value}) => ({code, value}));
        }
        this.manageWorklist(preferenceData?.status);
      }
    } else {
      if(this.selectedTab === 'MR Requests') {
        this.parentFilter = [
          {
            id: 'status',
            value: 'Status',
            isNoneAll: 'All',
            selectionType: 'single',
            subFilters: [],
            defaultSelected: ['MR-REQ']
          }
        ];
        this.getStatusFilter();
        this.requestDetailStatus = null;
        this.requestStatus = 'MR-REQ';
        this.locationId = 'MR-REQ';
        this.getMedicalRecordList(this.requestStatus, this.requestDetailStatus);
      } else if( this.selectedTab === 'MR History') {
        this.parentFilter = [
          {
            id: 'status',
            value: 'Status',
            isNoneAll: 'false',
            selectionType: 'single',
            subFilters: [],
            defaultSelected: ['MR-REC']
          }
        ];
        const historyData = this.parentFilter.find( res => res.id === 'status');
        if(historyData) {
          const historyFilter = this.medicalAppteam.filter(x => x.code !== 'MR-CAN' && x.code !== 'MR-REQ');
          historyData.subFilters = historyFilter.map(({code, value}) => ({code, value}));
        }
        this.locationId = null; 
        this.requestDetailStatus = 'MR-REC';
        this.getMedicalRecordList(null, this.requestDetailStatus, this.selectedDate);
      }
    }
  }

  getDispatch(data) {
    const dialogRef = this.dialog.open(MedicalRecordDispatchComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedName = null;
      this.refreshPage();
    });
  }
  registerPatient(id) {
    this.showActions = null;
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-IP', 'visitType': 'VT-MR', 'filterMRDate': this.selectedDate },
        panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
      this.refreshPage();
    });
  }

  getMedicalRecordList(requestStatus?: string, requestDetailStatus?: string, dateValue?: string, event?: any, routerEvent?: boolean): void {
    this.selectedName = null;
    this.pageStart = null;
    this.pageSize = null;
    if (dateValue != null) {
      this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    }
    if (routerEvent) {
      
      this.tableData = this.route.snapshot.data.medicalrecord.results;
      const Columns = [
        "id", 
        "reqDetailStatusName",
        "mainIdentifier",
        "patientName",
        "volume",
        "tagId",
        "departmentName",
        "currentLocationId",
        "mrRequestId",
        "mrRequestDetailId",
        "requestedDoctor",
        "srcPatientFileId",
        "requestedBy",
        "deliveryLocation",
        "requestedDate",
        "startDatetime",
        "endDatetime",
        "fileAge",
        "reason",
        "comments"
      ];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
          
        });
      }
      this.paginationEvent = {previousPageIndex: 0, pageIndex: 0, pageSize: this.route.snapshot.data.medicalrecord.pageSize, length: this.route.snapshot.data.medicalrecord.totalRecords};
    } else {
      if (requestStatus === null || requestStatus === 'All') {
        requestStatus = null;
        requestDetailStatus = this.requestDetailStatus;
      }
      this.workflowService.getMedicalRecordList(requestStatus, requestDetailStatus, this.selectedDate, this.pageStart, this.pageSize)
      .subscribe((res) => {
        this.tableData = res.results;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        this.loading = false;
        const Columns = [
          "id",
          "reqDetailStatusName",
          "mainIdentifier",
          "patientName",
          "volume",
          "tagId",
          "departmentName",
          "currentLocationId",
          "mrRequestId",
          "mrRequestDetailId",
          "requestedDoctor",
          "srcPatientFileId",
          "requestedBy",
          "deliveryLocation",
          "requestedDate",
          "startDatetime",
          "endDatetime",
          "fileAge",
          "reason",
          "comments"
        ];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[Columns[i]];
            
          });
        }
        this.paginationEvent = {previousPageIndex: 0, pageIndex: 0, pageSize: res.pageSize, length: res.totalRecords};
      });
    }
  }
}
