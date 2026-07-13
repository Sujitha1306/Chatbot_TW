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
import { Component, OnInit,Inject, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService } from '../../../../shared';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonDialogComponent } from '../../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { LookupTermService } from '../../../../shared/lookup-term.service';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'], 
  encapsulation : ViewEncapsulation.None,
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class FormBuilderComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public templateForm : FormGroup;
  public allDataItems = [];
  public dataItems = [];
  public dataItemTypes = [];
  public formTemplateData1 = [];
  public formTemplateData = [];
  public formTemplateDetail = [];
  public deletedDataItem = [];
  public checkedInfo: any[] = [];
  public formStatusData: any[] = [];
  public pfworkflowData: any[] = [];
  public pfWorkDeletData: any[] = [];
  public isSaveEnabled = true;
  public formStatusList:any;
  public entityFormStatusList:any;
  public formTemplateTypeList:any;
  public recipientTypeList:any;
  public channelList:any;
  public formConfig:any;
  public isReload = true;
  public pfFormTemplateId = null;
  public layout=null;
  public matrixForm: FormGroup;
  public userNameList = [];
  public recipientEnabled = false;
  public selectedTab: any;
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public isTrigger: boolean = true;
  levelListInfo: any[] = [];
  recepientListItems: any = [];
  public departmentForm : FormGroup;
  public departmentList: Array<any> = [];
  departmentEnabled = false;
  departmentListRes: any;
  formStatusDisplayColumn = ['Code', 'Name', 'Level', 'Edit Status', 'Return', 'editDelete'];
  formStatusconDataColumns = ['code', 'name', 'level', 'edit', 'return',''];
  approvelDisplayColumn = ['Recipient Type', 'Recipient Name', 'Approval Capacity', 'Approval Status','Level', 'Channel Type', 'editDelete'];
  approvelDataColumns = ['identifyingType', 'recipientName','description', 'entityStatusName', 'workflowLevelId', 'channelName', ''];
  depdisplayedColumns = ['Department', 'Start Date', 'End Date','Status','editDelete'];
  depDataColumns =  ['departmentName', 'startDate', 'endDate','isActive',''];
  public otSpecialty: any = [];
  public entityData: any = null;
  public templateJsonValue: any;
  public workFlowStatus: boolean = false;
  maxVisitorLimit: number = 9;
  editData: any;
  jsonValueFilter: any;
  jsonKeyList: any;
  eventDataInfo: any;
  statusList = [{code: true, value:'Active'}, {code: false, value:'InActive'}];
  levelList = [{code: 0, value:'Level 0'}, {code: 1, value:'Level 1'}, {code: 2, value:'Level 2'}, {code: 3, value:'Level 3'}, {code: 4, value:'Level 4'}, {code: 5, value:'Level 5'}, {code: 6, value:'Level 6'},{code: 7, value:'Level 7'}, {code: 8, value:'Level 8'},{code: 9, value:'Level 9'}, {code: 10, value:'Level 10'}];
  isRecipient: boolean = false;
  userNameData: any;
  appEditData: any;
  maxLevel: any;
  public deptableData: any[] = [];
  deptable: boolean = false;
  editdepKey: boolean = false;
  editDepData = null;
  departmentData = [] ;
  public selectedValue = 'All';
  public enableDrag: boolean = false;
  accordionCount = 0;
