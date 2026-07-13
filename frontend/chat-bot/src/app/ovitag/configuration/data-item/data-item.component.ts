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
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder,FormGroup,ValidationErrors,Validators } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CommonService, ConfigurationService, DashboardService } from "../../../shared";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { AppToastService } from "../../../shared/services/toaster.service";
import { editFormComponent } from "../../../shared/modules/entry-component/form/form.component";

@Component({
    selector: 'app-data-item',
    templateUrl: './data-item.component.html',
    styleUrls: ['./data-item.component.scss']
})
export class DataItemComponent implements OnInit {
    public showActions: any = [{ id: 'create', value: 'Create' }];
    public selectedName: any = null;
    public tableData: any = [];
    public selectedRow: any = null;
    public applyFilterValue: any = null;
    public pageSize: number = 50;
    public pageStart: number = 0;
    public length: number = 0;
    public loading: boolean = false;
    permissionControl = ['BT_ALLE'];
    sortColumn = ['ID'];
    iconHeader = ['ID'];
    iconColumn = ['ID','Status'];
    displayedColumns: string[] = ['Label Name', 'Name', 'Description', 'Default Value','Type Name', 'Status'];
    public selectedView = "table";
    selectDropdown: any;
    constructor(public dialog: MatDialog, public configurationService:ConfigurationService){}
    ngOnInit(): void {
        this.getAllDataitems();
    }
    refreshPage() {
        this.getAllDataitems();
    }
    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.applyFilterValue = filterValue;
        this.pageStart = 0;
        if (this.applyFilterValue.length > 2) {
            this.getAllDataitems();
        } else if (this.applyFilterValue.length == 0) {
            this.getAllDataitems();
        }
    }
    headerEventAction(event) {
        if (event.key === 'applyFilter') {
            this.applyFilter(event.data,);
        }else if (event.data === 'create') {
            this.createDataitem();
        }else {
            this.selectedName = null;
            this.applyFilterValue = null;
            this.refreshPage();
        }
    }
    getAllDataitems() {
        this.loading = true;
        this.configurationService.getDataitems(this.applyFilterValue, this.pageStart, this.pageSize).subscribe(res => {
            this.loading = false;
            this.tableData = res?.results;
            this.length = res?.totalRecords;
            // this.tableData.reverse();
            const Columns = ['labelName', 'name', 'description', 'defaultValue', 'typeName', 'status'];
            for (let i in Columns) {
                this.tableData.map(data => {
                    data[this.displayedColumns[i]] = data[Columns[i]];
                });
            }
        });
    }
    createDataitem(data?:any){
        let rowData: any = {};
        if(data){
            rowData = {...data};
        }
        rowData['viewTypeId'] = 'TW-FDI';
        const dialogRef = this.dialog.open(editFormComponent, {
            data: rowData,
            panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            this.selectDropdown = [];
            this.applyFilterValue = null;
            this.refreshPage();
        });
    }
    rowClick(data){
        this.selectedRow = data;
        this.createDataitem(this.selectedRow);
    }
}

@Component({
    selector: 'create-data-item',
    templateUrl: './create-data-item.component.html',
    styleUrls: ['./data-item.component.scss']
})
export class CreateDataitem implements OnInit{
    public matcher = new ErrorStateMatcherService();
    public dataItemForm : FormGroup;
    public dataItemTypes : any;
    public modelList: any = [];
    public modelTypes: any = [];
    public targetDb = [{name: 'DB-CLICK-HOUSE', code: 'DB-CLICK-HOUSE'}, {name: 'DB-MYSQL', code: 'DB-MYSQL'}];
    public status = [{code: true, value:'True'}, {code: false, value:'False'}];
    public statusList = [{code: true, value:'Active'}, {code: false, value:'InActive'}];
    public pfmodel:any
    public modelData : any
    constructor(@Inject(MAT_DIALOG_DATA) public data: any,public form: FormBuilder,public dialog: MatDialog, 
    public commonService: CommonService,public toastr: AppToastService,public dashboardService: DashboardService,public configurationService:ConfigurationService, public thisDialogRef: MatDialogRef<CreateDataitem>){
        this.buildForm();
    }
    ngOnInit(): void {
        this.commonService.getAppTerms('DataItemType').subscribe(res => {
            this.dataItemTypes = res.results.filter(resFilter => resFilter.groupName === 'DataItemType');
        });
        this.dashboardService.getAllModals().subscribe(res => {
            if (res.statusCode === 1) {
                this.modelList = res.results;
            }
        });
        this.commonService.getAppTerms('ModelType').subscribe(res => {
            this.modelTypes = res.results;
                     });
    }
    buildForm() {
        this.dataItemForm = this.form.group({
          id: [this.data?.id ?? null],
          customCss: [this.data?.customCss ?? JSON.stringify({ content: null, di: null })],
          customErrorMessage: [this.data?.customErrorMessage ?? null],
          defaultValue: [this.data?.defaultValue ?? null],
          description: [this.data?.description ?? null],
          endDate: [this.data?.endDate ?? null],
          isFacility: [this.data?.isFacility ?? true],
          isMultiSelect: [this.data?.multiSelect ?? true],
          labelName: [this.data?.labelName ?? null],
          name: [this.data?.name ?? null, Validators.pattern(/^\S*$/)],
          pfModelId: [this.data?.pfModelId != null ? Number(this.data.pfModelId) : null],
          startDate: [this.data?.startDate ?? null],
          status: [this.data?.status ?? true],
          tooltip: [this.data?.tooltip ?? null],
          type: [this.data?.type ?? null],
          validation: [this.data?.validation ?? JSON.stringify({ required: false })],
          customValue: [this.data?.customValue ?? JSON.stringify([])],
          modelInput: [this.data?.modelInput ?? null],
          modelType: [this.data?.pfModelData?.modelTypeId ?? null],
          modelName: [this.data?.pfModelData?.name ?? null],
          modelInputParams: [this.data?.pfModelData?.inputParams ?? null],
          modelOutputParams: [this.data?.pfModelData?.outputParams ?? null],
          targetDb: [this.data?.pfModelData?.targetDb ?? null],
          modelUrl: [this.data?.pfModelData?.url ?? null],
          modelQueryString: [this.data?.pfModelData?.queryString ?? null],
          entity: [this.data?.pfModelData?.entity ?? null],
          entityColumn: [this.data?.pfModelData?.entityColumn ?? null],
          entityTable: [this.data?.pfModelData?.entityTable ?? null],
        });
        this.dataItemForm.addValidators(this.customValidate);
      }

