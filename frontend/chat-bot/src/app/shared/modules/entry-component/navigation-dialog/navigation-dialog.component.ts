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

import { Component, OnInit, Inject,} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from "@angular/forms";
import { HospitalService } from '../../../services/hospital.service';
import {CommonService} from '../../../services/common.service';

@Component({
    selector: 'app-navigation-dialog',
    templateUrl: './navigation-dialog.component.html',
    styleUrls: ['./navigation-dialog.component.scss'],
    
  })

  
export class NavigationDialogComponent implements OnInit {
  public tagList =[12,22,33,44,55,66,77,88,99];
  public blockList : any = [];
  public floorList : any = [];
  public searchLoclist: any = [];
  blockId = new FormControl();
  floorId = new FormControl();
  locationId = new FormControl();

  constructor(private readonly hospitalService: HospitalService, private readonly commonService: CommonService, public dialog: MatDialog, public thisDialogRef: MatDialogRef<NavigationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any){}
  ngOnInit(){
      this.getBlockList();
  }
  getBlockList(){
    this.hospitalService.getBlockWithFloors().subscribe(res => {
        this.blockList = res.results.filter(resValue => (resValue.hasOwnProperty('children')));
    })
  }
  onBlockChange(selectedBlk){
    let floor = this.blockList.find(res => res.id == selectedBlk)
    this.floorList = floor.children;
  }
  onFloorChange(selectedFlr){
      console.log(selectedFlr)
  }
  searchLocation(id) {
      if (id.target.value != "") {
          this.commonService.getLocationSearch(id.target.value).subscribe((res) => {
              this.searchLoclist = res.results.filter(val => val.parentId == this.floorId.value);
          });
      } else {
          this.searchLoclist = [];
      }
  }
}
