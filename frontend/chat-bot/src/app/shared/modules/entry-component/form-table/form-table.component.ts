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

import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-form-table',
  templateUrl: './form-table.component.html',
  styleUrls: ['./form-table.component.scss'],
   encapsulation: ViewEncapsulation.None,
})
export class FormTableComponent implements OnInit {

  @Input() title: any;
  @Input() headerStyle: any;
  @Input() tableData : any;
  @Input() tableLabel : any;
  @Input() columns : any;
  @Input() pageSizeOptions : any = [100, 200, 300, 400, 500];
  @Input() id : any;
  @Input() styles: any;
  @Input() tableStyle: any;
  @Input() pageSize: any;
  @Input() action: any;
  @Output() triggerAction = new EventEmitter<any>();
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    this.dataSource.paginator = value;
  }    
  @ViewChild(MatSort)
  set sort(value: MatSort) {
    this.dataSource.sort = value;
  }

  tableColumns: string[] = [];
  tableData1 = [];
  constructor() { }

  ngOnInit(): void {
    this.initializeTable();
  }

  ngOnChanges(changes: SimpleChanges){
    this.initializeTable();
  }

  initializeTable(): void {
    this.tableColumns = [];
    this.tableData1 = [];
    this.tableColumns = this.columns ? [...this.columns] : ['column1', 'column2'];
    if(!this.tableData){
      this.tableData1 = [];
    }else{
      this.tableData1 = this.tableData;
    }

    if (this.action) {
      this.addUniqueColumn('action');
    }

    this.dataSource.data = this.tableData1;
  }

  addUniqueColumn(columnName: string): void {
    if (!this.tableColumns.find(col => col === columnName)) {
      this.tableColumns.push(columnName);
    }
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  actionTrigger(type,data,index){
    let actionData = {
      'type':type,
      'data':data,
      'tableIndex':index
    }
    this.triggerAction.emit(actionData);
  }
}
