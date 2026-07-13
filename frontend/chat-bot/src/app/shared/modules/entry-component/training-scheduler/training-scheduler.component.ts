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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { CoasterComponent } from '../enroll-patient/enroll-patient.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from "@angular/material/core";
import { StyleLoaderService } from '../../../services/style-loader.service ';
import { AppToastService } from '../../../services/toaster.service';

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
  selector: 'app-training-scheduler',
  templateUrl: './training-scheduler.component.html',
  styleUrls: ['./training-scheduler.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class TrainingSchedulerComponent implements OnInit {
  height: number;
  public isLoading = false;
  displayedColumns: string[] = ["#", "firstName", "tagId"];
  trainingColumns: string[] = ["#", "firstName", "tagId", "status"];
  public defaultTaskDate = this.datepipe.transform(new Date(), 'yyyy-MM-ddTHH:mm');
  applyFilterValue = null;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public TrainingdataSource = new MatTableDataSource<any>();
  public TRdataSource = new MatTableDataSource<any>();
  searchUserListItems: any=[];
  searchUserlist: any=[];
  today = new Date();
  public currentDate = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public dateForm: FormGroup;
  checkedUser: any=[];
  checkedUserId: any=[];
  trainingListExist = false;
  constructor(
    private readonly styleLoader: StyleLoaderService,
    public form: FormBuilder,
    public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private readonly commonService: CommonService,
    public thisDialogRef: MatDialogRef<any>, 
    public toastr: AppToastService,
    private readonly datepipe: DatePipe) {
  }
  ngOnInit(): void {
    this.styleLoader.loadStyleByType('leaflet')
    this.buildForm();
    this.getTrainee();
  }
  buildForm() {
    this.dateForm = this.form.group({
      fromDate: [this.selectedDate ? this.selectedDate : ''],
    });
  }
  onWindowResized(size) {
    this.height = size - 65;
  }
  getAssociatedUser(event) {
    if(event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAssociatedUser(null, event.text).subscribe(res => {
          this.searchUserListItems = res.results;
          this.searchUserlist = this.searchUserListItems;
        });
      } else {
        this.searchUserlist = this.searchUserListItems;
      }
    } else {
      this.searchUserlist = [];
    }
  }
  getTrainee() {
    this.commonService.getAssociatedUser('RO-AD', null).subscribe(res => {
      if(res.results) {
        this.TRdataSource = new MatTableDataSource<any>(res.results);
        if(this.applyFilterValue !== null){
          this.TRdataSource.filter = this.applyFilterValue;
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        this.TRdataSource.paginator = this.paginator;
        this.TRdataSource.sort = this.sort;
      }
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.TRdataSource.filter = filterValue;

  }
  manageCoster(data) {
    data['workflowTypeId']    = 'WF-STF';
    data['associationId']     = data.id;
    data['associationTypeId'] = 'TAT-US';
    data['associatedName']    = 'User';
    data['tag_type_name']     = data.tagAssociationType;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data, 
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.getTrainee();
      }
    });
  }
  checkToAddUser(data) {
    if(this.checkedUser.length === 0) {
      this.checkedUser.push(data);
      this.checkedUserId.push((data?.id).toString());
    } else {
      const user = this.checkedUser.filter(x => x.id === data?.id);
      if(user.length !== 0) {
        const id = (data?.id).toString();
        this.checkedUser = this.checkedUser.filter(x => x.id !== data?.id);
        this.checkedUserId = this.checkedUserId.filter(x => id.indexOf(x) === -1);
      } else {
        this.checkedUser.push(data);
        this.checkedUserId.push((data?.id).toString());
      }
    }
  }
  addUser() {
    this.TrainingdataSource = new MatTableDataSource<any>(this.checkedUser);
  }
  checkToRemoveUser(data) {
    if(this.checkedUser.length !== 0) {
      this.checkedUser = this.checkedUser.filter(x => x.id !== data.id);
    }
  }
  removeUser() {
    const id = this.checkedUser.map(x => x.id);
    this.checkedUserId = this.checkedUserId.filter(x => id.toString().indexOf(x) > -1);
    this.TrainingdataSource = new MatTableDataSource<any>(this.checkedUser);
  }
  groupUser() {
    const userIds = this.checkedUser.map( x => x.id);
    const data = {
      "date": this.datepipe.transform(this.dateForm.controls['fromDate'].value, 'yyyy-MM-dd'),
      "entityType": "HazmatUser",
      "userIds": userIds
    }
    this.commonService.scheduleUser(data).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        // this.thisDialogRef.close();
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  changeDate(dateType) {
    if (dateType== 'previous') {
      this.currentDate.setDate(new Date(this.dateForm.controls['fromDate'].value).getDate() - 1);
      this.dateForm.controls['fromDate'].setValue(this.currentDate);
    } else if (dateType== 'next') {
      this.currentDate.setDate(new Date(this.dateForm.controls['fromDate'].value).getDate() + 1);
      this.dateForm.controls['fromDate'].setValue(this.currentDate);
    }
  }
  fixClick() {
    console.log('')
  }
}