      customValidate(fg: FormGroup): ValidationErrors | null {
        let hasError = false;
        const fieldsToValidate = ['customCss', 'validation', 'customValue'];

        for (const field of fieldsToValidate) {
            const control = fg.get(field);
            const value = control?.value;

            if (value !== null && value !== '') {
            try {
                JSON.parse(value);
            } catch (e) {
                control?.setErrors({ invalid: true });
                hasError = true;
            }
            }
        }
        return hasError ? { invalidJson: true } : null;
    }

      saveData(){
         this.modelData = {
                 'id':this.data?.pfModelData?.id,  
                'name': this.dataItemForm.controls.modelName.value,
                'modelTypeId': this.dataItemForm.controls.modelType.value,
                'targetDb': this.dataItemForm.controls.targetDb.value,
                'inputParams': this.dataItemForm.controls.modelInputParams.value,
                'outputParams': this.dataItemForm.controls.modelOutputParams.value,
                'queryString': this.dataItemForm.controls.modelQueryString.value,
                'url': this.dataItemForm.controls.modelUrl.value,
                'entity': this.dataItemForm.controls.entity.value,
                'entityTable': this.dataItemForm.controls.entityTable.value,
                'entityColumn': this.dataItemForm.controls.entityColumn.value,
                'isActive': true
            };
            if (this.dataItemForm.controls.pfModelId.value === -1 && !this.data?.id) {
                this.addModel(this.modelData);
            } else if (this.dataItemForm.controls.pfModelId.value !== -1 && this.data?.id) {
                this.updatemodel(this.modelData);
            }
            else {
                this.saveDataitem();
            }
      }
      saveDataitem(){
        this.configurationService.saveDataitems(this.dataItemForm.value).subscribe(res =>{
            if(res.statusCode === 1){
                this.toastr.success('Success', `${res.message}`);
                this.thisDialogRef.close('confirm');
            }
        });
      }    
      addModel(data) {
        this.dashboardService.saveNewModel(data).subscribe(res => {
            if (res.statusCode === 1) {
                this.toastr.success('Success', res.message);
            } else {
                this.toastr.warning('Warning', res.message);
            }
            this.dataItemForm.controls.pfModelId.setValue(res.results ? res.results.id : null);
            this.saveDataitem();
        });
    } 
    updatemodel(data) {
        this.dashboardService.updateWidgetModelById(data).subscribe(res => {
            if (res.statusCode === 1) {
                this.toastr.success('Success', res.message);
            } else {
                this.toastr.warning('Warning', res.message);
            }
            this.dataItemForm.controls.pfModelId.setValue(res.results ? res.results.id : null);
            this.saveDataitem();
        });
    }

      getDataItemType(data){
        if(data =='DI-TXA'){
            this.dataItemForm.controls['validation'].setValue(JSON.stringify({'required':false,'row':3}));
        }
      }

    modelChange(event) {
        let pfmodel = this.modelList.find(item => item.id == event)
        this.dataItemForm.controls['modelName'].setValue(pfmodel.name);
        this.dataItemForm.controls['modelInputParams'].setValue(pfmodel.inputParams);
        this.dataItemForm.controls['modelOutputParams'].setValue(pfmodel.outputParams);
        this.dataItemForm.controls['modelType'].setValue(pfmodel.modelTypeId);
        this.dataItemForm.controls['targetDb'].setValue(pfmodel.targetDb);
        this.dataItemForm.controls['modelUrl'].setValue(pfmodel.url);
        this.dataItemForm.controls['modelQueryString'].setValue(pfmodel.queryString);
        this.dataItemForm.controls['entity'].setValue(pfmodel.entity);
        this.dataItemForm.controls['entityColumn'].setValue(pfmodel.entityColumn);
        this.dataItemForm.controls['entityTable'].setValue(pfmodel.entityTable);
    }
}
