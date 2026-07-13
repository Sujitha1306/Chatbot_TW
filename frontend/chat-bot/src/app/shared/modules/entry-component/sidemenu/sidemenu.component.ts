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
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'cdk-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent implements OnInit {

  @Input() iconOnly = false;
  @Input() code: any;
  public menus: any;
  public innerWidth: any;

  constructor(private readonly router : Router) {
  }

  ngOnInit() {
    const permission = JSON.parse(localStorage.getItem('permission'));
    if(permission) {
    const menu = permission.menuItems;
    let mobileMenus: any;

    this.innerWidth = window.innerWidth;
    if (this.innerWidth <= 565) {
      mobileMenus = menu.filter(item => item.code !== 'MN_RE');
    } else {
      mobileMenus = menu;
    }

    if (this.code === 'ALL') {
      this.menus = mobileMenus;
    } else {
      for (let i = 0; i < mobileMenus.length; i++) {
        if (this.code === mobileMenus[i].code) {
          const active_menu = mobileMenus[i].subMenus;
          this.menus = active_menu;
        }
      }
    }
    } else {
      if (!localStorage.hasOwnProperty(btoa('guestInfo'))) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }
  }
}
