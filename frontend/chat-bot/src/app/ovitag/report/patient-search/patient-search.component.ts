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
import { Component, OnInit, ViewChild, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HospitalService } from '../../../shared';

@Component({
  selector: 'app-patient-search',
  templateUrl: './patient-search.component.html',
  styleUrls: ['./patient-search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientSearchComponent implements OnInit {
  displayedColumns: string[] = ['firstName', 'gender', 'dob', 'mobile', 'email'];
  // displayedData = [
  //   {'colName':'firstName','title':'Name','dataName':'firstName'},
  //   {'colName':'gender','title':'Gender','dataName':'gender'},
  //   {'colName':'dob','title':'Date of Birth','dataName':'birthDate'},
  //   {'colName':'mobile','title':'Mobile','dataName':'mobileNo'},
  //   {'colName':'email','title':'Email','dataName':'email'}
  // ]
  dataSource: MatTableDataSource<any>;
  public picupPatientId: any;
  public selectedName: any;
  public rowData: any = [];
  public activate_btn: any = [];
  public filtervalue: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public selectedRow: any = null;
  public btnenable = false;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;

  constructor(private readonly hospitalService: HospitalService,
    public thisDialogRef: MatDialogRef<PatientSearchComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.filtervalue = data;
    // console.log(this.filtervalue);
  }
  ngOnInit() {
    this.getAllPatients();

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
  getAllPatients(): void {
    this.hospitalService.getAllPatients().subscribe(res => {
      // console.log(res.results);
      this.dataSource = new MatTableDataSource<any>(res.results);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      if (this.filtervalue) {
        this.applyFilter(this.filtervalue);
      }
    });
  }
  rowClick(row) {
    if (this.selectedRow && row.id == this.selectedRow.id) {
      this.selectedRow = null;
    }
    else {
      this.selectedRow = row;
    }
    // console.log(this.selectedRow)
    this.btnenable = true;
    this.picupPatientId = row;
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  picupPatient() {
    this.thisDialogRef.close(this.picupPatientId);

  }
  fixClick() {
    console.log('')
  }
}
