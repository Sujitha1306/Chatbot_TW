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
import { ItemMasterManagementComponent } from '../../../shared/modules/entry-component/item-master-management/item-master-management.component';
import { ActivatedRoute } from '@angular/router';
import { DeliveryReqManagementComponent } from '../../../shared/modules/entry-component/delivery-req-management/delivery-req-management.component';

@Component({
  selector: 'app-item-master',
  templateUrl: './item-master.component.html',
  styleUrls: ['./item-master.component.scss']
})
export class ItemMasterComponent implements OnInit {
  public displayedColumns = ['ID', 'Item No', 'Name', 'Item Type', 'Item Category', 'Total Quantity', 'Min Stock Level', 'Reorder Level', 'Add Stock', 'Delivery'];
  public iconHeader = ['ID'];
  public iconColumn = ['ID', 'Add Stock', 'Delivery'];
  public sortColumn = ['Add Stock', 'Delivery'];
  public eventColumn = [];
  public tableData: any[];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue: any;
  showAction1 = [{ id: 'create', value: 'Create' }];
  showAction2 = [{ id: 'modify', value: 'Modify' }]
  public selectedView = 'table';
  public showActions = this.showAction1;
  selectDropdown: any;
  selectedName: any = null;
  pageStart = 0;
  pageSize = 10;
  stockBtn: string;

  constructor(private readonly workflowService: WorkflowService, private readonly dialog: MatDialog, 
    private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getItemMaster(this.pageStart, this.pageSize, true);
  }

  refreshPage() {
    this.showActions = this.showAction1;
    this.applyFilterValue = null;
    this.selectedName = null;
    this.getItemMaster(this.pageStart, this.pageSize);
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createItems('');
    } else if (event.data === 'modify') {
      this.createItems(this.selectedName);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event: any) {
    if(event.key === 'Add Stock'){
      this.stockBtn = 'inventory';
      this.createItems(event.data);
    } else if(event.key === 'Delivery'){
      this.createRequest(event.data);
    }
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  createItems(data) {
    this.showActions = null;
    let itemData = {type: 'item', itemData: data, tab: this.stockBtn}
    const dialogRef = this.dialog.open(ItemMasterManagementComponent, {
      data: itemData, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.stockBtn = null
      this.refreshPage();
    });
  }

  getItemMaster(pageStart, pageSize, routerEvent?) {
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.item.results;
      const Columns = ['ID', 'itemNo', 'name', 'itemTypeName', 'itemCategoryName', 'totalQuantity', 'minimumStockLevel', 'reorderLevel', 'Add Stock', 'Delivery'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.workflowService.getAllIterm(null, null, pageStart, pageSize).subscribe(res => {
        this.tableData = res.results;
        const Columns = ['ID', 'itemNo', 'name', 'itemTypeName', 'itemCategoryName', 'totalQuantity', 'minimumStockLevel', 'reorderLevel', 'Add Stock', 'Delivery'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      })
    }
    if (this.applyFilterValue !== null) {
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
  }

  createRequest(data) {
    let rowData = {type: 'item', intendData: null, itemData: data}
    const dialogRef = this.dialog.open(DeliveryReqManagementComponent, {
      data: rowData, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage()
    });
  }

}
