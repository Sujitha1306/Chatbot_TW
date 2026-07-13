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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateTaskEasyPick } from './pwa-taskdetails.model';
import { CommonService, ConfigurationService } from '../../../shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-pwa-taskdetails',
  templateUrl: './pwa-taskdetails.component.html',
  styleUrls: ['./pwa-taskdetails.component.scss']
})
export class PWATaskdetailsComponent implements OnInit {
  taskDetailsform: FormGroup;
  today = new Date(); 
  public createTaskEasyPick: CreateTaskEasyPick;
  taskInchargeTypeList=[{code:'RT-RO',value:'Role'},{code:'RT-US',value:'User'}];
  taskUser:any;
  userNameList:any;
  userEnabled=false;
  userHit = false;
  userDetails=[];
  dataset:any={}
  activityData:any;
  toHit = false;
  taskLocationId:any;
  taskLocationEnabled:any;
  taskLocationList=[];
  taskLocationListRes=[];
  easyPickLocId:any;
  toHit1 = false;
  taskActivityId:any;
  taskActivityEnabled:any;
  taskActivityList=[];
  taskActivityListRes=[];
  easyPickActId:any;




  constructor(private readonly fb: FormBuilder, private readonly dateFormat: DatePipe,  private readonly commonService: CommonService,public configurationServices: ConfigurationService,public thisDialogRef: MatDialogRef<PWATaskdetailsComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
  public toastr: AppToastService, public snackBar: MatSnackBar) { this.buildForm()}

  ngOnInit(): void {
    this.getActivityDetails()
  }
  getActivityDetails() {
    let actId = this.data.activityId;
    if(actId) {
      this.configurationServices.getActivitiesById(actId).subscribe(res=>{
        if(res.statusCode == 1) {
          this. activityData = res.results[0];
          this.dataset = { ...this.data, ...this.activityData};
          this.buildForm()
        }
      })
    } else {
      this.buildForm()
    }
  }
  buildForm(){
    this.taskDetailsform = this.fb.group({
      activity: [this.dataset.activityName ? this.dataset.activityName : null],
      location: [this.dataset.locationName ? this.dataset.locationName : null],
      time: [this.dateFormat.transform(this.today, 'yyyy-MM-ddTHH:mm') ],
      description: [null],
      remarks: [''],
      taskInchargeType:[this.dataset? this.dataset.inchargeType:null,[Validators.required]],
      taskInchargeValue:[this.dataset? this.dataset.inchargeName:null,[Validators.required]]
    });
  }
  getAssignedType(type) {
    this.taskUser = null;
    this.userNameList=[]
    this.taskDetailsform.controls['taskInchargeType'].setValue(type);
    this.taskDetailsform.controls['taskInchargeValue'].setValue(null);
    if (type === 'RT-RO') {
      this.configurationServices.getRecipientName('', type, null, 'ROU-TSK').subscribe(res => {
        this.taskUser = res.results;
        this.userNameList = this.taskUser
        this.userEnabled = true;
      });
    } else {
      this.userNameList = [];
      this.userEnabled = false;
    }
  }

  getSearchUser(event) {
    let type =this.taskDetailsform.controls['taskInchargeType'].value;
    if (event.text.length >= 2 && type === 'RT-US') {
      if (event.toHit === true && type === 'RT-US') {
        this.configurationServices.getRoutineRecipientName(event.text, type, false).subscribe(res => {
          this.taskUser = res.results;
          this.userNameList = this.taskUser
          this.userEnabled = true;
        });
      } else {
        this.userNameList = this.taskUser
        this.userEnabled = true;
      }
    } else {
      const code = 'ROU-TSK';
      if (type === 'RT-RO') {
        this.configurationServices.getRecipientName('', type, null, code).subscribe(res => {
          this.taskUser = res.results;
          this.userNameList = this.taskUser
          this.userEnabled = true;
        });
      }
    }
  }

  getuserDetails(data, event) {
    this.userHit = true
    this.userDetails = this.userNameList.filter(x => x.id === event.value);
    this.userDetails.push({
      'id': data.id,
      'name': data.name,
      'tagTypeId': this.taskDetailsform.controls['taskInchargeType'].value,
    });
  }

  getUserList(id) {
    if (id) {
      const username = this as any as { id: string, name: string }[]
      const userId = username.find(obj => obj.id === id).name;
      return userId;
    } else {
      return '';
    }
  }

