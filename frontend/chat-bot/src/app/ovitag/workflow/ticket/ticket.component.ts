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
import { Component, Inject, OnInit, Optional,  } from '@angular/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { CommonService, ConfigurationService } from '../../../shared';
// import { EntityTicketComponent } from '../../../shared/modules/entry-component/entity-ticket/entity-ticket.component';
import { MY_FORMATS } from '../../../app.module';

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class TicketComponent implements OnInit {

  public activate_btn: any = [];
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: "create", value: "Create Ticket"}
  ];
  showAction2 = [
    { id: "modify", value: "Modify Ticket"}
  ];
  public showActions = this.showAction1
  public selectDropdown: any;
  public selectedName: any = null;
  public selectedView = 'table';
  public loading = false;
  displayedColumns: string[] = ["ID","TicketNo","Description","Date","Status","Assigned To"];
  dateColumns=["Date"]
  iconHeader = ["ID"];
  iconColumn: any = ["ID"];
  sortColumn: any = [];
  permissionControl = ["BT_ALLE"];
  eventColumn = ["Description"];
  tableData: any;

  constructor(public datepipe: DatePipe, public dialog: MatDialog,
    public configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly route: ActivatedRoute, @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }
  ngOnInit() {
    this.getAllTicketRequest(this.selectedDate,true);
    }

  rowClick(data) {
    if (this.selectedName && data.requestId == this.selectedName.requestId) {
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
  }

  refreshPage(isAutoRefresh?: boolean) {
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.showActions = this.showAction1;
    this.selectedName = null;
    this.applyFilterValue = null;
    this.selectDropdown = null;
    this.getAllTicketRequest(this.selectedDate,false);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getAllTicketRequest(this.selectedDate);
    } else if (event.data === 'create') {
      this.createTicket('');
    } else if (event.data === 'modify') {
      this.createTicket(this.selectedName);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event){
    if (event.key === 'Description') {
      this.createTicket(event.data);
    }
  }

  getAllTicketRequest(fromDate,routerEvent?: boolean,): void {
    this.selectedDate = this.datepipe.transform(new Date(fromDate), 'yyyy-MM-dd');
    this.loading = true;
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.ticket.results;
      this.loading = false;
      const Columns = ["ID","requestIdentifier","remarks","startTime","statusName","porterNames"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.commonService.getTicketRequest(this.selectedDate, 'RQT-TKT').subscribe((res) => {
          this.tableData = res.results;
          this.loading = false;
          if(this.applyFilterValue !== null){
            this.applyFilterValue = this.applyFilterValue + ' ';
          }
          const Columns = ["ID","requestIdentifier","remarks","startTime","statusName","porterNames"];
          for (let i = 0; i <= Columns.length; i++) {
            this.tableData.map((data) => {
              data[this.displayedColumns[i]] = data[Columns[i]];
            });
          }
      });
    }
  }

  createTicket(data) {
    this.showActions = null
    let rowData = this.selectedName
    rowData = data;
    if(rowData === null){
      data = { "id": null, "entityId": null, "entityDetail": null };
    } else {
      data = { "id": null, "entityId": null,"requestId": rowData.requestId, "data": null }
    }
    // const dialogRef = this.dialog.open(EntityTicketComponent,
    //   { data: data, panelClass: ['small-popup'], disableClose: true });
    // dialogRef.afterClosed().subscribe(result => {
    //   this.applyFilterValue = null;
    //   rowData = null;
    //   this.refreshPage();
    // });
  }
}
