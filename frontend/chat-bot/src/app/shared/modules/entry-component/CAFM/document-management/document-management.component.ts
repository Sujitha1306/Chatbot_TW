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

import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { LightboxOnlineMenuDialogComponent } from '../../../../../ovitag/configuration/asset/asset.component';
import { SessionStorageService } from '../../../../services/session.storage.service';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { TaskManagmentComponent } from '../../task-managment/task-managment.component';
import { AppToastService } from '../../../../services/toaster.service';
import { LookupTermService } from '../../../../lookup-term.service';

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.scss']
})
export class DocumentManagementComponent {
  @Input() entityData: any;
  @Output() documentEventAction = new EventEmitter();
  documentType: any[] = [];
  public documentForm: FormGroup;
  docDisplayedColumns: string[] = [ 'type', 'name', 'createdby',  'createdOn','modifyByName','modifiedOn', 'preview'];
  docSourceIdentifier = new MatTableDataSource<any>();
  public isDocTable: boolean = false;
  public isEditDocRow: boolean = false;
  public fileInfo: string;
  public isFileSelected: boolean = false;
  public isAddDoc: boolean = false;
  public isDeleteDoc: boolean = false;
  docSelection = new SelectionModel<any>(true, []);
  selection = new SelectionModel<any>(true, []);
  public urlSafe: SafeResourceUrl;
  attachFiles: Array<any> = [];
  public base64Data_global: string;
  fileType: string;
  image: any;
  imageData: any[] = [];
  fileChanged: boolean = false;

  constructor(
    public form: FormBuilder,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    private readonly commonService: CommonService,
    private readonly dateFormat: DatePipe,
    private readonly sessionService:SessionStorageService,
    private readonly lookupService : LookupTermService
  ) { }


  ngOnInit() {
    this.getAppterms();
    this.buildForm();
    this.attachFiles = this.sessionService.getAttachFiles(); // Get locally stored attachments
    this.getAttachments();
  }


  getAttachments(){
    if(this.entityData.entityId){
      let parentId, parentType
      if(this.entityData.entityType === 'Request') {
        parentId = this.entityData.parentId;
        parentType = this.entityData.parentType;
        this.docDisplayedColumns = ['type', 'name', 'createdby',  'createdOn','modifyByName','modifiedOn', 'preview'];
      }else{
        parentId = this.entityData?.entityId;
        parentType = this.entityData?.entityType;
        this.docDisplayedColumns = ['identifyingTypeValue','eventId', 'type', 'name', 'createdby',  'createdOn','modifyByName','modifiedOn', 'preview'];
      }
      this.commonService.getAllAttachments(this.entityData.entityId, this.entityData.entityType, parentId, parentType).subscribe(res => {
        if (res.results.length > 0 && !this.attachFiles?.length) {
          this.attachFiles = res.results;
        }
        this.docSourceIdentifier.data = this.attachFiles;
        this.isDocTable = this.docSourceIdentifier.data.length > 0;
      });
    } else {
      this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
      this.isDocTable = this.attachFiles.length > 0;
    }
  }

  getAppterms() {
    this.lookupService.getAppTermsLinkWrapper(this.entityData.entityGroupTypeId,'DocumentType').subscribe(res => {
      this.documentType = res?.DocumentType ?? [];
    });
  }

  buildForm() {
    this.documentForm = this.form.group({
      attachFiles: this.form.array([this.getFiles()]),
      documentTypeId: [null,[Validators.required, this.documentTypeValidator.bind(this)]],
      documentTypeName: [null],
      documentName: [null],
      documentLink:[null]
    })
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
            this.fileChanged = true;
            this.documentForm.markAsDirty();

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

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
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
    this.fileInfo = `${file.name} (${formatBytes(file.size)})`;
  }

  addDocRow() {
    this.isAddDoc = true;
    let documentTypeName = this.documentType.filter(val => val.code == this.documentForm.controls['documentTypeId'].value);
    this.attachFiles.push({
      documentTypeId: this.documentForm.controls['documentTypeId'].value,
      fileName: this.documentForm.controls['documentName'].value,
      documentTypeName: documentTypeName[0].value,
      fileType: this.documentForm.controls['documentTypeId'].value !='DT-LI'? this.image?.mimeType:'Link',
      base64Data: this.base64Data_global,
      attachmentId: null,
      image: this.image?.file,
      fileUrl:this.documentForm.controls['documentLink'].value,
      createdBy: localStorage.getItem(btoa('current_user')),
      createdOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
      modifiedOn:null,
      modifyByName:null
    });

    this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
    this.isDocTable = true;
    this.documentForm.reset();
    this.fileInfo = null;
    this.isAddDoc = false;
    this.isFileSelected = false;
    this.emitDocument()
  }

