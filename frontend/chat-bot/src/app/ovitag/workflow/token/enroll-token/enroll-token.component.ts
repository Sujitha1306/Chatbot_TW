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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder,  FormGroup, Validators } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../../shared';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MY_FORMATS } from '../../../../app.module';
import { environment } from '../../../../../environments/environment';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-enroll-token',
  templateUrl: './enroll-token.component.html',
  styleUrls: ['./enroll-token.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class EnrollTokenComponent implements OnInit {
  tokenForm: FormGroup;
  tokenCountValue: number;
  locationList =[];
  tokenOptions = [{ value: 1, label: '1' },{ value: 2, label: '2' },{ value: 3, label: '3' },{ value: 4, label: '4' },{ value: 5, label: '5' },{ value: 6, label: '6' },{ value: 7, label: '7' },{ value: 8, label: '8' },{ value: 9, label: '9' },{ value: 10, label: '10' }];
  showDropdown = false;
  barcodearray =[];
  selectedFontSize = 26;
  bcwidth=2.5;
  bcheight=70;
  start = null;
  floor = [];
  today = new Date();
  abbreviation = null;
  id = null;
  visitTypeList = [];
  tokenTypeList = [];
  selectedValue: string;
  floorDetails: { totalFloorCount: number; floors: any[] } = { totalFloorCount: 0, floors: [] };
  public customerLogo=null;
  public customerId = localStorage.getItem('customerId');
  public floorName =null;
  public disabled = false;

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public toastr: AppToastService,
    public configurationServices : ConfigurationService,
    public workflowService : WorkflowService,
    public commonService : CommonService,
    private readonly datePipe: DatePipe) {}

    ngOnInit(): void {
    this.buildForm();
    this.getFloorList();
    this.getLocationList();
    this.getVisitTypeList();
    this.getTokenTypeList();
    this.getFloorCount();
    this.customerLogo =  environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId ;
    this.fetchStartValue(this.tokenForm.get('tokenCount').value,this.tokenForm.get('tokenTypeId').value,this.tokenForm.get('visitTypeId').value);
    this.tokenForm.get('tokenCount').valueChanges.subscribe(value => {
      this.onFieldChange();
    });
     this.tokenForm.get('visitTypeId').valueChanges.subscribe(value => {
      this.onFieldChange();
      this.getFloorList();
    });
    this.tokenForm.get('tokenTypeId').valueChanges.subscribe(value => {
      this.onFieldChange();
    });
    this.today = new Date();
  }

  onFieldChange() {
    const tokenCount = this.tokenForm.get('tokenCount').value;
    const visitTypeId = this.tokenForm.get('visitTypeId').value;
    const tokenTypeId = this.tokenForm.get('tokenTypeId').value;
    this.fetchStartValue(tokenCount,tokenTypeId,visitTypeId);
  }

  buildForm() {
    this.tokenForm = this.fb.group({
      name: [this.data ? this.data.name : null, [Validators.pattern('^[a-zA-Z ]*$'), Validators.maxLength(30),]],
      mobileNo: [this.data ? this.data.mobileNo : null, [Validators.pattern('^[0-9]{10}$')]],
      locationId: [this.data ? this.data.locationId : null],
      tokenCount: [1, [Validators.min(1), Validators.max(10)]],
      isPrimary: [true],
      queueStatusId: [this.data ? this.data.queueStatusId : 'QS-PE'],
      tokenTypeId: [this.data ? this.data.tokenTypeId : 'TK-NOR', [Validators.required]],
      visitTypeId: [this.data ? this.data.visitTypeId : 'VT-HC', [Validators.required]],
      floorId: [this.data ? this.data.floorId : null, [Validators.required]],
      tokenDate: [this.data ? this.data.tokenDate : this.today]
    });
  }
  
  onRadioChange(event: any){
    this.selectedValue = event.value;
    this.showDropdown  = event.source.id == 'moreRadioButton' ;
  }
 
  getLocationList() {
    this.commonService.getHealthTestAvailableLocation('health_test', null, 'TC-BILL').subscribe(res => {
      this.locationList = res.results.map(({ id, name }) => ({ id, name }));
      })
  }

  getVisitTypeList() {
    this.commonService.getAppTerms('VisitType').subscribe(res => {
        this.visitTypeList = res.results.filter(item => item.code !== 'VT-TK').map(({ code, value }) => ({ code, value }));
      })
  }

  getTokenTypeList() {
    this.commonService.getAppTerms('TokenType').subscribe(res => {
        this.tokenTypeList = res.results.map(({ code, value }) => ({ code, value }));
      })
  }

  getFloorList() {
    this.configurationServices.getConfigFile('token-config').subscribe(res => {
        if (res.statusCode === 1 && res?.results != null) {
            const content = res.results.contentObject;
            const visitType = this.tokenForm.get('visitTypeId')?.value ??'VT-HC';
            const floorList = Array.isArray(content?.[visitType]?.floor)? content[visitType].floor: [];
            this.floor = floorList.filter(f => f.isFollowup === 'false').map(({ floorId, floorName }) => ({ floorId, floorName }));
            if(this.floor?.length === 1) {
              this.tokenForm.controls['floorId'].setValue(this.floor[0]?.floorId);
            } else {
              if(!this.data?.id) {
                this.tokenForm.controls['floorId'].setValue(null);
              }
            }
            const initialFloorId = this.tokenForm.controls['floorId'].value;
            if (initialFloorId) {
                this.setAbbreviation(initialFloorId);
            }
            this.tokenForm.controls['floorId'].valueChanges.subscribe(floorId => {
                this.setAbbreviation(floorId);
            });
        }
    });
}

