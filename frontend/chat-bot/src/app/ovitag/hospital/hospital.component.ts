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

@Component({
  selector: 'app-hospital',
  templateUrl: './hospital.component.html',
  styleUrls: ['./hospital.component.scss']
})
export class HospitalComponent implements OnInit {
  existPrivateUser = false;
  code = 'MN_HP';
  checkFloorMenu = false;
  customerName: string;
  constructor() { }

  ngOnInit() {
    if (window.location.hostname.includes("kyn")) {
      this.customerName = "kyn";
    }
    this.existPrivateUser = ('privateUser' in localStorage);
    this.checkFloorMenu = window.location.pathname.includes('/ovitag/organization/floor-plan') || 
                          window.location.pathname.includes('/chat-bot-AI');
  }

}
