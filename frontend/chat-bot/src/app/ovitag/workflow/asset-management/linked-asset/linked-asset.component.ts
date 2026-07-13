import { Component, ElementRef, Inject, Optional, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, ConfigurationService, WorkflowService } from '../../../../shared';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-linked-asset',
  templateUrl: './linked-asset.component.html',
  styleUrls: ['./linked-asset.component.scss']
})
export class LinkedAssetComponent {
  assetForm: FormGroup;
  tableData = [];
  assetDisplayedColumns: string[] = ['Asset No', 'Asset Name', 'Asset Type', 'Linked User Name', 'Linked Date Time', 'Action'];
  assetCoulms = ["childAssetSerialNumber", "childAssetName", "childAssetTypeName", "linkedUserName", "linkedDateTime", ""];
  selectedParentAssetId: number;
  selectedParentAsset: any;
  activate_btn: string[] = [];
  isAssetTable = false;
  isEditAsset = false;
  assetLinked = false;
  childAssetId: number;
  childAssetName: string;
  childAssetTypeName: string;
  childAssetTypeId: number;
  today = new Date();
  assetlist: any[] = [];
  assets: any[] = [];
  linkedAsset: any[] = [];
  parentAssetControl = new FormControl('');
  filteredParentAssets: any[] = [];
  isParentAssetLocked = true;
  parentAssets: any[] = [];


  constructor(private fb: FormBuilder, public workflowservice: WorkflowService, public commonService: CommonService, @Optional() @Inject(MAT_DIALOG_DATA) public data: any, public toastr: AppToastService, private readonly _dateFormat: DatePipe, public configurationServices: ConfigurationService
    , @Optional() public thisDialogRef: MatDialogRef<LinkedAssetComponent>) {

  }

  ngOnInit() {


    const selected = this.data
    if (selected) {
      this.parentAssetControl.setValue(selected.assetName);
      this.selectedParentAssetId = selected.assetId;
      this.isParentAssetLocked = true;
      this.selectedParentAsset = selected
      this.getLinkedAssetDetails(this.selectedParentAssetId);
    }

    this.assetForm = this.fb.group({
      childAssetSerialNumber: ['']
    });

    this.tableData = this.assets;
    this.isAssetTable = this.assets.length > 0;
  }

  onParentAssetSelect(asset: any) {
    if (!asset || !asset.assetId) {
      return;
    }

    this.selectedParentAsset = asset;
    this.selectedParentAssetId = asset.assetId;


    this.parentAssetControl.setValue(asset.assetName);
    this.isParentAssetLocked = true;

    this.assetForm.reset();
    this.assets = [];

    this.getLinkedAssetDetails(this.selectedParentAssetId);
  }



  bindAsset(asset: any) {
    this.selectedParentAsset = asset;
    this.selectedParentAssetId = asset.assetId;

    this.assetForm.reset();

    this.getLinkedAssetDetails(this.selectedParentAssetId);
  }

  onChildAssetSelect(asset: any) {
    const selectedAsset = this.assets.filter(a => a.assetSerialNo === asset.assetSerialNo);
    this.assetLinked = !!selectedAsset;
    if(this.assetLinked){
    this.childAssetId = asset.assetId;
    this.childAssetName = asset.assetName;
    this.childAssetTypeName = asset.assetType;
    this.childAssetTypeId = asset.assetTypeId;

    this.assetForm.controls['childAssetSerialNumber']
      .setValue(asset.assetSerialNo);
    }
  }


