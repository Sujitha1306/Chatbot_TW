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
import { Subscription } from "rxjs";
import { WorkflowService, CommonService, HospitalService } from "../../../shared";
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
import { GoogleMapComponent, GoogleMapMarkerComponent } from "../../../shared/modules/entry-component/google-map/google-map.component";
import { CoasterComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";


@Component({
  selector: 'app-linen-tracking',
  templateUrl: './linen-tracking.component.html',
  styleUrls: ['./linen-tracking.component.scss'],
  animations: [routerTransition()],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class LinenTrackingComponent implements  OnDestroy {
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
  public TabColumns  = {
    'Manage Linen' : ['Tag ID', 'Linen ID', 'Linen Type', 'Size', 'Color', 'Material', 'Owned Department', 'Date of Procurement', 'First Use Date', 'Total Wash Count', 'Last Wash Date', 'Status', 'Current Location', 'Used By'],
    'Storage' : ['Tag ID', 'Linen ID', 'Linen Type', 'Owned Department', 'Total Wash Count', 'Last Wash Date', 'Status', 'Storage Location', 'Storage Date', 'Batch No'],
    'Distribution' : ['Tag ID', 'Linen ID', 'Linen Type', 'Owned Department', 'Total Wash Count', 'Last Wash Date', 'Status', 'Assgned Department'],
    'Collection' : ['Tag ID', 'Linen ID', 'Linen Type', 'Owned Department', 'Total Wash Count', 'Last Wash Date', 'Status', 'Current Location', 'Used By', 'Collected DateTime', 'Collected By'],
    'Laundary' : ['Tag ID', 'Linen ID', 'Linen Type', 'Owned Department', 'Total Wash Count', 'Last Wash Date', 'Status', 'Used By',  'Laundary type', 'Batch No', 'Batach Start datetime', 'Batch End datetime', 'Performed By']    
  }
  MTDisplayedColumns: string[] = this.TabColumns['Manage Linen'];
  public TabDetails  = ['Manage Linen', 'Storage', 'Distribution', 'Collection', 'Laundary'];
  displayedColumns1: string[] = [];
  iconHeader = ["ID", 'Associate Driver'];
  iconColumn: any = [];
  sortColumn: any = [];
  permissionControl = ["BT_ALLE"];
  eventColumn: any = [];
  dateTimeColumns =['Date of Procurement', 'First Use Date','Last Wash Date','Storage Date','Collected DateTime','Batach Start datetime', 'Batch End datetime']
  dataSource = new MatTableDataSource();
  filterForm = new FormGroup({
    allReqStatus: new FormControl(),
    myReqStatus: new FormControl(),
    fromDate: new FormControl(),
    toDate: new FormControl(),
    locationId: new FormControl(),
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

  public selectFilter: any = [{ id: "assetcategorytype", value: "ASSET CATEGORY TYPE" }];
  public selectTypeFilter: any = [{ id: "assettype", value: "ASSET TYPE" }]
  public rowTypeFilter: any = [];
  public rowFilter: any = [];
  public current_Location = false;
  public activate_btn: any = [];
  public requestStatus: any[] = [];
  isDisabledContent: boolean;
  nav_position = "end";
  statusUpdate = false;
  selectedData: any;
  selectedDataIndex = 0;
  today = new Date();
  public porterDetails: any;
  public reqDetail: any;
  public reqType= '';
  public reqId:any = null;
  public applyFilterValue: any;
  public isAutoRefresh = false;
  maxHeight: number;
  height: number;
  width: number;
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedTabIndex = 0;
  pageSize: any;
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

  constructor(
    private readonly dialog: MatDialog,
    private readonly workflowService: WorkflowService,
    public hospitalService: HospitalService,
    private readonly sidenav: ElementRef,
    public commonService: CommonService,
    private readonly route: ActivatedRoute,
    public datepipe: DatePipe
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    this.getPermissionDropDown();
    this.getDynamicTableColumn();
    this.filterForm.controls['fromDate'].setValue(this.selectedDate);
    this.filterForm.controls['fromDate'].updateValueAndValidity();
    this.filterForm.controls['locationId'].setValue('All');
    this.filterForm.controls['locationId'].updateValueAndValidity();
  }


  getAllLinen(tab) {
    let statusTab = null;
    if(tab == 'Manage Linen') {
      statusTab = null;
    } else if(tab == 'Storage') {
      statusTab = 'ATS-ST';
    } else if(tab == 'Distribution') {
      statusTab = 'ATS-DIS';
    } else if (tab == 'Collection') {
      statusTab = 'ATS-COL';
    } else {
      statusTab = 'ATS-ILUN';
    }
    let category = 'ASC-LINN';
    let status = statusTab;
    let pageStart = null;
    let pagesize = null;
    this.commonService.getAllLinen(category, status, pageStart, pagesize).subscribe((res) => {
      this.tableData = res.results;
      this.MTDisplayedColumns = this.TabColumns[tab];
      this.loading = false;
      const ColumnsDetails =  {
        'Manage Linen' : ['tagId', 'linenId', 'linenTypeName', 'size', 'color', 'materialTypeName', 'ownedDepartmentName', 'procurementDate', 'firstUseDate', 'cycleCount', 'cycleDate', 'statusName', 'locationName', 'usedByName'],
        'Storage' : ['tagId', 'linenId', 'linenTypeName', 'ownedDepartmentName', 'cycleCount', 'cycleDate', 'statusName', 'storageAreaTypeName', 'storageDate', 'batchNo'],
        'Distribution' : ['tagId', 'linenId', 'linenTypeName', 'ownedDepartmentName', 'cycleCount', 'cycleDate', 'statusName', 'assignedDepartmentName'],
        'Collection' : ['tagId', 'linenId', 'linenTypeName', 'ownedDepartmentName', 'cycleCount', 'cycleDate', 'statusName',  'locationName', 'usedByName', 'collectionDateTime', 'collectedByName'],
        'Laundary' : ['tagId', 'linenId', 'linenTypeName', 'ownedDepartmentName', 'cycleCount', 'cycleDate', 'statusName',  'usedByName', 'laundryTypeName', 'batchNo', 'batchStartDateTime', 'batchEndDateTime', 'performedByName'],
      }
      const Columns = ColumnsDetails[tab]
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.MTDisplayedColumns[i]] = data[Columns[i]];
          }
        );
      }
    });

  }
  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission.dropdown;
    const createAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAB" && x.code.substring(0, 5) === 'DD_AB');
    for (const action of createAction) {
      this.showAction1.push({ id: action.code, value: action.name });
    }
    const modifyAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAB" && x.code.substring(0, 7) === 'DD_MDAB');
    for (const action of modifyAction) {
      this.showAction2.push({ id: action.code, value: action.name });
    }
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
      if(dynamicColumns.pageSize && dynamicColumns.pageSize !== null) {
        this.pageSize = dynamicColumns.pageSize;
      } else {
        this.pageSize = 50;
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.porterInterval);
  }

  headerEventAction(event){
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if(event.data == 'DD_ABCR'){
      if(this.selectedTabIndex === 1) {
        this.showMap = false;
      }
      this.createRequest([]);
    } else if(event.data == 'DD_MDABR') {
      this.createRequest(this.selectedData);
    } else if(event.data == 'recreate'){
      this.createRequest(this.selectedData, 'RQ-RCR');
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  eventAction(event) {
    if(event.data == 'create' || event.data == 'DD_ABCR'){
      this.createRequest([]);
    } else if(event.key == 'Requester' || event.key == 'Ambulance Name' || event.key == 'Patient Name'){
      this.createRequest(event.data);
    } else if(event.key == 'Status'){
      this.getPorterHistory(event.data);
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
    } else if(['Associate Driver','Asset Name', 'assetAlertCount', 'readerAlertCount'].includes(event.key)){
      event.data['selectedTabIndex'] = 0;
      this.assignDriver(event.data);
    }
  }

  changeDate(dateType) {
    if (dateType== 'previous') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() - 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
    } else if (dateType== 'next') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() + 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
    }
    let dateValue = this.filterForm.controls['fromDate'].value
    this.getAllRequest(dateValue, false);
  }

  assignDriver(data) {
    data['associateAction'] = 'linen-track';
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

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.showMap = false;
    this.selectedData = null;
    this.showActions = this.showAction1;
    this.loading = true;
    this.selectedTabIndex = tabChangeEvent.index;
    let tab = this.TabDetails[this.selectedTabIndex];
    this.getAllLinen(tab)
  }

  onLocationChange(value) {
    this.loading = true;
    if (value === 'All') {
      value = '';
    }
    this.filterForm.controls['locationId'].setValue(this.filterForm.controls['locationId'].value);
    this.filterForm.controls['locationId'].updateValueAndValidity();
    this.getAllRequest(null, false, false, null, value);
  }

  onStatusChange(value) {
    this.loading = true;
    this.getAllRequest(null, false, false, value);
  }

  checkInterval() {
  this.porterInterval = setInterval(val => this.getAllRequest(null, false), environment.base_value.set_interval);
  }

  getAllRequest(dateFilter, isCurrentUser ?: boolean, routerEvent?: boolean, status?: string, locId?: string): void {
    this.loading = true;
    if (this.filterForm.controls['locationId'].value !== 'All') {
      locId = this.filterForm.controls['locationId'].value;
      this.filterForm.controls['locationId'].setValue(this.filterForm.controls['locationId'].value);
    } else {
      locId = '';
      this.filterForm.controls['locationId'].setValue('All');
    }
    this.filterForm.controls['locationId'].updateValueAndValidity();
    if (dateFilter !== null) {
      if (this.datepipe.transform(this.today, 'yyyy-MM-dd') !== this.datepipe.transform(new Date(), 'yyyy-MM-dd')) {
        this.today = new Date();
        this.currentDate = new Date();
        this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      } else {
        this.selectedDate = this.datepipe.transform(dateFilter, 'yyyy-MM-dd');
      }
      this.filterForm.controls['fromDate'].setValue(this.datepipe.transform(this.selectedDate, 'yyyy-MM-dd'));
      this.filterForm.controls['fromDate'].updateValueAndValidity();
    } else {
      this.selectedDate = null;
    }
    if (status === undefined) {
      status = null;
    }
    if (this.selectedTabIndex === 0 || this.selectedTabIndex === 1 || this.selectedTabIndex === 2 || this.selectedTabIndex === 3 || this.selectedTabIndex === 4) {
      this.commonService.getAllAmbulance().subscribe((res) => {
        this.tableData = res.results;
        this.loading = false;
        const Columns = ['assetSerialNumber', 'name', 'assetAlertCount', 'pilotName', 'mobileNo', 'tagId'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.MTDisplayedColumns[i]] = data[Columns[i]];
          });
        }
      });
    } else {
      this.commonService.validateUserPreference('ambStatusFilter',  JSON.stringify(status));
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showMap = false;
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    let tab = this.TabDetails[this.selectedDataIndex];
    this.getAllLinen(tab)
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
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
      this.commonService.getGeoLocation(value.performer[0].tagId).subscribe(res => {
        if(res.results.data.length !== 0) {
          this.latLng = res.results.data;
          this.geo = this.latLng[0];
          this.googleMapWayPoints = this.geo.lat + ',' + this.geo.lng;
        }
        this.getMap(value);
      });
    }
  }
  getMap(value?) {
    clearInterval(this.porterInterval);
      let data = {"googleDirectioAPI" : this.googleDirectionAPI, origin: this.googleMapOrigin, destination: this.googleMapDestination, waypoints: this.googleMapWayPoints, tagId: this.tagId, 
      reqStatus : value.status, reqDetail : value};
      const dialogRef = this.dialog.open(GoogleMapMarkerComponent,{
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
}
