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
import { HospitalService, CommonService } from '../../../shared';
import { locale_Json_Details } from '../../../../localeJson/localeJson';
import { ActivatedRoute, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { CreateSupportTicketComponent } from './create-support-ticket/create-support-ticket.component';

@Injectable()
export class SupportResolver implements Resolve<Observable<any>> {
  constructor(private readonly hospitalService: HospitalService,) {}

  resolve(): Observable<any> {
    return   this.hospitalService.getAllTickets();
  }
}


@Component({
  selector: 'app-support-ticket',
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.scss'],
  animations: [routerTransition()]
})
export class SupportTicketComponent implements OnInit {
  displayedColumns: string[] = ['customerId', 'customerName', 'locationName', 'description', 'ticketPriorityName', 'phone', 'email'];
  dataSource: MatTableDataSource<any>;

  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  height: number;
  tableheight : number;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  tooltipOver: string;

  constructor(
    private readonly hospitalService: HospitalService,
    public dialog: MatDialog, public commonService: CommonService,private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
    if(this.activate_btn && (this.activate_btn.indexOf('BT_ALLE') > -1 || this.activate_btn.indexOf('BT_HPSE') > -1)){
      const locale = localStorage.getItem(btoa('lang'))
      if(locale === 'en-US' || locale === 'en'){
        this.tooltipOver = locale_Json_Details.en.clickTooltip;
      } else if(locale === 'ar'){
        this.tooltipOver = locale_Json_Details.ar.clickTooltip;
      }
    }
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<any>(this.route.snapshot.data.supports.results);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.dataSource.filter = filterValue;
  }
  
  createTicket(rowData: any) {
    this.rowData = rowData;
    this.selectedName = rowData.userName;
    if (rowData.birthdate) {
      this.rowData.birthdate = new Date(this.rowData.birthdate);
    }
    const dialogRef = this.dialog.open(CreateSupportTicketComponent,
      {data: rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { 
        this.getAllTickets();
      }
    });
  }

  rowClick(data) {
    this.selectedName = data.userName;
  }

  getAllTickets(): void{
     this.hospitalService.getAllTickets().subscribe(res => { 
      this.dataSource = new MatTableDataSource<any>(res.results);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  fixClick() {
    console.log('')
  }
}