  add() {
    if (this.tableData.find(
      res => res.childAssetSerialNumber === this.assetForm.controls['childAssetSerialNumber'].value)) {
      this.assetForm.controls['childAssetSerialNumber'].setValue(null);
    }

    let user = localStorage.getItem(btoa('current_user'));
    const userId = Number(localStorage.getItem(btoa('userId')));

    this.linkedAsset.push({
      childAssetSerialNumber: this.assetForm.controls.childAssetSerialNumber.value,
      childAssetId: this.childAssetId,
      childAssetName: this.childAssetName,
      childAssetTypeName: this.childAssetTypeName,
      childAssetTypeId: this.childAssetTypeId,
      linkedUserName: user,
      linkedUserId: userId,
      linkedDateTime: this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
      isDeleted: false,
      isNewlyLinked: true
    });
    this.tableData = this.linkedAsset;
    this.tableData = [...this.tableData]
    this.isAssetTable = true;

    this.assetForm.controls['childAssetSerialNumber'].reset();
    this.childAssetId = null;
    this.childAssetName = null;
    this.childAssetTypeName = null;
    this.childAssetTypeId = null;
  }


  fixClick() {
    console.log('Enter pressed');
  }


  getLinkedAssetDetails(parentAssetId: number) {
    this.commonService.getLinkedAsset(parentAssetId).subscribe(res => {
      this.linkedAsset = res.results || [];

      this.tableData = this.linkedAsset;
      this.isAssetTable = this.linkedAsset.length > 0;
    });
  }


  onUserTypeHit(event) {
    if (!this.selectedParentAssetId) {
      return;
    }

    if (event.text.length > 2) {
      this.assetLinked = false;
      this.commonService.getAssetSearch(null,event.text).subscribe((res) => {
        if (res.results.length>= 1) {
          this.assets = res.results
          .map(asset => ({
            combinedAsset: `${asset.serialNo} - ${asset.assetName}`,
            assetId: asset.assetId,
            assetName: asset.assetName,
            assetSerialNo: asset.serialNo,
            assetType: asset.assetType,
            assetTypeId: asset.assetTypeId
          }))
          this.assets = this.assets.filter(asset => asset.assetId !== this.selectedParentAssetId);
          const linkedAssetSerialNos = this.linkedAsset.map(a => a.childAssetSerialNumber);
          this.assets = this.assets.filter(asset => !linkedAssetSerialNos.includes(asset.assetSerialNo));
        } else {
          this.assetLinked = false;
        }
      });
    }
  }



  onParentAssetInput(event: Event) {
    if (this.isParentAssetLocked) {
      return;
    }

    const value = (event.target as HTMLInputElement).value?.toLowerCase() || '';

    this.filteredParentAssets = this.assetlist.filter(asset =>
      asset.assetName.toLowerCase().includes(value)
    );
  }



  clearParentAsset() {
    this.selectedParentAsset = null;
    this.selectedParentAssetId = null;

    this.isParentAssetLocked = false;
    this.parentAssetControl.reset();

    // clear linked assets
    this.linkedAsset = [];
    this.tableData = [];
    this.isAssetTable = false;

    this.assetForm.reset();
  }

  eventAction(event) {
    if (event.key === 'delete') {
      this.deleteAsset(event.data)
    }
  }

  onParentAssetTypeHit(event) {
    if (this.isParentAssetLocked) {
      return;
    }

    if (event.text.length > 2) {
      this.commonService.getAssetSearch(null, event.text).subscribe(res => {
        this.parentAssets = res.results.filter(asset =>
          asset.assetName.toLowerCase().includes(event.text.toLowerCase())
        );
      });
    }
  }

  deleteAsset(row) {
    if (!row) {
      return;
    }

    const asset = this.linkedAsset.find(
      asset => asset.childAssetSerialNumber === row.childAssetSerialNumber
    );

    if (asset) {
      asset.isDeleted = true;
    }
    this.tableData = this.tableData.filter(r => r.isDeleted != true)
    this.tableData = [...this.tableData];
  }


  updateAsset() {
    const data = { linkedAsset: this.linkedAsset }
    this.configurationServices.

    editAsset(data, this.selectedParentAssetId).subscribe({
      next: () => {
        this.toastr.success('Success', 'Linked assets updated successfully');
        this.thisDialogRef.close('confirm')

      },
      error: () => {
        this.toastr.error('Error', 'Update failed');
      }
    });
  }

}
