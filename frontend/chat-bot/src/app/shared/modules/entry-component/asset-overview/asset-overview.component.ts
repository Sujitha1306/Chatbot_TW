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

import { Component, Inject, OnInit, Optional, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { AppToastService } from '../../../services/toaster.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { CommonService } from '../../../services/common.service';
import { WorkflowService } from '../../../services/workflow.service';
import {
  AssetOverviewData, AssetBasicInfo, AssetBadge, MetaField,
  TicketSummary, WorkOrderSummary, MaintenanceItem, CostSummary
} from './asset-overview.model';
import { CreateAssetComponent } from '../../../../ovitag/configuration/asset/asset.component';

@Component({
  selector: 'app-asset-overview',
  templateUrl: './asset-overview.component.html',
  styleUrls: ['./asset-overview.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class AssetOverviewComponent implements OnInit {

  public loading: boolean = false;
  public needsAttention: number = 0;
  public bannerVisible: boolean = true;
  public exporting: boolean = false;
  public asset: any;
  public assetOverviewData: AssetOverviewData;
  public consumedItems: any[] = [];
  public sensorSummaryData: any[] = [];
  @ViewChild('overviewContent') overviewContentRef!: ElementRef;
  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Optional() public dialogRef: MatDialogRef<AssetOverviewComponent>,
    private readonly toastr: AppToastService,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly workflowService: WorkflowService,
    private readonly _dateFormat: DatePipe,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    const id = this.data?.assetId;
    if (id) {
      this.loadAssetOverview(id);
      this.loadConsumedItems(id);
    }
  }

  private loadAssetOverview(assetId: string): void {
    this.loading = true;
    const today = new Date().toISOString().split('T')[0];

    forkJoin({
      assetRes: this.configurationService.getAllAsset(assetId).pipe(catchError(() => of({ results: [] }))),
      maintRes: this.configurationService.getAllManageRoutine('', '', 'Asset', assetId, null).pipe(catchError(() => of({ results: [] }))),
      depRes: this.commonService.getDepreciationSchedule(assetId).pipe(catchError(() => of({ results: [] }))),
      ticketRes: this.workflowService.getEntityTaskNestedView(assetId, 'Asset', 'RQT-TASK', null, null, null).pipe(catchError(() => of({ results: [] }))),
      workOrderRes: this.workflowService.getEntityTaskHistory(assetId, 'PR-AT', 'RQT-WRK', null).pipe(catchError(() => of({ results: [] }))),
      configRes: this.configurationService.getConfigFile('asset-config').pipe(catchError(() => of(null))),
      sensorRes: this.commonService.getAssetSensorSummary(assetId, false, null, 0, 10, today).pipe(catchError(() => of({ results: [] })))
    }).subscribe({
      next: (results) => {
        this.loading = false;
        const rawAsset = results.assetRes?.results?.length > 0 ? results.assetRes.results[0] : results.assetRes;
        this.asset = rawAsset || {};
        const badges: AssetBadge[] = [];
        if (this.asset.assetStatusName) badges.push(new AssetBadge(this.asset.assetStatusName));
        if (this.asset.assetCategoryName) badges.push(new AssetBadge(this.asset.assetCategoryName));

        const installedDate = this.asset.commissionedOn
          ? this._dateFormat.transform(new Date(this.asset.commissionedOn), 'dd/MM/yyyy') || this.asset.commissionedOn
          : '';

        const basicInfo = new AssetBasicInfo(
          this.asset.assetSerialNumber, this.asset.assetName || '', 'inventory_2',
          this.asset.assetStatusName, 'success', badges,
          this.asset.homeLocationName || '', this.asset.manufacturer || '',
          this.asset.modelId || '', this.asset.assetSerialNumber, installedDate,
          this.asset.ownerDepartment,
          this.asset.lastModifiedOn ? this._dateFormat.transform(new Date(this.asset.lastModifiedOn), 'dd/MM/yyyy') || this.asset.lastModifiedOn : ''
        );

        const ticketData = results.ticketRes?.results || [];
        const ticketTotal = results.ticketRes?.totalRecords ?? ticketData.length;
        let ticketCompleted = 0, ticketCancelled = 0, ticketClosed = 0;
        ticketData.forEach((t: any) => {
          const s = (t.statusName || t.status || '').toLowerCase();
          if (s === 'complete' || s === 'completed') ticketCompleted++;
          else if (s === 'cancelled' || s === 'cancel') ticketCancelled++;
          else if (s === 'closed') ticketClosed++;
        });

        const workorderData = results.workOrderRes?.results || [];
        const workOrderTotal = results.workOrderRes?.totalRecords ?? workorderData.length;
        let workOrderCompleted = 0, workOrderCancelled = 0, workOrderClosed = 0;
        workorderData.forEach((w: any) => {
          const s = (w.statusName || w.status || '').toLowerCase();
          if (s === 'complete' || s === 'completed') workOrderCompleted++;
          else if (s === 'cancelled' || s === 'cancel') workOrderCancelled++;
          else if (s === 'closed') workOrderClosed++;
        });

        const tickets = new TicketSummary(ticketTotal, ticketCompleted, ticketCancelled, ticketClosed);
        const workOrders = new WorkOrderSummary(workOrderTotal, workOrderCompleted, workOrderCancelled, workOrderClosed);

        const maintData = results.maintRes?.results || [];
        const maintenance: MaintenanceItem[] = [];
        const now = new Date();
        maintData.forEach((item: any) => {
          const statusName = item.statusName || '';
          const toDate = item.toDate ? new Date(item.toDate) : null;
          let displayStatus = statusName, statusClass = '';
          if (statusName.toLowerCase().includes('complete')) {
            displayStatus = 'Completed'; statusClass = 'ovi-ao-badge-success';
          } else if (toDate && now >= toDate) {
            displayStatus = 'Due'; statusClass = 'ovi-ao-badge-danger';
          } else {
            displayStatus = 'Upcoming'; statusClass = 'ovi-ao-badge-info';
          }
          maintenance.push(new MaintenanceItem(
            item.pfRoutineName || item.routineTypeName || '',
            item.createdByName ? 'Created by: ' + item.createdByName : '',
            displayStatus, statusClass, 'build',
            statusClass.includes('danger') ? '#fde8e8' : statusClass.includes('info') ? '#e0f0fa' : '#e0f5e8',
            statusClass.includes('danger') ? '#d32f2f' : statusClass.includes('info') ? '#1a4fd6' : '#2e7d32',
            item.nextDueDate ? this._dateFormat.transform(new Date(item.nextDueDate), 'dd/MM/yyyy') || item.nextDueDate : ''
          ));
        });

        const scheduleData = Array.isArray(results.depRes) ? results.depRes : (results.depRes?.results || []);
        const config = results.configRes;
        const currencyLabel = config?.currencyLabel?.[0] ?? 'INR';
        const rawAssetCost = this.asset.assetCost ? parseFloat(String(this.asset.assetCost).replace(/,/g, '')) : 0;
        const purchaseValue = rawAssetCost > 0
          ? currencyLabel + ' ' + rawAssetCost.toLocaleString('en-IN')
          : (scheduleData.length > 0 ? currencyLabel + ' ' + (scheduleData[0].bookValue || '0') : '');
        const depTypeName = this.asset.depreciationTypeName || '';
        const depPct = this.asset.depreciationPercent || '';
        const depreciationInfo = depTypeName || depPct ? (depTypeName ? depTypeName : '') + (depPct ? ' @ ' + depPct + '%' : '') : '';
        const usefulLife = this.asset.usefulLife ? this.asset.usefulLife + ' years' : '';
        const costs = new CostSummary(purchaseValue, depreciationInfo, usefulLife);

        const metaFields: MetaField[] = [
          new MetaField('Home Location', this.asset.homeLocationName || ''),
          new MetaField('Tag Serial Number', this.asset.tagSerialNumber || ''),
          new MetaField('Product Serial No', this.asset.productSerialNumber || ''),
          new MetaField('Model No', this.asset.modelId || ''),
          new MetaField('Manufacturer', this.asset.manufacturer || ''),
          new MetaField('Commissioned Date', installedDate),
          new MetaField('Owner Department', this.asset.ownerDepartment || ''),
          new MetaField('Owner', this.asset.ownerName || ''),
          new MetaField('Custodian Department', this.asset.assignedDepartment || ''),
          new MetaField('Custodian', this.asset.assetUserName || '')
        ];

        this.assetOverviewData = new AssetOverviewData(basicInfo, undefined, tickets, workOrders, maintenance, costs, metaFields);
        this.calcNeedsAttention();
        this.sensorSummaryData = results.sensorRes?.results || [];
      },
      error: () => {
        this.loading = false;
        this.assetOverviewData = new AssetOverviewData(
          new AssetBasicInfo(assetId, '', '', '', '', [], '', '', '', '', '', '', ''),
          undefined, undefined, undefined, undefined, undefined, []
        );
      }
    });
  }

  private calcNeedsAttention(){
    if (!this.assetOverviewData?.maintenance) return;
    this.needsAttention = this.assetOverviewData.maintenance.filter(m =>
      m.statusClass?.includes('danger') || m.statusClass?.includes('warning')
    ).length;
  }

  private loadConsumedItems(assetId) {
    this.commonService.getInventoryDetails(assetId).subscribe({
      next: (res) => this.consumedItems = res?.results || [],
      error: () => this.consumedItems = []
    });
  }

  dismissBanner(){ 
    this.bannerVisible = false; 
  }

  onEdit(): void {
    this.navigateToAsset(null);
  }

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  navigateToAsset(selectedTab?) {
    if(selectedTab != null){
      this.asset['selectedTab'] = selectedTab
    }
    localStorage.setItem('user_guide_menu_code', 'MN_FAAS_MD');
    const dialogRef = this.dialog.open(CreateAssetComponent, {
      data: this.asset,
      panelClass: ['large-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      const menu = JSON.parse(localStorage.getItem('currentMenu'))
      localStorage.setItem('user_guide_menu_code', menu[0].code);
    })
  }

  // exportAsPdf(){
  //   this.exporting = true;
  //   const filename ='Asset-Overview-' +(this.assetOverviewData?.basicInfo?.assetId || 'report') +'.pdf';
  //   const contentEl = this.overviewContentRef?.nativeElement;

  //   if (!contentEl) {
  //     this.toastr.error('Export failed', 'Content not found');
  //     this.exporting = false;
  //     return;
  //   }

  //   const clone = contentEl.cloneNode(true) as HTMLElement;

  //   try {
  //     clone.style.width = '1200px';
  //     clone.style.maxWidth = 'none';
  //     clone.style.position = 'absolute';
  //     clone.style.left = '-99999px';
  //     clone.style.top = '0';
  //     clone.style.background = '#f5f4f0';
  //     clone.style.overflow = 'visible';
  //     clone.style.height = 'auto';
  //     clone.style.zIndex = '-1';

  //     // Expand every scrollable container
  //     clone.querySelectorAll('*').forEach((node: Element) => {
  //       const el = node as HTMLElement;
  //       const style = window.getComputedStyle(el);

  //       if (
  //         style.overflow === 'auto' ||
  //         style.overflow === 'scroll' ||
  //         style.overflowY === 'auto' ||
  //         style.overflowY === 'scroll' ||
  //         style.overflowX === 'auto' ||
  //         style.overflowX === 'scroll'
  //       ) {
  //         el.style.overflow = 'visible';
  //         el.style.overflowX = 'visible';
  //         el.style.overflowY = 'visible';
  //         el.style.height = 'auto';
  //         el.style.maxHeight = 'none';
  //       }
  //     });

  //     clone.querySelectorAll(
  //       '.mat-dialog-content,' +
  //       '.mat-tab-body-content,' +
  //       '.mat-tab-body-wrapper,' +
  //       '.cdk-virtual-scroll-viewport,' +
  //       '.mat-drawer-content'
  //     ).forEach((node: Element) => {
  //       const el = node as HTMLElement;
  //       el.style.height = 'auto';
  //       el.style.maxHeight = 'none';
  //       el.style.overflow = 'visible';
  //     });

  //     clone.querySelectorAll('table').forEach((table: Element) => {
  //       const el = table as HTMLElement;
  //       el.style.width = '100%';
  //       el.style.tableLayout = 'auto';
  //     });

  //     clone.querySelectorAll('tr').forEach((row: Element) => {
  //       const el = row as HTMLElement;
  //       el.style.display = 'table-row';
  //       el.style.visibility = 'visible';
  //       el.style.height = 'auto';
  //     });
  //     document.body.appendChild(clone);
  //     setTimeout(() => {
  //       const canvasWidth = clone.scrollWidth;
  //       const canvasHeight = clone.scrollHeight;
  //       html2canvas(clone, {
  //         scale: 2,
  //         useCORS: true,
  //         logging: false,
  //         backgroundColor: '#f5f4f0',
  //         width: canvasWidth,
  //         height: canvasHeight,
  //         windowWidth: canvasWidth,
  //         windowHeight: canvasHeight,
  //         scrollX: 0,
  //         scrollY: 0
  //       })
  //         .then((canvas) => {
  //           const pdf = new jsPDF('p', 'mm', 'a4');
  //           const pageWidth = 210;
  //           const pageHeight = 297;
  //           const margin = 8;
  //           const usableWidth = pageWidth - margin * 2;
  //           const usableHeight = pageHeight - margin * 2;
  //           const pageCanvas = document.createElement('canvas');
  //           const pageCtx = pageCanvas.getContext('2d');

  //           if (!pageCtx) {
  //             throw new Error('Canvas context unavailable');
  //           }
  //           const pageHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth);
  //           let renderedHeight = 0;
  //           let pageNumber = 0;
  //           while (renderedHeight < canvas.height) {
  //             const remainingHeight = canvas.height - renderedHeight;
  //             const currentPageHeight = Math.min(pageHeightPx,remainingHeight);
  //             pageCanvas.width = canvas.width;
  //             pageCanvas.height = currentPageHeight;
  //             pageCtx.clearRect(
  //               0,
  //               0,
  //               pageCanvas.width,
  //               pageCanvas.height
  //             );

  //             pageCtx.drawImage(
  //               canvas,
  //               0,
  //               renderedHeight,
  //               canvas.width,
  //               currentPageHeight,
  //               0,
  //               0,
  //               canvas.width,
  //               currentPageHeight
  //             );

  //             const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
  //             const pageImgHeight = (currentPageHeight * usableWidth) /canvas.width;
  //             if (pageNumber > 0) {
  //               pdf.addPage();
  //             }
  //             pdf.addImage(
  //               pageData,
  //               'JPEG',
  //               margin,
  //               margin,
  //               usableWidth,
  //               pageImgHeight,
  //               undefined,
  //               'FAST'
  //             );
  //             renderedHeight += currentPageHeight;
  //             pageNumber++;
  //           }
  //           pdf.save(filename);
  //           if (document.body.contains(clone)) {
  //             document.body.removeChild(clone);
  //           }
  //           this.toastr.success('Export complete',filename);
  //           this.exporting = false;
  //         })
  //         .catch((err) => {
  //           console.error(err);
  //           if (document.body.contains(clone)) {
  //             document.body.removeChild(clone);
  //           }
  //           this.toastr.error(
  //             'Export failed',
  //             'An error occurred during PDF generation'
  //           );
  //           this.exporting = false;
  //         });
  //     }, 300);
  //   } catch (err) {

  //     if (document.body.contains(clone)) {
  //       document.body.removeChild(clone);
  //     }

  //     this.exporting = false;
  //   }
  exportAsPdf(): void {
    this.exporting = true;

    const filename =
      'Asset-Overview-' +
      (this.assetOverviewData?.basicInfo?.assetId || 'report') +
      '.pdf';

    const contentEl = this.overviewContentRef?.nativeElement;

    if (!contentEl) {
      this.toastr.error('Export failed', 'Content not found');
      this.exporting = false;
      return;
    }

    const masterClone = contentEl.cloneNode(true) as HTMLElement;

    try {
      masterClone.style.width = '1200px';
      masterClone.style.maxWidth = 'none';
      masterClone.style.position = 'absolute';
      masterClone.style.left = '-99999px';
      masterClone.style.top = '0';
      masterClone.style.background = '#f5f4f0';
      masterClone.style.height = 'auto';
      masterClone.style.overflow = 'visible';
      masterClone.style.zIndex = '-1';

      masterClone.querySelectorAll('*').forEach((node: Element) => {
        const el = node as HTMLElement;
        const style = window.getComputedStyle(el);

        if (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflowX === 'auto' ||
          style.overflowX === 'scroll'
        ) {
          el.style.overflow = 'visible';
          el.style.overflowX = 'visible';
          el.style.overflowY = 'visible';
          el.style.height = 'auto';
          el.style.maxHeight = 'none';
        }
      });

      masterClone.querySelectorAll(
        '.mat-dialog-content,' +
        '.mat-tab-body-content,' +
        '.mat-tab-body-wrapper,' +
        '.cdk-virtual-scroll-viewport,' +
        '.mat-drawer-content'
      ).forEach((node: Element) => {
        const el = node as HTMLElement;
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
      });

      document.body.appendChild(masterClone);

      setTimeout(async () => {
        try {
          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 8;

          const usableWidth = pageWidth - margin * 2;
          const usableHeight = pageHeight - margin * 2;

          const pxPerMm = 1200 / usableWidth;
          const pageHeightPx = Math.floor(usableHeight * pxPerMm);
          const totalHeight = masterClone.scrollHeight;
          const pageCount = Math.ceil(totalHeight / pageHeightPx);

          const scrollContainer = document.createElement('div');
          while (masterClone.firstChild) {
            scrollContainer.appendChild(masterClone.firstChild);
          }
          masterClone.appendChild(scrollContainer);

          masterClone.style.overflow = 'hidden';
          masterClone.style.height = pageHeightPx + 'px';

          const pdf = new jsPDF('p', 'mm', 'a4');

          for (let i = 0; i < pageCount; i++) {
            scrollContainer.style.marginTop = (-i * pageHeightPx) + 'px';

            void masterClone.offsetHeight;

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const canvas = await html2canvas(masterClone, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#f5f4f0'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * usableWidth) / canvas.width;

            if (i > 0) {
              pdf.addPage();
            }

            pdf.addImage(
              imgData,
              'PNG',
              margin,
              margin,
              usableWidth,
              imgHeight,
              undefined,
              'FAST'
            );
          }

          pdf.save(filename);

          this.toastr.success('Export complete', filename);
        } catch (err) {
          console.error(err);
          this.toastr.error(
            'Export failed',
            'An error occurred during PDF generation'
          );
        } finally {
          if (document.body.contains(masterClone)) {
            document.body.removeChild(masterClone);
          }
          this.exporting = false;
        }
      }, 300);
    } catch (err) {
      console.error(err);

      if (document.body.contains(masterClone)) {
        document.body.removeChild(masterClone);
      }

      this.exporting = false;
    }
  }
}
