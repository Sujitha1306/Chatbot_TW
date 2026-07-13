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
import { MatDialog } from '@angular/material/dialog';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService } from '../../../shared';
import { ActivatedRoute } from '@angular/router';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/

@Component({
  selector: 'app-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./rule.component.scss'],
  animations: [routerTransition()],
  
})
export class RuleComponent implements OnInit {

  displayedColumns: string[] = ['Rule ID', 'Name', 'Description'];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  public tableVersion: any = null;
  public matcher = new ErrorStateMatcherService();
  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  tableData: any;
  public applyFilterValue: any;
  selectedView = 'table';
  public ruleLength: number = 0;

  constructor(
    private readonly configurationService: ConfigurationService,
    public dialog: MatDialog,
    public commonService: CommonService, private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
 
  }

  ngOnInit() {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Name', 'Description'];
      }
      this.tableData = this.route.snapshot.data.rules.results;
      this.ruleLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['id', 'ruleName', 'description']
        : ['ruleName', 'description'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    }, 500);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
  }

   refreshPage(isAutoRefresh?: boolean) {
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllRules();
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else {
      this.refreshPage();
      this.applyFilterValue = null;
    }
  }

  rowClick(data) {
    this.selectedName = data.id;
  }

  getAllRules() {
    this.configurationService.getAllPfRules().subscribe(res => {
      this.tableData = res.results;
      this.ruleLength = this.tableData?.length || 0;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = this.tableVersion === 1
        ? ['id', 'ruleName', 'description']
        : ['ruleName', 'description'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  get ruleTwColumns(): TwColumnDef[] {
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

  get rulePaginationConfig(): TwPaginationConfig {
    return { length: this.ruleLength, pageSize: 10, pageIndex: 0, pageSizeOptions: [10, 15, 20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
  }
}


