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
import { Component, ElementRef, HostListener, OnDestroy, OnInit, Pipe, PipeTransform, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonService, ConfigurationService, WorkflowService } from '../../shared';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { PorterRequestNewComponent } from '../../shared/modules/entry-component/porter-request/porter-request.component';
import { ManageAssetComponent } from '../../shared/modules/entry-component/manage-asset/manage-asset.component';
import { connect, MqttClient } from 'mqtt';
import { PushNotificationsService } from '../../shared/services/push.notification.service';
import { TaskManagmentComponent } from '../../shared/modules/entry-component/task-managment/task-managment.component';
import { AppToastService } from '../../shared/services/toaster.service';
import { GatePassComponent } from '../../shared/modules/entry-component/gate-pass/gate-pass.component';
import { AuditScheduleManagementComponent } from '../../shared/modules/entry-component/CAFM/audit-schedule-management/audit-schedule-management.component';
import { NotificationCameraViewComponent } from './notification-camera-view/notification-camera-view.component';
import { NotificationAlertPopupComponent } from '../../shared/modules/entry-component/notification-alert-popup/notification-alert-popup.component';


@Component({
  selector: 'app-global-notification',
  templateUrl: './global-notification.component.html',
  styleUrls: ['./global-notification.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GlobalNotificationComponent implements OnInit, OnDestroy {
  @ViewChild('notificationList') notificationListEl: ElementRef;
  public isOpen: boolean = false;
  public tabs: any[] = [
    {tabName: 'All', count: 0, code: 'all'},
    {tabName: 'Alert', count: 0, code: 'alert'},
    {tabName: 'Message', count: 0, code: 'msg'},
    {tabName: 'Reminder', count: 0, code: 'reminder'}
  ]
  public filterOptions: any[] = [
    {value: 'Read', code: true},
    {value: 'Unread', code: false}
  ]
  public notificationData: any[] = []
  public loginUserId = localStorage.getItem('dXNlcklk')
  public selectedTab: string = 'all';
  public notificationInfo: any[] = [];
  public isAllChecked = false;
  public isIndeterminate = false;
  public isPreview = false;
  public hoverTimeout: any;
  public hoverDuration = 500;
  checkedNotifications = new Set<number>();
  selectedNotificationId: any[] = [];
  size = 10;
  previewNotifiData = null;
  previewMessage = null;
  isUnreadMsg: boolean | null = null;
  isFilter: boolean = false;
  selectedTabName = 'All';
  overAllcount: number = 0;
  ruleFilterList: any;
  isSelectedRule = 'all';
  selectedRule = null;
  selectedSeen = null;
  rowData: any;
  public activate_btn: any = [];
  public loading = false;
  private _client: MqttClient;
  public alertSound = null;
  isMore: boolean = false;
  performerId = null;
  notifyAlert = "false";
  private audioCoolDownTime = 10000; // 10 seconds
  private mqttRefreshTimer: any = null;
  public mqttRefreshDelay = 3; // seconds — throttle window for MQTT alert refresh

  constructor(private readonly elementRef: ElementRef, private readonly commonService: CommonService, public dialog: MatDialog, public toastr: AppToastService,
    private readonly configurationService: ConfigurationService, private readonly workflowService: WorkflowService,private readonly _notificationService: PushNotificationsService) {
      this.getconfigData('alert-sound')
      this._notificationService.requestPermission();
      this.activate_btn = this.commonService.getActivePermission("button");
     }

  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement) {
    if (!targetElement) return;

    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      this.isOpen = false;
      this.isPreview = false;
      this.isAllChecked = false;
      this.checkedNotifications.clear();
      this.selectedNotificationId = [];
      this.isFilter = false;
    }
  }

  ngOnInit(): void {
    this.notifyAlert = localStorage.getItem('notify_alert');
    this.getNotification(this.loginUserId, this.selectedTab);
    this.getNotificationCount();
    this.getRuleFilter();
    // this.requestPermission();
    // this.listen();
    this.getMqtt();
  }

  refreshNotification(){
    this.getNotification(this.loginUserId, this.selectedTab);
    this.getNotificationCount();
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
        const alert_data = this.parseAlertMessage(message);
        if (!this.isRelevantFacility(alert_data)) return;

        if (alert_data['ctx'] === 'Alert' || alert_data['ctx']=== 'Request') {
          this.handleAlertContext(alert_data);
        } else {
          this.newAlert(null, alert_data);
        }
      });
    }
  }
  ngOnDestroy(): void {
    if (this._client !== undefined) {
      console.log('mqtt client disconnected')
      this._client.end(true);
    }
  }

  private parseAlertMessage(message: Buffer): any {
    const msg = message.toString();
    const parsed = JSON.parse('[' + msg + ']');
    return parsed[0];
  }

  private isRelevantFacility(alert_data: any): boolean {
    const facilityId = localStorage.getItem(btoa('facilityId'));
    return alert_data['data'].length && alert_data['data'][0]['facilityId'] === facilityId;
  }

  private handleAlertContext(alert_data: any): void {
    if (alert_data.operation === 'notify') {
      const userId = parseInt(localStorage.getItem(btoa('userId')));
      const departmentId = parseInt(localStorage.getItem(btoa('departmentId')));
      const roleId = parseInt(localStorage.getItem('userlevel'));
      this.performerId = null;
      const mqttData = alert_data.data;
      if (mqttData.length) {
        const alertDatetime = new Date(alert_data['dateTime'] + ' UTC').toISOString();
        mqttData.forEach(item => {
          item['alertDatetime'] = alertDatetime;
          
          // to notify the given performer and owner
          item?.IotAlertDetail.forEach(alert => {
            if (alert?.identifyingType === 'RT-EP') {
              this.performerId = alert?.identifyingValue;
              if (alert?.identifyingSubType === 'RT-RO' && this.performerId == roleId) {
                this.notify(item);
              } else if (alert?.identifyingSubType === 'RT-US' && this.performerId == userId) {
                this.notify(item);
              } else if (alert?.identifyingSubType === 'RT-DT' && this.performerId == departmentId) {
                this.notify(item);
              }
            }
            if (alert?.identifyingType === 'RT-EO') {
              const ownerId = alert?.identifyingValue;
              if (ownerId != this.performerId && ownerId == userId) {
                this.notify(item);
              }
            }
          });
        });
      }
    }
    let userId = parseInt(localStorage.getItem(btoa('userId')))
    if ((alert_data.data.length && alert_data.operation === "update" && alert_data.data[0]['recipientId'] == userId && alert_data.data[0]['recipientType'] == 'RT-US') || (alert_data.data.length && alert_data.data[0]['recipientUserIds'] != null && alert_data.data[0]['recipientUserIds'].includes(userId))) {
      this.debouncedMqttRefresh();
    }
    this.newAlert(null, alert_data);
  }

  notify(value) {
    this.notifyAlert = "true";
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
        'sounds' : this.alertSound,
        'time' : this.audioCoolDownTime
    });
    if(value.message) {
      this._notificationService.generateNotification(data,image);
    }
    setTimeout(() => {
      this.notifyAlert = "false";
    }, 5000);
    this.refreshNotification();
  }

  newAlert(notification, alert_data) {
    this.commonService.alertNotification(notification)
    if(alert_data) {
      let msg = [alert_data]
      this.commonService.notificationMsg(msg)
    } 
  }
  getconfigData(key) {
    this.commonService.getConfigFile(key).subscribe(res => {
      if(res.statusCode == 1 && res.results) {
        this.alertSound = res.results.contentObject;
        if(this.alertSound.hasOwnProperty('audioCoolDownTime')) {
          this.audioCoolDownTime = this.alertSound?.audioCoolDownTime;
        }
      }
    })
  }
  stripHtmlUsingDOMParser(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || "")
      .replace(/\r?\n|\r/g, ' ') // Remove new lines
      .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
      .trim();
  }


  getRuleFilter() {
    this.configurationService.getAllPfRules().subscribe(res => {
      this.ruleFilterList = res.results;
    });
  }

  notificationOpen(){
    this.hoverTimeout = setTimeout(() => {
      this.notificationTrigger();
    }, this.hoverDuration);
  }

  onMouseLeave(): void {
    clearTimeout(this.hoverTimeout);
  }

  notificationTrigger(){
    this.isOpen = true;
    this.selectedTab = 'all';
    this.getNotification(this.loginUserId, this.selectedTab);
  }

  applyFilter(selected){
    if(selected === 'apply') {
      this.selectedSeen = this.isUnreadMsg
      this.selectedRule = this.isSelectedRule
      this.getNotification(this.loginUserId, this.selectedTab)
      this.isFilter = false;
    } else if (selected === 'filter') {
      this.isFilter = true;
    }

  }

  viewNotification(type, id){
    if(type === 'open'){
      const viewData = this.notificationData.find(val => val.id === id);
      if(viewData){
        if (viewData.ruleTypeId === 'RU-GO' || this.hasEvent(viewData.alertDetails)) {
          this.isOpen = false;
          const dialogRef = this.dialog.open(NotificationAlertPopupComponent, {
            data: {
              selectedAlert: viewData,
              allAlerts: this.notificationInfo,
              ruleFilterList: this.ruleFilterList
            },
           panelClass: ['medium-popup'], disableClose: true
          });

          dialogRef.afterClosed().subscribe(() => {
            this.getNotification(this.loginUserId, this.selectedTab);
            this.getNotificationCount();
          });

          this.updateNotification('single', viewData);
        } else {
          this.isPreview = true;
          this.previewNotifiData = viewData;
          this.previewMessage = viewData.message;
          this.updateNotification('single', this.previewNotifiData);
        }
      }
    } else {
      this.isPreview = false;
      this.previewNotifiData = null;
    }
  }

  formatTemplate(template: string): string {
    return template.replace(/\n/g, '<br>');
  }

  selectedFilter(type, key){
    if(type === 'readFilter'){
      this.isUnreadMsg = key;
    } else if (type === 'ruleFilter') {
      this.isSelectedRule = key;
    } else {
      this.isUnreadMsg = this.selectedSeen;
      this.isSelectedRule = this.selectedRule;
      this.isFilter = false;
    }
  }

  getNotificationCount(){
    this.commonService.getNotificationCount(this.loginUserId).subscribe(res => {
      let notificationCount = res.results;
      this.overAllcount = notificationCount[0].All > 100 ? '99+' : notificationCount[0].All;
      if(this.alertSound?.audio_file && this.notifyAlert === "true" && this.overAllcount !== 0) {
        let audio = new Audio();
        audio.volume = 1
        audio.src = "../../../assets/audio/"+this.alertSound?.audio_file;
        audio.load();
        audio.play();
        localStorage.setItem(('notify_alert'), "false");
        setTimeout(() => {
            this.notifyAlert = "false";
        }, 5000);
      }
      this.tabs = this.tabs.map(tab => {
        const match = notificationCount.find(result => Object.keys(result)[0] === tab.tabName);
        return { ...tab, count: match ? Object.values(match)[0] : tab.count };
      });
    })
  }

  restoreScroll(savedScrollTop: number): void {
    setTimeout(() => {
      const el = this.notificationListEl?.nativeElement;
      if (el) el.scrollTop = Math.min(savedScrollTop, el.scrollHeight - el.clientHeight);
    });
  }

  getNotification(id, tab?, savedScrollTop?: number){
    let type = tab === 'msg' ? 'notification': null;
    let alertType = tab === 'alert' ? 'AT-AL' : tab === 'reminder' ? 'AT-RE' : null;
    let start = 0;
    this.commonService.getAllNotifications(id, start, this.size, false, type, this.selectedSeen, alertType, null, this.selectedRule).subscribe(res =>{
      this.notificationData = res.results;
      let totalRecords = res.totalRecords;
      this.isMore = this.notificationData.length >= totalRecords;
      this.notificationInfo = this.notificationData.length ? this.notificationData : [];
      if (savedScrollTop !== undefined) this.restoreScroll(savedScrollTop);
    })
  }

  selectTab(event): void {
    this.selectedTab = event.code;
    this.selectedTabName = event.tabName;
    this.checkedNotifications.clear();
    this.getNotification(this.loginUserId, this.selectedTab)
  }

  moreNotifications(){
    let notiscroll = 0;
    if (this.notificationListEl?.nativeElement?.scrollTop) {
      notiscroll = this.notificationListEl?.nativeElement?.scrollTop + 300;
    }
    const scrollTop = notiscroll ?? 0
    this.size = this.size + 10;
    this.getNotification(this.loginUserId, this.selectedTab, scrollTop);
  }

  toggleAllCheckboxes(isChecked: boolean): void {
    this.checkedNotifications.clear();
    if (isChecked) {
      this.notificationInfo.forEach((_, index) => this.checkedNotifications.add(index));
    }
    this.updateIsAllChecked();
  }

  toggleCheckbox(index: number): void {
    if (this.checkedNotifications.has(index)) {
      this.checkedNotifications.delete(index);
    } else {
      this.checkedNotifications.add(index);
    }
    this.updateIsAllChecked();
  }

  getCheckedData(): any[] {
    return this.notificationInfo.filter((_, index) => this.checkedNotifications.has(index));
  }

  updateIsAllChecked(): void {
    const total = this.notificationInfo.length;
    const selectedCount = this.checkedNotifications.size;
    this.isAllChecked = total > 0 && selectedCount === total;
    this.isIndeterminate = selectedCount > 0 && selectedCount < total;
  }

  acceptAck(data){
    let putData = [{
      "id": data.notiTranHistoryId,
      "isAck": true,
      "isCleared": false,
      "isDelivered": false,
      "isSeen": true,
      "retryCount": 0,
    }]
    this.commonService.updateNotification(putData).subscribe(res => {
      this.isPreview = false;
      this.getNotification(this.loginUserId, this.selectedTab);
    })
  }

  updateNotification(type, data) {
    let putData = []
    if (type === 'single') {
      putData = [{
        "id": data.notiTranHistoryId,
        "isAck": false,
        "isCleared": false,
        "isDelivered": false,
        "isSeen": true,
        "retryCount": 0,
      }]
    } else if (type === 'multiple') {
      const checkedData = this.getCheckedData();
      this.selectedNotificationId = checkedData.map(x => x)
      putData = this.selectedNotificationId.map(notification => ({
        "id": notification.notiTranHistoryId,
        "isAck": false,
        "isCleared": data === 'clear',
        "isDelivered": false,
        "isSeen": data === 'read',
        "retryCount": 0,
      }));
    }
    this.commonService.updateNotification(putData).subscribe(res => {
      this.getNotification(this.loginUserId, this.selectedTab);
      this.checkedNotifications.clear();
      this.selectedNotificationId = [];
      this.isIndeterminate = false;
      this.updateIsAllChecked()
      this.getNotificationCount()
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    })
  }

  goMoreAlert() {
      let data = {}
      data['content'] = 'alerts';
      this.dialog.open(CommonDialogComponent,
      { data : data, panelClass: ['medium-popup'], disableClose: true });
  }

  navigateNotification(data) {
    if (data.identifyingType === 'Request' || data.identifyingType === 'request' || data.identifyingType === 'DQAT-RQ') {
      if (data.requestType === 'RQT-PO') {
        this.workflowService.getPorterRequest(data.identifyingId).subscribe((res) => {
          const porterData = res.results[0];
          this.isOpen = false
          const dialogRef = this.dialog.open(PorterRequestNewComponent, {
            data: porterData,
            panelClass: ['medium-popup'],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe((result) => { });
        });
      } else if (data.requestType === 'RQT-TASK' || data.requestType === 'RQT-ROU' || data.requestType === 'RQT-WRK') {
        let alertDetails = data?.alertDetails || [];
        let ticketData = {
          nonPerformerId: alertDetails.find(d => d.identifyingType === 'Asset')?.identifyingValue,
          activityCategoryId: alertDetails.find(d => d.identifyingType === 'AssetCategory')?.identifyingValue,
          departmentIds : data?.departmentIds
        };
        if (['AC-QCAP', 'AC-GEXP', 'AC-REAP', 'AC-GPENP'].includes(ticketData?.activityCategoryId) && (this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true)) {
          if (ticketData.activityCategoryId === 'AC-QCAP' || ticketData.activityCategoryId === 'AC-REAP') {
            this.navigateToTransfer(ticketData);
            return;
          }

          if (ticketData.activityCategoryId === 'AC-GEXP' || ticketData.activityCategoryId === 'AC-GPENP') {
            this.navigateToGatepass(ticketData);
            return;
          }
        } else {
        let ticketData = {"id": null, "nonPerformerId": null, "requestId": data.identifyingId, "data": null, "type": 'modify',  }
        ticketData['requestedType'] = data.requestType;
        this.isOpen = false
        const dialogRef = this.dialog.open(TaskManagmentComponent, {
          data: ticketData, panelClass: ['large-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => { });
        }
      } else if(data.requestType === 'RQT-GEN'){
        let auditScheduleId = data?.alertDetails?.find(item => item.identifyingType === 'AuditSchedule')?.identifyingValue || null
        if (auditScheduleId != null) {
          this.configurationService.getAuditScheduleById(auditScheduleId).subscribe(res => {
            let auditScheduleInfo =  res?.results?.[0];
              this.isOpen = false
              const dialogRef = this.dialog.open( AuditScheduleManagementComponent,{
                data: auditScheduleInfo,panelClass: ['large-popup'],disableClose: true
              });
              dialogRef.afterClosed().subscribe(result => { });
            });
        } else {
        let ticketData = {"id": null, "nonPerformerId": null, "requestId": data.identifyingId, "data": null, "type": 'modify',  }
        ticketData['requestedType'] = data.requestType;
        this.isOpen = false
        const dialogRef = this.dialog.open(TaskManagmentComponent, {
          data: ticketData, panelClass: ['large-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => { });
        }
      }
    } else if (data.identifyingType === 'asset') {
      this.loading = true;
      this.configurationService.getAllAsset(data.identifyingId).subscribe(res => {
        let assetData = res.results[0];
        const statusId = assetData.transferEventStatusId;
        const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
        const transferStatus = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
        const isReturnStatus = returnStatus.includes(assetData.assetTransferTypeId);
        const permission1 = isReturnStatus ? this.activate_btn.includes('BT_AM_RAT') : this.activate_btn.includes('BT_AM_AT');
        const permission2 = isReturnStatus ? this.activate_btn.includes('BT_AM_ATA') : this.activate_btn.includes('BT_AM_RATA');
        this.commonService.getLatestTransferDetail(assetData.id).subscribe(department => {
          const departmentIds:any = localStorage.getItem(btoa('departmentIds') || '[]');
          const isTransfer = transferStatus.includes(assetData.assetTransferTypeId);
          const sourceId = Number(department.results.sourceTransferId);
          const transferId = Number(department.results.transferId);
          const isApprovedStatus = statusId === 'ATT-INI' && (isTransfer || departmentIds.includes(sourceId));
          const isPendingStatus = statusId === 'ATT-PEN' && (isTransfer || departmentIds.includes(transferId));
            if (!isApprovedStatus && !isPendingStatus) {
              this.loading = false;
              this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
              return;
            }
            const targetStatus = isApprovedStatus ? 'ATT-PEN' : 'ATT-COM';
            const permission = isApprovedStatus ? permission1 : permission2;
            const jsondata = {
              transferType: department.results.transferType,
              transferId: department.results.transferId,
              assetTransferType: assetData.assetTransferTypeId,
              eventId: 'ATT-ACEV',
              eventStatusId: targetStatus,
              id: assetData.id,
              isExcludeParent: false,
              linkedAssets: [],
              comments: null
            };
            this.commonService.getAssetTransferDetails(assetData.assetId, assetData.assetTransferTypeId).subscribe(details => {
              this.loading = false;
              const dialogRef = this.dialog.open(ManageAssetComponent, {
                panelClass: ['small-popup'],
                disableClose: true,
                data: {
                  assetdata: jsondata,
                  assetInfo: assetData,
                  transferData: details.results
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                if (!permission && result !== '') {
                  this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
                }
              });
            });
          });
        });
    }
  }

  navigateToTransfer(data) {
    let categoryAssignedDepartment = data?.departmentIds ??[];
    if (data?.nonPerformerId){
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results[0];
          const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
          const isReturnStatus = returnStatus.includes(assetData.assetTransferTypeId);
          const permission1 = isReturnStatus ? this.activate_btn.includes('BT_AM_RAT') : this.activate_btn.includes('BT_AM_AT');
          const permission2 = isReturnStatus ? this.activate_btn.includes('BT_AM_RATA') :this.activate_btn.includes('BT_AM_ATA');
          this.commonService.getLatestTransferDetail(assetData.id).subscribe(department => {
            const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
            const transfer = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
            const isStatus = transfer.includes(assetData.assetTransferTypeId);
            const statusId = department?.results?.eventStatusId ?? null;
            assetData['transferEventStatusId'] = statusId;
            if (statusId === 'ATE-COM' || statusId == null) {
              this.toastr.warning('Warning', 'The Request is Already Completed');
              return
            }
            let userId = Number(localStorage.getItem(btoa('userId')));
            let allowedUserforApproval = (assetData?.ownerId === userId) ||(data?.userId === userId);
            const approved = department?.results?.transferType === "TRT-DEP"? (isStatus || departmentIds.includes(Number(department.results.sourceTransferId))): true;
            const pending = department?.results?.transferType === "TRT-DEP"
                ? (Array.isArray(categoryAssignedDepartment) && categoryAssignedDepartment.length > 0 &&(isStatus || categoryAssignedDepartment.includes(Number(department.results.transferId))) )
                : department?.results?.transferType === "TRT-LOC"? allowedUserforApproval: true;
            const isApprovedStatus = statusId === 'ATE-INI' && approved;
            const isPendingStatus = (statusId === 'ATE-PEN' || statusId ==='ATE-GENP') && pending;
            if (isApprovedStatus || isPendingStatus) {
              const targetStatus = isApprovedStatus ? 'ATE-PEN' : 'ATE-COM';
              const permission = isApprovedStatus ? permission1 : permission2;
              this.commonService.getLatestTransferDetail(assetData.id).subscribe(latest => {
                let sourceId = latest.results.transferType == "TRT-DEP" ? assetData.ownerDepartmentId : latest.results.transferType == "TRT-FAC" ? localStorage.getItem(btoa('facilityId')) : assetData?.homeLocationId;
                const jsondata = {
                  transferType: latest.results.transferType,
                  transferId: latest.results.transferId,
                  sourceIdentifier: sourceId,
                  destinationIdentifier: latest.results.transferId,
                  assetTransferType: assetData.assetTransferTypeId,
                  eventId: 'ATT-ACEV',
                  eventStatusId: targetStatus,
                  id: assetData.id,
                  isExcludeParent: false,
                  linkedAssets: [],
                  comments: null
                };
                if (permission) {
                  this.getAssetTransferDetails(assetData, jsondata);
                } else {
                  this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
                }
              });
            }else{
              this.loading = false;
              this.toastr.warning('Warning', 'The User doesnot have Permission to acknowledge Asset');
            }
          });
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
    }
  }

  getAssetTransferDetails(event, jsondata) {
    this.commonService.getAssetTransferDetails(event.id, event.assetTransferTypeId).subscribe(details => {
      const dialogRef = this.dialog.open(ManageAssetComponent, {
        panelClass: ['small-popup'],
        disableClose: true,
        data: {
          assetdata: jsondata,
          assetInfo: event,
          transferData: details.results
        }
      });
      dialogRef.afterClosed().subscribe(result => {
      });
    });
  }

  navigateToGatepass(data) {
    if ( data?.nonPerformerId ) {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results?.[0];
          assetData['gatePassStatusId'] = data.activityCategoryId == 'AC-GEXP' ? 'ATE-GISD' : data.activityCategoryId == 'AC-GPENP' ? 'ATE-GEXP' : null
          this.manageEventGatePass(assetData);
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
    }
  }

  manageEventGatePass(data) {
    this.commonService.getLatestTransferDetail(data.id).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP" ? departmentIds.includes(Number(department.results.sourceTransferId)) : true;
      if (!isApproved) {
        this.toastr.warning('Warning', 'User does not have permission to authorize Gatepass for this asset');
        return;
      }
      this.manageGetAllAsset(data, department);
    })
  }

  manageGetAllAsset(data, department) {
      let rowData
    this.configurationService.getAllAsset(data.id).subscribe(res => {
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
      }
      const isTransfer = data.assetTransferTypeId === 'ATT-TR';
      let sourceId = department.results.sourceTransferId;
      let source = department.results.sourceTransferName;
      let destinationId = department.results.transferId;
      let destination = department.results.transferName;
      rowData['transferType'] = department.results.transferType,
      rowData['sourceIdentifier'] = isTransfer ? sourceId : destinationId;
      rowData['destinationIdentifier'] = isTransfer ? destinationId : sourceId;
      rowData['assignedLocationName'] = isTransfer ? destination : source;
      rowData['homeLocationName'] = isTransfer ? source : destination;
      rowData['isGatePassIssued'] = true;
      rowData['hideButton'] = data.gatePassStatusId === 'ATE-GENP' ? true : false;
      rowData['gatePassStatusId'] = data.gatePassStatusId ?? null;
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(result => {
      });
    });
  }

  hasEvent(alertDetails: any[]): boolean {
    return alertDetails?.some(item => ((item.identifyingType === 'Event'|| item.identifyingType === 'SensorType') && (item.identifyingValue === 'CE-TAM' || item.identifyingValue === 'CE-WRP'|| item.identifyingValue === 'DVIT-TEMP' || item.identifyingValue === 'DVIT-HUM')));
  }

  openCameraView(notification: any) {
    const locationDetail = notification?.alertDetails?.find((x: any) => x.identifyingType === 'Location');
    const locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;

    if (!locationId) {
      this.toastr.warning('Warning', 'No location found for this notification.');
      return;
    }

    this.commonService.getConnectivityAssets(locationId).subscribe({
      next: (res: any) => {
        const results: any[] = res?.results || [];
        const cctvAssets = results.filter((item: any) => item.assetTypeId === 'AT-CCTV');

        if (!cctvAssets.length) {
          this.toastr.warning('Warning', 'No camera available for this location.');
          return;
        }

        const cameras = cctvAssets.reduce((acc: any[], item: any) => {
          try {
            const outputData = JSON.parse(item.outputDate);
            const streamUrl = outputData?.streamUrl;
            if (streamUrl) {
              acc.push({
                id: item.id,
                name: item.name,
                streamUrl,
                playUrl: outputData?.playUrl,
                streamName: outputData?.streamName || item.name,
                locationName: item.locationName || ''
              });
            }
          } catch {
            // skip assets with invalid outputDate
          }
          return acc;
        }, []);

        if (!cameras.length) {
          this.toastr.warning('Warning', 'Camera stream URL is not configured for this location.');
          return;
        }

        this.dialog.open(NotificationCameraViewComponent, {
          width: '72vw',
          height: '90vh',
          data: { cameras, locationName: cctvAssets[0]?.locationName || '' },
          disableClose: false
        });
      },
      error: (err: any) => {
        this.toastr.error('Error', err?.error?.message || 'Failed to fetch camera data.');
      }
    });
  }

  private debouncedMqttRefresh() {
    if (this.mqttRefreshTimer) {
      return;
    }
    this.mqttRefreshTimer = setTimeout(() => {
      this.mqttRefreshTimer = null;
      this.refreshNotification();
    }, this.mqttRefreshDelay * 1000);
  }

}

@Pipe({
  name: 'timeAgo',
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string): string {
    const currentTime = new Date();
    const inputTime = new Date(value);
    const differenceInMilliseconds = currentTime.getTime() - inputTime.getTime();
    if (differenceInMilliseconds < 0) {
      return 'Just now';
    }

    const seconds = Math.floor(differenceInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (hours < 24) {
      if (hours === 0) return `${minutes} minutes ago`;
      return `${hours} hours ago`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (weeks < 4) {
      return `${weeks} weeks ago`;
    } else {
      return inputTime.toLocaleString('default', { month: 'short' } ) + ' ' + inputTime.getDate() + (inputTime.getFullYear() != currentTime.getFullYear() ? ', ' + inputTime.getFullYear() : '');
    }
  }
}