activeAccordionKey: string | null = null;
  // public formInputData = { "id" : 8  , "entityId" : 102 , "entityType" : "porter" , "pfFormTemplateId" : 84};
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,public form: FormBuilder, public thisDialogRef: MatDialogRef<FormBuilderComponent>, 
        public dialog: MatDialog, public configurationService: ConfigurationService,
        public commonService: CommonService, public toastr: AppToastService, public datepipe: DatePipe, private readonly lookupService: LookupTermService) {
          if(this.data){
            this.formTemplateDetail = this.data.dataItems; 
            this.formTemplateData = this.data.dataItems.filter(res => res.status);
            this.formTemplateData1 = this.data.dataItems.filter(res => res.status);
            this.formConfig = this.data;
            this.layout = this.data['layout'];
            this.pfFormTemplateId = this.data.id;
            this.deptableData = this.data.departmentLinks
            this.deptable = true;
            this.formTemplateData1.forEach((item: any) => {
              if (item.type === 'DI-ACD') {
                item['key'] = item['key'] || item.name + '_' + Date.now();
                item['validator'] = { show: true };
                item['accordionExpanded'] = true;
                item['_isActiveTarget'] = false;
                item['accordionTitle'] = item.labelName;

                if (item.children && item.children.length) {
                  const rowMap: any = {};
                  item.children.forEach((child: any) => {
                    const position = child.position || 'R01C00';
                    const rowKey = position.substring(0, 3);
                    const colIdx = parseInt(position.substring(4, 6));
                    if (!rowMap[rowKey]) rowMap[rowKey] = [];
                    rowMap[rowKey][colIdx] = {
                      ...child,
                      key: child.name,
                      validator: child.validation ?
                        { ...JSON.parse(child.validation), show: true } :
                        { show: true }
                    };
                  });
                  item['accordionRows'] = Object.keys(rowMap)
                    .sort()
                    .map((key: string) => rowMap[key].filter(Boolean));
                } else {
                  item['accordionRows'] = [];
                }
              }
            });

          this.formTemplateData = [...this.formTemplateData1];
          }
  }

  ngOnInit() {
    if (this.data != null) {
      this.changeData();
      this.pfWorkFlowData();
    }
    this.getAllDataItems();
    this.buildForm();
    if (this.data !== null) {
      this.getEntityAssociationData();
      this.getOTSpecialty()
    }
    this.lookupService.getAppTermsWrapper('FormStatus,FormTemplateType,RecipientType,Channel,EntityFormStatus').subscribe(res => {
      this.formStatusList = res.FormStatus ?? [];
      this.formTemplateTypeList = res.FormTemplateType ?? [];
      this.recipientTypeList = res.RecipientType.filter(resFilter => (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO'))
      this.channelList = res.Channel.filter(resFilter => (resFilter.code == 'CH-EM' || resFilter.code == 'CH-NO'));
      this['entityFormStatusInfo'] = res.EntityFormStatus ?? [];
      this.entityFormStatusList = this['entityFormStatusInfo'];
      const workFormStatusInfo = this.formStatusData?.map(res => res.code);
      this.entityFormStatusList = this.entityFormStatusList?.filter(res => !workFormStatusInfo.includes(res.code));
    });
    this.prepareJsonKeyList();
  }

  changeData() {
    const parsed = JSON.parse(this.data.jsonValue);
    if (parsed?.hasOwnProperty('status')) {
      this.formStatusData = parsed.status.map(item => ({
        ...item,
        edit: item.edit ? 'Enable' : 'Disable',
        return: item.return ? 'Yes' : 'No',
      }));
      if (this.formStatusData.length) {
        this.formStatusData.sort((a, b) => a.level - b.level);
        const calculatedLevel = Math.max(...this.formStatusData.map(x => x.level)) + 1;
        this.maxLevel = calculatedLevel > this.maxVisitorLimit  ? this.maxVisitorLimit  : calculatedLevel;
        this.formTemplateData = this.formTemplateData.map(obj => ({ ...obj,formStatusData: this.formStatusData }));
        this.buildForm();
      }
      delete parsed.status;
    }
    this.jsonValueFilter = parsed;
  }
  pfWorkFlowData() {
    this.pfworkflowData = this.data?.pfWorkflows.map(data => ({ ...data, recipientName: data.identifyingType === 'RT-RO' ? data.roleName : data.userName }));
    const isActiveData = this.pfworkflowData.filter(x => x.isActive === true);
    this.pfworkflowData = isActiveData;
    this.pfworkflowData.sort((a, b) => a.workflowLevelId - b.workflowLevelId);
  }
   
  addApprovelData() {
    let userData = null;
    if (typeof this.matrixForm.get('recipientName').value === 'string') {
      const rawRecipient = this.matrixForm.get('recipientName').value;
      const recipient = rawRecipient?.replace(/\s+/g, '');
      userData = this.userNameData?.find(x => x.name.replace(/\s+/g, '') === recipient);
    } else {
      userData = this.userNameList?.find(x => x.id === this.matrixForm.get('recipientName').value);
    }
    const channelData = this.channelList?.find(x => x.code === this.matrixForm.get('channelId').value);
    const  entitystatus = this.entityFormStatusList?.find(x => x.code === this.matrixForm.get('entityStatusId').value)
    let request = {
      'identifyingType': this.matrixForm.get('recipientType').value,
      'recipientName': userData?.name,
      'identifyingId': userData?.id,
      "description": this.matrixForm.get('description').value,
      'workflowLevelId': this.matrixForm.get('level').value,
      'channelName': channelData?.value,
      'channelId': channelData?.code,
      'entityStatusId': entitystatus?.code,
      'entityStatusName':  entitystatus?.value,
      'id': this.appEditData != null && this.appEditData != undefined && this.appEditData.hasOwnProperty('id') ? this.appEditData.id : null,
    }
    if (request != null && request != undefined) {
      if (this.appEditData != null && this.appEditData != undefined) {
        let index = null;
        if (this.appEditData.id != null && this.appEditData != undefined) {
          index = this.pfworkflowData.findIndex(x => x.id === this.appEditData.id);
        } else {
          index = this.pfworkflowData.findIndex(x => x.identifyingType === this.appEditData.identifyingType && x.channelId == this.appEditData.channelId && 
                  x.entityStatusId == this.appEditData.entityStatusId && x.identifyingId == this.appEditData.identifyingId && x.workflowLevelId == this.appEditData.workflowLevelId);
        }
        if (index !== -1) {
          this.pfworkflowData[index] = request;
          this.pfworkflowData = [...this.pfworkflowData];
        }
      } else {
        this.pfworkflowData.push(request);
        this.pfworkflowData = [...this.pfworkflowData];
      }
    }
    this.pfworkflowData.sort((a, b) => a.workflowLevelId - b.workflowLevelId);
    this.appEditData = null;
    this.matrixForm.get('recipientType').reset();
    this.matrixForm.get('recipientName').reset();
    this.matrixForm.get('level').reset();
    this.matrixForm.get('description').reset();
    this.matrixForm.get('channelId').reset();
    this.matrixForm.get('entityStatusId').reset();
  }

  addFormStatus() {
    let request = {
      "code": this.templateForm.get('formGroupname').value,
      "name": this.templateForm.get('formName').value,
      "level": this.templateForm.get('formLevel').value,
      "edit": this.templateForm.get('formEdit').value,
      "return": this.templateForm.get('formReturn').value,
    }
    if (request != null && request != undefined) {
      request.edit = request.edit ? 'Enable' : 'Disable';
      request.return = request.return ? 'Yes' : 'No';
      if (this.editData != null && this.editData != undefined) {
        const index = this.formStatusData.findIndex(x => x.code === this.editData.code);
        if (index !== -1) {
          this.formStatusData[index] = request;
          this.formStatusData = [...this.formStatusData];
        }
      } else {
        const index = this.formStatusData.findIndex(x => x.code === request.code);
        if (index !== -1) {
          this.formStatusData[index] = request;
          this.formStatusData = [...this.formStatusData];
        } else {
          this.formStatusData.push(request);
          this.formStatusData = [...this.formStatusData];
        }
      }
      this.formStatusData.sort((a, b) => a.level - b.level);
      this.formTemplateData = this.formTemplateData.map(obj => ({ ...obj,formStatusData: this.formStatusData }));
      this.editData = null;
      const calculatedLevel = Math.max(...this.formStatusData.map(x => x.level)) + 1;
      this.maxLevel = calculatedLevel > this.maxVisitorLimit ? this.maxVisitorLimit : calculatedLevel;
      const workFormStatusInfo = this.formStatusData?.map(res => res.code);
      this.entityFormStatusList = this.entityFormStatusList.filter(res => !workFormStatusInfo.includes(res.code));
    }
    this.templateForm.get('formGroupname').reset();
    this.templateForm.get('formName').reset();
    this.templateForm.get('formLevel').setValue(this.maxLevel);
    this.templateForm.get('formEdit').reset();
    this.templateForm.get('formReturn').reset();
  }

  getGroupName(data) {
    if (data != null && data != undefined) {
      this.templateForm.get('formName').setValue(data['value']);
    }
  }

  eventAction(event) {
    let data = event.data;
    if (event.key === 'edit') {
      this.formStatusEdit(data);
    } else if (event.key === 'delete') {
      this.formStatusDelet(data);
    } else if (event.key === "appEdit" && event.keyVal !== 'department') {
      this.approvelEditData(data);
    } else if (event.key === "appDelete" && event.keyVal !== 'department') {
      this.approvelDeleteData(data);
    } else if (event.key === "appEdit" && event.keyVal === 'department') {
      this.editdepData(data);
    } else if (event.key === "appDelete" && event.keyVal === 'department') {
      this.removeDepartDetails(data);
    }
  }

  approvelEditData(data) {
    const levelNumber = Number(data?.workflowLevelId);
    this.appEditData = data;
    let recipientName = null;
    const serachText = '';
    const recipient = this.appEditData.identifyingType;
    this.configurationService.getRecipientName(serachText, recipient).subscribe(res => {
      this.userNameList = [];
      this.userNameData = res.results;
      this.userNameList = this.userNameData;
      this.recipientEnabled = true;
       if (res.statusCode === 1) {
          this.matrixForm.get('recipientName').setValue(recipientName);
        }
    })
    if (data.hasOwnProperty('id') && data.id != null) {
      if(!this.isRecipient) {
         this.isRecipient = true;
         recipientName = data.recipientName;
      } else {
        recipientName = data.identifyingId != null && data.identifyingId != undefined ?  data.identifyingId : data.identifyingId;
      }
    } else {
      recipientName = data.identifyingId;
    }
      this.matrixForm.get('recipientType').setValue(data.identifyingType);
      this.matrixForm.get('recipientName').setValue(recipientName);
      this.matrixForm.get('level').setValue(levelNumber);
      this.matrixForm.get('description').setValue(data.description);
      this.matrixForm.get('channelId').setValue(data.channelId);
      this.matrixForm.get('entityStatusId').setValue(data.entityStatusId);
    if (this.isRecipient) {
      setTimeout(() => { this.getUsername(this.matrixForm.get('recipientName').value) }, 500);
    }
  }

  tabChanged(event) {
    this.selectedTab = event.tab.textLabel;
    if (this.selectedTab === 'Approval Matrix') {
      if (this.formStatusData.length) {
        const codes = this.formStatusData.map(x => x.level);
        const updateCodes = Array.isArray(codes) ? codes.map(Number) : [Number(codes)];
        this.levelListInfo = this.levelList.filter(item => updateCodes.includes(item.code));
      }
      //  else {
      //   this.levelListInfo = this.levelList;
      // }
    }
  }

  approvelDeleteData(data) {
    if (data.hasOwnProperty('id') && data.id != null && data.id != undefined) {
        const appDeleteData = this.pfworkflowData.filter(x => x.id === data.id).map(item => ({...item, isActive : false }));
        this.pfWorkDeletData.push(...appDeleteData);
        this.pfWorkDeletData = [...this.pfWorkDeletData];
        this.pfworkflowData = this.pfworkflowData.filter(x => x.id != data.id);
    } else {
      this.pfworkflowData = this.pfworkflowData.filter(x => !( x.identifyingType === data.identifyingType && x.identifyingId === data.identifyingId && x.channelId === data.channelId ) );
    }
    this.pfworkflowData = [...this.pfworkflowData];
  }
  getLavelValueName(event) {
    const levelData = this.formStatusData?.some(item => 'level' in item && typeof item.level === 'string') ? String(event) : event;
    const approvalStatusData = this.formStatusData?.find( item => item.level === levelData);
    if (approvalStatusData != null && approvalStatusData != undefined) {
      this.matrixForm.get('entityStatusId').setValue(approvalStatusData.code);
    }
  }

  formStatusEdit(data) {
    this.updateformStatusList(data);
    this.editData = data;
    this.templateForm.get('formGroupname').setValue(data.code);
    this.templateForm.get('formName').setValue(data.name);
    this.templateForm.get('formLevel').setValue(data.level);
    this.templateForm.get('formEdit').setValue(data.edit === 'Disable' ? false : true);
    this.templateForm.get('formReturn').setValue(data.return === 'No' ? false : true );
  }

  formStatusDelet(data) {
    this.formStatusData = this.formStatusData.filter(x => x.code != data.code);
    this.formStatusData = [...this.formStatusData];
    this.formStatusData.sort((a, b) => a.level - b.level);
    const calculatedLevel = this.formStatusData.length ? Math.max(...this.formStatusData.map(x => x.level)) + 1 : Math.max(0);
    this.maxLevel = calculatedLevel > this.maxVisitorLimit ? this.maxVisitorLimit : calculatedLevel;
    this.updateformStatusList(data);
    this.templateForm.get('formLevel').setValue(this.maxLevel);
  }

  updateformStatusList(data) {
    const statusFormData = this['entityFormStatusInfo'].filter(res => res.code == data.code);
    statusFormData.forEach(item => {
      const exists = this.entityFormStatusList.some(x => x.code === item.code);

      if (!exists) {
        this.entityFormStatusList.unshift(item);
      }
    });
  }

   updateVisitorCount(action: string): void {
    let currentCount = this.templateForm.controls['formLevel'].value;

    if (action === 'increment' && currentCount < this.maxVisitorLimit) {
      this.templateForm.controls['formLevel'].setValue(currentCount + 1);
    } 
    else if (action === 'decrement' && currentCount > 0) {
      this.templateForm.controls['formLevel'].setValue(currentCount - 1);
    }
  }


  prepareJsonKeyList() {
    this.eventDataInfo = this.templateForm.get('jsonValue').value;
    if (typeof this.eventDataInfo === 'string') {
      this.eventDataInfo = JSON.parse(this.eventDataInfo);
    }
    // if (this.formStatusData.length) {
    //   this.eventDataInfo['approval matrix'] = true;
    // }
     if (!this.eventDataInfo.hasOwnProperty('approval matrix')) {
      this.eventDataInfo['approval matrix'] = false;
    } else if (this.eventDataInfo.hasOwnProperty('approval matrix') && this.eventDataInfo['approval matrix'] === true) {
      this.workFlowStatus = true;
    }
    const requiredKeys = [ 'footer', 'header', 'dataScope', 'roundTrip', 'enablePdf', 'enableExcel'];
    if (!this.eventDataInfo.hasOwnProperty(requiredKeys)) {
      requiredKeys.forEach(key => {
        if (!(key in this.eventDataInfo)) {
          this.eventDataInfo[key] = false;
        }
      });
    }
    const jsonValues = JSON.parse(this.templateForm.get('jsonValue').value);
    // if (this.formStatusData.length) {
    //   jsonValues['approval matrix'] = true;
    // }
    if (!jsonValues.hasOwnProperty(requiredKeys)) {
      requiredKeys.forEach(key => {
        if (!(key in jsonValues)) {
          jsonValues[key] = false;
        }
      });
    }
    if (!jsonValues.hasOwnProperty('approval matrix')) {
      jsonValues['approval matrix'] = false;
    } else if (jsonValues.hasOwnProperty('approval matrix') && this.eventDataInfo['approval matrix'] === true) {
      this.workFlowStatus = true;
    }
    delete jsonValues.col;
    const jsonFilterData = JSON.stringify(jsonValues);
    const jsonKey = Object.keys(jsonFilterData).map(key => ({
      key,
      value: jsonFilterData[key]
    }));
    const jsonStr = jsonKey.map(i => i.value).join('');
    const parsedJson = JSON.parse(jsonStr);
    this.jsonKeyList = Object.entries(parsedJson).map(([key, value]) => ({ key, value }));
  }

  onCheckboxChange(item: any, event: any) {
    const eventTrigger = event.checked;
    const newEntry = { ...item, value: eventTrigger };
    if(newEntry.key === 'approval matrix' && newEntry?.value) {
      this.workFlowStatus = true;
    } else if(newEntry.key === 'approval matrix' && !newEntry?.value){
      this.workFlowStatus = false;
    }
    const existingIndex = this.checkedInfo.findIndex(info => info.key === newEntry.key);
    if (existingIndex !== -1) {
      this.checkedInfo[existingIndex] = newEntry;
    } else {
      this.checkedInfo.push(newEntry);
    }
    if (typeof this.eventDataInfo === 'string') {
      try {
        this.eventDataInfo = JSON.parse(this.eventDataInfo);
      } catch (e) {
        this.eventDataInfo = {};
      }
    }
    this.checkedInfo.forEach(item => {
      this.eventDataInfo[item.key] = item.value;
    });
  }
  onchangeEdit(event){
    console.log(event);
  }

  onchangeReturn(event){
    console.log(event);
  }

  getOTSpecialty() {
    this.commonService.getOTSpecialty().subscribe(res => {
      this.otSpecialty = res.results.map(item => { 
        return { ...item, code: item.id, value : item.name }; 
      });
    });
  }
  getAllDataItems() {
    this.configurationService.getDataitems().subscribe(res =>{
      this.allDataItems = res.results.filter(res => res.status);
      this.dataItems = res.results.filter(res => res.status);
      this.dataItemTypes = this.allDataItems.map(item => item.typeName).filter((value, index, self) => 
        (self.indexOf(value) === index && value != null));
      this.dataItemTypes.unshift("All")
      if(this.data){
        this.addedDataItems();
      }
    });
  }
  reloadConfig(){
    this.isReload =false;
    this.templateForm.controls['dataItems'].setValue(this.formTemplateData);
    this.formConfig = this.templateForm.value;
    this.formConfig['layout'] = this.layout;
    this.isReload =true;
  }
  addedDataItems(){
    this.dataItems.forEach(element => {
    if(this.formTemplateData1.filter(res => ((res.pfDataItemId != null && res.pfDataItemId == element.id) || (res.pfDataItemId == null && res.id == element.id)) && element.type != 'DI-HZL' && element.type != 'DI-LBL' && element.type != 'DI-RB').length>0){
      element.isAdded = false;
    } else{
      element.isAdded = false;
    }
    });
  }
  addDataItem(item){
    if (item.type === 'DI-ACD') {
        this.accordionCount++;
        const acc = {
            ...JSON.parse(JSON.stringify(item)),  
            type: 'DI-ACD',
            name: item.name + '_' + Date.now(),
            key: item.name + '_' + Date.now(),  
            accordionTitle: item.labelName,      
            accordionExpanded: true,
            accordionRows: [],
            validator: { show: true },
        };
        this.formTemplateData1.push(acc);
        this.formTemplateDetail.push(acc);
        this.formTemplateData = [...this.formTemplateData1];
        return;
    }

    if (this.activeAccordionKey !== null) {
        const acc = this.formTemplateData1.find(
            (e: any) => e.type === 'DI-ACD' && e.key === this.activeAccordionKey
        );
      if (acc) {
        const copy = JSON.parse(JSON.stringify(item));

        const detailArray = Array.isArray(this.formTemplateDetail) ? this.formTemplateDetail : [];
        const nameFilter = detailArray.filter(
          (val: any) => val && val.name != null && val.name.includes(copy['name'])
        );
        if (nameFilter.length) copy['name'] = copy['name'] + nameFilter.length;

        copy['key'] = copy['name'];
        if (copy['validation']) {
          try {
            const validator = JSON.parse(copy['validation']);
            validator['show'] = true;
            copy['validator'] = validator;
          } catch (e) {
            copy['validator'] = { show: true };
          }
        } else {
          copy['validator'] = { show: true };
        }

        const lastRow = acc.accordionRows[acc.accordionRows.length - 1];
        const col = 2;
        if (!lastRow || lastRow.length >= col) {
          acc.accordionRows.push([copy]);
        } else {
          lastRow.push(copy);
        }

        acc.accordionRows.forEach((row: any[], rowIdx: number) => {
          row.forEach((field: any, colIdx: number) => {
            field.position = `R${(rowIdx + 1).toString().padStart(2, '0')}C${colIdx.toString().padStart(2, '0')}`;
          });
        });

        item.isAdded = false;
        this.formTemplateData = [...this.formTemplateData1];
        return;
      }
    }

    let itemValue = JSON.parse(JSON.stringify(item))
    let nameFilter = this.formTemplateDetail.filter(val=> val.name != null && val.name.includes(itemValue['name']))
    if(nameFilter.length) {
      itemValue['name'] = itemValue['name'] + nameFilter.length
    }
    this.formTemplateData1.push(itemValue);
    this.formTemplateDetail.push(itemValue);
    this.formTemplateData = [];
    this.formTemplateData = [...this.formTemplateData1];
  }
  updateDeleteDataItems(data){
    let tempDeletedDataItem = data.filter(res => res.status == false);
    if(this.deletedDataItem.length>0 && tempDeletedDataItem.length>0){
      if(this.deletedDataItem.filter(res => res.pfFormTemplateDataItemId != tempDeletedDataItem['pfFormTemplateDataItemId'])){
        this.deletedDataItem.push(tempDeletedDataItem[0]);
      }
    } else if(tempDeletedDataItem.length>0){
      this.deletedDataItem.push(tempDeletedDataItem[0]);
    }
  }
  formTemplateUpdatedData(updatedData){
    this.isTrigger = false;
    this.updateDeleteDataItems(updatedData);
    const prevAccordions = this.formTemplateData1.filter((e: any) => e.type === 'DI-ACD');
    this.formTemplateData1 = updatedData .filter((item: any) => {
            if (item.type === 'DI-ACD') return true;
            return item.status;
        })
        .map((item: any) => {
            if (item.type === 'DI-ACD') {
                const prev = prevAccordions.find((a: any) => a.key === item.key);
                if (prev) {
                    prev.position = item.position;
                      if (item.accordionRows !== undefined) {
                        prev.accordionRows = item.accordionRows;
                    }
                    if (item.accordionTitle) {
                        prev.accordionTitle = item.accordionTitle;
                    }
                    return prev;
                }
            }
            return item;
        });
    prevAccordions.forEach((acc: any) => {
        const exists = this.formTemplateData1.find((e: any) => e.key === acc.key);
        if (!exists) this.formTemplateData1.push(acc);
    });
    this.formTemplateData = [...this.formTemplateData1];
    let layoutData = {};
    this.formTemplateData1.forEach((element: any) => {
        if (element.position) {
      layoutData[element['name']] = element['position']
        }
        if (element.type === 'DI-ACD') {
            (element.accordionRows || []).forEach((row: any[]) => {
                row.forEach((field: any) => {
                    if (field.name && field.position) {
                        layoutData[field.name] = field.position;
                    }
                    if(element.children?.length){
                       element.children.forEach(child => {
                        if(child.name && child.position){
                          layoutData[child.name] = child.position;
                        }
                       })
                    }
                });
            });

        }
    });
    this.formConfig['layout'] = JSON.stringify(layoutData);
    this.addedDataItems();
    setTimeout(() => this.isTrigger = true, 100);
  }
  isSaveEnable(data){
    this.isSaveEnabled = data;
  }
  getDataItemByType(type){
    if(type == 'All'){
      this.dataItems = this.allDataItems;
    } else{
      this.dataItems = this.allDataItems.filter(resFilter => resFilter.typeName === type);
    }
  }
  buildForm() {
    this.templateForm = this.form.group({
      id: [this.data?.id ?? null],
      name: [this.data?.name ?? null],
      code: [this.data?.code ?? null],
      type: [this.data?.type ?? null],
      css: [this.data?.css ?? JSON.stringify({"header":null,"footer":null,"content":null,"action":null})],
      description: [this.data?.description ?? null],
      entityStatusId: [this.data?.entityStatusId ?? null],
      channelId: [this.data?.channelId ?? null],
      jsonValue: [this.jsonValueFilter ? JSON.stringify(this.jsonValueFilter) : JSON.stringify({ col : 2, footer: true, header: true, dataScope: false, roundTrip: false, enablePdf: false, enableExcel: false})],
      formStatusId: [this.data?.formStatusId ?? 'FS-DR'],
      status: [this.data?.status ?? true],
      isFacility: [this.data?.facilityId ? true :false],
      dataItemTypes: ["All"],
      dataItems : [this.data?.dataItems ?? null],
      pfWorkflows: [this.data?.pfWorkflows ?? null],
      departmentLinks: [this.data?.departmentLinks ?? null],
      layout:[this.data?.layout ?? null],
      formGroupname: [null, Validators.required],
      formName: [null],
      formLevel: [this.maxLevel != null && this.maxLevel != undefined ? this.maxLevel : 0 ],
      formEdit: [null],
      formReturn: [null]
    }, { validator: this.customValidate })
    this.formConfig = this.templateForm.value;
    this.formConfig['layout'] = this.layout;
    this.templateJsonValue = this.data?.jsonValue ? JSON.stringify(this.jsonValueFilter) : null;
    this.matrixForm = this.form.group({
      recipientType: [null],
      recipientName: [null],
      level: [null],
      description: [null],
      channelId: [null],
      entityStatusId: [null]
    });
    this.departmentForm = this.form.group({
      'departmentId': [null, Validators.required],
      'startDate' :  [null],
      'endDate': [null],
    });
  }
  getDepartmentList(id) {
    if (id) {
      const department = this as any as { id: string, name: string }[]
      const departmentId = department.find(obj => obj.id === id).name;
      return departmentId;
    } else {
      return '';
    }
  }
searchDepartmentDetails(event) {
  if (event.text.length >= 2) {
    if (event.toHit === true) {
      this.commonService.getAllDepartments(event.text).subscribe(res => {
        this.departmentListRes = res.results;
        if (this.deptableData.length > 0) {
          const existingDepartmentIDs = this.deptableData.map(item => item.departmentId); 
          this.departmentList = this.departmentListRes.filter(item => item.id == null || !existingDepartmentIDs.includes(item.id)
          );
        } else {
          this.departmentList = this.departmentListRes;
        }
        this.departmentEnabled = true;
      });
    } else {
      if (this.deptableData.length > 0) {
        const existingDepartmentIDs = this.deptableData.map(item => item.departmentId);
        this.departmentList = this.departmentListRes.filter(item => item.id == null || !existingDepartmentIDs.includes(item.id)
        );
      } else {
        this.departmentList = this.departmentListRes;
      }
      this.departmentEnabled = true;
    }
  } else {
    this.departmentList = [];
    this.departmentEnabled = false;
  }
}

  searchUserNamelist(event) {
    if (this.matrixForm.controls['recipientType'].value !== null) {
      this.recipientEnabled = false;
      let recipient = this.matrixForm.controls['recipientType'].value
      let serachText = event.text;
      if (recipient !== 'RT-RO' && serachText.length >= 2) {
        if(event.toHit == true) {
          this.configurationService.getRecipientName(serachText, recipient).subscribe(res => {
            this.recepientListItems = res.results;
            this.userNameList = this.recepientListItems;
            this.recipientEnabled = true;
          });
        } else {
          this.userNameList = this.recepientListItems;
          this.recipientEnabled = true;
        }
      } else {
        this.configurationService.getRecipientName(serachText, recipient).subscribe(res => {
          this.recepientListItems = res.results;
          this.userNameList = this.recepientListItems;
          this.recipientEnabled = true;
        });
      }
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }
  getUsername(selectedUserId){
    if(selectedUserId){
      let selectedUser = this.userNameList.filter(res => res.id == selectedUserId);
      return selectedUser[0]['name'];
    } else{
      return '';
    }
  }
  
  getRecipientName(type){
    this.matrixForm.get('recipientName').reset();
    if (type) {
      let serachText = '';
      this.configurationService.getRecipientName(serachText, type).subscribe(res => {
        this.userNameList = res.results.filter(x => x.name != null);
        this.recipientEnabled = true;
      });
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }
  customValidate(fg: FormGroup) {
    let error = null;
    if (fg.get('css').value != null && fg.get('css').value !== '') {
        let optionValue = fg.get('css').value;
        try {
            optionValue = JSON.parse(optionValue);

        } catch (e) {
            error = fg.controls['css'].setErrors({ invalid: true });
        }
    }
    if (fg.get('jsonValue').value != null && fg.get('jsonValue').value !== '') {
      let optionValue = fg.get('jsonValue').value;
      try {
          optionValue = JSON.parse(optionValue);

      } catch (e) {
          error = fg.controls['jsonValue'].setErrors({ invalid: true });
      }
    }
    return error;
}
  dataItemCollection() {
    return this.form.group({
      id: [null],
      name: [null],
      labelName: [null],
      type: [null],
      description: [null],
      tooltip: [null],
      validation: [null],
      defaultValue: [null],
      status: [null],
      multiSelect: [null],
      customCss: [null],
      customErrorMessage: [null],
      pfModelId: [null],
      outputResponse: [null],
    });
  }
  saveFormTemplate(){
    let outerRowIndex = 0;
    this.formTemplateData1.forEach((item: any) => {
        if (item.type === 'DI-ACD') {
            item.position = `R${(outerRowIndex + 1).toString().padStart(2, '0')}C00`;
            (item.accordionRows || []).forEach((row: any[], rowIdx: number) => {
                row.forEach((field: any, colIdx: number) => {
                    field.position = `R${(rowIdx + 1).toString().padStart(2, '0')}C${colIdx.toString().padStart(2, '0')}`;
                });
            });
        }
        outerRowIndex++;
    });
    let layout = this.layout ? JSON.parse(this.layout) : {};
    this.formTemplateData1.forEach((item: any) => {
      if (item?.position) {
        const rowNum = parseInt(item.position.substring(1, 3));
        const colNum = parseInt(item.position.substring(4, 6));
        const layoutKey = item.type === 'DI-ACD' ? (item.key || item.name) : item.name;
        layout[layoutKey] = { x: colNum, y: rowNum, w: 1, h: 1 };
      }

        if (item.type === 'DI-ACD' && item.accordionRows?.length) {
            item.accordionRows.forEach((accRow: any[]) => {
                accRow.forEach((accField: any) => {
                    if (!accField?.name || !accField?.position) return;
                    const r = parseInt(accField.position.substring(1, 3));
                    const c = parseInt(accField.position.substring(4, 6));
                    layout[accField.name] = { x: c, y: r, w: 1, h: 1 };
                });
            });
        }
    });

    this.formTemplateData1.forEach((item: any) => {
        if (item.type === 'DI-ACD') {
            item['children'] = (item.accordionRows || []).flatMap((row: any[]) =>
                row.map((field: any) => ({
                    pfDataItemId: field.pfDataItemId || field.id || null,
                    pfFormTemplateDataItemId: field.pfFormTemplateDataItemId || null,
                    name: field.name,
                    labelName: field.labelName,
                    type: field.type,
                    status: field.status ?? true,
                    validation: field.validation || null,
                    defaultValue: field.defaultValue || null,
                    customCss: field.customCss || null,
                    tooltip: field.tooltip || null,
                    contextValue: field.contextValue || null,
                    customValue: field.customValue || null,
                    multiSelect: field.multiSelect || null,
                    position: field.position || null,
                    description: field.description || null,
                    customErrorMessage: field.customErrorMessage || null,
                    modelMapping: field.modelMapping || null,
                    template: field.template || null
                }))
            );
            delete item['accordionRows'];
            delete item['accordionTitle'];
            delete item['accordionExpanded'];
            delete item['_isActiveTarget'];
            delete item['key'];
            delete item['validator'];
        }
    });

    if (typeof this.eventDataInfo === 'string') {
      this.eventDataInfo = JSON.parse(this.eventDataInfo);
    }
    if (this.formStatusData.length) {
      this.eventDataInfo['status'] = this.formStatusData?.map(item => ({ ...item, edit: item.edit === 'Enable' ? true : false, return: item.return === 'Yes' ? true : false }));
    }
    const mergedJsonString = JSON.stringify(this.eventDataInfo);
    this.templateForm.get('jsonValue').setValue(mergedJsonString);
    this.deletedDataItem = this.deletedDataItem.filter(function( element ) {
      return element !== undefined;
    });
    let formTemplateDataItems = this.formTemplateData1.concat(this.deletedDataItem);
    let layoutData = {};
    if (this.pfWorkDeletData.length) {
      this.pfworkflowData.push(...this.pfWorkDeletData);
    }
    formTemplateDataItems.forEach(item =>{
      if(item['pfFormTemplateDataItemId'] == null){
        item['pfDataItemId'] = item['id'];
      }
      layoutData[item['name']] = item['position'] ? item['position'] : layout && layout.hasOwnProperty(item.name) ? layout[item.name] : item['position'];
      if (item.type === 'DI-ACD' && item.children?.length) {
        item.children.forEach((childField: any) => {
          if (!childField?.name) return;
          const position = childField.position;
          if (!position) {
            return;
          }
          layoutData[childField.name] = position;
        });
      }
      delete item['pfModelData'];
      delete item['outputResponse'];
      delete item['typeName'];
      delete item['id'];
      delete item['isAdded'];
      delete item['tempCustomCss'];
    })
    if (this.pfworkflowData.length) {
      this.pfworkflowData.forEach(item => {
        item['identifyingId'] = item['identifyingId'];
        item['identifyingType'] = item['identifyingType'];
        item['workflowLevelId'] = String(item['workflowLevelId']);
        item['entityId'] = this.templateForm.controls['id'].value;
        item['entityType'] = "form_template"; 
        item['roleName'] = null;
        item['isActive'] = item['isActive'] === false ? false : true;
        item['userName'] = null;
        item['entityStatusId'] = item['entityStatusId'];
        item['description'] = item['description'];
        item['recipientName'] = item['identifyingId'];
        item['recipientType'] = item['identifyingType'];
        item['level'] = String(item['workflowLevelId']);
      })
    }
    let pfWorkflows = this.pfworkflowData;
    this.templateForm.controls['pfWorkflows'].setValue(pfWorkflows)
    this.templateForm.controls['dataItems'].setValue(formTemplateDataItems);
    this.templateForm.controls['layout'].setValue(JSON.stringify(layoutData));
    let depLinkData = this.departmentData.length > 0 ? this.deptableData.concat(this.departmentData) : this.deptableData;                                             
    this.templateForm.controls['departmentLinks'].setValue(depLinkData)
    this.templateForm.removeControl('dataItemTypes');  
    // console.log(this.templateForm.value);
    // return
    this.configurationService.savePfFormTemplate(this.templateForm.value).subscribe(res => {
      if(res.statusCode === 1){
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
        // this.pfFormTemplateId = res.results.id;
        // this.getFormTemplateData();
      }
    });
  }
  getFormTemplateData(){
    this.configurationService.getFormTemplates(this.pfFormTemplateId).subscribe(res =>{
      this.data = res.results[0];
      if(this.data){
        this.formTemplateDetail = this.data.dataItems; 
        this.formTemplateData = this.data.dataItems.filter(res => res.status);
        this.formTemplateData1 = this.data.dataItems.filter(res => res.status);
        this.formConfig = this.data;
        this.layout = this.data['layout'];
        this.pfFormTemplateId = this.data.id;
      }
      this.ngOnInit();
    })
  }
  saveAsFormTemplate(){
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'], disableClose: true,
      data: {
      title: 'Confirmation', message: 'Do you want to create a copy of this form template?',
      buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 1, formTempNameEnable: true, formTempName:this.templateForm.controls['name'].value
      }
    });
    dialogRef.afterClosed().subscribe(result => {
        if(result.hasOwnProperty('formTempName')){
          this.templateForm.controls['name'].setValue(result['formTempName']);
          this.templateForm.controls['id'].setValue(null);
          this.templateForm.controls['code'].setValue(null);
          this.saveFormTemplate();
        }
    });
  }
  previewDialog(){
    let formData = { "id" : null , "entityId" : null , "entityType" : null, "pfFormTemplateId" : this.pfFormTemplateId, "content" : "form"};
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['medium-popup'], disableClose: true
    });
  }
  getEntityAssociationData() {
    this.configurationService.getEntityform(this.pfFormTemplateId, 'pf_form_template').subscribe((res) => {
      const entityData = res.results;
      this.entityData = { 'data': entityData, 'type': 'TW-FTP', 'formData' : {entityId : this.data?.id, Qualifier : this.data?.entity}  }
    });
  }
    showTableAction(type) {
      if (type == 'department') {
        this.deptable = !this.deptable
      }
    }

    addDepartment() {
      this.deptable = false;
      const index = this.deptableData.indexOf(this.editDepData);
      if (this.editdepKey) {
        let departmentData = {
          'id': this.editDepData?.id || null,
          'departmentId': this.departmentForm.controls['departmentId'].value,
          'departmentName': this.departmentList.find(item => item.id === this.departmentForm.controls.departmentId.value)?.name,
          'startDate': this.datepipe.transform(this.departmentForm.controls['startDate'].value, "yyyy-MM-dd HH:mm:ss"),
          'endDate': this.datepipe.transform(this.departmentForm.controls['endDate'].value, "yyyy-MM-dd HH:mm:ss"),
          'qualifierTypeId': "QLF-ASG",
          "isActive": true,
        }
        this.editdepKey = false;
        this.editDepData = null;
        this.deptableData[index] = departmentData
      } else {
        let departmentData = {
          'id': null,
          'departmentId': this.departmentForm.controls['departmentId'].value,
          'departmentName': this.departmentList.find(item => item.id === this.departmentForm.controls.departmentId.value)?.name,
          'startDate': this.datepipe.transform(this.departmentForm.controls['startDate'].value, "yyyy-MM-dd HH:mm:ss"),
          'endDate': this.datepipe.transform(this.departmentForm.controls['endDate'].value, "yyyy-MM-dd HH:mm:ss"),
          'qualifierTypeId': "QLF-ASG",
          "isActive": true,
        }
        this.deptableData.push(departmentData);
      }
      this.departmentList = [];
      setTimeout(() => this.showTableAction('department'), 50);
      this.departmentForm.reset()
    }


    editdepData(data) {
      this.editDepData = data;
      this.commonService.getAllDepartments(data.departmentName).subscribe(res => {
        if (res.statusCode === 1) {
          this.departmentListRes = res.results;
          this.departmentList = this.departmentListRes;
          this.departmentEnabled = true;
          setTimeout(() => {
            this.departmentForm.patchValue({
              departmentId: data.departmentId,
              startDate: this.datepipe.transform(data.startDate, 'yyyy-MM-dd'),
              endDate: this.datepipe.transform(data.endDate, 'yyyy-MM-dd'),
            })
          }, 1000);
          this.editdepKey = true;
        }
      });
    }

    removeDepartDetails(data) {
      this.deptable = false;
      const index = this.deptableData.indexOf(data);
      if (data.id !== null) {
        this.deptableData[index].isActive = false;
        this.departmentData = [JSON.parse(JSON.stringify(this.deptableData[index]))];
        this.deptableData.splice(index, 1)[0];
      } else {
        this.deptableData.splice(index, 1)[0];
      }
      setTimeout(() => this.showTableAction('department'), 50);
    }

  enableDrop(data){
    this.enableDrag = data
  }
  fixClick() {
    console.log('')
  }

  selectedFilter(value) {
    this.selectedValue = value;
    if (this.selectedValue == 'All') {
      this.dataItems = this.allDataItems;
    } else {
      this.dataItems = this.allDataItems.filter(resFilter => resFilter.typeName === this.selectedValue);
    }
  }

  isSelected(value: string): boolean {
    return this.selectedValue == value;
  }

  onAccordionTargetChanged(key: string | null) {
    this.activeAccordionKey = key;
  }
}

