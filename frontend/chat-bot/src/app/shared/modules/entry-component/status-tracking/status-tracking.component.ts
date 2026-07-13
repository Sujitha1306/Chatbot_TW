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

import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { locale_Json_Details } from '../../../../../localeJson/localeJson';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../services';

@Component({
  selector: 'app-status-tracking',
  templateUrl: './status-tracking.component.html',
  styleUrls: ['./status-tracking.component.scss']
})
export class StatusTrackingComponent implements OnInit {
  @Input() statusDetails;
  @Input() trackLineData;
  @Input() attachment;
  public tktHistoryData: any;
  openLabeltext: string;
  updateLabeltext: string;
  // public trackLineData: any;
  

  constructor(public dialog: MatDialog,@Inject(MAT_DIALOG_DATA) public data: any,) { }

  ngOnInit(): void {
    this.tktHistoryData = this.statusDetails;

    const locale = localStorage.getItem(btoa('lang'))
      if(locale === 'en-US' || locale === 'en'){
        this.openLabeltext = locale_Json_Details.en.ticketCreater;
      } else if(locale === 'ar'){
        this.openLabeltext = locale_Json_Details.ar.ticketCreater;
      }

      if(locale === 'en-US' || locale === 'en'){
        this.updateLabeltext = locale_Json_Details.en.ticketUpdated;
      } else if(locale === 'ar'){
        this.updateLabeltext = locale_Json_Details.ar.ticketUpdated;
    }
  }

  lightboxView(data,type){
    let key = { 'url': data, 'type': type}
    const dialogRef = this.dialog.open(LightboxOnlineMenuComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: key, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
   fixClick() {
     console.log('')
   }
}

@Component({
  selector: 'lightbox-dialog',
  templateUrl: 'lightbox-dialog-component.html',
})
export class LightboxOnlineMenuComponent implements OnInit {
  urlSafe: SafeResourceUrl;
  isDownload: boolean = false;
  selectedFontSize = 16;
  barcodearray =[];
  type = null;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public sanitizer: DomSanitizer, public dialogRef: MatDialogRef<any>, public commonService : CommonService) { }

  ngOnInit() {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
    if(this.data && this.data.hasOwnProperty('type')) {
      this.type = this.data.type;
    }
    this.generateQrcode();
  }

  downloadPreview(){
    this.isDownload = true;
    setTimeout(() =>  this.isDownload = false, 100);
  }
  generateQrcode() {
    this.barcodearray = []; 
    this.commonService.getRandomCode().subscribe(res => {
      console.log(res)
      if(res.statusCode == 1) {
        let locValue: any;
        locValue = JSON.stringify({
            "env": environment.env_key,
            "base_url": environment.api_base_url_new,
            "ui_url": window.location.origin +"/",
            "facility_id": localStorage.getItem(btoa('facilityId')),
            "region_id": localStorage.getItem('regionId'),
            "customer_id": localStorage.getItem('customerId'),
            "facility_name": localStorage.getItem(btoa('customer')),
            // "token" : res.results.code
          })
        this.barcodearray.push(locValue);
      }
    })
    
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
  fixClick() {
    console.log('')
  }
}
