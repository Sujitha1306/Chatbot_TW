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
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-daycare-report',
  templateUrl: './daycare-report.component.html',
  styleUrls: ['./daycare-report.component.scss']
})
export class DaycareReportComponent implements OnInit {
  public reportForm: FormGroup;
  public selectedReport : any = new FormControl();
  public date: any = new Date();
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public patientSub : Subject<any> = new Subject();
  public selectedTreatment = new FormControl();
  public reportList : any;
  public reportData : any = [];
  public regionValue: string;
  public facilityList : any;
  public HCselected = 'day_care';
  public selected : any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  public patientList: any = [];
  public patientId: any = new FormControl(null);
  public pid = null;
  public today = new Date();

  constructor(public datepipe: DatePipe, private readonly CommonService: CommonService,
    public fb: FormBuilder, public excelService: ExcelService, public pdfService: PdfService, public ChartService : ChartService, public hospitalService : HospitalService) {
      this.getReportList();
      this.getFacilityList();
    }

  ngOnInit() {
    this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getPatients(searchTextValue);
    });  
    this.getDaycareReports(this.HCselected);
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
  public buildForm() {
    this.reportForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : '']
      });
  }
  getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTDC") : null;
    let tempId =submenus['id'];
    let replist = permissions['dropdown'].filter(res=> res.parentId == tempId);
    this.reportList = replist;
     const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
      if (firstSeqReport) {
        this.HCselected = firstSeqReport.code;
      }
    this.getDaycareReports(this.HCselected);
  }
  getFacilityList(){
    this.regionValue = localStorage.getItem('regionId')
    this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
      this.facilityList = fac.results;
  });
  }

  getDaycareReports(id){
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
    this.reportData = {};
    this.reportData.noRecords = false;
    this.reportData['showTable'] = false;
    this.reportData['showTatTable'] = false;
    this.reportData['showDCTable'] = false;
    this.reportData['showSecondTable'] =  false;
    this.reportData['showCard'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    this.reportData['invalidDate'] = false;
    this.reportData['charts'] = [];
    this.reportData['TableColumns'] = [];
    this.reportData['prevselected'] = this.HCselected;
    if (id == 'day_care') {
      let showTitle : boolean = false;
      this.reportData['showDCTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData('patient-status-dc',this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.noRecords = false;
          this.reportData['statsShow'] = true;
          this.reportData['enableexcel'] = true;
          this.reportData['pieShow'] = true;
          this.reportData['barShow'] = true;
          this.reportData['enablepdf'] = true;
          this.reportData['exportData'] = res.results.data;
          this.reportData['totalpatients'] = this.reportData['exportData']['totpat']['Total_Patients'];
          this.reportData['diabeticCount'] = this.reportData['exportData'].diabetic.Diabetic.Count;
          this.reportData['nonDiabeticCount'] = this.reportData['exportData'].diabetic['Non Diabetic']['Count'];
          this.reportData['diabeticTAT'] = this.reportData['exportData'].diabetic.Diabetic['Avg TAT'];
          this.reportData['nonDiabeticTAT'] = this.reportData['exportData'].diabetic['Non Diabetic']['Avg TAT'];
          this.reportData['treatmentList'] = this.reportData['exportData'].treatment_code.treatment;
          this.reportData['dcTable'] = this.reportData['exportData']['dc detail'];
          if(this.reportData['dcTable'].length > 0){
            this.reportData['dcTableCol'] = Object.keys(this.reportData['dcTable'][0]);
            this.reportData['showDCTable'] = true;
          }
          if(this.reportData['totalpatients'] > 0)
            showTitle = true;
          this.ChartService.drawChart({'id':id,'canvasId':'DCgender','type':'pie','data':this.reportData['exportData'].gender.data,'label':this.reportData['exportData'].gender.label,'title':'Gender','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'DCdevice','type':'pie','data':this.reportData['exportData'].tag.data,'label':this.reportData['exportData'].tag.label,'title':'Devices used','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'DClanguage','type':'pie','data':this.reportData['exportData'].lang.data,'label':this.reportData['exportData'].lang.label,'title':'Languages Preferred','showTitle':showTitle});
          this.ChartService.drawChart({'id':id,'canvasId':'DCconsultants','type':'bar-line','data':[this.reportData['exportData'].treatment_code.pat_count,this.reportData['exportData'].treatment_code.TAT,this.reportData['exportData'].treatment_code.avg_contact,this.reportData['exportData'].treatment_code.wait_time],'label':this.reportData['exportData'].treatment_code.treatment,'title':'Patient Count, TAT, Wait Time and Contact Time By Consultants','showTitle':true,'showLegend':false});
          this.ChartService.drawChart({'id':id,'canvasId':'DCinOutCount','type':'stacked','data':[this.reportData['exportData'].timewise.data.IN,this.reportData['exportData'].timewise.data.OUT],'label':this.reportData['exportData'].timewise.label,'barLabel':['In','Out'],'title':'Hourly Patient In vs Out','showTitle':showTitle})
          //this.dayCareChart(this.reportData['exportData']);
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'dc-pat-tat'){
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      if(this.patientId.value != null && this.patientId.value != ''){
        this.reportData['param'] = this.reportData['param']+'&pid=' + this.pid;
      }
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.noRecords = false;
          this.reportData['enableexcel'] = true;
          this.reportData['exportData'] = res.results.data;
          this.reportData['Table'] = this.reportData['exportData']['dc all'];
          this.reportData['tatTable'] = this.reportData['exportData']['dc agg'];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
          if(this.reportData['tatTable'].length > 0){
            this.reportData['tatTableColumns'] = Object.keys(this.reportData['tatTable'][0]);
            this.reportData['showTatTable'] = true;
          }
          this.reportData['excelData']=[];
          this.reportData['excelData'][0]= this.reportData['tatTable'];
          this.reportData['excelData'][1]= this.reportData['Table'];
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'DC-utilz'){
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.noRecords = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data['DC Detail'];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          }
          this.reportData['excelData']=[];
          this.reportData['excelData'][0]= [...this.reportData['Table']];
          this.reportData['excelData'][1]=[];
          for(let i=0;i<this.reportData['Table'].length;i++){    
            for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
              this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]))
              // delete this.reportData['excelData'][0][i]['children']
            }
            }
        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    }
    let selectedData  = this.reportList.filter(res=> res.link === id);
    this.selected={'selectedId': id , 'fromDate': this.fromDate,'toDate':this.toDate, 'facility' : this.facilityId, 'name':selectedData[0].name, 'pid':this.pid};
  }

  setPatientName(data) {
    this.pid = data.id;
    this.patientId.setValue(data.firstName);
  }
  clearUhid(){
    this.patientId.setValue(null);
    this.pid = null;
  }
  getPatientsCheck(key) {
    this.patientSub.next(key);
  }  
  getPatients(key) {
    if (key.target.value !== "") {
      let val = key.target.value;
      if (val.length >= 2) {
        this.CommonService.searchPatient(key.target.value).subscribe((res) => {
          this.patientList = res.results.filter(res => res.mainidentifier != null);
        });
      }
    } else {
      this.patientList = [];
      this.patientId.setValue(null)
      this.pid = null;
    }
  }

  downloadPDF() {
    let pdfData : any;
    console.log(this.reportData);
    if (this.reportData.length || this.reportData != null) {
      let chartImage = [];
      let name: string;
      pdfData=this.reportData;
      if (this.selected['selectedId'] == 'day_care') {
        name = 'Day Care Report';
        chartImage = [document.getElementById('DCgender'), document.getElementById('DCdevice'), document.getElementById('DClanguage'), document.getElementById('DCconsultants'), document.getElementById('DCinOutCount')];
      }else{
        name = this.selected['selectedId'];
      }
      this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], this.selected['selectedId'], chartImage);
    } else {
      pdfData = [];
    }
  }
  downloadExcel() {
    let excelData : any;
    let name = this.selected['name'];
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
      if(this.HCselected == 'dc-pat-tat'){
        excelData=[];
        excelData[0] = this.reportData['excelData'];
        excelData[1] = ['Patient TAT','Patient Detail'];
      } else if(this.HCselected == 'day_care'){
        excelData = this.reportData['dcTable'];
      } else if(this.selected['selectedId'] == 'DC-utilz'){
        excelData=[];
        excelData[0] =  [...this.reportData['excelData']];
        for(let i=0;i<excelData[0][0].length;i++){
          delete excelData[0][0][i]['children']
          //delete excelData[0][0][i]['close']
        }
        for(let i=0;i<excelData[0][1].length;i++){
          delete excelData[0][1][i]['children']
        }
        excelData[1] = ['Day-Care Utilization summary','Day-Care Utilization details']
        this.getDaycareReports('DC-utilz')
    }else{
        excelData = this.reportData['Table'];
      }
      this.excelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
  } else {
      excelData = [];
  }
  }
  fixClick() {
    console.log('')
  }  
}
