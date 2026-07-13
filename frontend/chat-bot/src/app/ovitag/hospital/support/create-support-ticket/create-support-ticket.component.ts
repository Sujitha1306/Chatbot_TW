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
import { DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import { CommonService, HospitalService } from '../../../../shared';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { CreateTicket, EditTicket } from '../../hospital.model';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { LightboxOnlineMenuDialogComponent } from '../../../configuration/asset/asset.component';

@Component({
  selector: 'app-create-support-ticket',
  templateUrl: './create-support-ticket.component.html',
  styleUrls: ['./create-support-ticket.component.scss']
})
export class CreateSupportTicketComponent  {

    public roleList: any[] = null;
    public fileTypes: any[] = null;
    public statusList: any[] = null;
    public ticketForm: FormGroup;
    public createTicket: CreateTicket;
    public editTicket: EditTicket;
    public customerList: any;
    public blockList: any;
    ticketPriorityList: any;
    public regionList: any;
    public facilityList: any;
    public matcher = new ErrorStateMatcherService();
    imageData: any[] = [];
    attachFiles: any[] = [];
    replaceIndex: number = -1;
    public isDisabled = false;
  
    baseURL = environment.api_base_url_new + 'api/all/ticket/ticket-attachment-file';
    public activate_btn = null;
    constructor(public form: FormBuilder,
      protected sanitizer: DomSanitizer,
      public toastr: AppToastService,
      public snackbar: MatSnackBar,
      public thisDialogRef: MatDialogRef<CreateSupportTicketComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly commonService: CommonService,
      private readonly hospitalServices: HospitalService,
      public dialog: MatDialog,
      
  
      private readonly _dateFormat: DatePipe) {
      console.log(this.data);
      console.log(this.data.locationId);
      this.activate_btn = this.commonService.getActivePermission('button');
      this.getPriorityType('Ticket_Priority');
      this.getCustomerList();
      this.getBlockList();
      this.buildForm();
      this.getRoles();
  
      this.createTicket = new CreateTicket(null, null, null, null, null, null, null, null, null, null);
    }
  
    safeUrl(value) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    }
  
  

  
    getPriorityType(data) {
      this.commonService.getAppTerms('Ticket_Priority').subscribe(res => {
        this.ticketPriorityList = res.results;
      });
    }
  
    handleFileSelect(evt) {
      const files = evt.target.files;
      const file = files[0];
      if (!file) return;

      const fileName = file.name;
      const fileType = file.type;
      const reader = new FileReader();
      reader.onload = () => {
        const binaryString = reader.result as string;
        const base64Data = btoa(binaryString);
        this.addFile(base64Data, fileType, fileName);
      };
      reader.readAsBinaryString(file);
    }
  
    private addFile(base64Data: string, fileType: string, fileName: string) {
      const url = this.safeUrl('data:' + fileType + ';base64,' + base64Data);
      const entry = { file: url, mimeType: fileType, fileName: fileName, fileSize: '' };
      const attachEntry = { base64Data, fileType, fileName };

      if (this.replaceIndex >= 0) {
        this.imageData.splice(this.replaceIndex, 1, entry);
        this.attachFiles.splice(this.replaceIndex, 1, attachEntry);
        this.replaceIndex = -1;
      } else {
        this.imageData.push(entry);
        this.attachFiles.push(attachEntry);
      }
    }

    setReplaceIndex(index: number) {
      this.replaceIndex = index;
    }
  

  
    cancelFile(index) {
      this.imageData.splice(index, 1);
      this.attachFiles.splice(index, 1);
    }
  
    

  
    getCustomerList(): void {
      this.hospitalServices.getCustomerList().subscribe(res => {
        this.customerList = res.results;
      });
  
      if (this.data?.facilityId) {
        this.getRegionList(this.data.customerId);
        this.getFacilityList(this.data.regionId);
      }
    }
    getRegionList(cust_id): void {
      this.hospitalServices.getRegionList(cust_id).subscribe(res => {
        this.regionList = res.results;
      });
    }
    getFacilityList(data) {
      this.hospitalServices.getFacilityList(data).subscribe(res => {
        this.facilityList = res.results;
      });
    }
  
    getBlockList() {
      this.hospitalServices.getBlockList().subscribe(res => {
        this.blockList = res.results;
      });
    }
  
    getRoles() {
      this.commonService.getAllRole().subscribe(res => {
        this.roleList = res.results;
      });
  
      this.commonService.getEnumTerms('FileType').subscribe(res => {
        this.fileTypes = res.results;
        console.log(res.results);
      });
  
      
      this.commonService.getAppTermsVerion2('Status').subscribe(res => {
        this.statusList = res.results;
      });
  
    }
  
    public buildForm() {
  
      this.ticketForm = this.form.group({
        
        customerId: [{ value: this.data.customerId ? this.data.customerId : localStorage.getItem('customerId'), disabled: (localStorage.getItem('userlevel') != '1') }, [Validators.required]],
        description: [this.data.description ? this.data.description : null, [Validators.minLength(3), Validators.maxLength(1000)]],
        email: [this.data.email ? this.data.email : null, [Validators.required, Validators.email]],
        locationId: [this.data.locationId ? this.data.locationId : null, ],
        address: [this.data.address ? this.data.address : null],
        name: [this.data.name ? this.data.name : null],
        phone: [this.data.phone ? this.data.phone : null, [Validators.required, Validators.pattern('[6789][0-9]{9}')]],
        ticketAttachmentId: [this.data.ticketAttachmentId ? this.data.ticketAttachmentId : null],
        ticketPriorityId: [this.data.ticketPriorityId ? this.data.ticketPriorityId : null, ],
        title: [this.data.title ? this.data.title : null, ],
        filetype: [this.data.filetype ? this.data.filetype : null],
        base64Data: [this.data.base64Data ? this.data.base64Data : null],
        
        attachFiles: this.form.array([this.getFiles()]),
      });
  
    }
  
    private getFiles() {
      return this.form.group({
        base64Data: [''],
        fileType: [''],
       
      });
    }
  
    public saveTicket() {
  
      this.isDisabled = true;
  
      console.log(this.ticketForm);
      console.log([{ base64Data: this.attachFiles, fileType: 'IMAGE', fileUrl: this.baseURL }]);
      this.createTicket = new CreateTicket(null, null, null, null, null, null, null, null, null, null);
      this.createTicket.description = this.ticketForm.controls['description'].value;
      this.createTicket.locationId = this.ticketForm.controls['locationId'].value;
      this.createTicket.address = this.ticketForm.controls['address'].value;
      this.createTicket.email = this.ticketForm.controls['email'].value;
      this.createTicket.name = this.ticketForm.controls['name'].value;
      this.createTicket.ticketPriorityId = this.ticketForm.controls['ticketPriorityId'].value;
      this.createTicket.phone = this.ticketForm.controls['phone'].value;
      this.createTicket.title = this.ticketForm.controls['title'].value;
      this.createTicket.customerId = this.ticketForm.controls['customerId'].value;
      
      const postData = Object.assign({}, this.createTicket);
      postData.attachFiles = this.attachFiles;
  
      this.hospitalServices.saveTicket(postData).subscribe(res => {
        if (res.statusCode != 1) {
          this.isDisabled = false;
        }
        
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
        error => {
          console.log('error----------->', error);
          this.isDisabled = false;
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  
    public updateTicket(data) {
      this.isDisabled = true;
  
  
      this.editTicket = new EditTicket(null, null, null, null, null, null, null, null, null, null, null);
      this.editTicket.id = this.data.id;
      this.editTicket.description = this.ticketForm.controls['description'].value;
      this.editTicket.locationId = this.ticketForm.controls['locationId'].value;
      this.editTicket.address = this.ticketForm.controls['address'].value;
      this.editTicket.email = this.ticketForm.controls['email'].value;
      this.editTicket.name = this.ticketForm.controls['name'].value;
      this.editTicket.ticketPriorityId = this.ticketForm.controls['ticketPriorityId'].value;
      this.editTicket.phone = this.ticketForm.controls['phone'].value;
      this.editTicket.title = this.ticketForm.controls['title'].value;
      this.editTicket.customerId = this.ticketForm.controls['customerId'].value;
      this.editTicket.attachFiles = this.attachFiles;
  
      console.log('EDIT TICKET ::::::::::: -> ' + JSON.stringify(this.editTicket));
  
      this.hospitalServices.editTicket(this.editTicket).subscribe(result => {
        if (result.statusCode != 1) {
          this.isDisabled = false;
        }
        this.toastr.success('Success', `${result.message}`);
        this.thisDialogRef.close('confirm');
      },
        error => {
          this.isDisabled = false;
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  
    
  
    public deleteAttachmentInTicket(imgObj, index) {
      
  
      this.hospitalServices.deleteAttachmentInTicket(imgObj.attachmentId).subscribe(res => {
        this.data.attachFiles.splice(index, 1);
       
        this.toastr.success('Success', `Attachment removed successfully!`);
        this.thisDialogRef.close('confirm');
      });
    }
  lightboxView(imgObj) {
    const url = imgObj.file;
    const fileType = imgObj.mimeType;
    this.dialog.open(LightboxOnlineMenuDialogComponent, {
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      data: { url, type: fileType },
      panelClass: 'custom-preview-dialog-container',
      disableClose: true
    });
  }

  fixClick() {
    console.log('')
  }
  }
