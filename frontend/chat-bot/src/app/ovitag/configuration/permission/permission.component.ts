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
import { ConfigurationService } from '../../../shared';
import { ResourceMapComponent } from '../../../shared/modules/entry-component/resource-map/resource-map.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class PermissionComponent implements OnInit {
  public displayedColumns = ['ID', 'Name','Facility Name','Status'];
  public iconHeader = ['ID'];
  public iconColumn = ['ID','Status'];
  public eventColumn = ['Name'];
  public sortColumn = [];
  public permissionControl = ['BT_ALLE'];
  public tableData: any;
  public showAction1: any = [{ id: 'map', value: 'Create Group' }];
  public showAction2: any =[{ id: 'map', value: 'Manage' }]
  public showActions = this.showAction1;
  public applyFilterValue: any;
  selectedName = null;
  selectDropdown: any;
  public selectedView = 'table';
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;

  constructor(public dialog: MatDialog, public configurationService: ConfigurationService, private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getAllGroup(true,this.pageStart,this.pageSize);
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAllGroup(false,this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getAllGroup(false,this.pageStart, this.pageSize, null);
    }
  }

  refreshPage(){
    this.showActions = this.showAction1;
    this.selectDropdown = null;
    this.getAllGroup(false,this.pageStart,this.pageSize, this.applyFilterValue);
  }

  headerEventAction(event) {
    if (event.data == 'map') {
      this.groupMapping(this.selectedName);
    } else if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else {
      this.selectedName = null;
      this.refreshPage();
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

  eventAction(event){
    if(event.key === 'Name'){
      this.groupMapping(event.data)
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllGroup(false,this.pageStart,this.pageSize, this.applyFilterValue);
     }
  }

  getAllGroup(routerEvent?:boolean,pageStart?: number, pageSize?: number, name?: string) {
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.perm.results;
      const Columns = ['ID','name','facilityName','isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.configurationService.getAllGroup(pageStart, pageSize, name).subscribe(res => {
        this.tableData = res.results;
        const Columns =  ['ID','name','facilityName','isActive'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      })
    }
  }

  groupMapping(data) {
    this.showActions = null;
    let groupdata = {type: 'resource', data: data}
    const dialogRef = this.dialog.open(ResourceMapComponent, {
      data: groupdata, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
      this.refreshPage();
    });
  }

}
