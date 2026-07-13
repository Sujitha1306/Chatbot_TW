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
import { MatDialog } from '@angular/material/dialog';
import { CreateResourceTemplateComponent } from '../../../shared/modules/entry-component/create-resource-templete/create-resource-template.component';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-resource-template',
  templateUrl: './resource-template.component.html',
  styleUrls: ['./resource-template.component.scss']
})
export class ResourceTemplateComponent {

  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  selectDropdown: any;
  public selectedName: any = null;
  public selectedView: any;
  displayedColumns: string[] = ['ID', 'Template Name', 'Function', 'Type', 'Value'];
  public tableData: any = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = [];
  eventColumn = ['Template Name'];
  permissionControl = ['BT_ALLE'];
  public applyFilterValue: any;
  pageSize:number =10;
  pageStart:number=0;
  length: number=0;

  public tableVersion: any = null;

  constructor(private readonly commonService: CommonService, public dialog: MatDialog) { }

    ngOnInit(): void {
        setTimeout(() => {
            this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
            if (this.tableVersion === 2) {
                this.displayedColumns = ['Template Name', 'Function', 'Type', 'Value'];
            }
            this.getResourceTemplate(null, this.pageSize, this.pageStart);
        }, 500);
    }

    getResourceTemplate(name?, pageSize?, pageStart?) {
    this.commonService.getResourceTemplate(name, pageSize, pageStart).subscribe(res => {
      if (res.statusCode === 1) {
        this.tableData = res.results;
        console.log(res.totalRecords)
        this.length = res.totalRecords;
        const Columns = this.tableVersion === 1
            ? ['id', 'name', 'page', 'identifyingType', 'identifyingValue']
            : ['name', 'page', 'identifyingType', 'identifyingValue'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      }
    })
  }

  headerEventAction(event) {
    if (event.data === "Create") {
      this.createResourceTemplate(null)
    } else if (event.data === "Modify") {
      this.createResourceTemplate(event)  
    } else if(event.key === "applyFilter") {
      this.applyFilter(event.data)
    } else {
      this.refreshPage();
    }
  }



  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getResourceTemplate(this.applyFilterValue,this.pageStart,this.pageSize);
      }else if (this.applyFilterValue.length == 0){
        this.getResourceTemplate(null,this.pageStart,this.pageSize);
    }
  }

  createResourceTemplate(data, type?) {
    if (type == 'rowClick') {
      data = { data: 'Modify', keyVal: data }
    }
    this.showActions = null;
    this.selectedName = data;
    let templatepop = {
      type: 'Create', resource: null
    }
    if (data) {
      templatepop = {
        type: data.data,
        resource: data.keyVal
      }
    }
    const dialogRef = this.dialog.open(CreateResourceTemplateComponent, {
      data: templatepop,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
  }

  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2;
  }

  eventAction(event) {
    console.log(event)
    if (event.key === 'pagination') {
       this.pageSize = event.data.pageSize;
       this.pageStart = event.data.pageIndex;
       this.refreshPage()
    }
  }

  refreshPage() {
    this.showActions = this.showActions1;
    this.getResourceTemplate(null, this.pageSize, this.pageStart);
  }

  get resourceTemplateTwColumns(): TwColumnDef[] {
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

  get resourceTemplatePaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
