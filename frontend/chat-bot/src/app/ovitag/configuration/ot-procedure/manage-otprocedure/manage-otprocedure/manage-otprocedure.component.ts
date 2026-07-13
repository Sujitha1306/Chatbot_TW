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
import { CommonService, ConfigurationService } from '../../../../../shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateOtProc, EditOtProc } from './../../../configuration.model';
import { AppToastService } from '../../../../../shared/services/toaster.service';
import { LookupTermService } from '../../../../../shared/lookup-term.service';


@Component({
  selector: 'app-manage-otprocedure',
  templateUrl: './manage-otprocedure.component.html',
  styleUrls: ['./manage-otprocedure.component.scss']
})
export class ManageOtprocedureComponent implements OnInit {
  public otProcedureForm: FormGroup;
  public createOtProc: CreateOtProc;
  public editOtProc: EditOtProc;
  public healthplan: any;
  public codeCategoryList: any=[];
  public codeTypeList: any=[];
  public specialtyList : any=[];
  userHit = false;
  public healthPlanEnabled = false;
  public healthPlanName: any;


  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: AppToastService, public configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<ManageOtprocedureComponent>, private readonly commonService: CommonService, private readonly lookupService: LookupTermService) { }

  ngOnInit(): void {
    this.buildForm()
    this.getBrokerType()
  }

  public buildForm() {
    this.otProcedureForm = this.form.group({
      healthPlanId: [this.data?.healthPlanId ? this.data.healthPlanName : null, [Validators.required]],
      name: [this.data?.name ? this.data.name : null],
      codeCategoryId: [this.data?.codeCategoryId ? this.data.codeCategoryId : null],
      specialtyId: [this.data?.specialtyId ? this.data.specialtyId : null],
      codeTypeId: [this.data?.codeTypeId ? this.data.codeTypeId : null],
      codeValue: [this.data?.codeValue ? this.data.codeValue : null],
      preparationSla: [this.data ? this.data.preparationSla : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      preparationSlaEnd: [this.data ? this.data.preparationSlaEnd : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      surgerySla: [this.data ? this.data.surgerySla : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]], 
      surgerySlaEnd: [this.data ? this.data.surgerySlaEnd : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      recoverySla: [this.data ? this.data.recoverySla : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      recoverySlaEnd: [this.data ? this.data.recoverySlaEnd : null,[Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      description: [this.data ? this.data.description : null],
    });
    this.healthPlanName = this.data?.healthPlanId ? this.data.healthPlanId : null
  }

  getSearchUser(event) {
    let searchText = event.text;
    if (searchText.length >= 2) {
      this.commonService.getOTHealthPlan('HP-OT', searchText).subscribe(res => {
        this.healthplan = res.results;
        this.healthPlanEnabled = true;
      });
    }
    else {
      this.healthplan = [];
    }
  }

  getBrokerType() {
    this.lookupService.getAppTermsWrapper('ProcedureCategory,ProcedureCodeType').subscribe(res => {
      this.codeCategoryList = res.ProcedureCategory ?? [];
      this.codeTypeList = res.ProcedureCodeType ?? [];
    });
    this.configurationService.getspecialty().subscribe(res => {this.specialtyList = res.results});
  } 


  getSurgeryList(id) {
    if (id) {
      const surgery = this as any as { id: string, name: string }[];
      return surgery.find(obj => obj.id === id)?.name;
    } else {
      return '';
    }
  }

  saveOtproc() {
    this.createOtProc = new CreateOtProc(null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createOtProc.healthPlanId = this.otProcedureForm.controls['healthPlanId'].value;
    if (this.healthPlanEnabled === false) {
      this.createOtProc.healthPlanId = this.data.healthPlanName;
    } else {
      this.createOtProc.healthPlanId = this.otProcedureForm.controls['healthPlanId'].value;
    }
    this.createOtProc.name = this.otProcedureForm.controls['name'].value;
    this.createOtProc.codeCategoryId = this.otProcedureForm.controls['codeCategoryId'].value;
    this.createOtProc.specialtyId = this.otProcedureForm.controls['specialtyId'].value;
    this.createOtProc.codeTypeId = this.otProcedureForm.controls['codeTypeId'].value;
    this.createOtProc.codeValue = this.otProcedureForm.controls['codeValue'].value;
    this.createOtProc.preparationSla = this.otProcedureForm.controls['preparationSla'].value;
    this.createOtProc.preparationSlaEnd = this.otProcedureForm.controls['preparationSlaEnd'].value;
    this.createOtProc.surgerySla = this.otProcedureForm.controls['surgerySla'].value;
    this.createOtProc.surgerySlaEnd = this.otProcedureForm.controls['surgerySlaEnd'].value;
    this.createOtProc.recoverySla = this.otProcedureForm.controls['recoverySla'].value;
    this.createOtProc.recoverySlaEnd = this.otProcedureForm.controls['recoverySlaEnd'].value;
    this.createOtProc.description = this.otProcedureForm.controls['description'].value;
    this.configurationService.saveOtProcedure(this.createOtProc).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateOtproc() {
    this.editOtProc = new EditOtProc(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editOtProc.id = this.data.id
    this.editOtProc.healthPlanId = this.otProcedureForm.controls['healthPlanId'].value;
    if (this.healthPlanEnabled === false) {
      this.editOtProc.healthPlanId = this.healthPlanName;
    } else {
      this.editOtProc.healthPlanId = this.otProcedureForm.controls['healthPlanId'].value;
    }
    this.editOtProc.name = this.otProcedureForm.controls['name'].value;
    this.editOtProc.codeCategoryId = this.otProcedureForm.controls['codeCategoryId'].value;
    this.editOtProc.specialtyId = this.otProcedureForm.controls['specialtyId'].value;
    this.editOtProc.codeTypeId = this.otProcedureForm.controls['codeTypeId'].value;
    this.editOtProc.codeValue = this.otProcedureForm.controls['codeValue'].value;
    this.editOtProc.preparationSla = this.otProcedureForm.controls['preparationSla'].value;
    this.editOtProc.preparationSlaEnd = this.otProcedureForm.controls['preparationSlaEnd'].value;
    this.editOtProc.surgerySla = this.otProcedureForm.controls['surgerySla'].value;
    this.editOtProc.surgerySlaEnd = this.otProcedureForm.controls['surgerySlaEnd'].value;
    this.editOtProc.recoverySla = this.otProcedureForm.controls['recoverySla'].value;
    this.editOtProc.recoverySlaEnd = this.otProcedureForm.controls['recoverySlaEnd'].value;
    this.editOtProc.description = this.otProcedureForm.controls['description'].value; 
    this.configurationService.updatOtProcedure(this.editOtProc).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  validateHealthPlan() {
    const control = this.otProcedureForm.get('healthPlanId');
    if (!control) return;
    const healthPlanValue = control.value;
    const isValid = this.healthplan?.some(item => item?.id === healthPlanValue);
    if (!isValid && this.data?.healthPlanName) {
      control.setValue(this.data?.healthPlanName);
    } else if (!isValid && !this.data?.healthPlanName) {
      control.setValue(null);
    }
  }
  
}

