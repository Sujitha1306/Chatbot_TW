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

import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { CreateDeliveryRequest } from './delivery-req-management.model';
import { DatePipe } from '@angular/common';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { AppToastService } from '../../../services/toaster.service';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-delivery-req-management',
  templateUrl: './delivery-req-management.component.html',
  styleUrls: ['./delivery-req-management.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None
})
export class DeliveryReqManagementComponent implements OnInit {
  public deliveryForm: FormGroup;
  public createRequest: CreateDeliveryRequest;
  DeliveryType: any[]
  userId = parseInt(localStorage.getItem('dXNlcklk'));
  loginDepartment = parseInt(localStorage.getItem('ZGVwYXJ0bWVudElk'));
  reqData: any;
  itemMasterHit: any;
  itemList: any[];
  itemInfo: any[];
  itemEnabled: boolean = false;
  selectedItemId = null;
  departmentList: any;
  activate_btn: any[];
  batchList: any[];
  availableBal = null;

  constructor(public fb: FormBuilder, public toastr: AppToastService, @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService, private readonly workflowService: WorkflowService, public thisDialogRef: MatDialogRef<DeliveryReqManagementComponent>, private readonly dateFormat: DatePipe,) {
      this.activate_btn = this.commonService.getActivePermission('button');
     }

  ngOnInit(): void {
    this.getDepartment()
    this.buildForm();
    this.commonService.getAppTerms('DeliveryStatus').subscribe(res => {
      if(this.activate_btn.includes('BT_STMA')){
        this.DeliveryType = res.results.filter(resFilter => resFilter.groupName === 'DeliveryStatus');
      } else if(this.data.intendData) {
        this.DeliveryType = res.results.filter(resFilter => resFilter.groupName === 'DeliveryStatus');
      } else {
        this.DeliveryType = res.results.filter(resFilter => resFilter.code === 'DLS-PEN');
      }
    });
    if(this.data.intendData && this.data.intendData.id){
      this.getDeliveryById()
    }
    if(this.data.intendData === null){
      if(this.data.type === 'item'){
        this.setItemsData()
      }
    } 
  }

  getDepartment(){
    this.configurationService.getAssetDepartment().subscribe(res => {
      let department = res.results;
      if (this.loginDepartment && !this.activate_btn.includes('BT_STMA')) {
        this.departmentList = department.filter(filt => filt.id === this.loginDepartment);
      } else {
        this.departmentList = department;
      }
    });
  }

  getDeliveryById(){
    this.workflowService.getAllDelivery(null,null, this.data.intendData.id).subscribe(res =>{
      this.reqData = res.results[0];
      if(this.reqData && this.reqData.deliveryDetails[0].itemMasterId){
        let itemName = this.reqData.deliveryDetails[0].itemMasterName;
        this.workflowService.getAllIterm(null, itemName).subscribe(res => {
          this.itemInfo = res.results.filter(val => val.id == this.reqData.deliveryDetails[0].itemMasterId);
          this.selectedItemId = this.itemInfo[0].id;
          let selectedBatchId = this.reqData.deliveryDetails[0].batchId;
          this.getItemId(this.selectedItemId, selectedBatchId);
          this.deliveryForm.controls.itemMasterId.updateValueAndValidity();
        })
      }
      this.buildForm()
    })
  }

  setItemsData(){
    let itemName = this.data.itemData.name;
    this.workflowService.getAllIterm(null, itemName).subscribe(res => {
      this.itemInfo = res.results.filter(val => val.id == this.data.itemData.id);
      this.selectedItemId = this.itemInfo[0].id;
      this.getItemId(this.selectedItemId, null);
      this.deliveryForm.get('itemMasterId').setValue(itemName);
      this.deliveryForm.controls.itemMasterId.updateValueAndValidity();
    })
  }

  buildForm() {
    this.deliveryForm = this.fb.group({
      itemMasterId: [this.reqData && this.reqData.deliveryDetails[0].itemMasterId ? this.reqData.deliveryDetails[0].itemMasterName : null, this.validateItemSelection.bind(this)],
      departmentId: [this.reqData && this.reqData.requestUserDepartmentId ? this.reqData.requestUserDepartmentId : this.loginDepartment],
      requestedQuantity: [this.reqData && this.reqData.deliveryDetails[0].requestedQuantity ?  this.reqData.deliveryDetails[0].requestedQuantity : null, Validators.pattern(/^[1-9][0-9]*$/)],
      allocatedQuantity: [this.reqData && this.reqData.deliveryDetails[0].allocatedQuantity ?  this.reqData.deliveryDetails[0].allocatedQuantity : null, this.validateAllocatedQuantity.bind(this)],
      batchId: [this.reqData && this.reqData.deliveryDetails[0].batchId ? this.reqData.deliveryDetails[0].batchId : null],
      expectedDate: [this.reqData && this.reqData.deliveryDetails[0].deliveredDatetime ?  this.dateFormat.transform(this.reqData.deliveryDetails[0].deliveredDatetime, 'yyyy-MM-dd') : null],
      deliveryStatusId: [this.reqData && this.reqData.deliveryStatusId ? this.reqData.deliveryStatusId : 'DLS-PEN'],
      comments: [this.reqData && this.reqData.comments ? this.reqData.comments : null],
    });
  }

