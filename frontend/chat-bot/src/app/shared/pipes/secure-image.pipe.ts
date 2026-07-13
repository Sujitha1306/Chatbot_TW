
import {map} from 'rxjs/operators';
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
import { Pipe, PipeTransform } from '@angular/core';
// import { RequestOptions,ResponseContentType} from '@angular/http';
// import { HttpService } from './../services/http.service';
import { HttpClient } from '@angular/common/http';
@Pipe({ name: 'secureImage', pure: true })
export class SecureImagePipe implements PipeTransform {


  constructor(private readonly http: HttpClient) { }

  transform(url: string, element: HTMLImageElement): void {
    this.http.get(url, {observe: 'response', responseType: 'blob'}).pipe( // specify that response should be treated as blob data
    map(response => response)) // take the blob
    .subscribe(res => {
        console.log(element.src);
      element.src = window.URL.createObjectURL(res.body);
    });



    // this.http.get(url, new RequestOptions({ responseType: ResponseContentType.Blob })) // specify that response should be treated as blob data
    //   .map(response => response) // take the blob
    //   .subscribe(res => {
    //     element.src = window.URL.createObjectURL(res.blob());
    //   });
  }
}


// -----------------------New Code using HTTP Client------------------


// import { Pipe, PipeTransform } from '@angular/core';
// import { HttpClient }  from '@angular/common/http';
// import { ResponseContentType } from '@angular/http';

// @Pipe({
//     name: 'secureImage',
//     pure: false
//  })
// export class SecureImagePipe implements PipeTransform {

//     private cachedData: any = null;
//     private cachedUrl = '';

//   constructor(private http: HttpClient) { }

//   transform(url: string): any {
//     if (url !== this.cachedUrl) {

//     this.http.get(url, new RequestOptions({ responseType: ResponseContentType.Blob}))
//     .map(response => this.cachedData = res) // specify that response should be treated as blob data
//       }

//       //     this.http.get(url, new RequestOptions({ responseType: ResponseContentType.Blob })) // specify that response should be treated as blob data
// //       .map(response => response) // take the blob
// //       .subscribe(res => {
// //         element.src = window.URL.createObjectURL(res.blob());
// //       });

//       return this.cachedData;
//     }
// }
