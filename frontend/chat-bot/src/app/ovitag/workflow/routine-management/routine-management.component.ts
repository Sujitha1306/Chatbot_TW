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
import { CommonService, ConfigurationService } from '../../../shared';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateManageRoutineComponent } from '../../../shared/modules/entry-component/create-manage-routine/create-manage-routine.component';
import { EntityRoutineEventsComponent } from '../../../shared/modules/entry-component/entity-routine-events/entity-routine-events.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-routine-management',
  templateUrl: './routine-management.component.html',
  styleUrls: ['./routine-management.component.scss']
})
export class RoutineManagementComponent implements OnInit {
  public selectedTabIndex = 0;
  public displayedColumns:string[] = ['Type', 'Routine Type', 'Routine Name', 'Entity Name', 'Schedule Type', 'Start Time', 'From Date', 'To Date', 'Status'];
  public iconHeader = [];
  public iconColumn = ["Start Time", "From Date", "To Date"];
  public dateColumns = ['From Date', 'To Date']
  public timeColumns =['Start Time']
  public sortColumn = [];
  public eventColumn = ["Routine Name", "Status"];
  permissionControl = ['BT_ALLE'];
  public applyFilterValue = null;
  public length = 0
  public pageSize: number = 50;
  public pageStart: number = 0;
  public showActions1 = [{ id: 'create', value: 'Create' }]
  tableData: any;
  loading: boolean = false;
  type = null
  groupFilter = []
  showActions = this.showActions1
  selectDropdown: null;
  selectedName: null;
  responseColumns = ["entityType", "routineTypeName", "pfRoutineName", "entityName", "scheduleTypeName", "scheduleStart", "fromDate", "toDate", "statusName"];
  activate_btn = [];


  constructor(private readonly configurationService:ConfigurationService,private readonly commonService:CommonService, public dialog: MatDialog,
     public toastr: AppToastService, private readonly route: ActivatedRoute){
      this.activate_btn = this.commonService.getActivePermission('button');
     }

  ngOnInit(): void {
    const tabMap = [
      { key: 'BT_RM_PAT', label: 'Patient' },
      { key: 'BT_RM_AST', label: 'Asset' },
      { key: 'BT_RM_LOC', label: 'Location' },
      { key: 'BT_RM_STF', label: 'Staff' },
      { key: 'BT_RM_PRD', label: 'Production' }
    ];
    const firstAvailableTab = tabMap.find(tab =>this.activate_btn?.includes(tab.key));
    if (firstAvailableTab) {
      this.type = firstAvailableTab.label;
      this.selectedTabIndex = 0;
      this.getDynamicTableColumn();
    }
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
    const length = this.applyFilterValue.length;
    if (length === 0 || length > 2) {
      this.getAllRoutines();
    }
  }

  refreshPage(){
    this.applyFilterValue = null;
    this.getAllRoutines();
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

  tabChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event?.index;
    this.type = event?.tab?.textLabel?.trim();
    this.refreshPage();
  }

  createRoutine(data: any = {}) {
    if (data === '' || data === null) {
      data = {};
    }
    data['tabType'] = this.type;
    const dialogRef = this.dialog.open(CreateManageRoutineComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.selectedName = null;
    });
  }



  eventAction(event) {
   if(event.key === 'pagination'){
    this.pageSize = event.data.pageSize;
    this.pageStart = event.data.pageIndex;
    this.getAllRoutines();
   } else if(event.key === "Status"){
    this.entityRoutineEvent(event.data)
   }else if(event.key === "Routine Name"){
     this.createRoutine(event.data)
   }
  }

  entityRoutineEvent(data: any) {
    data['tabType'] = this.type;
    const dialogRef = this.dialog.open(EntityRoutineEventsComponent, 
      {data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(res => {
      this.refreshPage()
    })
  }

  getAllRoutines(router?: boolean) {
    this.loading = true;
    if(router){
      this.tableData = this.route.snapshot.data.rou.results;
      this.length = this.route.snapshot.data.rou.totalRecords;
       for (let i = 0; i <= this.responseColumns.length; i++) {
         this.tableData.map(data => {
           data[this.displayedColumns[i]] = data[this.responseColumns[i]];
         });
       }
       this.loading = false;
    } else {
      this.configurationService.getAllManageRoutine(this.pageSize,this.pageStart, this.type, null, this.applyFilterValue).subscribe(res => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[this.responseColumns[i]];
          });
        }
        this.loading = false;
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.loading = false;
      });
    }
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('routine-management').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.columns;
        if(dynamicColumns?.timeColumns){this.timeColumns = dynamicColumns.timeColumns}
        if(dynamicColumns?.dateColumns){this.dateColumns =dynamicColumns.dateColumns;}
      }
      this.getAllRoutines(false);
    });
  }
}
