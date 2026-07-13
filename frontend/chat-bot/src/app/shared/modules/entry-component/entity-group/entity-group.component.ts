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

import { Component, OnInit, ViewChild,  Inject,  ViewEncapsulation,  } from '@angular/core';
import {  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import { CommonService, ConfigurationService, HospitalService } from '../../../services';
import { EntityGroupModel } from './entity-group.model';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';


@Component({
  selector: 'app-entity-group',
  templateUrl: './entity-group.component.html',
  styleUrls: ['./entity-group.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EntityGroupComponent implements OnInit {
  public tableDataSource: MatTableDataSource<any>;
  public selection = new SelectionModel<any>(true, []);
  public selectedEntity = null;
  public showEntityGroup = true;
  public applyFilterValue: any;
  public entityModel = new EntityGroupModel();
  public groupName = new FormControl();
  public filterKey = new FormControl();
  public entityGroupList : any;
  public headerName = null;
  public displayedData = [ {'colName': 'id', 'title': 'Id', 'dataName': 'id'} ];
  public displayedColumns: string[] = this.displayedData.map(res => res.colName)
  
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  readerGrpButton: string;
  //new entity group
  public tableData = [];  
  entityGroupTypeList = [];
  public entityGroupType = new FormControl("EGTI-AS"); 
  showSideBar = true; 
  isLoading = false;
  public showfilter = false;
  // table related variables
  selectedOption: string = 'all';
  public entityTable = false;
  pageSize:number=10;
  pageStart:number=0; 
  length: any = 0;
  pageHit = false;
  selectedItems = new Set();
  groupedData = [];
  colName = null;
  constructor(public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationService: ConfigurationService, public hospitalService : HospitalService,private readonly dialogRef: MatDialogRef<EntityGroupComponent>,
    private readonly commonService: CommonService, private readonly lookupService: LookupTermService) {
        this.getEntityGroupTypes()
        if(this.data.hasOwnProperty('type') && this.data.type != 'create') {
          this.entityGroupType.setValue(this.data.type)          
        }
        if(this.data.hasOwnProperty('showSideBar')) {
          this.showSideBar =  this.data.showSideBar;
        }
        this.getEntityGroupList();             
  }

  ngOnInit() {
    this.readerGrpButton = this.selectedEntity ? 'Update' : 'Save';
  }
  getEntityGroupTypes() {
    this.lookupService.getAppTermsWrapper('EntityGroupType').subscribe(res => {
        this.entityGroupTypeList = res.EntityGroupType ?? [];
        if(this.data.type == 'create') {
          this.entityGroupTypeList = res.EntityGroupType.filter(val => val.code !== "EGTI-KIT" && val.code !== "EGTI-PA" && val.code !== "EGTI-READER" && 
            val.code !== "EGTI-TAG" && val.code !== "EGTI-PO" && val.code !== "EGTI-STU" && val.code !== "EGTI-STF");
        }
        this.getConfigData();
    })
  }

  getConfigData() {
    this.commonService.getConfigFile('entityGroups-config').subscribe(res => {
      if (res.statusCode === 1) {
        const configData = res.results?.contentObject;
        this.entityGroupTypeList = this.entityGroupTypeList?.filter(res => configData.allowedGroups.includes(res.code));
        if (this.entityGroupTypeList.length) {
          let entityGroupInfo = this.entityGroupTypeList?.map(x => x.code);
          if (entityGroupInfo?.length && !entityGroupInfo.includes('EGTI-AS') && this.data.hasOwnProperty('type') && this.data.type == 'create' ) {
            this.entityGroupType = new FormControl(this.entityGroupTypeList[0].code);
          }
        }
        this.getMetaData();
      } else {
        this.getMetaData();
      }
    });
  }

  getentityType(code) {
    this.getMetaData()
  }

  getMetaData() {
    let entityType = this.entityGroupType.value;
    this.headerName = this.entityModel['header'][entityType];
    if(entityType == 'EGTI-READER' || entityType == 'EGTI-KIT') {
      this.displayedData = this.entityModel.reader
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAllReaders();  
    } else if (entityType == 'EGTI-TAG') {
      this.displayedData = this.entityModel.tag
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAllTags();   
    }else if (entityType == 'EGTI-AS') {
      this.displayedData = this.entityModel.asset
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAllAssets();  
    }else if (entityType == 'EGTI-LOC') {
      this.displayedData = this.entityModel.location
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAlllocations();  
    }else if (entityType == 'EGTI-US') {
      this.displayedData = this.entityModel.user
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAllusers();  
    } else if (entityType === 'EGT-DEP') {
      this.displayedData = this.entityModel.department;
      this.displayedColumns = this.displayedData.map(res => res.colName)
      this.getAllDepartment();
    } else if (entityType === 'EGT-GRA') {
      this.displayedData = this.entityModel.grade;
      this.displayedColumns = this.displayedData.map(res => res.colName);
      this.getAppGradeData();
    }
    this.entityTable = true;
    this.selection.clear()
    if(this.data.hasOwnProperty('entity') && this.data.entity) {
      setTimeout(() => this.entityGroupBinding(this.data.entity), 1100);
    }    
  }
  getEntityGroupList() {
    let entityType = this.entityGroupType.value;
    this.commonService.getEntityGroup(entityType).subscribe(res => {
      if(res.statusCode == 1) {
        const result = res.results;
        // list of entity groups
        this.entityGroupList = result;
      }
    });
  }
  getAllReaders() {
    this.isLoading = true;
    this.configurationService.getAllReaders().subscribe(res => {
      this.isLoading = false;
      if(res.statusCode == 1) {
        let result = res.results;
        result = this.entityGroupType.value == 'EGTI-READER' ? result : result.filter(val => val.hardwareTypeId == 'RHT-BEC')
        this.tableDataSource = new MatTableDataSource<any>(result);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  }
  getAllTags() {
    this.isLoading = true;
    this.configurationService.getAllTag(null,null,null).subscribe(res => {
      this.isLoading = false;
      if(res.statusCode == 1) {
        const result = res.results;
        this.tableDataSource = new MatTableDataSource<any>(result);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  } 
  getAllAssets(name?: string,pageStart?:number, pageSize?:number) {
    this.isLoading = true;
    let isIncludeGroup = this.data.type == 'create' ? false : true;
    let entityGroupId =  this.data ? this.data.entity?.ID : null;
    this.configurationService.getAllAssets(name, this.pageStart, this.pageSize,isIncludeGroup,entityGroupId).subscribe(res => {
      this.isLoading = false;
      if(res.statusCode == 1) {
        this.pageHit = true;
        this.length = res.totalRecords;
        const result = res.results;
        this.tableData = result;
       
        
        this.tableData = this.tableData.map((item) => ({
          ...item,
          ['isSelected']: item['isSelected'] ?? false, 
        }));
        this.tableDataSource = new MatTableDataSource<any>(this.tableData);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  }

  getAlllocations(sText?: string,pageStart?:number, pageSize?:number) {
    this.isLoading = true;
    let isIncludeGroup = this.data.type == 'create' ? false : true;
    let entityGroupId =  this.data ? this.data.entity?.ID : null;
    this.commonService.getAllLocationList(this.pageStart, this.pageSize, null, null, sText,isIncludeGroup,entityGroupId).subscribe(res => {
      this.isLoading = false;
      if(res.statusCode == 1) {
        this.pageHit = true;
        this.length = res.totalRecords;
        const result = res.results;
        this.tableData = result;
        this.tableData = this.tableData.map((item) => ({
          ...item,
          ['isSelected']: item['isSelected'] ?? false, 
        }));
        this.tableDataSource = new MatTableDataSource<any>(this.tableData);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  }
  
  getAllusers( name?: string,pageStart?:number, pageSize?:number ) {
    this.isLoading = true;
    let isIncludeGroup = this.data.type == 'create' ? false : true;
    let entityGroupId =  this.data ? this.data.entity?.ID : null;
    this.hospitalService.getAllUsers( null, null, name, this.pageStart, this.pageSize, null, null, null, isIncludeGroup, entityGroupId).subscribe(res => {
      this.isLoading = false;
      if(res.statusCode == 1) {
        this.pageHit = true;
        this.length = res.totalRecords;
        const result = res.results;
        this.tableData = result;
       

        this.tableData = this.tableData.map((item) => ({
          ...item,
          ['isSelected']: item['isSelected'] ?? false, 
        }));
        this.tableDataSource = new MatTableDataSource<any>(this.tableData);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  }

  getAllDepartment(name?: string, pageStart?: number, pageSize?: number) {
    this.isLoading = true;
    this.commonService.getAllDepartments(this.applyFilterValue).subscribe(res => {
      this.isLoading = false;
      if (res.statusCode == 1) {
        this.pageHit = true;
        this.length = res.totalRecords;
        const result = res.results;
        this.tableData = result;
        this.tableData = this.tableData.map((item) => ({
          ...item,
          ['isSelected']: item['isSelected'] ?? false,
        }));
        this.tableDataSource = new MatTableDataSource<any>(this.tableData);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;
      }
    });
  }
  
  getAppGradeData() {
    this.isLoading = true;
    this.lookupService.getAppTermsWrapper('StudentGrade').subscribe(res => {
      this.isLoading = false;
        this.pageHit = true;
        this.length = res.StudentGrade.length;
        const result = res.StudentGrade ?? [];
        this.tableData = result;
        this.tableData = this.tableData.map((item) => ({
          ...item,
          ['isSelected']: item['isSelected'] ?? false,
        }));
        this.tableDataSource = new MatTableDataSource<any>(this.tableData);
        this.tableDataSource.paginator = this.paginator;
        this.tableDataSource.sort = this.sort;

    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.tableDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.tableDataSource.data.forEach(row => this.selection.select(row));
  }
//new entity group
  masterToggleNew() {
    const isAllNowSelected = this.isAllSelected();
    this.tableDataSource.data.forEach(row => {
      row.isSelected = !isAllNowSelected; 
      if (row.isSelected) {
        this.selection.select(row);
      } else {
        this.selection.deselect(row);
      }
    });
    this.updateTableData();
  }
  entityGroupChange(group) {
    this.showEntityGroup = false;
    if(this.selectedEntity && this.selectedEntity.id == group.id) {
      this.selectedEntity = null;
      this.groupName.setValue(null);
      this.selection.clear();
    } else {
      this.selectedEntity = group;
      this.entityGroupBinding(group)
    }
    this.showEntityGroup = true;
    this.readerGrpButton = this.selectedEntity ? 'Update' : 'Save';
  }
  entityGroupBinding(group) {
    this.groupName.setValue(group.name);
    this.selection.clear()
    this.groupedData = group.groupMapping.filter(val => val.pfEntityGroupId == group.id && val.isActive)
    this.colName = this.entityModel.columnName[this.entityGroupType.value];
    for (let i = 0; i < this.groupedData.length; i++) {
      this.tableDataSource.data.forEach(row => {
        if(this.groupedData[i]['identifyingValue'] == row[this.colName]){
          this.selection.select(row);          
          this.selectedItems.add(row[this.colName]);        
        }
      });
    }    
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue.trim().toLowerCase();
    if (this.applyFilterValue.length > 2){
      if(this.entityGroupType.value == 'EGTI-AS'){
      this.getAllAssets(this.applyFilterValue,this.pageStart,this.pageSize);
      } else if(this.entityGroupType.value == 'EGTI-LOC'){
      this.getAlllocations(this.applyFilterValue,this.pageStart,this.pageSize);
      } else if(this.entityGroupType.value == 'EGTI-US'){
      this.getAllusers(this.applyFilterValue,this.pageStart,this.pageSize);
      }
    } else if(this.applyFilterValue.length == 0) {
      if(this.entityGroupType.value == 'EGTI-AS'){
        this.getAllAssets(this.applyFilterValue,this.pageStart,this.pageSize);
        } else if(this.entityGroupType.value == 'EGTI-LOC'){
        this.getAlllocations(this.applyFilterValue,this.pageStart,this.pageSize);
        } else if(this.entityGroupType.value == 'EGTI-US'){
        this.getAllusers(this.applyFilterValue,this.pageStart,this.pageSize);
        }
    }
    setTimeout(() => {
      // this.tableDataSource.data.forEach(row => {
      //   let colName = this.entityModel.columnName[this.entityGroupType.value];
      //   if (this.selectedItems.has(row[colName])) {
      //     this.selection.select(row);
      //   }
      // });
      const group = this.data?.entity ?? this.selectedEntity;
      this.entityGroupBinding(group);
    }, 500);
  }

  eventTriggers(event){
    this.pageStart = event.pageIndex;
    this.pageSize  = event.pageSize;
    if(this.entityGroupType.value == 'EGTI-AS'){
      this.getAllAssets(this.applyFilterValue,this.pageStart,this.pageSize);
    } else if(this.entityGroupType.value == 'EGTI-LOC'){
      this.getAlllocations(this.applyFilterValue,this.pageStart,this.pageSize);
    }else if(this.entityGroupType.value == 'EGTI-US'){
      this.getAllusers(this.applyFilterValue,this.pageStart,this.pageSize);
    }
    setTimeout(() => {
      // this.tableDataSource.data.forEach(row => {
      //   let colName = this.entityModel.columnName[this.entityGroupType.value];
      //   if (this.selectedItems.has(row[colName])) {
      //     this.selection.select(row);
      //   }
      // });
      const group = this.data?.entity ?? this.selectedEntity;
      this.entityGroupBinding(group);
    }, 500);
  }

  //new entity group All && Selected table codes start
  selectOption(option: string): void {
    this.selectedOption = option;
    if (this.selectedOption === 'all') {
      this.tableDataSource.data = [...this.tableData];  
    } else if (this.selectedOption === 'selected') {
      this.tableDataSource.data = this.tableData.filter(row => row.isSelected);
    }
  }

  updateTableData() { 
    this.tableData = [...this.tableDataSource.data]; 
  }
  //new entity group All && Selected table codes end
  saveEntityGroup() {
    this.selectedEntity =  this.showSideBar == false ? this.data.entity : this.selectedEntity;
    let selectedData = this.selection.selected;
    let postData =  {
      "facilityId": localStorage.getItem(btoa('facilityId')),
      "entityTypeId": this.entityGroupType.value,
      "groupMapping": [],
      "isActive": true,
      "name": this.groupName.value
    } 
    let colName = this.entityModel.columnName[this.entityGroupType.value];
    if(this.selectedEntity == null) {
      selectedData.forEach(val => {
        postData.groupMapping.push({"id" : null, "identifyingValue": val[colName], "isActive": true, "pfEntityGroupId" : null})
      })    
      if(postData.groupMapping.length && selectedData.length) {
        this.commonService.saveEntityGroup(postData).subscribe(res => {
          console.log(res);
          if(res.statusCode == 1) {
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close();
            this.getEntityGroupList();
            this.selectedEntity = null;
            this.entityGroupChange(res.results)
          }          
        })
      } else {
        if(postData.groupMapping.length == 0 || selectedData.length == 0) {
          let msg = 'Should be selected atleast one record..'
          this.toastr.warning('Warning', `${msg}`);
        }            
      }
    } else {
      let selectedEntityGroupMap = this.selectedEntity["groupMapping"].filter(val => val.pfEntityGroupId == this.selectedEntity.id); 
      selectedData.forEach(val => {
        let checkData = selectedEntityGroupMap.filter(res => res.identifyingValue == val[colName] && res.isActive)
        if(checkData.length == 0) {
          postData.groupMapping.push({"id" : null, "identifyingValue": val[colName], "isActive": true, "pfEntityGroupId" : this.selectedEntity.id})
        }                
      })
      selectedEntityGroupMap.forEach(element => {
        let checkData = selectedData.filter(res => res[colName] == element.identifyingValue && element.isActive);          
        if(checkData.length == 0) {
          postData.groupMapping.push({"id" : element.id, "identifyingValue": element.identifyingValue, "isActive": false, "pfEntityGroupId" : this.selectedEntity.id})
        }
      });
      if((postData.groupMapping.length  && selectedData.length) || (this.groupName.value != this.selectedEntity.name)) {    
        postData['id'] = this.selectedEntity.id; 
        this.commonService.UpdateEntityGroup(this.selectedEntity.id, postData).subscribe(res => {
          console.log(res)
          if(res.statusCode == 1) {
            this.toastr.success('Success', `${res.message}`);
            this.dialogRef.close();
            this.getEntityGroupList();
            this.selectedEntity = null;
            this.entityGroupChange(res.results)
          }          
        });
      } else {
        if(postData.groupMapping.length == 0 || selectedData.length == 0) {
          let msg = 'Should be selected atleast one record..'
          this.toastr.warning('Warning', `${msg}`);
        }            
      }
    }
  }
  fixClick() {
    console.log('')
  }
}
