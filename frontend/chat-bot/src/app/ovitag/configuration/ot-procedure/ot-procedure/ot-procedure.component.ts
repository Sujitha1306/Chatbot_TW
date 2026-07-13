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
import { ConfigurationService, CommonService } from '../../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { ManageOtprocedureComponent } from '../manage-otprocedure/manage-otprocedure/manage-otprocedure.component';
import { TwColumnDef, TwPaginationConfig } from '../../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-ot-procedure',
  templateUrl: './ot-procedure.component.html',
  styleUrls: ['./ot-procedure.component.scss']
})
export class OtProcedureComponent implements OnInit {
  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = ['ID', 'Name', 'Recovery SLA', 'Preparation SLA', 'Surgery SLA', 'Description'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
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
                this.displayedColumns = ['Name', 'Recovery SLA', 'Preparation SLA', 'Surgery SLA', 'Description'];
            }
            this.getOTProc(this.pageStart, this.pageSize);
        }, 500);
    }

    getOTProc(pageStart: number, pageSize: number, name?: string) {
    this.isloading = true;
    this.configurationService.getAllOtProcedure(pageStart, pageSize, name).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords
      const Columns = this.tableVersion === 1
        ? ['id', 'name', 'recoverySla', 'preparationSla', 'surgerySla', 'description']
        : ['name', 'recoverySla', 'preparationSla', 'surgerySla', 'description'];
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
      this.getOTProc(this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getOTProc(this.pageStart, this.pageSize, null);
    }
  }
  headerEventAction(event) {
   
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Create') {
      this.createotproc(null);
    } else if (event.data === 'Modify') {
      this.createotproc(event.keyVal);
    }else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    console.log(event , 'eeeee')
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getOTProc(this.pageStart,this.pageSize, this.applyFilterValue);
     }
    }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getOTProc(this.pageStart,this.pageSize, this.applyFilterValue)
  }
  createotproc(data: any) {
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(ManageOtprocedureComponent, {
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

  get otProcedureTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      [], []
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

  get otProcedurePaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
