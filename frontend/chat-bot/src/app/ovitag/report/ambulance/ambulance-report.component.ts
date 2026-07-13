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
import {ExcelService, PdfService, CommonService, ChartService, ConfigurationService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-ambulance-report',
  templateUrl: './ambulance-report.component.html',
  styleUrls: ['./ambulance-report.component.scss']
})

export class ambulanceReportComponent implements OnInit {
  public reportForm: FormGroup;
  public date: any = new Date();
  public currentDate: any = new Date();
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public maxDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-ddThh:mm');
  public fromDateTime = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd 00:00');
  public toDateTime = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd 23:59');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public reportList : any;
  public reportData : any = [];
  public param : any;
  validDate: any;
  public HCselected = 'ambulance-summary';
  public selectedReport : any = new FormControl();
  public selected : any;
  public today = new Date();
  public locationlist: any[];
  public userList: any[] = [];
  public selectedUser = new FormControl(null);
  public selectedLocation : any = new FormControl(null)
  public selectedCategory  = new FormControl(null);
  public userName = new FormControl('');
  headercolor = '#3f586a';
  type: string = 'D';
  public ctx: any;
  public chartObj: any;
  public idleSummaryClosed=true;
  ActivityCategory:any;
  public selectedTypecode: any  = new FormControl();
  public activate_btn: any = [];
  constructor(public datepipe: DatePipe, public PdfService: PdfService,public dialog: MatDialog,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService,public configurationService: ConfigurationService, public ChartService: ChartService) {
      this.activate_btn = this.CommonService.getActivePermission('button');
    }
  ngOnInit() {
    this.getReportList();
    this.buildForm();
  }
  public buildForm() {
    this.reportForm = this.fb.group({
        fromDate: [this.fromDate ? this.fromDate : ''],
        toDate: [this.toDate ? this.toDate : ''],
        fromDateTime: [this.fromDateTime ? this.fromDateTime : ''],
        toDateTime: [this.toDateTime ? this.toDateTime : ''],
        });
    this.getReports(this.HCselected);
  }
getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    let porterSubmenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AMBRPT") : null;
    let porterId = porterSubmenusList['id'];
    let porterlist = permissions['dropdown'].filter(res=> res.parentId == porterId);
    this.reportList = porterlist;
     const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
      if (firstSeqReport) {
        this.HCselected = firstSeqReport.code;
      }
}
getReports(id) {
this.selectedReport.setValue(id)
this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
this.reportData = [];
this.reportData.noRecords = false;
this.reportData.loading = false;
this.reportData['showTable'] = false;
this.reportData['showCard'] = false;
this.reportData['enablepdf'] = false;
this.reportData['enableexcel'] = false;
this.reportData['invalidDate'] = false;
this.reportData['nullLocation'] = false;
this.reportData['prevselected'] = this.HCselected;
this.reportData['showPorterTable'] = false;
this.reportData['showPerformanceTable'] = false;

if(id == 'ambulance-summary'){
  this.validDate=this.validate(this.fromDate,this.toDate);
  if(!this.validDate){
    this.reportData['invalidDate'] = true;
    this.reportData['loading'] = false;
    this.reportData['noRecords'] = true;
  } else{
    this.param = '/fdt=' + this.fromDateTime + '&tdt=' + this.toDateTime;
    this.reportData.enablepdf = false;
    this.reportData['loading'] = true;
    this.CommonService.getReportData(id,this.param).subscribe(res => {
    this.reportData['loading'] = false;
    if (res.results.statusCode == 200 && res.results.data != null) {
        this.reportData['data'] = res.results.data;
        this.reportData['timeWisePorterMovement'] = [res.results.data['timewise']['data']['Requested'],res.results.data['timewise']['data']['Cancelled']];
        this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':9,'gutterSize':'0px'};
        this.reportData['tileInfo'] = [
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Ambulance','islist':false,'content':res.results.data['Card']['Total Porter']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Requests','islist':false,'content':res.results.data['Card']['Total Requests']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Completed','islist':false,'content':res.results.data['Card']['Total Completed']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Rejected','islist':false,'content':res.results.data['Card']['Rejected']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Cancellation','islist':false,'content':res.results.data['Card']['Total Cancellation']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'Planned','islist':false,'content':res.results.data['Card']['Planned']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT: Assigned To Arrive','islist':false,'content':res.results.data['Card']['Avg.time to attend']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT: Arrive To Completion','islist':false,'content':res.results.data['Card']['Avg.TAT']},
        {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT: Assigned To Complete','islist':false,'content':res.results.data['Card']['Avg.TAT CRtoCO:']}
      ];
        this.reportData['showCard'] = true;
        this.reportData['showLocTable'] = false;
        this.reportData['Table'] = res.results.data['Porter Detail'];
        this.reportData['performanceTable'] = res.results.data['Porter Individual Performance'];
        this.reportData['dateWiseSummary'] = res.results.data['Date wise summary'];
        this.reportData['datewiseTableCol'] =[];
        this.reportData['performanceTableCol'] = [];
        this.reportData['locTableColumns'] = [];
        this.reportData['TableColumns'] = [];
        this.reportData['excelData']=[];
        this.reportData['excelData'][0]= this.reportData['Table'];
        this.reportData['excelData'][1]= this.reportData['dateWiseSummary'];
        this.reportData['excelData'][2]= this.reportData['performanceTable'];
        if(this.reportData['Table'].length > 0){
          this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          this.reportData['showTable'] = true;
        }
        if(this.reportData['performanceTable'].length > 0){
          this.reportData['performanceTableCol'] = Object.keys(this.reportData['performanceTable'][0]);
          this.reportData['showPerformanceTable'] = true;
        }
        if(this.reportData['dateWiseSummary'].length > 0){
          this.reportData['datewiseTableCol'] = Object.keys(this.reportData['dateWiseSummary'][0]);
          this.reportData['showDatewiseTable'] = true;
        }
        this.ChartService.drawChart({'id':id,'canvasId':'otherTimewiseMovement','type':'grouped','data':this.reportData['timeWisePorterMovement'], 'label':res.results.data['timewise']['label'],'title':'Hourly Requests ','showTitle':true,'barLabel': ['Requested','Cancelled']});
        this.reportData.noRecords = false;
        this.reportData['enablepdf'] = true;
        this.reportData['enableexcel'] = true;
    }
    }, () => { this.reportData['loading'] = false; });
  }
} else if(id == 'ambulance-conn-devices' || id == 'ambulance-conndev-alert') {
  this.validDate=this.validate(this.fromDate,this.toDate);
  if(!this.validDate){
    this.reportData['invalidDate'] = true;
    this.reportData['loading'] = false;
    this.reportData['noRecords'] = true;
  } else{
    this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
    this.reportData['loading'] = true;
    this.CommonService.getReportData(id,this.param).subscribe(res => {
      this.reportData['loading'] = false;
      if (res.results.statusCode == 200){
        this.reportData['tableData'] = id == 'ambulance-conndev-alert' ? res.results.data["Ambulance connected devices"] : res.results.data['Ambulance connected devices'];
        this.reportData['tableView'] = true;
        this.reportData['enableexcel'] = true;
        this.reportData['excelData']=[];
        this.reportData['excelData'][0]= this.reportData['tableData'];
        this.reportData['excelData'][1]=[];
        for(let i=0;i<this.reportData['tableData'].length;i++){    
          for(let j=0;j<this.reportData['tableData'][i]['children'].length;j++){
            this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]));
          }
        }
      }
    }, () => { this.reportData['loading'] = false; });
  }
}
let selectedData  = this.reportList.filter(res=> res.link === id);
this.selected = {'selectedId' : id, 'fromDate': this.fromDate,'todate': this.toDate,'type': this.type,'fromDateTime':this.fromDateTime,'toDateTime':this.toDateTime, 'name':selectedData[0].name, 'selectedUser':this.selectedUser.value , 'selectedCat':this.selectedCategory.value };
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

