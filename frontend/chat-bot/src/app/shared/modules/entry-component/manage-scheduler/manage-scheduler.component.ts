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

import { Component, Inject, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../../shared';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../../ovitag/configuration/asset/asset.component';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { EntityGroupComponent } from '../entity-group/entity-group.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-manage-scheduler',
  templateUrl: './manage-scheduler.component.html',
  styleUrls: ['./manage-scheduler.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ManageSchedulerComponent implements OnInit {

  @Input() scheduleInput : any;
  public SchedulerForm: FormGroup;
  public dateFilterForm: FormGroup;
  public entityGroup: any[];
  public cardInfo: any[] = [];
  public exceptionType: any[];
  public exceptionPeriod: any[];
  public shiftDetails: any[];
  public entityExceptionData: any[] = [];
  public tableDataActive: any[] = [];
  public today = new Date();
  public startDate = this.datePipe.transform(this.today, 'dd-MM-yyyy');
  nextYear = this.today.getFullYear() + 1;
  lastDayOfDecemberNextYear = new Date(this.nextYear, 11, 31);
  public endDate = this.datePipe.transform(this.lastDayOfDecemberNextYear, 'dd-MM-yyyy');
  public formatDate = (date: string | Date) => new Date(date).toISOString().split('T')[0];
  public selectedOverrideValue = 'Working';
  public selectedPeriod = 'Day';
  public shiftName = null;
  public entityGroupDetails: any[] = [];
  public entitySchedules: any[];
  public linkedGroupDetails: any[] = [];
  public entityGroupDetailsAll: any[];
  public studentGradeInfo: any[];
  public selectedGroup = 'grade';
  public daysOfWeek = [];
  public weekOff = [];
  public groupList = [];
  calendarData = null;
  pickerDate: boolean = false;
  isToDate: boolean = false;
  exceptionDetails = [];
  holidayDetails = [];
  monthStartDate = this.datePipe.transform(this.today, 'yyyy-MM-dd')
  monthEndDate = this.datePipe.transform(this.lastDayOfDecemberNextYear, 'yyyy-MM-dd');
  weekDays = [];
  disabledDates = [];
  holidayData = [];
  shiftFilterDetails: any[];
  entityType = 'entity_group';
  entityId = null;
  entityData = [];
  deletedWeekOff = [];
  isClose  = true;
  isEnable = false;
  groupMappingId = null;
  entityGroupId = null;

  constructor(private readonly fb: FormBuilder, private readonly workflowService: WorkflowService, private readonly hospitalService: HospitalService,public dialog: MatDialog,public toastr: AppToastService,
  private readonly commonService: CommonService,private readonly configurationService: ConfigurationService, @Inject(MAT_DIALOG_DATA) public data: any, public datePipe: DatePipe) {
    if (data) {
      if (data.hasOwnProperty('entityGroup')) {
        this.entityGroup = data['entityGroup'];
      }
      if (data.hasOwnProperty('startDate')) {
        this.startDate = data['startDate'];
        this.endDate = data['endDate']
      }
    }
    this.getEntityGroupMapping();
    this.entityGroupDetails = [];
    this.getAllDetails();
    this.calenderDetails();
    this.entitySchedules = [];
  }

  ngOnInit(): void {
    this.isClose = this.scheduleInput?.enableClose ?? true;
    if(this.scheduleInput?.hasOwnProperty('entityType') && this.scheduleInput?.entityType !== null) {
      this.entityType = this.scheduleInput?.entityType;
    }
    if (this.scheduleInput?.hasOwnProperty('data') && this.scheduleInput?.data !== null) {
      this.workflowService.getEntityGroup(this.scheduleInput?.data?.id, this.scheduleInput?.scheduleEntityType).subscribe((res) => {
        this.startDate = this.datePipe.transform(this.today, 'yyyy-MM-dd');
        this.endDate = this.datePipe.transform(this.lastDayOfDecemberNextYear, 'yyyy-MM-dd');
        if (res.statusCode == 1) {
          this.groupMappingId = res.results[0]?.pfEntityGroupMappingId;
          this.workflowService.getEntityScheduleExceptions(this.scheduleInput?.entityType,this.scheduleInput?.data?.id).subscribe((res) =>{
            if(res.statusCode == 1){
              this.entityId = this.scheduleInput?.data?.id;
              this.entityData = res.results?.filter(x => x.entityId === this.entityId);
              if(this.entityData?.length !== 0) {
                this.entityGroup = this.entityData[0];
                this.entityGroup['entityId'] = res.results[0]?.entityId;
                this.entityGroup['shiftId'] = res.results[0]?.shiftId;
                this.entityGroup['startTime'] = res.results[0]?.startTime;
                this.entityGroup['toTime'] = res.results[0]?.toTime;
              } else {
                this.entityGroup = res.results[0];
              }
              this.onShiftChange(this.entityGroup['shiftId']);
              this.getScheduledData(this.entityId);
              this.buildForm();
            }
          });
        } else {
          this.workflowService.getEntityScheduleExceptions(this.scheduleInput?.entityType,this.scheduleInput?.data?.id).subscribe((res) =>{
            if(res.statusCode == 1){
              this.entityId = this.scheduleInput?.data?.id;
              this.entityData = res.results?.filter(x => x.entityId === this.entityId);
              if(this.entityData?.length !== 0) {
                this.entityGroup = this.entityData[0];
                this.entityGroup['entityId'] = null;
                this.entityGroup['shiftId'] = res.results[0]?.shiftId;
                this.entityGroup['startTime'] = res.results[0]?.startTime;
                this.entityGroup['toTime'] = res.results[0]?.toTime;
              }
              this.onShiftChange(this.entityGroup['shiftId']);
              this.getScheduledData(this.entityId);
              this.buildForm();
            }
          });
        }
      })
    }
    this.commonService.getAppTerms('WeekDays').subscribe(res => {
      this.daysOfWeek = res.results.filter(resFilter => resFilter.groupName === 'WeekDays');
    });
    this.buildForm();
    this.workflowService.getHolidays(this.monthStartDate, this.monthEndDate).subscribe(res => {
      if (res.statusCode != 0) {
        this.holidayDetails = res.results?.filter(x => x.isActive === true);
        const weekoff = this.holidayDetails?.filter(x => x.typeId === 'HT-WKL');
        this.holidayData = this.holidayDetails;
        weekoff?.forEach(week => {
          const dayExist = this.weekOff?.filter(x => x === week?.holidayPatternId);
          if(dayExist?.length === 0) {
            this.getWeekOff(week?.holidayPatternId);
          }
        })
      }
      this.getScheduledData();
    });
  }

  getScheduledData(id?: any) {
    if(this.entityGroup && this.entityGroup['exceptions']?.length > 0) {
      this.weekOff = [];
      let tempTableData = [];
      this.entityGroup['exceptions'].forEach(data => {
        if(data?.holidayTypeId === "HT-WKL") {
          const dayExist = this.weekOff?.filter(x => x === data.holidayPatternId);
          if(dayExist?.length === 0) {
            this.getWeekOff(data.holidayPatternId);
          }
        } else {
          tempTableData.push({
            id: data.id,
            entityGroupId: null,
            overrideStatusId: data.overrideStatusId,
            overrideStatusName: data.overrideStatusValue,
            holidayPatternId: data.holidayPatternId,
            holidayPatternName: data.holidayPatternValue,
            startDatetime: this.datePipe.transform(data.startTime, 'yyyy-MM-dd 00:00:00'),
            date: data.toTime ? `${this.datePipe.transform(data.startTime, 'dd-MM-yyyy')} - ${this.datePipe.transform(data.toTime, 'dd-MM-yyyy')}` : this.datePipe.transform(data.startTime, 'dd-MM-yyyy'),
            isActive: true,
            toDatetime: data.toTime ?this.datePipe.transform(data.toTime, 'yyyy-MM-dd 00:00:00'):null,
            pfShiftMasterId : data.shiftId,
            holidayId : null,
            shiftName: data.shiftName
          });
          this.entityExceptionData = tempTableData;
          this.tableDataActive = null;
          this.tableDataActive = tempTableData;
          this.getExceptionData();
        }
      })
    }
    if(id) {
      let tempTableData = [];
      this.workflowService.getEntityScheduleExceptions(id).subscribe((res) =>{
        if(res.statusCode == 1 || res.statusCode == 0){
          res.results[0]?.['exceptions']?.forEach(data => {
            tempTableData.push({
              id: data.id,
              entityGroupId: null,
              overrideStatusId: data.overrideStatusId,
              overrideStatusName: data.overrideStatusValue,
              holidayPatternId: data.holidayPatternId,
              holidayPatternName: data.holidayPatternValue,
              startDatetime: this.datePipe.transform(data.startTime, 'yyyy-MM-dd 00:00:00'),
              date: data.toTime ? `${this.datePipe.transform(data.startTime, 'dd-MM-yyyy')} - ${this.datePipe.transform(data.toTime, 'dd-MM-yyyy')}` : this.datePipe.transform(data.startTime, 'dd-MM-yyyy'),
              isActive: true,
              toDatetime: data.toTime ?this.datePipe.transform(data.toTime, 'yyyy-MM-dd 00:00:00'):null,
              pfShiftMasterId : data.shiftId,
              holidayId : null,
              shiftName: data.shiftName
            });
          });
          if(this.SchedulerForm.controls.groupName.value !== null && this.SchedulerForm.controls.groupName.value !== '') {
            this.SchedulerForm?.controls['shift']?.disable();
          }
          // this.SchedulerForm?.controls['groupName']?.disable();
        }
      });
    }
    // if(['TW-SMU']?.includes(this.scheduleInput?.status)){
    //   this.SchedulerForm?.controls['groupName']?.disable();
    // }
  }

  getEntityGroupMapping() {
    this.commonService.getEntityGroupMapping().subscribe(res => {
      this.groupList = res.results;
      this.getConfigData();
    });
  }

  getConfigData() {
    this.commonService.getConfigFile('entityGroups-config').subscribe(res => {
      if (res.statusCode === 1) {
        let configData = res.results?.contentObject;
        this.groupList = this.groupList?.filter(res => configData?.allowedGroups.includes(res.entityTypeId));
      }
    });
  }
  
  buildForm(){
    this.SchedulerForm = this.fb.group({
      groupName: [this.entityGroup ? this.entityGroup['entityId'] : null],
      groupBy: [this.selectedGroup],
      shift: [this.entityGroup?this.entityGroup['shiftId']:null],
      selectedShift: [null],
      type: ['ORD-WRK'],
      period: ['HPT-DAY'],
      isActive: [true],
      fromDate: [null],
      toDate: [null],
      exceptionId: [null],
      shiftToDate: [this.entityGroup ? this.entityGroup['toTime'] : null],
      shiftFromDate: [this.entityGroup ? this.entityGroup['startTime'] : null]
    });
    this.dateFilterForm = this.fb.group({
      fromDate: [this.startDate ? this.startDate : null],
      toDate: [this.endDate ? this.endDate : null]
    });
    this.SchedulerForm.get('type')!.valueChanges.subscribe((selectedCode) => {
      const selectedType = this.exceptionType.find(exception => exception.code === selectedCode);
      this.selectedOverrideValue = selectedType ? selectedType.value : null;
    });
    this.SchedulerForm.get('period')!.valueChanges.subscribe((selectedCode) => {
      const selectedType = this.exceptionPeriod.find(exception => exception.code === selectedCode);
      this.selectedPeriod = selectedType ? selectedType.value : null;
    });
    this.SchedulerForm.get('selectedShift')!.valueChanges.subscribe((id) => {
      const selectedType = this.shiftDetails.find(shift => shift.id === id);
      this.shiftName = selectedType ? selectedType.shiftName : null;
    });
    this.entitySelectionChange(this.selectedGroup);
  }

  getAllDetails() {
    this.workflowService.getEntityGroupInfo().subscribe((res) => {
      if (res.statusCode == 1) {
        this.entityGroupDetailsAll = res.results;
      }
    })
    this.commonService.getAppTerms('OverrideStatus,HolidayPattern').subscribe(res => {
      this.exceptionType = res.results.filter(resFilter => resFilter.groupName === 'OverrideStatus');
      this.exceptionPeriod = res.results.filter(resFilter => resFilter.groupName === 'HolidayPattern');
    })
    this.commonService.getAllShift().subscribe((res) => {
      if (res.statusCode == 1) {
        this.shiftDetails = res.results;
        this.shiftDetails = this.shiftDetails.map(shift => ({
          ...shift,
          value: `${shift.shiftName} (${shift.startTime.split(' ')[1]} - ${shift.endTime.split(' ')[1]})`
        }));
        this.shiftFilterDetails = this.shiftDetails;
        if (this.entityGroup != null && this.entityGroup['shiftId']) {
          const modifyShiftData = this.shiftDetails.filter(X => X.id != this.entityGroup['shiftId']);
          this.shiftFilterDetails = modifyShiftData;
        }
      }
    })
  }

  onShiftChange(event){
    const filterShift = this.shiftDetails.filter(x => x.id != event);
    this.shiftFilterDetails = filterShift;
  }

  onButtonClick(group) {
    let existCheck = this.entityGroupDetails.findIndex(det=> det['identifyingCode'] == group['code']);
    if(existCheck !== -1){
      if(this.entityGroupDetails[existCheck]['id'] != null){
        this.entityGroupDetails[existCheck]['isActive'] = false;
      }else{
        this.entityGroupDetails.splice(existCheck, 1);
      }
    } else{
      let groupDet = {
        "entityGroupId": 0,
        "id": null,
        "identifyingCode": group['code'],
        "identifyingType": this.SchedulerForm.controls.groupBy.value === 'grade'?"StudentGrade":"StaffDepartment",
        "identifyingValue": group['value'],
        "isActive": true
      }
      this.entityGroupDetails.push(groupDet);
    }  
  }

  triggerAction(event){
    if(event.key === 'manage'){
      this.editException(event.data)
    }else if(event.key === 'delete'){
      this.deleteException(event.data)
    }
  }

  editException(data: any){
    this.SchedulerForm.patchValue({
      type:data['overrideStatusId']?data['overrideStatusId']:null,
      period:data['holidayPatternId']?data['holidayPatternId']:null,
      selectedShift:data['pfShiftMasterId']?data['pfShiftMasterId']:null,
      fromDate:data['startDatetime']?this.datePipe.transform(new Date(data['startDatetime']), 'yyyy-MM-dd'):null,
      toDate:data['toDatetime']?this.datePipe.transform(new Date(data['toDatetime']), 'yyyy-MM-dd'):null,
      exceptionId:data['id']?data['id']:null
    })
  }

  deleteException(data: any){
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        title: 'Confirm Delete', message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if(res.confirmButtonText === 'Yes'){
        if (data.id !== null) {
          const index = this.entityExceptionData.findIndex(res => res.id === data.id);
          this.entityExceptionData[index]['deleted'] = true;
          this.tableDataActive = null;
          this.tableDataActive = this.entityExceptionData.filter(res => !(res.deleted));
        } else {
          this.entityExceptionData = this.entityExceptionData.filter(res => !(res === data));
          this.tableDataActive = null;
          this.tableDataActive = this.entityExceptionData.filter(res => !(res.deleted));
        }
        this.getExceptionData();
      }
    })
  }

  changeGroup(id) {
    this.isEnable = true;
    this.entityGroupId = id;
    this.getEntityScheduleException('entity_group',id);
  }

  getEntityExceptionData() {
   const id = this.scheduleInput?.data?.id ? this.scheduleInput?.data?.id : this.SchedulerForm.get('groupName').value;
   const fromDate = this.datePipe.transform(this.dateFilterForm.controls['fromDate'].value, 'yyyy-MM-dd');
   const toDate = this.datePipe.transform(this.dateFilterForm.controls['toDate'].value, 'yyyy-MM-dd');
   const type = this.scheduleInput?.entityType ? this.scheduleInput?.entityType : this.entityType;
    if ((this.data?.entityGroup || this.entityData?.length > 0) && this.dateFilterForm.get('fromDate').value) {
      this.getEntityScheduleException(type, id, fromDate, toDate);
    }
  }

  getEntityScheduleException(type?, id?, fromDate?, toDate?) {
    this.workflowService.getEntityScheduleExceptions(type, id, fromDate, toDate).subscribe((res) =>{
      if(res.statusCode == 1){
        this.entityId = id;
        this.entityData = res.results?.filter(x => x.entityId === this.entityId);
        if(this.entityData?.length !== 0) {
          this.entityGroup = this.entityData[0];
          this.entityGroup['entityId'] = res.results[0]?.entityId;
          this.entityGroup['shiftId'] = res.results[0]?.shiftId;
          this.entityGroup['startTime'] = res.results[0]?.startTime;
          this.entityGroup['toTime'] = res.results[0]?.toTime;
        } else {
          this.entityGroup = res.results[0];
        }
        this.startDate = fromDate;
        this.endDate = toDate;
        this.onShiftChange(this.entityGroup['shiftId']);
        this.getScheduledData(this.entityId);
        this.buildForm();
      }
    })
  }

  bindData() {
    const formValue = this.SchedulerForm.value;
    if (formValue['type']) {
      if(formValue['exceptionId'] != null){
        const index = this.entityExceptionData.findIndex(res => res.id === formValue.exceptionId);
        this.entityExceptionData[index]['overrideStatusId'] = formValue.type,
        this.entityExceptionData[index]['holidayPatternId'] = formValue.period,
        this.entityExceptionData[index]['startDatetime']= this.datePipe.transform(formValue.fromDate, 'yyyy-MM-dd 00:00:00'),
        this.entityExceptionData[index]['toDatetime'] = formValue.toDate ? this.datePipe.transform(formValue.toDate, 'yyyy-MM-dd 00:00:00'):null,
        this.entityExceptionData[index]['date'] = formValue.toDate ? `${this.datePipe.transform(formValue.fromDate, 'dd-MM-yyyy')} - 
        ${this.datePipe.transform(formValue.toDate, 'dd-MM-yyyy')}` : this.datePipe.transform(formValue.fromDate, 'dd-MM-yyyy'),
        this.entityExceptionData[index]['pfShiftMasterId'] = formValue.selectedShift,
        this.entityExceptionData[index]['shiftName'] = this.shiftName
      }else{
        let tempTableData = [...this.entityExceptionData];
        const date = this.datePipe.transform(formValue.fromDate, 'yyyy-MM-dd 00:00:00');
        const table = tempTableData?.filter(x => x.startDatetime === date && x.holidayPatternId === 'HPT-DAY');
        tempTableData.push({
          id: null,
          entityGroupId: null,
          overrideStatusId: formValue.type,
          overrideStatusName: this.selectedOverrideValue,
          holidayPatternId: formValue.period,
          holidayPatternName: this.selectedPeriod,
          startDatetime: this.datePipe.transform(formValue.fromDate, 'yyyy-MM-dd 00:00:00'),
          date: formValue.toDate ? `${this.datePipe.transform(formValue.fromDate, 'dd-MM-yyyy')} - ${this.datePipe.transform(formValue.toDate, 'dd-MM-yyyy')}` : this.datePipe.transform(formValue.fromDate, 'dd-MM-yyyy'),
          isActive: true,
          toDatetime: formValue.toDate ? this.datePipe.transform(formValue.toDate, 'yyyy-MM-dd 00:00:00'):null,
          pfShiftMasterId : formValue.selectedShift,
          holidayId : null,
          shiftName: this.shiftName
        });
        if(formValue.period === 'HPT-DAY') {
            if(table?.length > 0) {
              const updateExp = tempTableData?.findIndex(x => x.startDatetime === date && x.holidayPatternId === 'HPT-DAY');
              tempTableData[updateExp]['overrideStatusId'] = formValue.type;
              tempTableData[updateExp]['overrideStatusName'] = this.selectedOverrideValue;
              const deletedExp = tempTableData?.findIndex(x => x.id === null && x.startDatetime === date && x.holidayPatternId === 'HPT-DAY');
              tempTableData?.splice(deletedExp, 1);
          }
        }
        this.entityExceptionData = tempTableData;
        this.tableDataActive = null;
        this.tableDataActive = this.entityExceptionData.filter(res => res.isActive);
      }
      
      Object.keys(this.SchedulerForm.controls).forEach(key => {
        if (key != 'groupName' && key != 'shift' && key != 'groupBy' && key != 'shiftFromDate' && key != 'shiftToDate') {
          this.SchedulerForm.controls[key].reset();
        }
      });
      this.SchedulerForm.get('period').setValue('HPT-DAY');
      this.getExceptionData();
    }
  }

  saveEntityGroupData() {
    let postEntityGroupDetails =  {
      "entityId": this.scheduleInput?.data?.id ? this.scheduleInput?.data?.id : this.SchedulerForm.get('groupName').value,
      "entityType": this.entityType,
      "shiftId": this.SchedulerForm.get('shift').value,
      "exceptions": [],
      "startTime" : this.datePipe.transform(this.SchedulerForm.controls['shiftFromDate'].value, 'yyyy-MM-dd 00:00:00'),
      "toTime" : this.datePipe.transform(this.SchedulerForm.controls['shiftToDate'].value, 'yyyy-MM-dd 23:59:00')
    }
    if(this.weekOff?.length > 0) {
      this.weekOff.forEach( week => {
        postEntityGroupDetails['exceptions'].push({
          "holidayTypeId":"HT-WKL",
          "holidayPatternId": week,
          "comments": null,
          "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
          "holidayId": null,     
          "isHalfDay": null,
          "overrideStatusId": "ORD-LEV",
          "shiftId": null,
          "startTime": null,
          "toTime": null
        })
      })
    }
    if(this.entityExceptionData?.length > 0) {
      this.entityExceptionData.forEach( entity => {
        postEntityGroupDetails['exceptions'].push({
          "holidayTypeId":"HT-DAY",
          "holidayPatternId": entity['holidayPatternId'],
          "comments": null,
          "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
          "holidayId": null,     
          "isHalfDay": null,
          "overrideStatusId": entity['overrideStatusId'],
          "shiftId": entity['pfShiftMasterId'],
          "startTime": entity['startDatetime'],
          "toTime": entity['toDatetime']
        })
      })
    }
    console.log(postEntityGroupDetails)
    this.workflowService.postEntityScheduleExceptions(postEntityGroupDetails).subscribe((res) => {
      if(res.statusCode == 1 && res.results){
        this.toastr.success('Success', `${res.message}`);
      }else{
        this.toastr.warning('Warning', `${res.message}`);
      }
      if(this.isClose){
      this.dialog.closeAll();
      }else{
        this.ngOnInit()
      }
    });
  }

  updateEntityGroup() {
    const data = {
      "identifyingValue": (this.scheduleInput?.data?.id).toString(),
      "isActive": true,
      "pfEntityGroupId": this.entityGroupId
    }
    this.commonService.updatePfEntityGroupMapping(this.groupMappingId, data).subscribe(res => {
      if(res.statusCode == 1) {
        this.toastr.success('Success', `${res.message}`);
        this.getEntityScheduleException('entity_group', this.entityId);
      } else{
        this.toastr.warning('Warning', `${res.message}`);
      }       
    });
  }

  updateEntityGroupData(){
    let putEntityGroupDetails =  {
      "entityId": this.scheduleInput?.data?.id ? this.scheduleInput?.data?.id : this.SchedulerForm.get('groupName').value,
      "entityType": this.entityType,
      "shiftId": this.SchedulerForm.get('shift').value,
      "exceptions": [],
      "startTime" : this.datePipe.transform(this.SchedulerForm.controls['shiftFromDate'].value, 'yyyy-MM-dd 00:00:00'),
      "toTime" : this.datePipe.transform(this.SchedulerForm.controls['shiftToDate'].value, 'yyyy-MM-dd 23:59:00')
    }
    if(this.weekOff?.length > 0) {
      this.weekOff.forEach( week => {
        this.entityGroup['exceptions'].forEach(data => {
          if(data['holidayPatternId'] === week) {
            this[week + 'id'] = data['id'];
          }
        });
        putEntityGroupDetails['exceptions'].push({
          "id": this[week + 'id'] !== undefined ? this[week + 'id'] : null,
          "holidayTypeId":"HT-WKL",
          "holidayPatternId": week,
          "comments": null,
          "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
          "holidayId": null,     
          "isHalfDay": null,
          "overrideStatusId": "ORD-LEV",
          "shiftId": null,
          "startTime": null,
          "toTime": null
        })
      })
      if(this.deletedWeekOff?.length > 0) {
        this.deletedWeekOff?.forEach( week => {
          this.entityGroup['exceptions'].forEach(data => {
            if(data['holidayPatternId'] === week) {
              this[week + 'id'] = data['id'];
            }
          });
          putEntityGroupDetails['exceptions'].push({
            "id": this[week + 'id'] !== undefined ? this[week + 'id'] : null,
            "holidayTypeId":"HT-WKL",
            "holidayPatternId": week,
            "comments": null,
            "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
            "holidayId": null,     
            "isHalfDay": null,
            "overrideStatusId": "ORD-LEV",
            "shiftId": null,
            "startTime": null,
            "toTime": null,
            "deleted": true
          })
        })
      }
    }
    if(this.entityExceptionData?.length > 0) {
      this.entityExceptionData.forEach( entity => {
        putEntityGroupDetails['exceptions'].push({
          "id": entity['id'] !== undefined ? entity['id'] : null,
          "holidayTypeId":"HT-DAY",
          "holidayPatternId": entity['holidayPatternId'],
          "comments": null,
          "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
          "holidayId": null,     
          "isHalfDay": null,
          "overrideStatusId": entity['overrideStatusId'],
          "shiftId": entity['pfShiftMasterId'],
          "startTime": entity['startDatetime'],
          "toTime": entity['toDatetime'],
          "deleted": entity['deleted'] ? entity['deleted'] : false
        })
      })
    }
    console.log(putEntityGroupDetails)
    this.workflowService.putEntityScheduleExceptions(putEntityGroupDetails).subscribe((res) => {
      if(res.statusCode == 1){
        this.toastr.success('Success', `${res.message}`);
      }
      console.log(this.isClose)
      if(this.isClose){
      this.dialog.closeAll();
      }else{
        this.ngOnInit();
      }
    });
  }

  clearFields(type) {
    if(type === 'dateFilter'){
      Object.keys(this.dateFilterForm.controls).forEach(key => {
        this.dateFilterForm.reset();
      });
      this.getEntityExceptionData();
    } else{
      Object.keys(this.SchedulerForm.controls).forEach(key => {
        if (key != 'groupName' && key != 'shift' && key != 'groupBy' && key != 'shiftFromDate' && key != 'shiftToDate') {
          this.SchedulerForm.controls[key].reset();
        }
      });
      this.SchedulerForm.get('period').setValue('HPT-DAY');
    }
    
  }

  onDateChange(event, formControl) {
    if(formControl === 'toDate'){
      this.dateFilterForm.get('toDate').setValue(new Date(event));
    } else {
      this.dateFilterForm.get('fromDate').setValue(new Date(event));
    }
  }

  getDateFilterData(){
    this.getEntityExceptionData();
  }

  isLinked(code: string): boolean {
    return this.linkedGroupDetails.some(detail => detail.identifyingCode === code && detail.id!=null);
  }

  entitySelectionChange(data){
    if(data === 'dept'){
      this.configurationService.getAssetDepartment().subscribe((res)=>{
        if(res.statusCode == 1){
          let deptList = res.results;
          this.cardInfo = deptList.map(item => ({
            code: item.id.toString(),
            value: item.name
          }))
          this.updateCardInfo();
        }
      })
    } else{
      if(this.studentGradeInfo){
        this.cardInfo = this.studentGradeInfo;
        this.updateCardInfo();
      } else{
        this.commonService.getAppTerms('StudentGrade')
        .subscribe(res => {
          this.studentGradeInfo = res.results.filter(resFilter => resFilter.groupName === 'StudentGrade');
          this.cardInfo = this.studentGradeInfo;
          this.updateCardInfo();
        })
      }
      
    }
  }

  updateCardInfo(){
    this.cardInfo.forEach(card => {
      const currentMatch = this.entityGroupDetails.some(detail => detail.identifyingCode === card.code);
      if(currentMatch){
        card["selected"] = true;
      }else{
        card["selected"] = false;
      }
      
      const match = this.linkedGroupDetails.some(detail => detail.identifyingCode === card.code);
      card["isExist"] = match;
    });
  }

  getFormattedDate(dateString: string): string {
    try {
      return this.datePipe.transform(new Date(dateString), 'dd-MM-yyyy');
    } catch (error) {
      return dateString
    }
  }

  getWeekOff(day) {
    const dayExist = this.weekOff?.filter(x => x === day);
    if(dayExist?.length === 0) {
      this.weekOff.push(day);
    } else {
      this.deletedWeekOff.push(day);
      this.weekOff = this.weekOff?.filter(x => x !== day);
    }
    this.getExceptionData();
  }

  getExceptionData() {
    this.exceptionDetails = [];
    if(this.weekOff?.length > 0) {
      this.weekOff.forEach( week => {
        this.exceptionDetails.push({
          "typeId":"HT-WKL",
          "holidayPatternId": week,
          "comments": null,
          "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
          "holidayId": null,     
          "isHalfDay": null,
          "statusId": "ORD-LEV",
          "shiftId": null,
          "startDate": null,
          "endDate": null,
          "name": "Week Off"
        })
      })
    }
    if(this.entityExceptionData?.length > 0) {
      this.entityExceptionData.forEach( entity => {
        if(!entity['deleted']) {
          this.exceptionDetails.push({
            "typeId":"HT-DAY",
            "holidayPatternId": entity['holidayPatternId'],
            "comments": null,
            "eventDate": this.datePipe.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
            "holidayId": null,     
            "isHalfDay": null,
            "statusId": entity['overrideStatusId'],
            "shiftId": entity['pfShiftMasterId'],
            "startDate": this.datePipe.transform(entity['startDatetime'],'dd-MM-yyyy'),
            "endDate": this.datePipe.transform(entity['toDatetime'],'dd-MM-yyyy'),
            "name" : entity['overrideStatusId'] === "ORD-WRK" ? "Working" : "Leave"
          })
        }
      })
    }
    this.calenderDetails()
  }

  calenderDetails() {
    this.calendarData = {};
    this.calendarData = {
      "entityId": null,
      "entityType": '',
      'fromDate': '',
      'toDate': '',
      'fromTime': null,
      'toTime': null,
      'status': 'CAL-MS',
      'options': {},
      'refresh': null,
      'data' : this.exceptionDetails
    }
  }

  dateChange(value) {
    const date = this.datePipe.transform(value, 'yyyy-MM-dd')
    if(date > this.monthEndDate) {
      this.workflowService.getHolidays(this.monthStartDate, date).subscribe(res => {
        if (res.statusCode != 0) {
          this.holidayData = res.results?.filter(x => x.isActive == true);
        }
      });
    } else {
      this.holidayData = this.holidayDetails;
    }
  }

  holidayDateFilter = (date: Date | null): boolean => {
    try{
      let date1 = new Date(date);
      if (!date1) return false;
  
      const day = date1.getDay();
      const dateString = date1.toISOString().split('T')[0];
      const dateStringFormatted = `${('0' + date1.getDate()).slice(-2)}-${('0' + (date1.getMonth() + 1)).slice(-2)}-${date1.getFullYear()}`;

      for (const holiday of this.holidayData) {
        const daysOfWeek = ['DAY1-SUN', 'DAY2-MON', 'DAY3-TUE', 'DAY4-WED', 'DAY5-THU', 'DAY6-FRI', 'DAY7-SAT'];
        const dayIndex = new Date(date).getDay();
        const index = daysOfWeek[dayIndex];
        if (holiday.typeId === 'HT-WKL' && holiday.holidayPatternId === index) {
          return false;
        }
        if (holiday.typeId === 'HT-RAG' && holiday.startDate && holiday.endDate) {
          const startDate = new Date(holiday.startDate.split('-').reverse().join('-')).getTime();
          const endDate = new Date(holiday.endDate.split('-').reverse().join('-')).getTime();
          if (date1.getTime() >= startDate && date1.getTime() <= endDate) {
            return false;
          }
        }
        if (holiday.typeId === 'HT-DAY' && holiday.startDate === dateStringFormatted) {
          return false;
        }
      }
    } catch(e) {
      console.log(e)
    }
    return true;
  } 

  getGroupDataView(event) {
    let popupInfo = null;
    if (event != null) {
      this.commonService.getEntityGroup().subscribe(res => {
        if (res.statusCode == 1) {
          const groupData = res.results.find(x => x.id === event);
          if (groupData != undefined || groupData != null) {
          groupData['ID'] = groupData.id;
          groupData['Name'] = groupData.name;
          groupData['Status'] = groupData.isActive;
          popupInfo = {
            type: groupData?.entityTypeId,
            entity: groupData,
            showSideBar: false
          }
            const dialogRef = this.dialog.open(EntityGroupComponent, {
              data: popupInfo,
              panelClass: ['medium-popup'],
              disableClose: true
            });
            dialogRef.afterClosed().subscribe(() => {
            });
          } else {
            this.toastr.error('An error occurred while processing your request.', 'Error');
          }
        }
      })
    } else {
      this.toastr.error('Group name is missing.', 'Error');
    }
  }
  
  calendarUpdatedData(event){
    console.log(event)
  }
  fixClick() {
    console.log('')
  }
}