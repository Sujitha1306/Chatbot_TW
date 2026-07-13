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

import { Component, Inject, OnInit, Optional } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateKpi, EditKpi } from './manage-kpi.model';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-manage-kpi',
  templateUrl: './manage-kpi.component.html',
  styleUrls: ['./manage-kpi.component.scss']
})
export class ManageKpiComponent implements OnInit {
  public kpiForm: FormGroup;
  public createKpiDetails : CreateKpi;
  public editKpiDetails : EditKpi;
  categoryList = [];
  frequencyList = [];
  valueTypeList = [{code: "percentage", value: "Percentage"}, {code: "number", value: "Number"},
                   {code: "currency", value: "Currency"}, {code: "time", value: "Time"}];
  modelList = []
  columnList =[]
  conditionList =['Less Than', 'Less Than Or Equal', 'Greater Than', 'Greater Than Or Equal', 'Equal To', 'Not Equal To']
  tableData=[]
  displayColumns= ['Column Name','Condition','Value','Type','Style']
  column= ['column','condition','value','type','style']
  applyFilterValue:any;
  permissionControl = [null];
  table=[]
  selectedindex: any = null;

constructor(public form: FormBuilder, public toastr: AppToastService,
    @Optional() public thisDialogRef: MatDialogRef<ManageKpiComponent>, private readonly lookupService : LookupTermService,
  @Inject(MAT_DIALOG_DATA) public data: any, public commonService : CommonService,public configurationService : ConfigurationService) {
  }

  ngOnInit() {
    this.buildForm();
    this.getCategory();
    this.getFrequency();
    this.configurationService.getModel("kpi").subscribe((res)=>{
      this.modelList = res.results.slice(0,5)
       if(this.data?.pfModelId){
       const model = this.modelList.find(r => r.id === this.data.pfModelId)
       console.log(model)
       this.columnList = model.outputParams? model.outputParams.split(',').map(item => item.trim().replace(/^"|"$/g, '')): [];
       }
    })
    if(this.data?.config){ 
      this.tableData = this.data?.config
      this.table = this.tableData
    }
    this.kpiForm.get('modelId')?.valueChanges.subscribe((id) => {
      const model = this.modelList.find(r => r.id === id)
       this.columnList = model.outputParams? model.outputParams.split(',').map(item => item.trim().replace(/^"|"$/g, '')): [];
    });
    this.kpiForm.get('column')?.valueChanges.subscribe(() => this.updateFormula());
    this.kpiForm.get('condition')?.valueChanges.subscribe(() => this.updateFormula());
    this.kpiForm.get('value')?.valueChanges.subscribe(() => this.updateFormula());
  }

  getCategory() {
    this.lookupService.getAppTermsWrapper('KpiMasterCategory').subscribe(res => {
        this.categoryList = res.KpiMasterCategory ?? [];
    });
  }
  
  getFrequency() {
    this.lookupService.getAppTermsWrapper('CalendarFreq').subscribe(res => {
        this.frequencyList = res.CalendarFreq ?? [];
    });
  }
  
  public buildForm() {
    let content = this.data?.config?.[0]?.style;
    if (content && this.isJsonString(content)) {
      content = JSON.stringify(JSON.parse(content), undefined, 4); 
    } else {
      content = null; 
    }
    this.kpiForm = this.form.group({
      name: [this.data?.name ? this.data.name : null, Validators.required],
      categoryId: [this.data?.categoryId ? this.data.categoryId : null, Validators.required],
      frequencyId: [this.data?.frequencyId ? this.data.frequencyId : null],
      formula: [this.data?.formula ? this.data.formula : null],
      unitOfMeasure: [this.data?.unitOfMeasure ? this.data.unitOfMeasure : null],
      valueType: [this.data?.valueType ? this.data.valueType : null],
      target: [this.data?.target ? this.data.target : null],
      description: [this.data?.description ? this.data.description : null],
      modelId : [this.data?.pfModelId ? this.data?.pfModelId : null],
      column : [ null],
      condition : [ null],
      value : [ null],
      style : [null,[this.jsonValidator()]],
      type : [null]
    });
  }

