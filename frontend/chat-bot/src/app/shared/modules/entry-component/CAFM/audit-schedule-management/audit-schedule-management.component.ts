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
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System
 * ======================================================================================================
 ******************************************************************************/
import { DatePipe } from '@angular/common';
import { Component, Inject} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { DomSanitizer } from '@angular/platform-browser';
import { LightboxOnlineMenuDialogComponent } from '../../../../../ovitag/configuration/asset/asset.component';
import { SelectionModel } from '@angular/cdk/collections';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-audit-schedule-management',
  templateUrl: './audit-schedule-management.component.html',
  styleUrls: ['./audit-schedule-management.component.scss']
})
export class AuditScheduleManagementComponent {

  displayedColumns=[];
  columns =[]
  displayedColumns1= ['select', 'Name', 'Asset Serial No', 'Asset Type', 'Category'];
  columns1 = ['select', 'assetName', 'assetSerialNumber', 'assetType', 'assetCategory'];
  displayedColumns2= ['Name', 'Asset Serial No', 'Asset Type', 'Category','Mode','Audited By','Audited DateTime','Remarks','Attachments'];
  columns2 = ['assetName', 'assetSerialNumber', 'assetType', 'assetCategory','auditModeName','auditedUser','auditDateTime','auditRemarks',''];
  displayedColumns3 =['select','Location Name','Location Type','Location Category','Location Identifier'];
  columns3=['select','fullName','locationTypeName','categoryName','locationIdentifier'];
  displayedColumns4 =['select','Location Name','Location Type','Location Category','Location Identifier','Mode','Audited By','Audited DateTime','Remarks','Attachments'];
  columns4=['select','fullName','locationTypeName','categoryName','locationIdentifier','auditModeName','createdUserName','auditDateTime','remarks',''];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['select'];
  iconColumn = ['select','Audited DateTime','Attachments'];
  public selectedName: any = null;
  public applyFilterValue: any;
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize: number = 50;
  pageStart: number = 0;
  length: number = 0;
  public assetFilter = [
    {
      id: 'assetCategory',
      value: 'Asset Category',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: []
    },
    {
      id: 'assetType',
      value: 'Asset Type',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: []
    },
    {
      id: 'ownedDepartment',
      value: 'Owned Department',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: [],
      dependentFilter: ['ownedUser'],
      isLoadSubFilters: true
    },
    {
      id: 'assignedDepartment',
      value: 'Assigned Department',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: [],
      dependentFilter: ['assignedUser'],
      isLoadSubFilters: true
    },
    {
      id: 'ownedUser',
      value: 'Owned User',
      isAll: false,
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'assignedUser',
      value: 'Assigned User',
      isAll: false,
      subFilters: [],
      defaultSelected: []
    }
  ];
  public locationFilter = [
    {
      id: 'locationCategory',
      value: 'Location Category',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: []
    },
    {
      id: 'locationType',
      value: 'Location Type',
      isAll: false,
      subFilters: [],
      disable: false,
      defaultSelected: []
    }
  ];
  public parentFilter = [];
  selectedTabName = 'Audit';
  isAudit = false;
  selection = new SelectionModel<any>(true, []);
  isSelected = true;
  eventColumn =['select']
  selectedAuditData: any =[];
  assetCategoryId=null;
  assetTypeId=null;
  ownerDepartmentId=null;
  assignedDepartmentId = null;
  ownerId = null;
  userId = null;
  locationId = null;
  locationTypeId = null;
  locationCategoryId = null;
  totalScheduleRecords = null;
  totalAuditRecords = null;
  totalNonAuditRecords = null

  constructor(private readonly fb: FormBuilder, public toastr: AppToastService, private readonly commonServices: CommonService, private readonly configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly dateFormat: DatePipe, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog) { }

