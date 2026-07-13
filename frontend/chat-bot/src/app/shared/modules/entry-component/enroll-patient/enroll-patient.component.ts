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
import { Component, OnInit, ViewChild, Input, Inject, AfterViewInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl,  FormArray,  ValidationErrors } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CreateRegisterPatient, CreateEnrollPatient, CreateCoaster, CreateInfant, CreateEnrollEmployee, EditEnrollEmployee, CreateEnrollVisitor, EditEnrollVisitor, CreateEnrollTempId, EditEnrollTempId, UpdateEnrollPatient, EditInfant, CreateMedicalRecord } from './enroll-patient.model';
import { ConfigurationService, CommonService, HospitalService } from '../../../services';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ConfirmationDialog } from '../../entry-component/confirmation-dialog/confirmation-dialog.component';
import * as moment_ from 'moment';
import { startWith, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { ApptermsService } from '../../../services/appterms.service';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

const moment = moment_;

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
  selector: 'app-enroll-patient',
  templateUrl: './enroll-patient.component.html',
  styleUrls: ['./enroll-patient.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],

})

export class EnrollPatientComponent implements OnInit {

  public registerPatientForm: FormGroup;
  public createRegisterPatient: CreateRegisterPatient;
  public isDisabled = false;
  dataSource = new MatTableDataSource();
  public genderList: any[] = null;
  public currentDate: any = new Date();
  public checkUHID = true;
  public chkEnrolment = false;
  public checkedRowData: any;
  public matcher = new ErrorStateMatcherService();
  public isEnabledTable = false;
  public isDataNotFound = false;
  public searchCosterlist: any;
  public isEnableCosterDropdown = true;
  public disableCoster = false;

  checked = true;
  public vipList: Array<any> = [];
  public languageList: Array<any> = [];

  displayedColumns = ['select', 'name', 'uhid', 'gender', 'age', 'DOB', 'mobile', 'packageName', 'date', 'edit', 'status'];
  selection = new SelectionModel<Element>(true, []);
  public isEditDate = false;
  public isSelectedEditId = 0;
  public isDiabetic = false;
  public isFasting = false;
  public isVulnerable = false;
  public isPregnant = false;
  public vipTypeId: any;
  public preferredLanguage: any;
  public checkPkgDate: any;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public allowEditPkgIcon = false;
  public isClinical = false;
  public isEnrollOption = false;
  public selectedEnrollId: any;

  public isEditIconEnable = false;
  public selectedRowIndex: any;
  public defaultPkgDateShow = true;
  public loading = false;
  public enrollDetails: any;
  public tokenEnrollFlow: any;
  public assignFloorDetails: Array<any> = [];
  public floorId: any;
  public enrollVisitType = null;
  public isExecuteEnroll = false;
  public todayDate = this.datepipe.transform(new Date(), 'dd/MM/yyyy');
  public enrollVisitOption = [{ name: 'New Visit', value: false }];
  public changeEnrollAction;
  public packageName: any;
  public isExisting;
  public followupAssignFloorDetails: Array<any> = [];
  public visitEvent = '';
  public listItems: any;
  public height: any;
  public TokenList: any = [];
  toHit = false;
  public tokenID:any;
  public enableAssignToken = false;
  public ipView = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public selectedRow = '';
  public tagTypeId = null;
  public workflowTypeId = null;
  healthPlanEnabled = false;
  healthPlanList = [];
  healthPlanId = null;
  planSourceId = null;
  requirePlanMatchVal: any=[];
  visitStatusId = null;
  patientVisitId = null;
  visitTypeId = null;
  disableHealthPlan = false;
  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog, private readonly commonService: CommonService,
    public thisDialogRef: MatDialogRef<EnrollPatientComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly _dateFormat: DatePipe, private readonly dateAdapter: DateAdapter<Date>, public datepipe: DatePipe) {
  }

  ngOnInit() {
    this.workflowTypeId = this.data.workflowTypeId;
    this.visitTypeId = this.workflowTypeId?.replace(/^[^-]+-/, 'VT-');
    if (this.data.visitEvent === 'VE-OT') {
      this.visitEvent = this.data.visitEvent;
    }

    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.assignFloorDetails = res.results.contentObject['assign-floor'].filter(filter => filter.isOnlyRegistration === 'false');
        this.followupAssignFloorDetails = res.results.contentObject['assign-floor'].filter(filter => filter.isFollowup === 'true');
      }
    });

    this.buildForm();

    
    this.tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));
    console.log(this.tokenEnrollFlow)

    if (this.tokenEnrollFlow === false) {
      this.registerPatientForm.get('coster').valueChanges
        .subscribe(value => {
          if (value === 'mobile') {
            this.registerPatientForm.get('tagSerialNumber').setValidators(null);
            this.registerPatientForm.controls['tagSerialNumber'].setValue(null);
          }
          if (value === 'coaster') {
            this.registerPatientForm.get('tagSerialNumber').setValidators(Validators.required);
          }
          this.registerPatientForm.get('tagSerialNumber').updateValueAndValidity();
        });

      this.registerPatientForm.get('tagSerialNumber').valueChanges
        .subscribe(value => {
          if (value != null && value.lastIndexOf('~') > -1) {
            const splitValue = value.split('=');
            const costerId = splitValue[1].substring(0, 9);
            if (costerId.length <= 9 && costerId.toString().match(/^\d*$/)) {
              this.registerPatientForm.get('tagSerialNumber').setValue(costerId);
              this.registerPatientForm.get('tagSerialNumber').updateValueAndValidity();
            }
          }
        });
      if (this.registerPatientForm.get('coster').value === 'coaster') {
        this.registerPatientForm.get('tagSerialNumber').setValidators(Validators.required);
        this.registerPatientForm.get('tagSerialNumber').updateValueAndValidity();
      }
    }

    if (this.tokenEnrollFlow === true && this.assignFloorDetails.length > 0) {
      this.registerPatientForm.get('assignFloorId').setValidators(Validators.required);
      this.registerPatientForm.get('assignFloorId').updateValueAndValidity();
    }

    
    this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList = res.results;
    });

    this.commonService.getAppTermsVerion2('Language').subscribe(res => {
      this.languageList = res.results;
    });

    this.commonService.getAppTermsVerion2('VipType').subscribe(res => {
      this.vipList = res.results;
    });

    this.customValidator();
    this.getCardType()
  }
  onWindowResized(size) {
    this.height = size;
  }
  onUHID(UHID) {
    this.isClinical = false;
    this.isEnrollOption = false;
    this.loading = true;
    this.defaultPkgDateShow = false;
    this.registerPatientForm.get('assignFloorId').setValue(null);
    this.registerPatientForm.get('assignFloorId').updateValueAndValidity();
    this.registerPatientForm.get('enrollVisit').setValue(null);
    this.registerPatientForm.get('enrollVisit').updateValueAndValidity();
    if (this.enrollDetails) {
      this.enrollDetails = [];
    }
    this.getRegisteredPatients(UHID);
  }
  onChangeClinicalDetails(event, type) {
    if (type === 'isDiabetic') {
      this.isDiabetic = event;
    } else if (type === 'isFasting') {
      if (event.checked === true) {
        this.registerPatientForm.get('isFasting').setValue(true);
        this.isFasting = true;
      } else {
        this.registerPatientForm.get('isFasting').setValue(false);
        this.isFasting = false;
      }
    } else if (type === 'isVulnerable') {
      if (event.checked === true) {
        this.registerPatientForm.get('isVulnerable').setValue(true);
        this.isVulnerable = true;
      } else {
        this.registerPatientForm.get('isVulnerable').setValue(false);
        this.isVulnerable = false;
      }
    } else if (type === 'isPregnant') {
      if (event.checked === true) {
        this.registerPatientForm.get('isPregnant').setValue(true);
        this.isPregnant = true;
      } else {
        this.registerPatientForm.get('isPregnant').setValue(false);
        this.isPregnant = false;
      }
    }
  }
  checkCurrentDate(event) {
    this.checkPkgDate = this.datepipe.transform(event, 'yyyy-MM-dd');
  }

  getTagTypeId(tagTypeId) {
    this.tagTypeId = tagTypeId;
  }
  getCardType() {
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if(res.statusCode == 1) {
        this.ipView = res.results['contentObject'];
        if(this.ipView.hasOwnProperty('enableAssignToken')) {
          this.enableAssignToken = this.ipView.enableAssignToken;
        }
      }
    });
  }
  searchToken(event) {
    this.toHit = event.toHit;
    if (event.text.length >= 2) {
      if (event.toHit == true && this.enableAssignToken) {
        this.commonService.searchToken(event.text, null).subscribe(res => {
          this.TokenList = res.results;
          if(this.TokenList.length == 1) {
            this.registerPatientForm.get('enrolltoken').setValue(this.TokenList[0].tokenNumber);
            this.registerPatientForm.get('assignFloorId').setValue(this.TokenList[0].floorId);
          }
        });}
      }
  }
  onTokenSelected(tokenNumber: string) {
    const selectedToken = this.TokenList.find(token => token.tokenNumber === tokenNumber);
    if (selectedToken) {
        const selectedTokenId = selectedToken.id;
        this.tokenID = selectedTokenId;
        this.floorId = selectedToken.floorId;
        this.registerPatientForm.get('assignFloorId').setValue(this.floorId);
    }
}
  onChange(event, item) {
    this.disableHealthPlan = false;
    this.visitStatusId = item?.visitStatusId;
    this.patientVisitId = item?.patientVisitId;
    if(item && item.id == null && item.hasOwnProperty('patientVisitId') && item.patientVisitId == null) {
      this.healthPlanId = item?.packageIdentifier;
      this.registerPatientForm.get('healthPlanId').setValue(item?.packageName);
      this.disableHealthPlan = true;
    }
    if(item?.packageDate && item?.packageDate !== null) {
      const pkgDate = this.datepipe.transform(item?.packageDate, 'yyyy-MM-dd');
      const today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
      const diffDays = Math.floor((new Date().setHours(0,0,0,0) - new Date(pkgDate).setHours(0,0,0,0)) / 86400000);
      if(diffDays >= 0 && diffDays <= 2) {
        if (item?.healthPlanId !== null) {
          this.healthPlanId = item?.healthPlanId;
          this.planSourceId = null;
          this.registerPatientForm.get('healthPlanId').setValue(item?.packageName);
          this.disableHealthPlan = true;
          this.registerPatientForm.get('healthPlanId').updateValueAndValidity();
        } else if(item?.healthPlanId === null && item?.planSourceId !== null) {
          this.planSourceId = item?.planSourceId;
          this.healthPlanId = null;
          this.registerPatientForm.get('healthPlanId').setValue(item?.planSourceId);
          this.registerPatientForm.get('healthPlanId').updateValueAndValidity();
        }
      }
    }
    if (item.packageDate != null) {
      this.checkPkgDate = this.datepipe.transform(item.packageDate, 'yyyy-MM-dd');
    } else {
      this.checkPkgDate = null;
    }

    if (event.checked === true && item.id && item.patientVisitId) {
      this.commonService.getEnrollVisitOption(item.id, item.patientVisitId).subscribe(res => {
        console.log(res.results);
        this.isExisting = res.results.isExisting;

        if (item.healthPlanId != null) {
          if (!res.results.isFollowUp) {
            if (this.checkPkgDate === this.selectedDate) {
              this.changeEnrollAction = true;
            }
            if (res.results.isExisting) {
              this.enrollVisitType = 'Follow up';
            } else {
              this.enrollVisitType = 'New visit';
            }
            const pkgDate = this.datepipe.transform(item?.packageDate, 'yyyy-MM-dd');
            const today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
            if(pkgDate === today) {
              this.registerPatientForm.get('assignFloorId').setValue(item?.assignedFloorId);
            } else {
              this.registerPatientForm.get('assignFloorId').setValue(null);
            }            
          } else {
            this.enrollVisitType = 'Follow up';
            if (this.followupAssignFloorDetails.length > 0) {
              this.floorId = this.followupAssignFloorDetails[0].floorId;
              this.registerPatientForm.get('assignFloorId').setValue(this.followupAssignFloorDetails[0].floorId);
            }
          }
          this.registerPatientForm.get('assignFloorId').updateValueAndValidity();
        } else {
          this.changeEnrollAction = true;
        }
        const pkgDate = this.datepipe.transform(item?.packageDate, 'yyyy-MM-dd');
        const today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
        if(pkgDate === today && this.visitStatusId !== 'VS-CO' && this.visitStatusId !== 'VS-CL' && this.visitStatusId !== 'VS-DC') {
          this.registerPatientForm.get('enrollVisit').setValue(null);
          this.registerPatientForm.get('enrollVisit').disable();
          this.registerPatientForm.get('enrollVisit').updateValueAndValidity();
        } else {
          this.registerPatientForm.get('enrollVisit').setValue(false);
          this.registerPatientForm.get('enrollVisit').updateValueAndValidity();
        }
      });
    } else {
      this.changeEnrollAction = true;
      const pkgDate = this.datepipe.transform(item?.packageDate, 'yyyy-MM-dd');
      const today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
      if(pkgDate === today && this.visitStatusId !== 'VS-CO' && this.visitStatusId !== 'VS-CL' && this.visitStatusId !== 'VS-DC') {
        this.registerPatientForm.get('enrollVisit').setValue(null);
        this.registerPatientForm.get('enrollVisit').disable();
        this.registerPatientForm.get('enrollVisit').updateValueAndValidity();
      } else {
        this.registerPatientForm.get('enrollVisit').setValue(false);
        this.registerPatientForm.get('enrollVisit').updateValueAndValidity();
      }
    }
    
    this.isDiabetic = item.isDiabetic;
    this.isFasting = item.isFasting;
    this.isVulnerable = item.isVulnerable;
    this.isPregnant = item.isPregnant;
    this.data.vipTypeId = item.vipTypeId;
    this.data.preferedLanguage = item.preferedLanguage;
    this.selectedEnrollId = item.id;
    this.packageName = item.packageName;
   
    this.registerPatientForm.get('date').setValue(this.currentDate);
    this.registerPatientForm.get('date').updateValueAndValidity();
    this.registerPatientForm.get('assignFloorId').setValue(null);
    this.registerPatientForm.get('assignFloorId').updateValueAndValidity();
    if (event.checked === true) {
      this.allowEditPkgIcon = true;
      this.isEditDate = false;
      this.isClinical = true;
      this.isEnrollOption = true;
      this.isEditIconEnable = true;
      this.defaultPkgDateShow = true;
    } else {
      this.allowEditPkgIcon = false;
      this.isEditDate = true;
      this.isClinical = false;
      this.isEnrollOption = false;
      this.isEditIconEnable = false;
      this.defaultPkgDateShow = false;
    }


    this.registerPatientForm.controls['preferedLanguage'].setValue(item.preferedLanguage);
    this.registerPatientForm.controls['vipTypeId'].setValue(item.vipTypeId);
    this.registerPatientForm.get('preferedLanguage').updateValueAndValidity();
    this.registerPatientForm.get('vipTypeId').updateValueAndValidity();

    let selected_condition_check_value: any;
    let selected_condition_check_key: any;
    let collection_check_value: any;

    if (item.isExistinPatient === true) { 
      selected_condition_check_value = item.id;
      selected_condition_check_key = 'id';
      this.selectedRowIndex = item.id;
    } else {
      selected_condition_check_value = item.mainidentifier;
      selected_condition_check_key = 'mainidentifier';
      this.selectedRowIndex = item.mainidentifier;
    }

    if (item.tagSerialNumber != null) {
      
      this.disableCoster = true;

      if (item.tagTypeId === 'TT-MB') {
        this.registerPatientForm.controls['coster'].setValue('mobile');
        this.isEnableCosterDropdown = false;
      } else {
        this.registerPatientForm.controls['coster'].setValue('coaster');
        this.isEnableCosterDropdown = true;
      }
      
      this.registerPatientForm.controls['tagSerialNumber'].setValue(item.tagSerialNumber);
      this.registerPatientForm.get('tagSerialNumber').disable();
      this.registerPatientForm.get('coster').updateValueAndValidity();
      this.registerPatientForm.get('tagSerialNumber').updateValueAndValidity();
    } else {
      
      this.disableCoster = false;

      if (item.tagTypeId === 'TT-MB') {
        this.registerPatientForm.controls['coster'].setValue('mobile');
        this.isEnableCosterDropdown = false;
      } else {
        this.registerPatientForm.controls['coster'].setValue('coaster');
        this.isEnableCosterDropdown = true;
      }
      this.registerPatientForm.get('tagSerialNumber').enable();
      this.registerPatientForm.get('coster'
      ).updateValueAndValidity();
      this.registerPatientForm.get('tagSerialNumber').updateValueAndValidity();
    }

    for (let j = 0; j < this.data.length; j++) {
      if (selected_condition_check_key === 'mainidentifier') {
        collection_check_value = this.data[j].mainidentifier;
        this.data[j].selectedRowIndex = this.data[j].mainidentifier;
      } else {
        collection_check_value = this.data[j].id;
        this.data[j].selectedRowIndex = this.data[j].id;
      }
      
      if (collection_check_value === selected_condition_check_value && item.id == this.data[j]['id'] && item.healthPlanId == this.data[j]['healthPlanId']) {
        this.data[j].checked = !this.data[j].checked;
        if (this.data[j].checked === true) {
          this.checkedRowData = this.data[j];
          this.selectedRow = this.data[j].status;
          this.registerPatientForm.get('vipTypeId').setValue(this.checkedRowData?.vipTypeId);
          this.registerPatientForm.get('isDiabetic').setValue(this.checkedRowData?.isDiabetic);
        } else {
          this.selectedRow = '';
        }
      } else {
        this.data[j].checked = false;
      }
      
    }
    this.updateHealthPlanValidation();
  }
  // based on checkeddata key patientSource healthPlanId field is made mandatory /non -mandatory along  enable or readonly validator method.
  updateHealthPlanValidation(): void {
    const healthPlanId = this.registerPatientForm.get('healthPlanId');
    if (!healthPlanId) return;
    // const isTempOrExternal = this.data?.patientSource === 'TEMPORARY_PATIENT' || this.data?.patientSource === 'EXTERNAL_API';
    const isToday = this.todayDate === this._dateFormat.transform(this.data?.packageDate, 'dd/MM/yyyy');
      // Condition to disable (package date need to match current date)
    const shouldDisable = isToday
    if (shouldDisable) {
      healthPlanId.clearValidators();
      healthPlanId.disable({ emitEvent: false });
      healthPlanId.setValue(this.data?.packageName);
      healthPlanId.setErrors(null);
    } else {
      healthPlanId.enable({ emitEvent: false });
      healthPlanId.setValidators(this.requirePlanMatch.bind(this));
    }
    healthPlanId.updateValueAndValidity({ emitEvent: false });
  }

  customValidator() {
    this.registerPatientForm.get('mainidentifier').valueChanges
      .subscribe(value => {
        if (value != null) {
          
          if (value.toString().match(/^[0-9-+()]*$/)) {
            
            if (value.length >= 9) {
              this.registerPatientForm.get('mainidentifier').setValidators([Validators.required, Validators.pattern('^[0-9-+()]*$')]);
              
            }
          } else {
            this.registerPatientForm.get('mainidentifier').setValidators([Validators.required]);
          }
        }
      });
  }

  public buildForm() {

    this.registerPatientForm = this.form.group({
      mainidentifier: [this.data.mainidentifier ? this.data.mainidentifier : null, [Validators.required]],
      firstName: [this.data.firstName ? this.data.firstName : null],
      lastName: [this.data.lastName ? this.data.lastName : null],
      age: [this.data.age ? this.data.age : ''],
      birthDate: [this.data.birthDate ? this.data.birthDate : null],
      gender: [{ value: this.data.gender ? this.data.gender : null, disabled: true }],
      mobileNo: [this.data.mobileNo ? this.data.mobileNo : null],
      date: new FormControl(moment()),
      isPkgDateEdited: [null],
      tagSerialNumber: [null],
      coster: ['coaster'],
      isDiabetic: [null],
      isFasting: [null],
      isVulnerable: [null],
      isPregnant: [null],
      vipTypeId: [this.vipTypeId ? this.vipTypeId : null],
      preferedLanguage: [this.data.preferedLanguage ? this.data.preferedLanguage : null],
      assignFloorId: [null],
      enrollVisit: [null],
      enrolltoken:[null],
      healthPlanId: [null, this.requirePlanMatch.bind(this)],
      isCheckOutProcessCounter: [this.visitTypeId == 'VT-HC' ? true : null]
    });
  }

  private requirePlanMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '' && this.healthPlanId === null) {
      this.requirePlanMatchVal = this.healthPlanList?.filter(resFilter => resFilter.id === control.value);
      if (this.requirePlanMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }

  searchAssociationDetails(name, type, event) {
    if (name !== '') {
      if (type === 'healthPlan') {
        if (name.length >= 3) {
          let planType = 'HP-HC';
          if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190 ||event.keyCode === 17) {
            this.healthPlanEnabled = true;
            this.healthPlanId = null;
            this.commonService.getOTHealthPlan(planType, name).pipe(
              debounceTime(3000),
              distinctUntilChanged(),
            ).subscribe(res => {
              this.healthPlanList = res.results;
            });
          }
        } else {
          this.healthPlanList = [];
        }
      } else {
        this.healthPlanList = [];
      }
    }
  }

  getSurgeryList(type, id) {
    if (id && (type === 'healthPlan')) {
      const surgery = this as any as { id: string, name: string }[];
      return surgery.find(obj => obj.id === id).name;
    } else {
      return '';       
    }
  }

  enableEdit(item) {
    const filterVal = this.data.filter(filter => filter.id === item.id);
    this.isSelectedEditId = filterVal[0].id;
    this.isEditDate = true;
    
    this.checkPkgDate = this.datepipe.transform(this.registerPatientForm.controls['date'].value, 'yyyy-MM-dd');

    this.allowEditPkgIcon = true;
    this.selectedEnrollId = item.id;
    this.defaultPkgDateShow = false;
    this.isEditIconEnable = true;
    

    if (item.isExistinPatient === true) { 
      this.selectedRowIndex = item.id;
    } else {
      this.selectedRowIndex = item.mainidentifier;
    }
  }

  isEnableCoster(event) {
    if (event === 'coaster') {
      this.isEnableCosterDropdown = true;
    } else {
      this.isEnableCosterDropdown = false;
    }
  }

  searchToCoster(event) {
    if(event.type === 'tagIdSearch' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          this.listItems = res.results;
          this.searchCosterlist = this.listItems;
        });
      } else {
        this.searchCosterlist = this.listItems;
      }
    } else {
      this.searchCosterlist = [];
    }
  }

  getRegisteredPatients(UHID) {

    if (UHID === null || UHID === '') {
      this.isEnabledTable = false;
      this.isDataNotFound = false;
      this.loading = false;
      this.data = [];
      this.dataSource = new MatTableDataSource<any[]>(this.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      return;
    }
    this.checkUHID = false;
    this.isEnabledTable = true;
    this.isDataNotFound = false;
    this.commonService.getRegisteredPatients(UHID,this.visitTypeId).subscribe(res => {
      if (res.statusCode !== 1) {
        this.checkUHID = true;
        this.isDataNotFound = true;
        this.isEnabledTable = false;
        this.toastr.warning('warning', `${res.message}`)
      }
      this.data = res.results;

      for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].isEnrolled === true) {
          this.data[i].status = 'Yes';
          this.data[i]['checked'] = false;
        } else {
          this.data[i].status = 'No';
          this.data[i]['checked'] = false;
        }
      }

      this.dataSource = new MatTableDataSource<any[]>(this.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loading = false;
    },
      error => {
        this.checkUHID = false;
        this.loading = false;
      });
  }

  clinicalDetails(event, type) {
    if (type === 'isDiabetic') {
      if (event.checked === true) {
        this.isDiabetic = true;
      } else {
        this.isDiabetic = false;
      }
    } else if (type === 'isFasting') {
      if (event.checked === true) {
        this.isFasting = true;
      } else {
        this.isFasting = false;
      }
    } else if (type === 'isVulnerable') {
      if (event.checked === true) {
        this.isVulnerable = true;
      } else {
        this.isVulnerable = false;
      }
    } else if (type === 'isPregnant') {
      if (event.checked === true) {
        this.isPregnant = true;
      } else {
        this.isPregnant = false;
      }
    }
  }

  getAssignFloor(data) {
    this.floorId = data;
  }

  getEnrollOption(data) {
   
    this.enrollVisitType = 'Follow up';
    if (data === false) {
      if (!this.isExisting) {
        this.enrollVisitType = 'New visit';
      }
      this.registerPatientForm.get('assignFloorId').setValue(null);
    } else {
      if (this.followupAssignFloorDetails.length > 0) {
        this.floorId = this.followupAssignFloorDetails[0].floorId;
        this.registerPatientForm.get('assignFloorId').setValue(this.followupAssignFloorDetails[0].floorId);
      }
    }
    this.registerPatientForm.get('assignFloorId').updateValueAndValidity();
  }
  enrollRegister() {
    this.buildForm();
    this.isEnabledTable = false;
    const id = '';
    
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-HC', 'visitType': 'VT-HC' }, 
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      
      const e = eval;
      this.enrollDetails = e(result);
      
    });

  }

  confirmDialogBox() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Enroll', message: 'Please choose the visit type',
        buttonText: { cancel: 'New visit', ok: 'Follow up' }, 'enrollVisitType': true, 'isRemark': 1
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.enrollVisitType = result;
      if (this.enrollVisitType === 'New visit' || this.enrollVisitType === 'Follow up') {
        this.saveRegisterPatient();
      }
    });
  }

  saveEnroll() {
  
    this.saveRegisterPatient();
  }

  public saveRegisterPatient() {
    this.isDisabled = true;
    this.createRegisterPatient = new CreateRegisterPatient(null, null, null, null, null, null, null, null, null, null,null,null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null,null);

    this.createRegisterPatient.mainidentifier = this.checkedRowData.mainidentifier;
    this.createRegisterPatient.firstName = this.checkedRowData.firstName;
    this.createRegisterPatient.lastName = this.checkedRowData.lastName;
    this.createRegisterPatient.age = this.checkedRowData.age;
    this.createRegisterPatient.birthDate = this._dateFormat.transform(this.checkedRowData.birthDate, 'yyyy-MM-dd');
    this.createRegisterPatient.gender = this.checkedRowData.gender;
    this.createRegisterPatient.mobileNo = this.checkedRowData.mobileNo;
    this.createRegisterPatient.patientVisitId = !this.registerPatientForm.controls.enrollVisit.value ? null : this.checkedRowData.patientVisitId;
    this.createRegisterPatient.id = this.checkedRowData.id;
    this.createRegisterPatient.tagSerialNumber = this.registerPatientForm.controls['tagSerialNumber'].value;
    this.createRegisterPatient.healthPlanId = !this.registerPatientForm.controls.enrollVisit.value ? this.healthPlanId : this.checkedRowData.healthPlanId;
    if((this.healthPlanId === null || this.checkedRowData.healthPlanId === null) && this.planSourceId !== null) {
      this.createRegisterPatient.planSourceId = this.planSourceId;
    }
    if(!this.registerPatientForm.controls.enrollVisit.value && this.registerPatientForm.controls.enrollVisit.value != null) {
      this.createRegisterPatient.isNew = true;
    } else if (this.registerPatientForm.controls.enrollVisit.value == null) {
      this.createRegisterPatient.isNew = false;
      this.createRegisterPatient.patientVisitId = this.patientVisitId;
    }

    /*
    Note : Enroll option removed the health paln, visit id based on current date by Jan 22, 2021

    if (this.checkPkgDate === this.selectedDate) {
      this.createRegisterPatient.healthPlanId = this.checkedRowData.healthPlanId;
      this.createRegisterPatient.patientVisitId = this.checkedRowData.patientVisitId;
    } else {
      this.createRegisterPatient.healthPlanId = null;
      this.createRegisterPatient.patientVisitId = null;
    }
    */


    this.createRegisterPatient.isDiabetic = this.isDiabetic;
    this.createRegisterPatient.isFasting = this.isFasting;
    this.createRegisterPatient.isVulnerable = this.isVulnerable;
    this.createRegisterPatient.isPregnant = this.isPregnant;

    if(this.visitTypeId === 'VT-HC' && this.registerPatientForm.get('isCheckOutProcessCounter')?.value != null){
      this.createRegisterPatient.isCheckOutProcessCounter = this.registerPatientForm.get('isCheckOutProcessCounter')?.value;
    }
    if (this.registerPatientForm.controls['vipTypeId'].value === 'null') {
      this.createRegisterPatient.vipTypeId = null;
    } else {
      this.createRegisterPatient.vipTypeId = this.registerPatientForm.controls['vipTypeId'].value;
    }
    this.createRegisterPatient.preferedLanguage = this.registerPatientForm.controls['preferedLanguage'].value;
    this.createRegisterPatient.externalRegionId = localStorage.getItem(btoa('externalRegionId'));

    if (this.isEnableCosterDropdown === true) {
      if (this.tokenEnrollFlow === true) {
        this.createRegisterPatient.tagTypeId = null;
      } else {
        this.createRegisterPatient.tagTypeId = this.tagTypeId;  
      }
    } else {
      this.createRegisterPatient.tagTypeId = 'TT-MB';
    }

    this.checkedRowData.packageDate = this._dateFormat.transform(this.checkedRowData.packageDate, 'yyyy-MM-dd');
    this.createRegisterPatient.packageDate = this._dateFormat.transform(this.registerPatientForm.controls['date'].value, 'yyyy-MM-dd');
    
    if (this.createRegisterPatient.packageDate !== this.checkedRowData.packageDate &&
      this.checkedRowData.packageDate != null && this.checkedRowData.patientVisitId != null && this.checkPkgDate === this.selectedDate) {
      this.createRegisterPatient.isPkgDateEdited = true;
    } else {
      this.createRegisterPatient.isPkgDateEdited = false;
    }

    if (this.isEditDate === true) {

      const pkgDate = this._dateFormat.transform(
        this.registerPatientForm.controls['date'].value, 'yyyy-MM-dd\'T\''
      );

      const pkgTime = this._dateFormat.transform(
        this.currentDate, 'HH:mm:ss.SSSZ'
      );
      const packDate = pkgDate.trim() + pkgTime.trim()
      this.createRegisterPatient.packageDate = this._dateFormat.transform(packDate, 'yyyy-MM-dd HH:mm:ss');

    } else {
      
      const date = this._dateFormat.transform(
        this.currentDate, 'yyyy-MM-dd\'T\''
      );

      const time = this._dateFormat.transform(
        this.currentDate, 'HH:mm:ss.SSSZ'
      );

      if (date !== null) {
        const packDate = date.trim() + time.trim();
        this.createRegisterPatient.packageDate = this._dateFormat.transform(packDate, 'yyyy-MM-dd HH:mm:ss');
      } else {
        this.createRegisterPatient.packageDate = null;
      }
    }

    this.createRegisterPatient.assignedFloorId = this.floorId;
    this.createRegisterPatient.tokenNumberId = this.tokenID;    
    if (((this.enrollVisitType === 'Follow up') || (!this.checkedRowData.tokenNo && this.checkedRowData.status === 'Yes')) && this.registerPatientForm.controls.enrollVisit.value) {
      const pkgDate = this._dateFormat.transform(
        this.currentDate, 'yyyy-MM-dd\'T\''
      );
      const pkgTime = this._dateFormat.transform(
        this.currentDate, 'HH:mm:ss.SSSZ'
      );
      const packDate = pkgDate.trim() + pkgTime.trim()
      this.createRegisterPatient.packageDate = this._dateFormat.transform(packDate, 'yyyy-MM-dd HH:mm:ss');
      this.createRegisterPatient.isPkgDateEdited = true;
      // this.createRegisterPatient.healthPlanId = !this.registerPatientForm.controls.enrollVisit.value ? this.healthPlanId : this.checkedRowData.healthPlanId;
      this.createRegisterPatient.patientVisitId = !this.registerPatientForm.controls.enrollVisit.value ? null : this.checkedRowData.patientVisitId;
      if((this.healthPlanId === null || this.checkedRowData.healthPlanId === null) && this.planSourceId !== null) {
        this.createRegisterPatient.planSourceId = this.planSourceId;
      }
    }

    this.createRegisterPatient.visitIdentifier = this.checkedRowData.visitIdentifier;
    if(this.checkedRowData && this.checkedRowData.id == null && this.checkedRowData.hasOwnProperty('patientVisitId') && this.checkedRowData.patientVisitId == null) {
      this.createRegisterPatient.tempPatientId = this.checkedRowData.tempPatientId;
      this.createRegisterPatient.visitIdentifier = this.checkedRowData.visitIdentifier;
      this.createRegisterPatient.packageIdentifier = this.checkedRowData.packageIdentifier;
      this.createRegisterPatient.packageName = this.checkedRowData.packageName;
      this.createRegisterPatient.packageDate = this._dateFormat.transform(this.currentDate, 'yyyy-MM-dd HH:mm:ss');
      this.createRegisterPatient.healthTests = this.checkedRowData.healthTests;
    }
    this.createRegisterPatient.healthPlanId = this.healthPlanEnabled? this.registerPatientForm.controls.healthPlanId.value :this.checkedRowData?.healthPlanId;
    this.createRegisterPatient.visitTypeId = this.workflowTypeId?.replace(/^[^-]+-/, 'VT-');
    console.log(this.createRegisterPatient);
    this.isDisabled = true;
    this.commonService.saveRegisteredPatients(this.createRegisterPatient).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }

      if (res.statusCode === 1) {
        this.isEnabledTable = false;
        this.defaultPkgDateShow = true;
        this.isEditIconEnable = false;
        this.registerPatientForm.reset();
        this.isDisabled = false;
      }

      this.toastr.success('Success', `${res.message}`);

      this.enrollDetails = res.results;
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-enroll-register-patient',
  templateUrl: './enroll-register.component.html',
  styleUrls: ['./enroll-patient.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },],
  
})

