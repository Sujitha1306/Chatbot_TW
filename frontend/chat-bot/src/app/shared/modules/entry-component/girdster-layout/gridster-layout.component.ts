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

import { DatePipe } from "@angular/common";
import { Component, ElementRef, Input, OnInit, Renderer2, SimpleChanges, ViewChild,  ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { CompactType, GridsterConfig } from "angular-gridster2";
import { ModelWidgets } from "../../../../ovitag/dashboard/dashboard-emp/dashboard-emp.component";
import { ChartjsService, CommonService, DashboardService, WorkflowService, LayoutExcelService, LayoutPdfService, ExcelService } from "../../../services";
import { DashboardWidgetComponent } from "../dashboard-widget/dashboard-widget.component";
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { ConfirmDialogComponent } from "../layout-save/layout-save.component";
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';         
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);
@Component({
  selector: 'app-gridster-layout',
  templateUrl: './gridster-layout.component.html',
  styleUrls: ['./gridster-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GridsterLayoutComponent implements OnInit {
  @ViewChild('toggleButton') toggleButton: ElementRef;
  @ViewChild('widgets') widgets: ElementRef;
  @ViewChild('setting') setting: ElementRef;

  @Input() dashId: any;
  @Input() resourceCode: any = null;
  @Input() dashData: any;
  @Input() type: any;
  @Input() inputAction: any;
  public pdfConfigSelected: any ='default';
  public preresourceCode = null;
  public dashboardDetails: any = {};
  public floorId;
  public floorView = false;
  public today = this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public formTemplateValue: any;
  public showLoadingSpinner = false;
  customerLogo: any;
  customerId = localStorage.getItem('customerId');
  imageData: any = '/assets/Alert/common_icons/new-logo.png';
  chartPlugins = [ChartDataLabels]

  // Gridster configurations
  public options: GridsterConfig;
  public layout = [];
  public clayout = [];
  public defaultLayout = null;
  public isLayoutChanged = false;
  public userId = localStorage.getItem(btoa('userId'));
  public roleId = localStorage.getItem('userlevel');
  public facilityId = localStorage.getItem(btoa('facilityId'));
  public dashboardId = null;
  public screenLock = true;
  public active_btn: any = [];
  public maxHeight = 500;
  public isOpen = false;
  public isOptionOpen = false;
  public isOption: any = null;
  public isUpdateLayout = false;
  public preResponse = null;
  public isAutoRefresh = false;
  public autoInterval = null;
  public dashboardName = 'Dashboard';
  public currentDate: any = new Date();
  public fromDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public resultJson: any = null;
  public tempTable: any = [];
  public tableColumns: any = [];
  public tableName: any = [];
  public tempChart: any = [];
  public gridsterConfig: any;
  deptList: any = [];
  rawHtmlTemplate: any;
  excelSheetOrder: any;
  pdfConfig = {
  header: {
    enabled: true,
    content: `
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; font-family:Arial, Helvetica, sans-serif;">
        
        <!-- Logo -->
        <div style="flex:0 0 auto;">
          <img src="{{logo}}" style="height:30px; object-fit:contain;" />
        </div>

        <!-- Center Content -->
        <div style="flex:1; text-align:center; line-height:1.2;">
          <div style="font-size:10px; font-weight:600;">
            {{customerName}}
          </div>
          <div style="font-size:8px; color:#555;">
            {{region}}
          </div>
        </div>

        <!-- Date -->
        <div style="flex:0 0 auto; font-size:11px; color:#444; text-align:right; min-width:90px; white-space:nowrap;">
          {{date}}
        </div>

      </div>
    `
  },
  footer: {
    enabled: true,
    content: `
      <div style="text-align:center; font-size:10px; font-family:Arial, Helvetica, sans-serif;">
        Branch of Ebrahim M. Almana & Brothers Co.
        <br />
        P.O Box 311, Al-Khobar 31952
      </div>
    `
  }
};
  selectedRoutine: any;
  paramjson:any ;
  constructor(private readonly renderer: Renderer2, public dashboardService: DashboardService, public datepipe: DatePipe,
    private readonly commonService: CommonService, public ChartService: ChartjsService, public layoutExcelService: LayoutExcelService, public excelService: ExcelService,
    public router: Router, private readonly snackbar: MatSnackBar, public dialog: MatDialog, public workflowService: WorkflowService, public layoutPdfService: LayoutPdfService,
    private readonly sanitizer: DomSanitizer) {
    this.active_btn = this.commonService.getActivePermission('button');
    this.maxHeight = window.innerHeight - 60;
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.isOption === 'widgets') {
        if (!this.widgets.nativeElement['innerText'].includes(e.target['innerText']) && e.target['innerText'] !== 'widgets') {
          this.isOption = null;
          this.isOptionOpen = false;
        }
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.inputAction != undefined) {
       if(this.inputAction?.excelSheetOrder){
          this.excelSheetOrder = this.inputAction?.excelSheetOrder
      }
      if(this.inputAction?.paramJson){
        this.paramjson = this.inputAction?.paramJson
      }
      if(this.inputAction?.selectedRoutine) {
        this.selectedRoutine =  this.inputAction?.selectedRoutine
      }
      if (this.inputAction?.type === 'pdf') {
        this.downloadPDF();
      }
      if (this.inputAction?.type === 'excel') {
        this.downloadExcel();
      }
      if (this.inputAction?.type === 'getInsights' || this.inputAction?.type === 'refresh') {
        this.showLoadingSpinner = true;
        this.tempTable = [];
        this.tableName = [];
        this.tableColumns = [];
        if (this.inputAction.hasOwnProperty('dashData')) {
          let layout = this.inputAction.dashData.layouts;
          this.bindLayout(layout);
        }
      }
    }
  }
  ngOnInit() {
    if (this.type == 'popup') {
      this.isOpen = true;
    }
    this.checkMetaData();
    let userId = localStorage.getItem(btoa('userId'));
    if(userId){
        this.commonService.getUserDepartmentLink(userId).subscribe(res => {
            if(res.statusCode == 1){
                this.deptList = res.results
            } 
        });
    }
       this.commonService.getConfigFile('pdf-config').subscribe(res => {
        if (res.results) {
           this.pdfConfig = res.results.contentObject;
        }
      });
  }
  checkMetaData() {
    this.gridsterConfiguration(this.screenLock);
    this.dashboardDetails = {};
    this.clayout = [];
    this.layout = [];
    if (this.dashData) {
      this.dashboardDetails['update'] = true;
      this.preResponse = this.dashData;
      this.defaultLayout = JSON.stringify(this.dashData.layouts);
      this.dashboardId = this.dashData.dashboardId;
      this.bindLayout(this.dashData.layouts);
    } else if (this.dashId) {
      this.getDashboardbyId(this.dashId, this.resourceCode);
    } else {
      this.preresourceCode = this.resourceCode;
      this.checkUserPreference();
    }
  }
  checkUserPreference() {
    const roleId = localStorage.getItem('userlevel');
    const userId = localStorage.getItem(btoa('userId'));
    this.commonService.getPreference(userId, roleId).subscribe(res => {
      this.commonService.userPreference = res.results;
      const preference = res.results;
      this.getDashboardLayout(this.resourceCode);
      if (preference != null && preference.hasOwnProperty('layoutAutoRefresh')) {
        let layoutRefresh = preference.layoutAutoRefresh.value;
      }
    });
  }
  getGridsterConfig() {
    this.commonService.getConfigFile('gridster-config').subscribe((res) => {
      if(res.statusCode === 1){
        this.gridsterConfig = JSON.parse(res.results.contentObject);
      }
    });
  }
  getUserPreference(key = 'dashboard', value = this.dashboardId) {
    const preference = this.commonService.userPreference;
    if (key == 'dashboard' && this.resourceCode) {
      key = 'layout_' + this.resourceCode;
    }
    const postData = {
      'key': key,
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value': value
    };
    if (preference != null && value) {
      if (preference.hasOwnProperty(key)) {
        if (preference[key].value !== value) {
          const id = preference[key].id;
          this.commonService.updateUserPreference(id, postData).subscribe(res => {
            this.commonService.userPreference = res.results;
          });
        }
      } else {
        this.commonService.saveUserPreference(postData).subscribe(res => {
          this.commonService.userPreference = res.results;
        });
      }
    }
  }
  getDashboardbyId(dashId, resourceCode?: any) {
    this.dashboardDetails['update'] = true;
    const userId = localStorage.getItem(btoa('userId'));
    this.dashboardService.getDashboardbyIds(dashId, userId, resourceCode).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results[0];
        this.preResponse['layouts'].sort((a, b) => {
          if (a.y === b.y) {
            return a.x - b.x; 
          } else {
            return a.y - b.y; 
          }
        });
        this.dashboardName = res.results[0]?.dashboardName;
        this.tempTable = [];
        this.tableName = [];
        this.tableColumns = [];
        const input = JSON.parse(this.preResponse?.configValue);
        if(input && input.hasOwnProperty('pdfConfig')){
          this.pdfConfigSelected = input['pdfConfig']['selected'];
        }
        this.gridsterConfiguration(this.screenLock);
        this.defaultLayout = JSON.stringify(res.results[0].layouts);
        this.dashboardId = res.results[0].dashboardId;
        this.bindLayout(res.results[0].layouts);
      } else {
        this.openSnackbar(res.message, 'warning');
      }
    });
  }

  getDashboardLayout(resourceCode = null) {
    this.dashboardDetails['update'] = true;
    this.dashboardService.getCurrentDashboard(this.userId, this.roleId, resourceCode).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results;
        this.preResponse['layouts'].sort((a, b) => {
          if (a.y === b.y) {
            return a.x - b.x; 
          } else {
            return a.y - b.y; 
          }
        });
        this.dashboardName = res.results?.dashboardName;
        this.tempTable = [];
        this.tableName = [];
        this.tableColumns = [];
        const input = JSON.parse(this.preResponse?.configValue);
        if(input.hasOwnProperty('pdfConfig')){
          this.pdfConfigSelected = input['pdfConfig']['selected'];
        }
        this.excelSheetOrder = input['dynamicHeader']['excelSheetOrder']
        this.gridsterConfiguration(this.screenLock);
        this.defaultLayout = JSON.stringify(res.results.layouts);
        this.dashboardId = res.results.dashboardId;
        this.bindLayout(res.results.layouts);
        this.getUserPreference();
      } else {
        if (res.statusCode === 0) {
          this.getLayoutList();
        } else {
          this.openSnackbar(res.message, 'warning');
        }
      }
    });
  }
  getLayoutList() {
    this.dashboardService.getDashboardDetailsList(this.userId).subscribe(res => {
      if (res.statusCode === 1) {
        let layoutList = res.results;
        if (this.resourceCode) {
          layoutList = layoutList.filter(val => val.linkedResourceCode == this.resourceCode);
          if (layoutList.length) {
            this.dashboardId = layoutList[0].id;
            this.getDashboardbyId(this.dashboardId);
            this.getUserPreference();
          } else {
            this.openSnackbar('Layout is empty.', 'warning');
          }
        }
      }
    });
  }
  bindLayout(layout) {
    this.tempChart = [];
    for (let i = 0; i < layout.length; i++) {
      if (layout[i].widgetTypeId === 'WT-FORM') {
        let temp_lay = layout.splice(i, 1);
        layout.unshift(temp_lay[0]);
      }
    }
    if (this.facilityId === localStorage.getItem(btoa('facilityId'))) {
      this.isLayoutChanged = false;
      if (this.defaultLayout !== JSON.stringify(layout)) {
        if (!this.isUpdateLayout) {
          this.isLayoutChanged = true;
        } else {
          this.isLayoutChanged = false;
        }
      }
      this.layout = [];
      this.clayout = [];
      for (let i = 0; i < layout.length; i++) {
        try {
          this.layout.push(layout[i]);
          if (layout[i].isActive) {
            if (layout[i].code !== 'WD_DBAS' && layout[i].code !== 'WD_DBAST') {
              this.clayout.push(layout[i]);
              if (layout[i].code === 'WD_DBFP' || layout[i].code === 'WD_DBALERT' || layout[i].widgetTypeId === 'WT-FORM') {
                if (layout[i].widgetTypeId === 'WT-FORM' && this.dashboardDetails.hasOwnProperty(layout[i].code)) {
                  this.dashboardDetails[layout[i].code]['count'] = Number(this.dashboardDetails[layout[i].code]['count']) + 1;
                  continue
                }
                this.dashboardDetails[layout[i].code] = { 'show': true, 'count': 0 };
                continue;
              }
              if (this.dashboardDetails['update']) {
                if (layout[i].widgetTypeId === 'WT-FORM') {
                  this.dashboardDetails[layout[i].code]['show'] = true;
                } else {
                  this.dashboardDetails[layout[i].code] = { 'show': false,'loading':true };
                }
              }
            }
          }
        } catch (e) {
          console.log(layout[i].code + 'widget not found');
          console.log(e);
        }
      }
      layout = layout.filter(res => ['WD_DBAS', 'WD_DBAST', 'WD_DBPWCT', 'WD_DBLUZ', 'WD_DBHP', 'WD_DBPATSUM', 'WD_DBEMPSDS'].indexOf(res.code) === -1);
      let modelLayout = new Map<string, ModelWidgets>();
      for (let i = 0; i < layout.length; i++) {
        if (layout[i].widgetTypeId !== "WT-FORM" && layout[i].isActive && (layout[i].modelTypeId == "MT-QRY" || layout[i].modelTypeId == "MT-RPT")) {
          if (!modelLayout.has(layout[i].modelId)) {
            modelLayout.set(layout[i].modelId, { widgetIds: layout[i].widgetId, layouts: new Array(layout[i]) });

          }
          else {
            modelLayout.get(layout[i].modelId).widgetIds = modelLayout.get(layout[i].modelId).widgetIds + "," + layout[i].widgetId
            modelLayout.get(layout[i].modelId).layouts.push(layout[i])
          }
        } else if (layout[i].isActive && layout[i].widgetTypeId == "WT-FORM" && this.dashboardDetails[layout[i].code]['count'] == 0) {
          modelLayout.set(layout[i].widgetId, { widgetIds: layout[i].widgetId, layouts: new Array(layout[i]) });
        } else if (layout[i].isActive && layout[i].widgetTypeId == "WT-CHART") {
          modelLayout.set(layout[i].widgetId, { widgetIds: layout[i].widgetId, layouts: new Array(layout[i]) });
        }
      }
      modelLayout.forEach((value: ModelWidgets, key: string) => {
        this.getDynamicChartData(value);
      });

      if (this.isUpdateLayout) {
        this.saveWidgets(this.layout, true);
      }
    } else {
      this.facilityId = localStorage.getItem(btoa('facilityId'));
      this.checkUserPreference();
    }
  }
  refreshLayout() {
    if (this.isLayoutChanged) {
      this.dashboardDetails['update'] = true;
      this.bindLayout(JSON.parse(this.defaultLayout));
    } else {
      this.dashboardDetails['update'] = true;
      this.bindLayout(this.layout);
    }
  }
  autoRefresh(value) {
    this.isAutoRefresh = value;

    if (this.isAutoRefresh) {
      this.autoInterval = setInterval((val) => this.refreshLayout(), environment.base_value.layout_autorefresh_time);
    } else {
      clearInterval(this.autoInterval);
    }
    if (typeof (value) == 'boolean') {
      value = value.toString();
    }
    this.getUserPreference('layoutAutoRefresh', value);
  }
  updateLayout(gridster, preLayout, type) {
    const layout = [];
    const grid = gridster.gridster.grid;

    for (const i in grid) {
      if (i != null) {
        layout.push(grid[i].item);
      }
    }

    preLayout = JSON.parse(this.defaultLayout);
    preLayout = JSON.stringify(preLayout.filter(res => res.isActive));
    this.isLayoutChanged = false;
    if (preLayout !== JSON.stringify(layout)) {
      if (!this.isUpdateLayout) {
        this.isLayoutChanged = true;
      } else {
        this.isLayoutChanged = false;
      }
    }
    this.layout = layout;
  }
  editWidget() {
    const data = this.preResponse;
    data.layouts = this.layout;
    const dialogRef = this.dialog.open(DashboardWidgetComponent, {
      data: data, panelClass: 'custom-widget-popup-container', disableClose: true
    });
    dialogRef.componentInstance.widgetShow.subscribe(res => {
      this.dashboardDetails['update'] = true;
      if (res.isFactory) {
        res.userId = null;
        res.facilityId = null;
      } else {
        res.userId = this.userId;
        res.facilityId = this.facilityId;
      }
      this.saveCurrentDashboard(res);
    });
  }
  selectedOption(event, open) {
    if (open === true) {
      this.isOption = event;
    } else {
      this.isOption = null;
    }
  }

  alignGrid() {
    this.options.compactType = 'compactUp&Left';
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
    this.isLayoutChanged = true;
    this.options.compactType = 'none';
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
  }
  saveWidgets(layout, update = false) {
    const jsonData = {
      'dashboardId': this.dashboardId,
      'facilityId': this.facilityId,
      'code': this.preResponse.code,
      'dashboardName': this.preResponse.dashboardName,
      'userId': this.userId,
      'layouts': layout,
          };
    
    if (!this.preResponse.userId) {
      if ((this.active_btn.indexOf('BT_DBFAC') === -1)) {
        this.refreshLayout()
        this.openSnackbar('You are not Authorized to edit the Factory Layout', 'warning');
      } else {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass: ['confirmation-popup'],
          data: {
            title: 'Confirmation',
            message: 'Do you want to update the Factory layout ?',
            buttonText: {
              ok: 'Yes',
              cancel: 'No'
            }
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result == 'Yes') {
            this.saveCurrentDashboard(jsonData);
          } else {
            this.refreshLayout()
            this.openSnackbar('Layout changes are reverted', 'warning');
          }
        });
      }
    } else {
      this.saveCurrentDashboard(jsonData);
    }
  }
  saveCurrentDashboard(jsonData) {
    this.dashboardService.saveCurrentDashboard(jsonData).subscribe(res => {
      this.preResponse = res.results;
      this.dashboardId = res.results.dashboardId;
      this.getUserPreference();
      this.defaultLayout = JSON.stringify(res.results.layouts);
      this.openSnackbar(res.message, 'success');
      this.bindLayout(res.results.layouts);
    });
    this.isUpdateLayout = false;
  }


  getPopupWidget(data) {
    for (let i = 0; i < this.layout.length; i++) {
      if (data.find(val => val.id === this.layout[i].id)) {
        this.layout[i]['isActive'] = true;
      } else {
        this.layout[i]['isActive'] = false;
      }
    }
    this.isUpdateLayout = true;
    this.dashboardDetails['update'] = true;
    this.bindLayout(this.layout);
  }

  processDynamicChartDataRes(modelWidgets, res) {
    let layout = null;
    for (let i = 0; i < modelWidgets.layouts.length; i++) {
      layout = modelWidgets.layouts[i];
      if(res['results'].hasOwnProperty(layout.widgetId)){
        this.dashboardDetails[layout.code] = { 'show': false,'loading':true };
        if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR' ||
          layout.widgetTypeId === 'WT-PIE' || layout.widgetTypeId === 'WT-LINE' || layout.widgetTypeId === 'WT-CHART') {

          this.dashboardDetails[layout.code]['styles'] = {};
          const chartValue = res.results[layout.widgetId];
          if (chartValue && chartValue.hasOwnProperty('options') && chartValue.options.hasOwnProperty('styles')) {
            this.dashboardDetails[layout.code]['styles'] = chartValue.options['styles'];
          }
          if (chartValue != null) {
            if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR') {
              const dataset = [];
              const chartBackground = [];
              if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
                this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
              }
              // binding array as object(for simple barchart)
              // check the data is array
              if (typeof chartValue.data[0] != "object") {
                if (chartValue.data.length > 0) {
                  let tempDat = chartValue.data.slice();
                  chartValue.data[0] = {};
                  chartValue.data[0].data = tempDat;
                } else {
                  chartValue.data[0] = {};
                  chartValue.data[0].data = [];
                }
              }
              for (let i = 0; i < chartValue.data.length; i++) {
                dataset.push({ label: chartValue.data[i].label, data: chartValue.data[i].data });
                if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length) {
                  if (chartValue.options['colorOptions'][i] !== undefined) {
                    chartBackground.push(chartValue.options['colorOptions'][i]);
                  } else if (chartValue.options['colorOptions'][i] === undefined) {
                    chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
                  }
                } else {
                  chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
                }
              }
              if (layout.widgetTypeId === 'WT-BAR') {
                this.bindDynamicCharts(layout.code, 'bar', dataset, chartValue.labels, null, chartBackground, 'Date', 'Count',
                  chartValue.options.options);
              } else if (layout.widgetTypeId === 'WT-HBAR') {
                this.bindDynamicCharts(layout.code, 'horizontalBar', dataset, chartValue.labels, null, chartBackground, 'Date', 'Count',
                  chartValue.options.options);
              }
            } else if (layout.widgetTypeId === 'WT-LINE') {
              const dataset = [];
              const chartBackground = [];
              if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
                this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
              }
              for (let i = 0; i < chartValue.data.length; i++) {
                dataset.push({ label: chartValue.data[i].label, data: chartValue.data[i].data, fill: false });
                if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length) {
                  if (chartValue.options['colorOptions'][i] !== undefined) {
                    chartBackground.push(chartValue.options['colorOptions'][i]);
                  } else if (chartValue.options['colorOptions'][i] === undefined) {
                    chartBackground.push({ borderColor: this.commonService.getRandomColor() });
                  }
                } else {
                  chartBackground.push({ borderColor: this.commonService.getRandomColor() });
                }
              }
              this.bindDynamicCharts(layout.code, 'line', dataset, chartValue.labels, null, chartBackground, 'Date', 'Count',
                chartValue.options.options);
            } else if (layout.widgetTypeId === 'WT-PIE') {
              let chartBackground = [];
              const pieBackgroundColor = [{ backgroundColor: [] }];
              if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
                this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
              }
              if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'][0].backgroundColor.length) {
                for (let i = 0; i < chartValue.data.length; i++) {
                  if (chartValue.options['colorOptions'][0].backgroundColor[i] !== undefined) {
                    pieBackgroundColor[0].backgroundColor.push(chartValue.options['colorOptions'][0].backgroundColor[i]);
                  } else if (chartValue.options['colorOptions'][0].backgroundColor[i] === undefined) {
                    pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                  }
                }
              } else {
                for (let i = 0; i < chartValue.data.length; i++) {
                  pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                }
              }
              chartBackground = pieBackgroundColor;
              if(chartValue.options.hasOwnProperty('colorMap')) {
                let colorDetails = chartValue.options.colorMap;
                for (let i = 0; i <  Object.keys(colorDetails).length; i++) {
                  let labelKey = Object.keys(colorDetails)[i]
                  let labelIndex = chartValue.labels.indexOf(labelKey)
                  chartBackground[0]['backgroundColor'][labelIndex] = colorDetails[labelKey]
                }
              }
              this.bindDynamicCharts(layout.code, 'pie', chartValue.data, chartValue.labels, 'Count', chartBackground, 'Zone', 'Count',
                chartValue.options.options);
            } else if (layout.widgetTypeId === 'WT-CHART') {
              this.dynamicChartBind(layout, chartValue)
            }
            this.tempChart.push(layout.code);
          }

        } else if (layout.widgetTypeId === 'WT-TABLE') {
          this.dashboardDetails[layout.code]['styles'] = {
            'th': '',
            'tr': ''
          };
          const tableData = res.results[layout.widgetId];
          this.dashboardDetails[layout.code]['pagination'] = false;
          this.dashboardDetails[layout.code]['pageSizeOptions'] = false;
          this.dashboardDetails[layout.code]['enableExcel'] = false;
          this.dashboardDetails[layout.code]['filters'] = null;
          this.dashboardDetails[layout.code]['kpiRules'] = [];
          if (tableData != null) {
            if (tableData.hasOwnProperty('kpi')){
              this.dashboardDetails[layout.code]['kpiRules'] = tableData['kpi'];
            }
            if (tableData.options.hasOwnProperty('pagination')) {
              this.dashboardDetails[layout.code]['pagination'] = tableData.options['pagination'];
            }
            if (tableData.options.hasOwnProperty('pageSizeOptions') && tableData.options['pageSizeOptions'] && tableData.options['pageSizeOptions'].length) {
              this.dashboardDetails[layout.code]['pageSizeOptions'] = tableData.options['pageSizeOptions'];
            }
            if (tableData.options.hasOwnProperty('enableExcel')) {
              this.dashboardDetails[layout.code]['enableExcel'] = tableData.options['enableExcel'];
            }
            if (tableData.options.hasOwnProperty('filterBy')) {
              this.dashboardDetails[layout.code]['filterBy'] = tableData.options['filterBy'];
              if (tableData['options'].hasOwnProperty('filterBy') && tableData['options']['filterBy'].hasOwnProperty('enabled')) {
                this.dashboardDetails[layout.code]['filterBy']['option'] = tableData['data'].map(val => val[tableData.options['filterBy']['key']])
              }
            }

            if (tableData.options.hasOwnProperty('styles')) {
              this.dashboardDetails[layout.code]['styles'] = tableData.options['styles'];
            }
            if (layout.code === 'WD_DBHP') {
              let str = JSON.stringify(tableData.data);
              str = str.replace(/\"Avg TAT\":/g, "\"Avg. Time(mins)\":");
              tableData.data = JSON.parse(str);

              str = JSON.stringify(tableData.data);
              str = str.replace(/\"Total Patients Enrolled\":/g, "\"Patient Count\":");
              tableData.data = JSON.parse(str);
            }
            if (tableData.options.hasOwnProperty('text') && tableData.options['text'] !== '') {
              this.dashboardDetails[layout.code]['text'] = tableData.options['text'];
            }

            this.dashboardDetails[layout.code]['label'] = null;
            if ('model-mapping' in tableData && 'lables' in tableData['model-mapping']
              && tableData['model-mapping']['lables'].length > 0) {
              this.dashboardDetails[layout.code]['label'] = tableData['model-mapping']['lables'];
            }


            this.dashboardDetails[layout.code]['type'] = 'table';
            this.dashboardDetails[layout.code]['data'] = tableData.data;
            if (tableData.labels) {
              this.dashboardDetails[layout.code]['column'] = tableData.labels;
            } else if (tableData.label) {
              this.dashboardDetails[layout.code]['column'] = tableData.label;
            }
            let filteredData = [];
            if (this.dashboardDetails[layout.code]['label'] && this.dashboardDetails[layout.code]['label'].length) {
              for (let i = 0; i <= this.dashboardDetails[layout.code]['column'].length; i++) {
                this.dashboardDetails[layout.code]['data'].map((data) => {
                  data[this.dashboardDetails[layout.code]['label'][i]] = data[this.dashboardDetails[layout.code]['column'][i]];
                });
              }

              filteredData = this.dashboardDetails[layout.code]['data'].map(item => {
                const filteredItem: any = {};
                this.dashboardDetails[layout.code]['label'].forEach(key => {
                  if (key in item) {
                    filteredItem[key] = item[key];
                  }
                });
                return filteredItem;
              });
            }
            this.dashboardDetails[layout.code]['tableStyle'] = {};
            if (tableData.options.options) {
              this.dashboardDetails[layout.code]['tableStyle'] = tableData.options.options;
            }
            this.dashboardDetails[layout.code]['show'] = true;
            if (filteredData.length > 0 && (this.tableName.find(res => res === layout['widgetName']) === undefined)) {
              this.tempTable.push(filteredData);
              this.tableName.push(layout['widgetName']);
            } else if (this.dashboardDetails[layout.code]['data'].length > 0 && (this.tableName.find(res => res === layout['widgetName']) === undefined)) {
              this.tempTable.push(this.dashboardDetails[layout.code]['data']);
              this.tableName.push(layout['widgetName']);
            }
            if(this.dashboardDetails[layout.code].hasOwnProperty('label')){
              this.tableColumns.push(this.dashboardDetails[layout.code]['label']);
            }else{
              this.tableColumns.push([]);
            }
          }

        } else if (layout.widgetTypeId === 'WT-CARD') {

          const cardData = res.results[layout.widgetId];
          if (cardData != null) {
            this.dashboardDetails[layout.code]['data']  = cardData["data"];
            this.dashboardDetails[layout.code]['options']  = res.results[layout.widgetId].options;
             if (cardData.hasOwnProperty('model-mapping') && cardData['model-mapping']?.repeatable) {
                const cardTitle = cardData.options?.text || '';
                const loopKeys = (cardData['model-mapping']?.loopKey  || '')
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k);
                this.rawHtmlTemplate = cardData['content'];
                let rawHtml = this.rawHtmlTemplate;

                if (loopKeys.length > 0) {
                    loopKeys.forEach(loopKey => {
                        const loopBlock = this.extractFullDiv(rawHtml, loopKey);
                        if (loopBlock) {
                            let repeated = '';

                            const loopData = cardData['data'][loopKey] || cardData['data'] || [];
                            
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
                    combinedHtml = `<div style='display:flex; flex-wrap:wrap; gap:16px;'><h3 style="width: 100%;">${cardTitle}</h3>`;
                    }
                    (cardData['data'] || []).forEach((item: any) => {
                        let cardHtml = rawHtml;
                        Object.keys(item).forEach(key => {
                            cardHtml = cardHtml.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), item[key]);
                        });
                        combinedHtml += cardHtml;
                    });
                    rawHtml = `<div style='display:flex; flex-wrap:wrap; gap:16px;'>${combinedHtml}</div>`;
                }
                this.dashboardDetails[layout.code]['content'] = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
            }else{
            if(res.results[layout.widgetId].hasOwnProperty('content') || res.results[layout.widgetId].options.hasOwnProperty('content')) {
              let content : SafeHtml;
              let templateContent = res.results[layout.widgetId].hasOwnProperty('content') ? res.results[layout.widgetId]['content'] : null;
              if(templateContent == null) {
                templateContent = res.results[layout.widgetId].options.hasOwnProperty('content') ? res.results[layout.widgetId].options['content'] : null;
              }
              content = this.sanitizer.bypassSecurityTrustHtml(templateContent);
              this.dashboardDetails[layout.code]['content'] = content;
            } else {
              this.dashboardDetails[layout.code]['cardStyle'] = res.results[layout.widgetId].options.style;
            }
          }
            if (cardData.options.hasOwnProperty('text') && cardData.options['text'] !== '') {
              cardData.widgetName = cardData.options['text'];
            }
            this.dashboardDetails[layout.code]['type'] = 'card';
            this.updateStyle(layout.code)
            this.dashboardDetails[layout.code]['show'] = true;
            if(res.results[layout.widgetId].options.hasOwnProperty('content') == false) {
            const options = res.results[layout.widgetId].options.options;
            if (options?.backgroundColor) {
              if (options.icon === '') {
                this.dashboardDetails[layout.code]['maxCol'] = options.col;
                this.dashboardDetails[layout.code]['detail'] = [
                  {
                    'type': 'text', 'col': options.col, 'bg-color': options.backgroundColor, 'color': options.color,
                    'icon': '', 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id': layout.code,
                    'title': cardData.widgetName, 'data': { data: cardData.data, label: cardData.labels }
                  }
                ];
              } else {
                this.dashboardDetails[layout.code]['maxCol'] = options.col;
                this.dashboardDetails[layout.code]['detail'] = [
                  {
                    'type': 'text', 'col': options.col, 'bg-color': options.backgroundColor, 'color': options.color,
                    'icon': options.icon, 'iconWidth': options.iconWidth, 'fontSize': options.fontSize,
                    'fontColor': options.fontColor, 'id': layout.code,
                    'title': cardData.widgetName, 'data': cardData.data[0], 'label': cardData.labels[0]
                  }
                ];
              }
            } else {
              this.dashboardDetails[layout.code]['maxCol'] = 3;
              this.dashboardDetails[layout.code]['detail'] = [
                {
                  'type': 'text', 'col': 3, 'bg-color': '#58edd7', 'color': '#656968', 'icon': '', 'fontSize': '25px',
                  'fontColor': '#4c4949', 'id': layout.code, 'title': cardData.widgetName,
                  'data': { data: cardData.data, label: cardData.labels }
                }
              ];
            }
          }

        } else if (layout.widgetTypeId === 'WT-HDR') {

          const headerData = res.results[layout.widgetId];
          if (headerData != null) {
            if (headerData.options.hasOwnProperty('text') && headerData.options['text'] !== '') {
              headerData.widgetName = headerData.options['text'];
            }
            this.dashboardDetails[layout.code]['type'] = 'header';
            this.dashboardDetails[layout.code]['show'] = true;
            const options = res.results[layout.widgetId].options.options;
            if (options.backgroundColor) {
              this.dashboardDetails[layout.code]['detail'] = [{
                'bg-color': options.backgroundColor, 'color': options.color,
                'icon': options.icon !== '' ? options.icon : '', 'iconWidth': options.iconWidth,
                'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id': layout.code, 'title': headerData.widgetName
              }];
            } else {
              this.dashboardDetails[layout.code]['detail'] = [{
                'bg-color': '#b1dafcc9', 'color': '#656968', 'icon': '', 'fontSize': '25px',
                'fontColor': '#4c4949', 'id': layout.code, 'title': headerData.widgetName
              }];
            }
          }

        } else if (layout.widgetTypeId === 'WT-FORM') {
          this.dashboardDetails[layout.code]['type'] = 'form';
          let menuCode = localStorage.getItem(btoa('menuCode'));
          this.dashboardService.getDashboardWidgetDatav2(layout['widgetId'], null).subscribe(res => {
            if (res.statusCode === 1 && res.results[layout['widgetId']].hasOwnProperty('pfFormTemplateData')) {
              this.dashboardDetails[layout.code]['formTemplateData'] = res.results[layout['widgetId']]['pfFormTemplateData'];
              this.dashboardDetails[layout.code]['formTemplateData']['jsonValue'] = JSON.parse(this.dashboardDetails[layout.code]['formTemplateData']['jsonValue']);
              this.dashboardDetails[layout.code]['formTemplateData']['css'] = JSON.parse(this.dashboardDetails[layout.code]['formTemplateData']['css']);
              this.dashboardDetails[layout.code]['show'] = true;
            }
          });
        }
        if(res.results[layout.widgetId] && res.results[layout.widgetId].hasOwnProperty('redirect')){
            this.dashboardDetails[layout.code]['redirect'] = res.results[layout.widgetId]['redirect'];
        }
      }
      this.dashboardDetails[layout.code]['loading'] = false;
    }
    this.showLoadingSpinner = false;
  }
}
  updateStyle(code) {
    if(this.dashboardDetails[code].type == 'card') {
        if(this.dashboardDetails[code]['options'].hasOwnProperty('colorMap')) {
            if(this.dashboardDetails[code]['options'].hasOwnProperty('style') && this.dashboardDetails[code]['options'].style.hasOwnProperty('con-label')) {
                if(this.dashboardDetails[code].data.length && this.dashboardDetails[code]['options'].colorMap.hasOwnProperty(this.dashboardDetails[code].data[0])) {
                    this.dashboardDetails[code]['options']['style']['con-label']['color'] = this.dashboardDetails[code]['options'].colorMap[this.dashboardDetails[code].data[0]]
                }
            }
        }
        if(this.dashboardDetails[code]['options'].hasOwnProperty('bgColorMap')) {
            if(this.dashboardDetails[code]['options'].hasOwnProperty('style') && this.dashboardDetails[code]['options'].style.hasOwnProperty('content')) {
                if(this.dashboardDetails[code].data.length && this.dashboardDetails[code]['options'].bgColorMap.hasOwnProperty(this.dashboardDetails[code].data[0])) {
                    this.dashboardDetails[code]['options']['style']['content']['background'] = this.dashboardDetails[code]['options'].bgColorMap[this.dashboardDetails[code].data[0]]                                
                }
            }
        }
        if(this.dashboardDetails[code]['options'].hasOwnProperty('iconColorMap')) {
            if(this.dashboardDetails[code]['options'].hasOwnProperty('style') && this.dashboardDetails[code]['options'].style.hasOwnProperty('con-inner-icon')) {
                if(this.dashboardDetails[code].data.length && this.dashboardDetails[code]['options'].iconColorMap.hasOwnProperty(this.dashboardDetails[code].data[0])) {
                    this.dashboardDetails[code]['options']['style']['con-inner-icon']['color'] = this.dashboardDetails[code]['options'].iconColorMap[this.dashboardDetails[code].data[0]]
                }
            }
        }                    
    }
  }

  // TABLE WIDGET STARTS
  getDynamicChartData(modelWidgets: ModelWidgets) {
    let modelInput = null;
    let headerParamKey = [];
    // after clicking getinsights from dynamic menu the input param is update directly by inputAction json
    if (this.inputAction != undefined && this.inputAction.hasOwnProperty('paramJson')) {
      let params = this.inputAction.paramJson;
      headerParamKey = Object.keys(params);
    }
    // compare every widget input params and separate the widgets with default value
    let widIds = modelWidgets.widgetIds ? String(modelWidgets.widgetIds).split(',') : [];
    let wid_map = new Map();
    let widSameParam = "";
    let widSameParamLayouts = [];
    for (let wid = 0; wid < widIds.length; wid++) {
      let iparam = modelWidgets.layouts[wid].inputParams;
      if (iparam && iparam.includes('=')) {
        wid_map.set(widIds[wid], [modelWidgets.layouts[wid]])
      } else {
        if (widSameParamLayouts.length) {
          widSameParam = widSameParam + "," + widIds[wid];
        } else {
          widSameParam = widIds[wid];
        }
        widSameParamLayouts.push(modelWidgets.layouts[wid])
      }
    }
    if (widSameParamLayouts.length){
      wid_map.set(widSameParam, widSameParamLayouts);
    }
    wid_map.forEach((value: any, key: string) => {
      modelInput = null;
      const widgetParam = [];
      let layout = value[0];
      let formBtnValidation = null;
      if (this.formTemplateValue && this.formTemplateValue[2].hasOwnProperty('validation')) {
        try {
          formBtnValidation = JSON.parse(this.formTemplateValue[2]['validation']);
        } catch (error) { }
      }
      let iparam = "inputParams";
      // check widget input params with default value 
      if(!layout.inputParams?.includes('=')){
        iparam = "modelInputParams";
      }
      const inputParam = layout[iparam] ? layout[iparam].split(',') : [];
      
      let layoutParam = layout.widgetParam ? layout.widgetParam.split(',') : [];
      if (formBtnValidation && formBtnValidation.hasOwnProperty('action') && formBtnValidation['action'] == "get") {
        let paramIndex = 0;
        let formTempData = this.formTemplateValue[0].value;
        Object.keys(formTempData).forEach(key => {
          if (key != 'gis' && key != 'pdf' && key != 'excel') {
            if (paramIndex == 0) {
              widgetParam.push(key + '=' + formTempData[key]);
            } else {
              widgetParam.push('&' + key + '=' + formTempData[key]);
            }
            paramIndex = paramIndex + 1;
          }
        });

      } else if (layout.inputParams && inputParam.length) {
        for (let i = 0; i < inputParam.length; i++) {
          if (!headerParamKey.includes(inputParam[i])) {
            if (inputParam[i] === 'fid' || inputParam[i] === 'facility_id') {
              if (widgetParam.length === 0) {
                widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
              } else {
                widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
              }
            } else if (inputParam[i] === 'fdt') {
              if (widgetParam.length === 0) {
                if (this.fromDate) {
                  widgetParam.push(inputParam[i] + '=' + this.fromDate);
                } else {
                  widgetParam.push(inputParam[i] + '=' + this.selectedDate);
                }
              } else {
                if (this.fromDate) {
                  widgetParam.push('&' + inputParam[i] + '=' + this.fromDate);
                } else {
                  widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate);
                }
              }
            } else if (inputParam[i] === 'tdt') {
              if (widgetParam.length === 0) {
                if (this.toDate) {
                  widgetParam.push(inputParam[i] + '=' + this.toDate);
                } else {
                  widgetParam.push(inputParam[i] + '=' + this.selectedDate);
                }
              } else {
                if (this.toDate) {
                  widgetParam.push('&' + inputParam[i] + '=' + this.toDate);
                } else {
                  widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate);
                }
              }
            } else if (inputParam[i] === 'uid'){
              if (widgetParam.length === 0) {
                widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('userId')));
              } else {
                widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('userId')));
              }
            } else if(inputParam[i] === 'role'){
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
            } else if (inputParam[i] === 'lid') {
              if (this.resultJson) {
                let locData = this.resultJson[0].filter(x => x.key === 'lid');
                let lid = locData[0]['value']
                if (widgetParam.length === 0) {
                  widgetParam.push(inputParam[i] + '=' + lid);
                } else {
                  widgetParam.push('&' + inputParam[i] + '=' + lid);
                }
              }
            } else if (inputParam[i] === 'deptId') {
              const deptIds = this.deptList.map(item => item.departmentId).join(',');
              if (widgetParam.length === 0) {
                widgetParam.push(inputParam[i] + '=' + deptIds);
              } else {
                widgetParam.push('&' + inputParam[i] + '=' + deptIds);
              }
            } else if (inputParam[i].includes('=')) {
              if (widgetParam.length === 0) {
                widgetParam.push(inputParam[i]);
              } else {
                widgetParam.push('&' + inputParam[i]);
              }
            }
          } else{
            if (widgetParam.length === 0) {
              widgetParam.push(inputParam[i] + '=' + this.inputAction.paramJson[inputParam[i]]);
            }else{
              widgetParam.push('&' +inputParam[i] + '=' + this.inputAction.paramJson[inputParam[i]]);
            }
          }
        }
      }
      if (layout.widgetParam && layoutParam.length) {
        for (let i = 0; i < layoutParam.length; i++) {
          // set default value from widget param of layout
          if (layoutParam[i].includes('=')) {
            let key = layoutParam[i].split("=")
            let index = widgetParam.findIndex(val => val.includes(key[0]))
            if (index != -1) {
              widgetParam.splice(index, 1)
            }
            if (widgetParam.length === 0) {
              widgetParam.push(layoutParam[i]);
            } else {
              widgetParam.push('&' + layoutParam[i]);
            }
          }
        }
      }
      modelInput = widgetParam.toString();
      modelInput = modelInput.replace(/,&/g, '&');
      
      const widgetFilter = layout.widgetOptions;
      if(widgetFilter && widgetFilter.hasOwnProperty('filters') && widgetFilter['filters'].length){
        this.dashboardDetails[layout.code]['filters'] = widgetFilter['filters'];
        for(let filter in widgetFilter['filters']){
          this.dashboardDetails[layout.code]['filters'][filter]['widId'] = layout.widgetId;
          this.dashboardDetails[layout.code]['filters'][filter]['modelInput'] = modelInput;
          this.dashboardDetails[layout.code]['filters'][filter]['code'] = layout.code;
          if(this.dashboardDetails[layout.code]['filters'][filter]['resData'] == null && this.dashboardDetails[layout.code]['filters'][filter]['fetch_type'] == 'API') {
            this.commonService.getPfModelData(widgetFilter.filters[filter]['input_value']).subscribe(res => {
              if(res.statusCode == 1){
                this.dashboardDetails[layout.code]['filters'][filter]['resData'] = res.results;
                widgetFilter['filters'][filter]['resData'] = res.results;
                if(widgetFilter['filters'][filter].hasOwnProperty('selected_value')){
                  this.getWidgetFilterInput(widgetFilter['filters']);
                }
              }
            });
          } else {
            if(widgetFilter['filters'][filter].hasOwnProperty('selected_value')){
              this.getWidgetFilterInput(widgetFilter);
            }
          }
        }
      } else{
        this.dashboardService.getDashboardWidgetDatav2(key, modelInput).subscribe(res => {
          if (res.statusCode === 1) {
            this.processDynamicChartDataRes(modelWidgets, res)
          }
  
        });
      }
    });

  }

  getWidgetFilterInput(data){
    let updatedModelInput = null;
    if(data.length){
      let modelInput = data[0]['modelInput'];
      const modelInputParams = modelInput.split('&').map(param => param.split('='));
      const modelInputObj = {};
      for(let i=0;i<data.length;i++){
        if(data[i].hasOwnProperty('widget_input_param')){
          let widget_input_param = data[i]['widget_input_param'];
        
          for (const [key, value] of modelInputParams) {
              modelInputObj[key] = value;
          }

          if(data[i]['selected_value']){
            modelInputObj[widget_input_param] = data[i]['selected_value'];
          } else{
            delete modelInputObj[widget_input_param];
          }
          // Convert the updated object back to string
          updatedModelInput = Object.entries(modelInputObj).map(([key, value]) => `${key}=${value}`).join('&');
        }
      }
      if(updatedModelInput){
        this.dashboardService.getDashboardWidgetDatav2(data[0]['widId'], updatedModelInput).subscribe(res => {
          if (res.statusCode === 1) {
            const widData = res.results[data[0]['widId']];
              if (widData != null) {
                this.dashboardDetails[data[0]['code']]['show'] = true;
                widData.options.options['widId'] = data[0]['widId'];
                widData.options.options['modelInput'] = updatedModelInput;
                if (widData.widgetType === 'WT-BAR' || widData.widgetType === 'WT-HBAR') {
                  const dataset = [];
                  const chartBackground = [];
                  if (widData.options.hasOwnProperty('text') && widData.options['text'] !== '') {
                    this.dashboardDetails[data[0]['code']]['text'] = widData.options['text'];
                  }
                  for (let i in widData.data) {
                    dataset.push({ label: widData.data[i].label, data: widData.data[i].data });
                    if (widData.options['colorOptions'] && widData.options['colorOptions'].length) {
                      if (widData.options['colorOptions'][i] !== undefined) {
                        chartBackground.push(widData.options['colorOptions'][i]);
                      } else if (widData.options['colorOptions'][i] === undefined) {
                        chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
                      }
                    } else {
                      chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
                    }
                  }
                  if (widData.widgetType === 'WT-BAR') {
                    this.bindDynamicCharts(data[0]['code'], 'bar', dataset, widData.labels, null, chartBackground, 'Date', 'Count',
                    widData.options.options);
                  } else if (widData.widgetType === 'WT-HBAR') {
                    this.bindDynamicCharts(data[0]['code'], 'horizontalBar', dataset, widData.labels, null, chartBackground, 'Date', 'Count',
                    widData.options.options);
                  }
                } else if (widData.widgetType === 'WT-LINE') {
                  const dataset = [];
                  const chartBackground = [];
                  if (widData.options.hasOwnProperty('text') && widData.options['text'] !== '') {
                    this.dashboardDetails[data[0]['code']]['text'] = widData.options['text'];
                  }
                  for (let i in widData.data) {
                    dataset.push({ label: widData.data[i].label, data: widData.data[i].data, fill: false });
                    if (widData.options['colorOptions'] && widData.options['colorOptions'].length) {
                      if (widData.options['colorOptions'][i] !== undefined) {
                        chartBackground.push(widData.options['colorOptions'][i]);
                      } else if (widData.options['colorOptions'][i] === undefined) {
                        chartBackground.push({ borderColor: this.commonService.getRandomColor() });
                      }
                    } else {
                      chartBackground.push({ borderColor: this.commonService.getRandomColor() });
                    }
                  }
                  this.bindDynamicCharts(data[0]['code'], 'line', dataset, widData.labels, null, chartBackground, 'Date', 'Count',
                  widData.options.options);
                } else if (widData.widgetType === 'WT-PIE') {
                  let chartBackground = [];
                  const pieBackgroundColor = [{ backgroundColor: [] }];
                  if (widData.options.hasOwnProperty('text') && widData.options['text'] !== '') {
                    this.dashboardDetails[data[0]['code']]['text'] = widData.options['text'];
                  }
                  if (widData.options['colorOptions'] && widData.options['colorOptions'][0].backgroundColor.length) {
                    for (let i in widData.data) {
                      if (widData.options['colorOptions'][0].backgroundColor[i] !== undefined) {
                        pieBackgroundColor[0].backgroundColor.push(widData.options['colorOptions'][0].backgroundColor[i]);
                      } else if (widData.options['colorOptions'][0].backgroundColor[i] === undefined) {
                        pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                      }
                    }
                  } else {
                    for (let i in widData.data) {
                      pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                    }
                  }
                  chartBackground = pieBackgroundColor;
                  if(widData.options.hasOwnProperty('colorMap')) {
                    let colorDetails = widData.options.colorMap;
                    for (let i = 0; i <  Object.keys(colorDetails).length; i++) {
                      let labelKey = Object.keys(colorDetails)[i]
                      let labelIndex = widData.labels.indexOf(labelKey)
                      chartBackground[0]['backgroundColor'][labelIndex] = colorDetails[labelKey]
                    }
                  }
                  this.bindDynamicCharts(data[0]['code'], 'pie', widData.data, widData.labels, 'Count', chartBackground, 'Zone', 'Count',
                  widData.options.options);
                } 
                else if (widData.widgetType === 'WT-CHART') {
                    let layout = {
                      'code':data[0]['code'],
                      'widgetTypeId': widData.widgetType 
                    }
                    if (widData.options.hasOwnProperty('styles')) {
                      this.dashboardDetails[data[0]['code']]['styles'] = widData.options['styles'];
                    }
                    this.dynamicChartBind(layout, widData)
                }
                else if(widData.widgetType === 'WT-TABLE'){
                  this.dashboardDetails[data[0]['code']]['styles'] = {
                    'th': '',
                    'tr': ''
                  };
                  this.dashboardDetails[data[0]['code']]['pagination'] = false;
                  this.dashboardDetails[data[0]['code']]['pageSizeOptions'] = false;
                  this.dashboardDetails[data[0]['code']]['enableExcel'] = false;
                    if (widData.options.hasOwnProperty('pagination')) {
                      this.dashboardDetails[data[0]['code']]['pagination'] = widData.options['pagination'];
                    }
                    if (widData.options.hasOwnProperty('pageSizeOptions') && widData.options['pageSizeOptions'] && widData.options['pageSizeOptions'].length) {
                      this.dashboardDetails[data[0]['code']]['pageSizeOptions'] = widData.options['pageSizeOptions'];
                    }
                    if (widData.options.hasOwnProperty('enableExcel')) {
                      this.dashboardDetails[data[0]['code']]['enableExcel'] = widData.options['enableExcel'];
                    }
                    if (widData.options.hasOwnProperty('styles')) {
                      this.dashboardDetails[data[0]['code']]['styles'] = widData.options['styles'];
                    }
                    if (widData.options.hasOwnProperty('text') && widData.options['text'] !== '') {
                      this.dashboardDetails[data[0]['code']]['text'] = widData.options['text'];
                    }
        
                    this.dashboardDetails[data[0]['code']]['label'] = null;
                    if ('model-mapping' in widData && 'lables' in widData['model-mapping']
                      && widData['model-mapping']['lables'].length > 0) {
                      this.dashboardDetails[data[0]['code']]['label'] = widData['model-mapping']['lables'];
                    }
        
        
                    this.dashboardDetails[data[0]['code']]['type'] = 'table';
                    this.dashboardDetails[data[0]['code']]['data'] = widData.data;
                    if (widData.labels) {
                      this.dashboardDetails[data[0]['code']]['column'] = widData.labels;
                    } else if (widData.label) {
                      this.dashboardDetails[data[0]['code']]['column'] = widData.label;
                    }
                    this.dashboardDetails[data[0]['code']]['tableStyle'] = {};
                    if (widData.options.options) {
                      this.dashboardDetails[data[0]['code']]['tableStyle'] = widData.options.options;
                    }
                    for(let j=0;j<this.dashboardDetails[data[0]['code']]['filters'].length;j++){
                      if(this.dashboardDetails[data[0]['code']]['filters'][j]['fetch_type'] == 'dataSource'){
                        this.dashboardDetails[data[0]['code']]['filters'][j]['selected_value'] = "";
                        this.dashboardDetails[data[0]['code']]['filters'][j]['resData'] = widData.data.map(val => val[this.dashboardDetails[data[0]['code']]['filters'][j]['key']]);
                      }
                    }
                }
              } else{
                if(this.dashboardDetails[data[0]['code']] && this.dashboardDetails[data[0]['code']].hasOwnProperty('type')){
                  if(this.dashboardDetails[data[0]['code']]['type'] === 'table'){
                    this.dashboardDetails[data[0]['code']]['data'] = [];
                    for(let j=0;j<this.dashboardDetails[data[0]['code']]['filters'].length;j++){
                      if(this.dashboardDetails[data[0]['code']]['filters'][j]['fetch_type'] == 'dataSource'){
                        this.dashboardDetails[data[0]['code']]['filters'][j]['resData'] = [];
                      }
                    }
                  }else if(this.dashboardDetails[data[0]['code']]['type'] === 'chart'){
                    this.dashboardDetails[data[0]['code']]['datasets'] = [];
                    this.dashboardDetails[data[0]['code']]['labels'] = [];
                  }
                }
              }
          }
          this.dashboardDetails[data[0]['code']]['loading'] = false;
        });
      }
    }
  }

  goToReport(code) {
    if (code === 'WD_DBLUZ') {
      this.router.navigate(['/ovitag/analytic-insights/patient-hc'], { queryParams: { report: 'coaster-details' } });
    }
  }

  dynamicChartBind(layout, chartValue) {
    let dataset = [];
    const chartBackground = [];
    if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
      this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
    }
    let type = null;
    let key = 'data'
    if (chartValue.hasOwnProperty('datasets') && chartValue.datasets.length) {
      key = 'datasets'
      type = chartValue.datasets[0]['type']
      dataset = chartValue.datasets;
    }
    for (let i = 0; i < chartValue[key].length; i++) {
      if (key == 'data') {
        dataset.push({ label: chartValue.data[i].label, data: chartValue.data[i].data, fill: false });
      }
      if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length) {
        if (chartValue.options['colorOptions'][i] !== undefined) {
          chartBackground.push(chartValue.options['colorOptions'][i]);
        } else if (chartValue.options['colorOptions'][i] === undefined) {
          chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
        }
      } else {
        chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
      }      
    }
    if(chartValue.options.hasOwnProperty('colorMap')) {
      let colorDetails = chartValue.options.colorMap;
      for (let i = 0; i <  Object.keys(colorDetails).length; i++) {
        let labelKey = Object.keys(colorDetails)[i]
        let labelIndex = chartValue.labels.indexOf(labelKey)
        chartBackground[0]['backgroundColor'][labelIndex] = colorDetails[labelKey]
      }
    }
    this.bindDynamicCharts(layout.code, type, dataset, chartValue.labels, null, chartBackground, layout.widgetTypeId, 'Count', chartValue.options.options);
  }

  public bindDynamicCharts(code, chartType, dataValue, labels, label, color, widgetTypeId, yName, options) {
    this.dashboardDetails[code]['type'] = 'chart';
    this.dashboardDetails[code]['chartType'] = chartType;
    this.dashboardDetails[code]['labels'] = labels;
    this.dashboardDetails[code]['datasets'] = chartType !== 'pie' ? dataValue : [{ label: label, data: dataValue }];
    if (widgetTypeId === 'WT-CHART') {
      this.dashboardDetails[code]['datasets'] = dataValue;
      if(this.dashboardDetails[code]['datasets'].length && color.length) {
        for(let i in this.dashboardDetails[code]['datasets']) {
          if(color[i]) {
            this.dashboardDetails[code]['datasets'][i]['backgroundColor'] = color[i]['backgroundColor'];
          }
        }
      }
    }
    this.dashboardDetails[code]['colors'] = color;
        this.dashboardDetails[code]['options'] = options;
    if (!options['plugins']['datalabels'].hasOwnProperty('display')) {
      this.dashboardDetails[code]['options']['plugins']['datalabels']['display'] = function (context) { return context.dataset.data[context.dataIndex] !== 0; };
    }
    this.dashboardDetails[code]['show'] = true;
  }
  public gridsterConfiguration(lockOption) {
    if(this.gridsterConfig){
      this.options = this.gridsterConfig;
      this.options['pushItems'] =  !lockOption;
      this.options['compactType'] =  CompactType.None;      
    }else{
      this.options = {
        minCols: this.pdfConfigSelected === "default"? 6 : 2,
        maxCols: this.pdfConfigSelected === "default" || this.pdfConfigSelected == null? 500 * 500 : 4,
        useTransformPositioning: true,
        disableAutoPositionOnConflict: this.pdfConfigSelected === "default"? false : true,
        minRows: 4,
        maxRows: 500 * 500,
        minItemRows: 1,
        maxItemRows: 500 * 500,
        minItemCols: 1,
        maxItemCols: 500 * 500,
        fixedRowHeight: 80,
        fixedColWidth: 80,
        margin: 15,
        mobileModeEnabled: true,
        mobileBreakpoint: 350,
        gridType: 'scrollVertical',
        pushItems: !lockOption,
        pushDirections: { north: false, east: false, south: false, west: false },
        displayGrid: 'onDrag&Resize',
        compactType: CompactType.None,
        swap: false,
        swapWhileDragging: false,
        compact: false
      };
    }
    this.options['draggable'] = {
      enabled: !lockOption,
      stop: function (item, gridsterItem, event) {
        const preLayout = JSON.stringify(this.layout);
        setTimeout(() => this.updateLayout(gridsterItem, preLayout, 'drag'), 800);
      }.bind(this)
    }
    this.options['resizable'] = {
      enabled: !lockOption,
      stop: function (item, gridsterItem, event) {
        const preLayout = JSON.stringify(this.layout);
        setTimeout(() => this.updateLayout(gridsterItem, preLayout, 'resize'), 800);
      }.bind(this),
      handles: { n: false, e: false, w: false, s: false, ne: true, se: true, sw: true, nw: true }
    }
  }

  getFloorId(data) {
    const e = eval;
    const floorDetail = e('[' + data + ']');
    this.floorId = floorDetail[0].id;
  }
  ngDoCheck() {
    if (this.resourceCode != this.preresourceCode) {
      this.checkMetaData()
    }
    else if (this.commonService.contextChanged === true && this.dashboardId != null) {
      this.screenLock = true;
      this.dashboardDetails['update'] = true;
      this.gridsterConfiguration(this.screenLock);
      this.commonService.contextChanged = false;
      this.checkUserPreference();
    }
  }
  ngOnDestroy() {
    clearInterval(this.autoInterval);
  }

  openSnackbar(message: string, action: string) {
    this.snackbar.open(message, action, {
      duration: 3000,
    });
  }

  downloadPDFOld() {
    let chartImage = [];
    for (let i = 0; i < this.tempChart.length; i++) {
      chartImage[i] = document.getElementById(this.tempChart[i]);
    }
    let headerName = this.resourceCode.split('_').join(' ');
    let pdfData = { "headerName": headerName, "fromDate": this.fromDate, "toDate": this.toDate, "pdfFileName": this.resourceCode, "chartImage": chartImage, "tableData": this.tempTable, "tableName": this.tableName };
    let gridsterDownload = true;
    if (!gridsterDownload) {
      this.layoutPdfService.pdfCreate(pdfData);
    }
    if (gridsterDownload) {
      let node = document.getElementById('dm-layout');
      let img;
      let filename = String(this.resourceCode) + '-' + this.today + ".pdf";
      let headerName = this.resourceCode.split('_').join(' ');
      let newImage;
      domtoimage.toPng(node, { width: node.scrollWidth, height: node.scrollHeight })
        .then(function (dataUrl) {
          img = new Image();
          img.src = dataUrl;
          newImage = img.src;
          img.onload = function () {
            let pdfWidth = img.width;
            let pdfHeight = img.height;
            let doc;
            if (pdfWidth > pdfHeight) {
              doc = new jsPDF('l', 'px', 'a4');
            } else {
              doc = new jsPDF('p', 'px', 'a4');
            }
            let width = doc.internal.pageSize.getWidth();
            let height = doc.internal.pageSize.getHeight();
            doc.text(headerName, 450, 35);//x,y
            doc.addImage(newImage, 'PNG', 0, 0, width, height);
            doc.save(filename);
          };
        })
        .catch(function (error) { });
    }
  }
  getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL('image/png', 1);
        resolve(dataURL);
      };
      img.onerror = error => {
        reject(error);
      };
      img.src = url;
    });
  }
  async downloadPDF(
    previewOnly: boolean = true,
    paperSize: 'a1' | 'a2' | 'a3' | 'a4' | 'a5' = 'a4',
    forceOrientation?: 'portrait' | 'landscape'
  ): Promise<void> {
    this.showLoadingSpinner = true;
    const originalRowsMap = new Map<string, number>();
    const originalYMap = new Map<string, number>();
    try {
      const node = document.getElementById('dm-layout');
      if (!node) return;

      const logoUrl = `${environment.api_base_url_new}${environment.base_value.get_customer_logo}/${this.customerId}`;
      const logoPromise = this.getBase64ImageFromURL(logoUrl)
        .catch(() => this.getBase64ImageFromURL(this.imageData).catch(() => ''));
      const fontLoadPromise = document.fonts.check("12px 'Open Sans'")
        ? Promise.resolve()
        : (() => {
            if (!document.querySelector('link[href*="Open+Sans"]')) {
              const fontLink = document.createElement('link');
              fontLink.href = 'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap';
              fontLink.rel = 'stylesheet';
              document.head.appendChild(fontLink);
            }
            return document.fonts.load("12px 'Open Sans'");
          })();
      const [customerLogo] = await Promise.all([logoPromise, fontLoadPromise]);
      const fixedRowHeight = this.options?.fixedRowHeight || 80;
      const sortedLayout = [...this.clayout].sort((a: any, b: any) => a.y - b.y);
      let yOffset = 0;

      sortedLayout.forEach((wid: any) => {
        originalYMap.set(wid.code, wid.y);
        if (yOffset > 0) {
          wid.y = wid.y + yOffset;
        }

        const widgetInfo = this.dashboardDetails[wid.code];
        if (widgetInfo?.type === 'table') {
          const dataCount = widgetInfo?.data?.length || 0;
          if (dataCount > 0) {
            originalRowsMap.set(wid.code, wid.rows);

            const getExactHeightForWidget = (widCode: string): number => {
              const gridsterItems = node.querySelectorAll('gridster-item');

              for (let idx = 0; idx < gridsterItems.length; idx++) {
                const item = gridsterItems[idx];
                const angularTable = item.querySelector('angular-table-component');
                if (!angularTable) continue;

                const title = angularTable.getAttribute('ng-reflect-title') || '';
                const widgetName = this.dashboardDetails[widCode]?.text ||
                  this.clayout.find((w: any) => w.code === widCode)?.widgetName || '';

                if (!title || !widgetName) continue;
                if (!title.includes(widgetName.substring(0, 10)) &&
                  !widgetName.includes(title.substring(0, 10))) continue;

                const tableRows = item.querySelectorAll('tbody tr, mat-row');
                const widgetHeader = item.querySelector('.dash-table-header-label');
                const tableHeader = item.querySelector('thead tr, mat-header-row');

                const headerH = widgetHeader?.getBoundingClientRect().height || 40;
                const tableHeaderH = tableHeader?.getBoundingClientRect().height || 40;

                let avgRowHeight = 45; 
                if (tableRows.length > 0) {
                  let totalRowH = 0;
                  tableRows.forEach((row: any) => {
                    totalRowH += row.getBoundingClientRect().height;
                  });
                  avgRowHeight = totalRowH / tableRows.length;
                }

                const rowsHeight = avgRowHeight * dataCount;
                const totalHeight = headerH + tableHeaderH + rowsHeight - 200;

                return totalHeight;
              }

              return (dataCount * 45) + 90;
            };
            const exactHeight = getExactHeightForWidget(wid.code);
            const neededGridRows = Math.ceil(exactHeight / fixedRowHeight);
            const extraRows = neededGridRows - wid.rows;
            wid.rows = neededGridRows;
            yOffset += extraRows;

          }
        }
      });

      let filterInputs = node.querySelectorAll('input[placeholder="Filter"]');
      filterInputs.forEach((el: any) => {
        el.dataset.filterOrigDisplay = el.style.display || '';
        el.style.display = 'none';
      });

      let filterSpans = node.querySelectorAll('span[style*="float: right"]');
      filterSpans.forEach((el: any) => {
        el.dataset.filterSpanOrigDisplay = el.style.display || '';
        el.style.display = 'none';
      });

  if (this.options?.api?.optionsChanged) {
        this.options.api.optionsChanged();
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const originalOverflow = node.style.overflow;
      const originalFontFamily = node.style.fontFamily;
      node.style.overflow = 'hidden';
      node.style.fontFamily = "'Open Sans', sans-serif";

      const childElements = node.querySelectorAll('*');
      childElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.dataset.originalOverflow = el.style.overflow || '';
          el.dataset.originalFontFamily = el.style.fontFamily || '';
          el.style.overflow = 'hidden';
          el.style.fontFamily = "'Open Sans', sans-serif";
        }
      });
      Array.from(document.styleSheets).forEach((sheet: any) => {
        try {
          sheet.cssRules;
        } catch (e) {
          Object.defineProperty(sheet, 'cssRules', {
            get: () => []
          });

        }
      });
      let dataUrl = '';
      try {
        dataUrl = await domtoimage.toJpeg(node, {
          quality: 0.92,
          bgcolor: '#FFFFFF',
          width: node.clientWidth,
          height: node.scrollHeight,
          cacheBust: true
        });
      } catch (e) {
        console.error('MAIN NODE FAILED', e);
      }
      originalRowsMap.forEach((originalRows, code) => {
        const wid = this.clayout.find((w: any) => w.code === code);
        if (wid) wid.rows = originalRows;
      });
      originalYMap.forEach((originalY, code) => {
        const wid = this.clayout.find((w: any) => w.code === code);
        if (wid) wid.y = originalY;
      });
      if (this.options?.api?.optionsChanged) {
        this.options.api.optionsChanged();
      }

      node.style.overflow = originalOverflow;
      node.style.fontFamily = originalFontFamily;

      childElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.overflow = el.dataset.originalOverflow || '';
          el.style.fontFamily = el.dataset.originalFontFamily || '';
          delete el.dataset.originalOverflow;
          delete el.dataset.originalFontFamily;
        }
      });

      filterInputs = node.querySelectorAll('input[placeholder="Filter"]');
      filterInputs.forEach((el: any) => {
        el.style.display = el.dataset.filterOrigDisplay || '';
        delete el.dataset.filterOrigDisplay;
      });

      filterSpans = node.querySelectorAll('span[style*="float: right"]');
      filterSpans.forEach((el: any) => {
        el.style.display = el.dataset.filterSpanOrigDisplay || '';
        delete el.dataset.filterSpanOrigDisplay;
      });

      const previewWindow = previewOnly ? window.open('', '_blank') : null;
      await new Promise<void>((resolveImgLoad) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
          const contentIsLandscape = img.width > img.height;
          const orientation: 'p' | 'l' = forceOrientation
            ? (forceOrientation === 'landscape' ? 'l' : 'p')
            : (contentIsLandscape ? 'l' : 'p');

          const doc = new jsPDF({ orientation, unit: 'px', format: paperSize });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();

          const margin = 20;
          const headerHeight = 50;
          const footerHeight = 80;
          const contentAreaHeight = pageHeight - headerHeight - footerHeight - (2 * margin) - 20;
          const contentAreaWidth = pageWidth - (2 * margin);

          const imgRatio = img.width / img.height;
          const scaledWidth = contentAreaWidth;
          const scaledHeight = scaledWidth / imgRatio;
          const totalPages = Math.ceil(scaledHeight / contentAreaHeight);

          const virtualCanvas = document.createElement('canvas');
          virtualCanvas.width = img.width;
          virtualCanvas.height = img.height;
          const vCtx = virtualCanvas.getContext('2d')!;
          vCtx.drawImage(img, 0, 0);

          const facilityName = localStorage.getItem(btoa('customer'));
          const customer = facilityName?.split(',');
          const keyMap = {
            logo: customerLogo,
            customerName: customer?.[0] || '',
            region: customer?.slice(1).join(',') || '',
            date: this.datepipe.transform(new Date(), 'dd-MM-yyyy')
          };

          const headerHtml = this.pdfConfig?.header?.enabled
            ? this.replaceKeys(this.pdfConfig.header.content, keyMap)
            : '';
          const footerHtml = this.pdfConfig?.footer?.enabled
            ? this.replaceKeys(this.pdfConfig.footer.content, keyMap)
            : '';

          let cachedHeaderImg = '';
          if (this.pdfConfig?.header?.enabled && headerHtml) {
            const headerDiv = document.createElement('div');
            headerDiv.style.width = (pageWidth - (2 * margin)) + 'px';
            headerDiv.innerHTML = headerHtml;
            document.body.appendChild(headerDiv);
            await Promise.all(Array.from(headerDiv.querySelectorAll('img')).map((el: any) =>
              el.complete ? Promise.resolve() : new Promise(r => { el.onload = r; el.onerror = r; })
            ));
            try {
              cachedHeaderImg = await domtoimage.toPng(headerDiv, {
                width: headerDiv.clientWidth * 2,
                height: headerDiv.clientHeight * 2,
                style: { transform: 'scale(2)', transformOrigin: 'top left' },
                cacheBust: true
              });
            } catch (e) { console.error('HEADER FAILED', e); }
            document.body.removeChild(headerDiv);
          }

          let cachedFooterImg = '';
          let actualFooterHeight = footerHeight;
          if (this.pdfConfig?.footer?.enabled && footerHtml) {
            const footerDiv = document.createElement('div');
            footerDiv.style.width = (pageWidth - (2 * margin)) + 'px';
            footerDiv.innerHTML = footerHtml;
            document.body.appendChild(footerDiv);
            actualFooterHeight = footerDiv.getBoundingClientRect().height || footerHeight;
            try {
              cachedFooterImg = await domtoimage.toPng(footerDiv, {
                width: footerDiv.clientWidth * 2,
                height: footerDiv.clientHeight * 2,
                style: { transform: 'scale(2)', transformOrigin: 'top left' },
                cacheBust: true
              });
            } catch (e) { console.error('FOOTER FAILED', e); }
            document.body.removeChild(footerDiv);
          }

          for (let i = 0; i < totalPages; i++) {
            if (i > 0) doc.addPage();

            if (this.pdfConfig?.header?.enabled && cachedHeaderImg) {
              doc.setDrawColor(180);
              doc.setLineWidth(0.5);
              doc.addImage(cachedHeaderImg, 'PNG', margin, margin, pageWidth - (2 * margin), headerHeight);
            }

            const sliceHeightInImg = (contentAreaHeight * img.height) / scaledHeight;
            const sliceY = i * sliceHeightInImg;
            const remainingImgHeight = img.height - sliceY;
            const actualSliceHeight = Math.min(sliceHeightInImg, remainingImgHeight);

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = img.width;
            sliceCanvas.height = sliceHeightInImg;
            const sliceCtx = sliceCanvas.getContext('2d')!;
            sliceCtx.fillStyle = '#FFFFFF';
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

            sliceCtx.drawImage(
              virtualCanvas,
              0, sliceY, img.width, actualSliceHeight,
              0, 0, img.width, actualSliceHeight         
            );
            const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);

            doc.addImage(
              sliceDataUrl,
              'JPEG',
              margin,
              margin + headerHeight,
              scaledWidth,
              contentAreaHeight
            );

            if (this.pdfConfig?.footer?.enabled && cachedFooterImg) {
              doc.setDrawColor(180);
              doc.setLineWidth(0.5);
              doc.line(
                margin,
                pageHeight - actualFooterHeight - margin - 10,
                pageWidth - margin,
                pageHeight - actualFooterHeight - margin - 10
              );
              doc.addImage(
                cachedFooterImg,
                'PNG',
                margin,
                pageHeight - actualFooterHeight - margin - 5,
                pageWidth - (2 * margin),
                actualFooterHeight
              );
            }

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Page ${i + 1} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
          }

          const filename = 'Form.pdf';
          if (previewOnly) {
            const blob = doc.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            if (previewWindow) {
              previewWindow.location.href = blobUrl;
            } else {
              window.open(blobUrl, '_blank');
            }
          } else {
            doc.save(filename);
          }
          resolveImgLoad();
        };
      });
      this.showLoadingSpinner = false;
    } catch (error) {
      originalRowsMap.forEach((originalRows, code) => {
        const wid = this.clayout.find((w: any) => w.code === code);
        if (wid) wid.rows = originalRows;
      });
      originalYMap.forEach((originalY, code) => {
        const wid = this.clayout.find((w: any) => w.code === code);
        if (wid) wid.y = originalY;
      });
      if (this.options?.api?.optionsChanged) {
        this.options.api.optionsChanged();
      }
      console.error('PDF generation failed:', error);
      this.showLoadingSpinner = false;
    }
  }
  
  downloadExcel() {
    if (this.tempTable.length) {
      this.excelService.multiSheet(this.tempTable, this.tableName, this.dashboardName, this.fromDate,this.tableColumns,this.excelSheetOrder,this.selectedRoutine,this.paramjson);
    }
  }
  formTempValue(event) {
    this.formTemplateValue = event;
    if (this.formTemplateValue && this.formTemplateValue[2].hasOwnProperty('name') && this.formTemplateValue[2]['name'] == 'gis') {
      this.fromDate = event[0].controls['fdt'].value;
      this.toDate = event[0].controls['tdt'].value;
      this.resultJson = event[1];
      this.tempTable = [];
      this.tableName = [];
      this.tempChart = [];
      this.isLayoutChanged = false;
      this.refreshLayout();
    } else if (this.formTemplateValue[2] == 'pdf') {
      this.downloadPDF();
    } else if (this.formTemplateValue[2] == 'excel') {
      this.downloadExcel();
    }
  }
    fixClick() {
    console.log('')
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

  replaceKeys(template: string, data: any): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] || '');
  }
}
