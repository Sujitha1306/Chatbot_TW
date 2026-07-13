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
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonService } from '../../../../shared';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../../../app.module';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { AppToastService } from '../../../../shared/services/toaster.service';

export function timeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return { 'required': true };
    }

    const isValid = moment(value, 'HH:mm', true).isValid();

    return isValid ? null : { 'invalidTimeFormat': true };
  };
}

@Component({
  selector: 'app-upload-schedule',
  templateUrl: './upload-schedule.component.html',
  styleUrls: ['./upload-schedule.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class UploadScheduleComponent implements OnInit {
  today = new Date();
  public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  public currentTime =  this.datepipe.transform(new Date(), 'hh:mm');
  public slotTime =  this.datepipe.transform(this.selectedDate, 'hh:mm');
  requestList: any = [];
  requestedList: any = [];
  passingdata: { type: string; reportData: any; };
  isOpen = false;
  isToggleDisabled = true;
  timeEdit = false;
  time = new FormControl(this.slotTime, [Validators.required, timeValidator()]);
  scheduleRequestId = null;
  actionBY: any;
  previousId = null;
  telecastType: any = [];


  constructor(public datepipe: DatePipe, public commonService: CommonService,
     @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public toastr: AppToastService,) { }

  ngOnInit(): void {
    this.scheduleRequest(this.selectedDate);
    const scrollableElement = document.getElementById('sh-approved');
    scrollableElement.scrollTop = scrollableElement.scrollHeight;
  }
  getDate(dateEvent){
    this.selectedDate = this.datepipe.transform(dateEvent.value, 'yyyy-MM-dd');
    this.scheduleRequest(this.selectedDate)
  }
  scheduleRequest(date){
    this.requestedList = [];
    this.scheduleRequestId = null;
    this.slotTime = moment("09:00:00", 'HH:mm:ss').format("HH:mm")        
    this.time = new FormControl(this.slotTime, [Validators.required, timeValidator()]);
    this.commonService.getTodayTeleShedu(date).subscribe(res => {
      this.requestList = res.results.data;
      this.slotTime = this.time.value;
      for(let i in this.requestList) {
        this.scheduleRequestId = this.requestList[i]["scheduleId"]
                let slotValue = this.requestList[i]["timeSlot"].split(" ")[1]
        this.requestList[i]["slotTime"] = slotValue;   
        if(this.requestList.length - 1 == Number(i)) {
          this.slotTime = moment(slotValue+":00", 'HH:mm:ss').add(moment.duration(this.requestList[i]['slotDuration']))
          .add(moment.duration('00:00:00')).format("HH:mm")
          console.log(this.slotTime)          
          this.time = new FormControl(this.slotTime, [Validators.required, timeValidator()]);
        }     
      }      
    })
    this.commonService.getTelecastLookUp().subscribe(res => {
      this.telecastType = res.results.data
    })
  }

  refreshPage(){
    this.scheduleRequest(this.selectedDate)
  }

  edit(trigger){
    this.timeEdit = trigger;
  }

  scheduleTime(event) {
    console.log(event)
  }
  getApproveData(by, data) {
    this.actionBY = by;
    this.previousId = data;
    let actionData = { "type" : "close", "value" : true}
    this.open(actionData)
  }
  open(actionData) {
        if(actionData.type == 'close') {
      this.isOpen = actionData.value
      if(!actionData.value) {
        this.uploadFileOpen(actionData.value, null);
      }
    }
    if(actionData.type == 'post') {
      this.isOpen = false;
      let approvedData = actionData.value;
      this.requestedList = [];
      approvedData["timeSlot"] = this.selectedDate+" "+this.time.value;
      console.log(approvedData["timeSlot"])
      // let utc = new Date(approvedData["timeSlot"]).toUTCString()
      // let utcYear = new Date(utc).getFullYear()
      // let utcMonth = new Date(utc).getMonth() > 9 ? String(new Date(utc).getMonth()) : '0'+String(new Date(utc).getMonth())
      // let utcDate = new Date(utc).getDate() > 9 ? String(new Date(utc).getDate()) : '0'+String(new Date(utc).getDate())
      // let utcHour = new Date(utc).getHours() > 9 ? String(new Date(utc).getHours()) : '0'+String(new Date(utc).getHours())
      // let utcMinute = new Date(utc).getMinutes() > 9 ? String(new Date(utc).getMinutes()) : '0'+String(new Date(utc).getMinutes())
      // let utcSecs = new Date(utc).getSeconds() > 9 ? String(new Date(utc).getSeconds()) : '0'+String(new Date(utc).getSeconds())
      // approvedData["utcTimeSlot"] = utcYear + '-' + utcMonth + '-' + utcDate +'T' + utcHour + ':' + utcMinute + ':' + utcSecs + '.000Z'
      let slotValue = approvedData["timeSlot"].split(" ")[1]
      approvedData["slotTime"] = slotValue;
      this.requestList.push(approvedData)
      this.requestedList = this.requestList.filter(val => val.scheduleId == null);
      this.slotTime = moment(slotValue+":00", 'hh:mm:ss').add(moment.duration(approvedData['duration'])).add(moment.duration('00:00:00')).format("hh:mm")          
      this.time = new FormControl(this.slotTime, [Validators.required, timeValidator()]);
      this.saveTelecastSchedule([approvedData])
    }
  }
  saveTelecastSchedule(reqData) {
    let requestedData = reqData ? reqData : this.requestedList;
    for(let approvedData of requestedData) {
      let postData = { 
        "scheduleDate": this.selectedDate,
        "scheduledUser": {
          "id": localStorage.getItem('dXNlcklk'),
          "name": localStorage.getItem('Y3VycmVudF91c2Vy'),
          "img": "",
        },
      }
      if(this.scheduleRequestId) {
        let createdData = {'_id' : this.scheduleRequestId};
        this.updateSchedule(approvedData, createdData)
      } else {
        this.commonService.createTelecastSchedule(postData).subscribe(res => {
        if(res.results.hasOwnProperty('data') && res.results.data) {
          let createdData = res.results['data'][0];
          this.scheduleRequestId = createdData['_id'];
          this.updateSchedule(approvedData, createdData)
        }
        else {
          alert('Could not able to create request');
          this.scheduleRequest(this.selectedDate)
        }      
      })
    }
    }
  }
  updateSchedule(approvedData, createdData) {
    if(this.actionBY === 'create'){
      let payLoad = {
        "scheduleId": createdData['_id'],
        "scheduleDate":  this.selectedDate+"T00:00:00.000Z",
        "telecastType": {
          "key": this.telecastType[0].code,
          "value": this.telecastType[0].value
        },
        "slotDuration": approvedData['duration'],
        "timeSlot": approvedData['timeSlot'],
        "feedUrl": "rtmp://stage-kyn-mediaserver-aci.g0gyc2hjaga7drha.centralindia.azurecontainer.io:1935/live/currentstream",
        "sourceId": approvedData['Id'],
        "sourceInfo": {
          "sourceUrl": approvedData['sourceUrl'],
          "thumbnailUrl": approvedData['thumbnailUrl'],
          "title": approvedData['title'],
          "description": approvedData['description'],
          "duration": approvedData['duration'],
          "preferredAt": approvedData['preferredAt'],
          "location": {
            "key": approvedData['locationKey'],
            "value": approvedData['locationValue']
          }    
        },
        "createdBy": "5cabe64dcf0d4447fa60f5e2",
        "isActive": true,
      }
      this.commonService.createTelecastScheduleDetail(payLoad).subscribe(res => {
        this.scheduleRequest(this.selectedDate);
      })
    } else if(this.actionBY === 'modify'){
        if(this.previousId.duration >= approvedData['duration']){
          let payLoad = {
            "scheduleId": createdData['_id'],
            "scheduleDate":  this.selectedDate+"T00:00:00.000Z",
            "telecastType": {
              "key": "StreamType_live",
              "value": "Live Telecast"
            },
            "slotDuration": approvedData['duration'],
            "timeSlot": this.previousId['timeSlot'],
            "feedUrl": "rtmp://stage-kyn-mediaserver-aci.g0gyc2hjaga7drha.centralindia.azurecontainer.io:1935/live/currentstream",
            "sourceId": approvedData['id'],
            "sourceInfo": {
              "sourceUrl": approvedData['sourceUrl'],
              "thumbnailUrl": approvedData['thumbnailUrl'],
              "title": approvedData['title'],
              "description": approvedData['description'],
              "duration": approvedData['duration'],
              "preferredAt": approvedData['preferredAt'],
              "location": {
                "key": approvedData['locationKey'],
                "value": approvedData['locationValue']
              }    
            },
            "modifiedBy": "5cabe64dcf0d4447fa60f5e2",
            "isActive": true,
            "utcTimeSlot": approvedData['utcTimeSlot']
          }
          this.commonService.modifyTelecastScheduleDetail(this.previousId.id, payLoad).subscribe(res => {
            this.previousId = null;
            this.scheduleRequest(this.selectedDate);
          })
        } else {
          alert('The slot time is already occupied.. could not able to replace')
          this.scheduleRequest(this.selectedDate);
        }
    }
  }
  uploadFileOpen(show, data) {
    let kydata = { 'type': 'liveRequest', 'reportData': data }
    this.passingdata = kydata;
    this.isOpen = show;
    if (!this.isOpen) {
      this.refreshPage();
    }
  }

  scheduleDelete(data){
    console.log(data)
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px', height: '180px', panelClass: 'pop-up-margin',
      data: {
        title: 'Confirmation',
        message: 'Do you want to delete?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        let id = data.id
        this.commonService.schedulePostDelete(id).subscribe(res => {
          this.scheduleRequest(this.selectedDate);
          this.toastr.success('Success', `${res.message}`);
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    });
  }
  fixClick() {
    console.log('')
  }  
}
