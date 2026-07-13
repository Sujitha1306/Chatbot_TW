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
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import {  FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ConfigurationService } from '../../../shared';
import { ManageConfigComponent } from './manage-config/manage-config.component';
import { ConfigCacheService } from '../../../shared/config-cache.service';
import { LookupTermService } from '../../../shared/lookup-term.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class ConfigComponent implements OnInit {
  displayedColumns = ['ID', 'Config Key', 'Content', 'Facility Name', 'Comments'];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = [];
  eventColumn = ['Config Key'];
  permissionControl = ['BT_ALLE', 'BT_CFAE'];
  permission = null;
  tableData: any;
  public  spinLoader =false;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatToolbarModule) toolbarModule: MatToolbarModule;
  @ViewChild(MatFormFieldModule) formfieldModule: MatFormFieldModule;

  public fb: FormBuilder;
  public rowData: any = [];
  public applyFilterValue: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [{ id: 'create', value: 'Create' }, {id: 'cache', value: 'Clear Local Cache'}];
  showAction2 = [{ id: 'modify', value: 'Modify' }];
  showActions = this.showAction1;
  filterValue = null;

  constructor(
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly configurationService: ConfigurationService,
    private readonly configCacheService: ConfigCacheService,
    private readonly lookupTermService: LookupTermService
  ) { }

  ngOnInit() {
    this.loadConfigList(true);
  }

  refreshPage() {
    this.showActions = this.showAction1;
    this.filterValue = null;
    this.loadConfigList();
  }

  loadConfigList(routerEvent?: boolean) {
    this.spinLoader = true;
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.config.results;
      const Columns = ['ID', 'id', 'content', 'facilityName','comments'];
      for (let i = 0; i < Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.configurationService.getConfig(true).subscribe(data => {
        this.tableData = data.results;
        if (this.applyFilterValue !== null) {
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['ID','id', 'content', 'facilityName', 'comments'];
        for (let i = 0; i < Columns.length; i++) {
          this.tableData.map(item => {
            item[this.displayedColumns[i]] = item[Columns[i]];
          });
        }
      });
    }
    this.spinLoader = false;
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue;
  }

  rowClick(data: any): void {
    if (this.selectedName && data.ids == this.selectedName.ids) {
      this.selectedName = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  eventAction(event: any) {
    if(event.key === 'Config Key')
      this.createConfig(event.data)
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top'
    });
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createConfig(null);
    } else if (event.data === 'modify') {
      this.createConfig(event.keyVal);
    } else if (event.data === 'cache') {
      this.configCacheService.clearAllCache();
      this.lookupTermService.clearCache();
      this.selectDropdown = [];
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  createConfig(data: any) {
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(ManageConfigComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
  }
}

