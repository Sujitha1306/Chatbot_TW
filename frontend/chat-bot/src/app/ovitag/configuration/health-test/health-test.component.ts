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
import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatDialog,MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators} from '@angular/forms';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService } from '../../../shared';
import { CreateHealthTestRule, CreateHealthTest, EditHealthTest } from '../configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';
/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/

@Component({
  selector: 'app-health-test',
  templateUrl: './health-test.component.html',
  styleUrls: ['./health-test.component.scss'],
  animations: [routerTransition()],
})
export class HealthTestComponent implements OnInit {

  displayedColumns: string[] = ['Test ID', 'Test Name', 'Group Name', 'Test Type', 'Status', 'Rule'];
  iconHeader = [];
  iconColumn = ['Rule'];
  sortColumn = [];
  eventColumn = ['Test Name'];
  permissionControl = ['BT_ALLE'];
  public selectedRow: any;
  public rowData: any = [];
  public health_plan: any = [];
  public pkgId = 0;
  pkgForm: FormGroup;
  public health_test_count = 0;
  public activate_btn: any = [];
  public applyFilterValue: any = '';
  public pageStart = 0;
  public pageSize: any;
  public length = 0;
  tableData: any = [];
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  filterValue = null;
  public parentFilter = [
    {
      id: 'healthTestOption',
      value: 'Health TestOption',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: '', value: 'ALL' },{ code: 'health_test', value: 'Health test' }, { code: 'health_test_group', value: 'Health test Group' }],
      defaultSelected: ['']
    },
    {
      id: 'IgnoreAdmin',
      value: 'Ignore Admin',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: '', value: 'ALL' },{ code: 'true', value: 'True' }, { code: 'false', value: 'False' }],
      defaultSelected: ['']
    }
  ];
  healthTestOption: any;
  isIgnoreAdmin: any;


  constructor(private readonly configurationService: ConfigurationService, public dialog: MatDialog,
    public commonService: CommonService, public router: Router, private readonly route: ActivatedRoute) {
      this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.healthTests.results;
    this.length = this.route.snapshot.data.healthTests.totalRecords;
    this.pageStart = this.route.snapshot.data.healthTests.pageStart;
    this.pageSize = this.route.snapshot.data.healthTests.pageSize;
    this.tableData = this.tableData.filter(val => val.isActive)
    for (let m in this.tableData) {
      if (this.tableData[m]['testType'] === 'health_test') {
        this.tableData[m]['testTypeName'] = 'Test';
      } else {
        this.tableData[m]['testTypeName'] = 'Group';
      }
      if (this.tableData[m]['isActive'] === true) {
        this.tableData[m]['isActive'] = 'Active';
      } else {
        this.tableData[m]['isActive'] = 'Inactive';
      }
    }
    const Columns = ['id', 'name', 'groupName', 'testTypeName', 'isActive', 'rule'];
    for (let i in Columns) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
  }

  rowClick(data) {
    this.selectedRow = data.id;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    this.getAllHeathTest(false);
  }
  eventAction(event) {
    if(event.key == 'Rule') {
      this.editRule(event.data);
    }
    if(event.key == 'Test Name'){
      this.createHealthTest(event.data);
    }
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllHeathTest(false)
    }
  }
  editRule(rowData: any) {
    this.rowData = rowData;
    this.selectedRow = rowData.id;
    const dialogRef = this.dialog.open(HealthTestRuleComponent,
    {  data: rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.getAllHeathTest(false);
      }
    });
  }

  getAllHeathTest(routerEvent ?: boolean) {
    this.configurationService.getAllHeathTest(this.applyFilterValue, this.pageStart, this.pageSize, this.healthTestOption, this.isIgnoreAdmin).subscribe(res => {
      for (let m in res.results) {
        if (res.results[m]['testType'] === 'health_test') {
          res.results[m]['testTypeName'] = 'Test';
        } else {
          res.results[m]['testTypeName'] = 'Group';
        }
        if (res.results[m]['isActive'] === true) {
          res.results[m]['isActive'] = 'Active';
        } else {
          res.results[m]['isActive'] = 'Inactive';
        }
      }
      this.tableData = res.results;
      this.tableData = this.tableData.filter(val => val.isActive)
      this.length = res.totalRecords;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + '';
      }
      const Columns = ['id', 'name', 'groupName', 'testTypeName', 'isActive', 'rule'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'create') {
      this. createHealthTest('');
    } else if (event.key === 'groupFilter'){
      const healthTestOptionData = event.data.find(res => res.id === 'healthTestOption')?.data ?? null;
      const isIgnoreAdminData = event.data.find(res => res.id === 'IgnoreAdmin')?.data ?? null;
      this.healthTestOption = healthTestOptionData;
      this.isIgnoreAdmin = isIgnoreAdminData;
      this.getAllHeathTest(false);
    } else {
      this.selectedName = null;
      this.applyFilterValue = '';
      this.refreshPage();
    }
  }
  createHealthTest(data){
    this.showActions = null
    const dialogRef = this.dialog.open(CreateHealthTestComponent,
      { data: data, panelClass: ['small-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = '';
    }
    this.getAllHeathTest();
  }
}

@Component({
  selector: 'app-health-test-rule',
  templateUrl: './health-test-rule.component.html',
  styleUrls: ['./health-test.component.scss'],
})
export class HealthTestRuleComponent implements OnInit {

  public testRuleForm: FormGroup;
  public createHealthTestRule: CreateHealthTestRule;
  public isDisabled = false;
  public genderList: any[] = null;
  public healthTestRuleType: any[] = null;
  public booleanValue: any[] = null;
  public predecessorType: any[] = null;
  public diabeticType: any[] = null;
  public healthTestDetails: any[] = null;
  public checkedRowData: any;
  public selectedRow = '';
  public isGroupRule = false;
  public isDelete = false;
  public healthTestRulesById: any;
  public selectedRowItem: any;


  public matcher = new ErrorStateMatcherService();
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: MatTableDataSource<any>;

  displayedColumns: string[] = ['test', 'predecessor', 'duration', 'gender', 'diabetic', 'rules', 'select'];
  ruleGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public dialog: MatDialog, private readonly configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<HealthTestRuleComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService, private readonly lookupService: LookupTermService) {
  }

  ngOnInit() {
    this.buildForm();

    this.lookupService.getAppTermsWrapper('Gender').subscribe(res => {
      this.genderList  = res.Gender ?? [];
    });

    this.lookupService.getAppTermsWrapper('HealthTestOption').subscribe(res => {
      this.healthTestRuleType  = res.HealthTestOption ?? [];
    });


    this.lookupService.getAppTermsWrapper('Boolean').subscribe(res => {
      this.predecessorType  = res.Boolean ?? [];
      this.diabeticType  = res.Boolean ?? [];
      for (let i in this.predecessorType) {
        if (this.predecessorType[i]['value'] === 'Yes') {
          this.predecessorType[i]['name'] = 'Before';
        } else {
          this.predecessorType[i]['name'] = 'After';
        }
      }
    });

    this.configurationService.getAllHealthTestOrGroup('health_test_group').subscribe(res => {
      this.healthTestDetails = res.results;
    });

    this.getAllHealthTestRulesById(this.data.id, this.data.testType);
  }

  public buildForm() {
    this.testRuleForm = this.form.group({
      ruleGroup: [this.data.ruleGroup ? this.data.ruleGroup : null, [Validators.required]],
      ruleTestTypeId: [this.data.ruleTestTypeId ? this.data.ruleTestTypeId : 'health_test_group'],
      testId: [this.data.id ? this.data.id : null, [Validators.required]],
      ruleTestId: [this.data.ruleTestId ? this.data.ruleTestId : null, [Validators.required]],
      isBefore: [this.data.isBefore ? this.data.isBefore : null, [Validators.required]],
      duration: [this.data.duration ? this.data.duration : null],
      gender: [this.data.gender ? this.data.gender : null],
      isDiabetic: [this.data.isDiabetic ? this.data.isDiabetic : null],
    });
  }

  onSelectedEvent(event, item) {

    this.selectedRowItem = item;

    for (let j in this.healthTestRulesById) {
      if (this.healthTestRulesById[j].id === item.id) {
        this.healthTestRulesById[j].checked = !this.healthTestRulesById[j].checked;
        if (this.healthTestRulesById[j].checked === true) {
          this.checkedRowData = this.healthTestRulesById[j];
          this.selectedRow = this.healthTestRulesById[j].isActive;
        } else {
          this.selectedRow = '';
        }
      } else {
        this.healthTestRulesById[j].checked = false;
      }
    }
    if (item.checked === true) {
      this.isGroupRule = true;
      this.isDelete = true;
    } else {
      this.isGroupRule = false;
      this.isDelete = false;
    }
    
  }

  chkTestType(value, type) {
    if (value === 'health_test' && (type === 'srcTestType' || type === 'desTestType')) {
      this.configurationService.getAllHealthTestOrGroup('health_test').subscribe(res => {
        this.healthTestDetails = res.results;
      });
    } else {
      this.configurationService.getAllHealthTestOrGroup('health_test_group').subscribe(res => {
        this.healthTestDetails = res.results;
      });
    }
  }

  getAllHealthTestRulesById(id, type) {
    this.configurationService.getAllHealthTestByRules(id, type).subscribe(res => {
      this.healthTestRulesById = res.results;

      for (let m in this.healthTestRulesById) {
        if (this.healthTestRulesById[m]['isDiabetic'] === true) {
          this.healthTestRulesById[m]['isDiabeticName'] = 'Yes';
        } else {
          this.healthTestRulesById[m]['isDiabeticName'] = 'No';
        }
        if (this.healthTestRulesById[m]['isBefore'] === true) {
          this.healthTestRulesById[m]['isBeforeName'] = 'Before';
        } else {
          this.healthTestRulesById[m]['isBeforeName'] = 'After';
        }
      }

      this.dataSource = new MatTableDataSource<any[]>(this.healthTestRulesById);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  deleteTestRule(selectedRowItem) {
    if (selectedRowItem) {
      this.configurationService.deleteHealthTestRules(selectedRowItem).subscribe(res => {
        this.getAllHealthTestRulesById(selectedRowItem.testId, selectedRowItem.testTypeId);
        this.isDelete = false;
      });
    }
  }

  public createTestRule() {
    
    this.createHealthTestRule = new CreateHealthTestRule(null, null, null, null, null, null, null, null, null, null);
    this.createHealthTestRule.ruleTestTypeId  = this.testRuleForm.controls['ruleTestTypeId'].value;
    this.createHealthTestRule.ruleTestId      = this.testRuleForm.controls['ruleTestId'].value;
    this.createHealthTestRule.isDiabetic      = this.testRuleForm.controls['isDiabetic'].value;
    this.createHealthTestRule.isBefore        = this.testRuleForm.controls['isBefore'].value;
    this.createHealthTestRule.duration        = this.testRuleForm.controls['duration'].value;
    this.createHealthTestRule.gender          = this.testRuleForm.controls['gender'].value;
    this.createHealthTestRule.ruleGroup       = this.testRuleForm.controls['ruleGroup'].value;
    this.createHealthTestRule.testId          = this.data.id;
    this.createHealthTestRule.testTypeId      = this.data.testType;

    

    this.configurationService.createHealthTestRules(this.createHealthTestRule).subscribe(res => {
      if (res.statusCode === 1) {
        this.getAllHealthTestRulesById(this.createHealthTestRule.testId, this.createHealthTestRule.testTypeId);
      }
      this.toastr.success('Success', `${res.message}`);
     
    },
      error => {
      
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.buildForm();
  }
  fixClick() {
    console.log('')
  }

}

@Component({
  selector: 'app-create-health-test',
  templateUrl: './create-health-test.component.html',
  styleUrls: ['./health-test.component.scss']
})
export class CreateHealthTestComponent implements OnInit{
  public createHealthTestForm: FormGroup;
  public createHealthTest: CreateHealthTest;
  public editHealthTest: EditHealthTest;
  healthPlanList: any=[];
  testCategoryList: any=[];

  constructor(public form: FormBuilder, public thisDialogRef: MatDialogRef<CreateHealthTestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService, public toastr: AppToastService,
    private readonly lookupService: LookupTermService){}
  ngOnInit(){
    if (this.data) {
      this.getHealthTests();
    }
    this.lookupService.getAppTermsWrapper('TestCategory,HealthPlanType').subscribe(res => {
      this.testCategoryList = res.TestCategory ?? [];
      this.healthPlanList = res.HealthPlanType ?? [];
    });
    this.buildForm();
  }
  getHealthTests() {
    this.configurationService.getHeathTests().subscribe(res => {
      const data = res.results.filter(res => res.id == this.data.id);
      this.data = data[0];
      this.buildForm();
    });
  }
  buildForm(){
    this.createHealthTestForm = this.form.group({
      name: [this.data.name ? this.data.name : null, [Validators.required]],
      shortName: [this.data.shortName ? this.data.shortName : null],
      planTypeId: [this.data.planTypeId ? this.data.planTypeId : null, [Validators.required]],
      testCategoryId: [this.data.testCategoryId ? this.data.testCategoryId : null, [Validators.required]],
      shortNotes: [this.data.shortNotes ? this.data.shortNotes : null],
      longNotes: [this.data.longNotes ? this.data.longNotes : null],
      minDuration: [this.data.minDuration ? this.data.minDuration : null, [Validators.maxLength(3),Validators.pattern('[0-9]*')]],
      maxwaitDuration: [this.data.maxwaitDuration ? this.data.maxwaitDuration : null, [Validators.maxLength(3),Validators.pattern('[0-9]*')]],
      sequence: [this.data.sequence ? this.data.sequence : null, [Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      priority: [this.data.priority ? this.data.priority : null, [Validators.pattern(/^-?(0|[1-9]\d{0,2})$/)]],
      isDiabetic: [this.data.isDiabetic ? this.data.isDiabetic : false]
    });
  }
  saveHealthTest(){
    this.createHealthTest = new CreateHealthTest(null, null, null, null, null, null, null, null, null, null, null);
    this.createHealthTest.name = this.createHealthTestForm.controls['name'].value;
    this.createHealthTest.shortName = this.createHealthTestForm.controls['shortName'].value;
    this.createHealthTest.planTypeId = this.createHealthTestForm.controls['planTypeId'].value;
    this.createHealthTest.testCategoryId =  this.createHealthTestForm.controls['testCategoryId'].value;
    this.createHealthTest.shortNotes = this.createHealthTestForm.controls['shortNotes'].value;
    this.createHealthTest.longNotes = this.createHealthTestForm.controls['longNotes'].value;
    this.createHealthTest.minDuration = parseInt(this.createHealthTestForm.controls['minDuration'].value);
    this.createHealthTest.maxwaitDuration = parseInt(this.createHealthTestForm.controls['maxwaitDuration'].value);
    this.createHealthTest.sequence = parseInt(this.createHealthTestForm.controls['sequence'].value);
    this.createHealthTest.priority = parseInt(this.createHealthTestForm.controls['priority'].value);
    this.createHealthTest.isDiabetic = this.createHealthTestForm.controls['isDiabetic'].value;
    this.configurationService.createHealthTest(this.createHealthTest).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);

      this.thisDialogRef.close('confirm');
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  updateHealthTest(){
    this.editHealthTest = new EditHealthTest(null, null, null, null, null, null, null, null, null, null, null, null);
    this.editHealthTest.id = this.data.id;
    this.editHealthTest.name = this.createHealthTestForm.controls['name'].value;
    this.editHealthTest.shortName = this.createHealthTestForm.controls['shortName'].value;
    this.editHealthTest.planTypeId = this.createHealthTestForm.controls['planTypeId'].value;
    this.editHealthTest.testCategoryId =  this.createHealthTestForm.controls['testCategoryId'].value;
    this.editHealthTest.shortNotes = this.createHealthTestForm.controls['shortNotes'].value;
    this.editHealthTest.longNotes = this.createHealthTestForm.controls['longNotes'].value;
    this.editHealthTest.minDuration = parseInt(this.createHealthTestForm.controls['minDuration'].value);
    this.editHealthTest.maxwaitDuration = parseInt(this.createHealthTestForm.controls['maxwaitDuration'].value);
    this.editHealthTest.sequence = parseInt(this.createHealthTestForm.controls['sequence'].value);
    this.editHealthTest.priority = parseInt(this.createHealthTestForm.controls['priority'].value);
    this.editHealthTest.isDiabetic = this.createHealthTestForm.controls['isDiabetic'].value;
    this.configurationService.updateHealthTest(this.editHealthTest).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
