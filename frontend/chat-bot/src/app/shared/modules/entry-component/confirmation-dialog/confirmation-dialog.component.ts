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
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators,  ValidatorFn } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard.service';
import { HospitalService } from '../../../services/hospital.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { CommonService } from '../../../services';
import { environment } from '../../../../../environments/environment';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { timer } from 'rxjs';
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
  selector: 'confirmation-dialog',
  templateUrl: 'confirmation-dialog.html',
  styleUrls: ['./confirmation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ConfirmationDialog implements OnInit {
  message = 'Are you sure?';
  confirmButtonText = 'Yes';
  ackButtonText = 'Ack';
  cancelButtonText = 'Cancel';
  floorList: any;
  floorId = null;
  customMsg = false;
  public isDisabled = false;
  public matcher = new ErrorStateMatcherService();
  public searchTestlist: any;
  public doctorList: any;
  public searchTestListItems = [];
  public selectedId: any;
  public selectedTesttype: any;
  public reasonList: any;
  hide = true;
  public today: any = new Date();
  public currentDate = this.datepipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
  public formTempNameEnable = false;
  public formTemplateName = null;
  public enableReason = false;
  currentUserId = localStorage.getItem(btoa('userId'));
  confirmForm: FormGroup;
  durationCode = null;
  durationValue = null;
  durationList: any=[];
  pwdExist = false;
  errorExist = false;
  infantEventTypeId = null;
  searchUserListItems: any=[];
  searchUserlist: any=[];
  schdeuleComment: any = [];
  userId = null;
  acknowledgedComments = '';
  ackUser = '';
  isPartiallyCompleted = false;
  isPharmacyOtp = false;
  isOtpSent = false;
  resentOtp = true;
  ackId = null;
  filteredUsers =[];
  ownerEnabled = false;
  userHit = false;
  isdisassociateLocation = false;
  info: any;
  loading: boolean = false;
  requestCancelReason = [];
  reqCancelReasonList = [];
  reqCancelReasonExist = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,public dialog: MatDialog,
    private readonly dialogRef: MatDialogRef<ConfirmationDialog>, private readonly fb: FormBuilder, public datepipe: DatePipe,
    private readonly configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly dashboardService: DashboardService, private readonly hospitalService: HospitalService, public toastr: AppToastService) {

    if (data) {
      this.message = data.message || this.message;
      this.data.assignFloor = data.assignFloor || false;
      this.data.isNewTestAdded = data.isNewTestAdded || false;
      this.data.updateDoctor = data.updateDoctor || false;
      this.floorId = data.floorId || this.floorId;
      this.formTempNameEnable = data.formTempNameEnable || false;
      if(this.formTempNameEnable){
        this.formTemplateName = data.formTempName || null;
      }
      if(data.hasOwnProperty('customMsg')) {
        this.customMsg = data.customMsg;
      }
      if(data.hasOwnProperty('isPartiallyCompleted')){
        this.isPartiallyCompleted = data['isPartiallyCompleted'];
      }
      if(data.hasOwnProperty('acknowledgedComments')){
        this.acknowledgedComments = data['acknowledgedComments'];
      }
      if(data.hasOwnProperty('ackUser')){
        this.ackUser = data['ackUser'];
      }
      if (data.buttonText) {
        this.confirmButtonText = data.buttonText.ok || this.confirmButtonText;
        this.cancelButtonText = data.buttonText.cancel || this.cancelButtonText;
      }
    }

    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.floorList = res.results.contentObject['assign-floor'];
      }
      if (this.data.floorId != null) {
        this.floorId = data.floorId;
      } else {
        if (this.floorList != null) {
          this.floorId = this.floorList[1].floorId;
        }
      }
      this.buildForm();
      if (this.data.hasOwnProperty('disengageAlarm') && this.data.disengageAlarm === true) {
        if(this.data.infantData && this.data.infantData.infantEventList.length !== 0) {
          const infanteventData = this.data.infantData.infantEventList.reverse()
          infanteventData.forEach(list => {
            if(list.eventTypeId === "IET-AT") {
              this.infantEventTypeId = list.eventTypeId;
              this.durationCode = list.identifyingType;
              this.durationValue = list.identifyingValue;
              this.confirmForm.controls['purpose'].setValue(list.comments);
              this.confirmForm.controls['duration'].setValue(list.identifyingType);
            } else if(list.eventTypeId === "IET-ATC") {
              this.infantEventTypeId = list.eventTypeId;
              this.durationCode = null;
              this.durationValue = null;
              this.confirmForm.controls['purpose'].setValue(null);
              this.confirmForm.controls['duration'].setValue(null);
            }
          })
        }
      }
    });
  }

  ngOnInit() {
    this.isPharmacyOtp = this.data?.isPharmacyOtp ?? this.data?.['isPharmacyOtp'] ?? false;
    this.isdisassociateLocation = this.data?.isdisassociateLocation? this.data?.isdisassociateLocation : false;
    if(this.data.hasOwnProperty('status') && this.data.status == 'RQ-CA') {
      this.getAppTermLink('RQT-PO', 'RequestCancelReason');    
    } else {
      this.reasonCode();
    }
    if (this.data.hasOwnProperty('disengageAlarm') && this.data.disengageAlarm === true) {
      this.commonService.getAppTermsVerion2('DurationMinutes').subscribe(res => {
        this.durationList = res.results;
      });
    }
    if (this.data.hasOwnProperty('scheduleCancelRequest') && this.data.scheduleCancelRequest === true) {
      this.commonService.getAppTerms('OTCancelReason').subscribe(res => {
        if (res.statusCode === 1) {
          this.schdeuleComment = res.results;
        }
      })
    }
    if(this.data.hasOwnProperty('porterReqStatusChange') && this.data.porterReqStatusChange === true) {
      if (this.commonService.userPreference?.hasOwnProperty('RequestCancelReason')) {
        this.requestCancelReason = JSON.parse(this.commonService.userPreference.RequestCancelReason.value);
        this.reqCancelReasonList = this.requestCancelReason;
      }
    }
    this.buildForm();
  }
  getAppTermLink(parentCode, groupName) {
    this.commonService.getAppTermsLink(parentCode).subscribe((res) => {
      if(res.statusCode == 1) {
        this.reasonList = res.results.filter(val => val.groupName == 'RequestCancelReason');    
        if(this.reasonList.length) {
          this.confirmForm.get('reasonCode').setValue(this.reasonList[0].code);
        }
        this.enableReason = true;                    
      }
    });
  }
  
  buildForm() {
    this.confirmForm = this.fb.group({
      comments: [this.acknowledgedComments],
      reasonCode: [null, [Validators.required]],
      confirmPwd: [null],
      floor: [this.floorId ? this.floorId : null],
      testId: [null, [Validators.required]],
      doctorId: [null, [Validators.required]],
      isPendingTest: [true],
      reviewDate:[null],
      formTempName:[null, [Validators.required]],
      duration: [null],
      purpose: [null],
      user: [null],
      ackUser: [this.ackUser, this.data?.pharmacyAck ? [Validators.required] : []],
      isPartiallyCompleted : [this.isPartiallyCompleted],
      userName: [null, [Validators.required]],
      mobileNo: [{ value: null, disabled: true }, [Validators.required,Validators.pattern('^[0-9]{10}$')]],
      otp: [null, [Validators.required, Validators.pattern('^[0-9]{6}$')]],  
      isdisassociateLocations:[false],
      scheduleCommentList:[null],
      scheduleCommentText: [null],
      testLocationId: [this.data?.testLocationId ? this.data?.testLocationId : null],
      testStatusId: [this.data?.defaultStatus ? this.data?.defaultStatus : null]
    },{ validator: this.formTempNameEnable?this.customValidate(this.formTemplateName):''});
    if(this.data.hasOwnProperty('resetPassword') && this.data.resetPassword) {
      this.confirmForm.controls.userName.setValue(this.data.userData.userName);
      this.confirmForm.controls.userName.disable();
    }
  } 
  customValidate(ftname:any): ValidatorFn{
    return (fg: FormGroup): { [key: string]: any } | null => {
      let error = null;
      if (fg.get('formTempName').value != null && fg.get('formTempName').value !== '') {
        let optionValue = fg.get('formTempName').value;
        if(ftname == optionValue){
          error = fg.controls['formTempName'].setErrors({ invalid: true });
        }
      }
      return error;
    }
  }
  reasonCode() {
    let groupName = 'ReasonCode';
    if(this.data.hasOwnProperty('discharge') && this.data.discharge == 1) {
      groupName = 'DischargeReason';
    }
    this.commonService.getAppTermsVerion2(groupName).subscribe(res => {
      if (res.statusCode === 1) {
        this.reasonList = res.results;
         if(groupName == 'DischargeReason' && (this.data.hasOwnProperty('visitType') && this.data.visitType == "VT-EC")) { 
          this.enableReason = true;
        } else {
          if (this.data.statusId === 'QS-NR' || this.data.statusId === 'QS-FL') {
            this.confirmForm.get('reasonCode').setValue(this.reasonList[0].code);
            this.confirmForm.get('reasonCode').updateValueAndValidity();
          }
        }
      }
    });
  }
  getAssociatedUser(event) {
    if(event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAssociatedUser('RO-PO', event.text).subscribe(res => {
          this.searchUserListItems = res.results;
          this.searchUserlist = this.searchUserListItems;
        });
      } else {
        this.searchUserlist = this.searchUserListItems;
      }
    } else {
      this.searchUserlist = [];
    }
  }
  searchToTestName(event) {
    if(event.type === 'testName' && event.text.length >= 2) {
      if (event.toHit == true) {
        let planTypeId = this.data.hasOwnProperty('planTypeId') ? this.data.planTypeId : null;
        this.commonService.getAllHeathTestWithoutAdminTest(event.text, planTypeId).subscribe(res => {
          this.searchTestListItems = res.results;
          this.searchTestlist = this.searchTestListItems;
        });
      } else {
        this.searchTestlist = this.searchTestListItems;
      }
    } else {
      this.searchTestlist = [];
    }
  }
  searchDoctor(event) {
    if(event.text.length >= 3){
      let roleType = 'RO-DO';
      this.commonService.searchDoctor(event.text, null, roleType).pipe(
        debounceTime(3000),
        distinctUntilChanged(),
      ).subscribe(res => {
        this.doctorList = res.results;
      });
    } else{
      this.doctorList = [];
    }
  }
  getUser(id) {
    this.userId = id;
  }
  addTestEvents(data) {
    this.selectedId = data.id;
    this.selectedTesttype = data.testType;
  }
  updateDoctor(data){
    this.selectedId  = data.id;
  }
  addReasonCode(data) {
    this.confirmForm.controls.reasonCode.setValue(data.code);
  }

  ackAlert(isAck) {
    let ackAlertDetail = [{
      'ackUserId': parseInt(localStorage.getItem(btoa('userId'))),
      'id': this.data.alertDetails.alertId,
    }];
    if(isAck) {
      ackAlertDetail[0]['isAck'] = true;
    } else {
      ackAlertDetail[0]['comments'] = this.confirmForm.controls['comments'].value;
    }
    this.commonService.ackAlertById(ackAlertDetail).subscribe(resAlert => {
      if (resAlert.statusCode === 1) {
        this.toastr.success('Success', `${resAlert.message}`);
        this.dialogRef.close('confirm');
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  getDuration(data) {
    this.durationCode = data.code;
    this.durationValue = data.value;
  }

  checkPassword() {
        const disengageAlarm = {
          'password': this.confirmForm.controls['confirmPwd'].value
        };
        this.commonService.basicLogin(disengageAlarm).subscribe(res => {
          this.errorExist = false;
          if (res.statusCode === 1) {
            this.pwdExist = true;
          } else {
            this.pwdExist = false;
            this.errorExist = true;
            this.confirmForm.controls['confirmPwd'].setValue(null);
          }
        },
          error => {
            this.errorExist = true;
            this.confirmForm.controls['confirmPwd'].setValue(null);
            this.toastr.error('Error', `${error.error.message}`);
          });
  }

  getRequestCancelReason(event) {
    this.reqCancelReasonExist = false;
    if (event.text.length >= 2) {
      this.reqCancelReasonList = this.requestCancelReason?.filter(x =>
        x.reason?.toLowerCase().includes(event?.text?.toLowerCase() || '')
      );
      if(this.reqCancelReasonList?.length === 0) {
        this.reqCancelReasonList = this.requestCancelReason;
      }
    } else {
      this.reqCancelReasonList = this.requestCancelReason;
    }
  }

  onUserSearch(event) {
    if (event.text.length >= 2 && event.toHit == true) {
      this.commonService.searchMobileUser(event.text, 'UNREGISTERED_USER').subscribe((res) => {
        this.filteredUsers = res.results.map(user => ({ 
          id: user.entityIdentifier, 
          name: user.entityName, 
          mobileNo: user.mobileNumber 
        }));
        this.ownerEnabled = true;
      });
    } else {
      this.filteredUsers =[];
      this.isOtpSent = false;
      this.userHit = false;
      this.ownerEnabled = false;
      this.confirmForm.reset();
    }
  }
  
  getOwnerList(id) {
    if (id) {
      const user = this.filteredUsers.find(obj => obj.id === id);
      return user ? user.name : '';
    }
    return '';
  }
  
  getOwnerDetails(user) {
    if (user) {
      this.confirmForm.controls['userName'].setValue(user.name); 
      this.confirmForm.controls['mobileNo'].setValue(user.mobileNo); 
      this.userHit = true;
    }
  }
  
  sentOtp() {
    this.isOtpSent = true;
    let name = this.confirmForm.controls.userName.value;
    let mobileNo = this.confirmForm.controls.mobileNo.value;
    let facilityId = localStorage.getItem(btoa('facilityId'));
  
    this.commonService.sentOtpPharamacy(name, mobileNo, facilityId).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.resentOtp = true; 
      timer(60000).subscribe(() => {
        this.resentOtp = false; // based 60 seconds we set the variable to enable 
      });
    });
  }

  RequestCancel() {
    if (this.data.hasOwnProperty('scheduleCancelRequest') && this.data.scheduleCancelRequest === true) {
      const scheduleList = this.confirmForm.controls['scheduleCommentList'].value;
      const commentText = this.confirmForm.controls['scheduleCommentText'].value;
      const commentsData = this.schdeuleComment.find(item => item.code === scheduleList);
      let cancelRequest = {
        "cancelReasonId": commentsData.code,
        "comments": commentsData.code !== 'OTCR-OT' ? commentsData.value : commentText,
        "patientVisitEventId": this.data.visitId
      }
      this.commonService.cancelPatientVist(cancelRequest).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', res.message);
        } else {
          this.toastr.error('Error', res.message);
        }
        this.dialogRef.close('confirm');
      });
    }
  }

  verifyOtp(){
    let otp = this.confirmForm.controls.otp.value;
    let mobileNo = this.confirmForm.controls.mobileNo.value;
    this.commonService.verifyOTP(otp, mobileNo).subscribe(res => {
      if (res.results.isOtpValid == true){
        this.toastr.success('Success', `${res.message}`);
        this.isPharmacyOtp = false;
        this.ackId = res.results.id;
      }else if (res.errorcode === 'TWAPI0005'){
        this.toastr.warning('Warning', `OTP Time Expired`);
        this.redirectPage();
      }else if (res.results.isOtpValid === false){
        this.toastr.error('Error', `Please enter a valid OTP`);
      }
    });  
  }

  redirectPage(){
    this.isPharmacyOtp = true;
    this.isOtpSent = false;
    this.userHit = false;
    this.confirmForm.reset();
  }
  closeDialog() {
    if (this.data.hasOwnProperty('AssetApprove') && this.data.AssetApprove === true) {
        let payload = {
          id                : this.data.assetdata.id,
          assetTransferType : this.data.assetdata.assetTransferType,
          comments          : this.confirmForm.controls['comments'].value,
          eventId           : this.data.assetdata.eventId,
          eventStatusId     : 'ATT-CAN',
          isExcludeParent   : this.data.assetdata.isExcludeParent,
          transferId        : this.data.assetdata.transferId,
          transferType      : this.data.assetdata.transferType,
          linkedAssets      : this.data.assetdata.linkedAssets
        }
        this.commonService.assetTransfer(payload).subscribe(
          (res) => {
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close('confirm');
          },
          (error) => {
            this.toastr.error('Error', `${error.error.message}`);
          }
        );
    } else {
      this.dialogRef.close('No');
    }
    
  }
  saveComments(type?: string) {

    if (this.data.hasOwnProperty('diabetic') && this.data.diabetic === true) {
      const diabetic_status = {
        'isDiabetic': this.data.isDiabetic, 'healthPlanId': this.data.healthPlanId,
        'patientVisitId': this.data.patientVisitId, 'id': this.data.patientId
      };
      this.commonService.updatePatientDiabetic(diabetic_status).subscribe(res => {
        this.isDisabled = true;
        if (res.statusCode === 1) {
          this.isDisabled = true;
          this.toastr.success('Success', `${res.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.isDisabled = false;
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('mobile') && this.data.mobile === true) {


      const mobile_status = {
        'id': this.data.patientId, 'useMobile': this.data.useMobile,
        'comments': this.confirmForm.controls['comments'].value
      };
      console.log(mobile_status);
      this.hospitalService.updatePatient(mobile_status).subscribe(res => {

        this.isDisabled = true;
        if (res.statusCode === 1) {
          this.isDisabled = true;
          this.toastr.success('Success', `${'Mobile preference updated'}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.isDisabled = false;
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('assignFloor') && this.data.assignFloor === true) {
      const floorDetailInsert = [];
      const floorId = this.confirmForm.controls['floor'].value;

      if (this.data.floorId === floorId) {
        const message = 'Selected floor already assigned';
        this.toastr.success('Success', `${message}`);
        this.dialogRef.close('Yes');
      } else {

        const floorDetails = this.floorList.filter(res => res.floorId === floorId);
        if (floorId) {
          for (let i = 0; i < this.data.patient.length; i++) {
            floorDetailInsert.push(
              {
                'tagId': this.data.patient[i]['tagId'],
                'x': floorDetails[0].x,
                'y': floorDetails[0].y,
                'floorId': floorDetails[0].floorId,
                'floorName': floorDetails[0].floorName,
                'locationId': floorDetails[0].locationId,
                'locationName': floorDetails[0].locationName,
                'careSetting': floorDetails[0].careSetting,
                'locationCat': floorDetails[0].locationCat,
                'tagType': floorDetails[0].tagType,
                'tagValue': this.data.patient[i]['patientId'],
                'patientVisitId': this.data.patient[i]['visit_id']
              }
            );
          }
        } else {
          for (let i = 0; i < this.data.patient.length; i++) {
            floorDetailInsert.push(
              {
                'tagId': this.data.patient[i]['tagId'],
                'x': floorDetails[0].x,
                'y': floorDetails[0].y,
                'floorId': floorDetails[0].floorId,
                'floorName': floorDetails[0].floorName,
                'locationId': floorDetails[0].locationId,
                'locationName': floorDetails[0].locationName,
                'careSetting': floorDetails[0].careSetting,
                'locationCat': floorDetails[0].locationCat,
                'tagType': floorDetails[0].tagType,
                'tagValue': this.data.patient[i]['patientId'],
                'patientVisitId': this.data.patient[i]['visit_id']
              }
            );
          }
        }
        console.log(JSON.stringify(floorDetailInsert));
        this.commonService.saveAssignDefaultFloor(floorDetailInsert).subscribe(res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close('Yes');
          }
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
      }
    } else if (this.data.hasOwnProperty('patientLocation') && this.data.patientLocation === true) {

      this.commonService.updatePatientTestLocation(this.data.updatePatientDetails).subscribe(result => {
        if (result.statusCode === 1) {
          this.toastr.success('Success', `${result.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          setTimeout(() => this.dialogRef.close('Yes'), environment.base_value.lockingTimeout);
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('patientPendingLocation') && this.data.patientPendingLocation === true) {
      console.log(this.data['updatePatientDetails'])
      if(this.data['updatePatientDetails'] !== 'token') {
        this.data['updatePatientDetails'].forEach( x=> {
          if(x.patientStatusId !== 'QS-PE' && this.confirmForm.controls['isPendingTest'].value) {
              this.data['updatePatientDetails']['locationId'] = this.confirmForm.controls['testLocationId']?.value !== null ? this.confirmForm.controls['testLocationId'].value : this.data['updatePatientDetails']['locationId'];
          } else if(x.patientStatusId !== 'QS-PE' && !this.confirmForm.controls['isPendingTest'].value) {
              x['locationId'] = this.confirmForm.controls['testLocationId']?.value !== null ? this.confirmForm.controls['testLocationId'].value : this.data['updatePatientDetails']['locationId'];
          }
        });
      }
      if (!this.confirmForm.controls['isPendingTest'].value && this.data['updatePatientDetails'] !== 'token') {
        this.commonService.updatePatientTestLocation(this.data.updatePatientDetails).subscribe(result => {
          if (result.statusCode === 1) {
            this.toastr.success('Success', `${result.message}`);
            this.dialogRef.close('Continue');
          }
        },
          error => {
            setTimeout(() => this.dialogRef.close('Yes'), environment.base_value.lockingTimeout);
            this.toastr.error('Error', `${error.error.message}`);
          });
      } else {
        this.dialogRef.close(this.data['updatePatientDetails'] === 'token' ? this.confirmForm.controls['testLocationId']?.value : this.data.updatePatientDetails);
      }
    } else if (this.data.hasOwnProperty('oTEnroll') && this.data.enrollData != null) {
      this.data.enrollData['checkExisting'] = false;
      this.commonService.saveRegisteredPatients(this.data.enrollData).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('disAssociateCoaster') && this.data.tagId != null) {
      const disAssociateDevice = { 'tagSerialNumber': this.data.tagId };

      this.configurationService.disassociateTag(disAssociateDevice).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('swversionUpdate') && this.data.id != null) {

      this.configurationService.UpdateSoftwareVersion(this.data).subscribe(results => {
        this.toastr.success('Success', `${results.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('shift') && this.data.deleteShift === true) {

      this.hospitalService.updateShift(this.data.shiftId, this.data.shiftData).subscribe(results => {
        this.toastr.success('Success', `${results.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('routineActivities') && this.data.deleteActivity === true) {
      if (this.data.RType !== 'template') {
        this.configurationService.deleteRoleRoutineActivities(this.data.entityRoutineActivityId).subscribe(resDelRout => {
          this.toastr.success('Success', `${resDelRout.message}`);
          this.dialogRef.close('confirm');
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
      } else {
        this.configurationService.deleteRoutineActivities(this.data.routineActivityId).subscribe(resRout => {
          this.toastr.success('Success', `${resRout.message}`);
          this.dialogRef.close('confirm');
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
      }
    } else if (this.data.hasOwnProperty('RoleEndRoutine') && this.data.deleteRoutine === true) {
      this.configurationService.deleteRoleRoutine(this.data.entityRoutineId).subscribe(resIPRout => {
        this.toastr.success('Success', `${resIPRout.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('RoleCancelRoutine') && this.data.cancelRoutine === true) {
      this.configurationService.cancelRoleRoutine(this.data.entityRoutineEventId).subscribe(resIPRout => {
        this.toastr.success('Success', `${resIPRout.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('completeTask') && this.data.completeTask === true) {
      this.loading = true;
      this.data.completeData['remarks'] = this.confirmForm.controls['comments'].value,
      this.commonService.updateTask(this.data.requestId, this.data.completeData).subscribe(resCompTask => {
        this.loading = false;
        this.toastr.success('Success', `${resCompTask.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('AssetApprove') && this.data.AssetApprove=== true) {
      this.data.assetdata['comments'] = this.confirmForm.controls['comments'].value,
      this.commonService.assetTransfer(this.data.assetdata).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
        }, error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
      }else if (this.data.hasOwnProperty('deleteTask') && this.data.deleteTask === true) {
      this.data.deleteData['remarks'] = this.confirmForm.controls['comments'].value,
      this.commonService.updateTask(this.data.requestId, this.data.deleteData).subscribe(resDeleteTask => {
        this.toastr.success('Success', `${resDeleteTask.message}`);
        this.dialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('certificateUpdate') && this.data.certificateUpdate === true) {
      console.log("certificate upgraded");
      this.dialogRef.close('confirm');
    } else if (this.data.hasOwnProperty('testStatusChange') && this.data.testStatusChange === true) {
      console.log(this.data);
      const status = {
        'statusId': this.data.statusId,
        'reasonCode': this.confirmForm.controls['reasonCode'].value,
        'lastModifiedOn' : this.data.lastModifiedOn
      };

      this.dashboardService.updatePatientQueueStatus(this.data.queueId, status).subscribe(resQue => {
        if (resQue.statusCode === 1) {
          this.toastr.success('Success', `${resQue.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          setTimeout(() => this.dialogRef.close('Yes'), environment.base_value.lockingTimeout);
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('reviewDateInfo') && this.data.reviewDateInfo === true) {
      this.dashboardService.updatePatientQueueStatus(this.data.patientQueueId, this.data.updateReviewDate).subscribe(resDate => {
        if (resDate.statusCode === 1) {
          this.toastr.success('Success', `${resDate.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('updateReportDate')&& this.data.updateReportDate !== null) {
      const data = {
        'patientId': this.data.updateReportDate.patientId,
        'patientVisitId': this.data.updateReportDate.patientVisitId,
        'reportCollectedDate': this.datepipe.transform(this.currentDate, 'yyyy-MM-dd HH:mm:ss'),
      }
      this.commonService.updateClinicalDetails(data).subscribe(resDate => {
        if (resDate.statusCode === 1) {
          this.toastr.success('Success', `${resDate.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('isNewTestAdded') && this.data.isNewTestAdded === true) {
      const addTestDetails = {
        'patientId': this.data.patientId, 'patientVisitId': this.data.patientVisitId,
        'healthTestId': this.selectedId, 'healthTest': this.selectedTesttype
      };

      this.commonService.managePatientTest(addTestDetails).subscribe(resTest => {
        if (resTest.statusCode === 1) {
          this.toastr.success('Success', `${resTest.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if(this.data.hasOwnProperty('updateDoctor') && this.data.updateDoctor === true){
      const updateDetails = {
        'patientVisitId': this.data.patientVisitId,
        'consultantId': this.selectedId
      };
      this.commonService.updateHealthCheckConsultantName(updateDetails).subscribe(resTest => {
        if (resTest.statusCode === 1) {
          this.toastr.success('Success', `${resTest.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('activateRoom') && this.data.activateRoom === true) {

      this.commonService.updateHealthTestByFloorwise(this.data.locationStatusUpdate).subscribe(resFloor => {
        if (resFloor.statusCode === 1) {
          this.toastr.success('Success', `${resFloor.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });

    } else if (this.data.hasOwnProperty('enrollVisitType') && this.data.enrollVisitType === true) {
      this.dialogRef.close('Follow up');
    } else if (this.data.hasOwnProperty('userRequestLimit') && this.data.userRequestLimit === true) {
      this.dialogRef.close(this.confirmButtonText);
    } else if (this.data.hasOwnProperty('cancelBilling') && this.data.cancelBilling === true) {
      console.log(this.data);

      const cancelBilling = {
        'patientId': this.data.patientId,
        'patientVisitId': this.data.patientVisitId,
        'tagId': this.data.tagId
      };

      console.log(cancelBilling);
      this.commonService.cancleBilling(cancelBilling).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.dialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('cancelAlert') && this.data.cancelAlert === true) {
      if(!this.data.hasOwnProperty('ipView') || this.data.hasOwnProperty('ipView') && this.data.ipView == null) {
      const cancelAlert = {
        'ids': [this.data.alertDetails.alertId],
        'comments': this.confirmForm.controls['comments'].value,
        'closedById':parseInt(this.currentUserId)
      };

      this.commonService.cancelAlert(cancelAlert).subscribe(resAlert => {
        if (resAlert.statusCode === 1) {
          this.toastr.success('Success', `${resAlert.message}`);
          this.dialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      } else if(this.data.ipView == 'location') {
        this.ackAlert(false)
      }
    } else if (this.data.hasOwnProperty('discharge') && this.data.discharge === true) {
      const dischargeData = {
        'patientId': this.data.patientId,
        'patientVisitId': this.data.patientVisitId,
        'visitType': this.data.visitType
      };
      if(this.data.hasOwnProperty('visitType') && this.data.visitType == "VT-EC") {
        dischargeData['dischargeReasonId'] = this.confirmForm.controls.reasonCode.value
      }
      console.log(dischargeData);
      if (this.data.tagId != null) {
        const disAssociateDevice = { 'tagSerialNumber': this.data.tagId };
  
        this.configurationService.disassociateTag(disAssociateDevice).subscribe(res => {
          if (res.statusCode !== 1) {
          }
          this.toastr.success('Success', `${res.message}`);
          },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
      }
      this.commonService.dischargePatient(dischargeData).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.dialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('assetStatus') && this.data.assetStatus === true) {
      const assetStatusUpdate = {
        'assetTransferTypeId': 'ATT-SV',
      };

      console.log(assetStatusUpdate);
      this.commonService.assetStatusChange(assetStatusUpdate, this.data.assetId).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.dialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else if (this.data.hasOwnProperty('MRTagDisassociate') && this.data.MRTagDisassociate === true) {
      this.dialogRef.close(this.confirmButtonText);
    } else if (this.data.hasOwnProperty('porterReqStatusChange') && this.data.porterReqStatusChange === true) {
      const data = {
        "reason": this.confirmForm.controls.reasonCode.value,
        "user": this.userId,
        "remarks": this.confirmForm.controls.comments.value
      }
      if(!this.reqCancelReasonExist && data?.remarks?.trim()) {
        this.requestCancelReason.push({"reason":data.remarks})
        this.commonService.validateUserPreference('RequestCancelReason', JSON.stringify(this.requestCancelReason));
      }
      this.dialogRef.close(data);
    } else if (this.data.hasOwnProperty('MRReqStatusChange') && this.data.MRReqStatusChange === true) {
      this.dialogRef.close(this.confirmButtonText);
    } else if (this.data.hasOwnProperty('checkAvailablePorter') && this.data.checkAvailablePorter === true) {
      this.dialogRef.close(this.confirmButtonText);
    } else if (this.data.hasOwnProperty('reassignPorter') && this.data.reassignPorter === true) {
      this.dialogRef.close(this.confirmButtonText);
    } else if (this.data.hasOwnProperty('disengageAlarm') && this.data.disengageAlarm === true) {
      let eventType = null;
      if(type === 'Authorized') {
        eventType = 'IET-AT'
      } else {
        eventType = 'IET-ATC'
      }
      const authorize = {
        "comments": this.confirmForm.controls['purpose'].value,
        "eventTypeId": eventType,
        "facilityId": localStorage.getItem(btoa('facilityId')),
        "identifyingType": this.durationCode,
        "identifyingValue": this.durationValue,
        "infantPatientId": this.data.infantData.id,
        "infantPatientVisitId": this.data.infantData.patientVisitId,
        "infantTagId": this.data.infantData.associatedTagSerialNumber,
        "parentPatientVisitId": this.data.infantData.parentVisitId,
        "userId": localStorage.getItem(btoa('userId'))
      }
      const infantData = this.data?.infantData;
      infantData['duration'] = this.confirmForm.controls['duration'].value.replace('DUM-', '');
      infantData['authorizedBy'] = localStorage.getItem(btoa('current_user'));
      const msg = type === 'Authorized' ? 'Do you want to authorize?' : 'Do you want to remove authorization?'
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'], 
        height: 'auto',
        disableClose: true,
        data: {
          title: 'Confirm Authorization', message: msg,
          buttonText: { ok: 'Yes', cancel: 'No' },
          'isRemark': 1, 'isAuthorize': true,
          infantData: infantData
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result === 'Yes') {
          this.commonService.infantAuthorized(authorize).subscribe(res => {
            if (res.statusCode === 1) {
              this.toastr.success('Success', `${res.message}`);
              this.dialogRef.close(this.confirmButtonText);
            } else {
              this.toastr.error('Error', `${res.message}`);
            }
          },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
        }
      });
    } else if(this.data.hasOwnProperty('dashboardLayout') && this.data.dashboardLayout === true){
        this.dialogRef.close(this.confirmButtonText);
    } else if(this.data.hasOwnProperty('confirmation') && this.data.confirmation === true){
      this.dialogRef.close(this.confirmButtonText);
    } else if(this.data.hasOwnProperty('formTempNameEnable') && this.data.formTempNameEnable === true){
      //confirmation from form builder for save as
      const formTemp = {
        'formTempName': this.confirmForm.controls['formTempName'].value,
        'confirmButtonText': this.confirmButtonText
      };
      this.dialogRef.close(formTemp);
    } else if(this.data.hasOwnProperty('testLocation') && this.data?.testLocation === true){
      const locData: any = {
        'locationId': this.confirmForm.controls['testLocationId'].value,
        'confirmButtonText': this.confirmButtonText
      };
      if(this.data?.testStatusWithLocation) {
        if (this.confirmForm.controls['testStatusId'].value !== null) {
          const statusData = {
            'statusId': this.confirmForm.controls['testStatusId'].value,
            'locId': locData?.locationId,
            'info': this.info,
            'confirmButtonText': this.confirmButtonText
          };
                        console.log(statusData)
          this.dialogRef.close(statusData);
        }
      } else if (locData?.locationId !== null && locData !== 'No' && locData !== '' && !this.data?.testStatusWithLocation) {
        const status = { 'statusId': this.data?.statusId, 'locationId': locData?.locationId};
        this.dashboardService.updatePatientQueueStatus(this.data?.patientQueueId, status).subscribe(res => {
          if(res.statusCode === 1) {
            this.dialogRef.close();
          }
        }, error => {
          this.toastr.warning('Warning', `${error.error.message}`);
          this.info = JSON.parse(error.error.additionalInfo);
          if (error.error.errorCode === "TWAPI54") {
            this.changeExistingQueueStatus(this.info, locData?.locationId);
          }
        });
      }
    }  else if(this.data.hasOwnProperty('testStatus') && this.data?.testStatus === true){
      const statusData = {
        'statusId': this.confirmForm.controls['testStatusId'].value,
        'confirmButtonText': this.confirmButtonText
      };
      this.dialogRef.close(statusData);
    } else if(this.data.hasOwnProperty('formStatusEnable') && this.data.formStatusEnable === true){
      //confirmation from form save
      const formRemark = {
        'comments': this.confirmForm.controls['comments'].value,
        'confirmButtonText': this.confirmButtonText
      };
      this.dialogRef.close(formRemark);
    } else if(this.data.hasOwnProperty('pharmacyAck') && this.data.pharmacyAck === true){
      //confirmation from pharmacy request acknowledgement
      const nameVal = (this.confirmForm.controls['userName'].value || '').trim();
      const remarksVal = (this.confirmForm.controls['comments'].value || '').trim();
      const ackRemarks = {
        'acknowledgedComments': nameVal + (remarksVal ? ' | ' + remarksVal : ''),
        'isPartiallyCompleted': this.confirmForm.controls['isPartiallyCompleted'].value,
        'confirmButtonText': this.confirmButtonText,
        'userName': this.confirmForm.controls['ackUser'].value,
        "ackmobileById":this.ackId !=null ? this.ackId :null
      };
      this.dialogRef.close(ackRemarks);
    } else if(this.data.hasOwnProperty('manageAppterm') && this.data.manageAppterm === true){
      const apptermRemark = {
        'comments': this.confirmForm.controls['comments'].value,
        'confirmButtonText': this.confirmButtonText
      }
      this.dialogRef.close(apptermRemark);
    } else if(this.data.hasOwnProperty('isdisassociateLocation')){
      const disassociateUserLocations = {
        'deleteLocations': this.confirmForm.controls.isdisassociateLocations.value,
        'confirmButtonText': this.confirmButtonText
      }
      this.dialogRef.close(disassociateUserLocations);
    } else if (this.data.hasOwnProperty('resetPassword')) {
      const payload = {
        'userId': this.data.userData.userId,
        'newPassword': this.confirmForm.controls['confirmPwd'].value != '' ? this.confirmForm.controls['confirmPwd'].value : null
      };
      this.commonService.resetPassword(payload).subscribe(resStatus => {
        if (resStatus.statusCode === 1) {
          this.toastr.success('Success', `${resStatus.message}`);
          this.dialogRef.close('Yes');
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    } else if (this.data.hasOwnProperty('approval')) {
      const approvalRemark = {
        'comments': this.confirmForm.controls['comments'].value,
        'confirmButtonText': this.confirmButtonText,
        'type': this.data.type
      };
      this.dialogRef.close(approvalRemark);
    } else {
      const status = {
        'statusId': this.data.statusId, 'locationId': parseInt(this.data.locationId, 10),
        'reasonCode': this.confirmForm.controls['reasonCode'].value,
        'comments': this.confirmForm.controls['comments'].value, 'queueIds': this.data.queueIds, 'isParalelTestIncluded': this.data.isParalelTestIncluded,
        'reviewDate': this.datepipe.transform(this.confirmForm.controls['reviewDate'].value, 'yyyy-MM-dd HH:mm:ss')
      };
      this.dashboardService.updatePatientQueueStatus(this.data.queueId, status).subscribe(resStatus => {
        if (resStatus.statusCode === 1) {
          this.toastr.success('Success', `${resStatus.message}`);
          this.dialogRef.close('Yes');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }

  changeExistingQueueStatus(info, locId) {
    let queueStatus = [];
    this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
      queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code === 'QS-CO');
      if(info?.status !== 'QS-IP') {
				queueStatus = queueStatus?.filter(filter => filter.code !== 'QS-CO');
			}
      this.data['testStatusList'] = queueStatus;
      this.data['testStatusWithLocation'] = true;
      this.data['testStatusWithLocationMsg'] = 'Do you want to change the status of existing test\n' + '"' + info?.testName + '"' +  ' in ' + info?.statusName + ' ?';
      console.log(this.data)
    });
  }
  fixClick() {
    console.log('')
  }
}
