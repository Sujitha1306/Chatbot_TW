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
import { Component, OnInit,  Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { CommonService, ConfigurationService, HospitalService } from '../../../shared';
import { routerTransition } from '../../../router.animations';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { SessionStorageService } from '../../../shared/services/session.storage.service';
import { EntityRoutineActivityComponent } from '../../../shared/modules/entry-component/entity-routine-activity/entity-routine-activity.component';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: "app-location",
  templateUrl: "./location-management-new.component.html",
  styleUrls: ["./location-management-new.component.scss"],
  animations: [routerTransition()],
})
export class LocationManagementNewComponent implements OnInit {
  showAction1 = [];
  showAction2 = [
    { id: "modify", value: "Manage Location" },
    {id: "manageRoutine", value:"Manage Routine"}
  ];
  public loading = false;
  public showActions = this.showAction1;
  public rowData: any;
  public activate_btn: any = [];
  public applyFilterValue = null;
  eventColumn = ['Name'];
  iconHeader =['ID'];
  iconColumn = [];
  sortColumn = [];
  tableData: any;
  length: any;
  displayedColumns: string[] = ["ID","Alerts", "Name", "Identifier", "Type", "Parent Location", "Care Setting", "Category", "Location Owner", "Status"];
  selectedRow: any = null;
  public pageStart = 0;
  public pageSize = 50;
  public permissionControl = ['BT_ALLE'];
  public selectedName: any = null;
  public selectDropdown: any;
  public activenode = false;
  public parentFilter = [
    {
      id: 'location',
      value: 'Location',
      isAll: true,
      selectionType: 'multi',
      subFilters: [{ code: 1, value: 'Block' }, { code: 2, value: 'Floor' }, { code: 17, value: 'Room' }, { code: 3, value: 'Ward' }, { code: 20, value: 'Bed space' }],
      defaultSelected: [1,2,17,3,20]
    },
    {
      id: 'status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [{ code: 'Active', value: 'Active' }, { code: 'Inactive', value: 'InActive' }],
      defaultSelected: ['Active', 'Inactive']
    },
  ];
  location = null;
  status = ['Active', 'Inactive'];

  constructor(public commonService: CommonService, public dialog: MatDialog,private readonly route: ActivatedRoute, public router: Router ) {
  }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.LocationManagementNew.results;
    this.length = this.route.snapshot.data.LocationManagementNew.totalRecords;
    this.loading = false;
    if(this.applyFilterValue !== null){
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
    const Columns = ["ID","Alerts", "name", "locationIdentifier","locationTypeName", "parentName", "careSettingName",  "categoryName", "locationOwnerName", "status"];
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map((data) => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
  }

  getAllLocationList(pageStart?: number, pageSize?: number, location?: any, status?: any,sText?: string ) {
    this.loading = true;
    this.commonService.getAllLocationList(pageStart, pageSize, location, status, sText).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.loading = false;
    if(this.applyFilterValue !== null){
      this.applyFilterValue = this.applyFilterValue + ' ';
    }
    const Columns = ["ID","Alerts", "name", "locationIdentifier", "locationTypeName", "parentName", "careSettingName",  "categoryName", "locationOwnerName", "status"];
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map((data) => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
    })
    this.selectedRow = null;
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'manageFilter') {
      console.log(event)
    } else if (event.key === 'groupFilter') {
        let filterInfo = event.data
        let location = [];
        let status = [];
        location = filterInfo.filter(filter => filter.id === 'location').map(code => code.data);
        status = filterInfo.filter(filter => filter.id === 'status').map(code => code.data);
      if (location?.length > 0) {
        this.location = location;
      } else {
        this.location = null;
      }
        this.status = status?.length > 0 ? status : ['Active', 'Inactive'];
      this.getAllLocationList(this.pageStart, this.pageSize, this.location, this.status);
    } else {
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    console.log(event)
    if(event.key === 'Name') {
      this.selectDropdown = null;
      let rowData=event.data;
      const dialogRef = this.dialog.open(EditLocationManagementComponent, {
        data:rowData,
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown=null;
        this.refreshPage();
      });
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getAllLocationList(this.pageStart, this.pageSize, this.location, this.status);
    }
  }
  
  refreshPage(isAutoRefresh?: boolean) {
    this.selectedName = null;
    this.selectedRow = null;
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllLocationList(this.pageStart, this.pageSize, this.location, this.status, this.applyFilterValue);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getAllLocationList(this.pageStart, this.pageSize, this.location, this.status, this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0){
      this.getAllLocationList(this.pageStart, this.pageSize, this.location, this.status);
    }
  }

