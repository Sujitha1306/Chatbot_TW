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

import { Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CommonService, ConfigurationService, DashboardService } from "../../../services";
import { ConfirmDialogComponent } from "../layout-save/layout-save.component";
import { AppToastService } from "../../../services/toaster.service";
import { ManageWidgetComponent } from "../../../../ovitag/configuration/widget/manage-widget/manage-widget.component";
import { CreateResourceComponent } from "../../../../ovitag/configuration/resource/resource.component";
import { forkJoin } from "rxjs";

@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss'],
    encapsulation: ViewEncapsulation.None
  })

export class CommonLayoutComponent implements OnInit {

  public layoutForm: FormGroup;
  public enableSave = false;
  public userWidgets = []
  public widgetList = []
  public userLayouts = []
  public activeWidget = []
  public activate_btn: any = [];
  public resTypList: any = [];
  public resNameList: any = [];
  public resourceList: any = [];
  public facList: any = [{id : true, name : 'Active'},{id : false, name : 'Inactive'}];
  public updatedLayout = null
  public preLayout = null;
  public lastName = '';
  public spinLoader: boolean = true;
  public FactoryLayDisable: boolean = false;
  public isLoading: boolean = false;
  public filterKey = new FormControl;
  public showInput = false;
  public disableResourceMap = false;
  public lastFact : any;
  public lastResType: any;
  public lastLinkResCode: any;
  @Input() dashId: any;
  @Input() type: any;
  @Output() updateSaveAction = new EventEmitter<any>();
  @Output() eventAction = new EventEmitter<any>();
  public userId = localStorage.getItem(btoa('userId'));
  public roleId = localStorage.getItem('userlevel');
  public dashboardData = {}
  public widgetData = {
    'left': [],
    'right': []
  }
  public searchValue = null;
  @ViewChildren("leftCheckboxes") leftCheckboxes: QueryList<ElementRef>;
  @ViewChildren("rightCheckboxes") rightCheckboxes: QueryList<ElementRef>;
  layOutTargetList = [{ code: 'web', value: 'Web' }, { code: 'mobile', value: 'Mobile' }];
  factoryList: any;
  activityCategoryList: any;

  constructor(public thisDialogRef: MatDialogRef<any>, public form: FormBuilder,private readonly configurationService: ConfigurationService,public toastr: AppToastService,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public dashboardService: DashboardService, public dialog: MatDialog) {
    this.getAllResource();
    this.activate_btn = this.commonService.getActivePermission('button');
    if (this.activate_btn.indexOf('BT_DBFAC') === -1) {
      this.FactoryLayDisable = true;
    }
    this.getUserWidgets();
  }

