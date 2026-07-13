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
import { Component, OnInit,  Inject,  } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA  } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder,  Validators } from '@angular/forms';
import { ConfigurationService, CommonService, DashboardService, HospitalService } from '../../../services';
import { EditDailyManagement } from './edit-daily-management.model';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

/*

Description : design the package level health checkup
Date        : Oct 20, 2019
Author      : TrackerWave
Developer   : UI Team

*/

@Component({
  selector: 'app-edit-daily-management',
  templateUrl: './edit-daily-management.component.html',
  styleUrls: ['./edit-daily-management.component.scss'],

})
export class EditDailyManagementComponent implements OnInit {

  public dailyManageForm: FormGroup;
  public editDailyManagement: EditDailyManagement;
  public isDisabled = false;
  public statustypes: Array<any> = [];
  public healthTestList: Array<any> = [];
  public locationList: Array<any> = [];
  public testDetailsByLocation: Array<any> = [];
  public confirm_test_status = '';
  public is_status = false;
  public fromLocationName = '';
  public inactive = false;
  public inactiveCheck = false;
  public isCheck = false;
  public enableButton = false;
  public toLocationName: any;
  public manageRoom = false;
  public roomChange = false;
  public enableManage = false;
  public matcher = new ErrorStateMatcherService();
  public fromTime: string;
  public toTime: string;
  public yogaTiming: any;
  public isTestInBatch: boolean;
  public currentDate: any = new Date();
  public alternatetestGroup: any;
  public isAlternateLoc = false;
  public ultrasound: any;
  public mammography: any;
  public checkedTestGroup1 = true;
  public checkedTestGroup2 = false;
  public ultrasoundIds = [];
  public mammographyIds = [];
  public testGroupName1 = '';
  public testGroupName2 = '';
  public locationTests: any;
  public disableCapacity = false;
  public disableQueueLength = false;
  public obj = new BehaviorSubject<Object>('alternate-test-group');
  languageList: any;
  genderList: any;
  public doctorList: Array<any> = [];
  public doctorEnabled = false;
  doctorId = null;

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public dialog: MatDialog, private readonly configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<EditDailyManagementComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService, public dashboardService: DashboardService, public hospitalService: HospitalService,
    private readonly _dateFormat: DatePipe, private readonly lookupService: LookupTermService) {
  }

  ngOnInit() {
    // Get the alternate test group details
    this.alternateTestGroup();

    // Get the Health Package Yoga test time from config file
    this.commonService.getConfigFile('yoga-timing').subscribe(res => {
      this.yogaTiming = res.results.contentObject;
      this.dailyManageForm.get('fromTime').setValue(this.yogaTiming.fromTime);
      this.dailyManageForm.get('toTime').setValue(this.yogaTiming.toTime);
      this.dailyManageForm.get('fromTime').updateValueAndValidity();
      this.dailyManageForm.get('toTime').updateValueAndValidity();
    });

    this.buildForm();

    this.lookupService.getAppTermsWrapper('LocationGender').subscribe(res => {
      this.genderList = res.LocationGender ?? [];
    });

    this.lookupService.getAppTermsWrapper('Language').subscribe(res => {
      this.languageList = res.Language ?? [];
    });
    this.getHealthPlanLocation();
    this.fromLocationName = this.data.locationName;

    if (this.data.alternativeLocationId != null) {
      this.data.locId = this.data.alternativeLocationId;
    } else {
      this.data.locId = this.data.locationId;
    }
    this.onGetAllTestsByLocation(this.data.locId, this.data.locationName, '');

    this.statustypes = [{
      'value': 'Active',
      'code': true,
    },
    {
      'value': 'Inactive',
      'code': false,
    }];

    if (this.data.isAvailable === false) {
      this.inactive = true;
      this.inactiveCheck = true;
      this.enableButton = true;
      this.enableManage = false;
      this.manageRoom = false;
      this.is_status = false;
    } else {
      this.inactive = false;
      this.inactiveCheck = false;
      this.enableButton = false;
      this.enableManage = false;
      this.manageRoom = false;
      this.is_status = false;
    }
    if(this.data) {
      if(this.data.hasOwnProperty('disableCapacity') && this.data.disableCapacity) {
        this.disableCapacity = this.data.disableCapacity
      }
      if(this.data.hasOwnProperty('disableQueueLength') && this.data.disableQueueLength) {
        this.disableQueueLength = this.data.disableQueueLength
      }
    }


  }

  public buildForm() {
    if (this.data.alternativeLocationId != null) {
      this.data.formId = this.data.alternativeLocationId;
    } else {
      this.data.formId = this.data.locationId;
    }
    if (this.data.userId != null) {
      this.doctorId = this.data.userId;
    } else {
      this.doctorId = this.data.userId;
    }
    let queueLength = this.data?.queueLength ??1 ;
    if(this.data?.hasOwnProperty('viewType') && this.data?.viewType === 'token') {
      queueLength = this.data?.queueLength ??  1 ;
    }
    this.dailyManageForm = this.form.group({
      alternateLocationId: [this.data.formId ? this.data.formId : null, [Validators.required]],
      queueLength: [queueLength, [Validators.required]],
      capacity: [this.data?.capacity ?? 1,[Validators.required]],
      isAvailable: [this.data.isAvailable ? this.data.isAvailable : false],
      fromTime: [this.fromTime],
      toTime: [this.toTime],
      gender: [this.data.genderId ? this.data.genderId : null],
      languages: [this.data.languageId ? this.data.languageId : null],
      userId: [this.data.doctorName ? this.data.doctorName : null]
    });
  }

  alternateTestGroup() {
    this.commonService.getConfigFile('alternate-test-group').subscribe(res => {
      this.alternatetestGroup = res.results.contentObject;
      const data = this.alternatetestGroup;
      this.obj.next(data);
    });
  }
  getBehavioralternateTestGroupView(): Observable<any> {
    return this.obj.asObservable();
  }

  statusChange(status) {
    if (status === false) {
      this.inactive = true;
      this.inactiveCheck = true;
      this.enableButton = true;
      this.enableManage = false;
      this.manageRoom = false;
      this.is_status = false;
      this.isCheck = false;
      this.roomChange = false;
    } else {
      this.inactive = false;
      this.inactiveCheck = false;
      this.enableButton = false;
      this.enableManage = false;
      this.manageRoom = false;
      this.is_status = false;
      this.isCheck = false;
      this.roomChange = false;
    }
  }

  onCheck(chk, type) {
    if (chk.checked === true && type === 'inactiveCheck') {
      this.isCheck = true;
      this.enableButton = false;
    } else {
      this.isCheck = false;
      this.enableButton = true;
    }
    if (chk.checked === true && type === 'manageRoom') {
      this.roomChange = true;
      this.enableManage = false;
    } else {
      this.roomChange = false;
      this.enableManage = true;
    }
  }

  changeTestGroup(event, type) {
    if (type === 'ultrasound') {
      if (event.checked === true) {
        this.checkedTestGroup1 = true;
        this.checkedTestGroup2 = false;
      } else {
        this.checkedTestGroup1 = false;
        this.checkedTestGroup2 = true;
      }
    }

    if (type === 'mammography') {
      if (event.checked === true) {
        this.checkedTestGroup1 = false;
        this.checkedTestGroup2 = true;
      } else {
        this.checkedTestGroup1 = true;
        this.checkedTestGroup2 = false;
      }
    }
  }
  getDoctorList(id) {
    if (id) {
      const doctors = this as any as { id: string, name: string }[];
      return doctors.find(obj => obj.id === id).name;
    } else {
      return '';
    }
  }

  searchDoctor(name, type, event) {
    if (type === 'doctor') {
      this.doctorId = null;
      if (name.length >= 3) {
        this.doctorEnabled = true;
        if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190) {
          this.commonService.searchDoctor(name, 'UT_DOCTOR', 'RO-DO').pipe(
            debounceTime(3000),
            distinctUntilChanged(),
          ).subscribe(res => {
            this.doctorList = res.results;
          });
        } else if (type === 'doctor' && (event.keyCode == 38 || event.keyCode == 40)) {
          const doctorList = this.doctorList;
          this.doctorList = doctorList;
        }
      }
    } else {
      this.doctorList = [];
    }
  }

  onGetAllTestsByLocation(id, fromLocationName, toLocationId) {
    this.commonService.getAllTestsByLocation(id).subscribe(res => {
      if (res.results != null) {
        this.testDetailsByLocation = res.results.tests;
        this.isTestInBatch = res.results.isTestInBatch;
        this.locationTests = res.results.locationTests;
      }
      if (this.alternatetestGroup === undefined) {
        this.getBehavioralternateTestGroupView();
      }
      this.ultrasoundIds = [];
      this.mammographyIds = [];
      const getLocationIds = [];
      let alternateLocId: any;
      if (this.alternatetestGroup) {
        const getLocId = Object.keys(this.alternatetestGroup);
        alternateLocId = parseInt(getLocId[0], 10);
        const testGroupName = Object.keys(this.alternatetestGroup[alternateLocId][0]);
        this.testGroupName1 = testGroupName[0];
        this.testGroupName2 = testGroupName[1];

        this.ultrasound = this.alternatetestGroup[alternateLocId][0][this.testGroupName1];
        this.mammography = this.alternatetestGroup[alternateLocId][0][this.testGroupName2];

        if (this.ultrasound.length > 0) {
          for (let m = 0; m < this.ultrasound.length; m++) {
            this.ultrasoundIds.push(this.ultrasound[m].testId);
          }
        }
        if (this.mammography.length > 0) {
          for (let u = 0; u < this.mammography.length; u++) {
            this.mammographyIds.push(this.mammography[u].testId);
          }
        }
      }
      if (this.locationTests.length > 0) {
        this.isAlternateLoc = true;
        this.inactive = true;

        for (let n = 0; n < this.locationTests.length; n++) {
          getLocationIds.push(this.locationTests[n].id);
        }
        const intersection = getLocationIds.filter(x => this.mammographyIds.includes(x));

        if (intersection.length > 0) {
          this.checkedTestGroup1 = false;
          this.checkedTestGroup2 = true;
        } else {
          this.checkedTestGroup1 = true;
          this.checkedTestGroup2 = false;
        }
      } else {
        if (alternateLocId === this.data.locationId) {
          this.inactive = true;
          this.isAlternateLoc = true;
        }
      }
      this.toLocationName = this.locationList.filter(res => res.id === toLocationId);

      if (this.toLocationName.length > 0) {
        this.manageRoom = true;
        this.enableManage = true;
        this.is_status = true;
        this.confirm_test_status = '* Test performed in ' + this.toLocationName[0].name + ' will be mapped to ' + this.fromLocationName;
      }
    });
  }


  getHealthPlanLocation() {
    this.dashboardService.getHealthPlanLocations().subscribe(res => {
      this.locationList = res.results;
    });
  }
  public updateDailyManagement(locationId) {
    this.isDisabled = true;

    this.editDailyManagement = new EditDailyManagement(null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editDailyManagement.queueLength = this.dailyManageForm.controls['queueLength'].value;
    this.editDailyManagement.capacity = this.dailyManageForm.controls['capacity'].value;
    this.editDailyManagement.isAvailable = this.dailyManageForm.controls['isAvailable'].value;
    if ( this.dailyManageForm.controls['isAvailable'].value === true) {
    this.editDailyManagement.gender = this.dailyManageForm.controls['gender'].value;
    this.editDailyManagement.languages = [this.dailyManageForm.controls['languages'].value];
    } else {
      this.editDailyManagement.gender = null;
      this.editDailyManagement.languages = [null];
    }

    if (locationId !== this.dailyManageForm.controls['alternateLocationId'].value) {
      this.editDailyManagement.alternateLocationId = this.dailyManageForm.controls['alternateLocationId'].value;
    }
    this.editDailyManagement.locationId = locationId;
    this.editDailyManagement.isTestInBatch = this.isTestInBatch;

    if (this.isTestInBatch) {
      const curDate = this._dateFormat.transform(
        this.currentDate, 'yyyy-MM-dd'
      );

      this.editDailyManagement.fromTime = curDate.trim() + ' ' + this.dailyManageForm.controls['fromTime'].value + ':00';
      this.editDailyManagement.toTime = curDate.trim() + ' ' + this.dailyManageForm.controls['toTime'].value + ':00';
    }

    if (this.isAlternateLoc === true) {
      if (this.checkedTestGroup1) {
        this.editDailyManagement.healthTests = this.ultrasoundIds;
      } else {
        this.editDailyManagement.healthTests = this.mammographyIds;
      }
    } else {
      this.editDailyManagement.healthTests = [];
    }

    if (!this.doctorEnabled && this.dailyManageForm.controls['userId'].value !== '') {
      this.editDailyManagement.userId = this.data.userId;
    } else if (this.doctorId !== null) {
      this.editDailyManagement.userId = this.doctorId;
    }  else {
      this.editDailyManagement.userId = this.dailyManageForm.controls['userId'].value;
    }

    this.commonService.updateHealthTestByFloorwise(this.editDailyManagement).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }
      if (res.statusCode === 1) {
        this.doctorEnabled = false;
      }
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.dailyManageForm.reset();
  }

  fixClick() {
    console.log('')
  }
}
