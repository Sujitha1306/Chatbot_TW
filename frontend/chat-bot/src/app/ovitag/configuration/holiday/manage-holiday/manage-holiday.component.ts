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

import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder,  FormGroup, Validators } from '@angular/forms';
import { CommonService, WorkflowService } from '../../../../shared';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../asset/asset.component';
import { AppToastService } from '../../../../shared/services/toaster.service';


@Component({
  selector: 'app-manage-holiday',
  templateUrl: './manage-holiday.component.html',
  styleUrls: ['./manage-holiday.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ManageHolidayComponent implements OnInit {
  checkedValue = 'Day';
  public holidayForm: FormGroup;
  public daysOfWeek = [];
  public holidayType = [];
  formBuilderSource : any =[];
  public tableDataActive : any =[];
  public selectedDate:any;
  public selectedHolidayValue = 'Day';
  public updateEnable = false;
  public checkedCodeVal = null
  public weekOff = [];
  public weekOffHolidays = []
  public toggleDisable = false;
  public formatDate = (date) => new Date(date).toISOString().split('T')[0];
  constructor(private readonly fb: FormBuilder, public toastr: AppToastService,private readonly commonService: CommonService, @Inject(MAT_DIALOG_DATA) public data: any, private readonly workflowService: WorkflowService, public datepipe: DatePipe,
    public dialog: MatDialog) { 
    if(data){
      if(data.hasOwnProperty('selectedDate')){
        this.selectedDate = data['selectedDate'];
      }
      if(data.hasOwnProperty('tableData')){
        this.formBuilderSource = data['tableData'];
        this.weekOffHolidays = this.data.tableData.filter(val => val.typeId == 'HT-WKL');
        this.weekOff = this.weekOffHolidays.map(val => val.holidayPatternId)
      }
      this.formBuilderSource = this.formBuilderSource.map(item => {
        let date;

        if (item.endDate && item.typeId !== 'HT-WKL') {
          date = item.startDate + ' - ' + item.endDate;
        } else if (item.typeId === 'HT-WKL') {
          date = item.holidayPatternName;
        } else {
          date = this.getFormattedDate(item.startDate);
        }

        return {
          ...item,
          date
        };
      });
      this.tableDataActive =this.formBuilderSource.filter(res => res.isActive);
    }
  }

  ngOnInit(): void {
    this.holidayForm = this.fb.group({
      id:[null],
      name:[null, [Validators.required]],
      startDate:[null, [Validators.required]],
      endDate:[null],
      holidayType: ['HT-DAY', [Validators.required]],
      holidayPatternId: ['HPT-DAY'],
      isActive: [true],
    });
    this.commonService.getAppTerms('WeekDays,HolidayType').subscribe(res => {
      let holidayTypes = res.results.filter(resFilter => resFilter.groupName === 'HolidayType');
      this.holidayType = holidayTypes.filter(val =>  val.code !== "HT-MNT" && val.code !== "HT-RAG"  && val.code !== "HT-WKL");
      this.daysOfWeek = res.results.filter(resFilter => resFilter.groupName === 'WeekDays');
      this.updateWeeklyOff();
    });
    this.holidayForm.get('holidayType')!.valueChanges.subscribe((selectedCode) => {
      const selectedHoliday = this.holidayType.find(holiday => holiday.code === selectedCode);
      this.selectedHolidayValue = selectedHoliday ? selectedHoliday.value : null;
      if(selectedCode == 'HT-DAY' || selectedCode == 'HT-YRL'){
        this.holidayForm.get('holidayPatternId').setValue('HPT-DAY');
      }
    });
  }

  onToggleChange(event: any): void {
    this.checkedValue = event.target.checked ? 'Range' : 'Day';
    if(this.checkedValue === 'Range'){
      this.holidayForm.controls.endDate.setValidators(Validators.required);
    }else{
      this.holidayForm.controls.endDate.clearValidators()
    }
    this.holidayForm.updateValueAndValidity()
    this.checkedCodeVal = this.checkedValue == 'Range' ? 'HT-RAG' : 'HT-DAY' ;
  }

  getWeekOff(day) {
    const dayExist = this.weekOff?.filter(x => x === day);
    if(dayExist?.length === 0) {
      this.weekOff.push(day);
      let newWeekoff = {  id : null, 
        name : day,
        typeId : 'HT-WKL', 
        holidayPatternId : day,
        startDate : null,
        endDate : null,
        isActive : true
      }
      this.weekOffHolidays.push(newWeekoff)
    } else {
      this.weekOff = this.weekOff?.filter(x => x !== day);
      this.weekOffHolidays = this.weekOffHolidays.map(item => ({
        ...item,
        isActive: this.weekOff.includes(item.holidayPatternId)
      }));
    }
  }

  updateWeeklyOff(): void {
    const weeklyOffArray = this.holidayForm.get('weeklyOff') as FormArray;
    const filteredSource = this.tableDataActive.filter(item => item.typeId === "HT-WKL");
    this.daysOfWeek.forEach((day, index) => {
      if (filteredSource.some(item => item.holidayPatternId === day.code)) {
        day.checked = true;
      }
      const weeklyOffGroup = weeklyOffArray.at(0) as FormGroup;
      if (weeklyOffGroup) {
          const control = weeklyOffGroup.get(day.code);
          if (control) {
              control.setValue(day.checked);
          }
      }
    });
  }

  bindData() {
    const formValue = this.holidayForm.value;

    if (!formValue['holidayType']) {
      return;
    }

    const tempTableData = [...this.formBuilderSource];

    if (formValue['holidayType'] === 'HT-WKL') {
      this.handleWeeklyHolidayType(tempTableData, formValue);
    } else {
      this.handleNonWeeklyHolidayType(tempTableData, formValue);
    }

    this.formBuilderSource = null;
    this.formBuilderSource = tempTableData;

    this.resetHolidayForm();

    this.tableDataActive = null;
    this.tableDataActive = this.formBuilderSource.filter(res => res.isActive);

    this.updateWeeklyOff();
  }

  private handleWeeklyHolidayType(tempTableData: any[], formValue: any) {
    for (let i in this.daysOfWeek) {
      const day = this.daysOfWeek[i];
      const codeExist = tempTableData.findIndex(res => res.holidayPatternId === day['code']);

      if (day['checked']) {
        if (codeExist === -1) {
          tempTableData.push({
            id: null,
            name: "weekoff",
            typeName: this.selectedHolidayValue,
            typeId: formValue.holidayType,
            date: day['value'],
            isActive: true,
            holidayPatternId: day['code']
          });
        } else {
          tempTableData[codeExist]['isActive'] = true;
        }
      } else if (codeExist !== -1) {
        tempTableData[codeExist]['isActive'] = false;
      }
    }
  }

  private handleNonWeeklyHolidayType(tempTableData: any[], formValue: any) {
    tempTableData.push({
      id: null,
      name: formValue.name,
      typeName: this.selectedHolidayValue,
      typeId: formValue.holidayType,
      date: formValue.endDate
        ? this.getFormattedDate(formValue.startDate) + '  -  ' + this.getFormattedDate(formValue.endDate)
        : this.getFormattedDate(formValue.startDate),
      startDate: this.getFormattedDate(formValue.startDate),
      isActive: true,
      holidayPatternId: this.checkedCodeVal ?? formValue.holidayPatternId,
      holidayPatternName: this.checkedValue ?? formValue.holidayPatternName,
      endDate: formValue.endDate ? this.getFormattedDate(formValue.endDate) : null,
      isRow: true
    });
  }

  private resetHolidayForm() {
    Object.keys(this.holidayForm.controls).forEach(key => {
      this.holidayForm.reset();
    });
    this.holidayForm.get('holidayType').setValue('HT-DAY');
  }

  updateData(){
    const formValue = this.holidayForm.value;
    if(formValue.id != null){
      const index = this.formBuilderSource.findIndex(res => res.id === formValue.id);
      this.formBuilderSource[index]['name'] = formValue.name;
      this.formBuilderSource[index]['date'] = formValue.endDate ? this.getFormattedDate(formValue.startDate)+ '  -  ' +this.getFormattedDate(formValue.endDate) : this.getFormattedDate(formValue.startDate);
      this.formBuilderSource[index]['startDate']= this.getFormattedDate(formValue.startDate);
      this.formBuilderSource[index]['endDate'] = formValue.endDate ? this.getFormattedDate(formValue.endDate):null;
      this.formBuilderSource[index]['isRow'] = true;
    }
    this.updateEnable = false;
    this.tableDataActive = null;
    this.tableDataActive = this.formBuilderSource.filter(res => res.isActive);
    Object.keys(this.holidayForm.controls).forEach(key => {
      this.holidayForm.reset();
    });
  }

  triggerAction(event){
    if(event.key === 'manage'){
      this.editHoliday(event.data)
    }else if(event.key === 'delete'){
      this.deleteHoliday(event.data)
    }
  }

  editHoliday(data){
    let parsedStartDate = new Date();
    let parsedEndDate = new Date();
    if(data.startDate){
      let parts = data.startDate.split('-');
      parsedStartDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    if(data.endDate){
      let parts = data.endDate.split('-');
      parsedEndDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    this.checkedValue = data.holidayPatternName
    this.holidayForm.patchValue({
      id:data.id?data.id:'null',
      name:data.name,
      startDate:parsedStartDate,
      endDate:data.endDate?parsedEndDate:null,
      holidayType: data.typeId,
      holidayPatternId: data.holidayPatternId,
      holidayPatternName: data.holidayPatternName,
      isRow: false 
    })
    this.toggleDisable = true;
    this.updateEnable = true;
    if(this.checkedValue === 'Range'){
      this.holidayForm.controls.endDate.setValidators(Validators.required);
    }else{
      this.holidayForm.controls.endDate.clearValidators()
    }
    this.holidayForm.updateValueAndValidity()
  }
  deleteHoliday(data){
    if(data.id != null){
      const index = this.formBuilderSource.findIndex(res => res.id === data.id);
      this.formBuilderSource[index]['isActive'] = false;
      this.formBuilderSource[index]['isRow'] = true;
      this.tableDataActive = null;
      this.tableDataActive = this.formBuilderSource.filter(res => res.isActive);
    }else{
      if(data.typeId == 'HT-WKL'){
        this.formBuilderSource = this.formBuilderSource.filter(res => !(res.holidayPatternId === data.holidayPatternId && res.id == null));
      } else{
        this.formBuilderSource = this.formBuilderSource.filter(res => !(res.name === data.name && res.typeId === data.typeId && res.id == null));
      }
      this.tableDataActive = null;
      this.tableDataActive = this.formBuilderSource.filter(res => res.isActive);
    }
    if(data.typeId == 'HT-WKL'){
      let daysIndex = this.daysOfWeek.findIndex(res => res.code == data.holidayPatternId);
      this.daysOfWeek[daysIndex].checked = false;
      this.updateWeeklyOff();
    }
  }

  saveHoliday(){
    let holidays = this.formBuilderSource.filter(row => row.isRow);
    holidays = [...holidays, ...this.weekOffHolidays]
    holidays = holidays.map(({ id, name, typeId, holidayPatternId, startDate, endDate, isActive }) => ({ id, name, typeId, holidayPatternId, startDate, endDate, isActive }));
    this.workflowService.createHoliday(holidays).subscribe((res) => {
      this.toastr.success('Success', `${res.message}`);
      this.dialog.closeAll();
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });  
  }

  getFormattedDate(dateString: string): string {
    try {
      return this.datepipe.transform(new Date(dateString), 'dd-MM-yyyy');
    } catch (error) {
      return dateString
    }
  }

  customDatePickerDisable = (date: Date): boolean => {
    try {
      const date1 = new Date(date);
      if (!date1) return false;

      const day = date1.getDay();
      const dateStringFormatted = this.formatDateString(date1);

      for (const holiday of this.tableDataActive) {
        if (this.isWeeklyHoliday(holiday, day)) return false;
        if (this.isRangeHoliday(holiday, date1)) return false;
        if (this.isSingleDayHoliday(holiday, dateStringFormatted)) return false;
      }
    } catch (e) {
      console.log(e);
    }

    return true;
  }

  private formatDateString(date: Date): string {
    return `${('0' + date.getDate()).slice(-2)}-${('0' + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}`;
  }

  private isWeeklyHoliday(holiday: any, day: number): boolean {
    return holiday.typeId === 'HT-WKL' &&
          holiday.holidayPatternId === 'DAY7-SAT' &&
          day === 6;
  }

  private isRangeHoliday(holiday: any, date: Date): boolean {
    if (holiday.typeId === 'HT-RAG' && holiday.startDate && holiday.endDate) {
      const startDate = new Date(holiday.startDate.split('-').reverse().join('-')).getTime();
      const endDate = new Date(holiday.endDate.split('-').reverse().join('-')).getTime();
      const current = date.getTime();
      return current >= startDate && current <= endDate;
    }
    return false;
  }

  private isSingleDayHoliday(holiday: any, formattedDate: string): boolean {
    return holiday.typeId === 'HT-DAY' && holiday.startDate === formattedDate;
  }

}
