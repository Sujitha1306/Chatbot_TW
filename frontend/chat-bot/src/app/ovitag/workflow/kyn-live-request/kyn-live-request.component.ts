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

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../../../shared';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { CreateLiveRequestComponent } from './create-live-request/create-live-request.component';

@Component({
  selector: 'app-kyn-live-request',
  templateUrl: './kyn-live-request.component.html',
  styleUrls: ['./kyn-live-request.component.scss'],
})
export class KynLiveRequestComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public locationId = 'All'
  public selectFilter = [{ id: 'filter', value: 'FILTER' }];
  public rowFilter = [];
  showAction1 = [{ id: 'newRequest', value: 'Create new request' }];
  public showActions = this.showAction1;
  displayedData = [
    { 'colName': 'title', 'title': 'Title', 'dataName': 'title' },
    { 'colName': 'preferredAt', 'title': 'Event date and time', 'dataName': 'preferredAt' },
    { 'colName': 'locationValue', 'title': 'Event docation', 'dataName': 'locationValue' },
    { 'colName': 'Name', 'title': 'Request by', 'dataName': 'Name' },
    { 'colName': 'createdAt', 'title': 'Request date', 'dataName': 'createdAt' },
    { 'colName': 'requestStatus', 'title': 'Status', 'dataName': 'requestStatus' },
  ];
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  passingdata: { type: any; reportData: any; };
  isOpen = false;
  selectDropdown: string;
  defaultImg = '../../../../assets/Alert/common_icons/default img.png'

  constructor(public commonService: CommonService, public dialog: MatDialog,) { }

  ngOnInit(): void {
    this.getAllLiveRequest()
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if(filterValue === 'all'){
      this.dataSource.filter = ''
    }
  }

  refreshPage(){
    this.getAllLiveRequest()
    this.selectDropdown = null
    this.showActions = this.showAction1
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'newRequest') {
      this.selectDropdown = 'newRequest';
      this.newLiveRequest();
    } else {
      this.refreshPage();
    }
  }

  newLiveRequest() {
    this.showActions = null
    const dialogRef = this.dialog.open(CreateLiveRequestComponent,
      { data: null, width: '600px', panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
     });
  }

  getAllLiveRequest(){
    this.commonService.getLiveRequest(null).subscribe(res => {
      this.dataSource = new MatTableDataSource(res.results.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }

  open(event){
    if(event === false){
      this.getAllLiveRequest();
    }
    this.reportOpen(event, null);
  }

  reportOpen(show, data){
    let kydata = {'type': "live", 'reportData': data}
    this.passingdata = kydata;
    this.isOpen = show;
  }
  fixClick() {
    console.log('')
  }    
}
