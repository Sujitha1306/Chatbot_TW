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
import { Component, Inject, OnInit, ViewEncapsulation,  } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CommonService, ConfigurationService, HospitalService, UpdatePasswordModel } from '../../..';
import { FormGroup, FormBuilder, Validators, ValidationErrors, AsyncValidatorFn, AbstractControl,  } from '@angular/forms';
import * as screenfull from 'screenfull';
import { EditProfile, EditUser } from './add-profile.model';
import { PasswordValidation } from '../password-validators';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../create-user/create-user.component';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { AppToastService } from '../../../services/toaster.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



@Component({
    selector: 'app-add-profile',
    templateUrl: './add-profile.component.html',
    styleUrls: ['./add-profile.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class AddProfileComponent {

    // public createProfile: CreateProfile;
    public editProfile: EditProfile;

    public profileForm: FormGroup;
    loading = false;
    submitted = false;
    url = '';
    public imageData: any = '/assets/images/sample1.png';
    isVisible = true;

    show = false;
    buttonName = 'Edit';
    hide: any;
    edit: false;

    public username: string;
    public phone: string;
    public email: string;
    public user: any;

    constructor(private readonly form: FormBuilder,
        private readonly router: Router,
        private readonly commonService: CommonService,
        private readonly hospitalServices: HospitalService,
        public toastr: AppToastService,
        public snackbar: MatSnackBar,
        public thisDialogRef: MatDialogRef<any>,
        //   private errorService: ErrorService
    ) {
        this.buildForm();
        this.getCurrentUser();

    }


    showVerify() {
        // alert ('Checking...........!!!!!!!!!!!!!')
        this.isVisible = true;
    }

    public buildForm() {
        this.profileForm = this.form.group({
            firstName: ['', [Validators.required]],
            id: [''],
            address: [''],
            email: [''],
            // email: ['', Validators.required, Validators.email],
            // phoneNumber: ['', [Validators.required, Validators.pattern('[6789][0-9]{9}')]],
            phoneNumber: ['', [Validators.required, Validators.pattern('[6789][0-9]{9}')]],
        });
    }

    public editUser() {

        // alert('Current ID :  '+this.profileForm.value.id)

        this.editProfile = new EditProfile(null, null, null, null, null);

        this.editProfile.id = this.profileForm.controls['id'].value;
        this.editProfile.firstName = this.profileForm.controls['firstName'].value;
        this.editProfile.address = this.profileForm.controls['address'].value;
        this.editProfile.phoneNumber = this.profileForm.controls['phoneNumber'].value;
        this.editProfile.email = this.profileForm.controls['email'].value;
        // console.log(this.editProfile)
        // alert(JSON.stringify(this.editProfile));

        this.hospitalServices.editUser(this.editProfile).subscribe(res => {
            // this.snackbar.open(`${res.message}`, 'Close', {
            //   duration: 3000,
            // });
            this.toastr.success('Success', `${res.message}`);
            this.thisDialogRef.close('confirm');
        },
            error => {
                console.log('Error ---------->', error);
                this.toastr.error('Error', `${error.error.message}`);
            });
    }

    getCurrentUser() {
        this.commonService.getCurrentUser().subscribe(res => {
            const user = res.results;
            this.profileForm.reset(
                {
                    firstName: user.firstName,
                    id: user.id,
                    address: user.address,
                    email: user.email,
                    phoneNumber: user.phoneNumber
                }
            );
            // console.log(this.user)
        });
    }

    onSubmit() {

    }


    uploadImage($event): void {
        this.readImage($event.target);
    }
    readImage(inputValue: any): void {
        const file: File = inputValue.files[0];
        const uploadImage: FileReader = new FileReader();
        uploadImage.onloadend = (e) => {
            this.imageData = uploadImage.result;
        };
        uploadImage.readAsDataURL(file);
    }
}

export function existingMobileNumberValidator(hospitalService: HospitalService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return hospitalService.searchPhoneNo(control.value).pipe(map(
      res => {
        return (res && res.results && res.results.isAlreadyExists) ? {'isAlreadyExists': true} : null;
      }
    ));
  };
}

@Component({
    selector: 'app-view-profile',
    templateUrl: './view-profile.component.html',
    styleUrls: ['./view-profile.component.scss'],
   providers: [DatePipe,
           { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
           { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
         ],
})

export class ViewProfileComponent implements OnInit {
    selectedOption: string = 'profile';
    public viewProfileForm: FormGroup;
    public passwordForm: FormGroup;
    public customerList: any;
    public regionList: any;
    public facilityList: any;
    public roleList: any[] = null;
    userid = null;
    public userData  = null;
    public disableClose = false;
    departmentListRes: any[] = null;
    public edituser: EditUser;
    public genderList: any[] = null;
    public enablePhoneNumber = false;
    public countryOptions: Observable<any>;
    public countrycodeList = [];
    public updatePasswordModel: UpdatePasswordModel;
    public passwordValPattern: any = /^(?=(?:.*\d){1,})(?=.*[@$!%*?&]).{8,12}$/;
    public activate_btn: any = null;
    public profileImage: any = '';
    public attachFiles: any[] = [];
    public urlSafe: SafeResourceUrl;
    public base64Data: string = '';
    public fileName: string = '';
     username = localStorage.getItem(btoa('current_user'));
     departments: any = [];
     forgetPassword = false;
     entityDepartment: any = [];
        headerItems = [
          {
            key: 'profile',
            label: 'Personal Info',
            icon: 'assets/Alert/user.svg'
          },
          {
            key: 'company',
            label: 'Company Info',
            icon: 'assets/Alert/info-circle.svg'     
          },
          {
            key: 'password',
            label: 'Change Password',
            icon: 'assets/Alert/ovi-change_pssword.svg'
          }
        ];
      sectionTitles: { [key: string]: string } = {
        profile: 'Personal Info',
        company: 'Company Info',
        password: 'Change Password'
      };

    constructor(private readonly commonService: CommonService,public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog,  @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly _dateFormat: DatePipe,private readonly hospitalServices: HospitalService,public thisDialogRef: MatDialogRef<ViewProfileComponent>,private readonly router: Router,
    private readonly dateAdapter: DateAdapter<Date>, private readonly configurationServices: ConfigurationService,protected sanitizer: DomSanitizer,) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.dynamicData();
    this.buildForm()
    }

    ngOnInit() {
      if(localStorage.getItem(btoa('reset')) == 'true'){
        if (this.activate_btn.includes('BT_CHANGEPWDCLOSE')) {
          this.disableClose = false;
        } else {
          this.disableClose = true;
        }
      }
      this.commonService.getCurrentUser().subscribe(res => {
        this.userid = res.results['id']
        this.commonService.getUserLocationById(this.userid).subscribe(res => {
          this.userData = res.results;
          this.entityDepartment = res.results['entityDepartmentLinks']
          this.getCustomerList();
          this.getRoles();
          this.buildForm()
           this.profileImage = this.safeUrl(this.userData?.imageUrl)
        });
        this.commonService.getAllDepartments().subscribe(res => {
          this.departmentListRes = res.results;
        });
      });
      this.commonService.getAppTermsVerion2('CountryCode').subscribe(res => {
        this.countrycodeList = res.results;
        setTimeout(() => { this.setupCountryCodeAutocomplete() }, 500);
      });
      // this.countryOptions = this.viewProfileForm.controls['countryCode'].valueChanges.pipe(
      //   startWith(null),
      //   map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
      // );
      this.phoneNumber('disable');
      if(this.data?.routing){
        this.selectOption(this.data.key)
      }
    }


    public buildForm() {
      const alldept = [this.userData?.entityDepartmentLinks ? this.userData?.entityDepartmentLinks.map(res => res.departmentId).join(',') : '']
      const selectedDeptIds = alldept[0].split(',').map(id => +id)
      this.viewProfileForm = this.form.group({
        firstName: [this.userData?.firstName ? this.userData?.firstName : null, [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
        lastName: [this.userData?.lastName ? this.userData?.lastName : null, [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
        gender: [this.userData?.gender ? this.userData?.gender : null, [Validators.required]],
        birthDate: [this.userData?.birthDate ? new Date(this.userData?.birthDate) : null, [Validators.required]],
        email: [this.userData?.email ? this.userData?.email : null],
        phoneNumber: [this.userData?.phoneNumber ? this.getPhoneNumber(this.userData?.phoneNumber) : null, [Validators.required, Validators.pattern(/(^[0-9]{9,11}$)/)],
        this.userData?.phoneNumber == null ? existingMobileNumberValidator(this.hospitalServices) : null],
        address: [this.userData?.address ? this.userData?.address : null],
        customerName: [this.userData?.customerId ? this.userData?.customerId : null],
        regionName: [this.userData?.regionId ? this.userData?.regionId : null],
        facilityName: [this.userData?.facilityId ? this.userData?.facilityId : null],
        roleIds: [this.userData?.roleIds ? this.userData?.roleIds[0] : null],
        department: [alldept ? alldept[0] : null],
        countryCode: [this.userData?.phoneNumber ? this.userData?.phoneNumber.substring(this.userData?.phoneNumber.length - 10, -10) : '+', [Validators.required, Validators.pattern('^[+][0-9]{1,5}$')]],
      });
      this.passwordForm = this.form.group({
        'oldPassword': ['', [Validators.required]],
        'newPassword': ['', [Validators.required, Validators.pattern(this.passwordValPattern)]],
        'cnfrmNewPassword': ['', [Validators.required]],
        'otp':[]
      }, { validator: PasswordValidation.MatchPassword }
      );
      this.viewProfileForm.patchValue({
        department: selectedDeptIds
      });
    }

    selectOption(option: string) {
      if (this.disableClose && option != 'password') {
        return
      }
        this.selectedOption = option;
    }

    getCustomerList(): void {
      this.hospitalServices.getCustomerList().subscribe(res => {
        this.customerList = res.results;
      });
      if (this.userData && this.userData.facilityId) {
        this.getRegionList(this.userData.customerId);
        this.getFacilityList(this.userData.regionId);
      } else {
        this.getRegionList(localStorage.getItem('customerId'));
        this.getFacilityList(localStorage.getItem('regionId'));
      }
    }

    getRegionList(cust_id): void {
      this.hospitalServices.getRegionList(cust_id).subscribe(res => {
        this.regionList = res.results;
      });
    }

    getFacilityList(data) {
      this.hospitalServices.getFacilityList(data).subscribe(res => {
        this.facilityList = res.results;
      });
    }

  dynamicData() {
    this.configurationServices.getConfigFile('validation-config').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.passwordValPattern = dynamicColumns?.pattern.password;
      }
    });
  }

    getRoles() {
      this.commonService.getAllRole().subscribe(res => {
        this.roleList = res.results;
      });
      this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
        this.genderList = res.results;
      });
    }

    phoneNumber(type) {
      if (this.userData) {
        if ((this.data.id || this.userData.id) && type === 'disable') {
          this.enablePhoneNumber = false;
        } else {
          this.viewProfileForm.controls['countryCode'].setValue('+');
          this.viewProfileForm.controls['phoneNumber'].setValue(null);
          this.enablePhoneNumber = true;
        }
      }
    }
    
    private setupCountryCodeAutocomplete(): void {
      const control = this.viewProfileForm.get('countryCode');
      this.countryOptions = control?.valueChanges.pipe(
        startWith(control?.value || ''),
        map(value => this.filterCountryCodes(value || ''))
      );
    }

    private filterCountryCodes(value: string): any[] {
      const filterValue = value.toLowerCase();
      return this.countrycodeList.filter(country =>
        country.code.toLowerCase().includes(filterValue)
      );
    }

    getPhoneNumber(number) {
      const countryCodes = {
        2: ['+7'],
        3: ['+20', '+27', '+30', '+31', '+32', '+33', '+34', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95', '+98'],
        4: ['+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+244', '+245', '+246', '+247', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+385', '+386', '+387', '+420', '+421', '+423', '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+685', '+686', '+687', '+688', '+689', '+690', '+692', '+808', '+850', '+852', '+853', '+855', '+856', '+880', '+886', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998'],
        5: ['+5399']
      };
      for (let length in countryCodes) {
        for (let code of countryCodes[length]) {
          if (number.startsWith(code)) {
            return number.substring(parseInt(length));
          }
        }
      }
    }

    departmentinfo(id) {
      const existingIndex = this.entityDepartment.findIndex(dep => dep.departmentId === id);
      if (existingIndex !== -1) {
        this.entityDepartment[existingIndex].isActive = false;
      } else {
        const departments = {
          id: null,
          isActive: true,
          departmentId: id,
          entityType: "User"
        };
        this.entityDepartment.push(departments);
      }
      this.entityDepartment = this.entityDepartment.filter(res => !(res.id == null && res.isActive == false));
    }
    
    public editUsers(data) {
      this.edituser = new EditUser(null, null, null, null, null, null, null, null, null, null, null, null, null);
      this.edituser.id          = this.userid;
      this.edituser.firstName   = this.viewProfileForm.controls['firstName'].value;
      this.edituser.lastName    = this.viewProfileForm.controls['lastName'].value;
      this.edituser.address     = this.viewProfileForm.controls['address'].value;
      this.edituser.email       = this.viewProfileForm.controls['email'].value;
      this.edituser.gender      = this.viewProfileForm.controls['gender'].value;
      this.edituser.birthDate   = this._dateFormat.transform(this.viewProfileForm.controls['birthDate'].value, 'yyyy-MM-dd');
      this.edituser.phoneNumber = this.viewProfileForm.controls['phoneNumber'].value ? this.viewProfileForm.controls['countryCode'].value.trim() + this.viewProfileForm.controls['phoneNumber'].value : null;
      this.edituser.roleIds     = [this.viewProfileForm.controls['roleIds'].value];
      this.edituser.customerId  = this.viewProfileForm.controls['customerName'].value;
      this.edituser.regionId  = this.viewProfileForm.controls['regionName'].value;
      this.edituser.facilityId  = this.viewProfileForm.controls['facilityName'].value;
      this.edituser.entityDepartmentLinks =  this.entityDepartment
      this.hospitalServices.editUser(this.edituser).subscribe(result => {
        if (result.statusCode != 1) {
          // this.isDisabled = false;
        }
        this.toastr.success('Success', `${result.message}`);
        this.thisDialogRef.close('confirm');
       },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    }

    logout() {
      this.username = '';
      const landingPage = window.location.pathname.replace('/en', '');
      this.commonService.validateUserPreference('landingPage', landingPage);
      this.commonService.validateUserPreference('fullscreenMode', screenfull.isFullscreen);
      localStorage.clear();
      if (screenfull.isFullscreen) {
        screenfull.exit();
      }
      this.router.navigate(['/login']);
    }

  updatePassword() {
    this.updatePasswordModel = new UpdatePasswordModel(null, null, null, null);
    this.updatePasswordModel.oldPassword = this.commonService.encryptData(this.passwordForm.controls['oldPassword'].value);
    this.updatePasswordModel.newPassword = this.commonService.encryptData(this.passwordForm.controls['newPassword'].value);
    this.updatePasswordModel.otpCode = this.passwordForm.controls['otp'].value;
    if (this.forgetPassword) {
      this.commonService.resetPassword(this.updatePasswordModel).subscribe(
        (result) => {
          if (result.statusCode === 1) {
            this.forgetPassword = false;
            this.logout();
            this.toastr.success('Success', `${result.message}`);
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        }
      );
    }
    else {
      this.commonService.changePassword(this.updatePasswordModel).subscribe(
        (result) => {
          if (result.statusCode === 1) {
            this.toastr.success('Success', `${result.message}`);
            this.thisDialogRef.close('confirm');
            this.logout();
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        }
      );
    }
  }
  forgotPassword() {
    this.forgetPassword = !this.forgetPassword
    if(this.forgetPassword){
    this.commonService.forgetPassword(this.userData.userName).subscribe(
      (result) => {
        if (result.statusCode === 1) {
          this.forgetPassword = true;
          this.toastr.success('Success', `${result.message}`);
        }
      },
    );
  }
  }

    rstPswrd(data) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirmation', message: 'Are you sure you want to Reset Password?',
          buttonText: { ok: 'Yes', cancel: 'No' }, 'shiftId': this.userid, 'isRemark': 1, manageAppterm: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        let restId = { userId: this.userid }
        if (result === 'Yes') {
          this.commonService.resetPassword(restId).subscribe(res => {
            this.toastr.success('Success', 'Password Reset Successfully');
            this.logout();
          },
            error => {
              this.toastr.error('Error', 'Failed to Reset Password');
            });
        } else {
          this.dialog.closeAll();
        }
      });
    }
    fixClick() {
     console.log('')
   }  

  handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.warning('Please choose only JPEG/PNG Images!', 'Warning'
      );
      return;
    }
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const result = e.target.result as string;
      this.profileImage = result;
      this.base64Data = result.split(',')[1];
      this.handleDocumentEvent()
    };
    reader.readAsDataURL(file);
  }


  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  handleDocumentEvent() {
    this.attachFiles = [];
    this.attachFiles.push({
      documentTypeId: "DT-PG",
      fileName: this.fileName,
      fileType: "image/png",
      base64Data: this.base64Data,
      entityType: "user",
      entityId: this.userData.id,
    });
    this.commonService.saveFile(this.attachFiles).subscribe({
      next: (res) => {
        this.toastr.success('Success', `${res.message}`);
      },
      error: (err) => {
        this.toastr.error('Error', `${err.message}`);
      }
    })
  }
}

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password-component.html',
    styleUrls: ['./change-password-component.scss']
})

