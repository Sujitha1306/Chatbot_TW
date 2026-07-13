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
import { Component, OnInit , OnDestroy} from '@angular/core';
import { EnvironmentReportModel, EnvironmentReportModelCols,
  EnvironmentReportModelRows, EnvironmentReportModelId} from './environment-report.model';
import { ExcelService, CommonService, PdfService, ChartService, HospitalService, ConfigurationService, ReportService} from '../../../shared';
import { FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-environment-report',
  templateUrl: './environment-report.component.html',
  styleUrls: ['./environment-report.component.scss']
})
export class EnvironmentReportComponent implements OnInit, OnDestroy {
  public reportForm: FormGroup;
  public HCselected = 'env-moni-rep';
  public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(new Date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public locationId: any = new FormControl(null);
  public decibelStart: any = new FormControl(40);
  public decibelEnd: any = new FormControl(75);
  public locationList : any = [];
  public locationListDisplay: any=[];
  public reportList : any;
  public reportData : any = [];
  public regionValue: string;
  public facilityList : any;
  public chartImage: any;
  public selected : any;
  public selectedReport: any = new FormControl();
  public today= new Date();
  public  gridCols: any;
  public  gridCols1: any;
  public  gridCols2: any;
  public frequency: any = new FormControl(null);
  public frequencyList = [{code:'5min',value:'5'},{code:'15min',value:'15'},{code:'30min',value:'30'},{code:'45min',value:'45'},{code:'60min',value:'60'}];
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public WidgetList: Array<any> = [];
  public environmentReportModel: EnvironmentReportModel;
  public environmentReportModelCols: EnvironmentReportModelCols;
  public environmentReportModelRows: EnvironmentReportModelRows;
  public environmentReportModelId: EnvironmentReportModelId;
  ER_CSBT_pieChartOptions: any; ER_CSBT_pieChartLabels: string[]; ER_CSBT_pieChartType: string; ER_CSBT_pieChartColors: Array<any>;
  ER_CSBT_pieChartData: any[]; ER_CSBT_pieLegend: boolean; ER_CSBT_pieHeader: string;
  ER_CSBH_pieChartOptions: any; ER_CSBH_pieChartLabels: string[]; ER_CSBH_pieChartType: string; ER_CSBH_pieChartColors: Array<any>;
  ER_CSBH_pieChartData: any[]; ER_CSBH_pieLegend: boolean; ER_CSBH_pieHeader: string;
  ER_CSBP_pieChartOptions: any; ER_CSBP_pieChartLabels: string[]; ER_CSBP_pieChartType: string; ER_CSBP_pieChartColors: Array<any>;
  ER_CSBP_pieChartData: any[]; ER_CSBP_pieLegend: boolean; ER_CSBP_pieHeader: string;

  AR_AAS_barChartOptions: any; AR_AAS_barChartLabels: string[]; AR_AAS_barChartType: string; AR_AAS_barChartColors: Array<any>;
  AR_AAS_barChartData: any[] ; AR_AAS_barLegend: boolean; AR_AAS_barHeader: string;
  AR_AACD_barChartOptions: any; AR_AACD_barChartLabels: string[]; AR_AACD_barChartType: string; AR_AACD_barChartColors: Array<any>;
  AR_AACD_barChartData: any[] ; AR_AACD_barLegend: boolean; AR_AACD_barHeader: string;
  AR_AAAMCD_barChartOptions: any; AR_AAAMCD_barChartLabels: string[]; AR_AAAMCD_barChartType: string; AR_AAAMCD_barChartColors: Array<any>;
  AR_AAAMCD_barChartData: any[] ; AR_AAAMCD_barLegend: boolean; AR_AAAMCD_barHeader: string;
  AR_AAU_barChartOptions: any; AR_AAU_barChartLabels: string[]; AR_AAU_barChartType: string; AR_AAU_barChartColors: Array<any>;
  AR_AAU_barChartData: any[] ; AR_AAU_barLegend: boolean; AR_AAU_barHeader: string;
  AR_AABS_barChartOptions: any; AR_AABS_barChartLabels: string[]; AR_AABS_barChartType: string; AR_AABS_barChartColors: Array<any>;
  AR_AABS_barChartData: any[] ; AR_AABS_barLegend: boolean; AR_AABS_barHeader: string;


  ER_ART_barChartOptions: any; ER_ART_barChartLabels: string[]; ER_ART_barChartType: string; ER_ART_barChartColors: Array<any>;
  ER_ART_barChartData: any[]; ER_ART_barLegend: boolean; ER_ART_barHeader: string; ER_ART_barNoData = false;
  ER_ARP_barChartOptions: any; ER_ARP_barChartLabels: string[]; ER_ARP_barChartType: string; ER_ARP_barChartColors: Array<any>;
  ER_ARP_barChartData: any[]; ER_ARP_barLegend: boolean; ER_ARP_barHeader: string; ER_ARP_barNoData = false;
  ER_ARH_barChartOptions: any; ER_ARH_barChartLabels: string[]; ER_ARH_barChartType: string; ER_ARH_barChartColors: Array<any>;
  ER_ARH_barChartData: any[]; ER_ARH_barLegend: boolean; ER_ARH_barHeader: string; ER_ARH_barNoData = false;
  ER_ARA_barChartOptions: any; ER_ARA_barChartLabels: string[]; ER_ARA_barChartType: string; ER_ARA_barChartColors: Array<any>;
  ER_ARA_barChartData: any[]; ER_ARA_barLegend: boolean; ER_ARA_barHeader: string; ER_ARA_barNoData = false;
  public reportType = [{ id: 1, name: 'Patient'},
  { id: 2, name: 'IP Ward'},
  { id: 3, name: 'OP Clinic'},
  { id: 4, name: 'Speciality'},
  { id: 5, name: 'Category'}];
  public envReportType: Array<any> = [{name: 'All', value:'all'},{name: 'Temperature', value:'temp'},
  {name: 'Humidity', value: 'humid'},
  // {name:'Pressure',value:'press'}
  ];
  public selectedEnvReport : any = new FormControl();
  public locationlist: any[];
  public selectedLocation : any = new FormControl(null);
  public co2_status = '';
  public co2_val = 0;
  public groupType = 'Live';
  public readers: any = [];
  public interval: any;
  public co2_interval: any;
  constructor(public datepipe: DatePipe,private readonly commonService: CommonService, public fb: FormBuilder, public configurationService: ConfigurationService, public reportService: ReportService,
    public excelService: ExcelService, public pdfService: PdfService, public ChartService : ChartService, public hospitalService : HospitalService) {
    this.environmentReportModel = new EnvironmentReportModel();
    this.environmentReportModelCols = new EnvironmentReportModelCols();
    this.environmentReportModelRows = new EnvironmentReportModelRows();
    this.environmentReportModelId = new EnvironmentReportModelId();
    const list = Object.keys(this.environmentReportModel);
      for (let i = 0; list.length >= i; i++) {
        this.WidgetList.push({ id: list[i], cols: this.environmentReportModelCols[list[i]], rows: this.environmentReportModelCols[list[i]],
          class: this.environmentReportModelId[list[i]]});
      }
    this.getReportList();
    this.getFacilityList();
   }

   ngOnInit() {
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
    this.gridCols = (window.innerWidth <= 767) ? 1 : 4;
    this.gridCols1 = (window.innerWidth <= 767) ? 1 : 3;
    this.gridCols2 = (window.innerWidth <= 767) ? 1 : 5;
    if (window.innerWidth <= 767) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        if (this.environmentReportModelCols[this.WidgetList[i].id] > 1) {
          this.environmentReportModelCols[this.WidgetList[i].id] = 1;
        }
        if (this.environmentReportModelRows[this.WidgetList[i].id] === 3) {
          this.environmentReportModelRows[this.WidgetList[i].id] = 2;
        }
        this.environmentReportModelRows['SR_OSC'] = 10;
      }
    }
    this.selectedEnvReport.setValue('all');
    this.frequency.setValue('5');
    // this.getAllReaders();
    this.getLocations(this.HCselected);
    this.getTemperature(this.HCselected);
    this.buildForm();
    // this.getReportCO2('110000073');
    // this.getAllTemperature();
  }
  getReportList() {
    this.reportList = []
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    let submenusList = menuItemsList[0]['subMenus'].filter(res=> res.code== "MN_REEN");
    let tempId = submenusList[0]['id'];
    let replist = permissions['dropdown'].filter(res=> res.parentId == tempId);
    this.reportList = replist;
     const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
      if (firstSeqReport) {
        this.HCselected = firstSeqReport.code;
      }
  }
  ngOnDestroy() {
    clearInterval(this.interval);
    clearInterval(this.co2_interval);
  }
  getLocations(selectedMenu) {
    let readerType = 'RT-POMS';
    if(selectedMenu == 'env-moni-rep'){
      readerType = 'RT-TPR';
    }
    this.commonService.getLocationByReaderType(readerType).subscribe(res => {
      if(res.statusCode == 1) {
        this.locationList = res.results
        this.locationListDisplay = res.results;
        // console.log(res.results)
      }else{
        this.locationList = [];
      }
    });
  }
  getAllReaders() {
    this.configurationService.getAllReaders().subscribe(res => {
      // console.log(res);
      this.readers = res.results;
      this.buildForm();
      if (this.readers.length > 0) {
        this.getReportstart('110000083');
      }
    });
  }
  public buildForm() {
     this.reportForm = this.fb.group({
        readerId: [this.readers.length > 0 ? '110000083' : '', Validators.required],
        fromDate: [this.fromDate ? this.fromDate : ''],
        toDate: [this.toDate ? this.toDate : '']
       });
   }
  onResize(event) {
    this.gridCols = (event.target.innerWidth <= 767) ? 1 : 4;
    this.gridCols1 = (event.target.innerWidth <= 767) ? 1 : 3;
    this.gridCols2 = (event.target.innerWidth <= 767) ? 1 : 5;
    if (event.target.innerWidth <= 767) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        if (this.environmentReportModelCols[this.WidgetList[i].id] > 1) {
          this.environmentReportModelCols[this.WidgetList[i].id] = 1;
        }
        if (this.environmentReportModelRows[this.WidgetList[i].id] === 5) {
          this.environmentReportModelRows[this.WidgetList[i].id] = 10;
        }
      }
    }
    if (event.target.innerWidth >= 768) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        this.environmentReportModelCols[this.WidgetList[i].id] = this.WidgetList[i].cols;
        this.environmentReportModelRows[this.WidgetList[i].id] = this.WidgetList[i].rows;
        this.environmentReportModelId[this.WidgetList[i].id] = this.WidgetList[i].class;
      }
    }
  }

  getFacilityList(){
    this.regionValue = localStorage.getItem('regionId')
    this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
      this.facilityList = fac.results;
  });
  }
  getReportstart(id) {
    clearInterval(this.interval);
    clearInterval(this.co2_interval);
    console.log(this.reportForm.controls['readerId'].value);
    this.getReaderSensorData(this.reportForm.controls['readerId'].value);
    this.interval = setInterval(val => this.getReaderSensorDataUpdate(this.reportForm.controls['readerId'].value), 15000);
    this.getReportCO2(this.reportForm.controls['readerId'].value);
    if (this.groupType === 'Live') {
      this.co2_interval = setInterval(val => this.getReaderCO2SensorDataUpdate(this.reportForm.controls['readerId'].value), 15000);
    }
  }
  getReport() {
    clearInterval(this.interval);
    clearInterval(this.co2_interval);
    // console.log(this.reportForm.controls['readerId'].value);
    this.getReaderSensorData(this.reportForm.controls['readerId'].value);
    this.getReportCO2(this.reportForm.controls['readerId'].value);
    this.interval = setInterval(val => this.getReaderSensorDataUpdate(this.reportForm.controls['readerId'].value), 15000);
    if (this.groupType === 'Live') {
      this.co2_interval = setInterval(val => this.getReaderCO2SensorDataUpdate(this.reportForm.controls['readerId'].value), 15000);
    }
  }
  getTemperature(id){
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData['prevselected'] = this.HCselected;
    this.reportData['nullLocation'] = false;
    this.reportData['showTable'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    if(id == 'sensor-utilz-byloc'){
      this.getLocUti()
    } else if(id == 'env-moni-rep'){
      this.getEnvMoniRep(this.selectedEnvReport.value)
    }else{
	this.getAllReaders();
    }
    this.selected = { 'selectedId' : id,'fromDate': this.fromDate ,'toDate' : this.toDate,'frequency':this.frequency.value, 'locId':this.locationId.value,'decibelStart':this.decibelStart.value,'decibelEnd':this.decibelEnd.value,'envRep':this.selectedEnvReport.value,'freq':this.frequency.value};
  }
  getLocUti(){
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData['showChart'] = false;
    this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&val=' + this.decibelStart.value + ',' + this.decibelEnd.value;
    if(this.locationId?.value?.length) {
      let locIds = this.locationId.value.toString()
      this.reportData['param'] = this.reportData['param'] + '&lid=' + locIds
    }
    this.commonService.getReportData(this.HCselected,this.reportData['param']).subscribe(res => {
    if (res.results.statusCode == 200) {
      this.reportData['loading'] = false;
      this.reportData['noRecords'] = false;
      this.reportData['enableexcel'] = false;
      this.reportData['chartData'] = res.results.data.Chart.data;
      this.reportData['chartLabel'] = res.results.data.Chart.label;
      this.reportData['Table'] = res.results.data['Table Data'];
      this.reportData['TableColumns'] = [];
      if(this.reportData['Table'].length > 0){
        this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
        this.reportData['showTable'] = true;
      }
      this.ChartService.drawChart({'id':this.HCselected,'canvasId':'assetTemp','type':'line','data':this.reportData['chartData'],'label':this.reportData['chartLabel'],'title':'Temperature Chart','barLabel':['Decibels']});
      this.reportData['showChart'] = true;
      this.reportData['enablepdf'] = true;
      this.reportData['enableexcel'] = true;
    } else {
      this.reportData['enablepdf'] = false;
      this.reportData['enableexcel'] = false;
      this.reportData['showTable'] = false;
      this.reportData['noRecords'] = true;
      this.reportData['loading'] = false;
    }
    });
  }
  isOptionDisabled(optionId: number): boolean {
    return this.locationId.value && this.locationId.value.length >= 5 && !this.locationId.value.includes(optionId);
  }
  
  onEnvRepChange(selectedData){
    if(selectedData == 'all'){
      this.locationId.value = null;
    } else if(this.selected['envRep'] == 'all'){
      this.locationId.value = null;
    }
  }
  getEnvMoniRep(id){
    this.reportData['nullLocation'] = false;
    this.reportData['prevselected'] = this.HCselected;
    if(id == 'all'){
      this.reportData['param'] = '/fdt=' + this.toDate + '&freq=' + this.frequency.value;
    }else{
      this.reportData['param'] = '/fdt=' + this.toDate + '&type=' + id + '&freq=' + this.frequency.value;
    }
    if(this.locationId?.value) {
      let locIds = this.locationId.value.toString();
      this.reportData['param'] = this.reportData['param'] + '&lid=' + locIds
    }
    if(this.locationId.value == null || this.locationId.value == ''){
      this.reportData['nullLocation'] = true;
    }else{
      this.reportData['nullLocation'] = false;
    }
    this.commonService.getReportData('env-monitor',this.reportData['param']).subscribe((res) => {
      // console.log(res.results);
      if (res.results.statusCode == 200) {
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = false;
        this.reportData['enablepdf'] = true;
        this.reportData['enableexcel'] = true;
        if(id != 'all'){
        this.reportData['chartData'] = res.results.data.Chart.data;
        this.reportData['chartLabel'] = res.results.data.Chart.label;
        // this.reportData['chartLabel'] = this.reportData['chartLabel'].map(value => this.datepipe.transform(value, 'HH:mm:ss'));
        this.reportData['range'] = res.results.data['Reference Range']['Boundry'];
        this.reportData['minimum'] = [];
        this.reportData['maximum'] = [];
        for(let i = 0 ; i < this.reportData['chartData'].length ; i++)
        {
          this.reportData['minimum'][i] = this.reportData['range'][0];
          this.reportData['maximum'][i] = this.reportData['range'][1];
        }
        if(id == 'temp'){
            this.reportData['Table'] = res.results.data['Temperature Data'];
            // for (let i = 0; i < this.reportData['Table'].length; i++) {
            //     this.reportData['Table'][i]['Temp.DateTime'] = this.datepipe.transform(this.reportData['Table'][i]['Temp.DateTime'], 'dd/MM/yyyy HH : mm : ss');
            // }
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              // this.reportData['TableColumns'] = ['Location','Temp.DateTime','Temperature','IsAbnormal?'];
              this.reportData['showTable'] = true;
            }
            this.ChartService.drawChart({'id':'env-temp','canvasId':'temp-chart','type':'line','data':this.reportData['chartData'],'minimum':this.reportData['minimum'],'maximum':this.reportData['maximum'],'label':this.reportData['chartLabel'], 'dataLabel': 'Temperature'});
        } else if(id == 'press'){
          this.reportData['Table'] = res.results.data['Pressure Data'];
          for (let i = 0; i < this.reportData['Table'].length; i++) {
              this.reportData['Table'][i]['Pressure.DateTime'] = this.datepipe.transform(this.reportData['Table'][i]['Pressure.DateTime'], 'dd/MM/yyyy HH : mm : ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            // this.reportData['TableColumns'] = ['Location','Pressure.DateTime','Pressure','IsAbnormal?'];
            this.reportData['showTable'] = true;
          }
          this.ChartService.drawChart({'id':'reportData','canvasId':'press-chart','type':'line','data':this.reportData['chartData'],'minimum':this.reportData['minimum'],'maximum':this.reportData['maximum'],'label':this.reportData['chartLabel'], 'dataLabel': 'Pressure'});
        } else if(id == 'humid'){
          this.reportData['Table'] = res.results.data['Humidity Data'];
          // for (let i = 0; i < this.reportData['Table'].length; i++) {
          //     this.reportData['Table'][i]['Humidity.DateTime'] = this.datepipe.transform(this.reportData['Table'][i]['Humidity.DateTime'], 'dd/MM/yyyy HH : mm : ss');
          // }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            // this.reportData['TableColumns'] = ['Location','Humidity.DateTime','Humidity','IsAbnormal?'];
            this.reportData['showTable'] = true;
          }
          this.ChartService.drawChart({'id':'env-humid','canvasId':'humid-chart','type':'line','data':this.reportData['chartData'],'minimum':this.reportData['minimum'],'maximum':this.reportData['maximum'],'label':this.reportData['chartLabel'], 'dataLabel': 'Humidity'});
        }
      }else if(id == 'all'){
        // this.reportData['chartData'] = {Humidity: res.results.data.Chart.Humidity, Pressure: res.results.data.Chart.Pressure, Temperature: res.results.data.Chart.Temperature }
        this.reportData['chartData'] = {Humidity: res.results.data.Chart.Humidity, Temperature: res.results.data.Chart.Temperature }
        this.reportData['chartLabel'] = res.results.data.Chart.label;
        // this.reportData['chartLabel'] = this.reportData['chartLabel'].map(value => this.datepipe.transform(value, 'HH:mm:ss'));

        this.reportData['Table'] = res.results.data['Table Data'];
        // for (let i = 0; i < this.reportData['Table'].length; i++) {
        //     this.reportData['Table'][i]['DateTime'] = this.datepipe.transform(this.reportData['Table'][i]['DateTime'], 'dd/MM/yyyy HH : mm : ss');
        //     delete this.reportData['Table'][i]['Pressure']
        // }
        this.reportData['TableColumns'] = [];
        if(this.reportData['Table'].length > 0){
          // this.reportData['TableColumns'] = ['Location','DateTime','Humidity','Pressure','Temperature'];
          this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          this.reportData['showTable'] = true;
        }
        this.ChartService.drawChart({'id':'env-all-report','canvasId':'all-report-chart','type':'line','data':this.reportData['chartData'],'label':this.reportData['chartLabel']});
      }
      } else {
        this.reportData['noRecords'] = true;
        this.reportData['loading'] = false;
      }
    });
  }
  getLocationlist(id) {
    let searchList = '';
    searchList += id.target.value;
    if (searchList.length >= 2) {
      this.configurationService.getLocationData(id.target.value).subscribe(res => {
        // console.log(res)
        if(res.results.length == 0){
        }
        this.locationlist = res.results;
      });
    } else {
      this.selectedLocation.setValue(null)
      this.locationlist = [];
    }
  }
  setLocationID(id){
    this.selectedLocation.setValue(id)
    this.locationlist = [];
  }
  getGroupBy(type) {
    clearInterval(this.interval);
    clearInterval(this.co2_interval);
    this.groupType = type;
    this.ER_ARA_barNoData = false;
    this.getReportCO2(this.reportForm.controls['readerId'].value);
    if (this.groupType === 'Live') {
      this.co2_interval = setInterval(val => this.getReaderCO2SensorDataUpdate(this.reportForm.controls['readerId'].value), 15000);
    }
  }
  getReportCO2(id) {
    // console.log(id, this.groupType);
    this.reportService.getReaderCO2Sensordata(id, this.groupType).subscribe(res => {

    if (res.results.statusCode === 200) {
      // console.log(res.results.data);
      // console.log(this.groupType);
      // console.log(res.results.data.label);
      // console.log(res.results.data.CO2);
      // console.log(res.results.data.latest);
      this.co2_val = res.results.data.latest;
      if (this.co2_val <= 20) {
        this.co2_status = 'Good';
      }
      if (this.co2_val > 20 && this.co2_val <= 50) {
        this.co2_status = 'Moderate';
      }
      if (this.co2_val > 50 && this.co2_val <= 100) {
        this.co2_status = 'Unhealthy';
      }
      if (this.co2_val > 100) {
        this.co2_status = 'Hazardous';
      }
      this.ER_ARA_barNoData = true;
      this.ER_ARA_barHeader = 'Air Quality';
      this.ER_ARA_barLegend = false;
      this.ER_ARA_barChartColors = [{ backgroundColor: '#A3A0FB30',
      borderColor: '#A3A0FB',
      pointBackgroundColor: '#A3A0FB',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#A3A0FB60'}];
      this.ER_ARA_barChartLabels = res.results.data.label.reverse();
      this.ER_ARA_barChartData =  [{ label: 'Air Quality', data: res.results.data.CO2.reverse()}];
      // this.ER_ARA_barChartLabels = ['1', '2', '3', '4'];
      // this.ER_ARA_barChartData =  [{ label: 'Air Quality', data: ['10', '20', '30', '40']}];
      this.ER_ARA_barChartType = 'line';
      this.ER_ARA_barChartOptions =  {
            scaleShowVerticalLines: false,
            responsive: true, maintainAspectRatio : false,
            title: {
              // text: 'Temperature',
              display: false
            },
            legend: {position: 'bottom'},
            scales: {
              xAxes: [{
                barPercentage: 0.5,
                display: true,
                gridLines: {display : true,drawOnChartArea: false,
                    color: '#eeeeee'
                }
              }],
              yAxes: [{
                ticks: { beginAtZero: true, stepValue : 7 },
                  display: true,
                  gridLines: {display : true,drawOnChartArea: false}
              }]
          }
          };
    } else {
      if (this.groupType === 'Live') {
        clearInterval(this.co2_interval);
        this.co2_interval = setInterval(val => this.getReaderCO2SensorDataUpdate(this.reportForm.controls['readerId'].value), 30000);
      } else {
        clearInterval(this.co2_interval);
      }
      this.ER_ARA_barNoData = false;
    }
  }, error => {
    clearInterval(this.co2_interval);
  });

  }
  getReaderCO2SensorDataUpdate(id) {
    this.ER_ARA_barNoData = false;
    this.reportService.getReaderCO2Sensordata(id, this.groupType).subscribe(res => {
    if (res.results.statusCode === 200) {
      // console.log(res.results.data.label.reverse());
      // console.log(res.results.data.temperature.reverse());
      // console.log(res.results.data);
      this.co2_val = res.results.data.latest;
      // console.log(res.results.data.latest);
      if (this.co2_val <= 20) {
        this.co2_status = 'Good';
      }
      if (this.co2_val > 20 && this.co2_val <= 50) {
        this.co2_status = 'Moderate';
      }
      if (this.co2_val > 50 && this.co2_val <= 100) {
        this.co2_status = 'Unhealthy';
      }
      if (this.co2_val > 100) {
        this.co2_status = 'Hazardous';
      }
      this.ER_ARA_barNoData = true;
      // this.ER_ARA_barChartLabels = ['1', '2', '3', '4'];
      // this.ER_ARA_barChartData =  [{ label: 'Air Quality', data: ['10', '20', '30', '40']}];
      this.ER_ARA_barChartLabels = res.results.data.label.reverse();
      this.ER_ARA_barChartData =  [{ label: 'Air Quality', data: res.results.data.CO2.reverse()}];
    } else {
      this.ER_ARA_barNoData = false;
    }
  });
  }
  getReaderSensorDataUpdate(id) {
    this.ER_ART_barNoData = false;
    this.ER_ARH_barNoData = false;
    this.ER_ARP_barNoData = false;
    this.reportService.getReaderSensordata(id).subscribe(res => {
      // console.log('Udate sensor data', res);
    if (res.results.statusCode === 200) {
      // console.log(res.results.data.label.reverse());
      // console.log(res.results.data.temperature.reverse());
      this.ER_ART_barNoData = true;
      this.ER_ARH_barNoData = true;
      this.ER_ARP_barNoData = true;
      this.ER_ART_barChartLabels = res.results.data.label.reverse();
      this.ER_ART_barChartData =  [{ label: 'Temperature', data: res.results.data.temperature.reverse()}];
      this.ER_ARP_barChartLabels = res.results.data.label.reverse();
      this.ER_ARP_barChartData =  [{ label: 'Pressure', data: res.results.data.pressure.reverse()}];
      this.ER_ARH_barChartLabels = res.results.data.label.reverse();
      this.ER_ARH_barChartData =  [{ label: 'Humidity', data: res.results.data.humidity.reverse()}];
    } else {
      this.ER_ART_barNoData = false;
      this.ER_ARH_barNoData = false;
      this.ER_ARP_barNoData = false;
    }
  });
    // let results = this.reportService.getReaderSensordata(id);
    // console.log(results[0]['data']);
    // let sensorData  = results[0]['data'];
  }
  getReaderSensorData(id) {
    this.reportService.getReaderSensordata(id).subscribe(res => {
      console.log(res);

    if (res.results.statusCode === 200) {
      // console.log(res.results.data.label.reverse());
      // console.log(res.results.data.temperature.reverse());
      this.ER_ART_barNoData = true;
      this.ER_ARH_barNoData = true;
      this.ER_ARP_barNoData = true;
      this.ER_ART_barHeader = 'Temperature';
    this.ER_ART_barLegend = false;
    this.ER_ART_barChartColors = [{ backgroundColor: '#A3A0FB30',
    borderColor: '#A3A0FB',
    pointBackgroundColor: '#A3A0FB',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#A3A0FB60'}];
    this.ER_ART_barChartLabels = res.results.data.label.reverse();
    this.ER_ART_barChartData =  [{ label: 'Temperature', data: res.results.data.temperature.reverse()}];
    this.ER_ART_barChartType = 'line';
    this.ER_ART_barChartOptions =  {
          scaleShowVerticalLines: false,
          responsive: true, maintainAspectRatio : false,
          title: {
            // text: 'Temperature',
            display: false
          },
          legend: {position: 'bottom'},
          scales: {
            xAxes: [{
              barPercentage: 0.5,
              display: true,
              gridLines: {display : true,drawOnChartArea: false,
                  color: '#eeeeee'
              }
            }],
            yAxes: [{
              ticks: { beginAtZero: true, stepValue : 7 },
                display: true,
                gridLines: {display : true,drawOnChartArea: false}
            }]
        }
        };
        this.ER_ARP_barHeader = 'Pressure';
        this.ER_ARP_barLegend = false;
        this.ER_ARP_barChartColors = [{ backgroundColor: '#4BD58230',
        borderColor: '#4BD582',
        pointBackgroundColor: '#4BD582',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4BD582B60'}];
        this.ER_ARP_barChartData =  [{ label: 'Pressure', data: res.results.data.pressure.reverse()}];
        this.ER_ARP_barChartType = 'line';
        this.ER_ARP_barChartLabels = res.results.data.label.reverse();
        this.ER_ARP_barChartOptions = {
              scaleShowVerticalLines: false,
              responsive: true, maintainAspectRatio : false,
              title: {
                // text: 'Pressure',
                display: false
              },
              legend: {position: 'bottom'},
              scales: {
                xAxes: [{
                  barPercentage: 0.5,
                  display: true,
                  gridLines: {display : true,drawOnChartArea: false,
                      color: '#eeeeee'
                  }
                }],
                yAxes: [{
                  ticks: { beginAtZero: true, stepValue : 7 },
                    display: true,
                    gridLines: {display : true,drawOnChartArea: false}
                }]
            }
            };
            this.ER_ARH_barHeader = 'Humidity';
            this.ER_ARH_barLegend = false;
            this.ER_ARH_barChartColors = [{ backgroundColor: '#55D8FE20',
            borderColor: '#55D8FE',
            pointBackgroundColor: '#55D8FE',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#55D8FE60'}];
            this.ER_ARH_barChartData =  [{ label: 'Humidity', data: res.results.data.humidity.reverse()}];
            this.ER_ARH_barChartType = 'line';
            this.ER_ARH_barChartLabels = res.results.data.label.reverse();
            this.ER_ARH_barChartOptions = {
                  scaleShowVerticalLines: false,
                  responsive: true, maintainAspectRatio : false,
                  title: {
                    // text: 'Humidity',
                    display: false
                  },
                  legend: {position: 'bottom'},
                  scales: {
                    xAxes: [{
                      barPercentage: 0.5,
                      display: true,
                      gridLines: {display : true,drawOnChartArea: false,
                          color: '#eeeeee'
                      }
                    }],
                    yAxes: [{
                      ticks: { beginAtZero: true, stepValue : 7 },
                        display: true,
                        gridLines: {display : true,drawOnChartArea: false}
                    }]
                }
                };
    } else {
      clearInterval(this.interval);
      this.ER_ART_barNoData = false;
      this.ER_ARH_barNoData = false;
      this.ER_ARP_barNoData = false;
    }
  });
    // let results = this.reportService.getReaderSensordata(id);
    // console.log(results[0]['data']);
    // let sensorData  = results[0]['data'];
  }
  getAllTemperature() {
    this.ER_CSBT_pieHeader = 'Beacon Status';
    this.ER_CSBT_pieChartColors = [{ backgroundColor: ['#8CEDCB', '#83B9FA']}];
    this.ER_CSBT_pieLegend = true;
    this.ER_CSBT_pieChartData = [55, 7];
    this.ER_CSBT_pieChartType = 'pie';
    this.ER_CSBT_pieChartLabels = [ 'Active', 'Inactive'];
    this.ER_CSBT_pieChartOptions = {
      responsive: true, maintainAspectRatio : false,
      legend: {position: 'bottom'}
    };
    this.ER_CSBH_pieHeader = 'Beacon Status';
    this.ER_CSBH_pieChartColors = [{ backgroundColor: ['#8CEDCB', '#83B9FA']}];
    this.ER_CSBH_pieLegend = true;
    this.ER_CSBH_pieChartData = [55, 7];
    this.ER_CSBH_pieChartType = 'pie';
    this.ER_CSBH_pieChartLabels = [ 'Active', 'Inactive'];
    this.ER_CSBH_pieChartOptions = {
      responsive: true, maintainAspectRatio : false,
      legend: {position: 'bottom'}
    };
    this.ER_CSBP_pieHeader = 'Beacon Status';
    this.ER_CSBP_pieChartColors = [{ backgroundColor: ['#8CEDCB', '#83B9FA']}];
    this.ER_CSBP_pieLegend = true;
    this.ER_CSBP_pieChartData = [55, 7];
    this.ER_CSBP_pieChartType = 'pie';
    this.ER_CSBP_pieChartLabels = [ 'Active', 'Inactive'];
    this.ER_CSBP_pieChartOptions = {
      responsive: true, maintainAspectRatio : false,
      legend: {position: 'bottom'}
    };
    this.ER_ART_barHeader = 'Temperature';
    this.ER_ART_barLegend = false;
    this.ER_ART_barChartColors = [{ backgroundColor: '#A3A0FB30',
    borderColor: '#A3A0FB',
    pointBackgroundColor: '#A3A0FB',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#A3A0FB60'}];
    this.ER_ART_barChartData =  [{ label: 'Temperature', data: [24, 22, 30, 34, 30, 29, 33]}];
    this.ER_ART_barChartType = 'line';
    this.ER_ART_barChartLabels = ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'];
    this.ER_ART_barChartOptions =  {
          scaleShowVerticalLines: false,
          responsive: true, maintainAspectRatio : false,
          title: {
            // text: 'Temperature',
            display: false
          },
          legend: {position: 'bottom'},
          scales: {
            xAxes: [{
              barPercentage: 0.5,
              display: true,
              gridLines: {display : true,drawOnChartArea: false,
                  color: '#eeeeee'
              }
            }],
            yAxes: [{
              ticks: { beginAtZero: true, stepValue : 7 },
                display: true,
                gridLines: {display : true,drawOnChartArea: false}
            }]
        }
        };
        this.ER_ARP_barHeader = 'Pressure';
        this.ER_ARP_barLegend = false;
        this.ER_ARP_barChartColors = [{ backgroundColor: '#4BD58230',
        borderColor: '#4BD582',
        pointBackgroundColor: '#4BD582',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4BD582B60'}];
        this.ER_ARP_barChartData =  [{ label: 'Pressure', data: [24, 22, 30, 34, 30, 29, 33]}];
        this.ER_ARP_barChartType = 'line';
        this.ER_ARP_barChartLabels = ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'];
        this.ER_ARP_barChartOptions = {
              scaleShowVerticalLines: false,
              responsive: true, maintainAspectRatio : false,
              title: {
                // text: 'Pressure',
                display: false
              },
              legend: {position: 'bottom'},
              scales: {
                xAxes: [{
                  barPercentage: 0.5,
                  display: true,
                  gridLines: {display : true,drawOnChartArea: false,
                      color: '#eeeeee'
                  }
                }],
                yAxes: [{
                  ticks: { beginAtZero: true, stepValue : 7 },
                    display: true,
                    gridLines: {display : true,drawOnChartArea: false}
                }]
            }
            };
            this.ER_ARH_barHeader = 'Humidity';
            this.ER_ARH_barLegend = false;
            this.ER_ARH_barChartColors = [{ backgroundColor: '#55D8FE20',
            borderColor: '#55D8FE',
            pointBackgroundColor: '#55D8FE',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#55D8FE60'}];
            this.ER_ARH_barChartData =  [{ label: 'Humidity', data: [24, 22, 30, 34, 30, 29, 33]}];
            this.ER_ARH_barChartType = 'line';
            this.ER_ARH_barChartLabels = ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'];
            this.ER_ARH_barChartOptions = {
                  scaleShowVerticalLines: false,
                  responsive: true, maintainAspectRatio : false,
                  title: {
                    // text: 'Humidity',
                    display: false
                  },
                  legend: {position: 'bottom'},
                  scales: {
                    xAxes: [{
                      barPercentage: 0.5,
                      display: true,
                      gridLines: {display : true,drawOnChartArea: false,
                          color: '#eeeeee'
                      }
                    }],
                    yAxes: [{
                      ticks: { beginAtZero: true, stepValue : 7 },
                        display: true,
                        gridLines: {display : true,drawOnChartArea: false}
                    }]
                }
                };
  }
  public chartClicked(e: any): void {
    // console.log(e);
  }
  public chartHovered(e: any): void {
    // console.log(e);
  }
  downloadPDF() {
    let pdfData : any;
    if (this.reportData.length || this.reportData != null) {
      let name: string;
      this.chartImage = [];
      pdfData = this.reportData;
      if(this.selected['selectedId'] == 'env-moni-rep'){
        name = "Environment Monitoring Report";
        if(this.selectedEnvReport.value == 'temp'){
          this.chartImage = [document.getElementById('temp-chart')];
        } else if(this.selectedEnvReport.value == 'press'){
          this.chartImage = [document.getElementById('press-chart')];
        } else if(this.selectedEnvReport.value == 'humid'){
          this.chartImage = [document.getElementById('humid-chart')];
        } else if(this.selectedEnvReport.value == 'all'){
          this.chartImage = [document.getElementById('all-report-chart')];
        }
      } else if(this.selected['selectedId'] == 'asset-utiby-byid'){
        name = "Asset Utilization By AssetId";
        this.chartImage = [document.getElementById('asset-uti-chart')]
      } else if(this.selected['selectedId'] == 'sensor-utilz-byloc'){
        name = "Sound Sensor Data";
        this.chartImage = [document.getElementById('assetTemp')]
      }
      this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['toDate'], this.selected['selectedId'], this.chartImage);
    } else {
      pdfData = [];
    }
  }
  downloadExcel() {
    let excelData : any;
    let name = '';
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
      name = name+this.selected['selectedId'];
      excelData =  this.reportData['Table'];  
      if(this.selected['selectedId'] == 'env-moni-rep'){
        name = "Environment Monitoring Report";
        this.selected['todate'] = this.toDate;
      }
      this.excelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
    }
  }
    fixClick() {
    console.log('')
  }
}
// {
  //     responsive: true, maintainAspectRatio : false,
  //     maintainAspectRatio: false,
  //     layout: {
  //        padding: 0
  //     },
  //     lineOnHover: {
  //        enabled: true,
  //        lineColor: '#bbb',
  //        lineWidth: 1
  //     },
  //     scales: {
  //        yAxes: [{
  //           display: false,
  //           scaleLabel: {
  //              display: false,
  //              labelString: 'USD'
  //           },
  //           ticks: {
  //              //min: 0,
  //              //max: 5000,
  //              stepSize: 500,
  //              display: false,
  //              mirror: true,
  //              labelOffset: 7,
  //              padding: -10,
  //              callback: function (value, index, values) {
  //                 return '$' + value;
  //              }
  //           },
  //           gridLines: {
  //              display: true,
  //              tickMarkLength: 0
  //           }
  //        }],
  //        xAxes: [{
  //           ticks: {
  //              display: false,
  //              mirror: true
  //           },
  //           gridLines: {
  //              display: false,
  //              tickMarkLength: 0
  //           }
  //        }]
  //     },
  //     elements: {
  //        point: {
  //           radius: 0
  //        },
  //        line: {
  //           tension: 0, // 0 disables bezier curves
  //        }
  //     },
  //     hover: {
  //        mode: 'nearest',
  //        intersect: true
  //     },
  //     tooltips: {
  //        mode: 'nearest',
  //        intersect: true,
  //        backgroundColor: 'rgb(95,22,21)',
  //        callbacks: {
  //           title: function (tooltipItems, data) {
  //              return (tooltipItems[0] || {})['xLabel'];
  //           },
  //           label: function (tooltipItem, data) {
  //              return '$ ' + tooltipItem.yLabel.toLocaleString();
  //           },
  //           labelColor: function (tooltipItem, chart) {
  //              let dataset = chart.config.data.datasets[tooltipItem.datasetIndex];
  //              return {
  //                 backgroundColor: dataset.backgroundColor
  //              }
  //           }
  //        }
  //     }
  //  };
