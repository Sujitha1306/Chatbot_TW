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
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { WorkflowService, CommonService } from '../../../shared';
import { Router, ActivatedRoute } from '@angular/router';

import { MY_FORMATS } from './../../../../app/app.module';
import { EnrollRegisterEmployeeComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class EmployeeComponent implements OnInit {
  public activate_btn: any = [];
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public ctsForm: FormGroup;
  public status = 'CS-AL';
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public applyFilterValue: any;
  public isAutoRefresh = false;
  public showActions = [{ id: 'enroll', value: 'Enroll' }];
  public selectDropdown: any;
  public selectedName: any = null;
  public selectedView = 'table';
  public selectFilter = [{ id: 'status', value: 'STATUS' }];
  public rowFilter: any = [];
  public locationId = 'CS-AL';

  HCDisplayedData = [
    { 'colName': 'Identifier', 'title': 'UHID', 'dataName': 'uhid' },
    { 'colName': 'Name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'DOB', 'title': 'Date Of Birth', 'dataName': 'birthdate' },
    { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'mobile_no' },
    { 'colName': 'Tag ID', 'title': 'Tag ID', 'dataName': 'tagId' },
    { 'colName': 'Battery Percentage', 'title': 'Battery Percentage', 'dataName': 'batteryPercentage' },
    { 'colName': 'No. of Contacts', 'title': 'No. of Contacts', 'dataName': 'noOfContacts' },
    { 'colName': 'Close Contact', 'title': 'Close Contact', 'dataName': 'closeContact' },
    { 'colName': 'Report', 'title': 'Report', 'dataName': 'Report' }
  ];

  eventColumn = ['Name','Report'];
  iconHeader = [];
  iconColumn = ['DOB'];
  dateColumns = ['DOB'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  tableData: any;
  HCDisplayedColumns = this.HCDisplayedData.map(res => res.colName);

  public empForm: FormGroup;
  @ViewChild('filter') input;
  public statusList: any;
  batteryPercentage: any = [];
  batteryPercentageList: any = [];

  constructor(public datepipe: DatePipe, public fb: FormBuilder, public dialog: MatDialog,
    private readonly workflowService: WorkflowService, private readonly commonService: CommonService,
    private readonly activeRoute : ActivatedRoute, private readonly router : Router) {
      this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.activeRoute.queryParams.subscribe(params => {
      if(params.hasOwnProperty('type')) {
        this.status = params['type'];
      }
    });
    this.buildForm();
    this.searchStatus('status');    

    this.getEmployeeList(this.status, true);

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
    this.router.navigate(['/ovitag/analytic-insights/employee-summary'], { queryParams: { id: emp_id, report : 'emp-contact', type: 'Employee', fdt : currentDate }});
  }
  buildForm() {
    this.ctsForm = this.fb.group({
      contactStatus: [this.status ? this.status : '']
    });
  }

  getEmployeeList(status, routerEvent?: boolean): void {
    this.status = status;
    if (routerEvent) {
      const employeeDetails = this.activeRoute.snapshot.data.employee.results;
      for (let i in employeeDetails) {
        const employeeTagDetails = employeeDetails[i]['tags'];
        if (employeeTagDetails.length > 0) {
            employeeDetails[i]['tagIds'] = Array.prototype.map.call(employeeTagDetails, tags => tags.tagSerialNumber).toString();
            this.batteryPercentage = Array.prototype.map.call(employeeTagDetails, tags => tags.batteryPercentage);        
          }
          employeeDetails[i]['batteryPercentage'] = this.getBatteryPercentage();
      }

      this.tableData = employeeDetails;
      const Columns = ['mainidentifier','employeeName','birthDate','mobileNo','tagIds','batteryPercentage','noOfContacts','closeContact', ''];
      for(let i in Columns){
        this.tableData.map(data => {
          if(this.HCDisplayedColumns[i] == 'Report') {
            data[this.HCDisplayedColumns[i]] = 'View Report';  
          } else {
            data[this.HCDisplayedColumns[i]] = data[Columns[i]];
          }
        });
      }
    } else {
      this.getNonRouterEmployeeList(status);
    }
  }

  getBatteryPercentage() {
    if (this.batteryPercentage.length === 2) {
        if (this.batteryPercentage[0] !== null && this.batteryPercentage[1] !== null) {
          this.batteryPercentageList.push(this.batteryPercentage[0]);
          this.batteryPercentageList.push(this.batteryPercentage[1]);
        } else if (this.batteryPercentage[0] !== null) {
          this.batteryPercentageList = this.batteryPercentage[0];
        } else if (this.batteryPercentage[1] !== null) {
          this.batteryPercentageList = this.batteryPercentage[1];
        }
      const battery = this.batteryPercentageList;
      this.batteryPercentageList = [];
      return battery;
    } else {
      return this.batteryPercentage;
    }
  }

  getNonRouterEmployeeList(status) {
    this.workflowService.getEmployeeList(status, this.fromDate).subscribe((res) => {
      const employeeDetails = res.results;
      this.tableData = employeeDetails;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['mainidentifier','employeeName','birthDate','mobileNo','tagIds','batteryPercentage','noOfContacts','closeContact', ''];
      for(let i in Columns){
        this.tableData.map(data => {
          if(this.HCDisplayedColumns[i] == 'Tag ID') {
            data[this.HCDisplayedColumns[i]] = data['tags'][0]['tagSerialNumber'];  
          } else if(this.HCDisplayedColumns[i] == 'Battery Percentage') {
            data[this.HCDisplayedColumns[i]] = data['tags'][0]['batteryPercentage'];  
          } else if(this.HCDisplayedColumns[i] == 'Report') {
            data[this.HCDisplayedColumns[i]] = 'View Report';  
          } else {
            data[this.HCDisplayedColumns[i]] = data[Columns[i]];
          }
        });
      }
    });
  }

  applyFilter(filterValue: string, clear) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
  }

  refreshPage(isAutoRefresh?: boolean) {
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getEmployeeList(this.status);
  }
  eventAction(event) {
    if(event.key === 'Name') {
      this.registerEmployee(event.data);
    } else if (event.key === 'Report') {
      this.getContactTracing(event.data.mainidentifier);
    }
  }

  searchStatus(id) {
    
    if(id === 'status'){
      this.commonService.getAppTerms('ContactTracingStatus').subscribe(res => {
        this.statusList = res.results;
        
        for(let i in this.statusList){
          let obj = {
            id: this.statusList[i].code,
            name: this.statusList[i].value
          };
          this.rowFilter.push(obj);
        }
        
      });
    } 
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,'');
    } else if (event.key === 'manageWorklist') {
      this.manageWorklist(event.data);
    } else if (event.data === 'enroll') {
      this.selectDropdown = 'enroll';
      this.registerEmployee(event);
    } else if(event.key === 'manageFilter') {
      this.searchStatus(event.data);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  manageWorklist(value) {
    this.locationId = value;    
    this.getEmployeeList(value);
  }
  registerEmployee(data) {
    data['eType'] = 'employee';
    data['workflowTypeId'] = 'WF-EM';
    const dialogRef = this.dialog.open(EnrollRegisterEmployeeComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm' || result === '' || result === null) {
        this.refreshPage();
        this.selectDropdown = null;
      }
    });
  }
}
