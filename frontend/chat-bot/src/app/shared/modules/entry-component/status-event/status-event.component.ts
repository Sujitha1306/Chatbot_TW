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
import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { FormGroup, FormBuilder } from "@angular/forms";
import { CommonService } from "../../../services/common.service";
import { DatePipe } from "@angular/common";
import { ErrorStateMatcherService } from "../../../services/error-state-matcher.service";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from "@angular/material/core";
import { AppToastService } from "../../../services/toaster.service";
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
  selector: "app-status-event",
  templateUrl: "./status-event.component.html",
  styleUrls: ["./status-event.component.scss"],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class StatusEventComponent implements OnInit {
  public filterForm: FormGroup;
  public matcher = new ErrorStateMatcherService();
  public today: any = new Date();
  activate_btn: any[];
  pageEvent: PageEvent;
  displayedColumns: string[] = ['S.No', 'eventTime', 'locationName', 'attendanceStatusName'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource<any>();
  currentDate: any = new Date();
  length = null;
  pageStart = 0;
  pageSize = 10;

  constructor(
    public form: FormBuilder,
    public commonService: CommonService,
    public thisDialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public toastr: AppToastService,
    private readonly _dateFormat: DatePipe
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.buildForm();
    this.getAllDetails(this.today, this.pageStart, this.pageSize)
  }
  
  buildForm() {
    this.filterForm = this.form.group({
      fromDate: [this.today ? this.today : ''],
    });
  }

  getAllDetails(dateVal, pageStart, pageSize) {
    const date = this._dateFormat.transform(new Date(dateVal), 'yyyy-MM-dd');
    this.commonService.getAttendanceEvent(date, pageStart, pageSize, this.data?.userId).subscribe(res => {
      this.dataSource = new MatTableDataSource(res.results);
      this.length = res.totalRecords;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  getAttenData(event?: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageStart = event.pageIndex;
    const date = this.filterForm.get('fromDate').value;
    this.getAllDetails(date, this.pageStart, this.pageSize)
  }

  changeDate(dateType) {
    if (dateType== 'previous') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() - 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
    } else if (dateType== 'next') {
      this.currentDate.setDate(new Date(this.filterForm.controls['fromDate'].value).getDate() + 1);
      this.filterForm.controls['fromDate'].setValue(this.currentDate);
    }
    let dateValue = this.filterForm.controls['fromDate'].value
    this.getAllDetails(dateValue, this.pageStart, this.pageSize);
  }
  fixClick() {
    console.log('')
  }
}
