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
import {CommonService, ConfigurationService, WorkflowService} from '../../../shared';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryReqManagementComponent } from '../../../shared/modules/entry-component/delivery-req-management/delivery-req-management.component';

@Component({
  selector: 'app-intend-management',
  templateUrl: './intend-management.component.html',
  styleUrls: ['./intend-management.component.scss']
})
export class IntendManagementComponent implements OnInit {
  public displayedColumns = ["Item Name", "Department", "Requested User Name", "Schedule Date", "Delivery Status", "Requested Quantity", "Requested Date", "Allocated Quantity", "Delivered Date"];
  public DatetimeColumns = ["Schedule Date", "Requested Date", "Delivered Date"]
  public iconHeader = [];
  public iconColumn = ['Schedule Date', 'Requested Date', 'Delivered Date'];
  public sortColumn = [];
  public eventColumn = ['Requested User Name'];
  public columns = [];
  public tableData: any[];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue: any;
  public pageStart = 0;
  public pageSize = 50;
  public selectFilter = [{ id: "dep", value: "DEPARTMENT" }]
  public filterData : any = 'All';
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public selectedView = 'table';
  public showActions = this.showAction1;
  selectDropdown: any;
  selectedName: any = null;
  length: any;
  rowFilter: any = [];
  selectedFilterData: any;
  activate_btn: any;
  departmentId = parseInt(localStorage.getItem('ZGVwYXJ0bWVudElk'));
  isloading: boolean = false;

  constructor(private readonly workflowService: WorkflowService, private readonly route: ActivatedRoute, private readonly dialog: MatDialog,
    private readonly configurationService: ConfigurationService, private readonly commonService: CommonService) { 
      this.activate_btn = this.commonService.getActivePermission('button');
      if (this.activate_btn.includes('BT_STMA')) {
        this.selectedFilterData = this.departmentId;
      } else {
        this.selectedFilterData = null
      }
    }

  ngOnInit(): void {
    this.getDynamicColumn();
    this.getFilter('dep')
  }

  getFilter(id){
    if(id === 'dep'){
      this.configurationService.getAssetDepartment().subscribe(res =>{
        if(this.activate_btn.includes('BT_STMGDEPT')) {
          this.rowFilter = res.results;
          this.filterData = this.departmentId;
        } else {
          this.rowFilter = null;
        }
      })
    }
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
  }

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createRequest('');
    } else if (event.key === "manageWorklist") {
      this.manageWorklist(event.data);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  manageWorklist(data) {
    this.selectedFilterData = data
   this.getAllIntend(this.pageStart, this.pageSize, this.selectedFilterData)
  }

  eventAction(event: any) {
    if(event.key === 'Requested User Name'){
      this.createRequest(event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllIntend(this.pageStart, this.pageSize, this.selectedFilterData);
    }
  }

  refreshPage(){
    this.showActions = this.showAction1;
    this.getAllIntend(this.pageStart, this.pageSize, this.selectedFilterData);
  }

  createRequest(data) {
    this.showActions = null;
    let rowData = {type: 'intend', intendData: data}
    const dialogRef = this.dialog.open(DeliveryReqManagementComponent, {
      data: rowData, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  getDynamicColumn() {
     this.commonService.getDynamicTableColumn('indent').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.columns = dynamicColumns.columns;
        if(dynamicColumns.dateTimeColumns){
        this.DatetimeColumns = dynamicColumns.dateTimeColumns
        }
      }
      this.getAllIntend(this.pageStart, this.pageSize, this.selectedFilterData, false);
    });
  }

  getAllIntend(pageStart, pageSize, department?, routerEvent?) {
    this.isloading = true;
    if (this.applyFilterValue !== null) {
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
    if(routerEvent){
      this.tableData = this.route.snapshot.data.int.results;
      this.tableData.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      this.length = this.route.snapshot.data.int.totalRecords;
      let Columns = [ "itemMasterName", "requestUserDepartmentName","requestedByUserName", "startTime","deliveryStatusName", "requestedQuantity","requestDatetime", "allocatedQuantity","deliveredDatetime"];
      if (this.columns.length) {
        Columns = this.columns
      }
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          if(Columns[i] == 'itemMasterId' || Columns[i] == 'itemMasterName' || Columns[i] == 'requestedQuantity' || Columns[i] == 'allocatedQuantity' || Columns[i] == 'deliveredDatetime' || Columns[i] == 'batchId') {
            data[this.displayedColumns[i]] = data.deliveryDetails.length ? data.deliveryDetails[0][Columns[i]] : null
          } else {
            data[this.displayedColumns[i]] = data[Columns[i]];            
          }
        });
      }
      this.isloading = false;
    } else {
      this.workflowService.getAllDelivery(pageStart, pageSize, null, null, department).subscribe(res =>{
        this.isloading = false;
        this.tableData = res.results;
        this.tableData.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        this.length = res.totalRecords;
        let Columns = [ "itemMasterName", "requestUserDepartmentName","requestedByUserName", "startTime","deliveryStatusName", "requestedQuantity","requestDatetime", "allocatedQuantity","deliveredDatetime"];
        if (this.columns.length) {
          Columns = this.columns
        }
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            if(Columns[i] == 'itemMasterId' || Columns[i] == 'itemMasterName' || Columns[i] == 'requestedQuantity' || Columns[i] == 'allocatedQuantity' || Columns[i] == 'deliveredDatetime' || Columns[i] == 'batchId') {
              data[this.displayedColumns[i]] = data.deliveryDetails.length ? data.deliveryDetails[0][Columns[i]] : null
            } else {
              data[this.displayedColumns[i]] = data[Columns[i]];            
            }
          });
        }
      })
    }
  }
}
