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
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as moment_ from 'moment';
import { MY_FORMATS } from './../../../../app/app.module';
import { WorkflowService } from '../../../shared';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SelectionModel } from '@angular/cdk/collections';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { CoasterComponent, EnrollRegisterPatientComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { ActivatedRoute } from '@angular/router';
import { PorterRequestNewComponent } from '../../../shared/modules/entry-component/porter-request/porter-request.component';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { AssignTokenComponent } from '../../../shared/modules/entry-component/assign-token/assign-token.component';

const moment = moment_;

@Component({
  selector: 'app-outpatient',
  templateUrl: './outpatient.component.html',
  styleUrls: ['./outpatient.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class OutpatientComponent implements OnInit {

  displayedColumns: string[] = ['ID', 'Device','Gender', 'Token No', 'Name', 'UHID', 'DOB', 'Mobile', 'Consultant', 'Visit Identifier', 'Sample Collected', 'Visit Type', 'Visit Status'];
  eventColumn = ['Device','Visit Status','Name'];
  iconHeader = ['ID', 'Device','Gender', 'Token No'];
  iconColumn = ['ID', 'Device','Gender', 'DOB'];
  dateColums =['DOB']
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  public OPForm: FormGroup;
  public today = new Date();
  public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  selection = new SelectionModel<any>(true, []);
  showAction1 = [
    { id: 'enroll', value: 'Enroll' },
    { id: 'porter', value: 'Porter Request' }
  ];
  showAction2 = [
    { id: 'porter', value: 'Porter Request' }
  ];
  public showActions = this.showAction1;

  @ViewChild('filter') input;
  public applyFilterValue: any;
  public isAutoRefresh = false;
  tableData: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  rowData = null;


  constructor(
    private readonly workflowService: WorkflowService,
    public datepipe: DatePipe,
    public dialog: MatDialog, public fb: FormBuilder,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly route: ActivatedRoute
  ) {
    dateAdapter.setLocale('en-in');
    this.today.setDate(this.today.getDate());
  }

  ngOnInit() {
    this.getOutPatientList(this.selectedDate, true);
    this.OPForm = this.fb.group({
      fromDate: new FormControl(moment()),
    });
  }
  rowClick(data) {
    if (this.selectedName && data.patientId !== this.selectedName.patientId) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data.patientId;
      this.rowData = data;
    }
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getOutPatientList(this.selectedDate);
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'enroll') {
      this.registerPatient(event.data);
    } else if (event.key === 'capture') {
      this.captureImage();
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  captureImage(){
    this.selectDropdown ='capture';      
    const formData = {};
    formData['content'] = 'webcam'
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }
  manageAction(value, data) {
    if (value === 'porter' && data !== true) {
      this.selectDropdown = 'porter';
      if (data.porterRequestId && data.porterRequestId !== null) {
        this.workflowService.getPorterRequest(data.porterRequestId).subscribe((res) => {
          const porterData = res.results[0];
          const dialogRef = this.dialog.open(PorterRequestNewComponent, {
            data: porterData,
            panelClass: ['medium-popup'],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe((result) => {
            this.selectDropdown = null;
            this.selectedName = null;
            this.refreshPage();
          });
        });
      } else {
        const data = this.rowData;
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: {type: 'PR-PA', id: data.patientId, name: data.patientName},
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.selectDropdown = null;
          this.selectedName = null;
          this.refreshPage();
        });
      }
    } else if (value === 'porter' && data === true) {
      this.showActions = null;
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-OT', id: '0', name: 'others'},
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    } else if (value === 'enroll') {
      this.selectDropdown ='enroll';
      const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
        data: { 'id': data.id, 'workflowTypeId': 'WF-OP', 'visitType': 'VT-OP' },
        panelClass: ['small-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = null;
        if (!data.id) {
          this.selectedName = null;
        }
        this.refreshPage();
      });
    } else if (value === 'capture') {
      this.captureImage();
    } 
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getOutPatientList(this.selectedDate);
  }

  getOutPatientList(dateValue,routerEvent?: boolean): void {
    this.selection.clear();
    this.showActions = this.showAction1;
    this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.OP.results;
      const Columns = ['ID','tagId', 'gender', 'tokenNo', 'patientName', 'mainidentifier', 'birthDate', 'mobileNo', 'consultantName', 'visitIdentifier', 'issampleCollected', 'visitType', 'visitStatusName'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.workflowService.getOpPatientList(this.selectedDate).subscribe((res) => {
      this.tableData = res.results;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['ID','tagId', 'gender', 'tokenNo', 'patientName', 'mainidentifier', 'birthDate', 'mobileNo', 'consultantName', 'visitIdentifier', 'issampleCollected', 'visitType', 'visitStatusName'];
      for(let i=0; i<= Columns.length; i++){
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      });
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-OP';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }
  eventAction(event) {
    if(event.key === 'Visit Status') {
      const isAssignToken = event.data.visitStatusName === 'Assign Token';
      if(isAssignToken) {
        this.openAssignTokenDialog(event.data)
      } else {
        this.patientInfo(event.data);
      }      
    } else if (event.key === 'Record ID') {
      this.manageMRCoster(event.data);
    } else if(event.key == 'Device') {
      this.manageCoster(event.data);
    } else if (event.key == 'Name') {
      this.registerPatient(event.data);
    }
  }

  manageMRCoster(data) {
    data['assetTypeId'] = 'AT-MR';
    data['workflowTypeId'] = 'AT-MR';
    data['associationId'] = data.patientId;
    data['associationTypeId'] = 'TAT-PA';
    data['associatedName'] = 'Patient';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }

  patientInfo(data) {
    data['type'] = '1';
    data['from'] = 'OP-list';
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
    });
  }
  private openAssignTokenDialog(data) {
    localStorage.setItem('user_guide_menu_code', 'MN_OTHC_ATK');
    const dialogRef = this.dialog.open(AssignTokenComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
  }

  registerPatient(eventdata) {
    let id = eventdata ? eventdata.patientId : null;
    let mainidentifier = eventdata ? eventdata.mainidentifier : null;
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-OP', 'visitType': 'VT-OP', 'mainidentifier': mainidentifier },
      width: '95%',  panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!id) {
        this.selectedName = null;
      }
      this.refreshPage();
    });
  }
}
