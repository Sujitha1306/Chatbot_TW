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
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../services';
import { ConfigCacheService } from '../../../config-cache.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  public userName = null; 
  public facilityName = null;
  public customerLogo = null;
  public customerId = null;
  public userlist : any;
  public userId : any;
  constructor(public router : Router,private readonly commonService: CommonService,
    private readonly configCacheService: ConfigCacheService, private readonly lookupTermService: LookupTermService
  ) { }

  ngOnInit(): void {
    this.userName = localStorage.getItem(btoa('current_user'));
    this.userId =  localStorage.getItem(btoa('userId'));
    this.facilityName = localStorage.getItem('Y3VzdG9tZXI=');
   this.getCustomerLogo(true)
   this.commonService.getUserLocationById( this.userId).subscribe(res => {
      this.userlist = res.results;
  })
  }
  getCustomerLogo(isSave) {
    if(isSave) {
       this.customerId = localStorage.getItem('customerId')
       this.customerLogo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId;
   }
}

  get firstLetter(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : '';
  }
  logout() {
    this.configCacheService.clearAllCache();
    this.lookupTermService.clearCache();
    this.userName = '';
    const enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : null;
    localStorage.clear();
    localStorage.setItem('cookiesAccepted', enabledCookie);
    this.router.navigate(['/login']);
  }
  fixClick() {
    console.log('')
  }
}
