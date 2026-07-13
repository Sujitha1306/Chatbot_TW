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

import { Component, EventEmitter,  Input, OnInit, Output, ViewChild } from '@angular/core';
import {  MatDialog,  } from '@angular/material/dialog';
import { CommonService } from '../../../../shared';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PlayVideoComponent } from '../../external-user/kyn-user/kyn-user.component';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-kyn-media-reports',
  templateUrl: './kyn-media-reports.component.html',
  styleUrls: ['./kyn-media-reports.component.scss']
})
export class KynMediaReportsComponent implements OnInit {

  displayedData = [
    { 'colName': 'reportReasonValue', 'title': 'Reason', 'dataName': 'reportReasonValue' },
    { 'colName': 'createdAt', 'title': 'Created Date', 'dataName': 'createdAt' },
    { 'colName': 'reportedByName', 'title': 'Reported Name', 'dataName': 'reportedByName' },
  ];
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  ReportedDataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  userDetails: any = [];
  isExpanded: boolean = false;
  userReports: any = [];
  nodata = null;
  reportType = 'video';
  @Input() pasingReport: any
  @Output() show = new EventEmitter<any>();
  data : any;
  reportsBy: any = [];
  defaultImg = '../../../../assets/Alert/common_icons/default img.png'
  reportedByData =  false;

  constructor(public commonService: CommonService, public dialog: MatDialog,
  public toastr: AppToastService) { }

  ngOnInit(): void {
    this.data = this.pasingReport
    this.userDetails = this.data.reportData;
    if(this.userDetails.hasOwnProperty('sourceUrl') && this.userDetails.sourceUrl?.includes('.m3u8')) {
      this.userDetails.sourceUrl = this.userDetails.rawDataUrl;
    }
    if(this.data.screen === 'review'){
      this.totalReports(this.data.type, this.data.reportData.id);
    } else {
      this.getIdBy(this.data.type, this.data.reportData.sourceId)
    }
  }

  toggleExpand(){
    this.isExpanded = !this.isExpanded;
  }

  totalReports(type, id) {
    this.nodata = null;
    if (type === 'post') {
      this.reportType = 'post'
      this.commonService.getPostReport(id).subscribe(res => {
        this.ReportedDataSource = new MatTableDataSource(res.results.data.value);
        this.ReportedDataSource.paginator = this.paginator;
        this.ReportedDataSource.sort = this.sort;
        if(this.userDetails){
          if(this.data.preview === 'preview'){
            this.play();
          }
        }
      });
    } else if (type === 'notices') {
      this.reportType = 'journal'
      this.commonService.getNoticeReport(id).subscribe(res => {
        this.ReportedDataSource = new MatTableDataSource(res.results.data.value);
        this.ReportedDataSource.paginator = this.paginator;
        this.ReportedDataSource.sort = this.sort;
        if(this.userDetails){
          if(this.data.preview === 'preview'){
            this.play();
          }
        }
      });
    } else if (type === 'video') {
      this.reportType = 'video'
      this.commonService.getVideoReport(id).subscribe(res => {
        this.ReportedDataSource = new MatTableDataSource(res.results.data.value);
        this.ReportedDataSource.paginator = this.paginator;
        this.ReportedDataSource.sort = this.sort;
        if(this.userDetails){
          if(this.data.preview === 'preview'){
            this.play();
          }
        }
      });
    } else if(type === 'shorts') {
      this.reportType = 'shorts'
      this.commonService.getShortsReport(id).subscribe(res => {
        this.ReportedDataSource = new MatTableDataSource(res.results.data.value);
        this.ReportedDataSource.paginator = this.paginator;
        this.ReportedDataSource.sort = this.sort;
        if(this.userDetails){
          if(this.data.preview === 'preview'){
            this.play();
          }
        }
      });
    } else if(type === 'user') {
      this.reportType = 'user'
      this.commonService.getUserReport(id).subscribe(res => {
        this.ReportedDataSource = new MatTableDataSource(res.results.data.value);
        let userdata = res.results.data.value
        this.nodata = userdata.length ? false : true;
        this.userReports = res.results.data.value;
        this.ReportedDataSource.paginator = this.paginator;
        this.ReportedDataSource.sort = this.sort;
      });
    }
  } 

  play(){
    const dialogRef = this.dialog.open(PlayVideoComponent,
      { data: this.userDetails, panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => { });
  }

  deleteContent() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px', height: '180px', panelClass: 'pop-up-margin',
      data: {
        title: 'Confirmation',
        message: 'Do you want to delete?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        let id = this.userDetails.id;
        let type = this.reportType;
        this.commonService.kynReportDelete(id, type).subscribe(res => {
          this.close(false);
          this.toastr.success('Success', `${res.message}`);
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    });
  }

  deleteByContent(){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px', height: '180px', panelClass: 'pop-up-margin',
      data: {
        title: 'Confirmation',
        message: 'Do you want to delete?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        let id = this.userDetails.id;
        let type = this.reportType;
        let postData = {
          "actionStatus": 'APPROVED'
        }
        this.commonService.kynReportByDelete(id, type, postData).subscribe(res => {
          this.close(false);
          this.toastr.success('Success', `${res.message}`);
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      } else if(result == 'No'){
        let id = this.userDetails.id;
        let type = this.reportType;
        let postData = {
          "actionStatus": 'REJECTED'
        }
        this.commonService.kynReportByDelete(id, type, postData).subscribe(res => {
          this.close(false);
          this.toastr.success('Success', `${res.message}`);
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    });
  }

getIdBy(type, id){
  if(type === 'post'){
    this.commonService.getPreviewReportPost(id).subscribe(res => {
      this.reportsBy = res.results.data.value[0]
      this.reportedByData = true
    })
  } else if(type === 'notices'){
    this.commonService.getPreviewReportNotice(id).subscribe(res => {
      this.reportsBy = res.results.data.value[0]
      this.reportedByData = true
    })
  } else if(type === 'video'){
    this.commonService.getPreviewReportVideo(id).subscribe(res => {
      this.reportsBy = res.results.data.value[0]
      this.reportedByData = true
    })
  } else if(type === 'shorts'){
    this.commonService.getPreviewReportShorts(id).subscribe(res => {
      this.reportsBy = res.results.data.value[0]
      this.reportedByData = true
    })
  }
}

close(key){
  this.show.emit(key)
}
  fixClick() {
    console.log('')
  }  
}