  ngOnInit() {
    if(this.data?.entityType ==='Asset'){
      this.parentFilter = this.assetFilter;
      this.assetTypeId = this.data?.assetTypeId ?? null;
      this.assetCategoryId = this.data?.assetCategoryId ?? null;
      this.ownerDepartmentId = this.data?.departmentId ?? null;
      this.assignedDepartmentId = this.data?.usedDepartmentId ?? null;
      this.ownerId = this.data?.ownerId ?? null;
      this.userId = this.data?.assignedUserId ?? null;
      this.locationId = this.data?.locationId ?? null;
      this.getAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.applyFilterValue ?? null,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
      this.commonService.getAppTerms('AssetType').subscribe(res => {
        const assetTypeFilter = this.parentFilter?.find(f => f.id === 'assetType');
        if (assetTypeFilter) {
          assetTypeFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
          if (this.data?.assetTypeId) {
            assetTypeFilter.defaultSelected.push(this.data.assetTypeId);
            assetTypeFilter.disable = true;
          }
        }
      });

      this.commonService.getAppTerms('AssetCategory').subscribe(res => {
        const assetCategoryFilter = this.parentFilter?.find(f => f.id === 'assetCategory');
        if (assetCategoryFilter) {
          assetCategoryFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
          if (this.data?.assetCategoryId) {
            assetCategoryFilter.defaultSelected.push(this.data.assetCategoryId);
            assetCategoryFilter.disable = true;
          }
        }
      });

      this.configurationService.getAssetDepartment().subscribe(res => {
        const ownedDepartmentFilter = this.parentFilter?.find(f => f.id === 'ownedDepartment');
        const assignedDepartmentFilter = this.parentFilter?.find(f => f.id === 'assignedDepartment');

        if (ownedDepartmentFilter) {
          ownedDepartmentFilter.subFilters = res.results.map(({ id, name }) => ({ code: id, value: name }));

          if (this.data?.departmentId) {
            ownedDepartmentFilter.defaultSelected = [this.data.departmentId];
            ownedDepartmentFilter.disable = true;
          }
        }

        if (assignedDepartmentFilter) {
          assignedDepartmentFilter.subFilters = res.results.map(({ id, name }) => ({ code: id, value: name }));

          if (this.data?.usedDepartmentId) {
            assignedDepartmentFilter.defaultSelected = [this.data.usedDepartmentId];
            assignedDepartmentFilter.disable = true;
          }
        }

        this.configurationService.getOwnerAssignedUserList(this.data?.departmentId ?? null, 'true').subscribe(res => {
            const ownedUserFilter = this.parentFilter.find(f => f.id === 'ownedUser');
            if (ownedUserFilter) {
              ownedUserFilter.subFilters = res.results.map(({ userId, userName }) => ({ code: userId, value: userName }));
              if (this.data?.ownerId) {
                ownedUserFilter.defaultSelected = [];
                ownedUserFilter.disable = true;
              }
            }
          });

        this.configurationService.getOwnerAssignedUserList(this.data?.usedDepartmentId ?? null, 'true').subscribe(res => {
            const assignedUserFilter = this.parentFilter.find(f => f.id === 'assignedUser');
            if (assignedUserFilter) {
              assignedUserFilter.subFilters = res.results.map(({ userId, userName }) => ({ code: userId, value: userName }));
              if (this.data?.assignedUserId) {
                assignedUserFilter.defaultSelected = [];
                assignedUserFilter.disable = true;
              }
            }
          });
      });

      this.displayedColumns = this.displayedColumns1;
      this.columns = this.columns1;
    } else {
      
      this.parentFilter = this.locationFilter;
      this.locationCategoryId = this.data?.locationCategoryId ?? null;
      this.locationTypeId = this.data?.locationTypeId ?? null;

      this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);

      this.commonService.getAppTerms('LocationCategory').subscribe(res => {
        const locationCategoryFilter = this.parentFilter?.find(f => f.id === 'locationCategory');
        if (locationCategoryFilter) {
          locationCategoryFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
          if (this.data?.locationCategoryId) {
            locationCategoryFilter.defaultSelected.push(this.data.locationCategoryId);
            locationCategoryFilter.disable = true;
          }
        }
      });

      this.commonServices.getAllLocationType().subscribe(res => {
       const locationTypeFilter = this.parentFilter?.find(f => f.id === 'locationType');
        if (locationTypeFilter) {
        locationTypeFilter.subFilters = res.results.map(({ id, name }) => ({code: id,value: name}));
          if (this.data?.locationTypeId) {
            locationTypeFilter.defaultSelected.push(this.data.locationTypeId);
            locationTypeFilter.disable = true;
          }
        }
      });

      this.displayedColumns = this.displayedColumns3;
      this.columns = this.columns3;
    }
  }

  getAuditHeaderDetails() {
    if (!this.data) return '';
    const details = [];
    if (this.data?.name) {
      details.push('Schedule Name: ' + this.data.name);
    }

    if (this.data?.auditScheduleTypeName) {
      details.push('Audit Type: ' + this.data.auditScheduleTypeName);
    }

    if (this.data?.schedulePeriodName) {
      details.push('Schedule Period: ' + this.data.schedulePeriodName);
    }

    if (this.data?.createdUserName) {
      details.push('Created By: ' + this.data.createdUserName);
    }

    return details.join(', ');
  }


  getAuditScheduleInfo(scheduleId, isAudit, pageStart, pageSize, name?,assetTypeId?,assetCategoryId?,ownerDepartmentId?,userDepartmentId?,ownerId?,userId?,locationId?) {
    this.isloading = true;
    this.configurationService.getAuditScheduleInfo(scheduleId, isAudit, pageStart, pageSize, name,assetTypeId,assetCategoryId,ownerDepartmentId,userDepartmentId,ownerId,userId,locationId).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.totalScheduleRecords = this.tableData?.length ? this.tableData?.[0].totalCounts : null;
      this.totalAuditRecords = this.tableData?.length ? this.tableData?.[0].assetAuditedCounts : null;
      this.totalNonAuditRecords = this.tableData?.length ? this.tableData?.[0].assetNonAuditedCounts : null;
      for (let i = 0; i <= this.columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columns[i]];
        });
      }
      this.isloading = false;
    });
  }

  getLocationAuditScheduleInfo(scheduleId,isAudit,pagestart,pagesize,locationCategory?,locationType?,name?){
    this.isloading = true;
    this.commonService.getAuditLocationList(scheduleId,isAudit,pagestart,pagesize,locationCategory,locationType).subscribe(res => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.totalScheduleRecords = this.tableData?.length ? this.tableData?.[0].totalCounts : null;
        this.totalAuditRecords = this.tableData?.length ? this.tableData?.[0].locationAuditedCounts : null;
        this.totalNonAuditRecords = this.tableData?.length ? this.tableData?.[0].locationNonAuditedCounts : null;
        for (let i = 0; i <= this.columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[this.columns[i]];
          });
        }
        this.isloading = false;
      });
  }

  tabChanged(event) {
    this.selectedTabName = event?.tab?.textLabel;
    this.tableData = [];
    this.isAudit = this.selectedTabName === 'Audit' ?  false : true;
    if(this.data.entityType ==='Asset'){
      this.displayedColumns = this.selectedTabName === 'Audit' ? this.displayedColumns1 : this.displayedColumns2;
      this.columns = this.selectedTabName === 'Audit' ? this.columns1 : this.columns2;
      this.getAuditScheduleInfo(this.data.id, this.isAudit, this.pageStart, this.pageSize, this.applyFilterValue,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
    } else {
      this.displayedColumns = this.selectedTabName === 'Audit' ? this.displayedColumns3 : this.displayedColumns4;
      this.columns = this.selectedTabName === 'Audit' ? this.columns3 : this.columns4;
      this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.applyFilterValue = this.applyFilterValue;
    } else {
      this.applyFilterValue = null;
    }
    if(this.data.entityType =='Asset'){
        this.getAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.applyFilterValue,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
    } else {
      this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Audit') {
      this.auditData()
    } else if (event.key === 'groupFilter') {
      const filterInfo = event.data;

      const getFilterValues = (id: string): string | null => {
        const values = filterInfo.filter(f => f.id === id).map(f => f.data);
        return values && values.length > 0 ? values.join(",") : null; // convert to "12,13"
      };

      this.assetCategoryId      = getFilterValues("assetCategory");
      this.assetTypeId          = getFilterValues("assetType");
      this.ownerDepartmentId    = getFilterValues("ownedDepartment");
      this.assignedDepartmentId = getFilterValues("assignedDepartment");
      this.ownerId              = getFilterValues("ownedUser");
      this.userId               = getFilterValues("assignedUser");
      this.locationCategoryId   = getFilterValues("locationCategory");
      this.locationTypeId       = getFilterValues("locationType")
      if(this.data.entityType =='Asset'){
         this.getAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.applyFilterValue,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
      }else{
        this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);
      }
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage(true);
    }
  }

  checkBoxAction(event){
    if (JSON.stringify(this.selectedAuditData) === JSON.stringify(event)) return;
    this.selectedAuditData = event;
  }
 
  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.data.entityType =='Asset'){
        this.getAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.applyFilterValue,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
      } else {
        this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);
      }
    }else if(event.key === 'Remarks' && event?.data?.auditRemarks !=null){
      this.selectedAuditData = event?.data;
      this.auditData();
    } else if(event.key === 'Attachment'){
      this.openPreview(event.data)
    }
  }

  openPreview(element){
   const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    if(this.data.entityType =='Asset'){
       this.getAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.applyFilterValue,this.assetTypeId,this.assetCategoryId,this.ownerDepartmentId,this.assignedDepartmentId,this.ownerId,this.userId,this.locationId);
    } else {
       this.getLocationAuditScheduleInfo(this.data.id,this.isAudit,this.pageStart,this.pageSize,this.locationCategoryId,this.locationTypeId,this.applyFilterValue);
    }
  }

  auditData(){
    this.selectedAuditData['scheduleId'] = this.data?.id;
    this.selectedAuditData['entityType'] = this.data?.entityType;
    const dialogRef = this.dialog.open(auditRemarkscomponent, {
      data: this.selectedAuditData,
      height:'350px',
      width :'500px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshPage();
    });
    this.selectedName = null;
    this.selectedAuditData = [];
    this.selectedRow = null;
  }

}

