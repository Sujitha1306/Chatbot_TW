import { Component, OnDestroy } from '@angular/core';
import { CommonService, ConfigurationService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { DoorHistoryComponent } from './door-history/door-history.component';
import { connect, MqttClient } from 'mqtt';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-door-controller',
  templateUrl: './door-controller.component.html',
  styleUrls: ['./door-controller.component.scss']
})
export class DoorControllerComponent implements OnDestroy {

  selectedName: any = null;
  selectDropdown: any;
  showAction1 = [{ id: 'Open', value: 'Open' }, { id: 'Close', value: 'Close' }]
  public showActions = [];
  displayedColumns: string[] = ['select', 'Name', 'Relay Id','Relay Status','Last Updated','Description','Location','Last Status','Event Time','DoorControllerStatus'];
  eventColumn = ['Name','Alert'];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = [null];
  tableData: any = [];
  parentFilter = [];
  public applyFilterValue: any;
  Id = [];
  readerIds =[];
  bulbIds=[];
  enableCloseButton = false;
  private client: MqttClient;
  facilityId = localStorage.getItem(btoa('facilityId'));
  selectedTabIndex;
  geofenceColumns =['Serial Number', 'Location Name', 'SD Time', 'Last BLE Time', 'Last UWB Time', 'BLE Device', 'UWB Device', 'BLE RSSI', 'UWB Distance', 'Last Buzzer Time', 'Last Bulb Time', 'Alerts']
  geofenceeventColumn = ['View Alarm Log', 'View Raw Data'];
  dateTimeColumns = ['Event Time', 'SD Time', 'Last BLE Time', 'Last UWB Time', 'Last Buzzer Time', 'Last Bulb Time',]
  geofenceTableData: any = [
    {
        "rsn": "120000001", 
        "name": "Lift 1",
        "sd_time": "2026-01-30 10:59:41",
        "last_ble_time": "2026-01-30 10:59:41",
        "last_uwb_time": "2026-01-30 10:59:41",
        "ble_tid": "200000001",
        "uwb_tid": "20000001",
        "ble_rssi": "-70",
        "uwb_dist":"1000",
        "last_buzzer_time": "2026-01-30 10:59:41",                                                     
        "last_bulb_time": "2026-01-30 10:59:41" 
    },
    {
        "rsn": "120000001", 
        "name": "Lift 1",
        "sd_time": "2026-01-30 10:59:41",
        "last_ble_time": "2026-01-30 10:59:41",
        "last_uwb_time": "2026-01-30 10:59:41",
        "ble_tid": "200000001",
        "uwb_tid": "20000001",
        "ble_rssi": "-70",
        "uwb_dist":"1000",
        "last_buzzer_time": "2026-01-30 10:59:41",                                                     
        "last_bulb_time": "2026-01-30 10:59:41" 
    }
  ];

      
  constructor(public configurationService: ConfigurationService , public commonService : CommonService, public toastr : AppToastService, public dialog: MatDialog,public datepipe: DatePipe) {

  }

  ngOnInit() {
    this.getdetails()
    this.getMqtt()
    this.getBulbDetails()
  }

  tabChanged(event){
    console.log(event,this.selectedTabIndex,this.selectedName)
    this.selectedTabIndex = event.index;
    if(event.index === 0){
      this.getdetails()
      let topicName = "tw/cache/gw/" + this.facilityId;
      this.mqttSubscribe(topicName)
      this.getBulbDetails()
    }else if(event.index === 1){
      const HCdynamicDisplaycolumns = ['rsn', 'name', 'sd_time', 'last_ble_time', 'last_uwb_time', 'ble_tid', 'uwb_tid', 'ble_rssi', 'uwb_dist', 'last_buzzer_time', 'last_bulb_time', 'name'];
      this.geofenceTableData.map(data => {
        HCdynamicDisplaycolumns.forEach((col, index) => {
          if(this.geofenceColumns[index] == 'Alerts') {
            data[this.geofenceColumns[index]] = 'View Alerts';
          } else {
            data[this.geofenceColumns[index]] = data[col];
          }
        });
      });
      let topicName = "tw/cache/gw/" + this.facilityId;
      this.mqttSubscribe(topicName);
      let payload = {}
      this.mqttPublish(payload)
      
    }
  
  }
  
