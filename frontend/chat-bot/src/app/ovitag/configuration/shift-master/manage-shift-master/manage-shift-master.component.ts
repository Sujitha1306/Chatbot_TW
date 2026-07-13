import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { CommonService, ConfigurationService, DashboardService } from '../../../../shared';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { createShiftMaster } from '../../configuration.model';

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
  selector: 'app-manage-shift-master',
  templateUrl: './manage-shift-master.component.html',
  styleUrls: ['./manage-shift-master.component.scss'],
   providers: [DatePipe,
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
      ],
})
export class ManageShiftMasterComponent implements OnInit{

public shiftmasterForm: FormGroup;
public createShiftMaster: createShiftMaster;


constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: ToastrService, public configurationService: ConfigurationService,
     public thisDialogRef: MatDialogRef<ManageShiftMasterComponent> ,public dateformat: DatePipe, private readonly commonService: CommonService,) { }

  

 ngOnInit(): void {
    this.buildForm();
  }

   public buildForm() {
     this.shiftmasterForm = this.form.group({
       shiftName: [this.data?.shiftName ? this.data.shiftName : null,  [Validators.required]],
       startTime: [this.data ? new Date(this.data.startTime) : null, [Validators.required]],
       endTime: [this.data ? new Date(this.data.endTime) : null, [Validators.required]],
       shiftCode: [this.data?.shiftCode ? this.data.shiftCode : null],
       status:[this.data?.status ? this.data.status : null],
     });
   }    

  parseTimeString(time: any): Date {
    if (!time) return null;
    if (time instanceof Date) {
      return time;
    }
    if (typeof time === 'string') {
      const [timePart, modifier] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier?.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      if (modifier?.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    if (time.hour !== undefined && time.minute !== undefined) {
      const date = new Date();
      date.setHours(time.hour, time.minute, 0, 0);
      return date;
    }
    return null;
  }

  saveShiftMaster() {
    this.createShiftMaster = new createShiftMaster(null, null, null, null, null, null);
    this.createShiftMaster.shiftName = this.shiftmasterForm.controls['shiftName'].value;
    const startTimeValue = this.shiftmasterForm.controls['startTime'].value;
    const endTimeValue = this.shiftmasterForm.controls['endTime'].value;
    const validDate = this.parseTimeString(startTimeValue);
    const validDateend = this.parseTimeString(endTimeValue);
    this.createShiftMaster.startTime = this.dateformat.transform(validDate, 'yyyy-MM-dd HH:mm:ss');
    this.createShiftMaster.endTime = this.dateformat.transform(validDateend, 'yyyy-MM-dd HH:mm:ss');
    this.createShiftMaster.shiftCode = this.shiftmasterForm.controls['shiftCode'].value;
    this.createShiftMaster.status = this.shiftmasterForm.controls['status'].value;
    if (this.data?.id) {
      this.createShiftMaster.id = this.data.id;
    }
    // console.log(this.createShiftMaster)
    // return
    this.configurationService.saveShiftMaster(this.createShiftMaster).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close("confirm");
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
}
