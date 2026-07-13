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
 import {Component,OnInit,Inject, Optional} from "@angular/core";
 import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
 import { DatePipe } from "@angular/common";
 import { environment } from '../../../../../environments/environment';
 import { CommonService, HospitalService } from "../../../services";
import { FormBuilder } from "@angular/forms";
import { forkJoin } from "rxjs/internal/observable/forkJoin";
import { finalize } from "rxjs/internal/operators/finalize";
import { AppToastService } from "../../../services/toaster.service";
  
  @Component({
    selector: "app-gate-pass",
    templateUrl: "./gate-pass.component.html",
    styleUrls: ["./gate-pass.component.scss"],
  })
  export class GatePassComponent implements OnInit {  
      
    today = Date.now();
    public date:any;
    public time:any;
    public customerId = localStorage.getItem('customerId');
    public customerLogo = null;  
    displayedColumns: string[] = ['assetSerialNumber','assetName', 'assetType', 'transferType'];
    dataSourceIdentifier = new MatTableDataSource<any>();
    public tableData = [];
    public comments = '';
    public customerValue: string;
    public regionValue: string;
    public facilityValue: string;
    public hospitalName = '';
    public id :number;
    linkedAssetDataSource: any=[];
    assetTransferSource:any=[];
    assetDisplayedColumns: string[]=['assetSerialNumber', 'assetName','assetType','assetTransferStatus'];
    public temporaryData =[];
    temporaryDisplayedColumns =['assetSerialNumber','assetName','assetType','costType','ownedBy','assignedBy']
    temporaryAsset=new MatTableDataSource<any>();
    public temporaryDetails =[];
    temporaryBasicColumns=['status','commissionedDate','retiredDate']
    temporaryBasicDetails=new MatTableDataSource<any>();
    statusForm: any;
    customerName: string;
    facilityName: string;
    isPrint: boolean = false;
    loading=false;
   
    constructor( public toastr: AppToastService,
    public dialog: MatDialog,
    @Optional() public thisDialogRef: MatDialogRef<GatePassComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dateFormat: DatePipe,
    private readonly hospitalService: HospitalService,
    private readonly commonService: CommonService,
    public form: FormBuilder)  {}

  ngOnInit() {
      if(this.data) {
        this.getBasicDetails()
      }
    }
    getBasicDetails() {
      this.loading=true;
      this.buildform();
      this.id =this.data.id;
      this.date = this.dateFormat.transform(this.today, 'dd-MM-yyyy');
      this.time = this.dateFormat.transform(this.today, 'h:mm a');
      this.customerLogo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + this.customerId;
      this.tableData.push({assetSerialNumber:this.data.assetSerialNumber, assetName: this.data.assetName, assetType: this.data.assetTypeName, transferType: this.data.assetTransferTypeName});
      this.dataSourceIdentifier = new MatTableDataSource(this.tableData);
      this.temporaryData.push({assetSerialNumber:this.data.assetSerialNumber, assetName: this.data.assetName, assetType: this.data.assetTypeName, costType: this.data.costTypeName,ownedBy: this.data.ownerDepartment, assignedBy: this.data.assignedDepartment})
      this.temporaryAsset=new MatTableDataSource(this.temporaryData);
      this.comments = this.data.comments;
      this.customerValue = localStorage.getItem('customerId');
      this.regionValue = localStorage.getItem('regionId');
      this.facilityValue = localStorage.getItem(btoa('facilityId'));
      this.getHospitalName();
      const tempDetail = {
        status: this.data.assetTransferTypeId === 'ATT-AT' ? 'OnBoard' :'Returned',
        commissionedDate: this.data.assetTransferTypeId === 'ATT-AT' ? this.dateFormat.transform(this.today, 'dd-MM-yyyy') : this.dateFormat.transform(this.data.commissionedOn, 'dd-MM-yyyy'),
        retiredDate: this.data.assetTransferTypeId ===  'ATT-ON'  ? this.dateFormat.transform(this.today, 'dd-MM-yyyy'): null
      };
      
      this.temporaryDetails.push(tempDetail);
      this.temporaryBasicDetails = new MatTableDataSource(this.temporaryDetails);

    }

    getLinkedAssetDetails(){
      this.loading= true;
      this.commonService.getLinkedAssets(this.data.id).subscribe(res => {
        this.linkedAssetDataSource =res.results;
        this.loading=false;
      });
    }
    getHospitalName(){
      this.loading = true;
        forkJoin({
          cust: this.hospitalService.getCustomerList(),
          reg: this.hospitalService.getRegionList(this.customerValue),
          fac: this.hospitalService.getFacilityList(this.regionValue)
        }).pipe(finalize(() => this.loading = false)).subscribe(({cust, reg, fac}) => {
             let customerList = cust.results;
             let regionList = reg.results;
             let facilityList = fac.results;
              const customer = customerList.filter(res => res.id === this.customerValue);
              const region = regionList.filter(res => res.id === this.regionValue);
              const facility = facilityList.filter(res => res.id === this.facilityValue);
              this.hospitalName = (customer.length ? customer[0].name + ', ' : '') + (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '');
              this.customerName = (customer.length ? customer[0].name : '') 
              this.facilityName = (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '')
        });
      this.loading = false;
    }
    printPass(){
        this.isPrint = true
        let printContent = document.getElementById('printData').innerHTML;
        let printWindow = window.open('', '', 'height=600,width=800'); 
        printWindow.document.write(`<html><head><style>@page { size: auto;margin:3mm; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } @media print {.no-print { display: none !important; } }</style></head><body>${printContent}</body></html>`);
        printWindow.document.title = 'Gate Pass'
        setTimeout(() => {
          printWindow.print();
          this.isPrint = false
        }, 1000);
        printWindow.document.close();
    }

    buildform(){
      this.statusForm = this.form.group({
        status:[this.data.assetTransferTypeId === 'ATT-AT' ? 'OnBoard' :'Returned' ],
        commissionedDate:[this.data.assetTransferTypeId === 'ATT-AT'  ? this.dateFormat.transform(this.today, 'dd-MM-yyyy') : this.dateFormat.transform(this.data.commissionedOn, 'dd-MM-yyyy')],
        retiredDate:[ this.data.assetTransferTypeId === 'ATT-ON'? this.dateFormat.transform(this.today, 'dd-MM-yyyy'):null]
      });
    }
    
    savePass() {
      const today = this.dateFormat.transform(this.today, 'yyyy-MM-dd');
      let data;
      if (this.data.isTemp && this.data.assetTransferTypeId ===  'ATT-ON'){
          data = {
            assetTransferType: "ATT-RET",
            eventId: "ATT-TGPS",
            id: this.data.id,
            retiredDate:today,
            status: "Returned",
          };
      }else if(this.data.isTemp){
          data = {
              "assetTransferType": "ATT-ON",
              "eventId": "ATT-TGPS",
              "eventStatusId":"ATT-GACK",
              "id":this.data.id,
              "commissionedOn":  today,
              "status": "OnBoard"
        }
      } else {
      data = {
      assetTransferType: this.data.assetTransferTypeId,
      eventId: "ATT-GAPS",
      eventStatusId: "ATE-GISD",
      id: this.id,
      isExcludeParent: false,
      transferType: this.data.transferType,
      sourceIdentifier:this.data.sourceIdentifier,
      destinationIdentifier:this.data.destinationIdentifier,
      linkedAssets: this.linkedAssetDataSource.map(asset => ({
        childAssetSerialNumber : asset.childAssetSerialNumber,
        childAssetId: asset.assetId,
        childAssetName: asset.assetName,
        childAssetTypeId: asset.assetTypeId,
        childAssetTypeName: asset.assetType,
        isDeleted: false, 
        isNewlyLinked: false, 
        parentId: this.id
      })),
    };
  }
   this.commonService.assetTransfer(data).subscribe(res => {
    this.toastr.success('Success', `${res.message}`);
     }, error => {
    this.toastr.error('Error', `${error.error.message}`);
     });
     this.thisDialogRef.close('confirm');
   }

   authorizeGatePass(){
      this.commonService.getAssetTransfer(this.id, 0, 50).subscribe(res => {
        if (res.statusCode !== 1) {
          return;
        }
          this.assetTransferSource = res.results.reverse();
          if (this.assetTransferSource.length === 0) {
            return;
          }
            const firstRecord = this.assetTransferSource[0];
              const data = {
                assetTransferType:this.data.assetTransferTypeId,
                eventId: "ATT-GAPS",
                eventStatusId: firstRecord.eventStatusId == 'ATE-GISD'? "ATE-GEXP" :"ATE-GENP",
                id: this.id,
                isExcludeParent: false,
                linkedAssets: [],
                transferType: this.data.transferType,
                sourceIdentifier:this.data.sourceIdentifier,
                destinationIdentifier:this.data.destinationIdentifier
              };
              this.commonService.assetTransfer(data).subscribe(
                res => {
                  this.toastr.success('Success', `${res.message}`);
                },
                error => {
                  this.toastr.error('Error', `${error.error.message}`);
               });
               this.thisDialogRef.close('confirm');
      })
   }
   }