  ngOnInit() {
    if(this.type === 'update'){
      this.disableResourceMap = true;
    }
    this.commonService.getAppTermsVerion2('ResourceType,FactoryType,ActivityCategory').subscribe(res => {
      this.resTypList = res.results.filter(res => resFilter => resFilter.groupName === 'ResourceType');
      this.factoryList = res.results.filter(resFilter => resFilter.groupName === 'FactoryType');
      this.activityCategoryList = res.results.filter(resFilter => resFilter.groupName === 'ActivityCategory');
      this.activityCategoryList.forEach(item => { item.name = item.value; });
    });
  }
  getAllResource() {
    this.configurationService.getAllResource().subscribe(res => {
      this.resourceList = res.results;
      if (this.dashId) {
        // modify popup
        this.getDashboardbyId(this.dashId);
      } else {
        //create popup
        this.buildForm();
      }
    });
  }
  public buildForm() {
    if(this.preLayout) {
      let isActivityCategory = this.activityCategoryList.some(item => item.code === this.preLayout.resourceTypeId)
      this.preLayout.resourceTypeId = isActivityCategory ? 'RST-ACTCAT' : this.preLayout.resourceTypeId;
    }
    this.layoutForm = this.form.group({
      layoutName: [this.preLayout && this.dashId? this.preLayout.dashboardName : null, [Validators.required]],
      code: [this.preLayout && this.dashId? this.preLayout.code : null],
      resourceType: [this.preLayout && this.dashId? this.preLayout.resourceTypeId : 'RST-MN'],
      resourceCode: [{value:this.preLayout && this.dashId? this.preLayout.linkedResourceCode : null,disabled: this.disableResourceMap}],
      isFactory: [{value:this.preLayout && this.dashId?  this.preLayout.isFactory: true,disabled: this.FactoryLayDisable}],
      factoryTypeId : [this.preLayout ? this.preLayout.factoryTypeId : null],
      target : [this.preLayout ? this.preLayout.target : null],

    });
    this.showInput = true;
    if(this.dashId){
      this.currentWidget(this.preLayout);
    } else{
      this.getResourceFilter(this.layoutForm.controls['resourceType'].value);
    }
    this.formChanges();
  }
  getDashboardbyId(dashId) {
    const userId = localStorage.getItem(btoa('userId'));
    this.dashboardService.getDashboardbyIds(dashId, userId).subscribe(res => {
      if (res.statusCode === 1) {
        this.preLayout = res.results[0];
        if(this.preLayout.resourceTypeId == 'RST-MN'){
          this.resNameList = this.resourceList.filter(res => res.resourceTypeId == this.preLayout.resourceTypeId && res.link !== null && (res.link.includes("/dm/") || res.code == 'MN_DB'));
        } else{
          this.resNameList = this.resourceList.filter(res => res.resourceTypeId == this.preLayout.resourceTypeId);
        }
        this.buildForm();
      }
    });
  }
  getResourceFilter(type){
    if(type == "RST-ACTCAT") {
      this.resNameList = this.activityCategoryList;
    } else {
      if(type == 'RST-MN'){
        this.resNameList = this.resourceList.filter(res => res.resourceTypeId == type && res.link !== null && (res.link.includes("/dm/") || res.code == 'MN_DB'));
      } else{
        this.resNameList = this.resourceList.filter(res => res.resourceTypeId == type);
      }
      if(this.resNameList.length>0){
        if(this.lastResType==type){
          this.layoutForm.controls['resourceCode'].setValue(this.lastLinkResCode);
        } else{
          let code = this.resNameList[0]['code'];
          this.layoutForm.controls['resourceCode'].setValue(code);
        }
        if(this.layoutForm.controls['resourceCode'].value !== 'MN_DB'){
          this.FactoryLayDisable = true;
          this.layoutForm.controls['isFactory'].setValue(true);
        }
      }
    }
  }
  updateFactoryDisable(code){
    if (code !== 'MN_DB') {
      this.FactoryLayDisable = true;
      this.layoutForm.controls['isFactory'].setValue(true);
    } else {
      this.FactoryLayDisable = false;
    }
  }
  applyFilter(key) {
    key = key != null ? key.toLowerCase() : key;
    this.searchValue = key;
    if(this.searchValue ) {
      this.widgetList = this.userWidgets.filter(function (item) {
        return (item.widgetName.toLowerCase().indexOf(key) !== -1 || item.code.toLowerCase().indexOf(key) !== -1)
      });
    } else{
      this.widgetList = this.userWidgets
    }
    if (this.widgetData['left'].length) {
      let filterList = this.widgetList.map(value => value.code)
      this.widgetData['left'].filter(val => { return filterList.indexOf(val.code) !== -1 }
      )
    }
  }
  getUserWidgets() {
    this.dashboardService.getDashboardUserWidget(this.userId).subscribe(res => {
      this.userWidgets = res.results;
      if(!this.dashId){
        this.userWidgets.forEach(item => item['isActive'] = false);
        this.updatedLayout = {layouts:[]};
        this.preLayout = {layouts:[]};
      }
      this.widgetList = JSON.parse(JSON.stringify(this.userWidgets));
      this.spinLoader = false;
    })
  }
  currentWidget(data) {
    this.lastName = data.dashboardName != null ? data.dashboardName : null;
    this.lastFact = data.isFactory != null ? data.isFactory : null;
    this.lastLinkResCode = data.linkedResourceCode != null ? data.linkedResourceCode : null;
    this.lastResType = data.resourceTypeId != null ? data.resourceTypeId :null;
    if (data.userId == null && !this.layoutForm.controls['isFactory'].value) {
      data.dashboardId = null;
      data.userId = parseInt(this.userId);
    }
    this.activeWidget = data.layouts.filter(val => val.isActive);
    this.eventAction.emit({key : 'widgetNames' , data : this.activeWidget})
    let activeList = this.activeWidget.map(value => value.code);
    if (this.activeWidget.length) {
      this.userWidgets.forEach(item =>
        item['isActive'] = (activeList.indexOf(item['code']) > -1))
    } else {
      this.userWidgets.forEach(item => item['isActive'] = false)
    }
    this.widgetList = JSON.parse(JSON.stringify(this.userWidgets));
    this.filterKey.setValue(null)
    this.updatedLayout = JSON.parse(JSON.stringify(data));
    this.enableSave = !(JSON.stringify(this.updatedLayout) === JSON.stringify(this.preLayout));
  }
  formChanges(): void {
    this.layoutForm.valueChanges.subscribe(val => {
      if(this.lastName != val.layoutName || this.lastFact != val.isFactory || this.lastLinkResCode != val.resourceCode || this.lastResType != val.resourceType){
        this.enableSave = true;
      } else{
        this.enableSave = false;
      }
    });
  }
  selectWidget(isSelected, widget, type) {
    if (isSelected) {
      this.widgetData[type].push(widget)
    } else {
      let index = this.widgetData[type].findIndex(val => val.code == widget.code)
      this.widgetData[type].splice(index, 1)
    }
  }
  moveWidget(wid, isActive) {
    let layIndex = this.updatedLayout.layouts.findIndex(x => x.code === wid.code);
    let widIndex = this.userWidgets.findIndex(x => x.code === wid.code);
    if(widIndex != -1) {
      this.userWidgets[widIndex]['isActive'] = isActive;
    }
    if (layIndex > -1) {
      this.updatedLayout.layouts[layIndex]['isActive'] = isActive;
      let preIndex = this.preLayout['layouts'].findIndex(val => val.code == wid.code)
      if (preIndex > -1 && this.preLayout['layouts'][preIndex]['isActive'] == false) {
        this.updatedLayout.layouts[layIndex]['rows'] = 3;
        this.updatedLayout.layouts[layIndex]['cols'] = 4;
        this.updatedLayout.layouts[layIndex]['x'] = null;
        this.updatedLayout.layouts[layIndex]['y'] = null;
      }
    } else {
      wid.isActive = isActive;
      wid.rows = 3;
      wid.cols = 4;
      wid.x = null;
      wid.y = null;
      this.updatedLayout.layouts.push(wid);
    }
    this.activeWidget = this.updatedLayout.layouts.filter(val => val.isActive);
    this.currentWidget(this.updatedLayout)
    let type = isActive ? 'left' : 'right';
    let index = this.widgetData[type].findIndex(val => val.code == wid.code)
    this.widgetData[type].splice(index, 1)
    this.enableSave = !(JSON.stringify(this.updatedLayout) === JSON.stringify(this.preLayout))
    this.filterKey.setValue(this.searchValue);
    this.applyFilter(this.searchValue);
  }
  moveWidgets(type, isActive) {
    this.widgetData[type].forEach(element => {
      let index = this.updatedLayout.layouts.findIndex(val => val.code == element.code)
      if (index > -1) {
        this.updatedLayout.layouts[index]['isActive'] = isActive;
        let preIndex = this.preLayout['layouts'].findIndex(val => val.code == element.code)
        if (preIndex > -1 && this.preLayout['layouts'][preIndex]['isActive'] == false) {
          this.updatedLayout.layouts[index]['rows'] = 3;
          this.updatedLayout.layouts[index]['cols'] = 4;
          this.updatedLayout.layouts[index]['x'] = null;
          this.updatedLayout.layouts[index]['y'] = null;
        }

      } else {
        element.isActive = isActive;
        element.rows = 3;
        element.cols = 4;
        element.x = null;
        element.y = null;
        this.updatedLayout.layouts.push(element)
      }
    });
    this.currentWidget(this.updatedLayout);
    this.widgetData[type] = [];
    this.filterKey.setValue(this.searchValue);
    this.applyFilter(this.searchValue);
  }

