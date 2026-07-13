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

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../../shared';
import { EntityGroupComponent } from '../../../../shared/modules/entry-component/entity-group/entity-group.component';
import { TwColumnDef, TwPaginationConfig } from '../../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';


@Component({
  selector: 'app-manage-entity-group',
  templateUrl: './manage-entity-group.component.html',
  styleUrls: ['./manage-entity-group.component.scss']
})
export class ManageEntityGroupComponent {
  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = ['ID', 'Name', 'Type', 'Status'];
  permissionControl = [];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  public selectedName: any = null;
  public applyFilterValue: any;
  public selectedView = "table";
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;
  public tableVersion: any = null;
  public parentFilter =[
    {
      groupName:'EntityGroupType',
      value:'Group Type',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
  ];
  typeId: any;
  public grouptypes= ['EGTI-AS','EGTI-LOC','EGTI-US','EGT-DEP','EGT-GRA']

  constructor(public dialog: MatDialog,  private readonly commonService: CommonService) { }

    ngOnInit(): void {
        setTimeout(() => {
            this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
            if (this.tableVersion === 2) {
                this.displayedColumns = ['Name', 'Type', 'Status'];
            }
            this.getConfigData();
        }, 500);
    }

    getConfigData() {
    this.commonService.getConfigFile('entityGroups-config').subscribe(res => {
      if (res.statusCode === 1) {
        const configData = res.results?.contentObject;
        this.grouptypes = configData?.allowedGroups;
        this.getEntitygroup(this.grouptypes, this.pageStart, this.pageSize);
        this.getEntityGroupTypes()
      } else {
        this.getEntitygroup(this.grouptypes, this.pageStart, this.pageSize);
        this.getEntityGroupTypes()
      }
    });
  }

  getEntityGroupTypes() {
    this.commonService.getAppTerms('EntityGroupType').subscribe(res => {
      if(res.statusCode == 1) {
          let entityGroupTypeList = res.results.filter(val => val.code !== "EGTI-KIT" && val.code !== "EGTI-PA" && val.code !== "EGTI-READER" && 
            val.code !== "EGTI-TAG" && val.code !== "EGTI-PO" && val.code !== "EGTI-STU" && val.code !== "EGTI-STF");
          const entityData = this.parentFilter.find(x => x.groupName === 'EntityGroupType')
          if(entityData){
            entityGroupTypeList = entityGroupTypeList.filter(res => this.grouptypes.includes(res.code));
            entityData.subFilters = entityGroupTypeList.map(({ code, value }) => ({ code, value }));
            entityData.defaultSelected = entityGroupTypeList.map(({ code }) => code);
          }
        }
    })
  }

  getEntitygroup(type?,pageStart?,pageSize?) {
    this.isloading = true;
    this.commonService.getEntityGroup(type,pageStart,pageSize).subscribe(res => {
      this.isloading = false;
      let mapIsActive = (item: any) => {
        if (typeof item.isActive === 'boolean') {
          item.isActive = item.isActive ? 'Active' : 'Inactive';
        }
      };
      this.tableData = res.results;
      this.length = res.totalRecords
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = this.tableVersion === 1
        ? ['id', 'name', 'entityTypeName','isActive']
        : ['name', 'entityTypeName','isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          mapIsActive(data);
          data[this.displayedColumns[i]] = data[Columns[i]];
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
      this.applyFilter(event.data);
    } else if (event.data === 'Create') {
       this.manageEntityGroup(null);
    } else if (event.data === 'Modify') {
      this.manageEntityGroup(event.keyVal)
    } else if (event.key === 'groupFilter') {
      const type  = event.data.map(item => item.data);
      this.getEntitygroup(type)
    }
    else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getEntitygroup(this.grouptypes,this.pageStart,this.pageSize);
     }else if( event.key === 'Name'){
      this.manageEntityGroup(event.data)
     }
    }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getEntitygroup(this.grouptypes,this.pageStart,this.pageSize);
  }
  manageEntityGroup(data: any) {
    this.showActions = null;
    let popupInfo = {
      type : 'create', entity : null, showSideBar : false
    }
    if(data) {
      popupInfo = {
        type: data.entityTypeId,
        entity : data, 
        showSideBar : false
      }
    }
    const dialogRef = this.dialog.open(EntityGroupComponent, {
      data:  popupInfo, 
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.showActions = null;  
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.showActions = this.showActions1;
    } else {
      this.selectedName = data;
      this.showActions = this.showActions2;
    }
  }

  get manageEntityGroupTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      ['Name'], []
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

  get manageEntityGroupPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}