export class ChangePasswordComponent implements OnInit {
    public passwordForm: FormGroup;
    public updatePasswordModel: UpdatePasswordModel;
    public email: string;
    public password: string;
    public hide: boolean = false;
    public matcher = new ErrorStateMatcherService();
    public isResetPassword = false;
    username = localStorage.getItem(btoa('current_user')); // current_user

    constructor(private readonly fb: FormBuilder, private readonly dialog: MatDialog,
        public thisDialogRef: MatDialogRef<ChangePasswordComponent>, public commonService: CommonService,
        // @Inject(MAT_DIALOG_DATA) public data: any,
        public toastr: AppToastService, public snackbar: MatSnackBar, private readonly router: Router) {
    
        this.buildForm();
      }

    ngOnInit(){
        this.isResetPassword = localStorage.getItem(btoa('reset')) == 'true' ? true : false;
    }
    public buildForm(){
        
    this.passwordForm = this.fb.group({
        'oldPassword': ['', [Validators.required]],
        'newPassword': ['', [Validators.required]],
        'cnfrmNewPassword': ['', [Validators.required]],
      }, { validator: PasswordValidation.MatchPassword }
      );
    }

    logout() {
        this.username = '';
        const landingPage = window.location.pathname.replace('/en', '');
        console.log(landingPage);
    
        this.commonService.validateUserPreference('landingPage', landingPage);
        
        // full_screen_mode(userpreference start)
        this.commonService.validateUserPreference('fullscreenMode', screenfull.isFullscreen);
        // full_screen_mode(userpreference end)
    
        // this.common.userPreference = null;
    
        // if (this.cookieService.check(
        //   'landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId'))
        // )) {
        //   this.cookieService.delete('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')));
        //   this.cookieService.set('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')), landingPage);
        // } else {
        //   this.cookieService.set('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')), landingPage);
        // }
    
        //full_screen_mode_ (cookies start)
        // if (this.cookieService.check(
        //   'full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId'))
        // )) {
        //   this.cookieService.delete('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')));
        //   this.cookieService.set('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')), screenfull.isFullscreen);
        // } else {
        //   this.cookieService.set('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
        //   localStorage.getItem(btoa('userId')), screenfull.isFullscreen);
        // }
        //full_screen_mode_ (cookies end)
        // remove user from local storage to log user out
        localStorage.clear();
        if (screenfull.isFullscreen) {
          screenfull.exit();
        }
        this.router.navigate(['/login']);
    }

    public resetPassword() {
        this.updatePasswordModel = new UpdatePasswordModel(null, null,null, null);
        this.updatePasswordModel.oldPassword = this.commonService.encryptData(this.passwordForm.controls['oldPassword'].value);
        this.updatePasswordModel.newPassword = this.commonService.encryptData(this.passwordForm.controls['newPassword'].value);
        this.commonService.changePassword(this.updatePasswordModel).subscribe(
          (result) => {
            if (result.statusCode === 1) {
              this.toastr.success('Success', `${result.message}`);
              this.thisDialogRef.close('confirm');
              this.logout();
            }
          },
          error => {
             this.toastr.error('Error', `${error.error.message}`);
          }
        );
    }
   fixClick() {
     console.log('')
   }    
}