  headerEventAction(event) {
    if (event.key === 'refreshPage') {
      this.getdetails()
      this.getBulbDetails()
    }else if (event.key === "manageAction") {
      this.updatestatus(event.keyVal, event.data)
    }else if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    }else if(event.Key === "closeGeofence"){
      this.publishBulb()
    }
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }

  getdetails() {

    this.configurationService.getDoorControllerDetails('CGT-CON', 'CIT-REL',null).subscribe((res) => {
      this.tableData = res.results;

      const Columns = ['select', 'name','rid','statusValue','statusEventDatetime','desc','loc','identifyingId','modifiedOn','status'];

      this.tableData.map(data => {
        const config = JSON.parse(data.configValue);
        this.readerIds.push(config.rid)

        Columns.forEach((col, index) => {
          if (col === 'status') {
            data[this.displayedColumns[index]] = this.getStatusLabel(data.identifyingId);
          } else if (col === 'identifyingId'){
            data[this.displayedColumns[index]] = this.getStatusLabel(data.identifyingId)
          }else if (col === 'modifiedOn'){
            data[this.displayedColumns[index]] = data.modifiedOn
          }else if(col === 'loc'){
              data[this.displayedColumns[index]] = Object.values(config.loc)
          }
          else {
            data[this.displayedColumns[index]] = config[col];
          }
        });
      });
      this.getReaderStatus()
    });
  }

  getBulbDetails(){
        this.configurationService.getDoorControllerDetails(null, 'CIT-GEO','CFT-BLB').subscribe((res) => {
        if(res.statusCode === 1){  
          if(res.results.length > 0){
          const results = res.results[0]
          this.bulbIds =JSON.parse(results.configValue)
          this.enableCloseButton = true
          }
        }
        })
  }

  getReaderStatus() {
    let locfacility: any;
    locfacility = localStorage.getItem(btoa('facilityId')).split(',');
    const currentDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    const readerStatus = { entityIds: this.readerIds, facilityList: locfacility, fromDate: currentDate };
    this.commonService.getReaderStatus(readerStatus).subscribe((res) => {
      const results = res.results || [];

      this.tableData = this.tableData.map(item => {
        const config = JSON.parse(item.configValue);
        const relayId = config.rid;
        const match = results.find(r => r.entityId === relayId);
        if (match) {
          const status = match.statusValue;
          let eventtime;
          if (status === 'Active') {
            eventtime = this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
          } else {
            eventtime = this.datepipe.transform(match.statusEventDatetime, 'yyyy-MM-dd HH:mm:ss');
          }
          item['Relay Status'] = status;
          item['Last Updated'] = eventtime;
        }
        return item;
      });

    })

  }
  eventAction(event) {
    if (event.col === "DoorControllerStatus") {
      if (event.key === 'Close') {
        const data = {
          id: event.element.id,
          identifyingId: "ON"
        }
        const config = JSON.parse(event.element.configValue);
        this.configurationService.updateDoorControllerDetails(event.element.id, data).subscribe((res) => {
          this.getdetails()
           let payload = {
              rid:config.rid,
              status : "ON",
              rnm:config.rnm
            }
            this.mqttPublish(payload)
        })
      } else if (event.key === 'Open') {
        const data = {
          id: event.element.id,
          identifyingId: "OFF"
        }
        const config = JSON.parse(event.element.configValue);
        this.configurationService.updateDoorControllerDetails(event.element.id, data).subscribe((res) => {
          this.getdetails()
          let payload = {
              rid:config.rid,
              status : "OFF",
              rnm:config.rnm
            }
            this.mqttPublish(payload)
        })
      }
    } else if(event.key='Name'){
      this.gethistory(event.data)
    }
    
  }

  checkBoxAction(event) {
    if (event.length > 0) {
      this.showActions = this.showAction1
      this.selectedName = event
    }
  }

