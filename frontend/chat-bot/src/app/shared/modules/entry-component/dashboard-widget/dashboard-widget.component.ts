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

import { Component, Inject, Output, EventEmitter, ViewChildren, QueryList, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialog } from './../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { DashboardService } from '../../../services';
import {CommonService} from '../../../services/common.service';
import { FormControl, } from '@angular/forms';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { AppToastService } from '../../../services/toaster.service';
@Component({
  selector: 'app-dashboard-widget-component',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: [ './dashboard-widget.component.scss' ],
  encapsulation: ViewEncapsulation.None
})
export class DashboardWidgetComponent  {
  public enableSave = false;
  public userWidgets = []
  public widgetList = []
  public userLayouts = []
  public activeWidget = []
  public activate_btn: any = [];
  public updatedLayout = null
  public deletedLayout = [];
  public preLayout = null;
  public lastName = '';
  public nameChange = false;
  public spinLoader: boolean = true;
  public selectedLayout = new FormControl;
  public isFactoryLay = new FormControl(false);
  public isFactoryChange:boolean = false;
  public layoutName = new FormControl;
  public filterKey = new FormControl;
  public userId = localStorage.getItem(btoa('userId'));
  public dashboardData = {}
  public widgetData = {
    'left' : [],
    'right' : []
  }
  public searchValue = null;
  @Output() widgetShow = new EventEmitter<any>();
  @ViewChildren("leftCheckboxes") leftCheckboxes: QueryList<ElementRef>;
  @ViewChildren("rightCheckboxes") rightCheckboxes: QueryList<ElementRef>;

  constructor(public thisDialogRef: MatDialogRef<DashboardWidgetComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public dashboardService : DashboardService,public dialog: MatDialog,
    public toastr: AppToastService) {
      this.preLayout = this.data;
      this.data = this.data.layouts;
      this.activate_btn = this.commonService.getActivePermission('button');
      this.isFactoryLay.setValue(this.preLayout.isFactory)
      this.selectedLayout.setValue(this.preLayout.dashboardId);
      this.getUserWidgets();
      this.getUserLayouts();
  }

