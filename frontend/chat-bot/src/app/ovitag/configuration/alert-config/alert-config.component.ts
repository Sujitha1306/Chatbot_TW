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

import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { CreateNewAlertConfigComponent } from "./create-new-alert-config/create-new-alert-config.component";
import { AppToastService } from "../../../shared/services/toaster.service";

/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/


@Component({
  selector: 'app-alert-config',
  templateUrl: './alert-config.component.html',
  styleUrls: ['./alert-config.component.scss'],
  animations: [routerTransition()],
  
})
export class AlertConfigComponent implements OnInit {
  displayedColumns = ['S.No', 'Alert Name', 'Rule Type', 'Rule Category', 'Scope Name', 'Alert Type', 'Status'];
  iconHeader = [];
  iconColumn = ['Status'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLC','BT_CFACC'];
  public selectedRow: any;
  public rowData: any = {};
  public activate_btn: any = [];
  public applyFilterValue: any;
  public facilityId = null;
  tableData: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  filterValue: null;

  constructor(private readonly configurationServices: ConfigurationService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar, private readonly route: ActivatedRoute) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    this.tableData = this.route.snapshot.data.alerts.results;
    const Columns = ['S.No', 'name', 'pfRuleName','ruleCategoryName', 'scopeName', 'alertTypeName', 'isActive'];
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllAlerts();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createAlert('',event);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  createAlert(rowData: any, event: any) {
    this.showActions = null;
    this.rowData = rowData;
    this.selectedRow = rowData.configId;
    if (this.selectedRow != null) {
      this.configurationServices.getAllAlertsById(this.selectedRow, this.facilityId).subscribe(res => {
        const data = res.results[0];
        const dialogRef = this.dialog.open(CreateNewAlertConfigComponent,
          { data: data, panelClass: ['medium-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
          this.refreshPage();
        });
      });
    } else {
      this.rowData = rowData;
      const dialogRef = this.dialog.open(CreateNewAlertConfigComponent,
        { data: rowData, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.getAllAlerts();
        }
        this.refreshPage();
      });
    }
  }

  rowClick(data) {
    this.selectedRow = data.configId;
  }

  getAllAlerts() {
    this.configurationServices.getAllAlerts().subscribe(res => {
      this.tableData = res.results;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['S.No', 'name', 'pfRuleName','ruleCategoryName', 'scopeName', 'alertTypeName', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
}
