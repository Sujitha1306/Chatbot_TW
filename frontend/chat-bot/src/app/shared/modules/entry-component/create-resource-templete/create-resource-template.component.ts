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

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { DatePipe } from '@angular/common';
import { CreateResourceTamplate } from './create-resource-template.model';
import { CreateSetResourceComponent } from '../create-set-resource/create-set-resource.component';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-create-resource-template',
  templateUrl: './create-resource-template.component.html',
  styleUrls: ['./create-resource-template.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateResourceTemplateComponent {

  public resourceTamplateForm: FormGroup;
  public currentDate: any = new Date();
  surgeryList: any;
  assetCategory: any;
  departmentList: any;
  roleList: any;
  assetCatagoryData: any;
  staffTypeData: any;
  catagoryData: any;
  staffListData: any;
  resourceListData: any;
  assetNameData: any;
  staffNameData: any;
  conMasterData: any;
  impMasterData: any;
  consumablesImplantdata: any;
  surgeryListdata: any;
  surgeryFilterList: any;
  sterlieSetList: any;
  catagoryList : any;
  conCategory: any;
  impCategory: any
  assetAllNamelist: any;
  conCategoryId: any;
  impCategoryId: any;
  identifyValueUpdate: any;
  dataSource: any[] = [];
  conTableSource: any[] = [];
  impTableSource: any[] = [];
  setTableSource: any[] = [];
  margeDataSource: any[];
  selectSterlieCode: any[];
  allowedCodes: any[];
  assetCatagoryEnabled: boolean = false;
  staffListEnable: boolean = false;
  isActiveTable: boolean = false;
  surgeryEnabled: boolean = false;
  spinLoader: boolean = false;
  PageListData = [{ code: 'TW-OTS', name: 'OT Schedule' }];
  identifyListData = [{ code: 'TW-OTP', name: 'Procedure' }];
  resourcesConList = [{ code: 'IT-CON', name: 'Consumables' }];
  resourcesImpList = [{ code: 'IT-IMP', name: 'Implant' }]
  resourcesStaffList = [{ code: 'SE-UR', name: 'User' }, { code: 'SE-AT', name: 'Asset' }]
  DisplayColumn = ['Type', 'Role/Category','Name', 'Delete'];
  DataColumns = ['entityType','roleUser', 'entityName', 'Delete'];
  ConDisplayColumn = ['Type', 'Name', 'Category', 'Quantity', 'Delete'];
  ConDataColumns = ['assetType', 'name', 'category', 'quantity', 'Delete'];
  ImpDisplayColumn = ['Type', 'Name', 'Category', 'Quantity', 'Delete'];
  ImpDataColumns = ['assetType', 'name', 'category', 'quantity', 'Delete'];
  setDisplayColumn = ['Set Code','Set GroupName', 'Delete'];
  setDataColumns = ['setCode','setGroupName', 'Delete'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public form: FormBuilder, private readonly _dateFormat: DatePipe,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateResourceTemplateComponent>, private readonly workflowService: WorkflowService,
    private readonly configurationService: ConfigurationService, public dialog: MatDialog, private readonly lookupService: LookupTermService) {
      this.commonService.getOTProcedure().subscribe(res => {
        this.surgeryListdata = res.results;
        this.buildForm();
        });
      this.commonService.getAssetNamelist().subscribe(res => {
        this.assetAllNamelist = res.results;
      });
     }

  ngOnInit(): void {
    this.getDepartment()
    this.lookupService.getAppTermsWrapper('AssetCategory').subscribe(res => {
      this.assetCategory = res.AssetCategory
        .filter(item => item.code !== 'ASC-ALS' && item.code !== 'ASC-BLS')
        .map(item => ({
          ...item,
          name: item.value,
        }));
    });
    this.commonService.getAllRole().subscribe(res => {
      this.allowedCodes = ['RO-DO', 'RO-NU', 'RO-BI', 'RO-ANE', 'RO-SUR', 'RO-OTT', 'RO-RAD', 'RO-PER', 'RO-PED', 'RO-OBG', 'RO-URO', 'RO-OPH', 'RO-PAT'];
      this.roleList = res.results.filter(item => this.allowedCodes.includes(item.code));
    });
    this.buildForm();
  }

  public buildForm() {
    let pageUpdateData: any;
    let identifyTyepUpdate: any;
    if (this.data?.resource != null) {
      pageUpdateData = this.PageListData.find(x => x.name == this.data.resource.page);
      identifyTyepUpdate = this.identifyListData.find(x => x.name === this.data.resource.identifyingType);
      this.identifyValueUpdate = this.surgeryListdata?.find(x => x.id === parseInt(this.data.resource.identifyingValue));
    }

    this.resourceTamplateForm = this.form.group({
      name: [this.data.resource ? this.data.resource.name : null, Validators.required],
      pageId: [this.data.resource ? pageUpdateData?.code : null, Validators.required],
      identifyType: [this.data.resource ? identifyTyepUpdate?.code : null, Validators.required],
      identifyValue: [this.data.resource ? this.identifyValueUpdate?.name : null, Validators.required],
      entityType: [null],
      entityId: [null],
      entityName: [null],
      entityConType: [null, Validators.required],
      entityAssetId: [null],
      entityAssetName: [null],
      conMasterId: [null, Validators.required],
      conCategory: [null, Validators.required],
      requestedConQuantity: [null],
      deliveryStatusId: [null],
      surgicalsetId: [null],
      entityImpType: [null, Validators.required],
      impCategory: [null, Validators.required],
      impMasterId: [null, Validators.required],
      requestedImpQuantity: [null]
    });
  }
  
  getDepartment() {
     this.spinLoader = true;
     this.commonService.getAllUserSearch(null, 0, 5000).subscribe(res => {
      this.spinLoader = false;
      if (res.statusCode) {
        this.staffNameData = res.results;
        setTimeout(() => {this.getPageTemplete()},500)
      }
    });
    this.lookupService.getAppTermsWrapper('SurgicalSets').subscribe(res => {
        this.sterlieSetList = res.SurgicalSets.map(item => ({...item, name : item.value, id : item.code }));
    })
    this.workflowService.getAllItemMaster().subscribe(res => {
      if (res.statusCode === 1) {
        this.conMasterData = res.results.filter(x => x.name != null);
        this.impMasterData = this.conMasterData;
      }
    });
    this.commonService.getResourceTemplate().subscribe(res => {
      if (res.statusCode === 1) {
        this.surgeryFilterList = res.results.map(x => x.identifyingValue);
      }
    })
  }

  getPageTemplete() {
    if (this.data.resource != null) {
      let allResourcesData: any[];
      let staffInfo: any;
      let staffList: any;
      this.isActiveTable = true;
      const resourceFilterData = this.data?.resource;
      const changeData = JSON.parse(resourceFilterData?.templateValue);
      allResourcesData = changeData.resources;
      const staffDataInfo = allResourcesData.filter(x => this.allowedCodes.includes(x.roleCode) || x.roleCode === 'SE-AT');
      const conDataInfo = allResourcesData.filter(x => x.roleCode === 'IT-CON');
      const impDataInfo = allResourcesData.filter(x => x.roleCode === 'IT-IMP');
      const sterlieSetData = allResourcesData.filter(x => x.roleCode === null);
      if (staffDataInfo.length) {
        let assetInfo: any;
        let assetemptyData: any;
        let staffDataList = staffDataInfo.map(item => {
          if (item.entityType === "Asset") {
            if (item.entityId != null) {
              assetInfo = this.assetAllNamelist?.find(x => x.id === item.entityId);
            } else {
              assetemptyData = this.assetCategory?.find(x => x.code === item.assetCategoryId);
            }
          } else {
            if (item.entityId !== null) {
              staffInfo = this.staffNameData?.find(x => x.id === item.entityId);
            } else {
              staffList = this.roleList.find(f => f.code === item.roleCode);
            }
          }
          return {
            roleUser: item.entityId ? item.entityType == 'User' ? staffInfo?.roleName : assetInfo?.assetCategoryName : item.entityType == 'User' ? staffList?.name : assetemptyData?.name,
            entityName: item.entityId ? item.entityType == 'User' ? staffInfo?.firstName : assetInfo?.assetName : null,
            entityId: item.entityId,
            entityType: item.entityType,
            roleUsercode: item.roleCode,
            assetCategoryId: item.assetCategoryId
          }
        })
        this.dataSource.push(staffDataList);
        this.dataSource = [...staffDataList];
      }
      if (conDataInfo.length) {
        let conDataList = conDataInfo.map(item => {
          let conType = "";
          let conName = "";
          let conTypeCode = '';
          let conCategory = "";
          let conId = '';
          let concategoryCode = '';
          const consumablesData = this.conMasterData.find(x => x.id === item.entityId);
          conType = item.entityType;
          conTypeCode = item.roleCode;
          conName = consumablesData ? consumablesData.name : null;
          conId = consumablesData ? consumablesData.id : null;
          conCategory = consumablesData ? consumablesData.itemCategoryName : null;
          concategoryCode = consumablesData ? consumablesData.itemCategoryId : null

          return {
            assetType: conType,
            assetTypeCode: conTypeCode,
            name: conName,
            id: conId,
            category: conCategory,
            categoryCode: concategoryCode,
            quantity: item.quantity
          }
        });
        this.conTableSource.push(...conDataList);
        this.conTableSource = [...this.conTableSource];
      }
        if (impDataInfo.length) {
        let impDataList = impDataInfo.map(item => {
          let impType = "";
          let impName = "";
          let impTypeCode = '';
          let impCategory = "";
          let impId = '';
          let impcategoryCode = '';
          const ImplantData = this.impMasterData.find(x => x.id === item.entityId);
          impType = item.entityType;
          impTypeCode = item.roleCode;
          impName = ImplantData ? ImplantData.name : null;
          impId = ImplantData ? ImplantData.id : null;
          impCategory = ImplantData ? ImplantData.itemCategoryName : null;
          impcategoryCode = ImplantData ? ImplantData.itemCategoryId : null

          return {
            assetType: impType,
            assetTypeCode: impTypeCode,
            name: impName,
            id: impId,
            category: impCategory,
            categoryCode: impcategoryCode,
            quantity: item.quantity
          }
        });
        this.impTableSource.push(...impDataList);
        this.impTableSource = [...this.impTableSource];
      }
      if (sterlieSetData.length) {
        let sterlieSetDataList = sterlieSetData.map(item => {
          const setDatalist = this.sterlieSetList?.find(x => x.code === item.entityCode);
          return {
            setCode: setDatalist?.id,
            setGroupName: setDatalist?.name,
            sterileStatusCode: setDatalist?.sterileStatusId
          }
        })
        this.setTableSource.push(...sterlieSetDataList);
        this.setTableSource = [...this.setTableSource];
      }
    }
  }
  
  onSelectedChange(event) {
   this.selectSterlieCode = event.value
  }

  OnResourceTypeChange(id) {
    if (id === 'SE-AT') {
      this.catagoryList = this.assetCategory;
    } else {
      this.departmentList = this.roleList;
    }
    this.resourceTamplateForm.controls['entityAssetId'].reset();
    this.resourceTamplateForm.controls['entityAssetName'].reset();
    this.resourceTamplateForm.controls['entityName'].reset();
    this.resourceTamplateForm.controls['entityId'].reset();
  }

  OnConTypeChange(id) {
    this.conCategoryId = id;
    this.lookupService.getAppTermsLinkWrapper(id).subscribe(res => { 
      this.conCategory = res.ItemCategory ?? [];
    })
    this.conMasterData = [];
    this.resourceTamplateForm.controls['conCategory'].reset();
    this.resourceTamplateForm.controls['conMasterId'].reset();
    this.resourceTamplateForm.controls['requestedConQuantity'].reset();
  }
  
  OnImpTypeChange(id) {
    this.impCategoryId = id;
    this.lookupService.getAppTermsLinkWrapper(id).subscribe(res => {
      this.impCategory = res.ItemCategory ?? [];
    })
    this.impMasterData = [];
    this.resourceTamplateForm.controls['impCategory'].reset();
    this.resourceTamplateForm.controls['impMasterId'].reset();
    this.resourceTamplateForm.controls['requestedImpQuantity'].reset();
  }

  onConCategoryChange(event) {
    this.conMasterData = [];
    this.workflowService.getAllItemMaster(this.conCategoryId, event.value).subscribe(res => {
      if (res.statusCode === 1) {
        this.conMasterData = res.results;
      }
    });
    this.resourceTamplateForm.controls['conMasterId'].reset();
  }

  onImpCategoryChange(event) {
    this.impMasterData = [];
    this.workflowService.getAllItemMaster(this.impCategoryId, event.value).subscribe(res => {
      if (res.statusCode === 1) {
        this.impMasterData = res.results;
      }
    });
    this.resourceTamplateForm.controls['impMasterId'].reset();
  }

  OnPageChange(event) {
    if (event == "TW-OTS") {
      this.resourceTamplateForm.controls['identifyType'].setValue(this.identifyListData[0].code)
    }
  }

  onSubAssetTypeChange(event) {
    if (event != null) {
      this.catagoryData = event;
    }
  }

  onSubTypeChange(event) {
    if (this.allowedCodes.includes(event)) {
      this.staffTypeData = event;
    }
    this.staffListData = [];
    this.resourceTamplateForm.controls['entityName'].reset();
  }

  searchAsset(event, category) {
    const fromDate = this._dateFormat.transform(this.currentDate, "YYYY-MM-dd HH:mm:ss");
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.searchEntityAvailablity(category, 'asset', fromDate, name, '').subscribe(res => {
        const dataTableAsset = this.dataSource.map(x => x.entityId);
        if (dataTableAsset.length) {
          this.assetCatagoryData = res.results.filter(x => !dataTableAsset.includes(x.id));
        } else {
          this.assetCatagoryData = res.results;
        }
        this.assetCatagoryEnabled = true;
      })
    } else {
      this.assetCatagoryData = [];
    }
  }

  getAssetList(type, id) {
    if (id) {
      const catagory = this as any as { id: string, name: string }[];
      const asset = catagory.find(obj => obj.id === id);
      return asset ? asset.name : '';
    } else {
      return '';
    }
  }

  staffListInfo(event, type) {
    const fromDate = this._dateFormat.transform(this.currentDate, "YYYY-MM-dd HH:mm:ss");
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.searchEntityAvailablity(null, 'user', fromDate, name, type).subscribe(res => {
        const dataTableStaff = this.dataSource.map(x => x.entityId);
        if (dataTableStaff.length) {
          this.staffListData = res.results.filter(x => !dataTableStaff.includes(x.id));
        } else {
          this.staffListData = res.results;
        }
        this.staffListEnable = true;
      });
    }
  }

  
  surgerylist(event){
    this.surgeryList = [];
    let name = event.text;
    if (name.length >= 2) {
      this.commonService.getOTProcedure(name).subscribe(res => {
        if(this.surgeryFilterList != null && this.surgeryFilterList != undefined){
        const filterIds = this.surgeryFilterList?.map(id => Number(id));
        this.surgeryList = res.results.filter(x => !filterIds.includes(x.id));
        } else {
          this.surgeryList = res.results;
        }
        this.surgeryEnabled = true;
      });
    }
    else {
      this.surgeryList = [];
    }
  }
  getsurgeryList(id) {
    if (id) {
      const surgery = this as any as { id: string, name: string }[];
      return surgery.find(obj => obj.id === id)?.name;
    } else {
      return '';
    }
  }

  getStaffList(type, id) {
    if (id) {
      const doctors = this as any as { id: string, name: string }[];
      return doctors.find(obj => obj.id === id)?.name;
    } else {
      return '';
    }
  }

  updateConQuantity(change: number): void {
    const control = this.resourceTamplateForm.get('requestedConQuantity');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }

  updateImpQuantity(change: number): void {
    const control = this.resourceTamplateForm.get('requestedImpQuantity');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }


  addResource() {
    this.isActiveTable = true;
    this.departmentList = [];
    this.resourceListData = null;
    let resourceData: any;
    let assetCateId: any;
    const selectedType = this.resourceTamplateForm.get('entityType')?.value;
    const eventDataId = this.resourceTamplateForm.get('entityName')?.value;
    const assetDataId = this.resourceTamplateForm.get('entityAssetName')?.value
    const selectAssetcode = this.resourceTamplateForm.get('entityAssetId')?.value;
    const eventId = this.resourceTamplateForm.get('entityId')?.value;
    if (selectedType !== 'SE-AT') {
      this.departmentList = this.roleList?.filter(x => x.code === eventId)
    } else {
      assetCateId = this.catagoryList?.find(x => x.code == selectAssetcode);
    }
    if (eventDataId || assetDataId) {
      if (selectedType === 'SE-AT') {
        this.resourceListData = this.assetCatagoryData?.find(x => x.id === assetDataId);
      } else {
        this.resourceListData = this.staffListData?.find(x => x.id === eventDataId);
      }
      const typeName = this.resourcesStaffList.find(item => item.code === selectedType);
      resourceData = {
        entityType: typeName.name,
        entityId: this.resourceListData?.id,
        entityName: this.resourceListData?.name,
        roleUser: selectedType !== 'SE-AT' ? this.departmentList[0]?.name : assetCateId?.value,
        roleUsercode: selectedType !== 'SE-AT' ? this.departmentList[0]?.code : selectedType,
        assetCategoryId: selectedType == 'SE-AT' ? assetCateId?.code : null
      }
    } else {
      const typeName = this.resourcesStaffList.find(item => item.code === selectedType)?.name || '';
      resourceData = {
        entityType: typeName,
        entityId: null,
        entityName: null,
        roleUser: selectedType !== 'SE-AT' ? this.departmentList[0]?.name : assetCateId?.value,
        roleUsercode: selectedType !== 'SE-AT' ? this.departmentList[0]?.code : selectedType,
        assetCategoryId: selectedType == 'SE-AT' ? assetCateId?.code : null
      }
    }
    this.dataSource.push(resourceData);
    this.dataSource = [...this.dataSource];
    this.resourceTamplateForm.controls['entityType'].reset();
    this.resourceTamplateForm.controls['entityId'].reset();
    this.resourceTamplateForm.controls['entityName'].reset();
    this.resourceTamplateForm.controls['entityAssetId'].reset();
    this.resourceTamplateForm.controls['entityAssetName'].reset();
  }

  addConTamplate() {
    const selectConType = this.resourceTamplateForm.get('entityConType')?.value;
    const conMasterId = this.resourceTamplateForm.get('conMasterId')?.value;
    const conCategory = this.resourceTamplateForm.get('conCategory')?.value;
    const requestedConQuantity = this.resourceTamplateForm.get('requestedConQuantity')?.value;
    let conType: any;
    let conId: any;
    let conName: any;
    let conDataTable: any;

    conName = this.conMasterData.find(x => x.id === conMasterId);
    conId = this.conCategory.find(x => x.code === conCategory);
    conType = this.resourcesConList.find(x => x.code == selectConType);

    conDataTable = {
      assetType: conType.name ? conType.name : null,
      assetTypeCode: conType.code ? conType.code : null,
      name: conName?.name ? conName.name : null,
      id: conName?.id ? conName.id : null,
      category: conId.value ? conId.value : null,
      categoryCode: conId.code ? conId.code : null,
      quantity: requestedConQuantity ? requestedConQuantity : null
    }
    this.conTableSource.push(conDataTable);
    this.conTableSource = [...this.conTableSource];
    this.conMasterData = [];
    this.conCategory = [];
    this.resourceTamplateForm.controls['entityConType'].reset();
    this.resourceTamplateForm.controls['conMasterId'].reset();
    this.resourceTamplateForm.controls['conCategory'].reset();
    this.resourceTamplateForm.controls['requestedConQuantity'].reset();
  }

  addImpTamplate() {
    const selectImpType = this.resourceTamplateForm.get('entityImpType')?.value;
    const impMasterId = this.resourceTamplateForm.get('impMasterId')?.value;
    const impCategory = this.resourceTamplateForm.get('impCategory')?.value;
    const requestedImpQuantity = this.resourceTamplateForm.get('requestedImpQuantity')?.value;
    let impType: any;
    let impId: any;
    let impName: any;
    let impDataTable: any;

    impName = this.impMasterData.find(x => x.id === impMasterId);
    impId = this.impCategory.find(x => x.code === impCategory);
    impType = this.resourcesImpList.find(x => x.code == selectImpType);

    impDataTable = {
      assetType: impType.name ? impType.name : null,
      assetTypeCode: impType.code ? impType.code : null,
      name: impName?.name ? impName.name : null,
      id: impName?.id ? impName.id : null,
      category: impId.value ? impId.value : null,
      categoryCode: impId.code ? impId.code : null,
      quantity: requestedImpQuantity ? requestedImpQuantity : null
    }
    this.impTableSource.push(impDataTable);
    this.impTableSource = [...this.impTableSource];
    this.impMasterData = [];
    this.impCategory = [];
    this.resourceTamplateForm.controls['entityImpType'].reset();
    this.resourceTamplateForm.controls['impMasterId'].reset();
    this.resourceTamplateForm.controls['impCategory'].reset();
    this.resourceTamplateForm.controls['requestedImpQuantity'].reset();
  }

  addSetTamplate(){
    let setFilterData: any;
    const setDataListId = this.resourceTamplateForm.get('surgicalsetId')?.value;
    if(setDataListId !== null && setDataListId !== undefined ){
      setFilterData = this.sterlieSetList.find(x => x.id === setDataListId);
    }
    const setdataInfo = [setFilterData].map(item => {
      return {
        setCode: item?.id,
        setGroupName: item?.name,
      }
    });
    this.setTableSource.push(...setdataInfo);
    this.setTableSource = [...this.setTableSource];
    if (this.selectSterlieCode != null && this.selectSterlieCode !== undefined) {
      this.sterlieSetList = this.sterlieSetList.filter(x => x.id !== this.selectSterlieCode)
    } else {
      this.sterlieSetList = this.sterlieSetList;
    }
    this.resourceTamplateForm.controls['surgicalsetId'].reset();
  }


  eventAction(event) {
    if (event.key === 'delete') {
      this.deleteTemplate(event.data);
    }
  }

  surgicalSetView(data){
    const surgeryId = data?.data.entityId;
    let sugicalSetData: any[] = [];
    this.commonService.getSterlieSetList(null, null, null, surgeryId).subscribe(res => {
      if (res.statusCode === 1) {
        sugicalSetData = res.results[0];
      }
      let templatepop = {
        type: 'TW-SSV',
        setResource: sugicalSetData,
      }
      const dialogRef = this.dialog.open(CreateSetResourceComponent, {
        data: templatepop,
        panelClass: ['medium-popup'],
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(() => { });
    })
   }

  conEventAction(event) {
    if (event.key === 'delete') {
      this.deleteConTemplate(event.data);
    }
  }

   impEventAction(event) {
    if (event.key === 'delete') {
      this.deleteImpTemplate(event.data);
    }
  }

  setEventAction(event){
    if (event.key === 'delete') {
      this.deleteSetTemplate(event.data);
    } else if (event.key === 'SetName') {
      this.surgicalSetView(event);
     }
  }

  deleteTemplate(data) {
    this.dataSource = this.dataSource.filter(item => item !== data);
    this.dataSource = [...this.dataSource];
  }

  deleteConTemplate(data) {
    this.conTableSource = this.conTableSource.filter(item => item !== data);
    this.conTableSource = [...this.conTableSource];
  }

  deleteSetTemplate(data){
    this.setTableSource = this.setTableSource.filter(item => item !== data);
    this.setTableSource = [...this.setTableSource];
  }

   deleteImpTemplate(data){
    this.impTableSource = this.impTableSource.filter(item => item !== data);
    this.impTableSource = [...this.impTableSource];
  }

  onTabChange(event){
    // Determine the tab change event console.log(event)
  }

  validateEntitySelection() {
    const control = this.resourceTamplateForm.get('identifyValue');
    if (!control) return;
    const doctorValue = control.value;
    // console.log('Validating doctor selection:', doctorValue);
    const isValid = this.surgeryList?.some(item => item.id === doctorValue);
    if (!isValid && this.identifyValueUpdate) {
      control.setValue(this.identifyValueUpdate.name);
    } else if (!isValid && !this.identifyValueUpdate) {
      control.setValue(null);
    }
  }
  

  saveResourceTamplate() {
    let createResourceTamplate: any;
    let conData: any[];
    let impData: any[];
    let dataSource: any[];
    let sterlieSetSource: any[];
    let surgeryId: any[];
    createResourceTamplate = new CreateResourceTamplate(null, null, null, null, null, null, null);
    const identifytype = this.identifyListData.filter(x => x.code === this.resourceTamplateForm.controls['identifyType'].value);
    if(this.surgeryEnabled === true){
      surgeryId = this.surgeryListdata.filter(x => x.id === this.resourceTamplateForm.controls['identifyValue'].value);
    } else {
      surgeryId = this.surgeryListdata.filter(x => x.id === parseInt(this.data.resource.identifyingValue));
    }
    const pageId = this.PageListData.filter(x => x.code === this.resourceTamplateForm.controls['pageId'].value);
    if (this.conTableSource.length) {
      conData = this.conTableSource.map(item => {
        return {
          entityId: item.id ? item.id : null,
          entityName: item.name ? item.name : null,
          entityType: item.assetType ? item.assetType : null,
          assetCategoryId: item.categoryCode ? item.categoryCode : null,
          quantity: item.quantity ? item.quantity : null,
          roleCode: item.assetTypeCode
        }
      });
    }
     if (this.impTableSource.length) {
      impData = this.impTableSource.map(item => {
        return {
          entityId: item.id ? item.id : null,
          entityName: item.name ? item.name : null,
          entityType: item.assetType ? item.assetType : null,
          assetCategoryId: item.categoryCode ? item.categoryCode : null,
          quantity: item.quantity ? item.quantity : null,
          roleCode: item.assetTypeCode
        }
      });
    }
    if (this.dataSource.length) {
      dataSource = this.dataSource.map(data => {
        return {
          entityId: data.entityId ? data.entityId : null,
          entityName : data.entityName ? data.entityName : null, 
          entityType: data.entityType ? data.entityType : null,
          assetCategoryId: data.assetCategoryId ? data.assetCategoryId : null,
          roleCode: data.categoryCode != null ? data.categoryCode :  data.roleUsercode ? data.roleUsercode : null,
        }
      });
    }
    if(this.setTableSource.length){
      sterlieSetSource = this.setTableSource.map(data => {
        return {
          entityId : null,
          entityCode: data.setCode,
          entityName : data.setGroupName,
          entityType : 'Sterlize',
          editeDelete : ''
        }
      })
    }

    this.margeDataSource = [ ...(conData || []), ...(dataSource || []), ...(sterlieSetSource || []), ...(impData || []) ];

    let template = {
      resources: this.margeDataSource.map(data => {
        return {
          entityId: data.entityId ? data.entityId : null,
          entityCode : data.entityCode ? data.entityCode : null,
          entityName: data.entityName ? data.entityName : null,
          entityType: data.entityType ? data.entityType : null,
          assetCategoryId: data.assetCategoryId ? data.assetCategoryId : null,
          roleCode: data.roleCode ? data.roleCode : null,
          quantity: data.quantity ? data.quantity : null
        }
      })
    }
    let stringifiedTemplate = JSON.stringify(template);
    if (this.data.resource === null) {
      createResourceTamplate.code = null;
      createResourceTamplate.id = null;
      createResourceTamplate.identifyingType = identifytype[0]?.name
      createResourceTamplate.identifyingValue = surgeryId[0]?.id;
      createResourceTamplate.name = this.resourceTamplateForm.controls['name'].value;
      createResourceTamplate.page = pageId[0]?.name;
      createResourceTamplate.templateValue = stringifiedTemplate;
    } else {
      createResourceTamplate.code = this.data?.resource.code;
      createResourceTamplate.id = this.data?.resource.id;
      createResourceTamplate.identifyingType = identifytype[0]?.name
      createResourceTamplate.identifyingValue = surgeryId[0]?.id;
      createResourceTamplate.name = this.resourceTamplateForm.controls['name'].value;
      createResourceTamplate.page = pageId[0]?.name;
      createResourceTamplate.templateValue = stringifiedTemplate;
    }
    this.commonService.saveResourceTamplate([createResourceTamplate]).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
}
