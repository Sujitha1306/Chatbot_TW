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

import { Component, Inject, OnInit, Optional, signal } from '@angular/core';
import { CommonService, WorkflowService } from '../../../shared';
import { DatePipe } from '@angular/common';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../hospital/user-management/user-management.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TaskManagmentComponent } from '../../../shared/modules/entry-component/task-managment/task-managment.component';
import { AssignTaskComponent } from '../task/task.component';
import { EventStatusTrackingComponent } from '../../../shared/modules/entry-component/event-status-tracking/event-status-tracking.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-print-sticker',
  templateUrl: './print-sticker.component.html',
  styleUrls: ['./print-sticker.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class PrintStickerComponent implements OnInit {
  public showActions = [];
  public groupFilter = [];
  public displayedColumns = ['select', 'Type', 'Identifier', 'Description', 'Due On', 'Assigned To', 'Status','print','Report'];
  public iconHeader = ['select', 'print','Report'];
  public iconColumn = ['select', 'print', 'Due On','Report'];
  public dateColumns=['Due On']
  public sortColumn = [];
  public eventColumn = [];
  public permissionControl = ['BT_ALLE']
  public applyFilterValue = null;
  public currentDate = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public responseColumns: any;
  public pageStart = 0;
  public pageSize = 50;
  public maintenanceCode: any[] = [
    { "key": "AC-AMC", "name": "AMC" },
    { "key": "AC-CAL", "name": "Calibration" },
    { "key": "AC-COR", "name": "Corrective" },
    { "key": "AC-PMS", "name": "PMS" }
  ];
  selectedStickerData: any[] = [];
  tableData: any;
  loading = signal(false);
  length: any;

  constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe, public toastr: AppToastService, public dialog: MatDialog, public commonService: CommonService,
              @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
              if (this.data?.type === 'AssetMaintenance') {
                this.getDynamicTableColumn();
              }
  }

  ngOnInit(): void {
    if (!this.data) {
      this.getPrintData();
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 3) {
      this.applyFilterValue = filterValue
    } else if (this.applyFilterValue.length === 0) {
      this.applyFilterValue = null
    }
    this.changeData();
  }

  getDynamicTableColumn() {
    this.selectedDate = this.data?.groupFilterData?.isYearly ? null : this.data?.groupFilterData?.selectedDate;
    this.commonService.getDynamicTableColumn('print-assetmaintenance').subscribe(res => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.dataColumns;
        this.maintenanceCode = dynamicColumns.maintenanceCode;
        if(dynamicColumns.dateColumns){
        this.dateColumns=dynamicColumns.dateColumns
        }
      }
      this.getAssetData();
    });
  }

  getAssetData() {
    this.loading.set(true);
    const groupFilter = this.data?.groupFilterData;
    this.commonService.getAssetMaintenanceCalendar(this.applyFilterValue, groupFilter.selectedDate,groupFilter?.selectedToDate, groupFilter?.assetTypeIds, groupFilter?.departmentId,
      groupFilter?.isOwnedDepartment, groupFilter?.isAssignedDepartment, groupFilter?.activityCategoryIds, groupFilter?.statusList, this.pageStart, this.pageSize ).subscribe(res => {
        this.loading.set(false);
        this.tableData = [];
        if (res.statusCode === 1) {
          const maintenanceCode = this.maintenanceCode.map(x => x.key);
          this.tableData = res.results.filter(x => maintenanceCode.includes(x.activityCategoryId)).sort((a, b) => (a.statusId === 'RQ-CO' ? -1 : 1));
          this.length = res.totalRecords;
          for (let i = 0; i <= this.responseColumns.length; i++) {
            this.tableData.map(data => {
              data[this.displayedColumns[i]] = data[this.responseColumns[i]];
            });
          }
        }
    });
  }

  onAssignToAll(event) {
    // console.log(event);
  }


  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      if (this.data?.type === 'AssetMaintenance') {
        this.data['groupFilterData']['selectedDate'] = this.selectedDate;
        this.data['groupFilterData']['selectedToDate'] = this.selectedDate;
      }
      this.changeData()
    } else {
      this.refreshPage()
    }
  }

  openTicket(data) {
    this.loading.set(true);
    const ticketData = {
      requestId: data?.requestId,
      type: 'modify',
      requestedType: 'RQT-TKT'
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent, {
      data: ticketData,
      panelClass: ['large-popup'],
      disableClose: true,
    });
    this.loading.set(false);
    dialogRef.afterClosed().subscribe((result) => { 
      this.refreshPage();
    });
  }
  
  assignTo(data) {
    this.loading.set(true);
    this.workflowService.getTaskById(data.requestId).subscribe(res => {
      this.loading.set(false);
      if (res.statusCode == 1) {
        const dataInfo = res.results[0];
        dataInfo['launchType'] = "isTask";
        dataInfo['selectedTabIndex'] = null;
        const dialogRef = this.dialog.open(AssignTaskComponent, {
          data: dataInfo, height: '250px', panelClass: ['mdm-Confirmation-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => { 
          this.refreshPage();
        });
      }
    });
  }

  getTaskHistory(data) {
    this.loading.set(true);
    this.workflowService.getTaskById(data.requestId).subscribe(res => {
      this.loading.set(false);
      if (res.statusCode == 1) {
        const dataInfo = res.results[0];
        this.dialog.open(EventStatusTrackingComponent, {
          data: dataInfo,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
      }
    });
  }

  refreshPage() {
    this.applyFilterValue = null;
    this.changeData()
  }

  rowClick(event) {
    // console.log(event);
  }

  checkBoxAction(event){
    if (JSON.stringify(this.selectedStickerData) === JSON.stringify(event)) return;
    this.selectedStickerData = event;
  }

  isPrintDisabled(): boolean {
    return !this.selectedStickerData.some(x => x.statusId === 'RQ-CO');
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.changeData()
    } else if (event.key === 'print') {
      this.printSticker(event.data)
    } else if (event.key === 'Identifier') {
      this.openTicket(event.data)
    } else if (event.key === 'Assign To') {
      this.assignTo(event.data);
    } else if (event.key === 'Status') {
      this.getTaskHistory(event.data);
    } else if(event.key === 'Report') {
      this.getReportLayout(event.data);
    }
  }

  printAll(data) {
    data = data.filter(res => res.statusId === 'RQ-CO');
    const mapingData = data.map(item => {
      const isCompletedOrCancelled = item.statusId === 'RQ-CA' || item.statusId === 'RQ-CO';
      return {
        ...item,
        scheduleStartTime: isCompletedOrCancelled ? item.scheduleStartTime : 'N/A',

        scheduleEndTime: isCompletedOrCancelled ? (item?.nextDueStartTime ?? item?.nextRoutineDue ?? null) : null
      };
    });
    
    // const dataInfo = mapingData.filter(x => !x.scheduleStartTime || !x.scheduleEndTime || !x.requestIdentifier );

    // if (!dataInfo.length) {
      const dialogRef = this.dialog.open(PrintStickerScreenComponent,
        { data: mapingData, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
      });
    // } else {
    //   this.toastr.error('Error', 'Please provide Schedule Start Time, End Time, and Request Identifier to continue.')
    // }
  }

  changeData() {
    if (this.data?.type === 'AssetMaintenance') {
      this.getAssetData();
    } else {
      this.getPrintData();
    }
  }

  getPrintData() {
    this.loading.set(true);
    this.workflowService.getAllTask(null, this.selectedDate, 'PR-AT', null, null, null, this.applyFilterValue, 'RQT-ROU', null,'AC-PMS', this.pageStart, this.pageSize).subscribe(res => {
      this.tableData = res.results.filter(filtVal => ['AC-CAL', 'AC-AMC', 'AC-PMS'].includes(filtVal.activityCategoryId)).sort((a, b) => (a.statusId === 'RQ-CO' ? -1 : 1));
      this.loading.set(false);
      this.length = res.totalRecords;
      let Columns = ['select', 'activityCategoryName', 'requestIdentifier', 'comments', 'scheduleDate', 'performerName','statusName', 'Print'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  printSticker(data?: any) {
    if (data['scheduleStartTime'] && data['scheduleEndTime'] && data['requestIdentifier']) {
      data['scheduleEndTime'] = data['nextDueStartTime'] ? data['nextDueStartTime'] : data['scheduleEndTime'];
      if (data?.statusId === 'RQ-CO' || data.statusId == 'RQ-CA') {
        data['scheduleStartTime'] = data['scheduleStartTime'];
        data['scheduleEndTime'] = data['nextDueStartTime'] ? data['nextDueStartTime'] : data['nextRoutineDue'] ?? null;
      } else {
        data['scheduleStartTime'] = 'N/A';
      }
      const dialogRef = this.dialog.open(PrintStickerScreenComponent,
        { data: [data], panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
      });
    } else {
      this.toastr.error('Error', 'Please provide Schedule Start Time, End Time, and Request Identifier to continue.')
    }
  }

  getReportLayout(data) {
    data['content'] = 'layout'
    data['linkedResourceCode'] = 'BT_MAINRQRPT';
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: false });
  }
}

@Component({
  selector: 'app-print-sticker-screent',
  templateUrl: './print-sticker-screen.component.html',
  styleUrls: ['./print-sticker.component.scss'],
})

export class PrintStickerScreenComponent implements OnInit {

  public stickerData: any;
  public hospital_logo: any;
  isPrint: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){}

  ngOnInit(): void {
    this.getHospitalLogo();
    if (this.data.some(x => x.nonPerformerIdentifier)) {
      this.data = this.data.map(x => ({ ...x, entityIdentifier: x.nonPerformerIdentifier }));
    }
    this.stickerData = this.data;
  }

  printPass() {
    this.isPrint = true
    const content = document.getElementById('printData')?.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    const style = `
    <style>
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          font-family: Arial, sans-serif;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 10px;
        }
        .safety-label {
          font-weight: 600;
          color: white !important;
          background-color: #00007e !important;
          padding: 0 3px;
        }
      }
    </style>
  `;

    printWindow.document.write(`
    <html>
      <head><title>Gate Pass</title>${style}</head>
      <body>${content}</body>
    </html>
  `);

    printWindow.document.title = 'Print Sticker'
    setTimeout(() => {
      printWindow.print();
      this.isPrint = false
    }, 1000);
    printWindow.document.close();
  }

  getHospitalLogo() {
    const preCustomer = localStorage.getItem('customerId');
    this.hospital_logo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + preCustomer;
  }

}
