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
import { DatePipe } from '@angular/common';
import { WorkflowService } from '../../../shared/services/workflow.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ManageVisitorComponent } from '../../../shared/modules/entry-component/manage-visitor/manage-visitor.component';
import { MatDialog,} from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../app.module';
import { CommonService } from '../../../shared';
import { VisitorHistoryComponent } from '../../../shared/modules/entry-component/visitor-history/visitor-history.component';
import { VisitEventComponent } from '../../../shared/modules/entry-component/visit-event/visit-event.component';
import { CoasterComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { LookupTermService } from '../../../shared/lookup-term.service';




@Component({
  selector: 'app-visitor',
  templateUrl: './visitor.component.html',
  styleUrls: ['./visitor.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class VisitorComponent implements OnInit {
  public applyFilterValue: any;
  today = new Date();
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selectedName: any = null;
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  displayedColumns: string[] = ['Device', 'Id', 'Visitor Type', 'Requester Type', 'Requester', 'Requester Status', 'Name', 'Gender', 'visitor Count', 'Schedule Type', 'ScheduleDate', 'Visitor Status', 'Visitor DateTime','Current Location'];
  eventColumn = ['Id', 'Visitor Status', 'Device'];
  iconHeader = ['Gender', 'Device', 'visitor Count'];
  iconColumn = ['Gender', 'Device'];
  sortColumn = [];
  permissionControl = [null];
  tableData: any = [];
  patientList: any;

  public pageStart: number = 0;
  public pageSize: number = 50;
  public Statuscode: any[] = [];
  selectedStatus = [];
  constructor(public datepipe: DatePipe, private readonly workflowService: WorkflowService, private readonly route: ActivatedRoute, private readonly router: Router, public dialog: MatDialog
    , private readonly dateAdapter: DateAdapter<Date>, private readonly commonService: CommonService, private readonly lookupService: LookupTermService) {
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate())
    this.lookupService.getAppTermsWrapper('VisitorStatus').subscribe(res => {

      this.Statuscode = res.VisitorStatus ?? [];

      const formattedStatusCode = this.Statuscode.map(item => ({
        code: item.code,
        value: item.value
      }));

      const status = this.parentFilter.find(f => f.value === 'Status');
      status.subFilters = formattedStatusCode;
    });
  }
  public parentFilter = [
    {
      groupName: 'Status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['VIS-RQ', 'VIS-IP', 'VIS-AR', 'VIS-AP', 'VIS-AC']
    }
  ]

  ngOnInit() {
    this.getDynamicTableColumn();
    this.applyFilterValue = null;
    this.selectedStatus = [...this.parentFilter[0].defaultSelected];
    this.getVisitorsList(this.selectedDate, true)
  }
  getVisitorsList(date, routerEvent?: boolean): void {

    this.workflowService.getVisitorsList(this.selectedDate, this.pageStart, this.pageSize, this.selectedStatus).subscribe((res) => {
      this.tableData = res.results;
      console.log(res.results)
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['tagId', 'identifier', 'visitorTypeName', 'identifyingValue', 'entityName', 'visitorStatusName', 'fullName', 'gender', 'addVisitorCount', 'scheduleTypeName', 'scheduleTime', 'visitorEventStatusName', 'visitorEventTime','currentLocationName'];
      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < Columns.length; i++) {
        this.tableData.map(data => {
  
            data[this.displayedColumns[i]] = data[Columns[i]];

        });
      }
    });

  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }

  eventAction(event: any) {
    if (event.key === 'Id') {
      this.visitor(event.data);
    } else if (event.key === 'Visitor Type') {
      this.visitorHistory(event.data)
    }
    else if (event.key === 'Device') {
      if (event.data.visitorEventStatusId === "VIS-AR" || event.data.tagId != null) {
        this.manageCoaster(event.data)
      }
    } else if (event.key === 'Visitor Status') {
      this.viewVisitEvent(event.data);
    } else {
      console.log('Other action:', event);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getVisitorsList(this.selectedDate);
    } else if (event.data === 'create') {
      this.create('');
    } else if (event.key === 'groupFilter') {
      this.statusFilter(event.data)
    }
    else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  statusFilter(event) {
    this.applyFilterValue = null;
    this.selectedStatus = event.map(item => item.data).join(','); // Convert array to comma-separated string
    console.log(this.selectedStatus);

    this.workflowService.getVisitorsList(this.selectedDate, this.pageStart, this.pageSize, this.selectedStatus);
    this.refreshPage();
  }

  create(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(ManageVisitorComponent, {
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.applyFilterValue = null;
      this.refreshPage()
    });
  }

  visitor(data) {
    this.showActions = null;
    console.log(data)
    const dialogRef = this.dialog.open(ManageVisitorComponent, {
      data: data,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm' || result === '' || result === null) {
        this.selectDropdown = null;
        this.refreshPage();
      }
    });
  }
  manageCoaster(data) {
    data['associationTypeId'] = "TAT-VS";
    data['associatedName'] = "Visitor";
    data['associationId'] = data.id;
    data['tagId'] = data.tagId;
    data['tag_type_name'] = data.tagTypeId;
    data['workflowTypeId'] = 'WF-VIS';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.getDynamicTableColumn();
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getVisitorsList(this.selectedDate);
  }

  visitorHistory(data) {
    const dialogRef = this.dialog.open(VisitorHistoryComponent, {
      data: data,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }

  viewVisitEvent(data) {
    const dialogRef = this.dialog.open(VisitEventComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.applyFilterValue = null;
      this.refreshPage()
    });
  }


  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('visitor').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
      }
    });
  }
}
