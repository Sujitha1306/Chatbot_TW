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
import { HttpClient, HttpEvent } from '@angular/common/http';
import { RequestOptions } from 'http';
import { Observable ,  throwError, TimeoutError, Subject} from 'rxjs';
import { map, timeout, catchError, takeUntil } from 'rxjs/operators';
// import 'rxjs/add/operator/map'
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppToastService } from './toaster.service';

@Injectable()
export class ApiService {
  public urlList = [];
  public interval = null;
  baseURL: string = environment.api_base_url_new;
  n8n_baseURL : string = environment.n8n_baseurl
  private destroy = new Subject<void>();

  constructor(public http: HttpClient,
    public toastr: AppToastService, public dialog: MatDialog, private readonly router: Router) { 
      this.interval = setInterval(val => {
        this.urlList = []; }, 15*60*1000);
    }

  // get(url): Observable<any> {
  //   return this.http.get(this.baseURL + url).map((res: Response) => {
  //     return res;
  //   });
  // }

  get(url): Observable<any> {
    return this.http.get(this.baseURL + url).pipe(
      timeout(environment.base_value.server_time_out),
      takeUntil(this.destroy),
      map((res: Response) => {
      return res;
      }),
      catchError((err) => this.handleErrorResponse(err, url))
    );
  }

  getFile(url: string, options: any = {}): Observable<any> {
    return this.http.get(this.baseURL + url, options).pipe(
      timeout(environment.base_value.server_time_out),
      takeUntil(this.destroy),
      map((res: any) => res),
      catchError((err) => this.handleErrorResponse(err, url))
    );
  }

  post(url, postBody: any, options?: RequestOptions): Observable<any> {
    if (options) {
      return this.http.post<any>(this.baseURL + url, options, { observe: 'response' })
        .pipe( map(
          (res: any) => res,
          err => console.log(err))
        );
    } else {
      return this.http.post<any>(this.baseURL + url, postBody)
        .pipe(map((res: any) => {
            if (url == 'api/all/auth/login') { const data = res; }
            return res;
          },
          err => console.log(err)
        )
      );
    }
  }

  delete(url): Observable<any> {
    return this.http.delete(this.baseURL + url).pipe(map((res: Response) => {
      return res;
    }));
  }

  put(url, putData: any): Observable<any> {
    return this.http.put(this.baseURL + url, putData).pipe(map((res: Response) => {
      return res;
    }));
  }
  cancelRequests() {
    this.destroy.next();
    this.destroy.complete();
    this.destroy = new Subject<void>();
  }

  n8nPost(url, postBody: any, options?: RequestOptions): Observable<any> {
    if (options) {
      return this.http.post<any>(this.n8n_baseURL + url, options, { observe: 'response' })
        .pipe(map(
          (res: any) => res,
          err => console.log(err))
        );
    } else {
      return this.http.post<any>(this.n8n_baseURL + url, postBody)
        .pipe(map((res: any) => {
          if (url == 'api/all/auth/login') { const data = res; }
          return res;
        },
          err => console.log(err)
        )
        );
    }
  }

  private handleErrorResponse(errorResponse, url?: string): Observable<HttpEvent<any>> {
    if (errorResponse instanceof TimeoutError) {
      this.toastr.error('Error', `${environment.base_value.server_time_out_error_msg}`, );
      const msg = environment.base_value.server_time_out_error_msg;
      this.postError(url, msg);
      // this.dialog.closeAll();
      // localStorage.clear();
      // if (screenfull.isFullscreen) {
      //   screenfull.exit();
      //   document.exitFullscreen();
      // }
      // this.router.navigate(['/login']);
      return throwError('Timeout Exception');
    } else {
      return throwError(errorResponse);
    }
  }
  public postError(url, msg) {
    if (this.urlList.indexOf(url) === -1) {
      this.urlList.push(url);
      console.log('timeout : '  + url);
      const postData = {
        'additionalInfo': url,
        'application': 'UI',
        'applicationScreen': 'OVITAG',
        'componentName': 'OVITAG-UI',
        'createdBy': 0,
        'errorCode': '500',
        'errorMessage': msg,
        'errorSeverity': 'ERROR',
        'errorTimestamp': new Date().getTime().toString(),
        'errorType': 'TimeoutError',
        'facilityId': null,
        'host': null,
        'lineNumber': 0,
        'locationId': 0,
        'loginId': 0,
        'mcFacilityId': null,
        'operation': 'NOT_READABLE',
        'stackTrace': msg,
        'tagId': null,
        'tagType': null,
        'url': url,
        'userId': 0
      };
      const error_url = 'api/logging/error-logging';
      return this.post(error_url, postData);
    }
  }
}
