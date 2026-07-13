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

import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-create-department',
  templateUrl: './create-department.component.html',
  styleUrls: ['./create-department.component.scss']
})
export class CreateDepartmentComponent {
  public departInfoForm: FormGroup;
  departmentlist: any;
  selectedTabIndex = 0;
  selectedTab:any;
  mapData = null
  RoleList:any;
  existingDepartment:any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService : CommonService, public form: FormBuilder,public toastr: AppToastService,
              public CommonService: CommonService,public thisDialogRef: MatDialogRef<CreateDepartmentComponent>, private readonly lookupService: LookupTermService){}


  ngOnInit(){
    if(this.data){
      this.mapData = {
        statusId : 'TW-RSD',
        type: 'department', 
        data: this.data }
    }
    this.lookupService.getAppTermsWrapper('DepartmentType').subscribe(res => {
        this.departmentlist = res.DepartmentType ?? [];
    });
    
    this.CommonService.getRollList().subscribe(res=>this.RoleList = res.results);
    if(this.data?.id){
      this.CommonService.getDepartmentLink(this.data?.id).subscribe(res => {
        this.existingDepartment = res?.results
          ?.filter(item => item.isActive)
          ?.map(x => ({
            entityId: x.entityId,
            id: x.id
          })) || [];
        this.departInfoForm.controls.departmentLink.setValue(this.existingDepartment?.map(item => item.entityId))
      });
    }
     this.buildForm();
  }
  public buildForm() {
    this.departInfoForm = this.form.group({
      departmentName : [this.data ? this.data.name : null, [Validators.required]],
      sourceId : [this.data ? this.data.sourceId : null,],
      sourceType : [this.data ? this.data.sourceType : null],
      departmentType : [this.data ? this.data.departmentType : null],
      departmentLink:  [null]
    });
  }

  onTabChanged(event) {
    this.selectedTab = event.tab.textLabel;
    this.selectedTabIndex = event.index;
    if(this.selectedTabIndex === 1){
      if(this.data){
        this.mapData = {
          statusId : 'TW-RSD',
          type: 'department',
          data: this.data}
      }
    }
  }

  savePatient(){
    const selectedRoles = this.departInfoForm.controls.departmentLink.value || [];
    const departmentLink = this.buildDepartmentLink(
      [],
      selectedRoles
    );
      let createDepartment = {
        departmentType : this.departInfoForm.controls['departmentType'].value ? this.departInfoForm.controls['departmentType'].value : null,
        name : this.departInfoForm.controls['departmentName'].value ?  this.departInfoForm.controls['departmentName'].value  : null,
        sourceId : this.departInfoForm.controls['sourceId'].value ? this.departInfoForm.controls['sourceId'].value : null,
        sourceType : this.departInfoForm.controls['sourceType'].value ? this.departInfoForm.controls['sourceType'].value : null,
        departmentLink : departmentLink
      }
      this.commonService.saveDepartment(createDepartment).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      })
  }

  buildDepartmentLink(
    existingDepartment: any[] = [],
    selectedRoles: any[] = []
  ) {
    const map = new Map<number, any>();
    existingDepartment?.forEach(item => {
      map.set(item.entityId, {
        id: item.id,
        entityId: item.entityId,
        entityType: 'Role',
        qualifierType: 'QLF-ASG',
        isActive: selectedRoles.includes(item.entityId)
      });
    });
    selectedRoles?.forEach(item => {
      if (!map.has(item)) {
        map.set(item, {
          id: null,
          entityId: item,
          entityType: 'Role',
          qualifierType: 'QLF-ASG',
          isActive: true
        });
      }
    });
    return Array.from(map.values());
  }

  updatePatient(){
    const selectedRoles = this.departInfoForm.controls.departmentLink.value || [];
    const departmentLink = this.buildDepartmentLink(
      this.existingDepartment,
      selectedRoles
    );
    let departmentId = this.data.id;
      let updateDepartment = {
        departmentType : this.departInfoForm.controls['departmentType'].value ? this.departInfoForm.controls['departmentType'].value : null,
        name : this.departInfoForm.controls['departmentName'].value ?  this.departInfoForm.controls['departmentName'].value  : null,
        sourceId : this.departInfoForm.controls['sourceId'].value ? this.departInfoForm.controls['sourceId'].value : null,
        sourceType : this.departInfoForm.controls['sourceType'].value ? this.departInfoForm.controls['sourceType'].value : null,
        departmentLink : departmentLink
      }
      this.commonService.updateDepartment(updateDepartment, departmentId).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      })
  }
}
