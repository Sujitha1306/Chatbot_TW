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
import { Component, OnInit, ViewChild, Inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfigurationService, CommonService } from '../../../shared';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./resource.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateResourceComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public parentMenuSearch = new FormControl('');
  public pageListSearch = new FormControl('');
  public matcher = new ErrorStateMatcherService();
  public resourceForm: FormGroup;
  public permissionForm: FormGroup;
  public parentMenuList = [];
  public sequenceList = [];
  public pageList = [];
  public resourceList = [];
  public pageOptions: any[];
  public selectedType = null;
  public linkUrlLike = window.location.pathname;
  public dataSource: any=[];
  public selectedData = null;
  displayedData = [
    {'colName': 'id', 'title': 'Id', 'dataName': 'id'},
    {'colName': 'type', 'title': 'Type', 'dataName': 'type'},
    {'colName': 'page', 'title': 'Page', 'dataName': 'page'},
    {'colName': 'name', 'title': 'Name', 'dataName': 'name'},
    {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
  ];
  displayedColumns = this.displayedData.map(res => res.colName);
  previousResource: any = [];
  previousPermission: any = [];
  selectedDatasource: any = [];
  
  constructor(public form: FormBuilder, public toastr: AppToastService,
    public thisDialogRef: MatDialogRef<CreateResourceComponent>,
    public configurationService: ConfigurationService, public commonService : CommonService,
    @Inject(MAT_DIALOG_DATA) public metaData: any ) {
      this.selectedData = metaData['selectedData'];
      if (metaData.type === 'permission' && this.selectedData) {
        metaData.type = 'resource';
        this.selectedData['id'] = this.selectedData['resourceId'];
      }
      this.selectedType = this.selectedData ? this.selectedData.resourceTypeId : null;
      if (metaData.type === 'permission') {
        this.selectedType = 'Role';
        this.resourceList = metaData.list.resource;
      }
  }
  ngOnInit() {
    this.buildForm();
    this.pageList = this.metaData.list.resource.map(item => item.page).filter((value, index, self) => 
                      (self.indexOf(value) === index && value != null));

    if (this.metaData.type === 'resource') {
      this.displayedColumns = ['id', 'type', 'name', 'status'];
      this.filterMenu();
      this.getpageSearchData();
      this.pageOptions = this.pageList;
    } else  {
      this.getMappingData();
    }
  }

  public getSearchControl(value, key) {
    if (key === 'parentmenu') {
      this.parentMenuSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.parentMenuList = value?.filter(obj =>
          obj.name.toLowerCase().includes(lower)
        );
      });
    } else if (key === 'pagesearch') {
      this.pageListSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(text => {
        const lower = text?.toLowerCase();
        this.pageOptions = this.pageList.filter(item =>
          item.toLowerCase().includes(lower)
        );
      });
    }
  }

  public getpageSearchData() {
    const pageListInfo = this.pageList;
    this.pageOptions = pageListInfo;
    this.getSearchControl(pageListInfo, 'pagesearch');
  }

  public filterMenu() {
    const parentmenuInfo = this.metaData['list']['resource'].filter(res => res.resourceTypeId === 'RST-MN' && res.status === true);
    this.parentMenuList = parentmenuInfo;
    this.getSearchControl(parentmenuInfo, 'parentmenu');
    this.sequenceList = this.metaData['list']['resource'].filter(res => res.resourceTypeId === 'RST-MN' &&  res.parentId === null);
    const parentId = this.resourceForm.controls.parentId.value === 'null' ? null : this.resourceForm.controls.parentId.value;
    if (parentId) {
      this.sequenceList = this.metaData['list']['resource'].filter(res => res.resourceTypeId === 'RST-MN' &&  res.parentId === parentId);
    }
    // if (this.resourceForm.controls.resourceTypeId.value === 'RST-MN' &&
    //     (this.resourceForm.controls.page.value !== null || this.resourceForm.controls.page.value !== '')) {
    //   const parentFilter = this.parentMenuList.filter(res => res.page === this.resourceForm.controls.page.value);
      if (this.parentMenuList.length) {
        this.parentMenuList = this.parentMenuList;
        this.getSearchControl(this.parentMenuList, 'parentmenu');
      }
    // }
    if (this.selectedData) {
      const filterData = this.metaData.list.permission.filter(res => res.resourceId === this.selectedData.id);
      for (let i in filterData) {
        this.previousPermission.push({
          'id' : filterData[i]['roleId'] == null ? filterData[i]['loginId'] : filterData[i]['roleId'],
          'name' : null,
          'type' : filterData[i]['roleId'] == null ? 'user' : 'role',
          'status' : 'exist'});
      }
      let userList = this.previousPermission.filter(res => res.type === 'user').map(value => value.id);
      let roleList = this.previousPermission.filter(res => res.type === 'role').map(value => value.id);
      this.resourceForm.controls.role.setValue(roleList);
      this.resourceForm.controls.user.setValue(userList);
      this.getPermissionData();
    }
  }
  public buildForm() {
    if (this.metaData.type === 'resource') {
      this.resourceForm = this.form.group({
        resourceTypeId  : [this.selectedData?.resourceTypeId ?? 'RST-BT'],
        target          : [this.selectedData?.target ?? 'web'],
        page            : [this.selectedData?.page ?? null],
        code            : [this.selectedData?.code  ?? 'BT_', [Validators.required]],
        name            : [this.selectedData?.name ?? null, [Validators.required]],
        description     : [this.selectedData?.description ?? null],
        parentId        : [ this.selectedData?.parentId ?? 'null'],
        sequence        : [this.selectedData?.sequence ?? null],
        iconName        : [this.selectedData?.iconName ?? null],
        link            : [this.selectedData?.link ?? null],
        checkUrl        : [this.selectedData?.checkUrl ?? false],
        category        : [this.selectedData?.category ?? null],
        subCategory     : [this.selectedData?.subCategory ?? null],
        version         : [this.selectedData?.version ?? null],
        status          : [this.selectedData?.status ?? true],
        permitAll       : [this.selectedData?.permitAll ?? false],
        role            : [[]],
        user            : [[]]
      });
    } else {
      this.permissionForm = this.form.group ( {
        type : ['Role'],
        id : [null, [Validators.required]],
        resourceType : [[]],
        page : [[]],
        resources : [[]]
      });
    }
  }
  
  getMappingData() {
    this.selectedDatasource = []
    const selectedData = this.permissionForm.controls.resources.value;
    if (this.permissionForm.controls.id.value !== null) {
      const addList = selectedData.filter( e => !this.previousPermission.includes(e));
      const existList = this.previousPermission.filter(e => selectedData.includes(e));
      const deletedList = this.previousPermission.filter(e => !selectedData.includes(e));
      
      for (let i in addList) {
        const val = this.resourceList.filter(res => res.id === addList[i]);
        this.selectedDatasource.push({'id' : val[0].id, 'type' : val[0].resourceTypeName,
        'page' : val[0].page, 'name' : val[0].name, 'status' : 'new'});
      }
      for (let i in existList) {
        const val = this.resourceList.filter(res => res.id === existList[i]);
        this.selectedDatasource.push({'id' : val[0].id, 'type' : val[0].resourceTypeName,
        'page' : val[0].page, 'name' : val[0].name, 'status' : 'exist'});
      }
      for (let i in deletedList) {
        const val = this.resourceList.filter(res => res.id === deletedList[i]);
        this.selectedDatasource.push({'id' : val[0].id, 'type' : val[0].resourceTypeName,
        'page' : val[0].page, 'name' : val[0].name, 'status' : 'deleted'});
      }
      
      this.dataSource = this.selectedDatasource;
      this.dataSource.sort = this.sort;
    }
  }
  
  setCode() {
    if (this.selectedType === 'RST-MN') {
      this.resourceForm.get('code').setValue('MN_');
      this.filterMenu();
    } else if (this.selectedType === 'RST-BT') {
      this.resourceForm.get('code').setValue('BT_');
    } else {
      this.resourceForm.get('code').setValue('WD_');
    }
    this.resourceForm.get('code').updateValueAndValidity();
  }
  
  applyFilter() {
    let filterBy = {};
    let fitlerResource = {}
    
    if (this.permissionForm.controls.type.value === 'Role') {
        filterBy['roleId'] = [this.permissionForm.controls.id.value];
    } else if (this.permissionForm.controls.type.value === 'Login') {
      filterBy['loginId'] = [this.permissionForm.controls.id.value];
    }
    
    if (this.permissionForm.controls.page.value.length) {
      if (filterBy.hasOwnProperty( 'roleId') || filterBy.hasOwnProperty( 'loginId')) {
        filterBy['page'] = this.permissionForm.controls.page.value;
      }
      fitlerResource['page'] = this.permissionForm.controls.page.value;
    }
    if (this.permissionForm.controls.resourceType.value.length) {
      if (filterBy.hasOwnProperty( 'roleId') || filterBy.hasOwnProperty( 'loginId')) {
        filterBy['resourceTypeId'] = this.permissionForm.controls.resourceType.value;
      }
      fitlerResource['resourceTypeId'] = this.permissionForm.controls.resourceType.value;
    }
    this.resourceList =  this.metaData.list.resource.filter(
      o => Object.keys(fitlerResource).every(k => fitlerResource[k].some(f => o[k] === f))
    );
    let filterData = this.metaData.list.permission.filter(
      o => Object.keys(filterBy).every(k => filterBy[k].some(f => o[k] === f))
    );
    this.previousPermission = filterData.map(val => Number(val.resourceId));
    this.permissionForm.controls.resources.setValue(this.previousPermission);
    this.getMappingData();
  }
  permissionUpdate(isClose) {
    let result = {
      'id'  : this.permissionForm.controls.id.value,
      'idType'          : this.permissionForm.controls.type.value,
      'addResource'   : this.selectedDatasource.filter(res => res.status === 'new').map(val => val.id),
      'removeResource'   : this.selectedDatasource.filter(res => res.status === 'deleted').map(val => val.id),
    };
    console.log(result);
    this.configurationService.resourceRoleMap(result).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      if (isClose) {
        this.updateUserPermission();
        this.thisDialogRef.close('confirm');
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  updateUserPermission() {
    let roleId = localStorage.getItem('userlevel');
    let userId = localStorage.getItem(btoa('userId'));
    this.commonService.getPermissionbyId(roleId, userId).subscribe((res) => {
        const permission = JSON.stringify(res.results);
        localStorage.setItem('permission', permission);
        localStorage.removeItem('urlLinks');
        let time = (new Date().getTime() + (1 * 60 * 60 * 1000)).toString()
        localStorage.setItem(btoa('session_time'), time)
        console.log('permission updated..')
    })
  }
  resourceUpdate(isClose) {
    let result = {
      'resourceTypeId'  : this.resourceForm.controls.resourceTypeId.value,
      'target'          : this.resourceForm.controls.target.value,
      'page'            : this.resourceForm.controls.page.value ? this.resourceForm.controls.page.value : null,
      'code'            : this.resourceForm.controls.code.value ? this.resourceForm.controls.code.value : null,
      'name'            : this.resourceForm.controls.name.value ? this.resourceForm.controls.name.value : null,
      'description'     : this.resourceForm.controls.description.value ? this.resourceForm.controls.description.value : null,
      'parentId'        : this.resourceForm.controls.parentId.value === 'null' ? null :
                          this.resourceForm.controls.parentId.value,
      'sequence'        : this.resourceForm.controls.sequence.value ? this.resourceForm.controls.sequence.value : null,
      'iconName'            : this.resourceForm.controls.iconName.value ? this.resourceForm.controls.iconName.value : null,
      'link'            : this.resourceForm.controls.link.value ? this.resourceForm.controls.link.value : null,
      'checkUrl'        : this.resourceForm.controls.checkUrl.value,
      'category'        : this.resourceForm.controls.category.value,
      'subCategory'        : this.resourceForm.controls.subCategory.value,
      'version'         : this.resourceForm.controls.version.value ? this.resourceForm.controls.version.value : null,
      'status'          : this.resourceForm.controls.status.value,
      'permitAll'       : this.resourceForm.controls.permitAll.value,
      'addPermission': {
        'roleId' : this.selectedDatasource.filter(res => res.type === 'role' && res.status === 'new').map(val => val.id),
        'loginId' : this.selectedDatasource.filter(res => res.type === 'user' && res.status === 'new').map(val => val.id),
      },
      'removePermission': {
        'roleId' : this.selectedDatasource.filter(res => res.type === 'role' && res.status === 'deleted').map(val => val.id),
        'loginId' : this.selectedDatasource.filter(res => res.type === 'user' && res.status === 'deleted').map(val => val.id),
      }
    };
    if (this.selectedData) {
      result['id'] = this.selectedData.id;
      this.configurationService.updateResource(this.selectedData.id, result).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.updateUserPermission();
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    } else {
      this.configurationService.saveResource(result).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        if (isClose) {
          this.updateUserPermission();
          this.thisDialogRef.close('confirm');
        } else {
          this.buildForm();
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
  
  getPermissionData() {
    this.selectedDatasource = [];
    const resourceRole = this.resourceForm.controls.role.value;
    const resourceUser = this.resourceForm.controls.user.value;
    if (resourceRole?.length) {
      this.selectRoleDataSource(resourceRole);
    }
    if (resourceUser?.length) {
      this.selectUserDataSource(resourceUser);
    }
    const roleData = this.selectedDatasource.filter(val => val.type === 'role' && val.status === 'exist').map(value => value.id);
    const userData = this.selectedDatasource.filter(val => val.type === 'user' && val.status === 'exist').map(value => value.id);
    for (let i in this.previousPermission) {
       const perm = this.previousPermission[i];
      if (perm?.type === 'role') {
        this.processDeletedRole(perm, roleData);
      }
      if (this.previousPermission[i].type === 'user') {
        this.processDeletedUser(perm, userData);
      }
    }
    this.displayedColumns = ['id', 'type', 'name', 'status'];
    this.dataSource = this.selectedDatasource;
    this.dataSource.sort = this.sort;
  }
  selectRoleDataSource(resource) {
    const filterBy = { 'id' : resource };
    const filteredData = this.metaData.list.role.filter(
      o => Object.keys(filterBy).every(k => filterBy[k].some(f => o[k] === f)));
    for (let i in filteredData) {
      let status = 'new';
      const preRole = this.previousPermission.filter(res => res.type === 'role').map(value => value.id);
      if (preRole.includes(filteredData[i]['id'])) {
        status = 'exist';
      }
      this.selectedDatasource.push({'id' : filteredData[i]['id'], 'name' : filteredData[i]['name'], 'type' : 'role', 'status' : status});
    }
  }
  selectUserDataSource(resource) {
    const filterBy = { 'loginId' : resource }; 
    const filteredData = this.metaData.list.user.filter(
      o => Object.keys(filterBy).every(k => filterBy[k].some(f => o[k] === f)));
    for (let i in filteredData) {
      let status = 'new';
      const preUser = this.previousPermission.filter(res => res.type === 'user').map(value => value.id);
      if (preUser.includes(filteredData[i]['loginId'])) {
        status = 'exist';
      }
      this.selectedDatasource.push({'id' : filteredData[i]['loginId'], 'name' : filteredData[i]['userName'], 
        'type' : 'user', 'status' : status});
    }
  }
  processDeletedRole(perm, data) {
    if (!data.includes(perm['id']))  {
      const val = this.metaData.list.role.filter(res => res.id === perm['id']);
      if(val.length) {
        this.selectedDatasource.push({'id' : perm['id'], 'name' : val[0].name,
      'type' : 'role', 'status' : 'deleted'});
      }
    }
  }
  processDeletedUser(perm, data) {
    if (!data.includes(perm['id']))  {
      const val = this.metaData.list.user.filter(res => res.loginId === perm['id']);
      if(val.length) {
        this.selectedDatasource.push({'id' : perm['id'], 'name' : val[0].userName,
      'type' : 'user', 'status' : 'deleted'});
      }
    }
  }
}


@Component({
  selector: 'app-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss']
})
export class ResourceComponent implements OnInit,OnDestroy  {

  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  // @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public roleList: any = [];
  public resourceList: any = [];
  public userList:any = [];
  public resources: any = [];
  public permissions: any = [];
  public selectedTab = 'resource';
  public selectedRow = null;
  public dataSource: MatTableDataSource<any>;
  public applyFilterValue: any;
  displayedData = [
    {'colName': 'ID', 'title': '', 'dataName': 'ID'},
    {'colName': 'role', 'title': 'Role Name', 'dataName': 'roleName'},
    {'colName': 'user', 'title': 'User Name', 'dataName': 'loginName'},
    {'colName': 'code', 'title': 'Code', 'dataName': 'code'},
    {'colName': 'name', 'title': 'Name', 'dataName': 'name'},
    {'colName': 'resourceTypeName', 'title': 'Resource Type', 'dataName': 'resourceTypeName'},
    {'colName': 'page', 'title': 'Page', 'dataName': 'page'},
    {'colName': 'permitAll', 'title': 'Ispermit All', 'dataName': 'permitAll'},
    {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
  ];
  displayedColumns = this.displayedData.map(res=> res.colName);
  selectedTabIndex: number = 0;
  resource = new FormControl();
  role = new FormControl();
  selectedDropdown = new FormControl();
  user = new FormControl([]);
  filter = new FormControl();
  showAction1 = [{ name: "create", value: "Create" }];
  showAction2 = [{ name: "modify", value: "Modify"}];
  public showActions = this.showAction1;
  filterValue: null;
  selectedData: any;
  rowData: any;
  spinLoader :any;
  userPreference: string;
  
  constructor(public dialog: MatDialog, private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService) {  
  }
  ngOnInit() {
    let preference = this.commonService.userPreference;
    if(preference?.hasOwnProperty('permission')) {
      this.userPreference = preference.permission.value
      this.selectedTab = preference.permission.value
      this.selectedTabIndex = this.selectedTab == 'permission' ? 1 : 0;
    }
    this.getappTerms();
    this.getAllResource();
  }
  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.selectedTabIndex = tabChangeEvent.index;
    this.selectedTab = this.selectedTabIndex == 1 ? 'permission' : 'resource'
    this.applyFilter();
    this.showActions;
    this.getAllResource();
  };
  headerEventAction(key){
    if(key.value === 'create'){
      this.createPermission(null)
    }else{
    this.createPermission(this.selectedData)}
  }
  refreshPage()  {
    this.showActions = this.showAction1;
    this.filterValue = null;
    this.dataSource = new MatTableDataSource([]);
    this.configurationService.getAllResource().subscribe(res => {
      this.resources = res.results;
      if (this.selectedTab === 'resource') {
        this.applyFilter(this.applyFilterValue);
      }
    });
    this.configurationService.getAllPermission().subscribe(res => {
      this.permissions = res.results;
      if (this.selectedTab !== 'resource') {
        this.applyFilter(this.applyFilterValue);
      }
    });
  }
  rowClickEvent(element) {
    this.selectedRow = this.selectedRow ? null : element;
    if( element.id ){
    this.showActions = this.showAction2
    this.selectedData = element;
    }else{
      this.showActions =this.showAction1;
    }
  }
  getUserPreference(value) {
    if(value === this.userPreference) return ;
    this.selectedTab = value;
    let preference = this.commonService.userPreference;
    let postData = {
      'key':"permission",
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value':  this.selectedTab          
    }
    if(preference != null) {
      if(preference.hasOwnProperty('permission')) {
          let id = preference.permission.id;
          this.commonService.updateUserPreference(id, postData).subscribe(res=> {
            this.commonService.userPreference = res.results;
          });
        } else {
          this.commonService.saveUserPreference(postData).subscribe(res=> {
            this.commonService.userPreference = res.results;
          });
        }
    }
  }
  getappTerms() {
    this.commonService.getAppTermsVerion2('ResourceType').subscribe(res=> {
      this.resourceList = res.results;
    });
    this.configurationService.getLoginUsers().subscribe(res => {
      this.userList = res.results;
      this.user.setValue([]);
      
    });
    this.resource.setValue([]);
    this.commonService.getAllRole().subscribe(res => {
      this.roleList = res.results;
      this.role.setValue([]);
    });
  }
  getAllResource() {
    this.spinLoader=true;
    this.configurationService.getAllResource().subscribe(res => {
      this.resources = res.results;
      this.applyFilter(this.applyFilterValue);
      this.spinLoader=false;
    });
    this.configurationService.getAllPermission().subscribe(res => {
      this.permissions = res.results;
      this.applyFilter(this.applyFilterValue);
      this.spinLoader=false;
    });
  }
  
  applyFilter(filterValue ?: string) {
    this.applyFilterValue = filterValue;
    if (!filterValue) {
      this.filter.setValue(null);
    }
    let filterBy = {};
    let filterData =  null;
    if (this.resource.value.length) {
      filterBy['resourceTypeId'] = this.resource.value;
    }
    if (this.selectedTab === 'permission') {
            if (this.role.value.length) {
        filterBy['roleId'] = this.role.value;
      }
      if (this.user.value.length) {
   
        filterBy['loginId'] = this.user.value;
      }
      filterData = this.permissions.filter(
        o => Object.keys(filterBy).every(k => filterBy[k].some(f => o[k] === f))
      );
      this.displayedColumns = ['ID','role', 'user', 'code', 'name', 'resourceTypeName', 'page', 'status'];
      // this.userPreference ='permission'
      this.dataSource = new MatTableDataSource(filterData);
      this.dataSource.paginator = this.paginator2;
      this.dataSource.sort = this.sort;
    } else {
      filterData = this.resources.filter(
        o => Object.keys(filterBy).every(k => filterBy[k].some(f => o[k] === f))
      );
      this.displayedColumns = ['ID','code', 'name', 'resourceTypeName', 'page', 'permitAll', 'status'];
      // this.userPreference ='resource'
      this.dataSource = new MatTableDataSource(filterData);
      this.dataSource.paginator = this.paginator1;
      this.dataSource.sort = this.sort;
    }

    if (filterValue) {
      filterValue = filterValue.trim(); 
      filterValue = filterValue.toLowerCase();
      if(this.applyFilterValue != null){
        this.dataSource.filter = this.applyFilterValue;
      }else{
      this.dataSource.filter = filterValue;
      }
    }
  }
  createPermission(row ?: any) {
    this.showActions = null;
    const data = {
      'type' : this.selectedTab,
      'selectedData' : null,
      'list' :  {
        'permission' : this.permissions,
        'resource'   : this.resources,
        'role'       : this.roleList,
        'type'       : this.resourceList,
        'user'       : this.userList
      }
    };
    if (row) {
      data['selectedData'] = row;
    }
    const dialogRef = this.dialog.open(CreateResourceComponent, { data : data,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(_result => {
      this.selectedRow = null;
      this.selectedDropdown.setValue(null);
      this.refreshPage();
    });
  }
  ngOnDestroy(){
    this.getUserPreference(this.selectedTab)
  }
  fixClick() {
    console.log('')
  }  
}



