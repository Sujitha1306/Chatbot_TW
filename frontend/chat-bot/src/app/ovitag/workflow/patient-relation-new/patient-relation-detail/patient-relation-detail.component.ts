import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Observable, of, timer } from 'rxjs';
import { catchError, first, map, startWith, switchMap } from 'rxjs/operators';
import { LookupTermService } from '../../../../shared/lookup-term.service';
import { CommonService, HospitalService } from '../../../../shared/services';
import { ConfigurationService } from '../../../../shared';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { ApptermsService } from '../../../../shared/services/appterms.service';

@Component({
  selector: 'app-patient-relation-detail',
  templateUrl: './patient-relation-detail.component.html',
  styleUrls: ['./patient-relation-detail.component.scss'],
  providers: [DatePipe],
  standalone:false
})
export class PatientRelationDetailComponent implements OnInit {
  activeTab = 0;
  today = new Date();
  hide =true
  hidePassword = true;
  hideConfirmPassword = true;
  // Tab 1 – Manage Patient
  patientForm: FormGroup;
  genderList: any[] = [];
  countrycodeList: any[] = [];

  // Tab 2 – Manage Relations
  contactForm: FormGroup;
  relationshipList: any[] = [];
  tabledata: any[] = [];
  relationListData: any[] = [];
  editId: number | null = null;
  phoneNoValidation: any = /^[0-9]{8,13}$/;
  phoneMessage: string | null = null;
 filteredCountryCodes!: Observable<any[]>;
 filteredRelationCountryCodes!: Observable<any[]>;
 filteredRelationAltCountryCodes!: Observable<any[]>;

  // Tab 1 – Device section
  patientDeviceId: string | null = null;
  deviceSearchList: any[] = [];
  deviceTagTypeId: string | null = null;
  deviceBattery: number | null = null;
  isDeviceLoading = false;
  isDeviceSaving = false;
  deviceSearchCtrl = new FormControl(null);

  // Tab 3 – Alert History
  alertHistory: any[] = [];
  filterDate: Date | null = null;

  // ── Avatar helpers ──
  private readonly _palette = [
    '#9B59B6','#3498DB','#27AE60','#E67E22',
    '#1ABC9C','#E74C3C','#F39C12','#2980B9'
  ];

  prdInitials(name: string): string {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  prdAvatarBg(name: string): string {
    if (!name) return this._palette[0];
    const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this._palette[h % this._palette.length];
  }

   passwordValidators = !this.editId
  ? [
      Validators.required,
      Validators.pattern(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
      )
    ]
  : [
      Validators.pattern(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
      )
    ];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public commonService: CommonService,
    private hospitalService: HospitalService,
    private configurationService: ConfigurationService,
    private dialogRef: MatDialogRef<PatientRelationDetailComponent>,
    private toastr: AppToastService,
    private lookupTermService: LookupTermService,
    private apptermsService: ApptermsService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.activeTab = this.data?.initialTab ?? 0;
    this.loadTabData(this.activeTab)
    this.buildPatientForm();
    this.buildContactForm();
    this.loadLookups();
    

    this.contactForm.valueChanges.subscribe(() => {
      console.log(this.contactForm.errors);
       });
    this.filteredCountryCodes = this.patientForm.get('countryCode')!.valueChanges.pipe(startWith(''),map(value => this.filterCountryCodes(value || '')));
    this.filteredRelationCountryCodes = this.contactForm.get('countryCode')!.valueChanges.pipe(startWith(''),map(value => this.filterCountryCodes(value || '')));
    this.filteredRelationAltCountryCodes = this.contactForm.get('altCountryCode')!.valueChanges.pipe(startWith(''),map(value => this.filterCountryCodes(value || '')) );
  }

  changeTab(tab: number) {
      this.activeTab = tab;
      this.loadTabData(tab);
  }

  loadTabData(tab: number) {
      switch (tab) {
        case 0:
          this.loadPatientDetails();
          this.initDevice();
          break;

        case 1:
          this.loadRelations();
          break;

        case 2:
          this.loadAlertHistory();
          break;
     }
  }

  buildPatientForm() {
    this.patientForm = this.fb.group({
      firstName: [this.data?.firstName ??null, [Validators.required, Validators.pattern("^(?=.*[A-Za-z])[A-Za-z\\s'.]+$")]],
      middleName: [this.data?.middleName ??null],
      lastName: [this.data?.lastName ?? null],
      countryCode: [this.data?.countryCode || '+91'],
      mobileNo: [this.data?.phoneNumber || this.data?.mobileNo || null, [Validators.pattern(this.phoneNoValidation)]],
      birthDate: [this.data?.birthDate ? new Date(this.data.birthDate) : null],
      gender: [this.data?.gender || null],
      email: [this.data?.email || null, [Validators.email]]
    });
  }

