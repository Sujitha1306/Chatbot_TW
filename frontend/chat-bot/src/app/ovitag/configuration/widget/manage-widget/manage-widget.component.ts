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
import { DatePipe } from '@angular/common';
import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ChartjsService, CommonService, ConfigurationService, DashboardService } from '../../../../shared';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../../../app.module';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { Chart, registerables } from 'chart.js';         
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { LookupTermService } from '../../../../shared/lookup-term.service';
Chart.register(...registerables, ChartDataLabels);
@Component({
    selector: 'app-manage-widget',
    templateUrl: './manage-widget.component.html',
    styleUrls: ['./manage-widget.component.scss'],
    encapsulation: ViewEncapsulation.None,
    // providers: [
    //     { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    //     { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
    //   ],
})

export class ManageWidgetComponent implements OnInit {
    public matcher = new ErrorStateMatcherService();
    public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    public widgetDetail: any = null;
    public optionDetails: any = {
        'text' : '',
        'styles' : {'th' : {}, 'tr' : {}},
        'colorOptions' : [],
        'options' : {},
        'custom' : {}
    };
    public widgetData: any = {show : false};
    public modelList: any = [];
    public formList: any = [];
    public widgetTypes: any = [];
    public modelTypes: any = []
    public widgetForm: FormGroup;
    public status = [{name: 'Active', code: true}, {name: 'Inactive', code: false}];
    public targetDb = [{name: 'DB-CLICK-HOUSE', code: 'DB-CLICK-HOUSE'}, {name: 'DB-MYSQL', code: 'DB-MYSQL'}];
    public widgetOptions = [{name: 'Default Option', code: true}, {name: 'Widget Option', code: false}];
    public styles = {
        'th' : '',
        'tr' : ''
    };
    public active_btn: any = [];

    public selectedIndex = 0;
    public showPreview = false;
    public spinLoader: any;
    public subTypeList = [];
    public departmentForm : FormGroup;
    public departmentList: Array<any> = [];
    departmentEnabled = false;
    departmentListRes: any;
    factoryList: any;
    CategoryList: any;
    widgetTargetList = [{ code: 'web', value: 'Web' }, { code: 'mobile', value: 'Mobile' }];
    rawHtmlTemplate: string;
    chartPlugins = [ChartDataLabels]
    constructor(public form: FormBuilder, public thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
        public dialog: MatDialog, public dashboardService: DashboardService, public configurationService : ConfigurationService,
        public ChartService: ChartjsService, public commonService: CommonService, public toastr: AppToastService, public datepipe: DatePipe,
        private readonly sanitizer: DomSanitizer, private readonly lookupService: LookupTermService) {
    }
    ngOnInit(): void {
        this.active_btn = this.commonService.getActivePermission('button');
        this.getBasicData();
        this.buildForm();
        if (this.data) {
            this.getWidgetDetails();
        }
    }