  rowClick(row) {
    this.selectDropdown = null;
    if (this.selectedRow && row.id == this.selectedRow) {
      this.selectedName = null;
      this.selectedRow = null;
      this.showActions = this.showAction1;
    } else {
      this.selectedRow = row.id;
      this.selectedName = row;
      this.showActions = this.showAction2;
    }
  }

  manageAction(value, data) {
    if (value === 'modify'){
      this.selectDropdown = value;
      let rowData='';
      const dialogRef = this.dialog.open(EditLocationManagementComponent, {
        data:rowData,
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown=null;
        this.refreshPage();
      });
    }else if ( value === 'manageRoutine'){
          data["tabType"] = "Location";
          this.selectDropdown = value;
          data["entityType"] = 'Location';
          data["entityId"] = data.id;
          data["entityName"] = data.Name;
          data["titleName"]= "Location Routine"
          const dialogRef = this.dialog.open(EntityRoutineActivityComponent, {
            data: data,
            panelClass: ["medium-popup"],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe((result) => {
            this.selectDropdown = null;
            this.refreshPage();
          });
        }
  }

}

@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location-management.component.html",
  styleUrls: ["./location-management-new.component.scss"],
  animations: [routerTransition()],
})
export class EditLocationManagementComponent implements OnInit {
  public locationForm: FormGroup;
  public loading: false;
  public locationCategory = [];
  public locationTypes = [];
  public matTabChangeSub : Subject<any> = new Subject();
  public selectedIndex = 0;
  public careSettingList = [];
  public statusList = [{id : 'Active', name : 'Active'},{id : 'Inactive', name : 'Inactive'}]
  public activate_btn: any[] = [];
  public formTemplateType = 'FTT-LOC';
  public entityType = 'location';
  public ticketEntityType = 'LOC'
  public matcher = new ErrorStateMatcherService();
  selectedTab: string;
  entityData: any;
  updateIdentifier: any[] = [];
  createIdentifier: Array<any> = [];
  attachFiles: Array<any> = [];
  UserNameList: any= [];
  ownerId = null;
  userEnabled = false;
  scheduleManagement = {
    'status': 'TW-SMU',
    'scheduleEntityType': 'EGTI-LOC',
    'entityType': 'location',
    'data': this.data
  }
  maintenanceData: any;
  
  constructor(
      public form: FormBuilder,
      public dialog: MatDialog,
      public toastr: AppToastService,
      public snackbar: MatSnackBar,
      @Optional() public thisDialogRef: MatDialogRef<any>,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly configurationServices: ConfigurationService,
      private readonly commonService: CommonService,
      private readonly hospitalService: HospitalService,
      private readonly _dateFormat: DatePipe,
      private readonly sessionService:SessionStorageService
    ) { 
      this.activate_btn = this.commonService.getActivePermission('button')
    }
  ngOnInit(): void {
    this.hospitalService.getAllLogicalLocationType(this.data.parentId).subscribe(res => {
      this.locationTypes = res.results;
    });
    this.commonService.getAppTerms('CareSetting,LocationCategory').subscribe(res => {
      this.careSettingList = res.results.filter(val => val.groupName === 'CareSetting');
      this.locationCategory = res.results.filter(val => val.groupName === 'LocationCategory');
    });
    this.ownerId = this.data?.locationOwnerId;
    this.getIdentifier();
    this.getDocuments();
    this.buildForm();
  }
  
  getIdentifier() {
    this.commonService.getIdentifier(this.data?.id, 'Location').subscribe(res => {
      if (res.results.length > 0) {
        this.createIdentifier = res.results;
      }
    });
  }
  
  getDocuments() {
    this.commonService.getAttachment(this.data?.id, 'Location').subscribe(res => {
      if(res.results.length > 0){
        this.attachFiles = res.results;
      }
    });
  }

  public buildForm() {
    this.locationForm = this.form.group({
      locationCategoryId: [this.data.categoryId ? this.data.categoryId : null],
      locationTypeId: [this.data.locationTypeId ? this.data.locationTypeId : null, [Validators.required]],
      name: [this.data.name ? this.data.name : null, [Validators.required]],
      status : [this.data.status ? this.data.status : 'Active'],
      careSettingId: [this.data.careSettingId ? this.data.careSettingId : null],
      shortName: [this.data.shortName ? this.data.shortName : null],
      locationDescription : [this.data.locationDescription ? this.data.locationDescription : null, [Validators.maxLength(64)]],
      ownerId : [this.data.locationOwnerName ? this.data.locationOwnerName : null]
    })
  }
   
