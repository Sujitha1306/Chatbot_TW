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

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateSetResourceComponent } from '../../../shared/modules/entry-component/create-set-resource/create-set-resource.component';
import { CommonService } from '../../../shared';

@Component({
  selector: 'app-set-resource',
  templateUrl: './set-resource.component.html',
  styleUrls: ['./set-resource.component.scss']
})
export class SetResourceComponent {

  displayedColumns: string[] = ['ID', 'Identifier', 'Name', 'Description', 'Items', 'Status', 'Updated By' , 'Updated Time'];
  CRdisplayedColumns:  string [] = ['Name', 'Identifier', 'Procedure', 'OT Location', 'Patient Name', 'Request Date', 'Request By', 'Status'];
  CRiconHeader = [];
  CRiconColumn = [];
  CRsortColumn = [];
  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  isloading: boolean = false;
  public selectedName: any = null;
  public selectedView: any;
  public applyFilterValue: any;
  public tableData: any = [];
  public cssdTableData: any = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = [];
  eventColumn = ['Name'];
  permissionControl = [];
  selectDropdown: any;
  selectedIndex : any;
  pageSize: number = 10;
  pageStart: number = 0;
  length: number = 0;

  constructor(public dialog: MatDialog, private readonly commonService: CommonService) { }

  ngOnInit(): void {
    this.getStrelieSetList(null, this.pageSize, this.pageStart);
  }

  headerEventAction(event) {
    if (event.data === 'Create') {
      this.createSetResource(null)
    } else if (event.data === 'Modify') {
      this.createSetResource(event)
    } else if (event.key === "applyFilter") {
      this.applyFilter(event.data)
    } else {
      this.refreshPage();
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getStrelieSetList(this.applyFilterValue, this.pageStart, this.pageSize);
    } else if (this.applyFilterValue.length == 0) {
      this.getStrelieSetList(null, this.pageStart, this.pageSize);
    }
  }

  getStrelieSetList(name?, pageSize?, pageStart?) {
    this.isloading = true;
    this.commonService.getSterlieSetList(name, pageSize, pageStart).subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.tableData = res.results;
        this.length = res.totalRecords;
        const Columns = ['ID', 'identifier', 'name', 'description', 'totalCounts', 'sterileStatusName', 'userName', 'eventTime' ];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      }
    })
  }

  getCssdRequest() {
    this.isloading = true;
    this.commonService.getSetRequestList().subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.cssdTableData = res.results;
        const Columns = ['sterlizeName', 'identifier', 'otProcedureName', 'otLocationName', 'patientName', 'requestDate', 'requestByName', 'statusValue']
        for (let i = 0; i <= Columns.length; i++) {
          this.cssdTableData.map(data => {
            data[this.CRdisplayedColumns[i]] = data[Columns[i]]
          })
        }
      }
    })
  }

  createSetResource(data) {
    this.showActions = null;
    this.selectedName = data;
    let templatepop = {
      type: 'Create', setResource: null
    }
    if(data?.key === 'Name') {
      templatepop = {
        type: data.keyVal,
        setResource: data.data
      }
    } else if(data?.key === 'manageAction') {
      templatepop = {
        type: data.data,
        setResource: data.keyVal
      }
    }
    const dialogRef = this.dialog.open(CreateSetResourceComponent, {
      data: templatepop,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.showActions = this.showActions1;
    } else {
      this.selectedName = data;
      this.showActions = this.showActions2;
    }
  }

  refreshPage() {
    this.showActions = this.showActions1;
    if (this.selectedIndex === 0){
      this.getStrelieSetList(null, this.pageSize, this.pageStart);
    } else if (this.selectedIndex === 1){
      this.getCssdRequest();
    } else {
      this.getStrelieSetList(null, this.pageSize, this.pageStart);
    }
  }

  eventAction(event) { 
    if(event.key === 'Name') {
      this.createSetResource(event)
    }
  }

  tabChanged(event){
  this.selectedIndex = event.index;
  if(this.selectedIndex === 0) {
    this.selectDropdown = this.showActions1;
    this.getStrelieSetList(null, this.pageSize, this.pageStart)
  } else if(this.selectedIndex === 1){
    this.getCssdRequest()
  }
  }

}
