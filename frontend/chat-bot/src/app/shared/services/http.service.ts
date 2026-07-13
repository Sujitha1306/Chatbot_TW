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
// import {Injectable, Injector} from '@angular/core';
// import {Http, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Headers} from '@angular/http';
// import {Observable} from 'rxjs/Observable';
// import 'rxjs/add/operator/map';
// import 'rxjs/add/operator/catch';
// import 'rxjs/add/observable/throw';
// import { finalize } from 'rxjs/operators';
// import { Router } from '@angular/router';
// import { environment } from '../../../environments/environment';
// import { Options } from 'selenium-webdriver/opera';

// @Injectable()
// export class HttpService extends Http {

//   private router; 

//   constructor (backend: XHRBackend, options: RequestOptions, 
//     router: Router, injector: Injector) {
//     const token = localStorage.getItem(btoa('user_token'));
//     options.headers.set('Authorization', `Bearer ${token}`);
//     options.headers.set('Content-Type', 'application/json');
    
//     options.headers.set('facilityId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//     options.headers.set('customerId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//     // options.headers.set('url_test', 'constructor');
//     // console.log(JSON.stringify(options));
   
//     super(backend, options);
//   }

//   request(url: string|Request, options?: RequestOptionsArgs): Observable<Response> {
//     const token = localStorage.getItem(btoa('user_token'));
//     // // console.log(token);
//     // if(typeof(url) === "object")
//     // {
//     // console.log("$$ url o " + url.url);
//     //   //options = url.headers
//     // }
//     // else
//     // console.log("$$ utl " + url)
//     // //if (localStorage.getItem(btoa('facilityId')) != null) {
//     //   console.log("$$$$"  +localStorage.getItem(btoa('facilityId')))
    
//     if(typeof(url) !== "object")
//       {
//       if (!options) {
//         // let's make option object
//         options = {headers: new Headers()};
//       }
//       options.headers.set('Authorization', `Bearer ${token}`);
//       options.headers.set('Content-Type', 'application/json');
//       options.headers.set('facilityId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//       options.headers.set('customerId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//     }
//     else
//     {
//       url.headers.set('Authorization', `Bearer ${token}`);
//       url.headers.set('Content-Type', 'application/json');
//       url.headers.set('facilityId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//       url.headers.set('customerId', localStorage.getItem(btoa('facilityId'))); // FacilityId
//       // url.withCredentials = true;
//     }

//     return super.request(url, options).catch(this.catchAuthError(this));
//   }

//   //  >>>>>>>>>>>>  R E F R E S H  TOKEN <<<<<<<<<<<<<<<<<

//   private catchAuthError (self: HttpService) {
//    // we have to pass HttpService's own instance here as `self`
//     return (res: Response) => {

//     //   if (this.router == null) {
//     //     this.router = this.injector.get(Router);
//     // }
//         let refreshToken = localStorage.getItem(btoa('refreshToken'));
//         let refreshTkn=
//         {
//           refreshToken:refreshToken
//         };
//         // console.log (refreshTkn);
//       if (res.status === 401) { // When 401 get captured, refresh & access token will be reset in localstorage
//         console.log("Error_Token_Expired: redirecting to login.");
      
//       //   if (this.router == null) {
//       //     this.router = this.injector.get(Router);
//       // }


//         this.router.navigate (['/login']);

//         let baseurl = environment.api_base_url_new + environment.get_renew_token;        
//         this.post (baseurl, refreshTkn).map((res: Response) => {
//           let resObj=res.json();
//           // console.log('RESPONSE ::::::::::::::::::' + JSON.stringify(resObj));
//           let accessToken=resObj.results.accessToken;
//           let refreshToken=resObj.results.refreshToken;              
//           localStorage.setItem(btoa('user_token'), accessToken);
//           localStorage.setItem(btoa('refreshToken'), refreshToken);
//           // location.reload();
//           return res.json();
//         }).subscribe();  
//           }
//        return Observable.throw(res);
//     };
//   }
// }
