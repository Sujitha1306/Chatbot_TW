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

import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent {
  deviceForm: any;
  listItems: any;
  searchCosterlist: any;
  tagTypeId: any;

  constructor(
    public form: FormBuilder,
    public dialogRef: MatDialogRef<DeviceComponent>,
    public toastr: AppToastService,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(){
    console.log(this.data)
    this.buildform()
  }

  buildform(){
    // {"tagAssociationId":3924,"tagAssociationType":"Asset","tagAssociationTypeId":"TAT-AS","tagSerialNumber":"200052520","tagTypeId":"TT-BA"}
      this.deviceForm = this.form.group({
        tagSerialNumber:[this.data?.tagSerialNumber || null,[Validators.required,this.validateTagSelection.bind(this)]],
        comments :[null],
      })
  }

  
  searchToCoster(event) {
    if (event.type === 'costerTagId' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, this.data.workflowTypeId, 'ST-AT').subscribe(res => {
          this.listItems = res.results;
          this.searchCosterlist = this.listItems;
          console.log(this.searchCosterlist)
        });
      } else {
        this.searchCosterlist = this.listItems;
      }
    } else {
      this.searchCosterlist = [];
    }
  }

  getTagList(id) {
    console.log(id)
    if (id !== null) {
      let selectedTag = this.searchCosterlist.find(val => val.tagId === id);
      this.tagTypeId = selectedTag?.tagTypeId;
      return id;
    } else {
      this.tagTypeId = null;
      return '';
    }
  }

    private validateTagSelection(control): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.searchCosterlist || this.searchCosterlist.length === 0) {
          return { invalidTag: true };
        }

        let selectedTag = this.searchCosterlist.find(val => val.tagId === selectedId);
        this.tagTypeId = selectedTag?.tagTypeId;
        if (!selectedTag) {
          return { invalidTag: true };
        }
      }
      return null;
    }


  onSubmit() {
    console.log(this.data)
    if (this.data?.tagSerialNumber) {
      let data={"checkExistingAssignment":false,"comments":this.deviceForm.controls.comments.value,"tagSerialNumber":this.data.tagSerialNumber}
      this.configurationService.disassociateTag(data).subscribe(
        res => {
          this.toastr.success('Success', res.message);
          this.dialogRef.close('confirm');
        },
        error => this.toastr.error('Error', error.error.message)
      );
    } else {
      let data={"tagAssociationId": this.data.associationId,"tagAssociationType":this.data.type,"tagAssociationTypeId":this.data.workflowTypeId,"tagSerialNumber":this.deviceForm.controls.tagSerialNumber.value,"tagTypeId":this.tagTypeId}
      this.configurationService.associateTag(data).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
  fixClick() {
    console.log('')
  }
}
