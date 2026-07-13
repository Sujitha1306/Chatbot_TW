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

import { Component, Inject, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-resource-remarks',
  templateUrl: './resource-remarks.component.html',
  styleUrls: ['./resource-remarks.component.scss']
})
export class ResourceRemarksComponent {
  public remarkForm: FormGroup;
  actionTypeList: any;
  public ratingStar = Array(10);
  constructor(public form: FormBuilder, @Optional() @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public dialog: MatDialog, public thisDialogRef: MatDialogRef<ResourceRemarksComponent>
    , public toastr: AppToastService) {
    console.log(this.data)
  }
  ngOnInit(){
    this.buildForm();
    if (this.data?.type != 'porter') {
      this.commonService.getAppTermsLink('RQT-TASK').subscribe(res => {
        this.actionTypeList = res.results.filter(fill => fill.groupName === 'RequestCancelReason');
      })
    }
  }

  buildForm() {
    this.remarkForm = this.form.group({
      actionTypeId: [this.data ? this.data.statusReasonId : null],
      remarks: [this.data?.type != 'porter' ? this.data.comments : this.data?.ratingComments],
      rating: [this.data?.rating ? this.data.rating : 0]
    })
  }

  setRating(value){
  const currentValue = this.remarkForm.get('rating')?.value || 0;
    if (currentValue == value) {
      this.remarkForm.get('rating')?.setValue(0);
    } else {
      this.remarkForm.get('rating')?.setValue(value);
    }
  }
 
  updateRemarks() {
    const data = {
      statusReasonId: this.remarkForm.controls['actionTypeId'].value,
      comments: this.remarkForm.controls['remarks'].value
    }
    let porterData = { ...this.data, rating: this.remarkForm.controls.rating.value, ratingComments: this.remarkForm.controls.remarks.value }
    if (this.data?.type === 'porter') {
      this.commonService.updatePorterRequest(porterData).subscribe(res => {
        this.toastr.success('Success', `${res.message}`,);
        this.thisDialogRef.close('confirm');
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    } else {
      this.commonService.updateticketremarks(data, this.data.id).subscribe(res => {
        this.toastr.success('Success', `${res.message}`,);
        this.thisDialogRef.close('confirm');
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
  fixClick() {
    console.log('')
  }
}
