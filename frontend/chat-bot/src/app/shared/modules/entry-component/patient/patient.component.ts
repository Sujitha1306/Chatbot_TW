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
import { Component, OnInit, ViewChild, Inject, ViewEncapsulation,  Input, } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { FormGroup, FormBuilder, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { PatientModel, ClinicalModel, PatientVitalModelCols, PatientVitalModelRows } from './patient.model';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HospitalService } from '../../../services/hospital.service';
import { DashboardService } from '../../../services/dashboard.service';
import { ReportService } from '../../../services/report.service';
import { DatePipe } from '@angular/common';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { Chart } from 'chart.js';
import 'chartjs-plugin-datalabels';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfigurationService } from '../../../services/configuration.service';
import { CdkDetailRowDirective } from '../table/cdk-detail-row.directive';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CookieService } from 'ngx-cookie-service';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { locale_Json_Details } from '../../../../../localeJson/localeJson';
import { AcknowledgementComponent } from '../acknowledgement/acknowledgement.component';
import { WorkflowManagementComponent } from '../workflow-management/workflow-management.component';
import { environment } from '../../../../../environments/environment';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientComponent {
  cssPrefix = 'toolbar-notification';
  packageList: Array<any> = [];
  patientModel: PatientModel;
  patientRegForm: FormGroup;
  isOpen = false;
  public tagType = 'Patient';

  constructor(private readonly commonService: CommonService, private readonly snackBar: MatSnackBar,
    public toastr: AppToastService,
    private readonly form: FormBuilder) {
    this.commonService.getAllRegisterPlan().subscribe(res => {
      this.packageList = res.results;
    }, error => {
      console.log(error);
    });
    this.buildForm();
  }
  myControl = new FormControl();
  value_vs_code = { Mobile: 'TT-MB', Patient: 'TT-PA' };
 
  public buildForm() {
    this.patientRegForm = this.form.group({
      patientUHID: ['', [Validators.required]],
      patientName: ['', [Validators.required, Validators.minLength(3)]],
      tagID: ['', [Validators.required]],
      Tagtype: ['', [Validators.required]],
      packageID: ['', [Validators.required]]
    });
  }

  delete() {
    this.isOpen = false;
    this.patientRegForm.reset();
  }
  openSnackBar(message: string, action: string) {
    this.toastr.success('Success', `${message}`);
  }
  Type_select() {
    if (this.patientRegForm.controls['Tagtype'].value === 'Patient') {

      this.patientRegForm.controls['tagID'].enable();
      return true;
    } else {
      this.patientRegForm.controls['tagID'].disable();
      return false;
    }
  }
  quickRegistration() {
    this.patientModel = new PatientModel(null, null, null, null, null, null);
    this.patientModel.uhid = this.patientRegForm.controls['patientUHID'].value;
    this.patientModel.patientName = this.patientRegForm.controls['patientName'].value;
    this.patientModel.tagId = this.patientRegForm.controls['tagID'].value;
    this.patientModel.packagePlanId = parseInt(this.patientRegForm.controls['packageID'].value);
    this.patientModel.tagId = this.patientRegForm.controls['tagID'].value;
    this.patientModel.isDetachable = true;
    console.log(this.patientRegForm.controls['Tagtype']);
    this.patientModel.tagTypeId = this.value_vs_code[this.patientRegForm.controls['Tagtype'].value];
    this.commonService.quickPatientRegistration(this.patientModel).subscribe(
      (result) => {
        console.log('success');
        this.isOpen = false;
        this.patientRegForm.reset();
        this.openSnackBar('Registeration Successful', 'Close');
      },
      (error) => {
        console.log(JSON.parse(error._body).message);
        this.openSnackBar('Error! ' + this.patientModel.uhid + ' ' + JSON.parse(error._body).message, 'Close');
      }
    );
  }
}



