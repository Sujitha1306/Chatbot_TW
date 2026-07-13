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
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialog} from '@angular/material/dialog';
import { CreateEntityRoutine } from '../../create-manage-routine/create-manage-routine.model';
import { UpdateEntityRoutine } from '../../workflow-management/workflow-management.model';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ManageRoutineActivityComponent } from '../manage-routine-activity/manage-routine-activity.component';
import { ConfigurationService, CommonService } from '../../../../services';
import { AppToastService } from '../../../../services/toaster.service';


@Component({
  selector: 'app-manage-pwa-maintenance',
  templateUrl: './manage-pwa-maintenance.component.html',
  styleUrls: ['./manage-pwa-maintenance.component.scss'],
})
export class ManagePwaMaintenanceComponent implements OnInit {
  public createRoutine: CreateEntityRoutine;
  public  updateEntityRoutine: UpdateEntityRoutine;
  public today = new Date();
  public routineForm: FormGroup;
  public activityForm: FormGroup;
  public contextList: any[]
  public selectedContext = 'RC-AST';
  public defaultscheduleTime =  this.dateFormat.transform(this.today, 'h:mm a');
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
  moreOptions = this.option1;
  locationId: any;
  assetId: any;
  patientId: any;
  staffId: any;
  activityScheduleId: any;
  selectedItem : any;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    @Optional() public bottomSheetRef: MatBottomSheetRef<ManagePwaMaintenanceComponent>,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    public form: FormBuilder, private readonly dateFormat: DatePipe,
    public dialog: MatDialog, public toastr: AppToastService) {
      if(data.tabType === 'Patient'){
        this.selectedContext = 'RC-PAT'
      } else if(data.tabType === 'Asset') {
        this.selectedContext = 'RC-AST'
      } else if((data.tabType === 'Location')){
        this.selectedContext = 'RC-LOC'
      } else {
        this.selectedContext ='RC-SAF'
      }
      console.log(this.selectedContext)
     }

  ngOnInit(): void {
    console.log(this.data)
    this.commonService.getAppTerms('RoutineContext,RecipientType').subscribe(res => {
      this.contextList = res.results.filter(resFilter => resFilter.groupName === 'RoutineContext');
      this.originalInchargeTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT'));
    })
    this.getRoutineType();
    this.bulidForm()
    if(this.data?.id){
      this.moreOptions = this.option2;
      this.selectedRoutineType = this.data.routineTypeId;
      this.configurationService.getRoutineName('',  this.selectedRoutineType).subscribe(res => {
        this.routineList = res.results;
      });
      this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res =>{
        this.activtiyData = res.results[0];
        this.scheduleTypeId = this.activtiyData.scheduleTypeId;
        this.activityTableData = this.activtiyData.activities;
      })
      this.bulidForm()
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
        let assetName = this.data.entityName.trim();
        this.assetId = this.data.entityId;
        this.commonService.getAssetSearch(null, assetName).subscribe((res) => {
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
          this.staffUserList = res.results;
          this.routineForm.get('staffId').setValue(staffName)
          this.routineForm.get('staffId').updateValueAndValidity()
        });
      }
    } else {
      this.moreOptions = this.option1;
      if(this.data?.entityById !== null){
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
          let assetName = this.data?.entityIdName;
          this.assetId = this.data?.entityById;
          this.commonService.getAssetSearch(null, assetName).subscribe((res) => {
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
            this.staffUserList = res.results;
            this.routineForm.get('staffId').setValue(staffName)
            this.routineForm.get('staffId').updateValueAndValidity()
          });
        }
      }
    }
  }

  bulidForm() {
    this.routineForm = this.form.group({
      locationId: [null, [this.validateLocationSelection.bind(this)]],
      assetId: [null, [this.validateAssetSelection.bind(this)]],
      patientId: [null, [this.validatePatientSelection.bind(this)]],
      staffId: [null, [this.validateStaffSelection.bind(this)]],
      routineTypeId: [this.data?.routineTypeId ? this.data?.routineTypeId : null, [Validators.required]],
      routineId: [this.data?.pfRoutineId ? this.data?.pfRoutineId : null, [Validators.required]],
      startDate: [this.data?.fromDate ? this.dateFormat.transform(this.data?.fromDate, 'yyyy-MM-dd') : this.today],
      endDate: [this.data?.toDate ? this.dateFormat.transform(this.data?.toDate, 'yyyy-MM-dd') : null],
      scheduleTime: [this.data?.scheduleStart ? this.dateFormat.transform(this.data?.scheduleStart, 'h:mm a') : this.defaultscheduleTime, [Validators.required]]
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

  getLocationList(id) {
    if (id !== null) {
      const location = this as any as { id: string,fullName: string }[]
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
            control.setValidators([Validators.required, this.validateAssetSelection.bind(this)]);
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

  getRoutineList(event){
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
    let id = event.value;
    this.configurationService.getRoutineActivities(id).subscribe(res =>{
      this.activtiyData = res.results[0]
      this.scheduleTypeId = this.activtiyData.scheduleTypeId;
      this.activityTableData = this.activtiyData.activities
    })
  }

  triggerAction(key: string, data: any){
    console.log(key,data)
    if (key === 'delete') {
      const index = this.activityTableData.indexOf(data);
      if (index !== -1) {
        this.activityTableData.splice(index, 1);
      }
      this.activityTableData = [...this.activityTableData];
    } else if(key === 'edit') {
      const index = this.activityTableData.indexOf(data);
      this.addActivity(data, index)
    } else if(key === 'duplicate') {
      let duplicateData = data
      let addActivityData = {
        "activityIdentifyingId" : duplicateData.activityIdentifyingId,
        "activityIdentifyingType": duplicateData.activityIdentifyingType,
        "activityName":duplicateData.activityName, 
        "schedule" : duplicateData.schedule,
        "inchargeType" : duplicateData.inchargeType,
        "inchargeId" : duplicateData.inchargeId,
        "inchargeName": duplicateData.inchargeName,
        "sequence" : duplicateData.sequence,
        "priority" : duplicateData.priority,
        "minDuration" : duplicateData.minDuration,
        "locationId" : duplicateData.locationId,
        "isActive" : true,
        "scheduleTypeId" : duplicateData.scheduleTypeId,
        "scheduleTypeName": duplicateData.scheduleTypeName,
        "weightage" : duplicateData.weightage,
        "mandatory" : duplicateData.mandatory,
        "isRecurring" : duplicateData.isRecurring,
        "dayTypeId": duplicateData.dayTypes,
        "dayCount": duplicateData.dayCount,
        "isRepeat": duplicateData.isRepeat,
        "entityRoutineId": this.data.id ? this.data.id : null
      }
      // if(event.keyVal === 'modify'){
      //   this.configurationService.createEntityRoutActivity(addActivityData).subscribe(res =>{
      //     if(res.statusCode === 1){
      //       this.toastr.success('Success', `${res.message}`);
      //     }
      //   })
      // }
      this.activityTableData = [...this.activityTableData, addActivityData];
    }
  }

  addActivity(data?, index?: number) {
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
    const dialogRef = this.dialog.open(ManageRoutineActivityComponent, {
      data: routineInfo,
      height: '95%',
      maxWidth: 'none',
      position: {
        bottom: '0px'
      },
    });

  
    dialogRef.afterClosed().subscribe(res => {
        if (res === 'confirm') {
          this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res => {
            this.activtiyData = res.results[0];
            this.scheduleTypeId = this.activtiyData.scheduleTypeId;
            this.activityTableData = this.activtiyData.activities;
          });
        } else if (res?.results) {
          if (typeof index !== 'undefined' && index !== -1) {
            this.activityTableData[index] = {
              ...this.activityTableData[index],
              ...res.results
            };
          } else {
            this.activityTableData.push(res.results);
          }
          this.activityTableData = [...this.activityTableData];
        }
      });

  }

  saveRoutine() {
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
    const time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
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
    this.createRoutine.scheduleTypeId = this.scheduleTypeId;
    // this.createRoutine.scheduleTypeId = this.routineForm.controls['scheduleTypeId'].value;
    this.configurationService.createRoutine(this.createRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.bottomSheetRef.dismiss();
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateRoutine(){
    const scheduleDate = this.dateFormat.transform(this.routineForm.controls['startDate'].value, 'yyyy-MM-dd');
    const time = scheduleDate + ' ' + this.routineForm.controls['scheduleTime'].value;
    this.scheduleTime = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    this.updateEntityRoutine = new UpdateEntityRoutine(null, null, null, null, null, null, null, null, null, null,null);
    this.updateEntityRoutine.identifiyingId = this.data.entityId;
    this.updateEntityRoutine.identifyingType = this.data.entityType;
    this.updateEntityRoutine.fromDate = this.scheduleTime;
    this.updateEntityRoutine.routineId = this.data.pfRoutineId;
    this.updateEntityRoutine.routineStatusId = this.data.routineEventStatusId;
    this.updateEntityRoutine.scheduleStart = this.scheduleTime;
    this.updateEntityRoutine.scheduleEnd = this.dateFormat.transform(this.routineForm.controls['endDate'].value, 'yyyy-MM-dd 23:59:00')
    this.updateEntityRoutine.scheduleTypeId = this.data.scheduleTypeId;
    this.configurationService.UpdateEntityRoutine(this.data.id, this.updateEntityRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        // this.dialogRef.close('confirm');
        this.bottomSheetRef.dismiss();
        this.configurationService.getEntityRoutineActivity(this.data.id).subscribe(res =>{
          this.activtiyData = res.results[0];
          this.scheduleTypeId = this.activtiyData.scheduleTypeId;
          this.activityTableData = this.activtiyData.activities;
        })
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  close(){
    this.bottomSheetRef.dismiss();
  }
  fixClick() {
    console.log('')
  }
}