  searchTaskLocationList(event) {
    this.taskLocationId = null;
    this.taskLocationEnabled = true;
    this.toHit = event.toHit;
    if (event.type === 'taskLocation' && event.text.length >= 2) {
      this.taskLocationId = null;
      this.taskLocationEnabled = true;  
      if (this.toHit === true) {
        this.configurationServices.getLocationData(event.text).subscribe(res => {
          this.taskLocationListRes = res.results;
          this.taskLocationList = this.taskLocationListRes;
        });
      } else {
        this.taskLocationList = this.taskLocationListRes;
      }
    } else {
      this.easyPickLocId = true;
      this.taskLocationList = [];
      this.taskLocationEnabled = false;
    }
  }
  getTaskLocationID(locationID: any) {
   this.easyPickLocId = true;
   if(locationID != null){
     this.easyPickLocId = false;
     this.taskLocationId = locationID;
   }
  }

  getTaskLocationList(id) {
    if (id) {
      const taskLocation = this as any as { id: string, name: string, fullName: string }[]
      return taskLocation.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }
  searchActivityList(event){
    this.taskActivityId = null;
    this.taskActivityEnabled = true;
    this.toHit1 = event.toHit;
    if (event.type === 'taskActivity' && event.text.length >= 2) {
      this.taskActivityId = null;
      this.taskActivityEnabled = true;  
      if (this.toHit1 === true) {
        this.configurationServices.searchActivities(event.text,'activity','ROU-TSK').subscribe(res => {
          this.taskActivityListRes = res.results;
          this.taskActivityList = this.taskActivityListRes;
        });
      } else {
        this.taskActivityList = this.taskActivityListRes;
      }
    } else {
      this.easyPickActId = true;
      this.taskActivityList = [];
      this.taskActivityEnabled = false;
    }
  }
  getTaskActivityID(locationID: any) {
    this.easyPickActId = true;
    if(locationID != null){
      this.easyPickActId = false;
      this.taskActivityId = locationID;
    }
   }
 
   getTaskActivityList(id) {
     if (id) {
       const taskActivity = this as any as { id: string, name: string}[]
       return taskActivity.find(obj => obj.id === id).name;
     } else {
       return '';
     }
   }



  setDropTime(interval, value) {
    let defaultInterval = 15;
    if (interval != null) {
      defaultInterval = interval;
    } else {
      defaultInterval = this.taskDetailsform.controls['time'].value;
      this.today= new Date(value.target.value);
    }
    this.taskDetailsform.get('time').setValue(
      this.dateFormat.transform(new Date(this.today.getTime() + (defaultInterval * 60 * 1000)), 'yyyy-MM-ddTHH:mm')
    );
    this.taskDetailsform.get('time').updateValueAndValidity();
  }

  saveTaskDetails() {
    this.createTaskEasyPick = new CreateTaskEasyPick(null, null, null, null, null, null,null,null,null,null);
    this.createTaskEasyPick.description = this.taskDetailsform.controls['description'].value;
    this.createTaskEasyPick.remarks = this.taskDetailsform.controls['remarks'].value;
    this.createTaskEasyPick.time = this.dateFormat.transform(this.taskDetailsform.controls['time'].value, 'yyyy-MM-dd HH:mm:ss');
    if (this.toHit === false) {
      this.createTaskEasyPick.destinationId = this.data.locationId;
    } else {
      this.createTaskEasyPick.destinationId = this.taskLocationId;
    }
    if (this.toHit1 === false) {
      this.createTaskEasyPick.pfActivityId = this.dataset.activityId;
    } else {
      this.createTaskEasyPick.pfActivityId = this.taskActivityId;
    }
    this.createTaskEasyPick.isAutoAssigned = false
    this.createTaskEasyPick.isAutoComplete = false
    this.createTaskEasyPick.type = 'RQT-OT'
    this.createTaskEasyPick.requestCategory = null
    if (this.userHit === false){
    this.createTaskEasyPick.performer = [
      {
        type: this.taskDetailsform.controls['taskInchargeType'].value,
        id: this.dataset.inchargeId
      }
    ];}else{
      this.createTaskEasyPick.performer = [
        {
          type: this.taskDetailsform.controls['taskInchargeType'].value,
          id: this.taskDetailsform.controls['taskInchargeValue'].value
        }
      ];
    }
    this.commonService.saveTask(this.createTaskEasyPick).subscribe(res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            this.thisDialogRef.close('confirm');
          }
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`)
          });
  }
  fixClick() {
    console.log('')
  }  
}
