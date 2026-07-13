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
import { BaseChartDirective } from 'ng2-charts';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'app-infantsecurity-report',
  templateUrl: './infantsecurity-report.component.html',
  styleUrls: ['./infantsecurity-report.component.scss']
})
export class InfantsecurityReportComponent implements OnInit {
  public reportForm: FormGroup;
  public selectedReport : any = new FormControl();
  public patientUhid: any = new FormControl();
  public patientSub : Subject<any> = new Subject();
  public date: any = new Date();
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public fromDate1 = this.datepipe.transform(this.date, 'yyyy-MM-ddTHH:mm:ss');
  public toDate1 = this.datepipe.transform(this.date, 'yyyy-MM-ddTHH:mm:ss');
  public todayDate = this.datepipe.transform(this.date, 'yyyy-MM-ddTHH:mm:ss');
  public isShowLabel : boolean = false;
  public vitalParam : any = 'all';
  public reportList : any;
  public reportData : any = [];
  public patientList: any = [];
  public allLineData = [];
  public allLineLabels = [];
  public allLineColours = [];
  public lineOptions = {};
  public selectedVital = { name: '', low: '', high: ''}
  public HCselected = 'newborn-summary';
  today = new Date();
  public selected : any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public unit : any = 'C';
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  public activate_btn: any = [];
  validDate: any;
  constructor(public datepipe: DatePipe, public PdfService: PdfService,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService) {
      this.activate_btn = this.CommonService.getActivePermission('button');
      this.getReportList();
    }

