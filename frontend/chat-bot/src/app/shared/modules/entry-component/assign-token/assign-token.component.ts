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
import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { environment } from '../../../../../environments/environment';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { CookieService } from 'ngx-cookie-service';
import { CommonService, DashboardService } from '../../../services';
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
  selector: 'app-assign-token',
  templateUrl: './assign-token.component.html',
  styleUrls: ['./assign-token.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],

})

export class AssignTokenComponent implements OnInit {

  public tokenForm: FormGroup;
  public isDisabled = false;
  public currentDate: any = new Date();
  public matcher = new ErrorStateMatcherService();
  height: any;
  toHit = false;
  tokenEnabled = false;
  requireTokenMatchVal: any = [];
  tokenList: any = [];
  public ipView = null;
  public enableAssignToken = false;
  public bannerlabel = null;
  customerLogo = null;
  public customerId = localStorage.getItem('customerId');
  patientInfo: any = [];
  tokenId = null;
  assignFloorDetails: any = [];
  tokenGenerated = null;
  assignFloorId = null;
  assignFloorData: any;
  visitTypeList: any = [];
  tokenTypeList: any = [];
  tokenTypeId = null;
  visitTypeId = null;
  pendingInfo: any = [];
  PCTestStatus = false;
  enablePrintToken = false;
  vipList = [];

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog, private readonly commonService: CommonService,
    public thisDialogRef: MatDialogRef<AssignTokenComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private readonly cookieService: CookieService,
    private readonly _dateFormat: DatePipe, private readonly dateAdapter: DateAdapter<Date>, public datepipe: DatePipe, public dashboardService: DashboardService) {
      this.customerLogo =  environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId ;
  }

  ngOnInit() {
    this.visitTypeId = this.data.hasOwnProperty("visitTypeId") ? this.data.visitTypeId.trim() : this.visitTypeId;
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if(res.statusCode === 1) {
        this.ipView = res.results['contentObject'];
        if(this.ipView.hasOwnProperty('enableAssignToken')) {
          this.enableAssignToken = this.ipView.enableAssignToken;
        }
        if(this.ipView.hasOwnProperty('enablePrintToken')) {
          this.enablePrintToken = this.ipView.enablePrintToken;
        }
      }
    });
    this.buildForm();
    this.getPatientDetails();
    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.assignFloorDetails = res.results.contentObject['assign-floor'].filter(filter => filter.isOnlyRegistration === 'false' && filter.isFollowup === 'false');
        if(this.assignFloorDetails?.length > 0 && !this.enableAssignToken) {
          if (this.commonService.userPreference?.hasOwnProperty('AssignTokenFloor')) {
            this.assignFloorId = parseInt(this.commonService.userPreference.AssignTokenFloor.value);
            this.tokenForm.get('assignFloorId').setValue(parseInt(this.commonService.userPreference.AssignTokenFloor.value));
          } else {
            this.assignFloorId = this.assignFloorDetails[0]?.floorId;
            this.tokenForm.get('assignFloorId').setValue(this.assignFloorId);
          }
        }
      }
    });
    this.commonService.getAppTerms('VisitType').subscribe(res => {
      this.visitTypeList = res.results.filter(item => item.code !== 'VT-TK').map(({ code, value }) => ({ code, value }));
    });
    this.commonService.getAppTerms('TokenType').subscribe(res => {
      this.tokenTypeList = res.results.map(({ code, value }) => ({ code, value }));
    });
    this.commonService.getAppTermsVerion2('VipType').subscribe(res => {
      this.vipList = res.results;
    });
  }

  onWindowResized(size) {
    this.height = size;
  }

  public buildForm() {
    this.tokenForm = this.form.group({
      token: [null, Validators.required],
      enrolledToken: [null],
      assignFloorId: [null, Validators.required],
      tokenTypeId: [null],
      visitTypeId: [null],
      mobileNo: [null],
      vipTypeId: [null],
      isDiabetic: [null],
      isFasting: [null],
      isVulnerable: [null],
      isPregnant: [null]
    });
  }

  getPatientDetails() {
    const temp = this.data?.tempPatientId !== null ? true : false;
    this.commonService.getPatientInfo(this.data?.patientId, '', temp, null, null, null).subscribe(res => {
      const e = eval;
      this.patientInfo = e('[' + JSON.stringify(res.results) + ']');
      this.getBannerDataInfo(this.patientInfo[0]);
      this.tokenForm.get('vipTypeId').setValue(this.patientInfo[0]?.vipTypeId !== null ? this.patientInfo[0]?.vipTypeId : null);
      this.tokenForm.get('isDiabetic').setValue(this.patientInfo[0]?.isDiabetic !== null ? this.patientInfo[0]?.isDiabetic: null);
      this.tokenForm.get('isFasting').setValue(this.patientInfo[0]?.isFasting !== null ? this.patientInfo[0]?.isFasting : false);
      this.tokenForm.get('isVulnerable').setValue(this.patientInfo[0]?.isVulnerable !== null ? this.patientInfo[0]?.isVulnerable : false);
      this.tokenForm.get('isPregnant').setValue(this.patientInfo[0]?.isPregnant !== null ? this.patientInfo[0]?.isPregnant : false);
      if (this.patientInfo[0].testStatuses != null) {
        for (let i = 0; this.patientInfo[0].testStatuses.length > i; i++) {
          if (this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PE' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-NR' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-FL' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PC') {
            this.pendingInfo.push(this.patientInfo[0].testStatuses[i]);
          }
        }
      }
    });
  }

   getBannerDataInfo(data) {
    this.bannerlabel = {
      'banners': {
        "bannerInfo" : data,
        "bannerFirstRow": {
          "name": data.patientName,
          "tokenNo": data.tokenNo,
          "vipTypeId": data.vipTypeId ? data.visitTypeId : this.visitTypeId,
          "birthDate": data.dob,
          "gender": data.gender,
        },
        "bannerFirstRowLable": [{ code: 'name', value: 'Name' }, { code: 'tokenNo', value: 'Token No' }],
        "bannerSeconRowLable": [{ code: 'uhid', value: 'UHID' }, { code: 'visitDetails', value: 'Visit Details' }, { code: 'doctor', value: 'Doctor' }, { code: 'tagID', value: 'Tag ID' }, { code: 'visittagID', value: 'visitTag ID' },
                                {code: 'location', value: 'Location'}, {code: 'disassociate' , value: 'Disassociate'}, {code: 'discharge' , value: 'discharge'}, {code: 'healthPlanName', value: 'HealthPlan Name'}, {code: 'consultantName', value: 'Consultant Name'},
                                {code: 'refresh', value: 'Refresh'}, {code: 'resend', value: 'Resend'},{code: 'diabetic', value: 'Diabetic'}, {code: 'fasting', value: 'Fasting'}, {code: 'vulnerable', value: 'Vulnerable'}, 
                                {code: 'pregnant', value: 'Pregnant'}, {code: 'alertStatus', value: 'AlertStatus'}, {code: 'currentLocationName', value: 'Current LocationName'} ],
        "bannerSecondRow": {
          "uhid": data.uhid,
          "visitTypeId": this.visitTypeId == 'VT-OP' ? 'OP' : 'HC',
          "visitIdentifier": data.visitIdentifier,
          "visitDate": this.datepipe.transform(data.visitDate, 'dd/MM/yyyy hh:mm a'),
          "patientVisitTagId": data.patientVisitTagId,
          "languageName":  data.languageName,
          "locationName": data.locationName,
          "healthPlanName": data.healthPlanName,
          "doctorName": data.consultantName,
          "isDiabetic": data.isDiabetic,
          "isFasting": data.isFasting,
          "isVulnerable": data.isVulnerable,
          "isPregnant": data.isPregnant,
          "iotAlertStatus": data.iotAlertStatus,
          "currentLocationName": data.currentLocationName,
        }
      }
    }
  }
