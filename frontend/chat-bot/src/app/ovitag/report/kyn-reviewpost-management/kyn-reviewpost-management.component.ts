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

import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ExcelService, PdfService, CommonService, ChartService, ConfigurationService } from '../../../shared';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-kyn-reviewpost-management',
  templateUrl: './kyn-reviewpost-management.component.html',
  styleUrls: ['./kyn-reviewpost-management.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KynReviewpostManagementComponent implements OnInit {

  public reportForm: UntypedFormGroup;
  public reportData: any = [];
  public date: any = new Date();
  public today = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  HCselected = 'klips'
  reportList = [{ link: 'post', name: 'Post' }, { link: 'notice', name: 'Notice' },
  { link: 'telekast', name: 'Telekast' }, { link: 'klips', name: 'klips' }]
  filterTypes = [null];
  groupBy = null;
  dateType = "multipleDate";
  reviewReports =  {'arrayList' : [],'sheetList' : []};
  duration = 2000;
  constructor(public datepipe: DatePipe, public PdfService: PdfService, public dialog: MatDialog, public fb: UntypedFormBuilder,
    public ExcelService: ExcelService, public CommonService: CommonService, public configurationService: ConfigurationService,
    public ChartService: ChartService, public toastr: AppToastService) {
  }

  ngOnInit(): void {
    if (this.HCselected === 'klips') {
      // this.dateType = "multipleDate";
      this.reportData['category'] = true;
      this.CommonService.getAnalyticsLocation().subscribe(res => {
        this.reportData['locationList'] = res.results.data;
      })
      this.CommonService.getAnalyticsCategories().subscribe(res => {
        this.reportData['categoriesList'] = res.results.data;
      })
    }
    this.buildForm()
    this.reportData['enableExcel'] = false
    this.reportData['cardInfo'] = { 'width': '80%', 'height': '100px', 'col': 4, 'gutterSize': '0px' };
    // let event = {
    //   "fromDate": this.reportForm.controls["fromDate"].value,
    //   "toDate": this.reportForm.controls["toDate"].value,
    //   "location": this.reportForm.controls["locationId"].value,
    //   "category": this.reportForm.controls["categoryId"].value,
    // }
    // this.getAllReports(event)
    this.reportData['tileInfo'] = [
      { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Klips', 'islist': false, 'content': 0 },
      { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Notice', 'islist': false, 'content': 0},
      { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Post', 'islist': false, 'content': 0},
      { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TeleKast', 'islist': false, 'content': 0},
    ];
  }

  buildForm() {
    this.reportForm = this.fb.group({
      typeId: [this.reportList ? 'klips' : ''],
      locationId: [''],
      categoryId: [''],
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : ''],
    });
  }

  reportHeaderAction(key, data) {
    if (key === 'report') {
      this.HCselected = data.value;
      console.log(this.HCselected);
      // this.dateType = 'multipleDate'
      if (this.HCselected === 'post' || this.HCselected === 'notice') {
        this.reportData['category'] = false;
        this.reportData['locationData'] = this.reportForm.controls["locationId"].value;
      } else if (this.HCselected === 'telekast' || this.HCselected === 'klips') {
        this.reportData['category'] = true;
        this.reportData['locationData'] = this.reportForm.controls["locationId"].value;
        this.reportData['categoriesData'] = this.reportForm.controls["categoryId"].value;
      }
    } else if (key === 'fromDate') {
      this.fromDate = data;
    } else if (key === 'toDate') {
      this.toDate = data;
    } else if (key === 'location') {
      this.reportData['locationValue'] = true
    } else if (key === 'category') {
      this.reportData['categoryValue'] = true
    } else if (key === 'Insights') {
      this.getAllReports()
      this.getAllReportsTable()
    } else if (key === 'excel') {
      this.downloadExcel();
    } else {
      this.getAllReports()
      this.getAllReportsTable()
    }
  }
  downloadExcel(){
    if(this.reviewReports['arrayList'].length) {
      if(!this.reviewReports['arrayList'].every(val => val.length == 0)) {
        this.ExcelService.multiSheet(this.reviewReports['arrayList'], this.reviewReports['sheetList'],  'kyn_admin_report', this.reportForm.controls["fromDate"].value)
      } else {
        this.toastr.warning('Warning', `No Data Found`);
      }
    }
  }

  getAllReports() {
    let event = {
      "fromDate": this.datepipe.transform(this.reportForm.controls["fromDate"].value, 'yyyy-MM-dd'),
      "toDate": this.datepipe.transform(this.reportForm.controls["toDate"].value, 'yyyy-MM-dd'),
      "location": [this.reportForm.controls["locationId"].value],
      "category": [this.reportForm.controls["categoryId"].value],
    }
    if(this.reportForm.controls["locationId"].value == '') {
      delete event['location'];
    } 
    if(this.reportForm.controls["categoryId"].value == '') {
      delete event['category'];
    }
    this.reportData['loading'] = true;
    this.CommonService.getOverview(event).subscribe(res => {
      this.reportData['loading'] = false;
      this.reportData['data'] = res.results.data;
      this.reportData['cardInfo'] = { 'width': '80%', 'height': '100px', 'col': 4, 'gutterSize': '0px' };
      this.reportData['tileInfo'] = [
        { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Klips', 'islist': false, 'content': this.reportData['data'][0]['Klips'] },
        { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Notice', 'islist': false, 'content': this.reportData['data'][0]['Notice']},
        { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Post', 'islist': false, 'content': this.reportData['data'][0]['Post']},
        { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TeleKast', 'islist': false, 'content': this.reportData['data'][0]['Telekast']},
      ];
      });
  }

  getAllReportsTable(){
    this.reportData['showTable'] = false;
    this.reportData['enableExcel'] = false
    let data = {
      "fromDate": this.datepipe.transform(this.reportForm.controls["fromDate"].value, 'yyyy-MM-dd'),
      "toDate": this.datepipe.transform(this.reportForm.controls["toDate"].value, 'yyyy-MM-dd'),
      "location": [this.reportForm.controls["locationId"].value],
      "category": [this.reportForm.controls["categoryId"].value],
      "pagination": { "limit": 2000, "skip": 0}
    }
    if(data.location[0] !== null){
      this.reportData['loading'] = true;
      this.reportData['video'] = [];
      this.reportData['shorts'] = [];
      this.reportData['journal'] = [];
      this.reportData['post'] = [];
      this.reviewReports = {
        'arrayList' : [this.reportData['video'], this.reportData['shorts'], this.reportData['journal'], this.reportData['post'],],
        'sheetList' : ['video', 'shorts', 'journal', 'post']
      }
      this.CommonService.getReportVideo(data).subscribe(res => {
      this.reportData['video'] = res.results.data.value;
      this.reviewReports.arrayList[0] = this.reportData['video']
      this.reportData['loading'] = false;
      this.reportData['showTable'] = true;
      this.reportData['enableExcel'] = true
    });
    this.CommonService.getReportShorts(data).subscribe(res => {
      this.reportData['shorts'] = res.results.data.value;
      this.reviewReports.arrayList[1] = this.reportData['shorts']
      this.reportData['loading'] = false;
      this.reportData['showTable'] = true;
      this.reportData['enableExcel'] = true
    });
    let locData = {
      "fromDate": this.datepipe.transform(this.reportForm.controls["fromDate"].value, 'yyyy-MM-dd'),
      "toDate": this.datepipe.transform(this.reportForm.controls["toDate"].value, 'yyyy-MM-dd'),
      "location": data.location,
       "pagination": { "limit": 2000, "skip": 0}
    }
    this.CommonService.getReportJournal(locData).subscribe(res => {
      this.reportData['journal'] = res.results.data.value;
      this.reviewReports.arrayList[2] = this.reportData['journal']
      this.reportData['loading'] = false;
      this.reportData['showTable'] = true;
      this.reportData['enableExcel'] = true
    });
    this.CommonService.getReportPost(locData).subscribe(res => {
      this.reportData['post'] = res.results.data.value;
      this.reviewReports.arrayList[3] = this.reportData['post']
      this.reportData['loading'] = false;
      this.reportData['showTable'] = true;
      this.reportData['enableExcel'] = true
    });
    }
  }
  fixClick() {
    console.log('')
  }  
}
