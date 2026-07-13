import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../../shared/services';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-rework-dialog',
  templateUrl: './rework-dialog.component.html',
  styleUrls: ['./rework-dialog.component.scss']
})
export class ReworkDialogComponent implements OnInit {
  public form: FormGroup;
  public currentTask: any;
  public previousActivities: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ReworkDialogComponent>,
    private readonly fb: FormBuilder,
    private readonly commonService: CommonService,
    private readonly toastr: AppToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      selectedActivity: [null],
      remarks: ['']
    });
    this.currentTask = this.data?.task;
    this.loadPreviousActivities();
  }

  private loadPreviousActivities(): void {
    const allTasks: any[] = this.data?.allTasks || [];
    if (!this.currentTask || !allTasks.length) return;

    const currentSequence = parseFloat(this.currentTask.sequenceLevel);
    const currentCategory = this.currentTask.activityCategoryName;
    const currentDepartment = this.currentTask.departmentName;

    this.previousActivities = allTasks.filter(t => {
      if (t.requestId === this.currentTask.requestId) return false;
      if (t.requestStatusId !== 'RQ-CO') return false;

      if (!isNaN(currentSequence) && parseFloat(t.sequenceLevel) >= currentSequence) return false;

      if (currentCategory && t.activityCategoryName !== currentCategory) return false;
      if (currentDepartment && t.departmentName !== currentDepartment) return false;

      return true;
    });
  }

  onSelectActivity(act: any): void {
    this.form.patchValue({ selectedActivity: act });
  }

  getCompletedTime(act: any): Date | string {
    return act.completedTime || act.modifiedOn || act.deliveryRequestDatetime || act.scheduleEnd || '';
  }

  save(): void {
    if (!this.form.value.selectedActivity) {
      this.toastr.error('Error', 'Please select a previous activity');
      return;
    }

    const selectedActivity = this.form.value.selectedActivity;
    const remarks = this.form.value.remarks || '';
    const userType = this.currentTask?.performerType || 'RT-RO';

    const currentPayload = {
      comments: remarks,
      type: 'RQT-ROU',
      status: 'RQ-IP',
      userType: userType
    };

    const selectedPayload = {
      comments: remarks,
      type: 'RQT-ROU',
      status: 'RQ-CR',
      userType: selectedActivity.performerType || 'RT-RO'
    };

    this.commonService.updateTask(this.currentTask.requestId, currentPayload).subscribe({
      next: () => {
        this.commonService.updateTask(selectedActivity.requestId, selectedPayload).subscribe({
          next: () => {
            this.toastr.success('Success', 'Rework initiated successfully');
            this.dialogRef.close('confirm');
          },
          error: () => {
            this.toastr.error('Error', 'Failed to update selected activity');
          }
        });
      },
      error: () => {
        this.toastr.error('Error', 'Failed to update current task');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
