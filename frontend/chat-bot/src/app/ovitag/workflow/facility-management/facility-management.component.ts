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
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CommonService, ConfigurationService } from '../../../shared/services';
import { AppToastService } from '../../../shared/services/toaster.service';
import { CreateAssetComponent } from '../../configuration/asset/asset.component';

@Component({
  selector: 'app-facility-management',
  templateUrl: './facility-management.component.html',
  styleUrls: ['./facility-management.component.scss']
})
export class FacilityManagementComponent implements OnInit {

  displayedColumns = ["ID","Asset Name","Asset Serial No","From Facility","To Facility","Status","Event DateTime"];
  responseColumns = ["id","assetName","assetSerialNumber","fromFacilityName","toFacilityName","status","eventTime"];
  iconColumn = ["ID","Event Date"];
  iconHeader = ["ID"];
  eventColumn = ["Asset Name"];
  sortColumn = ["ID"];
  dateColumns = [];
  dateTimeColumns = ["Event DateTime"];
  showActions = [];
  permissionControl = ['BT_ALLE'];
  public selectedName = null;
  public applyFilterValue: any;
  selectDropdown: any;
  public isloading = false;
  public tableData: any = [];
  pageSize = 10;
  pageStart = 0;
  length = 0;
  isFromFacility = true;
  isToFacility = false;
  public currentDate = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedToDate = null;
  displayDate = true;

  parentFilter = [
    {
      id: 'facilityType',
      value: 'Transfer Type',
      subFilters: [
        { code: 'fromFacility', value: 'My Facility' },
        { code: 'toFacility', value: 'Other Facilities' }
      ],
      selectionType: 'single',
      isNoneAll: false,
      defaultSelected: ['fromFacility']
    }
  ];

  constructor(
    public dialog: MatDialog,
    public configurationService: ConfigurationService,
    public commonService: CommonService,
    public toastr: AppToastService,
    public datepipe: DatePipe,
    private readonly route: ActivatedRoute
  ) {
    this.getDynamicTableColumns();
  }

  ngOnInit(): void {
    console.log('data')
  }

  getDynamicTableColumns(){
      this.commonService.getDynamicTableColumn('facility-transfer').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.responseColumns = dynamicColumns.responseColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.dateColumns = dynamicColumns.dateColumns;
        this.dateTimeColumns = dynamicColumns.dateTimeColumns;
      }
      this.getFacilityTransferList(0,10,null, true)
    });
  }

  getFacilityTransferList(pageStart, pageSize, name?, routerEvent?) {
    if (routerEvent && this.route.snapshot.data.facilityManagement) {
      this.tableData = this.route.snapshot.data.facilityManagement.results;
      this.length = this.route.snapshot.data.facilityManagement.totalRecords;
      const Columns = this.responseColumns;
      for (let i = 0; i < Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      return;
    }
    this.isloading = true;
    this.configurationService.getFacilityTransferDetails(this.isFromFacility, this.isToFacility, pageStart, pageSize, name, this.selectedDate, this.selectedToDate).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      const Columns = this.responseColumns;
      for (let i = 0; i < Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.isloading = false;
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getFacilityTransferList(this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (this.applyFilterValue.length === 0) {
      this.getFacilityTransferList(this.pageStart, this.pageSize, null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.refreshPage();
    } else if (event.key === 'toDateFilter') {
      this.selectedToDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.refreshPage();
    } else if (event.key === 'yearFilter') {
      const { start, end } = this.getYearDates(event.data);
      this.selectedDate = this.datepipe.transform(start, 'yyyy-MM-dd');
      this.selectedToDate = this.datepipe.transform(end, 'yyyy-MM-dd');
      this.refreshPage();
    } else if (event.key === 'dateClear') {
      this.selectedDate = '';
      this.refreshPage();
    } else if (event.key === 'groupFilter') {
      const selected = event.data || [];
      this.isFromFacility = selected.find(s => s.id === 'facilityType')?.data === 'fromFacility';
      this.isToFacility = selected.find(s => s.id === 'facilityType')?.data === 'toFacility';
      this.pageStart = 0;
      this.getFacilityTransferList(this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (event.key === 'multiDate') {
      this.manageMultiDate(event);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage(true);
    }
  }

  manageMultiDate(event) {
    if (!event.data) {
      this.selectedToDate = this.selectedDate;
    } else {
      this.selectedToDate = null;
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    }
    this.refreshPage();
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getFacilityTransferList(this.pageStart, this.pageSize, this.applyFilterValue);
    } else if (event.key === 'Asset Name') {
      this.navigateAssetAction(event.data);
    }
  }

  refreshPage(isAutoRefresh?) {
    this.showActions = [];
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getFacilityTransferList(this.pageStart, this.pageSize, this.applyFilterValue);
  }

  rowClick(data) {
    this.selectedName = data;
  }

  getYearDates(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return { start: startDate, end: endDate };
  }

  navigateAssetAction(data){
    let rowData
    this.configurationService.getAllAsset(data.assetId).subscribe(res => {
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
        const dialogRef = this.dialog.open(CreateAssetComponent, {
        data: rowData,
        panelClass: ['large-popup'],
        disableClose: true,
      })
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage();
      })
      } else{
        this.toastr.warning('Warning','Asset Details Not Available');
        this.refreshPage();
      }
    })
  }
}