  private validateItemSelection(control: FormControl): { [key: string]: any } | null {
    this.selectedItemId = control.value;
    if (control.value) {
      if (!this.selectedItemId || !this.itemInfo || this.itemInfo.length === 0) {
        return { 'invalidItemSelection': true };
      }
      let selectedItem = this.itemInfo.find(item => item.id == this.selectedItemId);
      if (this.reqData && selectedItem === undefined) {
        selectedItem = this.itemInfo.find(item => item.name === this.selectedItemId);
      } else if(this.data.itemData && selectedItem === undefined){
        selectedItem = this.itemInfo.find(item => item.name === this.selectedItemId);
      }
      if (control.value !== null && selectedItem === undefined) {
        return { 'invalidItemSelection': true };
      }
    }
    return null;
  }

  validateAllocatedQuantity(control: AbstractControl) {
    const requestedQuantity = this.deliveryForm?.controls['requestedQuantity'].value;
    const allocatedQuantity = control.value;
    const value = Number(allocatedQuantity);
    if (!isNaN(value) && value <= 0) {
      return { nonPositive: true };
    }
    if (this.availableBal !== null && allocatedQuantity !== null) {
      if (allocatedQuantity > this.availableBal) {
        return { allocatedExceedsAvailable: true };
      }
    }
    if (requestedQuantity !== null && allocatedQuantity !== null) {
      if (allocatedQuantity > requestedQuantity) {
        return { allocatedExceedsRequested: true };
      }
    }
    return null;
  }

  getItemName(id) {
    if (id) {
      const itemName = this as any as { id: string, name: string }[]
      const itemId = itemName.find(obj => obj.id === id).name;
      return itemId;
    } else {
      return '';
    }
  }

  getItemSelection(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.itemMasterHit = event.toHit;
        this.workflowService.getAllIterm(null, event.text).subscribe(res => {
          this.itemList = res.results;
          this.itemInfo = this.itemList;
          this.itemEnabled = true;
        })
      } else {
        this.itemInfo = this.itemList
        this.itemEnabled = true;
      }
    } else {
      this.itemList = [];
      this.itemEnabled = false;
    }
  }

  getItemId(id, batchId){
    this.commonService.getBatchId(id).subscribe(res => {
      this.batchList = [];
      this.batchList = res.results;
      if(batchId){
        let selectedBatch = this.batchList.find(item => item.batchId === batchId);
        this.getBalanceStock(selectedBatch.balanceQuantity);
      }
    })
  }

  getBalanceStock(bal){
    this.availableBal = null;
    this.availableBal = bal;
  }

  updateindentQuantity(change: number, type): void {
    let control: any
    if(type === 'Requested') {
      control = this.deliveryForm.get('requestedQuantity');
    } else {
      control = this.deliveryForm.get('allocatedQuantity');
    }
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 1) return;
    control?.setValue(updated);
  }

  createDeliveryRequest() {
    let itemMasterId = null
    if(this.data.type === 'item'){
      itemMasterId = this.itemInfo[0].id
    } else {
      itemMasterId = this.deliveryForm.controls['itemMasterId'].value
    }
    this.createRequest = new CreateDeliveryRequest(null, null, null, null, null, null, null);
    this.createRequest.requestUserDepartmentId = this.deliveryForm.controls['departmentId'].value;
    this.createRequest.comments = this.deliveryForm.controls['comments'].value;
    this.createRequest.deliveryStatusId = this.deliveryForm.controls['deliveryStatusId'].value;
    this.createRequest.requestedByUserId = this.userId
    this.createRequest.deliveryDetails = [{
      allocatedQuantity: this.deliveryForm.controls['allocatedQuantity'].value,
      deliveredDatetime:  this.dateFormat.transform(this.deliveryForm.controls['expectedDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      itemMasterId: itemMasterId,
      batchId: this.deliveryForm.controls['batchId'].value,
      requestedQuantity: this.deliveryForm.controls['requestedQuantity'].value,
      status: true
    }]
    this.createRequest.approvedByUserId = null;
    this.createRequest.status = true;
    this.commonService.createRequestDelivery(this.createRequest).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close();
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  modifyDeliveryRequest() {
    let itemMasterId = null
    this.createRequest = new CreateDeliveryRequest(null, null, null, null, null, null, null);
    if(this.itemMasterHit){
      itemMasterId = this.deliveryForm.controls['itemMasterId'].value
    } else {
      itemMasterId = this.reqData.deliveryDetails[0].itemMasterId;
    }
    this.createRequest.requestUserDepartmentId = this.deliveryForm.controls['departmentId'].value;
    this.createRequest.comments = this.deliveryForm.controls['comments'].value;
    this.createRequest.deliveryStatusId = this.deliveryForm.controls['deliveryStatusId'].value;
    this.createRequest.requestedByUserId = this.userId
    this.createRequest.deliveryDetails = [{
      id: this.data.intendData.deliveryDetails[0].id,
      allocatedQuantity: this.deliveryForm.controls['allocatedQuantity'].value,
      deliveredDatetime: this.dateFormat.transform(this.deliveryForm.controls['expectedDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      batchId: this.deliveryForm.controls['batchId'].value,
      itemMasterId: itemMasterId,
      requestedQuantity: this.deliveryForm.controls['requestedQuantity'].value,
      status: true
    }]
    this.createRequest.approvedByUserId = null;
    this.createRequest.status = true;
    this.commonService.modifyRequestDelivery(this.data.intendData.id, this.createRequest).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close();
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
  
}
