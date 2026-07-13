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
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder,} from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { UpdateWidgetModel } from '../configuration.model';
import { DatePipe } from '@angular/common';
import { CommonService, DashboardService, ChartjsService } from '../../../shared';
import { routerTransition } from '../../../router.animations';
import { ActivatedRoute } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-widget-management',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  animations: [routerTransition()],
  })
export class WidgetComponent implements OnInit {
  displayedColumns: string[] = ['ID','Name', 'Code', 'Model Id', 'Model Name', 'Widget Type', 'Is Active'];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  dataSource: MatTableDataSource<any>;
  tableData: any;
  public selectedRow: any = null;
  public roleId = localStorage.getItem('userlevel');

  loading = false;
  returnUrl: string;
 
  pageEvent: PageEvent;
  length: any;
  pageIndex: any;

  public pageStart = 0;
  public pageSize = 10;
  public maxHeight: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showActions: any = [];
  showAction1 = [
    { id: 'modify', value: 'Modify' },
  ];
  filterValue: null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public dashboardService: DashboardService, public dialog: MatDialog,private readonly route: ActivatedRoute) { }
  ngOnInit() {
    this.tableData = this.route.snapshot.data.widgets.results;
    const Columns = ['ID','name', 'code', 'pfModelId', 'pfModelName', 'widgetTypeName', 'isActive'];
    for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
        });
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
  }
  public getWidgetList(event?: PageEvent) {
    this.selectedName = null;
    this.dashboardService.getWidgetList(this.roleId).subscribe(res => {
      this.dataSource = new MatTableDataSource<any>(res.results)
      this.tableData = res.results;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['ID','name', 'code', 'pfModelId', 'pfModelName', 'widgetTypeName', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = [];
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getWidgetList();
  }

  rowClick(event) {
    this.showActions = [];
    if (this.selectedRow && this.selectedRow.id == event.id) {
      this.selectedRow = null;
      this.selectedName = null;
    } else {
      this.showActions = this.showAction1;
      this.selectedRow = event;
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'modify') {
      this.createWidget(this.selectedRow);
    } else {
      this.selectedName = null;
      this.refreshPage();
    }
  }

  createWidget(rowData) {
    let widgetTemplate: any = null;
    this.dashboardService.getWidgetTemplates(rowData.id).subscribe(res => {
      if (res.statusCode == 1) {
        widgetTemplate = res.results;
        const dialogRef = this.dialog.open(CreateWidgetComponent,
          {data: widgetTemplate, panelClass: ['small-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
          this.selectedRow = null;
          this.refreshPage();
        });
      }
    })
  }
}
@Component({
  selector: 'app-widget-management',
  templateUrl: './create-widget.component.html',
  styleUrls: ['./widget.component.scss'],
  animations: [routerTransition()],
  
})
export class CreateWidgetComponent implements OnInit {
  public widgetTemplate: any = null;
  public modelTemplate: any;
  public modelMapping: any;
  public modelOption: any;
  public widgetForm: FormGroup;
  public widgetDetails: any = {};
  public dataset = [];
  public chartColor = [];
  public chartLabels = [];
  public chartBackground = [];
  public options: any;
  public selectedIndex = 0;
  public chartUpdate = true;
  public status = [{name: 'Active', code: true},{name: 'Inactive', code: false}];
  public chartTypes = [];
  public modelTypes = [];
  public updateWidgetModel : UpdateWidgetModel;
  public showPreview = false;
  public isPreview = false;
  public isHelp = false;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public tableStyling = {};
  public styles = {
    'th' : '',
    'tr' : ''
  };
  @ViewChild('myTextArea') public textArea: ElementRef;
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  constructor(public form: FormBuilder, public thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog,
    public dashboardService: DashboardService, public ChartService: ChartjsService, public commonService : CommonService,
    public toastr: AppToastService,public datepipe: DatePipe) {
    this.buildForm();
  }
  ngOnInit() {
    this.getAppTerms();
    this.widgetTemplate = this.data[0];
    this.modelTemplate = this.widgetTemplate.widgetDetails.filter(res => res.identifyingType == 'template');
    this.modelMapping = this.widgetTemplate.widgetDetails.filter(res => res.identifyingType == 'model-mapping');
    this.modelOption = this.widgetTemplate.widgetDetails.filter(res => res.identifyingType == 'options')
    this.options = JSON.parse(this.modelOption[0].identifyingValue);
    this.getChartData(this.widgetTemplate, this.options);
  }
  getAppTerms(){
    this.commonService.getAppTerms('WidgetType').subscribe(res => {
      if(this.data[0].widgetTypeId == 'WT-BAR' || this.data[0].widgetTypeId == 'WT-HBAR'){
        this.chartTypes = res.results.filter(res => res.code == 'WT-BAR' || res.code == 'WT-HBAR')
      } else {
        this.chartTypes = res.results.filter(res => res.code == this.data[0].widgetTypeId)
      }
    })
    this.commonService.getAppTerms('ModelType').subscribe(res=> {
      this.modelTypes = res.results;
    })
  }
  getChartData(data, opt) {
    this.widgetDetails['show'] = false;
    let widgetId = data.id;
    let modelInput = null;
    if(data.modelInputParams){
      let widgetParam = [];
      let inputParam = data.modelInputParams.split(',');
      if(inputParam.length){
        for(let i=0; i < inputParam.length; i++){
          if(inputParam[i] == 'fid' || inputParam[i] == 'facility_id'){
            if(i == 0){
              widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
            } else{
              widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
            }
          } else if(inputParam[i] == 'fdt'){
            if(i == 0){
            widgetParam.push(inputParam[i] + '=' + this.selectedDate)
            } else{
              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate)
            }
          }else if(inputParam[i] == 'tdt'){
            if(i == 0){
            widgetParam.push(inputParam[i] + '=' + this.selectedDate)
            } else{
              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate)
            }
          } else if(inputParam[i].includes('=')){
            if(i == 0){
              widgetParam.push(inputParam[i])
            } else{
              widgetParam.push('&' + inputParam[i])
            }
          }
        }
        modelInput = widgetParam.toString();
        modelInput = modelInput.replace(/,&/g, '&');
      }
    }
    this.dashboardService.getDashboardWidgetData(widgetId, modelInput).subscribe(res => {
      if (res.statusCode == 1) {
        this.chartUpdate = false;
        let chartValue = res.results[widgetId]
        if(chartValue != null){
        if (data.widgetTypeId == 'WT-BAR' || data.widgetTypeId == 'WT-HBAR' || data.widgetTypeId == 'WT-PIE' || data.widgetTypeId == 'WT-LINE') {
          this.showPreview = true;
          this.isHelp = true;
         
          if (data.widgetTypeId == 'WT-BAR' || data.widgetTypeId == 'WT-HBAR') {
            for (let i = 0; i < chartValue.data.length; i++) {
              this.chartColor = chartValue.color;
              this.dataset.push({ label: chartValue.data[i].label, data: chartValue.data[i].data })
              if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length){
                  if(chartValue.options['colorOptions'][i] != undefined){
                    this.chartBackground.push(chartValue.options['colorOptions'][i])
                  } else if(chartValue.options['colorOptions'][i] == undefined){
                    this.chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' })
                  }
              } else {
                this.chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' })
              }
             
            }
            this.chartLabels = chartValue.labels;
            if(data.widgetTypeId == 'WT-BAR'){
              this.bindChartData('bar', this.dataset, chartValue.labels, null, this.chartBackground, opt)
            }else if(data.widgetTypeId == 'WT-HBAR'){
              this.bindChartData('horizontalBar', this.dataset, chartValue.labels, null, this.chartBackground, opt)
            }
          } else if (data.widgetTypeId == 'WT-LINE') {
            for (let i = 0; i < chartValue.data.length; i++) {
              this.chartColor = chartValue.color;
              this.dataset.push({ label: chartValue.data[i].label, data: chartValue.data[i].data, fill: false })
              if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length){
                  if(chartValue.options['colorOptions'][i] != undefined){
                    this.chartBackground.push(chartValue.options['colorOptions'][i])
                  } else if(chartValue.options['colorOptions'][i] == undefined){
                    this.chartBackground.push({ borderColor: this.commonService.getRandomColor()})
                  }
              } else {
                this.chartBackground.push({ borderColor: this.commonService.getRandomColor()})
              }
             
            }
            this.chartLabels = chartValue.labels;
            this.bindChartData('line', this.dataset, chartValue.labels, null, this.chartBackground, opt)
          } else if (data.widgetTypeId == 'WT-PIE') {
            this.dataset = chartValue.data;
            this.chartColor = chartValue.color;
            let pieBackgroundColor = [{backgroundColor: []}];
            if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'][0].backgroundColor.length){
            for(let i=0; i < this.dataset.length; i++){
              if(chartValue.options['colorOptions'][0].backgroundColor[i] != undefined){
                pieBackgroundColor[0].backgroundColor.push(chartValue.options['colorOptions'][0].backgroundColor[i])
              } else if(chartValue.options['colorOptions'][0].backgroundColor[i] == undefined){
                pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor())
              }
              }
            } else{              
              for(let i of  this.dataset){
                pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor())
              }
            }
            
            this.chartBackground = pieBackgroundColor;
            this.chartLabels = chartValue.labels;
            this.bindChartData('pie', this.dataset, chartValue.labels, 'Count', this.chartBackground, opt)
          }
        } else if(data.widgetTypeId == 'WT-CARD'){
          this.showPreview = true;
          let options = chartValue.options.options;
          this.widgetDetails['type'] = 'card';
          this.widgetDetails['show'] = true;
          this.widgetDetails['data'] = chartValue
          if(options.backgroundColor){
            this.widgetDetails['maxCol'] = options.col;
            if(options.icon == ''){
              this.widgetDetails['detail'] = [
                {'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : '', 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : data.code, 'title' : chartValue.widgetName, 'data' : {data: chartValue.data, label: chartValue.labels}}
              ];
            } else{
              this.widgetDetails['detail'] = [
                {'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : options.icon, 'iconWidth': options.iconWidth, 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : data.code, 'title' : chartValue.widgetName, 'data' : chartValue.data[0]}
              ];
            }
          } else{
            this.widgetDetails['maxCol'] = 3;
            this.widgetDetails['detail'] = [
              {'type' : 'text', 'col': 3, 'bg-color' : '#58edd7', 'color' : '#656968', 'icon' : '', 'fontSize': '25px', 'fontColor': '#4c4949', 'id' : data.code, 'title' : chartValue.widgetName, 'data' : {data: chartValue.data, label: chartValue.labels}}
            ];
          }
        } else if(data.widgetTypeId == 'WT-HDR'){
            this.showPreview = true;
            this.widgetDetails['type'] = 'header';
            this.widgetDetails['show'] = true;
            this.widgetDetails['data'] = chartValue;
            let options = chartValue.options.options;
            if(options.backgroundColor){
              this.widgetDetails['detail'] = [{
                'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : options.icon != '' ? options.icon : '', 'iconWidth': options.iconWidth, 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : data.code, 'title' : chartValue.widgetName
              }]
            }else{
              this.widgetDetails['detail'] = [{
                'bg-color': '#b1dafcc9', 'color' : '#656968', 'icon' : '','fontSize': '25px', 'fontColor': '#4c4949', 'id' : data.code, 'title' : chartValue.widgetName
              }]
            }
        } else if(data.widgetTypeId == 'WT-TABLE'){
          this.showPreview = true;
          this.widgetDetails['type'] = 'table';
          this.widgetDetails['show'] = true;
          this.widgetDetails['table'] = chartValue.data;
          if (chartValue.hasOwnProperty('labels')) {
            this.widgetDetails['tableColumns'] = chartValue.labels;
          } else {
            this.widgetDetails['tableColumns'] = chartValue.label;
          }
          if(chartValue.options.options){
            this.tableStyling = chartValue.options.options;
            if (chartValue.options.hasOwnProperty('styles')) {
              this.styles = chartValue.options.styles;
            }
          }
        }
      }
      }
    })

  }
  public buildForm() {
    let modelInput = this.data[0].widgetDetails.filter(res => res.identifyingType == 'model-mapping');
    this.widgetForm = this.form.group({
      code: [this.data[0].code ? this.data[0].code : null],
      widgetName: [this.data[0].name ? this.data[0].name : null],
      widgetType: [this.data[0].widgetTypeId ? this.data[0].widgetTypeId : null],
      isActive: [this.data[0].isActive ? this.data[0].isActive : null],
      modelId: [this.data[0].modelId ? this.data[0].modelId : null],
      modelName: [this.data[0].modelName ? this.data[0].modelName : null],
      targetDb: [this.data[0].modelTargetDb ? this.data[0].modelTargetDb : null],
      modelType: [this.data[0].modelTypeId ? this.data[0].modelTypeId : null],
      modelQueryString: [this.data[0].modelQueryString ? this.data[0].modelQueryString : null],
      modelUrl: [this.data[0].modelUrl ? this.data[0].modelUrl : null],
      inputParam: [this.data[0].modelInputParams ? this.data[0].modelInputParams : null],
      outputParam: [this.data[0].modelOutputParams ? this.data[0].modelOutputParams : null],
      modelMap: [modelInput[0].identifyingValue ? modelInput[0].identifyingValue : null],
    })
  }
  getEditorData(dataset, labels, backgroundColor, options, text, styles = {}) {
    
    let myJsObj = {};
    if(this.widgetDetails['type'] != 'table'){
      myJsObj['colorOptions'] = backgroundColor;
      myJsObj['options'] = options;
      myJsObj['text'] = text;
    } else if(this.widgetDetails['type'] == 'table'){
      myJsObj['options'] = options;
      myJsObj['text'] = text;
      myJsObj['styles'] = styles;
    }
    
    let str = JSON.stringify(myJsObj, undefined, 4);
    document.getElementById('myTextArea').innerHTML = str;
  }
  bindChartData(chartType, dataValue, labels, label, color, options) {
    this.widgetDetails['type'] = 'chart';
    this.widgetDetails['chartType'] = chartType;
    this.widgetDetails['labels'] = labels;
    this.widgetDetails['datasets'] = chartType != 'pie' ? dataValue : [{ label: label, data: dataValue }];
    this.widgetDetails['colors'] = color == null ? [{}] : color;
    if (options['colorOptions']) {
      this.widgetDetails['options'] = options['options'];
    } else {
      this.widgetDetails['options'] = options;
    }
    this.widgetDetails['show'] = true;
  }
  updateChart() {
    const chartConfig = this.chart.chart.config as ChartConfiguration;
    let updatedVal = document.getElementById('myTextArea')['value'];
    let value = JSON.parse(updatedVal);
    if(this.widgetDetails['type'] == 'chart'){
    if (chartConfig.type != 'pie' && value['colorOptions'] && value['colorOptions'].length) {
      for (let i = 0; i < this.chart.chart.config.data.datasets.length; i++) {
        if(value.colorOptions[i] != undefined){
          this.chart.chart.config.data.datasets[i].backgroundColor = value.colorOptions[i].backgroundColor;
          this.chart.chart.config.data.datasets[i].borderColor = value.colorOptions[i].borderColor;
        } else if(value.colorOptions[i] == undefined){
          this.chart.chart.config.data.datasets[i].backgroundColor = this.commonService.getRandomColor();
          this.chart.chart.config.data.datasets[i].borderColor = this.commonService.getRandomColor();
        }
      }
    } else if (chartConfig.type == 'pie' && value['colorOptions'] && value['colorOptions'][0].backgroundColor.length) {
      let pieBackgroundColor = [{backgroundColor: []}];
      for (let i = 0; i < this.chart.chart.config.data.datasets[0].data.length; i++) {
        if(value['colorOptions'][0].backgroundColor[i] != undefined){
          pieBackgroundColor[0].backgroundColor.push(value.colorOptions[0].backgroundColor[i])
        } else if(value['colorOptions'][0].backgroundColor[i] == undefined){
          pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor())
        }
      }
      this.chart.chart.config.data.datasets[0].backgroundColor = pieBackgroundColor[0].backgroundColor;
    } else {
      if(chartConfig.type == 'pie'){
        let pieBackgroundColor = [{backgroundColor: []}];
        for(let i of  this.chart.chart.config.data.datasets[0].data){
          pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor())
        }
        this.chart.chart.data.datasets[0].backgroundColor = pieBackgroundColor[0].backgroundColor;
      } else{
        for (const dataset of this.chart.chart.config.data.datasets) {
          dataset.backgroundColor = this.commonService.getRandomColor();
          dataset.borderColor = this.commonService.getRandomColor();
        }
      }
    }
    this.chart.chart.options = value['options'];
    this.chart.chart.update();
    } else if(this.widgetDetails['type'] == 'card'){
      let chartValue = this.widgetDetails['data'];
      this.widgetDetails['maxCol'] = value.options.col;
      if(value.options.icon == ''){
        this.widgetDetails['detail'] = [
          {'type' : 'text', 'col': value.options.col, 'bg-color' : value.options.backgroundColor, 'color' : value.options.color, 'icon' : '','fontSize': value.options.fontSize, 'fontColor': value.options.fontColor, 'id' : 'Asset Category', 'title' : chartValue.widgetName, 'data' : {data: chartValue.data, label: chartValue.labels}}
        ];
      } else{
        this.widgetDetails['detail'] = [
          {'type' : 'text', 'col': value.options.col, 'bg-color' : value.options.backgroundColor, 'color' : value.options.color, 'icon' : value.options.icon, 'iconWidth': value.options.iconWidth,'fontSize': value.options.fontSize, 'fontColor': value.options.fontColor, 'id' : 'Asset Category', 'title' : chartValue.widgetName, 'data' : chartValue.data[0]}
        ];
      }
    } else if(this.widgetDetails['type'] == 'header'){
      let chartValue = this.widgetDetails['data'];
      this.widgetDetails['detail'] = [{
        'bg-color' : value.options.backgroundColor, 'color' : value.options.color, 'icon' : value.options.icon != '' ? value.options.icon : '', 'iconWidth': value.options.iconWidth, 'fontSize': value.options.fontSize, 'fontColor': value.options.fontColor, 'id' : '', 'title' : chartValue.widgetName
      }]
    } else if(this.widgetDetails['type'] == 'table'){
      this.tableStyling = value['options'];
      if (value.hasOwnProperty('text')) {
        this.styles = value['styles'];
      }
    }
  }
  openPage(){
    window.open('https://www.chartjs.org/docs/latest/samples/legend/title.html');
  }
  onTabChanged(event) {
    if (event.index == 1) {
      this.selectedIndex = 1;
      if(this.widgetDetails['type'] != 'table'){
        if (this.options['colorOptions']) {
          if(this.options.hasOwnProperty('text')){
            this.getEditorData(this.dataset, this.chartLabels, this.chartBackground, this.options['options'], this.options['text'])
          }else{
          this.getEditorData(this.dataset, this.chartLabels, this.chartBackground, this.options['options'], '')
          }
        } else {
          if(this.options.hasOwnProperty('text')){
            this.getEditorData(this.dataset, this.chartLabels, this.chartBackground, this.options, this.options['text'])
          }else{
            this.getEditorData(this.dataset, this.chartLabels, this.chartBackground, this.options, '')
          }
        }
      } else if(this.widgetDetails['type'] == 'table'){
        let opt;
        let text = '';
        let styles = { 'th' : {}, 'tr' : {} };
        if(this.options['options']){
          if(this.options.hasOwnProperty('text')){
            opt = this.options['options']
            text = this.options['text']
          }else{
            opt = this.options['options']
          }
          if (this.options.hasOwnProperty('styles')) {
            styles = this.options['styles'];
          }

        } else {
         opt = {
          colName: "",
          colValue: null,
          rowValue: null,
          colColor: ""
        }
        }
        this.getEditorData(null, null, null, opt, text, styles)
      }
      this.isPreview = true
    } else {
      this.selectedIndex = 0;
    this.isPreview = false }
  }
  updateWidget(){
    this.updateWidgetModel = new UpdateWidgetModel(null,null,null,null,null,null,null,null,null,null,null);
    this.updateWidgetModel.configKeyId = this.widgetTemplate.modelConfigKeyId;
    this.updateWidgetModel.facilityId = localStorage.getItem(btoa('facilityId'));
    this.updateWidgetModel.id = this.widgetTemplate.modelId;
    this.updateWidgetModel.inputParams = this.widgetForm.controls['inputParam'].value;
    this.updateWidgetModel.isActive = this.widgetTemplate.modelIsActive;
    this.updateWidgetModel.modelTypeId = this.widgetForm.controls['modelType'].value;
    this.updateWidgetModel.name = this.widgetForm.controls['modelName'].value;
    this.updateWidgetModel.outputParams = this.widgetForm.controls['outputParam'].value;
    this.updateWidgetModel.queryString = this.widgetForm.controls['modelQueryString'].value;
    this.updateWidgetModel.targetDb = this.widgetForm.controls['targetDb'].value;
    this.updateWidgetModel.url = this.widgetForm.controls['modelUrl'].value;
    let modelData = {
      'facililtyId': localStorage.getItem(btoa('facilityId')),
      'id': this.modelMapping[0].id,
      'identifyingType': this.modelMapping[0].identifyingType,
      'identifyingValue': this.widgetForm.controls['modelMap'].value,
      'isActive': true,
      'pfWidgetId': this.widgetTemplate.id
    }
    let basicDetail = {
      'code': this.widgetForm.controls['code'].value,
      'id': this.widgetTemplate.id,
      'isActive': this.widgetTemplate.isActive,
      'name': this.widgetForm.controls['widgetName'].value,
      'pfModelId': this.widgetTemplate.modelId,
      'pfWidgetDetails': [{
        'facililtyId': localStorage.getItem(btoa('facilityId')),
        'id': this.modelMapping[0].id,
        'identifyingType': this.modelMapping[0].identifyingType,
        'identifyingValue': this.widgetForm.controls['modelMap'].value,
        'isActive': true,
        'pfWidgetId': this.widgetTemplate.id
      }],
      'widgetTypeId': this.widgetForm.controls['widgetType'].value
    }
    this.dashboardService.updateWidgetModelById(this.updateWidgetModel).subscribe(res => {
      if(res.statusCode == 1){
        this.toastr.success('Success', res.message);
        this.dashboardService.updateWidgetDetailById(modelData).subscribe(res => {
          if (res.statusCode == 1) {
            this.widgetForm.markAsPristine()
          }
        })
        this.dashboardService.saveWidgetDetailById(basicDetail).subscribe(res => {
        })
      }
    },error => {
      this.toastr.error('Error', `${error.error.message}`);
    })
  }
  saveWidget() {
    let updatedVal = document.getElementById('myTextArea')['value'];
    let value = JSON.parse(updatedVal);
    value = JSON.stringify(value)
    let jsonData = {
      'facililtyId': localStorage.getItem(btoa('facilityId')),
      'id': this.modelOption[0].id,
      'identifyingType': this.modelOption[0].identifyingType,
      'identifyingValue': value,
      'isActive': true,
      'pfWidgetId': this.widgetTemplate.id
    }
    this.dashboardService.updateWidgetDetailById(jsonData).subscribe(res => {
      if (res.statusCode == 1) {
        this.toastr.success('Success', res.message);
        this.thisDialogRef.close('confirm');
      }
    })
  }
  fixClick() {
  console.log('')
  }
}
