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
import { ConfigurationService } from "../../../shared";
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { FormBuilderComponent } from "./form-builder/form-builder.component";
import { ActivatedRoute } from "@angular/router";
import { AIPromptFormComponent } from "../../../shared/modules/entry-component/ai-prompt-form/ai-prompt-form.component";

@Component({
    selector: 'app-form-management',
    templateUrl: './form-management.component.html',
    styleUrls: ['./form-management.component.scss']
})
export class FormManagementComponent implements OnInit {
    public showActions: any = [{ id: 'create', value: 'Create' }, { id: 'quickForm', value: 'Quick Form' }];
    public selectedName: any = null;
    public applyFilterValue: any;
    public selectedView = "table";
    selectDropdown: any;
    public tableData: any = [];
    public selectedRow: any = null;
    public selectFilter = [{ id: 'department', value: 'DEPARTMENT' }];
    isLoading: boolean = false;
    permissionControl = ['BT_ALLE'];
    sortColumn = ['ID'];
    iconHeader = ['ID'];
    iconColumn = ['ID'];
    filterValue = null;
    displayedColumns: string[] = ['Name', 'Type', 'Description', 'Version','Modified by','Modified on','Is Facility Specific','Form Status'];
    depId: any;
    public pageStart = 0;
    public pageSize = 50;
    public length = 0;
    dateTimeColumns = ['Modified on']
    public parentFilter = [
        {
            id: 'formdepartment',
            value: 'Form Department',
            isNoneAll: true,
            selectionType: 'single',
            subFilters: [],
            defaultSelected: ['All']
        }
    ];
    constructor(public dialog: MatDialog, public configurationService:ConfigurationService,private readonly route: ActivatedRoute){}
    ngOnInit(): void {
        this.getAllFormTemplates(true, 'All');
        this.getDepartment();
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.applyFilterValue = filterValue;
    }

    getDepartment(){
        this.configurationService.getAssetDepartment().subscribe(res => {
            const departmentId = this.parentFilter.find(item => item.id === 'formdepartment');
            if (departmentId) {
                departmentId.subFilters = res.results.map(({ id, name }) => ({ code: id, value: name }));
            }
        })
    }

    headerEventAction(event) {
        if (event.key === 'applyFilter') {
            this.applyFilter(event.data,);
        }else if (event.data === 'create') {
            this.createForm();
        }else if(event.data === 'dummy'){
            let rowData = { "id" : 24  , "entityId" : 106 , "entityType" : "asset" , "pfFormTemplateId" : 84, "content" : "form"};
            const dialogRef = this.dialog.open(CommonDialogComponent, {
                data: rowData,
                panelClass: ['medium-popup'], disableClose: true
            });
            dialogRef.afterClosed().subscribe(result => {
                console.log(result);
                this.selectDropdown = [];
                this.refreshPage();
            });
        } else if (event.key === 'groupFilter') {
            this.depId = event.data[0].data;
            this.getAllFormTemplates(false, this.depId)
        } else if (event.data === 'quickForm') { 
            this.magicFormAction();
        } else {
            this.selectedName = null;
            this.applyFilterValue = null;
            this.refreshPage();
        }
    }
    createForm(data?:any){
        let rowData = null;
        if(data){
            rowData = data;
        }
        const dialogRef = this.dialog.open(FormBuilderComponent, {
            data: rowData,
            panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            this.selectDropdown = [];
            this.applyFilterValue = null;
            this.refreshPage();
        });
    }
    refreshPage(isAutoRefresh?: boolean) {
        this.filterValue = null;
        if (isAutoRefresh === true) {
        this.applyFilterValue = null;
        }
        this.depId = 'All';
        this.parentFilter = [
            {
                id: 'formdepartment',
                value: 'Form Department',
                isNoneAll: true,
                selectionType: 'single',
                subFilters: [],
                defaultSelected: ['All']
            }
        ];
        this.getAllFormTemplates(null, this.depId);
        this.getDepartment();
    }
    getAllFormTemplates(routerEvent?: boolean, depId?) {
    if (routerEvent) {
        this.isLoading = true;
        this.tableData = this.route.snapshot.data.formManagement.results;
        this.tableData = this.tableData.filter(val => val.status == true)
        const Columns = ['name', 'typeName', 'description', 'version','modifiedBy','modifiedOn','isFacility','formStatusName'];
        for (let i in Columns) {
            this.tableData.map(data => {
                if(Columns[i] == 'isFacility') {
                    data[this.displayedColumns[i]] = data[Columns[i]] ? 'Yes' : 'No';
                } else {
                    data[this.displayedColumns[i]] = data[Columns[i]];
                }
            });
            this.isLoading = false;
        }
      } else {
        this.isLoading = true;
        this.configurationService.getFormTemplatesV2(depId).subscribe(res =>{
            this.isLoading = false;
            this.tableData = res.results;
            this.tableData = this.tableData.filter(val => val.status == true)
            const Columns = ['name', 'typeName', 'description', 'version','modifiedBy','modifiedOn','isFacility','formStatusName'];
            for (let i in Columns) {
                this.tableData.map(data => {
                    if(Columns[i] == 'isFacility') {
                        data[this.displayedColumns[i]] = data[Columns[i]] ? 'Yes' : 'No';
                    } else {
                        data[this.displayedColumns[i]] = data[Columns[i]];
                    }
                });
            }
        });
    }
    this.length = this.tableData.length;
    }
    rowClick(data) {
        this.selectedRow = data;
        if(this.selectedRow.id){
            this.isLoading = true;
            this.configurationService.getFormTemplates(this.selectedRow.id).subscribe(res =>{
                this.isLoading = false;
                if(res.statusCode === 1){
                    this.createForm(res.results[0]);
                }
            });
        }
    }
    eventAction(event) {
        if (event.key === 'Name') {
            this.rowClick(event.data);
        }else if(event.key === 'pagination') {
           this.pageSize = event.data.pageSize;
           this.pageStart = event.data.pageIndex;
          }
    }

    magicFormAction() {
        const dialogRef = this.dialog.open(AIPromptFormComponent, {
            data: null,
            panelClass: ['small-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            this.selectDropdown = [];
            this.applyFilterValue = null;
            this.refreshPage();
        });
    }
}
