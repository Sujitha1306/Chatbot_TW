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

import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CommonService, ConfigurationService } from '../../../services';
import { DatePipe } from '@angular/common';
import { VisitorTagAssociateComponent } from './visitor-tag-associate/visitor-tag-associate.component';
import { FormControl } from '@angular/forms';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { CoasterComponent } from '../enroll-patient/enroll-patient.component';

@Component({
  selector: 'app-visit-event',
  templateUrl: './visit-event.component.html',
  styleUrls: ['./visit-event.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VisitEventComponent implements OnInit {
  public selectedTabIndex = 0;
  public today = new Date()
  public currentDate = this.datepipe.transform(this.today, 'yyyy-MM-dd')
  visitorData = null;
  visitorEventData = null;
  statusList = [
    { value: 'Request BY', code: 'VIS-RQ', url: '../../../../../assets/icons/requested 1.svg', user: null, date: null },
    { value: 'Vistor Acceptance', code: 'VIS-AC', url: '../../../../../assets/icons/accepted 1.svg', user: null, date: null },
    { value: 'vcs verification', code: 'VIS-VES', url: '../../../../../assets/icons/VCS.svg', user: null, date: null },
    { value: 'Security Approval', code: 'VIS-AP', url: '../../../../../assets/icons/approved 1.svg', user: null, date: null },
    { value: 'Arrived', code: 'VIS-AR', url: '../../../../../assets/icons/arrived-2.svg', user: null, date: null },
    { value: 'completed', code: 'VIS-CO', url: '../../../../../assets/icons/progress-complete 1.svg', user: null, date: null },
    { value: 'Departed', code: 'VIS-DP', url: '../../../../../assets/icons/departed-2.svg', user: null, date: null }
  ];
  attachmentInfo: any;
  pageSize = 10;
  pageStart = 0;
  eventTableData: any;
  movementTableData: any;
  statusCode: string;
  buttonName: string;
  userId = localStorage.getItem('dXNlcklk')
  latestEvent: any;
  isButtonShow: boolean = false;
  public displayedColumns: string[] = ['User Name', 'Status', 'Event Time', 'Comments'];
  public iconHeader = [];
  public iconColumn = ["Event Time"];
  public sortColumn = [];
  public eventColumn = [];
  permissionControl = ['BT_ALLE'];
  public applyFilterValue: any;
  length = 0;
  fromDate = new FormControl(this.currentDate);
  toDate = new FormControl(this.currentDate)
  startDate = this.fromDate.value
  endDate = this.toDate.value;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService,
    public datepipe: DatePipe, public dialog: MatDialog, private readonly configurationService: ConfigurationService) { }

  ngOnInit(): void {
    this.getVisitDetails(this.data.id)
    this.getVisitorMovement(this.data.id)
  }

  getVisitDetails(id) {
    this.commonService.getVisitorById(id).subscribe(res => {
      this.visitorData = res.results;
      console.log("gibidi", this.visitorData)
      this.commonService.getItemAttachment(id, 'Visitor').subscribe(res => {
        this.attachmentInfo = res.results[0]
      })
      this.getvisitorEvents(id);
    })
  }
  getvisitorEvents(id) {
    this.commonService.getVisitorEvent(id).subscribe(res => {
      this.visitorEventData = res.results;
      this.statusCode = this.visitorEventData[0].statusId;
      this.latestEvent = this.datepipe.transform(this.visitorEventData[0].eventTime, 'yyyy-MM-dd');
      if (this.statusCode === 'VIS-AC') {
        this.buttonName = "Success"
      } else if (this.statusCode === 'VIS-VES') {
        this.buttonName = "Approved"
      } else if (this.statusCode === 'VIS-AP') {
        this.buttonName = "Arrived"
      } else if (this.statusCode === 'VIS-AR') {
        this.buttonName = "Completed"
      } else if (this.statusCode === 'VIS-CO') {
        this.buttonName = "Departed"
      }
      if (this.latestEvent === this.currentDate && this.statusCode === 'VIS-DP') {
        this.isButtonShow = true;
      } else {
        this.isButtonShow = false;
      }
      if (this.visitorEventData) {
        this.statusList.forEach(status => {
          this.visitorEventData.forEach(event => {
            if (status.code === event.statusId) {
              status.date = event.eventTime;
              status.user = event.statusId !== 'VIS-AC' ? event.userName : null;
            }
            else if (event.statusId === "VIS-VEF" && status.code === 'VIS-VES') {
              status.date = event.eventTime;
              status.user = event.statusId !== 'VIS-AC' ? event.userName : null;
            }
            else if (event.statusId === "VIS-CA" && status.code === this.visitorData.statusId) {
              status.date = event.eventTime;
              status.user = event.statusId !== 'VIS-AC' ? event.userName : null;
            }
          })
        })
      }
    })
  }

  updateStatus(code, type) {

    if (type === 'failed') {
      let valid;
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['confirmation-popup'],
        data: {
          title: 'Confirmation', message: 'Are you sure you want to Cancel the Visit ?',
          buttonText: { ok: 'Yes', cancel: 'No' }, visitorStatus: true
        },

      });
      dialogRef.afterClosed().subscribe(result => {
        valid = result
        console.log("valid", valid)

        let data;
        console.log(valid)
        if (valid === "Yes") {
          if (code === 'VIS-AC') {
            console.log("its working")
            data = {
              comments: "Failed",
              statusId: 'VIS-VEF',
              userId: parseInt(this.userId)
            };
          } else {
            data = {
              comments: "Cancelled",
              statusId: 'VIS-CA',
              userId: parseInt(this.userId)
            };
          }
          this.commonService.updateVisitoryStatus(this.visitorData.id, data).subscribe(res => {
            console.log(res)
            if (res.statusCode === 1) {
              this.getvisitorEvents(this.visitorData.id);
            }
          });
        }
      });
    }
    else if (code === 'VIS-AP') {
      this.associateTag(code)
    }
    else if ( code === "VIS-CO") {
      console.log(this.visitorData)
      console.log(this.data)
      const data = this.visitorData
        data['associationTypeId'] = "TAT-VS";
          data['associatedName'] = "Visitor";
          data['associationId'] = data.id;
          data['tagId'] = data.tagId;
          data['tag_type_name'] = data.tagTypeId;
          data['workflowTypeId'] = 'WF-VIS';
          const dialogRef = this.dialog.open(CoasterComponent, {
            data: data,
            panelClass: ['small-popup'], disableClose: true
          });
          dialogRef.afterClosed().subscribe(result => {
             if (result === 'confirm') {
            
           const data = {
              comments: "departed",
              statusId: 'VIS-DP',
              userId: parseInt(this.userId)
            };
          
          this.commonService.updateVisitoryStatus(this.visitorData.id, data).subscribe(res => {
            if (res.statusCode === 1) {
              this.getvisitorEvents(this.visitorData.id);
            }
          });
        }
        })
      
    } else {
      const statusMap: Record<string, string> = {
        'VIS-AC': 'VIS-VES',
        'VIS-VES': 'VIS-AP',
        'VIS-AP': 'VIS-AR',
        'VIS-AR': 'VIS-CO',
        'VIS-CO': 'VIS-DP',
        'VIS-DP': 'VIS-CO'
      };

      const data = {
        comments: this.buttonName,
        statusId: statusMap[code] || 'VIS-AR',
        userId: parseInt(this.userId)
      };
      this.commonService.updateVisitoryStatus(this.visitorData.id, data).subscribe(res => {
        if (res.statusCode === 1) {
          this.getvisitorEvents(this.visitorData.id);
        }
      });
    }
  }
  associateTag(data) {
    let event = { visitorId: this.visitorData.id, visitorStatus: data }
    const dialogRef = this.dialog.open(VisitorTagAssociateComponent, {
      data: event, panelClass: ['small-popup'], disableClose: true,
      height: '400px', width: '650px'
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getvisitorEvents(this.visitorData.id);
      this.getVisitDetails(this.visitorData.id)
    });
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.pageSize;
      this.pageStart = event.pageStart;
      this.getVistiorsHistorys()
    }
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.selectedTabIndex = tabChangeEvent.index;
    if (this.selectedTabIndex === 3) {
      this.getVistiorsHistorys()
    }
  }

  getVistiorsHistorys() {
    if (this.selectedTabIndex === 3) {
      this.commonService.getvisitorEventHistory(this.pageSize, this.pageStart, this.visitorData.id).subscribe(res => {
        this.eventTableData = res.results;
        this.eventTableData = res.results.map(data => {
          if (data.statusId === "VIS-AC" && !data.userName) {
            data.userName = this.visitorData.fullName;
          }
          return data;
        });
        this.length = res.totalRecords;
        const Columns = ["userName", "statusName", "eventTime", "comments"];
        for (let i = 0; i <= Columns.length; i++) {
          this.eventTableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      })
    } else {

    }
  }

  selectedDateRec() {
    this.startDate = this.fromDate.value
    this.endDate = this.toDate.value
    this.getVisitorMovement(this.visitorData.id);
  }

  getVisitorMovement(id) {
    this.configurationService.getAllMovementHistory(this.startDate, this.endDate, id, 'TAT-VS', null, null).subscribe(res => {
      console.log(res)
    })
  }
   getFileDownload(element){
      console.log(element)
      const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
        { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
      });
    }
  fixClick() {
    console.log('')
  }
}
