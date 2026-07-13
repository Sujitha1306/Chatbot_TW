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

import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { CommonService } from '../shared';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { AppToastService } from '../shared/services/toaster.service';

@Component({
  selector: 'app-web',
  templateUrl: './web.component.html',
  styleUrls: ['./web.component.scss']
})
export class WebComponent implements OnInit {
  public guestForm : FormGroup;
  customerLogo = null;
  verifyOtp = false;
  otpLogin = false;
  params = null;
  phoneNoValidation: any = /^[0-9]{10,13}$/;
  countdown = 30;
  timerInterval: any;

    selectedLang = 'en';
    languages = [
    { code: 'en', label: 'English', tooltip: 'English' },
    { code: 'ar', label: 'العربية', tooltip: 'Arabic' },
    { code: 'id', label: 'Bahasa Indonesia', tooltip: 'Indonesian' },
    { code: 'th', label: 'ไทย', tooltip: 'Thai'},
    { code: 'fr', label: 'Français', tooltip: 'French'},
    { code: 'pt', label: 'Português', tooltip: 'Portuguese' }
  ];
  constructor(private readonly commonService : CommonService, private readonly fb : FormBuilder, private readonly router: Router,private readonly translate : TranslateService ,@Inject(LOCALE_ID) public localeId: string,
          private activeRoute : ActivatedRoute, public toastr: AppToastService ) {

  }

  ngOnInit(): void {
    this.buildForm()
      if(environment.languages) {
      this.languages = environment.languages;
    }

    localStorage.setItem(btoa('lang'), this.localeId);
    if(localStorage.hasOwnProperty(btoa('locale'))) {
      this.changeLanguage(localStorage.getItem(btoa('locale')))
    }
    
  }

  buildForm() {
    // localStorage.clear();
    this.guestForm = this.fb.group({
      'name': [null],
      'mobileNo': [null, [Validators.pattern(this.phoneNoValidation)]],
      'verifyOtp': [null,Validators.pattern(/^[0-9]{4,10}$/)],
      'email': [null, [Validators.required, Validators.pattern(/(^[0-9]{10}$)|(^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$)/)]]
    });
    if(window.location.hostname.includes('tw.kimshis.life')) {
      this.customerLogo =  "/assets/Alert/common_icons/kims-logo.jpeg"
    }
    if(window.location.hostname.includes('kch.trackerwave.com')) {
      this.customerLogo =  "/assets/Alert/common_icons/kings-logo.svg"
    }
    this.activeRoute.queryParams.subscribe(params => {  
      if(params.hasOwnProperty('tk')) {
        let token = params.tk;
        this.params = JSON.parse(atob(token.slice(0, 3) + token.slice(3 + 6)));
        this.otpLogin = this.params.typ == 'PA-OTP'; 
        if(this.otpLogin) {
          this.guestForm.controls.email.setValidators(null);
          this.guestForm.controls.mobileNo.setValidators([Validators.required,Validators.pattern(this.phoneNoValidation)]);
          this.guestForm.controls.email.updateValueAndValidity();
          this.guestForm.controls.mobileNo.updateValueAndValidity();
        }
      }
    });
  }
  sendOtp() {
    let name = this.guestForm.controls.name.value;
    let mobileNo = this.guestForm.controls.mobileNo.value;
    let facilityId = this.params.fid;
    this.verifyOtp = false;
    this.commonService.sendOTP(name,mobileNo,facilityId).subscribe(res => {
      if(res.statusCode == 1) {
        this.verifyOtp = true;
        this.guestForm.controls.verifyOtp.setValidators(Validators.required);
        this.guestForm.controls.verifyOtp.updateValueAndValidity();
        this.guestForm.controls.verifyOtp.markAllAsTouched();
        this.toastr.success('Success', `${res.message}`);
      }
    });
  }
  otpVerification() {
    let otpcode = this.guestForm.controls.verifyOtp.value
    let mobileNo = this.guestForm.controls.mobileNo.value;
    let name = this.guestForm.controls.name.value;
    this.commonService.verifyOTP(otpcode, mobileNo).subscribe(res => {
      if(res.statusCode == 1) {
        if(res.results.hasOwnProperty('accessToken')) {
          localStorage.setItem(btoa('patientName'), name);
          localStorage.setItem(btoa('user_token'), res.results.accessToken);
          localStorage.setItem(btoa('refreshToken'), res.results.refreshToken);
          localStorage.setItem(btoa('current_user'), res.results.id);
          localStorage.setItem(btoa('facilityId'), this.params.fid);        
          localStorage.setItem(btoa('uid'), res.results.uid);

          if(this.params.hasOwnProperty('lid')) {
            this.router.navigate(['web/request'], { queryParams: { lid: this.params.lid }  }) 
          }
          this.toastr.success( 'Success', `${res.message}`)
        } else {
          this.toastr.error('Error', `${res.message}`)
        }
      }
    });
  }

  guestLogin() {
    // dev
    let token = 'eyJNaVaNemaWQiOiIwMDAyIiwiY3RrIjoiUTYzMjNXODQyNzM0MTQ4NzI4Uj09In0=';
        token = 'eyJenavanmaWQiOiIwNDU5IiwiY3RrIjoiUTcxMjFDMDA1MjUxNzY2MTM4VT09In0=';
    if(window.location.hostname.includes('pwa.trackerwave.com')) {
      // demo
      token='eyJenavanmaWQiOiIwNDU5IiwiY3RrIjoiUTcxMjFDMDA1MjUxNzY2MTM4VT09In0=';
    } else if(window.location.hostname.includes('kch.trackerwave.com')) {
      token = 'eyJYadTaMmaWQiOiIwMTYxIiwiY3RrIjoiTDk5ODFCMjQ2NjAxNzMxNjQ3UD09In0=';
    }    
    let payload = {
      'entity': 'GUEST_USER', // type
      'entityName' : this.guestForm.controls.name.value,
      'gtk' : token,
      'mobileNumber': null, 
      'email' : this.guestForm.controls.email.value
    }
    this.commonService.getGuestInfo(payload).subscribe(res => {
      if(res.statusCode == 1) {
        console.log(res.results)
        let facilityName = res.results.customerName + ', ' +  res.results.regionName + ', ' + res.results.facilityName;
        localStorage.setItem(btoa('authCode'), res.results.authCode); // dXNlcl90b2tlbg==
        localStorage.setItem(btoa('current_user'), res.results.name);
        localStorage.setItem(btoa('customer'), facilityName);
        localStorage.setItem('customerId', res.results.customerId);
        localStorage.setItem('regionId', res.results.regionId);
        localStorage.setItem(btoa('facilityId'), res.results.facilityId);        
        localStorage.setItem(btoa('uid'), res.results.uid);
        localStorage.setItem(btoa('guestInfo'), JSON.stringify(res.results));
        console.log(res.results);
        let timestamp = new Date().getTime();
        let encTime = btoa(timestamp.toString());
        this.router.navigate(['web/main'], { queryParams: { nc : encTime }});        
      }
    });
  }

   changeLanguage(lang: string) {
    this.selectedLang = lang;
    localStorage.setItem(btoa('locale'), lang);
    this.translate.use(lang)
  }

   switchLanguage(language: string) {
    localStorage.setItem(btoa('lang'), language);
  }

  startTimer() {
    this.countdown = 30;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => { this.countdown--;
      if (this.countdown === 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

}
