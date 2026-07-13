
import {map,  debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { ConfigurationService, CommonService } from '../../../shared';
import { EditPackage, CreatePackage, NewEditPackage } from '../configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';

/*

Description : design the package level health checkup
Date        : Oct 20, 2019
Author      : TrackerWave
Developer   : UI Team

*/
@Component({
  selector: 'app-package',
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss'],
})
export class PackageComponent implements OnInit {

  displayedColumns: string[] = ['S.No', 'Plan Type', 'Package Name', 'Source ID', 'Gender', 'Description','Status'];
  public activate_btn: any = [];
  iconHeader = ['Gender'];
  iconColumn = ['S.No'];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  public selectedRow: any;
  public rowData: any = [];
  public health_plan: any = [];
  public pkgId = 0;
  pkgForm: FormGroup;
  public health_test_count = 0;
  public searchInput = null;
  tableData: any;
  applyFilterValue: string = null;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  filterValue: null;
  isLoading: boolean = false;
  healthPlanlist: any;
  healthPlanTest =  null;
  public pageStart = 0;
  public pageSize = 50;
  public length: number;
  public parentFilter = [
    {
      id: 'healthPlanType',
      value: 'Health PlanType',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    }];

  constructor(private readonly configurationService: ConfigurationService, public dialog: MatDialog,
    public commonService: CommonService, public router: Router, private readonly fb: FormBuilder, private readonly route: ActivatedRoute,
    private readonly lookupService: LookupTermService) {
      this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.isLoading = true;
    this.tableData = this.route.snapshot.data.packages.results;
    this.length = this.route.snapshot.data.packages.totalRecords;
    const Columns = ['S.No', 'planTypeName', 'name', 'sourceId', 'gender', 'description', 'Status']; 
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        if(Columns[i] == 'isActive') {
          data[Columns[i]] = data[Columns[i]] === true ?'Active' : 'Inactive';
        }
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
      this.isLoading = false;
    }
    this.lookupService.getAppTermsWrapper('HealthPlanType').subscribe(res => {
        this.healthPlanlist = res.HealthPlanType ?? [];
        const healthTypeFilter = this.parentFilter.find(filter => filter.id === 'healthPlanType');
        if (healthTypeFilter) {
          healthTypeFilter.subFilters = this.healthPlanlist.map(({ code, value }) => ({ code, value }));
          healthTypeFilter.defaultSelected = this.healthPlanlist.map(({ code }) => code);
      }
    });
    this.pkgForm = this.fb.group({
      healthPlanId: ['']
    });
  }

  rowClick(data) {
    this.selectedRow = data.id;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAllHealthPlan(false, this.applyFilterValue);
    } else {
      this.getAllHealthPlan(false, null);
    }
  }

  getAllHealthPlan(routeEvent ?: boolean, name?: string) {
    this.isLoading = true;
    const SearchName = (name ?? '').trim();
    let healthPlanTestIds = this.parentFilter?.find(filter => filter.id === 'healthPlanType')?.subFilters?.length  === this.healthPlanTest?.length  ? null : this.healthPlanTest;
    this.commonService.getPackageHealthPlan(healthPlanTestIds, SearchName, this.pageStart, this.pageSize).subscribe(res => {
      this.isLoading = false;
      this.tableData = res.results;
      this.length = res.totalRecords;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['S.No', 'planTypeName', 'name', 'sourceId', 'gender', 'description','Status'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          if(Columns[i] == 'isActive') {
            data[Columns[i]] = data[Columns[i]] === true ?'Active' : 'Inactive';
          }
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  onSelectAsset(pkgId) {
    this.pkgId = pkgId;
    if (pkgId) {
      this.getAllTestByPkgId(pkgId);
    }
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.healthPlanTest = null;
    this.parentFilter = [
      {
        id: 'healthPlanType',
        value: 'Health PlanType',
        isAll: true,
        selectionType: 'multi',
        subFilters: [],
        defaultSelected: []
      }];
    const healthRefreshFilter = this.parentFilter.find(filter => filter.id === 'healthPlanType');
    healthRefreshFilter.subFilters = this.healthPlanlist.map(({ code, value }) => ({ code, value }));
    healthRefreshFilter.defaultSelected = this.healthPlanlist.map(({ code }) => code);
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllHealthPlan();
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createPackage('');
    } else if (event.key === 'groupFilter') {
      this.healthPlanTest = event.data.map(x => x.data);
      this.getAllHealthPlan(null, this.applyFilterValue)
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if(event.key === 'pagination') {
        this.handlePagination(event);
    }
  }

  handlePagination(event) {
    this.pageSize = event.data.pageSize;
    this.pageStart = event.data.pageIndex;
    if(this.applyFilterValue?.length >3) {
      this.applyFilterValue = this.applyFilterValue.trim()?.toLowerCase();
    } else{
      this.applyFilterValue = null;
    }
    this.getAllHealthPlan(false,this.applyFilterValue);
  }

  createPackage(data) {
    this.showActions = null
    const dialogRef = this.dialog.open(CreatePackageComponent,
      { data: data, panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.searchInput = null;
      }
      this.refreshPage();
    });
  }
  editPackage(rowData: any) {
    this.rowData = rowData;
    this.selectedRow = rowData.id;
    const dialogRef = this.dialog.open(EditPackageComponent,
      {data: rowData, panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { 
        this.getAllTestByPkgId(rowData.healthPlanId);
      }
    });
  }

  getAllTestByPkgId(pkgId): void {
    this.configurationService.getAllTestByPkgId(pkgId).subscribe(res => {
      for (let i in res.results) {
        let activeStatus = 'Active';
        if (res.results.isActive === false) {
          activeStatus = 'Inactive';
        }
        res.results[i]['activeStatus'] = activeStatus;
      }
      this.health_test_count = res.results.length;
    });
  }
}

const MyAwesomeRangeValidator: ValidatorFn = (fb: FormGroup) => {
  const start = fb.get('minDuration').value;
  const end = fb.get('maxDuration').value;
  return start !== null && end !== null && start < end
    ? null
    : { range: true };
};

@Component({
  selector: 'app-edit-package',
  templateUrl: './edit-package.component.html',
  styleUrls: ['./package.component.scss'],
})
export class EditPackageComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public packageForm: FormGroup;
  public editPackage: EditPackage;
  public isDisabled = false;
  public maxDuration = 0;
  public minDuration = 1;

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public dialog: MatDialog, private readonly  configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<EditPackageComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    this.buildForm();
  }

  public buildForm() {
    this.packageForm = this.form.group({
      healthTestId: [this.data.healthTestId ? this.data.healthTestId : null],
      healthTestName: [this.data.healthTestName ? this.data.healthTestName : null],
      sequence: [this.data.sequence ? this.data.sequence : null],
      minDuration: [this.data.minDuration ? this.data.minDuration : null,
         [Validators.required, Validators.minLength(1), Validators.maxLength(3), Validators.pattern('[0-9]{1,3}$')]],
      maxDuration: [this.data.maxDuration ? this.data.maxDuration : null,
         [Validators.required, Validators.minLength(1), Validators.maxLength(3), Validators.pattern('^[0-9]{1,3}$')]],

    });
    this.packageForm.addValidators(MyAwesomeRangeValidator);
  }
  public updatePackage(data) {
    this.isDisabled = true;

    this.editPackage = new EditPackage(null, null, null, null, null);
    this.editPackage.sequence = this.packageForm.controls['sequence'].value;
    this.editPackage.minDuration = this.packageForm.controls['minDuration'].value;
    
      this.editPackage.maxDuration = this.packageForm.controls['maxDuration'].value;
      


      this.editPackage.healthTestId = data.healthTestId;
    this.editPackage.healthPlanId = data.healthPlanId;



    this.configurationService.updatePackage(this.editPackage).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.packageForm.reset();
  }

}
export function existingSourceIdValidator(configurationService: ConfigurationService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return configurationService.checkSourceId(control.value).pipe(map(
      (res) => {
        return (res?.results?.isAlreadyExists) ? {'isAlreadyExists': true} : null;
      }
    ));
  };
}
@Component({
  selector: 'app-create-package',
  templateUrl: './create-package.component.html',
  styleUrls: ['./package.component.scss'],
})
export class CreatePackageComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public packageForm: FormGroup;
  public createPackage: CreatePackage;
  public editPackage: NewEditPackage;
  TDdataSource = new MatTableDataSource();
  TDdisplayedColumns: string[] = ['S.No', 'Test Name', 'Select'];
  public genderList: any;
  public testList: any[];
  public preTest: any;
  public isSelected = false;
  public testEnabled = false;
  public heathPlanDetails = [];
  public heathPlan: any;
  public testName: any;
  public testNameDetails = [];
  public testListDetails: any[];
  public statusList: any;
  public healthPlanType: any;

  constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreatePackageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly lookupService: LookupTermService) { }

  ngOnInit() {
    this.lookupService.getAppTermsWrapper('Gender,Status,HealthPlanType').subscribe(res => {
      this.genderList = res.Gender ?? [];
      this.statusList = res.Status.filter(resFilter => resFilter.code === 'ST-AT' || resFilter.code === 'ST-IA');
      this.healthPlanType = res.HealthPlanType ?? [];
    });
    this.buildForm();
    if (this.data.id) {
      this.getValidationRemoved();
      this.getPackageTests();
      if (this.data.isActive === true) {
        this.data.isActive = 'Active';
      } else {
        this.data.isActive = "Inactive";
      }
    }
  }
  public buildForm() {
    this.packageForm = this.form.group({
      name: [this.data.name ? this.data.name : null, [Validators.required]],
      gender: [this.data.gender ? this.data.gender : null],
      sourceId: [this.data.sourceId ? this.data.sourceId : null, [Validators.required, Validators.pattern('[a-zA-Z0-9]*'), Validators.maxLength(10)],
      this.data.sourceId == null ? existingSourceIdValidator(this.configurationService) : null],
      description: [this.data.description ? this.data.description : null],
      healthTestId: [this.data.healthPlanDetails ? this.data.healthPlanDetails.healthTestId : null, [Validators.required]],
      isActive: [this.data.isActive ? this.data.isActive : 'Active'],
      planTypeId: [this.data.planTypeId ? this.data.planTypeId : null, [Validators.required]],
    });
  }
  searchTestName(test, event) {
    this.testEnabled = true;
    const planTypeId = this.packageForm.get('planTypeId').value;
    if (test.length > 2 ) {
      this.configurationService.searchTestName('health_test', test, planTypeId).pipe(
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe(res => {
        this.testList = res.results;
        if (this.heathPlanDetails.length !== 0) {
          for (let i=0; this.heathPlanDetails.length > i; i++) {
            this.testListDetails = this.testList.filter(resFilter => resFilter.id !== this.heathPlanDetails[i].healthTestId);
            this.testList = this.testListDetails;
          }
        }
      });
    } else if (event.keyCode == 38 || event.keyCode == 40) {
      const testList = this.testList;
      this.testList = testList;
    } else {
      this.testList = [];
    }
  }
  optionClicked(event: Event, item) {
    event.stopPropagation();
  }
  checkTestName(testId, name, id, event) {
    if (event.checked === true) {
      this.packageForm.controls['healthTestId'].setValue(testId);
      this.heathPlan = {
        "healthTestId": testId,
        "healthPlanId": this.data.id,
        "healthTestName": name,
        "id": id,
        "isActive": true,
      };
      this.heathPlanDetails.push(this.heathPlan);
      const heathPlanDetails = this.heathPlanDetails.filter(resFilter => resFilter.isActive !== false);
      this.TDdataSource = new MatTableDataSource(heathPlanDetails);
    } else {
      this.heathPlanDetails = this.heathPlanDetails.filter(resFilter => resFilter.healthTestId !== testId);
      this.heathPlan = {
        "healthTestId": testId,
        "healthPlanId": this.data.id,
        "id": id,
        "isActive": false,
      }
      this.heathPlanDetails.push(this.heathPlan);
      const heathPlanDetails = this.heathPlanDetails.filter(resFilter => resFilter.isActive !== false);
      this.TDdataSource = new MatTableDataSource(heathPlanDetails);
    }
  }
  getTestList(type, id) {
    if (id) {
      if (type === 'test') {
        return ''
      }
    }
  }
  getPackageTests() {
    this.configurationService.getPackageTests(this.data.id).subscribe(result => {
      const tests = result.results
      this.heathPlanDetails = tests.healthPlanDetails;
      this.TDdataSource = new MatTableDataSource(tests.healthPlanDetails);
    });
  }
  savePackage() {
    this.createPackage = new CreatePackage(null, null, null, null, null, null, null);
    this.createPackage.name = this.packageForm.controls['name'].value;
    this.createPackage.description = this.packageForm.controls['description'].value;
    this.createPackage.gender = this.packageForm.controls['gender'].value;
    this.createPackage.sourceId = this.packageForm.controls['sourceId'].value;
    this.createPackage.healthPlanDetails = this.heathPlanDetails;
    if (this.packageForm.controls['isActive'].value === 'Active' || this.packageForm.controls['isActive'].value === null) {
      this.createPackage.isActive = true;
    } else {
      this.createPackage.isActive = false;
    }
    this.createPackage.planTypeId = this.packageForm.controls['planTypeId'].value;
  
    this.configurationService.savePackage(this.createPackage).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.heathPlanDetails = [];
    this.testEnabled = false;
  }
  updatePackage() {
    this.editPackage = new NewEditPackage(null, null, null, null, null, null, null);
    this.editPackage.name = this.packageForm.controls['name'].value;
    this.editPackage.description = this.packageForm.controls['description'].value;
    this.editPackage.gender = this.packageForm.controls['gender'].value;
    this.editPackage.sourceId = this.packageForm.controls['sourceId'].value;
    this.editPackage.healthPlanDetails = this.heathPlanDetails;
    if (this.packageForm.controls['isActive'].value === 'Active' || this.packageForm.controls['isActive'].value === null) {
      this.editPackage.isActive = true;
    } else {
      this.editPackage.isActive = false;
    }
    this.editPackage.planTypeId = this.packageForm.controls['planTypeId'].value;
    
    this.configurationService.newUpdatePackage(this.data.id, this.editPackage).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.heathPlanDetails = [];
    this.testEnabled = false;
  }
  fixClick() {
    console.log('')
  }  

  getValidationRemoved() {
    const control = this.packageForm?.get('healthTestId');
    if (!control) {
      return;
    }
    control.clearValidators();
    control.setErrors(null);
    control.updateValueAndValidity({ emitEvent: false });
  }  
}
