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
import { DatePipe } from '@angular/common';
import { Component, OnInit, Input, ViewChild,  ViewChildren, QueryList, ViewEncapsulation, AfterViewInit, OnDestroy } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { WorkflowService, CommonService } from '../../../shared';
import { CdkDetailRowDirective } from '../../workflow/infant/cdk-detail-row.directive';
import { CoasterComponent, EnrollInfantComponent, MY_FORMATS } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component'
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { ActivatedRoute } from '@angular/router';
import { PorterRequestNewComponent } from '../../../shared/modules/entry-component/porter-request/porter-request.component';
import { PatientInfoComponent } from '../../../shared/modules/entry-component/patient/patient.component';
import { AcknowledgementComponent } from '../../../shared/modules/entry-component/acknowledgement/acknowledgement.component';
import { WorkflowManagementComponent } from '../../../shared/modules/entry-component/workflow-management/workflow-management.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { InfantAlertDialogComponent } from './infant-alert-dialog/infant-alert-dialog.component';
import { NotificationAlertPopupComponent } from '../../../shared/modules/entry-component/notification-alert-popup/notification-alert-popup.component';
import { Subject, Subscription } from 'rxjs';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { MatTabGroup } from '@angular/material/tabs';
import { debounceTime } from 'rxjs/operators';
import { LookupTermService } from '../../../shared/lookup-term.service';

