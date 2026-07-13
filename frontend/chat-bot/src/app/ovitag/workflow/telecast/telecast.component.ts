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

import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { UploadScheduleComponent } from './upload-schedule/upload-schedule.component';

@Component({
  selector: 'app-telecast',
  templateUrl: './telecast.component.html',
  styleUrls: ['./telecast.component.scss']
})
export class TelecastComponent implements OnInit {

  public date = this.datepipe.transform(new Date(), 'yyyy-MM-dd')
  public selectedValue = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  today: any;
  day: string;
  telecastList: any = [];
  launch: any = [];
  play = false;
  contenTitle: any;
  upcomingTelecastList: any = [];
  upcomingPlay: boolean = false;
  upcomingContenTitle: any;
  upcomingLaunch: any;

  constructor(public datepipe: DatePipe, public commonService: CommonService, public dialog: MatDialog,) { }

  ngOnInit(): void {
    this.today = this.date === this.selectedValue;
    if(this.today){
      this.day = 'Today'
    }
    this.getAllTelecast()
  }

  getAllTelecast(){
    this.commonService.getTodayTeleShedu(this.selectedValue).subscribe(res => {
      this.telecastList = res.results.data;
    })
    let nextDate = new Date().setDate(new Date().getDate() + 1)
    let nextDateStr = this.datepipe.transform(nextDate, 'yyyy-MM-dd');
    this.commonService.getTodayTeleShedu(nextDateStr).subscribe(res => {
      this.upcomingTelecastList = res.results.data;
    })
  }

  playVideo(data){
    this.launch = data.sourceUrl;
    this.contenTitle = data.title;
    this.play = true;
  }
  upcomingPlayVideo(data){
    this.upcomingLaunch = data.sourceUrl;
    this.upcomingContenTitle = data.title;
    this.upcomingPlay = true;
  }

  uploadRequest(data) {
    const dialogRef = this.dialog.open(UploadScheduleComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.getAllTelecast()
     });
  }
  fixClick() {
    console.log('')
  }  
}
