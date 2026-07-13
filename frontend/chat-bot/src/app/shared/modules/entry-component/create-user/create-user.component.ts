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
import { Component, OnInit, ViewChild, Inject, ViewEncapsulation,  } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {FormGroup, FormBuilder, Validators, FormControl,  FormArray, AsyncValidatorFn,  AbstractControl, ValidationErrors} from '@angular/forms';
import {DatePipe} from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { HospitalService } from '../../../services/hospital.service';
import { Observable, of } from 'rxjs';
import { startWith, map, catchError } from 'rxjs/operators';
import { CreateShift, CreateUser, EditShift, EditUser, CreateStudent, EditStudent } from './create-user.model';
import { CommonService } from '../../../services/common.service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { ApptermsService } from '../../../services/appterms.service';
import { AppToastService } from '../../../services/toaster.service';
import { ConfigurationService } from '../../../services';

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

export function existingMobileNumberValidator(hospitalService: HospitalService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {

    if (!control.value || control.value.length <= 9) {
      return of(null);
    }

    return hospitalService.searchPhoneNo(control.value).pipe(
      map(res => res?.results?.isAlreadyExists ? { isAlreadyExists: true } : null),
      catchError(() => of(null))
    );
  };
}

export function existingEmailValidator(hospitalService: HospitalService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return hospitalService.searchEmail(control.value)
    .toPromise()
    .then(
      res => {
        return (res && res.results && res.results.isAlreadyExists) ? {'emailExists': true} : null;
      }
    );
  };
}

export function existingUsernameValidator(hospitalService: HospitalService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return hospitalService.searchUserName(control.value).pipe(map(
      res => {
        return (res && res.results && res.results.isAlreadyExists) ? {'userNameExists': true} : null;
      }
    ));
  };
}

