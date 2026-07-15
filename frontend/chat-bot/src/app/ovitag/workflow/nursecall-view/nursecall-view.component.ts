import { Component, OnInit } from '@angular/core';
import { CommonService, ConfigurationService, WorkflowService } from '../../../shared';
import { CoasterComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { NotificationAlertPopupComponent } from '../../../shared/modules/entry-component/notification-alert-popup/notification-alert-popup.component';

@Component({
  selector: 'app-nursecall-view',
  templateUrl: './nursecall-view.component.html',
  styleUrls: ['./nursecall-view.component.scss']
})
export class NursecallViewComponent implements OnInit {
  
  public ipView = { 'type' : 'location' };
  public selectFilter = [{ id: "ward", value: "WARD" }];
  public displayedColumns : string [] = ["ID", "Device", "Porter", "Alerts", "Bed No", "UHID", "Patient Name", "Gender", "Age", "Consulting Doctor", "Task", "Length of stay", "Status"];
  public iconHeader = ["ID", "Device", "Gender"];
  public iconColumn = ["ID", "Device", "Porter", "Gender", "Alerts", "Task"];
  public sortColumn = ["ID"];
  public eventColumn = ["Device", "Porter", "Task", "Status"];
  public permissionControl = ["BT_ALLE"];
  public alertSoundEvents = ['CE-CL', 'CE-HK']
  public groupFilter = [
    {
      id: 'ward',
      value: 'Ward',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: []
    }
  ];

  public tableData: any = [];
  public count: any = [];
  public rowFilter: any = [];
  public alertLocationId: any = [];
  public audioList: any = [];

  public locationId: any = null;
  public selectedView = "card";

  public pageStart = 0;
  public pageSize = 50;
  public length: any = 0;
  public nurseViewData: any;
  public applyFilterValue: any = null;
  public checkPatientId: any = null;
  public facilityId: any = null;

  public loading: boolean = false;
  public isCheck: boolean = false;
  public enableMultiView: boolean = true;
  public subscription: Subscription;


  constructor(
    private readonly workflowService: WorkflowService, public commonService: CommonService, public dialog: MatDialog,
    private readonly configurationServices: ConfigurationService) {
      this.commonService.getUserPreference(localStorage.getItem(btoa('userId')), localStorage.getItem('userlevel'));
      this.commonService.validateUserPreference('NurWardFilter', this.locationId)
  }


  ngOnInit(): void {
    this.commonService.getConfigFile('alert-sound').subscribe(res => {
      if(res.statusCode == 1) {
        let data = res.results.contentObject;
        if(data.hasOwnProperty('alertSoundEvents')) {
          this.alertSoundEvents = data.alertSoundEvents;
        }
      }
    })
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
      if (msg.length) {
        msg = msg[0];
        this.alertBinding(msg);
      }
    });
    setTimeout(() =>  { this.getPermissionData() }, 500)
    this.countAlert();
    // this.getNurseCallData();
  }

  getNurseCallData(alertMsg = null) {
    this.loading = true;
    this.workflowService.getInpatientList( this.applyFilterValue, this.locationId, null, null, this.pageStart, this.pageSize).subscribe(res => {
      this.loading = false;
      this.length = res.totalRecords;
      // this.nurseViewData = this.commonService.sortByKey(res?.results, 'patientName');
      this.nurseViewData = res?.results;
      this.tableData = res.results;

      const Columns = [ "ID", "tagId", "porterRequestId", "alerts", "bedNo", "uhid", "patientName", "gender", "age", "doctor", "routineStatusName", "lengthOfStay", "visitStatus"];

      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      if(alertMsg) {
        this.checkAlertBinding(alertMsg)
      }

    });
    this.valueInitiated(this.locationId);
  }

  valueInitiated(locationId) {
    if (locationId) {
      locationId = this.locationId;
    }
    this.commonService.validateUserPreference('NurWardFilter', locationId);
  }

  getPermissionData() {
    if (this.commonService.userPreference?.hasOwnProperty('NurWardFilter')) {
      const userPreference = this.commonService?.userPreference;
      this.locationId = userPreference?.NurWardFilter.value;
      this.setPreferenceBasedWardFilter(userPreference);
    } else {
      this.searchLoc('ward')
    }
    this.getNurseCallData()
    this.countAlert();
  }

  setPreferenceBasedWardFilter(userPreference?: any) {
    const userData = userPreference?.NurWardFilter;
    this.commonService.getSpecialityLoc("CS-IP", null).subscribe((res) => {
      const wardTypeFilter = this.groupFilter.find(filter => filter.id === 'ward');
      if (wardTypeFilter) {
        wardTypeFilter.subFilters = res.results.map(({ id, name }) => ({ code: id, value: name }));
        const userFindData = res.results.filter(item => item.id === Number(userData.value));
        wardTypeFilter.defaultSelected = userFindData.length ? [userFindData[0]?.id] : [userData.value];
      }
    });
  }

  headerEventAction(event) {
    if (event.key === 'manageWorklist') {
      this.locationId = event?.data;
      this.getNurseCallData();
      this.countAlert();
    } else if (event.key === 'applyFilter') {
      this.applyFilter(event?.data)
    } else if (event.key === 'manageView') {
      this.getNurseCallData();
      this.countAlert();
    } else if (event.key === 'groupFilter') {
      if (event?.data[0].id === 'ward') {
        this.locationId = event?.data[0].data;
      }
      this.getNurseCallData();
      this.countAlert();
    } else {
      this.refreshPage();
    }
  }

  selectedViewAction(key) {
    if (key) {
      this.selectedView = key
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length == 0 || this.applyFilterValue.length > 2) {
      this.getNurseCallData();
      this.countAlert();
    }
  }

  searchLoc(id) {
    if (id === "ward") {
      this.commonService.getSpecialityLoc("CS-IP", null).subscribe((res) => {
        const wardTypeFilter = this.groupFilter.find(filter => filter.id === 'ward');
        if (wardTypeFilter) {
          wardTypeFilter.subFilters = res.results.map(({ id, name }) => ({ code: id, value: name }));
        }
      });
    }
  }

  alertBinding(msg) {
    if (msg['ctx'] != 'Alert') {
      return;
    }
    if(msg?.data.length) {
      if(msg.data[0].ruleTypeId == "RU-NC" && msg.operation != "notify") {
        // console.log(msg.dateTime,msg.operation, msg.data[0].identifyingId, msg.data[0].identifyingType, msg.data[0].ruleTypeId, msg.data[0].IotAlertDetail.filter(val => val.identifyingType == "Event")[0]['identifyingValue'])
        this.getNurseCallData(msg);
        this.countAlert()
      }
    }
    // if (this.tableData.length) {
    //   let index = -1;
    //   index = this.getIndex(this.tableData, msg);
    //   if (index > -1) {
    //     this.setTableBasedSoundAlert(msg, index);
    //   } else {
        
    //   }
    // }

    // if (this.nurseViewData.length) {
    //   let index = -1;
    //   index = this.getIndex(this.nurseViewData, msg);
    //   if (index > -1) {
    //     this.setScrollBasedSoundAlert(msg, index);
    //   }
    // }
  }
  checkAlertBinding(msg) {
    if (this.nurseViewData.length) {
      let index = -1;
      index = this.getIndex(this.nurseViewData, msg);
      if (index > -1) {
        this.setScrollBasedSoundAlert(msg, index);
      } 
      if (msg['operation'] === 'close') {
        let locDetail = msg.data[0].IotAlertDetail.filter(val => val.identifyingType == "HomeLocation")
        if(locDetail.length) {
          let locationId = parseInt(locDetail[0]['identifyingValue'])
          if (locationId) {
            this.stopAudioAction(locationId,null);
          }
        }
      }
    }
  }

  getIndex(tableData, msg) {
    let identityDetail = msg['data'][0]['IotAlertDetail'].filter(
      (val) => val.identifyingType === "HomeLocation"
    );
    if (identityDetail.length) {
      const index = tableData.findIndex(
        (val) => val.locationId == identityDetail[0]['identifyingValue']
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
      let locationId = this.nurseViewData[index]['locationId'];
      if (locationId) {
        this.stopAudioAction(locationId,notifyType[0]['identifyingValue']);
      }
    }
    this.countAlert();
  }

  setScrollBasedSoundAlert(msg, index) {
    const notifyType = msg['data'][0]['IotAlertDetail'].filter(
      (val) => val.identifyingType === 'Event'
    );
    let key = 'alerts';
    if (notifyType.length) {
      key = 'events';
    }
    const alertIndex = this.nurseViewData[index]['alerts'].findIndex(
      (val) => val.iotAlertId === msg['data'][0]['id']
    );
    if (msg['operation'] === "create") {
      this.unShiftAlerts(msg, index, key, notifyType, this.nurseViewData);
    } else if (msg['operation'] === 'close') {
      // if (patient !== undefined && patient.length) {
      //   this.stopAudioAction(parseInt(patient[0]['identifyingValue']), notifyType[0]['identifyingValue']);
      // }
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
        if (msg['data'][0].IotAlertDetail) {
          this.setTableIotAlertDetails(msg, index);
        }
      }
    }
  }

  setTableIotAlertDetails(msg, patientIndex) {
    for (let alert of msg['data'][0].IotAlertDetail) {
      if (alert.identifyingType === "Event" && this.alertSoundEvents.includes(alert.identifyingValue)) {
        // if (alert.identifyingValue === 'CE-CL' || alert.identifyingValue === 'CE-HK' || alert.identifyingValue === 'CE-SO' || alert.identifyingValue === 'CE-FD' || alert.identifyingValue === 'CE-BL' || alert.identifyingValue === 'CE-PR') {
          let locationId = this.nurseViewData[patientIndex]['locationId'];
          this.setPatientAlertId(locationId);
          if (msg['data'][0]['pfAlertConfigId']) {
            const audioList = this.audioList.filter(x => x.event === alert.identifyingValue);
            this.setAudioForAlert(audioList, msg, locationId, alert);
          }
        // }
      }
    }
  }

  setAudioForAlert(audioList, msg, locationId, alert) {
    if (audioList.length === 0) {
      this.configurationServices.getAllAlertsById(msg['data'][0]['pfAlertConfigId'], this.facilityId).subscribe(res => {
        const data = res.results[0];
        if (data.length !== 0) {
          for (let cond of data.alertConditions) {
            if (cond.identifyingType === 'aid_event' &&
              cond.identifyingValue !== null) {
              const audio = JSON.parse(cond.identifyingValue);
              this.setLoopAudioDetails(audio, locationId, alert);
            }
          }
        }
      });
    } else {
      this.setAudioDetails(audioList, locationId, alert);
    }
  }

  setAudioDetails(audioList, locationId, alert) {
    const locDetail = audioList.filter(x => x.locationId === locationId);
    if (alert.identifyingValue === audioList[0].event && locDetail.length) {
      this.audioList.push({
        "locationId": locationId,
        "event": audioList[0].event,
        "audio_file": audioList[0].audio_file,
        "audio_volume": audioList[0].audio_volume,
        "audio_loop": audioList[0].audio_loop,
      });
    }
    this.playAudio();
  }

  setLoopAudioDetails(audio, locationId, alert) {
    for (let audios of audio) {
      if (alert.identifyingValue === audios.event_name) {
        this.audioList.push({
          "locationId": locationId,
          "event": audios.event_name,
          "audio_file": audios.audio_file,
          "audio_volume": audios.audio_volume,
          "audio_loop": audios.audio_loop,
        });
        this.playAudio();
      }
    }
  }

  setPatientAlertId(locationId) {
    this.alertLocationId = this.alertLocationId.filter(x => locationId);
    this.alertLocationId.unshift(locationId);
  }

  playAudio() {
    if (this.selectedView !== 'table') {
      for (const audio of this.audioList) {
        this.commonService.playAudioCode(audio.audio_file, audio.audio_volume, audio.audio_loop);
      }
    } else {
      this.commonService.stopAudio();
    }
  }

  countAlert(){
    if( this.rowFilter.length != 0 || this.locationId) {
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

  scroll() {
    if (this.length <= this.nurseViewData.length) {
      return;
    }
    this.workflowService
      .getInpatientList(null, this.locationId, null, null, 0, this.nurseViewData.length + 50)
      .subscribe((res) => {
        this.nurseViewData = this.commonService.sortByKey(res.results, 'patientName');
      });
  }

  eventAction(event) {
    if (event.key === "refresh") {
      this.refreshPage();
    }
  }

  manageCoster(data) {
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

  cancelAlert(data, type, patientId) {
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
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
      data: {
        title: title,
        message: "",
        buttonText: { ok: "Ok", cancel: "Cancel" },
        alertDetails: data,
        cancelAlert: true,
        ipView: ipView
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        if (this.audioList.length !== 0 && patientId !== null) {
          this.stopAudioAction(patientId, data.eventCode);
        }
        this.refreshPage();
      }
    });
  }

  stopAudioAction(locationId, event) {
    this.audioList = this.audioList.filter(x => x.locationId !== locationId);
    this.alertLocationId = this.alertLocationId.filter(x => x != locationId);
    if (this.audioList.length === 0) {
      this.commonService.stopAudio();
    }
    // if (event === 'card') {
    //   this.audioList = this.audioList.filter(x => x.locationId !== locationId);
    //   this.alertPatientId = this.alertPatientId.filter(x => locationId.toString().indexOf(x) === -1);
    //   if (this.audioList.length === 0) {
    //     this.commonService.stopAudio();
    //   } else {
    //     this.playAudio();
    //   }
    // } else {
    //   const audioList = this.audioList.filter(x => x.locationId === locationId && x.event === event);
    //   this.audioList = this.audioList.filter(x => x !== audioList[0]);
    //   if (this.audioList.length === 0) {
    //     this.commonService.stopAudio();
    //     this.alertPatientId = this.locationId.filter(x => locationId.toString().indexOf(x) === -1);
    //   } else {
    //     const audioList = this.audioList.filter(x => x.locationId === locationId);
    //     if (audioList.length === 0) {
    //       this.alertPatientId = this.locationId.filter(x => locationId.toString().indexOf(x) === -1);
    //     }
    //     this.playAudio();
    //   }
    // }
  }

  patientInfo(data) {
    data["type"] = "1";
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
  }

  tableEventAction(event) {
    if (event.key === "Device") {
      this.manageCoster(event.data);
    } else if (event.key === "nurse-call" || event.key === "fall-risk") {
      if (event.data.eventCode == "CE-PC") {
        this.alertsDetails(event);
      } else {
        this.cancelAlert(event.data, event.key, event.patientId);
      }
    } else if(event.key == 'Status') {
      this.patientInfo(event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getNurseCallData();
      this.countAlert();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.commonService.stopAudio();
  }

  refreshPage() {
    this.applyFilterValue = null;
    this.getNurseCallData();
    this.countAlert();
  }

  alertsDetails(event) {
    let patientDetails = this.tableData.find(res => res.patientId == event?.patientId);
    const alertObj = {
      id: event?.data?.iotAlertId,
      configName: event?.data?.eventName || 'Patient Care',
      message: event?.data?.message || 'Patient Care Alert',
      sentDatetime: event.data.message.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s(?:AM|PM)/)?.[0],
      alertTypeId: 'AT-AL',
      ruleTypeId: 'CE-PC',
      identifyingType: 'Patient',
      identifyingId: patientDetails?.patientId,
      alertDetails: [
        { identifyingType: 'Location', identifyingValue: patientDetails?.locationId || patientDetails?.wardId },
        { identifyingType: 'Tag', identifyingValue: patientDetails?.tagId },
        { identifyingType: 'Patient', identifyingValue: patientDetails?.patientId, identifyingValueName: patientDetails?.patientName }
      ]
    };
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
    dialogRef.afterClosed().subscribe(result => { });
  }

}
