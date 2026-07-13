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

import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService, HospitalService } from '../../../services';
import { DatePipe } from '@angular/common';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';

@Component({
  selector: 'app-event-status-tracking',
  templateUrl: './event-status-tracking.component.html',
  styleUrls: ['./event-status-tracking.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EventStatusTrackingComponent implements OnInit, AfterViewInit, OnDestroy{
  public statusList = []
  public selectedTabIndex = 0;
  taskdataSource: any;
  attachmentInfo: any=[];
  ticketformBuilderSource:any =[];
  entityForms =[];
  assetData:any;
  private resizeObserver!: ResizeObserver;
  @ViewChild('scrollContainer', { static: true })
  scrollContainer!: ElementRef<HTMLDivElement>;

  showLeftArrow = false;
  showRightArrow = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, private readonly dateFormat: DatePipe, public dialog: MatDialog,
    private readonly configurationService : ConfigurationService,private readonly hospitalService:HospitalService) {
    
  }

  ngOnInit(): void {
    this.getConfigData()
    this.getAllAttachments();
    this.getEntityDetails();
    this.getFormDetails()
  }

  ngAfterViewInit() {
    // setTimeout(() => this.updateArrows(), 100);
    const el = this.scrollContainer.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(el);
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }

  onResize() {
    requestAnimationFrame(() => {
      const el = this.scrollContainer.nativeElement;

      this.showLeftArrow = el.scrollLeft > 0;
      this.showRightArrow =
        el.scrollWidth > el.clientWidth &&
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    });
  }

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({
      left: -250,
      behavior: 'smooth'
    });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({
      left: 250,
      behavior: 'smooth'
    });
  }

  onScroll() {
    this.updateArrows();
  }

  updateArrows() {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    this.showLeftArrow = el.scrollLeft > 0;
    this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  getConfigData() {
    this.commonService.getConfigFile('request-config').subscribe(res => {
      let configData = null;
      if (res.statusCode === 1) {
        configData = res?.results['contentObject']
        if (configData.hasOwnProperty('allowTaskHistoryManage') && this.data?.requestTypeId == 'RQT-TASK') {
          if (configData['allowTaskHistoryManage'].includes(this.data.activityCategoryId)) {
            this.allowedTaskEventHistory(this.data);
          } else {
            this.getTaskEventHistory(this.data);
          }
        } else {
          this.getTaskEventHistory(this.data);
        }
      }
    })
  }

  allowedTaskEventHistory(data) {
    this.commonService.getCategoryTaskList(data.activityCategoryId, data.requestId).subscribe((res) => {
      this.statusList = res.results['workOrderFlow'];
    })
  }

  getTaskEventHistory(data) {
    this.commonService.getPorterHistory(data.requestId).subscribe((res) => {
      if (res.statusCode === 1) {
        this.statusList = res.results.reverse();
      }
    });
  }

  tabChanged = (tabChangeEvent: any): void => {
    this.selectedTabIndex = tabChangeEvent;
    if(this.selectedTabIndex === 1){
      this.getTaskHistory(this.data.requestId)
    }
  }

  getTaskHistory(id){
    this.commonService.getPorterHistory(id).subscribe((res) => {
      if (res.statusCode === 1) {
        this.taskdataSource = res.results;
      }
    });
  }

  getAllAttachments() {
    let type = this.data.requestCategoryId === 'PR-AT' ? 'asset' : this.data.requestCategoryId === 'PR-LC' ? 'location' : this.data.requestCategoryId === 'PR-PA' ? 'patient' : 'general'
     this.commonService.getAllAttachments(this.data.requestId, 'Request', this.data.nonPerformerId, type).subscribe(res => {
         this.attachmentInfo = res.results.map(item => ({
           ...item,
           createdOn: item.createdOn ? this.dateFormat.transform(item.createdOn, 'dd-MM-yyyy hh:mm a') : null,
           modifiedOn: item.modifiedOn ? this.dateFormat.transform(item.modifiedOn, 'dd-MM-yyyy hh:mm a') : null
         }));
       });
      }

  getEntityDetails() {
    let id = this.data.nonPerformerId;
    let type = this.data.requestCategoryId === 'PR-AT' ? 'asset' : this.data.requestCategoryId === 'PR-LC' ? 'location' : this.data.requestCategoryId === 'PR-PA' ? 'patient' : 'general'
    const fetchDetails = type === 'asset'? this.configurationService.getAllAsset(id): type === 'location' ? this.hospitalService.getLogicalLocationById(id):null;
    fetchDetails?.subscribe(res => {
      this.assetData = res.results[0];
    });
  }

  getFormDetails(){
    let type = this.data.requestCategoryId === 'PR-AT' ? 'asset' : this.data.requestCategoryId === 'PR-LC' ? 'location' : this.data.requestCategoryId === 'PR-PA' ? 'patient' : 'general'
    this.commonService.getFormDetails(this.data.requestId,'request').subscribe(res => {
      if (res.statusCode == 1) {
        let result = res.results.filter(res => res.status);
        this.ticketformBuilderSource = result.reverse();
      }
    });
  }

  triggerAction(event){
    if(event.key === 'preview'){
      this.formBuilder(event.data)  
    }else if(event.key === 'view'){
      this.viewHistory(event.data)
    }else if (event.key === 'delete') {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass:'confirmation-popup',
          data: {
            title: 'Confirmation', message: 'Are you sure you want to delete?',
            buttonText: { ok: 'Yes', cancel: 'No' }
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result == "Yes") {
            let formTempId = event.data?.id;
            let formIndex = this.ticketformBuilderSource.findIndex(res => res.id == formTempId);
            this.ticketformBuilderSource[formIndex]['status'] = false;
            this.configurationService.updateEntiryFormTemplates(formTempId, this.ticketformBuilderSource[formIndex]).subscribe(res => {
              if (res.statusCode === 1) {
                this.getFormDetails();
              }
            })
          }
        })
    }else if (event.key === 'attachment'){
      this.getFileDownload(event.data)
    }
  }

  formBuilder(data) {
    let id = this.data.nonPerformerId;
    let type = this.data.requestCategoryId === 'PR-AT' ? 'asset' : this.data.requestCategoryId === 'PR-LC' ? 'location' : this.data.requestCategoryId === 'PR-PA' ? 'patient' : 'general'
    let formData = { "id" :data.id ,"parentId" :id, "parentType":type ,"entityId":this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.assetData,"entityFormStatus":data['entityFormStatusId']};
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result != ''){
      this.entityForms=[result];
      }
    });
  }

  viewHistory(data){
    let id = this.data.nonPerformerId;
    let type = this.data.requestCategoryId === 'PR-AT' ? 'asset' : this.data.requestCategoryId === 'PR-LC' ? 'location' : this.data.requestCategoryId === 'PR-PA' ? 'patient' : 'general'
    let formData = { "id" : data.id ,"parentId" :id, "parentType":type ,"entityId":this.data.requestId,"entityType":"request", "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.data,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      formData = null;
    });
  }

  getFileDownload(element){
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

}
