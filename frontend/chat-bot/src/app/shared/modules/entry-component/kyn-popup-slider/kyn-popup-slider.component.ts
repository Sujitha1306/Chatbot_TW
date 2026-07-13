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
import { CommonService } from '../../../services';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-kyn-popup-slider',
  templateUrl: './kyn-popup-slider.component.html',
  styleUrls: ['./kyn-popup-slider.component.scss']
})
export class KynPopupSliderComponent implements OnInit {

  @Input() pasingReport: any
  @Output() show = new EventEmitter<any>();
  data: any;
  dataDetails: any;
  isExpanded: boolean = false;
  public today = this.datepipe.transform(new Date(), 'yyyy-MM-ddTHH:mm:ss.SSSZ');
  reject: boolean = false;
  defaultImg = '../../../../assets/Alert/common_icons/default img.png'
  viewToken: any;
  imgView: string;

  constructor(public commonService: CommonService, public dialog: MatDialog,
    public toastr: AppToastService,public datepipe: DatePipe) {
     }

  ngOnInit(): void {
    this.data = this.pasingReport;
    this.dataDetails = this.data.reportData;
  }

  toggleExpand(){
    this.isExpanded = !this.isExpanded;
  }

  Aproval(status){
    if(status === 'Approved' || status === 'Rejected'){
      let data = {
        "requestStatus": status,
        "respondAt": this.today
      }
      this.commonService.kynAproval(this.data.type, this.dataDetails.Id, data).subscribe(res =>{
        this.close(false);
      })
    } else if(status === 'no'){
      this.reject = false;
    } else {
      this.reject = true;
    }
  }

  close(key){
    this.show.emit(key)
  }
  fixClick() {
    console.log('')
  }
}
