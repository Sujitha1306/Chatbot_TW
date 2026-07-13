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
import { Component, Inject, Input, OnInit, Optional, ViewChild, ViewEncapsulation } from '@angular/core'
import { routerTransition } from '../../../../../router.animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService, ConfigurationService } from '../../../../services';
import { DatePipe } from '@angular/common';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { AppToastService } from '../../../../services/toaster.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { connect, MqttClient } from 'mqtt';

@Component({
  selector: "app-form",
  templateUrl: "./form-management.component.html",
  styleUrls: ["./form-management.component.scss"],
  encapsulation: ViewEncapsulation.None,
  animations: [routerTransition()],
})
export class FormManagementComponent implements OnInit {
  public activate_btn: any;
  public today = new Date();
  public formTemplate: FormGroup;
  public formTemplateList = [];
  public formBuilderSource: any = [];
  public formData:any = null;
  public mqttData: any[] = [];
  public userManualsData: any[] = [];
  public isUploading: boolean = false;
  public clientData: MqttClient;
  @Input() entityType: any;
  @Input() entityId: any;
  @Input() formTemplateType: any;
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  constructor(
      public form: FormBuilder,
      public dialog: MatDialog,
      protected sanitizer: DomSanitizer,
      public toastr: AppToastService,
      public snackbar: MatSnackBar,
      @Optional() public thisDialogRef: MatDialogRef<any>,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      private readonly configurationServices: ConfigurationService,
      private readonly commonService: CommonService,
      private readonly _dateFormat: DatePipe,
  ) {
    this.activate_btn = this.commonService.getActivePermission('button'),
    this.today.setDate(this.today.getDate());
  }
    
  ngOnInit() {
    this.entityId = this.entityId ?? this.data?.id;
    this.getUserManuals();
    this.getFormTemplate();
    this.getFormDetails();
    this.buildForm();
    this.getMqtt();
  }

  public buildForm() {
    this.formTemplate = this.form.group({
        formTemplateId: [null],
        userURL: [null, Validators.required]
    })
  }

