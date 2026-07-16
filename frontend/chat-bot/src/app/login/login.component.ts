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
import { Component, OnInit, ViewChild, Inject, LOCALE_ID, ViewEncapsulation, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInput } from '@angular/material/input';
import { CookieService } from 'ngx-cookie-service';
import { LoginModel, ResetModel, ForgetModel, ForgotPasswordModel } from '../shared/model/common.model';
import { ErrorService } from './../shared/services/error.service';
import { ColorThemeService, CommonService, CookieConsentService, PwaDetectionService } from '../shared';
import { TermsComponent } from './../shared/modules/entry-component/terms/terms.component';
import { CreateTicketComponent } from './../shared/modules/entry-component/support-ticket/support-ticket.component';
import { environment } from '../../environments/environment';
import { PasswordValidation } from '../shared/modules/entry-component/password-validators';
import * as screenfull from 'screenfull';
import { ErrorStateMatcherService } from '../shared/services/error-state-matcher.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { NgxCaptchaService } from '@binssoft/ngx-captcha';
import { TranslateService } from '@ngx-translate/core';
import { AppToastService } from '../shared/services/toaster.service';
import { FireBaseServiceService } from '../shared/services/fire-base-service.service';
import { MfaService } from '../shared/services/mfa.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class LoginComponent implements OnInit {
  appVersion = environment.version;
  oviNavOpen: boolean = true;
  oviNavMode: string = 'side';
  loginForm: FormGroup;
  resetForm: FormGroup;
  forgetForm: FormGroup;
  hide = true;
  loading = false;
  submitted = false;
  public enableCaptcha = false;
  public captchaToken = null;
  public customerName = "tw";
  public env_key = environment.env_key;
  currentYear: number;
  public footerBar = true;
  public sendotp = false;
  isPatient = false;
  params = null;
  hideNew = true;
  hideConfirm = true;

  // To set autofocus in 'username' login field

  @ViewChild('username', { static: false }) nameInput!: ElementRef;
  @ViewChild('username', { read: ElementRef }) userNameInput!: ElementRef;

  spinnerButtonOptions: any = {
    active: false,
    text: 'Spinner Button',
    spinnerSize: 18,
    raised: true,
    buttonColor: 'primary',
    spinnerColor: 'accent'
  };

  public loginModel: LoginModel;
  public resetModel: ResetModel;
  public forgetModel: ForgetModel;
  public insertresult: any;
  public username: string;
  public password: string;
  public email: string;
  public resetUsername: string;
  roleCode = null;
  public sessionTime = (new Date().getTime() + (1 * 60 * 60 * 1000)).toString();
  // public sessionTime = (new Date().getTime()+ (60000)).toString();
  isFullscreen = false;

  public forgetPassword:boolean = false;
  public resetPassword: boolean = false;
  public loginFlag: boolean = true;
  public showMfa: boolean = false;
  public mfaUsername: string = '';
  public mfaIsConfigured: boolean = false;
  public mfaOtpAuthUrl: string | null = null;
  public mfaSecret: string | null = null;
  private pendingLoginResult: any = null;
  public pwExpiry: boolean = true;
  public userPreference = null;
  public isPwa = false;
  footerLabel: number;
  footerLabel1: number;
  footerLabel2: number;
  path: Array<any> = [];
  public matcher = new ErrorStateMatcherService();
  languages = [
    { code: 'en', label: 'English', tooltip: 'English' },
    { code: 'ar', label: 'العربية', tooltip: 'Arabic' },
    { code: 'id', label: 'Bahasa Indonesia', tooltip: 'Indonesian' },
    { code: 'th', label: 'ไทย', tooltip: 'Thai'},
    { code: 'fr', label: 'Français', tooltip: 'French'},
    { code: 'pt', label: 'Português', tooltip: 'Portuguese' }
  ];
  selectedLang = 'en';
  isResendDisabled: boolean = true;
  resendTimer: number = 30;
  captchaStatus: boolean | null = null;
  captchaShow: boolean = true;
  captchaConfig = {
    type:2, 
    length: 5,
    cssClass: 'modern-captcha', 
    back: {
      stroke: '#b2b2b2',  // stick color
      solid: '#E0F7FA' // background
    },
    font: {
      color: '#1e8fc8', // 
      size: '36px' 
    },
    noise: {
      lines: 3, 
      dots: 100 
    }
  };
  notAutofilled = true;
  constructor(private readonly dialog: MatDialog, private readonly fb: FormBuilder, private readonly router: Router, public toastr: AppToastService,
    private readonly common: CommonService, private readonly errorService: ErrorService, private readonly cookieService: CookieService, @Inject(LOCALE_ID) public localeId: string,
    private readonly recaptchav3Service : ReCaptchaV3Service ,private readonly breakpointObserver: BreakpointObserver,
    public pwaDetectionService : PwaDetectionService, public activeRoute : ActivatedRoute, public captchaService: NgxCaptchaService,private readonly translate:TranslateService,
    private readonly cookieConsentService: CookieConsentService, private readonly colorThemeService : ColorThemeService , private firebaseService : FireBaseServiceService,
    private readonly mfaService: MfaService) {

    this.buildForm();
    if (window.innerWidth <= 1400) {
      this.footerLabel = 22;
      this.footerLabel1 = 3;
      this.footerLabel2 = 3;
    } else {
      this.footerLabel = 22;
      this.footerLabel1 = 3
      this.footerLabel2 = 3;
    }
  }
  
  changeLanguage(lang: string) {
    this.selectedLang = lang;
    localStorage.setItem(btoa('locale'), lang);
    this.translate.use(lang)
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if(this.nameInput) {
      this.nameInput.nativeElement.focus();
    }
    });
    setTimeout(() => {
      if (this.userNameInput.nativeElement.classList.contains('cdk-text-field-autofilled')) {
        this.notAutofilled = false;   
      }
      else{
        this.notAutofilled = true; 
      }
    }, 500);
  }
  ngOnInit() {
    if(environment.languages) {
      this.languages = environment.languages;
    }
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.pushState(null, '', location.href);
    };
    this.isPwa = this.pwaDetectionService.isPwa();     
    this.breackPoint()
    this.currentYear = new Date().getFullYear();
    if (window.location.hostname.includes("max")) {
      this.customerName = "max"
    }
    if (window.location.hostname.includes("apollo")) {
      this.customerName = "apollo"
    }
    if (window.location.hostname.includes("medanta")) {
      this.customerName = "medanta"
    }
    if (window.location.hostname.includes("hw.trackerwave.com")) {
      this.customerName = "hw"
    }
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn"
    }
    if (window.location.hostname.includes("manipal")) {
      this.customerName = "manipal"
    }
    if (window.location.hostname.includes("kch.trackerwave.com")) {
      this.customerName = "kch"
    }
    if (window.location.hostname.includes("aig") || window.location.hostname.includes("10.10.100.236")) {
      this.customerName = "aig"
    }
    if (window.location.hostname.includes("sishya")) {
      this.footerBar = false;
      this.customerName = "sishya"
    }
    if (window.location.hostname.includes("acehazmat")) {
      this.footerBar = false;
      this.customerName = "acehazmat"
    }
    this.updateCookieConsent()
    localStorage.setItem(btoa('lang'), this.localeId);
    if(localStorage.hasOwnProperty(btoa('locale'))) {
      this.changeLanguage(localStorage.getItem(btoa('locale')))
    }
    let enableCaptcha = localStorage.getItem(btoa('enableCaptcha'))
    if(enableCaptcha != null && enableCaptcha == "1") {
      this.createCaptchaToken();
    }
    this.userPreference = this.common.userPreference;
    this.dialog.closeAll();
    this.checkQeuryParam()
    const  facilityId = localStorage.getItem(btoa('facilityId'));
    if(facilityId){
    this.colorThemeService.loadTheme(true);
    }
  }
  switchLanguage(language: string) {
    localStorage.setItem(btoa('lang'), language);
  }
  resetCaptcha() {
    this.captchaConfig = { ...this.captchaConfig };
  }

  //mob 
  breackPoint(){
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((state: BreakpointState) => {
     if (state.matches) {
          this.oviNavOpen = false;
          this.oviNavMode = 'over';
        } else {
          this.oviNavOpen = true;
          this.oviNavMode = 'side';
        }
      });
}
  // Read COOKIES from trackerwave site

  public validateCookiesandLogin() {
    if (this.cookieService.get('accessToken') && this.cookieService.get('refreshToken') && this.cookieService.get('user')) {
      const user = JSON.parse(this.cookieService.get('user'));
      localStorage.setItem(btoa('user_token'), this.cookieService.get('accessToken'));
      localStorage.setItem(btoa('refreshToken'), this.cookieService.get('refreshToken'));
      localStorage.setItem(btoa('current_user'), user.firstName + ' ' + user.lastName);
      localStorage.setItem('customerId', user.facilityId ? user.customerId : ''); // ZmFjaWxpdHlJZA== LOCAL
      localStorage.setItem('regionId', user.facilityId ? user.regionId : ''); // ZmFjaWxpdHlJZA== LOCAL
      localStorage.setItem(btoa('facilityId'), user.facilityId ? user.facilityId : '');
      localStorage.setItem('userlevel', user.roles.length ? user.roles[0].id : '0');
      localStorage.setItem('roleId', user.roles.length ? user.roles[0].roleCode : null);
      localStorage.setItem(btoa('session_time'), this.sessionTime);
    }

  }
  public buildForm() {
    this.loginForm = this.fb.group({
      'username': ['', [Validators.required]],
      'password': ['', [Validators.required]],
      'patientName': [null],
      'mobileNo': [null,[Validators.required,Validators.pattern(/(^[0-9]{10}$)/)]],
      'verifyOtp' : [null,[Validators.required,Validators.pattern(/(^[0-9]{6}$)/)] ],
      'autoComplete': [null]
       
    });
    this.resetForm = this.fb.group({
      'oldPassword': ['', [Validators.required]],
      'newPassword': ['', [Validators.required]],
      'cnfrmNewPassword': ['', [Validators.required]],
    }, { validator: PasswordValidation.MatchPassword }
    );


    this.forgetForm = this.fb.group({
      'otp': ['', [Validators.required, Validators.pattern(/^-?(0|[0-9]\d*)?$/)]],
      'newPassword': ['', [Validators.required]],
      'cnfrmNewPassword': ['', [Validators.required]],
    }, { validator: PasswordValidation.MatchPassword }
    );
    this.loginForm.reset();
  }

  async onSubmit() {
    this.roleCode = null;
    let enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
    localStorage.clear();
    localStorage.setItem(btoa('lang'), this.localeId);
    localStorage.setItem(btoa('locale'), this.selectedLang);
    localStorage.setItem('cookiesAccepted', enabledCookie);
    this.submitted = true;
    if (this.loginForm.controls.username.invalid || this.loginForm.controls.password.invalid) {
      return;
    }

    this.loading = true;
    this.loginModel = new LoginModel(null, null, null, null);
    this.loginModel.username = this.loginForm.controls['username'].value;
    this.loginModel.password = this.loginForm.controls['password'].value;
    this.loginModel.password = this.common.encryptData(this.loginModel.password);    
    this.loginModel.isUserPreference = true;
    this.loginModel.recaptchaResponse = this.enableCaptcha ? this.captchaToken : null;
    try {
     await   this.firebaseService.initFCM();
    } catch (e) {
      console.log('FCM init failed', e);
    }
    this.common.login(this.loginModel).subscribe(
      (iresult) => {
        if (iresult.statusCode === 1) {
        this.enableCaptcha = false;
        this.captchaToken = null;
        if (this.cookieConsentService.hasUserConsented()) {
          this.cookieConsentService.enableCookies();
        }

        // MFA gate: driven by loginConfig.mfa from API response
        const mfaConfig = iresult.results?.loginConfig?.mfa;
        const userRole = iresult.results?.user?.roles?.[0]?.roleCode;
        const isMfaRequired = mfaConfig?.isEnabled && mfaConfig?.roles?.includes(userRole);
        this.mfaIsConfigured  = iresult?.results?.mfaConfigured ?? false
        if (isMfaRequired) {
          this.pendingLoginResult = iresult;
          this.mfaUsername = this.loginModel.username || '';
          this.mfaOtpAuthUrl = mfaConfig?.otpAuthUrl ? this.updateOtpAuthUrl(mfaConfig.otpAuthUrl, this.loginModel.username,iresult.results.mfaSecret): null; 
          this.mfaSecret = mfaConfig?.secret ?? null;
          this.loading = false;
          this.loginFlag = false;
          this.showMfa = true;
          return;
        }

        this.completeLogin(iresult);
        } else {
          if(this.enableCaptcha) {
            this.createCaptchaToken()
          }
          const message = iresult.message;
          this.errorService.error(message);
          this.toastr.clear();
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
        let message = error.error.message;
        if(error.error.errorCode == '401') {
          message = "Unauthorized, Please try again..."
          this.createCaptchaToken();      
        }
        this.toastr.clear();
        this.errorService.error(message);
      }
    );
  }
  private completeLogin(iresult: any): void {
    localStorage.setItem(('notify_alert'), 'true');
    localStorage.removeItem(btoa('enableCaptcha'));
    localStorage.setItem(btoa('user_token'), iresult.results.accessToken);
    if (iresult.results.hasOwnProperty('loginId')) {
      localStorage.setItem(btoa('loginId'), iresult.results.loginId);
    }
    if (iresult.results.hasOwnProperty('isPasswordExpired') && !iresult.results.isPasswordExpired) {
      const permission = JSON.stringify(iresult.results.permissions);
      const checkPermission = iresult.results.permissions;
      if (permission !== '{}' && checkPermission['button'].length > 0 && checkPermission['menuItems'].length > 0 && checkPermission['menu'].length > 0) {
        if (iresult.results.hasOwnProperty('user') && iresult.results.user) {
          this.roleCode = iresult.results.user.roles.length ? iresult.results.user.roles[0].roleCode : null;
        }
        localStorage.setItem(btoa('user_token'), iresult.results.accessToken);
        if (iresult.results.user.lastName != null) {
          localStorage.setItem(btoa('current_user'), iresult.results.user.firstName + ' ' + iresult.results.user.lastName);
        } else {
          localStorage.setItem(btoa('current_user'), iresult.results.user.firstName);
        }
        localStorage.setItem(btoa('session_time'), this.sessionTime);
        localStorage.setItem(btoa('refreshToken'), iresult.results.refreshToken);
        localStorage.setItem('permission', permission);
        localStorage.setItem(btoa('reset'), iresult.results.mustChangePassword);
        localStorage.setItem('userlevel', (iresult.results.user.roles.length ? iresult.results.user.roles[0].id : '0'));
        localStorage.setItem('roleId', (iresult.results.user.roles.length ? iresult.results.user.roles[0].roleCode : null));
        localStorage.setItem('customerId', iresult.results.user.customerId);
        localStorage.setItem('regionId', iresult.results.user.regionId);
        localStorage.setItem(btoa('facilityId'), iresult.results.user.facilityId);
        localStorage.setItem(btoa('userId'), iresult.results.user.id);
        localStorage.setItem(btoa('externalCustomerId'), iresult.results.user.externalCustomerId);
        localStorage.setItem(btoa('externalRegionId'), iresult.results.user.externalRegionId);
        localStorage.setItem(btoa('externalfacilityId'), iresult.results.user.externalfacilityId);
        localStorage.setItem(btoa('tokenEnrollFlow'), 'true');
        if (iresult.results?.loginConfig?.healthcheck?.tokenEnrollFlow?.enabled) {
          localStorage.setItem(btoa('tokenEnrollFlow'), iresult.results?.loginConfig?.healthcheck?.tokenEnrollFlow?.enabled);
        }
        localStorage.setItem(btoa('departmentId'), iresult.results.user.departmentId);
        if (iresult.results.hasOwnProperty('userPreferences') && iresult.results.userPreferences !== null) {
          this.common.userPreference = iresult.results.userPreferences;
          this.checkUserPreference(iresult.results.userPreferences);
        }
        if (iresult?.results?.user?.entityDepartmentLinks?.length > 0) {
          const userdepartmentIds = iresult.results.user.entityDepartmentLinks.map(u => u.departmentId);
          localStorage.setItem(btoa('departmentIds'), userdepartmentIds);
        }
        this.toastr.clear();
      } else {
        this.errorService.error('User does not have access credential');
        this.toastr.clear();
        this.loading = false;
      }
    } else {
      this.resetPassword = true;
      this.loading = false;
      this.loginFlag = false;
    }
  }

  onMfaVerified(): void {
    // this.showMfa = false;
    this.completeLogin(this.pendingLoginResult);
    this.pendingLoginResult = null;
  }

  onMfaCancelled(): void {
    this.showMfa = false;
    this.loginFlag = true;
    this.pendingLoginResult = null;
    this.mfaUsername = '';
    this.mfaIsConfigured = false;
    this.mfaOtpAuthUrl = null;
    this.mfaSecret = null;
    this.loading = false;
  }

  createCaptchaToken() {
    this.enableCaptcha = true;
    localStorage.setItem(btoa('enableCaptcha'), "1");
    this.recaptchav3Service.execute('importantAction')
      .subscribe((token: any) => {
        this.captchaToken = token;
    });
  }
  getVisitorInfo(token, id) {
    let payload = {
      'entity': 'VISITOR',
      'gtk' : token,
    }
    this.common.getGuestInfo(payload).subscribe(res => {
      if(res.statusCode == 1) {
        let facilityName = res.results.customerName + ', ' +  res.results.regionName + ', ' + res.results.facilityName;
        localStorage.setItem(btoa('authCode'), res.results.authCode); // dXNlcl90b2tlbg==
        localStorage.setItem(btoa('current_user'), res.results.name)
        localStorage.setItem(btoa('customer'), facilityName);
        localStorage.setItem('customerId', res.results.customerId);
        localStorage.setItem('regionId', res.results.regionId);
        localStorage.setItem(btoa('facilityId'), res.results.facilityId);
        localStorage.setItem(btoa('uid'), res.results.uid)
        localStorage.setItem(btoa('guestInfo'), JSON.stringify(res.results));
        this.router.navigate(['web/action'], { queryParams: { vid : res.results.uid, nc : this.getEncryptTime()}  })         
      }      
    });
  }
  getEncryptTime() {
    let timestamp = new Date().getTime()
    return btoa(timestamp.toString());
  }
  getGuestInfo(token) {
    let payload = {
      'entity': this.isPatient ? 'UNREGISTERED_PATIENT' : 'GUEST_USER',
      'entityName' : this.isPatient ? this.loginForm.controls.patientName.value : 'GUEST USER',
      'gtk' : token,
      'mobileNumber': this.isPatient ? this.loginForm.controls.mobileNo.value : null, 
    }
    this.common.getGuestInfo(payload).subscribe(res => {
      if(res.statusCode == 1) {
        let facilityName = res.results.customerName + ', ' +  res.results.regionName + ', ' + res.results.facilityName;
        localStorage.setItem(btoa('authCode'), res.results.authCode); // dXNlcl90b2tlbg==
        localStorage.setItem(btoa('current_user'), res.results.name)
        localStorage.setItem(btoa('customer'), facilityName);
        localStorage.setItem('customerId', res.results.customerId);
        localStorage.setItem('regionId', res.results.regionId);
        localStorage.setItem(btoa('facilityId'), res.results.facilityId);
        if(this.isPatient == false) {
          localStorage.setItem(btoa('uid'), res.results.uid)
          localStorage.setItem(btoa('guestInfo'), JSON.stringify(res.results));
        }
        if(res.results.hasOwnProperty('locationId') && res.results.locationId) {
          localStorage.setItem('locationId', res.results.locationId);
          let locationId = res.results.locationId
          if(this.isPatient) {
            localStorage.setItem(btoa('mobileNo'),res.results.mobileNumber)
            localStorage.setItem(btoa('guestInfo'), JSON.stringify(res.results));
            localStorage.setItem(btoa('current_user'), this.loginForm.controls.patientName.value ? this.loginForm.controls.patientName.value : 'Patient')
            localStorage.setItem(btoa('patientId'), res.results.uid)
            this.router.navigate(['web/action'], { queryParams: { lid: locationId, nc : this.getEncryptTime() }  }) 
          } else {
            this.router.navigate(['web/action'], { queryParams: { lid: locationId, nc : this.getEncryptTime() }  }) 
          }
        }
        if(this.params.hasOwnProperty('aid')) {
          localStorage.setItem('assetSerial', res.results.assetId);
          this.router.navigate(['web/action'], { queryParams: { aid: res.results.assetId, nc : this.getEncryptTime() }  }) 
        }          
      }      
    });
  }
  checkUserPreference(userPreference) {
    if (userPreference !== null) {
      if (userPreference.hasOwnProperty('userFacility')) {
        const userFacility = userPreference.userFacility.value;
        const selectedFacility = userFacility.split('_', 3);
        localStorage.setItem('customerId', selectedFacility[0]);
        localStorage.setItem('regionId', selectedFacility[1]);
        localStorage.setItem(btoa('facilityId'), selectedFacility[2]);
      }

      if (userPreference.hasOwnProperty('fullscreenMode')) {
        if (userPreference.fullscreenMode.value === 'true') {
          if (screenfull && screenfull.enabled) {
            screenfull.toggle();
          }
        }
      } else {
        if (screenfull && screenfull.enabled) {
          screenfull.toggle();
        }
      }
      if(this.isPwa) {
        if(this.params && (this.params.hasOwnProperty('lid') || this.params.hasOwnProperty('aid'))) {
          if(this.params.hasOwnProperty('lid')) {
            let locationId = this.params.lid.slice('2')
            this.router.navigate(['web/action'], { queryParams: { lid: locationId, nc : this.getEncryptTime() }  }) 
          }
          if(this.params.hasOwnProperty('aid')) {
            this.router.navigate(['web/action'], { queryParams: { aid: this.params.aid, nc : this.getEncryptTime() }  }) 
          }
        } else {
          if(this.roleCode == 'RO-RD') {
            this.router.navigate(['/room-display'], { queryParams: { nc : this.getEncryptTime() }});
          } else if (this.roleCode == 'RO-SLW') {
            this.router.navigate(['/web/wheelchair-request'], { queryParams: { nc : this.getEncryptTime() }});
          } else {
            this.router.navigate(['/web'], { queryParams: { nc : this.getEncryptTime() }});
          }
        }
      } else {
        if(this.params && (this.params.hasOwnProperty('lid') || this.params.hasOwnProperty('aid'))) {
          localStorage.setItem('customerId', this.params.cus);
          localStorage.setItem('regionId', this.params.reg);
          localStorage.setItem(btoa('facilityId'), this.params.fid);
          if(this.params.hasOwnProperty('lid')) {
            let locationId = this.params.lid.slice('2')
            this.router.navigate(['web/action'], { queryParams: { lid: locationId, nc : this.getEncryptTime() }  }) 
          }
          if(this.params.hasOwnProperty('aid')) {
            this.router.navigate(['web/action'], { queryParams: { aid: this.params.aid, nc : this.getEncryptTime() }  }) 
          }
        } else {
          if(this.roleCode == 'RO-RD') {
            this.router.navigate(['/room-display'], { queryParams: { nc : this.getEncryptTime() }});
          } else if (this.roleCode == 'RO-SLW') {
            this.router.navigate(['/web/wheelchair-request']);
          } else {
          if (userPreference.hasOwnProperty('landingPage')) {
            this.router.navigate([userPreference['landingPage'].value], { queryParams: { nc : this.getEncryptTime() }});
          } else {
            this.router.navigate(['/ovitag'], { queryParams: { nc : this.getEncryptTime() }});
          }
          }
        }
      }
    }
  }
  checkQeuryParam() {
    this.activeRoute.queryParams.subscribe(params => {  
      this.params = params;
      this.isPatient = false;
      if(params.hasOwnProperty('typ') && params.typ == 'PATPR') {
        this.updateCookieConsent();
        this.isPatient = true;
        this.captchaService.captchStatus.subscribe((status) => {
          this.captchaStatus = status;
          if (status === false) {
            this.resetCaptcha();
          } else if (status == true) {
           setTimeout(() => {
            this.captchaShow = false;
           },500); 
          }
        });
      }
      if(params.hasOwnProperty('gtk') && (params.hasOwnProperty('typ') && params.typ == 'VST')) {
        this.updateCookieConsent();
        this.getVisitorInfo(params['gtk'], params['id'])
      }
      if(params.hasOwnProperty('gtk') && !(params.hasOwnProperty('typ') && (params.typ == 'PATPR' || params.typ == 'VST'))) {
        this.updateCookieConsent();        
        this.getGuestInfo(params['gtk'])        
      }
    });
  }
  updateCookieConsent() {
    let enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
    localStorage.clear();
    localStorage.setItem('cookiesAccepted', enabledCookie);    
  }  

  Sendbutton(action: string): void {
    this.loading = true;
    this.sendotp = true;
    
    let name = this.loginForm.controls.patientName.value;
    let phoneNumber = this.loginForm.controls.mobileNo.value;
    let facilityId = this.params.fid;
    this.common.sendOTP(name, phoneNumber, facilityId).subscribe(
      res => {
        this.loading = false;
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          if (action === 'sent' || action === 'resent') {
            this.startResendTimer();
          }
        }
      },
      error => {
        this.loading = false;
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }
  startResendTimer(): void {
    this.isResendDisabled = true;
    this.resendTimer = 30; 

    const timer$ = interval(1000).pipe(take(this.resendTimer));
    timer$.subscribe({
      next: () => this.resendTimer -= 1,
      complete: () => this.isResendDisabled = false,
    });
  }

  VerifyOTP() {
    let otpcode = this.loginForm.controls.verifyOtp.value
    let phoneNumber = this.loginForm.controls.mobileNo.value;
    this.common.verifyOTP(otpcode, phoneNumber).subscribe(res => {
      if (res.statusCode === 1) {
        if (res.results.hasOwnProperty('accessToken')) {
          this.sessionTime = (new Date().getTime() + (1 * 60 * 60 * 1000)).toString();
          localStorage.setItem(btoa('user_token'), res.results.accessToken); // dXNlcl90b2tlbg==
          localStorage.setItem(btoa('refreshToken'), res.results.refreshToken); // cmVmcmVzaFRva2Vu
          localStorage.setItem(btoa('current_user'), this.loginForm.controls.patientName.value ? this.loginForm.controls.patientName.value : 'Patient')
          localStorage.setItem(btoa('patientId'), res.results.id)

          localStorage.setItem(btoa('session_time'), this.sessionTime); // c2Vzc2lvbl90aW1l
          localStorage.setItem('customerId', this.params.cus); // ZmFjaWxpdHlJZA== LOCAL
          localStorage.setItem('regionId', this.params.reg); // ZmFjaWxpdHlJZA== LOCAL
          localStorage.setItem(btoa('facilityId'), this.params.fid); // ZmFjaWxpdHlJZA== LOCAL

          if(this.params.hasOwnProperty('lid')) {
            localStorage.setItem('locationId', this.params.lid);
            let locationId = this.params.lid.slice('2')
            this.router.navigate(['web/action'], { queryParams: { lid: locationId, nc : this.getEncryptTime() }  }) 
          }
          if(this.params.hasOwnProperty('aid')) {
            this.router.navigate(['web/action'], { queryParams: { aid: this.params.aid, nc : this.getEncryptTime() }  }) 
          }          
        }
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });

  }
  public passwordReset() {
      
    this.resetModel = new ResetModel(null, null);
    this.resetModel.oldPassword = this.resetForm.controls['oldPassword'].value;
    this.resetModel.newPassword = this.resetForm.controls['newPassword'].value;
    this.common.changePassword(this.resetModel).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.resetPassword = false;
          this.loginFlag = true;
          this.toastr.success('Success', `${result.message}`);
        }
        
      },
      error => {
         this.toastr.error('Error', `${error.error.message}`);
        this.loading = false;
      }
    );
}
  forgotPasswordDialog() {
    this.common.forgetPassword(this.loginForm.value.username).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.loading = false;
          this.loginFlag = false;
          this.forgetPassword = true;
          this.toastr.success('Success', `${result.message}`);
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
        this.loginFlag = false;
        this.forgetPassword = true;
        this.loading = false;
        // SONARQUBE-Simplify the expression.
      }
      );
      this.forgetForm.reset();
  }
  public passwordForget(){
    this.forgetModel = new ForgetModel(null, null,null);
    this.forgetModel.newPassword = this.common.encryptData(this.forgetForm.controls['newPassword'].value);
    this.forgetModel.email = this.loginForm.value.username;
    this.forgetModel.otpCode = this.forgetForm.controls['otp'].value;
    this.common.resetPassword(this.forgetModel).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.forgetPassword = false;
          this.loginFlag = true;
          this.toastr.success('Success', `${result.message}`);
        }
        
      },
      error => {
         this.toastr.error('Error', `${error.error.message}`);
        this.loading = false;
      }
    );

  }
  loginDialog(){
    this.forgetPassword = false;
    this.resetPassword =false;
    this.loginFlag = true;
    this.resetForm.reset();
    this.forgetForm.reset();
  }

  privacyDialog() {
    window.open('https://trackerwave.com/privacy.html', '_blank', 'noopener,noreferrer');
  }

  termsDialog() {
    this.dialog.open(TermsComponent, {
    panelClass: [ 'small-popup'], disableClose: true
    });
  }

  supportDialog() {
    this.dialog.open(CreateTicketComponent, {
    data: 'newuser', panelClass: [ 'medium-popup'], disableClose: true
    });
  }
  updateOtpAuthUrl( otpAuthUrl: string, email: string,mfaSecret: string): string {
    if (!otpAuthUrl) return otpAuthUrl;
    const url = new URL(otpAuthUrl);
    const decodedPath = decodeURIComponent(url.pathname);
    const [issuer] = decodedPath.slice(1).split(":");
    url.pathname = encodeURIComponent(`${issuer}:${email}`);
    url.searchParams.set("secret", mfaSecret);
    return url.toString();
  }
}


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})

