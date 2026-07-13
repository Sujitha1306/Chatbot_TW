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
import { CommonService, ConfigurationService } from '../../../services';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTask } from '../workflow-management/workflow-management.model';
import { SessionStorageService } from '../../../services/session.storage.service';
import { DomSanitizer } from '@angular/platform-browser';
import { LightboxOnlineMenuDialogComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-create-pwa-ticket',
  templateUrl: './create-pwa-ticket.component.html',
  styleUrls: ['./create-pwa-ticket.component.scss']
})
export class CreatePwaTicketComponent {

  public taskForm: FormGroup;
  public createTask: CreateTask;
  public fileInfo: any[] = [];
  public isFileSelected: boolean = false;
  toDay: any = new Date();
  public currentDate = this.dateFormat.transform(this.toDay, 'yyyy-MM-ddTHH:mm');
  public base64Data_global: string;
  image: any;
  categoryList : any;
  taskDataList: any;
  taskInchargeList : any;
  assignTypeList: any;
  assetList: any;
  assignType : any;
  assignId : any;
  locationList: any;
  inchargeIds = null;
  taskInchargeEnabled : boolean = false;
  assetNameEnabled : boolean = false;
  locationEnabled : boolean = false;
  canAutoAllocate: boolean = false;
  autoComplete: boolean = false;
  performerInfo: any;
  nonPerformerInfo:  any;
  fileType: string;
  attachFiles: any[] = [];
  imageData: any[] = [];
  orginalAssignTypeList: any;
  ticketDataList = [{code : 'PR-AT', value : 'Asset'}, {code : 'PR-LC', value : 'Location'}]
  toHit: boolean = false;
  roleIds : any;
  departmentIds : any;
  updateAssetIds = null;
  isloading : boolean = false;
  
  constructor(public form: FormBuilder, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService, public toastr: AppToastService,
              private readonly dateFormat: DatePipe, public router: Router,  public dialog: MatDialog, public thisDialogRef: MatDialogRef<CreatePwaTicketComponent>,
              private readonly sessionService:SessionStorageService, protected sanitizer: DomSanitizer, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.getCategoryList();
    this.bulidForm();
  }

