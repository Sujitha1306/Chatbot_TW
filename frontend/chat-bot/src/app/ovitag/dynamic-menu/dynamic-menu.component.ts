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
import { CommonService, DashboardService } from "../../shared";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-dynamic-menu',
    templateUrl: './dynamic-menu.component.html',
    styleUrls: ['./dynamic-menu.component.scss'],
  })

export class DynamicMenuComponent implements OnInit{
    public resourceCode:any;
    public tempVar = true;
    public menuDetail = {'type' : null, 'form' : {}};
    dashboardId = null;
    dashData: any;
    inputAction: any;
    filterInputs: any;
    enableExcel = false;
    enablePdf = false;
    enableRefresh = false;
    enableHeader = false;
    pdfConfigSelected = 'default';
    dynamicInput: any;
    excelSheetOrder:any;
    constructor(public commonService: CommonService,private readonly activatedRoute: ActivatedRoute,
        public dashboardService: DashboardService, private readonly snackbar: MatSnackBar){
    }
    ngOnInit(): void {
        this.activatedRoute.params.subscribe(routeParams => {
            this.tempVar=false;
            this.enableExcel = false;
            this.enablePdf = false;
            this.enableRefresh = false;
            this.enableHeader = false;
            this.inputAction = null;
            this.pdfConfigSelected = 'default';
            this.resourceCode  = routeParams['id'];
            if(this.resourceCode == 'form') {
                this.formMenu()
            } else if(window.location.pathname.includes('porter-request')) {
              this.requestMenu()
            } else {
              this.menuDetail['type'] = 'layout';
              localStorage.setItem(btoa('menuCode'), this.resourceCode);
              this.getDashboardLayout(this.resourceCode);
            }
            this.tempVar=true;
        });
    }
    requestMenu() {
      this.menuDetail['type'] = 'porter-request';
      this.menuDetail['detail'] = { "id" : null , "entityId" : null , "entityType" : null , "pfFormTemplateId" : null, "content" : "form","entityData": {},"entityFormStatus": null}
      this.activatedRoute.queryParams.subscribe(queryParams => {
          
      });
    }
    // http://localhost:4200/ovitag/dm/form?form=110&entityId=3927&entityType=asset&auth=D7017N625739058019C==&cus=0457&reg=0458&fid=0459
    formMenu() {
        this.menuDetail['type'] = 'form';
        this.menuDetail['form'] = { "id" : null , "entityId" : null , "entityType" : null , "pfFormTemplateId" : null, "content" : "form","entityData": {},"entityFormStatus": null}
        this.activatedRoute.queryParams.subscribe(queryParams => {
            if(queryParams.hasOwnProperty('form')) {
                this.menuDetail['form']['pfFormTemplateId'] = queryParams['form']
            }
            if(queryParams.hasOwnProperty('entityId')) {
                this.menuDetail['form']['entityId'] = queryParams['entityId']
            }
            if(queryParams.hasOwnProperty('entityType')) {
                this.menuDetail['form']['entityType'] = queryParams['entityType']
            }
            if(queryParams.hasOwnProperty('id')) {
                this.menuDetail['form']['id'] = queryParams['id']
            }
        });
    }
    public formInputUpdatedData(data){
       console.log(data);
    }
    getDashboardLayout(resourceCode = null) {
        const roleId = localStorage.getItem('userlevel');
        const userId = localStorage.getItem(btoa('userId'));
        this.dashboardService.getCurrentDashboard(userId,roleId, resourceCode).subscribe(res => {
        if (res.statusCode === 1) {
            this.dashboardId = res.results.dashboardId;
            // this.getDashboardbyId(this.dashboardId);
            this.dashData = res.results;
            this.dynamicInput = JSON.parse(res.results?.configValue);
            if(this.dynamicInput){
              this.filterInputs = this.dynamicInput['dynamicHeader']['filterInputs'];
              this.enableExcel = this.dynamicInput['dynamicHeader']['enableExcel'];
              this.enablePdf = this.dynamicInput['dynamicHeader']['enablePdf'];
              this.enableRefresh = this.dynamicInput['dynamicHeader']['enableRefresh'];
              this.enableHeader = this.dynamicInput['dynamicHeader']['enableHeader'];
              this.pdfConfigSelected = this.dynamicInput?.pdfConfig?.selected;
              this.excelSheetOrder = this.dynamicInput['dynamicHeader']['excelSheetOrder']
            }
            this.dashboardId = res.results?.dashboardId;
          } else {
            this.openSnackbar(res.message, 'warning');
          }
        });
    }
    getDashboardbyId(dashId, resourceCode?:any) {
        const userId = localStorage.getItem(btoa('userId'));
        this.dashboardService.getDashboardbyIds(dashId, userId, resourceCode).subscribe(res => {
          if (res.statusCode === 1) {
            this.dashData = res.results[0];
            this.dynamicInput = JSON.parse(res.results[0].configValue);
            if(this.dynamicInput){
              this.filterInputs = this.dynamicInput['dynamicHeader']['filterInputs'];
              this.enableExcel = this.dynamicInput['dynamicHeader']['enableExcel'];
              this.enablePdf = this.dynamicInput['dynamicHeader']['enablePdf'];
              this.enableRefresh = this.dynamicInput['dynamicHeader']['enableRefresh'];
              this.enableHeader = this.dynamicInput['dynamicHeader']['enableHeader'];
              this.pdfConfigSelected = this.dynamicInput?.pdfConfig?.selected;
            }
            this.dashboardId = res.results[0].dashboardId;
          } else {
            this.openSnackbar(res.message, 'warning');
          }
        });
      }

      openSnackbar(message: string, action: string) {
        this.snackbar.open(message, action, {
            duration: 3000,
        });
      }

      reportHeaderAction(event) {
        this.inputAction = null;
        let type = event.key;
        if(event.key === 'excel' || event.key === 'pdf' || event.key === 'refresh') {
            this.inputAction = {type, inputParams: event.data, isEnabled : true, dashId: this.dashboardId, resourceCode: this.resourceCode, dashData: this.dashData, paramJson : event.paramJson , excelSheetOrder:this.excelSheetOrder, selectedRoutine : event.selectedRoutine};
        } else {
            this.inputAction = {type, inputParams: event.data, dashId: this.dashboardId, resourceCode: this.resourceCode, dashData: this.dashData, paramJson : event.paramJson,excelSheetOrder:this.excelSheetOrder};
        }
      }
}