  applyFilter(key) {
    key = key != null ? key.toLowerCase() : key;
    this.searchValue = key;
	  if(this.searchValue ) {
      this.widgetList = this.userWidgets.filter(function(item){ 
        return (item.widgetName.toLowerCase().indexOf(key) !== -1 || item.code.toLowerCase().indexOf(key) !== -1) 
      });
    } else {
      this.widgetList = this.userWidgets
    }
    if(this.widgetData['left'].length) {
      let filterList = this.widgetList.map(value => value.code)
      this.widgetData['left'].filter(val => 
        {return filterList.indexOf(val.code) !== -1}
      )}
  }
  getUserWidgets() {
    this.dashboardService.getDashboardUserWidget(this.userId).subscribe(res => {
      this.userWidgets = res.results;
      this.userWidgets = this.commonService.sortByKey(this.userWidgets, 'widgetName')
      this.widgetList = JSON.parse(JSON.stringify(res.results))
    })
  }
  getUserLayouts() {
    this.dashboardService.getDashboardDetailsList(this.userId).subscribe(res => {
      if(res.statusCode == 1 && res.results.length) {
      let menuCode = localStorage.getItem(btoa('menuCode'));
      if(menuCode != 'MN_DB') {
        this.userLayouts = res.results.filter(val => val.linkedResourceCode == menuCode);
      } else{
        this.userLayouts = res.results.filter(val => val.linkedResourceCode == "MN_DB" || val.linkedResourceCode == null );
      }
      this.userLayouts = this.commonService.sortByKey(this.userLayouts, 'dashboardName') 
      let dashIds = this.userLayouts.map(value => value.id).toString()
      this.dashboardService.getDashboardbyIds(dashIds, this.userId).subscribe(res => {
        res.results.forEach(item => {
          this.dashboardData[item.dashboardId] = item;
        });
        if(this.preLayout) { this.changeLayout() }
      });
      if(this.preLayout == null){
        this.selectedLayout.setValue(this.userLayouts[0].id)
        this.changeLayout()
      }
      }
    })
  }
  changeLayout() {
    let id = this.selectedLayout.value;
    if (this.dashboardData.hasOwnProperty(id) && this.dashboardData[id].hasOwnProperty('dashboardName')) {
      this.layoutName.setValue(this.dashboardData[id].dashboardName)
      this.isFactoryLay.setValue(this.dashboardData[id].isFactory)
      this.currentWidget(this.dashboardData[id]);
    } else {
      let layoutIds = Object.keys(this.dashboardData);
      if(layoutIds.length) {
        this.selectedLayout.setValue(this.dashboardData[layoutIds[0]].dashboardId);
        this.layoutName.setValue(this.dashboardData[layoutIds[0]].dashboardName);
        this.isFactoryLay.setValue(this.dashboardData[layoutIds[0]].isFactory);
        this.currentWidget(this.dashboardData[layoutIds[0]]);
      }
    }

  }
  currentWidget(data) {
    this.lastName = data.dashboardName != null ? data.dashboardName : null;
    let layName = this.layoutName.value ? this.layoutName.value : data.dashboardName != null ? data.dashboardName : null;
    this.layoutName.setValue(layName)
    if(data.userId == null && !this.isFactoryLay.value) {
      data.dashboardId = null;
      data.userId = parseInt(this.userId);
    }
    this.activeWidget = data.layouts.filter(val => val.isActive);
    let activeList = this.activeWidget.map(value => value.code);
    if(this.activeWidget.length) {
      this.userWidgets.forEach(item => 
        item['isActive'] = (activeList.indexOf(item['code']) > -1) ? true : false)
    } else {
      this.userWidgets.forEach(item => item['isActive'] = false)          
    }
    this.widgetList = JSON.parse(JSON.stringify(this.userWidgets));
    this.filterKey.setValue(null)
    this.updatedLayout = JSON.parse(JSON.stringify(data));
    this.enableSave = !(JSON.stringify(this.updatedLayout) === JSON.stringify(this.preLayout));
    this.spinLoader = false;
  }
  layNameChange(event){
    if(event == this.lastName){
      this.nameChange = false;
      if(this.dashboardData[this.selectedLayout.value].isFactory){
        this.isFactoryLay.setValue(true);
      }
    } else{
      this.nameChange = true;
    }
  }
  changeFactory(event){
    if(event.checked != this.dashboardData[this.selectedLayout.value].isFactory){
      this.isFactoryChange = true;
    }else{
      this.isFactoryChange = false;
    }
  }
  selectWidget(isSelected, widget, type) {
    if(isSelected) {
      this.widgetData[type].push(widget)
    } else {
      let index = this.widgetData[type].findIndex(val => val.code == widget.code)
      this.widgetData[type].splice(index,1)
    }
  }
  moveWidget(wid, isActive) {
    if(this.isFactoryLay.value) {
      this.isFactoryLay.setValue(false)
    }
    let layIndex = this.updatedLayout.layouts.findIndex(x => x.code === wid.code);
    let widIndex = this.userWidgets.findIndex(x => x.code === wid.code);
    if(widIndex != -1) {
      this.userWidgets[widIndex]['isActive'] = isActive;
    }
    if(layIndex > -1) {
      this.updatedLayout.layouts[layIndex]['isActive'] = isActive; 
      let preIndex = this.dashboardData[this.selectedLayout.value]['layouts'].findIndex(val => val.code == wid.code)
      if (preIndex > -1 && this.dashboardData[this.selectedLayout.value]['layouts'][preIndex]['isActive'] == false) {
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
    this.widgetData[type].splice(index,1)
    this.enableSave = !(JSON.stringify(this.updatedLayout) === JSON.stringify(this.preLayout))
    this.filterKey.setValue(this.searchValue);
	  this.applyFilter(this.searchValue);
  }
  moveWidgets(type, isActive) {
    if(this.isFactoryLay.value) {
      this.isFactoryLay.setValue(false)
    }
    this.widgetData[type].forEach(element => {
      let index = this.updatedLayout.layouts.findIndex(val => val.code == element.code)
      if(index > -1) {
        this.updatedLayout.layouts[index]['isActive'] = isActive;
        let preIndex = this.dashboardData[this.selectedLayout.value]['layouts'].findIndex(val => val.code == element.code)
        if (preIndex > -1 && this.dashboardData[this.selectedLayout.value]['layouts'][preIndex]['isActive'] == false) {
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
  
  saveWidgets(){
    this.updatedLayout.facilityId = localStorage.getItem(btoa('facilityId'));
    this.updatedLayout.dashboardName = this.layoutName.value;
    this.updatedLayout.isFactory = this.isFactoryLay.value;
    
    let id =  this.selectedLayout.value;
    if(!this.updatedLayout.isFactory && this.dashboardData[id]['isFactory']) {
      this.updatedLayout.dashboardId = null
    }
    if (this.dashboardData[id]['code'] === this.updatedLayout.code &&
      this.dashboardData[id]['dashboardName'] === this.updatedLayout.dashboardName &&
      this.dashboardData[id]['isFactory'] === this.updatedLayout.isFactory === true) {
        this.updatedLayout.dashboardId = id;
    }
    if(!this.updatedLayout.isFactory && !this.dashboardData[id]['isFactory']) {
      if(this.updatedLayout.dashboardId == null) {
        let layoutName = this.userLayouts.find(val => val.dashboardName == this.updatedLayout.dashboardName)
        if(layoutName) {
          this.updatedLayout.dashboardName = this.updatedLayout.dashboardName + "(1)"
        }
      }
      this.widgetShow.emit(this.updatedLayout);
      this.thisDialogRef.close();
    } else {
      if(this.updatedLayout.dashboardId == id && JSON.stringify(this.updatedLayout['layouts']) == JSON.stringify(this.dashboardData[id]['layouts'])
        && this.updatedLayout.isFactory == this.dashboardData[id]['isFactory']) {
        this.widgetShow.emit(this.updatedLayout);
        this.thisDialogRef.close();
      } else {
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
          if(this.updatedLayout.isFactory) {
            this.updatedLayout.code = null;
          }
          let layoutName = this.userLayouts.find(val => val.dashboardName == this.updatedLayout.dashboardName)
          if(layoutName) {
            if(this.updatedLayout.isFactory) {
              this.updatedLayout.dashboardName = this.updatedLayout.dashboardName + "(F)"  
            } else {
                this.updatedLayout.dashboardName = this.updatedLayout.dashboardName + "(1)"
            }
          }
          this.widgetShow.emit(this.updatedLayout);
          this.thisDialogRef.close();
        } else if(result == 'Yes') {
          this.updatedLayout.dashboardId = id;
          this.updatedLayout.isFactory = true;
          this.widgetShow.emit(this.updatedLayout);
          this.thisDialogRef.close();
        }
      });
      }
    }
  }
  widgetClose() {
    if (this.deletedLayout.length) {
      this.widgetShow.emit(this.dashboardData[this.selectedLayout.value]);
    }
    this.dialog.closeAll();
  }
  deleteWidgets(){
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        },'isRemark': 1, dashboardLayout: true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        this.dashboardService.deleteDashboardLayoutByIds(this.selectedLayout.value).subscribe(res => {
          if(res.statusCode == 1){
            this.toastr.success('Success', `${res.message}`);
            this.deletedLayout.push(this.selectedLayout.value);
            this.preLayout = null;
            this.getUserLayouts();
            if(this.commonService.userPreference.hasOwnProperty('dashboard') && this.selectedLayout.value === parseInt(this.commonService.userPreference.dashboard.value)){
              let id = this.commonService.userPreference.dashboard.id;
              this.commonService.deleteUserPreference(id);
            }
          }
        })
      }
    });
  }
  fixClick() {
    console.log('')
  }
}
