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

import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../../shared';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppToastService } from '../../../../shared/services/toaster.service';

export function existingApptermCodeValidator(commonService: CommonService, shouldSkip: () => boolean): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    if (shouldSkip()) {
      return of(null);
    }
    if (control.value != null && control.value !== '') {
      const appCode = control.value;
      if (appCode.length >= 3) {
        return new Observable((observer) => {
          commonService.validateApptermsCode(appCode).subscribe(
            res => {
              observer.next(null);
              observer.complete();
            },
            error => {
              observer.next({ isAppCodeExists: true });
              observer.complete();
            }
          );
        });
      } else {
        return of(null);
      }
    }
    return of(null);
  };
}

@Component({
  selector: 'app-manage-appterms',
  templateUrl: './manage-appterms.component.html',
  styleUrls: ['./manage-appterms.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ManageApptermsComponent implements OnInit {

  public tablist: any;
  public selectedTabIndex = 0;
  // displayedColumns: any={};
  // public applyFilterValue: any = null;
  permissionControl = ['BT_ALLE'];
  public tableDetails = {
    'displayedColumns' : {},
    'tableData' : {},
    'sortColumn' : {},
    'iconHeader' : {},
    'iconColumn' : {},
    'eventColumn' : {},
    'applyFilterValue' : {},
    'Columns': [],
  };
  public appTermsForm : FormGroup;
  statusList = [true,false];
  public apptermsJson : any;
  public selectedType: any;
  public linkGroup: any=[];
  public linkAppterm: any=[];
  public language: any=[];
  public languageData: any=[];
  public applyFilterValue: any;
  public selectedLabel: any;
  public isChecked: boolean = false;
  public isFilter: boolean = false;
  public skipAppCodeValidation = false;
  public updateBtn = false;
  public tableRefresh = true;
  public onLoading: boolean = false;
  public expanded: boolean = false;
  public parentCode: any;
  public defaultValue: any[] = [];
  public pageStart = 0;
  public pageSize = 20;
  public length = 0;
  public displayedColsList = {
    "appTerms": ['Code','Name','Sequence','Global','Default','Status'],
    "appTermsFacilities": ['Code','Name','Include','Default','Status'],
    "appTermsLinks": ['Code','Name','Sequence','Link Group','Link Code','Link Name','Status'],
    "appTermsMls": ['Code','Name','Language Name','Status']
  };
  public columnsList = {
    "appTerms": ['code','value','sequence','isGlobal','isDefault','isActive'],
    "appTermsFacilities": ['appTermsCode','appTermName','isInclude','isDefault','isActive'],
    "appTermsLinks": ['code','appTermName','sequence','childGroupName','childCode','childAppTermName','isActive'],
    "appTermsMls": ['appTermsCode','name','languageName','isActive']
  };
  public tabName = {
    "appTerms": "Terms",
    "appTermsFacilities": "Terms",
    "appTermsLinks": "Link Group",
    "appTermsMls": "Multi Language"
  };
  public editApptermsJson = {
      "appTerms": [],
      "appTermsFacilities": [],
      "appTermsLinks": [],
      "appTermsMls": []
    }
  public selectedTermCode1 = new FormControl(null);
  public selectedTermCode2 = new FormControl(null);
  public selectedGroupName = new FormControl(null);

   public linkedAppTerms = new FormControl(null);
   public linkedFilteredAppTerms: any[] = [];

   public apptermnameSearch = new FormControl('');
   public filterapptermName: any[] = [];

   public apptermfacilitySearch = new FormControl('');
   public filterapptermFacility: any[] = [];

   public linkgroupSearch = new FormControl('');
   public filterlinkGroup: any[] = [];

   public linkapptermSearch = new FormControl('');
   public filter = new FormControl();
   public filterlinkappTerm: any[] = [];
   public apptermsLinkData: any[] = [];
   public langRequest: any = [];
   public updatedDatalist: any = [];
   public filteredActivityCategory: any[];
   
  constructor(public form: FormBuilder,public dialog: MatDialog,@Inject(MAT_DIALOG_DATA) public data: any,private readonly commonService: CommonService,
              public toastr: AppToastService, public thisDialogRef: MatDialogRef<ManageApptermsComponent>) {
    this.apptermsJson = {
      "appTerms": [],
      "appTermsFacilities": [],
      "appTermsLinks": [],
      "appTermsMls": []
    }
    this.selectedType = data['selectedType'];
  }

  ngOnInit() {
    this.buildform();
  }

  getChangetab(event) {
     this.isChecked = event.target.checked;
     this.selectedLabel = event.target.checked ? 'Facility' : 'All';
    if (this.selectedLabel === 'All') {
      this.data['selectedType'] = 'manageApptermsGroups';
    } else {
      this.data['selectedType'] = 'manageAppterms';
    }
    this.buildform();
  }

  buildform(){
    this.createFormArr();
    this.tablist = Object.keys(this.appTermsForm.controls);
    let tabData;
    if(this.data['selectedType'] == 'manageApptermsGroups'){
      tabData = 'appTermsFacilities';
    } else{
      tabData = 'appTerms';
    }
    let index = this.tablist.indexOf(tabData);
    if (index !== -1) {
      this.tablist.splice(index, 1);
    }
    if (this.selectedLabel === 'Facility') { 
    const facilityId = localStorage.getItem(btoa('facilityId'));
    this.getApptermsData(this.data['selectedData'], facilityId);
    } else {
      this.getApptermsData(this.data['selectedData']);
      this.getApptermsFilterData('LookupGroup','linkGroup');
      this.getApptermsFilterData('Language','language');
    }
  }
  createFormArr(event?: any){
    this.appTermsForm = this.form.group({
      appTerms: this.form.array([this.getappTerms()]),
      appTermsFacilities: this.form.array([this.getappTermsFacility()]),
      appTermsLinks: this.form.array([this.getappTermsLink()]),
      appTermsMls: this.form.array([this.getappTermsMl()]),
    });
    this.applyFilter();
    if (event === 'clear') {
      this.updateBtn = false;
      this.getTableData();
    }
  }

  linkChangeappterm(event) {
    if (this.selectedTabIndex === 1) {
      this.selectedTermCode1.setValue(event.value);    
    } else {
      this.selectedTermCode2.setValue(event.value);
    }
    this.getTableData();
  }

  onChangeSelecedGroup(event) {
    this.selectedGroupName.setValue(event.value);
    this.getTableData();
  }

  applyFilter(filterValue?: string) {
    if (filterValue != null && filterValue != undefined) {
      filterValue = filterValue?.trim();
      filterValue = filterValue?.toLowerCase();
      this.applyFilterValue = filterValue;
    } else {
      this.filter.setValue(null);
      this.applyFilterValue = null;
    }
  }

  getChangeFilter(event?) {
    this.isFilter = event?.target.checked;
    const selectedKey = event?.target.checked ? 'Filter' : 'All';
    let parentGroupCodes = null;
    if (selectedKey === 'Filter') {
      parentGroupCodes = [this.parentCode];
    } else {
      parentGroupCodes = this.defaultValue;
    }
    const groupFilterData = this.apptermsLinkData;
    const apptermsLinkInfo = groupFilterData.filter(res => parentGroupCodes?.includes(res.code));
    this.apptermsJson.appTermsLinks = apptermsLinkInfo;
    this.getTableData();
  }

  getApptermsFilterData(groupName,name?,key?,data?) {
    let matchedChildCodes = null;
    let apptermsCode = null
    this.onLoading = true;
    this.commonService.getApptermsFilterData(groupName).subscribe(res =>{
      this.onLoading = false;
      if(res.statusCode == 1){
        if(name == 'linkGroup'){
          this.linkGroup = res.results[0]['appTerms'];
          this.linkGroup = this.linkGroup.filter (res => res.isActive === true || res.isActive === null)     
        } else if(name == 'linkAppterm'){
          this.appTermsForm.get('childCode')?.setValue(null);
          this.linkapptermSearch.setValue('');
          this.filterlinkappTerm = [];
          this.linkAppterm = res.results[0]?.appTerms;
          this.linkAppterm = this.linkAppterm.filter (res => res.isActive === true || res.isActive === null)
          this.filterlinkappTerm = [...this.linkAppterm];
          if (this.updateBtn) {
            matchedChildCodes = this.apptermsJson?.appTermsLinks.filter(item => item.code && item.childGroupName && item.childCode).map(item => item.childCode);
            apptermsCode = matchedChildCodes?.filter(x => x !== data.childCode);
            this.filteredActivityCategory = this.filterlinkappTerm?.filter(ac => !apptermsCode?.includes(ac.code));
            setTimeout(() => { this.filterlinkappTerm = [...this.filteredActivityCategory] }, 500)
          }
          if (key == 'filter') {
            const applinkFormsData = this.appTermsForm.value['appTermsLinks'][0];
            const filterData = this.apptermsJson.appTermsLinks.filter(res => res.code == applinkFormsData.code && res.childGroupName == applinkFormsData.childGroupName);
            const linkAppinfo = filterData.map(item => item.childCode);
            this.linkAppterm = this.linkAppterm.filter(res => !linkAppinfo.includes(res.code));
          }
        } else if(name == 'language'){
          this.languageData = res.results[0]['appTerms'];
          this.language = this.languageData.map(obj => {
            return {...obj,code: obj.code.toLowerCase()};
          });
        }
      } 
    })
  }
  getApptermsData(data?, facilityId?){
    this.onLoading = true;
    this.commonService.getApptermsData(data['code'],facilityId).subscribe(res =>{
      this.onLoading = false;
      if(res.statusCode == 1 && res.results.length) {
      this.apptermsJson = res.results[0]
      Object.keys(this.apptermsJson).forEach(key => {
      this.apptermsJson[key] = this.apptermsJson[key].filter(item => item.isActive !== false);});
      let entityGroupTypeList = this.apptermsJson.appTerms;
      this.defaultValue = entityGroupTypeList.map(res => res.code);
      this.apptermsLinkData = this.apptermsJson.appTermsLinks;
      this.getTableData();
      }
    })
  }
  getTableData(){
    let i = this.selectedTabIndex;
      if(this.apptermsJson[this.tablist[i]].length){
        this.tableDetails['eventColumn'][this.tablist[i]] = ['deleteEdit'];
        this.tableDetails['sortColumn'][this.tablist[i]] = [];
        this.tableDetails['iconHeader'][this.tablist[i]] = ['ID','deleteEdit'];
        this.tableDetails['iconColumn'][this.tablist[i]] = [];
        this.tableDetails['applyFilterValue'][this.tablist[i]] = null;
        this.tableDetails['tableData'][this.tablist[i]] = this.apptermsJson[this.tablist[i]].filter(res => res.isActive != null)
          .map((item: any) => ({
            ...item,
            isActive: item.isActive ? 'Active' : 'Inactive',
            isDefault: item.isDefault ? 'Yes' : 'No',
            isGlobal: item.isGlobal ? 'Yes' : 'No',
            isInclude: item.isInclude ? 'Yes' : 'No',
          }));
        let code = this.tablist[i] == 'appTermsMls' ? 'appTermsCode' : 'code';
        let value = this.tablist[i] != 'appTermsMls' ? this.selectedTermCode1.value : this.selectedTermCode2.value ;
        if(value) {
          this.tableDetails['tableData'][this.tablist[i]] = this.tableDetails['tableData'][this.tablist[i]].filter(res => res[code] === value)
        }

        if (this.selectedGroupName?.value) {
          this.tableDetails['tableData'][this.tablist[i]] = this.tableDetails['tableData'][this.tablist[i]].filter(res => res['childGroupName'] === this.selectedGroupName.value);
        }

        this.length = this.tableDetails['tableData'][this.tablist[i]].length;
        const Columns = this.columnsList[this.tablist[i]];
        for (let j = 0; j <= Columns.length; j++) {
          if(this.tableDetails['tableData'][this.tablist[i]]?.length){
            this.tableDetails['tableData'][this.tablist[i]].map(data => {
              data[this.displayedColsList[this.tablist[i]][j]] = data[Columns[j]];
            });
          }
        }
        this.tableDetails['displayedColumns'][this.tablist[i]] = this.displayedColsList[this.tablist[i]];
        this.tableDetails['displayedColumns'][this.tablist[i]] = this.tableDetails['displayedColumns'][this.tablist[i]].concat(this.tableDetails['eventColumn'][this.tablist[i]]);
      } else{
        this.tableDetails['tableData'][this.tablist[i]] = [];
        this.tableDetails['displayedColumns'][this.tablist[i]] = this.displayedColsList[this.tablist[i]];
      }
    this.filterapptermName = [...this.apptermsJson['appTerms']];
    this.apptermnameSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filterapptermName = this.apptermsJson['appTerms']?.filter(appterm =>
          appterm.value.toLowerCase().includes(lower)
        );
      });
      this.linkedFilteredAppTerms = [...this.apptermsJson['appTerms']];
      this.linkedAppTerms.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.linkedFilteredAppTerms = this.apptermsJson['appTerms']?.filter(appterm =>
          appterm.value.toLowerCase().includes(lower)
        );
      });
    this.filterapptermFacility = [...this.apptermsJson['appTermsFacilities']];
    this.apptermfacilitySearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filterapptermFacility = this.apptermsJson['appTermsFacilities']?.filter(appterm =>
          appterm.value.toLowerCase().includes(lower)
        );
      });
    this.filterlinkGroup = [...this.linkGroup];
    this.linkgroupSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filterlinkGroup = this.linkGroup?.filter(appterm =>
          appterm.value.toLowerCase().includes(lower)
        );
      }); 
    this.filterlinkappTerm = [...this.linkAppterm];
    if (this.updateBtn && this.tablist[i] === 'appTermsLinks') {
      this.filterlinkappTerm = [...this.filteredActivityCategory];
    }
    this.linkapptermSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filterlinkappTerm = this.linkAppterm?.filter(appterm =>
          appterm.value.toLowerCase().includes(lower)
        );
      });
  }


  onChangeExpanded(tab?) {
    this.expanded = !this.expanded;
    if (this.updateBtn) {
      this.createFormArr('clear');
    }
    this.applyFilter();
    if (tab === 'appTermsLinks') {
      this.getChangeFilter();
      this.updateBtn = false;
    }
  }

  updateSequenceValue(change: number,tab): void {
    const control = tab !== 'appTermsLinks' ?  (this.appTermsForm.get('appTerms') as FormArray).at(0).get('sequence') : (this.appTermsForm.get('appTermsLinks') as FormArray).at(0).get('sequence');
    control.markAsDirty();
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }

  private getappTerms(){
    return this.form.group({
      code: new FormControl('', { validators: [], asyncValidators: [existingApptermCodeValidator(this.commonService, () => this.skipAppCodeValidation)], updateOn: 'change'}),
      groupName: [this.data['selectedData']['code']],
      isActive: [true],
      isDefault: [null],
      isGlobal: [true],
      sequence: [null],
      value: [null]
    });
  }
  private getappTermsFacility(){
    return this.form.group({
      appTermName: [null],
      appTermsCode: [null],
      facilityId: [localStorage.getItem(btoa('facilityId'))],
      isActive: [true],
      isDefault: [null],
      isInclude: [true],
      sequence: [null],
      id: [null]
    });
  }
  private getappTermsLink(){
    return this.form.group({
      code: [null],
      childCode: [null],
      groupName: [this.data['selectedData']['code']],
      childGroupName: [null],
      facilityId: [null],
      sequence: [null],
      isActive: [true],
      id: [null],
      appTermName: [null],
      childAppTermName: [null]
    });
  }
  private getappTermsMl(){
    return this.form.group({
      name: [null],
      languageCode: [null],
      isActive: [true],
      appTermsCode: [null],
      facilityId: [null],
      id: [null],
      languageName: [null]
    });
  }
  public addData(tab) {
    this.tableRefresh = false;

    const cmpValue = this.getCmpValue(tab);
    const formValue = this.appTermsForm.value[tab][0];
    
    const existDataInfo = this.findExistingData(tab, cmpValue, formValue);
    if (existDataInfo.existData.length) {
        this.handleExistingData(tab, existDataInfo.index, existDataInfo.existData);
    } else {
        this.handleNewData(tab, formValue);
    }

    this.updateBtn = false;
  }

  private getCmpValue(tab: string): string {
    if (tab === "appTerms") return "code";
    if (tab === "appTermsFacilities") return "appTermsCode";
    return "id";
  }

  private findExistingData(tab: string, cmpValue: string, formValue: any) {
    let index: number;
    const existData = this.apptermsJson[tab].filter((res, i) => {
        if (res[cmpValue] === formValue[cmpValue]) {
            if (
                (tab === 'appTermsLinks' && res.id === null && (res.code !== formValue.code || res.childCode !== formValue.childCode)) ||
                (tab === 'appTermsMls' && res.languageCode === formValue.languageCode && res.id === formValue.id)
            ) {
                return false;
            } else {
                index = i;
                return true;
            }
        }
        return false;
    });
    return { existData, index };
  }

  private handleExistingData(tab: string, index: number, existData: any[]) {
    this.apptermsJson[tab][index] = this.appTermsForm.value[tab][0];

    if (tab === 'appTermsLinks') {
        this.updateAppTermsLinks(index, this.appTermsForm.value[tab], existData);
    }
    const key = tab;
    if (this.editApptermsJson[key]) {
        const editedData = this.updatedDatalist?.length ? this.updatedDatalist : existData;
        this.editApptermsJson[key].push(...editedData);
    }

    if (this.apptermsJson[tab][index].hasOwnProperty('isDefault') && this.apptermsJson[tab][index].isDefault) {
        this.updateDefaultFlags(tab, index);
    }

    this.getTableData();
    this.tableRefresh = true;
    this.createFormArr();
  }

  private updateDefaultFlags(tab: string, index: number) {
    const key = tab;
    const changeDefaultData = this.apptermsJson[tab].filter(x => x.isDefault === true);
    this.editApptermsJson[key].push(...changeDefaultData);

    const dataList = this.apptermsJson[tab];
    const selectedCode = tab === 'appTermsFacilities' ? dataList[index].appTermsCode : dataList[index].code;
    const codeKey = tab === 'appTermsFacilities' ? 'appTermsCode' : 'code';

    dataList.forEach(item => {
        item.isDefault = item[codeKey] === selectedCode;
    });
  }

  private updateAppTermsLinks(index: number, data, editData) {
    const selectedData = data[0];
    const modifyData = editData[0];
    let updatedDatalist: any = [];

    const filterAppLinksData = this.linkAppterm.filter(res => data[0]?.childCode.includes(res.code) && (res.isActive === true || res.isActive === null));
    const sortedFilterAppLinksData = filterAppLinksData.sort((a, b) => {
      if (a.code === modifyData?.childCode) return -1;
      if (b.code === modifyData?.childCode) return 1;
      return 0;
    });

    updatedDatalist = sortedFilterAppLinksData?.map((child, i) => ({
      appTermName: selectedData.appTermName,
      code: selectedData.code,
      childAppTermName: child.value,
      childCode: child.code,
      childGroupName: selectedData.childGroupName,
      facilityId: null,
      groupName: selectedData.groupName,
      id: i === 0 ? modifyData?.id : null,
      isActive: selectedData.isActive,
      sequence: selectedData.sequence
    }));

    this.updatedDatalist = updatedDatalist;
    const updatedIds = updatedDatalist.map(d => d.id).filter(id => id != null);
    const editableData = updatedDatalist?.find(obj => updatedIds.includes(obj.id));

    if (editableData && Array.isArray(editableData.childCode)) {
          editableData.childCode = editableData.childCode[0]; 
      }

    this.apptermsJson.appTermsLinks = this.apptermsJson?.appTermsLinks.filter(link => !Array.isArray(link.childCode));
    this.apptermsJson['appTermsLinks'][index] = editableData;
    const updateData = this.apptermsJson['appTermsLinks'][index];

    if (index !== -1) {
        this.apptermsLinkData[index] = updateData;
    } else {
        this.apptermsLinkData.push(updateData);
    }

    const createData = updatedDatalist?.filter(res => res.id == null);
    this.apptermsLinkData.push(...createData);
    this.apptermsJson.appTermsLinks.push(...createData);
    this.getChangeFilter();
  }

  private handleNewData(tab: string, formValue: any) {
    if (['appTermsLinks'].includes(tab)) {
      this.getmultiAppLinks(this.appTermsForm.value[tab]);
    }
    this.apptermsJson[tab] = this.apptermsJson[tab].concat(this.appTermsForm.value[tab]);

    if (formValue?.isDefault) {
        this.updateDefaultFlagsNew(tab, formValue);
    }

    if (this.hasGlobalFlag(this.appTermsForm.value[tab])) {
        this.addLangRequest(tab, formValue);
    }

    if (tab === 'appTerms') {
        this.editApptermsJson[tab].push(...this.appTermsForm.value[tab]);
        this.editApptermsJson['appTermsMls'].push(...this.langRequest);
    } else {
        this.apptermsJson.appTermsLinks = this.apptermsJson.appTermsLinks.filter(
        link => !Array.isArray(link.childCode));
        this.editApptermsJson[tab].push(...this.appTermsForm.value[tab]);
    }

    this.getTableData();
    this.tableRefresh = true;
    this.createFormArr();
  }

  private getmultiAppLinks(data: any) {
    const selectedData = data[0];
    let multiDatalist: any = [];

    const filterAppLinksData = this.linkAppterm.filter(res => selectedData.childCode.includes(res.code) && (res.isActive === true || res.isActive === null));

    multiDatalist = filterAppLinksData.map(child => ({
      appTermName: selectedData.appTermName,
      code: selectedData.code,
      childAppTermName: child.value,
      childCode: child.code,
      childGroupName: selectedData.childGroupName,
      facilityId: null,
      groupName: selectedData.groupName,
      id: null,
      isActive: selectedData.isActive,
      sequence: selectedData.sequence
    }));

    this.apptermsLinkData.push(...multiDatalist);
    this.apptermsJson.appTermsLinks.push(...multiDatalist);
  }

  private updateDefaultFlagsNew(tab: string, formValue: any) {
    const changeDefaultData = this.apptermsJson[tab].filter(x => x.isDefault === true);
    this.editApptermsJson[tab].push(...changeDefaultData);

    const dataList = tab === 'appTermsFacilities' ? this.apptermsJson.appTermsFacilities : this.apptermsJson.appTerms;
    const codeKey = tab === 'appTermsFacilities' ? 'appTermsCode' : 'code';
    const selectedCode = formValue[codeKey];

    dataList.forEach(item => {
        item.isDefault = item[codeKey] === selectedCode;
    });
  }

  private hasGlobalFlag(items: any[]): boolean {
    return items.some(item => item.isGlobal === true || item.isGlobal === false);
  }

  private addLangRequest(tab: string, formValue: any) {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'be', name: 'Bengali' },
      { code: 'hi', name: 'Hindi' },
      { code: 'ta', name: 'Tamil' },
      { code: 'th', name: 'Thai' }
    ];

    this.langRequest = languages.map(lang => ({
      appTermsCode: formValue.code,
      facilityId: null,
      id: null,
      isActive: true,
      languageCode: lang.code,
      languageName: lang.name,
      name: formValue.value
    }));

    this.apptermsJson.appTermsMls.push(...this.langRequest);
  }
  onTabChanged(event) {
    if (this.expanded) {
      this.expanded = !this.expanded;
    }
    this.selectedTabIndex = event.index;
    this.linkedAppTerms.setValue(null)
    if (this.selectedTabIndex === 1) {
      this.createFormArr();
      this.getChangeFilter();
      this.updateBtn = false;
    }

    this.selectedTermCode2.setValue(null);
    this.selectedTermCode1.setValue(null);
    this.selectedGroupName.setValue(null);
    this.applyFilter();
    this.getTableData();
  }
  eventAction(event, tab) {
    if (event.key === "Delete") {
      this.handleDelete(event, tab);
    } else if (event.key === "Edit") {
      this.handleEdit(event, tab);
    } else if (event.key === "pagination") {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    }
  }

  private handleDelete(event, tab) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 1,
        formStatusEnable: true,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.hasOwnProperty("confirmButtonText") && result['confirmButtonText'] === "Yes") {
        if (tab === "appTerms") {
          this.processAppTermsDelete(event, tab);
        } else {
          this.processOtherDelete(event, tab);
        }
        this.getTableData();
      }
    });
  }

  private processAppTermsDelete(event, tab) {
    let appTermsCode = [];
    this.apptermsJson[tab] = this.apptermsJson[tab].filter((res) => {
      if (res.code === event['data']['code']) {
        appTermsCode = res.code;
        res.isActive = false;
      }
      return true;
    });

    const appDeleteData = this.apptermsJson[tab].filter(res => appTermsCode.includes(res.code));
    this.editApptermsJson[tab].push(...appDeleteData);
  }

  private processOtherDelete(event, tab) {
    let appTermsId = [];
    this.apptermsJson[tab] = this.apptermsJson[tab].filter((res) => {
      if (res.id === event['data']['id']) {
        appTermsId = res.id;
        res.isActive = false;
      }
      return true;
    });

    const appDeleteData = this.apptermsJson[tab].filter(res => res.id === appTermsId);
    this.editApptermsJson[tab].push(...appDeleteData);
  }

  private handleEdit(event, tab) {
    const i = this.selectedTabIndex;
    if (this.tablist[i] === 'appTermsLinks') {
      this.parentCode = event.data.code;
    }

    if (!this.expanded) {
      this.expanded = true;
    }

    if (event.data.hasOwnProperty('childGroupName')) {
      this.getApptermsFilterData(event.data['childGroupName'], 'linkAppterm',null, event.data);
    }

    const eventData = {
      ...event.data,
      isActive: event.data.isActive === "Active",
      isDefault: event.data.isDefault === "Yes",
      isGlobal: event.data.isGlobal === "Yes",
      languageCode: event.data.languageCode ? event.data.languageCode.toLowerCase() : null,
      childCode : [event.data.childCode]
    };

    this.language = this.languageData.map(obj => ({ ...obj, code: obj.code.toLowerCase() }));
    this.skipAppCodeValidation = true;
    this.appTermsForm.controls[tab]['controls'][0].patchValue(eventData);
    setTimeout(() => { this.skipAppCodeValidation = false; }, 0);
    this.updateBtn = true;
  }

  rowClick(event,tab){
    console.log(event);
    console.log(tab)
  }
  
  apptermCodeSelectionChange(event,tab,varName){
    this.appTermsForm.controls[tab]['controls'][0].get(varName).setValue(event.source.selected.viewValue);
    if (varName === 'appTermName') {
      this.appTermsForm.controls[tab]['controls'][0].get('childGroupName').setValue(null);
      this.appTermsForm.controls[tab]['controls'][0].get('childCode').setValue(null);
    }
  }

  onSelectedLinkApp(event, tab) {
    this.language = this.languageData;
    const filterData = this.apptermsJson[tab]?.filter(res => res.appTermsCode == event.value);
    if (filterData?.length) {
      const excludeCodes = filterData.map(item => item.languageCode.toUpperCase());
      const selectedData = this.languageData.filter(lang => !excludeCodes.includes(lang.code));
      this.language = selectedData.map(obj => {
            return {...obj,code: obj.code.toLowerCase()};
          });
    }
  }

  onSelectionChange(tab: any, index: number, event: any){
    let value = this.apptermsJson[tab].filter(res => res.code == event.value);
    if(value.length){
      this.appTermsForm.controls['appTermsFacilities']['controls'][index].patchValue(value[0]);
      this.appTermsForm.controls['appTermsFacilities']['controls'][index].get('appTermName').setValue(value[0].value.trim())
    }
  }
  saveAppterms() {
    this.onLoading = true;
    this.apptermsJson.appTerms = this.apptermsJson?.appTerms.map(item => ({...item, 
      isActive: item.isActive === 'Active'  ||  item.isActive === true,
      isDefault: item.isDefault === 'Yes' || item.isDefault === true,
      isGlobal: item.isGlobal === 'Yes' || item.isGlobal === true
    }));
    this.apptermsJson.appTermsLinks = this.apptermsJson.appTermsLinks.map(item => ({...item, 
      isActive: item.isActive === 'Active' || item.isActive === true,
      }));
    this.apptermsJson.appTermsMls = this.apptermsJson.appTermsMls.map(item => ({...item, 
      isActive: item.isActive === 'Active' || item.isActive === true,
      languageCode: item.languageCode ? item.languageCode.toUpperCase() : null,
    }));
    this.apptermsJson.appTermsFacilities = this.apptermsJson.appTermsFacilities.map(item => ({...item, 
      isActive: item.isActive === 'Active' || item.isActive === true,
      isInclude: item.isInclude === 'Yes' || item.isInclude === true,
      isDefault: item.isDefault === 'Yes' || item.isDefault === true,
    }));  
    const keys = [
      { key: 'appTerms', matchKey: 'code' },
      { key: 'appTermsFacilities', matchKey: 'id' },
      { key: 'appTermsLinks', matchKey: 'id' },
      { key: 'appTermsMls', matchKey: 'id' }
    ];
    keys.forEach(({ key, matchKey }) => {
      const updatedValues = this.editApptermsJson?.[key]?.map(item => item[matchKey]) || [];
      this.apptermsJson[key] = this.apptermsJson[key]?.filter(item =>
        item.id === null || updatedValues.includes(item[matchKey])
      );
    });
    this.commonService.createAppterms(this.apptermsJson).subscribe(res => {
      this.onLoading = false;
      let data = {};
      this.commonService.clearcache(data).subscribe(res => {})
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.onLoading = false;
      });
  }
  fixClick() {
    console.log('')
  }
}
