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
import { Component, OnInit, DoCheck, Renderer2, ElementRef, ViewChild, ViewChildren, OnDestroy } from '@angular/core';
import { GridsterConfig,  CompactType } from 'angular-gridster2';
import { FormControl } from '@angular/forms';
import { CommonService, DashboardService, ChartjsService, WorkflowService } from '../../../shared';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardWidgetComponent } from '../../../shared/modules/entry-component/dashboard-widget/dashboard-widget.component';
import { ConfirmDialogComponent } from '../../../shared/modules/entry-component/layout-save/layout-save.component';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';         
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);
export interface ModelWidgets {
  widgetIds: string;
  layouts: Array<any>;

};

@Component({
  selector: 'app-dashboard-emp',
  templateUrl: './dashboard-emp.component.html',
  styleUrls: ['./dashboard-emp.component.scss']
})
export class DashboardEmpComponent implements OnInit, DoCheck, OnDestroy {
  // @ViewChildren('socialDistance') socialDistance: any;  // Observe #mycharts elements
  @ViewChildren('mycharts') allMyCanvas: any;  // Observe #mycharts
  @ViewChild('toggleButton') toggleButton: ElementRef;
  @ViewChild('widgets') widgets: ElementRef;
  @ViewChild('setting') setting: ElementRef;

  charts: any;    // Array to store all my charts

  math = Math;
  public dashboardDetails: any = {};
  public floorId;
  public floorView = false;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');

  // Gridster configurations
  public options: GridsterConfig;
  public layout = []; // GridsterItem[]
  public clayout = [];
  public defaultLayout = null;
  public isLayoutChanged = false;
  public currentWidget = new FormControl();
  public userId = localStorage.getItem(btoa('userId'));
  public roleId = localStorage.getItem('userlevel');
  public facilityId = localStorage.getItem(btoa('facilityId'));
  public dashboardId = null;
  public screenLock = true;
  public active_btn: any = [];
  public showSetting = false;
  public maxHeight = 500;
  public widgetValue: any = [];
  public isOpen = false;
  public isOptionOpen = false;
  public isOption: any = null;
  public isUpdateLayout = false;
  public preResponse = null;
  public isAutoRefresh = false;
  public autoInterval = null;
  public departmentId = null;
  public subscription: Subscription;
  public subscriptionDept: Subscription;
  public gridsterConfig: any;
  public configDefaultParams: any = {};
  enableEditDashboard = false;
  existPrivateUser = false;

