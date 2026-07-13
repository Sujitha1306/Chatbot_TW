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
import { DatePipe } from '@angular/common';
import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
  ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter,  MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../services/common.service';
import { WorkflowService } from '../../../services/workflow.service';
import {fromEvent } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { ConfigurationService } from '../../../services';

@Component({
  selector: 'tw-header-component',
  templateUrl: './tw-header.component.html',
  styleUrls: ['./tw-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TwHeaderComponent implements OnChanges {
  public rowClickId = null;
  public activate_btn: any = [];
  public enableAction = false;
  public worklistForm: FormGroup;
  public dateForm: FormGroup;
  @Input() component: any;
  @Input() locationId: any;
  @Input() selectDropdown2: any;
  @Input() specialityLoc: any;
  @Input() manageAction: any;
  @Input() selectedTab: any;
  @Input() selectedName: any;
  @Input() selectedDate: any;
  @Input() isEnroll: any;
  @Input() multiView: boolean;
  @Output() headerEventAction = new EventEmitter<any>();
  @Output() selectedTabAction = new EventEmitter<any>();
  public filterValue = null;

  constructor(private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public datepipe: DatePipe,
    public commonService: CommonService) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.selectedTab) {
      this.filterValue = null;
    }
    this.buildForm();
  }
  buildForm() {
    this.worklistForm = this.fb.group({
      defaultWorkList: [this.locationId ? this.locationId : 'All'],
      selectDropdown2: [this.selectDropdown2 ? this.selectDropdown2 : null],
    });
    this.dateForm = this.fb.group({
      fromDate: [this.selectedDate ? this.selectedDate : ''],
    });
  }
  headerEventTrigger(key, data, keyVal) {
    if (key === 'manageAction') {
      this.selectDropdown2 = null;
    }
    this.headerEventAction.emit({ key, data, keyVal });
  }
  selectedTabEvent(key) {
    this.selectedTabAction.emit(key);
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'tw-header-new-component',
  templateUrl: './tw-header-new.component.html',
  styleUrls: ['./tw-header.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class TwHeaderNewComponent implements OnChanges, AfterViewInit {
  public rowClickId = null;
  public activate_btn: any = [];
  public enableAction = false;
  public worklistForm: FormGroup;
  public searchControl = new FormControl('');
  public appteamsSearch : any;
  appteamsSearchType: any;
  public dateForm: FormGroup;
  public today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  @Input() component: any;
  @Input() permission:any;
  @Input() locationId: any;
  @Input() typeId: any;
  @Input() selectDropdown: any;
  @Input() selectFilter: any;
  @Input() selectTypeFilter: any;
  @Input() rowTypeFilter: any;
  @Input() rowFilter: any;
  @Input() manageAction: any;
  @Input() selectedView: any;
  @Input() selectedName: any;
  @Input() dateFilter: any;
  @Input() toDateFilter: any;
  @Input() multiView: boolean;
  @Input() floorDetails: any;
  @Input() excel: boolean;
  @Input() alertCount: any;
  @Input() iotAlertCount: any;
  @Input() optAll: boolean;
  @Input() view = null;
  @Input() startDateFilter: any = null;
  @Input() endDateFilter: any = null;
  @Input() type: any;
  @Input() groupFilter: any;
  @Input() isDateClear: boolean;
  @Input() multiDateEnable: boolean;
  @Input() multiYear: boolean;
  @Input() info: any;
  @Input() dateType: boolean;
  @Input() enableCloseButton :boolean = false;
  @Input() multiClickFilterActive: boolean;
  @Output() headerEventAction = new EventEmitter<any>();
  @Output() selectedViewAction = new EventEmitter<any>();
  public filterOption: any;
  public filterTypeOption: any;
  public filterValue = null;
  public isClicked: boolean = false;
  public isDateType: boolean = false;
  public isDefault: boolean = true;
  public infoClicked: Boolean = false;
  public All: boolean = true;
  public searchTerm: { [key: string]: string } = {};
  public groupFilterValue = new FormControl();
  @ViewChild('count') public elementRef: ElementRef;
  @ViewChild('filter') filterRef: ElementRef;
  permissionList: any = [];
  buttonExist = false;
  checkPermission: any;
  clickedView = 'table';
  dateMode = 'single';
  rowFilteredList = [];
  rowFilteredTypeList = [];
  currentDate = new Date();
  customerName: string;
  @ViewChild('allLoc') private readonly allLoc: MatOption;
  selectedValue: any[] = [];
  yearList: any[] = [];
  selectAllActive: { [key: number]: boolean } = {};
  isOption: boolean = false;
  applybtnTrigger: boolean = false;
  filterType = null;
  filterHit: boolean = false;
  shouldShowSpan: any;
  isMultiDate = false;
  isYearly = false;
  selectedFilterDetail = [];
  now = new Date();
  min = this.now.setMonth(this.now.getMonth() - 1);
  minDate = this.datepipe.transform(this.min, 'yyyy-MM-dd');
  public departmentId = parseInt(localStorage.getItem('ZGVwYXJ0bWVudElk'))

  constructor(private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public datepipe: DatePipe,private readonly renderer: Renderer2,
    public commonService: CommonService, public configurationService : ConfigurationService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.generateYearList();
    this.renderer.listen('window', 'click', ( e: Event) => {
      if (this.elementRef && e.target === this.elementRef.nativeElement) {
          this.infoClicked = !this.infoClicked;
        } else {
          this.infoClicked = false;
        }
    });
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn";
    }
    if (Number.isNaN(this.departmentId)) {
      this.departmentId = null
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dateType) {
      this.isDateType = this.dateType;
    } else {
      this.isDateType = this.dateType;
    }
    if (this.activate_btn) {
      if(this.manageAction !== null) {
        for(let i = 0; i < this.manageAction?.length ; i++) {
          this.checkPermission = this.activate_btn.filter(x => this.manageAction[i].permission !== undefined && this.manageAction[i].permission.indexOf(x) > -1);
          if (this.checkPermission && this.checkPermission.length === 0) {
            this.manageAction = this.manageAction.filter(x => this.manageAction[i].permission !== x.permission || x.permission === undefined);
          }
        }
      }
      this.permissionList = this.activate_btn.filter(x => this.permission !== null && this.permission.indexOf(x) > -1);
      if (this.permissionList.length > 0) {
        this.buttonExist = true;
      } else {
        this.buttonExist = false;
      }
    }
    if(changes.selectedView || changes.locationId) {
      this.filterValue = null;
      if(changes.selectedView) {
        this.selectedView = null;
        this.clickedView = changes.selectedView.currentValue
        this.selectedView = changes.selectedView.currentValue
      }
    }
    // if(changes.selectedView && this.component === 'daycare' && changes.selectedView.currentValue === 'card') {
    //   this.clickedView = 'card';
    // }
    if(changes.rowFilter) {
      if(this.rowFilter !== null && this.rowFilter !== undefined) {
        this.rowFilteredList = this.rowFilter.slice();
      }
    }
    if(changes.rowTypeFilter) {
      if(this.rowTypeFilter !== null && this.rowTypeFilter !== undefined) {
        this.rowFilteredTypeList = this.rowTypeFilter.slice();
      }
    }
    this.buildForm();
    if (this.dateMode === 'year') {
      const currentYear = new Date(this.dateFilter).getFullYear();
      this.dateForm.get('fromDate').setValue(currentYear);
    }
    if (changes.groupFilter) {
      this.initializeSelectedValues();
    }
    console.log(this.optAll)
    if(this.optAll === false){
      this.All = this.optAll;
    }
  }
  buildForm() {
    this.worklistForm = this.fb.group({
      filterList: [this.selectFilter && this.isDefault ? this.selectFilter[0].id: this.filterOption],
      filterTypeList: [this.selectTypeFilter && this.isDefault ? this.selectTypeFilter[0].id: this.filterTypeOption],
      // defaultWorkList: [this.locationId ? this.locationId : this.rowFilter[0].id],
      defaultWorkList: [this.locationId ? this.locationId : this.component === 'infant' ? ['All'] : null],
      defaultWorkListType: [this.typeId ? this.typeId : null],
      selectDropdown: [this.selectDropdown ? this.selectDropdown : this.component === 'porter' || this.component === 'task' || this.component === 'hazmat-training-list'
      || this.component === 'ambulance' || this.component === 'broker' || this.component === 'server' ? (this.manageAction !== null && this.manageAction.length !== 0 ? this.manageAction[0].id : null) : null],
    });
    this.dateForm = this.fb.group({
      fromDate: [this.dateFilter ? this.dateFilter : ''],
      toDate: [this.toDateFilter ? this.toDateFilter : ''],
      startDate: [this.startDateFilter ? this.startDateFilter : ''],
      endDate: [this.endDateFilter ? this.endDateFilter : ''],
    });
  }
  appteamsFilter(data: string): void {
    this.appteamsSearch = data;
    const filterValue = this.appteamsSearch.toLowerCase();
    if (this.component === 'reader' ||
      this.component === 'agent-management' ||
      this.component === 'asset-management' ||
      this.component === 'task' ||
      this.component === 'hazmat-training-list' ||
      this.component === 'student') {
      this.rowFilteredList = this.rowFilter.filter(item =>
        item.value.toLowerCase().includes(filterValue) ||
        item.code.toLowerCase().includes(filterValue)
      );
    } else {
      this.rowFilteredList = this.rowFilter.filter(item =>
        item.name && item.name.toLowerCase().includes(filterValue)
      );
    }
  }
  appteamsTypeFilter(data: string) {
    this.appteamsSearchType = data.trim();
    let filterTypeValue = this.appteamsSearchType.toLowerCase()
    this.rowFilteredTypeList = this.rowTypeFilter.filter(item =>
      item.code.toLowerCase().includes(filterTypeValue) || item.value.includes(filterTypeValue)
    );
  }
  ngAfterViewInit() {
    // server-side search
    if(this.filterRef !== undefined){
    fromEvent(this.filterRef.nativeElement,'keyup').pipe(
        filter(Boolean),
        debounceTime(300),
        distinctUntilChanged(),
        tap((event:KeyboardEvent) => {
          console.log(event)
          console.log(this.filterRef.nativeElement.value)
          this.headerEventAction.emit({key: 'applyFilter', data: this.filterRef.nativeElement.value, keyVal: ''});
        })
    ).subscribe();
    }
  }
  headerEventTrigger(key, data, keyVal) {
    if (key === 'manageAction') {
      this.selectDropdown = null;
    } else if (key === 'manageFilter') {
        if (Array.isArray(this.selectFilter) && this.selectFilter.length > 0) {
            if (this.selectFilter[0] && typeof this.selectFilter[0] === 'object') {
                if (data != this.selectFilter[0].id) {
                    this.isDefault = false;
                }}
        }else if(data != this.selectFilter[0].id){
          this.isDefault = false;
      }
      if(this.selectTypeFilter != null || this.selectTypeFilter != undefined){
      if(data != this.selectTypeFilter[0].id){
        this.isDefault = false;
      }}
      this.filterOption = data;
      this.filterTypeOption = data;
      this.locationId = 'All';
      this.typeId = 'All';
      if(this.component !='asset-management'){
      this.headerEventAction.emit({ key:'refreshPage', data:'', keyVal:'' });
      }
    } else if (key === 'yearFilter') {
      setTimeout(() => { this.dateForm.controls['fromDate'].setValue(data) }, 100);
    }
    if(key != 'applyFilter') {
      this.headerEventAction.emit({ key, data, keyVal });
    }
    if(key === 'groupFilter'){
      this.applybtnTrigger = true
    }
    this.showFilterLabels();
  }

  showFilterLabels(){
    let result = this.groupFilter?.filter(item => item.showLabel);
    let temp = {};
    this.selectedFilterDetail = [];
    for(let i=0;i<result?.length;i++){
      temp['name'] = result[i]['id'];
      let selectedFilterVal = this.selectedValue.filter(item => item.id == result[i]['id']);

      if (selectedFilterVal.length) {
        const codeToValueMap = new Map(result[i]['subFilters'].map(item => [item.code, item.value]));
        const resultList = selectedFilterVal
          .map(f => codeToValueMap.get(f.data))
          .filter(Boolean); // filters out undefined if any code is not found
        // const resultFilter = resultList.join(', ');
        if (resultList.length){
          let resultFilter = ""
          if (resultList.length <= 2) {
            resultFilter = resultList.join(', ');
          } else {
            const firstTwo = resultList.slice(0, 2).join(', ');
            const remainingCount = resultList.length - 2;
            resultFilter = `${firstTwo} +${remainingCount}`;
          }

          this.selectedFilterDetail.push({
            'name' : result[i]['id'].charAt(0).toUpperCase() + result[i]['id'].slice(1),
            'value' : resultFilter
          })
        }
        
      }
    }
  }
  selectedViewEvent(key) {
    this.isClicked = !this.isClicked;
    this.clickedView = key;
    this.selectedViewAction.emit(key);
  }
  changeDate(dateType) {
    const currentFromDate = new Date(this.dateForm.controls['fromDate'].value);
    if (dateType== 'previous') {
      this.currentDate = new Date(currentFromDate.setDate(currentFromDate.getDate() - 1));
    } else if (dateType== 'next') {
      this.currentDate = new Date(currentFromDate.setDate(currentFromDate.getDate() + 1));
    }
    this.dateForm.controls['fromDate'].setValue(this.currentDate);
    let dateValue = this.dateForm.controls['fromDate'].value
    this.headerEventAction.emit({ "key": 'dateFilter', "data" : moment(dateValue), "keyVal" : "" });
  }

  changeToDate(dateType) {
    const currentToDate = new Date(this.dateForm.controls['toDate'].value);
    if (dateType== 'previous') {
      this.currentDate = new Date(currentToDate.setDate(currentToDate.getDate() - 1));
    } else if (dateType== 'next') {
      this.currentDate = new Date(currentToDate.setDate(currentToDate.getDate() + 1));
    }
    this.dateForm.controls['toDate'].setValue(this.currentDate);
    let dateValue = this.dateForm.controls['toDate'].value
    this.headerEventAction.emit({ "key": 'toDateFilter', "data" : moment(dateValue), "keyVal" : "" });
  }
  openedChange(isOpended) {
    if(!isOpended) {
      this.headerEventTrigger('manageWorklist', this.worklistForm.get('defaultWorkList').value, '')
    }
  }
  locationMulti(value) {
    if (value === 'All') {
      if (this.allLoc.selected) {
        this.worklistForm.controls['defaultWorkList']
          .patchValue([...this.rowFilteredList.map(item => item.id), 'All']);
      } else {
        this.worklistForm.controls['defaultWorkList'].patchValue([]);
      }
    } else {
      if (this.allLoc.selected) {
        this.allLoc.deselect();
        return false;
      }
      // if(this.worklistForm.controls['defaultWorkList'].value.length === this.rowFilteredList?.length){
      //   this.allLoc.select();
      // }
    }
  }

  initializeSelectedValues() {
    setTimeout(() => {
      this.selectedValue = [];
      if (Array.isArray(this.groupFilter) && this.groupFilter.length > 0) {
        this.groupFilter.forEach(filter => {
          const selectedArr = Array.isArray(filter.defaultSelected)? filter.defaultSelected: filter.defaultSelected? [filter.defaultSelected]: [];
          if (selectedArr.includes('All') && filter.isNoneAll) {
            this.selectedValue.push({ id: filter.id, data: 'All' });
          }
  
          selectedArr.forEach(selectedCode => {
              const selectedSubFilter = filter.subFilters?.find(s => s.code === selectedCode);
              if (selectedSubFilter) {
                this.selectedValue.push({ id: filter.id, data: selectedSubFilter.code });
              }
            });
        });
      }
        // during page switch check for subfilter in asset management
        if (this.selectedValue?.some(item => (item.data === 'WD_AMAL')||(item.data ==='myAsset')|| item.data ==='BT_TKALL')) {
          this.selectedValue = this.selectedValue.filter(item => item.id !== 'my department');
          this.selectedValue = this.selectedValue.filter(item => item.id !== 'ownership');
          this.isOption = true;
        }
        if(this.selectedValue?.some(check => check.id === 'taskType' && check.data === 'myDepartment')){
          this.selectedValue = this.selectedValue.filter(item => item.id !== 'itemDepartment');
          if (this.departmentId) {
            let myDepartment = {
              id: 'itemDepartment',
              data: this.departmentId
            }
            this.selectedValue = [...this.selectedValue, myDepartment];
          }
          this.isOption = true;
        }
        this.showFilterLabels();
      this.filterHit = true;
      this.updateShouldShowSpan();
    }, 2000);
  }

  
  updateShouldShowSpan() {
    if (!this.selectedValue || this.selectedValue.length === 0) {
        this.shouldShowSpan = false;
        return;
    }
    let allSelected = this.groupFilter.every(group => {
        let selectedItems = this.selectedValue
            .filter(filt => filt.id === group.id)
            .map(x => x.data);
        let allSubFilterCodes = group.subFilters.map(sub => sub.code);
        return selectedItems.includes("All") || selectedItems.length === allSubFilterCodes.length;
    });
    this.shouldShowSpan = !allSelected;
  }
  

  searchSubFilters(filterId, value) {
    this.filterType = filterId;
    this.searchTerm[filterId] = value;
  }

  selectedFilter(event, value, isLoadSubFilters) {
    let filterInfo = this.groupFilter.find(f => f.id === event);
    if (!filterInfo) {
      return;
    }
    if(filterInfo?.disable){
      return;
    }
    if (filterInfo.selectionType === 'single') {
      this.selectedValue = this.selectedValue.filter(val => val.id !== event);
    }

    const index = this.selectedValue.findIndex(val => val.id === event && val.data === value);
    const filterData = this.selectedValue.filter(val => val.id === event);
    if (index === -1) {
      this.selectedValue.push({ id: event, data: value });
    } else {
      if (filterInfo.hasOwnProperty('enableEmpty') && filterInfo.enableEmpty === false && filterData.length == 1) {
        // console.log('should selected atleast one')
      } else {
        this.selectedValue.splice(index, 1);
      }
    }

    // if(event === 'asset' && (value === 'WD_AMAL' || value === 'myAsset')){
    //   // let remove = ['owned', 'assigned']
    //   // this.selectedValue = this.selectedValue.filter(item => !(item.id === 'my department' && remove.includes(item.data)));
    //   // this.isOption = true;
    //   // during filter change in asset management make subfilter null
    //   // let deptFilter = this.selectedValue.filter(val => val.id == 'my department');
    //   // if(deptFilter.length === 0) {
    //   //   filterInfo.defaultSelected = filterInfo.subFilters.map(item => item.code);
    //   //  }
    //   //  let ownershipFilter  = this.selectedValue.filter(val => val.id == 'ownership');
    //   //  if(ownershipFilter.length === 0){
    //   //   filterInfo.defaultSelected = filterInfo.subFilters.map(item => item.code);
    //   //  }
    //   this.isOption = true;
    // }else if(value === 'myDepartment' && event ==='asset') {
    //    filterInfo = this.groupFilter.find(f => f.id === 'my department');
    //    let deptFilter = this.selectedValue.filter(val => val.id === 'my department');
    //    if(deptFilter.length === 0 && filterInfo) {
    //     const deptCodes = filterInfo.subFilters.map(item => item.code);
    //     for (let code of deptCodes) {
    //       this.selectedValue = [...this.selectedValue, { id: 'my department', data: code }];
    //     }
    //    }
    //   let ownershipInfo = this.groupFilter.find(f => f.id === 'ownership');
    //   const existingOwnership = this.selectedValue.filter(val => val.id === 'ownership');
    //   if (existingOwnership.length === 0 && deptFilter.length === 0 && ownershipInfo) {
    //     const ownershipCodes = ownershipInfo.subFilters.map(item => item.code);
    //     for (let code of ownershipCodes) {
    //       this.selectedValue = [...this.selectedValue, { id: 'ownership', data: code }];
    //     }
    //   } 
    //   this.isOption = false;
    // }else{
    //   this.isOption = false;
    // }

    // Managing isOption flag and dependentFilter subfilters selection based on event and value
    if((event === 'asset' && (value === 'WD_AMAL' || value === 'myAsset'))|| (event === 'department' && value === 'BT_TKALL')){
    // isOption set to true for disabling dependentFilter subfilters
      this.isOption = true;
    } else if ((event === 'asset' && value === 'myDepartment') ||(event === 'department' && value === 'myDepartment') || event === 'assetType' || event === 'context' || event === 'status' || event === 'task' || event ==='routine' || event ==='assetCategory') {
    // check dependentFilter key exists, loop through all keys in dependentFilter and check for  any selected filtervalues in subfilters and if not select all values in subfilters.
      if (filterInfo && filterInfo?.dependentFilter?.length > 0 && !isLoadSubFilters) {
        for (const filterId of filterInfo.dependentFilter) {
          const filterInfoItem = this.groupFilter.find(f => f.id === filterId);
          const isFilterInUse = this.selectedValue.some(val => val.id === filterId);
          if (!isFilterInUse && filterInfoItem) {
            const codes = filterInfoItem.subFilters.map(item => item.code);
            const newSelections = codes.map(code => ({id: filterId,data: code}));
            this.selectedValue = [...this.selectedValue, ...newSelections];
          }
        }
        this.isOption = false;
      }else if(isLoadSubFilters && event === 'context'){
        this.loadDependentSubFilters(event, value);
      }
      //DependentKey based Updating subfilter values
    }else if(isLoadSubFilters &&(event ==='ownedDepartment' || event ==='assignedDepartment' ||event ==='my department' || event === 'context')){
      this.loadDependentSubFilters(event, value);
    } else if(event === 'taskType') {
      if(value === 'myDepartment') {
        this.isOption = true
        for (const filterId of filterInfo.dependentFilter) {
          const filterInfoItem = this.groupFilter.find(f => f.id === filterId);
          filterInfoItem.defaultSelected = [this.departmentId]
          this.selectedValue = this.selectedValue.filter(item => item.id !== 'itemDepartment');
          if(this.departmentId){
            let myDepartment = {
              id: 'itemDepartment',
              data: this.departmentId
            }
            this.selectedValue = [...this.selectedValue, myDepartment];
          }
        }
      } else {
        for (const filterId of filterInfo.dependentFilter) {
          const filterInfoItem = this.groupFilter.find(f => f.id === filterId);
          const isFilterInUse = this.selectedValue.some(val => val.id === filterId);
          if (isFilterInUse && filterInfoItem) {
            const codes = filterInfoItem.subFilters.map(item => item.code);
            const newSelections = codes.map(code => ({ id: filterId, data: code }));
            this.selectedValue = [...this.selectedValue, ...newSelections];
          }
        }
        this.isOption = false;
      }
    } else{
        // this.isOption = false; commented due to enabling department when change in myjobfilter 
    }

    this.selectAllActive[event] = this.checkIfAllSelected(event);
  }

  selectAllFilters(filterId) {
    const filter = this.groupFilter.find(f => f.id === filterId);
    if(filter?.disable){
      return;
    }

    if (filter) {
      if (!this.selectAllActive[filterId]) {
        filter.subFilters.forEach(sub => {
          const isAlreadySelected = this.selectedValue.some(val => val.id === filterId && val.data === sub.code);
          if (!isAlreadySelected) {
            this.selectedValue.push({ id: filterId, data: sub.code });
          }
        });
      } else {
        this.selectedValue = this.selectedValue.filter(val => val.id !== filterId);
      }
      this.selectAllActive[filterId] = !this.selectAllActive[filterId];
    }
  }

  checkIfAllSelected(filterId: number): boolean {
    const filter = this.groupFilter.find(f => f.id === filterId);
    if (filter) {
      return filter.subFilters.every(sub => this.selectedValue.some(val => val.id === filterId && val.data === sub.code));
    }
    return false;
  }

  isSelected(event: number, value: string): boolean {
    return this.selectedValue.some(val => val.id === event && val.data === value);
  }

  isAllSelected(filterId: number): boolean {
    return this.selectAllActive[filterId] || this.checkIfAllSelected(filterId);
  }

  filterSubFilters(filterId: string) {
    const filter = this.groupFilter.find(f => f.id === filterId);
    if (!filter) {
      return [];
    }
    
    const searchTerm = this.searchTerm[filterId]?.toLowerCase() || '';
    return filter.subFilters.filter(sub => sub.value?.toLowerCase().includes(searchTerm));
  }

  onMenuClosed(){
    if(!this.applybtnTrigger){
      this.headerEventTrigger('groupFilter', this.selectedValue, '');
    }
    this.applybtnTrigger = false;
    this.groupFilterValue.setValue(null);
    this.searchSubFilters(this.filterType ,null)
    this.filterType = null;
    this.updateShouldShowSpan();
  }
  fixClick() {
    console.log('')
  }
  // Load dependent filters based on parent filter selection
  loadDependentSubFilters(parentId: string, parentValues: any) {
    const parentFilter = this.groupFilter?.find(f => f?.id === parentId);
    if (!parentFilter?.dependentFilter?.length) return;
    // Flag to track if entityform API called
    let entityAssociationTriggered = false;

    parentFilter.dependentFilter.forEach(depId => {
      // For each dependent filter, fetch subFilters based on all selected parent values
      if (depId === 'ownedUser' || depId === 'assignedUser') {
        const departmentIds = parentValues?.length >1 ? parentValues?.join(',') : parentValues; //If multiselect pass keys as comma separated else single id
        this.configurationService.getOwnerAssignedUserList(departmentIds, 'true').subscribe(res => {
          const subFilters = res?.results?.map(u => ({ code: u?.userId, value: u?.userName }));
          this.updateDependentSubFilters(depId, subFilters);
        });
      }else if(depId ==='assetType' || depId === 'assetCategory') {
        // for Multiple Departments based entityAssociation loading
        let departmentIds;
        if(!entityAssociationTriggered && !this.selectedValue.some(val => val.id === 'my department' && val.data === parentId)) {
          entityAssociationTriggered = true;  // Mark API call done
          const myDept = this.selectedValue.filter(v => v.id === 'my department');
          departmentIds = myDept?.map(f => f.data).join(',') || null;
          this.configurationService.getEntityform(departmentIds, 'department', 'Filter').subscribe(res => {
            const results = res?.results || [];
            // Update assetType filters if needed
            if (parentFilter.dependentFilter.includes('assetType')) {
              const assetTypeFilters = results.filter(u => u?.identifyingType === 'AssetType').map(u => ({ code: u?.identifyingValue, value: u?.identifyingValueName }));
              this.updateDependentSubFilters('assetType', assetTypeFilters);
            }

            // Update assetCategory filters if needed
            if (parentFilter.dependentFilter.includes('assetCategory')) {
              const assetCategoryFilters = results.filter(u => u?.identifyingType === 'AssetCategory').map(u => ({ code: u?.identifyingValue, value: u?.identifyingValueName }));
              this.updateDependentSubFilters('assetCategory', assetCategoryFilters);
            }
          });
        }
      }else if(depId ==='category'){
        if(parentValues !='All'){
          this.commonService.getAppTermsLink(parentValues, 'ActivityCategory').subscribe(res => {
            const subFilters = res.results.map(item => ({code: item.code,value: item.value}));
            this.updateDependentSubFilters(depId, subFilters);
          });
        } else {
          const subFilters =[];
          this.updateDependentSubFilters(depId,subFilters);
        }
      }
    });
  }

  // Update the child subfilters based on selected Parent value
  updateDependentSubFilters(filterId, subFilters: { code; value }[]) {
    const filter = this.groupFilter?.find(f => f?.id === filterId);
    if (!filter) return;
    filter.subFilters = subFilters;
    const validCodes = subFilters?.map(sf => sf?.code);
    this.selectedValue = this.selectedValue?.filter(
      v => v?.id !== filterId || validCodes?.includes(v?.data)
    );

    this.selectAllActive[filterId] = this.checkIfAllSelected(filterId);
    this.showFilterLabels();
    this.updateShouldShowSpan();
  }
  closeGeofence(){
     this.headerEventAction.emit({Key:'closeGeofence',data:''})
  }

  getCalendarIcon() {
    if (this.isYearly) return '../../../../../assets/icons/calendar-years.png';
    if (this.isMultiDate) return '../../../../../assets/icons/calendar-to.svg';
    return '../../../../../assets/icons/calendar-day.svg';
  }

  getTooltipText() {
    if (this.isYearly) return 'Yearly View';
    if (this.isMultiDate) return 'Multi date';
    return 'Single date';
  }

  toggleDateMode(mode?: string, select?: any) {
    
    if (select) {
      select.close();
    }

    const currentYear = new Date().getFullYear();
    this.dateMode = mode;
    if (mode === 'single') {
      this.isYearly = false;
      this.isMultiDate = false;
      this.headerEventTrigger('multiDate', true, '');
      return;
    }

    if (mode === 'multi') {
      this.isMultiDate = true;
      this.isYearly = false;
      this.headerEventTrigger('multiDate', false, '');
      return;
    }

    if (mode === 'year') {
      this.isYearly = true;
      this.isMultiDate = false;
      setTimeout(() => {
        this.dateForm.get('fromDate').setValue(currentYear);
      }, 400);
      this.headerEventTrigger('yearFilter', currentYear, '');
      return;
    }
  }

  generateYearList() {
    const currentYear = new Date().getFullYear();
    const futureLimit = currentYear + 2;
    const startYear = 2024;
    this.yearList = [];
    for (let i = futureLimit; i >= startYear; i--) {
      this.yearList.push(i);
    }
  }
}
