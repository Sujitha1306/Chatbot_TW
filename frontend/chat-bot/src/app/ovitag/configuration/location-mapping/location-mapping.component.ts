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
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ValidationErrors} from '@angular/forms';
import { ConfigurationService, CommonService } from '../../../shared';
import { EditLocationMapping } from '../configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { AppToastService } from '../../../shared/services/toaster.service';

/*

Description : design the package level health checkup
Date        : Oct 20, 2019
Author      : TrackerWave
Developer   : UI Team

*/
@Component({
  selector: 'app-location-mapping',
  templateUrl: './location-mapping.component.html',
  styleUrls: ['./location-mapping.component.scss'],


})
export class LocationMappingComponent implements OnInit {

  displayedColumns: string[] = ['S. No', 'Test Name', 'Avg. Test Time', 'Test Location', 'Status'];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE'];
  public selectedRow: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any = '';
  public pageStart = 0;
  public pageSize: any;
  public length = 0;
  tableData: any;
  searchInput: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  filterValue = null;
    
  constructor(private readonly configurationService: ConfigurationService, public dialog: MatDialog,
    public commonService: CommonService, public router: Router, private readonly route: ActivatedRoute) {
      this.activate_btn = this.commonService.getActivePermission('button');
      }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.locationMapping.results;
    this.length = this.route.snapshot.data.locationMapping.totalRecords;
    this.pageStart = this.route.snapshot.data.locationMapping.pageStart;
    this.pageSize = this.route.snapshot.data.locationMapping.pageSize;
    for (let i in this.tableData) {
      let testlocname = '';
      for (let j in this.tableData[i].testLocations) {
        if (testlocname === '') {
          testlocname = this.tableData[i].testLocations[j].name + ', ' +this.tableData[i].testLocations[j].floorName + ';';
        } else {
          testlocname = testlocname + ' ' + this.tableData[i].testLocations[j].name + ', ' +
          this.tableData[i].testLocations[j].floorName + ';';
        }
      }
      this.tableData[i]['testLocationsName'] = testlocname;
      this.tableData[i]['fullName'] = testlocname;
      let activeStatus = 'Active';
      if (this.tableData.isActive === false) {
        activeStatus = 'Inactive';
      }
      this.tableData[i]['activeStatus'] = activeStatus;
    }
    const Columns = ['testId', 'testName', 'avgTestTime', 'testLocationsName', 'activeStatus'];
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
    this.getAllHealthchecks();
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'create') {
      this.createLocationMapping();
    } else {
      this.selectedName = null;
      this.applyFilterValue = '';
      this.refreshPage();
    }
  }
  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllHealthchecks();
    }
  }

  createLocationMapping(){
    this.showActions = null;
    const dialogRef = this.dialog.open(EditLocationMappingComponent,
      {  panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { 
        this.searchInput = null;
      }
      this.refreshPage();
      this.selectDropdown = null;
    });

  }

  editLocationMapping(rowData: any) {
    this.rowData = rowData;
    this.selectedRow = rowData.id;
    const dialogRef = this.dialog.open(EditLocationMappingComponent,
      { data: rowData, panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { 
        this.getAllHealthchecks();
        this.searchInput = null;
      }
    });
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = '';
    }
    this.getAllHealthchecks();
  }

  getAllHealthchecks() {
    this.configurationService.getAllHealthchecks(this.applyFilterValue, this.pageStart, this.pageSize).subscribe(res => {
      for (let i in res.results) {
        let testlocname = '';
        for (let j in res.results[i].testLocations) {
          if (testlocname === '') {
            testlocname = res.results[i].testLocations[j].name + ', ' + res.results[i].testLocations[j].floorName + ';';
          } else {
            testlocname = testlocname + ' ' + res.results[i].testLocations[j].name + ', ' +
            res.results[i].testLocations[j].floorName + ';';
          }
        }
        res.results[i]['testLocationsName'] = testlocname;
        res.results[i]['fullName'] = testlocname;
        let activeStatus = 'Active';
        if (res.results.isActive === false) {
          activeStatus = 'Inactive';
        }
        res.results[i]['activeStatus'] = activeStatus;
      }
      this.tableData = res.results;
      this.length = res.totalRecords;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + '';
      }
      const Columns = ['testId', 'testName', 'avgTestTime', 'testLocationsName', 'activeStatus'];
      for (let i in Columns) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
}

@Component({
  selector: 'app-edit-location-mapping',
  templateUrl: './edit-location-mapping.component.html',
  styleUrls: ['./location-mapping.component.scss'],

})

export class EditLocationMappingComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public locationMapForm: FormGroup;
  public editLocationMapping: EditLocationMapping;
  public isDisabled = false;
  public searchlist = [];
  public testLocations = [];
  public location_details = [];
  public removedLocation = [];
  public healthTestLocationIds: any;
  public listItems : any;
  public searchTestlist = [];
  public testListItems : any;
  public unmappedtest : any;
  requireNameMatchVal:any;
  tests: any;
  public hctests: any;
  public isUnmapped = false;
  testId = null;
  public filterKey = new FormControl();
  tableData = [];
  newLocationControl = new FormControl(null, Validators.required);
  newQueueLengthControl = new FormControl(1);
  newCapacityControl = new FormControl(1);
  loading = false;
  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public dialog: MatDialog, private readonly configurationService: ConfigurationService, public commonService: CommonService,
    public thisDialogRef: MatDialogRef<EditLocationMappingComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
      if(data?.type == "unmapped"){
        this.isUnmapped = true;
        this.unmappedtest = this.data.listData
        this.data = null;
      }
    }

  ngOnInit() {
    this.buildForm();
    this.getUnmappedTest();
    if(this.data != null){
      this.testId = this.data.testId;
      this.tableData = this.data.testLocations.map(tl => ({
        capacity: tl.capacity,
        healthTestLocationId: tl.healthTestLocationId,
        isDeletable: tl.isDeletable,
        locationId: tl.locationId + ', ' + tl.name + ' ' + tl.floorName,
        queueLength: tl.queueLength
      }));
      this.updateLocation();
  }
  }
  getUnmappedTest() {
    if (this.isUnmapped) {
      if (this.unmappedtest.length) {
        this.getTest(this.unmappedtest[0])
      }
    }
  }

  getTest(data) {
    this.data = data;
    this.testId = this.data.testId;
    this.buildForm()
    this.tableData = this.data.testLocations.map(tl => ({
      capacity: tl.capacity,
      healthTestLocationId: tl.healthTestLocationId,
      isDeletable: tl.isDeletable,
      locationId: tl.locationId + ', ' + tl.name + ' ' + tl.floorName,
      queueLength: tl.queueLength
    }));
    this.updateLocation()
  }

  public buildForm() {
    if(this.data != null){
    this.locationMapForm = this.form.group({
      id: [this.data.id ? this.data.id : null],
      testName: [this.data.testName ? this.data.testName : null],
      testLocations: this.form.array([this.editLocation(0 , false)]),
    });
  } else{
    this.locationMapForm = this.form.group({
      id: [null],
      testName: [null,[Validators.required, this.requireNameMatch.bind(this)]],
      testLocations: this.form.array([]),
    });
  }
  }

  addLocation() {
    const control = <FormArray>this.locationMapForm.controls['testLocations'];
    control.push(this.getLocation());
  }
  addToTable() {
    if (!this.newLocationControl.value) return;

    const locationValue = this.newLocationControl.value;
    const queueValue = this.newQueueLengthControl.value || 1;
    const capacityValue = this.newCapacityControl.value || 1;

    const control = <FormArray>this.locationMapForm.controls['testLocations'];
    if(control.value[0]?.locationId == null) {
      control.removeAt(0);
    }
    control.push(this.form.group({
      locationId: [locationValue],
      queueLength: [queueValue],
      capacity: [capacityValue],
      healthTestLocationId: [null]
    }));

    this.tableData = [...this.tableData, {
      locationId: locationValue,
      queueLength: queueValue,
      capacity: capacityValue,
      healthTestLocationId: null,
      isDeletable: null
    }];

    this.newLocationControl.reset();
    this.newQueueLengthControl.reset();
    this.newCapacityControl.reset();
  }

  private updateLocation() {
    const control = <FormArray>this.locationMapForm.controls['testLocations'];      
    control.removeAt(0);
    for ( let i in this.data.testLocations) {
      control.push(this.editLocation(i , true));
    }
  }

  removeLocation(event?: any) {
    let index: number;
    let rowData: any;

    if (event && event.key === 'delete') {
      rowData = event.data;
      index = this.tableData.indexOf(rowData);
    } else {
      index = event;
      rowData = this.tableData[index];
    }

    if (index === undefined || index < 0 || index >= this.tableData.length) return;

    const locDetail = this.locationMapForm.controls['testLocations'].value[index]?.healthTestLocationId;
    if (this.data !== null && locDetail) {
      const locIndex = this.data.testLocations.findIndex(res => res.healthTestLocationId === locDetail);
      if (locIndex !== -1) {
        this.data.testLocations[locIndex]['isDeletable'] = true;
        this.removedLocation.push({
          'locationId': this.data.testLocations[locIndex].locationId,
          'healthTestLocationId': this.data.testLocations[locIndex].healthTestLocationId,
          'capacity': this.data.testLocations[locIndex].capacity,
          'queueLength': this.data.testLocations[locIndex].queueLength,
          'isDeletable': true
        });
      }
    } else if (rowData?.healthTestLocationId !== undefined && rowData?.healthTestLocationId !== null) {
      this.removedLocation.push({
        'locationId': parseInt(String(rowData?.locationId).split(',')[0], 10),
        'healthTestLocationId': rowData?.healthTestLocationId,
        'capacity': rowData?.capacity,
        'queueLength': rowData?.queueLength,
        'isDeletable': true
      });
    }

    const control = <FormArray>this.locationMapForm.controls['testLocations'];
    if (control.length > index) {
      control.removeAt(index);
    }

    this.tableData = this.tableData.filter((_, i) => i !== index);
  }

  private getLocation() {
    return this.form.group({
      locationId: [null,  [Validators.required]],
      queueLength: [1],
      capacity: [1],
    });
  }

  private editLocation(i , update) {
    const locationname = this.data.testLocations.length == 0 && !update ? null : this.data.testLocations[i].locationId + ', ' +
    this.data.testLocations[i].name + ' ' + this.data.testLocations[i].floorName;
    return this.form.group({
      locationId: [locationname],
      queueLength: [this.data.testLocations.length == 0 && !update ? null : this.data.testLocations[i].queueLength],
      capacity: [this.data.testLocations.length == 0 && !update ? null : this.data.testLocations[i].capacity],
      healthTestLocationId: [this.data.testLocations.length == 0 && !update ? null : this.data.testLocations[i].healthTestLocationId],
    });
  }

  searchToLocation(event) {
    if (event.type === 'location' && event.text.length >= 2){
      if (event.toHit) {
        this.commonService.getLocationSearch(event.text).subscribe(res => {
          this.listItems = res.results;
          this.searchlist = this.listItems;
        });
      } else {
        this.searchlist = this.listItems;
      }
    } else {
      this.searchlist = [];
    }
  }

  getTestList(id) {
    if (id) {
      const test = this as any as { id: string, name: string }[]
      const testId = test.find(obj => obj.id === id).name;
      return testId;
    } else {
      return '';
    }
  }

  private requireNameMatch(control: FormControl): ValidationErrors | null{
    if(control.value !== null && control.value !== '') {
    this.requireNameMatchVal = this.searchTestlist.filter(resFilter => resFilter.id === control.value);
    if (this.requireNameMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }

  searchTest(event){
    if (event.type === 'testName' && event.text.length >= 2){
      if (event.toHit) {
        this.commonService.getAllHeathTestWithoutAdminTest(event.text).subscribe(res => {
          this.testListItems = res.results;
          this.searchTestlist = this.testListItems;  
        });
      }else {
        this.searchlist = this.listItems;
      }
    } else {
      this.searchlist = [];
    }
  }
  applyFilterUnmap(filterValued: string) {
    filterValued = filterValued.trim();
    filterValued = filterValued.toLowerCase();
    this.unmappedtest.filter = filterValued;
    this.getfilterunmap(filterValued)
  }


  getfilterunmap(sText: string) {
    this.commonService.getAllUnMappedTestLocation(sText).subscribe(res => {
      this.unmappedtest = res.results;
    });
  }
  getTestLocationId(id){
    this.testId = id;
    const control = <FormArray>this.locationMapForm.controls['testLocations'];
    control.controls = [];
    this.tableData = [];
    this.loading = true;
    this.configurationService.getAllHealthchecks().subscribe(res => {
      this.hctests = res.results;    
      this.tests = this.hctests.filter(resFilter => resFilter.testId === this.testId && resFilter.isActive);     
      if(this.tests[0] != null){
        const locations = [];
        for ( let i in this.tests[0].testLocations) {
          const locationname = this.tests[0].testLocations[i].locationId + ', ' +
          this.tests[0].testLocations[i].name + ' ' + this.tests[0].testLocations[i].floorName;
          control.push(this.form.group({
            locationId: [locationname],queueLength: [this.tests[0].testLocations[i].queueLength],
            capacity: [this.tests[0].testLocations[i].capacity],healthTestLocationId: [this.tests[0].testLocations[i].healthTestLocationId],
          }));
          locations.push({
            locationId: locationname,
            queueLength: this.tests[0].testLocations[i].queueLength,
            capacity: this.tests[0].testLocations[i].capacity,
            healthTestLocationId: this.tests[0].testLocations[i].healthTestLocationId,
            isDeletable: this.tests[0].testLocations[i].isDeletable
          });
        }
        this.tableData = locations;
        this.loading = false;
      } else {
        this.loading = false;
        this.addLocation();
      }
    });  
    
  }

  public updateLocationMapping(id) {
    this.isDisabled = true;
    this.editLocationMapping = new EditLocationMapping(null, null);
    this.editLocationMapping.id = id;
    this.editLocationMapping.testLocations   = this.locationMapForm.value.testLocations;
    this.testLocations = JSON.parse(JSON.stringify(this.editLocationMapping.testLocations)); 
    for (let i in this.testLocations) {
      if(this.testLocations[i].hasOwnProperty('healthTestLocationId')){
        this.healthTestLocationIds = this.testLocations[i].healthTestLocationId
      }
      else{
        this.healthTestLocationIds = null
      }
      this.location_details.push({
        locationId : parseInt(this.testLocations[i].locationId.split(',')[0], 10),
        queueLength: this.testLocations[i].queueLength,
        capacity: this.testLocations[i].capacity,
        healthTestLocationId: this.healthTestLocationIds
      });
    }
    for (let j in this.removedLocation) {
      this.location_details.push(this.removedLocation[j]);
    }  
    const updateData = { 'testLocations': this.location_details };
    this.configurationService.updateHealthcheck(updateData, id).subscribe(res => {
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
    this.locationMapForm.reset();
    this.location_details = [];
  }
  fixClick() {
    console.log('')
  }
}