  getCategoryList() {
    if (this.data.assetData != null) {
      this.updateAssetIds = this.data.assetData.id;
      this.onTicketChange(this.data.assetId);
    } else {
      this.onTicketChange('PR-AT');
    }
    this.commonService.getAppTerms('RecipientType').subscribe(res => {
      this.orginalAssignTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code == 'RT-US' || resFilter.code == 'RT-RO' || resFilter.code == 'RT-DT'));
    })
  }

  private updateAssignTypeList(selectedRoles: any[], selectedDepartments: any[]) {
    let filteredList: any[] = [];
    if (selectedRoles?.length) {
      filteredList.push(...this.orginalAssignTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
    }
    if (selectedDepartments?.length) {
      filteredList.push(...this.orginalAssignTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
    }
    this.assignTypeList = [...new Set(filteredList)];
  }


  getTaskList(type, data){
    let assignId : any;
    let inchargeName : any;
    this.configurationService.getTaskActivities(type, data).subscribe(res => {
      this.taskDataList = res.results;
      const taskDetails = this.taskDataList[0]?.id;
      this.assignType = this.taskDataList[0]?.inchargeType;
      inchargeName = this.taskDataList[0]?.inchargeName;
      this.assignId = this.taskDataList[0]?.inchargeId;
      this.roleIds =  this.taskDataList[0]?.roleIds;
      this.departmentIds = this.taskDataList[0]?.departmentIds
      this.taskForm.get('taskId').setValue(taskDetails);
      this.updateAssignTypeList( this.roleIds, this.departmentIds)
      this.taskForm.controls['assignType'].setValue(assignId)
      this.taskForm.controls['assignId'].setValue(inchargeName)
    })
  }

  searchTaskUserNamelist(event) {
    this.toHit = event.toHit;
    let type = this.taskForm.controls['assignType'].value;
    if (type === 'RT-US') {
      if ((event.type === 'taskIncharge') && event.text.length >= 2 && this.toHit == true) {
        let text = event.text;
        let departmentsString = this.departmentIds;
        let roles = this.roleIds.length ? this.roleIds.join(',') : null;
        let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
        this.configurationService.getRoleUser(text, roles, departments).subscribe(res => {
          this.taskInchargeList = res.results;
          this.taskInchargeEnabled = true;
          this.taskForm.get('assignId')?.updateValueAndValidity({ onlySelf: true });
        });
      } 
    } else {
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
          this.taskInchargeEnabled = true;
        });
      } else if(type === 'RT-DT'){
        this.commonService.getAllDepartments().subscribe(res => {
          this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
          if (this.taskInchargeList.length) {
            let name = this.taskInchargeList[0].name
            this.taskForm.get('assignId').setValue(name)
          }
          this.taskForm.get('assignId').updateValueAndValidity();
        });
      }
    }
  }

  getTaskAssignList(id) {
    if (id) {
      const taskIncharge = this as any as { id: string, name: string }[]
      const taskInchargeId = taskIncharge.find(obj => obj.id === id || obj.name === id).name;
      return taskInchargeId;
    } else {
      return '';
    }
  }

  getFilePerview(data) {
    data['isPwa'] = true;
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: data, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  selectOnchange(event){
    this.taskForm.controls['assignType'].reset()
    this.taskForm.controls['assignId'].reset();
    const taskData = this.taskDataList.find(f => f.id == event.value);
    this.assignId = taskData.inchargeId;
    this.assignType = taskData.inchargeType;
    this.updateAssignTypeList(taskData.roleIds, taskData.departmentIds);
  }

  getTaskIncharge(type) {
    this.taskInchargeList = []
    this.taskInchargeEnabled = false;
    this.taskForm.get('assignId').setValue(null);
    this.taskForm.get('assignId').updateValueAndValidity();
    if (type === 'RT-RO') {
      this.configurationService.getRecipientName('', type).subscribe(res => {
        this.taskInchargeList = res.results.filter(role => this.roleIds.includes(role.id));
        this.taskInchargeEnabled = true;
      });
    } else if(type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        this.taskInchargeList = res.results.filter(dep => this.departmentIds.includes(dep.id));
        this.taskInchargeEnabled = true;
      });
    } else if(type === 'RT-US') {
      let departmentsString = this.departmentIds;
      let roles = this.roleIds.length ? this.roleIds.join(',') : null;
      let department = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
      this.configurationService.getRoleUser('', roles, department).subscribe(res => {
        this.taskInchargeList = res.results;
        this.taskInchargeEnabled = true;
      })
    } else {
      this.taskInchargeList = [];
      this.taskInchargeEnabled = false;
    }
  }

  bulidForm() {
    this.taskForm = this.form.group({
      ticketId : [this.data.assetId ? this.data.assetId : this.ticketDataList[0].code],
      locationName: [this.data.assetData ?  this.data.assetData.name : null, Validators.required],
      assetName: [this.data.assetData ?  this.data.assetData?.assetName : null,Validators.required],
      category : [null, Validators.required],
      taskId : [null, Validators.required],
      description : [null],
      startDate : [this.currentDate],
      assignId : [null],
      assignType : [null]
    })
  }

  onTicketChange(event){
    this.commonService.getAppTermsLink(event, 'ActivityCategory').subscribe(res => {
      this.categoryList = res.results;
    })
  }

  openQRCodeDialog() {
    this.router.navigateByUrl('web/main', { skipLocationChange: true }).then(() => {
      this.router.navigate(['web/qr-scan'], { queryParams: { key: 'TW-PWT' } });
    });
    this.dialog.closeAll();
  }

  searchAssetList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getAssetSearch(null, event.text).subscribe((res) => {
          this.assetList =  res.results;
          this.assetNameEnabled = true;
        });
      } 
    } else {
      this.assetList = [];
      this.assetNameEnabled = false;
    }
  }

  searchLocationList(event) {
    if (event.text.length >= 2) {
      if (event.toHit == true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.locationList = res.results;
          this.locationEnabled = true;
        });
      }
    } else {
      this.locationList = [];
      this.locationEnabled = false;
    }
  }

  getAssetList(id) {
    if (id !== null) {
      const asset = this as any as { assetId: string, assetName: string }[]
      const assetId = asset.find(obj => obj.assetId === id).assetName;
      return assetId;
    } else {
      return '';
    }
  }

  getLocationList(id) {
    if (id !== null) {
      const location = this as any as { id: string, name: string, fullName: string }[]
      const locationId = location.find(obj => obj.id === id).fullName;
      return locationId;
    } else {
      return '';
    }
  }

  handleFileSelect(evt) {
    const files: FileList = evt.target.files;
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
  
    for (const file of Array.from(files)) {
      if (!allowed_types.includes(file.type)) {
        this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
        continue;
      }
  
      const reader = new FileReader();
      reader.onload = (readerEvt) => {
        const result = readerEvt.target.result as string;
        const base64Data = result.split(',')[1];
  
        const mimeType = file.type;
        const base64PrefixMap: { [key: string]: string } = {
          'image': 'data:image/png;base64,',
          'application/pdf': 'data:application/pdf;base64,',
          'application/msword': 'data:application/msword;base64,',
          'text/plain': 'data:text/plain;base64,'
        };
  
        let fileUrl: any | null = null;
        if (mimeType.includes('image')) {
          fileUrl = this.safeUrl(base64PrefixMap['image'] + base64Data);
        } else if (mimeType.includes('text/plain')) {
          fileUrl = atob(base64Data);
        } else if (mimeType in base64PrefixMap) {
          fileUrl = this.safeUrl(base64PrefixMap[mimeType] + base64Data);
        }
  
        if (fileUrl) {
          const fileObj = {
            file: fileUrl,
            mimeType: mimeType
          };
  
          this.imageData.push(fileObj);
          this.image = fileObj;
          this.isFileSelected = true;
  
          // Call addDocument here for each file
          this.attachFiles.push({
            documentTypeId: null,
            fileName: file.name,
            documentTypeName: null,
            fileType: mimeType,
            base64Data: base64Data,
            attachmentId: null,
            image: fileUrl,
            createdBy: localStorage.getItem(btoa('current_user')),
            createdOn: this.dateFormat.transform(new Date(), "YYYY-MM-dd HH:mm:ss"),
            modifiedOn: null,
            modifyByName: null
          });
  
        }
      };
  
      reader.readAsDataURL(file);
    }
  }
  

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  onFileSelect(input: HTMLInputElement) {
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
    const fileInfo = `${file.name} (${formatBytes(file.size)})`;
    this.fileInfo.push(fileInfo)
  }

  removeData(event) {
    this.attachFiles = this.attachFiles.filter(f => f.fileName !== event.fileName);
    this.attachFiles = [...this.attachFiles];
  }

  saveTask() {
    let locationId = typeof this.taskForm.controls['locationName'].value === 'string' ? this.updateAssetIds : this.taskForm.controls['locationName'].value
    let assetId = typeof this.taskForm.controls['assetName'].value === 'string' ? this.updateAssetIds : this.taskForm.controls['assetName'].value;
    this.createTask = new CreateTask(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null,null,null, null, null);
    this.createTask.pfActivityId = this.taskForm.controls['taskId'].value;
    this.createTask.comments = this.taskForm.controls['description'].value ? this.taskForm.controls['description'].value : null ;
    this.createTask.startTime = this.dateFormat.transform(this.taskForm.controls['startDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.createTask.remarks = null;
    this.createTask.type = 'RQT-TASK';
    this.createTask.requestCategory = this.taskForm.controls['ticketId'].value;
    this.createTask.destinationId =  locationId !== null ? locationId : null;
    this.createTask.isAutoComplete = this.autoComplete;
    this.createTask.isautoAssigned = this.canAutoAllocate;
    this.performerInfo = [{
      id: this.assignId ? this.assignId : null,
      type: this.assignType ? this.assignType : null
    }];
    if(this.data.activityId === 'TW-PWA'){
      this.nonPerformerInfo = [{
        id:  assetId === null ? locationId : assetId,
        type: this.taskForm.controls['ticketId'].value == 'PR-LC' ? 'Location' : 'Asset',
      }];
    } else {
      this.nonPerformerInfo = [];
    }
    const  uid = localStorage.getItem(btoa('uid'));
    let srcIdentifyingId = null;
    if(uid) {
      console.log('guest')
      srcIdentifyingId = Number(uid.replace(/"/g, ''))
    } 
    this.createTask.title =  this.data.activityId !== 'TW-PWA' ? this.taskForm.controls['ticketId'].value == 'PR-LC' ?  this.taskForm.controls['locationName'].value : this.taskForm.controls['assetName'].value : null;
    this.createTask.performer = this.performerInfo;
    this.createTask.nonPerformer = this.nonPerformerInfo;
    this.createTask.attachFiles = this.attachFiles;
    this.createTask.entityForms = null;
    this.createTask.srcIdentifyingType = srcIdentifyingId ? 'mobile_users' : null,
    this.createTask.srcIdentifyingId = srcIdentifyingId ? srcIdentifyingId : null,
    this.createTask.scheduleActivityTypeId = 'SAT-ATM';
    this.isloading = true;
    this.commonService.saveTask(this.createTask).subscribe(res => {
      this.isloading = false;
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
      this.router.navigate(['web/main']);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  closeDialog() {
    this.thisDialogRef.close();
    this.router.navigate(['web/main']);
  }
    fixClick() {
    console.log('')
  }
}