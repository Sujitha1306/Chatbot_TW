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

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, ExcelService } from '../../../shared';
import { KynMediaReportsComponent } from './kyn-media-reports/kyn-media-reports.component';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../../app.module';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-review-post',
  templateUrl: './review-post.component.html',
  styleUrls: ['./review-post.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ReviewPostComponent implements OnInit {

  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: 'post', value: 'Post' },
    { id: 'notices', value: 'Notices' },
    { id: 'video', value: 'TeleKast' },
    { id: 'shorts', value: 'Klips' }
  ];
  public showActions = this.showAction1;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public selectFilter = [{ id: 'filter', value: 'FILTER' }];
  isOpen = false;
  selectedTabIndex = 1


  displayedData = [
    { 'colName': 'sourceThumbnailUrl', 'title': 'Content', 'dataName': 'sourceThumbnailUrl' },
    { 'colName': 'updatedAt', 'title': 'Modified Date', 'dataName': 'updatedAt' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
    { 'colName': 'reports', 'title': 'Total Reports', 'dataName': 'reports' },
  ];
  displayedPostData = [
    { 'colName': 'sourceUrl', 'title': 'Content', 'dataName': 'sourceUrl' },
    { 'colName': 'updatedAt', 'title': 'Modified Date', 'dataName': 'updatedAt' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
    { 'colName': 'reports', 'title': 'Total Reports', 'dataName': 'reports' },
  ]
  displayedUserData = [
    { 'colName': 'reportedName', 'title': 'Reported Name', 'dataName': 'reportedName' },
    { 'colName': 'name', 'title': 'User Name', 'dataName': 'name' },
    { 'colName': 'reportedAt', 'title': 'Reported At', 'dataName': 'reportedAt' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
    { 'colName': 'reports', 'title': 'Total Reports', 'dataName': 'reports' },
  ]
  byDisplayedData = [
    { 'colName': 'sourceThumbnailUrl', 'title': 'Content', 'dataName': 'sourceThumbnailUrl' },
    { 'colName': 'reportedName', 'title': 'Reported User Name', 'dataName': 'reportedName' },
    { 'colName': 'reportedAt', 'title': 'Reported At', 'dataName': 'reportedAt' },
    { 'colName': 'reportReasonValue', 'title': 'Report Reason', 'dataName': 'reportReasonValue' },
    { 'colName': 'reportedStatus', 'title': 'Reported Status', 'dataName': 'reportedStatus' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
  ];
  byDisplayedPostData = [
    { 'colName': 'sourceInfoThumbnail', 'title': 'Content', 'dataName': 'sourceInfoThumbnail' },
    { 'colName': 'reportedName', 'title': 'Reported User Name', 'dataName': 'reportedName' },
    { 'colName': 'reportedAt', 'title': 'Reported At', 'dataName': 'reportedAt' },
    { 'colName': 'reportReasonValue', 'title': 'Report Reason', 'dataName': 'reportReasonValue' },
    { 'colName': 'reportedStatus', 'title': 'Reported Status', 'dataName': 'reportedStatus' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
  ]
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  displayedColumnsPost: string[] = this.displayedPostData.map(res => res.colName);
  displayedColumnsUser: string[] = this.displayedUserData.map(res => res.colName);
  byDisplayedColumns: string[] = this.byDisplayedData.map(res => res.colName);
  byDisplayedColumnsPost: string[] = this.byDisplayedPostData.map(res => res.colName);
  dataSource: MatTableDataSource<any>;
  reportDataSource: MatTableDataSource<any>;
  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  filterValue = null;
  rowFilter: any = [];
  selectedType: any = 'shorts';
  reviewReports = {
    'arrayList': [],
    'sheetList': []
  };
  passingdata: any;
  selectedFrom = this.selectedDate;
  selectedTo = this.selectedDate;
  selectedStart = this.selectedDate;
  selectedEnd = this.selectedDate;
  pageLength = null;
  pageStart2 = 0;
  pageSize2 = 10;
  length2 = 0;
  defaultImg = '../../../../assets/Alert/common_icons/default img.png'
  pageTriger: boolean = false;
  
  constructor(public commonService: CommonService, public ExcelService: ExcelService, public dialog: MatDialog,
    public datepipe: DatePipe, public toastr: AppToastService) { }

  ngOnInit() {
    this.searchLoc();
    this.getAllReports()
  }

  viewReport(data, key) {
    let event = { 'type': this.selectedType, 'reportData': data, 'preview': key }
    const dialogRef = this.dialog.open(KynMediaReportsComponent,
      { data: event, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => { });
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2)
  }

  typeFilter(typeFilter) {
    console.log(typeFilter)
    this.dataSource.filter = typeFilter;
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === "manageAction") {
      this.selectedType = event.data;
      if(this.selectedTabIndex == 0) {
        this.manageWorklist(event.data, this.selectedFrom, this.selectedTo);
      } else{
        this.reportData(event.data, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2);
      }
    } else if (event.key === "manageWorklist") {
      this.typeFilter(event.data);
    } else if (event.key === "downloadExcel") {
      this.getExcelDetails();
    } else {
      this.refreshPage()
    }
  }

  tabClick(event) {
    this.selectedTabIndex = event.index
  }

  reportDateAction(type, event) {
    if (type === 'fromDate') {
      this.selectedFrom = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.manageWorklist(this.selectedType, this.selectedFrom, this.selectedTo);
    } else if (type === 'toDate') {
      this.selectedTo = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.manageWorklist(this.selectedType, this.selectedFrom, this.selectedTo);
    }
  }

  reportDateByAction(type, event) {
    if (type === 'fromDate') {
      this.selectedStart = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2);
    } else if (type === 'toDate') {
      this.selectedEnd = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2);
    }
  }

  searchLoc() {
    this.manageWorklist(this.selectedType, this.selectedFrom, this.selectedTo);
    this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2);
  }

  reportByPage(event: any) {
    this.pageStart2 = event.pageIndex;
    this.pageSize2 = event.pageSize;
    this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2);
  }

  manageWorklist(code, from, to) {
    if (code === 'post') {
      let data = {
        "fromDate": from,
        "toDate": to,
        "limit": 2000,
        "skip": 0
      }
      this.commonService.getAllReportedPost(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator1;
        this.dataSource.sort = this.sort;
      })
    } else if (code === 'notices') {
      let data = {
        "fromDate": from,
        "toDate": to,
        "limit": 2000,
        "skip": 0
      }
      this.commonService.getAllReportedNotice(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator1;
        this.dataSource.sort = this.sort;
      })
    } else if (code === 'video') {
      let data = {
        "fromDate": from,
        "toDate": to,
        "limit": 2000,
        "skip": 0
      }
      this.commonService.getAllReportedVideo(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator1;
        this.dataSource.sort = this.sort;
      })
    } else if (code === 'shorts') {
      let data = {
        "fromDate": from,
        "toDate": to,
        "limit": 2000,
        "skip": 0
      }
      this.commonService.getAllReportedShorts(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator1;
        this.dataSource.sort = this.sort;
      })
    } else if (code === 'user') {
      let data = {
        "fromDate": from,
        "toDate": to
      }
      this.commonService.getAllReportedUser(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator1;
        this.dataSource.sort = this.sort;
      });
    }
  }

  reportData(code, text, from, to, pageStart, pageSize) {
    let type = code;
    let data = {
      "fromDate": from,
      "toDate": to,
      "searchText": text,
    }
    this.commonService.getReviewByReported(type, data, pageStart, pageSize).subscribe(res => {
        let data = res.results.data.value
        this.length2 = res.results.data.totalRecords
        this.reportDataSource = new MatTableDataSource(data);
        this.reportDataSource.paginator = this.paginator2;
        this.pageTriger = true
        this.reportDataSource.sort = this.sort;
    })
  }

  getAllReports() {
    let postReports = [];
    let noticesReports = [];
    let videoReports = [];
    let shortReports = [];
    let userReports = [];
    let page = { "limit": 2000, "skip": 0 }
    this.reviewReports = {
      'arrayList': [postReports, noticesReports, videoReports, shortReports, userReports],
      'sheetList': ['post', 'notice', 'video', 'short', 'user']
    }
    this.commonService.getAllReportedPost(page).subscribe(res => {
      if (res.statusCode === 1) {
        postReports = res.results.data.value;
        this.reviewReports['arrayList'][0] = postReports;
      }
    });
    this.commonService.getAllReportedNotice(page).subscribe(res => {
      if (res.statusCode === 1) {
        noticesReports = res.results.data.value
        this.reviewReports['arrayList'][1] = noticesReports;
      }
    });
    this.commonService.getAllReportedVideo(page).subscribe(res => {
      if (res.statusCode === 1) {
        videoReports = res.results.data.value;
        this.reviewReports['arrayList'][2] = videoReports;
      }
    });
    this.commonService.getAllReportedShorts(page).subscribe(res => {
      if (res.statusCode === 1) {
        shortReports = res.results.data.value;
        this.reviewReports['arrayList'][3] = shortReports;
      }
    });
    this.commonService.getAllReportedUser(page).subscribe(res => {
      if (res.statusCode === 1) {
        userReports = res.results.data.value
        this.reviewReports['arrayList'][4] = userReports;
      }
    });
  }
  getExcelDetails() {
    if (this.reviewReports['arrayList'].length) {
      if (!this.reviewReports['arrayList'].every(val => val.length == 0)) {
        this.ExcelService.multiSheet(this.reviewReports['arrayList'], this.reviewReports['sheetList'], 'kyn_admin_report', this.selectedDate)
      } else {
        this.toastr.warning('Warning', `No Data Found`);
      }
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.filterValue = null;
    this.manageWorklist(this.selectedType, this.selectedFrom, this.selectedTo);
    this.reportData(this.selectedType, this.applyFilterValue, this.selectedStart, this.selectedEnd, this.pageStart2, this.pageSize2)
  }

  open(event) {
    this.reportOpen(event, null, null);
  }

  reportOpen(show, data, screen) {
        let kydata = { 'type': this.selectedType, 'reportData': data, 'screen': screen}
    this.passingdata = kydata;
    this.isOpen = show;
    if (!this.isOpen) {
      this.refreshPage();
    }
  }
  fixClick() {
    console.log('')
  }  
}