  triggerAction(event)  {
    if(event.key === 'preview'){
      this.formBuilder(event.data)  
    } else if(event.key === 'view'){
      this.viewHistory(event.data)
    } else if (event.key === 'delete') {
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
          let formIndex = this.formBuilderSource.findIndex(res => res.id == formTempId);
          this.formBuilderSource[formIndex]['status'] = false;
          this.configurationServices.updateEntiryFormTemplates(formTempId, this.formBuilderSource[formIndex]).subscribe(res => {
            if (res.statusCode === 1) {
              this.getFormDetails();
            }
          })
        }
      })
    }
  }

  getFormTemplate() {
    const departmentValue = localStorage.getItem(btoa('departmentId'));
    const departmentId = departmentValue !== null && departmentValue !== "null" ? Number(departmentValue) : null;    
    const identifyingType = this.formTemplateType == 'FTT-LOC' ? 'categoryId' : this.formTemplateType == 'FTT-AT' ? 'assetType' : this.formTemplateType  == 'FTT-ACT' ? 'pf_activity' : 'requestId';
    const identifyingValue = this.formTemplateType == 'FTT-LOC' ? this.data.categoryId: this.formTemplateType == 'FTT-AT' ? this.data.assetTypeId : this.formTemplateType == 'FTT-ACT' ? this.data?.id : this.data.requestId;
    if(this.formTemplateType !== 'FTT-AT') {
      this.loadAssociationBasedForms(departmentId,identifyingType,identifyingValue);
      return
    }
      let manufacturer = this.data?.manufacturer ?? null;
      let modelNo = this.data?.modelId ?? null;
      const payload: any = [];
      if (identifyingValue !== null) {
        payload.push({
          entityType: 'pf_form_template',
          qualifier: 'Asset',
          identifyingType: 'assetType',
          identifyingId: identifyingValue
        })
      }
      if (departmentId !== null) {
        payload.push({
          entityType: 'pf_form_template',
          qualifier: 'Asset',
          identifyingType: 'department',
          identifyingId: departmentId
        })
      }
      if (manufacturer != null && modelNo !== null && identifyingValue !== null) {
        payload.push({
          entityType: 'pf_form_template',
          qualifier: 'Asset',
          identifyingType: 'manufacturer_model_assetType',
          identifyingId: `${manufacturer}_${modelNo}_${identifyingValue}`
        })
      }
      if(payload?.length >0){
        this.configurationServices.getformTemplatesByEntityFilter(payload).subscribe(res => {
          if (res.statusCode == 1) {
            this.formTemplateList = res.results.map(item => ({
              id: item.entityId,
              name: item.entityName,
              hasImportant: item.id !== null  
            }));
          }
        })
      }else{
        this.loadAssociationBasedForms(departmentId, identifyingType, identifyingValue);
      }
  }

  private loadAssociationBasedForms(departmentId, identifyingType, identifyingValue) {
    if (this.formTemplateType == 'FTT-ACT') {
      this.configurationServices.getEntityAssociatedForms(null, null, null, null, identifyingType, identifyingValue).subscribe(res => {
        if (res.statusCode === 1) {
          this.formTemplateList = res.results;
        }
      })

    } else {
      this.configurationServices.getEntityAssociatedForms('FS-PU', this.formTemplateType, 'QLF-ASG', departmentId, identifyingType, identifyingValue).subscribe(res => {
        if (res.statusCode === 1) {
          this.formTemplateList = res.results;
        }
      })
    }
  }
  
  getFormTemplateInfo(){
    this.configurationServices.getFormTemplates(this.formTemplate.controls['formTemplateId'].value, this.entityId, this.entityType).subscribe(res =>{
      if(res.statusCode === 1){
        let formEntityIndex = -1;
        let formTempData = res.results[0];
        let jsonValue = JSON.parse(formTempData.jsonValue);
        let pfFormTemplateId =  formTempData['id'];          
        let formTemplateName = formTempData['name'];
        let entityFormStatusId = 'EFS-DR';
        if(jsonValue.hasOwnProperty('status') && jsonValue.status.length) {
          let statusList = this.commonService.sortByKey(jsonValue.status, 'level');
          entityFormStatusId = statusList[0]['code']
        }           
        if(jsonValue.hasOwnProperty('dataScope') && jsonValue['dataScope'] == 'type'){
          formEntityIndex = this.formBuilderSource.findIndex(res => res.pfFormTemplateId == this.formTemplate.controls['formTemplateId'].value);
        }
        if(formEntityIndex != -1){
          let entityData = this.formBuilderSource[formEntityIndex];
          this.formBuilder(entityData);
        }else{
          this.formBuilder(null);
          this.formTemplate.controls.formTemplateId.setValue(null);
          // HEREAFTER WE CAN DIRECTLY ADDED THE FORM WITHOUT PREVIEW
          // this.postFormData(pfFormTemplateId, formTemplateName, entityFormStatusId, null, null)         
        }
      }
    })
  }
  postFormData(pfFormTemplateId, formTemplateName?, entityFormStatusId?, parentId?, parentType?){
      let postData = {
        "id": null,
        "entityId": this.entityId, 
        "entityType": this.entityType?.toLowerCase() ,
        "parentId": parentId,
        "parentType": parentType,
        "pfFormTemplateId": pfFormTemplateId,
        "status": true,
        "formValue": {},
        "name": formTemplateName,
        "entityFormStatusId":entityFormStatusId,
        "comments":null
      }
      this.configurationServices.saveEntityForm(postData).subscribe(res=> {
        this.toastr.success('Success', `${res.message}`);
        this.getFormDetails();
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }

  formBuilder(data) {
    if(data !== null) {
      this.formData = { "id" : data.id , "entityId" : this.entityId , "entityType" : this.entityType?.toLowerCase(), "parentId" : null, "parentType" : null , "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.data,"entityFormStatus":data['entityFormStatusId']};
    } else {
      const pfFormTemplateId = this.formTemplate.controls['formTemplateId'].value;
      this.formData = { "id" : null , "entityId" : this.entityId , "entityType" : this.entityType?.toLowerCase(), "parentId" : null, "parentType" : null , "pfFormTemplateId" : pfFormTemplateId, "content" : "form","entityData": this.data};
    }
    if(this.formData.entityType == 'asset'){ 
      this.formData.addBanner = true;
      this.formData.bannerType  = 'new';
      this.formData.bannerData = [ 
      {'left': [{label: 'Asset  Serial Number', value: this.data.assetSerialNumber},
                {label: 'Asset Name', value: this.data.assetName}]},
      {'right': [{label: 'Asset Type', value: this.data.assetTypeName},
                 {label: 'Owner Department ', value: this.data.ownerDepartment}]}];
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.formTemplate.controls.formTemplateId.setValue(null)
      this.formData = null
      this.getFormDetails();
    });
  }

  getFormDetails() {
    if (this.formTemplateType == 'FTT-ACT') {
      this.commonService.getFormDetails(this.entityId, this.entityType?.toLowerCase()).subscribe(res => {
        if (res.statusCode == 1) {
          let result = res.results.filter(res => res.status);
          this.formBuilderSource = result.reverse();
        }
      });
    } else {
      this.commonService.getFormDetails(this.entityId, this.entityType?.toLowerCase(), this.entityId, this.entityType?.toLowerCase()).subscribe(res => {
        if (res.statusCode == 1) {
          let result = res.results.filter(res => res.status);
          this.formBuilderSource = result.reverse();
        }
      });
    }
  }

  viewHistory(data){
    this.formData = { "id" : data.id , "entityId" : this.entityId , "entityType" : this.entityType?.toLowerCase() , "parentId" : null, "parentType" : null, "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.formTemplate.value,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
    if(this.formData.entityType == 'asset'){ 
      this.formData.addBanner = true;
      this.formData.bannerType  = 'new';
      this.formData.bannerData = [ 
      {'left': [{label: 'Asset  Serial Number', value: this.data.assetSerialNumber},
                {label: 'Asset Name', value: this.data.assetName}]},
      {'right': [{label: 'Asset Type', value: this.data.assetTypeName},
                 {label: 'Owner Department ', value: this.data.ownerDepartment}]}];
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.formData = null;
      this.getFormDetails();
    });
  }

  saveUrlData() {
    this.isUploading = true;
    const createForm = {
      'assetId': this.data?.id,
      'pdfURL': this.formTemplate.get('userURL').value
    }
    this.getAlertMqttData();
    this.isUploading = true;
    this.commonService.saveFormGeneration(createForm).subscribe({
      next: (res) => {
        this.formTemplate?.get('userURL')?.reset();
        this.menuTrigger.closeMenu();
      },

      error: (err) => {
        this.isUploading = false;
        this.formTemplate?.get('userURL')?.reset();
         this.toastr.error('Error', `${err.error.message}`);
      },

      complete: () => {
        this.isUploading = false;
      }
    });
  }

   getMqtt(){
    if(this.clientData){
      this.clientData.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res=> {
      if (res.results != null && res.results.length) {
        let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
        let cloudConnect = {
            protocol        : brokerInfo[0]['wprotocol'],
            host            : brokerInfo[0]['host'],
            password        : brokerInfo[0]['password'],
            username        : brokerInfo[0]['username'],
            port            : brokerInfo[0]['wport'],
            connectTimeout  : 30000,
            keepalive       : 60
        }
          this.clientData = connect(cloudConnect);
      } else {
          res.message = 'mqtt ' + res.message;
          if (window.location.hostname.includes("kyn") == false) {
            this.toastr.warning('Warning', `${res.message}`);
          }
      }
  })
  }

  getAlertMqttData() {
    if (this.clientData) {
     const facilityId = localStorage.getItem(btoa('facilityId'));
      this.clientData.subscribe(`tw/cache/${facilityId}/${this.data?.id}`);
      this.clientData.on('message', (topic, message) => {
        const alert_data = this.parseAlertMessage(message);
         if (alert_data.ctx === 'n8n-form') {
          this.mqttData = alert_data?.data[0];
         }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.clientData !== undefined) {
      this.clientData.end(true);
    }
  }

  private parseAlertMessage(message: Buffer): any {
    try {
      let msg = message.toString();
      msg = msg.replace(/,\s*}/g, '}');
      msg = msg.replace(/,\s*]/g, ']');
      return JSON.parse(msg);

    } catch (error) {
      console.error('Invalid JSON =>', error);
      return null;
    }
  }

    get sortedFormTemplateList() {
    return [...this.formTemplateList].sort((a, b) => {
      return Number(b.hasImportant) - Number(a.hasImportant);
    });
  }

  getUserManuals() {
    this.commonService.getAllAttachments(this.entityId, 'Asset').subscribe(res => {
      if (res.statusCode === 1) {
        this.userManualsData = res.results.filter(item => item.documentTypeId === 'DT-UM');
      }
    });
  }

}