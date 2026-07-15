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
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ConfigurationService, CommonService } from "../../../services";
import { AppToastService } from "../../../services/toaster.service";
import { CreateAssetComponent } from "../../../../ovitag/configuration/asset/asset.component";
import { CommonDialogComponent } from "../common-dialog-component/common-dialog.component";
import { CreateManageRoutineComponent } from "../create-manage-routine/create-manage-routine.component";
import { TaskManagmentComponent } from "../task-managment/task-managment.component";

@Component({
  selector: 'app-facility-transfer',
  templateUrl: './facility-transfer.component.html',
  styleUrls: ['./facility-transfer.component.scss']
})
export class FacilityTransferComponent implements OnInit {
  public transferType = [];
  public facilityList: any;
  public assetTransferTypeDetails: any;
  public assetTransferTypes: any;
  public transferForm: FormGroup;
  public departmentList = [];
  public bannerlabel = [];
  public entityOpenTask = [];
  public entityOpenForm = [];
  public entityOpenRoutine = [];
  public ownerNameList = [];
  public openItems = [];
  public entityOpenWorkOrder = [];

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<FacilityTransferComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
  ) { }

  ngOnInit() {
    this.buildForm();
    this.updateBannerLabel();
    this.getFacilityList(localStorage.getItem('regionId'));
    this.getDepartmentList();
    this.getTransferList();
    this.commonService.getAppTermsVerion2('AssetTransferType').subscribe(res => {
      this.assetTransferTypes = res.results.filter(resFilter => resFilter.code !== 'ATT-AT');
      const filterCodesForCostType = ['ATT-LN', 'ATT-RR', 'ATT-SV', 'ATT-TR', 'ATT-BRD', 'ATT-RT'];
      const filterCodesForOtherCostTypes = ['ATT-LN', 'ATT-SV', 'ATT-TR', 'ATT-BRD', 'ATT-RT'];
      if (this.data.assetTransferTypeId === 'ATT-AT' || this.data.assetTransferTypeId === null) {
        const filterCodes = this.data.costTypeId === "CT-RE" ? filterCodesForCostType : filterCodesForOtherCostTypes;
        this.assetTransferTypeDetails = this.assetTransferTypes.filter(item => filterCodes.includes(item.code));
      } else {
        this.commonService.getAppTermsLink(this.data.assetTransferTypeId, null).subscribe(res => {
          this.assetTransferTypeDetails = res.results;
        })
      }
    });
    this.transferForm.get('facilityId')?.valueChanges.subscribe(event => {
      this.transferForm.patchValue({ departmentId: null, ownerId: null });
      this.getDepartmentList();
    });
    this.transferForm.get('departmentId')?.valueChanges.subscribe(value => {
      this.transferForm.get('ownerId').setValue(null);
    });
    this.getAssetOpenItems();
  }

  public buildForm() {
    this.transferForm = this.form.group({
      assetTransferType: [this.data && this.data.assetTransferTypeId !== 'ATT-AT' ? this.data.assetTransferTypeId : 'ATT-TR', [Validators.required]],
      transferType: ['TRT-FAC', [Validators.required]],
      facilityId: [null, [Validators.required]],
      departmentId: [null, [Validators.required]],
      isPermanentTransfer: [false, [Validators.required]],
      ownerId: [null , this.validateUserSelection.bind(this)],
      isTagAssociated: [false],
      comments: [null],
    });
  }

  updateBannerLabel() {
    this.bannerlabel = [
      {
        'left': [{ label: 'Asset  Serial Number', value: this.data.assetSerialNumber },
        { label: 'Asset Name', value: this.data.assetName }]
      },
      {
        'right': [{ label: 'Asset Type', value: this.data.assetTypeName },
        { label: 'Owner Department ', value: this.data.ownerDepartment }]
      }
    ]
  }

  getFacilityList(data) {
    this.commonService.getFacilityList(data).subscribe(res => {
      this.facilityList = res.results;
      this.facilityList = this.facilityList.filter(rs => rs.id !== localStorage.getItem(btoa('facilityId')));
    });
  }


  getDepartmentList() {
    let facilityId = this.transferForm.controls.facilityId.value ?? null;
    this.configurationService.getAssetDepartment(facilityId).subscribe(res => {
      this.departmentList = res.results.map(({ id, name }) => ({ id, name }));
    });
  }

  getTransferList() {
    this.commonService.getAppTerms('TransferType').subscribe(res => {
      this.transferType = res.results;
      this.transferForm.controls.transferType.setValue('TRT-FAC');
    });
  }

  getAssetOpenItems() {
    this.commonService.getAssetOpenItems(this.data?.id).subscribe(res => {
      this.entityOpenTask = res.results?.tickets ?? [];
      this.entityOpenWorkOrder = res.results?.workOrders ?? [];
      this.entityOpenForm = res.results?.forms ?? [];
      this.entityOpenRoutine = res.results?.routines ?? [];
      this.updateOpenItems();
    });
  }

  updateOpenItems() {
    this.openItems = [
      {
        key: 'Ticket',
        label: 'Open Tasks',
        data: this.entityOpenTask,
        icon: 'task',
        color: '#3381cc'
      },
      {
        key: 'WorkOrder',
        label: 'Open WorkOrders',
        data: this.entityOpenWorkOrder,
        icon: 'fact_check',
        color:'rgb(57, 179, 158)'
      },
      {
        key: 'Form',
        label: 'Open Forms',
        data: this.entityOpenForm,
        icon: 'description',
        color: 'rgb(244, 179, 38)'
      },
      {
        key: 'Maintenance',
        label: 'Open Routines',
        data: this.entityOpenRoutine,
        icon: 'settings_suggest',
        color: 'rgb(158, 194, 228)'
      }
    ]
  }

  get isAnyOpenEntityAvailable() {
    return [this.entityOpenTask,this.entityOpenWorkOrder,this.entityOpenForm, this.entityOpenRoutine].some(arr => arr?.length > 0);
  }

  searchUserNameList(event) {
    if (event.text.length >= 2 && event.toHit === true) {
      const ownerDepartment = this.transferForm.controls.departmentId.value;
      const department = ownerDepartment ?? null;
      const param = department;
      this.configurationService.getTicketUser(event.text, 'RT-US', param).subscribe(res => {
        this.ownerNameList = res?.results ?? [];
      });
    }
  }

  displayOwner = (id) => {
    if (!id) return '';
    const found = this.ownerNameList?.find(x => x.id === id);
    return found ? found.name : '';
  }

  private validateUserSelection(control: FormControl) {
    const value = control.value;
    if (!value) return null;
    const isValid = this.ownerNameList?.some(
      user => user.id === value || user.name === value
    );

    return isValid ? null : { invalidUser: true };
  }

  onNavigate(section, type, count) {
    if (count > 1) {
      if (type) {
        this.data['selectedTab'] = type;
      }

      localStorage.setItem('user_guide_menu_code', 'MN_FAAS_MD');
      const dialogRef = this.dialog.open(CreateAssetComponent, {
        data: this.data,
        panelClass: ['large-popup'],
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(() => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'));
        localStorage.setItem('user_guide_menu_code', menu?.[0]?.code);
      });
    } else {
      const item = section?.data?.[0];
      switch (type) {
        case 'Form':
          this.openForm(item);
          break;
        case 'Maintenance':
          this.openMaintenance(item);
          break;
        default:
          this.openTicket(item);
      }
    }
  }

  openForm(data) {
    let formData = { "id": data.id, "entityId": this.data.id, "entityType": data.formTypeName?.toLowerCase(), "parentId": null, "parentType": null, "pfFormTemplateId": data.formTemplateId, "content": "form", "entityData": this.data, "entityFormStatus": data.FormStatusId };
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  openMaintenance(data) {
    let maintenanceData = { ...data, dynamicHeader: 'Modify Maintenance Routine', entityId: this.data?.id, entityName: this.data?.assetName, fromDate: data.startDate, toDate: data.endDate, scheduleStart: data.startDate }
    const dialogRef = this.dialog.open(CreateManageRoutineComponent, {
      data: maintenanceData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  openTicket(data) {
    let ticketData = { requestId: data?.id, type: 'modify' }
    const dialogRef = this.dialog.open(TaskManagmentComponent, {
      data: ticketData,
      panelClass: ['large-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }

  saveTransfer() {
    const payload = {
      // assetId: this.data?.id,
      // assetTransferType: this.transferForm.controls.assetTransferType.value,
      // transferType: this.transferForm.controls.transferType.value,
      // facilityId: this.transferForm.controls.facilityId.value,
      // departmentId: this.transferForm.controls.departmentId.value,
      // comments: this.transferForm.controls.comments.value,
      // ownerId: this.transferForm.controls.ownerId.value,
      // isTagAssociated: this.transferForm.controls.isTagAssociated.value,
      id: this.data?.id,
      assetTransferType: this.transferForm.controls.assetTransferType.value,
      transferType: this.transferForm.controls.transferType.value,
      comments: this.transferForm.controls.comments.value,
      linkedAsset: null,
      isExcludeParent: false,
      eventId : 'ATT-ACEV',
      eventStatusId : 'ATE-INI',
      sourceIdentifier : localStorage.getItem(btoa('facilityId')),
      destinationIdentifier: this.transferForm.controls.facilityId.value,
    }
    console.log(payload)
    this.commonService.assetTransfer(payload).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialogRef.close('confirm');
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  fixClick() {
    console.log('')
  }
}
