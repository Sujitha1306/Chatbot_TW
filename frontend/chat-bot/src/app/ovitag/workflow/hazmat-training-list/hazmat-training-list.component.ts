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
import { Component, OnInit,  Input, ViewChild } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog,  } from "@angular/material/dialog";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { FormBuilder } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../../../app.module";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { HazmatPdfService } from "../../../shared/services/hazmat-pdf.service";
import { CreateUserComponent } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { PorterRequestHistoryComponent, PorterRequestNewComponent } from "../../../shared/modules/entry-component/porter-request/porter-request.component";
import { CommonDialogComponent } from "../../../shared/modules/entry-component/common-dialog-component/common-dialog.component";
import { HazmatLocationComponent } from "../../../shared/modules/entry-component/hazmat-location/hazmat-location.component";
// import { EntityTicketComponent } from "../../../shared/modules/entry-component/entity-ticket/entity-ticket.component";
import { EditTaskComponent } from "../../../shared/modules/entry-component/edit-task/edit-task.component";
import { HazardTrackComponent } from "../../../shared/modules/entry-component/hazard-track/hazard-track.component";
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from "../../../shared";
import { ActivatedRoute } from "@angular/router";
import { AssignTaskComponent } from "../task/task.component";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { CdkDetailRowDirective } from "./cdk-detail-row.directive";
import { SelectionModel } from "@angular/cdk/collections";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { TrainingSchedulerComponent } from "../../../shared/modules/entry-component/training-scheduler/training-scheduler.component";

 @Component({
   selector: "app-hazmat-training-list",
   templateUrl: "./hazmat-training-list.component.html",
   styleUrls: ["./hazmat-training-list.component.scss"],
   providers: [
     { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
     { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
   ],
   animations: [
    trigger('detailExpand', [
      state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('*', style({ height: '*', visibility: 'visible' })),
      transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
 })
 export class HazmatTrainingListComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
   displayedColumns: string[] = [
     'ID',
     'Expand',
     'Activity Name',
     'Assigned To',
     'Location',
     'Event Time',
     'Status',
     'Navigation',
     'Action',
     'Checklist'
   ];
   iconHeader = ['ID', 'Expand', 'select', 'Action'];
   iconColumn = ['ID', 'Expand', 'select', 'Event Time', 'Action'];
   sortColumn = ['ID', 'Expand', 'select', 'Action'];
   permissionControl = ['BT_ALLE'];
   eventColumn = ['Activity Name'];
   URdisplayedColumns: string[] = ['Event Time', 'Hazard Near', 'Hazard Value', 'Units', 'Raye'];
   public selectFilter = [{ id: 'filter', value: 'FILTER' }];
   public rowFilter = [];
   public selectedName: any;
   public rowData: any = [];
   public activate_btn: any = [];
   public cols: any;
   public selectedView = 'table';
   public applyFilterValue: any;
   public isAutoRefresh = false;
   today = new Date();
   public currentDate = new Date();
   public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
   tableData: any;
   height: number;
   public showActions1 = [{ id: 'create', value: 'Create' }, { id: 'training-scheduler', value: 'Training Scheduler' }, { id: 'track', value: 'Live Stream' }];
   public showActions2 = [{ id: 'track', value: 'Live Stream' }];
   public showActions = this.showActions1;
   public selectedTabIndex = 0;
   public isCurrentUser = false;
   public isRole = false;
   public isCurrentTeam = false;
   public isManageTeam = false;
   public taskFilterType = 'TFT-BO';
   public selectDropdown = null;
   public pageStart : number = 0;
   public pageSize: number = 50;
   public name: null;
   public length = 0;
   routineId = null;
   loading = false;
   taskData: any;
   public current_Location = false;
   porterDetails: any;
   selectedRow: any = [];
   dataColumns: any = [];
   formTemplate: any=[];
   formData: any;
   cdkData = null;
   dataSource = new MatTableDataSource<any>();
   URdataSource = new MatTableDataSource<any>();
   private readonly openedRow: CdkDetailRowDirective;
   @Input() singleChildRowDetail: boolean;
   @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
   @ViewChild(MatSort) sort: MatSort;
   isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow'); 
   selection = new SelectionModel<any>(true, []);
   rowId = null;
   tableBannerList: any[];
   startTime = null;
   endTime = null;
   totalDuration = null;
   locationType = null;
 
   constructor(
     private readonly workflowService: WorkflowService,
     public hospitalService: HospitalService,
     public configurationService: ConfigurationService,
     public dialog: MatDialog,
     public fb: FormBuilder,
     public datepipe: DatePipe,
     public commonService: CommonService,
     private readonly route: ActivatedRoute,
     private readonly dateFormat: DatePipe,
     public hazmatPdfService: HazmatPdfService
   ) {
      this.activate_btn = this.commonService.getActivePermission('button');
   }
 
   ngOnInit() {
     this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam, true);
     if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
       this.cols = 4;
     } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
       this.cols = 4;
     } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
       this.cols = 3;
     } else if (window.innerWidth <= 768 && window.innerWidth >= 600) {
       this.cols = 2;
     } else if (window.innerWidth <= 599) {
       this.cols = 1;
     } else {
       this.cols = 4;
     }
     this.commonService.getAppTerms('TaskFilterType').subscribe(res => {
      let filterData = res.results
      this.rowFilter = filterData;
     })
     this.getFormTemplate();
   }
 
   onResize(event) {
     if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
       this.cols = 4;
     } else if (
       event.target.innerWidth <= 1400 &&
       event.target.innerWidth >= 1280
     ) {
       this.cols = 4;
     } else if (
       event.target.innerWidth <= 1279 &&
       event.target.innerWidth >= 767
     ) {
       this.cols = 3;
     } else if (
       event.target.innerWidth <= 768 &&
       event.target.innerWidth >= 600
     ) {
       this.cols = 2;
     } else if (event.target.innerWidth <= 599) {
       this.cols = 1;
     } else {
       this.cols = 4;
     }
   }
 
 
 
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim(); 
     filterValue = filterValue.toLowerCase(); 
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
     if (this.applyFilterValue.length > 2){
      this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam, false,  this.applyFilterValue,this.pageStart, this.pageSize);
      }else if (this.applyFilterValue.length == 0){
        this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam, false, this.name,this.pageStart, this.pageSize);
      }
   }
 
   refreshPage() {
    this.showActions = this.showActions1;
    this.isRole = false;
    this.isCurrentUser = false;
    this.isCurrentTeam = false;
    this.isManageTeam = false;
    this.selectedName = null;
    this.applyFilterValue = null;
    this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam, false);
   }
 
   rowClick(data) {
     if (data === null || (this.selectedName && data.entityBookingId === this.selectedName.entityBookingId)) {
       this.selectedName = null;
       this.showActions = this.showActions1;
       this.rowId = null;
     } else {
       this.selectedName = data;
       this.showActions = this.showActions2;
       this.rowId = data.identifyingId;
     }
   }
 
   headerEventAction(event) {
     if (event.key === 'applyFilter') {
       this.applyFilter(event.data);
     } else if (event.data === 'create') {
       this. createTask('');
     } else if (event.data === 'training-scheduler') {
       this.userScheduler('');
     } else if (event.data === 'track') {
       this.manageHazardTracking(event.data,event.keyVal);
     } else if (event.key === 'manageAction') {
       this.manageAction(event.data, event.keyVal);
     } else if (event.key === 'dateFilter') {
       this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
       this.refreshPage()
     } else if (event.key === 'manageWorklist'){
       this.taskFilterType = event.data;
       this.refreshPage();
     } else {
       this.selectedName = null;
       this.refreshPage();
     }
   }
    cdkRowData(event: MouseEvent, data, column){
      if (!data.close && column === 'Expand') {
        data.close = true;
        let  hazmatData = this.tableData.filter(x => x.identifyingId === data.identifyingId);
        const Columns = ['eventTime', 'hazardNear', 'hazardValue', 'units', 'raye'];
        hazmatData[0].hazards = hazmatData[0].hazards.filter(val => val.reader != "[]")
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.hazards = hazmatData[0].hazards.map(data => {
            data[this.URdisplayedColumns[i]] = data[Columns[i]];
          });
          this.dataSource = new MatTableDataSource(this.tableData);
        }
      } else if (data.close && column === 'Expand'){
        data.close = false;
      }
      if(column == 'Expand' && data.close === true){
        this.cdkData = data;
      } else if (column !== 'Expand') {
        this.cdkData = null;
        event.stopPropagation();
      }
    }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    this.checkBoxAction(this.selection.selected);
    if (this.dataSource?.data?.length) {
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }
  }
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
   eventAction(event) {
     if (event.key === 'Assigned To' && event.data.statusCode === 'BK-BKD' && event.data.srcIdentifyingTypeCode !== 'RQT-PO') {
       const data = event.data;
       data['selectedTabIndex'] = this.selectedTabIndex;
       const dialogRef = this.dialog.open(AssignTaskComponent, {
         data: data,panelClass:['mdm-Confirmation-popup'],
         disableClose: true,
       });
       dialogRef.afterClosed().subscribe((result) => {
         this.refreshPage();
       });
     } else if (event.key === 'Schedule') {
       const data = event.data;
       data['type'] = 'task';
       data['sizeType'] = 'medium';
       const dialogRef = this.dialog.open(CreateUserComponent,
       {data : data, panelClass: 'medium-popup', disableClose: true });
       dialogRef.afterClosed().subscribe(result => {
         this.selectDropdown = null;
         this.refreshPage();
       });
     } else if(event.key == 'Location') {
      this.currentLocation(event.data);
      this.getPorterFloorPlan(event.data);
     } else if(event.key == 'Status') {
      this.getPorterHistory(event.data);
     } else if(event.key == 'Complete') {
      const completeData = {"comments": event.data.description,"type": event.data.srcIdentifyingTypeCode,
      "status": 'RQ-CO',"userType": event.data.assignedToType}
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Complete Task', message: 'Do you want to complete the task ?',
            buttonText: { ok: 'Yes', cancel: 'No' },
            'completeTask': true, 'requestId': event.data.srcIdentifyingId, 'completeData': completeData
          }
        });
      dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
        this.refreshPage();
      });
    } else if(event.key == 'Cancel') {
      console.log(event)
      const deleteData = {"comments": event.data.description,"type": event.data.srcIdentifyingTypeCode,
      "status": 'RQ-CA',"userType": event.data.assignedToType}
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          panelClass:['mdm-Confirmation-popup'], disableClose: true,
          data: {
            title: 'Cancel Task', message: 'Do you want to cancel the task ?',
            buttonText: { ok: 'Yes', cancel: 'No' },
            'deleteTask': true, 'requestId': event.data.srcIdentifyingId, 'deleteData': deleteData
          }
        });
      dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
      this.refreshPage();
      });
    } else if (event.key === 'Requester') {
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: event.data,
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage();
      });
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam,false,this.name, this.pageStart, this.pageSize);
    } else if(event.key == 'viewHistory'){
      this.porterLocationHistory(event.data);
    } 
   }
   porterLocationHistory(data){
    const formData = data;
    data['content'] = 'history'
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    }); dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }
   manageTicket(row) {
    let data = { "id": null, "entityId": null,"requestId": row.srcIdentifyingId, "data": null }
    // const dialogRef = this.dialog.open(EntityTicketComponent, { 
    //   data: data, panelClass: ['small-popup'], disableClose: true });
    // dialogRef.afterClosed().subscribe(result => {
    //   this.applyFilterValue = null;
    //   this.refreshPage();
    // });
   }
   getPorterFloorPlan(data){
    const reqDetail = data;
    const reqType = 'porter';
    const reqId = null;
    let details = {reqDetail: reqDetail, reqType: reqType, reqId: reqId}
    const dialogRef = this.dialog.open(CommonDialogComponent, {
    data: details,
    panelClass: ['medium-popup'],
    disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }

  currentLocation(data) {
    if (data === "close") {
      this.current_Location = false;
    } else {
      this.current_Location = true;
      if (data.hasOwnProperty("performer") && data.performer.length > 0) {
        this.porterDetails = {
          type: "porter",
          floorid: data.performer[0].floorId,
          requestId: data.requestId,
          requestInfo: data,
        };
      }
    }
  }
  manageRoutine(data) {
    if(data.scheduleStart !== null && this.datepipe.transform(new Date(data.scheduleStart), 'yyyy-MM-dd') === this.selectedDate) {
      data.routineEventStatus = data.routineEventStatusId;
      data.routineStatus = null;
    } else {
      data.routineEventStatus = null;
      data.routineStatus =  data.routineStatusId;
    }
    data.entityRoutineEventId = data.entityRoutineEventId;
    data.entityRoutineId = this.routineId;
    if(data.routineTypeId === "ROU-IP") {
      data['RType'] = 'inpatient';
    } else {
      data['RType'] = 'resident';
    }
    data['permissionTab'] = ['Manage Routine'];
    this.selectDropdown = 'routine';
  }

  managePorter(data) {
    this.selectDropdown = 'porter';
      if (data.srcIdentifyingId && data.srcIdentifyingId !== null) {
        this.workflowService.getPorterRequest(data.srcIdentifyingId).subscribe((res) => {
          const porterData = res.results[0];
          const dialogRef = this.dialog.open(PorterRequestNewComponent, {
          data: porterData,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.selectDropdown = null;
          this.refreshPage();
        });
      });
    }
  }

   manageAction(value, data) {
     if (value === 'routine') {
       this.manageRoutine(data);
     } else if (value === 'porter' && data !== true) {
       this.managePorter(data);
     } else if (value === 'porter' && data === true) {
      this.showActions = null;
      const dialogRef = this.dialog.open(PorterRequestNewComponent, {
        data: {type: 'PR-OT', id: '0', name: 'others'},
        panelClass: ['medium-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    } else if (value === 'nurse') {
       const dialogRef = this.dialog.open(EditTaskComponent, {
         data: data,
         panelClass: ['small-popup'],
         disableClose: true,
       });
       dialogRef.afterClosed().subscribe((result) => {
         this.selectDropdown = null;
         this.refreshPage();
       });
 
     } else if (value === 'ticket') {
      this.manageTicket(data);
     }
   }
 
   createTask(data?: any) {
     this.showActions = null;
     const dialogRef = this.dialog.open(HazmatLocationComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
   }

   userScheduler(data?: any) {
    this.showActions = null;
    const dialogRef = this.dialog.open(TrainingSchedulerComponent,
     { data: data, panelClass: ['medium-popup'], disableClose: true });
   dialogRef.afterClosed().subscribe(result => {
     this.refreshPage();
     this.selectDropdown = null;
   });
  }

   checkBoxAction(event){   
    if(event){
      if(JSON.stringify(this.selectedRow) != JSON.stringify(event)) {
        this.selectedRow = event;
      }   
    }
   }
   manageHazardTracking(key, data?: any) {
    this.showActions = null;
    if(this.selectedRow.length) {
      data = this.selectedRow;
      data = this.selection.selected;
    } else if(typeof(data) != 'boolean') {
      data = [data]
    }
    if(data.length) {
      const dialogRef = this.dialog.open(HazardTrackComponent,
        {data: data, width : '100%', height : '100%', panelClass: ['large-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.selectedRow = [];
        this.selection.clear();
        this.refreshPage();
        this.selectDropdown = null;
      });
    } else {
      this.showActions = this.showActions1;
    }
  }
 
   getPorterHistory(data) {
    if (this.selectedTabIndex !== 4) {
      data['requestId'] = data['identifyingId'];
      data['historyType'] = 'Task';
    }
    this.dialog.open(PorterRequestHistoryComponent, {
       data: data,
       panelClass: ['small-popup'],
       disableClose: true,
     });
   }
 
   tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
     this.selectedTabIndex = tabChangeEvent.index;
     this.tableData = [];
     this.loading = true;
      this.isRole = false;
      this.isCurrentUser = false;
      this.isCurrentTeam = false;
      this.isManageTeam = false;
     this.getTaskDetails(this.selectedDate, this.isCurrentUser, this.isRole, this.isCurrentTeam, this.isManageTeam, false, this.name, this.pageStart, this.pageSize);
   }
 
   getTaskDetails(dateValue?: string, isCurrentUser?: boolean, isRole?: boolean, isCurrentTeam?:boolean, isManageTeam?:boolean,routerEvent?: boolean,name?:string,pageStart?: number,
    pageSize?: number): void {
     this.selectedName = null;
     this.loading=true;
     if (dateValue != null) {
       this.selectedDate = this.datepipe.transform(new Date(dateValue), 'yyyy-MM-dd');
     }
     if (routerEvent) {
      this.route.snapshot.data.hazmat.results?.forEach(x => {
        delete x['children'];
      })
       this.tableData = this.route.snapshot.data.hazmat.results;
       this.length = this.route.snapshot.data.hazmat.totalRecords;
       this.dataColumns = [
         'ID',
         'Expand',
         'taskDetail',
         'assignedTo',
         'destLocationName',
         'eventDate',
         'requestStatus',
         'Navigation',
         'Action',
         'Checklist',
         'pdf'
       ];
       this.loading = false;
       this.dataSource = new MatTableDataSource(this.tableData)
        if (this.applyFilterValue != null) {
          this.dataSource.filter = this.applyFilterValue;
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
     } else {
        let entityType = 'All';
        let myTaskfilterType = null; 
        this.workflowService.getTaskDetails(dateValue, isCurrentUser, isRole, isCurrentTeam, isManageTeam,pageStart, pageSize, entityType, myTaskfilterType, null, null, true)
         .subscribe((res) => {
          res.results?.forEach(x => {
            delete x['children'];
          })
           this.tableData = res.results;
           this.length = res.totalRecords;
           this.loading = false;
           this.dataColumns = [
             'ID',
             'Expand',
             'taskDetail',
             'assignedTo',
             'destLocationName',
             'eventDate',
             'requestStatus',
             'Navigation',
             'Action',
             'Checklist',
             'pdf'
           ];
           this.dataSource = new MatTableDataSource(this.tableData)
            if (this.applyFilterValue != null) {
              this.dataSource.filter = this.applyFilterValue;
            }
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
         });
      }
    }
    public eventTrigger(element){
      if(!element?.children) {
        if(element?.hazards?.length !== 0) {
          element?.hazards?.forEach( x => {
            x['Reader coordinates'] = x['Reader_coordinates']
          });
        }
      } else {
        const child = element?.children;
        if(child?.length !== 0) {
          element?.children?.forEach( x => {
            x['Reader coordinates'] = x['Reader_coordinates']
          });
        }
      }
      this.formBuilder(element, 'navigation', (updatedFormData) => {
        if (updatedFormData) {
          element['formData'] = this.formData;
        } 
      });
      if(element) {
        element['Activity'] = element['activityName'];
        element['Performer'] = element['assignedTo'];
        if(element['destLocationName']) {
          const loc = element['destLocationName'].split(',');
          element['Location'] = loc[0];
          element['Floor name'] = loc[1];  
        }
        element['Start time'] = element['scheduleDate'];
        element['End time'] = element['eventDate'];
      }
      
      let data = {
        floorId : element.floorId,
        blockId : null,
        type : "track",
        data : element
      }
      const dialogRef = this.dialog.open(CommonDialogComponent, { data: data,
        panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
      });
     }

     getCondunctTraining(data) {
     this.commonService.getActivityTaskDetails().subscribe((res) => {
        if(res.statusCode !== 0) {
          const data1 = res.results.filter( x => x.id === data.identifyingId);
          if(data1.length !== 0) {
            data1[0]['ActDate'] = this.dateFormat.transform(this.selectedDate, 'yyyy-MM-dd');
            this.createTask(data1[0]);
          }
        }
      });
    }

    getFormTemplate() {
      this.commonService.getFormTemplate('FTT-HZ').subscribe(res => {
        if(res.statusCode == 1) {
          this.formTemplate = res.results;
        }
      });
    }
    formBuilder(data,type, callback): void {
      this.formData = null;
      if(data !== null) {
        this.commonService.getFormDetails(data.identifyingId, 'Hazmat').subscribe(res => {
          if (res.statusCode == 1) {
            let entityFormDetail = res.results.filter(res => res.status);
            this.entityFormBanner(entityFormDetail, data);
          } else {
            this.entityHazardBanner(data);
          }
          if(type === 'pdf'){
            data['formData'] = this.formData;
            this.downloadPdf(data);
          } else if(type === 'form'){
            const dialogRef = this.dialog.open(CommonDialogComponent, { data: this.formData,
              panelClass: ['medium-popup'], disableClose: true
            });
            dialogRef.afterClosed().subscribe(result => {
              this.formData = null
            });
          } else if(type === 'navigation'){
            callback(this.formData);
          }
          
        });
        
      }
    }
    entityFormBanner(entityFormDetail, data) {
      if(entityFormDetail.length){
        this.tableBannerList = [];
        this.startTime = null;
        this.endTime = null;
        this.totalDuration = null;
        this.locationType = null;
        if(data?.hazards?.length !== 0) {
          this.startTime = data?.hazards[0].eventTime;
          this.endTime = data?.hazards[data?.hazards?.length-1].eventTime;
          this.locationType = data?.locationTypeId === 23 ? 'Outdoor' : 'Indoor';
          const diff = new Date(this.startTime).getTime() - new Date(this.endTime).getTime();
          const hrs = (Math.abs(Math.round(diff / 3600000)));
          const mins = (Math.abs(Math.round(diff / 60000)));
          this.totalDuration = (hrs.toString().length === 1 ? '0'+ hrs : hrs) + ':' + (mins.toString().length === 1 ? '0' + mins : mins);  
          data?.hazards.forEach(x => {
            if(x.raye !== null) {
              const startTime = data?.hazards[0].eventTime;
              const endTime = x.eventTime;
              const diff = new Date(startTime).getTime() - new Date(endTime).getTime();
              const hrs = (Math.abs(Math.round(diff / 3600000)));
              const mins = (Math.abs(Math.round(diff / 60000)));
              x['duration'] = (hrs.toString().length === 1 ? '0'+ hrs : hrs) + ':' + (mins.toString().length === 1 ? '0' + mins : mins);      
              this.tableBannerList.push(x);
            }
          });
        }
        this.formData = { "id" : entityFormDetail[0]['id'] , "entityId" : data.identifyingId, "entityType" : "Hazmat" ,"parentId" : null, "parentType" : null,  "pfFormTemplateId" : entityFormDetail[0]['pfFormTemplateId'], "content" : "form","entityData": data, 
          "addBanner": true,"bannerData": [
            {"leftBanner": [
              {label: "Trainee ", value: data?.assignedTo, type: "string"},
              {label: "Activity", value: data?.activityName, type: "string", mainInfo: true},
            ],
            "centerBanner": [],
            "rightBanner": [
              {label: "Training Location", value: data?.destLocationName, type: "string", mainInfo: true},
              {label: "Event Date", value: data?.eventDate, type: "date", mainInfo: true},
            ],
            "outerHeader": [{header: "Trainee Performance"}],
            "outerField": [
              {label: "Start Time", value: this.startTime, type: "time"},
              {label: "End Time", value: this.endTime, type: "time"},
              {label: "Duration", value: this.totalDuration, type: "time"},
              {label: "Location", value: this.locationType, type: "string"}
            ],
            "tableBanner": [
              {tableData: this.tableBannerList, displayedColumns: ["Event Time", "RAYE Flare", "Value and Units", "Duration", "Coordinates"],
                displayedData: [
                  {'colName': 'Event Time', 'title': 'Event Time', 'dataName': 'eventTime'},
                  {'colName': 'RAYE Flare', 'title': 'RAYE Flare', 'dataName': 'raye'},
                  {'colName': 'Value and Units', 'title': 'Value and Units', 'dataName': 'hazardValue'},
                  {'colName': 'Duration', 'title': 'Duration', 'dataName': 'duration'},
                  {'colName': 'Coordinates', 'title': 'Coordinates', 'dataName': 'coordinate'},
                ]
              }
            ]
          }]
        }
      }
    }
   entityHazardBanner(data) {
     this.tableBannerList = [];
     this.startTime = null;
     this.endTime = null;
     this.totalDuration = null;
     this.locationType = null;
     if (data?.hazards?.length !== 0) {
       this.startTime = data?.hazards[0].eventTime;
       this.endTime = data?.hazards[data?.hazards?.length - 1].eventTime;
       const diff = new Date(this.startTime).getTime() - new Date(this.endTime).getTime();
       this.locationType = data?.locationTypeId === 23 ? 'Outdoor' : 'Indoor';
       const hrs = (Math.abs(Math.round(diff / 3600000)));
       const mins = (Math.abs(Math.round(diff / 60000)));
       this.totalDuration = (hrs.toString().length === 1 ? '0' + hrs : hrs) + ':' + (mins.toString().length === 1 ? '0' + mins : mins);
       data?.hazards.forEach(x => {
         if (x.raye !== null) {
           const startTime = data?.hazards[0].eventTime;
           const endTime = x.eventTime;
           const diff = new Date(startTime).getTime() - new Date(endTime).getTime();
           const hrs = (Math.abs(Math.round(diff / 3600000)));
           const mins = (Math.abs(Math.round(diff / 60000)));
           x['duration'] = (hrs.toString().length === 1 ? '0' + hrs : hrs) + ':' + (mins.toString().length === 1 ? '0' + mins : mins);
           this.tableBannerList.push(x);
         }
       });
     }
     const pfFormTemplateId = this.formTemplate[0]['id'];
     this.formData = {
       "id": null, "entityId": data.identifyingId, "entityType": "Hazmat", "pfFormTemplateId": pfFormTemplateId, "content": "form", "entityData": data,
       "addBanner": true, "bannerData": [
         {
           "leftBanner": [
             { label: "Trainee ", value: data?.assignedTo, type: "string" },
             { label: "Activity", value: data?.activityName, type: "string", mainInfo: true },
           ],
           "centerBanner": [],
           "rightBanner": [
             { label: "Training Location", value: data?.destLocationName, type: "string", mainInfo: true },
             { label: "Event Date", value: data?.eventDate, type: "date", mainInfo: true },
           ],
           "outerHeader": [{ header: "Trainee Performance" }],
           "outerField": [
             { label: "Start Time", value: this.startTime, type: "time" },
             { label: "End Time", value: this.endTime, type: "time" },
             { label: "Duration", value: this.totalDuration, type: "time" },
             { label: "Location", value: this.locationType, type: "string" }
           ],
           "tableBanner": [
             {
               tableData: this.tableBannerList, displayedColumns: ["Event Time", "RAYE Flare", "Value and Units", "Duration", "Coordinates"],
               displayedData: [
                 { 'colName': 'Event Time', 'title': 'Event Time', 'dataName': 'eventTime' },
                 { 'colName': 'RAYE Flare', 'title': 'RAYE Flare', 'dataName': 'raye' },
                 { 'colName': 'Value and Units', 'title': 'Value and Units', 'dataName': 'hazardValue' },
                 { 'colName': 'Duration', 'title': 'Duration', 'dataName': 'duration' },
                 { 'colName': 'Coordinates', 'title': 'Coordinates', 'dataName': 'coordinate' },
               ]
             }
           ]
         }]
      }
    }
    downloadPdf(element){
      if(!element?.children) {
        this.commonService.getTaskReport(this.selectedDate, element?.identifyingId).subscribe((res) => {
          if(res.results?.data?.length !== 0) {
            this[element.identifyingId + 'Child'] = true;
            element['children'] = res.results?.data;
            this.URdisplayedColumns = [  
              'Event time',
              'Hazard near?',
              'Hazard value',
              'Units',
              'Location name',
              'Reader id',
              'Reader_coordinates',
              'Sequence'
            ];
            if(element?.children?.length !== 0) {
              element?.children?.forEach( x => {
                x['Reader coordinates'] = x['Reader_coordinates']
              });
            }
          }
          this.hazmatPdfService.pdfCreate(element);
        });
      } else{
        this.hazmatPdfService.pdfCreate(element);
      }
    }
  fixClick() {
    console.log('')
  }      
 }
 
