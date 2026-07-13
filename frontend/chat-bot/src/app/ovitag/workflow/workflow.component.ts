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
import { AppToastService } from '../../shared/services/toaster.service';
import { UserGuideService } from '../../shared/services/user-guide.service';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  existPrivateUser = false;
  code = 'MN_OT';
  customerName: string;
  constructor(
    public toastr: AppToastService,public userGuideService: UserGuideService,
    private commonService: CommonService
  ) {
  }

  ngOnInit() {
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn";
    }
    this.existPrivateUser = ('privateUser' in localStorage);
  }

  openUrl(){
    const menuCode = localStorage.getItem('user_guide_menu_code');
    this.commonService.getGuideByCode(menuCode).subscribe(res => {
      console.log(res);
    });
  }

}
