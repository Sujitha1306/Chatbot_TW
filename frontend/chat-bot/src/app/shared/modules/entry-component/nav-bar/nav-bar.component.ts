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

import { Component, ViewEncapsulation } from '@angular/core';
import { CommonService, HospitalService } from '../../../services';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PorterRequestNewComponent } from '../porter-request/porter-request.component';
import { CreatePwaTicketComponent } from '../create-pwa-ticket/create-pwa-ticket.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ManagePwaTaskComponent } from '../pwa/manage-pwa-task/manage-pwa-task.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class NavBarComponent {
 public userName = null; 
 public facilityName = null;
 porterdata : any;
 public scannerEnabled: boolean = true;
 public information: any;
 public currentUrl = 'ovitag/configuration/bar-code';
 porterData : any;
 locData: any;
 isDisabled: boolean = true;
 userId = null;
 roleId =null;
  activate_btn: any[] = [];

  constructor(public common: CommonService, private readonly dialog: MatDialog, private readonly router: Router, public hospitalService: HospitalService,
              private readonly bottomSheet: MatBottomSheet) {
    this.activate_btn = this.common.getActivePermission('button');
  }

  ngOnInit() {
    this.userName = localStorage.getItem(btoa('current_user'));
    this.facilityName = localStorage.getItem('Y3VzdG9tZXI=');
    this.userId = localStorage.getItem(btoa('userId'));// Get login userId
    this.roleId = localStorage.getItem('userlevel');// Get login userRole
  }
  get firstLetter(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : '';
  }
  createPorter(data) {
    this.porterdata = data;
    const dialogRef = this.dialog.open(PorterRequestNewComponent, { data: '', maxWidth: '80vh !important',
      maxHeight: '99vh',
      panelClass:'mob-costomize-popup',
      disableClose: false });
  }
  scanSuccessHandler(event: any) {
    this.scannerEnabled = false;
    this.information = event;
    const jsonData = JSON.parse(event);
    let customerId = jsonData.customer_id;
  }
  enableScanner() {
    this.information = '';
    this.scannerEnabled = !this.scannerEnabled;
  }
openQRCodeDialog(data) {
  this.router.navigate(['web/qr-scan']);
}
redirectTo(page) {
  if(page == 'asset') {
    this.router.navigate(['web/pwa-asset']);
  } else if(page == 'task') {
    this.router.navigate(['web/pwa-task']);
  }
}
openPorterRqs(event){
  this.porterData = event;
  const dialogRef = this.dialog.open(PorterRequestNewComponent,{
    maxWidth: '80vh !important',
    data: '',
    panelClass:['mob-costo-popup'],
    disableClose: true
    });
  dialogRef.afterClosed().subscribe(result => {
  });
}
  onItemClick(event): void {
    let guestUser = localStorage.hasOwnProperty(btoa('guestInfo'));
    if (!guestUser) {
       const data = {};
      data['requestedType'] = 'RQT-TASK';
      const bottomSheetRef = this.bottomSheet.open(ManagePwaTaskComponent,
        { data: [data], panelClass: 'custom-bottom-sheet' });
      bottomSheetRef.afterDismissed().subscribe((result) => {});
    } else {
      this.locData = event
      const dialogRef = this.dialog.open(CreatePwaTicketComponent, {
        maxWidth: '80vh !important',
        data: {
          activityId: null,
          activityName: null,
          locationId: null,
          locationName: null,
          assetId: null
        },
        panelClass: ['mob-costomize-popup-task'],
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
      });
    }
  }
  fixClick() {
    console.log('')
  }
}
