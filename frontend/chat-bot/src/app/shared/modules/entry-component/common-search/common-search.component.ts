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
import { Component, OnInit, Input, ViewEncapsulation,  Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HospitalService } from '../../../services/hospital.service';
import { CommonService } from '../../../services/common.service';
import { ReportService } from '../../../services/report.service';
import { DashboardService } from '../../../services/dashboard.service';
import './../../../../../assets/script/moving-marker.js';
import { DatePipe } from '@angular/common';

import { PatientInfoComponent } from './../../entry-component/patient/patient.component';
export interface Foo {
    bar: string;
}
@Component({
    selector: 'app-common-search',
    templateUrl: './common-search.component.html',
    styleUrls: ['./common-search.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CommonSearchComponent implements OnInit {
    dataSource: MatTableDataSource<any>;
    public selectedName: any;
    public rowData: any = [];
    public activate_btn: any = [];
    public filtervalue: string;
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    public maxHeight: any;
    public height: any;
  displayedColumns: string[] = [];
  columnData: string[] = [];
  eventColumn = [];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  pageSize: number = 20;
  pageStart: number = 0;
  length: any = 0;
  tableData: any[] = [];
  public applyFilterValue: any;

    @Input() singleChildRowDetail: boolean;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(private readonly hospitalService: HospitalService, public reportService: ReportService, public datepipe: DatePipe,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly dialog: MatDialog,
        public commonService: CommonService, private readonly dashboardService: DashboardService,
        public thisDialogRef: MatDialogRef<CommonSearchComponent>,
    ) {
        this.activate_btn = this.commonService.getActivePermission('button');
        this.filtervalue = data;
    }

    ngOnInit() {
      this.getDynamicTableColumn();
        this.gethcDetails(this.selectedDate);
        
        }

        onWindowResized(size) {
          this.height = size;
        }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('common-search').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        if (this.data.keys == 'GST-AS') {
          this.displayedColumns = dynamicColumns.assetdisplayedColumns;
          this.columnData = dynamicColumns.assetcolumns;
        }else if (this.data.keys == 'GST-MR') {
          this.displayedColumns = dynamicColumns.mrdisplayedColumns;
          this.columnData = dynamicColumns.mrcolumns;
        }else if (this.data.keys == 'GST-TA') {
          this.displayedColumns = dynamicColumns.tagdisplayedColumns;
          this.columnData = dynamicColumns.tagcolumns;
        }else if (this.data.keys == 'GST-US') {
          this.displayedColumns = dynamicColumns.userdisplayedColumns;
          this.columnData = dynamicColumns.usercolumns;
        }else {
          this.displayedColumns = dynamicColumns.displayedColumns;
          this.columnData = dynamicColumns.columns
        }
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.pageSize = dynamicColumns.pageSize
      }
      this.tableData = this.data;
      // this.length = res.totalRecords;
      // this.pageHit = true;
      for (let i = 0; i <= this.columnData.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columnData[i]];
        });
      }
    });
  }    

 headerEventAction(event) {
    
  }
  eventAction(event) {
   
  }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSource.filter = filterValue;
    }
    rowClick(data) {
        this.selectedName = data.id;
    }
    patientInfo(data) {
        console.log('calling patient info');
        data['type'] = '1';
        this.dialog.open(PatientInfoComponent,
            { data: data, panelClass: ['medium-popup'], disableClose: true });
    }

    gethcDetails(dateValue) {
        this.selectedDate = dateValue;
        this.commonService.getHcPatientList(this.selectedDate).subscribe((res) => {
            // this.dataSource.paginator = this.paginator;
        });
    }
    globalSearch(option) {
		console.log('O B J E C T VALUES  ', option);
		this.dashboardService.getTagLoc(option.tagSerialNumber).subscribe(
			(res) => {
                const data = res.results;
                console.log('D A T A :::::::: ', data);

		});
	}
   fixClick() {
    console.log('')
  } 
}

