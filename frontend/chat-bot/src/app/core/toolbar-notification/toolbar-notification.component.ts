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
import { Component, OnDestroy, Input, HostListener, ElementRef } from '@angular/core';
import { CommonService } from '../../shared';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { connect, MqttClient } from 'mqtt';
import { PushNotificationsService } from '../../shared/services/push.notification.service';
import { CommonDialogComponent } from '../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { AppToastService } from '../../shared/services/toaster.service';

@Component({
  selector: 'app-toolbar-notification',
  templateUrl: './toolbar-notification.component.html',
  styleUrls: ['./toolbar-notification.component.scss']
})
export class ToolbarNotificationComponent implements OnDestroy {

  private sseStream: Subscription;
  public cloudConnect: any;
  public mqttData: any;
  private _client: MqttClient;
  messages: Array<string> = [];
  cssPrefix = 'toolbar-notification';
  isOpen = false;
  @Input() notifications = [];
  public count: number = 0;
  public notify_data: any = [];
  public pre_notify_data: any = [];
  public showAlert: boolean = false;
  public interval: any;
  public alertSound = null;
  eventUrl = environment.api_base_url_new + environment.base_value.sse_api;
  performerId = null;
  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement) {
      if (!targetElement) {
            return;
      }
      const clickedInside = this.elementRef.nativeElement.contains(targetElement);
      if (!clickedInside) {
            this.isOpen = false;
      }
  }
  constructor(private readonly elementRef: ElementRef, public commonService: CommonService, public toastr:AppToastService,
    public dialog: MatDialog, private readonly _notificationService: PushNotificationsService
  ) {
    this.getconfigData('alert-sound')
    this._notificationService.requestPermission();
    this.getAlertsData();
    this.interval = setInterval((val) => this.getAlertsDataInterval(), 3*60*1000);
    if (window.location.hostname.includes("kyn") == false) {
      this.getMqtt();
    }
  }
 
  getconfigData(key) {
    this.commonService.getConfigFile(key).subscribe(res => {
      if(res.statusCode == 1 && res.results) {
        this.alertSound = res.results.contentObject;
      }
    })
  }

  newAlert(notification, alert_data) {
    this.commonService.alertNotification(notification)
    if(alert_data && alert_data['operation'] != 'create') {
      let msg = [alert_data]
      this.commonService.notificationMsg(msg)
    } 
  }

  getMqtt(){
    if(this._client){
      this._client.end(true);
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
          this._client = connect(cloudConnect);
          this.getAlertMqttData();
      } else {
          res.message = 'mqtt ' + res.message;
          if (window.location.hostname.includes("kyn") == false) {
            this.toastr.warning('Warning', `${res.message}`);
          }
      }
  })
  }

  getAlertMqttData() {
    if (this._client) {
      this._client.subscribe("tw/cache/gw/#");
      this._client.on('message', (topic, message) => {
        const msg = message.toString();
        let alert_data = JSON.parse('[' + msg + ']');
        alert_data = alert_data[0];
        if (alert_data['data'].length && alert_data['data'][0]['facilityId'] === localStorage.getItem(btoa('facilityId'))) {
          if (alert_data.operation === 'notify') {
            const userId = parseInt(localStorage.getItem(btoa('userId')));
            const departmentId = parseInt(localStorage.getItem(btoa('departmentId')));
            const roleId = parseInt(localStorage.getItem('userlevel'));
            this.performerId = null;
            this.mqttData = alert_data.data.filter(resFilter => resFilter.recipientUserIds.includes(userId) && !(this.pre_notify_data.some(item2 => (item2.id === resFilter.id))));
            if (this.mqttData.length) {
              this.notify_data = this.notify_data.concat(this.mqttData);
              this.count = this.count + this.mqttData.length;
              for (let i in this.mqttData) {
                this.mqttData[i]['alertDatetime'] = new Date(alert_data['dateTime'] + ' UTC').toISOString()
                
                // to notify the given performer and owner
                this.mqttData[i]?.IotAlertDetail.forEach(alert => {
                  if (alert?.identifyingType === 'RT-EP') {
                    this.performerId = alert?.identifyingValue;
                    if (alert?.identifyingSubType === 'RT-RO' && this.performerId == roleId) {
                      this.notify(this.mqttData[i]);
                    } else if (alert?.identifyingSubType === 'RT-US' && this.performerId == userId) {
                      this.notify(this.mqttData[i]);
                    } else if (alert?.identifyingSubType === 'RT-DT' && this.performerId == departmentId) {
                      this.notify(this.mqttData[i]);
                    }
                  }
                  if (alert?.identifyingType === 'RT-EO') {
                    const ownerId = alert?.identifyingValue;
                    if (ownerId != this.performerId && ownerId == userId) {
                      this.notify(this.mqttData[i]);
                    }
                  }
                });
              }
            }
          } else if (alert_data.operation === 'close') {
            const tempData = this.notify_data.filter(function(notify) {
              return !alert_data.data.find(function(mqtt) {
                return notify.id === mqtt.id;
              });
            });
            this.notify_data = tempData;
            this.count = this.notify_data.length;
          }
          this.notify_data.sort((a, b) => 0 - (a.id > b.id ? 1 : -1));
          this.newAlert(this.notify_data, alert_data);
        } else if (alert_data['ctx'] === 'Request') {
          if(alert_data['data'][0]['facilityId'] === localStorage.getItem(btoa('facilityId'))) {
            this.newAlert(null, alert_data);
          }
        }
      });
    }
  }
  
  ngDoCheck() {
    if (this.commonService.changeNotify === true) {
      clearInterval(this.interval);
      this.showAlert = false;
      this.pre_notify_data = [];
      this.getconfigData('alert-sound');
      this.getAlertsData();
      this.interval = setInterval((val) => this.getAlertsDataInterval(), 3*60*1000);
      if (window.location.hostname.includes("kyn") == false) {
        this.getMqtt();
      }
      this.commonService.changeNotify = false;
    }
  }

  /* Here we subscribe to the events triggered by Observable */

  invokeStream() {
    this.sseStream = this.commonService.observeMessages(this.eventUrl)
      .subscribe(message => {
        this.count++;
        this.messages.push(message);
      });
  }
  getAlertsData(){
    if(btoa('facilityId') in localStorage) {
      let preAlertData = JSON.stringify(this.notify_data);      
      this.commonService.getNotify().subscribe(res => {
        this.count = null;
        this.notify_data = [];
        if(res.statusCode == 1 && res.results.length){
          this.count = res.results.length;
          this.notify_data = res.results;
          if(this.showAlert == false){
            this.pre_notify_data = this.notify_data;
          }
          if(this.showAlert){
            if(this.notify_data.length > this.pre_notify_data.length){
              let filterNotify = this.notify_data.filter(item1 => !this.pre_notify_data.some(item2 => (item2.id === item1.id)));
              for(let i in filterNotify){
                this.notify(filterNotify[i])
              }
            }
          }
          
        }
        if(preAlertData == null || preAlertData !== JSON.stringify(res.results)){
          this.newAlert(this.notify_data, null)
        }
      });
    } else {
      clearInterval(this.interval);
      if (this.sseStream) {
        this.sseStream.unsubscribe();
      }
      if(this._client) {
          this._client.end(true);
      }  
    }
  }
  getAlertsDataInterval(){
    this.showAlert = true;
    this.getAlertsData();
  }
  delete() {
    this.isOpen = false;
  }
  goMoreAlert() {
    let data = {}
    data['content'] = 'alerts'
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: true });

  }

  notify(value) {
      this.pre_notify_data.push(value);
      const data: Array < any > = [];
    let ruleTypeId = value.ruleTypeId;
    let image;
    
    if(ruleTypeId == "RU-GO" || ruleTypeId == "RU-DEF"){
      image = "/assets/Alert/defender.png";
    } else if (ruleTypeId == "RU-SD"){
      image = "/assets/Alert/social_distance.png";
    } else if (ruleTypeId == "RU-NC"){
      image = "/assets/Alert/nurse_call.png";
    } else if (ruleTypeId == "RU-FA"){
      image = "/assets/Alert/fall.png";
    } else if (ruleTypeId == "RU-MO"){
      image = "/assets/Alert/movement.png";
    } else if (ruleTypeId == "RU-MI"){
      image = "/assets/Alert/missing.png";
    } else if (ruleTypeId == "RU-AD"){
      image = "/assets/Alert/disassociate.png";
    }
      data.push({
          'title': 'Trackerwave',
          'alertContent': value.message, 
          'sounds' : this.alertSound
      });
      this._notificationService.generateNotification(data,image);
  }

  ngOnDestroy() {
    if (this.sseStream) {
      this.sseStream.unsubscribe(); // When we logout ngOnDestroy() will get triggered, until then stream is active
    }
    if(this._client) {
        this._client.end(true);
        console.log('client disconnected..')    
    }
  }
  fixClick() {
    console.log('')
  }
}
