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

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { CreateSupplier, ModifySupplier } from './create-supplier.model';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DomSanitizer } from '@angular/platform-browser';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-create-supplier',
  templateUrl: './create-supplier.component.html',
  styleUrls: ['./create-supplier.component.scss']
})
export class CreateSupplierComponent implements OnInit {

  public supplierForm: FormGroup;
  public Supplier: CreateSupplier;
  public editSupplier: ModifySupplier;
  supplierData: any;
  imageData: any[] = [];
  image: any;
  public fileInfo: string;
  public isFileSelected: boolean = false;
  public isAddDoc: boolean = false;
  public isDeleteDoc: boolean = false;
  public isEditDocRow: boolean = false;
  public isDocTable: boolean = false;
  attachFiles: Array<any> = [];
  public base64Data_global: string;
  fileType: string;
  docDisplayedColumns: string[] = ['select', 'name', 'type', 'preview'];
  docSourceIdentifier = new MatTableDataSource<any>();
  docSelection = new SelectionModel<any>(true, []);
  status: any;

  constructor(public fb: FormBuilder, public toastr: AppToastService, @Inject(MAT_DIALOG_DATA) public data: any,public dialog: MatDialog,
    private readonly commonService: CommonService, public thisDialogRef: MatDialogRef<CreateSupplierComponent>, protected sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.commonService.getAppTerms('Status').subscribe(res => {
      this.status = res.results.filter(filt => filt.code === 'ST-AT' || filt.code === 'ST-IA' || filt.code === 'ST-BKL')
    })
    this.buildForm();
    if (this.data.id) {
      this.getByIdSupplier();
      this.getSupplierAttachment();
    }
  }

  getSupplierAttachment(){
    this.commonService.getItemAttachment(this.data.id, 'Supplier').subscribe(res => {
      this.attachFiles = res.results;
      this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
      if (this.docSourceIdentifier.data.length > 0) {
        this.isDocTable = true;
      }
    });
  }


  getByIdSupplier() {
    this.commonService.getSupplierById(this.data.id).subscribe(res => {
      this.supplierData = res.results[0];
      this.buildForm()
    })
  }

