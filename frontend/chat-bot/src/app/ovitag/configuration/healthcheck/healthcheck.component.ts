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
import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { MatDialog,MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService } from '../../../shared';
import { CreateHealthcheck, EditHealthcheck, UpdateLocation } from '../configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { AppToastService } from '../../../shared/services/toaster.service';

/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/
@Component({
  selector: 'app-healthcheck',
  templateUrl: './healthcheck.component.html',
  styleUrls: ['./healthcheck.component.scss'],
  animations: [routerTransition()],

})
export class HealthcheckComponent implements OnInit {

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['testName', 'capacity', 'fullName', 'statusName'];


  healthCheckList: Array<any> = [];
  healthTest: Array<any> = [];

  testLocations: Array<any> = [];
  public cols: any;
  public userLevel = null;
  public floorData: any = [];

  public selectedRow: any;
  public rowData: any = [];
  public activate_btn: any = [];
  panelOpenState = false;


  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private readonly configurationService: ConfigurationService, public dialog: MatDialog,
    public commonService: CommonService, public router: Router, private readonly route: ActivatedRoute) {
    this.activate_btn = this.commonService.getActivePermission('button');
 
  }

  ngOnInit() {
    if (parseInt(localStorage.getItem('userlevel')) == 3) {
      this.router.navigate(['/ovitag/configuration/rule']);
    }
    
    this.dataSource = new MatTableDataSource<CreateHealthcheck>(this.route.snapshot.data.healthchecks.results);
    this.healthCheckList = this.route.snapshot.data.healthchecks.results;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.getAllHealthTestsbyFloorwise();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); 
    this.dataSource.filter = filterValue;
  }

  createHealthcheck(rowData: any) {
    this.rowData = rowData;
    this.selectedRow = rowData.id;
    const dialogRef = this.dialog.open(CreateHealthcheckComponent,
      {data: rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { 
        this.getAllHealthchecks();
      }
    });
  }
  locationInfo(id, status, name, queuelength) {
    const dialogRef = this.dialog.open(EditHealthcheckComponent, {
      data: { 'id': id, 'name': name, 'status': status, 'queuelength': queuelength }, 
       panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.getAllHealthchecks();
      }
    });
  }


  rowClick(data) {
    this.selectedRow = data.id;
  }

  getAllHealthTestsbyFloorwise() {
    this.configurationService.getAllHealthTestsbyFloorwise().subscribe(res => {
      this.healthTest = res.results;
    });
  }


  getAllHealthchecks(routerEvent?: boolean) {
    this.configurationService.getAllHealthchecks().subscribe(res => {
      this.dataSource = new MatTableDataSource<CreateHealthcheck>(res.results);
      this.healthCheckList = res.results;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  onWindowResized(size){
    this.cols = size;
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-create-healthcheck',
  templateUrl: './create-healthcheck.component.html',
  styleUrls: ['./healthcheck.component.scss'],
})
export class CreateHealthcheckComponent implements OnInit {

  @Input() max: Date | null;   
  today = new Date();

  public healthcheckForm: FormGroup;
  public createHealthcheck: CreateHealthcheck;
  public editHealthcheck: EditHealthcheck;
  public matcher = new ErrorStateMatcherService();
  public isDisabled = false;
  dataSource = new MatTableDataSource();
  testLocation: Array<any> = [];
  attachFiles: Array<any> = [];

 
  autoCompleteChipList: FormControl = new FormControl();
  
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;

  filteredOptions = [];
  chips = [];
  public floor_ids = [];
  public loc_ids = [];
  private readonly debounce = 400;

  public statusList: any = [];



  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar, public dialog: MatDialog, private readonly configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<CreateHealthcheckComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService) {
    this.getStatus();

    this.today.setDate(this.today.getDate());

    this.autoCompleteChipList.valueChanges
      .pipe(debounceTime(this.debounce), distinctUntilChanged())
      .subscribe(val => {
        this.filterOptions(val);
      });
  }

  ngOnInit() {
    this.buildForm();

    if (typeof (this.data.testLocations) === 'object') {
      this.chips = this.data.testLocations;
    }
  }

  getStatus() {
    this.commonService.getAppTermsVerion2('Status').subscribe(res => {
      this.statusList = res.results;
    });
  }

  filterOptions(text: string) {
    
    if (typeof (text) === 'string') {
      this.configurationService.getLocationData(text).subscribe(res => {
        if (res.results.length !== 0) {
          this.filteredOptions = res.results;
        }
      });
    }
  }

  addChip(event: MatAutocompleteSelectedEvent, input: any): void {

    
    const selection = event.option.value;

    
    this.chips.push(selection);
    this.testLocation.push(
      {
        capacity: this.healthcheckForm.controls['capacity'].value,
        locationId: selection.id
      }
    );
    
    if (input) {
      input.value = '';
    }
  }

  removeChip(chip: any): void {
    
    const remove_user_index = this.chips.indexOf(chip);
    
    if (remove_user_index >= 0) {
      
      this.chips.splice(remove_user_index, 1);
      this.loc_ids = [];
      for (let i = 0; this.chips.length > i; i++) {
        this.loc_ids.push(this.chips[i]['id']);
        this.floor_ids.push(this.chips[i]['id']);
      }
    }
  }

  public buildForm() {

    if (typeof (this.data.testLocations) === 'object') {
      this.data.capacity = this.data.testLocations[0].capacity;
    }
    this.healthcheckForm = this.form.group({
      testId: [this.data.testId ? this.data.testId : null],
      
      healthPlanId: ['40'],
      statusId: [this.data.statusId ? this.data.statusId : null],      
      minDuration: [this.data.minDuration ? this.data.minDuration : null, [Validators.required, Validators.minLength(1), Validators.maxLength(3), Validators.pattern('[0-9]{1,3}$')]],
      maxDuration: [this.data.maxDuration ? this.data.maxDuration : null, [Validators.required, Validators.minLength(1), Validators.maxLength(3), Validators.pattern ('^[0-9]{1,3}$')]],
      checkInInterval: [this.data.checkInInterval ? this.data.checkInInterval : null],
      checkOutInterval: [this.data.checkOutInterval ? this.data.checkOutInterval : null],
      sequence: ['1'],
      testName: [this.data.testName ? this.data.testName : null],
      testLocations: this.form.array([this.gettestLocations()]),
      isDeletable: [this.data.isDeletable ? this.data.isDeletable : null],
      capacity: [this.data.capacity ? this.data.capacity : null],
      locationId: [this.data.locationId ? this.data.locationId : null],


    });
  }

  private gettestLocations() {
    return this.form.group({
      capacity: [null],
      isDeletable: [''],
      locationId: ['']
    });
  }


  public saveHealthcheck() {
    this.isDisabled = true;
    this.createHealthcheck = new CreateHealthcheck(null, null, null, null, null, null, null, null, null, null, null, null);
    this.createHealthcheck.testId = this.healthcheckForm.controls['testId'].value;
    this.createHealthcheck.testName = this.healthcheckForm.controls['testName'].value;
    this.createHealthcheck.healthPlanId = this.healthcheckForm.controls['healthPlanId'].value;
    this.createHealthcheck.statusId = this.healthcheckForm.controls['statusId'].value;
    this.createHealthcheck.minDuration = this.healthcheckForm.controls['minDuration'].value;
    this.createHealthcheck.maxDuration = this.healthcheckForm.controls['maxDuration'].value;
    this.createHealthcheck.checkInInterval = this.healthcheckForm.controls['checkInInterval'].value;
    this.createHealthcheck.checkOutInterval = this.healthcheckForm.controls['checkOutInterval'].value;
    this.createHealthcheck.testLocations = this.testLocation;

    this.configurationService.saveHealthcheck(this.createHealthcheck).subscribe(res => {
      if (res.statusCode != 1) {
        this.isDisabled = false;
      }
      this.toastr.success('Success', `${res.message}`);

      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
    this.healthcheckForm.reset();
    this.chips = [];
  }
  public updateHealthcheck(id) {
    this.isDisabled = true;

    this.editHealthcheck = new EditHealthcheck(null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editHealthcheck.testId = this.healthcheckForm.controls['testId'].value;
    this.editHealthcheck.testName = this.healthcheckForm.controls['testName'].value;
    this.editHealthcheck.healthPlanId = this.healthcheckForm.controls['healthPlanId'].value;
    this.editHealthcheck.statusId = this.healthcheckForm.controls['statusId'].value;
    this.editHealthcheck.minDuration = this.healthcheckForm.controls['minDuration'].value;
    this.editHealthcheck.maxDuration = this.healthcheckForm.controls['maxDuration'].value;
    this.editHealthcheck.checkInInterval = this.healthcheckForm.controls['checkInInterval'].value;
    this.editHealthcheck.checkOutInterval = this.healthcheckForm.controls['checkOutInterval'].value;
    this.editHealthcheck.capacity = this.healthcheckForm.controls['capacity'].value;

    this.editHealthcheck.testLocations = this.testLocation;

    this.editHealthcheck.id = id;

    this.configurationService.updateHealthcheck(this.editHealthcheck, id).subscribe(res => {
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
    this.healthcheckForm.reset();
    this.chips = [];
  }

}

@Component({
  selector: 'app-edit-healthcheck',
  templateUrl: './edit-healthcheck.component.html',
  styleUrls: ['./healthcheck.component.scss'],
  
})
export class EditHealthcheckComponent implements OnInit {

  public healthcheckForm: FormGroup;
  public updateLocation: UpdateLocation;
  public matcher = new ErrorStateMatcherService();
  public isDisabled = false;
  public statustypes = [];

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar, public dialog: MatDialog,
    public thisDialogRef: MatDialogRef<EditHealthcheckComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.buildForm();
  }

  public buildForm() {
    this.healthcheckForm = this.form.group({
      healthPlanName: [this.data.healthPlanName ? this.data.healthPlanName : null],
      statusName: [this.data.statusName ? this.data.statusName : null],
      capacity: [this.data.capacity ? this.data.capacity : null]

    });
  }
  public updateHealthCheckupLocation(id) {
    this.isDisabled = true;
    this.updateLocation = new UpdateLocation(null, null, null, null);
    this.updateLocation.capacity = this.healthcheckForm.controls['capacity'].value;
    this.updateLocation.healthPlanName = this.healthcheckForm.controls['healthPlanName'].value;
    this.updateLocation.statusName = this.healthcheckForm.controls['statusName'].value;

  }
  
}
