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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateRoutine, EditRoutine } from '../workflow-management/workflow-management.model';
import { CreateRoutineActivityComponent } from '../create-routine-activity/create-routine-activity.component';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-create-routine-template',
  templateUrl: './create-routine-template.component.html',
  styleUrls: ['./create-routine-template.component.scss']
})
export class CreateRoutineTemplateComponent implements OnInit {
  public routineTemplateForm: FormGroup;
  public createRoutine: CreateRoutine
  public editRoutine: EditRoutine
  public isReminderFormValid: boolean = true;
  option1 = [{"name": "Edit", "type": "edit", "value": null}];
  moreOptions = this.option1;
  routineList: any;
  scheduleType: any;
  activityTableData: any[] = [];
  selectedContext = null;
  contextList: any;
  activtiyData: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly fb: FormBuilder, private readonly commonService: CommonService, 
    private readonly configurationService: ConfigurationService, public toastr: AppToastService, public dialogRef: MatDialogRef<any>,
    public dialog: MatDialog, private readonly lookupService: LookupTermService) {
      if(data.id){
        this.getRoutineTypeList(this.data.routineContextId);
        this.getScheduleType(this.data.routineTypeId);
      }
    }

  ngOnInit(): void {
    this.lookupService.getAppTermsWrapper('RoutineContext').subscribe(res => {
      this.contextList = res.RoutineContext ?? [];
    })
    if(this.data.id){
      this.getRoutineActivityList()
    }
    this.buildForm()
  }

  buildForm(){
    if(this.data.routineContextId) {
      this.selectedContext = this.data.routineContextId
    }
    this.routineTemplateForm = this.fb.group({
      routineTypeId: [this.data.routineTypeId ? this.data.routineTypeId : null,[Validators.required]],
      scheduleTypeId: [this.data.scheduleTypeId ? this.data.scheduleTypeId : null],
      routineId: [this.data.name ? this.data.name : null, [Validators.required]],
      description: [this.data.description ? this.data.description : null]
    })
  }
  
  getRoutineTypeList(event) {
    this.selectedContext = event;
    this.lookupService.getAppTermsLinkWrapper(event, 'RoutineType').subscribe(res => {
      this.routineList = res.RoutineType ?? [];
    })
  }

  getScheduleType(event){
    let type = event
    this.lookupService.getAppTermsLinkWrapper(type, 'ScheduleType').subscribe(res =>{
      this.scheduleType = res.ScheduleType ?? [];
    })
  }

  triggerAction(event){
    if(event.key == 'edit'){
      this.addActivity(event.data)
    }
  }

  getRoutineActivityList(){
    this.configurationService.getRoutineActivities(this.data.id).subscribe(res =>{
      if(res.statusCode === 1){
        this.activtiyData = res.results[0]
        this.activityTableData = this.activtiyData.activities
      }
    })
  }

  addActivity(data?) {
      if(data.activityIdentifyingId){
        data['id'] = data.activityIdentifyingId
      }
      let routineInfo = {
        routineType: this.routineTemplateForm.controls['routineTypeId'].value,
        type: this.data.id ? 'modify' : 'create',
        contextType: this.selectedContext,
        activityData: data === '' ? null : data,
        scheduleType: this.routineTemplateForm.controls['scheduleTypeId'].value,
        routineId: this.data && this.data.id ? this.data.id : null,
        routineStartDate: null,
        routineEndDate: null,
        RType: 'template'
      }
      const dialogRef = this.dialog.open(CreateRoutineActivityComponent,
        { data: routineInfo, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(res => {
        if (res === 'confirm') {
          this.getRoutineActivityList()
        }
      });
    }

  saveRoutineTemplate() {
    this.createRoutine = new CreateRoutine(null, null, null, null, null, null);
    this.createRoutine.routineTypeId = this.routineTemplateForm.controls['routineTypeId'].value;
    this.createRoutine.name = this.routineTemplateForm.controls['routineId'].value;
    this.createRoutine.routineContextId = this.selectedContext;
    this.createRoutine.description = this.routineTemplateForm.controls['description'].value;
    this.createRoutine.scheduleTypeId = this.routineTemplateForm.controls['scheduleTypeId'].value;
    this.configurationService.saveRoutine(this.createRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.data = res.results;
        this.buildForm();
        this.toastr.success('Success', `${res.message}`);
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateRoutineTemplate() {
    this.editRoutine = new EditRoutine(null,null,null,null,null,null)
    this.editRoutine.name = this.routineTemplateForm.controls['routineId'].value;
    this.editRoutine.routineContextId = this.selectedContext;
    this.editRoutine.description = this.routineTemplateForm.controls['description'].value;
    this.editRoutine.scheduleTypeId = this.routineTemplateForm.controls['scheduleTypeId'].value;
    this.editRoutine.routineTypeId = this.routineTemplateForm.controls['routineTypeId'].value;
    this.configurationService.updateRoutine(this.data.id, this.editRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
}
