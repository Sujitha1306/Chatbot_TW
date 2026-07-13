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
import { Component, ViewEncapsulation, OnInit, Input, Output, HostListener, ElementRef, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, DashboardService, WorkflowService } from '../../../shared';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
	selector: 'dq-list-menu',
	templateUrl: './list-menu.component.html',
	styleUrls: ['./list-menu.component.scss']
})
export class ListMenuComponent implements OnInit {
	Inprogressmenu:any[];
	waitingmenu:any[];
	pendingmenu:any[];
	dynamicConfig = false;
	encapsulation: ViewEncapsulation.None;
	isOpen = false;
	@Input() menu: boolean = false;
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
	isMenuOpen: boolean = false;

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

	constructor(private readonly elementRef: ElementRef, private readonly router: Router,private readonly workflowService :WorkflowService,
		public commonService: CommonService, private readonly dashboardService: DashboardService, private readonly dialog: MatDialog,public toastr: AppToastService) {
	}

	ngOnInit() {
		if(!this.menu){
			this.getdqtowerconfig();
		}
	}

	onMenuToggle(state: boolean): void {
      this.isMenuOpen = state;
      if(this.isMenuOpen){
        this.getdqtowerconfig()
      }
    }
	
	getdqtowerconfig() {
			if(this.dqtowerconfig) {
				this.dynamicConfig = true;
				this.Inprogressmenu = this.dqtowerconfig['Inprogress-menu']; 
				this.waitingmenu = this.dqtowerconfig['Waiting-menu']; 
				this.pendingmenu = this.dqtowerconfig['Pending-menu']; 
			}
	  }

	tokenStatusChange(id, updateTokenData) {
		this.workflowService.updateToken(id, updateTokenData).subscribe(
			res => {
				this.toastr.success('Success', `${res.message}`);
				this.updateStatus.emit('updated');
				this.isParallel.emit(true);
			}, error => {
				this.toastr.error('Error', `${error.error.message}`);
			});
	}

