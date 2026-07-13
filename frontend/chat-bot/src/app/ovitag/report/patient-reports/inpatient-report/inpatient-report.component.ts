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
import {ExcelService, PdfService, CommonService, ChartService,ConfigurationService } from '../../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import 'chartjs-plugin-datalabels';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-inpatient-report',
  templateUrl: './inpatient-report.component.html',
  styleUrls: ['./inpatient-report.component.scss']
})

export class InpatientReportComponent implements OnInit {

  public reportForm: FormGroup;
  public date: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public patientSub : Subject<any> = new Subject();
  public allLineData = []
  public allLineLabels = []
  public allLineColours = []
  public lineOptions = {};
  public selectedVital = { name: '', low: '', high: ''}
  public isShowLabel : boolean = false;
  public  MRfilter:any = [
    {completed: true, color: 'primary', name: 'Medical Record File Summary'},
    {completed: false, color: 'primary', name : 'Active Medical Records'},
    {completed: false, color: 'primary', name : 'Medical Record File Aging'}
  ]
  public selectedMRValue:any = 'Medical Record File Summary';
  public reportList : any;
  public reportData : any = [];
  public patientList: any = [];
  public userList: any[] = [];
  public selectedUser = new FormControl(null);
  public userName = new FormControl('');
  public selectedSpeciality: any = new FormControl();
  public patientUhid: any = new FormControl();
  public Uhid: any = new FormControl();
  public selectedReport : any = new FormControl();
  public regionValue: string;
  public facilityList : any;
  public HCselected = 'in_patient';
  public vitalParam : any = 'all';
  public selected : any;
  public chartImage: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  today = new Date();
  public locationlist: any[];
  public selectedLocation : any = new FormControl(null);
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  public activate_btn: any = [];
  constructor(public datepipe: DatePipe, public PdfService: PdfService,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService,public configurationService: ConfigurationService, public ChartService: ChartService) {
      this.getReportList();
      this.activate_btn = this.CommonService.getActivePermission('button');
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
      let submenusList = menuItemsList[0]['subMenus'].filter(res=> res.code== "MN_AIPTS");
      let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, 'MN_AIPTIP') : null
      let tempId =submenus['id'];
      let replist = permissions['dropdown'].filter(res=> res.parentId == tempId);
      this.reportList = replist;
       const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
    if (firstSeqReport) {
      this.HCselected = firstSeqReport.code;
      console.log(this.HCselected)
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
        this.reportData.loading = true;
        this.reportData['showTable'] = false;
        this.reportData['showLocTable'] = false;
        this.reportData['showDatwiseTable'] = false;
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
        this.patientList = [];
        this.userList = [];
         if (id == 'OT-Rep') {
          this.validDate=this.validate(this.fromDate,this.toDate);
          if(!this.validDate){
            this.reportData['invalidDate'] = true;
            this.reportData['loading'] = false;
            this.reportData['noRecords'] = true;
          }
          else{
            this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
            this.CommonService.getReportData('OT-Rep-new',this.reportData['param']).subscribe(res => {
              if (res.results.statusCode == 200 && res.results.data!=null) {
                this.reportData['loading']=false;
                this.reportData['enableexcel']=true;
                this.reportData['excelData'] = [];
                this.reportData['fullData'] = res.results.data;
                this.reportData['otDetail'] = res.results.data['OT Detail'];
                this.reportData['OtNotUtilized'] = res.results.data['OT Not Utilized'];
                this.reportData['OtUtilized'] = res.results.data['OT Utilized'];
                // for (let i = 0; i < res.results.data['OT Detail'].length; i++) {
                //   res.results.data['OT Detail'][i]['Visit start time'] = this.datepipe.transform(res.results.data['OT Detail'][i]['Visit start time'], 'dd/MM/yyyy HH:mm:ss');
                // }
                this.reportData['Table'] = res.results.data['OT Detail'];
                this.reportData['TableColumns'] = [];
                if(this.reportData['Table'].length > 0){
                  this.reportData['TableColumns'] = Object.keys(this.reportData['otDetail'][0]);
                  this.reportData['tableView'] = true;
                  this.reportData['initialised'] = true;
                }
                this.reportData['excelData']=[];
                this.reportData['excelData'][0]= this.reportData['Table'];
                this.reportData['excelData'][1]=[];
                for(let i=0;i<this.reportData['Table'].length;i++){    
                  for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
                    this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]))
                    //delete this.reportData['excelData'][0][i]['children']
                  }
                  }
                // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'OTNu','type':'bar','data':this.reportData['OtNotUtilized']['data'],'label':this.reportData['OtNotUtilized']['label'],'title':'NO SURGERY (IN DAYS)','showTitle':true,'barLabel':[]});          
                // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'OTU','type':'bar','data':this.reportData['OtUtilized']['data'],'label':this.reportData['OtUtilized']['label'],'title':'OT UTILIZED (IN MINUTES)','showTitle':true,'barLabel':[] });          
              } else {
                this.reportData.noRecords = true;
                this.reportData.loading = false;
              }
            });
          }
      }else if (id == 'asset-util-patient') {
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&lid=' + this.selectedLocation.value;
          if(this.selectedLocation.value == null || this.selectedLocation.value == ''){
            this.reportData['nullIdentifier'] = true;
          }else{
            this.reportData['nullIdentifier'] = false;
          }
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            console.log(res)
            if (res.results.statusCode == 200 && res.results.data!=null) {
              this.reportData['loading']=false;
              this.reportData['enableexcel']=true;
              this.reportData['excelData'] = [];
              this.reportData['fullData'] = res.results.data;
              this.reportData['Table'] = res.results.data;
              this.reportData['TableColumns'] = [];
              if(this.reportData['Table'].length > 0){
                this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                this.reportData['tableView'] = true;
                this.reportData['initialised'] = true;
              }
              this.reportData['excelData']=[];
              this.reportData['excelData'][0]= this.reportData['Table'];
              this.reportData['excelData'][1]=[];
              for(let i=0;i<this.reportData['Table'].length;i++){    
                for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
                  this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]))
                }
                }         
            } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
            }
          });
        }
    }else if(id == 'vitals-chart'){
        this.reportData.showTable = false;
        this.reportData['enablepdf'] = false;
        this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&uid=' + this.patientUhid.value;
        if(this.patientUhid.value == null || this.patientUhid.value == ''){
          this.reportData['nullIdentifier'] = true;
          this.reportData.loading = false;
        }
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if (res.results.statusCode == 200 && res.results.data != null && res.results.data.chart.evt_time.length > 0) {
            this.reportData.loading = false;
            this.reportData.noRecords = false;
            this.reportData = res.results.data;
            this.reportData['vitalsTable']=res.results.TableData['Data'];
            if(this.reportData['vitalsTable'].length > 0){
              this.reportData['enableexcel'] = true;
            }
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
            this.reportData['enablepdf'] = true;
            // this.reportData['enableexcel'] = true;
            // this.reportData['excelData']=[];
            // this.reportData['excelData']= this.reportData.excelData;
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
            this.vitalsChart(this.reportData['chartData']);
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData['enablepdf'] = false
          }
          });
      }else if (id == 'in_patient') {
        this.reportData['param'] = '/fdt=' + this.toDate ;
        this.CommonService.getReportData('patient-status-ip',this.reportData['param']).subscribe(res => {
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
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&vtyp=inpatient' ;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            console.log(res)
            this.reportData['loading'] = false;
            const label: any = [];
            const data: any = [];
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
                this.reportData['enableexcel'] = true;
                this.reportData['enablepdf'] = true;             
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
          this.reportData['param'] = '/fdt=' + this.toDate ;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            this.reportData['loading'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData['enablepdf'] = true;
            this.reportData.noRecords = false;
            const label: any = [];
            const data: any = [];
            if (res.results.statusCode == 200 && res.results.data.length > 0) {
                this.reportData = res.results.data;
                this.reportData['fullData'] = this.reportData;
                for (let key = 0; key < res.results.chart.length; key++) {
                  label.push(res.results.chart[key].Location);
                  data.push(res.results.chart[key].counts);
                }
                this.ChartService.drawChart({'id':id,'canvasId':'patientFall','type':'pie','data':data,'label':label,'title':'','showTitle':true});
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
            }
          });
      } else if(id == 'tat-all-rep-ot') 
        {
          this.reportData['param'] = '/fdt=' + this.toDate ;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
            console.log(res)
            if (res.results.statusCode == 200 && (res.results.sheet0.length >=1 || res.results.sheet1.length >=1 || res.results.sheet2.length >=1 || res.results.sheet3.length >=1 )) {
              this.reportData['loading'] = false;
            this.reportData['enablepdf'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData.noRecords = false;
              this.reportData['sheet0'] =  res.results.sheet0;
              const timeformat = 'HH:mm:ss'
              this.reportData['sheet1'] =  res.results.sheet1;
              this.reportData['sheet2'] =  res.results.sheet2;
              this.reportData['sheet3'] =  res.results.sheet3;
              this.reportData['sheet4'] = res.results.sheet4;
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
              this.reportData.sheetNames = ['Summary','Test-Summary','TAT Report','TAT Detailed Report by Touchpoint','TAT Detailed Report by Touchpoint - Followup Patients']
              this.reportData.excelData = [this.reportData.sheet0,this.reportData.sheet1,this.reportData.sheet2,this.reportData.sheet3];
              this.reportData.fullexcelData=[this.reportData.excelData, this.reportData.sheetNames]
            }
            else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
            }
          });
      } else if(id == 'patientmove'){ 
        this.reportData['param'] = '/fdt=' + this.toDate ;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
            this.reportData.loading = false;
            this.reportData['enablepdf'] = true;
            this.reportData['enableexcel'] = true;
            if (res.results.statusCode == 200 && res.results.data != null) {
                console.log(res.results.data);
                this.reportData['numberOfPatients'] = res.results.data['Total Patients'].data;
                this.reportData['numberOfPorters'] = res.results.data['No of Porters'].data;
                this.reportData['porterRequested'] = res.results.data['Porter Status Count'][0].Requested;
                this.reportData['porterAccepted'] = res.results.data['Porter Status Count'][0].Accepted;
                this.reportData['porterCompleted'] = res.results.data['Porter Status Count'][0].Completed;
                this.reportData['porterInprogress'] = res.results.data['Porter Status Count'][0].Inprogress;
                this.reportData['floorWiseMovementChartLabel'] = res.results.data['Floorwise Patient movement'].label;
                this.reportData['floorWiseMovementChartTotalData'] = res.results.data['Floorwise Patient movement'].all_pat;
                this.reportData['floorWiseMovementChartPorterData'] = res.results.data['Floorwise Patient movement'].porter;
                this.reportData['timeWiseMovementChartLabel'] = res.results.data.timewise.label;
                this.reportData['timeWiseMovementChartInData'] = res.results.data.timewise.data.IN;
                this.reportData['timeWiseMovementChartOutData'] = res.results.data.timewise.data.OUT;
                this.reportData['Porter Detail'] = res.results.data['Porter Detail'];
                for (let i = 0; i < this.reportData['Porter Detail'].length; i++) {
                this.reportData['Porter Detail']['Movement Date'] = this.datepipe.transform(this.reportData['Porter Detail'][i]['Movement Date'], 'dd/MM/yyyy');
              }
              this.reportData['fullData'] = this.reportData;
              this.reportData['Table'] = res.results.data['Porter Detail'];
              
              this.reportData['TableColumns'] = [];
              if(this.reportData['Table'].length > 0){
                this.reportData['TableColumns'] = Object.keys(this.reportData['Porter Detail'][0]);
                this.reportData['showTable'] = true;
              }
              console.log(this.reportData['Table']);

              this.ChartService.drawChart({'id':id,'canvasId':'patientMovement','type':'grouped','data':[this.reportData['floorWiseMovementChartTotalData'],this.reportData['floorWiseMovementChartPorterData']],'label':this.reportData['floorWiseMovementChartLabel'],'title':'Floorwise Movement','showTitle':false,barLabel:['Total','With porter']});
              this.ChartService.drawChart({'id':id,'canvasId':'patientHourlyMovement','type':'stacked','data':[this.reportData['timeWiseMovementChartInData'], this.reportData['timeWiseMovementChartOutData']  ],'label':this.reportData['timeWiseMovementChartLabel'],'title':'TImewise Movement','showTitle':false,barLabel:['In','Out']});

            } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
            }
          });
      } else if(id == 'nurse-call' ){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          console.log(res)
          this.reportData.loading = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = true;
          if (res.results.statusCode == 200 && res.results.data != null) {
              // this.reportData = res.results.data; 
              this.reportData.enableexcel = true;
              this.reportData.enablepdf = true;             
              // this.reportData['totalNurses'] = res.results.data['Nurse Count'][0]['Total Nurses'];
              // this.reportData['nursesCallTatInWard'] = res.results.data.TAT[1].TAT;
              // this.reportData['nursesCallTatInIcu'] = res.results.data.TAT[0].TAT;
              // this.reportData['nursesCallRatioInWard'] = res.results.data['Nurse Ratio'][1]['Nurse ratio'];
              // this.reportData['nursesCallRatioInIcu'] = res.results.data['Nurse Ratio'][0]['Nurse ratio'];
              this.reportData['hourlyChartData'] = Object.values(res.results.data['Hourly'][0]);
              this.reportData['hourlyChartLabel'] = Object.keys(res.results.data['Hourly'][0]);
              this.reportData['CallChartData'] = res.results.data['Calls'];
              // this.reportData['Table'] = res.results.data['Call Detail'];
              // this.reportData['TableColumns'] = [];
              // if(this.reportData['Table'].length > 0){
              //   this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              //   this.reportData['showTable'] = true;
              // }
              this.reportData['Table'] = res.results.data['Call Summary'];
              this.reportData['TableColumns'] = [];
              if(this.reportData['Table'].length > 0){
                this.reportData['prevselected'] = this.HCselected;
                this.reportData['showTable'] = true;
                this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              }
              this.ChartService.drawChart({'id':id,'canvasId':'hourlyCall','type':'bar','data':this.reportData['hourlyChartData'],'label':this.reportData['hourlyChartLabel'],'title':'Hourly Call','showTitle':true,'barLabel':['Count']});
              this.ChartService.drawChart({'id':id,'canvasId':'nurseCall','type':'bar','data':[this.reportData['CallChartData'].data['Requested'],this.reportData['CallChartData'].data['Completed'],this.reportData['CallChartData'].data['Inprogress']],'label':this.reportData['CallChartData'].label,'title':'Nurse Call','showTitle':true,'barLabel':['Requested','Completed','Inprogress']});
           } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
          }
        });
        }
      } else if(id == 'patient-nav'){
        this.reportData['param'] = '/fdt=' + this.toDate + '&uid=' + this.patientUhid.value;
        this.fromDate = this.toDate;
        this.CommonService.getReportData("pat-journey",this.reportData['param']).subscribe(res => {  
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['loading'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData['Table'] = res.results.data.journey;
            // this.reportData['pat_info'] = res.results.data.pat_list;
            // this.reportData['UHID'] = res.results.data.pat_info.UHID;
            // this.reportData['patientName'] = res.results.data.pat_info.Name;
            // this.reportData['gender'] = res.results.data.pat_info.Gender;
            // this.reportData['birthDate'] = res.results.data.pat_info.birth_date.toLocaleString().split('T')[0];
            // this.reportData['enrollDateTime'] = res.results.data.pat_info.enroll_datetime.toLocaleString().replace('T', ' ');
            // this.reportData['package'] = res.results.data.pat_info.Packagename;
            // this.reportData['visitStart'] = res.results.data.pat_info.VisitStart.toLocaleString().replace('T', ' ');
            // this.reportData['visitComplete'] = res.results.data.pat_info.VisitComplete.toLocaleString().replace('T', ' ');
            this.reportData['journey'] = res.results.data.journey;
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
      } else if(id == 'call-alert'){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          this.reportData.loading = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results['data'];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['prevselected'] = this.HCselected;
            this.reportData['showTable'] = true;
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          }
        });
      } else if(id == 'nurse-call-sum'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          this.reportData.loading = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = true;
          this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':5,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Staff','islist':false,'content':res.results.data['Card']['Total Staff']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Requests','islist':false,'content':res.results.data['Card']['Total Request']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Completed','islist':false,'content':res.results.data['Card']['Total Completed']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Cancellation','islist':false,'content':res.results.data['Card']['Total Cancellation']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Avg.TAT Create to Complete','islist':false,'content':res.results.data['Card']['Avg.TAT Create to Complete']}];
          this.reportData['showCard'] = true;
          this.reportData['Table'] = res.results.data['nursecall summary'];
          this.reportData['locationTable'] = res.results.data['Location wise summary'];
          this.reportData['dateWiseSummary'] = res.results.data['Datewise summary'];
          this.reportData['hourlyChart'] = [res.results.data['Hourly Request & Cancel']['totreq'],res.results.data['Hourly Request & Cancel']['cancelled']];
          this.reportData['locTableColumns'] = [];
          this.reportData['datewiseTableCol'] = [];
          this.reportData['excelData']=[];
          this.reportData['excelData'][0]= this.reportData['Table'];
          this.reportData['excelData'][1]= this.reportData['locationTable'];
          this.reportData['excelData'][2]= this.reportData['dateWiseSummary'];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
          if(this.reportData['locationTable'].length > 0){
            this.reportData['locTableColumns'] = Object.keys(this.reportData['locationTable'][0]);
            this.reportData['showLocTable'] = true;
          }
          if(this.reportData['dateWiseSummary'].length > 0){
            this.reportData['datewiseTableCol'] = Object.keys(this.reportData['dateWiseSummary'][0]);
            this.reportData['showDatwiseTable'] = true;
          }
          this.ChartService.drawChart({'id':id,'canvasId':'hourlyChart','type':'grouped','data':this.reportData['hourlyChart'], 'label':res.results.data['Hourly Request & Cancel']['label'],'title':'Hourly Requests & Cancel','showTitle':true,'barLabel': ['Requested','Cancelled']});
          this.ChartService.drawChart({'id':id,'canvasId':'eventChart','type':'pie','data':res.results.data['Eventype']['count'], 'label':res.results.data['Eventype']['event'],'title':'Event','showTitle':true,'barLabel': []});
          });
        }
      }
      this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.patientUhid.value};
    }
    getUserByType(val){
      let searchList = '';
      searchList += val.target.value;
      if (searchList.length >= 3) {
        this.CommonService.searchDoctor(val.target.value, 'UT_STAFF').subscribe(res => {
          if(res.results.length == 0){
          }
          this.userList = res.results;
        });
      } else {
        this.selectedUser.setValue(null)
        this.userList = [];
      }
    }
    setUserName(id){
      this.selectedUser.setValue(id)
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
  getLocationlist(id) {
    if(id){
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
    } else{
        this.selectedLocation.setValue(null)
        this.locationlist = [];
    }
  }
  setLocationID(id){
    this.selectedLocation.setValue(id)
    this.locationlist = [];
  }
  vitalsChart(data) {
    data['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#ff844f', '#FFC300', '#8e5ea2', '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    if (this.reportData['pulseLine'] != undefined || this.reportData['pulseLine'] != null) {
      this.reportData['pulseLine'].destroy();
    }
    this.reportData['showLine'] = false;
    this.isShowLabel = false;
    if(data != undefined && data.pulse.length > 0){
      this.vitalParam = 'all';
      this.reportData['chartType'] = 'line';
      this.allLineData = [{
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
      }];
      this.allLineLabels = data['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
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
            display : false,
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
    this.allLineColours = [{backgroundColor: data['colors'][0],borderColor : data['colors'][0]},
    {backgroundColor: data['colors'][1],borderColor : data['colors'][1]},
    {backgroundColor: data['colors'][3],borderColor : data['colors'][3]},
    {backgroundColor: data['colors'][4],borderColor : data['colors'][4]},
    {backgroundColor: data['colors'][5],borderColor : data['colors'][5]},
    {backgroundColor: data['colors'][6],borderColor : data['colors'][6]}]
      this.reportData['colors'] = this.allLineColours;
      this.reportData['datasets'] = this.allLineData;
      this.reportData['labels'] = this.allLineLabels;
      this.reportData['options'] = this.lineOptions;
      this.reportData['showLine'] = true
    }
    this.reportData['lineShow'] = true;
  }
  getVitalsParam(param){
                
    this.reportData['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#ff844f', '#FFC300', '#8e5ea2', '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    this.vitalParam = param
    if(this.vitalParam == 'all'){
      console.log('all')
      this.selectedVital.name = '';
      this.selectedVital.low = '';
      this.selectedVital.high = '';
      this.isShowLabel = false;      
      this.chart.datasets = this.allLineData;
      this.chart.labels = this.allLineLabels;
      this.chart.options.scales.yAxes[0].display = false;
      this.chart.options.scales.yAxes[0].ticks = {
        beginAtZero : true,
        maxTicksLimit : 10,
        suggestedMax: Math.max.apply(Math, this.reportData['chartData']['SPO2']) + 21
      }
      this.chart.chart.update();
    }
    if(this.vitalParam === 'pulse'){
      this.selectedVital.name = 'Pulse';
      this.selectedVital.low = this.reportData['pulseRef'][0]['min_val'];
      this.selectedVital.high = this.reportData['pulseRef'][0]['max_val'];
      let lineData = [{
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
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
      {
        data : this.reportData['pulseRef'].map(value => value['max_val']),
        borderDash: [10,5],
        label: 'Maximum',
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
    ]
    let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
      this.chart.datasets = lineData;
      this.chart.labels = lineLabels;
      this.chart.options.scales.yAxes[0].display = true;
      this.chart.options.scales.yAxes[0].ticks = {
        // max: Math.round(this.reportData['pulseRef'][0]['max_val']) + 2,
        // min: Math.round(this.reportData['pulseRef'][0]['min_val']) - 2,
        stepSize: ((Math.round(this.reportData['pulseRef'][0]['max_val']) + 2) - (Math.round(this.reportData['pulseRef'][0]['min_val']) - 2)) / 10
      }
      this.chart.chart.update();
      this.isShowLabel = true;
    }
    if(this.vitalParam === 'temperature'){
      this.selectedVital.name = 'Temperature';
      this.selectedVital.low = this.reportData['tempRef'][0]['min_val'];
      this.selectedVital.high = this.reportData['tempRef'][0]['max_val'];
      let lineData = [{
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
      }]
      let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
      this.chart.datasets = lineData;
      this.chart.labels = lineLabels;
      this.chart.options.scales.yAxes[0].display = true;
      this.chart.options.scales.yAxes[0].ticks = {
        // max: Math.round(this.reportData['tempRef'][0]['max_val']) + 2,
        // min: Math.round(this.reportData['tempRef'][0]['min_val']) - 2,
        stepSize: ((Math.round(this.reportData['tempRef'][0]['max_val']) + 2) - (Math.round(this.reportData['tempRef'][0]['min_val']) - 2)) / 10
      }
      this.chart.chart.update();
      this.isShowLabel = true;
    }
    if(this.vitalParam === 'SPO2'){
      this.selectedVital.name = 'SPO2';
      this.selectedVital.low = this.reportData['SPO2Ref'][0]['min_val'];
      this.selectedVital.high = this.reportData['SPO2Ref'][0]['max_val'];
      let lineData = [{
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
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
      {
        data : this.reportData['SPO2Ref'].map(value => value['max_val']),
        borderDash: [10,5],
        label: 'Maximum',
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
    ]
    let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
      this.chart.datasets = lineData;
      this.chart.labels = lineLabels;
      this.chart.options.scales.yAxes[0].display = true;
      this.chart.options.scales.yAxes[0].ticks = {
        // max: Math.round(this.reportData['SPO2Ref'][0]['max_val']) + 2,
        // min: Math.round(this.reportData['SPO2Ref'][0]['min_val']) - 2,
        stepSize: ((Math.round(this.reportData['SPO2Ref'][0]['max_val']) + 2) - (Math.round(this.reportData['SPO2Ref'][0]['min_val']) - 2)) / 10
      }
      this.chart.chart.update();
      this.isShowLabel = true;
    }
    if(this.vitalParam === 'HR'){
      this.selectedVital.name = 'HR';
      this.selectedVital.low = this.reportData['HRRef'][0]['min_val'];
      this.selectedVital.high = this.reportData['HRRef'][0]['max_val'];
      let lineData = [{
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
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
      {
        data :  this.reportData['HRRef'].map(value => value['max_val']),
        borderDash: [10,5],
        label: 'Maximum',
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
    ]
    let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
    this.chart.datasets = lineData;
    this.chart.labels = lineLabels;
    this.chart.options.scales.yAxes[0].display = true;
    this.chart.options.scales.yAxes[0].ticks = {
      // max: Math.round(this.reportData['HRRef'][0]['max_val']) + 2,
      // min: Math.round(this.reportData['HRRef'][0]['min_val']) - 2,
      stepSize: ((Math.round(this.reportData['HRRef'][0]['max_val']) + 2) - (Math.round(this.reportData['HRRef'][0]['min_val']) - 2)) / 10
    }
    this.chart.chart.update();
    this.isShowLabel = true;
    }
    if(this.vitalParam === 'HRV'){
      this.selectedVital.name = 'HRV';
      this.selectedVital.low = this.reportData['HRVRef'][0]['min_val'];
      this.selectedVital.high = this.reportData['HRVRef'][0]['max_val'];
      let lineData = [{
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
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
      {
        data : this.reportData['HRVRef'].map(value => value['max_val']),
        borderDash: [10,5],
        label: 'Maximum',
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
    ]
    let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
      this.chart.datasets = lineData;
      this.chart.labels = lineLabels;
      this.chart.options.scales.yAxes[0].display = true;
      this.chart.options.scales.yAxes[0].ticks = {
        // max: Math.round(this.reportData['HRVRef'][0]['max_val']) + 2,
        // min: Math.round(this.reportData['HRVRef'][0]['min_val']) - 2,
        stepSize: ((Math.round(this.reportData['HRVRef'][0]['max_val']) + 2) - (Math.round(this.reportData['HRVRef'][0]['min_val']) - 2)) / 10
      }
      this.chart.chart.update();
      this.isShowLabel = true;
    }
    if(this.vitalParam === 'resp_rate'){
      this.selectedVital.name = 'Respiratory rate';
      this.selectedVital.low = this.reportData['respRef'][0]['min_val'];
      this.selectedVital.high = this.reportData['respRef'][0]['max_val'];
      let lineData = [{
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
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
      {
        data : this.reportData['respRef'].map(value => value['max_val']),
        borderDash: [10,5],
        label: 'Maximum',
        backgroundColor: '#28425560',
        borderColor : '#28425560',
        fill: false,
        pointRadius: 0
      },
    ]
    let lineLabels = this.reportData['chartData']['event_time'].map(value => this.datepipe.transform(value, 'HH:mm dd/MM'));
      this.chart.datasets = lineData;
      this.chart.labels = lineLabels;
      this.chart.options.scales.yAxes[0].display = true;
      this.chart.options.scales.yAxes[0].ticks = {
        // max: Math.round(this.reportData['respRef'][0]['max_val']) + 2,
        // min: Math.round(this.reportData['respRef'][0]['min_val']) - 2,
        stepSize: ((Math.round(this.reportData['respRef'][0]['max_val']) + 2) - (Math.round(this.reportData['respRef'][0]['min_val']) - 2)) / 10
      }
      this.chart.chart.update();
      this.isShowLabel = true;
    }
  }
  getPatientsCheck(key) {
    this.patientSub.next(key);
  }  
  getPatients(key){
    if (key.target.value !== "") {
      let val = key.target.value;
      if (val.length >= 2) {
        this.CommonService.searchPatient(key.target.value).subscribe((res) => {
          this.patientList = res.results.filter(res => res.mainidentifier != null);
          // this.setPatientName(val);
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
downloadExcel() {
    let excelData : any;
    let name = '';
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
        name = name + this.selected['selectedId'];
        excelData =  this.reportData['Table'];    
        if(this.selected['selectedId'] == 'tat-all-rep-ot'){
            name='OT - TAT All Report'
            excelData =  this.reportData.fullexcelData;
        } else if(this.selected['selectedId'] == 'OT-Rep'){
            name = 'OT - Complex Utilisation Report'
            excelData=[];
            excelData[0] =  this.reportData['excelData'];
            for(let i=0;i<excelData[0][0].length;i++){
              delete excelData[0][0][i]['children']
              //delete excelData[0][0][i]['close']
            }
            for(let i=0;i<excelData[0][1].length;i++){
              delete excelData[0][1][i]['children']
            }
            excelData[1] = ['OT-Complex Utilisation summary','OT-Complex Utilisation details']
            this.getinPatientReports('OT-Rep')
        }else if(this.selected['selectedId'] == 'asset-util-patient'){
          name = 'Asset Utilisation For Ward'
          excelData=[];
          excelData[0] =  this.reportData['excelData'];
          for(let i=0;i<excelData[0][0].length;i++){
            delete excelData[0][0][i]['children']
            //delete excelData[0][0][i]['close']
          }
          for(let i=0;i<excelData[0][1].length;i++){
            delete excelData[0][1][i]['children']
          }
          excelData[1] = ['Asset Utilisation summary','Asset Utilisation details']
          this.getinPatientReports('asset-util-patient')
        } else if(this.selected['selectedId'] == 'patient-nav'){
          name = 'Patient Navigation Report'
        } else if(this.selected['selectedId'] == 'call-alert'){
          name = 'Patient Call Alert';
        } else if(this.selected['selectedId'] == 'vitals-chart'){
          name = 'Vitals Chart Summary';
          excelData =  this.reportData['vitalsTable'];  
        } else if(this.selected['selectedId'] == 'nurse-call-sum'){
          excelData=[];
          excelData[0] = this.reportData['excelData'];
          name = 'Nursecall Summary';
          excelData[1] = ['Nursecall Summary','Locationwise Movement Summary','Datewise Summary'];
        }
        // else if(this.selected['selectedId'] == 'vitals-chart'){
        //   name = 'Vitals Report'
        //   excelData=[];
        //   excelData[0] =  this.reportData['excelData'];
        //   excelData[1] = ['test1','test2','test3']
        // }
        this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
    } else {
        excelData = [];
    }
  }
downloadPDF() {
  let pdfData : any;
  let addInfo : any;
  let chartImage = [];
  let name: string;
  let id = this.selected['selectedId'];
  if (this.reportData.length || this.reportData != null) {
    pdfData=this.reportData;
    if(this.selected['selectedId'] == 'OT-Rep'){
      console.log(this.reportData['TableColumns']);
      name = 'OT Complex Utilization';
      chartImage=[document.getElementById('OTNu'),document.getElementById('OTU')];
    } else if(this.selected['selectedId'] == 'patientmove'){
      name = 'Patient Movement Summary';      
      chartImage=[document.getElementById('patientMovement'),document.getElementById('patientHourlyMovement')];
    } else if( this.selected['selectedId'] == 'patientfall'){
      name = 'Patient Fall Summary'
      chartImage=[document.getElementById('PatientFall')];
    } else if( this.selected['selectedId'] == 'in_patient'){
      name = 'In Patient Report'
      this.reportData['TableColumns'] = [];
      chartImage=[document.getElementById('IPdevice'),document.getElementById('IPage'),document.getElementById('IPlanguage'),document.getElementById('IPgender'),document.getElementById('IPward'),document.getElementById('IPspeciality')];
    } else if( this.selected['selectedId'] == 'geofencevio'){
      name = 'Patient Geofence Violation'
      chartImage=[document.getElementById('geofenceViolation')];
    } else if( this.selected['selectedId'] == 'vitals-chart'){
      name = 'Vitals Chart Summary'
      this.reportData['TableColumns'] = [];
      chartImage=[document.getElementById('pulseChart')];
      addInfo = {"toDate" : this.selected['todate'], "patName" : this.reportData['patientName'][0], "uhid": this.selected['Uhid'], "refType": this.selectedVital.name, "low": this.selectedVital.low, "high": this.selectedVital.high};
    } else if( this.selected['selectedId'] ==  'nurse-call'){
      name = "Nurse Call Efficeiency Report";
      chartImage=[document.getElementById('nurseCall'),document.getElementById('hourlyCall')]
    }  else if( this.selected['selectedId'] ==  'pat-mrid-list'){
      name = "Medical Record Files Report";
      chartImage=[document.getElementById('tagStatusMR')]
    } else if(this.selected['selectedId'] =='nurse-call-sum'){
      name = "NurseCall Summary";
      chartImage=[document.getElementById('hourlyChart'),document.getElementById('eventChart')];
      addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
    }else {
      name = this.selected['selectedId'];
    }
    this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], id, chartImage, addInfo);
  } else {
    pdfData = [];
  }

}
  fixClick() {
    console.log('')
  }
}
