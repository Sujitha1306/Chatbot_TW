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
import { Component, OnInit, Input, ViewChild, Injectable } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog, } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HospitalService, CommonService } from '../../../shared';
import { CdkDetailRowDirective } from './cdk-detail-row.directive';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router, ActivatedRoute, Resolve} from '@angular/router';
import { ConfirmationDialog } from './../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { locale_Json_Details } from '../../../../localeJson/localeJson';
import { Observable } from 'rxjs';
import { CreateCustomerComponent } from './create-customer/create-customer.component';
import { EditCustomerComponent } from './edit-customer/edit-customer.component';

@Injectable()
export class ManageFacilityResolver implements Resolve<Observable<any>> {
  constructor( private readonly hospitalService: HospitalService) {}

  resolve(): Observable<any> {
    return  this.hospitalService.getAllCustomers();
  }
}

@Component({
  selector: 'app-manage-facility',
  templateUrl: './manage-facility.component.html',
  styleUrls: ['./manage-facility.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('*', style({ height: '*', visibility: 'visible' })),
      transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ManageFacilityComponent implements OnInit { 
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedData = [
    { 'colName': 'name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'billAddress', 'title': 'Bill Address', 'dataName': 'billAddress' },
    { 'colName': 'gstIn', 'title': 'GST No', 'dataName': 'gsTin' },
    { 'colName': 'licensePack', 'title': 'License Pack', 'dataName': 'licencePack' },
    { 'colName': 'status', 'title': 'Status', 'dataName': 'isActive' }
  ];
  displayedColumns = this.displayedData.map(res => res.colName);
  dataSource = new MatTableDataSource();

  public activate_btn: any = [];
  public selectedRow: any = null;
  public getcustomerDetail: any = [];
  public maxHeight: any;
  public customerId: any = null;
  public customerData: Array<any> = [];
  public applyFilterValue: any;
  private openedRow: CdkDetailRowDirective;
  headercolor : string;
  bgcolor: string;
  pagebgcolor: string;
  isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');
  @Input() singleChildRowDetail: boolean;
  height: number;
  width: number;
  tooltipOver: string;

  constructor(private readonly dialog: MatDialog, private readonly hospitalService: HospitalService,
    public commonService: CommonService, private readonly router: Router,private readonly route: ActivatedRoute) {
      this.activate_btn = this.commonService.getActivePermission('button');

      let data  = this.route.snapshot.data.manageFacilitys;
      this.facilityPermission(data);
      if(this.activate_btn && (this.activate_btn.indexOf('BT_ALLE') > -1 || this.activate_btn.indexOf('BT_HPMFE') > -1)){
        const locale = localStorage.getItem(btoa('lang'))
      if(locale === 'en-US' || locale === 'en'){
        this.tooltipOver = locale_Json_Details.en.doubleClickToolTip;
      } else if(locale === 'ar'){
        this.tooltipOver = locale_Json_Details.ar.doubleClickToolTip;
      }
      }
  }
  
  ngOnInit() {
    if (parseInt(localStorage.getItem('userlevel')) > 2) {
        this.router.navigate(['/ovitag/organization/location-management']);
    }
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
    
  }

  getAllCustomers(){
   this.hospitalService.getAllCustomers().subscribe(res => {
    this.facilityPermission(res)
    });
  }
  facilityPermission(res){
    const isAdmin = localStorage.getItem('userlevel');
      if (isAdmin == '1') {
        this.dataSource = new MatTableDataSource<any>(res.results);
        if(this.applyFilterValue != null){
          this.dataSource.filter = this.applyFilterValue;
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.customerData = res.results;
      } else {
        const custDetail = res.results.filter(res => res.id == localStorage.getItem('customerId'));
        const userLevel = localStorage.getItem('userlevel');
        if (parseInt(userLevel) > 2) {
          custDetail[0].children = custDetail[0].children.filter(res => res.id == localStorage.getItem('regionId'));
          custDetail[0].children[0].children = custDetail[0].children[0].children.filter(res => res.id == localStorage.getItem(btoa('facilityId')));
          this.dataSource = new MatTableDataSource<any>(custDetail);
          if(this.applyFilterValue != null){
            this.dataSource.filter = this.applyFilterValue;
          }
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.customerData = res.results;
        } else {
          this.dataSource = new MatTableDataSource<any>(custDetail);
          if(this.applyFilterValue != null){
            this.dataSource.filter = this.applyFilterValue;
          }
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.customerData = res.results;
        }
      }
  }
  rowClick(row) {
    if (this.selectedRow && row.id == this.selectedRow.id) {
      this.selectedRow = null;
    } else {
      this.selectedRow = row;
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.applyFilterValue = filterValue;
    this.dataSource.filter = filterValue;
  }
  onToggleChange(cdkDetailRow: CdkDetailRowDirective, row): void {
    if (this.singleChildRowDetail && this.openedRow?.expended) {
      this.openedRow.toggle();
    }
    if (!row.close) {
      row.close = true;
    } else {
      row.close = false;
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }
  deleteRow(custId) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      data: {
        title: 'Confirmation', message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.selectedRow = null;
      if (result == 'Yes') {
        this.hospitalService.deleteCustomer(custId).subscribe(res => {
          if (res.statusCode == 1) {
            this.getAllCustomers();
          }
        });
      }
    });
  }

  downloadPDF() {

    const columns = [
      { title: 'ID', dataKey: 'id' },
      { title: 'Name', dataKey: 'name' },
      { title: 'Address', dataKey: 'regAddress' }
    ];

    
    const doc1 = new jsPDF('p', 'pt');
    doc1.autoTable(columns, this.customerData, {
      styles: { fillColor: [100, 255, 255] },
      columnStyles: {
      },
      margin: { top: 60 },
      addPageContent: function (data) {
        doc1.text('Customer Details', 40, 30);
      }
    });
    doc1.save('table.pdf');
  }
  modifyCustomer(type, rowData: any) {
    let dialogRef = null;
    if (type == 'edit') {
      dialogRef = this.dialog.open(EditCustomerComponent, {
      data: rowData, panelClass: ['small-popup'], disableClose: true });
    } else {
      dialogRef = this.dialog.open(CreateCustomerComponent, {
      data: rowData, panelClass: ['small-popup'], disableClose: true });
    }
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.getAllCustomers();
      }
    });
    this.selectedRow = null;
  }
  fixClick() {
    console.log('')
  }
}

