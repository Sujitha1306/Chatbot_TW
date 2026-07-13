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
import { Injectable } from '@angular/core';
import { CanActivate,  ActivatedRouteSnapshot, RouterStateSnapshot, NavigationStart, Event as NavigationEvent, Router} from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonService, PwaDetectionService } from '../services';
import { Subscription } from 'rxjs';
import { AppToastService } from '../services/toaster.service';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly routerSubscription: Subscription;
    public isPwa = false;

    constructor(private readonly router: Router, public commonService: CommonService, public toastr: AppToastService, public pwaDetectionService : PwaDetectionService) {
        this.isPwa = this.pwaDetectionService.isPwa();
         if (this.isPwa) {
            this.routerSubscription = this.router.events.subscribe((event: NavigationEvent) => { 
                if (event instanceof NavigationStart) {   
                  if (event.url.startsWith('/login') && localStorage.getItem(btoa('user_token'))) {
                    this.router.navigate(['/web']);
                  } 
                }
              });
        }      
     }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let permissions = JSON.parse(localStorage.getItem('permission'));
        let urlLinks = JSON.parse(localStorage.getItem('urlLinks'));
        let urlMenuDetails = JSON.parse(localStorage.getItem('urlsDetails'));
        if(state.url.includes('/web/') || state.url.includes('/pwa')) {
            return true;
        }
        if(permissions && permissions.length !== 0) {
            let menuItemsList = permissions['menuItems'];
            let link = [];
            let menuDetails = [];
            if(!urlLinks || urlLinks.length === 0){
                menuItemsList.forEach(menu => {
                    if(menu.link !== null) {
                        link.push(menu.link);
                        menuDetails.push(menu);
                    }
                    if(menu.hasOwnProperty('subMenus') && menu.subMenus.length !== 0) {
                        let level1 = JSON.parse(JSON.stringify(menu))
                        level1['subMenus'] = [];
                        menuDetails.push(level1);
                        menu.subMenus.forEach(subMenu1 => {
                            if(subMenu1.link !== null) {
                                link.push(subMenu1.link);
                                menuDetails.push(subMenu1);
                            }
                            if(subMenu1.hasOwnProperty('subMenus') && subMenu1.subMenus.length !== 0) {
                                let level2 = JSON.parse(JSON.stringify(subMenu1))
                                level2['subMenus'] = [];
                                menuDetails.push(level2);
                                subMenu1.subMenus.forEach(subMenu2 => {
                                    if(subMenu2.link !== null) {
                                        link.push(subMenu2.link);
                                        menuDetails.push(subMenu2);
                                    }
                                });
                            }
                        });
                    }
                    localStorage.setItem('urlLinks', JSON.stringify(link));
                    menuDetails = menuDetails.sort((a, b) => a.id - b.id);
                    localStorage.setItem('urlsDetails', JSON.stringify(menuDetails));
                });
            }
        }
        if (Object.keys(route.queryParams).length !== 0 && (route.queryParams.hasOwnProperty('token') || route.queryParams.hasOwnProperty('auth'))) {
            return true;
        } else if (localStorage.getItem(btoa('authCode')) && localStorage.getItem(btoa('guestInfo')).length > 0) {
            return true;
        } else

        if (localStorage.getItem(btoa('user_token')) && localStorage.length > 14) { // user_token
            // if( localStorage.getItem(btoa('session_time')) <= new Date().getTime().toString() &&
            // localStorage.getItem(btoa('session_time').toString()) === new Date().getTime().toString()) { // session_time
            // if(parseInt(localStorage.getItem(btoa('session_time'))) <= new Date().getTime()) { // session_time
            //     // console.log('Session Time >>>>', localStorage.getItem(btoa('session_time')).toString())

            //     let refresh_token = localStorage.getItem(btoa('refreshToken')); // refresh_token
            //     // this.commonService.getRefreshToken(refresh_token).subscribe(val=> {
            //     // })
            //     localStorage.clear()
            //     this.router.navigate(['/login']);
            //     return false;
            // }
            if(this.isPwa) {
                if (state.url === '/' || state.url === '/login') {
                    this.router.navigate(['/ovitag']);
                    return false;
                }
            } else if (!this.isPwa) {
                if (state.url === '/' || state.url === '/login') {
                    this.router.navigate(['/ovitag']);
                }
            }

            if(urlLinks && urlLinks.length !== 0) {
                let CurrentUrl = state.url.split('?')[0]
                const route = urlLinks.filter(x => x === CurrentUrl);
                if(urlMenuDetails && urlMenuDetails.length !== 0){
                    const currentMenu = urlMenuDetails.filter(x => x.link === CurrentUrl);
                    localStorage.setItem('currentMenu', JSON.stringify(currentMenu));
                }
                
                this.commonService.menuOpen = !state.url.includes("/monitor");
                if(state.url.includes('/dm/') || state.url.includes('/web/')  || state.url.includes('/room-display')) {
                    return true;
                }
                // console.log(route, state.url, urlLinks)
                if(route.length !== 0) {
                    return true;
                } else {
                    const landingPage = urlLinks[0];
                    this.commonService.validateUserPreference('landingPage', landingPage);
                    localStorage.clear();
                    this.router.navigate(['/login']);            
                }
            }
            return true;
        } else {
            localStorage.clear();
            this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});

            if (state.url !== '/' && !state.url.includes('gtk=')) {
                this.toastr.warning(
                    '<span style=\'font-family:Open Sans;font-size:16px;\'>' + environment.base_value.auth_card_error_msg + '</span>',);
            }
            return false;
        }
    }
    ngOnDestroy() {
        if (this.routerSubscription) {
          this.routerSubscription.unsubscribe();
        }
      }


}
