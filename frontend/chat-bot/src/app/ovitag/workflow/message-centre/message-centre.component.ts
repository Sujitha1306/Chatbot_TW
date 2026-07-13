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
import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { routerTransition } from '../../../router.animations';
import { CommonService } from '../../../shared';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateMessageCentre } from '../workflow.models';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../app.module';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-message-centre',
  templateUrl: './message-centre.component.html',
  styleUrls: ['./message-centre.component.scss'],
  animations: [routerTransition()],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class MessageCentreComponent implements OnInit {

  displayedColumns: string[] = ['To', 'Tag Id', 'Subject', 'Response', 'Time'];
  tableData: any;
  timeColumns = ['Time']
  eventColumn = [];
  iconHeader = [];
  iconColumn = ['Time'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLC'];

  public currentDate: any = new Date();
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public mcForm: FormGroup;
  public activate_btn: any = [];
  public applyFilterValue: any;
  selection = new SelectionModel<any>(true, []);
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'compose', value: 'Compose' },
  ];
  public showActions = this.showAction1;

  constructor(public datepipe: DatePipe, public dialog: MatDialog, private readonly route: ActivatedRoute,
    public snackbar: MatSnackBar, public commonService: CommonService, public fb: FormBuilder, private readonly dateAdapter: DateAdapter<Date>) {
    dateAdapter.setLocale("en-in");
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.getmcDetails(this.selectedDate, true);
    this.buildForm();
  }

  buildForm() {
    this.mcForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : '']
    });
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getmcDetails(this.selectedDate);
  }

  getmcDetails(dateValue, routerEvent?: boolean): void {
    this.selection.clear();
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.messageCentre.results;
        const Columns = ['name', 'sendTo', 'subject', 'response', 'createdOn'];
        for(let i=0; i<= Columns.length; i++){
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        let filterData = this.tableData.filter(val => this.datepipe.transform(new Date(val.createdOn),
          'yyyy-MM-dd') == this.selectedDate);
        this.tableData = filterData;
    } else {
      this.commonService.getCoasterMessage().subscribe((res) => {
        this.tableData = res.results;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['name', 'sendTo', 'subject', 'response', 'createdOn'];
        for(let i=0; i<= Columns.length; i++){
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        let filterData = res.results.filter(val => this.datepipe.transform(new Date(val.createdOn),
          'yyyy-MM-dd') == this.selectedDate);
        this.tableData = filterData;
      });
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getmcDetails(this.selectedDate);
    } else if (event.data === 'compose') {
      this.createMessage('');
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  public createMessage(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(CreateMessageCentreComponent, {
       data: data, panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getmcDetails(this.selectedDate);
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
  public openFloorPlan() {
    let blockList = [17938, 17939]
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: blockList, panelClass: 'medium-popup', disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
}

@Component({
  selector: 'create-message-centre',
  templateUrl: './create-message-centre.component.html',
  styleUrls: ['./message-centre.component.scss'],
})
export class CreateMessageCentreComponent implements OnInit {

  public tagForm: FormGroup;
  public createmessagecentre: CreateMessageCentre;
  public select = true;
  public coaster = false;
  public patient = false;
  public staff = false;
  public role_group = false;
  public location_group = false;
  public ok_cancel = false;
  public yes_no = false;
  public no_response = false;
  public list = [];
  public newList = [];
  public check_response: any;
  public data_code: any;
  public user: any;
  public check_response_val: any;
  public isDisabled = false;
  public loc_list = [];
  public newLocList = [];
  public role_list = [];
  public newEmpRoleList = [];
  public newAllRoleList = [];
  public send = [];
  public employee = false;
  emp: boolean;
  public activate_btn: any = [];
  public coasterList: any;
  public coasterListNew: any;
  associateType: any;
  public blankField: boolean;

  constructor(

    public form: FormBuilder, public toastr: AppToastService, public datepipe: DatePipe, public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateMessageCentreComponent>, private readonly detectchange: ChangeDetectorRef,
    private readonly commonService: CommonService, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    if (parseInt(localStorage.getItem('userlevel')) === 8) {
      this.employee = true;
    }
    this.buildForm();
    this.getLocationList();
    this.selection();
  }
  getAssociatedType(type) {
    this.commonService.getAppTerms('TagAssociationType').subscribe(res => {
      const associateType = res.results.filter(resFilter => resFilter.value === type);
      if (associateType.length !== 0) {
        this.associateType = associateType[0].code;
      } else {
        this.associateType = null;
      }
    });
  }
  userSelection(userType) {
    this.buildForm();
    if (userType == 0) {
      this.coaster = true;
      this.select = this.patient = this.staff = this.role_group = this.location_group = false;
      this.getAllTag();
    } else if (userType == 1) {
      const typeid = "TT-CO";
      const tagtype = "Patient";
      this.patient = true;
      this.select = this.coaster = this.staff = this.role_group = this.location_group = false;
      this.getPatientList(tagtype, typeid);
    } else if (userType == 2) {
      const typeid = "TT-CO";
      const tagtype = "Staff";
      this.staff = true;
      this.select = this.coaster = this.patient = this.role_group = this.location_group = false;
      this.getPatientList(tagtype, typeid);
    } else if (userType == 3) {
      this.role_group = true;
      this.select = this.coaster = this.patient = this.staff = this.location_group = false;
      this.getRoleList();
    } else if (userType == 4) {
      this.location_group = true;
      this.select = this.coaster = this.patient = this.staff = this.role_group = false;
      this.getLocationList();
    } else {
      this.select = true;
    }
  }
  public buildForm() {
    this.tagForm = this.form.group({
      tagAssociationType: [this.data.tagAssociationType ? this.data.tagAssociationType : null],
      sendTolist: [this.data.sendTolist ? this.data.sendTolist : null, [Validators.required]],
      name: [this.data.name ? this.data.name : null],
      subject: [this.data.subject ? this.data.subject : null, [Validators.required]],
      message: [this.data.message ? this.data.message : null, [Validators.required]],
      response: [this.data.response ? this.data.response : null, [Validators.required]],
    });
  }
  getAllTag() {
    this.commonService.getAllTag().subscribe(res => {
      this.coasterList = res.results.filter(resFilter => resFilter.status !== 'Deleted' && resFilter.tagTypeId === 'TT-CO');
      this.coasterListNew = this.coasterList;
    });
  }


  onKey(value) {
    this.blankField = false;
    this.coasterListNew = this.search(value);
    if (this.coasterListNew.length <= 0) {
      this.blankField = true;
    }
    this.detectchange.detectChanges();
  }

  search(val: string) {
    return this.coasterList.filter((obj) => obj.serialNumber.indexOf(val.toLowerCase()) > -1);
  }

  getPatientList(tagtype, typeid) {
    this.commonService.getPatientList(tagtype, typeid).subscribe(res => {
      this.list = res.results;
      this.newList = this.list;
    });
  }

  onKeyPatient(value) {
    this.blankField = false;
    this.newList = this.searchKeyPatient(value);
    if (this.newList.length <= 0) {
      setTimeout(function () {
        this.blankField = true;
      }, 3000);
    }
    this.detectchange.detectChanges();
  }

  searchKeyPatient(val: string) {
    return this.list.filter((obj) => (obj.serialNumber.indexOf(val) > -1) || (obj.tagAssociationName.toLowerCase().indexOf(val.toLowerCase()) > -1));
  }

  onKeyStaff(value) {
    this.blankField = false;
    this.newList = this.searchKeyStaff(value);
    if (this.newList.length <= 0) {
      setTimeout(function () {
        this.blankField = true;
      }, 3000);
    }
    this.detectchange.detectChanges();
  }

  searchKeyStaff(val: string) {
    return this.list.filter((obj) => (obj.serialNumber.indexOf(val) > -1) || (obj.tagAssociationName.toLowerCase().indexOf(val.toLowerCase()) > -1));
  }

  getLocationList() {
    this.commonService.getLocationList().subscribe(res => {
      this.loc_list = res.results;
      this.newLocList = this.loc_list;
    });
  }

  onKeyLocation(value) {
    this.blankField = false;
    this.newLocList = this.searchKeyLocation(value);
    if (this.newLocList.length <= 0) {
      this.blankField = true;
    }
    this.detectchange.detectChanges();
  }

  searchKeyLocation(val: string) {
    return this.loc_list.filter((obj) => obj.locationName.toLowerCase().indexOf(val.toLowerCase()) > -1);
  }


  getRoleList() {
    if (parseInt(localStorage.getItem('userlevel')) === 8) {
      this.commonService.getRoleList().subscribe(res => {
        this.emp = true;
        this.role_list = res.results;
        this.newEmpRoleList = this.role_list;
      });
    } else {
      this.commonService.getAllRoleList().subscribe(res => {
        this.emp = false;
        this.role_list = res.results;
        this.newAllRoleList = this.role_list;
      });
    }
  }

  onKeyEmpRole(value) {
    this.blankField = false;
    this.newEmpRoleList = this.searchKeyEmpRole(value);
    if (this.newEmpRoleList.length <= 0) {
      this.blankField = true;
    }
    this.detectchange.detectChanges();
  }

  searchKeyEmpRole(val: string) {
    return this.role_list.filter((obj) => obj.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
  }

  onKeyAllRole(value) {
    this.blankField = false;
    this.newAllRoleList = this.searchKeyAllRole(value);
    if (this.newAllRoleList.length <= 0) {
      this.blankField = true;
    }
    this.detectchange.detectChanges();
  }

  searchKeyAllRole(val: string) {
    return this.role_list.filter((obj) => obj.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
  }

  selection() {
    this.commonService.getCoasterResponse().subscribe(res => {
      this.check_response = res.results;
    });
  }
  responseSelection(event, value) {
    for (let i = 0; this.check_response.length > i; i++) {
      if (value === this.check_response[i].value) {
        this.data_code = this.check_response[i].value;
        if (event.checked === true) {
          this.check_response_val = this.check_response[i].code;
        }
      }
    }
  }
  saveMessage() {
    this.isDisabled = true;
    this.createmessagecentre = new CreateMessageCentre(null, null, null, null, null, null, null)
    if (this.tagForm.controls['tagAssociationType'].value === 'TAT-CO') {
      this.createmessagecentre.tagAssociationType = this.associateType;
    } else {
      this.createmessagecentre.tagAssociationType = this.tagForm.controls['tagAssociationType'].value;
    }
    this.send.push(this.tagForm.controls['sendTolist'].value);
    this.createmessagecentre.sendTolist = this.send;
    for (let i = 0; this.list.length > i; i++) {
      if (this.list[i].serialNumber === this.tagForm.controls['sendTolist'].value) {
        this.createmessagecentre.name = this.list[i].tagAssociationName;
      }
    }
    this.createmessagecentre.subject = this.tagForm.controls['subject'].value;
    this.createmessagecentre.message = this.tagForm.controls['message'].value;
    this.createmessagecentre.response = this.check_response_val;
    this.commonService.saveMessage(this.createmessagecentre).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
        this.thisDialogRef.close('cancel');
      });
    this.tagForm.reset();
  }
  fixClick() {
    console.log('')
  }
}