  buildContactForm() {
    this.contactForm = this.fb.group({
      patientId: [this.data?.patientId || null],
      firstName: [null, Validators.required],
      middleName: [null],
      lastName: [null, Validators.required],
      relationshipId: [null, Validators.required],
      birthDate: [null],
      gender: [null],
      countryCode: ['+91', Validators.required],
      mobileNo: [null, [Validators.required, Validators.pattern(this.phoneNoValidation)]],
      altCountryCode: ['+91'],
      altPhone: [null, [Validators.pattern(this.phoneNoValidation)]],
      email: [null, {
        validators: [Validators.required,Validators.email],
        asyncValidators: [this.existingEmailValidator()]
      }],
      address: [null],
      notes: [null],
      isPrimaryContact: [false],
      isEmergencyContact: [false],
      isLegalGuardian: [false],
      isAuthorizedPickup: [false],
      NewPassword : [null ,
      this.passwordValidators],

    confirmPassword: [null,!this.editId ? Validators.required : []]

  },
  {
    validators: passwordMatchValidator()
  });
  }

  loadLookups() {
    this.lookupTermService.getAppTermsVerion2Wrapper('Gender,CountryCode,HumanRelationship').subscribe(res => {
      this.genderList = res?.Gender ?? [];
      this.countrycodeList = res?.CountryCode ?? [];
      this.relationshipList = res?.HumanRelationship ?? [];
      if (!this.data?.countryCode) {
        this.apptermsService.setDefaultValue(this.contactForm, 'countryCode', this.countrycodeList, 'code');
        this.getPhoneValidate(this.contactForm.get('countryCode')?.value, 'code');
      }
    });
  }

  loadPatientDetails() {
    const identifier =  this.data?.id;
    if (!identifier) return;
    this.commonService.getPatientUserList( null, null, null, identifier).subscribe(res => {
      const p = res?.results[0];
      if (p) {
        this.patientForm.patchValue({
          firstName: p.firstName,
          middleName: p.middleName,
          lastName: p.lastName,
          countryCode: p.countryCode || '+91',
          mobileNo: p.phoneNumber,
          birthDate: p.birthDate ? new Date(p.birthDate) : null,
          gender: p.gender,
          email: p.email || null
        });
      } else {
        const nameParts = (this.data?.fullName || '').trim().split(/\s+/);
        this.patientForm.patchValue({
          firstName: nameParts[0] || null,
          lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : null
        });
      }
    });
  }

  updatePatient() {
    if (this.patientForm.invalid) return;
    const v = this.patientForm.getRawValue();
    const payload = {
      id: this.data?.patientId,
      firstName: v.firstName,
      middleName: v.middleName,
      lastName: v.lastName,
      countryCode: v.countryCode,
      mobileNo: v.mobileNo,
      birthDate: this.datePipe.transform(v.birthDate, 'yyyy-MM-dd'),
      gender: v.gender,
      email: v.email || null
    };
    this.hospitalService.savePatient(payload).subscribe(() => {
      this.toastr.success('Success', 'Patient updated successfully');
    }, err => {
      this.toastr.error('Error', err?.error?.message || 'Update failed');
    });
  }

  // ── Tab 2: Manage Relations ──
  loadRelations() {
    if (!this.data?.patientId) return;
    this.commonService.getPatientRelations(this.data.patientId).subscribe(res => {
      this.tabledata = res.results || [];
      this.relationListData = [...this.tabledata];
    });
  }

