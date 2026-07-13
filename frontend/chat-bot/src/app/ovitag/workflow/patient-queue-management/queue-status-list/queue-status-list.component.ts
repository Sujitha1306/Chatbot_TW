import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CommonService, DashboardService, WorkflowService } from '../../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'queue-status-list',
  templateUrl: './queue-status-list.component.html',
  styleUrls: ['./queue-status-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QueueStatusListComponent implements OnInit {
  Inprogressmenu:any[];
    waitingmenu:any[];
    pendingmenu:any[];
    dynamicConfig = false;
    @Input() currentStatus: any;
    @Input() locationId: any;
    @Input() queueId: any;
    @Input() parallelIds: any;
    @Input() isParalelTestIncluded: any;
    @Input() locationPending: boolean;
    @Input() dqtowerconfig: any;
    @Input() patientTestDetail: any;
    @Input() changeLocation: any
    @Output() updateStatus = new EventEmitter<string>();
    @Output() isParallel = new EventEmitter<any>();
    @Input() visitTypeId :any;
    testAvailableLocation: any=[];
    isMenuOpen: boolean = false
  
    constructor(private readonly workflowService :WorkflowService, public commonService: CommonService,
      private readonly dashboardService: DashboardService, private readonly dialog: MatDialog,public toastr: AppToastService) {
    }
  
    ngOnInit() {
      /** determines the old one this.getdqtowerconfig();*/
    }

    onMenuToggle(state: boolean): void {
      this.isMenuOpen = state;
      if(this.isMenuOpen){
        this.getdqtowerconfig()
      }
    }
    
    getdqtowerconfig() {
      console.log(this.dqtowerconfig)
        if(this.dqtowerconfig) {
          this.dynamicConfig = true;
          this.Inprogressmenu = this.dqtowerconfig['Inprogress-menu']; 
          this.waitingmenu = this.dqtowerconfig['Waiting-menu']; 
          this.pendingmenu = this.dqtowerconfig['Pending-menu']; 
        }
      }
    changeStatus(id, status, actionType ?: string) {
      let testStatus = status;
      if (this.visitTypeId === 'VT-TK') {
        const locationId1 = this.locationId;
        console.log(locationId1)
        let updateTokenData = {};
        if (status === 'QS-IP' || status === 'QS-CO' || status ==='QS-WT') {
          updateTokenData = {
          locationId: this.locationId,
          queueStatusId: status
          };
        } else {
          console.log('pending log')
          updateTokenData = {
          locationId: null,
          queueStatusId: 'QS-PE'
          };
        }
        this.workflowService.updateToken(id, updateTokenData).subscribe(
          res => {
          this.toastr.success('Success', `${res.message}`);
          this.updateStatus.emit('updated');
          this.isParallel.emit(true);
          },error => {
          this.toastr.error('Error', `${error.error.message}`);
          });
      } else {
        this.updateQueueStatus(actionType, status, testStatus, id);
      }
    }
    updateQueueStatus(actionType, status, testStatus, id) {
      if (actionType === 'review' || actionType === 'remarks') {
        this.reviewAction(actionType, id, status);
      } else {
        const code = 'QS-WT';
        if(status === code || actionType === 'Loc') {
          this.commonService.getHealthTestAvailableLocation(this.patientTestDetail?.testType, this.patientTestDetail?.testId).subscribe(res => {
          this.testAvailableLocation = res.results;
            this.updateQueueDetails(actionType, status, testStatus, id);
          });
        } else {
          const codePen = 'QS-PE';
          if (status === codePen) {
            status = { 'statusId': status, 'locationId': null };
          } else {
            status = { 'statusId': status, 'locationId': this.locationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded};
          }
          this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
            this.updateStatus.emit('updated');
            this.isParallel.emit(true);
          }, error =>  {
            this.toastr.warning('Warning', `${error.error.message}`);
            const info = JSON.parse(error.error.additionalInfo);
            if(error.error.errorCode === "TWAPI54") {
              this.changeExistingTestStatus(status, info, testStatus, id);
            }
          });
        }
      }
    }
    reviewAction(actionType, id, status) {
      let msg = '';
      if (actionType === 'review') {
        msg = 'Select a review date and time';
      } else {
        msg = 'Are you looking to checkout?';
      }
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirmation', message: msg,
          buttonText: { ok: 'Confirm', cancel: 'Cancel' },
          'statusId': status, 'locationId': parseInt(this.locationId, 10), 'reviewDate': actionType === 'review',
          'queueId': id, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded, 'isRemark': actionType === 'review' ? 1 : 0
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.updateStatus.emit('updated');
          this.isParallel.emit(true);
        }
      });
    }
    updateQueueDetails(actionType, status, testStatus, id) {
      if (this.testAvailableLocation?.length > 1) {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass: ['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Confirmation', message: actionType === 'Loc' ? 'Select the option to change the test location' :
              'Select the location to change the status to waiting',
            buttonText: { ok: 'Confirm', cancel: 'Cancel' },
            'testId': this.patientTestDetail?.testId, 'testType': this.patientTestDetail?.testType, testLocationId: this.patientTestDetail?.testLocationId, 'patientQueueId': id,
            'statusId': status, 'testAvailableLocation': this.testAvailableLocation, testLocation: true, 'isRemark': 1
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result?.locId !== null && result !== 'No' && result !== '') {
            if (result?.statusId && result?.statusId !== null) {
              status = { 'statusId': result?.statusId, 'locationId': result?.info?.testLocationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
              this.dashboardService.updatePatientQueueStatus(result?.info?.queueId, status).subscribe(res => {
                if (res.statusCode === 1) {
                  status = { 'statusId': testStatus, 'locationId': result?.locId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
                  this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
                    this.updateStatus.emit('updated');
                    this.isParallel.emit(true);
                  }, error => {
                    this.toastr.warning('Warning', `${error.error.message}`);
                  });
                }
              }, error => {
                this.toastr.warning('Warning', `${error.error.message}`);
              });
            } else {
              console.log(result)
              status = { 'statusId': status, 'locationId': result?.locationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
              this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
                this.updateStatus.emit('updated');
                this.isParallel.emit(true);
              }, error => {
                this.toastr.warning('Warning', `${error.error.message}`);
              });
            }
          }
        });
      } else if (this.testAvailableLocation?.length === 1 && status !== 'Loc') {
        status = { 'statusId': status, 'locationId': this.testAvailableLocation[0]?.id, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
        this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
          this.updateStatus.emit('updated');
          this.isParallel.emit(true);
        }, error => {
          this.toastr.warning('Warning', `${error.error.message}`);
          const info = JSON.parse(error.error.additionalInfo);
          if (error.error.errorCode === "TWAPI54") {
            this.changeExistingTestStatus(status, info, testStatus, id);
          }
        });
      } else {
        this.toastr.warning('Warning', `Multiple Location not available`);
      }
    }
    changeExistingTestStatus(status, info, testStatus, id) {
      let queueStatus = [];
      this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
        queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code === 'QS-CO');
        if(info?.status !== 'QS-IP') {
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
          if (result?.locationId !== null && result !== 'No' && result !== '') {
            if (result?.statusId && result?.statusId !== null) {
              status = { 'statusId': result?.statusId, 'locationId': info?.testLocationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
              this.dashboardService.updatePatientQueueStatus(info?.queueId, status).subscribe(res => {
                if (res.statusCode === 1) {
                  status = { 'statusId': testStatus, 'locationId': this.patientTestDetail?.testLocationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
                  this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
                    this.updateStatus.emit('updated');
                    this.isParallel.emit(true);
                  }, error => {
                    this.toastr.warning('Warning', `${error.error.message}`);
                  });
                }
              }, error => {
                this.toastr.warning('Warning', `${error.error.message}`);
              });
            } else {
              status = { 'statusId': status, 'locationId': result?.locationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
              this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
                this.updateStatus.emit('updated');
                this.isParallel.emit(true);
              }, error => {
                this.toastr.warning('Warning', `${error.error.message}`);
              });
            }
          }
        });
      });
    }
    fixClick() {
      console.log('')
    }
}
