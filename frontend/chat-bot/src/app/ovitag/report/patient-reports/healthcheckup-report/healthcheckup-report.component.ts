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

import { Component, OnInit, ViewChild} from '@angular/core';
import {ExcelService, PdfService, CommonService, ChartService } from '../../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as d3 from 'd3';
import { Chart } from 'chart.js';
import 'chartjs-plugin-datalabels';
import { MatOption } from '@angular/material/core';

@Component({
  selector: 'app-healthcheckup-report',
  templateUrl: './healthcheckup-report.component.html',
  styleUrls: ['./healthcheckup-report.component.scss']
})

export class HealthCheckupReportComponent implements OnInit {
  public reportForm: FormGroup;
  public date: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public currentDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public reportList : any;
  public HCselected = 'patient-status';
  public selected : any;
  public reportData : any = [];
  public Uhid:any = new FormControl();
  contactType : string = 'Employee';
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public selectedReport : any = new FormControl();
  public selectedTests: any = new FormControl();
  public selectedLocation: any = new FormControl(); 
  public selectedMinContactTime: any = new FormControl();
  public selectedMaxContactTime: any = new FormControl();
  public selectedStatus: any = new FormControl();
  public selectedBattery: any = new FormControl();
  public selectedAlertCount: any = new FormControl();
  public selectedPackage: any = new FormControl();
  public selectedAge: any = new FormControl();
  public selectedTagtype: any = new FormControl();
  public selectedTagStatus: any = new FormControl();
  public today = new Date();
  public tagTypelist: any[];
  public tagStatuslist: any[];
  public selectedTagTypelist: any;
  public selectedTagStatuslist: any;
  public activate_btn: any = [];
  validDate: any;
  @ViewChild('allSelected') private readonly allSelected: MatOption;
  @ViewChild('allSelectedage') private readonly allSelectedage: MatOption;
  constructor(public datepipe: DatePipe, public PdfService: PdfService,
    public fb: FormBuilder, public excelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService, public pdfService: PdfService) {
      this.activate_btn = this.CommonService.getActivePermission('button');
    this.getReportList();
    }
ngOnInit() {
  this.getHealthCheckupReports(this.HCselected);
  if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
    this.headercolor = localStorage.getItem('userColor');
    this.bgcolor     = localStorage.getItem('userBgColor');
    this.pagebgcolor = localStorage.getItem('userPageBgColor');
  } else {
    this.headercolor = '#3f586a';
    this.bgcolor = '#ffffff';
    this.pagebgcolor = '#ffffff';
  }
  this.buildForm();  
  this.CommonService.getAppTermsVerion2('TagType').subscribe(res => {
    this.tagTypelist = res.results;
    this.selectedTagTypelist="TT-PA";
  });
  this.CommonService.getAppTermsVerion2('Status').subscribe(res => {
    this.tagStatuslist = res.results;
    this.selectedTagStatuslist="ST-AT";
  }); 
 }
 getReportList() {
  let permissions = JSON.parse(localStorage.getItem('permission'));
  let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
  // let submenusList = menuItemsList[0]['subMenus'].filter(res=> res.code== "MN_AIPTS");
  let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTHC") : null;
  let tempId =submenus['id'];
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
formatInputRow(row,column, data) {
  const output = {};
  output[0] = row;
  for (let i = 0; i < data.length; ++i) {
    output[data[i][column]] = data[i][row];
  }
  return output;
}
clearDate() {
  this.reportForm.controls['toDate'].setValue(null);
  this.toDate = this.datepipe.transform('1700-01-01', 'yyyy-MM-dd');
}
getHealthCheckupReports(id){
  this.selectedReport.setValue(id);
  this.reportData['prevselected'] = this.HCselected;
  this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
  this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
  this.reportData = {};
  this.reportData['noRecords'] = false;
  this.reportData['noFilteredRec'] = false;
  this.reportData['loading'] = true;
  this.reportData['showTable'] = false;
  this.reportData['showCard'] = false;
  this.reportData['enableexcel'] = false;
  this.reportData['enablepdf'] = false;
  this.reportData['invalidDate'] = false;
  this.reportData['displayTranspose'] = false;
  if(id == 'hc_plan_summary2' || id == 'emp-contact'){
    this.reportData['validDate']=this.validate(this.fromDate,this.toDate);
  } else{
    this.reportData['validDate']=this.validate(this.fromDate,this.fromDate);
  }
  if(!this.reportData['validDate']){
    this.reportData['invalidDate'] = true;
    this.reportData['loading'] = false;
    this.reportData['noRecords'] = true;
  } else{
    if (id == 'patient-status') {
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
          this.reportData['showTable'] = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel']= false;
          this.reportData['diabeticCount'] = res.results.data.diabetic.Diabetic.Count;
          this.reportData['non_diabeticCount'] = res.results.data.diabetic['Non Diabetic']['Count'];
          this.reportData['diabeticTAT'] = res.results.data.diabetic.Diabetic['Avg TAT'];
          this.reportData['non_diabeticTAT'] = res.results.data.diabetic['Non Diabetic']['Avg TAT'];
          this.reportData['pregnantCount'] = res.results.data.pragnant.data;
          this.reportData['packageCustomized'] = res.results.data.package_customized.data;
          this.reportData['noPlans'] = res.results.data.noplan.data;
          this.reportData['genderChart'] = res.results.data.gender;
          this.reportData['deviceChart'] = res.results.data.tag;
          this.reportData['languageChart'] = res.results.data.lang;
          this.reportData['timewiseData'] = [res.results.data.timewise.data.IN, res.results.data.timewise.data.OUT];
          this.reportData['timewiseLabel'] = res.results.data.timewise.label;
          this.reportData['daywiseChart'] = res.results.data.daywise;
          this.reportData['consultantsChart'] = res.results.data.consultants;
          // this.reportData['consultantsTable'] = res.results.data.consultants;
          // for(let i=0;i<this.reportData['consultantsTable'].length;i++){
          //   this.reportData['consultantsTable'][i]['Visit Date'] = this.datepipe.transform(this.reportData['consultantsTable'][i]['Visit Date'], 'dd/MM/yyyy HH:mm:ss')
          // }
          // this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':4,'gutterSize':'0px'};
          // this.reportData['tileInfo'] = [
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT By Patients','content':'Diabetic: '+this.reportData['diabeticTAT']+'\n'+'Non-Diabetic: '+this.reportData['non_diabeticCount']},
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Pregnant Patients','content':this.reportData['pregnantCount']},
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Packages Customised By Patients','content':this.reportData['packageCustomized']},
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Patients With No Plans','content':this.reportData['noPlans']}];
          // this.reportData['patientCard'] = true;
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'genderChart','type':'pie','data':this.reportData['genderChart'].data,'label': this.reportData['genderChart'].label,'title':'Gender','showTitle':true,'barLabel': []}); 
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'deviceChart','type':'pie','data':this.reportData['deviceChart'].data,'label': this.reportData['deviceChart'].label,'title':'Device','showTitle':true,'barLabel': []}); 
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'languageChart','type':'pie','data':this.reportData['languageChart'].data,'label': this.reportData['languageChart'].label,'title':'Language','showTitle':true,'barLabel': []});
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'timewise','type':'grouped','data':this.reportData['timewiseData'],'label': this.reportData['timewiseLabel'],'title':'Hourly Patient In vs Out','showTitle':true,'barLabel': ['IN', 'OUT']});    
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'daywise','type':'bar','data':this.reportData['daywiseChart'].data,'label': this.reportData['daywiseChart'].label,'title':'Patient - Package Completion Status','showTitle':true,'barLabel': ['Patient Count']});    
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'consultant','type':'bar','data':this.reportData['consultantsChart'].data,'label': this.reportData['consultantsChart'].label,'title':'Patient Count By Consultants','showTitle':true,'barLabel': ['Patient Count']});    
          // this.reportData['Table'] = this.reportData['consultantsTable'];
          // this.reportData['TableColumns'] = [];
          //   if(this.reportData['Table'].length > 0){
          //     for(let i=0;i<this.reportData['Table'].length;i++){
          //       this.reportData['Table'][i]['Visit Date'] = this.datepipe.transform(this.reportData['Table'][i]['Visit Date'], 'dd/MM/yyyy HH:mm:ss')
          //     }
          //     this.reportData['TableColumns'] = ['Name', 'Visit Date', 'noof_pats'];
          //     this.reportData['showTable'] = true;
          //   } else {
          //     this.reportData['enableexcel'] = false;
          //   } 
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
          } 
        });
    } else if(id == 'hc_plan_summary2'){
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
            this.reportData['loading'] = false;
            this.reportData['enablepdf'] =  false;
            this.reportData['enableexcel'] = true;
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
              this.reportData['TableData'] = res.results.data;
              this.reportData['packageList'] = [];
              this.reportData['ageList'] = [];
              // this.selectedPackage.setValue(['All Packages']);
              // this.selectedAge.setValue(['All']);
              let list = this.reportData['TableData'].map(item => item['Package']).filter((value, index, self) => self.indexOf(value) === index)
              // this.reportData['packageList'].push({
              //   id:0,
              //   name : 'All Packages'
              // })
              for(let i=0;i<list.length;i++){
                this.reportData['packageList'].push({
                  id : i+1,
                  name : list[i],
                });
              }
              this.selectedPackage.patchValue([...this.reportData['packageList'].map(item => item.name), 'All Packages']);
              list = this.reportData['TableData'].map(item => item['Age']).filter((value, index, self) => self.indexOf(value) === index)
              // this.reportData['ageList'].push({
              //   id:0,
              //   name : 'All'
              // })
              for(let i=0;i<list.length;i++){
                this.reportData['ageList'].push({
                  id : i+1,
                  name : list[i],
                });
              }
              this.selectedAge.patchValue([...this.reportData['ageList'].map(item => item.name), 'All']);
              this.reportData['TableColumns']=[];
              this.reportData['Table']=res.results.data;
              if(this.reportData['Table'].length > 0){
                this.reportData['TableColumns'] =['Package','Age','Total Patients Enrolled','Min Patients(day)','Max Patients(day)','Min TAT','Max TAT','Avg TAT']
                this.reportData['showTable'] = true;
              }
            } else {
              this.reportData['noRecords'] = true;
              this.reportData['loading'] = false;
            }      
            });
    } else if(id == 'hc_test_summary2'){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {   
        const value = new Date(new Date(this.fromDate).getTime() - 5 * 24 * 60 * 60 * 1000);
        const from_date = this.datepipe.transform(value, 'yyyy-MM-dd');
        if (res.results.statusCode == 200) {
          this.reportData['loading'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['enablepdf'] = false;
          this.reportData['exportData'] = res.results.data;
            // for (let i = 0; i < res.results.data.length; i++) {
            //   res.results.data[i]['Start Time'] = this.datepipe.transform(res.results.data[i]['Start Time'], 'HH : mm : ss');
            //   res.results.data[i]['End Time'] = this.datepipe.transform(res.results.data[i]['End Time'], 'HH : mm : ss');
            //   res.results.data[i]['Report_dt'] = this.datepipe.transform(res.results.data[i]['Report_dt'], 'dd/MM/yyyy');
            // }
            this.reportData['testNameList'] = [];
            this.reportData['locationList'] = [];
            this.reportData['minContactList'] = [];
            this.reportData['maxContactList'] = [];
            this.reportData['Table']=res.results.data;
            this.selectedTests.setValue(['All Tests']);
            this.selectedLocation.setValue(['All Locations']);
            this.selectedMinContactTime.setValue(['All']);
            this.selectedMaxContactTime.setValue(['All']);
            let list = this.reportData['Table'].map(item => item['Location']).filter((value, index, self) => self.indexOf(value) === index)
            this.reportData['locationList'].push({
              id:0,
              name : 'All Locations'
            })
            for(let i=0;i<list.length;i++){
              this.reportData['locationList'].push({
                id : i+1,
                name : list[i],
              });
            }
            list = this.reportData['Table'].map(item => item['Test Name']).filter((value, index, self) => self.indexOf(value) === index)
            this.reportData['testNameList'].push({
              id:0,
              name : 'All Tests'
            })
            for(let i=0;i<list.length;i++){
              this.reportData['testNameList'].push({
                id : i+1,
                name : list[i],
              });
            }
            list = this.reportData['Table'].map(item => item['Min contact time(min)']).filter((value, index, self) => self.indexOf(value) === index)
            this.reportData['minContactList'].push({
              id:0,
              name : 'All'
            })
            for(let i=0;i<list.length;i++){
              this.reportData['minContactList'].push({
                id : i+1,
                name : list[i],
              });
            }
            list = this.reportData['Table'].map(item => item['Max contact time(min)']).filter((value, index, self) => self.indexOf(value) === index)
            this.reportData['maxContactList'].push({
              id:0,
              name : 'All'
            })
            for(let i=0;i<list.length;i++){
              this.reportData['maxContactList'].push({
                id : i+1,
                name : list[i],
              });
            }
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }    
            //this.reportData['chart'] = res.results.charts;
            //this.testSummaryChart(this.reportData['chart']);
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }   
      });  
    } else if(id == 'geofencevio'){
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&vtyp=healthcheckup';
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
          console.log(res)
          if (res.results.statusCode == 200 && res.results.data.length > 0) {
            this.reportData['loading'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData['enablepdf'] = true;
            for (let i = 0; i < res.results.data.length; i++) {
              res.results.data[i]['Alert Date'] = this.datepipe.transform(res.results.data[i]['Alert Date'], 'M/d/yy, h:mm a');
            }
            this.reportData['Table'] = res.results.data;
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            this.reportData['label'] = [];
            this.reportData['data'] = [];
            for (let key = 0; key < res.results.chart.length; key++) {
              this.reportData['label'].push(res.results.chart[key].Floor);
              this.reportData['data'].push(res.results.chart[key].counts);
            }
            this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'geofenceViolationChart','type':'pie','data':this.reportData.data,'label': this.reportData.label,'title':'Geofence Violation Report','showTitle':true,'barLabel': []}); 
          } else {
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
      });
    } else if(id == 'open-encounter'){
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        if (res.results.statusCode == 200 && res.results.data.length > 0) {
          this.reportData['loading'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['enablepdf'] = false;
          for (let i = 0; i < res.results.data.length; i++) {
            res.results.data[i]['Check in'] = this.datepipe.transform(res.results.data[i]['Check in'], 'HH : mm : ss');
            res.results.data[i]['Check out'] = this.datepipe.transform(res.results.data[i]['Check out'], 'HH : mm : ss');
            res.results.data[i]['Visit date'] = this.datepipe.transform(res.results.data[i]['Visit date'], 'dd/MM/yyyy');
            res.results.data[i]['Birth date'] = this.datepipe.transform(res.results.data[i]['Birth date'], 'dd/MM/yyyy');
          }
          this.reportData['Table'] = res.results.data;
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'tat-all-rep') {
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        console.log(res)
        if (res.results.statusCode == 200 && (res.results.sheet0.length >=1 || res.results.sheet1.length >=1 || res.results.sheet2.length >=1 || res.results.sheet3.length >=1 )) {
          this.reportData['loading'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['sheet0'] =  res.results.sheet0;
          this.reportData['sheet1'] =  res.results.sheet1;
          this.reportData['sheet2'] =  res.results.sheet2;
          this.reportData['sheet3'] =  res.results.sheet3;
          if(this.reportData['sheet2'].length > 0){
            let loc = 0;
            let len = 0;
            for (let i = 0; i < this.reportData['sheet2'].length; i++) {
              if (this.reportData['sheet2'][i]['Test Value'].length) {
                if (len < this.reportData['sheet2'][i]['Test Value'].length) {
                    len = this.reportData['sheet2'][i]['Test Value'].length;
                    loc = i;
                }
                for ( const j in this.reportData['sheet2'][i]['Test Value']) {
                  this.reportData['sheet2'][i]['Test ' + j] = this.reportData['sheet2'][i]['Test Value'][j];
                }
                delete this.reportData['sheet2'][i]['Test Value'];
              }
            }
          }
         
          this.reportData.sheetNames = ['Summary','Test-Summary','TAT Report','TAT Detailed Report by Touchpoint']
          this.reportData.excelData = [this.reportData.sheet0,this.reportData.sheet1,this.reportData.sheet2,this.reportData.sheet3];
          this.reportData.fullexcelData=[this.reportData.excelData, this.reportData.sheetNames]
        }
        else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if (id == 'pat-sample-coll') {
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        this.reportData['loading'] = false;
        if (res.results.statusCode == 200 && res.results.data != null) {
          const label = Object.keys(res.results.data[0]);
          this.reportData['enablepdf'] = false;
          this.reportData['enableexcel'] = true;
          for (let i = 0; i < res.results.data.length; i++) {
              res.results.data[i]['Birth Date'] = this.datepipe.transform(res.results.data[i]['Birth Date'], 'dd/MM/yyyy');
              res.results.data[i]['Visit start'] = this.datepipe.transform(res.results.data[i]['Visit start'], 'dd/MM/yyyy');
              res.results.data[i]['Visit end'] = this.datepipe.transform(res.results.data[i]['Visit end'], 'dd/MM/yyyy');
              res.results.data[i]['Collection start time'] = this.datepipe.transform(res.results.data[i]['Collection start time'], 'HH : mm : ss');
              res.results.data[i]['Collection end time'] = this.datepipe.transform(res.results.data[i]['Collection end time'], 'HH : mm : ss');
            }
            this.reportData['Table'] = res.results.data;
            this.reportData['TableColumns'] = ['Name', 'gender', 'Birth Date', 'Token', 'Visit start', 'Visit end', 'Collection start time', 'Collection end time', 'Is sample collected'];
            if(this.reportData['Table'].length > 0){
              this.reportData['showTable'] = true;
            }
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'coaster-details'){
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
        console.log(res)
        this.reportData['loading'] = false;
        this.reportData['enableexcel'] = true;
        this.reportData['enablepdf'] = false;
        this.reportData['chartItem'] = [];
        this.reportData['batteryLevel'] = []
        if (res.results.statusCode == 200 && res.results.data.length > 0) {
          this.reportData['TableData'] = res.results.data;
          this.selectedStatus.setValue(['Missing']);
          this.selectedBattery.setValue(['all']);
          this.selectedAlertCount.setValue(['all']);
          this.reportData['statusList']=[
            {'id':'Missing','name':'Missing'},
            {'id':'In use','name':'In Use'},
            {'id':'In premise','name':'In Premise'},
            {'id':'all','name':'All'}
          ];
          this.reportData['batteryList']=[
            {'id':'0 - 25 %','name':'0-25%'},
            {'id':'26 - 50 %','name':'26-50%'},
            {'id':'51 - 75 %','name':'51-75%'},
            {'id':'76 - 100 %','name':'76-100%'},
            {'id':'all','name':'All'}
          ];
          this.reportData['alertList']=[
            {'id':'0-5','name':'0-5'},
            {'id':'6-10','name':'6-10'},
            {'id':'11-15','name':'11-15'},
            {'id':'16-20','name':'16-20'},
            {'id':'>20','name':'>20'},
            {'id':'all','name':'All'},
          ];
          this.reportData['Table'] =  res.results.data.filter(function(val) {
            return val['Coaster status'] == 'Missing';
          });
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = ['Tag id', 'Mac id', 'Patient Name', 'UHID', 'Gender','Mobile', 'From datetime', 'To Datetime', 'Coaster status', 'Geo alert count', 'Battery%'];
            this.reportData['showTable'] = true;
          }
          //this.reportData['reportData'] = res.results.charts;
          //this.reportData['chartBattery'] = res.results.chart_battery;
          //this.coasterReturnChart();            
          } else {
              this.reportData['noRecords'] = true;
              this.reportData['loading'] = false;
          }    
      });
    } else if (id == 'emp-contact') {
      this.selectedDate = this.toDate;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.Uhid + '&ptyp=' + this.contactType;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        console.log(res)
        this.reportData['data'] = [];
        this.reportData['tree'] = [];
        this.reportData['clickedId'] = [];
        this.reportData['clickedTagType'] = [];
        this.reportData['index'] = 0;
        let location = [];
        if(res.results.statusCode == 200 && res.results.data !=null){
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = true;
          this.reportData['firstDegreeData'] = res.results.data["First_Degree_contact: "];
          this.reportData['clickedId'].push(this.reportData['firstDegreeData'][0]['tag_value'])
          this.reportData['clickedTagType'].push(this.reportData['firstDegreeData'][0]['Tag Type'])
          this.reportData['tree'].push({'Name':null,'Contact Name':this.reportData['firstDegreeData'][0]['Name'],'Identifier':1,'parentIdentifier':null,'location Name': "", 'Floor Name' : "",'From Time' : "",'con_tag_value':this.reportData['firstDegreeData'][0]['tag_value'],'Close contact':'No','level':0})
          this.reportData['IdentifierValue'] = 1
          this.reportData['firstDegreeData'].forEach((item) => {
            item.Identifier = this.reportData['IdentifierValue'] + 1;
            item.parentIdentifier = 1;
            item.level = 1;
            this.reportData['IdentifierValue'] = this.reportData['IdentifierValue'] + 1;
           });
          this.reportData['tree'] = this.reportData['tree'].concat(this.reportData['firstDegreeData'])
          this.reportData['tableView'] = true;
          this.reportData['initialised'] = true;
          this.reportData.maxnodes =  this.reportData.tree.length;
        } else{
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
          this.reportData['initialised'] = true;
  
        }
      });
    } else if (id == 'pat-journey') {
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&uid=' + this.Uhid;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        console.log(res)
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data.journey;
          this.reportData['pat_info'] = res.results.data.pat_list;
          this.reportData['UHID'] = res.results.data.pat_info.UHID;
          this.reportData['patientName'] = res.results.data.pat_info.Name;
          this.reportData['gender'] = res.results.data.pat_info.Gender;
          this.reportData['birthDate'] = res.results.data.pat_info.birth_date.toLocaleString().split('T')[0];
          this.reportData['enrollDateTime'] = res.results.data.pat_info.enroll_datetime.toLocaleString().replace('T', ' ');
          this.reportData['package'] = res.results.data.pat_info.packagename;
          this.reportData['visitStart'] = res.results.data.pat_info.VisitStart.toLocaleString().replace('T', ' ');
          this.reportData['visitComplete'] = res.results.data.pat_info.VisitComplete.toLocaleString().replace('T', ' ');
          this.reportData['currentLocation']=res.results.data.pat_info.CurrentLocation;
          this.reportData['journey'] = res.results.data.journey;
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['From time'] = this.datepipe.transform(this.reportData['Table'][i]['From time'], 'HH : mm : ss');
            this.reportData['Table'][i]['To Time'] = this.datepipe.transform(this.reportData['Table'][i]['To Time'], 'HH : mm : ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'pat-tag-status'){
      this.reportData['tagStatus'] = this.selectedTagStatuslist;
      this.reportData['tagType'] = this.selectedTagTypelist;
      this.reportData['param'] = '/ttype='+ this.selectedTagTypelist + '&fdt=' + this.fromDate + '&tdt=' + this.toDate + '&tsts='+this.selectedTagStatuslist;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        if (res.results.statusCode == 200 && res.results.data != null) {
        this.reportData['loading'] = false;
        this.reportData['enableexcel'] = true;
        this.reportData['Table'] = res.results.data.tabledata;
        this.reportData['TableColumns'] = [];
        if(this.reportData['Table'].length > 0){
          this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          this.reportData['showTable'] = true;
        }
      } else{
        this.reportData['noRecords'] = true;
        this.reportData['loading'] = false;
      }
      });
    } else if(id == 'aphc-tat-daily'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
          this.reportData['loading']=false;
          if (res.results.statusCode == 200) {
            this.reportData['Table'] = res.results.Summary;
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }
          }
        })
      }
    } else {
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&prpt='+ id;
      this.CommonService.getReportData('patientreport',this.reportData['param']).subscribe(res => {   
        // console.log(res)    
        this.reportData['loading'] = false;
        if (res.results.statusCode == 200 && res.results.data.length > 0) {
          const label = Object.keys(res.results.data[0]);
          this.reportData = res.results.data;
          this.reportData['enableexcel'] = true;
          if ( id == 'report2') {
            let loc = 0;
            let len = 0;
            this.reportData['displayTranspose'] = true;
            for (let i = 0; i < this.reportData.length; i++) {
              if (this.reportData[i]['Test Value'].length) {
                if (len < this.reportData[i]['Test Value'].length) {
                    len = this.reportData[i]['Test Value'].length;
                }
                for ( const j in this.reportData[i]['Test Value']) {
                  this.reportData[i]['Test ' + j] = this.reportData[i]['Test Value'][j];
                }
                delete this.reportData[i]['Test Value'];
              }
            }
            let exportTableData  = res.results.data.slice(0, 5);
            let label = Object.keys(exportTableData[loc]);
            label = label.filter(item => item != 'isnormal');
            this.reportData['TableColumns'] = ['0'].concat(exportTableData.map(x => x['Patient Name']));
            this.reportData['Table'] = label.map(x => this.formatInputRow(x, 'Patient Name', res.results.data));
            // console.log(this.reportData['Table'])
            this.reportData['showTable'] = true;
            this.reportData['noRecords'] = false;
        }else if (id == 'report1'){
          this.reportData['Table'] = res.results.data;
          for (let i = 0; i < this.reportData.length; i++) {
              this.reportData[i]['Birth Date'] = this.datepipe.transform(this.reportData[i]['Birth Date'], 'dd/MM/yyyy');
            }
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = res.results.displayColumns;
              this.reportData['showTable'] = true;
            }
       } else {
          this.reportData['Table'] = res.results.data;
          for (let i = 0; i < this.reportData.length; i++) {
              this.reportData[i]['Birth Date'] = this.datepipe.transform(this.reportData[i]['Birth Date'], 'dd/MM/yyyy');
          }
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
       }
     } else {
      this.reportData['noRecords'] = true;
      this.reportData['loading'] = false;
    }
    }); 
    }
  }
  let selectedData  = this.reportList.filter(res=> res.link === id);
  this.selected = {'selectedId': id, 'selectedDate': this.selectedDate ,'fromDate' : this.fromDate, 'toDate': this.toDate, 'Uhid': this.Uhid,'contactType':this.contactType, 'name':selectedData[0].name};
}
validate(sDate: string, eDate: string){
  this.reportData['validDate'] = true;
  if((sDate != null && eDate !=null) && (eDate < sDate) ){
    this.reportData['validDate'] = false;
    this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date";
  }
  let sdate :any = new Date(sDate);
  let tdate  :any = new Date(eDate);
  if(this.activate_btn.find(data => data === 'BT_RPTDA') === undefined){
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((sdate - tdate) / oneDay));
    if(diffDays>10){
      this.reportData['validDate'] = false;
      this.reportData['invalidDateMessage'] = "Please Select Fromdate & Todate between Ten Days. If any Queries Contact Admin"
    }
  }
  return this.reportData['validDate'];
} 
filterByTagStatus(){
  if(this.selectedTagStatus.value!=null && this.selectedTagStatus.value.length>0){
    this.selectedTagStatuslist= this.selectedTagStatus.value;
  } else{
    this.selectedTagStatuslist = 'ST-AT'
  }
  if(this.selectedTagtype.value!=null && this.selectedTagtype.value.length>0){
    this.selectedTagTypelist = this.selectedTagtype.value;
  } else{
    this.selectedTagTypelist = 'TT-PA';
  }
}
tosslePerOne(all){
  if (this.allSelected.selected) {
   this.allSelected.deselect();
   return false;
}
 if(this.selectedPackage.value.length==this.reportData['packageList'].length)
   this.allSelected.select();
}
toggleAllSelection() {
  if (this.allSelected.selected) {
    this.selectedPackage.patchValue([...this.reportData['packageList'].map(item => item.name), 'All Packages']);
  } else {
    this.selectedPackage.patchValue([]);
  }
}
tosslePerOneage(all){
  if (this.allSelectedage.selected) {
   this.allSelectedage.deselect();
   return false;
}
 if(this.selectedAge.value.length==this.reportData['ageList'].length)
   this.allSelectedage.select();
}
toggleAllSelectionage() {
  if (this.allSelectedage.selected) {
    this.selectedAge.patchValue([...this.reportData['ageList'].map(item => item.name),'All' ]);
  } else {
    this.selectedAge.patchValue([]);
  }
}

