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
import * as moment_ from 'moment';
import { MY_FORMATS } from '../../../app.module';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { EnrollRegisterEmployeeComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { WorkflowService } from '../../../shared';
import { ActivatedRoute } from '@angular/router';

const moment = moment_;

@Component({
  selector: 'app-temporary-id-card',
  templateUrl: './temporary-id-card.component.html',
  styleUrls: ['./temporary-id-card.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class TemporaryIdCardComponent implements OnInit {

  displayedColumns: string[] = ['Name', 'Employee ID', 'Mobile', 'Tag ID', 'Reporting Employee ID'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  tableData: any;
  selection = new SelectionModel<any>(true, []);
  public tempForm: FormGroup;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
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
    private readonly dateAdapter: DateAdapter<Date>, private readonly route: ActivatedRoute) {
    dateAdapter.setLocale("en-in"); 
    this.today.setDate(this.today.getDate());
    }

  ngOnInit() {
    this.buildForm();
    this.getTempList(this.selectedDate, true);
    
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

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getTempList(this.selectedDate);
  }

  buildForm() {
    this.tempForm = this.fb.group({
      fromDate : new FormControl(moment()),
    });
  }

  getTempList(dateValue, routerEvent?: boolean): void {
    this.selection.clear();
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.tempIdCard.results;
      const tempIdDetails = this.route.snapshot.data.tempIdCard.results;
        for (let i in tempIdDetails) {
          const employeeTagDetails = tempIdDetails[i]['tags'];
          if (employeeTagDetails.length > 0) {
            tempIdDetails[i]['tagIds'] = Array.prototype.map.call(employeeTagDetails, tags => tags.tagSerialNumber).toString();
        }
      }
      this.tableData = tempIdDetails;
      const Columns = ['employeeName', 'mainidentifier', 'mobileNo', 'tagIds', 'managerId'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
        this.workflowService.getTempIdCardList(this.selectedDate).subscribe((res) => {
          const tempIdDetails = res.results;
          for (let i in tempIdDetails) {
            const employeeTagDetails = tempIdDetails[i]['tags'];
            if (employeeTagDetails.length > 0) {
              tempIdDetails[i]['tagIds'] = Array.prototype.map.call(employeeTagDetails, tags => tags.tagSerialNumber).toString();
          }
        }
        this.tableData = tempIdDetails;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['employeeName', 'mainidentifier', 'mobileNo', 'tagIds', 'managerId'];
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
  eventAction(event) {
    if(event.key === 'Name') {
      this.tempEmployee(event.data);
    }
  }
  
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getTempList(this.selectedDate);
    } else if (event.data === 'enroll') {
      this.tempEmployee([]);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  tempEmployee(data) {
    this.showActions = null;
    data['eType'] = 'tempId';
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