  addRelation() {
    if (this.contactForm.invalid) { this.contactForm.markAllAsTouched(); return; }
    const v = this.contactForm.getRawValue();
    let payload: any = {
      patientId: this.data?.patientId,
      firstName: v.firstName,
      middleName: v.middleName,
      lastName: v.lastName,
      relationshipId: v.relationshipId,
      relationshipValue: this.relationshipList.find((x: any) => x.code === v.relationshipId)?.value || '',
      birthDate: v.birthDate ? this.datePipe.transform(v.birthDate, 'yyyy-MM-dd HH:mm:ss') : null,
      gender: v.gender,
      countryCode: v.countryCode,
      mobileNo: v.mobileNo,
      altCountryCode: v.altCountryCode,
      altPhone: v.altPhone,
      email: v.email,
      password : v.NewPassword,
      address: v.address,
      notes: v.notes,
      isPrimaryContact: v.isPrimaryContact,
      isEmergencyContact: v.isEmergencyContact,
      isLegalGuardian: v.isLegalGuardian,
      isAuthorizedPickup: v.isAuthorizedPickup,
      isActive: true
    };
    if(this.editId){
      payload = {...payload, password : v.NewPassword}
    }
    this.commonService.postPatientRelations(payload, this.editId || null).subscribe(
      () => {
        this.toastr.success('Success', this.editId ? 'Relation updated successfully' : 'Relation added successfully');
        this.resetContactForm();
        this.loadRelations();
      },
      err => {
        this.toastr.error('Error', err?.error?.message || 'Failed to save relation');
      }
    );
  }

  cancelRelation() { this.resetContactForm(); }

  triggerAction(event: any) {
    if (event?.key === 'appEdit') {
      const row = event.data;
      if (!row) return;
      this.editId = row.id;
      this.contactForm.get('NewPassword')?.clearValidators();
      this.contactForm.get('confirmPassword')?.clearValidators();
      this.contactForm.get('NewPassword')?.updateValueAndValidity();
      this.contactForm.get('confirmPassword')?.updateValueAndValidity();
      this.contactForm.patchValue({
        firstName: row.firstName, middleName: row.middleName, lastName: row.lastName,
        relationshipId: row.relationshipId,
        birthDate: row.birthDate ? new Date(row.birthDate) : null,
        gender: row.gender,
        countryCode: row.countryCode || '+91',
        mobileNo: row.mobileNo,
        altCountryCode: row.altCountryCode || '+91',
        altPhone: row.altPhone,
        email: row.email, address: row.address, notes: row.notes,
        isPrimaryContact: row.isPrimaryContact, isEmergencyContact: row.isEmergencyContact,
        isLegalGuardian: row.isLegalGuardian, isAuthorizedPickup: row.isAuthorizedPickup
      });
      if (row.countryCode) { this.getPhoneValidate(row.countryCode, 'code'); }
    } else if (event?.key === 'appDelete') {
      const row = event.data;
      if (!row) return;
      const idx = this.relationListData.findIndex(x => x.id === row.id);
      if (idx !== -1) this.relationListData[idx] = { ...this.relationListData[idx], isActive: false };
      this.tabledata = this.relationListData.filter(x => x.isActive !== false);
    }
  }

  saveRelations() {
    this.commonService.putPatientRelations(this.relationListData).subscribe(() => {
      this.toastr.success('Success', 'Relations saved successfully');
      this.resetContactForm();
      this.loadRelations();
    }, err => {
      this.toastr.error('Error', err?.error?.message || 'Failed to save relations');
    });
  }