  createKpi() {
    this.createKpiDetails = new CreateKpi(null, null, null, null, null, null, null, null,null,null);
    this.createKpiDetails.name = this.kpiForm.controls['name'].value;
    this.createKpiDetails.categoryId = this.kpiForm.controls['categoryId'].value;
    this.createKpiDetails.frequencyId = this.kpiForm.controls['frequencyId'].value;
    this.createKpiDetails.formula = this.kpiForm.controls['formula'].value;
    this.createKpiDetails.unitOfMeasure = this.kpiForm.controls['unitOfMeasure'].value;
    this.createKpiDetails.valueType = this.kpiForm.controls['valueType'].value;
    this.createKpiDetails.target = parseFloat(this.kpiForm.controls['target'].value);
    this.createKpiDetails.description = this.kpiForm.controls['description'].value;
    this.createKpiDetails.pfModelId = this.kpiForm.controls['modelId'].value;
     this.createKpiDetails.config = this.tableData.map((c: any) => ({
            column: c.column,
            condition: c.condition,
            value: c.value,
            style: c.style,
            type : c.type
            }));
      this.commonService.createKpi(this.createKpiDetails).subscribe(res => {
      this.toastr.success('Success', `${res.message}`,);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateKpi() {
    this.editKpiDetails = new EditKpi(null, null, null, null, null, null, null, null, null,null,null);
    this.editKpiDetails.id = this.data?.id;
    this.editKpiDetails.name = this.kpiForm.controls['name'].value;
    this.editKpiDetails.categoryId = this.kpiForm.controls['categoryId'].value;
    this.editKpiDetails.frequencyId = this.kpiForm.controls['frequencyId'].value;
    this.editKpiDetails.formula = this.kpiForm.controls['formula'].value;
    this.editKpiDetails.unitOfMeasure = this.kpiForm.controls['unitOfMeasure'].value;
    this.editKpiDetails.valueType = this.kpiForm.controls['valueType'].value;
    this.editKpiDetails.target = parseFloat(this.kpiForm.controls['target'].value);
    this.editKpiDetails.description = this.kpiForm.controls['description'].value;
    this.editKpiDetails.pfModelId = this.kpiForm.controls['modelId'].value;
     this.editKpiDetails.config = this.tableData.map((c: any) => ({
            column: c.column,
            condition: c.condition,
            value: c.value,
            style: c.style,
            type : c.type
            }));
      this.commonService.createKpi(this.editKpiDetails).subscribe(res => {
      this.toastr.success('Success', `${res.message}`,);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateFormula() {
  const columnName = this.kpiForm.get('column')?.value;
  const condition = this.kpiForm.get('condition')?.value?.toLowerCase()?.trim()?.replace(/\s+/g, ''); 
  const value = this.kpiForm.get('value')?.value;

  if (columnName && condition && value !== null && value !== undefined) {
    let operator = '';

    switch (condition) {
      case 'lessthan': operator = '<'; break;
      case 'lessthanorequal': operator = '<='; break;
      case 'greaterthan': operator = '>'; break;
      case 'greaterthanorequal': operator = '>='; break;
      case 'equalto': operator = '=='; break;
      case 'notequalto': operator = '!='; break;
      default: operator = condition; 
    }

    const formula = `${columnName} ${operator} ${value}`;
    this.kpiForm.patchValue({ formula }, { emitEvent: false }); 
  }
  }

   isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
   }
   
  jsonValidator() {
  return (control: AbstractControl) => {
    if (!control.value) return null; 

    try {
      JSON.parse(control.value);  
      return null;  
    } catch (e) {
      return { invalidJson: true };  
    }
  };
  }

  addCondition() {
    let config = {
      column :  this.kpiForm.controls.column.value,
      style : this.kpiForm.controls.style.value,
      value : this.kpiForm.controls.value.value,
      condition : this.kpiForm.controls.condition.value,
      type : this.kpiForm.controls.type.value
    }
    this.kpiForm.controls.style.reset()
    this.kpiForm.controls.value.reset()
    this.kpiForm.controls.condition.reset()
    this.kpiForm.controls.column.reset()
    this.kpiForm.controls.type.reset()
    this.table.push(config)
    this.tableData = [...this.table]
  }

  removeCondition() {
    this.kpiForm.controls.style.reset()
    this.kpiForm.controls.value.reset()
    this.kpiForm.controls.condition.reset()
    this.kpiForm.controls.column.reset()
    this.kpiForm.controls.type.reset()

    this.tableData.splice(this.selectedindex, 1)
    this.table = this.tableData
    this.tableData = [...this.tableData]
    this.selectedindex = null
  }


  rowClickEvent(event){
    this.selectedindex = event.index
    this.updateform(event)
  }

  updatecondition(){
      let config = {
      column :  this.kpiForm.controls.column.value,
      style : this.kpiForm.controls.style.value,
      value : this.kpiForm.controls.value.value,
      condition : this.kpiForm.controls.condition.value,
      type : this.kpiForm.controls.type.value
    }
    this.tableData[this.selectedindex]= config
    this.table = this.tableData
    this.tableData = [...this.tableData]
    this.kpiForm.controls.style.reset()
    this.kpiForm.controls.value.reset()
    this.kpiForm.controls.condition.reset()
    this.kpiForm.controls.column.reset()
    this.kpiForm.controls.type.reset()
     this.selectedindex =null
  }

  updateform(event){
    let data = event.data
    this.kpiForm.controls.style.setValue(data?.style)
    this.kpiForm.controls.column.setValue(data?.column)
    this.kpiForm.controls.condition.setValue(data?.condition)
    this.kpiForm.controls.type.setValue(data?.type)
    this.kpiForm.controls.value.setValue(data?.value)
  }

}
