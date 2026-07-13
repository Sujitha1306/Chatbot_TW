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
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { MatDialog } from '@angular/material/dialog';
import { ManageKpiComponent } from '../../../shared/modules/entry-component/manage-kpi/manage-kpi.component';
import { CommonService } from '../../../shared';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrls: ['./kpi.component.scss']
})
export class KPIComponent {
 showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = ['ID', 'Name', 'Category', 'Unit', 'Target', 'Formula', 'Value Type', 'Frequency', 'Description'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID','Status'];
  eventColumn = ['Name'];
  public selectedName: any = null;
  public applyFilterValue: any;
  public selectedView = "table";
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;
  public tableVersion: any = null;

  constructor(public dialog: MatDialog, public configurationService: ConfigurationService, private readonly commonService: CommonService) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Name', 'Category', 'Unit', 'Target', 'Formula', 'Value Type', 'Frequency', 'Description'];
      }
      this.getKpi();
    }, 500);
  }

  getKpi() {
    this.isloading = true;
    this.configurationService.getKpi().subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = this.tableVersion === 1
        ? ['id', "name", "categoryName", "unitOfMeasure", "target", "formula", "valueType", "frequencyName", "description"]
        : ["name", "categoryName", "unitOfMeasure", "target", "formula", "valueType", "frequencyName", "description"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
    this.isloading = false;
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getKpi();
    } else if (this.applyFilterValue.length == 0) {
      this.getKpi();
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Create') {
      this.createkpi(null);
    } else if (event.data === 'Modify') {
      this.createkpi(event.keyVal);
    }else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getKpi();
     } else if (event.key === 'Name') {
      this.createkpi(event.data);
     }
    }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getKpi()
  }
  createkpi(data: any) {
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(ManageKpiComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.showActions = null;
  }

  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2
  }

  get kpiTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      this.eventColumn, []
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

  get kpiPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