  ngOnInit() {
    this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getPatients(searchTextValue);
    });  
    this.getinPatientReports(this.HCselected);
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
    let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTIF") : null;
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
        fromDate1: [this.fromDate1 ? this.fromDate1 : ''],
        toDate1: [this.toDate1 ? this.toDate1 : ''],
        unit: [this.unit ? this.unit : ''],
        });
    }
    getinPatientReports(id){
      this.selectedReport.setValue(id);
      this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
      this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
      this.reportData = {};
      this.reportData.noRecords = false;
      this.reportData.loading = true;
      this.reportData['showTable'] = false;
      this.reportData['showSecondTable'] =  false;
      this.reportData['showCard'] = false;
      this.reportData['enableexcel'] = false;
      this.reportData['enablepdf'] = false;
      this.reportData['charts'] = [];
      this.patientList = [];
      if (id == 'newborn-summary') {
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            this.reportData.loading = false;
            this.reportData['enablepdf'] = true;
            this.reportData['enableexcel'] = true;
            const label: any = [];
            const data: any = [];
            if (res.results.statusCode == 200 && res.results.data != null) {
                this.reportData['excelData'] = [];
                // this.reportData['numberOfBabies'] = res.results.data.New_born_info['Total:'][0] ;
                // this.reportData['numberOfMale'] = res.results.data.New_born_info['Male:'][0];
                // this.reportData['numberOfFemale'] = res.results.data.New_born_info['Female:'][0];
                // this.reportData['twins'] = res.results.data.New_born_info['No Of Twins:'];
                // this.reportData['babiesDischargedToday'] = res.results.data.New_born_info['No Of Discharge:'];
                // this.reportData['numberOfStaffs'] = res.results.data.ward_info['Staffs:'];
                // this.reportData['Ratio'] = res.results.data.ward_info['Ratio:'];
                // this.reportData['ALOS'] = res.results.data.ward_info['ALOS:'];
                this.reportData['patientCountChartData'] = res.results.data.Doctor;
                // this.reportData['AgeWiseChartData'] = res.results.data.Age;
                this.reportData['infantAlertTableData'] = res.results.data.Alerts;
                // this.reportData['geoAlertCount'] = res.results.data['Alert Count']['Alert Count:'];
                this.reportData['babyDetail'] = res.results.data['Baby Detail'];
                this.reportData['card'] = res.results.data;
                for(let i=0;i<this.reportData['babyDetail'].length;i++){
                  this.reportData['babyDetail'][i]['birth_date'] = this.datepipe.transform(this.reportData['babyDetail'][i]['birth_date'], 'dd/MM/yyyy')
                }
                this.reportData['excelData'].push(this.reportData['infantAlertTableData']);
                this.reportData['excelData'].push(this.reportData['babyDetail']);
                this.reportData['AlertTable'] = res.results.data.Alerts;
                this.reportData['AlertTableColumns'] = [];
                if(this.reportData['AlertTable'].length > 0){
                  this.reportData['AlertTableColumns'] = ['UHID','Name','Floor','Alert Message','Is Ack?'];
                  this.reportData['showTable'] = true;
                }
                this.reportData['Table'] = res.results.data['Baby Detail'];
                this.reportData['TableColumns'] = [];
                if(this.reportData['Table'].length > 0){
                  this.reportData['TableColumns'] = Object.keys(this.reportData['babyDetail'][0]);
                  this.reportData['showTable'] = true;
                }
                this.reportData['fullData'] = this.reportData;
                this.reportData.InfantTablepdf = this.reportData['infantAlertTableData'];
                for (let i = 0; i < this.reportData.InfantTablepdf.length; i++) {
                  delete this.reportData.InfantTablepdf[i].Gender;
                  delete this.reportData.InfantTablepdf[i].Location;
                  delete this.reportData.InfantTablepdf[i]['Alert Date'];
                  delete this.reportData.InfantTablepdf[i]['Ack. Date'];
                }
                // this.ChartService.drawChart({'id':id,'canvasId':'ageWiseCount','type':'pie','data':this.reportData['AgeWiseChartData']['data'],'label':this.reportData['AgeWiseChartData']['label'],'title':'Agewise Count','showTitle':true});
                this.ChartService.drawChart({'id':id,'canvasId':'patientCountByDoctor','type':'bar','data':this.reportData['patientCountChartData']['data'],'label':this.reportData['patientCountChartData']['label'],'title':'Patient Count by Doctor','showTitle':true,'barLabel':['Doctor Count']});  
                this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':6,'gutterSize':'0px'};
                this.reportData['tileInfo'] = [
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Patients','content':this.reportData['card']['Admission Card']['Total Admission:'],'male':this.reportData['card']['Admission Card']['Count:'][1],'female':this.reportData['card']['Admission Card']['Count:'][0],'others':this.reportData['card']['Admission Card']['Count:'][2]},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Discharged','content':this.reportData['card']['Discharge Card']['Total Discharge:'],'male':this.reportData['card']['Discharge Card']['Count:'][1],'female':this.reportData['card']['Discharge Card']['Count:'][0],'others':this.reportData['card']['Discharge Card']['Count:'][2]},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Geofence Alerts','content':this.reportData['card']['Alert Card']['Geofence:']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Tampered','content':this.reportData['card']['Alert Card']['Tampered:']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Infant Separation','content':this.reportData['card']['Alert Card']['Sepration:']},
                {'rowspan':1,'colspan':1,'showHeader':true,'header':'Wrong Mother & Child Proximity','content':this.reportData['card']['Alert Card']['WrongMother:']}];
                this.reportData['showCards'] = true;        
             } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
            }
          });
        }
      } else if(id == 'mov-rep') {
        this.reportData['param'] = '/fdt=' + this.fromDate + '&uid=' + this.patientUhid.value;
        this.CommonService.getReportData("infant-tracking",this.reportData['param']).subscribe(res => { 
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['loading'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData['movTable'] = res.results.data['journey '] ;
            this.reportData['TableColumns'] = [];
            if(this.reportData['movTable'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['movTable'][0]);
              this.reportData['showTable'] = true;
            }
          } else {
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
        });
      } else if(id == 'geofence-rep'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&vtyp=infant' ;
          this.CommonService.getReportData('geofencevio',this.reportData['param']).subscribe(res => {
            this.reportData['loading'] = false;
            const label: any = [];
            const data: any = [];
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
                this.reportData['enableexcel'] = true;
                this.reportData['enablepdf'] = true;             
                for (let i = 0; i < this.reportData.length; i++) {
                  this.reportData[i]['Alert Date'] = this.datepipe.transform(this.reportData[i]['Alert Date'], 'M/d/yy, h:mm a');
                }
                this.reportData['geoTable'] = res.results.data;
                this.reportData['TableColumns'] = [];
                if(this.reportData['geoTable'].length > 0){
                  this.reportData['TableColumns'] = Object.keys(this.reportData['geoTable'][0]);
                  this.reportData['showTable'] = true;
                }
                for (let key = 0; key < res.results.chart.length; key++) {
                  label.push(res.results.chart[key].Floor);
                  data.push(res.results.chart[key].counts);
                }
                this.ChartService.drawChart({'id':id,'canvasId':'geofenceViolation','type':'pie','data':data,'label':label,'title':'Geofence Violation','showTitle':true});
    
            } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
            }
          });
        }
      } else if(id == 'vitals-infant'){
        this.fromDate = this.datepipe.transform(this.fromDate1, 'yyyy-MM-dd');
        this.toDate = this.datepipe.transform(this.toDate1, 'yyyy-MM-dd');
        let re = /:/gi;
        let fromTime = this.datepipe.transform(this.fromDate1, 'HH:mm').replace(re,"T");
        let toTime = this.datepipe.transform(this.toDate1, 'HH:mm').replace(re,"T");
        this.reportData.showTable = false;
        this.reportData['enablepdf'] = false;
        this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&uid=' + this.patientUhid.value +'&vltyp=temperature&st='+ fromTime +'&et='+ toTime+'&unt='+this.unit;
        if(this.patientUhid.value == null || this.patientUhid.value == ''){
          this.reportData['nullIdentifier'] = true;
          this.reportData.loading = false;
        }
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if (res.results.statusCode == 200 && res.results.data != null && res.results.data.chart.evt_time.length > 0) {
            this.reportData.loading = false;
            this.reportData.noRecords = false;
            this.reportData['showExcel'] = false;
            this.reportData = res.results.data;
            this.reportData['patientAge'] = this.reportData.pat_info.Age
            this.reportData['patientName'] = this.reportData.pat_info.Name
            this.reportData['patientGender'] = this.reportData.pat_info.gender
            this.reportData['chartData'] = this.reportData.chart;
            this.reportData['tempRef'] = [];
            this.reportData['enablepdf'] = true;

            for(let i =0 ; i < this.reportData['chartData']['event_dt'].length; i++){
              // if(this.reportData['ref_range'][0]['unit']!='celsius'){
              //   console.log("this.reportData['ref_range'][0]:",this.reportData['ref_range'][0]);
              // }
              this.reportData['tempRef'].push(this.reportData['ref_range'][0]);        
            }
            this.reportData['statsShow'] = true;
            this.getVitalsParam('temperature',this.reportData['chartData']);
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData['enablepdf'] = false
          }
          });
      } else if(id == 'infant-alert'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate ;
          this.reportData['loading'] = false;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            if (res.results.statusCode == 200 && res.results.data != null) {
              this.reportData['loading'] = false;
              this.reportData['enableexcel'] = true;
              this.reportData['alertTable'] = res.results.data;
              this.reportData['card'] = res.results.card;
              this.reportData['TableColumns'] = [];
              if(this.reportData['alertTable'].length > 0){
                this.reportData['TableColumns'] = Object.keys(this.reportData['alertTable'][0]);
                this.reportData['showTable'] = true;
              }
              this.reportData['excelData']=[];
              this.reportData['excelData'][0]= this.reportData['alertTable'];
              this.reportData['excelData'][1]=[];
              for(let i=0;i<this.reportData['alertTable'].length;i++){    
                for(let j=0;j<this.reportData['alertTable'][i]['children'].length;j++){
                  this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]));
                }
              }
              this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':3,'gutterSize':'0px'};
              this.reportData['tileInfo'] = [
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Infant Separation','content':this.reportData['card'][0]['counts']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Tampered','content':this.reportData['card'][1]['counts']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Wrong Mother & Child','content':this.reportData['card'][2]['counts']}];
              this.reportData['showCard'] = true;
            } else {
              this.reportData['noRecords'] = true;
              this.reportData['loading'] = false;
            }
          });
        }
      }

        this.selected={'selectedId': id , 'fromDate': this.fromDate, 'toDate': this.toDate, 'Uhid': this.patientUhid.value}; 
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
    tempTypeChange(data){
      this.unit = data;
      this.getinPatientReports('vitals-infant');
    }
    getPatientsCheck(key) {
      this.patientSub.next(key);
    }  
    getPatients(key){
      if (key.target.value !== "") {
        let val = key.target.value;
        if (val.length >= 2) {
          this.CommonService.searchPatients(key.target.value,true).subscribe((res) => {
            this.patientList = res.results.filter(res => res.uhid != null);
            this.setPatientName(val);
          });
        } else {
          this.patientList = [];
        }
      } else {
        this.patientList = [];
      }
    }
    setPatientName(id){
      if(id.length>4){
        this.patientUhid.setValue(id);
      }
    }
    getVitalsParam(param, data){
      if (this.reportData['pulseLine'] != undefined || this.reportData['pulseLine'] != null) {
        this.reportData['pulseLine'].destroy();
      }
      this.reportData['showLine'] = false;
      this.isShowLabel = false;
      if(data != undefined && data.temperature.length > 0){
        this.reportData['colors'] = ['#00FF5A'];
        this.reportData['chartType'] = 'line';
        this.vitalParam = param;
        if(this.vitalParam === 'temperature'){
          this.selectedVital.name = 'Temperature';
          this.selectedVital.low = this.reportData['tempRef'][0]['min_val'];
          this.selectedVital.high = this.reportData['tempRef'][0]['max_val'];
          let lineData = [{
            data: this.reportData['chartData']['temperature'],
            label: 'Temperature',
            backgroundColor: this.reportData['colors'][0],
            borderColor : this.reportData['colors'][0],
            fill: false
          },
          {
            data : this.reportData['tempRef'].map(value => value['min_val']),
            borderDash: [10,5],
            label: 'Minimum',
            backgroundColor: '#28425560',
            borderColor : '#28425560',
            fill: false,
            pointRadius: 0
          },
          {
            data : this.reportData['tempRef'].map(value => value['max_val']),
            borderDash: [10,5],
            label: 'Maximum',
            backgroundColor: '#28425560',
            borderColor : '#28425560',
            fill: false,
            pointRadius: 0
          }];
          this.lineOptions = {
            elements : {
              point : {
                radius : 3,
                pointStyle : 'triangle'
              },
              line: {
                  tension: 0.000001
              }
            },
            legend: {
                display: false,
                position : 'top',
                labels:{
                  usePointStyle:true
                }
            },
            scales : {
              xAxes: [{
                ticks : {
                  beginAtZero : true,
                  maxTicksLimit : 10,
                  maxRotation : 0
                },
                scaleLabel : {
                  display : true,
                  labelString : 'Time',
                  
                },
              }],
              yAxes: [{
                display : true,
                type: 'linear',
                ticks :{
                  beginAtZero : true,
                  maxTicksLimit : 10,
                  suggestedMax: Math.max.apply(Math, data['SPO2']) + 21
                },
              }, 
            
            ]
            },
            responsive : true,
            maintainAspectRatio: false,
            plugins: {
              datalabels : {
                display : false
              },
              filler: {
                   propagate: false
              },
            },
            title: {
                display: false,
                position : 'top',
                text: 'VITALS PARAMETERS',
                fontSize : 14
            },
            tooltips : {
              mode : 'x-axis',
            },
            hover : {
              mode : 'x-axis',
              animationDuration : 0
            }
        }
          let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
          this.reportData['datasets'] = lineData;
          this.reportData['labels'] = lineLabels;
          this.reportData['showLine'] = true;
          this.reportData['options'] = this.lineOptions;
          this.reportData['options']['scales']['yAxes'][0]['ticks']={
              // max: Math.round(this.reportData['tempRef'][0]['max_val']) + 2,
              // min: Math.round(this.reportData['tempRef'][0]['min_val']) - 2,
              stepSize: ((Math.round(this.reportData['tempRef'][0]['max_val']) + 2) - (Math.round(this.reportData['tempRef'][0]['min_val']) - 2)) / 10
            }
          this.isShowLabel = true;
        }
      }
    }
    downloadExcel() {
      let excelData : any;
      let name = '';
      let transpose = false;
      if (this.reportData.length || this.reportData != null) {
        name = name+this.selected['selectedId'];
      if (this.selected['selectedId'] ==  'newborn-summary') {
        name = name + this.selected['selectedId'];
        let sheetnames =['Infant Alert','Baby Details']
        this.reportData['fullExcelDetails'] = [];
        this.reportData['fullExcelDetails'].push(this.reportData['excelData']);
        this.reportData['fullExcelDetails'].push(sheetnames);
        //this.reportData = this.reportData.fullExcelDetails;
        excelData = this.reportData['fullExcelDetails'];
  
      } 
      else if(this.selected['selectedId'] ==  'mov-rep'){
        name = 'Infant Movement Report';
        excelData =  this.reportData['movTable'];
        for(let i=0;i<excelData.length;i++){
          delete excelData[i]['children'];
          delete excelData[i]['EmployeeId'];
        }
      } else if(this.selected['selectedId'] == 'geofence-rep'){
        name = 'Geofence Violation';
        excelData = this.reportData['geoTable'];
      } else if(this.selected['selectedId'] == 'infant-alert'){
        name = 'Infant Alerts';
        excelData=[];
        excelData[0] =  this.reportData['excelData'];
        for(let i=0;i<excelData[0][0].length;i++){
          delete excelData[0][0][i]['children'];
        }
        for(let i=0;i<excelData[0][1].length;i++){
          delete excelData[0][1][i]['children'];
        }
        excelData[1] = ['Infant Alert Summary','Infant Alert Details'];
        this.getinPatientReports('infant-alert');
      }
      else {
        excelData =  this.reportData['Table'];      
      }
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } else {
      excelData = [];
    
    }
  }
    downloadPDF() {
      let pdfData : any;
      let addInfo : any;
      if (this.reportData.length || this.reportData != null) {
        let chartImage = [];
        let name: string;
        pdfData=this.reportData;
         if (this.selected['selectedId'] == 'newborn-summary') {
          name = 'Newborn - Mother Summary';
          // chartImage = [document.getElementById('patientCountByDoctor'), document.getElementById('ageWiseCount')];
          chartImage = [document.getElementById('patientCountByDoctor')];
        }else if( this.selected['selectedId'] == 'geofence-rep'){
          name = 'Geofence Violation'
          chartImage=[document.getElementById('geofenceViolation')];
        }else if( this.selected['selectedId'] == 'vitals-infant'){
          name = 'Vitals Chart Summary'
          this.reportData['TableColumns'] = [];
          chartImage=[document.getElementById('pulseChart')];
          let unt = 'Celcius';
          if(this.unit == 'F'){
            unt = 'Farenheit';
          }
          addInfo = {"toDate" : this.selected['toDate'], "patName" : this.reportData['patientName'][0], "uhid": this.selected['Uhid'], "unit": unt, "refType": this.selectedVital.name, "low": this.selectedVital.low, "high": this.selectedVital.high};
        } else {
          name = this.selected['selectedId'];
        }
        this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], this.selected['selectedId'], chartImage, addInfo);
    } else {
        pdfData = [];
    }
}
  fixClick() {
    console.log('')
  }
}
