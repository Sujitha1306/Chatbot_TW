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
import { Component, OnInit,  Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { CommonService, ConfigurationService } from "../../../services";
import { AppToastService } from "../../../services/toaster.service";

@Component({
  selector: "app-acknowledgement",
  templateUrl: "./acknowledgement.component.html",
  styleUrls: ["./acknowledgement.component.scss"],
})

export class AcknowledgementComponent implements OnInit {
    public ackForm: any = FormGroup;
    assignValueEnabled = false;
    assignValueList: any=[];
    toHit = false;
    assignValue = null;
    assignValueListRes: any=[];
    requireAssignValueMatchVal: any=[];
    selectedIndex = 0;
    assignTypeList: any=[];
    
    constructor(
      public dialog: MatDialog,
      public thisDialogRef: MatDialogRef<AcknowledgementComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,  
      public fb: FormBuilder,
      public commonService: CommonService, 
      private readonly configurationService: ConfigurationService,
      public toastr: AppToastService
    ) {
      this.commonService.getAppTerms('RoutineType,RecipientType,Gender,Status,HazardType').subscribe(res => {
        const list = res.results.filter(resFilter => resFilter.groupName === 'RecipientType');
        this.assignTypeList = list.filter(x => x.code === 'RT-US' || x.code === 'RT-RO' )
      });
    }
  
    ngOnInit() {
      this.buildForm();
    }

    public buildForm() {
      this.ackForm = this.fb.group({
        comments: [null],
        assignType: ['RT-US'],
        assignValue: [null, this.requireAssignValueMatch.bind(this)],
      });
    }

    tabClick(event) {
      this.selectedIndex = event.index;
      this.ackForm.get('comments').setValue(null);
      if(event.index === 0) {
        this.ackForm.get('assignType').setValidators(null);
        this.ackForm.get('assignValue').setValidators(null);
      } else {
        this.ackForm.get('assignType').setValidators(Validators.required);
        this.ackForm.get('assignValue').setValidators(Validators.required);
      }
    }
    getId(data) {
      if(data !== null) {
        this.assignValue = data.id;
      }
    }
    getAssignType(type) {
      this.assignValue = null;
      this.ackForm.controls['assignValue'].setValue(null);
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.assignValueList = res.results;
          this.assignValueEnabled = true;
        });
      } else {
        this.assignValueList = [];
        this.assignValueEnabled = false;
      }
    }
    searchList(event) {
      this.toHit = event.toHit;
      this.assignValue = null;
      const type = this.ackForm.controls['assignType'].value;
      if (event.text.length >= 2 && type === 'RT-US') {
        if (this.toHit == true && type === 'RT-US') {
          this.configurationService.getRecipientName(event.text, type).subscribe(res => {
            this.assignValueListRes = res.results;
            this.assignValueList = this.assignValueListRes;
            this.assignValueEnabled = true;
          });
        } else {
          this.assignValueList = this.assignValueListRes;
          this.assignValueEnabled = true;
        }
      } else {
        if (type === 'RT-RO') {
          this.configurationService.getRecipientName('', type).subscribe(res => {
            this.assignValueList = res.results;
            this.assignValueEnabled = true;
          });
        }
      }
    }

    getAssignValueList(id) {
      if (id) {
        const assignValue = this as any as { id: string, name: string }[]
        const assignValueId = assignValue.find(obj => obj.id === id).name;
        return assignValueId;
      } else {
        return '';
      }
    }
    private requireAssignValueMatch(control: FormControl): ValidationErrors | null {
      if (this.assignValue == null) {
        if(control.value !== null && control.value !== '') {
          this.requireAssignValueMatchVal = this.assignValueList.filter(resFilter => resFilter.id === control.value);
          if (this.requireAssignValueMatchVal.length === 0) {
            return { requireMatch: true };
          }
        }
        return null;
      }
    }

    saveAck(data) {
      let alertId = null;
        if(data.hasOwnProperty('iotAlertId')) {
          alertId = data.iotAlertId;
        } else {
          alertId = data.id;
        }
        if(this.selectedIndex === 0) {
          let ackAlertDetail = [{
            'comments': this.ackForm.controls['comments'].value,
            'ackUserId': parseInt(localStorage.getItem(btoa('userId'))),
            'id': alertId,
            'isAck' : true
          }];
          this.commonService.ackAlertById(ackAlertDetail).subscribe(resAlert => {
            if (resAlert.statusCode === 1) {
              this.toastr.success('Success', `${resAlert.message}`);
              this.thisDialogRef.close('confirm');
              this.commonService.stopAudio();
            }
          },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
        } else {
          if(this.assignValue) {
          let assignAlertDetail = {
            "alertId": alertId,
            "comments": this.ackForm.controls['comments'].value,
            "identifyingId": this.assignValue,
            "identifyingType": this.ackForm.controls['assignType'].value,
            "patientId": data.patientId
          };  
          this.commonService.assignAlertById(assignAlertDetail).subscribe(resAlert => {
            if (resAlert.statusCode === 1) {
              this.toastr.success('Success', `${resAlert.message}`);
              this.thisDialogRef.close('confirm');
            }
          },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });          
        } else {
          this.toastr.warning('Warning', `${'Please select the user for assign the task.'}`);
        }
        }
      }
  fixClick() {
    console.log('')
  }
    }
