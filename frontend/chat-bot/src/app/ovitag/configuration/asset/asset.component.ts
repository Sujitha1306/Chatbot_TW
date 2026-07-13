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
import { Component, OnInit, Input, Inject, Optional, ViewChild, ViewEncapsulation, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { routerTransition } from '../../../router.animations';
import { ConfigurationService, CommonService, WorkflowService } from '../../../shared';
import { CreateAsset } from '../configuration.model';
import { DomSanitizer , SafeResourceUrl} from '@angular/platform-browser';
import { environment } from './../../../../environments/environment';
import { CreateEntityRoutine } from '../../../shared/modules/entry-component/create-manage-routine/create-manage-routine.model';
import { PageEvent,MatPaginator } from '@angular/material/paginator';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { ActivatedRoute } from '@angular/router';
import { CoasterComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';
import { EntityGroupComponent } from '../../../shared/modules/entry-component/entity-group/entity-group.component';
import { combineLatest, Observable,Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import { SessionStorageService } from '../../../shared/services/session.storage.service';
import { ApptermsService } from '../../../shared/services/appterms.service';
import { ConfirmDialogComponent } from '../../../shared/modules/entry-component/layout-save/layout-save.component';
import { MatTabGroup } from '@angular/material/tabs';
import { AppToastService } from '../../../shared/services/toaster.service';
import { CreateManageRoutineComponent } from '../../../shared/modules/entry-component/create-manage-routine/create-manage-routine.component';
import { LookupTermService } from '../../../shared/lookup-term.service';
import { TaskManagmentComponent } from '../../../shared/modules/entry-component/task-managment/task-managment.component';
import { CctvLocationPickerComponent, CctvLocationSelection } from './cctv-location-picker/cctv-location-picker.component';



export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
  animations: [routerTransition()],
  encapsulation: ViewEncapsulation.None,
})
export class AssetComponent implements OnInit {

  displayedColumns: string[] = ['Serial Number', 'Asset Name', 'Asset Type', 'Tag ID', 'Email', 'Contact', 'Status', 'isTagAssociated'];
  iconHeader = ['isTagAssociated'];
  iconColumn = ['isTagAssociated'];
  sortColumn = ['isTagAssociated'];
  eventColumn = ['Asset Name', 'isTagAssociated'];
  permissionControl = ['BT_ALLE', 'BT_CFAE'];
  permission = ['BT_ALLC','BT_CFAC'];
  tableData: any;

  loading = false;
  returnUrl: string;
  pageEvent: PageEvent;
  length: any;
  pageIndex: any;

  public pageStart = 0;
  public pageSize = 50;
  public rowData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any = null;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  name =null;
  showAction1 = [
    { id: 'create', value: 'Create' },
    { id: 'group', value: 'Group' },
  ];
  public showActions = this.showAction1;
  filterValue = null;
  position = null;

  constructor(
    private readonly configurationService: ConfigurationService,
    public dialog: MatDialog,
    public commonService: CommonService,
    private readonly route: ActivatedRoute,
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.getAllAssets(true,null,this.pageStart,this.pageSize);
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllAssets(false,this.applyFilterValue,this.pageStart,this.pageSize);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getAllAssets(false,this.applyFilterValue,this.pageStart,this.pageSize);
      }else if (this.applyFilterValue.length == 0){
        this.getAllAssets(false,null,this.pageStart,this.pageSize);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createAsset('', event);
    }else if (event.data === 'group') {
      this.entityGroup();
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'Asset Name') {
      this.createAsset(event.data, '');
    }  else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getAllAssets(false, this.applyFilterValue, this.pageStart, event.data.pageSize);
    }else {
      this.manageCoster(event.data);
    }
  }

  manageCoster(data) {
    data['workflowTypeId'] = 'WF-AST';
    data['associationId'] = data.id;
    data['associationTypeId'] = 'TAT-AS';
    data['associatedName'] = 'Asset';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      width: '95%',
      panelClass: ['custom-dialog-container2','popup-dialog-container'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }

  createAsset(rowData: any, event: any) {
    this.rowData = rowData;
    this.selectedName = rowData.id;
    const dialogRef = this.dialog.open(CreateAssetComponent,
      { data: rowData, panelClass: ['large-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }

  entityGroup() {
    const dialogRef = this.dialog.open(EntityGroupComponent, {
      panelClass: ["medium-popup"], disableClose: true,
      data: { type : 'EGTI-AS' },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
  rowClick(data) {
    this.selectedName = data.id;
  }


  public getAllAssets(routerEvent ?: boolean,name?: string,pageStart?:number,pageSize?:number) {
    this.selectedName = null;
    if (routerEvent) {
      this.tableData = this.route.snapshot.data.assets.results;
      this.length = this.route.snapshot.data.assets.totalRecords;
      const Columns = ['assetSerialNumber', 'assetName', 'assetTypeName', 'tagSerialNumber', 'assetAdminEmail',
      'assetAdminContactNo', 'status', 'isTagAssociated'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.tableData.sort((a,b) => {
        return (b.isTagAssociated === true ? 1 : 0) - (a.isTagAssociated === true ? 1 : 0);
      })
    } else {
      this.configurationService.getAllAssets(name, pageStart, pageSize).subscribe(res => {
        this.tableData = res.results;
        if(this.applyFilterValue !== null){
          this.applyFilterValue = this.applyFilterValue + ' ';
        }
        const Columns = ['assetSerialNumber', 'assetName', 'assetTypeName', 'tagSerialNumber', 'assetAdminEmail',
        'assetAdminContactNo', 'status', 'isTagAssociated'];
        if(res.results.length || !this.applyFilterValue) {
          this.length = res.totalRecords;
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        this.tableData.sort((a,b) => {
          return(b.isTagAssociated === true ? 1 : 0) - (a.isTagAssociated === true ? 1 : 0);
        })
      }});
    }
  }
}

@Component({
  selector: 'app-create-asset',
  templateUrl: './create-asset.component.html',
  styleUrls: ['./asset.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class CreateAssetComponent implements OnInit {

  assetDisplayedColumns: string[]=['Asset Id', 'Asset Name','Asset Type','linkedDateTime','linkedUserName','actions'];
  boundaryColumn = ['Location Name','Location Type', 'Parent Location Name', 'Action'];
  displayedColumn: string[] = ['Location','From Time','To Time', 'Duration'];
  transferdisplayedColumn: string[]=['Status','Event Status','Event Context', 'From','To','Event Time','Performed By','Comments'];
  dataSourceAsset = new MatTableDataSource<any>();
  assetTransferSource : any=[];
  datSourceMovementHistory: any=[];
  linkedAsset : Array<any> = [];
  tableData: any;
  formDate: any;
  type: any;
  pageSize:number =50;
  pageStart:number=0;
  length: number=0;
  sortColumn = [];
  iconColumn = [];
  iconHeader = [];
  eventColumn = [];
  permissionControl = ['TAT-US'];
  scheduleManagement = {
    'status': 'TW-SMU',
    'scheduleEntityType': 'EGTI-AS',
    'entityType': 'asset',
    'data': this.data,
    'enableClose': false
  }
  @ViewChild('paginatorAll') paginatorAll: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  updateIdentifier: any[] = [];
  assetIdentifier: Array<any> = [];
  public dateForm: FormGroup;
  public fromDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public toDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public dateFilter = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public isAddAsset: boolean =false;
  public isDeleted: boolean = false;
  public isEditAsset:boolean = false;
  public isAssetTable: boolean = false;
  attachFiles: Array<any> = [];
  @Input() max: Date | null;
  @Input() disableAction: boolean = false;
  today = new Date();
  assetTypes: any[] = [];
  costTypes: any[] = [];
  public locationlist: any;
  locationId: any = null;
  selectedCoordinates: string = null;
  cctvBlockId: string = null;
  cctvFloorId: string = null;
  searchBoundary : any = null;
  public selectedLocation: any = null;
  public isLocExist: boolean = false;
  public selectedIndex = 0;
  public assetForm: FormGroup;
  public createAsset: CreateAsset;
  public blankField: boolean;
  public blankField2: boolean;
  public isDisabled = false;
  public matcher = new ErrorStateMatcherService();
  public Criticality: any = [];
  public CalendarFreq: any = [];
  public WarrantyStatus: any = [];
  public assetTransferType: any = [];
  public assetCategory: any = [];
  public locationData:any = [];
  baseURL = environment.api_base_url_new + 'api/asset/asset-attachment-file';
  height: any;
  toHit = false;
  locationListRes: any;
  requireLocationMatchVal: any;
  public isAvailabilityCheck: boolean = false;
  public isChange: boolean = false;
  contentHeight: number;
  contentHeighttable: number;
  MHTcontentheight: number;
  userNameList=[];
  userEnabled : boolean = false;
  ownerNameList=[];
  ownerEnabled : boolean = false;
  MaintenanceDataSource: any = [];
  userHit: boolean=false;
  userHit1: boolean=false;
  public windWidth = window.innerWidth;
  public selectedSensorAction: string = 'SER-SU';
  public selectedTab: string;
  public sensorSummaryList: any;
  public sensorHistoryList: any;
  public sensorOptionList = [{'code': 'SER-SU', 'value': 'Summary'}, {'code': 'SER-HIS', 'value': 'History'}];
  SSDisplayedColumns: string[] = ["S.No", "sensorType","Category", "sensorName", "sensorValue", "time"];
  SSHDisplayedColumns: string[] = ["S.No", "sensorType","Category", "sensorName", "sensorValue", "time"];
  public summaryLength: any;
  public historyLength: any;
  public summaryPageStart = 0;
  public summaryPageSize = 10;
  public historyPageStart = 0;
  public historyPageSize = 10;
  public adminOwnerName :any;
  public assetUserName :any;
  public departmentList = [];
  public costDepartmentList = [];
  assets: { assetId: number, assetName: string, assetSerialNo: string,combinedAsset: string,assetType: string,assetTypeId: string}[]=[];
  public isLinkedAsset: boolean =false;
  public isPreviousExpanded : boolean = false;
  public isPanelExpanded : boolean = true;
  public isPanelExpanded1 : boolean = true;
  public childAssetTypeName = null;
  public childAssetTypeId = null;
  public childAssetId = null;
  public childAssetName = null;
  public combinedValue =null;
  loading =false;
  isWebRTC = false;
  ownerPermission:boolean;
  editPermission:boolean;
  assetLinked=false;
  public activate_btn: any = [];
  usefulLifeList=[]
  transferIconColumn =['Event Time']
  public locationIdentifierList:any;
  public locationDescriptionList:any;
  public matTabChangeSub : Subject<any> = new Subject();
  public startDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  public endDate = this._dateFormat.transform(new Date(), 'yyyy-MM-dd');
  inventoryDataSource = [];
  inventoryDisplayedColumns = ['batchId','requestId','deliveryRequestId','itemMasterId','itemMasterName','requestDateTime','requestUserName','unitCost','requestedQuantity','allocatedQuantity','deliveredDatetime','inventoryExpiryDate'];
  public inventorySelectedTab : string ='Consumed Items';
  inventoryItemDataSource = [];
  inventoryItemDisplayedColumns = ['itemNo','itemName','itemTypeName','itemCategoryName','totalQuantity'];
  inventorySelectedIndex = 0; 
  isInventoryDataSource = false;
  isNonEditable = false;
  public entityData = {"id":null,"entityId":this.data.id,"entityType":'Asset','entityDetails':this.data,'entityGroupTypeId':'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-AT'};
  public entityType = 'Asset';
  public formTemplateType = 'FTT-AT';
  public countrycodeList = [];
  public vendorCountryOptions: Observable<any>;
  public serviceCountryOptions: Observable<any>;
  public enableVendorContact =false;
  public enableServiceContact = false;
  public maintenanceData = null;
  public assetCategorySearch = new FormControl('');
  public filteredAssetCategory: any[] = [];
  public assetTypeSearch = new FormControl('');
  public filteredAssetTypes: any[] = [];
  DepreciationDisplayedColumns: string[] = ['sno','year','depreciationScope','bookValue','additionalCost','DepreciationValue','newBookValue'];
  depreciationTableData=[]
  expensesData = []
  computed = false;
  showAddFields: boolean = false;
  totalDepreciation: number = 0;
  finalBookValue: number = 0;
  depreciationType: []=[];
  AdditionalCostType: []=[];
  previousRowsCount = 0;
  termsList: any = [];
  majorTypes: any =[];
  minorTypes: any =[];
  statusList: any =[];
  additionalTableData : any = [];
  @ViewChild('infoPopupTemplate') infoPopupTemplate!: TemplateRef<any>;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  dialogRef!: MatDialogRef<any>;
  dropdownOptionsMap: { [dropdownListKey: string]: any[] } = {};
  updateLoader = false;
  statusMap = {};
  enableAssetStatus =[];
  excludeFields = [];
  disableEditPermission = true;
  tabOrder = [];
  manufacturerList = [];
  subAssetColumn: string[] = ['Item Id', 'Item Name', 'Type', 'Linked User Name', 'Linked Date Time' , 'Description', 'Action'];
  assetCoulmData = ["itemMasterId", "itemMasterName", "entityType", "modifiedBy", "modifiedOn","description", ""];
  subAssetData = []
  connectionProtocolList = []
  classificationList = [];
  connectivityStatus = [];
  operatingSystem = [] 
  connectivityData :any[] =[]
  itemList : any 
  assetitems : any 
  assetItemForm :FormGroup
  linkedAssetItems: any[];
  connectivityDetails: any =[]
  currencyLabel= null;
  modifyMandatoryFields =[];
  mandatoryFields = [];
  intendedSolutionTypes = [];
  selectedDate: any = null;
  selectedDateObj: any = null;
  assetCostDependentFieldsValidations = false
  constructor(
    public form: FormBuilder,
    public dialog: MatDialog,
    public toastr: AppToastService,
    @Optional() public thisDialogRef: MatDialogRef<CreateAssetComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly _dateFormat: DatePipe,
    private readonly sessionService:SessionStorageService,
    public apptermsService:ApptermsService,
    public workflowService : WorkflowService,
    public lookupService : LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.today.setDate(this.today.getDate());
    this.buildForm();
    this.getAssetConfig();
  }

  ngOnInit() {
    this.loading = true;
    this.selectedIndex = 0;
    if (this.data?.id && this.data?.assetTypeId === 'AT-CCTV') {
      this.selectedCoordinates = this.extractCctvCoordinates(this.data?.coordinates ?? null);
      this.locationId = this.data?.locationId ?? null;
      this.cctvBlockId = this.data?.blockId ?? null;
      this.cctvFloorId = this.data?.floorId ?? null;
      if (this.locationId) {
        this.initializeCctvLocationDisplay();
      }
    }
    for(let i=1 ; i<=15;i++){
      this.usefulLifeList.push(i)
    }
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.TabChange(event);
    });

    let initialassignedDepartment = this.assetForm.controls.assignedDepartmentId.value;
      this.assetForm.controls.assignedDepartmentId.valueChanges.subscribe((value) => {
      this.assetForm.controls.costCenterId.setValue(value);
        if (value === initialassignedDepartment) {
            initialOwnerDept = value;
            return;
          }
      this.userEnabled = false;
      this.userNameList =[];
      this.assetForm.controls.assetUserId.setValue(null);
    });

    let initialOwnerDept = this.assetForm.controls.ownerDepartmentId.value;
    this.assetForm.controls.ownerDepartmentId.valueChanges.subscribe((value) => {
      if (value === initialOwnerDept) {
          initialOwnerDept = value; 
          return;
        }
      this.ownerEnabled = false;
      this.ownerNameList =[];
      this.assetForm.controls.ownerId.setValue(null);
    });
    this.assetForm.controls.commissionedOn.valueChanges.subscribe(date => {
      this.assetForm.controls.commissionedOn.setValue(date, { emitEvent: false });
    });

    this.lookupService.getAppTermsWrapper('OperatingSystem,ConnectionProtocol,ConnectivityStatus,IntendedSolutionType').subscribe(res =>{
         this.operatingSystem = res?.OperatingSystem ?? [];
         this.connectionProtocolList = res?.ConnectionProtocol ?? [];
         this.connectivityStatus = res?.ConnectivityStatus ?? [];
         this.intendedSolutionTypes = res?.IntendedSolutionType ?? [];
     })

    this.lookupService.getAppTermsWrapper('CountryCode,AssetCategory,Criticality,WarrantyStatus,CostType,RiskClassification').subscribe(res => {
      this.countrycodeList = res?.CountryCode ?? [];
      if (!this.data) {
        this.apptermsService.setDefaultValue(this.assetForm, 'vendorCountryCode', this.countrycodeList, 'code');
        this.apptermsService.setDefaultValue(this.assetForm, 'serviceCountryCode', this.countrycodeList, 'code');
      }
      this.vendorCountryOptions = this.FilteredOptions('vendorCountryCode');
      this.serviceCountryOptions = this.FilteredOptions('serviceCountryCode');
      this.assetCategory = res?.AssetCategory.filter(x => x.code !== 'ASC-ALS' && x.code !== 'ASC-BLS')
      .map(x => ({ code: x.code, value: x.value, isDefault: x.isDefault })) ?? [];
      if (this.data?.assetCategoryId) {
        const match = this.assetCategory.find(cat => cat.code === this.data.assetCategoryId);
        if (!match) {
          this.assetCategory.unshift({code: this.data.assetCategoryId, value: this.data.assetCategoryName || this.data.assetCategoryId});
        }
      }else{
        const termsList = this.termsList?.length
        if(termsList === 0 && !this.data){
          this.apptermsService.setDefaultValue( this.assetForm,'assetCategoryId',this.assetCategory ,'code');
        }
      }
      this.filteredAssetCategory = [...this.assetCategory];
      this.Criticality = res?.Criticality ?? [];
      this.WarrantyStatus = res?.WarrantyStatus ?? [];
      this.classificationList = res?.RiskClassification ?? [];
      if(!this.data){
        this.apptermsService.setDefaultValue( this.assetForm,'criticalityId',this.Criticality ,'code');
      }
      this.costTypes = res?.CostType ?? [];
      if(!this.data){
        this.apptermsService.setDefaultValue( this.assetForm,'costTypeId',this.costTypes,'code');
      }
    });
    this.loadManufactures();
    this.assetForm.get('manufacturer')!.valueChanges.pipe(debounceTime(300),distinctUntilChanged()).subscribe(text => {
      this.loadManufactures(text);
    });

    this.thisDialogRef.keydownEvents().subscribe(result => {
      if(result.key === "Escape"){
        this.thisDialogRef.close();
        this.onDialogClose();
      }
    });
    this.assetForm.controls['assetCost'].valueChanges.subscribe(value => {
          this.depreciationTableData[0].bookValue = value ? parseFloat(value?.toString()?.replace(/,/g, '')) : null;
          this.depreciationTableData[0].newBookValue = (this.depreciationTableData[0].bookValue + this.depreciationTableData[0].additionalCost) - this.depreciationTableData[0]?.depreciationValue;
     })
     this.assetForm.controls['additionalCost'].valueChanges.subscribe(value => {
          this.computeDepreciation();
     })
     this.assetForm.controls['usefulLife'].valueChanges.subscribe(value => {
          this.data.usefulLife = value
     })
     this.assetForm.controls['depreciationPercent'].valueChanges.subscribe(value => {
          this.data.depreciationPercent = value
     })
  }

  loadManufactures(text?){
    this.commonService.getManufacturerList(text).subscribe(res => {
      this.manufacturerList = res.results || [];
    })
  }

  selectTabByLabel(label) {
    const tabNames = this.tabGroup._tabs.toArray();
    const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
    if (index >= 0) {
      this.selectedIndex = index;
      this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
    }
  }

  getAssetConfig() {
    this.loading =true;
    this.configurationServices.getConfigFile('asset-config').subscribe(res => {
      const config = res.results?.contentObject;
      this.disableEditPermission =config?.disableEditPermission ?? true;
      if(config){
        this.handleIdGeneration(config);
        this.handleOwnerOnlyModify(config);
        this.handleEditAssignedDetails(config);
        this.assetStatusHandling(config);
        this.loadMatTabList(config);
        this.excludeFields = config?.excludeFields;
        this.currencyLabel = config?.currencyLabel?.[0] ??'INR';
        this.assetCostDependentFieldsValidations = config?.financialTabValidations ?? false;
        this.applyModifyMandatoryFields(config);
        this.applymandatoryFields(config);
        if (Array.isArray(config?.termsList) && config?.termsList.length > 0) {
          this.handleTermsList(config);
        } else {
          this.loadAssetCategoryBasedAssetTypes();
        }
      } else{
        this.loadMatTabList();
        this.loadAssetCategoryBasedAssetTypes();
        this.excludeFields =[];
        this.currencyLabel ='INR';
      }
    });
  }
  private handleIdGeneration(config: any): void {
    if (!this.data && config.isIdGenerate === true && this.termsList?.length === 0) {
      const categoryBasedId = config?.canGenerateCategoryBased ?? true;
      if (categoryBasedId) {
        this.assetForm.get('assetCategoryId')?.valueChanges.pipe(filter(v => v != null),switchMap(categoryId =>
              this.commonService.getAssetSerialNumber(categoryId)
            )
          ).subscribe(res => {
            this.assetForm.controls.assetSerialNumber.setValue(res.results);
          });
      }
      else {
        this.assetForm.get('assetCategoryId')?.valueChanges.subscribe(() => {
          this.assetForm.controls.assetTypeId.setValue(null);
          this.assetForm.controls.assetSerialNumber.setValue(null);
        });

        combineLatest([
          this.assetForm.get('assetCategoryId')!.valueChanges,
          this.assetForm.get('assetTypeId')!.valueChanges
        ])
          .pipe(filter(([cat, type]) => cat != null && type != null),switchMap(([cat, type]) =>
              this.commonService.getAssetSerialNumber(cat,type)
            )
          ).subscribe(res => {
            this.assetForm.controls.assetSerialNumber.setValue(res.results);
          });
      }
    }
  }

  private handleOwnerOnlyModify(config: any): void {
    if (this.data && config.isOwnerOnlyModify) {
      this.ownerPermission = config.isOwnerOnlyModify;
      const userId = Number(localStorage.getItem(btoa('userId')));
      this.editPermission = this.adminOwnerName === null || userId === this.adminOwnerName;
    }
  }

  private handleEditAssignedDetails(config: any): void {
    if (config.hasOwnProperty('isEditAssignedDetails')) {
      this.isNonEditable = config.isEditAssignedDetails;
      const isAssetOwned = this.data?.id && this.data?.ownerdepartmentId;
      const ownedDepartmentId = this.assetForm.get('ownerDepartmentId')?.value;
      const userDeptId = Number(localStorage.getItem(btoa('departmentId')));

      if ((this.isNonEditable && isAssetOwned && userDeptId && ownedDepartmentId && userDeptId === ownedDepartmentId) || !isAssetOwned) {
        this.isNonEditable = false;
      }
    }
  }

  private handleTermsList(config: any): void {
    this.termsList = config.termsList;
    const firstField = this.termsList[0];
    const firstFieldName = firstField.formcontrolName;
    const firstFieldValue = this.data?.[firstFieldName];
    const firstApiKey = this.getApiKey(firstFieldName);

    this.fetchDropdownOptions(firstApiKey, firstField.dropdownList, undefined, (options: any[] = []) => {
      if (firstFieldValue) {
        const match = options.find(opt => opt.code === firstFieldValue);
        this.assetForm.get(firstFieldName)?.setValue(match ? match.code : firstFieldValue);
      }

      const secondField = this.termsList[1];
      const secondFieldName = secondField.formcontrolName;
      const secondApiKey = this.getApiKey(secondFieldName);

      this.fetchDropdownOptions(secondApiKey, secondField.dropdownList, firstFieldValue, () => {
        this.setupDynamicCascade();
        if (this.data) {
          const formPatchData = {
            assetTypeId: this.data?.assetTypeId,
            assetCategoryId: this.data?.assetCategoryId,
            assetCategory1Id: this.data?.assetCategory1Id,
            assetCategory2Id: this.data?.assetCategory2Id,
            ownerId: this.data?.ownerId ?? null,
            assetUserId: this.data?.assetUserId ?? null,
            status: this.data?.assetTransferTypeId ?? "ATT-AT",
            vendorCountryCode: this.getNumber(this.data.vendorContact, 0),
            vendorContact: this.getNumber(this.data.vendorContact, 1),
            serviceCountryCode: this.getNumber(this.data.serviceContact, 0),
            serviceContact: this.getNumber(this.data.serviceContact, 1),
          };

          this.assetForm.patchValue(formPatchData);
          this.loadDropdownsForEdit();
        }
      });
    });
  }

  private assetStatusHandling(config){
    const createStatus = config?.createAssetStatus?.[0] ?? 'ATS-REC';
    this.statusMap =config?.assetStatusMapping;
    const editAssetStatus = config.editAssetStatus;
    const defaultEditStatus = config.enableAssetStatus;
    const isEditEnabled = this.activate_btn.includes('BT_AM_EAS');
    this.enableAssetStatus = isEditEnabled ? editAssetStatus: defaultEditStatus;
    this.lookupService.getAppTermsWrapper('AssetStatus').subscribe(res => {
      if(this.data?.assetStatus && this.statusMap?.hasOwnProperty(this.data?.assetStatus) && this.statusMap[this.data?.assetStatus]) {
        this.statusList = res?.AssetStatus.filter(status => this.statusMap[this.data?.assetStatus].includes(status.code)) ?? [];
      }else {
        this.statusList = res?.AssetStatus.filter(status => status.code === createStatus) ?? [];
        this.assetForm.get('assetStatus')?.setValue(createStatus);
      }
      let assetStatusValue = this.assetForm.controls.assetStatus.value;
      if(this.enableAssetStatus?.includes(assetStatusValue)) {
        this.assetForm.get('assetStatus')?.enable();
      }else {
        this.assetForm.get('assetStatus')?.disable();
      }
    })
  }

  private loadMatTabList(config?){
    if (config?.tabOrder?.length >0) {
      this.tabOrder = config.tabOrder;
    } else {
      this.tabOrder =  ['Basic Details','Financial','Identifier','Maintenance','Ticket','WorkOrder','Form','KPI','Assigned','Movement','Status History','Documents','Sensor','Linked Assets','Audit','Alert','Inventory'];
    }
    this.selectedTab = this.data?.selectedTab && this.tabOrder?.includes(this.data.selectedTab) ? this.data.selectedTab : this.tabOrder[0];
      setTimeout(() => {
        this.selectTabByLabel(this.selectedTab);
      })
  }

  private applyModifyMandatoryFields(config: any): void {
    if (this.data && config?.modifyMandatoryFields?.length > 0) {
      this.modifyMandatoryFields = config.modifyMandatoryFields;
      for (const field of this.modifyMandatoryFields) {
        const control = this.assetForm.get(field);
        if (control) {
          const existingValidators = control.validator ? [control.validator] : [];
          control.setValidators([...existingValidators, Validators.required]);
          control.updateValueAndValidity();
        }
      }
    }
  }

  private applymandatoryFields(config: any): void {
    if (config?.mandatoryFields?.length > 0) {
      this.mandatoryFields = config.mandatoryFields;
      for (const field of this.mandatoryFields) {
        const control = this.assetForm.get(field);
        if (control) {
          const existingValidators = control.validator ? [control.validator] : [];
          control.setValidators([...existingValidators, Validators.required]);
          control.updateValueAndValidity();
        }
      }
    }
  }

  loadAssetCategoryBasedAssetTypes() {
    const assetCategoryControl = this.assetForm.get('assetCategoryId');
    const assetTypeControl = this.assetForm.get('assetTypeId');
    const category = this.data?.assetCategoryId ?? assetCategoryControl?.value;
    const getAssetTypes = (category: any) => {
      const handleResult = (results: any[]) => {
        this.assetTypes = results.map(({ code, value, isDefault }) => ({ code, value, isDefault }));

        if (this.data?.assetTypeId) {
          const match = this.assetTypes.find(type => type.code === this.data.assetTypeId);
          if (!match) {
            this.assetTypes.unshift({
              code: this.data.assetTypeId,
              value: this.data.assetTypeName || this.data.assetTypeId
            });
          }
        } else {
          const type = 'assetTypeId';
          if(!this.data){
           this.apptermsService.setDefaultValue( this.assetForm,type,this.assetTypes,'code');
          }
        }

        this.filteredAssetTypes = [...this.assetTypes];

        if (this.data?.assetTypeId) {
          assetTypeControl?.setValue(this.data.assetTypeId);
        }
      };

      if (category === null || category === undefined) {
        this.commonService.getAppTerms('AssetType').subscribe(res => handleResult(res.results));
      } else {
        this.commonService.getAppTermsLink(category, 'AssetType').subscribe(res => handleResult(res.results));
      }
    };

    getAssetTypes(category);

    assetCategoryControl?.valueChanges.pipe(distinctUntilChanged()).subscribe(newCategory => {
        getAssetTypes(newCategory);
        assetTypeControl?.setValue(null);
      });

    this.filteredAssetCategory = [...this.assetCategory];

    this.assetCategorySearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filteredAssetCategory = this.assetCategory?.filter(asset =>
          asset.value.toLowerCase().includes(lower)
        );
      });

    this.assetTypeSearch.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.filteredAssetTypes = this.assetTypes?.filter(type =>
          type.value.toLowerCase().includes(lower)
        );
    });
  }

  setupDynamicCascade() {
    for (let i = 1; i < this.termsList.length; i++) {
      const parent = this.termsList[i - 1];
      const child = this.termsList[i];

      const parentControl = this.assetForm.get(parent.formcontrolName);
      const childControl = this.assetForm.get(child.formcontrolName);

      if (parentControl && childControl) {
        parentControl.valueChanges.subscribe(parentValue => {
          if(parentControl.value != null || parentControl.value != undefined){
          childControl.setValue(null);
          this.fetchDropdownOptions('AssetCategory', child.dropdownList, parentValue);
          }
        });
      }
    }
  }

  loadDropdownsForEdit() {
    for (let i = 1; i < this.termsList.length; i++) {
      const parent = this.termsList[i - 1];
      const child = this.termsList[i];

      const parentVal = this.assetForm.get(parent.formcontrolName)?.value;
      const childControl = this.assetForm.get(child.formcontrolName);
      const childVal = childControl?.value;

      if (parentVal != null || parentVal != undefined) {
        this.fetchDropdownOptions('AssetCategory', child.dropdownList, parentVal, () => {
          if (childVal) {
            childControl.setValue(childVal, { emitEvent: false });
          }
        });
      }
    }
  }

  fetchDropdownOptions(apiKey: string,listKey: string,parentCode?: string,cb?: (options?: any[]) => void) {
    const req$ = parentCode? this.commonService.getAppTermsLink(parentCode, apiKey): this.commonService.getAppTerms(apiKey);

    req$.subscribe(res => {
      const results = res.results || [];
      this.dropdownOptionsMap[listKey] = results;
      if (cb) cb(results);
    });
  }

  getApiKey(controlName: string): string {
    return controlName.replace(/Id$/, '').replace(/^[a-z]/, ch => ch.toUpperCase());
  }

  onAssetCategoryOpened(opened) {
    if (opened) {
      this.filteredAssetCategory = this.assetCategory;
    }
  }

  onAssetTypeOpened(opened) {
    if (opened) {
      this.filteredAssetTypes = this.assetTypes;
    }
  }

  onDialogClose(){ // To trigger delete existing data in angular service 
    this.sessionService.deleteAttachFiles()//clear attachment data after dialog close
    this.sessionService.deleteIdentifier()//clear identifier data after dialog close
  }
  cancelAction(){
       const dialogRef = this.dialog.open(ConfirmDialogComponent, {
         panelClass: ['mdm-Confirmation-popup'], disableClose: true,
         data: {
           title: 'Confirmation',
           message: 'Are you sure want to close the dialog?',
           buttonText: { ok: 'Yes', cancel: 'No' },
         }
       });
       dialogRef.afterClosed().subscribe(result => {
            if (result == 'Yes') {
              this.thisDialogRef.close();
              this.onDialogClose();
            }
       })
  }

  onWindowResized(size) {
    this.contentHeight = size - 55;
    this.contentHeighttable = size -310
    this.MHTcontentheight = size - 200
  }

  FilteredOptions(fieldName) {
    return this.assetForm.controls[fieldName].valueChanges.pipe(
      startWith(''),
      map(value => {
        if (!value) {
          return this.countrycodeList;
        }
        return this.countrycodeList.filter(country => country.code.includes(value));
      })
    );
  }

  getDepartmentList(){
    this.configurationServices.getAssetDepartment().subscribe(res => {
      this.departmentList = res.results.map(({ id, name ,departmentType}) => ({ id, name,departmentType }));
      this.costDepartmentList = this.departmentList.filter(item=>item.departmentType === 'DPT-CCR');
    });
  }
  getGoHistoryData(){
    this.getMovementHistoryData(this.formDate, this.toDate, this.data.id,"TAT-AS", this.pageStart, this.pageSize);
  }

  
  getAllTransfer(){
    this.getAssetTransfer(this.data.id,this.pageStart,this.pageSize)
  }
  getAssetTransfer(id,pageStart,pageSize){

    this.commonService.getAssetTransfer(id,pageStart,pageSize).subscribe(res => {
      if (res.statusCode == 1) {
        this.assetTransferSource = res.results.reverse();
        this.length = res.totalRecords;
        this.tableData=this.assetTransferSource;
        const columns = ['transferStatusName','eventStatus','idValue','sourceIdentifierName','identifierName','eventTime', 'userName', 'comments'];
        for (let i = 0; i <= columns.length; i++) {
          this.tableData.map(data => {
            let value = data[columns[i]];
            if (columns[i] !== 'eventTime') {
              data[this.transferdisplayedColumn[i]] =
                value === null || value === undefined || value === ''? 'N/A': value;
            } else {
              data[this.transferdisplayedColumn[i]] = value;
            }
          });
        }
      }
    });
  }
  eventAction(event,component){
    if(event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    }
    if (component ==='movement'){
    this.getMovementHistoryData(this.formDate, this.toDate, this.data.id,"TAT-AS", this.pageStart, this.pageSize)
    }else if (component ==='transfer'){
      this.getAssetTransfer(this.data.id,this.pageStart,this.pageSize)
    }
  }

  getMovementHistoryData(formDate?: any, toDate?: any, id?: any, type?: any, pageStart?, pageSize?){
    this.loading = true;
    const fromDate = this.dateForm.controls['fromDate'].value;
    this.fromDate = this._dateFormat.transform(new Date(fromDate), 'yyyy-MM-dd');
    this.toDate = this._dateFormat.transform(new Date(this.dateForm.controls['toDate'].value), 'yyyy-MM-dd');
    this.configurationServices.getAllMovementHistory(this.fromDate,this.toDate,this.data.id,"TAT-AS",this.pageStart, this.pageSize).subscribe(res =>{
      if(res.statusCode == 1 && res.results.data.hasOwnProperty('Location History')) {
      this.tableData = res.results.data['Location History'];
      this.length = res.results.data['Location History'].length;
      this.datSourceMovementHistory = this.tableData;
      const columns = ['Location Name','From Date','To Date', 'Duration']
      for (let i = 0; i <= columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumn[i]] = data[columns[i]];
          if(columns[i] == 'Location Name') {
            data[this.displayedColumn[i]] = data[columns[i]] + ', '+data['Floor Name'];
          }
        });
      }
      }
      this.loading=false;
    });
  }

  getLocationList(id) {

    if (id !== null) {
      const location = this as any as { id: string, fullName: string }[];
      if (location?.length) {
        const locationId = location.find(obj => obj.id === id).fullName;
        return locationId;
      }
    }
    return '';
  }

  deleteData(data){
    if (data==='commissionedOn'){
      this.assetForm.controls.commissionedOn.setValue(null);
    }else if(data==='endDate'){
      this.assetForm.controls.endDate.setValue(null);
    }else if(data==='poDate'){
      this.assetForm.controls.poDate.setValue(null);
    }else if(data==='expArrvgDate'){
      this.assetForm.controls.expArrvgDate.setValue(null);
    }else if(data==='delvryDate'){
      this.assetForm.controls.delvryDate.setValue(null);
    }
    else if(data==='ownerId'){
      this.userHit=true;
      this.ownerNameList = [];
      this.assetForm.controls.ownerId.setValue(null);
    }else if(data==='assetUserId'){
      this.userHit1=true;
      this.userNameList = [];
      this.assetForm.controls.assetUserId.setValue(null);
    }
  }

  searchLocationlist(event: any, field: string) {
    this.toHit = event.toHit;
    this.isChange = false;
    let assetType = this.assetForm.controls['assetTypeId'].value;
    this.isAvailabilityCheck = assetType === 'AT-MB';
  
    if (event.text.length >= 2) {
      if (this.toHit) {
        this.configurationServices.getLocationData(event.text, this.isAvailabilityCheck).subscribe(res => {
          if (res.results.length === 0) {
            this.blankField = true;
            this.blankField2 = true;
          } else {
            this.locationlist = res.results;
            this.locationIdentifierList = this.locationlist.map(loc => loc.locationIdentifier).filter(Boolean);
            this.locationDescriptionList = this.locationlist.map(loc => loc.fullName);
            this.assetForm.controls.locationIdentifier.setValidators(
              this.locationIdentifierValidator(this.locationIdentifierList)
            );
            if(this.assetForm.controls['assetTypeId']?.value != 'AT-CCTV'){
            this.assetForm.controls.locationDescription.setValidators(
              this.locationDescriptionValidator(this.locationDescriptionList)
            );}

            this.assetForm.controls.locationIdentifier.updateValueAndValidity();
            this.assetForm.controls.locationDescription.updateValueAndValidity();
          }
        });
        this.toHit = false;
      } else {
        this.blankField = false;
        this.blankField2 = false;
        this.locationlist = this.locationListRes;
      }
    } else {
      this.assetForm.controls.locationDescription.setValue(null);
      this.assetForm.controls.locationIdentifier.setValue(null);
      this.locationId = null ;
      this.locationIdentifierList = [];
      this.locationDescriptionList = [];
    }
  }
  
  getLocationID(locationID: any, isBoundary = false) {
    const selectedLocation = this.locationlist.find(loc => loc.id === locationID);
    if (isBoundary) {
      if (locationID === this.selectedLocation || this.locationData.find(val => val.locationId === locationID) != undefined) {
        this.isLocExist = true;
        this.assetForm.controls.searchLocation.setValue(null);
      } else {
        this.isLocExist = false;
      }
      if (locationID != null) {
        this.searchBoundary = locationID;
        this.selectedLocation = locationID;
      }
      this.blankField2 = false;
    } else {
      if (selectedLocation) {
        this.assetForm.controls.locationIdentifier.setValue(selectedLocation.locationIdentifier);
        this.assetForm.controls.locationDescription.setValue(selectedLocation.fullName);
      } else {
        this.assetForm.controls.locationDescription.setValue(null);
        this.assetForm.controls.locationIdentifier.setValue(null);
        this.locationId = null ;
      }
      this.blankField = false;
    }
  }
  
  onLocationIdentifierSelection(event) {
    const selectedIdentifier = event.option.value;
    const location = this.locationlist.find(loc => loc.locationIdentifier === selectedIdentifier);
    if (location) {
      this.assetForm.controls.locationDescription.setValue(location.fullName);
      this.locationId = location.id;
    } else {
      this.assetForm.controls.locationDescription.setValue(null);
      this.assetForm.controls.locationIdentifier.setValue(null);
      this.locationId = null ;
    }
    this.refreshLocationValidators();
  }
  
  onLocationNameSelection(event) {
    const selectedName = event.option.value;
    const location = this.locationlist.find(loc => (loc.fullName) === selectedName);
    if (location) {
      this.assetForm.controls.locationIdentifier.setValue(location.locationIdentifier);
      this.locationId = location.id;
    } else {
      this.assetForm.controls.locationDescription.setValue(null);
      this.assetForm.controls.locationIdentifier.setValue(null);
      this.locationId = null;
    }
    this.refreshLocationValidators();
  }

  openCctvLocationPicker() {
    const dialogRef = this.dialog.open(CctvLocationPickerComponent, {
      panelClass: ['large-popup'],
      disableClose: true,
      data: {
        locationId: this.locationId,
        coordinates: this.selectedCoordinates,
        blockId: this.cctvBlockId,
        floorId: this.cctvFloorId
      }
    });

    dialogRef.afterClosed().subscribe((result: CctvLocationSelection) => {
      if (result) {
        this.locationId = result.locationId;
        this.selectedCoordinates = result.coordinates;
        this.cctvBlockId = result.blockId;
        this.cctvFloorId = result.floorId;

        const displayValue = `X:${result.x}, Y:${result.y}`;

        this.assetForm.controls.locationDescription.setValue(displayValue);
        this.assetForm.controls.locationIdentifier.setValue(null);

        this.locationlist = [{
          id: result.locationId,
          fullName: result.locationName,
          locationIdentifier: null
        }];

        this.locationDescriptionList = [displayValue];
        this.locationIdentifierList = [];

        this.assetForm.controls.locationDescription.setValidators(
          this.locationDescriptionValidator([displayValue])
        );
        this.assetForm.controls.locationDescription.updateValueAndValidity();
      }
    });
  }

  refreshLocationValidators() {
    this.locationIdentifierList = this.locationlist.map(loc => loc.locationIdentifier).filter(Boolean);
    this.locationDescriptionList = this.locationlist.map(loc => loc.fullName);

    this.assetForm.controls.locationIdentifier.setValidators(
      this.locationIdentifierValidator(this.locationIdentifierList)
    );
    this.assetForm.controls.locationDescription.setValidators(
      this.locationDescriptionValidator(this.locationDescriptionList)
    );

    this.assetForm.controls.locationIdentifier.updateValueAndValidity();
    this.assetForm.controls.locationDescription.updateValueAndValidity();
  }
    
  locationIdentifierValidator(options: string[]){
    return (control): { [key: string]: any } | null => {
      if (!control.value || options.length === 0) return null;
      const valid = options.includes(control.value);
      return valid ? null : { invalidIdentifier: { value: control.value } };
    };
  }

  locationDescriptionValidator(options: string[]){
    return (control): { [key: string]: any } | null => {
      if (!control.value || options.length === 0) return null;
      const valid = options.includes(control.value);
      return valid ? null : { invalidDescription: { value: control.value } };
    };
  }

  initializeLocationFields(locationId){
    this.commonService.getLocationById(locationId).subscribe(res => {
        this.locationlist = [res.results];
        this.locationIdentifierList = this.locationlist?.map(loc => loc.locationIdentifier).filter(Boolean);
        this.locationDescriptionList = this.locationlist?.map(loc => loc.fullName);
        this.assetForm.controls.locationIdentifier.setValidators(this.locationIdentifierValidator(this.locationIdentifierList));
        this.assetForm.controls.locationDescription.setValidators(this.locationDescriptionValidator(this.locationDescriptionList));
        this.assetForm.controls.locationIdentifier.updateValueAndValidity();
        this.assetForm.controls.locationDescription.updateValueAndValidity();
    })
  }

  private extractCctvCoordinates(raw: string): string {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'number') {
        return raw;
      }
      if (parsed?.geometry?.coordinates?.[0] !== undefined) {
        const first = parsed.geometry.coordinates[0];
        if (typeof first === 'string') return first;
        if (Array.isArray(first) && first.length === 2) return JSON.stringify(first);
      }
    } catch {}
    return raw;
  }

  private initializeCctvLocationDisplay() {
    let displayValue: string = this.assetForm.controls.locationDescription.value;

    // If locationDescription wasn't persisted, derive the display text from coordinates.
    if (!displayValue && this.selectedCoordinates) {
      try {
        const coords = JSON.parse(this.selectedCoordinates);
        if (Array.isArray(coords) && coords.length === 2) {
          displayValue = `X:${coords[0]}, Y:${coords[1]}`;
          this.assetForm.controls.locationDescription.setValue(displayValue);
        }
      } catch {}
    }

    if (displayValue) {
      this.locationDescriptionList = [displayValue];
      this.locationlist = [{ id: this.locationId, fullName: displayValue, locationIdentifier: null }];
      this.assetForm.controls.locationDescription.setValidators(
        this.locationDescriptionValidator([displayValue])
      );
      this.assetForm.controls.locationDescription.updateValueAndValidity();
    }
  }
  
  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
  }
  
  TabChange(event) {
    this.selectedIndex = event.index;
    const tabs = this.tabGroup._tabs.toArray();
    this.tabOrder = tabs.map(t => t.textLabel?.trim());
    this.selectedTab = this.tabOrder[event.index];
    if (this.loading) {
      this.loading = false;
    }
    if(this.selectedTab === 'Basic Details' && this.data.id){
      if (this.data?.assetTypeId !== 'AT-CCTV') {
        this.locationId = this.data?.homeLocationId ?? null;
      }
      this.commonService.getAssetConnectivity(this.data.id).subscribe((res)=>{
        this.connectivityData = res.results;
        this.connectivityDetails = this.connectivityData;
        if (res.results?.length > 0) {
          const first = res.results[0];
          const proto = this.connectionProtocolList.find(p => p.code === first.connectionProtocolId);
          if (proto?.value?.toLowerCase() === 'webrtc') {
            this.isWebRTC = true;
            this.assetForm.patchValue({ connectionProtocolId: first.connectionProtocolId });
            try {
              const parsed = JSON.parse(first.outputData);
              this.assetForm.patchValue({
                streamName: parsed.streamName ?? '',
                streamUrl: parsed.streamUrl ?? ''
              });
            } catch {}
          }
        }
      });
    }

    if (this.selectedTab === 'Maintenance' && this.data.id) {
      this.handleMaintenanceTab();
      return;
    }

    if (this.selectedTab === 'Financial') {
      this.handleFinancialTab();
      return;
    }

    if (['Identifier', 'Ticket','WorkOrder', 'Form', 'Documents', 'Audit', 'Alert','KPI'].includes(this.selectedTab)) {
      this.handleEntityTabs();
      return;
    }

    if (this.selectedTab === 'Assigned') {
      this.getDepartmentList();
      return;
    }

    if (this.selectedTab === 'Movement' && this.data.id) {
      this.getGoHistoryData();
      return;
    }

    if (this.selectedTab === 'Status History' && this.data.id) {
      this.getAllTransfer();
      return;
    }

    if (this.selectedTab === 'Sensor') {
      this.handleSensorTab();
      return;
    }

    if (this.selectedTab === 'Linked Assets' && this.data.id) {
      this.ValueChangesonchild();
      this.getLinkedAssetDetails();
      return;
    }

    if (this.selectedTab === 'Inventory' && this.data.id) {
      this.handleInventoryTab();
      return;
    }
  }

  private handleMaintenanceTab(): void {
    this.maintenanceData = {
      tabType: 'Asset',
      entityType: 'Asset',
      entityId: this.data.id,
      entityName: this.data.assetName,
      titleName: 'Asset Routine',
      id: 'Asset'
    };
  }

  private handleFinancialTab(): void {
    this.lookupService.getAppTermsWrapper('DepreciationType,AdditionalCostType').subscribe(res => {
      this.depreciationType = res?.DepreciationType ?? [];
      this.AdditionalCostType = res?.AdditionalCostType ?? [];

      if (!this.data) {
        this.apptermsService.setDefaultValue(this.assetForm, 'depreciationTypeId', this.depreciationType, 'code');
        this.apptermsService.setDefaultValue(this.assetForm, 'typeId', this.AdditionalCostType, 'code');
      }
    });

    if (this.data) {
      this.commonService.getAdditionalCost(this.data.id).subscribe(res => {
        const totalCost = res.results.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
        this.assetForm.controls['additionalCost'].setValue(totalCost);
        this.additionalTableData = res.results;
      });

      this.commonService.getDepreciationSchedule(this.data.id).subscribe(res => {
        this.depreciationTableData = res.results.map((row, index) => {
          const fromYear = new Date(row.fromDate).getFullYear();
          const toYear = new Date(row.toDate).getFullYear();
          return {
            ...row,
            sno: index + 1,
            year: `${fromYear}-${toYear}`
          };
        });
        const fields = ['assetCost', 'usefulLife', 'depreciationTypeId', 'depreciationPercent', 'commissionedOn'];
        const allFilled = fields.every(field => this.assetForm.get(field)?.value !== null && this.assetForm.get(field)?.value !== '');
        if (allFilled) {
          this.computeDepreciation();
        }
      });

      this.commonService.getTicketExpensesDetails(this.data.id).subscribe(res => {
        this.expensesData = res.results;

        const totalCost = this.expensesData.reduce((sum, item) => {
          const deliveryDetails = item.deliveryDetails || [];
          const costSum = deliveryDetails.reduce((dSum, detail) => {
            const cost = detail.serviceCost !== null && detail.serviceCost !== ''
              ? detail.serviceCost
              : detail.deliveryDetailUnitCost;
            return dSum + (Number(cost) || 0);
          }, 0);
          return sum + costSum;
        }, 0);

        this.assetForm.controls['expenses'].setValue(totalCost);
        const fields = ['assetCost', 'usefulLife', 'depreciationTypeId', 'depreciationPercent', 'commissionedOn'];
        const allFilled = fields.every(field => this.assetForm.get(field)?.value !== null && this.assetForm.get(field)?.value !== '');
        if (allFilled) {
          this.computeDepreciation();
        }
      });
    }
  }

  private handleEntityTabs(): void {
    this.entityData = {
      id: null,
      entityId: this.data?.id ?? null,
      entityType: 'Asset',
      entityDetails: this.data?.id ? this.data : null,
      entityGroupTypeId: 'EGTI-AS',
      entityTypeId: 'TAT-AS',
      formTemplateType: 'FTT-AT',
    };
  }

  private handleSensorTab(): void {
    this.getSensorSummary(this.sensorOptionList[0].code);
  }

  private handleInventoryTab(): void {
    this.inventorySelectedTab = 'Inventory Details';
    this.getInventoryDetails();
    this.getInventoryItemDetails();
  }

  onInventoryTabChanged(event){
    this.inventorySelectedTab = event.tab.textLabel;
    this.inventorySelectedIndex = event.index;
    if (this.inventorySelectedTab==='Inventory Details'){
      this.getInventoryDetails();
      this.getInventoryItemDetails();
      this.isPanelExpanded = false
      this.isPanelExpanded1 = false    
    } else {
      this.getAssetItems()
    }
  }
  getInventoryItemDetails(){
    this.isInventoryDataSource = false;
    if(this.data.assetTypeId || this.data.modelId){
    this.commonService.getInventoryItemDetails(this.data.assetTypeId,this.data.modelId).subscribe(res=>{
      this.inventoryItemDataSource = res.results.filter(item => item.itemNo && item.itemName);
      this.isInventoryDataSource = true;
    })
  }
  }
  getLinkedAssetDetails() {
    this.commonService.getLinkedAsset(this.data.id).subscribe(res => {
      if(res.results.length > 0){
      this.linkedAsset = res.results;
      }
      this.dataSourceAsset = new MatTableDataSource(this.linkedAsset);
      if (this.dataSourceAsset.data.length > 0) {
        this.isAssetTable = true;
      }else{
        this.isAssetTable =false;
      }
    });
  }
  
   getAssetItems(){
     this.commonService.getEntityItems(this.data.id , 'Asset').subscribe(res => {
        this.subAssetData = res.results
        this.linkedAssetItems =  this.subAssetData
     })
   }

  removeSelectedRows(event, row?) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' },
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'Yes') {
        const index: number = this.linkedAsset.findIndex(d => d.childAssetSerialNumber === row.childAssetSerialNumber);
        if (this.dataSourceAsset.data[index].isNewlyLinked === null) {
          this.dataSourceAsset.data[index].isDeleted = true;
          this.saveAsset(this.data.id, 'Linked Assets');
        } else {
          this.dataSourceAsset.data.splice(index, 1);
        }
        this.dataSourceAsset = new MatTableDataSource(this.dataSourceAsset.data);
        this.isAssetTable = this.dataSourceAsset?.data?.length > 0;
        this.assetForm.controls['childAssetSerialNumber'].reset();
        this.childAssetId = null;
        this.childAssetName = null;
        this.childAssetTypeName = null;
        this.childAssetTypeId = null;
        this.isEditAsset = false;
        this.isDeleted = false;
      }
    })
  }

  getFileDownload(element){
    const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
      { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  getassetBoundary() {
    this.commonService.getLocationBoundary(this.data.id, 'TAT-AS').subscribe(res => {
      this.locationData = res.results;
      this.getboundaryColumn(this.locationData);
    });
  }
  getboundaryColumn(data){
    this.locationData = data;
    const Columns = ['locationName','locationTypeName', 'parentName', 'Action'];
    for(let i=0; i<= Columns.length; i++){
      this.locationData.map(data => {
        data[this.boundaryColumn[i]] = data[Columns[i]];
      });
    }
  }
  updateLocBoundary(id = null) {
    this.selectedLocation = null;
    let passData = {
      "associationId": this.data.id,
      "associationType": "TAT-AS",
      "facilityId" : localStorage.getItem(btoa('facilityId'))
    }
    if(id) {
      passData['toTime'] = this._dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      passData['isCurrent'] = false;
      this.commonService.removeLocationBoundary(id, passData).subscribe(res => {
        this.locationData = res.results;
        this.getboundaryColumn(this.locationData);
        this.searchBoundary = null;
        this.assetForm.controls.searchLocation.setValue(null);
        this.isLocExist = false;
      })
    } else {
      passData['locationId'] = this.searchBoundary;
      passData['fromTime'] = this._dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
      passData['isCurrent'] = true;
      this.commonService.saveLocationBoundary(passData).subscribe(res => {
        this.locationData = res.results;
        this.getboundaryColumn(this.locationData);
        this.searchBoundary = null;
        this.assetForm.controls.searchLocation.setValue(null);
      })
    }
  }

  public buildForm() {
    this.assetForm = this.form.group({
      assetSerialNumber: [this.data?.assetSerialNumber ?? null, [Validators.required, Validators.maxLength(64)]],
      assetName: [this.data?.assetName ?? null, [Validators.required]],
      assetTypeId: [this.data?.assetTypeId ?? null],
      commissionedOn: [this.data.commissionedOn ? new Date(this.data.commissionedOn) : null],
      locationDescription: [this.data?.locationDescription ?? null, [ this.requireLocationMatch.bind(this)]],
      costTypeId: [this.data?.costTypeId ?? null],
      status: [this.data?.assetTransferTypeId ?? "ATT-AT"],
      manufacturer: [this.data?.manufacturer ?? null, [Validators.maxLength(64)]],
      warrantyPeriod: [this.getWarrantyFieldValue(this.data?.warrantyPeriod,'warrantyPeriod')],
      warrantyFrequency:[this.getWarrantyFieldValue(this.data?.warrantyPeriod,'warrantyFrequency')],
      warrantyDue:[this.data?.warrantyDue ? new Date(this.data?.warrantyDue):null],
      warrantyStatus: [this.data?.warrantyStatus ?? null, [Validators.maxLength(64)]],
      nextAmcDue: [this.data?.nextAmcDue ?? null],
      endDate: [this.data?.endDate ?? null],
      softwareVersion: [this.data?.softwareVersion ?? null, [Validators.maxLength(64)]],
      vendorName: [this.data?.vendorName ?? null, [Validators.maxLength(64)]],
      productSerialNumber: [{ value: this.data?.productSerialNumber ?? null, disabled: true }, [Validators.maxLength(64)]],
      modelId:[ this.data?.modelId ?? null, [Validators.maxLength(64)]],
      usefulLife:[this.data?.usefulLife ?? null],
      ownerDepartmentId:[this.data?.ownerDepartmentId ?? null],
      assignedDepartmentId:[this.data?.assignedDepartmentId ?? null],
      ownerId:[this.data?.ownerId ?? null],
      assetUserId:[this.data?.assetUserId ?? null],
      costCenterId:[this.data?.assignedDepartmentId ?? null],
      assetAdminEmail: [this.data?.assetAdminEmail ?? null,
      [Validators.pattern(/(^\d{10}$)|(^[A-Za-z0-9_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$)/)]],
      assetAdminContactNo: [this.data?.assetAdminContactNo ?? null, [Validators.maxLength(10),Validators.pattern('[6789]\\d{9}')]],
      serviceContact: [this.data.serviceContact ? this.getNumber(this.data.serviceContact,1): null, [Validators.pattern(/^\+?\d{9,15}$/)]],
      servicePersonEmail: [this.data?.servicePersonEmail ?? null,
      [Validators.pattern(/(^\d{10}$)|(^[A-Za-z0-9_.-]+@[A-Za-z0-9_.-]+\.[A-Za-z]{2,4}$)/)]],
      serviceAddress: [this.data?.serviceAddress ?? null, [Validators.maxLength(256)]],
      searchLocation: [null],
      assetCategoryId: [this.data?.assetCategoryId ?? null],
      locationIdentifier:[this.data?.locationIdentifier ?? null],
      calibrationDue: [this.data?.calibrationDue ?? null],
      criticalityId: [this.data?.criticalityId ?? null],
      pmsDue: [this.data.pmsDue ? new Date(this.data.pmsDue) : null],
      ownerName: [null],
      pmcDue: [this.data?.pmcDue ?? null],
      commissionedOnServive: [this.data.commissionedOnServive ? new Date(this.data.commissionedOnServive) : null],
      prevMainFreqId: [this.data?.prevMainFreqId ?? null],
      warrantyStatusId: [this.data?.warrantyStatusId ?? null],
      WarrantyPeriodService: [this.data?.WarrantyPeriodService ?? null],
      calibrationFreqId: [this.data?.calibrationFreqId ?? null],
      depreciationPercent:  [this.data?.depreciationPercent ?? null, [Validators.maxLength(32)]],
      assetCost: [ this.data?.assetCost ?? null, [ Validators.pattern(/^\d{1,3}(,\d{2,3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/)]],
      assetAdminDepartment: [this.data?.assetAdminDepartment ?? null],
      linkedAsset : this.form.array([this.getChildAssets()]),
      childAssetSerialNumber: [this.data?.childAssetSerialNumber?? null],
      poOrdrNo: [this.data?.purchaseOrderNumber ?? null],
      poDate:[ this.data?.poDate?? null],
      expArrvgDate:[ this.data?.expectedArrivingDate?? null],
      delvryDate:[ this.data?.deliveryDate?? null],
      childAssetTypeName:[ null],
      childAssetTypeId:[null],
      vendorContact: [this.data.vendorContact ? this.getNumber(this.data.vendorContact,1): null, [Validators.pattern(/^\+?\d{9,15}$/)]],
      vendorEmail:[this.data?.vendorEmail ?? null,
      [Validators.pattern(/(^\d{10}$)|(^[A-Za-z0-9_\-.]+@[A-Za-z0-9_\-.]+\.[A-Za-z]{2,4}$)/)]],
      servicePersonName:[ this.data?.serviceProviderName ?? null],
      vendorCountryCode: [this.data?.vendorContact ? this.getNumber(this.data.vendorContact,0): null,[Validators.pattern('^[+][0-9]{1,5}$')]],
      serviceCountryCode: [this.data?.serviceContact ? this.getNumber(this.data.serviceContact,0) : null,[Validators.pattern('^[+][0-9]{1,5}$')]], 
      depreciationTypeId:[this.data?.depreciationTypeId ?? null],
      accumulatedDepreciation:[this.data?.accumulatedDepreciation ?? null] ,
      currentBookValue : [this.data?.currentBookValue ?? null],
      additionalCost : [this.data?.additionalCost ?? null],
      comments: [this.data?.comments ?? null],
      assetStatus: [this.data?.assetStatus || null],
      assetCategory1Id:[this.data?.assetCategory1Id ?? null],
      assetCategory2Id:[this.data?.assetCategory2Id ?? null],
      expenses:[this.data?.expenses??null],
      guaranteeStatusId:[this.data?.guaranteeStatusId??null],
      oracleId:[{ value: this.data?.oracleId?? null, disabled: true}],
      oracleDescription:[{value : this.data?.oracleDescription ?? null, disabled: true}],
      biomedTagId:[{value : this.data?.biomedTagId ?? null, disabled: true}],
      riskClassificationId:[this.data?.riskClassificationId ?? null],
      isNetwork: [this.data ? this.data?.isNetwork : false],
      ipAddress: [null],
      aeTitle: [ null],
      portNumber: [null],
      outputData: [null],
      solutionName: [null],
      osVersion: [null],
      antiVirusVersion: [null],
      antivirusName: [null],
      associatedDevice: [null],
      connectionProtocolId: [null],
      connectivityStatusId: [ null],
      intendedSolutionTypeId: [null],
      lastVerifiedAt: [null],
      operatingSystemId: [null],
      streamName: [''],
      streamUrl: ['']
    });
    this.loadOwnerAndUserList();
    this.formatAssetCost();
    this.dateForm = this.form.group({
      fromDate: [this.fromDate ?? null],
      toDate: [this.toDate ?? null],
    });
     this.assetItemForm = this.form.group({
      assetItemId : [null],
      description : [null]
    })
    this.adminOwnerName = this.data?.ownerId ?? null;
    this.assetUserName = this.data?.assetUserId ?? null;
    this.enableServiceContact = this.data?.serviceContact != null;
    this.enableVendorContact = this.data?.vendorContact != null;
    this.assetCostDependentValidators(!! this.data?.assetCost)
    this.assetForm.get('assetCost')?.valueChanges.subscribe(value => {
      this.assetCostDependentValidators(!!value);
    });
    this.warrantyStatusDependentValidators(!! this.getWarrantyFieldValue(this.data?.warrantyPeriod,'warrantyPeriod'))
    this.assetForm.get('warrantyPeriod')?.valueChanges.subscribe(value => {
      this.warrantyStatusDependentValidators(!!value);
    });
  }

  formatAssetCost(): void {
    const control = this.assetForm.get('assetCost');
    let value = control?.value;
    if (!value) return;
    value = value.toString().replace(/,/g, '');
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const formattedValue = num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    control?.setValue(formattedValue);
  }

  getWarrantyFieldValue(rawValue,field): any{
    const defaultFrequency = 'M';
    if (!rawValue) {
      return field === 'warrantyFrequency' ? defaultFrequency : null;
    }
    const parts = String(rawValue).trim().split(/\s+/);
    const value = parts[0];
    const freq = parts.length > 1 ? parts[1] : parts[0];
    const frequency = freq === 'Y' ? 'Y' : defaultFrequency;
    const period = parts.length > 1 ? Number(value) : null;
    return field === 'warrantyPeriod' ? (isNaN(period) ? null : period)
      : frequency;
  }
  getNumber(phoneNumber,part ) {
    if (phoneNumber?.includes('-')){
      const parts = phoneNumber.split("-");
      return part === 0 ? parts[0].trim() : parts[1].trim();
    }else if(phoneNumber != null) {
      if (part === 1) {
        return phoneNumber
      }      
    }
  }

  phoneNumber(field) {
      if(field == 'vendor'){
      this.assetForm.controls['vendorCountryCode'].setValue(null);
      this.assetForm.controls['vendorContact'].setValue(null);
      this.enableVendorContact = false;
      this.assetForm.updateValueAndValidity();
      }else if (field == 'service'){
      this.assetForm.controls['serviceCountryCode'].setValue(null);
      this.assetForm.controls['serviceContact'].setValue(null);
      this.enableServiceContact = false;
      this.assetForm.updateValueAndValidity();
      }
  }

  assetCostDependentValidators(isRequired) {
    const fields = ['assetCost','usefulLife', 'depreciationTypeId', 'depreciationPercent', 'commissionedOn'];
    fields.forEach(field => {
      const control = this.assetForm.get(field);
      if (!control) return;
      let validators: ValidatorFn[] = [];
        if (field === 'depreciationPercent') {
          validators.push(Validators.maxLength(32));
          if (this.assetCostDependentFieldsValidations) {
            validators.push(Validators.max(100), Validators.pattern(/^\d+(\.\d{1,2})?$/));
          }
        }
      //  add required when config is true and assetcost is not null
      if (this.assetCostDependentFieldsValidations && isRequired) {
        validators.unshift(Validators.required);
      }
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  warrantyStatusDependentValidators(isRequired){
    const fields = ['commissionedOn','warrantyFrequency','warrantyPeriod'];
    fields.forEach(field => {
      const control = this.assetForm.get(field);
      if (!control) return;
      if (isRequired) {
        if (field === 'warrantyPeriod') {
          control.setValidators([Validators.required,Validators.min(1),Validators.pattern(/^[1-9]\d*$/)]);
        } else {
          control.setValidators([Validators.required]);
        }
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }
  

  onProtocolChange(protocol: any) {
  const selectedProtocol = this.connectionProtocolList.find(
    x => x.code === protocol
  );

  this.isWebRTC =
    selectedProtocol?.value?.toLowerCase() === 'webrtc';
}
  get isAssetCostFilled(){
    return !!this.assetForm?.get('assetCost')?.value;
  }

  get isWarrantyStatus(){
    return !!this.assetForm?.get('warrantyPeriod')?.value;
  }

  get isDepreciationSectionValid() {
    const assetCost = this.assetForm.get('assetCost')?.value;
    if (!assetCost) return false; // disable compute if no assetCost
    const dependentFields = ['assetCost','usefulLife','depreciationTypeId','depreciationPercent','commissionedOn'];
    return dependentFields.every(field => {
      const control = this.assetForm.get(field);
      return control && control.valid;
    });
  }

  get isWarrantyValidation() {
    const warrantyValidation= this.assetForm.get('warrantyPeriod')?.value != null || this.assetForm.get('warrantyPeriod')?.value != null;
    if (!warrantyValidation) return false;
    const dependentFields = ['commissionedOn','warrantyFrequency','warrantyPeriod'];
    return dependentFields.every(field => {
      const control = this.assetForm.get(field);
      return control && control.valid;
    });
  }

  calculateEndDate() {
    const commissionedDate = this.assetForm.get('commissionedOn')?.value;
    const warrantyPeriod = Number(this.assetForm.get('warrantyPeriod')?.value);
    const frequency =this.assetForm.get('warrantyFrequency')?.value || 'M';
    if (!commissionedDate || !warrantyPeriod || warrantyPeriod <= 0) {
      this.assetForm.patchValue({ warrantyDue: null });
      return;
    }
    const months = frequency === 'Y'? warrantyPeriod * 12: warrantyPeriod;
    const startDate = new Date(commissionedDate);
    const day = startDate.getDate();
    const endDate = new Date(startDate);
    endDate.setDate(1); // reset day
    endDate.setMonth(endDate.getMonth() + months);
    const lastDayOfMonth = new Date(endDate.getFullYear(),endDate.getMonth() + 1,0).getDate();
    endDate.setDate(Math.min(day, lastDayOfMonth));
    this.assetForm.patchValue({warrantyDue: endDate});
  }

  onUserTypeHit(event) {
    if (event.text.length > 2) {
      this.assetLinked = false;
      this.commonService.getAssetSearch(null,event.text).subscribe((res) => {
        if (res.results.length>= 1) {
          this.assets = res.results.map((asset) => ({
            combinedAsset: `${asset.serialNo} - ${asset.assetName}`,
            assetId: asset.assetId,
            assetName: asset.assetName,
            assetSerialNo: asset.serialNo,
            assetType: asset.assetType,
            assetTypeId: asset.assetTypeId
          }));
          this.assets = this.assets.filter((asset) => asset.assetId !== this.data.id);
          const linkedAssetSerialNos = this.linkedAsset.map(a => a.childAssetSerialNumber);
          this.assets = this.assets.filter(asset => !linkedAssetSerialNos.includes(asset.assetSerialNo));
        } else {
          this.assetLinked = false;
        }
      });
    }
  }

  ValueChangesonchild() {
    this.assetForm.get('childAssetSerialNumber').valueChanges.subscribe((selectedAssetId) => {
      if (!this.isLinkedAsset && selectedAssetId !== '') {
        this.bindAsset(selectedAssetId);
      }
      this.assets=[]
    });
  
  }
  
  bindChildAsset(asset){
    const selectedAsset = this.assets.filter(a => a.assetSerialNo === asset.assetSerialNo);
    this.assetLinked = !!selectedAsset;
  }

  bindAsset(selectedValue) {
    const selectedAsset = this.assets.find(asset => asset.assetSerialNo=== selectedValue);
    if (selectedAsset) {
      this.isLinkedAsset = true;
      this.assetForm.get('childAssetSerialNumber').patchValue(selectedAsset.assetSerialNo);
      this.childAssetId =selectedAsset.assetId;
      this.childAssetName = selectedAsset.assetName;
      this.childAssetTypeName = selectedAsset.assetType;
      this.childAssetTypeId = selectedAsset.assetType;
      this.isLinkedAsset=false;
    } 
  }

  add(){
      if(this.dataSourceAsset.data.find(res => res.childAssetSerialNumber === this.assetForm.controls['childAssetSerialNumber'].value)) {
        this.assetForm.controls['childAssetSerialNumber'].setValue(null);
        return this.toastr.warning('Warning', 'ChildNo already exist');
      }
      let user = localStorage.getItem(btoa('current_user'));
      const userId = Number(localStorage.getItem(btoa('userId')));
      this.linkedAsset.push({
        childAssetSerialNumber:this.assetForm.controls.childAssetSerialNumber.value,
        childAssetId: this.childAssetId,
        childAssetName: this.childAssetName,
        childAssetTypeName: this.childAssetTypeName,
        childAssetTypeId: this.childAssetTypeId,
        linkedUserName : user,
        linkedUserId :userId,
        linkedDateTime: this._dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss'),
        isDeleted: false,
        isNewlyLinked: true
      });
      this.dataSourceAsset = new MatTableDataSource(this.linkedAsset);
      this.isAssetTable = true;
      this.assetForm.controls['childAssetSerialNumber'].reset();
      this.childAssetId = null;
      this.childAssetName = null;
      this.childAssetTypeName = null;
      this.childAssetTypeId = null;
  }

  loadOwnerAndUserList() {
    this.ownerNameList = [];
    this.userNameList = [];   
    if (this.data?.assetUserId && this.data?.assetUserName) {
      this.userNameList.push({
        id: this.data.assetUserId,
        name: this.data.assetUserName
      });
    }

    if (this.data?.ownerId && this.data?.ownerName) {
      this.ownerNameList.push({
        id: this.data.ownerId,
        name: this.data.ownerName
      });
    }
    this.assetForm.patchValue({
        ownerId: this.data?.ownerId,
        assetUserId: this.data?.assetUserId,
        ownerDepartmentId: this.data?.ownerDepartmentId,
        assignedDepartmentId: this.data?.assignedDepartmentId
      }, { emitEvent: false });
    
  }
  
  searchUserNameList(event, type) {
    if (event.text.length >= 2 && event.toHit === true) {
      const ownerDepartment = this.assetForm.controls.ownerDepartmentId.value;
      const userDepartment = this.assetForm.controls.assignedDepartmentId.value;
      const department = type === 'user' ? userDepartment ?? null : ownerDepartment ?? null;
      const param = department;
  
   this.configurationServices.getTicketUser(event.text, 'RT-US',param).subscribe(res => {
    if (type === 'user') {
      this.userNameList = res.results;
      this.userEnabled = true;
    } else if (type === 'owner') {
      this.ownerNameList = res.results;
      this.ownerEnabled = true;
      }
   });
    }
  }
  displayOwner = (id: any): string => {
    if (!id) return '';
    const found = this.ownerNameList?.find(x => x.id === id);
    return found ? found.name : '';
  }

  displayUser = (id: any): string => {
    if (!id) return '';
    const found = this.userNameList?.find(x => x.id === id);
    return found ? found.name : '';
  }

  getInventoryDetails(){
    this.commonService.getInventoryDetails(this.data.id).subscribe(res=>{
      this.inventoryDataSource = res.results;
    })
  }



  private requireLocationMatch(control: FormControl): ValidationErrors | null {

    if (this.locationId == null) {
      if(control.value !== null && control.value !== '' && this.blankField) {
      this.requireLocationMatchVal = this.locationlist.filter(resFilter => resFilter.id === control.value);
      if (this.requireLocationMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }

  }

  private getChildAssets(){
    return this.form.group({
    childAssetSerialNumber:[''],
    isDeleted:false,
    isNewlyLinked: false,
    });
  }

  handleIdentifierEvent(event){
    this.assetIdentifier = [];
    if (event.updateIdentifier && event.updateIdentifier.length >0){
    this.updateIdentifier = event.updateIdentifier;
    }
    this.assetIdentifier = event.saveIdentifier;
  }

  handleDocumentEvent(event){
    this.attachFiles = [];
    this.attachFiles = event.attachFiles;
  }

  public saveAsset(id, tabType?) {
    this.loading = true;
    this.isDisabled = true;

    this.updateIdentifier.forEach(item => this.assetIdentifier.push(item));

    this.attachFiles.forEach(file => {
      if (file.hasOwnProperty('image')) {
        delete file.image;
      }
      if (id == null) {
        delete file.attachmentId;
      }
    });

    this.createAsset = new CreateAsset(null, null, null, null, null, null, null, null, null, null, null,null,
      null, null, null, null, null, null, null, null, null, null, null, null, null,null, null, null, null,null,null
      ,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, null, null, null, null, null);

    this.createAsset.assetTypeId = this.assetForm.controls['assetTypeId'].value;
    this.createAsset.assetName = this.assetForm.controls['assetName'].value;
    this.createAsset.assetSerialNumber = this.assetForm.controls['assetSerialNumber'].value;
    this.createAsset.manufacturer = this.assetForm.controls['manufacturer'].value;
    this.createAsset.commissionedOn = this.assetForm.controls['commissionedOn'].value!=null ?this._dateFormat.transform(this.assetForm.controls['commissionedOn'].value, 'yyyy-MM-dd'):null;
    this.createAsset.endDate = this.assetForm.controls['endDate'].value != null?this._dateFormat.transform(this.assetForm.controls['endDate'].value, 'yyyy-MM-dd'):null;
    this.createAsset.warrantyStatus = this.assetForm.controls['warrantyStatus'].value;
    if(id != null){
      this.createAsset.assetTransferTypeId = this.assetForm.controls['status'].value;
    }
    this.createAsset.locationDescription = this.assetForm.controls['locationDescription'].value ?? null;
    this.createAsset.locationIdentifier = this.assetForm.controls['locationIdentifier'].value ?? null;
    this.createAsset.locationId = this.locationId;
    this.createAsset.softwareVersion = this.assetForm.controls['softwareVersion'].value;
    this.createAsset.vendorName = this.assetForm.controls['vendorName'].value;
    this.createAsset.costTypeId = this.assetForm.controls['costTypeId'].value;
    this.createAsset.nextAmcDue = this.assetForm.controls['nextAmcDue'].value;
    this.createAsset.calibrationDue = this.assetForm.controls['calibrationDue'].value;
    this.createAsset.pmcDue = this.assetForm.controls['pmcDue'].value;
    this.createAsset.warrantyDue = this.assetForm.controls['warrantyDue'].value!= null ?this._dateFormat.transform(this.assetForm.controls['warrantyDue'].value, 'yyyy-MM-dd'):null;
    this.createAsset.warrantyPeriod = this.assetForm.controls['warrantyPeriod'].value != null ? this.assetForm.controls['warrantyPeriod'].value +' '+this.assetForm.controls['warrantyFrequency'].value : null;
    this.createAsset.assetIdentifier = this.assetIdentifier;
    this.createAsset.criticalityId = this.assetForm.controls['criticalityId'].value;
    this.createAsset.calibrationFreqId = this.assetForm.controls['calibrationFreqId'].value;
    this.createAsset.prevMainFreqId = this.assetForm.controls['prevMainFreqId'].value;
    this.createAsset.warrantyStatusId = this.assetForm.controls['warrantyStatusId'].value;
    this.createAsset.comments = this.assetForm.controls['comments'].value;
    this.createAsset.assetStatus = this.assetForm.controls['assetStatus'].value;
    this.createAsset.depreciationPercent = this.assetForm.controls['depreciationPercent'].value;
    this.createAsset.assetCost = this.assetForm.controls['assetCost'].value ? parseFloat(this.assetForm.controls['assetCost'].value.toString().replace(/,/g, '')): null;
    this.createAsset.assetAdminDepartment = this.assetForm.controls['assetAdminDepartment'].value;
    this.createAsset.purchaseOrderNumber = this.assetForm.controls['poOrdrNo'].value;
    this.createAsset.poDate = this.assetForm.controls['poDate'].value != null?this._dateFormat.transform(this.assetForm.controls['poDate'].value, 'yyyy-MM-dd HH:mm:ss'):null;
    this.createAsset.expectedArrivingDate = this.assetForm.controls['expArrvgDate'].value != null?this._dateFormat.transform(this.assetForm.controls['expArrvgDate'].value, 'yyyy-MM-dd HH:mm:ss'):null;
    this.createAsset.deliveryDate = this.assetForm.controls['delvryDate'].value != null?this._dateFormat.transform(this.assetForm.controls['delvryDate'].value, 'yyyy-MM-dd HH:mm:ss'):null;
    this.createAsset.modelId = this.assetForm.controls['modelId'].value;
    this.createAsset.productSerialNumber = this.assetForm.controls['productSerialNumber'].value;
    this.createAsset.vendorEmail = this.assetForm.controls['vendorEmail'].value;
    this.createAsset.serviceProviderName = this.assetForm.controls['servicePersonName'].value;
    this.createAsset.depreciationTypeId = this.assetForm.controls['depreciationTypeId'].value;
    this.createAsset.accumulatedDepreciation = this.assetForm.controls['accumulatedDepreciation'].value;
    this.createAsset.currentBookValue = this.assetForm.controls['currentBookValue'].value;
    this.createAsset.fileAttachments = this.attachFiles;
    this.createAsset.ownerDepartmentId = this.assetForm.controls['ownerDepartmentId'].value;
    this.createAsset.assignedDepartmentId = this.assetForm.controls['assignedDepartmentId'].value;
    this.createAsset.ownerId = this.assetForm.controls['ownerId'].value;
    this.createAsset.assetUserId = this.assetForm.controls['assetUserId'].value;
    this.createAsset.assetAdminEmail = this.assetForm.controls['assetAdminEmail'].value;
    this.createAsset.assetAdminContactNo = this.assetForm.controls['assetAdminContactNo'].value;
    this.createAsset.serviceAddress = this.assetForm.controls['serviceAddress'].value;
    this.createAsset.servicePersonEmail = this.assetForm.controls['servicePersonEmail'].value;
    this.createAsset.assetCategoryId = this.assetForm.controls['assetCategoryId'].value;
    this.createAsset.usefulLife = this.assetForm.controls['usefulLife'].value;
    this.createAsset.costCenterId = this.assetForm.controls['costCenterId'].value;
    this.createAsset.linkedAsset = this.linkedAsset;
    const vendorCountryCode = this.assetForm.controls['vendorCountryCode'].value;
    const vendorContact = this.assetForm.controls['vendorContact'].value;
    this.createAsset.vendorContact = vendorCountryCode && vendorContact  ? `${vendorCountryCode.trim()}-${vendorContact}` : vendorContact || null;
    const serviceCountryCode = this.assetForm.controls['serviceCountryCode'].value;
    const serviceContact = this.assetForm.controls['serviceContact'].value;
    this.createAsset.serviceContact = serviceCountryCode && serviceContact ? `${serviceCountryCode.trim()}-${serviceContact}` : serviceContact || null;
    this.createAsset.assetCategory1Id = this.assetForm.controls.assetCategory1Id.value;
    this.createAsset.assetCategory2Id = this.assetForm.controls.assetCategory2Id.value;
    this.createAsset.guaranteeStatusId = this.assetForm.controls.guaranteeStatusId.value;
    this.createAsset.oracleId = this.assetForm.controls.oracleId.value;
    this.createAsset.oracleDescription = this.assetForm.controls.oracleDescription.value;
    this.createAsset.biomedTagId = this.assetForm.controls.biomedTagId.value;
    this.createAsset.coordinates = JSON.stringify({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [this.selectedCoordinates]
      }
    });
    this.createAsset.riskClassificationId = this.assetForm.controls.riskClassificationId.value;
    this.createAsset.isNetwork = this.assetForm.controls.isNetwork.value;
    if (this.createAsset.isNetwork) {
      if (this.isWebRTC) {     
        this.createAsset.assetConnectivityDto = [{
          id:this.connectivityDetails[0].id ?? null,
          connectionProtocolId: this.assetForm.controls.connectionProtocolId.value,
          outputData: JSON.stringify({
            streamName: this.assetForm.value.streamName ?? '',
            streamUrl: this.assetForm.value.streamUrl ?? ''
          })
        }];
      } else {
        this.createAsset.assetConnectivityDto = this.connectivityDetails;
      }
    }
    const request = id != null ? this.configurationServices.editAsset(this.createAsset, id) : this.configurationServices.saveAsset(this.createAsset);
    request.subscribe({
      next: (res) => {
        if (res.statusCode !== 1){
          this.loading = false;
          this.isDisabled = false;
          this.toastr.error('Error', res.message || 'Something went wrong');
          return;
        }
        this.loading = false;
        this.toastr.success('Success', res.message);
        this.onDialogClose();
        if (id != null && tabType) {
          this.loading = false;
          this.updateLoader = true;
          this.configurationServices.getAllAsset(id).subscribe({next: (assetRes) => {
            if (assetRes.results?.length > 0) {
              this.data = assetRes.results[0];
              this.buildForm();
            }
            this.updateIdentifier = [];
            this.assetIdentifier = [];
            this.linkedAsset = [];
            this.locationlist =[]
            this.assetTransferSource = [];
            this.datSourceMovementHistory = [];
            this.sensorHistoryList = [];
            this.sensorSummaryList = [];
            this.inventoryDataSource = [];
            this.inventoryItemDataSource = [];
            this.attachFiles = [];
            this.connectivityData=[]
            this.connectivityDetails=[]
            this.userHit = false;
            this.userHit1 = false;
            this.selectedTab = tabType;
            if(this.selectedTab === 'Inventory'){
              const inventoryEvent = { index: this.inventorySelectedIndex, tab: { textLabel: this.inventorySelectedTab }};
              this.onInventoryTabChanged(inventoryEvent);
            }else{
              const event = { index: this.selectedIndex, tab: { textLabel: this.selectedTab }};
              this.onTabChanged(event);
            }
            this.updateLoader = false;
            this.isDisabled = false;
          },
          error: (error) => {
            this.updateLoader = false;
            this.isDisabled = false;
            this.loading = false;
            this.toastr.error('Error',`${error.error.message}`);
          }
          });
        } else {
          this.loading = false;
          this.thisDialogRef.close('confirm');
        }
      },
      error: (error) => {
        this.loading = false;
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      }
    });
  }

  public onSaveAsset(id?, tabType?) {
    const warrantyPeriodexists = this.data?.warrantyPeriod  && this.data.warrantyPeriod.trim().charAt(0) >= '0' && this.data.warrantyPeriod.trim().charAt(0) <= '9';
    const warrantyPeriodFormValue = this.assetForm.controls['warrantyPeriod'].value;
    const warrantyConfirmation = !warrantyPeriodexists &&warrantyPeriodFormValue != null && warrantyPeriodFormValue !== '';

    if (warrantyConfirmation) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['mdm-Confirmation-popup'],
        disableClose: true,
        data: {
          title: 'Confirmation',
          message: 'Do you like to Proceed with creating the Warranty activity for this Asset?',
          buttonText: { ok: 'Yes', cancel: 'No' },
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.warrantyRoutine(null).then(() => {
            this.saveAsset(id, tabType);
          });
        } else {
          this.assetForm.controls.warrantyPeriod.setValue(null);
          this.assetForm.controls.warrantyFrequency.setValue(null);
          this.saveAsset(id, tabType);
        }
      });
    } else {
      this.saveAsset(id, tabType);
    }
  }

  warrantyRoutine(data): Promise<void> {
    return new Promise((resolve, reject) => {
      if (data === null) {
        this.configurationServices.getWarrantyRoutine('AC-WAR', 'ROU-ASM').subscribe(res => {
          if (!res?.results?.length) {
            this.toastr.error('Error', 'No warranty routine Activity found for the Asset');
            reject();
            return;
          }
          const routine = res.results?.[0];
          const routineId = routine?.routineId;
          const activities = routine?.activities || [];
          const date = this._dateFormat.transform(this.assetForm.controls['commissionedOn'].value,'yyyy-MM-dd HH:mm:ss');
          const scheduleDate = this._dateFormat.transform(this.assetForm.controls['commissionedOn'].value,'yyyy-MM-dd');
          const scheduleTime = scheduleDate + ' ' + this._dateFormat.transform(this.today, 'HH:mm:ss');
          const createRoutine = new CreateEntityRoutine(null, null, null, null, null, null, null, null, null, null);
          createRoutine.identifiyingId = this.data?.id;
          createRoutine.identifyingType = 'Asset';
          createRoutine.fromDate = this._dateFormat.transform(this.assetForm.controls['warrantyDue'].value,'yyyy-MM-dd 00:00:00');
          createRoutine.routineId = routineId;
          createRoutine.routineType = 'ROU-ASM';
          createRoutine.scheduleStart = this._dateFormat.transform(this.assetForm.controls['warrantyDue'].value,'yyyy-MM-dd 00:00:00');
          createRoutine.scheduleEnd = this._dateFormat.transform(this.assetForm.controls['warrantyDue'].value,'yyyy-MM-dd 23:59:00');
          createRoutine.routineStatusId = 'RQ-CR';
          createRoutine.patientVisitId = null;
          createRoutine.activities = activities;
          createRoutine.scheduleTypeId = 'SCT-ALW';
          this.configurationServices.createRoutine(createRoutine).subscribe(
            res => {
              if (res.statusCode === 1) {
                this.toastr.success('Success', res.message);
                resolve();
              } else {
                this.toastr.error('Error', res.message || 'Failed to create routine');
                reject();
              }
            },
            error => {
              this.toastr.error('Error', error.error.message || 'Failed to create routine');
              reject();
            }
          );
        });
      }
    });
  }

  createRoutine() {
    this.configurationServices.getAllManageRoutine('', '', 'Asset', this.data?.id, null).subscribe(res => {
      const routines = res.results || [];
      const warrantyData = routines.find(item => item.pfRoutineName === 'Warranty');
      if (warrantyData) {
        warrantyData['dynamicHeader'] = 'Modify Maintenance Routine';
        warrantyData['tabType'] = 'Asset';
        this.dialog.open(CreateManageRoutineComponent, {
          data: warrantyData,
          panelClass: ['medium-popup'],
          disableClose: true
        }).afterClosed().subscribe(result => {
        });
      }
    });
  }

  getSensorSummary(sensorAction, event?: any) {
    if(sensorAction !== this.selectedSensorAction){
      this.selectedSensorAction = sensorAction;
      this.selectedDate = null
    }
    const formattedDate = this.selectedDate ?this.selectedDate: this.getTodayDate();
    this.selectedDateObj = formattedDate
    if (this.selectedSensorAction === 'SER-SU') {
      this.summaryPageStart = (event != null) ? event.pageIndex : this.summaryPageStart;
      this.summaryPageSize = (event != null) ? event.pageSize : 10;
      this.commonService.getAssetSensorSummary(this.data.id, false, null, this.summaryPageStart, this.summaryPageSize,formattedDate).subscribe(res => {
          this.summaryLength = res.results.length;
          this.sensorSummaryList = res.results;
      });
    } else {
      this.historyPageStart = (event != null) ? event.pageIndex : this.historyPageStart;
      this.historyPageSize = (event != null) ? event.pageSize : 10;
      this.commonService.getAssetSensorSummary(this.data.id, true, null, this.historyPageStart, this.historyPageSize,formattedDate).subscribe(res => {
          this.historyLength = res.results.length;
          this.sensorHistoryList = res.results;
      });
    }
  }
  
  computeDepreciation() {
    const depreciationTypeId = this.assetForm.get('depreciationTypeId')?.value;
    const assetCost = parseFloat(this.assetForm.get('assetCost')?.value?.toString()?.replace(/,/g, '')) || 0;
    const tempadditionalCost = Number(this.assetForm.get('additionalCost')?.value) || 0;
    const expensesData = Number(this.assetForm.get('expenses')?.value) || 0;
    const depreciationPercent = Number(this.assetForm.get('depreciationPercent')?.value) || 0;
    const usefulLife = Number(this.assetForm.get('usefulLife')?.value) || this.data?.usefulLife || 0;
    const commissionedDate = this.assetForm.get('commissionedOn')?.value || new Date().toISOString().split('T')[0];
    let additionalCost = tempadditionalCost + expensesData
    this.previousRowsCount = this.calculatePreviousRowsCount(commissionedDate);
    this.computed = true;

    const totalLifespan = usefulLife;
    const baseValue = assetCost + additionalCost;

    this.depreciationTableData = [];

    let bookValue = assetCost;
    let currentFromDate = new Date(commissionedDate);
    let sno = 1;
    let fixedSLMValue: number | null = null;

    if (depreciationTypeId === 'DET-SLM') {
      fixedSLMValue = +(baseValue * depreciationPercent / 100).toFixed(2);
    }

    for (let i = 0; i < totalLifespan; i++) {
      const { row, newBookValue, nextFromDate } = this.calculateDepreciationRow(
        i,
        {
          totalLifespan,
          depreciationTypeId,
          depreciationPercent,
          fixedSLMValue
        },
        {
          currentFromDate,
          commissionedDate
        },
        bookValue,
        additionalCost,
        sno++
      );

      this.depreciationTableData.push(row);
      bookValue = newBookValue;
      currentFromDate = nextFromDate;
    }

    const initialBookValue = baseValue;
    this.finalBookValue = +bookValue.toFixed(2);
    this.totalDepreciation = +((initialBookValue - this.finalBookValue).toFixed(2));
  }


  private calculatePreviousRowsCount(commissionedDate: string): number {
    const commissioned = new Date(commissionedDate);
    const today = new Date();

    let previousRowsCount = today.getFullYear() - commissioned.getFullYear();
    if (commissioned > new Date(commissioned.getFullYear(), 0, 1)) {
      previousRowsCount -= 1;
    }
    if (previousRowsCount < 0) {
      previousRowsCount = 0;
    }

    return previousRowsCount + 1;
  }

  private calculateDepreciationRow(
    i: number,
    depreciationInfo: {
      totalLifespan: number;
      depreciationTypeId: string;
      depreciationPercent: number;
      fixedSLMValue: number | null;
    },
    datesInfo: {
      currentFromDate: Date;
      commissionedDate: string;
    },
    bookValue: number,
    additionalCost: number,
    sno: number
  ): { row: any, newBookValue: number, nextFromDate: Date } {
    const {
      totalLifespan,
      depreciationTypeId,
      depreciationPercent,
      fixedSLMValue
    } = depreciationInfo;

    const {
      currentFromDate,
      commissionedDate
    } = datesInfo;

    const fromYear = currentFromDate.getFullYear();
    const toDate = new Date(currentFromDate);
    toDate.setFullYear(toDate.getFullYear() + 1);
    const toYear = toDate.getFullYear();

    const additionalCostThisYear = i === 0 ? additionalCost : 0;
    const currentBookValue = bookValue + additionalCostThisYear;

    let depreciationValue: number;
    let scopeName: 'full' | 'half' = 'full';

    if (i === 0) {
      scopeName = this.getDepreciationScope(commissionedDate);
      const isHalf = (scopeName === 'half');

      if (depreciationTypeId === 'DET-SLM') {
        depreciationValue = isHalf
          ? +(fixedSLMValue / 2).toFixed(2)
          : fixedSLMValue;
      } else {
        depreciationValue = isHalf
          ? +((currentBookValue * depreciationPercent / 100) / 2).toFixed(2)
          : +(currentBookValue * depreciationPercent / 100).toFixed(2);
      }
    } else {
      depreciationValue = depreciationTypeId === 'DET-SLM'
        ? fixedSLMValue
        : +(currentBookValue * depreciationPercent / 100).toFixed(2);
    }

    const newBookValue = Math.max(0, +(currentBookValue - depreciationValue).toFixed(2));

    return {
      row: {
        id: null,
        assetId: null,
        fromDate: currentFromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
        scopeId: null,
        scopeName: scopeName,
        bookValue: +bookValue.toFixed(2),
        additionalCost: additionalCostThisYear,
        depreciationValue,
        newBookValue,
        isActive: true,
        year: `${fromYear}`,
        sno: sno
      },
      newBookValue: newBookValue,
      nextFromDate: toDate
    };
  }

  generateYearLabel(fromDate: string, toDate: string): string {
    const fromYear = new Date(fromDate).getFullYear() % 100;
    const toYear = new Date(toDate).getFullYear() % 100;
    return fromYear===toYear?`${fromYear}`:`${fromYear}-${toYear}`;
  }

  addForm = new FormGroup({
    typeId: new FormControl('', Validators.required),
    cost: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    description: new FormControl('', Validators.maxLength(200)),
    eventDate: new FormControl('', Validators.required)
  });
    showOverlay = false;
  toggleOverlay() {
      this.showOverlay = !this.showOverlay;
    }
  toggleOverlayInfo(data: 'info' | 'add') {
    const popupType = data; 
    if(popupType === 'info'){
    this.dialog.open(InformationPopupComponent, {
      data: { ...this.data, popupType },
      panelClass: ['small-popup'],
      disableClose: true,height:"450px",maxWidth:"700px"
    });
  }else{
    this.dialog.open(InformationPopupComponent, {
      data: { ...this.data, popupType },
      panelClass: ['small-popup'],
      disableClose: true,height:"350px",maxWidth:"700px"
    });
  }
  }

  submitOverlay() {
    const data= {
      assetId: this.data.id,
      typeId: this.addForm.controls['typeId'].value,
      cost: this.addForm.controls['cost'].value,
      description: this.addForm.controls['description'].value,
      eventDate:this._dateFormat.transform( this.addForm.controls['eventDate'].value, "YYYY-MM-dd HH:mm:ss")
    }
   
      this.commonService.saveAdditionalCost(data).subscribe(res => {
        if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
          this.commonService.getAdditionalCost(this.data.id).subscribe( res=>{
            const totalCost = res.results.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
             this.assetForm.controls['additionalCost'].setValue(totalCost);
          })
          this.showOverlay = false;
          this.addForm.reset()
        }
      }, error => {
        this.showOverlay = true;
        this.toastr.error('Error', `${error.error.message}`);
      }
      );
    
  }

  cancelOverlay() {
    this.showOverlay = false;
    this.addForm.reset();
  }
   
  private getDepreciationScope(dateStr: string): 'full' | 'half' {
    const date = new Date(dateStr);
    const endDate = new Date(date.getFullYear(), 11, 31);
    const diffDays = (endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    const scope = diffDays >= 180 ? 'full' : 'half'; 
    return scope;
  }

  onItemSelect(asset) {
    this.itemList = asset
    this.assetLinked = true;
  }

  connectivityEventAction(event){
      this.deleteConnection(event.data, event.index)
  }

  addConnectivityDetails(){
    let outputData = this.assetForm.value.outputData;
    let row;
    if (this.isWebRTC) {
      outputData = JSON.stringify({
        streamName: this.assetForm.value.streamName,
        streamUrl: this.assetForm.value.streamUrl
      });

      row = {
        connectionProtocolId: this.assetForm.controls.connectionProtocolId.value,
        outputData: outputData
      }
    }else{
     row = {
      aeTitle : this.assetForm.controls.aeTitle.value,
      portNumber : this.assetForm.controls.portNumber.value,
      antivirusVersion: this.assetForm.controls.antiVirusVersion.value,
      antivirusName: this.assetForm.controls.antivirusName.value,
      associatedDevice: this.assetForm.controls.associatedDevice.value,
      connectionProtocolId: this.assetForm.controls.connectionProtocolId.value,
      connectivityStatusId: this.assetForm.controls.connectivityStatusId.value,
      intendedSolutionTypeId: this.assetForm.controls.intendedSolutionTypeId.value,
      intendedSolutionTypeName: this.intendedSolutionTypes?.find(item=> item.code === this.assetForm.controls.intendedSolutionTypeId.value)?.value,
      ipAddress: this.assetForm.controls.ipAddress.value,
      isActive: true,
      lastVerifiedAt: this.assetForm.controls.lastVerifiedAt.value,
      operatingSystemId: this.assetForm.controls.operatingSystemId.value,
      osVersion : this.assetForm.controls.osVersion.value,
      outputData: this.assetForm.controls.outputData.value,
      solutionName: this.assetForm.controls.solutionName.value,
      connectionProtocolName : this.connectionProtocolList.find(r=> r.code === this.assetForm.controls.connectionProtocolId.value)?.value,
      operatingSystemName : this.operatingSystem.find(r=> r.code === this.assetForm.controls.operatingSystemId.value)?.value,
      connectivityStatusName : this.connectivityStatus.find(r=> r.code === this.assetForm.controls.connectivityStatusId.value)?.value
    }
  }
    this.connectivityDetails.push(row)
    this.connectivityData = this.connectivityDetails.filter(r => r.isActive !== false)
    this.connectivityData = [...this.connectivityData]
    const controlsToNull = ['aeTitle', 'portNumber', 'antiVirusVersion', 'antivirusName', 'associatedDevice', 'connectionProtocolId', 'connectivityStatusId', 'intendedSolutionTypeId', 'ipAddress', 'lastVerifiedAt', 'operatingSystemId', 'osVersion', 'outputData', 'solutionName'];
    controlsToNull.forEach(control =>this.assetForm.get(control)?.setValue(null));
  }

  deleteConnection(data, index) {
    if (!data) return;
    if (data.id) {
      const connection = this.connectivityDetails.find(
        a => a.id === data.id
      );

      if (connection) {
        connection.isActive = false
      }
    } else {
      this.connectivityDetails.splice(index, 1);
    }

    this.connectivityData = this.connectivityDetails.filter(r => r.isActive !== false)
    this.connectivityData = [...this.connectivityData]
  }

  addAssetItems() {
    const desc = this.assetItemForm.value.description;
    if (!this.itemList) return;

    const row = [{
      itemMasterId: this.itemList.id,
      itemMasterName: this.itemList.name,
      entityType: 'Asset',
      description: desc,
      entityId: this.data.id,
    }];
    this.commonService.saveEntityItems(row).subscribe({
      next: (res) => {
        this.toastr.success('Success', res.message);
        this.getAssetItems()
        this.assetItemForm.controls['assetItemId'].setValue(null); 
        this.assetItemForm.controls['description'].setValue(''); 
        this.itemList = null;
        this.assetLinked = false;
        this.subAssetData = [...this.subAssetData]
      },
      error: (err) => {
        this.toastr.error('Error', `${err.error.message}`);
        this.assetLinked = false;
      }
    });
  }

  itemEventAction(event) {
    if (event.key === 'delete') {
      this.deleteAssetItem(event.data)
    }
  }

  deleteAssetItem(row) {
    if (!row) return;

    if (row.id) {
      const payload = {
        "description": row.description,
        "entityId": row.entityId,
        "entityType": row.itemMasterName,
        "isActive": false,
        "itemMasterId": row.itemMasterId
      };

      this.commonService.updateEntityItems(row.id, payload).subscribe({
        next: (res) => {
          this.toastr.success('Success', res.message);
          this.getAssetItems()

          this.subAssetData = [...this.subAssetData];
        },
        error: (err) => {
          this.toastr.error('Error', `${err.error.message}`);
        }
      });

    }
    else {
      this.linkedAssetItems = this.linkedAssetItems.filter(
        item => item !== row
      );
      this.subAssetData = [...this.linkedAssetItems];
    }
  }

  displayName = (Id: number | null): string | null => {
    if(Id == null  || !this.assetitems) return;
    const Asset = this.assetitems.find(p => p.id === Id);
    return Asset ? Asset.name : null;
  };

  onTypeHit(event) {
    if (event.text.length > 2) {
      this.workflowService.getAllIterm(null, event.text, null, null).subscribe((res) => {
        if (res.results.length >= 1) {
          this.assetitems = res.results
        }
      });
    }
  }

  associatedAssetList: any[] = [];
  assetSelected = false;

searchAssociatedAsset(event) {
  this.assetSelected = false;

  if (!event.text || event.text.length < 2) {
    this.associatedAssetList = [];
    return;
  }

  this.commonService.getAssetcatagory(null,event.text).subscribe(res => {
    this.associatedAssetList = res.results || [];
  });
}

selectAssociatedAsset(asset: any) {
  this.assetSelected = true;

  this.assetForm.patchValue({
    associatedDevice: asset.assetName
  });
}

validateAssociatedAsset() {
  const control = this.assetForm.get('associatedDevice');
  const value = control?.value;

  const valid = this.associatedAssetList.some(
    o => o.assetName === value
  );

  if (!this.assetSelected || !valid) {
    control?.setErrors({ invalidAsset: true });
  } else {
    control?.setErrors(null);
  }
}


  onDateChange(event: any) {
    const momentDate = event.value;
    if (momentDate) {
      this.selectedDate = momentDate.format('YYYY-MM-DD'); 
    } else {
      this.selectedDate = null;
    }
    this.getSensorSummary(this.selectedSensorAction);
  }

getTodayDate(): string {
  const today = new Date();

  return today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
}
  fixClick() {
    console.log('')
  }

}


@Component({
  selector: 'lightbox-dialog',
  templateUrl: 'lightbox-dialog-component.html',
  styleUrls: ['./asset.component.scss'],
})
export class LightboxOnlineMenuDialogComponent implements OnInit{
  url: string;
  urlSafe: SafeResourceUrl;
  public isDownload: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public sanitizer: DomSanitizer) { }

  ngOnInit(){
    if (this.data.hasOwnProperty('fileUrl') && this.data.fileUrl) {
      this.url = this.data.fileUrl;
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    } else if (this.data?.fileType === 'application/pdf') {
      try {
        const pdfDataInfo = this.data?.base64Data;
        if (typeof pdfDataInfo === 'string' && pdfDataInfo.trim() !== '') {
          const formatChangeData = atob(pdfDataInfo);
          const baseNumbers = new Array(formatChangeData.length);
          for (let i = 0; i < formatChangeData.length; i++) {
            baseNumbers[i] = formatChangeData.charCodeAt(i);
          }
          const getArrey = new Uint8Array(baseNumbers);
          const blobData = new Blob([getArrey], { type: 'application/pdf' });
          const blobUrlData = URL.createObjectURL(blobData);
          this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrlData);
        }
      } catch (error) {
        console.error('PDF Blob creation failed', error);
      }
    }
  }
  downloadPreview(){
    this.isDownload = true;
    setTimeout(() =>  this.isDownload = false, 100);
  }
}


@Component({
  selector: 'app-information-popup',
  templateUrl: './information-popup-component.html',
  styleUrls: ['./asset.component.scss'],
})
export class InformationPopupComponent implements OnInit{
   bannerlabel =[]
  expensesData=[]; 
  additionalTableData=[]
  isExpense:boolean;
  constructor(public commonService : CommonService, @Optional() @Inject(MAT_DIALOG_DATA) public data: any , public dialogue : MatDialog,public dialogueRef : MatDialogRef<InformationPopupComponent>,public dialog: MatDialog) { }

  ngOnInit(){
    this.commonService.getTicketExpensesDetails(this.data.id).subscribe(res => {
    this.expensesData = res.results.map(item => {
    const firstDetail = item.deliveryDetails?.[0];

    if (firstDetail) {
      firstDetail.unitCost = firstDetail?.serviceCost ||firstDetail?.deliveryDetailUnitCost;
    }

    return firstDetail;
  });
});

  this.commonService.getAdditionalCost(this.data.id).subscribe(res => {
        this.additionalTableData = res.results;
      })

     this.bannerlabel =[ 
      {'left': [{label: 'Asset  Serial Number', value: this.data.assetSerialNumber},
                {label: 'Asset Name', value: this.data.assetName}]},
      {'right': [{label: 'Asset Type', value: this.data.assetTypeName},
                 {label: 'Owner Department ', value: this.data.ownerDepartment}]}]

  if(this.data.popupType === 'info'){
    this.isExpense = true
  }else if(this.data.popupType === 'add'){
    this.isExpense = false
  }
  }

  triggerAction(event){
    if(event.key === 'TicketId'){
          const ticketData = {requestId: event?.data?.requestId,type: 'modify'}
          const dialogRef = this.dialog.open(TaskManagmentComponent, {
            data: ticketData,
            panelClass: ['large-popup'],
            disableClose: true,
          });
      
          dialogRef.afterClosed().subscribe((result) => {
          });
    }
  }
  
  close(){
    this.dialogueRef.close()
  }
}