  getSearchUser(event) {
    this.configurationServices.getTicketUser(event.text, 'RT-US').subscribe(res => {
      this.UserNameList = res.results;
      this.userEnabled = true;
    });
  }

  getUserList(id) {
    if (id) {
      const username = this as any as { id: string, name: string }[]
      const userId = username.find(obj => obj.id === id).name;
      return userId;
    } else {
      return '';
    }
  }

  getUserId(id) {
    if(id !== null) {
      this.ownerId = id;
    }
  }

  onDialogClose(){ // To trigger delete data in angular service 
    this.sessionService.deleteAttachFiles()//clear attachment data after dialog close
    this.sessionService.deleteIdentifier()//clear identifier data after dialog close
  }

  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    if (this.selectedTab === 'Audit') {
      this.entityData = {"entityId":this.data.id,"entityType":'Location','entityData':this.data,'entityDetails':null};
    } else if (this.selectedTab === 'Identifier') {
      this.manageTabData();
    } else if (this.selectedTab === 'Alert') {
      if(this.data) {
        this.entityData = {"id":null,"entityId":this.data.id,"entityType":'Location','entityDetails':this.data,'entityGroupTypeId':'EGTI-LOC'};
      }
    } else if (this.selectedTab === 'Documents'){
      this.manageTabData();
    } else if(this.selectedTab ==='Ticket'){
      if(this.data){
        this.entityData = {"id":null,"entityId":this.data.id,"entityType":'Location','entityDetails':this.data,'entityGroupTypeId':'EGTI-LOC','entityTypeId':'LOC','formTemplateType' :'FTT-LOC'};
      }
    } else if(this.selectedTab ==='Maintenance' && this.data.id){
      this.maintenanceData =  {"tabType":'Location',"entityType":'Location',"entityId":this.data.id,"entityName":this.data.Name,"titleName":'Location Routine'};
    }
  }

  manageTabData() {
    if(this.data) {
      this.entityData = {"id":null,"entityId":this.data.id,"entityType":'Location','entityDetails':this.data,'entityGroupTypeId':'EGTI-LOC'};
    }else{
      this.entityData = {"id":null,"entityId":null,"entityType":'Location','entityDetails':null,'entityGroupTypeId':'EGTI-LOC'};
    }
  }

  updateAttachFiles() {
    let updateAttachFile =[];
    if(this.data?.id != null){
      for(let i in this.attachFiles){
        if(this.attachFiles[i].hasOwnProperty('image')){
          delete this.attachFiles[i].image;
        }
        if(this.attachFiles[i].attachmentId == null){
          updateAttachFile.push(this.attachFiles[i]);
        }
      }
    } else{
        for(let i in this.attachFiles){
          if(this.attachFiles[i].hasOwnProperty('image')){
            delete this.attachFiles[i].image;
            delete this.attachFiles[i].attachmentId;
          }
        }
    }
  }

  saveLocation() {
    for(let i in this.updateIdentifier){
      this.createIdentifier.push(this.updateIdentifier[i])
    }
    this.updateAttachFiles();
    let postData = {
      "locationDescription": this.locationForm.controls['locationDescription'].value,
      "careSettingId": this.locationForm.controls['careSettingId'].value,
      "locationCategoryId": this.locationForm.controls['locationCategoryId'].value,
      "locationTypeId": this.locationForm.controls['locationTypeId'].value,
      "logicalParentId": this.data?.parentId,
      "name": this.locationForm.controls['name'].value,
      "parentId": this.data?.parentId,
      "shortName": this.locationForm.controls['shortName'].value,
      "status": this.locationForm.controls['status'].value,
      "id": this.data?.id,
      "ownerId": this.ownerId,
      "identifiers": this.createIdentifier,
      "fileAttachments": this.attachFiles
    };
    console.log(postData)
    this.hospitalService.editLocation(postData).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
      this.onDialogClose();
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  handleIdentifierEvent(event){
    if (event.updateIdentifier && event.updateIdentifier.length >0){
    this.updateIdentifier = event.updateIdentifier;
    }
    this.createIdentifier = event.saveIdentifier;
  }

  handleDocumentEvent(event){
    this.attachFiles = event.attachFiles;
  }
  fixClick() {
    console.log('')
  }  
}



