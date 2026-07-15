import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PatientInfoComponent } from '../patient/patient.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { CommonService } from '../../../services/common.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { TaskManagmentComponent } from '../task-managment/task-managment.component';
import { AcknowledgementComponent } from '../acknowledgement/acknowledgement.component';
import { NotificationAlertPopupComponent } from '../notification-alert-popup/notification-alert-popup.component';

@Component({
  selector: 'app-newcard-view',
  templateUrl: './newcard-view.component.html',
  styleUrls: ['./newcard-view.component.scss']
})
export class NewcardViewComponent {

  @Input() component: any;
  @Input() newCardInput: any;
  @Input() view: any;
  @Input() alertSoundEvents: any = [];  
  @Output() scrollAction = new EventEmitter<any>();
  @Output() eventAction = new EventEmitter<any>();

  public cols: any = 4;
  public height: number;
  public subscription: Subscription;
  public locationId = 'All';
  public facilityId = null;
  public showPatientName = false;

  public count: any = [];
  public alertPatientId: any = [];
  public audioList: any = [];
  public legends = [
    { 'code': 'CE-PR', 'label': 'Patient Relation', 'color': '#ffffff' },
    { 'code': 'CE-BI', 'label': 'Billing', 'color': '#00d100' },
    { 'code': 'CE-FD', 'label': 'Food', 'color': '#ff1bff' },
    { 'code': 'CE-HK', 'label': 'Housekeeping', 'color': '#1843ff' },
    { 'code': 'CE-CL', 'label': 'Call', 'color': '#f00' },
    { 'code': 'CE-PC', 'label': 'Patient Care', 'color': '#4a93f2' }
  ]
  public legendJson: any = {
    'CE-PR': '#ffffff',
    'CE-BI': '#00d100',
    'CE-FD': '#ff1bff',
    'CE-HK': '#1843ff',
    'CE-CL': '#f00',
    'CE-PC': '#4a93f2'
  }
  
  constructor(public dialog: MatDialog, public commonService: CommonService, private readonly configurationServices: ConfigurationService) { };

  ngOnInit() {
    this.getConfig() 
    this.getCardCondition(this.newCardInput);
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    // this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
    //   if (msg.length) {
    //     msg = msg[0];
    //     this.alertBinding(msg);
    //     this.getCardCondition(this.newCardInput);
    //   }
    // });
  }

  ngOnChanges(changes: any) {
    const cardInputValues = changes?.newCardInput?.currentValue;
    this.getCardCondition(cardInputValues);
  }

  getConfig() {
    this.commonService.getConfigFile('nursecall-config').subscribe(res => {
      console.log(res.results);
      if(res.statusCode == 1) {
        let obj = res.results.contentObject;
        this.showPatientName = obj?.showPatientName;
        if(obj?.legends) {
          this.legends = [];
          this.legends = obj.legends;
          let jsonValue = this.legends.reduce((obj, item) => {
                          obj[item.code] = item.color;
                          return obj;
                        }, {});
          this.legendJson = jsonValue;
        }
      }
      
    })
  }

  getCardCondition(data) {
    this.newCardInput = data?.map((card: any) => ({
      ...card,
      alerts : [...new Map(card.alerts.map(item => [item.iotAlertId, item])).values()],
      hasCritical: card.alerts?.some((a: any) => this.alertSoundEvents.includes(a.eventCode))
    }));
  }

  alertBinding(msg) {
    if (msg['ctx'] != 'Alert') {
      return;
    }

    if (this.newCardInput.length) {
      let index = -1;
      index = this.getIndex(this.newCardInput, msg);
      if (index > -1) {
        this.setScrollBasedSoundAlert(msg, index);
      }
    }
  }

