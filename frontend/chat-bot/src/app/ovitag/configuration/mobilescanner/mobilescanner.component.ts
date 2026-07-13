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

import { Component, OnDestroy, OnInit, ViewChild, NgZone, Inject, Optional} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService } from '../../../shared';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import QrScanner from 'qr-scanner';
import { CreatePwaTicketComponent } from '../../../shared/modules/entry-component/create-pwa-ticket/create-pwa-ticket.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-mobilescanner',
  templateUrl: './mobilescanner.component.html',
  styleUrls: ['./mobilescanner.component.scss']
})
export class MobilescannerComponent implements OnInit, OnDestroy{
  @ViewChild('scanner', { static: false }) scanner: any;
  @ViewChild('video', { static: false }) video: any;
  public taskManageForm: FormGroup;
  statusData : any;
  public scannerEnabled: boolean = true;
  public information: any;
  public locId : any = null;
  public aidId : any;
  public qrScanner = null;
  public qrResultString = null;
  public pwaTicket = null;
  public mode: 'route' | 'dialog' = 'route';


  constructor(public commonService: CommonService, public fb: FormBuilder, private readonly router: Router, private readonly activeRoute : ActivatedRoute, 
    private readonly location: Location, private readonly ngZone: NgZone, public toastr: AppToastService, public dialog: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Optional() private readonly dialogRef: MatDialogRef<MobilescannerComponent>
  ) { }


  ngOnInit(): void {
    this.getAllLocation()
    if(this.data?.mode === 'dialog'){
      this.mode = 'dialog';
    }
  }
  ngOnDestroy() {
    if(this.qrScanner) {
      this.qrScanner.destroy();
      this.qrScanner = null;
    }
  }
  
