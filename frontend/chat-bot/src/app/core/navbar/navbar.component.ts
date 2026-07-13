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
 */

import { Component, OnInit, DoCheck, ViewChild, ElementRef, Renderer2, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ColorThemeService, CommonService, DashboardService } from '../../shared';
import * as screenfull from 'screenfull';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ViewProfileComponent, ChangePasswordComponent } from '../../shared/modules/entry-component/user-menu/user-menu.component';
import { Subscription } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { locale_Json_Details } from '../../../localeJson/localeJson';
import { LightboxOnlineMenuComponent } from '../../shared/modules/entry-component/status-tracking/status-tracking.component';
import { AiComponent } from '../../shared/modules/entry-component/ai/ai.component';
import { ChatThreadComponent } from '../../chat-bot/chat/chat-thread/chat-thread.component';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class NavbarComponent implements OnInit, DoCheck {
    public menuName = ''
    public currentMenuName = ''
    public mainMenu = '';
    public subMenu = '';
    public childMenu = '';
    public customerId = null;
    public facilityId = null;
    public customerLogo = null
    public userName = null; public user = null;
    public isFullScreen: any;
    public menuList = [];
    public activate_btn = [];
    public activateDropdown = [];
    public menuArray: any = [];
    username = localStorage.getItem(btoa('current_user'));
    public fabMenuClose = true;
    @ViewChild('fabOpen', { static: true }) public elementRef: ElementRef;
    public isOpen = false;
    public customerName = "tw";
    public islayout = true;
    public isDeptEnable = false;
    public subscription: Subscription;
    layoutList: any = [];
    public layoutForm: FormGroup;
    public selectedDept: FormControl;
    locale: string;
    globalSearchfilterOptions = [
        "Today",
        "Patient",
        "Asset",
        "User"
    ];
    deptList: any = [];
    facilityLogoUrl: any;
    customerLogoUrl: any;
    defaultLogoUrl: any;
    @Output() menuClicked = new EventEmitter<boolean>();
    showsidebar: boolean = false;
    constructor(private readonly router: Router, public commonService: CommonService, private readonly renderer: Renderer2, private readonly dialog: MatDialog,
        public dashboardService: DashboardService, public form: FormBuilder, private readonly colorThemeService: ColorThemeService) {
        this.getBreadcrumb()
        this.getRole()
        this.commonService.getMenuItems();
        this.menuList = this.commonService.getMenu();
        this.activate_btn = this.commonService.getActivePermission('button');
        this.activateDropdown = this.commonService.getActivePermission('dropdown');
        this.renderer.listen('window', 'click', (e: Event) => {
            if (e.target === this.elementRef?.nativeElement) {
                this.fabMenuClose = true;
                this.isOpen = true;
            } else {
                this.fabMenuClose = false;
                this.isOpen = false;
            }
        });
        this.layoutForm = this.form.group({
            layout: [null]
        });
        this.selectedDept = new FormControl(null);
        let userId = localStorage.getItem(btoa('userId'));
        if (userId) {
            this.commonService.getUserDepartmentLink(userId).subscribe(res => {
                if (res.statusCode == 1) {
                    this.deptList = res.results
                    if (this.deptList.length && localStorage.getItem(btoa('departmentId'))) {
                        this.selectedDept.setValue(parseInt(localStorage.getItem(btoa('departmentId'))));
                        if (Number.isNaN(this.selectedDept.value)) {
                            this.selectedDept.setValue("null");
                        }
                    }
                    this.deptOnChange(parseInt(localStorage.getItem(btoa('departmentId'))))
                }

            });
        }
        // this.commonService.getAllDepartments().subscribe(res => {
        //     if(res.statusCode == 1){
        //         this.deptList = res.results
        //         if(this.deptList.length && localStorage.getItem(btoa('departmentId'))){
        //             this.selectedDept.setValue(parseInt(localStorage.getItem(btoa('departmentId'))));
        //             if (Number.isNaN(this.selectedDept.value)) {
        //                 this.selectedDept.setValue("null");
        //             }
        //         }
        //         this.deptOnChange(parseInt(localStorage.getItem(btoa('departmentId'))))
        //         }

        // });

        if (!this.activateDropdown.includes('WD_AMAL')) {
            this.selectedDept.disable();
        }
    }
    ngOnInit() {
        if (window.location.hostname.includes("max")) {
            this.customerName = "max"
        }
        if (window.location.hostname.includes("kyn")) {
            this.customerName = "kyn"
        }
        this.getCustomerLogo(true);
        let roleId = localStorage.getItem('userlevel');
        let userId = localStorage.getItem(btoa('userId'));
        this.commonService.getUserPreference(userId, roleId);
        this.dashboardService.getDashboardDetailsList(userId).subscribe(res => {
            this.layoutList = res.results.filter(val => val.linkedResourceCode == null || val.linkedResourceCode == "MN_DB");
        });
        this.subscription = this.commonService.dashboard.subscribe((dashboard) => {
            this.layoutForm.get('layout').setValue(dashboard);
            const list = this.layoutList.filter(res => res.id === dashboard);
            if (list.length) {
                let config = JSON.parse(list[0]?.configValue);
                this.isDeptEnable = config?.dynamicHeader?.enableDepartment;
            }
            this.checkLayout(list);
        });
        this.getConfigFile()
        if (this.commonService.userPreference != null && this.commonService.userPreference.hasOwnProperty('menuEvent')) {
            let val = JSON.parse(this.commonService.userPreference.menuEvent.value);
            this.showsidebar = val.expand;
            this.onMenuClick(true);
        } else {
            let value = { 'expand': false }
            this.commonService.validateUserPreference('menuEvent', JSON.stringify(value));
        }
    }
    deptOnChange(value) {
        if (value == 'all') {
            const deptIds = this.deptList.map(item => item.departmentId).join(',');
            this.commonService.setDashboardDept(deptIds);
        } else {
            this.commonService.setDashboardDept(value);
        }
    }
    getConfigFile() {
        this.commonService.getConfigFile('global-search').subscribe(res => {
            if (res.results != null) {
                let config = res.results.contentObject;
                if (config.hasOwnProperty('filterOptions')) {
                    this.globalSearchfilterOptions = config.filterOptions
                }
            }
        });
        this.colorThemeService.loadTheme();
    }
    getRole() {
        this.commonService.getAllRoleList().subscribe(res => {
            let assignedRole = res.results.filter(val => val.id == localStorage.getItem('userlevel'))
            this.userName = localStorage.getItem(btoa('current_user')) + ' [ ' + assignedRole[0]['name'] + ' ]';
            this.user = localStorage.getItem(btoa('current_user'));
        });
    }
    // logoNotfound(isSave) {
    //         this.customerLogo = '/assets/Alert/common_icons/new-logo.png';      
    // }

    logoNotfound(event: any) {
        console.log(event)
        if (event.target.src.includes(this.facilityId)) {
            this.customerLogo = this.customerLogoUrl;
            event.target.src = this.customerLogoUrl;
        } else if (event.target.src.includes(this.customerId)) {
            this.customerLogo = this.defaultLogoUrl;
            event.target.src = this.defaultLogoUrl;
        }
    }
    getCustomerLogo(isSave, globalNotification?) {
        if (isSave) {
            this.customerId = localStorage.getItem('customerId')
            this.facilityId = localStorage.getItem(btoa('facilityId'))
            this.facilityLogoUrl = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.facilityId;
            this.customerLogoUrl = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId;
            this.defaultLogoUrl = '/assets/Alert/common_icons/new-logo.png';
            this.customerLogo = this.facilityLogoUrl;
            if (globalNotification) {
                globalNotification.refreshNotification();
            }
        }
    }
    logout() {
        this.userName = '';
        const lang = localStorage.getItem(btoa('locale'))
        const enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
        localStorage.clear();
        localStorage.setItem(btoa('locale'), lang)
        localStorage.setItem('cookiesAccepted', enabledCookie)
        this.deptOnChange(null)
        if (screenfull.isFullscreen) {
            screenfull.exit();
        }
        this.router.navigate(['/login']);
    }
    checkFullscreen() {
        screenfull.toggle();
    }

    getBreadcrumb() {
        this.locale = localStorage.getItem(btoa('lang'));
        this.menuName = window.location.pathname;

        const normalizePath = (path: string) => path.split('-').join(' ').split('_').join(' ');
        const getMenuFromValue = (menuVal: string, menus: any) => {
            const menuMap: { [key: string]: any } = {
                'dashboard': menus.dashboard,
                'digital queue': menus.digital_queue,
                'health checkup': menus.health_checkup,
                'truck tracking': menus.truck_tracking,
                'employee': menus.employee,
                'visitors': menus.visitors,
                'temporary id card': menus.temporary_id_card,
                'asset management': menus.asset_management,
                'porter new': menus.porter_new,
                'outpatient': menus.outpatient,
                'operation theatre': menus.operation_theatre,
                'emergency care': menus.emergency_care,
                'ambulance': menus.ambulance,
                'infant': menus.infant,
                'consumer': menus.consumer,
                'staff routine': menus.staff_routine,
                'message centre': menus.message_centre,
                'student': menus.student,
                'form': menus.form,
                'ticket': menus.ticket,
                'patient': menus.patient,
                'manage facility': menus.manage_facility,
                'location': menus.location,
                'user management': menus.user_management,
                'import setting': menus.import_setting,
                'floor plan': menus.floor_plan,
                'support': menus.support,
                'gateway': menus.gateway,
                'gateway management': menus.gateway_management,
                'broker': menus.broker,
                'reader': menus.reader,
                'server management': menus.server_management,
                'device': menus.device,
                'asset': menus.asset,
                'rule': menus.rule,
                'appterms': menus.appterms,
                'alert': menus.alert,
                'scheduler': menus.scheduler,
                'permission mapping': menus.permission_mapping,
                'social distance config': menus.social_distance_config,
                'package': menus.package,
                'resident': menus.resident,
                'day care': menus.day_care,
                'inpatient': menus.inpatient,
                'medical record': menus.medicalRecord,
                'task': menus.task,
                'patient healthcheckup': menus.patient_healthcheckup,
                'employee summary': menus.employee_summary,
                'routine': menus.Routine,
                'maintenance': menus.Maintenance,
                'in patient': menus.In_patient,
                'out patient': menus.out_patient,
                'patient daycare': menus.patient_daycare,
                'patient infant': menus.patient_infant,
                'emergency': menus.emergency,
                'schedule report': menus.schedule_report,
                'staff': menus.staff,
                'environment': menus.environment,
                'audit log': menus.audit_log,
                'error log': menus.error_log,
                'porter': menus.porter
            };
            return menuMap[menuVal] || null;
        };

        const getMainAndSubMenu = (pathParts: string[]) => {
            if (pathParts[1] === 'en' || pathParts[1] === 'ar') {
                return { main: pathParts[3], sub: pathParts[4], array: pathParts.slice(-1) };
            } else if (this.locale === 'en-US' || this.locale === 'en') {
                return { main: pathParts[2], sub: pathParts[3], array: pathParts.slice(-1) };
            } else if (this.locale === 'ar' || this.locale === 'id') {
                const menuVal = pathParts.slice(-1)[0];
                const menus = locale_Json_Details[this.locale];
                return {
                    main: pathParts[2],
                    sub: pathParts[3],
                    array: getMenuFromValue(menuVal, menus)
                };
            }
            return { main: null, sub: null, array: [] };
        };

        const updateMenuName = (name: string | null) => {
            if (!name) return name;
            const parts = name.split('-');
            return parts.length > 1 ? parts[0] + ' ' + parts[1] : name;
        };

        const menuPath = normalizePath(this.menuName);
        const menuParts = menuPath.split('/');
        const { main, sub, array } = getMainAndSubMenu(menuParts);

        this.mainMenu = updateMenuName(main);
        this.subMenu = updateMenuName(sub);
        this.menuArray = array;

        this.currentMenuName = JSON.parse(localStorage.getItem('currentMenu') || '[]');

        if (this.currentMenuName?.length && (this.locale === 'ar' || this.locale === 'id' || this.locale === 'th')) {
            const menuVal = this.currentMenuName[0]['name'];
            const menus = locale_Json_Details[this.locale];
            this.menuArray = getMenuFromValue(menuVal.toLowerCase(), menus) || this.menuArray;
        } else if (this.currentMenuName?.length) {
            this.menuArray[0] = this.currentMenuName[0]['name'];
        }
    }

    ngDoCheck() {
        let currentMenu = JSON.parse(localStorage.getItem('currentMenu'));
        let fid = localStorage.getItem(btoa('facilityId'))
        if (fid != this.facilityId) {
            this.facilityId = fid;
            this.getConfigFile();
            this.commonService.getFacilityConfig();
        }
        if (this.menuName !== window.location.pathname || (this.currentMenuName && currentMenu && currentMenu.length && this.currentMenuName.length && this.currentMenuName[0]['name'] != currentMenu[0]['name'])) {
            this.getBreadcrumb();
        }
        if (screenfull.enabled) {
            this.isFullScreen = screenfull.isFullscreen;
        }
    }

    addProfile() {
        this.dialog.open(ViewProfileComponent,
            {
                data: {
                }, panelClass: ['small-popup'], disableClose: false
            });
    }
    changePassword() {
        const dialogRef = this.dialog.open(ChangePasswordComponent, {
            panelClass: ['small-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
        });
    }

    checkLayout(value) {
        this.commonService.setLayout(value);
    }

    openedChange(isOpended) {
        if (!isOpended) {
            this.islayout = false;
        }
    }
    openQRCodeDialog(data) {
        let selectdata = { 'type': 'qrcode' }
        const dialog = this.dialog.open(LightboxOnlineMenuComponent, {
            maxWidth: '100vw', width: '100vw', height: '100vh', data: selectdata, panelClass: "custom-preview-dialog-container", disableClose: true
        });
        dialog.afterClosed().subscribe(result => {
        });
    }

    launchAI() {
        const dialogRef = this.dialog.open(ChatThreadComponent,
            { data: null, panelClass: ['large-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => { });
    }
    onMenuClick(auto?) {

        if (auto == false) {
            this.showsidebar = !this.showsidebar
        }
        this.menuClicked.emit(this.showsidebar);
        let value = { 'expand': this.showsidebar }
        this.commonService.validateUserPreference('menuEvent', JSON.stringify(value));
    }

    fixClick() {
        console.log('')
    }
}
