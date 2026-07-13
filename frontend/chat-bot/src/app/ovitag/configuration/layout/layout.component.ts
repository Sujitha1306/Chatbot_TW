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
import { MatDialog } from "@angular/material/dialog";
import { DashboardService } from "../../../shared";
import { ManageLayoutComponent } from "../../../shared/modules/entry-component/manage-layout/manage-layout.component";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { ActivatedRoute } from "@angular/router";
import { AppToastService } from "../../../shared/services/toaster.service";
@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
    public showActions: any = [{ id: 'create', value: 'Create' },{ id: 'delete', value: 'Delete' }];
    public selectedName: any = null;
    public applyFilterValue: any;
    public selectedRow: any = null;
    permissionControl = ['BT_ALLE'];
    sortColumn = [];
    iconHeader = ['select'];
    iconColumn = ['select'];
    eventColumn = ['Code','Layout Name'];
    displayedColumns: string[] = ['select', 'Code', 'Layout Name','Linked Resource Name','User Name','Facility Name'];
    public selectedView = 'table';
    public tempTableData : any = [];
    public tableData: any = [];
    selectDropdown: any;
    public rowFilter = [{id:"USER",name:"User"},{id:"FACT",name:"factory"}];
    public selectFilter = [{ id: "layout", value: "Layout" }];
    public deleteDashIds: any;
    public loading: boolean = false;
    constructor(public dashboardService: DashboardService, public dialog: MatDialog,public toastr: AppToastService,private readonly route: ActivatedRoute) { }
    ngOnInit(): void {
        this.tableData = this.route.snapshot.data.layouts.results;
        const Columns = ['select', 'code', 'dashboardName', 'linkedResourceName', 'userName', 'facilityName'];
        for (let i = 0; i <= Columns.length; i++) {
            this.tableData.map(data => {
                data[this.displayedColumns[i]] = data[Columns[i]];
            });
        }
    }
    headerEventAction(event) {
        if (event.key === 'applyFilter') {
            this.applyFilter(event.data);
        } else if (event.data === 'modify' || event.data === 'create') {
            if (event.data === 'create' || this.selectedRow == null) {
                this.createLayout(null);
            } else {
                this.createLayout(this.selectedRow);
            }
        } else if(event.data === 'delete'){
            const dialogRef = this.dialog.open(ConfirmationDialog, {
                panelClass:['confirmation-popup'], disableClose: true,
                data: {
                title: "Confirm Delete", message: "Are you sure you want to delete?",
                buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1,formStatusEnable: true
                }
            });
            dialogRef.afterClosed().subscribe(result => {
                if(result['confirmButtonText'] == 'Yes'){
                    this.deleteLayout();
                } else{
                    this.refreshPage();
                    this.selectDropdown = [];
                    this.applyFilterValue = null;
                }
            });
        }else if(event.key ==='manageWorklist'){
            this.layoutFilter(event.data);
        } else {
            this.refreshPage(true);
        }
    }
    checkBoxAction(event){
        if(event){
            this.deleteDashIds = event;
        }
    }
    deleteLayout(){
        if(this.deleteDashIds?.length){
            this.dashboardService.deleteDashboardLayoutByIds(this.deleteDashIds).subscribe(res => {
                if(res.statusCode == 1){
                    this.toastr.success('Success', `${res.message}`);
                }
                this.refreshPage();
                this.selectDropdown = [];
                this.applyFilterValue = null;
            })
        }
    }
    layoutFilter(data){
        if(data == "All"){
            this.tableData = this.tempTableData;
        } else if(data == "USER"){
            this.tableData = this.tempTableData.filter(val => val.userId != null);
        } else if(data == "FACT"){
            this.tableData = this.tempTableData.filter(val => val.userId == null);
        }
    }
    rowClick(event) {
        this.showActions = [
            { id: 'create', value: 'Create' },
            { id: 'delete', value: 'Delete' },
        ];
        if (this.selectedRow && this.selectedRow.id === event.id) {
            this.selectedRow = null;
        } else {
            this.selectedRow = event;
            this.showActions = [
                { id: 'create', value: 'Create' },
                { id: 'delete', value: 'Delete' }
            ];
        }
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.applyFilterValue = filterValue;
    }
     eventAction(event) {
    if (event.key === 'Code' || event.key === 'Layout Name') {
      this.createLayout(event.data);
    }
   }
    createLayout(rowData) {
        if(rowData !== null) {
            const userId = localStorage.getItem(btoa('userId'));
            this.dashboardService.getDashboardbyIds(rowData.id, userId).subscribe(res => {
                if(res.results.length) {
                    rowData = res.results[0];
                    rowData['id'] = rowData.dashboardId;
                };
                const dialogRef = this.dialog.open(ManageLayoutComponent, {
                    data: rowData,
                    panelClass: ['medium-popup'], disableClose: true
                });
                dialogRef.afterClosed().subscribe(result => {
                    this.selectDropdown = [];
                    this.refreshPage();
                    this.applyFilterValue = null;
                });
            });
        } else {
            const dialogRef = this.dialog.open(ManageLayoutComponent, {
                data: rowData,
                panelClass: ['medium-popup'], disableClose: true
            });
            dialogRef.afterClosed().subscribe(result => {
                this.selectDropdown = [];
                this.refreshPage();
                this.applyFilterValue = null;
            });
        }
    }
    refreshPage(isAutoRefresh?: boolean) {
        if (isAutoRefresh === true) {
            this.applyFilterValue = null;
        }
        this.getAllLayouts();
    }
    private getAllLayouts(){
        this.loading = true;
        const userId = localStorage.getItem(btoa('userId'));
        this.dashboardService.getDashboardDetailsListLayout(true,userId).subscribe(res => {
            this.loading = false;
            let newData = res.results.map(obj => {
                return { ...obj, select: '' };
              });
            this.tempTableData = newData;
            this.tableData = newData;
            const Columns = ['select', 'code', 'dashboardName','linkedResourceName', 'userName', 'facilityName'];
            for (let i = 0; i <= Columns.length; i++) {
                this.tableData.map(data => {
                    data[this.displayedColumns[i]] = data[Columns[i]];
                });
            }
        });
    }
}
