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
import { CreateSupplierComponent } from '../../../shared/modules/entry-component/create-supplier/create-supplier.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  public displayedColumns = ['Supplier Name', 'Contact Number', 'Email', 'City', 'Country', 'Tax Id'];
  public iconHeader = [];
  public iconColumn = [];
  public sortColumn = [];
  public eventColumn = ['Supplier Name'];
  public tableData: any[];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue = null;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public selectedView = 'table';
  public showActions = this.showAction1;
  selectDropdown: any;
  selectedName: any = null;
  public pageSize = 10;
  public pageStart = 0;
  public length = 0;

  constructor(private readonly workflowService: WorkflowService, private readonly dialog: MatDialog, private readonly route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.getAllSupplier(true);
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
    this.getAllSupplier()
  }

  refreshPage() {
    this.showActions = this.showAction1;
    this.getAllSupplier();
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createSuppiler('');
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if(event.key === 'Supplier Name'){
      this.createSuppiler(event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllSupplier();
    }
  }

  createSuppiler(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(CreateSupplierComponent, {
      data: data, panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  getAllSupplier(routerEvent?) {
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.supp.results;
      this.length = this.route.snapshot.data.supp.totalRecords;
      const Columns = ['name', 'phone', 'inchargeEmail', 'city', 'country', 'taxIdentifier'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          if(Columns[i] == 'phone' || Columns[i] == 'city' || Columns[i] == 'country') {
            if (data.entityAddresses && data.entityAddresses[0]) {
              data[this.displayedColumns[i]] = data.entityAddresses[0][Columns[i]];
            } else {
              data[this.displayedColumns[i]] = '';
            }
          } else {
            data[this.displayedColumns[i]] = data[Columns[i]];            
          }
        });
      }
    } else {
      this.workflowService.getAllSupplier(this.pageSize, this.pageStart, this.applyFilterValue).subscribe(res => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        const Columns =  ['name', 'phone', 'inchargeEmail', 'city', 'country', 'taxIdentifier'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            if(Columns[i] == 'phone' || Columns[i] == 'city' || Columns[i] == 'country') {
              if (data.entityAddresses && data.entityAddresses[0]) { 
                data[this.displayedColumns[i]] = data.entityAddresses[0][Columns[i]]
              } else {
                data[this.displayedColumns[i]] = '';
              }
            } else {
              data[this.displayedColumns[i]] = data[Columns[i]];            
            }
          });
        }
      });
    }
    if (this.applyFilterValue !== null) {
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
  }
}
