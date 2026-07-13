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

import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CommonService } from "../../../shared";

@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss'],
  })

export class ReportsComponent implements OnInit{
    public resourceCode:any;
    public tempVar = true;
    constructor(public commonService: CommonService,private readonly activatedRoute: ActivatedRoute,){
    }
    ngOnInit(): void {
        // this.resourceCode = 'MN_DB';
        this.activatedRoute.params.subscribe(routeParams => {
            this.tempVar=false;
            this.resourceCode  = routeParams['id'];
            // this.resourceCode = this.commonService.menuCode;
            // console.log("this.resourceCode:",this.resourceCode);
            this.tempVar=true;
        });
        // console.log("menucode-ngoninit:",this.commonService.menuCode);
    }
}