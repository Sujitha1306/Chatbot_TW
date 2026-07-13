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
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup,  } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigurationService } from '../../../services/configuration.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-alert-information',
  templateUrl: './alert-information.component.html',
  styleUrls: ['./alert-information.component.scss']
})
export class AlertInformationComponent implements OnInit {
  public alertHistoryForm: FormGroup;
  AlertdataSource: MatTableDataSource<any>;;
  alertdisplayedColumns: string[] = ["S.No", "sentDatetime", "channelName", "message", "recipientName"];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  pageSize:number=10;
  pageStart:number=0; 
  length: any = 0;
  pageHit = false;

  constructor(private readonly fb: FormBuilder, private readonly dateFormat: DatePipe, @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService) { }

  ngOnInit(): void {
    this.buildForm()
    this.getAlertsDetails()
  }

  buildForm() {
    this.alertHistoryForm = this.fb.group({
      pfRuleName: [this.data? this.data.event.data.pfRuleName : null],
      alertDatetime: [this.data? this.data.event.data.alertDatetime : null],
      pfAlertConfigName: [this.data? this.data.event.data.pfAlertConfigName : null],
      isActive: [this.data? this.data.event.data.isActive : null]
    });
  }
  getAlertsDetails(){
    this.configurationService.getAlertDetails(this.data.event.data.id,this.data.alertData,this.pageSize,this.pageStart).subscribe(res => {
      this.pageHit = true;
      this.AlertdataSource = res.results;
      this.length = res.totalRecords;
    })
  }
  eventTriggers(event){
    this.pageStart = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.getAlertsDetails();
  }
}
