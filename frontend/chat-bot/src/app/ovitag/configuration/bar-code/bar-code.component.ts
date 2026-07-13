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

import { Component,ViewChild, ElementRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bar-code',
  templateUrl: './bar-code.component.html',
  styleUrls: ['./bar-code.component.scss'],
})
export class BarCodeComponent {
  public showData = false;
  barcodearray = [];
  barcodeDetail = [];
  public type : any = null;
  public locId : any;
  dataGenerate = [];
  locationsData = [];
  floorLocations : any[] = [];
  barcodeForm: FormGroup;
  iconWidth: number;
  iconLength: number;
  totalWidth: number;
  sizeOptions = [
    { value: '102 x 210 mm' }, { value: '102 x 152 mm' }, { value: '102 x 76 mm' }, 
    { value: '51 x 76 mm' }, { value: '32 x 57 mm' }, { value: '32 x 51 mm' },
  ];
  pageSizeOptions = [
    { key: 'A3 Sheet', value: 'a3' }, { key: 'A4 Sheet', value: 'a4' }, { key: 'Label Rolls', value: 'roll size' }
  ];
  @ViewChild('content', { static: false }) content: ElementRef<any>;

  selectedFontSize = 16;
  pageHeight: any;
  pageWidth: any;
  colorDark = "#000000";
  selectedMargins = 4;
  position=null;

  constructor(private readonly fb: FormBuilder,private readonly configurationServices: ConfigurationService, private readonly activeRoute : ActivatedRoute, public commonService : CommonService) {}

  ngOnInit() {
    if(this.type === null) {
      this.getAllLocation();
    }
    this.buildForm();
  }
 
  buildForm() {
    this.barcodeForm = this.fb.group({
      selectedType: [null],
      multiSelected: new FormControl(['qr-code']),
      name: [''],
      fromValue: [''],
      toValue: [''],
      pagesize: ['roll size' ],
      selectedSizess: ['102 x 210 mm' ]
   });
  }

  generateValue() {
    if (this.barcodeForm.value.selectedType === 'qr-code'){
      this.configurationServices.getConfigFile('qr-bar-config').subscribe(
        res => {
          this.position = res.results.contentObject.qr.asset['text-allign'];
        })
   }
    const { name, fromValue, toValue, pagesize, selectedSizess } = this.barcodeForm.value;
    this.showData = false;
    this.barcodearray = [];
    const iconSize = selectedSizess;
    const [iconLength, totalWidth] = iconSize.split('x').map(part => parseInt(part.trim(), 10));
    this.iconWidth = (totalWidth*0.015)
    this.iconLength = iconLength;

    if (this.type === 'location') {
      this.barcodeDetail = [];
      for (let i in this.locationsData) {
        let loc = [];
        loc = this.locationsData[i];
        for (let j in loc) {
          let locValue = {
            "env": environment.env_key,
            "base_url": environment.api_base_url_new,
            "facility_id": localStorage.getItem(btoa('facilityId')),
            "customer_id": localStorage.getItem('customerId'),
            "facility_name": localStorage.getItem(btoa('customer')),
            "locationId": loc[j].id,
            "locationName": loc[j].name
          };
          this.barcodeDetail.push(locValue)
          this.barcodearray.push([JSON.stringify(locValue)]);
      }
     }
    }

    for (let i = fromValue; i <= toValue; i++) {
      this.barcodearray.push(name + i)
    }
    if (pagesize === 'a3') {
      this.pageWidth = 297 * 3.7;
      this.pageHeight = 420 * 3.7;
    } else if (pagesize === 'a4') {
      this.pageWidth = 210 * 3.7;
      this.pageHeight = 297 * 3.7;
    } else {
      this.pageWidth = 150* 3.7;
      this.pageHeight = 500 * 3.7;
    }
    this.showData = true;
  }

  savePdf(type) {
    const element = document.getElementById('contentToConvert');
    const printContents = element ? element.innerHTML : '';
    const popupWindow = window.open('', '', 'width=800,height=400');
    if (popupWindow) {
      popupWindow.document.open();
      popupWindow.document.write('<style> @page { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; margin: ' + (type === 'bar-code' ? '2mm' : '0') + ';}</style>');
      popupWindow.document.write(`
        <html>
          <body onload="window.print(); window.close();">
            <div class="box container">${printContents}</div>
          </body>
        </html>
      `);
      popupWindow.document.close();
    }
  }
  

  removeSelectedRows(){
    this.barcodeForm.reset();
    this.barcodearray = [];
    this.showData = false;
    this.ngOnInit();
  }

  openedChange(isOpended)
  {
    if(!isOpended)
    {
       let locations = this.barcodeForm.controls['multiSelected'].value
      this.getFlorlocation(locations)
    }
  }

  getFlorlocation(event): void{
   this.floorLocations = event;
   this.locationsData = [];
   this.locationsData =  this.floorLocations;
  }

  getAllLocation() {
    this.activeRoute.queryParams.subscribe(params => {  
      this.type = params['type'];
      this.locId = params['id'];
    })
    if(this.locId != undefined) {
      this.commonService.getAllLocationById(this.locId).subscribe(res => {
        this.dataGenerate = res.results;
      })
    }
  }
}
