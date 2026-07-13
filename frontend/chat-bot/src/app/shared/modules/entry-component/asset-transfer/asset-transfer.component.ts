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
import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  ViewEncapsulation,
} from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { DatePipe } from "@angular/common";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ConfigurationService, CommonService } from "../../../services";
import { AssetTransfer } from './asset-transfer.model';
import { SelectionModel } from "@angular/cdk/collections";
import { AppToastService } from "../../../services/toaster.service";

@Component({
  selector: "app-asset-transfer",
  templateUrl: "./asset-transfer.component.html",
  styleUrls: ["./asset-transfer.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AssetTransferComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  today = new Date();
  public type = null;
  public checkTransferTypeId = null;
  public transferType = [];
  public locationlist: any;
  public blankField: boolean;
  public locationId: any;
  public facilityList: any;
  public assetTransferTypeDetails: any;
  public assetTransferTypes: any;
  public assetTransferForm: FormGroup;
  public assetTransfer: AssetTransfer;
  public departmentList=[];
  public isAssetTable: boolean = false;
  linkedAsset : Array<any> = [];
  updateAsset: Array<any> =[];
  dataSourceAsset = new MatTableDataSource<any>();
  updateSourceAsset = new MatTableDataSource<any>()
  assetSelection = new SelectionModel<any>(true, []);
  selection = new SelectionModel<any>(true, []);
  assetDisplayedColumns: string[]=['select','Asset Id', 'Asset Name','Asset Type'];
  public isEditAsset:boolean = false;
  public isDeleted: boolean = false;
  assetTransferSource: any;
  firstDate =null;
  bannerlabel= [];
  sourceId =null;
  destinationId = null;

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<AssetTransferComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dateFormat: DatePipe,
    private readonly configurationServices: ConfigurationService,
    private readonly commonServices: CommonService,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.getDepartmentList();
    this.bannerlabel =[ 
      {'left': [{label: 'Asset  Serial Number', value: this.data.assetSerialNumber},
                {label: 'Asset Name', value: this.data.assetName}]},
      {'right': [{label: 'Asset Type', value: this.data.assetTypeName},
                 {label: 'Owner Department ', value: this.data.ownerDepartment}]}]
    this.getTransferList();
    this.getLinkedAssets();
    this.commonServices.getAppTermsVerion2('AssetTransferType').subscribe(res => {
      this.assetTransferTypes = res.results.filter(resFilter => resFilter.code !== 'ATT-AT');
      const filterCodesForCostType = ['ATT-LN', 'ATT-RR', 'ATT-SV', 'ATT-TR', 'ATT-BRD', 'ATT-RT'];
      const filterCodesForOtherCostTypes = ['ATT-LN', 'ATT-SV', 'ATT-TR', 'ATT-BRD', 'ATT-RT'];
      if (this.data.assetTransferTypeId === 'ATT-AT' || this.data.assetTransferTypeId === null) {
        const filterCodes = this.data.costTypeId === "CT-RE" ? filterCodesForCostType : filterCodesForOtherCostTypes;
        this.assetTransferTypeDetails = this.assetTransferTypes.filter(item => filterCodes.includes(item.code));
      } else {
        this.commonServices.getAppTermsLink(this.data.assetTransferTypeId, null).subscribe(res => {
          this.assetTransferTypeDetails = res.results;
        })
      }
    });

  }


  getDepartmentList(){
    this.configurationServices.getAssetDepartment().subscribe(res => {
      this.departmentList = res.results.map(({ id, name }) => ({ id, name }));
    });
  }
  getTransferList() {
    this.commonServices.getAppTerms('TransferType').subscribe(res => {
        this.transferType = res.results.filter(item => item.code !='TRT-FAC');
    });
  }
  

  getLinkedAssets() {
    this.commonServices.getLinkedAsset(this.data.id).subscribe(res => {
      this.linkedAsset = res.results;
      this.updateAsset =res.results;
      this.dataSourceAsset = new MatTableDataSource(this.linkedAsset);
      this.updateSourceAsset = new MatTableDataSource(this.linkedAsset)
      if (this.dataSourceAsset.data.length > 0) {
        this.isAssetTable = true;
        this.assetSelection.clear(); 
        this.dataSourceAsset.data.forEach(row => {
          this.assetSelection.select(row);
        });
      }
    });
  }
  onCheckboxChange(event: any, row: any) {
    const index: number = this.updateSourceAsset.data.findIndex((item: any) => item === row);
  
    if (index !== -1) {
        const removedAsset = this.updateSourceAsset.data.splice(index, 1)[0];
        this.updateAsset = this.updateSourceAsset.data.splice(0);
    }
}
onChange(event: any) {
  if (event && event.target) {
    const checked = event.target.checked;
    this.assetTransferForm.get('isExcludeParent').setValue(checked);
  }
}

  isAllSelected(event) {
    if(event == "childAsset"){
     const numSelected = this.assetSelection.selected.length;
     const numRows = this.dataSourceAsset.data.length;
     return numSelected === numRows;
   }
 }

   checkEvent(event){
  if( event == "childAsset"){
      setTimeout(() =>  this.removeIcon(this.assetSelection.selected.length, event), 200);
    }
  }

  removeIcon(length, event){
    if(event == "childAsset"){
      if(length == 1){
        this.isEditAsset = true;
        this.editRow('childAsset')
      } else{
        this.isEditAsset = false;
      }
      if(length > 0){
        this.isDeleted = true;
      } else{
        this.isDeleted = false;
      }
    }
  }

  editRow(type){
   if(type == 'childAsset'){
    this.assetSelection.selected.forEach(item => {
      const index: number = this.linkedAsset.findIndex(d => d === item);
      let val = this.dataSourceAsset.data[index];
    });
   }
  }

  public buildForm() {
    this.assetTransferForm = this.form.group({
      transferType: [this.data.assetTransferTypeId?this.data.assetTransferTypeId:null],
      transferId: [null],
      userId: [null],
      assetTransferType: [this.data && this.data.assetTransferTypeId !== 'ATT-AT'? this.data.assetTransferTypeId: null, [Validators.required]],
      assetId: [{value: this.data.id ? this.data.id : null, disabled: true}],
      assetName: [{value: this.data.assetName ? this.data.assetName : null, disabled: true}],
      homeLocationName: [{value: this.data.homeLocationName ? this.data.homeLocationName : null, disabled: true}],
      comments: [null],
      linkedAsset : this.form.array([this.getChildAssets()]),
      isExcludeParent:[false],
    });
    this.assetTransferForm.controls.transferType.valueChanges.subscribe((type) => {
      this.assetTransferForm.get['transferId'] !== null? this.assetTransferForm.controls['transferId'].setValue(null) :null
      this.assetTransferForm.updateValueAndValidity();
    })
    this.assetTransferForm.controls.assetTransferType.valueChanges.subscribe((type)=>{
      this.updateFormValidation(type);
    })
  }

  updateFormValidation(type) {
    if (type === 'ATT-LN' || type === 'ATT-TR') {
      this.assetTransferForm.controls.transferType.setValidators([Validators.required]);
      this.assetTransferForm.controls.transferId.setValidators([Validators.required]);
    } else {
      this.assetTransferForm.controls.transferType.clearValidators();
      this.assetTransferForm.controls.transferId.clearValidators();
    }
    this.assetTransferForm.controls.transferType.updateValueAndValidity();
    this.assetTransferForm.controls.transferId.updateValueAndValidity();
  }

  private getChildAssets(){
    return this.form.group({
     childAssetId:[''],
    });
  }

  getTransferType(type, action) {
    if (action === 'category') {
      this.type = type;
    }
    if (action === 'transfer') {
      this.type = null;
      this.checkTransferTypeId = type;
      this.assetTransferForm.get('transferType').setValue(null);
      this.assetTransferForm.get('transferType').updateValueAndValidity();
    }
  }

  searchLocationlist(event) {
    let searchList = "";
    let listItem;
    searchList += event.text;
    if (event.type === 'location' && event.text.length >= 2){
            if (event.toHit == true) {
                this.configurationServices.getLocationData(searchList).subscribe((res) => {
                        if (res.results.length == 0) {
                            this.blankField = true;
                        }
                        listItem = res.results;
                        this.locationlist = listItem;
                    });
            } else {
                this.blankField = true;
                this.locationlist = listItem;
            }
        } else {
            this.blankField = false;
            this.locationlist = [];
    }
  }
  getLocationID(locationID: any) {
    if (locationID != null) {
        this.locationId = locationID;
        this.assetTransferForm.controls['transferId'].setValue(this.locationId);
    } 
    this.blankField = false; 
}
  assetTranfer() {
    this.sourceId = this.assetTransferForm.controls['transferType'].value == "TRT-DEP" ? this.data?.ownerDepartmentId : this.assetTransferForm.controls['transferType'].value == "TRT-FAC"?localStorage.getItem(btoa('facilityId')): this.data?.homeLocationId;
    this.destinationId = this.assetTransferForm.controls['transferId'].value;
    this.assetTransfer = new AssetTransfer(null, null, null, null, null, null, null,null,null, null, null,null,null);
    this.assetTransfer.transferId = this.assetTransferForm.controls['transferId'].value;
    this.assetTransfer.transferType = this.assetTransferForm.controls['transferType'].value;
    this.assetTransfer.id = this.data.id;
    this.assetTransfer.assetTransferType = this.assetTransferForm.controls['assetTransferType'].value;
    this.assetTransfer.comments = this.assetTransferForm.controls['comments'].value;
    this.assetTransfer.linkedAssets= this.updateAsset;
    this.assetTransfer.isExcludeParent = this.assetTransferForm.controls['isExcludeParent'].value;
    this.assetTransfer.eventId = 'ATT-ACEV';
    this.assetTransfer.eventStatusId = 'ATE-INI';
    this.assetTransfer.sourceIdentifier = this.sourceId;
    this.assetTransfer.destinationIdentifier = this.destinationId;
    this.commonServices.assetTransfer(this.assetTransfer).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  fixClick() {
    console.log('')
  }  
}
