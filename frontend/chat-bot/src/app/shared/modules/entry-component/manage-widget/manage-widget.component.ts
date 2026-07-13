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
import { Component, Output, Input, HostListener, ElementRef, EventEmitter, OnChanges, SimpleChanges, SimpleChange, } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import {  FormBuilder,} from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-manage-widget',
  templateUrl: './manage-widget.component.html',
  styleUrls: ['./manage-widget.component.scss'],
  
})
export class ManageWidgetComponent implements OnChanges {
	cssPrefix = 'toolbar-notification';
    isOpen = false;
    permission: any;
    permissionList: Array<any> = [];
    widgetListCurrent: Array<any> = [];
    OPviewPer: string;
    IPviewPer: string;
    @Input() widgetList: any;
    @Output() widgetRemoveActions = new EventEmitter<any>();
    @HostListener('document:click', ['$event', '$event.target'])
    onClick(event: MouseEvent, targetElement: HTMLElement) {
        if (!targetElement) {
              return;
        }
        const clickedInside = this.elementRef.nativeElement.contains(targetElement);
        if (!clickedInside) {
             this.isOpen = false;
        }
    }

    constructor(private readonly elementRef: ElementRef,
      private readonly commonService: CommonService,
      public _fb: FormBuilder,
      public cookieService: CookieService) {
        const permission = this.commonService.getPermissionDetails(localStorage.getItem(btoa('current_user'))); // Y3VycmVudF91c2Vy current_user
        this.permission = permission[0].permission.widget;
        if (this.cookieService.get('ViewDashboard') == 'OP') {
          this.OPviewPer = 'active-view';
          this.IPviewPer = '';
        } else if (this.cookieService.get('ViewDashboard') == 'IP') {
          this.OPviewPer = '';
          this.IPviewPer = 'active-view';
        }
    }


    changeView(id) {
      this.cookieService.delete('ViewDashboard');
      this.cookieService.set('ViewDashboard', id);
      if (this.cookieService.get('ViewDashboard') == 'OP') {
        this.OPviewPer = 'active-view';
        this.IPviewPer = '';
      } else if (this.cookieService.get('ViewDashboard') == 'IP') {
        this.OPviewPer = '';
        this.IPviewPer = 'active-view';
      }
      let value = {};

      value = { 'type': 2, 'id': id};
      this.widgetRemoveActions.emit(value);
    }
    ngOnChanges(changes: SimpleChanges) {
      const widgetList: SimpleChange = changes.widgetList;
      if (changes.widgetList) {
        this.permissionList = [];
       this.widgetListCurrent = JSON.parse(widgetList.currentValue);

        for (let i = 0; this.permission.length > i; i++) {
          if (this.cookieService.get('ViewDashboard') == this.permission[i].CS) {
            if (!this.widgetListCurrent[this.permission[i].id]) {
              this.permissionList.push(
                {
                 'id': this.permission[i].id,
                 'description': this.permission[i].description,
                 'checked': false
                });
            } else {
              this.permissionList.push(
                {
                 'id': this.permission[i].id,
                 'description': this.permission[i].description,
                 'checked': true
                });
            }
          }


        }
      }
    }
    onChangeCategory(data, name) {
      let value = {};

      value = { 'type': 1, 'id': name, 'checked': data.target.checked};
      this.widgetRemoveActions.emit(value);
    }

  	delete() {
     this.isOpen = false;
    }
    markAllRead() {
      for (let i = 0; this.permission.length > i; i++) {
        if (!this.widgetListCurrent[this.permission[i].id]) {
         let value = {};

      value = { 'id': this.permission[i].id, 'checked': true};
      this.widgetRemoveActions.emit(value);
        }

      }
    }
  fixClick() {
    console.log('')
  }

}
