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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonService } from '../../../../shared';

@Component({
  selector: 'app-approved-request',
  templateUrl: './approved-request.component.html',
  styleUrls: ['./approved-request.component.scss']
})
export class ApprovedRequestComponent implements OnInit {
  
  @Input() pasingReport: any
  @Output() show = new EventEmitter<any>();
  public isOpen = false;
  passingdata: any;
  aproverList: any = [];
  totalData: any;


  constructor(public commonService: CommonService) { }

  ngOnInit(): void {
    this.getAprovedList('')
  }

  applyFilter(filterValue){
    filterValue = filterValue.trim().toLowerCase();
    console.log(filterValue)
    this.getAprovedList(filterValue)
  }

  getAprovedList(text){
    let data = {
      "limit": 2000,
      "skip": 0,
      "searchText": text
    }
    this.commonService.getAllAproveLiveList(data).subscribe(res => {
      this.totalData = res.results.totalRecords;
      this.aproverList = res.results.data.value;
    })
  }

  postschedule(data){
    this.close("post", data)
  }

  close(key, data?:any){
    let actionData = {
      "type" : key, "value" : data
    }
    this.show.emit(actionData)
  }
  fixClick() {
    console.log('')
  }  
}
