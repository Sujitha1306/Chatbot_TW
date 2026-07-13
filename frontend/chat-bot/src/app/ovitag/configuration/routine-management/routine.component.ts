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
import { FormBuilder } from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { CommonService, ConfigurationService } from "../../../shared";
import { ActivatedRoute } from "@angular/router";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { CreateRoutineTemplateComponent } from "../../../shared/modules/entry-component/create-routine-template/create-routine-template.component";

@Component({
  selector: "app-routine",
  templateUrl: "./routine.component.html",
  styleUrls: ["./routine.component.scss"],
  animations: [routerTransition()],
})
export class RoutineComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  displayedColumns: string[] = ['S.No', 'Name', 'Routine Type', 'Schedule Type', 'No.of Activities', 'Description', 'Status'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = ['S.No', 'Status'];
  sortColumn = ['S.No'];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLEN'];
  public activate_btn: any = [];
  public applyFilterValue: any;
  today = new Date();
  floorList: any;
  tableData: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showActions = this.showAction1;
  filterValue: null;

  constructor(
    private readonly configurationService: ConfigurationService, public dialog: MatDialog,
    public fb: FormBuilder, public commonService: CommonService, private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.routines.results;
    const Columns = ['S.No', 'name', 'routineTypeName', 'scheduleTypeName', 'noOfActivity', 'description', 'isActive'];
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
    this.getFloorList();
  }

  getFloorList() {
    this.commonService.getFloorList().subscribe(res => {
      this.floorList = res.results;
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }
  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllRoutine();
  }
  getAllRoutine() {
    this.configurationService.getAllRoutine().subscribe(res => {
      this.tableData = res.results;
      if(this.applyFilterValue !== null){
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['S.No', 'name', 'routineTypeName', 'scheduleTypeName', 'noOfActivity', 'description', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createRoutine([]);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if(event.key === 'Name') {
      this.createRoutine(event.data);
    }
  }
  createRoutine(data) {
    this.showActions = null;
    data['RType'] = 'template';
    data['permissionTab'] = ['Manage Routine'];
    const dialogRef = this.dialog.open(CreateRoutineTemplateComponent,
      {data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
}
