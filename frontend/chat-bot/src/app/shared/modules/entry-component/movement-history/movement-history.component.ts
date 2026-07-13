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
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfigurationService } from '../../../services';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-movement-history',
  templateUrl: './movement-history.component.html',
  styleUrls: ['./movement-history.component.scss']
})
export class MovementHistoryComponent implements OnInit {
  @Input() historyData: any
  displayedColumns: string[] = ['Location', 'From Time','To Time', 'Duration'];
  public data: any
  public dateHistoryForm: FormGroup;
  today = new Date();
  public fromDate = this.dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public toDate = this.dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public dataSourceHistory: any=[];
  tableData: any;
  formDate: any;
  type: any;
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;
  sortColumn = ['locationName'];
  iconColumn = [];
  iconHeader = [];
  eventColumn = [];
  permissionControl = ['TAT-US'];
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;



  constructor(private readonly dateFormat: DatePipe, public form: FormBuilder, private readonly configurationServices: ConfigurationService,) {
   }

  ngOnInit(): void {
    this.data = this.historyData;
    this.buildForm()
  }

  buildForm(){
    this.dateHistoryForm = this.form.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : ''],
    })
  }

  eventAction(event){
    if (event.key == "pagination") {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    }
    this.getHistoryData(this.formDate, this.toDate, this.data.userId, this.type, this.pageStart, this.pageSize);
  }

  getGoHistoryData(){
    this.getHistoryData();
  }

  getHistoryData(formDate?: any, toDate?: any, id?: any, type?: any, pageStart?, pageSize?): void{
    this.formDate = this.dateHistoryForm.controls['fromDate'].value
    this.toDate = this.dateHistoryForm.controls['toDate'].value
    this.type = "TAT-US"
    this.configurationServices.getAllMovementHistory(this.formDate, this.toDate, this.data.userId, this.type, this.pageStart, this.pageSize).subscribe(res => {
      this.tableData = res.results.data['Location History'];
      this.length = res.results.data['Location History'].length;
      this.dataSourceHistory = this.tableData;
      const columns = ['Location Name','From Date','To Date', 'Duration']
      for (let i = 0; i <= columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[columns[i]];
          if(columns[i] == 'Location Name') {
            data[this.displayedColumns[i]] = data[columns[i]] + ', '+data['Floor Name'];
          }
        });
      }
    })
  }

}
