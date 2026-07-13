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
import { Component, OnInit } from '@angular/core';
import {ExcelService, PdfService, CommonService, ChartService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-student-report',
  templateUrl: './student-report.component.html',
  styleUrls: ['./student-report.component.scss']
})
export class StudentReportComponent implements OnInit {

    public reportForm: FormGroup;
    public date: any = new Date();
    public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
    public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
    public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    public reportList : any;
    public reportData : any = [];
    public param : any;
    public HCselected = 'school-attendance-bystaff';
    public selectedReport : any = new FormControl();
    today = new Date();
    public selected : any;
    identifier: any = new FormControl();
    validDate: any;
    public activate_btn: any = [];
    constructor(public datepipe: DatePipe, public PdfService: PdfService,
        public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService) {
          this.getReportList();
          this.activate_btn = this.CommonService.getActivePermission('button');
    }
    ngOnInit(){
        this.getAllStudentReports(this.HCselected);
        this.buildForm();
    }
    getReportList() {
      this.reportList = []
      let permissions = JSON.parse(localStorage.getItem('permission'));
      let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
      let submenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_RESTU") : null;
      let tempId = submenusList['id'];
      let replist = permissions['dropdown'].filter(res=> res.parentId == tempId);
      this.reportList = replist;
       const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
        if (firstSeqReport) {
          this.HCselected = firstSeqReport.code;
        }
    }
    public buildForm() {
        this.reportForm = this.fb.group({
          fromDate: [this.fromDate ? this.fromDate : ''],
          toDate: [this.toDate ? this.toDate : ''],
          });
    }
    getAllStudentReports(id){
        this.selectedReport.setValue(id);
        this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
        this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
        this.reportData = [];
        this.reportData.noRecords = false;
        this.reportData.loading = false;
        this.reportData['showTable'] = false;
        this.reportData['showSecondTable'] =  false;
        this.reportData['showCard'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['enablepdf'] = false;
        this.reportData['invalidDate'] = false;
        this.reportData['charts'] = [];
        this.reportData['noError'] = true;
        this.reportData['nullIdentifier'] = false;
        this.reportData['prevselected'] = this.HCselected;

        if(id == 'school-attendance-bystaff'){
            this.validDate=this.validate(this.fromDate,this.toDate);
            if(!this.validDate){
              this.reportData['invalidDate'] = true;
              this.reportData['loading'] = false;
              this.reportData['noRecords'] = true;
            }else{
                this.reportData['param'] =  '/user_id=' + this.identifier.value + '&fdt=' + this.fromDate + '&tdt=' + this.toDate;
                if(this.identifier.value == null || this.identifier.value == ''){
                  this.reportData['nullIdentifier'] = true;
                }
                this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
                  if (res.results.statusCode == 200 && res.results.data != null) {
                    this.reportData.loading = false;
                    this.reportData.noRecords = false;
                    this.reportData.enableexcel = true;
                    this.reportData['fullData'] = res.results.data;
                    res.results.data['Staff Info'][0]['Join_date'] = this.datepipe.transform(res.results.data['Staff Info'][0]['Join_date'], 'dd/MM/yyyy');
                    for(let i = 0; i < res.results.data['Daywise'].length; i++){
                      res.results.data['Daywise'][i]['Attendance Date'] = this.datepipe.transform(res.results.data['Daywise'][i]['Attendance Date'], 'dd/MM/yyyy');
                      res.results.data['Daywise'][i]['Check-in'] = this.datepipe.transform(res.results.data['Daywise'][i]['Check-in'], 'dd/MM/yyyy HH : mm : ss');
                      res.results.data['Daywise'][i]['Checkout'] = this.datepipe.transform(res.results.data['Daywise'][i]['Checkout'], 'dd/MM/yyyy HH : mm : ss');
                      res.results.data['Daywise'][i]['Active HRs'] = this.datepipe.transform(res.results.data['Daywise'][i]['Active HRs'], 'HH : mm : ss');
                    }
                    this.reportData['Table'] = res.results.data['Daywise'];
                    this.reportData['TableColumns'] = [];
                    if(this.reportData['Table'].length > 0){
                      this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
                      this.reportData['showTable'] = true;
                    }
                  this.reportData['cardInfo'] = {'width':'100%', 'height':'100px','col':3,'gutterSize':'0px'};
                  this.reportData['tileInfo'] = [
                  {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Leave Taken','content':this.reportData['fullData']['Staff Agg'][0]['strength']},
                  {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Strength','content':this.reportData['fullData']['Staff Agg'][0]['leave_days']},
                  {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average working Hours','content':this.reportData['fullData']['Staff Agg'][0]['avg_hours']}];
                  this.reportData['info'] = res.results.data['Staff Info'][0];
                  this.reportData['showCard'] = true;
                  } else {
                    this.reportData.noRecords = true;
                    this.reportData.loading = false;
                  } 
                })
            }
        }else if(id == 'school-staff-attendance'){
            this.param = '/fdt=' + this.toDate;
            this.CommonService.getReportData(id,this.param).subscribe(res => { 
              this.reportData.loading=false;
              if(res.results.statusCode == 200 && res.results.data != null)
              {
                this.reportData['totalStaffs'] = res.results.data['Staff Count'][0]['Total Staffs'];
                this.reportData['absenteesPercentage'] = res.results.data['Absent%'][0]['Absent%'];
                this.reportData['averageIdleTime'] = res.results.data['Staff Count'][0]['Avg idle time'];
                this.reportData['staffsInOutStatus'] = res.results.data['byStatus'][0];
                this.reportData['byType'] = res.results.data['byType'];
                this.reportData['byDept'] = res.results.data['byDept'];
                this.reportData['byGender'] = res.results.data['byGender'];
                this.reportData['byDuration'] = res.results.data['byDuration'];
                this.reportData['timewise'] = res.results.data['timewise'];
                this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':4,'gutterSize':'0px'};
                this.reportData['tileInfo'] = [
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Staffs','content':this.reportData['totalStaffs']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staffs Present','content':res.results.data['byStatus'][0]['Staff In']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staffs On Leave','content':res.results.data['byStatus'][0]['Staff Out']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Absentees Percentage','content':res.results.data['Absent%'][0]['Absent%']}];
                this.reportData['showCard'] = true;
                this.reportData['Table'] = res.results.data['Staff Details'];
                this.reportData['TableColumns'] = [];
                  if(this.reportData['Table'].length > 0){
                    this.reportData['TableColumns'] = Object.keys(res.results.data['Staff Details'][0]);
                    this.reportData['showTable'] = true;
                  }
                  this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'staffsByDept','type':'pie','data':this.reportData['byType'].data,'label': this.reportData['byType'].label,'title':'Staffs Present (By Department)','showTitle':false,'barLabel': []});
                  this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'staffsByType','type':'pie','data':this.reportData['byDept'].data,'label': this.reportData['byDept'].label,'title':'Staff By Type','showTitle':false,'barLabel': []});
                  this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'staffsByGender','type':'pie','data':this.reportData['byGender'].data,'label': this.reportData['byGender'].label,'title':'Staffs By Gender', 'showTitle':false,'barLabel':[]});
                  this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'staffIdleTime','type':'bar','data':this.reportData['byDuration'].data,'label': this.reportData['byDuration'].label,'title':'Staff Idle Time','showTitle':false,'barLabel': ['Staff Count']});
                  this.reportData.enableexcel = true;
                  this.reportData.enablepdf = true;
              } else{
               this.reportData.noRecords=true;
               this.reportData.loading=false;
               this.reportData.enableexcel = false;
               this.reportData.enablepdf = false;
             }
            });

        }else if(id == 'student-attendance-all'){
            this.validDate=this.validate(this.fromDate,this.toDate);
            if(!this.validDate){
              this.reportData['invalidDate'] = true;
              this.reportData['loading'] = false;
              this.reportData['noRecords'] = true;
            }
            else{
                this.reportData['param'] =  '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
                this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
                  if (res.results.statusCode == 200 && res.results.data != null) {
                    this.reportData.loading = false;
                    this.reportData.enableexcel = true;
                    this.reportData.enablepdf = true;
                    this.reportData['workingHours'] = res.results.data['Staff Agg'][0]['avg_working_hours'];
                    this.reportData['strength'] = res.results.data['Staff Agg'][0]['avg_strength_percent'];
                    this.reportData['leaveTotal'] = res.results.data['Staff Agg'][0]['tot_leave'];
                    this.reportData['deptLabel'] = res.results.data['Deptwise'].map(value => value.Department);
                    this.reportData['deptPresent%'] = res.results.data['Deptwise'].map(value => value['Present%']);
                    this.ChartService.drawChart({'canvasId':'deptAttAll','type':'bar','data':this.reportData['deptPresent%'],'label': this.reportData['deptLabel'],'title':'By Department','showTitle':true,'barLabel': ['Dept']});
                    this.reportData['Table'] = res.results.data['Daywise'];
                    this.reportData['TableColumns'] = [];
                    if(this.reportData['Table'].length > 0){
                      this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
                      this.reportData['showTable'] = true;
                    }
                  } else {
                    this.reportData.noRecords = true;
                    this.reportData.loading = false;
                  }
                })

            }

        }else if(id == 'student-attendance'){
            this.validDate=this.validate(this.fromDate,this.toDate);
            if(!this.validDate){
              this.reportData['invalidDate'] = true;
              this.reportData['loading'] = false;
              this.reportData['noRecords'] = true;
            }else{
                this.reportData['param'] =  '/user_id=' + this.identifier.value + '&fdt=' + this.fromDate + '&tdt=' + this.toDate;
                if(this.identifier.value == null || this.identifier.value == ''){
                  this.reportData['nullIdentifier'] = true;
                }
                this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
                  if (res.results.statusCode == 200 && res.results.data != null) {
                    this.reportData.loading = false;
                    this.reportData.noRecords = false;
                    this.reportData.enableexcel = true;
                    this.reportData['fullData'] = res.results.data;
                    res.results.data['Staff Info'][0]['Join_date'] = this.datepipe.transform(res.results.data['Staff Info'][0]['Join_date'], 'dd/MM/yyyy');
                    for(let i = 0; i < res.results.data['Daywise'].length; i++){
                      res.results.data['Daywise'][i]['Attendance Date'] = this.datepipe.transform(res.results.data['Daywise'][i]['Attendance Date'], 'dd/MM/yyyy');
                      res.results.data['Daywise'][i]['Check-in'] = this.datepipe.transform(res.results.data['Daywise'][i]['Check-in'], 'dd/MM/yyyy HH : mm : ss');
                      res.results.data['Daywise'][i]['Checkout'] = this.datepipe.transform(res.results.data['Daywise'][i]['Checkout'], 'dd/MM/yyyy HH : mm : ss');
                      res.results.data['Daywise'][i]['Active HRs'] = this.datepipe.transform(res.results.data['Daywise'][i]['Active HRs'], 'HH : mm : ss');
                    }
                    this.reportData['Table'] = res.results.data['Daywise'];
                    this.reportData['TableColumns'] = [];
                    if(this.reportData['Table'].length > 0){
                      this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
                      this.reportData['showTable'] = true;
                    }
                  this.reportData['cardInfo'] = {'width':'100%', 'height':'100px','col':3,'gutterSize':'0px'};
                  this.reportData['tileInfo'] = [
                  {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Leave Taken','content':this.reportData['fullData']['Staff Agg'][0]['leave_days']},
                  {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Class Attendance (hours)','content':this.reportData['fullData']['Staff Agg'][0]['avg_hours']}];
                  this.reportData['info'] = res.results.data['Staff Info'][0];
                  this.reportData['showCard'] = true;
                  } else {
                    this.reportData.noRecords = true;
                    this.reportData.loading = false;
                  } 
                })
            }
        }else if(id == 'student-attendance-byclass'){
            this.validDate=this.validate(this.fromDate,this.toDate);
            if(!this.validDate){
              this.reportData['invalidDate'] = true;
              this.reportData['loading'] = false;
              this.reportData['noRecords'] = true;
            }
            else{
                this.reportData['param'] =  '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
                this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
                  if (res.results.statusCode == 200 && res.results.data != null) {
                    this.reportData.loading = false;
                    this.reportData.enableexcel = true;
                    this.reportData.enablepdf = true;
                    this.reportData['workingHours'] = res.results.data['Staff Agg'][0]['avg_working_hours'];
                    this.reportData['strength'] = res.results.data['Staff Agg'][0]['avg_strength_percent'];
                    this.reportData['leaveTotal'] = res.results.data['Staff Agg'][0]['tot_leave'];
                    this.reportData['deptLabel'] = res.results.data['Deptwise'].map(value => value.Department);
                    this.reportData['deptPresent%'] = res.results.data['Deptwise'].map(value => value['Present%']);
                    this.ChartService.drawChart({'canvasId':'deptAttAll','type':'bar','data':this.reportData['deptPresent%'],'label': this.reportData['deptLabel'],'title':'By Department','showTitle':true,'barLabel': ['Dept']});
                    this.reportData['Table'] = res.results.data['Daywise'];
                    this.reportData['TableColumns'] = [];
                    if(this.reportData['Table'].length > 0){
                      this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
                      this.reportData['showTable'] = true;
                    }
                  } else {
                    this.reportData.noRecords = true;
                    this.reportData.loading = false;
                  }
                })
            }
        }
        this.selected = {'selectedId' : id, 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.identifier.value};
    }
    validate(sDate: string, eDate: string){
        this.validDate = true;
        if((sDate != null && eDate !=null) && (eDate < sDate) ){
          this.validDate = false;
          this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
        }
        let sdate :any = new Date(sDate);
        let tdate  :any = new Date(eDate);
        if(this.activate_btn.find(data => data === 'BT_RPTDA') === undefined){
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const diffDays = Math.round(Math.abs((sdate - tdate) / oneDay));
            if(diffDays>10){
            this.validDate = false;
            this.reportData['invalidDateMessage'] = "Please Select Fromdate & Todate between Ten Days. If any Queries Contact Admin"
            }
        }
        return this.validDate;
    }

    downloadExcel() {
        let excelData : any;
        let name = '';
        let transpose = false;
        if (this.reportData.length || this.reportData != null) {
          name = name+this.selected['selectedId'];
          if(this.selected['selectedId'] == 'school-attendance-bystaff' || this.selected['selectedId'] == 'student-attendance-all' || this.selected['selectedId'] == 'student-attendance'  || this.selected['selectedId'] == 'student-attendance-byclass'){
            name=name+this.fromDate+" TO "+this.toDate;
            excelData =  this.reportData['Table']; 
          } else {
                excelData =  this.reportData['Table'];      
            }
            this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
        }
    }
    downloadPDF() {
        let pdfData : any;
        if (this.reportData.length || this.reportData != null) {
          let chartImage = [];
          let name: string;
          pdfData=this.reportData;
          if (this.selected['selectedId'] == 'school-attendance-bystaff') {
            name = 'Attendance report by staff'
          } else if(this.selected['selectedId'] == 'school-staff-attendance'){
            name = 'Monthly attendance report for all staff';
            chartImage = [document.getElementById('staffsByDept'),document.getElementById('staffsByType') ,document.getElementById('staffsByGender') ,document.getElementById('staffIdleTime')];
          } else if(this.selected['selectedId'] == 'student-attendance-all'){
            name = 'Students attendance report';
            chartImage=[document.getElementById('deptAttAll')];
          } else if(this.selected['selectedId'] == 'student-attendance'){
            name = 'Detailed attendance by Student'
          } else if(this.selected['selectedId'] == 'student-attendance-byclass'){
            name = 'Student class attendance report';
            chartImage=[document.getElementById('deptAttAll')];
          } else {
            name = this.selected['selectedId'];
          }
          this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage);
        }
    }
  fixClick() {
    console.log('')
  }     
}
