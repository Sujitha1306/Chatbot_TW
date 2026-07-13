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
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DateAdapter,  } from '@angular/material/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-date-picker',
  template: `
  <mat-form-field class="example-full-width form-field">
  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
  <input matInput [matDatepicker]="picker" [max]="today" [value]="currentDate" (dateInput)="addEvent('input', $event)"
  [placeholder]="placeholder">
  <mat-datepicker #picker></mat-datepicker>
</mat-form-field>
  `,
  providers: [
    // { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    // NG_VALUE_ACCESSOR provider specifies a class that implements ControlValueAccessor interface
    // and is used by Angular to setup synchronization with formControl
    {
    provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatePickerComponent),
      multi: true
    }
  ]
})
export class CustomDatePickerComponent implements ControlValueAccessor {
  @Input() max: Date | null;    // To disable future dates
  today = new Date();
  currentDate = this.today;

  @Input()
  _currentDate;

  @Input() placeholder: string;

  constructor(private readonly dateAdapter: DateAdapter<Date>,  public datepipe: DatePipe) {
    dateAdapter.setLocale('en-in'); // DD/MM/YYYY
    this.today.setDate(this.today.getDate());
  }
  get dateValue() {
    return new Date(this._currentDate);
  }

  set dateValue(val) {
    this._currentDate = this.datepipe.transform(val,'DD/MM/YYYY' );
    this.propagateChange(this._currentDate);
  }

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    console.log(event.value);
    this._currentDate = this.datepipe.transform(event.value,'DD/MM/YYYY' );
  }

  writeValue(value: any) {
    if (value !== undefined) {
      this._currentDate = this.datepipe.transform(value,'DD/MM/YYYY' );
    }
  }
  propagateChange = (_: any) => { };

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched() {
    console.log()
   }
}