@Component({
  selector: 'app-audit-schedule-management',
  templateUrl: './audit-remarks.component.html',
  styleUrls: ['./audit-schedule-management.component.scss']
})

export class auditRemarkscomponent {
  public remarks = new FormControl(null);
  isFileSelected: boolean = false;
  attachFiles: any[] = [];
  fileInfo: string;

  constructor(
    public form: FormBuilder,
    protected sanitizer: DomSanitizer,
    private readonly configurationService: ConfigurationService,
    public toastr: AppToastService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dateFormat: DatePipe,
    public dialogRef: MatDialogRef<auditRemarkscomponent>,
    private readonly dialog: MatDialog
  ) { }


  ngOnInit() {
    if (this.data?.auditRemarks) {
      this.remarks.setValue(this.data.auditRemarks);
    }
  }

  safeUrl(value: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  handleFileSelect(evt: any) {
    const files = evt.target.files;
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];

    for (const file of files) {
      if (!allowed_types.includes(file.type)) {
        this.toastr.warning('Warning', `File "${file.name}" is not a supported format!`);
        continue;
      }

      const reader = new FileReader();

      reader.onload = (readerEvt: any) => {
        const binaryString = readerEvt.target.result;
        const base64Data = btoa(binaryString);

        let fileObj: any = {
          fileName: file.name,
          fileType: file.type,
          base64Data: base64Data,
          createdBy: localStorage.getItem(btoa('current_user')),
          createdOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
          modifiedOn: null,
          modifyByName: null
        };

        // preview handling
        if (file.type.includes('image')) {
          fileObj.image = this.safeUrl('data:image/png;base64,' + base64Data);
        } else if (file.type === 'application/pdf') {
          fileObj.image = this.safeUrl('data:application/pdf;base64,' + base64Data);
        } else if (file.type === 'text/plain') {
          fileObj.image = this.safeUrl('data:text/plain;base64,' + base64Data);
        }

        this.attachFiles.push(fileObj);
        this.isFileSelected = true;
      };

      reader.readAsBinaryString(file);
    }
    evt.target.value =null
  }