@Component({
    selector: 'app-create-user',
    templateUrl: './create-user.component.html',
    styleUrls: ['./create-user.component.scss'],
     encapsulation: ViewEncapsulation.None,
    providers: [DatePipe,
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
      ],
  })
  export class CreateUserComponent implements OnInit {
  
    public roleList: any[] = null;
    public genderList: any[] = null;
    public statusList: any[] = null;
    public userForm: FormGroup;
    public userShiftForm: FormGroup;
    public userPoolForm: FormGroup;
    public userPoolLocationForm: FormGroup;
    public parentDetailsForm: FormGroup;
    public createuser: CreateUser;
    public createStudent : CreateStudent;
    public editStudent : EditStudent;
    public createshift: CreateShift;
    public editshift: EditShift;
    public edituser: EditUser;
    public customerList: any;
    public regionList: any;
    public facilityList: any;
    public emailList: any;
    public phonenoList: any;
    public isLdap: boolean = false;
    public matcher = new ErrorStateMatcherService();
    loading = false;
    public isDisabled = false;
    public activate_btn = null;
    today = new Date();
    public langId: string;
    public countrycodeList = [];
    public userPoolLocData: any[] = [];
    public userPoolData: any[] = [];
    public editUserPoolData: any = null;
    public countryOptions: Observable<any>;
    public enablePhoneNumber = false;
    public userNameList: any;
    public recipientEnabled = false;
    public managerId = null;
    requireManagerMatchVal: any;
    public listItems : any;
    public phoneMessage = null;
    customerName = null;
    height: any;
    selectedTab: any;
    ShiftdisplayedColumns: string[] = ["S.No", "shiftName", "startTime", "endTime", "Select"];
    ShiftdataSource: MatTableDataSource<any>;
    shiftList: any=[];
    userPoolList: any = [];
    poolLocOption: any = [];
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    scheduleStart: string;
    scheduleEnd: string;
    shiftData = false;
    public schedulePermission = null;
    public defaultStartTime = null;
    public defaultEndTime = null;
    public defaultStudentStartTime = null;
    public defaultStudentEndTime = null;
    startTime = null;
    endTime = null;
    shiftId = null;
    startDate = null;
    endDate = null;
    entityId = null;
    public requireLocationMatchVal: any;
    public locationId = null;
    public departmentId = null;
    public deptId = null;
    public isChange = false;
    public toHit = false;
    public locationlist: any;
    public deparmentList: any =[];
    public locationListRes: any;
    public departmentListRes: any = [];
    public departmentList: Array<any> = [];
    public blankField: boolean;
    public blankField2: boolean;
    locationEnabled = false;
    departmentEnabled = false;
    studentStartTime = null;
    studentEndTime = null;
    groupList = [];
    gradeList = [];
    userList = [];
    userTypeList = [];
    userStatusList = [];
    designationList = [];
    requireDepartmentMatchVal: any[];
    public roleType:string = 'User';
    locationPoolList: any=[];
    locationPoolListres: any = [];
    removedUserPool: any=[];
    userId = null;
    removedUserPoolLocation: any=[];
    userPoolLocation: any=[];
    userPoolLocationDetails: any=[];
    locationOption: any=[];
    userLoctionDetail: any=[];
    locDetail = null;
    historyData = null;
    titleList: string[] = ["Mr", "Mrs", "Miss", "Ms", "Mx", "Sir", "Dr"];
    parentDetTabEnabled = false;
    studentRoleSelect = false;
    formBuilderSource : any =[];
    parentRoleId = null;
    mapData = null;
    selectedTabName: any;
    scheduleManagement = null;
    hide = true;
    phoneNoValidation: any = /^[0-9]{8,13}$/;
    passwordValPattern: any =  /^(?=(?:.*\d){1,})(?=.*[@$!%*?&])(?=.*[A-Z]).{8,12}$/;
  
    constructor(public form: FormBuilder,
      public toastr: AppToastService, public snackbar: MatSnackBar, public thisDialogRef: MatDialogRef<CreateUserComponent>,
      public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService,
      private readonly hospitalServices: HospitalService, private readonly _dateFormat: DatePipe, private readonly dateAdapter: DateAdapter<Date>, public apptermsService:ApptermsService,
      public configurationServices: ConfigurationService) {
        this.dynamicData();
        this.activate_btn = this.commonService.getActivePermission('button');
        if(this.activate_btn.includes('TB_UMPADTEN')){
          this.parentDetTabEnabled = true;
        }
        this.historyData = data
        this.getCustomerList();
        this.managerId = this.data.managerId;
        this.deptId = this.data.departmentId;
        this.locationId = this.data.locationId;
        this.defaultStudentStartTime = this._dateFormat.transform(this.data.startDate, 'h:mm a');
        this.defaultStudentEndTime = this._dateFormat.transform(this.data.endDate, 'h:mm a');
        this.buildForm();
        this.getRoles();
        this.userId = this.data.id;
        if(this.data && this.data.id) {
          this.commonService.getUserLocationById(this.data.id).subscribe(res => {
            let usertype =this.data.type; 
            let sizeType = this.data && this.data.hasOwnProperty('sizeType') ? this.data.sizeType : null;
            this.data = res.results;
            this.buildForm();
            this.data.type=usertype;
            if(sizeType !== null) {
              this.data['sizeType'] = sizeType
            }
            this.data.userName = res.results.userName;           
            if(res.results.userLocations.length !== 0) {
              this.userLoctionDetail = res.results.userLocations;
              this.userPoolLocData = [...this.userLoctionDetail];
              for(let i=0; i<res.results.userLocations.length; i++) {
                this.data.poolLocationId = res.results.userLocations[i].id;
                this.data.locationId = res.results.userLocations[i].locationId;
                this.data.locationName = res.results.userLocations[i].locationName;
                this.data.locationNameId = res.results.userLocations[i].locationId;
                this.locationOption.push(this.data.locationId);
              }
            }
            if(this.data.userPoolLocations && this.data.userPoolLocations.length !== 0) {
              this.userPoolData = [...this.data.userPoolLocations];
              for(let i=0; i< this.data.userPoolLocations.length; i++) {
                this.data.poolId = this.data.userPoolLocations[i].id;
                this.data.poolNameId = this.data.userPoolLocations[i].poolNameId;
                this.data.poolLocationId = this.data.userPoolLocations[i].poolLocationId;
                this.poolLocOption.push(this.data.userPoolLocations[i].poolLocationId)
              }
            }
            this.userForm.get('userName').setValue(this.data.userName);
            this.userForm.get('roleIds').setValue(this.data.roleIds!=null ? this.data.roleIds[0]: null);
            this.userForm.get('departmentId').setValue(this.data.departmentName);
            this.mapData = { 
              statusId : 'TW-RSU', 
              type: 'user', 
              data: null}
          });
        }
        this.today.setDate(this.today.getDate());
        this.scheduleManagement = {
          'status': 'TW-SMU',
          'scheduleEntityType': 'EGTI-US',
          'entityType': 'user',
          'data': this.data
        }
    }
  
    ngOnInit() {
      if (window.location.hostname.includes("kyn")) {
        this.customerName = "kyn";
      }
      if (this.data && this.data.type === 'task') {
        this.selectedTab = 1;
        this.getAllShift();
        this.getShiftHistory(this.data.id, this.roleType);
      } else {
        if (this.data?.selectedTab === "Schedule") {
            this.selectedTabName = this.data?.selectedTab;
            this.selectedTab = 3;
        } else {
            this.selectedTab = 0;
        }
      }
      this.commonService.getAppTermsVerion2('PoolName').subscribe(res => {
        this.userPoolList = res.results;
      });
      this.commonService.getAppTermsVerion2('PoolLocation').subscribe(res => {
        this.locationPoolListres = res.results;
        this.locationPoolList = this.locationPoolListres;
      });
      this.langId = localStorage.getItem(btoa('lang'));
      this.commonService.getAppTermsVerion2('CountryCode').subscribe(res => {
        this.countrycodeList = res.results;
        if(!this.data?.countryCode){
          this.apptermsService.setDefaultValue( this.userForm,'countryCode',this.countrycodeList ,'code');
          this.getPhoneValidate(this.userForm.controls['countryCode']?.value, 'code')
        }
      });
      this.commonService.getAppTerms('StudentGrade,StudentGroup,UserType,UserStatus,Designation').subscribe(res => {
        this.gradeList = res.results.filter(resFilter => resFilter.groupName === 'StudentGrade');
        this.groupList = res.results.filter(resFilter => resFilter.groupName === 'StudentGroup');
        this.userList = res.results.filter(resFilter => resFilter.groupName === 'UserType' && (resFilter.code.includes('UT_FATH') ||
          resFilter.code.includes('UT_MOTH') || resFilter.code.includes('UT_GRD')));
        this.userTypeList = res.results.filter(resFilter => resFilter.groupName === 'UserType');
        this.userStatusList = res.results.filter(resFilter => resFilter.groupName === 'UserStatus');
        this.designationList = res.results.filter(resFilter => resFilter.groupName === 'Designation');
      });
      this.countryOptions = this.userForm.controls['countryCode'].valueChanges.pipe(
        startWith(null),
        map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
      );
      this.phoneNumber('disable');
      if (!this.data || this.data?.type === 'user') {
        this.userForm.get("roleIds").setValidators(Validators.required);
        this.userForm.get("roleIds").updateValueAndValidity();
      } else {
        this.userForm.get("roleIds").setValidators(null);
        this.userForm.get("roleIds").updateValueAndValidity();
      }
      if (this.data.type === 'student' || this.data.type === 'staff') {
        this.userForm.get("customerName").setValidators(null);
        this.userForm.get("customerName").updateValueAndValidity();
        this.userForm.get("regionName").setValidators(null);
        this.userForm.get("regionName").updateValueAndValidity();
        this.userForm.get("customerId").setValidators(null);
        this.userForm.get("customerId").updateValueAndValidity();
      } else {
        this.userForm.get("studentStartDate").setValidators(null);
        this.userForm.get("studentStartDate").updateValueAndValidity();
        this.userForm.get("studentEndDate").setValidators(null);
        this.userForm.get("studentEndDate").updateValueAndValidity();
        this.userForm.get("studentStartTime").setValidators(null);
        this.userForm.get("studentStartTime").updateValueAndValidity();
        this.userForm.get("studentEndTime").setValidators(null);
        this.userForm.get("studentEndTime").updateValueAndValidity();
        this.userForm.get("mainidentifier").setValidators(null);
        this.userForm.get("mainidentifier").updateValueAndValidity();
      }
      if(this.data?.type === 'student') {
        this.userForm.get('email').setValidators(null);
        this.userForm.get('email').updateValueAndValidity();
        this.userForm.get('countryCode').setValidators(null);
        this.userForm.get('countryCode').updateValueAndValidity();
        this.userForm.get('phoneNumber').setValidators(null);
        this.userForm.get('phoneNumber').updateValueAndValidity();
      }
      this.parentDetailsForm.get('userTypeId').valueChanges.subscribe(userTypeId => {
        if (userTypeId === 'UT_MOTH') {
          this.parentDetailsForm.get('gender').setValue('Female');
        } else if (userTypeId === 'UT_FATH') {
          this.parentDetailsForm.get('gender').setValue('Male');
        }
      });
    }

  dynamicData() {
    this.configurationServices.getConfigFile('user-config').subscribe((res) => {
        if (res.statusCode === 1) { 
          const dynamicColumns = res.results.contentObject;
          this.schedulePermission = dynamicColumns?.schedulesOldPage;
        }
    });
    this.configurationServices.getConfigFile('validation-config').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.phoneNoValidation = dynamicColumns?.pattern.mobileNo;
        this.passwordValPattern = dynamicColumns?.pattern.password;
        this.setDynamicValidation('phoneNumber', this.phoneNoValidation);
        this.setDynamicValidation('cnfrmNewPassword', this.passwordValPattern);
      }
    });
  }

  setDynamicValidation(controlName: string, pattern: string) {

    if (!pattern || this.data?.id) return;

    const control = this.userForm.get(controlName);

    if (!control) return;

    const regex = new RegExp(pattern);

    if (controlName === 'cnfrmNewPassword') {
      control.setValidators([Validators.pattern(regex)]);
    } else {
      control.setValidators([Validators.required, Validators.pattern(regex)]);
    }
    control.updateValueAndValidity();
  }

    onWindowResized(size) {
      this.height = size;
    }
    getAllShift() {
      this.hospitalServices.getAllShift().subscribe(res => {
        this.shiftList = res.results;
      });
    }
    getShiftHistory(id, type) {
      this.hospitalServices.getShiftHistory(id, type).subscribe(res => {
        if (res.results.length > 0) {
          this.shiftData = true;
        } else {
          this.shiftData = false;
        }
        this.ShiftdataSource = new MatTableDataSource<CreateUser>(res.results);
        this.ShiftdataSource.paginator = this.paginator;
        this.ShiftdataSource.sort = this.sort;
      });
    }
    getShiftTime(data) {
      this.userShiftForm.controls['startTime'].setValue(this._dateFormat.transform(data.startTime, 'h:mm a'));
      this.userShiftForm.controls['endTime'].setValue(this._dateFormat.transform(data.endTime, 'h:mm a'));
    }
    tabClick(event) {
      this.selectedTabName = event.tab.textLabel
      this.selectedTab = event.index;
      if (event.index == 4) {
        this.mapData = {
          statusId : 'TW-RSU',
          type : 'user',
          data : this.data
        }
      }
    }
    getCustomerList(): void {
      this.hospitalServices.getCustomerList().subscribe(res => {
        this.customerList = res.results;
      });
      if (this.data && this.data.facilityId) {
        this.getRegionList(this.data.customerId);
        this.getFacilityList(this.data.regionId);
      } else {
        this.getRegionList(localStorage.getItem('customerId'));
        this.getFacilityList(localStorage.getItem('regionId'));
      }
    }
    getRegionList(cust_id): void {
      this.hospitalServices.getRegionList(cust_id).subscribe(res => {
        this.regionList = res.results;
      });
    }
    getFacilityList(data) {
      this.hospitalServices.getFacilityList(data).subscribe(res => {
        this.facilityList = res.results;
      });
    }
    getRoles() {
      this.commonService.getAllRole().subscribe(res => {
        this.roleList = res.results;
        const parentRoleDet = this.roleList.find(res => res.code === 'RO-PAR');
        this.parentRoleId = parentRoleDet?.id;
        if (localStorage.getItem('userlevel') != '1') {
         this.roleList = this.roleList.filter(val => val.code != 'RO-SU' );
        }
      });
      this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
        this.genderList  = res.results;
      });
  
     
      this.commonService.getAppTermsVerion2('Status').subscribe(res => {
        this.statusList = res.results;
      });
    }
    userChange(value){
      if(value){
        this.isLdap = true;
      }
      this.isLdap = false;
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
  
    searchLocationlist(event) {
      this.locationId = null;
      this.locationEnabled = true;
      this.toHit = event.toHit;
      if (event.type === 'location' && event.text.length >= 2) {
        if (this.toHit === true || this.isChange) {
          this.isChange = false;
          this.hospitalServices.getHomeLocationData(event.text).subscribe(res => {
            if (res.results.length === 0) {
              this.blankField = true;
              this.blankField2 = true;
            }
            this.locationListRes = res.results;
            this.locationlist = this.getValidationLocationList(this.locationListRes, this.userPoolLocData);
          });
        } else {
          this.blankField = false;
          this.blankField2 = false;
          this.locationlist = this.getValidationLocationList(this.locationListRes, this.userPoolLocData);
        }
      } else {
        this.locationlist = [];
        this.locationEnabled = false;
      }
    }

  getValidationLocationList(locList, locData) {
    if (!locData?.length) {
      return locList;
    }

    const poolLocListId = locData.map(res => res.locationId);

    return locList.filter(res => !poolLocListId.includes(res.id));
  }

  getSelectedPoolId(userPoolId, userLocId?) {
    if (userPoolId) {
      this.locationPoolList = this.locationPoolListres;
      const userPoolListIds = this.userPoolData.filter(obj => obj.poolNameId == userPoolId);
      const userPoolLocCode = userPoolListIds.map(res => res.poolLocationId);
      if (userLocId) {
        const editPoolLocList = userPoolLocCode.filter(res => res != userLocId);
        this.locationPoolList = this.locationPoolList.filter(res => !editPoolLocList.includes(res.code));
      } else {
        this.locationPoolList = this.locationPoolList.filter(res => !userPoolLocCode.includes(res.code));
      }
    }
  }

    getLocationID(locationID: any) {
      if (locationID != null) {
        this.locationId = locationID;
      }
      this.blankField = false;
    }
  
    public buildForm() {
      this.userForm = this.form.group({
        firstName: [this.data.firstName ? this.data.firstName : null, [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
        lastName: [this.data.lastName ? this.data.lastName : null, [Validators.required, Validators.minLength(1), Validators.maxLength(25)]],
        address: [this.data.address ? this.data.address : null],
        
        email : [{value: this.data.email ? this.data.email : null, disabled: this.data.email}, [Validators.email,this.conditionallyEmailRequiredValidator()],
        this.data?.type === 'student' ? '' : existingEmailValidator(this.hospitalServices)], 
        gender: [this.data.gender ? this.data.gender : null],
        title: [this.data.title ? this.data.title : null],
        
        birthDate: [this.data.birthDate ? new Date(this.data.birthDate) : null],
        status: [this.data.status ? this.data.status : 'Active'],
        userStatusId: [this.data.userStatusId ? this.data.userStatusId : null],
        phoneNumber: [this.data.phoneNumber ? this.getPhoneNumber(this.data.phoneNumber): null, [Validators.required, Validators.pattern(this.phoneNoValidation)],
        this.data.phoneNumber == null ? existingMobileNumberValidator(this.hospitalServices) : null], 
        roleIds: [this.data.roleId ? this.data.roleId : null, [Validators.required]],
        customerName: [{value: this.data.customerId ? this.data.customerId : localStorage.getItem('customerId'), disabled: !(localStorage.getItem('userlevel') == '1' && this.activate_btn && this.activate_btn.indexOf('BT_MCCE') > -1)}, [Validators.required]],
        regionName: [{ value : this.data.regionId ? this.data.regionId : localStorage.getItem('regionId'), disabled: !(localStorage.getItem('userlevel') == '1' && this.activate_btn && this.activate_btn.indexOf('BT_MCRE') > -1)}, [Validators.required]],
        customerId: [{value : this.data.facilityId ? this.data.facilityId : localStorage.getItem(btoa('facilityId')), disabled: !(localStorage.getItem('userlevel') == '1' && this.activate_btn && this.activate_btn.indexOf('BT_MCFE') > -1)}, [Validators.required]],
        
        userName : [{value: this.data.userName ? this.data.userName : null, disabled: this.data.userName}, [Validators.required, Validators.pattern(/^\S*$/)],
        existingUsernameValidator(this.hospitalServices)], 
        isLdapUser:  [this.data.isLdapUser ? this.data.isLdapUser : this.isLdap],
        
        cnfrmNewPassword: ['', [Validators.pattern(this.passwordValPattern)]],
        countryCode: [this.data.phoneNumber ? this.data.phoneNumber.substring(this.data.phoneNumber.length - 10, -10) : null, [Validators.required, Validators.pattern('^[+][0-9]{1,5}$')]],
        managerId: [this.data.managerName ? this.data.managerName : null, [this.requireManagerMatch.bind(this)]],
        locationId: [this.data.locationName ? this.data.locationName : null, [this.requireLocationMatch.bind(this)]],
        sourceId: [this.data.employeeId ? this.data.employeeId : this.data.sourceId ? this.data.sourceId : null],
        studentStartTime: [this.data.startDate ? this._dateFormat.transform(this.data.startDate, 'h:mm a') : null],
        studentEndTime: [this.data.endDate ?   this._dateFormat.transform(this.data.endDate, 'h:mm a') : null],
        studentStartDate: [this.data.startDate ?  this._dateFormat.transform(this.data.startDate, 'yyyy-MM-dd') : this.today],
        studentEndDate: [this.data.endDate ? this._dateFormat.transform(this.data.endDate, 'yyyy-MM-dd') : null],
        departmentId: [this.data.departmentName ? this.data.departmentName : null, [this.requireDepartmentMatch.bind(this)]],
        designation: [this.data.designationId ? this.data.designationId : null],
        mainidentifier: [this.data.mainIdentifier ? this.data.mainIdentifier : null],
        studentGradeId : [this.data.studentGradeId ? this.data.studentGradeId : null],
        studentGroupId : [this.data.studentGroupId ? this.data.studentGroupId : null],
        parents: this['parentData'] ? this.form.array([this.parentDetails()]) : this.form.array([]),
        userTypeId: [this.data.userTypeId ? this.data.userTypeId : null],
      }
      );
      this.userShiftForm = this.form.group({
        shiftId: [this.data.shiftId ? this.data.shiftId : null, [Validators.required]],
        startTime: [this.startTime ? this.startTime : null, [Validators.required]],
        endTime: [this.endTime ? this.endTime : null, [Validators.required]],
        startDate: [this.startDate ? this.startDate : this.today, [Validators.required]],
        endDate: [this.endDate ? this.endDate : null, [Validators.required]],
      }
      );
      this.parentDetailsForm = this.form.group({
        firstName: [null,[Validators.required]],
        lastName: [null],
        address: [null],
        gender: [null],
        id: [null],
        email: [null,[Validators.email]],
        phoneNumber: [null,[Validators.required, Validators.pattern(/(^[0-9]{9-11}$)/)]],
        birthDate: [null],
        status: [null],
        roleIds: [[this.parentRoleId]],
        userTypeId: [null,[Validators.required]],
        userName: [null],
        password: [null],
        customerId: [null]
      });
      this.userPoolForm = this.form.group({
        poolNameId: [null, [Validators.required]],
        poolLocationId: [null]
      }
      );
      this.userPoolLocationForm = this.form.group({
        locationId: [null]
      }
      );
    }
    
    getPhoneNumber(number) {
      const countryCodes = {
          2: ['+7'],
          3: ['+20', '+27', '+30', '+31', '+32', '+33', '+34', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95', '+98'],
          4: ['+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+244', '+245', '+246', '+247', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+385', '+386', '+387', '+420', '+421', '+423', '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+685', '+686', '+687', '+688', '+689', '+690', '+692', '+808', '+850', '+852', '+853', '+855', '+856', '+880', '+886', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998'],
          5: ['+5399']
      };
  
      for (let length in countryCodes) {
          for (let code of countryCodes[length]) {
              if (number.startsWith(code)) {
                  return number.substring(parseInt(length));
              }
          }
      }
  }

    parentDetails(){
      return this.form.group({
        firstName: [this['parentData'] ? this['parentData'].firstName: null],
        lastName: [this['parentData'] ? this['parentData'].lastName: null],
        address: [this['parentData'] ? this['parentData'].address: null],
        gender: [this['parentData'] ? this['parentData'].gender: null],
        id: [this['parentData'] ? this['parentData'].id: null],
        email: [this['parentData'] ? this['parentData'].email: null],
        phoneNumber: [this['parentData'] ? this['parentData'].phoneNumber: null],
        birthDate: [this['parentData'] ? this['parentData'].birthDate: null],
        status: [this['parentData'] ? this['parentData'].status: null],
        roleIds: [this['parentData'] ? this['parentData'].roleIds: null],
        userTypeId: [this['parentData'] ? this['parentData'].userTypeId: null],
        userName: [this['parentData'] ? this['parentData'].userName: null],
        password: [this['parentData'] ? this['parentData'].password: null],
        customerId: [this['parentData'] ? this['parentData'].customerId: null]
      });
    }

    addInputs() {
      this.formBuilderSource = null;
      this.parentDetailsForm.patchValue({roleIds:[this.parentRoleId]})
      const control = <FormArray>this.userForm.controls['parents'].value;
      control.push(this.parentDetailsForm.value);
      this.formBuilderSource = [...this.userForm.controls['parents'].value];
      Object.keys(this.parentDetailsForm.controls).forEach(key => {
        this.parentDetailsForm.reset();
      });
    }

    conditionallyEmailRequiredValidator(){
      return (control) => {
        if (this.data.type !== 'student') {
          return Validators.required(control);
        } else {
          return null;
        }
      };
    }
    addUserPoolLocation() {
      const poolLocation  = this.userPoolLocationForm.get('locationId').value;
      const poolLocationList = this.locationlist.find(res => res.id === poolLocation);
      let userPoolLocationAdd = {
        'locationId' : poolLocationList.id,
        'locationName' : poolLocationList.fullName,
        'id': null,
        'isDeletable': false,
      }
      this.userPoolLocData.push(userPoolLocationAdd);
      this.userPoolLocData = [...this.userPoolLocData];
      this.userPoolLocationForm.reset();
      this.locationlist = [];
    }
  
    removeUserPoolLocation(data) {

      if (data) {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirm Delete', message: 'Are you sure you want to delete?',
            buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
          }
        });
        dialogRef.afterClosed().subscribe(res => {
          if (res.confirmButtonText === 'Yes') {
            const index = this.userPoolLocData.indexOf(data);
            if (index !== -1 && data.id) {
              const removeUserpool = this.userPoolLocData.find((_, i) => i === index);
              removeUserpool['isDeletable'] = true;
              this.removedUserPoolLocation.push(removeUserpool);
              this.userPoolLocData = this.userPoolLocData.filter((_, i) => i !== index);
            } else {
              this.userPoolLocData = this.userPoolLocData.filter((_, i) => i !== index);
            }
            this.userPoolLocData = [...this.userPoolLocData];
          }
        })
      }
    }

    filterLocationOptions(value) {
      if (value !== null) {
        this.locationOption.push(value);
      } else {
        this.locationOption = [];
      }
    }

    selectedPoolLoc(event){
      if(event){
        this.poolLocOption = event;
      } else {
        this.poolLocOption = []
      }
    }

    addUserPool() {
      const userPoolName = this.userPoolForm.controls['poolNameId'].value;
      const userPoolLocation = this.userPoolForm.controls['poolLocationId'].value;
      const userPoolNameDels = this.userPoolList.find(res => res.code == userPoolName);
      const userPoolLocationDels = this.locationPoolList.find(res => res.code == userPoolLocation);

      let userPoolList = {
        'poolNameId': userPoolNameDels ? userPoolNameDels.code : null,
        'poolName': userPoolNameDels ? userPoolNameDels.value : null,
        'poolLocationId': userPoolLocationDels ? userPoolLocationDels.code : null,
        'poolLocationName': userPoolLocationDels ? userPoolLocationDels.value : null,
        'isDeletable': this.editUserPoolData ? this.editUserPoolData.isDeletable : false,
        'id': this.editUserPoolData ? this.editUserPoolData.id : null
      }
      if (this.editUserPoolData && userPoolList?.id) {
        const index = this.userPoolData.findIndex(res => res.id === this.editUserPoolData.id);
        if (index !== -1) {
          this.userPoolData[index] = userPoolList;
        }
      } else {
        if (this.editUserPoolData) {
          const index = this.userPoolData.findIndex(res => res.poolNameId === this.editUserPoolData.poolNameId && res.poolLocationId === this.editUserPoolData.poolLocationId);
          if (index !== -1) {
            this.userPoolData[index] = userPoolList;
          } else {
            this.userPoolData.push(userPoolList);
          }
        } else {
          this.userPoolData.push(userPoolList);
        }
      }
      this.userPoolData = [...this.userPoolData];
      this.userPoolForm.reset();
      this.editUserPoolData = null;
    }

    editUserPoolInfo(data) {
      this.editUserPoolData = data;
      this.userPoolForm.controls['poolNameId'].setValue(data.poolNameId);
      this.userPoolForm.controls['poolLocationId'].setValue(data.poolLocationId);
    }

    removeUserPool(data) {
      if (data) {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirm Delete', message: 'Are you sure you want to delete?',
            buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
          }
        });
        dialogRef.afterClosed().subscribe(res => {
          if (res.confirmButtonText === 'Yes') {
            const index = this.userPoolData.indexOf(data);
            if (index !== -1 && data.id) {
              const removeUserpool = this.userPoolData.find((_, i) => i === index);
              removeUserpool['isDeletable'] = true;
              this.removedUserPool.push(removeUserpool);
              this.userPoolData = this.userPoolData.filter((_, i) => i !== index);
            } else {
              this.userPoolData = this.userPoolData.filter((_, i) => i !== index);
            }
            this.userPoolData = [...this.userPoolData];
          }
        })
      }

    }
  
    requireManagerMatch(control: FormControl): ValidationErrors | null {
      if (this.managerId == null) {
        if (control.value !== null && control.value !== '' &&  this.recipientEnabled) {
        this.requireManagerMatchVal = this.userNameList.filter(resFilter => resFilter.id === control.value);
        if (this.requireManagerMatchVal.length === 0) {
            return { requireMatch: true };
          }
        }
        return null;
      }
    }
  
    private requireLocationMatch(control: FormControl): ValidationErrors | null {
      if (this.locationId == null) {
        if (control.value !== null && control.value !== '' && this.blankField) {
        this.requireLocationMatchVal = this.locationlist.filter(resFilter => resFilter.id === control.value);
        if (this.requireLocationMatchVal.length === 0) {
            return { requireMatch: true };
          }
        }
        return null;
      }
    }
  
    requireDepartmentMatch(control: FormControl): ValidationErrors | null {
      if (this.deptId == null) {
        if (control.value !== null && control.value !== '' &&  this.departmentEnabled) {
        this.requireDepartmentMatchVal = this.departmentList.filter(resFilter => resFilter.id === control.value);
        if (this.requireDepartmentMatchVal.length === 0) {
            return { requireMatch: true };
          }
        }
        return null;
      }
    }

    setEmailValue(event) {
      if (event) {
        this.userForm.get('userName').setValue(this.userForm.get('email').value);
      } else {
        this.userForm.get('userName').setValue(this.data.userName ? this.data.userName : null);
      }
      this.userForm.get('userName').updateValueAndValidity();
    }
  
    phoneNumber(type) {
      if ((this.data.id || this.data.userId) && type === 'disable') {
        this.enablePhoneNumber = false;
      } else {
        this.userForm.controls['countryCode'].setValue('+');
        this.userForm.controls['phoneNumber'].setValue(null);
        this.enablePhoneNumber = true;
      }
    }
    searchUserNamelist(event) {
      this.managerId = null;
      if (event.type === 'manager' && event.text.length >= 2){
        if (event.toHit == true) {
          this.commonService.getRecipientName(event.text, 'RT-US').subscribe(res => {
            this.listItems = res.results;
            this.userNameList = this.listItems;
            this.recipientEnabled = true;
          });
        } else {
          this.userNameList = this.listItems;
          this.recipientEnabled = true;
        }
      } else {
        this.userNameList = [];
        this.recipientEnabled = false;
      }
    }
    getRecipientList(id) {
      if (id) {
        const recipient = this as any as { id: string, name: string }[]
        const recipientId = recipient.find(obj => obj.id === id).name;
        return recipientId;
      } else {
        return '';
      }
    }
    getDepartmentList(id) {
      if (id) {
        const department = this as any as { id: string, name: string }[]
        const departmentId = department.find(obj => obj.id === id).name;
        return departmentId;
      } else {
        return '';
      }
    }
    addShift() {
      this.createshift = new CreateShift(null, null, null, null, null, null);
      const scheduleStartDate = this._dateFormat.transform(this.userShiftForm.controls['startDate'].value, 'yyyy-MM-dd');
      this.startTime = scheduleStartDate + ' ' + this.userShiftForm.controls['startTime'].value;
      if(this.userShiftForm.controls['endDate'].value !== null) {
        const scheduleEndDate = this._dateFormat.transform(this.userShiftForm.controls['endDate'].value, 'yyyy-MM-dd');
        this.endTime = scheduleEndDate + ' ' + this.userShiftForm.controls['endTime'].value;
      }
      this.scheduleStart = this._dateFormat.transform(this.startTime, 'yyyy-MM-dd HH:mm:ss');
      this.scheduleEnd = this._dateFormat.transform(this.endTime, 'yyyy-MM-dd HH:mm:ss');
      this.createshift.entityId = this.data.id;
      this.createshift.entityType = this.roleType;
      this.createshift.shiftMasterId = this.userShiftForm.controls['shiftId'].value;
      this.createshift.startDate = this.scheduleStart;
      this.createshift.endDate = this.scheduleEnd;
      this.createshift.status = true;
      
      this.hospitalServices.saveShift(this.createshift).subscribe(res => {
        if (res.statusCode == 1) {
          this.toastr.success('Success', `${res.message}`);
          this.getShiftHistory(this.data.id, this.roleType);
          this.userShiftForm.reset();
          this.defaultStartTime = null;
          this.defaultEndTime = null;
          this.userShiftForm.controls['startTime'].setValue(null);
          this.userShiftForm.controls['endTime'].setValue(null);
          this.userShiftForm.controls['startDate'].setValue(this.today);
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
    editShift(data) {
      this.shiftId = data.id;
      this.entityId = data.entityId;
      const startTime = this._dateFormat.transform(data.startDate, 'h:mm a');
      this.startTime = startTime;
      const endTime = this._dateFormat.transform(data.endDate, 'h:mm a');
      this.endTime = endTime;
      const startDate = this._dateFormat.transform(data.startDate, 'yyyy-MM-dd');
      this.startDate = startDate;
      const endDate = this._dateFormat.transform(data.endDate, 'yyyy-MM-dd');
      this.endDate = endDate;
      this.userShiftForm.patchValue({
        'shiftId': data.shiftMasterId,
        'startTime': this.startTime,
        'endTime': this.endTime,
        'startDate': this.startDate,
        'endDate': this.endDate
      });
    }
    cancelEditShift() {
      this.shiftId = null;
      this.entityId = null;
      this.startTime = null;
      this.endTime = null;
      this.endDate = null;
      this.startDate = null;
      this.userShiftForm.reset();
      this.userShiftForm.controls['startDate'].setValue(this.today);
    }
    deleteShift(data) {
      this.shiftId = data.id;
      const shiftData = {
        "endDate": data.endDate,
        "entityId": data.entityId,
        "entityType": data.entityType,
        "shiftMasterId": data.shiftMasterId,
        "startDate": data.startDate,
        "isDeleteFlag": true
      }
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: 'Remove Shift', message: 'Do you want to delete the shift ?',
          buttonText: { ok: 'Delete', cancel: 'Cancel' },
          'isRemark': 1, 'shift': true, 'shiftId': data.id,
          'shiftData': shiftData, 'deleteShift': true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        this.getShiftHistory(data.entityId, this.roleType);
        this.shiftId = null;
      });
    }
    updateShift() {
      this.editshift = new EditShift(null, null, null, null, null, null);
      const scheduleStartDate = this._dateFormat.transform(this.userShiftForm.controls['startDate'].value, 'yyyy-MM-dd');
      this.startTime = scheduleStartDate + ' ' + this.userShiftForm.controls['startTime'].value;
      if(this.userShiftForm.controls['endDate'].value !== null) {
        const scheduleEndDate = this._dateFormat.transform(this.userShiftForm.controls['endDate'].value, 'yyyy-MM-dd');
        this.endTime = scheduleEndDate + ' ' + this.userShiftForm.controls['endTime'].value;
      }
      this.scheduleStart = this._dateFormat.transform(this.startTime, 'yyyy-MM-dd HH:mm:ss');
      this.scheduleEnd = this._dateFormat.transform(this.endTime, 'yyyy-MM-dd HH:mm:ss');
      this.editshift.entityId = this.entityId;
      this.editshift.entityType = this.roleType;
      this.editshift.shiftMasterId = this.userShiftForm.controls['shiftId'].value;
      this.editshift.startDate = this.scheduleStart;
      this.editshift.endDate = this.scheduleEnd;
      this.editshift.status = true;
      
      this.hospitalServices.updateShift(this.shiftId, this.editshift).subscribe(res => {
        if (res.statusCode == 1) {
          this.toastr.success('Success', `${res.message}`);
          this.getShiftHistory(this.entityId, this.roleType);
          this.userShiftForm.reset();
          this.shiftId = null;
          this.entityId = null;
          this.defaultStartTime = null;
          this.defaultEndTime = null;
          this.userShiftForm.controls['startTime'].setValue(null);
          this.userShiftForm.controls['endTime'].setValue(null);
          this.userShiftForm.controls['startDate'].setValue(this.today);
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
    public saveUser() {
      this.isDisabled = true;
  
      this.createuser = new CreateUser(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null,null);
      this.createuser.firstName   = this.userForm.controls['firstName'].value;
      this.createuser.lastName    = this.userForm.controls['lastName'].value;
      this.createuser.address     = this.userForm.controls['address'].value;
      this.createuser.email       = this.userForm.controls['email'].value;
      this.createuser.gender      = this.userForm.controls['gender'].value;
      this.createuser.birthDate   = this._dateFormat.transform(this.userForm.controls['birthDate'].value, 'yyyy-MM-dd');
      this.createuser.status      = this.userForm.controls['status'].value;
      this.createuser.phoneNumber = this.userForm.controls['countryCode'].value.trim() + this.userForm.controls['phoneNumber'].value;
      this.createuser.roleIds     = [this.userForm.controls['roleIds'].value];
      this.createuser.customerId  = this.userForm.controls['customerId'].value;
      this.createuser.userName  = this.userForm.controls['userName'].value;
      this.createuser.isLdapUser = this.userForm.controls['isLdapUser'].value;
      this.createuser.password = this.userForm.controls['cnfrmNewPassword'].value;
      this.createuser.managerId = this.userForm.controls['managerId'].value;
      this.createuser.locationId = this.locationId;
      this.createuser.sourceId = this.userForm.controls['sourceId'].value;
      this.createuser.departmentId = this.userForm.controls['departmentId'].value;
      this.createuser.userTypeId = this.userForm.controls['userTypeId'].value;
      this.isDisabled = false;
      if(!this.studentRoleSelect){
        this.hospitalServices.saveUser(this.createuser).subscribe(res => {
          if (res.statusCode != 1) {
            this.isDisabled = false;
          }
        
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      } else{
        this.createuser.parents = this.userForm.controls['parents'].value;
        this.commonService.createUser(this.createuser).subscribe(res =>{
          if (res.statusCode != 1) {
            this.isDisabled = false;
          }

          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    }
    saveUserPool() {
      let userPoolInfo = {};

      if(this.removedUserPool.length) {
        this.userPoolData = this.userPoolData.concat(this.removedUserPool);
      }

      if (this.userPoolData.length) {
        userPoolInfo = {
          'userPoolLocations': this.userPoolData
        };
      }
      //  console.log(userPoolInfo)
      // return
      this.hospitalServices.updateUserPool(userPoolInfo, this.userId).subscribe(res => {
        if (res.statusCode != 1) {
          this.isDisabled = false;
        }
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
    saveUserPoolLocation() {
      
      let userPoolLocInfo = {};

      if(this.removedUserPoolLocation.length ) {
        this.userPoolLocData = this.userPoolLocData.concat(this.removedUserPoolLocation);
      }
      if(this.userPoolLocData.length) {
        userPoolLocInfo = {
          'userLocations': this.userPoolLocData
        };
      }
      // console.log(userPoolLocInfo);
      // return
      this.hospitalServices.updateUserPool(userPoolLocInfo, this.userId).subscribe(res => {
        if (res.statusCode != 1) {
          this.isDisabled = false;
        }
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  
  public saveStudent(type) {
    this.isDisabled = true;

    this.createStudent = new CreateStudent(null, null, null, null, null, null, null, null, null, null, null, null, null, null,  null, null,null,null,null,null,null);
    const facilityId = localStorage.getItem(btoa('facilityId'));
    const scheduleStartDate = this._dateFormat.transform(this.userForm.controls['studentStartDate'].value, 'yyyy-MM-dd');
    this.studentStartTime = scheduleStartDate + ' ' + (this.userForm.controls['studentStartTime'].value ? this.userForm.controls['studentStartTime'].value : '');
    if (this.userForm.controls['studentEndDate'].value !== null) {
      const scheduleEndDate = this._dateFormat.transform(this.userForm.controls['studentEndDate'].value, 'yyyy-MM-dd');
      this.studentEndTime = scheduleEndDate + ' ' + this.userForm.controls['studentEndTime'].value;
    }
    this.scheduleStart = this._dateFormat.transform(this.studentStartTime, 'yyyy-MM-dd HH:mm:ss');
    this.scheduleEnd = this._dateFormat.transform(this.studentEndTime, 'yyyy-MM-dd HH:mm:ss');
    this.createStudent.startDate = this.scheduleStart;
    this.createStudent.endDate = this.scheduleEnd;
    this.createStudent.customerId  = facilityId;
    this.createStudent.title = this.userForm.controls['title'].value;
    this.createStudent.firstName   = this.userForm.controls['firstName'].value;
    this.createStudent.lastName    = this.userForm.controls['lastName'].value;
    this.createStudent.address     = this.userForm.controls['address'].value;
    this.createStudent.email       = this.userForm.controls['email'].value;
    this.createStudent.gender      = this.userForm.controls['gender'].value;
    this.createStudent.phoneNumber = this.userForm.controls['phoneNumber'].value ? this.userForm.controls['countryCode'].value.trim() + this.userForm.controls['phoneNumber'].value : null;
    this.createStudent.userTypeId      = type == 'student'?'UT_STUDENT':'UT_STAFF';
    this.createStudent.isCreateUserOnly = true;
    this.createStudent.isLdapUser = false;
    this.createStudent.mainidentifier = this.userForm.controls['mainidentifier'].value;
    this.createStudent.birthDate   = this._dateFormat.transform(this.userForm.controls['birthDate'].value, 'yyyy-MM-dd');
    this.createStudent.departmentId = this.userForm.controls['departmentId'].value;
    this.createStudent.locationId = this.locationId;
    this.createStudent.studentGradeId      = this.userForm.controls['studentGradeId'].value;
    this.createStudent.studentGroupId      = this.userForm.controls['studentGroupId'].value;
    this.createStudent.userStatusId = this.userForm.controls['userStatusId'].value;
    this.createStudent.designationId = this.userForm.controls['designation'].value;

    this.hospitalServices.saveUser(this.createStudent).subscribe(res => {
        if (res.statusCode != 1) {
          this.isDisabled = false;
        }

        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }

    public updateStudent(data) {
      this.isDisabled = true;
      this.editStudent = new EditStudent(null, null, null, null, null, null, null, null, null, null, null,null, null, null,  null, null,null,null,null,null,null);
      const facilityId = localStorage.getItem(btoa('facilityId'));
      const scheduleStartDate = this._dateFormat.transform(this.userForm.controls['studentStartDate'].value, 'yyyy-MM-dd');
      this.studentStartTime = scheduleStartDate + ' ' + (this.userForm.controls['studentStartTime'].value ? this.userForm.controls['studentStartTime'].value : '');
      if(this.userForm.controls['studentEndDate'].value !== null) {
        const scheduleEndDate = this._dateFormat.transform(this.userForm.controls['studentEndDate'].value, 'yyyy-MM-dd');
        this.studentEndTime = scheduleEndDate + ' ' + this.userForm.controls['studentEndTime'].value;
      }
      this.editStudent.id = data.userId;
      this.scheduleStart = this._dateFormat.transform(this.studentStartTime, 'yyyy-MM-dd HH:mm:ss');
      this.scheduleEnd = this._dateFormat.transform(this.studentEndTime, 'yyyy-MM-dd HH:mm:ss');
      this.editStudent.startDate = this.scheduleStart;
      this.editStudent.endDate = this.scheduleEnd;
      this.editStudent.customerId  = facilityId;
      this.editStudent.firstName   = this.userForm.controls['firstName'].value;
      this.editStudent.lastName    = this.userForm.controls['lastName'].value;
      this.editStudent.address     = this.userForm.controls['address'].value;
      this.editStudent.email       = this.userForm.controls['email'].value;
      this.editStudent.gender      = this.userForm.controls['gender'].value;
      this.editStudent.phoneNumber = this.userForm.controls['phoneNumber'].value ? this.userForm.controls['countryCode'].value.trim() + this.userForm.controls['phoneNumber'].value : null;
      this.editStudent.userTypeId      = 'UT_STUDENT';
      this.editStudent.title = this.userForm.controls['title'].value;
      this.editStudent.userStatusId = this.userForm.controls['userStatusId'].value;
      this.editStudent.designationId = this.userForm.controls['designation'].value;
      this.editStudent.birthDate   = this._dateFormat.transform(this.userForm.controls['birthDate'].value, 'yyyy-MM-dd');
      if (this.deptId === null) {
        this.editStudent.departmentId  = this.userForm.controls['departmentId'].value;
      } else {
        this.editStudent.departmentId  = this.deptId;
      }
      this.editStudent.locationId = this.locationId;
      this.editStudent.studentGradeId       = this.userForm.controls['studentGradeId'].value;
      this.editStudent.studentGroupId      = this.userForm.controls['studentGroupId'].value;
      
      this.hospitalServices.editUser(this.editStudent).subscribe(res => {
          if (res.statusCode != 1) {
            this.isDisabled = false;
          }
  
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }

    public editUser(data) {
      this.isDisabled = true;
  
      this.edituser = new EditUser(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null);
      this.edituser.id          = data.id;
      this.edituser.firstName   = this.userForm.controls['firstName'].value;
      this.edituser.lastName    = this.userForm.controls['lastName'].value;
      this.edituser.address     = this.userForm.controls['address'].value;
      this.edituser.email       = this.userForm.controls['email'].value;
      this.edituser.gender      = this.userForm.controls['gender'].value;
      this.edituser.birthDate   = this._dateFormat.transform(this.userForm.controls['birthDate'].value, 'yyyy-MM-dd');
      this.edituser.status      = this.userForm.controls['status'].value;
      this.edituser.userTypeId = this.userForm.controls['userTypeId'].value;
      
      this.edituser.phoneNumber = this.userForm.controls['phoneNumber'].value ? this.userForm.controls['countryCode'].value.trim() + this.userForm.controls['phoneNumber'].value : null;
      this.edituser.roleIds     = [this.userForm.controls['roleIds'].value];
      this.edituser.customerId  = this.userForm.controls['customerId'].value;
      if (this.managerId === null) {
        this.edituser.managerId  = this.userForm.controls['managerId'].value;
      } else {
        this.edituser.managerId  = this.managerId;
      }
      this.edituser.locationId = this.locationId;
      
      this.edituser.isLdapUser = this.userForm.controls['isLdapUser'].value;
      
      this.edituser.sourceId = this.userForm.controls['sourceId'].value;
      if(typeof(this.userForm.controls['departmentId'].value) == 'string' || this.userForm.controls['departmentId'].value == ''){
        this.edituser.departmentId = this.data?.departmentId;
      }else{
        this.edituser.departmentId = this.userForm.controls['departmentId'].value;
      }      
      this.hospitalServices.editUser(this.edituser).subscribe(result => {
        if (result.statusCode != 1) {
          this.isDisabled = false;
        }
        
        this.toastr.success('Success', `${result.message}`);
        this.thisDialogRef.close('confirm');
       },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
    }

    searchDepartmentDetails(event) {
      this.deptId = null;
      this.departmentEnabled = true;
      if (event.type === 'department' && event.text.length >= 2) {
        if (event.toHit === true) {
          this.commonService.getAllDepartments(event.text).subscribe(res => {
            this.departmentListRes = res.results;
            this.departmentList = this.departmentListRes;
            this.departmentEnabled = true;
          });
        } else {
          this.departmentList = this.departmentListRes;
          this.departmentEnabled = true;
        }
      } else {
        this.departmentList = [];
        this.departmentEnabled = false;
      }
    }
    roleSelect(value) {
      if (value === 'RO-PO') {
        this.roleType = 'Porter';
      } else {
        this.roleType = 'User';
      }
      if(value === 'RO-ST'){
        this.studentRoleSelect = true;
      } else{
        this.studentRoleSelect = false;
      }
  }
  resetPassword(data){
    let userData = {
      userId : this.data.id,
      userName : this.data.userName
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true, width : '400px', height : '300px',
      data: {
        title: 'Confirmation', message: 'Are you sure you want to Reset Password?',
        buttonText: { ok: 'Yes', cancel: 'Cancel' },
        'isRemark': 1, 'userData': userData, 
        'resetPassword': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      let restId = { userId: this.shiftId }
      if (result === 'Yes') {
        this.dialog.closeAll();
      }
    });
  }

  onMobileInput() {
    const control = this.userForm.get('phoneNumber');
    const value = control?.value;
    if (control?.valid) {
      this.getPhoneValidate(value, 'phone');
    }
  }

  getPhoneValidate(data, type) {
    const code = type === 'code' ? data : this.userForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if (res.results) {
        if (type === 'code') {
          const length = res.results?.length;
          this.userForm.get('phoneNumber').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
          this.userForm.get('phoneNumber')?.updateValueAndValidity();
        }
      } else {
        const control = this.userForm.get('phoneNumber');
        control?.setErrors({ invalidPhone: true });
        this.phoneMessage = res.message;
      }
    });
  }

  eventAction(event) {
    if (event.key == 'edit') {
      this.editUserPoolInfo(event.data);
      this.getSelectedPoolId(event?.data?.poolNameId, event?.data?.poolLocationId)
    } else if (event.key == 'delete') {
      if (event?.data?.hasOwnProperty('locationId')) {
        this.removeUserPoolLocation(event.data)
      } else {
        this.removeUserPool(event.data)
      }
    }
  }

    fixClick() {
    console.log('')
  }
  }
