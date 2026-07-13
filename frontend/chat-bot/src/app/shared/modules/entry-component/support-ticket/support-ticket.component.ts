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
import { Component,  Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../services/common.service';
import { HospitalService } from '../../../services/hospital.service';
import { FormGroup, FormBuilder, Validators, } from '@angular/forms';
import { CreateTicket } from './support-ticket.model';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from './../../../../../environments/environment';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-support-ticket',
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.scss']
})

export class CreateTicketComponent  {
  fileType: string;
  fileName: string;
  public roleList: any[] = null;
  public fileTypes: any[] = null;
  public statusList: any[] = null;
  public ticketForm: FormGroup;
  public createTicket: CreateTicket;
  ticketPriorityList: any;
  public matcher = new ErrorStateMatcherService();
  public imageData: any[] = [];
  public base64Data_global: string = '';
  base64Data = this.base64Data_global;
  attachFiles: any[] = [];
  // selectedFile: File;
  // fileList: File[] = [];
  fileInfo: string;

  baseURL = environment.api_base_url_new + 'api/all/ticket/ticket-attachment-file';

  constructor(public form: FormBuilder,
    protected sanitizer: DomSanitizer,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateTicketComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService, private readonly hospitalServices: HospitalService,private readonly dialog: MatDialog,) {

    this.getPriorityType('Ticket_Priority');
    this.buildForm();
    this.getRoles();
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }



  getPriorityType(data) {
    this.commonService.getAppTermsWithoutLogin('Ticket_Priority').subscribe(res => {
      this.ticketPriorityList = res.results;
    });
  }

  handleFileSelect(evt) {
    // alert(JSON.stringify(evt))
    //this.imageData.length = 0;
    const files = evt.target.files;
    if (files.length > 2) {
      // this.snackbar.open('sorry, you can upload only 1 file!', 'Close', {
      //   duration: 3000,
      // });
      this.toastr.success('Success', `{sorry, you can upload only 1 file!}`);
      this.thisDialogRef.close('confirm');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (files && file) {
        this.fileType = file.type;
        this.fileName = file.name;
        const reader = new FileReader();
        reader.onload = this._handleReaderLoaded.bind(this);
        reader.readAsBinaryString(file);
        //reader.readAsDataURL(file);
      }
    }
  }

   _handleReaderLoaded(readerEvt) {
    const binaryString = readerEvt.target.result;
    // checking  the FILE TYPE
    //let base64Data='data:image/jpeg;base64,'+btoa(binaryString);
    const base64Data = btoa(binaryString);

    if (this.fileType.includes('image')) {
      const url = this.safeUrl('data:image/png;base64,' + base64Data);
      this.imageData.push({
        file: url,
        mimeType: this.fileType
      });
    }

    if (this.fileType == 'application/pdf') {
      const url = this.safeUrl('data:application/pdf;base64,' + base64Data);
      this.imageData.push({
        file: url,
        mimeType: this.fileType
      });
    }


    this.base64Data_global = base64Data;

    this.attachFiles.push(
      {
        'base64Data': base64Data,
        'fileType': this.fileType
      }
    );

  }

  cancelFile(index) {
    //alert(index);
    this.imageData.splice(index, 1);
  }


  getRoles() {
    // this.hospitalServices.getEnumTerms('FileType').subscribe(res => {
    //   this.fileTypes = res.results;
    // });
    // this.hospitalServices.getAppTerms('Status').subscribe(res => {
    //   this.statusList = res.results
    // })

  }

  public buildForm() {
    this.ticketForm = this.form.group({
      customerId: [null],
      locationId: [null],
      facilityName: [null, [Validators.required]],
      locationName: [null, [Validators.required]],
      description: [null],
      email: [this.data.email ? this.data.email : null, [Validators.required, Validators.email]],
      address: [null],
      name: [null, [Validators.required]],
      phone: [this.data.phone ? this.data.phone : null, [Validators.required, Validators.pattern('[6789][0-9]{9}')]],
      ticketAttachmentId: [null],
      ticketPriorityId: [null],
      title: [null],
      filetype: [null],
      base64Data: [null],
      fileUrl: [null],
      // attachFiles: [''],
      attachFiles: this.form.array([this.getFiles()]),

    });
  }

  private getFiles() {
    return this.form.group({
      base64Data: [null],
      fileType: [null],
      fileUrl: [null],

    });
  }

  public saveTicket() {

    console.log('entry component TICKET');
    this.createTicket = new CreateTicket(null, null, null, null, null, null, null, null, null, null, null, null);
    //this.createTicket.attachFiles = [{ base64Data: this.base64Data_global, fileUrl: this.baseURL, fileType: this.ticketForm.controls['filetype'].value }];
    this.createTicket.description = this.ticketForm.controls['description'].value;
    this.createTicket.customerId = this.ticketForm.controls['customerId'].value;
    this.createTicket.locationId = this.ticketForm.controls['locationId'].value;
    this.createTicket.facilityName = this.ticketForm.controls['facilityName'].value;
    this.createTicket.locationName = this.ticketForm.controls['locationName'].value;
    this.createTicket.address = this.ticketForm.controls['address'].value;
    this.createTicket.email = this.ticketForm.controls['email'].value;
    this.createTicket.name = this.ticketForm.controls['name'].value;
    this.createTicket.ticketPriorityId = this.ticketForm.controls['ticketPriorityId'].value;
    this.createTicket.phone = this.ticketForm.controls['phone'].value;
    this.createTicket.title = this.ticketForm.controls['title'].value;
    const postData = Object.assign({}, this.createTicket);
    postData.attachFiles = this.attachFiles;
    this.hospitalServices.saveTicket(postData).subscribe(res => {

      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: "Ticket Submitted", message: "Your ticket has been submitted successfully. Please check your email for updates.",
         buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        this.dialog.closeAll();
      });
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
   fixClick() {
     console.log('')
   }
}
