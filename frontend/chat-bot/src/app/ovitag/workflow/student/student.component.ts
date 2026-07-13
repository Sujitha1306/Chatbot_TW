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

import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FormGroup,FormBuilder,FormControl, } from "@angular/forms";
import { ConfirmationDialog } from "../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component";
import { routerTransition } from "../../../router.animations";
import { CommonService, WorkflowService } from "../../../shared";
import { ActivatedRoute } from "@angular/router"
import { CoasterComponent } from "../../../shared/modules/entry-component/enroll-patient/enroll-patient.component";
import { CreateUserComponent } from "../../../shared/modules/entry-component/create-user/create-user.component";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { StatusEventComponent } from "../../../shared/modules/entry-component/status-event/status-event.component";
import { WorkflowManagementComponent } from "../../../shared/modules/entry-component/workflow-management/workflow-management.component";

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss'],
  animations: [routerTransition()],
})
export class StudentComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  displayedColumns: string[] = [
    "ID",
    'Device',
    'Alert',
    "Name",
    "Gender",
    "Tag ID",
    "Department",
    "Last Seen Location",
    "Last Seen Time",
    "Attendance"
  ];
  timeColumns =["Last Seen Time"]
  iconHeader = ["ID", "Gender", 'Device'];
  iconColumn = ["ID", "Gender", 'Routine', 'Current Location', 'Device', 'Alert', 'Last Seen Time'];
  sortColumn = ["ID"];
  permissionControl = ["BT_ALLE"];
  eventColumn = ['Device', 'Status', 'Name'];
  responseColumns = [];
  typeId = 'null'
  public selectFilter: any = [{ id: "section", value: "SECTION" }];
  public selectTypeFilter: any = [{ id: "grade", value: "GRADE" }]
  public rowFilter: any = [];
  public rowTypeFilter: any = [];
  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public review = false;
  public inPatientInfo: any;
  public cols: any;
  public selectedView = "table";
  public applyFilterValue: any;
  public isAutoRefresh = false;
  showAction1 = [
    { id: "create", value: "Enroll"}
  ];
  showAction2 = [
    { id: "modify", value: "Modify" }
  ];
  showActions3 = [
    { id: "routine", value: "Manage Routine" },
    { id: "modify", value: "Modify" }
  ];
  
  public showActions = this.showAction1;
  filterForm = new FormGroup({
    status: new FormControl(),
    fromDate: new FormControl(),
    toDate: new FormControl(),
  });
  today = new Date();
  public selectDropdown = null;
  public specialityLoc: any;
  public name = null;
  public locationId = "null";
  tableData: any;
  height: number;
  public userTypeId = 'UT_STUDENT';
  showTable = false;
  pageSize:number =50;
  pageStart:number=0;
  length:number=0;
  selectedSection = null;
  selectedGrade = null;
  sortDirection = null;
  sortColumnName = null;

  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public commonService: CommonService,
    private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
    this.getDynamicTableColumn();
   }

  ngOnInit() {
    this.height = window.innerHeight - 170;
    this.commonService.getAppTerms('StudentGrade,StudentGroup').subscribe(res => {
      let filterList = res.results
      let gradeList = filterList.filter(fil => fil.groupName === 'StudentGrade');
      let sectionList = filterList.filter(fil => fil.groupName === 'StudentGroup');
      this.studentSection('section', sectionList);
      this.studentGrade('grade', gradeList);
    });
  }
  manageAction(value, data) {
    if(value == 'routine') {
      data["RType"] = "student";
      data["entityType"] = 'User';
      data["entityId"] = data.userId;
      data['permissionTab'] = ['Task List','Task History','Manage Routine'];
      this.selectDropdown = "routine";
      const dialogRef = this.dialog.open(WorkflowManagementComponent, {
        data: data,
        panelClass: ["large-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.selectDropdown = null;
        this.refreshPage();
      });
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getStaffRoutineList(this.applyFilterValue,null)
    }else if (this.applyFilterValue.length == 0){
      this.getStaffRoutineList(null,null)
    }
  }

  studentSection(id, data){
    if(id === 'section'){
      this.rowFilter = data;
    }
  }

  studentGrade(id, data){
    if(id === 'grade'){
      this.rowTypeFilter = data;
    }
  }

  manageWorklist(data){
    if(data === "null"){
      this.selectedSection = null
      this.typeId = null
    } else {
      this.selectedSection = data
    }
    this.getStaffRoutineList();
  }

  manageTypelist(data){
    this.selectedGrade = data
    if(data === "null"){
      this.selectedSection = null;
      this.locationId = null
    } else {
      this.selectedSection = this.selectedSection;
    }
    this.getStaffRoutineList();
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.selectedName = null;
    this.selectDropdown = null;
    this.sortColumnName = null;
    this.sortDirection = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getStaffRoutineList(this.applyFilterValue,null);
  }

  rowClick(data) {
    if (this.selectedName && data.userId == this.selectedName.userId) {
      this.selectedName = null;
      this.showActions = this.showAction1;
      this.selectDropdown = null;
    } else {
      this.selectedName = data;
      this.showActions = this.showAction2;
      if(this.activate_btn.indexOf('BT_STFTSK') > -1){
        this.showActions = this.showActions3;
       }else{
        this.showActions = this.showAction2;
       }
    }
  }

  headerEventAction(event) {
    console.log(event)
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this. createUser(event.data, event.keyVal);
    } else if (event.data === 'modify') {
      this. createUser(event.data, event.keyVal);
    } else if (event.key === 'manageWorklist'){
      this.manageWorklist(event.data);
    } else if (event.key === 'manageTypelist'){
      this.manageTypelist(event.data)
    } else if(event.key === "manageAction") {
      this.manageAction(event.data, event.keyVal);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.sortColumnName = null;
      this.sortDirection = null;
      this.refreshPage(true);
    }
  }

  eventAction(event) {
    if (event.key === 'Device') {
      this.manageCoster(event.data);
    } else if (event.key === 'nurse-call' || event.key === 'fall-risk') {
      this.cancelAlert(event.data, event.key);
    } else if (event.key == "pagination"){
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      if(this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
        this.getStaffRoutineList(this.applyFilterValue,null);
      }else{
        this.getStaffRoutineList(null,null);
      }
    } else if (event.key === 'Status') {
      this.dialog.open(StatusEventComponent, {
        data: event.data,
        panelClass: ['small-popup'],
        disableClose: true,
      });
    } else if (event.key === 'Name') {
      this. createUser(event.key, event.data);
    } else if (event.key === 'sort') {
      const index = this.displayedColumns.indexOf(event.data.active);
      this.sortDirection = event.data.direction.toUpperCase();
      this.sortColumnName = this.responseColumns[index];
      this.getStaffRoutineList(null, null);
    } else if(event.key === "Task") {
      this.manageAction('routine', event.data)
    }
  }

  cancelAlert(data, type) {
    if (type === 'fall-risk' && data.iotAlertId != null) {
      data['alertId'] = data.iotAlertId;
    }

    if (type === 'nurse-call' && data.iotAlertId != null) {
      data['alertId'] = data.iotAlertId;
    }

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Cancel Notification', message: '',
        buttonText: { ok: 'Ok', cancel: 'Cancel' },
        'alertDetails': data, 'cancelAlert': true,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.refreshPage();
    } 
    });
  }

  getStaffRoutineList(filter?: string, routerEvent?: boolean): void {
    this.selectedName = null;
    if (routerEvent) {
      this.inPatientInfo = this.route.snapshot.data.student.results;
      this.tableData = this.route.snapshot.data.student.results;
      this.length = this.route.snapshot.data.student.totalRecords;

      let Columns = [
        "ID",
        "tagId",
        "alerts",
        "userName",
        "gender",
        "tagId",
        "departmentName",
        "lastSeenLocationName",
        "lastSeenTime",
        "attendance"
      ];
      if(this.responseColumns.length){
        Columns = this.responseColumns;
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    } else {
      this.workflowService.getStaffRoutineList(this.userTypeId,filter,this.pageStart,this.pageSize, null, this.selectedGrade, this.selectedSection, this.sortDirection, this.sortColumnName).subscribe((res) => {
        this.tableData = res.results;
        this.length = res.totalRecords;
        let Columns = [
        "ID",
        "tagId",
        "alerts",
        "userName",
        "gender",
        "tagId",
        "departmentName",
        "lastSeenLocationName",
        "lastSeenTime",
        "attendance"
        ];
        if(this.responseColumns.length){
          Columns = this.responseColumns;
        }
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        this.inPatientInfo = res.results;
      });
    }
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('student').subscribe((res) => {
      if(res.statusCode === 1){
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.responseColumns = dynamicColumns.dataColumns;
        this.showTable = true;
        if(dynamicColumns?.timeColumns){this.timeColumns = dynamicColumns.timeColumns}
      }
      this.getStaffRoutineList(null,true);
    });
  }
  manageCoster(data) {
    data['workflowTypeId']    = 'WF-STF';
    data['associationId']     = data.userId;
    data['associationTypeId'] = 'TAT-US';
    data['associatedName']    = 'User';
    data['tag_type_name']     = data.tagAssociationType;
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ['small-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.refreshPage();
      }
    });
  }

  createUser(data, value?: any) {
    this.showActions = null;
    if (data === 'create') {
      value = JSON.parse('{ "type" : "student"}');
    } else {
      value['type'] = 'student';
    }
    value['sizeType'] = 'medium';
    const dialogRef = this.dialog.open(CreateUserComponent,
      { data: value, panelClass: 'medium-popup', disableClose: true});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.refreshPage();
    });
  }

}
