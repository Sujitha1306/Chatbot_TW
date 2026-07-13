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
import { Component, Input, OnInit, ViewChild, Inject } from '@angular/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators, FormControl,ValidationErrors } from '@angular/forms';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService } from '../../../shared';
import { CreateTag, EditTag, CreateAssociateTag } from '../configuration.model';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../asset/asset.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { ConfirmDialogComponent } from '../../../shared/modules/entry-component/layout-save/layout-save.component';
import { EntityGroupComponent } from '../../../shared/modules/entry-component/entity-group/entity-group.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  animations: [routerTransition()]
})
export class TagsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns: string[] = ['ID', 'Serial Number', 'Type', 'Associated Type', 'Associated ID', 'Associated Name','Current Location', 'Battery', 'Connectivity status', 'Status', 'isAssociated'];
  eventColumn = [];
  iconHeader = ['ID', 'isAssociated'];
  iconColumn = ['ID', 'Battery', 'isAssociated'];
  sortColumn = ['ID', 'isAssociated'];
  permissionControl = ['BT_ALLE','BT_CFTE'];
  permission = ['BT_ALLC','BT_CFTC'];
  public activate_btn: any = [];
  public maxHeight: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public applyFilterValue: any = null;
  height: number;
  width: number;
  tableData: any = [];
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
    { id: 'group', value: 'Group' },
  ];
  showAction2 = [
    { id: 'modify', value: 'Modify', permission: this.permissionControl },
    // { id: 'version', value: 'Upgrade Version' },
  ];
  showAction3 = [
    { id: 'modify', value: 'Modify', permission: this.permissionControl },
  ];
  public showActions = this.showAction1;
  filterValue: null;
  pageSize:number=50;
  pageStart:number=0;
  length:number=0;
  name =null;
  batteryData: any[];
  batteryPercentageDetail = [];
  public isLoading = false;
  AssociationType = null;
  Types = null;
  onStatus  = null;
  tagStateId  = null;
  public parentFilter = [
    {
      id: 'tagState',
      value: 'Status',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'tagType',
      value: 'TagType',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All']
    }, 
    {
      id: 'tagAssociationType',
      value: 'Associated Type',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All']
    }
  ]

  constructor(private readonly configurationService: ConfigurationService, public dialog: MatDialog,private readonly datePipe: DatePipe,
    public snackbar: MatSnackBar, public commonService: CommonService, private readonly lookupTermService: LookupTermService,
    private readonly route: ActivatedRoute) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getDynamicTableColumn()
  }

  ngOnInit() {
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
    this.getAppTeamsFilter('type');
  }

    getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('tag').subscribe((res) => {
      if(res.statusCode === 1){
        console.log(res.results)
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
      }
      this.getAllTag(true,null,this.pageStart,this.pageSize);
    });
  }

  getAppTeamsFilter(id) {
    if (id === "type") {
      this.lookupTermService.getAppTermsWrapper('Status,TagState,TagType,TagAssociationType').subscribe(res => {
        const filters = {
          status: res?.Status?.filter(x => ['ST-AT', 'ST-IA'].includes(x.code)) ?? [],
          tagState: res?.TagState ?? [],
          tagType : res?.TagType ?? [],
          tagAssociationType : res?.TagAssociationType ?? []
        };
        ['status', 'tagState', 'tagType','tagAssociationType'].forEach(group => {
          const parentFilter = this.parentFilter.find(filter => filter.id === group);
          if (parentFilter) {
            parentFilter.subFilters = filters[group];
          }
        });
      });
    }
  }

  onWindowResized(size) {
    this.height = size ;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
    this.getAllTag(false,this.applyFilterValue,this.pageStart,this.pageSize);
    }else if (this.applyFilterValue.length == 0){
    this.getAllTag(false,null,this.pageStart,this.pageSize,)}
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.selectedName = null;
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllTag(false,this.applyFilterValue,this.pageStart,this.pageSize);
  }

  getAllTag(routerEvent ?: boolean,name?: string,pageStart?:number,pageSize?:number) {
    this.isLoading = true;
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.devices.results;
      this.length = this.route.snapshot.data.devices.totalRecords;
      this.batteryData = this.route.snapshot.data.devices.results.map(item => item.serialNumber);
      const Columns = ['ID', 'serialNumber', 'tagTypeName', 'tagAssociationType', 'tagAssociationId', 'tagAssociationName','currentLocationName', 'batteryPercentage', 'status', 'statevalue','isAssociated'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      if (parseInt(localStorage.getItem('userlevel')) === 8) {
        for (let m in  this.tableData) {
          if (this.tableData[m]['tagAssociationType'] === 'Patient') {
            this.tableData[m]['tagAssociationType'] = 'Employee';
          }
        }
      }
      this.tableData.sort((a, b) => {
        return (b.isAssociated === true ? 1 : 0) - (a.isAssociated === true ? 1 : 0);
    });
    if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
      this.getBatteryPercentage();
    }
      this.isLoading = false;
    } else {
      this.configurationService.getAllTag(name, pageStart, pageSize, this.AssociationType, this.Types, this.onStatus, this.tagStateId).subscribe(res => {
        this.isLoading = true;
        this.batteryData = res.results.map(item => item.serialNumber);
        if (parseInt(localStorage.getItem('userlevel')) === 8) {
          for (let m in res.results) {
            if (res.results[m]['tagAssociationType'] === 'Patient') {
              res.results[m]['tagAssociationType'] = 'Employee';
            }
          }
        }
        this.length = res.totalRecords;
        if(res.results.length || !this.applyFilterValue) {
          this.tableData = res.results;
        }
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['ID', 'serialNumber', 'tagTypeName', 'tagAssociationType', 'tagAssociationId', 'tagAssociationName','currentLocationName','batteryPercentage', 'status', 'statevalue', 'isAssociated'];
        for (let i in Columns) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        this.tableData.sort((a, b) => {
          return (b.isAssociated === true ? 1 : 0) - (a.isAssociated === true ? 1 : 0);
      });
      if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
        this.getBatteryPercentage();
      }
        this.isLoading = false;
      });
    }
  }
   getBatteryPercentage() {
    let locfacility : any;
     locfacility = localStorage.getItem(btoa('facilityId')).split(',');
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const requestBody = { entityIds: this.batteryData, facilityList: locfacility, fromDate: currentDate}; 
    this.commonService.getTagBatteryStatus(requestBody).subscribe(res =>{
      this.batteryPercentageDetail = res.results;
      this.isLoading = true;
      for(let i in this.batteryPercentageDetail) {
        let index = this.tableData.findIndex(val => val.serialNumber == this.batteryPercentageDetail[i]['entityId']);
        if (this.tableData[index] != undefined) {
        this.tableData[index]['Battery'] = this.batteryPercentageDetail[i]['batteryValue'];
        this.tableData[index]['Connectivity status'] = this.batteryPercentageDetail[i]['statusValue'];
        } 
      }
      this.isLoading = false;
    });
   }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createTag('');
    } else if (event.data === 'group') {
      this.entityGroup();
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  manageGroupFilter(event) {
    const filterDataById = (id) => event.data.filter(item => item.id === id).map(item => item.data);
    const tagStateData = filterDataById('tagState');
    const statusData = filterDataById('status');
    const typeData = filterDataById('tagType');
    const associationData = filterDataById('tagAssociationType');
    this.onStatus = statusData.length ? statusData[0] : null;
    this.tagStateId = tagStateData.length ? tagStateData[0] : null;
    this.Types = typeData.length ? typeData : null;
    this.AssociationType = associationData.length ? associationData : null;
    if (this.onStatus === 'All') {
      this.onStatus = null;
    }
    if (this.tagStateId === 'All') {
      this.tagStateId = null;
    }
    this.getAllTag(false, null, this.pageStart, this.pageSize);
  }

  manageAction(value, data) {
    if (value === 'version') {
      this.upgradeVersion(data);
    } else if (value === 'modify') {
      this.createTag(data);
    }
  }

  eventAction(event) {
    if (event.key === 'isAssociated' || event.key === 'Serial Number') {
      this.createTag(event.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getAllTag(false, this.applyFilterValue, this.pageStart, event.data.pageSize);
    }
  }

  rowClick(data) {
    this.showActions = null;
    if (this.selectedName && data.serialNumber == this.selectedName.serialNumber) {
      this.showActions = this.showAction1;
      this.selectedName = null;
    } else {
      this.selectedName = data;
      if(data.tagTypeName == 'ID Card' || data.tagTypeName == 'Coaster') {
        this.showActions = this.showAction2;
      } else {
        this.showActions = this.showAction3;
      }
    }
  }

  public createTag(data) {
    this.showActions = null;
    this.selectedName = data.id;
    const dialogRef = this.dialog.open(CreateTagComponent, {
       data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
  entityGroup() {
    const dialogRef = this.dialog.open(EntityGroupComponent, {
      panelClass: ["medium-popup"], disableClose: true,
      data: { type : 'EGTI-TAG' },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }

  upgradeVersion(data) {
    this.showActions = null;
    const selctedData = data;
    const dialogRef = this.dialog.open(UpgradeVersionComponent, {
     data: selctedData, height: '220px', width: '450px',panelClass: ['custom-dialog-container'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.showActions = null;
      this.refreshPage();
    });
  }
}

@Component({
  selector: 'create-tag',
  templateUrl: './create-tag.component.html',
  styleUrls: ['./tags.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },],
})
export class CreateTagComponent implements OnInit {

  displayedColumns: string[] = ['id', 'name', 'type', 'from', 'to'];
  dataSource: MatTableDataSource<any>;
  selectedIndex = 0;
  tagTypeList: any[] = [];
  tagAssociatedList: any[] = [];
  searchList: any=[];
  data:any=null;
  public matcher = new ErrorStateMatcherService();

  @Input() max: Date | null;
  today = new Date();
  public tagForm: FormGroup;
  public assoicatedForm: FormGroup;
  public createTag: CreateTag;
  public editTag: EditTag;
  public associateTag: CreateAssociateTag;
  public tagAsType;
  public tagAsId;
  public isDisabled = false;
  public disableAssociateType = true;
  statusList: any[] = [];
  associateList: any[] =[{code: "TAT-AS", value: "Asset"}, {code: "TAT-PA", value: "Patient"}, {code: "TAT-PO", value: "Porter"}, {code: "TAT-TAG", value: "Tag"}, {code: "TAT-CP", value: "CareProvider"}, {code: "TAT-IN", value: "Infant"}, {code: "TAT-ST", value: "Staff"}, {code: "TAT-US", value: "User"}, {code: "TAT-EM", value: "Employee"}, {code: "TAT-RC", value: "Raw_Customer"}, {code: "TAT-VS", value: "Visitor"}, {code: "TAT-ID", value: "TemporaryIdCard"}, {code: "TAT-CS", value: "Consumer"}, {code: "TAT-MR", value: "MedicalRecord"}];

  public HardwareTypes: any;


  public perimeterBreachOption: Array<any> = [
    { code: true, value: 'ON' },
    { code: false, value: 'OFF' }];
  public patientVisitId = null;
  public associatedEnabled = false;
  public assoicatedName = null;
  public deviceAdditionalInfo = {};
  public tagCategoryList: any[] = [];
  public deviceType = null;
  requireTagMatchVal:any;
  public listItems : any;
  showForm: boolean = false;
  statusDetail: any;
  tagConfig: any;
  stateId: any;
  tagHistory: any=[];
  tagDisplayedColumns = ['Type', 'Identifier', 'Name', 'Created By', 'Modified By', 'Associated Time', 'Disassociated Time'];
  lengthAH: number;

  constructor(public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,private readonly datePipe: DatePipe,
    public thisDialogRef: MatDialogRef<CreateTagComponent>, private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService, @Inject(MAT_DIALOG_DATA) public dataValue: any, private readonly dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog, private readonly lookupTermService: LookupTermService ) {
    this.getTagType('TagType');
    this.commonService.getConfigFile('tag-config').subscribe(res => {
      if(res.results) {
        this.tagConfig = res.results.contentObject;
      }
    });
    this.today.setDate(this.today.getDate());
    this.lookupTermService.getAppTermsWrapper('TagHardwareType').subscribe(res => {
      this.HardwareTypes = res?.TagHardwareType ?? [];
    });
    if (this.dataValue) {
      this.getTagAssociateType(this.dataValue.tagTypeId);
      this.tagAsType = this.dataValue.tagAssociationType;
      this.tagAsId = this.dataValue.tagAssociationId;
      this.getBasicInfo();
      if (this.dataValue.statusId === 'ST-AT') {
        this.disableAssociateType = false;
      }

      if (parseInt(localStorage.getItem('userlevel')) === 10 && this.dataValue.tagAssociationType === 'Asset') {
        this.dataValue.mainidentifier = this.dataValue.tagAssociationId;
      }
      this.getTagHistory(this.dataValue.serialNumber);      
    } else {
      this.buildForm();      
    }
  }

  ngOnInit() {
    this.getAppTerms();
  }

  getTagType(data) {
    this.lookupTermService.getAppTermsWrapper(data).subscribe(res => {
      this.tagTypeList = res?.TagType ?? [];
    });
  }

  getAppTerms() {
    this.lookupTermService.getAppTermsWrapper('Status,TagState').subscribe(res => {
      this.statusList = res?.Status;
      this.stateId = res?.TagState;
    });

  }

  getTagAssociateType(parentId) {
    this.deviceType = parentId;
    if (parentId == 'TT-IN') {
      this.lookupTermService.getAppTermsWrapper('TagCategory').subscribe(res => {
        this.tagCategoryList = res?.TagCategory ?? [];
      });
    } 

    if (parentId) {
      this.commonService.getAppTermsLink(parentId).subscribe(res => {
        this.tagAssociatedList = res.results.reverse();
      });
    }
  }
  getBasicInfo(){
    let id =this.dataValue.serialNumber;
    this.commonService.getBasicInfo(id).subscribe(res=>{
      this.data = res.results;
      if (this.data.statusId == 'ST-IA' || this.data.statusId == 'ST-AT' ){
        this.getStatusType();
      }
      this.buildForm();
    })
  }
  getStatusType(){
    let locfacility : any;
     locfacility = localStorage.getItem(btoa('facilityId')).split(',');
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const requestBody = { entityIds: [this.dataValue.serialNumber], facilityList: locfacility, fromDate: currentDate}; 
    this.commonService.getTagBatteryStatus(requestBody).subscribe(res =>{
      this.statusDetail = res.results;
      this.data.statusId = this.statusDetail[0]['statusCode'];
      this.buildForm();
    });
  }

  tabClick(event) {
    this.selectedIndex = event.index;
  }

  getAssociationTypeChange(data) {
    this.tagAsType = data;
    this.tagAsId = null;
    this.searchList = null;
  }
  getAssociateNameList(id: string) {
    if (id) {
      const associate = this as any as { id: string, mainidentifier: string, name: string, firstName: string, assetName: string }[]
      const associateId = (associate.find(obj => obj.id === id).mainidentifier ? associate.find(obj => obj.id === id).mainidentifier + ', ' : '') +
        (associate.find(obj => obj.id === id).firstName ? associate.find(obj => obj.id === id).firstName + ', ' : '') +
        (associate.find(obj => obj.id === id).assetName ? associate.find(obj => obj.id === id).assetName + ', ' : '') +
        (associate.find(obj => obj.id === id).name ? associate.find(obj => obj.id === id).name : '');
      return associateId
    } else {
      return ''
    }
  }
  searchAssociation(event) {
    this.assoicatedName = event.text;
    if (event.type === 'associateEntity' && event.text.length >= 2){
      if (event.toHit === true) {
        this.configurationServices.searchNonAssociate(this.tagAsType, event.text).subscribe(res => {
          this.listItems = res.results;
          this.searchList = this.listItems
          this.associatedEnabled = true;
        });
      } else {
        this.searchList =  this.listItems;
        this.associatedEnabled = true;
      }
    } else {
      this.searchList = [];
      this.associatedEnabled = false;
    }
  }

  onStatusChange(event) {
    if (this.data) {
      if (event === 'ST-AT' && this.data.tagAssociationId === null) {
        this.disableAssociateType = false;
        this.assoicatedForm.get('tagAssociationType').enable();
        this.assoicatedForm.get('tagAssociationId').enable();
      }
      else {
        this.disableAssociateType = true;
        this.assoicatedForm.get('tagAssociationType').disable();
        this.assoicatedForm.get('tagAssociationId').disable();
      }
    }
  }

  getAssociationDetail(id) {
    const assType = this.assoicatedForm.controls['tagAssociationType'].value;
    if (assType === 'Patient') {
      this.configurationServices.searchNonAssociate(this.tagAsType, this.assoicatedName).subscribe(res => {
        const patient = res.results.filter(resFilter => resFilter.id === id);
        this.patientVisitId = patient[0].patientVisitId;
      });
    }
  }
  getTagHistory(serialNumber) {
    this.configurationServices.getTagHistory(serialNumber).subscribe(res => {
      this.tagHistory = res?.results.reverse();
      this.lengthAH = res?.results?.length;
      const Columns = ['tagAssociationType', 'tagAssociationId', 'tagAssociationName', 'createUserName', 'modifiedUserName',  'tagLinkDurationFrom', 'tagLinkDurationTo'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tagHistory?.map(data => {
          data[this.tagDisplayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  public buildForm() {
    this.showForm = false;
    this.tagForm = this.form.group({
      tagCategoryId: [{value : this.data?.tagCategoryId ?? null, disabled: (this.dataValue && this.dataValue.tagAssociationType !== null)}],
      serialNumber: [this.data?.serialNumber ?? null, [Validators.required]],
      tagTypeId: [{ value: this.data?.tagTypeId ?? null, disabled: (this.dataValue && this.dataValue.tagAssociationType !== null)}, [Validators.required]],
      macId: [this.data?.macId ?? null, [Validators.required]],
      hwtype: [this.data?.hwtype ?? null, [Validators.required]],
      manufacturer: [this.data?.manufacturer ?? null],
      frequencyRange: [this.data?.frequencyRange ?? null],
      regulation: [this.data?.regulation ?? null],
      temperatureRange: [this.data?.temperatureRange?? null],
      warnOnPerimeterBreach: [this.data?.warnOnPerimeterBreach ?? false],
      lastSeenAt: [this.data?.lastSeenAt ?? null],
      swVersion: [this.data?.swVersion ?? null],
      batteryPercentage: [this.data?.batteryPercentage ?? null],
      batterySerialNumber: [this.data?.batterySerialNumber ?? null],
      batteryStatus: [this.data?.batteryStatus ?? null],
      comments: [this.data?.comments ?? null],
      status: [this.data?.statusId ?? null, [Validators.required]],
      stateId : [this.data?.stateId ?? null],

      billingType: [this.data?.deviceAdditionalInfo?.billingTypeId ?? null],
      valueStatus: [ this.data?.deviceAdditionalInfo?.valveStatusId ?? null],
      workingVoltage: [ this.data?.deviceAdditionalInfo?.voltage ?? null],
      installationMethod: [this.data?.deviceAdditionalInfo?.installationMethod ?? null],
      communication: [this.data?.deviceAdditionalInfo?.communication ?? null],
      communicationInterval: [ this.data?.deviceAdditionalInfo?.commInterval ?? null],
      gpsLocationCoordinates: [ this.data?.deviceAdditionalInfo ? JSON.parse(this.data?.deviceAdditionalInfo?.gpsLocationCoordinate) : null],
      currentLocation: [this.data?.deviceAdditionalInfo?.addressLine1 ?? null],
      measurementGrade: [ this.data?.deviceAdditionalInfo?.measurementGrade ?? null],
      grossWeight: [ this.data?.deviceAdditionalInfo?.grossWeight ?? null],
      size: [ this.data?.deviceAdditionalInfo?.size ?? null],
      environmentTemperature: [this.data?.deviceAdditionalInfo?.envTemperature ?? null],

    });
    if (this.data) {
      const tagAssociationName = this.data.mainidentifier ? (this.data.mainidentifier + ',' + this.data.tagAssociationName) : this.data.tagAssociationName ? this.data.tagAssociationName : this.data.tagTypeId === 'TT-AS' ? this.data.tagAssociationName : null;
      this.assoicatedForm = this.form.group({
        tagSerialNumber: [ this.data?.serialNumber ?? null],
        tagAssociationType: [{ value:  this.data?.tagAssociationTypeId ?? null, disabled: this.data.tagAssociationTypeId || this.disableAssociateType }, [Validators.required]],
        tagAssociationId: [{ value: tagAssociationName, disabled: (this.data.tagAssociationId || this.disableAssociateType) }, [Validators.required, this.requireTagMatch.bind(this)]],
        comments: [ this.data?.comments ?? null],
      });
      this.tagForm.controls.macId.setValue(this.data.macId);
      this.tagForm.controls.macId.updateValueAndValidity();
      this.tagForm.controls.hwtype.setValue(this.data.hwtype);
      this.tagForm.controls.hwtype.updateValueAndValidity();      
    }
    this.showForm = true;
  }

  requireTagMatch(control: FormControl): ValidationErrors | null {

    if (this.data.tagAssociationId == null && this.associatedEnabled === true) {
      if(control.value !== null && control.value !== '') {
      this.requireTagMatchVal = this.searchList.filter(resFilter => resFilter.id === control.value);
      if (this.requireTagMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }

  }

  public createAssociateTag() {
    const associateId = this.assoicatedForm.controls['tagAssociationId'].value;
    const tagAssociateTypeName = this.associateList.filter(val => val.code == this.assoicatedForm.controls['tagAssociationType'].value)[0]['value']
    this.associateTag = new CreateAssociateTag(null, null, null, null, null, null, null, null);
    this.associateTag.tagSerialNumber = this.data ? this.data.serialNumber : this.tagForm.controls['serialNumber'].value;
    this.associateTag.tagAssociationType = tagAssociateTypeName;
    this.associateTag.tagAssociationId = parseInt(associateId);
    this.associateTag.patientVisitId = this.patientVisitId;
    this.associateTag.tagAssociationTypeId = this.tagAsType;
    this.associateTag['tagTypeId'] = this.tagForm.controls.tagTypeId.value;
    console.log(this.associateTag);
    this.configurationServices.associateTag(this.associateTag).subscribe(res => {
      this.associatedEnabled = false;
      this.data.tagAssociationTypeId = this.assoicatedForm.controls.tagAssociationType.value;
      // this.updateAsTag(this.data.serialNumber);
      this.getTagHistory(this.data.serialNumber);
      this.toastr.success('Success', `${res.message}`);
    },
      error => {
        console.log('error----------->', error);
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  replaceAssociateTag() {
    const associateId = this.assoicatedForm.controls['tagAssociationId'].value;
    if (this.data.tagAssociationId != this.assoicatedForm.controls['tagAssociationId'].value) {
      this.associateTag = new CreateAssociateTag(null, null, null, null, null, null, null, null);
      this.associateTag.tagSerialNumber = this.data ? this.data.serialNumber : this.tagForm.controls['serialNumber'].value;
      this.associateTag.tagAssociationType = this.assoicatedForm.controls['tagAssociationType'].value;
      this.associateTag.tagAssociationId = parseInt(associateId);
      this.configurationServices.replaceAssociateTag(this.associateTag).subscribe(result => {

        this.updateAsTag(this.data.serialNumber);
        this.getTagHistory(this.data.serialNumber);
        this.toastr.success('Success', `${result.message}`);
      },
        error => {
          console.log(error.error.message);
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }
  removeAssociateTag() {
    if(this.data.tagAssociationTypeId == 'TAT-MR'){
      this.mrTagRemove()
    }else{
    this.associateTag = new CreateAssociateTag(null, null, null, null, null, null, null, null);
    this.associateTag.tagSerialNumber = this.data ? this.data.serialNumber : this.tagForm.controls['serialNumber'].value;
    this.associateTag['checkExistingAssignment'] = true;
    this.disAssociateWithConfirmation(this.associateTag);
  }
  }
  mrTagRemove() {
    let payload = {
      'files': [{
        'patientFileId': this.data.tagAssociationId,
        'tagId': this.data.serialNumber,
        'volume': null
      }],
      'patientId': null,
      'requestId': null
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: ['mdm-Confirmation-popup'],
      data: {
        title: 'Confirmation',
        message: 'Do you want to continue with the disassociation even though this device has an active?',
        buttonText: {
          ok: 'Yes',
          cancel: 'No'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        this.commonService.receiveVolume(payload).subscribe(res => {
          this.toastr.success('Success', `${res.message}`);
          this.assoicatedForm.controls.tagAssociationId.setValue(null);
          this.assoicatedForm.controls.tagAssociationType.setValue(null);
          this.assoicatedForm.controls.tagAssociationId.enable();
          this.assoicatedForm.controls.tagAssociationType.enable();
          this.data.tagAssociationTypeId = null;
          this.data.tagAssociationId = null;
        })
      } else {
        this.thisDialogRef.close('confirm');
      }
    });
  }
  disAssociateWithConfirmation(postData) {
    this.configurationServices.disassociateTag(postData).subscribe(resu => {
      this.toastr.success('Success', `${resu.message}`);
      this.assoicatedForm.controls.tagAssociationId.setValue(null);
      this.assoicatedForm.controls.tagAssociationType.setValue(null);      
      this.assoicatedForm.controls.tagAssociationId.enable();
      this.assoicatedForm.controls.tagAssociationType.enable();     
      this.data.tagAssociationTypeId = null;
      this.data.tagAssociationId = null;
    },
    error => {
      if(error.error.errorCode == 'TWAPI159') {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass:['mdm-Confirmation-popup'],
          data: {
            title: 'Confirmation',
            message: 'Do you want to continue with the disassociation even though this user has an active booking?',
            buttonText: {
              ok: 'Yes',
              cancel: 'No'
            }
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result == 'Yes') {
            postData['checkExistingAssignment'] = false;
            this.disAssociateWithConfirmation(postData);
          } else {
            this.thisDialogRef.close('confirm');
          }
        });
      } else {
        console.log(error);
        this.toastr.error('Error', `${error.error.message}`);
      }
    });
  }
  updateAsTag(serialNumber) {
    this.editTag = new EditTag(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editTag.serialNumber = this.tagForm.controls['serialNumber'].value;
    this.editTag.tagTypeId = this.tagForm.controls['tagTypeId'].value;
    this.editTag.macId = this.tagForm.controls['macId'].value;
    this.editTag.hwtype = this.tagForm.controls['hwtype'].value;
    this.editTag.manufacturer = this.tagForm.controls['manufacturer'].value;
    this.editTag.regulation = this.tagForm.controls['regulation'].value;
    this.editTag.frequencyRange = this.tagForm.controls['frequencyRange'].value;
    this.editTag.temperatureRange = this.tagForm.controls['temperatureRange'].value;
    this.editTag.warnOnPerimeterBreach = this.tagForm.controls['warnOnPerimeterBreach'].value;
    this.editTag.swVersion = this.tagForm.controls['swVersion'].value;
    this.editTag.batteryPercentage = this.tagForm.controls['batteryPercentage'].value;
    this.editTag.batterySerialNumber = this.tagForm.controls['batterySerialNumber'].value;
    this.editTag.batteryStatus = this.tagForm.controls['batteryStatus'].value;
    this.editTag.comments = this.tagForm.controls['comments'].value;
    this.editTag.tagCategoryId = this.tagForm.controls['tagCategoryId'].value ?? null;
    console.log('update tag ::', this.editTag);

    this.configurationServices.editTag(this.editTag).subscribe(res => {
      this.data = res.results;
      this.data['tagAssociationTypeId'] = this.assoicatedForm.controls.tagAssociationType.value;
      this.getTagDetail(this.data.serialNumber);
    });
  }
  getTagDetail(data) {
    this.configurationServices.getTagDetailById(data).subscribe(res => {
      this.data = res.results[0];
      this.data['tagAssociationTypeId'] = this.assoicatedForm.controls.tagAssociationType.value;
      if (parseInt(localStorage.getItem('userlevel')) === 10 && this.data.tagAssociationType === 'Asset') {
        this.data.mainidentifier = this.data.tagAssociationId;
      }
      this.buildForm();
    });
  }

  public saveTag() {
    this.isDisabled = true;

    this.createTag = new CreateTag(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createTag.serialNumber = this.tagForm.controls['serialNumber'].value;
    this.createTag.tagTypeId = this.tagForm.controls['tagTypeId'].value;
    this.createTag.macId = this.tagForm.controls['macId'].value;
    this.createTag.hwtype = this.tagForm.controls['hwtype'].value;
    this.createTag.manufacturer = this.tagForm.controls['manufacturer'].value;
    this.createTag.regulation = this.tagForm.controls['regulation'].value;
    this.createTag.frequencyRange = this.tagForm.controls['frequencyRange'].value;
    this.createTag.temperatureRange = this.tagForm.controls['temperatureRange'].value;
    this.createTag.warnOnPerimeterBreach = this.tagForm.controls['warnOnPerimeterBreach'].value;
    this.createTag.swVersion = this.tagForm.controls['swVersion'].value;
    this.createTag.batteryPercentage = this.tagForm.controls['batteryPercentage'].value;
    this.createTag.batterySerialNumber = this.tagForm.controls['batterySerialNumber'].value;
    this.createTag.batteryStatus = this.tagForm.controls['batteryStatus'].value;
    this.createTag.comments = this.tagForm.controls['comments'].value;
    this.createTag.status = this.tagForm.controls['status'].value;
    this.createTag.stateId = this.tagForm.controls['stateId'].value;
    this.createTag.tagCategoryId = this.tagForm.controls['tagCategoryId'].value ?? null
    this.deviceAdditionalInfo = {
      'billingTypeId': this.tagForm.controls['billingType'].value,
      'valveStatusId': this.tagForm.controls['valueStatus'].value,
      'voltage': this.tagForm.controls['workingVoltage'].value,
      'installationMethod': this.tagForm.controls['installationMethod'].value,
      'communication': this.tagForm.controls['communication'].value,
      'commInterval': this.tagForm.controls['communicationInterval'].value,
      'gpsLocationCoordinate': '[' + this.tagForm.controls['gpsLocationCoordinates'].value + ']',
      'addressLine1': this.tagForm.controls['currentLocation'].value,
      'measurementGrade': this.tagForm.controls['measurementGrade'].value,
      'grossWeight': this.tagForm.controls['grossWeight'].value,
      'size': this.tagForm.controls['size'].value,
      'envTemperature': this.tagForm.controls['environmentTemperature'].value
    };
    this.createTag.deviceAdditionalInfo = this.deviceAdditionalInfo;
    console.log('create tag ::', this.createTag);
    this.configurationServices.saveTag(this.createTag).subscribe(results => {
      if (results.statusCode != 1) {
        this.isDisabled = false;
      }

      this.toastr.success('Success', `${results.message}`);
      this.thisDialogRef.close('confirm');
    },
      err => {
        console.log(err.error.message);
        this.isDisabled = false;
        this.toastr.error('Error', `${err.error.message}`);
      });
  }

  public updateTag(serialNumber) {
    this.isDisabled = true;

    this.editTag = new EditTag(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editTag.serialNumber = this.tagForm.controls['serialNumber'].value;
    this.editTag.tagTypeId = this.tagForm.controls['tagTypeId'].value;
    this.editTag.macId = this.tagForm.controls['macId'].value;
    this.editTag.hwtype = this.tagForm.controls['hwtype'].value;
    this.editTag.manufacturer = this.tagForm.controls['manufacturer'].value;
    this.editTag.regulation = this.tagForm.controls['regulation'].value;
    this.editTag.frequencyRange = this.tagForm.controls['frequencyRange'].value;
    this.editTag.temperatureRange = this.tagForm.controls['temperatureRange'].value;
    this.editTag.warnOnPerimeterBreach = this.tagForm.controls['warnOnPerimeterBreach'].value;
    this.editTag.swVersion = this.tagForm.controls['swVersion'].value;
    this.editTag.batteryPercentage = this.tagForm.controls['batteryPercentage'].value;
    this.editTag.batterySerialNumber = this.tagForm.controls['batterySerialNumber'].value;
    this.editTag.batteryStatus = this.tagForm.controls['batteryStatus'].value;
    this.editTag.comments = this.tagForm.controls['comments'].value;
    this.editTag.status = this.tagForm.controls['status'].value;
    this.editTag.stateId =  this.tagForm.controls['stateId'].value;
    this.editTag.tagCategoryId = this.tagForm.controls['tagCategoryId'].value ?? null;
    this.deviceAdditionalInfo = {
      'billingTypeId': this.tagForm.controls['billingType'].value,
      'valveStatusId': this.tagForm.controls['valueStatus'].value,
      'voltage': this.tagForm.controls['workingVoltage'].value,
      'installationMethod': this.tagForm.controls['installationMethod'].value,
      'communication': this.tagForm.controls['communication'].value,
      'commInterval': this.tagForm.controls['communicationInterval'].value,
      'gpsLocationCoordinate': '[' + this.tagForm.controls['gpsLocationCoordinates'].value + ']',
      'addressLine1': this.tagForm.controls['currentLocation'].value,
      'measurementGrade': this.tagForm.controls['measurementGrade'].value,
      'grossWeight': this.tagForm.controls['grossWeight'].value,
      'size': this.tagForm.controls['size'].value,
      'envTemperature': this.tagForm.controls['environmentTemperature'].value
    };
    this.editTag.deviceAdditionalInfo = this.deviceAdditionalInfo;

    this.configurationServices.editTag(this.editTag).subscribe(res => {
      if (res.statusCode != 1) {
        this.isDisabled = false;
      }

      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        console.log(error.error.message);
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: 'upgrade-version',
  templateUrl: './upgrade-version.component.html',
  styleUrls: ['./tags.component.scss'],

})
export class UpgradeVersionComponent  {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<UpgradeVersionComponent>, public dialog: MatDialog) { }

}
