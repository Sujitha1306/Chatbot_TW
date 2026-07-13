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
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../app.module';
import { CommonService } from '../../shared';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ReportComponent implements OnInit {
  existPrivateUser = false;
  code = 'MN_RE';
  preResourceCode = null;
  public isDynamicMenu = false;
  // currentYear: number;
  constructor(public commonService : CommonService) { }

  ngOnInit() {
    // this.currentYear = new Date().getFullYear();
    this.existPrivateUser = ('privateUser' in localStorage);
  }
  ngDoCheck() {
    let menuCode = localStorage.getItem(btoa('menuCode'));
    if (menuCode != this.preResourceCode) {
      if(window.location.pathname.includes(menuCode)) {
        this.isDynamicMenu = true;
      } else {
        this.isDynamicMenu = false;
      }
    }   
  }

}
