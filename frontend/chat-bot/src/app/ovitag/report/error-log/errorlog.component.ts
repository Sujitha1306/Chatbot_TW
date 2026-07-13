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

import { Component, OnInit, ViewChild, ViewEncapsulation, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ReportService } from '../../../shared/services/report.service';
import { PdfService } from '../../../shared/services/pdf.service';
import { ExcelService } from '../../../shared/services/excel.service';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-errorlog',
  templateUrl: './errorlog.component.html',
  styleUrls: ['./errorlog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ErrorlogComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public DataSourceLog: any = [];
  pageEvent: PageEvent;
  pageSize: number = 50;
  pageStart: number = 0;
  length: number = 0;
  public operation = '';
  public exportData: any = [];
  public records = true;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;

  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedToDate = null;
  public isDateType: boolean = false;
  public parentFilter = [{
    id: 'Error Filter',
    value: 'Error Filter',
    isAll: false,
    selectionType: 'single',
    subFilters: [{ 'code': 'ALL', 'value': null }, { 'code': 'CREATE', 'value': 'CREATE' },
    { 'code': 'UPDATE', 'value': 'UPDATE' }, { 'code': 'SELECT', 'value': 'SELECT' }, { 'code': 'DELETE', 'value': 'DELETE' },
    { 'code': 'TO_EXTERNAL_POST', 'value': 'TO_EXTERNAL_POST' },
    { 'code': 'FROM_EXTERNAL_POST', 'value': 'FROM_EXTERNAL_POST' }, { 'code': 'TO_EXTERNAL_GET', 'value': 'TO_EXTERNAL_GET' },
    { 'code': 'FROM_EXTERNAL_GET', 'value': 'FROM_EXTERNAL_GET' }, { 'code': 'NOT_READABLE', 'value': 'NOT_READABLE' }],
    defaultSelected: ['OTHER'],
    showLabel: false,
  }];
  displayedColumns: string[] = ['Create Time', 'URL', 'Host', 'User Id', 'Facility Id', 'Operation', 'Application', 'Error Message', 'Component Name', 'Stack Trace', 'Additional Info'];
  columnData: string[] = ['errorTimestamp', 'url', 'host', 'userId', 'facilityId', 'operation', 'application', 'errorMessage', 'componentName', 'stackTrace', 'additionalInfo'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  eventColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['Create Time'];
  public applyFilterValue: any;
  filterValue = null;
  public isloading = false;
  public selectedId = 'audit_log';
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-ddT00:00');
  public toDate = this.datepipe.transform(new Date(), 'yyyy-MM-ddT00:00');
  chartImage: any[];
  maxHeight: any;
  constructor(public dialog: MatDialog, public toastr: AppToastService, public fb: FormBuilder, private readonly pdfService: PdfService,
    private readonly excelService: ExcelService, public datepipe: DatePipe, public reportService: ReportService) {
  }

  ngOnInit() {

    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }

    this.getAllLog(this.pageStart, this.pageSize);
  }


  headerEventAction(event) {
    if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-ddT00:00');
      this.fromDate = this.selectedDate;
      if (!!event.data) {
        this.selectedToDate = this.selectedToDate;
      } else {
        this.selectedToDate = null;
        this.toDate = this.selectedDate;
      }
      this.getAllLog(this.pageStart, this.pageSize)
    } else if (event.key === 'multiDate') {
      this.selectedToDate = !event?.data ? this.datepipe.transform(this.selectedDate, 'yyyy-MM-ddT00:00') : null;
      this.toDate = this.selectedToDate;
    } else if (event.key === 'toDateFilter') {
      this.selectedToDate = this.datepipe.transform(event.data, 'yyyy-MM-ddT00:00');
      this.toDate = this.selectedToDate;
      this.getAllLog(this.pageStart, this.pageSize)
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    }
    else {
      this.refreshPage();
    }
  }
  refreshPage() {
    this.getAllLog(this.pageStart, this.pageSize);
    this.filterValue = null;
  }

  manageGroupFilter(event) {
    if (event) {
      this.operation = event?.data[0].data;
      this.getAllLog(this.pageStart, this.pageSize)
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllLog(this.pageStart, this.pageSize);
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
  }
  getData(errorMessageLogdata, additonalInfoLogdata, stackTraceLogdata) {
    this.dialog.open(ErrorLogdataComponent, {
      data: { errorMessageLogdata, additonalInfoLogdata, stackTraceLogdata },
      panelClass: ['medium-popup'], disableClose: true
    });
  }

  getAllLog(pageStart: number, pageSize: number) {
    if (this.fromDate > this.toDate) {
      this.toastr.warning('Warning', `From date is greater than To date!`);
    }
  //   this.pageStart = (event != null) ? event.pageIndex : this.pageStart;
  //   this.pageSize = (event != null) ? event.pageSize : 10;
  //   this.reportService.getErrorLogReport(this.fromDate, this.toDate, this.operation, this.pageStart, this.pageSize).subscribe((res) => {
  //     const data = res.results;
  //     this.exportData = res.results;
  //     this.DataSourceLog = new MatTableDataSource<any>(data);
  //     this.length = res.totalRecords;
  //     if (res.statusCode === 1) {
  //       this.records = false;
  //     } else {
  //       this.records = true;
  //     }
  //     this.DataSourceLog.sort = this.sort;
  //   });
  //   return event;
  // }
   this.isloading = true;
    this.reportService.getErrorLogReport(this.fromDate, this.toDate, this.operation, pageStart, pageSize).subscribe(res => {
      this.DataSourceLog = res.results;
      this.length = res.totalRecords
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      for (let i = 0; i <= this.columnData.length; i++) {
        this.DataSourceLog.map(data => {
          data[this.displayedColumns[i]] = data[this.columnData[i]];
        });
      }
       this.isloading = false;
    });
  }

  downloadExcel() {
    const name = 'error_log';
    const transpose = false;
    this.excelService.exportAsExcelFile(this.exportData, name, transpose, this.fromDate, this.toDate);
  }

  downloadPDF() {
    const name = 'error_log';
    this.chartImage = [];
    const Columns = ['userId', 'facilityId', 'operation', 'application', 'errorMessage',
      'componentName', 'stackTrace', 'additionalInfo', 'errorTimestamp', 'url', 'host'];
    this.pdfService.exportAsPdfFile(this.exportData, Columns, name, this.fromDate, this.toDate, this.chartImage);
  }
  fixClick() {
    console.log('')
  }
}
@Component({
  selector: 'app-error-logdata',
  templateUrl: './error-logdata.component.html',
  styleUrls: ['./errorlog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ErrorLogdataComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ErrorLogdataComponent>, public dialog: MatDialog) { }
  copyErrorMessage(message) {
    const el = document.createElement('textarea');
    el.value = message;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  fixClick() {
    console.log('')
  }
}
