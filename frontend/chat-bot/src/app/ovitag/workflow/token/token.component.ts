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
import { AfterViewInit, Component, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { CommonService, DashboardService, TextToSpeechService, WorkflowService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { EnrollTokenComponent } from './enroll-token/enroll-token.component';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
import { MY_FORMATS } from '../../../app.module';
import { MatTableDataSource } from '@angular/material/table';
import { CdkDetailRowDirective } from '../infant/cdk-detail-row.directive';
import { BehaviorSubject, Subject } from 'rxjs';
import { MatTabGroup } from '@angular/material/tabs';
import { debounceTime } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { AppToastService } from '../../../shared/services/toaster.service';
import { EditDailyManagementComponent } from '../../../shared/modules/entry-component/edit-daily-management/edit-daily-management.component';
import { RegisterPatientComponent } from '../../digital-queue/digital-queue.component';
import { DigitalQueueModel, DigitalQueueModelCols, DigitalQueueModelId, DigitalQueueModelRows } from '../../digital-queue/digital-queue.model';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { routerTransition } from '../../../router.animations';

@Component({
  selector: 'app-token',
  templateUrl: './token.component.html',
  styleUrls: ['./token.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    routerTransition()
  ],
})
export class TokenComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns:string[] = ["ID","Add","Count","Token Type","Visit Type","Token","Name","Token Time","Mobile","Location Name","Status","CheckIn Time","CheckOut Time"];
  eventColumn =['id'];
  iconHeader =['ID', 'Add', 'Count'];
  iconColumn=['ID', 'Token', 'Count', 'Token Time', 'CheckIn Time', 'CheckOut Time'];
  sortColumn = ["ID","Add","Count","Token Type","Visit Type","Token","Name","Token Time","Mobile","Location Name","Status","CheckIn Time","CheckOut Time"];
  permissionControl =[];
  permission = null;
  tableData: any =[];
  public currentDate = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public rowData: any = [];
  public applyFilterValue: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [{ id: 'Enroll', value: 'Enroll' }];
  showAction2 =[{id:'Modify',value:'Modify'}];
  showActions = this.showAction1;
  filterValue = null;
  locationTokens = [];
  TokenbyLocation = {};
  locations = []
  loading = false;
  public pageStart : number = 0;
  public pageSize: number = 50;
  public name: null;
  public length = 0;
  public dataSource : MatTableDataSource<any>;
  private openedRow: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;
  @ViewChildren(CdkDetailRowDirective) detailRows!: QueryList<CdkDetailRowDirective>;
  dataColumns = ['Id', "add", "totalChildCounts" ,'tokenTypeName','visitTypeName','tokenNo','name', 'createdTime', 'mobileNo', 'locationName','queueStatusName','fromTime','toTime'];
  rowId = null;
  public matTabChangeSub : Subject<any> = new Subject();
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  public selectedIndex = 0;
  public selectedTab: string;
  //queue
  public digitalQueueModel: DigitalQueueModel;
  public digitalQueueModelCols: DigitalQueueModelCols;
  public digitalQueueModelRows: DigitalQueueModelRows;
  public digitalQueueModelId: DigitalQueueModelId;
  tokenQueueData: any=[];
  slideForm: FormGroup;
  activate_btn: any=[];
  public selectedLocation = new FormControl([]);
  locationId = null;
  locationListDisplay: any=[];
  locationList: any=[];
  today = new Date();
  pendingDetail: any=[];
  pendingTestDetailByLoc: any=[];
  inprogressDetail: any=[];
  waitingDetail: any=[];
  completedDetail: any=[];
  completedDetailList: any=[];
  locationDetails: any=[];
  selectedQueue: any=[];
  isAvailable: any;
  updateLocId: any;
  public locationGender: string;
  public locationLanguage = 'NA';
  public locationGenderCode: any;
  public locationLanguageCode: any;
  public updateTestId = 0;
  public testList: any;
  public filterTest = false;
  @ViewChild('locationVisitType') input;
  @ViewChild('searchInputClear') searchInputClear;
  filter = 'complete';
  public obj = new BehaviorSubject<Object>([]);
  public isEnablePendingTest = false;
  enableCountClick = true;
  enableMultiView = true;
  enableUnmappedTest = true;
  showActiveInactive = true;
  dqtowerconfig: any = [];
  dynamicConfig = false;
  changeLocation = false;
  public visitTypes: Array<any> = [];
  public floorList: Array<any> = [];
  public selectedFloor = null;
  public floorData: Array<any> = [];
  updateFloorId: any;
  digitalQueueList: any=[];
  digitalQueueList_new: any=[];
  overall_interval: any;
  gridCols: any;
  list_height: number;
  locationSearch: any;
  testAvailableLocation: any=[];
  public isParalelTest: any = false;
  public unmappedhide : any [] = [];
  public parentFilterPrev = [
    {
      id: 'Billing Counter',
      value: 'Billing Counter',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
      showLabel : true
    },
    {
      id: 'Status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [{code: 'QS-PE', value: 'Pending'},
                   {code: 'QS-WT', value: 'Waiting'}, 
                   {code: 'QS-RG', value: 'Ready To Go'}, 
                   {code: 'QS-IP', value: 'In Progress'}, 
                   {code: 'QS-CO', value: 'Completed'}],
      defaultSelected: [],
      showLabel : true
    },
  ];
  public parentFilter = [];
  counterId = null;
  statusId = null;
  enableSpeak = false;
  speak = null;
  isSpeaking = false;

  constructor(public workflowService : WorkflowService, public commonService : CommonService,public datepipe: DatePipe,private readonly dialog: MatDialog, public textToSpeech : TextToSpeechService,
    private readonly fb: FormBuilder, private readonly dashboardService: DashboardService, private readonly cookieService: CookieService, public toastr: AppToastService) { 
      this.activate_btn = this.commonService.getActivePermission("button");
      this.digitalQueueModel = new DigitalQueueModel();
      this.digitalQueueModelCols = new DigitalQueueModelCols();
      this.digitalQueueModelRows = new DigitalQueueModelRows();
      this.digitalQueueModelId = new DigitalQueueModelId();
    }

  ngOnInit(): void {
    this.matTabChangeSub.pipe(debounceTime(500)).subscribe(event => {
      this.TabChange(event);
    }); 
    this.getLocationList();
    this.commonService.getConfigFile('ui-refresh').subscribe(res => {
      let menuCode = 'MN_DQRD';
      if (res && res.results ) {
        const contentData = JSON.parse(res.results.content);
        if (contentData.hasOwnProperty(menuCode)){
          if(contentData[menuCode].hasOwnProperty('speak')){
            this.speak = contentData[menuCode]['speak'];
            this.enableSpeak = contentData[menuCode]['speak']['enableSpeak'];
          }
        }
      }
    });
  }

  getLocationList() {
    const category = {key: 'testCategoryId', value: 'TC-BILL'};
    this.dashboardService.getHealthPlanLocations(category).subscribe(res => {
      if(res.results?.length > 0) {
        const locationList = res.results.map(({ id, name }) => ({ id, name }));
        const counterFilter = this.parentFilterPrev.find(filter => filter.id === 'Billing Counter');
        if (counterFilter && locationList?.length > 0) {
          locationList?.forEach(x => {
            counterFilter.subFilters.push({code: x.id, value: x.name});
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    window?.speechSynthesis?.cancel();
  }

  buildForm() {
    this.slideForm = this.fb.group({
      checkout: false,
      partial: false,
      parallelTest: true
    });
  }

  ngAfterViewInit() {
    let label = 'Token List';
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

  TabChange(event) {
    this.selectedIndex = event.index;
    this.selectedTab = event.tab.textLabel;
    this.loading = true;
    this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    if (this.selectedTab === 'Token List') {
      this.selectedView = 'table';
      this.parentFilter = this.parentFilterPrev;
      this.getLocationToken(this.selectedDate,this.pageStart,this.pageSize);
    } else if(this.selectedTab === 'Token Queue') {
      this.selectedView = 'queue';
      this.parentFilter = [];
      this.onResizeWindowF(window.innerHeight);
      if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
        this.gridCols = 4;
      } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
        this.gridCols = 4;
      } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
        this.gridCols = 2;
      } else if (window.innerWidth <= 768) {
        this.gridCols = 1;
      } else {
        this.gridCols = 4;
      }
      this.getHealthPlanLocation();
      this.getVisitType();
      this.getdqtowerconfig();
    }
  }

  getLocationToken(date?,pageStart?,pageSize?,locationId?,statusId?) {
    this.workflowService.getGroupToken(date,pageStart,pageSize,null,locationId,statusId).subscribe(res => {

        this.loading = true;
        this.locationTokens = res.results;
        this.tableData = res.results;
        this.length = res.totalRecords;
        this.dataSource = new MatTableDataSource<any>(this.tableData);
        for (let i = 0; i < this.dataColumns.length; i++) {
          this.tableData.map(item => {
            item[this.displayedColumns[i]] = item[this.dataColumns[i]];
          });
        }
        this.locations = this.commonService.getDistinctValues(this.locationTokens, 'locationId');
        for(let i in this.locations) {
          this.TokenbyLocation[this.locations[i]] = this.locationTokens.filter(val => val.locationId == this.locations[i])
        }
        this.loading = false;
    })
  }

  rowClick(data){
    if (this.selectedName && data.id == this.selectedName.id) {
      this.rowId = null;
      this.selectedName = null;
      this.showActions = this.showAction1;
    } else {
      this.rowId = data.id;
      this.selectedName = data;
      this.showActions = this.showAction2;
    }
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

  fixClick() {
    console.log('');
  }

  refreshPage() {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (this.selectedTab === 'Token List') {
      this.getLocationToken(this.selectedDate,this.pageStart,this.pageSize);
    } else if(this.selectedTab === 'Token Queue') {
      this.onResizeWindowF(window.innerHeight);
      this.refreshlocation();
    }
  }

  applyFilter(filterValue) {
    filterValue = filterValue.trim(); 
     filterValue = filterValue.toLowerCase(); 
     this.applyFilterValue = filterValue;
     this.dataSource.filter = filterValue;

  }
  headerEventAction(event) {
    console.log(event)
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'Enroll') {
      this.enrollToken(null);
    } else if (event.data === 'Modify'){
      this.enrollToken(event.keyVal);
    } else if (event.key === 'groupFilter') {
      let counter = event.data.filter(val => val.id == 'Billing Counter')
      let status = event.data.filter(val => val.id == 'Status')
      this.counterId = counter.map(val => val.data);
      this.statusId = status.map(val => val.data);
      this.getLocationToken(this.selectedDate,this.pageStart,this.pageSize, this.counterId, this.statusId);
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getLocationToken(this.selectedDate,this.pageStart,this.pageSize);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }
  eventAction(event){
   if (event.key === 'pagination') {
      this.getPagination(event);
    } else if (event.key === 'Token'){
      this.enrollToken(event.data);
    } 
  }
  
  getPagination(event) {
    this.pageSize = event?.data?.pageSize ? event?.data?.pageSize : event?.pageSize;
    this.pageStart = event?.data?.pageIndex ? event?.data?.pageIndex : event?.pageIndex;
    this.getLocationToken(this.selectedDate,this.pageStart,this.pageSize);
  }

  enrollToken(data: any) {
    this.showActions = null;
    this.selectedName = data;
    const dialogRef = this.dialog.open(EnrollTokenComponent,
      { data: data, height:'800px',width:'800px', panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.showActions = null;
  }

  //Queue

  onResizeWindowF(data) {
    const height = (data - 172) / 46;
    this.list_height = data - 300;
    console.log(data, height, this.list_height)
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }
  
  onResizeWindow(event) {
    const height = (event.target.innerHeight - 172) / 46;
    this.list_height = event.target.innerHeight - 300;
    this.digitalQueueModelRows.DQ_LA = Math.round(height);
    this.digitalQueueModelRows.DQ_CN = Math.round(height);
    this.digitalQueueModelRows.DQ_SP = Math.round(height);
    this.digitalQueueModelRows.DQ_WA = Math.round(height);
    this.digitalQueueModelRows.DQ_IP = Math.round(height);
    this.digitalQueueModelRows.DQ_CO = Math.round(height);
  }
  
  onResize(event) {
    if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
      this.gridCols = 4;
    } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
      this.gridCols = 3;
    } else if (event.target.innerWidth <= 768) {
      this.gridCols = 1;
    } else {
      this.gridCols = 4;
    }
  }

  stopAudio(list) {
    if(this.isSpeaking) {
      window?.speechSynthesis?.cancel();
      this.isSpeaking = false;  
      this['tokenNo' + list?.tokenNo] = true;
    }
  }
  
  playAudio(list) {
    window?.speechSynthesis?.cancel();
    this.isSpeaking = true;
    this['tokenNo' + list?.tokenNo] = false;
    let text = [];
    const token = list?.tokenNo.split('').join(' ').replace(/\s+/g, ' ').trim();
    const speak = this.speak['text'].replace(/<tokenNo>/g, token).replace(/<queueStatusName>/g, list?.patientStatusName).replace(/<locationName>/g, list?.locationName ?? '');
    for(let i=0; i<this.speak?.repeat; i++) {
      console.log(speak)
      text.push(speak);
    }
    if(text?.length > 0) {
      console.log(text, this.speak)
      this.textToSpeech.speak(text, "en-IN", 1, this.speak?.speed, 1, this.speak?.voice).then(() => {
        this.isSpeaking = false;  
        this['tokenNo' + list?.tokenNo] = true;
        });
    }
  }

  getHealthPlanLocation() {
    this.loading = true;
    const category = {key: 'testCategoryId', value: 'TC-BILL'};
    this.dashboardService.getHealthPlanLocations(category).subscribe(res => {
      this.locationListDisplay = res.results;
      this.locationList = this.locationListDisplay.slice();
      if (this.locationList.length > 0) {
        this.loading = false;
        if (this.cookieService.check(
          'TK_DQ_Location_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          let locationIds = this.cookieService.get(
            'TK_DQ_Location_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
          let locIds = eval ('['+ locationIds +']')
          this.selectedLocation.setValue(locIds)
        } else {
          if (this.locationList[0].hasOwnProperty('id')) {
            this.locationId = this.locationList[0].id;
            this.selectedLocation.setValue([this.locationId])
          }
          this.cookieService.delete('TK_DQ_Location_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
          this.cookieService.set(
            'TK_DQ_Location_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
            this.locationId
          );
        }
        this.openedChange(false)
      }
    });
  }
  
  openedChange(isOpended) {
    if(!isOpended)
      {
        this.locationId = null;
        let locIds = null;
        if(this.selectedLocation.value.length != 0) {
          this.locationId = this.selectedLocation.value.toString();
          let locCookieName = 'TK_DQ_Location_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          this.cookieService.delete(locCookieName);
          this.cookieService.set(locCookieName, this.locationId);
        }
        this.getLocationDetail(true);
      }
  }
  getLocationDetail(sub_call) {
    let id = this.selectedLocation.value.toString();
    id = id != '' ? id : null;
    if (id) {
      if (id == this.locationId) {
        this.filterTest = true;
      } else {
        this.filterTest = false;
      }
      // console.log('inside location details..........');
      this.today = new Date();
      // this.locationId = id;
      this.pendingDetail = [];
      this.pendingTestDetailByLoc = [];
      this.inprogressDetail = [];
      this.waitingDetail = [];
      this.completedDetail = [];
      this.getAvailableLocationByLocId();
      this.completedDetailList = [];
      this.loading = true;
      this.workflowService.getTokenQueue(id).subscribe(res => {
        // console.log('location level.......',res.results);
        this.locationDetails = res.results;
        this.pendingTestDetailByLoc = res.results['QS-PE'];
        this.waitingDetail = res.results['QS-WT'];
        this.inprogressDetail = res.results['QS-IP'];
        this.selectedQueue = [];
        this.completedDetail = res.results['QS-CO'];
        if (!res.results.hasOwnProperty('QS-WT')) {
          this.waitingDetail = [];
        }
        this.loading = false;
        this.getAllHealthTestLocation();
      });

      const filterLocation = this.locationList.filter(res => res.id == id);
      if (filterLocation.length > 0) {
        this.isAvailable = filterLocation[0].isAvailable;
        this.updateLocId = filterLocation[0].id;
        this.buildForm();
      }
    }
  }

  getAvailableLocationByLocId() {
    if (this.selectedLocation.value.length == 1) {
      let locId = this.selectedLocation.value[0];
      this.commonService.getAvailableLocationByLocId(locId).subscribe(res => {
        if (res.statusCode === 1) {
          this.isAvailable = res.results.isAvailable;
          if (res.results.gender != null) {
            this.locationGender = res.results.genderName;
            this.locationGenderCode = res.results.gender;
          } else {
            this.locationGender = null;
          }
          if (res.results.languages[0] != null) {
            this.locationLanguage = res.results.languageNames[0];
            this.locationLanguageCode = res.results.languages[0];
          } else {
            this.locationLanguage = 'NA';
          }
        }
      });
    }
  }

  getAllHealthTestLocation() {
    if (this.locationId !== null) {
      this.commonService.getAllHealthTestLocation(this.locationId).subscribe(res => {
        this.testList = res.results;
        if (this.testList.length > 0) {
          if (this.filterTest && this.updateTestId !== 0) {
            this.updateTestId = this.updateTestId;
          } else {
            // this.updateTestId = this.testList[0].testId;
            this.updateTestId = 0;
          }
          this.getPendingTestByLocId(this.filter, this.updateTestId);
          this.buildForm();
        }
      });
    }
  }

  getPendingTestByLocId(filter, testId ?: number) {
    this.filter = filter;
    this.updateTestId = testId;
    this.completedDetailList = [];
    if (this.searchInputClear !== undefined) {
      this.searchInputClear.nativeElement.value = '';
    }
    if (filter === 'pending') {
      // if (testId == 0) {
      //   this.updateTestId = this.slideForm.controls['testId'].value;
      // }
      this.isEnablePendingTest = true;
      if (this.updateTestId == 0) {
        this.completedDetailList = this.pendingTestDetailByLoc;
      } else {
        this.completedDetailList = this.pendingTestDetailByLoc.filter(res => res.testId === this.updateTestId);
      }
    } else {
      this.completedDetailList = this.completedDetail;
      this.isEnablePendingTest = false;
    }
  }

  getdqtowerconfig() {
    this.commonService.getConfigFile('dq-token-tower-config').subscribe(res => {
      if(res.statusCode) {
				this.dynamicConfig = true;
       this.dqtowerconfig = res.results.contentObject.token;
       if(this.dqtowerconfig.hasOwnProperty('enableCountClick')) {
        this.enableCountClick = this.dqtowerconfig.enableCountClick;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableMultiView')) {
        this.enableMultiView = this.dqtowerconfig.enableMultiView;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableUnmappedTest')) {
        this.enableUnmappedTest = this.dqtowerconfig.enableUnmappedTest;
       }
       if(this.dqtowerconfig.hasOwnProperty('showActiveInactive')) {
        this.showActiveInactive = this.dqtowerconfig.showActiveInactive;
       }
       if(this.dqtowerconfig.hasOwnProperty('changeLocation')) {
        this.changeLocation = this.dqtowerconfig.changeLocation;
       }
      }
    });
  }

  statusChange(status, locId) {
    this.commonService.getAllTestsByLocation(locId).subscribe(res => {
      const locdata = res.results;
      if (status === true) {
        locdata.isAvailable = true;
      } else {
        locdata.isAvailable = false;
      }
      let reqDetail = res.results;
      reqDetail['disableQueueLength'] = this.activate_btn.includes('TB_WFDQQLEN') ? false : true;
      reqDetail['disableCapacity'] = this.activate_btn.includes('TB_WFDQCAP') ? false : true;
      reqDetail['viewType'] = 'token';
      const dialogRef = this.dialog.open(EditDailyManagementComponent, {
        data: reqDetail,
        panelClass: ['medium-popup'], disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log(result)
        this.getFloorList();
        this.getLocationDetail(true);
        this.getHealthPlanLocation();
        this.getVisitType();
      });
    });
  }

   getVisitType() {
    this.commonService.getAppTermsVerion2('VisitType').subscribe(res => {
      this.visitTypes = res.results;
    });
  }

  refreshlocation() {
    this.getLocationDetail(true);
  }

  manageRoom(locId) {
    this.commonService.getAvailableLocationByLocId(locId).subscribe(res => {
      if (res.statusCode === 1) {
        const dialogRef = this.dialog.open(RegisterPatientComponent, {
          data: { 'locationId': locId, 'gender': res.results.gender, 'language': res.results.languages[0] },
          panelClass: ['mdm-Confirmation-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          this.getAvailableLocationByLocId();
        });
      }
    });
  }

  getFloorList() {
    this.dashboardService.getFloorList().subscribe(res => {
      this.floorList = res.results;
      if (this.floorList.length > 0) {
        if (this.cookieService.check(
          'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        } else {
          this.cookieService.delete('TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
          this.cookieService.set(
            'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
            this.selectedFloor
          );
          if (this.floorList[0].hasOwnProperty('id')) {
            this.selectedFloor = this.floorList[0].id;
          }
        }
        this.getFloorDetail(this.selectedFloor);
      }
    });
  }
  getFloorDetail(id) {
    // if (this.selectedFloor == null || this.selectedFloor !== id) {
    this.selectedFloor = id;
    if (this.selectedFloor != null) {
      // this.slideForm.controls['floorId'].setValue(id);
      this.cookieService.delete('TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
      this.cookieService.set(
        'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
        this.selectedFloor
      );

      if (this.cookieService.check(
        'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      )) {
        this.selectedFloor = this.cookieService.get(
          'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        );
      } else {
        this.cookieService.delete('TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
        this.cookieService.set(
          'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
          this.selectedFloor
        );

        if (this.cookieService.check(
          'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'TK_DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        }
      }
      if (typeof (id) === 'string') {
        id = parseInt(id, 10);
      }
      this.dashboardService.getPatientByFloorId(this.selectedFloor).subscribe(res => {
        this.loading = true;
        this.floorData = res.results;
        this.loading = false;
      });
      const filterFloor = this.floorList.filter(res => res.id === id);
      if (filterFloor.length > 0) {
        this.updateFloorId = filterFloor[0].id;
        this.buildForm();
      }
    }
  }

  setLastStatusId(newStatus: string, patient: any): string | null {
		const currentStatus = patient?.queueStatusId;
		const existingLast = patient?.lastStatusId ?? null;
		const order: Record<string, number> = {
			'QS-PE': 1,
			'QS-WT': 2,
			'QS-RG': 2,
			'QS-NE': 2,
			'QS-IP': 3,
			'QS-CO': 4
		};
		const isForward = order[newStatus] > order[currentStatus];

		if (isForward) {
			return existingLast == null ? null : currentStatus; 
		} else {
			return currentStatus;

		}
	}

   updateTokenStatus(patient, status) {
    const lastStatusId = this.setLastStatusId(status, patient);
    let updateTokenData = {};
    
    if (status === 'QS-IP' || status === 'QS-CO') {
      const loc = this.selectedLocation.value?.length === 1 && status === 'QS-IP' ? this.selectedLocation?.value[0] : 
      this.selectedLocation.value?.length > 1 && status === 'QS-IP' ? null : patient?.locationId;
      if(loc != null) {
        updateTokenData = {
          locationId: loc,
          queueStatusId: status,
          lastStatusId: lastStatusId
        };
        this.updateToken(patient.id, updateTokenData);
      } else {
        this.commonService.getHealthTestAvailableLocation('health_test', null, 'TC-BILL').subscribe(res => {
        this.testAvailableLocation = res.results;
        console.log(this.testAvailableLocation)
        patient['queueStatusId'] = status;
          if (this.testAvailableLocation?.length > 1) {
            let msg = '\nSelect the location to change the status for token' + ' ' + patient?.tokenNo;
            this.updateStatusWithLocation(msg, this.testAvailableLocation, 'token', patient, lastStatusId);
          } else if (this.testAvailableLocation?.length === 1) {
            updateTokenData = {
              locationId: this.testAvailableLocation[0].id,
              queueStatusId: status,
              lastStatusId: lastStatusId
            };
            this.updateToken(patient.id, updateTokenData);
          }
        });
      }
    } else {
      updateTokenData = {
        locationId: null,
        queueStatusId: 'QS-PE',
        lastStatusId: lastStatusId
      };
      this.updateToken(patient.id, updateTokenData);
    }
  }
  
  updateToken(patientId, updateTokenData) {
    this.workflowService.updateToken(patientId, updateTokenData).subscribe(
      res => {
        this.toastr.success('Success', `${res.message}`);
        this.getLocationDetail(true);
        this.getParallel(true);
      },
      error => {
        this.toastr.error('<i>Error</i>', `${error.error.message}`);
      },
    );
  }

  getParallel(event){
    if(event === true){
      this.selectedQueue = [];
      this.isParalelTest = false;
    }
  }

  updateStatusWithLocation(msg, testAvailableLocation, updatePatientDetails, filterLocationDetails, lastStatusId) {
      let title = updatePatientDetails === 'token' ? 'Confirmation' : 'Check-in';
      let btn = updatePatientDetails === 'token' ? 'Confirm' : 'Continue';
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: title, message: msg, customMsg: true,
          buttonText: { ok: btn, cancel: 'Cancel' },
          'updatePatientDetails': updatePatientDetails, 'isRemark': 1, 'patientPendingLocation': true, 'testAvailableLocation': testAvailableLocation,
          statusToken: true
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result !== null && result !== 'No' && result !== '' && updatePatientDetails === 'token') {
          const updateTokenData = {
            locationId: result,
            queueStatusId: filterLocationDetails.queueStatusId,
            lastStatusId: lastStatusId
          };
          this.updateToken(filterLocationDetails.id, updateTokenData);
        }
      });
    }
}