getPackageSelectionDetail(packages){
  this.reportData['filteredData'] = [];
  let finalData = [];
  this.reportData['noFilteredRec'] = false;
  this.reportData['showTable'] = false;
  if(this.selectedPackage.value.indexOf('All Packages') > -1){
    this.reportData['filteredData'] = this.reportData['TableData'];
  } else {
    for(let i=0;i<this.selectedPackage.value.length;i++){
      for(let j=0;j<this.reportData['TableData'].length;j++){
        if(this.reportData['TableData'][j]['Package'] == this.selectedPackage.value[i]){
          this.reportData['filteredData'].push(this.reportData['TableData'][j])
        }
      }
    }
  }
  if(this.selectedAge.value.indexOf('All') < 0){
    for(let i=0;i<this.selectedAge.value.length;i++){
      for(let j=0;j<this.reportData['filteredData'].length;j++){
        if(this.reportData['filteredData'][j]['Age'] == this.selectedAge.value[i]){
          finalData.push(this.reportData['filteredData'][j])
        }
      }
    }
    this.reportData['filteredData'] = finalData;
  }
  this.reportData['Table'] = this.reportData['filteredData'];
  if(this.reportData['Table'].length > 0){
    this.reportData['TableColumns'] = ['Package', 'Total Patients Enrolled','Age', 'Min Patients(day)', 'Max Patients(day)', 'Avg TAT', 'Min TAT', 'Max TAT'];
    this.reportData['showTable'] = true;
  } else {
    this.reportData['showTable'] = false;
    this.reportData['noFilteredRec'] = true;
  }


}
getStatusSelectionDetail(select){
  this.reportData['finalData'] = [];
  let data=[];
  let filteredData = [];
  this.reportData['noFilteredRec'] = false;
   if(this.selectedStatus.value.indexOf('all') > -1){
     this.reportData['finalData'] = this.reportData['TableData'];
     filteredData = this.reportData['finalData'];
   } else {
     for(let i=0;i<this.selectedStatus.value.length;i++){
       for(let j=0;j<this.reportData['TableData'].length;j++){
         if(this.reportData['TableData'][j]['Coaster status'] == this.selectedStatus.value[i]){
           this.reportData['finalData'].push(this.reportData['TableData'][j])
         }
       }
     }
     filteredData = this.reportData['finalData'];
   }
   if(this.selectedBattery.value.indexOf('all') < 0){
     for(let i=0;i<this.selectedBattery.value.length;i++){
       for(let j=0;j<this.reportData['finalData'].length;j++){
         if(this.reportData['finalData'][j]['Battery Status'] == this.selectedBattery.value[i]){
           data.push(this.reportData['finalData'][j])
         }
       }
   }
   filteredData = data;
 }
 this.reportData['Table']=filteredData;
    this.reportData['TableColumns'] = [];
    if(this.reportData['Table'].length > 0){
      this.reportData['TableColumns'] = ['Tag id', 'Mac id', 'Patient Name', 'UHID', 'Gender','Mobile', 'From datetime', 'To Datetime', 'Coaster status', 'Geo alert count', 'Battery%'];
      this.reportData['showTable'] = true;
    } else {
      this.reportData['noFilteredRec'] = true;
      this.reportData['showTable'] = false;
    }
  }
