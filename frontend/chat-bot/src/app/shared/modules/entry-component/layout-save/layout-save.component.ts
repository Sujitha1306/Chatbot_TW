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

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DashboardService } from '../../../../shared/services/dashboard.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-layout-save',
  templateUrl: './layout-save.component.html',
  styleUrls: ['./layout-save.component.scss']
})
export class LayoutSaveComponent {

  public layoutData : any = [];

  constructor(@Inject(MAT_DIALOG_DATA) private readonly data: any,
  private readonly dialogRef: MatDialogRef<LayoutSaveComponent>, public dashboardService: DashboardService,) {
    if(data){
      this.layoutData['dashboardId'] = data[0]
      this.layoutData['widgetId'] = data[1]
      this.layoutData['xPos'] = data[2]
      this.layoutData['yPos'] = data[3]
      this.layoutData['rows'] = data[4]
      this.layoutData['cols'] = data[5]
    }
  }



  saveLayout(){
    this.dashboardService.getLayoutUpdate(this.layoutData['dashboardId'], this.layoutData['widgetId'], this.layoutData['xPos'], this.layoutData['yPos'], this.layoutData['rows'], this.layoutData['cols']).subscribe(res => {
      if (res.results.statusCode == 200) {
        console.log(this.layoutData['xPos']) 
      }
      this.dialogRef.close();
    })
  }

  closeDialogue(){
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  
  public title = 'Confirmation';
  public message = 'Are you sure?';
  public confirmButtonText = 'Yes';
  public cancelButtonText = 'Cancel';
  public createButtonText = 'Create new Layout';
  customerName: string;
  blockForm : FormGroup
  floor = null;
    
  constructor( @Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder,
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>) { }

  ngOnInit() {
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn";
    }
    this.title = this.data.title ? this.data.title : this.title;
    this.message = this.data.message ? this.data.message : this.message;
    if (this.data.hasOwnProperty('buttonText')) {
      this.confirmButtonText = this.data.buttonText.ok ? this.data.buttonText.ok : this.confirmButtonText;
      this.cancelButtonText = this.data.buttonText.cancel ? this.data.buttonText.cancel : this.cancelButtonText;
      this.createButtonText = this.data.buttonText.new ? this.data.buttonText.new : this.createButtonText;
    } else {
      this.confirmButtonText = this.data.button.ok ? this.data.button.ok : this.confirmButtonText;
      this.cancelButtonText = this.data.button.cancel ? this.data.button.cancel : this.cancelButtonText;
    }
    this.buildForm();
  }
  buildForm() {
    this.blockForm = this.form.group({
      blockId: [this.data.blockId ? this.data.blockId : null],
      floorId: [this.data.floorId ? this.data.floorId : null]
    });
  }

  getFloor(data, type) {
    if(type === 'block') {
      const block = this.data.blockList.filter(x => x.id === data.id);
      this.data.floorList = block[0]?.children;
    } else {
      this.floor = data;
    }
  }

  saveComments(text) {
     if (this.data.hasOwnProperty('floorChange') && this.data.floorChange === true) {
      const data = {
        'blockId': this.blockForm.get('blockId').value, 
        'floor': this.floor,
        'confirmText': text
      };
      this.dialogRef.close(data)
    } 
  }
}
