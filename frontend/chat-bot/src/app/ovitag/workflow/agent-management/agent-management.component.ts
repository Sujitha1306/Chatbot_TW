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

import { Component, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, HospitalService } from '../../../shared';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup,Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { CreateAgents, EditAgents } from '../workflow.models';
import { ApptermsService } from '../../../shared/services/appterms.service';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-agent-management',
  templateUrl: './agent-management.component.html',
  styleUrls: ['./agent-management.component.scss']
})
export class AgentManagementComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  public applyFilterValue: any;
  public locationId = 'All'
  public selectFilter = [{ id: 'filter', value: 'FILTER' }];

  showAction1 = [
    { id: "create", value: "Create" }
  ];
  showAction2 = [
    { id: "modify", value: "Modify" },
    { id: "matrix", value: "Approval Matrix" }
  ];
  public showActions = this.showAction1

  displayedData = [
    // { 'colName': 'Id', 'title': 'Id', 'dataName': 'Id' },
    { 'colName': 'identifier', 'title': 'Client Code', 'dataName': 'identifier' },
    { 'colName': 'name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'clientTypeName', 'title': 'Type', 'dataName': 'clientTypeName' },
    { 'colName': 'verticalName', 'title': 'Vertical', 'dataName': 'verticalName' },
    { 'colName': 'taxTypeName', 'title': 'Tax', 'dataName': 'taxTypeName' }
  ];
  displayedColumns: string[] = this.displayedData.map(res => res.colName);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  rowfilter: any = [];
  filterValue: null;

  constructor(public dialog: MatDialog, public commonService: CommonService,) { }

  ngOnInit(): void {
    this.typeFilter();
    this.getAllAgent();
  }

  typeFilter(){
    this.commonService.getAppTerms("ClientType").subscribe(res => {
      this.rowfilter = res.results;
    });
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  getAllAgent(){
    this.commonService.getAgent('').subscribe(res => {
      this.dataSource = new MatTableDataSource(res.results);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === "manageWorklist") {
      this.manageWorklist(event.data);
    } else if (event.data === 'create') {
      this.createAgent('');
    } else {
      this.refreshPage()
    }
  }

  manageWorklist(event){
    this.commonService.getAgent(event).subscribe(res => {
      this.dataSource = new MatTableDataSource(res.results);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.filterValue = null;
    this.showActions = this.showAction1;
    this.locationId = null;
    this.getAllAgent()
  }

  createAgent(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(CreateAgentComponent,
    {data : data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage()
    });
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-agent-management',
  templateUrl: './create-agent.component.html',
  styleUrls: ['./agent-management.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateAgentComponent implements OnInit {

  public matcher = new ErrorStateMatcherService();
  public createAgentDetails: CreateAgents;
  public EditAgentDetails: EditAgents;
  public agentForm: FormGroup;
  public agentInfoForm: FormGroup;
  public enablePhoneNumber = true;
  public countryOptions: Observable<any>;
  clientTypeList: any = [];
  selectedTab: any;
  selectedIndex = 0;
  verticalList: any = [];
  countrycodeList: any = [];
  taxTypeList: any = [];
  agentId: any;
  addressInfo: any = [];
  agentAddress: any = [];
  phone: any;

  constructor(public fb: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateAgentComponent>,
    public datepipe: DatePipe, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any,private readonly hospitalService: HospitalService,
    private readonly commonService: CommonService,private readonly apptermsService: ApptermsService) { 
      this.buildForm(); 
      this.agentId = this.data.id
    }

  ngOnInit(): void {
    this.commonService.getAppTerms("ClientType,VerticalSector,TaxType").subscribe((res) => {
      this.clientTypeList = res.results.filter(resFilter => resFilter.groupName === 'ClientType');
      this.verticalList = res.results.filter(resFilter => resFilter.groupName === 'VerticalSector');
      this.taxTypeList = res.results.filter(resFilter => resFilter.groupName === 'TaxType');
    });

    this.commonService.getAppTermsVerion2('CountryCode').subscribe(res => {
      this.countrycodeList = res.results;
      if(!this.data?.countryCode && !this.agentId){
        this.apptermsService.setDefaultValue( this.agentInfoForm,'countryCode',this.countrycodeList ,'code');
      }
    });
    this.countryOptions = this.agentInfoForm.controls['countryCode'].valueChanges.pipe(
      startWith(...[null as string | null]),
      map(value => this.countrycodeList.filter(country => country.code.indexOf(value) === 0))
    );
    if(this.agentId){
      this.getAllAdress(this.data.id)
    }
  }

  public buildForm() {
    this.agentForm = this.fb.group({
      name: [this.data.name ? this.data.name : null, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      clientTypeId: [this.data.clientTypeId ? this.data.clientTypeId : null, [Validators.required]],
      verticalId: [this.data.verticalId ? this.data.verticalId : null, [Validators.required]],
      taxTypeId: [this.data.taxTypeId ? this.data.taxTypeId : null],
      taxNumber: [this.data.taxNumber ? this.data.taxNumber : null],
    });
    this.agentInfoForm = this.fb.group({
      addressTypeId: [null, [Validators.required]],
      name: [this.data.name ? this.data.name : null, [Validators.required]],
      line1: [null, [Validators.required]],
      line2: [null],
      city: [null, [Validators.required]],
      country: [null],
      phoneNumber: [null, [Validators.required, Validators.pattern(/(^\d{10}$)/)]],
      countryCode: [null, [Validators.required, Validators.pattern('^[+][0-9]{1,5}$')]],
      zip: [this.data.zip ? this.data.zip : null],
    })
  }

  tabClick(event) {
    this.selectedTab = event.index;
  }

  tabChange(event){
    this.selectedIndex = event;
    this.selectedTab = event
  }

  phoneNumber(type) {
    if(type === 'disable'){
      this.enablePhoneNumber = false;
    } else{
      this.agentInfoForm.get('countryCode').setValue('+');
      this.agentInfoForm.get('phoneNumber').setValue(null);
      this.enablePhoneNumber = true;
    }
  }

  public saveAgent() {
    this.createAgentDetails = new CreateAgents (null, null, null, null, null);
    this.createAgentDetails.clientTypeId   = this.agentForm.controls['clientTypeId'].value;
    this.createAgentDetails.taxTypeId   = this.agentForm.controls['taxTypeId'].value;
    this.createAgentDetails.taxNumber   = this.agentForm.controls['taxNumber'].value;
    this.createAgentDetails.verticalId   = this.agentForm.controls['verticalId'].value;
    this.createAgentDetails.name   = this.agentForm.controls['name'].value;

    this.commonService.createAgents( this.createAgentDetails).subscribe(res => {
      if (res.statusCode === 1) { 
        this.agentId = res.results.id;
        this.tabChange(1);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  public updateAgent() {
    this.EditAgentDetails = new EditAgents(null, null, null, null, null);
    this.EditAgentDetails.clientTypeId   = this.agentForm.controls['clientTypeId'].value;
    this.EditAgentDetails.taxTypeId   = this.agentForm.controls['taxTypeId'].value;
    this.EditAgentDetails.taxNumber   = this.agentForm.controls['taxNumber'].value;
    this.EditAgentDetails.verticalId   = this.agentForm.controls['verticalId'].value;
    this.EditAgentDetails.name   = this.agentForm.controls['name'].value;

    this.commonService.editAgents(this.data.id,this.EditAgentDetails).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  getAllAdress(id){
    this.commonService.getAllAgentInfo(id, 'RoClientDetail').subscribe(res => {
      this.agentAddress = res.results;
      if(this.agentAddress.length){
      if(this.agentAddress[0].phone){
        this.phoneNumber('disable');
      }
      this.agentInfoForm.patchValue({
        'addressTypeId': this.agentAddress[0].addressType,
        'name': this.agentAddress[0].name,
        'city': this.agentAddress[0].city,
        'country': this.agentAddress[0].country,
        'line1': this.agentAddress[0].line1,
        'line2': this.agentAddress[0].line2,
        'zip': this.agentAddress[0].zip,
        'phoneNumber': this.agentAddress[0].phone.substring(this.agentAddress[0].phone.length - 10, -10),
      });
    }
    })
  }

  public saveAddress() {
    const addressData = {
      "entityId": this.agentId,
      "entityType": "RoClientDetail",
      "city": this.agentInfoForm.controls['city'].value,
      "addressType": this.agentInfoForm.controls['addressTypeId'].value,
      "country": this.agentInfoForm.controls['country'].value,
      "line1": this.agentInfoForm.controls['line1'].value,
      "line2": this.agentInfoForm.controls['line2'].value,
      "name": this.agentInfoForm.controls['name'].value,
      "phone": this.agentInfoForm.controls['countryCode'].value.trim() + this.agentInfoForm.controls['phoneNumber'].value,
      "zip": this.agentInfoForm.controls['zip'].value
    };
    this.addressInfo.push(addressData)
    this.commonService.saveAgentAddress(this.addressInfo).subscribe(res => {
      if (res.statusCode === 1) { 
        this.getAllAdress(this.agentId);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  public editAddress() {
    const updatedAddress = {
      "id": this.agentAddress[0].id,
      "entityId": this.data.id,
      "entityType": "RoClientDetail",
      "city": this.agentInfoForm.controls['city'].value,
      "addressType": this.agentInfoForm.controls['addressTypeId'].value,
      "country": this.agentInfoForm.controls['country'].value,
      "line1": this.agentInfoForm.controls['line1'].value,
      "line2": this.agentInfoForm.controls['line2'].value,
      "name": this.agentInfoForm.controls['name'].value,
      "phone": this.agentInfoForm.controls['countryCode'].value.trim() + this.agentInfoForm.controls['phoneNumber'].value,
      "zip": this.agentInfoForm.controls['zip'].value
    };
    this.addressInfo.push(updatedAddress);
    this.commonService.updateAgentAddress(this.addressInfo).subscribe(res => {
      if (res.statusCode === 1) { 
        this.getAllAdress(this.data.id);
       }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
}