coasterReturnChart(){
  this.reportData['chart1'] = new Chart('coaster-return-report', {
    type: 'pie',
    data: {
        labels:  this.reportData['reportData'].label,
        datasets: [{
            data: this.reportData['reportData'].data,
            backgroundColor: ['#5CD6CC', '#84D1FA', '#8CEDCB', '#FFB347'],
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio : false,
        plugins: {
        title: {
          display: true,
          text: 'Coaster Return Report',
          position: 'top',
          font:{
            size: 16,
            family: 'open Sans',
            weight: 'bold'
          },
          color: 'black',
        },
        legend: {position: 'left',
        labels: {
          usePointStyle: true
        } ,
        'onClick': (event, item) => {
          if (item.hidden == true) {
            console.log(this.reportData['chart1'])
            this.reportData['chart1'].config.data.datasets['0']._meta[this.reportData['chart1']['id']].data[item.datasetIndex].hidden = false;
            const index = this.reportData['chartItem'].indexOf(item.text, 0);
            if (index > -1) {
              this.reportData['chartItem'].splice(index, 1);
                }
          } else if (item.hidden == false) {
            this.reportData['chart1'].config.data.datasets['0']._meta[this.reportData['chart1']['id']].data[item.datasetIndex].hidden = true;
            this.reportData['chartItem'].push(item.text);
          }
          this.reportData['chart1'].update();
          this.updateTable();
        }
        },
          datalabels: {
            display:  function(data) {
              const value = data.dataset.data[data.dataIndex];
              if (typeof value === 'number') {
                return value > 0;
              }
              return false
            },
          color: 'black',
          align: 'end',
          anchor: 'center',
          font:
            {
              weight: 'bold'
            }
          }
        }
    }
  });
  this.reportData['chart2'] = new Chart('coaster-battery-status', {
    type: 'pie',
    data: {
        labels:  this.reportData['chartBattery'].label,
        datasets: [{
          data: this.reportData['chartBattery'].data,
          backgroundColor: ['#FFB347', '#5CD6CC', '#84D1FA', '#8CEDCB'],
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio : false,
        plugins: {
        title: {
          display: true,
          text: 'Coaster Battery Percentage',
          position: 'top',
          font:{
            family:'open Sans',
            size: 16,
            weight: 'bold'
          },
          color: 'black'
        },
        legend: {position: 'left',
        labels: {
          usePointStyle: true
        } ,
        'onClick': (event, item) => {
          if (item.hidden == true) {
            this.reportData['chart2'].config.data.datasets['0']._meta[this.reportData['chart2']['id']].data[item.datasetIndex].hidden = false;
            const index = this.reportData['batteryLevel'].indexOf(item.text, 0);
            if (index > -1) {
              this.reportData['batteryLevel'].splice(index, 1);
                }
          } else if (item.hidden == false) {
            this.reportData['chart2'].config.data.datasets['0']._meta[this.reportData['chart2']['id']].data[item.datasetIndex].hidden = true;
            this.reportData['batteryLevel'].push(item.text);
          }
          this.reportData['chart2'].update();
          this.updateTable();

        }
        },
          datalabels: {
            display:  function(data) {
              const value = data.dataset.data[data.dataIndex];
              if(typeof value === 'number'){
                return value > 0;
              }
              return false
            },
          color: 'black',
          align: 'end',
          anchor: 'center',
          font:
            {
              weight: 'bold'
            }
          }
        }
    }
  });
}
updateTable() {
  let filterdata: any = [];
  filterdata = this.reportData['Table'].filter(function(item) {
    return this.indexOf(item['Coaster status']) < 0;
  }, this.reportData['chartItem']);
  this.updateChart(filterdata);
  const data = filterdata.filter(function(item) {
    return this.indexOf(item['Battery Status']) < 0;
  }, this.reportData['batteryLevel']);
  this.updateChart(data);
  if (data.length > 0) {
    this.reportData['Table'] = data;
  } else {
    this.reportData['noRecords'] = true;
  }
}

updateChart(arr) {
  const returnLabels = this.reportData['reportData'].label;
  const statusLabels = this.reportData['chartBattery'].label;
  const coasterReturnObj: any = {};
  const batteryObj: any = {};
  for (let label = 0; label < returnLabels.length; label++) {
    coasterReturnObj[returnLabels[label]] = 0;
  }

  for (let item = 0; item < arr.length; item++) {
    if (!coasterReturnObj[arr[item]['Coaster status']]) {
      coasterReturnObj[arr[item]['Coaster status']] = 1;
    } else if (coasterReturnObj[arr[item]['Coaster status']]) {
      coasterReturnObj[arr[item]['Coaster status']] += 1;
    }
  }
  for (let label = 0; label < statusLabels.length; label++) {
    batteryObj[statusLabels[label]] = 0;
  }
  for (let item = 0; item < arr.length; item++) {
    if (!batteryObj[arr[item]['Battery Status']]) {
      batteryObj[arr[item]['Battery Status']] = 1;
    } else if (batteryObj[arr[item]['Battery Status']]) {
      batteryObj[arr[item]['Battery Status']] += 1;
    }
  }
  this.reportData['chart1'].data.datasets['0'].data = Object.values(coasterReturnObj);
  console.log(this.reportData['chart1'].data.datasets['0'].data)
  this.reportData['chart1'].update();
  this.reportData['chart2'].data.datasets['0'].data = Object.values(batteryObj);
  this.reportData['chart2'].update();
}
testSummaryChart(chartData) {
  console.log(chartData);
  if (this.reportData['chart']['waitTimeChart'] != undefined || this.reportData['chart']['waitTimeChart'] != null) {
    this.reportData['chart']['waitTimeChart'].destroy();
  }
  if (this.reportData['chart']['contactTimeChart'] != undefined || this.reportData['chart']['contactTimeChart'] != null) {
    this.reportData['chart']['contactTimeChart'].destroy();
  }
  chartData['colors'] = ['#03AAE8', '#00FF5A', '#FFC300', '#FF2200', '#019F96', '#8e5ea2', '#3cba9f', '#83B9FA', '#c45850', '#FFB347'];
  chartData['waitTimeData'] = [];
  chartData['contactTimeData'] = [];

  for (let i = 0 ; i < chartData.data.length; i++) {
    if (this.reportData['testNameList'].length < chartData.data.length) {
      this.reportData['testNameList'].push({
         id : i,
         name : chartData.data[i]['label'],
         checked : i < 5,
      });
    }
    if (this.reportData['testNameList'][i]['checked'] == true) {
      chartData['waitTimeData'].push({
        data : chartData.data[i]['wait_time'],
        label : chartData.data[i]['label'],
        borderColor : chartData['colors'][(i % chartData['colors'].length)] ,
        fill : false
      });
      chartData['contactTimeData'].push({
        data : chartData.data[i]['contact_time'],
        label : chartData.data[i]['label'],
        borderColor : chartData['colors'][(i % chartData['colors'].length)],
        fill : false
      });
    }
    this.reportData['testNameList'][i]['checked'] = false;
  }
  this.reportData['chart']['waitTimeChart'] =  new Chart('line-wait-time', {
    type: 'line',
    data: {
        labels: chartData.dates,
        datasets: chartData['waitTimeData']
    },
    options: {
      elements: {
        line: {
          tension: 0.000001
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'AVERAGE WAIT TIME (min)'
        },
        legend: {
          display: true,
          position: 'bottom',

        },
        filler: {
          propagate: false
        }
      },
      scales: {
        y: {
          ticks: {
            minRotation: 0
          }
        }
      },
      maintainAspectRatio: false,
    }
  });
  this.reportData['chart']['contactTimeChart'] =  new Chart('line-contact-time', {
    type: 'line',
    data: {
        labels: chartData.dates,
        datasets: chartData['contactTimeData']
    },
    options: {
      elements: {
        line: {
          tension: 0.000001
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'AVERAGE CONTACT TIME (min)'
        },
        legend: {
          display: true,
          position: 'bottom',
        },
        filler: {
          propagate: false
        }
      },
      scales: {
        y: {
          ticks: {
            minRotation: 0
          }
        }
      },
      maintainAspectRatio: false,
    }    
  });
}

// getTestSelectionDetail(tests) {
//   this.reportData['selectedCount'] = tests.value.length;
//   this.selectedTests.setValue(tests.value);
//   let testNameFilter = [];
//   let index = 0;
//   testNameFilter = this.reportData['testNameList'].map(value => value.name);
//   if (this.selectedTests.value.length >= 10) {
//     alert('You can select only 10 tests at a time');
//   }
//   for (let i = 0; i < this.reportData['testNameList'].length; i++) {
//     index = testNameFilter.indexOf(this.selectedTests.value[i]);
//     if (index != -1) {
//       this.reportData['testNameList'][index]['checked'] = true;
//     }
//   }
//   this.testSummaryChart(this.reportData['chart']);
// }
getTestSelectionDetail(tests) {
  this.reportData['filteredData'] = [];
  let finalData = [];
  this.reportData['noFilteredRec'] = false;
  // this.reportData['selectedCount'] = tests.value.length;
  // this.selectedTests.setValue(tests.value);
  // let testNameFilter = [];
  // let index = 0;
  // testNameFilter = this.reportData['testNameList'].map(value => value.name);
  // if (this.selectedTests.value.length >= 10) {
  //   alert('You can select only 10 tests at a time');
  // }
  // for (let i = 0; i < this.reportData['testNameList'].length; i++) {
  //   index = testNameFilter.indexOf(this.selectedTests.value[i]);
  //   if (index != -1) {
  //     this.reportData['testNameList'][index]['checked'] = true;
  //   }
  // }
  //this.testSummaryChart(this.reportData['chart']);
  this.reportData['showTable'] = false;
  if(this.selectedTests.value.indexOf('All Tests') > -1){
    this.reportData['filteredData'] = this.reportData['exportData'];
  } else {
    for(let i=0;i<this.selectedTests.value.length;i++){
      for(let j=0;j<this.reportData['exportData'].length;j++){
        if(this.reportData['exportData'][j]['Test Name'] == this.selectedTests.value[i]){
          this.reportData['filteredData'].push(this.reportData['exportData'][j])
        }
      }
    }
  }
  if(this.selectedLocation.value.indexOf('All Locations') < 0){
    for(let i=0;i<this.selectedLocation.value.length;i++){
      for(let j=0;j<this.reportData['filteredData'].length;j++){
        if(this.reportData['filteredData'][j]['Location'] == this.selectedLocation.value[i]){
          finalData.push(this.reportData['filteredData'][j])
        }
      }
    }
    this.reportData['filteredData'] = finalData;
    finalData = [];
  }
  if(this.selectedMinContactTime.value.indexOf('All') < 0){
    for(let i=0;i<this.selectedMinContactTime.value.length;i++){
      for(let j=0;j<this.reportData['filteredData'].length;j++){
        if(this.reportData['filteredData'][j]['Min contact time(min)'] == this.selectedMinContactTime.value[i]){
          finalData.push(this.reportData['filteredData'][j])
        }
      }
    }
    this.reportData['filteredData'] = finalData;
    finalData = [];
  }
  if(this.selectedMaxContactTime.value.indexOf('All') < 0){
    for(let i=0;i<this.selectedMaxContactTime.value.length;i++){
      for(let j=0;j<this.reportData['filteredData'].length;j++){
        if(this.reportData['filteredData'][j]['Max contact time(min)'] == this.selectedMaxContactTime.value[i]){
          finalData.push(this.reportData['filteredData'][j])
        }
      }
    }
    this.reportData['filteredData'] = finalData;
    finalData = [];
  }
  this.reportData['Table']=this.reportData['filteredData'];
  this.reportData['TableColumns'] = [];
  if(this.reportData['Table'].length > 0){
    this.reportData['TableColumns'] = ['Test Name', 'No Of Patients', 'Avg wait time(min)', 'Avg contact time(min)', 'Min contact time(min)', 'Max contact time(min)', 'Location'];
    this.reportData['showTable'] = true;
  } else {
    this.reportData['noFilteredRec'] = true;
  }

}
tagValues(tags){
  this.reportData['excludedTags'] = tags;
}
tagType(tagTypes){
  this.reportData['excludedTagTypes'] = tagTypes;
  console.log(this.reportData['excludedTagTypes'])
}
fetchRecords( selectedUhid : string){
    this.reportData['excludedTags'] = this.reportData['excludedTags'].toString()
    this.reportData['excludedTagTypes'] = this.reportData['excludedTagTypes'].toString()
    this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + selectedUhid + '&xids=' + this.reportData['excludedTags']+ '&ptyp=' + this.contactType +'&xtyps=' + this.reportData['excludedTagTypes'];
    this.CommonService.getReportData(this.selected['selectedId'],this.reportData['param1']).subscribe((res) => {
      if(res.results.statusCode == 200 || res.results.statusCode ==  503){
            this.reportData['data'] = res.results.data['First_Degree_contact: ']
            this.reportData['index'] = 1;
          }
    })
}
shareRecords(records : any []){
  this.reportData['excelData'] = [];
  //this.reportData.excelData[0] = records[0]
  if(records.length > 0){
    for(let i=0;i<records.length;i++){
      if(typeof records[i] !== 'undefined') {
        this.reportData.excelData[i*2] =[]
        this.reportData.excelData[i*2] = records[i];
        let length = this.reportData['excelData'].length;
        let data=[]
        this.reportData.excelData[length] =[]
        for(let j=0;j<records[i].length;j++){    
          for(let k=0;k<records[i][j].children.length;k++){
          data.push(Object.assign({},records[i][j],records[i][j].children[k]))
          }
        }
        this.reportData.excelData[length] = data;
      }
    }
    console.log(this.reportData['excelData'])
  }
  }
 
selectedUhid(Uhid : any []){
  this.reportData['selectedUhid'] =[]
  for(let id=0;id<Uhid.length;id++){
    this.reportData['selectedUhid'][id*2] = Uhid[id]+'-Summary'
    let length = this.reportData['selectedUhid'].length
    this.reportData['selectedUhid'][length] = Uhid[id] + '-Details'
  }
}
treeDiagram(){
this.reportData['tableView'] = false;
document.getElementById('treeDiagram').innerHTML = "";
let maxnodes={};
let maximumNode:any;
this.reportData.tree.forEach(function(item){
  maxnodes[item.level]? maxnodes[item.level]++ : maxnodes[item.level]=1;
});
console.log(maxnodes)
maximumNode = Math.max.apply(null, Object.values(maxnodes));
console.log(maximumNode)
let treeData = d3.stratify()
  .id(function(d) { return d['Identifier']; })
  .parentId(function(d) { return d.parentIdentifier; })
  (this.reportData['tree']);
  
treeData.each(function(d) {
    d['Identifier'] = d.data['Identifier'];
  });
this.reportData.margin = {top: 30, right: 90, bottom: 30, left: 5};
  this.reportData.width = (maximumNode * 80) - this.reportData.margin.left - this.reportData.margin.right;
  this.reportData.height = (treeData.height * 180)- this.reportData.margin.top - this.reportData.margin.bottom;

let legend = d3.select("#treeDiagram").append("svg")
            .attr('width',200)
            .attr('height',80)
            .attr('transform', "translate(80,20)")
legend.append("circle").attr("cx",20).attr("cy",20).attr("r", 6).style("stroke", "#ff0000").style("stroke-width",'2px').style('fill','white')
legend.append("circle").attr("cx",20).attr("cy",50).attr("r", 6).style("stroke", "#ffa500").style("stroke-width",'2px').style('fill','white')
legend.append("text").attr("x",30).attr("y",20).text("Close Contact").style("font-size", "10px").attr("alignment-baseline","middle")
legend.append("text").attr("x",30).attr("y",50).text("Normal Contact").style("font-size", "10px").attr("alignment-baseline","middle")
this.reportData.svg = d3.select("#treeDiagram").append("svg")
.attr("width", this.reportData.width + this.reportData.margin.right + this.reportData.margin.left)
.attr("height", this.reportData.height + this.reportData.margin.top + this.reportData.margin.bottom)
.append("g")
.attr("transform", "translate("
      + ((this.reportData.width/1.5)+5) + "," +((this.reportData.height/8)+8) + ")");
this.reportData.index = 0;
this.reportData.duration = 750;
this.reportData.treemap = d3.tree()
  .nodeSize([60,])
    .separation(function separation(a, b) {
        return a.parent == b.parent ? 1 : 2;
    });
this.reportData.root = d3.hierarchy(treeData, function(d) { return d.children; });
this.reportData.root.x0 = this.reportData.height / 2;
this.reportData.root.y0 = 1;
//root.children.forEach(collapse);
this.update(this.reportData.root)
function collapse(d) {
if(d.children) {
d._children = d.children
d._children.forEach(collapse)
d.children = null
}
}

}
public update(source){
  console.log(source)
  this.reportData.svg.selectAll('svg')
  .attr("width", this.reportData.width + this.reportData.margin.right + this.reportData.margin.left)
  .attr("height", this.reportData.height + this.reportData.margin.top + this.reportData.margin.bottom)
  this.reportData.treemap = d3.tree()
  .size([this.reportData.height, this.reportData.width])
  .nodeSize([60,])
  .separation(function separation(a, b) {
      return a.parent == b.parent ? 1 : 2;
  });

let treeData = this.reportData.treemap(this.reportData.root);
let nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);
nodes.forEach(function(d){ d.y = d.depth * 100});
let node = this.reportData.svg.selectAll('g.node')
    .data(nodes, function(d) {return d.Identifier || (d.Identifier = ++this.index); });
let nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", function(d) {
      return "translate(" + source.x0 + "," + source.y0 + ")";
  });

// nodeEnter.on('click', function(d){
//     this.clicked = d['Contact UHID']
//   }) 
nodeEnter.on('click',this.UpdateTree.bind(this))
nodeEnter.on("mouseover", function(p) {
    div.transition()
      .duration(200)
      .style("opacity", .9);
      div.html('Number Of times Contacted : ' + "<b>"+p.data.data['Count']+"</b>"+ "<br/>" +'Duration Of Contact : ' +"<b>"+ p.data.data['Duration']+"</b>" + "<br/>" + 'Contact Time : ' + "<b>"+p.data.data['From Time']+"</b>")
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 20) + "px");
    })
