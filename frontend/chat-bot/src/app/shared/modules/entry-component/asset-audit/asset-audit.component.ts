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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonService, ConfigurationService } from '../../../services';
import { CreateAudit, EditAudit } from './asset-audit.model';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

export const Date_Formats = {
  parse: {
    dateInput: "DD/MM/YYYY",
  },
  display: {
    dateInput: "DD/MM/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};
@Component({
  selector: 'app-asset-audit',
  templateUrl: './asset-audit.component.html',
  styleUrls: ['./asset-audit.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: Date_Formats },
  ],
})
export class AssetAuditComponent implements OnInit {
  auditForm: FormGroup;
  shiftId: number = null;
  auditTypes = [];
  timePeriods = [];
  departmentList = [];
  locationCategory =[];
  locationTypes =[];
  public createAudit: CreateAudit;
  public editAudit: EditAudit;
  matcher = new ErrorStateMatcher();
  public assetTypes=[];
  today = new Date();
  public Criticality =[];
  public locations =[];
  public locationList=[];
  public locationEnabled =false;
  public locationId = null;
  selectedTabName = null;
  tableData = null;
  pageSize = 50;
  pageStart = 0;
  length = 0;
  sortColumn = [];
  eventColumn = [];
  iconHeader = [];
  permissionControl = ['BT_ALLE'];
  iconColumn = ['Audit Status'];
  displayedColumns = [];
  columns = [];
  displayedColumns1 = ['Name', 'Asset Serial No', 'Asset Type', 'Category','Audit Status'];
  columns1 = ['assetName', 'assetSerialNumber', 'assetType', 'assetCategory','isAudit'];
  displayedColumns2 = ['Location Name','Location Type','Location Category','Location Identifier','Audit Status'];
  columns2 = ['fullName','locationTypeName','categoryName','locationIdentifier','isAudit'];
  loading = false;
  statusOptions = [];
  users = [];
  userList = [];
  userId = null;
  userEnabled = false;
  totalScheduleRecords = null;

  constructor(private readonly fb: FormBuilder, public toastr: AppToastService, private readonly commonServices: CommonService, private readonly configurationService: ConfigurationService,public lookupService : LookupTermService,
    private readonly dateFormat: DatePipe,@Inject(MAT_DIALOG_DATA) public data: any,public dialog: MatDialog) {}

  ngOnInit(): void {
    this.buildForm();
    this.getAppterms();
    this.initializeData()
  }

  initializeData(){
    this.shiftId = this.data?.id ?? null;
    if (this.data?.locationName && this.data?.locationId) {
      const locName = this.data.locationName.split(',')[0].trim();
      this.configurationService.getLocationData(locName).subscribe(res => {
        this.locationList = res.results;
        const loc = this.locationList.find(l => l.id === this.data.locationId);
        if (loc) {
          this.locationEnabled = true;
          this.locations = [loc];
          this.auditForm.patchValue({ locationId: loc.id }); 
        }
      })
    }

    if (this.data?.assignedName && this.data?.assignTo) {
      const userName = this.data?.assignedName?.split('')[0].trim();
      this.configurationService.getTicketUser(userName, 'RT-US').subscribe(res => {
        this.userList = res.results;
        const user = this.userList.find(l => l.id === this.data.assignTo);
        if (user) {
          this.userEnabled = true;
          this.users = [user];
          this.auditForm.patchValue({ assignToUserId : user.id }); 
        }
      })
    }
  }
  getAppterms(){
    if(this.data?.entityType ==='Asset'){
      this.configurationService.getAssetDepartment().subscribe(res => {
        this.departmentList = res.results.map(({ id, name }) => ({ id, name }));
      });
      this.lookupService.getAppTermsWrapper('AssetType,Criticality').subscribe(res => {
        this.assetTypes = res.AssetType ?? [];
        this.Criticality = res.Criticality ?? [];
      });
    }else{
      this.lookupService.getAppTermsWrapper('LocationCategory').subscribe(res => {
        this.locationCategory = res.LocationCategory ?? [];
      });
      this.commonServices.getAllLocationType().subscribe(res => {
        this.locationTypes = res.results.map(({id,name}) => ({ id,name }));
      });
    }
    this.lookupService.getAppTermsWrapper('AssetAuditType,SchedulePeriod').subscribe(res => {
      this.auditTypes = res.AssetAuditType ?? [];
      this.timePeriods =  res.SchedulePeriod ?? [];
    })
  }

  buildForm() {
    const loginUserName = localStorage.getItem(btoa('current_user'));
    const isEditable = !this.data?.status || this.data.status === 'RQ-SH';
    this.auditForm = this.fb.group({
      name: [{value: this.data?.name ?? null,disabled: !isEditable}, Validators.required],
      auditType: [{value: this.data?.auditScheduleTypeId ?? null,disabled: !isEditable}, Validators.required],
      timePeriod: [{value: this.data?.schedulePeriodId ?? null,disabled: !isEditable}],
      startDate: [{value: this.data?.startTime? this.dateFormat.transform(this.data?.startTime, 'yyyy-MM-dd') : null,disabled: !isEditable}],
      endDate: [{value: this.data?.endTime? this.dateFormat.transform(this.data?.endTime, 'yyyy-MM-dd') : null,disabled: !isEditable}],
      entityType: [{value: this.data?.entityType ?? 'Asset',disabled: !isEditable}, Validators.required],
      departmentId: [{value: this.data?.departmentId ?? null,disabled: !isEditable}],
      usedDepartmentId: [{value: this.data?.usedDepartmentId ?? null,disabled: !isEditable}],
      assetTypeId: [{value: this.data?.assetTypeId ?? null,disabled: !isEditable}],
      locationCategoryId: [{value: this.data?.locationCategoryId ?? null,disabled: !isEditable}],
      locationTypeId: [{value: this.data?.locationTypeId ?? null,disabled: !isEditable}],
      criticalityId: [{value: this.data?.criticalityId ?? null,disabled: !isEditable}],
      locationId: [{value: this.data?.locationId ?? null,disabled: !isEditable}, [this.locationNameMatch.bind(this)]],
      statusId: [{value: this.data?.statusName ?? null,disabled: true}],
      createdByUser: [{value: this.data?.createdUserName ?? loginUserName, disabled: true}],
      assignToUserId: [{value: this.data?.assignToUserId ?? null,disabled: !isEditable}, [ Validators.required,this.userNameMatch.bind(this)]],
    });
  }

  searchToLocation(event) {
    if (event.text.length >= 2) {
      if (event.toHit) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.locationList = res.results;
          this.locations = this.locationList;
          this.locationEnabled = true;
        })
      } else {
        this.locations = this.locationList;
        this.locationEnabled = true;
      }
    } else {
      this.locations = [];
      this.locationEnabled = false;
    }
  }

  private locationNameMatch(control): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.locations || this.locations.length === 0) {
        return { invalidLocation: true };
      }

     let selectedLocation = this.locations.some(l => l.id === control.value);
     return selectedLocation ? null : { invalidLocation: true };
    }
  }

  getLocationList(id) {
    if (id !== null) {
      const location = this.locations.find(l => l.id === id);
      const locationId = location ? `${location.fullName}` : null;
      return locationId;
    } else {
      return '';
    }
  }

  searchUser(event) {
    if (event.text.length >= 2) {
      if (event.toHit) {
       this.configurationService.getTicketUser(event.text, 'RT-US').subscribe(res => {
          this.userList = res.results;
          this.users = this.userList;
          this.userEnabled = true;
        })
      } else {
        this.users = this.userList;
        this.userEnabled = true;
      }
    } else {
      this.users = [];
      this.userEnabled = false;
    }
  }

  getUserList(id) {
    if (id !== null) {
      const user = this.users.find(l => l.id === id);
      const userId = user ? `${user.name}` : null;
      return userId;
    } else {
      return '';
    }
  }

  private userNameMatch(control): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.users || this.users.length === 0) {
        return { invalidName: true };
      }
     let selectedUser = this.users.some(l => l.id === control.value);
     return selectedUser ? null : { invalidName: true };
    }
  }

  tabChanged(event){
    this.selectedTabName = event?.tab?.textLabel;
    if(this.selectedTabName == 'Audit'){
      this.getAuditScheduleInfo(null)
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAuditScheduleInfo(null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else{
      this.applyFilter(null)
    } 
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    let applyFilterValue = filterValue;
    this.pageStart = 0;
    if (applyFilterValue?.length > 2) {
       this.getAuditScheduleInfo(applyFilterValue);
    } else {
       this.getAuditScheduleInfo(null);
    }
  }

  getAuditScheduleInfo(name?) {
    let scheduleId = this.data?.id;
    let assetTypeId = this.data?.assetTypeId ?? null;
    let assetCategoryId = this.data?.assetCategoryId ?? null;
    let ownerDepartmentId = this.data?.departmentId ?? null;
    let ownerId = this.data?.ownerId ?? null;
    let userDepartmentId = this.data?.usedDepartmentId ?? null;
    let userId = this.data?.assignedUserId ?? null;
    let locationId = this.data?.locationId ?? null;
    let locationTypeId = this.data?.locationTypeId ?? null;
    let locationCategoryId = this.data?.locationCategoryId ?? null;
    this.loading = true;
    const isAsset = this.data?.entityType === 'Asset';
    // Load displayedColumns, columns and corresponding schedule getcall based on entityType
    this.displayedColumns = isAsset ? this.displayedColumns1 : this.displayedColumns2;
    this.columns = isAsset ? this.columns1 : this.columns2;
    const apiCall = isAsset ? this.configurationService.getAuditScheduleInfo(scheduleId, null, this.pageStart, this.pageSize,name,assetTypeId,assetCategoryId,ownerDepartmentId,userDepartmentId,ownerId,userId,locationId)
                            : this.commonServices.getAuditLocationList(scheduleId,null,this.pageStart,this.pageSize,locationCategoryId,locationTypeId);

    apiCall.subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.totalScheduleRecords = this.tableData?.length ? this.tableData?.[0].totalCounts : null;
      for (let i = 0; i <= this.columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columns[i]];
        });
      }
      this.loading =false;
    });
  }

  addAudits(isdialogClose?) {
      let loginUserId: any = localStorage.getItem('dXNlcklk');
      loginUserId = loginUserId != null ? Number(loginUserId) : null;
      const addAudit = new CreateAudit( null, null, null, null, null,null,null,null,null,null,null,null,null,null,null,null);
      addAudit.name = this.auditForm.controls.name.value;
      addAudit.auditScheduleTypeId = this.auditForm.controls.auditType.value;
      addAudit.schedulePeriodId = this.auditForm.controls.timePeriod.value;
      addAudit.entityType = this.auditForm.controls.entityType.value;
      addAudit.departmentId = this.auditForm.controls.departmentId.value;
      addAudit.usedDepartmentId = this.auditForm.controls.usedDepartmentId.value;
      addAudit.assetTypeId = this.auditForm.controls.assetTypeId.value;
      addAudit.locationCategoryId = this.auditForm.controls.locationCategoryId.value;
      addAudit.locationTypeId = this.auditForm.controls.locationTypeId.value;
      addAudit.criticalityId =  this.auditForm.controls.criticalityId.value;
      addAudit.startTime = this.dateFormat.transform(this.auditForm.controls.startDate.value,'yyyy-MM-dd HH:mm:ss');
      addAudit.endTime = this.dateFormat.transform(this.auditForm.controls.endDate.value,'yyyy-MM-dd HH:mm:ss');
      addAudit.locationId = typeof this.auditForm.controls['locationId'].value === 'string' ? this.locationId: this.auditForm.controls['locationId'].value;
      // addAudit.status = this.auditForm.controls.statusId.value;
      addAudit.assignType = 'RT-US';
      addAudit.assignTo = typeof this.auditForm.controls['assignToUserId'].value === 'string'? this.userId: this.auditForm.controls['assignToUserId'].value;
      this.configurationService.addAuditSchedule(addAudit).subscribe({next: (res) => {
        this.toastr.success('Success', `${res.message}`);
        if(isdialogClose){
          this.auditForm.reset();
          this.dialog.closeAll();
          return; 
        }
        const createdId = res.results?.id;
        if (createdId && ! isdialogClose) {
          this.configurationService.getAuditScheduleById(createdId).subscribe({next: (getRes) => {
            if( getRes.results?.length)
              this.data = getRes.results?.[0];
              this.buildForm();
              this.initializeData();
            },
            error: (err) => {
              this.toastr.error('Error', err.error.message);
            }
          });
        }
      },
      error: (error) => {
        this.toastr.error('Error', error.error.message);
      }
    });
  }

  updateAudits(isdialogClose?){
    const updateAudit = new EditAudit( null,null,null, null, null,null,null,null,null,null,null,null,null,null,null,null);

    updateAudit.name = this.auditForm.controls.name.value;
    updateAudit.auditScheduleTypeId = this.auditForm.controls.auditType.value;
    updateAudit.schedulePeriodId = this.auditForm.controls.timePeriod.value;
    updateAudit.entityType = this.auditForm.controls.entityType.value;
    updateAudit.departmentId = this.auditForm.controls.departmentId.value;
    updateAudit.usedDepartmentId = this.auditForm.controls.usedDepartmentId.value;
    updateAudit.assetTypeId = this.auditForm.controls.assetTypeId.value;
    updateAudit.locationCategoryId = this.auditForm.controls.locationCategoryId.value;
    updateAudit.locationTypeId = this.auditForm.controls.locationTypeId.value;
    updateAudit.criticalityId = this.auditForm.controls.criticalityId.value;
    updateAudit.startTime = this.dateFormat.transform(this.auditForm.controls.startDate.value,'yyyy-MM-dd HH:mm:ss'); 
    updateAudit.endTime = this.dateFormat.transform(this.auditForm.controls.endDate.value,'yyyy-MM-dd HH:mm:ss');
    updateAudit.locationId = typeof this.auditForm.controls['locationId'].value === 'string' ? this.locationId : this.auditForm.controls['locationId'].value;
    // updateAudit.status = this.auditForm.controls.statusId.value;
    updateAudit.assignType = "RT-US";
    updateAudit.assignTo = typeof this.auditForm.controls['assignToUserId'].value === 'string'? this.userId : this.auditForm.controls['assignToUserId'].value;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Do you want to update the changes?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        this.data = null;
        this.configurationService.updateAuditSchedule(this.shiftId, updateAudit).subscribe({next: (res) => {
            this.toastr.success('Success', `${res.message}`);
            if(isdialogClose){
              this.auditForm.reset();
              this.shiftId = null;
              this.dialog.closeAll();
              return;
            }
            this.configurationService.getAuditScheduleById(this.shiftId).subscribe({next: (getRes) => {
                  if (getRes?.results?.length) {
                    this.data = getRes?.results[0];
                    this.buildForm();
                    this.initializeData();
                  }
                },
                error: (err) => {
                  this.toastr.error('Error', err.error.message);
                }
              })
          },
          error: (error) => {
            this.toastr.error('Error', error.error.message);
          }   
        })
      }
    })
  }

  saveData( isdialogClose?){
    if (this.shiftId) {
        this.updateAudits(isdialogClose);
    } else {
        this.addAudits(isdialogClose);
    }
  }
}
