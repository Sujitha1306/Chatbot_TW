import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LookupTermService } from '../../../lookup-term.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppToastService } from '../../../services/toaster.service';
import { CommonService, ConfigurationService, HospitalService } from '../../../services';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CreatePatient } from './patient-admit.component.model';
import { MatCheckboxChange } from '@angular/material/checkbox'
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../enroll-patient/enroll-patient.component';

export function existingUsernameValidator(hospitalService: HospitalService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return hospitalService.searchEmail(control.value).pipe(map(
      res => {
        return (res && res.results && res.results.isAlreadyExists) ? {'emailExists': true} : null;
      }
    ));
  };
}

@Component({
  selector: 'app-patient-admit',
  templateUrl: './patient-admit.component.html',
  styleUrls: ['./patient-admit.component.scss'],
  providers: [DatePipe,
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
    encapsulation: ViewEncapsulation.None
})
export class PatientAdmitComponent  implements OnInit{
public patientadmitForm: FormGroup;
public genderList: any;
public genderCode: any;
public countryOptions: Observable<any>;
public phoneMessage = null;
countrycodeList: any[] = [];
today = new Date();
isChecked:any=false;
passwordValPattern: any =  /^(?=(?:.*\d){1,})(?=.*[@$!%*?&])(?=.*[A-Z]).{8,12}$/;
hide = true;
hideConfirmPassword = true; 
public createPatient: CreatePatient;

 constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: AppToastService, private readonly commonService: CommonService, private readonly _dateFormat: DatePipe,
    public thisDialogRef: MatDialogRef<PatientAdmitComponent>,public dialog: MatDialog, private readonly hospitalServices: HospitalService,
    private readonly configurationService: ConfigurationService, private readonly lookupTermService: LookupTermService){
    }


  ngOnInit(): void {
    this.buildForm()
    this.setupEmailPasswordDependency();
    this.lookupTermService.getAppTermsVerion2Wrapper('Gender').subscribe(res => {
      this.genderList = res?.Gender ?? [];
    });
     this.lookupTermService.getAppTermsVerion2Wrapper('CountryCode').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      setTimeout(() => {this.setupCountryCodeAutocomplete()},500);
      this.getPhoneValidate(this.patientadmitForm.controls['countryCode']?.value, 'code')
    });
    
  }

   public buildForm() {
    this.patientadmitForm = this.form.group({
      firstName: [this.data?.firstName ? this.data.firstName : null,[Validators.required, Validators.pattern("^(?=.*[A-Za-z])[A-Za-z\\s'.]+$")]],    
      middleName: [this.data?.middleName ? this.data.middleName : null,],
      lastName: [this.data?.lastName ? this.data.lastName : null,],
      mobileNo: [ this.data?.mobileNumber ? this.data.mobileNumber : null, [Validators.pattern(/^[0-9]{9,12}$/), Validators.maxLength(11), Validators.minLength(9)] ],
      countryCode: [ this.data?.countryCode ? this.data.countryCode : '+91', [Validators.pattern('^[+][0-9]{1,5}$'), Validators.maxLength(4), Validators.minLength(2)] ],
      birthDate: [this.data?.birthDate ? this.data.birthDate : null],
      userCreation: [this.data?.userCreation ? this.data.userCreation : false],
      gender: [this.data?.gender ? this.data.gender : null],
      cnfrmNewPassword: [null],      
      userName: [null], 
      mainidentifier: [null],
      confirmPassword: [null]
    } ,{ validators: passwordMatchValidator() });


  }

  getGenderType(data) {
    this.genderCode = data.code;
  }

    onMobileInput() {
      const control = this.patientadmitForm.get('mobileNo');
      const value = control?.value;
      control?.markAsTouched();
      if (!value) {
        const errors = { ...control?.errors };
        delete errors['invalidPhone'];
        control?.setErrors(Object.keys(errors).length ? errors : null);
        control?.updateValueAndValidity({ emitEvent: true });
        return;
      }
      control?.updateValueAndValidity({ emitEvent: true });
      if (control?.valid) {
        this.getPhoneValidate(value, 'phone');
      }
    }

    getPhoneValidate(data, type) {
      const code = type === 'code' ? data : this.patientadmitForm.get('countryCode')?.value;
      const phone = type === 'phone' ? data : null;
      this.commonService.phoneValidate(code, phone).subscribe(res => {
        if (res.results) {
          if (type === 'code') {
            const length = res.results?.length;
            this.patientadmitForm.get('mobileNo').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
            this.patientadmitForm.get('mobileNo').updateValueAndValidity();
          } else {
            const ctrl = this.patientadmitForm.get('mobileNo');
            const errors = { ...ctrl?.errors };
            delete errors['invalidPhone'];
            ctrl?.setErrors(Object.keys(errors).length ? errors : null);
          }
        } else {
          const control = this.patientadmitForm.get('mobileNo');
          control?.setErrors({ invalidPhone: true });
          control?.markAsTouched();
          this.phoneMessage = res.message;
        }
      });
    }

    private setupCountryCodeAutocomplete(): void {
        const control = this.patientadmitForm.get('countryCode');
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

      clearInvalidCountryCode(controlName: string): void {
        const ctrl = this.patientadmitForm.get(controlName);
        const isValid = this.countrycodeList.some(c => c.code === ctrl?.value);
        if (!isValid) ctrl?.setValue(null);
      }

  onChange(event: MatCheckboxChange) {
    this.patientadmitForm.controls.userCreation.setValue(event.checked)
    this.isChecked = event.checked
    const userNameControl = this.patientadmitForm.controls.userName;
    if (event.checked === true) {
      userNameControl.setValidators([Validators.required, Validators.email]);
      userNameControl.setAsyncValidators([existingUsernameValidator(this.hospitalServices)]);
      this.patientadmitForm.controls.cnfrmNewPassword.setValidators([Validators.pattern(this.passwordValPattern)])
       this.patientadmitForm.controls.confirmPassword.setValidators([Validators.required]);
    } else {
      userNameControl.clearValidators();
      userNameControl.clearAsyncValidators();
      this.patientadmitForm.controls.cnfrmNewPassword.clearValidators()
      this.patientadmitForm.controls.confirmPassword.clearValidators(); 
    }
    userNameControl.updateValueAndValidity();
    this.patientadmitForm.controls.cnfrmNewPassword.updateValueAndValidity()
     this.patientadmitForm.controls.confirmPassword.updateValueAndValidity(); 
  }

  fixClick() {
    console.log("");
  }

  savePatient() {
    this.createPatient = new CreatePatient(null, null, null, null, null, null, null, null, null, null, null, null );
       this.createPatient.firstName = this.patientadmitForm.controls['firstName'].value;
       this.createPatient.middleName = this.patientadmitForm.controls['middleName'].value;
       this.createPatient.lastName = this.patientadmitForm.controls['lastName'].value;
       this.createPatient.birthDate = this._dateFormat.transform(this.patientadmitForm.controls['birthDate'].value, 'yyyy-MM-dd');
        if (this.genderCode === undefined) {
          this.createPatient.gender = null;
        } else {
          this.createPatient.gender = this.genderCode;
        }
       this.createPatient.countryCode = this.patientadmitForm.controls['countryCode'].value;
       this.createPatient.mobileNo = this.patientadmitForm.controls['mobileNo'].value;
       this.createPatient.canCreatePatientLogin = this.patientadmitForm.controls['userCreation'].value;
       this.createPatient.email = this.patientadmitForm.controls['userName'].value;
       this.createPatient.password = this.patientadmitForm.controls['cnfrmNewPassword'].value;
       if (this.data !== null) {
         this.createPatient.id = this.data?.id;
       }
       this.hospitalServices.savePatient(this.createPatient).subscribe(result => {
         this.toastr.success('Success', `${result.message}`);
         this.thisDialogRef.close('confirm');
       },
         error => {
           this.toastr.error('Error', `${error.error.message}`);
         });
     }

  clearUHID(event) {
    if (event.target.value === '') {
      this.patientadmitForm.reset();
    }
  }

  getUHID(value, reload = true) {
    if (value === '') {
      this.patientadmitForm.reset();
    }
    const uhid = value;
    this.commonService.getUHID(uhid, null, null, null, null).subscribe(res => {
      if (res.statusCode !== 0) {
        this.data = res.results;
        this.genderCode = this.data.gender;

        this.patientadmitForm.patchValue({
          'patientTWID': this.data.mainidentifier,
          'firstName': this.data.firstName,
          'middleName': this.data.middleName,
          'lastName': this.data.lastName,
          'gender': this.data.gender,
          'mobileNo': this.data.mobileNo,
          'birthDate': this.data.birthDate,
          'countryCode': this.data.countryCode,
          'userCreation': this.data.canCreatePatientUser,
        });

      } else {
        error => {
          this.toastr.error('Error', `${error.error.message}`);
          this.patientadmitForm.reset();
          this.data.mainidentifier = uhid;
          this.buildForm();
          this.toastr.warning('warning', `${res.message}`)
          if (res.statusCode === 0) {
            this.patientadmitForm.reset();
          }
        }
      }
    })
  }
setupEmailPasswordDependency(): void {
  const emailControl = this.patientadmitForm.get('userName');
  const passwordControl = this.patientadmitForm.get('cnfrmNewPassword');
  const confirmPasswordControl = this.patientadmitForm.get('confirmPassword');

  emailControl?.valueChanges.subscribe(emailValue => {
    if (emailValue && emailValue.trim() !== '') {
      // ✅ Email has value → password & confirmPassword become required
      passwordControl?.setValidators([
        Validators.required,
        Validators.pattern(this.passwordValPattern)
      ]);
      confirmPasswordControl?.setValidators([Validators.required]);
    } else {
      // ✅ Email cleared → remove required from both
      passwordControl?.setValidators([
        Validators.pattern(this.passwordValPattern)
      ]);
      confirmPasswordControl?.clearValidators();
    }

    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
  });
}

}


export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('cnfrmNewPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const confirmErrors = group.get('confirmPassword')?.errors;
      if (confirmErrors) {
        delete confirmErrors['passwordMismatch'];
        group.get('confirmPassword')?.setErrors(
          Object.keys(confirmErrors).length ? confirmErrors : null
        );
      }
      return null;
    }
  };
}

