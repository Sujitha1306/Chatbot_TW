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
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HospitalService, CommonService } from '../../../../shared';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { CreateCustomer } from '../../hospital.model';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-create-customer',
  templateUrl: './create-customer.component.html',
  styleUrls: ['./create-customer.component.scss']
})
export class CreateCustomerComponent implements OnInit {
  
  public matcher = new ErrorStateMatcherService();
  public logoImage: any = null;
  public bgImage: any = null;
  public isDisabled = false;
  public selectedCustomer: any = '1';
  customerType: any[] = [];
  customerList: any[] = [];
  regionList: any[] = [];
  text = 'Customer';
  code = '1';
  cust_id: number = null;

    
    @ViewChild('name', { static: true }) nameInput: MatInput;

  public parentName: string = null;
  public customerForm: FormGroup;
  public contactForm: FormGroup;
  public email: string;
  public phoneNumber: string;
  public customerData = [];
  public options = [
      { 'name': 'some name 1', ID: 'D1'},
      { 'name': 'some name 2', ID: 'D2'}
  ];
  constructor(public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateCustomerComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly hospitalServices: HospitalService, private readonly commonService: CommonService) {
      this.getCustomerDetails();
      this.getAllCustomers();
  }

  ngOnInit() {
    this.nameInput.focus();
    this.buildForm();
  }
  getCustomerDetails() {
    this.commonService.getAppTermsVerion2('CustomerType').subscribe(res => {
      const customerTypeId = this.data.customerTypeId;
      this.customerType = res.results;
      if (res.results[0].code == this.data.customerTypeId) {
        this.parentName = 'Region';
        this.selectedCustomer = 2;
      } else if (res.results[1].code == this.data.customerTypeId) {
        this.parentName = 'Facility';
        this.selectedCustomer = 3;
      } else if (res.results[1].code == customerTypeId) {
        this.parentName = res[2].name;
      } else {
          this.parentName = 'Customer';
      }
    });

    this.hospitalServices.getCustomerList().subscribe(res => {
      this.customerList = res.results;
    });
  }
  getAllCustomers() {
    this.hospitalServices.getAllCustomers().subscribe(res => {
      const isAdmin = localStorage.getItem('userlevel');
      if (isAdmin == '1') {
        this.customerData = res.results;
      } else {
        const custDetail = res.results.filter(res => res.id == localStorage.getItem('customerId'));
        const userLevel = localStorage.getItem('userlevel');
        if (parseInt(userLevel) > 2) {
          custDetail[0].children = custDetail[0].children.filter(res => res.id == localStorage.getItem('regionId'));
          custDetail[0].children[0].children = custDetail[0].children[0].children.filter(res => res.id == localStorage.getItem(btoa('facilityId')));
          this.customerData = res.results;
        } else {
          this.customerData = res.results;
        }
      }
    });
  }
  
  public buildForm() {
    this.customerForm = this.form.group({
      customerTypeId: [null],
      name: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(64)]],
      customerId: [null],
      regionId: [null],
      parentId: [null],
      billAddress: [null],
      licencePack: [null],
      gsTin: [null],
      noOfEmployees: [null],
      noOfDevices: [null],
      noOfBeds: [null],
      isMulti: ['true'],
      logoImage: [null],
      bgImage: [null],
      regAddress: [null],
      isActive: ['true'],
      contacts: this.form.array([this.getContact()]),

    });

  }
  getCustType(data) {
    this.code = data.code;
    this.cust_id = data.code;
    if (this.code == '3') {
      this.customerForm.controls['customerId'].setValidators(Validators.required)
      this.customerForm.controls['regionId'].setValidators(Validators.required)
      this.customerList = this.customerData.filter(res => res.children.length > 0);
      this.regionList = [];
    } else if(this.code == '2') {
      this.customerForm.controls['customerId'].setValidators(Validators.required)
      this.customerForm.controls['regionId'].clearValidators()
      this.customerList = this.customerData;
    } else {
      this.customerForm.controls['customerId'].clearValidators();
      this.customerForm.controls['regionId'].clearValidators();
      this.customerForm.controls['customerId'].setValue(null);
      this.customerForm.controls['regionId'].setValue(null); 
    }
  }


  getRegionList(cust_id): void {
    this.hospitalServices.getRegionList(cust_id).subscribe(res => {
      this.regionList = res.results;
    });
  }

  onSelectFile(event) {
    if (event.target?.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  uploadBgImage($event): void {
    this.readData($event.target);

  }

  readData(inputValue: any): void {
    const file: File = inputValue.files[0];
    const myTag: FileReader = new FileReader();

    myTag.onloadend = (e) => {
      this.bgImage = myTag.result;
    };
    myTag.readAsDataURL(file);
  }

  uploadImage($event): void {
    this.readThis($event.target);
  }

  readThis(inputValue: any): void {
    const file: File = inputValue.files[0];
    const myTag: FileReader = new FileReader();

    myTag.onloadend = (e) => {
      this.logoImage = myTag.result;
    };
    myTag.readAsDataURL(file);
  }

  private getContact() {
    return this.form.group({
      contactName: [null],
      email: [this.email ? this.email : null, [Validators.email]],
      phoneNumber: [this.phoneNumber ? this.phoneNumber : null, [Validators.pattern('[6789][0-9]{9}')]],
      comment: [null]
    });
  }

  public addContact() {
    const control = <FormArray>this.customerForm.controls['contacts'];
    control.push(this.getContact());
  }

  public removeContact(i: number) {
    const control = <FormArray>this.customerForm.controls['contacts'];
    control.removeAt(control.length - 1);
  }

  public saveCustomer() {
    this.isDisabled = true;
    this.customerForm.controls['parentId'].setValue(null);
    if (this.code === '2') {
      this.customerForm.controls['parentId'].setValue(this.customerForm.controls['customerId'].value);
    } else if (this.code === '3') {
      this.customerForm.controls['parentId'].setValue(this.customerForm.controls['regionId'].value);
    }
    const createCustomer = new CreateCustomer(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    createCustomer.customerTypeId = this.cust_id == null ? this.selectedCustomer : this.cust_id;
    createCustomer.name = this.customerForm.controls['name'].value;
    createCustomer.parentId = this.data.id ? this.data.id : this.customerForm.controls['parentId'].value;
    createCustomer.billAddress = this.customerForm.controls['billAddress'].value;
    createCustomer.regAddress = this.customerForm.controls['regAddress'].value;
    createCustomer.licencePack = this.customerForm.controls['licencePack'].value;
    createCustomer.gsTin = this.customerForm.controls['gsTin'].value;
    createCustomer.noOfEmployees = this.customerForm.controls['noOfEmployees'].value;
    createCustomer.noOfDevices = this.customerForm.controls['noOfDevices'].value;
    createCustomer.noOfBeds = this.customerForm.controls['noOfBeds'].value;
    createCustomer.isMulti = this.customerForm.controls['isMulti'].value;
    createCustomer.isActive = this.customerForm.controls['isActive'].value;
    createCustomer.contacts = this.customerForm.value.contacts;
    createCustomer.logoImage = this.logoImage;
    createCustomer.bgImage = this.bgImage;
    

    this.hospitalServices.saveCustomer(createCustomer).subscribe(res => {
      if (res.statusCode != 1) {
        this.isDisabled = false;
      }
      
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
}
