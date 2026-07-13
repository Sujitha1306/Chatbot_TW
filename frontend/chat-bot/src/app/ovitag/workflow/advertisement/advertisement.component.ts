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
import { Component, Inject, OnInit, Pipe, PipeTransform, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../shared';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { createOrderDetails, editOrderDetails } from '../workflow.models';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '../../../shared/modules/entry-component/layout-save/layout-save.component';
import { NGX_MAT_DATE_FORMATS, NgxMatDateFormats } from '@angular-material-components/datetime-picker';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-advertisement',
  templateUrl: './advertisement.component.html',
  styleUrls: ['./advertisement.component.scss'],
})
export class AdvertisementComponent implements OnInit {
  tableData: any;
  public loading = false;
  displayedColumns: string[] = ['Ro Number','Employee Name', 'Customer Name', 'Deal Type', 'Billing Type', 'Start Date', 'End Date', 'Budget Amount', 'Payment Terms', 'Status'];
  iconHeader = [];
  iconColumn: any = ['Start Date', 'End Date'];
  sortColumn: any = [];
  eventColumn: any = ['Employee Name'];
  permissionControl = ["BT_ALLE"];
  public applyFilterValue: any;
  showAction1 = [
    { id: "create", value: "Create" }
  ];
  showAction2 = [
    { id: "modify", value: "Modify" },
  ];
  roWorkflow = [
    { id: "ROS-CR", value: "Created", level: 1 },
    { id: "ROS-SM", value: "Senior manager approved", level: 2 },
    { id: "ROS-SL", value: "Salese Approved", level: 2 },
    { id: "ROS-VP", value: "VP Approved", level: 2 },
    { id: "ROS-AC", value: "Accounts Approved", level: 3 },
    { id: "ROS-SH", value: "Schedule Approved", level: 4 },
    { id: "ROS-LV", value: "Live Approved", level: 4 },
  ];
  public showActions = this.showAction1;
  public selectedName: any = null;
  public selectedView = 'table';
  public selectDropdown: any;
  workflowDetails: any = {
    'allWorkflow': [],
    'userWorkflow': [],
    'enableCreate': false
  };
  getStatus = [];
  filterTableData: any;

  constructor(public dialog: MatDialog, private readonly commonService: CommonService, private readonly route: ActivatedRoute,) { }

  ngOnInit() {
    this.getApprovalMatrix();
    this.getAllReleaseOrder();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  refreshPage(isAutoRefresh?: boolean) {
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    if(this.getStatus[0].level === 1){
      this.showActions = this.showAction1;
    } else {
      this.showActions = null;
    }
    this.selectedName = null;
    this.selectDropdown = null;
    this.getAllReleaseOrder();
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.selectDropdown = null;
      if(this.getStatus[0].level === 1){
        this.showActions = this.showAction1;
      } else {
        this.showActions = null;
      }
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createOrder('', '');
    } else if (event.data === 'modify') {
      this.createOrder(this.selectedName, '');
    } else if (event.data === 'matrix') {
      this.createOrder(this.selectedName, 'matrix');
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'Employee Name') {
      this.createOrder(this.selectedName, '');
    }
   }
  getApprovalMatrix() {
    this.commonService.getworkflowbyEntity('ReleaseOrder').subscribe((res) => {
      if (res.statusCode === 1) {
        this.workflowDetails['allWorkflow'] = res.results;
        let roleId = parseInt(localStorage.getItem('userlevel'));
        this.workflowDetails['userWorkflow'] = this.workflowDetails['allWorkflow'].filter(val => val.identifyingId == roleId && val.identifyingType === 'RT-RO');
        if (this.workflowDetails['userWorkflow'].filter(val => val.workflowLevelId === '1').length) {
          this.workflowDetails.enableCreate = true;
          this.showActions = this.showAction1;
        } else {
          this.showActions = []
        }
        let userWorkflowLevel = this.workflowDetails['userWorkflow'][0];
        this.getStatus = this.roWorkflow.filter(val => val.level == userWorkflowLevel.workflowLevelId);
      }
    });
  }
  getAllReleaseOrder(): void {
    this.commonService.getAllReleaseOrders().subscribe((res) => {
      this.tableData = res.results;
      this.loading = false;
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      for (let statusList of this.getStatus) {
        let filterTable = this.tableData.filter(val => val.status == statusList.id)
        if (filterTable.length !== 0) {
          this.tableData = filterTable;
          const Columns = ['roNumber', 'employeeName', 'clientName', 'dealTypeName', 'billingTypeName', 'startDatetime', 'endDatetime', 'budgetAmount', 'paymentTerms', 'statusName'];
          for (let i = 0; i <= Columns.length; i++) {
            if (this.tableData.length !== 0) {
              this.tableData.map((data) => {
                data[this.displayedColumns[i]] = data[Columns[i]];
              });
            }
          }
        }
      }
    });
  }

  createOrder(event, key) {
    this.showActions = null;
    let data
    if (key !== 'matrix') {
      data = { "matrixId": false, "advData": event, "statusId": this.getStatus[0].id };
    } else {
      data = { "matrixId": true, "advData": event };
    }
    const dialogRef = this.dialog.open(CreateAdvertiesComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null
      this.refreshPage();
    });
  }
}

