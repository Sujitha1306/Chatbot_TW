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

import { Component, Input, OnInit, Optional} from '@angular/core'
import { FormBuilder, FormControl, FormGroup} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, HospitalService } from '../../../../services';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-user-location',
  templateUrl: './user-location.component.html',
  styleUrls: ['./user-location.component.scss']
})

export class UserLocationComponent implements OnInit {
  public userPoolLocationForm: FormGroup;
  public userPoolSource: any = [];
  public locationId : any;
  public locationListRes:any;
  public locationList:any;
  public locationEnabled = false;
  public showTable = false;
  public userPoolData: any =[];
  public departmentList: any;
  public departmentListRes:any;
  public departmentEnabled = false;
  public deparmentId : any;
  public displayedColumns : any;
  public columnData : any;
  @Input() entityData: any;
  @Input() type : any;
  constructor(
      public form: FormBuilder,
      public dialog: MatDialog,
      public toastr: AppToastService,
      private readonly hospitalServices:HospitalService,
      private readonly commonService:CommonService,
      @Optional() public DialogRef: MatDialogRef<any>,
  ) {
  }
    
  ngOnInit() {
    this.buildForm()
    if(this.entityData){
      this.getDetailsById(this.entityData);
    }
    if(this.type === 'location'){
      this.displayedColumns = ['S.No','Name','Delete'];
      this.columnData = ['no','locationName','',]
    }else if (this.type === 'user'){
      this.displayedColumns = ['S.No','Department Name','Delete'];
      this.columnData = ['no','departmentName','',]
    }
  }


  getDetailsById(id) {
    this.showTable = false;
    const apiCall = this.type === 'location'? this.commonService.getUserLocationById(id): this.commonService.getUserDepartmentLink(id);
    apiCall.subscribe(res => {
      const locations = this.type === 'location' ? res.results?.userLocations : res.results || [];
      this.userPoolSource = locations.map((item, index) => ({
        ...item,
        no: index + 1
      }));
      this.showTable = res.statusCode === 1 && locations.length > 0;
    });
  }

  public buildForm() {
    this.userPoolLocationForm = this.form.group({
        locationId: [null,[this.validateSelection.bind(this)]],
        departmentId: [null,[this.validateSelection.bind(this)]]
    })
  }

  searchLocationlist(event) {
    this.locationId = null;
    this.locationEnabled = true;
    if (event.text.length >= 2 && this.locationEnabled === true) {
      if (event.toHit === true) {
        this.hospitalServices.getHomeLocationData(event.text).subscribe(res => {
          if (res.results && this.userPoolSource?.length) {
            const existingIds = new Set(this.userPoolSource.map(item => item.locationId));
            this.locationListRes = res.results.filter(loc => !existingIds.has(loc.id));
          } else {
            this.locationListRes = res.results;
          }
          this.locationList = this.locationListRes;
        });
      } else {
        this.locationList = this.locationListRes;
      }
    } else {
      this.locationList = [];
      this.locationEnabled = false;
    }
  }

  searchDepartmentDetails(event) {
    this.departmentEnabled = true;
    if (event.type === 'department' && event.text.length >= 2) {
      if (event.toHit === true) {
        this.commonService.getAllDepartments(event.text).subscribe(res => {
          if (res.results && this.userPoolSource?.length) {
            const existingIds = new Set(this.userPoolSource.map(item => item.departmentId));
            this.departmentListRes = res.results.filter(loc => !existingIds.has(loc.id));
          } else {
            this.departmentListRes = res.results;
          }
          this.departmentList = this.departmentListRes;
        });
      } else {
        this.departmentList = this.departmentListRes;
      }
    } else {
      this.departmentList = [];
      this.departmentEnabled = false;
    }
  }
 
  getLocationList(id) {
  if (id !== null) {
    const location = this as any as { id: string, name: string, fullName: string }[]
    const locationId = this.type === 'location'? location.find(obj => obj.id === id).fullName : location.find(obj => obj.id === id).name ;
    return locationId;
  }
  }

  private validateSelection(control: FormControl): { [key: string]: any } {
   let list = this.type === 'location' ? this.locationList : this.departmentList;
    const selectedId = control.value;
    if (selectedId && (!list || !list.some(val => val.id === selectedId))) {
      return { invalidLocation: true };
    }
    return null;
  }

  postData() {
    if(this.type ==='location'){
      const locationId = this.userPoolLocationForm.controls.locationId.value;
      const selectedLocation = this.locationList.find(loc => loc.id === locationId);
      if (selectedLocation) {
        const locationData = {
          "userLocations": [
            { "id": null, "locationId": locationId },
          ]
        }
        this.hospitalServices.updateUserPool(locationData,this.entityData).subscribe(res => {
            this.toastr.success('Success', `${res.message}`);
            this.getDetailsById(this.entityData)
          },
            error => {
              this.toastr.error('Error', `${error.error.message}`);
        });
        this.userPoolLocationForm.controls.locationId.reset();
        this.locationList = [];
        this.locationListRes = [];
        this.locationEnabled = false;
      }
    }else if( this.type ==='user'){
      const departmentId= this.userPoolLocationForm.controls.departmentId.value;
      const selectedDepartment = this.departmentList.find(loc => loc.id === departmentId);
      if (selectedDepartment) {
      const departmentData = [
          { "isActive": true,
            "departmentId": departmentId,
            "entityId": this.entityData,
            "entityType":"User",
            "qualifierTypeId": "QLF-ASG"
          },
        ]
      this.commonService.saveDepartmentData(departmentData).subscribe(res => {
          this.toastr.success('Success', `${res.message}`);
          this.getDetailsById(this.entityData)
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
      });
      this.userPoolLocationForm.controls.departmentId.reset();
      this.departmentList = [];
      this.departmentListRes = [];
      this.departmentEnabled = false;
    }
    }
  }

triggerAction(event){
  if (event.key === 'delete') {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirmation-popup',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
    if (result === 'Yes') {
     if(this.type === 'location') {
      const updatedUserLocations = this.userPoolSource.map(item => ({
        id: item.id,
        locationId: item.locationId,
        ...(item.id === event.data.id ? { isDeletable: true } : null)
      }));
      let userLocations={ userLocations:updatedUserLocations}
      this.hospitalServices.updateUserPool(userLocations, this.entityData).subscribe(res => {
            this.toastr.success('Success', res.message);
            this.getDetailsById(this.entityData);
          },
          error => {
            this.toastr.error('Error', error.error.message);
          }
      );
     }else if(this.type === 'user') {
      const departmentData = [{
        id : event.data.id,
        deparmentId: event.data.departmentId,
        entityId: event.data.entityId,
        entityType: event.data.entityType,
        isActive: false 
      }];
      this.commonService.updateDepartmentData(departmentData).subscribe(res => {
            this.toastr.success('Success', res.message);
            this.getDetailsById(this.entityData);
          },
          error => {
            this.toastr.error('Error', error.error.message);
          }
      );
     }
    }
    });
  }
}

}
