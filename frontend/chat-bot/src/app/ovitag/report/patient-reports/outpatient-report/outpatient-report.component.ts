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
import { ExcelService, CommonService, PdfService, ChartService, HospitalService } from '../../../../shared';
import { FormGroup, FormBuilder,  FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { environment } from './../../../../../environments/environment';
import { id } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-outpatient-report',
  templateUrl: './outpatient-report.component.html',
  styleUrls: ['./outpatient-report.component.scss']
})
export class OutpatientReportComponent implements OnInit {
  public reportForm: FormGroup;
  public selectedReport : any = new FormControl();
  public date: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public reportList : any;
  public reportData : any = [];
  public selectedSpeciality: any = new FormControl();
  public regionValue: string;
  public facilityList : any;
  public HCselected = 'patient-status-op';
  public selected : any;
  public chartImage: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  public today = new Date();
  constructor(public datepipe: DatePipe, private readonly CommonService: CommonService,
    public fb: FormBuilder, public excelService: ExcelService, public pdfService: PdfService, public ChartService : ChartService, public hospitalService : HospitalService) {
      this.reportList = environment.base_value.outpatient_reports;
      this.getReportList();
      this.getFacilityList();
    }

    ngOnInit() {
      this.getOutpatientReports(this.HCselected);
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
  }
  getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    // let submenusList = menuItemsList[0]['subMenus'].filter(res=> res.code== "MN_AIPTS");
    let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTOP") : null;
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

