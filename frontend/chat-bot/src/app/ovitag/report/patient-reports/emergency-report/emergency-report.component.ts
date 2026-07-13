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
import {ExcelService, PdfService, CommonService, ChartService } from '../../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-emergency-report',
  templateUrl: './emergency-report.component.html',
  styleUrls: ['./emergency-report.component.scss']
})

export class EmergencyReportComponent implements OnInit {

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
    public HCselected = 'ER-Rep-new';
    public selected : any;
    public chartImage: any;
    public waitSumLabel= 10;
    headercolor: string;
    bgcolor: string;
    pagebgcolor: string;
    validDate: any;
    today = new Date();
    public timelineChartData:any;
    public activate_btn: any = [];
    
    constructor(public datepipe: DatePipe, public PdfService: PdfService,
      public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService) {
        this.activate_btn = this.CommonService.getActivePermission('button');
      }
  
  
    ngOnInit() {
        this.getReportList();
        this.getERReports(this.HCselected);
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
      let submenus =menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTEM") : null;
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
    getERReports(id){
      this.selectedReport.setValue(id);
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
         if (id == 'ER-Rep-new') {
          this.validDate=this.validate(this.fromDate,this.toDate);
          if(!this.validDate){
            this.reportData['invalidDate'] = true;
            this.reportData['loading'] = false;
            this.reportData['noRecords'] = true;
          }
          else{
            this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
            this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
              if (res.results.statusCode == 200 && res.results.data!=null) {
                this.reportData['loading']=false;
                this.reportData['enableexcel']=true;
                this.reportData['excelData'] = [];
                this.reportData['fullData'] = res.results.data['ER Detail'];
                this.reportData['Table'] = this.reportData['fullData'];
                this.reportData['TableColumns'] = [];
                if(this.reportData['Table'].length > 0){
                  this.reportData['TableColumns'] = Object.keys(this.reportData['fullData']);
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
      }else if(id == 'ER-move'){
        this.reportData['param'] = '/fdt=' + this.toDate;
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
          } else{
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
        });
      } else if(id == 'ER-utilz'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
            if (res.results.statusCode == 200 && res.results.data != null) {
              this.reportData['loading'] = false;
              this.reportData['data'] = res.results.data;
              this.reportData['enablepdf'] = true;
              this.reportData['Total Patients'] = this.reportData['data']['Card']['Total Surgeries'];
              this.reportData['Total ER Utilization'] = this.reportData['data']['Card']['Total Surgery time'];
              this.reportData['Total Triage Time'] = this.reportData['data']['Card']['Total PreOP time'];
              this.reportData['Total Radiology Time'] = this.reportData['data']['Card']['Total PostOp time'];
              this.reportData['Max Utilized ER (by hr)'] = this.reportData['data']['Card']['Max Utilized OT (by hr)'];
              this.reportData['Min Utilized ER (by hr)'] = this.reportData['data']['Card']['Min Utilized OT (by hr)'];
              this.reportData['Most Utilized ER (by count)'] = this.reportData['data']['Card']['Most Utilized OT (by surgery)'];
              if(this.reportData['data']['prepost utliz']['label'].length>50){
                this.chartHgt = '600px';
              }
              // this.reportData['roomUtilizData'] = [this.reportData['data']['Surgery room utliz']['data']['Duration'], this.reportData['data']['Surgery room utliz']['data']['Count']];
              // this.ChartService.drawChart({'id':id,'canvasId':'otUtilizAgg','type':'bar','data':this.reportData['data']['Utliz Agg']['data'],'label':this.reportData['data']['Utliz Agg']['label'],'title':'OT Utilization','showTitle':false});
              this.ChartService.drawChart({'id':id,'canvasId':'otUtilizPercent','type':'pie','data':this.reportData['data']['Utliz percent']['data'],'label':this.reportData['data']['Utliz percent']['label'],'title':'Patient Count by Location','showTitle':true});
              this.ChartService.drawChart({'id':id,'canvasId':'otRoomUtiliz','type':'bar','data':this.reportData['data']['Surgery room utliz']['data']['Duration'],'label': this.reportData['data']['Surgery room utliz']['label'],'title':'Location Utilization(hr)','showTitle':true});
              this.ChartService.drawChart({'id':id,'canvasId':'otWardUtiliz','type':'bar','data':this.reportData['data']['prepost utliz']['data'],'label':this.reportData['data']['prepost utliz']['label'],'title':'Avg Consult Time (in hr)','showTitle':true});
              // this.ChartService.drawChart({'id':id,'canvasId':'otSurgeon','type':'bar','data':this.reportData['data']['by Surgeon']['data'],'label':this.reportData['data']['by Surgeon']['label'],'title':'Surgery count by Surgeon','showTitle':true});
              this.ChartService.drawChart({'id':id,'canvasId':'otOccupancy','type':'bar','data':this.reportData['data']['by Day']['data'],'label':this.reportData['data']['by Day']['label'],'title':'Avg.Occupancy by Day of week(hr)','showTitle':true});
              this.ChartService.drawChart({'id':id,'canvasId':'assetUtliz','type':'bar','data':this.reportData['data']['Asset Utliz']['data'],'label':this.reportData['data']['Asset Utliz']['label'],'title':'Asset Utilization(hr)','showTitle':true,'tempLabel':this.reportData['data']['Asset Utliz']['data_tm']});
              this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':7,'gutterSize':'0px'};
              this.reportData['tileInfo'] = [
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Patients','content':this.reportData['Total Patients']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total ER Utilization','content':this.reportData['Total ER Utilization']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Triage Time','content':this.reportData['Total Triage Time']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Radiology Time','content':this.reportData['Total Radiology Time'] },
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Max Utilized ER (by hr)','content':this.reportData['Max Utilized ER (by hr)']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Min Utilized ER (by hr)','content':this.reportData['Min Utilized ER (by hr)']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Most Utilized ER (by count)','content':this.reportData['Most Utilized ER (by count)']}];
              this.reportData['showCard'] = true; 
            } else{
              this.reportData['noRecords'] = true;
              this.reportData['loading'] = false;
            }
          });
        }
      } else if(id == 'ER-wait'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
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
              this.reportData['Total Patients'] = this.reportData['data']['Card']['Total Surgeries'];
              this.reportData['Total ER Waittime'] = this.reportData['data']['Card']['Total ER Waittime'];
              this.reportData['Total Triage Waittime'] = this.reportData['data']['Card']['Total PreOP Waittime'];
              this.reportData['Total Radiology Waittime'] = this.reportData['data']['Card']['Total PostOp Waittime'];
              this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':4,'gutterSize':'0px'};
              this.reportData['tileInfo'] = [
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Patients','content':this.reportData['Total Patients']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total ER Waittime','content':this.reportData['Total ER Waittime']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Triage Waittime','content':this.reportData['Total Triage Waittime']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Radiology Waittime','content':this.reportData['Total Radiology Waittime']}];
              this.reportData['showCard'] = true; 
              this.reportData['erwaitLocData'] = [this.reportData['data']['Total waittime by ER room']['data']['Count'], this.reportData['data']['Total waittime by ER room']['data']['Duration']];
              // this.reportData['erWaitSurgeryData'] = [this.reportData['data']['Total waittime by Surgery']['data']['Count'], this.reportData['data']['Total waittime by Surgery']['data']['Duration']];
              this.ChartService.drawChart({'id':id,'canvasId':'erwaitLoc','type':'grouped','data':this.reportData['erwaitLocData'],'label': this.reportData['data']['Total waittime by ER room']['label'],'title':'Total Waittime By Location','showTitle':true,'barLabel': ['No.of Patients','wait time(hrs)']});  
              // this.ChartService.drawChart({'id':id,'canvasId':'erWaitSurgery','type':'grouped','data':this.reportData['erWaitSurgeryData'],'label': this.reportData['data']['Total waittime by Surgery']['label'],'title':'Total Waittime By Surgery','showTitle':true,'barLabel': ['#of surgeries','wait time(hrs)']}); 
              this.waitSumLabel = this.reportData['data']['Total waittime by Surgery']['label'].length; 
            } else{
              this.reportData['noRecords'] = true;
              this.reportData['loading'] = false;
            }
          }); 
        }
      } else if(id == 'ER-daily'){
        this.validDate=this.validate(this.fromDate,this.toDate);
        if(!this.validDate){
          this.reportData['invalidDate'] = true;
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = true;
        }
        else{
          this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
          this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
            if (res.results.statusCode == 200 && res.results.data != null){
              this.reportData['loading'] = false;
              this.reportData['enablepdf'] = false;
              this.reportData['data'] = res.results;
              this.reportData['No.of.Surgeries'] = this.reportData['data']['card']['No.of.Surgeries'];
              this.reportData['ERLocations'] = this.reportData['data']['card']['ERLocations'];
              this.reportData['Surgeons'] = this.reportData['data']['card']['Surgeons'];
              this.reportData['AssetsUtlizied'] = this.reportData['data']['card']['AssetsUtlizied'];
              this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':4,'gutterSize':'0px'};
              this.reportData['tileInfo'] = [
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'No.of.Patient','content':this.reportData['No.of.Surgeries']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'ER Locations','content':this.reportData['ERLocations']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Doctors','content':this.reportData['Surgeons']},
              {'rowspan':1,'colspan':1,'showHeader':true,'header':'Assets Utlized','content':this.reportData['AssetsUtlizied']}];
              this.reportData['showCard'] = true;
              this.reportData['chartData'] = res.results.data['dataTable'];
              this.reportData['chartData'][0] = ["Location",
              "Duration",
              { role: 'style' },
              "Fromtime",
              "Totime"]
              for(let i=1;i<this.reportData['chartData'].length;i++){
                let tmpDate = new Date(this.reportData['chartData'][i][3]);
                this.reportData['chartData'][i][3] = tmpDate;
                let tmpDate1 = new Date(this.reportData['chartData'][i][4]);
                this.reportData['chartData'][i][4] = tmpDate1;
              }
              this.timelineChartData =  {
                chartType: 'Timeline',
                dataTable : this.reportData['chartData'],
                options: {'height': 650,
                          'width':1050
                        },
            }
            } else {
              this.reportData.noRecords = true;
              this.reportData.loading = false;
              this.reportData['enablepdf'] = false
            }
          });
        }
      }
      let selectedData  = this.reportList.filter(res=> res.link === id);
      this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate,'name':selectedData[0].name};
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
      let name = this.selected['name'];
      let transpose = false;
      if (this.reportData.length || this.reportData != null) {
          excelData =  this.reportData['Table'];    
          if(this.selected['selectedId'] == 'tat-all-rep-ot'){
              excelData =  this.reportData.fullexcelData;
          } else if(this.selected['selectedId'] == 'ER-Rep-new'){
              excelData=[];
              excelData[0] =  this.reportData['excelData'];
              for(let i=0;i<excelData[0][0].length;i++){
                delete excelData[0][0][i]['children']
                //delete excelData[0][0][i]['close']
              }
              for(let i=0;i<excelData[0][1].length;i++){
                delete excelData[0][1][i]['children']
              }
              excelData[1] = ['ER-Complex Utilisation summary','ER-Complex Utilisation details']
              this.getERReports('ER-Rep-new')
          } 
          this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
      } else {
          excelData = [];
      }
    }
    downloadPDF() {
      let pdfData : any;
      let chartImage = [];
      let name = this.selected['name'];
      let addInfo : any;
      let id = this.selected['selectedId'];
      if (this.reportData.length || this.reportData != null) {
        pdfData=this.reportData;
        if(this.selected['selectedId'] == 'ER-Rep-new'){
          chartImage=[document.getElementById('OTNu'),document.getElementById('OTU')];
        } else if(this.selected['selectedId'] == 'ER-utilz'){
          chartImage=[document.getElementById('otUtilizPercent'),document.getElementById('otOccupancy'),document.getElementById('assetUtliz'),document.getElementById('otRoomUtiliz'),document.getElementById('otWardUtiliz')];
          this.reportData['TableColumns'] = [];
          addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
        } else if(this.selected['selectedId'] == 'ER-wait'){
          chartImage=[document.getElementById('erwaitLoc')];
          this.reportData['TableColumns'] = [];
          addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
        } else if(this.selected['selectedId'] == 'ER-daily'){
          chartImage=[document.getElementById('otdaily')];
          this.reportData['TableColumns'] = [];
        }
        this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['fromDate'], id, chartImage,addInfo);
      } else {
        pdfData = [];
      }
    }
  fixClick() {
    console.log('')
  }    
}
