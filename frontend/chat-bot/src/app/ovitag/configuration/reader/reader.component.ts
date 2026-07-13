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
import { Component, OnInit, ViewChild,Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatOption } from '@angular/material/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService } from '../../../shared';
import {SoftwareUpdateComponent} from './../../../shared/modules/entry-component/software-update/software-update.component';
import { ActivatedRoute } from '@angular/router';
import { ReaderConfigComponent } from './reader-config/reader-config.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { UpgradeCertificateComponent } from '../../../shared/modules/entry-component/certificate-upgrade/upgrade-certificate.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { EntityGroupComponent } from '../../../shared/modules/entry-component/entity-group/entity-group.component';
import { DatePipe } from '@angular/common';
import { StyleLoaderService } from '../../../shared/services/style-loader.service ';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';
/**
Description : set the default array values and define the status values.
Date        : Jul 12, 2018
Author      : TrackerWave
Developer   : UI Team
**/

@Component({
  selector: 'app-reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.scss'],
  animations: [routerTransition()],

})
export class ReaderComponent implements OnInit {
  selection = new SelectionModel<any>(true, []);
  public selectedName = null;
  public maxHeight: any;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = [];
  columnData: string[] = [];
  eventColumn = [];
  iconHeader = [];
  iconColumn = ['Last Updated Date'];
  sortColumn = [];
  private readonly msg: string = '';
  public activate_btn: any = [];
  public hwVersions = null;
  headercolor: string;
  pagebgcolor: string;
  public applyFilterValue: any;
  public type = 'All';
  public typeEnable = false;
  public hwForm: FormGroup;
  isDisabled: boolean = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  swVersionList: any;
  readerId: any;
  height: number;
  width: number;
  tableData: any[] = [];
  permissionControl = ['BT_ALLE','BT_CFRE'];
  selectDropdown: any;
  public selectedView = 'table';
  readerDetails: any[];
  statusInfo: any;
  public selectFilter = [{ id: "type", value: "TYPE" }];
  showAction1 = [
    { id: 'create', value: 'Create' },
    { id: 'connectivity', value: 'Connectivity' },
    { id: 'group', value: 'Group' },
    { id: 'kit', value: 'Kit Group' },
    { id: 'settings', value: 'Threshold Settings' },
    { id: 'changeFloor', value: 'Change Floor' }
  ];
  showAction2 = [
    { id: 'create', value: 'Create' },
    { id: 'connectivity', value: 'Connectivity' },
    { id: 'group', value: 'Group' },
    { id: 'kit', value: 'Kit Group' },
    { id: 'settings', value: 'Threshold Settings' },
    { id: 'changeFloor', value: 'Change Floor' }
  ];
  public showActions = this.showAction1;
  selectedData = null;
  pageSize:number=20;
  pageStart:number=0; 
  length: any = 0;
  pageHit = false;
  public isloading = false;
  dateTimeColumns = ['Last Updated Date',]
  public parentFilter = [
    {
      groupName: 'ReaderHardwareType',
      value: 'Reader HardwareType',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ]
  constructor(
    private readonly styleLoader: StyleLoaderService,
    public dialog: MatDialog,
    public snackbar: MatSnackBar,
    public commonService: CommonService,public toastr: AppToastService, public fb: FormBuilder,
    public configurationService: ConfigurationService, private readonly route: ActivatedRoute, private readonly datePipe: DatePipe, private readonly lookupService: LookupTermService, private readonly errorStateMatcher: ErrorStateMatcherService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getHwVersions();



    if(this.activate_btn && (this.activate_btn.indexOf('BT_CFRS') > -1)){
      const syncBtn = {
        id: 'sync',
        value: 'Sync'
      }
      this.showAction1.push(syncBtn);
      this.showAction2.push(syncBtn);
    }
  }

  ngOnInit() {
    this.styleLoader.loadStyleByType('leafletCss');
    this.buildForm();
    this.getDynamicTableColumn()
    this.readerType('type');

    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.pagebgcolor = '#ffffff';
    }

  }
  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('reader').subscribe((res) => {
      if (res.statusCode === 1) {
        console.log(res.results)
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.columnData = dynamicColumns.columns
        console.log('this.displayedColumns', this.displayedColumns)
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.pageSize = dynamicColumns.pageSize
      }
      this.getAllReaders(this.type, true, this.pageStart, this.pageSize, this.applyFilterValue, null);
    });
  }
  buildForm() {
    this.hwForm = this.fb.group({
      hardwareType: [this.type ? this.type : null]
    });
  }
  eventTriggers(event){
    this.pageStart = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
  }

  getAllReaders(type, routerEvent ?: boolean, pageStart?: any, pageSize?: any,  sText?: any, id? : any) {
    this.isloading = true;
    this.selection.clear();
    this.typeEnable = false;
    if (routerEvent) {

       this.tableData = this.route.snapshot.data.readers.results;
       this.readerDetails = this.tableData.map((item) => item.readerName);
       this.length = this.route.snapshot.data.readers.totalRecords;
      for (let i = 0; i <= this.columnData.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columnData[i]];
        });
      } 
      this.isloading = false;
       this.pageHit = true;
       if (type !== 'All') {
         this.selection.clear();
         this.typeEnable = true; 
         this.configurationService.getswVersion(type).subscribe(res => {
           if (res.statusCode === 1) {
             this.swVersionList = res.results;
           }
         });
       } else {
         this.buildForm();
       }
       if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
        this.isloading = true;
        this.getReaderStatus();
       }
    } else {
      this.configurationService.getAllNewReaders( id, sText, pageStart, pageSize, type).subscribe(res => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.pageHit = true;
        this.readerDetails = res.results.map((item) => item.readerName);
        for (let i = 0; i <= this.columnData.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[this.columnData[i]];
          });
        }
        this.isloading = false;
        if (type !== 'All') {
          this.selection.clear();
          this.typeEnable = true;        
          this.configurationService.getswVersion(type).subscribe(res => {
            if (res.statusCode === 1) {
              this.swVersionList = res.results;
            }
          });
        } else {
          this.buildForm();
        }
        if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
          this.isloading = true;
          this.getReaderStatus();
         }
      });
    }
  }

  getHwVersions() {
    this.configurationService.getHardwareVersions().subscribe(res => {
      this.hwVersions = res.results;

    });
  }

  getReaderStatus() {
    let locfacility: any;
    locfacility = localStorage.getItem(btoa('facilityId')).split(',');
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const readerStatus = { entityIds: this.readerDetails, facilityList: locfacility, fromDate: currentDate };
    this.commonService.getReaderStatus(readerStatus).subscribe((res) => {
      this.statusInfo = res.results;
      for (let i in this.statusInfo) {        
        let index = this.tableData.findIndex(val => val.readerName == this.statusInfo[i]['entityId']);
        if (this.tableData[index] != null) {
            this.tableData[index]['Status'] = this.statusInfo[i]['statusValue'];
            this.tableData[index]['Last Updated Date'] = this.statusInfo[i]['statusEventDatetime'];
        }
      }
    });
    this.isloading = false;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if (this.dataSource?.data?.length) {
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }

  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
    this.isConnected = !this.isConnected;
  }

  public isConnected: boolean = true;
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    else {
      const selection = this.selection?.selected;
      if (selection?.length > 0) {
        let val = selection[0].readerConnectivityTypeName
        selection.forEach(x => {
          if (x.readerConnectivityTypeName != val) {
            this.isConnected = false;
          }
          else {
            this.isConnected = true;
          }
        })
      }
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.selectedName = null;
    this.selectedData = null;
    this.type = 'All';
    this.parentFilter = [
      {
        groupName: 'ReaderHardwareType',
        value: 'Reader HardwareType',
        isNoneAll: true,
        selectionType: 'single',
        subFilters: [],
        defaultSelected: ['All']
      }
    ]
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    this.readerType('type');
  }

  readerType(id) {
    if (id === "type") {
      this.lookupService.getAppTermsWrapper('ReaderHardwareType').subscribe(res => {
        const rowFilter = this.parentFilter.find(filter => filter.groupName === 'ReaderHardwareType'); 
        if (rowFilter) {
          rowFilter.subFilters = res.ReaderHardwareType.map(({ code, value }) => ({ code, value }));
        }
      });
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length == 0 || this.applyFilterValue.length > 2){
      this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.key === "groupFilter") {
      this.manageWorklist(event.data);
    } else if (event.data === 'create') {
      this. createNewReader('');
    } else if (event.data === 'sync') {
      this.syncReaders();
    } else if (event.data === 'connectivity') {
      this.createActivity();
    } else if (event.data === 'group' || event.data === 'kit' ) {
      this.createGroup(event.data);
    } else if (event.data === 'settings') {
      this.changethreshold(this.selectedData);
    } else if (event.data === 'changeFloor') {
      this.changeFloor();
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if (this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    }
  }
  manageWorklist(type) {
    this.applyFilterValue = null;
    this.type = type[0].data;
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
  }

  createNewReader(rowData: any) {
    this.showActions = null;
    rowData = { ...rowData };
    this.selectedName = rowData.id;
    const dialogRef = this.dialog.open(ReaderConfigComponent,
      { data: rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
  changethreshold(data) {
    this.showActions = null;
    data = data || this.selection.selected[0];
    const dialogRef = this.dialog.open(ThresholdComponent,
    { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
  syncReaders(){
    this.showActions = null;
    let data = ''
    let identifyingType = 'Reader'
    this.configurationService.syncReader(identifyingType, data).subscribe(res => {
      this.showActions = this.showAction1;
      this.selectedName = null
      this.toastr.success('Success', `${res.message}`);
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  changeVersion(reader, version) {
    this.readerId = Array.prototype.map.call(reader, readerId => readerId.id);
    this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Version Update', message: 'Do you want to update the version',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'isRemark': 1, 'swversionUpdate': true, 'version': version, 'id': this.readerId, 'type': 'newswVerUpdate'
      }
    });

  }
  updateVersion(data) {

    const dialogRef = this.dialog.open(SoftwareUpdateComponent,
      {data: data, panelClass: ['medium-popup'], disableClose: true });

      dialogRef.afterClosed().subscribe(results => {
      if (results === 'confirm') {
        this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
      }
    });
  }

  upgradeCertificate() {
    this.dialog.open(UpgradeCertificateComponent, {
      width: '430px', height: '40%', disableClose: true,
      data: {}
    });
  }

  rowClick(data) {
    if(this.selectedName === data.id) {
      this.selectedName = null;
      this.selectedData = null;
    } else {
      this.selectedName = data.id;
      this.selectedData = data;
    }
  }

  createActivity() {
    this.showActions = null;
    const dialogRef = this.dialog.open(ConnectivityComponent,
      {
        height:'285px',
        width: '45%', disableClose: true,
        data: { name: this.selection.selected, Data: this.tableData },
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  changeFloor() {
    this.showActions = null;
    const dialogRef = this.dialog.open(ReaderConfigComponent,
      {
        panelClass: ["medium-popup"], disableClose: true,
        data: 'multiReader',
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
  createGroup(entityGroup) {
    this.showActions = null;
    const dialogRef = this.dialog.open(EntityGroupComponent,
      {
        panelClass: ["medium-popup"], disableClose: true,
        data: { type : entityGroup == 'group' ? 'EGTI-READER' : 'EGTI-KIT'},
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-threshold-setting',
  templateUrl: './threshold-setting.component.html',
  styleUrls: ['./threshold-setting.component.scss'],

})
export class ThresholdComponent implements OnInit {
  public thresholdForm : FormGroup;
  public thresholdList: Array<any> = [];
  public getAllThresholdList: Array<any> = [];
  public getReaderList: Array<any> = [];
  public getTagList: Array<any> = [];
  public selectThreshold : string;
  public step = -1;
  public thumbLabel = true;
  public loading = false;
  tagTypeList: any=[];
  addThreshold = false;
  popWidth: any;
  popHeight: any;
  contentHeight: number;
  public windWidth = window.innerWidth;
  hardwareTypeList: any=[];
  readerList: any=[];
  readerId = null;
  hardwareTypeThresholdId = null;
  tagHardwareTypeId = null;
  @ViewChild('tagSelected') private readonly tagSelected: MatOption;
  createThresholdList: any=[];
  constructor(public form: FormBuilder, private readonly configurationService: ConfigurationService, private readonly commonService: CommonService, @Inject(MAT_DIALOG_DATA) public data: any,public thisDialogRef: MatDialogRef<ThresholdComponent>, private readonly toastr: AppToastService,
              private readonly lookupService: LookupTermService) {
  }

  ngOnInit(){
    this.lookupService.getAppTermsWrapper('TagHardwareType,ReaderHardwareType').subscribe(res => {
      this.tagTypeList = res.TagHardwareType ?? [];
      this.hardwareTypeList = res.ReaderHardwareType ?? [];
    });
    this.thresholdForm = this.form.group({
      readerHardwareType : [null, [Validators.required]],
      reader : [[], [Validators.required]],
      tagHardwareType : [null, [Validators.required]],
    } )
    if(this.data?.id != null) {
      this.thresholdForm.controls['readerHardwareType'].setValue(this.data.hardwareTypeId);
      this.getReaders(this.data.hardwareTypeId);
      this.thresholdForm.controls['reader'].setValue([this.data.id]);
      this.getAllThresholdDetails()
    } else {
      this.addThreshold = true;
    }
  }
  selectedValue(option: any, data: any): boolean {
    return option && data ? option.id === data.id : option === data;
  }
  getAllThresholdDetails() {
    this.configurationService.getThresholdDetails(this.data.id).subscribe(res => {
      this.getAllThresholdList = res.results;
      this.getAllThresholdList.forEach((data) => {
        this.tagTypeList = this.tagTypeList.filter(x => data.tagHardwareTypeId.indexOf(x.code) === -1)
      });
      this.thresholdList = this.getAllThresholdList.filter(res => res.tagHardwareTypeId === this.getAllThresholdList[0].tagHardwareTypeId);
      if (this.thresholdList.length > 0) {
        this.hardwareTypeThresholdId = this.thresholdList[0].hardwareTypeThresholdId;
        this.readerId = this.thresholdList[0].readerId;
        this.selectThreshold = this.thresholdList[0].tagHardwareTypeId;
        this.thresholdList = this.thresholdList[0].thresholdValueJson;
        this.getTagList = this.thresholdList[0].value;
        this.getReaderList = this.thresholdList[1].value;
      }
    });
  }
  onWindowResizedWidth(size) {
    this.popWidth = size;
  }
  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 160;
  }
  getTagType(data, key?: any){
    let tags = null;
    let tagType = [];
    this.createThresholdList = [];
    tags = this.thresholdForm.controls['tagHardwareType'].value;
    if(tags !== null) {
      tagType = tags.filter(x => data.indexOf(x) > -1)
    }
    if(key === 'Tag' && tagType.length === 0) {
      this.addThreshold = false;
    } else {
      this.addThreshold = true;
      const list = this.getAllThresholdList.filter(res => res.hasOwnProperty('hardwareTypeId'));
      if(this.data?.id) {
        list.forEach(threshold =>{
          const thresholdData = {
            "id": null,
            "readerId": this.data.id,
            "tagHardwareTypeId": threshold.tagHardwareTypeId,
            "thresholdValueJson": threshold.thresholdValueJson
          };
          this.createThresholdList.push(thresholdData);
        });
      } else {
        const reader = this.thresholdForm.controls['reader'].value;
        reader.forEach(id => {
          list.forEach(threshold =>{
            const thresholdData = {
              "id": null,
              "readerId": id,
              "tagHardwareTypeId": threshold.tagHardwareTypeId,
              "thresholdValueJson": threshold.thresholdValueJson
            };
            this.createThresholdList.push(thresholdData);
          });
        })
      }
    }
    this.thresholdList = this.getAllThresholdList.filter(res => res.tagHardwareTypeId === data);
    if (this.thresholdList.length > 0) {
      this.hardwareTypeThresholdId = this.thresholdList[0].hardwareTypeThresholdId;
      this.readerId = this.thresholdList[0].readerId;
      this.selectThreshold = this.thresholdList[0].tagHardwareTypeId;
      this.thresholdList = this.thresholdList[0].thresholdValueJson;
      this.getTagList = this.thresholdList[0].value;
      this.getReaderList = this.thresholdList[1].value;
    }
  }
  getThresholdList(checked, data) {
    let hardwareTypeId = null;
    let readerVersionId = null;
    if(this.data?.id != null) {
      hardwareTypeId = this.data.hardwareTypeId;
    } else {
      hardwareTypeId = this.thresholdForm.controls['readerHardwareType'].value;
    }
    if(this.data?.readerVersionId != null) {
      readerVersionId = this.data.readerVersionId;
    }
    if(checked && data.code !== null) {
      this.selectThreshold = data.code;
      this.configurationService.getHardwareTypeThreshold(hardwareTypeId, data.code, readerVersionId).subscribe(res => {
        if(res.results.length !== 0) {
          this.addThreshold = true;
          res.results[0]['tagHardwareTypeId'] = data.code;
          res.results[0]['tagHardwareTypeName'] = data.value;
          this.getAllThresholdList.push(res.results[0]);
          this.getTagType(data.code);
        }
      });
    } else if(!checked && data.code !== null) {
      this.addThreshold = false;
      this.selectThreshold = this.getAllThresholdList[0].tagHardwareTypeId;
      this.getAllThresholdList = this.getAllThresholdList.filter(x => data.code.indexOf(x.tagHardwareTypeId) === -1);
      this.createThresholdList = this.createThresholdList.filter(x => data.code.indexOf(x.tagHardwareTypeId) === -1);
      this.thresholdList = this.getAllThresholdList.length ? this.getAllThresholdList[0] : [];
      if (this.thresholdList.length > 0) {
        this.hardwareTypeThresholdId = this.thresholdList[0].hardwareTypeThresholdId;
        this.readerId = this.thresholdList[0].readerId;
        this.selectThreshold = this.thresholdList[0].tagHardwareTypeId;
        this.thresholdList = this.thresholdList[0].thresholdValueJson;
        this.getTagList = this.thresholdList[0].value;
        this.getReaderList = this.thresholdList[1].value;
      }
    }
  }
  getReaders(type) {
    this.loading = true;
    const facilityId = localStorage.getItem(btoa('facilityId'));
    this.configurationService.getGatewayReader(type, facilityId).subscribe(res => {
      this.readerList = res.results;
      if (this.data?.id != null){
        this.readerList = this.readerList.filter(item => item.id === this.data.id)
      } else {
        this.thresholdForm.controls.reader.setValue([])
        this.thresholdForm.controls.tagHardwareType.setValue([])
        this.thresholdList = [];
      }
   this.loading = false;
    });
  }
  updateThresholdJson(option, type, id, value) {
    const list = option === 'tag' ? this.getTagList : this.getReaderList;
    const item = list.find(item => item.threshold == id);
    if (type === 'min') {
      item.min = value.toString();
      if (item.max > item.min) {
        item.max = (parseInt(item.min) + 2).toString();
      }
    } else {
      item.max = value.toString();
      if (item.max > item.min) {
        item.min = (parseInt(item.max) - 2).toString();
      }
    }
    this.thresholdList = this.getAllThresholdList.filter(res => res.tagHardwareTypeId === this.selectThreshold);
  }
  updateThreshold(data) {
    const thresholdData = [{
      "id": this.thresholdList[0].id,
      "readerId": data.id,
      "tagHardwareTypeId": this.thresholdList[0].tagHardwareTypeId,
      "thresholdValueJson": this.thresholdList[0].thresholdValueJson
    }]
    this.configurationService.postThresholdDetails(thresholdData).subscribe( res => {
      if (res.statusCode == 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
        this.getTagType(this.selectThreshold);
      }
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
  createThreshold() {
      this.configurationService.postThresholdDetails(this.createThresholdList).subscribe( res => {
        if (res.statusCode == 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
          this.getTagType(this.selectThreshold);
        }
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./reader.component.scss'],
})
export class ConnectivityComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  Readerconnectivity: any = [];
  selectedReader:any = []
  readerconnect = new FormControl();
  public connectivityForm  : FormGroup;
  Date:any = new Date()
  showPassword: any;
  hide = true;
  hidee = true;
  readertype = new FormControl(false);
  constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<ConnectivityComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,private readonly commonService: CommonService, private readonly lookupService: LookupTermService) { }

  ngOnInit() {
    this.getAppTerms();
    this.connectivityForm = this.form.group({
      readertype: ['', Validators.required],
      ap_ssid: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      ap_ssid_pwd: ['', [Validators.required, Validators.minLength(6)]]
    })

    this.selectedReader = []
    setTimeout(() => {
      this.editReader()
    }, 100)
    this.connectivityForm.get('readertype').valueChanges.subscribe(res => {
    this.data.Data = this.data.Data.filter(hdata => hdata.readerConnectivityTypeName === (res));
    this.data.Data.forEach(element => {
    this.selectedReader.push(element.macId)
      });

    });

  }
  editReader() {
    this.data.name.forEach(element => {
    this.selectedReader.push(element.readerName)
    this.Readerconnectivity = this.Readerconnectivity.filter(x => (x.code == element.readerConnectivityTypeId) || (x.code == 'RCT-DE'))
    this.Readerconnectivity.length > 1 ? this.connectivityForm.get('readertype').patchValue(this.Readerconnectivity[1].code) : this.connectivityForm.get('readertype').patchValue(this.Readerconnectivity[0].code)

    });
  }

  getAppTerms() {
    this.lookupService.getAppTermsWrapper('ReaderConnectivityType').subscribe(res => {
    this.Readerconnectivity = res.ReaderConnectivityType ?? [];
    });
  }

  publish() {
    let data = {
      topic: 'tw/cache/gw/<fid>',
      message: {
        "typ": "cache",
        "ctx": "connectivity",
        "operation": "modify",
        "dateTime": this.Date,
        "data": [
          {
            "readers": this.selectedReader,
            "type": this.connectivityForm.get('readertype').value,
            "ap_ssid": this.connectivityForm.get('ap_ssid').value,
            "ap_ssid_pwd": this.connectivityForm.get('ap_ssid_pwd').value

          }
        ],
        "event": {}
      }

    }
    this.commonService.savePublisMqtt(data).subscribe(res => {
    this.toastr.success('Success', `${res.message}`);
    this.thisDialogRef.close('confirm');
    },
    error => {
    this.toastr.error('Error', `${error.error.message}`);
    });
  }
  showHidePassword() {
    this.showPassword = !this.showPassword;
  }

  fixClick() {
    console.log('')
  }
}
