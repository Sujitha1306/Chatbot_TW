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

import { Component, ElementRef, Inject, OnInit, Optional, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { MatSort } from '@angular/material/sort';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { CreateInventory, CreateItems, ModifyInventory, ModifyItems } from './item-master-management.model';
import { DeliveryReqManagementComponent } from '../delivery-req-management/delivery-req-management.component';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../services/toaster.service';
import { of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-item-master-management',
  templateUrl: './item-master-management.component.html',
  styleUrls: ['./item-master-management.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemMasterManagementComponent implements OnInit {
  public itemForm: FormGroup;
  public createInventory: CreateInventory;
  public modifyInventory: ModifyInventory;
  public createItems: CreateItems;
  public modifyItems: ModifyItems;
  docDisplayedColumns: string[] = ['select', 'name', 'type', 'preview'];
  docSourceIdentifier = new MatTableDataSource<any>();
  docSelection = new SelectionModel<any>(true, []);
  inventoryDataSource = [];
  intendDataSource = [];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('searchInputClear') searchInputClear: ElementRef;
  imageData: any[] = [];
  image: any;
  public fileInfo: string;
  public isFileSelected: boolean = false;
  public isAddDoc: boolean = false;
  public isDeleteDoc: boolean = false;
  public isEditDocRow: boolean = false;
  public isDocTable: boolean = false;
  attachFiles: Array<any> = [];
  itemLinkList: any = [];
  itemLinkDataSource = [];
  showTable: boolean = false;
  public base64Data_global: string;
  today = new Date();
  fileType: string;
  public selectedIndex = 0;
  public matcher = new ErrorStateMatcherService();
  contentHeight: number;
  contentHeighttable: number;
  public windWidth = window.innerWidth;
  public selectedTab: string;
  public activate_btn: any = [];
  public assetTypes: any = [];
  documentType: any[] = [];
  itemType: any[] = [];
  itemCategory: any[] = [];
  transactionType: any[];
  assetCatLog: any[] = [];
  supplierHit = false;
  supplierList: any[];
  supplierDetails: any[];
  supplierEnabled: boolean = false;
  itemData: any = [];
  pageStart = 0;
  pageSize = 10;
  userId = Number(localStorage.getItem('dXNlcklk'));
  idInventoryEdit: boolean = false;
  editSupplierData: any;
  selectedLinkType: any = 'IAL-MN';
  selectedAssetLink: any[] = [];
  assetTypeList: any;
  activityCategoryList: any;
  assetModelList: any;
  selectedLinkResources = [];
  selectedTypeName: any;
  displayColumn: any [] = ['Item Id', 'Asset Type', 'Identifying Name', 'Status'];
  columnData: any [] = ['itemMasterId', 'identifyingTypeName', 'identifyingValueName', 'status'];
  public subitemSearch = new FormControl('');
  public filteredModelSearch: any[] = []; 
  public routineTypes: any[] = [];
  public excludeFields = [];
  public statusList = [];
  public enableItemStatus = [];
  public statusMapping = {};
  constructor(
    public form: FormBuilder, public dialog: MatDialog, protected sanitizer: DomSanitizer, public toastr: AppToastService,
    public snackbar: MatSnackBar, @Optional() public thisDialogRef: MatDialogRef<ItemMasterManagementComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService, private readonly workflowService: WorkflowService, private readonly dateFormat: DatePipe,
    private readonly lookupService: LookupTermService) {
    this.activate_btn = this.commonService.getActivePermission('button'),
    this.buildForm();
    this.getItemsConfig();
  }

  ngOnInit() {
    this.buildForm();
    if (this.data.itemData && this.data.itemData.id) {
      let id = this.data.type === 'inventory' ? this.data.itemData.itemMasterId : this.data.itemData.id;
      this.itemMasterById(id);
      this.getAssetLink(id);
    }
    this.getAppTerms();
    this.thisDialogRef.keydownEvents().subscribe(result => {
      if (result.key === "Escape") {
        this.thisDialogRef.close()
      }
    });
  }

  getAppTerms() {
    this.lookupService.getAppTermsWrapper('DocumentType,ItemType,ItemCategory,TransactionType,ItemAssetLinkType,AssetType,ActivityCategory').subscribe(res => {
      this.documentType = res.DocumentType ?? [];
      this.itemType = res.ItemType ?? [];
      this.transactionType = res.TransactionType ?? [];
      this.assetTypes = res.ItemAssetLinkType ?? [];
      this.assetTypeList = res.AssetType ?? [];
      this.activityCategoryList = res.ActivityCategory ?? [];
    });
    this.workflowService.getAssetModelNo().subscribe(res => {
      this.assetModelList = res.results;
    })
    this.lookupService.getAppTermsLinkWrapper('RC-PRD', 'RoutineType').subscribe(res => {
      this.routineTypes = res.RoutineType ?? [];
    })
  }

  getItemCategory(event, type){
    let selectedCode = null;
    if(type === 'select'){
      selectedCode = event.value
    } else {
      selectedCode = event;
    }
    this.lookupService.getAppTermsLinkWrapper(selectedCode).subscribe(res =>{
      this.itemCategory = res.ItemCategory ?? [];
    })
  }

  getItemsConfig(){
    this.configurationServices.getConfigFile('item-master-config').subscribe(res => {
      const config = res.results?.contentObject;
      if(config){
        this.excludeFields = config?.excludeFields ?? [];
        this.itemStatusHandling(config);
      }
    })
  }

  private itemStatusHandling(config){
    const createStatus = config?.createItemStatus?.[0] ?? 'ITS-REC';
    this.statusMapping = config?.itemStatusMapping;
    const editItemStatus = config?.editItemStatus;
    const defaultEditStatus = config?.enableItemStatus;
    const isEditEnabled = this.activate_btn.includes('BT_IM_EIS');
    this.enableItemStatus = isEditEnabled ? editItemStatus: defaultEditStatus;
    this.lookupService.getAppTermsWrapper('ItemStatus').subscribe(res => {
      if(this.data?.itemData?.statusId && this.statusMapping?.hasOwnProperty(this.data?.itemData?.statusId) && this.statusMapping[this.data?.itemData?.statusId]) {
        this.statusList = res?.ItemStatus.filter(itemStatus => this.statusMapping[this.data?.itemData?.statusId].includes(itemStatus.code)) ?? [];
      }else {
        this.statusList = res?.ItemStatus.filter(status => status.code === createStatus) ?? [];
        this.itemForm.get('itemStatus')?.setValue(createStatus);
      }
      let itemStatusValue = this.itemForm.controls.itemStatus.value;
      if(this.enableItemStatus?.includes(itemStatusValue)) {
        this.itemForm.get('itemStatus')?.enable();
      }else {
        this.itemForm.get('itemStatus')?.disable();
      }
    })
  }

  public buildForm() {
    this.itemForm = this.form.group({
      itemNo: [this.itemData && this.itemData.itemNo ? this.itemData.itemNo : null, [Validators.required, Validators.pattern(/.*\S.*/)]],
      itemType: [this.itemData && this.itemData.itemTypeId ? this.itemData.itemTypeId : null, [Validators.required]],
      itemCategory: [{value : this.itemData && this.itemData.itemCategoryId ? this.itemData.itemCategoryId : null, disabled: this.itemData.itemCategoryId}, [Validators.required]],
      description: [this.itemData && this.itemData.description ? this.itemData.description : null],
      name: [this.itemData && this.itemData.name ? this.itemData.name : null,[Validators.required, Validators.pattern(/.*\S.*/)]],
      reorderLevel: [this.itemData && this.itemData.reorderLevel ? this.itemData.reorderLevel : null],
      minStock: [this.itemData && this.itemData.minimumStockLevel ? this.itemData.minimumStockLevel : null],
      uom: [this.itemData && this.itemData.unitOfMeasure ? this.itemData.unitOfMeasure : null],
      averageCost: [this.itemData && this.itemData.averageCost ? this.itemData.averageCost : null],
      routineTypeId: [this.itemData && this.itemData.routineTypeId ? this.itemData.routineTypeId : null],
      activityCategoryId: [this.itemData && this.itemData.activityCategoryId ? this.itemData.activityCategoryId : null],
      comments: [this.itemData && this.itemData.comments ? this.itemData.comments : null],
      totalQuantity:[this.itemData && this.itemData.totalQuantity ? this.itemData.totalQuantity :null],
      batchId: [null, [Validators.required],[this.ValidateExistingCode.bind(this)]],
      invComments: [null],
      expiryDate: [null,Validators.required],
      purchaseOrderId: [null,[Validators.required],[this.ValidateExistingCode.bind(this)]],
      unitCost: [null],
      quantity: [null, Validators.required],
      supplierId: [null, Validators.compose([this.validateSupplierSelection.bind(this),Validators.required])],
      transactionTypeId: ['TRT-IN'],
      userId: [null],
      itemLink: [null],
      assetType: ['IAL-MN'],
      attachFiles: this.form.array([this.getFiles()]),
      documentName: [this.data.documentName ? this.data.attachFiles[0].documentName : null, [Validators.maxLength(64)]],
      documentTypeId: [this.data.documentTypeId ? this.data.attachFiles[0].documentTypeId : null],
      itemStatus : [this.itemData && this.itemData.statusId ? this.itemData.statusId : null]
    })
  }

  private getFiles() {
    return this.form.group({
      base64Data: [''],
      fileType: [''],
      documentTypeId: [this.data.documentTypeId ? this.data.documentTypeId : null],
      documentName: [this.data.documentName ? this.data.documentName : null],

    });
  }

  itemMasterById(id) {
    this.getitemLinkById(id);
    this.workflowService.getAllIterm().subscribe(res =>{
    this.itemLinkList = res.results.filter(val => val.id != id);
    const usedIds = this.itemLinkDataSource.map(d => d.id);
    this.itemLinkList = this.itemLinkList.filter(opt => !usedIds.includes(opt.id));
      this.filteredModelSearch = [...this.itemLinkList];
      this.subitemSearch.valueChanges.subscribe(searchText => {
        const lower = (searchText || '').toLowerCase();
        this.filteredModelSearch = this.itemLinkList.filter(model => model.name?.toLowerCase().includes(lower)
        );
      });
    });

    this.workflowService.getAllIterm(id).subscribe(res => {
      this.itemData = res.results[0];
      this.getItemCategory(this.itemData.itemTypeId, '');
      this.buildForm();
      if(this.itemData){
        if(this.data.tab === 'inventory' || this.selectedTab !='Item Link'){
          this.selectedIndex = 1;
          this.selectedTab = 'Inventory';
        }else{
          this.onTabChanged({index: this.selectedIndex,tab:{textLabel:this.selectedTab}})
        }
      }
    })
  }

  getAssetLink(id){
   this.workflowService.getAssetLinkInv(id).subscribe(res =>{
    this.selectedAssetLink = res.results
    this.selectedLinkResources = res.results
   })
  }

  private validateSupplierSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.supplierDetails || this.supplierDetails.length === 0) {
        return { invalidSupplierSelection: true };
      }

      let selectedSupplier = this.supplierDetails.find(val => {
        let combinedName = `${val.name}`;
        return val.id === selectedId || combinedName === selectedId;
      });
      if (!selectedSupplier) {
        return { invalidSupplierSelection: true };
      }
    }
    return null;
  }

  private ValidateExistingCode(control: FormControl) {
    const value = control.value;

    if (!value) {
      return of(null);  
    }

    return timer(400).pipe( 
      switchMap(() => this.workflowService.validateItemId(value)),
      map(res => {
        return res?.results === 'code already exist' ? { codeExists: true }: null;
      }),
      catchError(() => of(null))
    );
  }


  getsupplierName(id) {
    if (id) {
      const suppierName = this as any as { id: string, name: string }[]
      const supplierId = suppierName.find(obj => obj.id === id).name;
      return supplierId;
    } else {
      return '';
    }
  }

  onWindowResized(size) {
    this.contentHeight = size - 55;
    this.contentHeighttable = size - 310
  }

  handleFileSelect(evt) {
    const files = evt.target.files;
    if (files.length > 3 || this.attachFiles.length + files.length > 3) {
      this.toastr.warning('Warning', `sorry, you can upload only 3 files!`);
      this.itemForm.controls['documentTypeId'].reset();
      this.itemForm.controls['documentName'].reset();
      return;
    }
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowed_types.includes(evt.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (const file of files) {
      if (file) {
        this.fileType = file.type;
        const reader = new FileReader();

        reader.onload = (function (f) {
          return function (readerEvt) {


            const binaryString = readerEvt.target.result

            this.base64Data_global = btoa(binaryString);

            this.isFileSelected = true;

            if (f.type.includes('image')) {
              const url = this.safeUrl('data:image/png;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/pdf') {
              const url = this.safeUrl('data:application/pdf;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'application/msword') {
              const url = this.safeUrl('data:application/msword;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: url,
                mimeType: f.type
              }
            }

            if (f.type === 'text/plain') {
              const url = this.safeUrl('data:text/plain;base64,' + this.base64Data_global);
              this.imageData.push({
                file: url,
                mimeType: f.type
              });
              this.image = {
                file: reader.result,
                mimeType: f.type
              }
            }
            this.isAddDoc = true;
          };
        })(file).bind(this);
        reader.readAsBinaryString(file);
      }
    }
  }

  createRequest(data) {
    let rowData = {type: 'item', intendData: null, itemData: data}
    const dialogRef = this.dialog.open(DeliveryReqManagementComponent, {
      data: rowData, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getAllItemDelivery();
    });
  }

  onTabChanged(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    if (this.selectedTab === 'Documents' && this.itemData.id) {
      this.commonService.getItemAttachment(this.itemData.id, 'ItemMaster').subscribe(res => {
        this.attachFiles = res.results;
        this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
        if (this.docSourceIdentifier.data.length > 0) {
          this.isDocTable = true;
        }
      });
    } else if (this.selectedTab === 'Inventory') {
      this.getAllInventory();
    } else if (this.selectedTab === 'Indent') {
      this.getAllItemDelivery();
    } else if (this.selectedTab === 'Asset Link') {
      if(this.itemForm.controls['assetType'].value === 'IAL-ALT'){
        this.assetCatLog = this.assetTypeList;
      } else {
        this.assetCatLog = this.assetModelList;
      }
    }
  }

  isSelectedAsset(asset: any): boolean {
    let selectedVal = this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.code;
    return this.selectedAssetLink.some(selected => selected.identifyingValue == selectedVal);
  }

  toggleSelection(event, asset) {
    const isChecked = event.checked;
    if (isChecked) {
      let selectedVal = this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.code
      if (!this.selectedAssetLink.some(selected => selected.identifyingValue == selectedVal)) {
          this.selectedAssetLink.push({
            id: null,
            identifyingType: this.itemForm.controls['assetType'].value,
            identifyingTypeName: this.selectedTypeName ? this.selectedTypeName[0].value : 'Model Number',
            identifyingValue: this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.code,
            identifyingValueName: this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.value,
            modelNumber: asset.modelNumber ? asset.modelNumber : null,
            itemMasterId: this.itemData.id, 
            status: true,  
          });
      } else {
        this.selectedAssetLink = this.selectedAssetLink.map(selected => {
          let selectedVal = this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.code
          if (selected.identifyingValue == selectedVal) {
            return { ...selected, status: true };
          }
          return selected;
        });
      }
    } else {
      let selectedVal = this.selectedLinkType !== 'IAL-ALT' ? asset.modelNumber : asset.code;
      const selectedLink = this.selectedAssetLink.find(item => item.identifyingValue == selectedVal);
      console.log(selectedLink)
      if (!selectedLink.id) {
        this.selectedAssetLink = this.selectedAssetLink.filter(selected => selected.identifyingValue != selectedVal);
      } else {
        this.selectedAssetLink = this.selectedAssetLink.map(selected => {
          if (selected.identifyingValue == selectedVal) {
            return { ...selected, status: false };
          }
          return selected;
        });
      }
    }
  }

  triggerAction(event) {
    if (event.key === 'edit') {
      this.editInventory(event.data);
    } else if (event.key === 'delete') {
      this.addItemlink(event.key, event.data)
    }
  }

  linkItem(){
    this.selectedLinkResources = this.selectedAssetLink.slice();
  }

  applyFilter(filterValue) {
    if (this.itemForm.controls['assetType'].value === 'IAL-ALT') {
      if (filterValue) {
        filterValue = filterValue.trim().toLowerCase();
        let filterData = this.assetTypeList.filter(o =>
          Object.keys(o).some(k =>
            typeof o[k] === 'string' && o[k].toLowerCase().includes(filterValue)
          )
        );
        this.assetCatLog = filterData;
      } else {
        this.assetCatLog = this.assetTypeList;
      }
    } else {
      if (filterValue) {
        filterValue = filterValue.trim().toLowerCase();
        this.assetCatLog = this.assetModelList.filter(o =>
        (o.assetName?.toLowerCase().includes(filterValue) ||
          o.modelNumber?.toLowerCase().includes(filterValue))
        );
      } else {
        this.assetCatLog = this.assetModelList;
      }
    }
  }

  getSupplierSelection(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.supplierHit = event.toHit;
        this.commonService.getSupplierById(null, event.text).subscribe(res => {
          this.supplierList = res.results;
          this.supplierDetails = this.supplierList;
          this.supplierEnabled = true;
        })
      } else {
        this.supplierDetails = this.supplierList
        this.supplierEnabled = true;
      }
    } else {
      this.supplierList = [];
      this.supplierEnabled = false;
    }
  }

  getAllItemDelivery(){
    this.workflowService.getAllDelivery(null,null,null,this.itemData.id).subscribe(res => {
      this.intendDataSource = res.results;
    })
  }

  getAllInventory() {
    this.workflowService.getAllInventory(null, null, this.itemData.id).subscribe(res => {
      this.inventoryDataSource = res.results;
    })
  }

  isAllSelected(event) {
    if (event == "documents") {
      const numSelected = this.docSelection.selected.length;
      const numRows = this.docSourceIdentifier.data.length;
      return numSelected === numRows;
    }
  }

  removeSelectedRows(event) {
    if (event == "documents") {
      let i = 1;
      this.docSelection.selected.forEach(item => {

        if (item['attachmentId'] != null) {
          this.commonService.deleteItemAttachment(item['attachmentId']).subscribe(res => {
          });
          if (i == this.docSelection.selected.length) {
            this.toastr.success('Success', `Attachment removed successfully!`);
          }
        }
        const index: number = this.attachFiles.findIndex(d => d === item);
        this.docSourceIdentifier.data.splice(index, 1);

        if (this.docSourceIdentifier.data.length > 0) {
          this.isDocTable = true;
        } else {
          this.isDocTable = false;
        }
        this.docSourceIdentifier = new MatTableDataSource<any>(this.docSourceIdentifier.data);
        this.isEditDocRow = false;
        this.itemForm.controls['documentTypeId'].reset();
        this.itemForm.controls['documentName'].reset();
        this.isDeleteDoc = false;
        i = i + 1;
      });
      this.docSelection = new SelectionModel<any>(true, []);
    }
  }

  checkEvent(event) {
    if (event == "documents") {
      setTimeout(() => this.removeIcon(this.docSelection.selected.length, event), 200);
    }
  }

  updateReorderQuantity(change: number): void {
    const control = this.itemForm.get('reorderLevel');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }

  updateminiumQuantity(change: number): void { 
    const control = this.itemForm.get('minStock');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated); 
  }

  removeIcon(length, event) {
    if (event == "documents") {
      if (length == 1) {
        this.isEditDocRow = true;
        this.editRow('documents')
      } else {
        this.isEditDocRow = false;
        this.isFileSelected = false;
        this.isAddDoc = false;
        this.itemForm.controls['documentName'].reset();
      }
      if (length > 0) {
        this.isDeleteDoc = true;
      } else {
        this.isDeleteDoc = false;
      }
    }
  }

  editRow(type) {
    if (type == 'documents') {
      this.docSelection.selected.forEach(item => {
        const index: number = this.attachFiles.findIndex(d => d === item);
        let val = this.docSourceIdentifier.data[index];
        this.itemForm.controls['documentName'].setValue(val['fileName']);
      });
    }
  }
  addEditRow(type) {
    if (type == 'documents') {
      this.docSelection.selected.forEach(item => {
        const index: number = this.attachFiles.findIndex(d => d === item);

        if (item['attachmentId'] != null) {
          this.configurationServices.deleteAttachment(item['attachmentId']).subscribe(res => {
            this.toastr.success('Success', `Attachment updated successfully!`);
          });
        }
        this.docSourceIdentifier.data.splice(index, 1);

        let documentTypeName = this.documentType.filter(val => val.code == this.itemForm.controls['documentTypeId'].value);
        this.attachFiles.push({
          fileName: this.itemForm.controls['documentName'].value,
          fileType: this.image.mimeType,
          base64Data: this.base64Data_global,
          attachmentId: null,
        });
        this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
        this.itemForm.controls['documentName'].reset();
        this.docSelection.clear();
        this.isDocTable = true;
        this.fileInfo = null;
        this.isFileSelected = false;
        this.isAddDoc = false;
        this.isEditDocRow = false;
        this.isDeleteDoc = false;
      });
    }
  }

  onFileSelect(input: HTMLInputElement): void {
    function formatBytes(bytes: number): string {
      const UNITS = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const factor = 1024;
      let index = 0;
      while (bytes >= factor) {
        bytes /= factor;
        index++;
      }
      return `${parseFloat(bytes.toFixed(2))} ${UNITS[index]}`;
    }
    const file = input.files[0];
    this.fileInfo = `${file.name} (${formatBytes(file.size)})`;
  }

  addDocRow() {
    this.isAddDoc = true;
    let documentTypeName = this.documentType.filter(val => val.code == this.itemForm.controls['documentTypeId'].value);
    this.attachFiles.push({
      fileName: this.itemForm.controls['documentName'].value,
      fileType: this.image.mimeType,
      base64Data: this.base64Data_global,
      attachmentId: null,
      image: this.image.file
    });

    this.docSourceIdentifier = new MatTableDataSource(this.attachFiles);
    this.isDocTable = true;
    this.itemForm.controls['documentTypeId'].reset();
    this.itemForm.controls['documentName'].reset();
    this.fileInfo = null;
    this.isAddDoc = false;
    this.isFileSelected = false;
  }

  getFileDownload(element){
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  masterDocToggle(event) {
    this.isAllSelected(event) ? this.docSelection.clear() : this.docSourceIdentifier.data.forEach(row => this.docSelection.select(row));
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  getAssetType(event){
    if (this.searchInputClear) {
      this.searchInputClear.nativeElement.value = '';
    }
    this.selectedLinkType = event.value;
    this.selectedTypeName = this.assetTypes.filter(res => res.code === this.selectedLinkType);
    if(this.selectedLinkType === 'IAL-ALT'){
      this.assetCatLog = this.assetTypeList;
    } else {
      this.assetCatLog = this.assetModelList;
    }
  }

  editInventory(data) {
    this.editSupplierData = data;
    this.idInventoryEdit = true;
    this.itemForm.patchValue({
      batchId: data.batchId,
      invComments: data.comments,
      expiryDate: this.dateFormat.transform(data.expiryDate, 'yyyy-MM-dd'),
      purchaseOrderId: data.purchaseOrderId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      transactionTypeId: data.transactionTypeId,
      supplierId: data.supplierName
    })
    if (data.supplierId !== null) {
      this.commonService.getSupplierById(data.supplierId).subscribe(res => {
        this.supplierDetails = res.results.filter(val => val.id == data.supplierId);
        this.itemForm.controls.supplierId.updateValueAndValidity();
      })
    }
  }

  updateindentQuantity(change: number, type): void {
    let control: any
    if(type === 'quantity') {
      control = this.itemForm.get('quantity');
    } 
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 1) return;
    control?.setValue(updated);
  }

  createItemMaster() {
    let updateAttachFile = []
    for(let i in this.attachFiles){
      if(this.attachFiles[i].hasOwnProperty('image')){
        delete this.attachFiles[i].image;
        delete this.attachFiles[i].attachmentId;
      }
      if(this.attachFiles[i].attachmentId == null){
        updateAttachFile.push(this.attachFiles[i]);
      }
    }
    this.createItems = new CreateItems(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null)
    this.createItems.itemNo = this.itemForm.controls['itemNo'].value;
    this.createItems.itemTypeId = this.itemForm.controls['itemType'].value;
    this.createItems.itemCategoryId = this.itemForm.controls['itemCategory'].value;
    this.createItems.description = this.itemForm.controls['description'].value;
    this.createItems.name = this.itemForm.controls['name'].value;
    this.createItems.reorderLevel = this.itemForm.controls['reorderLevel'].value;
    this.createItems.minimumStockLevel = this.itemForm.controls['minStock'].value
    this.createItems.unitOfMeasure = this.itemForm.controls['uom'].value;
    this.createItems.averageCost = this.itemForm.controls['averageCost'].value;
    this.createItems.routineTypeId = this.itemForm.controls['routineTypeId'].value;
    this.createItems.comments = this.itemForm.controls['comments'].value;
    this.createItems.activityCategoryId = this.itemForm.controls['activityCategoryId'].value;
    this.createItems.fileAttachments = updateAttachFile.length ? updateAttachFile : null;
    this.createItems.status = this.itemForm.controls['itemStatus'].value;
    this.createItems.isActive = true;
    this.workflowService.createItemMaster([this.createItems]).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      let data = {type: 'item', tab: 'inventory', itemData: res.results[0]}
      this.data = data;
      console.log(res.results)
      this.data.itemData = res.results[0];
      this.getItemsConfig();
      this.itemMasterById(res.results[0].id)
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  editItemMaster() {
    let updateAttachFile = []
    for(let i in this.attachFiles){
      if(this.attachFiles[i].hasOwnProperty('image')){
        delete this.attachFiles[i].image;
        delete this.attachFiles[i].attachmentId;
      }
      if(this.attachFiles[i].attachmentId == null){
        updateAttachFile.push(this.attachFiles[i]);
      }
    }
    this.modifyItems = new ModifyItems(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null)
    this.modifyItems.id = this.itemData.id;
    this.modifyItems.itemNo = this.itemForm.controls['itemNo'].value;
    this.modifyItems.itemTypeId = this.itemForm.controls['itemType'].value;
    this.modifyItems.itemCategoryId = this.itemForm.controls['itemCategory'].value;
    this.modifyItems.description = this.itemForm.controls['description'].value;
    this.modifyItems.name = this.itemForm.controls['name'].value;
    this.modifyItems.reorderLevel = this.itemForm.controls['reorderLevel'].value;
    this.modifyItems.minimumStockLevel = this.itemForm.controls['minStock'].value
    this.modifyItems.unitOfMeasure = this.itemForm.controls['uom'].value;
    this.modifyItems.averageCost = this.itemForm.controls['averageCost'].value;
    this.modifyItems.routineTypeId = this.itemForm.controls['routineTypeId'].value;
    this.modifyItems.activityCategoryId = this.itemForm.controls['activityCategoryId'].value;
    this.modifyItems.comments = this.itemForm.controls['comments'].value;
    this.modifyItems.fileAttachments = updateAttachFile.length ? updateAttachFile : null;
    this.modifyItems.status = this.itemForm.controls['itemStatus'].value;
    this.modifyItems.isActive = true;
    let linkData = []
    for(let link of this.selectedLinkResources){
      let linkAsset = {
        "id": link.id,
				"identifyingType": link.identifyingType,
				"identifyingValue": link.identifyingValue,
				"itemMasterId": link.itemMasterId,
        "startDate":null,
        "endDate": null,
				"status": link.status
      }
      linkData.push(linkAsset);
    }
    this.modifyItems.itemAssetLinks = linkData;
    this.workflowService.createItemMaster([this.modifyItems]).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close();
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  AddInventory() {
    this.createInventory = new CreateInventory(null, null, null, null, null, null, null, null, null, null,null)
    this.createInventory.batchId = this.itemForm.controls['batchId'].value;
    this.createInventory.purchaseOrderId = this.itemForm.controls['purchaseOrderId'].value;
    this.createInventory.itemMasterId = this.itemData.id;
    this.createInventory.supplierId = this.itemForm.controls['supplierId'].value;
    this.createInventory.quantity = this.itemForm.controls['quantity'].value;
    this.createInventory.transactionTypeId = this.itemForm.controls['transactionTypeId'].value;
    this.createInventory.comments = this.itemForm.controls['invComments'].value;
    this.createInventory.expiryDate = this.dateFormat.transform(this.itemForm.controls['expiryDate'].value, 'yyyy-MM-dd HH:mm:ss')
    this.createInventory.unitCost = this.itemForm.controls['unitCost'].value;
    this.createInventory.userId = this.userId;
    this.createInventory.statusId = "ITS-IST";
    this.workflowService.createInventory([this.createInventory]).subscribe(res => {
      if (res.statusCode === 1) {
        this.getAllInventory()
        this.cancelEdit();
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  editSaveInventory() {
    this.modifyInventory = new ModifyInventory(null, null, null, null, null, null, null, null, null, null, null,null)
    this.modifyInventory.id = this.editSupplierData.id
    this.modifyInventory.batchId = this.itemForm.controls['batchId'].value;
    this.modifyInventory.purchaseOrderId = this.itemForm.controls['purchaseOrderId'].value;
    this.modifyInventory.itemMasterId = this.itemData.id;
    if (this.supplierHit) {
      this.modifyInventory.supplierId = this.itemForm.controls['supplierId'].value;
    } else {
      this.modifyInventory.supplierId = this.editSupplierData.supplierId;
    }
    this.modifyInventory.quantity = this.itemForm.controls['quantity'].value;
    this.modifyInventory.transactionTypeId = this.itemForm.controls['transactionTypeId'].value;
    this.modifyInventory.comments = this.itemForm.controls['invComments'].value;
    this.modifyInventory.expiryDate = this.dateFormat.transform(this.itemForm.controls['expiryDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.modifyInventory.userId = this.userId;
    this.modifyInventory.unitCost = this.itemForm.controls['unitCost'].value;
    this.modifyInventory.statusId = "ITS-IST";
    this.workflowService.createInventory([this.modifyInventory]).subscribe(res => {
      if (res.statusCode === 1) {
        this.idInventoryEdit = false
        this.editSupplierData = null;
        this.getAllInventory();
        this.cancelEdit();
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  cancelEdit() {
    this.idInventoryEdit = false;
    this.editSupplierData = null;
    this.supplierEnabled = false;
    this.itemForm.patchValue({
      transactionTypeId: 'IN',
    });
    this.itemForm.get('batchId').reset();
    this.itemForm.get('invComments').reset();
    this.itemForm.get('expiryDate').reset();
    this.itemForm.get('purchaseOrderId').reset();
    this.itemForm.get('quantity').reset();
    this.itemForm.get('supplierId').reset();
    this.itemForm.get('unitCost').reset();
  }
  fixClick() {
    console.log('')
  }
  addItemlink(type, data?) {
    let payload = null
    let itemMasterGroupId = this.itemData.id;
    if(type === 'delete'){
      payload = [{
        id: data.itemMasterLinkId,
        itemMasterId: itemMasterGroupId,
        itemMasterSubId: data.id,
        isDeleted: true
      }]
    } else {
      let itemList = this.itemForm.controls['itemLink'].value;
      payload = itemList.map(subId => ({
        id: null,
        itemMasterId: itemMasterGroupId,
        itemMasterSubId: subId,
        isDeleted: null
      }));
    }
    this.workflowService.createItemMasterLink(payload).subscribe(res => {
      if (res.statusCode == 1) {
        this.toastr.success('Success', `${res.message}`);
        this.itemForm.controls.itemLink.setValue(null);
        this.itemMasterById(this.itemData.id)
        
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  getitemLinkById(id) {
    this.showTable = false;
    this.workflowService.getSubOrderById(id).subscribe(res => {
      if (res.statusCode == 1) {
        this.showTable = true;
        this.itemLinkDataSource = res.results;
      }
    },
      error => {
        this.showTable = true;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  deleteitems(data) {
    console.log('', )
  }

  onFilterSearchOpened(opened) {
    if (opened) {
      this.filteredModelSearch = this.itemLinkList;
    }
  }
}