  // ── V1 / V2 version toggle ──────────────────────────────────────────────────
  public selectedVersion: 'V1' | 'V2' = 'V1';
  /** Pre-built input object passed to DashboardV2EmpComponent when V2 is active. */
  public v2InputData: { preResponse: any; dashboardId: any; defaultLayout: string } | null = null;
  rawHtmlTemplate: any;
  chartPlugins = [ChartDataLabels];
  public staticReport = null;
  // currentYear: number;
  constructor(private readonly renderer: Renderer2, public dashboardService: DashboardService, public datepipe: DatePipe,
    private readonly commonService: CommonService, public ChartService: ChartjsService,
    public router: Router, private readonly snackbar: MatSnackBar, public dialog: MatDialog, public workflowService: WorkflowService,
    private readonly activatedRoute: ActivatedRoute, private readonly sanitizer: DomSanitizer) {
    // this.onResize(window.innerWidth);
    // this.getGridsterConfig();
    this.active_btn = this.commonService.getActivePermission('button');
    this.maxHeight = window.innerHeight - 70;
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.isOption === 'widgets') {
        if (!this.widgets.nativeElement['innerText'].includes(e.target['innerText']) && e.target['innerText'] !== 'widgets') {
          console.log('inside');
          this.isOption = null;
          this.isOptionOpen = false;
        }
      }
    });
  }

  ngOnInit() {
    this.existPrivateUser = 'privateUser' in localStorage;
    this.enableEditDashboard =  this.active_btn && this.active_btn.indexOf('BT_DSHE') > -1;
    this.enableEditDashboard = this.existPrivateUser ? false : this.enableEditDashboard;
    // this.currentYear = new Date().getFullYear();
    this.subscription = this.commonService.layout.subscribe((layout) => {
      if (layout['id'] !== undefined && !this.existPrivateUser) {
        this.getUserPreference('dashboard', layout['id']);
        this.getDashboardbyId(layout['id']);
        this.isOpen = false;
        this.screenLock = true;
      }
    });
    this.subscriptionDept = this.commonService.department.subscribe((dept) =>{
      this.departmentId = dept ? dept : null;
      this.bindLayout(this.layout);
    })
    this.gridsterConfiguration(this.screenLock);
    this.currentWidget.setValue([]);
    localStorage.setItem(btoa('menuCode'), 'MN_DB');
    this.activatedRoute.queryParams.subscribe(queryParams => {
      if(queryParams.hasOwnProperty('id')) {
        this.dashboardId = queryParams['id']
        this.getDashboardbyId(this.dashboardId);
      } else if(this.existPrivateUser){
        this.checkUserPreference();
      }
    });
    // this.getDashboardLayout();
    if(!this.existPrivateUser) {
    this.checkUserPreference();
    }
  }
  getGridsterConfig() {
    this.commonService.getConfigFile('gridster-config').subscribe((res) => {
      if(res.statusCode === 1){
        this.gridsterConfig = JSON.parse(res.results.contentObject);
      }
    });
  }
  checkUserPreference() {
    const roleId = localStorage.getItem('userlevel');
    const userId = localStorage.getItem(btoa('userId'));
    this.commonService.getPreference(userId, roleId).subscribe(res => {
      this.commonService.userPreference = res.results;
      const preference = res.results;
      if (preference != null && preference.hasOwnProperty('dashboard')) {
        this.dashboardId = preference.dashboard.value;
        this.commonService.setDashboard(this.dashboardId);
        this.getDashboardbyId(this.dashboardId);
      } else {
        this.getDashboardLayout();
      }
      if (preference != null && preference.hasOwnProperty('layoutAutoRefresh')) {
        let layoutRefresh = preference.layoutAutoRefresh.value;
        this.autoRefresh(JSON.parse(layoutRefresh))
      }
    });
  }
  getUserPreference(key = 'dashboard', value = this.dashboardId) {
    const preference = this.commonService.userPreference;
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
  getDashboardbyId(dashId) {
    this.dashboardDetails['update'] = true;
    const userId = localStorage.getItem(btoa('userId'));
    this.dashboardService.getDashboardbyIds(dashId, userId).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results[0];
        this.preResponse['layouts'].sort((a, b) => {
          if (a.y === b.y) {
            return a.x - b.x; 
          } else {
            return a.y - b.y; 
          }
        });
        this.defaultLayout = JSON.stringify(res.results[0].layouts);
        this.dashboardId = res.results[0].dashboardId;
        this.v2InputData = { preResponse: this.preResponse, dashboardId: this.dashboardId, defaultLayout: this.defaultLayout };
        this.setConfigDefaultParams(res.results[0].configValue);
        this.bindLayout(res.results[0].layouts);
      } else {
        this.openSnackbar(res.message, 'warning');
      }
    });
  }

  getDashboardLayout() {
    this.dashboardDetails['update'] = true;
    this.dashboardService.getCurrentDashboard(this.userId, this.roleId).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results;
        this.preResponse['layouts'].sort((a, b) => {
          if (a.y === b.y) {
            return a.x - b.x;
          } else {
            return a.y - b.y;
          }
        });
        this.defaultLayout = JSON.stringify(res.results.layouts);
        this.dashboardId = res.results.dashboardId;
        this.v2InputData = { preResponse: this.preResponse, dashboardId: this.dashboardId, defaultLayout: this.defaultLayout };
        this.setConfigDefaultParams(res.results.configValue);
        this.getUserPreference();
        this.bindLayout(res.results.layouts);
      }
    });
  }

  setConfigDefaultParams(configValue: any) {
    this.configDefaultParams = {};
    if (!configValue) {
      return;
    }
    const input = JSON.parse(configValue);
    this.staticReport  = input?.static;
    const filterInputs = input?.dynamicHeader?.filterInputs;
    if (!filterInputs) {
      return;
    }
    filterInputs.forEach(filter => {
      if (filter.id && filter.default != null) {
        let value = filter.default;
        if ((filter.name === 'fromDate' || filter.name === 'toDate') && !isNaN(Date.parse(value))) {
          value = this.datepipe.transform(value, 'yyyy-MM-dd');
        }
        this.configDefaultParams[filter.id] = value;
      }
    });
  }

  bindLayout(layout) {
    let config = null;
    const preResponse: any = this.preResponse;
    try {
      config = preResponse?.configValue ? JSON.parse(preResponse.configValue) : null;
    } catch (e) {
      config = null;
    }
    this.staticReport = config?.static ?? null;
    this.commonService.setDashboard(this.dashboardId);
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
      for (let i in layout) {
        try {
          this.layout.push(layout[i]);
          if (layout[i].isActive) {
            if (layout[i].code !== 'WD_DBAS' && layout[i].code !== 'WD_DBAST') {
              this.clayout.push(layout[i]);
              if (layout[i].code === 'WD_DBFP' || layout[i].code === 'WD_DBALERT') {
                this.dashboardDetails[layout[i].code] = { 'show': true };
                continue;
              }
              if (this.dashboardDetails['update']) {
                this.dashboardDetails[layout[i].code] = { 'show': false,'loading':true };
                // if (layout[i].modelTypeId === 'MT-QRY' || layout[i].modelTypeId === 'MT-RPT') {
                //   this.getDynamicChartData(layout[i]);
                // } else
                if (layout[i].modelTypeId === 'MT-API') {
                  this['callWidget_' + layout[i].code](layout[i].code);
                }
              }
            }
          }
        } catch (e) {
          console.log(layout[i].code + 'widget not found');
          console.log(e);
        }
      }
      layout = layout.filter(res => res.code !== 'WD_DBAS' && res.code !== 'WD_DBAST');
      let modelLayout = new Map<string, ModelWidgets>();

      for (let i in layout) {
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


      if (layout.length > 0) {
        this.currentWidget.setValue(this.clayout.map(val => val.code));
        this.widgetValue = this.clayout.map(val => val.code);
      }
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
    if (value) {
      if (!this.isAutoRefresh) {
        this.isAutoRefresh = value;
        this.autoInterval = setInterval((val) => this.refreshLayout(), environment.base_value.layout_autorefresh_time);
      }
    } else {
      clearInterval(this.autoInterval);
      this.isAutoRefresh = value;
    }
    if (typeof (value) == 'boolean') {
      value = value.toString();
    }
    this.getUserPreference('layoutAutoRefresh', value);
  }
  updateLayout(gridster, preLayout, type) {
    const layout = [];
    const grid = gridster.gridster.grid;

    for (let i in grid) {
      if (i != null) {
        layout.push(grid[i].item);
      }
    }
    // if (JSON.stringify(layout) ===  preLayout) {
    //   return;
    // }
    // const hiddenLayout = this.layout.filter(res => res.isActive === false);
    // for (const i in hiddenLayout) {
    //   if (i != null) {
    //     layout.push(hiddenLayout[i]);
    //   }
    // }
    // this.dashboardDetails['update'] = false;
    // this.bindLayout(layout);

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
      data: data, panelClass: 'medium-popup', disableClose: true
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
    this.commonService.setDashboard(this.dashboardId);
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
    if(jsonData.dashboardId == null) {
      jsonData.code = null;
    }
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
    for (let i in this.layout) {
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
    for (let i in modelWidgets.layouts) {
      layout = modelWidgets.layouts[i];
      if (res['results'].hasOwnProperty(layout.widgetId)) {
        this.dashboardDetails[layout.code] = { 'show': false,'loading':true };

        if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR' ||
          layout.widgetTypeId === 'WT-PIE' || layout.widgetTypeId === 'WT-LINE' || layout.widgetTypeId === 'WT-CHART') {

          this.dashboardDetails[layout.code]['styles'] = {};
          const chartValue = res.results[layout.widgetId];
          if (chartValue && chartValue.hasOwnProperty('options') && chartValue.options.hasOwnProperty('styles')) {
            this.dashboardDetails[layout.code]['styles'] = chartValue.options['styles'];
          }
          if (chartValue != null) {
            // if(chartValue.xAxisLabel && chartValue.xAxisLabel != ''){
            //   chartValue.options.options.scales.xAxes[0].scaleLabel.labelString = chartValue.xAxisLabel;
            // }else{
            //   chartValue.options.options.scales.xAxes[0].scaleLabel.labelString = '';
            //   chartValue.options.options.scales.xAxes[0].scaleLabel.display = false;
            // }
            // if(chartValue.yAxisLabel && chartValue.yAxisLabel != ''){
            //   chartValue.options.options.scales.yAxes[0].scaleLabel.labelString = chartValue.yAxisLabel;
            // }else{
            //   chartValue.options.options.scales.yAxes[0].scaleLabel.labelString = '';
            //   chartValue.options.options.scales.yAxes[0].scaleLabel.display = false;
            // }
            
            if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR') {
              const dataset = [];
              const chartBackground = [];
              if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
                this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
              }
              for (let i in chartValue.data) {
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
                // if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length == chartValue.data.length){
                //   chartBackground = chartValue.options['colorOptions'];
                // } else{
                //   chartBackground.push({backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey'})
                // }
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
              for (let i in chartValue.data) {
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
              let hoverBackgroundColor = [];
              let hoverBorderColor = []; 
              const pieBackgroundColor = [{ backgroundColor: [],hoverBackgroundColor: [], hoverBorderColor: [] }];
              if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
                this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
              }
              if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'][0].backgroundColor.length) {
                for (let i in chartValue.data) {
                  if (chartValue.options['colorOptions'][0].backgroundColor[i] !== undefined) {
                    pieBackgroundColor[0].backgroundColor.push(chartValue.options['colorOptions'][0].backgroundColor[i]);
                    if(chartValue.options['colorOptions'][0].hasOwnProperty('hoverBackgroundColor')) {
                      pieBackgroundColor[0].hoverBackgroundColor.push(chartValue.options['colorOptions'][0].hoverBackgroundColor[i]);
                    }
                    if(chartValue.options['colorOptions'][0].hasOwnProperty('hoverBorderColor')) {
                      pieBackgroundColor[0].hoverBorderColor.push(chartValue.options['colorOptions'][0].hoverBorderColor[i]);
                    }
                  } else if (chartValue.options['colorOptions'][0].backgroundColor[i] === undefined) {
                    pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                    pieBackgroundColor[0].hoverBackgroundColor.push(this.commonService.getRandomColor());
                    pieBackgroundColor[0].hoverBorderColor.push(this.commonService.getRandomColor());
                  }
                }
              } else {
                for (let i in chartValue.data) {
                  pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
                  pieBackgroundColor[0].hoverBackgroundColor.push(this.commonService.getRandomColor());
                  pieBackgroundColor[0].hoverBorderColor.push(this.commonService.getRandomColor());


                }
              }
              chartBackground = pieBackgroundColor;
              if(chartValue.options.hasOwnProperty('colorMap')) {
                let colorDetails = chartValue.options.colorMap;
                for (let i = 0; i <  Object.keys(colorDetails).length; i++) {
                  let labelKey = Object.keys(colorDetails)[i]
                  let labelIndex = chartValue.labels.indexOf(labelKey)
                  chartBackground[0]['backgroundColor'][labelIndex] = colorDetails[labelKey];
                  chartBackground[0]['hoverBackgroundColor'][labelIndex] = colorDetails[labelKey];
                  chartBackground[0]['hoverBorderColor'][labelIndex] = colorDetails[labelKey];
                }
              }
              this.bindDynamicCharts(layout.code, 'pie', chartValue.data, chartValue.labels, 'Count', chartBackground, 'Zone', 'Count',
                chartValue.options.options);
            } else if (layout.widgetTypeId === 'WT-CHART') {
              this.dynamicChartBind(layout, chartValue)
            }
          }
        }

        else if (layout.widgetTypeId === 'WT-TABLE') {
          // this.dashboardDetails[layout.code]['styles'] = {
          //   'th' : {'background': 'red', 'color' : 'white', 'font-size' : '22px'},
          //   'tr' : {'background': 'red', 'color' : 'white'}
          // };
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
            // if (tableData.options.hasOwnProperty('filterBy')) {
            //   this.dashboardDetails[layout.code]['filterBy'] = tableData.options['filterBy'];
            //   if (tableData['options'].hasOwnProperty('filterBy') && tableData['options']['filterBy'].hasOwnProperty('enabled')) {
            //     this.dashboardDetails[layout.code]['filterBy']['option'] = tableData['data'].map(val => val[tableData.options['filterBy']['key']])
            //   }
            // }
            
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
            this.dashboardDetails[layout.code]['tableStyle'] = {};
            if (tableData.options.options) {
              this.dashboardDetails[layout.code]['tableStyle'] = tableData.options.options;
            }
            this.dashboardDetails[layout.code]['show'] = true;
          }

        } else if (layout.widgetTypeId === 'WT-CARD') {

          const cardData = res.results[layout.widgetId];
          if (cardData != null) {
            this.dashboardDetails[layout.code]['data']  = cardData["data"];
            this.dashboardDetails[layout.code]['options']  = res.results[layout.widgetId].options;
              if (cardData.hasOwnProperty('model-mapping') && cardData['model-mapping']?.repeatable ) {
                const cardTitle = cardData.options?.text || '';
                const loopKeys = (cardData['model-mapping']?.loopKey || '')
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
            if (options.backgroundColor) {
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

        }
        if(res.results[layout.widgetId] && res.results[layout.widgetId].hasOwnProperty('redirect')){
            this.dashboardDetails[layout.code]['redirect'] = res.results[layout.widgetId]['redirect'];
        }
      }
      this.dashboardDetails[layout.code]['loading'] = false;
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
      let modelInput = null;
      let layout = value[0];
      const widgetParam = [];
      // merge inputParams and modelInputParams by param key so an id present in either one isn't dropped
      const inputParamTokens = layout.inputParams ? layout.inputParams.split(',') : [];
      const modelInputParamTokens = layout.modelInputParams ? layout.modelInputParams.split(',') : [];
      const seenParamKeys = new Set<string>();
      const inputParam = [];
      [...inputParamTokens, ...modelInputParamTokens].forEach(token => {
        const paramKey = token.split('=')[0];
        if (paramKey && !seenParamKeys.has(paramKey)) {
          seenParamKeys.add(paramKey);
          inputParam.push(token);
        }
      });
      let layoutParam = layout.widgetParam ? layout.widgetParam.split(',') : [];
      if (layout.inputParams && inputParam.length) {
        for (let i in inputParam) {
          if (inputParam[i] === 'fid' || inputParam[i] === 'facility_id') {
            if (parseInt(i) === 0) {
              widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
            } else {
              widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('facilityId')));
            }
          } else if (inputParam[i] === 'fdt') {
            if (parseInt(i) === 0) {
              widgetParam.push(inputParam[i] + '=' + this.selectedDate);
            } else {
              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate);
            }
          } else if (inputParam[i] === 'tdt') {
            if (parseInt(i) === 0) {
              widgetParam.push(inputParam[i] + '=' + this.selectedDate);
            } else {
              widgetParam.push('&' + inputParam[i] + '=' + this.selectedDate);
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
          } else if (inputParam[i] === 'deptId') {
            if (widgetParam.length === 0) {
              widgetParam.push(inputParam[i] + '=' + this.departmentId);
            } else {
              widgetParam.push('&' + inputParam[i] + '=' + this.departmentId);
            }
          } else if(inputParam[i] === 'logId'){
            if (widgetParam.length === 0) {
                widgetParam.push(inputParam[i] + '=' + localStorage.getItem(btoa('loginId')));
            } else {
                widgetParam.push('&' + inputParam[i] + '=' + localStorage.getItem(btoa('loginId')));
            }
          } else if (this.configDefaultParams?.hasOwnProperty(inputParam[i])) {
            if (widgetParam.length === 0) {
              widgetParam.push(inputParam[i] + '=' + this.configDefaultParams[inputParam[i]]);
            } else {
              widgetParam.push('&' + inputParam[i] + '=' + this.configDefaultParams[inputParam[i]]);
            }
          } else if (inputParam[i].includes('=')) {
            if (parseInt(i) === 0) {
              widgetParam.push(inputParam[i]);
            } else {
              widgetParam.push('&' + inputParam[i]);
            }
          }
        }
      }
      if (layout.widgetParam && layoutParam.length) {
        for (let i in layoutParam) {
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
      // const widgetFilter = JSON.parse(layout.widgetOptions);
      const widgetFilter = layout.options;
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
            if(widgetFilter['filters'][filter].hasOwnProperty('selected_value') != null){
              this.getWidgetFilterInput(widgetFilter['filters']);
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

    // if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR' ||
    //     layout.widgetTypeId === 'WT-PIE' || layout.widgetTypeId === 'WT-LINE') {
    //   this.dashboardService.getDashboardWidgetData(layout.widgetId, modelInput).subscribe(res => {
    //     if (res.statusCode === 1) {
    //       const chartValue = res.results[layout.widgetId];
    //       if (chartValue != null) {
    //         // if(chartValue.xAxisLabel && chartValue.xAxisLabel != ''){
    //         //   chartValue.options.options.scales.xAxes[0].scaleLabel.labelString = chartValue.xAxisLabel;
    //         // }else{
    //         //   chartValue.options.options.scales.xAxes[0].scaleLabel.labelString = '';
    //         //   chartValue.options.options.scales.xAxes[0].scaleLabel.display = false;
    //         // }
    //         // if(chartValue.yAxisLabel && chartValue.yAxisLabel != ''){
    //         //   chartValue.options.options.scales.yAxes[0].scaleLabel.labelString = chartValue.yAxisLabel;
    //         // }else{
    //         //   chartValue.options.options.scales.yAxes[0].scaleLabel.labelString = '';
    //         //   chartValue.options.options.scales.yAxes[0].scaleLabel.display = false;
    //         // }
    //         if (layout.widgetTypeId === 'WT-BAR' || layout.widgetTypeId === 'WT-HBAR') {
    //           const dataset = [];
    //           const chartBackground = [];
    //           if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
    //             this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
    //           }
    //           for (let i = 0 ; i < chartValue.data.length; i++) {
    //             dataset.push({label: chartValue.data[i].label, data: chartValue.data[i].data});
    //             if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length) {
    //               if (chartValue.options['colorOptions'][i] !== undefined) {
    //                 chartBackground.push(chartValue.options['colorOptions'][i]);
    //               } else if (chartValue.options['colorOptions'][i] === undefined) {
    //                 chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
    //               }
    //             } else {
    //               chartBackground.push({ backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey' });
    //             }
    //             // if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length == chartValue.data.length){
    //             //   chartBackground = chartValue.options['colorOptions'];
    //             // } else{
    //             //   chartBackground.push({backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey'})
    //             // }
    //           }
    //           if (layout.widgetTypeId === 'WT-BAR') {
    //           this.bindDynamicCharts(layout.code, 'bar', dataset, chartValue.labels, null, chartBackground , 'Date', 'Count',
    //               chartValue.options.options);
    //           } else if (layout.widgetTypeId === 'WT-HBAR') {
    //             this.bindDynamicCharts(layout.code, 'horizontalBar', dataset, chartValue.labels, null, chartBackground , 'Date', 'Count',
    //               chartValue.options.options);
    //           }
    //         } else if (layout.widgetTypeId === 'WT-LINE') {
    //           const dataset = [];
    //           const chartBackground = [];
    //           if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
    //             this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
    //           }
    //           for (let i = 0 ; i < chartValue.data.length; i++) {
    //             dataset.push({label: chartValue.data[i].label, data: chartValue.data[i].data, fill: false});
    //             if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length) {
    //               if (chartValue.options['colorOptions'][i] !== undefined) {
    //                 chartBackground.push(chartValue.options['colorOptions'][i]);
    //               } else if (chartValue.options['colorOptions'][i] === undefined) {
    //                 chartBackground.push({ borderColor: this.commonService.getRandomColor()});
    //               }
    //             } else {
    //                 chartBackground.push({ borderColor: this.commonService.getRandomColor()});
    //             }
    //           }
    //           this.bindDynamicCharts(layout.code, 'line', dataset, chartValue.labels, null, chartBackground, 'Date', 'Count',
    //               chartValue.options.options);
    //         } else if (layout.widgetTypeId === 'WT-PIE') {
    //           let chartBackground = [];
    //           const pieBackgroundColor = [{backgroundColor: []}];
    //           if (chartValue.options.hasOwnProperty('text') && chartValue.options['text'] !== '') {
    //             this.dashboardDetails[layout.code]['text'] = chartValue.options['text'];
    //           }
    //           if (chartValue.options['colorOptions'] && chartValue.options['colorOptions'][0].backgroundColor.length) {
    //           for (let i = 0; i < chartValue.data.length; i++) {
    //             if (chartValue.options['colorOptions'][0].backgroundColor[i] !== undefined) {
    //               pieBackgroundColor[0].backgroundColor.push(chartValue.options['colorOptions'][0].backgroundColor[i]);
    //             } else if (chartValue.options['colorOptions'][0].backgroundColor[i] === undefined) {
    //               pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
    //             }
    //             }
    //           } else {
    //             for (let i = 0; i < chartValue.data.length; i++) {
    //               pieBackgroundColor[0].backgroundColor.push(this.commonService.getRandomColor());
    //             }
    //           }
    //           chartBackground = pieBackgroundColor;
    //           this.bindDynamicCharts(layout.code, 'pie', chartValue.data , chartValue.labels, 'Count', chartBackground , 'Zone', 'Count',
    //             chartValue.options.options);
    //         }
    //       }
    //     }
    //   });
    // } else if (layout.widgetTypeId === 'WT-TABLE') {
    //   this.dashboardService.getDashboardWidgetData(layout.widgetId, modelInput).subscribe(res => {
    //     if (res.statusCode === 1) {
    //         const tableData = res.results[layout.widgetId];
    //         if (tableData != null) {
    //         if (layout.code === 'WD_DBHP') {
    //           let str = JSON.stringify(tableData.data);
    //           str = str.replace(/\"Avg TAT\":/g, "\"Avg. Time(mins)\":");
    //           tableData.data = JSON.parse(str);

    //           str = JSON.stringify(tableData.data);
    //           str = str.replace(/\"Total Patients Enrolled\":/g, "\"Patient Count\":");
    //           tableData.data = JSON.parse(str);
    //         }
    //         if (tableData.options.hasOwnProperty('text') && tableData.options['text'] !== '') {
    //           this.dashboardDetails[layout.code]['text'] = tableData.options['text'];
    //         }

    //         this.dashboardDetails[layout.code]['label'] = null;
    //         if  ('model-mapping' in tableData && 'lables' in tableData['model-mapping']
    //             && tableData['model-mapping'] ['lables'].length > 0) {
    //               this.dashboardDetails[layout.code]['label'] = tableData['model-mapping'] ['lables'];
    //         }


    //         this.dashboardDetails[layout.code]['type'] = 'table';
    //         this.dashboardDetails[layout.code]['data'] = tableData.data;
    //         if (tableData.labels) {
    //           this.dashboardDetails[layout.code]['column'] = tableData.labels;
    //         } else if (tableData.label) {
    //           this.dashboardDetails[layout.code]['column'] = tableData.label;
    //         }
    //         this.dashboardDetails[layout.code]['tableStyle'] = {};
    //         if (tableData.options.options) {
    //           this.dashboardDetails[layout.code]['tableStyle'] = tableData.options.options;
    //         }
    //         this.dashboardDetails[layout.code]['show'] = true;
    //       }
    //     }});
    // } else if (layout.widgetTypeId === 'WT-CARD') {
    //   this.dashboardService.getDashboardWidgetData(layout.widgetId, modelInput).subscribe(res => {
    //     if (res.statusCode === 1) {
    //       const cardData = res.results[layout.widgetId];
    //       if (cardData != null) {
    //         if (cardData.options.hasOwnProperty('text') && cardData.options['text'] !== '') {
    //           cardData.widgetName = cardData.options['text'];
    //         }
    //       this.dashboardDetails[layout.code]['type'] = 'card';
    //       this.dashboardDetails[layout.code]['show'] = true;
    //       const options = res.results[layout.widgetId].options.options;
    //       if (options.backgroundColor) {
    //         if (options.icon === '') {
    //           this.dashboardDetails[layout.code]['maxCol'] = options.col;
    //           this.dashboardDetails[layout.code]['detail'] = [
    //             {'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color,
    //             'icon' : '', 'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : layout.code,
    //             'title' : cardData.widgetName, 'data' : {data: cardData.data, label: cardData.labels}}
    //           ];
    //         } else {
    //           this.dashboardDetails[layout.code]['maxCol'] = options.col;
    //           this.dashboardDetails[layout.code]['detail'] = [
    //             { 'type' : 'text', 'col': options.col, 'bg-color' : options.backgroundColor, 'color' : options.color,
    //             'icon' : options.icon, 'iconWidth': options.iconWidth, 'fontSize': options.fontSize,
    //             'fontColor': options.fontColor, 'id' : layout.code,
    //             'title' : cardData.widgetName, 'data' : cardData.data[0], 'label' : cardData.labels[0]}
    //           ];
    //         }
    //       } else {
    //         this.dashboardDetails[layout.code]['maxCol'] = 3;
    //         this.dashboardDetails[layout.code]['detail'] = [
    //           {'type' : 'text', 'col': 3, 'bg-color' : '#58edd7', 'color' : '#656968', 'icon' : '', 'fontSize': '25px',
    //           'fontColor': '#4c4949', 'id' : layout.code, 'title' : cardData.widgetName,
    //           'data' : {data: cardData.data, label: cardData.labels}}
    //         ];
    //       }
    //     }
    //     }
    //   });
    // } else if (layout.widgetTypeId === 'WT-HDR') {
    //   this.dashboardService.getDashboardWidgetData(layout.widgetId, modelInput).subscribe(res => {
    //     if (res.statusCode === 1) {
    //       const headerData = res.results[layout.widgetId];
    //       if (headerData != null) {
    //         if (headerData.options.hasOwnProperty('text') && headerData.options['text'] !== '') {
    //           headerData.widgetName = headerData.options['text'];
    //         }
    //       this.dashboardDetails[layout.code]['type'] = 'header';
    //       this.dashboardDetails[layout.code]['show'] = true;
    //       const options = res.results[layout.widgetId].options.options;
    //       if (options.backgroundColor) {
    //         this.dashboardDetails[layout.code]['detail'] = [{
    //           'bg-color' : options.backgroundColor, 'color' : options.color,
    //           'icon' : options.icon !== '' ? options.icon : '', 'iconWidth': options.iconWidth,
    //           'fontSize': options.fontSize, 'fontColor': options.fontColor, 'id' : layout.code, 'title' : headerData.widgetName
    //         }];
    //       } else {
    //         this.dashboardDetails[layout.code]['detail'] = [{
    //           'bg-color': '#b1dafcc9', 'color' : '#656968', 'icon' : '', 'fontSize': '25px',
    //           'fontColor': '#4c4949', 'id' : layout.code, 'title' : headerData.widgetName
    //         }];
    //       }
    //       }
    //     }
    //   });
    // }
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
      if(updatedModelInput || updatedModelInput ==  null){
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
                    // if(chartValue.options['colorOptions'] && chartValue.options['colorOptions'].length == chartValue.data.length){
                    //   chartBackground = chartValue.options['colorOptions'];
                    // } else{
                    //   chartBackground.push({backgroundColor: this.commonService.getRandomColor(), borderColor: 'grey'})
                    // }
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
                        if(this.dashboardDetails[data[0]['code']]['filters'][j]['resData'].length) {
                          this.dashboardDetails[data[0]['code']]['filters'][j]['resData'] = [...new Set(this.dashboardDetails[data[0]['code']]['filters'][j]['resData'])]
                        }
                      }
                    }
                }
              } else{
                // this.dashboardDetails[data[0]['code']]['show'] = false;
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
  public callWidget_WD_DBPWCT(code) {
    this.dashboardDetails[code]['type'] = 'table';
    const param = '/fdt=' + this.selectedDate;
    this.commonService.getReportData('hc_test_summary', param).subscribe(res => {
      let data = res.results.data;
      let str = JSON.stringify(data);
      str = str.replace(/\"Test Name\":/g, "\"Name\":");
      data = JSON.parse(str);
      this.dashboardDetails[code]['data'] = data;
      this.dashboardDetails[code]['column'] = ['Name', 'No Of Patients', 'Avg wait time(min)'];
      this.dashboardDetails[code]['tableStyle'] = {};
      this.dashboardDetails[code]['styles'] = {
        'th': '',
        'tr': ''
      };
      this.dashboardDetails[code]['show'] = true;
    });
  }

  public callWidget_WD_DBHP(code) {
    this.dashboardDetails[code]['type'] = 'table';
    const param = '/fdt=' + this.selectedDate;
    this.commonService.getReportData('hc_plan_summary2', param).subscribe(res => {
      let data = res.results.data;
      let str = JSON.stringify(data);
      str = str.replace(/\"Avg TAT\":/g, "\"Avg. Time(mins)\":");
      data = JSON.parse(str);
      str = JSON.stringify(data);
      str = str.replace(/\"Total Patients Enrolled\":/g, "\"Patient Count\":");
      data = JSON.parse(str);
      this.dashboardDetails[code]['data'] = data;
      this.dashboardDetails[code]['column'] = ['Package', 'Patient Count', 'Avg. Time(mins)'];
      this.dashboardDetails[code]['styles'] = {
        'th': '',
        'tr': ''
      };
      this.dashboardDetails[code]['show'] = true;
    });
  }
  // TABLE WIDGET END

  public callWidget_WD_DBPATSUM(code) {
    this.dashboardService.getPatientSummary().subscribe((res) => {
      const result = res.results.data;
      this.dashboardDetails[code]['type'] = 'widget1';
      this.dashboardDetails[code]['res'] = result;
      this.dashboardDetails[code]['key'] = Object.keys(result);
      this.dashboardDetails[code]['selected'] = 'HC';
      this.dashboardDetails[code]['show'] = true;
    });
  }
  public callWidget_WD_DBEMPSDS(code) {
    const param = '/fdt=' + this.selectedDate;
    this.commonService.getReportData('emp-sd-agg', param).subscribe(res => {
      const val = res.results.data;
      // data binding for multi widgets
      this.dashboardDetails[code]['type'] = 'widget2';
      this.dashboardDetails[code]['detail'] = [
        {
          'type': 'text', 'col': 2, 'id': 'strength', 'title': 'Employee Strength',
          'total': parseInt(val['Employee Total'], 10), 'present': parseInt(val['Employee present'], 10),
          'percentage': val['Employee Strength'] + '%'
        },

        {
          'type': 'line', 'col': 3, 'id': 'complaint', 'title': 'Compliance',
          'total': parseInt(val['Employee present'], 10), 'present': parseInt(val['SD Compliance'], 10),
          'percentage': val['SD Compliance%'] + '%',
          'chart': this.ChartService.getDataset(val['dt'], val['SD Compliance trend'], '#8CEDCB'),
          'options': this.ChartService.getOption('', ''),
          'color': [{ backgroundColor: 'rgba(10, 255, 84, 0.5)', 'borderColor': '#08be48' }]
        },
        {
          'type': 'line', 'col': 3, 'id': 'nonComplaint', 'title': 'Non Compliance',
          'total': parseInt(val['Employee present'], 10), 'present': parseInt(val['SD Non-Compliance'], 10),
          'percentage': val['SD Non-Compliance%'] + '%',
          'chart': this.ChartService.getDataset(val['dt'], val['SD Non-Compliance trend'], '#8CEDCB'),
          'options': this.ChartService.getOption('', ''),
          'color': [{ backgroundColor: 'rgba(255, 186, 10, 0.5)', 'borderColor': '#FFB347' }]
        },
        {
          'type': 'line', 'col': 3, 'id': 'quarantined', 'title': 'Quarantined',
          'total': parseInt(val['Employee present'], 10), 'present': parseInt(val['Tot Quarantine Emps'], 10), '': 0,
          'chart': this.ChartService.getDataset(val['dt'], val['Tot Quarantine Emps trend'], '#8CEDCB'),
          'options': this.ChartService.getOption('', ''),
          'color': [{ backgroundColor: 'rgba(255, 75, 10, 0.5)', 'borderColor': '#f0190a' }]
        },
        {
          'type': 'text', 'col': 2, 'id': 'summary', 'title': 'Summary', 'contact': val['Contacts'],
          'close_contact': val['Tot Close Contacts'], 'no_expose': val['No Expose']
        }
      ];
      this.dashboardDetails[code]['maxCol'] = 13;
      this.dashboardDetails[code]['show'] = true;
    });

  }

  // CHARTS WIDGET START

  public callWidget_WD_DBLUZ(code) {
    this.dashboardDetails[code]['type'] = 'table';
    const param = '/fdt=' + this.selectedDate;
    this.commonService.getReportData('topfive-coaster', param).subscribe(res => {
      const data = res.results.data;
      this.dashboardDetails[code]['data'] = data;
      this.dashboardDetails[code]['column'] = ['Name', 'Mobile'];
      this.dashboardDetails[code]['show'] = true;
    });
  }

  goToReport(code) {
    if (code === 'WD_DBLUZ') {
      this.router.navigate(['/ovitag/analytic-insights/patient-hc'], { queryParams: { report: 'coaster-details' } });
    }
  }
  dynamicChartBind(layout, chartValue) {
    console.log(layout.code)
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
    for (let i in chartValue[key]) {
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
    }
    if(this.dashboardDetails[code]['datasets'].length && color.length) {
      for(let i in this.dashboardDetails[code]['datasets']) {
        if(color[i]) {
          this.dashboardDetails[code]['datasets'][i]['backgroundColor'] = color[i]['backgroundColor'];
          this.dashboardDetails[code]['datasets'][i]['borderColor'] = color[i]['borderColor'];
          this.dashboardDetails[code]['datasets'][i]['hoverBackgroundColor'] = color[i]['hoverBackgroundColor'];
          this.dashboardDetails[code]['datasets'][i]['hoverBorderColor'] = color[i]['hoverBorderColor'];

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
  public bindCharts(code, chartType, dataValue, labels, label, color, xName, yName, legend = false) {
    const showGrid = chartType !== 'pie';
    // let showLegend = chartType == 'pie';

    this.dashboardDetails[code]['type'] = 'chart';
    this.dashboardDetails[code]['chartType'] = chartType;
    this.dashboardDetails[code]['labels'] = labels;
    this.dashboardDetails[code]['datasets'] = chartType !== 'pie' ? dataValue : [{ label: label, data: dataValue }];
    this.dashboardDetails[code]['colors'] = color == null ? [{}] : [{ backgroundColor: color }];
    this.dashboardDetails[code]['options'] = this.ChartService.getOption(xName, yName, legend, showGrid);
    // this.dashboardDetails[code]['legend'] = legend;
    this.dashboardDetails[code]['show'] = true;
    // console.log(this.dashboardDetails[code])
  }
  public gridsterConfiguration(lockOption) {
    if(this.gridsterConfig){
      this.options = this.gridsterConfig;
      this.options['pushItems'] =  !lockOption;
      this.options['compactType'] =  CompactType.None;
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
    }else{
      this.options = {
        minCols: 6,
        maxCols: 500 * 500,
        useTransformPositioning: true,
        minRows: 4,
        maxRows: 500 * 500,
        minItemRows: 1,
        maxItemRows: 500 * 500,
        minItemCols: 1,
        maxItemCols: 500 * 500,
        fixedRowHeight: 80,
        fixedColWidth: 80,
        margin: 15,
        mobileBreakpoint: 350,
        mobileModeEnabled: true,
        gridType: 'scrollVertical',
        draggable: {
          enabled: !lockOption,
          stop: function (item, gridsterItem, event) {
            const preLayout = JSON.stringify(this.layout);
            setTimeout(() => this.updateLayout(gridsterItem, preLayout, 'drag'), 800);
          }.bind(this)
        },
        resizable: {
          enabled: !lockOption,
          stop: function (item, gridsterItem, event) {
            const preLayout = JSON.stringify(this.layout);
            setTimeout(() => this.updateLayout(gridsterItem, preLayout, 'resize'), 800);
          }.bind(this),
          handles: { n: false, e: false, w: false, s: false, ne: true, se: true, sw: true, nw: true }
        },
        pushItems: !lockOption,
        pushDirections: { north: false, east: false, south: false, west: false },
        displayGrid: 'onDrag&Resize', // ‘always’, ‘onDrag&Resize’, ‘none’
        compactType: CompactType.None,
        swap: false,
        swapWhileDragging: false,
        compact: false
      };
    }
  }

  getFloorId(data) {
    const e = eval;
    const floorDetail = e('[' + data + ']');
    this.floorId = floorDetail[0].id;
  }
  ngDoCheck() {
    if (this.commonService.contextChanged === true && this.dashboardId != null) {
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
  downloadPDF() {
    let node = document.getElementById('dashTitle');
    let img;
    let filename;
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
            doc = new jsPDF('l', 'px', [pdfWidth, pdfHeight]);
          } else {
            doc = new jsPDF('p', 'px', [pdfWidth, pdfHeight]);
          }
          let width = doc.internal.pageSize.getWidth();
          let height = doc.internal.pageSize.getHeight();
          // doc.addImage(this.imageData,'PNG',10,10)
          doc.text("Dashboard", 450, 35);//x,y
          doc.addImage(newImage, 'PNG', 10, 100, width, height);
          filename = 'Dashboard' + '.pdf';
          doc.save(filename);
        };
      })
      .catch(function (error) { });
  }
  serverPdfDownload(){
    if(this.dashboardId) {
      let userId = localStorage.getItem(btoa('userId'));
      let customerId = localStorage.getItem('customerId');
      window.location.href = 'http://ec2-13-233-192-43.ap-south-1.compute.amazonaws.com:8000/pdfreport?did=' + this.dashboardId + '&uid=' + userId + '&cid=' + customerId;
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
}
