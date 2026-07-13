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
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService } from '../../../shared';

@Component({
  selector: 'app-schedule-request',
  templateUrl: './schedule-request.component.html',
  styleUrls: ['./schedule-request.component.scss']
})
export class ScheduleRequestComponent implements OnInit {

  public locationId = 'All'
  public selectFilter = [{ id: 'filter', value: 'FILTER' }];
  public rowFilter = [];
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedData = [
    { 'colName': 'thumbnailUrl', 'title': 'Topic', 'dataName': 'thumbnailUrl' },
    { 'colName': 'duration', 'title': 'Duration', 'dataName': 'duration' },
    { 'colName': 'preferredAt', 'title': 'Requested slot', 'dataName': 'preferredAt' },
    { 'colName': 'Name', 'title': 'Request by', 'dataName': 'Name' },
    { 'colName': 'createdAt', 'title': 'Request date', 'dataName': 'createdAt' },
    { 'colName': 'requestStatus', 'title': 'Status', 'dataName': 'requestStatus' },
  ];
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  passingdata: any;
  isOpen: boolean = false;
  defaultImg = '../../../../assets/Alert/common_icons/default img.png'

  constructor(public commonService: CommonService) { }

  ngOnInit(): void {
    this.getAllScheduleRequest();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if(filterValue === 'all'){
      this.dataSource.filter = ''
    }
  }

  refreshPage(){
    this.getAllScheduleRequest()
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else {
      this.refreshPage();
    }
  }

  getAllScheduleRequest(){
    this.commonService.getScheduleRequest(null).subscribe(res => {
      this.dataSource = new MatTableDataSource(res.results.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }

  open(event){
    if(event === false){
      this.getAllScheduleRequest()
    }
    this.reportOpen(event, null);
  }

  reportOpen(show, data){
    let kydata = {'type': "schedule", 'reportData': data}
    this.passingdata = kydata;
    this.isOpen = show;
  }
  fixClick() {
    console.log('')
  }  
}
