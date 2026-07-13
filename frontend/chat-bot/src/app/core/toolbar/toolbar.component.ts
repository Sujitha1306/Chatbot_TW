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
import { Component, OnInit, Input, DoCheck, ViewChild, HostListener, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ToolbarHelpers } from './toolbar.helpers';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonService, DashboardService } from '../../shared';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonMapComponent } from '../../shared/modules/entry-component/common-map/common-map.component';
import { PatientInfoComponent } from '../../shared/modules/entry-component/patient/patient.component';
import { CommonSearchComponent } from '../../shared/modules/entry-component/common-search/common-search.component';
import { CommonDialogComponent } from '../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { CookieService } from 'ngx-cookie-service';
import { MqttClient } from 'mqtt';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'cdk-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, DoCheck {
  @Input() sidenav;
  @Input() sidebar;
  @Input() drawer;
  @Input() tabmenu;
  @Input() menuName;
  menuvalue = '';
  menuvalue1 = '';
  menuvaluecheck = '';
  public arrow = false;
  globalData: any[] = [];
  mqttOpen = false;
  searchControl: FormControl;
  selectedTypeControl: FormControl;
  searchOpen = true;
  filteredResults$: Observable<string[]>;
  searchlist: any = null;
  toolbarHelpers = ToolbarHelpers;
  private readonly debounce = 400;
  status: Array<string> = [];
  search_results: Array<string> = [];
  userLevel: any;
  private readonly _client: MqttClient;
  hospital_logo = null;
  public preCustomer: any;
  more = false;
  public clearSearch = false;
  public AMRDemo: boolean = false;
  public vitalDemo: boolean = false;
  public isAmr: boolean = false;
  public isVitals: boolean = false;
  @ViewChild('filter') input;
  existPrivateUser = false;
  public searchKey = 'Today';
  public isClicked = false;
  public searchClose = false;
  searchTypes: any = [
    {
      id: 0,
      value: 'All'
    },
    {
      id: 1,
      value: 'Today'
    }];

  selectedType = 'Today';
  public activate_btn: any = [];

  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement) {

    if (!targetElement) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.searchlist = null;
    }
  }
  constructor(
    private readonly elementRef: ElementRef,
    private readonly router: Router,
    public dialog: MatDialog,
    private readonly commonService: CommonService,
    private readonly dashboardService: DashboardService,
    private readonly cookieService: CookieService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    const name = window.location.pathname;
    const val = name.split('/');
    if (val[1] === 'en' || val[1] === 'ar') {
      this.menuvalue1 = val[4];
      this.menuvalue = val[3];
    } else {
      this.menuvalue1 = val[3];
      this.menuvalue = val[2];
    }
    if (this.menuvalue != null) {
      const sidenameone = this.menuvalue.split('-');
      if (sidenameone.length !== 1) {
        this.menuvalue = sidenameone[0] + ' ' + sidenameone[1];
      }
    }

    if (this.menuvalue1 != null) {
      const sidename = this.menuvalue1.split('-');
      if (sidename.length !== 1) {
        this.menuvalue1 = sidename[0] + ' ' + sidename[1];
      }
    }
  }
  ngOnInit() {
    this.existPrivateUser = ('privateUser' in localStorage);
    this.userLevel = parseInt(localStorage.getItem('userlevel'))
    if (parseInt(localStorage.getItem('userlevel')) === 11) {
      this.AMRDemo = true;
    } else {
      this.AMRDemo = false;
    }
    if (parseInt(localStorage.getItem('userlevel')) === 1) {
      this.vitalDemo = true;
    } else {
      this.vitalDemo = false;
    }
    if (this.cookieService.check(
      'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
    )) {
      this.selectedType = this.cookieService.get(
        'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      );
    } else {
      this.cookieService.delete('global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
      this.cookieService.set(
        'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')), this.selectedType);
    }

    this.selectedTypeControl = new FormControl(this.selectedType);              // Set "Today" by default
    this.preCustomer = localStorage.getItem('customerId');
    this.hospital_logo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.preCustomer;
    this.searchControl = new FormControl('');
    this.searchControl.valueChanges
      .pipe(debounceTime(this.debounce), distinctUntilChanged())
      .subscribe(query => {
        query = query.trim();
        if (query.length >= 3) {
          this.filterResults(query);
        }
      });

    this.searchControl.valueChanges.subscribe(value => {
      if (value.lastIndexOf('~') > -1 && value != null) {
        const splitValue = value.split('=');
        const coasterId = splitValue[1].substring(0, 9);
        if (coasterId.length <= 9 && coasterId.toString().match(/^\d*$/)) {
          this.searchControl.setValue(coasterId);
          this.searchControl.updateValueAndValidity();
        }
        this.commonService.getSearchData(coasterId, this.searchKey).subscribe(res => {
          if (res.results.length !== 0) {
            const globalSearchList = res.results;
            globalSearchList[0]['patientId'] = res.results[0].id;
            globalSearchList[0]['patinetVisitId'] = res.results[0].patientVisitId;
            globalSearchList[0]['type'] = 1;

            if (globalSearchList.length === 1) {
              this.dialog.open(PatientInfoComponent,
                { data: globalSearchList[0], panelClass: ['medium-popup'], disableClose: true });
            }
          }
        });
      }
    });
  }

  getSaveEvent(event) {

    if ((this.preCustomer != localStorage.getItem('customerId')) && (event === true)) {
      console.log(localStorage.getItem('customerId'));
      this.hospital_logo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + localStorage.getItem('customerId');
      this.preCustomer = localStorage.getItem('customerId');
    }
  }

  setSerach(search) {
    this.searchKey = search;
  }

  goDashboard() {
    this.isAmr = false;
    this.isVitals = false;
    this.router.navigate(['/ovitag/dashboard']);
  }
  goDigitalQueue() {
    this.router.navigate(['/ovitag/digital-queue']);
  }
  getAMR() {
    this.isAmr = true;
    this.router.navigate(['/ovitag/dashboard/amr']);
  }
  getVitals() {
    this.isVitals = true;
    this.router.navigate(['/ovitag/dashboard/vital']);
  }
  ngDoCheck() {

    if (this.menuvaluecheck !== window.location.pathname) {
      this.menuvaluecheck = window.location.pathname;
      const name = window.location.pathname;
      const val = name.split('/');
      if (val[1] === 'en' || val[1] === 'ar') {
        this.menuvalue1 = val[4];
        this.menuvalue = val[3];
      } else {
        this.menuvalue1 = val[3];
        this.menuvalue = val[2];
      }
      if (this.menuvalue === 'hospital' && this.userLevel == 8) {
        this.menuvalue = 'organization';
      }
      if (this.menuvalue === 'analytic-insights' && this.menuvalue1 == 'patient' && this.userLevel == 8) {
        this.menuvalue1 = 'employees';
      }
      if (this.menuvalue === 'dashboard' && this.mqttOpen === false) {
        this.mqttOpen = true;
      } else if (this.menuvalue !== 'dashboard' && this.mqttOpen === true) {
        this.mqttOpen = false;

      }
      if (this.menuvalue != null) {
        const sidenameone = this.menuvalue.split('-');
        if (sidenameone.length !== 1) {
          this.menuvalue = sidenameone[0] + ' ' + sidenameone[1];
        }
      }

      if (this.menuvalue1 != null) {
        const sidename = this.menuvalue1.split('-');
        if (sidename.length !== 1) {
          this.menuvalue1 = sidename[0] + ' ' + sidename[1];
        }
      }
      if (this.menuvalue === 'dashboard' && val[3] === 'main') {
        this.isAmr = false;
      } else if (this.menuvalue === 'dashboard' && val[3] === 'amr') {
        this.isAmr = true;
      }
      if (this.menuvalue === 'dashboard' && val[3] === 'main') {
        this.isVitals = false;
      } else if (this.menuvalue === 'dashboard' && val[3] === 'vital') {
        this.isVitals = true;
      } else if (this.menuvalue === 'digital queue' && (val[2] === 'digital-queue' || val[3] === 'digital-queue')) {
        this.isVitals = false;
      }
    }
  }
  filterResults(val) {
    this.searchClose = false;
    if (val === '') {
      this.searchlist = null;
    } else {
      this.commonService.getSearchData(val, this.searchKey).subscribe(res => {
        if (res.results.length !== 0) {
          this.searchlist = res.results;
          this.clearSearch = false;
        } else {
          this.searchlist = 'empty';
          this.clearSearch = true;
        }
      });
    }
  }

  patientInfo(data) {
    data['type'] = '1';
    data['patinetVisitId'] = data.patientVisitId;
    data['patientId'] = data.id;
    data['token_no'] = data.tokenNo;
    this.dialog.open(PatientInfoComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
  }
  assetInfo(data){
    if(data.tagSerialNumber != null && data.floorId != null){
      this.dialog.open(CommonDialogComponent,
        { data: data, panelClass: ['medium-popup'], disableClose: true });
    }
  }
  globalSearch(option) {
    if (!this.isClicked) {
      this.isClicked = true;
      this.dashboardService.getTagLoc(option.tagSerialNumber).subscribe(
        (res) => {
          const dialogRef = this.dialog.open(CommonSearchComponent,
            { data: this.searchlist, panelClass: ['medium-popup'], disableClose: true });
          dialogRef.afterClosed().subscribe(result => {
            this.isClicked = false;
          });
        });
    }
  }


  arrowChange() {
    if (this.arrow === false) {
      this.arrow = true;
    } else {
      this.arrow = false;
    }
  }
  searchopen() {
    if (this.searchOpen === false) {
      this.searchOpen = true;
      this.searchlist = null;
    }
  }
  getBlurEvent(event) {
    if(event.relatedTarget == null) {
      this.searchClose = false;
    } else {
      this.searchClose = true;
      this.searchlist = null;
    }
  }
  clearDropdown(value) {
    if (value === '') {
      this.searchlist = 'empty';
      this.clearSearch = true;
    }
    else {
      const searchList = this.searchlist;
      this.searchlist = searchList;
      this.clearSearch = false;
    }
  }
 
  getGlobalSearchData(option) {
    this.dashboardService.getTagLoc(option.tagSerialNumber).subscribe(
      (res) => {
        console.log(res);
        const datas = res.results;
        option['type'] = 'search';
        option['floorid'] = datas[0].floor_id;
        option['tagid'] = option.tagSerialNumber;

        this.dialog.open(CommonMapComponent,
          { data: option, panelClass: ['mediu-popup'], disableClose: true });
      }, (error) => {
      });
  }

  getAllSearchResults(option, event) {
    this.commonService.getSearchData(option, this.searchKey).subscribe(res => {
      console.log(this.searchKey);
      if (res.results.length !== 0 && this.searchKey === 'today') {
        this.searchlist = res.results;
      } else {
        this.searchlist = 'empty';
      }
      this.dialog.open(CommonSearchComponent,
        {data: option, panelClass: ['medium-popup'], disableClose: true });
    });
  }

  getSearchTypeWiseDataFilter(option) {
    if (this.cookieService.check(
      'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
    )) {
      this.searchKey = this.cookieService.get(
        'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      );

      if (this.searchKey === option) {
        this.searchKey = this.cookieService.get(
          'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        );

      } else {
        this.cookieService.delete('global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' +
          localStorage.getItem(btoa('userId')));
        this.cookieService.set(
          'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')), option
        );
      }
    } else {
      this.cookieService.delete('global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' +
        localStorage.getItem(btoa('userId')));
      this.cookieService.set(
        'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')), option
      );
    }
    this.searchKey = this.cookieService.get(
      'global_search_type_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
    );
  }

  goToDashboard() {
    this.menuName = 'Dashboard';
    this.router.navigate(['/ovitag']);
  }
  getTagReport() {
    if (this.more === false) {
      this.router.navigate(['/ovitag/workflow/tag-tracking/tag/' + this.searchControl.value]);
      this.more = true;
    } else {
      this.router.navigate(['/ovitag/workflow/tag-tracking/' + this.searchControl.value]);
      this.more = false;
    }
  }
  fixClick() {
    console.log('')
  }
}
