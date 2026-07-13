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

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { NGX_MAT_DATE_FORMATS, NgxMatDateFormats } from '@angular-material-components/datetime-picker';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DatePipe } from '@angular/common';
import { CommonService } from '../../../../shared';
import { MatDialogRef } from '@angular/material/dialog';
import { AppToastService } from '../../../../shared/services/toaster.service';

const NGX_DATE_FORMAT: NgxMatDateFormats = {
  parse: {
    dateInput: 'DD/MM/YYYY HH:mm'
  },
  display: {
    dateInput: 'DD-MMM-YYYY HH:mm:ss',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
}

@Component({
  selector: 'app-create-live-request',
  templateUrl: './create-live-request.component.html',
  styleUrls: ['./create-live-request.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: NGX_MAT_DATE_FORMATS, useValue: NGX_DATE_FORMAT },
  ]
})
export class CreateLiveRequestComponent implements OnInit {
  charCount = 0;
  public liveRequestForm: UntypedFormGroup;
  public DateTime = this.datepipe.transform(new Date(), 'yyyy-MM-dd hh:mm');
  eventLocationList: any = [];
  eventCategoryList: any = [];
  fileType: any;
  format: string;
  filePassed = false;
  url: string | ArrayBuffer;
  videoData = null;
  contentName: any;
  urlData: string;
  categoryName: any;
  locationName: any;
  uploadedImg: any = null;

  constructor(public fb: UntypedFormBuilder, public datepipe: DatePipe, public commonService: CommonService,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateLiveRequestComponent>, 
    ) { 
    }

  ngOnInit(): void {
    this.buildForm();
    this.commonService.getAnalyticsLocation().subscribe(res => {
      this.eventLocationList = res.results.data;
    })
    this.commonService.getAnalyticsCategories().subscribe(res => {
      this.eventCategoryList = res.results.data;
    })
  }

  public buildForm() {
    this.liveRequestForm = this.fb.group({
      titleId: [null,[Validators.required]],
      eventAbout: ['',[Validators.required, Validators.maxLength(70)]],
      eventDate: [this.DateTime,[Validators.required]],
      duration: ['00:00:00',[Validators.required, 
        Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/), this.durationValidator]],
      location: [null, [Validators.required]],
      category: [null, [Validators.required]]
    })
  }
  durationValidator(control) {
    const value = control.value;
    if (value === '00:00:00') {
      return { invalidDuration: true };
    }
    return null;
  }
  categoryDetails(data){
    this.categoryName = data;
  }
  locationDetails(data){
    this.locationName = data;
  }
  createScheduleId(){
    let postData = { 
      "scheduleDate": this.liveRequestForm.controls['eventDate'].value,
      "scheduledUser": {
        "id": localStorage.getItem('dXNlcklk'),
        "name": localStorage.getItem('Y3VycmVudF91c2Vy'),
        "img": "",
      },
    }
    this.commonService.createTelecastSchedule(postData).subscribe(res => {
      let createdData = res.results['data'][0];
      this.requestSubmit(createdData)
    });
  }

  requestSubmit(idData) {
    let postdata = {
      title: this.liveRequestForm.controls['titleId'].value,
      duration: this.liveRequestForm.controls['duration'].value,
      sourceUrl: '',
      preferredAt: this.liveRequestForm.controls['eventDate'].value,
      uploadedBy: {
        id: idData._id,
        name: idData.scheduledUser.name,
        img: ''
      },
      category: [
        {
          key: this.liveRequestForm.controls['location'].value,
          value: this.categoryName        
        }
      ],
      location: {
          key: this.liveRequestForm.controls['category'].value,
          value: this.locationName
        },
      requestStatus: "Approved",
      isActive: true,
      createdBy: idData.createdBy
    }
    this.commonService.createNewLiveRequest(postdata).subscribe(res => {
      this.toastr.success('Success', `${'Request Save Successful'}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateCounter(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.charCount = textarea.value.length;
  }

  onSelectFile(event) {
    const file = event?.target?.files[0];
    if (file) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        this.url = (<FileReader>event.target).result;
        this.videoData = this.url;
        this.urlData = btoa(this.videoData);
        this.contentName = file.name
        this.filePassed = true;
      }
    }
  }

  uploadRemove(){
  this.filePassed = false;
  this.videoData = null;
  this.contentName = null
  this.urlData = null
  }
  fixClick() {
    console.log('')
  }  
}
