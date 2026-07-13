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

import { Component, OnInit, Inject, ViewChild, AfterViewInit} from '@angular/core';
import { FormGroup, FormBuilder, Validators,  FormArray} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { HospitalService } from '../../../services/hospital.service';
import {CommonService} from '../../../services/common.service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { AppToastService } from '../../../services/toaster.service';

@Component({
    selector: 'medical-record-dispatch',
    templateUrl: './medical-record-dispatch.component.html',
    styleUrls: ['./medical-record-dispatch.component.scss'],
  })

  
export class MedicalRecordDispatchComponent implements OnInit, AfterViewInit {
  public matcher = new ErrorStateMatcherService();
  public dispatchForm: FormGroup;
  volumeList: any= [];
  volumeCountExist = true;
  searchList: any=[];
  tagEnabled = false;
  tagOption: any=[];
  removeVolumeList: any=[];
  removedVolume: any=[];
  volumeOption: any=[];
  volumeDetail: any=[];
  files: any=[];
  dispatchedVolume: any=[];
  isDispatchDisable = false;
  receiveId = null;
  isReceiveAllDisable = false;
  id = null;
  public MRRequestStatus: any = [];
  public selectedMRRequestStatusList: any = [];
  public isMRReqStatusChange = false;
  public selectedMRReqStatus = null;

  @ViewChild('tagId') tagInput: MatInput;
  popHeight: any;
  contentHeight: number;

  constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<MedicalRecordDispatchComponent>,
    public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly hospitalService: HospitalService, 
    private readonly commonService: CommonService) {
  }

  ngAfterViewInit() {
    if (this.data.reqDetailStatusId !== 'MR-CAN') {
      setTimeout(() => {
        this.tagInput.focus();
      });
    }
    this.commonService.getAppTerms('MRRequestStatus').subscribe((res) => {
      this.MRRequestStatus = res.results;
      if (this.data.reqDetailStatusId === 'MR-REQ') {
        this.selectedMRRequestStatusList = this.MRRequestStatus.filter(rs => rs.code === 'MR-CAN' ||
        rs.code === this.data.reqDetailStatusId);
      }
      if (this.data.reqDetailStatusId === 'MR-CAN') {
        this.selectedMRRequestStatusList = this.MRRequestStatus.filter(rs => rs.code === 'MR-REQ' ||
        rs.code === this.data.reqDetailStatusId);
      }
    });
  }
  ngOnInit() {
    this.commonService.getAppTerms('MRRequestStatus').subscribe((res) => {
      this.MRRequestStatus = res.results;
    });
    if (this.data.reqDetailStatusId === 'MR-REQ') {
      if (this.data.maxVolume !== null) {
        this.dispatchedVolume.volume = this.data.maxVolume;
        this.filterVolumeOptions(this.data.maxVolume);
      }
    }
    this.getVolumeList();
    this.buildForm();
    this.getAllVolumeDetails();
    this.getVolumeCount()
  }
  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 130;
  }
  getAllVolumeDetails(){
    if(this.data.reqDetailStatusId !== 'MR-REQ') {
      this.commonService.getAllVolumeDetails(this.data.mrRequestId).subscribe((res) => {
        if(res.results !== null) {
          this.dispatchedVolume = res.results.files;
        } else {
          this.dispatchedVolume = [];
        }
        if(this.dispatchedVolume.length > 0) {
          this.removeVolume(0, null);
          for ( let i = 0; i < this.dispatchedVolume.length; i++) {
            this.dispatchedVolume.id = this.dispatchedVolume[i].id;
            this.dispatchedVolume.volume = this.dispatchedVolume[i].volume;
            this.dispatchedVolume.patientFileId = this.dispatchedVolume[i].patientFileId ;
            this.dispatchedVolume.tagId = this.dispatchedVolume[i].tagId;
            this.dispatchedVolume.tag = this.dispatchedVolume[i].tagId;
            const control = <FormArray>this.dispatchForm.controls['volumeList'];
            control.push(this.editVolume(i));
          }
        }
      });
    }
  }
  getVolumeList(){
    this.commonService.getVolume(this.data.patientId).subscribe((res) => {
      if (res.statusCode === 1) {
        this.volumeCountExist = false;
        this.volumeList = res.results;
      } else {
        this.volumeCountExist = true;
      }
      if(this.data.reqDetailStatusId === 'MR-REQ') {
        if(this.data.maxVolume !== null) {
          const id = this.volumeList.filter(res => res.volume == this.data.maxVolume);
          if (id.length !== 0) {
          this.getpatientFileId(id[0].patientFileId, 0);
          }
        }
      }
    });
  }
  buildForm() {
    this.dispatchForm = this.form.group({
      volumeCount: [this.data.maxVolume ? this.data.maxVolume : null, [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      volume: [null],
      patientFileId: [null],
      tagId: [null],
      tag: [null],
      status: [this.data.reqDetailStatusId ? this.data.reqDetailStatusId : null],
      volumeList: this.form.array([this.editVolume(0)]),
    });
  }
  addVolume() {
    const control = <FormArray>this.dispatchForm.controls['volumeList'];
    control.push(this.getVolume());
  }

  removeVolume(i: number, type) {
    if (this.data) {
      const locDetail = this.dispatchForm.controls['volumeList'].value[i].volume;
      const locIndex = this.removeVolumeList.findIndex(res => res.volume === locDetail);
      if (locIndex !== -1) {
        this.removeVolumeList[locIndex]['isDeletable'] = true;
        this.removedVolume.push({
          'volume': this.removeVolumeList[locIndex].volume,
          'tagId': this.removeVolumeList[locIndex].tagId,
          'patientFileId': this.removeVolumeList[locIndex].patientFileId,
          'isDeletable': true
        });
      }
    }
    if (this.dispatchForm.controls['volumeList'].value[i].hasOwnProperty('volume') &&
      this.dispatchForm.controls['volumeList'].value[i].volume !== null) {
      this.volumeOption = this.volumeOption.filter(x => this.dispatchForm.controls['volumeList'].value[i].volume.indexOf(x) === -1);
    }
    if (this.dispatchForm.controls['volumeList'].value[i].hasOwnProperty('tagId') &&
    this.dispatchForm.controls['volumeList'].value[i].tagId !== null) {
    this.tagOption = this.tagOption.filter(x => this.dispatchForm.controls['volumeList'].value[i].tagId.indexOf(x) === -1);
    }
    const control = <FormArray>this.dispatchForm.controls['volumeList'];
    control.removeAt(i);
    if (type == 'clear' && control.length <= 0) {
      this.addVolume();
    }
  }
  private getVolume() {
    return this.form.group({
      id: [null],
      volume: [null],
      patientFileId: [null],
      tagId: [null],
      tag: [null],
    });
  }

  private editVolume(i) {
    return this.form.group({
      id: [this.dispatchedVolume.id],
      volume: [this.dispatchedVolume.volume],
      patientFileId: [this.dispatchedVolume.patientFileId],
      tagId: [this.dispatchedVolume.tagId],
      tag: [this.dispatchedVolume.tag],

    });
  }

  statusChange(status) {
    this.selectedMRReqStatus = status;
    if (status === 'MR-REQ' || status === 'MR-CAN') {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'MR Request Status',
        message: 'Do you want to change the status?',
        buttonText: { cancel: 'No', ok: 'Yes' },
        MRReqStatusChange: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.isMRReqStatusChange = true;
      } else {
        this.isMRReqStatusChange = false;
        this.dispatchForm.get('status').setValue(this.data.reqDetailStatusId);
        this.dispatchForm.get('status').updateValueAndValidity();
      }
    });
  }

  }
  getVolumeCount(){
    this.volumeOption = [];
    const data = {
      "patientId": this.data.patientId,
      "volume": this.dispatchForm.controls['volumeCount'].value,
    }
    this.commonService.generateVolume(data).subscribe((res) => {
      if (res.statusCode === 1) {
        this.volumeCountExist = false;
        this.volumeList = res.results;
        this.data.maxVolume = this.dispatchForm.controls['volumeCount'].value;
        this.dispatchedVolume.volume = this.data.maxVolume;
        this.filterVolumeOptions(this.data.maxVolume);
        const id = this.volumeList.filter(res => res.volume == this.data.maxVolume);
        this.buildForm();
        if (id.length !== 0) {
          this.getpatientFileId(id[0].patientFileId, 0);
          }
      } else {
        this.volumeCountExist = true;
      }
    });
  }
  searchTag(event, i) {
    this.id = event.target.value;
    console.log("Start >>>>", this.id);
    if (this.id !== '' && this.id.length >= 3) {
      if (this.id.charAt(0) === 'S' || this.id.charAt(0) === 's') {
        console.log("Before Binding >>>>", this.id);
        this.id = this.id.substring(4);
        console.log("After Binding >>>>", this.id);
        let volumeListArrays = this.dispatchForm.get('volumeList') as FormArray;
        volumeListArrays.controls[i].patchValue({ "tagId": this.id });
        this.getTag(this.id, i)
      }
      if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32) {
        this.commonService.searchTagAssociate(this.id, 'TT-MR', 'ST-AT').subscribe(res => {
          if (res.statusCode !== 0) {
            this.searchList = res.results;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const list = this.searchList;
        this.searchList = list;
      } else {
        this.searchList = [];
      }
    } else {
      this.searchList = [];
    }
    console.log("End >>>>", this.id);
  }
  getTag(value, i){
    let volumeListArrays = this.dispatchForm.get('volumeList') as FormArray;
    volumeListArrays.controls[i].patchValue({ "tag": value });
    if (value !== null) {
      this.tagOption.push(value);
    } else {
      this.tagOption = [];
    }
  }
  checkVolume(value) {
    if (value !== null) {
      this.volumeCountExist = true;
    } else {
      this.volumeCountExist = false;
    }
  }
  getpatientFileId(value, i) {
    let volumeListArrays = this.dispatchForm.get('volumeList') as FormArray;
    volumeListArrays.controls[i].patchValue({ "patientFileId": value });
  }
  filterVolumeOptions(value) {
    if (value !== null) {
      this.volumeOption.push(value);
    } else {
      this.volumeOption = [];
    }
  }
  saveDispatch() {
    if (this.isMRReqStatusChange) {
      const MRReqStatusDetails = {'requestStatusId' : this.selectedMRReqStatus};
      this.commonService.MRReqStatusChange(MRReqStatusDetails, this.data.mrRequestId).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
          this.toastr.error('Error', `${error.error.message}`);
      });
      return;
    }
    this.isDispatchDisable = true;
    const volumeControl = <FormArray>this.dispatchForm.controls['volumeList'];
    for (let i = 0; i < volumeControl.length; i++) {
      if (this.dispatchForm.controls['volumeList'].value[i].volume != null) {
        this.volumeDetail.push({
          'patientFileId': this.dispatchForm.controls['volumeList'].value[i].patientFileId,
          'tagId': this.dispatchForm.controls['volumeList'].value[i].tagId,
          'volume': this.dispatchForm.controls['volumeList'].value[i].volume,
        });
      }
    }
    if (this.volumeDetail.length > 0) {
      this.files.push({
        'files': this.volumeDetail,
        'patientId': this.data.patientId,
        'requestId': this.data.mrRequestId,
      });
    }
    this.commonService.dispatchVolume(this.files[0]).subscribe((res) => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
    error => {
      if (error.error.errorCode === 'TWAPI0009') {
        this.checkMRTagDisassociate(error.error.message, JSON.parse(error.error.additionalInfo));
      } else {
        this.toastr.error('Error', `${error.error.message}`);
      }
    });
  }
  checkMRTagDisassociate(msg, MRTagDetails) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirm Re-association of Tag to New File',
        message: msg,
        buttonText: { cancel: 'No', ok: 'Yes' },
        MRTagDisassociate: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.isDispatchDisable = false;
      this.files = [];
      this.volumeDetail = [];
      if (result === 'Yes' && MRTagDetails != null) {
        const MRTag = [];
        const tagDisassociate = [
          {
            'patientFileId': MRTagDetails.tagAssociationId,
            'tagId': MRTagDetails.tagId,
            'volume': null,
          }
        ];

        MRTag.push({
          'files': tagDisassociate,
          'patientId': null,
          'requestId': null,
        });
        this.commonService.receiveVolume(MRTag[0]).subscribe((res) => {
          this.toastr.success('Success', `${res.message}`);
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    });
  }
  VolumeDisassociate(i) {
    this.receiveId = this.dispatchForm.controls['volumeList'].value[i].volume;
    if (this.dispatchForm.controls['volumeList'].value[i].volume != null) {
      this.volumeDetail.push({
        'patientFileId': this.dispatchForm.controls['volumeList'].value[i].patientFileId,
        'tagId': this.dispatchForm.controls['volumeList'].value[i].tagId,
        'volume': this.dispatchForm.controls['volumeList'].value[i].volume,
      });
    }
    if (this.volumeDetail.length > 0) {
      this.files.push({
        'files': this.volumeDetail,
        'patientId': this.data.patientId,
        'requestId': this.data.mrRequestId,
      });
    }
    this.commonService.receiveVolume(this.files[0]).subscribe((res) => {
      this.toastr.success('Success', `${res.message}`);
      const volumeControl = <FormArray>this.dispatchForm.controls['volumeList'];
      if (volumeControl.length === 1) {
        this.thisDialogRef.close('confirm');
      } else {
        this.getVolumeList();
        this.buildForm();
        this.getAllVolumeDetails();
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  disassociateAll() {
    this.isReceiveAllDisable = true;
    const volumeControl = <FormArray>this.dispatchForm.controls['volumeList'];
    for (let i = 0; i < volumeControl.length; i++) {
      if (this.dispatchForm.controls['volumeList'].value[i].volume != null) {
        this.volumeDetail.push({
          'patientFileId': this.dispatchForm.controls['volumeList'].value[i].patientFileId,
          'tagId': this.dispatchForm.controls['volumeList'].value[i].tagId,
          'volume': this.dispatchForm.controls['volumeList'].value[i].volume,
        });
      }
    }
    if (this.volumeDetail.length > 0) {
      this.files.push({
        'files': this.volumeDetail,
        'patientId': this.data.patientId,
        'requestId': this.data.mrRequestId,
      });
    }
    this.commonService.receiveVolume(this.files[0]).subscribe((res) => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  fixClick() {
    console.log('')
  }
}
