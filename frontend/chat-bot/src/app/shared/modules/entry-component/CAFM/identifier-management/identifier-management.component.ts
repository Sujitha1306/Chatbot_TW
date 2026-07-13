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

import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { CommonService, ConfigurationService } from '../../../../services';
import { SessionStorageService } from '../../../../services/session.storage.service';
import { AppToastService } from '../../../../services/toaster.service';
import { debounceTime, filter, distinctUntilChanged } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { LookupTermService } from '../../../../lookup-term.service';

@Component({
  selector: 'app-identifier-management',
  templateUrl: './identifier-management.component.html',
  styleUrls: ['./identifier-management.component.scss']
})
export class IdentifierManagementComponent {
  @Input() entityData: any;
  @Output() identifierEventAction = new EventEmitter();
  public identifierForm: FormGroup;
  identifierTypes: any[] = [];
  displayedColumns: string[] = ['type', 'id', 'comments','editDelete'];
  dataSourceIdentifier = new MatTableDataSource<any>();
  idSelection = new SelectionModel<any>(true, []);
  selection = new SelectionModel<any>(true, []);
  saveIdentifier: Array<any> = [];
  updateIdentifier: any[] = [];
  public isIdTable: boolean = false;
  public isEditRow: boolean = false;
  public isDeleteId: boolean = false;
  public generateImage = null;
  public isImageGenerated = false;
  public position = null;
  public printComments = null;
  public customQrText = null;
  public isBorder = false;
  modelNumberList = [];
  public activate_btn: any;
  safeContentBasedQr = null;
  isImageLoading =false;
  customerImage = null;

  constructor(
    public form: FormBuilder,
    public dialog: MatDialog,
    public toastr: AppToastService,
    private sanitizer: DomSanitizer,
    public snackbar: MatSnackBar,
    public lookupService : LookupTermService,
    private readonly commonService: CommonService,
    private readonly configurationServices: ConfigurationService,
    private readonly sessionService:SessionStorageService
  ) {
     this.activate_btn = this.commonService.getActivePermission('button')
 }

  ngOnInit() {
    this.getAppTerms();
    this.buildform();
    this.loadModelNumberList();
    this.identifierForm.get('externalIdType').valueChanges.subscribe((newValue) => {
      this.isImageGenerated = false;
      if(newValue === 'AI-MOI'){
        this.identifierForm.get('externalIdValue')!.valueChanges.pipe(debounceTime(300),distinctUntilChanged()).subscribe(text => {
          this.loadModelNumberList(text);
        });
      }
    });
    const identifier = this.sessionService.getIdentifier();
    this.updateIdentifier = identifier?.updateIdentifier;
    this.saveIdentifier = identifier?.saveIdentifier;
    if(this.entityData.entityId ){
      this.commonService.getIdentifier(this.entityData.entityId, this.entityData.entityType).subscribe(res => {
        if (res.results.length > 0 && !this.saveIdentifier?.length) {
          this.saveIdentifier = res.results;
        }
        this.dataSourceIdentifier.data = this.saveIdentifier;
        this.isIdTable = this.dataSourceIdentifier.data.length > 0;
      });
    } else {
      this.dataSourceIdentifier = new MatTableDataSource(this.saveIdentifier);
      this.isIdTable = this.saveIdentifier.length > 0;
    }
    this.configurationServices.getConfigFile('qr-bar-config').subscribe(
      res => {
        this.position = res.results.contentObject.qr['text-allign'];
        this.printComments = res.results.contentObject.hasOwnProperty('isPrintComments') ? res.results.contentObject.isPrintComments : true;
        this.customQrText = res.results.contentObject.qr['qrText'] ? res.results.contentObject.qr['qrText'] : null;
        this.isBorder = res.results.contentObject.qr['isBorder'] ? res.results.contentObject.qr['isBorder'] : null;
        const rawContent = res.results.contentObject.qr['content'] || null;
        this.safeContentBasedQr = rawContent!=null ?this.sanitizer.bypassSecurityTrustHtml(rawContent):null;
      })
  }

  getAppTerms() {
    this.lookupService.getAppTermsLinkWrapper(this.entityData.entityGroupTypeId, 'AssetIdentifierType').subscribe(res => {
      this.identifierTypes = res?.AssetIdentifierType ?? [];
      if (this.entityData.entityId != null) {
        this.identifierTypes = this.identifierTypes;
      } else {
        this.identifierTypes = this.identifierTypes.filter(item => item.code != 'AT-QR' && item.code !== 'AT-BARC');
      }
    });
  }

  loadModelNumberList(text?){
      this.commonService.getModelNumberList('AI-MOI',text).subscribe(res => {
      this.modelNumberList = res.results || [];
    })
  }

