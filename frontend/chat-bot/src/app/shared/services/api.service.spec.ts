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
import { Injector } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Http,  Request, RequestMethod, Response,
  ResponseOptions, URLSearchParams, XHRBackend } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { CommonService } from './common.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';

describe(`CommonService`, () => {
    beforeEach(() => TestBed.configureTestingModule({
              imports: [ HttpClientModule, HttpClient ],
              providers: [ CommonService ]
            }));
    it(`should emit 'true' for 200 Ok`,
      waitForAsync(inject([ CommonService, MockBackend ],
                   (service: CommonService, mockBackend: MockBackend) => {
  
        // 1. prepare fake response from `MockBackend`
        mockBackend.connections.subscribe((c: MockConnection) => {
  
          // 3. respond to `CommonService` with a 200 Ok
          c.mockRespond(new Response(new ResponseOptions({
            body: '',
            status: 200
          })));
        });
  
        // 2. dispatch the http request
        
        // service.login(data)
        //   .subscribe((status: boolean) => {
        //     // 4. ensure that `CommonService` reports login success
        //     expect(status).toBeTruthy();
        //   });
  
      })));
   
  });






















// import { TestBed, async, inject } from '@angular/core/testing';
// import { RouterTestingModule } from '@angular/router/testing';
// import { DashboardService } from './dashboard.service';
// import {
//     HttpClientModule
//   } from '@angular/common/http';
//   describe('Service: DashboardService', () => {
//     let service;
    
//     //setup
//     beforeEach(() => TestBed.configureTestingModule({
//       imports: [ HttpModule ],
//       providers: [ DashboardService ]
//     }));
    
//     beforeEach(inject([DashboardService], s => {
//         // console.log("********");
//         // console.log(s);
//       service = s;
//     }));
    
//     //specs
//     it('should return available Alerts', async(() => {
//     //   service.getAllAlert().subscribe(x => { 
//     //     // expect(x).toContain('en');
//     //     // expect(x).toContain('es');
//     //     // expect(x).toContain('fr');
//     //     expect(x.length).toBeLessThan(3);
//     //   });
//     }));
//   }) 

// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { TestBed } from '@angular/core/testing';

// import { DashboardService } from './dashboard.service';

// describe('DashboardService', () => {
// let service: DashboardService;
// // let httpMock: HttpTestingController;

//     beforeEach(() => {
//         TestBed.configureTestingModule({
//             imports: [HttpClientTestingModule, HttpClientModule],
//             providers: [DashboardService],
//         });

//         // inject the service
//         service = TestBed.get(DashboardService);
//         // httpMock = TestBed.get(HttpTestingController);
//     });
//     it('should get the data successful', () => {
//         service.getAllAlert().subscribe((data: any) => {
//             expect(data);
//     });
//     });
// });