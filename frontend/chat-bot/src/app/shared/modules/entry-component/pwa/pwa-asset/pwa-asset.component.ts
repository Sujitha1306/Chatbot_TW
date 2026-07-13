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

import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WorkflowService, CommonService, ConfigurationService } from '../../../../services';
import { ManagePwaAssetComponent } from '../manage-pwa-asset/manage-pwa-asset.component';
import { ManageFilterComponent } from '../manage-filter/manage-filter.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { EditAssetComponent } from '../edit-asset/edit-asset.component';

@Component({
  selector: 'app-pwa-asset',
  templateUrl: './pwa-asset.component.html',
  styleUrls: ['./pwa-asset.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PwaAssetComponent {

  searchText = null;
  selectedData = null;
  visibleData = [];
  pageStart = 0;
  pageSize = 20;
  loading = false;
  allLoaded = false;
  debounceTimer: any;
  departmentIds = null;
  isOwnedDepartment = null;
  isAssignedDepartment = null;
  isMyAsset = null;
  type = null;
  isMyDepartment = null;
  showFilter = false;
  totalRecords = null;
  public parentFilter = [
    {
      id: 'asset',
      value: 'ASSET',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myAsset', value: 'My Asset' }, { code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment'],
      dependentFilter: ['my department', 'ownership']
    },
    {
      id: 'assetType',
      value: 'ASSET TYPE',
      isAll: false,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    }
  ];

  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public commonService: CommonService,
    private readonly bottomSheet: MatBottomSheet,
    public configurationService: ConfigurationService,
  ) {
  }

  ngOnInit() {
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission?.dropdown;
    const assetAll = this.parentFilter.find(filter => filter.id === 'asset');
    const dropdownOption = dropdown.find(x => x.page === 'workflow' && x.name === 'ALL');
    if (assetAll && dropdownOption) {
      assetAll.subFilters.push({ code: dropdownOption.code, value: dropdownOption.name })
    }
    this.commonService.getAppTerms('AssetType').subscribe(res => {
      const assetTypeFilter = this.parentFilter.find(filter => filter.id === 'assetType');
      if (assetTypeFilter) {
        assetTypeFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
      }
    });
    let userId = localStorage.getItem(btoa('userId'));
    this.commonService.getUserDepartmentLink(userId).subscribe(res => {
      if (res.statusCode === 1 && Array.isArray(res.results) && res.results.length > 0) {
        const myDepartmentFilter = {
          id: 'my department',
          value: 'MY DEPARTMENT',
          isAll: false,
          selectionType: 'multi',
          subFilters: [],
          defaultSelected: [],
          enableEmpty: false,
        };
        const ownershipFilter = {
          id: 'ownership',
          value: 'OWNERSHIP',
          isAll: false,
          selectionType: 'multi',
          subFilters: [{ code: 'owned', value: 'Owned' }, { code: 'assigned', value: 'Assigned' }],
          defaultSelected: ['owned', 'assigned'],
          enableEmpty: false
        };
        this.parentFilter.splice(1, 0, myDepartmentFilter, ownershipFilter);
        const departmentFilter = this.parentFilter.find(filter => filter.id === 'my department');
        departmentFilter.subFilters = res.results.map(({ departmentId, departmentName }) => ({
          code: departmentId,
          value: departmentName
        }));
        if (this.departmentIds != null && this.departmentIds.length > 0) {
        departmentFilter.defaultSelected = this.departmentIds;
        if (this.isOwnedDepartment) {
          ownershipFilter?.defaultSelected.push('owned');
        }
        if (this.isAssignedDepartment) {
          ownershipFilter?.defaultSelected.push('assigned');
        }
      } else {
        departmentFilter.defaultSelected = departmentFilter.subFilters.map(item => item.code);
        this.departmentIds = departmentFilter.defaultSelected.map(id => parseInt(id, 10));
        this.isOwnedDepartment = this.departmentIds ?.length > 0;
        this.isAssignedDepartment = this.departmentIds ?.length > 0;
      }
      this.isMyDepartment = this.departmentIds.length > 0 ? true : null;
      this.getAssetLocationDetails(null, this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentIds);
      }
    });
  }

  getAssetLocationDetails(name, pagestart, pagesize, ismyAsset, isMydepartment, assetTypes, isowned, isAssigned, departmentId) {
    if (this.loading || this.allLoaded) return;
    this.loading = true;
    this.workflowService.getAssetLocationDetails(name, pagestart, pagesize, ismyAsset, isMydepartment, assetTypes, isowned, isAssigned, departmentId).subscribe((res: any) => {
        const results = res?.results;
        this.totalRecords = res.totalRecords;
        if (this.pageStart === 0 && results.length === 0) {
          this.visibleData = [];
          this.allLoaded = true;
        } else {
          const newResults = results.filter(
            newItem => !this.visibleData.some(existingItem => existingItem.assetId === newItem.assetId)
          );

          this.visibleData = [...this.visibleData, ...newResults];
          if (newResults.length < this.pageSize) {
            this.allLoaded = true;
          }
          this.pageStart++;
        }

        this.loading = false;
      },
      (err) => {
        console.error('Error fetching data', err);
        this.loading = false;
      }
    );
  }

  onSearchChange(value) {
    const name = value.trim().toLowerCase();
    this.searchText = name?.length ? name : null;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.visibleData = [];
      this.pageStart = 0;
      this.pageSize = 20;
      this.allLoaded = false;
      this.loading = false;
      this.getAssetLocationDetails(this.searchText, this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentIds)
    }, 300);

  }

  moreData() {
    this.pageStart = 0;
    this.pageSize += 20;
    this.allLoaded = false;
      this.getAssetLocationDetails(this.searchText, this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentIds)
  }

  onClick(data: any) {
    if (data != null) {
      this.selectedData = data;
      const dialogRef = this.dialog.open(ManagePwaAssetComponent, {
        data: data,
        panelClass: 'custom-bottom-sheet'
      });

      dialogRef.afterClosed().subscribe(() => {
        this.selectedData = null;
      });
    } else {
      const dialogRef = this.dialog.open(EditAssetComponent, {
        data: data,
        panelClass: 'custom-bottom-wrapper'
      });
        dialogRef.afterClosed().subscribe(() => {
        this.selectedData = null;
      });
    }
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if(this.showFilter){
        const bottomSheetRef = this.bottomSheet.open(ManageFilterComponent, {
        data: this.parentFilter,
        panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
      });
    
      bottomSheetRef.afterDismissed().subscribe(result => {
        if(result){
          this.onFiltersApplied(result);
        }
        this.showFilter = false;
      });
    }
  }

  onFiltersApplied(result) {
    this.showFilter = false;
    this.loading = false;
    this.allLoaded = false;
    this.pageStart = 0;
    this.pageSize = 20;
    this.visibleData = [];
    const asset = result['asset'] || [];
    const assetType = result['assetType'] || [];
    const department = result['my department'];
    const ownership = result['ownership'] || [];

    this.isOwnedDepartment = ownership.includes('owned') ? true : null;
    this.isAssignedDepartment = ownership.includes('assigned') ? true : null;
    this.isMyAsset = asset.includes('myAsset') ? true : null;
    this.type = assetType.length ? assetType : null;

    const departmentIds = department?.filter(val => val !== 'owned' && val !== 'assigned') || [];
    this.departmentIds = departmentIds.map(id => parseInt(id, 10));
    this.isMyDepartment = asset.includes('myDepartment') && this.departmentIds?.length > 0 ? true : null;

    this.getAssetLocationDetails(this.searchText, this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentIds);
  }
  fixClick() {
    console.log('')
  }
}

