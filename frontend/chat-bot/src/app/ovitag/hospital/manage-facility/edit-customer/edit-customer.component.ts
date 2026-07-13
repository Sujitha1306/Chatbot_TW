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
import { Component, Inject, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { HospitalService, CommonService } from '../../../../shared';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { EditCustomer } from '../../hospital.model';
import { CreateCustomerComponent } from '../create-customer/create-customer.component';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-edit-customer',
  templateUrl: './edit-customer.component.html',
  styleUrls: ['./edit-customer.component.scss'],
  encapsulation : ViewEncapsulation.None
})
export class EditCustomerComponent implements OnInit {
  public logoImage: any = null;
  public email: string;
  public isDisabled = false;

  public bgImage: any = null;
  getCongnitoRoles: any[] = [];
  cust_id: number;
  text = 'Customer';
  code = '1';
  selectedCustomer: any;
  customerType: any[] = [];
  customerList: any[] = [];
  regionList: any[] = [];
  selectedTab: any = 0;
  selectedRole = new FormControl();
  roleList: any[] = []; 
  public customerRoles : Array<any> = [];
  public selectedList = [];
  public isShowTable: boolean = false;
   commonRole = [];
  public roles = [];
  public removeIds = [];
  public roleIds = [];
  public saveCus: boolean = false;
  public customerForm: FormGroup;
  public editCustomer: EditCustomer;

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateCustomerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly hospitalServices: HospitalService, private readonly commonService: CommonService) {

    this.buildForm();
  }

  public matcher = new ErrorStateMatcherService();

  ngOnInit() {
    this.logoImage = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.data.id;
    this.bgImage = environment.api_base_url_new + environment.base_value.get_customer_bg_image + '/' + this.data.id;
    if (this.data.customerTypeId === '2') {
      this.code = '2';
    } else if(this.data.customerTypeId === '3') {
      this.code = '3';
    }
    this.getCustomerRoles();
    this.getRoles();
    
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
  getRoles() {
    this.commonService.getAllRole().subscribe(res => {
      this.roleList = res.results;
    });
  }
  getCustomerRoles(){
    this.hospitalServices.getAllCustomerRole().subscribe(res => {
      this.roles = [];
      this.customerType = res.results;
      for(let i in this.customerType){
        this.roles.push(this.customerType[i].roleName)
      }
      this.selectedRole.setValue(this.roles)
      this.roleSelection(this.roles);
    })
  }
  tabClick(event){
    this.selectedTab = event.index;
  }
  roleSelection(value){
    this.selectedList = [];
    this.roleIds = [];
    this.removeIds = [];
    if(this.selectedRole.value !== null){
      const addList = value.filter(res => !this.roles.includes(res))
      const existList = this.customerType.filter(res => value.includes(res.roleName))
      const delList = this.customerType.filter(res => !value.includes(res.roleName))
      for(let i in addList){
        this.saveCus = true;
        let roleFilter = this.roleList.filter(res =>  res.name == addList[i])
        let addTable = { id: this.customerType.length +1 , roleId: roleFilter[0].id, roleName: addList[i], status: "Add"}
        this.selectedList.push(addTable)
      }
      for(let i in existList){
        existList[i]['status'] = "Exists"
        this.selectedList.push(existList[i]);
      }
      for(let i in delList){
        this.saveCus = true;
        delList[i]['status'] = "Delete"
        this.selectedList.push(delList[i]);
      }
      this.saveCus = this.getSaveCus(addList, delList);
      for(let i in this.selectedList){
        if(this.selectedList[i].status == "Delete"){
          this.removeIds.push(this.selectedList[i].id)
        } else if(this.selectedList[i].status == "Add"){
          this.roleIds.push(this.selectedList[i].roleId)
        }
      }
      this.commonRole = this.selectedList;
       if(this.commonRole.length > 0){
        this.isShowTable = true;
      }
    }
  }
  getSaveCus(addList, delList) {
    if(addList.length > 0 || delList.length > 0){
        return true;
      } else{
        return false;
      }
  }
  saveRoles(){
    let cusData = {"removeIds": this.removeIds, "roleIds": this.roleIds}
    this.hospitalServices.saveCustomerRole(cusData).subscribe(res => {
      this.customerType = [];
      this.getCustomerRoles();
    })
  }
  public editUser(data) {
    this.isDisabled = true;

    this.customerForm.value.customerTypeId = this.cust_id;

    const editCustomer = new EditCustomer(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

    editCustomer.customerTypeId = data.customerTypeId;
    editCustomer.name = this.customerForm.controls['name'].value;
    editCustomer.parentId = data.parentId;
    editCustomer.billAddress = this.customerForm.controls['billAddress'].value;
    editCustomer.regAddress = this.customerForm.controls['regAddress'].value;
    editCustomer.licencePack = this.customerForm.controls['licencePack'].value;
    editCustomer.gsTin = this.customerForm.controls['gsTin'].value;
    editCustomer.noOfEmployees = this.customerForm.controls['noOfEmployees'].value;
    editCustomer.noOfDevices = this.customerForm.controls['noOfDevices'].value;
    editCustomer.noOfBeds = this.customerForm.controls['noOfBeds'].value;
    editCustomer.isMulti = this.customerForm.controls['isMulti'].value;
    editCustomer.isActive = this.customerForm.controls['isActive'].value;
    editCustomer.logoImage = this.logoImage;
    editCustomer.bgImage = this.bgImage;
    
    let imageCheck = editCustomer.bgImage.split(':');
    if(imageCheck.length > 0 && imageCheck[0] != 'data') {
      delete editCustomer['bgImage'];
    }
    let logoCheck = editCustomer.logoImage.split(':');
    if(logoCheck.length > 0 && logoCheck[0] != 'data') {
      delete editCustomer['logoImage'];
    }
    editCustomer.id = data.id;
    this.hospitalServices.updateCustomer(editCustomer).subscribe(result => {
      if (result.statusCode != 1) {
        this.isDisabled = false;
      }

      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }


  public buildForm() {
    this.customerForm = this.form.group({
      name: [this.data.name ? this.data.name : null, [Validators.required, Validators.minLength(3), Validators.maxLength(64)]],
      parentId: [null],
      
      customerTypeId: [this.data.cust_id ? this.data.cust_id : null],
      billAddress: [this.data.billAddress ? this.data.billAddress : null],
      licencePack: [this.data.licencePack ? this.data.licencePack : null],
      gsTin: [this.data.gsTin ? this.data.gsTin : null],
      noOfEmployees: [this.data.noOfEmployees ? this.data.noOfEmployees : null],
      noOfDevices: [this.data.noOfDevices ? this.data.noOfDevices : null],
      noOfBeds: [this.data.noOfBeds ? this.data.noOfBeds : null],
      isMulti: [this.data.isMulti ? this.data.isMulti.toString() : null],
      logoImage: [this.data.logoImage ? this.data.logoImage : null],
      bgImage: [this.data.bgImage ? this.data.bgImage : null],
      regAddress: [this.data.regAddress ? this.data.regAddress : null],
      isActive: [this.data.isActive.toString() ? this.data.isActive.toString() : null],
      contacts: this.form.array([this.getContact()]),

    });
  }
  private getContact() {
    return this.form.group({
      contactName: [null],
      email: [this.data.email ? this.data.email : null, [ Validators.pattern(/(^\d{10}$)|(^[A-Za-z0-9_.-]+@[A-Za-z0-9_.-]+\.[A-Za-z]{2,4}$)/)]], 
      phoneNumber: [null],
      comment: [null]
    });
  }

  private addContact() {
    const control = <FormArray>this.customerForm.controls['contacts'];
    control.push(this.getContact());
  }

  private removeContact(i: number) {
    const control = <FormArray>this.customerForm.controls['contacts'];
    control.removeAt(control.length - 1);
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

  getAllCustomerType(data): void {
    this.commonService.getAppTermsVerion2(data).subscribe(res => {
      this.selectedCustomer = '2';
      this.buildForm();
      this.customerType = res;
    });
  }

  getCustomerList(): void {
    this.hospitalServices.getCustomerList().subscribe(res => {
      this.customerList = res.results;
    });
  }
  getRegionList(cust_id): void {
    this.hospitalServices.getRegionList(cust_id).subscribe(res => {
      this.regionList = res.results;
    });
  }
}
