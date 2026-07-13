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

import { Component, Inject, Input, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, HospitalService } from '../../../services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { GroupMapping, ResourcesGroupMap } from './resource-map.model';
import { ListLoaderService } from '../../../services/list-loader.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-resource-map',
  templateUrl: './resource-map.component.html',
  styleUrls: ['./resource-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ResourceMapComponent implements OnInit, OnDestroy  {
  public groupData: GroupMapping;
  public resourceMap: ResourcesGroupMap;
  public resData: any
  resourceForm: FormGroup;
  searchControl = new FormControl('');
  private readonly destroy$ = new Subject<void>();
  @Input() inputData: any = {}
  resourceList: any;
  resourceData: any;
  userResouresData: any;
  resource: any;
  selectedResources: any[] = [];
  facilityList: any;
  resourceExpand: boolean = true;
  groupResources = []
  selectedGroupResources: any[] = [];
  selectedMapResources: any[] = [];
  resourceType = [{ code: 'RE-GU', value: 'Group' }, { code: 'RE-RES', value: 'Resource' }];
  resourceGroupList: any[];
  groupResourcesList : any = [];
  selectedGroupMap: any[] = [];
  groupMap = [];
  categoryList: any[];
  subCategoryList: any[];
  applyFilterValue: any;
  isResource: boolean = false;
  selectedOption: string = 'all';
  displayGroupColumn: any[] = ['Code', 'Name', 'Resource Type', 'Page', 'Category', 'Sub Category', 'Permit All', 'Status', 'Delete'];
  displayGroupDataColumn: any[] = ['code', 'name', 'resourceTypeName', 'page', 'category', 'subCategory', 'permitAll', 'resourceGroupMapIsActive', 'Delete'];
  displayMapColumn: any[] = [];
  displayMapDataColumn: any[] = []
  isGroupMap: boolean = false;
  regionId = localStorage.getItem('regionId')
  isResourceSort: boolean = false;
  recordReslength: any;
  resourceLoader: boolean = false;
  visibleResources: any[] = [];
  sliceSize = 50;
  currentIndex = 0;

  statusList = [{code: true, value: 'Active'}, {code: false, value: 'In Active'}]

  constructor(public form: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService, private readonly hospitalServices: HospitalService, public toastr: AppToastService,
    public thisDialogRef: MatDialogRef<ResourceMapComponent>,public dialog: MatDialog, public resourceService : ListLoaderService) { }

  ngOnInit(): void {
    if(!['TW-RSD','TW-RSU'].includes(this.inputData.statusId)){
      if(this.data.type == 'resource' || this.data.type == 'role'){
        this.resData = this.data
      } else if(this.data.type === 'ResourceGroupName') {
        this.resourceExpand = false;
        this.resData = this.data
      } else {
        this.resData = this.inputData
      }
      this.buildForm();
      this.getResource();
      this.getFacilityList();
      this.getResourceType()
      if (this.data.type === 'ResourceGroupName'){
        setTimeout(() => {
          this.getMapResource(this.data.data.resourceGroupId)
        },400);
      }
      if (this.resData.type !== 'resource') {
        this.getGroup()
      }
      if (this.resData.data && this.resData.data.id) {
        let groupId = this.resData.data.id;
        this.getGroupResources(groupId, this.resData.type)
      }
      if(this.data.type !== 'ResourceGroupName') { 
        this.selectOption('all');
      }
    }

     this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchText => {
        this.applySearch(searchText, this.resourceForm.controls['resourcesType'].value);
      });
  } 

  ngOnChanges(changes: SimpleChanges): void {
    const onchangeData = changes.inputData?.currentValue;
    this.resData = changes.inputData?.currentValue;
    if (['TW-RSD','TW-RSU'].includes(onchangeData.statusId) && this.resData.data != null ) {
      this.buildForm();
      this.getResource();
      this.getFacilityList();
      this.getResourceType()
      if (this.resData.type !== 'resource') {
        this.getGroup()
      }
      if (this.resData.data && this.resData.data.id) {
        let groupId = this.resData.data.id;
        this.getGroupResources(groupId, this.resData.type)
      }
      if(this.resData.type !== 'ResourceGroupName') { 
        this.selectOption('all');
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectOption(option: string): void {
    this.isGroupMap = false
    this.selectedOption = option;
    if (this.selectedOption === 'all') {
      this.displayMapColumn = ['Type','Resources Name','Resource Code','Status', 'Delete']
      this.displayMapDataColumn = ['type','resourceName','resourceCode','isActive', 'Delete']
      this.selectedMapResources = this.selectedGroupMap;
      this.isGroupMap = true;
    } else if (this.selectedOption === 'Resource') {
      this.displayMapColumn = ['Type','Resource Code', 'Resource Name',  'Status', 'Delete']
      this.displayMapDataColumn = ['type','resourceCode', 'resourceName',  'isActive', 'Delete']
      this.selectedMapResources = this.selectedGroupMap.filter(item => item.type === option);
      this.isGroupMap = true;
    } else if (this.selectedOption === 'Resource Group') {
      this.displayMapColumn = ['Type', 'Resource Group Name', 'Status', 'Delete']
      this.displayMapDataColumn = ['type', 'resourceGroupName',  'isActive', 'Delete']
      this.selectedMapResources = this.selectedGroupMap.filter(item => item.type === option);
      this.isGroupMap = true;
    }
  }

  applyMapTableSearch(filterValue: string, type: string) {
    if (type === 'resource') {
      if (filterValue) {
        filterValue = filterValue.trim().toLowerCase();
        let filterData = this.selectedResources.filter(o =>
          Object.keys(o).some(k =>
            typeof o[k] === 'string' && o[k].toLowerCase().includes(filterValue)
          )
        );
        this.selectedGroupResources = filterData;
      } else {
        this.selectedGroupResources = this.selectedResources;
      }
    } else {
      if (filterValue) {
        filterValue = filterValue.trim().toLowerCase();
        let filterData = this.selectedGroupMap.filter(o =>
          Object.keys(o).some(k =>
            typeof o[k] === 'string' && o[k].toLowerCase().includes(filterValue)
          )
        );
        this.selectedMapResources = filterData;
      } else {
        this.selectedMapResources = this.selectedGroupMap;
      }
    }
  }

  applySearch(filterValue: string, type: string) {
    this.isResource = true;
    if (type === 'RE-RES') {
      setTimeout(() => {
        const selectedTypes = this.resourceForm.controls['type'].value || [];
        const selectedCategory = this.resourceForm.controls['category'].value || [];
        const selectedSubCategory = this.resourceForm.controls['subCategory'].value || [];

        let serachText = filterValue ? filterValue.trim().toLowerCase() : '';

        let filterData = this.resource.filter(o => {
          const matchesName = serachText ? o.name?.toLowerCase().includes(serachText) : true;
          const matchesType = selectedTypes.length ? selectedTypes.includes(o.resourceTypeId) : true;
          const matchesCategory = selectedCategory.length ? selectedCategory.includes(o.category) : true;
          const matchesSubCategory = selectedSubCategory.length ? selectedSubCategory.includes(o.subCategory) : true;

          return matchesName && matchesType && matchesCategory && matchesSubCategory;
        });
        const noFiltersSelected = !filterValue && !selectedTypes.length && !selectedCategory.length && !selectedSubCategory.length;
        this.resourceData = (filterData.length || noFiltersSelected) ? filterData : this.resource;
        this.isResource = false;
          const result = this.resourceService.reorderResources(this.resourceData, this.selectedGroupResources, this.sliceSize);
          this.resourceData = result.updatedResourceData;
          this.visibleResources = result.visibleResources;
          this.currentIndex = result.currentIndex;
      }, 0)
    } else {
      if (filterValue) {
        let serachText = filterValue ? filterValue.trim().toLowerCase() : '';
        let filterData = this.resourceGroupList.filter(o => o.name?.toLowerCase().includes(serachText));
        this.resourceData = filterData;
      } else {
        this.resourceData = this.resourceGroupList;
      }
      this.isResource = false;
      const result = this.resourceService.reorderResources(this.resourceData, this.selectedGroupResources, this.sliceSize);
      this.resourceData = result.updatedResourceData;
      this.visibleResources = result.visibleResources;
      this.currentIndex = result.currentIndex;
    }
  }

  actionTrigger(event){
    if(event.key === 'delete') {
      this.singleResourcesDelete(event.data,event.key, this.resData.type);
    } else if(event.key === 'undo'){
      this.singleResourcesDelete(event.data,event.key, this.resData.type);
    }
  }

  singleResourcesDelete(data, key, type) {
    if (type === 'resource') {
      if (key === 'delete') {
        if (data.resourceGroupMapId !== null) {
          const selectedResource = this.selectedResources.find(item => item.id === data.id);
          if (selectedResource) {
            selectedResource.resourceGroupMapIsActive = false;
          }
        } else {
          this.selectedResources = this.selectedResources.filter(item => item.id !== data.id);
          this.selectedGroupResources = this.selectedResources.slice();
        }
      } else {
        if (data.resourceGroupMapId !== null) {
          const selectedResource = this.selectedResources.find(item => item.id === data.id);
          if (selectedResource) {
            selectedResource.resourceGroupMapIsActive = true;
          }
        }
      }
    } else {
      let GroupType = type != 'user' ? this.resourceForm.controls['resourcesType'].value : null;
      if (key === 'delete') {
        const mappedResource = this.selectedGroupMap.find(item => GroupType === 'RE-RES' ? item.resourceId === data.resourceId : item.roleMapId === data.roleMapId);
        if (mappedResource) {
          mappedResource.isActive = false;
        } else {
          this.selectedGroupMap = this.selectedGroupMap.filter(item => GroupType === 'RE-RES' ? item.resourceId !== data.resourceId : item.roleMapId !== data.roleMapId);
          this.selectedGroupMap = this.selectedGroupMap.slice();
        }
      } else {
        const mappedResource = this.selectedGroupMap.find(item => GroupType === 'RE-RES' ? item.resourceId === data.resourceId : item.roleMapId === data.roleMapId);
        if (mappedResource) {
          mappedResource.isActive = true;
        }
      }
    }
    this.makeGroup(type)
  }

  getResourceType() {
    this.commonService.getAppTerms('ResourceType').subscribe(res => {
      this.resourceList = res.results;
    });
  }

  getGroupResources(id, type) {
    if (type === 'resource') {
      this.commonService.getGroupedResources(id).subscribe(res => {
        this.selectedGroupResources = res.results[0].resources;
        this.selectedResources = res.results[0].resources;
        let groupList = JSON.parse(JSON.stringify(this.selectedResources))
        this.groupResourcesList = groupList.map(item => item.id); 
        for (let i = 0; i <= this.displayGroupDataColumn.length; i++) {
          this.selectedGroupResources.map((data) => {
            data[this.displayGroupColumn[i]] = data[this.displayGroupDataColumn[i]];
          });
        }
      })
    } else {
      let roleId = null;
      let userId = null;
      let departmentId = null;
      if(this.resData.type == 'user' && this.resData.hasOwnProperty('data') ){
        userId = this.resData.data.id;
        if(this.resData.data.hasOwnProperty('roleIds') && this.resData.data.roleIds != null && this.resData.data.roleIds.length) {
          roleId = this.resData.data.roleIds[0];
        }
      }
      if(this.resData.type == 'role') {
        roleId = id;
      }
      if (this.resData.type === 'department'){
        departmentId = id
      }
      // this.commonService.getMappedGroupRole(id, this.resData.type, roleId).subscribe(res => {
      this.commonService.getResourceMap(userId, roleId, departmentId).subscribe(res => {
        this.selectedMapResources = res.results
        this.selectedGroupMap = res.results
        for (let i = 0; i <= this.displayGroupDataColumn.length; i++) {
          this.selectedMapResources.map((data) => {
            data[this.displayMapColumn[i]] = data[this.displayMapDataColumn[i]];
          });
        }
      })
    }
  }

  getGroup() {
    this.configurationService.getAllGroup().subscribe(res => {
      this.resourceGroupList = res.results;
    })
  }

  typeOfResources(event) {
    if (event.value === 'RE-GU') {
      this.resourceData = this.resourceGroupList;
      this.visibleResources = this.resourceData.slice(0,20)
    } else {
      this.resourceData = this.resource;
      this.visibleResources = this.resourceData.slice(0,20)
    }
  }

  isResourceSelected(resource: any, type): boolean {
    let GroupType = this.resourceForm.controls['resourcesType'].value
    if (type === 'resource') {
      return this.selectedResources.some(selected => selected.id === resource.id);
    } else {
      return this.selectedGroupMap.some(selected => GroupType === 'RE-RES' ? selected.resourceId === resource.id : selected.resourceGroupId === resource.id);
    }
  }

  sortSelectedOnTop(type) {
    // if(this.isResourceSort) {
      this.resourceData = this.getSortedResources(this.resourceData, type);
    // }
  }

  getSortedResources(resourceData: any, type: string): any[] {
    if (!resourceData) {
      return [];
    }
    return resourceData.sort((a, b) => {
      const aSelected = this.isResourceSelected(a, type);
      const bSelected = this.isResourceSelected(b, type);
      return aSelected === bSelected ? 0 : aSelected ? -1 : 1;
    });
  }
  
  getFacilityList() {
    if(this.regionId){
      this.hospitalServices.getFacilityList(this.regionId).subscribe(res => {
        this.facilityList = res.results;
      });
    }
  }

  buildForm() {
    this.resourceForm = this.form.group({
      type: [null],
      resource: [null],
      category: [null],
      subCategory: [null],
      resourcesType: ['RE-RES'],
      groupName: [this.resData.type === 'user' ? this.resData.data.fullName : this.resData.data ? this.resData.data.name : null,[Validators.required]],
      facilityId: [this.resData.data ? this.resData.data.faciltyId : null],
      statusId: [this.resData.data ? this.resData.data.isActive : true]
    })

    if(this.resData.type === 'user'){
      this.resourceForm.get('groupName').setValidators(null);
      this.resourceForm.get('groupName').updateValueAndValidity();
    }
  }

  getResource() {
    this.isResource = true
    this.configurationService.getAllResource().subscribe(res => {
      if(res.statusCode === 1){
        this.isResource = false;
        this.resourceData = res.results;
        this.resource = res.results;
       const result = this.resourceService.reorderResources(this.resourceData, this.selectedGroupResources, 20);
        this.resourceData = result.updatedResourceData;
        this.visibleResources = result.visibleResources;
        this.currentIndex = result.currentIndex;
        this.categoryList = [...new Set(res.results.map(item => item.category).filter(category => category !== null))];
        this.subCategoryList = []
        if(this.resData.type){
          this.sortSelectedOnTop(this.resData.type);
        }
      }
    })
  }

  toggleSelection(event: any, resource: any, type: any) {
    if (type === 'resource') {
      if (event.checked) {
        const selectedResource = this.selectedResources.find(
          item => item.id === resource.id
        );
        if (selectedResource) {
          selectedResource.resourceGroupMapIsActive = true;
        } else {
          this.selectedResources.push(resource);
        }
        this.selectedResources.sort((a, b) => {
          const order = (val: boolean | null) => val === null ? 0 : val === false ? 1 : 2;
          return order(a.resourceGroupMapIsActive) - order(b.resourceGroupMapIsActive);
        });
      } else {
        let resourcesCheck = this.selectedResources.filter(res => res.id === resource.id)
        if (resourcesCheck.length > 0 && resourcesCheck[0].resourceGroupMapId !== null) {
          const selectedResource = this.selectedResources.find(
            item => item.id === resource.id
          );
          if (selectedResource) {
            selectedResource.resourceGroupMapIsActive = false;
          }
        } else {
          this.selectedResources = this.selectedResources.filter(
            item => item.id !== resource.id
          );
        }
          this.selectedResources.sort((a, b) => {
            const order = (val: boolean | null) => val === null ? 0 : val === false ? 1 : 2;
            return order(a.resourceGroupMapIsActive) - order(b.resourceGroupMapIsActive);
          });
      }
    } else {
      if (event.checked) {
        let GroupType = this.resourceForm.controls['resourcesType'].value
        resource['type'] = GroupType === 'RE-GU' ? 'Resource Group' : 'Resource';
        const mappedResource = this.selectedGroupMap.find(item => GroupType === 'RE-RES' ?  item.resourceId === resource.id : item.resourceGroupId === resource.id);
        if (mappedResource) {
          mappedResource.isActive = true;
        } else {
          this.selectedGroupMap.push(resource);
        }
        if (resource.type === 'Resource Group') {
          this.selectedGroupMap.sort((a, b) => {
            if (a.roleMapId === null && b.roleMapId !== null) return -1;
            if (a.roleMapId !== null && b.roleMapId === null) return 1;
            return (a.roleMapId || 0) - (b.roleMapId || 0);
          });
        } else {
          this.selectedGroupMap.sort((a, b) => {
            const order = (val: boolean | null) => val === null ? 0 : val === true ? 1 : 2;
            return order(a.status) - order(b.status);
          });
        }
      } else {
        let GroupType = this.resourceForm.controls['resourcesType'].value
        let mapResourcesCheck = this.selectedGroupMap.filter(res => GroupType === 'RE-RES' ? res.resourceId === resource.id : res.resourceGroupId === resource.id)
        if (mapResourcesCheck.length > 0 && mapResourcesCheck[0].isActive !== null) {
          const mappedResource = this.selectedGroupMap.find(item => GroupType === 'RE-RES' ? item.resourceId === resource.id : item.resourceGroupId === resource.id);
          if (mappedResource) {
            mappedResource.isActive = false;
          }
        } else {
          this.selectedGroupMap = this.selectedGroupMap.filter(
            item => item.id !== resource.id
          );
        }
        this.selectedGroupMap.sort((a, b) => {
          const order = (val: boolean | null) => val === null ? 0 : val === false ? 1 : 2;
          return order(a.isActive) - order(b.isActive);
        });
      }
    }
  }

  makeGroup(type) {
    if (type === 'resource') {
      this.groupResources = []
      this.selectedGroupResources = this.selectedResources.slice();
      for (let resource of this.selectedResources) {
        let makeGroupData = {
          "id": resource.resourceGroupMapId ? resource.resourceGroupMapId : null,
          "isActive": resource.resourceGroupMapIsActive !== null ? resource.resourceGroupMapIsActive : true,
          "resourceId": resource.id
        };
        this.groupResources.push(makeGroupData);
      }
    } else {
      let groupData = [];
      this.groupMap = [];
      for (let resource of this.selectedGroupMap) {
        let makeGroupData = {}
        if (resource.type === 'Resource Group') {
          makeGroupData = {
            id: resource.roleMapId || null,
            facilityId: resource.faciltyId || null,
            isActive: resource.resourceGroupIsActive !== undefined && resource.resourceGroupIsActive !== null
              ? resource.resourceGroupIsActive : resource.isActive !== undefined && resource.isActive !== null
                ? resource.isActive : true,
            resourceGroupId: resource.resourceGroupId || resource.id || null
          };
        } else {
          makeGroupData = {
            id: resource.roleMapId || null,
            facilityId: resource.faciltyId || null,
            isActive: resource?.isActive !== undefined && resource?.isActive !== null ? resource.isActive : true,
            resourceId: resource.resourceId || resource.id || null
          };
        }
        let groupListView = {
          category: resource.category || null,
          description: resource.description || null,
          facilityId: resource.faciltyId || null,
          facilityName: resource.facilityName || null,
          isActive: resource?.isActive !== undefined && resource?.isActive !== null ? resource.isActive : true,
          isInclude: resource.isInclude || null,
          page: resource.page || null,
          resourceCode: resource.resourceCode || resource.code || null,
          resourceGroupId: resource.resourceGroupId || (resource.type === 'Resource Group' ? resource.id : null),
          resourceGroupName: resource.resourceGroupName || (resource.type === 'Resource Group' ? resource.name : null),
          resourceId: resource.resourceId || (resource.type === 'Resource' ? resource.id : null),
          resourceName: resource.resourceName || (resource.type === 'Resource' ? resource.name : null),
          resourceParentName: resource.resourceParentName || null,
          resourceType: resource.resourceType || null,
          resourceTypeId: resource.resourceTypeId || null,
          resoureParentId: resource.resoureParentId || null,
          roleMapId: resource.roleMapId || null,
          sequence: resource.sequence || null,
          subCategory: resource.subCategory || null,
          target: resource.target || null,
          type: resource.type || null
        };
        groupData.push(groupListView)
        this.groupMap.push(makeGroupData)
      }
      this.selectedMapResources = groupData.slice()
      this.selectedGroupMap = this.selectedMapResources;
    }
    this.selectOption(this.selectedOption);
  }


  applyTypeFilter(event) {
    if (!event) {
      this.isResource = true;
      setTimeout(() => {
        this.resourceForm.get('category').setValue(null);
        this.resourceForm.get('subCategory').setValue(null);
        let typeFilter = this.resourceForm.controls['type'].value;
        let filterData = this.resource.filter(o => typeFilter?.includes(o.resourceTypeId));
        if (this.resourceForm.controls['type'].value?.length) {
          this.resourceData = filterData;
          this.visibleResources = this.resourceData.slice(0,20)
          this.categoryList = [...new Set(filterData.map(item => item.category).filter(category => category !== null))];
          this.subCategoryList = [];
        } else {
          this.resourceData = this.resource;
          this.visibleResources = this.resourceData.slice(0,20)
          this.categoryList = [...new Set(this.resource.map(item => item.category).filter(category => category !== null))];
          this.subCategoryList = [];
        }
        this.isResource = false;
      }, 0)
    }
  }

  applyCategoryFilter(event) {
    if (!event) {
      this.isResource = true;
      setTimeout(() => {
        this.resourceForm.get('subCategory').setValue(null);
        const selectedTypes = this.resourceForm.controls['type'].value;
        const selectedCategory = this.resourceForm.controls['category'].value;
        let filterData = this.resource.filter(o => {
          const matchTypes = selectedTypes?.length ? selectedTypes.includes(o.resourceTypeId) : true;
          const matchCategory = selectedCategory?.length ? selectedCategory.includes(o.category) : true;
          return matchTypes && matchCategory
        });
        const noFiltersSelected = !selectedTypes?.length && !selectedCategory?.length;
        this.resourceData = (filterData.length || noFiltersSelected) ? filterData : this.resource;
        this.visibleResources = this.resourceData.slice(0,20)
        if (selectedCategory?.length) {
          this.subCategoryList = [...new Set(filterData.map(item => item.subCategory).filter(category => category !== null))];
        } else {
          this.subCategoryList = [];
        }
        this.isResource = false;
      }, 0)
      console.log(this.isResource)
    }
  }

  applySubCategoryFilter(event) {
    if (!event) {
      this.isResource = true;
      setTimeout(() => {
        const selectedTypes = this.resourceForm.controls['type'].value;
        const selectedCategory = this.resourceForm.controls['category'].value;
        const selectedSubCategory = this.resourceForm.controls['subCategory'].value;
        let filterData = this.resource.filter(o => {
          const matchTypes = selectedTypes?.length ? selectedTypes.includes(o.resourceTypeId) : true
          const matchCategory = selectedCategory?.length ? selectedCategory.includes(o.category) : true;
          const matchSubCategory = selectedSubCategory?.length ? selectedSubCategory.includes(o.subCategory) : true;
          return matchTypes && matchCategory && matchSubCategory;
        });
        const noFiltersSelected = !selectedTypes?.length && !selectedCategory?.length && !selectedSubCategory?.length;
        this.resourceData = (filterData.length || noFiltersSelected) ? filterData : this.resource;
        this.visibleResources = this.resourceData.slice(0,20)
        this.isResource = false;
      }, 0)
    }
  }

  expandSide() {
    this.resourceExpand = !this.resourceExpand;
  }

  createGroup(type) {
    if (type === 'resource') {
      this.groupData = new GroupMapping(null, null, null, null, null)
      this.groupData.id = this.resData.data ? this.resData.data.id : null;
      this.groupData.name = this.resourceForm.controls['groupName'].value;
      this.groupData.facilityId = this.resourceForm.controls['facilityId'].value;
      this.groupData.isActive = this.resourceForm.controls['statusId'].value;
      let changedGroupResourcesData = this.groupResources.filter(res => res.id == null || !res.isActive);
      let groupResourceFiletr = changedGroupResourcesData.filter(res => !(res.id == null && res.isActive === false));
      this.groupData.resourceMap = groupResourceFiletr;
      // console.log(this.groupData)
      // return
      this.commonService.createGroupReso(this.groupData).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close();
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    } else {
      let identifyingType = null
      if (type === 'role') {
        identifyingType = 'RT-RO'
      } else if (type == 'department') {
        identifyingType = 'RT-DT'
      } else {
        identifyingType = 'RT-US'
      }
      this.resourceMap = new ResourcesGroupMap(null, null, null)
      this.resourceMap.identifyingId = this.resData.data.id;
      this.resourceMap.identifyingType = identifyingType;
      let changedGroupMapList = this.groupMap.filter(res => res.id == null || !res.isActive);
      const groupMapFilter = changedGroupMapList.filter(res => !(res.id == null && res.isActive === false));
      this.resourceMap.mapping = groupMapFilter;
      // console.log(this.resourceMap);
      // return; 
      this.commonService.createMapGroup(this.resourceMap).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close();
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }
  triggerAction(event) {
    let data = event.data;
    if (event.key == 'ResourceGroupName') {
      let groupdata = { type: 'ResourceGroupName', data: data }
      const dialogRef = this.dialog.open(ResourceMapComponent, {
        data: groupdata, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        });
    } else if (event.key === 'delete') {
      this.singleResourcesDelete(event.data,event.key, this.resData.type);
    } else if (event.key === 'undo') {
      this.singleResourcesDelete(event.data,event.key, this.resData.type);
    }
  }
  getMapResource(id) {
    this.selectedMapResources = [];
    this.isGroupMap = false;
    this.displayMapColumn = ['Resource Code', 'Resource Name', 'Type', 'Status']
    this.displayMapDataColumn = ['code', 'name', 'resourceTypeId', 'status']
    this.commonService.getMapResourcse(id).subscribe(res => {
      if (res.statusCode == 1 && res.results) {
        this.selectedMapResources = res.results;
        this.isGroupMap = true;
        for (let i = 0; i <= this.displayMapDataColumn.length; i++) {
          this.selectedMapResources.map((data) => {
            data[this.displayMapColumn[i]] = data[this.displayMapDataColumn[i]];
          });
        }
      }
    })
  }
  onScroll(event: any) {
  const element = event.target;
  const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
  if (atBottom && this.currentIndex < this.resourceData.length) {
    const nextChunk = this.resourceData.slice(this.currentIndex, this.currentIndex + this.sliceSize);
    this.visibleResources = [...this.visibleResources, ...nextChunk];
    this.currentIndex += this.sliceSize;
      }
  }
  fixClick() {
    console.log('')
  }
}