onChangeClinicalDetails(event, type) {
    if (type === 'isDiabetic') {
      this.tokenForm.get('isDiabetic');
      this.patientInfo[0].isDiabetic = event;
    } else if (type === 'isFasting') {
      if (event.checked === true) {
        this.tokenForm.get('isFasting').setValue(true);
        this.patientInfo[0].isFasting = true;
      } else {
        this.tokenForm.get('isFasting').setValue(false);
        this.patientInfo[0].isFasting = false;
      }
    } else if (type === 'isVulnerable') {
      if (event.checked === true) {
        this.tokenForm.get('isVulnerable').setValue(true);
        this.patientInfo[0].isVulnerable = true;
      } else {
        this.tokenForm.get('isVulnerable').setValue(false);
        this.patientInfo[0].isVulnerable = false;
      }
    } else if (type === 'isPregnant') {
      if (event.checked === true) {
        this.tokenForm.get('isPregnant').setValue(true);
        this.patientInfo[0].isPregnant = true;
      } else {
        this.tokenForm.get('isPregnant').setValue(false);
        this.patientInfo[0].isPregnant = false;
      }
    }
  }
  searchToken(event) {
    this.tokenId = null;
    this.toHit = event.toHit;
    if (event.text.length >= 2) {
      if (event.toHit == true && this.enableAssignToken) {
        this.commonService.searchToken(event.text, this.data?.visitTypeId).subscribe(res => {
          if(res.statusCode === 1) {
            this.tokenEnabled = true;
            this.tokenList = res.results;
          } else{
            this.tokenEnabled = false;
            this.tokenList = [];
          }
        });
      }
    }
  }

  getBillingTokenDetails(token) {
    this.tokenId = token?.id;
    this.assignFloorId = token?.floorId;
    this.tokenTypeId = token?.tokenTypeId;
    this.visitTypeId = token?.visitTypeId;
  }

  assignedFloorCookie(floorId) {
    this.assignFloorData = floorId;
    this.commonService.validateUserPreference('AssignTokenFloor', floorId);
  }

  generateToken() {
    if(!this.enableAssignToken && this.tokenForm.controls['assignFloorId']?.value !== null) {
      this.assignFloorId = this.tokenForm.controls['assignFloorId'].value;
    }
    const val = {
      'mainidentifier': this.data.uhid,
      'firstName': this.data.firstName,
      'middleName': this.data.middleName,
      'lastName': this.data.lastName,
      'age': this.patientInfo[0].age,
      'birthDate': this.data.birthDate,
      'gender': this.data.gender,
      'mobileNo': this.data.mobile_no,
      'patientVisitId': this.data.visit_id,
      'healthPlanId': this.data.health_plan_id,
      'isDiabetic': this.patientInfo[0].isDiabetic,
      'isFasting': this.patientInfo[0].isFasting,
      'isVulnerable': this.patientInfo[0].isVulnerable,
      'isPregnant': this.patientInfo[0].isPregnant,
      'externalRegionId': null,
      'assignedFloorId': this.assignFloorId,
      'packageDate': this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      'isPkgDateEdited': false,
      'tagSerialNumber': null,
      'tagTypeId': null,
      'visitIdentifier': this.data.visit_identifier,
      'billingDate':this.data.billingDate,
      'isCheckOutProcessCounter': true,
      'vipTypeId': this.tokenForm.get('vipTypeId').value
    };
    if ((this.data?.visitTypeId === 'VT-OP' || this.visitTypeId == 'VT-OP') && this.data.patientVisitId === null) {
      // val['tempPatientId']    = this.data.patientId;
      val['patientVisitId']   = this.data.patientVisitId;
      val['mobileNo']         = this.data.mobileNo;
      val['visitIdentifier']  = this.data.visitIdentifier;
      val['mainidentifier']   = this.data.mainidentifier;
      val['healthPlanId']     = this.data.healthPlanId;
      val['visitTypeId']      = this.data?.visitTypeId ? this.data.visitTypeId.trim() : this.visitTypeId.trim();
    }
    if(this.enableAssignToken) {
      val['tokenNumberId']    = this.tokenId;
    }
    if(this.data?.type === 'Open') {
      val['isFollowUp'] = true;
      val['isPkgDateEdited'] = true;
      val['tokenNumberId'] = this.data?.tokenNumberId;
    }
    // Assign Token during generate need to Pass tempPatientId when value is not null
    const visitType = this.data?.visitTypeId || this.visitTypeId;
    if (['VT-HC', 'VT-OP'].includes(visitType) && this.data?.tempPatientId != null) {
      val['tempPatientId'] = this.data.tempPatientId;
    }
    
    this.commonService.saveRegisteredPatients(val).subscribe(res => {
      if(res.statusCode === 1) {
        this.tokenGenerated = res.results?.tokenNo;
        this.tokenForm.get('enrolledToken').setValue(this.tokenGenerated);
        this.tokenForm.get('assignFloorId').setValue(this.assignFloorId);
        this.tokenForm.get('tokenTypeId').setValue(this.tokenTypeId);
        this.tokenForm.get('visitTypeId').setValue(this.data?.visitTypeId);
        this.tokenForm.get('mobileNo').setValue(this.data.mobile_no);
        this.tokenId = null;
      } else {
        this.tokenGenerated = null;
      }
      this.toastr.success('Success', `${res.message}`);
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  printAssignToken() {
    const printContent = document.getElementById('tokenData').innerHTML;
    if (printContent) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
  
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write('<html><head><title>Token</title>');
      doc.write('<style>@page { size: auto; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }</style>');
      doc.write('</head><body>');
      doc.write(printContent);
      doc.write('</body></html>');
      doc.close();
  
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
      }, 1000);
    }
  }

  fixClick() {
    console.log("")
  }
}