  addEditRow() {
    this.docSelection.selected.forEach(item => {
      const index: number = this.attachFiles.findIndex(d => d === item);

      if (this.isFileSelected && item['attachmentId'] != null) {
        this.commonService.deleteItemAttachment(item['attachmentId']).subscribe(res => {
          this.toastr.success('Success', `Attachment updated successfully!`);
        });
      }
      this.docSourceIdentifier.data.splice(index, 1);

      let documentTypeName = this.documentType.filter(val => val.code == this.documentForm.controls['documentTypeId'].value);
      this.attachFiles.push({
        documentTypeId: this.documentForm.controls['documentTypeId'].value,
        fileName: this.documentForm.controls['documentName'].value,
        documentTypeName: this.isFileSelected ? documentTypeName[0].value : item.documentTypeName,
        fileType: this.isFileSelected ? this.image?.mimeType : item?.fileType,
        base64Data: this.isFileSelected ? this.base64Data_global : item?.base64Data,
        attachmentId: this.isFileSelected ? null : item.attachmentId,
        image: this.isFileSelected ? this.image?.file : null,
        fileUrl: this.documentForm.controls['documentTypeId'].value !='DT-LI'? item?.fileUrl : this.documentForm.controls['documentLink'].value ,
        createdBy: item?.createdBy,
        modifyByName: localStorage.getItem(btoa('current_user')),
        createdOn: item?.createdOn,
        modifiedOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
        entityType: item?.entityType,
        entityId: item?.entityId,
        parentType: item?.parentType,
        parentId: item?.parentId,
        identifyingTypeId: item?.identifyingTypeId,
        identifyingTypeValue: item?.identifyingTypeValue
      });

      this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
      this.documentForm.reset();
      this.docSelection.clear();
      this.isDocTable = true;
      this.fileInfo = null;
      this.isFileSelected = false;
      this.isAddDoc = false;
      this.isEditDocRow = false;
      this.isDeleteDoc = false;
      this.emitDocument();
      this.documentForm.markAsPristine();
      this.fileChanged = false;
      this.isFileSelected = false;
    });
  }

  removeSelectedRows() {
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
      this.documentForm.reset();
      this.isDeleteDoc = false;
      i = i + 1;
    });
    this.docSelection = new SelectionModel<any>(true, []);
      this.emitDocument()
    }
    });
  }


  getFileDownload(element) {
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  private getFiles() {
    return this.form.group({
      base64Data: [''],
      fileType: [''],
      documentTypeId: [''],
      documentName: [''],
      documentLink:['']
    });
  }

  private emitDocument() {
    this.sessionService.setAttachFiles(this.attachFiles) // update latest document data to angular service.
    this.documentEventAction.emit({
      attachFiles: this.attachFiles
    });
  }

  downloadFile(element: any) {
  console.log(element)
  const extensionMap: { [key: string]: string } = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'text/plain': '.txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
  };

    const extension = extensionMap[element.fileType] || '';
    const filename = (element.fileName || 'document') + extension;
    const mimeType = element.fileType || 'application/octet-stream';

    if (element.fileUrl) {
      fetch(element.fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          this.triggerDownload(blobUrl, filename);
        })
        .catch(error => {
          console.error('Download failed from URL:', error);
        });

    } else if (element.base64Data) {
      const blob = this.base64ToBlob(element.base64Data, mimeType);
      const blobUrl = window.URL.createObjectURL(blob);
      this.triggerDownload(blobUrl, filename);

    } else if (element.textContent) {
      const blob = new Blob([element.textContent], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);
      this.triggerDownload(blobUrl, filename);

    } else {
      console.warn('No downloadable content found in element:', element);
    }
  }

  triggerDownload(blobUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  fixClick() {
    console.log('')
  }

  previewLink(element) {
    if (element?.fileUrl) {
      window.open(element.fileUrl, '_blank'); 
    }
  }
  
  openEntityEvent(element) {
    const ticketData = {
      requestId: element?.entityId,
      type: 'modify',
      requestedType: element?.identifyingTypeId
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent, {
      data: ticketData,
      panelClass: ['large-popup'],
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getAttachments();
    });
  }

  documentTypeValidator(control: any) {
  if (!control.value) return null;
  const isValid = this.documentType.some(dt => dt.code === control.value);
  return isValid ? null : { invalidType: true };
  }

  removeRowSelection(row){
    this.docSelection.clear();
    this.docSelection.select(row);
    this.removeSelectedRows();   
  }

  editRowSelection(row){
    this.docSelection.clear();
    this.docSelection.select(row); 
    this.isEditDocRow = true;
    this.documentForm.patchValue({
      documentTypeId: row['documentTypeId'],
      documentName: row['fileName'],
      documentLink: row['fileUrl']
    });
    this.isFileSelected = false;
    this.fileInfo = null;
    this.fileChanged = false; 
    this.documentForm.markAsPristine();
  }

  resetForm(){
    this.documentForm.reset();
    this.isEditDocRow = false;
    this.isDeleteDoc = false;
    this.fileChanged = false;
    this.isFileSelected = null;
  }

}
