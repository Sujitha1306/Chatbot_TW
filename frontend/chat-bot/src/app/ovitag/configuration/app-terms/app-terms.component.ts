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

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ManageApptermsComponent } from './manage-appterms/manage-appterms.component';
import { CommonService } from '../../../shared';
import { ActivatedRoute } from '@angular/router';
import { AppToastService } from '../../../shared/services/toaster.service';
import { ConfigCacheService } from '../../../shared/config-cache.service';
import { LookupTermService } from '../../../shared/lookup-term.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-app-terms',
  templateUrl: './app-terms.component.html',
  styleUrls: ['./app-terms.component.scss']
})
export class AppTermsComponent implements OnInit {
  showActions1 = [{ id: 'clearCache', value: 'Clear Cache' }, {id: 'cache', value: 'Clear Local Cache'}];
  showActions2 = [{ id: 'manageApptermsGroups', value: 'Manage Appterms Groups' }, { id: 'clearCache', value: 'Clear Cache' }];
  public showActions = null;
  public selectedName: any = null;
  public applyFilterValue: any;
  public selectedView = "table";
  public activate_btn: any = [];
  public groupFilter: any[] = [];
  public isLoading: boolean = false;
  filterValue = null;
  selectDropdown: any;
  public tableData: any = [];
  permissionControl = ['BT_ALLE'];
  sortColumn = ['ID'];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  displayedColumns: string[] = ['ID','Code', 'Group Name'];
  displayedColumns2: string[] = ['Code','Name','Group Name','Default','Sequence','Status' ];
  public tableVersion: any = null;
  selectedTabIndex = 0;
  public pageSize = 50;
  public pageStart = 0;
  public length = 0;
  public selectedRow: any = null;
  constructor(public dialog: MatDialog,private readonly commonService: CommonService,private readonly route: ActivatedRoute, public toastr: AppToastService,
    private readonly configCacheService: ConfigCacheService, private readonly lookupTermService: LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    this.showActions = this.activate_btn.includes('BT_CCH') ? this.showActions1 : '';
   }

  ngOnInit() {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Code', 'Group Name'];
      }
      this.isLoading = true;
      this.tableData = this.route.snapshot.data.appTerms.results.map(item => ({ ...item,
        groupName: null
      }));
      let Columns = null;
      if (this.tableVersion == 1) {
        Columns = ['ID', 'code', 'value']
      } else {
        this.length = this.route.snapshot.data.appTerms.results.length;
        Columns = ['code', 'value'];
      }
     
      for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
              data[this.displayedColumns[i]] = data[Columns[i]];
          });
      }
      this.isLoading = false;
    }, 500);
  }
  getApptermsgroup(){
    this.isLoading = true;
    this.commonService.getAppTermsVerion2('LookupGroup').subscribe(res => {
      this.isLoading = false;
      this.tableData = res.results.map(item => ({ ...item,
        groupName: null
      }));

      let Columns = null;
      if (this.tableVersion == 1) {
        Columns = ['ID', 'code', 'value']
      } else {
        this.length = this.tableData.length;
        Columns = ['code', 'value'];
      }
      for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
              data[this.displayedColumns[i]] = data[Columns[i]];
          });
      }
    });
  }

  getApptermsData(){
    this.isLoading = true;
    this.commonService.get_group_appterms('AssetType',this.pageStart, this.pageSize).subscribe(res => {
      this.isLoading = false;
      this.tableData = res.results;
      const Columns = ['code','value', 'groupName','isDefault','sequence','isActive'];
      for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
              data[this.displayedColumns2[i]] = data[Columns[i]];
          });
      }
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
        this.applyFilter(event.data,);
    }else if(event.data === 'manageApptermsGroups'){
      this.updateAppterms(event.data,this.selectedRow);
    }else if(event.data === 'clearCache'){
      this.clearCache();
      this.selectDropdown = [];
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

  eventAction(event) {
    if (event.key === "Code") {
      this.updateAppterms('manageApptermsGroups', event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getApptermsData();
    }
  }
  refreshPage(isAutoRefresh?: boolean) {
   
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
    this.applyFilterValue = null;
    }
    if (this.selectedTabIndex === 0) {
      this.getApptermsgroup()
    } else if (this.selectedTabIndex === 1) {
      this.getApptermsData()
    }
    
  }
  clearCache() {
    let data = {}
    this.commonService.clearcache(data).subscribe(res => {
      this.showActions = this.showActions2;
      let msg = 'All cache cleared...'
      this.toastr.success('Success', `${msg}`);
    }) 
  }
  updateAppterms(selectedType?:any,selectedData?:any){
    let rowData = {"selectedType":selectedType,"selectedData":null};
    if(selectedData){
      rowData['selectedData'] = selectedData;
    }
    const dialogRef = this.dialog.open(ManageApptermsComponent, {
      panelClass: ['medium-popup'], data: rowData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = [];
        this.applyFilterValue = null;
        this.refreshPage();
    });
  }
  rowClick(data) {
    if(data !== null){
      const showActionData = this.activate_btn.includes('BT_CCH') ? this.showActions2 : this.showActions2.filter(x => x.id != 'clearCache');
      this.showActions = showActionData;
      this.selectedRow = data;
    } else {
      this.showActions = this.showActions1;
    }
  }

  tabChanged(event) {
    this.selectedTabIndex = event.index;
    if (this.selectedTabIndex === 0) {
      this.getApptermsgroup()
    } else if (this.selectedTabIndex === 1) {
      this.getApptermsData()
    }
  }

  get appTermsTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, ['Code'], []
    );
  }

  get appTermsTwColumns2(): TwColumnDef[] {
    return this.buildTwColumnDefs2(
      this.displayedColumns2, this.sortColumn, ['Status','Default'], this.iconHeader, [], []
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (timeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  buildTwColumnDefs2(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (timeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }

  get apptermsPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }
}