export class EnrollRegisterPatientComponent implements OnInit {

  public enrollPatientForm: FormGroup;
  public isDisabled = false;
  public createEnrollPatient: CreateEnrollPatient;
  public updateEnrollPatient: UpdateEnrollPatient;
  public createMedicalRecord: CreateMedicalRecord;
  public genderList: any;
  public genderCode: any;
  public matcher = new ErrorStateMatcherService();
  public isEnableCosterDropdown = true;
  public searchCosterlist: any;
  batteryPercentage = null;
  isCheck = false;
  checked = true;
  public vipList: Array<any> = [];
  public languageList: Array<any> = [];
  public tokenEnrollFlow: boolean;
  
  public assignFloorDetails: Array<any> = [];
  public enrollPatientConfig: any = null;
  public isModify = false;
  public floorId: any;
  public wardId: any;
  public bedList: Array<any> = [];
  public doctorList: Array<any> = [];
  public visitType = 'VT-HC';
  public height: any;

  @Input() max: Date | null;    
  today = new Date();
  curDate = new Date()
  tomorrow = new Date(this.curDate.setDate(this.curDate.getDate() + 1));
  healthPlanList: Array<any> = [];
  otProcedureList: Array<any> = [];
  public bedEnabled = false;
  public doctorEnabled = false;
  public roomEnabled = false;
  public surgeonEnabled = false;
  public surgeryEnabled = false;
  public serviceEnabled = false;
  public healthPlanEnabled = false;
  requireBedMatchVal: any[];
  requireDoctorMatchVal: any[];
  requireMRDoctorMatchVal: any[];
  requireSurgeryMatchVal: any[];
  public addNewSurgeon = null;
  public isAddNewSurgeon = false;
  public addNewSurgery = null;
  public isAddNewSurgery = false;
  public tagTypeId = null;
  public searchLocation: any = [];
  public locationIdEnabled = false;
  public requireLocationMatchVal: any = [];
  public searchLocationId = null;
  public isAddNewMRSurgeon = false;
  public addNewMRSurgeon = null;
  public isAddNewMRLocation = false;
  public addNewMRLocation = null;
  public workflowTypeId = null;
  public listItems1: any=[];
  searchLocationItems: any=[];
  searchAssociateCosterlist: any=[];
  searchAssociateCosterlistItems: any=[];
  public requireTestNameMatchVal: any = [];
  public testListItems: any;
  public selectedTestType: any;
  bedVisitList: any=[];
  bedOption: any=[];
  validDates: any=[];
  visitStartDate = null;
  visitEndDate = null;
  visitTime = null;
  visitDate = null;
  currentDate = null;
  emergencyPlanId = null;
  emergencyPlanName = null;
  activate_btn: any=[];
  public tempPatientId = null;
  otclickdata = false;
  isEmergency = false;
  departmentList : any=[];
  TokenList: any=[];
  toHit = false;
  enableAssignToken = false;
  tokenID = null;
  public countryOptions: Observable<any>;
  public countrycodeList = [];
  phoneNoValidation: any = /^[0-9]{8,13}$/;
  enableEnroll = false;
  phoneMessage = null;
  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog, private readonly dateAdapter: DateAdapter<Date>,
    public thisDialogRef: MatDialogRef<EnrollRegisterPatientComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService, private readonly _dateFormat: DatePipe, public hospitalServices : HospitalService,private readonly configurationServices: ConfigurationService,public apptermsService:ApptermsService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.today.setDate(this.today.getDate());
    if(this.data.hasOwnProperty('tempPatientId')) {
      this.tempPatientId = this.data.tempPatientId
    }
  }

  ngOnInit() {
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if(res.statusCode == 1) {
        const ipView = res.results['contentObject'];
        if(ipView.hasOwnProperty('enableAssignToken')) {
          this.enableAssignToken = ipView.enableAssignToken;
          if (this.enableAssignToken && !this.isModify) {
            this.enrollPatientForm?.get('enrolltoken').setValidators(Validators.required);
            this.enrollPatientForm?.get('enrolltoken').updateValueAndValidity();
          } else {
            this.enrollPatientForm?.get('enrolltoken').setValidators(null);
            this.enrollPatientForm?.get('enrolltoken').updateValueAndValidity();
          }
        }
      }
    });

    if(this.data.hasOwnProperty('tempPatientInfo') && this.data.tempPatientInfo) {
      this.data.firstName = this.data.tempPatientInfo.firstName;
      this.data.lastName = this.data.tempPatientInfo.lastName;
      this.data.gender = this.data.tempPatientInfo.gender;
      this.data.mobileNo = this.data.tempPatientInfo.mobileNo;
    }

    if (this.data.hasOwnProperty('visitType') && (this.data.visitType === 'VT-MR')) {
      const curDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
      const compareDate = this._dateFormat.transform(new Date(this.data.filterMRDate), 'yyyy-MM-dd');
      if (curDate < compareDate) {
        this.today.setDate(new Date(this.data.filterMRDate).getDate());
      } else {
        this.today.setDate(this.today.getDate());
      }
    }

    this.workflowTypeId = this.data.workflowTypeId;
    // assign floor details

    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.assignFloorDetails = res.results.contentObject['assign-floor'].filter(filter => filter.isFollowup === 'false');
      }
    });

    if (this.data.hasOwnProperty('visitType') && (this.data.visitType === 'VT-IP' || this.data.visitType === 'VT-EC' || this.data.visitType === 'VT-RE' || this.data.visitType === 'VT-OP' || this.data.visitType === 'VT-MR' || this.data.visitType === 'VT-DC')) {
      if (this.data.visitType === 'VT-RE') {
        this.visitType = 'VT-RE';
      } else if (this.data.visitType === 'VT-OP') {
        this.visitType = 'VT-OP';
      } else if (this.data.visitType === 'VT-MR') {
        this.visitType = 'VT-MR';
      } else if (this.data.visitType === 'VT-DC') {
        this.visitType = 'VT-DC';
      } else if (this.data.visitType === 'VT-EC') {
        this.visitType = 'VT-EC';
        this.commonService.getConfigFile('default-healthplan').subscribe(res => {
          if (res.results != null) {
            this.healthPlanList.push(JSON.parse(res.results.content));
            this.emergencyPlanId = this.healthPlanList[0].id;
            this.emergencyPlanName = this.healthPlanList[0].name;
            this.enrollPatientForm.get('healthPlanId').setValue(this.emergencyPlanName);
            this.enrollPatientForm.get('healthPlanId').setValidators(Validators.required);
          }
        });
      } else {
        this.visitType = 'VT-IP';
      }
      if (this.data.id) {
        this.commonService.getInpatientListByVisitId(this.data.id).subscribe(res => {
          this.data = { ...res.results, ...this.data };
          this.genderCode = this.data.gender;
          this.floorId = this.data.assignedFloorId;
          this.enrollPatientForm.get('countryCode').setValue(this.data?.countryCode);
          if(this.data?.mobileNo && this.data?.mobileNo !== null) {
            this.phoneNumber('disable');
          }
          let visitListArrays = this.enrollPatientForm.get('visitList') as FormArray;
          visitListArrays.controls[0].patchValue(
            { "bedId": this.data.visitEvent !== 'VE-OT' && this.visitType !== 'VT-EC' ? this.data.bedName : this.data.bedName ? this.data.bedName : null,
              "visitDate": this.data.enrollOT && (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC') ? this.today : this.data.visitDate ? this.data.visitDate : null });
          this.enrollPatientForm.patchValue({
            'firstName': this.data.firstName,
            'middleName': this.data.middleName,
            'lastName': this.data.lastName,
            'gender': this.data.gender,
            'mobileNo': this.data.mobileNo,
            'assignFloorId': this.data.assignedFloorId,
            'birthDate': this.data.birthDate,
            'bedId': this.data.bedName ? this.data.bedName : null,
            'doctorId': this.data.doctorName ? this.data.doctorName : null,
            'tagSerialNumber':this.data.tagId, 
            'mainidentifier' : this.data.mainidentifer ? this.data.mainidentifer : null
          });
          setTimeout(() => {this.mobileNoErrorToastr()},500);
        });
      }
    } else {
      this.visitType = 'VT-HC';
    }

    this.buildForm();

    
    this.tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));
    
    if (this.tokenEnrollFlow === false) {
      this.enrollPatientForm.get('mobileNo').setValidators([Validators.required, Validators.pattern('^[0-9-+()]*$')]);
      this.enrollPatientForm.get('mobileNo').updateValueAndValidity();
      this.enrollPatientForm.get('gender').setValidators(Validators.required);
      this.enrollPatientForm.get('gender').updateValueAndValidity();
      this.enrollPatientForm.get('birthDate').setValidators(Validators.required);
      this.enrollPatientForm.get('birthDate').updateValueAndValidity();

      if (this.enrollPatientForm.get('coster').value === 'coaster') {
        this.enrollPatientForm.get('tagSerialNumber').setValidators(Validators.required);
        this.enrollPatientForm.get('tagSerialNumber').updateValueAndValidity();
      }

      this.enrollPatientForm.get('coster').valueChanges
        .subscribe(value => {
          if (value === 'mobile') {
            this.enrollPatientForm.get('tagSerialNumber').setValidators(null);
            this.enrollPatientForm.controls['tagSerialNumber'].setValue(null);
          }
          if (value === 'coaster') {
            this.enrollPatientForm.get('tagSerialNumber').setValidators(Validators.required);
          }
          this.enrollPatientForm.get('tagSerialNumber').updateValueAndValidity();
        });
      this.enrollPatientForm.get('tagSerialNumber').valueChanges
        .subscribe(value => {
          if (value != null && value.lastIndexOf('~') > -1) {
            const splitValue = value.split('=');
            
            const costerId = splitValue[1].substring(0, 9);
            if (costerId.length <= 9 && costerId.toString().match(/^\d*$/)) {
              this.enrollPatientForm.get('tagSerialNumber').setValue(costerId);
              this.enrollPatientForm.get('tagSerialNumber').updateValueAndValidity();
            }
          }
        });
    }

    if (this.tokenEnrollFlow === true && this.assignFloorDetails.length > 0) {
      this.enrollPatientForm.get('assignFloorId').setValidators(Validators.required);
      this.enrollPatientForm.get('assignFloorId').updateValueAndValidity();
    }

    if (this.visitType === 'VT-EC' || this.visitType === 'VT-HC') {
      this.enrollPatientForm.get('healthPlanId').setValidators([Validators.required,
        !this.data.patientId ? this.requireSurgeryMatch.bind(this) : '']);
    } else if (this.visitType === 'VT-EC') {
      this.enrollPatientForm.get('healthPlanId').setValue(this.emergencyPlanName);
      this.enrollPatientForm.get('healthPlanId').setValidators(Validators.required);
    } else if (this.data.visitEvent === 'VE-OT') {
      this.enrollPatientForm.get('healthPlanId').setValidators(!this.data.patientId ? this.requireSurgeryMatch.bind(this) : '');
    } else {
      this.enrollPatientForm.get('healthPlanId').setValidators(null);
    }
    this.enrollPatientForm.get('healthPlanId').updateValueAndValidity();

    if (this.visitType === 'VT-OP') {
      this.enrollPatientForm.get('testId').setValidators([Validators.required,
        this.requireTestNameMatch.bind(this)]);
        this.enrollPatientForm.get('startDate').setValue(this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss'));
        this.enrollPatientForm.get('startDate').setValidators([Validators.required]);
    } else {
      this.enrollPatientForm.get('testId').setValidators(null);
      this.enrollPatientForm.get('startDate').setValidators(null);
    }
    this.enrollPatientForm.get('testId').updateValueAndValidity();
    this.enrollPatientForm.get('startDate').updateValueAndValidity();

    if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC' || this.visitType === 'VT-RE' || this.visitType === 'VT-OP') {
      if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC') {
        this.enrollPatientForm.get('doctorId').setValidators([
          !this.data.patientId ? this.requireDoctorMatch.bind(this) : '']);
      } else {
        const doctorValidators = [];
        if (this.enrollPatientConfig && this.enrollPatientConfig['mandatoryFields'].includes('doctorId')) {
          doctorValidators.push(Validators.required);
        }
        if (!this.data.patientId) {
          doctorValidators.push(this.requireDoctorMatch.bind(this));
        }
        this.enrollPatientForm.get('doctorId').setValidators(doctorValidators);
        // this.enrollPatientForm.get('doctorId').setValidators([Validators.required,
        // !this.data.patientId ? this.requireDoctorMatch.bind(this) : '']);
      }
    } else {
      this.enrollPatientForm.get('doctorId').setValidators(null);
    }
    this.enrollPatientForm.get('doctorId').updateValueAndValidity();

    
    this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList = res.results;
    });

    
    this.commonService.getAppTermsVerion2('Language').subscribe(res => {
      this.languageList = res.results;
    });

    
    this.commonService.getAppTermsVerion2('VipType').subscribe(res => {
      this.vipList = res.results;
    });
    if(this.visitType == 'VT-IP') {
    this.commonService.getConfigFile('enroll-patient').subscribe(res => {
      if (res.results != null) {
        this.enrollPatientConfig = res.results.contentObject;
        if(this.enrollPatientConfig != null) {
          let mandatoryFields = this.enrollPatientConfig.mandatoryFields;
          for(let i in mandatoryFields) {
            this.enrollPatientForm.get(mandatoryFields[i]).setValidators(Validators.required);
            this.enrollPatientForm.get(mandatoryFields[i]).updateValueAndValidity();
          }
        }
      }
    });
    }
    if((this.visitType == 'VT-HC' || this.visitType == 'VT-OP') && this.data.id && this.data.hasOwnProperty('mainidentifier')) {
      this.isModify = true;
      this.getUHID(this.data.mainidentifier)
    }
    this.configurationServices.getAssetDepartment().subscribe(res => {
      this.departmentList = res.results.map(({ id, name }) => ({ id, name}));
    });
      this.commonService.getAppTermsVerion2('CountryCode').subscribe(res => {
        this.countrycodeList = res.results;
        if (!this.data?.countryCode && !this.data.id) {
          this.apptermsService.setDefaultValue(this.enrollPatientForm, 'countryCode', this.countrycodeList, 'code');
          this.getPhoneValidate(this.enrollPatientForm.controls['countryCode']?.value, 'code')
        }
      });
      this.countryOptions = this.enrollPatientForm.controls['countryCode'].valueChanges.pipe(
        startWith(...[null as string | null]),
        map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
      );
      this.configurationServices.getConfigFile('validation-config').subscribe((res) => {
        if (res.statusCode === 1) {
          const dynamicColumns = res.results.contentObject;
          this.phoneNoValidation = dynamicColumns?.pattern.mobileNo;
          this.setDynamicValidation('mobileNo', this.phoneNoValidation);
        }
      });
    }

    phoneNumber(type) {
      if(type === 'enable') {
        this.enrollPatientForm.controls['mobileNo'].enable();
        this.enrollPatientForm.controls['countryCode'].enable();
        this.enrollPatientForm.controls['countryCode'].setValue(null);
        this.enrollPatientForm.controls['mobileNo'].setValue(null);
        this.setDynamicValidation('mobileNo', this.phoneNoValidation);
      } else {
        this.enrollPatientForm.controls['mobileNo'].disable();
        this.enrollPatientForm.controls['countryCode'].disable();
      }
    }
    
    setDynamicValidation(controlName: string, pattern: string) {
      if (!pattern) return;
      const control = this.enrollPatientForm.get(controlName);
      if (!control) return;
      const regex = new RegExp(pattern);
      control.setValidators([Validators.required, Validators.pattern(regex)]);
      control.updateValueAndValidity();
      if(this.visitType === 'VT-IP') {
        if(this.enrollPatientConfig?.hasOwnProperty('mandatoryFields') && this.enrollPatientConfig['mandatoryFields']?.includes('mobileNo')) {
          this.enrollPatientForm.get('mobileNo').setValidators(Validators.required);
          this.enrollPatientForm.get('mobileNo').updateValueAndValidity();
          this.enrollPatientForm.get('countryCode').setValidators(Validators.required);
          this.enrollPatientForm.get('countryCode').updateValueAndValidity();
        } else {
          this.enrollPatientForm.get('mobileNo').setValidators(null);
          this.enrollPatientForm.get('mobileNo').updateValueAndValidity();
          this.enrollPatientForm.get('countryCode').setValidators(null);
          this.enrollPatientForm.get('countryCode').updateValueAndValidity();
        }
      }
    }


  mobileNoErrorToastr() {
    const control = this.enrollPatientForm.get('mobileNo');
    if (control && control.invalid) {
      control.markAsTouched();
    }
  }

  updateEmergency(data){
    this.isEmergency = data;
  }
  onWindowResized(size) {
    this.height = size;
  }

