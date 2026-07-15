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
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Event, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, ActivatedRoute } from '@angular/router';
import { environment } from './../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { BnNgIdleService } from 'bn-ng-idle';
import * as screenfull from 'screenfull';
import { CommonService, PwaDetectionService } from './shared';
import { CookieService } from 'ngx-cookie-service';
import { VersionCheckService } from './shared/services/version-check.service';
import{ TranslateService}from'@ngx-translate/core'
// import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { PushNotificationsService } from './shared/services/push.notification.service';
import { FloatNotificationManageService } from './shared/services/float-notification-manage.service';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AppToastService } from './shared/services/toaster.service';
import { NetworkPopupService } from './network/network-popup.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class AppComponent implements OnInit {
  showLoadingSpinner = true;
  currentUrl = window.location.pathname;
  public checkDom = true;
  public isPwa = false;

 
  constructor(public toastr: AppToastService, private readonly bnIdle: BnNgIdleService,
    public dialog: MatDialog, private readonly router: Router, private readonly activeRoute: ActivatedRoute, @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly commonService: CommonService, public cookieService: CookieService, public versionCheckService: VersionCheckService, public pwaDetectionService : PwaDetectionService,
    private readonly translate : TranslateService, 
    // private readonly swUpdate: SwUpdate, 
    private readonly fcmService: PushNotificationsService, private readonly floatService:FloatNotificationManageService ,
    // private networkPopupService: NetworkPopupService
  ) {
      // if (this.swUpdate.isEnabled) {
      //   this.swUpdate.versionUpdates.subscribe(() => {
      //     if (confirm('A new version is available. Load new version?')) {
      //       window.location.reload();
      //     }
      //   });
      // }
  //   if (this.swUpdate.isEnabled) {
  //     console.log('swUpdate',swUpdate)
  //   this.swUpdate.available.subscribe(() => {
  //     console.log('hiiiii')
  //     this.swUpdate.activateUpdate().then(() => document.location.reload());
  //      console.log("build file is ready")
  //   });
  // }

    // if (this.swUpdate.isEnabled) {
    //   this.swUpdate.versionUpdates  
    //     .pipe(
    //       filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
    //     )
    //     .subscribe(event => {
    //       console.log(' New version detected',event);
    //       // this.swUpdate.activateUpdate().then(() => document.location.reload());
    //     });
    // } else {
    //   console.log('Service Worker not enabled');
    // }
      this.isPwa = this.pwaDetectionService.isPwa();  
      if(localStorage.hasOwnProperty(btoa('locale'))) {
        this.translate.use(localStorage.getItem(btoa('locale')))
      }
      this.checkToken();
      this.router.events.subscribe((routerEvent: Event) => {
        if (routerEvent instanceof NavigationStart) {
          this.showLoadingSpinner = true;
        }

        if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
          this.showLoadingSpinner = false;
        }
      });

      const time_out = environment.hasOwnProperty('idle_time_out') ? environment.idle_time_out : environment.base_value.idle_time_out;
    // User Idle Timout set to 1 hour
    // 86400000 = 24 hours [ Banner will be visible for 24 hours w/o producing duplicates, then it will go of ]
    if(!this.isPwa) {
    this.bnIdle.startWatching(time_out).subscribe((res) => {
      if (res) {
          if ((btoa('current_user') in localStorage) && !('privateUser' in localStorage) && this.currentUrl !== '/ovitag/workflow/monitor' && 
          window.location.pathname !== '/ovitag/workflow/inpatient' && window.location.pathname.includes('room-display') == false) {
          this.toastr.warning('<span class = \'ovi-font-family\' style=\'font-size:16px;\'>Automatically logged out due to inactivity!</span>');
          this.dialog.closeAll();
          localStorage.clear();
          if (screenfull.isFullscreen) {
            screenfull.exit();
            document.exitFullscreen();
          }
          this.commonService.loggedOut().subscribe(res => {})
          this.router.navigate(['/login']);
        }
      }

    });
    }
    if (isPlatformBrowser(this.platformId)) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (!isSafari && !isMobile && (window.location.protocol !== 'http:' || window.location.hostname.includes('localhost'))) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            this.fcmService.requestPermission();
            if(environment.fcm_Enable && !isMobile) {
              this.fcmService.listen();
            }
          } else {
            console.log('Permission denied');
          }
        });
      } else {
        // if(isSafari){
        //   alert('FCM permission denied');
        // }
        console.log('FCM permissions are not supported over the HTTP protocol; HTTPS is required.')
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
        const { action, data } = event.data;
        if (action === 'attend' && data?.entityType === 'RQT-AMB') {
          this.router.navigate(['/ovitag/workflow/ambulance'], {
            queryParams: {
              callId: data.callId
            }
          });
        } else if (action === 'reject') {
          this.floatService.updateCallerData('reject');
        }
      });
    }
  }

  ngOnInit(){
    sessionStorage.removeItem('chunk-reloaded');
    if(window.location.hostname.includes('pwa')) {
      this.router.navigate(['/pwa'], { queryParams: { }  })
    } else {
    
      const token = localStorage.getItem('dXNlcl90b2tlbg==')
      if (!token && (window.location.pathname === '/' || window.location.pathname === '')) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }
  }
  
  checkToken() {
    if(window.location.pathname === '/login') {
      localStorage.removeItem(btoa('user_token'));
      localStorage.removeItem(btoa('refreshToken'));
      localStorage.removeItem(btoa('current_user'));
      localStorage.removeItem('privateUser');
    }
    const accessToken = localStorage.getItem(btoa('user_token'));
    const refreshToken = localStorage.getItem(btoa('refreshToken'));
    const user = localStorage.getItem(btoa('current_user'));
    const privateUser = localStorage.getItem('privateUser') || window.location.pathname.includes('/web') || window.location.pathname.includes('/pwa') || window.location.pathname.includes('/room-display')
    
    if (accessToken && refreshToken && user && window.location.pathname !== '/login' && window.location.href.includes('gtk=') == false && !privateUser) {
      const currentMenu = localStorage.getItem('currentMenu');
      if (currentMenu) {
        const parsedMenu = JSON.parse(currentMenu);
        if (parsedMenu[0].link) {
          this.router.navigateByUrl(parsedMenu[0].link);
          return;
        }
      }
      this.router.navigateByUrl('/ovitag/dashboard');
      return;
    }    
  
    if (this.currentUrl !== '/') {
      this.activeRoute.queryParams.subscribe(params => {
        if(params.hasOwnProperty('returnUrl') && params['returnUrl'].includes('gtk=')) {
          const inputUrl = params['returnUrl'];
          const [path, queryString] = inputUrl.split("?");
          const paramsDetail = new URLSearchParams(queryString);
          const queryObject: Record<string, string> = {};
          paramsDetail.forEach((value, key) => {
            queryObject[key] = decodeURIComponent(value);
          });
          this.getGuestInfo(path, queryObject)
        } else {
        if(params.hasOwnProperty('lang')) {
          this.translate.use(params['lang'])
        }          
        if (Object.keys(params).length !== 0 && (params.hasOwnProperty('token') || params.hasOwnProperty('auth'))) {
          this.checkDom = false;
          let queryParam = {}
          if(params.hasOwnProperty('token')) {
            queryParam = {
              'token': params['token'].toString().split(' ').join('+'),
              'color': null,
              'bgcolor': null,
              'pageBgColor': null,
            };
            if (params.hasOwnProperty('color')) {
              queryParam['color'] = '#' + params['color'];
            }
            if (params.hasOwnProperty('bgcolor')) {
              queryParam['bgcolor'] = '#' + params['bgcolor'];
            }
            if (params.hasOwnProperty('pagebgcolor')) {
              queryParam['pagebgcolor'] = '#' + params['pagebgcolor'];
            }
          } else if(params.hasOwnProperty('auth')) {
            queryParam = {
              'code' : params['auth'],
              'cid' : params['cus'],
              'rid' : params['reg'],
              'fid' : params['fid']
            }
          }
          this.commonService.loginToken(queryParam).subscribe(
            iresult => {
              if (iresult.statusCode === 0) {
                this.handleLoginError(iresult.message);
                return;
              }

              this.storeUserSession(iresult);
              this.handleParamsOverrides(params, iresult);
              this.storeColors(queryParam);
              this.navigateUser(params);

              this.checkDom = true;
            },
            error => {
              this.handleLoginError(error.error.message);
            }
          );
        }
        }
      });
    }
  }
  getGuestInfo(path, params) {
    let payload = {
      'entity': 'GUEST_USER',
      'entityName' : 'GUEST USER',
      'gtk' : params.gtk,
      'mobileNumber': null, 
    }
    this.commonService.getGuestInfo(payload).subscribe(res => {
      if(res.statusCode == 1) {
        let facilityName = res.results.customerName + ', ' +  res.results.regionName + ', ' + res.results.facilityName;
        localStorage.setItem(btoa('authCode'), res.results.authCode); // dXNlcl90b2tlbg==
        localStorage.setItem(btoa('guestInfo'), JSON.stringify(res.results));
        localStorage.setItem(btoa('current_user'), res.results.name)
        localStorage.setItem(btoa('customer'), facilityName);
        localStorage.setItem('customerId', res.results.customerId);
        localStorage.setItem('regionId', res.results.regionId);
        localStorage.setItem(btoa('facilityId'), res.results.facilityId);
        localStorage.setItem('privateUser', '1');
        localStorage.setItem(btoa('uid'), res.results.uid)
        delete params['gtk'];
        this.router.navigate([path], { queryParams: params })                   
      }      
    });
  }

  private handleLoginError(message: string): void {
    this.router.navigate(['/login']);
    this.toastr.error('Error', `${message}`);
  }

  private storeUserSession(iresult: any): void {
    const user = iresult.results.user;

    localStorage.setItem('permission', JSON.stringify(iresult.results.permissions));
    localStorage.removeItem('urlLinks');
    localStorage.setItem(btoa('user_token'), iresult.results.accessToken);
    localStorage.setItem(
      btoa('current_user'),
      user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName
    );
    localStorage.setItem(btoa('session_time'), (Date.now() + 3600000).toString());
    localStorage.setItem(btoa('refreshToken'), iresult.results.refreshToken);
    this.commonService.getMenuItems();

    localStorage.setItem('userlevel', user.roles.length ? user.roles[0].id : '0');
    localStorage.setItem('customerId', user.customerId);
    localStorage.setItem('regionId', user.regionId);
    localStorage.setItem(btoa('facilityId'), user.facilityId);
    localStorage.setItem(btoa('userId'), user.id);
    localStorage.setItem('privateUser', '1');

    localStorage.setItem(btoa('externalCustomerId'), user.externalCustomerId);
    localStorage.setItem(btoa('externalRegionId'), user.externalRegionId);
    localStorage.setItem(btoa('externalfacilityId'), user.externalfacilityId);
    localStorage.setItem(btoa('tokenEnrollFlow'),  'true'); // dG9rZW5FbnJvbGxGbG93
    if(iresult.results?.loginConfig?.healthcheck?.tokenEnrollFlow?.enabled){
      localStorage.setItem(btoa('tokenEnrollFlow'),  iresult.results?.loginConfig?.healthcheck?.tokenEnrollFlow?.enabled); // dG9rZW5FbnJvbGxGbG93
    }
  }

  private handleParamsOverrides(params: any, iresult: any): void {
    const user = iresult.results.user;

    if (params.hasOwnProperty('cus')) {
      localStorage.setItem('customerId', params['cus']);
    }

    if (params.hasOwnProperty('reg')) {
      localStorage.setItem('regionId', params['reg']);
    }

    if (params.hasOwnProperty('fid')) {
      localStorage.setItem(btoa('facilityId'), params['fid']);
    }
  }

  private storeColors(queryParam: any): void {
    if (queryParam['color']) {
      localStorage.setItem('userColor', queryParam['color']);
    }
    if (queryParam['bgcolor']) {
      localStorage.setItem('userBgColor', queryParam['bgcolor']);
    }
    if (queryParam['pagebgcolor']) {
      localStorage.setItem('userPageBgColor', queryParam['pagebgcolor']);
    }
  }

  private navigateUser(params: any): void {
    if (this.currentUrl.includes('form') && params.hasOwnProperty('form')) {
      const { auth, cus, reg, fid, ...formParams } = params;
      this.router.navigate([this.currentUrl], { queryParams: formParams });
      return;
    }

    if (params.hasOwnProperty('rid')) {
      this.router.navigate([this.currentUrl], {
        queryParams: { rid: params['rid'], rtyp: params['rtyp'] },
      });
    } else if (params.hasOwnProperty('id') && params.id) {
      this.router.navigate([this.currentUrl], {
        queryParams: { id: params['id'] },
      });
    } else if (params.hasOwnProperty('slid')) {
      this.router.navigate([this.currentUrl], {
        queryParams: { slid: params['slid'] },
      });
    } else {
      this.router.navigate([this.currentUrl]);
    }
  }
}
