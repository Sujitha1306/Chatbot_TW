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
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System
 * ======================================================================================================
 ******************************************************************************/
import { Component, Inject, Input, OnInit, Optional} from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { startWith, map } from 'rxjs/operators';
import { AppToastService } from '../../../../services/toaster.service';
import { LookupTermService } from '../../../../lookup-term.service';

@Component({
  selector: 'app-kpi-management',
  templateUrl: './kpi-management.component.html',
  styleUrls: ['./kpi-management.component.scss']
})
export class KpiManagementComponent implements OnInit {
public kpiTemplate: FormGroup;
public templateList = [];
public kpiSource: any = [];
public filteredTemplateList = [];
public kpiSearch: FormControl = new FormControl('');
@Input() data: any;

constructor(
    public form: FormBuilder,
    public dialog: MatDialog,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    @Optional() public thisDialogRef: MatDialogRef<any>,
    private readonly commonService: CommonService,
) {
}
  
ngOnInit() {
  this.getTemplate();
  this.getkpiDetails();
  this.buildForm();
  this.setupSearch();
}

public buildForm() {
  this.kpiTemplate = this.form.group({
      kpiMasterId: [null]
  })
}

triggerAction(event)  {
  if(event.key ==='Edit'){
    const dialogRef = this.dialog.open(ManageKpiEntityComponent, {
      data: event.data,
      height: '350px',
      width: '500px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getkpiDetails();
      this.kpiTemplate.reset();
    });
    
  }else if(event.key ==='view'){
    console.log('')
  }
}

setupSearch() {
   this.kpiSearch.valueChanges.pipe(startWith('')).subscribe(searchText => {
    const existingIds = new Set(this.kpiSource.map(item => item.kpiMasterId));
    const availableTemplates = this.templateList.filter(t => !existingIds.has(t.id));
      this.filteredTemplateList = this.filterTemplates(searchText, availableTemplates);
  });
}

filterTemplates(searchText,baseList) {
  if (!searchText) return baseList;
  const lower = searchText?.toLowerCase();
  return baseList.filter(t => t?.name?.toLowerCase().includes(lower));
}

getTemplate() {
  this.commonService.getEntityKpiTemaplates().subscribe(res=>{
    this.templateList = res.results;
    this.refreshFilteredList();
  })
}

getTemplateInfo() {
  let data =  this.filteredTemplateList.find(item=>item.id === this.kpiTemplate.controls.kpiMasterId.value);
  data['type']='create';
  data['entityId']= this.data?.entityId;
  data['entityType']=this.data?.entityType;
  data['kpiMasterId']= this.kpiTemplate.controls.kpiMasterId.value;
  const dialogRef = this.dialog.open(ManageKpiEntityComponent, {
      data: data,
      height: '350px',
      width: '500px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getkpiDetails();
      this.kpiTemplate.reset();
    })
}


getkpiDetails() {
  this.commonService.getEnityKpiDetails(this.data.entityId, this.data.entityType).subscribe(res => {
    if (res.statusCode == 1) {
      this.kpiSource = res.results;
      this.refreshFilteredList();
    }
  });
}

refreshFilteredList() {
  const existingIds = this.kpiSource.map(item => item.kpiMasterId); // ✅ use correct field
  this.filteredTemplateList = this.templateList.filter(t => !existingIds.includes(t.id));
}

}

@Component({
  selector: 'app-manage-kpi',
  templateUrl: './manage-kpi.component.html',
  styleUrls: ['./kpi-management.component.scss']
})
export class ManageKpiEntityComponent implements OnInit{

public entityForm: FormGroup;
frequencyList = [];
constructor(
  public form: FormBuilder,private readonly commonService: CommonService,public toastr: AppToastService,public lookupService : LookupTermService,private readonly dateFormat: DatePipe,
  public dialogRef: MatDialogRef<ManageKpiEntityComponent>,@Inject(MAT_DIALOG_DATA) public data: any
) {}


ngOnInit():void{
  this.buildForm();
  this.lookupService.getAppTermsWrapper('CalendarFreq').subscribe(res => {
      this.frequencyList = res.CalendarFreq ?? [];
  });
}

buildForm(){
  this.entityForm = this.form.group({
      target: [this.data?.target??null,[Validators.pattern('^[0-9]+(\.[0-9]{1,2})?$')]],
      unitOfMeasure:[this.data?.unitOfMeasure??null],
      frequencyId:[this.data?.frequencyId?? null]
  })
}

UpdateData() {
  let data = {
    entityId: this.data?.entityId,
    entityType: this.data?.entityType,
    formula: this.data?.formula,
    frequencyId: this.entityForm.controls?.frequencyId?.value,
    isActive: true,
    kpiMasterId: this.data?.kpiMasterId,
    target: parseFloat(this.entityForm.controls?.target?.value),
    unitOfMeasure: this.entityForm.controls?.unitOfMeasure?.value,
    valueType: this.data?.valueType,
    lastUpdated: this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
  }
  const apiCall = this.data?.id && this.data?.type !== 'create'? this.commonService.updateKpiTemplate(this.data?.id, data): this.commonService.postKpiTemplate(data);
  apiCall.subscribe({next: (res) => {
      this.toastr.success('Success', res.message);
      this.dialogRef.close();
    },
    error: (err) => {
      this.toastr.error('Error', err.error?.message);
    }
  });
}
}


