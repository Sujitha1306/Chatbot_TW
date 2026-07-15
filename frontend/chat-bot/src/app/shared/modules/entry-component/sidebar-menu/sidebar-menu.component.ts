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
import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { OvitagComponent } from '../../../../ovitag/ovitag.component';
import { MatDialog, } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApiService, CommonService,  } from '../../..';
import { FormGroup, } from '@angular/forms';
import * as screenfull from 'screenfull';
import { ViewProfileComponent, ChangePasswordComponent } from '../user-menu/user-menu.component';
import { CookieService } from 'ngx-cookie-service';
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';
import { LightboxOnlineMenuComponent } from '../status-tracking/status-tracking.component';

@Component({
  selector: 'cdk-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,//need to encapsulation
})
export class SidebarMenuComponent implements OnInit, OnChanges {

  public matcher = new ErrorStateMatcherService();
  public menus: any;
  @Input() iconOnly: boolean;
  @Input() secondaryMenu = false;
  @Input() code: any;
  @Input() menName: any;
  @Input() teams: boolean = false;
  @Input() open: boolean = false;
  @Input() showFavStar = false;
  @Input() favSubCodes: string[] = [];
  @Input() reorderable = false;
  private _orderMap: { [code: string]: string[] } = {};
  @Input()
  set orderMap(value: { [code: string]: string[] }) {
    this._orderMap = value || {};
    this.applyMenuOrder();
  }
  get orderMap(): { [code: string]: string[] } { return this._orderMap; }
  @Output() favToggle = new EventEmitter<{ subCode: string; parentCode: string }>();
  @Output() subReorder = new EventEmitter<{ parentCode: string; order: string[] }>();
  public isAllow = true;
  public isOpen = false;
  public id = null;
  public activate_btn: any = [];
  height: number;
  public ismenuScroll = 'hidden';
  public submenuId: number;
  public submenuOpen = false;
  public empUser = null;
  maxHeight: number;
  customerName: string;
  menuHeight: number;
  public defaultRouterLink:string;
  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement) {
    if (!targetElement) {
      return;
    }
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      if (this.isAllow) {
        this.isAllow = false;
        this.isOpen = true;
      } else {
        this.isAllow = true;
        this.toggleView(this.id);
      }
    }
  }
    encapsulation: ViewEncapsulation.None;
    profileForm: FormGroup;
    public helpDocument: any;

    username = localStorage.getItem(btoa('current_user')); // current_user
    // currentUser = null;
    @Input() currentUser = null;
  constructor(private readonly dialog: MatDialog, private readonly router: Router,
    public apiService: ApiService,
    public ovitag: OvitagComponent, private readonly elementRef: ElementRef, public common: CommonService,
    private readonly cookieService: CookieService) {
      this.activate_btn = this.common.getActivePermission('button');
     }
    @HostListener('window:resize', ['$event'])
    
    ngOnInit() {
      this.defaultRouterLink = window.location.pathname;
      if (window.location.hostname.includes("kyn")) {
        this.customerName = "kyn";
      }
    this.maxHeight = window.innerHeight - 130;
    this.submenuId = parseInt(localStorage.getItem('submenuId'));
    // if (parseInt(localStorage.getItem('userlevel')) === 8) {
    //   this.helpDocument = '/assets/help/social-distance/index.htm';
    // } else {
    //   this.helpDocument = '/assets/help/rtls/index.htm';
    // }

    const raw = localStorage.getItem('menuPreference');
    let prefData: any = {};
    try { prefData = raw ? JSON.parse(raw) : {}; } catch { prefData = {}; }
    this.favSubCodes = Array.isArray(prefData.favSubMenuCodes) ? prefData.favSubMenuCodes : [];

    if (this.common.facilityConfig?.sidebarmenuVersion === 1) {
      this.showFavStar = true;
    }

    if (this.code?.includes('FAV') || this.menName?.toLowerCase().includes('fav')) {
      this.showFavStar = false;
    }

    const permission = JSON.parse(localStorage.getItem('permission'));
    if(permission) {
    const menu = permission.menuItems;
    if (this.code === 'MN_ALL') {
      if (parseInt(localStorage.getItem('userlevel')) === 8) {
        for (let m = 0; m < menu.length; m++) {
          if (menu[m].name === 'Hospital') {
            menu[m].name = 'Organization';
          }
        }
      }
      this.menus = menu;
    } else if (this.code?.includes('FAV') || this.menName?.toLowerCase().includes('fav')) {
      this.loadFavorites(menu);
    } else {
      for (let i = 0; i < menu.length; i++) {
        if (this.code === menu[i].code) {
          const active_menu = menu[i].subMenus;
          this.menus = active_menu;
        }
      }
    }
    } else {
      if(localStorage.hasOwnProperty(btoa('guestInfo')) == false) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }
    const data =  this.menus.filter(resFilter => resFilter.subMenus.length !== 0);
    if (data.length !== 0) {
      this.ismenuScroll = 'scroll';
    } else {
      this.ismenuScroll = 'hidden';
    }
    this.menuHeight = ((this.menus.length * 35) + 10);
    this.applyMenuOrder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderMap'] && !changes['orderMap'].firstChange) {
      this.applyMenuOrder();
    }
  }

  private applyMenuOrder(): void {
    if (!this.menus) { return; }
    if (this._orderMap && this._orderMap[this.code]) {
      const order = this._orderMap[this.code];
      const byCode = new Map(this.menus.map(m => [m.code, m]));
      const ordered: any[] = [];
      for (const code of order) {
        const item = byCode.get(code);
        if (item) { ordered.push(item); byCode.delete(code); }
      }
      for (const m of this.menus) {
        if (byCode.has(m.code)) { ordered.push(m); }
      }
      if (ordered.length === this.menus.length) {
        this.menus = ordered;
      }
    }
    for (const m of this.menus) {
      this.applySubMenuOrder(m);
    }
  }

  private applySubMenuOrder(menu: any): void {
    if (!menu?.subMenus?.length || !this._orderMap || !this._orderMap[menu.code]) { return; }
    const order = this._orderMap[menu.code];
    const byCode = new Map(menu.subMenus.map(s => [s.code, s]));
    const ordered: any[] = [];
    for (const code of order) {
      const item = byCode.get(code);
      if (item) { ordered.push(item); byCode.delete(code); }
    }
    for (const s of menu.subMenus) {
      if (byCode.has(s.code)) { ordered.push(s); }
    }
    if (ordered.length === menu.subMenus.length) {
      menu.subMenus = ordered;
    }
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex || !this.menus) { return; }
    moveItemInArray(this.menus, event.previousIndex, event.currentIndex);
    this.subReorder.emit({ parentCode: this.code, order: this.menus.map(m => m.code) });
  }

  isFavSub(code: string): boolean {
    return this.favSubCodes?.includes(code);
  }

  loadFavorites(menu: any[]): void {
    const raw = localStorage.getItem('menuPreference');
    let prefData: any = {};
    try { prefData = raw ? JSON.parse(raw) : {}; } catch { prefData = {}; }
    const favSubCodes = new Set(Array.isArray(prefData.favSubMenuCodes) ? prefData.favSubMenuCodes : []);

    const subs: any[] = [];
    for (const m of menu) {
      if (m.code === 'MN_ALL') { continue; }
      const perm = menu.find(p => p.code === m.code);
      if (!perm?.subMenus?.length) { continue; }
      for (const sub of perm.subMenus) {
        if (favSubCodes.has(sub.code)) {
          subs.push({ ...sub, _level: 2, _parentName: m.name, subMenus: [] });
        }
        for (const ss of (sub.subMenus || [])) {
          if (favSubCodes.has(ss.code)) {
            subs.push({ ...ss, _level: 3, _parentName: m.name, _subParentName: sub.name, subMenus: [] });
          }
        }
      }
    }
    this.menus = subs;
  }

  toggleSubFav(subCode: string, parentCode: string, event: Event): void {
    event.stopPropagation();
    const raw = localStorage.getItem('menuPreference');
    let prefData: any = {};
    try { prefData = raw ? JSON.parse(raw) : {}; } catch { prefData = {}; }
    const favSubMenuCodes = Array.isArray(prefData.favSubMenuCodes) ? prefData.favSubMenuCodes : [];
    const index = favSubMenuCodes.indexOf(subCode);
    if (index > -1) {
      favSubMenuCodes.splice(index, 1);
    } else {
      favSubMenuCodes.push(subCode);
    }
    prefData.favSubMenuCodes = favSubMenuCodes;
    this.favSubCodes = favSubMenuCodes;
    const value = JSON.stringify(prefData);
    this.common.validateUserPreference('menuPreference', value);
    localStorage.setItem('menuPreference', value);

    if (this.code?.includes('FAV') || this.menName?.toLowerCase().includes('fav')) {
      const permission = JSON.parse(localStorage.getItem('permission'));
      if (permission) {
        this.loadFavorites(permission.menuItems);
      }
    }
    this.favToggle.emit({ subCode, parentCode });
  }

  openLink() {
    // SONARQUBE-Remove or correct this useless self-assignment.
    const menu_open = this.menus.open;
    this.menus.open = menu_open;
  }
  handleImgError(event: Event) {
    // const imgElement = event.target as HTMLImageElement;
    // imgElement.style.display = 'none';
    const target = event.target as HTMLImageElement;
    target.src = '/assets/Menus/transperant.jpg';
    
  }

  selectedNav(menuLink) {
    if (menuLink !== '') {
      alert('linked');

    }
  }
  onMouseLeave(event: MouseEvent): void {
    if(event.relatedTarget['className'] !== 'tw-tooltip-bottom'){
      this.isAllow = true;
      this.toggleView(this.id);
    }
  }

  toggleView(id) {
    if (id && id.subMenus?.length > 0) {
      this.ovitag.menuClicked(id, null);
    } else {
      this.id = id;
      this.ovitag.menuClicked(null , id);
    }
  }

  menuDetails(menu){
    this.common.menuCode = menu.code;
    localStorage.setItem(btoa('menuCode'),this.common.menuCode)
    this.getrouterNavigate(menu);
  }
  getrouterNavigate(data){
    if(data.link?.includes('?')){
      let params = this.paramsToJson(data.link.split('?')[1])
      let url = data.link.split('?')[0];
      this.router.navigate([url], {queryParams :params})
    }
  }  
  paramsToJson(paramStr) {
    let paramArr = paramStr.split('&');     
    let paramObj = {};
    paramArr.forEach(e=>{
        let param = e.split('=');
        paramObj[param[0]] = decodeURIComponent(param[1]);
    });
    return paramObj;
  }
  subMenuExpand(submenuId) {
    localStorage.setItem('submenuId',(submenuId));
  }

  logout() {
    this.username = '';
    const landingPage = window.location.pathname.replace('/en', '');
    console.log(landingPage);

    this.common.validateUserPreference('landingPage', landingPage);
    
    // full_screen_mode(userpreference start)
    this.common.validateUserPreference('fullscreenMode', screenfull.isFullscreen);
    // full_screen_mode(userpreference end)

    // this.common.userPreference = null;

    // if (this.cookieService.check(
    //   'landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId'))
    // )) {
    //   this.cookieService.delete('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')));
    //   this.cookieService.set('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')), landingPage);
    // } else {
    //   this.cookieService.set('landing_page_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')), landingPage);
    // }

    //full_screen_mode_ (cookies start)
    // if (this.cookieService.check(
    //   'full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId'))
    // )) {
    //   this.cookieService.delete('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')));
    //   this.cookieService.set('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')), screenfull.isFullscreen);
    // } else {
    //   this.cookieService.set('full_screen_mode_' + localStorage.getItem(btoa('facilityId')) + '_' +
    //   localStorage.getItem(btoa('userId')), screenfull.isFullscreen);
    // }
    //full_screen_mode_ (cookies end)
    // remove user from local storage to log user out
    this.common.loggedOut().subscribe(res => {
    })
    const lang = localStorage.getItem(btoa('locale'))
    const enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
    localStorage.clear();
    localStorage.setItem(btoa('locale'),lang)
    localStorage.setItem('cookiesAccepted', enabledCookie);
    if (screenfull.isFullscreen) {
      screenfull.exit();
    }
    this.router.navigate(['/login']);
}

addProfile() {
    this.dialog.open(ViewProfileComponent,
      {
        height: '450px', width: '850px',data: {
        }, panelClass: 'custom-dialog-container', disableClose: true
    });
}
changePassword() {
  console.log('changePasswordchangePassword')
    const dialogRef = this.dialog.open(ViewProfileComponent, {
       height: '450px', width: '850px', panelClass: 'custom-dialog-container', disableClose: true ,data:{key:'password', routing:true}
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  openQRCodeDialog(data){
    let selectdata = {'type' : 'qrcode'}
    const dialog = this.dialog.open(LightboxOnlineMenuComponent, {
        maxWidth: '100vw', width: '100vw', height: '100vh', data : selectdata, panelClass: "custom-preview-dialog-container"
    });
    dialog.afterClosed().subscribe(result => {
    });
}
  fixClick() {
    console.log('')
  }
}

