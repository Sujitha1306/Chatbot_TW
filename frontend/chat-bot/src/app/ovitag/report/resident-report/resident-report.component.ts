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

import { Component, OnInit} from '@angular/core';
import {ExcelService, PdfService, CommonService, ChartService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Chart } from 'chart.js';
import 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-resident-report',
  templateUrl: './resident-report.component.html',
  styleUrls: ['./resident-report.component.scss']
})

export class ResidentReportComponent implements OnInit {

  public reportForm: FormGroup;
  public date: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public reportList : any;
  public reportData : any = [];
  public selectedSpeciality: any = new FormControl();
  public patientUhid: any = new FormControl();
  public Uhid: any = new FormControl();
  public selectedReport : any = new FormControl();
  public regionValue: string;
  public facilityList : any;
  public HCselected = 'patient-status-rs';
  public vitalParam : any = 'all';
  public selected : any;
  public chartImage: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  today = new Date();
  
  
  constructor(public datepipe: DatePipe, public PdfService: PdfService,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService) {
      this.getReportList(); 
    }


ngOnInit() {
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
      let submenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_RERES") : null;
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
    getinPatientReports(id){
      this.selectedReport.setValue(id);
      this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
      this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
        this.reportData = {};
        this.reportData.noRecords = false;
        this.reportData.loading = false;
        this.reportData['showTable'] = false;
        this.reportData['showSecondTable'] =  false;
        this.reportData['showCard'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['enablepdf'] = false;
        this.reportData['invalidDate'] = false;
        this.reportData['nullIdentifier'] = false;
        this.reportData['tableView'] = false;
        this.reportData['initialised'] = false;
        this.reportData['prevselected'] = this.HCselected;
        this.reportData['charts'] = [];
        if(id == 'vitals-chart-rs'){
        this.reportData.showTable = false;
        this.reportData['enablepdf'] = false;
        this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&uid=' + this.patientUhid.value;
        if(this.patientUhid.value == null || this.patientUhid.value == ''){
          this.reportData['nullIdentifier'] = true;
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
            this.reportData['SPO2Ref'] = []
            this.reportData['pulseRef'] = []
            this.reportData['tempRef'] = []
            this.reportData['HRRef'] = []
            this.reportData['HRVRef'] = []
            this.reportData['respRef'] = []
            this.reportData['presSysRef'] = []
            this.reportData['presDiaRef'] = []
            this.reportData['sleepRef'] = []
            this.reportData['stepsRef'] = []
            this.reportData['enablepdf'] = true

            for(let i =0 ; i < this.reportData['chartData']['event_dt'].length; i++){
              this.reportData['SPO2Ref'].push(this.reportData['ref_range'][0])
              this.reportData['pulseRef'].push(this.reportData['ref_range'][1])
              this.reportData['tempRef'].push(this.reportData['ref_range'][2])
              this.reportData['HRRef'].push(this.reportData['ref_range'][3])
              this.reportData['HRVRef'].push(this.reportData['ref_range'][4])
              this.reportData['respRef'].push(this.reportData['ref_range'][5])
              this.reportData['presSysRef'].push(this.reportData['ref_range'][6])
              this.reportData['presDiaRef'].push(this.reportData['ref_range'][7])
              this.reportData['sleepRef'].push(this.reportData['ref_range'][8])
              this.reportData['stepsRef'].push(this.reportData['ref_range'][9])          
            }
            this.reportData['statsShow'] = true;
            console.log(this.reportData)
            this.vitalsChart(this.reportData['chartData']);
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData['enablepdf'] = false
          }
          });
      }else if (id == 'patient-status-rs') {
        this.reportData['param'] = '/fdt=' + this.toDate ;
        this.CommonService.getReportData('patient-status-rs',this.reportData['param']).subscribe(res => {
          console.log(res);
          if (res.results.statusCode == 200 && res.results.data!=null) {
            this.reportData.loading = false;
            this.reportData.noRecords = false;
            this.reportData['enableexcel'] = false;
            this.reportData['enablepdf'] = true;
            this.reportData['data'] = res.results.data;
            this.reportData['statsShow'] = true;
            this.reportData['admitted'] = this.reportData.data.adm_count.Admission;
            this.reportData['discharged'] = this.reportData.data.adm_count.Discharge;
            this.reportData['bedsOccupied'] = this.reportData.data.bed_occup['Bed Occupancy'];
            this.reportData['bedsAvailable'] = this.reportData.data.bed_occup['Available'];
            this.reportData['bedOccupancyRate'] = this.reportData.data.bed_occup_rate.data;
            this.reportData['ALOS'] = this.reportData.data.ALOS.data;
            this.reportData['patientWard'] = this.reportData.data.ward;
            this.reportData['patientSpecialty'] = this.reportData.data.specialty;
            this.ChartService.drawChart({'id':id,'canvasId':'IPdevice','type':'pie','data':this.reportData['data']['tag']['data'],'label':this.reportData['data']['tag']['label'],'title':'Devices Used','showTitle':true});
            this.ChartService.drawChart({'id':id,'canvasId':'IPlanguage','type':'pie','data':this.reportData['data']['lang']['data'],'label':this.reportData['data']['lang']['label'],'title':'Languages Prefered','showTitle':true});
            this.ChartService.drawChart({'id':id,'canvasId':'IPage','type':'pie','data':this.reportData['data']['age']['data'],'label':this.reportData['data']['age']['label'],'title':'Age group','showTitle':true});
            this.ChartService.drawChart({'id':id,'canvasId':'IPgender','type':'pie','data':this.reportData['data']['gender']['data'],'label':this.reportData['data']['gender']['label'],'title':'Gender','showTitle':true});
            this.ChartService.drawChart({'id':id,'canvasId':'IPward','type':'bar','data':this.reportData['patientWard']['data'],'label':this.reportData['patientWard']['label'],'title':'Patient Count by Ward','showTitle':true,barLabel:['Patient Count']});
            this.ChartService.drawChart({'id':id,'canvasId':'IPspeciality','type':'bar','data':this.reportData['patientSpecialty']['data'],'label':this.reportData['patientSpecialty']['label'],'title':'Patient Count by Speciality','showTitle':true,barLabel:['Patient Count']});
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enablepdf = false;
          }
        });        
      } else if(id == 'geofencevio' ){
          this.validDate=this.validate(this.fromDate,this.toDate);
          if(!this.validDate){
            this.reportData['invalidDate'] = true;
            this.reportData['loading'] = false;
            this.reportData['noRecords'] = true;
          }
          else{
            this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' +this.toDate + '&vtyp=resident' ;
            this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
              this.reportData.loading = false;
              const label: any = [];
              const data: any = [];
              this.reportData['enablepdf'] = true;
              this.reportData['enableexcel'] = true;
              if (res.results.statusCode == 200 && res.results.data.length > 0) {
                  this.reportData = res.results.data;
                  this.reportData.enableexcel = true;
                  this.reportData.enablepdf = true;             
                  for (let i = 0; i < this.reportData.length; i++) {
                    this.reportData[i]['Alert Date'] = this.datepipe.transform(this.reportData[i]['Alert Date'], 'M/d/yy, h:mm a');
                  }
                  //this.tableData(this.reportData, id);
                  this.reportData['Table'] = res.results.data;
                  this.reportData['TableColumns'] = [];
                  if(this.reportData['Table'].length > 0){
                    this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                    this.reportData['showTable'] = true;
                  }
                  for (let key = 0; key < res.results.chart.length; key++) {
                    label.push(res.results.chart[key].Floor);
                    data.push(res.results.chart[key].counts);
                  }
                  //this.geofencingViolationChart(label, data);
                  this.ChartService.drawChart({'id':id,'canvasId':'geofenceViolation','type':'pie','data':data,'label':label,'title':'Geofence Violation','showTitle':true});
      
              } else {
                this.reportData.noRecords = true;
                this.reportData.loading = false;
              }
            });
          }
      } else if(id == 'patientfall'){
          this.reportData['param'] = '/fdt=' + this.toDate +'&vtyp=resident';
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            console.log(res);
            this.reportData['enableexcel'] = true;
            this.reportData['enablepdf'] = true;
            this.reportData['loading'] = false;
            const label: any = [];
            const data: any = [];
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
                this.reportData = res.results.data;
                this.reportData['fullData'] = this.reportData;
                this.reportData['enableexcel'] = true;
                this.reportData['enablepdf'] = true;
                for (let key = 0; key < res.results.chart.length; key++) {
                  label.push(res.results.chart[key].Location);
                  data.push(res.results.chart[key].counts);
                }
                this.ChartService.drawChart({'id':id,'canvasId':'patientFall','type':'pie','data':data,'label':label,'title':'OT Not Utilized','showTitle':true});
                this.reportData['Table'] = res.results.data;
                this.reportData['TableColumns'] = [];
                if(this.reportData['Table'].length > 0){
                  this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                  this.reportData.TableColumns.pop();
                  this.reportData['showTable'] = true;
                }
              } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false; 
              this.reportData.enableexcel = false;
              this.reportData.enablepdf = false;  
            }
          });
      } else if(id == 'nurse-call-rs'){
        this.reportData['param'] = '/fdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          console.log(res)
          this.reportData.loading = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = true;
          if (res.results.statusCode == 200 && res.results.data != null) {
              this.reportData = res.results.data; 
              this.reportData.enableexcel = true;
              this.reportData.enablepdf = true;             
              this.reportData['totalNurses'] = res.results.data['Nurse Count'][0]['Total Nurses'];
              this.reportData['nursesCallTatInWard'] = res.results.data.TAT[1].TAT;
              this.reportData['nursesCallTatInIcu'] = res.results.data.TAT[0].TAT;
              this.reportData['nursesCallRatioInWard'] = res.results.data['Nurse Ratio'][1]['Nurse ratio'];
              this.reportData['nursesCallRatioInIcu'] = res.results.data['Nurse Ratio'][0]['Nurse ratio'];
              this.reportData['hourlyChartData'] = Object.values(res.results.data['Hourly'][0]);
              this.reportData['hourlyChartLabel'] = Object.keys(res.results.data['Hourly'][0]);
              this.reportData['CallChartData'] = res.results.data['Calls'];
              this.reportData['Table'] = res.results.data['Call Detail'];
              this.reportData['TableColumns'] = [];
              if(this.reportData['Table'].length > 0){
                this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                this.reportData['showTable'] = true;
              }
              this.ChartService.drawChart({'id':id,'canvasId':'hourlyCall','type':'bar','data':this.reportData['hourlyChartData'],'label':this.reportData['hourlyChartLabel'],'title':'Hourly Call','showTitle':true,'barLabel':['Count']});
              this.ChartService.drawChart({'id':id,'canvasId':'nurseCall','type':'stacked-grouped','data':[this.reportData['CallChartData'].data['Available Nurses'],this.reportData['CallChartData'].data['Requested'],this.reportData['CallChartData']['Completed']],'label':this.reportData['CallChartData'].label,'title':'Nurse Call','showTitle':true,'barLabel':['Available Nurses','Requested','Completed']});
           } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
      }
      this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.patientUhid.value};
    }
  validate(sDate: string, eDate: string){
    this.validDate = true;
    if((sDate != null && eDate !=null) && (eDate < sDate) ){
      this.validDate = false;
      this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
    }
    return this.validDate;
  }
  vitalsChart(data) {
    data['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#284255', '#FFC300', '#8e5ea2', '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    if (this.reportData['pulseLine'] != undefined || this.reportData['pulseLine'] != null) {
      this.reportData['pulseLine'].destroy();
    }
    if (data != undefined && data.pulse.length > 0) {
    this.reportData['pulseLine'] = new Chart('pulse-and-temp', {
      type: 'line',
      data: {
          labels: data['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
          datasets: [{
            data : data['pulse'],
            label: 'Pulse',
            backgroundColor: data['colors'][0],
            borderColor : data['colors'][0],
            fill: false
          },
          {
            data: data['temperature'],
            label: 'Temperature',
            backgroundColor: data['colors'][1],
            borderColor : data['colors'][1],
            fill: false
          },
          {
            data: data['SPO2'],
            label: 'SPO2',
            backgroundColor: data['colors'][3],
            borderColor : data['colors'][3],
            fill: false
          },
          {
            data: data['HR'],
            label: 'HR',
            backgroundColor: data['colors'][4],
            borderColor: data['colors'][4],
            fill: false
          },
          {
            data: data['HRV'],
            label: 'HRV',
            backgroundColor: data['colors'][5],
            borderColor: data['colors'][5],
            fill: false
          },
          {
            data: data['resp_rate'],
            label: 'Respiratory rate',
            backgroundColor: data['colors'][6],
            borderColor: data['colors'][6],
            fill: false
          },
        ]
      },
       options: {
        elements: {
          point: {
            radius: 5,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        plugins: {
          legend: {
            display: false,
            position: 'top',
            labels: {
              usePointStyle: true
            }
          },
          title: {
            display: false,
            text: 'VITALS PARAMETERS',
            position: 'top',
            font:{
              size: 14
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          },
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10,
              maxRotation: 0
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            display: false,
            type: 'linear',
            ticks: {
              maxTicksLimit: 10,
              maxRotation: Math.max(...data['SPO2']) + 21
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        animations: {
          tension: {
            duration: 0,
          }
        }
      }      
    });
    }
    this.reportData['lineShow'] = true;
  }
  getVitalsParam(param){
                
    this.reportData['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#284255', '#FFC300', '#8e5ea2', '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    this.vitalParam = param
    if(this.vitalParam == 'all'){
      console.log('all')
      this.reportData['pulseLine'].config.data = {
        //labels: this.reportData['event_time'].map(value => this.datepipe.transform(value, 'HH:mm:ss')),
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data : this.reportData['chartData']['pulse'],
          label: 'Pulse',
          // yAxisID : 'pulseY',
          backgroundColor: this.reportData['colors'][0],
          borderColor : this.reportData['colors'][0],
          // steppedLine: true,
          fill: false
        },
        {
          data: this.reportData['chartData']['temperature'],
          label: 'Temperature',
          backgroundColor: this.reportData['colors'][1],
          borderColor : this.reportData['colors'][1],
          fill: false
        },
        {
          data: this.reportData['chartData']['SPO2'],
          label: 'SPO2',
          backgroundColor: this.reportData['colors'][3],
          borderColor : this.reportData['colors'][3],
          fill: false
        },
        {
          data: this.reportData['chartData']['HR'],
          label: 'HR',
          backgroundColor: this.reportData['colors'][4],
          borderColor: this.reportData['colors'][4],
          fill: false
        },
        {
          data: this.reportData['chartData']['HRV'],
          label: 'HRV',
          backgroundColor: this.reportData['colors'][5],
          borderColor: this.reportData['colors'][5],
          fill: false
        },
        {
          data: this.reportData['chartData']['resp_rate'],
          label: 'Respiratory rate',
          backgroundColor: this.reportData['colors'][6],
          borderColor: this.reportData['colors'][6],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
            display : false,
            type: 'linear',
            ticks :{
              beginAtZero : true,
              maxTicksLimit : 10,
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'pulse'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data : this.reportData['chartData']['pulse'],
          label: 'Pulse',
          backgroundColor: this.reportData['colors'][0],
          borderColor : this.reportData['colors'][0],
          fill: false
        },
        {
          data : this.reportData['pulseRef'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][0],
          borderColor : this.reportData['colors'][0],
          fill: false
        },
        {
          data : this.reportData['pulseRef'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][0],
          borderColor : this.reportData['colors'][0],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'temperature'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data: this.reportData['chartData']['temperature'],
          label: 'Temperature',
          backgroundColor: this.reportData['colors'][1],
          borderColor : this.reportData['colors'][1],
          fill: false
        },
        {
          data : this.reportData['tempRef'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][1],
          borderColor : this.reportData['colors'][1],
          fill: false
        },
        {
          data : this.reportData['tempRef'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][1],
          borderColor : this.reportData['colors'][1],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'SPO2'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data: this.reportData['chartData']['SPO2'],
          label: 'SPO2',
          backgroundColor: this.reportData['colors'][3],
          borderColor : this.reportData['colors'][3],
          fill: false
        },
        {
          data : this.reportData['SPO2Ref'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][3],
          borderColor : this.reportData['colors'][3],
          fill: false
        },
        {
          data : this.reportData['SPO2Ref'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][3],
          borderColor : this.reportData['colors'][3],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'HR'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data: this.reportData['chartData']['HR'],
          label: 'HR',
          backgroundColor: this.reportData['colors'][4],
          borderColor: this.reportData['colors'][4],
          fill: false
        },
        {
          data :  this.reportData['HRRef'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][4],
          borderColor : this.reportData['colors'][4],
          fill: false
        },
        {
          data :  this.reportData['HRRef'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][4],
          borderColor : this.reportData['colors'][4],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'HRV'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data: this.reportData['chartData']['HRV'],
          label: 'HRV',
          backgroundColor: this.reportData['colors'][5],
          borderColor: this.reportData['colors'][5],
          fill: false
        },
        {
          data :  this.reportData['HRVRef'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][5],
          borderColor : this.reportData['colors'][5],
          fill: false
        },
        {
          data : this.reportData['HRVRef'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][5],
          borderColor : this.reportData['colors'][5],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
    if(this.vitalParam === 'resp_rate'){
      this.reportData['pulseLine'].config.data = {
        labels: this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'dd/MM/yyyy HH:mm:ss')),
        datasets: [{
          data: this.reportData['chartData']['resp_rate'],
          label: 'Respiratory rate',
          backgroundColor: this.reportData['colors'][6],
          borderColor: this.reportData['colors'][6],
          fill: false
        },
        {
          data : this.reportData['respRef'].map(value => value['min_val']),
          borderDash: [10,5],
          label: 'Minimum',
          backgroundColor: this.reportData['colors'][6],
          borderColor : this.reportData['colors'][6],
          fill: false
        },
        {
          data : this.reportData['respRef'].map(value => value['max_val']),
          borderDash: [10,5],
          label: 'Maximum',
          backgroundColor: this.reportData['colors'][6],
          borderColor : this.reportData['colors'][6],
          fill: false
        },
      ]
      }
      this.reportData['pulseLine'].config.options = {
        elements : {
          point : {
            radius : 5,
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
              suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
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
      this.reportData['pulseLine'].update()
    }
  }
downloadExcel() {
    let excelData : any;
    let name = '';
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
        name = name + this.selected['selectedId'];
        excelData =  this.reportData['Table'];
        this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } else {
        excelData = [];
    }
  }
downloadPDF() {
  let pdfData : any;
  let chartImage = [];
  let name: string;
  let id = this.selected['selectedId'];
  if (this.reportData.length || this.reportData != null) {
    pdfData=this.reportData;
    if( this.selected['selectedId'] == 'patientfall'){
      name = 'Patient Fall Summary'
      chartImage=[document.getElementById('patientFall')];
    } else if( this.selected['selectedId'] == 'patient-status-rs'){
      name = 'Resident Summary'
      this.reportData['TableColumns'] = [];
      chartImage=[document.getElementById('IPdevice'),document.getElementById('IPage'),document.getElementById('IPlanguage'),document.getElementById('IPgender'),document.getElementById('IPward'),document.getElementById('IPspeciality')];
    } else if( this.selected['selectedId'] == 'geofencevio'){
      name = 'Patient Geofence Violation'
      chartImage=[document.getElementById('geofenceViolation')];
    } else if( this.selected['selectedId'] == 'vitals-chart-rs'){
      name = 'Vitals Chart Summary'
      this.reportData['TableColumns'] = [];
      chartImage=[document.getElementById('pulse-and-temp')];
    } else if( this.selected['selectedId'] ==  'nurse-call-rs'){
      name = "Nurse Call Efficeiency Report";
      chartImage=[document.getElementById('nurseCall'),document.getElementById('hourlyCall')]
    } else {
      name = this.selected['selectedId'];
    }
    this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], id, chartImage);
  } else {
    pdfData = [];
  }

}
  fixClick() {
    console.log('')
  }
}
