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

import { Component, Inject, OnInit } from '@angular/core';
import { CommonService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-pharmacy-task',
  templateUrl: './pharmacy-task.component.html',
  styleUrls: ['./pharmacy-task.component.scss']
})
export class PharmacyTaskComponent implements OnInit {

  public applyFilterValue: any;
  permissionControl = ["BT_ALLE"];
  DisplayedColumns: string[] = ['Ack','Package','Patient Name' ,'Location','Status','Remarks','Order Time','Delivered Time','Ack Time','Category'];
  public tableData: any = [];
  public requestId=null;
  constructor(public commonService: CommonService,@Inject(MAT_DIALOG_DATA) public data: any, public dialog : MatDialog) { 
    if(data){
      this.requestId = data['reqId'];
    }
  }

  ngOnInit(): void {
    this.getRequestDetails();
  }

  getRequestDetails(){
    let serviceGroupId = 'SG-PH';
    let type = this.data.type ? this.data.type : 'TAT-PA';
    this.commonService.getPharmacyRequestDetails(type,this.requestId,serviceGroupId).subscribe((res) => {
      let result = res.results;
      this.tableData = res.results;
      const Columns = ['acknowledgedByName','externalIdentifier', 'performerName','perfLocFullName', 'statusName','acknowledgedComments','externalTime','completedTime','acknowledgeTime','category'];
      if(type == 'LOC') {
        this.DisplayedColumns = this.DisplayedColumns.map(item => item.replace("Patient Name", "Location Name"));
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.DisplayedColumns[i]] = data[Columns[i]];
          if (Columns[i] == 'isPartiallyCompleted') {
            data[this.DisplayedColumns[i]] = data[Columns[i]] == true ? 'Yes' : data[Columns[i]] == false ? 'No' : data[Columns[i]];
          }
        });
      }
    })
  }
  eventAction(event) {
    console.log(event)
    if(event.key == 'rdAck'){
      this.requestDetailAck(event.data);
    } 
  }
  requestDetailAck(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true, height : "330px",width : "600px",
      data: {
        title: "Send Acknowledgement", 
        message: "The package " + (data.comments ? "("+ data.comments +")" : "") + " has been acknowledged as arrived at " + data.perfLocFullName,
        customMsg : true,
        buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0, pharmacyAck: true,
        isPartiallyCompleted : data.hasOwnProperty('isPartiallyCompleted')?data['isPartiallyCompleted']:null,
        acknowledgedComments : data.hasOwnProperty('acknowledgedComments')?data['acknowledgedComments']:null,
        ackUser: data.hasOwnProperty('comments')?data['comments']:null,
        'isPharmacyOtp': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result['confirmButtonText'] == 'Yes'){
        let postData = [{
          "acknowledgedComments" : result['acknowledgedComments'],
          "isPartiallyCompleted" : result['isPartiallyCompleted'],
          "comments" : result['userName'],
          "requestDetailId" : data.id
        }]
        this.commonService.reqDetailAck(postData).subscribe(res => {
          if(res.statusCode == 1) {
            this.getRequestDetails();
          }
        })
      }
    });
  }
  
}
