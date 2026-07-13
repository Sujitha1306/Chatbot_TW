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
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { CommonService } from '../../../services/common.service';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-routine-history',
  templateUrl: './routine-history.component.html',
  styleUrls: ['./routine-history.component.scss'],
  

  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class RoutineHistoryComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  public noRoutineData = false;
  public RoutineDisplayedColumns =  ['Activity Name', 'Schedule Time', 'Location', 'Start Time', 'End Time', 'Status'];
  public RoutinedataSource: MatTableDataSource<any>;
  public height: any;
  public routineHistoryForm: FormGroup;
  
  public fromDate: any;
  public pageEvent: PageEvent;
  public length: any;
  public pageIndex: any;
  public pageStart = 0;
  public pageSize = 10;

  constructor(public thisDialogRef: MatDialogRef<RoutineHistoryComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
  private readonly commonService: CommonService, private readonly _dateFormat: DatePipe, public form: FormBuilder) { }

  ngOnInit() {
    this.routineHistoryForm = this.form.group({
      fromDate: [this.fromDate ? this.fromDate : '']
    });
    if (this.data.id) {
    this.getRoutineHistory(this.data.id, this.data.type, this.fromDate);
    }
  }

  getRoutineHistory(id, type, dateFilter, event?: any) {
    this.pageStart = (event != null) ? event.pageIndex : this.pageStart;
    this.pageSize = (event != null) ? event.pageSize : 10;
    let filterDate = '';
    if (dateFilter !== null || dateFilter !== '') {
      filterDate = this._dateFormat.transform(dateFilter, 'yyyy-MM-dd');
      this.fromDate = filterDate;
    }
    this.commonService.getRoutineEventDetails(id, type, filterDate, this.pageStart, this.pageSize).subscribe((res) => {
      if (res.statusCode === 1) {
        this.noRoutineData = false;
        this.RoutinedataSource = new MatTableDataSource<any>(res.results);
        this.RoutinedataSource.paginator = this.paginator;
        this.length = res.totalRecords;
      } else if (res.statusCode === 0) {
        this.RoutinedataSource = new MatTableDataSource<any>([]);
        this.RoutinedataSource.paginator = this.paginator;
        this.noRoutineData = true;
      }
    });
  }

}