  buildForm() {
    this.supplierForm = this.fb.group({
      supplerName: [this.supplierData && this.supplierData.name ? this.supplierData.name : null, [Validators.required]],
      inchargeName: [this.supplierData && this.supplierData.inchargeName ? this.supplierData.inchargeName : null, [Validators.required]],
      email: [this.supplierData && this.supplierData.inchargeEmail ? this.supplierData.inchargeEmail : null, [Validators.email, Validators.required]],
      taxIdentifier: [this.supplierData && this.supplierData.taxIdentifier ? this.supplierData.taxIdentifier : null],
      phone: [this.supplierData && this.supplierData?.entityAddresses[0]?.phone ? this.supplierData.entityAddresses[0]?.phone : null, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      street: [this.supplierData && this.supplierData?.entityAddresses[0]?.line1 ? this.supplierData.entityAddresses[0]?.line1 : null],
      town: [this.supplierData && this.supplierData?.entityAddresses[0]?.line2 ? this.supplierData.entityAddresses[0]?.line2 : null],
      city: [this.supplierData && this.supplierData?.entityAddresses[0]?.city ? this.supplierData.entityAddresses[0]?.city : null],
      state: [this.supplierData && this.supplierData?.entityAddresses[0]?.line3 ? this.supplierData.entityAddresses[0]?.line3 : null],
      country: [this.supplierData && this.supplierData?.entityAddresses[0]?.country ? this.supplierData.entityAddresses[0]?.country : null],
      pinCode: [this.supplierData && this.supplierData?.entityAddresses[0]?.zip ? this.supplierData.entityAddresses[0]?.zip : null],
      status: [this.supplierData && this.supplierData?.status ? this.supplierData.status :'ST-AT'],
      attachFiles: this.fb.array([this.getFiles()]),
      fileName: [null],
    });
  }

  private getFiles() {
    return this.fb.group({
      base64Data: [''],
      fileType: [''],
      fileName: [null],
    });
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  handleFileSelect(evt) {
    const files = evt.target.files;
    if (files.length > 3 || this.attachFiles.length + files.length > 3) {
      this.toastr.warning('Warning', `sorry, you can upload only 3 files!`);
      this.supplierForm.controls['fileName'].reset();
      return;
    }
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowed_types.includes(evt.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (const file of files) {
      if (file) {
        this.fileType = file.type;
        const reader = new FileReader();

        reader.onload = (function (f) {
          console.log(f)
          return function (readerEvt) {

            const binaryString = readerEvt.target.result

            this.base64Data_global = btoa(binaryString);

            this.isFileSelected = true;

            if (f.type.includes('image')) {
              const url = this.safeUrl('data:image/png;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/pdf') {
              const url = this.safeUrl('data:application/pdf;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/msword') {
              const url = this.safeUrl('data:application/msword;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'text/plain') {
              const url = this.safeUrl('data:text/plain;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: reader.result,
                mimeType: f.type
              }
            }
            this.isAddDoc = true;
          };
        })(file).bind(this);
        reader.readAsBinaryString(file);
      }
    }
  }

  onFileSelect(input: HTMLInputElement): void {
    function formatBytes(bytes: number): string {
      const UNITS = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const factor = 1024;
      let index = 0;
      while (bytes >= factor) {
        bytes /= factor;
        index++;
      }
      return `${parseFloat(bytes.toFixed(2))} ${UNITS[index]}`;
    }
    const file = input.files[0];
    this.fileInfo = `${file.name} (${formatBytes(file.size)})`;
  }

  checkEvent() {
    setTimeout(() => this.removeIcon(this.docSelection.selected.length), 200);
  }

  removeIcon(length) {
      if (length == 1) {
        this.isEditDocRow = true;
        this.editRow()
      } else {
        this.isEditDocRow = false;
        this.isFileSelected = false;
        this.isAddDoc = false;
        this.supplierForm.controls['fileName'].reset();
      }
      if (length > 0) {
        this.isDeleteDoc = true;
      } else {
        this.isDeleteDoc = false;
      }
  }

  editRow() {
      this.docSelection.selected.forEach(item => {
        const index: number = this.attachFiles.findIndex(d => d === item);
        let val = this.docSourceIdentifier.data[index];
        this.supplierForm.controls['fileName'].setValue(val['fileName']);
      });
  }

  isAllSelected(event) {
    if (event == "documents") {
      const numSelected = this.docSelection.selected.length;
      const numRows = this.docSourceIdentifier.data.length;
      return numSelected === numRows;
    }
  }

  addDocRow() {
    this.isAddDoc = true;
    this.attachFiles.push({
      fileName: this.supplierForm.controls['fileName'].value,
      fileType: this.image.mimeType,
      base64Data: this.base64Data_global,
      attachmentId: null,
      image: this.image.file
    });

    this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
    this.isDocTable = true;
    this.supplierForm.controls['fileName'].reset();
    this.fileInfo = null;
    this.isAddDoc = false;
    this.isFileSelected = false;
  }

  addEditRow() {
    this.docSelection.selected.forEach(item => {
      const index: number = this.attachFiles.findIndex(d => d === item);

      if (item['attachmentId'] != null) {
        this.commonService.deleteItemAttachment(item['attachmentId']).subscribe(res => {
          this.toastr.success('Success', `Attachment updated successfully!`);
        });
      }
      this.docSourceIdentifier.data.splice(index, 1);

      this.attachFiles.push({
        fileName: this.supplierForm.controls['documentName'].value,
        fileType: this.image.mimeType,
        base64Data: this.base64Data_global,
        attachmentId: null,
      });
      this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
      this.supplierForm.controls['documentName'].reset();
      this.docSelection.clear();
      this.isDocTable = true;
      this.fileInfo = null;
      this.isFileSelected = false;
      this.isAddDoc = false;
      this.isEditDocRow = false;
      this.isDeleteDoc = false;
    });
  }

  removeSelectedRows() {
    let i = 1;
    this.docSelection.selected.forEach(item => {

      if (item['attachmentId'] != null) {
        this.commonService.deleteItemAttachment(item['attachmentId']).subscribe(res => {
        });
        if (i == this.docSelection.selected.length) {
          this.toastr.success('Success', `Attachment removed successfully!`);
        }
      }
      const index: number = this.attachFiles.findIndex(d => d === item);
      this.docSourceIdentifier.data.splice(index, 1);

      if (this.docSourceIdentifier.data.length > 0) {
        this.isDocTable = true;
      } else {
        this.isDocTable = false;
      }
      this.docSourceIdentifier = new MatTableDataSource<any>(this.docSourceIdentifier.data);
      this.isEditDocRow = false;
      this.supplierForm.controls['fileName'].reset();
      this.isDeleteDoc = false;
      i = i + 1;
    });
    this.docSelection = new SelectionModel<any>(true, []);
  }

  getFileDownload(element){
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  createSupplier() {
    let updateAttachFile = []
    for(let i in this.attachFiles){
      if(this.attachFiles[i].hasOwnProperty('image')){
        delete this.attachFiles[i].image;
        delete this.attachFiles[i].attachmentId;
      }
      if(this.attachFiles[i].attachmentId == null){
        updateAttachFile.push(this.attachFiles[i]);
      }
    }
    this.Supplier = new CreateSupplier(null, null, null, null, null, null, null);
    this.Supplier.name = this.supplierForm.controls['supplerName'].value;
    this.Supplier.inchargeName = this.supplierForm.controls['inchargeName'].value;
    this.Supplier.inchargeEmail = this.supplierForm.controls['email'].value;
    this.Supplier.taxIdentifier = this.supplierForm.controls['taxIdentifier'].value;
    this.Supplier.status = this.supplierForm.controls['status'].value;
    this.Supplier.entityAddresses = [{
      "addressSubTypeId": "AST-PMTA",
      "addressTypeId": "AD-REGAD",
      "city": this.supplierForm.controls['city'].value,
      "country": this.supplierForm.controls['country'].value,
      "line1": this.supplierForm.controls['street'].value,
      "line2": this.supplierForm.controls['town'].value,
      "line3": this.supplierForm.controls['state'].value,
      "phone": this.supplierForm.controls['phone'].value,
      "zip": this.supplierForm.controls['pinCode'].value
    }];
    this.Supplier.fileAttachments = updateAttachFile.length ? updateAttachFile : null;
    this.commonService.createSupplier(this.Supplier).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close();
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  modifySupplier() {
    let updateAttachFile = []
    for(let i in this.attachFiles){
      if(this.attachFiles[i].hasOwnProperty('image')){
        delete this.attachFiles[i].image;
        delete this.attachFiles[i].attachmentId;
      }
      if(this.attachFiles[i].attachmentId == null){
        updateAttachFile.push(this.attachFiles[i]);
      }
    }
    this.editSupplier = new ModifySupplier(null, null, null, null, null, null, null, null);
    this.editSupplier.id = this.supplierData.id;
    this.editSupplier.name = this.supplierForm.controls['supplerName'].value;
    this.editSupplier.inchargeName = this.supplierForm.controls['inchargeName'].value;
    this.editSupplier.inchargeEmail = this.supplierForm.controls['email'].value;
    this.editSupplier.taxIdentifier = this.supplierForm.controls['taxIdentifier'].value;
    this.editSupplier.status = this.supplierForm.controls['status'].value;
    this.editSupplier.entityAddresses = [{
      "id": this.supplierData.entityAddresses[0].id,
      "addressSubTypeId": "AST-PMTA",
      "addressTypeId": "AD-REGAD",
      "city": this.supplierForm.controls['city'].value,
      "country": this.supplierForm.controls['country'].value,
      "line1": this.supplierForm.controls['street'].value,
      "line2": this.supplierForm.controls['town'].value,
      "line3": this.supplierForm.controls['state'].value,
      "phone": this.supplierForm.controls['phone'].value,
      "zip": this.supplierForm.controls['pinCode'].value
    }];
    this.editSupplier.fileAttachments = updateAttachFile.length ? updateAttachFile : null;
    this.commonService.editSupplier(this.supplierData.id, this.editSupplier).subscribe(res => {

      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close();
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
}
