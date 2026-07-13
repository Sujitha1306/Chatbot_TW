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
import { Component, OnInit, ViewChild,  Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { routerTransition } from '../../../router.animations';
import {HospitalService, CommonService} from '../../../shared';
import * as moment_ from 'moment';

const moment = moment_;

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
import { CreateUserComponent } from '../../../shared/modules/entry-component/create-user/create-user.component';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';

import { ActivatedRoute, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { ResourceMapComponent } from '../../../shared/modules/entry-component/resource-map/resource-map.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { ChatBotComponent } from '../../../shared/modules/entry-component/chat-bot/chat-bot.component';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Injectable()
export class UserManagementResolver implements Resolve<Observable<any>> {
  constructor(private readonly hospitalService: HospitalService,) {}

  resolve(): Observable<any> {
    return this.hospitalService.getAllUsers(null, null, null, 0, 50);
  }
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  animations: [routerTransition()],
})
export class UserManagementComponent implements OnInit {

  displayedColumns: string[] = ['ID', 'User Name', 'Role', 'Email', 'Phone Number', 'User Id', 'Employee ID', 'Status', "Unlock"];
  iconHeader = ['ID', "Unlock"];
  iconColumn = ['ID', "Unlock"];
  sortColumn = ['ID'];
  eventColumn = ['User Name'];
  public permissionControl = ['BT_ALLE'];
  dataSource: MatTableDataSource<any>;
  public matcher = new ErrorStateMatcherService();
  selectedName: any = null;
  public rowData: any = [];
  public activate_btn: any = [];
  public maxHeight: any;
  public applyFilterValue: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  public loading=false;
  showAction1: any = [{ id: 'create', value: 'Create' }];
  showAction2: any = [{ id: 'modify', value: 'Modify' }];
  public showActions = this.showAction1
  selectDropdown: any;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public height: number;
  width: number;
  customerName: string;
  filterValue: null;
  pageSize:number = 50;
  pageStart:number=0; 
  length: any = 0;
  pageHit = false;
  tableData: any;
  public selectedView = 'table';
  public tableVersion: any = null;

  constructor(
    private readonly hospitalService: HospitalService,
    public dialog: MatDialog, public commonService: CommonService,private readonly route: ActivatedRoute,
    public toastr: AppToastService,
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');    
  }

  ngOnInit() {
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn";
    }
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion ===  2) {
         this.displayedColumns = ['User Name', 'Role', 'Email', 'Phone Number', 'User Id', 'Employee ID', 'Status', "Unlock"];
      }
      this.getAllUsers(true,null,this.pageStart,this.pageSize);
    },300);
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2){
      this.getAllUsers(false,this.applyFilterValue,this.pageStart,this.pageSize);
    } else if(this.applyFilterValue.length == 0) {
      this.getAllUsers(false,null,this.pageStart,this.pageSize);
    }
  }

  refreshPage(isAutoRefresh?: boolean){
    this.showActions = this.showAction1;
    this.selectedName = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllUsers(false, this.applyFilterValue, this.pageStart,this.pageSize);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    }
    else if (event.data == 'create') {
      this.createUser('')
    } else if (event.data == 'modify') {
      this.createUser(event.keyVal);
    } else {
      this.showActions = null;
      this.refreshPage(true)
    }
  }

  groupMapping(data) {
    this.showActions = null;
    let groupdata = {type: 'user', data: data}
    const dialogRef = this.dialog.open(ResourceMapComponent, {
      data: groupdata, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
      this.refreshPage();
    });
  }

  createUser(rowData: any) {
    this.showActions = null;
    this.rowData = rowData;
    if (this.rowData.id) {
      this.rowData['type'] = 'user';
    }
    this.selectedName = rowData.userName;
    if (rowData.birthdate) {
      this.rowData.birthdate = new Date(this.rowData.birthdate);
    }
    const dialogRef = this.dialog.open(CreateUserComponent,
    {data : rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedName = null;
      this.refreshPage()
    });
  }
  
  eventAction(event){
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllUsers(false,this.applyFilterValue,this.pageStart,this.pageSize);
    } else if(event.key == 'Unlock') {
      this.unlockUser(event.data.id)
    } else if (event.key === 'User Name') {
      this.createUser(event?.data)
    } else if (event.key === 'Message') {
      this.getUserData(event.data);
    }
  }

  getUserData(event) {
    if (event) {
      this.commonService.getUserLocationById(event?.id).subscribe(res => {
        if (res.statusCode === 1) {
          const selectedUserInfo = res?.results;
          this.createMessage(selectedUserInfo);
        }
      });
    }
  }

  createMessage(data) {
    data['userName'] = data?.firstName + data?.lastName;
    data['roleName'] = data?.roles[0].name;
    data['userId'] = data?.id;
    data['chatType'] = 'dm';

    if (data?.unreadCount > 0 && data?.conversationId) {
      this.commonService.markChatAsRead(data?.conversationId, data?.id).subscribe((res) => {
        if (res.statusCode == 1) {
          data['unreadCount'] = 0;
        }
      });
    }

    const dialogRef = this.dialog.open(ChatBotComponent, {
      data: data,
      panelClass: 'chat-dialog',
      disableClose: true,
      position: { right: '0' },
      height: '100vh',
      width: '380px',
    });

  }

  unlockUser(userId) {
    let payload = {
      userId : userId,
      isRelease : true
    }
    this.commonService.resetPassword(payload).subscribe(res => {
      if(res.statusCode == 1) {
        this.toastr.success('Success', `${res.message}`);
        this.refreshPage();

      }
    })

  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedName = data;
    }
  }

  getAllUsers(routerEvent?: boolean, name?: string, pageStart?:number, pageSize?:number ): void {
    let Columns = []
    if (this.tableVersion === 1) {
      Columns = ['ID', 'fullName', 'roleName', 'email', 'phoneNumber', 'id', 'employeeId', 'status'];
    } else {
      Columns = ['fullName', 'roleName', 'email', 'phoneNumber', 'id', 'employeeId', 'status'];
    }
    if (routerEvent) {
      this.tableData =  this.route.snapshot.data.userManagements.results;
      this.length = this.route.snapshot.data.userManagements.totalRecords;
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.dataSource = new MatTableDataSource(this.tableData);
      if(this.applyFilterValue != null){
        this.dataSource.filter = this.applyFilterValue;
      }
    } else {
    this.hospitalService.getAllUsers(null,null, name, this.pageStart, this.pageSize).subscribe(res => {
      this.tableData =  res.results;
      this.length = res.totalRecords;
      this.dataSource = new MatTableDataSource(this.tableData);
      if(this.applyFilterValue != null){
        this.dataSource.filter = this.applyFilterValue;
      }
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
   }
}

  get userTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn,this.iconColumn,this.iconHeader,
      this.eventColumn
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
    ): TwColumnDef[] {
      return (displayedCols ?? []).map(key => {
        const def: TwColumnDef = { key };
        if (sortCols.includes(key)) def.sortable = true;
        if (eventCols.includes(key)) def.clickable = true;
        if (iconCols.includes(key)) def.icon = { matIcon: '' };
        if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
        if (timeCols.includes(key)) def.type = 'time';
        return def;
      });
    }
  
    get userPaginationConfig(): TwPaginationConfig {
      return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
    }
  
    onCellAction(event: { column: string; row: any }) {
      this.eventAction({ key: event.column, data: event.row });
    }
  
    onPageChange(event: { pageIndex: number; pageSize: number }) {
      this.eventAction({ key: 'pagination', data: event });
    }
}
