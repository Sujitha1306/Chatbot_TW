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

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { connect, MqttClient } from 'mqtt';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-hazard-track',
  templateUrl: './hazard-track.component.html',
  styleUrls: ['./hazard-track.component.scss']
})
export class HazardTrackComponent implements OnInit {
  private client: MqttClient;
  public reqDetail = {};
  public reqList = [];
  public tagDetail = {};
  public tagList = [];
  public chartData = {};
  public showHazard = false;
  constructor(public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, 
  public matDialogRef: MatDialogRef<HazardTrackComponent>, public toastr: AppToastService) { }

  ngOnInit(): void {
    this.getBasicDetails()
    
  }
  getBasicDetails() {
    this.getMqtt()
    this.getActivityDetails()
  }
  getActivityDetails() {
    let queryParam = 'facilityIds='+ localStorage.getItem(btoa('facilityId')) + '&tagAssociationTypeIds=TAT-US'
    this.commonService.getTagRequest(queryParam).subscribe(res => {
      let results = res.results;
      this.tagList = [];
      this.showHazard = false;
      for(let reqIndex in this.data) {
        let filterData = results.filter(val => val.tagAssociationId == this.data[reqIndex].assignedToId)
        if(filterData.length && filterData[0].requests.length) {
          let reqs = filterData[0].requests;
          let filterReq = reqs.filter(val => val.ctxId == this.data[reqIndex].identifyingId)
          if(filterReq.length) {
            filterData[0]['requests'] = filterReq;
            filterData[0]['requests'][0]['configValue']['hazardValue'] = 0.0;
            filterData[0]['requests'][0]['configValue']['oxVal'] = 0.0;
            filterData[0]['requests'][0]['configValue']['lastseen'] = null;
            filterData[0]['requests'][0]['configValue']['unit'] = 'micro';
            filterData[0]['activityName'] = this.data[reqIndex]['activityName'];
            filterData[0]['requestStatus'] = this.data[reqIndex]['requestStatus'];
            filterData[0]['scheduleDate'] = this.data[reqIndex]['scheduleDate'];
            let reqDetailId = filterData[0]['requests'][0]['ctxTypeId']
            this.reqDetail[reqDetailId] = filterData[0];

            this.reqList.push(reqDetailId)
            if(filterData[0]['requests'][0]['configValue']['hazard_type'].includes('HT-IM')) {
              this.chartData[reqDetailId] = {
                min : 0, max : 3000,
                value : 0,
                label : 'µ Sv/hr',
                foregroundColor : '#49e89c'
              }
            }
          }
        }
        if(this.data.length - 1 == parseInt(reqIndex)) {
          this.showHazard = true;
          if(this.reqList.length) {
            this.subscribeData();
          } else {             
            this.toastr.warning('Warning', `${'Task not available'}`);
            this.matDialogRef.close('confirm');
          }
        }
      }
    })
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
        }
    })
  }
  subscribeData(){
    if(this.client) {
      let topicName = 'tw/hazard/gw/' + localStorage.getItem(btoa('facilityId')) + '/#'
      this.client.subscribe(topicName);
      this.client.on('message', (topic, message, packet) => {
          let msg = message.toString();
          let tagData = JSON.parse('[' + msg + ']')
          tagData = tagData[0]
          if(this.reqDetail.hasOwnProperty(tagData['requestDetailId'])) {
            this.showHazard = false;
            this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazardValue'] = tagData['hazardValue'];
            this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['oxVal'] =  tagData['oxVal'];
            this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['lastseen'] = tagData['eventDate']
            if(this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazard_type'].includes('HT-G')) {
              this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazardValue'] = (tagData['hazardValue'] / 10).toFixed(1);
              this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['oxVal'] =  (tagData['oxVal'] / 10).toFixed(1);  
              if(this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazardValue'] == 0) {
                this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['oxVal'] =  (21.000).toFixed(1);
              } 
            }
            if(this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazard_type'].includes('HT-IM')) { 
              this.chartData[tagData['requestDetailId']] = {};
              let hazardValue = (tagData['hazardValue'] / 1000).toFixed(2);
              let unit = 'micro'
              if(parseInt(hazardValue) >= 2000) {
                hazardValue = (tagData['hazardValue'] / 100000).toFixed(2);
                unit = 'milli'
                if(parseInt(hazardValue) >= 1000) {
                  hazardValue = 'OFL';
                  unit = 'ofl'                  
                }                
              } else {
                hazardValue = (tagData['hazardValue'] / 100).toFixed(2);
                unit = 'micro'                
              }
              this.chartData[tagData['requestDetailId']] = {
                min : 0, max : unit == 'micro' ? 2200 : 1500,
                value : hazardValue != 'OFL' ? parseInt(hazardValue) : 1000,
                label : unit == 'micro' ? 'µ Sv/hr' : unit == 'milli' ? 'm Sv/hr' : 'OFL',
                foregroundColor : unit == 'micro' ? '#49e89c' : unit == 'milli' ? '#F0c03c' : '#F05b3c' 
              }
              this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazardValue'] = hazardValue;
              this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['unit'] = unit              
            }
            if(this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazard_type'].includes('HT-AP')) {
              if(this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['max_value'] == tagData['hazardValue']) {
                this.reqDetail[tagData['requestDetailId']]['requests'][0]['configValue']['hazardValue'] = 6;
              }
            }
            this.showHazard = true;
          }
          
      })
    }
  }
  ngOnDestroy(): void {
    if(this.client) {
        this.client.end(true);
        console.log('client disconnected..')    
    }
  }


}
