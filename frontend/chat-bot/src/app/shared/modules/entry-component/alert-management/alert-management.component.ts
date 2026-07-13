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

import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MY_FORMATS } from '../confirmation-dialog/confirmation-dialog.component';
import { ConfigurationService } from '../../../services/configuration.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertInformationComponent } from '../alert-information/alert-information.component';
import { CommonService } from '../../../services';
import { TwColumnDef, TwPaginationConfig } from '../tw-data-table/tw-data-table.models';


@Component({
  selector: 'app-alert-management',
  templateUrl: './alert-management.component.html',
  styleUrls: ['./alert-management.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AlertManagementComponent implements OnInit {
  displayedColumns: string[] = ['Alert Datetime', 'Rule Name', 'Alert ConfigName','Message', 'Sent Datetime', 'Ack Datetime', 'Closed Datetime', 'Status'];
  public selectedDate = '';
  public applyFilterValue: any;
  tableData: any;
  showAction1 = [{ id: 'enroll', value: 'Enroll' }];
  eventColumn = [];
  iconHeader = [];
  iconColumn = ['Status', 'AlertDatetime', 'ClosedDatetime'];
  sortColumn = [];
  permissionControl = [];
  selectSeen = 'All';
  selectRule : any;
  public showActions = this.showAction1;
  selectDropdown: string;
  direction: any;
  public loading : boolean = false;
  alertCurrentUser = true;
  public loginUserId = localStorage.getItem('dXNlcklk')
  public parentFilter = [
    {
      id: 'seen',
      value: 'Seen',
      isNoneAll: 'All',
      selectionType: 'single',
      subFilters: [{code: true, value: 'Read' },{ code: false, value: 'Unread'}],
      defaultSelected: ['All']
    },
    {
      id: 'rule',
      value: 'Rule',
      isNoneAll: 'All',
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
  ];
  pageSize = 50;
  length = 0;
  pageStart = 0;
   dateTimeColumns = ['Alert Datetime', 'Sent Datetime', 'Ack Datetime', 'Closed Datetime']
   public tableVersion: any = null;
  constructor(public datepipe: DatePipe, private readonly configurationService: ConfigurationService, private readonly route: ActivatedRoute,
    private readonly router: Router,public dialog: MatDialog, private readonly CommonService: CommonService) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.CommonService.facilityConfig?.twTableVersion ?? 1;
      this.getallerts();
      this.getRuleFilter();
    }, 500);
  }
  getRuleFilter() {
    this.configurationService.getAllPfRules().subscribe(res => {
      const ruleFilter = this.parentFilter.find(res => res.id === 'rule');
      if (ruleFilter) {
        ruleFilter.subFilters = res.results.map(({ ruleTypeId, ruleName }) => ({ code: ruleTypeId, value: ruleName }));
      }
    });
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getallerts();
    } else if (event.key === 'groupFilter') {
      const seenData = event.data.filter(x => x.id == 'seen');
      const ruleData = event.data.filter(x => x.id == 'rule');   
      if (seenData) {
        if (seenData[0].data === 'All') {
          this.selectSeen = null;
        } else {
          this.selectSeen = seenData[0].data;
        }
      }
      if (ruleData) {
        if (ruleData[0].data === 'All') {
          this.selectRule = null;
        } else {
          this.selectRule = ruleData[0].data;
        }
      }

      this.getallerts();
    } else {
      this.refreshPage();
    } 
  }
  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;

    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.selectRule = null;
    this.direction = null;
    this.parentFilter = [
      {
        id: 'seen',
        value: 'Seen',
        isNoneAll: 'All',
        selectionType: 'single',
        subFilters: [{code: true, value: 'Read' },{ code: false, value: 'Unread'}],
        defaultSelected: ['All']
      },
      {
        id: 'rule',
        value: 'Rule',
        isNoneAll: 'All',
        selectionType: 'single',
        subFilters: [],
        defaultSelected: ['All']
      }
    ];
    this.getRuleFilter();
    this.getallerts();
  }

  getallerts(routerEvent?: boolean): void {
    this.selectSeen = this.selectSeen === 'All' ? null : this.selectSeen;
    this.selectRule = this.selectRule === 'All' ? null : this.selectRule;
    if (routerEvent) {
      this.loading = true;
      this.length = this.route.snapshot.data.AlertManagements.totalRecords;
      this.tableData = this.route.snapshot.data.AlertManagements.results;
      this.loading = false;
      const Columns = ['alertDatetime', 'pfRuleName', 'configName', 'message', 'sentDatetime', 'ackDatetime', 'closedDatetime', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.loading = true;
      this.CommonService.getAllNotifications(this.loginUserId, this.pageStart, this.pageSize, false, null, this.selectSeen, null, this.selectedDate, this.selectRule).subscribe((res) => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.loading = false;
        if (this.applyFilterValue !== null) {
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['alertDatetime', 'ruleName', 'configName', 'message', 'sentDatetime', 'ackDatetime', 'closedDatetime', 'isActive'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      });
    }
  }

  get alertManagementTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      this.eventColumn, this.dateTimeColumns
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

  get alertManagementPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }

  eventAction(event) {
    if(event.key === 'pagination'){
      this.pageStart = event.data.pageIndex;
      this.pageSize = event.data.pageSize;
      this.getallerts();
    } else {
      const data = {event: event, alertData: this.alertCurrentUser};
    const dialogRef = this.dialog.open(AlertInformationComponent, {
      data: data, width: '900px', height: '750px', panelClass: ['small-popup'], disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();      
    });
    }
  }
}