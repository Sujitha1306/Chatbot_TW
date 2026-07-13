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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-visitor-tag-associate',
  templateUrl: './visitor-tag-associate.component.html',
  styleUrls: ['./visitor-tag-associate.component.scss']
})
export class VisitorTagAssociateComponent implements OnInit {
  public visitorTagForm: FormGroup
  listItems: any;
  searchCosterlist: any;
  workflowTypeId = 'WF-VIS';
  userId = localStorage.getItem('dXNlcklk')
  visitorData = null;
  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService, public form: FormBuilder,
    public thisDialogRef: MatDialogRef<VisitorTagAssociateComponent>, public toastr: AppToastService,){}

  ngOnInit(): void {
    this.bulidForm()
    this.getVisitDetails(this.data.visitorId)
  }

  bulidForm() {
    this.visitorTagForm = this.form.group({
      tagSerialNumber: [null, [Validators.required, this.validateDeviceSelection.bind(this)]],
      comments: [null],
      isVisitorVerified: [false, Validators.requiredTrue]
    })
  }

  private validateDeviceSelection(control: FormControl): { [key: string]: any } | null {
      const selectedId = control.value;
      if (selectedId) {
        if (!this.listItems || this.listItems.length === 0) {
          return { invalidAsset: true };
        }
  
        let selectedDevice = this.listItems.find(val => val.tagId === selectedId);
        if (!selectedDevice) {
          return { invalidDevice: true };
        }
      }
      return null;
    }

  searchToCoster(event) {
    console.log(event)
    if(event.type === 'device' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          this.listItems = res.results;
          this.searchCosterlist = this.listItems;
        });
      } else {
        this.searchCosterlist = this.listItems;
      }
    } else {
      this.searchCosterlist = [];
    }
  }

  getVisitDetails(id) {
    this.commonService.getVisitorById(id).subscribe(res => {
      this.visitorData = res.results;
      console.log("thisisdat",this.visitorData)
    })
  }

  associateTheTag(){
    let tagData = {
      "tagAssociation": [
        {
          "tagSerialNumber": this.visitorTagForm.controls['tagSerialNumber'].value,
          "comment": this.visitorTagForm.controls['comments'].value,
          "tagTypeId": null
        }
      ],
      "tagAssociationId": this.data.visitorId,
      "tagAssociationType": "Visitor",
      "tagAssociationTypeId": "TAT-VS"
    }
    this.configurationService.replaceMultipleAssociateTag(tagData).subscribe(res => {
      if(res.statusCode === 1){
        const data = {
          comments: this.visitorTagForm.controls['comments'].value,
          statusId: 'VIS-AR',
          userId: parseInt(this.userId)
        };
        this.commonService.updateVisitoryStatus(this.data.visitorId, data).subscribe(res => {
          if (res.statusCode === 1) {
            this.thisDialogRef.close('confirm');
          }
        },error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
