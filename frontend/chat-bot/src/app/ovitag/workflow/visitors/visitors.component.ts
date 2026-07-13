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
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MY_FORMATS } from '../../../app.module';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SelectionModel } from '@angular/cdk/collections';
import { EnrollRegisterEmployeeComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { WorkflowService } from '../../../shared/services/workflow.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-visitors',
  templateUrl: './visitors.component.html',
  styleUrls: ['./visitors.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class VisitorsComponent implements OnInit {

  displayedColumns: string[] = ['Name', 'Visitor ID', 'Visiting Employee ID', 'Mobile', 'Start Time', 'End Time' , 'Tag ID', 'Reason'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  tableData: any;
  public visitForm: FormGroup;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  today = new Date();
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public applyFilterValue: any;
  public isAutoRefresh = false;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'enroll', value: 'Enroll' },
  ];
  public showActions = this.showAction1;
  @ViewChild('filter') input;

  constructor(public dialog: MatDialog, private readonly workflowService: WorkflowService, public fb: FormBuilder, public datepipe: DatePipe,
    private readonly route: ActivatedRoute, private readonly router : Router, private readonly dateAdapter: DateAdapter<Date>) {
    dateAdapter.setLocale("en-in");
    this.today.setDate(this.today.getDate());
    }

  ngOnInit() {
    this.buildForm();
    this.getVisitorsList(this.selectedDate, true);

    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
  }

  getContactTracing(emp_id) {
    let currentDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    this.router.navigate(['/ovitag/analytic-insights/employee-summary'], { queryParams: { id: emp_id, report : 'emp-contact', type: 'visitor', fdt : currentDate}});
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getVisitorsList(this.selectedDate);
  }

  buildForm() {
    this.visitForm = this.fb.group({
      fromDate : new FormControl(new Date()),
    });
  }

  getVisitorsList(dateValue, routerEvent?: boolean): void {
    this.selection.clear();
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.visitor.results;
      const Columns = ['fullName', 'mainidentifier', 'hostEmployeeId', 'phoneNumber', 'checkinTime', 'checkoutTime' , 'tagId', 'comments'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.workflowService.getVisitorsList(this.selectedDate,0,50,null).subscribe((res) => {
        this.tableData = res.results;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['fullName', 'mainidentifier', 'hostEmployeeId', 'phoneNumber', 'checkinTime', 'checkoutTime' , 'tagId', 'comments'];
        for(let i=0; i<= Columns.length; i++){
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      });
    }
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }
  eventAction(event){
    if(event.key === 'Name') {
      this.visitorEmployee(event.data);
    } else {
      this.getContactTracing(event.data.mainidentifier);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getVisitorsList(this.selectedDate);
    } else if (event.data === 'enroll') {
      this.visitorEmployee([]);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  visitorEmployee(data) {
    this.showActions = null;
    data['eType'] = 'visitor';
    data['workflowTypeId'] = 'WF-EM';
    const dialogRef = this.dialog.open(EnrollRegisterEmployeeComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm' || result === '' || result === null) {
        this.selectDropdown = null;
        this.refreshPage();
      }
    });
  }
}