nodeEnter.on("mouseout", function(d) {
    div.transition()
      .duration(500)
      .style("opacity", 0);
    });
nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style("fill", function(d) {
        return d.data.data['Close contact'] == 'Yes' ? "#ff0000" : "#ffa500";
    });
nodeEnter.append('text')
    .attr("dy", ".35em")
    .attr("y", function(d) {
        return d.children || d._children ? -18 : 18;
    })
    .attr("text-anchor", "middle")
    .text(function(d) { 
      return d.data.data['Contact Name']; })
    .style('font','12px sans-serif')
    

let div = d3.select("#treeDiagram").append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style('font','10px sans-serif')
.style('position', 'absolute')
.style('text-align','left')
.style('width','190px')
.style('height','50px')
.style('padding','2px')
.style('font','11px sans-serif')
.style('background','lightsteelblue')
.style('border','0px')
.style('border-radius','8px')
.style('pointer-events','none')
let nodeUpdate = nodeEnter.merge(node);
nodeUpdate.transition()
  .duration(this.reportData['duration'])
  .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")";
   });

nodeUpdate.select('circle.node')
  .attr('r', 8)
  .style("fill", function(d) {
     return d._children ? d.data.data['close contact'] == 'Yes' ? "#ff0000" : "#ffa500" : "#fff";
  })
  .style('stroke',function(d) {
     return d.data.data['close contact'] == 'Yes' ? "#ff0000" : "#ffa500";
  })
  .style('stroke-width','3px')
  .attr('cursor', 'pointer');
