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
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
******************************************************************************/
import { Component, OnInit } from '@angular/core';
import { CommonService,PdfService,ExcelService,ChartService,ConfigurationService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-asset-report',
  templateUrl: './asset-report.component.html',
  styleUrls: ['./asset-report.component.scss']
})

export class AssetReportComponent implements OnInit {
  public reportForm: FormGroup;
  public date: any = new Date();
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public HCselected = 'asset-summary';
  public selected : any;
  public reportList : any;
  public reportData : any;
  public selectedReport: any = new FormControl();
  public Uid: any = new  FormControl();
  public Identifier: any = new FormControl();
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  today = new Date();
  validDate: any;
  public assetId: any = new FormControl(null);
  public frequency: any = new FormControl(null);
  public assetSearchList:any[];
  public frequencyList = [{code:'5min',value:'5'},{code:'15min',value:'15'},{code:'30min',value:'30'},{code:'45min',value:'45'},{code:'60min',value:'60'}];
  public selectedAsset: any = new FormControl(null);
  public assetList: any [] = [];
  public selectedIndex = 0;
  constructor(public datepipe: DatePipe, private readonly commonService: CommonService,public fb: FormBuilder,public configurationService: ConfigurationService, 
  public excelService: ExcelService, public pdfService: PdfService, public chartService : ChartService) {
    this.getReportList();
  }
  ngOnInit() {
    this.selectedReport.setValue(this.HCselected);
    this.getAssetReports(this.HCselected);
    this.getAssetList();
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
    this.reportList = []
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    // let submenusList =  menuItemsList ? this.commonService.findMenuByCode(menuItemsList[0].subMenus, "MN_Asset_Maintenance") : null;
    let submenusList1 = menuItemsList ? this.commonService.findMenuByCode(menuItemsList[0].subMenus, "MN_REAS") : null;
    let tempId = submenusList1['id'];
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
  getAssetReports(id) {
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')   
    this.reportData = {};
    this.reportData.noRecords = false;
    this.reportData.loading = false;
    this.validDate = true;
    this.reportData['showTable'] = false;
    this.reportData['showMissingTable'] = false;
    this.reportData['showMisplacedTable'] = false;
    this.reportData['showTransferTable'] = false;
    this.reportData['showGeofenceTable'] = false;
    this.reportData['showCard'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    this.reportData['invalidDate'] = false;
    this.reportData['nullIdentifier'] = false;
    this.reportData['prevselected'] = this.HCselected;
    if(id == 'asset-summary'){
      this.reportData['param'] ='/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        this.reportData['loading']=false;
        this.reportData['enablepdf']=true;
        if(res.results.statusCode == 200 && res.results.data != null)
         {
          this.reportData.assetCount = res.results.data.asset_count.data;
          this.reportData.pendingCalibrationDue = res.results.data.pending_colibration.data;
          this.reportData.pendingAmcDue = res.results.data.pending_amc.data;
          this.reportData.missingAsset = res.results.data['missing cnt'];
          this.reportData.misplacedAsset = res.results.data['misplace cnt'];
          this.reportData.transferedAsset = res.results.data['transfer cnt'];
          this.reportData.batteryStatus = res.results.data['Battery Status'].data;
          this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':6,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'No. of Asset','islist':false,'content':this.reportData['assetCount']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Pending Calibration Due','islist':false,'content':this.reportData.pendingCalibrationDue },
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Pending AMC Due','islist':false,'content':this.reportData.pendingAmcDue},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Missing Assets','islist':false,'content':this.reportData.missingAsset },
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Misplaced Assets','islist':false,'content':this.reportData.misplacedAsset},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Transferred Assets','islist':false,'content':this.reportData.transferedAsset}];
          this.reportData['showCard'] = true;
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetStatus','type':'grouped','data':res.results.data.asset_status.data,'label':res.results.data.asset_status.label,'title':'Asset Type','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetLoc','type':'bar','data':res.results.data['asset by loc']['count'],'label':res.results.data['asset by loc']['label'],'title':'Asset Location','showTitle':true,'barLabel': ['Count']});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetCalibrationDue','type':'bar','data':res.results.data.pending_colibration_monthly.data,'label':res.results.data.pending_colibration_monthly.label,'title':'Asset Pending Calibration - Quarterly','showTitle':true,'barLabel': ['Count']});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetAmcDue','type':'bar','data':res.results.data.pending_amc_monthly.data,'label':res.results.data.pending_amc_monthly.label,'title':'Asset AMC Due - Quarterly','showTitle':true,'barLabel': ['Count']});
          //No SONAR
            // this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetStatus','type':'pie','data':this.reportData['assetMovementByType'].data,'label': this.reportData['assetMovementByType'].label,'title':'Asset Movement By Type','showTitle':true,'barLabel': []});
            // this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetMovementByTypeAndPorter','type':'pie','data':this.reportData['assetMovementByTypeAndPorter'].data,'label': this.reportData['assetMovementByTypeAndPorter'].label,'title':'Asset Movement By Type - With Porter','showTitle':true,'barLabel': []});
            // this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetMovement','type':'grouped','data':[this.reportData['floorWiseAssetMovement'].all_pat,this.reportData['floorWiseAssetMovement'].porter],'label': this.reportData['floorWiseAssetMovement'].label,'title':'Movement Completed Floorwise - With Porter','showTitle':true,'barLabel': ['Total','With Porter']});
            // this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetHourlyMovement','type':'stacked','data':[this.reportData['HourlyAssetMovement'].data.IN,this.reportData['HourlyAssetMovement'].data.OUT],'label': this.reportData['HourlyAssetMovement'].label,'title':'Hourly Movement - With Porter','showTitle':true,'barLabel': ['In','Out']});
          this.reportData['Table'] = res.results.data['asset detail'];            
          this.reportData['TableColumns'] = [];
          this.reportData['missingTable'] = res.results.data['missing asset detail'];            
          this.reportData['missingTableCol'] = [];
          this.reportData['misplacedTable'] = res.results.data['mispalce asset detail'];            
          this.reportData['misplacedTableCol'] = [];
          this.reportData['transferTable'] = res.results.data['asset transfer detail'];            
          this.reportData['transferTableCol'] = [];
          this.reportData['geofenceTable'] = res.results.data['geofence'];            
          this.reportData['geofenceTableCol'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
            this.reportData['enableexcel'] = true;
          }
          if(this.reportData['missingTable'].length > 0){
            this.reportData['missingTableCol'] = Object.keys(this.reportData['missingTable'][0]);
            this.reportData['showMissingTable'] = true;
          }
          if(this.reportData['misplacedTable'].length > 0){
            this.reportData['misplacedTableCol'] = Object.keys(this.reportData['misplacedTable'][0]);
            this.reportData['showMisplacedTable'] = true;
          }
          if(this.reportData['transferTable'].length > 0){
            this.reportData['transferTableCol'] = Object.keys(this.reportData['transferTable'][0]);
            this.reportData['showTransferTable'] = true;
          }
          if(this.reportData['geofenceTable'].length > 0){
            this.reportData['geofenceTableCol'] = Object.keys(this.reportData['geofenceTable'][0]);
            this.reportData['showGeofenceTable'] = true;
          }
         }else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    }  else  if(id == 'asset-geofencevio'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res)
        this.reportData['loading']=false;
        this.reportData['enablepdf']=true;
        if(res.results.statusCode == 200 && res.results.data != null)
         {
            this.reportData['Table'] = res.results.data;
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetGeofenceviolation','type':'pie','data':res.results.chart.Data,'label':res.results.chart.Label,'title':'Geofence Violation Chart','showTitle':true,'barLabel': []});
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(res.results.data[0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }    
         }else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    } else  if(id == 'asset-misplaced'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res)
        this.reportData['loading']=false;
        this.reportData['enablepdf']=true;
        if(res.results.statusCode == 200 && res.results.data != null)
         {
            this.reportData['totalAssets'] = res.results.data.AssetCount[0].tot_assets;
            this.reportData['misplacedAssets'] = res.results.data.AssetCount[0].Misplaced_assets;
            for (let i = 0; i < res.results.data.tableData.length; i++) {
              res.results.data.tableData[i]["Last seen on"] = this.datepipe.transform(res.results.data.tableData[i]['Last seen on'], 'dd/MM/yyyy HH : mm : ss');
            }
            this.reportData['Table'] = res.results.data.tableData;
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetByDepartment','type':'bar','data':res.results.data.byDept.data,'label':res.results.data.byDept.label,'title':'Asset Misplaced - By Department','showTitle':true,'barLabel': ['Count']});
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetByType','type':'bar','data':res.results.data.byType.data,'label':res.results.data.byType.label,'title':'Asset Misplaced - By Type','showTitle':true,'barLabel': ['Count']});
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }    
         }else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    } else  if(id == 'asset-missing'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res)
        this.reportData['loading']=false;
        this.reportData['enablepdf']=true;
        if(res.results.statusCode == 200 && res.results.data != null)
         {
            this.reportData['totalAssets'] = res.results.data.AssetCount[0].tot_assets;
            this.reportData['missingAssets'] = res.results.data.AssetCount[0].missing_assets;
            for (let i = 0; i < res.results.data.tableData.length; i++) {
              res.results.data.tableData[i]["Last seen on"] = this.datepipe.transform(res.results.data.tableData[i]['Last seen on'], 'dd/MM//yyyy HH : mm : ss');
            }
            this.reportData['Table'] = res.results.data.tableData;
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetByDepartment','type':'bar','data':res.results.data.byDept.data,'label':res.results.data.byDept.label,'title':'Asset Missed - By Department','showTitle':true,'barLabel': ['Count']});
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetByType','type':'bar','data':res.results.data.byType.data,'label':res.results.data.byType.label,'title':'Asset Missed - By Type','showTitle':true,'barLabel': ['Count']});
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }    
         }else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    } else if(id == 'asset-transfer'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
      console.log(res)
      this.reportData['loading']=false;
      this.reportData['enablepdf']=true;
      if(res.results.statusCode == 200 && res.results.data != null)
        {
          this.reportData['excelData']=[];
          this.reportData['totalAssets']=res.results.data['Total Assets']['label'][0];
          this.reportData['assettransferWithinHospital']=res.results.data['Transfer Assets Count']['inside_hospital'][0];
          this.reportData['assettransferOutsideHospital']=res.results.data['Transfer Assets Count']['outside_hospital'][0];
           this.reportData['assetCountByLocation']=res.results.data['Count by Location'];
           this.reportData['assetCountByFacility']=res.results.data['Count by Facility'];
           this.reportData['assetTransferDetailsByLocation']=res.results.data['Details by Location'];
           this.reportData['assetTransferDetailsByFacility']=res.results.data['Details by Facility'];
           for(let i=0;i<this.reportData['assetTransferDetailsByLocation'].length;i++)
            {
              this.reportData['assetTransferDetailsByLocation'][i]['Start date']= this.datepipe.transform(this.reportData['assetTransferDetailsByLocation'][i]['Start date'], 'dd/MM/yyyy');
              this.reportData['assetTransferDetailsByLocation'][i]['End date']= this.datepipe.transform(this.reportData['assetTransferDetailsByLocation'][i]['End date'], 'dd/MM/yyyy');
            }
            for(let i=0;i<this.reportData['assetTransferDetailsByFacility'].length;i++)
            {
              this.reportData['assetTransferDetailsByFacility'][i]['Start date']= this.datepipe.transform(this.reportData['assetTransferDetailsByFacility'][i]['Start date'], 'dd/MM/yyyy');
              this.reportData['assetTransferDetailsByFacility'][i]['End date']= this.datepipe.transform(this.reportData['assetTransferDetailsByFacility'][i]['End date'], 'dd/MM/yyyy');
            }
           this.reportData['excelData'].push(this.reportData['assetTransferDetailsByLocation']);
           this.reportData['excelData'].push(this.reportData['assetTransferDetailsByFacility']);
           this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetTransferByLocation','type':'pie','data':this.reportData['assetCountByLocation'].data,'label':this.reportData['assetCountByLocation'].label,'title':'Asset Movement By Location','showTitle':true,'barLabel': []});
           this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'assetTransferByFacility','type':'pie','data':this.reportData.assetCountByFacility.data,'label':this.reportData.assetCountByFacility.label,'title':'Asset Movement By Facility','showTitle':true,'barLabel': []});
           this.reportData['Table'] = this.reportData['assetTransferDetailsByLocation'];
           this.reportData['TableColumns'] = [];
           if(this.reportData['Table'].length > 0){
             this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
             this.reportData['showTable'] = true;
             this.reportData['enableexcel'] = true;
           } 
           if(this.reportData.assetTransferDetailsByFacility.length > 0){
             this.reportData['secondTableColumns'] = Object.keys(this.reportData['assetTransferDetailsByFacility'][0]);
           }   
         } else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    } else if(id == 'asset-utilz'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
      console.log(res)
      this.reportData['loading']=false;
      this.reportData['enablepdf']=true;
      if(res.results.statusCode == 200 && res.results.data != null)
        {
           this.reportData['activeAssets']=res.results.data['Total Assets'].label[0];
           this.reportData['totalUtilization']=res.results.data['Total Utilization'].label[0];
           this.reportData['careArea']=res.results.data['Timespent Carearea'].label[0];
           this.reportData['nonCareArea']=res.results.data['Timespent NonCarearea'].label[0];
           this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'utilByAssetType','type':'bar','data':res.results.data['Count by Type'].data,'label':res.results.data['Count by Type'].label,'title':'Utilization By Asset Type','showTitle':true,'barLabel': ['Count']});
           this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'utilBylocation','type':'bar','data':res.results.data['Count by Location'].data,'label':res.results.data['Count by Location'].label,'title':'Utilization By Location','showTitle':true,'barLabel': ['Count']});
           this.reportData['Table'] = res.results.data['Asset Details'];
           this.reportData['TableColumns'] = [];
           if(this.reportData['Table'].length > 0){
             this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
             this.reportData['showTable'] = true;
             this.reportData['enableexcel'] = true;
           }   
         } else{
          this.reportData['noRecords']=true;
          this.reportData['loading']=false;
        }
      });
    }else if(id == 'asset-utiby-byid'){
      this.getAssetUti(this.assetId.value)
    } else if (id == 'asset-loc-history') {
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        //No SONAR
        // if(this.selectedAsset.value == null || this.selectedAsset.value == ''){
        //   this.reportData['nullIdentifier'] = true;
        // } else {
        let param;
        if(this.selectedAsset.value == null || this.selectedAsset.value == ''){
          param = '/fdt=' + this.fromDate + '&tdt='+ this.toDate;
        } else{
          param = '/uid=' + this.selectedAsset.value +'&fdt=' + this.fromDate + '&tdt='+ this.toDate;
        }
        this.reportData['param'] = param;
        this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {  
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData['loading'] = false;
            this.reportData['enablepdf'] = false;
            this.reportData['enableexcel'] = true;
            if(this.selectedAsset.value == null || this.selectedAsset.value == ''){
            this.reportData['assetId'] = null;
            this.reportData['assetName'] = null;
            } else{
              this.reportData['assetId'] = res.results.data['Location History'][0]['Serial Number'];
              this.reportData['assetName'] = res.results.data['Location History'][0]['Name'];
            }
            this.reportData['Table'] = res.results.data['Location History'];
            for(let i=0;i<this.reportData['Table'].length;i++){
              this.reportData['Table'][i]['Event Date'] = this.datepipe.transform(this.reportData['Table'][i]['Event Date'], 'dd/MM/yyyy')
              this.reportData['Table'][i]['From Date'] = this.datepipe.transform(this.reportData['Table'][i]['From Date'], 'dd/MM/yyyy HH : mm : ss')
              this.reportData['Table'][i]['To Date'] = this.datepipe.transform(this.reportData['Table'][i]['To Date'], 'dd/MM/yyyy HH : mm : ss')
            }
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              if(this.selectedAsset.value == null || this.selectedAsset.value == ''){
              this.reportData['TableColumns'] = ['Name','Serial Number','Event Date','From Date','To Date','Location Name','Floor Name'];
              } else{
              this.reportData['TableColumns'] = ['Event Date','From Date','To Date','Location Name','Floor Name'];
              }
              this.reportData['showTable'] = true;
            }
          } else {
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
          }
        });
      //No SONAR
      // }
      }
    } else if(id == 'sensor-utilz-id'){
      this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
      this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
      this.reportData['showChart'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&astid=' + this.assetId.value;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
      if (res.results.statusCode == 200) {
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = false;
        this.reportData['enableexcel'] = true;
        this.reportData['chartData'] = res.results.data.Chart.Data;
        this.reportData['chartLabel'] = res.results.data.Chart.Label;
        //No SONAR
        // this.reportData['chartLabel'] = this.reportData['chartLabel'].map(value => this.datepipe.transform(value, 'HH:mm:ss'));
        // this.reportData['chartStatus'] = res.results.data.Chart.Status;
        this.reportData['Table'] = res.results.data['Table Data'];
        this.reportData['TableColumns'] = [];
        if(this.reportData['Table'].length > 0){
          this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          this.reportData['showTable'] = true;
        }
        this.chartService.drawChart({'id':id,'canvasId':'assetTemp','type':'line','data':this.reportData['chartData'],'label':this.reportData['chartLabel'],'title':'Temperature Chart','barLabel':['Decibels']});
        this.reportData['showChart'] = true;
      } else {
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['showTable'] = false;
        this.reportData['noRecords'] = true;
        this.reportData['loading'] = false;
      }
      })
    } else if(id == 'sensor-water-leak'){
      this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
      this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
      this.reportData['showChart'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&astid=' + this.assetId.value + '&freq=' + this.frequency.value;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
      if (res.results.statusCode == 200) {
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = false;
        this.reportData['enableexcel'] = true;
        this.reportData['enablepdf'] = true;
        this.reportData['chartData'] = res.results.data.Chart.Data;
        this.reportData['chartLabel'] = res.results.data.Chart.Label;
        //No SONAR
        // this.reportData['chartLabel'] = this.reportData['chartLabel'].map(value => this.datepipe.transform(value, 'HH:mm:ss'));
        // this.reportData['chartStatus'] = res.results.data.Chart.Status;
        this.reportData['Table'] = res.results.data['Table Data'];
        this.reportData['TableColumns'] = [];
        if(this.reportData['Table'].length > 0){
          this.reportData['SensorTableColumns'] = Object.keys(this.reportData['Table'][0]);
          this.reportData['showTable'] = true;
        }
        this.chartService.drawChart({'id':id,'canvasId':'assetTemp','type':'line','data':this.reportData['chartData'],'label':this.reportData['chartLabel'],'title':'Temperature Chart','barLabel':['Decibels']});
        this.reportData['showChart'] = true;
      } else {
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['showTable'] = false;
        this.reportData['noRecords'] = true;
        this.reportData['loading'] = false;
      }
      })
    } else if(id == 'asset-demand-forecast'){
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.commonService.getReportData(id,this.reportData['param']).subscribe(res => { 
          this.reportData['loading']=false;
          if (res.results.statusCode == 200){
            this.reportData['Table'] = res.results.data['Table data'];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
            }
          }
        })
      }
    }
    let selectedData  = this.reportList.filter(res=> res.link === id);
    this.selected={'selectedId': id ,'fromDate': this.fromDate,'todate': this.toDate ,'name':selectedData[0].name,'uid': this.Uid.value,'assetId':this.assetId.value, 'frequency':this.frequency.value};
  }
  validate(sDate: string, eDate: string){
    if((sDate != null && eDate !=null) && (eDate < sDate) ){
      this.validDate = false;
      this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
    } else {
      this.validDate = true;
    }
    return this.validDate;
  }
  getAssetByName(val){
    let searchList = '';
    searchList += val.target.value;
    if (searchList.length >= 3) {
      this.commonService.searchAssetByName(val.target.value).subscribe(res => {
        if(res.results.length == 0){
        }
        this.assetList = res.results;
      });
    } else {
      this.selectedAsset.setValue(null)
      this.assetList = [];
    }
  }
  setAssetName(id){
    this.selectedAsset.setValue(id)
  }
  getAssetUti(id){
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData['showChart'] = false;
    this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&astid=' + id;
    this.commonService.getReportData('asset-utilz-id',this.reportData['param']).subscribe((res) => {
      if (res.results.statusCode == 200) {
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = false;
        this.reportData['enableexcel'] = true;
        this.reportData['enablepdf'] = true;
        this.reportData['excelData']=[];
        this.reportData['chartData'] = res.results.data.Chart.Data;
        this.reportData['chartLabel'] = res.results.data.Chart.Label;
        this.reportData['chartLabel'] = this.reportData['chartLabel'].map(value => this.datepipe.transform(value, 'HH:mm:ss'));
        this.reportData['chartStatus'] = res.results.data.Chart.Status;
        this.reportData['tableLog'] = res.results.data['Table Data'];
        this.reportData['tableSummary'] = res.results.data['Summary'];
        if(this.selectedIndex === 0){
          this.reportData['TableColumns'] = [];
          if(this.reportData['tableSummary'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['tableSummary'][0]);
          }
        } else if(this.selectedIndex === 1){
          this.reportData['TableColumns'] = [];
          if(this.reportData['tableLog'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['tableLog'][0]);
          }
        }
        this.reportData['excelData'].push(this.reportData['tableSummary'])
        this.reportData['excelData'].push(this.reportData['tableLog'])
        this.chartService.drawChart({'id':'asset-utilization','canvasId':'asset-uti-chart','type':'line','data':this.reportData['chartData'],'label':this.reportData['chartLabel'], 'status':this.reportData['chartStatus']});
        this.reportData['showChart'] = true;
      } else {
        this.reportData['enablepdf'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['showTable'] = false;
        this.reportData['noRecords'] = true;
        this.reportData['loading'] = false;
      }

    })
  }
  
  onTabChanged(event) {
    if(event.index === 0){
      this.selectedIndex = 0;
      this.reportData['TableColumns'] = [];
      if(this.reportData['tableSummary'].length > 0){
        this.reportData['TableColumns'] = Object.keys(this.reportData['tableSummary'][0]);
      }
    } else if(event.index === 1){
      this.selectedIndex = 1;
      this.reportData['TableColumns'] = [];
      if(this.reportData['tableLog'].length > 0){
        this.reportData['TableColumns'] = Object.keys(this.reportData['tableLog'][0]);
      }
    }
  }
  getAssetList(){
        this.configurationService.getAllAssociatedTags('Asset').subscribe(res => {
          this.assetSearchList = res.results;
        });
  }
  downloadExcel() {
    let excelData : any;
    let name = this.selected['name'];
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
      if(this.selected['selectedId'] ==  'asset-transfer') {
          let sheetnames =['Details By Location','Details By Facility']
          this.reportData['fullExcelDetails'] = [];
          this.reportData['fullExcelDetails'].push(this.reportData['excelData']);
          this.reportData['fullExcelDetails'].push(sheetnames);
          excelData = this.reportData.fullExcelDetails;
        }else if(this.selected['selectedId'] ==  'asset-utiby-byid') {
          name = "Asset Utilization By AssetId";
          excelData = []
          excelData[0] = this.reportData['excelData']
          excelData[1] = ['Summary', 'Log']
        }else if(this.selected['selectedId'] ==  'asset-summary'){
          name = "Asset Summary";
          excelData =  this.reportData['Table'];
          this.selected['fromDate'] = this.toDate;
        } else {
          excelData =  this.reportData['Table'];      
        }
      this.excelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } 
  }
  downloadPDF() {
    let pdfData : any;
    let addInfo : any;
    if (this.reportData.length || this.reportData != null) {
      let chartImage = [];
      let name: string;
      pdfData=this.reportData;
      if(this.selected['selectedId'] == 'asset-geofencevio'){
        name = 'Asset GeofenceViolation Report - '+this.selected['fromDate'];
        chartImage = [document.getElementById('assetGeofenceviolation')];
      } else if(this.selected['selectedId'] == 'asset-transfer'){
        name = 'Asset Transfer Report';
        this.reportData['TableColumns']=this.reportData['secondTableColumns'];
        chartImage = [document.getElementById('assetTransferByLocation'),document.getElementById('assetTransferByFacility')];
      } else if(this.selected['selectedId'] == 'asset-misplaced' || this.selected['selectedId'] == 'asset-missing'){
        if(this.selected['selectedId'] == 'asset-missing'){
          name = 'Asset Missing Report';
        } else{
          name = 'Asset Misplaced Report';
        }
        chartImage = [document.getElementById('assetByDepartment'),document.getElementById('assetByType')];
      } else if(this.selected['selectedId'] == 'asset-utilz'){
          name = 'Asset Utilization Report';
        chartImage = [document.getElementById('utilByAssetType'),document.getElementById('utilBylocation')];
      } else if(this.selected['selectedId'] == 'asset-utiby-byid'){
        name = "Asset Utilization By AssetId";
        chartImage = [document.getElementById('asset-uti-chart')]
      } else if(this.selected['selectedId'] == 'asset-summary'){
        name = 'Asset Summary Report';
        chartImage = [document.getElementById('assetStatus'),document.getElementById('assetLoc'),document.getElementById('assetCalibrationDue'),document.getElementById('assetAmcDue')];
        addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
      } else if(this.selected['selectedId'] == 'sensor-water-leak'){
        name = "Asset Sensor Report";
        addInfo = {"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']}
        chartImage = [document.getElementById('assetTemp')]
      } else {
        name = this.selected['selectedId'];
      }
      this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage,addInfo);
    } 
  }
    fixClick() {
    console.log('')
  }
}