inputChanged(){
  this.fromDate = this.datepipe.transform(this.reportForm.controls.fromDateTime.value, 'yyyy-MM-dd');
  this.toDate = this.datepipe.transform(this.reportForm.controls.toDateTime.value, 'yyyy-MM-dd');
  this.fromDateTime = this.datepipe.transform(this.reportForm.controls.fromDateTime.value, 'yyyy-MM-dd HH:mm');
  this.toDateTime = this.datepipe.transform(this.reportForm.controls.toDateTime.value, 'yyyy-MM-dd HH:mm');
}
downloadExcel() {
  let excelData : any;
  let name = this.selected['name'];
  let transpose = false;
  if(this.selected['selectedId'] == 'ambulance-summary'){
    excelData=[];
    excelData[0] = this.reportData['excelData'];
    excelData[1] = ['Request Summary','Datewise Summary','Individual Performance'];
  } else if(this.selected['selectedId'] == 'ambulance-conn-devices' || this.selected['selectedId'] == 'ambulance-conndev-alert'){
    excelData=[];
    excelData[0] =  this.reportData['excelData'];
    for(let i=0;i<excelData[0][0].length;i++){
      delete excelData[0][0][i]['children']
    }
    for(let i=0;i<excelData[0][1].length;i++){
      delete excelData[0][1][i]['children']
    }
    name = this.selected['selectedId'] == 'ambulance-conn-devices' ? 'Ambulance Connected Devices' : 'Ambulance Connected Device Alert';
    excelData[1] = this.selected['selectedId'] == 'ambulance-conn-devices' ? ['Ambulance','Connected Devices'] : ['Ambulance','Connected Devices Alert']; 
    this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
  } else {
      excelData = [];
  }
  this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
}
downloadPDF() {
let pdfData : any;
if (this.reportData.length || this.reportData != null) {
    let chartImage = [];
    let name = this.selected['name'];
    let addInfo : any;
    pdfData=this.reportData;
    if(this.selected['selectedId'] == 'ambulance-summary'){
      chartImage = [document.getElementById('otherTimewiseMovement')];
      addInfo ={"fromDate":this.selected['fromDateTime'],"toDate":this.selected['toDateTime']};
    }
  this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage,addInfo);
} else {
    pdfData = [];
}
}
  fixClick() {
    console.log('')
  }
}
