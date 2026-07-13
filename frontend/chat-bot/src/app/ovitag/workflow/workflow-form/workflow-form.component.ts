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
import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  Optional,
} from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CommonService, ConfigurationService, } from "../../../shared";
import { ActivatedRoute, } from "@angular/router";
import { DatePipe } from "@angular/common";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MY_FORMATS } from '../../../app.module';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { LookupTermService } from "../../../shared/lookup-term.service";
@Component({
  selector: 'app-workflow-form',
  templateUrl: './workflow-form.component.html',
  styleUrls: ['./workflow-form.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class FormComponent implements OnInit {

  public activate_btn: any = [];
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: "create", value: "Create Form" }
  ];
  showAction2 = [
    { id: "preview", value: "Preview" }
  ];
  public showActions = this.showAction1
  public selectDropdown: any;
  public selectedName: any = null;
  public selectedView = 'table';
  public selectFilter = [{ id: 'status', value: 'STATUS' }];
  public selectTypeFilter = [{ id: 'type', value: 'TYPE' }];
  public rowFilter: any = [];
  public rowTypeFilter: any = [];
  displayedColumns: string[] = ['Type', 'Date', 'Status', 'Assigned To', 'viewHistory', 'Preview'];
  dateColumns =['Date']
  eventColumn = [];
  iconHeader = [];
  iconColumn: any = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  tableData: any;
  formTypeId: any;

  @ViewChild('filter') input;
  public statusList: any = [];
  rowData = null;
  formData = null;
  formStatusIds = null;
  formTypes = null;
  responseColumns: any = [];

  constructor(public datepipe: DatePipe, public fb: FormBuilder, public dialog: MatDialog,
    public configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly route: ActivatedRoute, @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly lookupService: LookupTermService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.searchLoc('status');
    this.searchType('type');
  }
  ngOnInit() {
    this.route.queryParams.subscribe(param => {
      this.formTypeId = null;
      if (param.hasOwnProperty('formTypes')) {
        this.formTypeId = param['formTypes'];
      }
    })
    this.getAllFormTemplates(this.selectedDate, false);
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  refreshPage(isAutoRefresh?: boolean) {
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.showActions = this.showAction1;
    this.selectedName = null;
    this.applyFilterValue = null;
    this.selectDropdown = null;
    this.getAllFormTemplates(this.selectedDate, null, null);
  }

  eventAction(event) {
    if (event.key == 'Preview') {
      this.formBuilder(event.data);
    } else if(event.key == 'viewHistory'){
      this.viewHistory(event.data);
    }
  }

  searchLoc(id) {
    if (id === "status") {
      this.lookupService.getAppTermsWrapper('FormStatus').subscribe(res => {
        let formStatusList = res.FormStatus ?? [];
        for (let i in formStatusList) {
          let statusList = {
            id: formStatusList[i].code,
            name: formStatusList[i].value
          };
          this.rowFilter.push(statusList);
        };
      });
    }
  }

  searchType(id) {
    if (id === "type") {
      this.lookupService.getAppTermsWrapper('FormTemplateType').subscribe(res => {
        let formTemplateTypeList = res.FormTemplateType ?? [];
        for (let i in formTemplateTypeList) {
          let typeList = {
            id: formTemplateTypeList[i].code,
            name: formTemplateTypeList[i].value
          };
          this.rowTypeFilter.push(typeList);
        };
      });
    }
  }

  manageWorklist(statusCode) {
    if(statusCode === 'All'){
      this.formStatusIds = null;
    } else{
      this.formStatusIds = statusCode;
    }
    this.getAllFormTemplates(this.selectedDate, this.formStatusIds);
  }

  manageTypelist(typeCode) {
    if(typeCode === 'All'){
      this.formTypes = null;
    } else{
      this.formTypes = typeCode;
    }
    this.getAllFormTemplates(this.selectedDate, this.formTypes);
  }


  getAllFormTemplates(fromDate?: any,routerEvent?: boolean, formStatusIds?: string, formTypes?: string) {
    this.selectedDate = this.datepipe.transform(new Date(fromDate), 'yyyy-MM-dd');
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.form.results;
      const Columns = [
        'name',
        'startDate',
        'entityFormStatusName',
        'entityType'
      ];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      if (formStatusIds === null || formStatusIds === 'All') {
        formStatusIds = null;
      } else {
        formStatusIds = this.formStatusIds;
      }
      if (formTypes === null || formTypes === "All") {
        formTypes = null;
      } else if(this.formTypeId !== null) {
        formTypes = this.formTypeId
      } else {
        formTypes = this.formTypes;
      }
      this.commonService.getWorkflowFrom(this.selectedDate, formStatusIds, formTypes).subscribe(res => {
        this.tableData = res.results;
        const Columns = ['name', 'startDate', 'entityFormStatusName', 'entityType'];
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      });
    }
  }

  formBuilder(data) {
    this.formData = { "id": data.id, "pfFormTemplateId": data.pfFormTemplateId, "content": "form", "entityId" : null, "entityType" : null, "parentId" : null, "parentType" : null };
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: this.formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.formData = null;
      this.getAllFormTemplates(this.selectedDate, this.formStatusIds, this.formTypes);
    });
  }

  viewHistory(data){
    this.formData = { "id" : data.id , "entityId" : null , "entityType" : "asset" , "parentId" : null, "parentType" : null,  "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": null,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.formData = null;
    });
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getAllFormTemplates(this.selectedDate);
    } else if (event.key === "manageWorklist") {
      this.manageWorklist(event.data);
    } else if (event.key === "manageTypelist") {
      this.manageTypelist(event.data);
    } else if (event.data === 'create') {
      this.createForm('');
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  createForm(data, value?: any) {
    this.showActions = null;
    let rowData = null;
    if (data === 'modify') {
      rowData = value
    }
    const dialogRef = this.dialog.open(CreateFormComponent, {
      data: rowData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.applyFilterValue = null;
      this.refreshPage();
    });
  }
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./workflow-form.component.scss'],
})
export class CreateFormComponent implements OnInit {
  public forms: FormGroup;
  formTemplate: any = [];
  formData = null;
  formTemplateTypeList: any = [];

  constructor(public fb: FormBuilder, public dialog: MatDialog, private readonly commonService: CommonService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any, private readonly lookupService: LookupTermService) {
  }

  ngOnInit() {
    this.getFormTemplate();
    this.buildForm();
  }

  public buildForm() {
    this.forms = this.fb.group({
      formTypeId: [null],
      formSelectId: [null]
    });
  }

  getFormTemplate() {
    this.commonService.getFormTemplate('FTT-AT').subscribe(res => {
      this.formTemplate = res.results;
    });
    this.lookupService.getAppTermsWrapper('FormTemplateType').subscribe(res => {
      this.formTemplateTypeList = res.FormTemplateType ?? [];
    });
  }

  formBuilder(data) {
    const pfFormTemplateId = this.forms.controls['formSelectId'].value;
    this.formData = { "pfFormTemplateId": pfFormTemplateId, "content": "form", "entityData": this.forms.value, "entityId" : null, "entityType" : null, "parentId" : null, "parentType" : null };

    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: this.formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.formData = null;
    });
  }
}
