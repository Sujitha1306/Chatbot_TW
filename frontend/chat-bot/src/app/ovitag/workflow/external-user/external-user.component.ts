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

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, ExcelService} from '../../../shared';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { KynUserComponent } from './kyn-user/kyn-user.component';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-external-user',
  templateUrl: './external-user.component.html',
  styleUrls: ['./external-user.component.scss']
})
export class ExternalUserComponent implements OnInit {

  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: 'user', value: 'Kyn User' },
    { id: 'report', value: 'Reported User' },
  ];
  public showActions = this.showAction1;
  public selectedType = 'user';
  public locationId = 'All';
  public selectFilter = [{ id: 'filter', value: 'FILTER' }];
  public rowFilter = [{id: 'public', name: 'Public'},{id: 'kynfluencer', name: 'Kynfluencer'},{id: 'kynformer', name: 'Kynformer'}]
  displayedData = [
    // { 'colName': 'Id', 'title': 'Id', 'dataName': 'Id' },
    { 'colName': 'Name', 'title': 'Name', 'dataName': 'Name' },
    { 'colName': 'Email', 'title': 'Email', 'dataName': 'Email' },
    { 'colName': 'Mobile', 'title': 'Mobile', 'dataName': 'Mobile' },
    { 'colName': 'Role', 'title': 'Role', 'dataName': 'Role' },
    { 'colName': 'CreatedAt', 'title': 'CreatedAt', 'dataName': 'CreatedAt' },
    { 'colName': 'isActive', 'title': 'Status', 'dataName': 'isActive' }
  ];
  reportDisplayedData = [
    { 'colName': 'reportedName', 'title': 'Reported Name', 'dataName': 'reportedName' },
    { 'colName': 'name', 'title': 'User Name', 'dataName': 'name' },
    { 'colName': 'reportedAt', 'title': 'Reported At', 'dataName': 'reportedAt' },
    { 'colName': 'isDeleted', 'title': 'Deleted', 'dataName': 'isDeleted' },
    { 'colName': 'reports', 'title': 'Total Reports', 'dataName': 'reports' },
  ];
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  userReport: any = [];
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  filterValue = null;

  constructor(public commonService: CommonService, public ExcelService: ExcelService,
    public dialog: MatDialog, public toastr: AppToastService, public datepipe: DatePipe) { }

  ngOnInit() {
    this.getExternalUser(this.selectedType);
  }
  getExternalUser(data) {
    if(data === 'report'){
      this.displayedColumns = this.reportDisplayedData.map(res => res.colName);
      let data = {
        "limit": 2000,
        "skip": 0
      }
      this.commonService.getAllReportedUser(data).subscribe(res => {
        this.dataSource = new MatTableDataSource(res.results.data.value);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }) 
    } else {
      this.commonService.getKynUser().subscribe(res => {
        this.displayedColumns = this.displayedData.map(res => res.colName);
        this.dataSource = new MatTableDataSource(res.results.data['all_details']);
        this.userReport['arrayList'] = res.results.data['all_details']
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    }
    // this.commonService.getEntityDetailbyForm
  }

  getExcelDetails() {
    if (this.userReport['arrayList'].length) {
      if (!this.userReport['arrayList'].every(val => val.length === 0)) {
        const sheetName = 'kyn user';
        const fileName = 'kyn_User_report';
        const startDate = this.selectedDate;
        const data = this.userReport['arrayList'];
        console.log(data)
        this.ExcelService.singleSheet(data, sheetName, fileName, startDate);
      } else {
        this.toastr.warning('Warning', `No Data Found`);
      }
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if(filterValue === 'all'){
      this.dataSource.filter = ''
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    this.getExternalUser(this.selectedType);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'manageWorklist') {
      this.applyFilter(event.data);
    } else if (event.key === "manageAction") {
      this.selectedType = event.data;
      this. getExternalUser(event.data);
    } else if (event.key === "downloadExcel") {
      this.getExcelDetails();
    } else {
      this.refreshPage();
    }
  }

  userDetails(data) {
    const dialogRef = this.dialog.open(KynUserComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => { });
  }

  editUser(data) {
    const dialogRef = this.dialog.open(EditUserComponent,
      { panelClass:['confirmation-popup'], data: data, disableClose: true });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
      this.dataSource.filter = null;
    });
  }
  fixClick() {
    console.log('')
  }    
}

@Component({
  selector: 'app-external-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./external-user.component.scss'],
})
export class EditUserComponent implements OnInit {

  public userRoles = [{ 'key': '1', 'value': 'Public' }, { 'key': '2', 'value': 'Kynfluencer' }, { 'key': '3', 'value': 'Kynformer' }]
  public roleId = new UntypedFormControl();
  userkey: any;
  Role: any;

  constructor(public commonService: CommonService, public thisDialogRef: MatDialogRef<EditUserComponent>,
    public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any,  public toastr: AppToastService,) { }

  ngOnInit(): void {
    this.roleId.setValue(this.data.Role);
  }

  UserInfo(event){
    this.userkey = event.key
    this.Role = event.value
  }


  updateRole() {
    let id = this.data.Id
    let update = {
      "userRole": { 
        "key": this.userkey,
        "value": this.Role
    }
    }
    this.commonService.updateRole(id, update).subscribe((res) => {
        this.toastr.success("Success", `${res.message}`);
        this.thisDialogRef.close();
      },
      (error) => {
        this.toastr.error("Error", `${error.error.message}`);
      }
    );
  }
  fixClick() {
    console.log('')
  }
}