getStatusLabel(identifyingId: string): string {
  switch (true) {
    case identifyingId === 'ON':
    case identifyingId === 'ON_Manual':
    case identifyingId === 'ON_Auto':
    case identifyingId === 'OFF':
    case identifyingId === 'OFF_Manual':
    case identifyingId === 'OFF_Auto':
    return 'Loading...';

    case identifyingId.includes('ON_FAILED') :
       return 'Close Failed';
    case identifyingId.includes('OFF_FAILED') :
       return 'Open Failed';


    case identifyingId.includes('ON_SYNC') || identifyingId.includes('OFF_SYNC'):
      return 'Synching...';
    case identifyingId.includes('ON_ON_AUTO'):
    return 'Auto Close';
    case identifyingId.includes('OFF_OFF_AUTO'):
    return 'Auto Open';
    case identifyingId.includes('ON_ON'):
      return 'Close';

    case identifyingId.includes('OFF_OFF'):
      return 'Open';

    default:
      return identifyingId; 
  }
}


  updatestatus(data, key) {
    this.selectedName = null;
    if (key === 'Close') {
      const temp = {
        identifyingId: "ON"
      };
      
      data.forEach(item => {
        const config = JSON.parse(item.configValue);
        const updateData = { ...temp, id: item.id }; 
        this.configurationService.updateDoorControllerDetails(item.id, updateData)
          .subscribe((res) => {
          let payload = {
              rid:config.rid,
              status : "ON",
              rnm:config.rnm
            }
            this.mqttPublish(payload)
            this.getdetails();
          });
      });

    } else if (key === 'Open') {
      const temp = {
        identifyingId: "OFF"
      };
      data.forEach(item => {
        const config = JSON.parse(item.configValue);
        const updateData = { ...temp, id: item.id };  
        this.configurationService.updateDoorControllerDetails(item.id, updateData)
          .subscribe((res) => {
            let payload = {
              rid:config.rid,
              status : "OFF",
              rnm:config.rnm
            }
            this.mqttPublish(payload)
            this.getdetails();
          });
      });
    }

  }
  getMqtt() {
    if(this.client){
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
          this.mqttSubscribe(null);
      } else {
          res.message = 'mqtt ' + res.message;
          this.toastr.warning('Warning', `${res.message}`);
      }
  })
  }
  mqttSubscribe(newTopic) {
    if (this.client) {
      if(newTopic) {
        let oldTopic = this.selectedTabIndex == 1 ? "tw/cache/gw/" + this.facilityId : "rh/reader/pulse/" + this.facilityId;
        this.client.unsubscribe(oldTopic);
      } else {
        newTopic = "tw/cache/gw/" + this.facilityId;
      }
      this.client.subscribe(newTopic);
      this.client.on('message', (topic, message) => {
        let msg = JSON.parse(message.toString());
        if(topic.includes("rh/reader/pulse/")) {
          this.getHealthWatch(msg)
        } else if (topic.includes("tw/cache/gw/")) {
          if(msg.ctx == 'Relay' && msg.operation == 'update') {
            this.getdetails()
          }
        }
      })
    };
  }
  getHealthWatch(msg) {    
    const HCdynamicDisplaycolumns = [ 'type', 'slNo', 'macId', 'location', 'lastCommunicationOn', 'viewAlarmLog', 'viewRawData'];
    this.geofenceTableData.map(data => {
      HCdynamicDisplaycolumns.forEach((col, index) => {
        data[this.geofenceColumns[index]] = data[col];
      });
    });
  }
  mqttPublish(payload) {
    let data  = {};
    if (this.selectedTabIndex == 1) {
      data  = {
        topic : "rh/reader/request/" + this.facilityId,
        message : {
          "dtm": Math.floor(Date.now() /1000),
          "fid": this.facilityId
        }
      }
      this.commonService.commonMqttPublish(data).subscribe(res =>  {
        console.log(res)
      })
    } else if (this.selectedTabIndex == 0) {
      data  = {
        topic : "tw/cache/gw/" + this.facilityId,
        message : {
          typ:"cache",
          ctx:"Relay",
          operation:"modify",
          dateTime:this.datepipe.transform(new Date(), "yyyy-MM-dd HH:mm:ss"),
          data:[{"relayId":payload.rnm,"readerId":payload.rid,"status":payload.status,"facilityId":this.facilityId}],
          event:{}
        }
      }
      this.commonService.commonMqttPublish(data).subscribe(res =>  {
        console.log(res)
      })
    }
    console.log(payload)
    
  }

  publishBulb(){
     let data  = {
      topic : "tw/cache/gw/" + this.facilityId,
       message: {
         typ: "cache",
         ctx: "RelayBulb",
         operation: "modify",
         dateTime:this.datepipe.transform(new Date(), "yyyy-MM-dd HH:mm:ss"),
         data: [
           {
             "bulbIds": this.bulbIds,
             "status": "OFF",
             "facilityId": this.facilityId
           }
         ],
         event: {}
       }
    }
    this.commonService.commonMqttPublish(data).subscribe(result =>  {      
        if (result.statusCode === 1) {
          this.toastr.success('Success', 'Bulb switched off successfully');
        }
      },
      error => {
         this.toastr.error('Error', `${error.error.message}`);
      }
    )
  }

  gethistory(data){
    data={...data,currentstatus:this.getStatusLabel(data.identifyingId)}
    const dialogRef = this.dialog.open(DoorHistoryComponent,{
    data:data ,  panelClass: ['small-popup'], disableClose: true, height : '450px',width:'600px'
   })
  }
  ngOnDestroy(): void {
    if(this.client) {
        this.client.end(true);
        console.log('client disconnected..')    
    }
  }

  headerGeofenceEvent(event){

  }
  geofenceEventAction(event){

  }
}