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

import { Component, OnInit, ViewChild, Input, } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, HospitalService } from '../../../shared';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { DigitalQueueModelId } from '../ot/ot.component.model';
import { ConsumerManagementComponent } from '../../../shared/modules/entry-component/consumer-management/consumer-management.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DateAdapter } from '@angular/material/core';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';


@Component({
  selector: 'app-consumer',
  templateUrl: './consumer.component.html',
  styleUrls: ['./consumer.component.scss']
})
export class ConsumerComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public day = ['Today', 'Yesterday', 'Week'];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public floors: any[] = [];
  public floorList: any;
  public floorId = 0;
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
  public digitalQueueModelId: DigitalQueueModelId;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;

  floorForm = new FormGroup({
    assignedFloor: new FormControl()
  });

  HCDisplayedData = [
  { 'colName': 'Consumer Number', 'title': 'Consumer Number', 'dataName': 'consumerIdentifier' },
  { 'colName': 'Name', 'title': 'Name', 'dataName': 'firstName' },
  { 'colName': 'DOB', 'title': 'Date Of Birth', 'dataName': 'birthdate' },
  { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile' },
  { 'colName': 'Installation Date', 'title': 'Installation Date', 'dataName': 'installationDate' },
  { 'colName': 'GPS Location', 'title': 'GPS Location', 'dataName': 'gpsLocationCoordinate' },
  { 'colName': 'Status', 'title': 'Status', 'dataName': 'status' },
  ];
  eventColumn = ['Name','Status'];
  iconHeader = [];
  iconColumn = ['DOB','Installation Date'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  consumerDisplayedColumns = this.HCDisplayedData.map(res => res.colName);

  public hcForm: FormGroup;
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  public isClearDropdown = true;
  public assignFloorId = '';
  @ViewChild('filter') input;
  @Input() matTabindex: any;
  tableData: any;
  filterValue = null;

  constructor(public dialog: MatDialog, private readonly router: Router, public fb: FormBuilder,
    public datepipe: DatePipe, private readonly dateAdapter: DateAdapter<Date>,
    private readonly commonService: CommonService, private readonly hospitalService: HospitalService,
    private readonly route: ActivatedRoute) {
    this.digitalQueueModelId = new DigitalQueueModelId();
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate());
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.consumer.results;
    const Columns = ['consumerIdentifier','firstName','birthDate','mobile','installationDate','gpsLocationCoordinate','status'];
    for(let i=0; i<= Columns.length; i++){
      this.tableData.map(data => {
        data[this.consumerDisplayedColumns[i]] = data[Columns[i]];
      });
    }
  }

  getAllConsumerDetails(): void {
    this.commonService.getAllConsumers().subscribe((res) => {
      this.tableData = res.results;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['consumerIdentifier','firstName','birthDate','mobile','installationDate','gpsLocationCoordinate','status'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.consumerDisplayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    if (this.isClearDropdown === true) {
      this.assignFloorId = '';
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllConsumerDetails();
  }

  eventAction(event) {
    if(event.key === 'Name') {
      this.consumer(event.data);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'create') {
      this. consumer('');
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  consumer(id) {
    this.showActions = null;
    const dialogRef = this.dialog.open(ConsumerManagementComponent, {
      data: { 'id': id, 'date': this.selectedDate, 'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT' },
       panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
}
