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
import { Component, OnInit, Input, HostListener, ElementRef, OnChanges, SimpleChange, SimpleChanges,EventEmitter,Output} from '@angular/core';
import { FormGroup, FormBuilder, Validators,} from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalService } from '../../../services/hospital.service';
import {CommonService} from '../../../services/common.service';
import { CookieService } from 'ngx-cookie-service';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { PushNotificationsService } from '../../../services/push.notification.service'
import { ColorThemeService } from '../../../services/theme.service';
import { ConfigCacheService } from '../../../config-cache.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
    selector: 'app-manage-control',
    templateUrl: './manage-control.component.html',
    styleUrls: ['./manage-control.component.scss']
  })
export class ManageControlComponent implements OnInit, OnChanges {
  public controlForm: FormGroup;
  public customerList: Array<any> = [];
  public regionList: Array<any> = [];
  public facilityList: Array<any> = [];
  public nowFacility = '';public nowCustomer ='';
  public id: any;
  isOpen = false;
  isAllow = false;
  @Output() isSaveClick = new EventEmitter<any>();
  @Input() currentUser = null;
  public matcher = new ErrorStateMatcherService();
  public customerId = null;
  public regionId = null;
  public facilityId = null;
  public preregionId = null;
  public prefacilityId = null;
  public precustomerId = null;
  public preexternalCustomerId = null;
  public preexternalRegionId = null;
  public preexternalfacilityId = null;
  public customerDetail = {customer : [], region : [], facility : [] };

  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement) {
    if (!targetElement) {
        return;
    }
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      if (!this.isAllow) {
        this.isOpen = false;
        if (this.controlForm.dirty) {
        this.closeControl();
        }
      } else {
        this.isAllow = false;
      }
    }
  }
  public customerValue: string;
  public regionValue: string;
  public facilityValue: string;
  public activate_btn: any = [];
  constructor(private readonly hospitalService: HospitalService, public form: FormBuilder, private readonly elementRef: ElementRef, private readonly router: Router,
      private readonly commonService: CommonService, public cookieService: CookieService,public PushNotificationsService : PushNotificationsService, private readonly colorThemeService : ColorThemeService,
      private readonly configCacheService: ConfigCacheService, private readonly lookupTermService: LookupTermService) {
      this.customerValue = localStorage.getItem('customerId');
      this.regionValue = localStorage.getItem('regionId');
      this.facilityValue = localStorage.getItem(btoa('facilityId'));
  }

  ngOnInit() {
    this.customerId = localStorage.getItem('customerId');
    this.regionId = localStorage.getItem('regionId');
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    this.precustomerId = localStorage.getItem('customerId');
    this.preregionId = localStorage.getItem('regionId');
    this.prefacilityId = localStorage.getItem(btoa('facilityId'));
    this.preexternalCustomerId = localStorage.getItem(btoa('externalCustomerId'));
    this.preexternalRegionId = localStorage.getItem(btoa('externalRegionId'));
    this.preexternalfacilityId = localStorage.getItem(btoa('externalfacilityId'));
    this.changeUser();
  }
  ngOnChanges(changes: SimpleChanges) {
    const user = localStorage.getItem('userlevel');
    const userlevel: SimpleChange = changes.user;
    if (changes.userlevel) {
      this.changeUser();
    }
  }
  changeUser() {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.buildForm();
    this.getManageControl();
  }
  getManageControl() {
    this.hospitalService.getCustomerList().subscribe(cust => {
      this.customerList = cust.results;
      this.hospitalService.getRegionList(this.customerValue).subscribe(reg => {
        this.regionList = reg.results;
        this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
          this.facilityList = fac.results;        
          const customer = this.customerList.filter(res => res.id === this.customerValue);
          const region = this.regionList.filter(res => res.id === this.regionValue);
          const facility = this.facilityList.filter(res => res.id === this.facilityValue);
          this.customerDetail.customer = customer;
          this.customerDetail.region = region;
          this.customerDetail.facility = facility;
          this.nowFacility = (customer.length ? customer[0].name + ', ' : '') + (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '');
          const facilityText = this.nowFacility;
          const parts = facilityText.split(", "); 
          if (parts.length >= 2) {
            const formattedText = `<span style="font-size: 13px;font-weight: 600;font-family: 'Open Sans', sans-serif; color: #000000;">${parts[0]}</span><br>
            <span style="font-size: 10px;font-weight: 100;font-family: 'Open Sans', sans-serif; color: #bababa;">${parts.slice(1,).join(", ")}</span>`;
            document.getElementById("output")!.innerHTML = formattedText;
          }
          this.nowCustomer = (customer.length ? customer[0].name : '');
          localStorage.setItem(btoa('customer'), this.nowFacility);
        });
      });
    });
  }
  public closeControl() {
    this.customerValue = this.precustomerId;
    this.hospitalService.getRegionList(this.precustomerId).subscribe(res => {
      this.regionList = res.results;
      if (this.regionList.length >= 1) {
        this.regionValue = this.preregionId;
        this.hospitalService.getFacilityList(this.preregionId).subscribe(res => {
          this.facilityList = res.results;
          if (this.facilityList.length >= 1) {
            this.facilityValue = this.prefacilityId;
            this.buildForm();
          }
        });
      }
    });
    localStorage.setItem('customerId', this.precustomerId);
    localStorage.setItem('regionId', this.preregionId);
    localStorage.setItem(btoa('facilityId'), this.prefacilityId);
    localStorage.setItem(btoa('externalCustomerId'), this.preexternalCustomerId);
    localStorage.setItem(btoa('externalRegionId'), this.preexternalRegionId);
    localStorage.setItem(btoa('externalfacilityId'), this.preexternalfacilityId);
    this.buildForm();
    this.isOpen = false;
  }
  newCustomerFind() {
    this.hospitalService.getAllCustomers().subscribe(res => {
      this.customerList = res.results;
    });
  }
  public buildForm() {
    this.controlForm = this.form.group({
      customer: [{ value : this.customerValue ? this.customerValue : localStorage.getItem('customerId') , disabled : !((localStorage.getItem('userlevel')  == '1') && this.activate_btn && this.activate_btn.indexOf('BT_MCCE') > -1 )}],
      region: [{ value : this.regionValue ? this.regionValue : this.regionId , disabled : !(this.activate_btn && this.activate_btn.indexOf('BT_MCRE') > -1)} , [Validators.required]],
      facility: [{ value : this.facilityValue ? this.facilityValue : this.facilityId , disabled : !(this.activate_btn && this.activate_btn.indexOf('BT_MCFE') > -1)}, [Validators.required]]
    });
  }
  customerChange(id) {
    if (this.customerId !== id) {
      this.customerValue = id;
      this.regionId = null;
      this.facilityId = null;
      this.buildForm();
    } else {
      this.customerValue = this.customerId;
      this.regionId = this.preregionId;
      this.facilityId = this.prefacilityId;
      this.buildForm();
    }
    const customerDetails = this.customerList.filter(res => res.id === this.customerValue);
    this.customerDetail.customer = customerDetails;
    this.isAllow = true;
    this.regionValue = null;
    this.facilityValue = null;
    this.facilityList = [];
    this.hospitalService.getRegionList(id).subscribe(res => {
      this.regionList = res.results;

      if (this.regionList.length >= 1) {
        this.regionValue = this.regionList[0].id;
        this.buildForm();
        this.regionChange(this.regionValue);
      }

    });
    this.isOpen = true;
    this.buildForm();
  }
  regionChange(id) {
    this.regionValue = id;
    const regionDetails = this.regionList.filter(res => res.id === this.regionValue);
    this.customerDetail.region = regionDetails;
    this.isAllow = true;
    this.facilityValue = null;
    this.hospitalService.getFacilityList(id).subscribe(res => {
      this.facilityList = res.results;
      if (this.facilityList.length >= 1) {
        this.facilityValue = this.facilityList[0].id;
        this.buildForm();
        this.facilityChange(this.facilityValue)
      }
    });
    this.isOpen = true;
    this.buildForm();
  }
  facilityChange(id) {
    this.facilityValue = id;
    const facilityDetails = this.facilityList.filter(res => res.id === this.facilityValue);
    this.customerDetail.facility = facilityDetails;
    this.isAllow = true;
  }
  facilityFormClick() {
    this.isAllow = true;
  }
  facilitySave() {
    this.configCacheService.clearAllCache();
    this.lookupTermService.clearCache();
    const customer = this.customerDetail.customer;
    const region = this.customerDetail.region;
    const facility = this.customerDetail.facility;
    if(customer.length && region.length && facility.length) {
    localStorage.setItem('customerId', customer[0].id); // ZmFjaWxpdHlJZA== LOCAL
    localStorage.setItem(btoa('externalCustomerId'), customer[0].sourceId); // ZXh0ZXJuYWxDdXN0b21lcklk
    localStorage.setItem('regionId', region[0].id); // ZmFjaWxpdHlJZA== LOCAL
    localStorage.setItem(btoa('externalRegionId'), region[0].externalSourceId); // ZXh0ZXJuYWxSZWdpb25JZA==
    localStorage.setItem(btoa('facilityId'), facility[0].id);
    localStorage.setItem(btoa('externalfacilityId'), facility[0].externalSourceId); // ZXh0ZXJuYWxmYWNpbGl0eUlk
    
    this.id = (customer[0].id + '_' + region[0].id + '_' + facility[0].id);
    this.commonService.validateUserPreference('userFacility', this.id);

    this.nowFacility = (customer.length ? customer[0].name + ', ' : '') + (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '');
    this.nowCustomer = (customer.length ? customer[0].name : '')
    const facilityText = this.nowFacility;
    const parts = facilityText.split(", "); 
    if (parts.length >= 2) {
      const formattedText = `<strong style="font-size: 13px;font-weight: 600;font-family: 'Open Sans', sans-serif; color: #000000;">${parts[0]}</strong><br>
      <span style="font-size: 10px;font-weight: 100;font-family: 'Open Sans', sans-serif; color: #bababa;">${parts.slice(1,).join(", ")}</span>`;
      document.getElementById("output")!.innerHTML = formattedText;
    }
    localStorage.setItem(btoa('facilityId'), this.controlForm.value.facility);
    localStorage.setItem(btoa('customer'), this.nowFacility);
    this.commonService.contextChanged = true;
    this.commonService.floorMap = true;
    this.commonService.changeAlert = true;
    this.commonService.changeSummary = true;
    this.commonService.changeNotify = true;
    this.commonService.userPreference = null;
    this.router.navigate(['/ovitag']);
    this.isAllow = true;
    this.isOpen = false;
    this.isSaveClick.emit(true);
    this.precustomerId = localStorage.getItem('customerId');
    this.preregionId = localStorage.getItem('regionId');
    this.prefacilityId = localStorage.getItem(btoa('facilityId'));
    this.preexternalCustomerId = localStorage.getItem(btoa('externalCustomerId'));
    this.preexternalRegionId = localStorage.getItem(btoa('externalRegionId'));
    this.preexternalfacilityId = localStorage.getItem(btoa('externalfacilityId'));
    this.PushNotificationsService.triggerNotificationRefresh();
    this.colorThemeService.loadTheme();
  }
  }
  fixClick() {
    console.log('')
  }
}
