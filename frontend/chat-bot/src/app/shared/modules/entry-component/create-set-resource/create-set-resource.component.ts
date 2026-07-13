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

import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { DatePipe } from '@angular/common';
import { CreateSetResource, EditSetResource } from './create-set-resource.model';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-create-set-resource',
  templateUrl: './create-set-resource.component.html',
  styleUrls: ['./create-set-resource.component.scss']
})
export class CreateSetResourceComponent {

  public setresourceForm: FormGroup;
  public currentDate: any = new Date();
  assetTypeList: any;
  catagoryData: any;
  statusTypelist: any;
  assetcategoryList: any;
  assetNameList: any;
  assetAllNamelist: any;
  deleteSetData: any;
  updateDataId: any;
  surgicalSetList: any;
  editeData: any;
  dataSource: any[] = [];
  isData: boolean = false;
  isloading: boolean = false;
  DisplayColumn = ['Asset Id', 'Asset Name', 'Quantity', 'DeleteEdite'];
  DataColumns = ['assetId', 'assetName', 'assetQuantity', 'deleteEdite'];
  setDataInfo: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, private readonly commonService: CommonService, private readonly _dateFormat: DatePipe,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateSetResourceComponent>, public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.commonService.getAppTerms('SterileSetStatus,SurgicalSets,AssetCategory').subscribe(res => {
      if (res.statusCode === 1) {
        this.statusTypelist = res.results.filter(x => x.groupName === 'SterileSetStatus').map(item => ({
          ...item,
          name: item.value,
        }))
        this.surgicalSetList = res.results.filter(x => x.groupName === 'SurgicalSets').map(item => ({
          ...item,
          name: item.value
        }));
        const assetcategoryInfo = res.results.filter(x => x.groupName === 'AssetCategory').map(item => ({
          ...item,
          name : item.value
        }));
        this.assetcategoryList = assetcategoryInfo.filter(x => ['ASC-SGI', 'ASC-NMED', 'ASC-MED'].includes(x.code));
      }
    });
    this.buildForm();
    setTimeout(() => { this.editeSterileSetDetails() }, 800)
  }
  public buildForm() {
    this.setresourceForm = this.form.group({
      name: [this.data.setResource ? this.data.setResource.code : null, Validators.required],
      identifier: [this.data.setResource ? this.data.setResource.identifier : null],
      description: [this.data.setResource ? this.data.setResource.description : null],
      setStatus: [this.data.setResource ? this.data.setResource.sterileStatusId : null],
      assetType: [null,Validators.required],
      assetName: [null,Validators.required],
      assetQuantity: [null, Validators.required],
      category: [null,Validators.required]
    });
  }

  OnResourceCatagoryChange(event) {
    this.catagoryData = event;
    this.commonService.getAppTermsLink(event, 'AssetType').subscribe(res => {
      if (res.statusCode === 1) {
        this.assetTypeList = res.results.map(item => ({
          ...item,
          name: item.value,
        }))
      }
    })
    this.assetNameList = [];
    this.setresourceForm.get('assetQuantity').reset();
  }
  OnResourceTypeChange(event) {
    this.catagoryData = event;
    this.assetNameList = [];
    this.commonService.getAssetNamelist(event).subscribe(res => {
      if (res.statusCode == 1) {
        const assetNameId = this.dataSource.map(x => x.assetId);
        if (assetNameId.length) {
          this.assetNameList = res.results.filter(x => !assetNameId.includes(x.id)).map(item => ({ ...item, name: item.assetName }))
        } else {
          this.assetNameList = res.results.map(item => ({ ...item, name: item.assetName }));
        }
      }
    });
    this.setresourceForm.get('assetQuantity').reset();
  }

  addResource() {
    let SetResourceData: any;
    const selectedType = this.setresourceForm?.get('assetType')?.value;
    const selectedName = this.setresourceForm?.get('assetName')?.value;
    const selectedQuantity = this.setresourceForm?.get('assetQuantity')?.value;
    if (selectedType != null && selectedName != null) {
      const assetTypeData = this.assetTypeList.find(x => x.code == selectedType);
      const assetNameData = this.assetNameList.find(x => x.id == selectedName);
      SetResourceData = {
        assetType: assetTypeData ? assetTypeData.name : null,
        assetTypeCode: assetTypeData ? assetTypeData.code : null,
        assetName: assetNameData ? assetNameData.name : null,
        assetId: assetNameData ? assetNameData.id : null,
        assetQuantity: selectedQuantity ? selectedQuantity : null,
        id: this.updateDataId ? this.updateDataId : null
      }
    }
    if (this.editeData !== null && this.editeData != undefined) {
      const index = this.dataSource.findIndex(x => x.entityId === this.editeData.entityId);
      if (index !== -1) {
        this.dataSource[index] = SetResourceData;
        this.dataSource = this.dataSource.map(({ isEditeDisable, ...rest }) => rest);
        this.dataSource = [...this.dataSource];
      }
      this.updateDataId = null;
      this.isData = true;
      this.editeData = null
    } else {
      this.dataSource.push(SetResourceData);
      this.dataSource = [...this.dataSource];
      this.updateDataId = null;
      this.isData = true;
    }
    this.setresourceForm.get('assetType').reset();
    this.setresourceForm.get('assetName').reset();
    this.setresourceForm.get('assetQuantity').reset();
    this.setresourceForm.get('category').reset()
  }

  editeSterileSetDetails() {
    if (this.data?.setResource != null) {
    this.isloading = true;
    this.commonService.getAssetNamelist().subscribe(res => {
      this.isloading = false;
      this.assetAllNamelist = res.results;
      let setDetatails = this.data.setResource.sterileSetDetails;
      this.setDataInfo = setDetatails.map((item, index) => {
        let assetDetails = this.assetAllNamelist?.find(x => x.id == item.identifyingValue);
        let setUpdateInfoId = this.data.setResource.sterileSetDetails.map(x => x.id);
        return {
          assetType: assetDetails?.assetCategoryName,
          assetTypeCode: assetDetails?.assetCategoryId,
          assetName: assetDetails?.assetName,
          assetId: assetDetails?.id,
          assetQuantity: item.quantity,
          id: setUpdateInfoId[index] ?? null
        }
      });
      if (this.data.type === 'TW-SSV') {
        this.setDataInfo = this.setDataInfo.map(item => ({
          ...item,
          isDelEdit: false
        }));
      }
      this.dataSource.push(...this.setDataInfo);
      this.dataSource = [...this.dataSource];
    })
    }
  }

  eventAction(event) {
    if (event.key === 'delete') {
      this.deleteSetResource(event.data);
    } else if (event.key === 'manage') {
      this.editSetResourceData(event.data, event);
    }
  }

  editSetResourceData(data, event) {
    this.editeData = data;
    this.updateDataId = event.data.id;
    const editeSetData = this.assetAllNamelist?.find(x => x.id === data.assetId);
    this.commonService.getAppTermsLink(editeSetData.assetCategoryId, 'AssetType').subscribe(res => {
      if (res.statusCode === 1) {
        this.assetTypeList = res.results.map(item => ({ ...item, name: item.value }));
      }
    });
    this.commonService.getAssetNamelist(editeSetData.assetTypeId).subscribe(res => {
      if (res.statusCode == 1) {
        this.assetNameList = res.results.map(item => ({ ...item, name: item.assetName }));
      }
    })

    if (editeSetData != null) {
      this.setresourceForm.get('category').setValue(editeSetData.assetCategoryId);
      this.setresourceForm.get('assetType').setValue(editeSetData.assetTypeId);
      this.setresourceForm.get('assetName').setValue(editeSetData.id);
      this.setresourceForm.get('assetQuantity').setValue(data.assetQuantity);
    }
    this.dataSource = this.dataSource.map(item => ({...item,isEditeDisable: true }));
  }
  deleteSetResource(data) {
    if (data.id) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirm Delete', message: 'Are you sure you want to delete?',
          buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        if (res.confirmButtonText === 'Yes') {
          this.dataSource = this.dataSource.filter(item => item !== data);
          this.dataSource = [...this.dataSource];
          this.deleteSetData = {
            assetType: data?.assetType,
            assetTypeCode: data?.assetTypeCode,
            assetName: data?.assetName,
            assetId: data.assetId,
            assetQuantity: data.assetQuantity,
            id: data.id,
            isActive: false
          }
          this.dataSource.push(this.deleteSetData);
          this.dataSource = this.dataSource.filter(x => x.isActive != false);
        }
      })
    } else {
      this.dataSource = this.dataSource.filter(item => item !== data);
    }
    this.dataSource = [...this.dataSource];
  }

  saveSetResource() {
    let createSetResource: any;
    createSetResource = new CreateSetResource(null, null, null, null);
    createSetResource.code = this.setresourceForm.get('name').value;
    createSetResource.description = this.setresourceForm.get('description').value;
    createSetResource.isActive = true

    let setDetails = this.dataSource.map(data => {
      return {
        identifyingType: 'asset',
        identifyingValue: data.assetId,
        quantity: data.assetQuantity,
        isActive: true
      };
    });
    createSetResource.sterileSetDetails = setDetails;
    this.commonService.saveSterliesetsResource(createSetResource).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateSetResource() {
    let sterliesetdataId = this.data.setResource.id;
    let editeSetResource: any;
    editeSetResource = new EditSetResource(null, null, null, null, null);
    editeSetResource.description = this.setresourceForm.get('description').value;
    editeSetResource.code = this.setresourceForm.get('name').value;
    editeSetResource.sterileStatusId = this.setresourceForm.get('setStatus').value;
    editeSetResource.isActive = true;
    if (this.deleteSetData != null && this.deleteSetData != undefined) {
      this.dataSource.push(this.deleteSetData)
    }
    let setUpdateDetails = this.dataSource.map(data => {
      return {
        identifyingType: 'asset',
        identifyingValue: data.assetId,
        quantity: data.assetQuantity,
        id: data.id,
        isActive: data.isActive === undefined ? true : false
      };
    });
    editeSetResource.sterileSetDetails = setUpdateDetails;
    this.commonService.updateSterlieSetresource(sterliesetdataId, editeSetResource).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
