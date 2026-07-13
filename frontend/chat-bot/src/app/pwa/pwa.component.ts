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

import { Component, DoCheck, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommonService, HospitalService } from '../shared';
import { MobilescannerComponent } from '../ovitag/configuration/mobilescanner/mobilescanner.component';
import { MatDialog } from '@angular/material/dialog';
import { ManagePwaAssetComponent } from '../shared/modules/entry-component/pwa/manage-pwa-asset/manage-pwa-asset.component';

@Component({
  selector: 'app-pwa',
  templateUrl: './pwa.component.html',
  styleUrls: ['./pwa.component.scss']
})
export class PwaComponent implements OnInit, DoCheck {
  public userName = null; 
  public pathName = null;
  public facilityName = null;
  public customerValue = null;
  public regionValue = null;
  public facilityValue = null;
  public loginUserId = localStorage.getItem('dXNlcklk');
  public overAllcount: number = 0;
  public customerDetail = {customer : [], region : [], facility : [] };
  public enableNavbar = false;
  public enableHeader = true;
  public guestUser = false;
  patientId = null;
  headerName = null;
  pageName = [];
  routerPath: string;
  isOption: boolean = false;
 
  constructor(public router : Router, public location: Location, public hospitalService : HospitalService,public dialog: MatDialog,private readonly commonService: CommonService) { 
    this.customerValue = localStorage.getItem('customerId');
    this.regionValue = localStorage.getItem('regionId');
    this.facilityValue = localStorage.getItem(btoa('facilityId'));
    this.enableNavbar = window.location.pathname.includes('porter-request') || 
      (window.location.pathname.includes('/request') || window.location.pathname.includes('/wheelchair-request') || window.location.pathname.includes('/action') || window.location.pathname.includes('/easy-task')) ? false : true;
    this.patientId=localStorage.getItem(btoa('patientId'));
    this.getRouterPage();
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem(btoa('current_user'));
    if(localStorage.hasOwnProperty(btoa('guestInfo'))) {
      this.facilityName = localStorage.getItem(btoa('customer'));
      this.guestUser = true;
      let guestInfo = JSON.parse(localStorage.getItem(btoa('guestInfo')));
      if(guestInfo.hasOwnProperty('entity') && guestInfo.entity == "VISITOR") {
        this.enableNavbar = false;
      }
    } else {
      this.getManageControl();
      this.getNotificationCount();
    }    
    }
    
  ngDoCheck() {
    if(this.routerPath !== window.location.pathname) {
      this.getRouterPage();
      this.getNotificationCount();
    }
  }

  getRouterPage() {
    this.routerPath = window.location.pathname
    this.enableHeader = true;
    let routeFilterPath = this.routerPath.split('-').join(' ')
    routeFilterPath = routeFilterPath.split('_').join(' ')
    const routeValue = routeFilterPath.split('/');
    this.pageName = routeValue.slice(-1);
    if (this.pageName.length) {
      this.headerName = this.pageName[0] === 'pwa task' ? 'Task Management' :
        this.pageName[0] === 'pwa asset' ? 'Asset Management' : this.pageName[0] === 'pwa notification' ? 'Notification' : this.pageName[0] === 'main' ? null : null
        if(this.pageName[0] === 'pwa task' || this.pageName[0] === 'pwa asset' || this.pageName[0] === 'pwa notification') {
          this.enableHeader = false;
        }
        if(this.pageName[0] === 'pwa asset'){
          this.isOption = true
        } else {
          this.isOption = false
        }
    }
  }
  getManageControl() {
    this.hospitalService.getCustomerList().subscribe(cust => {
      let customerList = cust.results;
      this.hospitalService.getRegionList(this.customerValue).subscribe(reg => {
        let regionList = reg.results;
        this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
          let facilityList = fac.results;        
          const customer = customerList.filter(res => res.id === this.customerValue);
          const region = regionList.filter(res => res.id === this.regionValue);
          const facility = facilityList.filter(res => res.id === this.facilityValue);
          this.customerDetail.customer = customer;
          this.customerDetail.region = region;
          this.customerDetail.facility = facility;
          let nowFacility = (customer.length ? customer[0].name + ', ' : '') + (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '');
          let nowCustomer = (customer.length ? customer[0].name : '');
          localStorage.setItem(btoa('customer'), nowFacility);
          this.facilityName = localStorage.getItem(btoa('customer'));
        });
      });
    });
  }
  get firstLetter(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : '';
  }
  logout() {
    this.userName = '';
    let params = { lid: localStorage.getItem('locationId'), fid : localStorage.getItem(btoa('facilityId')), flr : null, typ : 'PATPR', cus : localStorage.getItem('customerId'), reg : localStorage.getItem('regionId')}
    localStorage.clear();    
    if(this.patientId) {
      this.router.navigate(['/login'],  { queryParams: params  });
    } else {
      this.router.navigate(['/login']);
    }
  }
  openPwaProfile(event){
    this.pathName = window.location.pathname
    if(localStorage.hasOwnProperty(btoa('guestInfo'))) {
      let guestInfo = JSON.parse(localStorage.getItem(btoa('guestInfo')))
      if(guestInfo.hasOwnProperty('entity') && guestInfo.entity == "VISITOR") {
        event = null;
      }
      if(guestInfo.hasOwnProperty('entity') && guestInfo.entity == "GUEST_USER") {
        event = null;
      }
    }
    if(event){
      if(window.location.pathname.includes('profile')) {
        this.location.back()
      } else {
        this.router.navigate(['web/profile'])
      }
    }
  }
  goToMainPage() {
    this.router.navigate(['/web/main']);
  }

  getOpenNotification() {
    this.router.navigate(['/web/pwa-notification'])
  }

  qrScan() {
    const dialogRef = this.dialog.open(MobilescannerComponent, {
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
      maxWidth: 'none',
      data: { mode: 'dialog' }
    });
       dialogRef.afterClosed().subscribe(result => {
        if(result){
          let aid=result?.params?.aid;
          if(aid){
            const dialogRef = this.dialog.open(ManagePwaAssetComponent, {
              data: {serialNo:aid},
              panelClass: 'custom-bottom-sheet'
            });
            dialogRef.afterClosed().subscribe(() => {
            });
          }
        }
       })
  }

  getNotificationCount() {
    if(this.loginUserId) {
      this.commonService.getNotificationCount(this.loginUserId).subscribe(res => {
        let notificationCount = res.results;
        this.overAllcount = notificationCount[0].All > 100 ? '99+' : notificationCount[0].All;
      })
    }
  }

  fixClick() {
    console.log('')
  }    
}