  saveWidgets() {
    let linkedResourceCode = this.layoutForm.controls.resourceCode.value;
    if(linkedResourceCode && linkedResourceCode !== 'MN_DB' && this.type === 'create'){
      //check the menu is already mapped with other layouts at the time of creating new layout
      this.dashboardService.getCurrentDashboard(this.userId, this.roleId, linkedResourceCode).subscribe(res => {
        if (res.statusCode === 1) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass:['confirmation-popup'],disableClose: true, 
            data: {
              title: 'Confirmation',
              message: "Do you want to update the mapping of the layout with this menu?",
              buttonText: {
                ok: 'Yes',
                cancel: 'No'
              },'isRemark': 1, dashboardLayout: true
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result == 'Yes'){
              this.continueSaveDashboard(linkedResourceCode);
            }
          });
        } else{
          // consider layout mapping with new menu
          this.continueSaveDashboard(linkedResourceCode);
        }
      });
    } else{
      // update layout and if the menu mapped with dashboard
      this.continueSaveDashboard(linkedResourceCode);
    }
  }
  continueSaveDashboard(linkedResourceCode){
    if(linkedResourceCode){
      this.updatedLayout.facilityId = localStorage.getItem(btoa('facilityId'));
      this.updatedLayout.dashboardName = this.layoutForm.controls['layoutName'].value;
      this.updatedLayout.factoryTypeId = this.layoutForm.controls['factoryTypeId'].value;
      this.updatedLayout.target = this.layoutForm.controls['target'].value;
      if(linkedResourceCode === 'MN_DB'){
        this.updatedLayout.isFactory = this.layoutForm.controls['isFactory'].value;
      } else{
        this.updatedLayout.isFactory = true;
      }
      
      this.updatedLayout.linkedResourceCode = linkedResourceCode;
      this.updatedLayout.resourceTypeId = this.layoutForm.controls['resourceType'].value;
      this.updatedLayout.code = this.layoutForm.controls['code'].value;

      if(this.dashId){
        this.updatedLayout.linkedResourceName = null;
        let id = this.dashId;
        if (this.preLayout['dashboardName'] === this.updatedLayout.dashboardName &&
        this.preLayout['isFactory'] === this.updatedLayout.isFactory === true) {
          this.updatedLayout.dashboardId = id;
        }
        if (this.updatedLayout.isFactory) {
          this.updatedLayout.userId = null;
          this.updatedLayout.facilityId = null;
        } else {
          this.updatedLayout.userId = this.userId;
        }
        if (this.preLayout['isFactory']) {
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass:['confirmation-popup'],disableClose: true, 
            data: {
              title: 'Confirmation',
              message: 'Do you want to update the Layout?',
              buttonText: {
                new: 'Create new',
                ok: 'Yes',
                cancel: 'Cancel'
              },'isRemark': 1, dashboardLayout: true
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result == 'Create new') {
              this.updatedLayout.dashboardId = null;
              this.updatedLayout.code = null;
              if(this.updatedLayout.dashboardName) {
                if(this.updatedLayout.isFactory) {
                  this.updatedLayout.dashboardName = this.updatedLayout.dashboardName + "(F)"  
                } else {
                  this.updatedLayout.dashboardName = this.updatedLayout.dashboardName + "(1)"
                }
              }
              this.saveCurrentDashboard(this.updatedLayout);
            } else if(result == 'Yes'){
              this.saveCurrentDashboard(this.updatedLayout);
            }
          });
        } else{
          if (this.updatedLayout.isFactory) {
            this.updatedLayout.dashboardId = null;
            this.updatedLayout.facilityId = null;
          }
          this.saveCurrentDashboard(this.updatedLayout);
        }
      } else{
        this.updatedLayout.dashboardId = null;
        if(this.layoutForm.controls['isFactory'].value){
          this.updatedLayout.userId = null;
          this.updatedLayout.facilityId = null;
        }
        this.saveCurrentDashboard(this.updatedLayout);
      }
    }
  }
  saveCurrentDashboard(jsonData) {
    this.dashboardService.saveCurrentDashboard(jsonData).subscribe(res => {
      if (res.statusCode == 1) {
        this.enableSave = false;
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close();
        this.updateUserPreference(res.results);
        this.updateSaveAction.emit(res.results);
      }
    });
  }
  updateUserPreference(data) {
    let resourceCode = data['linkedResourceCode'];
    let dashboardId = data['dashboardId'];
    const preference = this.commonService.userPreference;
    let key = 'layout';
    if(resourceCode){
      key = 'layout_'+resourceCode;
    }
    const postData = {
      'key': key,
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value': dashboardId
    };
    if (preference != null && dashboardId) {
      if (preference.hasOwnProperty(key)) {
        if (preference[key].value !== dashboardId) {
          const id = preference[key].id;
          this.commonService.updateUserPreference(id, postData).subscribe(res => {
            this.commonService.userPreference = res.results;
          });
        }
      } else {
        this.commonService.saveUserPreference(postData).subscribe(res => {
          this.commonService.userPreference = res.results;
        });
      }
    }
  }
  deleteWidgets() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        this.dashboardService.deleteDashboardLayoutById(this.dashId).subscribe(res => {
          if (res.statusCode == 1) {
            this.preLayout = null;
            this.thisDialogRef.close();
          }
        })
      }
    });
  }
  fixClick() {
    console.log('')
  }

  editWidget(data) {
    this.dashboardService.getWidgetList(null).subscribe(res => {
      const rowData = res.results.find(widget => widget.code === data.code);
      const dialogRef = this.dialog.open(ManageWidgetComponent, {
        data: rowData,
        panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => { });
    });
  }

  addResource() {
    this.isLoading = true;
    forkJoin({
      permissions: this.configurationService.getAllPermission(),
      resourcesType: this.commonService.getAppTermsVerion2('ResourceType'),
      roleList: this.commonService.getAllRole(),
      userList: this.configurationService.getLoginUsers()
    }).subscribe({
      next: ({ permissions, resourcesType, roleList, userList }) => {

        const permissionData = permissions.results;
        const resourceTypeData = resourcesType.results;
        const rolesData = roleList.results;
        const usersData = userList.results;
        const data = {
          'type': 'resource',
          'selectedData': null,
          'list': {
            'permission': permissionData,
            'resource': this.resourceList,
            'role': rolesData,
            'type': resourceTypeData,
            'user': usersData
          }
        };
        this.isLoading = false;
        const dialogRef = this.dialog.open(CreateResourceComponent, {
          data: data,
          panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(_result => {
          this.isLoading = true;
          this.resNameList = [];
          this.configurationService.getAllResource().subscribe(res => {
            this.isLoading = false;
            this.resourceList = res.results;
            this.resNameList = this.resourceList;
          });
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}