export class ForgotPasswordComponent {
  forgotpasswordForm: FormGroup;
  submitted = false;
  hide = false;
  hide1 = false;
  hideotp = false;
  code: boolean;

  public isDisabled = false;
  public hide_main_block = false;
  public success_dialog_box = false;

  loading = false;
  resendOTP = false;
  public isActive = false;

  spinnerButtonOptions: any = {
    active: false,
    text: 'Spinner Button',
    spinnerSize: 18,
    raised: true,
    buttonColor: 'primary',
    spinnerColor: 'accent'
  };


  public forgotPasswordModel: ForgotPasswordModel;

  public usernameorphone: string;
  public email: string;
  public password: string;
  public newPassword: string;
  public passwordnew: string;
  public passwordcnf: string;
  public resPassword;
  public errorMsg: string = null;
  public OTPErrorMsg: string = null;


  constructor(private readonly fb: FormBuilder, private readonly dialog: MatDialog,
    public thisDialogRef: MatDialogRef<ForgotPasswordComponent>, public commonService: CommonService,
    public toastr: AppToastService, public snackbar: MatSnackBar, private readonly errorService: ErrorService, ) {

    this.buildForm();
    
    this.forgotpasswordForm.get('code')?.valueChanges.subscribe(v => {
      this.code = v;
    });

  }