// based on data key patientSource healthPlanId field is made mandatory /non -mandatory along  enable or readonly validator method.
  updateHealthPlanValidation(): void {
    const healthPlanId = this.enrollPatientForm.get('healthPlanId');
    if (!healthPlanId) return;
    const isTempOrExternal = this.data?.patientSource === 'TEMPORARY_PATIENT' || this.data?.patientSource === 'EXTERNAL_API';
    const isToday = this._dateFormat.transform(this.today, 'dd/MM/yyyy') === this._dateFormat.transform(this.data?.packageDate, 'dd/MM/yyyy');
    // Condition to disable ( package date need to match current date)
    const shouldDisable = isToday ;
    if (shouldDisable) {
      healthPlanId.clearValidators();
      healthPlanId.disable({ emitEvent: false });
      healthPlanId.setValue(this.data?.packageName);
      healthPlanId.setErrors(null);
    } else {
      healthPlanId.enable({ emitEvent: false });
      healthPlanId.setValidators(this.requireSurgeryMatch.bind(this));
    }
    this.enableEnroll = true;
    healthPlanId.updateValueAndValidity({ emitEvent: false });
  }

  private requireBedMatch(control: FormControl): ValidationErrors | null {
    if(control.value !== null && control.value !== '') {
    this.requireBedMatchVal = this.bedList.filter(resFilter => resFilter.bedId === control.value || resFilter.id === control.value);
    if(this.data.id && this.data.bedId !== null){
      if(this.data.bedName === control.value){
        this.requireBedMatchVal = this.data.bedName;
      }
    }
    if (this.requireBedMatchVal && this.requireBedMatchVal.length === 0) {
        
        return { requireMatch: true };
      }
    }
    return null;
  }
  private requireDoctorMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
      this.requireDoctorMatchVal = this.doctorList.filter(resFilter => resFilter.id === control.value);
      if(this.visitType === 'VT-DC' || this.data.visitEvent === 'VE-OT') { 
        if(this.data.doctorName == control.value) {
          return null
        }
        if (this.requireDoctorMatchVal.length === 0) {
        return { requireMatch: true };
      }
      } else {
          if (this.requireDoctorMatchVal.length === 0) {
          this.addNewSurgeon = control.value;
          this.isAddNewSurgeon = true;
        } else {
          this.isAddNewSurgeon = false;
        }
      }
    }
    return null;
  }  
  private requireSurgeryMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
      this.requireSurgeryMatchVal = this.healthPlanList.filter(resFilter => resFilter.id === control.value);
      if (this.requireSurgeryMatchVal.length === 0 && this.visitType !== 'VT-EC') {
        this.addNewSurgery = control.value;
        this.isAddNewSurgery = true;
      } else {
        this.isAddNewSurgery = false;
      }
    }
    return null;
  }

  public buildForm() {
    this.enrollPatientForm = this.form.group({
      mainidentifier: [this.data.mainidentifier ? this.data.mainidentifier : null],
      firstName: [this.data.firstName ? this.data.firstName : null, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      middleName: [this.data.middleName ? this.data.middleName : null, [Validators.maxLength(50)]],
      lastName: [this.data.lastName ? this.data.lastName : null, [Validators.maxLength(50)]],
      birthDate: [null],
      gender: [this.data.gender ? this.data.gender : null],
      mobileNo: this.visitType === 'VT-OP' && (this.enrollPatientConfig && this.enrollPatientConfig['mandatoryFields'].includes('mobileNo')) ? [this.data.mobileNo ? this.data.mobileNo: null, [Validators.required, Validators.pattern(this.phoneNoValidation)],] : [this.data.mobileNo ? this.data.mobileNo : null, [Validators.pattern(/(^[0-9]{9,11}$)/)]],
      email: [this.data.email ? this.data.email : null, [Validators.email]],
      healthPlanId: [this.visitType === 'VT-EC' ? this.emergencyPlanName : null],
      tagSerialNumber: [this.data.tagSerialNumber ? this.data.tagSerialNumber : null],
      coster: ['coaster'],
      isDiabetic: new FormControl(this.visitType === 'VT-HC' ? null : false),
      isFasting: new FormControl(false),
      isVulnerable: new FormControl(false),
      isPregnant: new FormControl(false),
      vipTypeId: [this.data.vipTypeId ? this.data.vipTypeId : null],
      preferredLanguage: [this.data.preferredLanguage ? this.data.preferredLanguage : null],
      languagesKnown: [this.data.languagesKnown ? this.data.languagesKnown : null],
      assignFloorId: [null],
      bedId: [null],
      doctorId: [null ,this.requireDoctorMatch.bind(this)],
      volume: [null],
      deliveryLocationId: [null, [this.requireLocationMatch.bind(this)]],
      requestedDoctorId: [null, [this.requireMRDoctorMatch.bind(this)]],
      requestedFromDate: [this.today],
      requestedToDate: [null],
      testId: [null, [this.requireTestNameMatch.bind(this)]],
      packageDate: [null],
      startDate: [null],
      isPreBooked: [this.data.isPreBooked ? this.data.isPreBooked : false],
      visitList: this.form.array([this.editVisit(0)]),
      departmentId:[this.data.departmentId ? this.data.departmentName : null],
      enrolltoken: [null],
      countryCode: [null, [Validators.required, Validators.pattern('^[+][0-9]{1,5}$')]],
      isCheckOutProcessCounter: [this.visitType == 'VT-HC' ? true : null]
    });
    if (this.enableAssignToken && !this.isModify) {
      this.enrollPatientForm.get('enrolltoken').setValidators(Validators.required);
      this.enrollPatientForm.get('enrolltoken').updateValueAndValidity();
    } else {
      this.enrollPatientForm.get('enrolltoken').setValidators(null);
      this.enrollPatientForm.get('enrolltoken').updateValueAndValidity();
    }
  }

  onChangeClinicalDetails(event, type) {
    if (type === 'isDiabetic') {
      this.enrollPatientForm.get('isDiabetic');
    } else if (type === 'isFasting') {
      if (event.checked === true) {
        this.enrollPatientForm.get('isFasting').setValue(true);
      } else {
        this.enrollPatientForm.get('isFasting').setValue(false);
      }
    } else if (type === 'isVulnerable') {
      if (event.checked === true) {
        this.enrollPatientForm.get('isVulnerable').setValue(true);
      } else {
        this.enrollPatientForm.get('isVulnerable').setValue(false);
      }
    } else if (type === 'isPregnant') {
      if (event.checked === true) {
        this.enrollPatientForm.get('isPregnant').setValue(true);
      } else {
        this.enrollPatientForm.get('isPregnant').setValue(false);
      }
    }
  }

  onMobileInput() {
    const control = this.enrollPatientForm.get('mobileNo');
    const value = control?.value;
    if (control?.valid) {
      this.getPhoneValidate(value, 'phone');
    }
  }

  getPhoneValidate(data, type) {
    const code = type === 'code' ? data : this.enrollPatientForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if(res.results) {
        if(type === 'code') {
          const length = res.results?.length;
          if(this.visitType === 'VT-IP') {
            if(this.enrollPatientConfig?.hasOwnProperty('mandatoryFields') && this.enrollPatientConfig['mandatoryFields']?.includes('mobileNo')) {
              this.enrollPatientForm.get('mobileNo').setValidators([Validators.required,Validators.pattern(`^[0-9]{${length}}$`)]);
              this.enrollPatientForm.get('mobileNo').updateValueAndValidity();
            } else {
              this.enrollPatientForm.get('mobileNo').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
              this.enrollPatientForm.get('mobileNo').updateValueAndValidity();
            }
          }
        }
      } else {
        const control = this.enrollPatientForm.get('mobileNo');
        control?.setErrors({ invalidPhone: true });
        this.phoneMessage = res.message;
      }
    });
  }

  searchToken(event) {
    this.toHit = event.toHit;
    if (event.text.length >= 2) {
      if (event.toHit == true && this.enableAssignToken) {
        this.commonService.searchToken(event.text, null).subscribe(res => {
          this.TokenList = res.results;
          if(this.TokenList.length == 1) {
            this.enrollPatientForm.get('enrolltoken').setValue(this.TokenList[0].tokenNumber);
            this.enrollPatientForm.get('assignFloorId').setValue(this.TokenList[0].floorId);
          }
        });}
      }
  }
  onTokenSelected(tokenNumber: string) {
    const selectedToken = this.TokenList.find(token => token.tokenNumber === tokenNumber);
    if (selectedToken) {
        const selectedTokenId = selectedToken.id;
        this.tokenID = selectedTokenId;
        this.floorId = selectedToken.floorId;
        this.enrollPatientForm.get('assignFloorId').setValue(this.floorId);
    }
  }

  clearChild(type) {
    if(type === 'healthPlan') {
        this.enrollPatientForm.controls.healthPlanId?.setValue(null);
        this.healthPlanList = [];
    }
  }

  private addVisit() {
    const control = <FormArray>this.enrollPatientForm.controls['visitList'];
    control.push(this.getVisit());
  }

  removeVisit(i: number, type) {
    const control = <FormArray>this.enrollPatientForm.controls['visitList'];
    if (this.enrollPatientForm.controls['visitList'].value[i].hasOwnProperty('bedId') &&
    this.enrollPatientForm.controls['visitList'].value[i].bedId !== null) {
    this.bedOption = this.bedOption.filter(x => this.enrollPatientForm.controls['visitList'].value[i].bedId.indexOf(x) === -1);
  }
    control.removeAt(i);
    if (type === 'clear' && control.length <= 0) {
      this.addVisit();
    }
  }

  private getVisit() {
    if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC' || this.visitType === 'VT-RE') {
      if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC') {
        return this.form.group({
          id: [null],
          visitDate: [this.visitType !== 'VT-DC' ? this.today : null, [Validators.required]],
          bedId: [null, [!this.data.patientId ? this.requireBedMatch.bind(this) : '']],
        });
      } else {
        const bedValidators = [];
        if (this.enrollPatientConfig && this.enrollPatientConfig['mandatoryFields'].includes('bedId')) {
          bedValidators.push(Validators.required);
        }        
        if (!this.data.patientId) {
          bedValidators.push(this.requireBedMatch.bind(this));
        }        
        return this.form.group({
          id: [null],
          visitDate: [this.visitType !== 'VT-DC' ? this.today : null, [Validators.required]],
          bedId: [null, bedValidators],
        });
      }
    } else {
      return this.form.group({
        id: [null],
        visitDate: [null],
        bedId: [null],
      });
    }
  }
  filterBedOptions(value) {
    if (value !== null) {
      this.bedOption.push(value);
    } else {
      this.bedOption = [];
    }
  }
  private editVisit(i) {
    if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC' || this.visitType === 'VT-RE') {
      if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC') {
        return this.form.group({
          id: [null],
          visitDate: [this.visitType !== 'VT-DC' ?  this._dateFormat.transform(this.today, 'yyyy-MM-ddTHH:mm') : null, [Validators.required]],
          bedId: [null, [!this.data.patientId ? this.requireBedMatch.bind(this) : '']],
        });
      } else {
        const bedValidators = [];
        if (this.enrollPatientConfig && this.enrollPatientConfig['mandatoryFields'].includes('bedId')) {
          bedValidators.push(Validators.required);
        }        
        if (!this.data.patientId) {
          bedValidators.push(this.requireBedMatch.bind(this));
        }
        return this.form.group({             
          id: [null],
          visitDate: [this.visitType !== 'VT-DC' ?  this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm') : null, [Validators.required]],
          bedId: [null, bedValidators],
        });
      }
    } else {
      return this.form.group({
        id: [null],
        visitDate: [null],
        bedId: [null],
      });
    }
  }
  dateFilter = (d: Date | null): boolean => {
    if(this.visitType === 'VT-DC') {
      this.validDates = [];
      const control = <FormArray>this.enrollPatientForm.controls['visitList'];
      for (let i = 0; i < control.length; i++) {
        this.validDates.push(new Date(this.enrollPatientForm.controls['visitList'].value[i].visitDate));
      }
      const day = (new Date(d) || new Date()).getTime();
      return !this.validDates.find(x=>x.getTime()==day);
    } else {
      return true;
    }
  }
  getDoctorList(type, id) {
    if (id) {
      if (type === 'doctor') {
        const doctors = this as any as { id: string, name: string }[]
        return doctors.find(obj => obj.id === id).name
      } else if (type === 'surgeon') {
        const doctors = this as any as { id: string, name: string }[]
        return doctors.find(obj => obj.id === id).name
      }
    } else {
      return ''
    }
  }
  displayDoctorName = (doctorId: number): string => {
    const patient = this.doctorList.find(p => p.id === doctorId);
    return patient ? patient.name:this.data? this.data.doctorName: null;
  };

    validateSelection(){
     const searchControl = this.enrollPatientForm.get('doctorId');
    if (!searchControl) return;
    const enteredValue = searchControl.value;
    const isValid = this.doctorList.some(d => d.id === enteredValue);
    if (!isValid) searchControl.setValue(null);  
  }
  getBedList(type, id) {
    if (id) {
      if (type === 'bed') {
        const bed = this as any as { bedId: string, bedName: string, locationId: string, locationName: string }[]
        let bedId;
        let loctionName = bed.find(obj => obj.bedId === id).locationName;
        if(loctionName === undefined){
          bedId = bed.find(obj => obj.bedId === id).bedName;
        }else{
          bedId = bed.find(obj => obj.bedId === id).bedName + ', ' + loctionName;
        }
        return bedId;
      } else if (type === 'OTRoom') {
        const room = this as any as { id: string, name: string }[];
        const roomId = room.find(obj => obj.id === id).name;
        return roomId;
      }
    } else {
      return '';
    }
  }

  getSurgeryList(type, id) {
    if (id && (type === 'surgery' || type === 'healthPlan')) {
      const surgery = this as any as { id: string, name: string }[];
      return surgery.find(obj => obj.id === id).name;
    } else {
      return '';       
    }
  }

  getTestList(type, id) {
    if (id && (type === 'service')) {
      const service = this as any as { id: string, name: string }[];
      return service.find(obj => obj.id === id).name;
    } else {
      return '';
    }
  }
  clearUHID(event) {
    if (event.target.value === '') {
      this.enrollPatientForm.reset();
      this.enrollPatientForm.patchValue({
        'requestedFromDate': this.today
      });
      if (this.visitType === 'VT-EC') {
        const arrays = this.enrollPatientForm.get('visitList') as FormArray;
        arrays.controls[0].patchValue({ 'visitDate': this.today });
        this.enrollPatientForm.get('healthPlanId').setValue(this.emergencyPlanName);
        this.enrollPatientForm.get('healthPlanId').setValidators(Validators.required);
      }
    }
  }
  getUHID(value, reload = true) {
    if (value === '') {
      this.enrollPatientForm.reset();
      this.enrollPatientForm.patchValue({
        'requestedFromDate': this.today
      });
    }
    const uhid = value;
    if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC') {
      const arrays = this.enrollPatientForm.get('visitList') as FormArray;
      arrays.controls[0].patchValue({ 'visitDate': this.today });
    }
    if (this.visitType === 'VT-EC') {
      this.enrollPatientForm.get('healthPlanId').setValue(this.emergencyPlanName);
      this.enrollPatientForm.get('healthPlanId').setValidators(Validators.required);
    }
    this.commonService.getUHID(uhid,this.tempPatientId,null,null,this.visitType).subscribe(res => {
      if (res.statusCode !== 0) {
      const visitEvent = this.data.visitEvent;
      this.data = res.results;
      if (visitEvent === 'VE-OT' && this.data.patientVisitId !== null) {
        this.data.enrollOT = true;
      }
      if(this.data?.mobileNo && this.data?.mobileNo !== null) {
        this.phoneNumber('disable');
      }
      this.data.visitEvent = visitEvent;
      this.genderCode = this.data.gender;
      this.floorId = this.data.assignedFloorId;
      this.data.visitType = this.visitType;
        if (this.visitType === 'VT-OP' && this.isModify) {
          if (this.data?.testName && this.data?.testId) {
            this.serviceEnabled = true;
            this.testListItems = [{ id: this.data.testId, name: this.data.testName }]
            this.enrollPatientForm.get('testId').setValue(this.data.testId);
            this.enrollPatientForm.get('testId').updateValueAndValidity()
          }
          if (this.data?.doctorName && this.data?.doctorId) {
            this.doctorEnabled = true;
            this.doctorList = [{ id: this.data.doctorId, name: this.data.doctorName }]
            this.enrollPatientForm.get('doctorId').setValue(this.data.doctorId);
            this.enrollPatientForm.get('doctorId').updateValueAndValidity()
          }
        }
      this.enrollPatientForm.patchValue({
        'mainidentifier': this.data.mainidentifier,
        'firstName': this.data.firstName,
        'middleName': this.data.middleName,
        'lastName': this.data.lastName,
        'gender': this.data.gender,
        'mobileNo': this.data.mobileNo,
        'assignFloorId': this.data.assignedFloorId,
        'birthDate': this.data.birthDate,
        'bedId': this.data.bedId ? this.data.bedId + ', ' + this.data.bedName : null,
        'doctorId': this.visitType === 'VT-OP' && this.isModify ? this.data.doctorId : this.data.doctorId ? this.data.doctorId + ', ' + this.data.doctorName : null,
        'requestedFromDate': this.today,
        'email': this.data.email,
        'countryCode': this.data.countryCode,
        'vipTypeId': this.data.vipTypeId,
        'isDiabetic': this.data.isDiabetic,
        'isFasting': this.data.isFasting,
        'isVulnerable': this.data.isVulnerable,
        'isPregnant': this.data.isPregnant
      });
        if (this.visitType === 'VT-OP' && this.isModify) {
          const testId = this.enrollPatientForm.get('testId');
          testId.clearValidators();
          testId.setErrors(null);
          const doctorId = this.enrollPatientForm.get('doctorId');
          doctorId.clearValidators();
          doctorId.setErrors(null);
          const startDate = this.enrollPatientForm.get('startDate');
          startDate.clearValidators();
          startDate.setErrors(null);
        }
      if(this.data.id == null && this.data.tempPatientId == null && this.data.healthPlanId != null) {
        this.healthPlanEnabled = true;
        this.healthPlanList = [{id : this.data.healthPlanId, name : this.data.packageName}]
        this.enrollPatientForm.get('healthPlanId').setValue(this.data.healthPlanId);
        this.enrollPatientForm.get('healthPlanId').updateValueAndValidity()
        if(reload) {
          this.getUHID(value, false);
        }
      }else{
        this.updateHealthPlanValidation()
      }
      setTimeout(() => {this.mobileNoErrorToastr()},500);
    } else {
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.enrollPatientForm.reset();
        this.enrollPatientForm.patchValue({
          'requestedFromDate': this.today
        });
        this.data.mainidentifier = uhid;
        this.buildForm();
    
        if (this.visitType === 'VT-HC') {
          this.enrollPatientForm.get('healthPlanId').setValidators([Validators.required,
            !this.data.patientId ? this.requireSurgeryMatch.bind(this) : '']);
        } else if (this.visitType === 'VT-EC') {
          this.enrollPatientForm.get('healthPlanId').setValue(this.emergencyPlanName);
          this.enrollPatientForm.get('healthPlanId').setValidators(Validators.required);
        } else if (this.data.visitEvent === 'VE-OT') {
          this.enrollPatientForm.get('healthPlanId').setValidators(!this.data.patientId ? this.requireSurgeryMatch.bind(this) : '');
        } else {
          this.enrollPatientForm.get('healthPlanId').setValidators(null);
        }
        this.enrollPatientForm.get('healthPlanId').updateValueAndValidity();
    
        if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC' || this.visitType === 'VT-RE' || this.visitType === 'VT-OP') {
          if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC' || this.visitType === 'VT-DC') {
            this.enrollPatientForm.get('doctorId').setValidators([
              !this.data.patientId ? this.requireDoctorMatch.bind(this) : '']);
          } else {
            const doctorValidators = [];
            if (this.enrollPatientConfig && this.enrollPatientConfig['mandatoryFields'].includes('doctorId')) {
              doctorValidators.push(Validators.required);
            }
            if (!this.data.patientId) {
              doctorValidators.push(this.requireDoctorMatch.bind(this));
            }
            this.enrollPatientForm.get('doctorId').setValidators(doctorValidators);
          }
        } else {
          this.enrollPatientForm.get('doctorId').setValidators(null);
        }
        this.enrollPatientForm.get('doctorId').updateValueAndValidity();
      }
      this.toastr.warning('warning', `${res.message}`)
      if(res.statusCode === 0) {
        this.enrollPatientForm.reset();
        this.enrollPatientForm.setValue({
          'requestedFromDate': this.today});
      }
    } 
      });
      if(this.visitType === 'VT-HC' && this.data.id) {
        this.enrollPatientForm.get('healthPlanId').setValidators(null)
        this.enrollPatientForm.get('healthPlanId').updateValueAndValidity()
      }      
  }
  isEnableCoster(event) {
    if (event === 'coaster') {
      this.isEnableCosterDropdown= true;
    } else {
      this.isEnableCosterDropdown = false;
    }
  }
  searchToCoster(event) {
    if(event.type === 'associateTagId' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.batteryPercentage = null;
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          this.searchAssociateCosterlistItems = res.results;
          this.searchAssociateCosterlist = this.searchAssociateCosterlistItems;
        });
      } else {
        this.searchAssociateCosterlist = this.searchAssociateCosterlistItems;
      } 
    } else {
      this.searchAssociateCosterlist = [];
    }
    if(event.type === 'coasterId' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          this.listItems1 = res.results;
          this.searchCosterlist = this.listItems1;
        });
      } else {
        this.searchCosterlist = this.listItems1;
      }
    } else {
      this.searchCosterlist = [];
    }
  }
  getTagTypeId(tagTypeId) {
    this.tagTypeId = tagTypeId;
  }
  getGenderType(data) {
    this.genderCode = data;
  }

  getAssignFloor(data) {
    this.floorId = data;
  }
  getWardLocation(wardId) {
    console.log(wardId);
    this.wardId = wardId;

  }
  searchAssociationDetails(name, type, event, i) {    
    if(i !== null) {
      this.currentDate = this._dateFormat.transform(this.today, 'yyyy-MM-dd');
      this.visitDate = this._dateFormat.transform(this.enrollPatientForm.controls['visitList'].value[i].visitDate, 'yyyy-MM-dd');
      this.visitTime = this._dateFormat.transform(this.today, 'HH:mm:ss');
      if (this.visitDate === this.currentDate) {
        this.visitStartDate = this._dateFormat.transform(this.enrollPatientForm.controls['visitList'].value[i].visitDate, 'yyyy-MM-dd') + ' ' + this.visitTime;
      } else {
        this.visitStartDate = this._dateFormat.transform(this.enrollPatientForm.controls['visitList'].value[i].visitDate, 'yyyy-MM-dd 00:00:00');
      }
      this.visitEndDate = this._dateFormat.transform(this.enrollPatientForm.controls['visitList'].value[i].visitDate, 'yyyy-MM-dd 23:59:00');
    }
    if (name !== '') {
      if ((type === 'bed' || type === 'OTRoom') && event.text.length >= 2 && event.keyCode != 13) {
        if (type === 'bed' && (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 17)) {
          if (event.toHit == true) {
            this.bedEnabled = true;
            this.commonService.searchBedLocation(name, this.visitStartDate, this.visitEndDate).pipe(
              debounceTime(3000),
              distinctUntilChanged(),
            ).subscribe(res => {
              this.bedList = res.results;
              if (this.data.id && this.data.bedId !== null) {
                this.bedList = this.bedList.filter(x => x.bedId !== this.data.bedId);
                this.bedList = this.bedList.concat([{bedId: this.data.bedId, bedName: this.data.bedName,
                locationId: this.data.locationId}]);
              }
            });
          }
        } else if (type === 'bed' || type === 'OTRoom' && (event.keyCode == 38 || event.keyCode == 40)) {
          const bedList = this.bedList;
          this.bedList = bedList;
        } else if (type == 'OTRoom' && (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode === 17)) {
          if (event.toHit == true) {
            this.roomEnabled = true;
            this.commonService.getSpecialityLoc(null, 'LC_OT', name).pipe(
              debounceTime(3000),
              distinctUntilChanged(),
            ).subscribe(res => {
              this.bedList = res.results;
            });
          }
        }
      } else {
        this.bedList = [];
      }
      if(this.visitType == 'VT-EC' && type == 'surgeon') {
        type = 'doctor'
      }
      if (type === 'doctor' || type === 'surgeon') {
        if (name.length >= 3) {
          let userType = 'UT_DOCTOR';
          let roleType = null;
          if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190 ||event.keyCode === 17) {
            if (type === 'surgeon') {
              this.surgeonEnabled = true;
              userType = 'UT_SURGEON';
            } else {
              this.doctorEnabled = true;
              roleType = 'RO-DO';
            }
            if(this.enrollPatientConfig && this.enrollPatientConfig.hasOwnProperty('roleTypes')) {
              roleType = this.enrollPatientConfig.roleTypes;
            }
            if (event.toHit == true) {
              this.commonService.searchDoctor(name, userType, roleType).pipe(
                debounceTime(3000),
                distinctUntilChanged(),
              ).subscribe(res => {
                this.doctorList = res.results;
              });
            }
          } else if (type === 'surgeon' || type === 'doctor' && (event.keyCode == 38 || event.keyCode == 40)) {
            const doctorList = this.doctorList;
            this.doctorList = doctorList;
          }
        }
      }
      if (type === 'surgery' || type === 'healthPlan') {
        if (name.length >= 3) {
          let planType = 'HP-HC';
          if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190 || event.keyCode === 17) {
            if (type === 'surgery') {
              this.surgeryEnabled = true;
              if(this.visitType === 'VT-EC') {
                planType = 'HP-EC';
              } else {
                planType = 'HP-OT';
              }
            } else {
              this.healthPlanEnabled = true;
            }
            if (type === 'surgery') {
              if (event.toHit == true) {
                this.commonService.getOTProcedure(name).pipe(
                  debounceTime(3000),
                  distinctUntilChanged(),
                ).subscribe(res => {
                  this.healthPlanList = res.results;
                  this.otProcedureList = res.results;
                });
              }
            } else {
              if (event.toHit == true) {
                this.commonService.getOTHealthPlan(planType, name).pipe(
                  debounceTime(3000),
                  distinctUntilChanged(),
                ).subscribe(res => {             
                  this.healthPlanList = res.results;
                });
              }
            }
          }
        } else if (type === 'surgery' && (event.keyCode == 38 || event.keyCode == 40)) {
          const healthPlanList = this.healthPlanList;
          this.healthPlanList = healthPlanList;
        }
      } else {
        this.healthPlanList = [];
      }
      if (type === 'service') {
        if (name.length >= 3) {
          if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190 ||event.keyCode === 17) {
            if (event.toHit == true) {
              this.serviceEnabled = true;
              this.commonService.getAllHeathTestWithoutAdminTest(name).pipe(
                debounceTime(3000),
                distinctUntilChanged(),
              ).subscribe(res => {
                this.testListItems = res.results;
              });
            }
          }
        } else if (type === 'service' && (event.keyCode == 38 || event.keyCode == 40)) {
          const testListItems = this.testListItems;
          this.testListItems = testListItems;
        }
      } else {
        this.testListItems = [];
      }
    } else {
      this.bedList = [];
      this.doctorList = [];
      this.healthPlanList = [];
      this.testListItems = [];
    }
  }

  otClick(data){
    this.otclickdata= data?.id? true : false;
  }
  getBatteryPercentage(data) {
    if(data) {
      this.batteryPercentage = data.batteryPercentage;
    } else {
      this.batteryPercentage = null;
    }
  }
  getLocationSearch(event) {
    this.locationIdEnabled = true;
    if(event.type === 'location' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text).subscribe(res => {
          this.searchLocationItems = res.results;
          this.searchLocation = this.searchLocationItems;
          this.searchLocationId = null;
        });
      } else {
        this.searchLocation = this.searchLocationItems;
      }
    } else {
      this.searchLocation = [];
    }
  }
  getLocationIdList(id) {
    if (id) {
      const location = this as any as { id: string, name: string }[];
      const locationId = location.find(obj => obj.id === id).name;
      return locationId;
    } else {
      return '';
    }
  }

  private requireLocationMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '' && this.locationIdEnabled) {
      this.requireLocationMatchVal = this.searchLocation.filter(resFilter => resFilter.id === control.value);
      if (this.requireLocationMatchVal.length === 0) {
        this.addNewMRLocation = control.value;
        this.isAddNewMRLocation = true;
      } else {
        this.isAddNewMRLocation = false;
      }
    }
    return null;
  }
  private requireMRDoctorMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
      this.requireMRDoctorMatchVal = this.doctorList.filter(resFilter => resFilter.id === control.value);
      if (this.requireMRDoctorMatchVal.length === 0) {
        this.addNewMRSurgeon = control.value;
        this.isAddNewMRSurgeon = true;
      } else {
        this.isAddNewMRSurgeon = false;
      }
    }
    return null;
  }

  private requireTestNameMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
    this.requireTestNameMatchVal = this.testListItems.filter(resFilter => resFilter.id === control.value);
    if (this.requireTestNameMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }

  getTestNameDetails(data) {
    this.selectedTestType = data.testType;
  }

  public saveRegisterPatient() {
    if (this.visitType === 'VT-MR') {
      this.createMRRequest();
      return;
    }
    
    this.createEnrollPatient = new CreateEnrollPatient(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null, null, null, null, null, null, null, null, null,null);
    this.createEnrollPatient.mainidentifier = this.enrollPatientForm.controls['mainidentifier'].value;
    this.createEnrollPatient.firstName = this.enrollPatientForm.controls['firstName'].value;
    this.createEnrollPatient.middleName = this.enrollPatientForm.controls['middleName'].value;
    this.createEnrollPatient.lastName = this.enrollPatientForm.controls['lastName'].value;
    if(this.visitType === 'VT-HC'){
      if (this.enrollPatientForm.controls['email'].value != null) {
        this.createEnrollPatient.email = this.enrollPatientForm.controls['email'].value;
      }
      if (this.enrollPatientForm.controls['doctorId'].value != null) {
        this.createEnrollPatient.userId = this.enrollPatientForm.controls['doctorId'].value;
        this.createEnrollPatient.doctorName = this.doctorList.find(res => (res.id == this.createEnrollPatient.userId))?.name;
      }
      if(this.enrollPatientForm.get('isCheckOutProcessCounter')?.value != null) {
        this.createEnrollPatient.isCheckOutProcessCounter = this.enrollPatientForm.get('isCheckOutProcessCounter')?.value;
      }
    }
    if(this.data.visitEvent == 'VE-OT' && this.isEmergency){
      this.createEnrollPatient.surgeryTypeId = "SGT-EM";
    }

    this.createEnrollPatient.birthDate = this._dateFormat.transform(this.enrollPatientForm.controls['birthDate'].value, 'yyyy-MM-dd');
    if (this.genderCode === undefined) {
      this.createEnrollPatient.gender = null;
    } else {
      this.createEnrollPatient.gender = this.genderCode;
    }
    this.createEnrollPatient.mobileNo = this.enrollPatientForm.controls['mobileNo'].value;
    this.createEnrollPatient.tagSerialNumber = this.enrollPatientForm.controls['tagSerialNumber'].value;
    //  if(this.visitType === 'VT-HC'){
    //     this.createEnrollPatient.isDiabetic = null;
    //  } else {
      this.createEnrollPatient.isDiabetic = this.enrollPatientForm.controls['isDiabetic'].value;
    //  }
    this.createEnrollPatient.isFasting = this.enrollPatientForm.controls['isFasting'].value;
    this.createEnrollPatient.isVulnerable = this.enrollPatientForm.controls['isVulnerable'].value;
    this.createEnrollPatient.isPregnant = this.enrollPatientForm.controls['isPregnant'].value;
    this.createEnrollPatient.vipTypeId = this.enrollPatientForm.controls['vipTypeId'].value;

    if (this.enrollPatientForm.controls['vipTypeId'].value === 'null') {
      this.createEnrollPatient.vipTypeId = null;
    } else {
      this.createEnrollPatient.vipTypeId = this.enrollPatientForm.controls['vipTypeId'].value;
    }

    this.createEnrollPatient.preferedLanguage = this.enrollPatientForm.controls['preferredLanguage'].value;

    if (this.isEnableCosterDropdown === true) {
      
        this.createEnrollPatient.tagTypeId = this.tagTypeId;
      
    } else {
      this.createEnrollPatient.tagTypeId = 'TT-MB';
    }

    if (this.floorId === undefined) {
      this.createEnrollPatient.assignedFloorId = null;
    } else {
      this.createEnrollPatient.assignedFloorId = this.floorId;
    }

    
    if (this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-RE' || this.visitType === 'VT-OP'  || this.visitType === 'VT-DC') {
      this.createEnrollPatient.visitTypeId = this.visitType;

      if (this.data.visitEvent === 'VE-OT' || this.visitType === 'VT-EC') {
        const OTEventDetails = {};
        if (this.data.visitEvent === 'VE-OT') {
          if(this.data.id !== null) {
            this.createEnrollPatient.id = this.data.id ;
          } else {
            this.createEnrollPatient.id = null;
          }
          this.createEnrollPatient.checkExisting = true;
        }
        if (this.enrollPatientForm.controls['visitList'].value[0].bedId != null) {
          OTEventDetails['locationId'] = this.enrollPatientForm.controls['visitList'].value[0].bedId;
        }

        if (this.enrollPatientForm.controls['doctorId'].value != null) {
          if (this.isAddNewSurgeon) {
            OTEventDetails['userId'] = null;
            OTEventDetails['firstName'] = this.addNewSurgeon;
          } else {
            OTEventDetails['userId'] = this.enrollPatientForm.controls['doctorId'].value;
            OTEventDetails['firstName'] = null;
          }
          
        }

        this.createEnrollPatient.visitEvent = OTEventDetails;
        this.createEnrollPatient.eventType = this.data.visitEvent;
        
        if (this.isAddNewSurgery) {
          this.createEnrollPatient.healthPlanId = null;
          this.createEnrollPatient.planName = this.addNewSurgery;
        } else {
          this.createEnrollPatient.healthPlanId = this.enrollPatientForm.controls['healthPlanId'].value;
          this.createEnrollPatient.planName = null;
        }
        if (this.data.enrollOT) {
          this.createEnrollPatient.patientVisitId = this.data.patientVisitId;
          if (this.data.tagSerialNumber !== null) {
            this.createEnrollPatient.tagTypeId = this.data.tagTypeId;
          }
          if (this.enrollPatientForm.controls['visitList'].value[0].visitDate != null) {
            this.createEnrollPatient.packageDate = this._dateFormat.transform(
              this.enrollPatientForm.controls['visitList'].value[0].visitDate, 'yyyy-MM-dd HH:mm:ss');
          }
        }
      } else {
        if (this.enrollPatientForm.controls['visitList'].value[0].bedId != null) {
          this.createEnrollPatient.bedId = this.enrollPatientForm.controls['visitList'].value[0].bedId;
          this.createEnrollPatient.locationId = this.wardId;
        }

        if (this.enrollPatientForm.controls['doctorId'].value != null) {
          this.createEnrollPatient.doctorId = this.enrollPatientForm.controls['doctorId'].value;
        }
      }
    } 

    if (this.visitType === 'VT-HC' || this.visitType === 'VT-EC') {
      if(this.visitType === 'VT-EC') {
        this.createEnrollPatient.healthPlanId = this.emergencyPlanId;
      } else {
        this.createEnrollPatient.healthPlanId =this.healthPlanEnabled ? this.enrollPatientForm.controls['healthPlanId'].value : this.data?.healthPlanId;
      }
      this.createEnrollPatient.visitTypeId = this.visitType;
      if(this.data && this.data.id == null && this.data.hasOwnProperty('patientVisitId') && this.data.patientVisitId == null) {
          this.createEnrollPatient.tempPatientId = this.data.tempPatientId;
          this.createEnrollPatient.visitIdentifier = this.data.visitIdentifier;
          this.createEnrollPatient.packageIdentifier = this.data.packageIdentifier;
          this.createEnrollPatient.packageName = this.data.packageName;
          this.createEnrollPatient.packageDate = this.data.packageDate;
          this.createEnrollPatient.healthTests = this.data.healthTests;
      }
    } else if (this.data.visitEvent === 'VE-OT') {
      if(this.otclickdata == true){
      this.createEnrollPatient.healthPlanId = this.otProcedureList.find(item=>item.id ===  this.enrollPatientForm.controls['healthPlanId'].value).healthPlanId;
      this.createEnrollPatient.otProcedureId = this.enrollPatientForm.controls['healthPlanId'].value;
      }else {
        this.createEnrollPatient.planName = this.enrollPatientForm.controls['healthPlanId'].value;
      }
    }
    if (this.visitType === 'VT-DC' || this.data.visitEvent === 'VE-OT' ) {
      const control = <FormArray>this.enrollPatientForm.controls['visitList'];
      this.bedVisitList = [];
      for (let i = 0; i < control.length; i++) {
        const bedVisit = {
          'bedId': this.enrollPatientForm.controls['visitList'].value[i].bedId,
          'visitDate': this._dateFormat.transform(this.enrollPatientForm.controls['visitList'].value[i].visitDate, 'yyyy-MM-dd HH:mm:ss')
        };
      this.bedVisitList.push(bedVisit);
      }
      this.createEnrollPatient.visits = this.bedVisitList;
    }

    if (this.visitType === 'VT-OP') {
      this.createEnrollPatient.startDate    = this._dateFormat.transform(
        this.enrollPatientForm.controls['startDate'].value, 'yyyy-MM-dd HH:mm:ss');
      this.createEnrollPatient.testId       = this.enrollPatientForm.controls['testId'].value;
      this.createEnrollPatient.testType     = this.selectedTestType;
      this.createEnrollPatient.isPreBooked  = this.enrollPatientForm.controls['isPreBooked'].value;
    }
    this.createEnrollPatient.countryCode  = this.enrollPatientForm.controls['countryCode']?.value;
    if(this.createEnrollPatient.eventType == 'VE-OT') {
      this.createEnrollPatient['canTagDisassociate'] = false;
      if(this.createEnrollPatient.visitEvent && this.createEnrollPatient.visitEvent.hasOwnProperty('userId') && this.createEnrollPatient.visitEvent.userId == this.data.doctorName) {
        this.createEnrollPatient.visitEvent.userId = this.data.doctorId        
      }
    }    
    this.isDisabled = true;
    if(this.data.hasOwnProperty('tempPatientInfo') && this.data.tempPatientInfo && this.data.visitType == 'VT-EC') {
      this.createEnrollPatient.tempAmbPatientId = this.data.tempPatientInfo.tempPatientId;
    }

    if(this.enableAssignToken && this.enrollPatientForm.controls['enrolltoken'].value != null) {
      this.createEnrollPatient.tokenNumberId = this.tokenID;
    }
    this.commonService.saveRegisteredPatients(this.createEnrollPatient).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }

      if (res.statusCode === 1) {
        this.bedEnabled = false;
        this.doctorEnabled = false;
        this.roomEnabled = false;
        this.surgeonEnabled = false;
        this.isDisabled = false;
        this.thisDialogRef.close(res.results);
        this.enrollPatientForm.reset();
      }
      this.toastr.success('Success', `${res.message}`);

    },
      error => {
        if(error.error.errorCode === "TWAPI159") {
          const dialogRef = this.dialog.open(ConfirmationDialog, {
            panelClass:['confirmation-popup'], disableClose: true,
            data: {
              title: 'OT Enroll', message: "A previous OT event has been detected for this patient. Press YES to proceed with the existing event or NO to create a new one.",
              buttonText: { ok: 'Yes', cancel: 'No' },
              'enrollData': this.createEnrollPatient, 'isRemark': 1, 'oTEnroll': true
            }
          });
          dialogRef.afterClosed().subscribe(res => {
            this.thisDialogRef.close('confirm');
          });
        } else {
          if(error.error.errorCode == 'TWAPI0009') {
            this.checkTagDisassociate(error.error.message, this.createEnrollPatient)
          } else {
            this.isDisabled = false;
            this.toastr.error('Error', `${error.error.message}`);
          }
        }
    });
  }
  checkTagDisassociate(msg, TagDetails) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: msg,
        buttonText: { cancel: 'No', ok: 'Yes' },
        MRTagDisassociate: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        TagDetails['canTagDisassociate'] = true; 
        this.commonService.saveRegisteredPatients(TagDetails).subscribe(res => {
          if (res.statusCode !== 1) {
            this.isDisabled = false;            
          }    
          if (res.statusCode === 1) {
            this.bedEnabled = false;
            this.doctorEnabled = false;
            this.roomEnabled = false;
            this.surgeonEnabled = false;
            this.isDisabled = false;
            this.thisDialogRef.close(res.results);
            this.enrollPatientForm.reset();
          }
          this.toastr.success('Success', `${res.message}`);
        }, error => {
          if(error.error.errorCode === "TWAPI159") {
            const dialogRef = this.dialog.open(ConfirmationDialog, {
              panelClass:['confirmation-popup'], disableClose: true,
              data: {
                title: 'OT Enroll', message: "A previous OT event has been detected for this patient. Press YES to proceed with the existing event or NO to create a new one.",
                buttonText: { ok: 'Yes', cancel: 'No' },
                'enrollData': this.createEnrollPatient, 'isRemark': 1, 'oTEnroll': true
              }
            });
            dialogRef.afterClosed().subscribe(res => {
              this.thisDialogRef.close('confirm');
            });
          } else {
            this.isDisabled = false;
            this.toastr.error('Error', `${error.error.message}`);
          }
        }); 
      }
    });
  }

  public updateRegisterPatient() {
    this.updateEnrollPatient = new UpdateEnrollPatient(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.updateEnrollPatient.firstName = this.enrollPatientForm.controls['firstName'].value;
    this.updateEnrollPatient.middleName = this.enrollPatientForm.controls['middleName'].value;
    this.updateEnrollPatient.lastName = this.enrollPatientForm.controls['lastName'].value;
    this.updateEnrollPatient.birthDate = this._dateFormat.transform(this.enrollPatientForm.controls['birthDate'].value, 'yyyy-MM-dd');
    if (this.genderCode === undefined) {
      this.updateEnrollPatient.gender = null;
    } else {
      this.updateEnrollPatient.gender = this.genderCode;
    }
      if(this.visitType === 'VT-OP' || this.visitType === 'VT-DC' || this.visitType === 'VT-IP' || this.visitType === 'VT-RE'){
       this.updateEnrollPatient.mobileNumber = this.enrollPatientForm.controls['mobileNo'].value;
       this.updateEnrollPatient.countryCode = this.enrollPatientForm.controls['countryCode'].value;
       this.updateEnrollPatient.gender = this.enrollPatientForm.controls['gender'].value;
      }else{
    this.updateEnrollPatient.mobileNo = this.enrollPatientForm.controls['mobileNo'].value;}

    this.updateEnrollPatient.assignedFloorId = this.floorId;

    if (this.visitType === 'VT-IP' || this.visitType === 'VT-EC' || this.visitType === 'VT-OP'  || this.visitType === 'VT-RE' || this.visitType === 'VT-DC' || this.visitType === 'VT-MR') {
      this.updateEnrollPatient.visitTypeId = this.visitType;
      this.updateEnrollPatient.patientId = this.data.patientId;
      this.updateEnrollPatient.locationId = this.data.locationId;
      if (!this.bedEnabled && !this.roomEnabled && this.enrollPatientForm.controls['visitList'].value[0].bedId !== '') {
        this.updateEnrollPatient.bedId = this.data.bedId;
      } else if (this.enrollPatientForm.controls['visitList'].value[0].bedId === '') {
        this.updateEnrollPatient.bedId = null;
        this.updateEnrollPatient.locationId = null;
      } else {
        this.updateEnrollPatient.bedId = this.enrollPatientForm.controls['visitList'].value[0].bedId;
        this.updateEnrollPatient.locationId = this.wardId;
      }

      if (!this.doctorEnabled && !this.surgeonEnabled && this.enrollPatientForm.controls['doctorId'].value !== '') {
        this.updateEnrollPatient.doctorId = this.data.doctorId;
      } else if (this.enrollPatientForm.controls['doctorId'].value === '') {
        this.updateEnrollPatient.doctorId = null;
      }  else {
        this.updateEnrollPatient.doctorId = this.enrollPatientForm.controls['doctorId'].value;
      }
    }
    if (this.visitType === 'VT-OP') {
      this.updateEnrollPatient.scheduleDate = this._dateFormat.transform(this.enrollPatientForm.controls['startDate'].value, 'yyyy-MM-dd HH:mm:ss');
      this.updateEnrollPatient.healthTestId = this.enrollPatientForm.controls['testId'].value;
    }
    if(this.visitType !== 'VT-OP'){
    if (this.data.visitDate === this.enrollPatientForm.controls['visitList'].value[0].visitDate) {
      this.updateEnrollPatient.visitDate = this.data.visitDate;
    } else {
      this.updateEnrollPatient.visitDate = this._dateFormat.transform(
        this.enrollPatientForm.controls['visitList'].value[0].visitDate, 'yyyy-MM-dd HH:mm:ss');
  }
}
    this.updateEnrollPatient.patientVisitId = this.data.patientVisitId;

    console.log(this.updateEnrollPatient);
    if (this.visitType === 'VT-OP') {
      this.commonService.updateAllpatientDetails(this.updateEnrollPatient).subscribe(result => {
        this.toastr.success('Success', `${result.message}`);
        this.thisDialogRef.close('confirm');
        this.enrollPatientForm.reset();
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else {
    

    this.commonService.updateRegisteredPatients(this.updateEnrollPatient).subscribe(res => {

      if (res.statusCode === 1) {
        this.bedEnabled = false;
        this.doctorEnabled = false;
        this.roomEnabled = false;
        this.surgeonEnabled = false;
        this.thisDialogRef.close(res.results);
        this.enrollPatientForm.reset();
      }

      this.toastr.success('Success', `${res.message}`);

    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
  updatePatient() {
    let editPatient = {}
    const birthdate = this.enrollPatientForm.controls['birthDate'].value;
    editPatient['id'] = this.data.id;
    editPatient['firstName']   =  this.enrollPatientForm.controls['firstName'].value;
    editPatient['middleName']  =  this.enrollPatientForm.controls['middleName'].value;
    editPatient['lastName']    =  this.enrollPatientForm.controls['lastName'].value;
    editPatient['gender']      =  this.genderCode != undefined ? this.genderCode : null;
    editPatient['email']       =  this.enrollPatientForm.controls['email'].value;
    editPatient['mobileNo']    = this.enrollPatientForm.controls['mobileNo'].value;
    editPatient['birthDate']    = birthdate ? this._dateFormat.transform(birthdate, 'yyyy-MM-dd') : null;
    editPatient['mainidentifier']    = this.enrollPatientForm.controls['mainidentifier'].value;
    editPatient['countryCode'] = this.enrollPatientForm.controls['countryCode'].value;

    if(this.tempPatientId){
      this.hospitalServices.updateTempPatient(this.tempPatientId,editPatient).subscribe(res => {
        this.thisDialogRef.close(res.results);
        this.toastr.success('Success', `${res.message}`);
      }, error => {
          this.isDisabled = false;
          this.toastr.error('Error', `${error.error.message}`);
      });
     }else{
    this.hospitalServices.updatePatient(editPatient).subscribe(res => {
      this.thisDialogRef.close(res.results);
      this.toastr.success('Success', `${res.message}`);
    }, error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
    });
  }
  }

  createMRRequest() {
    this.createMedicalRecord = new CreateMedicalRecord(null, null, null, null, null, null, null, null, null, null, null, null, null,null,null);
    this.createMedicalRecord.mainIdentifier = this.enrollPatientForm.controls['mainidentifier'].value;
    this.createMedicalRecord.firstName = this.enrollPatientForm.controls['firstName'].value;
    this.createMedicalRecord.middleName = this.enrollPatientForm.controls['middleName'].value;
    this.createMedicalRecord.lastName = this.enrollPatientForm.controls['lastName'].value;
    this.createMedicalRecord.dob = this._dateFormat.transform(this.enrollPatientForm.controls['birthDate'].value, 'yyyy-MM-dd');
    if (this.genderCode === undefined) {
      this.createMedicalRecord.gender = null;
    } else {
      this.createMedicalRecord.gender = this.genderCode;
    }
    this.createMedicalRecord.mobileNo = this.enrollPatientForm.controls['mobileNo'].value;
    this.createMedicalRecord.volume = this.enrollPatientForm.controls['volume'].value;
    if (this.enrollPatientForm.controls['requestedToDate'].value !== null) {
      const requestedToDate = this._dateFormat.transform(this.enrollPatientForm.controls['requestedToDate'].value, 'yyyy-MM-dd') + ' ' +this._dateFormat.transform(this.today, 'HH:mm');
      this.createMedicalRecord.requestedToDate = this._dateFormat.transform(requestedToDate, 'dd-MM-yyyy HH:mm');
    }
    if (this.enrollPatientForm.controls['requestedFromDate'].value !== null) {
      const requestedFromDate = this._dateFormat.transform(this.enrollPatientForm.controls['requestedFromDate'].value, 'yyyy-MM-dd') + ' ' +this._dateFormat.transform(this.today, 'HH:mm');
      this.createMedicalRecord.requestedFromDate = this._dateFormat.transform(requestedFromDate, 'dd-MM-yyyy HH:mm');
    }

    if (this.enrollPatientForm.controls['deliveryLocationId'].value !== null) {
      if (this.isAddNewMRLocation) {
        this.createMedicalRecord.deliveryLocationId = null;
        this.createMedicalRecord.deliveryLocation = this.addNewMRLocation;
      } else {
        this.createMedicalRecord.deliveryLocationId =  this.enrollPatientForm.controls['deliveryLocationId'].value;
        this.createMedicalRecord.deliveryLocation = null;
      }
    }

    if (this.enrollPatientForm.controls['requestedDoctorId'].value !== null) {
      if (this.isAddNewMRSurgeon) {
        this.createMedicalRecord.requestedDoctorId = null;
        this.createMedicalRecord.requestedDoctor = this.addNewMRSurgeon;
      } else {
        this.createMedicalRecord.requestedDoctorId = this.enrollPatientForm.controls['requestedDoctorId'].value;
        this.createMedicalRecord.requestedDoctor = null;
      }
    }
    this.createMedicalRecord.departmentId = this.enrollPatientForm.controls['departmentId'].value; 
    console.log(this.createMedicalRecord);

    this.commonService.createMedicalRecordRequest(this.createMedicalRecord).subscribe(res => {

      if (res.statusCode === 1) {
        this.locationIdEnabled = false;
        this.doctorEnabled = false;
        this.thisDialogRef.close(res.results);
        this.enrollPatientForm.reset();
      }

      this.toastr.success('Success', `${res.message}`);

    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });

  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-coaster',
  templateUrl: './coaster.component.html',
  styleUrls: ['./enroll-patient.component.scss'],
  providers: [DatePipe],
})

export class CoasterComponent implements OnInit, AfterViewInit {
  
  public coasterForm: FormGroup;
  public matcher = new ErrorStateMatcherService();
  public searchCosterlist = [];
  public isTagId = true;
  public tagTypeId = null;
  public createCoaster: CreateCoaster;
  createMRCoaster: {};
  disAssociateMRCoaster: {};
  requireTagMatchVal: any;
  assetName = null;
  public workflowTypeId = null;
  public listItems2: any;
  public height: any;
  public actionType = 'Device';
  toHit = false;
  inchargeList: any=[];
  inchargeEnabled = false;
  inchargeId = null;
  inchargeListRes: any=[];
  requireInchargeMatchVal: any;
  deviceTypeOption: any=[];
  tagDetail: any=[];
  tagAssociation: any;
  removeDeviceList: any=[];
  removedDevice: any=[];
  doctorListRes: any=[];
  doctorList: any=[];
  doctorEnabled = false;
  emtListRes: any=[];
  emtList: any=[];
  emtEnabled = false;
  doctorId = null;
  emtId = null;
  requireDoctorMatchVal: any=[];
  requireEMTMatchVal: any=[];
  associateId = null;
  isDriverDisable = false;
  isDoctorDisable = false;
  isEMTDisable = false;
  disassociateId = null;
  emtName = null;
  doctorName = null;
  pilotName = null;
  selectedTabIndex = 0;
  assetDisplayedData = [
    { 'colName': 'assetId', 'title': 'Asset ID', 'dataName': 'assetId' },
    { 'colName': 'assetName', 'title': 'Name', 'dataName': 'assetName' },
    { 'colName': 'assetTypeValue', 'title': 'Type', 'dataName': 'assetTypeValue' },
    { 'colName': 'alerts', 'title': 'Alerts', 'dataName': 'alerts' },
    { 'colName': 'locationName', 'title': 'Location', 'dataName': 'locationName' },
    { 'colName': 'currentLocationFullName', 'title': 'Current Location', 'dataName': 'currentLocationFullName' },
    { 'colName': 'lastSeen', 'title': 'Last seen', 'dataName': 'lastSeen' },
    { 'colName': 'assetStatus', 'title': 'Status', 'dataName': 'assetStatus' },
    
  ];
  readerDisplayedData = [
    { 'colName': 'readerName', 'title': 'Reader Name', 'dataName': 'readerName' },
    { 'colName': 'floorName', 'title': 'Floor', 'dataName': 'floorName' },
    { 'colName': 'locationName', 'title': 'Location', 'dataName': 'locationName' },
    { 'colName': 'alerts', 'title': 'Alerts', 'dataName': 'alerts' },
    { 'colName': 'lastCommunicatedOn', 'title': 'Last Communicated On', 'dataName': 'lastCommunicatedOn' },
    { 'colName': 'readerStatus', 'title': 'Status', 'dataName': 'readerStatus' }
  ];
  assetDisplayedColumns: string[] = this.assetDisplayedData.map((res) => res.colName);
  assetDataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) assetPaginator: MatPaginator;
  @ViewChild(MatSort) assetSort: MatSort;
  readerDisplayedColumns: string[] = this.readerDisplayedData.map((res) => res.colName);
  readerDataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) readerPaginator: MatPaginator;
  @ViewChild(MatSort) readerSort: MatSort;
  batteryPercentage = null;
  selectedTab = 'Summary';
  public activate_btn: any = [];
  displayedColumn: string[] = ['Created on','Message','Created by','Status'];
  sortColumn = ['Created on'];
  tableData: any;
  pageSize:number =10;
  pageStart:number=0;
  length: number=0;
  iconColumn = [];
  iconHeader = [];
  eventColumn = [];
  permissionControl = [];
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  userId :any;
  today = new Date();
  public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  public isLoading = false;
  public isDisplayUserLocation =false;
  public isdisassociateUserLocation =false;
  @ViewChild('device') deviceId!: ElementRef;
  tagHistory: any=[];
  displayedColumns = ['Tag ID', 'Type', 'Identifier', 'Name', 'Created By', 'Modified By', 'Associated Time', 'Disassociated Time'];
  lengthAH: number;
  pageSizeAH = 50;
  applyFilterValue = null;

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<EnrollRegisterPatientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService,
    public datepipe: DatePipe, private readonly _dateFormat: DatePipe,private readonly hospitalService : HospitalService) {
      this.activate_btn = this.commonService.getActivePermission("button");
  }

  ngOnInit() {
    if (this.data.hasOwnProperty('workflowTypeId') && this.data['workflowTypeId'] == 'WF-STF'  && this.data.hasOwnProperty('id')) {
      this.userId = this.data?.id.toString();
      this.getMessageCoaster(this.selectedDate, 'notification', this.pageStart, this.pageSize, this.userId, 'RT-US')
    }
    
    if(this.data.hasOwnProperty('selectedTabIndex') && this.data.selectedTabIndex) {
      this.selectedTabIndex = this.data.selectedTabIndex;
      let alertType = this.selectedTabIndex == 1 ? 'Asset' : 'Reader'
      this.getAssetandReaders(alertType);
    } 
    this.workflowTypeId = this.data.workflowTypeId;
    if (this.data.tagId != null && this.workflowTypeId !== 'AT-MR') {
      this.isTagId = false;
    } else if (this.data.tagSerialNumber != null && this.workflowTypeId !== 'AT-MR') {
      this.isTagId = false;
      this.data.tagId = this.data.tagSerialNumber;
    } else if (this.data.associatedTagSerialNumber != null && this.workflowTypeId !== 'AT-MR') {
      this.isTagId = false;
      this.data.tagId = this.data.associatedTagSerialNumber;
      this.data.tag_type_name = this.data.associationType;
    } else if (this.data.assetTagId != null && this.workflowTypeId === 'AT-MR') {
      this.isTagId = false;
      if (this.data.assetName !== null) {
        this.assetName = ', ' + this.data.assetName;
      }
      this.data.MRTagId = this.data.assetTagId + this.assetName;
      this.data.tag_type_name = this.data.assetTagTypeName;
    }
    if (this.data.uhid && this.data.uhid !== null) {
      this.data.uhid = this.data.uhid;
    } else if (this.data.mainidentifier && this.data.mainidentifier !== null) {
      this.data.uhid = this.data.mainidentifier;
    }
    if (this.data.name && this.data.name !== null) {
      this.data.name = this.data.name;
    } else if (this.data.patientName && this.data.patientName !== null) {
      this.data.name = this.data.patientName;
    } else if (this.data.fullName && this.data.fullName !== null) {
      this.data.name = this.data.fullName;
    } else if(this.data.assetName && this.data.assetName && this.workflowTypeId !== 'AT-MR') {
      this.data.name = this.data.assetName;
    }
    if (this.data.currentLocationName && this.data.currentLocationName !== null) {
      this.data.locationName = this.data.currentLocationName;
    }
    if (this.data.associateAction && this.data.associateAction !== null) {
      this.actionType = this.data.associateAction
    }
    if(this.data.pilotId !== null) {
      this.isDriverDisable = true;
    }
    if(this.data.doctorId !== null) {
      this.isDoctorDisable = true;
    }
    if(this.data.emtId !== null) {
      this.isEMTDisable = true;
    }
    this.buildForm();
    if(this.actionType === 'Ambulance') {
      this.coasterForm.get('pilotId').setValidators([Validators.required, this.requireInchargeMatch.bind(this)]);
      this.coasterForm.get('pilotId').updateValueAndValidity();
      this.coasterForm.get('doctorId').setValidators([Validators.required, this.requireDoctorMatch.bind(this)]);
      this.coasterForm.get('doctorId').updateValueAndValidity();
      this.coasterForm.get('emtId').setValidators([Validators.required, this.requireEMTMatch.bind(this)]);
      this.coasterForm.get('emtId').updateValueAndValidity();
    } else {
      this.coasterForm.get('pilotId').setValidators(null);
      this.coasterForm.get('pilotId').updateValueAndValidity();
      this.coasterForm.get('doctorId').setValidators(null);
      this.coasterForm.get('doctorId').updateValueAndValidity();
      this.coasterForm.get('emtId').setValidators(null);
      this.coasterForm.get('emtId').updateValueAndValidity();
    }
    if(this.data.associatedTags && this.data.associatedTags.length !== 0) {
      this.removeDevice(0, null);
      for (let i = 0; i < this.data.associatedTags.length; i++) {
        const control = <FormArray>this.coasterForm.controls['deviceList'];
        this.data.tagSerialNumber = this.data.associatedTags[i].tagSerialNumber;
        this.data.comments = this.data.associatedTags[i].comments;
        this.data.tagTypeId = this.data.associatedTags[i].tagTypeId;
        this.data.deviceType = this.data.associatedTags[i].tagTypeName;
        this.deviceTypeOption.push(this.data.associatedTags[i].tagSerialNumber);
        control.push(this.editDevice(i));
      }
    }
    if(this.workflowTypeId === 'WF-AST') {
      this.coasterForm.get('tagSerialNumber').setValidators(null);
      this.coasterForm.get('tagSerialNumber').updateValueAndValidity();
    } else {
      this.coasterForm.get('tagSerialNumber').setValidators([Validators.required, this.requireTagMatch.bind(this)]);
      this.coasterForm.get('tagSerialNumber').updateValueAndValidity();
    }
    if(this.data?.tagId !== null) {
      const tags = {"entityIds": [this.data.tagId]};
      this.commonService.getTagBatteryStatus(tags).subscribe(res => {
        this.batteryPercentage = res.results[0].batteryValue;
      });
    }
    if(this.data?.workflowTypeId == 'WF-STF'){
      this.commonService.getConfigFile('coaster-config').subscribe(res => {
        const response = res.results?.contentObject;
        if (response?.['WF-STF']) {
          this.isDisplayUserLocation = response['WF-STF'].showUserLocation;
          this.isdisassociateUserLocation = response['WF-STF'].disassociateWithUserLocation;
        } else {
          this.isDisplayUserLocation = false;
          this.isdisassociateUserLocation = false;
        }
      });
    }
    setTimeout(() => {
      this.deviceId.nativeElement.focus();  
    }, 500);
  }
  ngAfterViewInit() {
    this.deviceId.nativeElement.focus();  
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    }
    if (this.data.hasOwnProperty('workflowTypeId') && this.data['workflowTypeId'] == 'WF-STF' && this.data.hasOwnProperty('id')) {
      this.getMessageCoaster(this.selectedDate, 'notification', this.pageStart, this.pageSize, this.userId, 'RT-US')
    }
  }

  getMessageCoaster(selectedDate, identifyingType, pageStart, pageSize, id, recipientType) {
    if(this.data.hasOwnProperty('patientId')) {
      recipientType = 'RT-PA';
    } 
    this.commonService.getmsgnotification(selectedDate, identifyingType, pageStart, pageSize, id, recipientType).subscribe(res => {
      if (res.results.length > 0) {
        this.tableData = res.results;
        this.length = res.totalRecords
        const Columns = ['sentDatetime', 'payload', 'createUserName', 'isDelivered'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            if(this.displayedColumn[i] == 'Status') {
              data[this.displayedColumn[i]] = !data['isDelivered'] ? 'Sent' : data['isDelivered'] && !data['isSeen'] ? 'Delivered' : 'Acknowledged';  
            } else {
              data[this.displayedColumn[i]] = data[Columns[i]];
            }
          });
        }
      }
    });
  }
  getBatteryPercentage(data) {
    if(data) {
      this.batteryPercentage = data.batteryPercentage;
    } else {
      this.batteryPercentage = null;
    }
  }
  public buildForm() {

    this.coasterForm = this.form.group({
      deviceType: [this.data.tag_type_name ? this.data.tag_type_name : null],
      deviceId: [this.workflowTypeId === 'AT-MR' ? (this.data.MRTagId ? this.data.MRTagId : null) : (this.data.tagId ? this.data.tagId : null)],
      tagSerialNumber: [null, [this.requireTagMatch.bind(this)]],
      userId: [this.data.userName ? this.data.userName : null],
      inchargeId: [null, [Validators.required, this.requireInchargeMatch.bind(this)]],
      pilotId: [this.data.pilotName ? this.data.pilotName : null, [Validators.required, this.requireInchargeMatch.bind(this)]],
      doctorId: [this.data.doctorName ? this.data.doctorName : null, [this.requireDoctorMatch.bind(this)]],
      emtId: [this.data.emtName ? this.data.emtName : null, [this.requireEMTMatch.bind(this)]],
      comments: [null],
      deviceList: this.form.array([this.editDevice(0)]),
      message: [null,[Validators.maxLength(240),Validators.pattern ('^[a-zA-Z0-9 ,:"".]+$')]]
    });
  }

  preventEnter(event: KeyboardEvent) {
    event.preventDefault(); 
  }
  
  tabChanged(tabDetail) {
    if(tabDetail.tab.textLabel == 'Asset' || tabDetail.tab.textLabel == 'Reader') {
      this.getAssetandReaders(tabDetail.tab.textLabel)
    }    
  }
  tabClick(event) {
    this.selectedTabIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    if(this.selectedTab === 'Association History') {
      const serialNumber = this.coasterForm.controls['deviceId']?.value;
      this.getTagAssociationHistory();
    }
  }

  getTagHistory(serialNumber) {
     this.tagHistory = [];
     this.lengthAH = 0;
    this.configurationService.getTagHistory(serialNumber).subscribe(res => {
      this.tagHistory = res?.results.reverse();
      this.lengthAH = res?.results?.length;
      const Columns = ['tagAssociationType','tagAssociationId', 'tagAssociationName',  'tagLinkDurationFrom', 'tagLinkDurationTo','createUserName', 'modifiedUserName'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tagHistory?.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  getTagAssociationHistory() {
    this.tagHistory = [];
    this.lengthAH = 0;
    this.configurationService.getTagAssociationHistory(this.data?.associationId, this.data?.associationTypeId).subscribe(res => {
      this.tagHistory = res?.results.reverse();
      this.lengthAH = res?.results?.length;
    if (this.applyFilterValue !== null) {
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
      const Columns = ['tagSerialNumber', 'tagAssociationType', 'tagAssociationId', 'tagAssociationName', 'createUserName', 'modifiedUserName', 'tagLinkDurationFrom', 'tagLinkDurationTo'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tagHistory?.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  getAssetandReaders(type) {
    this.commonService.getAssetandReaderbyId(this.data.assetId, type).subscribe(res => {
      if(res.statusCode == 1) {
        if(type == 'Asset') {
          this.assetDataSource = new MatTableDataSource(res.results);
          this.assetDataSource.paginator = this.assetPaginator;
          this.assetDataSource.sort = this.assetSort;
        } else {
          this.readerDataSource = new MatTableDataSource(res.results);
          this.readerDataSource.paginator = this.readerPaginator;
          this.readerDataSource.sort = this.readerSort;
        }
      }
    });
  }
  addDevice() {
    const control = <FormArray>this.coasterForm.controls['deviceList'];
    control.push(this.getDevice());
  }

  removeDevice(i: number, type) {
    if (this.data && i !== 0) {
      const locDetail = this.coasterForm.controls['deviceList'].value[i].tagSerialNumber;
      const locIndex = this.removeDeviceList.findIndex(res => res.tagSerialNumber === locDetail);
      if (locIndex !== -1) {
        this.removeDeviceList[locIndex]['isDeletable'] = true;
        this.removedDevice.push({
          'tagSerialNumber': this.removeDeviceList[locIndex].tagSerialNumber,
          'comments': this.removeDeviceList[locIndex].comments,
          'tagTypeId': this.removeDeviceList[locIndex].tagTypeId,
          'isDeletable': true
        });
      }
    }
    if (this.coasterForm.controls['deviceList'].value[i].hasOwnProperty('tagSerialNumber') &&
      this.coasterForm.controls['deviceList'].value[i].tagSerialNumber !== null) {
      this.deviceTypeOption = this.deviceTypeOption.filter(x => this.coasterForm.controls['deviceList'].value[i].tagSerialNumber.indexOf(x) === -1);
    }
    const control = <FormArray>this.coasterForm.controls['deviceList'];
    control.removeAt(i);
    if (type == 'clear' && control.length <= 0) {
      this.addDevice();
    }
  }

  private getDevice() {
    return this.form.group({
      tagSerialNumber: [null, [Validators.required, this.requireTagMatch.bind(this)]],
      comments: [null],
      tagTypeId: [null],
    });
  }

  private editDevice(i) {
    return this.form.group({
      tagSerialNumber: [null, [Validators.required, this.requireTagMatch.bind(this)]],
      comments: [this.data.associatedTags ? this.data.comments : null],
      tagTypeId: [this.data.associatedTags ? this.data.tagTypeId : null],
      deviceId: [this.data.associatedTags ? this.data.tagSerialNumber : null],
      deviceType: [this.data.associatedTags ? this.data.deviceType : null]
    });
  }

  filterDeviceOptions(value) {
    if (value !== null) {
      this.deviceTypeOption.push(value);
    } else {
      this.deviceTypeOption = [];
    }
  }

  private requireTagMatch(control: FormControl): ValidationErrors | null {
    if(control.value !== null && control.value !== '') {
    this.requireTagMatchVal = this.searchCosterlist.filter(resFilter => resFilter.tagId === control.value);
    if(this.workflowTypeId == 'WF-OT' && (control.value.length == 9 || control.value.length == 12)) {
      return null;
    }
    if (this.requireTagMatchVal.length === 0 || this.searchCosterlist.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }
  onWindowResized(size) {
    this.height = size;
  }
  searchToCoster(event) {
    this.batteryPercentage = null;
    if(event.type === 'device' && event.text.length >= 2) {
      if (event.toHit == true && this.workflowTypeId !== 'AT-MR') {
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          if(res.statusCode == 1) {
            this.checkDevice(res, event);
          } else if (res.statusCode == 0 && res.results.length == 0){
            if(this.isValidDevice(event.text)) {
              this.createDevice(event)
            }            
          }
        });
      } else if (event.toHit == true && this.workflowTypeId === 'AT-MR') {
        this.commonService.getMRTag(event.text, this.data.assetTypeId).subscribe(res => {
          this.listItems2 = res.results;
          this.searchCosterlist = this.listItems2;
        });
      } else {
        this.searchCosterlist = this.listItems2;
      }
    } else {
      this.searchCosterlist = [];
    }
  }
  checkDevice(res, event) {
    this.listItems2 = res.results;
    this.searchCosterlist = this.listItems2;
    if(this.workflowTypeId == 'WF-OT' && (event.text.length == 9 || event.text.length == 12)) {
      this.coasterForm.controls.tagSerialNumber.setValue(event.text)
    }
    if(res.results.length == 1) {
      if(res.results[0]['tagId'] == event.text) {
        this.coasterForm.controls.tagSerialNumber.setValue(res.results[0]['tagId'])
        this.getTagTypeId(this.data.workflowTypeId !== 'AT-MR' ? res.results[0].tagTypeId : res.results[0].assetId);
        this.getBatteryPercentage(res.results[0]);
        this.searchCosterlist = [];
      }
    }
  }
  isValidDevice(value: string): boolean {
    const regex = /^[A-Za-z0-9]{12}$/;
    return regex.test(value);
  }
  createDevice(event) {
    let payload = {
      serialNumber : event.text,
        tagTypeId : "TT-IN",
        macId : event.text,
        hwtype : "THT-NFC",
        status : "ST-AT"
    }
    this.configurationService.saveTag(payload).subscribe(res => {
      if(res.statusCode ==1 ) {
        let val = {
          results : [{
              "tagId": event.text,
              "batteryPercentage": null,
              "tagTypeId": "TT-IN",
              "macId": event.text,
              "hardwareTypeId": "THT-NFC"
          }],
          message :  "Tags id are available",
          statusCode : 1
        } 
        this.checkDevice(val, event)
      }
    },
    error => {
      if(error.error.errorCode == 'TWAPI0008') {
        let msg = "Already exist"
        this.toastr.warning('Warning', `${msg}`);
      }
    });
  }
  sendMsg() {
    this.isLoading = true;
    let userId = this.data.id.toString();
    let recipientType = 'RT-US';
    if(this.data.hasOwnProperty('patientId')) {
      recipientType = 'RT-PA';
    }
    let payload = {
      'channels': ['CH-NO'],
      'message':this.coasterForm.controls.message.value, 
      'recipientList': [userId],
      'recipientType': recipientType
    }
    this.commonService.sendMessageCenter(payload).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.coasterForm.controls.message.reset();
        this.getMessageCoaster(this.selectedDate,'notification',this.pageStart, this.pageSize,this.userId,'RT-US')
        this.isLoading = false;
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  searchUserNamelist(event) {
    this.toHit = event.toHit;
    this.inchargeId = null;
    if(event.text.length >= 2) {
      if (this.toHit == true) {
        this.commonService.getRoleName(event.text, 'RO-AMP').subscribe(res => {
          this.inchargeListRes = res.results;
          this.inchargeList = this.inchargeListRes;
          this.inchargeEnabled = true;
        });
      } else {
        this.inchargeList = this.inchargeListRes;
        this.inchargeEnabled = true;
      }
    }
  }
  searchDoctorNamelist(event) {
    this.toHit = event.toHit;
    this.doctorId = null;
    if(event.text.length >= 2) {
      if (this.toHit == true) {
        this.commonService.getRoleName(event.text, 'RO-DO').subscribe(res => {
          this.doctorListRes = res.results;
          this.doctorList = this.doctorListRes;
          this.doctorEnabled = true;
        });
      } else {
        this.doctorList = this.doctorListRes;
        this.doctorEnabled = true;
      }
    }
  }
  searchEMTNamelist(event) {
    this.toHit = event.toHit;
    this.emtId = null;
    if(event.text.length >= 2) {
      if (this.toHit == true) {
        this.commonService.getRoleName(event.text, 'RO-EMT').subscribe(res => {
          this.emtListRes = res.results;
          this.emtList = this.emtListRes;
          this.emtEnabled = true;
        });
      } else {
        this.emtList = this.emtListRes;
        this.emtEnabled = true;
      }
    }
  }
  getInchargeList(id) {
    if (id) {
      const incharge = this as any as { id: string, name: string }[]
      const inchargeId = incharge.find(obj => obj.id === id).name;
      return inchargeId;
    } else {
      return '';
    }
  }
  private requireInchargeMatch(control: FormControl): ValidationErrors | null {
    if (this.inchargeId == null) {
      if(control.value !== null && control.value !== '') {
      this.requireInchargeMatchVal = this.inchargeList.filter(resFilter => resFilter.id === control.value);
      if (this.requireInchargeMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }

  private requireDoctorMatch(control: FormControl): ValidationErrors | null {
    if (this.doctorId == null) {
      if(control.value !== null && control.value !== '') {
      this.requireDoctorMatchVal = this.doctorList.filter(resFilter => resFilter.id === control.value);
      if (this.requireDoctorMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }

  private requireEMTMatch(control: FormControl): ValidationErrors | null {
    if (this.emtId == null) {
      if(control.value !== null && control.value !== '') {
      this.requireEMTMatchVal = this.emtList.filter(resFilter => resFilter.id === control.value);
      if (this.requireEMTMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }

  getTagTypeId(tagTypeId, i?: number) {
    this.tagTypeId = tagTypeId;
    if(this.workflowTypeId === 'WF-AST') {
      let tagListArrays = this.coasterForm.get('deviceList') as FormArray;
      tagListArrays.controls[i].patchValue({ "tagTypeId": tagTypeId });
    }
  }
  setUserName(data, type) {
    if (type === 'Doctor') {
      this.doctorName = data.name;
    } else if (type === 'EMT') {
      this.emtName = data.name;
    } else {
      this.pilotName = data.name;
    }
  }
  associateDriver(type) {
    let roleCode = 'RO-DO';
    if (type === 'Doctor') {
      roleCode = 'RO-DO';
      this.associateId = this.coasterForm.controls['doctorId'].value;
      this.doctorEnabled = false;
    } else if (type === 'EMT') {
      roleCode = 'RO-EMT';
      this.associateId = this.coasterForm.controls['emtId'].value;
      this.emtEnabled = false;
    } else {
      roleCode = 'RO-AMP';
      this.associateId = this.coasterForm.controls['pilotId'].value;
      this.inchargeEnabled = false;
    }
    if (this.associateId !== null) {
      const associateAssetByUser = { 'userId': this.associateId, 'assetId': this.data.assetId, 'roleCode' : roleCode };

      this.commonService.associateAssetByUser(associateAssetByUser).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.associateId = null;
        if (type === 'Doctor') {
          this.isDoctorDisable = true;
          this.doctorId = this.coasterForm.controls['doctorId'].value;
          this.data.doctorId = this.coasterForm.controls['doctorId'].value;
          this.coasterForm.get('doctorId').setValue(this.doctorName);
          this.coasterForm.get('doctorId').updateValueAndValidity();
        } else if (type === 'EMT') {
          this.isEMTDisable = true;
          this.emtId = this.coasterForm.controls['emtId'].value;
          this.data.emtId = this.coasterForm.controls['emtId'].value;
          this.coasterForm.get('emtId').setValue(this.emtName);
          this.coasterForm.get('emtId').updateValueAndValidity();
        } else {
          this.isDriverDisable = true;
          this.inchargeId = this.coasterForm.controls['pilotId'].value;
          this.data.pilotId = this.coasterForm.controls['pilotId'].value;
          this.coasterForm.get('pilotId').setValue(this.pilotName);
          this.coasterForm.get('pilotId').updateValueAndValidity();
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }

  }

  disAssociateUser(type) {
    let roleCode = 'RO-DO';
    if (type === 'Doctor') {
      roleCode = 'RO-DO';
      this.disassociateId = this.data.doctorId;
    } else if (type === 'EMT') {
      roleCode = 'RO-EMT';
      this.disassociateId = this.data.emtId;
    } else {
      roleCode = 'RO-AMP';
      this.disassociateId = this.data.pilotId;
    }
    if (this.disassociateId != null) {
      const disassociateAssetByUser = { 'assetId': this.data.assetId, 'userId': this.disassociateId, 'roleCode' : roleCode };

      this.commonService.disassociateAssetByUser(disassociateAssetByUser).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.disassociateId = null;
        if (type === 'Doctor') {
          this.isDoctorDisable = false;
          this.doctorId = null;
          this.data.doctorId = null;
          this.coasterForm.get('doctorId').setValue(null);
          this.coasterForm.get('doctorId').updateValueAndValidity();
        } else if (type === 'EMT') {
          this.emtId = null;
          this.data.emtId = null;
          this.isEMTDisable = false;
          this.coasterForm.get('emtId').setValue(null);
          this.coasterForm.get('emtId').updateValueAndValidity();
        } else {
          this.isDriverDisable = false;
          this.inchargeId = null;
          this.data.pilotId = null;
          this.coasterForm.get('pilotId').setValue(null);
          this.coasterForm.get('pilotId').updateValueAndValidity();
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }

  disAssociateCoaster() {
    if (this.data.tagId != null && this.workflowTypeId !== 'AT-MR') {
      const disAssociateDevice = { 'tagSerialNumber': this.data.tagId };
      if (this.workflowTypeId === 'WF-STF' && this.isdisassociateUserLocation) {
          const dialogRef = this.dialog.open(ConfirmationDialog, {
            panelClass: ['confirmation-popup'],
            data: {
              title: 'Confirm Delete',
              message: 'Are you sure you want to DisassociateTag?',
              buttonText: { ok: 'Yes', cancel: 'No' },
              isRemark: 0,
              isdisassociateLocation: true
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result?.confirmButtonText === 'Yes') {
              if(result?.deleteLocations === true){
                this.commonService.getUserLocationById(this.data?.id).subscribe(res => {
                  if (res.statusCode === 1 && res.results?.userPoolLocations?.length > 0) {
                    const userPoolSource = res.results.userPoolLocations.map(item => ({
                      ...item,
                      isDeletable: true
                    }));
                    const userLocations = { userPoolLocations: userPoolSource };

                    this.hospitalService.updateUserPool(userLocations, this.data?.id).subscribe(
                      res => this.toastr.success('Success', res.message),
                      error => this.toastr.error('Error', error.error.message)
                    );
                  }
                });
              }
              this.configurationService.disassociateTag(disAssociateDevice).subscribe(
                res => {
                  this.toastr.success('Success', res.message);
                  this.thisDialogRef.close('confirm');
                },
                error => this.toastr.error('Error', error.error.message)
              );
            }
          });
      } else {
        this.configurationService.disassociateTag({ tagSerialNumber: this.data.tagId }).subscribe(
          res => {
            this.toastr.success('Success', res.message);
            this.thisDialogRef.close('confirm');
          },
          error => this.toastr.error('Error', error.error.message)
        );
      }
    } else {
      this.disAssociateMRCoaster = {
        'assetId': this.data.assetId,
      }
      this.configurationService.MRdisassociateTag(this.disAssociateMRCoaster).subscribe(res => {
        if (res.statusCode !== 1) {
        }
        this.toastr.success('Success', `${res.message}`);

        this.thisDialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }

  public saveCoaster() {
    if (this.workflowTypeId !== 'AT-MR' && this.workflowTypeId !== 'WF-AST') {
      this.createCoaster = new CreateCoaster(null, null, null, null, null, null, null, null, null);
      this.createCoaster.tagSerialNumber = this.coasterForm.controls['tagSerialNumber'].value;
      this.createCoaster.comments = this.coasterForm.controls['comments'].value;
      this.createCoaster.tagAssociationId = this.data.associationId;
      this.createCoaster.tagAssociationType = this.data.associatedName;
      this.createCoaster.tagAssociationTypeId = this.data.associationTypeId;
      this.createCoaster.tagTypeId = this.tagTypeId;
      this.createCoaster.patientVisitId = this.data.visit_id;
      this.createCoaster.patientVisitEventId = this.data.visitEventId;
      if(this.workflowTypeId == 'WF-OT' && this.tagTypeId == null) { 
        this.createCoaster.canTagDisassociate = false;
      }
      this.configurationService.replaceAssociateTag(this.createCoaster).subscribe(result => {
        this.toastr.success('Success', `${result.message}`);

        this.thisDialogRef.close('confirm');
      },
        error => {
          if(error.error.errorCode == 'TWAPI0009') {
            this.checkTagDisassociate(error.error.message, this.createCoaster)
          } else {
          this.toastr.error('Error', `${error.error.message}`);
          }
        });
    } else if (this.workflowTypeId === 'WF-AST') {
      const volumeControl = <FormArray>this.coasterForm.controls['deviceList'];
      for (let i = 0; i < volumeControl.length; i++) {
        if (this.coasterForm.controls['deviceList'].value[i].tagSerialNumber != null) {
          this.tagDetail.push({
            'tagSerialNumber': this.coasterForm.controls['deviceList'].value[i].tagSerialNumber,
            'comment': this.coasterForm.controls['deviceList'].value[i].comments,
            'tagTypeId': this.coasterForm.controls['deviceList'].value[i].tagTypeId,
          });
        }
      }
      if (this.tagDetail.length > 0) {
        this.tagAssociation = {
          'tagAssociation': this.tagDetail,
          'tagAssociationId': this.data.associationId,
          'tagAssociationType': this.data.associatedName,
          'tagAssociationTypeId': this.data.associationTypeId,
        }
      }
      this.configurationService.replaceMultipleAssociateTag(this.tagAssociation).subscribe(result => {
        this.toastr.success('Success', `${result.message}`);

        this.thisDialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else {
        this.createMRCoaster = {
          'assetId': this.tagTypeId,
          'patientId': this.data.associationId
        }
      this.configurationService.MRAssociateTag(this.createMRCoaster).subscribe(result => {
        this.toastr.success('Success', `${result.message}`);

        this.thisDialogRef.close('confirm');
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
      });
    }
  this.coasterForm.reset();
  }
  checkTagDisassociate(msg, TagDetails) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: msg,
        buttonText: { cancel: 'No', ok: 'Yes' },
        MRTagDisassociate: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        TagDetails['canTagDisassociate'] = true; 
        this.configurationService.replaceAssociateTag(TagDetails).subscribe(result => {
            this.toastr.success('Success', `${result.message}`);    
            this.thisDialogRef.close('confirm');
          },
          error => {
            if(error.error.errorCode == 'TWAPI0009') {
              this.checkTagDisassociate(error.error.message, this.createCoaster)
            } else {
              this.toastr.error('Error', `${error.error.message}`);
            }
          }
        ); 
      }
    });
  }
  eventTrigger(){
    this.getMessageCoaster(this.selectedDate, 'notification', this.pageStart, this.pageSize, this.userId, 'RT-US')
  }
    fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-enroll-employee',
  templateUrl: './enroll-employee-register.component.html',
  styleUrls: ['./enroll-patient.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  
})

export class EnrollRegisterEmployeeComponent implements OnInit, AfterViewInit {

  public enrollEmployeeForm: FormGroup;
  public createEnrollEmployee: CreateEnrollEmployee;
  public editEnrollEmployee: EditEnrollEmployee;
  public createEnrollVisitor: CreateEnrollVisitor;
  public editEnrollVisitor: EditEnrollVisitor;
  public createEnrollTempId: CreateEnrollTempId;
  public editEnrollTempId: EditEnrollTempId;
  public facilityId: any;
  public genderList: any;
  public genderCode: any;
  public matcher = new ErrorStateMatcherService();
  public employeeTagList: any = [];
  public vitalTagList: any = [];
  public selected = false;
  public selectedTags: any = [];
  public vitalTagId = null;
  public employeeTagId = null;
  public employeeId = null;
  public today = new Date();
  public tempEmpId = false;
  public tempEmpIdList = [];
  public tempDataId: any;
  public countrycodeList = [];
  public countryOptions: Observable<any>;
  public visitorType: any[] = [];
  public visitorCheckout = null;
  public height: any;
  @ViewChild('input', { read: MatAutocompleteTrigger }) autoTrigger: MatAutocompleteTrigger;
  public emptyList: boolean;
  public workflowTypeId = null;
  employeeTagListItems: any=[];
  vitalTagListItems: any=[];
  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog, public datepipe: DatePipe,
    public thisDialogRef: MatDialogRef<EnrollRegisterEmployeeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,    private readonly apptermsService: ApptermsService,
    private readonly commonServices: CommonService, private readonly dateAdapter: DateAdapter<Date>, public _dateFormat: DatePipe) {
    this.facilityId = localStorage.getItem('ZmFjaWxpdHlJZA==');
  }

  ngOnInit() {
    this.workflowTypeId = this.data.workflowTypeId;
    this.commonServices.getAppTerms('VisitorType').subscribe(res => {
      this.visitorType = res.results;
    });
    this.commonServices.getAppTermsVerion2('CountryCode').subscribe(res => {
      this.countrycodeList = res.results;
      if(!this.data?.countryCode && !this.data?.id){
        this.apptermsService.setDefaultValue( this.enrollEmployeeForm,'countryCode',this.countrycodeList ,'code');
      }
    });

    this.buildForm();
    if (this.data.eType === 'tempId') {
      this.enrollEmployeeForm.get('employeeTagSerialNumber').setValidators(Validators.required);
      this.enrollEmployeeForm.get('employeeTagSerialNumber').updateValueAndValidity();
    } else {
      this.enrollEmployeeForm.get('employeeTagSerialNumber').setValidators(null);
      this.enrollEmployeeForm.get('employeeTagSerialNumber').updateValueAndValidity();
    }
    if (this.data.eType === 'visitor') {
      if (this.data.checkoutTime != null) {
        this.enrollEmployeeForm.get('employeeTagSerialNumber').disable();
      }
      this.enrollEmployeeForm.get('visitorTypeId').setValidators(Validators.required);
      this.enrollEmployeeForm.get('visitorTypeId').updateValueAndValidity();
      
      this.enrollEmployeeForm.get('mainidentifier').setValidators(null);
      this.enrollEmployeeForm.get('mainidentifier').updateValueAndValidity();
    } else {
      this.enrollEmployeeForm.get('visitorTypeId').setValidators(null);
      this.enrollEmployeeForm.get('visitorTypeId').updateValueAndValidity();
    }
    
    this.commonServices.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList = res.results;
    });
    if ('tagId' in this.data) {
      this.employeeTagId = this.data.tagId;
      this.enrollEmployeeForm.get('employeeTagSerialNumber').setValue(this.data.tagId);
      this.enrollEmployeeForm.get('employeeTagSerialNumber').updateValueAndValidity();
    }
    if ('tags' in this.data) {
      this.employeeId = this.data.mainidentifier;
      this.enrollEmployeeForm.get('mainidentifier').setValue(this.data.mainidentifier);
      this.enrollEmployeeForm.get('mainidentifier').updateValueAndValidity();
      const tagIds = this.data.tags;
      for (let j = 0; j < tagIds.length; j++) {
        console.log(tagIds[j]['tagTypeId']);
        if (tagIds[j]['tagTypeId'] === 'TT-IDCO') {
          this.employeeTagId = tagIds[j]['tagSerialNumber'];
          this.enrollEmployeeForm.get('employeeTagSerialNumber').setValue(tagIds[j]['tagSerialNumber']);
          this.enrollEmployeeForm.get('employeeTagSerialNumber').updateValueAndValidity();
        }
        if (tagIds[j]['tagTypeId'] === 'TT-VTBLE') {
          this.vitalTagId = tagIds[j]['tagSerialNumber'];
          this.enrollEmployeeForm.get('visitorTagSerialNumber').setValue(tagIds[j]['tagSerialNumber']);
          this.enrollEmployeeForm.get('visitorTagSerialNumber').updateValueAndValidity();
        }
      }
    }
    this.enrollEmployeeForm.get('countryCode').valueChanges
      .subscribe(value => {
        if (value === '+971') {
          this.enrollEmployeeForm.get('mobileNo').setValidators(Validators.pattern('^([4-9][0-9]{8})$'));
          this.enrollEmployeeForm.controls['mobileNo'].updateValueAndValidity();
        } else {
          this.enrollEmployeeForm.get('mobileNo').setValidators(Validators.pattern('^([6-9][0-9]{9})$'));
          this.enrollEmployeeForm.controls['mobileNo'].updateValueAndValidity();
        }
      });
    this.countryOptions = this.enrollEmployeeForm.controls['countryCode'].valueChanges.pipe(
      startWith(null),
      map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
    );
  }
  ngAfterViewInit() {
    if (this.data.eType === 'tempId') {
      this.autoTrigger.panelClosingActions.subscribe(x => {
        if (this.autoTrigger.activeOption) {
          this.enrollEmployeeForm.get('mainidentifier').setValue(this.autoTrigger.activeOption.value)
          this.checkEmpId(this.autoTrigger.activeOption.value);
        }
      });
    }
  }
  public buildForm() {

    this.enrollEmployeeForm = this.form.group({
      firstName: [this.data.firstName ? this.data.firstName : null,
      [Validators.required, Validators.pattern('[a-zA-Z.,\u0600-\u06FF ]*'), Validators.minLength(3), Validators.maxLength(50)]],
      mainidentifier: [this.data.mainidentifier ? this.data.mainidentifier : null, [Validators.required]],
      hostEmployeeId: [this.data.hostEmployeeId ? this.data.hostEmployeeId : null],
      email: [this.data.email ? this.data.email : null, [Validators.email]],
      gender: [this.data.gender ? this.data.gender : null],
      mobileNo: [this.data.mobileNo ? this.data.mobileNo : this.data.phoneNumber ? this.data.phoneNumber : null],
      employeeTagSerialNumber: [null, [Validators.required]],
      visitorTagSerialNumber: [null],
      birthDate: [this.data.birthDate ? this.data.birthDate : null],
      joinDate: [this.data.joinDate ? this.data.joinDate : null],
      managerId: [this.data.managerId ? this.data.managerId : null],
      quarantineSDate: [this.data.quarantineStartDate ? this.data.quarantineStartDate : null],
      quarantineEDate: [this.data.quarantineEndDate ? this.data.quarantineEndDate : null],
      comments: [this.data.comments ? this.data.comments : null],
      visitorTypeId: [this.data.visitorTypeId ? this.data.visitorTypeId : 'VI-VI'],
      countryCode: [this.data.countryCode ? this.data.countryCode : null],
      department: [null]
    });
  }
  onWindowResized(size) {
    this.height = size;
  }
  searchTempId(id, type, event) {
    if (id !== '') {
      if (type === 'TT-ID' && (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode === 17)) {
        this.commonServices.searchByMainidentifer(id).subscribe(res => {
          if (res.results.length == 0) {
            this.emptyList = true;
          }
          this.tempEmpIdList = res.results;
        });
      } else if (this.autoTrigger.panelOpen && (event.keyCode == 38 || event.keyCode == 40)) {
        this.enrollEmployeeForm.get('mainidentifier').setValue(this.autoTrigger.activeOption.value);
      } else {

        const tempEmpIdList = this.tempEmpIdList;
        this.tempEmpIdList = tempEmpIdList;
      }
    } else {
      this.tempEmpIdList = [];
      this.data = [];
      this.data.eType = 'tempId';
      this.buildForm();
    }
  }

  checkEmpId(data) {
    if (data.hasOwnProperty('mainidentifier')) {
      this.data = data;
    } else {
      let filter = this.tempEmpIdList.filter(res => res.mainidentifier === data.toString());
      this.data = filter[0];
    }
    this.data.eType = 'tempId';
    this.workflowTypeId = 'WF-EM';
    this.emptyList = false;
    this.buildForm();
  }

  searchTagAssociation(event, type) {
    let tagId = event.text;  
    if (tagId !== '') {
      if(type === 'TT-IDCO' && event.type === 'idCard' && event.text.length >= 2) {
        if (event.toHit == true) {      
          this.commonServices.getAllTagByType(tagId, this.workflowTypeId, 'ST-AT').subscribe(res => {
            this.employeeTagListItems = res.results;
            this.employeeTagList = this.employeeTagListItems;
          });
        } else {
          this.employeeTagList = this.employeeTagListItems;
        }
      } else {
        this.employeeTagList = [];
      }
      if(type === 'TT-VTBLE' && event.type === 'vitalTag' && event.text.length >= 2) {
        if (event.toHit == true) {
          this.commonServices.searchTagAssociate(tagId, type, 'ST-AT').subscribe(res => {
            this.vitalTagListItems = res.results;
            this.vitalTagList = this.vitalTagListItems;
          });
        } else {
          this.vitalTagList = this.vitalTagListItems;
        }
      } else {
        this.vitalTagList = [];
      }
    } else {
      this.employeeTagList = [];
      this.vitalTagList = [];
    }
  }

  disAssociateTag(tagId) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Disassociate Device', message: 'Do you want to disassociate the device?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'tagId': tagId, 'isRemark': 1, 'disAssociateCoaster': true
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.thisDialogRef.close('confirm');
        this.visitorCheckout = this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
        this.updateRegisterVisitor(this.data);
      }
    });
  }

  saveRegisterEmployee() {
    this.createEnrollEmployee = new CreateEnrollEmployee(null, null, null, null, null, null, null, null, null, null, null, null);
    this.createEnrollEmployee.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.createEnrollEmployee.mainidentifier = this.enrollEmployeeForm.controls['mainidentifier'].value;
    this.createEnrollEmployee.mobileNo = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.createEnrollEmployee.email = this.enrollEmployeeForm.controls['email'].value;
    this.createEnrollEmployee.gender = this.enrollEmployeeForm.controls['gender'].value;
    this.createEnrollEmployee.birthDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['birthDate'].value, 'yyyy-MM-dd');
    this.createEnrollEmployee.managerId = this.enrollEmployeeForm.controls['managerId'].value;
    this.createEnrollEmployee.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    this.createEnrollEmployee.joinDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['joinDate'].value, 'yyyy-MM-dd');

    this.createEnrollEmployee.quarantineStartDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['quarantineSDate'].value, 'yyyy-MM-dd');
    this.createEnrollEmployee.quarantineEndDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['quarantineEDate'].value, 'yyyy-MM-dd');
    let tagIds = [];
    if (this.employeeTagId === null && this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value != null &&
      this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value !== '') {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value];
      }
    }
    if (this.vitalTagId === null && this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value != null &&
      this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value !== '') {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value];
      }
    }
    this.createEnrollEmployee.tagId = tagIds;
    this.commonServices.createRegisterEmployee(this.createEnrollEmployee).subscribe(res => {
      this.toastr.success('Success', `${res.message}`,);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateRegisterEmployee(data) {
    this.editEnrollEmployee = new EditEnrollEmployee(null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editEnrollEmployee.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.editEnrollEmployee.mainidentifier = this.enrollEmployeeForm.controls['mainidentifier'].value;
    this.editEnrollEmployee.mobileNo = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.editEnrollEmployee.email = this.enrollEmployeeForm.controls['email'].value;
    this.editEnrollEmployee.gender = this.enrollEmployeeForm.controls['gender'].value;
    this.editEnrollEmployee.managerId = this.enrollEmployeeForm.controls['managerId'].value;
    this.editEnrollEmployee.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    this.editEnrollEmployee.birthDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['birthDate'].value, 'yyyy-MM-dd');
    this.editEnrollEmployee.joinDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['joinDate'].value, 'yyyy-MM-dd');

    this.editEnrollEmployee.quarantineStartDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['quarantineSDate'].value, 'yyyy-MM-dd');
    this.editEnrollEmployee.quarantineEndDate = this._dateFormat.transform(this.enrollEmployeeForm.controls['quarantineEDate'].value, 'yyyy-MM-dd');
    this.editEnrollEmployee.id = this.data.id;
    let tagIds = [];

    if (this.employeeTagId === null && this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value != null &&
      this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value !== '') {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value];
      }
    }
    if (this.vitalTagId === null && this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value != null &&
      this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value !== '') {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['visitorTagSerialNumber'].value];
      }
    }
    if (this.employeeTagId === null || this.vitalTagId === null) {
      this.editEnrollEmployee.tagId = tagIds;
    }
    this.commonServices.updateRegisterEmployee(this.editEnrollEmployee).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      console.log('403 module level error....', error);
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  saveRegisterVisitor() {
    this.createEnrollVisitor = new CreateEnrollVisitor(null, null, null, null, null, null, null, null, null, null);
    this.createEnrollVisitor.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.createEnrollVisitor.hostEmployeeId = this.enrollEmployeeForm.controls['hostEmployeeId'].value;
    this.createEnrollVisitor.phoneNumber = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.createEnrollVisitor.email = this.enrollEmployeeForm.controls['email'].value;
    this.createEnrollVisitor.gender = this.enrollEmployeeForm.controls['gender'].value;
    this.createEnrollVisitor.tagId = this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value;
    this.createEnrollVisitor.comments = this.enrollEmployeeForm.controls['comments'].value;
    this.createEnrollVisitor.visitorTypeId = this.enrollEmployeeForm.controls['visitorTypeId'].value;
    this.createEnrollVisitor.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    this.createEnrollVisitor.facilityId = this.facilityId;


    this.commonServices.createRegisterVisitor(this.createEnrollVisitor).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });

  }

  updateRegisterVisitor(data) {
    this.editEnrollVisitor = new EditEnrollVisitor(null, null, null, null, null, null, null, null, null, null, null);
    this.editEnrollVisitor.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.editEnrollVisitor.hostEmployeeId = this.enrollEmployeeForm.controls['hostEmployeeId'].value;
    this.editEnrollVisitor.phoneNumber = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.editEnrollVisitor.email = this.enrollEmployeeForm.controls['email'].value;
    this.editEnrollVisitor.gender = this.enrollEmployeeForm.controls['gender'].value;
    if (this.data.tagId === null) {
      this.editEnrollVisitor.tagId = this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value;
    }
    this.editEnrollVisitor.comments = this.enrollEmployeeForm.controls['comments'].value;
    this.editEnrollVisitor.checkoutTime = this.visitorCheckout;
    this.editEnrollVisitor.visitorTypeId = this.enrollEmployeeForm.controls['visitorTypeId'].value;
    this.editEnrollVisitor.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    this.editEnrollVisitor.id = this.data.id;

    this.commonServices.updateRegisterVisitor(this.editEnrollVisitor).subscribe(res => {
      if (this.visitorCheckout == null) {
        this.toastr.success('Success', `${res.message}`);
      }
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  saveRegisterTempId() {
    this.createEnrollTempId = new CreateEnrollTempId(null, null, null, null, null, null, null, null, null);
    this.createEnrollTempId.isTemporaryTagId = true;
    this.createEnrollTempId.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.createEnrollTempId.mainidentifier = this.enrollEmployeeForm.controls['mainidentifier'].value;
    this.createEnrollTempId.mobileNo = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.createEnrollTempId.email = this.enrollEmployeeForm.controls['email'].value;
    this.createEnrollTempId.gender = this.enrollEmployeeForm.controls['gender'].value;
    this.createEnrollTempId.managerId = this.enrollEmployeeForm.controls['managerId'].value;
    this.createEnrollTempId.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    let tagIds = [];
    if (this.employeeTagId === null && this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value != null) {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value];
      }
    }
    this.createEnrollTempId.tagId = tagIds;

    this.commonServices.createRegisterEmployee(this.createEnrollTempId).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateRegisterTempId(data) {
    this.editEnrollTempId = new EditEnrollTempId(null, null, null, null, null, null, null, null, null, null);
    this.editEnrollTempId.isTemporaryTagId = true;
    this.editEnrollTempId.firstName = this.enrollEmployeeForm.controls['firstName'].value;
    this.editEnrollTempId.mainidentifier = this.enrollEmployeeForm.controls['mainidentifier'].value;
    this.editEnrollTempId.mobileNo = this.enrollEmployeeForm.controls['mobileNo'].value;
    this.editEnrollTempId.email = this.enrollEmployeeForm.controls['email'].value;
    this.editEnrollTempId.gender = this.enrollEmployeeForm.controls['gender'].value;
    this.editEnrollTempId.managerId = this.enrollEmployeeForm.controls['managerId'].value;
    this.editEnrollTempId.countryCode = this.enrollEmployeeForm.controls['countryCode'].value;
    this.editEnrollTempId.id = this.data.id;
    let tagIds = [];
    if (this.employeeTagId === null && this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value != null) {
      if (tagIds.length > 0) {
        tagIds.push(this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value);
      } else {
        tagIds = [this.enrollEmployeeForm.controls['employeeTagSerialNumber'].value];
      }
    }
    if (this.employeeTagId === null) {
      this.editEnrollTempId.tagId = tagIds;
    }

    this.commonServices.updateRegisterEmployee(this.editEnrollTempId).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-enroll-infant',
  templateUrl: './enroll-infant.component.html',
  styleUrls: ['./enroll-patient.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }],
    encapsulation: ViewEncapsulation.None
})

export class EnrollInfantComponent implements OnInit {

  public infantForm: FormGroup;
  public matcher = new ErrorStateMatcherService();
  public createInfant: CreateInfant;
  public editInfant: EditInfant;
  public searchInfantlist: any=[];
  public searchCosterlist: any=[];
  public bedList: Array<any> = [];
  public doctorList: Array<any> = [];
  public newDoctorList: Array<any> = [];
  infantDetail: Array<any>;
  infantDetailLocal: any;
  public facilityId: string;
  blockDetail: any = null;
  floorDetail: any[] = [];
  locationDetail: any[] = [];
  infantDetails = [];
  blockId: any = null;
  locationId: number = null;
  public today = new Date();
  requireBedMatchVal: any[];
  requireDoctorMatchVal: any[];
  removedInfant: any=[];
  motherBedId = null;
  infantDoctorId = null;
  motherLocationId = null;
  public tagTypeId = null;
  public workflowTypeId = null;
  public enrollType = null;
  public height: any;
  validDates: any[];
  bedMatch = true;
  coasterInListItems: any;
  coasterListItems: any;
  isMotherBed: boolean[] = [];
  motherBedValue: any;
  requireTagMatchVal: any[];
  tagMatch = true;
  tagId: any;
  requireInfantTagMatchVal: any[];
  tagOption: any=[];
  motherId: any;
  motherList: any=[];
  motherListItems: any[];
  bedBindList: any[];
  bedBindListId = null;
  requireMotherMatchVal: any=[];
  infantModifyBedId = null;
  infantTagId: any;
  genderList: any=[];
  genderCode = 'Female';
  searchMotherBedId: any;
  infantId = null;
  patientVisitId = null;
  infantBedName = null;
  isInfantBed = false;
  bedListPrev: any[];
  activate_btn: any=[];
  public createCoaster: CreateCoaster;
  batteryPercentage = null;
  tagExist = false;
  isDisabled = false;
  isMotherBedFlags: any = [];
  visitTypeId =null;
  countryOptions: Observable<any>;
  public countrycodeList = [];
  phoneMessage = null;

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<EnrollRegisterPatientComponent>, private readonly apptermsService: ApptermsService,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService,
    private readonly _dateFormat: DatePipe, private readonly dateAdapter: DateAdapter<Date>, public datepipe: DatePipe,
    private readonly lookupTermService: LookupTermService) {
      this.activate_btn = this.commonService.getActivePermission('button');
    if (this.data.floorId) {
      this.commonService.getAllLocationById(this.data.floorId).subscribe(res => {
        this.locationDetail = res.results[0].locations;
        this.blockId = res.results[0].parentId;
        this.locationId = this.data.locationId;
      });
    }
  }

  ngOnInit() {
    this.lookupTermService.getAppTermsVerion2Wrapper('Gender').subscribe(res => {
      console.log(res)
      this.genderList = res?.Gender ?? [];
    });
    this.workflowTypeId = this.data.workflowTypeId;
    this.visitTypeId = this.workflowTypeId?.replace(/^[^-]+-/, 'VT-');
    this.enrollType = this.data.eType;
    this.getFloorList();
    this.getAllLocationDetail();
    if (this.data.id) {
      this.motherId = this.data.motherId;
      this.motherBedId = this.data.bedId;
      this.infantDoctorId = this.data.doctorId;
      if (this.data.gender === null && this.data.isChild === false) {
        this.genderCode = 'Female';
      } else {
        this.genderCode = this.data.gender;
      }
    }
    this.buildForm();
    if(this.data.isChild === false && this.data.children && this.data.children.length > 0) {
      for ( let i = 0; i < this.data.children.length; i++) {
       this.isMotherBedFlags = this.data.children.map(child => child.bedId === this.data.bedId);
        this.data.children.id = this.data.children[i].id;
        this.data.children.firstName = this.data.children[i].firstName;
        this.data.children.middleName = this.data.children[i].middleName ;
        this.data.children.lastName = this.data.children[i].lastName;
        this.data.children.gender = this.data.children[i].gender;
        this.data.children.birthDate = this.data.children[i].birthDate;
        this.data.children.tag = this.data.children[i].associatedTagSerialNumber;
        this.data.children.associatedTagSerialNumber = this.data.children[i].associatedTagSerialNumber;
        this.data.children.tagTypeId = this.data.children[i].tagTypeId;
        this.data.children.bedId = this.data.children[i].bedId;
        this.data.children.packageDate = this.data.children[i].packageDate;
        this.data.children.bedName = this.data.children[i].bedName;
        this.data.children.locationId = this.data.children[i].locationId;
        this.data.children.patientVisitId = this.data.children[i].patientVisitId;
        const control = <FormArray>this.infantForm.controls['infantDetails'];
        control.push(this.getInfantRecord(i));
         let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
        if(this.data.children[i].bedId != null && this.data.children[i].bedId != '') {
          infantListArrays.controls[i].get('infantBedId').disable();
        }
      }
    }
    if(this.data?.associatedTagSerialNumber !== null && this.data?.associatedTagSerialNumber !== undefined) {
      this.tagExist = true;
      const tags = {"entityIds": [this.data?.associatedTagSerialNumber]};
      this.commonService.getTagBatteryStatus(tags).subscribe(res => {
        this.batteryPercentage = res.results[0]?.batteryValue;
      });
    }
    this.lookupTermService.getAppTermsVerion2Wrapper('CountryCode').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      if (!this.data?.countryCode && !this.data.id) {
        this.apptermsService.setDefaultValue(this.infantForm, 'countryCode', this.countrycodeList, 'code');
        this.getPhoneValidate(this.infantForm.controls['countryCode']?.value, 'code')
      }
    });
    this.countryOptions = this.infantForm.controls['countryCode'].valueChanges.pipe(
      startWith(...[null as string | null]),
      map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
    );
  }
  getGenderType(data) {
    this.genderCode = data.code;
  }
  getInfantGenderType(data, i) {
    let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
    infantListArrays.controls[i].patchValue({ "infantGender": data });
  }
  onWindowResized(size) {
    this.height = size;
  }
  phoneNumber(type) {
    if(type === 'enable') {
      this.infantForm.controls['mobileNo'].enable();
      this.infantForm.controls['countryCode'].enable();
      this.infantForm.controls['countryCode'].setValue(null);
      this.infantForm.controls['mobileNo'].setValue(null);
    } else {
      this.infantForm.controls['mobileNo'].disable();
      this.infantForm.controls['countryCode'].disable();
    }
  }
  onMobileInput() {
    const control = this.infantForm.get('mobileNo');
    const value = control?.value;
    if (control?.valid) {
      this.getPhoneValidate(value, 'phone');
    }
  }

  getPhoneValidate(data, type) {
    const code = type === 'code' ? data : this.infantForm.get('countryCode')?.value;
    const phone = type === 'phone' ? data : null;
    this.commonService.phoneValidate(code, phone).subscribe(res => {
      if(res.results) {
        if(type === 'code') {
          const length = res.results?.length;
          this.infantForm.get('mobileNo').setValidators(Validators.pattern(`^[0-9]{${length}}$`));
          this.infantForm.get('mobileNo').updateValueAndValidity();
        }
      } else {
        const control = this.infantForm.get('mobileNo');
        control?.setErrors({ invalidPhone: true });
        this.phoneMessage = res.message;
      }
    });
  }
  clearUHID(event) {
    if (event.type === 'uhid' && event.text === '') {
      this.infantForm.reset();
    }
  }
  clearChild(type, i?) {
    if(type === 'bedId') {
      this.infantForm.controls.bedId.setValue(null);
    } else {
      let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
      infantListArrays.controls[i].patchValue({ "infantBedId": null });
      infantListArrays.controls[i].get('infantBedId').enable();
      this.isMotherBedFlags[i] = false;
      this.isMotherBed[i] = false;
     }
  }
  validateEntitySelection(event) {
    if (event === 'tag-mother') {
      const control = this.infantForm.get('tagSerialNumber')
      if (!control) return;
      const tagValue = control.value;
      const isValid = this.searchCosterlist?.some(item => item.tagId === tagValue);
      if (!isValid && this.data.associatedTagSerialNumber && this.tagExist == true) {
        control.setValue(this.data.associatedTagSerialNumber);
        const errors = control.errors;
        if (errors?.requireMatch) {
          delete errors.requireMatch;
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      } else if (!isValid) {
        control.setValue(null);
      }
    } else if (event === 'tag-infant') {
      const control = this.infantForm.get('tagSerialNumber')
      if (!control) return;
      const tagValue = control.value;
      const isValid = this.searchInfantlist?.some(item => item.tagId === tagValue);
      if (!isValid && this.data.associatedTagSerialNumber && this.tagExist == true) {
        control.setValue(this.data.associatedTagSerialNumber);
        const errors = control.errors;
        if (errors?.requireMatch) {
          delete errors.requireMatch;
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      } else if (!isValid) {
        control.setValue(null);
      }
    } else if (event === 'bed') { 
      const control = this.infantForm.get('bedId');
      if (!control) return; 
      const bedValue = control.value; 
      const isValid = this.bedList?.some(item => item.bedId === bedValue);
      if (!isValid && this.data.bedId && this.isInfantBed === false) {
        control.setValue(this.data.bedName);
        this.isMotherBedFlags = [false];
      } else if (!isValid) {
        control.setValue(null);
      } 
    }
  }

  getUHID(value) {
    if (value === '') {
      this.infantForm.reset();
    }
    const uhid = value;
    this.infantForm.reset();
    this.commonService.getUHID(uhid,null,null,null,this.visitTypeId).subscribe(res => {
      const visitEvent = this.data.visitEvent;
      this.data = res.results;
      this.motherId = this.data.motherId;
      this.motherBedId = this.data.bedId;
      this.infantDoctorId = this.data.doctorId;
      if (this.data.gender === null && this.data.isChild === false) {
        this.genderCode = 'Female';
      } else {
        this.genderCode = this.data.gender;
      }
      this.data.visitEvent = visitEvent;
      this.buildForm();
      if(this.data.children && this.data.children.length > 0) {
        for ( let i = 0; i < this.data.children.length; i++) {
          this.data.children.id = this.data.children[i].id;
          this.data.children.firstName = this.data.children[i].firstName;
          this.data.children.middleName = this.data.children[i].middleName ;
          this.data.children.lastName = this.data.children[i].lastName;
          this.data.children.gender = this.data.children[i].gender;
          this.data.children.birthDate = this.data.children[i].birthDate;
          this.data.children.tag = this.data.children[i].associatedTagSerialNumber;
          this.data.children.associatedTagSerialNumber = this.data.children[i].associatedTagSerialNumber;
          this.data.children.tagTypeId = this.data.children[i].tagTypeId;
          this.data.children.packageDate = this.data.children[i].packageDate;
          this.data.children.bedId = this.data.children[i].bedId;
          this.data.children.bedName = this.data.children[i].bedName;
          this.data.children.locationId = this.data.children[i].locationId;
          this.data.children.patientVisitId = this.data.children[i].patientVisitId;
          const control = <FormArray>this.infantForm.controls['infantDetails'];
          control.push(this.getInfantRecord(i));
        }
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.infantForm.reset();
        this.data.mainidentifier = uhid;
        this.buildForm();
      });
  }
  private requireMotherMatch(control: FormControl): ValidationErrors | null {
    if (this.motherId == null) {
      if(control.value !== null && control.value !== '') {
      this.requireMotherMatchVal = this.motherList.filter(resFilter => resFilter.patientId === control.value);
      if (this.requireMotherMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  private requireTagMatch(control: FormControl): ValidationErrors | null {
    if (this.tagId === null) {
      if(control.value !== null && control.value !== '') {
      this.requireTagMatchVal = this.searchCosterlist.filter(resFilter => resFilter.tagId === control.value);
      if (this.requireTagMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  private requireInfantTagMatch(control: FormControl): ValidationErrors | null {
    if (this.infantTagId === null) {
      if(control.value !== null && control.value !== '') {
        this.requireInfantTagMatchVal = this.searchInfantlist.filter(resFilter => resFilter.tagId === control.value);
      if (this.requireInfantTagMatchVal.length === 0) {
          this.tagMatch = false;
          return { requireMatch: true };
        } else {
          this.tagMatch = true;
        }
      }
      return null;
    }
  }
  private requireBedMatch(control: FormControl): ValidationErrors | null {
    if (this.searchMotherBedId === null) {
      if(control.value !== null && control.value !== '') {
      this.requireBedMatchVal = this.bedList.filter(resFilter => resFilter.bedId === control.value);
      if (this.requireBedMatchVal.length === 0) {
          this.bedMatch = false;
          return { requireMatch: true };
        } else {
          this.bedMatch = true;
        }
      }
      return null;
    }
  }
  private requireDoctorMatch(control: FormControl): ValidationErrors | null {
    if (this.infantDoctorId === null) {
      if(control.value !== null && control.value !== '') {
      this.requireDoctorMatchVal = this.doctorList.filter(resFilter => resFilter.id === control.value);
      if (this.requireDoctorMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getFloorList() {
    this.commonService.getFloorList().subscribe(res => {
      this.locationDetail = res.results;
    });
  }

  public buildForm() {
    this.infantForm = this.form.group({
      motherId: [this.data.motherName ? this.data.motherName : null, this.requireMotherMatch.bind(this)],
      firstName: [this.data.firstName ? this.data.firstName : null, [Validators.required]],
      middleName: [this.data.middleName ? this.data.middleName : null],
      lastName: [this.data.lastName ? this.data.lastName : null],
      mainidentifier: [this.data.mainidentifier ? this.data.mainidentifier : null],
      countryCode: [this.data.countryCode ? this.data.countryCode : null],
      mobileNo: [this.data.mobileNo ? this.data.mobileNo : null],
      birthDate: [this.data.birthDate ? new Date(this.data.birthDate) : null],
      gender: [(this.enrollType == 'mother' || (this.data.isChild === false && this.data.gender === null)) ? this.genderCode : this.data.gender ],
      tagSerialNumber: [this.data.associatedTagSerialNumber ? this.data.associatedTagSerialNumber : null, this.requireTagMatch.bind(this)],
      bedId: [this.data.bedName ? this.data.bedName : null, [Validators.required,this.requireBedMatch.bind(this)]],
      doctorId: [this.data.doctorName ? this.data.doctorName : null, [this.requireDoctorMatch.bind(this)]],
      visitDate: [this.data.packageDate ? this.data.packageDate : this.today, [Validators.required]],
      infantDetails: this.form.array([]),
    });
    if (this.data?.id) {
      this.infantForm.controls?.bedId.disable();
    }
    if(this.data?.mobileNo && this.data?.mobileNo !== null) {
      this.phoneNumber('disable');
    }
  }
  private getInfantRecord(i) {
    return this.form.group({
      id: [this.data.children ? this.data.children.id : null],
      patientVisitId: [this.data.children.patientVisitId ? this.data.children.patientVisitId : null],
      name: [this.data.children ? this.data.children.firstName : null],
      middleName: [this.data.children ? this.data.children.middleName : null],
      lastName: [this.data.children ? this.data.children.lastName : null],
      infantGender: [this.data.children ? this.data.children.gender : null],
      infantBirthDate: [this.data.children ? this.data.children.birthDate : null],
      tag: [this.data.children ? this.data.children.associatedTagSerialNumber : null],
      tagId: [this.data.children ? this.data.children.associatedTagSerialNumber : null, this.requireInfantTagMatch.bind(this)],
      tagTypeId: [this.data.children ? this.data.children.tagTypeId : null],
      infantVisitDate: [this.data.children ? this.data.children.packageDate : this.today, [Validators.required]],
      infantBed: [this.data.children ? this.data.children.bedId : null],
      infantBedId: [this.data.children ? this.data.children.bedName : null, [Validators.required,this.requireBedMatch.bind(this)]],
      locationId: [this.data.children ? this.data.children.locationId : null],
    });
  }

  addRow(i?) {
    const control = <FormArray>this.infantForm.controls['infantDetails'];
    const index = control.length;
    control.push(this.getInfantDetails(index));
    this['isInfantBedId' + index] = false;
    if (index) {
      for (let i = 0; i < control?.length; i++) {
        this.isMotherBed[i] = this.isMotherBed[i] === true ? true : false;
      }
    } 
  }

  private getInfantDetails(i?: number) {
    return this.form.group({
      id: [null],
      patientVisitId: [null],
      name: [this.infantForm.controls['firstName'].value !== null ? 'Baby of ' + this.infantForm.controls['firstName'].value : null],
      middleName: [null],
      lastName: [null],
      infantGender: [null],
      infantBirthDate: [null],
      tag: [null],
      tagId: [null],
      tagTypeId: [null],
      infantVisitDate: [this.today, [Validators.required]],
      infantBed: [this.isMotherBed[i] === true ? this.motherBedValue : null],
      infantBedId: [this.isMotherBed[i] === true ? (this.infantBedName !== null ? this.infantBedName : this.motherBedValue) : null,
        [Validators.required,this.requireBedMatch.bind(this)]],
      locationId: [this.isMotherBed[i] === true ? (this.motherLocationId !== null ? this.motherLocationId : this.data.locationId)  : null],
    });
  }

  removeRow(i: number, type) {
    if (this.data.children) {
      const locDetail = this.infantForm.controls['infantDetails'].value[i].name;
      const locIndex = this.data.children.findIndex(res => res.firstName === locDetail);
      if (locIndex !== -1) {
        this.data.children[locIndex]['isDeletable'] = true;
        this.removedInfant.push({
          'id': this.data.children[locIndex].id,
          'patientVisitId': this.data.children[locIndex].patientVisitId,
          'firstName': this.data.children[locIndex].firstName,
          'middleName': this.data.children[locIndex].middleName,
          'lastName': this.data.children[locIndex].lastName,
          'gender': this.data.children[locIndex].gender,
          'birthDate': this.data.children[locIndex].birthDate,
          'tagSerialNumber': this.data.children[locIndex].associatedTagSerialNumber,
          'tagTypeId': this.data.children[locIndex].tagTypeId,
          'packageDate' : this.data.children[locIndex].packageDate,
          'bedId' : this.data.children[locIndex].bedId,
          'locationId': this.data.children.locationId,
          'isDeletable': true
        });
      }
    }
    const control = <FormArray>this.infantForm.controls['infantDetails'];
    if (this.infantForm.controls['infantDetails'].value[i].tagId !== null) {
      this.tagOption = this.tagOption.filter(x => this.infantForm.controls['infantDetails'].value[i].tagId.indexOf(x) === -1);
    } 
    const index = control?.length - 1;
    this['isInfantBedId' + index] = false;
    control.removeAt(i);
    for(let i=0; i<control?.length; i++) {
      if(this.infantForm.controls['infantDetails'].value[i].infantBedId !== null && this.infantForm.controls['infantDetails'].value[i].infantBedId !== '') {
        this['isInfantBedId' + i] = true;
      } else {
        this['isInfantBedId' + i] = false;
      }
    }
  }
  searchMotherDetails(event) {
    this.isInfantBed = false;
    this.motherId = null;
    if(event.type === 'searchMother' && event.text.length > 2) {
      if (event.toHit == true) {
        this.commonService.searchMother(event.text).subscribe(res => {
          this.motherListItems = res.results;
          this.motherList = this.motherListItems;
        });
      } else {
        this.motherList = this.motherListItems;
      }
    } else {
      this.motherList = [];
    }
  }
  searchToCoster(event) {
    this.tagId = null;
    if(event.type === 'searchCoster' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, 'WF-MOT', 'ST-AT').subscribe(res => {
          this.coasterListItems = res.results;
          this.searchCosterlist = this.coasterListItems;
        });
      } else {
        this.searchCosterlist = this.coasterListItems;
      }
    } else {
      this.searchCosterlist = [];
    }
  }
  searchToInfantCoster(event) {
    this.infantTagId = null;
    if(event.type === 'searchInfantCoster' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, 'WF-INF', 'ST-AT').subscribe(res => {
          this.coasterInListItems = res.results;
          this.searchInfantlist = this.coasterInListItems;
        });
      } else {
        this.searchInfantlist = this.coasterInListItems;
      }
    } else {
      this.searchInfantlist = [];
    }
  }
  filterTagOptions(value, i) {
    let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
    infantListArrays.controls[i].patchValue({ "tag": value });
    if (value !== null) {
        this.tagOption.push(value);
      } else {
        this.tagOption.push(value);
      }
  }
  getTagTypeId(tagTypeId) {
    this.tagTypeId = tagTypeId;
  }
  getInfantTagTypeId(value, i) {
    let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
    infantListArrays.controls[i].patchValue({ "tagTypeId": value });
  }
  searchAssociationDetails(event, type) {
    this.isInfantBed = false;
    if ((event.type === 'searchBed' || event.type === 'searchInfantBed') && event.text !== '') {
      if (type === 'bed' && (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 ||event.keyCode === 17)) {
        this.searchMotherBedId = null;
      if(event.type === 'searchBed') {
        this.motherBedId = null;
      }
        if (event.text.length >= 2) {
          this.commonService.searchInfantBedLocation('LC-INT', event.text, 'WF-INF').pipe(
            debounceTime(3000),
            distinctUntilChanged(),
          ).subscribe(res => {
            this.bedList = res.results;
            if (this.data.id && this.data.bedId !== null) {
              this.bedList = this.bedList.filter(x => x.bedId !== this.data.bedId);
              this.bedList = this.bedList.concat([{bedId: this.data.bedId, bedName: this.data.bedName,
              locationId: this.data.locationId, locationName: null}]);
            }
          });
        }
      } else if (type === 'bed' && (event.keyCode == 38 || event.keyCode == 40)) {
        const bedList = this.bedList;
        this.bedList = bedList;
      } else {
        this.bedList = [];
      }
    }
    if (event.type === 'searchDoctor' && event.text !== '') {
      if (type === 'doctor' && (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190 || event.keyCode === 17)) {
        this.infantDoctorId = null;
        if (event.text.length >= 2) {
          this.commonService.searchDoctor(event.text, 'UT_DOCTOR', 'RO-DO').pipe(
            debounceTime(3000),
            distinctUntilChanged(),
          ).subscribe(res => {
            this.doctorList = res.results;
            this.newDoctorList = this.doctorList;
          });
        }
      } else if (type === 'doctor' && (event.keyCode == 38 || event.keyCode == 40)) {
        const doctorList = this.doctorList;
        this.doctorList = doctorList;
        this.newDoctorList = this.doctorList;
      } else {
        this.doctorList = [];
      }
    }
  }
  getMotherList(patientId: string) {
    if (patientId) {
      const doctors = this as any as { patientId: string, patientName: string }[];
      return doctors.find(obj => obj.patientId === patientId).patientName;
    } else {
      return '';
    }
  }
  getDoctorList(id: string) {
    if (id) {
      const doctors = this as any as { id: string, name: string }[];
      return doctors.find(obj => obj.id === id).name;
    } else {
      return '';
    }
  }
  getBedList(id: string) {
    if (id) {
      const bed = this as any as { bedId: string, bedName: string, locationId: string, locationName: string }[]
      const bedId = bed.find(obj => obj.bedId === id).bedName; 
      // + (bed.find(obj => obj.bedId === id).locationName !== null ? ', ' +
      // bed.find(obj => obj.bedId === id).locationName : '');
      return bedId;
    } else {
      return '';
    }
  }
  sameMotherLoc(isChecked) {
    if(this.bedList && this.bedList.length !== 0) {
      this.bedListPrev = this.bedList;
    }
    this.bedList = [];
    this.isInfantBed = true;
    this.searchMotherBedId = 0;
    if (isChecked) {
      this.isInfantBed = true;
      let id = this.infantForm.controls['motherId'].value;
      if (isNaN(Number(id))) {
        id = this.data?.motherId;
      }
      this.commonService.getBedByMotherId(id).subscribe(res => { 
        if(res.statusCode !== 0) {
          this.motherBedId = res.results.bedId;
          this.motherLocationId = res.results.locationId;
          this.infantForm.controls['bedId'].setValidators(Validators.required);
          this.infantForm.controls['bedId'].setValue(res.results.bedLocation);
          this.infantForm.controls['bedId'].updateValueAndValidity();
        } else {
          if(res.results.length == 0) {
            let msg = "Mother's bed has not been allocated"
            this.toastr.success('Success', `${msg}`);
            this.searchMotherBedId = 0;
            this.isInfantBed = false;
            if (this.data && this.data.bedId) {
              this.bedList = this.bedListPrev;
              this.motherBedId = this.data.bedId;
              this.infantForm.controls['bedId'].setValidators(Validators.required);
              if(this.bedList && this.bedList.length !== 0) {
                this.infantForm.controls['bedId'].setValue(this.data.bedId);
              } else {
                this.infantForm.controls['bedId'].setValue(this.data.bedName);
              }
              this.infantForm.controls['bedId'].updateValueAndValidity();
            } else {
              if(this.motherLocationId !== null && this.motherBedId === null) {
                this.motherBedId = this.motherLocationId;
              } else {
                this.motherBedId = null;
                this.motherLocationId = null;
                this.infantForm.controls['bedId'].setValidators([Validators.required,this.requireBedMatch.bind(this)]);
                this.infantForm.controls['bedId'].setValue(null);
                this.infantForm.controls['bedId'].updateValueAndValidity();
              }
            }
          } else {
            this.motherBedId = null;
            this.motherLocationId = null;
            this.infantForm.controls['bedId'].setValidators([Validators.required,this.requireBedMatch.bind(this)]);
            this.infantForm.controls['bedId'].setValue(null);
            this.infantForm.controls['bedId'].updateValueAndValidity();
          }
        }
      });
    } else {
      this.searchMotherBedId = 0;
      this.isInfantBed = false;
      if (this.data && this.data.bedId) {
        this.bedList = this.bedListPrev;
        this.motherBedId = this.data.bedId;
        this.infantForm.controls['bedId'].setValidators(Validators.required);
        if(this.bedList && this.bedList.length !== 0) {
          this.infantForm.controls['bedId'].setValue(this.data.bedId);
        } else {
          this.infantForm.controls['bedId'].setValue(this.data.bedName);
        }
        this.infantForm.controls['bedId'].updateValueAndValidity();
      } else {
        if(this.motherLocationId !== null && this.motherBedId === null) {
          this.motherBedId = this.motherLocationId;
        } else {
          this.motherBedId = null;
          this.infantForm.controls['bedId'].setValidators([Validators.required,this.requireBedMatch.bind(this)]);
          this.infantForm.controls['bedId'].setValue(null);
          this.infantForm.controls['bedId'].updateValueAndValidity();
        }
      }
    }
  }
  onChange(isChecked, event) {
    if (!this.data.id) {
      const control = this.infantForm.get('infantDetails') as FormArray;
      const values = isChecked ? { infantBedId: this.infantForm.controls['bedId'].value, locationId: this.motherLocationId } : {
          infantBedId: null, locationId: null };
      if (event < control.length) {
        control.at(event).patchValue(values);
        if(isChecked) {
          this.isMotherBed[event] = true;
          this['isInfantBedId' + event] = true;
        } else {
          this.isMotherBed[event] = false;
          this['isInfantBedId' + event] = false;
        }
      }
    } else if (this.data.id) {
      const control = this.infantForm.get('infantDetails') as FormArray;
      const motherBedId = this.motherBedId ?? this.infantForm.controls['bedId'].value;
      const locationId = this.motherLocationId ?? this.data.locationId;
      const isMotherBedFromBedList = !this.motherBedId;
      const bedInfo = isMotherBedFromBedList ? this.bedList.find(bed => bed.bedId === motherBedId) : null;
      if (isChecked) {
        const infantBedName = this.searchMotherBedId !== null ? (isMotherBedFromBedList && bedInfo ? bedInfo.bedName + bedInfo.locationName : this.data.bedLocationName) : null;
        for (let i = 0; i < control.length; i++) {
          if (event < control.length) {
            control.at(event).patchValue({
              infantBedId: infantBedName ?? motherBedId,
              infantBed: this.searchMotherBedId !== null ? motherBedId : isMotherBedFromBedList ? motherBedId : undefined,
              locationId: locationId
            });
            this.isMotherBedFlags[event] = true;
            this['isInfantBedId' + event] = true;
          }
        }
        this.infantBedName = infantBedName;
        this.motherBedValue = motherBedId;
      } else {
        if (event < control.length) {
          control.at(event).patchValue({
            infantBedId: null,
            infantBed: null,
            locationId: null
          });
          this['isInfantBedId' + event] = false;
          this.isMotherBedFlags[event] = false;
        }
      }
    } else {
      this.isMotherBed[event] = false;
    }
  }
  getMotherLocation(id, i?) {
    this.isMotherBed[i] = false;
    if (id !== null) {
      this.motherLocationId = id;
    } else {
      this.motherLocationId = null;
    }
    if(this.data?.hasOwnProperty('locationId')) {
      this.data.locationId = id;
    }
  }
  getInfantLocation(data, i) {
    let infantListArrays = this.infantForm.get('infantDetails') as FormArray;
    infantListArrays.controls[i].patchValue({ "locationId": data.locationId, "infantBed": data.bedId });
    const motherBedId = this.motherBedId ?? this.infantForm.controls['bedId'].value;
    if (data.bedId === motherBedId) {
      if (this.data?.id) {
        this.isMotherBedFlags[i] = true;
      } else {
        this.isMotherBed[i] = true;
      }
      this['isInfantBedId' + i] = true;
    }
  }
  getAllLocationDetail() {
    this.commonService.getAllLocation().subscribe(res => {
      this.blockDetail = res.results;
      this.blockDetail = this.blockDetail[0].children;
      if (this.data.floorId && this.blockId) {
        this.getFloorDetail(this.blockId, 'block');
      }
    });
  }

  getFloorDetail(locId, locType) {
    if (locType == 'block') {
      const filterData = this.blockDetail.filter(res => res.id == locId);
      this.floorDetail = filterData[0].children;
    } else if (locType == 'floor') {
      const filterData = this.floorDetail.filter(res => res.id == locId);
      this.locationDetail = filterData[0].children;
    }
  }

  discharge() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Discharge', message: 'Do you want to discharge ?',
        'patientId': this.data.id, 'patientVisitId': this.data.patientVisitId,
        'visitType': this.data.visitTypeId,
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, 'discharge': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.thisDialogRef.close('confirm');
    });
  }
  getBatteryPercentage(data) {
    if(data) {
      this.batteryPercentage = data.batteryPercentage;
    } else {
      this.batteryPercentage = null;
    }
  }
  public saveCoaster() {
    this.createCoaster = new CreateCoaster(null, null, null, null, null, null, null, null, null);
    this.createCoaster.tagSerialNumber = this.infantForm.controls['tagSerialNumber'].value;
    this.createCoaster.comments = null;
    this.createCoaster.tagAssociationId = this.data.id;
    this.createCoaster.tagAssociationType = this.data.tagAssociationType;
    this.createCoaster.tagAssociationTypeId = this.data.tagAssociationTypeId;
    this.createCoaster.tagTypeId = this.data.tagAssociationTypeId === 'TAT-IN' ? 'TT-IN' : 'TT-MO';
    this.createCoaster.patientVisitId = this.data.patientVisitId;
    this.createCoaster.patientVisitEventId = this.data.visitEventId;
    
    this.configurationService.replaceAssociateTag(this.createCoaster).subscribe(result => {
      this.tagExist = true;
      this.toastr.success('Success', `${result.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });

  }
  disAssociateCoaster() {
    const disAssociateDevice = { 'tagSerialNumber': this.infantForm.controls['tagSerialNumber'].value };

    this.configurationService.disassociateTag(disAssociateDevice).subscribe(res => {
      this.tagExist = false;
      this.batteryPercentage = null;
      this.infantForm.controls['tagSerialNumber'].setValue(null);
      if (res.statusCode !== 1) {
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  public saveInfant() {
    this.isDisabled = true;
    this.infantDetails = [];
    this.createInfant = new CreateInfant(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null);
    this.createInfant.firstName = this.infantForm.controls['firstName'].value;
    this.createInfant.middleName = this.infantForm.controls['middleName'].value;
    this.createInfant.lastName = this.infantForm.controls['lastName'].value;
    if (this.infantForm.controls['gender'].value === null) {
      this.createInfant.gender = null;
    } else {
      this.createInfant.gender = this.genderCode;
    }
    this.createInfant.mainidentifier = this.infantForm.controls['mainidentifier'].value;
    this.createInfant.birthDate = this._dateFormat.transform(this.infantForm.controls['birthDate'].value, 'yyyy-MM-dd');
    this.createInfant.countryCode = this.infantForm.controls['countryCode'].value;
    this.createInfant.mobileNo = this.infantForm.controls['mobileNo'].value;
    this.createInfant.tagSerialNumber = this.infantForm.controls['tagSerialNumber'].value;
    this.createInfant.tagTypeId = this.tagTypeId;
    this.createInfant.visitTypeId = "VT-IP";
    this.createInfant.enrollType = this.enrollType;
    if(this.motherLocationId !== null) {
      this.createInfant.locationId = this.motherLocationId;
    }
    if (this.motherBedId === null) {
      this.createInfant.bedId = this.infantForm.controls['bedId'].value;
    } else {
      this.createInfant.bedId = this.motherBedId;
    }
    this.createInfant.doctorId = this.infantForm.controls['doctorId'].value;
    this.createInfant.motherId = this.infantForm.controls['motherId'].value;
    this.createInfant.packageDate = this._dateFormat.transform(this.infantForm.controls['visitDate'].value, 'yyyy-MM-dd HH:mm:ss');

    const control = <FormArray>this.infantForm.controls['infantDetails'];
    for (let i = 0; i < control.length; i++) {
      const infantData = {
        'id': this.infantForm.controls['infantDetails'].value[i].id,
        'firstName': this.infantForm.controls['infantDetails'].value[i].name,
        'middleName': this.infantForm.controls['infantDetails'].value[i].middleName,
        'lastName': this.infantForm.controls['infantDetails'].value[i].lastName,
        'gender': this.infantForm.controls['infantDetails'].value[i].infantGender,
        'birthDate': this._dateFormat.transform(this.infantForm.controls['infantDetails'].value[i].infantBirthDate, 'yyyy-MM-dd'),
        'tagSerialNumber': this.infantForm.controls['infantDetails'].value[i].tagId,
        'tagTypeId': this.infantForm.controls['infantDetails'].value[i].tagTypeId,
        'packageDate' : this._dateFormat.transform(this.infantForm.controls['infantDetails'].value[i].infantVisitDate, 'yyyy-MM-dd HH:mm:ss'),
        'bedId' : this.infantForm.controls['infantDetails'].value[i].infantBedId,
        'locationId': this.infantForm.controls['infantDetails'].value[i].locationId,
        'enrollType': 'infant'
      }
      this.infantDetails.push(infantData);
    }

    if (this.enrollType === 'mother' && this.infantDetails.length > 0) {
      this.createInfant.infantDetails = this.infantDetails;
    } else {
      this.createInfant.infantDetails = [];
    }
  
    if (this.enrollType === 'infant') {
      this.createInfant.isChild = true;
    } else {
      this.createInfant.isChild = false;
    }

    this.configurationService.saveInfant(this.createInfant).subscribe(results => {
      this.isDisabled = false;
      this.toastr.success('Success', `${results.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  public updateInfant() {
    this.isDisabled = true;
    this.editInfant = new EditInfant(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editInfant.id = this.data.id;
    this.editInfant.firstName = this.infantForm.controls['firstName'].value;
    this.editInfant.middleName = this.infantForm.controls['middleName'].value;
    this.editInfant.lastName = this.infantForm.controls['lastName'].value;
    if (this.genderCode === undefined) {
      this.editInfant.gender = null;
    } else {
      this.editInfant.gender = this.genderCode;
    }
    this.editInfant.mainidentifier = this.infantForm.controls['mainidentifier'].value;
    this.editInfant.birthDate = this._dateFormat.transform(this.infantForm.controls['birthDate'].value, 'yyyy-MM-dd');
    this.editInfant.countryCode = this.infantForm.controls['countryCode'].value;
    this.editInfant.mobileNo = this.infantForm.controls['mobileNo'].value;
    this.editInfant.tagSerialNumber = this.infantForm.controls['tagSerialNumber'].value;
    this.editInfant.tagTypeId = this.tagTypeId;
    this.editInfant.visitTypeId = "VT-IP";
    this.editInfant.locationId = this.data.locationId;
    if (this.motherBedId === null) {
      this.editInfant.bedId = this.infantForm.controls['bedId'].value;
    } else {
      this.editInfant.bedId = this.motherBedId;
    }
    if (this.infantDoctorId !== null) {
      this.editInfant.doctorId = this.infantDoctorId;
    } else {
      this.editInfant.doctorId = this.infantForm.controls['doctorId'].value;
    }
    if (this.motherId !== null) {
      this.editInfant.motherId = this.motherId;
    } else {
      this.editInfant.motherId = this.infantForm.controls['motherId'].value;
    }
    this.editInfant.packageDate = this._dateFormat.transform(this.infantForm.controls['visitDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.editInfant.patientVisitId = this.data.patientVisitId;

    const control = <FormArray>this.infantForm.controls['infantDetails'];
    for (let i = 0; i < control.length; i++) {
      if (this.infantForm.controls['infantDetails'].value[i].infantBed !== null) {
        this.infantModifyBedId = this.infantForm.controls['infantDetails'].value[i].infantBed;
      } else {
        this.infantModifyBedId = this.infantForm.controls['infantDetails'].value[i].infantBedId;
      }
      if(this.infantForm.controls['infantDetails'].value[i].id === null) {
        this.infantId = null;
        this.patientVisitId = null;
      } else {
        this.infantId = this.infantForm.controls['infantDetails'].value[i].id;
        this.patientVisitId = this.infantForm.controls['infantDetails'].value[i].patientVisitId;
      }
      const infantData = {
        'id': this.infantId,
        'patientVisitId': this.patientVisitId,
        'firstName': this.infantForm.controls['infantDetails'].value[i].name,
        'middleName': this.infantForm.controls['infantDetails'].value[i].middleName,
        'lastName': this.infantForm.controls['infantDetails'].value[i].lastName,
        'gender': this.infantForm.controls['infantDetails'].value[i].infantGender,
        'birthDate': this._dateFormat.transform(this.infantForm.controls['infantDetails'].value[i].infantBirthDate, 'yyyy-MM-dd'),
        'tagSerialNumber': this.infantForm.controls['infantDetails'].value[i].tagId,
        'tagTypeId': this.infantForm.controls['infantDetails'].value[i].tagTypeId,
        'packageDate' : this._dateFormat.transform(this.infantForm.controls['infantDetails'].value[i].infantVisitDate, 'yyyy-MM-dd HH:mm:ss'),
        'bedId' : this.infantModifyBedId,
        'locationId': this.infantForm.controls['infantDetails'].value[i].locationId,
        'enrollType': 'infant'
      }
      this.infantDetails.push(infantData);
    }
    for (let a = 0; a < this.removedInfant.length; a++) {
      this.infantDetails.push(this.removedInfant[a]);
    }

    if (this.data.isChild === false && this.infantDetails.length > 0) {
      this.editInfant.infantDetails = this.infantDetails;
    } else {
      this.editInfant.infantDetails = [];
    }
   
    if (this.enrollType === 'infant') {
      this.editInfant.isChild = true;
    } else {
      this.editInfant.isChild = false;
    }

    this.configurationService.updateInfant(this.editInfant).subscribe(res => {
      this.isDisabled = false;
      if (res.statusCode !== 1) {
      }
      this.toastr.success('Success', `${res.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
    });
  }
  fixClick() {
    console.log('')
  }
}
function validateDate() {
  throw new Error('Function not implemented.');
}

