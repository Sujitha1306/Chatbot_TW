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
import { Component, OnInit, ViewEncapsulation, OnDestroy, Input} from '@angular/core';
import { DashboardService, HospitalService, CommonService, WorkflowService } from '../../../shared';
import { CookieService } from 'ngx-cookie-service';
import { FormControl } from '@angular/forms';
import { DigitalQueueModel, DigitalQueueModelCols, DigitalQueueModelRows, DigitalQueueModelId } from './worklist.model';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { MatDialog} from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { BehaviorSubject, Observable, Subject} from 'rxjs';
import { connect, MqttClient } from 'mqtt';
import { EnrollPatientComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { debounceTime } from 'rxjs/operators';
import { AppToastService } from '../../../shared/services/toaster.service';


@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  styleUrls: ['./worklist.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class WorklistComponent implements OnInit, OnDestroy {

  public locationList: any[] = [];
  public locationSearch: string = ""
  public selectedLocation = new FormControl();
  public gridCols: any;
  public waitingCols: any;
  public list_height: any;
  public isRefresh = false;
	@Input() matTabindex: any;
  @Input() enableCountClick = true;
  @Input() showEnrollPatient: boolean;
  @Input() changeLocation: any;
  private client : MqttClient;
  public digitalQueueModel: DigitalQueueModel;
  public digitalQueueModelCols: DigitalQueueModelCols;
  public digitalQueueModelRows: DigitalQueueModelRows;
  public digitalQueueModelId: DigitalQueueModelId;
  public inprogressDetail: Array<any> = [];
  public waitingDetail: Array<any> = [];
  public completedDetail: Array<any> = [];
  public interval: any;
  public patientInfo: any;
  public spinLoader: any;
  refreshDetail =  {
    'interval' : 30,
    'is_active' : true,
    'updateInterval' : 10,
    'lastUpdate' : null
  }
  refreshInterval: any = null;
  // public consultantCounters: any;
  public consultantCounters: Array<any> = [];
  public isEnableCounterLoc = false;
  public worklistCounters: any;
  public selectedQueue = [];
  public isParalelTest: any = false;
  public dqtowerconfig: any = [];
  dynamicConfig = false;
  // public worklistCounters: Array<any> = [];
  // public consultantCounters = [
  //   17785,
  //   17750,
  //   17946
  // ];
  // public worklistCounters = [
  //   {
  //     "id": 17785,
  //     "name": "ICU 4",
  //     "floorId": 17729,
  //     "floorName": "2nd Floor",
  //     "locationDesc": "",
  //     "isAvailable": true
  //   },
  //   {
  //     "id": 17750,
  //     "name": "Lab 5",
  //     "floorId": 17728,
  //     "floorName": "1st Floor",
  //     "locationDesc": "",
  //     "isAvailable": true
  //   },
  //   {
  //     "id": 17946,
  //     "name": "Counter 307",
  //     "floorId": 17939,
  //     "floorName": "Third Floor",
  //     "locationDesc": "",
  //     "isAvailable": true
  //   }
  // ];
  public obj = new BehaviorSubject<Object>('worklist-counters');
  locationListDisplay: any=[];
  pendingDetail: any=[];
  private readonly mqttSubject = new Subject<any>();
  floorId = [];
  public visitTypeIds = new FormControl([]);
  visitTypes = [];
  
  //for debounce 
  // formSub: Subscription;

  constructor(private readonly dashboardService: DashboardService, private readonly cookieService: CookieService, private readonly workflowService : WorkflowService,
    private readonly dialog: MatDialog, private readonly hospitalService: HospitalService, private readonly commonService: CommonService, public toastr: AppToastService) {


    this.digitalQueueModel = new DigitalQueueModel();
    this.digitalQueueModelCols = new DigitalQueueModelCols();
    this.digitalQueueModelRows = new DigitalQueueModelRows();
    this.digitalQueueModelId = new DigitalQueueModelId();
    if(localStorage.getItem(btoa('worklistCounters')) === null){
      this.commonService.getConfigFile('worklist-counters').subscribe(res => {
        if (res.results != null) {
          this.worklistCounters = res.results.contentObject;
          localStorage.setItem(btoa('worklistCounters'), JSON.stringify(res.results.contentObject));
          this.worklistCounter();
        }
      });
    }else{
        this.worklistCounters = JSON.parse(localStorage.getItem(btoa('worklistCounters')));
        this.worklistCounter();
      }
    this.getLocationsSummary();
  }
  onResizeWindowF(data) {
    const height = (data - 172) / 46;
    this.list_height = data - 250;
    this.digitalQueueModelRows.DQWL_IP = Math.round(height);
    this.digitalQueueModelRows.DQWL_WA = Math.round(height);
    this.digitalQueueModelRows.DQWL_CO = Math.round(height);
  }
  onResizeWindow(event) {
    const height = (event.target.innerHeight - 172) / 46;
    this.list_height = event.target.innerHeight - 250;
    // console.log(this.list_height)
    this.digitalQueueModelRows.DQWL_IP = Math.round(height);
    this.digitalQueueModelRows.DQWL_WA = Math.round(height);
    this.digitalQueueModelRows.DQWL_CO = Math.round(height);
  }
  ngOnInit() {
    this.commonService.getAppTermsVerion2('VisitType').subscribe(res => {
      this.visitTypes = res.results;
    });
    this.getInterval()
    this.mqttSubject.pipe(debounceTime(1000)).subscribe((val) => {
      this.getLocationsSummary()
    });
    // Description : Live env issues checking
    // Date : Nov 20, 2020

    // this.worklistCounter();
    
    if(localStorage.getItem(btoa('consultantCounters')) === null){
      this.commonService.getConfigFile('consultant_counters').subscribe(res => {
        if (res.statusCode === 1 && res.results != null) {
          this.consultantCounters = res.results.contentObject;
          localStorage.setItem(btoa('consultantCounters'), JSON.stringify(res.results.contentObject)); // Y29uc3VsdGFudENvdW50ZXJz
        }
      });
    }else{
      this.consultantCounters = JSON.parse(localStorage.getItem(btoa('consultantCounters')));
    }
    this.getdqtowerconfig();
    this.getMqtt()
    

    this.getLocations();
    this.onResizeWindowF(window.innerHeight);
    this.digitalQueueModelCols.DQWL_WA = 3;
    this.waitingCols = 2;
    if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
      this.gridCols = 5;
    } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
      this.gridCols = 5;
    } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
      this.gridCols = 4;
      this.digitalQueueModelCols.DQWL_WA = 2;
      this.waitingCols = 2;
    } else if (window.innerWidth <= 768) {
      this.digitalQueueModelCols.DQWL_WA = 1;
      this.gridCols = 1;
      this.waitingCols = 1;
    } else {
      this.gridCols = 5;
    }
    // debounce events
    // this.formSub = this.selectedLocation.valueChanges
    //   .debounceTime(700).subscribe(val => {
    //     this.getSelectionDetail(val);
    //   });
  }
   applyFilter(searchValue: string): void{
    this.locationSearch = searchValue;
    const filterValue = this.locationSearch.toLowerCase();
    this.locationList = this.locationListDisplay.filter(location =>
      location.name.toLowerCase().includes(filterValue) || location.floorName.includes(filterValue)
    );
  }
  getdqtowerconfig() {
    this.commonService.getConfigFile('dq-tower-config').subscribe(res => {
      if(res.statusCode) {
				this.dynamicConfig = true;
       this.dqtowerconfig = res.results.contentObject.healthcheck;
      }
    });
  }
  getMqtt() {
    if(this.client) {
        this.client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res=> {
      if (res.results != null && res.results.length) {
        let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
        let cloudConnect = {
            protocol        : brokerInfo[0]['wprotocol'],
            host            : brokerInfo[0]['host'],
            password        : brokerInfo[0]['password'],
            username        : brokerInfo[0]['username'],
            port            : brokerInfo[0]['wport'],
            connectTimeout  : 30000,
            keepalive       : 60
        }
        this.client = connect(cloudConnect);
        this.mqttSubcribe()
      } else {
        res.message = 'mqtt ' + res.message;
        this.toastr.warning('Warning', `${res.message}`);
      }
    })
  }
  mqttSubcribe() {
    let topic = 'tw/tag/queue/' + localStorage.getItem(btoa('facilityId')) + '/#';
    if(this.client) {
      console.log(topic)
      this.client.subscribe(topic);
      this.client.on('message', (topic, message) => {
        const msg = message.toString();
        const jsonData = JSON.parse(msg);
        console.log(jsonData)
        const locationIds = this.selectedLocation.value;
        if(locationIds.indexOf(jsonData['location_id']) != -1) {
          // this.getLocationsSummary()
          this.mqttSubject.next(); // send to RxJS stream
        }
      });
    }
  }
  onResize(event) {
    this.digitalQueueModelCols.DQWL_WA = 3;
    this.waitingCols = 2;
    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.gridCols = 5;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.gridCols = 5;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
      this.gridCols = 4;
      this.digitalQueueModelCols.DQWL_WA = 2;
      this.waitingCols = 2;
    } else if (event.target.innerWidth <= 768) {
      this.digitalQueueModelCols.DQWL_WA = 1;
      this.gridCols = 1;
      this.waitingCols = 1;
    } else {
      this.gridCols = 5;
    }
  }

  worklistCounter() {
    // this.commonService.getConfigFile('worklist-counters').subscribe(res => {
    //   if (res.results != null) {
        const data = this.worklistCounters;
        this.obj.next(data);
    //   }
    // });
  }
  getBehaviorworkListView(): Observable<any> {
    return this.obj.asObservable();
  }
  openedChangeFilter(isOpended) {
    if(!isOpended) {
      this.getLocationsSummary();
    }
  }
  getLocationsSummary() {
    this.floorId = [];
    if (this.selectedLocation.value?.length !== 0) {
      this.selectedLocation.value?.forEach(locationId => {
        const location = this.locationList?.filter(x => x.id === locationId);
        if (location?.length > 0 && !this.floorId.includes(location[0].floorId)) {
          this.floorId.push(location[0].floorId);
        }
      });
    }
    this.commonService.validateUserPreference('DQWorklistFloor',  JSON.stringify(this.floorId));
    let currentInterval = Math.floor(new Date().getTime())/1000 - this.refreshDetail.lastUpdate
    if(this.selectedLocation.value?.length !== 0 && (true || currentInterval > this.refreshDetail.updateInterval || this.refreshDetail.lastUpdate == null)) {
      this.spinLoader = true;
      if (this.commonService.userPreference?.hasOwnProperty('DQWorklistLocation')) {
        let locationIds = JSON.parse(this.commonService.userPreference.DQWorklistLocation.value);
        if (this.floorId?.length === 0 && this.commonService.userPreference?.hasOwnProperty('DQWorklistFloor')) {
          this.floorId = JSON.parse(this.commonService.userPreference.DQWorklistFloor.value);
        }
        this.dashboardService.getHpLocationDetailbyIds(locationIds, null, this.visitTypeIds?.value).subscribe(res => {
          if(res.statusCode === 1) {
            this.spinLoader = true;
            this.refreshDetail.lastUpdate = Math.floor((new Date().getTime())/1000);
            this.patientInfo = res.results;
            this.waitingDetail = res.results.Waiting;
            this.inprogressDetail = res.results.Inprogress;
            // this.completedDetail = res.results.Completed;
            this.pendingDetail = res.results.Pending;
            this.spinLoader = false;
            if (!res.results.hasOwnProperty('Waiting')) {
              this.waitingDetail = [];
            }
            this.spinLoader = false;
          }
        },
        error => {
          this.spinLoader = false;
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    }
  }
  private getLocations() {
    if (this.worklistCounters === undefined) {
      this.getBehaviorworkListView();
    }
    this.spinLoader = true;
    const category = {key: 'excludeCategoryId', value: 'TC-BILL'};
    this.dashboardService.getHealthPlanLocations(category).subscribe(res => {
      // if (res.results != null) {
      if (res.statusCode === 1 && res.results.length > 0) {
        this.locationListDisplay = res.results;
        this.locationList = this.locationListDisplay.slice();
        if (this.worklistCounters !== undefined) {
          this.locationList = this.locationList.concat(this.worklistCounters);
        } else {
          this.getBehaviorworkListView();
          // this.locationList = this.locationList.concat(this.worklistCounters);
        }
        this.spinLoader = false;
        if (this.commonService.userPreference?.hasOwnProperty('DQWorklistLocation')) {
          let locationIds = JSON.parse(this.commonService.userPreference.DQWorklistLocation.value);
          if (locationIds.length > 0) {
            this.selectedLocation.setValue(locationIds);
          }
        }
        if (this.commonService.userPreference?.hasOwnProperty('DQWorklistFloor')) {
          this.floorId = JSON.parse(this.commonService.userPreference.DQWorklistFloor.value);
          console.log(this.floorId)
        }
      }
    });
  }

  openedChange(isOpended)
  {
    if(!isOpended)
    {
      this.getSelectionDetail(this.selectedLocation.value);
    }
  }
  getSelectionDetail(data) {
    // console.log(data);
    if (data === null) {
      data = [];
    }
    this.waitingDetail = [];
    this.inprogressDetail = [];
    this.completedDetail = [];
    this.pendingDetail = [];
    if (data.length) {
      this.commonService.validateUserPreference('DQWorklistLocation',  JSON.stringify(data));
      setTimeout(() => {
        this.getLocationsSummary();
      }, 500);
    }

  }
  getParallel(event){
    if(event === true){
      this.selectedQueue = [];
      this.isParalelTest = false;
    }
  }  
  toCheckin(patient, locId, statusId) {
    if (this.consultantCounters.length > 0 && this.consultantCounters.find(x => x === locId)) {
      this.isEnableCounterLoc = true;
      const filterCounterLocDetails = this.waitingDetail.filter(rs => rs.testLocationId === locId);
      filterCounterLocDetails[0]['isEnableCounterLoc'] = this.isEnableCounterLoc;
      this.getPatientDetails(filterCounterLocDetails[0]);
    } else if(locId === null) {
      this.changeTestLocation('QS-IP', patient);
    } else {
      // const status = { 'statusId': 'QS-IP', 'locationId': '' }; # updated for parellel test issue in api
      const status = { 'statusId': statusId, 'locationId': locId };
      this.dashboardService.updatePatientQueueStatus(patient?.patientQueueId, status).subscribe(res => {
        this.getLocationsSummary();
      }, error =>  {
				this.toastr.warning('Warning', `${error.error.message}`);
        const info = JSON.parse(error.error.additionalInfo);
        if (error.error.errorCode === "TWAPI54") {
          this.changeExistingQueueStatus(info, patient, status);
        }
			});
    }
  }

  changeExistingQueueStatus(info, patient, payload) {
    let queueStatus = [];
    this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
      queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code === 'QS-CO');
      if(info?.status !== 'QS-IP') {
				queueStatus = queueStatus?.filter(filter => filter.code !== 'QS-CO');
			}
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirmation', message: 'Do you want to change the status of existing test\n' + '"' + info?.testName + '"' + ' in ' + info?.statusName + ' ' + 'for' + patient?.patientName + " " + patient?.uhid + ' ?',
          buttonText: { ok: 'Yes', cancel: 'No' }, customMsg: true,
          'testId': info?.testId, 'testType': info?.testType, 'testStatusList': queueStatus, testStatus: true, 'isRemark': 1
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result?.statusId && result?.statusId !== null) {
          let status = { 'statusId': result?.statusId, 'locationId': info?.testLocationId };
          this.dashboardService.updatePatientQueueStatus(info?.queueId, status).subscribe(res => {
            if (res.statusCode === 1) {
              this.toCheckin(patient, payload.locationId , payload?.statusId);
            }
          }, error => {
            this.toastr.warning('Warning', `${error.error.message}`);
          });
        }
      });
    });
  }

  updateTokenStatus(patient, status) {
    let updateTokenData = {};
    if (status === 'QS-IP' || status === 'QS-CO') {
      updateTokenData = {
        locationId: patient.testLocationId,
        queueStatusId: status
      };
    } else {
      updateTokenData = {
        locationId: null,
        queueStatusId: 'QS-PE'
      };
    }
  
    this.workflowService.updateToken(patient.patientId, updateTokenData).subscribe(
      res => {
        this.toastr.success('<i>Success</i>', `${res.message}`);
      },
      error => {
        this.toastr.error('<i>Error</i>', `${error.error.message}`);
      },
      () => {
        this.getLocationsSummary();
      }
    );
  }
  
  

  toCheckout(id) {
    const status = { 'statusId': 'QS-CO', 'locationId': '' };
    this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
      this.getLocationsSummary();
    }, error =>  {
      this.toastr.warning('Warning', `${error.error.message}`);
    });

  }
  toUndo(patient,loc) {
    if(loc === null) {
      this.changeTestLocation('QS-WT', patient);
    } else { 
      const status = { 'statusId': 'QS-WT', 'locationId': loc };
      this.dashboardService.updatePatientQueueStatus(patient?.patientQueueId, status).subscribe(res => {
        this.getLocationsSummary();
      }, error =>  {
        this.toastr.warning('Warning', `${error.error.message}`);
      });
    }
  }
  getPatientDetails(data) {
    if(this.enableCountClick) {
      this.spinLoader = true;
      data['type'] = '1';
      const dialogRef = this.dialog.open(PatientInfoComponent, {
        data: data, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.spinLoader = false;
        this.getLocationsSummary();
      });
    }
  }
  allowpar(qid, status, loc) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title: 'Partial Complete', message: 'Patient will be moved to waiting queue, Do you want to continue?',
        buttonText: { cancel: 'Cancel', ok: 'Continue' },
        'statusId': status, 'locationId': loc,
        'queueId': qid
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getLocationsSummary();
    });
  }
  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(res => {
      let menuCode = 'MN_DQ_Worklist';
      if (res.statusCode == 1 && res.results ) {
        const contentData = JSON.parse(res.results.content);
        if (contentData.hasOwnProperty(menuCode)){
          this.refreshDetail['is_active'] = contentData[menuCode].is_active;
          this.refreshDetail['interval'] = contentData[menuCode].interval * 1000;
          this.refreshDetail['updateInterval'] = contentData[menuCode].updateInterval;
          this.refreshDetail['lastUpdate'] = null; 
          if(this.refreshDetail.is_active && this.refreshDetail.interval) {      
            this.refreshInterval = setInterval(val =>  {
              this.getLocationsSummary()
            }, this.refreshDetail.interval)
          }
        }
        }
    });
  }
  ngOnDestroy() {
    clearInterval(this.interval);
    if (this.client !== undefined) {
      this.client.end(true);
    }
    clearInterval(this.refreshInterval);
    // this.formSub.unsubscribe();
  }
  registerPatient(id) {
    const dialogRef = this.dialog.open(EnrollPatientComponent, {
      data: { 'id': id, 'workflowTypeId': 'WF-HC' },   panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getLocationsSummary();
    });
  }
  
  changeTestLocation(statusId, patient, actionType?: any) {
    this.commonService.getHealthTestAvailableLocation(patient?.testType, patient?.testId).subscribe(res => {
      const testAvailableLocation = res.results;
      if (testAvailableLocation?.length > 1) {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirmation', message: actionType === 'Loc' ? 'Select the option to change the test location' + ' ' + 'for' + patient?.patientName + " " + patient?.uhid:
             statusId === 'QS-WT' ? 'Select the location to change the status to waiting' + ' ' + 'for' + patient?.patientName + " " + patient?.uhid : 
             'Select the location to change the status to Inprogress' + ' ' + 'for' + patient?.patientName + " " + patient?.uhid,
            buttonText: { ok: 'Confirm', cancel: 'Cancel' }, customMsg: true,
            'testId': patient?.testId, 'testType': patient?.testType, testLocationId: patient?.testLocationId, 'patientQueueId': patient.patientQueueId,
            'statusId': statusId, 'testAvailableLocation': testAvailableLocation, testLocation: true, 'isRemark': 1
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          this.getLocationsSummary();
          if (result?.statusId && result?.statusId !== null) {
            let status = { 'statusId': result?.statusId, 'locationId': result?.info?.testLocationId };
            this.dashboardService.updatePatientQueueStatus(result?.info?.queueId, status).subscribe(res => {
              if (res.statusCode === 1) {
                this.toCheckin(patient, result?.locId, result?.info?.status);
              }
            }, error => {
              this.toastr.warning('Warning', `${error.error.message}`);
            });
          }
        });
      } else if (testAvailableLocation?.length === 1) {
         const status = { 'statusId': statusId, 'locationId': testAvailableLocation[0]?.id};
        this.dashboardService.updatePatientQueueStatus(patient.patientQueueId, status).subscribe(res => {
              this.getLocationsSummary();
            }, error => {
              this.toastr.warning('Warning', `${error.error.message}`);
              const info = JSON.parse(error.error.additionalInfo);
              if (error.error.errorCode === "TWAPI54") {
                this.changeExistingQueueStatus(info, patient, status);
              }
            });
      } else {
        this.toastr.warning('Warning', `Multiple Location not available`);
      }
    });
  }
  fixClick() {
    console.log('')
  }
}
