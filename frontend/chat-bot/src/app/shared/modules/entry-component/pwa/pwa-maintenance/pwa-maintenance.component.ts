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

import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { ManagePwaMaintenanceComponent } from '../manage-pwa-maintenance/manage-pwa-maintenance.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-pwa-maintenance',
  templateUrl: './pwa-maintenance.component.html',
  styleUrls: ['./pwa-maintenance.component.scss']
})
export class PwaMaintenanceComponent {

  selectedData = null;
  visibleData = [];
  loading = false;
  debounceTimer: any;
  totalRecords = null;
  displayEntityType = null;
  computedAssetName = null;
  pageSize= 20;
  pageStart = 0;
  searchText = null;

  constructor(
    public dialog: MatDialog,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    private readonly bottomSheet: MatBottomSheet,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    if (this.data) {
      this.displayEntityType = this.data.entityType;
      this.getEntityRoutineDetails(this.pageStart,this.pageSize, this.data.entityType,this.data.entityId,this.searchText)
      if (this.data.entityType === 'Asset') {
        if (this.data?.entityData?.assetName && this.data?.entityData?.assetSerialNumber) {
          this.computedAssetName = `${this.data.entityData.assetName} (${this.data.entityData.assetSerialNumber})`;
        } else if (this.data?.entityData?.assetName) {
          this.computedAssetName = this.data.entityData.assetName;
        }
      }
    }

  }

  onSearchChange(value) {
    const name = value.trim().toLowerCase();
    this.searchText = name.length > 2 ? name : null;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.visibleData = [];
      this.pageStart = 0;
      this.pageSize = 20;
      this.getEntityRoutineDetails(this.pageStart,this.pageSize, this.data.entityType,this.data.entityId,this.searchText)
    }, 300);

  }

  moreData() {
    this.pageSize += 20;
    this.getEntityRoutineDetails(this.pageStart, this.pageSize,this.data?.entityType,this.data?.entityId,this.searchText)
  }

  getEntityRoutineDetails(pagestart,pagesize, type,id,name) {
    this.loading = true;
    this.configurationService.getAllManageRoutine(pagesize,pagestart,type,id,name).subscribe((res: any) => {
      this.totalRecords = res.totalRecords;
      this.visibleData = res.results;
      this.loading = false;
    },
      (err) => {
        console.error('Error fetching data', err);
        this.loading = false;
      }
    );
  }

  addRoutine(data){
    let Data;
    if (data !== null) {
      data['type']= 'modify'
      Data = data;
    } else {
      Data ={"type":'create',"entityType":'Asset',"entityId":this.data.entityId,"entityName":this.data.entityData?.assetName,entityById: this.data.entityId,entityIdName: this.data.entityData.assetName};
    }
    Data['tabType']="Asset";
    const bottomSheetRef = this.bottomSheet.open(ManagePwaMaintenanceComponent, {
      data:Data,
      panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
    });
  
    bottomSheetRef.afterDismissed().subscribe(result => {
      this.getEntityRoutineDetails(this.pageStart, this.pageSize,this.data?.entityType,this.data?.entityId,this.searchText)
    });
  }
  fixClick() {
    console.log('')
  }
}
