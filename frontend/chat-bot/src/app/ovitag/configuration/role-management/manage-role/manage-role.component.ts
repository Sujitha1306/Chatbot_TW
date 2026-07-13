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
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonService, ConfigurationService, HospitalService } from '../../../../shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateRole } from '../../configuration.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppToastService } from '../../../../shared/services/toaster.service';

export function existingRoleCode(configurationServices: ConfigurationService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length <= 4) {
      return of(null);
    }

    return configurationServices.getRoleCode(control.value).pipe(
      map((res: any) => {
        return res?.message === "Role code already exists" ? { isAlreadyExists: res.message }  : null; }),
      catchError((error) => {
        console.log('API Error:', error);
        if (error.error?.message === "Role code already exists") {
          return of({ isAlreadyExists: true });
        }
        return of(null); 
      })
    );
  };
}
@Component({
  selector: 'app-manage-role',
  templateUrl: './manage-role.component.html',
  styleUrls: ['./manage-role.component.scss']
})
export class ManageRoleComponent implements OnInit {
 public roleForm: FormGroup;

constructor(public form: FormBuilder,private readonly fb: FormBuilder,private readonly configurationServices: ConfigurationService,public thisDialogRef: MatDialogRef<ManageRoleComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any, public commonService : CommonService, public   hospitalServices: HospitalService,public toastr: AppToastService, ) {}
  
    ngOnInit() {
      this.buildForm()
    }


    public buildForm() {
      this.roleForm = this.form.group({
        code: [this.data?.code ? this.data?.code : null, [Validators.required],this.data?.code == null ?[existingRoleCode(this.configurationServices)]:null],
        name: [this.data?.name ? this.data?.name : null, [Validators.required]],
        status: [this.data?.status ? this.data?.status : 'Active',]
      });
    }

  saveRole() {
    const createRole = new CreateRole(null, null,null,null);
    createRole.code = this.roleForm.controls['code'].value;
    createRole.name = this.roleForm.controls['name'].value;
    createRole.status = this.roleForm.controls['status'].value; 
    createRole.id = this.data?.id ?? null;
    this.configurationServices.saveRole([createRole]).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
}
