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

import { Component, OnInit,   ViewChild, OnDestroy} from '@angular/core';
import {  FormBuilder,} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {CommonService} from '../../../services/common.service';
import { OvitagComponent } from '../../../../ovitag/ovitag.component';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../../../services';
import { Subscription } from 'rxjs';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { AppToastService } from '../../../services/toaster.service';

@Component({
    selector: 'monitor',
    templateUrl: './monitor.component.html',
    styleUrls: ['./monitor.component.scss'],
  })

  
export class MonitorComponent implements OnInit, OnDestroy  {
  public matcher = new ErrorStateMatcherService();
  public subscription: Subscription;
  tableData: any;
  monitorInterval: any;
  facilityId: string;
  public monttableData: any[] = [];
  monitortableData1: any[] = [];
  monitortableData2: any[] = [];
  montdisplayedColumns = ['Token No', 'UHID', 'Patient Name', 'Test Name', 'Location Name', 'Status'];
  montDataColumns = ['tokenNo', 'uhid', 'patientName', 'testName', 'locationName', 'queueStatusName'];

  constructor(public form: FormBuilder, public toastr: AppToastService,
    public dialog: MatDialog, private readonly commonService: CommonService,
    public ovitag: OvitagComponent, private readonly workflowService: WorkflowService,
    public fb: FormBuilder, private readonly route: ActivatedRoute
) {
        this.ovitag.closeMenu();
  }

 

  ngOnInit() {
    this.getMonitor(true);
  }
  ngOnDestroy(): void {
    clearInterval(this.monitorInterval);
  }
  checkInterval() {
    clearInterval(this.monitorInterval);
    this.monitorInterval = setInterval(val => this.getMonitor(), environment.base_value.set_monitor_interval);
  }

getMonitor(routerEvent?: boolean){
    this.checkInterval();
      if (routerEvent) {
          this.tableData = this.route.snapshot.data.monitor.results;
          this.monttableData = this.tableData;
          this.prepareTableData();        
      } else {
        this.workflowService.getMonitor().subscribe((res) => {
        this.tableData = res.results;
        this.monttableData = this.tableData;
        this.prepareTableData();
      });
    }
  }

    prepareTableData() {
      const length = this.monttableData.length;
      this.monitortableData1 = [];
      this.monitortableData2 = [];
      if (length <= 25) {
        this.monitortableData1 = this.monttableData;
        this.monitortableData2 = [];
      } else if (length <= 50) {
        this.monitortableData1 = this.monttableData.slice(0, 25);
        this.monitortableData2 = this.monttableData.slice(25);
      } else {
        const mid = Math.ceil(length / 2);
        this.monitortableData1 = this.monttableData.slice(0, mid);
        this.monitortableData2 = this.monttableData.slice(mid);
      }
    }
}
