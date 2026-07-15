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
 * system, without the permission in writing from Trackerwave Pvt Ltd.
 * ======================================================================================================
 ******************************************************************************/

import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigurationService } from '../../../services';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-bulk-identifier-export',
  templateUrl: './bulk-identifier-export.component.html',
  styleUrls: ['./bulk-identifier-export.component.scss'],
  standalone: false
})
export class BulkIdentifierExportComponent implements OnInit {
  type = 'qr';
  entityType = 'Asset';
  items = [];
  title = '';
  isPdfLoading = false;
  isImageLoading = false;
  position = 'bottom';
  printComments = true;
  customQrText = null;
  isBorder = false;
  safeContentBasedQr = null;
  @ViewChild('printContainer') printContainer: ElementRef;
  private rawItems = [];

  constructor(
    private sanitizer: DomSanitizer,
    private configurationServices: ConfigurationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<BulkIdentifierExportComponent>
  ) {
    this.type = data?.type || this.type;
    this.entityType = data?.entityType || this.entityType;
    this.title = data?.title || this.title;
    this.rawItems = this.normalizeRawItems(data);
  }

  ngOnInit() {
    if (!this.rawItems.length) return;
    this.isImageLoading = true;
    const ids = this.rawItems.map(r => r.id?.toString());
    const codeType = this.type === 'qr' ? 'QR_CODE' : 'BAR_CODE';
    forkJoin([
      this.configurationServices.generateBulkQrBarcode(ids, 'Asset', codeType),
      this.configurationServices.getConfigFile('qr-bar-config').pipe(
        catchError(() => of(null))
      )
    ]).subscribe({
      next: async ([_, configRes]) => {
        if (configRes?.results?.contentObject) {
          const config = configRes.results.contentObject;
          this.position = config.qr['text-allign'];
          this.printComments = config.hasOwnProperty('isPrintComments') ? config.isPrintComments : true;
          this.customQrText = config.qr['qrText'] || null;
          this.isBorder = config.qr['isBorder'] || false;
          const rawContent = config.qr['content'] || null;
          if (rawContent != null) {
            const processed = await this.replaceImgSrcWithDataUrl(rawContent);
            this.safeContentBasedQr = this.sanitizer.bypassSecurityTrustHtml(processed);
          }
        }
        this.setItems();
      },
      error: () => { this.isImageLoading = false; }
    });
  }

  private async setItems() {
    const baseUrl = this.type === 'qr'
      ? environment.api_base_url_new + environment.base_value.get_qr_code
      : environment.api_base_url_new + environment.base_value.get_bar_code;
    const items = await Promise.all( this.rawItems.map(async r => {
        const url = `${baseUrl}/${r.id}?entityType=${this.entityType}`;
        try {
          const dataUrl = await this.loadAsDataUrl(url);
          return { id: r.id, label: r.label, comments: r.comments, generateImage: dataUrl };
        } catch {
          return { id: r.id, label: r.label, comments: r.comments, generateImage: url };
        }
      })
    );
    this.items = items;
    if (this.safeContentBasedQr && this.isQrType()) {
      this.applyContentBasedQrAll();
    } else {
      this.isImageLoading = false;
    }
  }

  isQrType() {
    return this.type === 'qr';
  }

  private normalizeRawItems(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: item.assetId ?? item.id,
        label: item.assetName ?? item.label ?? '',
        comments: item.assetSerialNumber ?? ''
      }));
    }
    if (data.ids) {
      return data.ids.map((id: any) => ({ id: id.toString(), label: '', comments: '' }));
    }
    if (data.items) {
      return data.items.map((item: any) => ({
        id: item.assetId ?? item.id,
        label: item.assetName ?? item.label ?? '',
        comments: item.comments ?? item.assetSerialNumber ?? ''
      }));
    }
    const singleId = data.assetId ?? data.id;
    if (singleId != null) {
      return [{
        id: singleId.toString(),
        label: data.assetName ?? data.label ?? '',
        comments: data.comments ?? data.assetSerialNumber ?? ''
      }];
    }
    return [];
  }

  private async replaceImgSrcWithDataUrl(html): Promise<string> {
    const urls: string[] = [];
    const regex = /<img[^>]+src="(https?:\/\/[^"]+)"[^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (!urls.includes(match[1])) urls.push(match[1]);
    }
    if (!urls.length) return html;
    const replacements = await Promise.all(urls.map(async (url) => {
      try {
        const dataUrl = await this.loadAsDataUrl(url);
        return { from: url, to: dataUrl };
      } catch {
        return null;
      }
    }));
    let result = html;
    for (const r of replacements) {
      if (r) result = result.split(r.from).join(r.to);
    }
    return result;
  }

  private loadAsDataUrl(url): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = () => reject(new Error());
      img.src = url;
    });
  }

  private applyContentBasedQrAll() {
    if (!this.safeContentBasedQr || !this.items?.length) return;
    this.isImageLoading = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let allImages: HTMLImageElement[] = [];
        this.items.forEach((item, index) => {
          const printDiv = document.getElementById('print' + index) as HTMLElement | null;
          if (!printDiv) return;
          const qrCodeImg = printDiv.querySelector('#qrCode') as HTMLImageElement | null;
          const identifierName = printDiv.querySelector('#identifierName') as HTMLElement | null;
          const customerName = printDiv.querySelector('#customerName') as HTMLElement | null;
          const customerImage = printDiv.querySelector('#customerImage') as HTMLImageElement | null;
          if (identifierName) {
            identifierName.textContent = item.comments || '';
            identifierName.style.display = item.comments ? 'block' : 'none';
          }
          if (customerName) {
            customerName.textContent = this.customQrText || '';
            customerName.style.display = this.customQrText ? 'block' : 'none';
          }
          if (qrCodeImg && item.generateImage) {
            qrCodeImg.src = item.generateImage;
            allImages.push(qrCodeImg);
          }
          if (customerImage) allImages.push(customerImage);
        });
        if (!allImages.length) {
          this.isImageLoading = false;
          return;
        }
        let loaded = 0;
        const done = () => {
          loaded++;
          if (loaded === allImages.length) this.isImageLoading = false;
        };
        allImages.forEach(img => {
          if (img.complete && img.naturalHeight !== 0) done();
          else { img.onload = done; img.onerror = done; }
        });
      });
    });
  }

  downloadPdf() {
    this.isPdfLoading = true;
    const element = this.printContainer?.nativeElement;
    if (!element) {
      this.isPdfLoading = false;
      return;
    }
    html2canvas(element, { useCORS: true, scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = imgWidth > imgHeight ? imgWidth : imgHeight;
      const pdfHeight = imgWidth > imgHeight ? imgHeight : imgWidth;
      const orientation = imgWidth > imgHeight ? 'l' : 'p';
      const doc = new jsPDF(orientation, 'px', [pdfWidth, pdfHeight]);
      doc.addImage(imgData, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
      doc.save(this.title || 'bulk-identifier-export');
      this.isPdfLoading = false;
    }).catch(() => { this.isPdfLoading = false; });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  trackById(id, item){
    return item.id;
  }
}
