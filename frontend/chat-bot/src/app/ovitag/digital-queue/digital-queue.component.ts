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
import { Component, OnInit, ViewEncapsulation,  Inject, OnDestroy, ViewChild } from '@angular/core';
import { DashboardService, WorkflowService, HospitalService, CommonService, ConfigurationService } from '../../shared';
import { FormGroup, FormBuilder,  FormControl, FormGroupDirective, NgForm, } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { DigitalQueueModel, DigitalQueueModelCols, DigitalQueueModelRows, DigitalQueueModelId } from './digital-queue.model';
import { CreateManageRoom } from '../digital-queue/digital-queue.model';
import { connect, MqttClient } from 'mqtt';
import { DatePipe } from '@angular/common';
import { EnrollPatientComponent } from '../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { PatientInfoComponent } from '../../shared/modules/entry-component/patient/patient.component';
import { ConfirmationDialog } from '../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { EditDailyManagementComponent } from '../../shared/modules/entry-component/edit-daily-management/edit-daily-management.component';
import { EditLocationMappingComponent } from '../configuration/location-mapping/location-mapping.component';
import { AppToastService } from '../../shared/services/toaster.service';

@Component({
  selector: 'app-digital-queue',
  templateUrl: './digital-queue.component.html',
  styleUrls: ['./digital-queue.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DigitalQueueComponent implements OnInit, OnDestroy {
  digitalQueueList: Array<any> = [];
  digitalQueueList_new: Array<any> = [];
  commonAreaList: Array<any> = [];
  labList: Array<any> = [];
  consultationList: Array<any> = [];
  specialityList: Array<any> = [];
  public gridCols: any;
  public digitalQueueModel: DigitalQueueModel;
  public digitalQueueModelCols: DigitalQueueModelCols;
  public digitalQueueModelRows: DigitalQueueModelRows;
  public digitalQueueModelId: DigitalQueueModelId;

  public visitTypes: Array<any> = [];
  public floorList: Array<any> = [];
  public selectedFloor = null;
  public floorData: Array<any> = [];
 
  public userLevel = null;
  public locationId = null;
  public locationList: Array<any> = [];
  public locationDetails: Array<any> = [];
  public pendingDetail: Array<any> = [];
  public pendingTestDetailByLoc: Array<any> = [];
  public inprogressDetail: Array<any> = [];
  public waitingDetail: Array<any> = [];
  public completedDetail: Array<any> = [];
  private client : MqttClient;
  public isAvailable: any;
  public activate_btn: any = [];
  private readonly topic = 'tw/tag/queue/' + localStorage.getItem(btoa('facilityId')) + '/';
  isOpen = false;
  today = new Date();
// jstoday = '';
  disabled = true;
  checkin = true;
  slideForm: FormGroup;
  searchControl = new FormControl('');
  public overall_interval: any;
  public floor_interval: any;
  public list_height: any;
  public updateLocId: any;
  public updateFloorId: any;
  public locationGender: string;
  public locationLanguage = 'NA';
  public locationGenderCode: any;
  public locationLanguageCode: any;
  public cloudConnect: any;
  public matTabIndex: any = 0;
  public selectedTabIndex = 0;
  public selectedQueue:Array<any> = [];
  public isParalelTest: any = false;
  public spinLoader: any;
  public obj = new BehaviorSubject<Object>([]);
  public isEnablePendingTest = false;
  public updateTestId = 0;
  public testList: any;
  public filterTest = false;

  @ViewChild('locationVisitType') input;
  @ViewChild('searchInputClear') searchInputClear;
  filter = 'pending';
  completedDetailList: any[] = [];
  enableCountClick = true;
  enableMultiView = true;
  enableUnmappedTest = true;
  showActiveInactive = true;
  showEnrollPatient = true;

  dqtowerconfig: any = [];
  dynamicConfig = false;
  // currentYear: number;
  visible:boolean = false
  public unmappedhide : any [] = [];
  locationListDisplay: any=[];
  public locationSearch : any;
  public selectedLocation = new FormControl([]);
  public visitTypeIds = new FormControl([]);
  testAvailableLocation: any=[];
  changeLocation = false;
  floorId = [];
  
  constructor(private readonly dashboardService: DashboardService,
    public commonService: CommonService,private readonly workflowService :WorkflowService,
    private readonly dialog: MatDialog, private readonly fb: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly cookieService: CookieService, public toastr: AppToastService,
    private readonly _dateFormat: DatePipe) {
    this.digitalQueueModel = new DigitalQueueModel();
    this.digitalQueueModelCols = new DigitalQueueModelCols();
    this.digitalQueueModelRows = new DigitalQueueModelRows();
    this.digitalQueueModelId = new DigitalQueueModelId();
    this.activate_btn = this.commonService.getActivePermission("button");
    // this.getAllDigitalQueueData();

    this.userLevel = localStorage.getItem('userlevel');
// this.jstoday = formatDate(this.today, 'dd-MM-yyyy hh:mm:ss a', 'en-US', '+0530');
    this.buildForm();
  }

  buildForm() {
    this.slideForm = this.fb.group({
      checkout: false,
      partial: false,
      parallelTest: true,
      locId: [this.updateLocId ? this.updateLocId : null],
      floorId: [this.updateFloorId ? this.updateFloorId : null],
      testId: [this.updateTestId ? this.updateTestId : '0']
    });
  }

  ngOnInit() {
    this.getMqtt()

    this.onResizeWindowF(window.innerHeight);
    // if (this.userLevel == '3') {

    // this.getHealthPlanLocation();
    // }
    if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
      this.gridCols = 4;
    } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
      this.gridCols = 4;
    } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
      this.gridCols = 2;
    } else if (window.innerWidth <= 768) {
      this.gridCols = 1;
    } else {
      this.gridCols = 4;
    }

    if (this.cookieService.check(
      'DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
    )) {
      this.selectedTabIndex = parseInt(this.cookieService.get(
        'DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      ), 10);
      this.matTabIndex = this.selectedTabIndex;
    } else {
      this.checkSelectedTabIndex(this.matTabIndex);
    }

    /* Note : DQ tab selection based API loading By venkatesh Raju Feb 02, 2021
    this.getFloorList();
    this.getAllDigitalQueueData();
    this.getHealthPlanLocation();
    */

    if (this.matTabIndex === 0) {
      this.getAllDigitalQueueData();
    }

    if (this.matTabIndex === 1) {
      this.getFloorList();
    }

    if (this.matTabIndex === 2) {
      this.getHealthPlanLocation();
    }
    this.getVisitType();
    this.getdqtowerconfig()
    this.getUnmappedTest()
  }

  getUnmappedTest() {
      this.commonService.getAllUnMappedTestLocation().subscribe(res => {
        this.unmappedhide = res.results;
      });
  }
  getdqtowerconfig() {
    this.commonService.getConfigFile('dq-tower-config').subscribe(res => {
      if(res.statusCode) {
				this.dynamicConfig = true;
       this.dqtowerconfig = res.results.contentObject.healthcheck;
       if(this.dqtowerconfig.hasOwnProperty('enableCountClick')) {
        this.enableCountClick = this.dqtowerconfig.enableCountClick;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableMultiView')) {
        this.enableMultiView = this.dqtowerconfig.enableMultiView;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableUnmappedTest')) {
        this.enableUnmappedTest = this.dqtowerconfig.enableUnmappedTest;
       }
       if(this.dqtowerconfig.hasOwnProperty('showEnrollPatient')) {
        this.showEnrollPatient = this.dqtowerconfig.showEnrollPatient;
       }
       if(this.dqtowerconfig.hasOwnProperty('showActiveInactive')) {
        this.showActiveInactive = this.dqtowerconfig.showActiveInactive;
       }
       if(this.dqtowerconfig.hasOwnProperty('changeLocation')) {
        this.changeLocation = this.dqtowerconfig.changeLocation;
       }
      }
    });
  }
  multiViewAction(event) {
    this.changeView('card')
  }
  changeView(view) {
    this.visible = view === 'table';
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
      } else {
          res.message = 'mqtt ' + res.message;
          this.toastr.warning('Warning', `${res.message}`);
      }
    })
  }

  filterVisitType(visitType) {
    const visitTypeId = new Set(visitType);
    this.dashboardService.getHpLocationDetailbyId(this.locationId).subscribe(res => {
      if (res.results.hasOwnProperty('Waiting') && res.results.Waiting.length !== 0) {
        this.waitingDetail = res.results.Waiting.filter(event => visitTypeId.has(event.visitTypeId));
      }
    });
  }

  getVisitType() {
    this.commonService.getAppTermsVerion2('VisitType').subscribe(res => {
      this.visitTypes = res.results;
    });
  }

  getBehaviorMqttDetailsView(): Observable<any> {
    return this.obj.asObservable();
  }

  checkSelectedTabIndex(tabIndex) {
    this.cookieService.delete('DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
    this.cookieService.set(
      'DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
      this.matTabIndex.toString()
    );

    if (this.cookieService.check(
      'DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
    )) {
      this.selectedTabIndex = parseInt(this.cookieService.get(
        'DQ_Active_Tab_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      ), 10);
      this.matTabIndex = this.selectedTabIndex;
    }
  }
  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.matTabIndex = tabChangeEvent;
    // this.matTabIndex = tabChangeEvent.index;

  // tabChanged = (tabChangeEvent): void => {
  //   if (tabChangeEvent.target.textContent === 'Overall') {
  //     this.matTabIndex = 0;
  //   } else if (tabChangeEvent.target.textContent === 'Floor') {
  //     this.matTabIndex = 1;
  //   } else if (tabChangeEvent.target.textContent === 'Location') {
  //     this.matTabIndex = 2;
  //   } else if (tabChangeEvent.target.textContent === 'Worklist') {
  //     this.matTabIndex = 3;
  //   } 
    this.checkSelectedTabIndex(this.matTabIndex);

    if (this.matTabIndex === 0) {
      clearInterval(this.overall_interval);
      clearInterval(this.floor_interval);
      this.getAllDigitalQueueData();
    } else if (this.matTabIndex === 1) {
      clearInterval(this.overall_interval);
      clearInterval(this.floor_interval);
      this.getFloorList();
    } else if (this.matTabIndex === 2) {
      clearInterval(this.floor_interval);
      clearInterval(this.overall_interval);
      this.getHealthPlanLocation();
    } else {
      clearInterval(this.floor_interval);
      clearInterval(this.overall_interval);
    }
  }


  getFloorList() {
    this.dashboardService.getFloorList().subscribe(res => {
      this.floorList = res.results;
      if (this.floorList.length > 0) {
        if (this.cookieService.check(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        } else {
          this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
          this.cookieService.set(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
            this.selectedFloor
          );
          if (this.floorList[0].hasOwnProperty('id')) {
            this.selectedFloor = this.floorList[0].id;
          }
        }
        this.getFloorDetail(this.selectedFloor);
      }
    });
  }
  getFloorDetail(id) {
    // if (this.selectedFloor == null || this.selectedFloor !== id) {
    this.selectedFloor = id;
    if (this.selectedFloor != null) {
      // this.slideForm.controls['floorId'].setValue(id);
      this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
      this.cookieService.set(
        'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
        this.selectedFloor
      );

      if (this.cookieService.check(
        'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      )) {
        this.selectedFloor = this.cookieService.get(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        );
      } else {
        this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
        this.cookieService.set(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
          this.selectedFloor
        );

        if (this.cookieService.check(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        }
      }
      if (typeof (id) === 'string') {
        id = parseInt(id, 10);
      }

      if (this.matTabIndex === 1) { // check the mat tab details by venkatesh Raju jan 21, 2020
        clearInterval(this.floor_interval);
        this.floor_interval = setInterval(val => this.getFloorDetail(this.selectedFloor), 30000);
      }
      this.dashboardService.getPatientByFloorId(this.selectedFloor).subscribe(res => {
        this.spinLoader = true;
        this.floorData = res.results;
        this.spinLoader = false;
      });
      const filterFloor = this.floorList.filter(res => res.id === id);
      if (filterFloor.length > 0) {
        this.updateFloorId = filterFloor[0].id;
        this.buildForm();
      }
    }
  }
  getAllHealthTestLocation() {
    this.spinLoader = true;
    if (this.locationId !== null) {
      this.commonService.getAllHealthTestLocation(this.locationId).subscribe(res => {
        this.spinLoader = false;
        this.testList = res.results;
        if (this.testList.length > 0) {
          if (this.filterTest && this.updateTestId !== 0) {
            this.updateTestId = this.updateTestId;
          } else {
            // this.updateTestId = this.testList[0].testId;
            this.updateTestId = 0;
          }
          this.getPendingTestByLocId(this.filter, this.updateTestId);
          this.buildForm();
        }
      });
    }
  }

  getHealthPlanLocation() {
    this.spinLoader = true;
    const category = {key: 'excludeCategoryId', value: 'TC-BILL'};
    this.dashboardService.getHealthPlanLocations(category).subscribe(res => {
      this.locationListDisplay = res.results;
      this.locationList = this.locationListDisplay.slice();
      if (this.locationList.length > 0) {
        if (this.commonService.userPreference?.hasOwnProperty('DQLocation')) {
          let locationIds = JSON.parse(this.commonService.userPreference.DQLocation.value);
          this.selectedLocation.setValue(locationIds);
          if (this.floorId?.length === 0 && this.commonService.userPreference?.hasOwnProperty('DQFloor')) {
            this.floorId = JSON.parse(this.commonService.userPreference.DQFloor.value);
          }
        } else {
          if (this.locationList[0].hasOwnProperty('id')) {
            this.locationId = this.locationList[0].id;
            this.selectedLocation.setValue([this.locationId])
          }
          this.commonService.validateUserPreference('DQLocation',  JSON.stringify([this.locationId]));
          this.commonService.validateUserPreference('DQFloor',  JSON.stringify(this.locationList[0]?.floorId));
        }
        this.openedChange(false)
      }
    });
    this.spinLoader = false;
  }
  applyFilter(data: string): void{
    this.locationSearch = data;
    const filterValue = this.locationSearch.toLowerCase();
    this.locationList = this.locationListDisplay.filter(location =>
      location.name.toLowerCase().includes(filterValue) || location.floorName.includes(filterValue)
    );
  }
  openedChangeFilter(isOpended) {
    if(!isOpended) {
      this.refreshlocation();
    }
  }
  openedChange(isOpended) {
    if(!isOpended)
      {
        this.locationId = null;
        let locIds = null;
        if(this.selectedLocation.value.length != 0) {
          this.locationId = this.selectedLocation.value.toString();
          this.commonService.validateUserPreference('DQLocation',  JSON.stringify(this.selectedLocation.value));
        }
        this.getLocationDetail(true);
      }
  }
  getLocationDetail(sub_call) {
    let id = this.selectedLocation.value.toString();
    id = id != '' ? id : null;
    this.floorId = [];
    if (this.selectedLocation.value?.length !== 0) {
      this.selectedLocation.value?.forEach(locationId => {
        const location = this.locationList?.filter(x => x.id === locationId);
        if (location?.length > 0 && !this.floorId.includes(location[0].floorId)) {
          this.floorId.push(location[0].floorId);
        }
      });
    }
    this.commonService.validateUserPreference('DQFloor',  JSON.stringify(this.floorId));
    if (id) {
      if (id == this.locationId) {
        this.filterTest = true;
      } else {
        this.filterTest = false;
      }
      // console.log('inside location details..........');
      this.today = new Date();
      // this.locationId = id;
      this.pendingDetail = [];
      this.pendingTestDetailByLoc = [];
      this.inprogressDetail = [];
      this.waitingDetail = [];
      this.completedDetail = [];


      this.getAvailableLocationByLocId();
      // if (sub_call) {
      //   this.subscribe(this.topic + id + '/#');
      // }
      this.completedDetailList = [];
      this.spinLoader = true;
      this.dashboardService.getHpLocationDetailbyId(id, null, null, null, this.visitTypeIds?.value).subscribe(res => {
        if(res.statusCode === 1) {
          // console.log('location level.......',res.results);
          this.locationDetails = res.results;
          // this.pendingDetail = res.results.pending;
          this.pendingTestDetailByLoc = res.results.Pending;
          this.waitingDetail = res.results.Waiting;
          this.inprogressDetail = res.results.Inprogress;
          this.selectedQueue = [];
          for (let queue of this.inprogressDetail) {
            let queueIds = queue.paralelTests.map(val => val.queueId);
            this.selectedQueue = [...this.selectedQueue, ...queueIds]
          }
          this.completedDetail = res.results.Completed;
          if (!res.results.hasOwnProperty('Waiting')) {
            this.waitingDetail = [];
          }
          this.spinLoader = false;
          // this.getFloorList();
          // this.getAllDigitalQueueData();
          this.getAllHealthTestLocation();
        }
      },
        error => {
          this.spinLoader = false;
          this.toastr.error('Error', `${error.error.message}`);
        });

      const filterLocation = this.locationList.filter(res => res.id == id);
      if (filterLocation.length > 0) {
        this.isAvailable = filterLocation[0].isAvailable;
        this.updateLocId = filterLocation[0].id;
        this.buildForm();
      }
    } else {
      this.pendingDetail = [];
      this.pendingTestDetailByLoc = [];
      this.inprogressDetail = [];
      this.waitingDetail = [];
      this.completedDetail = [];
      this.completedDetailList = [];
    }
  }
  getParallel(event){
    if(event === true){
      this.selectedQueue = [];
      this.isParalelTest = false;
    }
  }
  isParallelCheck(event, testData){
    if(event.checked === true){
    this.selectedQueue.push(testData)
    this.isParalelTest = true;
    }
    else{
    this.selectedQueue.splice(this.selectedQueue.indexOf(testData),1)
    if(this.selectedQueue.length > 0){
      this.isParalelTest = true;
    }
    else{
    this.isParalelTest =false;
    }
    }
  }
  statusChange(status, locId) {

    console.log(status, locId);
    // this.updateLocId = locId;
    // this.buildForm();

    // if (status === true) {
    //   const dialogRef = this.dialog.open(RegisterPatientComponent, {
    //     data: { 'locationId': locId, 'gender': this.locationGenderCode, 'language':  this.locationLanguageCode},
    //     width: '610px', height: '350px', panelClass: 'custom-dialog-container2', disableClose: true
    //   });
    //   dialogRef.afterClosed().subscribe(result => {
    //     this.getAvailableLocationByLocId();
    //   });
    // }

    // const locationStatusUpdate = { 'isAvailable': status, 'locationId': locId };
    // if (typeof (locId) === 'string') {
    //   locId = parseInt(locId, 10);
    // }

    // if (!status) {
    //   const getLocNameDetails = this.locationList.filter(res => res.id === locId);
    //   const msg = 'Do you want to inactivate the room ' + getLocNameDetails[0]['name'] + '?';
    //   const dialogRef = this.dialog.open(ConfirmationDialog, {
    //     width: '430px', height: '40%', disableClose: true,
    //     data: {
    //       title: 'Inactivate Room', message: msg,
    //       buttonText: { cancel: 'Cancel', ok: 'Ok' },
    //       'locationStatusUpdate': locationStatusUpdate, 'activateRoom': true, 'isRemark': 1
    //     }
    //   });
    //   dialogRef.afterClosed().subscribe(result => {
    //     this.refreshlocation();
    //     this.slideForm.reset();
    //   });
    // } else {
    //   this.configurationService.updateHealthTestByFloorwise(locationStatusUpdate).subscribe(res => {
    //     if (res.statusCode === 1) {
    //       this.isAvailable = res.results.isAvailable;
    //       for (let v = 0; v < this.locationList.length; v++) {
    //         if (this.locationList[v]['id'] === locId) {
    //           this.locationList[v]['isAvailable'] = status;
    //           break;
    //         }
    //       }
    //       this.toastr.successToastr('Success', `${res.message}`, { animate: 'slideFromRight' });
    //       this.updateLocId = locId;
    //       this.buildForm();
    //     }
    //   });
    // }
    this.commonService.getAllTestsByLocation(locId).subscribe(res => {
      const locdata = res.results;
      if (status === true) {
      locdata.isAvailable = true;
      } else {
        locdata.isAvailable = false;
      }
    let reqDetail = res.results;
    reqDetail['disableQueueLength'] = this.activate_btn.includes('TB_WFDQQLEN') ? false : true;
    reqDetail['disableCapacity'] = this.activate_btn.includes('TB_WFDQCAP') ? false : true;
    const dialogRef = this.dialog.open(EditDailyManagementComponent, {
      data: reqDetail,
      panelClass: ['medium-popup'], disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log(result)
        this.getFloorList();
        this.getAllDigitalQueueData();
        this.getHealthPlanLocation();
        this.getVisitType();
    });
  });
  }

  changeLocationAvailability(isAvailable) {
    let actionData = [];
    if(this.selectedLocation.value?.length !== 0) {
      this.selectedLocation.value.forEach(locationId => {
        actionData.push({
          "isAvailable": isAvailable,
          "locationId":locationId
        });
      });
    }
    this.commonService.updateBulkLocationStatus(actionData).subscribe(res => {
      this.getFloorList();
      this.getAllDigitalQueueData();
      this.getHealthPlanLocation();
      this.getVisitType();
      this.toastr.success('Success', `${res.message}`);
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  getAvailableLocationByLocId() {
    if (this.selectedLocation.value.length == 1) {
      let locId = this.selectedLocation.value[0];
      this.commonService.getAvailableLocationByLocId(locId).subscribe(res => {
        if (res.statusCode === 1) {
          this.isAvailable = res.results.isAvailable;
          if (res.results.gender != null) {
            this.locationGender = res.results.genderName;
            this.locationGenderCode = res.results.gender;
          } else {
            this.locationGender = null;
          }
          if (res.results.languages[0] != null) {
            this.locationLanguage = res.results.languageNames[0];
            this.locationLanguageCode = res.results.languages[0];
          } else {
            this.locationLanguage = 'NA';
          }
        }
      });
    }
  }

  manageRoom(locId) {
    this.commonService.getAvailableLocationByLocId(locId).subscribe(res => {
      if (res.statusCode === 1) {
        const dialogRef = this.dialog.open(RegisterPatientComponent, {
          data: { 'locationId': locId, 'gender': res.results.gender, 'language': res.results.languages[0] },
          panelClass: ['mdm-Confirmation-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          this.getAvailableLocationByLocId();
        });
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.overall_interval);
    clearInterval(this.floor_interval);
    if (this.client !== undefined) {
      this.client.end(true);
    }
  }

  subscribe(topic): void {
    if (this.cloudConnect === undefined) {

      this.getBehaviorMqttDetailsView();
    }
    if (this.matTabIndex === 2 && this.client) {
      this.client.subscribe(topic);
      this.client.on('message', (topic, message) => {
        const msg = message.toString();
        const jsonData = JSON.parse(msg);
        console.log(jsonData);
        // console.log(typeof(jsonData.location_id));
        // console.log(typeof(this.locationId));
        // const mqtt_subscribe_loc_id = parseInt(jsonData.location_id, 10);
        // console.log(mqtt_subscribe_loc_id);
        // console.log(this.locationId);
        // if (mqtt_subscribe_loc_id === this.locationId) {
        // console.log('inside subscribe........');
        // console.log(jsonData.location_id);
        //   console.log(jsonData);
        //   this.getLocationDetail(this.locationId, false);
        // }
        // this.getLocationDetail(this.locationId, false);
        this.openedChange(false)
      });
    }
  }

  print(data) {
    const title = data?.gender?.toLowerCase() === 'male' ? 'Mr.' : data?.gender?.toLowerCase() === 'female' ? 'Ms.' : '';
    const genderCode = data?.gender?.toLowerCase() === 'male' ? 'M' : data?.gender?.toLowerCase() === 'female' ? 'F' : '';
    const tokenTemplate = `
      <div class="token-box">
        <div style="padding:2px"><strong>${title || ''}${data?.patientName || ''}</strong> (${data?.age || ''} ${data?.age ? '/' : ''} ${genderCode || ''})</div>
        <div style="padding:2px"><strong>UHID:</strong> ${data?.uhid || ''} <strong>Token No:</strong> ${data?.visitTokenNo || ''} </div>
        <div style="padding:2px"><strong>Visit ID:</strong> ${data?.visitIdentifier || ''} </div>
        <div style="padding:2px"><strong>Date & Time:</strong> ${this._dateFormat.transform(this.today, 'dd-MMM-yyyy HH:mm:ss a') || ''}</div>
        <div style="padding:2px"><strong>Test Location:</strong> ${data?.testLocationName || ''} </div>
        <div style="padding:2px"><strong>Test:</strong> ${data?.testName || ''} </div>
      </div>
    `;
    const printContent = `
      ${tokenTemplate}
      ${tokenTemplate}
      ${tokenTemplate}
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Token</title>
          <style>
            body {
              font-family: Open Sans, sans-serif;
              padding: 10px;
            }

            .token-box {
              border: 2px solid #000;
              padding: 10px;
              margin-bottom: 10px;
              width: 550px;
              box-sizing: border-box;
              font-size: 20px;
            }

            .token-box div {
              margin: 4px 0;
            }

            @media print {
              @page {
                margin: 5mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();

    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  }

  updateTestGroup(tests) {
    const queueIds = [];
    for (let m in tests) {
      queueIds.push(tests[m].queueId);
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Confirm Test Complete', message: 'Selected tests for the patient will be marked as complete, Are you sure?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'statusId': 'QS-CO', 'locationId': parseInt(this.locationId, 10),
        'queueIds': queueIds, 'queueId': queueIds[0]
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.getLocationDetail(true);
        // this.getFloorList();
        // this.getAllDigitalQueueData();
        this.slideForm.reset();
      } else {
        this.slideForm.reset();
      }
    });

  }

  onChange(event: boolean, queue_id: number, queue_status: string, event_type: string) {

    if (event_type === 'checkout') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirmation', message: 'Are you looking to checkout?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'statusId': queue_status, 'locationId': parseInt(this.locationId, 10),
          'queueId': queue_id, 'queueIds': this.selectedQueue, 'isParalelTestIncluded': this.isParalelTest
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.getLocationDetail(true);
          // this.getFloorList();
          // this.getAllDigitalQueueData();
          this.slideForm.reset();
          this.selectedQueue = [];
          this.isParalelTest = false;
        } else {
          this.slideForm.reset();
          this.selectedQueue = [];
          this.isParalelTest = false;
        }
      });

    }

    if (event_type === 'partial') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Partial Complete', message: 'Patient will be moved to waiting queue, Do you want to continue?',
          buttonText: { cancel: 'Cancel', ok: 'Continue' },
          'statusId': queue_status, 'locationId': parseInt(this.locationId, 10),
          'queueId': queue_id
        }
      });
      dialogRef.afterClosed().subscribe(results => {
        if (results === 'Yes') {
          this.getLocationDetail(true);
          // this.getFloorList();
          // this.getAllDigitalQueueData();
          this.slideForm.reset();
        } else {
          this.slideForm.reset();
        }
      });
    }
  }

  searchPendingList(value){
    value = value.trim();
    if(value !== null && value !== '' && value.length > 2) {
      this.completedDetailList = [];
      this.dashboardService.getHpLocationDetailbyId(this.locationId, value, null, null, this.visitTypeIds?.value).subscribe(res => {
        if (this.updateTestId == 0) {
          this.completedDetailList = res.results.Pending;
        } else {
          this.completedDetailList = res.results.Pending.filter(res => res.testId === this.updateTestId);
        }
      });
    } else {
      if (this.updateTestId == 0) {
        this.completedDetailList = this.pendingTestDetailByLoc;
      } else {
        this.completedDetailList = this.pendingTestDetailByLoc.filter(res => res.testId === this.updateTestId);      }
    }
}

  getPendingTestByLocId(filter, testId ?: number) {
    if(testId == null || testId == 0) {
      this.slideForm.get("testId")?.setValue(null);
    }
    this.filter = filter;
    this.updateTestId = testId;
    this.completedDetailList = [];
    if (this.searchInputClear !== undefined) {
      this.searchInputClear.nativeElement.value = '';
    }
    if (filter === 'pending') {
      // if (testId == 0) {
      //   this.updateTestId = this.slideForm.controls['testId'].value;
      // }
      this.isEnablePendingTest = true;
      if (this.updateTestId == 0) {
        this.completedDetailList = this.pendingTestDetailByLoc;
      } else {
        this.completedDetailList = this.pendingTestDetailByLoc.filter(res => res.testId === this.updateTestId);
      }
    } else {
      this.completedDetailList = this.completedDetail;
      this.isEnablePendingTest = false;
    }
  }
  changeStatus(id, status, parallelIds, isParalelTestIncluded, locationId, testDetail?) {
    let testStatus = status;
		if (status === 'QS-PE') {
			status = { 'statusId': status, 'locationId': null };
		} else {
      if(testDetail) {
      if(isParalelTestIncluded) {
        let notRequiredTests = testDetail.paralelTests.filter(val => parallelIds.includes(val.queueId) == false)        
        let nrTests = notRequiredTests.map(val => val.queueId)
        for(let qid of nrTests){
          let status1 = { 'statusId': 'QS-NR', 'locationId': null };
          this.dashboardService.updatePatientQueueStatus(qid, status1).subscribe(res => {            
          }, error =>  {
            this.toastr.warning('Warning', `${error.error.message}`);
          });
        }
      }
      let testQueueIds = testDetail.paralelTests.filter(val => parallelIds.includes(val.queueId))
      parallelIds = testQueueIds.map(val => val.queueId)        
      }
			status = { 'statusId': status, 'locationId': locationId, 'queueIds': parallelIds, 'isParalelTestIncluded': isParalelTestIncluded};
		}
    let loc = null;
    if(/,/.test(status?.locationId)) {
      loc = status?.locationId?.split(',');
    }
    if(status?.locationId === null || loc !== undefined || loc !== null) {
      this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
        this.getLocationDetail(true);
        this.getParallel(true);
      }, error =>  {
        this.toastr.warning('Warning', `${error.error.message}`);
        const info = JSON.parse(error.error.additionalInfo);
        if (error.error.errorCode === "TWAPI54") {
          let queueStatus = [];
          this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
            queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code == 'QS-CO');
            if(info?.status !== 'QS-IP') {
              queueStatus = queueStatus?.filter(filter => filter.code !== 'QS-CO');
            }
            const dialogRef = this.dialog.open(ConfirmationDialog, {
              panelClass: ['mdm-Confirmation-popup'], disableClose: true,
              data: {
                title: 'Confirmation', message: 'Do you want to change the status of existing test\n' + '"' + info?.testName + '"' + ' in ' + info?.statusName + ' ' + 'for' + testDetail?.patientName + " " + testDetail?.uhid + ' ?',
                buttonText: { ok: 'Yes', cancel: 'No' }, customMsg: true,
                'testId': info?.testId, 'testType': info?.testType, 'testStatusList': queueStatus, testStatus: true, 'isRemark': 1
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result?.statusId && result?.statusId !== null) {
                status = { 'statusId': result?.statusId, 'locationId': info?.testLocationId, 'queueIds': parallelIds, 'isParalelTestIncluded': isParalelTestIncluded };
                this.dashboardService.updatePatientQueueStatus(info?.queueId, status).subscribe(res => {
                 if(res.statusCode === 1) {
                    status = { 'statusId': testStatus, 'locationId': locationId, 'queueIds': parallelIds, 'isParalelTestIncluded': isParalelTestIncluded };
                    this.changeStatus(id, testStatus, parallelIds, isParalelTestIncluded, locationId);	
                  }
                }, error => {
                  this.toastr.warning('Warning', `${error.error.message}`);
                });
              }
            });
          });
        }
      });
    } else {
      this.toastr.warning('Warning', `${'Please check the test location'}`);
    }
	}
  updateTokenStatus(patient, status) {
    let updateTokenData = {};
    if (status === 'QS-IP' || status === 'QS-CO') {
      if(patient?.testLocationId != null) {
        updateTokenData = {
          locationId: patient.testLocationId,
          queueStatusId: status
        };
        this.updateToken(patient.patientId, updateTokenData);
      } else {
        this.commonService.getHealthTestAvailableLocation(patient?.testType, null, 'TC-BILL').subscribe(res => {
        this.testAvailableLocation = res.results;
        console.log(this.testAvailableLocation)
        patient['queueStatusId'] = status;
          if (this.testAvailableLocation?.length > 1) {
            let msg = '\nSelect the location to change the status for token' + ' ' + patient?.visitTokenNo;
            this.updateStatusWithLocation(msg, this.testAvailableLocation, 'token', patient);
          } else if (this.testAvailableLocation?.length === 1) {
            updateTokenData = {
              locationId: this.testAvailableLocation[0].id,
              queueStatusId: status
            };
            this.updateToken(patient.patientId, updateTokenData);
          }
        });
      }
    } else {
      updateTokenData = {
        locationId: null,
        queueStatusId: 'QS-PE'
      };
      this.updateToken(patient.patientId, updateTokenData);
    }
  }
  updateToken(patientId, updateTokenData) {
    this.workflowService.updateToken(patientId, updateTokenData).subscribe(
      res => {
        this.toastr.success('Success', `${res.message}`);
        this.getLocationDetail(true);
        this.getParallel(true);
      },
      error => {
        this.toastr.error('<i>Error</i>', `${error.error.message}`);
      },
    );
  }
  updatePatientTest(patient, testId) {
    let updatePatientDetails = [];
    let filterLocationDetails = [];
    let msg = 'Do you want to check-in patient ' + patient.patientName + ', '  + patient.visitIdentifier + ', ' + patient.uhid;
    // const testId = this.slideForm.controls['testId'].value;
    if (patient.patientId !== null) {
      filterLocationDetails = this.pendingTestDetailByLoc.filter(res => res.testId === testId && res.patientId === patient.patientId);
    } else {
      filterLocationDetails = this.pendingTestDetailByLoc.filter(res => res.testId === testId);
    }

    let currentTestDetails = [];
    let pendingTestDetails = [];

    currentTestDetails = [
      {
        'locationId': null,
        'patientQueueId': filterLocationDetails[0].currentQueueId,
        'patientStatusId': 'QS-PE',
        'lastModifiedOn': null
      }
    ];

    pendingTestDetails = [
      {
        'locationId': this.locationId,
        'patientQueueId': filterLocationDetails[0].patientQueueId,
        'patientStatusId': 'QS-WT',
        'lastModifiedOn': null
      }
    ];

    if (filterLocationDetails[0].currentQueueId === null) {
      updatePatientDetails = pendingTestDetails;
    } else {
      updatePatientDetails = currentTestDetails.concat(pendingTestDetails);
    }
    this.commonService.getHealthTestAvailableLocation(patient?.testType, patient?.testId).subscribe(res => {
      this.testAvailableLocation = res.results;
      if (this.testAvailableLocation?.length > 1) {
        msg = msg + '.' + '\nSelect the location to change the status';
        updatePatientDetails['locationId'] = null;
        this.updateStatusWithLocation(msg, this.testAvailableLocation, updatePatientDetails, filterLocationDetails);
      } else if (this.testAvailableLocation?.length === 1) {
        msg = msg;
        updatePatientDetails['locationId'] = this.testAvailableLocation[0]?.id;
        this.updateStatusWithLocation(msg, this.testAvailableLocation, updatePatientDetails, filterLocationDetails);
      } else {
        this.toastr.warning('Warning', `Locations not available`);
      }
    });
  }
  updateStatusWithLocation(msg, testAvailableLocation, updatePatientDetails, filterLocationDetails) {
    let title = updatePatientDetails === 'token' ? 'Confirmation' : 'Check-in';
    let btn = updatePatientDetails === 'token' ? 'Confirm' : 'Continue';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title: title, message: msg, customMsg: true,
        buttonText: { ok: btn, cancel: 'Cancel' },
        'updatePatientDetails': updatePatientDetails, 'isRemark': 1, 'patientPendingLocation': true, 'testAvailableLocation': testAvailableLocation,
        statusToken: true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== null && result !== 'No' && result !== '' && updatePatientDetails !== 'token') {
        if (result === 'Continue') {
          this.refreshlocation();
        } else if (result !== 'Cancel' && result !== '') {
          this.changeStatus(filterLocationDetails[0].patientQueueId, 'QS-IP', this.selectedQueue, this.isParalelTest, result?.locationId, filterLocationDetails[0]);
        }
      } else if (result !== null && result !== 'No' && result !== '' && updatePatientDetails === 'token') {
        const updateTokenData = {
          locationId: result,
          queueStatusId: filterLocationDetails.queueStatusId
        };
        this.updateToken(filterLocationDetails.patientId, updateTokenData);
      }
    });
  }

  getPatientDetails(data) {
    this.spinLoader = true;
    if(this.enableCountClick) {
      data['type'] = '1';
      const dialogRef = this.dialog.open(PatientInfoComponent, {
        data: data,
        panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        // if (result === 'confirm') {
        this.spinLoader = false;
        this.refreshlocation();
        // }
      });
    }
  }
  getAllDigitalQueueData() {
    if (this.matTabIndex === 0) {
      clearInterval(this.overall_interval);
      this.overall_interval = setInterval(val => this.getAllDigitalQueueData(), 30000);
    }
    this.dashboardService.getDigitalQueueSummary().subscribe(res => {
      this.spinLoader = true;
      this.digitalQueueList = res.results;
      this.digitalQueueList_new = res.results;
      // this.digitalQueueList_new = [
      //   {
      //     "name": "Consultation",
      //     "code": "Consultati",
      //     "locations": [
      //       {
      //         "id": 17943,
      //         "testName": "PQ Test 3 G",
      //         "testId": 10132,
      //         "inprogressCount": "0",
      //         "name": "304",
      //         "floorName": "Third Floor",
      //         "completedCount": "3",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       },
      //       {
      //         "id": 17968,
      //         "testName": "Vital Assesment",
      //         "testId": 10127,
      //         "inprogressCount": "0",
      //         "name": "403",
      //         "floorName": "Fourth Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       },
      //       {
      //         "id": 17972,
      //         "testName": "Process Counter",
      //         "testId": 10126,
      //         "inprogressCount": "0",
      //         "name": "406",
      //         "floorName": "Fourth Floor",
      //         "completedCount": "4",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       },
      //       {
      //         "id": 17973,
      //         "testName": "PQ Test 4 G",
      //         "testId": 10133,
      //         "inprogressCount": "0",
      //         "name": "Dining Hall",
      //         "floorName": "Fourth Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       }
      //     ]
      //   },
      //   {
      //     "name": "Lab",
      //     "code": "Lab",
      //     "locations": [
      //       {
      //         "id": 17940,
      //         "testName": "BloodTest Group",
      //         "testId": 380,
      //         "inprogressCount": "0",
      //         "name": "301",
      //         "floorName": "Third Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test_group"
      //       },
      //       {
      //         "id": 17941,
      //         "testName": "Medical History",
      //         "testId": 380,
      //         "inprogressCount": "0",
      //         "name": "302",
      //         "floorName": "Third Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       },
      //       {
      //         "id": 17942,
      //         "testName": "ECG Testing Long Test Name in Dev",
      //         "testId": 381,
      //         "inprogressCount": "0",
      //         "name": "303",
      //         "floorName": "Third Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       },
      //       {
      //         "id": 17943,
      //         "testName": "TMT",
      //         "testId": 383,
      //         "inprogressCount": "0",
      //         "name": "304",
      //         "floorName": "Third Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       }
      //     ]
      //   },
      //   {
      //     "name": "Speciality",
      //     "code": "Specialty",
      //     "locations": [
      //       {
      //         "testName": "PQ Test 2",
      //         "testId": 10131,
      //         "testType": "health_test",
      //         "test_locations": [
      //           {
      //             "id": 17968,
      //             "inprogressCount": "0",
      //             "name": "403",
      //             "floorName": "Fourth Floor",
      //             "completedCount": "1",
      //             "waitingCount": "0"
      //           },
      //           {
      //             "id": 17969,
      //             "inprogressCount": "0",
      //             "name": "404",
      //             "floorName": "Fourth Floor",
      //             "completedCount": "0",
      //             "waitingCount": "1"
      //           }
      //         ]
      //       },
      //       {
      //         "id": 17971,
      //         "testName": "Registration/Billing",
      //         "testId": 10124,
      //         "inprogressCount": "0",
      //         "name": "405",
      //         "floorName": "Fourth Floor",
      //         "completedCount": "2",
      //         "waitingCount": "0",
      //         "testType": "health_test"
      //       }
      //     ]
      //   },
      //   {
      //     "name": "Waiting",
      //     "code": "Waiting",
      //     "locations": [
      //       {
      //         "id": 0,
      //         "testName": null,
      //         "testId": null,
      //         "inprogressCount": null,
      //         "name": "Unknown",
      //         "floorName": "Unknown",
      //         "completedCount": null,
      //         "waitingCount": null,
      //         "testType": null,
      //         "pendingCount": "3"
      //       }
      //     ]
      //   }
      // ];
      // console.log(this.digitalQueueList_new);
      this.spinLoader = false;
    }, error => {
      clearInterval(this.overall_interval);
    });
  }
  onResizeWindowF(data) {
    const height = (data - 172) / 46;
    this.list_height = data - 250;
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }
  onResizeWindow(event) {
    const height = (event.target.innerHeight - 172) / 46;
    this.list_height = event.target.innerHeight - 250;
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }

  onResize(event) {


    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
      this.gridCols = 3;
    } else if (event.target.innerWidth <= 768) {
      this.gridCols = 1;
    } else {
      this.gridCols = 4;
    }

  }
  locationInfo(id, name, status, testId, count, testType, visitStatusId, planTypeId) {
    if(this.enableCountClick) {
    if (count > 0) {
      // const dialogRef = this.dialog.open(PatientsComponent, {
      const dialogRef = this.dialog.open(PatientInfoComponent, {
        data: { 'id': id, 'name': name, 'status': status, 'testId': testId, 'testType': testType, 'visitStatusId': visitStatusId, 'planTypeId': planTypeId },
         panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        // if (result === 'confirm') {
        this.refreshoverall();
        this.refreshfloor();
        // }
      });
    }
    }
  }

  edittestinfo() {
    const dialogRef = this.dialog.open(EditLocationMappingComponent,
      { data: { 'type': "unmapped" , 'listData' : this.unmappedhide }, panelClass: ['small-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => {});
    }

  registerPatient(id) {
    const dialogRef = this.dialog.open(EnrollPatientComponent, {
      // data: { 'id': id },  height : '60%', width: '50%', panelClass: 'custom-dialog-container2', disableClose: true });
      data: { 'id': id, 'workflowTypeId': 'WF-HC' },   panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      // if (result === 'confirm') {
      this.refreshoverall();
      this.refreshfloor();
      this.refreshlocation();
      // }
    });
  }
  refreshoverall() {
    this.getAllDigitalQueueData();
  }
  refreshfloor() {
    if (this.selectedFloor == null && this.floorList.length > 0) {
      this.getFloorDetail(this.floorList[0].id);
    } else {
      this.getFloorDetail(this.selectedFloor);
    }
  }
  refreshlocation() {
    this.getLocationDetail(true);
  }

}


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-register-patient',
  templateUrl: './register-patient.component.html',
  styleUrls: ['./register-patient.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe]
})

export class RegisterPatientComponent implements OnInit {

  public registerPatientForm: FormGroup;
  public createManageRoom: CreateManageRoom;
  public isDisabled = false;
  dataSource = new MatTableDataSource();
  public genderList: any[] = null;
  public languageList: any[] = null;
  public currentDate: any = new Date();
  public checkUHID = false;
  public genderCode: any;


  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<CreateManageRoom>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly hospitalServices: HospitalService, private readonly workflowService : WorkflowService,private readonly dashboardService: DashboardService, private readonly _dateFormat: DatePipe,
    private readonly configurationService: ConfigurationService, private readonly commonServices : CommonService) {

  }

  ngOnInit() {
    this.buildForm();
    // get gender list
    this.commonServices.getAppTermsVerion2('LocationGender').subscribe(res => {
      this.genderList = res.results;
    });
    // get language list
    this.commonServices.getAppTermsVerion2('Language').subscribe(res => {
      this.languageList = res.results;
    });
  }
  public buildForm() {

    this.registerPatientForm = this.form.group({
      gender: [this.data.gender ? this.data.gender : null],
      language: [this.data.language ? this.data.language : null],
    });
  }

  public saveRegisterPatient() {
    this.isDisabled = true;
    this.createManageRoom = new CreateManageRoom(null, null, null);
    this.createManageRoom.gender = this.registerPatientForm.controls['gender'].value;
    this.createManageRoom.languages = [this.registerPatientForm.controls['language'].value];
    this.createManageRoom.locationId = this.data.locationId;

    console.log(this.createManageRoom);
    // return;

    this.commonServices.updateHealthTestByFloorwise(this.createManageRoom).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }
      this.toastr.success('Success', `${res.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.registerPatientForm.reset();
  }
  fixClick() {
    console.log('')
  }
}
