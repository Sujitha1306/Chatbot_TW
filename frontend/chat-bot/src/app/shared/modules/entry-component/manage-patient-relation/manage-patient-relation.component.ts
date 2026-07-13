import { Component, Inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService, HospitalService } from '../../../services';
import { DatePipe } from '@angular/common';
import { LookupTermService } from '../../../lookup-term.service';
import { ApptermsService } from '../../../services/appterms.service';
import { Observable, of, timer } from 'rxjs';
import { catchError, first, map, switchMap } from 'rxjs/operators';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-manage-patient-relation',
  templateUrl: './manage-patient-relation.component.html',
  styleUrls: ['./manage-patient-relation.component.scss'],
  standalone:false
})
export class ManagePatientRelationComponent {
  contactForm!: FormGroup;
  searchPatientlist: any[] = [];
  patientListItems: any[] = [];
  selectedPatient: any = null;
  relationshipList = [];
  public phoneMessage = null;
  genderList = [];
  countrycodeList = []
  phoneNoValidation: any = /^[0-9]{8,13}$/;
  // Add these two properties in the class
hidePassword = true;
hideConfirmPassword = true;
  constructor(
    private form: FormBuilder, private hospitalService: HospitalService,
    private dialogRef: MatDialogRef<ManagePatientRelationComponent>, public dateformat: DatePipe, private readonly lookupTermService: LookupTermService,
    @Inject(MAT_DIALOG_DATA) public data: any, public commonService: CommonService, private readonly apptermsService: ApptermsService, public toastr : AppToastService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.lookupTermService.getAppTermsVerion2Wrapper('CountryCode,Gender,HumanRelationship').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      this.genderList = res.Gender ?? [];
      this.relationshipList = res.HumanRelationship ?? []
      if (!this.data?.countryCode && !this.data?.id) {
        this.apptermsService.setDefaultValue(this.contactForm, 'countryCode', this.countrycodeList, 'code');
        this.getPhoneValidate(this.contactForm.controls['countryCode']?.value, 'code')
      }
    });
    this.selectedPatient = {
      id: this.data.patientId,
      fullName: this.data.patientName
    };

    this.contactForm.patchValue({
      patientId: this.data.patientId
    });

  }

  buildForm(): void {

    this.contactForm = this.form.group({
      patientId: [this.data?.patientId ?? null, Validators.required],
      firstName: [this.data?.firstName ?? null, Validators.required],
      middleName: [this.data?.middleName ?? null],
      lastName: [this.data?.lastName ?? null, Validators.required],
      relationshipId: [this.data?.relationshipId ?? null, Validators.required],
      birthDate: [this.data?.birthDate ? new Date(this.data.birthDate) : null],
      gender: [this.data?.gender ?? null],
      countryCode: [this.data?.countryCode ?? '+91', Validators.required],
      mobileNo: [this.data?.mobileNo ?? null, [Validators.required, Validators.pattern(this.phoneNoValidation)]],
      altCountryCode: [this.data?.altCountryCode ?? '+91'],
      altPhone: [this.data?.altPhone ?? null, [Validators.pattern(this.phoneNoValidation)]],
      email: [this.data?.email ?? null, { validators: [Validators.email,Validators.required], asyncValidators: [this.existingEmailValidator()] }],
      address: [this.data?.address ?? null],
      notes: [this.data?.notes ?? null],
      isPrimaryContact: [this.data?.isPrimaryContact ?? false],
      isEmergencyContact: [this.data?.isEmergencyContact ?? false],
      isLegalGuardian: [this.data?.isLegalGuardian ?? false],
      isAuthorizedPickup: [this.data?.isAuthorizedPickup ?? false],
      password: [null,  [Validators.required,
  Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/)
]],
      confirmPassword: [null,[Validators.required]]
    }, { validators: passwordMatchValidator() }); 
  }

  onSave(): void {
    const formValue = this.contactForm.getRawValue();
    const payload = {
      ...formValue,
      birthDate: formValue.birthDate ? this.dateformat.transform(formValue.birthDate, 'YYYY-MM-dd HH:mm:ss') : null, password: formValue.password || null,
    };
    delete payload.confirmPassword;
    if (this.data) {
      this.commonService.postPatientRelations(payload, this.data?.id).subscribe(res => {
          if (res.statusCode === 1) {
          this.toastr.success('Success', res.message);
          this.dialogRef.close(res);
        }
      },
      error => {
         this.toastr.error('Error', `${error.error.message}`);
      }
    )
      
    } else {
      this.commonService.postPatientRelations(payload).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success',  res.message);
          this.dialogRef.close(res);
        }
      },
      error => {
         this.toastr.error('Error', `${error.error.message}`);
      });
    }
    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  searchPatient(event: any): void {
    this.selectedPatient = null;
    if (event.text.length >= 2) {
      if (event.toHit === true) {
        this.commonService.getPatientUserList(0,50,event.text).subscribe((res: any) => {
          this.patientListItems = res.results || [];
          this.searchPatientlist = this.patientListItems;
        });
      } else {
        this.searchPatientlist = this.patientListItems;
      }

    } else {
      this.searchPatientlist = [];
    }
  }

  getPatientList(patient: any): string {
    return patient?.fullName || '';
  }

  getSearchDetails(option: any): void {
    this.selectedPatient = option;
    this.contactForm.patchValue({
      patientId: option?.patientId
    });
  }


  onMobileInput() {
    const control = this.contactForm.get('mobileNo');
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
    const code = type === 'code' ? data : this.contactForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if (res.results) {
        if (type === 'code') {
          const length = res.results?.length;
          this.contactForm.get('mobileNo').setValidators([Validators.required, Validators.pattern(`^[0-9]{${length}}$`)]);
          this.contactForm.get('mobileNo')?.updateValueAndValidity();
        } else {
          const ctrl = this.contactForm.get('mobileNo');
          const errors = { ...ctrl?.errors };
          delete errors['invalidPhone'];
          ctrl?.setErrors(Object.keys(errors).length ? errors : null);
        }
      } else {
        const control = this.contactForm.get('mobileNo');
        control?.setErrors({ invalidPhone: true });
        control?.markAsTouched();
        this.phoneMessage = res.message;
      }
    });
  }

  clearInvalidCountryCode(controlName: string): void {
    const ctrl = this.contactForm.get(controlName);
    const isValid = this.countrycodeList.some(c => c.code === ctrl?.value);
    if (!isValid) ctrl?.setValue(null);
  }

  existingEmailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {

      if (!control.value) {
        return of(null);
      }
      if (this.data?.email && this.data.email === control.value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() =>
          this.hospitalService.searchEmail(control.value)
        ),
        map((res: any) => {
          return res?.results?.isAlreadyExists
            ? { emailExists: true }
            : null;
        }),
        catchError(() => of(null)),
        first()
      );
    };
  }

  displayPatientName = (patientId: number): string => {
    console.log(patientId,this.selectedPatient,this.searchPatientlist)
    if (!patientId) {
      return '';
    }
    if (this.selectedPatient?.patientId === patientId) {
      return this.selectedPatient.fullName;
    }
    const patient = this.searchPatientlist?.find(
      x => x.patientId === patientId
    );
    return patient?.fullName || '';
  }
}


export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear only the mismatch error, preserve others
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
