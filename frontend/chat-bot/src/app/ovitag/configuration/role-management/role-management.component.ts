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
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, TextToSpeechService } from '../../../shared';
import { ResourceMapComponent } from '../../../shared/modules/entry-component/resource-map/resource-map.component';
import { ManageRoleComponent } from './manage-role/manage-role.component';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {

  displayedColumns: string[] = ['ID', 'Code', 'Name','Facility Name','Status'];
  eventColumn = ['Name'];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  responseColumns = ['ID', 'code','name','facilityName','status'];
  isLoading: boolean = false;
  public tableVersion: any = null;
  public applyFilterValue: any;
  showAction1: any = [{ id: 'create', value: 'Create' }];
  showAction2: any = [{ id: 'modify', value: 'Modify'},{ id: 'map', value: 'Map' }];
  selectedName = null;
  selectDropdown: any;
  public tableData: any = [];
  public selectedRow: any = null;
  public showActions = this.showAction1;
  public pageSize = 50;
  public pageStart = 0;
  public length = 0;

  constructor(public fb: FormBuilder,public dialog: MatDialog,public commonService: CommonService,public textToSpeech : TextToSpeechService) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Code', 'Name','Facility Name','Status'];
        this.responseColumns = ['code','name','facilityName','status'];
      }
      this.getAllRole();
    }, 500);
  }

  refreshPage(){
    this.selectedName = null;
    this.getAllRole();
    this.applyFilterValue = null;
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  headerEventAction(event) {
    if (event.data == 'create') {
      this.createRoleManagement(null);
    } else if (event.data === 'modify') {
      this.createRoleManagement(event.keyVal);
    } else if (event.data == 'map') {
      this.groupMapping(event.keyVal);
    } else if (event.key === 'applyFilter'){
      this.applyFilter(event.data);
    } else {
      this.refreshPage()
    }
  }
 
    eventAction(event) {
    if (event.key === 'Name') {
      this.createRoleManagement(event.data);     
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllRole();
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAllRole();
    } else if (this.applyFilterValue.length == 0) {
      this.applyFilterValue = null;
      this.getAllRole();
    }
  }

  getAllRole(){
    this.isLoading = true;
    this.commonService.getRollConfigList(this.applyFilterValue, this.pageStart, this.pageSize).subscribe((res) =>{
      this.isLoading = false;
      if(res.statusCode == 1){
        this.tableData = res.results;
        this.length = res.totalRecords;
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[this.responseColumns[i]];
          });
        }
      }
    });
  }

  get roleManagementTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, this.eventColumn, []
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (timeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  get roleManagementPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }

  groupMapping(data) {
    let groupdata = {type: 'role', data: data}
    const dialogRef = this.dialog.open(ResourceMapComponent, {
      data: groupdata, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = [];
      this.showActions = this.showAction1;
      this.selectedName = null;
      this.refreshPage();
    });
  }
  createRoleManagement(data) {
      const dialogRef = this.dialog.open(ManageRoleComponent,
      { data: data, panelClass: ['small-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = [];
        this.showActions = this.showAction1;
        this.refreshPage();
        
      });
    }
}