@Component({
  selector: 'app-infant',
  templateUrl: './infant.component.html',
  styleUrls: ['./infant.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  animations: [
    // trigger('detailExpand', [
    //   state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
    //   state('*', style({ height: '*', visibility: 'visible' })),
    //   transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    // ]),
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
  encapsulation: ViewEncapsulation.None
})
export class InfantComponent implements OnInit,AfterViewInit,OnDestroy {
  dataColumns: string[] = [];
   displayedColumns: string[] = []
   iconHeader : string[] = [];
   iconColumn : string[] = [];
   sortColumn : string[] = [];
   eventColumn : string[] = [];
   dataSource = new MatTableDataSource<any>();
  expandedElement: any | null = null;
  expandedRows = new Set<any>();
  tableRecord = new MatTableDataSource<any>();
  public selectedName: any = null;
  public subscription: Subscription;
  public rowData: any = [];
  public activate_btn:any = [];
  private openedRow: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;
  @ViewChildren(CdkDetailRowDirective) detailRows!: QueryList<CdkDetailRowDirective>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('AHPaginator') AHPaginator: MatPaginator;
  isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');
  applyFilterValue: any;
  maxHeight: number;
  height: number;
  width: number;
  isDisabled = true;
  public showActions = [];
  public subShowAction = [
    { id: 'porter', value: 'Porter Request' },
    { id: 'modify', value: 'Modify' },
  ];
  public subShowAction1: any[] = [{ id: 'porter', value: 'Porter Request', disabled: false },
  { id: 'modify', value: 'Modify', disabled: false },
  { id: 'disengage', value: 'Manage Authorized Movement' }];
  public selectFilter = [{ id: 'ward', value: 'WARD' }];
  public subShowActions: any[] = [];
  rowId = null;
  selectDropdown: string;
  rowFilter: any;
  length = 0;
  public locationId = null;
  pageSize: any;
  tableData = [];
  includeHierarchy = true;
  public loading : boolean = false;
   public parentFilter = [
    {
      id: 'Ward',
      value: 'Ward',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All'],
      showLabel : true
    },
    {
      id: 'Includelinked',
      value: 'Hierarchy (linked mother / infant)',
      isNoneAll: false,
      selectionType: 'single',
      subFilters: [{ code: true, value: 'Include' }, { code: false, value: 'Exclude' }],
      defaultSelected: [true]
    },
  ];
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;
  public AHdataSource: MatTableDataSource<any>;
  public HCDisplayedColumns: any;
  AHLength = 0;
  public noData = false;
  public spinLoader: boolean = false;
  public tamperCount = 0;
  public geofenceCount = 0;
  public wrongParentCount = 0;
  public alertDateFilter: any = null;
  pageStart = 0;
  public get alertCardData(): any[] {
    return [
      { code: 'CE-TAM', name: 'Tampering', count: this.tamperCount, icon: '/assets/Alert/CE-TAM.svg' },
      { code: 'RU-GO', name: 'Geofence', count: this.geofenceCount, icon: '/assets/Alert/IP/geofence.svg' },
      { code: 'CE-WRP', name: 'Wrong Mother', count: this.wrongParentCount, icon: '/assets/Alert/CE-WRP.svg' }
    ];
  }
  
  constructor(private readonly workflowService: WorkflowService, public dialog: MatDialog, private readonly lookupTermService: LookupTermService,
    public commonService: CommonService, private readonly route: ActivatedRoute, public toastr: AppToastService, public datepipe: DatePipe) {
      this.commonService.validateUserPreference('infantWardFilter');
      this.activate_btn = this.commonService.getActivePermission('button');
      this.permissionCheck();
      this.getDynamicTableColumn()
  }

  ngOnInit() { 
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.tabChange(event);
    });
    this.searchLoc('ward');
    this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
        if (msg?.length) {
          msg = msg[0];
          this.alertBinding(msg);
        }
    });
  }

  ngOnDestroy(): void {
    this.lookupTermService.clearCache('Gender,CountryCode');
  }

  toggleRow(row: any): void {
    if (this.expandedRows.has(row)) {
      this.expandedRows.delete(row);
    } else {
      this.expandedRows.add(row);
    }
  }
  isExpanded(row: any): boolean {
    return this.expandedRows.has(row);
  }
  
  onWindowResized(size) {
    this.height = size;
  }

  ngAfterViewInit() {
    let label = 'Patient List';
    const tabNames = this.tabGroup._tabs.toArray();
    const index = tabNames.findIndex(tab => tab.textLabel?.trim() === label.trim());
    if (index >= 0) {
      this.selectedIndex = index;
      this.matTabChangeSub.next({index:this.selectedIndex, tab: { textLabel: label } });
    }
  }

  onTabChanged(event) {
    this.matTabChangeSub.next(event); 
  }

  tabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.loading = true;
    this.tableRecord =  new MatTableDataSource([]);
    if (this.selectedTab === 'Patient List') {
      this.alertDateFilter = null;
      this.getInfantList(this.locationId,this.applyFilterValue);
    } else if (this.selectedTab === 'Discharge List') {
      this.alertDateFilter = null;
      this.getInfantList(this.locationId,this.applyFilterValue);
    } else if (this.selectedTab === 'Alert History') {
      this.loading = false;
      this.alertDateFilter = new Date();
      this.getPatientAlert();
    } else {
      this.alertDateFilter = null;
    }
  }

  searchLoc(id) {
    if (id === 'ward') {
      this.commonService.getSpecialityLoc('CS-IP', 'LC-INT', null, 'WF-INF').subscribe(res => {
        this.rowFilter = res.results.map(item => ({ ...item, code: item.id, value: item.name }));
        const assetTypeFilter = this.parentFilter.find(filter => filter.id === 'Ward');
        if (assetTypeFilter) {
          assetTypeFilter.subFilters = this.rowFilter.map(({ code, value }) => ({ code, value }));
          assetTypeFilter.defaultSelected = this.rowFilter.map(({ code }) => code);
        }
      });
    }
  }
  alertBinding(msg) {
    if(msg['ctx'] != 'Alert'){
      if(msg['ctx'] == 'Tag' && msg['data'][0].hasOwnProperty('additionalInfo')) {
        let info = msg['data'][0]['additionalInfo']
        this.checkAutherize(info);
      }
      if(msg['ctx'] == 'PatientVisit') {
        this.refreshPage()
      }
    } else if(msg['data'][0]['ruleTypeId'] == "RU-GO") {
      let iotDetail = msg['data'][0]['IotAlertDetail'];
      iotDetail = iotDetail.filter(val => val.identifyingType == "Infant")
      if(iotDetail?.length) {
        this.refreshPage()
      }
    } else if(msg['data'][0]['ruleTypeId'] == 'RU-IN') {
      this.refreshPage();
    }
  }
  checkAutherize(info) {
    if(info.hasOwnProperty('eventInfo') && info.eventInfo?.length) {
      let checkAutherize = info.eventInfo.some(val => val.eventTypeId.includes('IET-'));
      if(checkAutherize) {
        this.refreshPage();      
      }
    }
  }

  permissionCheck() {
    if (this.activate_btn.includes('BT_MACRINF')) {
      this.showActions = [
        { id: 'enrollMother', value: 'Enroll Mother' },
        { id: 'enrollInfant', value: 'Enroll Infant' },
        { id: 'porter', value: 'Porter Request' }];
    } else {
      this.showActions = [{ id: 'porter', value: 'Porter Request' }];
    }
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('infant').subscribe((res) => {
      const dynamicColumns = res.results.contentObject;
      this.displayedColumns = dynamicColumns.displayedColumns;
      this.iconColumn = dynamicColumns.iconColumn;
      this.iconHeader = dynamicColumns.iconHeader;
      this.sortColumn = dynamicColumns.sortColumn;
      this.dataColumns = dynamicColumns.dataColumns;
      this.eventColumn = dynamicColumns.eventColumn
      if(dynamicColumns.pageSize && dynamicColumns.pageSize !== null) {
        this.pageSize = dynamicColumns.pageSize;
      } else {
        this.pageSize = 50;
      }
      if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('infantWardFilter')) {
          this.locationId = JSON.parse(this.commonService.userPreference.infantWardFilter.value);
         this.tabChange({index:this.selectedIndex, tab: { textLabel: this.selectedTab } });
      } else {
        this.locationId = '';
        this.tabChange({index:this.selectedIndex, tab: { textLabel: this.selectedTab } });
      }
    });
  }

  routerEventData() {
    let records = this.route.snapshot.data.infant.results;
    this.dataSource = records;
    this.tableData = records;
    this.getTagBatteryVal(records);
    records.forEach((row) => {
      if (row.children?.length) { this.expandedRows.add(row) }
    });
  }

  onToggleChange(cdkDetailRow: CdkDetailRowDirective, row?: any): void {
    if (!row.close) {
      row.close = true;
    }else {
      row.close = false;
    }
    if (!cdkDetailRow) {
      return
    }
    if (this.openedRow && this.openedRow !== cdkDetailRow && this.openedRow.expended) {
      this.openedRow.toggle();
    }
    if (!cdkDetailRow.expended) {
      setTimeout(() => {
        cdkDetailRow.toggle();
      },100);
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    if (this.applyFilterValue?.length >2){
      this.getInfantList(this.locationId,this.applyFilterValue)
    }else if (this.applyFilterValue?.length == 0){
      this.getInfantList(this.locationId,null)
    }
  }
  rowClick(data) {
    if (this.selectedName && data?.id == this.selectedName.id) {
      this.onChangeMenuData(data);
      this.rowId = null;
      this.selectedName = null;
      this.selectDropdown = null;
    } else {
      this.onChangeMenuData(data);
      const rowData = data;
      if(rowData) {
      this.rowId = rowData.id;
      this.selectedName = rowData;
      }
    }
  }

  onChangeMenuData(data) {
    this.subShowActions = [];
    if (data?.hasOwnProperty('associatedTagSerialNumber') && !data?.associatedTagSerialNumber) {
      this.subShowActions = this.subShowAction;
    } else {
      this.subShowActions = this.subShowAction;
      if(this.activate_btn.includes('BT_INMNGAUTH')) {
        this.subShowActions = this.subShowAction1;
      }
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.selectedName = null;
    this.rowId = null;
    this.locationId = (Number.isNaN(this.locationId)) ? '' : this.locationId;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getInfantList(this.locationId,this.applyFilterValue);
  }

  getInfantList(locationId?: string,name?:string): void {
    this.loading = true;
    let visitStatusId = null;
    if (locationId === null || locationId.includes('All')) {
      locationId = '';
    }
    if (this.rowFilter?.length === locationId?.length) {
      locationId = null;
    }
    if(this.selectedTab === 'Discharge List') {
      visitStatusId = 'VS-DC';
    }
    console.log(this.includeHierarchy)
    this.workflowService.getAllMother(locationId,name, this.includeHierarchy, visitStatusId).subscribe(res => {
      this.loading = false;
      let records = res?.results;
      records.forEach((row) => { if (row.children?.length) { this.expandedRows.add(row) } });
      this.tableData = records;
      this.getTagBatteryVal(records);
    });
  }

  stripHtmlUsingDOMParser(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || "")
      .replace(/\r?\n|\r/g, ' ') // Remove new lines
      .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
      .trim();
  }

  getTagBatteryVal(tableData) {
    this.loading = true;
    this.length = tableData?.length;
    let tagListChild = [];
    let tagListParent = tableData.filter(x => x.associatedTagSerialNumber);

    tableData.forEach(parent => {
      if (parent?.children?.length) {
        parent.children.forEach(child => {
          if (child.associatedTagSerialNumber) {
            tagListChild.push(child);
          }
        });
      }
    });
    const allTags = [...tagListParent, ...tagListChild].map(item => item.associatedTagSerialNumber).filter(Boolean);
    const tags = { entityIds: allTags };

    this.commonService.getTagBatteryStatus(tags).subscribe(res => {
      this.loading = false;
      if (res.statusCode === 1) {
        const results = res.results || [];
        const tagMap = new Map(results.map(r => [r.entityId, r.batteryValue]));
        tableData.forEach(parent => {
          parent.batteryPercentage = tagMap.get(parent.associatedTagSerialNumber) ?? null;
          parent.children?.forEach(child => {
            child.batteryPercentage = tagMap.get(child.associatedTagSerialNumber) ?? null;
            const authEvents = child.infantEventList?.filter(e => e?.eventTypeId === 'IET-AT') || [];
            if (authEvents?.length > 0) {
              const latestEvent = authEvents.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())[0];
              child.authorizeTimer = latestEvent.identifyingValue;
              child.eventAuthorizeTimer = latestEvent.eventTime;
            }            
          });
        });
      }
      this.dataSource = new MatTableDataSource(tableData);
      this.tableRecord = new MatTableDataSource(tableData);
      if (this.applyFilterValue != null) {
        this.tableRecord.filter = this.applyFilterValue;
      }
      this.tableRecord.paginator = this.paginator;
      this.tableRecord.sort = this.sort;
      this.tableRecord.data.forEach((row) => {
        if (row.children?.length) { this.expandedRows.add(row) }
      });
      this.computeAlertCardCounts();
    });
  }

  computeAlertCardCounts() {
     this.commonService.getMotherInfantAlertCount().subscribe(res => {
      if(res.results !== null) {
        const geofence = res.results?.alerts?.filter(x => x.alertCode === 'RU-GO');
        const tamper = res.results?.events?.filter(x => x.alertCode === 'CE-TAM');
        const wrongParent = res.results?.events?.filter(x => x.alertCode === 'CE-WRP');
        this.tamperCount = tamper?.length > 0 ? tamper[0]?.count : 0;
        this.geofenceCount = geofence?.length > 0 ? geofence[0]?.count : 0;
        this.wrongParentCount = wrongParent?.length > 0 ? wrongParent[0]?.count : 0;
      }
    })
  }
  manageCoster(data) {
    if (data.isChild) {
      data['workflowTypeId'] = 'WF-INF';
    } else {
      data['workflowTypeId'] = 'WF-MOT';
    }
    data['associationTypeId'] = data.tagAssociationTypeId;
    data['associatedName']    = data.tagAssociationType;
    data['associationId']     = data.id;
    data['tagId']             = data.associatedTagSerialNumber;
    data['tag_type_name']     = data.tagTypeName;
    data['visit_id']          = data.patientVisitId;
    localStorage.setItem('user_guide_menu_code', 'MN_OTIF_DAD');
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'));
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
  }

  patientInfo(data) {
    data['type'] = '1';
    data['patientId'] = data.id;
    data['workflow'] = 'Infant';
    localStorage.setItem('user_guide_menu_code', 'MN_OTIF_PTSU');
    const dialogRef = this.dialog.open(PatientInfoComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'));
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
  }

  getFloorData(rowData) {
    this.rowData = rowData;
    this.selectedName = rowData.id;
    rowData['tagTypeId'] = rowData?.tagAssociationTypeId;
    rowData['tagSerialNumber'] = rowData.tagSerialNumber === null ?  rowData?.associatedTagSerialNumber : rowData.tagSerialNumber;
    if (rowData.associatedTagSerialNumber != null && rowData.bedId != null) {
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        data: rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage()
      });
    }
  }
  
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'manageAction') {
      this.manageAction(event.data, event.keyVal);
    } else if (event.key === 'manageWorklist') {
      this.manageWorklist(event.data);
    } else if (event.key === 'groupFilter') {
      let wardData = event.data.filter(val => val.id == 'Ward')
      let includelData = event.data.filter(val => val.id == 'Includelinked')
      this.locationId = wardData.map(val => val.data);
      this.includeHierarchy = includelData?.length ? includelData[0].data : null;
      this.getInfantList(this.locationId, null);
    } else if (event.key === 'dateFilter') {
      this.alertDateFilter = event.data;
      if (this.selectedTab === 'Alert History') {
        this.getPatientAlert();
      }
    } else {
      this.refreshPage(true);
    }
  }

  manageWorklist(locId) {
    this.locationId = locId;
    this.commonService.validateUserPreference('infantWardFilter',  JSON.stringify(locId));
    this.getInfantList(this.locationId,this.applyFilterValue);
  }
  manageAction(value, data) {
    if (value === 'modify') {
      if (data.isChild === true) {
        data['workflowTypeId'] = 'WF-INF';
      } else {
        data['workflowTypeId'] = 'WF-MOT';
      }
      this.enrollInfant(data);
    } else if (value === 'disengage') {
      this.disengageAlarm(data);
    } else if (value === 'porter' && data !== true) {
      this.getPorterRequest(data);
    } else if (value === 'porter' && data === true) {
      localStorage.setItem('user_guide_menu_code', 'MN_OTIF_PORQ');
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-OT', id: '0', name: 'others'},
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'));
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown = null;
        this.refreshPage();
      });
    } else if (value === 'enrollMother' || value === 'enrollInfant') {
      this.enrollMotherOrInfant(value);
    }
  }

  enrollMotherOrInfant(value) {
    let data = {};
    if (value === 'enrollMother') {
      data = {'workflowTypeId' : 'WF-MOT', 'eType': 'mother'};
      this.selectDropdown = 'enrollMother';
    } else {
      data = {'workflowTypeId' : 'WF-INF', 'eType': 'infant'};
      this.selectDropdown = 'enrollInfant';
    }
    localStorage.setItem('user_guide_menu_code', 'MN_OTIF_CR');
    const dialogRef = this.dialog.open(EnrollInfantComponent, {
      height: '100%',
      data: data,
      panelClass: ['large-popup'], disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'));
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.selectDropdown = null;
      this.refreshPage();
    });
  }
  disengageAlarm(data) {
    let msg = '';
    if (data?.isAlertDisabled) {
      msg = 'Do you want to Engage Alarm ?';
    } else {
      msg = 'Do you want to Disengage Alarm ?';
    }
    localStorage.setItem('user_guide_menu_code', 'MN_OTIF_ALRM');
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['mdm-Confirmation-popup'],
      height: 'auto',
      width: '650px',
      disableClose: true,
      data: {
        title: 'Manage Authorized Movement',
        disengageAlarm: true,
        isEngage: data.isAlertDisabled,
        isRemark: 1,
        infantData: data,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'));
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      if (result === 'Yes') {
        if (data.isAlertDisabled) {
          data.isAlertDisabled = false;
        } else {
          data.isAlertDisabled = true;
        }
      }
    });
  }
  getPorterRequest(data) {
    this.selectDropdown = 'porter';
    if (data.porterRequestId && data.porterRequestId !== null) {
      this.workflowService.getPorterRequest(data.porterRequestId).subscribe((res) => {
        const porterData = res.results[0];
        localStorage.setItem('user_guide_menu_code', 'MN_OTIF_PORQ');
        const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: porterData,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          const menu = JSON.parse(localStorage.getItem('currentMenu'));
          localStorage.setItem('user_guide_menu_code', menu[0].code);
          this.selectDropdown = null;
          this.refreshPage();
        });
      });
    } else {
      let sourceBedId = data.bedId;
      let destinationBedId = null;
      let infantInfo = null
      let comments = null;
      if(data.motherId) {
        let motherData = this.tableRecord.data.filter(val => val.id == data.motherId)
        infantInfo =  data;
        comments = 'Infant movement';
        if(motherData?.length && motherData[0]['visitStatusId'] != "VS-DC") {
          if(motherData[0]['locationId'] != data['currentLocationId']) {
            destinationBedId = motherData[0]['bedId']
            destinationBedId = destinationBedId != infantInfo.bedId ? destinationBedId : null          
          } else {
            sourceBedId = motherData[0]['bedId'];
            destinationBedId = data.bedId;
          }
        }
      }
      localStorage.setItem('user_guide_menu_code', 'MN_OTIF_PORQ');
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-PA', id: data.id, name: data.firstName,
          sourceBedId : sourceBedId,
          destinationBedId : destinationBedId,
          infantInfo : infantInfo,
          assetCategory : 'AT-STO2',
          comments : comments
        },
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        const menu = JSON.parse(localStorage.getItem('currentMenu'));
        localStorage.setItem('user_guide_menu_code', menu[0].code);
        this.selectDropdown = null;
        this.refreshPage();
      });
    }
  }
  cancelAlert(alertData: any, patient?: any) {

    const currentAlertCode = alertData.eventCode || alertData.alertCode || alertData.ruleTypeId;
    const code = String(currentAlertCode || '').toUpperCase().trim();
    const isThreeAlerts = code === 'RU-GO' || code === 'CE-TAM' || code === 'CE-WRP';

    const getAlertDateTime = (alert: any) => {
      if (alert.sentDatetime) return alert.sentDatetime;
      if (alert.sentDateTime) return alert.sentDateTime;
      if (alert.eventTime) return alert.eventTime;
      if (alert.message) {
        const match = alert.message.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\s(?:AM|PM)/i);
        if (match) return match[0];
        const match2 = alert.message.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
        if (match2) return match2[0];
      }
      return new Date().toISOString();
    };

    if (isThreeAlerts) {
      let alertName = alertData.eventName || alertData.eventCode || alertData.alertCode;
      if (!alertName || ['RU-GO', 'CE-TAM', 'CE-WRP'].includes(String(alertName).toUpperCase().trim())) {
        if (code === 'RU-GO') alertName = 'Geofence';
        else if (code === 'CE-TAM') alertName = 'Tampered';
        else if (code === 'CE-WRP') alertName = 'Wrong Mother';
        else alertName = currentAlertCode || 'Alert';
      }

      const selectedAlertMapped = {
        id: alertData.iotAlertId || alertData.alertId || alertData.id,
        configName: alertName,
        message: alertData.message,
        sentDatetime: getAlertDateTime(alertData),
        alertTypeId: 'AT-AL',
        ruleTypeId: code,
        identifyingType: 'Patient',
        identifyingId: patient?.patientId || patient?.id,
        alertDetails: [
          { identifyingType: 'Location', identifyingValue: patient?.locationId || patient?.wardId },
          { identifyingType: 'Tag', identifyingValue: patient?.tagId || patient?.tagSerialNumber },
          { identifyingType: 'Patient', identifyingValue: patient?.patientId || patient?.id, identifyingValueName: patient?.patientName || patient?.fullName || patient?.name },
          ...(currentAlertCode ? [{ identifyingType: 'Event', identifyingValue: currentAlertCode }] : [])
        ]
      };

      const allPatientAlerts: any[] = [];
      if (patient) {
        if (patient.alerts && Array.isArray(patient.alerts)) {
          patient.alerts.forEach((alt: any) => {
            const altCode = String(alt.alertCode || alt.ruleTypeId || '').toUpperCase().trim();
            if (altCode === 'RU-GO') {
              let altName = alt.eventName || alt.alertCode;
              if (!altName || altName === 'RU-GO') altName = 'Geofence';
              allPatientAlerts.push({
                id: alt.iotAlertId || alt.alertId || alt.id,
                configName: altName,
                message: alt.message,
                sentDatetime: getAlertDateTime(alt),
                alertTypeId: 'AT-AL',
                ruleTypeId: altCode,
                identifyingType: 'Patient',
                identifyingId: patient.patientId || patient.id,
                alertDetails: [
                  { identifyingType: 'Location', identifyingValue: patient.locationId || patient.wardId },
                  { identifyingType: 'Tag', identifyingValue: patient.tagId || patient.tagSerialNumber },
                  { identifyingType: 'Patient', identifyingValue: patient.patientId || patient.id, identifyingValueName: patient.patientName || patient.fullName || patient.name }
                ]
              });
            }
          });
        }

        if (patient.events && Array.isArray(patient.events)) {
          patient.events.forEach((evt: any) => {
            const evtCode = String(evt.eventCode || '').toUpperCase().trim();
            if (evtCode === 'CE-TAM' || evtCode === 'CE-WRP') {
              let evtName = evt.eventName || evt.eventCode;
              if (!evtName || evtName === 'CE-TAM' || evtName === 'CE-WRP') {
                evtName = evtCode === 'CE-TAM' ? 'Tampered' : 'Wrong Mother';
              }
              allPatientAlerts.push({
                id: evt.iotAlertId || evt.alertId || evt.id,
                configName: evtName,
                message: evt.message,
                sentDatetime: getAlertDateTime(evt),
                alertTypeId: 'AT-AL',
                ruleTypeId: evtCode,
                identifyingType: 'Patient',
                identifyingId: patient.patientId || patient.id,
                alertDetails: [
                  { identifyingType: 'Location', identifyingValue: patient.locationId || patient.wardId },
                  { identifyingType: 'Tag', identifyingValue: patient.tagId || patient.tagSerialNumber },
                  { identifyingType: 'Patient', identifyingValue: patient.patientId || patient.id, identifyingValueName: patient.patientName || patient.fullName || patient.name },
                  { identifyingType: 'Event', identifyingValue: evt.eventCode }
                ]
              });
            }
          });
        }
      }

      const exists = allPatientAlerts.some(a => a.id === selectedAlertMapped.id);
      if (!exists) {
        allPatientAlerts.unshift(selectedAlertMapped);
      }

      const dialogRef = this.dialog.open(NotificationAlertPopupComponent, {
        data: {
          selectedAlert: selectedAlertMapped,
          allAlerts: allPatientAlerts,
          ruleFilterList: [],
          hideCamera: false,
          hideSidebar: false,
          patientDetails: patient
        },
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.refreshPage();
        }
      });
    } else {
      if (alertData.iotAlertId != null) {
        alertData['alertId'] = alertData.iotAlertId;
      } else if (alertData.id != null) {
        alertData['alertId'] = alertData.id;
      }

      const dialogRef = this.dialog.open(InfantAlertDialogComponent, {
        panelClass: ['infant-alert-popup'],
        disableClose: true,
        data: { alert: alertData, patient: patient || null },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.refreshPage();
        }
      });
    }
  }
  enrollInfant(data) {
    const parent =  this.tableData?.filter(x => x.id === data.motherId);
    if(parent?.length > 0) {
      data['parentVisitStatusId'] = parent[0].visitStatusId;
    }
    localStorage.setItem('user_guide_menu_code', 'MN_OTIF_MD');
    const dialogRef = this.dialog.open(EnrollInfantComponent, {
      height: '100%',
      data: data,
      panelClass: ['large-popup'], disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'));
      localStorage.setItem('user_guide_menu_code', menu[0].code);
      this.refreshPage();
    });
  }
  getPatientAlert() {
    this.spinLoader = true;
    this.noData = false;
    const date = this.alertDateFilter ? this.datepipe.transform(this.alertDateFilter, 'yyyy-MM-dd') : null;
    this.commonService.getMotherInfantAlerts(this.pageStart, this.pageSize, date).subscribe((res) => {
      if (res.statusCode == 1) {
        this.HCDisplayedColumns = ['pfRuleName', 'Event', 'Message', 'Start Time', 'End Time', 'Comments', 'Status'];
        this.AHdataSource = new MatTableDataSource<any>(res.results);
        this.AHdataSource.paginator = this.AHPaginator;
        this.AHLength = res.total ? res.total : res.results.length;
        this.spinLoader = false;
      } else if (res.statusCode == 0) {
        this.spinLoader = false;
        this.noData = true;
      }
    });
  }

  onAHPageChange(event: any) {
    this.pageStart = event.pageIndex * event.pageSize;
    this.pageSize = event.pageSize;
    this.getPatientAlert();
  }

  getAck(data) {
    data['patientId'] = this.selectedName?.id;
    if (data.hasOwnProperty('ackDatetime') && data.ackDatetime) {
      data['iotAlertId'] = data['id'];
      data['type'] = 'RQT-NC';
      data['description'] = data['message'];
      data['destinationName'] = this.selectedName ? (this.selectedName['bedNo'] + ', ' + this.selectedName['locationName']) : '';
      data['permissionTab'] = ['Task'];
      const dialogRef = this.dialog.open(WorkflowManagementComponent, {
        data: data, panelClass: ['large-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.getPatientAlert();
      });
    } else {
      const dialogRef = this.dialog.open(AcknowledgementComponent, {
        width: '600px', height: '300px', panelClass: 'pop-up-margin',
        data: data
      });
      dialogRef.afterClosed().subscribe(result => {
        this.getPatientAlert();
      });
    }
  }

  getTaskDetail(taskIds) {
    let data = this.selectedName || {};
    data['RType'] = 'inpatient';
    data['permissionTab'] = ['Task List'];
    data['entityType'] = 'Patient';
    data['entityId'] = this.selectedName?.id;
    data['taskIds'] = taskIds;
    const dialogRef = this.dialog.open(WorkflowManagementComponent, {
      data: data,
      panelClass: ['large-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  initializeDetailRows(): void {
    setTimeout(() => {
      if (!this.dataSource?.data) {
        return;
      }
      this.detailRows.forEach((detailRow, index) => {
        const row = this.dataSource.data[index];
        if (row && detailRow) {
          this.onToggleChange(detailRow, row);
        }
      });
    },400);
  }
  fixClick() {
    console.log('')
  }    
}

