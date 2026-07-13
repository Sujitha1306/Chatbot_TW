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

import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { CreateEntityRoutine, UpdateEntityRoutine } from './create-manage-routine.model';
import { CreateRoutineActivityComponent } from '../create-routine-activity/create-routine-activity.component';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { AppToastService } from '../../../services/toaster.service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';

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
  selector: 'app-create-manage-routine',
  templateUrl: './create-manage-routine.component.html',
  styleUrls: ['./create-manage-routine.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe,
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class CreateManageRoutineComponent implements OnInit {
  public createRoutine: CreateEntityRoutine;
  public  updateEntityRoutine: UpdateEntityRoutine;
  public today = new Date();
  public routineForm: FormGroup;
  public activityForm: FormGroup;
  public contextList: any[]
  public selectedContext = "RC-LOC";
  public pageId = 'manageRoutine';
  public editMenuData = null;
  public defaultscheduleTime =  this.dateFormat.transform(this.today, 'h:mm a');
  public isLoading: boolean = false;
  locationListItems: any;
  locationList: any;
  locationEnabled: boolean = false;
  assetListItems: any;
  assetList: any;
  assetNameEnabled: boolean = false;
  patientList: any;
  patientNameEnabled: boolean = false;
  patientListItems: any;
  routineTypeList: any[];
  routineList: any;
  routineID: any;
  selectedRoutineType: any;
  scheduleTime: string;
  activtiyData: any;
  activityTableData: any[] = [];
  isActivityExp: boolean = false;
  inchargeId = null;
  toHit: boolean = false;
  roleIds: any;
  departmentIds: any;
  inchargeList: any[] = [];
  inchargeEnabled: boolean = false;
  listItems: any;
  roleList: any;
  departmentList: any;
  activityTypeList: any;
  activityList: any;
  originalInchargeTypeList: any;
  inchargeTypeList: any[];
  staffList: any[] = [];
  staffUserList: any;
  staffNameEnabled: boolean = false;
  scheduleTypeId = null;
  option1 = [{"name": "Delete", "type": "delete", "value": null}, {"name": "Edit", "type": "edit", "value": null}, {"name": "Duplicate", "type": "duplicate", "value": null}];
  option2 = [{"name": "Edit", "type": "edit", "value": null}, {"name": "Duplicate", "type": "duplicate", "value": 'modify'}];
  displayActivityList = ['Activity', 'Assign Type', 'Assign To', 'Schedule Type', 'Location', 'Start Date', 'End Date', 'edit']
  columnActivityList = ['activityName', 'inchargeType', 'inchargeName', 'scheduleTypeName', 'destinationName', 'fromDate', 'toDate', 'edit']
  moreOptions = this.option1;
  locationId: any;
  assetId: any;
  patientId: any;
  staffId: any;
  activityScheduleId: any;
  scheduleType: any;
  isActivityExpanded = true;
  isAssetExpanded = true;
  assetMaintenanceList = []
  configLabel: any;
  endRoutinesActivity: any;
  editScheduleType: boolean = false;
  isScheduleTypeEdited: boolean = false;
  disableEndRotuine: boolean = false ;
  initialScheduleTypeId: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    public form: FormBuilder, private readonly dateFormat: DatePipe,
    public dialog: MatDialog, public toastr: AppToastService,public workflowService : WorkflowService,
    public thisDialogRef: MatDialogRef<CreateManageRoutineComponent>) {
      if(data.dynamicLabel){
        this.getDynamicConfigLabel();
      }
      if(data.tabType === 'Patient'){
        this.selectedContext = 'RC-PAT'
      } else if(data.tabType === 'Asset') {
        this.selectedContext = 'RC-AST'
      } else if((data.tabType === 'Location')){
        this.selectedContext = 'RC-LOC'
      } else {
        this.selectedContext ='RC-SAF'
      }
     }

  ngOnInit(): void {
    this.commonService.dynamicMenu.subscribe(obj => {
      if(obj){
        const assignTo = obj.filter(filter => filter.formControlName === 'assignTo' && (filter.id === 'ROU-ASM' || filter.id === 'manageRoutine'))
        const assignType = obj.filter(filter => filter.formControlName === 'assignType' && (filter.id === 'ROU-ASM' || filter.id === 'manageRoutine'))
        const assetAssignTo = obj.filter(filter => filter.formControlName === 'assignTo' && filter.id === 'entityAssetList')
        const assetAssignType = obj.filter(filter => filter.formControlName === 'assignType' && filter.id === 'entityAssetList')
        this.tableEditedData(assignTo, assignType, assetAssignTo, assetAssignType)
      }
    })
    this.commonService.getAppTerms('RoutineContext,RecipientType').subscribe(res => {
      this.contextList = res.results.filter(resFilter => resFilter.groupName === 'RoutineContext');
      this.originalInchargeTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT'));
    })
    this.getRoutineType();
    this.bulidForm()
    if(this.data.id){
      this.moreOptions = this.option2;
      this.selectedRoutineType = this.data.routineTypeId;
      this.getScheduleType(this.selectedRoutineType)
      this.configurationService.getRoutineName('',  this.selectedRoutineType).subscribe(res => {
        this.routineList = res.results;
      });
      this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res =>{
        this.activtiyData = res.results[0];
        this.scheduleTypeId = this.activtiyData.scheduleTypeId;
        this.activityTableData = this.activtiyData.activities;
      })
      if (this.selectedContext === 'RC-LOC') {
        this.locationId = this.data.entityId;
        this.commonService.getLocationById(this.locationId).subscribe(res => {
          this.locationList = [res.results];
          if (this.locationList.length) {
            let locationName = this.locationList[0].fullName;
            this.routineForm.get('locationId').setValue(locationName)
          }
          this.routineForm.get('locationId').updateValueAndValidity();
        });
      } else if (this.selectedContext === 'RC-AST') {
        let assetName = this.data.entityName;
        this.assetId = this.data.entityId;
        this.commonService.getAssetSearch(this.assetId, null).subscribe((res) => {
          this.assetList = res.results.filter(val => val.assetId === this.assetId);
          this.routineForm.get('assetId').setValue(assetName)
          this.routineForm.get('assetId').updateValueAndValidity();
        });
      } else if (this.selectedContext === 'RC-PAT') {
        let patientName = this.data.entityName;
        this.patientId = this.data.entityId;
        this.commonService.searchInpatient(null, this.patientId).subscribe((res) => {
          this.patientList = res.results.filter(val => val.id === this.patientId);
          if(this.patientList) {
            this.routineForm.get('patientId').setValue(this.patientList[0].fullName)
            this.routineForm.get('patientId').updateValueAndValidity();
          }
        });
      } else if (this.selectedContext === 'RC-SAF'){
        let staffName = this.data.entityName;
        this.staffId = this.data.entityId;
        this.configurationService.getRoleUser(null, null, null, this.staffId, 'UT_STAFF').subscribe((res) => {
          this.staffList = res.results;
          this.routineForm.get('staffId').setValue(staffName)
          this.routineForm.get('staffId').updateValueAndValidity()
        });
      }
          this.configurationService.getEntityRoutinById(this.data.id,this.data.Type).subscribe(res =>{
            this.endRoutinesActivity = res.results
            const hasCompletedOrInProgress = this.endRoutinesActivity.some(
              (item: any) =>
                item.routineEventStatusId === 'RQ-CO' ||
                item.routineEventStatusId === 'RQ-IP' || item.routineEventStatusId === 'RQ-CA'
            );
            this.disableEndRotuine =  this.endRoutinesActivity.some(
              (item: any) =>
                item.routineEventStatusId === 'RQ-IP'
            );
           this.editScheduleType = hasCompletedOrInProgress
          })
       this.bulidForm()
        this.initialScheduleTypeId = this.routineForm.get('scheduleTypeId')?.value;
       this.routineForm.get('scheduleTypeId')?.valueChanges.subscribe(value => {
         this.isScheduleTypeEdited =  value !== this.initialScheduleTypeId
        })
    } else {
      this.moreOptions = this.option1;
      if(this.data.hasOwnProperty('entityById') && this.data.entityById !== null){
        if (this.selectedContext === 'RC-LOC') {
          this.locationId = this.data.entityById;
          this.commonService.getLocationById(this.locationId).subscribe(res => {
            this.locationList = [res.results];
            if (this.locationList.length) {
              let locationName = this.locationList[0].fullName;
              this.routineForm.get('locationId').setValue(locationName)
            }
            this.routineForm.get('locationId').updateValueAndValidity();
          });
        } else if (this.selectedContext === 'RC-AST') {
          let assetName = this.data.entityIdName;
          this.assetId = this.data.entityById;
          this.commonService.getAssetSearch(this.assetId, null).subscribe((res) => {
            this.assetList = res.results.filter(val => val.assetId === this.assetId);
            this.routineForm.get('assetId').setValue(assetName)
            this.routineForm.get('assetId').updateValueAndValidity();
          });
        } else if (this.selectedContext === 'RC-PAT') {
          let patientName = this.data.entityIdName;
          this.patientId = this.data.entityById;
          this.commonService.searchInpatient(null, this.patientId).subscribe((res) => {
            this.patientList = res.results.filter(val => val.id === this.patientId);
            if(this.patientList.length) {
              this.routineForm.get('patientId').setValue(this.patientList[0].fullName)
              this.routineForm.get('patientId').updateValueAndValidity();
            }
          });
        } else if (this.selectedContext === 'RC-SAF'){
          let staffName = this.data.entityIdName;
          this.staffId = this.data.entityById;
          this.configurationService.getRoleUser(null, null, null, this.staffId, 'UT_STAFF').subscribe((res) => {
            this.staffList = res.results;
            this.routineForm.get('staffId').setValue(this.staffList[0].name)
            this.routineForm.get('staffId').updateValueAndValidity()
          });
        }
      }

      if(this.data.hasOwnProperty('entityData') && this.data.entityData) {
        this.getRoutineList()
        this.assetMaintenanceList = this.data.entityData
        this.pageId = 'ROU-ASM';
        this.displayActivityList.pop();
        this.columnActivityList.pop();
      }
    }
  }

  getScheduleType(type){
    this.commonService.getAppTermsLink(type, 'ScheduleType').subscribe(res =>{
      this.scheduleType = res.results;
    })
  }

  bulidForm() {
    this.routineForm = this.form.group({
      locationId: [null, [this.validateLocationSelection.bind(this)]],
      assetId: [null, [this.validateAssetSelection.bind(this)]],
      patientId: [null, [this.validatePatientSelection.bind(this)]],
      staffId: [null, [this.validateStaffSelection.bind(this)]],
      routineTypeId: [this.data.routineTypeId ? this.data.routineTypeId : null, [Validators.required]],
      routineId: [this.data.pfRoutineId ? this.data.pfRoutineId : null, [Validators.required]],
      scheduleTypeId: [this.data.scheduleTypeId ? this.data.scheduleTypeId : null, [Validators.required]],
      startDate: [this.data.fromDate ? this.dateFormat.transform(this.data.fromDate, 'yyyy-MM-dd') : this.today],
      endDate: [this.data.toDate ? this.dateFormat.transform(this.data.toDate, 'yyyy-MM-dd') : null],
      scheduleTime: [this.data.scheduleStart ? this.dateFormat.transform(this.data?.scheduleStart, 'h:mm a') : null,[Validators.required]]
    })
    this.validateControl();
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

  private validateAssetSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.assetList || this.assetList.length === 0) {
        return { invalidAsset: true };
      }

      let selectedAsset = this.assetList.find(val => val.assetId === selectedId || val.assetName === selectedId);
      if (!selectedAsset) {
        return { invalidAsset: true };
      }
    }
    return null;
  }

  private validatePatientSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.patientList || this.patientList.length === 0) {
        return { invalidPatient: true };
      }

      let selectedPatient = this.patientList.find(val => val.id === selectedId || val.fullName === selectedId);
      if (!selectedPatient) {
        return { invalidPatient: true };
      }
    }
    return null;
  }

  private validateStaffSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.staffList || this.staffList.length === 0) {
        return { invalidStaff: true };
      }

      let selectedStaff = this.staffList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedStaff) {
        return { invalidStaff: true };
      }
    }
    return null;
  }

  getDynamicConfigLabel(){
    this.commonService.getConfigFile('request-config').subscribe(res => {
      if (res.results) {
        let configData = res.results['contentObject'];
        if (configData.label.hasOwnProperty('ROU-ASM')) {
          this.configLabel = res.results.contentObject.label['ROU-ASM'];
        }
      }
    })
  }

  setDynamicLabel(label: string) {
    if (this.configLabel) {
      if (this.configLabel.hasOwnProperty(label)) {
        return this.configLabel[label];
      }
    }
    return label;
  }

  getLocationList(id) {
    if (id !== null) {
      const location = this as any as { id: string, name: string, fullName: string }[]
      const locationId = location.find(obj => obj.id === id).fullName;
      return locationId;
    } else {
      return '';
    }
  }

  getAssetList(id) {
    if (id !== null) {
      const asset = this as any as { assetId: string, assetName: string }[]
      const assetId = asset.find(obj => obj.assetId === id).assetName;
      return assetId;
    } else {
      return '';
    }
  }

  getPatientList(id) {
    if (id !== null) {
      const patient = this as any as { id: string, fullName: string }[]
      const patientId = patient.find(obj => obj.id === id).fullName;
      return patientId;
    } else {
      return '';
    }
  }

  getSatffList(id) {
    if (id !== null) {
      const patient = this as any as { id: string, name: string }[]
      const patientId = patient.find(obj => obj.id === id).name;
      return patientId;
    } else {
      return '';
    }
  }

  validateControl() {
    const requiredFields = {
      'RC-LOC': 'locationId',
      'RC-AST': 'assetId',
      'RC-PAT': 'patientId',
      'RC-SAF': 'staffId',
    };
    const fields = ['locationId', 'assetId', 'patientId', 'staffId'];
    fields.forEach(field => {
      const control = this.routineForm.get(field);
      if (control) {
        if (requiredFields[this.selectedContext] === field) {
          if (field === 'locationId') {
            control.setValidators([Validators.required, this.validateLocationSelection.bind(this)]);
          } else if (field === 'assetId') {
            if(this.data.hasOwnProperty('isMulti') && this.data.isMulti) {
              control.setValidators(null);
            } else {
              control.setValidators([Validators.required, this.validateAssetSelection.bind(this)]);
            }
          } else if (field === 'patientId') {
            control.setValidators([Validators.required, this.validatePatientSelection.bind(this)]);
          } else {
            control.setValidators([Validators.required, this.validateStaffSelection.bind(this)]);
          }
        } else {
          control.setValidators(null);
          control.setValue(null);
        }
        control.updateValueAndValidity();
      }
    });
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

  expandChange(expanded: boolean){
    if (!expanded) {
      this.activityForm.reset();
      this.inchargeList = []
    }
    this.activityForm.reset()
  }

  getSelectRoutine(data) {
    this.selectedContext = data.code;
    this.getRoutineType();
    this.validateControl()
  }

  getRoutineType(){
    this.commonService.getAppTermsLink(this.selectedContext, 'RoutineType').subscribe(res =>{
      this.routineTypeList = res.results;
      if (this.routineTypeList.length === 1) {
         this.routineForm.get('routineTypeId').setValue(this.routineTypeList[0].code)
         this.getRoutineList();
      }
    })
  }

  searchLocationList(event) {
    if (event.text.length >= 2) {
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

  searchAssetList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAssetSearch(null, event.text).subscribe((res) => {
          this.assetListItems = res.results;
          this.assetList = this.assetListItems;
          this.assetNameEnabled = true;
          this.routineForm.get('assetId').updateValueAndValidity();
        });
      } else {
        this.assetList = this.assetListItems;
        this.assetNameEnabled = true;
      }
    } else {
      this.assetList = [];
      this.assetNameEnabled = false;
    }
  }

  searchPatientList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.searchInpatient(event.text).subscribe((res) => {
          this.patientListItems = res.results;
          this.patientList = this.patientListItems;
          this.patientNameEnabled = true;
          this.routineForm.get('patientId').updateValueAndValidity();
        });
      } else {
        this.patientList = this.patientListItems;
        this.patientNameEnabled = true;
      }
    } else {
      this.patientList = [];
      this.patientNameEnabled = false;
    }
  }

  searchStaffList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.configurationService.getRoleUser(event.text, null, null, null, 'UT_STAFF').subscribe((res) => {
          this.staffUserList = res.results;
          this.staffList = this.staffUserList;
          this.staffNameEnabled = true;
        });
      } else {
        this.staffList = this.staffUserList;
        this.staffNameEnabled = true;
      }
    } else {
      this.staffList = [];
      this.staffNameEnabled = false;
    }
  }

  searchSatffList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.configurationService.getRoleUser().subscribe((res) => {
          this.patientListItems = res.results;
          this.patientList = this.patientListItems;
          this.patientNameEnabled = true;
          this.routineForm.get('patientId').updateValueAndValidity();
        });
      } else {
        this.patientList = this.patientListItems;
        this.patientNameEnabled = true;
      }
    } else {
      this.patientList = [];
      this.patientNameEnabled = false;
    }
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
         this.inchargeList = this.roleList
         this.inchargeEnabled = true;
     } else if (type === 'RT-DT') {
       this.inchargeList = this.departmentList;
       this.inchargeEnabled = true;
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
         this.roleList = this.inchargeList;
       } else {
         this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
         this.inchargeEnabled = true;
         this.roleList = this.inchargeList;
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
       this.listItems = res.results;
       this.inchargeList = this.listItems;
       this.inchargeEnabled = true;
     });
   } else {
     this.inchargeList = [];
     this.inchargeEnabled = false;
   }
  }

  getRoutineList(){
    this.selectedRoutineType = this.routineForm.controls['routineTypeId'].value
    this.configurationService.getRoutineName('',  this.selectedRoutineType).subscribe(res => {
      this.routineList = res.results;
    });
  }

  getActivityType(event) {
    let selectedRoutineType = this.routineForm.controls['routineTypeId'].value;
    let selectedActivityId = this.activityForm.controls['activityCategory'].value;
    this.configurationService.getTaskActivities(selectedRoutineType, selectedActivityId).subscribe(res => {
     this.activityList = res.results;
    });
  }

  assetSetColumn(activityData) {
    const routineId = this.routineForm.controls['routineId'].value;
    const routineType = this.routineForm.controls['routineTypeId'].value;
    let routineNameObj = this.routineList.find(f => f.id === routineId);
    let routineTypeObj = this.routineTypeList.find(f => f.code === routineType);

    const category = activityData?.activityCategoryName;

    this.assetMaintenanceList = this.assetMaintenanceList.map(asset => {

      let isNullCategory = false;

      if (category === 'Calibration') {
        isNullCategory = asset.Calibration === null;
      }
      else if (category === 'AMC') {
        isNullCategory = asset.AMC === null;
      }
      else if (category === 'PMS') {
        isNullCategory = asset.PMS === null;
      }
      else if (category === 'Corrective') {
        isNullCategory = asset.Corrective === null;
      }

      return {
        ...asset,
        routineName: routineNameObj?.name || null,
        routineTypeName: routineTypeObj?.value || null,
        inchargeType: activityData.inchargeType || null,
        inchargeName: activityData.inchargeName || null,
        select: isNullCategory,
        Isalready : isNullCategory ?? true,
        activityData: activityData
      };
    });

    this.assetMaintenanceList = [...this.assetMaintenanceList];
  }

  getActivityDetails(event) {
    this.configurationService.getActivitiesById(event.value).subscribe(res => {
      const data = res.results[0];
      this.roleIds = data.roleIds;
      this.departmentIds = data.departmentIds;
      this.updateInchargeTypeList(this.roleIds, this.departmentIds);
      this.inchargeId = data.inchargeId;
      if(this.inchargeId !== null) {
        if (data.inchargeType === 'RT-RO') {
          this.configurationService.getRecipientName('', data.inchargeType).subscribe(res => {
            let selectedRoles = this.roleIds
            if (selectedRoles !== null) {
              this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
              this.inchargeEnabled = true;
              this.roleList = this.inchargeList;
              this.activityForm.get('assignId').updateValueAndValidity()
            } else {
              this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
              this.inchargeEnabled = true;
              this.roleList = this.inchargeList;
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
          this.configurationService.getRoleUser(null, roles, departments).subscribe(res => {
            this.listItems = res.results;
            this.inchargeList = this.listItems;
            this.inchargeEnabled = true;
            this.activityForm.get('assignId').updateValueAndValidity()
          });
        } else {
          this.inchargeList = [];
          this.inchargeEnabled = false;
        }
      }
      this.activityForm.patchValue({
        'assignTypeId': data.inchargeType,
        'assignId': data.inchargeName,
        'sequence': data.sequence ,
        'priority': data.priority,
        'minDuration': data.minDuration,
      });
      this.activityForm.get('assignId').updateValueAndValidity()
    });
  }

  getRoutineActivityList(event){
    this.getScheduleType(this.selectedRoutineType)
    let id = event.value;
    this.configurationService.getRoutineActivities(id).subscribe(res =>{
      this.activtiyData = res.results[0]
      const riskScheduleMap: Record<string, string> = {
        'RCN-HRSK': 'SCT-QRY',
        'RCN-MRSK': 'SCT-HFY',
        'RCN-LRSK': 'SCT-YRY'
      };
      const riskClassificationId = this.assetList?.[0]?.riskClassificationId;
      const isPmsNew =  this.selectedContext === 'RC-AST' && this.activtiyData?.name === 'PMS' &&this.data?.id == null;
      const mappedScheduleTypeId = isPmsNew ? riskScheduleMap[riskClassificationId] : this.activtiyData?.scheduleTypeId;
      this.scheduleTypeId = mappedScheduleTypeId ?? this.activtiyData?.scheduleTypeId;
      this.activityTableData = this.activtiyData.activities;
      this.routineForm.get('scheduleTypeId').setValue(this.scheduleTypeId);
      if(this.routineForm.controls['endDate'].value !== null){
        this.onEndDateChange();
      }
      setTimeout(() => {
        this.assetSetColumn(this.activityTableData[0])
      }, 200);
    })
  }

  onEndDateChange(){
    let routineStartDate = this.routineForm.controls['startDate'].value;
    let routineEndDate = this.routineForm.controls['endDate'].value;
    this.activityTableData = this.activityTableData.map(item => {
      if (!item.fromDate) return item
      if (!item.toDate) return item;
      const itemFromDate = new Date(item.fromDate)
      const itemEndDate = new Date(item.toDate);
      if (itemEndDate > routineEndDate || itemFromDate > routineEndDate) {
        return { ...item, toDate: this.dateFormat.transform(routineEndDate, 'yyyy-MM-dd HH:mm:ss'),
           fromDate: this.dateFormat.transform(routineStartDate, 'yyyy-MM-dd HH:mm:ss')};
      }
      return item;
    });
  }

  triggerAction(event: any, id) {
    if (event.key === 'delete' && id != 'entityAssetList') {
      const index = this.activityTableData.indexOf(event.data);
      if (index !== -1) {
        this.activityTableData.splice(index, 1);
      }
      this.activityTableData = [...this.activityTableData];
    } else if (event.key === 'delete' && id == 'entityAssetList') {
      const index = this.assetMaintenanceList.indexOf(event.data);
      console.log(index)
      if (index !== -1) {
        this.assetMaintenanceList.splice(index, 1);
      }
      this.assetMaintenanceList = [...this.assetMaintenanceList];
    } else if (event.key === 'Asset Serial No' && id === 'entityAssetList') {
      const activityDataId = event?.data;
      if (activityDataId?.hasOwnProperty('activityData')) {
        this.configurationService.getAllManageRoutine(null, null, 'Asset', activityDataId.id, null).subscribe(res => {
          if (res.statusCode === 1) {
            let manageData = {};
             let activityData = res.results.find(res => res.pfRoutineName === activityDataId?.activityData?.activityCategoryName);
            if (activityData) {
              manageData = activityData;
              manageData['dynamicHeader'] = 'Modify Maintenance Routine',
              manageData['tabType'] = 'Asset';
            } else {
              manageData['entityById'] =  activityDataId?.id;
              manageData['entityIdName'] = activityDataId?.['Asset Name'];
              manageData['dynamicHeader'] = 'Create Maintenance Routine'
              manageData['tabType'] = 'Asset';
            }         
            const dialogRef = this.dialog.open(CreateManageRoutineComponent,
              { data: manageData, panelClass: ['medium-popup'], disableClose: true });
            dialogRef.afterClosed().subscribe(result => {
            });
          }
        })
      } else {
        this.toastr.error('No activity data found');
      }
     
    } else if (event.key === 'edit') {
      const index = this.activityTableData.indexOf(event.data);
      this.addActivity(event.data, index)
    } else if (event.key === 'duplicate') {
      let duplicateData = event.data
      let addActivityData = {
        "activityIdentifyingId": duplicateData.activityIdentifyingId,
        "activityIdentifyingType": duplicateData.activityIdentifyingType,
        "activityName": duplicateData.activityName,
        "schedule": duplicateData.schedule,
        "inchargeType": duplicateData.inchargeType,
        "inchargeId": duplicateData.inchargeId,
        "inchargeName": duplicateData.inchargeName,
        "sequence": duplicateData.sequence,
        "priority": duplicateData.priority,
        "minDuration": duplicateData.minDuration,
        "locationId": duplicateData.locationId,
        "isActive": true,
        "scheduleTypeId": duplicateData.scheduleTypeId,
        "scheduleTypeName": duplicateData.scheduleTypeName,
        "weightage": duplicateData.weightage,
        "mandatory": duplicateData.mandatory,
        "isRecurring": duplicateData.isRecurring,
        "dayTypeId": duplicateData.dayTypes,
        "dayCount": duplicateData.dayCount,
        "isRepeat": duplicateData.isRepeat,
        "entityRoutineId": this.data.id ? this.data.id : null
      }
      if (event.keyVal === 'modify') {
        this.configurationService.createEntityRoutActivity(addActivityData).subscribe(res => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
          }
        })
      }
      this.activityTableData = [...this.activityTableData, addActivityData];
    } else if(event.key === 'Assigned To') {
      const index = this.activityTableData.indexOf(event.data);
      this.addActivity(event.data, index, 'assignedTo')
    } else if (event.key == 'Assign To' && event.keyVal == 'ROU-ASM') {
      this.modifyAssignData(event.data, event.keyVal);
    } else if (event.key == 'Assign Type' && event.keyVal == 'ROU-ASM') {
      this.modifyAssignData(event.data, event.keyVal);
    } else if (event.key == 'Assign To' && event.keyVal == 'entityAssetList') {
      this.modifyAssignData(event.data, event.keyVal);
    } else if (event.key == 'Assign Type' && event.keyVal == 'entityAssetList') {
      this.modifyAssignData(event.data, event.keyVal);
    } else if (event.key === 'Start Date') { 
      this.modifyDateData(event.data, event.keyVal);
    } else if (event.key === 'Assign To' && event.keyVal === 'manageRoutine') {
      this.modifyAssignData(event.data, event.keyVal);
    }
  }

  addActivity(data?, index?: number, type?) {
    let routineInfo = {
      routineType: this.routineForm.controls['routineTypeId'].value,
      type: this.data.id ? 'modify' : 'create',
      contextType: this.selectedContext,
      activityData: data === '' ? null : data,
      scheduleType: this.scheduleTypeId,
      routineId: this.data && this.data.id ? this.data.id : null,
      routineStartDate: this.routineForm.controls['startDate'].value,
      routineEndDate: this.routineForm.controls['endDate'].value,
    }
    if(type === 'assignedTo') {
      routineInfo['highlightField'] = 'assignedTo'
    }
    const dialogRef = this.dialog.open(CreateRoutineActivityComponent,
      { data: routineInfo, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res =>{
          this.activtiyData = res.results[0];
          this.scheduleTypeId = this.activtiyData.scheduleTypeId;
          this.activityTableData = this.activtiyData.activities;
        })
      } else {
        if (res?.results) {
          if (index !== undefined && index !== -1) {
            this.activityTableData[index] = {
              ...this.activityTableData[index],
              ...res.results
            };
          } else {
            this.activityTableData.push(res.results);
          }
          this.activityTableData = [...this.activityTableData];
        }
      }
    });
  }

  saveConfirm(){
    let routineName;
    let type;
    if(this.selectedContext === 'RC-LOC'){
      const id = typeof this.routineForm.controls['locationId'].value === 'string' ? this.locationId : this.routineForm.controls['locationId'].value;
      routineName = this.locationList.find(R => R.id === id).name 
      type = "Location";
    } else if(this.selectedContext === 'RC-AST'){
      const id = typeof this.routineForm.controls['assetId'].value === 'string' ? this.assetId : this.routineForm.controls['assetId'].value;
      routineName = this.assetList.find(A => A.assetId === id).assetName
      type = "Asset";
    } else if(this.selectedContext === 'RC-PAT'){
      const id = typeof this.routineForm.controls['patientId'].value === 'string' ? this.patientId : this.routineForm.controls['patientId'].value;
      routineName = this.patientList.find(a => a.id === id).fullName
      type = "Patient";
    } else if(this.selectedContext === 'RC-SAF'){
      const id = typeof this.routineForm.controls['staffId'].value === 'string' ? this.staffId : this.routineForm.controls['staffId'].value;
      routineName =this.staffList.find(A => A.id === id).name
      type = "Staff";
    }
    const frequency = this.scheduleType.find(r => r.code === this.routineForm.controls['scheduleTypeId'].value)

    const startDate = this.dateFormat.transform(this.routineForm.controls['startDate'].value,'dd MMM yyyy');

    const endDate = this.dateFormat.transform(this.routineForm.controls['endDate'].value,'dd MMM yyyy');
    const routineType = this.routineTypeList.find(r => r.code === this.routineForm.controls['routineTypeId'].value)
        const title = `Create ${routineType.value} Routine`;

    const dialogRef = this.dialog.open(ConfirmationDialog, {
           panelClass: ['confirmation-popup'], disableClose: true,
           data: {
             title:title,
             routineMessage: {
              routineType : routineType.value,
              routineName :routineName,
              type : type,
              endDate:endDate,
              startDate:startDate,
              frequency:frequency.value
             },
             buttonText: { ok: 'Yes', cancel: 'No' },
             isRemark: 1,
             formStatusEnable: true,
           }, width : '400px',
              height: '257px'
         });

         dialogRef.afterClosed().subscribe(result => {
        if (result.hasOwnProperty("confirmButtonText") && result['confirmButtonText'] === "Yes") {
          this.saveRoutine()
        }
         })
  }

  saveRoutine() {
    this.isLoading = true
    let identifiyingId = null;
    let identifiyingType = null;
    if(this.selectedContext === 'RC-LOC'){
      identifiyingId = typeof this.routineForm.controls['locationId'].value === 'string' ? this.locationId : this.routineForm.controls['locationId'].value;
      identifiyingType = "Location";
    } else if(this.selectedContext === 'RC-AST'){
      identifiyingId = typeof this.routineForm.controls['assetId'].value === 'string' ? this.assetId : this.routineForm.controls['assetId'].value;
      identifiyingType = "Asset";
    } else if(this.selectedContext === 'RC-PAT'){
      identifiyingId = typeof this.routineForm.controls['patientId'].value === 'string' ? this.patientId : this.routineForm.controls['patientId'].value;
      identifiyingType = "Patient";
    } else if(this.selectedContext === 'RC-SAF'){
      identifiyingId = typeof this.routineForm.controls['staffId'].value === 'string' ? this.staffId : this.routineForm.controls['staffId'].value;
      identifiyingType = "Staff";
    }
    this.createRoutine = new CreateEntityRoutine(null, null, null, null, null,null, null, null, null, null);
    const date = this.dateFormat.transform(this.routineForm.controls['startDate'].value, 'yyyy-MM-dd HH:mm:ss');
    const scheduleDate = this.dateFormat.transform(this.routineForm.controls['startDate'].value, 'yyyy-MM-dd');
    const time = scheduleDate + ' ' + ( this.routineForm.controls['scheduleTime'].value ? this.routineForm.controls['scheduleTime'].value : this.defaultscheduleTime );    
    this.scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    this.createRoutine.identifiyingId = identifiyingId;
    this.createRoutine.identifyingType = identifiyingType;
    this.createRoutine.fromDate = date;
    this.createRoutine.routineId = this.routineForm.controls['routineId'].value;
    this.createRoutine.routineType = this.routineForm.controls['routineTypeId'].value;
    this.createRoutine.scheduleStart = this.scheduleTime;
    this.createRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['endDate'].value, 'yyyy-MM-dd 23:59:00');
    this.createRoutine.routineStatusId = 'RQ-CR';
    this.createRoutine.activities = this.activityTableData;
    this.createRoutine.patientVisitId = null;
    this.createRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
    // console.log(this.createRoutine)
    this.configurationService.createRoutine(this.createRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.isLoading = false
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.isLoading = false
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  multipleEntitySaveRoutine() {
    this.isLoading = true;
    const multipleRoutinesSave: any[] = [];
    const selectedEntities = this.assetMaintenanceList.filter(x => x.select);
    for (const entity of selectedEntities) {
      let date = this.dateFormat.transform(entity.startDate, 'yyyy-MM-dd HH:mm:ss');
      let scheduleDate = this.dateFormat.transform(entity.startDate, 'yyyy-MM-dd');
      let time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
      let scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
      this.createRoutine = new CreateEntityRoutine(null, null, null, null, null, null, null, null, null, null);
      this.createRoutine.identifiyingId = entity.id;
      this.createRoutine.identifyingType = this.data.tabType;
      this.createRoutine.fromDate = date;
      this.createRoutine.routineId = this.routineForm.controls['routineId'].value;
      this.createRoutine.routineType = this.routineForm.controls['routineTypeId'].value;
      this.createRoutine.scheduleStart = scheduleTime;
      this.createRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['endDate'].value, 'yyyy-MM-dd 23:59:00');
      this.createRoutine.routineStatusId = 'RQ-CR';
      this.createRoutine.activities = [entity.activityData];
      this.createRoutine.patientVisitId = null;
      this.createRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
      multipleRoutinesSave.push(this.createRoutine);
    }
    // console.log(multipleRoutinesSave)
    // return
    this.configurationService.multipleRoutine(multipleRoutinesSave).subscribe(res => {
      this.isLoading = false;
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.isLoading = false;
      });
  }

  updateRoutine(){
        this.isLoading =true
    if(this.isScheduleTypeEdited === true){
       this.workflowService.endroutine(this.data.id).subscribe(res => {
        if (res.statusCode === 1) {
          this.saveRoutine()
        }
      },
        error => {
          this.isLoading = false
          this.toastr.error('Error', `${error.error.message}`);
        }); 
       
    }else{
    this.isLoading = true;
    const scheduleDate = this.dateFormat.transform(this.routineForm.controls['startDate'].value, 'yyyy-MM-dd');
    const time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
    this.scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    this.updateEntityRoutine = new UpdateEntityRoutine(null, null, null, null, null, null, null, null, null, null);
    this.updateEntityRoutine.identifiyingId = this.data.entityId;
    this.updateEntityRoutine.identifyingType = this.data.entityType;
    this.updateEntityRoutine.fromDate = this.scheduleTime;
    this.updateEntityRoutine.routineId = this.data.pfRoutineId;
    this.updateEntityRoutine.routineStatusId = this.data.routineEventStatusId;
    this.updateEntityRoutine.scheduleStart = this.scheduleTime;
    this.updateEntityRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['endDate'].value, 'yyyy-MM-dd 23:59:00')
    this.updateEntityRoutine.scheduleTypeId = this.data.scheduleTypeId;
    this.configurationService.UpdateEntityRoutine(this.data.id, this.updateEntityRoutine).subscribe(res => {
      this.isLoading = false;
      if (res.statusCode === 1) {
          this.isLoading = false
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
        this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res =>{
          this.activtiyData = res.results[0];
          this.scheduleTypeId = this.activtiyData.scheduleTypeId;
          this.activityTableData = this.activtiyData.activities;
        })
      }
    },
      error => {
        this.isLoading = false
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
    fixClick() {
    console.log('')
  }

  tableEditedData(actAssignTo, actAssignType, assetAssignTo, assetAssignType) {
  if (actAssignTo?.length && actAssignType?.length) {

    const activityId = actAssignTo[0].tableData.activityIdentifyingId;

    const actIndex = this.activityTableData.findIndex(
      item => item.activityIdentifyingId === activityId
    );

    if (actIndex !== -1) {
      const activity = this.activityTableData[actIndex];

      activity.inchargeName = actAssignTo[0].modifyName;
      activity.inchargeId = actAssignTo[0].value;
      activity.inchargeType = actAssignType[0].value;

      this.activityTableData = [...this.activityTableData];

      this.assetMaintenanceList = this.assetMaintenanceList.map(asset =>
        asset?.activityData?.activityIdentifyingId === activityId
          ? {
              ...asset,
              inchargeName: actAssignTo[0].modifyName,
              inchargeType: actAssignType[0].value,
              activityData: {
                ...asset.activityData,
                inchargeName: actAssignTo[0].modifyName,
                inchargeId: actAssignTo[0].value,
                inchargeType: actAssignType[0].value
              }
            }
          : asset
      );
    }
  }

  if (assetAssignTo?.length && assetAssignType?.length) {

    const assetId = assetAssignTo[0].tableData.id;

    const astIndex = this.assetMaintenanceList.findIndex(
      item => item.id === assetId
    );

    if (astIndex !== -1) {
      const assetObj = this.assetMaintenanceList[astIndex];

      assetObj.inchargeName = assetAssignTo[0].modifyName;
      assetObj.inchargeType = assetAssignType[0].value;

      assetObj.activityData = {
        ...assetObj.activityData,
        inchargeName: assetAssignTo[0].modifyName,
        inchargeId: assetAssignTo[0].value,
        inchargeType: assetAssignType[0].value
      };

      this.assetMaintenanceList = [...this.assetMaintenanceList];
    }
  }
}


  checkBoxAction(event) {
    let assetIds = event.map(asset => asset.id)
    this.assetMaintenanceList = this.assetMaintenanceList.map(asset => ({
      ...asset,
      select: assetIds.includes(asset.id)
    }));
  }

  modifyAssignData(data, keyVal?: any) {
    if (data && keyVal == 'entityAssetList') {
      data['activityIdentifyingId'] = data.activityData?.activityIdentifyingId;
    }

    forkJoin({
      activity: this.configurationService.getActivitiesById(data.activityIdentifyingId),
    }).subscribe(({ activity }) => {
      const act = activity.results[0];
      this.roleIds = act.roleIds;
      this.departmentIds = act.departmentIds;
      this.updateInchargeTypeList(this.roleIds, this.departmentIds)

      forkJoin({
        roles: this.configurationService.getRecipientName('', 'RT-RO'),
        departments: this.commonService.getAllDepartments(),
        users: this.configurationService.getRoleUser( '', this.roleIds, this.departmentIds,null )
      }).subscribe(({ roles, departments, users }) => {

        let roleList = roles?.results.map(item => ({ code: item.id, value: item.name }));
        let departmentList = departments?.results.map(item => ({ code: item.id, value: item.name }));
        let userList = users?.results.map(item => ({ code: item.id, value: item.name }));

        let editTemplate = {
          headerData: [
            {
              tableheader: 'Maintenance Assign'
            }
          ],
          fieldData: [
            {
              label: 'Assign Type',
              fieldType: 'select',
              optionData: this.inchargeTypeList,
              disable: false,
              formControlName: 'assignType',
              modifyName: data.inchargeType,
              tableData: data,
              id: keyVal
            },
            {
              label: 'Assign To',
              fieldType: 'select',
              enableSearch: true,
              optionData: {
                roleList,
                departmentList,
                userList
              },
              disable: false,
              formControlName: 'assignTo',
              modifyName: data.inchargeName,
              modifyType: data.inchargeType,
              tableData: data,
              id: keyVal
            }
          ]
        };
        this.editMenuData = editTemplate;
      });
    });
  }

  onStartDateSelected() {
    const selectedMoment = this.routineForm.controls['startDate'].value;
    const selectedDate = selectedMoment.toDate();
    this.assetMaintenanceList = this.assetMaintenanceList.map(item => ({
      ...item,
      startDate: this.dateFormat.transform(selectedDate, 'yyyy-MM-dd')
    }));
  }

  modifyDateData(data, keyVal) {
    this.assetMaintenanceList = this.assetMaintenanceList.map(item => {
      if (item.id === data.id) {
        return {
          ...item,
          startDate: this.dateFormat?.transform(keyVal, 'yyyy-MM-dd')
        };
      } else {
        return item;
      }
    });
  }

  endRoutine(){
      const message = this.buildRoutineMessages(this.endRoutinesActivity)
      const dialogRef = this.dialog.open(ConfirmationDialog, {
           panelClass: ['confirmation-popup'], disableClose: true,
           data: {
             title: 'End Routine',
             endroutineMessage:{
             routineMessages : message.messages,
             hasCompleted:message.hasCompleted,
             hasInProgress : message.hasInProgress
            },

             buttonText: { ok: 'Yes', cancel: 'No' },
             isRemark: 1,
             formStatusEnable: true,
           }
         });

      dialogRef.afterClosed().subscribe(result => {
        if (result.hasOwnProperty("confirmButtonText") && result['confirmButtonText'] === "Yes") {
      this.workflowService.endroutine(this.data.id).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      } ,
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    }) 
  }
  buildRoutineMessages(results: any[]) {
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    let completedList: any[] = [];
    let inProgressList: any[] = [];

    results.forEach(item => {

      const status = item.routineEventStatusId;

      if (status === 'RQ-CO') {
        completedList.push(item);
      }
      else if (status === 'RQ-IP') {
        inProgressList.push(item);
      }

    });

    const messages: string[] = [];

    const sortByDate = (a: any, b: any) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime();

    if (completedList.length > 0) {

      completedList.sort(sortByDate);

      const first = completedList[0];
      const last = completedList[completedList.length - 1];

      messages.push(
        `Tasks created for the period ${formatDate(first.startTime)} to ${formatDate(last.endTime)} have been completed.`
      );
    }

    if (inProgressList.length > 0) {

      inProgressList.sort(sortByDate);

      const first = inProgressList[0];
      const last = inProgressList[inProgressList.length - 1];

      messages.push(
        `Tasks created for the period ${formatDate(first.startTime)} to ${formatDate(last.endTime)} are in progress.`
      );
    }
    return {
      messages,
      hasCompleted: completedList.length > 0,
      hasInProgress: inProgressList.length > 0
    };
  }

}