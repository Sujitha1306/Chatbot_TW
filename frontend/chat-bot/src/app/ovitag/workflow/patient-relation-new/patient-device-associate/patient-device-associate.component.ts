import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonService, ConfigurationService } from '../../../../shared';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-patient-device-associate',
  templateUrl: './patient-device-associate.component.html',
  styleUrls: ['./patient-device-associate.component.scss'],
  standalone:false
})
export class PatientDeviceAssociateComponent implements OnInit {

  form: FormGroup;
  searchTagList: any[] = [];
  tagTypeId: string | null = null;
  batteryPercentage: number | null = null;
  isLoading = false;
  isSaving = false;
  localTagId: string | null = null;
  associationChanged = false;

  get hasDevice(): boolean {
    return !!(this.localTagId || this.data?.tagId || this.data?.Device);
  }

  get deviceId(): string {
    return this.localTagId || this.data?.tagId || this.data?.Device || null;
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PatientDeviceAssociateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonService,
    private configurationService: ConfigurationService,
    private toastr: AppToastService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      tagSerialNumber: [null, [Validators.required, this.requireTagMatch.bind(this)]],
      comments: [null]
    });

    if (this.deviceId) {
      this.isLoading = true;
      this.loadDeviceBattery(this.deviceId, true);
    }
  }

  onClose() {
    this.dialogRef.close(this.associationChanged ? 'confirm' : undefined);
  }

  private loadDeviceBattery(tagId: string, setLoading = false) {
    this.commonService.getTagBatteryStatus({ entityIds: [tagId] }).subscribe(
      res => {
        this.batteryPercentage = res.results?.[0]?.batteryValue ?? null;
        if (setLoading) { this.isLoading = false; }
      },
      () => { if (setLoading) { this.isLoading = false; } }
    );
  }

  searchTags(event: any) {
    if (!event || event.text?.length < 2) { this.searchTagList = []; return; }
    if (event.toHit) {
      this.commonService.getAllTagByType(event.text, 'WF-IP', 'ST-AT').subscribe(res => {
        if (res.statusCode === 1) {
          this.searchTagList = res.results || [];
          if (res.results?.length === 1 && res.results[0].tagId === event.text) {
            this.selectTag(res.results[0]);
            this.searchTagList = [];
          }
        } else {
          this.searchTagList = [];
        }
      });
    }
  }

  selectTag(option: any) {
    this.tagTypeId = option.tagTypeId || null;
    this.batteryPercentage = option.batteryPercentage ?? null;
    this.form.controls.tagSerialNumber.setValue(option.tagId);
    this.searchTagList = [];
  }

  private requireTagMatch(control: FormControl): ValidationErrors | null {
    if (control.value && this.searchTagList.length > 0) {
      const match = this.searchTagList.find(t => t.tagId === control.value);
      return match ? null : { requireMatch: true };
    }
    return null;
  }

  associate() {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;
    const payload = {
      tagSerialNumber: this.form.value.tagSerialNumber,
      comments: this.form.value.comments,
      tagAssociationId: this.data.patientId,
      tagAssociationType: 'Patient',
      tagAssociationTypeId: 'TAT-PA',
      tagTypeId: this.tagTypeId
    };
    this.configurationService.replaceAssociateTag(payload).subscribe(
      res => {
        this.toastr.success('Success', res.message);
        this.localTagId = this.form.value.tagSerialNumber;
        this.associationChanged = true;
        this.isSaving = false;
        this.loadDeviceBattery(this.localTagId);
      },
      error => {
        this.toastr.error('Error', error.error?.message || 'Failed to associate device');
        this.isSaving = false;
      }
    );
  }


  disassociate() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.configurationService.disassociateTag({ tagSerialNumber: this.deviceId }).subscribe(
      res => {
        this.toastr.success('Success', res.message);
        this.dialogRef.close('confirm');
      },
      error => {
        this.toastr.error('Error', error.error?.message || 'Failed to disassociate device');
        this.isSaving = false;
      }
    );
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const palette = ['#28a59f', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
    return name ? palette[name.charCodeAt(0) % palette.length] : '#28a59f';
  }
}
