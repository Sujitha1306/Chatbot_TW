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
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System
 * ======================================================================================================
 ******************************************************************************/
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { LightboxOnlineMenuDialogComponent } from '../../../../../ovitag/configuration/asset/asset.component';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-pwa-document-management',
  templateUrl: './pwa-document-management.component.html',
  styleUrls: ['./pwa-document-management.component.scss']
})
export class PwaDocumentManagementComponent {

  selectedData = null;
  visibleData: any[] = [];  
  allData: any[] = [];   
  loading = false;
  totalRecords = 0;
  pageSize = 20;            
  currentIndex = 0;   
  displayEntityType = null;
  computedAssetName = null;      

  constructor(
    public dialog: MatDialog,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    public toastr: AppToastService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    if (this.data) {
      this.displayEntityType = this.data.entityType;
      this.getFileAttachments(this.data.entityId, this.data.entityType,this.data.entityId, this.data.entityType)
      if (this.data.entityType === 'Asset') {
        if (this.data?.entityData?.assetName && this.data?.entityData?.assetSerialNumber) {
          this.computedAssetName = `${this.data.entityData.assetName} (${this.data.entityData.assetSerialNumber})`;
        } else if (this.data?.entityData?.assetName) {
          this.computedAssetName = this.data.entityData.assetName;
        }
      }
    }
  }
  
  getFileAttachments(entityId, entityType, id, type) {
    this.loading = true;
    this.commonService.getAllAttachments(entityId, entityType, id, type).subscribe(res => {
      this.allData = res.results;
      this.totalRecords = this.allData.length;
      this.currentIndex = 0;
      this.visibleData = [];
      this.loadMore();  
      this.loading = false;
    });
  }

  loadMore() {
    const nextIndex = this.currentIndex + this.pageSize;
    this.visibleData = this.visibleData.concat(this.allData.slice(this.currentIndex, nextIndex));
    this.currentIndex = nextIndex;
  }
  
  hasMore(): boolean {
    return this.currentIndex < this.totalRecords;
  }

  removeAttachment(data) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' },
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    if (result == 'Yes') {
       this.commonService.deleteItemAttachment(data['attachmentId']).subscribe({
        next: () => {
          this.toastr.success('Success', 'Attachment removed successfully!');
          this.getFileAttachments(this.data.entityId, this.data.entityType, this.data.entityId, this.data.entityType);
        },
        error: () => {
          this.toastr.error('Error', 'Failed to remove attachment.');
        }
      });
    }
    });
  }

  preview(data) {
    if (data?.fileType === 'Link') {
      const url = data?.fileUrl;
      navigator.clipboard.writeText(url)
        .then(() => this.toastr.success("Link copied! Now you can paste it anywhere."))
        .catch(() => this.toastr.error("Failed to copy the link."));
    } else {
      data['isPwa'] = true;
      const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent, 
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: data, panelClass: 'custom-preview-dialog-container', disableClose: true});
      dialogRef.afterClosed().subscribe(result => { 
      });

    }
  }
   
  uploadfile() {
    let data = this.data;
    const dialogRef = this.dialog.open(PwaDocumentComponent, {
      data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(res => {
      if(res !== ''){
        this.getFileAttachments(this.data.entityId, this.data.entityType,this.data.entityId, this.data.entityType);
      }
    })
  }

  fixClick() {
    console.log('')
  }
}


@Component({
   selector: 'app-pwa-document',
   templateUrl: './pwa-document.component.html',
   styleUrls: ['./pwa-document-management.component.scss']
 })

export class PwaDocumentComponent implements OnInit {
  documentType: any;
  documentForm: FormGroup;
  fileType: string;
  fileName:string;
  isFileSelected: boolean = false
  image: any;
  imageData: any[] = [];
  attachFiles: any[] = [];
  public base64Data_global: string;
  fileInfo: string;

  constructor( public form: FormBuilder,
      public dialog: MatDialog,
      protected sanitizer: DomSanitizer,
      private readonly commonService: CommonService,
      public toastr: AppToastService,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly dateFormat: DatePipe,
      public dialogRef: MatDialogRef<PwaDocumentComponent>
    ){ }
  
  ngOnInit(): void {
    this.buildForm()
    this.commonService.getAppTermsLink(this.data.entityGroupTypeId,'DocumentType').subscribe(res => {
      this.documentType = res.results;
    });
  }

  buildForm() {
    this.documentForm = this.form.group({
      attachFiles: this.form.array([this.getFiles()]),
      documentTypeId: [null,[Validators.required]],
      documentLink: [null],
      documentName: [null]
    })
  }

  private getFiles() {
    return this.form.group({
      base64Data: [''],
      fileType: [''],
      documentTypeId: [''],
      documentName: [''],
      documentLink: ['']
    });
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  handleFileSelect(evt) {
    const files = evt.target.files;
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
    // setTimeout(() => {
    //  this.addDocRow()
    // }, 500)
  }

  onFileSelect(input: HTMLInputElement) {
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
    this.fileName = `${file.name}`;
    this.fileInfo = `${file.name} (${formatBytes(file.size)})`;
  }

  addDocRow() {
      let documentTypeName = this.documentType.filter(val => val.code == this.documentForm.controls['documentTypeId'].value);
      const docTypeCode = this.documentForm.controls['documentTypeId'].value;
      const documentLink = this.documentForm.controls['documentLink'].value;
      const isLinkType = docTypeCode === 'DT-LI';
      let fileData = [{
        documentTypeId: docTypeCode,
        fileName: isLinkType ? null : this.fileName,
        documentTypeName: documentTypeName[0]?.value,
        fileType: isLinkType ? 'Link' : this.image?.mimeType,
        base64Data: isLinkType ? null : this.base64Data_global,
        attachmentId: null,
        image: isLinkType ? null : this.image?.file,
        fileUrl: isLinkType ? documentLink : null,
        createdBy: localStorage.getItem(btoa('current_user')),
        createdOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
        modifiedOn: null,
        modifyByName: null,
        entityId: this.data?.entityId,
        entityType: this.data?.entityType
      }]
      this.commonService.saveFile(fileData).subscribe({
      next: (res) => {
        this.toastr.success('Success', 'File saved successfully!');
        this.dialogRef.close(); 
        this.fileName = null;
        this.fileInfo = null;
        this.base64Data_global = null;
        this.isFileSelected = false;
      },
      error: (err) => {
        this.toastr.error('Error', 'Failed to save file.');
      }
    });
    }
}