let nodeExit = node.exit().transition()
    .duration(this.reportData['duration'])
    .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();
nodeExit.select('circle')
  .attr('r', 1e-6);
nodeExit.select('text')
  .style('fill-opacity', 1e-6);
let link = this.reportData.svg.selectAll('path.link')
    .data(links, function(d) { return d.Identifier; });
let linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('d', function(d){
      console.log(d)
      let o = {x: source.x0, y: source.y0}
      // return "M" + o.x + "," + o.y + "V" + o.y + "H" + o.x;
      return "M" + o.x + "," + o.y + "V" + o.y + "H" + o.x;
      })
    .style('fill','none')
    .style('stroke','#ccc')
    .style('stroke-width','2px')
    
let linkUpdate = linkEnter.merge(link);

linkUpdate.transition()
    .duration(this.reportData['duration'])
    //.attr('d', function(d){return "M" + d.x + "," + d.y + "H" + d.parent.x + "V" + d.parent.y;});
    .attr('d',function(d){
      return "M" + d.parent.x + "," + d.parent.y+ "H" + d.x + "V" + d.y;})
let linkExit = link.exit().transition()
    .duration(this.reportData['duration'])
    .attr('d', function(d) {
      let o = {x: source.x, y: source.y}
      return "M" + o.x + "," + o.y + "V" + o.y + "H" + (o.x-2);
      //return "M" + o.x + "," + o.y + "V" + o.y + "H" + (o.x-0);
    })
    .remove();
