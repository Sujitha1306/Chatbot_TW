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
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System
 * ======================================================================================================
 ******************************************************************************/
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../shared';
import { AssetAuditComponent } from '../../../shared/modules/entry-component/asset-audit/asset-audit.component';
import { AuditScheduleManagementComponent } from '../../../shared/modules/entry-component/CAFM/audit-schedule-management/audit-schedule-management.component';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-audit-management',
  templateUrl: './audit-management.component.html',
  styleUrls: ['./audit-management.component.scss']
})
export class AuditManagementComponent {

  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns = [];
  displayedColumns1: string[] = ['ID','Name','Owned Department','Used Department','Asset Type','Criticality Type','Location Name','Type', 'Schedule Type','Start Date','End Date'];
  displayedColumns2: string[] = ['ID','Name','Location Category','Location Type','Type', 'Schedule Type','Start Date','End Date'];
  dateColumns = ['Start Date','End Date']
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID','Location Name'];
  eventColumn =['Name','Status'];
  responseColumns =[];
  public selectedName: any = null;
  public applyFilterValue: any;
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;
  selectedTabIndex=0;
  selectedTab = 'Asset';
  responseColumns1 = ['id','name','department','usedDepartment','assetType','criticalityName','locationName','auditScheduleTypeName', 'schedulePeriodName','startTime', 'endTime'];
  responseColumns2 =  ['id','name','locationCategoryName','locationTypeName','auditScheduleTypeName', 'schedulePeriodName','startTime', 'endTime'];
  auditPermissionAction = null;

  constructor(public dialog: MatDialog, public configurationService: ConfigurationService,public commonService : CommonService, public toastr: AppToastService,) { 
    this.getDynamicTableColumn();
    this.getPermissionDropDown();
  }


  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission.dropdown;
    this.auditPermissionAction = dropdown.filter(x => x.page === "workflow" && x.code == "WD_AMMA");
    this.showActions2.push(...this.auditPermissionAction.map(x => ({ id: x.code, value: x.name })));
    this.showActions = this.showActions1;
  }

  tabChanged(event) {
    this.selectedTab = event?.tab?.textLabel ?? 'Asset';
    this.displayedColumns = this.selectedTab === 'Asset' ? this.displayedColumns1 : this.displayedColumns2;
    this.responseColumns = this.selectedTab === 'Asset' ? this.responseColumns1 : this.responseColumns2;
    this.selectedName = null;
    this.showActions = this.showActions1;
    this.showActions2 = [{ id: 'Modify', value: 'Modify' },...this.auditPermissionAction.map(x => ({ id: x.code, value: x.name }))];
    this.getAuditDetails(this.selectedTab, 0, 50, this.applyFilterValue);
  }

    getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('audit').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.assetDisplayedColumns
        this.displayedColumns1 = dynamicColumns.assetDisplayedColumns;
        this.displayedColumns2 = dynamicColumns.locationDisplayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        if(dynamicColumns.dateColumns){
        this.dateColumns = dynamicColumns.dateColumns;
        }
        this.responseColumns = dynamicColumns.assetColumns;
        this.responseColumns1 = dynamicColumns.assetColumns;
        this.responseColumns2 = dynamicColumns.locationColumns;
      }
      this.getAuditDetails(this.selectedTab,0,50,null)
    });
  }

  getAuditDetails(entityType:string,pageStart: number, pageSize: number, name?: string) {
    this.isloading = true;
    this.configurationService.getAuditSchedule(entityType,pageStart,pageSize,name).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords
      let Columns =  ['id','name','department','usedDepartment','assetType','criticalityName','locationName','locationCategoryName','locationTypeName','auditScheduleTypeName', 'schedulePeriodName','startTime', 'endTime'];
      if(this.responseColumns){
        Columns = this.responseColumns;
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.isloading = false;
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAuditDetails(this.selectedTab,this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getAuditDetails(this.selectedTab,this.pageStart, this.pageSize, null);
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Create') {
      this.manageAction(null);
    } else if (event.data === 'Modify') {
      this.manageAction(event.keyVal);
    }else if (event.data === 'WD_AMMA'){
      this.manageAuditSchedule(event.keyVal)
    }else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage(true);
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAuditDetails(this.selectedTab,this.pageStart,this.pageSize, this.applyFilterValue);
    }else if(event.key === 'Status'){
      if(this.auditPermissionAction?.some(x =>x.code === 'WD_AMMA')){
        this.manageAuditSchedule(event.data);
      }else{
        this.toastr.warning('Warning', 'User does not have Permission to Audit');
      }
    }else if (event.key === 'Name'){
      this.manageAction(event.data);
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAuditDetails(this.selectedTab,this.pageStart,this.pageSize, this.applyFilterValue)
  }
  manageAction(data: any) {
    if(!data) data ={}
    this.showActions = null;
    this.selectedName = data;
    data['entityType'] = this.selectedTab;
    const dialogRef = this.dialog.open(AssetAuditComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.selectedName = null;
    this.showActions = null;
  }

  manageAuditSchedule(data){
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(AuditScheduleManagementComponent, {
      data: data,
      panelClass: ['large-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.selectedName = null;
    this.showActions = null;
  }

  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2
  }
}