@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientListComponent  {
  displayedColumns: string[] = ['UHID', 'Name', 'Package Name', 'Date'];
  displayedData = [
    { 'colName': 'UHID', 'title': 'UHID', 'dataName': 'uhid' },
    { 'colName': 'Name', 'title': 'Name', 'dataName': 'patientName' },
    { 'colName': 'Package Name', 'title': 'Package Name', 'dataName': 'packageName' },
    { 'colName': 'Date', 'title': 'Date', 'dataName': 'date' }];
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(private readonly hospitalService: HospitalService, public dialog: MatDialog, private readonly commonService: CommonService,
    public thisDialogRef: MatDialogRef<PatientListComponent>) {
    this.getPatientList();
  }

  getPatientList() {
    this.commonService.getHealthCheckupList('Today').subscribe(res => {
      this.dataSource = new MatTableDataSource<any>(res.results);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }
  popupClose() {
    this.thisDialogRef.close();

  }
  patientInfo(data) {
    this.dialog.open(PatientInfoComponent,
      { data: data.patientId, panelClass: ['medium-popup'], disableClose: true });
  }
    fixClick() {
    console.log('')
  }
}

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
  selector: 'app-patient-info',
  templateUrl: './patient-info.component.html',
  styleUrls: ['./patient.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  animations: [
    trigger('detailExpand', [
      state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('*', style({ height: '*', visibility: 'visible' })),
      transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PatientInfoComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumn: string[] = ['Location', 'From Time','To Time', 'Duration'];
  tableData: any;
  formDate: any;
  type: any;
  sortColumn = [];
  iconColumn = [];
  iconHeader = [];
  eventColumn = [];
  permissionControl = ['TAT-PA'];
  public title: string;
  public patientList: Array<any> = [];
  public patientInfo: any;
  public pendingInfo: Array<any> = [];
  public completeInfo: Array<any> = [];
  public panelOpenState: boolean;
  public selectPatient: string;
  public dataSource: MatTableDataSource<PatientList>;
  public AHdataSource: MatTableDataSource<any>;
  public VHdataSource: MatTableDataSource<any>;
  public AUdataSource: MatTableDataSource<any>;
  public RoutinedataSource: MatTableDataSource<any>;
  public HCDisplayedColumns: any;
  public VHDisplayedColumns: any;
  public AUDisplayedColumns: any;
  public RoutineDisplayedColumns = ['Activity Name', 'Performer Name', 'Schedule Time', 'Start Time', 'End Time', 'Status'];
  public inputType = true;
  public testGroupInfo: any;
  public isDisableDiabetic = false;
  public isDisableUseMobile = false;
  public isDisableMobile = false;
  public isEnableDropdown = false;
  public isCheckEnableDropdown = false;
  public isEnableButton = true;
  public dropdownTestId: any;
  public dropdownLocationId: any;
  public dropdownStatusId: any;
  public currentTestDetails: any;
  public vipTypeId: any;
  public preferedLanguage: any;
  public patientId: any;
  public patientVisitId: any;
  public pendingTestInfo: any;
  public lastModifiedOn: any;
  public testAvailableLocation: any;
  public currentDate: any = new Date();
  public assetDateFilter = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public fromDate: any;
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public checkTodayDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public isEnableStatusDropdown = false;
  public isEditStatusTestId: any;
  public isEditStatusTesttype: any;
  public queueStatus: any;
  public statusId: any;
  public pendingLocId: any;
  public selectedTesttype: any;
  public activate_btn: any = [];
  clinicalModel: ClinicalModel;
  healthPlanId: any;
  isDiabetic: any = false;
  isFasting: any = false;
  isVulnerable: any = false;
  isPregnant: any = false;
  PCTestStatus = false;
  isVip: any = false;
  isPreferredLanguage: any = false;
  public hidePendingTestDD: any;

  public vipList: Array<any> = [];
  public languageList: Array<any> = [];
  patientInfoForm: FormGroup;

  public disableCoster = false;
  public isEnableCosterDropdown = true;
  public searchCosterlist: any=[];
  public tagId;
  public tag_type_name;
  public token_no;
  public tokenType = 'generate';
  public allowTokenEnroll = false;
  public tokenDetail: any = null;
  public tokenMsg = null;
  public selectedTabIndex = 0;
  public isTempPatient: boolean;
  public checkProcessTest: Array<any> = [];
  public isChkPendingProcessTest: Array<any> = [];
  public selectedTab = 0;
  public patientListView = false;
  public visitTypeId = null;
  public visitStatus: string;
  public visitEventTypeId = null;
  public visitEventId = null;
  public selectedPatinetVisitId: any;
  public selectedPatientId: any;
  public isEnableCoasterMobile = false;
  public vitalData = false;
  public gridCols: any;
  public gridCols1: any;
  public WidgetList: Array<any> = [];
  public exportData: any = [];
  vitalsChartData: any = []; vitalParam: any = 'all';
  public vitalValue = null;
  public vitalTime = 15
  @ViewChild('lineChart') private readonly chartRef;
  public assignFloorDetails: Array<any> = [];
  public assignFloorId = null;
  public isVisitDateCheck: any;
  private openedRow: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;

  public patientVitalModelCols: PatientVitalModelCols;
  public patientVitalModelRows: PatientVitalModelRows;
  shownTitle: string;
  formFlag: boolean;
  asignedLocationName = null;
  public spinLoader: any;
  public noData = false;
  public isNoDataVH = false;
  public noAssetUtilData = false;
  public maxHeight: number;
  public isEnableMsg = true;
  public noRoutineData = false;
  IPHeight: number;
  height: number;
  width: number;
  public pageEvent: PageEvent;
  public length: any;
  public pageIndex: any;
  public pageStart = 0;
  public pageSize = 50;
  public workflowTypeId = null;
  public tagTypeId = null;
  public listItems: any;
  public datSourceMovementHistory: MatTableDataSource<any>;
  public dateForm: FormGroup;
  public reviewDateForm: FormGroup;
  public fromDate1 = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public toDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  columnsToDisplay: string[] = ['blockName','fromDateTime','toDateTime','duration'];
  movementList: any=[];
  patientReportList = [];
  PRHDisplayedColumn = ['Report Status', 'Reported By', 'Reported Date'];
  lengthPRH: any;
  pageSizePRH = 50;
  @ViewChild('paginatorMove') paginatorMove: MatPaginator;
  @ViewChild('AHPaginator') AHPaginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  vitalUhid = null;
  AHLength = 0;
  popWidth: any;
  contentHeightMomentHis: number;
  popHeight: any;
  contentHeightIp: number;
  contentHeight: number;
  public doctorList: Array<any> = [];
  public doctorEnabled = false;
  public consultantName = null;
  public consultantId = null;
  public enableReviewDate = false;
  public tableTreeExpand = false;
  visitEventStatusId = null
  assignFloorData: any;
  isEditReviewDateTestId = null;
  reviewDate = null;
  requireTagMatchVal: any;
  labeltext: string;
  contentHeightVisitHis: number;
  public ipView = null;
  public enableAssignToken = false;
  public columns = {
    'pending' : [],
    'completed' : []
  };
  public columnData = {
    'pending' : [],
    'completed' : []
  };
  public bannerlabel: any;
  public TokenList: any = [];
  toHit = false;
  tokenId: any = null;
  disablePatientCheckout = false;
  public customerLogo = null;
  public customerId = localStorage.getItem('customerId');
  public enableDialogClose = true;
  public enableSidebar = true;
  mandatoryFields: any=[];
  loading = false;
  
  constructor(public thisDialogRef: MatDialogRef<PatientInfoComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly _dateFormat: DatePipe, public toastr: AppToastService, public reportService: ReportService, public datepipe: DatePipe,
    private readonly dialog: MatDialog, private readonly dashboardService: DashboardService,private readonly configurationServices: ConfigurationService,
    private readonly fb: FormBuilder, private readonly commonService: CommonService, private readonly cookieService: CookieService, private readonly lookupService: LookupTermService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    if (data.name) {
      this.title = data.name + ' Queue List';
    } else {
      this.title = 'Queue List';
    }
    this.title = 'Patient Visit Summary';
    if(data.hasOwnProperty('ipView') && data.ipView == 'location') {
      this.title = 'Visit Summary';
    }
    this.panelOpenState = true;
    if (!('type' in data)) {
      console.log('if visit');
      this.inputType = false;
      this.isTempPatient = false;
      this.patientListView = true;
      this.selectedPatientId = data.patientId;
      this.getPatientList(data.id, data.status, data.testId, data.testType, data.visitStatusId, data.planTypeId);
    } else {
      console.log('else visit');
      if (data.hasOwnProperty('status') && data.status != null) {
        this.visitStatus = data.status;
      } else {
        this.visitStatus = null;
      }
      if (!data.hasOwnProperty('visitTypeId') || (data.hasOwnProperty('visitTypeId') && data.visitTypeId === null)) {
        this.visitTypeId = 'VT-HC';
      } else {
        this.visitTypeId = data.visitTypeId;
        if(data.hasOwnProperty('visitEventStatusId')) {
          this.visitEventStatusId = data.visitEventStatusId;
          console.log(this.visitEventStatusId)
        }
      }
      if (data.hasOwnProperty('visitEventTypeId') && data.visitEventTypeId != null) {
        this.visitEventTypeId = data.visitEventTypeId;
      } else {
        this.visitEventTypeId = null;
      }
      if (data.hasOwnProperty('visitEventId') && data.visitEventId != null) {
        this.visitEventId = data.visitEventId;
      } else {
        this.visitEventId = null;
      }
      setTimeout(() => this.vitalsService(), 1000);
      if (data.hasOwnProperty('visitTypeId') && data.visitTypeId === 'VT-OP' || data.visitTypeId === 'VT-IP' || data.visitTypeId === 'VT-EC') {
        if (data.hasOwnProperty('patientVisitId')) {
          this.selectedPatinetVisitId = data.patientVisitId;
        }
        if (data.hasOwnProperty('visit_id') && data.visit_id !== null) {
          this.selectedPatinetVisitId = data.visit_id;
        }
        if (data.hasOwnProperty('patinetVisitId')) {
          this.selectedPatinetVisitId = data.patinetVisitId;
        }
        if (data.hasOwnProperty('visit_id') && ((data.visitTypeId === 'VT-IP' && data.visitEventTypeId === 'VE-OT') || data.visitTypeId === 'VT-EC')) {
          this.selectedPatinetVisitId = data.visit_id;
          this.isTempPatient = false;
        }
        this.selectedPatientId = data.patientId;

        if (data.visitTypeId === 'VT-OP' && !data.hasOwnProperty('tokenNo')) {
          this.isTempPatient = false;
        }

        if (data.hasOwnProperty('from') && data.from === 'OP-list' && data.visitTypeId === 'VT-OP') {
          if ((data.hasOwnProperty('tokenNo') && data.tokenNo !== '' && data.tokenNo !== null)) {
            this.isTempPatient = false;
          } else {
            this.isTempPatient = true;
          }

          if ((data.hasOwnProperty('tokenNo') && data.tokenNo !== '' && data.tokenNo !== null)) {
            this.selectedTabIndex = 0;
            this.selectedTab = 0;
          } else {
            this.selectedTabIndex = 1;
            this.selectedTab = 1;
          }

          if (this.selectedPatinetVisitId == null) {
            this.selectedPatinetVisitId = '';
          }
        }

        this.getPatientDetails(this.selectedPatientId, this.selectedPatinetVisitId, this.visitTypeId, this.visitEventId);
      } else {
        if (data.hasOwnProperty('patinetVisitId')) {
          this.selectedPatinetVisitId = data.patinetVisitId;
        }

        this.selectedPatientId = data.patientId;

        if (data.hasOwnProperty('visit_id')) {
          this.selectedPatinetVisitId = data.visit_id;
        }
        data.patinetVisitId = this.selectedPatinetVisitId;
        if ((data.token_no !== '' && data.token_no !== null) || (data.patinetVisitId !== null && data.patinetVisitId !== '')) {
          this.isTempPatient = false;
        } else {
          this.isTempPatient = true;
        }

        if (data.token_no !== '' && data.token_no !== null) {
          this.selectedTabIndex = 0;
          this.selectedTab = 0;
        } else {
          this.selectedTabIndex = 1;
          this.selectedTab = 1;
        }

        if (this.selectedPatinetVisitId == null) {
          this.selectedPatinetVisitId = '';
        }
        if (!data.hasOwnProperty('token_no')) {
          this.isTempPatient = false;
        }

        this.getPatientDetails(this.selectedPatientId, this.selectedPatinetVisitId, this.visitTypeId, this.visitEventId);
      }
    }
    const locale = localStorage.getItem(btoa('lang'))
    if(this.visitEventTypeId === 'VE-OT' || this.visitTypeId === 'VT-EC'){
      if(locale === 'en-US' || locale === 'en'){
        this.labeltext = locale_Json_Details.en.workflowLabel
      } else if(locale === 'ar'){
        this.labeltext = locale_Json_Details.ar.workflowLabel
      } else if(locale === 'th'){
        this.labeltext = locale_Json_Details.th.workflowLabel
      }
    } else {
      if(locale === 'en-US' || locale === 'en'){
        this.labeltext = locale_Json_Details.en.checkupLabel
      } else if(locale === 'ar'){
        this.labeltext = locale_Json_Details.ar.checkupLabel
      } else if(locale === 'th'){
        this.labeltext = locale_Json_Details.th.checkupLabel
      }
    }
    //To get customerLogo
    this.customerLogo =  environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId ;
  }

  ngOnInit() {
    this.IPHeight = window.innerHeight - 320;
    this.height = window.innerHeight - 395;
      this.shownTitle = this.title;
      this.formFlag = true;

    // assign floor details
    this.commonService.getConfigFile('assign-floor').subscribe(res => {
      if (res.results != null) {
        this.assignFloorDetails = res.results.contentObject['assign-floor'].filter(filter => filter.isOnlyRegistration === 'false' && filter.isFollowup === 'false');
        if (this.assignFloorDetails.length > 0) {
          this.assignFloorId = this.assignFloorDetails[0].floorId;
        }
      }
    });

    this.gethcDetails(this.selectedDate);
    this.buildForm();
    this.allowTokenEnroll = (localStorage.getItem(btoa('tokenEnrollFlow')) == 'true');
    // get queue status list
    this.lookupService.getAppTermsWrapper('QueueStatus').subscribe(res => {
      this.queueStatus = res.QueueStatus.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-WT' || filter.code === 'QS-NR' || filter.code === 'QS-FL' ||filter.code === 'QS-SK' || filter.code === 'QS-CO');
    });

    // get language list
    this.lookupService.getAppTermsWrapper('Language').subscribe(res => {
      this.languageList = res.Language ?? [];
    });

    // get vip type
    this.lookupService.getAppTermsWrapper('VipType').subscribe(res => {
      this.vipList = res.VipType ?? [];
    });
    this.maxHeight = window.innerHeight - 220;

    // vitals chart hidden it in apr 12, 2021 >> this.vitalsService(null);
    if (this.data.patientId && this.visitTypeId === 'VT-IP') {
    this.getRoutineEventDetails(this.data.patientId, 'Patient', this.fromDate);
    }
    if (this.visitTypeId === 'VT-HC') {
      this.workflowTypeId = 'WF-HC';
    } else if (this.visitTypeId === 'VT-IP') {
      this.workflowTypeId = 'WF-IP';
    } else if((this.visitTypeId === 'VT-IP' && this.visitEventTypeId === 'VE-OT') || this.visitTypeId === 'VT-EC'){
      this.workflowTypeId = 'WF-OT';
    } else if (this.visitTypeId === 'VT-OP') {
      this.workflowTypeId = 'WF-OP';
    }
    this.getCardType()
  }

  getPatientConfig() {
    this.configurationServices.getConfigFile('patient-config').subscribe(res => {
      if (res.statusCode === 1) {
        if(res?.results?.contentObject.hasOwnProperty('planTab') && res?.results?.contentObject?.planTab.hasOwnProperty('mandatoryField')) {
          if(res?.results?.contentObject?.planTab?.mandatoryField?.length > 0) {
            this.mandatoryFields = res?.results?.contentObject?.planTab?.mandatoryField;
            for(let i in this.mandatoryFields) {
              this.patientInfoForm.get(this.mandatoryFields[i]).setValidators(Validators.required);
              this.patientInfoForm.get(this.mandatoryFields[i]).updateValueAndValidity();
            }
          }
        }
      }
    });
  }

  getBannerDataInfo(data) {
    this.bannerlabel = {
      'banners': {
        "bannerInfo" : data,
        "bannerFirstRow": {
          "name": data.patientName,
          "tokenNo": data.tokenNo,
          "vipTypeId": data.vipTypeId,
          "birthDate": data.dob,
          "gender": data.gender,
        },
        "bannerFirstRowLable": [{ code: 'name', value: 'Name' }, { code: 'tokenNo', value: 'Token No' }],
        'bannerFirstLocRow': this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-IP' || this.visitTypeId === 'VT-EC' || this.visitTypeId === 'VT-OP' ? data.currentLocationName : null,
        'bannerFirstLocRowLable': '',
        "bannerSeconRowLable": [{ code: 'uhid', value: 'UHID' }, { code: 'visitDetails', value: 'Visit Details' }, { code: 'doctor', value: 'Doctor' }, { code: 'tagID', value: 'Tag ID' }, { code: 'visittagID', value: 'visitTag ID' },
                                {code: 'location', value: 'Location'}, {code: 'disassociate' , value: 'Disassociate'}, {code: 'discharge' , value: 'discharge'}, {code: 'healthPlanName', value: 'HealthPlan Name'}, {code: 'consultantName', value: 'Consultant Name'},
                                {code: 'refresh', value: 'Refresh'}, {code: 'resend', value: 'Resend'},{code: 'diabetic', value: 'Diabetic'}, {code: 'fasting', value: 'Fasting'}, {code: 'vulnerable', value: 'Vulnerable'}, 
                                {code: 'pregnant', value: 'Pregnant'}, {code: 'alertStatus', value: 'AlertStatus'} ],
        "bannerSecondRow": {
          "uhid": data.uhid,
          "visitTypeId": data.visitTypeId === 'VT-OP' ? 'OP' : data.visitTypeId === 'VT-IP' ? 'IP' : data.visitTypeId === 'VT-DC' ? 'Day Care' : data.visitTypeId === 'VT-EC' ? 'EC' : 'HC',
          "visitIdentifier": data.visitIdentifier,
          "visitDate": this.datepipe.transform(data.visitDate, 'dd/MM/yyyy hh:mm a'),
          "consultantName": data.consultantName,
          "tagId": this.visitTypeId === 'VT-IP' && this.visitEventTypeId !== 'VE-OT' && this.visitTypeId !== 'VT-EC' ? data.tagId : null,
          "patientVisitTagId": this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-OP' || this.visitEventTypeId === 'VE-OT' || this.visitTypeId === 'VT-EC' ? data.patientVisitTagId : null,
          "coasterImg": (this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-OP' || this.visitEventTypeId === 'VE-OT' || this.visitTypeId === 'VT-IP' || this.visitTypeId === 'VT-EC') && (data.tagTypeId === 'TT-CO' || data.tagTypeId === 'TT-PA') ? true : false,
          "mobileImg": this.visitTypeId === 'VT-HC' && data.tagTypeId === 'TT-MB' ? true : false,
          "languageName": this.visitTypeId === 'VT-HC' && data.tagTypeId != null && data.languageName != null ? data.languageName : null,
          "locationName": this.visitTypeId === 'VT-IP' ? data.locationName : null,
          "disassociate": (this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-OP') && ( data.tagId !== null ) ? true : false,
          "discharge": this.visitEventTypeId === 'VE-OT' || (this.visitTypeId === 'VT-EC' && this.data && !['VS-DC'].includes(this.data.visitStatusId)) ? true : false,
          "healthPlanName": this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-IP' || this.visitTypeId === 'VT-EC' ? data.healthPlanName : null,
          "doctorName": this.visitTypeId === 'VT-OP' ? data.consultantName : null,
          "refresh": this.visitTypeId === 'VT-IP' && this.visitEventTypeId !== 'VE-OT' && this.visitTypeId !== 'VT-EC' ? true : false,
          "resendMessage": this.visitTypeId === 'VT-HC' || this.visitTypeId === 'VT-OP' && data.patientVisitId ? true : false,
          "isDiabetic": data.isDiabetic ? 'Yes' : null,
          "isFasting": data.isFasting ? 'Yes' : null,
          "isVulnerable": data.isVulnerable ? 'Yes' : null,
          "isPregnant": data.isPregnant ? 'Yes' : null,
          "iotAlertStatus": data.iotAlertStatus,
          "alerts": (this.visitTypeId === 'VT-IP' || this.visitTypeId === 'VT-EC') && data?.hasOwnProperty('alerts') && data.alerts?.length ? data.alerts : null
        }
      }
    }
  }
  getCardType() {
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if(res.statusCode == 1) {
        this.ipView = res.results['contentObject'];
        if(this.ipView.hasOwnProperty('enableAssignToken')) {
          this.enableAssignToken = this.ipView.enableAssignToken;
          this.disablePatientCheckout = this.ipView.disablePatientCheckout;
          this.tokenType = 'assign';
        }
      }
    });
  }


  onWindowResizedWidth(size) {
    this.popWidth = size + 10;
  }
  getAck(data) {
    data['patientId'] = this.data.patientId;
    if(data.hasOwnProperty('ackDatetime') && data.ackDatetime) {
      data['iotAlertId'] = data['id'];
      data['type'] = 'RQT-NC';
      data['description'] = data['message']
      data['destinationName'] = this.data['bedNo'] +', ' +this.data['locationName'];
      data['permissionTab'] = ['Task']
      const dialogRef = this.dialog.open(WorkflowManagementComponent, {
        data: data, panelClass: ['large-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.getPatientAlert(this.data.patientId);
      });
    } else {
      const dialogRef = this.dialog.open(AcknowledgementComponent, {
        width: '600px', height: '300px', panelClass: 'pop-up-margin',
        data: data
      });
      dialogRef.afterClosed().subscribe(result => {
        this.getPatientAlert(this.data.patientId);
      });
    }
  }
  onWindowResized(size) {
    this.popHeight = size - 50;
    this.contentHeightMomentHis = size - 250;
    this.contentHeightVisitHis = size -300;
    if(size >= 1218) {
      this.contentHeightIp = size - 420;
      this.contentHeight = size - 425;
    } 
    if(size >= 680 && size < 1218) {
      this.contentHeightIp = size - 355;
      this.contentHeight = size - 365;
    } else if (size < 680) {
      this.contentHeightIp = size - 350;
      this.contentHeight = size - 345;
    }
  }

  searchToken(event) {
    this.tokenId = null;
    this.toHit = event.toHit;
    if (event.text.length >= 2) {
      if (event.toHit == true && this.enableAssignToken) {
        this.commonService.searchToken(event.text, null).subscribe(res => {
          this.TokenList = res.results;
          if (this.TokenList.length == 1) {
            this.tokenId = this.TokenList[0]['id']
            this.patientInfoForm.get('token').setValue(this.TokenList[0].tokenNumber);
            this.patientInfoForm.get('assignFloorId').setValue(this.TokenList[0].floorId);
          }
        });
      }

    }
  }   
  isExpand(){
    this.tableTreeExpand = !this.tableTreeExpand;
  }
  eventAction(event){
    if (event.key === "pagination"){
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    }
    this.getMovementHistoryData(this.fromDate1,this.toDate,this.data.patientId,this.data.tagAssociationTypeId,this.pageStart, this.pageSize);    
  }
  getGoHistoryData(){
    this.getMovementHistoryData(this.fromDate1,this.toDate,this.data.patientId,this.data.tagAssociationTypeId,this.pageStart, this.pageSize);
  }

  getMovementHistoryData(formDate?: any, toDate?: any, id?: any, type?: any, pageStart?, pageSize?){
    if(this.data.visitTypeId === 'VT-EC'){
      this.data.tagAssociationTypeId = this.data.tag_associated_type;
    }
    const fromDate = this.dateForm.controls['fromDate'].value;
    this.fromDate1 = this._dateFormat.transform(new Date(fromDate), 'yyyy-MM-dd');
    toDate = this.dateForm.controls['toDate'].value
    this.toDate = this._dateFormat.transform(new Date(toDate), 'yyyy-MM-dd');
    this.configurationServices.getAllMovementHistory(this.fromDate1,this.toDate,this.data.patientId,this.data.tagAssociationTypeId,this.pageStart, this.pageSize).subscribe(res =>{
      if(res.statusCode == 1 && res.results.statusCode != 404) {
      this.movementList = res.results.data['Location History'];
      this.length = this.movementList?.length;
      this.datSourceMovementHistory = new MatTableDataSource<any>(this.movementList);
      const columns = ['Location Name','From Date','To Date', 'Duration']
      for (let i = 0; i <= columns.length; i++) {
        this.movementList.map(data => {
          data[this.displayedColumn[i]] = data[columns[i]];
          if(columns[i] == 'Location Name') {
            data[this.displayedColumn[i]] = data[columns[i]] + ', '+data['Floor Name'];
          }
        });
      }
    }
    })
  }

  vitalsService() {  
    let param = "&vltyp="+this.vitalParam+"&dur="+this.vitalTime;
    this.vitalsChartData['lineShow'] = false;
    if(this.data.uhid !== undefined) {
      this.vitalUhid = this.data.uhid;
    } else {
      this.vitalUhid = this.data.mainidentifier;
    }
    this.reportService.getVitalsChart(this.selectedDate, this.selectedDate, this.vitalUhid, param).subscribe((res) => {
      if (res.results.statusCode === 200 && res.results.data != null && res.results.data.hasOwnProperty('chart')) {
        this.vitalData = true;
        this.exportData = res.results.data;
        this.vitalsChartData['chartData'] = this.exportData.chart;
        let count = this.exportData["chart"]["evt_time"].length;
        if(count == 0) {
          this.vitalData = false;
          return
        }
        this.vitalsChartData['SPO2Ref'] = [];
        this.vitalsChartData['pulseRef'] = [];
        this.vitalsChartData['tempRef'] = [];
        this.vitalsChartData['HRRef'] = [];
        this.vitalsChartData['HRVRef'] = [];
        this.vitalsChartData['respRef'] = [];
        this.vitalsChartData['presSysRef'] = [];
        this.vitalsChartData['presDiaRef'] = [];
        this.vitalsChartData['sleepRef'] = [];
        this.vitalsChartData['stepsRef'] = [];

        for (let i = 0; i < this.vitalsChartData['chartData']['event_dt'].length; i++) {
          this.vitalsChartData['SPO2Ref'].push(this.exportData['ref_range'][0]);
          this.vitalsChartData['pulseRef'].push(this.exportData['ref_range'][1]);
          this.vitalsChartData['tempRef'].push(this.exportData['ref_range'][2]);
          this.vitalsChartData['HRRef'].push(this.exportData['ref_range'][3]);
          this.vitalsChartData['HRVRef'].push(this.exportData['ref_range'][4]);
          this.vitalsChartData['respRef'].push(this.exportData['ref_range'][5]);
          this.vitalsChartData['presSysRef'].push(this.exportData['ref_range'][6]);
          this.vitalsChartData['presDiaRef'].push(this.exportData['ref_range'][7]);
          this.vitalsChartData['sleepRef'].push(this.exportData['ref_range'][8]);
          this.vitalsChartData['stepsRef'].push(this.exportData['ref_range'][9]);
        }
        this.vitalsChartData['statsShow'] = true;
        this.vitalValue =  [
          {'type' : 'text', 'col': 3, 'bg-color' : 'white', 'color' : '#706e6a', 'id' : 'last_seen', 'title' : 'Last updated', 'data' : count != 0 ? this.exportData["chart"]["evt_time"][count -1] : '-'},
          {'type' : 'text', 'col': 3, 'bg-color' : '#ecf7ff', 'color' : '#706e6a', 'id' : 'count', 'title' : 'Temperature', 'data' : this.exportData.card.data[0] != null ? (this.exportData.card.data[0]*(9/5))+32 + ' °F': '-'},
          {'type' : 'text', 'col': 3, 'bg-color' : '#ecf7ff', 'color' : '#706e6a', 'id' : 'calibration', 'title' : 'SPO2', 'data' : this.exportData.card.data[1] != null ? this.exportData.card.data[1] : '-'},
          {'type' : 'text', 'col': 3, 'bg-color' : '#ecf7ff', 'color' : '#706e6a', 'id' : 'pending_amc', 'title' : 'HeartRate', 'data' : this.exportData.card.data[2] != null ? this.exportData.card.data[2] : '-'},
          {'type' : 'text', 'col': 3, 'bg-color' : '#ecf7ff', 'color' : '#706e6a', 'id' : 'resp_rate', 'title' : 'Resp Rate', 'data' : this.exportData.card.data[3] != null ? this.exportData.card.data[3] : '-'}          
        ];
        setTimeout(() => this.vitalsChart(this.vitalsChartData['chartData']), 600); 
      }
    });
  }
  getRoutineEventDetails(id, type, dateFilter, event?: any) {
    this.pageStart = (event != null) ? event.pageIndex : this.pageStart;
    this.pageSize = (event != null) ? event.pageSize : 50;
    this.noRoutineData = false;
    let filterDate = '';
    if (dateFilter !== null || dateFilter !== '') {
      filterDate = this._dateFormat.transform(dateFilter, 'yyyy-MM-dd');
      this.fromDate = filterDate;
    }
    this.commonService.getRoutineEventDetails(id, type, filterDate, this.pageStart, this.pageSize).subscribe((res) => {
      if (res.statusCode === 1) {
        this.noRoutineData = false;
        this.RoutinedataSource = new MatTableDataSource<any>(res.results);
        this.RoutinedataSource.paginator = this.paginator;
        this.length = res.totalRecords;
      } else if (res.statusCode === 0) {
        this.RoutinedataSource = new MatTableDataSource<any>([]);
        this.RoutinedataSource.paginator = this.paginator;
        this.noRoutineData = true;
      }
    });
  }
  onResize(event) {
    this.gridCols = (event.target.innerWidth <= 767) ? 1 : 4;
    this.gridCols1 = (event.target.innerWidth <= 767) ? 1 : 2;
    if (event.target.innerWidth <= 767) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        if (this.patientVitalModelCols[this.WidgetList[i].id] > 1) {
          this.patientVitalModelCols[this.WidgetList[i].id] = 1;
        }
        if (this.patientVitalModelRows[this.WidgetList[i].id] === 5) {
          this.patientVitalModelRows[this.WidgetList[i].id] = 10;
        }
      }
    }
    if (event.target.innerWidth >= 768) {
      for (let i = 0; this.WidgetList.length > i; i++) {
        this.patientVitalModelCols[this.WidgetList[i].id] = this.WidgetList[i].cols;
        this.patientVitalModelRows[this.WidgetList[i].id] = this.WidgetList[i].rows;
      }
    }
    console.log(window.innerHeight)
    this.maxHeight = window.innerHeight - 220;
  }
  private requireTagMatch(control: FormControl): ValidationErrors | null {
    if(this.tagId === null) {
      if(control.value !== null && control.value !== '') {
      this.requireTagMatchVal = this.searchCosterlist.filter(resFilter => resFilter.tagId === control.value);
      if (this.requireTagMatchVal.length === 0 || this.searchCosterlist.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  buildForm() {
    this.patientInfoForm = this.fb.group({
      testId: [this.dropdownTestId ? this.dropdownTestId : null],
      locationId: [this.dropdownLocationId ? this.dropdownLocationId : null],
      statusId: [this.statusId ? this.statusId : null],
      patientId: [this.patientId ? this.patientId : null],
      healthPlanId: [this.healthPlanId ? this.healthPlanId : null],
      patientVisitId: [this.patientVisitId ? this.patientVisitId : null],
      vipTypeId: [this.vipTypeId ? this.vipTypeId : null],
      preferedLanguage: [this.preferedLanguage ? this.preferedLanguage : 'EN'],
      pendingLocId: [this.pendingLocId ? this.pendingLocId : null],
      coster: [this.tag_type_name ? this.tag_type_name : 'coaster'],
      tagSerialNumber: [this.tagId ? this.tagId : null,[this.requireTagMatch.bind(this)]],
      token: [this.token_no ? this.token_no : null],
      tokenType: [this.tokenType ? this.tokenType : null],
      curStatusId: [this.dropdownStatusId ? this.dropdownStatusId : null],
      assignFloorId: [this.assignFloorId ? this.assignFloorId : null],
      fromDate: [this.fromDate ? this.fromDate : null],
      consultantId: [this.consultantName ? this.consultantName : null],
      PCTestCheck: [this.visitTypeId === 'VT-HC' ? true : false],
      isDiabetic: [this.isDiabetic === true ? true : this.isDiabetic === false ? false : null]
    });
    this.dateForm = this.fb.group({
      fromDate: [this.fromDate1 ? this.fromDate1 : ''],
      toDate: [this.toDate ? this.toDate : ''],
    });
    this.reviewDateForm = this.fb.group({
      reviewDate:[this.reviewDate ? this.reviewDate: null]
    });
    if(this.mandatoryFields?.length === 0) {
      this.getPatientConfig();
    } else {
      for(let i in this.mandatoryFields) {
        this.patientInfoForm.get(this.mandatoryFields[i]).setValidators(Validators.required);
        this.patientInfoForm.get(this.mandatoryFields[i]).updateValueAndValidity();
      }
    }
  }

  getVitalsParam(param) {
    this.vitalsChartData['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#284255', '#FFC300', '#8e5ea2',
      '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    this.vitalParam = param;
    if (this.vitalParam === 'all') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [
        {
          data: this.vitalsChartData['chartData']['temperature'],
          label: 'Temperature',
          backgroundColor: this.vitalsChartData['colors'][1],
          borderColor: this.vitalsChartData['colors'][1],
          fill: false
        },
        {
          data: this.vitalsChartData['chartData']['SPO2'],
          label: 'SPO2',
          backgroundColor: this.vitalsChartData['colors'][3],
          borderColor: this.vitalsChartData['colors'][3],
          fill: false
        },
        {
          data: this.vitalsChartData['chartData']['HR'],
          label: 'HR',
          backgroundColor: this.vitalsChartData['colors'][4],
          borderColor: this.vitalsChartData['colors'][4],
          fill: false
        },
        {
          data: this.vitalsChartData['chartData']['resp_rate'],
          label: 'Respiratory rate',
          backgroundColor: this.vitalsChartData['colors'][6],
          borderColor: this.vitalsChartData['colors'][6],
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
              callback :function(label, index, labels) {
                if (Math.floor(label) === label) {
                  return label;
                }
              }
            },
          }],
          yAxes: [{
            type: 'linear',
            ticks: {

            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'pulse') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['pulse'],
          label: 'Pulse',
          backgroundColor: this.vitalsChartData['colors'][0],
          borderColor: this.vitalsChartData['colors'][0],
          fill: false
        },
        {
          data: this.vitalsChartData['pulseRef'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['pulseRef'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {

            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'temperature') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['temperature'],
          label: 'Temperature',
          backgroundColor: this.vitalsChartData['colors'][1],
          borderColor: this.vitalsChartData['colors'][1],
          fill: false
        },
        {
          data: this.vitalsChartData['tempRef'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['tempRef'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {

            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'SPO2') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['SPO2'],
          label: 'SPO2',
          backgroundColor: this.vitalsChartData['colors'][3],
          borderColor: this.vitalsChartData['colors'][3],
          fill: false
        },
        {
          data: this.vitalsChartData['SPO2Ref'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['SPO2Ref'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {

            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'HR') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['HR'],
          label: 'HR',
          backgroundColor: this.vitalsChartData['colors'][4],
          borderColor: this.vitalsChartData['colors'][4],
          fill: false
        },
        {
          data: this.vitalsChartData['HRRef'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['HRRef'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {
            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'HRV') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['HRV'],
          label: 'HRV',
          backgroundColor: this.vitalsChartData['colors'][5],
          borderColor: this.vitalsChartData['colors'][5],
          fill: false
        },
        {
          data: this.vitalsChartData['HRVRef'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['HRVRef'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {
            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
    if (this.vitalParam === 'resp_rate') {
      this.vitalsChartData['pulseLine'].config.data = {
        labels: this.vitalsChartData['chartData']['evt_time'],
        datasets: [{
          data: this.vitalsChartData['chartData']['resp_rate'],
          label: 'Respiratory rate',
          backgroundColor: this.vitalsChartData['colors'][6],
          borderColor: this.vitalsChartData['colors'][6],
          fill: false
        },
        {
          data: this.vitalsChartData['respRef'].map(value => value['min_val']),
          borderDash: [10, 5],
          label: 'Minimum',
          fill: false
        },
        {
          data: this.vitalsChartData['respRef'].map(value => value['max_val']),
          borderDash: [10, 5],
          label: 'Maximum',
          fill: false
        },
        ]
      };
      this.vitalsChartData['pulseLine'].config.options = {
        elements: {
          point: {
            radius: 1,
            pointStyle: 'triangle'
          },
          line: {
            tension: 0.000001
          }
        },
        legend: {
          display: false,
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 8
            },
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
          }],
          yAxes: [{
            display: true,
            type: 'linear',
            ticks: {
            },
          },
          ]
        },
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            display: false
          },
          filler: {
            propagate: false
          },
        },
        title: {
          display: false,
          position: 'top',
          text: 'VITALS PARAMETERS',
          fontSize: 14
        },
        tooltips: {
          mode: 'x-axis',
        },
        hover: {
          mode: 'x-axis',
          animationDuration: 0
        }
      };
      this.vitalsChartData['pulseLine'].update();
    }
  }

  vitalsChart(data) {
    data['colors'] = ['#03AAE8', '#00FF5A', '#019F96', '#284255', '#FFC300', '#8e5ea2', '#FFC0CB', '#3cba9f', '#FFB347', '#83B9FA'];
    if (this.vitalsChartData['pulseLine'] !== undefined || this.vitalsChartData['pulseLine'] != null) {
      this.vitalsChartData['pulseLine'].destroy();
    }
    if (data !== undefined && data.evt_time.length > 0) {
      this.vitalsChartData['pulseLine'] = new Chart(this.chartRef.nativeElement, {
        type: 'line',
        data: {
          labels: this.vitalsChartData['chartData']['evt_time'],
          datasets: [
          {
            data: data['temperature'],
            label: 'Temperature',
            backgroundColor: data['colors'][1],
            borderColor: data['colors'][1],
            fill: false
          },
          {
            data: data['SPO2'],
            label: 'SPO2',
            backgroundColor: data['colors'][3],
            borderColor: data['colors'][3],
            fill: false
          },
          {
            data: data['HR'],
            label: 'HR',
            backgroundColor: data['colors'][4],
            borderColor: data['colors'][4],
            fill: false
          },
          {
            data: data['resp_rate'],
            label: 'Respiratory rate',
            backgroundColor: data['colors'][6],
            borderColor: data['colors'][6],
            fill: false
          },
          ]
        },
        options : {
          elements: {
           point: {
             radius: 1,
             pointStyle: 'triangle'
           },
           line: {
             tension: 0.000001
           }
          },
          plugins: {
           legend: {
             display: false,
             position: 'top',
             labels: {
               usePointStyle: true
             }
           },
           tooltip: {
             mode: 'x',        
           },
           title: {
             display: false,
             position: 'top',
             text: 'VITALS PARAMETERS',
           },
           filler:{
             propagate: false
           },
           datalabels: {
             display: false
           }
          },
          scales:{
           x : {
             ticks:{
               maxRotation: 0,
               autoSkip: true,
               maxTicksLimit: 8,
             },
             title: {
               display: true,
               text: 'Time',
             },
           },
           y: {
             type: 'linear',
           }
          },
          spanGaps: true,
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
           mode: 'x'
          },
          animation: {
           duration: 0,
          }
         }
      });
    }
    this.vitalsChartData['lineShow'] = true;
    this.getVitalsParam(this.vitalParam)
  }

  tabChanged = (tabChangeEvent: any): void => {
    this.selectedTab = tabChangeEvent.index;
    if (tabChangeEvent.tab.textLabel === 'Alert History' && this.visitTypeId === 'VT-IP') {
      this.getPatientAlert(this.selectedPatientId);
      this.spinLoader = true;
    }
    if (tabChangeEvent.tab.textLabel === 'Asset Utilisation') {
      this.getAssetUtlisation(this.selectedPatientId);
      this.spinLoader = true;
    }
    if (tabChangeEvent.tab.textLabel === 'Visit History' && this.visitTypeId === 'VT-IP') {
      this.getVisitHistory(this.selectedPatientId);
      this.spinLoader = true;
    }
    if(tabChangeEvent.tab.textLabel === 'Movement History') {
      this.getMovementHistoryData(this.fromDate1,this.toDate,this.data.patientId,this.data.tagAssociationTypeId,this.pageStart, this.pageSize);
    }
    if(tabChangeEvent.tab.textLabel === 'Report') {
      this.getPatientReportHistory();
    }
  }

  getPatientReportHistory() {
    console.log(this.data, this.patientVisitId)
    this.configurationServices.getPatientReportHistory(this.patientVisitId).subscribe(res =>{
      if (res.statusCode === 1) {
        this.patientReportList = res.results;
        const Columns = ['reportStatusName', 'reportByName', 'reportCollectedDate'];
        for (let i = 0; i <= Columns.length; i++) {
          this.patientReportList.map(data => {
            data[this.PRHDisplayedColumn[i]] = data[Columns[i]];
          });
        }
        this.lengthPRH = res.results.length;
        this.spinLoader =  false;
      }
    });
  }

  getAssetUtlisation(id) {

    const params = '/astid=' + id;
    this.commonService.getReportData('asset-util-patient', params).subscribe(res => {
      if (res.results.statusCode === 200 && res.results.data['Asset Details'].length > 0) {
        this.AUdataSource = new MatTableDataSource<any>(res.results.data['Asset Details']);
        this.AUDisplayedColumns = ['Bed id', 'Asset name', 'Util Hrs', 'Off Hrs', 'Idle Hrs'];
        this.AUdataSource.paginator = this.paginator;
        this.spinLoader = false;
      } else {
        this.spinLoader = false;
        this.noAssetUtilData = true;
      }
     });
  }
  cancelAlert(data) {
    let alertData ={
      "message": data['message'],
      "eventCode": data['event'],
      "eventName": data['eventName'],
      "iotAlertId": data.id,
      "ackDatetime": data['ackDatetime'],
      "closedDatetime": data['closedDatetime'],
      "alertId": data.id
    }; 
    let title = "Cancel Notification"
    let ipView = null;
    if(this.ipView && this.ipView.type === 'location') {
      title = "Alert Remarks"
      ipView = 'location'
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: title,
        message: "",
        buttonText: { ok: "Ok", cancel: "Cancel" },
        alertDetails: alertData,
        cancelAlert: true,
        ipView : ipView,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        this.getPatientAlert(this.data.patientId);
      }
    });
  }
  
  getPatientAlert(id){
    let identifyingType = this.data.hasOwnProperty('isChild') && this.data.isChild ? 'Infant' : 'Patient';
    this.commonService.getAlertbyId(identifyingType, this.data.patientId).subscribe((res) => {
      if(res.statusCode == 1){
      this.HCDisplayedColumns = ['pfRuleName', 'Event', 'Message', 'Start Time','Ack Time', 'Ack User', 'End Time', 'Comments', 'Status', 'Edit']
      this.AHdataSource = new MatTableDataSource<any>(res.results);
      this.AHdataSource.paginator = this.AHPaginator;
      this.AHLength = res.results.length;
      this.spinLoader =  false;
      }
      else if(res.statusCode == 0){
        this.spinLoader = false;
        this.noData = true;
      }
    })
  }
  getTaskDetail(taskIds) {
    this.data["RType"] = "inpatient";
    this.data['permissionTab'] = ['Task List'];
    this.data["entityType"] = 'Patient';
    this.data["entityId"] = this.data.patientId;
    this.data['taskIds'] = taskIds;
    const dialogRef = this.dialog.open(WorkflowManagementComponent, {
      data: this.data,
      panelClass: ["large-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }

  getVisitHistory(id) {
    this.commonService.getVisitHistory(id).subscribe((res) => {
      if (res.statusCode === 1) {
      this.VHDisplayedColumns = ['Add', 'Child', 'Event', 'Event Time', 'Visit Identifier', 'Details','Admitted Location', 'Admitting Doctor', 'End Date', 'Status'];
      this.VHdataSource = new MatTableDataSource<any>(res.results);
      this.length = res.results.length;
      this.VHdataSource.paginator = this.paginator;
      this.spinLoader =  false;
      } else if (res.statusCode === 0) {
        this.spinLoader = false;
        this.isNoDataVH = true;
      }
    });
  }

  onToggleChange(cdkDetailRow: CdkDetailRowDirective,row) : void {
    if (this.singleChildRowDetail && this.openedRow && this.openedRow.expended) {
      this.openedRow.toggle();      
    }
    if(row !== null && cdkDetailRow.expended) {
      this['Visit' + row.visitIdentifier] = row.visitIdentifier;
    } else {
      this['Visit' + row.visitIdentifier] = null;
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }
  
  gethcDetails(dateValue) {
    this.selectedDate = dateValue;
    this.commonService.getHcPatientList(this.selectedDate).subscribe((res) => {
      const data = res.results;
    });
  }

  refreshPage() {
    this.gethcDetails(this.selectedDate);
  }

  isEnableCoster(event) {
    if (this.isEnableCoasterMobile !== true) {
      if (event === 'coaster') {
        this.isEnableCosterDropdown = true;
      } else {
        this.isEnableCosterDropdown = false;
      }
    }
  }

  searchToCoster(event) {
    if (event.type === 'costerTagId' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAllTagByType(event.text, this.workflowTypeId, 'ST-AT').subscribe(res => {
          this.listItems = res.results;
          this.searchCosterlist = this.listItems;
          if (this.listItems !== null && this.listItems.length === 1) {
            this.getTagTypeId(this.listItems[0].tagTypeId);
            this.patientInfoForm.controls['tagSerialNumber'].setValue(this.listItems[0].tagId);
            this.patientInfoForm.get('tagSerialNumber').updateValueAndValidity();
          }
        });
      } else {
        this.searchCosterlist = this.listItems;
      }
    } else {
      this.searchCosterlist = [];
    }
  }

  getTagTypeId(tagTypeId) {
    this.tagTypeId = tagTypeId;
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
      this.consultantId = null;
      if (name.length >= 3) {
        this.doctorEnabled = true;
        if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 190) {
          if (event.toHit == true) {
            this.commonService.searchDoctor(name, 'UT_DOCTOR', 'RO-DO').pipe(
              debounceTime(3000),
              distinctUntilChanged(),
            ).subscribe(res => {
              this.doctorList = res.results;
            });
          }
        } else if (type === 'doctor' && (event.keyCode == 38 || event.keyCode == 40)) {
          const doctorList = this.doctorList;
          this.doctorList = doctorList;
        }
      }
    } else {
      this.doctorList = [];
    }
  }

  checkToken() {
    this.tokenMsg = null;
    this.tokenDetail = null;
    const token = this.patientInfoForm.controls['token'].value;
    this.dashboardService.validatePatientToken(token).subscribe(res => {
      if (res.statusCode == 1) {
        this.tokenDetail = res.results;
      } else {
        this.tokenMsg = res.message;
      }
    });
  }
  AssignToken() {
    const result = {
      'birthDate': this.data.birthDate,
      'firstName': this.data.firstName,
      'fullName': this.data.name,
      'lastName': this.data.lastName,
      'gender': this.data.gender,
      'middleName': this.data.middleName,
      'mobileNo': this.data.mobile_no,
      'packageName': this.data.health_plan_name,
      'patientId': this.tokenDetail.patientId,
      'tempPatientId': this.data.patientId,
      'patinetVisitId': this.tokenDetail.patientVisitId,
      'tokenNo': this.patientInfoForm.controls['token'].value,
      'visitIdentifier': this.data.visit_identifier,
    };
    this.commonService.saveMergeRecord(result).subscribe(res => {
      if (res.statusCode === 1) {
        this.preferedLanguage = this.patientInfoForm.controls['preferedLanguage'].value;
        this.vipTypeId = this.patientInfoForm.controls['vipTypeId'].value;
        this.tokenDetail = null;
        this.tokenMsg = null;
        this.isTempPatient = false;
        this.selectedTabIndex = 1;
        this.getPatientDetails(result.patientId, result.patinetVisitId, this.visitTypeId, this.visitEventId);
      } else {
        console.log(res.message);
      }
    });
  }
  assignedFloorCookie(floorId) {
    this.assignFloorData = floorId;
  }
  generateToken(skipValidate?) {
    if (this.visitTypeId === 'VT-HC') {
      this.PCTestStatus = true;
    }
    if ((this.cookieService.check('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))))) {
        const floorId = parseInt(this.cookieService.get('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
        this.assignFloorId = floorId;
      } else {
        if (this.assignFloorDetails.length > 0) {
          this.assignFloorData = this.assignFloorDetails[0].floorId;
        }
      }
    const val = {
      'mainidentifier': this.data.uhid,
      'firstName': this.data.firstName,
      'middleName': this.data.middleName,
      'lastName': this.data.lastName,
      'age': this.patientInfo[0].age,
      'birthDate': this.data.birthDate,
      'gender': this.data.gender,
      'mobileNo': this.data.mobile_no,
      'patientVisitId': this.data.patinetVisitId,
      'healthPlanId': this.data.health_plan_id,
      'isDiabetic': this.isDiabetic,
      'isFasting': this.isFasting,
      'isVulnerable': this.isVulnerable,
      'isPregnant': this.isPregnant,
      'vipTypeId': this.patientInfoForm.controls['vipTypeId'].value,
      'preferedLanguage': this.patientInfoForm.controls['preferedLanguage'].value,
      'externalRegionId': null,
      'assignedFloorId': null,
      'packageDate': null,
      'isPkgDateEdited': false,
      'tagSerialNumber': null,
      'tagTypeId': null,
      'visitIdentifier': this.data.visit_identifier,
      'billingDate':this.data.billingDate,
    };
    if (this.visitTypeId === 'VT-OP' && this.data.patientVisitId === null) {
      val['tempPatientId']    = this.data.patientId;
      val['patientVisitId']   = this.data.patientVisitId;
      val['mobileNo']         = this.data.mobileNo;
      val['visitIdentifier']  = this.data.visitIdentifier;
      val['mainidentifier']   = this.data.mainidentifier;
      val['healthPlanId']     = this.data.healthPlanId;
      val['visitTypeId']      = this.visitTypeId;
    }
    if(skipValidate) {
      val['tokenNumberId']    = this.tokenId;
      this.enableDialogClose  = false;
    }
    
    this.commonService.saveRegisteredPatients(val).subscribe(res => {
      if (res.statusCode === 1) {
        this.preferedLanguage = this.patientInfoForm.controls['preferedLanguage'].value;
        this.vipTypeId = this.patientInfoForm.controls['vipTypeId'].value;
        this.tokenDetail = null;
        this.tokenMsg = null;
        this.isTempPatient = false;
        this.selectedTabIndex = 1;
        this.token_no = res.results?.tokenNo;
        this.getPatientDetails(res.results.id, res.results.patientVisitId, this.visitTypeId, this.visitEventId, skipValidate);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  // Print function
  printToken() {
    const printContent = document.getElementById('tokenData').innerHTML;
    if (printContent) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
  
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write('<html><head><title>Token</title>');
      doc.write('<style>@page { size: auto; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }</style>');
      doc.write('</head><body>');
      doc.write(printContent);
      doc.write('</body></html>');
      doc.close();
  
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
      }, 1000);
    }
  }

  getPatientList(id, status, testId, testType, visitStatusId, planTypeId) {
    this.commonService.getAllpatientByLocation(id, status, testId, testType, visitStatusId, planTypeId).subscribe(res => {
      this.patientList = res.results;
      if (this.patientList[0]) {
        if (this.patientList[0].visitTypeId === null) {
          this.visitTypeId = 'VT-HC';
        } else {
          this.visitTypeId = this.patientList[0].visitTypeId;
        }

        if (this.visitTypeId === 'VT-HC') {
          this.workflowTypeId = 'WF-HC';
        } else if (this.visitTypeId === 'VT-IP') {
          this.workflowTypeId = 'WF-IP';
        } else if ((this.visitTypeId === 'VT-IP' && this.visitEventTypeId === 'VE-OT') || this.visitTypeId === 'VT-EC') {
          this.workflowTypeId = 'WF-OT';
        } else if (this.visitTypeId === 'VT-OP') {
          this.workflowTypeId = 'WF-OP';
        }

        if (this.patientList[0].visitTypeId === 'VT-IP') {
          this.visitEventTypeId = this.patientList[0].visitEventTypeId;
          this.visitEventId     = this.patientList[0].visitEventId;
          this.getRoutineEventDetails(this.patientList[0].patientId, 'Patient', this.fromDate);
        }
        this.getPatientDetails(this.patientList[0].patientId, this.patientList[0].patientVisitId, this.patientList[0].visitTypeId, this.visitEventId);
      }
      this.dataSource = new MatTableDataSource<PatientList>(res.results);
    });
  }

  getPatientTestDetail(id, patientVisitId, visitTypeId?: string, visitEventId?: string) {
    this.isTempPatient = false;
    this.commonService.getPatientTestDetail(id, patientVisitId, this.isTempPatient, this.visitTypeId, this.visitEventTypeId, visitEventId, this.data.workflow).subscribe(res => {  
      console.log(res.results)
      this.patientInfo[0]['testStatuses'] = res.results['testStatuses'];
      this.patientInfo[0]['healthTestId'] = res.results['healthTestId'];
      this.patientInfo[0]['testType'] = res.results['testType'];
      
      if (this.patientInfo[0].healthTestId != null) {
        this.patientInfo[0]['healthTestName'] = res.results['healthTestName'];
        this.patientInfo[0]['locationName'] = res.results['locationName'];
        this.patientInfo[0]['floorName'] = res.results['floorName'];        
        this.patientInfo[0]['currentStatusName'] = res.results['currentStatusName'];
        this.patientInfo[0]['waitTime'] = res.results['waitTime'];        
        this.testLocationDetails(this.patientInfo[0].testType, this.patientInfo[0].healthTestId);
      }
      this.pendingInfo = [];
      this.completeInfo = [];
      if (this.patientInfo[0].testStatuses != null) {
        for (let i = 0; this.patientInfo[0].testStatuses.length > i; i++) {
          if (this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PE' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-NR' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-FL' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-SK' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PC') {
            this.pendingInfo.push(this.patientInfo[0].testStatuses[i]);
          } else if (this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-CO') {
            this.completeInfo.push(this.patientInfo[0].testStatuses[i]);
          }
        }
      }
      if (this.pendingInfo && this.patientInfo[0].healthTestId === null) {
        this.isEnableDropdown = true;
        this.isCheckEnableDropdown = true;
        this.patientInfoForm.get('testId').disable();
        this.patientInfoForm.get('locationId').disable();
      } else {
        this.isEnableDropdown = false;
        this.isCheckEnableDropdown = false;
        this.patientInfoForm.get('testId').enable();
        this.patientInfoForm.get('locationId').enable();
      }
      this.patientInfoForm.get('testId').updateValueAndValidity();
      this.patientInfoForm.get('locationId').updateValueAndValidity();

      if (this.pendingInfo) {
        this.isChkPendingProcessTest = this.pendingInfo.filter(pc => pc.healthTestName === 'Process Counter');
      }

      if (this.completeInfo) {
        this.checkProcessTest = this.completeInfo.filter(rs => rs.healthTestName === 'Process Counter');
      }
      if(this.patientInfo[0].tokenNo !== null && this.checkProcessTest.length === 0 && this.visitTypeId === 'VT-HC') {
        this.PCTestStatus = true;
        if ((this.cookieService.check('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))))) {
          const floorId = parseInt(this.cookieService.get('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
          if (floorId !== null && floorId !== undefined) {
            this.assignFloorId = floorId;
          } else {
            if (this.assignFloorDetails.length > 0) {
              this.assignFloorId = this.assignFloorDetails[0].floorId;
            }
          }
        } else {
          if (this.assignFloorDetails.length > 0) {
            this.assignFloorId = this.assignFloorDetails[0].floorId;
          }
        }
        this.patientInfoForm.get('assignFloorId').setValue(this.assignFloorId);
        this.patientInfoForm.get('assignFloorId').updateValueAndValidity();
      }
      for (let u = 0; u < this.patientInfo.length; u++) {
        if (this.patientInfo[u].isDiabetic === true) {
          this.patientInfo[u]['isDisableDiabetic'] = true;
        } else {
          this.patientInfo[u]['isDisableDiabetic'] = false;
        }

        if (this.patientInfo[u].useMobile === true) {
          this.patientInfo[u]['isDisableUseMobile'] = true;
        } else {
          this.patientInfo[u]['isDisableUseMobile'] = false;
        }
      }

    });  
  }

  getPatientDetails(id, patientVisitId, visitTypeId?: string, visitEventId?: string, skipValidate?) {
    this.loading = true;
    if(this.data.hasOwnProperty('ipView') && this.data.ipView == 'location') {
      this.selectedTabIndex = 2;
      this.selectedTab = 2;
      let tabData = {
        index : 2,
        tab : { textLabel : 'Alert History' }
      }
      this.tabChanged(tabData)
    } else {
    if (this.selectedTab === 1) {
      this.selectedTabIndex = 1;
    } else {
      this.selectedTab = 0;
      this.selectedTabIndex = 0;
    }
    }

    if ((this.data.hasOwnProperty('defaultTab') && this.data.defaultTab === 'routine')) {
      this.selectedTabIndex = 3;
      this.selectedTab = 3;
    }
    this.selectedPatientId = id;
    this.selectedPatinetVisitId = patientVisitId;
    if (visitTypeId === null) {
      this.visitTypeId = 'VT-HC';
    } else {
      this.visitTypeId = visitTypeId;
    }
    if(this.data.workflow === 'DayCare') {
      this.isTempPatient = false;
    }
    this.commonService.getPatientInfo(id, patientVisitId, this.isTempPatient, this.visitTypeId, this.visitEventTypeId, visitEventId, this.data.workflow).subscribe(res => {
      this.selectPatient = id;
      const e = eval;
      this.patientInfo = e('[' + JSON.stringify(res.results) + ']');
      this.getBannerDataInfo(this.patientInfo[0])
      this.data['billingDate'] = this.patientInfo[0].billingDate;
      this.dropdownTestId = this.patientInfo[0].healthTestId;
      this.dropdownLocationId = this.patientInfo[0].locationId;
      this.dropdownStatusId = this.patientInfo[0].currentStatusId;
      this.patientVisitId = this.patientInfo[0].patientVisitId;
      this.patientId = this.patientInfo[0].patientId;
      this.healthPlanId = this.patientInfo[0].healthPlanId;
      this.vipTypeId = this.patientInfo[0].vipTypeId;
      this.isDiabetic = this.patientInfo[0].isDiabetic;
      this.isFasting = this.patientInfo[0].isFasting;
      this.isVulnerable = this.patientInfo[0].isVulnerable;
      this.isPregnant = this.patientInfo[0].isPregnant;
      this.preferedLanguage = this.patientInfo[0].preferedLanguage;
      this.loading = false;
      if(this.data && this.data.hasOwnProperty('tagId')){
        this.tagId = this.data?.tagId == this.patientInfo[0].tagId? this.patientInfo[0].tagId : null;
      }else{
        this.tagId = this.patientInfo[0].tagId;
      }
      this.lastModifiedOn = this.patientInfo[0].lastModifiedOn;
      this.tagTypeId = this.patientInfo[0].tagTypeId;
      if (this.patientInfo[0].tagId !== null && this.patientInfo[0].tagTypeId !== null) {
        this.isEnableCoasterMobile = true;
      }
      if (this.patientInfo[0].tagTypeId === null) {
        this.tag_type_name = this.patientInfo[0].patientVisitTagType === 'TT-MB' ? 'mobile' : 'coaster';
      } else {
        this.tag_type_name = this.patientInfo[0].tagTypeId === 'TT-MB' ? 'mobile' : 'coaster';
      }
      this.token_no = this.patientInfo[0].tokenNo;
      this.patientInfo[0].visitTypeId = this.visitTypeId;
      this.patientInfo[0].visitStatus = this.visitStatus;
      this.patientInfo[0].visitEventTypeId  = this.visitEventTypeId;
      this.patientInfo[0].visitEventId  = this.visitEventId;
      this.isVisitDateCheck = this.datepipe.transform(this.patientInfo[0].visitDate, 'yyyy-MM-dd');
      this.buildForm();

      if (this.patientInfo[0].healthTestId != null) {
        this.testLocationDetails(this.patientInfo[0].testType, this.patientInfo[0].healthTestId);
      }
      this.pendingInfo = [];
      this.completeInfo = [];
      if (this.patientInfo[0].testStatuses != null) {
        for (let i = 0; this.patientInfo[0].testStatuses.length > i; i++) {
          if (this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PE' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-NR' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-FL' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-SK' ||
            this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-PC') {
            this.pendingInfo.push(this.patientInfo[0].testStatuses[i]);
          } else if (this.patientInfo[0].testStatuses[i].patientStatusId === 'QS-CO') {
            this.completeInfo.push(this.patientInfo[0].testStatuses[i]); 
          }
        }
      }

      if (this.pendingInfo && this.patientInfo[0].healthTestId === null) {
        this.isEnableDropdown = true;
        this.isCheckEnableDropdown = true;
        this.patientInfoForm.get('testId').disable();
        this.patientInfoForm.get('locationId').disable();
      } else {
        this.isEnableDropdown = false;
        this.isCheckEnableDropdown = false;
        this.patientInfoForm.get('testId').enable();
        this.patientInfoForm.get('locationId').enable();
      }
      this.patientInfoForm.get('testId').updateValueAndValidity();
      this.patientInfoForm.get('locationId').updateValueAndValidity();

      if (this.pendingInfo) {
        this.isChkPendingProcessTest = this.pendingInfo.filter(pc => pc.healthTestName === 'Process Counter');
      }

      if (this.completeInfo) {
        this.checkProcessTest = this.completeInfo.filter(rs => rs.healthTestName === 'Process Counter');
        if(visitTypeId == 'VT-HC'){
          this.columns['completed'] = ['HealthTest Name','Location Name','Created on','Start Time','Completed At','Auto Completed','Consult Time','Wait Time', 'Review Date']
          this.columnData['completed'] = ['healthTestName','floorLocationName','time','inTime','toTime','isAutoCompleted','consultTime','waitTime', 'reviewDate']
        }else if(visitTypeId === 'VT-DC'){
           this.columns['completed'] = ['HealthTest Name','Location Name','Created on','Completed At','Consult Time','Wait Time', 'Review Date', 'reviewDateedit']
          this.columnData['completed'] = ['healthTestName','floorLocationName','time','inTime','consultTime','waitTime', 'reviewDate',   '']
        }else if(visitTypeId == 'VT-OP'){
          this.columns['completed'] = ['HealthTest Name','Location Name','Created on','Start Time','Completed At','Consult Time','Wait Time']
          this.columnData['completed'] = ['healthTestName','floorLocationName','time','inTime','toTime','consultTime','waitTime']
        }else if(visitTypeId == 'VT-IP' && this.visitEventTypeId !=='VE-OT'){
          this.columns['completed'] = ['HealthTest Name','Location Name','Created on','Start Time','Wait Time']
          this.columnData['completed'] = ['healthTestName','floorLocationName','time','inTime','waitTime',]
        }else if ( visitTypeId =='VT-EC' || visitTypeId == 'VT-IP' && this.visitEventTypeId =='VE-OT'){
          this.columns['completed'] =['HealthTest Name','Location Name','Created on','Start','End','Duration','Wait Time',]
          this.columnData['completed'] = ['healthTestName','floorLocationName','time','inTime','toTime','consultTime','waitTime']
        }
        this.completeInfo.forEach(item => {
          item.floorLocationName = `${item.locationName || ''} ${item.floorName || ''}`.trim();
          if (item.hasOwnProperty('isAutoCompleted')) {
            item.isAutoCompleted = item.isAutoCompleted ? 'Yes' : 'No';
          }
          if (item.hasOwnProperty('inTime')) {
            item.inTime = this.datepipe.transform(item.inTime, 'h:mm:ss a');
          }
        
          if (item.hasOwnProperty('toTime')) {
            item.toTime = this.datepipe.transform(item.toTime, 'h:mm:ss a');
          }
        });
      }
      if(this.patientInfo[0].tokenNo !== null && this.checkProcessTest.length === 0 && this.visitTypeId === 'VT-HC') {
        this.PCTestStatus = true;
        if ((this.cookieService.check('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))))) {
          const floorId = parseInt(this.cookieService.get('assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
          if (floorId !== null && floorId !== undefined) {
            this.assignFloorId = floorId;
          } else {
            if (this.assignFloorDetails.length > 0) {
              this.assignFloorId = this.assignFloorDetails[0].floorId;
            }
          }
        } else {
          if (this.assignFloorDetails.length > 0) {
            this.assignFloorId = this.assignFloorDetails[0].floorId;
          }
        }
        this.patientInfoForm.get('assignFloorId').setValue(this.assignFloorId);
        this.patientInfoForm.get('assignFloorId').updateValueAndValidity();
      }
      for (let u = 0; u < this.patientInfo.length; u++) {
        if (this.patientInfo[u].isDiabetic === true) {
          this.patientInfo[u]['isDisableDiabetic'] = true;
        } else {
          this.patientInfo[u]['isDisableDiabetic'] = false;
        }

        if (this.patientInfo[u].useMobile === true) {
          this.patientInfo[u]['isDisableUseMobile'] = true;
        } else {
          this.patientInfo[u]['isDisableUseMobile'] = false;
        }

      }
      let checkOT = this.data && this.data.hasOwnProperty('visitEventTypeId') && this.data.visitEventTypeId == "VE-OT";
      if(this.visitTypeId === 'VT-IP' && !checkOT) {
        this.getPatientTestDetail(this.selectedPatientId, this.selectedPatinetVisitId, this.visitTypeId, this.visitEventId);
      }
      if(skipValidate) {
        this.updateClinicalDetails()
      }
    });
  }
  reviewDateTimeCall(patientQueueId) {
    const updateReviewDate = {
      "statusId":"QS-CO",
      "reviewDate": this.reviewDate
    }
  const dialogRef = this.dialog.open(ConfirmationDialog, {
    panelClass:['confirmation-popup'], disableClose: true,
    data: {
      title: 'Review Date', message: 'Are you sure to change the Review Date ?',
      buttonText: { ok: 'Yes', cancel: 'No' },
      'patientQueueId': patientQueueId, 'updateReviewDate': updateReviewDate, 'isRemark': 1, 'reviewDateInfo': true,
    }
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result === 'Yes') {
      this.refresh();
    }
  });
  }
  getReviewDate(date, id) {
    this.reviewDate = this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    this.reviewDateTimeCall(id);
  }
  triggerAction(event){
    if(event.key == 'completeReviewDate') {
      this.reviewDate = this.datepipe.transform(event.keyVal.target.value, 'yyyy-MM-dd HH:mm:ss');
      let queueId = event.data.patientQueueId
      this.reviewDateTimeCall(queueId);
    }
}
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
    this.patientList = this.dataSource.filteredData;
  }
  groupInfo(testId, planId, patientQueueId) {
    this.commonService.getHealthTestGroup(testId, planId, patientQueueId).subscribe(res => {
      this.testGroupInfo = res.results;
    });
  }

  testLocationDetails(testType, testId) {
    this.commonService.getHealthTestAvailableLocation(testType, testId).subscribe(res => {
      this.testAvailableLocation = res.results;
    });
  }

  enableDropdown() {
    this.isEnableDropdown = true;
    this.isCheckEnableDropdown = false;
    this.patientInfoForm.get('testId').enable();
    this.patientInfoForm.get('locationId').enable();
    this.patientInfoForm.get('testId').updateValueAndValidity();
    this.patientInfoForm.get('locationId').updateValueAndValidity();
    this.currentTestDetails = [{
      'testType': this.patientInfo[0].testType,
      'healthTestId': this.patientInfo[0].healthTestId,
      'healthTestName': this.patientInfo[0].healthTestName,
      'inTime': this.patientInfo[0].inTime,
      'locationId': this.patientInfo[0].locationId,
      'locationName': this.patientInfo[0].locationName,
      'patientQueueId': this.patientInfo[0].patientQueueId,
    }];
    this.selectedTesttype = this.patientInfo[0].testType;
    if (this.currentTestDetails[0].healthTestId) {
      this.pendingTestInfo = this.currentTestDetails.concat(this.pendingInfo);
    } else {
      this.pendingTestInfo = this.pendingInfo;
    }
  }

  enableStatusDropdown(testId, testType) {
    this.testLocationDetails(testType, testId);
    const filterStatusChange = this.pendingInfo.filter(res => res.healthTestId === testId && res.testType === testType);
    this.pendingLocId = filterStatusChange[0].locationId;
    this.consultantId = filterStatusChange[0].consultantId;
    this.consultantName = filterStatusChange[0].consultantName;
    this.buildForm();
    if (filterStatusChange[0].patientStatusId === 'QS-NR' || filterStatusChange[0].patientStatusId === 'QS-FL') {
      this.hidePendingTestDD = false;
    } else {
      this.hidePendingTestDD = true;
    }
    if (testId === filterStatusChange[0].healthTestId && testType === filterStatusChange[0].testType) {
      this.isEnableStatusDropdown = true;
      this.isEditStatusTestId = testId;
      this.isEditStatusTesttype = testType;
      this.statusId = filterStatusChange[0].patientStatusId;
      this.buildForm();
    } else {
      this.isEnableStatusDropdown = false;
    }
  }

  statusChange(data, value) {
    if (value !== 'QS-NR' && value !== 'QS-FL') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: 'Edit status', message: 'Are you sure to change the status?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'queueId': data.patientQueueId, 'isRemark': 1, 'testStatusChange': true, 'statusId': value, 'lastModifiedOn' : data.lastModifiedOn && ["QS-PE", "QS-FL", "QS-NR", "QS-CO"].includes(value) ? data.lastModifiedOn : this.lastModifiedOn
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.refresh();
          this.isEnableStatusDropdown = false;
          this.isEditStatusTesttype = data.healthTestId;
          this.isEditStatusTestId = data.testType;
        }
      });
    } else {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Edit status', message: 'Select reason for change',
          buttonText: { ok: 'Ok', cancel: 'Cancel' },
          'queueId': data.patientQueueId, 'isRemark': 1, 'testStatusChange': true, 'statusId': value, 'lastModifiedOn' : data.lastModifiedOn && ["QS-PE", "QS-FL", "QS-NR", "QS-CO"].includes(value) ? data.lastModifiedOn : this.lastModifiedOn
        }
      });
      dialogRef.afterClosed().subscribe(results => {
        if (results === 'Yes') {
          this.refresh();
          this.isEnableStatusDropdown = false;
          this.isEditStatusTesttype = data.healthTestId;
          this.isEditStatusTestId = data.testType;
        }
      });
    }
  }

  addTest() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Add Test', message: '',
        buttonText: { ok: 'Save', cancel: 'Cancel' },
        'patientId': this.patientInfo[0].patientId, 'patientVisitId': this.patientInfo[0].patientVisitId,
        'planTypeId' : this.visitTypeId == 'VT-OP' ? 'HP-OP' : this.visitTypeId == 'VT-HC' ? 'HP-HC' : 'HP-OT',
        'isRemark': 1, 'isNewTestAdded': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.refresh();
      }
    });

  }
  getBannerAction(event) {
    if (event.key === 'doctor') {
      this.updateDoctor(event.data);
    } else if (event.key === 'disassociate') {
      this.disAssociateCoaster(event.data);
    } else if (event.key === 'discharge') {
      this.discharge(event.data)
    } else if (event.key === 'Resend') {
      this.resendMessage(event.data)
    } else if (event.key === 'refresh') {
      this.refresh()
    }
  }
  updateDoctor(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Update Doctor', message: '',
        buttonText: { ok: 'Save', cancel: 'Cancel' },
        'patientId': data?.patientId, 'patientVisitId': data?.patientVisitId,
        'isRemark': 1, 'updateDoctor': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.refresh();
      }
    });
  }

  processCounter(event, data) {
    if (event.checked === true) {
      this.PCTestStatus = true;
    } else {
      this.PCTestStatus = false;
    }
  }

  sendMsgToCoster(data, messageType) {
    let costerStatus: any;
    let locationName: any;
    if (data.healthTestId == null) {
      const completeTestDetails = data.testStatuses.filter(filter => filter.patientStatusId === 'QS-CO');
      const lastCompleteTestDetails = completeTestDetails.sort(
        (a, b) => (a.toTime < b.toTime) ? 1 : ((b.toTime < a.toTime) ? -1 : 0)
      );
      locationName = lastCompleteTestDetails[0].locationName;
      costerStatus = {
        'tagId': data.tagId,
        'testId': lastCompleteTestDetails[0].healthTestId,
        'visitId': data.patientVisitId,
        'patientStatusId': lastCompleteTestDetails[0].patientStatusId,
        'tagTypeId': data.tagTypeId,
        'floorId': data.floorId,
        'locationId': lastCompleteTestDetails[0].locationId,
        'planId': data.healthPlanId,
        'patientId': data.patientId,
        'queueId': lastCompleteTestDetails[0].patientQueueId,
        'patientToken': data.tokenNo,
        'testType': data.testType
      };
    } else {
      locationName = data.locationName;
      costerStatus = {
        'tagId': data.tagId,
        'testId': data.healthTestId,
        'visitId': data.patientVisitId,
        'patientStatusId': data.currentStatusId,
        'tagTypeId': data.tagTypeId,
        'floorId': data.floorId,
        'locationId': data.locationId,
        'planId': data.healthPlanId,
        'patientId': data.patientId,
        'queueId': data.patientQueueId,
        'patientToken': data.tokenNo,
        'testType': data.testType
      };
    }

    if (messageType === 'test_status') {
      costerStatus['messageType'] = 'test_status';
      costerStatus['message'] = '';
    } else {
      costerStatus['messageType'] = 'flash';
      costerStatus['message'] = 'Please report to the ' + locationName + ' room.';
    }
    console.log(costerStatus);
    this.commonService.publishTestStatusToCoaster(costerStatus).subscribe(res => {
      this.isEnableMsg = false;
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.message}`);
      });
  }

  changeEvent(eventName, testType, testId) {
    if (eventName === 'test') {
      this.isEnableButton = true;
      this.selectedTesttype = testType;
      this.testLocationDetails(testType, testId);
    } else {
      this.isEnableButton = false;
    }

    if (eventName === 'location') {
      this.isEnableButton = false;
    } else {
      this.isEnableButton = true;
    }
  }

  onChangeClinicalDetails(event, type) {
    if (type === 'isDiabetic') {
      this.isDiabetic = event;
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

  disAssociateCoaster(tagId) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Disassociate Device', message: 'Do you want to disassociate the device?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'tagId': tagId, 'isRemark': 1, 'disAssociateCoaster': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.refresh();
        this.isEnableCoasterMobile = false;
      } else {
        this.refresh();
      }
    });
  }
  cancelBilling() {
    console.log(this.patientInfo[0]);
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Cancel Billing', message: 'Do you want to cancel the billing ?',
        'patientId': this.patientInfo[0].patientId, 'patientVisitId': this.patientInfo[0].patientVisitId,
        'tagId': this.patientInfo[0].tagId,
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, 'cancelBilling': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.thisDialogRef.close('confirm');
      } else {
        this.refresh();
      }
    });

  }

  discharge(data) {
    console.log(this.patientInfo[0]);
    let msg = 'Tag will be disassociated. Do you want to discharge ?'
    if(data?.tagId == null) {
      msg = 'Do you want to discharge ?'
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Discharge', message: msg,
        'patientId': data?.patientId, 'patientVisitId': data?.patientVisitId,
        'visitType': data?.visitTypeId, 'tagId': data?.tagId,
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, 'discharge': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.visitEventStatusId = 'VS-CO';
        this.refresh();
        this.thisDialogRef.close('confirm');
      } else {
        this.refresh();
      }
    });

  }
 reportCollect(data) {
  const dialogRef = this.dialog.open(ConfirmationDialog, {panelClass:['confirmation-popup'], disableClose: true,
    data: {
      title: 'Confirmation', message: 'Do you confirm report collection ?',
      buttonText: { ok: 'Confirm', cancel: 'Cancel' },
      'updateReportDate': data, 'isRemark': 1,
    }
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result === 'Yes') {
      this.refresh();
    }
  });
 }
 resendMessage(patientInfo) {
  let visitTypeId = patientInfo.visitTypeId ? patientInfo.visitTypeId : 'VT-HC';
  this.commonService.sendPatientWelcomeMessage(patientInfo.patientId,patientInfo.patientVisitId, visitTypeId).subscribe(res => {
    if(res.statusCode == 1) {
      this.toastr.success('Success', `${res.message}`);
    }
  });
 } 
updateClinicalDetails() {
    this.clinicalModel = new ClinicalModel(null, null, null, null, null, null, null, null, null, null, null, null);
    this.clinicalModel.patientId = this.patientId;
    this.clinicalModel.healthPlanId = this.healthPlanId;
    this.clinicalModel.patientVisitId = this.patientVisitId;
    this.clinicalModel.isDiabetic = this.isDiabetic;
    this.clinicalModel.isVulnerable = this.isVulnerable;
    this.clinicalModel.isPregnant = this.isPregnant;
    this.clinicalModel.isFasting = this.isFasting;
    this.clinicalModel.vipTypeId = this.patientInfoForm.controls['vipTypeId'].value;
    this.clinicalModel.tagId = this.patientInfoForm.controls['tagSerialNumber'].value;
    this.clinicalModel.token = this.token_no;

    if (this.patientInfoForm.controls['coster'].value === 'coaster') {
      this.clinicalModel.tagTypeId = this.tagTypeId;
    } else {
      this.clinicalModel.tagTypeId = 'TT-MB';
      this.clinicalModel.tagId = null;
    }

    if (this.patientInfoForm.controls['vipTypeId'].value === 'null') {
      this.clinicalModel.vipTypeId = null;
    } else {
      this.clinicalModel.vipTypeId = this.patientInfoForm.controls['vipTypeId'].value;
    }

    this.clinicalModel.preferedLanguage = this.patientInfoForm.controls['preferedLanguage'].value;

    console.log(this.clinicalModel);

    if (this.PCTestStatus === true) {
      const status = { 'statusId': 'QS-CO', 'locationId': this.patientInfo[0].locationId,
                       'floorId': this.patientInfoForm.controls['assignFloorId'].value };
      let updateQueueStatusId;
      if (this.patientInfo[0].healthTestName === 'Process Counter') {
        updateQueueStatusId = this.patientInfo[0].patientQueueId;
      } else {
        const checkProcessTestDetails = this.pendingInfo.filter(res => res.healthTestName === 'Process Counter');
        updateQueueStatusId = checkProcessTestDetails[0]?.patientQueueId;
      }
      if(updateQueueStatusId !== undefined && updateQueueStatusId !== null) {
        this.dashboardService.updatePatientQueueStatus(updateQueueStatusId, status).subscribe(res => {
      });
      }
    }
    if (this.patientInfoForm.controls['assignFloorId'].value !== null) {
      this.cookieService.set(
        'assign_floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),this.assignFloorData
      );
    }

    this.commonService.updateClinicalDetails(this.clinicalModel).subscribe(res => {


      this.toastr.success('Success', `${res.message}`);
      if(this.enableDialogClose != true){
         this.enableDialogClose = true;
      }else{
      this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.toastr.error('Error', `${error.message}`);
      });
  }

  updatePatientTest(event?: Object) {

    let updatePatientDetails = [];
    let msg = '';
    if (event) {
      updatePatientDetails = [event];
      this.asignedLocationName = this.patientInfo[0]['asignedLocationName'];
      msg = 'Do you want to assign to location ';
    } else {
      msg = 'Do you want to change test / location?';
      const testId = this.patientInfoForm.controls['testId'].value;
      const locationId = this.patientInfoForm.controls['locationId'].value;

      const filterLocationDetails = this.pendingTestInfo.filter(res => res.healthTestId === testId && res.testType === this.selectedTesttype);

      let testNameChange = [];
      let locationChange = [];
      testNameChange = [
        {
          'locationId': null,
          'patientQueueId': this.patientInfo[0].patientQueueId,
          'patientStatusId': 'QS-PE',
          'lastModifiedOn': null
        }
      ];

      locationChange = [
        {
          'locationId': locationId,
          'patientQueueId': filterLocationDetails[0].patientQueueId,
          'patientStatusId': 'QS-WT',
          'lastModifiedOn': null
        }
      ];
      if (this.patientInfo[0].healthTestId && (testId !== this.patientInfo[0].healthTestId || this.selectedTesttype !== this.patientInfo[0].testType)) {
        updatePatientDetails = testNameChange.concat(locationChange);
      } else {
        updatePatientDetails = locationChange;
      }
    }

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Test Location', message: msg,
        buttonText: { ok: 'Yes', cancel: 'No' },
        'updatePatientDetails': updatePatientDetails, 'isRemark': 1, 'patientLocation': true, 'asignedLocationName': this.asignedLocationName
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.refresh();
        this.isCheckEnableDropdown = false;
        if (this.pendingInfo && this.patientInfo[0].healthTestId === null) {
          this.isEnableDropdown = true;
        } else {
          this.isEnableDropdown = false;
        }
        this.isEnableButton = true;
      }
    });
  }

  checkStatus(value) {
    if (value === 'QS-NR' || value === 'QS-FL') {
      this.hidePendingTestDD = false;
    } else {
      this.hidePendingTestDD = true;
    }

  }

  assignLocationToPendingTest(data, locationId, consultantId) {
    let msg = '';
    if (consultantId !== null) {
      msg = 'Are you sure to change the consultant?';
    } else {
      msg = 'Are you sure to change the location?';
    }

    const updatePatientDetails = [
      {
        'locationId': locationId,
        'patientQueueId': data.patientQueueId,
        'patientStatusId': 'QS-PE',
        'lastModifiedOn' : data.lastModifiedOn && ["QS-PE", "QS-FL", "QS-NR", "QS-CO"].includes("QS-PE") ? data.lastModifiedOn : this.lastModifiedOn,
        'consultantId': consultantId
      }
    ];

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Test Location', message: msg,
        buttonText: { ok: 'Yes', cancel: 'No' },
        'updatePatientDetails': updatePatientDetails, 'isRemark': 1, 'patientLocation': true,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.refresh();
        this.isCheckEnableDropdown = false;
        if (this.pendingInfo && this.patientInfo[0].healthTestId === null) {
          this.isEnableDropdown = true;
        } else {
          this.isEnableDropdown = false;
        }
        this.isEnableButton = true;
        this.isEnableStatusDropdown = false;
        this.isEditStatusTesttype = data.healthTestId;
        this.isEditStatusTestId = data.testType;
      }
    });

  }

  checkDiabetic(isDiabetic, data) {
    this.isDisableDiabetic = true;
    let diabeticPatient = '';
    if (isDiabetic.checked === true) {
      diabeticPatient = ' ';
    } else {
      diabeticPatient = ' non - ';
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Patient Diabetic', message: 'Do you want to mark the patient as' + diabeticPatient + ' diabetic?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'patientId': data.patientId, 'isRemark': 1, 'diabetic': true, 'isDiabetic': isDiabetic.checked,
        'healthPlanId': data.healthPlanId, 'patientVisitId': data.patientVisitId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refresh();
    });
  }

  isMobile(useMobile, data) {

    this.isDisableUseMobile = true;

    let usingMobile = '';
    let isComment = 0;
    if (useMobile.checked === true) {
      usingMobile = 'Reason for not preferring Mobile';

    } else {
      usingMobile = 'Is patient willing to use Ask Apollo (Mobile)';
      isComment = 1;
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Patient using Mobile', message: usingMobile,
        buttonText: { ok: 'Yes', cancel: 'No' },
        'patientId': data.patientId, 'isRemark': isComment, 'mobile': true, 'useMobile': useMobile.checked

      }
    });
    dialogRef.afterClosed().subscribe(result => {
        this.refresh();
    });
  }


  toCheckin(id) {
    const status = { 'statusId': 'QS-IP', 'locationId': '' };
    this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
      this.refresh();
    });
  }
  toCheckout(id) {
    const status = { 'statusId': 'QS-CO', 'locationId': '' };
    this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
      this.refresh();
    });

  }

  toCheckoutStatus(patientQueueId, locationId) {
    const status = { 'patientStatusId': 'QS-WT', 'locationId': locationId, 'patientQueueId': patientQueueId };
    this.updatePatientTest(status);
  }

  refresh() {
    if (this.selectedTab === 1) {
      this.selectedTabIndex = 1;
    } else {
      this.selectedTab = 0;
      this.selectedTabIndex = 0;
    }
    this.isEditReviewDateTestId = null;
    this.enableReviewDate = false;
    this.isEnableStatusDropdown = false;
    this.isEditStatusTesttype = this.patientInfo[0].healthTestId;
    this.isEditStatusTestId = this.patientInfo[0].testType;
    this.isCheckEnableDropdown = true;
    if (this.pendingInfo && this.patientInfo[0].healthTestId === null) {
      this.isEnableDropdown = true;
    } else {
      this.isEnableDropdown = false;
    }
    this.isEnableButton = true;
    this.isEnableMsg = true;
    this.getPatientDetails(this.selectedPatientId, this.selectedPatinetVisitId, this.visitTypeId, this.visitEventId);
  }
    fixClick() {
    console.log('')
  }
}


export interface PatientList {
  id: string;
  name: string;
}
