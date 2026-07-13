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
import { Component, OnInit, Inject, Optional, ViewEncapsulation } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { routerTransition } from "../../../router.animations";
import { CommonService, WorkflowService, ConfigurationService, HospitalService } from "../../../shared";
import { CommonMapComponent } from "../../../shared/modules/entry-component/common-map/common-map.component";
import { AssetTransferComponent } from "../../../shared/modules/entry-component/asset-transfer/asset-transfer.component";
import { GatePassComponent } from "../../../shared/modules/entry-component/gate-pass/gate-pass.component";
import { CoasterComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { CreateAssetComponent } from "../../configuration/asset/asset.component";
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { FormControl } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
import { finalize } from "rxjs/operators";
import { EntityGroupComponent } from "../../../shared/modules/entry-component/entity-group/entity-group.component";
import { ConfirmDialogComponent } from "../../../shared/modules/entry-component/layout-save/layout-save.component";
import { ManageAssetComponent } from "../../../shared/modules/entry-component/manage-asset/manage-asset.component";
import { EntityRoutineActivityComponent } from "../../../shared/modules/entry-component/entity-routine-activity/entity-routine-activity.component";
import { AppToastService } from "../../../shared/services/toaster.service";
import { Subscription } from "rxjs";
import { LinkedAssetComponent } from "./linked-asset/linked-asset.component";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from "exceljs/dist/exceljs.min.js";
import { DatePipe } from "@angular/common";
import { LookupTermService } from "../../../shared/lookup-term.service";
import { FacilityTransferComponent } from "../../../shared/modules/entry-component/facility-transfer/facility-transfer.component";
import { AssetOverviewComponent } from "../../../shared/modules/entry-component/asset-overview/asset-overview.component";
import { BulkIdentifierExportComponent } from "../../../shared/modules/entry-component/bulk-identifier-export/bulk-identifier-export.component";

@Component({
  selector: "app-asset",
  templateUrl: "./asset-management.component.html",
  styleUrls: ["./asset-management.component.scss"],
  animations: [routerTransition()],
  encapsulation:ViewEncapsulation.None,
})
export class AssetComponent implements OnInit {
  showAction1 = [];
  AssetAction = [];
  public showActions = this.showAction1;
  displayedColumns: string[] = [];
  selectedRow: any = null;
  public rowData: any;
  public activate_btn: any = [];
  public applyFilterValue = null;
  eventColumn = [];
  iconHeader =[];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  public selectedName: any = null;
  public selectDropdown: any;
  selectedAction = new FormControl();
  public isCheck = false;
  public checkPatientId = null;
  public assetDetails: any = null;
  tableData: any;
  public selectedView = 'table';
  public assetIds=[];
  public loading = false;
  public pageStart = 0;
  public pageSize = 50;
  public length: number;
  public assetTransferSource: any;
  public id:number;
  public rowFilter = [{code:'owned',value:'Owned'},{code:'assigned',value:' Assigned'}];
  public selectFilter = [{ id: 'my department', value: 'MY DEPARTMENT' },{ id: 'my asset', value: 'MY ASSET' },{ id: 'assettype', value: 'ASSET TYPE'}];
  public isMyAsset =null;
  public isMyDepartment=null;
  public isOwnedDepartment = null;
  public isAssignedDepartment = null;
  public assetTypeIds:any;
  public type = null;
  public ownerPermission = null;
  responseColumns=[];
  showTable: boolean=false;
  sortDirection = null;
  sortColumnName = null;
  public refreshInterval : any;
  refreshValue:number = 300*1000;
  isloadDepartmentBasedAssetType = false;
  isloadDepartmentBasedAssetCategory = false;
  public category =null;
  status = null;
  public parentFilter = [
    {
      id: 'asset',
      value: 'ASSET',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myAsset', value: 'My Asset' }, { code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment' ],
      showLabel: false,
      dependentFilter:['my department','ownership']
    },
    {
      id: 'assetCategory',
      value: 'CATEGORY',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'assetType',
      value: 'ASSET TYPE',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'assetStatus',
      value: 'STATUS',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['all']
    },
    {
      id: 'costType',
      value: 'COST TYPE',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    }
  ];
  departmentIds: any =[];
  transferAllowedStatus: any = [];
  public subscription: Subscription;
  statusList: any;
  costList : any;
  costType = null;
  assetTypeList: any;
  departmentList: any;
  userNameList: any;
  costTypeList: any;
  assetCategoryList: any;
  defaultAssetStatus: any;
  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    public toastr: AppToastService,
    private readonly route: ActivatedRoute,
    private dateFormat: DatePipe,
    public hospitalService: HospitalService,
    private readonly lookupTermService: LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    this.getPermissionDropDown();
    this.getInterval()
  }
  async ngOnInit() {
    await this.getDynamicTableColumn();
    await Promise.all([
    this.loadDepartmentFilter(),
    this.loadAssetTypeFilter(),
    this.loadAssetCategoryFilter(),
    this.loadAssetStatusFilter(),
    this.loadAssetCostTypeFilter()
    ])
    await this.checkUserPreference()
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
        if (msg.length) {
          msg = msg[0];
          this.alertBinding(msg);
        }
    });
  }
  

  alertBinding(msg) {
    if(msg['ctx'] === "AssetTransfer"){
      this.refreshPage();
      return
    }
  }
  ngOnDestroy() {
    clearInterval(this.refreshInterval);
    this.subscription.unsubscribe();
  }

  loadDepartmentFilter(){
    return new Promise<void>((resolve) => {
    let userId = localStorage.getItem(btoa('userId'));
    let departmentFilter, ownershipFilter;
    ownershipFilter = this.parentFilter.find(filter => filter.id === 'ownership')
    this.commonService.getUserDepartmentLink(userId).subscribe(res => {
      if (res.statusCode === 1 && Array.isArray(res.results) && res.results.length > 0) {
        const myDepartmentFilter = {
        id: 'my department',
        value: 'MY DEPARTMENT',
        isAll: false,
        selectionType: 'multi',
        subFilters: [],
        defaultSelected: [], 
        enableEmpty: false,
        dependentFilter :[],
        showLabel:false
      };
      const ownershipFilter = {
        id: 'ownership',
        value: 'OWNERSHIP',
        isAll: false,
        selectionType: 'multi',
        subFilters: [{ code: 'owned', value: 'Owned' },{ code: 'assigned', value: 'Assigned' }],
        defaultSelected: ['owned', 'assigned'],
        enableEmpty: false
      };
        this.parentFilter.splice(1, 0, myDepartmentFilter, ownershipFilter);
        departmentFilter = this.parentFilter.find(filter => filter.id === 'my department');
        departmentFilter.subFilters = res.results.map(({ departmentId, departmentName }) => ({
          code: departmentId,
          value: departmentName
        }));
      }
      if(this.departmentIds != null || this.departmentIds?.length >0){
        if(departmentFilter) {
          departmentFilter.defaultSelected = this.departmentIds;
        }
        if(ownershipFilter) {
          if (this.isOwnedDepartment) {
            ownershipFilter?.defaultSelected.push('owned');
          }
          if (this.isAssignedDepartment) {
            ownershipFilter?.defaultSelected.push('assigned');
          }
        }
      }else{
        if(departmentFilter) {
          departmentFilter.defaultSelected = departmentFilter?.subFilters.map(item => item.code);
        }
        if(ownershipFilter){
          ownershipFilter.defaultSelected = ownershipFilter?.subFilters.map(item => item.code);
        }
        this.isOwnedDepartment = true;
        this.isAssignedDepartment = true;
      }
      // based on this boolean we need to load assetType as dependent filter or not
      if (this.isloadDepartmentBasedAssetType && departmentFilter) {
        departmentFilter.dependentFilter.push('assetType');
        departmentFilter.isLoadSubFilters = true;
      }

      // based on this boolean we need to load assetCategory as dependent filter or not
      if (this.isloadDepartmentBasedAssetCategory && departmentFilter) {
        departmentFilter.dependentFilter.push('assetCategory');
        departmentFilter.isLoadSubFilters = true;
      }
      resolve();
      });
      });
  }

  loadAssetTypeFilter(){
    return new Promise<void>((resolve) => {
    const departmentIds = localStorage.getItem(btoa('departmentIds'));
    const assetTypeFilter = this.parentFilter.find(filter => filter.id === 'assetType');
    if(!assetTypeFilter) return resolve();
    const applyDefaultSelection = () => {
      if(this.type != null) {
        assetTypeFilter.defaultSelected = this.type;
      }
    };

    if(departmentIds && this.isloadDepartmentBasedAssetType) {
      this.configurationService.getEntityform(departmentIds, 'department', 'Filter').subscribe(res => {
        assetTypeFilter.subFilters = res?.results?.filter(u => u?.identifyingType === 'AssetType').map(u => ({
          code: u?.identifyingValue,
          value: u?.identifyingValueName
        })) || [];
        applyDefaultSelection();
        resolve();
      });
    }else{
      this.lookupTermService.getAppTermsWrapper('AssetType').subscribe(res => {
        assetTypeFilter.subFilters = res?.AssetType?.map(({ code, value }) => ({ code, value })) || [];
        applyDefaultSelection();
        resolve();
      });
    }
    });
  }

  loadAssetCategoryFilter(){
    return new Promise<void>((resolve) => {
    const departmentIds = localStorage.getItem(btoa('departmentIds'));
    const assetCategoryFilter = this.parentFilter.find(filter => filter.id === 'assetCategory');
    if(!assetCategoryFilter) return resolve();
    const applyDefaultSelection = () => {
      if(this.category != null) {
        assetCategoryFilter.defaultSelected = this.category;
      }
    };

    if(departmentIds && this.isloadDepartmentBasedAssetCategory) {
      this.configurationService.getEntityform(departmentIds, 'department', 'Filter').subscribe(res => {
        assetCategoryFilter.subFilters = res?.results?.filter(u => u?.identifyingType === 'AssetCategory').map(u => ({
          code: u?.identifyingValue,
          value: u?.identifyingValueName
        })) || [];
        applyDefaultSelection();
        resolve();
      });
    }else{
    this.lookupTermService.getAppTermsWrapper('AssetCategory').subscribe(res => {
      const assetCategoryFilter = this.parentFilter.find(filter => filter.id === 'assetCategory');
      if(assetCategoryFilter){
        assetCategoryFilter.subFilters = res?.AssetCategory.map(({ code, value }) => ({ code, value })) ?? [];
        applyDefaultSelection();
        resolve();
       }
      });
      }
    })
  }

  loadAssetStatusFilter(): Promise<void> {
    return new Promise((resolve) => {
      const statusFilter = this.parentFilter.find(f => f.id === 'assetStatus');
      this.lookupTermService.getAppTermsWrapper('AssetStatus').subscribe({next: (res) => {
          this.statusList = res?.AssetStatus.map(item => ({
            code: item.code,
            value: item.value
          })) ?? [];

          statusFilter.subFilters = this.statusList;
          if (this.status === null || this.status?.length ==0) {
             //during intial load prevent check of decommision, condemed and disposal assetstatus
            statusFilter.defaultSelected = this.statusList?.filter(s => s.code !== 'ATS-DI' && s.code !== 'ATS-DE' && s.code !=='ATS-COND').map(s => s.code);
            this.status = [...statusFilter.defaultSelected];
          }else{
            statusFilter.defaultSelected = this.status
          }

          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadAssetCostTypeFilter(): Promise<void> {
    return new Promise((resolve) => {
      const costTypeFilter = this.parentFilter.find(f => f.id === 'costType');
      this.lookupTermService.getAppTermsWrapper('CostType').subscribe({next: (res) => {
          this.costList = res?.CostType.map(item => ({
            code: item.code,
            value: item.value
          })) ?? [];

          costTypeFilter.subFilters = this.costList;
          if (this.costType === null || this.costType?.length ==0) {
            //during intial load prevent check of loan and demo costtypes
            // costTypeFilter.defaultSelected = this.costList?.filter(s => s.code !== 'CT-DM' && s.code !== 'CT-LN').map(s => s.code);
            costTypeFilter.defaultSelected = this.costList?.map(s => s.code);
            this.costType = [...costTypeFilter.defaultSelected];
          }else{
            costTypeFilter.defaultSelected = this.costType
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(data => {
      let menuCode = localStorage.getItem(btoa('menuCode'));
      if (data?.results ) {
        const contentData = JSON.parse(data.results.content);
        if (contentData.hasOwnProperty(menuCode)){
          this.refreshValue = contentData[menuCode].interval * 1000;
        }
        }
         this.checkInterval();
    });
  }

  checkInterval() {
    this.refreshInterval = setInterval(() => {
      this.getAssetLocationDetails(false,null,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
    }, this.refreshValue);
  }
  
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'manageFilter') {
      this.manageFilter(event);
    } else if (event.key === 'manageWorklist') {
      this.manageWorklist(event);
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  manageGroupFilter(event) {
    let filterInfo = event.data
    let department = filterInfo.filter(filter => filter.id === 'my department').map(code => code.data);
    let asset = filterInfo.filter(filter => filter.id === 'asset').map(code => code.data);
    let assetType = filterInfo.filter(filter => filter.id === 'assetType').map(code => code.data);
    let ownership = filterInfo.filter(filter => filter.id === 'ownership').map(code => code.data);
    let assetCategory = filterInfo.filter(filter =>filter.id === 'assetCategory').map(code => code.data);
    let statusList = filterInfo.filter(filter =>filter.id === 'assetStatus').map(code=>code.data);
    let costList = filterInfo.filter(filter=>filter.id ==='costType').map(code=>code.data);
    this.isOwnedDepartment = ownership.includes('owned') ? true : null;
    this.isAssignedDepartment = ownership.includes('assigned') ? true : null;
    this.isMyAsset = asset.includes('myAsset') ? true : null;
    this.type = assetType.length ? assetType : null;
    this.category = assetCategory?.length ? assetCategory : null;
    let departmentIds = department.filter(val => val !== 'owned' && val !== 'assigned');
    this.departmentIds = departmentIds.map(id => parseInt(id, 10));
    this.isMyDepartment = asset.includes('myDepartment') && departmentIds?.length > 0 ? true : null;
    this.status = statusList?.length ? statusList : null;
    this.costType = costList?.length ? costList : null;
    this.saveAssetPreference(department, asset, assetType, ownership,assetCategory,statusList,costList);
    this.getAssetLocationDetails(false, null,this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
  }

  manageWorklist(event) {
    this.type = null;
    if (event.data === 'owned') {
      this.isMyDepartment = true;
      this.isMyAsset = null;
      this.type = null;
      this.isOwnedDepartment = true;
      this.isAssignedDepartment = null;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize,  null,true, null, this.isOwnedDepartment,null,null);
    } else if (event.data === 'assigned') {
      this.isMyDepartment = true;
      this.isMyAsset = null;
      this.type = null;
      this.isOwnedDepartment = null;
      this.isAssignedDepartment = true;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize,  null,true, null,null,this.isAssignedDepartment,null);
    } else {
      this.type = event.data;
      this.isMyAsset = null;
      this.isOwnedDepartment = null;
      this.isAssignedDepartment = null;
      this.isMyDepartment =null;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize, null, null, this.type, null,null,null);
    }
  }

  manageFilter(event) {
    if (event.data === 'assettype') {
      this.loading=true;
      this.lookupTermService.getAppTermsWrapper('AssetType').subscribe(res => {
        this.rowFilter = res?.AssetType.map(({ code, value }) => ({ code, value })) ?? [];
      });
      this.loading =false;
    } else if (event.data === 'my asset') {
      this.rowFilter = [];
      this.type = null;
      this.isMyAsset = true;
      this.isMyDepartment = null;
      this.isOwnedDepartment = null;
      this.isAssignedDepartment = null;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize, true, null, null, null,null,null);
    } else if (event.data === 'my department') {
      this.rowFilter = [{ code: 'owned', value: 'Owned' },{ code: 'assigned', value: 'Assigned' }];
      this.type = null;
      this.isMyDepartment = true;
      this.isMyAsset = null;
      this.isOwnedDepartment = null;
      this.isAssignedDepartment = null;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize, null, true, null, null,null,null,null);
    } else if (event.data === 'WD_AMAL') {
      this.rowFilter = [];
      this.type = null;
      this.isMyAsset = null;
      this.isMyDepartment = null;
      this.isOwnedDepartment = null;
      this.isAssignedDepartment = null;
      this.getAssetLocationDetails(false, null, this.pageStart, this.pageSize, null, null, null, null,null,null,null);
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getAssetLocationDetails(false,this.applyFilterValue,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.assetTypeIds,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
      }else if (this.applyFilterValue.length == 0){
        this.getAssetLocationDetails(false,null,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.assetTypeIds,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
    }
  }

  rowClick(row) {
    this.selectDropdown = null;
    if (this.selectedRow && row.assetId == this.selectedRow) {
      this.isCheck = false;
      this.selectedName = null;
      this.selectedRow = null;
      this.showActions = this.showAction1;
      this.checkPatientId = null;
      this.selectedAction.setValue(null);
    } else {
      this.selectedRow = row.assetId;
      this.selectedName = row;
      this.showActions = [...this.AssetAction];
      this.checkPatientId = row.assetId;
      this.isCheck = true;
      const isRetiredAsset = row.assetTransferTypeId === 'ATT-RT';
      const isNormalTransfer = ['ATT-TR', 'ATT-TRT'].includes(row.assetTransferTypeId);
      const allowManageTransfer =(row.transferEventStatusId === null || row.transferEventStatusId === 'ATE-COM') && this.transferAllowedStatus.includes(row?.assetStatusId);
      const showGatepass = row.gatePassStatusId === null && row.transferEventStatusId === 'ATE-PEN' && isNormalTransfer;
      if (isRetiredAsset) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer', 'Gatepass'].includes(a.value));
      }
      if (!allowManageTransfer) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer'].includes(a.value));
      }
      if (!showGatepass) {
        this.showActions = this.showActions.filter(a => a.value !== 'Gatepass');
      }
    }
  }

  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission?.dropdown;
    const assetAll = this.parentFilter.find(filter => filter.id === 'asset');
    const dropdownOption = dropdown.find(x =>x.page === 'workflow' &&  x.name=== 'ALL');
    if(dropdownOption) {
      this.selectFilter.push({ id: dropdownOption.code, value: dropdownOption.name });
    }
    if(assetAll && dropdownOption){
      assetAll.subFilters.push({code: dropdownOption.code, value: dropdownOption.name})
    }
    let assetPermissions = dropdown?.filter(x => x.page === "workflow" && x.parentCode === "MN_OTAM");
    let createActionCodes=['WD_AMCA','WD_AMGR', 'WD_AMGB', 'WD_AMGQ','WD_AMPR','WD_AMSE','WD_AMDBQR'];
    const createAction = assetPermissions?.filter(item => createActionCodes.some(code => item.code.includes(code)));
    if (this.activate_btn?.includes('BT_HPISDMA')) {
      createAction.push({code: 'BT_HPISDMA',name: 'Export Template'});
    }
    this.showAction1.push(...createAction.map(x => ({ id: x.code, value: x.name })));
    let modifyActionCodes =['WD_AMMPR','WD_AMMDA','WD_AMTR','WD_AMGTP','WD_AMMR','WD_AMFTR']
    const modifyAction = assetPermissions?.filter(item => modifyActionCodes.some(code => item.code.includes(code)));
    this.AssetAction.push(...modifyAction.map(x => ({ id: x.code, value: x.name })));
    this.showActions = this.showAction1;
  }

  saveAssetPreference(department, asset, assetType,ownership,assetCategory,statusList,costTypeList){
    let preferenceData = {};
    preferenceData = {
      "asset": asset,
      "department": department,
      "assetType": assetType,
      "ownership": ownership,
      "assetCategory": assetCategory,
      "assetStatus": statusList,
      "costType": costTypeList
    };
    let lastData = JSON.stringify(preferenceData)
    this.commonService.validateUserPreference('assetFilters', lastData)
  }
  getAssetLocationDetails(routerEvent ?: boolean,name?: string,pageStart?:number,pageSize?:number,isMyAsset?:boolean, isMyDepartment?:boolean,assetTypeIds?:string,isOwnedDepartment?,isAssignedDepartment?,departmentIds?,assetCategoryIds?,status?,costType?)  {
    this.loading = true;
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.assetManagements.results;
      this.length = this.route.snapshot.data.assetManagements.totalRecords;
      let Columns = ["ID","tagSerialNumber","assetCategoryName","assetSerialNumber", "assetName","assetTypeName","productSerialNumber","modelId",
       "currentLocationName","ownerDepartment","assignedDepartment", "assetTransferTypeName","transferEventStatus","costTypeName","isGatePassAcknowledged","status","isIdleInLocation"];
       if(this.responseColumns.length){
        Columns = this.responseColumns;
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      if (this.selectedName != null) {
        this.setShowAction(this.selectedName);
      }
      this.loading=false;
    } else {
      this.getNonRouterAssetLocDetails(name, pageStart, pageSize,isMyAsset,isMyDepartment,assetTypeIds,isOwnedDepartment,isAssignedDepartment,departmentIds,assetCategoryIds,status,costType);
    }
  }

  setShowAction(selectedName) {
    selectedName = this.tableData.find(
      (res1) => res1.assetId === selectedName.assetId
    );
      this.showActions = [...this.AssetAction];
      const isRetiredAsset = selectedName.assetTransferTypeId === 'ATT-RT';
      const isNormalTransfer = ['ATT-TR', 'ATT-TRT'].includes(selectedName.assetTransferTypeId);
      const allowManageTransfer =(selectedName.transferEventStatusId === null || selectedName.transferEventStatusId === 'ATE-COM') && this.transferAllowedStatus.includes(selectedName?.assetStatusId);
      const showGatepass = selectedName.gatePassStatusId === null && selectedName.transferEventStatusId === 'ATE-PEN' && isNormalTransfer;
      if (isRetiredAsset) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer', 'Gatepass'].includes(a.value));
      }

      if (!allowManageTransfer) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer'].includes(a.value));
      }

      if (!showGatepass) {
        this.showActions = this.showActions.filter(a => a.value !== 'Gatepass');
      }
  }

  getNonRouterAssetLocDetails(name, pageStart, pageSize,isMyAsset,isMyDepartment,assetTypeIds,isOwnedDepartment,isAssignedDepartment,departmentIds,assetCategoryIds,status,costType) {
    assetCategoryIds = this.parentFilter.find(filter => filter.id === 'assetCategory')?.subFilters?.length  ===  assetCategoryIds?.length  ? null : assetCategoryIds;
    assetTypeIds =  this.parentFilter.find(filter => filter.id === 'assetType')?.subFilters?.length  === assetTypeIds?.length ? null : assetTypeIds;
    status =  this.parentFilter.find(filter => filter.id === 'assetStatus')?.subFilters?.length  === status?.length ? null : status;
    costType =  this.parentFilter.find(filter => filter.id === 'costType')?.subFilters?.length  === costType?.length ? null : costType;
    this.workflowService.getAssetLocationDetails(name, pageStart, pageSize,isMyAsset,isMyDepartment,assetTypeIds,isOwnedDepartment,isAssignedDepartment,departmentIds,assetCategoryIds,status,costType).subscribe((res) => {
      this.length = res.totalRecords;
      if(res.results.length || !this.applyFilterValue) {
        this.tableData = res.results;
      }
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue;
      }
      let Columns = ["ID", "tagSerialNumber","assetCategoryName","assetSerialNumber","assetName", "assetTypeName","productSerialNumber","modelId",
        "currentLocationName","ownerDepartment","assignedDepartment", "assetTransferTypeName","transferEventStatus","costTypeName","isGatePassAcknowledged","status", "isIdleInLocation"];
        if(this.responseColumns.length){
        Columns = this.responseColumns;
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      if (this.selectedName != null) {
      this.showActions = [...this.AssetAction];
      const isRetiredAsset = this.selectedName.assetTransferTypeId === 'ATT-RT';
      const isNormalTransfer = ['ATT-TR', 'ATT-TRT'].includes(this.selectedName.assetTransferTypeId);
      const allowManageTransfer =(this.selectedName.transferEventStatusId === null || this.selectedName.transferEventStatusId === 'ATE-COM') && this.transferAllowedStatus.includes(this.selectedName?.assetStatusId);
      const showGatepass = this.selectedName.gatePassStatusId === null && this.selectedName.transferEventStatusId === 'ATE-PEN' && isNormalTransfer;
      if (isRetiredAsset) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer', 'Gatepass'].includes(a.value));
      }
      
      if (!allowManageTransfer) {
        this.showActions = this.showActions.filter(a => !['Manage Transfer','Facility Transfer'].includes(a.value));
      }

      if (!showGatepass) {
        this.showActions = this.showActions.filter(a => a.value !== 'Gatepass');
      }
      }
      this.loading=false;
    });
  }

  async getDynamicTableColumn() {
      const res: any = await this.commonService.getDynamicTableColumn('asset').toPromise();
      if(res?.statusCode === 1 && res?.results?.contentObject) {
        this.transferAllowedStatus = res?.results?.contentObject?.transferAllowedStatus??['ATS-INU'];
        const roleId = localStorage.getItem('roleId');
        let dynamicColumns = null;
        if (roleId && res.results.contentObject?.role && res.results.contentObject.role[roleId]) {
          dynamicColumns = res.results.contentObject.role[roleId];
        } else {
          dynamicColumns = res.results.contentObject;
        }
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.columns;
        this.isloadDepartmentBasedAssetType = dynamicColumns.isLoadDepartmentBasedAssetType;
        this.isloadDepartmentBasedAssetCategory = dynamicColumns.isLoadDepartmentBasedAssetCategory;
        this.pageSize = dynamicColumns.pageSize ?? this.pageSize;
        this.showTable = true;
      }
      // this.getAssetLocationDetails(true,null,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category);
      // this.checkUserPreference()
  }

  currentLocation(data) {
    const rowData = {
      type: 'asset',
      floorid: data.floorId,
      tagid: data.tagSerialNumber,
    };
    this.dialog.open(CommonMapComponent, {
      data: rowData,
      panelClass: 'medium-popup',
      disableClose: true,
    });
  }

  currentLocationData(rowData: any, event: any) {
    this.rowData = rowData;
    this.selectedName = rowData.id;
    rowData['tagType'] = 'Asset';
    if (rowData.tagSerialNumber != null && rowData.floorId != null) {
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        data: rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.getAssetLocationDetails(false, this.applyFilterValue, this.pageStart, this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
      });
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.selectedName = null;
    this.selectedRow = null;
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAssetLocationDetails(false,this.applyFilterValue,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
  }

  getAllAssets(data, selectedTab) {
    this.configurationService.getAllAsset(data.assetId).subscribe(res => {
      if (res.results && res.results.length > 0) {
      this.rowData = res.results[0];
      }
      if(selectedTab){
        this.rowData['selectedTab'] = selectedTab
      }
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_MD');
      const dialogRef = this.dialog.open(CreateAssetComponent, {
        data: this.rowData,
        panelClass: ['large-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectedAction.setValue(null);
        this.refreshPage();
      });
    })
  }

  manageTransfer(data) {
    const departmentIds:any = localStorage.getItem(btoa('departmentIds')) || [];
    const hasTransferInitiatePermission = this.activate_btn?.includes('BT_AM_TI') ?? false;
    let permission1 = departmentIds?.includes(Number(data?.ownerDepartmentId)) && hasTransferInitiatePermission;
    let permission2 = departmentIds?.includes(Number(data?.assignedDepartmentId)) && hasTransferInitiatePermission;
    const transfer = ['ATT-BRD', 'ATT-SV','ATT-RT','ATT-BR','ATT-SRT'];
    const isStatus = transfer.includes(data.assetTransferTypeId);
    const finalPermission1 = isStatus ? true : permission1;
    const finalPermission2 = isStatus ? true : permission2;
    let permission = data.assetTransferTypeId === 'ATT-AT' ? finalPermission1 : finalPermission2;
      if (!permission) { // NO permission
          this.toastr.warning('Warning', 'User does not have Permission to Transfer Asset');
          this.selectedName = null;
          return;
      }

      const blockedStatuses = ['ATE-INI', 'ATE-PEN', 'ATE-GISD', 'ATE-GEXP'];//Transfer not allowed status either asset status is not in inuse or inuse inbetween events
      if (!this.transferAllowedStatus.includes(data.assetStatusId) || blockedStatuses.includes(data.transferEventStatusId)) {
          this.toastr.warning('Warning', 'User does not have Permission to Transfer Asset');
          this.selectedName = null;
          return;
      }

      if (data.assetTransferTypeId === 'ATT-RT') {// Retire Asset status
          this.toastr.warning('Warning', 'Retire Asset cannot be transfered');
          this.selectedName = null;
          return;
      }

      this.configurationService.getAllAsset(data.assetId).subscribe(res => {
        if (res.results && res.results.length > 0) {
        this.rowData = res.results[0];
        }
      this.rowData['homeLocationName'] = data['homeLocationName'];
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_ASTF');
      const dialogRef = this.dialog.open(AssetTransferComponent, {
        data: this.rowData,
        panelClass: ['small-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectedAction.setValue(null);
        this.refreshPage();
      });
    });
    this.selectedName=null;
  }

  manageGatePass(data) {
    if (data.costTypeId ==='CT-LN' || data.costTypeId ==='CT-STB' || data.costTypeId ==='CT-DM'){
      this.configurationService.getAllAsset(data.assetId).subscribe(res => {
        if (res.results && res.results.length > 0) {
        this.rowData = res.results[0];
        }
        this.rowData['gatePassStatusId'] = data.gatePassStatusId
        // this.rowData['isTemp'] = true
        localStorage.setItem('user_guide_menu_code', 'MN_FAAS_GTPS');
        const dialogRef = this.dialog.open(GatePassComponent, {
          data: this.rowData,
          panelClass: 'medium-popup',
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe(() => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'))
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectedAction.setValue(null);
          setTimeout(()=>this.refreshPage(),2000)
        });
      });
    } else {
        this.getTransferDetail(data);
    }
  }

  getTransferDetail(data) {
    this.commonService.getLatestTransferDetail(data.assetId).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP"? departmentIds.includes(Number(department.results.sourceTransferId)) : true; 
      if (isApproved) {
        this.assetGatePass(data, department);
      } else {
        this.toastr.warning('Warning', 'User does not have permission to generate Gatepass for this asset');
      }
      this.selectedName = null;
    });
  }

  assetGatePass(data, department) {
    this.configurationService.getAllAsset(data.assetId).subscribe(res => {
      if (res.results && res.results.length > 0) {
      this.rowData = res.results[0];
      }
      if ( department.results.transferType ==='TRT-DEP'){
        this.rowData['assignedLocationName'] = data.assetTransferTypeId === 'ATT-TR' ? data.assignedDepartment : data.ownerDepartment;
        this.rowData['homeLocationName'] = data.assetTransferTypeId === 'ATT-TR' ? data.ownerDepartment : data.assignedDepartment;
      } else {
        this.rowData['assignedLocationName'] = data.assetTransferTypeId === 'ATT-TR' ? data.assignedLocationName : data.homeLocationName;
        this.rowData['homeLocationName'] = data.assetTransferTypeId === 'ATT-TR' ? data.homeLocationName : data.assignedLocationName;
      }
      this.rowData['isTemp']=false;
      this.rowData['isGatePassIssued']=false;
      this.rowData['gatePassStatusId'] = data.gatePassStatusId;
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_GTPS');
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: this.rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectedAction.setValue(null);
        setTimeout(()=>{this.refreshPage()},2000)
      });
    });
  }

  manageFacilityTransfer(data){
    this.configurationService.getAllAsset(data.assetId).subscribe(res => {
        if (res.results && res.results.length > 0) {
        this.rowData = res.results[0];
        }
      this.rowData['homeLocationName'] = data['homeLocationName'];
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_ASTF');
      const dialogRef = this.dialog.open(FacilityTransferComponent, {
        data: this.rowData,
        panelClass: ['small-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectedAction.setValue(null);
        this.refreshPage();
      });
    });
    this.selectedName=null;
  }

  changeAssetStatus(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Asset Status',
        message:
          'Do you wish to mark this asset as Not Functioning / Needs Service?',
        assetId: data.assetId,
        assetName: data.assetName,
        buttonText: { cancel: 'No', ok: 'Yes' },
        assetStatus: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedAction.setValue(null);
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }

  getPorterRequest(data) {
    this.selectDropdown = 'porter';
    if (data.porterRequestId && data.porterRequestId !== null) {
      this.workflowService.getPorterRequest(data.porterRequestId).subscribe((res) => {
        const porterData = res.results.length?res.results[0]:null;
        localStorage.setItem('user_guide_menu_code', 'MN_FAAS_PORQ');
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: porterData,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'))
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectDropdown = null;
          this.refreshPage();
        });
      });
    } else {
        this.configurationService.getAllAsset(data.assetId).subscribe(res => {
          if (res.results && res.results.length > 0) {
          this.rowData = res.results[0];
          }
          localStorage.setItem('user_guide_menu_code', 'MN_FAAS_PORQ');
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: {type: 'PR-AT', id: this.rowData.id, assetTypeId: this.rowData.assetTypeId, name: this.rowData.assetName},
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'))
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectDropdown = null;
          this.refreshPage();
        });
      });
    }
  }

  manageAction(value, data) {
    if (value === 'WD_AMMDA') {
      this.getAllAssets(data,null);
    } else if (value === 'WD_AMTR') {
      this.manageTransfer(data);
    } else if(value === 'WD_AMFTR'){
      this.manageFacilityTransfer(data);
    }else if (value === 'WD_AMGTP') {
      let payload  ={data: data}
      this.manageEventGatePass(payload);
    } else if (value === 'WD_AMSE') {
      this.changeAssetStatus(data);
    } else if (value === 'WD_AMMPR' && data !== true) {
      this.getPorterRequest(data);
    } else if (value === 'WD_AMPR' && data === true) {
      this.showActions = null;
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_PORQ');
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-OT', id: '0', name: 'others'},
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown = null;
        this.refreshPage();
      });
    } else if (value === 'WD_AMGQ' || value === 'WD_AMGB') {
      this.selectDropdown = value;
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: 'confirmation-popup',
        data: {
          title: 'Confirmation',
          message: 'Do you want to generate identifier for all assets?',
          buttonText: { ok: 'Yes', cancel: 'No' }
        }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          let codeType = (value === 'WD_AMGQ') ? 'QR_CODE' : 'BAR_CODE';
          let category = this.parentFilter.find(filter => filter.id === 'assetCategory')?.subFilters?.length  ===  this.category?.length  ? null : this.category;
          let type =  this.parentFilter.find(filter => filter.id === 'assetType')?.subFilters?.length  === this.type?.length ? null : this.type;
          let status =  this.parentFilter.find(filter => filter.id === 'assetStatus')?.subFilters?.length  ===  this.status?.length ? null :  this.status;
          let costType =  this.parentFilter.find(filter => filter.id === 'costType')?.subFilters?.length  ===  this.costType?.length ? null :  this.costType;
          this.workflowService.getAssetLocationDetails(null,null,null,this.isMyAsset,this.isMyDepartment, type, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentIds, category, status,costType).subscribe((res) => {
            this.assetIds = res.results.map(asset => asset.assetId.toString());
            this.configurationService.generateBulkQrBarcode(this.assetIds,'Asset', codeType).pipe(
              finalize(() => {
                this.selectDropdown = null;
                this.refreshPage();
              })
            ).subscribe(
              (res) => {
                this.toastr.success('Success', `${res.message}`);
              },
              (error) => {
                this.toastr.error('Error', error.error.message,);
              });
          });
        } else {
          this.selectDropdown = null;
          this.refreshPage();
        }
      });
    } else if (value === 'WD_AMCA'){
      this.selectDropdown = value;
      let rowData='';
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_CR');
      const dialogRef = this.dialog.open(CreateAssetComponent, {
        data:rowData,
        panelClass: ['large-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown=null;
        this.refreshPage();
      });
    } else if ( value === 'WD_AMGR'){
      this.selectDropdown = value;
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_ETGP');
        const dialogRef = this.dialog.open(EntityGroupComponent, {
          panelClass: ["medium-popup"], disableClose: true,
          data: { type : 'EGTI-AS' },
        });
        dialogRef.afterClosed().subscribe(result => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'))
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectDropdown = null;
          this.refreshPage();
        })
    }else if ( value === 'WD_AMMR'){
      data["tabType"] = "Asset";
      this.selectDropdown = value;
      data["entityType"] = 'Asset';
      data["entityId"] = data.assetId;
      data["entityName"] = data.assetName;
      data["titleName"]= "Asset Routine"
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_ROU');
      const dialogRef = this.dialog.open(EntityRoutineActivityComponent, {
        data: data,
        panelClass: ["medium-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown = null;
        this.refreshPage();
      });
    }else if(value === 'BT_HPISDMA'){
        this.selectDropdown = value;
        this.downloadBulkAsset();
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown = null;
        this.refreshPage();
    } else if(value === 'WD_AMDBQR'){
        this.selectDropdown = value;
        this.bulkQRExport();
    }
  }
  manageCoster(data) {
    data['workflowTypeId'] = 'WF-AST';
    data['associationId'] = data.assetId;
    data['associationTypeId'] = 'TAT-AS';
    data['associatedName'] = 'Asset';
    localStorage.setItem('user_guide_menu_code', 'MN_FAAS_DAD');
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }

  manageEventStatus(event) {
    const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
    const isReturnStatus = returnStatus.includes(event.data.assetTransferTypeId);
    const permission1 = isReturnStatus ? this.activate_btn.includes('BT_AM_RAT') : this.activate_btn.includes('BT_AM_AT');
    const permission2 = isReturnStatus ? this.activate_btn.includes('BT_AM_RATA') : this.activate_btn.includes('BT_AM_ATA');
    const statusId = event.data.transferEventStatusId;

    if (!statusId ||['ATE-GISD', 'ATE-GEXP','ATE-COM'].includes(statusId)||!(event.data.gatePassStatusId == null || event.data.gatePassStatusId == 'ATE-GENP')) {
      this.selectedName = event.data;
      return;
    }
    this.loading = true;
    this.commonService.getLatestTransferDetail(event.data.assetId).subscribe(department => {
      const departmentIds:any = localStorage.getItem(btoa('departmentIds') || '[]');
      const transfer = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
      const isStatus = transfer.includes(event.data.assetTransferTypeId);
      const approved = department?.results?.transferType === "TRT-DEP"? (isStatus || departmentIds.includes(Number(department.results.sourceTransferId))): true;
      const pending = department?.results?.transferType === "TRT-DEP"? (isStatus || departmentIds.includes(Number(department.results.transferId))): true;
      const isApprovedStatus = statusId === 'ATE-INI' && approved;
      const isPendingStatus = (statusId === 'ATE-PEN' || statusId ==='ATE-GENP') && pending;
      if (isApprovedStatus || isPendingStatus) {
        const targetStatus = isApprovedStatus ? 'ATE-PEN' : 'ATE-COM';
        const permission = isApprovedStatus ? permission1 : permission2;
        this.commonService.getLatestTransferDetail(event.data.assetId).subscribe(latest => {
          let sourceId=  latest.results.transferType == "TRT-DEP" ? event?.data?.ownerDepartmentId : latest.results.transferType == "TRT-FAC"?localStorage.getItem(btoa('facilityId')): event?.data?.homeLocationId;
          const jsondata = {
            transferType: latest.results.transferType,
            transferId: latest.results.transferId,
            sourceIdentifier : sourceId,
            destinationIdentifier: latest.results.transferId,
            assetTransferType: event.data.assetTransferTypeId,
            eventId: 'ATT-ACEV',
            eventStatusId: targetStatus,
            id: event.data.assetId,
            isExcludeParent: false,
            linkedAssets: [],
            comments: null
          };
          if(permission){
            this.getAssetTransferDetails(event, jsondata);
          }else{
             this.loading = false;
             this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
          }
        });
      } else {
        this.loading = false;
        this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
      }
    });
  }

  getAssetTransferDetails(event, jsondata) {
     this.commonService.getAssetTransferDetails(event.data.assetId, event.data.assetTransferTypeId).subscribe(details => {
      this.loading = false;
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_ASTF');
      const dialogRef = this.dialog.open(ManageAssetComponent, {
        panelClass: ['small-popup'],
        disableClose: true,
        data: {
          assetdata: jsondata,
          assetInfo: event.data,
          transferData: details.results
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.refreshPage();
      });
    });
  }

  manageEventGatePass(event) {

    //Temporarily Costtype based change commented
    // const costType = event.data.costTypeId;
    // const isExemptCostType = costType === 'CT-LN' || costType === 'CT-STB' || costType === 'CT-DM';
    // const isGatePassNull = event.data.isGatePassIssued === null;
    
    // if (isGatePassNull || isExemptCostType) {
    //   this.selectedName = event.data;
    //   return;
    // }
    this.commonService.getLatestTransferDetail(event.data.assetId).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP"? departmentIds.includes(Number(department.results.sourceTransferId)) :true;
      
      if (!isApproved) {
        this.toastr.warning('Warning', 'User does not have permission to generate Gatepass for this asset');
        return;
      }
      this.manageGetAllAsset(event, department);
    })
  }

  manageGetAllAsset(event, department) {
    this.configurationService.getAllAsset(event.data.assetId).subscribe(res => {
      if (res.results && res.results.length > 0) {
        this.rowData = res.results[0];
      }
      const isTransfer = event.data.assetTransferTypeId === 'ATT-TR';
      let sourceId = department.results.sourceTransferId;
      let source =  department.results.sourceTransferName;
      let destinationId = department.results.transferId;
      let destination = department.results.transferName;
      this.rowData['sourceIdentifier'] = isTransfer? sourceId : destinationId;
      this.rowData['destinationIdentifier'] = isTransfer? destinationId: sourceId;
      this.rowData['assignedLocationName'] = isTransfer ? destination : source;
      this.rowData['homeLocationName'] = isTransfer ? source: destination;
      this.rowData['transferType'] = department.results.transferType,
      this.rowData['isGatePassIssued'] = true;
      this.rowData['hideButton'] = event.data.gatePassStatusId ==='ATE-GENP' ? true : false;
      this.rowData['gatePassStatusId'] = event.data.gatePassStatusId ?? null;
      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_GTPS');
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: this.rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(result => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectedAction.setValue(null);
        setTimeout(() => this.refreshPage(), 2000);
      });

      this.refreshPage(); 
    });
  }
  eventAction(event) {
    this.dialog.closeAll();
    const actions: Record<string, () => void> = {
      'Asset Name': () => this.sensorSummaryInfo(event.data),
      'Current Location': () => this.currentLocationData(event.data, ''),
      'Status': () => this.handleStatus(event),
      'Event Status': () => this.manageEventStatus(event),
      'pagination': () => this.handlePagination(event),
      'GatePass': () => this.handleGatePass(event),
      'sort': () => this.handleSort(event),
      'Alert': () => this.getAllAssets(event.data, event?.patientId),
      'Linked Asset': () => this.linkedasset(event.data),
      'Report': () => this.getReportLayout(event.data),
      'Overview':() => this.getAssetOverview(event.data)
    };
    (actions[event.key] || (() => this.manageCoster(event.data)))();
  }

  handleStatus(event) {
    const allowManageTransfer =((event.data.transferEventStatusId === null || event.data.transferEventStatusId === 'ATE-COM') && this.transferAllowedStatus.includes(event.data?.assetStatusId)) && this.AssetAction?.some(action => action.id === 'WD_AMTR');
    if(allowManageTransfer){
      this.manageAction('WD_AMTR',event.data);
    }else{
      this.toastr.warning('Warning', 'User does not have Permission to Transfer Asset');
    }
  }

  handlePagination(event) {
    this.pageSize = event.data.pageSize;
    this.pageStart = event.data.pageIndex;
    if(this.applyFilterValue) {
      this.applyFilterValue = this.applyFilterValue.trim()?.toLowerCase();
    }
    this.getAssetLocationDetails(false, this.applyFilterValue, this.pageStart, event.data.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
  }

  handleGatePass(event) {
    if(event.data?.gatePassStatusId != null){
      this.manageEventGatePass(event);
    }else{
      this.selectedName = event.data;
    }
  }
  
  handleSort(event) {
    const index = this.displayedColumns.indexOf(event.data.active);
    this.sortDirection = event.data.direction.toUpperCase();
    this.sortColumnName = this.responseColumns[index];
    this.getAssetLocationDetails(false,null,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
  }

  getReportLayout(data) {
    data['content'] = 'layout'
    data['linkedResourceCode'] = 'BT_ASTRPT';
    this.dialog.open(CommonDialogComponent,
    { data : data, panelClass: ['medium-popup'], disableClose: false });
  }
  
  sensorSummaryInfo(rowData: any) {
    this.loading=true;
    this.configurationService.getAllAsset(rowData.assetId).subscribe(res => {
      if (res.results && res.results.length > 0) {
        this.rowData = res.results[0];
        this.loading=false;
      }
    localStorage.setItem('user_guide_menu_code', 'MN_FAAS_MD');
      const dialogRef = this.dialog.open(CreateAssetComponent, {
      data: this.rowData,
      panelClass: ['large-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
    });
  }

  async checkUserPreference() {
    if(!this.commonService.userPreference?.hasOwnProperty('assetFilters')) {
      await this.commonService.validateUserPreference('assetFilters');
    }
    this.updateFilters();
  }
  updateFilters() {
    const hasPreference = this.commonService.userPreference?.hasOwnProperty('assetFilters');
    if(hasPreference){
      let preferenceData = this.commonService.userPreference.assetFilters.value;
      preferenceData = JSON.parse(preferenceData)
      let department = preferenceData.department || []; 
      const asset = preferenceData.asset || ['myDepartment']; 
      const assetType = preferenceData.assetType || [];
      const ownership =preferenceData.ownership||[];
      const assetCategory = preferenceData.assetCategory||[];
      const assetStatus = preferenceData?.assetStatus;
      this.status = assetStatus?.length ? assetStatus : null;
      const costType = preferenceData?.costType;
      this.costType = costType?.length ? costType : null;
      this.isMyAsset = asset?.some(item => item === 'myAsset') ? true : null;
      this.type = assetType.length ? assetType : null;
      this.category = assetCategory.length ? assetCategory: null;
      this.departmentIds = department?.length ? department : null;
      this.isMyDepartment = asset?.some(item => item === 'myDepartment')&& department?.length>0 ? true : null;
      this.isOwnedDepartment = ownership?.some(item => item === 'owned') ? true : null;
      this.isAssignedDepartment = ownership?.some(item => item === 'assigned') ? true : null;
      this.setParentFilterDetails(asset, preferenceData);
    }else{
      const deptFilter = this.parentFilter.find(f => f.id === 'my department');
      const ownershipFilter = this.parentFilter.find(f => f.id === 'ownership');
      const assetStatusFilter = this.parentFilter.find(f => f.id === 'assetStatus');
      const costTypeFilter = this.parentFilter.find(f => f.id === 'costType');
      let defaultPreference = {
        'asset': ['myDepartment'],
        'my department': [],
        'assetType': [],
        'ownership': [],
        'assetCategory': [],
        'assetStatus': [],
        'costType': []
      };

      if(deptFilter?.subFilters?.length){
        this.departmentIds = deptFilter.subFilters.map(f => f.code);
        this.isMyDepartment = true;
        defaultPreference.asset = ['myDepartment'];
        defaultPreference["my department"] = [...this.departmentIds];

        if(ownershipFilter) {
          ownershipFilter.defaultSelected = ['owned', 'assigned'];
          this.isOwnedDepartment = true;
          this.isAssignedDepartment = true;
          defaultPreference.ownership = ['owned', 'assigned'];
        }
      }else{
        this.departmentIds = null;
        this.isMyDepartment = null;
        this.isOwnedDepartment = null;
        this.isAssignedDepartment = null;
      }
      this.type = null;
      this.category = null;
      this.isMyAsset = null;
      this.status = this.statusList?.filter(s => s.code !== 'ATS-DI' && s.code !== 'ATS-DE' && s.code !=='ATS-COND').map(s => s.code) || null; //during intial load prevent check of decommision, condemed and disposal assetstatus
    //  this.costType = this.costList?.filter(s => s.code !== 'CT-DM' && s.code !== 'CT-LN').map(s => s.code) || null;  //during intial load prevent check of loan and demo costtypes
      this.costType =this.costList?.map(s => s.code) || null
      if (assetStatusFilter && this.status) {
        assetStatusFilter.defaultSelected = [...this.status];
      }
      if(costTypeFilter && this.costType){
        costTypeFilter.defaultSelected =[...this.costType];
      }
      defaultPreference.assetStatus = [...this.status];
      defaultPreference.costType = [...this.costType]
      this.setParentFilterDetails(defaultPreference.asset, defaultPreference);
    }
     this.getAssetLocationDetails(false, null,this.pageStart, this.pageSize, this.isMyAsset, this.isMyDepartment, this.type, this.isOwnedDepartment, this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType)
  }

  setParentFilterDetails(asset, preferenceData) {
    let filtersBy = ['asset', 'my department', 'assetType', 'ownership', 'assetCategory','assetStatus','costType'];
    this.parentFilter = this.parentFilter.map(filter => {
      if(!filtersBy.includes(filter.id)) return filter;
      let defaultSelected = [];
      if(filter.id === 'my department' && asset?.includes('myDepartment')) {
        defaultSelected = this.departmentIds || [];
      }else if(filter.id === 'assetStatus'){
        defaultSelected = this.status || [];
      }else if(filter.id === 'costType'){
        defaultSelected = this.costType || [];
      }else{
        defaultSelected = preferenceData?.[filter.id] || [];
      }
      return {
        ...filter,
        defaultSelected: [...defaultSelected]
      }
    })
  }

  linkedasset(data){
    localStorage.setItem('user_guide_menu_code', 'MN_FAAS_LKAS');
    const dialogRef = this.dialog.open(LinkedAssetComponent, {
        data: data,
        panelClass: 'small-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(res =>{
        const menu = JSON.parse(localStorage.getItem('currentMenu'))
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.refreshPage()
      })

  }

  async downloadBulkAsset() {
    try {
    this.loading=true;
    const termListExists = await this.assetTermsListExist();
    const headers = termListExists
      ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
      : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];
  
    const contactFields = ['serviceContact', 'vendorContact'];
    const dateFields = ['commissionOn', 'poDate'];
    const emailFields = ['servicePersonEmail', 'vendorEmail'];
    const numberFields = ['assetCost', 'softwareVersion','warrantyPeriod'];
    const percentageFields = ['depreciationPercent'];
    const nonEditableFields = termListExists ? ['id', 'assetSerialNumber','majorType','minorType','assetCategory','assetType']:['id', 'assetSerialNumber'];
  
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
  
    const headerRow = mainSheet.addRow(headers);
    mainSheet.getColumn(1).hidden = true; // Hide ID column
    headers.forEach((header, index) => {
        mainSheet.getColumn(index + 1).width = 30;
        if (nonEditableFields.includes(header)) {
            headerRow.getCell(index + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFCCCB' }, // Light red fill
            };
        }
    });
  
    let departmentList = [], userNameList = [], assetTypeList = [], costTypeList = [],
    depreciationType = [], criticality = [], locationList = [], assetCategory = [],
    statusList=[], preDownloadedData = [], countryCodeList = [];
    let periodType =['Month','Year']
    let usefulLife = Array.from({ length: 15 }, (_, i) => String(i + 1));
    let assetCategoryIds = this.parentFilter.find(filter => filter.id === 'assetCategory')?.subFilters?.length  ===  this.category?.length  ? null : this.category;
    let assetTypeIds =  this.parentFilter.find(filter => filter.id === 'assetType')?.subFilters?.length  === this.assetTypeIds?.length ? null : this.assetTypeIds;
    let status =  this.parentFilter.find(filter => filter.id === 'assetStatus')?.subFilters?.length  === this.status?.length ? null : this.status;
    let costType =  this.parentFilter.find(filter => filter.id === 'costType')?.subFilters?.length  === this.costType?.length ? null : this.costType;
  
    await Promise.all([
        this.configurationService.getAssetDepartment().toPromise().then(res => departmentList = res?.results?.map(r => r.name) || []),
        this.configurationService.getTicketUser('', 'RT-US').toPromise().then(res => userNameList = res?.results?.map(r => r.name) || []),
        this.lookupTermService.getAppTermsWrapper('AssetType').toPromise().then(res => assetTypeList = res?.AssetType?.map(r => r.value) || []),
        this.lookupTermService.getAppTermsWrapper('CostType').toPromise().then(res => costTypeList = res?.CostType?.map(r => r.value) || []),
        this.commonService.getAppTermsVerion2('AssetCategory').toPromise().then(res => assetCategory = res?.results?.map(r => r.value) || []),
        this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise().then(res => depreciationType = res?.DepreciationType?.map(r => r.value) || []),
        this.lookupTermService.getAppTermsWrapper('Criticality').toPromise().then(res => criticality = res?.Criticality?.map(r => r.value) || []),
        this.commonService.getAllLocationList(null, null, '3,17', 'Active', null, null, null).toPromise().then(res => locationList = res?.results?.map(r => r.fullName) || []),
        this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise().then(res => statusList = res?.AssetStatus?.map(r => r.value) || []),
        this.lookupTermService.getAppTermsWrapper('CountryCode').toPromise().then(res => countryCodeList = res?.CountryCode?.map(r => r.code) || []),
        this.workflowService.getAssetLocationDetails(this.applyFilterValue, null, null,this.isMyAsset,this.isMyDepartment,assetTypeIds,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,assetCategoryIds,status,costType).toPromise().then(res => preDownloadedData = res?.results || [])]);

        const dataLists = {
            assetCategory: assetCategory,
            assetType: assetTypeList,
            ownerDepartment: departmentList,
            assignedDepartment: departmentList,
            owner: userNameList,
            assetUser: userNameList,
            costType: costTypeList,
            depreciationType: depreciationType,
            usefulLife: usefulLife,
            criticality: criticality,
            locationName: locationList,
            assetStatus: statusList,
            vendorCountryCode: countryCodeList,
            serviceCountryCode: countryCodeList,
            majorType:assetCategory,
            minorType:assetCategory,
            periodType:periodType
        };
  
      Object.keys(dataLists).forEach((key, i) => {
        const col = apiSheet.getColumn(i + 1);
        col.values = [key, ...dataLists[key]];
        col.width = 30;
      });
  
       apiSheet.protect('twDevEx$123', {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: false,
            formatColumns: false,
            formatRows: false,
            insertColumns: false,
            insertRows: false,
            insertHyperlinks: false,
            deleteColumns: false,
            deleteRows: false,
            sort: false,
            autoFilter: false,
            pivotTables: false
        });
  
        preDownloadedData.forEach((item, i) => {
        if (!item.assetId || !item.assetSerialNumber) return;
        const row = mainSheet.getRow(i + 2);
        let serviceCode = null, serviceContact = null;
        if (item.serviceContact) {
          if (item.serviceContact.includes('-')) {
            const [code, number] = item.serviceContact.split('-');
            serviceCode = code || null;
            serviceContact = number || null;
          } else {
            serviceContact = item.serviceContact;
          }
        }
        let vendorCode = null, vendorContact = null;
        if (item.vendorContact) {
          if (item.vendorContact.includes('-')) {
            const [code, number] = item.vendorContact.split('-');
            vendorCode = code || null;
            vendorContact = number || null;
          } else {
            vendorContact = item.vendorContact;
          }
        }
  
        const values = termListExists ? [
          item.assetId,
          item.assetSerialNumber,
          item.assetCategoryName,
          item.assetCategory1Name,
          item.assetCategory2Name,
          item.assetName,
          item.assetTypeName,
          item.ownerDepartment,
          item.ownerName,
          item.assignedDepartment,
          item.assetUserName,
          serviceCode,
          serviceContact,
          item.servicePersonEmail,
          item.costTypeName,
          item.manufacturer,
          item.assetCost,
          item.vendorName,
          item.modelId,
          item.productSerialNumber,
          item.serviceProviderName,
          vendorCode,
          vendorContact,
          item.vendorEmail,
          item.poDate ? new Date(item.poDate) : null,
          item.criticalityName,
          item.softwareVersion,
          item.usefulLife,
          item.depreciationPercent,
          item.depreciationTypeName,
          item.comments,
          item.locationDescription,
          item.biomedTagId,
          item.oracleId,
          item.oracleDescription,
          item.sfda,
          item.assetStatusName,
          item.commissionedOn ? new Date(item.commissionedOn) : null,
          this.getWarrantyValue(item.warrantyPeriod ,'period'),
          this.getWarrantyValue(item.warrantyPeriod ,'frequency')
        ] : [
          item.assetId,
          item.assetSerialNumber,
          item.assetCategoryName,
          item.assetName,
          item.assetTypeName,
          item.ownerDepartment,
          item.ownerName,
          item.assignedDepartment,
          item.assetUserName,
          serviceCode,
          serviceContact,
          item.servicePersonEmail,
          item.costTypeName,
          item.manufacturer,
          item.assetCost,
          item.vendorName,
          item.modelId,
          item.productSerialNumber,
          item.serviceProviderName,
          vendorCode,
          vendorContact,
          item.vendorEmail,
          item.poDate ? new Date(item.poDate) : null,
          item.criticalityName,
          item.softwareVersion,
          item.usefulLife,
          item.depreciationPercent,
          item.depreciationTypeName,
          item.comments,
          item.locationDescription,
          item.biomedTagId,
          item.oracleId,
          item.oracleDescription,
          item.sfda,
          item.assetStatusName,
          item.commissionedOn ? new Date(item.commissionedOn) : null,
          this.getWarrantyValue(item.warrantyPeriod ,'period'),
          this.getWarrantyValue(item.warrantyPeriod ,'frequency')
        ];
  
        values.forEach((val, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = val ?? '';
            const header = headers[colIndex];
            const listColIndex = Object.keys(dataLists).indexOf(header) + 1;
            const colLetter = this.getColumnLetter(listColIndex);
            const listLength = dataLists[header]?.length || 0;
            const rangeAddress = `'${apiSheet.name}'!$${colLetter}$2:$${colLetter}$${listLength + 1}`;
            let validation: any = null;
            if (dataLists[header]) {
              validation = {
                type: 'list',
                allowBlank: true,
                formulae: [rangeAddress],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Invalid Input',
                error: 'Value must be from the list' };
          } else if (dateFields.includes(header)) {
            validation = { 
                type: 'date',
                operator: 'greaterThan',
                formulae: ['DATE(1900,1,1)'],
                allowBlank: true,
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Date',
                error: 'Enter a valid date (dd-MM-yyyy)' };
          } else if (contactFields.includes(header)) {
            validation = {
                type: 'custom',
                allowBlank: true,
                formulae: [`OR(${cell.address}="", LEN(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${cell.address},"+",""),"-","")," ",""),"","")) >= 9)`],
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Contact Number',
                error: 'Enter a valid Contact Number.' };
          } else if (emailFields.includes(header)) {
            validation = {
                type: 'custom',
                allowBlank: true,
                formulae: [
                  `OR(${cell.address}="",AND(ISNUMBER(FIND("@",${cell.address})),ISNUMBER(FIND(".",${cell.address})),LEN(${cell.address})-LEN(SUBSTITUTE(${cell.address},"@",""))=1))`
                ],
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Email',
                error: 'Enter a valid email address'
              };
          } else if (numberFields.includes(header)) {
            validation = { 
                type: 'custom',
                allowBlank: true,
                formulae: [`OR(${cell.address}="",AND(ISNUMBER(${cell.address}),INT(${cell.address})=${cell.address}))`],
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Number Format',
                error: 'Enter a Valid Number.'
              }
          } else if (percentageFields.includes(header)) {
            validation = { 
                type: 'custom',
                allowBlank: true,
                formulae: [`AND(ISNUMBER(${cell.address}), ${cell.address}>=0, ${cell.address}<=100)`],
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Percentage',
                error: 'Enter a valid percentage between 0 and 100.',
  
            };
            }
  
            if (validation) cell.dataValidation = validation;
            if (!nonEditableFields.includes(header)) cell.protection = { locked: false };
          });
        });
  
      mainSheet.protect('twDevEx$123', {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: false,
            formatColumns: false,
            formatRows: false,
            insertColumns: false,
            insertRows: false,
            insertHyperlinks: false,
            deleteColumns: false,
            deleteRows: false,
            sort: false,
            autoFilter: false,
            pivotTables: false
            });
  
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            this.loading=false;
            this.selectDropdown = null;
            saveAs(blob, 'download-Modifyasset.xlsx');
            this.refreshPage();
    }catch (error) {
        console.log('Bulk Asset Download Failed', error);
        this.loading = false;
        this.selectDropdown = null;
        this.toastr.warning('Failed to load necessary data from API');
        this.refreshPage();
    } finally{
      this.selectDropdown = null;
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    }
  }
  
  async uploadBulkAsset(event) {
    this.loading = true;
    const termListExists = await this.assetTermsListExist();
    try {
      const [assetType, department, user, costType, assetCategory, depreciationType, criticality, locationList, assetStatus] = await Promise.all([
        this.lookupTermService.getAppTermsWrapper('AssetType').toPromise(),
        this.configurationService.getAssetDepartment().toPromise(),
        this.configurationService.getTicketUser('', 'RT-US').toPromise(),
        this.lookupTermService.getAppTermsWrapper('CostType').toPromise(),
        this.commonService.getAppTermsVerion2('AssetCategory').toPromise(),
        this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise(),
        this.lookupTermService.getAppTermsWrapper('Criticality').toPromise(),
        this.commonService.getAllLocationList(null, null, '3,17', 'Active', null, null, null).toPromise(),
        this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise()
      ])
      this.assetTypeList = assetType?.AssetType.map(({ code, value }) => ({ code, value })) ?? [];
      this.departmentList = department.results.map(({ id, name }) => ({ id, name }));
      this.userNameList = user.results.map(({ id, name }) => ({ id, name }));
      this.costTypeList = costType?.CostType.map(({ code, value }) => ({ code, value })) ?? [];
      this.assetCategoryList = assetCategory.results.map(({ code, value }) => ({ code, value }));
      const depreciationTypeList = depreciationType?.DepreciationType.map(({ code, value }) => ({ code, value })) ?? [];
      const criticalityList = criticality?.Criticality.map(({ code, value }) => ({ code, value })) ?? []; 
      const locationNameList = locationList.results.map(({ id, fullName }) => ({ id, fullName }));
      const assetStatusList = assetStatus.AssetStatus.map(({ code, value }) => ({ code, value }));
      let periodType =[{code:'M',value:'Month'},{code:'Y',value:'Year'}]
  
      const file = event.target.files[0];
      if (!file) {
        this.loading = false;
        return;
      }
      let fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          const arrayBuffer: any = fileReader.result;
          const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
          const header = termListExists
          ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
          : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];
          const normalizedHeaderRow = headerRow.map(h => (h ?? '').toString().trim());
          const normalizedHeader = header.map(h => h.trim());
          if (
            normalizedHeaderRow.length !== normalizedHeader.length ||
            normalizedHeaderRow.some((val, idx) => val !== normalizedHeader[idx])
          ) {
            this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
            this.loading = false;
            event.target.value = null;
            return;
          }
  
          const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' ,rawNumbers: false});
          const jsonData = arrayList.map(row => {
          if (!row['id']) return null;
          const type = this.mapAppTermField(row['periodType'], periodType, 'code', 'value');
          const period = Number(row['warrantyPeriod']);
          const isValidWarranty = period > 0 && type &&(row['commissionOn']!= null || row ['commissionOn'] != undefined || row['commissionedOn'] != '');
        const data: any = {
            assetTypeId: this.mapAppTermField(row['assetType'], this.assetTypeList),
            ownerDepartmentId: this.mapAppTermField(row['ownerDepartment'], this.departmentList, 'id', 'name'),
            assignedDepartmentId: this.mapAppTermField(row['assignedDepartment'], this.departmentList, 'id', 'name'),
            ownerId: this.mapAppTermField(row['owner'], this.userNameList, 'id', 'name'),
            assetUserId: this.mapAppTermField(row['assetUser'], this.userNameList, 'id', 'name'),
            costTypeId: this.mapAppTermField(row['costType'], this.costTypeList),
            modelId: row['modelNo'] ? this.formatNumberAsString(row['modelNo']) : null,
            productSerialNumber: row['productSerialNo'] ? this.formatNumberAsString(row['productSerialNo']) : null,
            id: parseInt(row['id'], 10) || null,
            assetName: row['assetName'] || null,
            assetSerialNumber: row['assetSerialNumber'] ? this.formatNumberAsString(row['assetSerialNumber']) : null,
            serviceContact: this.formatContactNumber(row['serviceCountryCode'], row['serviceContact']),
            servicePersonEmail: row['servicePersonEmail'] || null,
            manufacturer: row['manufacturer'] || null,
            commissionedOn: this.parseDate(row['commissionOn']),
            assetCost: row['assetCost'] && !isNaN(parseFloat(row['assetCost'])) ? parseFloat(row['assetCost']).toFixed(2) : null,
            vendorName: row['vendorName'] || null,
            serviceProviderName: row['serviceProviderName'] || null,
            vendorContact: this.formatContactNumber(row['vendorCountryCode'], row['vendorContact']),
            vendorEmail: row['vendorEmail'] || null,
            poDate: this.parseDate(row['poDate']),
            criticalityId: this.mapAppTermField(row['criticality'], criticalityList),
            softwareVersion: row['softwareVersion'] || null,
            usefulLife: row['usefulLife'] || null,
            depreciationPercent: row['depreciationPercent'] || null,
            depreciationTypeId: this.mapAppTermField(row['depreciationType'], depreciationTypeList),
            comments: row['description'] || null,
            locationId: this.mapAppTermField(row['locationName'], locationNameList, 'id', 'fullName'),
            assetStatus: this.mapAppTermField(row['assetStatus'], assetStatusList),
            biomedTagId : row['bioMedTag']? this.formatNumberAsString(row['bioMedTag']):null,
            oracleId: row['oracleId']? this.formatNumberAsString(row['oracleId']): null,
            oracleDescription: row['oracleDescription']?row['oracleDescription']: null,
            sfda: row['sfdaNo']? this.formatNumberAsString(row['sfdaNo']): null,
            warrantyPeriod: isValidWarranty ? this.formatWarrantyPeriod(period, type): null,
            warrantyDue: isValidWarranty? this.calculateEndDate(row['commissionOn'], period, type): null
          }
            if (termListExists) {
              data.assetCategoryId  = this.mapAppTermField(row['majorType'], this.assetCategoryList);
              data.assetCategory1Id = this.mapAppTermField(row['minorType'], this.assetCategoryList);
              data.assetCategory2Id = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
            } else {
              data.assetCategoryId = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
            }
            return data;
          }).filter(x => x);
          this.loading = false;
          event.target.value = null;
          if (!jsonData.length) {
            this.toastr.warning('Warning', 'No valid asset records found.');
            return;
          }
  
          this.loading = true;
          this.hospitalService.importBulkAsset(jsonData).subscribe(res => {
            this.loading = false;
            if (res.results.assets && res.results.assets.length > 0) {
              this.toastr.warning('Warning', `${res.results.note}`);
              this.generateExcel(res.results.assets);
            } else {
              this.toastr.success('Success', `${res.message}`);
            }
          },
            err => {
            this.loading = false;
            this.toastr.error('Error', err.error?.message || 'Failed to import assets.');
          });
        }catch(err) {
          this.loading = false; 
          event.target.value = null;
          this.toastr.error('Error', 'Error parsing the uploaded file.');
        }
      };
      fileReader.readAsArrayBuffer(file);
    }catch(error) {
      this.loading = false;
      event.target.value = null;
      this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    }
  }
  
  async generateExcel(preDownloadedData) {
    const termListExists = await this.assetTermsListExist();
  
    const headers = termListExists
      ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
      : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];
  
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([], { header: headers });
  
    worksheet['!cols'] = Array.from({ length: headers.length }, () => ({ wch: 20 }));
    worksheet.getColumn(1).hidden = true; // Hide ID column
    const data = preDownloadedData.map(item => {
        let serviceCode = null, serviceContact = null;
        if (item.serviceContact) {
          if (item.serviceContact.includes('-')) {
            const [code, number] = item.serviceContact.split('-');
            serviceCode = code?.trim() || null;
            serviceContact = number?.trim() || null;
          } else {
            serviceContact = item.serviceContact?.trim() || null;
          }
        }
        let vendorCode = null, vendorContact = null;
        if (item.vendorContact) {
          if (item.vendorContact.includes('-')) {
            const [code, number] = item.vendorContact.split('-');
            vendorCode = code?.trim() || null;
            vendorContact = number?.trim() || null;
          } else {
            vendorContact = item.vendorContact?.trim() || null;
          }
        }
  
        return termListExists ? {
          id: item.id,
          assetSerialNumber: item.assetSerialNumber,
          majorType: item.assetCategoryName,
          minorType: item.assetCategory1Name,
          assetCategory: item.assetCategory2Name,
          assetName: item.assetName,
          assetType: item.assetTypeName,
          ownerDepartment: item.ownerDepartment,
          owner: item.ownerName,
          assignedDepartment: item.assignedDepartment,
          assetUser: item.assetUserName,
          serviceCountryCode: serviceCode,
          serviceContact: serviceContact,
          servicePersonEmail: item.servicePersonEmail,
          costType: item.costTypeName,
          manufacturer: item.manufacturer,
          assetCost: item.assetCost,
          vendorName: item.vendorName,
          modelNo: item.modelId,
          productSerialNo: item.productSerialNumber,
          serviceProviderName: item.serviceProviderName,
          vendorCountryCode: vendorCode,
          vendorContact: vendorContact,
          vendorEmail: item.vendorEmail,
          poDate:  item.poDate ? new Date(item.poDate) : null,
          criticality: item.criticalityName,
          softwareVersion: item.softwareVersion,
          usefulLife: item.usefulLife,
          depreciationPercent: item.depreciationPercent,
          depreciationType: item.depreciationTypeName,
          description: item.comments,
          locationName: item.locationDescription,
          bioMedTag: item.biomedTagId,
          oracleId: item.oracleId,
          oracleDescription: item.oracleDescription,
          sfdaNo: item.sfda,
          assetStatus: item.assetStatusName,
          commissionOn:  item.commissionedOn ? new Date(item.commissionedOn): null,
          warrantyPeriod :this.getWarrantyValue(item.warrantyPeriod ,'period'),
          periodType : this.getWarrantyValue(item.warrantyPeriod ,'frequency'),
          error:item.error
        } : {
          id: item.id,
          assetSerialNumber: item.assetSerialNumber,
          assetCategory: item.assetCategoryName,
          assetName: item.assetName,
          assetType: item.assetTypeName,
          ownerDepartment: item.ownerDepartment,
          owner: item.ownerName,
          assignedDepartment: item.assignedDepartment,
          assetUser: item.assetUserName,
          serviceCountryCode: serviceCode,
          serviceContact: serviceContact,
          servicePersonEmail: item.servicePersonEmail,
          costType: item.costTypeName,
          manufacturer: item.manufacturer,
          assetCost: item.assetCost,
          vendorName: item.vendorName,
          modelNo: item.modelId,
          productSerialNo: item.productSerialNumber,
          serviceProviderName: item.serviceProviderName,
          vendorCountryCode: vendorCode,
          vendorContact: vendorContact,
          vendorEmail: item.vendorEmail,
          poDate:  item.poDate ? new Date(item.poDate) : null,
          criticality: item.criticalityName,
          softwareVersion: item.softwareVersion,
          usefulLife: item.usefulLife,
          depreciationPercent: item.depreciationPercent,
          depreciationType: item.depreciationTypeName,
          description: item.comments,
          locationName: item.locationDescription,
          bioMedTag: item.biomedTagId,
          oracleId: item.oracleId,
          oracleDescription: item.oracleDescription,
          sfdaNo: item.sfda,
          assetStatus: item.assetStatusName,
          commissionOn:  item.commissionedOn ? new Date(item.commissionedOn): null,
          warrantyPeriod :this.getWarrantyValue(item.warrantyPeriod ,'period'),
          periodType : this.getWarrantyValue(item.warrantyPeriod ,'frequency'),
          error:item.error
        };
    });
  
    XLSX.utils.sheet_add_json(worksheet, data, { skipHeader: true, origin: 'A2' });
  
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
  
    XLSX.writeFile(workbook, 'errorLog.xlsx');
  }

  
