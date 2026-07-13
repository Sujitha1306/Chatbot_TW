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

import { DatePipe } from '@angular/common';
import { Component,Inject, OnInit,ViewChild,} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatCalendar } from '@angular/material/datepicker';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CommonService, ConfigurationService } from '../../../../services';
import { CreateRoutineActivity, EditRoutineActivity } from '../../workflow-management/workflow-management.model';
import { MAT_DIALOG_DATA,MatDialogRef} from '@angular/material/dialog';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-manage-routine-activity',
  templateUrl: './manage-routine-activity.component.html',
  styleUrls: ['./manage-routine-activity.component.scss']
})
export class ManageRoutineActivityComponent implements OnInit {
  public today = new Date();
  public activityForm: FormGroup;
  public createRoutineActivity: CreateRoutineActivity;
  public editRoutineActivity: EditRoutineActivity
  activityTypeList: any;
  inchargeList: any[] = [];
  statusList: any;
  scheduleType: any;
  locationId: null;
  locationListItems: any;
  locationList: any;
  locationEnabled: boolean = false;
  roleIds: any;
  inchargeEnabled: boolean = false;
  departmentIds: any;
  departmentList: any[];
  listItems: any;
  inchargeId: null;
  toHit: boolean = false;
  activityList: any;
  originalInchargeTypeList: any;
  inchargeTypeList: any[] = [];
  public defaultscheduleTime =  this.dateFormat.transform(this.today, 'h:mm a');
  status: boolean = false;
  activityData = null;
  activityIdData = null;
  activityScheduleId: any;
  selectedSchedule = null;
  weekDaysList: any
  selectedDates: string[] = [];
  selectedTimestamps = new Set<number>();
  selectedRawDates: Date[] = [];
  selectedCollection: any;
  hours: string;
  minutes: string;
  totalMinutes: number;
  minStart: Date;
  maxEnd: Date;
  duration: string = "00:30";
  @ViewChild('calendarRef') calendar!: MatCalendar<Date>;
  priorityLevel: any;
  public selectedTabIndex = 0;
  public configType = 'create'
  public entityConfigType: any;
  isReminderFormValid: boolean = false;
  public reminderData = null;
  slaData =  null;
  slaReminderId = null;
  rType = null;
  

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public bottomSheetRef: MatDialogRef<ManageRoutineActivityComponent>,
    public form: FormBuilder, private readonly dateFormat: DatePipe,
    private readonly commonService: CommonService, private readonly configurationService: ConfigurationService, public toastr: AppToastService,
    // @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    // @Optional() public bottomSheetRef: MatBottomSheetRef<ManageRoutineActivityComponent>
  ) {
      if(this.data.hasOwnProperty('RType') && this.data.RType === 'template'){
        this.entityConfigType = 'pf_routine_activity'
        this.rType = this.data.RType
      } else {
        this.entityConfigType = 'entity_routine_activity'
      }
     }


  ngOnInit(): void {
    console.log(this.data)
    this.minStart =  new Date(this.data.routineStartDate);
    this.maxEnd = this.data.routineEndDate  !== null ? new Date(this.data.routineEndDate) : null;
    this.commonService.getAppTerms('Status,RecipientType,ScheduleActivityType,CalenderWeek,PriorityLevel').subscribe(res => {
      this.statusList = res.results.filter(resFilter => resFilter.code === 'ST-AT' || resFilter.code === 'ST-IA');
      this.originalInchargeTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT'));
      this.scheduleType = this.entityConfigType !== 'pf_routine_activity' ? res.results.filter(resFilter => resFilter.groupName === 'ScheduleActivityType') : 
        res.results.filter(resFilter => resFilter.groupName === 'ScheduleActivityType' && resFilter.code !== 'SAT-ODB' && resFilter.code !== 'SAT-ODA');
      this.weekDaysList = res.results.filter(resFilter => resFilter.groupName === 'CalenderWeek');
      this.priorityLevel = res.results.filter(resFilter => resFilter.groupName === 'PriorityLevel')
    })
    this.commonService.getAppTermsLink(this.data.routineType, 'ActivityCategory').subscribe(res => {
      this.activityTypeList = res.results;
    })
    this.buildForm()
    this.selectedActivitySchedule(null)
    this.selectedSchedule = this.data.scheduleType;
    if (this.data.activityData) {
      this.activityData = this.data.activityData;
      const data = this.data.activityData;
      data['dataType'] = 'get';
      if(this.entityConfigType !== 'entity_routine_activity'){
        data['id'] = data.routineActivityId;
        this.reminderData = data;
      } else {
        data['id'] = data.hasOwnProperty('entityRoutineActivityId') ? data.entityRoutineActivityId : data.routineActivityId;
        this.reminderData = data;
      }
      if(this.data.type === 'create' && this.data.activityData === null) {
        this.configType = 'create'
      } else {
        this.configType = 'modify'
      }
      if(this.activityData.scheduleTypeId) {
        this.selectedActivitySchedule(this.activityData.scheduleTypeId)
      }
      let id = this.activityData.activityIdentifyingId
      this.selectedDates = this.activityData.scheduleDates;
      if(this.selectedDates && this.selectedDates.length){
        for(let dateStr of this.selectedDates){
          this.dateClassFunction(new Date(dateStr));
        }
      }
      if (this.data && this.data.minDuration) {
        this.duration = this.data && this.data.minDuration
          ? `${Math.floor(this.data.minDuration / 60).toString().padStart(2, '0')}:${(this.data.minDuration % 60).toString().padStart(2, '0')}`
          : '00:30';
      }
      this.configurationService.getActivitiesById(id).subscribe(res => {
        this.activityIdData = res.results[0];
        this.roleIds = this.activityIdData.roleIds;
        this.departmentIds = this.activityIdData.departmentIds;
        setTimeout(()=>{
        this.updateInchargeTypeList(this.roleIds, this.departmentIds);
        if(this.activityData.scheduleTypeId){
          this.activityScheduleId = this.activityData.scheduleTypeId;
        }
        this.configurationService.getTaskActivities(this.data.routineType, this.activityIdData.activityCategoryId).subscribe(res => {
          this.activityList = res.results;
        });
        this.buildForm()
        if (this.activityData.locationId !== null) {
          this.locationId = this.activityData.locationId;
          this.commonService.getLocationById(this.activityData.locationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.activityForm.get('locationId').setValue(locationName)
            }
            this.activityForm.get('locationId').updateValueAndValidity();
          });
        }
        if (this.activityData.inchargeId !== null) {
          let type = this.activityData.inchargeType
          this.inchargeId = this.activityData.inchargeId;
          if (type === 'RT-RO') {
            this.configurationService.getRecipientName('', type).subscribe(res => {
              this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
              this.inchargeEnabled = true;
              if (this.inchargeList.length) {
                let name = this.inchargeList[0].name
                this.activityForm.get('assignId').setValue(name)
              }
              this.activityForm.get('assignId').updateValueAndValidity();
            });
          } else if (type == 'RT-US') {
            let roles = this.roleIds.join(',');
            let departments = this.departmentIds && this.departmentIds.join(',');
            this.configurationService.getRoleUser(null, roles, departments, this.inchargeId).subscribe(res => {
              this.inchargeList = res.results
              this.inchargeEnabled = true;
              if (this.inchargeList.length) {
                let name = this.inchargeList[0].name;
                this.activityForm.get('assignId').setValue(name);
              }
              this.activityForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
            });
          } else if (type == 'RT-DT') {
            this.commonService.getAllDepartments().subscribe(res => {
              this.inchargeList = res.results.filter(val => val.id === this.inchargeId);
              this.inchargeEnabled = true;
              if (this.inchargeList.length) {
                let name = this.inchargeList[0].name;
                this.activityForm.get('assignId').setValue(name);
              }
            });
          }
        }
        this.selectedRoutineSchedule(this.selectedSchedule)
        }, 200)
      })
    }
    this.selectedRoutineSchedule(this.selectedSchedule)
  }

  stopEventPropagation(event: Event): void {
    event.stopPropagation();
  }

  toggleDate(event: any): void {
    const selectedDate = new Date(event);
    const dateString = selectedDate.toLocaleDateString('en-CA');
    const indexInSelectedDates = this.selectedDates.indexOf(dateString);
    if (indexInSelectedDates  > -1) {
      this.selectedDates.splice(indexInSelectedDates, 1);
    } else {
      this.selectedDates.push(dateString);
    }
    this.activityForm.get('selectedDates')?.setValue(this.selectedDates);
    this.activityForm.get('selectedDates')?.updateValueAndValidity()
    this.calendar.updateTodaysDate();
  }

  dateClassFunction = (date: Date): string => {
    const jsDate = new Date(date);
    const dateString = jsDate.toLocaleDateString('en-CA');
    const isSelected = this.selectedDates.includes(dateString);
    return isSelected ? 'my-selected-date' : '';
  }

  public remove(dateStr: string): void {
    const date = new Date(dateStr);
    this.dateClassFunction(date)
    const index = this.selectedDates.indexOf(dateStr);
    if (index > -1) {
      this.selectedDates.splice(index, 1);
    }
    this.activityForm.get('selectedDates')?.setValue(this.selectedDates);
    this.activityForm.get('selectedDates')?.updateValueAndValidity()
    this.calendar.updateTodaysDate();
  }


  buildForm() {
    this.activityForm = this.form.group({
      activityCategory: [this.activityIdData?.activityCategoryId ? this.activityIdData?.activityCategoryId : null, [Validators.required]],
      activityId: [this.activityData && this.activityData.activityIdentifyingId ? this.activityData.activityIdentifyingId : null, [Validators.required]],
      scheduleTime: [this.activityData && this.activityData.schedule ? this.dateFormat.transform(this.activityData.schedule, 'HH:mm:ss') : this.defaultscheduleTime],
      assignTypeId: [this.activityData && this.activityData.inchargeType ? this.activityData.inchargeType : null, [Validators.required]],
      assignId: [this.activityData && this.activityData.inchargeId ? this.activityData.inchargeId : null, [Validators.required, this.validateAssignTo.bind(this)]],
      sequence: [this.activityData && this.activityData.sequence ? this.activityData.sequence : null],
      priority: [this.activityData && this.activityData.priority ? this.activityData.priority : null],
      locationId: [null, [this.validateLocationSelection.bind(this)]],
      isActive: [this.activityData && this.activityData.isActive ? this.activityData.isActive ? 'ST-AT' : 'ST-IA' : 'ST-AT'],
      scheduleType: [this.activityData && this.activityData.scheduleTypeId ? this.activityData.scheduleTypeId : null],
      weightage: [this.activityData && this.activityData.weightage ? this.activityData.weightage : null],
      mandatory: [this.activityData && this.activityData.mandatory ? this.activityData.mandatory : false],
      isRecurring: [this.activityData && this.activityData.isRecurring ? this.activityData.isRecurring : false],
      dayCount: [this.activityData && this.activityData.dayCount ? this.activityData.dayCount : null],
      onDate: [this.activityData && this.activityData.dayTypeIds ? this.activityData.dayTypeIds : null],
      isRepeat: [this.activityData && this.activityData.isRepeat ? this.activityData.isRepeat : null],
      duration: [this.activityData && this.duration ? this.duration : '00:30'],
      fromDate: [this.activityData && this.activityData.fromDate ? this.dateFormat.transform(this.activityData.fromDate, 'yyyy-MM-dd') : null],
      toDate: [this.activityData && this.activityData.toDate ? this.dateFormat.transform(this.activityData.toDate, 'yyyy-MM-dd') : null],
      priorityLevel: [this.activityData && this.activityData.priorityLevelId ? this.activityData.priorityLevelId : null],
      selectedDates: [this.selectedDates && this.selectedDates.length ? this.selectedDates : []],
    })
  }

  selectedRoutineSchedule(event) {
    this.selectedSchedule = event;
    const formControls = this.activityForm.controls;
    if (this.selectedSchedule === 'SCT-ALW' && this.data.routineType === 'ROU-EMG') {
      formControls['sequence'].setValidators(null);
      formControls['priority'].setValidators(null);
      formControls['duration'].setValidators(null);
      formControls['scheduleType'].setValidators(null);
    } else if (this.selectedSchedule === 'SCT-ALW') {
      formControls['sequence'].setValidators([Validators.required]);
      formControls['priority'].setValidators([Validators.required]);
      formControls['duration'].setValidators([Validators.required]);
      formControls['scheduleType'].setValidators(null);
    } else {
      formControls['scheduleType'].setValidators([Validators.required]);
      formControls['sequence'].setValidators(null);
      formControls['priority'].setValidators(null);
      formControls['duration'].setValidators(null);
    }
    Object.keys(formControls).forEach(key => {
      formControls[key].updateValueAndValidity();
    });
  }

  private validateAssignTo(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.inchargeList || this.inchargeList.length === 0) {
        return { invalidAssign: true };
      }
      
      let selectedAssign = this.inchargeList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedAssign) {
        return { invalidAssign: true };
      }
    }
    return null;
  }

  private validateLocationSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.locationList || this.locationList.length === 0) {
        return { invalidLocation: true };
      }

      let selectedLocation = this.locationList.find(val => {
        let combinedName = `${val.fullName}`;
        return val.id === selectedId || combinedName === selectedId;
      });
      if (!selectedLocation) {
        return { invalidLocation: true };
      }
    }
    return null;
  }

  private updateInchargeTypeList(selectedRoles: any[], selectedDepartments: any[]) {
    let filteredList: any[] = [];
    if (selectedRoles?.length) {
      filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
    }
    if (selectedDepartments?.length) {
      filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
    }
    this.inchargeTypeList = [...new Set(filteredList)];
  }

  getLocationList(id) {
    if (id !== null) {
      const location = this as any as { id: string, fullName: string }[]
      const locationId = location.find(obj => obj.id === id).fullName;
      return locationId;
    } else {
      return '';
    }
  }

  searchLocationList(event) {
    this.locationId = null;
    if(event.type === 'locationSearch' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.locationListItems = res.results;
          this.locationList = this.locationListItems;
          this.locationEnabled = true;
        });
      } else {
        this.locationList = this.locationListItems;
        this.locationEnabled = true;
      }
    } else {
      this.locationList = [];
      this.locationEnabled = false;
    }
  }

  getActivityType(event) {
    let selectedRoutineType = this.data.routineType;
    let selectedActivityId = this.activityForm.controls['activityCategory'].value;
    this.configurationService.getTaskActivities(selectedRoutineType, selectedActivityId).subscribe(res => {
      this.activityList = res.results;
    });
  }

  getActivityDetails(event) {
    this.configurationService.getActivitiesById(event.value).subscribe(res => {
      const data = res.results[0];
      this.entityConfigType = 'pf_activity';
      data['dataType'] = "get";
      this.reminderData = data;
      this.roleIds = data.roleIds;
      this.departmentIds = data.departmentIds;
      this.updateInchargeTypeList(this.roleIds, this.departmentIds);
      this.inchargeId = data.inchargeId;
      if (data && data.minDuration) {
        this.duration = data && data.minDuration
          ? `${Math.floor(data.minDuration / 60).toString().padStart(2, '0')}:${(data.minDuration % 60).toString().padStart(2, '0')}`
          : '00:30';
      }
      if(this.inchargeId !== null) {
        if (data.inchargeType === 'RT-RO') {
          this.configurationService.getRecipientName('', data.inchargeType).subscribe(res => {
            let selectedRoles = this.roleIds
            if (selectedRoles !== null) {
              this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
              this.inchargeEnabled = true;
              this.activityForm.get('assignId').setValue(this.inchargeList[0].name)
              this.activityForm.get('assignId').updateValueAndValidity()
            } else {
              this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
              this.inchargeEnabled = true;
              this.activityForm.get('assignId').updateValueAndValidity()
            }
          });
        } else if (data.inchargeType === 'RT-DT') {
          this.commonService.getAllDepartments().subscribe(res => {
            let selectedDepartments = this.departmentIds
            if (selectedDepartments !== null) {
              this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
              this.inchargeEnabled = true;
              this.departmentList = this.inchargeList;
              this.activityForm.get('assignId').setValue(this.inchargeList[0].name)
              this.activityForm.get('assignId').updateValueAndValidity()
            } else {
              this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
              this.inchargeEnabled = true;
              this.departmentList = this.inchargeList;
              this.activityForm.get('assignId').updateValueAndValidity()
            }
          });
        } else if (data.inchargeType === 'RT-US') {
          let departmentsString = this.departmentIds;
          let roles = this.roleIds;
          let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
          let inchargeId = data.inchargeId !== null || data.inchargeId !== '' ? data.inchargeId : null;
          this.configurationService.getRoleUser(null, roles, departments, inchargeId).subscribe(res => {
            this.listItems = res.results;
            this.inchargeList = this.listItems;
            this.inchargeEnabled = true;
            if(inchargeId !== null && data.inchargeName !== this.inchargeList[0].name){
              this.activityForm.get('assignId').setValue(this.inchargeList[0].name)
            } else {
              this.activityForm.get('assignId').setValue(data.inchargeName)
            }
            this.activityForm.get('assignId').updateValueAndValidity()
          });
        } else {
          this.inchargeList = [];
          this.inchargeEnabled = false;
        }
      }
      if(data.destinationId !== null){
        this.locationId = data.destinationId;
          this.commonService.getLocationById(this.locationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.activityForm.get('locationId').setValue(locationName)
            }
            this.activityForm.get('locationId').updateValueAndValidity();
          });
      }
      this.activityForm.patchValue({
        'assignTypeId': data.inchargeType,
        'sequence': data.sequence ,
        'priority': data.priority,
        'duration': this.duration,
        'scheduleType': data.scheduleTypeId,
        'priorityLevel': data.priorityLevelId
      });
      this.activityForm.get('assignId').updateValueAndValidity()
    });
  }

  getInchargeList(id) {
    if (id !== null) {
      const incharge = this as any as { id: string, name: string }[]
      const inchargeId = incharge.find(obj => obj.id === id).name;
      return inchargeId;
    } else {
      return '';
    }
  }

  searchUserNamelist(event) {
    this.inchargeId = null;
    const type = this.activityForm.controls['assignTypeId'].value;
    if (event.type === 'inchargeSearch' && event.text.length >= 2) {
      if (this.toHit === true && type === 'RT-US') {
        let roles = this.roleIds.join(',');
        let departments = this.departmentIds.join(',');
        this.configurationService.getRoleUser(event.text, roles, departments).subscribe(res => {
          this.inchargeList = res.results;
          this.inchargeEnabled = true;
        });
      } else {
        this.inchargeList = this.listItems;
        this.inchargeEnabled = true;
      }
    } else {
      if (type === 'RT-RO') {
      this.configurationService.getRecipientName('', type).subscribe(res => {
        let selectedRoles = this.roleIds
        if (selectedRoles !== null) {
          this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
          this.inchargeEnabled = true;
        } else {
          this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
          this.inchargeEnabled = true;
        }
      });
      } else if (type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        let selectedDepartments = this.departmentIds
        if (selectedDepartments !== null) {
          this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
          this.inchargeEnabled = true;
        } else {
          this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
          this.inchargeEnabled = true;
        }
      });
      } else {
        this.inchargeList = [];
        this.inchargeEnabled = false;
      }
    }
  }

  getIncharge(type) {
    type = type.value
    this.activityForm.controls['assignId'].setValue(null);
    if (type === 'RT-RO') {
      this.configurationService.getRecipientName('', type).subscribe(res => {
        let selectedRoles = this.roleIds
        if (selectedRoles !== null) {
          this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
          this.inchargeEnabled = true;
        } else {
          this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
          this.inchargeEnabled = true;
        }
      });
    } else if (type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        let selectedDepartments = this.departmentIds
        if (selectedDepartments !== null) {
          this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
          this.inchargeEnabled = true;
          this.departmentList = this.inchargeList;
        } else {
          this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
          this.inchargeEnabled = true;
          this.departmentList = this.inchargeList;
        }
      });
    } else if (type === 'RT-US') {
      let departmentsString = this.departmentIds;
      let roles = this.roleIds;
      let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
      this.configurationService.getRoleUser(null, roles, departments).subscribe(res => {
      this.inchargeList = res.results;
      this.listItems = this.inchargeList;
      this.inchargeEnabled = true;
      });
    } else {
      this.inchargeList = [];
      this.inchargeEnabled = false;
    }
  }

  selectedActivitySchedule(code: string) {
    this.activityScheduleId = code;
    const validatorsMap = {
      'SAT-BTM': { scheduleTime: Validators.required, dayCount: null, onDate: null, selectedDates: null},
      'SAT-DBT': { scheduleTime: Validators.required, dayCount: null, onDate: Validators.required, selectedDates: null},
      'SAT-RGAT': { scheduleTime: null, dayCount: Validators.required, onDate: null, selectedDates: null},
      'SAT-RGBT': { scheduleTime: Validators.required, dayCount: Validators.required, onDate: null, selectedDates: null},
      'SAT-DAT': { scheduleTime: null, dayCount: null, onDate: Validators.required, selectedDates: null},
      'SAT-ODA': { scheduleTime: null, dayCount: null, onDate: null, selectedDates: Validators.required},
      'SAT-ODB': { scheduleTime: Validators.required, dayCount: null, onDate: null, selectedDates: Validators.required}
    };
    const selectedValidators = validatorsMap[code] || { scheduleTime: null, dayCount: null, onDate: null, selectedDates:null };
    Object.keys(selectedValidators).forEach((key) => {
      this.activityForm.get(key).setValidators(selectedValidators[key]);
      this.activityForm.get(key).updateValueAndValidity();
    });
    if(this.activityScheduleId === 'SAT-ODB' || this.activityScheduleId === 'SAT-ODA') {
      this.activityForm.get('fromDate').setValue(null);
      this.activityForm.get('toDate').setValue(null);
      this.activityForm.get('selectedDates').setValue(null);
      this.selectedDates = [];
    }
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.selectedTabIndex = tabChangeEvent.index;
  }

  checkNotifiValidityChange(valid: boolean){
    this.isReminderFormValid = valid;
  }

  slaNotifiData(data){
    this.slaData = data
  }

  addActivity() {
    const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
    const time = date + ' ' + this.activityForm.controls['scheduleTime'].value;
    let schedule = null
    let scheduleType = this.activityForm.controls['scheduleType'].value;
    if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
      schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    } else {
      schedule = null
    }
    if (this.activityForm.controls['isActive'].value === 'ST-AT') {
      this.status = true;
    } else {
      this.status = false;
    }
    let locationId = typeof this.activityForm.controls['locationId'].value === 'string' ? this.locationId : this.activityForm.controls['locationId'].value;
    let assignId = typeof this.activityForm.controls['assignId'].value === 'string' ? this.inchargeId : this.activityForm.controls['assignId'].value;
    const assignName = this.inchargeList.find(f => f.id === assignId)
    const scheduleTypeName = this.scheduleType.find(f => f.code === this.activityForm.controls['scheduleType'].value)
    const activityName = this.activityList.find(f => f.id === this.activityForm.controls['activityId'].value)
    const duration: string = this.activityForm.controls['duration'].value;
    if (duration) {
    const [hrs, mins] = duration.split(':').map(Number);
    this.totalMinutes = hrs * 60 + mins;
    }
    let addActivityData = {
      "activityIdentifyingId" : this.activityForm.controls['activityId'].value,
      "activityIdentifyingType": 'activity',
      "activityName":activityName.name, 
      "schedule" : schedule,
      "inchargeType" : this.activityForm.controls['assignTypeId'].value,
      "inchargeId" : assignId,
      "inchargeName": assignName?.name,
      "sequence" : this.activityForm.controls['sequence'].value,
      "priority" : this.activityForm.controls['priority'].value,
      "minDuration" : this.totalMinutes,
      "locationId" : locationId,
      "isActive" : this.status,
      "scheduleTypeId" : this.activityForm.controls['scheduleType'].value,
      "scheduleTypeName": scheduleTypeName?.value,
      "weightage" : this.activityForm.controls['weightage'].value,
      "mandatory" : this.activityForm.controls['mandatory'].value,
      "isRecurring" : this.activityForm.controls['isRecurring'].value,
      "dayTypeIds": this.activityForm.controls['onDate'].value,
      "dayCount": this.activityForm.controls['dayCount'].value,
      "isRepeat": this.activityForm.controls['isRepeat'].value,
      "entityRoutineId": this.data.routineId ? this.data.routineId : null,
      "fromDate": this.dateFormat.transform(this.activityForm.controls['fromDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      "toDate": this.dateFormat.transform(this.activityForm.controls['toDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      "scheduleDates": this.selectedDates && this.selectedDates.length ? this.selectedDates : null,
      "priorityLevelId": this.activityForm.controls['priorityLevel'].value
    }
    if((this.data.routineId !== null && this.data.activityData !== null) || (this.data.routineId !== null && this.data.type === 'modify')){
      this.configurationService.createEntityRoutActivity(addActivityData).subscribe(res =>{
        if(res.statusCode === 1){
          const data = res.results;
          if(this.isReminderFormValid && this.slaReminderId !== null){
            this.entityConfigType = 'entity_routine_activity'
            data['dataType'] = 'create';
            data['id'] = data.entityRoutineActivityId
            this.reminderData = data;
          }
          this.toastr.success('Success', `${res.message}`);
         // this.bottomSheetRef.dismiss()
           this.bottomSheetRef.close()
        }
      })
    } else {
      addActivityData['type'] = this.data.type;
      if(this.isReminderFormValid) {
        this.entityConfigType = 'entity_routine_activity'
        addActivityData['dataType'] = 'slaCollect';
        addActivityData['id'] = null;
        this.reminderData = addActivityData;
      }
      setTimeout(()=>{
        addActivityData['reminderSla'] = this.slaData? this.slaData : null;
        const data = {success: true, message: "Activity Added Successfully", results: addActivityData}
        this.toastr.success('Success', `${'Activity added successfully.'}`);
        //this.bottomSheetRef.dismiss(data);
       this.bottomSheetRef.close(data)
      }, 200);
    }
  }

  updateActivity(){
    const date = this.dateFormat.transform(this.activityData.schedule ? this.activityData.schedule : this.today, 'yyyy-MM-dd');
    const time = date + ' ' + this.activityForm.controls['scheduleTime'].value;
    let schedule = null;
    let scheduleType = this.activityForm.controls['scheduleType'].value;
    if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
      schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    } else {
      schedule = null
    }
    if (this.activityForm.controls['isActive'].value === 'ST-AT') {
      this.status = true;
    } else {
      this.status = false;
    }
    let locationId = typeof this.activityForm.controls['locationId'].value === 'string' ? this.locationId : this.activityForm.controls['locationId'].value;
    let assignId = typeof this.activityForm.controls['assignId'].value === 'string' ? this.inchargeId : this.activityForm.controls['assignId'].value;
    const assignName = this.inchargeList.find(f => f.id === assignId)
    const scheduleTypeName = this.scheduleType.find(f => f.code === this.activityForm.controls['scheduleType'].value)
    const activityName = this.activityList.find(f => f.id === this.activityForm.controls['activityId'].value)
    const duration: string = this.activityForm.controls['duration'].value;
    if (duration) {
      const [hrs, mins] = duration.split(':').map(Number);
      this.totalMinutes = hrs * 60 + mins;
    }
      let routineActId = this.data.activityData.routineActivityId ? this.data.activityData.routineActivityId : null;
      let updateActivityData = {
        "activityIdentifyingId" : this.activityForm.controls['activityId'].value,
        "activityIdentifyingType": 'activity',
        "activityName":activityName.name, 
        "schedule" : schedule,
        "inchargeType" : this.activityForm.controls['assignTypeId'].value,
        "inchargeId" : assignId,
        "inchargeName": assignName?.name,
        "sequence" : this.activityForm.controls['sequence'].value,
        "priority" : this.activityForm.controls['priority'].value,
        "minDuration" : this.totalMinutes,
        "locationId" : locationId,
        "isActive" : this.status,
        "scheduleTypeId" : this.activityForm.controls['scheduleType'].value,
        "scheduleTypeName": scheduleTypeName?.value,
        "weightage" : this.activityForm.controls['weightage'].value,
        "mandatory" : this.activityForm.controls['mandatory'].value,
        "isRecurring" : this.activityForm.controls['isRecurring'].value,
        "dayTypeIds": this.activityForm.controls['onDate'].value,
        "dayCount": this.activityForm.controls['dayCount'].value,
        "isRepeat": this.activityForm.controls['isRepeat'].value,
        "routineActivityId": routineActId,
        "fromDate": this.dateFormat.transform(this.activityForm.controls['fromDate'].value, 'yyyy-MM-dd HH:mm:ss'),
        "toDate": this.dateFormat.transform(this.activityForm.controls['toDate'].value, 'yyyy-MM-dd HH:mm:ss'),
        "scheduleDates": this.selectedDates && this.selectedDates.length ? this.selectedDates : null,
        "priorityLevelId": this.activityForm.controls['priorityLevel'].value
      }
      if(this.data.routineId && this.data.type === "modify") {
        this.configurationService.updateEntityRoutActivity(this.activityData.entityRoutineActivityId, updateActivityData).subscribe(res => {
          if(res.statusCode == 1){
            if(this.isReminderFormValid) {
              this.entityConfigType = 'entity_routine_activity'
              const data = res.results;
              data['dataType'] = 'update';
              data['id'] = data.entityRoutineActivityId
              this.reminderData = data;
            }
            this.toastr.success('Success', `${res.message}`);
           //  this.bottomSheetRef.dismiss('confirm');
             this.bottomSheetRef.close()
          }
        }, err => {
            this.toastr.error('Error', `${err.error.message}`);
        })
      } else {
        if(this.isReminderFormValid) {
          this.entityConfigType = 'entity_routine_activity'
          updateActivityData['dataType'] = 'slaCollect';
          updateActivityData['id'] = null;
          this.reminderData = updateActivityData;
        }
        setTimeout(()=>{
        updateActivityData['reminderSla'] = this.slaData? this.slaData : null;
        const data = {success: true, message: "Activity Added Successfully.", results: updateActivityData}
        this.toastr.success('Success', `${'Activity updated successfully.'}`);
         //this.bottomSheetRef.dismiss(data)
        this.bottomSheetRef.close(data);
        }, 200);
      }
  }

  addPfActivity() {
    const date = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
    const time = date + ' ' + this.activityForm.controls['scheduleTime'].value;
    let schedule = null
    let scheduleType = this.activityForm.controls['scheduleType'].value;
    if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
      schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    } else {
      schedule = null
    }
    if (this.activityForm.controls['isActive'].value === 'ST-AT') {
      this.status = true;
    } else {
      this.status = false;
    }
    let assignId = typeof this.activityForm.controls['assignId'].value === 'string' ? this.inchargeId : this.activityForm.controls['assignId'].value;
    let locationId = typeof this.activityForm.controls['locationId'].value === 'string' ? this.locationId : this.activityForm.controls['locationId'].value;
    const duration: string = this.activityForm.controls['duration'].value;
    if (duration) {
      const [hrs, mins] = duration.split(':').map(Number);
      this.totalMinutes = hrs * 60 + mins;
    }
    this.createRoutineActivity = new CreateRoutineActivity(null, null);
    let activities = [
      {
        "schedule": schedule,
        "activityIdentifyingType": 'activity',
        "activityIdentifyingId": this.activityForm.controls['activityId'].value,
        "inchargeType": this.activityForm.controls['assignTypeId'].value,
        "inchargeId": assignId,
        "sequence" : this.activityForm.controls['sequence'].value,
        "priority" : this.activityForm.controls['priority'].value,
        "minDuration": this.totalMinutes,
        "locationId": locationId,
        "isActive": this.status,
        "scheduleTypeId": this.activityForm.controls['scheduleType'].value,
        "weightage": this.activityForm.controls['weightage'].value,
        "dayTypeIds": this.activityForm.controls['onDate'].value,
        "dayCount": this.activityForm.controls['dayCount'].value,
        "isRepeat": this.activityForm.controls['isRepeat'].value,
        "priorityLevelId": this.activityForm.controls['priorityLevel'].value
      }
    ];
    this.createRoutineActivity.activities = activities;
    this.createRoutineActivity.routineId = this.data.routineId
    this.configurationService.saveRoutineActivities(this.createRoutineActivity).subscribe(res => {
      if (res.statusCode === 1) {
        if(this.isReminderFormValid) {
          this.entityConfigType = 'pf_routine_activity';
          const data = res.results.activities[0];
          data['dataType']='create';
          data['id'] = data?.routineActivityId;
          this.reminderData = data;
          console.log(this.reminderData);
        }
        this.toastr.success('Success', `${res.message}`);
        // this.bottomSheetRef.dismiss('confirm');
        this.bottomSheetRef.close()
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updatePfActivity(){
    const date = this.dateFormat.transform(this.activityData.schedule ? this.activityData.schedule : this.today, 'yyyy-MM-dd');
    const time = date + ' ' + this.activityForm.controls['scheduleTime'].value;
    let schedule = null;
    let scheduleType = this.activityForm.controls['scheduleType'].value;
    if(scheduleType === 'SAT-BTM' || scheduleType === 'SAT-RGBT' || scheduleType === 'SAT-DBT'){
      schedule = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    } else {
      schedule = null
    }
    if (this.activityForm.controls['isActive'].value === 'ST-AT') {
      this.status = true;
    } else {
      this.status = false;
    }
    let assignId = typeof this.activityForm.controls['assignId'].value === 'string' ? this.inchargeId : this.activityForm.controls['assignId'].value;
    let locationId = typeof this.activityForm.controls['locationId'].value === 'string' ? this.locationId : this.activityForm.controls['locationId'].value;
    const duration: string = this.activityForm.controls['duration'].value;
    if (duration) {
      const [hrs, mins] = duration.split(':').map(Number);
      this.totalMinutes = hrs * 60 + mins;
    }
    let routineActId = this.data.activityData.routineActivityId ? this.data.activityData.routineActivityId : null;
    this.editRoutineActivity = new EditRoutineActivity(null, null)
    let activities = [
      {
        "schedule": schedule,
        "activityIdentifyingType": 'activity',
        "activityIdentifyingId": this.activityForm.controls['activityId'].value,
        "routineActivityId": routineActId,
        "inchargeType": this.activityForm.controls['assignTypeId'].value,
        "inchargeId": assignId,
        "sequence" : this.activityForm.controls['sequence'].value,
        "priority" : this.activityForm.controls['priority'].value,
        "minDuration": this.totalMinutes,
        "locationId": locationId,
        "isActive": this.status,
        "scheduleTypeId": this.activityForm.controls['scheduleType'].value,
        "weightage": this.activityForm.controls['weightage'].value,
        "dayTypeIds": this.activityForm.controls['onDate'].value,
        "dayCount": this.activityForm.controls['dayCount'].value,
        "isRepeat": this.activityForm.controls['isRepeat'].value,
        "priorityLevelId": this.activityForm.controls['priorityLevel'].value
      }
    ];
    this.editRoutineActivity.activities = activities;
    this.editRoutineActivity.routineId = this.data.routineId
    this.configurationService.updateRoutineActivities(this.editRoutineActivity).subscribe(res => {
      if (res.statusCode === 1) {
        if(this.isReminderFormValid) {
          this.entityConfigType = 'pf_routine_activity';
          const data = res.results.activities[0];
          data['dataType'] = 'update';
          data['id'] = data?.routineActivityId;
          this.reminderData = data;
        }
        this.toastr.success('Success', `${res.message}`);
        // this.bottomSheetRef.dismiss('confirm');
        this.bottomSheetRef.close()
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  cancel() {
    //  this.bottomSheetRef.dismiss(null);
    this.bottomSheetRef.close()
  }
  fixClick() {
    console.log('')
  }
}
