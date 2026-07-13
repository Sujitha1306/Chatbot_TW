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

import { Component, OnInit, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { routerTransition } from '../../../router.animations';
import { DashboardService } from '../../../shared';
import { ManageWidgetComponent } from './manage-widget/manage-widget.component';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
    selector: 'app-widget',
    templateUrl: './widget.component.html',
    styleUrls: ['./widget.component.scss'],
    animations: [routerTransition()],
})

export class WidgetsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    displayedColumns: string[] = ['ID','Code','Name','Widget Type','Model Name','Version','Status','Action'];
    iconHeader = ['ID'];
    iconColumn = ['ID', 'Status','Action'];
    sortColumn = ['ID'];
    permissionControl = ['BT_ALLE'];
    public applyFilterValue: any;

    showActions: any = [{ id: 'create', value: 'Create' }];
    selectedName = null;
    selectDropdown: any;
    public pageStart = 0;
    public pageSize = 50;
    public length = 0;
    public tableData: any = [];
    public selectedRow: any = null;
    public isLoading: boolean = false;

    constructor(public dashboardService: DashboardService, public dialog: MatDialog,private readonly route: ActivatedRoute,public  toastr: AppToastService) { }

    ngOnInit(): void {
       this.getAllwidgets();
    }
    
    private getAllwidgets() {
        this.isLoading = true;
        this.dashboardService.getWidgetList(null, this.applyFilterValue, this.pageStart, this.pageSize).subscribe(res => {
            this.isLoading = false;
            this.tableData = res.results.filter(r => r.isActive != false);
            this.length = res.totalRecords;
            if (this.applyFilterValue) {
                this.applyFilterValue = this.applyFilterValue + ' ';
            }
            const Columns =  ['ID','code','name','widgetTypeName','pfModelName','version','isActive'];
            for (let i in Columns) {
                this.tableData.map(data => {
                    data[this.displayedColumns[i]] = data[Columns[i]];
                });
            }
        });
    }
    rowClick(event) {
        this.showActions = [
            { id: 'create', value: 'Create' },
        ];
        if (this.selectedRow && this.selectedRow.id === event.id) {
            this.selectedRow = null;
            this.selectedName = null;
        } else {
            this.selectedRow = event;
            this.showActions = [
                { id: 'modify', value: 'Modify' },
                { id: 'create', value: 'Create' }
            ];
        }
    }
    refreshPage() {
        this.applyFilterValue = null;
        this.showActions = [{ id: 'create', value: 'Create' }];
        this.getAllwidgets();
    }
    headerEventAction(event) {
        if (event.key === 'applyFilter') {
          this.applyFilter(event.data);
        } else if (event.data === 'modify' || event.data === 'create') {
          this.createWidget(this.selectedRow);
        } else {
          this.selectedName = null;
          this.refreshPage();
        }
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.applyFilterValue = filterValue;
        this.pageStart = 0;
        if (this.applyFilterValue.length > 2) {
            this.getAllwidgets();
        } else if (this.applyFilterValue.length == 0) {
            this.applyFilterValue = null;
            this.getAllwidgets();
        }
    }
    createWidget(rowData) {
        const dialogRef = this.dialog.open(ManageWidgetComponent, { data: rowData,
            panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            this.selectedRow = null;
            this.refreshPage();
        });
    }
    eventAction(event) {
        if (event.key === 'Name') {
            this.createWidget(event.data);
        } else if (event.key === 'pagination') {
          this.pageSize = event.data.pageSize;
          this.pageStart = event.data.pageIndex;
          this.getAllwidgets();
        } else if(event.key === 'Delete'){
            this.deleteWidget(event.data)
        }
    }

    deleteWidget(data){
         data.isActive = false
         const dialogRef = this.dialog.open(ConfirmationDialog, {
                panelClass:['confirmation-popup'], disableClose: true,
                data: {
                title: "Confirm Delete", message: "Are you sure you want to delete?",
                buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1,formStatusEnable: true
                }
            });
        dialogRef.afterClosed().subscribe(result => {
            if(result['confirmButtonText'] == 'Yes'){            
              this.dashboardService.saveWidgetDetailById(data).subscribe(res => {
                 if(res.statusCode === 1){
                     this.toastr.success('Success', `${res.message}`);
                 }
                })
            }
        });
    }
}
