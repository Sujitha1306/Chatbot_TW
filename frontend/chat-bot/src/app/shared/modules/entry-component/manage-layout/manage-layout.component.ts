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

import { Component,  Inject, OnInit, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder,  FormGroup, ValidationErrors, Validators, } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CommonService, ConfigurationService, DashboardService } from "../../../services";
import { ConfirmationDialog } from "../confirmation-dialog/confirmation-dialog.component";
import { MatSelectChange } from "@angular/material/select";
import { AppToastService } from "../../../services/toaster.service";
import { LookupTermService } from "../../../lookup-term.service";

@Component({
  selector: 'app-manage-layout',
  templateUrl: './manage-layout.component.html',
  styleUrls: ['./manage-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ManageLayoutComponent implements OnInit {
  public layoutTabDisp: boolean = true;
  public layoutTabEnable: boolean = true;
  public dashId: any;
  public configForm: any = FormGroup;
  public displayedColumns: string[];
  public displayedColumns1: string[] = ['Config Input', 'Config Input ID', 'Lable Name', 'Default Value', 'Sequence', 'Action'];
  public displayedColumns2: string[] = ['Config Input', 'Config Input ID', 'Appterms Group', 'Lable Name', 'Default Value', 'Sequence', 'Action']
  public permissionControl = ['BT_ALLE'];
  public iconHeader = ['Action'];
  public iconColumn = ['Default Value', 'Action'];
  public eventColumn = [];
  public sortColumn = [];
  public editDataInfo: any = null;
  public inputsListInfo: any[] = [];
  public tableData: any[] = [];
  filterInputsList = [];
  apptermGroupList = [];
  tabClickedLabel: any;
  configInputs: any={};
  inputOption: any=[];
  dynamicInput: any;
  pdfConfig: any;
  filterInputs: any=[];
  filterLayoutList: any=[];
  showDept =false;
  activeWidgets;
  selectedOrder: string[] = [];

  constructor(public thisDialogRef: MatDialogRef<any>, public form: FormBuilder,private readonly configurationService: ConfigurationService,public toastr: AppToastService,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public dashboardService: DashboardService, public dialog: MatDialog,
    private readonly lookupService: LookupTermService) {
      if(this.data){
        this.dashId=this.data.id;
        this.layoutTabDisp = false;
        if(this.data?.linkedResourceCode == null || this.data?.linkedResourceCode == "MN_DB"){
          this.showDept = true;
        }
      }
      this.getApptermsGroup();
  }

  ngOnInit() {
    if(this.data !== null) {
      if(this.data?.configValue !== null) {
        const input = JSON.parse(this.data?.configValue);
        if(input.hasOwnProperty('dynamicHeader')) {
          this.dynamicInput = input['dynamicHeader'];
          this.filterInputs = input['dynamicHeader']['filterInputs'];  
          this.tableData = input['dynamicHeader']['filterInputs']
          this.tableData = this.getDataChanges(this.tableData) 
          this.selectedOrder =  this.dynamicInput.excelSheetOrder
          this.getconfigSetData();
        }
        if(input && input.hasOwnProperty('pdfConfig')){
          this.pdfConfig = input['pdfConfig'];
          this.filterLayoutList = input['pdfConfig']['type'];
        }
        this.buildForm();
      } else {
        this.buildForm();
      }
    }
  }

  buildForm() {
    this.configForm = this.form.group({
      enableExcel: [this.dynamicInput ? this.dynamicInput.enableExcel : null],
      enablePdf: [this.dynamicInput ? this.dynamicInput.enablePdf : null],
      enableRefresh: [this.dynamicInput ? this.dynamicInput.enableRefresh : null],
      enableHeader: [this.dynamicInput ? this.dynamicInput.enableHeader : null],
      enableDepartment: [this.dynamicInput ? this.dynamicInput.enableDepartment : null],
      layoutSize: [this.pdfConfig ? this.pdfConfig.selected : null],
      configName: [null],
      configLabel: [null],
      configDefault: [null],
      configId: [null],
      configSeq: [null],
      configTermsGroup: [null],
      configRequired: [null],
      configVisibled: [null],
      sheetOrder : [this.dynamicInput ? this.dynamicInput.excelSheetOrder : null],
      customFilter : ['', [Validators.required, jsonValidator]]
    });
  }

  getApptermsGroup(){
    this.lookupService.getAppTermsWrapper('LookupGroup').subscribe(res => {
      this.apptermGroupList= res.LookupGroup ?? [];
    })
  }

  addInputs() {
    const fieldData = {
      name: this.configForm.get('configName')?.value,
      label: this.configForm.get('configLabel')?.value,
      default: this.configForm.get('configDefault')?.value,
      id: this.configForm.get('configId')?.value,
      seq: this.configForm.get('configSeq')?.value,
      groupName: this.configForm.get('configTermsGroup')?.value,
      required: this.configForm.get('configRequired')?.value,
      visibled: this.configForm.get('configVisibled')?.value,
      queryParam : this.configForm.get('customFilter')?.value
    };

    if (this.editDataInfo) {
      const index = this.tableData.findIndex(item => item.id === this.editDataInfo.id);
      if (index !== -1) {
        this.tableData[index] = fieldData;
      }
    } else {
      this.tableData.push(fieldData);
    }
    this.tableData = [...this.tableData.sort((a, b) => a.seq - b.seq)];

    ['configName', 'configLabel', 'configDefault', 'configId', 'configSeq', 'configRequired', 'configVisibled'].forEach(field => {
      this.configForm.get(field)?.reset();
    });

    this.editDataInfo = null;

    this.getconfigSetData();
  }


  getconfigSetData() {
    const checkedAppterms = this.inputsListInfo.some(x => x.groupName);
    let Columns = null
    if (checkedAppterms) {
      this.displayedColumns = this.displayedColumns2;
      Columns = ['name', 'id', 'groupName', 'label', 'default', 'seq', 'Action'];
    } else {
      this.displayedColumns = this.displayedColumns1;
      Columns = ['name', 'id', 'label', 'default', 'seq', 'Action'];
    }

    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }

    const dataInfo = this.tableData?.map(x => x.id);
    const layoutInfo = this.filterInputsList?.filter(x => !dataInfo.includes(x.id));
    this.filterInputsList = layoutInfo;
  }

  tabClick(tab){
    this.tabClickedLabel = tab.tab.textLabel;
    let label = tab.tab.textLabel;
    this.layoutTabEnable = label == 'Layout' ? false : true;      
    if(label == 'Config'){
      this.getconfigData();
    }
  }

  getconfigData() {
    this.commonService.getConfigFile('header-config').subscribe(res => {
      if(res.statusCode == 1) {
        this.filterInputsList = res.results?.contentObject?.dynamicHeader?.filterInputs;
        this.inputsListInfo = res.results?.contentObject?.dynamicHeader?.filterInputs
        const dataInfo = this.tableData?.map(x => x.id);
        const layoutInfo = this.filterInputsList?.filter(x => !dataInfo.includes(x.id));
        this.filterInputsList = layoutInfo;
        this.filterLayoutList = res.results?.contentObject?.pdfConfig?.type;
      }
    });
  }

  bindInputs(data: any, key?: any) {
    if (key === 'Edit') {
      this.editDataInfo = data;
      this.filterInputsList = this.inputsListInfo;
    }
    const fieldMap = {
      configName: data.name,
      configLabel: data.label,
      configDefault: data.default,
      configId: data.id,
      configSeq: data.seq,
      configRequired: data.required,
      configVisibled: data.visibled,
      configTermsGroup: data.groupName,
      customFilter: data.queryParam 
    };
    Object.keys(fieldMap).forEach(field => {
      const control = this.configForm.get(field);
      if (control) {
        control.setValue(fieldMap[field]);
      }
    });
  }

  saveInputs(){
    let isFactory = true;
    if(this.data.userId !== null) {
      isFactory = false;
    }
    this.configInputs = {
      "dynamicHeader": {
        "filterInputs": [],
        "enableExcel": this.configForm.controls['enableExcel'].value === true ? true : false,
        "enablePdf": this.configForm.controls['enablePdf'].value === true ? true : false,
        "enableRefresh": this.configForm.controls['enableRefresh'].value === true ? true : false,
        "enableHeader": this.configForm.controls['enableHeader'].value === true ? true : false,
        "enableDepartment": this.configForm.controls['enableDepartment'].value === true ? true : false,
        "excelSheetOrder" : this.configForm.controls['sheetOrder'].value

      },
      "pdfConfig":{
        "type": this.configInputs?.pdfConfig?.type,
        "selected": this.configForm.controls['layoutSize'].value
      }
    }
    const inputs = [...this.tableData];
    this.configInputs['dynamicHeader']['filterInputs'] = [...inputs];
    const data = {
      "dashboardId": this.data.dashboardId,
      "dashboardName": this.data.dashboardName,
      "isFactory": isFactory,
      "configValue": JSON.stringify(this.configInputs ? this.configInputs : {})
    }
    this.dashboardService.saveCurrentDashboard(data).subscribe(res => {
      if (res.statusCode === 1) {
      this.toastr.success('Success', `${res.message}`);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateSaveAction(event){
    if(event){
      this.data = event; 
      this.dashId=this.data.id;
      this.layoutTabDisp = false;
      this.ngOnInit();
    }
  }
  fixClick() {
    console.log('')
  }

  eventAction(event) {
    if (event.key === 'Edit') {
      this.bindInputs(event.data, event.key);
    } else if (event.key === 'Delete') {
      this.removedData(event.data);
    } else if (event.key === 'widgetNames'){
          this.activeWidgets = event.data
    }
  }

    onSelectionChange(event: MatSelectChange) {
      const values: string[] = event.value || [];
      values.forEach(v => {
        if (!this.selectedOrder.includes(v)) {
          this.selectedOrder.push(v);
        }
      });
      this.selectedOrder = this.selectedOrder.filter(v => values.includes(v));
      if (JSON.stringify(values) !== JSON.stringify(this.selectedOrder)) {
        this.configForm.patchValue({ sheetOrder: this.selectedOrder }, { emitEvent: false });
      }
    }
    


  getDefaultValueChange(value?: any[]): any[] {
    if (!value) return [];

    return value.map(item => {
      const newItem = { ...item };

      if (newItem['default']) {
        const date = new Date(newItem['default']);
        if (!isNaN(date.getTime())) {
          const parts = newItem['default'].split('T')[0].split('-');
          newItem['default'] = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        }
      }

      return newItem;
    });
  }

  removedData(data) {
    if (data) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirm Delete', message: 'Are you sure you want to delete?',
          buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        if (res.confirmButtonText === 'Yes') {
          const index = this.tableData.indexOf(data);
          if (index !== -1) {
            this.tableData = this.tableData.filter((_, i) => i !== index);
          }
          this.tableData = [...this.tableData];
        }
      })
    }
  }

  getDataChanges(data: any[]) {
    if (Array.isArray(data[0])) {
      data = data[0];
    }
    const hasValidDate = data.some(x => {x.default && !isNaN(Date.parse(x.default))});

    let tableDataInfo = hasValidDate ? this.getDefaultValueChange(data) : data;
    tableDataInfo = tableDataInfo.sort((a, b) => a.seq - b.seq);
    return tableDataInfo;
  }

}
export function jsonValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  try {
    JSON.parse(control.value);
    return null;
  } catch (e) {
    return { invalidJson: true };
  }
}
