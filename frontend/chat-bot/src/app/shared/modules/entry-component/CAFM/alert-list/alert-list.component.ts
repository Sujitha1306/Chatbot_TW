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
import { Component, Inject, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConfigurationService } from '../../../../services';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss']
})
export class AlertListComponent {
    @Input() entityData: any;
    alertDisplayedColumn=['Type','Alert Time','Message','Status','Read Time','Closed Time'];
    alertIconColumn =['Alert Time','Closed Time','Read Time','Status'];
    alertDataHistory =[];
    public alertForm: FormGroup;
    public startDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
    public endDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
    today = new Date();
    public loading = false;
    public tableData: any;
    public length :any;
    public pageStart=0;
    public pageSize =50;
    public permissionControl =[];
    public eventColumn =['Message'];
    public iconHeader =[]
  
   constructor(
      public form: FormBuilder,
      private readonly _dateFormat: DatePipe,
      public dialog: MatDialog,
      private readonly configurationServices:ConfigurationService
    ){}
  
    ngOnInit(){
    this.buildForm();
    this.getAssetAlertHistoryData(this.entityData.entityId ,this.entityData.entityType, this.pageStart, this.pageSize);
    }
  
  buildForm(){
    this.alertForm = this.form.group({
      startDate: [this.startDate ? this.startDate : null],
      endDate: [this.endDate ? this.endDate : null],
    })
  }
  
  getAssetAlertHistoryData(id, type, pageStart, pageSize): void {
    this.loading=true
    const sDate = this.alertForm.controls['startDate'].value;
    this.startDate = this._dateFormat.transform(new Date(sDate), 'yyyy-MM-dd');
    const eDate = this.alertForm.controls['endDate'].value;
    this.endDate = this._dateFormat.transform(new Date(eDate), 'yyyy-MM-dd');
    this.configurationServices.getAlertHistoryAsset(this.startDate, this.endDate, id,type,pageStart,pageSize).subscribe((res) => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.alertDataHistory = this.tableData;
  
      const columns = ['pfAlertConfigNames', 'alertDatetime', 'subject','isSeen','seenDateTime','closedDatetime'];
      for (let i = 0; i < columns.length; i++) {
        this.tableData.forEach(data => {
          data[this.alertDisplayedColumn[i]] = data[columns[i]];
        });
      }
      this.loading = false; 
    });
  }
  
  eventAction(event,component){
    if(event.key ==='Message'){
      const dialogRef = this.dialog.open(AlertDetailsComponent, {
        panelClass: ['small-popup'], disableClose: true,
        data: event.data
      });
      dialogRef.afterClosed().subscribe(result => {
         this.getAssetAlertHistoryData(this.entityData.entityId,this.entityData.entityType,this.pageStart,this.pageSize)
      })
    }else if(event.key ==='pagination'){
      this.getAssetAlertHistoryData(this.entityData.entityId,this.entityData.entityType,this.pageStart,this.pageSize)
    }
  }


}

@Component({
  selector: 'app-alert-details',
  templateUrl: './alert-details.component.html',
  styleUrls: ['./alert-list.component.scss']
})

export class AlertDetailsComponent{

constructor(
  @Inject(MAT_DIALOG_DATA) public data: any,
  private readonly dialogRef: MatDialogRef<AlertDetailsComponent>,
  ) {}

  formatMessage(message: string): string {
    return message.replace(/\n/g, '<br>');
  }


}