  resetContactForm() {
    this.editId = null;
    this.phoneMessage = null;
    this.contactForm.reset({
      patientId: this.data?.patientId || null,
      countryCode: '+91',
      altCountryCode: '+91',
      isPrimaryContact: false, isEmergencyContact: false,
      isLegalGuardian: false, isAuthorizedPickup: false
    });
  }
  onPatientMobileInput() {
    const control = this.patientForm.get('mobileNo');
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

  getPhoneValidate(data, type: string) {
    const code = type === 'code' ? data : this.contactForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if (res.results) {
        if (type === 'code') {
          const length = res.results?.length;
          this.contactForm.get('mobileNo').setValidators([
            Validators.required,
            Validators.pattern(`^[0-9]{${length}}$`)
          ]);
          this.contactForm.get('mobileNo').updateValueAndValidity();
        } else {
          const ctrl = this.contactForm.get('mobileNo');
          const errors = { ...ctrl?.errors };
          delete errors['invalidPhone'];
          ctrl?.setErrors(Object.keys(errors).length ? errors : null);
        }
      } else {
        const ctrl = this.contactForm.get('mobileNo');
        ctrl?.setErrors({ invalidPhone: true });
        ctrl?.markAsTouched();
        this.phoneMessage = res.message;
      }
    });
  }

  existingEmailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      const editRow = this.tabledata?.find(r => r.id === this.editId);
      if (editRow?.email && editRow.email === control.value) return of(null);
      return timer(300).pipe(
        switchMap(() => this.hospitalService.searchEmail(control.value)),
        map((res: any) => res?.results?.isAlreadyExists ? { emailExists: true } : null),
        catchError(() => of(null)),
        first()
      );
    };
  }
  loadAlertHistory() {
    const sd = this.filterDate ? this.datePipe.transform(this.filterDate, 'yyyy-MM-dd') : null;
    this.commonService.getAlertbyId('Patient', this.data.patientId, sd, sd).subscribe(res => {
      this.alertHistory = res.results || [];
    });
  }

  onAlertDateChange(date: Date | null) {
    this.filterDate = date;
    this.loadAlertHistory();
  }

  clearAlertFilter() {
    this.filterDate = null;
    this.loadAlertHistory();
  }

  getAlertIcon(a: any): string {
    const t = (a.alertType || a.message || '').toLowerCase();
    if (t.includes('sos') || t.includes('call')) return 'crisis_alert';
    return 'notifications';
  }

  getAlertAvatarClass(a: any): string {
    const s = (a.status || '').toLowerCase();
    if (s.includes('close') || s.includes('resolv')) return 'prd-ah-av-green';
    if (s.includes('warn')) return 'prd-ah-av-orange';
    return 'prd-ah-av-red';
  }

  getAlertBadgeClass(a: any): string {
    const s = (a.status || '').toLowerCase();
    if (s.includes('close') || s.includes('resolv')) return 'prd-ah-badge-green';
    if (s.includes('warn')) return 'prd-ah-badge-orange';
    return 'prd-ah-badge-red';
  }
  

  // ── Device section ──────────────────────────────────────
  initDevice() {
    this.patientDeviceId = this.data?.tagId || this.data?.Device || null;
    if (this.patientDeviceId) {
      this.commonService.getTagBatteryStatus({ entityIds: [this.patientDeviceId] }).subscribe(res => {
        this.deviceBattery = res.results?.[0]?.batteryValue ?? null;
      });
    }
  }

  searchDeviceTags(event: any) {
    if (!event || event.text?.length < 2) { this.deviceSearchList = []; return; }
    if (event.toHit) {
      this.commonService.getAllTagByType(event.text, 'WF-IP', 'ST-AT').subscribe(res => {
        this.deviceSearchList = res.statusCode === 1 ? (res.results || []) : [];
      });
    }
  }

  selectDeviceTag(tag: any) {
    this.deviceTagTypeId = tag.tagTypeId || null;
    this.deviceBattery = tag.batteryPercentage ?? null;
    this.deviceSearchCtrl.setValue(tag.tagId);
    this.deviceSearchList = [];
  }

  associateDevice() {
    if (!this.deviceSearchCtrl.value || this.isDeviceSaving) return;
    this.isDeviceSaving = true;
    const payload = {
      tagSerialNumber: this.deviceSearchCtrl.value,
      tagAssociationId: this.data.patientId,
      tagAssociationType: 'Patient',
      tagAssociationTypeId: 'TAT-PA',
      tagTypeId: this.deviceTagTypeId
    };
    this.configurationService.replaceAssociateTag(payload).subscribe(
      res => {
        this.toastr.success('Success', res.message);
        this.patientDeviceId = this.deviceSearchCtrl.value;
        this.isDeviceSaving = false;
      },
      error => {
        this.toastr.error('Error', error.error?.message || 'Failed to associate device');
        this.isDeviceSaving = false;
      }
    );
  }

  disassociateDevice() {
    if (this.isDeviceSaving) return;
    this.isDeviceSaving = true;
    this.configurationService.disassociateTag({ tagSerialNumber: this.patientDeviceId }).subscribe(
      res => {
        this.toastr.success('Success', res.message);
        this.patientDeviceId = null;
        this.deviceBattery = null;
        this.deviceSearchCtrl.reset();
        this.isDeviceSaving = false;
      },
      error => {
        this.toastr.error('Error', error.error?.message || 'Failed to disassociate device');
        this.isDeviceSaving = false;
      }
    );
  }

  private filterCountryCodes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.countrycodeList.filter(c =>
      c.code.toLowerCase().includes(filterValue) ||
      c.value.toLowerCase().includes(filterValue)
    );
  }

 validateCountryCode(form: FormGroup, controlName: string): void {
  const ctrl = form.get(controlName);
  if (!ctrl?.value) return;
  const isValid = this.countrycodeList.some(c => c.code === ctrl.value);
  if (!isValid) ctrl.setValue(null);
}
  
}

export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('NewPassword')?.value;
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
