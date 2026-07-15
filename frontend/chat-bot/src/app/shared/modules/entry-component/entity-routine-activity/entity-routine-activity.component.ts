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

import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../services';
import { CreateManageRoutineComponent } from '../create-manage-routine/create-manage-routine.component';
import { EntityRoutineEventsComponent } from '../entity-routine-events/entity-routine-events.component';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';

@Component({
  selector: 'app-entity-routine-activity',
  templateUrl: './entity-routine-activity.component.html',
  styleUrls: ['./entity-routine-activity.component.scss']
})
export class EntityRoutineActivityComponent implements OnInit {
  public titleName: string
  public groupFilter = []
  public showActions1 = [{ id: 'create', value: 'Create' }]
  public displayedColumns:string[] = ['Maintenance Type', 'Maintenance Name', 'Entity Name', 'Schedule Type', 'Start Time', 'From Date', 'To Date', 'Status', 'Next Due','Visit Type','Open Task','Report'];
  public iconHeader = ["Report"];
  public iconColumn = ["Start Time", "From Date", "To Date","Next Due","Open Task","Report"];
  public dateColumns = ['From Date', 'To Date',"Next Due"]
  public timeColumns =['Start Time']
  public sortColumn = [];
  public eventColumn = ["Status","Maintenance Name"];
  permissionControl = ['BT_ALLE'];
  public applyFilterValue = null;
  public tableData: any;
  length = 0;
  public pageSize: number = 50;
  public pageStart: number = 0;
  showActions = this.showActions1;
  @Input() maintenanceData: any={};
  @Input() displayHeader: boolean = true;;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
   private readonly configurationService: ConfigurationService, public dialog: MatDialog,){

  }

  ngOnInit(): void {
    if (this.data && this.maintenanceData != null && !('tabType' in this.data)) {
      this.data = this.maintenanceData;
    }
    if(this.data?.id != null && this.data?.id != undefined && this.data?.id ==='Asset'){
      this.displayedColumns = this.displayedColumns.filter(col=> col !== 'Visit Type')
    }
    this.displayHeader = this.displayHeader != null && this.displayHeader !== undefined ? this.displayHeader : true;
    this.titleName = this.data.titleName;
    this.getEntityRoutine()
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
    const length = this.applyFilterValue.length;
    if (length === 0 || length > 2) {
      this.getEntityRoutine();
    }
  }

  headerEventAction(event){
    if(event.key === "applyFilter"){
      this.applyFilter(event.data);
    } else if(event.data === "create") {
      this.createRoutine('');
    } else {
      this.refreshPage()
    }
  }



  eventAction(event){
    if(event.key === 'pagination'){
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getEntityRoutine();
    } else if(event.key === 'Status' ||event.key === 'Open Task'){
      this.entityRoutineEvent(event.data);
    } else if(event.key === 'Routine Name' || event.key === 'Maintenance Name'){
      this.createRoutine(event.data);
    } else if(event.key === 'Report'){
      const reportData = {
      ...event.data,
        entityRoutineId: event.data?.id ?? null
      };
      this.getReportLayout(reportData);
    }
  }

  entityRoutineEvent(data: any) {
    data['tabType'] = this.data.tabType;
    const dialogRef = this.dialog.open(EntityRoutineEventsComponent, 
      {data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(res => {
      this.refreshPage()
    })
  }

  refreshPage(){
    this.showActions = this.showActions1;
    this.applyFilterValue = null;
    this.getEntityRoutine()
  }

  createRoutine(data: any = {}) {
    this.showActions = null;
    if (data === '' || data === null) {
      data = {};
      data['entityById'] = this.data.entityId;
      data['entityIdName'] = this.data.entityName ? this.data.entityName :this.data.patientName;
      data['dynamicHeader'] = 'Create Maintenance Routine'
      data['tabType'] = this.data.tabType;
    } else {
       data['dynamicHeader'] = 'Modify Maintenance Routine',
       data['tabType'] = this.data.tabType;
    }
    const dialogRef = this.dialog.open(CreateManageRoutineComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  getEntityRoutine(){
    this.configurationService.getAllManageRoutine(this.pageSize, this.pageStart, this.data.entityType, this.data.entityId, this.applyFilterValue).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ["routineTypeName", "pfRoutineName", "entityName", "scheduleTypeName", "scheduleStart", "fromDate", "toDate", "statusName","nextDueDate", "visitTypeName","noOfOpenTasks"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    })
  }

  getReportLayout(data) {
    data['content'] = 'layout'
    data['linkedResourceCode'] = 'BT_MAINRQRPT';
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: false });
  }
}