async assetTermsListExist(): Promise<boolean> {
  try {
    const res = await this.configurationService.getConfigFile('asset-config').toPromise();
    const termsList = res?.results?.contentObject?.termsList;
    this.defaultAssetStatus = res?.results?.contentObject?.createAssetStatus?.[0] ?? 'ATS-REC';
    return Array.isArray(termsList) && termsList.length > 0;
  } catch (error) {
    console.log('Error fetching hierarchy config:', error);
    return false;
  }
}

// Helper functions
  // Converts numeric values to plain string format
  formatNumberAsString = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const str = String(value).trim();
    const validExp = /^[+-]?\d+(\.\d+)?[eE]\+\d+$/;
    if (!validExp.test(str)) {
      return str;
    }
    const [mantissa, expPart] = str.split(/[eE]\+/);
    const exponent = parseInt(expPart, 10);
    const MAX_EXPANSION = 20;
    if (exponent > MAX_EXPANSION) return str;
    const [intPart, decPart = ''] = mantissa.split('.');
    const digits = intPart + decPart;
    const zerosToAdd = exponent - decPart.length;
    if (zerosToAdd >= 0) {
      return digits + '0'.repeat(zerosToAdd);
    } else {
      const pos = digits.length + zerosToAdd;
      return digits.slice(0, pos) + '.' + digits.slice(pos);
    }
  }

  //validate phoneNumber format
  formatPhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return null; 
    }
    const safeTrim = (value) => value ? value.trim() : null;
    const cleaned = safeTrim(phone).replace(/['"\s]/g, ''); // Remove unwanted characters
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // format PhoneNumber with CountryCode
  formatContactNumber = (code, number)=> {
    const safeTrim = (value)=> value ? value.trim() : null;
    const countryCode = safeTrim(code);
    const contact = safeTrim(number);
    if (!contact) return null;

    if (countryCode) return `${countryCode}-${contact}`;

    return contact;
  };


  //Map corresponding appterm code
  mapAppTermField = (fieldName, list, codeField = 'code', valueField = 'value') => {
    const safeTrim = (value) => value ? value.trim() : null;
    const fieldValue = safeTrim(fieldName);
    const match = list?.find(item =>
      safeTrim(item[valueField])?.toLowerCase() === fieldValue?.toLowerCase());
   return match ? match[codeField] : null;
  }

  //To  get ExcelColumn Letter
  getColumnLetter(colIndex: number): string {
    let letter = '';
    while (colIndex > 0) {
      const mod = (colIndex - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      colIndex = Math.floor((colIndex - mod) / 26);
    }
    return letter;
  }

  // Method to safely parse and format date
  parseDate(d: any): string | null {
    if (d === null || d === undefined || d === '') return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} 00:00:00`;
  }

    //formatWarrantyPeriod combine warrantyPeriod and periodtype
  formatWarrantyPeriod(period, type) {
    if (period == null || period === '' || type == null || type === '') {
      return null;
    }
    return `${period} ${type}`;
  }

  //calculateEndDate for warranty based on commissionedon,warrantyPeriod,periodType
  calculateEndDate(commissionedOn,period,type){
    if (commissionedOn == null || commissionedOn === '' ||period == null || period === '' || type == null || type === '') {
      return null;
    }
    const months = type === 'Y'? period * 12: period;
    const startDate = new Date(commissionedOn);
    const day = startDate.getDate();
    const endDate = new Date(startDate);
    endDate.setDate(1); // reset day
    endDate.setMonth(endDate.getMonth() + months);
    const lastDayOfMonth = new Date(endDate.getFullYear(),endDate.getMonth() + 1,0).getDate();
    endDate.setDate(Math.min(day, lastDayOfMonth));
    return endDate ? this.parseDate(endDate) : null
  }

  getWarrantyValue(rawValue: any, field: 'period' | 'frequency'): any {
    if (!rawValue) return null;
    const parts = String(rawValue).trim().split(/\s+/);
    // must be exactly: number + unit
    if (parts.length !== 2) return null;
    const [value, freq] = parts;
    const period = Number(value);
    if (isNaN(period) || period <= 0) return null;
    let frequency: string | null = null;
    const f = freq.toLowerCase();
    if (f === 'm' || f === 'month' || f === 'months') {
      frequency = 'Month';   // ✅ FIX HERE
    } else if (f === 'y' || f === 'year' || f === 'years') {
      frequency = 'Year';    // ✅ FIX HERE
    } else {
      return null;
    }
    return field === 'period' ? period : frequency;
  }

  getAssetOverview(data) {
      const dialogRef = this.dialog.open(AssetOverviewComponent, {
        data: data,
        panelClass: 'large-popup',
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.getAssetLocationDetails(false, this.applyFilterValue, this.pageStart, this.pageSize,this.isMyAsset,this.isMyDepartment,this.type,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,this.category,this.status,this.costType);
      });
  }

  bulkQRExport() {
    const assetCategoryIds =this.parentFilter.find(filter => filter.id === 'assetCategory')?.subFilters?.length === this.category?.length? null: this.category;
    const assetTypeIds = this.parentFilter.find(filter => filter.id === 'assetType')?.subFilters?.length === this.assetTypeIds?.length? null: this.assetTypeIds;
    const status = this.parentFilter.find(filter => filter.id === 'assetStatus')?.subFilters?.length === this.status?.length? null: this.status;
    const costType = this.parentFilter.find(filter => filter.id === 'costType')?.subFilters?.length === this.costType?.length? null: this.costType;

    this.workflowService.getAssetLocationDetails(this.applyFilterValue,this.pageStart,this.pageSize,this.isMyAsset,this.isMyDepartment,assetTypeIds,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentIds,assetCategoryIds,status,costType).toPromise().then(res => {
        const assetData: any = res?.results || [];
        assetData.type = 'qr';
        const dialogRef = this.dialog.open(BulkIdentifierExportComponent, {
          data: assetData,
          panelClass: 'large-popup',
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'))
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectDropdown = null;
          this.refreshPage();
        });
    });
  }
}

@Component({
  selector: 'app-sensor-management',
  templateUrl: './sensor-component.html',
  styleUrls: ['./asset-management.component.scss']
})
export class SensorComponent  {

  
  public popWidth: string;
  public popHeight: number;
  public contentHeight: number;
  public selectedTab: string;
  public selectedTabIndex: string;
  public windWidth = window.innerWidth;
  public selectedSensorAction: string = 'SER-SU';
  public sensorSummaryList: any;
  public sensorHistoryList: any;
  public sensorOptionList = [{'code': 'SER-SU', 'value': 'Summary'}, {'code': 'SER-HIS', 'value': 'History'}];
  SSDisplayedColumns: string[] = ["S.No", "sensorType", "sensorName", "sensorValue", "time"];
  SSHDisplayedColumns: string[] = ["S.No", "sensorType", "sensorName", "sensorValue", "time"];
  public summaryLength: any;
  public historyLength: any;
  public summaryPageStart = 0;
  public summaryPageSize = 10;
  public historyPageStart = 0;
  public historyPageSize = 10;
  constructor(public commonService: CommonService,
    @Optional() public thisDialogRef: MatDialogRef<any>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
) { }


  onWindowResizedWidth(size) {
    this.popWidth = size;
  }
  onWindowResized(size) {
    this.popHeight = size - 38;
    this.contentHeight = size - 170;
  }
  onTabChanged(event) {
    this.selectedTab = event.tab.textLabel;
    if(this.selectedTab === 'Sensor') {
      this.getSensorSummary(this.sensorOptionList[0].code);
    }
  }
  getSensorSummary(sensorAction, event?: any) {
    this.selectedSensorAction = sensorAction;
    if (this.selectedSensorAction === 'SER-SU') {
      this.summaryPageStart = (event != null) ? event.pageIndex : this.summaryPageStart;
      this.summaryPageSize = (event != null) ? event.pageSize : 10;
      this.commonService.getAssetSensorSummary(this.data.id, false, null, this.summaryPageStart, this.summaryPageSize,null).subscribe(res => {
        if (res.statusCode === 1) {
          this.summaryLength = res.results.length;
          this.sensorSummaryList = res.results;
        }
      });
    } else {
      this.historyPageStart = (event != null) ? event.pageIndex : this.historyPageStart;
      this.historyPageSize = (event != null) ? event.pageSize : 10;
      this.commonService.getAssetSensorSummary(this.data.id, true, null, this.historyPageStart, this.historyPageSize,null).subscribe(res => {
        if (res.statusCode === 1) {
          this.historyLength = res.results.length;
          this.sensorHistoryList = res.results;
        }
      });
    }
  }
  fixClick() {
    console.log('')
  }    
}
