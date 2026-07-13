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

import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, } from '@angular/forms';
import {  MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter} from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ConfigurationService, CommonService,  } from '../../../services';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CreateConsumer, EditConsumer } from './consumer-management.model';
import { CreateAssociateTag } from '../../../../ovitag/configuration/configuration.model';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../confirmation-dialog/confirmation-dialog.component';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-consumer-management',
  templateUrl: './consumer-management.component.html',
  styleUrls: ['./consumer-management.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ConsumerManagementComponent implements OnInit {

  public consumerForm: FormGroup;
  public matcher = new ErrorStateMatcherService();
  public createConsumer: CreateConsumer;
  public editConsumer: EditConsumer;
  public deviceForm: FormGroup;
  public today = new Date();
  public genderList: any;
  DHdisplayedColumns: string[] = ["S.No", "Tag ID", "Associated Date", "Dissociated Date", "Status"];
  DHdataSource: MatTableDataSource<any>;
  public searchList: any;
  public stateList: any;
  public cityList: any;
  public zoneList: any;
  public isTagId = false;
  public associateTag: CreateAssociateTag;
  public tagEnabled = false;
  public historyEnabled = false;
  public selectedTab: any;
  public coordinates = null;
  public IdTypeList: any;
  public userList: any;
  public userEnabled = false;
  public consumerTypeList: any;

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<ConsumerManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService,public configurationService: ConfigurationService,
    private readonly _dateFormat: DatePipe, private readonly dateAdapter: DateAdapter<Date>, public datepipe: DatePipe) {
  }

  ngOnInit() {
    if (this.data.id) {
      this.data = this.data.id;
      this.getAllTag();
      this.getCityZone(this.data.stateId, 'city');
      this.getCityZone(this.data.cityId, 'zone');
      this.getDeviceHistory();
    }
    this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList  = res.results;
    });
    this.commonService.getAppTermsVerion2('IdentityDocumentType').subscribe(res => {
      this.IdTypeList = res.results;
    });
    this.commonService.getAppTermsVerion2('ConsumerType').subscribe(res => {
      this.consumerTypeList = res.results;
    });
    this.commonService.getAppTermsLink('INDIA').subscribe(res => {
      this.stateList = res.results;
    });
    this.buildForm();
  }
  tabClick(event) {
    this.selectedTab = event.index;
}
  getAllTag() {
    this.commonService.getAllTag().subscribe(res => {
      const associateDevice = res.results.filter(resFilter => resFilter.tagTypeId === 'TT-WTMT');
      const associateData = associateDevice.filter(resFilter => resFilter.tagAssociationId === this.data.id);
      if (associateData.length !== 0) {
        this.tagEnabled = true;
        this.deviceForm.controls['tagSerialNumber'].setValue(associateData[0].serialNumber);
        this.deviceForm.controls['tagAssociationById'].setValue(associateData[0].tagAssociationByName);
        this.deviceForm.controls['tagAssociationDttm'].setValue(new Date(associateData[0].tagAssociationDttm));
      } else {
        this.tagEnabled = false;
      }
    });
  }
  getCityZone(value, type) {
    this.commonService.getAppTermsLink(value).subscribe(res => {
      if (type === 'city') {
        this.cityList = res.results;
      } else if (type === 'zone') {
        this.zoneList = res.results;
      } else {
        this.cityList = [];
        this.zoneList = [];
      }
    });
  }
  getDeviceHistory() {
    this.commonService.getDeviceHistory(this.data.id, 'TAT-CS').subscribe(res => {
      if (res.statusCode !== 0) {
        this.historyEnabled = true;
        this.DHdataSource = new MatTableDataSource<any>(res.results);
      } else {
        this.historyEnabled = false;
      }
    });
  }
  getCommissionedByList(id) {
      if (id) {
        const user = this as any as { id: string, name: string }[]
        return user.find(obj => obj.id === id).name
      } else {
        return ''
      }
  }
  getUserType(name, event) {
    this.userEnabled = true;
    if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32) {
    this.commonService.searchDoctor(name, 'UT_STAFF').pipe(
      debounceTime(3000),
      distinctUntilChanged(),
    ).subscribe(res => {
      this.userList = res.results;
    });
  } else if (event.keyCode == 38 || event.keyCode == 40) {
    const user = this.userList;
    this.userList = user;
  } else {
    this.userList = [];
  }
}
  public buildForm() {
    this.consumerForm = this.form.group({
      consumerIdentifier: [this.data.consumerIdentifier ? this.data.consumerIdentifier : null],
      tittleId: [this.data.tittleId ? this.data.tittleId : null],
      firstName: [this.data.firstName ? this.data.firstName : null],
      lastName: [this.data.lastName ? this.data.lastName : null],
      genderId: [this.data.genderId ? this.data.genderId : null],
      birthDate: [this.data.birthDate ? new Date(this.data.birthDate) : null],
      gpsLocationCoordinate: [this.data.gpsLocationCoordinate ? JSON.parse(this.data.gpsLocationCoordinate) : null],
      installationDate: [this.data.installationDate ? new Date(this.data.installationDate) : null],
      address: [this.data.addressLine1 ? this.data.addressLine1 : null],
      zoneId: [this.data.zoneId ? this.data.zoneId : null],
      districtId: [this.data.districtId ? this.data.districtId : null],
      cityId: [this.data.cityId ? this.data.cityId : null],
      stateId: [this.data.stateId ? this.data.stateId : null],
      pincodeId: [this.data.pincodeId ? this.data.pincodeId : null],
      mobile: [this.data.mobile ? this.data.mobile : null],
      alternateMobile: [this.data.alternateMobile ? this.data.alternateMobile : null],
      IdCardType: [this.data.identityTypeId ? this.data.identityTypeId : null],
      IdCard: [this.data.identityValue ? this.data.identityValue : null],
      consumerTypeId: [this.data.consumerTypeId ? this.data.consumerTypeId : null]
    });

    this.deviceForm = this.form.group({
      tagSerialNumber: [this.data.tagSerialNumber ? this.data.tagSerialNumber : null],
      tagAssociationById: [this.data.tagAssociationById ? this.data.tagAssociationById : null],
      tagAssociationDttm: [this.data.tagAssociationDttm ? this.data.tagAssociationDttm : null],
    });
  }
  searchTag(event) {
    const id = event.target.value;
    if (id !== '') {
      if (event.keyCode <= 90 && event.keyCode >= 48 || event.keyCode == 8 || event.keyCode == 32) {
        this.commonService.searchTagAssociate(id, 'TT-WTMT').subscribe(res => {
          if (res.statusCode !== 0) {
            this.isTagId = true;
            this.searchList = res.results;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const list = this.searchList;
        this.searchList = list;
      } else {
        this.searchList = [];
      }
    } else {
      this.isTagId = false;
      this.searchList = [];
    }
  }
  createAssociateTag() {
    const tagAssociationType = 'Consumer';
    const tagAssociationId = this.data.id;
    const tagAssociationTypeId = 'TAT-CS';
    this.associateTag = new CreateAssociateTag(null, null, null, null, null, null, null, null);
    this.associateTag.tagSerialNumber = this.deviceForm.controls['tagSerialNumber'].value;
    this.associateTag.tagAssociationType = tagAssociationType;
    this.associateTag.tagAssociationId = tagAssociationId;
    this.associateTag.tagAssociationTypeId = tagAssociationTypeId;
    this.associateTag.tagAssociationById = this.deviceForm.controls['tagAssociationById'].value;
    this.associateTag.tagAssociationDttm = this._dateFormat.transform(this.deviceForm.controls['tagAssociationDttm'].value, 'yyyy-MM-dd HH:mm:ss');
    this.configurationService.associateTag(this.associateTag).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
      this.userEnabled = false;
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  public saveConsumer() {
    if (this.consumerForm.controls['gpsLocationCoordinate'].value !== null) {
      this.coordinates = '[' + this.consumerForm.controls['gpsLocationCoordinate'].value + ']';
    } else {
      this.coordinates = this.consumerForm.controls['gpsLocationCoordinate'].value;
    }
    this.createConsumer = new CreateConsumer(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createConsumer.consumerIdentifier = this.consumerForm.controls['consumerIdentifier'].value;
    this.createConsumer.tittleId = this.consumerForm.controls['tittleId'].value;
    this.createConsumer.firstName = this.consumerForm.controls['firstName'].value;
    this.createConsumer.lastName = this.consumerForm.controls['lastName'].value;
    this.createConsumer.genderId = this.consumerForm.controls['genderId'].value;
    this.createConsumer.birthDate = this._dateFormat.transform(this.consumerForm.controls['birthDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.createConsumer.gpsLocationCoordinate = this.coordinates;
    this.createConsumer.installationDate = this._dateFormat.transform(this.consumerForm.controls['installationDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.createConsumer.addressLine1 = this.consumerForm.controls['address'].value;
    this.createConsumer.zoneId = this.consumerForm.controls['zoneId'].value;
    this.createConsumer.districtId = this.consumerForm.controls['districtId'].value;
    this.createConsumer.cityId = this.consumerForm.controls['cityId'].value;
    this.createConsumer.stateId = this.consumerForm.controls['stateId'].value;
    this.createConsumer.pincodeId = this.consumerForm.controls['pincodeId'].value;
    this.createConsumer.mobile = this.consumerForm.controls['mobile'].value;
    this.createConsumer.alternateMobile = this.consumerForm.controls['alternateMobile'].value;
    this.createConsumer.identityTypeId = this.consumerForm.controls['IdCardType'].value;
    this.createConsumer.identityValue = this.consumerForm.controls['IdCard'].value;
    this.createConsumer.consumerTypeId = this.consumerForm.controls['consumerTypeId'].value;

    this.commonService.saveConsumer(this.createConsumer).subscribe(results => {
      this.toastr.success('Success', `${results.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  public updateConsumer() {
    if (this.consumerForm.controls['gpsLocationCoordinate'].value !== null && this.consumerForm.controls['gpsLocationCoordinate'].value.length !== 0) {
      this.coordinates = '[' + this.consumerForm.controls['gpsLocationCoordinate'].value + ']';
    } else if (this.consumerForm.controls['gpsLocationCoordinate'].value !== null && this.consumerForm.controls['gpsLocationCoordinate'].value.length === 0) {
      this.coordinates = null;
    } else {
      this.coordinates = this.consumerForm.controls['gpsLocationCoordinate'].value;
    }
    this.editConsumer = new EditConsumer(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editConsumer.consumerIdentifier = this.consumerForm.controls['consumerIdentifier'].value;
    this.editConsumer.tittleId = this.consumerForm.controls['tittleId'].value;
    this.editConsumer.firstName = this.consumerForm.controls['firstName'].value;
    this.editConsumer.lastName = this.consumerForm.controls['lastName'].value;
    this.editConsumer.genderId = this.consumerForm.controls['genderId'].value;
    this.editConsumer.birthDate = this._dateFormat.transform(this.consumerForm.controls['birthDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.editConsumer.gpsLocationCoordinate = this.coordinates;
    this.editConsumer.installationDate = this._dateFormat.transform(this.consumerForm.controls['installationDate'].value, 'yyyy-MM-dd HH:mm:ss');
    this.editConsumer.addressLine1 = this.consumerForm.controls['address'].value;
    this.editConsumer.zoneId = this.consumerForm.controls['zoneId'].value;
    this.editConsumer.districtId = this.consumerForm.controls['districtId'].value;
    this.editConsumer.cityId = this.consumerForm.controls['cityId'].value;
    this.editConsumer.stateId = this.consumerForm.controls['stateId'].value;
    this.editConsumer.pincodeId = this.consumerForm.controls['pincodeId'].value;
    this.editConsumer.mobile = this.consumerForm.controls['mobile'].value;
    this.editConsumer.alternateMobile = this.consumerForm.controls['alternateMobile'].value;
    this.editConsumer.identityTypeId = this.consumerForm.controls['IdCardType'].value;
    this.editConsumer.identityValue = this.consumerForm.controls['IdCard'].value;
    this.editConsumer.consumerTypeId = this.consumerForm.controls['consumerTypeId'].value;

    this.commonService.updateConsumer(this.editConsumer, this.data.id).subscribe(results => {
      this.toastr.success('Success', `${results.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

}
