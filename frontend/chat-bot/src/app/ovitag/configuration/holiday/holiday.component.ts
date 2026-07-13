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

import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonService, WorkflowService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { ManageHolidayComponent } from './manage-holiday/manage-holiday.component';
import { DatePipe } from '@angular/common';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../../shared/modules/entry-component/patient/patient.component';

@Component({
  selector: 'app-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ]
})
export class HolidayComponent  {

  displayedColumns: string[] = ["ID",
    "Type Name",
    "Name",
    "Event Day",];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  responseColumns = [];
  public applyFilterValue: any;
  public selectedDate: any;

  public selectedView = 'table';
  showActions: any = [{ id: 'manage', value: 'Manage' }];
  selectedName = null;
  selectDropdown: any;
  currentYear: number;
  public tableData: any = [];
  public selectedRow: any = null;
  public today = new Date();
  public startDate = this.datePipe.transform(this.today, 'yyyy-MM-dd');
  nextYear = this.today.getFullYear() + 1;
  lastDayOfDecemberNextYear = new Date(this.nextYear, 11, 31);
  public endDate = this.datePipe.transform(this.lastDayOfDecemberNextYear, 'yyyy-MM-dd');

  constructor(public fb: FormBuilder,
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public datePipe: DatePipe) {
    this.getDynamicTableColumn();
  }



  headerEventAction(event) {
    if (event.data == 'manage') {
      this.createHoliday();
    }
    if(event.key === 'startDateFilter'){
      this.startDate = this.datePipe.transform(event.data, 'yyyy-MM-dd');
      this.getHolidaysList();
    }
    if(event.key === 'endDateFilter'){
      this.endDate = this.datePipe.transform(event.data, 'yyyy-MM-dd');
      this.getHolidaysList()
    }
    if(event.key === 'refreshPage'){
      this.refreshPage();
    }
  }
  createHoliday() {
    let data = {"selectedDate":this.selectedDate,"tableData":this.tableData};
    const dialogRef = this.dialog.open(ManageHolidayComponent,
      { data: data, panelClass: 'medium-popup', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = [];
      this.refreshPage();
    });
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('holiday').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.dataColumns;
      }
      this.getHolidaysList();
    });
  }
  getHolidaysList() {
    this.workflowService.getHolidays(this.startDate,this.endDate).subscribe((res) => {
      if(res.results.length) {
        res.results = res.results.filter(val => val.isActive === true)
        this.tableData = res.results;
        let Columns = [
          "id",
          "typeName",
          "name",
          "holidayPatternName"
        ]
        if (this.responseColumns.length) {
          Columns = this.responseColumns;
        }
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      }
    });
  }

  refreshPage() {
    this.applyFilterValue = null;
    this.getHolidaysList();
}
}