  ngAfterViewInit() {
    if (this.video?.nativeElement) {
      this.qrScanner = new QrScanner(
        this.video.nativeElement,
        result => this.getQRDetails(result.data), {
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );
      this.qrScanner.start().then(() => {
      }).catch(error => {
        console.error('Could not start QR scanner', error);
      });
    }else{
      console.log("not work")
    }
  }
  goBack(event) {
    if (this.scanner) {
      this.scanner.reset();
      this.scannerEnabled = false;
    }
    if (event === 'TW-PWT') {
      this.createTicket(null, null);
    }
    if(this.mode === 'route'){
      this.location.back();
    } else {
      this.dialogRef.close();
    }
  }

  getAllLocation() {
    this.activeRoute.queryParams.subscribe(params => {
      this.pwaTicket = params['key'];
    })
  }

  scanSuccessHandler(event: any) {
    this.scannerEnabled = false;
   let data = event;
   this.getQRDetails(data); 
  }
  handleScanFailure() {
    console.warn('Scan failed.');
  }

  handleScanError(error: any) {
    console.error('Scan error: ', error);
  }
  getQRDetails(data) {
    this.qrScanner.destroy();
    this.qrScanner = null;

    try {
      const urlObj = new URL(data);
      let queryParams = new URLSearchParams(urlObj.search);
      const lidData = queryParams.get('lid');

      if (lidData?.includes('L-')) {
        this.handleLidCase(lidData);
        return;
      }

      const aidData = queryParams.get('aid');
      if (aidData) {
        if (this.handleAidDataCase(aidData)) return;
      } else {
        this.handleRawAidDataCase(data);
      }

    } catch (e) {
      this.handleFallbackCases(data);
    }

    this.scannerEnabled = false;
  }

  private handleLidCase(lidData: string) {
    let locationId = lidData.slice(2);
    if (/^\d+$/.test(locationId)) {
      if(this.mode === 'route'){
        this.ngZone.run(() => {
          this.router.navigate(['web/action'], { queryParams: { lid: locationId } });
        });
      } else {
        this.dialogRef.close({ lid: locationId });
      }
    } else {
      this.toastr.error('Invalid Non-numeric value found.', 'Error');
    }
  }

  private handleAidDataCase(aidData: string): boolean {
    let parts = aidData.split('/');
    let assetId = parts[parts.length - 1];
    if (parts?.length === 3 && /^\d+$/.test(assetId)) {
      if(this.mode === 'route'){
        this.ngZone.run(() => {
          this.router.navigate(['web/action'], { queryParams: { aid: assetId } });
        });
      } else {
        this.dialogRef.close({ aid: assetId });
      }
      return true;
    } else {
      this.toastr.error('Invalid Non-numeric value found.', 'Error');
      return false;
    }
  }

  private handleRawAidDataCase(assetId: string) {
    if (assetId?.length === 3 && /^\d+$/.test(assetId)) {
      if(this.mode === 'route'){
        this.ngZone.run(() => {
          this.router.navigate(['web/action'], { queryParams: { aid: assetId } });
        });
      } else {
        this.dialogRef.close({ aid: assetId });
      }
    }
  }

  private handleFallbackCases(data: string) {
    if(this.mode === 'route'){
      if (data?.includes('/')) {
        this.ngZone.run(() => {
          let assetQrCode = data;
          this.getOpenTicketData(assetQrCode, 'Asset');
        });
      } else if (data?.includes('-')) {
        this.ngZone.run(() => {
          let loctionId = data;
          this.getOpenTicketData(loctionId, 'Location');
        });
      } else if (data?.includes('L-')) {
        let locationId = data.slice(2);
        this.ngZone.run(() => {
          this.router.navigate(['web/action'], { queryParams: { lid: locationId } });
        });
      } else {
        let assetId = data;
        this.ngZone.run(() => {
          this.router.navigate(['web/action'], { queryParams: { aid: assetId } });
        });
      }
    } else {
      this.ngZone.run(() => {
      this.dialogRef.close({ params: { aid: data } });
       });
    }
  }

  getOpenTicketData(data, type){
    let SerialNumberData : any;
    let LocSerialNumberData : any[];
    if(data && type === 'Asset') {
      this.commonService.getAssetSerialNumList(data).subscribe(res => {
        if(res.results.length){
          SerialNumberData = res.results[0];
          this.createTicket(SerialNumberData, type);
        } else {
          this.toastr.warning('<span class = \'ovi-font-family\' style=\'font-size:16px;\'>Please scan a valid QR code.</span>');
          if (this.pwaTicket == 'TW-PWT') {
            this.createTicket(null, null)
          } else {
            if(this.mode === 'route'){
              this.router.navigate(['web/main']);
            } else {
              this.dialogRef.close();
            }
          }
        }
      });
    } else if (data && type === 'Location') {
      this.commonService.getAllLocationData(data).subscribe(res => {
        if(res.results.length){
          LocSerialNumberData = res.results[0];
          this.createTicket(LocSerialNumberData, type);
        } else {
          this.toastr.warning('<span class = \'ovi-font-family\' style=\'font-size:16px;\'>Please scan a valid QR code.</span>');
          if (this.pwaTicket == 'TW-PWT') {
            this.createTicket(null, null)
          } else {
            if(this.mode === 'route'){
              this.router.navigate(['web/main']);
            } else {
              this.dialogRef.close();
            }
          }
        }
      })
    }
  }
  createTicket(data, type) {
    let assetId = null;
    let assetName = null;
    if(data && type !== null) {
      assetName = data;
      if(type === 'Asset') {
        assetId = 'PR-AT'
      } else {
        assetId = 'PR-LC'
      }
    }
    setTimeout(() => {
      const dialogRef = this.dialog.open(CreatePwaTicketComponent, {
        maxWidth: '80vh !important',
        data: {
          activityId: data && type !== null ? 'TW-PWA' : null,
          activityName: null,
          locationId: null,
          locationName: null,
          assetId: assetId,
          assetData: assetName
        },
        panelClass: ['mob-costomize-popup-task'],
        disableClose: true
      });
      if (dialogRef) {
        dialogRef.afterClosed().subscribe(result => { });
      } else {
        console.error('dialogRef is undefined!');
      }
    },100);
  }
}