  buildform() {
    this.identifierForm = this.form.group({
      saveIdentifier: this.form.array([this.getsaveIdentifierValues()]),
      externalIdValue: [null],
      externalIdType: [null],
      comments: [null],
    });
  }

  resetForm(){
      this.identifierForm.reset();
      this.isEditRow = false;
      this.isDeleteId = false;
  }

  editRowSelection(row) {
    this.idSelection.clear();        
    this.idSelection.select(row);    
    this.isEditRow = true;
    this.identifierForm.patchValue({
      externalIdValue: row.externalIdValue,
      externalIdType: row.externalIdType,
      comments: row.comments
    })
    this.generateIdentifier();    
  }

  removeRowSelection(row) {
    this.idSelection.clear();
    this.idSelection.select(row);
    this.removeSelectedRows();   
  }

  addRow() {
    let externalTypeName = this.identifierTypes.filter(val => val.code == this.identifierForm.controls['externalIdType'].value);
    if (this.dataSourceIdentifier.data.find(res => res.externalIdType === this.identifierForm.controls['externalIdType'].value)) {
      this.toastr.warning('Warning', `Identifier Type already exist`);
    } else {
      this.saveIdentifier.push({
        externalIdValue: this.identifierForm.controls['externalIdValue'].value,
        externalIdType: this.identifierForm.controls['externalIdType'].value,
        comments: this.identifierForm.controls['comments'].value,
        externalTypeName: externalTypeName[0].value,
        isDeleted: false
      });

      this.dataSourceIdentifier = new MatTableDataSource(this.saveIdentifier);
      this.isIdTable = true;
      this.identifierForm.controls['externalIdValue'].reset();
      this.identifierForm.controls['externalIdType'].reset();
      this.identifierForm.controls['comments'].reset();
      this.emitIdentifiers();
    }
  }

  addEditRow() {
    this.idSelection.selected.forEach(item => {
      const index: number = this.saveIdentifier.findIndex(d => d === item);
      if (this.dataSourceIdentifier.data[index]['externalIdValue'] != this.identifierForm.controls['externalIdValue'].value) {
        if (this.dataSourceIdentifier.data.find(res => res.externalIdValue == this.identifierForm.controls['externalIdValue'].value)) {
          this.toastr.warning('Warning', `Id already exist`);
        } else {
          this.dataSourceIdentifier.data[index]['externalIdValue'] = this.identifierForm.controls['externalIdValue'].value;
          this.dataSourceIdentifier.data[index]['externalIdType'] = this.identifierForm.controls['externalIdType'].value;
          this.dataSourceIdentifier.data[index]['comments'] = this.identifierForm.controls['comments'].value;

          this.identifierForm.controls['externalIdValue'].reset();
          this.identifierForm.controls['externalIdType'].reset();
          this.identifierForm.controls['comments'].reset();
          this.isIdTable = true;
          this.selection.clear();
          this.isEditRow = false;
          this.isDeleteId = false;
        }
      } else {
        this.dataSourceIdentifier.data[index]['externalIdValue'] = this.identifierForm.controls['externalIdValue'].value;
        this.dataSourceIdentifier.data[index]['externalIdType'] = this.identifierForm.controls['externalIdType'].value;
        this.dataSourceIdentifier.data[index]['comments'] = this.identifierForm.controls['comments'].value;

        this.identifierForm.controls['externalIdValue'].reset();
        this.identifierForm.controls['externalIdType'].reset();
        this.identifierForm.controls['comments'].reset();
        this.isIdTable = true;
        this.idSelection.clear();
        this.isEditRow = false;
        this.isDeleteId = false;
      }
    });
    this.emitIdentifiers();
  }

  editRow() {
    this.idSelection.selected.forEach(item => {
      const index: number = this.saveIdentifier.findIndex(d => d === item);
      let val = this.dataSourceIdentifier.data[index];
      this.isImageGenerated = false;
      this.identifierForm.controls['externalIdValue'].setValue(val['externalIdValue']);
      this.identifierForm.controls['externalIdType'].setValue(val['externalIdType']);
      this.identifierForm.controls['comments'].setValue(val['comments'])
      this.generateIdentifier();
    });
  }

  removeSelectedRows() {
    this.idSelection.selected.forEach(item => {
      const index: number = this.saveIdentifier.findIndex(d => d === item);
      if (this.dataSourceIdentifier.data[index]['id'] != null) {
        this.updateIdentifier.push({
          id: this.dataSourceIdentifier.data[index]['id'],
          externalIdValue: this.dataSourceIdentifier.data[index]['externalIdValue'],
          externalIdType: this.dataSourceIdentifier.data[index]['externalIdType'],
          comments: this.dataSourceIdentifier.data[index]['comments'],
          isDeleted: true
        })
      }
      this.dataSourceIdentifier.data.splice(index, 1);
      this.dataSourceIdentifier = new MatTableDataSource<any>(this.dataSourceIdentifier.data);
      if (this.dataSourceIdentifier.data.length > 0) {
        this.isIdTable = true;
      } else {
        this.isIdTable = false;
      }
      this.identifierForm.controls['externalIdValue'].reset();
      this.identifierForm.controls['externalIdType'].reset();
      this.identifierForm.controls['comments'].reset();
      this.isEditRow = false;
      this.isDeleteId = false;
    });
    this.idSelection = new SelectionModel<any>(true, []);
    this.emitIdentifiers();
  }

