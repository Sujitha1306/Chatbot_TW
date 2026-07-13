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
import { CommonService } from '../../../shared';
import { CreateDepartmentComponent } from '../../../shared/modules/entry-component/create-department/create-department.component';
import { MatDialog } from '@angular/material/dialog';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-department-info',
  templateUrl: './department-info.component.html',
  styleUrls: ['./department-info.component.scss']
})
export class DepartmentInfoComponent {
  displayedColumns: string[] = ['ID', 'Id', 'Department Name', 'Department Type','Source Id'];
  eventColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  responseColumns = ['ID','id' , 'name','departmentTypeName','sourceId'];
  isLoading = false;
  public tableVersion: any = null;
  public departmentInfoLength: number = 0;
  public applyFilterValue: any;
  showAction1: any = [{ id: 'create', value: 'Create' }];
  showAction2: any = [{id : 'modify', value : 'Modify'}];
  selectedName = null;
  selectDropdown: any;
  public tableData: any = [];
  public selectedRow: any = null;
  public selectedView = 'table';
  showActions = this.showAction1;

  constructor (
    private readonly commonService: CommonService,
    private readonly dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Department Name', 'Department Type','Source Id'];
        this.responseColumns = ['name','departmentTypeName','sourceId'];
      }
      this.getdepartmentInfo();
    }, 500);
  }
  refreshPage() {
    this.showActions = this.showAction1;
    this.selectedName = null;
    this.getdepartmentInfo()
  }
  headerEventAction(event) {
    this.showActions = null;
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createDepartment(event)
    } else if (event.data === 'modify'){
      this.createDepartment(event)
    } else if (event.data == 'map'){
      console.log(event)
    }  else {
      this.refreshPage()
    }
  }
  createDepartment(data: any, id?) {
    let departmentData = [];
    this.showActions = null;
    this.selectedName = data;
    if (data.keyVal === true) {
      departmentData = null;
    } else if(id === 'doubleClick') {
      departmentData = data;
    } else {
      departmentData = data.keyVal;
    }
    const dialogRef = this.dialog.open(CreateDepartmentComponent,
      { data: departmentData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
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
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    if (this.applyFilterValue.length > 2) {
      this.getdepartmentInfo(this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getdepartmentInfo();
    }
  }

  getdepartmentInfo(Filter?: any) {
    this.isLoading = true;
    this.commonService.getAllDepartments(Filter).subscribe((res) => {
      this.isLoading = false;
      if (res.results.length > 0) {
        this.tableData = res.results;
        this.departmentInfoLength = this.tableData?.length || 0;
        for (let i in this.responseColumns) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[this.responseColumns[i]];
          });
        }
      }
    });
  }

  get departmentInfoTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, [null], []
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

  get departmentInfoPaginationConfig(): TwPaginationConfig {
    return { length: this.departmentInfoLength, pageSize: 10, pageIndex: 0, pageSizeOptions: [10, 15, 20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
  }
}