nodes.forEach(function(d){
  d.x0 = d.x;
  d.y0 = d.y;
});

}
public click(d) {

  if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  this.update(d);
}
public UpdateTree(clicked){
if(this.reportData['clickedId'].indexOf(clicked.data.data['con_tag_value']) < 0){

  let excludedId = this.reportData['clickedId'].toString(); 
  let excludedTagTypes = this.reportData['clickedTagType'].toString();
  this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + clicked.data.data['Contact ID'] + '&xids=' + excludedId +'&ptyp='+ this.contactType +'&xtyps=' + excludedTagTypes;
  this.reportData['clickedId'].push(clicked.data.data['con_tag_value']) 
  this.reportData['clickedTagType'].push(clicked.data.data['Tag Type'])
  this.CommonService.getReportData(this.selected['selectedId'],this.reportData['param1']).subscribe((res) => {
    if(res.results.statusCode == 200 && res.results.data != null){
      let i = this.reportData['tree'].length;
      console.log(clicked.data.data.Identifier)
      res.results.data['First_Degree_contact: '].forEach((item) => {
        item.parentIdentifier = clicked.data.data.Identifier
        item.Identifier = i+1
        item.level = clicked.data.data.level + 1
        i = i+1
       });
      this.reportData['tree'] = this.reportData['tree'].concat(res.results.data['First_Degree_contact: '])
      console.log(this.reportData['tree']) 
      this.treeDiagram();
    }
  })

}
else{
  this.click(clicked)
}

}
downloadExcel() {
  let excelData : any;
  let name = this.selected['name'];
  let transpose = false;
  let date = this.selected['toDate'];
  if (this.reportData.length || this.reportData != null) {
    excelData = this.reportData['Table'];
    if (this.selected['selectedId'] == 'coaster-details') {
      excelData=(excelData.map(({ id,facility_id,orderby_col,...item }) => item));
    } else if(this.selected['selectedId'] == 'tat-all-rep'){
      excelData =  this.reportData.fullexcelData;
    } else if(this.selected['selectedId'] == 'hc_plan_summary2'){
      date = this.selected['fromDate'];
    } else if (this.selected['selectedId'] == 'emp-contact') {
      date = this.selected['fromDate']
      let del = ['UHID', 'Name', 'Identifier', 'Is_CloseContact', 'con_tag_value', 'parentIdentifier', 'tag_value','AtRisk','level'];
      let data = this.reportData['excelData'];
      for(let i=0;i<data.length;i++){
        data[i].map(function(item) { 
          for(let j=0;j<del.length;j++)
          delete item[del[j]]; 
          return item; 
      });
      }
      this.reportData['fullExcelDetails'] = [];
      this.reportData['fullExcelDetails'].push(data);
      this.reportData['fullExcelDetails'].push(this.reportData['selectedUhid']);
      excelData = this.reportData['fullExcelDetails'];
      this.getHealthCheckupReports('emp-contact')
    } else if(this.selected['selectedId'] ==  'hc_test_summary2'){
       date = this.selected['fromDate']
       let del = ['Total contact time','Start Time','End Time'];
       let data = this.reportData['Table'];
       for(let i=0;i<data.length;i++){
         delete data[i][del[0]]
       }
       excelData =  data;
    } else if(this.selected['selectedId'] == 'pat-tag-status'){
      excelData = this.reportData['Table'];
      date = this.datepipe.transform(this.date, 'yyyy-MM-dd');;
    }else {
      excelData = this.reportData['Table']
    }
    this.excelService.exportAsExcelFile(excelData, name, transpose, date, this.selected['selectedId']);
  } else {
    excelData = [];
  }
}
downloadPDF() {
  let pdfData : any;
  if (this.reportData.length || this.reportData != null) {
    let chartImage = [];
    let name: string;
    pdfData=this.reportData;
    if (this.selected['selectedId'] == 'open-encounter') {
      name = 'Open Encounter Report';
    } else if (this.selected['selectedId'] == 'report1') {
      name = 'TAT by Patient';
    } else if(this.selected['selectedId'] == 'pat-sample-coll') {
      name = 'Patient Sample Collection Report'
    } else if (this.selected['selectedId'] == 'geofencevio') {
      name = 'Geo Fence Violation Report';
      chartImage = [document.getElementById('geofenceViolationChart')];
    } else if (this.selected['selectedId'] == 'patient-status') {
      name = 'Patient Summary';
      this.reportData['TableColumns'] = [];
      chartImage = [document.getElementById('genderChart'), document.getElementById('deviceChart'), document.getElementById('languageChart'), document.getElementById('timewise'), document.getElementById('daywise'), document.getElementById('consultant')];
    } else if (this.selected['selectedId'] == 'hc_plan_summary2') {
      name = 'Package Summary';
      chartImage = [document.getElementById('packageSummary')];
    } else if (this.selected['selectedId'] == 'coaster-details') {
      name = 'Coaster Return Report';
      pdfData['Table']=(pdfData['Table'].map(({ id,facility_id,orderby_col,...item }) => item));
      chartImage = [document.getElementById('coaster-return-report'), document.getElementById('coaster-battery-status')];
    } else if (this.selected['selectedId'] == 'hc_test_summary2') {
      name = 'Test Summary';
      chartImage = [document.getElementById('line-wait-time'), document.getElementById('line-contact-time')];
    }
    this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], this.selected['selectedId'], chartImage);
  } else {
    pdfData = [];
  }
}
  fixClick() {
    console.log('')
  }
}
