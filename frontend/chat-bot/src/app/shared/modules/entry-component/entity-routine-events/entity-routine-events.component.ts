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
import { ConfigurationService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TaskManagmentComponent } from '../task-managment/task-managment.component';

@Component({
  selector: 'app-entity-routine-events',
  templateUrl: './entity-routine-events.component.html',
  styleUrls: ['./entity-routine-events.component.scss']
})
export class EntityRoutineEventsComponent implements OnInit {
  routineEventList: any;
  routineId: any;
  entityActivityData: any;
  public displayedColumns:string[] = ['Identifier', 'Activity Name', 'Assigned Type', 'Assigned To', 'Status', 'Schedule Time'];
  public iconHeader = [];
  public iconColumn = ['Assigned Type', 'Schedule Time'];
  public sortColumn = [];
  public eventColumn = ['Identifier'];
  permissionControl = ['BT_ALLE'];
  applyFilterValue = null;

  constructor(private readonly configurationService: ConfigurationService, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog){}


  ngOnInit(): void {
    this.getRoutineEvent(this.data.id, this.data.tabType)
  }

  selectedRoutine(data){
    this.routineId = data.id;
    this.entityActivityData = data.requests;
    const Columns = ['requestIdentifier', 'pfActivityName', 'inchargeType', 'inchargeName', 'statusName', 'scheduleTime'];
    for (let i = 0; i <= Columns.length; i++) {
      this.entityActivityData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
  }

  getRoutineEvent(id, type) {
    this.configurationService.getEntityRoutinById(id, type).subscribe(res =>{
      this.routineEventList = res.results;
      if(this.routineEventList) {
        this.routineId = this.routineEventList[0].id;
        this.entityActivityData = this.routineEventList[0].requests;
        const Columns = ['requestIdentifier', 'pfActivityName', 'inchargeType', 'inchargeName', 'statusName', 'scheduleTime'];
        for (let i = 0; i <= Columns.length; i++) {
          this.entityActivityData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      }
    })
  }

  eventAction(event){
    if(event.key === 'Identifier'){
      this.createTicket(event.data)
    }
  }

  createTicket(data) {
    let ticketData = { "id" :null , "type":'modify', "requestId":data.requestId, "entityId" : this.data.entityId, "routineActivity": "Routine"};
    ticketData['requestedType'] = 'RQT-ROU';
    const dialogRef = this.dialog.open(TaskManagmentComponent,
      {data: ticketData, panelClass: ['large-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      
    });
  }
  fixClick() {
    console.log('')
  }
}
