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
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
import { MY_FORMATS } from '../confirmation-dialog/confirmation-dialog.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {  CommonService } from '../../../services';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-manage-asset',
  templateUrl: './manage-asset.component.html',
  styleUrls: ['./manage-asset.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class ManageAssetComponent implements OnInit{
assetForm: FormGroup;
transferData= [];
bannerlabel= [];
istransferData =false;
type : string;
typeName: { [key: string]: string } = {'ATT-TR': 'Manage Transfer','ATT-TRT': 'Manage Transfer Return','ATT-SV': 'Manage  Service','ATT-SRT': 'Manage  Service Return','ATT-RT': 'Manage  Retire','ATT-LN': 'Manage  Loan','ATT-LRT': 'Manage Loan Return','ATT-BRD': 'Manage  BreakDown','ATT-BRR': 'Manage  Breakdown Return'};

constructor(
  private readonly fb: FormBuilder,
  @Inject(MAT_DIALOG_DATA) public data: any,
  private readonly dialogRef: MatDialogRef<ManageAssetComponent>,
  public toastr: AppToastService,
  private readonly dateFormat: DatePipe,
  public commonService : CommonService) {
  }

  ngOnInit(): void {
    this.type = this.typeName[this.data.assetInfo.assetTransferTypeId];
      this.buildForm();
    this.bannerlabel =[ 
      {'left': [{label: 'Asset  Serial Number', value: this.data.assetInfo.assetSerialNumber},
                {label: 'Asset Name', value: this.data.assetInfo.assetName}]},
      {'right': [{label: 'Asset Type', value: this.data.assetInfo.assetTypeName},
                 {label: 'Owner Department ', value: this.data.assetInfo.ownerDepartment}]}]
  }

  buildForm(): void {
    this.istransferData = false;
    const transferData = this.data.transferData;
    const firstEntry = transferData?.length ? transferData[0] : null;
    const secondEntry = transferData?.length > 1 ? transferData[1] : firstEntry;
    this.assetForm = this.fb.group({
      ownerDepartment: [firstEntry?.ownerDepartName ?? null],
      ownerName: [firstEntry?.ownerName ?? null],
      custodianDepartment: [firstEntry?.assignedDepartmentName ?? null],
      custodianName: [firstEntry?.assetUserName ?? null],
      transferFrom: [firstEntry?.transferFromName ?? null],
      transferTo: [firstEntry?.transferToName ?? null],
      transferInitiatedBy: [secondEntry?.initiatedUserName ?? null],
      initiatedTime: [this.dateFormat.transform(secondEntry?.initiatedTime, 'dd/MM/yyyy hh:mm:ss a') ?? null],
      transferAcknowledgedBy: [transferData?.length > 1 ? firstEntry?.acknowledgedUserName ?? null : null],
      acknowledgedTime: [transferData?.length > 1? this.dateFormat.transform(firstEntry?.acknowledgedTime, 'dd/MM/yyyy hh:mm:ss a') ?? null: null],
      comments: ['']
    });
    this.istransferData =true;
  }
  

  closeDialog() {
    this.data.assetdata['comments'] = this.assetForm.controls['comments'].value,
    this.data.assetdata['eventStatusId'] ='ATE-CAN'
    this.commonService.assetTransfer(this.data.assetdata).subscribe(
      (res) => {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      },
      (error) => {
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }

  saveComments(){
    this.data.assetdata['comments'] = this.assetForm.controls['comments'].value,
    this.commonService.assetTransfer(this.data.assetdata).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialogRef.close('confirm');
      }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