getFloorCount(){
  this.workflowService.getFloorCount().subscribe(res => {
    this.floorDetails = res.results;
  });
  }


  setAbbreviation(floorId) {
    this.floorName = this.floor.find(item => item.floorId === floorId)?.floorName;
    if (this.floorName) {
      this.abbreviation = this.generateAbbreviation(this.floorName);
    }
  }

  // generateAbbreviation(floorName){
  //   let words = floorName.split(' ');
  //   let abbreviation = words.map(word => word[0].toUpperCase()).join('');
  //   return abbreviation;
  // }

  generateAbbreviation(floorName: string): string {
    const ordinals: { [key: string]: string } = {
      "ground":"0",
      "first": "1",
      "second": "2",
      "third": "3",
      "fourth": "4",
      "fifth": "5",
    };
   
    let words = floorName.toLowerCase().split(' ');
   
    let numberPart = ordinals[words[0]] || words[0][0].toUpperCase();
    let abbreviation = numberPart + words[1][0].toUpperCase();
    return abbreviation;
  }

  rescheduleDate(date) {
    console.log(date)
    const rescheduleDate = this.datePipe.transform(date, 'yyyy-MM-dd');
    this.fetchStartValue(this.tokenForm.get('tokenCount').value,this.tokenForm.get('tokenTypeId').value,this.tokenForm.get('visitTypeId').value, rescheduleDate)
  }

  fetchStartValue(count, tokenTypeId, visitTypeId, rescheduleDate?) {
    if (count && visitTypeId && tokenTypeId) {
      if (count != 'more')
      this.workflowService.getTokenCount(count,tokenTypeId, visitTypeId, rescheduleDate).subscribe(res => {
        this.start=res.results;
        this.generateBarcode(this.start);
        },
      );
    }
  }

  generateToken() {
    this.disabled = true;
    if (this.data === null){
        this.createToken();
    } else{
      this.updateToken();
    }
  }

  openConfirmationDialog() {
    this.disabled = false;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirmation-popup',
      data: {
        title: 'Confirmation',
        message:'Tokens are Printed.Do you wish to continue Generating Token ?',
        buttonText: { ok: 'Yes', cancel: 'No' }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
       this.tokenForm.reset();
       this.ngOnInit()
      }
      else{
        this.dialog.closeAll();
      }
    });
  }

  createToken() {
    this.today = new Date();
    const date = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd');
    let tokenDate = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd HH:mm:ss');
    if(date !== this.datePipe.transform(this.today, 'yyyy-MM-dd')) {
      tokenDate = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd 00:00:00');
    }
    const createTokenData = {
      name: this.tokenForm.controls.name.value,
      mobileNo: this.tokenForm.controls.mobileNo.value,
      locationId : this.tokenForm.controls.locationId.value,
      tokenCount: this.tokenForm.controls.tokenCount.value,
      queueStatusId : this.tokenForm.controls.locationId.value != null ?"QS-WT":"QS-PE",
      visitTypeId : this.tokenForm.controls.visitTypeId.value,
      tokenTypeId : this.tokenForm.controls.tokenTypeId.value,
      floorId : this.tokenForm.controls.floorId.value,
      isPrimary :  this.tokenForm.controls.isPrimary.value,
      tokenDate : this.tokenForm.controls.tokenTypeId.value ==='TK-RES' ? tokenDate : null
    };
    this.workflowService.createToken(createTokenData).subscribe(res => {
        this.toastr.success('Success', `${res.message}`);
          setTimeout(() => this.printToken(), 300);
        },
          error => {
            this.toastr.error('Error', `${error.error.message}`);
          });
  }

  updateToken() {
    const date = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd');
    let tokenDate = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd HH:mm:ss');
    if(date !== this.datePipe.transform(this.today, 'yyyy-MM-dd')) {
      this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd 00:00:00');
    }
    const updateTokenData = {
      name: this.tokenForm.controls.name.value,
      mobileNo: this.tokenForm.controls.mobileNo.value,
      locationId : this.tokenForm.controls.locationId.value,
      queueStatusId : this.tokenForm.controls.locationId.value != null?"QS-WT":"QS-PE",
      visitTypeId : this.tokenForm.controls.visitTypeId.value,
      tokenTypeId : this.tokenForm.controls.tokenTypeId.value,
      tokenNo : this.data?.tokenNo,
      tokenDate : this.tokenForm.controls.tokenTypeId.value ==='TK-RES' ? tokenDate : null,
    };
     this.workflowService.updateToken(this.data.id,updateTokenData).subscribe(res => {
      this.disabled = false;
      this.toastr.success('<i>Success</i>', `${res.message}`);
      this.printToken();
      },
        error => {
          this.toastr.error('<i>Error</i>', `${error.error.message}`);
        });
      // this.dialog.closeAll();
  }

  generateBarcode(fromValue) {
    this.barcodearray = [];
    if (this.data === null) {
     for (let i of fromValue) {
      this.barcodearray.push(i);
     }
    } else {
      const date = this.datePipe.transform(this.tokenForm.controls.tokenDate.value, 'yyyy-MM-dd');
      const tokenDate = this.datePipe.transform(this.data?.tokenDate, 'yyyy-MM-dd');
      if(this.data?.tokenTypeId === "TK-RES" && date !== tokenDate) {
        for (let i of fromValue) {
          this.barcodearray.push(i);
        }
      } else {
        this.barcodearray.push(this.data.tokenNo);
      }
    }
  }

  printToken() {
    const printContent = document.getElementById('tokenData')?.innerHTML;
    if (!printContent) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
    <html>
    <head>
    <title>Token</title>
    <style>

      @page {

        size: auto;

        -webkit-print-color-adjust: exact !important;

        color-adjust: exact !important;

      }

      body {

        font-family: Open Sans, sans-serif;

        margin: 0;

        padding: 10px;

      }
        
      .ovi-fnt-sze14{
        font-size:14px;
      }

      .ovi-fnt-sze18{
        font-size:18px;
      }

      .ovi-fnt-sze26{
        font-size:26px;
      }

      .ovi-fnt-sze-xxlrg{
        font-size:32px;
        font-weight:bold;
      }

      #tokenData {

        display: flex;

        flex-wrap: wrap;

        gap: 20px;

      }

      img {

        display: block;

        height: 40px;

        width: 40px;

        object-fit: contain;

        padding-left: 5px;

      }
    </style>
    </head>
    <body>
    <div id="tokenData">${printContent}</div>
    </body>
    </html>
  `);

    doc.close();
    const iframeWin = iframe.contentWindow;
    const waitForImages = () => {
      const imgs = iframeWin.document.images;
      const imgArray = Array.from(imgs);
      if (imgArray.length === 0 || imgArray.every(i => i.complete)) {
        iframeWin.focus();
        iframeWin.print();
        setTimeout(() => iframe.remove(), 1000);
        if (this.data === null) {
          this.openConfirmationDialog();
        }
      } else {
        setTimeout(waitForImages, 200);
      }
    };
    waitForImages();
  } 

}



