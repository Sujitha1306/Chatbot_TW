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

import { Component, Inject, OnInit} from '@angular/core';
import { ExcelService, PdfService, CommonService, ChartService, ConfigurationService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Chart, ChartEvent } from 'chart.js'
import 'chartjs-plugin-datalabels';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-porter-report',
  templateUrl: './porter-report.component.html',
  styleUrls: ['./porter-report.component.scss']
})

export class PorterReportComponent implements OnInit {
  public reportForm: FormGroup;
  public date: any = new Date();
  public currentDate: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  yesterday = new Date().setDate(this.date.getDate() - 1); 
  public fromDate = this.datepipe.transform(this.yesterday, 'yyyy-MM-dd');
  public fromDateNew = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.yesterday, 'yyyy-MM-dd');
  public maxDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-ddThh:mm');
  public fromDateTime = this.datepipe.transform(this.yesterday, 'yyyy-MM-dd 00:00');
  public toDateTime = this.datepipe.transform(this.yesterday, 'yyyy-MM-dd 23:59');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public reportList: any;
  public reportData: any = [];
  public param: any;
  validDate: any;
  public HCselected = 'porter-req-summary';
  public api_name = this.HCselected;
  public selectedReport: any = new FormControl();
  public staffSub: Subject<any> = new Subject();
  public selected: any;
  public today = new Date();
  public locationlist: any[];
  public userList: any[] = [];
  public selectedUser = new FormControl(null);
  ActivityCategory: any;
  public selectedTypecode: any = new FormControl();
  public selectedCategory = new FormControl(null);
  public selectedCatLoc = new FormControl(null);
  public selectedLocation: any = new FormControl(null);
  public selectedCategoryType = new FormControl();
  public userName = new FormControl('');
  headercolor = '#1e8fc8';
  type: string = 'D';
  public ctx: any;
  public chartObj: any;
  public idleSummaryClosed = true;
  public activate_btn: any = [];
  isTargetingExp = true;
  filterInputs = [];
  locationName = null;
  userNameId = null;
  constructor(public datepipe: DatePipe, public PdfService: PdfService, public dialog: MatDialog,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public configurationService: ConfigurationService, public ChartService: ChartService) {
    this.activate_btn = this.CommonService.getActivePermission('button');
  }
  ngOnInit() {
    this.getReportList();
    this.staffSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getUserByType(searchTextValue);
    });
    this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
    { name: "fromDateTime", id: "fdt", label: "From Date Time", seq: 2, default: this.fromDateTime },
    { name: "toDateTime", id: "tdt", label: "To Date Time", seq: 3, default: this.toDateTime },
    { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
    this.buildForm();
  }
  public buildForm() {
    this.reportForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : ''],
      fromDateTime: [this.fromDateTime ? this.fromDateTime : ''],
      toDateTime: [this.toDateTime ? this.toDateTime : ''],
    });
    this.getReports(this.HCselected);
    this.getActivityCat();
  }
  getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res => res.code == "MN_RE");
    let porterSubmenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, 'MN_AIPM') : null;
    let porterId = porterSubmenusList['id'];
    let porterlist = permissions['dropdown'].filter(res => res.parentId == porterId);
    this.reportList = porterlist;
    const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
    if (firstSeqReport) {
      this.HCselected = firstSeqReport.code;
      this.api_name = this.HCselected
    }

  }
  
  getReports(id) {
    // this.api_name = id;
    if(id === "porter-req-summary-v1"){
      id = "porter-req-summary";
      this.HCselected = "porter-req-summary";
    }

    this.selectedReport.setValue(id)
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
    this.reportData = [];
    this.reportData.noRecords = false;
    this.reportData.loading = true;
    this.reportData['showTable'] = false;
    this.reportData['showCard'] = false;
    this.reportData['enablepdf'] = true;
    this.reportData['enableexcel'] = true;
    this.reportData['invalidDate'] = false;
    this.reportData['nullLocation'] = false;
    this.reportData['prevselected'] = this.HCselected;
    this.reportData['showPorterTable'] = false;
    this.reportData['showPerformanceTable'] = false;
    if (id != 'porter-byward') {
      this.selectedLocation.setValue(null)
    }
    if (id == 'patientmove') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData.enablepdf = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            // this.reportData['floorWisePorterMovement'] = res.results.data['Floorwise Patient movement'];
            // this.reportData['timeWisePorterMovement'] = res.results.data['timewise'];
            this.reportData['dateWiseSummary'] = [res.results.data['Date wise summary']['Requested'], res.results.data['Date wise summary']['Rejected'], res.results.data['Date wise summary']['TAT']];
            this.reportData['timeWisePorterMovement'] = [res.results.data['timewise']['data']['Requested'], res.results.data['timewise']['data']['Cancelled']];
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 8, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Requests','islist':false,'content':res.results.data['Total Patients'].data,'listItemName':[],'listItemData':[]},
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porter(man days)', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Porter Shifts/Day','islist':false,'content':res.results.data['Card']['Shift time']},
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Waitlist', 'islist': false, 'content': res.results.data['Card']['Total Waitlist'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive To Completion', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Arrive', 'islist': false, 'content': res.results.data['Card']['Avg.time to attend'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT CRtoCO:'] }
              // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Porter Status Count','islist':true,'content':'','listItemName':Object.keys(res.results.data['Porter Status Count'][0]),'listItemData':Object.values(res.results.data['Porter Status Count'][0])}
            ];
            this.reportData['showCard'] = false;
            this.reportData['showLocTable'] = false;
            this.reportData['showDateSumTable'] = false;
            this.reportData['Table'] = res.results.data['Porter Detail'];
            this.reportData['locationTable'] = res.results.data['Location wise summary'];
            this.reportData['locTableColumns'] = [];
            this.reportData['DateSumTable'] = res.results.data['Date wise summary'];
            this.reportData['DateSumTableColumns'] = [];
            // for (let i = 0; i < this.reportData['Table'].length; i++) {
            // this.reportData['Table'][i]['Movement Date'] = this.datepipe.transform(this.reportData['Table'][i]['Movement Date'], 'dd/MM/yyyy');
            // }
            this.reportData['TableColumns'] = [];
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['Table'];
            this.reportData['excelData'][1] = this.reportData['locationTable'];
            this.reportData['excelData'][2] = this.reportData['DateSumTable'];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            if (this.reportData['locationTable'].length > 0) {
              this.reportData['locTableColumns'] = Object.keys(this.reportData['locationTable'][0]);
              this.reportData['showLocTable'] = true;
            }
            if (this.reportData['DateSumTable'].length > 0) {
              this.reportData['DateSumTableColumns'] = Object.keys(this.reportData['DateSumTable'][0]);
              this.reportData['showDateSumTable'] = true;
            }
            // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'porterMovement','type':'grouped','data':[this.reportData['floorWisePorterMovement'].all_pat,this.reportData['floorWisePorterMovement'].porter],'label':this.reportData['floorWisePorterMovement'].label ,'title':'Floorwise Porter Movement','showTitle':true,'barLabel': ['Total', 'With Porter']});
            // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'porterTimewiseMovement','type':'stacked','data':[this.reportData['timeWisePorterMovement'].data.IN,this.reportData['timeWisePorterMovement'].data.OUT], 'label':this.reportData['timeWisePorterMovement'].label,'title':'Timewise Porter Movement','showTitle':true,'barLabel': ['IN', 'OUT']});
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'otherTimewiseMovement', 'type': 'grouped', 'data': this.reportData['timeWisePorterMovement'], 'label': res.results.data['timewise']['label'], 'title': 'Hourly Patient Movement & Cancellation', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            // this.ChartService.drawChart({'id':id,'canvasId':'dateWiseSummary','type':'grouped','data':this.reportData['dateWiseSummary'], 'label':res.results.data['Date wise summary']['label'],'title':'','showTitle':false,'barLabel': ['Requested','Rejected','TAT(min)']});
            this.reportData.loading = false;

          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'asset-move') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
          this.reportData['loading'] = false;
          this.reportData['enablepdf'] = true;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['dateWiseSummary'] = [res.results.data['Date wise summary']['Requested'], res.results.data['Date wise summary']['Rejected'], res.results.data['Date wise summary']['TAT']];
            this.reportData['timeWisePorterMovement'] = [res.results.data['timewise']['data']['Requested'], res.results.data['timewise']['data']['Cancelled']];
            this.reportData['waitlistSumData'] = [res.results.data['waitlist']['data']['wait_list'], res.results.data['waitlist']['data']['Idle']];
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 8, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porter(man days)', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Waitlist', 'islist': false, 'content': res.results.data['Card']['Total Waitlist'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Shift Time', 'islist': false, 'content': res.results.data['Card']['Shift time'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive To Completion', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Arrive', 'islist': false, 'content': res.results.data['Card']['Avg.time to attend'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT CRtoCO:'] }];
            this.reportData['showCard'] = true;
            this.reportData['showLocTable'] = false;
            this.reportData['Table'] = res.results.data['Porter Detail'];
            this.reportData['locationTable'] = res.results.data['Location wise summary'];
            this.reportData['performanceTable'] = res.results.data['Porter data']['Porter Individual Performance'];
            this.reportData['PorterIdleTable'] = res.results.data['Porter data']['Porter Idle summary'];
            this.reportData['PorterIdleTableCol'] = [];
            this.reportData['performanceTableCol'] = [];
            this.reportData['locTableColumns'] = [];
            this.reportData['TableColumns'] = [];
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['Table'];
            this.reportData['excelData'][1] = this.reportData['locationTable'];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            if (this.reportData['locationTable'].length > 0) {
              this.reportData['locTableColumns'] = Object.keys(this.reportData['locationTable'][0]);
              this.reportData['showLocTable'] = true;
            }
            if (this.reportData['performanceTable'].length > 0) {
              this.reportData['performanceTableCol'] = Object.keys(this.reportData['performanceTable'][0]);
              this.reportData['showPerformanceTable'] = true;
            }
            if (this.reportData['PorterIdleTable'].length > 0) {
              this.reportData['PorterIdleTableCol'] = Object.keys(this.reportData['PorterIdleTable'][0]);
              this.reportData['showPorterTable'] = true;
            }
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'otherTimewiseMovement', 'type': 'grouped', 'data': this.reportData['timeWisePorterMovement'], 'label': res.results.data['timewise']['label'], 'title': 'Hourly Patient Movement & Cancellation', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'porterWaitlist', 'type': 'grouped', 'data': this.reportData['waitlistSumData'], 'label': res.results.data['waitlist']['label'], 'title': 'Hourly Waitlist Summary', 'showTitle': true, 'barLabel': ['Waitlist', 'Idle'] });
            this.reportData.loading = false;
          } else {
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
        });
      }
    } else if (id == 'othreq-move') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['dateWiseSummary'] = [res.results.data['Date wise summary']['Requested'], res.results.data['Date wise summary']['Rejected'], res.results.data['Date wise summary']['TAT']];
            this.reportData['timeWisePorterMovement'] = [res.results.data['timewise']['data']['Requested'], res.results.data['timewise']['data']['Cancelled']];
            this.reportData['waitlistSumData'] = [res.results.data['waitlist']['data']['wait_list'], res.results.data['waitlist']['data']['Idle']];
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 8, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porter(man days)', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Porter Shifts/Day','islist':false,'content':res.results.data['Card']['Shift time']},
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Waitlist', 'islist': false, 'content': res.results.data['Card']['Total Waitlist'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive To Completion', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Arrive', 'islist': false, 'content': res.results.data['Card']['Avg.time to attend'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT CRtoCO:'] }];
            this.reportData['showCard'] = true;
            this.reportData['showLocTable'] = false;
            this.reportData['Table'] = res.results.data['Porter Detail'];
            this.reportData['locationTable'] = res.results.data['Location wise summary'];
            this.reportData['performanceTable'] = res.results.data['Porter data']['Porter Individual Performance'];
            this.reportData['PorterIdleTable'] = res.results.data['Porter data']['Porter Idle summary'];
            this.reportData['PorterIdleTableCol'] = [];
            this.reportData['performanceTableCol'] = [];
            this.reportData['locTableColumns'] = [];
            // for (let i = 0; i < this.reportData['Table'].length; i++) {
            // this.reportData['Table'][i]['Movement Planned time'] = this.datepipe.transform(this.reportData['Table'][i]['Movement Date'], 'dd/MM/yyyy');
            // }
            this.reportData['TableColumns'] = [];
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['Table'];
            this.reportData['excelData'][1] = this.reportData['locationTable'];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            if (this.reportData['locationTable'].length > 0) {
              this.reportData['locTableColumns'] = Object.keys(this.reportData['locationTable'][0]);
              this.reportData['showLocTable'] = true;
            }
            if (this.reportData['performanceTable'].length > 0) {
              this.reportData['performanceTableCol'] = Object.keys(this.reportData['performanceTable'][0]);
              this.reportData['showPerformanceTable'] = true;
            }
            if (this.reportData['PorterIdleTable'].length > 0) {
              this.reportData['PorterIdleTableCol'] = Object.keys(this.reportData['PorterIdleTable'][0]);
              this.reportData['showPorterTable'] = true;
            }
            // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'otherMovement','type':'grouped','data':[this.reportData['floorWisePorterMovement'].all_pat,this.reportData['floorWisePorterMovement'].porter],'label':this.reportData['floorWisePorterMovement'].label ,'title':'Floorwise Porter Movement','showTitle':true,'barLabel': ['Total', 'With Porter']});
            // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'otherTimewiseMovement','type':'stacked','data':[this.reportData['timeWisePorterMovement'].data.IN,this.reportData['timeWisePorterMovement'].data.OUT], 'label':this.reportData['timeWisePorterMovement'].label,'title':'Timewise Porter Movement','showTitle':true,'barLabel': ['IN', 'OUT']});
            // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'otherMovement','type':'bar','data':this.reportData['floorWisePorterMovement'].all_pat,'label':this.reportData['floorWisePorterMovement'].label ,'title':'Floorwise Movement Completed','showTitle':true,'barLabel': ['']});
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'otherTimewiseMovement', 'type': 'grouped', 'data': this.reportData['timeWisePorterMovement'], 'label': res.results.data['timewise']['label'], 'title': 'Hourly Patient Movement & Cancellation', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'porterWaitlist', 'type': 'grouped', 'data': this.reportData['waitlistSumData'], 'label': res.results.data['waitlist']['label'], 'title': 'Hourly Waitlist Summary', 'showTitle': true, 'barLabel': ['Waitlist', 'Idle'] });
            // this.ChartService.drawChart({'id':id,'canvasId':'dateWiseSummary','type':'grouped','data':this.reportData['dateWiseSummary'], 'label':res.results.data['Date wise summary']['label'],'title':'','showTitle':false,'barLabel': ['Requested','Rejected','TAT(min)']});
            this.reportData.loading = false;
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'porter-perf') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData.enableexcel = true;
            this.reportData['requestByPatient'] = res.results.data['ReqStatus by Patient'];
            this.reportData['requestByAsset'] = res.results.data['ReqStatus by Asset'];
            this.reportData['requestByOthers'] = res.results.data['ReqStatus by OtherReq'];
            this.reportData['avgCompByType'] = res.results.data['Avgcomp by Type'];
            this.reportData['avgToAttend'] = res.results.data['Avgttoattend by Type'];
            this.reportData['avgComplete'] = res.results.data['Avg.CRtoCO'];
            this.reportData['hrlyReq'] = res.results.data['Hourly requests'];
            this.reportData['locationwiseTable'] = res.results.data['Locationwise summary'];
            this.reportData['locwiseTableColumns'] = [];
            if (this.reportData['locationwiseTable'].length > 0) {
              this.reportData['locwiseTableColumns'] = Object.keys(this.reportData['locationwiseTable'][0]);
              this.reportData['showLocTable'] = true;
            }
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 5, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'No. of Porters', 'islist': false, 'content': res.results.data.card['Total Porter'][0], 'listItemName': [], 'listItemData': [] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'No. of Requests(Completed)', 'islist': false, 'content': res.results.data.card['Total Requests'][0], 'listItemName': [], 'listItemData': [] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive To Completion', 'islist': false, 'content': res.results.data.card['Avg Comp Time'][0], 'listItemName': [], 'listItemData': [] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Arrive', 'islist': false, 'content': res.results.data.card['Avg Time to attend'][0], 'listItemName': [], 'listItemData': [] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Complete', 'islist': false, 'content': res.results.data.card['Avg Time CRtoCO'][0], 'listItemName': [], 'listItemData': [] }
            ];
            this.reportData['showCard'] = true;
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'requestPatient', 'type': 'pie', 'data': this.reportData['requestByPatient'].data, 'label': this.reportData['requestByPatient'].label, 'title': 'Patient', 'showTitle': true, 'barLabel': [] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'requestAsset', 'type': 'pie', 'data': this.reportData['requestByAsset'].data, 'label': this.reportData['requestByAsset'].label, 'title': 'Asset', 'showTitle': true, 'barLabel': [] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'requestOthers', 'type': 'pie', 'data': this.reportData['requestByOthers'].data, 'label': this.reportData['requestByOthers'].label, 'title': 'Other Request', 'showTitle': true, 'barLabel': [] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'avgCompletion', 'type': 'bar', 'data': this.reportData['avgCompByType'].data, 'label': this.reportData['avgCompByType'].label, 'title': 'TAT: Arrive To Completion', 'showTitle': true, 'barLabel': ['Mins'] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'avgAttend', 'type': 'bar', 'data': this.reportData['avgToAttend'].data, 'label': this.reportData['avgToAttend'].label, 'title': 'TAT: Create To Arrive', 'showTitle': true, 'barLabel': ['Mins'] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'avgComplete', 'type': 'bar', 'data': this.reportData['avgComplete'].data, 'label': this.reportData['avgComplete'].label, 'title': 'TAT: Create To Complete', 'showTitle': true, 'barLabel': ['Mins'] });
            this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'hrReq', 'type': 'bar', 'data': this.reportData['hrlyReq'].data, 'label': this.reportData['hrlyReq'].label, 'title': 'Hourly Requests', 'showTitle': true, 'barLabel': ['% of requests'] });
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'porter-byward') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData.enableexcel = false;
      this.reportData.enablepdf = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&lid=' + this.selectedLocation.value;
        if (this.selectedLocation.value == null || this.selectedLocation.value == '') {
          this.reportData['nullLocation'] = true;
        } else {
          this.reportData['nullLocation'] = false;
        }
        this.reportData['loading'] = false;
        if (!this.reportData['nullLocation']) {
          this.CommonService.getReportData(id, this.param).subscribe(res => {
            if (res.results.statusCode == 200 && res.results.data != null) {
              this.reportData['totPor'] = res.results.data.Card['Total Porter'];
              this.reportData['avgComTime'] = res.results.data.Card['Avg.Completion Time'];
              this.reportData['arrToComp'] = res.results.data.Card['TAT: Arrive To Completion'];
              this.reportData['crToArrive'] = res.results.data.Card['TAT: Create To Arrive'];
              this.reportData['crToComp'] = res.results.data.Card['TAT: Create To Complete'];
              this.reportData['movIN'] = res.results.data.Card['Movement IN'];
              this.reportData['movOUT'] = res.results.data.Card['Movement OUT'];
              this.reportData['reqCount'] = res.results.data['Category wise Count'];
              this.reportData['timeWiseCount'] = res.results.data['timewise'];
              this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 7, 'gutterSize': '0px' };
              this.reportData['tileInfo'] = [
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porter', 'islist': false, 'content': this.reportData['totPor'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Average Completion Time', 'islist': false, 'content': this.reportData['avgComTime'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive To Completion', 'islist': false, 'content': this.reportData['arrToComp'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Arrive', 'islist': false, 'content': this.reportData['crToArrive'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned To Complete', 'islist': false, 'content': this.reportData['crToComp'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Movement IN', 'islist': false, 'content': this.reportData['movIN'], 'listItemName': [], 'listItemData': [] },
                { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Movement OUT', 'islist': false, 'content': this.reportData['movOUT'], 'listItemName': [], 'listItemData': [] }]
              this.reportData['showCard'] = true;
              this.reportData['Table'] = res.results.data['Porter Detail'];
              this.reportData['TableColumns'] = [];
              if (this.reportData['Table'].length > 0) {
                this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                this.reportData['showTable'] = true;
              }
              this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'reqCountByCategory', 'type': 'pie', 'data': this.reportData['reqCount'].data, 'label': this.reportData['reqCount'].label, 'title': 'Request Count By Category', 'showTitle': true, 'barLabel': [''] });
              this.ChartService.drawChart({ 'id': this.selected['selectedId'], 'canvasId': 'timewiseReq', 'type': 'bar', 'data': this.reportData['timeWiseCount'].data.IN, 'label': this.reportData['timeWiseCount'].label, 'title': 'Timewise Request', 'showTitle': true, 'barLabel': [''] });
              this.reportData.enableexcel = true;
              this.reportData.enablepdf = true;
              this.reportData.loading = false;
            } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
              this.reportData.enableexcel = false;
              this.reportData.enablepdf = false;
            }
          });
        }
      }
    } else if (id == 'porter-ind-perf') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.reportData['loading'] = false;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData.enablepdf = false;
            this.reportData['Table'] = res.results.data['Porter Agg data'];
            this.reportData['TableColumns'] = [];
            this.reportData['PorterIdleTable'] = res.results.data['Porter Idle'];
            this.reportData['PorterIdleTableCol'] = [];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            if (this.reportData['PorterIdleTable'].length > 0) {
              this.reportData['PorterIdleTableCol'] = Object.keys(this.reportData['PorterIdleTable'][0]);
              this.reportData['showPorterTable'] = true;
            }
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['Table'];
            this.reportData['excelData'][1] = this.reportData['PorterIdleTable'];
            this.reportData.loading = false;
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'porter-req-summary' || id == 'porter-req-summary-bycat') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        // this.param = '/fdt=' + this.fromDateTime + '&tdt=' + this.toDateTime 
        if (id == 'porter-req-summary') {
          this.param = '/fdt=' + this.fromDateTime + '&tdt=' + this.toDateTime;
        } else {
          this.param = '/fdt=' + this.fromDateTime + '&tdt=' + this.toDateTime;
          if (this.selectedCategory.value !== 'All' && this.selectedCategory.value !== null) {
            this.param = this.param + '&type=' + this.selectedCategory.value;
          }
          if (this.selectedCatLoc.value !== 'All' && this.selectedCatLoc.value !== null) {
            this.param = this.param + '&ploc=' + this.selectedCatLoc.value
          }
        }
        if(this.api_name === 'porter-req-summary-v1'){
          this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        }
        const fromDate = new Date(this.fromDate);
        const toDate = new Date(this.toDate);

        const diffTime = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(diffDays);
        this.reportData['showPoolTable'] = false;
        if(localStorage.getItem(btoa('facilityId')) == '0050' && diffDays<31){
          this.reportData['showPoolTable'] = true;
          let selfreqParam = '/fdt=' + this.fromDate + '&tdt=' + this.toDate+ '&serviceGroup=SG-PH&include=false' ;

          this.CommonService.getReportData('porter-selfreq-summary', selfreqParam).subscribe(res => {
              if(res.results.statusCode == 200){
                this.reportData['porterPoolTable'] = res.results.data['Porter TAT'];
                if (this.reportData['porterPoolTable'].length > 0) {
                    this.reportData['porterPoolTable'].forEach(row => {
                      delete row['Total Porters Performed'];
                    });
                  this.reportData['porterPoolColumns'] = Object.keys(this.reportData['porterPoolTable'][0])
                }
              }
          })
        }
        console.log(this.api_name)
        this.CommonService.getReportData(this.api_name, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (id == 'porter-req-summary' && res.results.statusCode == 200 && res.results['Idle Porters by hour']) {
            this.reportData['IdlePorters_by_hour'] = res.results['Idle Porters by hour'];
          }
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['data'] = res.results.data;
            this.reportData['timeWisePorterMovement'] = [res.results.data['timewise']['data']['Requested'], res.results.data['timewise']['data']['Cancelled']];
            this.reportData['categoryWiseSummary'] = [res.results.data['request category wise']['Requested'], res.results.data['request category wise']['Open'], res.results.data['request category wise']['Waitlist'], res.results.data['request category wise']['Cancelled']];
            this.reportData['waitlistSumData'] = [res.results.data['waitlist']['data']['wait_list'], res.results.data['waitlist']['data']['Idle']];
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '80px', 'col': 9, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porter', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Shifts', 'islist': false, 'content': res.results.data['Card']['Total Shifts'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Avg Shifts Time', 'islist': false, 'content': res.results.data['Card']['Average Shift'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Waitlist', 'islist': false, 'content': res.results.data['Card']['Total Waitlist'] },
              // { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Assigned', 'islist': false, 'content': res.results.data['Card']['Total Assigned'] },
              // { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Accepted', 'islist': false, 'content': res.results.data['Card']['Total Accepted'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Open', 'islist': false, 'content': res.results.data['Card']['Total Active'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Scheduled/Planned', 'islist': false, 'content': res.results.data['Card']['Total Scheduled'] },
              // { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Planned', 'islist': false, 'content': res.results.data['Card']['Total Planned'] },
              // { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Scheduled', 'islist': false, 'content': res.results.data['Card']['Total Scheduled'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Waitlist Completed', 'islist': false, 'content': res.results.data['Card']['Total Waitlist Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Create To Complete', 'islist': false, 'content': res.results.data['Card']['TAT-CRtoComplete'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Create To Accept', 'islist': false, 'content': res.results.data['Card']['TAT-CreateToAccept'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Accept To Arrive', 'islist': false, 'content': res.results.data['Card']['TAT-Accept to Arrive'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Arrive To Complete', 'islist': false, 'content': res.results.data['Card']['TAT-ArriveToComplete'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Self Requests', 'islist': false, 'content': res.results.data['Card']['Self Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT:Self Request', 'islist': false, 'content': res.results.data['Card']['TAT:Self Request'] }
            ];
            this.reportData['showCard'] = true;
            this.reportData['showLocTable'] = false;
            this.reportData['Table'] = res.results.data['Porter Detail'];
            this.reportData['locationTable'] = res.results.data['Location wise summary'];
            this.reportData['performanceTable'] = res.results.data['Porter Individual Performance'];
            this.reportData['PorterIdleTable'] = res.results.data['Porter Idle summary'];
            this.reportData['dateWiseSummary'] = res.results.data['Date wise summary'];
            this.reportData['datewiseTableCol'] = [];
            this.reportData['PorterIdleTableCol'] = [];
            this.reportData['performanceTableCol'] = [];
            this.reportData['locTableColumns'] = [];
            this.reportData['TableColumns'] = [];
            this.reportData['excelData'] = [];
            this.reportData['excelData'][1] = this.reportData['Table'];
            this.reportData['excelData'][2] = this.reportData['locationTable'];
            this.reportData['excelData'][3] = this.reportData['dateWiseSummary'];
            if (id == 'porter-req-summary') {
              this.reportData['excelData'][4] = this.reportData['performanceTable'];
              this.reportData['excelData'][5] = this.reportData['PorterIdleTable'];
              this.reportData['excelData'][0] = [this.reportData['data']['Card']];
            }
            // if (this.reportData['Table'].length > 0) {
            //   this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            //   this.reportData['showTable'] = true;
            // }
            if (this.reportData['locationTable'].length > 0) {
              this.reportData['locTableColumns'] = Object.keys(this.reportData['locationTable'][0]);
              this.reportData['showLocTable'] = true;
            }
            if (this.reportData['performanceTable'].length > 0) {
              this.reportData['performanceTableCol'] = Object.keys(this.reportData['performanceTable'][0]);
              this.reportData['showPerformanceTable'] = true;
            }
            // if (this.reportData['PorterIdleTable'].length > 0) {
            //   this.reportData['PorterIdleTableCol'] = Object.keys(this.reportData['PorterIdleTable'][0]);
            //   this.reportData['showPorterTable'] = true;
            // }
            if (this.reportData['dateWiseSummary'].length > 0) {
              this.reportData['datewiseTableCol'] = Object.keys(this.reportData['dateWiseSummary'][0]);
              this.reportData['showDatewiseTable'] = true;
            }
            // let maxval = res.results.data['waitlist']['data']['wait_list'].reduce((a, b) => { return Math.max(a, b) }) + 1;
            // let newArray = res.results.data['timewise']['data']['Requested'].concat(res.results.data['timewise']['data']['Cancelled']);
            // let maxval2 = newArray.reduce((a, b) => { return Math.max(a, b) }) + 1;
            // newArray = []
            // newArray = res.results.data['request category wise']['Requested'].concat(res.results.data['request category wise']['Completed']);
            // newArray = newArray.concat(res.results.data['request category wise']['Cancelled']);
            // let maxval3 = newArray.reduce((a, b) => { return Math.max(a, b) }) + 1;
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'otherTimewiseMovement', 'type': 'grouped', 'data': this.reportData['timeWisePorterMovement'], 'label': res.results.data['timewise']['label'], 'title': 'Average Hourly Patient Movement & Cancellation', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            if (id == 'porter-req-summary') {
              this.ChartService.drawChart({ 'id': id, 'canvasId': 'requestCategorywiseSum', 'type': 'grouped', 'data': this.reportData['categoryWiseSummary'], 'label': res.results.data['request category wise']['label'], 'title': 'Request Categorywise Summary', 'showTitle': true, 'barLabel': ['Total', 'Open','Waitlist', 'Cancelled'] });
            }
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'assetCaterywiseSum', 'type': 'bar', 'data': this.reportData['data']['AssetCategory Summary']['data']['Count'], 'label': this.reportData['data']['AssetCategory Summary'].label, 'title': 'Request Count by Service', 'showTitle': true, 'barLabel': ['#requests'] });
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'poolwiseSum', 'type': 'bar', 'data': this.reportData['data']['Poolwise Request Count']['data']['Count'], 'label': this.reportData['data']['Poolwise Request Count'].label, 'title': 'Poolwise Request Count', 'showTitle': true, 'barLabel': ['#requests'] });
            this.ChartService.drawChart({'id':id,'canvasId':'porterWaitlist','type':'bar','data':this.reportData['waitlistSumData'][0],'label': res.results.data['waitlist']['label'],'title':'Average Hourly Waitlist Summary','showTitle':true,'barLabel': ['Waitlist']});
            if(false){
              // waitlist with idle summary popup commented temp
              (Chart.instances, function (instance) {
                if (instance.chart.canvas.id == "porterWaitlist") {
                  instance.destroy();
                }
              })
              let data: any;
              data = {
                labels: this.reportData['data']['waitlist']['label'],
                datasets: [{
                  label: 'Waitlist',
                  type: "bar",
                  backgroundColor: "#29cb97",
                  maxBarThickness: 30,
                  data: this.reportData['waitlistSumData'][0],
                }]
              }
              this.ctx = "porterWaitlist";
              this.chartObj = new Chart(this.ctx, {
                type: 'bar',
                data: data,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Average Hourly Waitlist Summary',
                      padding: 20,
                      color: 'black',
                      font: {
                        size: 14,
                        family: 'Open Sans',
                      }
                    },
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        font: {
                          size: 10,
                        }
                      }
                    },
                    tooltip: {
                      enabled: false
                    },
                    datalabels: {
                      color: 'black',
                      align: 'end',
                      anchor: 'end',
                      font: {
                        weight: 'bold'
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: true,
                        drawOnChartArea: false
                      },
                      title: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      min: 0,
                      grid: {
                        display: true,
                        drawOnChartArea: false
                      }
                    }
                  },
                  onClick: (event: Event & ChartEvent, elements: any[], chart: any) => {
                    if (elements.length > 0) {
                      let point = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                      if (point.length) {
                        let xIndex = point[0].index;
                        let label = chart.data.labels[xIndex];
                        this.idleSummary(label);
                      }
                    }
                  }
                }
              }
              );
            }
            this.reportData.loading = false;
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'porter-perf-trend') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&freq=' + this.type + '&user_id=' + this.selectedUser.value;
        if (this.selectedUser.value == null || this.selectedUser.value == '') {
          this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&freq=' + this.type;
        }
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'porterRequest', 'type': 'bar', 'data': res.results.data['reqs_barchart']['data']['Ticket count'], 'label': res.results.data['reqs_barchart']['label'], 'title': 'Total Tickets by Date', 'showTitle': true, 'barLabel': ['#Tickets'] });
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'tatLineChart', 'type': 'line', 'data': res.results.data['tat_linechart']['data']['Create To Arrive'], 'label': res.results.data['tat_linechart']['label'], 'title': 'Create to Arrive by date', 'showTitle': true, 'barLabel': ['Avg.time (in mins)'] });
            this.reportData['Table'] = res.results.data['Table data'];
            this.reportData['TableColumns'] = [];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
          } else {
            this.reportData['enablepdf'] = false;
            this.reportData['enableexcel'] = false;
          }
        });
      }
    } else if (id == 'port-nav-data') {
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['Table'] = res.results.data;
            this.reportData['TableColumns'] = [];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }
          }
        })
      }
    } else if (id == 'porter-daily') {
      this.reportData['enableexcel'] = false;
      this.param = '';
      this.CommonService.getReportData(id, this.param).subscribe(res => {
        this.reportData['loading'] = false;
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 5, 'gutterSize': '0px' };
          this.reportData['tileInfo'] = [
            { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Porters Needed Today', 'islist': false, 'content': res.results.data['Card']['#ofPorters Needed today'] },
            { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Best Performer(Yesterday)', 'islist': false, 'content': res.results.data['Card']['Yesterdays Performer'] },
            { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Best Performer(Last month)', 'islist': false, 'content': res.results.data['Card']['Lastmonth Top Performer'] },
            { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Avg.time to get Porter(mins)', 'islist': false, 'content': res.results.data['Card']['Avg.time to attend(mins)'] },
            { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Peak Hours', 'islist': false, 'content': res.results.data['Card']['Peak Hours'] }];
          this.reportData['showCard'] = true;
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'callToArrive', 'type': 'line', 'data': res.results.data['Call to Arrive']['Duration'], 'label': res.results.data['Call to Arrive']['label'], 'title': 'Call To Arrive(mins)', 'showTitle': true, 'barLabel': [] });
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'callToComplete', 'type': 'line', 'data': res.results.data['Call to Complete']['Duration'], 'label': res.results.data['Call to Complete']['label'], 'title': 'Call to Complete(mins)', 'showTitle': true, 'barLabel': [] });
          // this.reportData['Table'] = res.results.data['Best Performer'];
          this.reportData['TableColumns'] = [];
          // if(this.reportData['Table'].length > 0){
          //   this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          //   this.reportData['showTable'] = true;
          // }
        }
      });
    } else if (id == 'porter-req-perf') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['data'] = res.results.data;
            this.reportData['enablepdf'] = true;
            this.reportData['requestToWait'] = [this.reportData['data']['Reqs waits']['requests'], this.reportData['data']['Reqs waits']['waitlists']];
            this.reportData['escalation'] = [this.reportData['data']['Escalation']['data']['Esc0'], this.reportData['data']['Escalation']['data']['Esc1'], this.reportData['data']['Escalation']['data']['Esc2']];
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'reqToWait', 'type': 'bar-line', 'data': this.reportData['requestToWait'], 'label': this.reportData['data']['Reqs waits']['label'], 'title': 'Request&Waitlist Count', 'barLabel': ['Request', 'Waitlist'], 'showTitle': true, 'showLegend': true });
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'escalation', 'type': 'stacked', 'data': this.reportData['escalation'], 'label': this.reportData['data']['Escalation']['label'], 'barLabel': ['Esc0(<15mins)', 'Esc1(16 to 30mins)', 'Esc2(>30min)'], 'title': 'Hourly Escalation(TAT:CreateToArrive)', 'showTitle': true });
          }
        });
      }
    } else if (id == 'porter-selfreq-summary') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        if (this.selectedCategory.value !== 'All' && this.selectedCategory.value !== null) {
          this.param = this.param + '&type=' + this.selectedCategory.value;
        }
        if (this.selectedCatLoc.value !== 'All' && this.selectedCatLoc.value !== null) {
          this.param = this.param + '&ploc=' + this.selectedCatLoc.value
        }
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['data'] = res.results.data;
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 6, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'No of Self Requests', 'islist': false, 'content': this.reportData['data']['card']['No of Self Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'No of Self Requests w/o asset', 'islist': false, 'content': this.reportData['data']['card']['No of Self Requests w/o asset'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'No of Self Requests with asset', 'islist': false, 'content': this.reportData['data']['card']['No of Self Requests with asset'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT:w/o asset', 'islist': false, 'content': this.reportData['data']['card']['TAT:w/o asset'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT:with asset', 'islist': false, 'content': this.reportData['data']['card']['TAT:with asset'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT:Total', 'islist': false, 'content': this.reportData['data']['card']['TAT'] }];
            this.reportData['showCard'] = false;
            this.reportData['showReqTab'] = false;
            this.reportData['Table'] = this.reportData['data']['Request Summary'];
            this.reportData['selfReqTable'] = this.reportData['data']['Porter TAT'];
            this.reportData['selfReqTableCol'] = [];
            this.reportData['TableColumns'] = [];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            if (this.reportData['selfReqTable'].length > 0) {
              this.reportData['selfReqTableCol'] = Object.keys(this.reportData['selfReqTable'][0]);
              this.reportData['showReqTab'] = true;
            }
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['selfReqTable'];
            this.reportData['excelData'][1] = this.reportData['Table'];
          }
        });
      }
    } else if (id == 'porter-waitlist') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.reportData['showWaitlistSumTable'] = false;
        this.reportData['showWaitlistDetTable'] = false;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['hourlyWaitlist'] = [res.results['data']['waitlist_chart']['#ofIdle Porters'], res.results['data']['waitlist_chart']['#ofWaitlists']];
            this.reportData['waitlistSumTable'] = res.results['data']['idle_wl_bypool'];
            this.reportData['waitlistDetTable'] = res.results['data']['idle_inactive_byporter'];
            this.reportData['waitlistSumCol'] = [];
            this.reportData['waitlistDetCol'] = [];
            if (this.reportData['waitlistSumTable'].length > 0) {
              this.reportData['waitlistSumCol'] = Object.keys(this.reportData['waitlistSumTable'][0]);
              this.reportData['showWaitlistSumTable'] = true;
            }
            if (this.reportData['waitlistDetTable'].length > 0) {
              this.reportData['waitlistDetCol'] = Object.keys(this.reportData['waitlistDetTable'][0]);
              this.reportData['showWaitlistDetTable'] = true;
            }
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'hourlyWaitlist', 'type': 'grouped', 'data': this.reportData['hourlyWaitlist'], 'label': res.results['data']['waitlist_chart']['label'], 'title': 'Hourly Waitlist', 'showTitle': true, 'barLabel': ['#ofIdle Porters', '#ofWaitlists'] });
            this.reportData['enablepdf'] = true;
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['waitlistSumTable'];
            this.reportData['excelData'][1] = this.reportData['waitlistDetTable'];
          }
        });
      }
    } else if (id == 'porter-daily-tat') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      this.reportData['showArriveTable'] = false;
      this.reportData['showCompTable'] = false;
      this.reportData['showTatTable'] = false;
      this.reportData['showIdleTable'] = false;
      this.reportData['showHourlyTable'] = false;
      this.reportData['showLeastReqTable'] = false;
      this.reportData['showMostReqTable'] = false;
      this.reportData['showPoolWiseTable'] = false;
      this.reportData['showAcceptTable'] = false;
      this.reportData['showSelfReqTable'] = false;
      this.reportData['showPorterHighArrTable'] = false;
      this.reportData['showporterHighTatTable'] = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&ctypes=' + this.selectedCategoryType.value;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['repData'] = res.results['data'];
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 7, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Create to Complete', 'islist': false, 'content': res.results.data['Card']['TAT: Create to Complete'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Arrive to Complete', 'islist': false, 'content': res.results.data['Card']['TAT: Arrive to Complete'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Waitlist', 'islist': false, 'content': res.results.data['Card']['Wait lists'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Reject', 'islist': false, 'content': res.results.data['Card']['Rejected'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancelled', 'islist': false, 'content': res.results.data['Card']['Cancelled'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Noresponse', 'islist': false, 'content': res.results.data['Card']['No response'] }
            ];
            this.reportData['showCard'] = true;
            this.reportData['arriveTable'] = res.results['data']['High Arrival time:'];
            this.reportData['compTable'] = res.results['data']['High Completion time:'];
            this.reportData['tatTable'] = res.results['data']['Higher TAT:'];
            this.reportData['idleTable'] = res.results['data']['High Idle:'];
            this.reportData['hourlyTable'] = res.results['data']['HourlyRequests'];
            this.reportData['leastReqTable'] = res.results['data']['Low request movement:'];
            this.reportData['mostReqTable'] = res.results['data']['Most request movement:'];
            this.reportData['poolWiseTable'] = res.results['data']['Poolwise'];
            this.reportData['acceptTable'] = res.results['data']['Accept to complete less than 3mins:'];
            this.reportData['selfReqTable'] = res.results['data']['Self request more than 15mins:'];
            this.reportData['porterHighArrTable'] = res.results['data']['Porter High Arrival'];
            this.reportData['porterHighTatTable'] = res.results['data']['Porter High TAT'];
            this.reportData['arriveTableCol'] = [];
            this.reportData['compTableCol'] = [];
            this.reportData['tatTableCol'] = [];
            this.reportData['idleTableCol'] = [];
            this.reportData['hourlyRequestCol'] = [];
            this.reportData['leastReqTableCol'] = [];
            this.reportData['mostReqTableCol'] = [];
            this.reportData['poolWiseTableCol'] = [];
            this.reportData['acceptTableCol'] = [];
            this.reportData['selfReqTableCol'] = [];
            this.reportData['porterHighArrTableCol'] = [];
            this.reportData['porterHighTatTableCol'] = [];
            if (this.reportData['arriveTable'].length > 0) {
              this.reportData['arriveTableCol'] = Object.keys(this.reportData['arriveTable'][0]);
              this.reportData['showArriveTable'] = true;
            }
            if (this.reportData['compTable'].length > 0) {
              this.reportData['compTableCol'] = Object.keys(this.reportData['compTable'][0]);
              this.reportData['showCompTable'] = true;
            }
            if (this.reportData['tatTable'].length > 0) {
              this.reportData['tatTableCol'] = Object.keys(this.reportData['tatTable'][0]);
              this.reportData['showTatTable'] = true;
            }
            if (this.reportData['idleTable'].length > 0) {
              this.reportData['idleTableCol'] = Object.keys(this.reportData['idleTable'][0]);
              this.reportData['showIdleTable'] = true;
            }
            if (this.reportData['hourlyTable'].length > 0) {
              this.reportData['hourlyRequestCol'] = Object.keys(this.reportData['hourlyTable'][0]);
              this.reportData['showHourlyTable'] = true;
            }
            if (this.reportData['leastReqTable'].length > 0) {
              this.reportData['leastReqTableCol'] = Object.keys(this.reportData['leastReqTable'][0]);
              this.reportData['showLeastReqTable'] = true;
            }
            if (this.reportData['mostReqTable'].length > 0) {
              this.reportData['mostReqTableCol'] = Object.keys(this.reportData['mostReqTable'][0]);
              this.reportData['showMostReqTable'] = true;
            }
            if (this.reportData['poolWiseTable'].length > 0) {
              this.reportData['poolWiseTableCol'] = Object.keys(this.reportData['poolWiseTable'][0]);
              this.reportData['showPoolWiseTable'] = true;
            }
            if (this.reportData['acceptTable'].length > 0) {
              this.reportData['acceptTableCol'] = Object.keys(this.reportData['acceptTable'][0]);
              this.reportData['showAcceptTable'] = true;
            }
            if (this.reportData['selfReqTable'].length > 0) {
              this.reportData['selfReqTableCol'] = Object.keys(this.reportData['selfReqTable'][0]);
              this.reportData['showSelfReqTable'] = true;
            }
            if (this.reportData['porterHighArrTable'].length > 0) {
              this.reportData['porterHighArrTableCol'] = Object.keys(this.reportData['porterHighArrTable'][0]);
              this.reportData['showPorterHighArrTable'] = true;
            }
            if (this.reportData['porterHighTatTable'].length > 0) {
              this.reportData['porterHighTatTableCol'] = Object.keys(this.reportData['porterHighTatTable'][0]);
              this.reportData['showporterHighTatTable'] = true;
            }
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['arriveTable'];
            this.reportData['excelData'][1] = this.reportData['compTable'];
            this.reportData['excelData'][2] = this.reportData['tatTable'];
            this.reportData['excelData'][3] = this.reportData['idleTable'];
            this.reportData['excelData'][4] = this.reportData['hourlyTable'];
            this.reportData['excelData'][5] = this.reportData['leastReqTable'];
            this.reportData['excelData'][6] = this.reportData['mostReqTable'];
            this.reportData['excelData'][7] = this.reportData['poolWiseTable']
            this.reportData['excelData'][8] = this.reportData['acceptTable'];
            this.reportData['excelData'][9] = this.reportData['selfReqTable'];
            this.reportData['excelData'][10] = this.reportData['porterHighArrTable'];
            this.reportData['excelData'][11] = this.reportData['porterHighTatTable'];
          }
        })
      }
    } else if (id == 'port-esc-data') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          this.reportData['catTable'] = [];
          if (res.results.statusCode == 200) {
            this.reportData['catTable'] = res.results.data['Porter Escalation by Category'];
          }
        })
      }
    } else if (id == 'hk-summary') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['data'] = res.results.data;
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 5, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porters', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned to Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] }
            ];
            this.reportData['showCard'] = true;
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'hourlyRequests', 'type': 'grouped', 'data': [this.reportData['data']['timewise']['data']['Requested'], this.reportData['data']['timewise']['data']['Cancelled']], 'label': this.reportData['data']['timewise']['label'], 'title': 'Hourly Requests', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            this.reportData['datewiseTable'] = this.reportData['data']['Date wise summary'];
            this.reportData['porterIndTable'] = this.reportData['data']['Porter Individual Performance'];
            this.reportData['porterDetailTable'] = this.reportData['data']['Porter Detail'];
            this.reportData['datewiseTableCol'] = [];
            this.reportData['porterIndTableCol'] = [];
            this.reportData['porterDetailTableCol'] = [];
            if (this.reportData['datewiseTable'].length > 0) {
              this.reportData['datewiseTableCol'] = Object.keys(this.reportData['datewiseTable'][0]);
              this.reportData['showDatewiseTable'] = true;
            }
            if (this.reportData['porterIndTable'].length > 0) {
              this.reportData['porterIndTableCol'] = Object.keys(this.reportData['porterIndTable'][0]);
              this.reportData['showPorterIndTable'] = true;
            }
            if (this.reportData['porterDetailTable'].length > 0) {
              this.reportData['porterDetailTableCol'] = Object.keys(this.reportData['porterDetailTable'][0]);
              this.reportData['showPorterDetailTable'] = true;
            }
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['datewiseTable'];
            this.reportData['excelData'][1] = this.reportData['porterIndTable'];
            this.reportData['excelData'][2] = this.reportData['porterDetailTable'];
          }
        })
      }
    } else if (id == 'bk-summary') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['data'] = res.results.data;
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 5, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porters', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned to Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] },
            ];
            this.reportData['showCard'] = true;
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'hourlyRequests', 'type': 'grouped', 'data': [this.reportData['data']['timewise']['data']['Requested'], this.reportData['data']['timewise']['data']['Cancelled']], 'label': this.reportData['data']['timewise']['label'], 'title': 'Hourly Requests', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            this.reportData['datewiseTable'] = this.reportData['data']['Date wise summary'];
            this.reportData['porterIndTable'] = this.reportData['data']['Porter Individual Performance'];
            this.reportData['porterDetailTable'] = this.reportData['data']['Porter Detail'];
            this.reportData['datewiseTableCol'] = [];
            this.reportData['porterIndTableCol'] = [];
            this.reportData['porterDetailTableCol'] = [];
            if (this.reportData['datewiseTable'].length > 0) {
              this.reportData['datewiseTableCol'] = Object.keys(this.reportData['datewiseTable'][0]);
              this.reportData['showDatewiseTable'] = true;
            }
            if (this.reportData['porterIndTable'].length > 0) {
              this.reportData['porterIndTableCol'] = Object.keys(this.reportData['porterIndTable'][0]);
              this.reportData['showPorterIndTable'] = true;
            }
            if (this.reportData['porterDetailTable'].length > 0) {
              this.reportData['porterDetailTableCol'] = Object.keys(this.reportData['porterDetailTable'][0]);
              this.reportData['showPorterDetailTable'] = true;
            }
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['datewiseTable'];
            this.reportData['excelData'][1] = this.reportData['porterIndTable'];
            this.reportData['excelData'][2] = this.reportData['porterDetailTable'];
          }
        })
      }
    } else if (id == 'sc-summary') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['data'] = res.results.data;
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '100px', 'col': 5, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Porters', 'islist': false, 'content': res.results.data['Card']['Total Porter'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'islist': false, 'content': res.results.data['Card']['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Completed', 'islist': false, 'content': res.results.data['Card']['Total Completed'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Cancellation', 'islist': false, 'content': res.results.data['Card']['Total Cancellation'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'TAT: Assigned to Complete', 'islist': false, 'content': res.results.data['Card']['Avg.TAT'] }
            ];
            this.reportData['showCard'] = true;
            this.ChartService.drawChart({ 'id': id, 'canvasId': 'hourlyRequests', 'type': 'grouped', 'data': [this.reportData['data']['timewise']['data']['Requested'], this.reportData['data']['timewise']['data']['Cancelled']], 'label': this.reportData['data']['timewise']['label'], 'title': 'Hourly Requests', 'showTitle': true, 'barLabel': ['Requested', 'Cancelled'] });
            this.reportData['datewiseTable'] = this.reportData['data']['Date wise summary'];
            this.reportData['porterIndTable'] = this.reportData['data']['Porter Individual Performance'];
            this.reportData['porterDetailTable'] = this.reportData['data']['Porter Detail'];
            this.reportData['datewiseTableCol'] = [];
            this.reportData['porterIndTableCol'] = [];
            this.reportData['porterDetailTableCol'] = [];
            if (this.reportData['datewiseTable'].length > 0) {
              this.reportData['datewiseTableCol'] = Object.keys(this.reportData['datewiseTable'][0]);
              this.reportData['showDatewiseTable'] = true;
            }
            if (this.reportData['porterIndTable'].length > 0) {
              this.reportData['porterIndTableCol'] = Object.keys(this.reportData['porterIndTable'][0]);
              this.reportData['showPorterIndTable'] = true;
            }
            if (this.reportData['porterDetailTable'].length > 0) {
              this.reportData['porterDetailTableCol'] = Object.keys(this.reportData['porterDetailTable'][0]);
              this.reportData['showPorterDetailTable'] = true;
            }
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['datewiseTable'];
            this.reportData['excelData'][1] = this.reportData['porterIndTable'];
            this.reportData['excelData'][2] = this.reportData['porterDetailTable'];
          }
        })
      }
    } else if (id == 'porter-jb-dtat' || id == 'porter-jb-wtat') {
      this.reportData['enableexcel'] = false;
      this.reportData['enablepdf'] = false;
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['data'] = res.results.data;
            this.reportData['data']['headers'] = Object.keys(this.reportData['data']['header-name'])
            this.reportData['excelData'] = [];
            this.reportData['excelSheet'] = [];
            for (let i in this.reportData['data']['headers']) {
              let headerName = this.reportData['data']['headers'][i]
              this.reportData['excelData'][i] = this.reportData['data'][headerName];
              this.reportData['excelSheet'][i] = this.reportData['data']['header-name'][headerName];
            }
            this.reportData['enableexcel'] = true;
            this.reportData['enablepdf'] = false;
          }
        });
      }
    } else if (id == 'porter-req-det') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['data'] = res.results.data;
            this.reportData['tableDat'] = this.reportData['data']['Porter Detail by Category'];
            this.reportData['enableexcel'] = true;
            this.reportData['enablepdf'] = false;
            this.reportData['excelData'] = [];
            this.reportData['excelName'] = [];
            res.results.data['Porter Detail by Category'].forEach((element, index) => {
              this.reportData['excelName'][index] = element['Category'];
              this.reportData['excelData'][index] = element['children'];
            });
          }
        })
      }
    } else if (id == 'porter-pharmacy') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['tableData'] = res.results.data['Pharmacy Movement'];
            this.reportData['tableView'] = true;
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['tableData'];
            this.reportData['excelData'][1] = [];
            for (let i = 0; i < this.reportData['tableData'].length; i++) {
              for (let j = 0; j < this.reportData['tableData'][i]['children'].length; j++) {
                this.reportData['excelData'][1].push(Object.assign({}, this.reportData['excelData'][0][i], this.reportData['excelData'][0][i].children[j]));
              }
            }
          }
        })
      }
    } else if (id == 'multi-porter') {
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else {
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200) {
            this.reportData['tableData'] = res.results.data['Multiporter'];
            this.reportData['tableView'] = true;
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['tableData'];
            this.reportData['excelData'][1] = [];
            for (let i = 0; i < this.reportData['tableData'].length; i++) {
              for (let j = 0; j < this.reportData['tableData'][i]['children'].length; j++) {
                this.reportData['excelData'][1].push(Object.assign({}, this.reportData['excelData'][0][i], this.reportData['excelData'][0][i].children[j]));
              }
            }
          }
        })
      }
    } else if (id == 'porter-delay-byloc') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['repData'] = res.results['data'];

            this.reportData['showIPDelay_ByLocationTable'] = false;
            this.reportData['IPDelay_ByLocationTable'] = res.results['data']['IPDelay_ByLocation'];
            this.reportData['IPDelay_ByLocationTableCol'] = [];
            if (this.reportData['IPDelay_ByLocationTable'].length > 0) {
              this.reportData['IPDelay_ByLocationTableCol'] = Object.keys(this.reportData['IPDelay_ByLocationTable'][0]);
              this.reportData['showIPDelay_ByLocationTable'] = true;
            }

            this.reportData['showIPOPDelay_ByLocationTable'] = false;
            this.reportData['IPOPDelay_ByLocationTable'] = res.results['data']['IPOPDelay_ByLocation'];
            this.reportData['IPOPDelay_ByLocationTableCol'] = [];
            if (this.reportData['IPOPDelay_ByLocationTable'].length > 0) {
              this.reportData['IPOPDelay_ByLocationTableCol'] = Object.keys(this.reportData['IPOPDelay_ByLocationTable'][0]);
              this.reportData['showIPOPDelay_ByLocationTable'] = true;
            }

            this.reportData['showOPDelay_ByLocationTable'] = false;
            this.reportData['OPDelay_ByLocationTable'] = res.results['data']['OPDelay_ByLocation'];
            this.reportData['OPDelay_ByLocationTableCol'] = [];

            if (this.reportData['OPDelay_ByLocationTable'].length > 0) {
              this.reportData['OPDelay_ByLocationTableCol'] = Object.keys(this.reportData['OPDelay_ByLocationTable'][0]);
              this.reportData['showOPDelay_ByLocationTable'] = true;
            }
            this.reportData.loading = false;
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = res.results['data']['IPDelay_ByLocation'];
            this.reportData['excelData'][1] = res.results['data']['IPOPDelay_ByLocation'];
            this.reportData['excelData'][2] = res.results['data']['OPDelay_ByLocation'];

          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    } else if (id == 'porter-byloc') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.param).subscribe(res => {
          this.reportData['loading'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['repData'] = res.results['data'];

            this.reportData['showIP_ByDateTable'] = false;
            this.reportData['IP_ByDateTable'] = res.results['data']['IP_ByDate'];
            this.reportData['IP_ByDateTableCol'] = [];
            if (this.reportData['IP_ByDateTable'].length > 0) {
              this.reportData['IP_ByDateTableCol'] = Object.keys(this.reportData['IP_ByDateTable'][0]);
              this.reportData['showIP_ByDateTable'] = true;
            }

            this.reportData['showIP_ByLocationTable'] = false;
            this.reportData['IP_ByLocationTable'] = res.results['data']['IP_ByLocation'];
            this.reportData['IP_ByLocationTableCol'] = [];
            if (this.reportData['IP_ByLocationTable'].length > 0) {
              this.reportData['IP_ByLocationTableCol'] = Object.keys(this.reportData['IP_ByLocationTable'][0]);
              this.reportData['showIP_ByLocationTable'] = true;
            }

            this.reportData['showOP_ByDateTable'] = false;
            this.reportData['OP_ByDateTable'] = res.results['data']['OP_ByDate'];
            this.reportData['OP_ByDateTableCol'] = [];
            if (this.reportData['OP_ByDateTable'].length > 0) {
              this.reportData['OP_ByDateTableCol'] = Object.keys(this.reportData['OP_ByDateTable'][0]);
              this.reportData['showOP_ByDateTable'] = true;
            }

            this.reportData['showOP_ByLocationTable'] = false;
            this.reportData['OP_ByLocationTable'] = res.results['data']['OP_ByLocation'];
            this.reportData['OP_ByLocationTableCol'] = [];
            if (this.reportData['OP_ByLocationTable'].length > 0) {
              this.reportData['OP_ByLocationTableCol'] = Object.keys(this.reportData['OP_ByLocationTable'][0]);
              this.reportData['showOP_ByLocationTable'] = true;
            }

            this.reportData['showService_ByLocationTable'] = false;
            this.reportData['Service_ByLocationTable'] = res.results['data']['Service_ByLocation'];
            this.reportData['Service_ByLocationTableCol'] = [];
            if (this.reportData['Service_ByLocationTable'].length > 0) {
              this.reportData['Service_ByLocationTableCol'] = Object.keys(this.reportData['Service_ByLocationTable'][0]);
              this.reportData['showService_ByLocationTable'] = true;
            }

            this.reportData.loading = false;
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = res.results['data']['IP_ByDate'];
            this.reportData['excelData'][1] = res.results['data']['IP_ByLocation'];
            this.reportData['excelData'][2] = res.results['data']['OP_ByDate'];
            this.reportData['excelData'][1] = res.results['data']['OP_ByLocation'];
            this.reportData['excelData'][2] = res.results['data']['Service_ByLocation'];

          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
    }
    let selectedData = this.reportList.filter(res => res.link === id);
    this.selected = { 'selectedId': id, 'fromDate': this.fromDate, 'todate': this.toDate, 'type': this.type, 'fromDateTime': this.fromDateTime, 'toDateTime': this.toDateTime, 'name': selectedData[0].name, 'selectedUser': this.selectedUser.value, 'selectedCat': this.selectedCategory.value, 'selectedCatType': this.selectedCategoryType.value };
  }
  getLocationHist(locDat) {
    if (locDat && locDat.hasOwnProperty('Location History')) {
      let data = locDat['Location History'];
      const dialogRef = this.dialog.open(LocationHistComponent, {
        width: '95%', data: data, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.idleSummaryClosed = true;
      });
    }
  }
  getActivityCat() {
    this.CommonService.getAppTerms('PoolName').subscribe(res => this.ActivityCategory = res.results);
  }
  getUserByTypeCheck(val) {
    this.staffSub.next(val);
  }
  getUserByType(val) {
    let searchList = '';
    searchList += val.target.value;
    if (searchList.length >= 3) {
      this.CommonService.searchDoctor(val.target.value, 'UT_PORTER', 'RO-PO').subscribe(res => {
        if (res.results.length == 0) {
        }
        this.userList = res.results;
      });
    } else {
      this.selectedUser.setValue(null)
      this.userList = [];
    }
  }
  setUserName(id) {
    this.selectedUser.setValue(id)
  }
  validate(sDate: string, eDate: string) {
    this.validDate = true;
    if ((sDate != null && eDate != null) && (eDate < sDate)) {
      this.validDate = false;
      this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
    }
    let sdate: any = new Date(sDate);
    let tdate: any = new Date(eDate);
    if (this.activate_btn.find(data => data === 'BT_RPTDA') === undefined) {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      const diffDays = Math.round(Math.abs((sdate - tdate) / oneDay));
      if (diffDays > 10) {
        this.validDate = false;
        this.reportData['invalidDateMessage'] = "Please Select Fromdate & Todate between Ten Days. If any Queries Contact Admin"
      }
    }
    return this.validDate;
  }
  getLocationlist(id) {
    let searchList = '';
    searchList += id.target.value;
    if (searchList.length >= 2) {
      this.configurationService.getLocationData(id.target.value).subscribe(res => {
        if (res.results.length == 0) {
        }
        this.locationlist = res.results;
      });
    } else {
      this.selectedLocation.setValue(null)
      this.locationlist = [];
    }
  }
  setLocationID(id) {
    this.selectedLocation.setValue(id)
    this.locationlist = [];
  }
  selectedActivityCategory(data) {
    this.selectedCategory.setValue(data)
  }
  idleSummary(label) {
    // let idleList = this.reportData['data']['poters_Idle'].filter(resFilter => resFilter.Time === label);
    // idleList.sort((a, b) => (a['IdleTime(mins)'] > b["IdleTime(mins)"] ? -1 : 1));
    // let data = idleList;
    let data = this.reportData['IdlePorters_by_hour'].filter(resFilter => resFilter.hasOwnProperty(label));
    if (data.length) {
      data['idlePorterDet'] = data[0][label];
      data['label'] = label;
    } else {
      data = null;
    }
    if (this.idleSummaryClosed) {
      this.idleSummaryClosed = false;
      const dialogRef = this.dialog.open(PorterIdletimeSummaryComponent, {
        data: data, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.idleSummaryClosed = true;
      });
    }
  }
  inputChanged() {
    this.fromDate = this.datepipe.transform(this.reportForm.controls.fromDateTime.value, 'yyyy-MM-dd');
    this.toDate = this.datepipe.transform(this.reportForm.controls.toDateTime.value, 'yyyy-MM-dd');
    this.fromDateTime = this.datepipe.transform(this.reportForm.controls.fromDateTime.value, 'yyyy-MM-dd HH:mm');
    this.toDateTime = this.datepipe.transform(this.reportForm.controls.toDateTime.value, 'yyyy-MM-dd HH:mm');
  }
  downloadExcel() {
    let excelData: any;
    let name = this.selected['name'];
    let transpose = false;
    if (this.selected['selectedId'] == 'othreq-move' || this.selected['selectedId'] == 'patientmove' || this.selected['selectedId'] == 'porter-req-summary' || this.selected['selectedId'] == 'porter-req-summary-bycat' || this.selected['selectedId'] == 'asset-move') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      if (this.selected['selectedId'] == 'patientmove') {
        excelData[1] = ['Movement Summary', 'Locationwise Movement','Daywise Summary'];
      } else if (this.selected['selectedId'] == 'porter-req-summary') {
        excelData[0].push(this.reportData['porterPoolTable']);
        excelData[1] = ['Porter Request Summary','Movement Summary', 'Locationwise Movement', 'Datewise Summary', 'Porter Individual Performance', 'Porter Hourly Idle Summary', 'Porter Pool Summary'];
      } else if (this.selected['selectedId'] == 'porter-req-summary-bycat') {
        excelData[1] = ['Movement Summary', 'Locationwise Movement', 'Datewise Summary'];
      } else if (this.selected['selectedId'] == 'asset-move') {
        excelData[1] = ['Movement Summary', 'Locationwise Movement'];
      } else {
        excelData[1] = ['Movement Summary', 'Locationwise Movement'];
      }
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-ind-perf') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = ['Porter Performance Summary', 'Porter Idle Summary'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'port-nav-data') {
      excelData = this.reportData['Table'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-perf') {
      excelData = this.reportData['locationwiseTable'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-selfreq-summary') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = ['Porter TAT', 'Porter Request Summary'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-waitlist') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = ['Waitlist Summary', 'Waitlist Detail'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-daily-tat') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = [this.reportData['repData']['header-name']['High Arrival time'], this.reportData['repData']['header-name']['High Completion time'], this.reportData['repData']['header-name']['Higher TAT'], this.reportData['repData']['header-name']['High Idle'], this.reportData['repData']['header-name']['HourlyRequests'], this.reportData['repData']['header-name']['Low request movement'],
      this.reportData['repData']['header-name']['Most request movement'], this.reportData['repData']['header-name']['Poolwise'], this.reportData['repData']['header-name']['Accept to complete less than 3mins'], this.reportData['repData']['header-name']['Self request more than 15mins'], this.reportData['repData']['header-name']['Porter High Arrival'], this.reportData['repData']['header-name']['Porter High TAT']];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-delay-byloc') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = [this.reportData['repData']['header-name']['IPDelay_ByLocation'], this.reportData['repData']['header-name']['IPOPDelay_ByLocation'], this.reportData['repData']['header-name']['OPDelay_ByLocation']];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-byloc') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = [this.reportData['repData']['header-name']['IP_ByDate'], this.reportData['repData']['header-name']['IP_ByLocation'], this.reportData['repData']['header-name']['OP_ByDate'], this.reportData['repData']['header-name']['OP_ByLocation'], this.reportData['repData']['header-name']['Service_ByLocation']];

      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-jb-dtat' || this.selected['selectedId'] == 'porter-jb-wtat') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = this.reportData['excelSheet'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'hk-summary' || this.selected['selectedId'] == 'bk-summary' || this.selected['selectedId'] == 'sc-summary') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = ['Datewise Summary', 'Porter Individual Performance', 'Porter Detail'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-req-det') {
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      excelData[1] = this.reportData['excelName'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else if (this.selected['selectedId'] == 'porter-pharmacy') {
      name = 'Porter Pharmacy Movement'
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      for (let i = 0; i < excelData[0][0].length; i++) {
        delete excelData[0][0][i]['children']
        delete excelData[0][0][i]['close']
      }
      for (let i = 0; i < excelData[0][1].length; i++) {
        delete excelData[0][1][i]['children']
      }
      excelData[1] = ['Porter Pharmacy Movement summary', 'Porter Pharmacy Movement details']
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
      this.getReports('porter-pharmacy');
    } else if (this.selected['selectedId'] == 'multi-porter') {
      name = 'Multi Porter Details Report';
      excelData = [];
      excelData[0] = this.reportData['excelData'];
      for (let i = 0; i < excelData[0][0].length; i++) {
        delete excelData[0][0][i]['children']
      }
      for (let i = 0; i < excelData[0][1].length; i++) {
        delete excelData[0][1][i]['children']
      }
      excelData[1] = ['Multi Porter Summary', 'Multi Porter Details']
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
      this.getReports('multi-porter');
    }
    else if (this.reportData.length || this.reportData != null) {
      excelData = this.reportData['Table'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId'],null,null,this.selected['fromDate'],this.selected['todate']);
    } else {
      excelData = [];
    }
  }
  downloadPDF() {
    let pdfData: any;
    if (this.reportData.length || this.reportData != null) {
      let chartImage = [];
      let name = this.selected['name'];
      let addInfo: any;
      pdfData = this.reportData;
      // if (this.selected['selectedId'] == 'patientmove') {
      // name = 'Patient Movement Report';
      // chartImage = [document.getElementById('porterMovement') ,document.getElementById('porterTimewiseMovement')];
      // } 
      if (this.selected['selectedId'] == 'patientmove') {
        chartImage = [document.getElementById('otherTimewiseMovement')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-req-summary') {
        chartImage = [document.getElementById('assetCaterywiseSum'), document.getElementById('poolwiseSum'), document.getElementById('requestCategorywiseSum'), document.getElementById('otherTimewiseMovement'), document.getElementById('porterWaitlist')];
        addInfo = { "fromDate": this.selected['fromDateTime'], "toDate": this.selected['toDateTime'] };
      } else if (this.selected['selectedId'] == 'porter-req-summary-bycat') {
        chartImage = [document.getElementById('assetCaterywiseSum'), document.getElementById('poolwiseSum'), document.getElementById('otherTimewiseMovement'), document.getElementById('porterWaitlist')];
        addInfo = { "fromDate": this.selected['fromDateTime'], "toDate": this.selected['toDateTime'] };
      } else if (this.selected['selectedId'] == 'asset-move') {
        chartImage = [document.getElementById('otherTimewiseMovement'), document.getElementById('porterWaitlist')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'othreq-move') {
        chartImage = [document.getElementById('otherTimewiseMovement'), document.getElementById('porterWaitlist')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-perf') {
        chartImage = [document.getElementById('requestPatient'), document.getElementById('requestAsset'), document.getElementById('requestOthers'), document.getElementById('avgCompletion'), document.getElementById('avgAttend'), document.getElementById('avgComplete'), document.getElementById('hrReq')];
        this.reportData['TableColumns'] = [];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-byward') {
        chartImage = [document.getElementById('reqCountByCategory'), document.getElementById('timewiseReq')];
      } else if (this.selected['selectedId'] == 'porter-perf-trend') {
        chartImage = [document.getElementById('porterRequest'), document.getElementById('tatLineChart')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-daily') {
        chartImage = [document.getElementById('callToArrive'), document.getElementById('callToComplete')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-req-perf') {
        this.reportData['TableColumns'] = [];
        chartImage = [document.getElementById('reqToWait'), document.getElementById('escalation')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'porter-waitlist') {
        this.reportData['TableColumns'] = [];
        chartImage = [document.getElementById('hourlyWaitlist')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      } else if (this.selected['selectedId'] == 'hk-summary' || this.selected['selectedId'] == 'bk-summary' || this.selected['selectedId'] == 'sc-summary') {
        this.reportData['TableColumns'] = [];
        chartImage = [document.getElementById('hourlyRequests')];
        addInfo = { "fromDate": this.selected['fromDate'], "toDate": this.selected['todate'] };
      }
      this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage, addInfo);
    } else {
      pdfData = [];
    }
  }

  reportHeaderAction(event) {
    if (event.key === 'report') {
      this.HCselected = event.data.link;
      console.log(this.HCselected , event.data.link)
      // this.fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), 'yyyy-MM-dd');
      this.fromDateNew = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), 'yyyy-MM-dd');
      // this.toDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
      // this.fromDateTime = this.datepipe.transform(this.today, 'yyyy-MM-dd 00:00');
      // this.toDateTime = this.datepipe.transform(this.today, 'yyyy-MM-dd 23:59');
      this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
      { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
      if (this.HCselected != 'porter-perf' && this.HCselected != 'porter-byward' && this.HCselected != 'porter-delay-byloc' &&
        this.HCselected != 'porter-byloc' && this.HCselected != 'porter-ind-perf' && this.HCselected != 'othreq-move' &&
        this.HCselected != 'porter-req-summary' && this.HCselected != 'asset-move' && this.HCselected != 'patientmove' &&
        this.HCselected != 'porter-perf-trend' && this.HCselected != 'port-nav-data' && this.HCselected != 'porter-daily' &&
        this.HCselected != 'porter-req-perf' && this.HCselected != 'porter-selfreq-summary' && this.HCselected != 'porter-req-summary-bycat' &&
        this.HCselected != 'porter-waitlist' && this.HCselected != 'porter-daily-tat' && this.HCselected != 'port-esc-data' &&
        this.HCselected != 'hk-summary' && this.HCselected != 'bk-summary' && this.HCselected != 'sc-summary' && this.HCselected != 'porter-req-det' && this.HCselected != 'porter-req-summary-v1' &&
        this.HCselected != 'porter-pharmacy' && this.HCselected != 'multi-porter' && this.HCselected != 'porter-jb-dtat' && this.HCselected != 'porter-jb-wtat') {
        this.filterInputs.push({ name: "reportDate", id: "tdt", label: "Report Date", seq: 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd') });
      } else if (this.HCselected == 'porter-req-summary' || this.HCselected == 'porter-req-summary-bycat') {
        this.filterInputs.push({ name: "fromDateTime", id: "fdt", label: "From Date Time", seq: 2, default: this.datepipe.transform(this.fromDateTime, 'yyyy-MM-dd HH:MM') },
          { name: "toDateTime", id: "tdt", label: "To Date Time", seq: 3, default: this.datepipe.transform(this.toDateTime, 'yyyy-MM-dd HH:MM') });
      } else if (this.HCselected == 'porter-perf' || this.HCselected == 'porter-byward' || this.HCselected == 'porter-delay-byloc' || this.HCselected == 'porter-byloc' ||
        this.HCselected == 'porter-ind-perf' || this.HCselected == 'othreq-move' || this.HCselected == 'asset-move' || this.HCselected == 'patientmove' ||
        this.HCselected == 'porter-perf-trend' || this.HCselected == 'port-nav-data' || this.HCselected == 'porter-req-perf' || this.HCselected == 'porter-selfreq-summary' ||
        this.HCselected == 'porter-waitlist' || this.HCselected == 'porter-daily-tat' || this.HCselected == 'port-esc-data' || this.HCselected == 'hk-summary' ||
        this.HCselected == 'bk-summary' || this.HCselected == 'sc-summary' || this.HCselected == 'porter-req-det' || this.HCselected == 'porter-pharmacy' ||
        this.HCselected == 'multi-porter' || this.HCselected == 'porter-jb-dtat' || this.HCselected == 'porter-jb-wtat' || this.HCselected == 'porter-req-summary-v1') {
        this.filterInputs.push({ name: "fromDate", id: "fdt", label: "From Date", seq: 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd') },
          { name: "toDate", id: "tdt", label: "To Date", seq: 3, default: this.datepipe.transform(this.toDate, 'yyyy-MM-dd') });
      } else {
        this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
        { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
      }
      if (this.HCselected == 'porter-req-summary-bycat' || this.HCselected == 'porter-selfreq-summary') {
        this.selectedCatLoc.setValue('All');
        this.selectedActivityCategory('All');
      }
      this.api_name = this.HCselected;
    } else if (event.key === 'fromDate') {
      this.fromDate = event.data;
      this.fromDateNew = event.data;
      const from = this.filterInputs.filter(x => x.name === 'fromDate');
      if (from?.length !== 0) {
        this.filterInputs = this.filterInputs.filter(x => x.name !== 'fromDate');
        this.filterInputs.push({ name: "fromDate", id: "fdt", label: "From Date", seq: 2, default: this.datepipe.transform(event.data, 'yyyy-MM-dd') });
      }
      const report = this.filterInputs.filter(x => x.name === 'reportDate');
      if (report?.length !== 0) {
        this.filterInputs = this.filterInputs.filter(x => x.name !== 'reportDate');
        this.filterInputs.push({ name: "reportDate", id: "tdt", label: "Report Date", seq: 2, default: this.datepipe.transform(event.data, 'yyyy-MM-dd') });
      }
    } else if (event.key === 'toDate') {
      this.toDate = event.data;
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'toDate');
      this.filterInputs.push({ name: "toDate", id: "tdt", label: "To Date", seq: 3, default: this.datepipe.transform(event.data, 'yyyy-MM-dd') });
    } else if (event.key === 'fromDateTime') {
      this.fromDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.fromDateTime = this.datepipe.transform(event.data, 'yyyy-MM-dd HH:mm');
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'fromDateTime');
      this.filterInputs.push({ name: "fromDateTime", id: "fdt", label: "From Date Time", seq: 2, default: this.datepipe.transform(event.data, 'yyyy-MM-dd HH:mm') });
    } else if (event.key === 'toDateTime') {
      this.toDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.toDateTime = this.datepipe.transform(event.data, 'yyyy-MM-dd HH:mm');
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'toDateTime');
      this.filterInputs.push({ name: "toDateTime", id: "tdt", label: "To Date Time", seq: 3, default: this.datepipe.transform(event.data, 'yyyy-MM-dd HH:mm') });
    } else if (event.key === 'groupBy') {
      this.type = event.data;
    } else if (event.key === 'poolName') {
      this.selectedActivityCategory(event.data);
    } else if (event.key === 'poolNames') {
      this.selectedCategoryType.setValue(event.data);
    } else if (event.key === 'poolLocation') {
      this.selectedCatLoc.setValue(event.data);
    } else if (event.key === 'location') {
      if (event.data !== null) {
        this.setLocationID(event.data.id);
        this.locationName = event.data.fullName;
      } else {
        this.locationName = null;
        this.selectedLocation.setValue(null);
      }
    } else if (event.key === 'user') {
      if (event.data !== null) {
        this.setUserName(event.data.id);
        this.userNameId = event.data.name;
      } else {
        this.userNameId = null;
        this.selectedUser.setValue(null);
      }
    } else if (event.key === 'getInsights' || event.key === 'refresh') {
      this.getReports(this.HCselected);
    } else if (event.key === 'excel') {
      this.downloadExcel();
    } else if (event.key === 'pdf') {
      this.downloadPDF();
    }
    if (this.HCselected == 'porter-req-summary-bycat' || this.HCselected == 'porter-selfreq-summary') {
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'poolName' && x.name !== 'poolLocation');
      this.filterInputs.push({ name: "poolName", id: 'poolNameId', label: "Pool Name", seq: 4, default: this.selectedCategory.value });
      this.filterInputs.push({ name: "poolLocation", id: 'poolLocationId', label: "Pool Location", seq: 5, default: this.selectedCatLoc.value });
    } else if (this.HCselected == 'porter-daily-tat') {
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'poolNames');
      this.filterInputs.push({ name: "poolNames", id: 'poolNameId', label: "Pool Name", seq: 4, default: this.selectedCategoryType.value });
    } else if (this.HCselected == 'porter-byward' && !this.reportData['invalidDate']) {
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'location');
      this.filterInputs.push({ name: "location", id: 'locationId', label: "Location", seq: 4, default: this.locationName });
    } else if (this.HCselected == 'porter-perf-trend') {
      this.filterInputs = this.filterInputs.filter(x => x.name !== 'user' && x.name !== 'groupBy');
      this.filterInputs.push({ name: "user", id: 'userId', label: "User", seq: 4, default: this.userNameId },
        { name: "groupBy", id: 'groupById', label: "Group By", seq: 5, default: this.type });
    }
  }
    fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'porter-idletime-summary',
  templateUrl: './porter-idletime-summary.component.html',
  styleUrls: ['./porter-report.component.scss'],
})
export class PorterIdletimeSummaryComponent  {
  public columns: any;
  public enableShow = false;
  public myChart: Chart;
  public mychartConfig = [];
  public labels: any;
  public chartData: any;
  public chartOptions: any;
  public timelineChartData: any;
  public chartKeys: any;
  public label: any;
  public headercolor = '#1e8fc8';
  public pieColour = ['#abdbe3', '#65338B', '#4770B3', '#D21F75', '#3B3689', '#50AED3', '#4BB24F', '#E57438', '#569DD2', '#569D79', '#58595B', '#E4B031', '#84D2F4', '#CAD93F', '#F5C8AF', '#9AC4B3', '#9E9EA2']


  constructor(public thisDialogRef: MatDialogRef<PorterIdletimeSummaryComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public ChartService: ChartService) {
    // if(data.length > 0){
    //   this.columns = Object.keys(data[0]);
    //   this.showTable = true;
    // }

    if (data) {
      this.label = data['label'];
      this.chartKeys = Object.keys(data['idlePorterDet']['chart']);
      this.chartKeys.forEach(element => {
        this.drawChart({ 'id': 'porter-req', 'canvasId': element, 'type': 'pie', 'data': data["idlePorterDet"]["chart"][element].data, 'label': data["idlePorterDet"]["chart"][element].label, 'title': element, 'showTitle': true, 'barLabel': [] });
      });
      this.enableShow = true;
      let chartData = data['idlePorterDet']['dataTimelin'];
      chartData[0] = ["Porter",
        "Duration",
        { role: 'style' },
        "Fromtime",
        "Totime"]
      for (let i = 1; i < chartData.length; i++) {
        chartData[i][1] = '';
        let tmpDate = new Date(chartData[i][3]);
        chartData[i][3] = tmpDate;
        let tmpDate1 = new Date(chartData[i][4]);
        chartData[i][4] = tmpDate1;
      }
      this.timelineChartData = {
        chartType: 'Timeline',
        dataTable: chartData,
        options: {
          'rowLabelStyle': { 'fontSize': 20, 'textAlign': 'left' },
          'height': 300,
          'hAxis': {
            'format': 'HH:mm', // specify the time format for the labels
            'gridlines': {
              'count': -1, // set to -1 to display all time labels
              'units': {
                'hours': { 'format': ['HH:mm'] }
              }
            },
            'position': 'top',
            'minValue': new Date(data['idlePorterDet']['minValue']),
            'maxValue': new Date(data['idlePorterDet']['maxValue'])
          },
        },
      }
    }
  }

  drawChart(chartInfo) {
    this.mychartConfig[chartInfo['canvasId']] = {
      type: 'pie',
      data: {
        labels: chartInfo.label,
        datasets: [{
          data: chartInfo.data,
          backgroundColor: this.pieColour,
        }]
      },
      options: {
        title: {
          display: chartInfo.showTitle,
          text: chartInfo.title,
          fontSize: 14,
          fontFamily: 'Open Sans',
          fontColor: 'black'
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'left'
        }
      }
    };
  }
}

@Component({
  selector: 'porter-location-history',
  templateUrl: './porter-location-history.component.html',
  styleUrls: ['./porter-report.component.scss'],
})
export class LocationHistComponent {
  public tableData: any;
  public tableCol: any;
  public showTable = false;
  constructor(public thisDialogRef: MatDialogRef<LocationHistComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public CommonService: CommonService) {
    if (data) {
      this.getLocationHistoryData(data);
    }
  }
  getLocationHistoryData(locId) {
    let param = '/rqid=' + locId;
    this.CommonService.getReportData('porter-loc', param).subscribe(res => {
      if (res.results.statusCode == 200 && res.results.data != null) {
        this.tableData = res.results.data['Locations History'];
        if (this.tableData.length > 0) {
          this.tableCol = Object.keys(this.tableData[0]);
          this.showTable = true;
        }
      }
    })
  }

}