	changeStatus(id, status, actionType ?: string) {
		let testStatus = status;
		if (this.visitTypeId === 'VT-TK') {
			const locationId1 = this.locationId;
			let updateTokenData = {};
			if (status === 'QS-IP' || status === 'QS-CO' || status ==='QS-WT') {
				if(this.locationId != null) {
					updateTokenData = {
						locationId: this.locationId,
						queueStatusId: status
					};
					this.tokenStatusChange(id, updateTokenData);
				} else {
					this.commonService.getHealthTestAvailableLocation(this.patientTestDetail?.testType, null, 'TC-BILL').subscribe(res => {
						this.testAvailableLocation = res.results;
						if (this.testAvailableLocation?.length > 1) {
							let msg = '\nSelect the location to change the status for token' + ' ' + this.patientTestDetail?.visitTokenNo;
							const dialogRef = this.dialog.open(ConfirmationDialog, {
								panelClass: ['mdm-Confirmation-popup'], disableClose: true,
								data: {
									title: 'Confirmation', message: msg, customMsg: true,
									buttonText: { ok: 'Confirm', cancel: 'Cancel' },
									'updatePatientDetails': 'token', 'isRemark': 1, 'patientPendingLocation': true, 'testAvailableLocation': this.testAvailableLocation,
									statusToken: true
								}
							});
							dialogRef.afterClosed().subscribe(result => {
								if (result !== null && result !== 'No' && result !== '') {
									updateTokenData = {
										locationId: result,
										queueStatusId: status
									};
									this.tokenStatusChange(id, updateTokenData);
								}
							});
						} else if (this.testAvailableLocation?.length === 1) {
							updateTokenData = {
							locationId: this.testAvailableLocation[0].id,
							queueStatusId: status
							};
							this.tokenStatusChange(id, updateTokenData);
						}
					});
				}
			} else {
			  updateTokenData = {
				locationId: null,
				queueStatusId: 'QS-PE'
			  };
			  this.tokenStatusChange(id, updateTokenData);
			}
		  } else {
				if (actionType === 'review' || actionType === 'remarks') {
				let msg = '';
				if (actionType === 'review') {
					msg = 'Select a review date and time';
				} else {
					msg = 'Are you looking to checkout?';
				}
				const dialogRef = this.dialog.open(ConfirmationDialog, {
					panelClass:['mdm-Confirmation-popup'], disableClose: true,
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
			} else {
				if((this.currentStatus !== 'QS-IP' && status === 'QS-WT') || actionType === 'Loc') {
					this.commonService.getHealthTestAvailableLocation(this.patientTestDetail?.testType, this.patientTestDetail?.testId).subscribe(res => {
					this.testAvailableLocation = res.results;
						if (this.testAvailableLocation?.length > 1) {
							const dialogRef = this.dialog.open(ConfirmationDialog, {
								panelClass: ['mdm-Confirmation-popup'], disableClose: true,
								data: {
									title: 'Confirmation', message:actionType === 'Loc' ? 'Select the option to change the test location' + ' ' + 'for' + this.patientTestDetail?.patientName + " " + this.patientTestDetail?.uhid :
									'Select the location to change the status to waiting' + ' ' + 'for' + this.patientTestDetail?.patientName + " " + this.patientTestDetail?.uhid,
									buttonText: { ok: 'Confirm', cancel: 'Cancel' }, customMsg: true,
									'testId': this.patientTestDetail?.testId, 'testType': this.patientTestDetail?.testType, testLocationId: this.patientTestDetail?.testLocationId, 'patientQueueId': id,
            						'statusId': status, 'testAvailableLocation': this.testAvailableLocation, testLocation: true, 'isRemark': 1
								}
							});
							dialogRef.afterClosed().subscribe(result => {
								if (result?.locId !== null && result !== 'No' && result !== '' && result != undefined) {
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
										status = { 'statusId': status, 'locationId': result?.locationId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
										this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
											this.updateStatus.emit('updated');
											this.isParallel.emit(true);
										}, error => {
											this.toastr.warning('Warning', `${error.error.message}`);
										});
									}
								} else {
									this.updateStatus.emit('updated');
									this.isParallel.emit(true);
								}
							});
						} else if (this.testAvailableLocation?.length === 1 && status !== 'Loc') {
							status = { 'statusId': status, 'locationId':this.testAvailableLocation[0]?.id, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
							this.dashboardService.updatePatientQueueStatus(id, status).subscribe(res => {
								this.updateStatus.emit('updated');
								this.isParallel.emit(true);
							}, error => {
								this.toastr.warning('Warning', `${error.error.message}`);
								const info = JSON.parse(error.error.additionalInfo);
								if(error.error.errorCode === "TWAPI54") {
									this.changeExistingTestStatus(status, info, testStatus, id, this.testAvailableLocation[0]?.id);
								}
							});
						} else {
							this.toastr.warning('Warning', `Multiple Location not available`);
						}
					});
				} else {
					// status = {"patientStatusId": status}
					if (status === 'QS-PE') {
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
							this.changeExistingTestStatus(status, info, testStatus, id, this.locationId);
						}
					});
				}
			}
		}
	}
	changeExistingTestStatus(status, info, testStatus, id, locId) {
		let queueStatus = [];
		this.commonService.getAppTermsVerion2('QueueStatus').subscribe(res => {
			queueStatus = res.results.filter(filter => filter.code === 'QS-PE' || filter.code === 'QS-NR' || filter.code === 'QS-FL' || filter.code === 'QS-CO');
			if(info?.status !== 'QS-IP') {
				queueStatus = queueStatus?.filter(filter => filter.code !== 'QS-CO');
			}
			const dialogRef = this.dialog.open(ConfirmationDialog, {
				panelClass: ['mdm-Confirmation-popup'], disableClose: true,
				data: {
					title: 'Confirmation', message: 'Do you want to change the status of existing test\n' + '"' + info?.testName + '"' + ' in ' + info?.statusName + ' ' + 'for' + this.patientTestDetail?.patientName + " " + this.patientTestDetail?.uhid + ' ?',
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
								status = { 'statusId': testStatus, 'locationId': locId, 'queueIds': this.parallelIds, 'isParalelTestIncluded': this.isParalelTestIncluded };
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
