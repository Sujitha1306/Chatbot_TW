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
import { Component, HostBinding, OnInit , Input, ViewEncapsulation,  ViewChild,  Renderer2, HostListener } from '@angular/core';
import { MediaChange, MediaObserver as ObservableMedia } from '@angular/flex-layout';
import {ColorThemeService, CommonService, PwaDetectionService } from '../shared';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import {  ViewProfileComponent } from '../shared/modules/entry-component/user-menu/user-menu.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import { PushNotificationsService } from '../shared/services/push.notification.service'
import { CookieConsentService } from '../shared/services/cookie-consent.service';
import { UserGuideService } from '../shared/services/user-guide.service';
​
@Component({
  selector: 'app-ovitag',
  templateUrl: './ovitag.component.html',
  styleUrls: ['./ovitag.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
​
})
​
export class OvitagComponent implements OnInit {
    oviNavOpen: boolean = true;
    oviNavMode: string = 'side';
    @HostBinding('@.disabled')
    animationsDisabled = true;
    @Input() isVisible = true;
    @Input() sidebar: boolean;
    visibility = 'shown';
    code = 'ALL';
    menuCode = null;
    profileMenu = { id: -1, code: "MN_ALL", parentId : null, link : null };
    menuValue: string;
    sideNavOpened = false;
    matDrawerOpened = false;
    matDrawerShow = false;
    sideNavMode = 'side';
    public menu: any;
    menuOpen = true;
    drawer: any;
    existPrivateUser = false;
    public isMenuClicked = false;
    parentId = null;
    public menuClickedCode: any = [];
    username = localStorage.getItem(btoa('current_user'));
    public helpDocument: any;
    public parentMenu = null;
    public taskCount = null;
    showPopup = false;
    @ViewChild('sidenav', { static: true }) public sideNav: MatSidenav;
    customerName: string;
    selectedAction: boolean = false;
    public userName = null;public user = null;
    mouseOvermenu: any;
    selectedMenuId: number | null = null;
    hoveredMenuId: number | null = null;
    currentYear: number;
    ngOnChanges() {
        this.visibility = this.isVisible ? 'shown' : 'hidden';
    }
    constructor(private readonly dialog: MatDialog,private readonly media: ObservableMedia, public common: CommonService, public pwaDetectionService : PwaDetectionService, private readonly router: Router, private readonly renderer: Renderer2,private readonly breakpointObserver: BreakpointObserver, public datepipe: DatePipe,
            public PushNotificationsService : PushNotificationsService, private readonly cookieConsentService: CookieConsentService, private readonly colorThemeService : ColorThemeService,public userGuideService: UserGuideService) {
        this.getUserGuide();
        router.events.pipe(
            filter(event => event instanceof NavigationEnd)  
          ).subscribe((event: NavigationEnd) => {
            if (event.url === '/ovitag') {
                this.parentId = 1;
                localStorage.setItem('menuId',(this.parentId));
                localStorage.removeItem('expandedMenuCode');
            } else if (localStorage.hasOwnProperty(btoa('guestInfo'))) {
                console.log('guestInfo found');
            } else {
                let menuList = JSON.parse(localStorage.getItem('urlsDetails'))
                let selectedMenu = menuList?.filter(val => val.link == event.url.split('?')[0])
                if(selectedMenu?.length) {
                    if(selectedMenu[0].parentId) {
                        let filterParentMenu = menuList?.filter(val => val.id == selectedMenu[0].parentId)
                        if(filterParentMenu.length) {
                            this.parentMenu = filterParentMenu[0];
                            if(filterParentMenu[0].parentId) { 
                                let filterParent2Menu = menuList?.filter(val => val.id == filterParentMenu[0].parentId)
                                if(filterParent2Menu.length) {
                                    this.parentMenu = filterParent2Menu[0];
                                    localStorage.setItem('submenuId',filterParentMenu[0].id);
                                    localStorage.setItem('menuId',filterParent2Menu[0].id);
                                    localStorage.setItem('expandedMenuCode', filterParent2Menu[0].code);
                                }
                            } else {
                                localStorage.setItem('submenuId',selectedMenu[0].id);                                    
                                localStorage.setItem('menuId',filterParentMenu[0].id);
                                localStorage.setItem('expandedMenuCode', filterParentMenu[0].code);
                            }
                        }
                    } else {
                        localStorage.setItem('menuId',selectedMenu[0].id);
                        localStorage.removeItem('expandedMenuCode');
                    }
                }
            }
          });
          if (localStorage.hasOwnProperty(btoa('guestInfo')) == false) {
            this.getRole()
          }          
    }
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'F1') {
            event.preventDefault();
            this.openUrl();
        }
    }
	ngOnInit() {
        this.colorThemeService.loadTheme();
        this.common.getFacilityConfig();
        if (environment.hasOwnProperty('setCookie') && environment.setCookie && !this.cookieConsentService.hasUserConsented()) {
            this.showPopup = true;
        }
        // this.getTaskDetails();
        // this.PushNotificationsService.refreshNotification$.subscribe(() => {
        //     this.getTaskDetails();
        // });
        this.breackPoint();
        if (window.location.hostname.includes("kyn")) {
            this.customerName = "kyn";
        }
        // if (parseInt(localStorage.getItem('userlevel')) === 8) {
        //     this.helpDocument = '/assets/help/social-distance/index.htm';
        // } else {
        //     this.helpDocument = '/assets/help/rtls/index.htm';
        // }
        this.parentId = localStorage.getItem('menuId');
        this.selectedMenuId = this.parentId;
        this.existPrivateUser = ('privateUser' in localStorage);
        const expandedCode = localStorage.getItem('expandedMenuCode');
        if (expandedCode) {
            this.menuCode = expandedCode;
            this.menuClickedCode = [{ code: expandedCode }];
        } else {
            this.menuCode = null;
            this.menuClickedCode = [];
        }
		this.media.asObservable().subscribe((mediaChangeme: MediaChange[]) => {
            this.toggleView();
        });
        this.menu = this.common.getActivePermission('main_menu');
        if(['dev', 'demo'].indexOf(environment.env_key) == -1 && 'enableLog' in localStorage == false) {
            console.log = () => {};
            console.warn = () => {};
        }
        this.checkPermission();
        if(localStorage.getItem(btoa('reset')) == 'true') {
            this.getChangepassword()
        }
        // let roleId = localStorage.getItem('userlevel');
        // let userId = localStorage.getItem(btoa('userId'));
        // this.common.getUserPreference(userId,roleId)
        let isPwa = this.pwaDetectionService.isPwa();        
        if(isPwa && !(window.location.pathname.includes('web'))) {
            this.router.navigate(['web/main']);
        }
        this.currentYear = new Date().getFullYear();
    }
    acceptCookies(): void {
        this.cookieConsentService.acceptCookies();
        this.showPopup = false;
    }
    handleImgError(event: Event) {
        // const imgElement = event.target as HTMLImageElement;
        // imgElement.style.display = 'none';
        const target = event.target as HTMLImageElement;
        target.src = '/assets/Menus/transperant.jpg';
    }
    
    denyCookies(): void {
        this.cookieConsentService.denyCookies();
        this.showPopup = false;
    }
    breackPoint(){
        this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((state: BreakpointState) => {
         if (state.matches) {
              this.oviNavOpen = false;
              this.oviNavMode = 'over';
            } else {
              this.oviNavOpen = true;
              this.oviNavMode = 'side';
            }
          });
    }
    extendMenu() {
        this.common.menuOpen = true;
    }
    closeMenu() {
        this.common.menuOpen = false;
    }
    getRouteAnimation(outlet) {
       return outlet.activatedRouteData.animation;
       // return outlet.isActivated ? outlet.activatedRoute : ''
    }
    displayMenuName(name) {
        this.menuValue = name;
    }
    getChangepassword() {
        const dialogRef = this.dialog.open(ViewProfileComponent,{
            height: '450px', width: '850px', disableClose: true, 
             data:{key:'password', routing:true}
         })
    }
    toggleViewClose() {
        this.sideNavOpened = false;
        // this.isVisible = false;
        // this.visibility = 'hidden';
        this.media.asObservable().subscribe((mediaChangeme: MediaChange[]) => {
            this.toggleView();
        });
        this.sideNav.toggle();
    }
    toggleView() {
        
            this.sideNavMode = 'over';
            this.sideNavOpened = false;
        
	}
    menuDetails(menu){
        localStorage.setItem(btoa('menuCode'),menu.code);
    }
    menuClicked(menu, parentId){
        menu = menu?.id === this.parentMenu?.id ? this.parentMenu: menu;
        if (parentId !== null){
            this.parentId = parentId;
            localStorage.setItem('menuId',(this.parentId));
        }
        if (menu !== null) {
            this.menuClickedCode = [menu];
            this.menuCode = this.menuClickedCode[0].code;
            if (this.menuClickedCode[0].link !== null) {
                this.parentId = this.menuClickedCode[0].id;
                localStorage.setItem('menuId',(this.parentId));
                this.menuClickedCode = [];
            }
        } else {
            this.menuClickedCode = [];
            this.menuCode = null;
        }
        this.parentMenu = menu
        if(menu === null){
            this.selectedMenuId = this.parentId
        } else {
        this.selectedMenuId = menu.id;
    }
    console.log(this.selectedMenuId)
    }   
    checkPermission() {
        let session = parseInt(localStorage.getItem(btoa('session_time')));
        const currentTime = new Date().getTime();
        const diff = (session - currentTime) / 1000;
        // console.log(diff)
        if(diff <= 0) {            
            let roleId = localStorage.getItem('userlevel');
            let userId = localStorage.getItem(btoa('userId'));
            this.common.getPermissionbyId(roleId, userId).subscribe((res) => {
                const permission = JSON.stringify(res.results);
                localStorage.setItem('permission', permission);
                localStorage.removeItem('urlLinks');
                let time = (new Date().getTime() + (1 * 60 * 60 * 1000)).toString()
                localStorage.setItem(btoa('session_time'), time)
                // localStorage.setItem('userlevel', roleId);
                console.log('permission updated..')
            })
        }
    }

    // getTaskDetails() {
    //     this.common.getTaskCount().subscribe(res => {
    //         if(res.statusCode === 1) {
    //             this.taskCount = res.results.hasOwnProperty('myJob') && res.results.myJob != 0 ? res.results.myJob : 0;
    //             this.taskCount = this.taskCount > 99 ? '99+' : this.taskCount;
    //         }
    //     });
    // }
    onNavbarClick(action : boolean) {
        this.selectedAction = action; // Update based on navbar action
      }

      // v3 closes its inline submenu panel on navigation, without changing the
      // collapse (selectedAction) state which is driven by the top-left logo.
      closeMenuPanelV3() {
        const expandedCode = localStorage.getItem('expandedMenuCode');
        if (expandedCode) {
          this.menuCode = expandedCode;
          this.menuClickedCode = [{ code: expandedCode }];
        } else {
          this.menuClickedCode = [];
          this.menuCode = null;
        }
      }

      getRole() {
        this.common.getAllRoleList().subscribe(res => {
            let assignedRole = res.results.filter(val => val.id == localStorage.getItem('userlevel'))
            this.user =  assignedRole[0]['name'] ;
            this.userName = localStorage.getItem(btoa('current_user'));
        });
    }

    menuonHover(menuInfo: any | null): void {
        if (menuInfo) {
            this.mouseOvermenu = menuInfo.id; 
        } else if (this.mouseOvermenu) {
                this.mouseOvermenu = null;
        }
    }
    onHoverMenu(menuId: number | null) {
        this.hoveredMenuId = menuId;
    }
    fixClick() {
        console.log('')
    }

    getUserGuide() {
        this.common.getConfigFile('user-guide').subscribe(res => {
        if(res.statusCode) {
            const menu = JSON.parse(localStorage.getItem('currentMenu'));
            localStorage.setItem('user_guide_menu_code',menu[0]?.code);
            localStorage.setItem('help_config',btoa(JSON.stringify(res.results.contentObject)));
            }
        });
    }

    openUrl(){
        this.userGuideService.openHelpUrl();
    }

}