  removeFile(index: number) {
    this.attachFiles.splice(index, 1);
    if (this.attachFiles.length === 0) {
      this.isFileSelected = false;
    }
  }

  openPreview(file: any) {
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: file, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onSaveAudit() {
    const currentDateTime = this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const userId = localStorage.getItem(btoa('userId'));
    const entityType = this.data.entityType;
    const scheduleId = this.data.scheduleId;
    const isSingle = this.data?.length === 1;

      const payload = this.data?.map((item: any) => ({
        ...(isSingle && { attachFiles: this.attachFiles }),
        auditDateTime: currentDateTime,
        auditScheduleId: scheduleId,
        auditedBy: userId,
        assetId: entityType === 'Asset' ? item.assetId : null,
        locationId: entityType !== 'Asset' ? item.id : null,
        entityId: entityType === 'Asset' ? item.assetId : item.id,
        entityType: entityType,
        isActive: true,
        remarks: this.remarks.value,       
        type: item.type,
        modeId:'MOD-MAN'
      }));
    this.configurationService.postAuditInfo(payload).subscribe({
      next: (res: any) => {
        this.toastr.success('Success', res.message);
        this.dialogRef.close();
      },
      error: (err: any) => {
        this.toastr.error('Error', err.error?.message);
      }
    });
  }

  onDialogClose() {
    this.dialogRef.close();
  }

  fixClick() {
    console.log('')
  }
}

