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
import { Component, Input, Inject, ViewChild, Output, EventEmitter, OnChanges } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm,  } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { MatTableDataSource } from "@angular/material/table";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { DatePipe } from "@angular/common";
import { MY_FORMATS } from "../confirmation-dialog/confirmation-dialog.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CommonService } from "../../../services";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { CreateLicense, EditLicense } from "./license.model";
import * as FileSaver from 'file-saver';
import { AppToastService } from "../../../services/toaster.service";

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form?.submitted;
    return !!(
      control?.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-license",
  templateUrl: "./license.component.html",
  styleUrls: ["./license.component.scss"],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class LicenseComponent implements  OnChanges {
  @Input() max: Date | null;
  @Input() licenseData: any;
  @Output() scrollToTopAction = new EventEmitter();
  today = new Date();
  public createLicense: CreateLicense;
  public editLicense: EditLicense;
  public licenseForm: FormGroup;
  matcher = new MyErrorStateMatcher();
  public isDisabled = false;  
  popWidth: any;
  contentHeight: number;
  popHeight: any;
  displayedColumns = ['S.No', 'From Date', 'End Date', 'Generate Date', 'Action'];
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataExist = false;
  licenseId = null;
  invalidDate = false;

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<LicenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    private readonly commonService: CommonService,
    private readonly dateAdapter: DateAdapter<Date>,
    public datepipe: DatePipe,
  ) {
    this.today.setDate(this.today.getDate());
    dateAdapter.setLocale("en-in"); 
  }



  ngOnChanges(changes: any) {
    if(changes){
      this.data = this.licenseData.data;
      this.buildForm();
      this.getAllLicense(this.data.id);
    }
  }

  onWindowResizedWidth(size) {
    this.popWidth = size;
  }

  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 170;
  }

  public buildForm() {
    this.licenseForm = this.form.group({
      fromDate: [this.data.fromDate ? this.data.fromDate : this.today, [Validators.required]],
      toDate: [this.data.toDate ? this.data.toDate : null, [Validators.required]],
      isEnable: [this.data.isEnable ? this.data.isEnable === 'Enable' ? true : this.data.isEnable : true],
    });
  }

  dateValidate() {
    const fromDate = this.datepipe.transform(this.licenseForm.get('fromDate').value, 'yyyy-MM-dd');
    const toDate = this.datepipe.transform(this.licenseForm.get('toDate').value, 'yyyy-MM-dd');
    if(fromDate > toDate) {
      this.invalidDate = true;
    } else {
      this.invalidDate = false;
    }
  }

  getAllLicense(id) {
    let type = this.licenseData.type;
    let servType = type === 'GwServer' ? 'TIT-GW-SER' : 'TIT-TW-SER';
    this.commonService.getAllLicense(id, servType).subscribe(res => {
      if(res.results.length !== 0) {
        this.dataExist = true;
        this.dataSource = new MatTableDataSource<any[]>(res.results);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        this.dataSource = new MatTableDataSource<any[]>([]);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataExist = false;
      }
    });
  }

  licenseDownload(data) {
    const blob = new Blob([data.license]);
    FileSaver.saveAs(blob, 'gwlicense.lic');
  }

  editLicenseDetail(data) {
    this.scrollToTopAction.emit();
    this.licenseId = data.id
    this.licenseForm.get('fromDate').setValue(this.datepipe.transform(data.fromDate, 'yyyy-MM-dd'));
    this.licenseForm.get('toDate').setValue(this.datepipe.transform(data.toDate, 'yyyy-MM-dd'));
    this.licenseForm.get('isEnable').setValue(data.isActive);
  }

  cancelEdit() {
    this.licenseId = null;
    this.licenseForm.reset();
    this.licenseForm.get('fromDate').setValue(this.today);
    this.licenseForm.get('isEnable').setValue(true);
    this.getAllLicense(this.data.id);
  }

  generate() {
    let type = this.licenseData.type
    this.createLicense = new CreateLicense(null, null, null, null, null);
    this.createLicense.fromDate = this.datepipe.transform(this.licenseForm.controls['fromDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.createLicense.toDate = this.datepipe.transform(this.licenseForm.controls['toDate'].value, 'yyyy-MM-dd 23:59:00');
    this.createLicense.identifyingId = this.data.id;
    this.createLicense.identifyingType = type === 'GwServer' ? 'TIT-GW-SER' :  'TIT-TW-SER';
    this.createLicense.isActive = this.licenseForm.controls['isEnable'].value;
    this.commonService.createLicense(this.createLicense).subscribe(
      (res) => {
        if (res.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.licenseForm.reset();
        this.licenseForm.get('fromDate').setValue(this.today);
        this.licenseForm.get('isEnable').setValue(true);
        this.getAllLicense(this.data.id);
        this.toastr.success("Success", `${res.message}`);
      },
      (error) => {
        this.isDisabled = false;
        if (error.error.errorCode === 'TWAPI54') {
          this.toastr.error('Error', `${error.error.message}`);
        }  else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }

  regenerate() {
    let type = this.licenseData.type
    this.editLicense = new EditLicense(null, null, null, null, null);
    this.editLicense.fromDate = this.datepipe.transform(this.licenseForm.controls['fromDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.editLicense.toDate = this.datepipe.transform(this.licenseForm.controls['toDate'].value, 'yyyy-MM-dd 23:59:00');
    this.editLicense.identifyingId = this.data.id;
    this.editLicense.identifyingType = type === 'GwServer' ? 'TIT-GW-SER' :  'TIT-TW-SER';
    this.editLicense.isActive = this.licenseForm.controls['isEnable'].value;
    this.commonService.updateLicense(this.editLicense, this.licenseId).subscribe(
      (res) => {
        if (res.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.licenseId = null;
        this.licenseForm.reset();
        this.licenseForm.get('fromDate').setValue(this.today);
        this.licenseForm.get('isEnable').setValue(true);
        this.getAllLicense(this.data.id);
        this.toastr.success("Success", `${res.message}`);
      },
      (error) => {
        this.isDisabled = false;
        if (error.error.errorCode === 'TWAPI54') {
          this.toastr.error('Error', `${error.error.message}`);
        }  else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }
}
