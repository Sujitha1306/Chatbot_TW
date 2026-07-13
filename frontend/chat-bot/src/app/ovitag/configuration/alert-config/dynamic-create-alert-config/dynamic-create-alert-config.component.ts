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
import { Component, EventEmitter, Inject, Input, OnChanges,  Output } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../../shared';
import { CreateAlertRule, EditAlertRule } from '../../configuration.model';

@Component({
  selector: 'dynamic-create-alert-config',
  templateUrl: './dynamic-create-alert-config.component.html',
  styleUrls: ['./dynamic-create-alert-config.component.scss']
})

export class DynamicCreateAlertConfigComponent implements  OnChanges {

  @Input() selectedIndex;
  @Input() ruleType;
  @Input() alertType;
  @Input() ruleCategory;
  @Input() alert: any = [];
  @Input() editData;
  alertTypeId: any;
  ruleCategoryId: any;
  public dynamicAlertRuleForm: FormGroup;
  removedArrayList = [];
  removedArray = [];
  arrayListOption = [];
  dynamicFormFields: any=[];
  popWidth: number;
  popHeight: number;
  contentHeight: number;
  formFields = [];
  subFields = [];
  dynamicSubFields = [];
  showFields = [];
  public createAlertRule: CreateAlertRule;
  public editAlertRule: EditAlertRule;
  @Output() footerEventAction = new EventEmitter();
  config: any=[];
  configRule: any=[];
  subArrayList: any=[];
  subConfig:any=[];
  subConfigRule: any=[];
  subConfigFields: any=[];
  sensorConfig: any=[];
  dynamicFormSensorFields: any=[];
  sensorFields: any=[];
  pfAlertConditionId = null;
  subData: any=null;
  removedSubArrayList: any=[];
  removedSubArray: any=[];
  removedSubConfig: any=[];
  loading = false;
  locationsList: any=[];
  alertData: any=[];
  locationsName: any=[];
  subDataCol: any=[];
  defenderTypeList = [{value: 'Group', code: 'ADGT-DG'},{value: 'Reader', code: 'ADGT-DR'},{value: 'Reader Type', code: 'ADGT-DRT'}];
  geofenceTypeList = [{value: 'Boundary In', code: 'AGT-BI'},{value: 'Boundary Out', code: 'AGT-BO'}];
  tagEntityList = [{value: 'Group', code: 'WG'},{value: 'Without Group', code: 'WOG'}];
  tagEntityDefList = [{value: 'Group', code: 'WOSG'}, {value: 'Without Group', code: 'WOSWG'}];
  tagEntityGeoList = [{value: 'Group', code: 'WOSG'}, {value: 'Without Group', code: 'WOS'}];
  locationOptionList = [{value: 'Location', code: 'L'},{value: 'Location Type', code: 'LT'},]
  sensorTypeList = [{value: 'Reader', code: 'SAT-RDR'},{value: 'Tag', code: 'SAT-TAG'}];
  deviceTypeList = [{value: 'Reader', code: 'DAT-RDR'},{value: 'Tag', code: 'DAT-TAG'}];
  sensorEntityList = [{value: 'ID', code: 'ID'},{value: 'Type', code: 'TYP'},{value: 'Group', code: 'GP'}];
  deviceEntityList = [{value: 'ID', code: 'ID'},{value: 'Type', code: 'TYP'},{value: 'Group', code: 'GP'}];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public commonService: CommonService,
    public form: FormBuilder) {}


  onWindowResizedWidth(size) {
    this.popWidth = size;
  }

  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 250;
  }

  public buildForm() {
    this.dynamicAlertRuleForm = this.form.group({
      arrayList: this.form.array([this.editArrayList(0)]),
      showFields: new FormControl(null),
    });
  }

  getDefenderType(i) {
    const type = this.dynamicAlertRuleForm.controls.arrayList.value[i]['defenderType'];
    const entity = this.dynamicAlertRuleForm.controls.arrayList.value[i]['tagEntity'];
    if(type !== null && entity !== null) {
      let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      arrays.controls[i].patchValue({ "defender_type": type+entity });
      this.dynamicFormFields.forEach(data =>{
        if(data.key === 'defender_type') {
          this.showField(type+entity, data.validLink, i);
        }
      });
    }
  }

  getGeofenceType(i) {
    const type = this.dynamicAlertRuleForm.controls.arrayList.value[i]['geofenceType'];
    const entity = this.dynamicAlertRuleForm.controls.arrayList.value[i]['tagEntityGeo'];
    const option = this.dynamicAlertRuleForm.controls.arrayList.value[i]['locationOption'];
    if(type !== null && entity !== null && option !== null) {
      let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      arrays.controls[i].patchValue({ "geo_type": type === 'AGT-BI' ? type+entity : type+entity+option });
      this.dynamicFormFields.forEach(data =>{
        if(data.key === 'geo_type') {
          this.showField(type === 'AGT-BI' ? type+entity : type+entity+option, data.validLink, i);
        }
      });
    }
  }

  getLocationOption(i, type) {
    let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    if(this.ruleType === 'RU-GO' && (type === 'AGT-BI' || 
    this.dynamicAlertRuleForm.controls.arrayList.value[i]['scope_id'] === 'TAT-EM')) {
      arrays.controls[i].patchValue({ "locationOption": 'L' });
    } else {
      arrays.controls[i].patchValue({ "locationOption": null });
    }
  }

  getSensorType(i) {
    const type = this.dynamicAlertRuleForm.controls.arrayList.value[i]['sensorType'];
    const entity = this.dynamicAlertRuleForm.controls.arrayList.value[i]['sensorEntity'];
    if(type !== null && entity !== null) {
      let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      let entityName = type
      if(entity !== 'ID') {
        entityName = type+ '-' +entity
      }
      arrays.controls[i].patchValue({ "type": entityName });
      this.dynamicFormFields.forEach(data =>{
        if(data.key === 'type') {
          this.showField(entityName, data.validLink, i);
        }
      });
    }
  }

  getDeviceType(i) {
    const type = this.dynamicAlertRuleForm.controls.arrayList.value[i]['deviceType'];
    const entity = this.dynamicAlertRuleForm.controls.arrayList.value[i]['deviceEntity'];
    if(type !== null && entity !== null) {
      let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      let entityName = type
      if(entity !== 'ID') {
        entityName = type+ '-' +entity
      }
      arrays.controls[i].patchValue({ "type": entityName });
      this.dynamicFormFields.forEach(data =>{
        if(data.key === 'type') {
          this.showField(entityName, data.validLink, i, 0);
        }
      });
    }
  }

  editArrayList(index) {
    let type = null;
    let entity = null;
    let option = null;

    const getData = (key) => this.data?.[key];

    const extractDefenderType = () => {
      const value = getData('defender_type');
      if (!value) return;
      const def = value.split('W');
      type = def[0];
      entity = value.slice(value.indexOf('W'));
    };

    const extractGeoType = () => {
      const value = getData('geo_type');
      if (!value) return;
      const geo = value.split('W');
      type = geo[0];
      const group = value.slice(value.indexOf('W')).split('L');
      entity = group[0];
      option = type !== 'AGT-BI' ? value.slice(value.indexOf('L')) : 'L';
    };

    const extractSensorType = () => {
      const value = getData('type');
      if (!value) return;
      const sensor1 = value.replace(/-TYP|-GP|-ID/g, '').split('-ID');
      type = sensor1[0];
      if (value.includes('-TYP')) {
        entity = value.slice(value.indexOf('TYP'));
      } else if (value.includes('-GP')) {
        entity = value.slice(value.indexOf('GP'));
      } else {
        entity = 'ID';
      }
    };

    extractDefenderType();
    extractGeoType();
    extractSensorType();

    const form = this.initForm(index, type, entity, option);
    const list = [];

    this[`deviceConfigList${index}`] = [];
    this.dynamicFormFields = this.alert.create;

    const firstKey = this.dynamicFormFields[0].key;
    this.formFields.push(firstKey);
    this.showFields.push(firstKey);

    this.dynamicFormFields.forEach((dynamicField, i) => {
      const field = dynamicField.key;
      this.processDynamicField({
        dynamicField,
        field,
        form,
        index,
        list
      });
    });

    (form as FormGroup).addControl('showFields',this.form.control(this.data ? Object.keys(this.data) : this.showFields));
    return form;
  }

  private initForm(index: number, type: any, entity: any, option: any): FormGroup {
    return this.form.group({
      id: [this.data.id],
      defenderType: [type],
      tagEntity: [entity],
      geofenceType: [type],
      tagEntityGeo: [entity],
      locationOption: [option],
      sensorType: [type],
      sensorEntity: [entity],
      deviceType: [type],
      deviceEntity: [entity],
      subArrayList: this.form.array([this.editSubArrayList(0, index)]),
    });
  }

  private addValidLinkFilter(targetList: any[], validLinks: any[]): any[] {
    const validCodes = validLinks.map(link => link.valid_link);
    return targetList?.filter(x => validCodes.includes(x.code));
  }

  private fetchAndFilterList(field: string, url: string, validLinks: any[], keyPrefix: any): void {
    this.commonService.getApiWithUrl(url).subscribe(res => {
      let resultList = res.results;
      if (validLinks?.length) {
        resultList = this.addValidLinkFilter(resultList, validLinks);
      }
      this[`${field}List${keyPrefix}`] = resultList;
      this.loading = false;
    });
  }

  private handleValidLinks(dynamicField: any, field: string, index: number, list: string[]): void {
    for (const link of dynamicField.validLink) {
      if (link.valid_link === this.data[field]) {
        this.processValidRequestFields(link.requestField, index, list);
      }
    }

    const fieldListKey = `${field}List${index}`;
    if (this[fieldListKey]) {
      this[fieldListKey] = this.addValidLinkFilter(this[fieldListKey], dynamicField.validLink);
    }
  }

  private processValidRequestFields(requestFields: any[], index: number, list: string[]): void {
    if (!requestFields) return;

    for (const req of requestFields) {
      list.push(req.requestKey);
      const reqUrl = req.api + req.defaultParams;
      this.fetchAndAssignFilteredList(reqUrl, req.validLink, req.requestKey, index);
    }
  }

  private fetchAndAssignFilteredList(
    url: string,
    validLinks: any[],
    targetKey: string,
    index: number
  ): void {
    this.commonService.getApiWithUrl(url).subscribe(res => {
      let resultList = res.results;
      if (validLinks?.length) {
        resultList = this.addValidLinkFilter(resultList, validLinks);
      }
      this[`${targetKey}List${index}`] = resultList;
      this.loading = false;
    });
  }

  private processDynamicField({
    dynamicField,
    field,
    form,
    index,
    list
  }: {
    dynamicField: any;
    field: string;
    form: FormGroup;
    index: number;
    list: string[];
  }): void {
    const isMultipleFalse = dynamicField?.multipleField === false;
    const hasApi = dynamicField?.api !== null;
    const isLocations = field === 'locations';

    if (isMultipleFalse && hasApi) {
      const url = dynamicField.api + dynamicField.defaultParams;
      if (this.editData) {
        this.loading = true;
        if (!list.includes(field)) {
          this.fetchAndFilterList(field, url, [], index);
        }
        if (dynamicField.validLink?.length) {
          this.loading = true;
          this.handleValidLinks(dynamicField, field, index, list);
        }
      } else {
        this.fetchAndFilterList(field, url, dynamicField.validLink, index);
      }
    }

    // if (isLocations && this.editData) {
    //   let loc = '';
    //   this[`locName${index}`] = null;

    //   if (this.data[field]) {
    //     this[`locationsId${index}`] = this.data[field];
    //     this.data[field].forEach(x => {
    //       const match = this.locationsList.find(y => y.id === x);
    //       if (match) loc += (loc ? ',' : '') + match.name;
    //     });

    //     this[`locName${index}`] = loc;
    //         console.log(loc || dynamicField.defaultValue)
    //     form.addControl(field, this.form.control(loc || dynamicField.defaultValue));
    //     return;
    //   }
    // }

    form.addControl(field, this.form.control(this.data[field] ?? dynamicField.defaultValue));
  }

  getArrayList(index) {
    const form = this.form.group({
      id: [null],
      defenderType: [null],
      tagEntity: [null],
      geofenceType: [null],
      tagEntityGeo: [null],
      locationOption: [null],
      sensorType: [null],
      sensorEntity: [null],
      deviceType: [null],
      deviceEntity: [null],
      subArrayList: this.form.array([this.editSubArrayList(0, index)]),
    });
    this['deviceConfigList' + index] = [];
    this.dynamicFormFields = this.alert.create;
    this.formFields.push(this.dynamicFormFields[0].key);
    this.showFields.push(this.dynamicFormFields[0].key);
    for(let i=0;i<this.alert.create.length;i++){
      const field = this.dynamicFormFields[i].key;
      const dynamicField = this.dynamicFormFields[i];
      if(dynamicField.hasOwnProperty('multipleField') && dynamicField.multipleField === false) {
        if(dynamicField.hasOwnProperty('api') && dynamicField.api !== null) {
          const url = dynamicField['api'] + dynamicField['defaultParams'];
          this.commonService.getApiWithUrl(url).subscribe(res => {
            this[field + 'List' + index] = res.results;
            if(dynamicField.hasOwnProperty('validLink') && dynamicField.validLink.length !== 0) {
              let validLink = [];
              dynamicField.validLink.forEach(data => {
                validLink.push(data.valid_link);
              });
              this[field + 'List' + index] = this[field + 'List' + index].filter( x =>validLink.indexOf(x.code) > -1);
            }
          });
        }
        form.addControl(field, this.form.control(dynamicField['defaultValue']));
      }
    }
    (form as FormGroup).addControl('showFields', this.form.control(this.showFields));
    // subArrayList: this.form.array([this.editSubArrayList(0)]),
    return form
  }

  addArrayList(i) {
    const control = <FormArray>this.dynamicAlertRuleForm.controls['arrayList'];
    control.push(this.getArrayList(i));
  }

  removeArrayList(i: number, type: string): void {
    const control = this.dynamicAlertRuleForm.controls['arrayList'] as FormArray;

    const isTypeValid = type !== null;
    const isRUTD = this.ruleType === 'RU-TD';

    if (this.editData && isTypeValid) {
      this.removeScopeFromAlertData(i, control);
    }

    if (isRUTD && isTypeValid) {
      this.rebuildColumnOptions(i, control);
    }

    control.removeAt(i);

    if (type === 'clear' && control.length === 0) {
      this.addArrayList(0);
    }

    if (isRUTD && isTypeValid) {
      this.syncSubArrayColumnValues(i, control);
    }
  }

  private removeScopeFromAlertData(i: number, control: FormArray): void {
    const locDetail = control.value[i]?.scope_id;
    this.alertData = this.alertData.filter(x => x.scope_id !== locDetail);
  }

  private rebuildColumnOptions(i: number, control: FormArray): void {
    const nextControl = control.controls[i + 1]?.get('subArrayList') as FormArray;
    if (!nextControl) return;

    const nextValues = nextControl.value;
    for (let j = 0; j < nextValues.length; j++) {
      const columnValue = nextValues[j]?.column;
      const currentKey = `ColumnOption${i}`;
      const currentOptions = this[currentKey] || [];

      this[currentKey] = columnValue
        ? currentOptions.filter(x => columnValue.indexOf(x) === -1).concat(columnValue)
        : [columnValue];

      const columnListKey = `columnList${j}`;
      const listKey = `list${i}${j}`;
      if (this[columnListKey] && columnValue) {
        this[listKey] = this[columnListKey].filter(x => x.key === columnValue);
      }
    }
  }

  private syncSubArrayColumnValues(i: number, control: FormArray): void {
    const currentControl = control.controls[i]?.get('subArrayList') as FormArray;
    if (!currentControl) return;

    const currentValue = currentControl.value;
    for (let j = 0; j < currentValue.length; j++) {
      const listKey = `list${i}${j}`;
      const subListColKey = `subArrayListCol${i}${j}`;
      const group = currentControl.controls[j] as FormGroup;

      if (this[listKey]?.length) {
        if (!group) {
          this.editSubArrayList(j, i);
        }
        this.getColumns(i, j, this[listKey][0], null);
      } else if (this[listKey]?.length === 0) {
        this[subListColKey] = this[subListColKey].filter(x => x.key === 'column');
      }
    }
  }

  showField(value, validLink, i, j?: number): void {

    if (value === null || value === undefined) {
      return;
    }

    const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;

    validLink?.forEach(data => {
      if (data.valid_link !== value) {
        return;
      }

      if (data.showFields?.length) {
        arrays.controls[i].patchValue({ showFields: data.showFields });
      }

      if (data.subShowFields?.length && j !== undefined) {
        const subControl = arrays.controls[i].get('subArrayList') as FormArray;
        subControl.controls[j].patchValue({ showFields: data.subShowFields });
      }

      if (data.requestField?.length) {
        this.processRequestFields(data.requestField, i, j);
      }

      if (data.validation?.length) {
        this.processValidation(data.validation, i);
      }

      this.clearNonVisibleFields(arrays.controls[i], i);
    });
  }

  private processRequestFields(requestFields: any[], i: number, j?: number): void {
    requestFields.forEach(request => {
      const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      const patchValue = this.data[request.requestKey] ?? null;
      arrays.controls[i].patchValue({ [request.requestKey]: patchValue });

      const listKey = `${request.requestKey}List${i}`;
      const arrayVal = arrays.value[i];
      const url = request.api + request.defaultParams;

      this.commonService.getApiWithUrl(url).subscribe(res => {
        let resultList = res.results;

        if (request.validLink?.length) {
          const validCodes = request.validLink.map(data => data.valid_link);
          resultList = resultList.filter(item => validCodes.includes(item.code));
        }        
        this[listKey] = resultList;

        if (request.requestKey === 'device_config' && j !== undefined) {
          this[`${request.requestKey}List${i}${j}`] = resultList;
        }
      });
    });
  }

  private processValidation(validations: any[], i: number): void {
    validations.forEach(valid => {
      const formArrayValue = this.dynamicAlertRuleForm.get('arrayList')?.value[i];
      if (formArrayValue?.[valid.validKey] !== valid.validValue) {
        return;
      }

      if (valid.nonMandatoryFields?.length) {
        valid.nonMandatoryFields.forEach(validField => {
          this.formFields.forEach(field => {
            this[`${validField}valid`] = (field !== validField);
          });
        });
      }

      if (valid.showFields?.length) {
        const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
        arrays.controls[i].patchValue({ showFields: valid.showFields });
      }
    });
  }

  private clearNonVisibleFields(control: AbstractControl, i: number): void {
    const show = this.dynamicAlertRuleForm.get('arrayList')?.value[i]?.showFields || [];
    const fields = Object.keys(control.value).filter(f => !show.includes(f));

    fields.forEach(field => {
      control.get(field)?.setValidators(null);
      control.get(field)?.updateValueAndValidity();
    });

    const subControl = control.get('subArrayList') as FormArray;
    if (!subControl?.value.length) return;

    let subfields = Object.keys(subControl.value[0]);
    let visibleSubfields = subfields.filter(res => show.includes(res));
    visibleSubfields = visibleSubfields.filter(res => !res.includes('alarm_readers'));

    this[`subfields${i}`] = visibleSubfields;
  }

  editSubArrayList(index: number, index2?: number): FormGroup {
    const form = this.form.group({
      id: [this.data.id ?? null],
    });

    this.dynamicFormFields = this.alert.create;
    this.subArrayList = [];
    this.showFields = [];

    for (const dynamicField of this.dynamicFormFields) {
      const field = dynamicField.key;
      if (dynamicField?.multipleField !== true) continue;

      dynamicField?.subFields
        ? this.handleSubFields(dynamicField, form)
        : this.handleSingleField(dynamicField, form, field, index, index2);
    }

    (form as FormGroup).addControl('showFields', this.form.control(this.showFields));
    return form;
  }

  private handleSubFields(dynamicField: any, form: FormGroup): void {
    dynamicField.subFields.forEach(sub => {
      this.subArrayList.push(sub);
      this.formFields.push(sub.key);
      this.showFields.push(sub.key);
      form.addControl(
        sub.key,
        this.form.control(this.subData ? this.subData[sub.key] : sub['defaultValue'])
      );
    });
  }

  private handleSingleField(
    dynamicField: any,
    form: FormGroup,
    field: string,
    index: number,
    index2?: number
  ): void {
    this.subArrayList.push(dynamicField);
    this.handleApiCall(dynamicField, field, index);
    this.handleRuleType(dynamicField, field, index, index2);

    this.formFields.push(field);
    if (!dynamicField.subShowFields) {
      this.showFields.push(field);
    }

    form.addControl(
      field,
      this.form.control(this.subData ? this.subData[field] : dynamicField['defaultValue'])
    );
  }

  private handleApiCall(dynamicField: any, field: string, index: number): void {
    if (!dynamicField.api) return;

    const url = dynamicField.api + dynamicField.defaultParams;
    this.commonService.getApiWithUrl(url).subscribe(res => {
      const listKey = `${field}List${index}`;
      this[listKey] = res.results;
      if (dynamicField.validLink?.length) {
        const validLinkCodes = dynamicField.validLink.map(data => data.valid_link);
        this[listKey] = this[listKey].filter(item => validLinkCodes.includes(item.code));
      }
    });
  }

  private handleRuleType(
    dynamicField: any,
    field: string,
    index: number,
    index2?: number
  ): void {
    if (this.ruleType !== 'RU-TD') return;

    this[`subArrayListCol${index2}${index}`] = [dynamicField];
    const defaultList = this[`${field}List0`];
    if (defaultList) {
      this[`${field}List${index}`] = defaultList;
    }
    this[`ColumnOption${index2}`] = [];
  }

  getColumns(i, j, dataCol, type) {
    if(this['ColumnOption' + i] && dataCol) {
      this['ColumnOption' + i] = this['ColumnOption' + i].filter(x => dataCol.key.indexOf(x) === -1);
      this['ColumnOption' + i].push(dataCol.key);
    } else {
      this['ColumnOption' + i] = [dataCol.key];
    }
    let show = [];
    let show1 = [];
    if(!this.subDataCol) {
      this['subArrayListCol' + i + j] = this.subArrayList;
    } else {
      const list = this.subArrayList.filter(x => x.key === 'column');
      this['subArrayListCol' + i + j] = list;
    }
    const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const subControl = <FormArray>arrays.controls[i].get('subArrayList');
    const group = subControl.controls[j] as FormGroup;
    show = ['scope_id', 'table', 'column'];
    const showFields = this.dynamicAlertRuleForm.controls['arrayList'].value[i].showFields;
    show1 = showFields;
    if(dataCol?.hasOwnProperty('con')) {
      dataCol['con'].forEach(col =>{
        col['multipleField'] = true;
        const fieldCol = col.key;
        show.push(col.key);
        show1.push(col.key);
        this['subArrayListCol' + i + j].push(col);
        this.formFields.push(fieldCol);
        this.showFields.push(fieldCol);
        group.addControl(fieldCol, this.form.control(this.subDataCol && type !== 'new' ? this.subDataCol[fieldCol] : col['defaultValue']));
      });
    } 
    arrays.controls[i].patchValue({ "showFields": show1 });
    subControl.controls[j].patchValue({'showFields': show});
  }

  getSubArrayList(index2: number, index: number, type: string, subType?: string): FormGroup {
    const isEditMode = this.subData && type !== 'new';
    const form = this.form.group({ id: [isEditMode ? index : null] });

    this.dynamicFormFields = this.alert.create;
    this.subArrayList = [];
    this.showFields = [];
    this.loading = true;

    for (const dynamicField of this.dynamicFormFields) {
      if (!dynamicField.multipleField) continue;

      const field = dynamicField.key;

      if (dynamicField.subFields) {
        this.processSubFields(dynamicField.subFields, form, isEditMode);
        continue;
      }

      this.processFlatField(dynamicField, field, form, index2, index, subType, isEditMode);
    }

    (form as FormGroup).addControl('showFields', this.form.control(this.showFields));
    return form;
  }

  private processFlatField(
    dynamicField: any,
    field: string,
    form: FormGroup,
    index2: number,
    index: number,
    subType: string | undefined,
    isEditMode: boolean
  ): void {
    this.subArrayList.push(dynamicField);

    if (dynamicField.api) {
      this.fetchApiData(dynamicField, field, index2, index, subType);
    }

    this.processRuleTypeFields(dynamicField, field, index2, index);
    this.formFields.push(field);

    if (!dynamicField.subShowFields) {
      this.showFields.push(field);
    }

    const defaultValue = dynamicField.defaultValue;
    this.addFormControl(form, field, defaultValue, isEditMode, subType, index2);
  }

  private processRuleTypeFields(dynamicField: any, field: string, index2: number, index: number): void {
    if (this.ruleType !== 'RU-TD') return;

    this[`subArrayListCol${index2}${index}`] = [dynamicField];
    this[`${field}List${index}`] = this[`${field}List0`];
    this[`ColumnOption${index2}`] = this[`ColumnOption${index2}`] || [];
  }

  private addFormControl(
    form: FormGroup,
    field: string,
    defaultValue: any,
    isEditMode: boolean,
    subType: string | undefined,
    index2: number
  ): void {
    if (!subType) {
      form.addControl(field, this.form.control(isEditMode ? this.subData[field] : defaultValue));
    } else {
      this.handleSubTypeFields(form, field, defaultValue, isEditMode, index2);
    }
  }

  private processSubFields(subFields: any[], form: FormGroup, isEditMode: boolean): void {
    subFields.forEach(sub => {
      const value = isEditMode ? this.subData[sub.key] : sub['defaultValue'];
      this.subArrayList.push(sub);
      this.formFields.push(sub.key);
      this.showFields.push(sub.key);
      form.addControl(sub.key, this.form.control(value));
    });
  }

  private fetchApiData(dynamicField: any, field: string, index2: number, index: number, subType?: string): void {
    const url = dynamicField.api + dynamicField.defaultParams;

    this.commonService.getApiWithUrl(url).subscribe(res => {
      const listKey = `${field}List${index}`;
      const results = res.results;
      const validLinks = dynamicField.validLink?.map(v => v.valid_link) || [];

      if (!subType) {
        this[listKey] = validLinks.length ? results.filter(x => validLinks.includes(x.code)) : results;
      } else {
        if(field === 'locations') {
          const defaultList = this[`${field}List${index2}0`];
          this[field + 'List'] = defaultList?.length ? defaultList : results;
        } else {
          const altKey = `${field}List${index2}${index}`;
          const defaultList = this[`${field}List${index2}0`];
          this[altKey] = defaultList?.length ? defaultList : results;
        }
      }

      this.loading = false;
    });
  }

  private handleSubTypeFields(form: FormGroup, field: string, defaultValue: any, isEditMode: boolean, index2: number): void {
    switch (field) {
      case 'device_config': {
        const configType = isEditMode ? this.subData['config_type'] : defaultValue;
        form.addControl(field, this.form.control(configType));
        if (isEditMode) {
          this.getDeviceConfigList(this.subData['config_type'], index2);
        }
        break;
      }
      case 'locations': {
        const locationsValue = isEditMode ? this.subData['locations'] : defaultValue;
        form.addControl(field, this.form.control(locationsValue));
        break;
      }
      default: {
        const configValue = isEditMode ? this.subData['config_values'] : defaultValue;
        form.addControl(field, this.form.control(configValue));
        break;
      }
    }
  }

  addSubArrayList(i, j, type, subType) {
    const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const control = <FormArray>arrays.controls[i].get('subArrayList');
    control.push(this.getSubArrayList(i, j, type, subType));
  }

  removeSubArrayList(i: number, j: number, type: string, subType?: any): void {
    const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const control = arrays.controls[i].get('subArrayList') as FormArray;
    let columnOptionsKey = `ColumnOption${i}`;
    let deviceConfigListKey = `deviceConfigList${i}`;
    let columnListKey = `columnList${j + 1}`;
    let nextValue = control.value[j + 1];
    let currentValue = control.value[j];

    // Update ColumnOption
    if (this[columnOptionsKey]?.length && currentValue.column) {
      this[columnOptionsKey] = this[columnOptionsKey].filter(x => !currentValue.column.includes(x));
    } else {
      this[columnOptionsKey] = [];
    }

    // Get relevant list for next column
    let list: any[] = [];
    if (this[columnListKey] && nextValue) {
      list = this[columnListKey].filter(x => x.key === nextValue.column);
    }

    // Update deviceConfigList
    if (subType != null && currentValue['device_config']) {
      this[deviceConfigListKey] = this[deviceConfigListKey]?.filter(x => !currentValue['device_config'].includes(x));
    }

    // Remove control at index j
    control.removeAt(j);

    // Re-add if cleared
    if (type === 'clear' && control.length <= 0) {
      this.addSubArrayList(i, 0, 'new', null);
      return;
    }

    // Handle RU-TD ruleType with remaining controls
    if (control.length !== 0 && this.ruleType === 'RU-TD') {
      if (list.length !== 0) {
        this.getColumns(i, j, list[0], null);
      } else {
        const subArrayColKey = `subArrayListCol${i}${j}`;
        const filteredField = this[subArrayColKey]?.filter(x => x.key === 'column');
        this[subArrayColKey] = filteredField;
      }
    }
  }

  formReset(key, i) {
    const scope = this.dynamicAlertRuleForm.controls['arrayList'].value[i].scope_id;
    const type = this.dynamicAlertRuleForm.controls['arrayList'].value[i][key];
    const showFields = this.dynamicAlertRuleForm.controls['arrayList'].value[i].showFields;
    const control = <FormArray>this.dynamicAlertRuleForm.controls['arrayList'];
    let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const subControl = <FormArray>arrays.controls[i].get('subArrayList');
    const subShowfield = subControl.value[0].showFields;
    const threshold = subControl.value[0].threshold;
    const safe_rssi = subControl.value[0].safe_rssi;
    control.controls[i].reset();
    arrays.controls[i].patchValue({ "showFields": showFields });
    arrays.controls[i].patchValue({ [key]: type });
    arrays.controls[i].patchValue({ "scope_id": scope });
    subControl.controls[0].patchValue({'showFields': subShowfield});
    subControl.controls[0].patchValue({'threshold': threshold});
    subControl.controls[0].patchValue({'safe_rssi': safe_rssi});
  }

  getType(i) {
    if(this.ruleType === 'RU-GO') {
      let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      arrays.controls[i].patchValue({ "geofenceType": 'AGT-BO' });
      arrays.controls[i].patchValue({ "locationOption": 'L' });
    }
  }

  openedChange(isOpended, type, i)
  {
    if(!isOpended)
    {
      if(type === 'sensor_type') {
        this.getSensorConfig(i);
      } else {
        this.getData(i, 'tagType');
      }
    }
  }
  
  getData(index, type?: string) {
    const facilityIds = localStorage.getItem(btoa('facilityId'));
    const control = <FormArray>this.dynamicAlertRuleForm.controls['arrayList'];
    for (let i = 0; i < control.length; i++) {
      const tagTypes = this.dynamicAlertRuleForm.controls['arrayList'].value[i]['tag_type_ids'];
      const scopeId = this.dynamicAlertRuleForm.controls['arrayList'].value[i]['scope_id'];
      this.commonService.getTagId(facilityIds, tagTypes, scopeId).subscribe(res => {
        this['tag_idsList' + index] = res.results;
      });
    }
  }
  getSensorConfig(i) {
    const arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const subControl = arrays.controls[i].get('subArrayList') as FormArray;
    const group = subControl.controls[0] as FormGroup;

    group.removeControl('sensorData');
    this.sensorFields = [];
    this.dynamicFormSensorFields = [];

    const arrayValue = this.dynamicAlertRuleForm.controls['arrayList'].value[i];
    const sensor = arrayValue['sensor_type'];
    const isSatRdr = arrayValue['type'].substring(0, 7) === 'SAT-RDR';
    this['sensorKey' + i] = sensor;

    if (sensor !== null) {
      sensor.forEach(value => {
        this.sensorConfig.forEach(val => {
          if (isSatRdr && val.hasOwnProperty('reader')) {
            this.processSensorItems(val.reader, value, group, i);
          } else if (!isSatRdr && val.hasOwnProperty('tag')) {
            this.processSensorItems(val.tag, value, group, i);
          }
        });
      });
    }

    group.addControl('sensorData', this.form.control(this.dynamicFormSensorFields));
    return group;
  }

  private processSensorItems(items: any[], value: string, group: FormGroup, i: number): void {
    const filteredItems = items.filter(x => x.type === value);
    this.sensorFields.push(filteredItems);

    filteredItems.forEach(data => {
      this.mapSensorConfigValuesToThis();

      const key = data.type + data.key + i;
      const val = this[key] ?? data.defaultValue;
      group.addControl(key, this.form.control(val));
      this.dynamicFormSensorFields.push(data);
    });
  }

  private mapSensorConfigValuesToThis(): void {
    if (!this.data.hasOwnProperty('sensor_configs')) {
      return;
    }

    this.data.sensor_configs.forEach(config => {
      config.sensor_values.forEach(val => {
        this[config.sensor_type + val.name] = val.value;
      });
    });
  }

  getSearch(event, field, i) {
    this[field['key'] + 'Enabled'] = true;
    if(event.text !== null && event.text.length >= 3) {
      const url = field['api'] + event.text;
      this.commonService.getApiWithUrl(url).subscribe(res => {
        this[field['key'] + 'List' + i] = res.results;
      });
    }
  }

  getList(loc) {
    this.locationsName = [];
    let name = '';
    if (loc) {
      loc.forEach(id => {
        const list = this as any as { id: string, fullName: string }[]
        const listId = list.find(obj => obj.id === id).fullName;
        this.locationsName.push(listId);
        this.locationsName.forEach(x =>{
          name = name + x;
        });
      });
      return name;
    } else {
      return '';
    }
  }

  optionClicked(event: Event, item) {
    event.stopPropagation();
  }

  checkLocationName(id, i, event) {
    if(!this['locations' + i]) {
      this['locations' + i] = [];
    }
    let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    if (event.checked === true) {
      this['locations' + i].push(id);
      arrays.controls[i].patchValue({ "locations": this['locations' + i]});
    } else {
      this['locations' + i] = this['locations' + i].filter(x => x !== id);
      arrays.controls[i].patchValue({ "locations": this['locations' + i]});
    }
  }

  checkDeviceLocationName(id, i, j, event) {
    if(!this['locations' + j]) {
      this['locations' + j] = [];
    }
    let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    const subControl = <FormArray>arrays.controls[i].get('subArrayList');
    if (event.checked === true) {
      this['locations' + j].push(id);
      subControl.controls[j].patchValue({ "locations": this['locations' + j]});
    } else {
      this['locations' + i] = this['locations' + j].filter(x => x !== id);
      subControl.controls[j].patchValue({ "locations": this['locations' + j]});
    }
  }

  getDeviceConfigList(code, i) {
    if(code !== null){
      this['deviceConfigList' + i].push(code);
    }
  }

  bindData(): void {
    if (!this.editData) return;

    const isSpecialRule = this.ruleType === 'RU-SC' || this.ruleType === 'RU-WO';

    if (isSpecialRule) {
      this.handleSpecialRule();
    } else {
      this.handleGeneralRule();
    }
  }

  private handleSpecialRule(): void {
    this.data = [];
    const conditions = this.editData?.alertConditions || [];

    conditions.forEach((cond, i) => {
      const rawValue = cond.identifyingValue;
      const parsedValue = this.parseConditionValue(rawValue);
      let Value;
      if (parsedValue === 'Y') {
        Value = true;
      } else if (parsedValue === 'N') {
        Value = false;
      } else {
        Value = parsedValue;
      }
      this.data[cond.identifyingType] = Value;
      this.alertData[cond.identifyingType] = rawValue;

      if (cond.identifyingType === 'locations') {
        this.locationsList = rawValue;
      }

      this[`${cond.identifyingType}pfAlertConditionId`] = JSON.parse(cond.pfAlertConditionId);
      this.removeArrayList(0, null);
      (<FormArray>this.dynamicAlertRuleForm.controls['arrayList']).push(this.editArrayList(i));
      this.handleDynamicFieldDisplay(cond.identifyingType, Value);

      if (this.data.hasOwnProperty('tag_type_ids')) {
        this.getData(0, 'tagType');
      }

      if (this.data?.hasOwnProperty('sla_alert')) {
        this.handleSlaAlert(cond);
      }
    });
  }

  private parseConditionValue(rawValue: string): any {
    const isJsonLike = ['[', '{'].includes(rawValue?.charAt(0));
    try {
      return isJsonLike ? JSON.parse(rawValue) : rawValue;
    } catch {
      return rawValue;
    }
  }

  private handleDynamicFieldDisplay(type: string, value: any): void {
    if (['dq_sub_type', 'scope_id', 'dq_activity_type', 'dq_routine_type', 'is_entity_routine'].includes(type)) {
      this.dynamicFormFields.forEach(x => {
        if (x.key === type) {
          this.showField(value, x.validLink, 0, 0);
        }
      });
    }
  }

  private handleSlaAlert(cond: any): void {
    this['slaAlertpfAlertConditionId'] = JSON.parse(cond.pfAlertConditionId);
    this.removeSubArrayList(0, 0, null, null);

    const sla = this.data['sla_alert'];
    this.subData = {
      is_sla_time: sla?.hasOwnProperty('sla_time') ?? false,
      sla_alert: sla?.sla_time?.alert ?? 5,
      sla_escalate: sla?.sla_time?.escalate ?? 10,
      is_reminder_time: sla?.hasOwnProperty('reminder_time') ?? false,
      reminder_alert: sla?.reminder_time?.alert ?? 5,
      reminder_escalate: sla?.reminder_time?.escalate ?? 1
    };

    this.addSubArrayList(0, 0, null, null);
  }

  private handleGeneralRule(): void {
    const firstCondition = this.editData.alertConditions[0];
    const data = JSON.parse(firstCondition.identifyingValue);
    this.alertData = data;
    this.locationsList = firstCondition.locations;
    this.pfAlertConditionId = JSON.parse(firstCondition.pfAlertConditionId);
    this.removeArrayList(0, null);

    const control = <FormArray>this.dynamicAlertRuleForm.controls['arrayList'];

    for (let i = 0; i < data.length; i++) {
      this.data = data[i];
      control.push(this.editArrayList(i));

      if (this.data.hasOwnProperty('tag_type_ids')) {
        this.getData(i, 'tagType');
      }

      if (this.ruleType === 'RU-SE') {
        this.handleSensorConfig(i);
      } else if (this.ruleType === 'RU-DA') {
        this.getDeviceType(i);
      }
    }

    if (['RU-DEF', 'RU-TD'].includes(this.ruleType)) {
      this.handleDefenderOrTableDrivenRule(data);
    }

    if (this.ruleType === 'RU-DA') {
      this.handleDeviceAlertRule(data);
    }

    this.handleHiddenFields(data);
  }

  private handleSensorConfig(index: number): void {
    this.data.sensor_configs?.forEach(sensor => {
      const type = sensor.sensor_type;
      sensor.sensor_values?.forEach(val => {
        this[`${type}${val.name}${index}`] = val.value;
      });
    });
    this.getSensorConfig(index);
  }

  private handleDefenderOrTableDrivenRule(data: any[]): void {
    data.forEach((item, i) => {
      const arrays = this.getArrayListFormArray();
      this.removeSubArrayList(i, 0, null, null);

      const targetArray = this.getTargetArray(i);
      const configList = this.getConfigList(item);

      this.processConfigList(configList, item, targetArray, arrays, i);
    });
  }

  private getArrayListFormArray(): FormArray {
    return this.dynamicAlertRuleForm.get('arrayList') as FormArray;
  }

  private getTargetArray(index: number): string[] {
    return this.dynamicAlertRuleForm.controls['arrayList'].value[index].showFields;
  }

  private getConfigList(item: any): any[] {
    return this.ruleType === 'RU-DEF' ? item.defender_config : item.columns;
  }

  private processConfigList(
    configList: any[],
    item: any,
    targetArray: string[],
    arrays: FormArray,
    i: number
  ): void {
    configList.forEach((config, j) => {
      if (j === 0) {
        Object.keys(config).forEach(k => targetArray.push(k));
        arrays.controls[i].patchValue({ showFields: targetArray });
      }

      this.subData = config;
      this.addSubArrayList(i, j, null, null);

      if (this.ruleType === 'RU-TD') {
        this.handleTableDrivenRuleApiCall(item, config, i, j);
      }
    });
  }

  private handleTableDrivenRuleApiCall(item: any, config: any, i: number, j: number): void {
    const url = `api/rule-alert/columns-by-table?alertType=${item['scope_id']}&table=${item['table']}`;
    this.commonService.getApiWithUrl(url).subscribe(res => {
      this[`columnList${j}`] = res.results;
      this.subDataCol = config;

      const dataCol = res.results.find(x => x.key === config['column']);
      if (dataCol) {
        this.getColumns(i, j, dataCol, null);
      }
    });
  }

  private handleDeviceAlertRule(data: any[]): void {
    const control = <FormArray>this.dynamicAlertRuleForm.controls['arrayList'];

    for (let i = 0; i < control.length; i++) {
      this.removeSubArrayList(i, 0, null, 'subType');

      data[i].device_configs?.forEach((config, j) => {
        this.subData = config;
        this.addSubArrayList(i, j, null, 'subType');

        this.dynamicFormFields.forEach(field => {
          if (field.key === 'device_config') {
            this.showField(config['config_type'], field.validLink, i, j);
          }
        });
      });
    }
  }

  private handleHiddenFields(data: any[]): void {
    data.forEach((item, i) => {
      if (['defender_type', 'geo_type', 'sensor_type'].some(k => item.hasOwnProperty(k))) {
        const arrays = <FormArray>this.dynamicAlertRuleForm.get('arrayList');
        const control = arrays.controls[i];
        const allFields = Object.keys(control.value);
        const visibleFields = control.value['showFields'];
        const hiddenFields = allFields.filter(f => !visibleFields.includes(f));

        hiddenFields.forEach(x => {
          control['controls'][x].setValidators(null);
          control['controls'][x].updateValueAndValidity();
        });

        const subArray = control.get('subArrayList') as FormArray;
        const subfields = Object.keys(subArray?.value[0] || {}).filter(f => visibleFields.includes(f) && !f.includes('alarm_readers'));
        this[`subfields${i}`] = subfields;
      }
    });
  }

  locationClear(i, key) {
    let arrays = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
    arrays.controls[i].patchValue({[key] : null});
    this['locName' + i] = null;
    this['locationsId' + i] = null;
  }
  
  ngOnChanges(changes: any) {
    this.configRule = [];

    if (changes['selectedIndex']?.currentValue === 1) {
      const formArray = this.dynamicAlertRuleForm.get('arrayList') as FormArray;
      const getFieldValue = (i: number, field: string) =>
        this.dynamicAlertRuleForm.controls['arrayList'].value[i][field];
      const isString = (value: any) => typeof value === 'string';

      for (let i = 0; i < formArray.length; i++) {
        const fields = getFieldValue(i, 'showFields');
        this.config = {};

        this.processMainFields(fields, getFieldValue, i, isString);
        this.subConfigRule = this.buildSubConfigRule(formArray, fields, i);

        this.assignConfigByRuleType(this.ruleType, i, formArray, getFieldValue);

        this.configRule.push(this.config);
      }

      const value = this.buildFinalValue(this.ruleType, this.configRule);
      console.log('final', value, this.dynamicAlertRuleForm);
      this.footerEventAction.emit({ value, valid: this.dynamicAlertRuleForm.valid });

    } else {
      this.handleOtherChanges(changes);
    }
  }

  private processMainFields(fields: any[], getFieldValue: Function, i: number, isString: Function) {
    for (const field of fields) {
      const value = getFieldValue(i, field);
      if (field === 'locations' && value !== undefined && isString(value) && this['locName' + i] === value) {
        this.config[field] = this['locationsId' + i];
      } else if (value === true) {
        this.config[field] = 'Y';
      } else if (value === false) {
        this.config[field] = 'N';
      } else {
        this.config[field] = value;
      }
    }
  }

  private buildSubConfigRule(formArray: FormArray, fields: any[], i: number) {
    const subControl = formArray.controls[i].get('subArrayList') as FormArray;
    const subConfigs: any[] = [];

    for (let k = 0; k < subControl.controls.length; k++) {
      const subFields: string[] = [];
      const subShowFields = subControl.value[k]['showFields'];

      if (subShowFields) {
        subShowFields.forEach(subField => {
          if (fields.includes(subField) && subField !== 'scope_id') {
            subFields.push(subField);
          }
        });
      }

      const subConfig: Record<string, any> = {};
      if (['RU-DEF', 'RU-TD'].includes(this.ruleType)) {
        subFields.forEach(f => {
          subConfig[f] = subControl.value[k][f];
        });
      }

      subConfigs.push(subConfig);
    }

    return subConfigs;
  }

  private assignConfigByRuleType(ruleType: string, i: number, formArray: FormArray, getFieldValue: Function) {
    const subControl = formArray.controls[i].get('subArrayList') as FormArray;

    switch (ruleType) {
      case 'RU-DEF':
        this.config['defender_config'] = this.subConfigRule;
        break;

      case 'RU-TD':
        this.config['columns'] = this.subConfigRule;
        break;

      case 'RU-SE':
        this.config['sensor_configs'] = this.buildSensorConfig(subControl, getFieldValue(i, 'sensor_type'), i);
        break;

      case 'RU-DA':
        this.config['device_configs'] = this.buildDeviceConfigs(subControl, i);
        break;

      case 'RU-SC':
        this.config['slaAlert'] = this.buildSlaAlert(subControl);
        break;
    }
  }

  private buildSensorConfig(subControl: FormArray, sensorTypes: any[], i: number) {
    const sensorConfigs: any[] = [];

    if (sensorTypes) {
      sensorTypes.forEach(sensor => {
        const config = {
          sensor_type: sensor,
          sensor_values: []
        };

        for (let l = 0; l < subControl.controls.length; l++) {
          const sensorData = subControl.value[l]['sensorData'];
          for (const dataItem of sensorData) {
            if (dataItem.type === sensor) {
              config.sensor_values.push({
                value: subControl.value[l][sensor + dataItem.key + i],
                name: dataItem.key,
                scale: dataItem.scale
              });
            }
          }
        }

        sensorConfigs.push(config);
      });
    }

    return sensorConfigs;
  }

  private buildDeviceConfigs(subControl: FormArray, i: number) {
    const configs: any[] = [];

    for (let l = 0; l < subControl.controls.length; l++) {
      const deviceData: any[] = [];

      subControl.value[l]['showFields'].forEach(field => {
        if (
          field === 'locations' &&
          subControl.value[l][field] !== undefined &&
          typeof subControl.value[l][field] === 'string' &&
          this['locName' + i] === subControl.value[l][field]
        ) {
          deviceData.push(this['locationsId' + i]);
        } else {
          deviceData.push(field);
        }
      });
      let configVal = null;
      if(subControl.value[l][deviceData[1]] === true || subControl.value[l][deviceData[1]] === false) {
        configVal = subControl.value[l][deviceData[1]];
      } else {
        configVal = parseInt(subControl.value[l][deviceData[1]]);
      }
      const config = {
        config_type: subControl.value[l][deviceData[0]],
        config_values: configVal
      };

      if (deviceData.length === 3) {
        config['locations'] = subControl.value[l][deviceData[2]];
      }

      configs.push(config);
    }

    return configs;
  }

  private buildSlaAlert(subControl: FormArray) {
    const slaAlert: any = {};

    for (let l = 0; l < subControl.controls.length; l++) {
      const row = subControl.value[l];
      if (row['is_sla_time']) {
        slaAlert['sla_time'] = {
          alert: row['sla_alert'],
          escalate: row['sla_escalate']
        };
      }
      if (row['is_reminder_time']) {
        slaAlert['reminder_time'] = {
          alert: row['reminder_alert'],
          escalate: row['reminder_escalate']
        };
      }
    }

    return slaAlert;
  }

  private buildFinalValue(ruleType: string, configRule: any[]): any[] {
    const baseEntry = (type: string, value: any, id: any) => ({
      identifyingType: type,
      identifyingValue: JSON.stringify(value),
      pfAlertConditionId: id
    });

    switch (ruleType) {
      case 'RU-GO':
        return [baseEntry('geofence_config', configRule, this.pfAlertConditionId)];
      case 'RU-DEF':
        return [baseEntry('defender_config', configRule, this.pfAlertConditionId)];
      case 'RU-TD':
        return [baseEntry('table_alert', configRule, this.pfAlertConditionId)];
      case 'RU-SE':
        return [baseEntry('sensor_config', configRule, this.pfAlertConditionId)];
      case 'RU-DA':
        return [baseEntry('device_config', configRule, this.pfAlertConditionId)];
      case 'RU-SC':
        return Object.keys(configRule[0])
          .filter(k => !['sla_alert', 'sla_escalate', 'reminder_alert', 'reminder_escalate'].includes(k))
          .map(k => ({
            identifyingType: k === 'slaAlert' ? 'sla_alert' : k,
            identifyingValue: typeof configRule[0][k] === 'string'
              ? configRule[0][k]
              : JSON.stringify(configRule[0][k]),
            pfAlertConditionId: this[k + 'pfAlertConditionId']
          }));
      case 'RU-WO':
        console.log(configRule)
        return Object.keys(configRule[0])
          .filter(k => !['slaAlert'].includes(k))
          .map( k => ({
            identifyingType: k,
            identifyingValue: typeof configRule[0][k] === 'string'
              ? configRule[0][k]
              : JSON.stringify(configRule[0][k]),
            pfAlertConditionId: this[k + 'pfAlertConditionId']
          }));
      default:
        return [];
    }
  }

  private handleOtherChanges(changes: any) {
    this.config = [];
    const alertChange = changes['alertType'];

    this.alertTypeId = alertChange?.currentValue !== alertChange?.previousValue
      ? alertChange.currentValue
      : this.alertType;

    console.log(alertChange, alertChange?.currentValue, alertChange?.previousValue);
    console.log(this.alertTypeId);

    if (
      (changes['ruleType'] && changes['ruleType'].currentValue !== changes['ruleType'].previousValue) ||
      (changes['ruleCategory'] && changes['ruleCategory'].currentValue !== changes['ruleCategory'].previousValue)
    ) {
      this.ruleCategoryId = alertChange?.currentValue !== alertChange?.previousValue
        ? alertChange.currentValue
        : this.ruleCategory;

      console.log('edit', this.editData);

      if (this.ruleType === 'RU-SE') {
        const url = 'api/pf-config/pf-configs?identifyingType=CIT-ALT&configType=CFT-SA';
        this.commonService.getApiWithUrl(url).subscribe(res => {
          this.sensorConfig = res.results.map((data: any) => JSON.parse(data.configValue));
          this.buildForm();
          setTimeout(() => {
            this.bindData();
          }, 300);
        });
      } else {
        this.buildForm();
        setTimeout(() => {
        this.bindData();
      }, 300);
      }
    }
  }

  fixClick() {
   console.log('')
  }
}