    getBasicData() {
        this.dashboardService.getAllModals().subscribe(res => {
            if (res.statusCode === 1) {
                this.modelList = res.results;
                this.modelList = this.commonService.sortByKey(this.modelList, 'name');
            }
        });
        // this.configurationService.getFormTemplates().subscribe(res => {
        //     if (res.statusCode === 1) {
        //         this.formList = res.results;
        //     }
        // });

        this.lookupService.getAppTermsWrapper('WidgetType,FactoryType,WidgetCategory,WidgetSubtype').subscribe(res => {
            this.widgetTypes = res.WidgetType ?? [];
            this.CategoryList = res.WidgetCategory ?? [];
            this.factoryList = res.FactoryType ?? [];
            this.subTypeList = res.WidgetSubtype ?? [];
        });

        this.lookupService.getAppTermsWrapper('ModelType').subscribe(res => {
            this.modelTypes = res.ModelType ?? [];
        });
    }
    getWidgetDetails() {
        this.dashboardService.getWidgetTemplates(this.data.id).subscribe(res => {
            if (res.statusCode === 1) {
                this.widgetDetail = res.results[0];
                this.data.widgetSubtypeId = this.widgetDetail.widgetSubtypeId;
                this.getWidgetData();
                this.buildForm();
            }
        });
    }
    getmodelDetail(modelId) {
        if (modelId !== -1) {
            const filterModel = this.modelList.filter(res => res.id === modelId);
            this.updateWidgetModel(filterModel[0]);
        } else {
            this.updateWidgetModel(null);
        }
    }
    updateWidgetModel(data) {
        this.widgetForm.controls.modelName.setValue(data ? data['name'] : null);
        this.widgetForm.controls.modelInputParams.setValue(data ? data['inputParams'] : null);
        this.widgetForm.controls.modelOutputParams.setValue(data ? data['outputParams'] : null);
        this.widgetForm.controls.targetDb.setValue(data ? data['targetDb'] : null);
        this.widgetForm.controls.modelType.setValue(data ? data['modelTypeId'] : null);
        this.widgetForm.controls.modelUrl.setValue(data ? data['url'] : null);
        this.widgetForm.controls.modelQueryString.setValue(data ? data['queryString'] : null);
    }
    getWidgetData() {
        let params: any = [];
        this.widgetDetail['inputParams'] = this.widgetDetail['inputParams'] ? this.widgetDetail['inputParams'] : this.widgetDetail['modelInputParams'];
        if(this.widgetDetail['inputParams']){
                let widgetParam = [];
                let inputParam = this.widgetDetail['inputParams'].split(',');
                if(inputParam.length){
                  for(let i=0; i < inputParam.length; i++){
                    if(inputParam[i].includes('=')){
                        if(i == 0){
                          widgetParam.push(inputParam[i])
                        } else{
                          widgetParam.push('&' + inputParam[i])
                        }
                      } else if (inputParam[i] == 'fid' || inputParam[i] == 'facility_id') {
                          if (i == 0) {
                              widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
                          } else {
                              widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
                          }
                      } else if (inputParam[i] == 'fdt') {
                          if (i == 0) {
                              widgetParam.push(inputParam[i] + '=' + this.selectedDate)
                          } else {
                              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate)
                          }
                      } else if (inputParam[i] == 'tdt') {
                          if (i == 0) {
                              widgetParam.push(inputParam[i] + '=' + this.selectedDate)
                          } else {
                              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate)
                          }
                      } else if (inputParam[i] === 'uid') {
                          if (widgetParam.length === 0) {
                              widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('userId')));
                          } else {
                              widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('userId')));
                          }
                      } else if (inputParam[i] === 'role') {
                          if (widgetParam.length === 0) {
                              widgetParam.push(inputParam[i] + '=' + localStorage.getItem('userlevel'));
                          } else {
                              widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem('userlevel'));
                          }
                      } else if(inputParam[i] === 'logId'){
                        if (widgetParam.length === 0) {
                            widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('loginId')));
                        } else {
                            widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('loginId')));
                        }
                      }else if(inputParam[i] === 'deptId'){
                         if (widgetParam.length === 0) {
                            widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('departmentId')));
                        } else {
                            widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('departmentId')));
                        } 
                      }
                  }
                  params = widgetParam.toString();
                  params = params.replace(/,&/g, '&');
                }
        } else {
            params = ''
        }
        this.dashboardService.getDashboardWidgetDatav2(this.widgetDetail?.id, params).subscribe(res => {
            if (res.statusCode === 1 && res.results[this.widgetDetail.id] != null) {
                this.widgetData = res.results[this.widgetDetail.id];
                this.widgetData['show'] = false;
                if(this.widgetData.hasOwnProperty('options')) {
                    let widOption = this.widgetData['options'];
                    this.widgetData['options']['pagination'] = false;
                    this.widgetData['options']['pageSizeOptions'] = false;
                    this.widgetData['options']['enableExcel'] = widOption.hasOwnProperty('enableExcel') ? widOption.hasOwnProperty('enableExcel') : false;
                    this.widgetData['options']['filterBy'] = widOption.hasOwnProperty('filterBy') ? widOption.hasOwnProperty('filterBy') : {};

                    if(widOption.hasOwnProperty('styles')) {
                        this.widgetData['options']['styles'] = this.widgetData['options']['styles'];
                        // this.widgetData['options']['styles'] = {'th' : {}, 'tr' : {}}
                    }
                    if(widOption.hasOwnProperty('pagination')) {
                        this.widgetData['options']['pagination'] = widOption['pagination'];
                    }
                    if(widOption.hasOwnProperty('pageSizeOptions') && widOption['pageSizeOptions'].length) {
                        this.widgetData['options']['pageSizeOptions'] = widOption['pageSizeOptions'];
                    }
                }
                if(this.widgetData.hasOwnProperty('label')) {
                    this.widgetData['labels'] = this.widgetData['label']
                }
                // const charts = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'bubble', 'polarArea', 'radar', 'horizontalBar', 'horizontalLine'];
                // 'WT-BAR', 'Bar Chart', 'WidgetType', NULL, NULL
                // 'WT-CARD', 'Card', 'WidgetType', NULL, NULL
                // 'WT-HBAR', 'Horizontal Bar', 'WidgetType', NULL, NULL
                // 'WT-HDR', 'Header Chart', 'WidgetType', NULL, NULL
                // 'WT-LINE', 'Line Chart', 'WidgetType', NULL, NULL
                // 'WT-PIE', 'Pie Chart', 'WidgetType', NULL, NULL
                // 'WT-TABLE', 'Table Chart', 'WidgetType', NULL, NULL

                if (this.widgetDetail['widgetTypeId'] === 'WT-TABLE') {
                    this.widgetData['type'] = 'table';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-BAR') {
                    this.widgetData['type'] = 'bar';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-CARD') {
                    this.widgetData['type'] = 'card';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-HBAR') {
                    this.widgetData['type'] = 'horizontalBar';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-LINE') {
                    this.widgetData['type'] = 'line';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-PIE') {
                    this.widgetData['type'] = 'pie';
                    this.widgetData['data'] = [{ label: this.widgetData['labels'], data: this.widgetData['data'] }]
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-RADAR') {
                    this.widgetData['type'] = 'radar';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-DGHNT') {
                    this.widgetData['type'] = 'doughnut';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-PLRAR') {
                    this.widgetData['type'] = 'polarArea';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-BUBBLE') {
                    this.widgetData['type'] = 'bubble';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-SCATTER') {
                    this.widgetData['type'] = 'scatter';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-HDR') {
                    this.widgetData['type'] = 'header';
                } else if (this.widgetDetail['widgetTypeId'] === 'WT-CHART') {
                    if(this.widgetData.hasOwnProperty('datasets') && this.widgetData.datasets.length) {
                        this.widgetData['data'] = this.widgetData.datasets;
                        this.widgetData['type'] = this.widgetData.datasets[0]['type'];
                    }
                }
                // let widOption = JSON.parse(this.widgetDetail['widgetDetailsMap']['options']);
                let widOption = this.widgetDetail['options'];
                this.widgetData['colors'] = widOption['colorOptions'];
                if(this.widgetData.type != 'card') { 
                if(widOption.hasOwnProperty('colorMap')) {
                    let colorDetails = widOption.colorMap;
                    for (let labelKey of Object.keys(colorDetails)) {
                      let labelIndex = this.widgetData.labels.indexOf(labelKey);
                      console.log(colorDetails[labelKey]);
                      this.widgetData['colors'][0]['backgroundColor'][labelIndex] = colorDetails[labelKey];
                      this.widgetData['colors'][0]['borderColor'][labelIndex] = colorDetails[labelKey];
                    }
                }
                }
                if(this.widgetData['data'] && this.widgetData['data'].length && (this.widgetData.hasOwnProperty('colors') && this.widgetData.colors)) {
                    for(let i in this.widgetData['data']) {
                      if(this.widgetData['data'][i] && this.widgetData['colors'].length && this.widgetData['colors'][i]) {
                        this.widgetData['data'][i]['backgroundColor'] = this.widgetData['colors'][i]['backgroundColor'];
                        this.widgetData['data'][i]['borderColor'] = this.widgetData['colors'][i]['borderColor'];  
                      }
                    }
                }
                this.updateStyle();
                this.widgetData['show'] = true;
                this.widgetOptionUpdate()
            }
        });
    }
    getWidgetTemplate(code) {
        if(!this.data) {
            this.dashboardService.getWidgetTemplatesByCode(code).subscribe(res => {
                if (res.statusCode === 1) {
                    this.widgetForm.controls.modelMapping.setValue(JSON.stringify(res.results[0].modelMapping));
                    this.widgetForm.controls.template.setValue(JSON.stringify(res.results[0].template));
                    this.widgetForm.controls.widgetOption.setValue(JSON.stringify(res.results[0].options));
                    this.widgetForm.controls.modelMapping.updateValueAndValidity();
                    this.widgetForm.controls.template.updateValueAndValidity();
                    this.widgetForm.controls.widgetOption.updateValueAndValidity();
                }
            });
        }
    }
    widgetOptionUpdate() {      
        if(this.widgetData.type == 'table') {
            if(this.widgetData['data'].length && this.widgetData['options'].hasOwnProperty('filterBy') && this.widgetData['options']['filterBy'].hasOwnProperty('enabled') ) {
                let tableData = this.widgetData['data']
                this.widgetData['options']['filterBy']['option'] = [...new Set(tableData.map(val => val[this.widgetData['options']['filterBy']['key']]))];
            }
        }
        if(this.widgetData['type'] == 'card') {
            const cardTitle = this.widgetData.options?.text || '';

            if (this.widgetDetail.modelMapping?.repeatable) {
                const loopKeys = (this.widgetDetail.modelMapping?.loopKey || '')
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k);

                if (!this.rawHtmlTemplate && typeof this.widgetData['content'] === 'string') {
                    this.rawHtmlTemplate = this.widgetData['content'];
                }
                let rawHtml = this.rawHtmlTemplate;

                if (loopKeys.length > 0) {
                    loopKeys.forEach(loopKey => {
                        const loopBlock = this.extractFullDiv(rawHtml, loopKey);
                        if (loopBlock) {
                            let repeated = '';

                            const loopData = this.widgetData['data'][loopKey] || this.widgetData['data'] || [];

                            loopData.forEach((item: any) => {
                                const keysInTemplate = loopBlock.block.match(/\$\{(\w+)\}/g)?.map(k => k.replace(/\$\{|\}/g, '')) || [];
                                const hasMatchingKey = Object.keys(item).some(key => keysInTemplate.includes(key));
                                if (!hasMatchingKey) return;
                                let card = loopBlock.block;
                                Object.keys(item).forEach(key => {
                                    card = card.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), item[key]);
                                });
                                repeated += card;
                            });

                            rawHtml = rawHtml.slice(0, loopBlock.start) + `${repeated}` + rawHtml.slice(loopBlock.end);
                        }
                    });
                } else {
                    let combinedHtml = ''
                    const hasTitle = cardTitle?.trim();
                    if(hasTitle){
                    combinedHtml = `<div style='display:flex; flex-wrap:wrap; gap:16px;margin-left:12px'><h3 style="width: 100%;">${cardTitle}</h3>`;
                    }
                    (this.widgetData['data'] || []).forEach((item: any) => {
                        let cardHtml = rawHtml;
                        Object.keys(item).forEach(key => {
                            cardHtml = cardHtml.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), item[key]);
                        });
                        combinedHtml += cardHtml;
                    });
                    rawHtml = `<div style='display:flex; flex-wrap:wrap; gap:16px;'>${combinedHtml}</div>`;
                }
                this.widgetData['content'] = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
            } else {
                if (this.widgetData.hasOwnProperty('content') || this.widgetData['options'].hasOwnProperty('content')) {
                    let content : SafeHtml;
                    let templateContent = this.widgetData.hasOwnProperty('content') ? this.widgetData['content'] : null;
                    if(templateContent == null) {
                        templateContent = this.widgetData.options.hasOwnProperty('content') ? this.widgetData.options['content'] : null;
                    }
                    content = this.sanitizer.bypassSecurityTrustHtml(templateContent);
                    this.widgetData['content'] = content;
                } else {
                    this.widgetData['cardStyle'] = this.widgetData.options.style;
                }
            if(this.widgetData['options'].hasOwnProperty('content') == false) { 
                    let options = this.widgetData.options.options;
                    if (this.widgetData.options.hasOwnProperty('text') && this.widgetData.options['text'] !== '') {
                        this.widgetData.widgetName = this.widgetData.options['text'];
                    }
            // this.widgetDetails['data'] = chartValue
            if(options.backgroundColor){
                        this.widgetData['maxCol'] = options.col;
                if(options.icon == ''){
                            this.widgetData['detail'] = [
                    {'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : '', 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : this.widgetDetail.code, 'title' : this.widgetData.widgetName, 'data' : {data: this.widgetData.data, label: this.widgetData.labels}}
                            ];
                } else{
                            this.widgetData['detail'] = [
                    {'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : options.icon, 'iconWidth': options.iconWidth, 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : this.widgetData.code, 'title' : this.widgetData.widgetName, 'data' : this.widgetData.data[0]}
                            ];
                        }
            } else{
                        this.widgetData['maxCol'] = 3;
                        this.widgetData['detail'] = [
                {'type' : 'text', 'col': 3, 'bg-color' : '#58edd7', 'color' : '#656968', 'icon' : '', 'fontSize': '25px', 'fontColor': '#4c4949', 'id' : this.widgetDetail.code, 'title' : this.widgetData.widgetName, 'data' : {data: this.widgetData.data, label: this.widgetData.labels}}
                        ];
                    }
                }
            }
        }
         else if(this.widgetData['type'] == 'header'){
            let options = this.widgetData.options.options;
            if(options.backgroundColor){
            this.widgetData['detail'] = [{
                'bg-color' : options.backgroundColor, 'color' : options.color, 'icon' : options.icon != '' ? options.icon : '', 'iconWidth': options.iconWidth, 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : this.widgetDetail.code, 'title' : this.widgetData.widgetName
            }]
            }else{
            this.widgetData['detail'] = [{
                'bg-color': '#b1dafcc9', 'color' : '#656968', 'icon' : '','fontSize': '25px', 'fontColor': '#4c4949', 'id' : this.widgetDetail.code, 'title' : this.widgetData.widgetName
            }]
            }
        }
    }
    updateWidget() {
        const optionValue = JSON.parse(this.widgetForm.controls.widgetOption.value);
        this.widgetData['show'] = false;
        this.widgetData['colors'] = optionValue['colorOptions'];
        if(this.widgetData.type != 'card') {
        if(optionValue.hasOwnProperty('colorMap')) {
            let colorDetails = optionValue.colorMap;
            for (let labelKey of Object.keys(colorDetails)) {
            let labelIndex = this.widgetData.labels.indexOf(labelKey);
            console.log(colorDetails[labelKey]);
            this.widgetData['colors'][0]['backgroundColor'][labelIndex] = colorDetails[labelKey];
            this.widgetData['colors'][0]['borderColor'][labelIndex] = colorDetails[labelKey];
            }
        }
        if(this.widgetData['data'] && this.widgetData['data'].length) {
            for(let i in this.widgetData['data']) {
              if(this.widgetData['data'][i]) {
                this.widgetData['data'][i]['backgroundColor'] = this.widgetData['colors'][i]['backgroundColor'];
                this.widgetData['data'][i]['borderColor'] = this.widgetData['colors'][i]['borderColor'];  
              }
            }
        }
        }
        this.widgetData['options'] = optionValue;
        this.widgetOptionUpdate();
        this.updateStyle();
        this.widgetData['show'] = true;

    }


    extractFullDiv(template: string, loopKey: string): { block: string, start: number, end: number } | null {
        const startRegex = new RegExp(`<div[^>]+id=['"]${loopKey}['"][^>]*>`, 'i');
        const startMatch = template.match(startRegex);
        if (!startMatch) return null;

        const startIndex = startMatch.index!;
        let openCount = 0;
        let i = startIndex;

        while (i < template.length) {
            if (template.slice(i).startsWith('<div')) {
                openCount++;
            } else if (template.slice(i).startsWith('</div>')) {
                openCount--;
                if (openCount === 0) {
                    const endIndex = i + 6; 
                    return {
                        block: template.slice(startIndex, endIndex),
                        start: startIndex,
                        end: endIndex
                    };
                }
            }
            i++;
        }

        return null;
    }

    updateStyle() {
        if(this.widgetData.type == 'card') {
            if(this.widgetData['options'].hasOwnProperty('colorMap')) {
                if(this.widgetData['options'].hasOwnProperty('style') && this.widgetData['options'].style.hasOwnProperty('con-label')) {
                    if(this.widgetData.data.length && this.widgetData['options'].colorMap.hasOwnProperty(this.widgetData.data[0])) {
                        this.widgetData['options']['style']['con-label']['color'] = this.widgetData['options'].colorMap[this.widgetData.data[0]]
                    }
                }
            }
            if(this.widgetData['options'].hasOwnProperty('bgColorMap')) {
                if(this.widgetData['options'].hasOwnProperty('style') && this.widgetData['options'].style.hasOwnProperty('content')) {
                    if(this.widgetData.data.length && this.widgetData['options'].bgColorMap.hasOwnProperty(this.widgetData.data[0])) {
                        this.widgetData['options']['style']['content']['background'] = this.widgetData['options'].bgColorMap[this.widgetData.data[0]]                                
                    }
                }
            }
            if(this.widgetData['options'].hasOwnProperty('iconColorMap')) {
                if(this.widgetData['options'].hasOwnProperty('style') && this.widgetData['options'].style.hasOwnProperty('con-inner-icon')) {
                    if(this.widgetData.data.length && this.widgetData['options'].iconColorMap.hasOwnProperty(this.widgetData.data[0])) {
                        this.widgetData['options']['style']['con-inner-icon']['color'] = this.widgetData['options'].iconColorMap[this.widgetData.data[0]]
                    }
                }
            }                    
        }
    }
    buildForm() {
        let template = {};
        let widOption = null;
        if (this.widgetDetail) {
            template = this.widgetDetail.template
            widOption = this.widgetDetail['options'];
            if (this.commonService.isJsonString(widOption)) {
                this.optionDetails = JSON.parse(widOption);
            } else {
                this.optionDetails = widOption ? widOption : {};
            }
        }
        this.widgetForm = this.form.group({
            widgetTypeId        : [this.widgetDetail ? this.widgetDetail.widgetTypeId : null],
            code                : [this.widgetDetail ? this.widgetDetail.code : null],
            name                : [this.widgetDetail ? this.widgetDetail.name : null],
            isActive            : [this.widgetDetail ? this.widgetDetail.isActive : true],
            useDefaultOption    : [this.widgetDetail && this.widgetDetail.useDefaultOption ? this.widgetDetail.useDefaultOption : false],
            inputParam          : [this.widgetDetail ? this.widgetDetail.inputParams : null],
            modelId             : [this.widgetDetail ? Number(this.widgetDetail.modelId) : null],
            pfWidgetFormId      : [this.widgetDetail ? this.widgetDetail.pfWidgetFormId : null],
            modelName           : [this.widgetDetail ? this.widgetDetail.modelName : null],
            modelInputParams    : [this.widgetDetail ? this.widgetDetail.modelInputParams : null],
            modelOutputParams   : [this.widgetDetail ? this.widgetDetail.modelOutputParams : null],
            targetDb            : [this.widgetDetail ? this.widgetDetail.modelTargetDb : 'DB-MYSQL'],
            modelType           : [this.widgetDetail ? this.widgetDetail.modelTypeId : null],
            modelUrl            : [this.widgetDetail ? this.widgetDetail.modelUrl : null],
            modelQueryString    : [this.widgetDetail ? this.widgetDetail.modelQueryString : null],
            template            : [this.widgetDetail ? JSON.stringify(this.widgetDetail.template) : null],
            modelMapping        : [this.widgetDetail ? JSON.stringify(this.widgetDetail.modelMapping) : null],
            widgetOption        : [JSON.stringify(this.optionDetails, undefined, 4)],
            widgetSubtypeId     : [this.data ? this.data.widgetSubtypeId : null],
            departmentLinks     : [this.widgetDetail?this.widgetDetail.departmentLinks:null],
            widgetCategoryId    : [this.data ? this.data.widgetCategoryId : null],
            factoryTypeId       : [this.data ? this.data.factoryTypeId : 'FT-GL'],
            target              : [this.data ? this.data.target : 'web'],
        }, { validator: this.customValidate });
        this.departmentForm = this.form.group({
            departmentType: this.form.array([])
          });
          const departCrtl = <FormArray>this.departmentForm.controls['departmentType'];
          if(this.widgetDetail){
            if(this.widgetDetail.departmentLinks){
              this.widgetDetail.departmentLinks.forEach(element => {
                if(element.isActive){
                  departCrtl.push(this.addDepartList(element));
                }
              });
            }
          }
          if(departCrtl.length == 0){
            this.departmentForm = this.form.group({
              departmentType: this.form.array([this.addDepartList()])
            })
          }
    }
    addDepartForm(){
        const control = <FormArray>this.departmentForm.controls['departmentType'];
        control.push(this.addDepartList());
      }
      addDepartList(element?){
        let departName = null;
        if(element){
          departName = element.departmentId;
        }
        return this.form.group({
          id:[element ? element.id : null],
          departmentId : [element? element.departmentName : null,[Validators.required]],
          departmentName: [departName],
          startDate : [element? this.datepipe.transform(element.startDate, 'yyyy-MM-dd') : null],
          endDate : [element ? this.datepipe.transform(element.endDate, 'yyyy-MM-dd') : null],
          isActive: [element ? element.isActive : true]
        })
      }
      getDepartmentList(id) {
        if (id) {
          const department = this as any as { id: string, name: string }[]
          const departmentId = department.find(obj => obj.id === id);
          if(departmentId){
            return departmentId.name
          }else {
            return '';
          }
        } else {
          return '';
        }
      }
      searchDepartmentDetails(event) {
        if (event.text.length >= 2) {
          if (event.toHit === true) {
            this.commonService.getAllDepartments(event.text).subscribe(res => {
              this.departmentListRes = res.results;
              this.departmentList = this.departmentListRes;
              this.departmentEnabled = true;
            });
          } else {
            this.departmentList = this.departmentListRes;
            this.departmentEnabled = true;
          }
        } else {
          this.departmentList = [];
          this.departmentEnabled = false;
        }
      }
      removeDepartDetails(index:number){
        const control = <FormArray>this.departmentForm.controls['departmentType'];
        let removeDepartDetail = control.at(index).value;
        if(removeDepartDetail['id'] == null){
          control.removeAt(index);
        } else{
          removeDepartDetail['isActive'] = false;
          control.at(index).setValue(removeDepartDetail);
        }
        this.departmentForm.markAsDirty();
      }
    tabClick(event) {
        this.selectedIndex = event.index;
    }
    onTabChanged(event) {
    }
    customValidate(g: FormGroup) {
        let error = null;
        if (g.get('widgetOption').value != null && g.get('widgetOption').value !== '') {
            let optionValue = g.get('widgetOption').value;
            try {
                optionValue = JSON.parse(optionValue);

            } catch (e) {
                error = g.controls['widgetOption'].setErrors({ invalid: true });
            }
        }
        return error;
    }
    saveAsWidget(){
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass:['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirmation', message: 'Do you want to create a copy of this widget?',
            buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1, formTempNameEnable: true, formTempName:this.widgetForm.controls['name'].value
          }
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result.hasOwnProperty('formTempName')){
              this.widgetForm.controls['name'].setValue(result['formTempName']);
              this.widgetForm.controls['code'].setValue(null);
              this.data = null;
              this.widgetDetail = null;
              this.saveWidget();
            }
        });
    }
    saveWidget() {
        let modelMap = [];
        let defaultOption = null;
        let widgetOption = null;
        let options = null;
        
        if (this.data) {
            defaultOption = this.widgetDetail['defaultOptions'];
            options = JSON.parse(this.widgetForm.controls.widgetOption.value);
            // modelMap = JSON.parse(this.widgetForm.controls.modelMap.value);
            // widgetOption = this.widgetDetail['options'];
            // modelMap = this.widgetDetail.widgetDetails.filter(res => res.identifyingType === 'model-mapping');
            // widgetOption = this.widgetDetail.widgetDetails.filter(res => res.identifyingType === 'options');
            
            if (this.widgetForm.controls.useDefaultOption.value ) {
                options['options'] = defaultOption['options'];
            }
        }
        let postData = {
            id                  : this.widgetDetail ? this.widgetDetail.id : null,
            code                : this.widgetForm.controls.code.value,
            name                : this.widgetForm.controls.name.value,
            inputParams         : this.widgetForm.controls.inputParam.value,
            widgetTypeId        : this.widgetForm.controls.widgetTypeId.value,
            useDefaultOption    : this.widgetForm.controls.useDefaultOption.value,
            modelMapping        : this.widgetForm.controls.modelMapping.value,
            template            : this.widgetForm.controls.template.value,
            pfModelId           : this.widgetForm.controls.modelId.value,
            pfWidgetFormId      : this.widgetForm.controls.pfWidgetFormId.value,
            isActive            : this.widgetForm.controls.isActive.value,
            widgetCategoryId    : this.widgetForm.controls.widgetCategoryId.value,
            factoryTypeId       : this.widgetForm.controls.factoryTypeId.value,
            target              : this.widgetForm.controls.target.value,
            widgetSubtypeId     : this.widgetForm.controls.widgetSubtypeId.value
        };
        let template = this.widgetForm.controls.template.value;
        if(this.widgetForm.controls.template.value != null) {
            try {
                template = JSON.parse(this.widgetForm.controls.template.value);
            } catch (e) {
                this.toastr.error('Warning', 'Invalid Template JSON');
            }
            if('datasets' in template) {
                let type = this.subTypeList.filter(val => val.code == this.widgetForm.controls.widgetSubtypeId.value)
                if(type.length && !type[0]['value'].includes('Multi') ) {
                    let subTypeName = type[0]['value'].charAt(0).toLowerCase() + type[0]['value'].slice(1);
                    this.widgetData['type'] = subTypeName;
                    for(let i in template['datasets']){
                        if(template['datasets'][i]['type'].includes('>')) {
                            template['datasets'][i]['type'] = template['datasets'][i]['type']
                        }else if (!template['datasets'][i]['type']){
                            template['datasets'][i]['type'] = subTypeName
                        }
                    }
                }
            }
        }
        postData['modelMapping'] = JSON.parse(this.widgetForm.controls.modelMapping.value)
        postData['template'] = template
        postData['options'] = JSON.parse(this.widgetForm.controls.widgetOption.value)
        // postData['pfWidgetDetails'] = [
        //     {
        //       facililtyId         : localStorage.getItem(btoa('facilityId')),
        //       id                  : modelMap.length ? modelMap[0]['id'] : null,
        //       identifyingType     : 'model-mapping',
        //       identifyingValue    : modelMapValue,
        //       isActive            : true,
        //       pfWidgetId          : this.widgetDetail ? this.widgetDetail.id : null
        //     }
        // ]
        if (this.data) {
            postData['options'] = options
            // postData['pfWidgetDetails'].push({
            //       facililtyId         : localStorage.getItem(btoa('facilityId')),
            //       id                  : widgetOption.length ? widgetOption[0]['id'] : null,
            //       identifyingType     : 'options',
            //       identifyingValue    : JSON.stringify(options),
            //       isActive            : true,
            //       pfWidgetId          : this.widgetDetail ? this.widgetDetail.id : null
            // });
        }
        postData['departmentLinks'] = this.departmentForm.controls['departmentType'].value;
        postData['departmentLinks'].forEach(item =>{
          if(item['departmentId'] && typeof item['departmentId'] === 'string'){
            item['departmentId'] = item['departmentName']
          } else {
            item['departmentId'] = item['departmentId']
          }
          item['startDate'] = this.datepipe.transform(item['startDate'], "yyyy-MM-dd HH:mm:ss");
          item['endDate'] = this.datepipe.transform(item['endDate'], "yyyy-MM-dd HH:mm:ss");
          item['qualifierTypeId'] = "QLF-ASG";
          item['isActive'] = item['isActive'];
        })
        postData['departmentLinks'] = postData['departmentLinks'].filter(res => res.departmentId !== null);
        this.saveModelAndWidget(postData);
    }
    saveModelAndWidget(postData) {
        const modelData = {
            'id': postData['pfModelId'] != -1 ? postData['pfModelId'] : null,
            'name': this.widgetForm.controls.modelName.value,
            'modelTypeId': this.widgetForm.controls.modelType.value,
            'targetDb': this.widgetForm.controls.targetDb.value,
            'inputParams': this.widgetForm.controls.modelInputParams.value,
            'outputParams': this.widgetForm.controls.modelOutputParams.value,
            'queryString': this.widgetForm.controls.modelQueryString.value,
            'url': this.widgetForm.controls.modelUrl.value,
            "configKeyId": null,
            'isActive': true
        };
        if(postData['pfModelId'] != null) {
            if (postData['pfModelId'] == -1) {
            this.dashboardService.saveNewModel(modelData).subscribe(res => {
                if (res.statusCode === 1) {
                    this.toastr.success('Success', res.message);
                    this.getBasicData();
                    if(this.data && this.data.id) {
                        postData['pfModelId'] = res.results.id;
                        this.modifyWidget(postData)
                    } else {
                        postData['pfModelId'] = res.results.id;
                        this.addWidget(postData)
                    }
                    console.log(res.results);
                } else {
                    this.toastr.warning('Warning', res.message);
                }
            });
            } else {
                let modelFilter = this.modelList.filter(val => val.id == modelData.id)
                modelFilter = modelFilter.length ? modelFilter[0] : null;
                if(modelFilter &&  (modelFilter.inputParams != this.widgetForm.controls.modelInputParams.value || modelFilter.modelTypeId != this.widgetForm.controls.modelType.value
                    || modelFilter.name != this.widgetForm.controls.modelName.value || modelFilter.outputParams != this.widgetForm.controls.modelOutputParams.value
                    || modelFilter.queryString != this.widgetForm.controls.modelQueryString.value || modelFilter.targetDb != this.widgetForm.controls.targetDb.value 
                    || modelFilter.url != this.widgetForm.controls.modelUrl.value) ) {
                        this.dashboardService.updateWidgetModelById(modelData).subscribe(res => {
                            if (res.statusCode === 1) {
                                this.toastr.success('Success', res.message);
                                this.getBasicData();
                                if(this.data && this.data.id) {
                                    postData['pfModelId'] = res.results.id;
                                    this.modifyWidget(postData)
                                } else {
                                    postData['pfModelId'] = res.results.id;
                                    this.addWidget(postData)
                                }
                            } else {
                                this.toastr.warning('Warning', res.message);
                            }
                        });
                } else {
                    if(this.data && this.data.id) {
                        this.modifyWidget(postData)
                    } else {
                        this.addWidget(postData)        
                    }
                }
            }
        } else {
            this.addWidget(postData)        
        }
    } 
    addWidget(postData) {
        this.dashboardService.saveNewWidget(postData).subscribe(res => {
            this.spinLoader = true;
            if (res.statusCode === 1) {
                this.toastr.success('Success', res.message,);
                this.data = res.results;
                // this.getWidgetDetails();
            } else {
                this.toastr.warning('Warning', res.message,);
            }
            this.spinLoader = false;
            this.thisDialogRef.close('confirm');
        });
    }
    modifyWidget(postData) {
        this.dashboardService.saveWidgetDetailById(postData).subscribe(res => {
            this.spinLoader = true;
            if (res.statusCode === 1) {
                this.toastr.success('Success', res.message,);
                this.data = res.results;
                // this.getWidgetDetails();
            } else {
                this.toastr.warning('Warning', res.message,);
            }
            this.spinLoader = false;
            this.thisDialogRef.close('confirm');
        });
    }
  fixClick() {
    console.log('')
    }
}