  getIndex(Data, msg) {
    const alertPatientDetail = msg['data'][0]['identifyingType'] === 'Patient' ? msg['data'][0]['identifyingId'] : null
    if (alertPatientDetail != undefined && alertPatientDetail) {
      const index = Data.findIndex(
        (val) => val.patientId == alertPatientDetail
      );
      return index;
    } else {
      const index = Data.findIndex(
        (val) => val.tagId === msg['data'][0]['tagId']
      );
      return index;
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
    const alertIndex = this.newCardInput[index]['alerts'].findIndex(
      (val) => val.iotAlertId === msg['data'][0]['id']
    );
    if (alertIndex === -1) {
      this.unShiftAlerts(msg, index, key, notifyType, this.newCardInput);
    } else if (msg['operation'] === 'close') {
      this.newCardInput[index]['alerts'].splice(alertIndex, 1);
      const patient = msg['data'][0]['IotAlertDetail'].filter(
        (val) => val.identifyingType === 'Patient'
      );
      if (patient !== undefined && patient.length) {
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
        if (checkPreAlertFilter.length && this.view != null && this.view.type == 'location') {
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

  setTableIotAlertDetails(msg) {
    for (let alert of msg['data'][0].IotAlertDetail) {
      if (alert.identifyingType === "Event" &&
        alert.identifyingValue !== null &&
        (alert.identifyingValue === 'CE-SO' ||
          alert.identifyingValue === 'CE-AD' ||
          alert.identifyingValue === 'CE-CL' ||
          alert.identifyingValue === 'CE-HK' ||
          alert.identifyingValue === 'CE-PC'
        )) {
        if (this.view == null || (this.view?.type === 'location' && (alert.identifyingValue === 'CE-CL' || alert.identifyingValue === 'CE-HK' || alert.identifyingValue === 'CE-SO' || alert.identifyingValue === 'CE-PC'))) {
          const patient = msg['data'][0]['IotAlertDetail'].filter(
            (val) => val.identifyingType === 'Patient'
          );
          this.setPatientAlertId(patient);
          if (msg['data'][0]['pfAlertConfigId']) {
            const audioList = this.audioList.filter(x => x.event === alert.identifyingValue);
            this.setAudioForAlert(audioList, msg, patient, alert);
          }
        }
      }
    }
  }

  setPatientAlertId(patient) {
    if (patient?.length > 0) {
      this.alertPatientId = this.alertPatientId.filter(x => patient[0]['identifyingValue'].indexOf(x) === -1);
      this.alertPatientId.unshift(parseInt(patient[0]['identifyingValue']));
    }
  }

  setAudioForAlert(audioList, msg, patient, alert) {
    if (audioList.length === 0) {
      this.configurationServices.getAllAlertsById(msg['data'][0]['pfAlertConfigId'], this.facilityId).subscribe(res => {
        const data = res.results[0];
        if (data.length !== 0) {
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
    if (alert.identifyingValue === audioList[0].event && patientId.length === 0) {
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

  stopAudioAction(patientId, event) {
    if (event === 'card') {
      this.audioList = this.audioList.filter(x => x.patientId !== patientId);
      this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
      if (this.audioList.length === 0) {
        this.commonService.stopAudio();
      } else {
        this.playAudio();
      }
    } else {
      const audioList = this.audioList.filter(x => x.patientId === patientId && x.event === event);
      this.audioList = this.audioList.filter(x => x !== audioList[0]);
      if (this.audioList.length === 0) {
        this.commonService.stopAudio();
        this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
      } else {
        const audioList = this.audioList.filter(x => x.patientId === patientId);
        if (audioList.length === 0) {
          this.alertPatientId = this.alertPatientId.filter(x => patientId.toString().indexOf(x) === -1);
        }
        this.playAudio();
      }
    }
  }

  playAudio() {
    for (const audio of this.audioList) {
      this.commonService.playAudioCode(audio.audio_file, audio.audio_volume, audio.audio_loop);
    }
  }

  setLoopAudioDetails(audio, patient, alert) {
    for (let audios of audio) {
      if (alert.identifyingValue === audios.event_name) {
        this.audioList.push({
          "patientId": parseInt(patient[0]['identifyingValue']),
          "event": audios.event_name,
          "audio_file": audios.audio_file,
          "audio_volume": audios.audio_volume,
          "audio_loop": audios.audio_loop,
        });
        this.playAudio();
      }
    }
  }

  countAlert() {
    if (this.view && this.view.type === 'location' && this.locationId) {
      this.commonService.getAlertCount(this.locationId).subscribe(res => {
        let data = res.results
        if (data.length) {
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
    this.scrollAction.emit();
  }

  onWindowResized(size) {
    this.height = size;
  }

  onWindowResizedCol(size) {
    setTimeout(() => { this.cols = size }, 300);
  }


  patientInfo(data) {
    data["type"] = "1";
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {

    });
  }

  eventTrigger(key, data, patientId) {
    if (this.view['type'] == 'location') {
      let patientDetails = patientId;
      if (data && data.eventCode === 'CE-PC') {
        const alertObj = {
          id: data.iotAlertId,
          configName: data.eventName || 'Patient Care',
          message: data.message || 'Patient Care Alert',
          sentDatetime: data.message.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s(?:AM|PM)/)?.[0],
          alertTypeId: 'AT-AL',
          ruleTypeId: 'CE-PC',
          identifyingType: 'Patient',
          identifyingId: patientDetails.patientId,
          alertDetails: [
            { identifyingType: 'Location', identifyingValue: patientDetails.locationId || patientDetails.wardId },
            { identifyingType: 'Tag', identifyingValue: patientDetails.tagId },
            { identifyingType: 'Patient', identifyingValue: patientDetails.patientId, identifyingValueName: patientDetails.patientName }
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
        dialogRef.afterClosed().subscribe(result => {
          this.eventAction.emit({ key: 'refresh', data: null, patientId: null });
        });
      } else {
        if (data) {
          data['patientId'] = patientDetails['patientId'];
        }
        if (data == null || (data.hasOwnProperty('ackDatetime') && data.ackDatetime)) {
          if (data == null) {
            data = {};
            data['patientId'] = patientDetails['patientId'];
          }
          data['requestedType'] = 'RQT-TASK';
          data['description'] = data?.message;
          data['destinationName'] = patientDetails['bedNo'] + ', ' + patientDetails['locationName'];
          data['contextType'] = 'PR-PA';
          data['destinationId'] = patientDetails['bedId']
          data['type'] = 'patient';
          data['page'] = 'nurseCall';
          const dialogRef = this.dialog.open(TaskManagmentComponent, {
            data: data, panelClass: ['large-popup'], disableClose: true
          });
          dialogRef.afterClosed().subscribe(result => {
            this.eventAction.emit({ key: 'refresh', data: null, patientId: null });
          });
        } else {
          const dialogRef = this.dialog.open(AcknowledgementComponent, {
            width: '600px', height: '300px', panelClass: 'pop-up-margin',
            data: data
          });
          dialogRef.afterClosed().subscribe(result => {
            this.eventAction.emit({ key: 'refresh', data: null, patientId: null });
          });
        }
      }
    } else {
      this.eventAction.emit({ key, data, patientId });
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.commonService.stopAudio();
  }

  trackByRowId(index: number, item: any): any {
    return item?.id ?? index;
  }

  fixClick() {
    console.log('')
  }

}
