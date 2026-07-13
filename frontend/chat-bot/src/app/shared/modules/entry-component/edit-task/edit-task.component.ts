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
 import { Component, OnInit, ViewChild, Inject } from "@angular/core";
 import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
 import { DatePipe } from "@angular/common";
 import { CommonService, ConfigurationService } from "../../../services";
import { FormBuilder, FormGroup } from "@angular/forms";
import { EditTask } from "./edit-task.model";
import { AppToastService } from "../../../services/toaster.service";

 
 @Component({
   selector: 'app-edit-task',
   templateUrl: './edit-task.component.html',
   styleUrls: ['./edit-task.component.scss'],
 })
 export class EditTaskComponent implements OnInit {
 
   @ViewChild(MatPaginator) paginator: MatPaginator;
   @ViewChild(MatSort) sort: MatSort;
   today = new Date();
   popWidth: any;
   popHeight: any;
   contentHeight: number;
   public taskForm: FormGroup;
   public editTask: EditTask;
   bookingStatus = [];
   requestStatus = [];
   activate_btn = [];
 
   constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>,
     public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService,
     private readonly commonService: CommonService, private readonly dateFormat: DatePipe) { 
      this.activate_btn = this.commonService.getActivePermission('button');
     }
 
   ngOnInit() {
    this.buildForm();
    this.commonService.getAppTerms("RequestStatus").subscribe((res) => {
      if(res.statusCode == 1) {
        let userId = localStorage.getItem(btoa('userId'));
        if(this.data) {
          this.requestStatus = res.results.filter(val => [this.data.requestStatusCode].includes(val.code))
        }
        if (this.data.assignedToId == userId 
          || (this.data.createdUserId == userId && this.activate_btn.includes('BT_TSKCRUSR'))
          || (this.activate_btn.includes('BT_ALLTSKCA') && this.activate_btn.includes('BT_ALLTSKCO'))) { 
          this.requestStatus = res.results.filter(val => ['RQ-CR', 'RQ-CO','RQ-CA'].includes(val.code));
        } else if(this.activate_btn.includes('BT_ALLTSKCA')) {
          this.requestStatus = res.results.filter(val => ['RQ-CR','RQ-CA'].includes(val.code));
        } else if(this.activate_btn.includes('BT_ALLTSKCO')) {
          this.requestStatus = res.results.filter(val => ['RQ-CR','RQ-CO'].includes(val.code));
        }
        if(this.data) {
          let currentStatus = this.requestStatus.filter(val => val.value == this.data['requestStatus'])
          if(currentStatus.length) {
            this.data['requestStatus'] = currentStatus[0]['code'];
            this.buildForm();
          }
        }
      }
    });
   }

   onWindowResizedWidth(size) {
     this.popWidth = size;
   }

   public buildForm() {
    this.taskForm = this.form.group({
      srcIdentifyingId: [this.data.srcIdentifyingId ? this.data.srcIdentifyingType : null],
      taskDetail: [this.data.taskDetail ? this.data.taskDetail : null],
      scheduleDate: [this.data.scheduleDate ? this.dateFormat.transform(this.data.scheduleDate, 'yyyy-MM-ddTHH:mm') : null],
      assignedToId: [this.data.assignedToId ? this.data.assignedTo : null],
      eventDate: [this.data.eventDate ? this.dateFormat.transform(this.data.eventDate, 'yyyy-MM-ddTHH:mm') : null],
      statusCode: [this.data.requestStatus ? this.data.requestStatus : null],
      remarks: [this.data.remarks ? this.data.remarks : null],
    });
  }
  updateTask(data) {
    let payload = {
      "type"      : this.data.srcIdentifyingTypeCode,
      "comments"  : null,
      "remarks"   : this.taskForm.controls.remarks.value,
      "status"    : this.taskForm.controls.statusCode.value
    }
    let requestId = this.data.identifyingId;
    this.commonService.updateTask(requestId, payload).subscribe(res => {
      if (res.statusCode === 1) {
        this.thisDialogRef.close('confirm');
      }
    });
  }
 }
 
