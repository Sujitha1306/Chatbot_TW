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

import { Component, Inject, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../../services';
import { CreatePatient, EditPatient } from './manage-patient.model';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { ConfirmationDialog, MY_FORMATS } from '../../confirmation-dialog/confirmation-dialog.component';
import { CalendarComponent } from '../../calendar/calendar.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTableDataSource } from '@angular/material/table';
import { AppToastService } from '../../../../services/toaster.service';
import { LookupTermService } from '../../../../lookup-term.service';

@Component({
  selector: 'app-manage-patient',
  templateUrl: './manage-patient.component.html',
  styleUrls: ['./manage-patient.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None
})
export class ManagePatientComponent implements OnInit {
   @Input() scheduleInputData: any = {};
   @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;
  public managePatientForm: FormGroup;
  public genderCode: any;
  public patientdata: any;
  public genderList: any;
  public doctorList: any = [];
  public surgeryList: any[] = [];
  public surgeryListData : any;
  public emergencyList: any;
  public tagList: any;
  public locationList: any[] = [];
  public assetAllNamelist: any;
  public itemMasterListData : any;
  public doctornameEnabled = false;
  public surgeryEnabled = false;
  public tagEnabled = false;
  public locationEnabled = false;
  public phoneMessage = null;
  today = new Date();
  public visitEvent: any;
  public visitType: any;
  public tagTypeId = null;
  public isSearch = true;
  public enrollPatientConfig: any = null;
  public countryOptions: Observable<any>;
  isEmergency = false;
  dataSource : any[] = [];
  resourcesList = [{ code: 'SE-AT' , name: 'Asset' },{ code: 'SE-UR', name: 'User' }]; // SE - scheduleEvent
  DisplayColumn = ['Type', 'Role/Category','Name', 'EditDelete'];
  DataColumns = ['entityType', 'roleCategory', 'entityName', 'editeDelete'];
  departmentList: any;
  assetCategory: any;
  roleList: any;
  isActiveTable: boolean = false;
  catagoryData: any;
  assetCatagoryData: any[] = [];
  assetCatagoryEnabled: boolean = false;
  scheduleInfoList: any;
  ispastDatainfo: boolean = false;
  staffListData: any[] = [];
  staffListEnable: boolean = false;
  staffTypeData: any;
  public activate_btn: any = [];
  surgeryName: any=[];
  surgeryIdList = [];
  allowedCodes: any[];
  templateValue: any[] = [];
  assetNameData: any;
  staffNameData: any;
  entityBooking = true;
  deleteSchedule: any;
  deleteConSchedule: any[] = [];
  deleteImpSchedule: any[] = [];
  deleteSetSchedule: any[] = [];
  surgerycalSetList : any;
  setStatusData : any;
  selectedSubTab = 'User/Asset';
  tabExist = 'User/Asset';
  MPDataSource = new MatTableDataSource;
  conDataSource : any[] = [];
  impDataSource : any[] = [];
  setDataSource : any[] = [];
  MPDisplayColumn = ['select', 'gender', 'firstName', 'mainidentifier', 'scheduleStartTime', 'otLocationName', 'doctorName', 'otProcedureNames', 'birthDate', 'mobileNumber'];
  conDisplayColumn = ['Consumable ID', 'Consumable Name', 'Requested Quantity', 'Requested Date', 'Allocated Quantity', 'Delivered Date', 'Status', 'EditDelete'];
  conDataColumns = ['entityId', 'entityName', 'requestedQuantity', 'requestDateTime', 'allocatedQuantity', 'deliveredDateTime', 'requestStatusValue', 'editeDelete'];
  impDisplayColumn = ['Implant ID', 'Implant Name', 'Requested Quantity', 'Requested Date', 'Allocated Quantity', 'Delivered Date', 'Status', 'EditDelete'];
  impDataColumns = ['entityId', 'entityName', 'requestedQuantity', 'requestDateTime', 'allocatedQuantity', 'deliveredDateTime', 'requestStatusValue', 'editeDelete'];
  setDisplayColumn = ['Set Code', 'Set GroupName','Quantitys','RemoveEdite'];
  setDataColumns = ['entityCode', 'entityName','requestedQuantity','removeEdite'];
  setDisplayColumn1 = ['Set Code', 'Set GroupName', 'Set Status','RemoveEdite'];
  setDataColumns1 = ['entityCode', 'entityName', 'requestStatusValue','removeEdite'];
  menuOption = [{"name": "Allow overlap", "type": "overlap", "value": null}, {"name": "Calendar", "type": "calendar", "value": null}];
  implantName = null;
  consumableName = null;
  setName = null;
  consumableData: any = [];
  implantData: any = [];
  setData: any = [];
  sterlieSetList: any = [];
  sterlieSetListInfo: any[];
  statusListData: any[] = []; 
  identifierIdList: any[] = [];
  setSurgicalData: any[] = [];
  countrycodeList: any[] = [];
  configData: any;
  entityBookingId = null;
  editDataInfo: any;
  locEntityBookingId = null;
  locEntityBooking = true;
  isCanbeDisabled = false;
  surgerySla = 0;
  totalQuantity = null;
  totalImpQuantity = null;
  isConQuentity: boolean = false;
  isConQuentError: boolean = false;
  isImpQuentity: boolean = false;
  isImpQuentError: boolean = false;
  colorChangeData: boolean = false;
  locChangeColor: boolean = false;
  onLoading: boolean = false;
  @ViewChild(MatAutocompleteTrigger, {read: MatAutocompleteTrigger}) locAutoComplete: MatAutocompleteTrigger;
  otReasonList: any;
  locEntityBookingName = null;
  entityBookingName = null;
  preEventData = null;
  statusInfoData: any[];
  otScheduleConfig: boolean = true;
  isEnabledTable = false;
  checkedData = null;
  selectedTabIndex: number = 0;
  minDateTime = this.today.toISOString().slice(0, 16); 

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: AppToastService, private readonly commonService: CommonService, private readonly _dateFormat: DatePipe,
    public thisDialogRef: MatDialogRef<ManagePatientComponent>, private readonly dateAdapter: DateAdapter<Date>,public dialog: MatDialog,private readonly workflowService: WorkflowService, 
    private readonly configurationService: ConfigurationService, private readonly lookupTermService: LookupTermService) {
    this.today.setDate(this.today.getDate());
    this.activate_btn = this.commonService.getActivePermission("button");
    if (this.activate_btn.includes('BT_OTS')) {
      this.getConfigData();
    } else {
      if (!this.data.id) {
      setTimeout(() => {this.getConfigChangesData()},800)
        this.getConfigChangesData();
        this.otScheduleConfig = false;
      }
    }
  }

  ngOnInit(): void {
    if(this.scheduleInputData.hasOwnProperty('statusKey') && this.scheduleInputData.statusKey === 'TW-AOT') {
      this.data = this.scheduleInputData.data;
      this.workflowService.getAllItemMaster('IT-CON').subscribe(res => {
        if (res.statusCode === 1) {
          this.consumableData = res.results.filter(x => x.name != null);
        }
      })
    }
    this.visitEvent = this.data.visitEvent
    this.visitType = this.data.visitType
    if (this.data?.hasOwnProperty('otDelayTime') && this.data?.otDelayTime !== null) {
      if (this.data.delayStartTime != null) {
        const mins = parseInt(this.data.delayStartTime);
        const hrs = Math.floor(mins / 60);
        const mm = mins % 60;
        this.data.delayStartTime = `${hrs.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
      }
      if (this.data.delayEndTime != null) {
        const mins = parseInt(this.data.delayEndTime);
        const hrs = Math.floor(mins / 60);
        const mm = mins % 60;
        this.data.delayEndTime = `${hrs.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
      }
      this.lookupTermService.getAppTermsWrapper('OtDelayReason').subscribe((res) => {
        if (res) {
          this.otReasonList = res.OtDelayReason ?? [];                   
        }
      });
    }
    this.buildForm()
    this.lookupTermService.getAppTermsVerion2Wrapper('CountryCode').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      setTimeout(() => {this.setupCountryCodeAutocomplete()},500);
      this.getPhoneValidate(this.managePatientForm.controls['countryCode']?.value, 'code')
    });
    this.managePatientForm.get('endTime')?.valueChanges.subscribe(() => { this.getErrorValidation() });
    this.lookupTermService.getAppTermsVerion2Wrapper('Gender').subscribe(res => {
      this.genderList = res?.Gender ?? [];
    });
    this.lookupTermService.getAppTermsVerion2Wrapper('SurgeryType').subscribe(res => {
      this.emergencyList = res?.SurgeryType ?? [];
    });
    this.commonService.getOTProcedure().subscribe(res => {
      this.surgeryListData = res.results;
      if(this.data?.eventDetails) {
        const pro = this.data.eventDetails?.filter(x => x.entityType === 'ot_procedure');
        if(pro?.length > 0) {
          const surgery = this.surgeryListData?.filter(x => x.id === pro[0]?.entityId);
          if(surgery?.length > 0) {
            this.surgerySla = surgery[0]?.surgerySla;
          }
        }
      }
    });
    if (this.data.id) {
      this.isSearch = false
      this.getOverallPatient(this.data.patientId, 'VT-IP', 'VE-OT', this.data?.visitEventId, true);
      this.setDisplayColumn = this.setDisplayColumn1;
      this.setDataColumns = this.setDataColumns1;
    }
    this.lookupTermService.getAppTermsVerion2Wrapper('AssetCategory').subscribe(res => {
      this.assetCategory = res?.AssetCategory?.filter(item => item.code !== 'ASC-ALS' && item.code !== 'ASC-BLS')
        .map(item => ({
          ...item,
          name: item.value, 
        })) ?? [];
    });
    this.commonService.getAllRole().subscribe(res => {
      this.allowedCodes = ['RO-DO', 'RO-NU', 'RO-BI', 'RO-ANE', 'RO-SUR', 'RO-OTT', 'RO-RAD', 'RO-PER', 'RO-PED', 'RO-OBG', 'RO-URO', 'RO-OPH', 'RO-PAT'];
      this.roleList = res.results.filter(item => this.allowedCodes.includes(item.code)).sort((a, b) => a.name.localeCompare(b.name));
    });
    this.lookupTermService.getAppTermsWrapper('SurgicalSets,VisitStatus').subscribe(res => {
      if (res) {
        this.sterlieSetListInfo = res?.SurgicalSets ?? [];  
        this.statusInfoData = res?.VisitStatus ?? [];
        if (this.data.id == null || this.data.id == undefined) {
          this.statusListData = this.statusInfoData.filter(x => x.code == 'VS-SH');
        } else {
          this.statusListData = this.statusInfoData.filter(x => x.code == 'VS-SH' || x.code == 'VS-CL')
        }
      }
    })
    if (this.data.isActive == true){
       setTimeout(() => {this.UpdateResourceData()}, 400)
    }
    this.commonService.getAssetcatagory().subscribe(res => {
      if (res.statusCode) {
        this.assetNameData = res.results;
      }
    });
    this.commonService.getAllUser().subscribe(res => {
      if(res.statusCode){
        this.staffNameData = res.results;
      }
    })
    this.commonService.getAssetNamelist().subscribe(res => {
      this.assetAllNamelist = res.results;
    });
    this.workflowService.getAllItemMaster().subscribe(res => {
      this.itemMasterListData = res.results;
    });
    this.lookupTermService.getAppTermsLinkWrapper('RQT-CSSD').subscribe(res => {
      if(res){
        this.surgerycalSetList = res?.RequestStatus ?? [];
      }
    })
  }

  getConfigData() {
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if (res.results != null) {
         this.configData = res.results.contentObject;
        if (!this.configData?.hasOwnProperty('otScheduleBook')) {
          this.otScheduleConfig = false;
        } else {
          this.otScheduleConfig = this.configData?.otScheduleBook;
          if (!this.otScheduleConfig) {
            this.getConfigChangesData();
          }
        }
      } else {
        this.otScheduleConfig = false;
      }
    });
  }

  getConfigChangesData() {
    if (this.managePatientForm) {
      ['scheduleDate', 'surgeryId', 'locationId', 'endTime'].forEach(field => {
        const control = this.managePatientForm.get(field);
        control?.clearValidators();
        control?.setErrors(null);
        control?.updateValueAndValidity();
      });
    }
    if (!this.data.id) {
      let currentDate = this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm');
      this.managePatientForm?.controls['scheduleDate'].setValue(currentDate);
    }
  }

  private setupCountryCodeAutocomplete(): void {
    const control = this.managePatientForm.get('countryCode');
    this.countryOptions = control?.valueChanges.pipe(
      startWith(control?.value || ''),
      map(value => this.filterCountryCodes(value || ''))
    );
  }

  private filterCountryCodes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.countrycodeList.filter(country =>
      country.code.toLowerCase().includes(filterValue)
    );
  }

  getConfig(){
    this.commonService.getConfigFile('enroll-patient').subscribe(res => {
      if (res.results != null) {
        this.enrollPatientConfig = res.results.contentObject;
        if(this.enrollPatientConfig != null) {
          let mandatoryFields = this.enrollPatientConfig.mandatoryFields;
          for(let i in mandatoryFields) {
            this.managePatientForm.get(mandatoryFields[i]).setValidators(Validators.required);
            this.managePatientForm.get(mandatoryFields[i]).updateValueAndValidity();
          }
        }
      }
    });
  }
  onTabChange(event) {
    this.selectedSubTab = event.tab.textLabel;
    if(this.selectedSubTab === 'Consumables') {
      this.workflowService.getAllItemMaster('IT-CON').subscribe(res => {
        if (res.statusCode === 1) {
          this.consumableData = res.results.filter(x => x.name != null);
        }
      })
    }
    if(this.selectedSubTab === 'Implants') {
      this.workflowService.getAllItemMaster('IT-IMP').subscribe(res => {
        if (res.statusCode === 1) {
          this.implantData = res.results.filter(x => x.name != null);
        }
      })
    }
    if(this.selectedSubTab === 'Surgical Sets') {
      this.lookupTermService.getAppTermsWrapper('SurgicalSets').subscribe(res => {
        if (res) {
            this.sterlieSetList = res?.SurgicalSets ?? [];
        }
      })
    }
  }

  getOverallPatient(id, visitType, visitEvent, visitEventId?: any, isModified?: boolean) {
    this.onLoading = true;
    this.commonService.getAllpatientDetailedList(id, visitType, visitEvent, visitEventId, null, isModified).subscribe(res => {
      this.onLoading = false;
      if(res.statusCode === 1) {
        if(res.results?.length > 1) {
          this.patientdata = this.checkedData;
          const mobileres = this.parseMobileNumber(this.patientdata?.mobileNumber);
          this.patientdata.mobileNumber = mobileres?.mobileNumber;
        } else {
          this.patientdata = res.results[0];
          const mobileres = this.parseMobileNumber(this.patientdata?.mobileNumber);
          this.patientdata.mobileNumber = mobileres?.mobileNumber;
        }
        if(this.data) {
          this.data.patientId = this.patientdata.patientId;
          if(this.activate_btn.includes('BT_OTS')) {
            if(this.patientdata.hasOwnProperty('otProcedures') && this.patientdata?.otProcedures?.length > 0) {
              this.patientdata?.otProcedures.forEach(x => {
                this.surgeryIdList.push(x.otProcedureId);
                this.surgeryName.push(x.otProcedureName);
              })
            }
          }
          if (this.patientdata.otProcedureNames) {
            const surgeryName = this.patientdata?.otProcedureNames;
            this.commonService.getOTProcedure(surgeryName).subscribe(res => {
              this.surgeryList = res.results;
              this.managePatientForm.get('surgeryId').setValue(surgeryName);
              setTimeout(() => {this.surgeryList = [] }, 1000)
            });
          }
        }
        this.buildForm()
        this.managePatientForm.controls['surgeryId'].setValue(this.surgeryName)
      } else if(this.data.hasOwnProperty('id')) {
        this.data.patientId = this.data.id;
        this.patientdata = this.data;
        const mobileres = this.parseMobileNumber(this.patientdata?.mobileNumber);
        this.patientdata.mobileNumber = mobileres?.mobileNumber;
        this.ispastDatainfo = true;
        this.buildForm()
      }
    })
    setTimeout(() => {this.updatedValidation()},500)
  }
  getOverallPastData(data){
    this.ispastDatainfo = true;
    let mobileNumberRes = this.parseMobileNumber(this.data.mobileNo)
    this.managePatientForm.controls['firstName'].setValue(data.firstName);
    this.managePatientForm.controls['middleName'].setValue(data.middleName);
    this.managePatientForm.controls['lastName'].setValue(data.lastName);
    this.managePatientForm.controls['mobileNo'].setValue(mobileNumberRes.mobileNumber);
    this.managePatientForm.controls['birthDate'].setValue(data.birthDate);
    this.managePatientForm.controls['countryCode'].setValue(mobileNumberRes.countryCode)
    this.managePatientForm.controls['gender'].setValue(data.gender);
    this.managePatientForm.controls['doctorId'].reset();
    this.managePatientForm.controls['surgeryId'].reset();
    this.managePatientForm.controls['tagID'].reset();
    this.managePatientForm.controls['locationId'].reset();
    this.managePatientForm.controls['emergencyType'].reset();
    this.managePatientForm.controls['scheduleDate'].reset();
    this.managePatientForm.controls['endTime'].reset();
    let currentDate = this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm')
    this.managePatientForm.controls['scheduleDate'].setValue(currentDate);
    this.managePatientForm.controls['patientStatusId'].setValue('VS-SH');
    const updatedValidationData = [
      this.managePatientForm.get('mobileNo'),
      this.managePatientForm.get('countryCode'),
      this.managePatientForm.get('firstName'),
    ];
    updatedValidationData.forEach(control => {
      if (control) {
        control.updateValueAndValidity();
        control.markAsTouched();
      }
    });
    
    if (!this.otScheduleConfig || !this.activate_btn.includes('BT_OTS')) {
      this.getConfigChangesData();
    }
  }
  parseMobileNumber(mobileNo: string): { countryCode: string, mobileNumber: string } {
    if (!mobileNo) {
      return { countryCode: null, mobileNumber: null };
    }

    // Remove multiple spaces and trim
    const cleaned = mobileNo.replace(/\s+/g, ' ').trim();

    // Split by space or dash
    const parts = cleaned.split(/[\s-]+/);

    let countryCode = '';
    let mobileNumber = '';

    if (parts.length > 1) {
      // Check if first part has '+'
      if (parts[0].startsWith('+')) {
        countryCode = parts[0];
      } else {
        // No '+', assume it’s numeric and add '+'
        countryCode = '+' + parts[0];
      }

      // Second part → mobile number
      if (parts[1] && parts[1].trim() !== '') {
        mobileNumber = parts[1].trim();
      }
    } else {
      // Only one part → assume default +91
      countryCode = '+91';
      mobileNumber = parts[0];
    }

    return { countryCode, mobileNumber };
  }


  updatedValidation() { 
    Object.keys(this.managePatientForm.controls).forEach(key => {
      this.managePatientForm.controls[key].updateValueAndValidity();
    });
    this.managePatientForm.markAllAsTouched();
  }

  public buildForm() {
    this.managePatientForm = this.form.group({
      patientTWID: [this.patientdata?.mainidentifier ? this.patientdata.mainidentifier : null],
      firstName: [this.patientdata?.firstName ? this.patientdata.firstName : null, 
       [Validators.required, Validators.pattern("^(?=.*[A-Za-z])[A-Za-z\\s'.]+$")]],    
      middleName: [this.patientdata?.middleName ? this.patientdata.middleName : null,],
      lastName: [this.patientdata?.lastName ? this.patientdata.lastName : null,],
      mobileNo: [ this.patientdata?.mobileNumber ? this.patientdata.mobileNumber : null, [Validators.pattern(/^[0-9]{9,12}$/), Validators.maxLength(11), Validators.minLength(9)] ],
      countryCode: [ this.patientdata?.countryCode ? this.patientdata.countryCode : '+91', [Validators.pattern('^[+][0-9]{1,5}$'), Validators.maxLength(4), Validators.minLength(2)] ],
      birthDate: [this.patientdata?.birthDate ? this.patientdata.birthDate : null],
      gender: [this.patientdata?.gender ? this.patientdata.gender : null],
      doctorId: [this.patientdata?.doctorId ? this.patientdata.doctorName : null],
      surgeryId: [this.patientdata?.suergeryId ? this.patientdata.surgeryName : null, [Validators.required, this.validateSurgerySelection.bind(this)]],
      tagID: [this.patientdata?.tagId ? this.patientdata.tagId : null],
      scheduleDate: [this.patientdata?.scheduleStartTime ? this.patientdata.scheduleStartTime : null, Validators.required],
      locationId: [this.patientdata?.otLocationId ? this.patientdata.otLocationName : null, Validators.required],
      emergencyType: [this.patientdata?.surgeryTypeId ? this.patientdata.surgeryTypeId : null],
      endTime: [this.data?.endTime ? this.data?.endTime : null, Validators.required],      
      patientStatusId: [{value: this.patientdata?.visitStatusId ? this.patientdata?.visitStatusId : 'VS-SH', disabled: ['VS-CO','VS-CL'].includes(this.patientdata?.visitStatusId)}, Validators.required],      
      entityType : [null],
      entityName : [null],
      entityId : [null],
      consumableId: [null],
      consumableQuantity: [null, Validators.pattern(/^[1-9][0-9]*$/)],
      implantId: [null],
      implantQuantity: [null, Validators.pattern(/^[1-9][0-9]*$/)],
      surgicalSetId: [null],
      identifier: [null],
      statusIds : [null],
      delayScheduleStartTime: [this.data?.delayScheduleStartTime ? this.data?.delayScheduleStartTime : this.patientdata?.visitDate ? this.patientdata.visitDate : this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm')],
      delayScheduleEndTime: [this.data?.delayScheduleEndTime ? this.data?.delayScheduleEndTime : this.data?.endTime ? this.data?.endTime : null],
      delayStartReasonId: [this.data?.otDelayStartReasonId ? this.data?.otDelayStartReasonId : null],
      delayStartRemarks: [this.data?.delayStartRemarks ? this.data?.delayStartRemarks : null],
      delayEndReasonId: [this.data?.otDelayEndReasonId ? this.data?.otDelayEndReasonId : null],
      delayEndRemarks: [this.data?.delayEndRemarks ? this.data?.delayEndRemarks : null],
      delayStartTime: [this.data?.delayStartTime ? this.data?.delayStartTime : null, [Validators.maxLength(5),Validators.pattern(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)]],
      delayEndTime: [this.data?.delayEndTime ? this.data?.delayEndTime : null, [Validators.maxLength(5),Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      setQuantity: [null,Validators.pattern(/^[1-9][0-9]*$/)]
    });
    this.locEntityBookingId = this.patientdata?.otLocationId;
    this.locEntityBookingName = this.patientdata?.otLocationName;
     if (this.data.id && this.activate_btn.includes('BT_OTS') && (!this.configData?.hasOwnProperty('otScheduleBook') || !this.otScheduleConfig)) {
        this.getConfigChangesData();
        this.otScheduleConfig = false;
      }
  }
  

   private validateSurgerySelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.surgeryList || this.surgeryList.length === 0) {
        return { invalidSurgery: true};
      }
      let selectedSurgery = this.surgeryList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedSurgery) {
        return { invalidSurgery: true };
      }
    }
    return null;
  }

  validateEntitySelection(event) {
    if (event === 'doctor') {
      const control = this.managePatientForm.get('doctorId')
      if (!control) return;
      const doctorValue = control.value;
      const isValid = this.doctorList.some(item => item.id === doctorValue);
      if (!isValid && this.patientdata?.doctorId) {
        control.setValue(this.patientdata.doctorId);
      } else if (!isValid) {
        control.setValue(null);
      }
    } else if (event === 'location') {
      const control = this.managePatientForm.get('locationId');
      if (!control) return;
      const locationValue = control.value;
      const isValid = this.locationList?.some(item => item.id === locationValue);
      if (!isValid && this.patientdata?.otLocationId) {
        control.setValue(this.patientdata.otLocationId);
      } else if (!isValid) {
        control.setValue(null);
      }
    } else if (event === 'tag') {
      const control = this.managePatientForm.get('tagID')
      if (!control) return;
      const tagValue = control.value;
      const isValid = this.tagList?.some(item => item.tagId === tagValue);
      if (!isValid && this.patientdata?.tagId) {
        control.setValue(this.patientdata.tagId);
      } else if (!isValid) {
        control.setValue(null);
      }
    }
  }

  displayDoctorName = (L: number): string => {
    if (!this.doctorList || this.doctorList.length === 0) {
      return this.patientdata?.doctorName ?? '';
    }
    const doctor = this.doctorList.find(a => a.id === L);
    return doctor ? doctor.name : this.patientdata?.doctorName ?? '';
  };

  displayLocationName = (L: number): string => {
    if (!this.locationList || this.locationList.length === 0) {
      return L === null ? '' : this.patientdata?.otLocationName ?? '';
    }
    const location = this.locationList.find(a => a.id === L);
    return location ? location.name : this.patientdata?.otLocationName ?? '';
  };

  eventAction(event){
    if(event.key === 'delete'){
       this.deleteAlertNofication(event.data);
     } else if(event.key === 'manage') {
      this.editManageSchedule(event.data);
     } else if(event.key === 'calendar') {
      this.getCalendar(event.data);
     } else if(event.key === 'overlap') {
      this.menuOpenData(event.data);
     } else if(event.key === 'scheduleAllow') {
      this.getCalendar(event.data)
     }
   }

   menuOpenData(event){
    const index = this.dataSource.findIndex(f => f.entityId === event.entityId);
        if (index !== -1) {
          this.dataSource[index] = {
            ...this.dataSource[index],
            isWarning: true
          };
          this.isCanbeDisabled = false;
          const bookedData = this.dataSource.filter(item => item.canBeBooked === false);
          if (bookedData.length) {
            const warningData = bookedData.filter(item => !item.hasOwnProperty('isWarning'));
            if (warningData.length) {
              this.isCanbeDisabled = true;
            }
          }
        }
          this.dataSource = [...this.dataSource];
  }

  getOverLapData() {
    this.colorChangeData = true;
  }

  getOverLapLoc() {
    this.locEntityBooking = true;
    this.locChangeColor = true;
  }

  editManageSchedule(data){
    this.editDataInfo = data;
    this.departmentList = [];
    let entityNameStaff = [];
    let entityNameAsset = [];
    let entityNameConsumable = [];
    let entityNameImplant = [];
    let entityNameSet = [];
    let entityId = [];
    let entityType: any;
    entityType = this.resourcesList.find(x => x.name == data.entityType);
    if(data.entityId) {
      entityNameAsset = this.assetNameData?.filter(x => x.assetId === data.entityId);
      entityNameStaff = this.staffNameData?.filter(x => x.id === data.entityId);
    }
    if(data.entityType === 'Consumable' || data.entityType === 'Implant' || data.entityType === 'Sterlize') {
      if (data.entityType === 'Consumable') {
        entityNameConsumable = this.consumableData?.filter(x => x.id === data.entityId);
        entityId = this.consumableData?.filter(x => x.id === entityNameConsumable[0].id);
        this.consumableName = entityNameConsumable[0].name;
        this.managePatientForm.get('consumableId').setValue(entityId[0].id);
        this.managePatientForm.get('consumableQuantity').setValue(data.requestedQuantity);
        this.conDataSource = this.conDataSource.map(item => ({...item,isEditeDisable: true }));
        this.getItemName(entityNameConsumable, 'consumable', 'TW-EDT')
        this.conQuantityValidation()
      } else if (data.entityType === 'Implant') {
        entityNameImplant = this.implantData?.filter(x => x.id === data.entityId);  
        entityId = this.implantData?.filter(x => x.id === entityNameImplant[0].id);
        this.implantName = entityNameImplant[0].name;
        this.managePatientForm.get('implantId').setValue(entityId[0].id);
        this.managePatientForm.get('implantQuantity').setValue(data.requestedQuantity);
        this.impDataSource = this.impDataSource.map(item => ({...item,isEditeDisable: true }));
        this.getItemName(entityNameImplant, 'implant', 'TW-EDT')
        this.conQuantityValidation()
      } else if (data.entityType === 'Sterlize') {
        this.identifierIdList = [];
        const setEditeInfo = this.setSurgicalData.filter(x => x.code === data.entityCode);
        this.identifierIdList = setEditeInfo.map(item => ({ id: item.id, identifier: item.identifier }));
        if(data.entityId != null) {
          this.managePatientForm.get('identifier').setValue(data.entityId);
        }
        this.managePatientForm.get('surgicalSetId').setValue(data.entityCode);
        this.managePatientForm.get('statusIds').setValue(data.requestStatusCode);
        this.setDataSource = this.setDataSource.map(item => ({ ...item, isEditeDisable: true }));
      }
    } else {
      this.entityBookingId = data?.entityId;
      this.entityBookingName = data?.entityName;
      if (entityType.code === 'SE-AT') {
        if(data.entityId != null) {
          this.departmentList = this.assetCategory;
          entityId = this.departmentList?.filter(x => x.code === entityNameAsset[0].categoryId);
          this.managePatientForm.get('entityId').setValue(entityId[0].code);
        } else {
          this.departmentList = this.assetCategory;
          entityId = this.departmentList.find(x => x.name === data.roleCategory);
          this.managePatientForm.get('entityId').setValue(entityId['code']);
        }
      } else if (entityType.code === 'SE-UR' && data.entityId) {
        this.departmentList = this.roleList;
        entityId = this.departmentList?.filter(x => x.code === entityNameStaff[0].roles[0].roleCode);
        this.managePatientForm.get('entityId').setValue(entityId[0].code);
      } else {
        this.departmentList = this.roleList;
        const roleInFo = this.departmentList.find(f => f.name === data.roleCategory);
        this.staffTypeData = roleInFo.code;
        this.managePatientForm.controls['entityId'].setValue(roleInFo.code)
      }
      this.managePatientForm.get('entityType').setValue(entityType.code);
      if (entityNameAsset.length) {
        if (data.entityDelete === true && data.editeDelete === undefined  && !this.assetCatagoryEnabled && !data.entityId) {
          this.managePatientForm.get('entityName').setValue(entityNameAsset[0].assetId);
        } else {
          this.assetCatagoryEnabled = false;
          setTimeout(()=>{this.managePatientForm.get('entityName').setValue(entityNameAsset[0].assetName)},100 )  
        }
      } else if (data.entityDelete === true && data.editeDelete === undefined && !this.staffListEnable && !data.entityId) {
        this.managePatientForm.get('entityName').setValue(entityNameStaff[0].id);
      } else if (data.entityId){
        this.staffListEnable = false;
        this.managePatientForm.get('entityName').setValue(entityNameStaff[0].firstName);
      }
      this.dataSource = this.dataSource.map(item => ({...item,isEditeDisable: true }));
    }
   }
  deleteAlertNofication(data) {
    if (data.hasOwnProperty('entityDelete') && !data.entityDelete) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirm Delete', message: 'Are you sure you want to delete?',
          buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        if (res.confirmButtonText === 'Yes') {
          if(this.selectedSubTab === 'Consumables') {
            this.conDataSource = this.conDataSource.filter(item => item !== data);
            this.conDataSource = [...this.conDataSource];
            let deleteConSchedule = {
              entityType: data.entityType,
              entityId: data.entityId,
              entityName: data.entityName,
              requestedQuantity: data.requestedQuantity,
              requestId: data.requestId,
              requestType: data.requestType,
              deleted: true,
              id: data.id ?  data.id : null
            }
            this.deleteConSchedule.push(deleteConSchedule);
            this.conDataSource.push(deleteConSchedule);
            this.conDataSource = this.conDataSource.filter(x => x.deleted != true);
          } else if(this.selectedSubTab === 'Implants') {
            this.impDataSource = this.impDataSource.filter(item => item !== data);
            this.impDataSource = [...this.impDataSource];
            let deleteImpSchedule = {
              entityType: data.entityType,
              entityId: data.entityId,
              entityName: data.entityName,
              requestedQuantity: data.requestedQuantity,
              requestId: data.requestId,
              requestType: data.requestType,
              deleted: true,
              id: data.id ? data.id : null
            }
            this.deleteImpSchedule.push(deleteImpSchedule);
            this.impDataSource.push(deleteImpSchedule);
            this.impDataSource = this.impDataSource.filter(x => x.deleted != true);
          } else if(this.selectedSubTab === 'Surgical Sets') {
            this.setDataSource = this.setDataSource.filter(item => item !== data);
            this.setDataSource = [...this.setDataSource];
            let deleteSetSchedule = {
              entityType: data.entityType,
              entityCode: data.entityCode,
              entityName: data.entityName,
              entityId: data.entityId ? data.entityId : null,
              requestStatusCode: data.requestStatusCode ? data.requestStatusCode : null,
              requestStatusValue: data.requestStatusValue ? data.requestStatusValue : null,
              requestId: data.requestId ? data.requestId : null,
              requestType: data.requestType ? data.requestType : null,
              deleted: true,
              id: data.id ?  data.id : null
            }
            this.deleteSetSchedule.push(deleteSetSchedule)
            this.impDataSource.push(deleteSetSchedule);
            this.impDataSource = this.impDataSource.filter(x => x.deleted != true);
          } else {
            this.dataSource = this.dataSource.filter(item => item !== data);
            const bookedData = this.dataSource.filter(item => item.canBeBooked === false);
            if (!bookedData.length) {
              this.isCanbeDisabled = false;
            }
            this.dataSource = [...this.dataSource];
            this.deleteSchedule = {
              entityType: data.entityType,
              entityId: data.entityId,
              entityName: data.entityName,
              roleCategory: data.roleCategory,
              roleCode: data.roleCode ? data.roleCode : null,
              deleted: true,
              id: data.id ?  data.id : null
            }
            this.dataSource.push(this.deleteSchedule);
            this.dataSource = this.dataSource.filter(x => x.deleted != true);
          }
        }
      })
    } else {
      if(this.selectedSubTab === 'Consumables') {
        this.conDataSource = this.conDataSource.filter(item => item !== data);
      } else if(this.selectedSubTab === 'Implants') {
        this.impDataSource = this.impDataSource.filter(item => item !== data);
      } else if(this.selectedSubTab === 'Surgical Sets') {
        this.setDataSource = this.setDataSource.filter(item => item !== data);
      } else {
        this.dataSource = this.dataSource.filter(item => item !== data);
      }
    }
    this.conDataSource = [...this.conDataSource];
    this.impDataSource = [...this.impDataSource];
    this.setDataSource = [...this.setDataSource];
    this.dataSource = [...this.dataSource];
  }
  OnResourceTypeChange(id) {
    this.entityBooking = true;
    if (id) {
      if (id === 'SE-AT') {
        const filterAssetCategory = this.assetCategory.find(x =>  x.code == 'ASC-BM' );
        this.departmentList = this.assetCategory;
        this.catagoryData = 'ASC-BM'
        this.managePatientForm.get('entityId').setValue(filterAssetCategory?.code);
      } else if (id === 'SE-UR') {
        this.departmentList = this.roleList;
      }
      this.managePatientForm.controls['entityName'].reset();
    }
    this.assetCatagoryData = [];
    this.entityBookingId = null;
    this.entityBookingName = null;
  }
  onSubTypeChange(event) {
    this.entityBookingId = null;
    this.entityBookingName = null;
    this.entityBooking = true;
    if (this.allowedCodes.includes(event)) {
      this.staffTypeData = event;
    } else {
      this.catagoryData = event;
    }
    this.staffListData = [];
    this.assetCatagoryData = [];
    this.managePatientForm.controls['entityName'].reset();
  }
  UpdateResourceData(data?){  
    let scheduletype: any = [];
    this.isActiveTable = true;
    if (data != null) {
      scheduletype = data.eventDetails?.filter(x => x.entityType !== 'ot_procedure');
    } else {
      scheduletype = this.data.eventDetails?.filter(x => x.entityType !== 'ot_procedure');
    }
    if(scheduletype) {
      const tableConsumable = scheduletype?.filter(x => x.entityType === 'Consumable');
      const tableImplant = scheduletype?.filter(x => x.entityType === 'Implant');
      const tableSet = scheduletype?.filter(x => x.entityType === 'Sterlize');
      const tableResource = scheduletype?.filter(x => x.entityType === 'User' || x.entityType === 'Asset');
      if (tableResource.length) {
        const updateScheduleData = tableResource?.map(x => ({
          entityType: x.entityType,
          entityId: x.entityId,
          entityName: x.entityName,
          roleCategory: x.roleCode !== null ? x.roleName : x.assetCategoryName,
          roleCode : x.roleCode ? x.roleCode : null, 
          entityDelete: false,
          id: x.id,
          canBeBooked: x.entityName && (x.roleName || x.assetCategoryName) ? true : null,
        }));
        this.dataSource = [...updateScheduleData];
      } else {
        this.dataSource = [];
      }
      if (tableConsumable.length) {
        const updateConsumableData = tableConsumable?.map(x => ({
          entityType: x.entityType,
          entityId: x.entityId,
          entityName: x.entityName,
          requestedQuantity: x.count,
          requestDateTime: x.requestDateTime,
          allocatedQuantity: x.allocatedQuantity,
          requestStatusValue: x.requestStatusValue,
          deliveredDateTime: x.deliveredDateTime,
          requestId: x.requestId,
          requestType: x.requestType,
          entityDelete: false,
          id: x.id
        }));
        this.conDataSource = [...updateConsumableData];
      } else {
        this.conDataSource = [];
      }
      if (tableImplant.length) {
        const updateImplantData = tableImplant?.map(x => ({
          entityType: x.entityType,
          entityId: x.entityId,
          entityName: x.entityName,
          requestedQuantity: x.count,
          requestDateTime: x.requestDateTime,
          allocatedQuantity: x.allocatedQuantity,
          requestStatusValue: x.requestStatusValue,
          deliveredDateTime: x.deliveredDateTime,
          requestId: x.requestId,
          requestType: x.requestType,
          entityDelete: false,
          id: x.id
        }));
        this.impDataSource = [...updateImplantData];
      } else {
        this.impDataSource = [];
      }
      if (tableSet.length) {
        const selectedCode = tableSet.map(item => item.entityCode);
        this.commonService.getSterlieSetList(null, null, null, null, selectedCode).subscribe(res => {
          if (res.results) {
            this.setSurgicalData = res.results;
            const updateSetData = tableSet.map(x => {
              return {
                entityType: x.entityType,
                entityId: x.entityId ? x.entityId : null,
                entityCode: x.entityCode,
                entityName: x.entityName,
                requestStatusValue: x.requestStatusValue,
                requestStatusCode: x.requestStatusCode,
                requestId: x.requestId,
                requestType: x.requestType,
                entityDelete: false,
                id: x.id
              };
            })
            this.setDataSource = [...updateSetData];
          }
        })
      } else {
        this.setDataSource = [];
      }
    }
  }
  addResource() {
    this.isActiveTable = true;
    let scheduleData : any;
    const selectedType = this.managePatientForm.get('entityType')?.value;
    const eventDataId = this.managePatientForm.get('entityName')?.value;
    const eventId = this.managePatientForm.get('entityId')?.value;
    if(typeof eventDataId === 'string'){
      if (selectedType !== 'SE-AT') {
        this.scheduleInfoList = this.staffNameData?.filter(x => x.firstName === eventDataId).map(item => ({...item, name : item.firstName}));
        this.departmentList = this.roleList?.filter(x => x.code === eventId)
      } else {
        this.scheduleInfoList = this.assetNameData?.filter(x => x.assetName === eventDataId).map(item => ({...item, name : item.assetName, id : item.assetId}));
        this.departmentList = this.assetCategory?.filter(x => x.code === eventId );
      }
    } else {
      if (selectedType !== 'SE-AT') {
        this.scheduleInfoList = this.staffListData?.filter(x => x.id === eventDataId);
        this.departmentList = this.roleList?.filter(x => x.code === eventId);
        this.assetCatagoryEnabled = true;
      } else {
        this.scheduleInfoList = this.assetCatagoryData?.filter(x => x.id === eventDataId);
        this.departmentList = this.assetCategory?.filter(x => x.code === eventId );
        this.staffListEnable = true;
      }
    }
    if (eventDataId) {
      const typeName = this.resourcesList.find(item => item.code === selectedType)?.name || '';
      if (typeof eventDataId === 'string') {
        scheduleData = {
          entityType : typeName,
          entityId : selectedType == 'SE-AT' ? this.scheduleInfoList[0]?.id : this.scheduleInfoList[0]?.id,
          entityName :  selectedType == 'SE-AT' ? this.scheduleInfoList[0]?.name : this.scheduleInfoList[0]?.name,
          roleCategory:  selectedType == 'SE-AT' ? this.departmentList[0]?.value : this.departmentList[0].name,
          roleCode :  selectedType != 'SE-AT' ? this.departmentList[0].code : null,
          entityDelete : this.editDataInfo?.entityDelete == false ? false : true,
          canBeBooked : this.scheduleInfoList.includes('canBeBooked') && this.scheduleInfoList ?  this.scheduleInfoList[0]?.canBeBooked  : this.editDataInfo?.canBeBooked
        }    
      } else {
        scheduleData = {
          entityType : typeName,
          entityId : selectedType == 'SE-AT' ? this.scheduleInfoList[0]?.id : this.scheduleInfoList[0]?.id,
          entityName :  selectedType == 'SE-AT' ? this.scheduleInfoList[0]?.name : this.scheduleInfoList[0]?.name,
          roleCategory:  selectedType == 'SE-AT' ? this.departmentList[0]?.value : this.departmentList[0].name,
          roleCode :  selectedType != 'SE-AT' ? this.departmentList[0].code : null,
          entityDelete : this.editDataInfo?.entityDelete == false ? false : true,
          canBeBooked : this.scheduleInfoList ?  this.scheduleInfoList[0]?.canBeBooked  : this.editDataInfo?.canBeBooked
        }    
      }
      if (this.colorChangeData && !this.entityBooking) {
       scheduleData = {...scheduleData, isWarning: true };
      }
      if (this.editDataInfo !== null && this.editDataInfo != undefined) {
        const index = this.dataSource.findIndex(x => x.entityId === this.editDataInfo.entityId);
        if (index !== -1) {
          if ( this.editDataInfo.hasOwnProperty('canBeBooked') && !this.editDataInfo.canBeBooked && this.editDataInfo.entityId === scheduleData.entityId) {
            this.dataSource[index] = { ...scheduleData, canBeBooked: false };
            this.dataSource = this.dataSource.map(({ isEditeDisable, ...rest }) => rest);
            this.dataSource = [...this.dataSource];
          } else {
            this.dataSource[index] = scheduleData;
            this.dataSource = this.dataSource.map(({ isEditeDisable, ...rest }) => rest);
            this.dataSource = [...this.dataSource];
          }
        } 
        this.editDataInfo = null
      } else {
        this.dataSource.push(scheduleData);
        this.dataSource = this.dataSource.map(({ isEditeDisable, ...rest }) => rest);
        this.dataSource = [...this.dataSource];
      }
      this.staffListData = [];
      this.assetCatagoryData = [];
      this.entityBookingId = null;
      this.entityBookingName = null;
      this.colorChangeData = false;
      this.entityBooking =  true;
      this.managePatientForm.controls['entityType'].reset();
      this.managePatientForm.controls['entityId'].reset();
      this.managePatientForm.controls['entityName'].reset();
    }
  }
  searchAsset(event, category) {
    this.entityBookingId = null;
    this.entityBookingName = null;
    if(category == null && category == undefined){
      const categoriesType = this.managePatientForm.controls['entityId'].value;
      category = categoriesType;
    }
    const fromDate = this._dateFormat.transform(this.managePatientForm.controls['scheduleDate']?.value, "YYYY-MM-dd HH:mm:ss");
    const todate = this._dateFormat.transform(this.managePatientForm.controls['endTime']?.value, "YYYY-MM-dd HH:mm:ss");
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.searchEntityAvailablity(category, 'asset', fromDate, name, '', todate).subscribe(res => {
        const dataTableAsset = this.dataSource.map(x => x.entityId);
        if (dataTableAsset.length) {
          this.assetCatagoryData = res.results.filter(x => !dataTableAsset.includes(x.id));
        } else {
          this.assetCatagoryData = res.results;
        }
        this.assetCatagoryEnabled = true;
      })
    } else {
      this.assetCatagoryData = [];
    }
  }
  getAssetList(type, id) {
    if (id) {
      const catagory = this as any as { id: string, name: string }[];
      const asset = catagory.find(obj => obj.id === id);
      return asset ? asset.name : '';
    } else {
      return '';
    }
  }
  getStaffList(type, id) {
    if (id) {
      const doctors = this as any as { id: string, name: string }[];
      return doctors.find(obj => obj.id === id)?.name;
    } else {
      return '';
    }
  }
  staffListInfo(event, type) {
    this.entityBookingId = null
    this.entityBookingName = null;
    if(type == null && type == undefined){
      const categoriesType = this.managePatientForm.controls['entityId'].value;
      type = categoriesType;
    }
    const fromDate = this._dateFormat.transform(this.managePatientForm.controls['scheduleDate']?.value, "YYYY-MM-dd HH:mm:ss");
    const toDate = this._dateFormat.transform(this.managePatientForm.controls['endTime']?.value, "YYYY-MM-dd HH:mm:ss");
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.searchEntityAvailablity(null, 'user', fromDate, name, type, toDate).subscribe(res => {
        const dataTableStaff = this.dataSource.map(x => x.entityId);
        if (dataTableStaff.length) {
          this.staffListData = res.results.filter(x => !dataTableStaff.includes(x.id));
        } else {
          this.staffListData = res.results;
        }
        this.staffListEnable = true;
      });
    }
    else {
      this.doctorList = [];
    }
  }
  checkEntityBooking(event) {
    this.entityBookingId = event.id; 
    this.entityBookingName = event.name;
    if(event?.canBeBooked) {
      this.entityBooking = true;
    } else {
      this.entityBooking = false;
    }
  }
  checkLoctionEntityBooking(data) {
    this.locEntityBookingId = data.id; 
    this.locEntityBookingName = data.name;
    if(data?.canBeBooked) {
      this.locEntityBooking = true;
    } else {
      this.locEntityBooking = false;
    }
  }
  getCalendar(data?: any, calType?: any, event?: any) {
    let categoryList = [];
    let category = null;
    console.log(data)
    if(!data && !calType) {
      categoryList = this.departmentList?.filter(x => x.code === this.managePatientForm.get('entityId')?.value);
      category = categoryList?.length !== 0 ? categoryList[0]?.name : null;
    }
    const type = data ? (data?.entityType === 'SE-UR' || data?.entityType === 'SE-SF' || data?.entityType === 'User' ? 'RT-US' : data?.entityType === 'SE-AT' || data?.entityType === 'Asset' ? 'Asset' : 'Location') :
      (calType && calType === 'location' ? 'Location' : this.managePatientForm.get('entityType')?.value === 'SE-UR' || this.managePatientForm.get('entityType')?.value === 'SE-SF' || 
      this.managePatientForm.get('entityType')?.value === 'User' ? 'RT-US' : this.managePatientForm.get('entityType')?.value === 'SE-AT' || this.managePatientForm.get('entityType')?.value === 'Asset' ? 'Asset' : 'Location');
    const calendarData = {
      "entityId": data ? data?.entityId : (calType && calType === 'location' ? this.locEntityBookingId  : this.managePatientForm.get('entityName')?.value),
      "entityType": 'CAL-OT',
      "entityName": data ? data?.entityName : (calType && calType === 'location' ? this.locEntityBookingName : this.entityBookingName),
      'fromDate': this._dateFormat.transform(this.managePatientForm.controls['scheduleDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      'toDate': this._dateFormat.transform(this.managePatientForm.controls['endTime'].value, 'yyyy-MM-dd HH:mm:ss'),
      'fromTime': null,
      'toTime': null,
      'status': 'CAL-TL',
      'options': {},
      'refresh': null,
      'resourseType':  type,
      'resourseCategory':  type !== 'Asset' && type !== 'Location' ? data ? data?.roleCategory : category : type,
      'roleCode':  data ? data?.roleCode : this.managePatientForm.get('entityId')?.value,
      'entityIcon': type === 'Asset' ? 'SMW_asset_management' :  type === 'Location' ? 'SMH_manage_location' : 'SMR_staff_report'
    }
    if(calType) {
      event.stopPropagation();
       this.locAutoComplete.closePanel();
    }
    const dialogRef = this.dialog.open(CalendarComponent, { data: calendarData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onStatusChange(event) {
    if (event === 'VS-CL') {
      if (this.patientdata?.visitStatusId === 'VS-SH') {
        const id = this.data.visitEventId;
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['mdm-Confirmation-popup'],
          disableClose: true,
          data: {
            title: 'Cancel Surgery Schedule',
            message: 'Are you sure you want to cancel the surgery schedule?',
            buttonText: { cancel: 'No', ok: 'Yes' },
            status: 'RQ-SC',
            scheduleCancelRequest: true,
            isRemark: 1,
            visitId: id,
          },
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result === 'confirm') {
            this.dialog.closeAll()
          } else {
            this.managePatientForm.get('patientStatusId').setValue(this.patientdata.visitStatusId)
          }
        });
      } else {
        this.toastr.error('<span class = \'ovi-font-family\' style=\'font-size:16px;\'>Only the scheduled content will be canceled.</span>');
        this.managePatientForm.get('patientStatusId').setValue(this.patientdata.visitStatusId)
      }
    }
  }

  selectOnChangeSurgery(id){
    this.surgeryIdList = [];
      this.surgeryIdList.push(id);
      this.managePatientForm.controls['surgeryId'].setValue(id);
      setTimeout(() => {this.surgeryList = []}, 1000);
  }
  setEndTime(data) {
    if (data?.surgerySla && data?.surgerySla !== null) {
      this.surgerySla = data?.surgerySla;
      const startDate = new Date(this.managePatientForm.controls['scheduleDate'].value);
      const endTime = this._dateFormat.transform(new Date(startDate.getTime() + (this.surgerySla * 60000)), 'yyyy-MM-dd HH:mm:ss')
      this.managePatientForm.controls['endTime'].setValue(endTime);
      const obj = `${this.surgeryIdList[0]}`;
      const surId = this.managePatientForm.controls['surgeryId'].value;
      if (obj !== surId) {
        this.surgeryList = [];
        this.dataSource = [];
        this.conDataSource = [];
        this.impDataSource = [];
        this.setDataSource = [];
      }
      this.isCanbeDisabled = false;
      this.getPageTemplete(data.id, startDate, endTime);

    }
  }

  selectOnChangeLocation(id){
    this.managePatientForm.controls['locationId'].setValue(id);
  }
  onScheduleChange(event){
    const inputElement = event.target as HTMLInputElement;
    const selectedDateTime = inputElement.value;
    this.managePatientForm.controls['scheduleDate'].setValue(selectedDateTime);
    const startDate = new Date(this.managePatientForm.controls['scheduleDate'].value);
    const endTime = this._dateFormat.transform(new Date(startDate.getTime() + (this.surgerySla * 60000)), 'yyyy-MM-dd HH:mm:ss')
    this.managePatientForm.controls['endTime'].setValue(endTime);
    this.locEntityBooking = true;
    this.locationList = [];
    if(startDate && endTime && !this.data.id){
      this.dataSource = [];
      this.conDataSource = [];
      this.impDataSource = [];
      this.setDataSource = [];
      this.isCanbeDisabled = false;
      this.managePatientForm.controls['locationId'].reset();
      if (this.surgeryIdList.length){
        this.getPageTemplete(this.surgeryIdList, startDate, endTime);
      }
    } else if (this.surgeryIdList.length && startDate && endTime && this.data.id) {
      let fromDate = this._dateFormat.transform(startDate, 'yyyy-MM-dd HH:mm:ss');
      let toDate = this._dateFormat.transform(endTime, 'yyyy-MM-dd HH:mm:ss');
      let locationName = this.managePatientForm.controls['locationId'].value?.split(',')[0];
      if (locationName !== null) {
        this.commonService.searchEntityAvailablity('LC_OT', 'location', fromDate, locationName, '', toDate).subscribe(res => {
          if (res.statusCode === 1) {
            this.checkLoctionEntityBooking(res.results[0])
          }
        });
      }
      if (this.dataSource.length) {
       this.getDataSourceValidation(startDate, endTime);
      }
    }
  }

  getDataSourceValidation(startDate, endTime) { 
    let fromDate = this._dateFormat.transform(startDate, 'yyyy-MM-dd HH:mm:ss');
    let toDate = this._dateFormat.transform(endTime, 'yyyy-MM-dd HH:mm:ss');
    if (this.dataSource.length ) { 
      const groupedEntities: { [key: string]: number[] } = {};
      this.dataSource.forEach(item => {
        if (!groupedEntities[item.entityType]) {
          groupedEntities[item.entityType] = [];
        }
        groupedEntities[item.entityType].push(item.entityId);
      });
      const entities = Object.entries(groupedEntities).map(([entityType, entityIds]) => ({
        entityType,
        entityIds
      }));
      const entityData = {
        entities,
        fromDateTime: fromDate,
        identifyingType: null,
        toDateTime: toDate,
      };
      let userAssetData = this.dataSource;
      this.configurationService.checkEntityBooking(entityData).toPromise().then((res) => {
        if (res.statusCode === 1) {
          const allEntityValues = res.results?.filter(item => item.entityId)
          const validEntityIds = userAssetData.map(item => item.entityId);
          const matchedEntities = allEntityValues.filter(item => validEntityIds.includes(item.entityId));
          const uniqueById = Array.from(new Map(matchedEntities.map(item => [item.id, item])).values());
          if (uniqueById.length) {
            const entityIdsToUpdate = uniqueById.map((item: any) => item.entityId);
            this.dataSource = this.dataSource.map(item => {
              this.isCanbeDisabled = true;
              if (entityIdsToUpdate.includes(item.entityId) && item.canBeBooked === true) {
                return { ...item, canBeBooked: false };
              }
              return item;
            });
          }
        } else {
          this.dataSource = this.dataSource.map(item => ({ ...item, canBeBooked: true }));
          this.isCanbeDisabled = false;
        }
      })
    }
  }

  getErrorValidation() {
    const scheduleDate = this.managePatientForm.get('scheduleDate')?.value;
    const endTime = this.managePatientForm.get('endTime')?.value;
    if (endTime && scheduleDate) {
      const start = new Date(scheduleDate);
      const end = new Date(endTime);
      const endTimeControl = this.managePatientForm.get('endTime');
      if (end < start) {
        endTimeControl?.setErrors({ endBeforeStart: true });
      } else {
        const errors = endTimeControl?.errors;
        if (errors) {
          delete errors['endBeforeStart'];
          if (Object.keys(errors).length === 0) {
            endTimeControl?.setErrors(null);
          } else {
            endTimeControl?.setErrors(errors);
          }
        }
      }
    }
  }

  onChangeEndDate(event) {
    const startDate = this.managePatientForm.controls['scheduleDate'].value;
    const endTime = this._dateFormat.transform(this.managePatientForm.controls['endTime'].value, 'yyyy-MM-dd HH:mm:ss');
    if (this.surgeryIdList.length && startDate && endTime && !this.data.id) {
      this.dataSource = [];
      this.conDataSource = [];
      this.impDataSource = [];
      this.setDataSource = [];
      this.isCanbeDisabled = false;
      this.getPageTemplete(this.surgeryIdList, startDate, endTime);
    } else if (this.surgeryIdList.length && startDate && endTime && this.data.id) {
      this.getDataSourceValidation( startDate, endTime);
      this.getErrorValidation();
    }
  }

  getGenderType(data) {
    this.genderCode = data.code;
  }

  searchDoctor(event) {
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.searchDoctor(name, '', 'RO-DO,RO-CO,RO-SUR').subscribe(res => {
        this.doctorList = res.results;
        this.doctornameEnabled = true;
      });
    }
    else {
      this.doctorList = [];
    }
  }

  searchSurgeryList(event) {
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.getOTProcedure(name).subscribe(res => {
        this.surgeryList = res.results;
        this.surgeryEnabled = true;
      });
    } else {
      this.surgeryList = [];
      this.dataSource = [];
      this.conDataSource = [];
      this.impDataSource = [];
      this.setDataSource = [];
      this.managePatientForm.get('surgeryId').reset();
    }
  }

  searchTagList(event) {
    let id = event.text;
    if (id.length >= 2) {
      this.commonService.getAllTagByType(event.text, 'WF-OT', 'ST-AT').subscribe(res => {
        this.tagList = res.results;
        this.tagEnabled = true;
      });
    }
    else {
      this.tagList = [];
    }
  }

  searchLocationList(event) {
    const fromDate = this._dateFormat.transform(this.managePatientForm.controls['scheduleDate']?.value, "YYYY-MM-dd HH:mm:ss");
    const toDate = this._dateFormat.transform(this.managePatientForm.controls['endTime']?.value, "YYYY-MM-dd HH:mm:ss")
    let id = event.text;
    if (id.length >= 2) {
      this.commonService.searchEntityAvailablity('LC_OT', 'location', fromDate, id, '', toDate).subscribe(res => {
        this.locationList = res.results;
        this.locationEnabled = true;
        this.locChangeColor = false;
      })
    }
    else {
      this.locationList = [];
    }
  }

  getDoctorList(type, id) {
    if (id) {
      const doctors = this as any as { id: string, name: string }[];
      return doctors.find(obj => obj.id === id).name;
    } else {
      return '';
    }
  }

  getSurgeryList(type, val) {
    this.surgeryName = [];
    if (val) {
      const surgery = this as any as { id: string, name: string }[];
      return surgery.find(obj => obj.id === val).name;
    } else {
      return '';
    }
  }

  gettagList(type, id) {
    if (id) {
      const tag = this as any as { id: string, tagId: string }[];
      return tag.find(obj => obj.tagId === id).tagId;
    } else {
      return '';
    }
  }
  
  getLocationList(type, id) {
    if (id) {
      const location = this as any as { id: string, name: string }[];
      return location.find(obj => obj.id === id).name;
    } else {
      return '';
    }
  }

  getTagTypeId(tagTypeId) {
    this.tagTypeId = tagTypeId;
  }
  onChange(event, item) {
    if (event.checked === true) {
      if(item === this.checkedData) {
        this.checkedData['checked'] = false;
      }
      this.checkedData = item;
      this.getOTProcedureData(item);
    } else {
      this.checkedData = null;
      this.getOverallPastData(item);
      this.surgeryList = [];
      this.dataSource = [];
      this.conDataSource = [];
      this.impDataSource = [];
      this.setDataSource = [];
    }
  }

  onMainTabChange(event){
    this.selectedTabIndex = event?.index;
  }

  getUHID(value) {
    this.checkedData = null;
    const uhid = value;
    let visitData = null;
    const fromDate = this._dateFormat.transform(new Date(), "YYYY-MM-dd");
    this.commonService.getUHID(uhid,null,'VE-OT',null,'VT-IP').subscribe(res => {
      if (res.statusCode !== 0) {
        this.data = res.results;
        if (this.data !== null && this.data?.patientVisitId) {
          this.onLoading = true;
          this.commonService.getAllpatientDetailedList(this.data.id, 'VT-IP', 'VE-OT', null, fromDate).subscribe(res => {
            this.onLoading = false;
            if (res.statusCode === 1) {
              if(res.results?.length >= 1) {
                this.isEnabledTable = true;
                this.MPDataSource = new MatTableDataSource(res.results);
                if(res.results?.length == 1) {
                  this.checkedData = res.results[0];
                  this.getOTProcedureData(res.results[0]);
                }
              } else {
                this.isEnabledTable = false;
                visitData = res.results[0];
                this.getOTProcedureData(visitData);
              }
            } else {
              this.isEnabledTable = false;
              this.checkedData = null;
              this.getOverallPastData(this.data);
              this.surgeryList = [];
              this.dataSource = [];
              this.conDataSource = [];
              this.impDataSource = [];
              this.setDataSource = [];
              this.managePatientForm.controls['locationId'].reset();
              this.managePatientForm.controls['locationId'].updateValueAndValidity();
            }
          });
        } else  {
          this.getOverallPastData(this.data);
        }
      } else {
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        }
        this.toastr.warning('warning', `${res.message}`)
      }
    });
  }

  getOTProcedureData(visitData) {
    let scheduleDateString = visitData?.scheduleStartTime;
    scheduleDateString = scheduleDateString?.replace(' ', 'T');
    let currentDate = this._dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss");
    if (this.data.id && scheduleDateString > currentDate && visitData?.visitStatusId !== 'VS-CO') {
      this.ispastDatainfo = false;
      currentDate = this._dateFormat.transform(currentDate, 'YYYY-MM-dd');
      this.statusListData = this.statusInfoData.filter(x => x.code == 'VS-SH' || x.code == 'VS-CL')
      this.getOverallPatient(this.data.id, 'VT-IP', 'VE-OT', this.data?.visitEventId);
      this.commonService.getHcPatientList(currentDate, 'HP-OT').subscribe((res) => {
        if (res.statusCode === 1) {
          this.preEventData = res.results.data.find(x => x.patientId === this.data.id);
          setTimeout(() => { this.managePatientForm.get('endTime').setValue(this.preEventData?.scheduleEndTime) }, 500)
          setTimeout(() => { this.UpdateResourceData(this.preEventData) }, 400)
        }
      })
    } else {
      this.getOverallPastData(this.data);
    }
  }

  updateEmergency(data) {
    this.isEmergency = data;
    if (data) {
      this.managePatientForm.get('scheduleDate').setValue(this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm'))
    } else {
      this.managePatientForm.get('scheduleDate').reset()
    }
  }

  optionClicked(event: Event, item) {
    event.stopPropagation();
  }

  getItemName(option, type, code?) {
    this.totalQuantity = null;
    this.totalImpQuantity = null;
    const surgicalCode = option.code;
    if (type === 'consumable') {
      if (code == 'TW-EDT') {
        this.isConQuentError = false;
        this.isConQuentity = false;
        this.consumableName = option[0].name;
        this.totalQuantity = option[0].totalQuantity;
      } else {
        this.isConQuentError = false;
        this.isConQuentity = false;
        this.managePatientForm.controls['consumableQuantity'].reset()
        this.consumableName = option?.name;
        this.totalQuantity = option?.totalQuantity;
      }
      if (this.totalQuantity <= 0) {
        this.isConQuentity = false
      } else {
        this.isConQuentity = true;
      }
    } else if (type === 'implant') {
      if (code == 'TW-EDT') {
        this.isImpQuentError = false;
        this.isImpQuentity = false;
        this.implantName = option[0].name;
        this.totalImpQuantity = option[0].totalQuantity;
      } else {
        this.isImpQuentError = false;
        this.isImpQuentity = false;
        this.managePatientForm.controls['implantQuantity'].reset()
        this.implantName = option?.name;
        this.totalImpQuantity = option?.totalQuantity;
      }
      if (this.totalImpQuantity <= 0) {
        this.isImpQuentity = false
      } else {
        this.isImpQuentity = true;
      }
    } else if(type === 'set'){
      this.setName = option;
      this.commonService.getSterlieSetList(null, null, null, null, surgicalCode).subscribe(res => {
        this.identifierIdList = [];
        this.managePatientForm.get('identifier').reset();
        this.managePatientForm.get('statusIds').reset();
        if(res.statusCode === 1) {
          this.identifierIdList = res.results.map(item => ({ id: item.id, identifier: item.identifier }));
        }
      })
    }
  }

  updateConQuantity(change: number): void {
    const control = this.managePatientForm.get('consumableQuantity');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
    this.conQuantityValidation();
  }

  conQuantityValidation() {
    let quantityData = this.managePatientForm.controls['consumableQuantity'].value;
    if (this.totalQuantity < quantityData) {
      this.isConQuentError = true;
    } else {
      this.isConQuentError = false;
    }
  }

  updateSetQuantity(change: number): void {
    const control = this.managePatientForm.get('setQuantity');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }

  updateImpQuantity(change: number): void {
    const control = this.managePatientForm.get('implantQuantity');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
    this.impQuantityValidation();
  }

  impQuantityValidation() {
    let quantityData = this.managePatientForm.controls['implantQuantity'].value;
    if (this.totalImpQuantity < quantityData) {
      this.isImpQuentError = true;
    } else {
      this.isImpQuentError = false;
    }
  }

  addConsumables() {
    this.isActiveTable = true;
    const today = this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
    this.tabExist = 'Consumables';
    const request = {
      "entityType": 'Consumable',
      "entityId": this.managePatientForm.controls['consumableId'].value,
      "entityName": this.consumableName,
      "requestedQuantity": this.managePatientForm.controls['consumableQuantity'].value,
      "entityDelete" : this.editDataInfo?.entityDelete == false ? false : true,
      "requestDateTime" : this.editDataInfo?.requestDateTime ? this.editDataInfo.requestDateTime : today,
      "requestStatusValue": this.editDataInfo?.requestStatusValue ? this.editDataInfo?.requestStatusValue : '' ,
      "id": this.editDataInfo?.id ? this.editDataInfo.id : null,
      "editeDelete": ''
    }
    if (this.editDataInfo !== null && this.editDataInfo != undefined) {
      const index = this.conDataSource.findIndex(x => x.entityId === this.editDataInfo.entityId && x.requestStatusValue === this.editDataInfo.requestStatusValue && x.requestDateTime === this.editDataInfo.requestDateTime);
      if (index !== -1) {
        this.conDataSource[index] = request;
        this.conDataSource = this.conDataSource.map(({ isEditeDisable, ...rest }) => rest);
        this.conDataSource = [...this.conDataSource];
      } 
      this.editDataInfo = null;
    } else {
      this.conDataSource.push(request);
      this.conDataSource = this.conDataSource.map(({ isEditeDisable, ...rest }) => rest);
      this.conDataSource = [...this.conDataSource];
    }
    this.managePatientForm.get('consumableId').reset();
    this.managePatientForm.get('consumableQuantity').reset();
    this.isConQuentError = false;
    this.isConQuentity = false;
    this.totalQuantity = null;
  }

  addImplants() {
    this.isActiveTable = true;
    const today = this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
    this.tabExist = 'Implants';
    const request = {
      "entityType": 'Implant',
      "entityId": this.managePatientForm.controls['implantId'].value,
      "entityName": this.implantName,
      "requestedQuantity": this.managePatientForm.controls['implantQuantity'].value,
      "entityDelete" : this.editDataInfo?.entityDelete == false ? false : true,
      "requestDateTime" : this.editDataInfo?.requestDateTime ? this.editDataInfo.requestDateTime : today,
      "requestStatusValue": this.editDataInfo?.requestStatusValue ? this.editDataInfo?.requestStatusValue : '' ,
      "id": this.editDataInfo?.id ?  this.editDataInfo.id : null,
      "editeDelete": ''
    }
    if (this.editDataInfo !== null && this.editDataInfo != undefined) {
      const index = this.impDataSource.findIndex(x => x.entityId === this.editDataInfo.entityId && x.requestStatusValue === this.editDataInfo.requestStatusValue && x.requestDateTime === this.editDataInfo.requestDateTime);
      if (index !== -1) {
        this.impDataSource[index] = request;
        this.impDataSource = this.impDataSource.map(({ isEditeDisable, ...rest }) => rest);
        this.impDataSource = [...this.impDataSource];
      } 
      this.editDataInfo = null;
    } else {
      this.impDataSource.push(request);
      this.impDataSource = this.impDataSource.map(({ isEditeDisable, ...rest }) => rest);
      this.impDataSource = [...this.impDataSource];
    }
    this.managePatientForm.get('implantId').reset();
    this.managePatientForm.get('implantQuantity').reset();
    this.isImpQuentError = false;
    this.isImpQuentity = false;
    this.totalImpQuantity = null;
  }

  addSurgicalSet() {
    let request: any;
    this.isActiveTable = true;
    this.tabExist = 'Surgical Sets';
    if(this.editDataInfo != null && this.editDataInfo != undefined){
      const setSurgicalName = this.sterlieSetList.find(f => f.code === this.managePatientForm.get('surgicalSetId').value);
      const setStatusCode = this.surgerycalSetList.find(f => f.code === this.managePatientForm.get('statusIds').value);
      request = {
        "entityType": 'Sterlize',
        "entityName" : setSurgicalName ? setSurgicalName.value : null,
        "entityCode": this.managePatientForm.get('surgicalSetId').value ? this.managePatientForm.get('surgicalSetId').value : null,
        "entityId": this.managePatientForm.get('identifier').value ? this.managePatientForm.get('identifier').value : null,
        "requestId": this.editDataInfo.requestId ? this.editDataInfo.requestId : null,
        "requestStatusCode": this.managePatientForm.get('statusIds').value ? this.managePatientForm.get('statusIds').value : this.editDataInfo.requestStatusCode,
        "requestStatusValue": setStatusCode.value ? setStatusCode.value : this.editDataInfo.requestStatusValue,
        "requestType": this.editDataInfo.requestType ? this.editDataInfo.requestType : null,
        "entityDelete": this.editDataInfo.entityDelete == false ?  false : true,
        "id": this.editDataInfo.id ? this.editDataInfo.id : null 
      }
      const index = this.setDataSource.findIndex(x => x.entityCode === this.editDataInfo.entityCode);
      if (index !== -1) {
        this.setDataSource[index] = request;
        this.setDataSource = this.setDataSource.map(({ isEditeDisable, ...rest }) => rest);
        this.setDataSource = [...this.setDataSource];
      } 
      this.editDataInfo = null;
    } else {
      const setStatusCode = this.surgerycalSetList.find(f => f.code === this.managePatientForm.get('statusIds').value)
      request = {
        "entityType": 'Sterlize',
        "entityCode": this.managePatientForm.controls['surgicalSetId'].value,
        "entityId": this.managePatientForm.controls['identifier'].value ? this.managePatientForm.controls['identifier'].value : null,
        "requestStatusCode" :  this.managePatientForm.get('statusIds').value ?  this.managePatientForm.get('statusIds').value : null,
        "requestStatusValue" : setStatusCode ? setStatusCode.value : null,
        "entityName": this.setName ? this.setName.value : null,
        "requestedQuantity": this.managePatientForm.get('setQuantity').value,
        "entityDelete": true,
        "removeEdite": ''
      }
      this.setDataSource.push(request);
      this.setDataSource = [...this.setDataSource];
    }
    this.sterlieSetList = this.sterlieSetList.filter(x => x.code !== this.setName?.code);
    this.managePatientForm.get('surgicalSetId').reset();
    this.managePatientForm.get('identifier').reset();
    this.managePatientForm.get('statusIds').reset();
    this.managePatientForm.get('setQuantity').reset();
  }
  
  savePatient() {
    this.onLoading = true;
    let createPatient: any;
    createPatient = new CreatePatient(null, null, null, null, null, null, null, null, null, null);
    createPatient.mainidentifier = this.managePatientForm.controls['patientTWID'].value ? this.managePatientForm.controls['patientTWID'].value : null;
    createPatient.firstName = this.managePatientForm.controls['firstName'].value;
    createPatient.middleName = this.managePatientForm.controls['middleName'].value;
    createPatient.lastName = this.managePatientForm.controls['lastName'].value;
    createPatient.birthDate = this._dateFormat.transform(this.managePatientForm.controls['birthDate'].value, 'yyyy-MM-dd')
    createPatient.tagSerialNumber = this.managePatientForm.controls['tagID'].value;
    createPatient.eventType = this.visitEvent;
    createPatient.visitTypeId = this.visitType;
    createPatient.tagTypeId = this.tagTypeId;
    createPatient.otVisitStatusId = this.managePatientForm.get('patientStatusId')?.value;
    createPatient.countryCode = this.managePatientForm.get('countryCode').value;

    let mobile = this.managePatientForm.controls['mobileNo'].value || '';
    if (mobile.includes('-')) {
      createPatient.mobileNo = mobile.substring(mobile.indexOf('-') + 1).trim();
    } else if (mobile.includes(' ')) {
      createPatient.mobileNo = mobile.substring(mobile.indexOf(' ') + 1).trim();
    } else {
      createPatient.mobileNo = mobile.trim();
    }
    
    createPatient.canTagDisassociate = 'false';
    if (this.genderCode === undefined) {
      createPatient.gender = null;
    } else {
      createPatient.gender = this.genderCode;
    }
    if (this.isEmergency) {
      createPatient.surgeryTypeId = "SGT-EM";
    }
    createPatient.visits = [{
      'visitDate': this._dateFormat.transform(this.managePatientForm.controls['scheduleDate'].value, 'yyyy-MM-dd HH:mm:ss') ,
    }];
    if(this.data.patientVisitId) {
      createPatient.patientVisitId = this.data.patientVisitId;
    }
    let surgeryId = null;
    if(this.managePatientForm.controls['surgeryId'].value) {
      surgeryId = this.managePatientForm.controls['surgeryId'].value;
    }
    let eventDetails = [];
    let resourceEventDetails = this.dataSource?.map(data => {
      return {
        entityType: data.entityType,
        roleCode : data.roleCode,
        entityName: data.entityName,
        entityId: data.entityId,
        otProcedureId: surgeryId
      };
    });
    if(resourceEventDetails?.length > 0) {
      resourceEventDetails.forEach( details => {
        eventDetails.push(details);
      })
    }
    let consumableEventDetails = this.conDataSource?.map(data => {
      return {
        entityType: data.entityType,
        entityName: data.entityName,
        entityId: data.entityId,
        otProcedureId: surgeryId,
        count: data.requestedQuantity ? data.requestedQuantity : null
      };
    });
    if(consumableEventDetails?.length > 0) {
      consumableEventDetails.forEach( details => {
        eventDetails.push(details);
      })
    }
    let implantEventDetails = this.impDataSource?.map(data => {
      return {
        entityType: data.entityType,
        entityName: data.entityName,
        entityId: data.entityId,
        otProcedureId: surgeryId,
        count: data.requestedQuantity ? data.requestedQuantity : null
      };
    });
    if(implantEventDetails?.length > 0) {
      implantEventDetails.forEach( details => {
        eventDetails.push(details);
      })
    }
    let setEventDetails = [];
    this.setDataSource?.forEach(data => {
      const quantity = data.requestedQuantity && data.requestedQuantity > 0 ? data.requestedQuantity : 1;
      for (let i = 0; i < quantity; i++) {
        setEventDetails.push({
          entityType: data.entityType,
          entityName: data.entityName,
          entityCode: data.entityCode,
          otProcedureId: surgeryId,
        });
      }
    });
    if(setEventDetails?.length > 0) {
      setEventDetails.forEach( details => {
        eventDetails.push(details);
      })
    }
    createPatient.visitEvent = {
      'locationId': this.managePatientForm.controls['locationId'].value,
      'userId': this.managePatientForm.controls['doctorId'].value,
      'scheduleStartTime' : this._dateFormat.transform(this.managePatientForm.controls['scheduleDate'].value, 'yyyy-MM-dd HH:mm:ss'),
      'scheduleEndTime' :  this._dateFormat.transform(this.managePatientForm.controls['endTime'].value, 'yyyy-MM-dd HH:mm:ss')
    };
    if (this.managePatientForm.controls['surgeryId'].value && this.surgeryListData.length >0) {
      createPatient.healthPlanId = this.surgeryListData.find(item => item.id === this.managePatientForm.controls['surgeryId'].value).healthPlanId;
      createPatient.otProcedureId = this.managePatientForm.controls['surgeryId']?.value;
      if(this.activate_btn.includes('BT_OTS')) {
        const pro = this.surgeryListData.filter(item => item.id === this.managePatientForm.get('surgeryId').value);
        if(pro?.length !== 0) {
              eventDetails.push(
                {
                  entityType: "ot_procedure",
                  entityName: pro[0].name,
                  entityId: pro[0].id
                }
              )
            }
      }
    }
    createPatient.eventDetails = eventDetails;
    this.commonService.saveRegisteredPatients(createPatient).subscribe(result => {
      this.onLoading = false;
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }


  updatePatient(type?: any) {
    this.onLoading = true;
    let updatePatient: any;
    updatePatient = new EditPatient(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    updatePatient.patientId = this.data.patientId
    updatePatient.mainidentifier = this.managePatientForm.controls['patientTWID'].value;
    updatePatient.firstName = this.managePatientForm.controls['firstName'].value;
    updatePatient.middleName = this.managePatientForm.controls['middleName'].value;
    updatePatient.lastName = this.managePatientForm.controls['lastName'].value;
    updatePatient.birthDate = this._dateFormat.transform(this.managePatientForm.controls['birthDate'].value, 'yyyy-MM-dd');
    updatePatient.tagAssociationType = 'Patient';
    updatePatient.tagAssociationTypeId = 'TAT-PA';
    updatePatient.tagId = this.patientdata?.tagId != null ? this.patientdata.tagId : this.managePatientForm?.controls['tagID'].value;
    updatePatient.tagTypeId = this.patientdata?.tagTypeId != null ? this.patientdata.tagTypeId : this.tagTypeId;
    updatePatient.eventTypeId = this.data?.visitEvent ? this.data.visitEvent : this.preEventData != null ? this.preEventData.visitEvent : null;
    updatePatient.visitTypeId = this.data?.visitType ? this.data.visitType : this.preEventData != null ? this.preEventData.visitType : null;
    updatePatient.patientVisitEventId = this.data?.visitEventId ? this.data.visitEventId : this.preEventData != null ? this.preEventData.visitEventId : null;
    updatePatient.scheduleStartTime = this._dateFormat.transform(this.managePatientForm.controls['scheduleDate'].value, 'yyyy-MM-dd HH:mm:ss'),
    updatePatient.scheduleEndTime =   this._dateFormat.transform(this.managePatientForm.controls['endTime'].value, 'yyyy-MM-dd HH:mm:ss'),
    updatePatient.otVisitStatusId  =  this.patientdata && this.patientdata.visitStatusId === this.managePatientForm.get('patientStatusId').value ? this.patientdata.visitStatusId : this.managePatientForm.get('patientStatusId').value;
    updatePatient.countryCode = this.managePatientForm.get('countryCode').value;
    this.dataSource = this.dataSource?.filter(x => x.entityType !== 'ot_procedure');

    let mobile = this.managePatientForm.controls['mobileNo'].value || '';
    if (mobile.includes('-')) {
      updatePatient.mobileNumber = mobile.substring(mobile.indexOf('-') + 1).trim();
    } else if (mobile.includes(' ')) {
      updatePatient.mobileNumber = mobile.substring(mobile.indexOf(' ') + 1).trim();
    } else {
      updatePatient.mobileNumber = mobile.trim();
    }

    let surgeryId = null;
    if (!this.surgeryEnabled) {
      if (this.patientdata.hasOwnProperty('otProcedures') && this.patientdata?.otProcedures?.length > 0) {
        const unique = this.patientdata?.otProcedures.filter(a => this.managePatientForm.controls['surgeryId'].value?.indexOf(a.otProcedureId) === -1);
        surgeryId = unique[0].otProcedureId;
      } else {
        if (this.managePatientForm.controls['surgeryId'].value) {
          surgeryId = this.managePatientForm.controls['surgeryId'].value;
        }
      }
    }
    let eventDetails = [];
    if(this.dataSource?.length > 0 || this.deleteSchedule) {
      if(this.deleteSchedule){
        this.dataSource.push(this.deleteSchedule)
      }
      let resourceEventDetails = this.dataSource?.map(data => {
        return {
          entityType: data.entityType,
          entityName: data.entityName,
          entityId: data.entityId,
          otProcedureId: surgeryId,
          roleCode: data.roleCode,
          deleted : data.deleted === undefined ? false : true,
          id: data.id
        };
      });
      if(resourceEventDetails?.length > 0) {
        resourceEventDetails.forEach( details => {
          eventDetails.push(details);
        })
      }
    }
    if(this.conDataSource?.length > 0 || this.deleteConSchedule.length) {
      if(this.deleteConSchedule.length){
        this.conDataSource.push(...this.deleteConSchedule)
      }
      let consumableEventDetails = this.conDataSource?.map(data => {
        return {
          entityType: data.entityType ? data.entityType : null,
          entityName: data.entityName ? data.entityName : null,
          entityId: data.entityId ? data.entityId : null,
          otProcedureId: surgeryId ? surgeryId : null,
          count: data.requestedQuantity ? data.requestedQuantity : null,
          requestId: data.requestId ? data.requestId : null,
          requestType: data.requestType ? data.requestType : null,
          deleted : data.deleted === undefined ? false : true,
          id: data.id ? data.id : null
        };
      });
      if(consumableEventDetails?.length > 0) {
        consumableEventDetails.forEach( details => {
          eventDetails.push(details);
        })
      }
    }
    if(this.impDataSource?.length > 0 || this.deleteImpSchedule.length) {
      if(this.deleteImpSchedule.length){
        this.impDataSource.push(...this.deleteImpSchedule);
      }
      let implantEventDetails = this.impDataSource?.map(data => {
        return {
          entityType: data.entityType ? data.entityType : null,
          entityName: data.entityName ? data.entityName : null,
          entityId: data.entityId ? data.entityId : null,
          otProcedureId: surgeryId ? surgeryId : null,
          count: data.requestedQuantity ? data.requestedQuantity : null,
          requestId: data.requestId ? data.requestId : null,
          requestType: data.requestType ? data.requestType : null,
          deleted : data.deleted === undefined ? false : true,
          id: data.id ? data.id : null
        };
      });
      if(implantEventDetails?.length > 0) {
        implantEventDetails.forEach( details => {
          eventDetails.push(details);
        })
      }
    }
    if(this.setDataSource?.length > 0 || this.deleteSetSchedule.length) {
      if(this.deleteSetSchedule.length){
        this.setDataSource.push(...this.deleteSetSchedule)
      }
      let setEventDetails = this.setDataSource?.map(data => {
        return {
          entityType: data.entityType ? data.entityType : null,
          entityName: data.entityName ? data.entityName : null,
          entityId: data.entityId ? data.entityId : null, 
          entityCode: data.entityCode ? data.entityCode : null,
          otProcedureId: surgeryId ? surgeryId : null,
          requestStatusCode: data.requestStatusCode ? data.requestStatusCode : null,
          requestStatusValue: data.requestStatusValue ? data.requestStatusValue : null,
          requestId : data.requestId ? data.requestId : null,
          requestType: data.requestType ? data.requestType : null,
          count: data.requestedQuantity ? data.requestedQuantity : null,
          deleted : data.deleted === undefined ? false : true,
          id: data.id ? data.id : null
        };
      });
      if(setEventDetails?.length > 0) {
        setEventDetails.forEach( details => {
          eventDetails.push(details);
        })
      }
    }
    if (this.genderCode === undefined) {
      updatePatient.gender = this.managePatientForm.controls['gender'].value;
    } else {
      updatePatient.gender = this.genderCode;
    }
    let defaultproId: any;
    if (!this.surgeryEnabled) {
      if (this.preEventData != null) {
        defaultproId = this.preEventData.eventDetails?.find(item => item.entityType === 'ot_procedure');
      } else {
        defaultproId = this.data.eventDetails?.find(item => item.entityType === 'ot_procedure');
      }
    }
    if (this.surgeryEnabled === true) {
      if (this.managePatientForm.controls['surgeryId'].value) {
        updatePatient.healthPlanId = this.surgeryListData.find(item => item.id === this.managePatientForm.controls['surgeryId'].value).healthPlanId;
        updatePatient.otProcedureId = this.managePatientForm.controls['surgeryId'].value;
        if(this.activate_btn.includes('BT_OTS')) {
          const pro = this.surgeryListData.filter(item => item.id === this.managePatientForm.get('surgeryId').value);
          if(pro?.length !== 0) {
                eventDetails.push(
                  {
                    entityType: "ot_procedure",
                    entityName: pro[0].name,
                    entityId: pro[0].id,
                    deleted: false,
                    id: defaultproId ? defaultproId.id : null
                  }
                )
              }
          if(this.patientdata.hasOwnProperty('otProcedures') && this.patientdata?.otProcedures?.length > 0 && !this.surgeryEnabled) {
            const unique = this.patientdata?.otProcedures.filter(a => this.managePatientForm.controls['surgeryId'].value?.indexOf(a.otProcedureId) === -1);
            if(unique?.length > 0) {
              unique.forEach(x => {
                eventDetails.push(
                  {
                    entityType: "ot_procedure",
                    entityName: x.otProcedureName,
                    entityId: x.otProcedureId,
                    deleted: true,
                    id: defaultproId ? defaultproId.id : null
                  }
                ) 
              })
            }
          }
        }
      }
    } else {
      updatePatient.healthPlanId = this.patientdata.healthPlanId;
      updatePatient.otProcedureId = this.patientdata.suergeryId;
      if(this.activate_btn.includes('BT_OTS')) {
        if(this.patientdata.hasOwnProperty('otProcedures') && this.patientdata?.otProcedures?.length > 0) {
          this.patientdata?.otProcedures.forEach(x => {
            eventDetails.push(
              {
                entityType: "ot_procedure",
                entityName: x.otProcedureName,
                entityId: x.otProcedureId,
                deleted: false,
                id: defaultproId ? defaultproId.id : null
              }
            )
          })
        }
      }
    }
    updatePatient.eventDetails = eventDetails;
    if (this.locationEnabled === true) {
      updatePatient.bedId = this.managePatientForm.controls['locationId'].value;
      updatePatient.locationId = this.managePatientForm.controls['locationId'].value;
    } else {
      updatePatient.locationId = this.patientdata.otLocationId;
    }
    if (this.doctornameEnabled === true) {
      updatePatient.userId = this.managePatientForm.controls['doctorId'].value;
    } else {
      updatePatient.userId = this.patientdata.doctorId;
    }
    updatePatient.scheduleDate = this._dateFormat.transform(this.managePatientForm.controls['scheduleDate'].value, 'yyyy-MM-dd HH:mm:ss');

    if (this.isEmergency === true || this.managePatientForm.controls['emergencyType'].value) {
      updatePatient.surgeryTypeId = "SGT-EM";
    } else {
      updatePatient.surgeryTypeId = null;
    }
    if(type === 'timeDelay') {
      const start = this.patientdata?.visitDate ? this.patientdata.visitDate : this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm');
      updatePatient.delayScheduleStartTime = start !== this._dateFormat.transform(this.managePatientForm.controls['delayScheduleStartTime'].value, 'yyyy-MM-dd HH:mm:ss') ?
      this._dateFormat.transform(this.managePatientForm.controls['delayScheduleStartTime'].value, 'yyyy-MM-dd HH:mm:ss') : null;
      updatePatient.delayStartReasonId = this.managePatientForm.controls['delayStartReasonId'].value;
      updatePatient.delayStartRemarks = this.managePatientForm.controls['delayStartRemarks'].value;

      const end = this.data?.endTime ? this.data?.endTime : null;
      updatePatient.delayScheduleEndTime = end !== this._dateFormat.transform(this.managePatientForm.controls['delayScheduleEndTime'].value, 'yyyy-MM-dd HH:mm:ss') ?
      this._dateFormat.transform(this.managePatientForm.controls['delayScheduleEndTime'].value, 'yyyy-MM-dd HH:mm:ss') : null;
      updatePatient.delayEndReasonId = this.managePatientForm.controls['delayEndReasonId'].value;
      updatePatient.delayEndRemarks = this.managePatientForm.controls['delayEndRemarks'].value;
    }
    this.commonService.updateAllpatientDetails(updatePatient).subscribe(result => {
      this.onLoading = false;
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  getDelayDuration(type) {
    if (type === 'startTime') {
      const date1 = this._dateFormat.transform(this.managePatientForm.get('scheduleDate').value, 'yyyy-MM-dd HH:mm:ss');
      const date2 = this._dateFormat.transform(this.managePatientForm.get('delayScheduleStartTime').value, 'yyyy-MM-dd HH:mm:ss');
      const diff = new Date(date1).getTime() - new Date(date2).getTime();
      const mins = Math.abs(Math.round(diff / 60000));
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const hhmm = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.managePatientForm.get('delayStartTime').setValue(hhmm);
    } else if (type === 'endTime') {
      const date1 = this._dateFormat.transform(this.managePatientForm.get('endTime').value, 'yyyy-MM-dd HH:mm:ss');
      const date2 = this._dateFormat.transform(this.managePatientForm.get('delayScheduleEndTime').value, 'yyyy-MM-dd HH:mm:ss');
      const diff = new Date(date1).getTime() - new Date(date2).getTime();
      const mins = Math.abs(Math.round(diff / 60000));
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const hhmm = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.managePatientForm.get('delayEndTime').setValue(hhmm);
    } else if (type === 'startDuration') {
      if (this.managePatientForm.get('delayStartTime').value !== null && this.managePatientForm.get('delayStartTime').value !== '') {
        const delayStr = this.managePatientForm.get('delayStartTime').value;
        if (delayStr && delayStr.includes(':')) {
          const [hh, mm] = delayStr.split(':').map(Number);
          const minutes = (hh * 60) + mm;
          const date1 = this.patientdata?.visitDate
            ? new Date(this.patientdata.visitDate)
            : new Date(this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm'));
          const newDate = new Date(date1.getTime() + minutes * 60000); 
          this.managePatientForm.get('delayScheduleStartTime').setValue(this._dateFormat.transform(newDate, 'yyyy-MM-dd HH:mm:ss'));
        }
      } else {
        this.managePatientForm.get('delayScheduleStartTime').setValue(this.data?.delayScheduleStartTime ? this.data?.delayScheduleStartTime : this.patientdata?.visitDate ? 
          this.patientdata.visitDate : this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm'));
      }  
    } else {
      if(this.managePatientForm.get('delayEndTime').value !== null && this.managePatientForm.get('delayEndTime').value !== '') {
        const delayStr = this.managePatientForm.get('delayEndTime').value;
        if (delayStr && delayStr.includes(':')) {
          const [hh, mm] = delayStr.split(':').map(Number);
          const totalMinutes = (hh * 60) + mm;
          const date1 = this.data?.endTime ? new Date(this.data.endTime) : null;
          if (date1) {
            const updatedDate = new Date(date1.getTime() + totalMinutes * 60000);
            this.managePatientForm.get('delayScheduleEndTime')
              .setValue(this._dateFormat.transform(updatedDate, 'yyyy-MM-dd HH:mm:ss'));
          }
        }
      } else {
        this.managePatientForm.get('delayScheduleEndTime').setValue(this.data?.delayScheduleEndTime ? this.data?.delayScheduleEndTime : this.data?.endTime ? this.data?.endTime : null);
      } 
    }
  }
  getPageTemplete(dataIds, startDate, endDate) {
    const changeStartDate = this._dateFormat.transform(startDate, 'yyyy-MM-dd HH:mm:ss');
    const changeEndDate = this._dateFormat.transform(endDate, 'yyyy-MM-dd HH:mm:ss')
    this.isActiveTable = true;
    let page = 'OT Schedule';
    let identifyingType = 'procedure';
    let identifyingValues = dataIds;
    let staffListInfo: any;
    let staffList: any;
    this.commonService.getHealthPlanTemplate(page, identifyingValues, identifyingType, changeStartDate, changeEndDate).subscribe(res => {
      if (res.statusCode != 0) {
        const surgeryFilterData = res.results;
        const allResources = surgeryFilterData.flatMap(item => JSON.parse(item.templateValue).resources);
        const userRollInfo = allResources.filter(x => this.allowedCodes.includes(x.roleCode) || x.roleCode === 'SE-AT');
        const consumInfo = allResources.filter(x => x.roleCode === 'IT-CON');
        const implantInfo = allResources.filter(x => x.roleCode === 'IT-IMP');
        const Setinfo = allResources.filter(x => x.roleCode === null);
        if (userRollInfo.length) {
          let userRollList = userRollInfo.map(item => {
            let entityType = '';
            let entityId = '';
            let entityName = '';
            let roleCategory = '';
            let roleCode = '';
            let canBeBooked = null;
            if (item.roleCode === 'SE-AT') {
              if(item.entityId !== null && item.entityId !== undefined){
                const assetListInfo = this.assetAllNamelist.find(x => x.id == item.entityId);
                entityType = 'Asset',
                entityId = assetListInfo?.id;
                entityName = assetListInfo?.assetName;
                roleCategory = assetListInfo?.assetCategoryName;
                canBeBooked = item?.hasOwnProperty('canBeBooked') ? item?.canBeBooked : null;
              } else {
                const assetList = this.assetCategory.find(f => f.code == item.assetCategoryId);
                entityType = 'Asset',
                entityId = null;
                entityName = null;
                roleCategory = assetList?.name ? assetList.name : null;
                canBeBooked = item?.hasOwnProperty('canBeBooked') ? item?.canBeBooked : null;
              }
            } else {
              if(item.entityId !== null) {
                staffListInfo = this.staffNameData?.find(x => x.id === item.entityId);
              } else {
                staffList = this.roleList.find(f => f.code === item.roleCode);
              }
              entityType = 'User',
              entityId = staffListInfo?.id  && item.entityId ? staffListInfo?.id : null;;
              entityName = staffListInfo?.firstName && item.entityId ? staffListInfo?.firstName : null;
              roleCategory = staffListInfo?.roleName && item.entityId ? staffListInfo?.roleName : staffList?.name;
              roleCode = item?.roleCode;
              canBeBooked =  item.hasOwnProperty('canBeBooked') ? item?.canBeBooked : null;
            }
            if(item.canBeBooked === false){
              this.isCanbeDisabled = true;
            }
            return {
              entityType: entityType,
              entityId: entityId,
              entityName: entityName,
              roleCategory: roleCategory,
              roleCode: roleCode,
              canBeBooked: canBeBooked,
              entityDelete: ''
            }
          });
          this.dataSource.push(...userRollList);
          this.dataSource = [...this.dataSource];
        }
        if (consumInfo.length) {
          let consumablelist = consumInfo.map(item => {
            const consumData = this.itemMasterListData.find(x => x.id === item.entityId);
            return {
              entityType: 'Consumable',
              entityId: consumData?.id,
              entityName: consumData?.name,
              requestedQuantity: item.quantity,
              editeDelete: ''
            }
          });
          this.conDataSource.push(...consumablelist);
          this.conDataSource = [...this.conDataSource];
        }
        if (implantInfo.length) {
          let implatlist = implantInfo.map(item => {
            const implantData = this.itemMasterListData.find(x => x.id === item.entityId);
            return {
              entityType: 'Implant',
              entityId: implantData?.id,
              entityName: implantData?.name,
              requestedQuantity: item.quantity,
              editeDelete: ''
            }
          });
          this.impDataSource.push(...implatlist);
          this.impDataSource = [...this.impDataSource];
        }
        if (Setinfo.length) {
          let setlist = Setinfo.map(item => {
            return {
              entityType: item?.entityType,
              entityCode: item?.entityCode,
              entityName: item?.entityName,
              removeEdite: ''
            }
          });
          this.setDataSource.push(...setlist);
          this.setDataSource = [...this.setDataSource];
        }
      } else {
        this.dataSource = [];
        this.conDataSource = [];
        this.impDataSource = [];
      }
    })
  }
  fixClick() {
    console.log('')
  }

  onMobileInput() {
    const control = this.managePatientForm.get('mobileNo');
    const value = control?.value;
    if (control?.valid) {
      this.getPhoneValidate(value, 'phone');
    }
  }

  getPhoneValidate(data, type) {
    const code = type === 'code' ? data : this.managePatientForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if (res.results) {
        if (type === 'code') {
          const length = res.results?.length;
          this.managePatientForm.get('mobileNo').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
          this.managePatientForm.get('mobileNo').updateValueAndValidity();
        }
      } else {
        const control = this.managePatientForm.get('mobileNo');
        control?.setErrors({ invalidPhone: true });
        this.phoneMessage = res.message;
      }
    });
  }

}
