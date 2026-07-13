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
import { WorkflowService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ItemMasterManagementComponent } from '../../../shared/modules/entry-component/item-master-management/item-master-management.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  public displayedColumns = ['Batch Id', 'Purchase Order','Purchase Req No','Supplier Name', 'Item Master Name', 'Balanced Qty', 'Expiry Date', 'Qty', 'Transaction Type'];
  public dateColumns =['Expiry Date']
  public iconHeader = [];
  public iconColumn = ['Transaction Type'];
  public sortColumn = [];
  public eventColumn = [];
  public tableData: any[];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public selectedView = 'table';
  public showActions = null;
  selectDropdown: any;
  selectedName: any = null;
  pageStart = 0;
  pageSize = 10;
  length = 0;

  constructor(private readonly workflowService: WorkflowService, private readonly dialog: MatDialog, private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getAllInventory(this.pageStart, this.pageSize, true);
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
  }

  refreshPage() {
    this.getAllInventory(this.pageStart, this.pageSize);
  }

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else {
      this.getAllInventory(this.pageStart, this.pageSize);
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllInventory(this.pageStart, this.pageSize);
    }
  }

  openInventory(data) {
    this.showActions = null;
    let itemData = {type: 'inventory', itemData: data, tab: 'inventory'}
    const dialogRef = this.dialog.open(ItemMasterManagementComponent, {
      data: itemData, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  getAllInventory(pageStart, pageSize, routerEvent?) {
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.invt.results;
      this.length = this.route.snapshot.data.invt.totalRecords;
      const Columns = ['batchId', 'purchaseOrderId', 'id','supplierName', 'itemMasterName', 'balancedQuantity', 'expiryDate', 'quantity', 'transactionTypeName'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.workflowService.getAllInventory(pageStart, pageSize).subscribe(res => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        const Columns = ['batchId', 'purchaseOrderId', 'id','supplierName', 'itemMasterName', 'balancedQuantity', 'expiryDate', 'quantity', 'transactionTypeName'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      })
    }
  }
}