  generateIdentifierImage() {
    const idType = this.identifierForm.controls.externalIdType.value;
    this.configurationServices.generateQrBarCode(this.entityData.entityId, this.entityData.entityType, idType).subscribe(res => {
        if (res.statusCode === 1) {
          this.commonService.getIdentifier(this.entityData.entityId, this.entityData.entityType).subscribe((response) => {
            const existingExternalTypeIds = new Set(
              this.dataSourceIdentifier.data.map(item => item.externalIdType));
            const uniqueResults = response.results.filter(
              item => !existingExternalTypeIds.has(item.externalIdType));
            this.saveIdentifier = [...this.dataSourceIdentifier.data, ...uniqueResults];
            this.dataSourceIdentifier = new MatTableDataSource(this.saveIdentifier);
            if (this.dataSourceIdentifier.data.length > 0) {
              this.isIdTable = true;
            }
          }
          );
        }
      },
      (error) => {
        if (error.error.errorCode === "TWAPI0008") {
          this.toastr.warning('Warning', error.error.message);
        }else if (error.error.errorCode ==="TWAPI54"){
          this.toastr.error('Error', error.error.message);
        }
      }
    );
    this.identifierForm.controls.externalIdType.setValue(null);
  }

  generateIdentifier() {
    let idType = this.identifierForm.controls.externalIdType.value;
    if (idType === 'AT-QR') {
      this.generateImage = environment.api_base_url_new + environment.base_value.get_qr_code + '/' + this.entityData.entityId + '?entityType=' + this.entityData.entityType;
      this.isImageGenerated = true;
    } else if (idType === 'AT-BARC') {
      this.generateImage = environment.api_base_url_new + environment.base_value.get_bar_code + '/' + this.entityData.entityId + '?entityType=' + this.entityData.entityType;
      this.isImageGenerated = true;
    }
    setTimeout(() => this.applyContentBasedQr());
  }

  printIdentifier() {
    const printDiv = document.getElementById('print');
    if (!printDiv) return;
    const actualWidth = printDiv.getBoundingClientRect().width;
    const printWindow = window.open('', '', 'height=400,width=800');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
            }

            #print {
              width: ${actualWidth}px !important;
            }

            @page {
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          ${printDiv.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  private getsaveIdentifierValues() {
    return this.form.group({
      externalIdType: [''],
      externalIdValue: [''],
      comments: [''],
      isDeleted: false
    });
  }

  private emitIdentifiers() {
    this.sessionService.setIdentifier(this.saveIdentifier,this.updateIdentifier)
    this.identifierEventAction.emit({
      saveIdentifier: this.saveIdentifier,
      updateIdentifier: this.updateIdentifier
    });
  }

  private applyContentBasedQr() {
    if (!this.safeContentBasedQr) return;
    const printRoot = document.getElementById('print');
    if (!printRoot) return;

    this.isImageLoading = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        const customerName = printRoot.querySelector('#customerName') as HTMLElement | null;
        const qrCodeImg = printRoot.querySelector('#qrCode') as HTMLImageElement | null;
        const identifierName = printRoot.querySelector('#identifierName') as HTMLElement | null;
        const customerImage = printRoot.querySelector('#customerImage') as HTMLImageElement | null;

        const value = this.identifierForm?.controls?.['comments']?.value || '';

        if (identifierName) {
          identifierName.textContent = value;
          identifierName.style.display = value ? 'block' : 'none';
        }

        if (customerName) {
          customerName.textContent = this.customQrText || '';
          customerName.style.display = this.customQrText ? 'block' : 'none';
        }

        const images: HTMLImageElement[] = [];

        if (qrCodeImg && this.generateImage) {
          qrCodeImg.src = this.generateImage;
          images.push(qrCodeImg);
        }

        if (customerImage) {
          images.push(customerImage);
        }

        if (!images.length) {
          this.isImageLoading = false;
          return;
        }

        let loaded = 0;

        const done = () => {
          loaded++;
          if (loaded === images.length) {
            this.isImageLoading = false;
          }
        };

        images.forEach(img => {
          if (img.complete && img.naturalHeight !== 0) {
            done();
          } else {
            img.onload = done;
            img.onerror = done;
          }
        });

      });
    });
  }

  fixClick() {
    console.log('')
  }
}
