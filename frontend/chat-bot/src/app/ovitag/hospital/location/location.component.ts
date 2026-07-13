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
import { Component, OnInit, Input, Injectable } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { CommonService } from '../../../shared';
import { CdkDetailRowDirective } from './../manage-facility/cdk-detail-row.directive';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { routerTransition } from '../../../router.animations';
import { NodePointsGenerator } from '../location/nodepoint-generator/nodepoint-generator.component';
import { ManageLocationComponent } from './manage-location/manage-location.component';
import { ActivatedRoute, Resolve, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class LocationsResolver implements Resolve<Observable<any>> {
  constructor(private readonly commonService : CommonService) {}

  resolve(): Observable<any> {
    return this.commonService.getLogicalLoction();
  }
}

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    routerTransition()
  ]

})
export class LocationComponent implements OnInit {
  
  private openedRow: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;
  public selectedRow: any = null;
  public activenode = false;
  public blockId = null;
  public currentUrl = 'ovitag/configuration/bar-code';

  dataSource: MatTableDataSource<any>;
  displayedData = [
  { 'colName': 'locName', 'title': 'Name', 'dataName': 'name' }, 
  { 'colName': 'type', 'title': 'Type', 'dataName': 'locationTypeName' },
  { 'colName': 'category', 'title': 'Category', 'dataName': 'locationCategoryName' }, 
  { 'colName': 'careSetting', 'title': 'Care Setting', 'dataName': 'careSettingName' },
];

  displayedColumns = this.displayedData.map(res => res.colName);

  constructor(public commonService: CommonService, public dialog: MatDialog,private readonly route: ActivatedRoute, public router: Router ) {

  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<any>(this.route.snapshot.data.locations.results);
  }

  getAllLocation(){
    this.commonService.getLogicalLoction().subscribe(res => {
      this.dataSource = new MatTableDataSource<any>(res.results);
    })
    this.selectedRow = null;
  }

  onToggleChange(cdkDetailRow: CdkDetailRowDirective, row) {
    this.selectedRow = null;
    this.activenode = false;
    if(row.locationTypeLevel == 2){
      this.blockId = row.parentId;
    }
    if (this.singleChildRowDetail && this.openedRow?.expended) {
      this.openedRow.toggle();
    }
    if (!row.close) {
      row.close = true;
      this.selectedRow = row;
      if (this.selectedRow.locationTypeId == 2 || this.selectedRow.locationTypeId == 27) {
        this.activenode = true;
      } else {
        this.activenode = false;
      }
    } else {
      row.close = false;      
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }
  nodePointsGenerator(res){
    let rowData = {'blockId': this.blockId, 'floorId': res.id}
    this.dialog.open(NodePointsGenerator,
      { data: rowData, panelClass: ['medium-popup'], disableClose: true });
  }
  manageLocation(data = null) {
    const dialogRef = this.dialog.open(
        ManageLocationComponent,
        { data: this.selectedRow, panelClass: ['medium-popup'], disableClose: true }
    )
    dialogRef.afterClosed().subscribe(result => {
      this.getAllLocation();
    });
  }
  barCodeComponent() {
    let locType = this.selectedRow.locationTypeId == 1 || this.selectedRow.locationTypeId == 26 ? 'Block' : 'Floor';    
    this.router.navigate([this.currentUrl],{ queryParams: { type : 'location', id : this.selectedRow.id, 'locType' : locType}});
  }
  fixClick() {
    console.log('')
  }
}



