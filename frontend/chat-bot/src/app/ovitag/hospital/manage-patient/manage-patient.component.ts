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

import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, TextToSpeechService } from '../../../shared';
import { PatientAdmitComponent } from '../../../shared/modules/entry-component/patient-admit/patient-admit.component';


@Component({
  selector: 'app-manage-patient',
  templateUrl: './manage-patient.component.html',
  styleUrls: ['./manage-patient.component.scss']
})
export class ManagePatientComponent  implements OnInit{

  displayedColumns: string[] = ['ID', 'Code', 'Name','Facility Name','Status'];
  eventColumn = ['Name'];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  permissionControl = ['BT_ALLE'];
  responseColumns = ['ID', 'code','name','facilityName','status'];
  isLoading: boolean = false;
  public applyFilterValue: any;
  showAction1: any = [{ id: 'create', value: 'Create' }];
  showAction2: any = [{ id: 'modify', value: 'Modify'}];
  selectedName = null;
  selectDropdown: any;
  public tableData: any = [];
  public selectedRow: any = null;
  public showActions = this.showAction1;
  public pageSize = 50;
  public pageStart = 0;
  public length = 0;

  constructor(public fb: FormBuilder,public dialog: MatDialog,public commonService: CommonService,public textToSpeech : TextToSpeechService) { }

  ngOnInit(): void {
    this.getAllRole();
  }

  refreshPage(){
    this.selectedName = null;
    this.getAllRole();
    this.applyFilterValue = null;
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

  headerEventAction(event) {
    if (event.data == 'create') {
      this.createRoleManagement(null);
    } else if (event.data === 'modify') {
      this.createRoleManagement(event.keyVal);
    } else if (event.key === 'applyFilter'){
      this.applyFilter(event.data);
    } else {
      this.refreshPage()
    }
  }
 
    eventAction(event) {
    if (event.key === 'Name') {
      this.createRoleManagement(event.data);     
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllRole();
    }
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAllRole();
    } else if (this.applyFilterValue.length == 0) {
      this.applyFilterValue = null;
      this.getAllRole();
    }
  }

  getAllRole(){
    this.isLoading = true;
    this.commonService.getRollConfigList(this.applyFilterValue, this.pageStart, this.pageSize).subscribe((res) =>{
      this.isLoading = false;
      if(res.statusCode == 1){
        this.tableData = res.results;
        this.length = res.totalRecords;
        for (let i = 0; i <= this.responseColumns.length; i++) {
          this.tableData.map((data) => {
            data[this.displayedColumns[i]] = data[this.responseColumns[i]];
          });
        }
      }
    });
  }

  
  createRoleManagement(data) {
      const dialogRef = this.dialog.open(PatientAdmitComponent,
      { data: data, panelClass: ['small-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        this.selectDropdown = [];
        this.showActions = this.showAction1;
        this.refreshPage();
      });
    }
}