const NGX_DATE_FORMAT: NgxMatDateFormats = {
  parse: {
    dateInput: 'DD/MM/YYYY HH:mm'
  },
  display: {
    dateInput: 'DD-MMM-YYYY HH:mm:ss',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

const MY_DATE_FORMAT = {
  parse: {
    dateInput: 'DD/MMM/YYYY',
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-advertisement',
  templateUrl: './create-advertise.component.html',
  styleUrls: ['./advertisement.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: NGX_MAT_DATE_FORMATS, useValue: NGX_DATE_FORMAT },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMAT }
  ],
})

export class CreateAdvertiesComponent implements OnInit {

  public orderEntryForm: FormGroup;
  public campaignForm: FormGroup;
  public matrixForm: FormGroup;
  public createReleaseOrder: createOrderDetails;
  public editReleaseOrder: editOrderDetails;
  public dataSource: MatTableDataSource<any>;
  public currentDate: any = new Date();
  campaignDisplayColumn: string[] = ['brandname', 'campaign Name', 'campaignDescription', 'instructions', 'from Date', 'to Date', 'campaignAmount', 'Status', 'Select'];
  public DateTime = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd 00:00:00');
  public endDateTime = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd 23:59:59');
  public CurrentDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedIndex = 0;
  public userId: any;
  campaign: any = [];
  dealTypeList: any = [];
  billingList: any = [];
  status: any = [];
  campaignInfo: any = [];
  customerList: any = [];
  isEdit = false;
  brandData: any = [];
  orderId: any;
  levelList = [{ code: 1, value: 'level1' }, { code: 2, value: 'level2' }, { code: 3, value: 'level3' }, { code: 4, value: 'level4' }, { code: 5, value: 'level5' }, { code: 6, value: 'level6' }, { code: 7, value: 'level7' }, { code: 8, value: 'level8' }, { code: 9, value: 'level9' }, { code: 10, value: 'level10' }];
  days = [{ code: 'sun', value: 'SUNDAY' }, { code: 'mon', value: 'MONDAY' }, { code: 'tue', value: 'TUESDAY' }, { code: 'wed', value: 'WEDNESDAY' }, { code: 'thus', value: 'THUSRSDAY' }, { code: 'fri', value: 'FRIDAY' }, { code: 'sat', value: 'SATURDAY' }, { code: 'weekend', value: 'EVERY WEEKEND' }, { code: 'allday', value: 'EVERY DAY' },];
  recipientTypeList: any = [];
  public userNameList = [];
  public recipientEnabled = false;
  recepientListItems: any = [];
  kynUser = [];
  kynNameList: any = [];
  kynUserEnabled = false;
  agentEnabled = false;
  clientEnabled = false;
  budget: any;
  roId = null;
  workflow: any = [];
  channelType: any = [];
  clientType: any = [];
  clientAddress: any;
  agentAddress: any;
  campaignDate: any;
  endTime: any;
  SalesRepMatchVal: any = [];
  clentMatchValue: any = []
  salesRepList: any = [];
  clientList: any = [];
  agentList: any = [];
  clientData: any = [];
  agentData : any = []
  agentDetails: any;
  clientDetails: any;
  agentInfo: any;
  selectedDays: string[];
  clientGst: any;
  agentGst: any;
  clientZone: any;
  agentZone: any;
  balanceCampaign: any;

  constructor(public fb: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateAdvertiesComponent>,
    public datepipe: DatePipe, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly workflowService: WorkflowService,
    private readonly commonService: CommonService, private readonly hospitalService: HospitalService, public configurationService: ConfigurationService) { }

  ngOnInit() {
    this.userId = localStorage.getItem(btoa('userId'));
    this.getCustomerDetails();
    this.buildForm();
    this.commonService.getAppTerms("DealType,Status,BillingType,RecipientType,Channel,ClientType").subscribe((res) => {
      this.dealTypeList = res.results.filter(resFilter => resFilter.groupName === 'DealType');
      this.billingList = res.results.filter(resFilter => resFilter.groupName === 'BillingType');
      this.status = res.results.filter(resFilter => resFilter.groupName === 'Status');
      this.recipientTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType');
      this.channelType = res.results.filter(resFilter => resFilter.groupName === 'Channel');
      this.clientType = res.results.filter(resFilter => resFilter.groupName === 'ClientType');
    });
    if (this.data.advData.id) {
      this.roId = this.data.advData.id
      this.getCampaign(this.roId, true);
      this.budget = this.data.advData.budgetAmount;
      this.balanceCampaign = this.data.advData.budgetAmount;
    }
    this.totalDay();
  }

  public buildForm() {
    this.orderEntryForm = this.fb.group({
      roNumber: [this.data.advData.roNumber ? this.data.advData.roNumber : null, [Validators.required]],
      employeeId: [this.data.advData.employeeId ? this.data.advData.employeeName : null, [Validators.required, this.saleRepMatch.bind(this)]],
      clientTypeId: [this.data.advData.clientTypeId ? this.data.advData.clientTypeId : null],
      clientTaxNumber: [this.data.advData.clientTaxNumber ? this.data.advData.clientTaxNumber : null],
      entityAddressZone:[this.data.advData.entityAddressZone ? this.data.advData.entityAddressZone : null],
      clientDetailId: [this.data.advData.clientId ? this.data.advData.clientName : null,[Validators.required, this.clientMatch.bind(this)]],
      agencyDetailId: [this.data.advData.agencyId ? this.data.advData.agencyName : null,[this.agentMatch.bind(this)]],
      billingAddress: [this.data.advData.billingAddress ? this.data.advData.billingAddress : null],
      dealTypelId: [this.data.advData.dealTypeId ? this.data.advData.dealTypeId : null, [Validators.required]],
      roDateId: [this.data.advData.roDate ? this.data.advData.roDate : this.CurrentDate],
      startDatetime: [this.data.advData.startDatetime ? this.data.advData.startDatetime : this.DateTime, [Validators.required]],
      endDatetime: [this.data.advData.endDatetime ? this.data.advData.endDatetime : this.endDateTime, [Validators.required]],
      noOfDays: [0],
      days: [this.data.advData.days ? this.data.advData.days : null],
      Budget: [this.data.advData.budgetAmount ? this.data.advData.budgetAmount : 0, [Validators.required]],
      billingTypeId: [this.data.advData.billingTypeId ? this.data.advData.billingTypeId : null, [Validators.required]],
      billingValueId: [null,  [Validators.required]],
      terms: [this.data.advData.paymentTerms ? this.data.advData.paymentTerms : null, [Validators.required]],
      notes: [this.data.advData.notes ? this.data.advData.notes : null],
      status: [this.data.advData.status ? this.data.advData.status : null]
    });
    this.campaignForm = this.fb.group({
      id: [null],
      brandName: [null, [Validators.required]],
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      fromDate: [this.data.advData.startDatetime ? this.data.advData.startDatetime : this.datepipe.transform(this.data.advData.startDatetime, 'yyyy-MM-dd 00:00:00'), [Validators.required]],
      toDate: [this.datepipe.transform(this.data.advData.endDatetime, 'yyyy-MM-dd 23:59:59'),[Validators.required]],
      campaignBudget: [null,[Validators.required]],
      remarks: [null],
    });
    this.matrixForm = this.fb.group({
      userList: this.fb.array([])
    });
  }

  private saleRepMatch(control: FormControl): ValidationErrors | null {
      if (control.value !== null && control.value !== '' ) {
      this.SalesRepMatchVal = this.userNameList.filter(resFilter => resFilter.id === control.value);
      if (this.SalesRepMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
  }

  private clientMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '') {
    this.clentMatchValue = this.clientList.filter(resFilter => resFilter.id === control.value);
    if (this.clentMatchValue.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
}

private agentMatch(control: FormControl): ValidationErrors | null {
  if (control.value !== null && control.value !== '') {
  this.clentMatchValue = this.agentList.filter(resFilter => resFilter.id === control.value);
  if (this.clentMatchValue.length === 0) {
      return { requireMatch: true };
    }
  }
  return null;
}

  totalDay() {
    let startDate = this.datepipe.transform(this.orderEntryForm.controls['startDatetime'].value, 'yyyy-MM-dd');
    let endDate = this.datepipe.transform(this.orderEntryForm.controls['endDatetime'].value, 'yyyy-MM-dd');
    const fromDate = new Date(startDate);
    const toDate = new Date(endDate);
    let time = toDate.getTime() - fromDate.getTime();
    let Days = time / (1000 * 3600 * 24);
    let addDays = Days + 1
      this.orderEntryForm.get('noOfDays').setValue(addDays);
  }

  numberword() {
    this.budget = this.orderEntryForm.controls['Budget'].value;
  }

  tabClick(event) {
    this.selectedIndex = event.index;
  }

  addUserForm() {
    const control = <FormArray>this.matrixForm.controls['userList'];
    control.push(this.addUserList());
  }

  private addUserList(element?) {
    let lastRowLevel;
    let recipientName = null;
    const control = <FormArray>this.matrixForm.controls['userList'];
    if (control.length) {
      let lastIndex = control.length - 1
      lastRowLevel = control.at(lastIndex).value['level'];
      lastRowLevel = lastRowLevel + 1;
      if (lastRowLevel == 11) {
        lastRowLevel = 1;
      }
    } else {
      lastRowLevel = 1;
    }
    recipientName = this.getRecipientName(element);
    let level = lastRowLevel;
    return this.fb.group({
      id: [element ? element.id : null],
      level: [element ? Number(element.workflowLevelId) : level],
      identifyingId: [element ? element.identifyingId : null],
      recipientName: [recipientName],
      channelTypeId: [element ? element.channelTypeId : null],
      recipientType: [element ? element.identifyingType : 'RT-US'],
      description: [element ? element.description : null],
      isActive: [element ? element.isActive : true],
    });
  }

  getRecipientName(element) {
    if (element?.hasOwnProperty('identifyingType')) {
      if (element.identifyingType == 'RT-US') {
        const recipientName = element.userName;
        return recipientName;
      } else if (element.identifyingType == 'RT-RO') {
        const recipientName = element.roleName;
        return recipientName;
      }
    }
  }

  removeUserDetails(index: number) {
    const control = <FormArray>this.matrixForm.controls['userList'];
    let removeUserDetail = control.at(index).value;
    if (removeUserDetail['id'] == null) {
      control.removeAt(index);
    } else {
      removeUserDetail['isActive'] = false;
      control.at(index).setValue(removeUserDetail);
    }
  }

  nextTab(num) {
    this.selectedIndex = num;
  }

  getCustomerDetails() {
    this.hospitalService.getAllCustomers().subscribe(res => {
      const customerDetails = res.results;
      this.customerList = customerDetails
    });
  }

  getCampaign(id, fstLoad) {
    this.commonService.getAllcampaign(id).subscribe(res => {
      this.campaign = res.results[0]['campaignDetails'];
      this.workflow = res.results[0]['pfWorkflows'];
      const control = <FormArray>this.matrixForm.controls['userList'];
      if (this.workflow) {
        if (this.workflow.length) {
          this.workflow.forEach(element => {
            if (element.isActive) {
              control.push(this.addUserList(element));
            }
          });
        }
      }
      if (control.length == 0) {
        this.matrixForm = this.fb.group({
          userList: this.fb.array([this.addUserList()])
        })
      }
      this.dataSource = new MatTableDataSource<any>(this.campaign);
      if(fstLoad === true){
        this.sumOfcampignAmt()
      }
    });
  }

  billingClientDetails(event) {
    if(event.billingDetails.length){
      this.clientAddress = event.billingDetails[0]['billingAddress'];
      this.clientDetails = event.billingDetails[0]['id'];
      this.clientGst = event['taxNumber'];
      this.clientZone = event.billingDetails[0]['city'];
    }
  }

  billingAgencyDetails(event) {
    if(event.billingDetails.length){
    this.agentAddress = event.billingDetails[0]['billingAddress'];
    this.agentDetails = event.billingDetails[0]['id'];
    this.agentGst = event['taxNumber'];
    this.agentZone = event.billingDetails[0]['city'];
    }
  }

  clientTypes(event) {
    if (event.code === 'CT-AGT') {
      this.orderEntryForm.get('billingAddress').setValue(this.agentAddress);
      this.orderEntryForm.get('clientTaxNumber').setValue(this.agentGst);
      this.orderEntryForm.get('entityAddressZone').setValue(this.agentZone);
      this.agentInfo = this.agentDetails
    } else if (event.code === 'CT-CLI') {
      this.orderEntryForm.get('billingAddress').setValue(this.clientAddress);
      this.orderEntryForm.get('clientTaxNumber').setValue(this.clientGst);
      this.orderEntryForm.get('entityAddressZone').setValue(this.clientZone);
      this.agentInfo = this.clientDetails
    }

  }

  getClientSearch(event) {
    if (event.text.length >= 3) {
      if (event.toHit === true) {
        this.commonService.getSearchAgent('CT-CLI', event.text).subscribe(res => {
         this.clientData = res.results;
          this.clientList =  this.clientData;
          this.clientEnabled = true;
        });
      } else {
        this.clientList = null;
        this.clientEnabled = true;
      }
    }
  }

 getClientName(ClientId) {
    if (ClientId) {
      let clientName = this.clientList.filter(res => res.id == ClientId);
      return clientName[0]['name'];
    } else {
      return '';
    }
  }

  getAgentSearch(event) {
    if (event.text.length >= 3) {
      if (event.toHit === true) {
        this.commonService.getSearchAgent('CT-AGT', event.text).subscribe(res => {
          this.agentData = res.results;
          this.agentList = this.agentData;
          this.agentEnabled = true;
        });
      } else {
        this.agentList = null;
        this.agentEnabled = true;
      }
    }
  }

  getAgentName(agentId) {
    if (agentId) {
      let agentName  = this.agentList.filter(res => res.id == agentId);
      return agentName[0]['name'];
    } else {
      return '';
    }
  }

  getSearchUser(event) {
    if (event.text.length >= 3) {
      if (event.toHit === true) {
        this.configurationService.getRecipientName(event.text, 'RT-US').subscribe(res => {
          this.kynUser = res.results;
          this.userNameList = this.kynUser;
          this.kynUserEnabled = true;
        });
      } else {
        this.userNameList = this.kynUser;
        this.kynUserEnabled = true;
      }
    }
  }

  searchUserNamelist(event, i) {
    if (this.matrixForm.controls['userList'].value[i].recipientType !== null) {
      this.recipientEnabled = false;
      let recipient = this.matrixForm.controls['userList'].value[i].recipientType;
      let serachText = event.text;
      if (recipient !== 'RT-RO' && serachText.length >= 2) {
        if (event.toHit === true) {
          this.configurationService.getRecipientName(serachText, recipient).subscribe(res => {
            this.recepientListItems = res.results;
            this.userNameList = this.recepientListItems;
            this.recipientEnabled = true;
          });
        } else {
          this.userNameList = this.recepientListItems;
          this.recipientEnabled = true;
        }
      } else {
        this.configurationService.getRecipientName(serachText, recipient).subscribe(res => {
          this.recepientListItems = res.results;
          this.userNameList = this.recepientListItems;
          this.recipientEnabled = true;
        });
      }
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }

  getUsername(selectedUserId) {
    if (selectedUserId) {
      let selectedUser = this.userNameList.filter(res => res.id == selectedUserId);
      return selectedUser[0]['name'];
    } else {
      return '';
    }
  }

  sumOfcampignAmt(){
    for (let campaign of this.campaign) {
      if (campaign?.budgetAmount) {
       this.balanceCampaign -= campaign?.budgetAmount;
      }
    }
  }

  saveCampaign() {
    this.isEdit = false;
    const data = {
      'id': this.campaignForm.controls['id'].value,
      'bookingUserId': this.userId,
      'brandName': this.campaignForm.controls['brandName'].value,
      'name': this.campaignForm.controls['name'].value,
      'description': this.campaignForm.controls['description'].value,
      'startDatetime': this.datepipe.transform(this.campaignForm.controls["fromDate"].value, "yyyy-MM-dd HH:mm:ss"),
      'endDatetime': this.datepipe.transform(this.campaignForm.controls["toDate"].value, "yyyy-MM-dd HH:mm:ss"),
      'budgetAmount': this.campaignForm.controls['campaignBudget'].value,
      'remarks': this.campaignForm.controls['remarks'].value,
      'isActive': true,
      'releaseOrderId': this.orderId
    };
    this.campaign.push(data);
    this.dataSource = new MatTableDataSource<any>(this.campaign);
    this.campaignForm.reset();
    this.balanceCampaign = this.balanceCampaign - data.budgetAmount;
  }

  editCampaign(data) {
    this.isEdit = true;
    this.campaignForm.controls['id'].setValue(data.id);
    this.campaignForm.controls['brandName'].setValue(data.brandName);
    this.campaignForm.controls['name'].setValue(data.name);
    this.campaignForm.controls['description'].setValue(data.description);
    this.campaignForm.controls['fromDate'].setValue(data.startDatetime);
    this.campaignForm.controls['toDate'].setValue(data.endDatetime);
    this.campaignForm.controls['campaignBudget'].setValue(data.budgetAmount);
    this.campaignForm.controls['remarks'].setValue(data.remarks);
    this.orderId = data.releaseOrderId
    const id = this.campaignForm.controls['brandName'].value;
    this.campaign = this.campaign.filter(x => x.brandName !== id);
  }

  deleteCampaign(data) {
    const index: number = this.campaign.indexOf(data);
    if (index !== -1) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px', height: '180px', panelClass: 'pop-up-margin',
        data: {
          title: 'Confirmation',
          message: 'Do you want to delete the Campaign?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'Yes') {
          this.campaign[index]['isActive'] = false;
          this.balanceCampaign += this.campaign[index]['budgetAmount'];
          this.dataSource = new MatTableDataSource<any>(this.campaign);
        }
      });

    }

  }

  saveReleaseOrder() {
    this.createReleaseOrder = new createOrderDetails(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null)
    this.createReleaseOrder.roNumber = this.orderEntryForm.controls['roNumber'].value
    this.createReleaseOrder.billingTypeId = this.orderEntryForm.controls['billingTypeId'].value;
    this.createReleaseOrder.budgetAmount = this.orderEntryForm.controls['Budget'].value;
    this.createReleaseOrder.employeeId = this.orderEntryForm.controls['employeeId'].value;
    this.createReleaseOrder.clientTypeId = this.orderEntryForm.controls['clientTypeId'].value;
    if (this.campaign.length) {
      for (let campaign of this.campaign) {
        const campaignData = {
          'name': campaign.name,
          'brandName': campaign.brandName,
          'budgetAmount': campaign.budgetAmount,
          'description': campaign.description,
          'campaignName': campaign.campaignName,
          'endDatetime': campaign.endDatetime,
          'remarks': campaign.remarks,
          'isActive': campaign.isActive,
          'startDatetime': campaign.startDatetime,
          'bookingUserId': campaign.bookingUserId,
        }
        this.campaignInfo.push(campaignData)
      }
    }
    this.createReleaseOrder.campaignDetails = this.campaignInfo;
    this.createReleaseOrder.clientId = this.orderEntryForm.controls['clientDetailId'].value;
    this.createReleaseOrder.agencyId = this.orderEntryForm.controls['agencyDetailId'].value;
    this.createReleaseOrder.entityAddressId = this.agentInfo;
    this.createReleaseOrder.dealTypeId = this.orderEntryForm.controls['dealTypelId'].value;
    this.createReleaseOrder.endDatetime = this.datepipe.transform(this.orderEntryForm.controls["endDatetime"].value, "yyyy-MM-dd HH:mm:ss");
    this.createReleaseOrder.startDatetime = this.datepipe.transform(this.orderEntryForm.controls["startDatetime"].value, "yyyy-MM-dd HH:mm:ss");
    this.createReleaseOrder.paymentTerms = this.orderEntryForm.controls['terms'].value;
    this.createReleaseOrder.roDate = this.orderEntryForm.controls['roDateId'].value;
    this.createReleaseOrder.notes = this.orderEntryForm.controls['notes'].value;
    this.createReleaseOrder.status = this.data.statusId;
    this.createReleaseOrder.pfWorkflows = [];
    this.commonService.saveReleaseOrderEntry(this.createReleaseOrder).subscribe(res => {
      if (res.statusCode === 1) {
        this.nextTab(1)
        this.getCampaign(res.results.id, false);
        this.roId = res.results.id;
        this.campaignDate = res.results.startDatetime;
        this.endTime = res.results.endDatetime;
        this.balanceCampaign = res.results.budgetAmount;
        this.campaignForm.get('fromDate').setValue(this.campaignDate);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateReleaseOrder(type) {
    let approvalStatus: any;
    let close = false;
    if (type === 'approve') {
      close = true;
      if (this.data.statusId === 'ROS-CR') {
        approvalStatus = 'ROS-SM'
      } else if (this.data.statusId === 'ROS-SM') {
        approvalStatus = 'ROS-AC'
      } else if(this.data.statusId === 'ROS-SL'){
        approvalStatus = 'ROS-AC'
      } else if(this.data.statusId === 'ROS-VP'){
        approvalStatus = 'ROS-AC'
      } else if (this.data.statusId === 'ROS-AC') {
        approvalStatus = 'ROS-SH'
      }
    } else if (type === 'reject') {
      close = true;
      if (this.data.statusId) {
        approvalStatus = 'ROS-CR'
      }
    } else {
      close = false;
      approvalStatus = 'ROS-CR'
    }
    this.editOrderDetails(approvalStatus);
  }

  editOrderDetails(approvalStatus){
    this.editReleaseOrder = new editOrderDetails(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null)
    this.editReleaseOrder.roNumber = this.orderEntryForm.controls['roNumber'].value
    this.editReleaseOrder.clientTypeId = this.orderEntryForm.controls['clientTypeId'].value;
    this.editReleaseOrder.billingTypeId = this.orderEntryForm.controls['billingTypeId'].value;
    this.editReleaseOrder.budgetAmount = this.orderEntryForm.controls['Budget'].value;
    if (this.kynUserEnabled) {
      this.editReleaseOrder.employeeId = this.orderEntryForm.controls['employeeId'].value;
    } else {
      this.editReleaseOrder.employeeId = this.data.advData.employeeId;
    }
    if (this.clientEnabled) {
      this.editReleaseOrder.clientId = this.orderEntryForm.controls['clientDetailId'].value;
    } else {
      this.editReleaseOrder.clientId = this.data.advData.clientId;
    }
    if (this.agentEnabled) {
      this.editReleaseOrder.agencyId = this.orderEntryForm.controls['agencyDetailId'].value;
    } else {
      this.editReleaseOrder.agencyId = this.data.advData.agencyId;
    }

    for (let campaign of this.campaign) {
      if (campaign.id != null || campaign.isActive) {
        const campaignData = {
          'id': campaign.id,
          'name': campaign.name,
          'brandName': campaign.brandName,
          'budgetAmount': campaign.budgetAmount,
          'description': campaign.description,
          'campaignName': campaign.campaignName,
          'endDatetime': campaign.endDatetime,
          'remarks': campaign.remarks,
          'isActive': campaign.isActive,
          'startDatetime': campaign.startDatetime,
          'bookingUserId': campaign.bookingUserId,
          'releaseOrderId': campaign.releaseOrderId
        }
        this.campaignInfo.push(campaignData);
      }
    }
    this.editReleaseOrder.campaignDetails = this.campaignInfo;
    if(this.agentInfo !== null){
      this.editReleaseOrder.entityAddressId = this.agentInfo;
    } else {
      this.editReleaseOrder.entityAddressId = this.data.advData.entityAddressId;
    }
    this.editReleaseOrder.dealTypeId = this.orderEntryForm.controls['dealTypelId'].value;
    this.editReleaseOrder.endDatetime = this.datepipe.transform(this.orderEntryForm.controls["endDatetime"].value, "yyyy-MM-dd HH:mm:ss");
    this.editReleaseOrder.startDatetime = this.datepipe.transform(this.orderEntryForm.controls["startDatetime"].value, "yyyy-MM-dd HH:mm:ss");
    this.editReleaseOrder.paymentTerms = this.orderEntryForm.controls['terms'].value;
    this.editReleaseOrder.roDate = this.orderEntryForm.controls['roDateId'].value;
    this.editReleaseOrder.notes = this.orderEntryForm.controls['notes'].value;
    this.editReleaseOrder.status = approvalStatus;
    let pfWorkflows = this.matrixForm.controls['userList'].value;
    pfWorkflows.forEach(item => {
      if (item['identifyingId'] && typeof item['recipientName'] === 'string') {
        item['identifyingId'] = item['identifyingId'];
      } else {
        item['identifyingId'] = item['recipientName'];
      }
      item['identifyingType'] = item['recipientType'];
      item['workflowLevelId'] = String(item['level']);
      item['entityType'] = "release_order";
      item['roleName'] = null;
      item['isActive'] = item['isActive'];
      item['userName'] = null;
    })
    pfWorkflows = pfWorkflows.filter(res => res.identifyingId !== null);
    this.editReleaseOrder.pfWorkflows = pfWorkflows;
    this.commonService.updateOrderEntry(this.roId, this.editReleaseOrder).subscribe(res => {
      if (res.statusCode === 1) {
        this.getCampaign(this.roId, null);
      }
      if(close){
        this.thisDialogRef.close('confirm');
      }
      this.toastr.success('Success', `${res.message}`);
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  clear() {
    this.campaignForm.reset()
  }

  manageActivity(data) {
    const dialogRef = this.dialog.open(CreateAdvActivityComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => { });
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-advertisement',
  templateUrl: './create-adv-activity.component.html',
  styleUrls: ['./advertisement.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: NGX_MAT_DATE_FORMATS, useValue: NGX_DATE_FORMAT },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMAT }
  ],
})

export class CreateAdvActivityComponent implements OnInit {

  activityForm: FormGroup;
  public ACTdataSource: MatTableDataSource<any>;
  public ActivityInfo: any = [];
  public base64Data_global: string;
  activityDisplayColumn: string[] = ['activityType', 'adtype', 'deliveryType', 'impression', 'selectScreen', 'from Date', 'to Date', 'Status', 'Select'];
  isDeliverablesExp = false;
  isTargetingExp = false;
  activityData: any = [];
  languageList: any = [];
  genderList: any = [];
  adTypeList: any = [];
  placementScreen: any = [];
  adSlotsList: any = [];
  cityList: any = [];
  timeTargeting: any = [];
  interestTypes: any = [];
  deliveryType: any = [];
  AreaCode: any = [];
  specifications: any = [];
  activityTypeList: any = [];
  ageGroup: any = [];
  imageData = {};
  fileType: any;
  atchData = null;
  deliveryTypeName: any;
  isActivityEdit = false;
  imageInfo: any = [];
  roActivity = false
  adTypeName: any;
  errorMsg: string;
  err = false;
  noOfDays: any;
  cost = 0;
  divided: number;
  budgetEqual = null;
  notEqualmsg: string;
  activityTypeName: any;
  startDateTime: any;
  endDateTime: any;


  constructor(public fb: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateAdvActivityComponent>, protected sanitizer: DomSanitizer,
    public datepipe: DatePipe, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService) {
    this.startDateTime = this.datepipe.transform(this.data.startDatetime, 'yyyy-MM-dd 00:00:00');
    this.endDateTime = this.datepipe.transform(this.data.endDatetime, 'yyyy-MM-dd 23:59:59');
  }


  ngOnInit() {
    this.buildForm();
    this.commonService.getAppTerms("Gender,AdType,AdSlots,TimeTargeting,Language,InterestType,DeliveryType,AreaCode,CreativeSpecifications,RoActivityType,AgeGroup").subscribe((res) => {
      this.genderList = res.results.filter(resFilter => resFilter.groupName === 'Gender');
      this.adTypeList = res.results.filter(resFilter => resFilter.groupName === 'AdType');
      this.timeTargeting = res.results.filter(resFilter => resFilter.groupName === 'TimeTargeting');
      this.languageList = res.results.filter(resFilter => resFilter.groupName === 'Language');
      this.interestTypes = res.results.filter(resFilter => resFilter.groupName === 'InterestType');
      this.deliveryType = res.results.filter(resFilter => resFilter.groupName === 'DeliveryType');
      this.AreaCode = res.results.filter(resFilter => resFilter.groupName === 'AreaCode');
      this.activityTypeList = res.results.filter(resFilter => resFilter.groupName === 'RoActivityType');
      this.ageGroup = res.results.filter(resFilter => resFilter.groupName === 'AgeGroup');
    });
    this.commonService.getAppTerms("City").subscribe((res) => {
      this.cityList = res.results.filter(resFilter => resFilter.groupName === 'City');
    });
    this.getActivity(this.data.id)
  }

  public buildForm() {
    this.activityForm = this.fb.group({
      deliverableId: [null],
      roActiveId: [null],
      tragetingId: [null],
      activityTypeId: [null, [Validators.required]],
      startDatetime: [this.data.startDatetime ? this.data.startDatetime : this.startDateTime, [Validators.required]],
      endDatetime: [this.data.endDatetime ? this.data.endDatetime : this.endDateTime, [Validators.required]],
      adTypeId: [null, [Validators.required]],
      placementScreenId: [null, [Validators.required]],
      creativeSpecification: [null, [Validators.required]],
      adSlots: [null, [Validators.required]],
      geoTargetingId: [null, [Validators.required]],
      areaCode: [null, [Validators.required]],
      timeTargeting: [null, [Validators.required]],
      age: [null, [Validators.required]],
      gender: [null, [Validators.required]],
      interestTypeId: [null, [Validators.required]],
      language: [null, [Validators.required]],
      deliveryTypeId: [null, [Validators.required]],
      rate: [null, [Validators.required]],
      totalImpression: [null, [Validators.required]],
      clicks: [null, [Validators.required]],
      installations: [null, [Validators.required]],
      leads: [null, [Validators.required]],
      reach: [null, [Validators.required]],
      crt: [null, [Validators.required]],
      freqCap: [null, [Validators.required]]
    })
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  adtype(event) {
    this.adTypeName = event;
  }

  activeType(event) {
    this.activityTypeName = event;
  }

  getSelectedScreen(code) {
    if (code !== 'AD-ART') {
      this.commonService.getAppTermsLink(code).subscribe((res) => {
        this.placementScreen = res.results.filter(resFilter => resFilter.groupName === 'PlacementScreen');
        this.specifications = res.results.filter(resFilter => resFilter.groupName === 'CreativeSpecifications');
      });
    } else {
      this.commonService.getAppTermsLink(code).subscribe((res) => {
        this.placementScreen = res.results.filter(resFilter => resFilter.groupName === 'PlacementScreen');
        this.specifications = [];
      });
    }
  }

  getSpecificationsList(code) {
    if (this.activityForm.controls['adTypeId'].value === 'AD-ART') {
      this.commonService.getAppTermsLink(code).subscribe((res) => {
        if (res.statusCode == 1) {
          this.specifications = res.results.filter(resFilter => resFilter.groupName === 'CreativeSpecifications');
        }
      });
    }
  }

  getAdSlotsList(code) {
    this.commonService.getAppTermsLink(code).subscribe((res) => {
      if (res.results !== null) {
        this.adSlotsList = res.results.filter(resFilter => resFilter.groupName === 'AdSlots');
      } else {
        this.adSlotsList = []
      }
    });
  }

  uploadImage($event): void {
    const files = $event.target.files;
    const allowed_types = ['image/png', 'image/jpeg'];
    if (!allowed_types.includes($event.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (let fileList of files) {
      const file = fileList;
      if (files && file) {
        this.fileType = file.type;
        const reader = new FileReader();

        reader.onload = (function (f) {
          return function (readerEvt) {
            const arrayBuffer = readerEvt.target.result as ArrayBuffer;

          // Convert ArrayBuffer to binary string
          const binaryString = Array.from(new Uint8Array(arrayBuffer))
            .map(byte => String.fromCharCode(byte))
            .join('');

            this.base64Data_global = btoa(binaryString);

            this.isFileSelected = true;

            if (f.type.includes('image')) {
              const url = this.safeUrl('data:image/png;base64,' + this.base64Data_global);
              this.image = {
                file: url,
                mimeType: f.type
              }
            }
            if (file.size < 2 * 1000000) {
              this.atchData = this.image
              this.uploadedImg(this.atchData)
            } else {
              this.atchData = null;
              this.toastr.warningToastr('Warning', `Upload image file should be less that 2MB`, { animate: 'slideFromRight', showCloseButton: true });
            }
            this.isAddUpload = true;
          };
        })(file).bind(this);
        reader.readAsArrayBuffer(file);
      }
    }
  }

  uploadedImg(data) {
    this.imageInfo.push(data);
  }

  imgDelete(data) {
    const index: number = this.imageInfo.indexOf(data);
    if (index !== -1) {
      this.imageInfo.splice(index, 1);
    }
  }

  getActivity(id) {
    this.commonService.getAllActivity(id).subscribe(res => {
      this.activityData = res.results;
      let savedData = res.results;
      if (savedData.length) {
        this.roActivity = true
      } else {
        this.roActivity = false
      }
      this.ACTdataSource = new MatTableDataSource<any>(this.activityData);
    });
  }

  getDeliveryTypeName(event) {
    this.deliveryTypeName = event.value;
    let deliveryTypeCode = event.code
    let startDate = this.datepipe.transform(this.activityForm.controls['startDatetime'].value, 'yyyy-MM-dd');
    let endDate = this.datepipe.transform(this.activityForm.controls['endDatetime'].value, 'yyyy-MM-dd');
    this.cost = null;
    if (deliveryTypeCode === 'DEL-CPD') {
      if (startDate !== null && endDate !== null) {
        this.err = false
        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);
        let time = toDate.getTime() - fromDate.getTime();
        let Days = time / (1000 * 3600 * 24);
        this.noOfDays = Days
      } else {
        this.err = true
        this.activityForm.controls['deliveryTypeId'].setValue(null);
        this.errorMsg = "Kindly check the activity startDate & endDate";
      }
    } else if (deliveryTypeCode === 'DEL-CPM') {
      this.divided = 1000
    }
    this.sumOfCalculate();
  }

  sumOfCalculate() {
    let rates = this.activityForm.controls['rate'].value
    if (this.activityForm.controls['deliveryTypeId'].value === 'DEL-CPD') {
      this.cost = this.noOfDays * rates;
    } else if (this.activityForm.controls['deliveryTypeId'].value === 'DEL-CPM') {
      const cpmValue = rates / this.divided;
      let impressionsValue = this.activityForm.controls['totalImpression'].value;
      this.cost = impressionsValue * cpmValue;
    } else if (this.activityForm.controls['deliveryTypeId'].value === 'DEL-CPC') {
      let clicksValue = this.activityForm.controls['clicks'].value;
      this.cost = rates * clicksValue;
    } else if (this.activityForm.controls['deliveryTypeId'].value === 'DEL-CPI') {
      let installValue = this.activityForm.controls['installations'].value;
      this.cost = rates * installValue;
    } else if (this.activityForm.controls['deliveryTypeId'].value === 'DEL-CPL') {
      let leadsValue = this.activityForm.controls['leads'].value;
      this.cost = rates * leadsValue;
    }
    if (this.data.budgetAmount === this.cost) {
      this.budgetEqual = true;
      this.notEqualmsg = 'Campaign Budget matched'
    } else {
      this.budgetEqual = false;
      this.notEqualmsg = 'Campaign Budget is not equal to Total cost'
    }
  }

  addActivity() {
    this.isActivityEdit = false;
    const targetingInfo = {
      'languages': this.activityForm.controls['language'].value,
      'geoTargeting': this.activityForm.controls['geoTargetingId'].value,
      'areaCodes': this.activityForm.controls['areaCode'].value,
      'timeTargets': this.activityForm.controls['timeTargeting'].value,
      'ageGroups': this.activityForm.controls['age'].value,
      'genders': this.activityForm.controls['gender'].value,
      'interestTypes': this.activityForm.controls['interestTypeId'].value,
      // 'adSlots': this.activityForm.controls['adSlots'].value,
    }
    const Datas = {
      'activityTargeting': [
        {
          'id': this.activityForm.controls['tragetingId'].value,
          'ageGroups': targetingInfo['ageGroups'] && targetingInfo['ageGroups'].length > 0 ? targetingInfo['ageGroups'].join(',') : targetingInfo['ageGroups'],
          'areaCodes': targetingInfo['areaCodes'] && targetingInfo['areaCodes'].length > 0 ? targetingInfo['areaCodes'].join(',') : targetingInfo['areaCodes'],
          'genders': targetingInfo['genders'] && targetingInfo['genders'].length > 0 ? targetingInfo['genders'].join(',') : targetingInfo['genders'],
          'geoTargeting': targetingInfo['geoTargeting'] && targetingInfo['geoTargeting'].length > 0 ? targetingInfo['geoTargeting'].join(',') : targetingInfo['geoTargeting'],
          'interestTypes': targetingInfo['interestTypes'] && targetingInfo['interestTypes'].length > 0 ? targetingInfo['interestTypes'].join(',') : targetingInfo['interestTypes'],
          'languages': targetingInfo['languages'] && targetingInfo['languages'].length > 0 ? targetingInfo['languages'].join(',') : targetingInfo['languages'],
          'timeTargets': targetingInfo['timeTargets'] && targetingInfo['timeTargets'].length > 0 ? targetingInfo['timeTargets'].join(',') : targetingInfo['timeTargets'],
          'isActive': true,
        }
      ],
      'activityTypeId': this.activityForm.controls['activityTypeId'].value,
      'activityTypeName': this.activityTypeName,
      // 'adSlots': targetingInfo['adSlots'] && targetingInfo['adSlots'].length > 0 ? targetingInfo['adSlots'].join(',') : targetingInfo['adSlots'],
      'adSlots':  this.activityForm.controls['adSlots'].value,
      'adTypeId': this.activityForm.controls['adTypeId'].value,
      'adTypeName': this.adTypeName,
      'campaignDetailId': this.data.id,
      'creativeSpecification': this.activityForm.controls['creativeSpecification'].value,
      'deliverable': {
        'id': this.activityForm.controls['deliverableId'].value,
        'clicks': this.activityForm.controls['clicks'].value,
        'installations': this.activityForm.controls['installations'].value,
        'leads': this.activityForm.controls['leads'].value,
        'crt': this.activityForm.controls['crt'].value,
        'deliveryTypeId': this.activityForm.controls['deliveryTypeId'].value,
        'freqCap': this.activityForm.controls['freqCap'].value,
        'rate': this.activityForm.controls['rate'].value,
        'reach': this.activityForm.controls['reach'].value,
        'isActive': true,
        'totalImpression': this.activityForm.controls['totalImpression'].value,
      },
      'id': this.activityForm.controls['roActiveId'].value,
      'endDatetime': this.datepipe.transform(this.activityForm.controls['endDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
      'isActive': true,
      'placementScreenId': this.activityForm.controls['placementScreenId'].value,
      'startDatetime': this.datepipe.transform(this.activityForm.controls['startDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
    };
    this.activityData.push(Datas);
    this.cost = 0;
    this.ACTdataSource = new MatTableDataSource<any>(this.activityData);
    this.activityForm.reset();
  }

  editActivity(data) {
    this.isActivityEdit = true;
    this.isDeliverablesExp = true;
    this.isTargetingExp = true;
    if (data.adTypeId) {
      this.getSelectedScreen(data.adTypeId);
      this.getSpecificationsList(data.placementScreenId);
      this.getAdSlotsList(this.data.creativeSpecification)
    }
    this.activityForm.patchValue({
      'endDatetime': data.endDatetime,
      'placementScreenId': data.placementScreenId,
      'startDatetime': data.startDatetime,
      'activityTypeId': data.activityTypeId,
      'adSlots': data.adSlots,
      'adTypeId': data.adTypeId,
      'creativeSpecification': data.creativeSpecification,
      'roActiveId': data.id,
      'clicks': data.deliverable.clicks,
      'installations': data.deliverable.installations,
      'leads': data.deliverable.leads,
      'crt': data.deliverable.crt,
      'deliveryTypeId': data.deliverable.deliveryTypeId,
      'freqCap': data.deliverable.freqCap,
      'rate': data.deliverable.rate,
      'reach': data.deliverable.reach,
      'isActive': data.deliverable.isActive,
      'totalImpression': data.deliverable.totalImpression,
      'deliverableId': data.deliverable.id,
      'tragetingId': data.activityTargeting[0].id,
      'age': data.activityTargeting[0].ageGroups !== null? data.activityTargeting[0].ageGroups.split(",") : data.activityTargeting[0].ageGroups,
      'areaCode': data.activityTargeting[0].areaCodes !== null?  data.activityTargeting[0].areaCodes.split(",") :  data.activityTargeting[0].areaCodes,
      'gender': data.activityTargeting[0].genders !== null? data.activityTargeting[0].genders.split(",") : data.activityTargeting[0].genders,
      'geoTargetingId': data.activityTargeting[0].geoTargeting? data.activityTargeting[0].geoTargeting.split(",") : data.activityTargeting[0].geoTargeting,
      'interestTypeId': data.activityTargeting[0].interestTypes? data.activityTargeting[0].interestTypes.split(",") : data.activityTargeting[0].interestTypes,
      'language': data.activityTargeting[0].languages? data.activityTargeting[0].languages.split(",") : data.activityTargeting[0].languages,
      'timeTargeting': data.activityTargeting[0].timeTargets? data.activityTargeting[0].timeTargets.split(",") : data.activityTargeting[0].timeTargets,
    });
    this.activityTypeName = data.activityTypeName;
    this.deliveryTypeName = data.deliveryTypeName;
    this.adTypeName = data.adTypeName;
    const id = this.activityForm.controls['adTypeId'].value;
    this.activityData = this.activityData.filter(x => x.adTypeId !== id);
  }

  deleteActivity(data) {
    const index: number = this.activityData.indexOf(data);
    if (index !== -1) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px', height: '180px', panelClass: 'pop-up-margin',
        data: {
          title: 'Confirmation',
          message: 'Do you want to delete the activity?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'Yes') {
          this.activityData[index]['isActive'] = false;
          this.activityData[index]['activityTargeting'][0]['isActive'] = false;
          this.activityData[index]['deliverable']['isActive'] = false;
          this.ACTdataSource = new MatTableDataSource<any>(this.activityData);
        }
      });
    }
  }

  saveActivity() {
    this.activityData.forEach((activityData) => {
        const targeting = activityData.activityTargeting[0];

        const activityDatas = {
          activityTargeting: [
            {
              ageGroups: targeting.ageGroups || null,
              areaCodes: targeting.areaCodes || null,
              genders: targeting.genders || null,
              geoTargeting: targeting.geoTargeting || null,
              interestTypes: targeting.interestTypes || null,
              languages: targeting.languages || null,
              timeTargets: targeting.timeTargets || null,
              isActive: targeting.isActive || true,
            },
          ],
          activityTypeId: activityData.activityTypeId || null,
          adSlots: activityData.adSlots || null,
          adTypeId: activityData.adTypeId || null,
          campaignDetailId: activityData.campaignDetailId || null,
          creativeSpecification: activityData.creativeSpecification || null,
          deliverable: {
            clicks: activityData.deliverable.clicks || null,
            installations: activityData.deliverable.installations || null,
            leads: activityData.deliverable.leads || null,
            crt: activityData.deliverable.crt || null,
            deliveryTypeId: activityData.deliverable.deliveryTypeId || null,
            freqCap: activityData.deliverable.freqCap || null,
            rate: activityData.deliverable.rate || null,
            reach: activityData.deliverable.reach || null,
            isActive: activityData.deliverable.isActive || true,
            totalImpression: activityData.deliverable.totalImpression || null,
          },
          endDatetime: activityData.endDatetime || null,
          isActive: activityData.isActive || true,
          placementScreenId: activityData.placementScreenId || null,
          startDatetime: activityData.startDatetime || null,
        };

        this.ActivityInfo.push(activityDatas);
    });
    this.commonService.saveRoActivtiy(this.data.id, this.ActivityInfo).subscribe(res => {
      if (res.statusCode === 1) {
        this.getActivity(this.data.id);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  UpdateActivity() {
    this.activityData.forEach((activityData) => {
      const targeting = activityData.activityTargeting[0];

        const activityDatas = {
          activityTargeting: [
            {
              id: targeting.id || null,
              ageGroups: targeting.ageGroups || null,
              areaCodes: targeting.areaCodes || null,
              genders: targeting.genders || null,
              geoTargeting: targeting.geoTargeting || null,
              interestTypes: targeting.interestTypes || null,
              languages: targeting.languages || null,
              timeTargets: targeting.timeTargets || null,
              isActive: targeting.isActive,
            },
          ],
          activityTypeId: activityData.activityTypeId || null,
          adSlots: activityData.adSlots || null,
          adTypeId: activityData.adTypeId || null,
          campaignDetailId: activityData.campaignDetailId || null,
          creativeSpecification: activityData.creativeSpecification || null,
          deliverable: {
            id: activityData.deliverable.id || null,
            clicks: activityData.deliverable.clicks || null,
            installations: activityData.deliverable.installations || null,
            leads: activityData.deliverable.leads || null,
            crt: activityData.deliverable.crt || null,
            deliveryTypeId: activityData.deliverable.deliveryTypeId || null,
            freqCap: activityData.deliverable.freqCap || null,
            rate: activityData.deliverable.rate || null,
            reach: activityData.deliverable.reach || null,
            isActive: activityData.deliverable.isActive,
            totalImpression: activityData.deliverable.totalImpression || null,
          },
          id: activityData.id || null,
          endDatetime: activityData.endDatetime || null,
          isActive: activityData.isActive,
          placementScreenId: activityData.placementScreenId || null,
          startDatetime: activityData.startDatetime || null,
        };

        this.ActivityInfo.push(activityDatas);
    });
    this.commonService.updateRoActivtiy(this.data.id, this.ActivityInfo).subscribe(res => {
      if (res.statusCode === 1) {
        this.getActivity(this.data.id);
      }
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  reset() {
    this.activityForm.reset()
    this.atchData = null;
    this.isActivityEdit = false;
    this.cost = 0;
  }

}

@Pipe({
  name: 'rupees',
  pure: true
})
export class RupeesPipe implements PipeTransform {
  transform(value: number): string {
    const units: string[] = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens: string[] = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens: string[] = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    const convertThreeDigitNumber = (num: number): string => {
      let result = '';

      const hundreds = Math.floor(num / 100);
      const tensAndUnits = num % 100;

      if (hundreds > 0) {
        result += `${units[hundreds]} hundred `;
      }

      if (tensAndUnits > 0) {
        if (tensAndUnits < 10) {
          result += units[tensAndUnits];
        } else if (tensAndUnits >= 10 && tensAndUnits < 20) {
          result += teens[tensAndUnits - 10];
        } else {
          const tensDigit = Math.floor(tensAndUnits / 10);
          const unitsDigit = tensAndUnits % 10;
          result += `${tens[tensDigit]} ${units[unitsDigit]}`;
        }
      }

      return result.trim();
    };

    const convertNumberToWords = (num: number): string => {
      if (num === 0) {
        return 'zero';
      }

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const remainder = num % 1000;
      let result = '';

      if (crore > 0) {
        result += `${convertThreeDigitNumber(crore)} crore `;
      }

      if (lakh > 0) {
        result += `${convertThreeDigitNumber(lakh)} lakh `;
      }

      if (thousand > 0) {
        result += `${convertThreeDigitNumber(thousand)} thousand `;
      }

      if (remainder > 0) {
        result += convertThreeDigitNumber(remainder);
      }

      return result.trim();
    };

    return convertNumberToWords(value);
  }
  fixClick() {
    console.log('')
  }  
}
