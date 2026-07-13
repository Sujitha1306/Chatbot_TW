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

import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonService, WorkflowService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ManagePwaInfoComponent, ManagePwaTaskComponent } from '../manage-pwa-task/manage-pwa-task.component';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { ManageFilterComponent } from '../manage-filter/manage-filter.component';

@Component({
  selector: 'app-pwa-task',
  templateUrl: './pwa-task.component.html',
  styleUrls: ['./pwa-task.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PwaTaskComponent implements OnInit, AfterViewInit {

  public heading: string
  public tabs = [{name: 'Task', code: 'RQT-TASK'}]
  selectedTab = 'RQT-TASK';
  today = new Date()
  taskData: any;
  pwaTaskData: any;
  totalTask = null;
   @ViewChild('searchInput') searchInput!: ElementRef;
  searchText = null;
  public pageSize = 50;
  showFilter = false;
  public activate_btn: any = [];
  statusList = [];
  contestList = [];
  pageStart = 0;
  status = null;
  context = null;
  myRequest = true;
  selectedDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
  departmentId = [];
  public parentFilter = [
    {
      id: 'department',
      value: 'Department',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment'],
      dependentFilter: ['my department'],
    },
    {
      id: 'my department',
      value: 'My Department',
      isNoneAll: false,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
      enableEmpty: false,
    },
    {
      id: 'status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'context',
      value: 'Context',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'task',
      value: 'Include',
      isAll: false,
      selectionType: 'multi',
      subFilters: [{ code: 'myRequest', value: 'Created by me' }],
      defaultSelected: ['myRequest']
    }
  ];
  constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe, private readonly bottomSheet: MatBottomSheet,
    public commonService: CommonService) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.commonService.getAppTermsLink('RQT-TASK', 'RequestStatus').subscribe(res => {
      this.statusList = res.results.filter(resFilter => !['RQ-OP', 'RQ-PLN', 'RQ-RAS'].includes(resFilter.code));
      const status = this.parentFilter.find(f => f.id === 'status');
      status.subFilters = this.statusList;
    })
    this.commonService.getAppTermsLink('RQT-TASK', 'PorterRequestType').subscribe(res => {
      this.contestList = res.results;
      const context = this.parentFilter.find(f => f.id === 'context');
      context.subFilters = this.contestList;
    })
    const myDepartmentFilter = this.parentFilter.find(filter => filter.id === 'my department');
    const departmentFilter = this.parentFilter.find(filter => filter.id === 'department');
    if (myDepartmentFilter) {
      const userId = localStorage.getItem(btoa('userId'));
      this.commonService.getUserDepartmentLink(userId).subscribe(res => {
        if (res.statusCode === 1 && Array.isArray(res.results) && res.results.length > 0) {
          const departmentFilter = this.parentFilter.find(filter => filter.id === 'my department');
          departmentFilter.subFilters = res.results.map(({ departmentId, departmentName }) => ({
            code: departmentId,
            value: departmentName
          }));
          if (this.departmentId != null && this.departmentId.length > 0) {
            departmentFilter.defaultSelected = this.departmentId;
          } else {
            departmentFilter.defaultSelected = departmentFilter?.subFilters.map(item => item.code);
            this.departmentId = departmentFilter?.defaultSelected.map(id => parseInt(id, 10));
          }
          this.getAllTask(this.searchText, this.pageStart, this.pageSize, this.status, this.context, this.selectedDate, this.myRequest, this.departmentId)
        }
      });
    }
    this.getAllTask(this.searchText, this.pageStart, this.pageSize, this.status, this.context, this.selectedDate, this.myRequest, this.departmentId)
    if (departmentFilter && this.activate_btn.includes('BT_TKALL')) {
      departmentFilter?.subFilters.push({ code: 'BT_TKALL', value: 'All' });
    }
  }

  ngAfterViewInit() {
    fromEvent(this.searchInput.nativeElement, 'keyup').pipe(
      map((event: any) => event.target.value),
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applySearch(searchTerm)
    });
  }

  applySearch(text){
    if(text !== ''){
      this.searchText = text
    } else {
      this.searchText = null;
    }
    this.getAllTask(this.searchText,this.pageStart,this.pageSize,this.status,this.context,this.selectedDate,this.myRequest,this.departmentId)
  }

  getTask(){
    let date = this.datepipe.transform(this.today, 'yyyy-MM-dd')
    this.workflowService.getAllTask(null, date, null, null,null, false, this.searchText, 'RQT-TASK', null,null, 0, this.pageSize).subscribe(res => {
      this.pwaTaskData = res.results;
      this.totalTask = res.totalRecords;
    })
  }

  getAllTask(name, pagestart, pagesize, status, context, date, myRequest, departmentIds) {
    this.workflowService.getAllTask(null, date, context, status, departmentIds, myRequest, name, 'RQT-TASK', null,null, pagestart, pagesize).subscribe(res => {
      this.pwaTaskData = res.results;
      this.totalTask = res.totalRecords;
    })
  }

  onTabSwitch(code){
    this.selectedTab = code
  }

  moreData(){
    this.pageSize += 20;
     this.getAllTask(this.searchText,this.pageStart,this.pageSize,this.status,this.context,this.selectedDate,this.myRequest,this.departmentId)
  }

  openTaskBottomSheet(key, data?: any) {
    if (key === 'modify') {
      data['type'] = key;
      data['permissionTab'] = ['Task List'];
      data['requestedType'] = this.selectedTab;
      this.taskData = [data];
    } else {
      const data = { 'permissionTab': ['Task', 'Easy Pick'] };
      data['requestedType'] = 'RQT-TASK';
      this.taskData = [data];
    }
    const bottomSheetRef = this.bottomSheet.open(ManagePwaTaskComponent,
      { data: this.taskData, panelClass: 'custom-bottom-sheet' });
    bottomSheetRef.afterDismissed().subscribe((result) => {
       this.getAllTask(this.searchText, this.pageStart, this.pageSize, this.status, this.context, this.selectedDate, this.myRequest, this.departmentId);
    });
  }

  taskInfoBottomSheet(data) {
    data['requestedType'] = 'RQT-TASK';
    this.taskData = [data];
    const bottomSheetRef = this.bottomSheet.open(ManagePwaInfoComponent,
      { data: this.taskData, panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background'] });
    bottomSheetRef.afterDismissed().subscribe((result) => {
       this.getAllTask(this.searchText, this.pageStart, this.pageSize, this.status, this.context, this.selectedDate, this.myRequest, this.departmentId);
    });
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if(this.showFilter){
      this.parentFilter['showDateFilter'] = this.selectedDate;
        const bottomSheetRef = this.bottomSheet.open(ManageFilterComponent, {
        data: this.parentFilter,
        panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
      });
    
      bottomSheetRef.afterDismissed().subscribe(result => {
        if(result){
          this.onFiltersApplied(result);
        }
        this.showFilter = false;
      });
    }
  }

  onFiltersApplied(result) {
    this.showFilter = false;
    this.pageStart = 0;
    this.pageSize = 50;
    const context = result['context'] || [];
    const departmentFilter = result['department'] || [];
    const department = result['my department'] || [];
    const status = result['status'] || [];
    const mytask = result['task'] || [];
    const dateValue = result['selectedDate']
    this.status = status && status?.length > 0 ? status?.join(',') : null;
    if (context && context.length > 0 && !(context.length === 1 && context[0] == 'All')) {
      this.context = context.join(',');
    } else {
      this.context = null
    }
    if (departmentFilter && departmentFilter[0] !== 'BT_TKALL') {
      this.departmentId = department.map(d => parseInt(d, 10)).join(',');
    } else {
      this.departmentId = null;
    }
    this.myRequest = mytask && mytask?.length > 0 ? true : null;
    this.selectedDate = dateValue
    this.getAllTask(this.searchText, this.pageStart, this.pageSize, this.status, this.context, this.selectedDate, this.myRequest, this.departmentId);
  }
  fixClick() {
    console.log('')
  }
}