  getFacilityList(){
    this.regionValue = localStorage.getItem('regionId')
    this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
      this.facilityList = fac.results;
  });
  }

  getOutpatientReports(id){
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')   
    this.reportData = {};
    this.reportData.noRecords = false;
    this.reportData.loading = true;
    this.reportData['showTable'] = false;
    this.reportData['showSecondTable'] =  false;
    this.reportData['showCard'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    this.reportData['invalidDate'] = false;
    this.reportData['prevselected'] = this.HCselected;
    this.reportData['charts'] = [];
    if(id == 'patient-status-op'){
      let showTitle : boolean = false;
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.noRecords = false;
          this.reportData['showExcel'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['totalOutPatients'] = res.results.data['Total OP Patients'][0];
          this.reportData['genderChartData'] = res.results.data.gender;
          this.reportData['languageChartData'] = res.results.data.lang;
          this.reportData['deviceChartData'] = res.results.data.tag;
          this.reportData['timeWiseChartData'] = res.results.data.timewise;
          this.reportData['specialityList'] = res.results.data.specialty_wise.label;
          this.reportData['specialityList'] =['ALL'];
          this.reportData['specialityList'] = this.reportData['specialityList'].concat(res.results.data.specialty_wise.label)
          this.reportData['floorWiseData'] = [res.results.data.Floor.data['Patient Count'], res.results.data.Floor.data.Completed , res.results.data.Floor.data.Inprogress ] ;
          this.reportData['specialityData'] = res.results.data.specialty_wise;
          this.reportData['specialityWise'] = res.results.data.specialty_wise;
          this.reportData['consultantWise'] = res.results.data.consultant_wise;
          this.reportData['showChart'] = false;
          if(this.reportData['totalOutPatients'] > 0)
            showTitle = true;
          this.ChartService.drawChart({'id':id,'canvasId':'OPGender','type':'doughnut','data':this.reportData['genderChartData'].data,'label':this.reportData['genderChartData'].label,'showAnimations' : true,'total' : this.reportData['totalOutPatients'],'title':['Gender','Total : ' + this.reportData['totalOutPatients']],'showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'OPdevice','type':'pie','data':this.reportData['deviceChartData'].data,'label':this.reportData['deviceChartData'].label,'title':'Devices used','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'OPlanguage','type':'pie','data':this.reportData['languageChartData'].data,'label':this.reportData['languageChartData'].label,'title':'Languages Preferred','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'OPfloorwise','type':'stacked','data':this.reportData['floorWiseData'],'title':'Floorwise Patient Count And Status','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'OPinOutCount','type':'grouped','data':[this.reportData['timeWiseChartData'].data.IN,this.reportData['timeWiseChartData'].data.OUT],'label':this.reportData['timeWiseChartData'].label,'barLabel':['In','Out'],'title':'Hourly Patient In vs Out','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'OPCompCount','type':'grouped','data':[this.reportData['specialityWise'].TAT,this.reportData['specialityWise'].Completed],'label':this.reportData['specialityWise'].label,'barLabel':['TAT','Completed'],'title':'TAT and Completed by Service','showTitle':showTitle});
          // this.OutPatientSpecialityChart(id);
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      });
    }
    else if(id == 'out_patient_TAT'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.CommonService.getReportData('TAT-OP',this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data.length > 0) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['enablepdf'] = false;
          this.reportData['Table'] = res.results.data;
          console.log(this.reportData['Table']);
          for (let i = 0; i < this.reportData['Table'].length; i++) {
              this.reportData['Table'][i]['Birth Date'] = this.datepipe.transform(this.reportData['Table'][i]['Birth Date'], 'dd/MM/yyyy');
              this.reportData['Table'][i]['Check In'] = this.datepipe.transform(this.reportData['Table'][i]['Check In'], 'dd/MM/yyyy HH : mm : ss');
              this.reportData['Table'][i]['Check Out'] = this.datepipe.transform(this.reportData['Table'][i]['Check Out'], 'dd/MM/yyyy HH : mm : ss');
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
    }
    else if(id == 'geofencevio'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&vtyp=outpatient';
        this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
          this.reportData['loading'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['enablepdf'] = true;
          this.reportData['noRecords'] = false;
          this.reportData['label'] = [];
          this.reportData['data'] = [];
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
              this.reportData['Table'] = res.results.data;
              for (let i = 0; i < this.reportData['Table'].length; i++) {
                this.reportData['Table'][i]['Alert Date'] = this.datepipe.transform(this.reportData['Table'][i]['Alert Date'], 'M/d/yy, h:mm a');
              }
              for (let key = 0; key < res.results.chart.length; key++) {
                this.reportData['label'].push(res.results.chart[key].Floor);
                this.reportData['data'].push(res.results.chart[key].counts);
              }
              this.reportData['TableColumns'] = [];
              if(this.reportData['Table'].length > 0){
                this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                this.reportData['showTable'] = true;
              }   
              this.ChartService.drawChart({'id':id,'canvasId':'geofenceViolation','type':'pie','data':this.reportData.data,'label':this.reportData.label,'title':'Geofence Violation','showTitle':true});         } else {
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
        });
      }
    }
    this.selected = {'selectedId': id, 'fromDate' : this.fromDate, 'todate': this.toDate};
  }

  validate(sDate: string, eDate: string){
    this.validDate = true;
    if((sDate != null && eDate !=null) && (eDate < sDate) ){
      this.validDate = false;
      this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
    }
    return this.validDate;
  }
  getSpecialitySelectionDetail(){
    if(this.selectedSpeciality.value == 'ALL'){
      this.reportData['specialityWise'] = this.reportData['specialityData'];
    }
    else{
       for(let i=0;i<this.reportData.consultantWise.length;i++)
        {
          console.log(Object.keys(this.reportData['consultantWise'][i]))
          if(Object.keys(this.reportData['consultantWise'][i]) == this.selectedSpeciality.value)
          {
            //this.reportData['updatedChartData'] = Object.values(this.reportData.consultantWise[i]);
          }
        }
        this.reportData['specialityWise'] = this.reportData['updatedChartData'][0];
    }  
    this.OutPatientSpecialityChart(id);
  }

  OutPatientSpecialityChart(id)
  {
    console.log(this.reportData['specialityWise']);
    this.ChartService.drawChart({'id':id,'canvasId':'OPspecialityWise','type':'bar-line','data':[this.reportData['specialityWise'].TAT,this.reportData['specialityWise'].avg_contact,this.reportData['specialityWise'].wait_time],'label':this.reportData['specialityWise'].label,'barLabel':['TAT','Contact Time','Wait Time'],'title':[this.selectedSpeciality.value,'Patient Count, TAT, Wait Time and Contact Time',' ',' '],'showTitle':true,'showLegend':true});
    this.ChartService.drawChart({'id':id,'canvasId':'OPspecialityWiseCount','type':'grouped','data':[this.reportData['specialityWise'].Pat_cnt,this.reportData['specialityWise'].Completed,this.reportData['specialityWise']["In Progress"]],'label':this.reportData['specialityWise'].label,'barLabel':['Total','Completed','Requested'],'title':'Patient Count and Status','showTitle':true});
  }

  downloadExcel() {
    let excelData : any;
    let name = '';
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
        name = name + this.selected['selectedId'];
        excelData =  this.reportData['Table'];     
      this.excelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
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
      if (this.selected['selectedId'] == 'patient-status-op'){
        name = 'Out Patient Report';
        this.reportData['TableColumns'] = [];
        this.chartImage = [document.getElementById('OPGender'), document.getElementById('OPdevice'), document.getElementById('OPlanguage'), document.getElementById('OPinOutCount'), document.getElementById('OPfloorwise'), document.getElementById('OPspecialityWise'), document.getElementById('OPspecialityWiseCount'),this.selectedSpeciality.value];
      }else if(this.selected['selectedId'] == 'geofencevio'){
        name = 'Geo Fence Violation Report';
        this.chartImage = [document.getElementById('geofenceViolation')];
      }else {
        name = this.selected['selectedId'];
      }
      console.log('1 :' + this.chartImage.length);
      this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], this.selected['selectedId'], this.chartImage);
     } else {
      pdfData = [];
    }
  }
  fixClick() {
    console.log('')
  }
}
