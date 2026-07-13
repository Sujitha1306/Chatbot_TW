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

import { ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {ExcelService, PdfService, CommonService, ChartService } from '../../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import 'chartjs-plugin-datalabels';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CdkDetailRowDirective } from './cdk-detail-row.directive';

@Component({
  selector: 'app-optheatre-report',
  templateUrl: './optheatre-report.component.html',
  styleUrls: ['./optheatre-report.component.scss']
})

export class OperationTheatreReportComponent implements OnInit {

    public reportForm: FormGroup;
    public date: any = new Date();
    // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
    public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
    public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
    public facilityId = new FormControl();
    public reportList : any;
    public chartHgt = '500px';
    public reportData : any = [];
    public selectedReport : any = new FormControl();
    public regionValue: string;
    public facilityList : any;
    public HCselected = 'OT-Rep';
    public selected : any;
    public chartImage: any;
    public waitSumLabel= 10;
    public patientSub : Subject<any> = new Subject();
    public patientList: any = [];
    public patientUhid: any = new FormControl();
    headercolor: string;
    bgcolor: string;
    pagebgcolor: string;
    validDate: any;
    today = new Date();
    public timelineChartData:any;
    public activate_btn: any = [];
    public chartLoaded = false;
    public filterInputs =[];
    toDateTime: any;
    fromDateTime: any;
    enableInsights : boolean = false ;
    chartHeight:any = 400;
    
    constructor(public datepipe: DatePipe, public PdfService: PdfService,
      public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService,private readonly cdRef: ChangeDetectorRef) {
        this.getReportList();
        this.activate_btn = this.CommonService.getActivePermission('button');
      }
  
  
    ngOnInit() {
        this.getOTReports(this.HCselected);
        this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
          this.getPatients(searchTextValue);
        }); 
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
         this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
          { name: "fromDate", id: "fdt", label: "From Date", seq: 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd HH:MM')},
          { name: "toDate", id: "tdt", label: "To Date", seq: 3, default: this.datepipe.transform(this.toDate, 'yyyy-MM-dd HH:MM')},
          { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
    }
    getReportList() {
      let permissions = JSON.parse(localStorage.getItem('permission'));
      let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
      // let submenusList = menuItemsList[0]['subMenus'].filter(res=> res.code== "MN_AIPTS");
      // let submenus = submenusList[0]['subMenus'].filter(res=> res.code== "MN_AIPTOT");
      let submenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTOT") : null;
      let tempId =submenusList['id'];
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
  getOTReports(id){
    this.selectedReport.setValue(id);
    this.patientList = [];
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
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
      this.reportData['nullIdentifier'] = false;
      this.reportData['tableView'] = false;
      this.reportData['initialised'] = false;
      this.reportData['prevselected'] = this.HCselected;
      this.reportData['charts'] = [];
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
              let excelTable = [...this.reportData['Table']];
              this.reportData['excelData']=[];
              this.reportData['excelData'][0]= excelTable;
              this.reportData['excelData'][1]=[];
              this.reportData['excelData'][2]=[];
              this.reportData['excelData'][3]=[];
              for(let i=0;i<excelTable.length;i++){    
                for(let j=0;j<excelTable[i]['Location'].length;j++){
                  if(this.reportData['excelData'][0][i].Location.length){
                    this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].Location[j]));
                  }
                  if(this.reportData['excelData'][0][i].Asset.length){
                    this.reportData['excelData'][2].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].Asset[j]));
                  }
                  if(this.reportData['excelData'][0][i].Careprovider.length){
                    this.reportData['excelData'][3].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].Careprovider[j]));
                  }
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
    }else if(id == 'OT-move'){
      this.reportData['param'] = '/fdt=' + this.toDate+'&uid=' + this.patientUhid.value;
      this.fromDate = this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data;
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
        }
        if(!this.reportData['showTable']){
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      });
    } else if(id == 'OT-utilz'){
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['data'] = res.results.data;
          this.reportData['enablepdf'] = true;
          this.reportData['Total Surgeries'] = this.reportData['data']['Card']['Total Surgeries'];
          this.reportData['Total OT Utilization'] = this.reportData['data']['Card']['Total Surgery time'];
          this.reportData['Total PreOP Time'] = this.reportData['data']['Card']['Total PreOP time'];
          this.reportData['Total PostOp Time'] = this.reportData['data']['Card']['Total PostOp time'];
          this.reportData['Total Surgeons'] = this.reportData['data']['Card']['Total Surgeons'];
          this.reportData['Max Utilized OT (by hr)'] = this.reportData['data']['Card']['Max Utilized OT (by hr)'];
          this.reportData['Min Utilized OT (by hr)'] = this.reportData['data']['Card']['Min Utilized OT (by hr)'];
          this.reportData['Most Utilized OT (by surgery)'] = this.reportData['data']['Card']['Most Utilized OT (by surgery)'];
          if(this.reportData['data']['prepost utliz']['label'].length>50){
            this.chartHgt = '600px';
          }
          // this.reportData['roomUtilizData'] = [this.reportData['data']['Surgery room utliz']['data']['Duration'], this.reportData['data']['Surgery room utliz']['data']['Count']];
          // this.ChartService.drawChart({'id':id,'canvasId':'otUtilizAgg','type':'bar','data':this.reportData['data']['Utliz Agg']['data'],'label':this.reportData['data']['Utliz Agg']['label'],'title':'OT Utilization','showTitle':false});
          this.ChartService.drawChart({'id':id,'canvasId':'otUtilizPercent','type':'pie','data':this.reportData['data']['Utliz percent']['data'],'label':this.reportData['data']['Utliz percent']['label'],'title':'Surgery count by Location','showTitle':true});  
          this.ChartService.drawChart({'id':id,'canvasId':'otRoomUtiliz','type':'bar','data':this.reportData['data']['Surgery room utliz']['data']['Duration'],'label': this.reportData['data']['Surgery room utliz']['label'],'title':'Location Utilization(hr)','showTitle':true});  
          this.ChartService.drawChart({'id':id,'canvasId':'otWardUtiliz','type':'bar','data':this.reportData['data']['prepost utliz']['data'],'label':this.reportData['data']['prepost utliz']['label'],'title':'Avg.time by Surgery (in hr)','showTitle':true});
          this.ChartService.drawChart({'id':id,'canvasId':'otSurgeon','type':'bar','data':this.reportData['data']['by Surgeon']['data'],'label':this.reportData['data']['by Surgeon']['label'],'title':'Surgery count by Surgeon','showTitle':true});
          this.ChartService.drawChart({'id':id,'canvasId':'otOccupancy','type':'bar','data':this.reportData['data']['by Day']['data'],'label':this.reportData['data']['by Day']['label'],'title':'Avg.Occupancy by Day of week(hr)','showTitle':true});
          this.ChartService.drawChart({'id':id,'canvasId':'assetUtliz','type':'bar','data':this.reportData['data']['Asset Utliz']['data'],'label':this.reportData['data']['Asset Utliz']['label'],'title':'Asset Utilization(hr)','showTitle':true,'tempLabel':this.reportData['data']['Asset Utliz']['data_tm']});
          this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':8,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Surgeries','content':this.reportData['Total Surgeries']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total OT Utilization','content':this.reportData['Total OT Utilization']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total PreOP Time','content':this.reportData['Total PreOP Time']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total PostOp Time','content':this.reportData['Total PostOp Time'] },
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Surgeons','content':this.reportData['Total Surgeons']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Max Utilized OT (by hr)','content':this.reportData['Max Utilized OT (by hr)']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Min Utilized OT (by hr)','content':this.reportData['Min Utilized OT (by hr)']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Most Utilized OT (by surgery)','content':this.reportData['Most Utilized OT (by surgery)']}];
          this.reportData['showCards'] = true; 
        }
      });
    } else if(id == 'OT-wait'){
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
        if (res.results.statusCode == 200 && res.results.data != null){
          this.reportData['loading'] = false;
          this.reportData['data'] = res.results.data;
          this.reportData['enablepdf'] = true;
          // this.reportData['Table'] = this.reportData['data']['Waittime Details'];
          // if(this.reportData['Table'].length > 0){
          //   this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          //   this.reportData['showTable'] = true;
          // }
          this.reportData['Total Surgeries'] = this.reportData['data']['Card']['Total Surgeries'];
          this.reportData['Total OT Waittime'] = this.reportData['data']['Card']['Total OT Waittime'];
          this.reportData['Total PreOP Waittime'] = this.reportData['data']['Card']['Total PreOP Waittime'];
          this.reportData['Total PostOp Waittime'] = this.reportData['data']['Card']['Total PostOp Waittime'];
          this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':4,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Surgeries','content':this.reportData['Total Surgeries']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total OT Waittime','content':this.reportData['Total OT Waittime']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total PreOP Waittime','content':this.reportData['Total PreOP Waittime']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total PostOp Waittime','content':this.reportData['Total PostOp Waittime']}];
          this.reportData['showCards'] = true; 
          this.reportData['otwaitLocData'] = [this.reportData['data']['Total waittime by OT room']['data']['Count'], this.reportData['data']['Total waittime by OT room']['data']['Duration']];
          this.reportData['otWaitSurgeryData'] = [this.reportData['data']['Total waittime by Surgery']['data']['Count'], this.reportData['data']['Total waittime by Surgery']['data']['Duration']];
          this.ChartService.drawChart({'id':id,'canvasId':'otwaitLoc','type':'grouped','data':this.reportData['otwaitLocData'],'label': this.reportData['data']['Total waittime by OT room']['label'],'title':'Total Waittime By Location','showTitle':true,'barLabel': ['OT surgeries','wait time(hrs)']});  
          this.ChartService.drawChart({'id':id,'canvasId':'otWaitSurgery','type':'grouped','data':this.reportData['otWaitSurgeryData'],'label': this.reportData['data']['Total waittime by Surgery']['label'],'title':'Total Waittime By Surgery','showTitle':true,'barLabel': ['OT surgeries','wait time(hrs)']}); 
          this.waitSumLabel = this.reportData['data']['Total waittime by Surgery']['label'].length; 
        }
      }); 
    } else if(id == 'OT-daily'){
      this.chartLoaded = false;
      this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
        if (res.results.statusCode == 200 && res.results.data != null){
          this.reportData['loading'] = false;
          this.reportData['enablepdf'] = false;
          this.reportData['data'] = res.results;
          this.reportData['No.of.Surgeries'] = this.reportData['data']['card']['No.of.Surgeries'];
          this.reportData['OTLocations'] = this.reportData['data']['card']['OTLocations'];
          this.reportData['Surgeons'] = this.reportData['data']['card']['Surgeons'];
          this.reportData['AssetsUtlizied'] = this.reportData['data']['card']['AssetsUtlizied'];
          this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':4,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'No.of.Surgeries','content':this.reportData['No.of.Surgeries']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'OT Locations','content':this.reportData['OTLocations']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Surgeons','content':this.reportData['Surgeons']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Assets Utlized','content':this.reportData['AssetsUtlizied']}];
          this.reportData['showCards'] = true;
          this.reportData['chartData'] = res.results.data['dataTable'];
          this.reportData['chartData'][0] = ["Location",
          "Duration",
          { role: 'style' },
          { type: 'string', role: 'tooltip', p: { html: true } },
          "Fromtime",
          "Totime"]
          for(let i=1;i<this.reportData['chartData'].length;i++){
            let tmpDate = new Date(this.reportData['chartData'][i][3]);
            this.reportData['chartData'][i][3] = tmpDate;
            let tmpDate1 = new Date(this.reportData['chartData'][i][4]);
            this.reportData['chartData'][i][4] = tmpDate1;
             let row = this.reportData['chartData'][i];        
                  let fromTime = new Date(row[3]);
                  let toTime= new Date(row[4]);
                  let from = this.formatTimeOnly(fromTime);
                  let to = this.formatTimeOnly(toTime);
                  let label = row[1];          
                  row[3] = fromTime;
                  row[4] = toTime;
                  let location = row[0];       

                  let durationMs = toTime.getTime() - fromTime.getTime();
                  let totalSeconds = Math.floor(durationMs / 1000);
                  let minute = Math.floor(totalSeconds / 60);
                  let seconds = totalSeconds % 60;
                  let formattedDuration = `${minute}m ${seconds}s`;

                  let h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                  let m = (Math.floor((totalSeconds % 3600) / 60)).toString().padStart(2, '0');
                  let s = (totalSeconds % 60).toString().padStart(2, '0');
                  let durationClock = `${h}:${m}:${s}`;

                  let diffMs = toTime.getTime() - fromTime.getTime();
                  let diffMins = Math.floor(diffMs / 60000);
                  let hours = Math.floor(diffMins / 60);
                  let minutes = diffMins % 60;

                  let durationStr = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;

                let tooltip = `<div style="padding: 6px 10px; font-size: 14px; line-height: 1.5;">
                            <div style="font-weight: bold; margin-bottom: 4px;">
                              ${label} 
                            </div>
                            <hr style="margin: 4px 0;">
                            <div><b>${location} : </b> ${from} - ${to}</div>
                            <div><b>Duration :</b> ${durationStr}</div>
                          </div>`;

                  row.splice(3, 0, tooltip);
          }
          this.timelineChartData =  {
            chartType: 'Timeline',
            dataTable : this.reportData['chartData'],
            options: {
                      tooltip: { isHtml: true },
                      responsive : true,
                      height:this.chartHeight,
                      Width: '100%'
                    },
         }
         this.chartLoaded = true;
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
          this.reportData['enablepdf'] = false
        }
      });
    }
  this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.patientUhid.value};
   if(this.HCselected != 'OT-Rep' &&this.HCselected != 'OT-utilz' && this.HCselected != 'OT-wait' && this.HCselected != 'OT-daily'){
           this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
            { name: "toDate", id: "fdt", label: "Report Date", seq: 2, default:this.datepipe.transform(this.toDate, 'yyyy-MM-dd')},
            { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
        }else{
           this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
            { name: "fromDate", id: "fdt", label: "From Date", seq: 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd') },
            { name: "toDate", id: "tdt", label: "To Date", seq: 3, default:this.datepipe.transform(this.toDate, 'yyyy-MM-dd') },
            { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
        }
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
  getPatientsCheck(key) {
    this.patientSub.next(key);
  }  
  setPatientName(id){
    if(id.length>4){
      this.patientUhid.setValue(id);
      this.enableInsights = true 
    }
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
      this.patientUhid.setValue(null);
      this.patientList = [];
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
                delete excelData[0][0][i]['Location'];
                delete excelData[0][0][i]['Asset'];
                delete excelData[0][0][i]['Careprovider'];
                delete excelData[0][0][i]['close'];
              }
              for(let i=0;i<excelData[0][1].length;i++){
                delete excelData[0][1][i]['Location']
                delete excelData[0][1][i]['Asset'];
                delete excelData[0][1][i]['Careprovider'];
              }
              for(let i=0;i<excelData[0][2].length;i++){
                delete excelData[0][2][i]['Location']
                delete excelData[0][2][i]['Asset'];
                delete excelData[0][2][i]['Careprovider'];
              }
              for(let i=0;i<excelData[0][3].length;i++){
                delete excelData[0][3][i]['Location']
                delete excelData[0][3][i]['Asset'];
                delete excelData[0][3][i]['Careprovider'];
              }
             const taggedPatients = excelData[0][0].filter(item =>
                item['Tag id'] !== null &&
                item['Tag id'] !== undefined &&
                item['Tag id'] !== ''
              );

              excelData[0].splice(0, 0, taggedPatients);
              excelData[1] = ['OT-Complex Utilisation (Tagged patient)','OT-Complex Utilisation summary','OT-Complex Utilisation Location details','OT-Complex Utilisation Asset details','OT-Complex Utilisation Careprovider details']
              this.getOTReports('OT-Rep')       
          } else if(this.selected['selectedId'] == 'OT-move'){
            name = 'OT Movement Report'
          }
          this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
      } else {
          excelData = [];
      }
    }
    downloadPDF() {
      let pdfData : any;
      let chartImage = [];
      let name: string;
      let addInfo : any;
      let id = this.selected['selectedId'];
      if (this.reportData.length || this.reportData != null) {
        pdfData=this.reportData;
        if(this.selected['selectedId'] == 'OT-Rep'){
          console.log(this.reportData['TableColumns']);
          name = 'OT Complex Utilization';
          chartImage=[document.getElementById('OTNu'),document.getElementById('OTU')];
        } else if(this.selected['selectedId'] == 'OT-utilz'){
          name = 'OT Location Utilization';
          chartImage=[document.getElementById('otUtilizPercent'),document.getElementById('otOccupancy'),document.getElementById('assetUtliz'),document.getElementById('otRoomUtiliz'),document.getElementById('otWardUtiliz'),document.getElementById('otSurgeon')];
          this.reportData['TableColumns'] = [];
          addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
        } else if(this.selected['selectedId'] == 'OT-wait'){
          name = 'OT Waittime';
          chartImage=[document.getElementById('otwaitLoc'),document.getElementById('otWaitSurgery')];
          this.reportData['TableColumns'] = [];
          addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
        } else if(this.selected['selectedId'] == 'OT-daily'){
          name = 'OT Daily Utilization Report';
          chartImage=[document.getElementById('otdaily')];
          this.reportData['TableColumns'] = [];
        }
        else {
          name = this.selected['selectedId'];
        }
        this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], id, chartImage,addInfo);
      } else {
        pdfData = [];
      }
    }
     reportHeaderAction(event) {
      console.log(event)
      if(event.key === 'fromDate'){
        const date= this.datepipe.transform(event.data, "yyyy-MM-dd");
         this.fromDate = date;
         this.fromDateTime =event.data
         this.reportForm.controls['fromDate'].setValue(date)
      }else if (event.key === 'toDate'){
         const date= this.datepipe.transform(event.data, "yyyy-MM-dd");
         this.toDate = date;
         this.toDateTime =event.data;
         this.reportForm.controls['toDate'].setValue(date)
      } else if (event.key === 'report'){
        this.HCselected = event.data.link
        if(this.HCselected != 'OT-Rep' &&this.HCselected != 'OT-utilz' && this.HCselected != 'OT-wait' && this.HCselected != 'OT-daily'){
           this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
            { name: "toDate", id: "fdt", label: "Report Date", seq: 2, default:this.datepipe.transform(this.toDate, 'yyyy-MM-dd HH:MM')},
            { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
        }else{
           this.filterInputs = [{ name: 'report', id: 'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected },
            { name: "fromDate", id: "fdt", label: "From Date", seq: 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd HH:MM') },
            { name: "toDate", id: "tdt", label: "To Date", seq: 3, default:this.datepipe.transform(this.toDate, 'yyyy-MM-dd HH:MM') },
            { name: "getInsights", id: "gis", label: "Get Insights", seq: 6 }];
        }
      } else if (event.key === 'excel'){
        this.downloadExcel()
      } else if (event.key === 'pdf'){
        this.downloadPDF()
      } else if (event.key === 'getInsights'){
        this.enableInsights = false ; 
        if(this.HCselected==='OT-daily'){
        setTimeout(() => this.setChartHeight(), 0);}
        this.getOTReports(this.HCselected)  
      } else if (event.key === 'refresh'){
  if(this.HCselected==='OT-daily'){
        setTimeout(() => this.setChartHeight(), 0);}        this.getOTReports(this.HCselected)
      } else if (event.key === 'reportDate'){
        const date= this.datepipe.transform(event.data, "YYYY-MM-dd");
        this.toDate = date;      
      }
    }
    
    setChartHeight() {
      const windowHeight = window.innerHeight;
      const headerHeight = 210;
      const cardsHeight = 200;
      const margin = 50;
      const remaining = windowHeight - (headerHeight + cardsHeight + margin);
      this.chartHeight = remaining > 250 ? remaining : '250px'; 
    }

    formatTimeOnly(date) {
      return date.toLocaleTimeString('en-GB', { hour12: false });  // 24-hour format HH:MM:SS
    }
   fixClick() {
    console.log('')
  }   
}

@Component({
  selector: 'app-optheatre-table',
  templateUrl: './optheatre-table.component.html',
  styleUrls: ['./optheatre-report.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class OperationTheatreTableComponent implements OnInit {
  @Input() tableData:any;
  tableColumns=["UHID"];
  headercolor = '#1e8fc8';
  public locationTable : any = [];
  public assetTable : any = [];
  public careProviderTable : any = [];
  tempCol = ["Type"]
  tempTable = [{"Type":"Location"},{"Type":"Assets"},{"Type":"Careproviders"}]
  locTableColumns = [];
  assetTableColumns = [];
  cpTableColumns = [];
  isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');
  private openedRow: CdkDetailRowDirective;
  private openedRow2: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;
  dataSource = new MatTableDataSource<any>();
  route: any;
  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    this.dataSource.paginator = value;
  }    
  @ViewChild(MatSort)
  set sort(value: MatSort) {
    this.dataSource.sort = value;
  }

  constructor(){}
  ngOnInit(): void {
    this.initializeTable();
  }
  initializeTable(){
    this.tableColumns = Object.keys(this.tableData[0]);
    this.tableColumns = this.tableColumns.filter(column => !['Location', 'Asset', 'Careprovider'].includes(column));
    this.dataSource.data = this.tableData;
 
  }
  rowClick(data) {
    this.locationTable = data.Location;
    this.assetTable = data.Asset;
    this.careProviderTable = data.Careprovider;
      this.tempTable = this.getFilteredChildRows(data)
    if(this.locationTable.length){
      this.locTableColumns = Object.keys(this.locationTable[0]);
    }
    if(this.assetTable.length){
      this.assetTableColumns = Object.keys(this.assetTable[0]);
    }
    if(this.careProviderTable.length){
      this.cpTableColumns = Object.keys(this.careProviderTable[0]);
    }
  }

hasChild(element){
  if(element.Location?.length > 0){
    return true 
  }else if(element.Careprovider?.length > 0){
    return true
  }else if(element.Asset?.length > 0){
    return true 
  }else{
    return false
  }
}
  onToggleChange(cdkDetailRow: CdkDetailRowDirective,row) : void {
    if (this.openedRow && this.openedRow.expended) {
      this.openedRow.toggle();      
    } 
    if(!row.close)
    {
      row.close = true;
    } 
    else { 
      row.close = false;
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }

  onToggleChange2(cdkDetailRow: CdkDetailRowDirective,row) : void {
    if (this.openedRow2 && this.openedRow2.expended) {
      this.openedRow2.toggle();      
    } 
    if(!row.close)
    {
      row.close = true;
    } 
    else { 
      row.close = false;
    }
    this.openedRow2 = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }

  hasChildData(element: any,element1): boolean {
  if (element1.Type === 'Location') {
    return element.Location?.length > 0;
  } else if (element1.Type === 'Assets') {
    return element.Assets?.length > 0;
  } else if (element1.Type === 'Careproviders') {
    return element.Careproviders?.length > 0;
  }
  return false;
}
hasChild1(element){
  return (
    Array.isArray(element?.Location) && element.Location.length > 0 ||
    Array.isArray(element?.Careprovider) && element.Careprovider.length > 0 ||
    Array.isArray(element?.Asset) && element.Asset.length > 0
  );
}

getFilteredChildRows(row: any): any[] {
  const children = [];

  if (row.Location && row.Location.length > 0) {
    children.push({ Type: 'Location', data: row.Location });
  }

  if (row.Asset && row.Asset.length > 0) {
    children.push({ Type: 'Assets', data: row.Asset });
  }

  if (row.Careprovider && row.Careprovider.length > 0) {
    children.push({ Type: 'Careproviders', data: row.Careprovider });
  }

  return children;
 }
  fixClick() {
    console.log('')
  }
}
