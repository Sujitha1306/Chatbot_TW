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
import { CommonService, WorkflowService } from '../../../shared';
import { SalesOrderManagementComponent } from '../../../shared/modules/entry-component/sales-order-management/sales-order-management.component';

@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.scss']
})
export class SalesOrderComponent implements OnInit {
  showActions1 = [{ id: 'create', value: 'Create' }];
  showActions2 = [{ id: 'modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = [];
  dateTimeColumns=["Start Time","Delivered Time"]
  columnData: string[] = [];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  eventColumn = [];
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

  constructor(public dialog: MatDialog, private readonly workflowService: WorkflowService, public commonService: CommonService,) { }

  ngOnInit(): void {
     this.getDynamicTableColumn()
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('sales-order').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.columnData = dynamicColumns.columns
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.pageSize = dynamicColumns.pageSize
        if(dynamicColumns?.dateTimeColumns){
        this.dateTimeColumns = dynamicColumns.dateTimeColumns;
        }
      }
      this.getSalesOrder(this.pageStart,this.pageSize)
    });
  }

  getSalesOrder(pageStart: number, pageSize: number, name?: string) {
    this.isloading = true;
    this.commonService.getDeliveryRequest('DRT-SAOR').subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords
      for (let i = 0; i <= this.columnData.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columnData[i]];
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
      this.getSalesOrder(this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getSalesOrder(this.pageStart, this.pageSize, null);
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if(event.data === 'create'){
      this.createSaleOrder('')
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      // this.getSalesOrder(this.pageStart,this.pageSize, this.applyFilterValue);
    } else if(event.key === 'Order No') {
      this.createSaleOrder(event?.data);
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getSalesOrder(this.pageStart,this.pageSize, this.applyFilterValue)
  }


  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2
  }

  createSaleOrder(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(SalesOrderManagementComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
}
