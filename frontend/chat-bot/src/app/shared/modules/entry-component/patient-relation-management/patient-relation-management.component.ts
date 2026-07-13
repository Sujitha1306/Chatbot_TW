import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ManagePatientRelationComponent } from '../manage-patient-relation/manage-patient-relation.component';
import { DatePipe } from '@angular/common';
import { LookupTermService } from '../../../lookup-term.service';
import { ApptermsService } from '../../../services/appterms.service';
import { CommonService } from '../../../services';
import { MatRow } from '@angular/material/table';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-patient-relation-management',
  templateUrl: './patient-relation-management.component.html',
  styleUrls: ['./patient-relation-management.component.scss']
})
export class PatientRelationManagementComponent implements OnInit {

  countrycodeList: any[] = [];
  genderList: any[] = [];
  relationshipList: any[] = [];
  selectedPatient: any = null;
  searchPatientlist: any[] = [];
  DisplayColumn = ['Relation Name', 'Relationship', 'D.O.B', 'Gender', 'Phone Number', "Email", 'Address', "editDelete"]
  tabledata = []
  Column = ['firstName', 'relationshipValue', 'birthDate', 'gender', 'mobileNo', "email", "address", "editDelete"]
  isLoading = false;
  editId: number | null = null;
  relationListData: any[] = [];
  contactForm: FormGroup;
  patientListItems: any;


  constructor(
    private fb: FormBuilder, public toastr: AppToastService,
    private dialogRef: MatDialogRef<ManagePatientRelationComponent>,
    public dateformat: DatePipe,
    private readonly lookupTermService: LookupTermService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public commonService: CommonService,
    private readonly apptermsService: ApptermsService
  ) { }

  ngOnInit(): void {
    this.bulidform()
    if (this.data?.patientName) {
      this.selectedPatient = { patientName: this.data.patientName, patientId: this.data.patientId };

      if (this.data?.patientName) {
        this.selectedPatient = {
          patientName: this.data.patientName,
          id: this.data.patientId
        };
        this.contactForm.patchValue({
          patientId: this.data.patientId
        });
        this.contactForm.get('patientId')?.disable()
      }

      this.loadRelations();
    }

    this.lookupTermService.getAppTermsVerion2Wrapper('CountryCode,Gender,HumanRelationship').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      this.genderList = res?.Gender ?? [];
      this.relationshipList = res?.HumanRelationship ?? [];
    });


  }

  bulidform() {
    this.contactForm = this.fb.group({
      patientId: [null, Validators.required],
      firstName: [null, Validators.required],
      middleName: [null],
      lastName: [null, Validators.required],
      relationshipId: [null, Validators.required],
      birthDate: [null],
      gender: [null],
      countryCode: [null],
      mobileNo: [null, Validators.required],
      altCountryCode: [null],
      altPhone: [null],
      email: [null, Validators.email],
      address: [null],
      notes: [null],
      isPrimaryContact: [false],
      isEmergencyContact: [false],
      isLegalGuardian: [false],
      isAuthorizedPickup: [false],
    });
  }
  searchPatient(event: any): void {
    this.selectedPatient = null;
    if (event.text.length >= 2) {
      if (event.toHit === true) {
        this.commonService.searchInpatient(event.text).subscribe((res: any) => {
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
      patientId: option?.id
    });
  }

  getPhoneValidate(data, type) {
    const code = type === 'code' ? data : this.contactForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if (res.results) {
        if (type === 'code') {
          const length = res.results?.length;
          this.contactForm.get('mobileNo').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
          this.contactForm.get('mobileNo').updateValueAndValidity();
        }
      } else {
        const control = this.contactForm.get('mobileNo');
        control?.setErrors({ invalidPhone: true });
        this.contactForm = res.message;
      }
    });
  }
  addRelation(): void {

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.getRawValue();

    const payload = {
      id: this.editId || new Date().getTime(),

      patientId: this.selectedPatient?.id,

      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,

      relationshipId: formValue.relationshipId,

      relationshipValue:
        this.relationshipList.find(
          x => x.code === formValue.relationshipId
        )?.value || '',

      birthDate: formValue.birthDate
        ? this.dateformat.transform(
          formValue.birthDate,
          'yyyy-MM-dd HH:mm:ss'
        )
        : null,

      gender: formValue.gender,

      mobileNo: formValue.mobileNo,
      countryCode: formValue.countryCode,

      altCountryCode: formValue.altCountryCode,
      altPhone: formValue.altPhone,

      email: formValue.email,
      address: formValue.address,

      notes: formValue.notes,

      isPrimaryContact: formValue.isPrimaryContact,
      isEmergencyContact: formValue.isEmergencyContact,
      isLegalGuardian: formValue.isLegalGuardian,
      isAuthorizedPickup: formValue.isAuthorizedPickup,

      isActive: true
    };

    if (this.editId) {

      const index = this.relationListData.findIndex(
        x => x.id === this.editId
      );

      if (index !== -1) {
        this.relationListData[index] = payload;
      }

    } else {

      this.relationListData.push(payload);
    }

    this.tabledata = [...this.relationListData];


    this.resetForm();
  }

  cancelRelation(): void {
    this.resetForm();
  }

  triggerAction(event: any): void {
    if (event?.key === 'appEdit') {
      const row = event?.data;
      if (!row) {
        return;
      }
      this.editId = row.id;
      this.contactForm.patchValue({
        patientId: row.patientId,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
        relationshipId: row.relationshipId,
        birthDate: row.birthDate
          ? new Date(row.birthDate)
          : null,

        gender: row.gender,

        countryCode: row.countryCode,
        mobileNo: row.mobileNo,

        altCountryCode: row.altCountryCode,
        altPhone: row.altPhone,

        email: row.email,
        address: row.address,

        notes: row.notes,

        isPrimaryContact: row.isPrimaryContact,
        isEmergencyContact: row.isEmergencyContact,
        isLegalGuardian: row.isLegalGuardian,
        isAuthorizedPickup: row.isAuthorizedPickup
      });

    } else if (event?.key === 'appDelete') {

      const row = event?.data;
      if (!row) {
        return;
      }
      const index = this.relationListData.findIndex(
        x => x.id === row.id
      );
      if (index !== -1) {
        this.relationListData[index] = {
          ...this.relationListData[index],
          isActive: false
        };
      }
      this.tabledata = this.relationListData.filter(
        x => x.isActive !== false
      );

    }
  }

  loadRelations(): void {

    this.isLoading = true;

    this.commonService
      .getPatientRelations(this.data.patientId)
      .subscribe({
        next: (res: any) => {
          this.tabledata = res.results;
          this.relationListData = this.tabledata
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }


  resetForm(): void {

    this.editId = null;

    this.contactForm.reset({

      patientId: this.selectedPatient?.patientName || null,

      isPrimaryContact: false,
      isEmergencyContact: false,
      isLegalGuardian: false,
      isAuthorizedPickup: false
    });
  }


  onSave() {
    this.commonService
      .putPatientRelations(this.relationListData)
      .subscribe({
        next: (response) => {
          this.toastr.success('Relations saved successfully');

          this.resetForm();
          this.loadRelations();
        },
        error: (error) => {
          console.error(error);

          this.toastr.error(
            error?.error?.message || 'Failed to save relations'
          );
        }
      });

  }
}