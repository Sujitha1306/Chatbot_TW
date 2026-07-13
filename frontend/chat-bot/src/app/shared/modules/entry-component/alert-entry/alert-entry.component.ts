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
import { Component, OnInit,  ViewChild, Inject, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import {  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DashboardService } from '../../../services/dashboard.service';
import { CommonService } from './../../../../shared/services/common.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';


@Component({
  selector: 'app-entry-alert',
  templateUrl: './alert-entry.component.html',
  styleUrls: ['./alert-entry.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AlertEntryComponent implements OnInit {

  displayedColumns: string[] = ['Type', 'message', 'Time'];

  displayedData = [
    { 'colName': 'Type', 'title': 'Type', 'dataName': 'pfAlertConfigName' },
    { 'colName': 'message', 'title': 'Message', 'dataName': 'message' },
    { 'colName': 'Time', 'title': 'Time', 'dataName': 'alertDatetime' }
  ];
  dataSource: MatTableDataSource<any>;
  pipe: DatePipe;

  pageEvent: PageEvent;
  length: any;
  pageIndex: any;

  public pageStart = 0;
  public pageSize = 10;
  public from_date;
  public to_date;
  public maxHeight: any;
  public picupPatientId = {};
  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public filtervalue: string;
  public ruleType: any[] = [];
  public alertDetails: any;
  public alertDetails1: any;
  public alertData: any;
  public filterKey = null;
  public alertType = 'All';
  public alertFilterForm: FormGroup;
  public height: number;

  isDisabledContent: boolean;
  today = new Date();

  filterForm = new FormGroup({
    ruleType: new FormControl(),
    fromDate: new FormControl(),
    toDate: new FormControl(),
  });

  @Output()
  dateChange: EventEmitter<MatDatepickerInputEvent<any>>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private readonly dashboardService: DashboardService,
    public datepipe: DatePipe, public commonService: CommonService,
    public thisDialogRef: MatDialogRef<AlertEntryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fb: FormBuilder) {
    this.alertData = data;
  }

  get ruleTypeId() {
    return this.filterForm.get('ruleType').value;
  }
  get fromDate() { return this.filterForm.get('fromDate').value; }
  get toDate() { return this.filterForm.get('toDate').value; }

  ngOnInit() {
    this.getAllAlert();
    this.getRuleType();
    this.alertFilterForm = this.fb.group({
      alertType: [this.alertType ? this.alertType : null]
    });

  }

  onWindowResized(size) {
    this.height = size;
  }

  showToDate(event) {
    this.isDisabledContent = true;
  }

  filterData(event) {
    this.filterByTypeandDate();
  }

  public getAllAlert(event?: PageEvent) {
    this.pageStart = (event != null) ? event.pageIndex : this.pageStart;
    this.pageSize = (event != null) ? event.pageSize : 10;
    this.dataSource = new MatTableDataSource<any>(this.alertData);
    this.length = this.alertData.length;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    return event;
  }
  public filterByTypeandDate() {
    this.from_date = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
    this.to_date = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');

    this.dashboardService.filterByTypeandDate(this.from_date, this.to_date, this.ruleTypeId).subscribe(res => {
      this.dataSource = new MatTableDataSource<any>(res.results);
      this.length = res.totalRecords;
      this.dataSource.sort = this.sort;
    });
  }


  valueChanged() {
    if (new Date(this.filterForm.value.fromDate) < new Date(this.filterForm.value.toDate)) {
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }


  typeFilter(value) {
    this.filterKey = value;
    if (this.filterKey === "All") {
      this.alertDetails1 = this.alertData;
      
    } else{    
      this.alertDetails1 = this.alertData.filter(resFilter => resFilter.ruleTypeId === value);
    }
    this.dataSource.data = this.alertDetails1 ;
    this.dataSource.sort = this.sort;
    const length = this.length;
    this.length = length;
    this.dataSource.paginator = this.paginator;
  }

  getRuleType() {
    this.commonService.getAppTerms('RuleType').subscribe(res => {
      this.ruleType = res.results;
    });
  }

  popupClose() {
    this.thisDialogRef.close();
  }
  fixClick() {
    console.log('')
  }
}
