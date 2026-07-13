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

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { DatePipe } from '@angular/common';
import { AcknowledgementComponent } from '../../entry-component/acknowledgement/acknowledgement.component';
import { MatDialog } from '@angular/material/dialog';
import { WorkflowManagementComponent } from '../workflow-management/workflow-management.component';

@Component({
  selector: 'app-alert-info',
  templateUrl: './alert-info.component.html',
  styleUrls: ['./alert-info.component.scss']
})
export class AlertInfoComponent {
  displayedColumns: string[] = ['Alert','Config','Event','Description','UHID','Patient Name','Create Time','Ack','Ack Time','Ack Comments','Close Time','Status','Act'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = ['S.No','Status','Create Time','Ack Time','Close Time'];
  sortColumn = ['S.No'];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLEN'];
  tableData: any;
  public applyFilterValue: any;
  today = new Date();
  public selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  @Input() headerEventData: any;
  constructor(private readonly commonService: CommonService,public datepipe: DatePipe,private readonly dialog: MatDialog) {}


  ngOnChanges(changes: SimpleChanges) {
    if(this.headerEventData?.key === 'refreshPage'){
      this.getAlertInfo();
    } else if (this.headerEventData?.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(this.headerEventData.data, 'yyyy-MM-dd');
      this.getAlertInfo();
    } else if (this.headerEventData?.key === "applyFilter") {
      this.applyFilterValue = this.headerEventData.data;
    } else {
      this.getAlertInfo();
    }
  }
    
  getAlertInfo(){
    let ruletype = 'RU-NC';
    this.commonService.getAllAlertInfo(ruletype,this.selectedDate).subscribe((res)=>{
      this.tableData = res.results;
       const Columns = ['pfRuleName','pfAlertConfigName', 'eventName','message', 'identifier', 'name', 'alertDatetime','','ackDatetime','comments','closedDatetime','isActive'];
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map(data => {
           data[this.displayedColumns[i]] = data[Columns[i]];
         });
       }
    });
  }
  eventAction(event) {
    let data = {};
    data['iotAlertId'] = event.data?.id;
    data['ackTime'] = event.data?.ackDatetime;
    if(event.key === 'rdAck'){
      const dialogRef = this.dialog.open(AcknowledgementComponent, {
        width: '600px', height: '300px', panelClass: 'pop-up-margin',
        data: data
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result){
          this.getAlertInfo();
        }
      });
    } else if(event.key === 'createTask'){
      data['type'] = 'RQT-NC';
      data['description'] = event.data?.message;
      data['permissionTab'] = ['Task']
      const dialogRef = this.dialog.open(WorkflowManagementComponent, {
        data: data, panelClass: ['large-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
      });
    }
  }

}
