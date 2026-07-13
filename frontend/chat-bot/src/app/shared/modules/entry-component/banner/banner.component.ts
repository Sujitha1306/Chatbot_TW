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

import { Component, EventEmitter, Inject, Input, Output, } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MaskDataPipe } from '../../../pipes/mask-data.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent  {
  public enableInfo = true;
  public enablePatInfo = true;
  @Input() bannerData: any;
  @Input() type:any;
  @Output() bannerAction = new EventEmitter<any>();
  currentYear = new Date().getFullYear();
  mappedBannerData: { label: string, value: any }[] = [];
  bannerInfo: any
  resendItem: { label: string; value: any; };

  constructor(public thisDialogRef: MatDialogRef<BannerComponent>,public dialog: MatDialog,@Inject(MAT_DIALOG_DATA) public data: any,
   private readonly maskData: MaskDataPipe,  public datepipe: DatePipe) {
  }

  ngOnInit(): void {
    console.log(this.bannerData)
    if (this.bannerData != null && this.bannerData != undefined) {
      this.bannerInfo = this.bannerData?.banners?.bannerInfo;
      const row = this.bannerData?.banners?.bannerSecondRow;
      const labels = this.bannerData?.banners?.bannerSeconRowLable || [];
      this.mappedBannerData = labels
        .map(label => {
          const value = this.getMappedValue(label.code);
          return { label: label.value, value };
        })
        .filter(item => this.isValidValue(item.value));
    }
    this.resendItem = this.mappedBannerData?.find(item => item.label === 'Resend');
  }
  ngOnChanges() {
    if (this.bannerData != null && this.bannerData != undefined) {
      this.bannerInfo = this.bannerData?.banners?.bannerInfo;
      const row = this.bannerData?.banners?.bannerSecondRow;
      const labels = this.bannerData?.banners?.bannerSeconRowLable || [];
      this.mappedBannerData = labels
        .map(label => {
          const value = this.getMappedValue(label.code);
          return { label: label.value, value };
        })
        .filter(item => this.isValidValue(item.value));
    }
    this.resendItem = this.mappedBannerData?.find(item => item.label === 'Resend');
  }


  isValidValue(value: any): boolean {
    return value !== null &&
      value !== undefined &&
      value !== false &&
      !(typeof value === 'string' && value.trim() === '');
  }
  calculateAge(dob) {
    let year = new Date(dob).getFullYear();
    return this.currentYear - year;
  }

  getMappedValue(code: string): any {
    const row = this.bannerData?.banners?.bannerSecondRow;
    if (!row) return '';
    const simpleMap: Record<string, any> = {
      id: row.id,
      surgeon: row.doctorName,
      surgeryName: row.otProcedureName,
      PackageName: row.packageName,
      uhid: row.uhid,
      TokenNo: row.token_no,
      visitDetails: row.visitTypeId ? `${row.visitTypeId} (${[ row.visitIdentifier, row.visitDate ].filter(val => val != null).join(', ')})` : null,
      doctor: row.consultantName?.trim() || null,
      tagId: row.tagId,
      visittagID: row.patientVisitTagId,
      location: row.locationName,
      discharge: row.discharge,
      healthPlanName: row.healthPlanName,
      consultantName: row.doctorName,
      refresh: row.refresh,
      resend: row.resendMessage,
      diabetic: row.isDiabetic,
      fasting: row.isFasting,
      vulnerable: row.isVulnerable,
      pregnant: row.isPregnant,
      alertStatus: row.alerts,
      currentLocationName: row.currentLocationName,
      department: row.department,
      purchase: row.purchase,
      status: row.status,
      users : row.users,
      deliveredDatetime: this.datepipe.transform(row.deliveredDatetime, 'yyyy-MM-dd') || 'N/A',
      ScheduleStartTime: this.datepipe.transform(row.patientfromTime, 'yyyy-MM-dd HH:mm') || 'N/A',
    };
    return simpleMap[code] ?? '';
  }

  eventTrigger(key, data) {
    this.bannerAction.emit({ key, data });
  }
  fixClick() {
    console.log('')
  }  
}
