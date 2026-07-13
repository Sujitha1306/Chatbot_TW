import { Component, Pipe, PipeTransform, ViewEncapsulation } from '@angular/core';
import { CommonService, ConfigurationService, PwaDetectionService, WorkflowService } from '../../../../services';
import { MatDialog } from '@angular/material/dialog';
import { PushNotificationsService } from '../../../../services/push.notification.service';
import { connect, MqttClient } from 'mqtt';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { PorterRequestNewComponent } from '../../porter-request/porter-request.component';
import { TaskManagmentComponent } from '../../task-managment/task-managment.component';
import { ManageAssetComponent } from '../../manage-asset/manage-asset.component';
import { ManagePwaTaskComponent } from '../manage-pwa-task/manage-pwa-task.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-pwa-notification',
  templateUrl: './pwa-notification.component.html',
  styleUrls: ['./pwa-notification.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PwaNotificationComponent {

  public isOpen: boolean = false;
  public tabs: any[] = [
    { tabName: 'All', count: 0, code: 'all' },
    { tabName: 'Alert', count: 0, code: 'alert' },
    { tabName: 'Message', count: 0, code: 'msg' },
    { tabName: 'Reminder', count: 0, code: 'reminder' }
  ]
  public filterOptions: any[] = [
    { value: 'Read', code: true },
    { value: 'Unread', code: false }
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
  size = 5;
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
  isPwa: boolean = false;
  performerId = null;

  constructor( private readonly commonService: CommonService, public dialog: MatDialog, public toastr: AppToastService,private readonly bottomSheet: MatBottomSheet,
      private readonly configurationService: ConfigurationService, private readonly workflowService: WorkflowService,private readonly _notificationService: PushNotificationsService,
      public pwaDetectionService : PwaDetectionService) {
      this.getconfigData('alert-sound')
      this._notificationService.requestPermission();
      this.activate_btn = this.commonService.getActivePermission("button");
      }

  ngOnInit(): void {
    this.isPwa = this.pwaDetectionService.isPwa();
    this.notificationOpen();
    this.getNotification(this.loginUserId, this.selectedTab);
    this.getNotificationCount();
    this.getRuleFilter();
    this.getMqtt();
  }

  refreshNotification() {
    this.getNotification(this.loginUserId, this.selectedTab);
    this.getNotificationCount();
  }
  getMqtt() {
    if (this._client) {
      this._client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res => {
      if (res.results != null && res.results.length) {
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

        if (alert_data['ctx'] === 'Alert') {
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
    if (alert_data.data.length && alert_data.data[0]['recipientUserIds'] != null && alert_data.data[0]['recipientUserIds'].includes(userId)) {
      this.refreshNotification();
    }
    this.newAlert(null, alert_data);
  }

  notify(value) {
    const data: Array<any> = [];
    let ruleTypeId = value.ruleTypeId;
    let image;

    if (ruleTypeId == "RU-GO" || ruleTypeId == "RU-DEF") {
      image = "/assets/Alert/defender.png";
    } else if (ruleTypeId == "RU-SD") {
      image = "/assets/Alert/social_distance.png";
    } else if (ruleTypeId == "RU-NC") {
      image = "/assets/Alert/nurse_call.png";
    } else if (ruleTypeId == "RU-FA") {
      image = "/assets/Alert/fall.png";
    } else if (ruleTypeId == "RU-MO") {
      image = "/assets/Alert/movement.png";
    } else if (ruleTypeId == "RU-MI") {
      image = "/assets/Alert/missing.png";
    } else if (ruleTypeId == "RU-AD") {
      image = "/assets/Alert/disassociate.png";
    }
    data.push({
      'title': 'Trackerwave',
      'alertContent': value.message,
      'sounds': this.alertSound
    });
    if (value.message) {
      this._notificationService.generateNotification(data, image);
    }
  }

  newAlert(notification, alert_data) {
    this.commonService.alertNotification(notification)
    if (alert_data) {
      let msg = [alert_data]
      this.commonService.notificationMsg(msg)
    }
  }
  getconfigData(key) {
    this.commonService.getConfigFile(key).subscribe(res => {
      if (res.statusCode == 1 && res.results) {
        this.alertSound = res.results.contentObject;
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

  notificationOpen() {
    this.hoverTimeout = setTimeout(() => {
      this.notificationTrigger();
    }, this.hoverDuration);
  }

  onMouseLeave(): void {
    clearTimeout(this.hoverTimeout);
  }

  notificationTrigger() {
    this.isOpen = true;
    this.selectedTab = 'all';
    this.getNotification(this.loginUserId, this.selectedTab);
  }

  applyFilter(selected) {
    if (selected === 'apply') {
      this.selectedSeen = this.isUnreadMsg
      this.selectedRule = this.isSelectedRule
      this.getNotification(this.loginUserId, this.selectedTab)
      this.isFilter = false;
    } else if (selected === 'filter') {
      this.isFilter = true;
    }

  }

  viewNotification(type, id) {
    if (type === 'open') {
      this.isPreview = true;
      const viewData = this.notificationData.find(val => val.id === id);
      if (viewData) {
        this.previewNotifiData = viewData;
        this.previewMessage = viewData.message
        // this.previewMessage = "<p style='font-family: Arial, sans-serif; font-size: 14px; color: #333;'> Dear User,<br><br> The asset <b><i>A1</i></b> identified by the serial number <span style='font-weight: bold; color: #007bff;'>100</span> has been successfully transferred from <span style='font-style: italic; color: #28a745;'>IT</span> to <span style='font-style: italic; color: #dc3545;'>Cardiology</span>. This process was initiated by <b>Sam Admin Admin</b> on <span style='font-family: 'Courier New', monospace;'><b>2025-02-08 05:59:24.0</b></span>. </p>"
        this.updateNotification('single', this.previewNotifiData)
      }
    } else {
      this.isPreview = false;
      this.previewNotifiData = null;
    }
  }

  formatTemplate(template: string): string {
    return template.replace(/\n/g, '<br>');
  }

  selectedFilter(type, key) {
    if (type === 'readFilter') {
      this.isUnreadMsg = key;
    } else if (type === 'ruleFilter') {
      this.isSelectedRule = key;
    } else {
      this.isUnreadMsg = this.selectedSeen;
      this.isSelectedRule = this.selectedRule;
      this.isFilter = false;
    }
  }

  getNotificationCount() {
    if(this.loginUserId) {
      this.commonService.getNotificationCount(this.loginUserId).subscribe(res => {
        let notificationCount = res.results;
        this.overAllcount = notificationCount[0].All > 100 ? '99+' : notificationCount[0].All;
        this.tabs = this.tabs.map(tab => {
          const match = notificationCount.find(result => Object.keys(result)[0] === tab.tabName);
          return { ...tab, count: match ? Object.values(match)[0] : tab.count };
        });
      })
    }
  }

  getNotification(id, tab?) {
    let type = tab === 'msg' ? 'notification' : null;
    let alertType = tab === 'alert' ? 'AT-AL' : tab === 'reminder' ? 'AT-RE' : null;
    let start = 0;
    this.commonService.getAllNotifications(id, start, this.size, false, type, this.selectedSeen, alertType, null, this.selectedRule).subscribe(res => {
      this.notificationData = res.results;
      let totalRecords = res.totalRecords;
      this.isMore = this.notificationData.length >= totalRecords;
      this.notificationInfo = this.notificationData.length ? this.notificationData : [];
    })
  }

  selectTab(event): void {
    this.selectedTab = event.code;
    this.selectedTabName = event.tabName;
    this.checkedNotifications.clear();
    this.getNotification(this.loginUserId, this.selectedTab)
  }

  moreNotifications() {
    this.size = this.size + 10;
    this.getNotification(this.loginUserId, this.selectedTab);
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

  acceptAck(data) {
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
      } else if (data.requestType === 'RQT-TASK' || data.requestType === 'RQT-ROU') {
        this.workflowService.getTaskById(data.identifyingId).subscribe(res => {
          const data = res.results[0];
          const type = 'modify';
          let Data = { id: data.performerId, nonPerformerId: data.nonPerformerId, entityDetail: data, type: type, contextType: data.requestCategoryId, formTemplateType: data.formTemplateType, disableIcon: true, requestId: data.requestId };
          Data['requestedType'] = 'RQT-TASK';
          this.isOpen = false
          const bottomSheetRef = this.bottomSheet.open(ManagePwaTaskComponent,
            { data: [Data], panelClass: 'custom-bottom-sheet' });
          bottomSheetRef.afterDismissed().subscribe((result) => {

          });
        });
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
          const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
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
}

@Pipe({
  name: 'timeAgo',
  pure: true
})
export class TimeAgoPipes implements PipeTransform {
  transform(value: string): string {
    const currentTime = new Date();
    const inputTime = new Date(value);
    const differenceInMilliseconds = currentTime.getTime() - inputTime.getTime();

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
      return inputTime.toLocaleString('default', { month: 'short' }) + ' ' + inputTime.getDate() + (inputTime.getFullYear() != currentTime.getFullYear() ? ', ' + inputTime.getFullYear() : '');
    }
  }

}
