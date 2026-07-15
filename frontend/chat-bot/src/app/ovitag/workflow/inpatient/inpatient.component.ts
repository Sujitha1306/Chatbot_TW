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
 import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  FormGroup,
  FormBuilder,
  FormControl,
} from "@angular/forms";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { PatientInfoComponent } from "../../../shared/modules/entry-component/patient/patient.component";
import {
  CoasterComponent,
  EnrollRegisterPatientComponent,
} from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { routerTransition } from "../../../router.animations";
import { CommonService, ConfigurationService, WorkflowService } from "../../../shared";
import { PorterRequestHistoryComponent, PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
import { WorkflowManagementComponent } from "../../../shared/modules/entry-component/workflow-management/workflow-management.component";
import { ActivatedRoute } from "@angular/router";
import { Subject, Subscription } from "rxjs";
import { environment } from "../../../../environments/environment";
import { DatePipe } from "@angular/common";
import { MatTabGroup } from "@angular/material/tabs";
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../../../app.module';
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { EntityRoutineActivityComponent } from "../../../shared/modules/entry-component/entity-routine-activity/entity-routine-activity.component";
import { debounceTime } from "rxjs/operators";
import { AppToastService } from "../../../shared/services/toaster.service";
import { NotificationAlertPopupComponent } from '../../../shared/modules/entry-component/notification-alert-popup/notification-alert-popup.component';

@Component({
  selector: "app-inpatient",
  templateUrl: "./inpatient.component.html",
  styleUrls: ["./inpatient.component.scss"],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  animations: [routerTransition()],
})
export class InpatientComponent implements OnInit, OnDestroy, AfterViewInit {
  public matcher = new ErrorStateMatcherService();
  displayedColumns: string[] = [];
  PRDisplayedColumns: string[] = ["ID","Requester","Description","Type", "Patient Name","Bed Name","Gender","Needed","Group","Time",	"Pickup",	"Drop",	"Porter", "Count", "Status", "Priority", "Remarks", "Assigned Time", "Drop Time", 'Manual Complete', "Location"];
  iconColumnPR = ["ID","Requester","Gender","Time","Location","Status","Assigned Time","Drop Time","Description","Pickup","Drop","Remarks","Priority"];
  iconHeader = ["ID", "Device", "Gender"];
  PRDTimeColumns = ["Time","Drop Time"]
  PRDDateTimeColumns = ["Assigned Time"]
  iconColumn = [];
  sortColumn = ["ID"];
  permissionControl = ["BT_ALLE"];
  eventColumn = ["Device", "Porter", "Task", "Status"];
  RDDisplayedColumns: string[] = ['Ack','Package','Patient Name' ,'Location','Status','Remarks','Order Time','Delivered Time','Ack Time','Category'];
  rdLocList: any=[];
  RDdateTimeColumns =['Order Time','Delivered Time','Ack Time'];
  public selectedName: any = null;
  public rowData: any = [];
  public activate_btn: any = [];
  public review = false;
  public inPatientInfo: any;
  public infiniteScrollIPInfo: any;
  public cols: any = 4;
  public selectedView = "table";
  public applyFilterValue = null;
  public isAutoRefresh = false;
  public isCheck = false;
  public checkPatientId = null;
  public userInput = null;
  Routine = [
    { value: "test - 01" },
    { value: "test - 02" },
    { value: "test - 03" },
    { value: "test - 04" },
    { value: "test - 05" },
  ];
  showAction1 = [];
  showAction2 = [];
  public showActions3 = [{ id: 'modify', value: 'modify' }];
  filterForm = new FormGroup({
    status: new FormControl(),
    fromDate: new FormControl(),
    toDate: new FormControl(),
    rdLocation: new FormControl(),
    rdStatus: new FormControl(),
  });
  today = new Date();
  public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  public selectDropdown = null;
  public rowFilter: any = [];
  public name = null;
  public locationId = null;
  public worklistForm: FormGroup;
  public user = null;
  public showActions = [];
  tableData: any = [];
  height: number;
  public selectFilter = [{ id: "ward", value: "WARD" }];
  public selectedRowData;
  public subscription: Subscription;
  patientInterval: any;
  volume: any;
  alertPatientId: any = [];
  public facilityId = null;
  audioList: any = [];
  selectedTabIndex = 0;
  public current_Location = false;
  porterDetails: any;
  loading = false;
  responseColumns: any=[];
  public pageStart = 0;
  public pageSize: any;
  public length = 0;
  public ipView = null;
  public porterConfig = null;
  public enableMultiView = true;
  public headerEventData: any;
  temp: any = [];
  count: any = [];
  public requestStatus: any[] = [];
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;
  
  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public commonService: CommonService,
    private readonly route: ActivatedRoute,
    public datepipe: DatePipe, public toastr: AppToastService, 
    private readonly configurationServices: ConfigurationService
  ) {
    this.commonService.getUserPreference(localStorage.getItem(btoa('userId')), localStorage.getItem('userlevel'))
    this.getCardType()
    this.getDynamicTableColumn();
    this.searchLoc("ward");
    this.commonService.validateUserPreference('IPWardFilter');
    this.activate_btn = this.commonService.getActivePermission("button");
    this.getPermissionDropDown();
  }

  ngOnInit() {
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    this.getRequestStatus();
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
        this.TabChange(event);
      }); 
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
      if (msg.length) {
        msg = msg[0];
        this.alertBinding(msg);
      }
    });
  }
  getRequestStatus() {
    this.commonService.getAppTerms("RequestStatus").subscribe((res) => {
      this.requestStatus = res.results;
    });
  }
  getCardType() {
    this.commonService.getConfigFile('ip-view').subscribe(res => {
      if(res.statusCode == 1) {
        this.ipView = res.results['contentObject'];
        this.selectedView = this.ipView['view'];
        if(this.ipView['type'] == 'location') {
          this.enableMultiView = false;
          this.countAlert();
        }
      }
    });
    this.commonService.getConfigFile('porter-config').subscribe(res => {
      if(res.statusCode == 1) {
        this.porterConfig = res.results['contentObject'];
      }
    });
  }
  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission.dropdown;
    const createAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTIP" && x.checkUrl === true);
    for (const action of createAction) {
      this.showAction1.push({ id: action.code, value: action.name });
    }
    const modifyAction = dropdown.filter(x => x.page === "workflow" && x.parentCode === "MN_OTIP" && x.checkUrl === false);
    for (const action of modifyAction) {
      this.showAction2.push({ id: action.code, value: action.name });
    }
    this.showActions = this.showAction1;
  }
  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('ip').subscribe((res) => {
      const dynamicColumns = res.results.contentObject;
      this.displayedColumns = dynamicColumns.displayedColumns;
      this.iconColumn = dynamicColumns.iconColumn;
      this.responseColumns = dynamicColumns.columns;
      if(dynamicColumns.pageSize && dynamicColumns.pageSize !== null) {
        this.pageSize = dynamicColumns.pageSize;
      } else {
        this.pageSize = 50;
      }
      if (this.commonService.userPreference?.hasOwnProperty('IPWardFilter')) {
       this.setPreferenceBasedWardFilter();
      } else {
        this.getSpecialityLoc()
      }
    });
  }

   ngAfterViewInit() {
    let label = 'Patient List';
    const tabNames = this.tabGroup._tabs.toArray();
    const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
    if (index >= 0) {
      this.selectedIndex = index;
      this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
    }
  }

  getSpecialityLoc() {
    this.commonService.getSpecialityLoc("CS-IP", null).subscribe((res) => {
      this.rowFilter = res.results;
      this.locationId = this.ipView != null && this.ipView['type'] == 'location' && this.rowFilter.length ? this.rowFilter[0].id : 'All'; //this.rowFilter[0].id
      if(!(this.ipView != null && this.ipView['type'] == 'location' && this.rowFilter.length == 0)) {
      this.getInpatientList(this.name, this.locationId, true, this.pageStart, this.pageSize);
      }
      this.countAlert()
    });
  }

  setPreferenceBasedWardFilter() {
    if (this.commonService.userPreference.IPWardFilter.value !== null && this.commonService.userPreference.IPWardFilter.value !== 'All') {
      this.locationId = parseInt(this.commonService.userPreference.IPWardFilter.value);
      if(!(this.ipView != null && this.ipView['type'] == 'location' && this.rowFilter.length == 0)) {
      this.getInpatientList(this.name, this.locationId, false, this.pageStart, this.pageSize);
      } else if (this.ipView != null && this.ipView['type'] == 'location' && this.locationId) {
        this.getInpatientList(this.name, this.locationId, false, this.pageStart, this.pageSize);
        this.countAlert()
      }
    } else if(this.commonService.userPreference.IPWardFilter.value === 'All') {
      this.locationId = this.commonService.userPreference.IPWardFilter.value;
      if(!(this.ipView != null && this.ipView['type'] == 'location' && this.rowFilter.length == 0)) {
      this.getInpatientList(this.name, this.locationId, true, this.pageStart, this.pageSize); 
      }
    }
  }

  alertBinding(msg) {
    if(msg['ctx'] != 'Alert' && msg['ctx'] != "PatientVisit"){
      return;
    }
      
    if (this.tableData.length) {
      let index = -1;
      index = this.getIndex(this.tableData, msg);
      if (index > -1) {
        this.setTableBasedSoundAlert(msg, index);
      } else {
        this.refreshPage()
      }
    }

    if (this.infiniteScrollIPInfo.length) {
      let index = -1;
      index = this.getIndex(this.infiniteScrollIPInfo, msg);
      if (index > -1) {
        this.setScrollBasedSoundAlert(msg, index);
      }
    }
  }

  getIndex(tableData, msg) {
    const alertPatientDetail = msg['data'][0]['identifyingType'] === 'Patient' ? msg['data'][0]['identifyingId'] : null
    if (alertPatientDetail != undefined && alertPatientDetail) {
      const index = tableData.findIndex(
        (val) => val.patientId == alertPatientDetail
      );
      return index;
    } else {
      const index = tableData.findIndex(
        (val) => val.tagId === msg['data'][0]['tagId']
      );
      return index;
    }
  }

  setTableBasedSoundAlert(msg, index) {
  const notifyType = msg['data'][0]['IotAlertDetail'].filter(
      (val) => val.identifyingType === 'Event'
    );
    let key = 'alerts';
    if (notifyType.length) {
      key = 'events';
    }
    const alertIndex = this.tableData[index]['alerts'].findIndex(
      (val) => val.iotAlertId === msg['data'][0]['id']
    );
    if (alertIndex === -1) {
      this.unShiftAlerts(msg, index, key, notifyType, this.tableData);
    } else if (msg['operation'] === 'close') {
      this.tableData[index]['alerts'].splice(alertIndex, 1);
      const patient = msg['data'][0]['IotAlertDetail'].filter(
        (val) => val.identifyingType === 'Patient'
      );
      if(patient !== undefined && patient.length) {
        this.stopAudioAction(parseInt(patient[0]['identifyingValue']), notifyType[0]['identifyingValue']);
      }
    }
    this.countAlert();
  }

  unShiftAlerts(msg, index, key, notifyType, dataDetails) {
    if (msg['operation'] !== 'close') {
      if (key === 'alerts') {
        dataDetails[index]['alerts'].unshift({
          alertCode: msg['data'][0]['ruleTypeId'],
          alertName: msg['data'][0]['pfRuleName'],
          eventCode: null,
          eventName: null,
          iotAlertId: msg['data'][0]['id'],
          message: msg['data'][0]['message'],
        });
      } else {
        let checkPreAlertFilter = dataDetails[index]['alerts'].filter(val => val.eventCode == notifyType[0]['identifyingValue'])
        if(checkPreAlertFilter.length && this.ipView != null && this.ipView.type == 'location') {
          return
        } 
        dataDetails[index]['alerts'].unshift({
          alertCode: null,
          alertName: null,
          eventCode: notifyType[0]['identifyingValue'],
          eventName: msg['data'][0]['pfRuleName'],
          iotAlertId: msg['data'][0]['id'],
          message: msg['data'][0]['message'],
        });
        if (msg['data'][0].IotAlertDetail) {
          this.setTableIotAlertDetails(msg);
        }
      }
    }
  }

  setScrollBasedSoundAlert(msg, index) {
    const notifyType = msg['data'][0]['IotAlertDetail'].filter(
      (val) => val.identifyingType === 'Event'
    );
    let key = 'alerts';
    if (notifyType.length) {
      key = 'events';
    }
    const alertIndex = this.infiniteScrollIPInfo[index]['alerts'].findIndex(
      (val) => val.iotAlertId === msg['data'][0]['id']
    );
    if (alertIndex === -1) {
      this.unShiftAlerts(msg, index, key, notifyType, this.infiniteScrollIPInfo);
    } else if (msg['operation'] === 'close') {
        this.infiniteScrollIPInfo[index]['alerts'].splice(alertIndex, 1);
        const patient = msg['data'][0]['IotAlertDetail'].filter(
          (val) => val.identifyingType === 'Patient'
        );
        if(patient !== undefined && patient.length) {
          this.stopAudioAction(parseInt(patient[0]['identifyingValue']), notifyType[0]['identifyingValue']);
        }
      }
      this.countAlert();
  }
  
  setTableIotAlertDetails(msg) {
    for (let alert of msg['data'][0].IotAlertDetail) {
      if (alert.identifyingType === "Event" &&
        alert.identifyingValue !== null &&
        (alert.identifyingValue === 'CE-SO' ||
        alert.identifyingValue === 'CE-AD'  ||
        alert.identifyingValue === 'CE-CL' 
        )) {
          if(this.ipView == null || (this.ipView?.type === 'location' && (alert.identifyingValue === 'CE-CL' || alert.identifyingValue === 'CE-SO' ))) {
          const patient = msg['data'][0]['IotAlertDetail'].filter(
            (val) => val.identifyingType === 'Patient'
          );
          this.setPatientAlertId(patient);
          if(msg['data'][0]['pfAlertConfigId']) {
            const audioList = this.audioList.filter(x => x.event === alert.identifyingValue);
            this.setAudioForAlert(audioList, msg, patient, alert);
          }
        }
      }
    }
  }

  setPatientAlertId(patient) {
    if(patient?.length > 0) {
      this.alertPatientId = this.alertPatientId.filter(x => patient[0]['identifyingValue'].indexOf(x) === -1);
      this.alertPatientId.unshift(parseInt(patient[0]['identifyingValue']));
    }
  }

  setScrollIotAlertDetails(msg) {
    for (let alert of msg['data'][0].IotAlertDetail) {
      if (alert.identifyingType === "Event" &&
        alert.identifyingValue !== null &&
        (alert.identifyingValue === 'CE-SO' ||
        alert.identifyingValue === 'CE-AD'  ||
        alert.identifyingValue === 'CE-CL' 
        )) {
          if(this.ipView == null || (this.ipView?.type === 'location' && (alert.identifyingValue === 'CE-CL' || alert.identifyingValue === 'CE-SO' ))) {
          const patient = msg['data'][0]['IotAlertDetail'].filter(
            (val) => val.identifyingType === 'Patient'
          );
          this.setPatientAlertId(patient);
          if(msg['data'][0]['pfAlertConfigId']) {
            const audioList = this.audioList.filter(x => x.event === alert.identifyingValue);
            this.setAudioForAlert(audioList, msg, patient, alert);
          }
        }
      }
    }
  }

  setAudioForAlert(audioList, msg, patient, alert) {
    if(audioList.length === 0) {
      this.configurationServices.getAllAlertsById(msg['data'][0]['pfAlertConfigId'], this.facilityId).subscribe(res => {
        const data = res.results[0];
        if(data.length !== 0) {
          for (let cond of data.alertConditions) {
            if (cond.identifyingType === 'aid_event' &&
              cond.identifyingValue !== null) {
              const audio = JSON.parse(cond.identifyingValue);
              this.setLoopAudioDetails(audio, patient, alert);
            }
          }
        }
      });
    } else {
      this.setAudioDetails(audioList, patient, alert);
    }
  }

  setAudioDetails(audioList, patient, alert) {
    const patientId = audioList.filter(x => x.patientId === (parseInt(patient[0]['identifyingValue'])));
    if(alert.identifyingValue === audioList[0].event && patientId.length === 0) {
      this.audioList.push({
        "patientId": parseInt(patient[0]['identifyingValue']),
        "event": audioList[0].event,
        "audio_file": audioList[0].audio_file,
        "audio_volume": audioList[0].audio_volume,
        "audio_loop": audioList[0].audio_loop,
      });
    }
    this.playAudio();
  }

  setLoopAudioDetails(audio, patient, alert) {
    for (let audios of audio) {
      if(alert.identifyingValue === audios.event_name) {
        this.audioList.push({
          "patientId": parseInt(patient[0]['identifyingValue']),
          "event":  audios.event_name,
          "audio_file": audios.audio_file,
          "audio_volume": audios.audio_volume,
          "audio_loop": audios.audio_loop,
        });
        this.playAudio();
      }               
    }
  }

  countAlert(){
    if(this.ipView && this.ipView.type === 'location' && (this.rowFilter.length != 0 || this.locationId)) {
      this.commonService.getAlertCount(this.locationId).subscribe(res => {
        let data = res.results
        if(data.length) {
          this.count = data;
        } else {
          this.count = [
            { "code": "RQ-CR", "name": "Assigned", "count": 0 },
            { "code": "RQ-CA", "name": "Cancelled", "count": 0 },
            { "code": "RQ-CO", "name": "Completed", "count": 0 }
          ];
        }
        
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    clearInterval(this.patientInterval);
    this.commonService.stopAudio();
  }

  menuOver(event){
    if(event === true){
      this.ngOnDestroy();
    } else {
      this.checkInterval();
    }
  }

  onWindowResizedCol(size) {
    this.cols = size;
  }

  onWindowResized(size) {
    this.height = size;
  }



  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.selectedView === "card" || this.selectedView === "new card" || this.applyFilterValue.length > 2) {
      this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
    }
    if (this.selectedView === "table") {
      if(this.selectedTab != 'Pharmacy Tasks' || this.applyFilterValue.length == 0 ) {
        this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
      }
    }
  }

  refreshPage() {
    this.selectedName = null;
    this.applyFilterValue = null;
    this.name = null;
    this.checkPatientId = null;
    this.isCheck = false;
    this.selectDropdown = null;
    this.showActions = this.showAction1;
    this.loading = true;
    if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('IPWardFilter')) {
      if (this.commonService.userPreference.IPWardFilter.value !== 'All') {
        this.locationId = parseInt(this.commonService.userPreference.IPWardFilter.value);
      } else {
        this.locationId = this.commonService.userPreference.IPWardFilter.value;
      }
    }
    this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
    this.countAlert();
  }
  rowClick(data) {
    if (
      this.selectedName &&
      data.patientVisitId == this.selectedName.patientVisitId
    ) {
      this.checkPatientId = null;
      this.isCheck = false;
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.checkPatientId = data.patientVisitId;
      this.isCheck = true;
      this.selectedName = data;
      if(this.selectedTab === 'Patient List') {
        this.showActions = this.showAction2;
      } else {
        this.showActions = this.showActions3;
      }
    }
  }
  searchLoc(id) {
    if (id === "ward") {
      this.commonService.getSpecialityLoc("CS-IP", null).subscribe((res) => {
        this.rowFilter = res.results;
      });
    }
  }
  manageWorklist(locId) {
    this.applyFilterValue = null;
    this.locationId = locId;
    this.getInpatientList(this.name, this.locationId, false, this.pageStart, this.pageSize);
    this.countAlert()
  }
  getNewPorter(value, data) {
    let d1 = new Date();
    let utcTimeNow = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds()).getTime()/ 1000;
    let scheduleCheck = true;
    if(this.porterConfig?.hasOwnProperty('createPorterTiming')) {
      let startTime = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.porterConfig['createPorterTiming']['from'].split(":")[0]), parseInt(this.porterConfig['createPorterTiming']['from'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
      let endTime =  new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), parseInt(this.porterConfig['createPorterTiming']['to'].split(":")[0]), parseInt(this.porterConfig['createPorterTiming']['to'].split(":")[1]), d1.getUTCSeconds()).getTime()/ 1000;
      scheduleCheck = utcTimeNow - startTime > 0 && endTime - utcTimeNow > 0;
    }
    if(scheduleCheck || typeof(data) == 'object') {
    clearInterval(this.patientInterval);
    if ((value === "Porter" || value === "DD_IPPR" || value === "DD_IPMDPR") && data !== true) {
      this.selectDropdown = null;
      if (data.porterRequestId === null) {
        let sourceBedId = data.bedId;
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: { type: "PR-PA", id: data.patientId, name: data.patientName, sourceBedId : sourceBedId, patientVisitStatus : data.visitStatusId},
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.selectDropdown = null;
          this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
        });
      } else if(data.porterRequestId && data.porterRequestId !== null) {
        this.workflowService.getPorterRequest(data.porterRequestId).subscribe((res) => {
          if(res.results.length !== 0) {
            const porterData = res.results[0];
            const dialogRef = this.dialog.open(PorterRequestNewComponent, {
              data: porterData,
              panelClass: ['medium-popup'],
              disableClose: true,
            });
            dialogRef.afterClosed().subscribe((result) => {
              this.selectDropdown = null;
              this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
            });
          }
        });
      }
    } else if ((value === "Porter" || value === "DD_IPPR" || value === "DD_IPMDPR") && data === true) {
      this.showActions = null;
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: '',
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
      });
    }
    } else {
      this.toastr.warning('<span style=\'font-family:Open Sans;font-size:16px;\'>' + `${this.porterConfig['createPorterTiming']['error']}` + '</span>');
    }
  }
  manageAction(value, data) {
    clearInterval(this.patientInterval);
    if (value === "DD_IPPR" || value === "DD_IPMDPR") {
      this.getNewPorter(value, data);
    } else if (value === "DD_IPEN") {
      this.selectDropdown = "DD_IPEN";
      const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
        data: { id: data.id, workflowTypeId: "WF-IP", visitType: "VT-IP" },
        panelClass: ["small-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        if (!data.id) {
          this.selectedName = null;
        }
        if(result) {
          this.refreshPage();
        } else {
          this.selectDropdown = null;
          this.refreshPage();
        }
      });
    } else if (value === "patientVisit") {
      this.selectedRowData = data;
      this.patientInfo(data)
    }else if (value === "DD_IPENOT") {
      this.selectedRowData = data;
      this.registerPatient(data.patientVisitId, "VE-OT", data.uhid);
    } else if (value === "DD_IPCT") {
      this.selectedRowData = data;
      this.createTask(data);
    } else {
      data["tabType"] = "Patient";
      this.selectDropdown = "routine";
      data["entityType"] = 'Patient';
      data["entityId"] = data.patientId;
      data["titleName"]= "Inpatient Routine"
      const dialogRef = this.dialog.open(EntityRoutineActivityComponent, {
        data: data,
        panelClass: ["medium-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
      });
    }
  }
  onCheck(data) {
    this.selectDropdown = null;
    if (data.patientVisitId !== this.checkPatientId) {
      this.checkPatientId = data.patientVisitId;
      this.isCheck = true;
      this.selectedName = data;
    } else {
      this.checkPatientId = null;
      this.isCheck = false;
      this.selectedName = null;
      this.selectDropdown = null;
    }
  }
  checkUser(value) {
    if (value !== "") {
      this.user = value;
    } else {
      this.user = null;
    }
  }
  addUser() {
    this.Routine.push({ value: this.user });
    this.user = null;
    this.userInput = null;
  }
  headerEventAction(event) {
    if(this.selectedView == 'table' && this.selectedTab == 'Nurse Call'){
      this.headerEventData = event;
    } else {
      const data = event;
      if (event.key === "applyFilter") {
        this.applyFilter(event.data);
      } else if (event.key === "manageWorklist") {
        this.manageWorklist(event.data);
      } else if (event.key === "DD_IPEN") {
        this.registerPatient(event.data);
      } else if (event.key === "manageAction") {
        this.manageEventAction(data);
      } else if (event.key === "manageView") {
        this.applyFilterValue = null;
        this.getInpatientList(this.name, this.locationId, false, this.pageStart, this.pageSize);
      } else if (event.key === "manageFilter") {
        this.searchLoc(event.data);
      } else if (event.key === 'dateFilter') {
        this.loading = true;
        this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
        this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
      } else {
        this.locationId = null;
        this.selectedName = null;
        this.refreshPage();
      }
    }
  }
  manageEventAction(event) {
    if (event.data === 'modify' && event.keyVal.type === 'RQT-PO') {
      this.getNewPorter('Porter', event.keyVal);
    } else {
      this.manageAction(event.data, event.keyVal);
    }
  }
  selectedViewAction(key) {
    if (key !== null) {
      this.selectedView = key;
      this.playAudio();
    }
  }
  playAudio() {
    if (this.selectedView !== 'table') {
      for(const audio of this.audioList) {
        this.commonService.playAudioCode(audio.audio_file, audio.audio_volume, audio.audio_loop);
      }
    } else {
      this.commonService.stopAudio();
    }
  }
  eventAction(event) {
    if (event.key === "Patient Name") {
      this.registerPatient(event.data.patientVisitId, null, event.data.uhid);
    } else if (event.key === "nurse-call" || event.key === "fall-risk") {
      if (event.data && (event.data.eventCode === 'CE-PC' || event.data.alertCode === 'RU-GO')) {
        const patientDetails = this.infiniteScrollIPInfo?.find((p: any) =>
          p.patientId === event.patientId || p.id === event.patientId
        ) || event.data;
        const alertObj = {
          id: event.data.iotAlertId,
          configName: event.data.eventName || 'Patient Care',
          message: event.data.message || 'Patient Care Alert',
          sentDatetime: event.data.message?.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s(?:AM|PM)/)?.[0],
          alertTypeId: 'AT-AL',
          ruleTypeId: 'CE-PC',
          identifyingType: 'Patient',
          identifyingId: patientDetails?.patientId || event.patientId,
          alertDetails: [
            { identifyingType: 'Location', identifyingValue: patientDetails?.locationId || patientDetails?.wardId },
            { identifyingType: 'Tag', identifyingValue: patientDetails?.tagId },
            { identifyingType: 'Patient', identifyingValue: patientDetails?.patientId, identifyingValueName: patientDetails?.patientName }
          ]
        };
        clearInterval(this.patientInterval);
        const dialogRef = this.dialog.open(NotificationAlertPopupComponent, {
          data: {
            selectedAlert: alertObj,
            allAlerts: [],
            ruleFilterList: [],
            hideCamera: true,
            hideSidebar: true,
            patientDetails: patientDetails
          },
          panelClass: ['medium-popup'],
          disableClose: true
        });
        dialogRef.afterClosed().subscribe(() => { this.refreshPage(); });
      } else {
        this.cancelAlert(event.data, event.key, event.patientId);
      }
    } else if (event.key === "Task") {
      this.manageAction("DD_IPMR", event.data)
    } else if (event.key === "Record ID") {
      this.manageMRCoster(event.data);
    } else if (event.key === "Device") {
      this.manageCoster(event.data);
    } else if (event.key === "Porter") {
      this.getNewPorter('Porter', event.data);
    } else if(event.key == 'Location') {
      this.currentLocation(event.data);
      this.getPorterFloorPlan(event.data);
    } else if(event.key == 'Status') {
      this.manageEventStatus(event);
    } else if (event.key === 'Requester') {
      clearInterval(this.patientInterval);
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: event.data,
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage();
      });
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, event.data.pageSize);
    } else if (event.key === 'refresh') {
      this.locationId = null;
      this.selectedName = null;
      this.refreshPage();
    } else if(event.key == 'viewHistory'){
      this.porterLocationHistory(event.data);
    }  else if(event.key == 'rdAck'){
      this.requestDetailAck(event.data);
    } else {
      this.patientInfo(event.data);
    }
  }
  manageEventStatus(event) {
    if(this.selectedTab === 'Patient List') {
      this.patientInfo(event.data);
    } else {
      this.getPorterHistory(event.data);
    }
  }
  porterLocationHistory(data){
    const formData = data;
    data['content'] = 'history'
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    }); dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }
  getPorterHistory(data) {
    clearInterval(this.patientInterval);
    const dialogRef = this.dialog.open(PorterRequestHistoryComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }
  requestDetailAck(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true, height : "330px",width : "600px",
      data: {
        title: "Send Acknowledgement", 
        message: "The package " + (data.comments ? "("+ data.comments +")" : "") + " has been acknowledged as arrived at " + data.perfLocFullName,
        customMsg : true,
        buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0, pharmacyAck: true,
        isPartiallyCompleted : data.hasOwnProperty('isPartiallyCompleted')?data['isPartiallyCompleted']:null,
        acknowledgedComments : data.hasOwnProperty('acknowledgedComments')?data['acknowledgedComments']:null,
        ackUser: data.hasOwnProperty('comments')?data['comments']:null,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result['confirmButtonText'] == 'Yes'){
        let postData = [{
          "acknowledgedComments" : result['acknowledgedComments'],
          "isPartiallyCompleted" : result['isPartiallyCompleted'],
          "comments" : result['userName'],
          "requestDetailId" : data.id
        }]
        this.commonService.reqDetailAck(postData).subscribe(res => {
          if(res.statusCode == 1) {
            this.refreshPage();
          }
        })
      }
    });
  }
  onLocationChange(value) {
    this.loading = true;
    if (this.selectedTab === 'Pharmacy Tasks') {
      this.getInpatientList(this.applyFilterValue, value, false, this.pageStart, this.pageSize);
    }
  }
  getPorterFloorPlan(data){
    clearInterval(this.patientInterval);
    const reqDetail = data;
    const reqType = 'porter';
    const reqId = null;
    let details = {reqDetail: reqDetail, reqType: reqType, reqId: reqId}
    const dialogRef = this.dialog.open(CommonDialogComponent, {
    data: details,
    panelClass: ['medium-popup'],
    disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }

  currentLocation(data) {
    if (data === "close") {
      this.current_Location = false;
    } else {
      this.current_Location = true;
      if (data.hasOwnProperty("performer") && data.performer.length > 0) {
        this.porterDetails = {
          type: "porter",
          floorid: data.performer[0].floorId,
          requestId: data.porterRequestId,
          requestInfo: data,
        };
      }
    }
  }
  manageCoster(data) {
    clearInterval(this.patientInterval);
    data["workflowTypeId"] = "WF-IP";
    data["associationId"] = data.patientId;
    data["associationTypeId"] = "TAT-PA";
    data["associatedName"] = "Patient";
    data["tag_type_name"] = data.tagTypeName;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        this.refreshPage();
      }
    });
  }
  manageMRCoster(data) {
    clearInterval(this.patientInterval);
    data["assetTypeId"] = "AT-MR";
    data["workflowTypeId"] = "AT-MR";
    data["associationId"] = data.patientId;
    data["associationTypeId"] = "TAT-PA";
    data["associatedName"] = "Patient";
    data["tag_type_name"] = data.tagTypeName;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        this.refreshPage();
      }
    });
  }
  registerPatient(id, eType?: string, mainidentifer?) {
    clearInterval(this.patientInterval);
    const data = { id: id, visitType: "VT-IP" };
    if (eType === "VE-OT") {
      data["workflowTypeId"] = "WF-OT";
      data["visitEvent"] = "VE-OT";
      data["enrollOT"] = true;
      data["tagSerialNumber"] = this.selectedRowData.tagId;
      data["tagAssociationTypeId"] = this.selectedRowData.tagAssociationTypeId;
      data["mainidentifier"] = this.selectedRowData.uhid;
      data["tagTypeId"] = this.selectedRowData.tagTypeId;
      data["patientVisitId"] = this.selectedRowData.patientVisitId;
    } else {
      data["workflowTypeId"] = "WF-IP";
    }
    if(mainidentifer) {
      data['mainidentifer'] = mainidentifer
    }
    const dialogRef = this.dialog.open(EnrollRegisterPatientComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!id) {
        this.selectedName = null;
      }
      this.selectDropdown = null;
      this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
    });
  }

  createTask(data) {
    data["entityType"] = 'Patient';
    data["entityId"] = data.patientId;
    const dialogRef = this.dialog.open(WorkflowManagementComponent, {
      data: {'patientDetail' : data, 'permissionTab': ['Task','Easy Pick']},
      panelClass: ['large-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectDropdown = null;
      this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
    });
  }
  stopAudioAction(patientId, event) {
    if(event === 'card') {
      this.audioList = this.audioList.filter(x => x.patientId !== patientId);
      this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
      if(this.audioList.length === 0) {
        this.commonService.stopAudio();
      } else {
        this.playAudio();
      }
    } else {
      const audioList = this.audioList.filter(x => x.patientId === patientId && x.event === event);
      this.audioList = this.audioList.filter(x => x !== audioList[0]);
      if(this.audioList.length === 0) {
        this.commonService.stopAudio();
        this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
      } else {
        const audioList = this.audioList.filter(x => x.patientId === patientId);
        if(audioList.length === 0) {
          this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
        }
        this.playAudio();
      } 
    }
  }
  cancelAlert(data, type, patientId) {
    clearInterval(this.patientInterval);
    if (type === "fall-risk" && data.iotAlertId != null) {
      data["alertId"] = data.iotAlertId;
    }

    if (type === "nurse-call" && data.iotAlertId != null) {
      data["alertId"] = data.iotAlertId;
    }
    let title = "Cancel Notification"
    let ipView = null;
      title = "Alert Remarks"
      ipView = 'location'
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'],
      disableClose: true,
      data: {
        title: title,
        message: "",
        buttonText: { ok: "Ok", cancel: "Cancel" },
        alertDetails: data,
        cancelAlert: true,
        ipView : ipView
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        if(this.audioList.length !== 0 && patientId !== null) {
          this.stopAudioAction(patientId, data.eventCode);
        }
        this.refreshPage();
      }
    });
  }

  patientInfo(data) {
    clearInterval(this.patientInterval);
    data["type"] = "1";
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }

  scroll() {
    if (this.length <= this.infiniteScrollIPInfo.length) {
      return;
    }
    this.workflowService
    .getInpatientList(this.name, this.locationId, null, null, 0, this.infiniteScrollIPInfo.length + 50)
    .subscribe((res) => {
      this.infiniteScrollIPInfo = this.commonService.sortByKey(res.results,'patientName');
    });
  }

  checkInterval() {
    clearInterval(this.patientInterval);
    if(this.applyFilterValue != null || this.applyFilterValue != '') {
      this.patientInterval = setInterval(val => this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize), environment.base_value.set_interval);
    }
  }

  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
  }
  
  TabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.loading = true;
    this.tableData = [];
    this.selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');

    if (this.selectedTab === 'Nurse Call') {
      this.headerEventData = {"key":"dateFilter","data":this.selectedDate};
    }
    this.getInpatientList(this.applyFilterValue, this.locationId, false, this.pageStart, this.pageSize);
  }
  
  openedChange(isdropdownOpened){
    if(!isdropdownOpened){
      this.getInpatientList();
    }
  }
  getInpatientList(
    name?: string,
    locationId?: any,
    routerEvent?: boolean,
    pageStart?: number,
    pageSize?: number
  ): void {
    this.loading = true;
    this.checkInterval();
    this.selectedName = null;
    this.showActions = this.showAction1;
    if (locationId == null && routerEvent) {
      this.inPatientInfo = this.route.snapshot.data.IP.results;
      this.infiniteScrollIPInfo = this.commonService.sortByKey(this.inPatientInfo,'patientName');
      this.tableData = this.route.snapshot.data.IP.results;
      this.length = this.route.snapshot.data.IP.totalRecords;
      for (let i = 0; i <= this.responseColumns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[this.responseColumns[i]];
        });
      }
    } else {
      const view = this.selectedView;
      if (view != 'table' || (view == 'table' && this.selectedTab === 'Patient List')) {
        this.valueInitiated(name, locationId, pageStart, pageSize);
      } else if(this.selectedTab === 'My Porter Request'){
        this.getPorterRequest();
      } else if(this.selectedTab === 'Nurse Call'){
        this.loading = false;
      } else if(this.selectedTab === 'Pharmacy Tasks'){
        this.manageDatard(locationId);
      } else if(this.selectedTab === 'QR Request'){
         this.getPorterData();
      }
    } 
  }

  getPorterData() {
    this.commonService.getPorterRequest(this.selectedDate, null, null, null, 'RQT-PO', null, null, null, null, null, 'mobile_users').subscribe((res) => {
      this.tableData = res.results;
      this.loading = false;
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = [
        "ID", "userName", "comments", "requestCategoryName", "patientName", "bedName", "gender", "assetCategoryName", "poolNameValue", "requestTime", "sourceLocationName", "destinationLocationName",
        "porterNames", "porterCount", "statusName", "prioity", "remarks", "actualPickupTime", "actualDropTime", 'compManually', "Location"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.PRDisplayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  valueInitiated(name, locationId, pageStart, pageSize) {
    if (name === null || name === undefined) {
      name = "";
    }
    name = name.trim();
    if (locationId === null || locationId === "All") {
      locationId = "All";
    } else {
      locationId = this.locationId;
    }
    this.commonService.validateUserPreference('IPWardFilter', locationId);
    this.getIPList(name, locationId, pageStart, pageSize);
  }

  manageDatard(locationId) {
    let status = [];
      if(this.filterForm.get('rdStatus').value === null){
        this.filterForm.controls['rdStatus'].setValue(['RQ-CO']);
        this.filterForm.controls['rdStatus'].updateValueAndValidity();
      }
      this.filterForm.get('rdStatus').valueChanges.subscribe(statusValue=>{
        if(statusValue.includes(0)){
          status = null;
        }else{
          status = statusValue;
        }
      })
      let type = 'TAT-PA';
      if (this.filterForm.controls['rdStatus'].value !== null && 
        this.filterForm.controls['rdStatus'].value.length !== 0) {
          if(this.filterForm.controls['rdStatus'].value.includes(0) === true) {
            status = null;
          } else {
          status = this.filterForm.controls['rdStatus'].value;
          }
        }else{
          status=null;
        }
    
        if (this.filterForm.controls['rdLocation'].value !== 'All') {
          locationId = this.filterForm.controls['rdLocation'].value;
          this.filterForm.controls['rdLocation'].setValue(this.filterForm.controls['rdLocation'].value);
        } else {
          locationId = null;
          this.filterForm.controls['rdLocation'].setValue('All');
        }
        this.filterForm.controls['rdLocation'].updateValueAndValidity();
        let serviceGroupId = 'SG-PH';
      this.commonService.getRequestDetail(type, this.selectedDate, locationId, status,serviceGroupId,name,this.pageStart,this.pageSize).subscribe((res) => {
        this.length = res.totalRecords;
        this.loading = true;
        let result = res.results;
        this.tableData = res.results;
        if(locationId) {
          this.tableData = this.tableData.filter(val => val.performerId == locationId)
        }
        const Columns = ['acknowledgedByName','externalIdentifier', 'performerName','perfLocFullName', 'statusName','acknowledgedComments','externalTime','completedTime','acknowledgeTime','category'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.RDDisplayedColumns[i]] = data[Columns[i]];
            if (Columns[i] == 'isPartiallyCompleted') {
              data[this.RDDisplayedColumns[i]] = data[Columns[i]] === true ? 'Yes' : data[Columns[i]] === false ? 'No' : data[Columns[i]];
            }
          });
        }
        let performerList = [];
        let locations = [];
        result.forEach((item) => {
          if(!locations.includes(item.performerId)) {
            locations.push(item.performerId)
            performerList.push(item)
          }
        });
        this.rdLocList = this.commonService.sortByKey(performerList, 'perfLocFullName')
        this.loading = false;
      });
  }

  getIPList(name, locationId, pageStart, pageSize) {
    this.workflowService.getInpatientList(name, locationId, null, null, pageStart, pageSize).subscribe((res) => {
      this.length = res.totalRecords;
      if(res.results.length || !this.applyFilterValue) {
        this.tableData = res.results;
      }
      this.loading = false;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      for (let i = 0; i <= this.responseColumns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[this.responseColumns[i]];
          if(data['routineStatusName'] == null && data['nurseTaskStatusId']) {
            data['routineStatus'] =  data['nurseTaskStatusId'];
            data['routineStatusName'] =  data['nurseTaskStatusId'];
          }
        });
      }
      this.inPatientInfo = res.results;
      this.infiniteScrollIPInfo = this.commonService.sortByKey(res.results,'patientName');
      this.infiniteScrollIPInfo.forEach(element => {
        if(element.vitals !== null){
          this.temp = element.vitals.temperature *((9/5)) + 32 + ' °F'
        }
      });
    });
  }

  getPorterRequest() {
    this.commonService.getPorterRequest(this.selectedDate, true, null, null).subscribe((res) => {
      this.tableData = res.results;
      this.loading = false;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = [
        "ID","userName","comments","requestCategoryName", "patientName","bedName", "gender", "assetCategoryName", "poolNameValue", "requestTime","sourceLocationName","destinationLocationName",
        "porterNames","porterCount","statusName", "prioity","remarks","actualPickupTime","actualDropTime", 'compManually', "Location"];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.PRDisplayedColumns[i]] = data[Columns[i]];                         
        });
      }
    });
  }

  fixClick() {
    console.log('')
  }    
}

export interface PatientData {
  id: number;
  patientId: string;
  tagId: string;
  name: string;
  location: string;
  routineName: string;
  speciality: string;
  currentLocation: string;
  lengthOfStay: string;
  admittedDr: string;
  status: string;
}
