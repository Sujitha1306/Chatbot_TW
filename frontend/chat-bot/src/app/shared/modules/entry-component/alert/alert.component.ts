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
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { AlertEntryComponent } from '../alert-entry/alert-entry.component';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { connect, MqttClient } from 'mqtt';
import { Subscription } from 'rxjs';
import { CommonService, DashboardService } from '../../../services';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AlertComponent implements OnInit, OnDestroy {
  widgetFilterGroup: Array<any> = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Info' },
    { id: 3, name: 'Reminder' },
    { id: 4, name: 'Warning' },
    { id: 5, name: 'Critical' },
  ];
  alertGroup: Array<any> = [];

  alertData: Array<any> = [];
  public ruleType: any[] = [];
  public alertDetails: any;
  public alertFilterData: any;
  public mqttData: any;

  pageEvent: PageEvent;
  length: any;
  pageIndex: any;
  viewMoreCount = [];

  public pageStart = 0;
  public pageSize = 10;
  public interval;
  public alertTypeId = null;
  public alertType = 'All';
  public alertForm: FormGroup;
  public isAlert = false;
  private _client: MqttClient;
  subscription: Subscription;

  constructor(
    private readonly dashboardService: DashboardService,
    public commonService: CommonService,
    private readonly dialog: MatDialog,
    public fb: FormBuilder
  ) {
  }
  ngOnInit() {
    this.subscription = this.commonService.currentMessage.subscribe(message => {
      this.alertDetails = message;
      this.alertData = this.alertDetails;
      this.isAlert = true;
      this.viewMoreCount = this.alertData;
      this.alertFilterData = this.alertDetails;
    });
    this.buildForm();
    this.getRuleType();
    this.alertfilter(this.alertType);
  }

  getMqtt() {
    if (this._client) {
      this._client.end(true);
    }
    this.commonService.getMqttCred().subscribe(res => {
      if (res.results != null ) {
          const cloudConnect = res.results.contentObject;
          this._client = connect(cloudConnect);
          this.getAlertMqttData();
      }
  });
  }

  getAlertMqttData() {
    if (this._client) {
      this._client.subscribe('tw/cache/gw/' + localStorage.getItem(btoa('facilityId')));
      this._client.on('message', (topic, message) => {
        const msg = message.toString();
        let alerts = eval('[' + msg + ']');
        alerts = alerts[0];
        if (alerts.operation === 'notify') {
          const userId = parseInt(localStorage.getItem(btoa('userId')), 10);
          this.mqttData = alerts.data.filter(resFilter => resFilter.recipientUserIds.includes(userId));
          this.alertDetails = this.alertDetails.concat(this.mqttData);
          if (this.alertTypeId === 'All') {
            this.alertFilterData = this.alertDetails;
          } else {
            const tempData = this.mqttData.filter(resFilter => resFilter.ruleTypeId === this.alertTypeId);
            this.alertFilterData = this.alertFilterData.concat(tempData);
          }
        } else if (alerts.operation === 'close') {
          const tempData = this.alertDetails.filter(function(data) {
            return !alerts.data.find(function(mqtt) {
              return data.id === mqtt.id;
            });
          });
          this.alertDetails = tempData;
          const tempData1 = this.alertFilterData.filter(function(data) {
            return !alerts.data.find(function(mqtt) {
              return data.id === mqtt.id;
            });
          });
          this.alertFilterData = tempData1;
        }
        if (this.alertFilterData.length) {
          this.alertFilterData.sort((a, b) => 0 - (a.id > b.id ? 1 : -1));
          this.alertDetails.sort((a, b) => 0 - (a.id > b.id ? 1 : -1));
          this.alertData = this.alertFilterData;
          this.viewMoreCount = this.alertData;
          this.isAlert = true;
        }
      });
    }
  }

  getAllAlert() {
    this.dashboardService
    .getAllAlert(this.pageStart, this.pageSize, this.alertTypeId)
      .subscribe((res) => {
        if (res.results != null) {
          this.alertDetails = res.results;
          this.alertData = this.alertDetails;
          this.isAlert = true;
          this.viewMoreCount = this.alertData;
          this.alertFilterData = this.alertDetails;
        }
      });
  }

  goMoreAlert() {
    this.dialog.open(AlertEntryComponent, {
      data: this.alertDetails,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
  }

  getRuleType() {
    this.commonService.getAppTerms('RuleType').subscribe((res) => {
      if (parseInt(localStorage.getItem('userlevel'), 10) === 8) {
        this.ruleType = res.results.filter((rs) => rs.code === 'RU-SD');
      } else {
        this.ruleType = res.results;
      }
    });
  }
  buildForm() {
    this.alertForm = this.fb.group({
      alertType: [this.alertType ? this.alertType : null]
    });
  }
  alertfilter(value) {
    this.alertTypeId = value;
    if (value !== null && value !== 'All' && this.alertDetails !== undefined) {
      const alertDataTemp = this.alertDetails;
      this.alertFilterData = alertDataTemp.filter(resFilter => resFilter.ruleTypeId === value);
    } else if (this.alertDetails !== undefined) {
      this.alertFilterData  = this.alertDetails;
    }
    if (this.alertFilterData !== undefined) {
      this.isAlert = true;
      this.alertData = this.alertFilterData;
      this.viewMoreCount = this.alertData;
    }
  }
  rowHide(data) {
    console.log(data);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
