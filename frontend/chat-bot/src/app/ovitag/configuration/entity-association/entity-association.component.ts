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
import { MatDialog } from '@angular/material/dialog';
import { ManageEntityAssociationComponent } from '../../../shared/modules/entry-component/manage-entity-association/manage-entity-association.component';
import { CommonService } from '../../../shared/services/common.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-entity-association',
  templateUrl: './entity-association.component.html',
  styleUrls: ['./entity-association.component.scss']
})
export class EntityAssociationComponent {

  public showActions1 = [{ id: 'Create', value: 'Create' }];
  public showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  public displayedColumns: string[] = ['ID', 'Qualifier', 'Entity Id', 'Entity Name', 'Entity Type', 'Association Count'];
  public permissionControl = ['BT_ALLE'];
  public sortColumn = [];
  public iconHeader = ['ID'];
  public iconColumn = ['ID','Status'];
  public eventColumn = ['Entity Name']

  public selectedName: any = null;
  public selectedRow: any = null;
  public applyFilterValue: any = null;
  public selectDropdown: any;
  public pageSize: number = 50;
  public pageStart: number = 0;
  public length: number = 0;

  public isloading: boolean = false;

  public tableData: any = [];
  public tableVersion: any = null;

  constructor(public dialog: MatDialog, public commonService: CommonService,) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Qualifier', 'Entity Id', 'Entity Name', 'Entity Type', 'Association Count'];
      }
      this.getEntyAsscn();
    }, 500);
  }

  getEntyAsscn() {
    this.isloading = true;
    this.commonService.getUniqueAssociations(this.applyFilterValue, this.pageStart, this.pageSize).subscribe(res => {
      this.isloading = false;
      this.tableData = res.results;
      this.length = res.totalRecords
      const Columns = this.tableVersion === 1
        ? ['id','qualifier', 'entityId', 'entityName', 'entityType', 'count']
        : ['qualifier', 'entityId', 'entityName', 'entityType', 'count'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getEntyAsscn();
    } else if (this.applyFilterValue.length == 0) {
      this.getEntyAsscn();
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Create') {
      this.createEntyAsscn(null);
    } else if (event.data === 'Modify') {
      this.createEntyAsscn(event.keyVal);
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
      this.getEntyAsscn();
     } else if (event.key === 'Entity Name') {
      this.createEntyAsscn(event.data);
     }
    }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getEntyAsscn()
  }
  createEntyAsscn(data: any) {
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(ManageEntityAssociationComponent, {
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

  get entityAssociationTwColumns(): TwColumnDef[] {
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

  get entityAssociationPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
