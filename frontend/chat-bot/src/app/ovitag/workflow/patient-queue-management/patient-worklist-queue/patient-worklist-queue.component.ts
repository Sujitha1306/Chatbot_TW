import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonService, DashboardService, WorkflowService } from '../../../../shared';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { connect, MqttClient } from 'mqtt';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { PatientInfoComponent } from '../../../../shared/modules/entry-component/patient/patient.component';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-patient-worklist-queue',
  templateUrl: './patient-worklist-queue.component.html',
  styleUrls: ['./patient-worklist-queue.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientWorkListQueueComponent implements OnInit, OnDestroy {

  @Input() matTabindex: any;
  @Input() enableCountClick = true;
  @Input() changeLocation: any;
  @Input() showEnrollPatient: any;
  public locationList: any[] = [];
  public locationSearch: string = ""
  public selectedLocation = new FormControl();
  private client: MqttClient;
  pendingDetail: any[];
  waitingDetail: any[];
  inprogressDetail: any[];
  completedDetail: any[];
  patientInfo: any;
  spinLoader: boolean = false;
  locationListDisplay: any;
  worklistCounters: any;
  public obj = new BehaviorSubject<Object>('worklist-counters');
  public interval: any;
  public isRefresh = false;
  public RefreshInterval = 20000;
  public consultantCounters: Array<any> = [];
  public isEnableCounterLoc = false;
  public selectedQueue = [];
  public isParalelTest: any = false;
  dynamicConfig: boolean = false;
  public dqtowerconfig: any = [];


  constructor(private readonly dashboardService: DashboardService, private readonly commonService: CommonService, private readonly cookieService: CookieService,
    public toastr: AppToastService, private readonly workflowService: WorkflowService, private readonly dialog: MatDialog,) {
    this.getLocationsSummary();
  }


  ngOnInit(): void {
    console.log(this.matTabindex)
    if (localStorage.getItem(btoa('worklistRefresh')) === null) {
      this.commonService.getConfigFile('worklist-refresh').subscribe(res => {
        if (res.results != null) {
          this.isRefresh = res.results.contentObject.refresh;
          if (res.results.contentObject.hasOwnProperty('interval')) {
            this.RefreshInterval = res.results.contentObject.interval;
          }
          localStorage.setItem(btoa('worklistRefresh'), res.results.contentObject.refresh);
          this.worklistRefresh();
        }
      })
    } else {
      this.isRefresh = JSON.parse(localStorage.getItem(btoa('worklistRefresh')));
      this.worklistRefresh();
    }
    this.getLocations();
    this.getdqtowerconfig();
    this.getMqtt()
  }

  getMqtt() {
    if (this.client) {
      this.client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res => {
      if (res.results?.length) {
        let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
        let cloudConnect = {
          protocol: brokerInfo[0]['wprotocol'],
          host: brokerInfo[0]['host'],
          password: brokerInfo[0]['password'],
          username: brokerInfo[0]['username'],
          port: brokerInfo[0]['wport'],
          connectTimeout: 30000,
          keepalive: 60
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
    if (this.client) {
      console.log(topic)
      this.client.subscribe(topic);
      this.client.on('message', (topic, message) => {
        const msg = message.toString();
        const jsonData = JSON.parse(msg);
        console.log(jsonData)
        const locationIds = this.selectedLocation.value;
        if (locationIds.indexOf(jsonData['location_id']) != -1) {
          this.getLocationsSummary()
        }
      });
    }
  }

  applyFilter(searchValue: string): void {
    this.locationSearch = searchValue;
    const filterValue = this.locationSearch.toLowerCase();
    this.locationList = this.locationListDisplay.filter(location =>
      location.name.toLowerCase().includes(filterValue) || location.floorName.includes(filterValue)
    );
  }

  openedChange(isOpended) {
    if (!isOpended) {
      this.getSelectionDetail(this.selectedLocation.value);
    }
  }

  getSelectionDetail(data) {
    if (data === null) {
      data = [];
    }
    this.waitingDetail = [];
    this.inprogressDetail = [];
    this.completedDetail = [];
    if (data.length && this.cookieService.check('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
      localStorage.getItem(btoa('userId')))) {
      data = '[' + data.toString() + ']';
      this.cookieService.delete('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
        localStorage.getItem(btoa('userId')));
      this.cookieService.set('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
        localStorage.getItem(btoa('userId')), data);
      this.getLocationsSummary();
    } else if (data.length) {
      data = '[' + data.toString() + ']';
      this.cookieService.set('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
        localStorage.getItem(btoa('userId')), data);
      this.getLocationsSummary();
    }
  }

  private getLocations() {
    if (this.worklistCounters === undefined) {
      this.getBehaviorworkListView();
    }
    this.spinLoader = true;
    this.dashboardService.getHealthPlanLocations().subscribe(res => {
      if (res.statusCode === 1 && res.results.length > 0) {
        this.locationListDisplay = res.results;
        this.locationList = this.locationListDisplay;
        if (this.worklistCounters !== undefined) {
          this.locationList = this.locationList.concat(this.worklistCounters);
        } else {
          this.getBehaviorworkListView();
        }
        this.spinLoader = false;
        if (this.cookieService.check('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
          localStorage.getItem(btoa('userId')))) {
          const selectedList = JSON.parse(this.cookieService.get('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
            localStorage.getItem(btoa('userId'))));
          if (selectedList.length > 0) {
            this.selectedLocation.setValue(selectedList);
          }
        }
      }
    });
  }

  getBehaviorworkListView(): Observable<any> {
    return this.obj.asObservable();
  }

  worklistRefresh() {
    if (this.matTabindex === 3 && this.isRefresh === true) {
      this.interval = setInterval(val => this.getLocationsSummary(), this.RefreshInterval);
    }
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

  toCheckin(patient, locId, statusId) {
    if (this.consultantCounters.length > 0 && this.consultantCounters.find(x => x === locId)) {
      this.isEnableCounterLoc = true;
      const filterCounterLocDetails = this.waitingDetail.filter(rs => rs.testLocationId === locId);
      filterCounterLocDetails[0]['isEnableCounterLoc'] = this.isEnableCounterLoc;
      this.getPatientDetails(filterCounterLocDetails[0]);
    } else if (locId === null) {
      this.changeTestLocation('QS-IP', patient);
    } else {
      /** updated for parellel test issue in api const status = { 'statusId': 'QS-IP', 'locationId': '' }; # updated for parellel test issue in api */
      const status = { 'statusId': statusId, 'locationId': locId };
      this.dashboardService.updatePatientQueueStatus(patient?.patientQueueId, status).subscribe(res => {
        this.getLocationsSummary();
      }, error => {
        this.toastr.warning('Warning', `${error.error.message}`);
        const info = JSON.parse(error.error.additionalInfo);
        if (error.error.errorCode === "TWAPI54") {
          this.changeExistingQueueStatus(info, patient, status);
        }
      });
    }
  }

  getPatientDetails(data) {
    if (this.enableCountClick) {
      data['type'] = '1';
      const dialogRef = this.dialog.open(PatientInfoComponent, {
        data: data, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.getLocationsSummary();
      });
    }
  }

  changeTestLocation(statusId, patient, actionType?: any) {
    this.commonService.getHealthTestAvailableLocation(patient?.testType, patient?.testId).subscribe(res => {
      const testAvailableLocation = res.results;
      if (testAvailableLocation?.length > 1) {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirmation', message: actionType === 'Loc' ? 'Select the option to change the test location' :
              statusId === 'QS-WT' ? 'Select the location to change the status to waiting' : 'Select the location to change the status to Inprogress',
            buttonText: { ok: 'Confirm', cancel: 'Cancel' },
            'testId': patient?.testId, 'testType': patient?.testType, testLocationId: patient?.testLocationId, 'patientQueueId': patient.patientQueueId,
            'statusId': statusId, 'testAvailableLocation': testAvailableLocation, testLocation: true, 'isRemark': 1
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          this.getLocationsSummary();
          if (result?.statusId !== null) {
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
        const status = { 'statusId': statusId, 'locationId': testAvailableLocation[0]?.id };
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

  changeExistingQueueStatus(info, patient, payload) {
    let queueStatus = [];
    this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
      queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code === 'QS-CO');
      if (info?.status !== 'QS-IP') {
        queueStatus = queueStatus?.filter(filter => filter.code !== 'QS-CO');
      }
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirmation', message: 'Do you want to change the status of existing test\n' + '"' + info?.testName + '"' + ' in ' + info?.statusName + ' ?',
          buttonText: { ok: 'Yes', cancel: 'No' }, customMsg: true,
          'testId': info?.testId, 'testType': info?.testType, 'testStatusList': queueStatus, testStatus: true, 'isRemark': 1
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result?.statusId !== null) {
          let status = { 'statusId': result?.statusId, 'locationId': info?.testLocationId };
          this.dashboardService.updatePatientQueueStatus(info?.queueId, status).subscribe(res => {
            if (res.statusCode === 1) {
              this.toCheckin(patient, payload.locationId, payload?.statusId);
            }
          }, error => {
            this.toastr.warning('Warning', `${error.error.message}`);
          });
        }
      });
    });
  }

  getParallel(event){
    if(event === true){
      this.selectedQueue = [];
      this.isParalelTest = false;
    }
  }

  getdqtowerconfig() {
    this.commonService.getConfigFile('dq-tower-config').subscribe(res => {
      if(res.statusCode) {
				this.dynamicConfig = true;
       this.dqtowerconfig = res.results.contentObject.healthcheck;
      }
    });
  }

  getLocationsSummary() {
    if (this.cookieService.check('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
      localStorage.getItem(btoa('userId')))) {
      const data = JSON.parse(this.cookieService.get('DQ_WorkList_' + localStorage.getItem(btoa('facilityId')) + '_' +
        localStorage.getItem(btoa('userId'))));
      this.dashboardService.getHpLocationDetailbyIds(data).subscribe(res => {
        this.patientInfo = res.results;
        this.waitingDetail = res.results.Waiting;
        this.inprogressDetail = res.results.Inprogress;
        this.pendingDetail = res.results.Pending;
        if (!res.results.hasOwnProperty('Waiting')) {
          this.waitingDetail = [];
        }
      });
    }
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    if (this.client !== undefined) {
      this.client.end(true);
    }
  }

  fixClick() {
    console.log('')
  }
}
