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
import { Component, OnInit } from '@angular/core';
import { MatDialog, } from '@angular/material/dialog';
import { ExcelService, CommonService, PdfService, ChartService, ConfigurationService, ReportService} from '../../../shared';
import { MaintenanceReportModel, MaintenanceReportModelCols, MaintenanceReportModelRows, MaintenanceReportModelId } from './maintenance-report.model';
import { UntypedFormGroup, UntypedFormBuilder,  UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {Chart} from 'chart.js'
import 'chartjs-plugin-datalabels';
import {MaintenanceViewmoreComponent} from '../../../shared/modules/entry-component/maintenance-viewmore/maintenance-viewmore.component';

@Component({
  selector: 'app-maintenance-report',
  templateUrl: './maintenance-report.component.html',
  styleUrls: ['./maintenance-report.component.scss']
})
export class MaintenanceReportComponent implements OnInit {

  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');

  public  gridCols: any;
  public  gridCols1: any;
  public  gridCols2: any;
  public WidgetList: Array<any> = [];
  public maintenanceReportModel: MaintenanceReportModel;
  public maintenanceReportModelCols: MaintenanceReportModelCols;
  public maintenanceReportModelRows: MaintenanceReportModelRows;
  public maintenanceReportModelId: MaintenanceReportModelId;
  public reportList : any;
  headercolor = '#3f586a';
  public tagTypelist: any[];
  public selectedTagType : any;

  public exportData: any = [];
  public chartImage: any;
  public tagTypeChart: Chart; tagTypeChartDataset: Array<any> = [];
  public readerTypeChart: Chart; readerTypeChartDataset: Array<any> = [];
  bgcolor: string;
  pagebgcolor: string;

  MR_ACS1_doughnutLabels: string[]; MR_ACS1_doughnutData: any[]; MR_ACS1_doughnutType: string; MR_ACS1_doughnutOption: any; MR_ACS1_doughnutColors: Array<any>; MR_ACS1_doughnutLegend: boolean;
  MR_ACS2_doughnutLabels: string[]; MR_ACS2_doughnutData: any[]; MR_ACS2_doughnutType: string; MR_ACS2_doughnutOption: any; MR_ACS2_doughnutColors: Array<any>; MR_ACS2_doughnutLegend: boolean;
  MR_ACS3_doughnutLabels: string[]; MR_ACS3_doughnutData: any[]; MR_ACS3_doughnutType: string; MR_ACS3_doughnutOption: any; MR_ACS3_doughnutColors: Array<any>; MR_ACS3_doughnutLegend: boolean;
  MR_ACS4_doughnutLabels: string[]; MR_ACS4_doughnutData: any[]; MR_ACS4_doughnutType: string; MR_ACS4_doughnutOption: any; MR_ACS4_doughnutColors: Array<any>; MR_ACS4_doughnutLegend: boolean;
  MR_ACS5_doughnutLabels: string[]; MR_ACS5_doughnutData: any[]; MR_ACS5_doughnutType: string; MR_ACS5_doughnutOption: any; MR_ACS5_doughnutColors: Array<any>; MR_ACS5_doughnutLegend: boolean;
  MR_ARS1_pieChartOptions: any; MR_ARS1_pieChartLabels: string[]; MR_ARS1_pieChartType: string; MR_ARS1_pieChartColors: Array<any>; MR_ARS1_pieChartData: any[] ; MR_ARS1_pieLegend: boolean; MR_ARS1_pieHeader: string;
  MR_ARS2_pieChartOptions: any; MR_ARS2_pieChartLabels: string[]; MR_ARS2_pieChartType: string; MR_ARS2_pieChartColors: Array<any>; MR_ARS2_pieChartData: any[] ; MR_ARS2_pieLegend: boolean; MR_ARS2_pieHeader: string;
  MR_ARS3_pieChartOptions: any; MR_ARS3_pieChartLabels: string[]; MR_ARS3_pieChartType: string; MR_ARS3_pieChartColors: Array<any>; MR_ARS3_pieChartData: any[] ; MR_ARS3_pieLegend: boolean; MR_ARS3_pieHeader: string;
  MR_ARS4_pieChartOptions: any; MR_ARS4_pieChartLabels: string[]; MR_ARS4_pieChartType: string; MR_ARS4_pieChartColors: Array<any>; MR_ARS4_pieChartData: any[] ; MR_ARS4_pieLegend: boolean; MR_ARS5_pieHeader: string;
  MR_ARS5_pieChartOptions: any; MR_ARS5_pieChartLabels: string[]; MR_ARS5_pieChartType: string; MR_ARS5_pieChartColors: Array<any>; MR_ARS5_pieChartData: any[] ; MR_ARS5_pieLegend: boolean; MR_ARS4_pieHeader: string;
  MR_ATBS_barChartOptions: any; MR_ATBS_barChartLabels: string[]; MR_ATBS_barChartType: string; MR_ATBS_barChartColors: Array<any>; MR_ATBS_barChartData: any[] ; MR_ATBS_barLegend: boolean; MR_ATBS_barHeader: string;
  MR_AGD1_barChartOptions: any; MR_AGD1_barChartLabels: string[]; MR_AGD1_barChartType: string; MR_AGD1_barChartColors: Array<any>; MR_AGD1_barChartData: any[] ; MR_AGD1_barLegend: boolean; MR_AGD1_barHeader: string;
  MR_AGD2_barChartOptions: any; MR_AGD2_barChartLabels: string[]; MR_AGD2_barChartType: string; MR_AGD2_barChartColors: Array<any>; MR_AGD2_barChartData: any[] ; MR_AGD2_barLegend: boolean; MR_AGD2_barHeader: string;
  public tagLength = 0; tagStatus: any = [];
  public readerLength = 0; readerStatus: any = [];
  public gatewayLength = 0; gatewayStatus: any = [];
  public HCselected = 'maintenancerep';
  public selectedReport : any = new UntypedFormControl();
  public reportForm: UntypedFormGroup;
  public reportData : any = [];
  public param : any;
  public selected : any;
  public date: any = new Date();
  public today = new Date();
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');

  constructor(public configService: ConfigurationService, public reportService: ReportService,public pdfService: PdfService, public datepipe: DatePipe, public dialog: MatDialog, public chartService : ChartService,public fb: UntypedFormBuilder,public CommonService: CommonService, public ExcelService: ExcelService) {
    this.maintenanceReportModel = new MaintenanceReportModel();
    this.maintenanceReportModelCols = new MaintenanceReportModelCols();
    this.maintenanceReportModelRows = new MaintenanceReportModelRows();
    this.maintenanceReportModelId = new MaintenanceReportModelId();
    let list = Object.keys(this.maintenanceReportModel);
    for (let i = 0; list.length >= i; i++) {
      this.WidgetList.push({ id: list[i], cols: this.maintenanceReportModelCols[list[i]], rows: this.maintenanceReportModelRows[list[i]], class: this.maintenanceReportModelId[list[i]]});
    }
    this.getReportList();
      // this.getMaintenanceDetails();
   }

   ngOnInit() {
    this.getReports(this.HCselected);
    this.buildForm();
    if ('userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }

    this.gridCols = (window.innerWidth <= 767) ? 1 : 4;
    this.gridCols1 = (window.innerWidth <= 767) ? 1 : 3;
    this.gridCols2 = (window.innerWidth <= 767) ? 1 : 5;
    if (window.innerWidth <= 767) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        if (this.maintenanceReportModelCols[this.WidgetList[i].id] > 1) {
          this.maintenanceReportModelCols[this.WidgetList[i].id] = 1;

        }
        if (this.maintenanceReportModelRows[this.WidgetList[i].id] == 3) {
          this.maintenanceReportModelRows[this.WidgetList[i].id] = 2;
        }


      }
      this.maintenanceReportModelRows['MR_ACS'] = 10;
        this.maintenanceReportModelRows['MR_ARS'] = 10;
        this.maintenanceReportModelRows['MR_AGD'] = 7;
        this.maintenanceReportModelRows['MR_AGD1'] = 5;


    }
    this.CommonService.getAppTermsVerion2('TagType').subscribe(res => {
      this.tagTypelist = res.results;
      this.selectedTagType = this.tagTypelist[0]['value'];
    });
  }

  getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    let submenusList = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_REMN") : null;
    let tempId = submenusList['id'];
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
  getReports(id) {
    this.selectedReport.setValue(id)
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
    this.reportData = [];
    this.reportData.noRecords = false;
    this.reportData.loading = true;
    this.reportData['showTable'] = false;
    this.reportData['showCard'] = false;
    this.reportData['enablepdf'] = true;
    this.reportData['enableexcel'] = true;
    this.reportData['invalidDate'] = false;
    this.reportData['prevselected'] = this.HCselected;
    if (id == 'maintenancerep'){
      this.reportService.getMaintenanceReport(this.toDate).subscribe(res => {
        this.reportData['loading']=false;
        this.reportData['enableexcel'] = false;
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.exportData = res.results.data;
          this.tagLength = this.exportData.tot_tag.data;
          this.readerLength = this.exportData.tot_reader.data;
          this.gatewayLength = this.exportData.tot_gw.data;

          this.tagStatus = this.exportData.tag_status.data;
          this.readerStatus = this.exportData.reader_status.data;
          this.gatewayStatus = this.exportData.gw_status.data;
          this.tagChart(this.exportData.tag_type);
          this.chartService.drawChart({'id':'maintenancerep','canvasId':'battery','type':'pie','data':Object.values(res.results.data['Battery Agg'].tag_count),'label': Object.values(res.results.data['Battery Agg'].Battery_percentage),'title':'Battery','showTitle':true,'barLabel': []});          
          this.readerChart(this.exportData.reader_type);
        }
      });
    }else if(id == 'battery-history'){
      this.param = '/fdt=' + this.toDate+ '&ttype=' + this.selectedTagType;
      this.CommonService.getReportData(id,this.param).subscribe(res => { 
        this.selected['ttype'] = this.selectedTagType; 
        this.reportData['loading']=false;
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['enablepdf'] = false;
          this.reportData['Table'] = res.results.data;
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }  
        } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = false;
            this.reportData.enablepdf = false;
        }
    });
    }
    this.selected = {'selectedId' : id, 'fromDate': this.fromDate,'todate': this.toDate };
  }

  getTagInfo() {
    const dialogRef = this.dialog.open(MaintenanceViewmoreComponent,
      { data: [this.exportData.tag_status] ,panelClass: ['medium-popup'], disableClose: false });
  }

  getReaderInfo() {
    const dialogRef = this.dialog.open(MaintenanceViewmoreComponent,
      { data: [this.exportData.reader_status], panelClass: ['medium-popup'],disableClose: false });
  }

  getGatewayInfo() {
    const dialogRef = this.dialog.open(MaintenanceViewmoreComponent,
      { data: [this.exportData.gw_status], panelClass: ['medium-popup'], disableClose: false });
  }
  getBatteryInfo() {
    const dialogRef = this.dialog.open(MaintenanceViewmoreComponent,
      { data: this.exportData['Battery Detail'], panelClass: ['medium-popup'] , disableClose: false });
  }

  tagChart(data) {

    if (this.tagTypeChart != undefined || this.tagTypeChart != null) {
      this.tagTypeChart.destroy();
    }
    this.tagTypeChartDataset = [{
      label: 'Active',
      backgroundColor: '#8CEDCB',
      borderColor: '#8CEDCB',
      data: data.active,
    }, {
      label: 'Inactive',
      backgroundColor: '#83B9FA',
      borderColor: '#83B9FA',
      data: (data.total.map((n, i) => n - data.active[i])),
    }];

    this.tagTypeChart = new Chart('tagType', {
      type : 'bar',
      data : {
        labels : data.label,
        datasets : this.tagTypeChartDataset,
      },
      // options : {
      //   responsive : true,
      //   maintainAspectRatio : false,
      //   legend : {
      //     display : true,
      //     position : 'right'
      //   },
      //   title: {
      //     display: true,
      //     text: 'Tag Status'
      //   },
      //   scales : {
      //     xAxes: [{
      //       stacked: true,
      //       gridLines : {display : true,drawOnChartArea: false},
      //     }],
      //     yAxes: [{
      //       stacked: true,
      //       gridLines : {display : true,drawOnChartArea: false},
      //     }]
      //   },
      //   plugins: {
      //     datalabels: {
      //       display:  function(tagType) {
      //         return tagType.dataset.data[tagType.dataIndex] > 0;
      //       },
      //       color: 'black',
      //       align: 'center',
      //       anchor: 'center',
      //       font:
      //       {
      //         weight: 'bold'
      //       }
      //     }
      //   }
      // }
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          title: {
            display: true,
            text: 'Tag Status'
          },
          datalabels: {
            display: function(tagType) {
              const value = tagType.dataset.data[tagType.dataIndex];
              if (typeof value === 'number') {
                return value > 0;
              }
              return false;
            },
            color: 'black',
            align: 'center',
            anchor: 'center',
            font: {
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: true,
              drawOnChartArea: false
            }
          },
          y: {
            stacked: true,
            grid: {
              display: true,
              drawOnChartArea: false
            }
          }
        }
      }
      
    });
  }

  readerChart(data) {
    if (this.readerTypeChart != undefined || this.readerTypeChart != null) {
      this.readerTypeChart.destroy();
    }
    this.readerTypeChartDataset = [{
      label: 'Active',
      backgroundColor: '#8CEDCB',
      borderColor: '#8CEDCB',
      data: data.active,
    }, {
      label: 'Inactive',
      backgroundColor: '#83B9FA',
      borderColor: '#83B9FA',
      data: (data.total.map((n, i) => n - data.active[i])),
    }];

    this.readerTypeChart = new Chart('readerType', {
      type : 'bar',
      data : {
        labels : data.label,
        datasets : this.readerTypeChartDataset,
      },
      // options : {
      //   responsive : true,
      //   maintainAspectRatio : false,
      //   legend : {
      //     display : true,
      //     position : 'right'
      //   },
      //   title: {
      //     display: true,
      //     text: 'Reader Status'
      //   },
      //   scales : {
      //     xAxes: [{
      //       ticks: {
      //           autoSkip: false,
      //           maxRotation: 50,
      //           minRotation: 50
      //       },
      //       stacked: true,
      //       gridLines : {display : true,drawOnChartArea: false},
      //     }],
      //     yAxes: [{
      //       stacked: true,
      //       gridLines : {display : true,drawOnChartArea: false},
      //     }]
      //   },
      //   plugins: {
      //     datalabels: {
      //       display:  function(readerType) {
      //         return readerType.dataset.data[readerType.dataIndex] > 0;
      //       },
      //       color: 'black',
      //       align: 'center',
      //       anchor: 'center',
      //       font:
      //       {
      //         weight: 'bold'
      //       }
      //     }
      //   }
      // }
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          title: {
            display: true,
            text: 'Reader Status'
          },
          datalabels: {
            display: function(readerType) {
              const value = readerType.dataset.data[readerType.dataIndex];
              if (typeof value === 'number') {
                return value > 0;
              }
              return false;
           },
            color: 'black',
            align: 'center',
            anchor: 'center',
            font: {
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 50,
              minRotation: 50
            },
            stacked: true,
            grid: {
              display: true,
              drawOnChartArea: false
            }
          },
          y: {
            stacked: true,
            grid: {
              display: true,
              drawOnChartArea: false
            }
          }
        }
      }
      
    });
  }


  onResize(event) {
    this.gridCols = (event.target.innerWidth <= 767) ? 1 : 4;
    this.gridCols1 = (event.target.innerWidth <= 767) ? 1 : 3;
    this.gridCols2 = (event.target.innerWidth <= 767) ? 1 : 5;
    if (event.target.innerWidth <= 767) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        if (this.maintenanceReportModelCols[this.WidgetList[i].id] > 1) {
          this.maintenanceReportModelCols[this.WidgetList[i].id] = 1;

        }
        if (this.maintenanceReportModelRows[this.WidgetList[i].id] == 5) {
          this.maintenanceReportModelRows[this.WidgetList[i].id] = 10;
        }

      }
      this.maintenanceReportModelRows['MR_ACS'] = 10;
        this.maintenanceReportModelRows['MR_ARS'] = 10;
        this.maintenanceReportModelRows['MR_AGD'] = 7;
        this.maintenanceReportModelRows['MR_AGD1'] = 5;
    }
    if (event.target.innerWidth >= 768) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        this.maintenanceReportModelCols[this.WidgetList[i].id] = this.WidgetList[i].cols;
        this.maintenanceReportModelRows[this.WidgetList[i].id] = this.WidgetList[i].rows;
        this.maintenanceReportModelId[this.WidgetList[i].id] = this.WidgetList[i].class;
      }
    }


  }
  downloadPDF() {
    if (this.exportData.length || this.exportData != null) {
      let name: string;
      this.chartImage = [];
      name = "Maintenance Report";
      this.chartImage = [document.getElementById('tagType'),document.getElementById('readerType')];
      this.pdfService.exportAsPdfFile(this.exportData, [], name, this.selectedDate, 'maintenancerep', this.chartImage);
    } else {
      this.exportData = [];
    }
  }
  downloadExcel() {
    let excelData : any;
    let name = '';
    let transpose = false;
    if(this.selected['selectedId'] == 'battery-history'){
      name = 'Device Battery History';
      excelData = this.reportData['Table'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } else if (this.reportData.length || this.reportData != null) {
      name = name+this.selected['selectedId'];
      excelData = this.reportData['Table'];
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } else {
      excelData = [];
  }
  }
  fixClick() {
    console.log('')
  }
}