  onSubmit() {
    this.submitted = true;
    if (this.forgotpasswordForm.invalid) {
      return;
    }
  }


  public buildForm() {
    this.forgotpasswordForm = this.fb.group({
      'usernameorphone': ['', [Validators.required, Validators.minLength(13),
         Validators.pattern(/^(\+91[\-\s]?)?[6789]\d{9}$|(^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$)/)]],
       // Email & Phone validation
      'password': ['', [Validators.required]],
      'code': [this.code ? this.code : '', [Validators.required, Validators.pattern(/^-?(0|[0-9]\d*)?$/)]], // OTP validation
      'newPassword': ['', [Validators.required]],
    },
      { validator: this.checkPasswords });
  }
  checkPasswords(group: FormGroup) { // here we have the 'passwords' group
    const pass = group.controls.password.value;
    const confirmPass = group.controls.newPassword.value;
    return pass === confirmPass ? null : { notSame: true };
  }

  public forgetPassword(data: any) {
    this.hide_main_block = true;
    this.isDisabled = true;
    this.loading = true;
    // need to check the below to hide or show
    this.hideotp = true;
    this.resendOTP = true;

    this.commonService.forgetPassword(this.forgotpasswordForm.value.usernameorphone).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.hideotp = true;
          this.resendOTP = true;
          this.loading = false;
          this.toastr.success('Success', `${result.message}`);
          this.loading = false;
          this.hide_main_block = true;
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.loading = false;
        this.isDisabled = false;
        // SONARQUBE-Simplify the expression.
        if (this.errorMsg) {
          this.hide_main_block = false;
        } else {
          this.hide_main_block = true;
        }
      }
    );
  }


  // We have to inform the user with a snack bar, when the OTP get expires or Invalid or a wrong one!

  public verifyCode() {
    this.hide_main_block = true;
    this.resendOTP = true;

    this.forgotPasswordModel = new ForgotPasswordModel(null, null, null);
    this.forgotPasswordModel.code = this.forgotpasswordForm.controls['code'].value;
    this.forgotPasswordModel.username = this.forgotpasswordForm.controls['usernameorphone'].value;
    this.forgotPasswordModel.newPassword = this.forgotpasswordForm.controls['password'].value;
    this.commonService.resetPassword(this.forgotPasswordModel).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.toastr.success('Success', `${result.message}`);
          this.thisDialogRef.close('confirm');
          this.success_dialog_box = true;
        }
      },
      error => {
        const message = 'Invalid OTP or Password';
        this.OTPErrorMsg = message;
        this.loading = false;
      }
    );
  }

  // Validation for Phone #
  keyPress(event: any) {
    const pattern = /[0-9\+\-\ ]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode !== 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
  }


  sendOtp() {
    this.hide = true;
  }
}
