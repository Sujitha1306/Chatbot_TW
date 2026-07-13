
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {mergeMap, catchError} from 'rxjs/operators';
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
import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { CommonService } from './shared';
import { environment } from '../environments/environment';
import { messaging } from '../config/firebase.config';
import { DatePipe } from '@angular/common';
import { FireBaseServiceService } from './shared/services/fire-base-service.service';

@Injectable()

export class Http_Interceptor implements HttpInterceptor {
  fcmToken = null;

  constructor(public commonService: CommonService, private readonly http: HttpClient, @Inject(LOCALE_ID) private readonly localeId: string,
  public datepipe: DatePipe,private firebaseService :FireBaseServiceService) { }

  // Description : Get the refresh token using interceptor and added the header details
  // Refer link  : https://medium.com/@monkov/angular-using-httpinterceptor-for-token-refreshing-3f04ea2ccb81
  // Date        : June 25, 2019

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = localStorage.getItem(btoa('user_token'));
    const facilityId = localStorage.getItem(btoa('facilityId'));
    const customerId = localStorage.getItem('customerId');
    const regionId   = localStorage.getItem('regionId');
    const lang = localStorage.getItem(btoa('locale'))
    // cloning request add authentication header and send it to the server with errors catching
    if(localStorage.hasOwnProperty(btoa('guestInfo'))) {
      const guestInfo   = JSON.parse(localStorage.getItem(btoa('guestInfo')));
      const userId   = localStorage.getItem(btoa('uid')) ? localStorage.getItem(btoa('uid')) : localStorage.getItem(btoa('patientId'));
      req = req.clone({
        setHeaders: {
          'AuthCode': guestInfo?.authCode || '',
          'uid': userId || '',
          'customerId': customerId ? customerId : '',
          'facilityId': facilityId ? facilityId : '',
          'regionId'  : regionId ? regionId : '',
          'Accept-Language': lang ? lang : 'en-US',
          'application' : 'WEB',
          'Client-Date' : this.datepipe.transform(new Date(), "yyyy-MM-dd HH:mm:ss"),
          'tz': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
      return next.handle(req).pipe(catchError(err => {
        return observableThrowError(err);
      }));
    } else {
    if (token) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'customerId': customerId ? customerId : '',
          'facilityId': facilityId ? facilityId : '',
          'regionId'  : regionId ? regionId : '',
          'Accept-Language': lang ? lang : 'en-US',
          'application' : 'WEB',
          'Client-Date' : this.datepipe.transform(new Date(), "yyyy-MM-dd HH:mm:ss"),
          'tz': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    } else {
          this.firebaseService.initFCM()
          this.fcmToken = this.firebaseService.fcmToken;
      if(this.fcmToken !== null){
        req = req.clone({
          setHeaders: {
            // 'Authorization': `Basic ${btoa(environment.base_value.oauth_login_token)}`,
            'Accept-Language': this.localeId,
            'application' : 'WEB',
            'fcmToken': this.fcmToken !== null ? this.fcmToken : '',
            'tz': Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        });
      } else {
        req = req.clone({
          setHeaders: {
            // 'Authorization': `Basic ${btoa(environment.base_value.oauth_login_token)}`,
            'Accept-Language': this.localeId,
            'application' : 'WEB',
            'tz': Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        });
      }
    }


    // When Token expires this block will get executed.. and we get a NEW token from service

    return next.handle(req).pipe(catchError(err => {
      if (err.status === 401) {                // 'permission' (on role basis) related error thrown it has to be handled.

        // Removed the user token in local storage for renew token generated
        localStorage.removeItem(btoa('user_token'));

        // Additional check for error message for response data
        const refreshToken = localStorage.getItem(btoa('refreshToken'));
        if (refreshToken || err.error.message === 'JWT is Expired.please renew the token') {

          // Genrate params for token refreshing

          const refreshTkn = { refreshToken: refreshToken };
          const baseurl = environment.api_base_url_new + environment.base_value.get_renew_token;

          // Calling our refresh token service

          return this.http.post(baseurl, refreshTkn).pipe(mergeMap(
            (data: any) => {
              // If reload successful update tokens
              if (data.statusCode === 1) {

                // Update tokens
                localStorage.setItem(btoa('user_token'), data.results.accessToken);
                localStorage.setItem(btoa('refreshToken'), data.results.refreshToken);

                // Clone our field request and try to resend it
                req = req.clone({
                  setHeaders: {
                    'Authorization': `Bearer ${data.results.accessToken}`,
                    'application' : 'WEB',
                    'tz': Intl.DateTimeFormat().resolvedOptions().timeZone
                  }
                });
                return next.handle(req);
              }
            }
          ));
        }
      }
      return observableThrowError(err);
    }));
  }
  }
}
