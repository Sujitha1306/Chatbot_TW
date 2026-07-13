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
import { Component, OnInit, Input, Output, EventEmitter, } from "@angular/core";
import {  MatDialog, } from "@angular/material/dialog";
import { FormBuilder, } from "@angular/forms";
import { CommonService, } from "../../../services";
import { PatientInfoComponent } from "../patient/patient.component";
import { AcknowledgementComponent } from "../acknowledgement/acknowledgement.component";
import { TaskManagmentComponent } from "../task-managment/task-managment.component";
import { AppToastService } from "../../../services/toaster.service";

@Component({
  selector: "app-card-view",
  templateUrl: "./card-view.component.html",
  styleUrls: ["./card-view.component.scss"],
})
export class CardViewComponent implements OnInit {
  today = new Date();
  public rowData: any = [];
  public activate_btn: any = [];
  public cardType = null;
  @Input() cardPatientInfo: any;
  @Input() component: any;
  @Input() alertPatientId = [];
  @Input() view = null;
  @Output() eventAction = new EventEmitter<any>();
  @Output() scrollAction = new EventEmitter<any>();
  @Output() stopAudioAction = new EventEmitter<any>();
  public cols: any = 4;
  public isCheck = false;
  height: number;

  constructor(
    public dialog: MatDialog,
    public fb: FormBuilder,
    public commonService: CommonService, public toastr: AppToastService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.cardType = this.view ? this.view['type'] : null;
  }
  onWindowResizedCol(size){
      this.cols = size;
  }

  eventTrigger(key, data, patientId) {
    if(this.cardType == 'location') {
      let patientDetails = patientId
      data['patientId'] = patientDetails['patientId'];
      if(data.hasOwnProperty('ackDatetime') && data.ackDatetime) {
        data['requestedType'] = 'RQT-TASK';
        data['description'] = data['message']
        data['destinationName'] = patientDetails['bedNo'] +', ' +patientDetails['locationName'];
        data['contextType'] = 'PR-PA';
        data['destinationId'] = patientDetails['bedId']
        data['type'] = 'patient';
        data['page'] = 'nurseCall'
        const dialogRef = this.dialog.open(TaskManagmentComponent, {
          data: data, panelClass: ['large-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
          this.eventAction.emit({ key : 'refresh', data : null, patientId: null });
        });
      } else {
        const dialogRef = this.dialog.open(AcknowledgementComponent, {
          width: '600px', height: '300px', panelClass: 'pop-up-margin',
          data: data
        });
        dialogRef.afterClosed().subscribe(result => {
          this.eventAction.emit({ key : 'refresh', data : null, patientId: null });
        });
      }
    } else {
    this.eventAction.emit({ key, data, patientId });
    }
  }

  ackAlert(alertId) {
    let ackAlertDetail = [{
      'ackUserId': parseInt(localStorage.getItem(btoa('userId'))),
      'id': alertId,
      'isAck' : true
    }];
    this.commonService.ackAlertById(ackAlertDetail).subscribe(resAlert => {
      if (resAlert.statusCode === 1) {
        this.toastr.success('Success', `${resAlert.message}`);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  scroll() {
    this.scrollAction.emit();
  }

  stopAudio(patientId) {
    this.stopAudioAction.emit({ patientId });
  }
  patientInfo(data) {
    data['type'] = '1';
      if(this.cardType == 'location') {
        data['ipView'] = 'location'
      }
    this.dialog.open(PatientInfoComponent,
        { data: data, panelClass: ['medium-popup'], disableClose: true });
  }  
  onWindowResized(size){
    this.height = size;
  }
  fixClick() {
    console.log('')
  }


}
