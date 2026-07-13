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
import { Component, ViewChild  } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { routerTransition } from '../../../router.animations';
import { CommonService, HospitalService } from '../../../shared';
import { ErrorStateMatcherService } from '../../../shared/services/error-state-matcher.service';

@Component({
  selector: 'app-patient',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss'],
  animations: [routerTransition()]

})
export class BillComponent {

  displayedColumns: string[] = ['gatewayId', 'gatewayName', 'swVer', 'kernelVer',  'status'];
  dataSource: MatTableDataSource<PatientData>;
  public matcher = new ErrorStateMatcherService();
  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private readonly hospitalService: HospitalService,
    public dialog: MatDialog, public commonService: CommonService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.dataSource.filter = filterValue;
  }

  createGateway(rowData: any, event: any) {
    
    this.rowData = rowData;
    this.selectedName = rowData.id;
    
  }

  rowClick(data) {
    this.selectedName = data.id;
  }

  getBills(): void {
    let result = this.hospitalService.getBills();
    this.dataSource = new MatTableDataSource<PatientData>(result);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}

export interface PatientData {
  id: number;
  billId: string;
  billType: string;
  toPay: string;
  dueDate: string;
  status: string;
}
