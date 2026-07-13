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

import { Component,  } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonService, WorkflowService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { ManageSchedulerComponent } from '../../../shared/modules/entry-component/manage-scheduler/manage-scheduler.component';
import { DatePipe } from '@angular/common';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../asset/asset.component';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-holiday-scheduler',
  templateUrl: './holiday-scheduler.component.html',
  styleUrls: ['./holiday-scheduler.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ]
})
export class HolidaySchedulerComponent   {

  displayedColumns: string[] = ["ID",
  "Type",
  "Day",
  "Comments",
  "Created by",
  "Created on",
  "Modified by",
  "Modified on"];
    iconHeader = ['ID'];
    iconColumn = ['ID'];
    sortColumn = ['ID'];
    permissionControl = ['BT_ALLE'];
    responseColumns = [];
    public applyFilterValue: any;
    public entityGroup: any[];
    public selectedView = 'table';
    showActions: any = [{ id: 'create', value: 'Create' }];
    selectedName = null;
    selectDropdown: any;

    public today = new Date();
    public tableData: any = [];
    public selectedRow: any = null;
    public startDate = this.datePipe.transform(this.today, 'yyyy-MM-dd');
    nextYear = this.today.getFullYear() + 1;
    lastDayOfDecemberNextYear = new Date(this.nextYear, 11, 31);
    public endDate = this.datePipe.transform(this.lastDayOfDecemberNextYear, 'yyyy-MM-dd');
    loading : boolean = false;
    configEntityGroups: any[] = [];

  constructor(public fb: FormBuilder,
    public commonService: CommonService,
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public datePipe: DatePipe) { 
    this.getDynamicTableColumn();
  }


  headerEventAction(event){
    if (event.data == 'create') {
      this.manageScheduler();
    }
    if(event.key === 'startDateFilter'){
      this.startDate = this.datePipe.transform(event.data, 'yyyy-MM-dd');
      this.getAllSchedulerInfo();
    }
    if(event.key === 'endDateFilter'){
      this.endDate = this.datePipe.transform(event.data, 'yyyy-MM-dd');
      this.getAllSchedulerInfo()
    }
    if(event.key === 'refreshPage'){
      this.refreshPage();
    }
  }

  manageScheduler(event?){
    let data = {};
    if(event){
      data = {entityGroup: event,startDate:this.startDate,endDate:this.endDate};
    }
    const dialogRef = this.dialog.open(ManageSchedulerComponent,
      { data: data, panelClass: 'medium-popup', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = [];
      this.refreshPage();
    });
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('holiday-scheduler').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.dataColumns;
      }
    });
    this.commonService.getConfigFile('entityGroups-config').subscribe(res => {
      if (res.statusCode === 1) {
        let configDataInfo = res.results.contentObject;
        this.configEntityGroups = configDataInfo.allowedGroups;
      }
    });
    setTimeout(() => { this.getAllSchedulerInfo()}, 400)
  }
  
  refreshPage() {
    this.applyFilterValue = null;
    this.getAllSchedulerInfo();
  }
  getAllSchedulerInfo(){
    this.loading = true;
    this.workflowService.getEntityScheduleExceptions().subscribe((res) =>{
      if(res.statusCode == 1 || res.statusCode == 0){
        let girdData = [];
        if (this.configEntityGroups.length) {
          girdData = res.results?.filter(res => this.configEntityGroups.includes(res.entityTypeId));
        } else {
          girdData = res.results;
        }
        this.entityGroup = girdData;
        this.tableData = girdData;
        let Columns = [
          "id",
          "entityName",
          "entityTypeName",
          "shiftName"
        ]
        if (this.responseColumns.length) {
          Columns = this.responseColumns;
        }
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        this.loading = false;
        /* This determinews the another method
        const transformData = (tableInfo) => {
          return this.entityGroup.map(group => {
              const groupBy = group.entityGroupDetail.map(detail => detail.identifyingValue).join(', ');
              const shift = group.entitySchedule.length?this.datePipe.transform(group.entitySchedule[0].startTime, 'hh:mm:ss')+' - '+this.datePipe.transform(group.entitySchedule[0].endTime, 'hh:mm:ss'):"";
              return {
                  "ID":group.id,
                  "Group Name": group.name,
                  "Group By":groupBy,
                  "Shift":shift,
                  "shiftId":group.entitySchedule.length?group.entitySchedule[0].shiftMasterId:null,
                  "entityGroupDetailsList":group.entityGroupDetail,
                  "selectedScheduleInfo":group.entitySchedule[0]
              };
          });
       };
       this.tableData=transformData(tableInfo);*/
      }
    })
  }
  
}
