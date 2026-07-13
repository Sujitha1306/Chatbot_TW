import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeviceComponent } from '../device/device.component';
import { CommonService, ConfigurationService } from '../../../../services';
import { EditAssetComponent } from '../edit-asset/edit-asset.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { PwaTicketComponent } from '../pwa-ticket/pwa-ticket.component';
import { PwaMaintenanceComponent } from '../pwa-maintenance/pwa-maintenance.component';
import { PwaDocumentManagementComponent } from '../pwa-document-management/pwa-document-management.component';
import { PwaFormManagementComponent } from '../pwa-form-management/pwa-form-management.component';

@Component({
  selector: 'app-manage-pwa-asset',
  templateUrl: './manage-pwa-asset.component.html',
  styleUrls: ['./manage-pwa-asset.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ManagePwaAssetComponent implements OnInit {
  selectedAction= 'info';
  assetData =null;
  pagestart= 0;
  pagesize = 50;
  auditData = null;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<ManagePwaAssetComponent>,
    public dialog: MatDialog,
    public configurationService: ConfigurationService,
    public commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data: any,private readonly bottomSheet: MatBottomSheet
  ) {}

  ngOnInit(): void {
    if(this.data?.assetId){
    this.getAssetDetails(this.data?.assetId)
    }else{
      this.loading = true;
      this.commonService.getAssetSerialNumList(this.data?.serialNo).subscribe(res => {
      if (res.results && res.results.length > 0) {
        this.assetData = res.results[0];
        this.data.assetId = this.assetData?.id;
      }else{
        this.assetData = null;
      }
      this.loading = false;
    })
    }
  }
  
  getAssetDetails(id){
    this.loading = true;
      this.configurationService.getAllAsset(id).subscribe(res => {
        if (res.results && res.results.length > 0) {
          this.assetData = res.results[0];
        }else{
          this.assetData = null;
        }
      this.loading = false;
    })
  }

  onActionClick(event): void {
    this.selectedAction = null;
    this.selectedAction = event;
    if(this.selectedAction === 'rule'){
      this.getAuditDetails();
    }else if(this.selectedAction === 'list'){
    let entityData = {entityType: 'Asset',entityId: this.data?.assetId,entityData:this.assetData,'entityGroupTypeId':'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-AT'};
    const dialogRef =this.dialog.open(PwaTicketComponent, {
      data: entityData,
      height:'100%', width:'100%', maxWidth: '100%',  
    });
    dialogRef.afterClosed().subscribe((result) => {
      // this.selectedAction = 'info';
    });
    }else if(this.selectedAction === 'Schedule'){
    let entityData = {entityType: 'Asset',entityId: this.data?.assetId,entityData:this.assetData,'entityGroupTypeId':'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-AT'};
    const dialogRef =this.dialog.open(PwaMaintenanceComponent, {
      data: entityData,
      height:'100%', width:'100%', maxWidth: '100%',  
    });
    dialogRef.afterClosed().subscribe((result) => {
      // this.selectedAction = 'info';
    });
    }else if(this.selectedAction === 'Documents'){
    let entityData = {entityType: 'Asset',entityId: this.data?.assetId,entityData:this.assetData,'entityGroupTypeId':'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-AT'};
    const dialogRef =this.dialog.open(PwaDocumentManagementComponent, {
      data: entityData,
      height:'100%', width:'100%', maxWidth: '100%',  
    });
    dialogRef.afterClosed().subscribe((result) => {
      // this.selectedAction = 'info';
    });
    }else if(this.selectedAction === 'Forms'){
    let entityData = {entityType: 'Asset',entityId: this.data?.assetId,entityData:this.assetData,'entityGroupTypeId':'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-AT'};
    const dialogRef =this.dialog.open(PwaFormManagementComponent, {
      data: entityData,
      height:'100%', width:'100%', maxWidth: '100%',  
    });
    dialogRef.afterClosed().subscribe((result) => {
      // this.selectedAction = 'info';
    });
   }
  }

  getAuditDetails(){
    this.loading = true;
    this.commonService.getAssetAudit(this.data.assetId,'Asset',this.pagestart,this.pagesize).subscribe(res => {
      this.auditData = res.results;
      this.loading = false;
    })
  }

  updateAsset(){
    const dialogRef = this.dialog.open(EditAssetComponent, {
      data: this.assetData,
      panelClass:'custom-bottom-wrapper'
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getAssetDetails(this.data?.assetId)
      this.selectedAction = 'info';
    });
  }

  onCoasterClick(){
    return
    let coasterData = {type: 'Asset', tagSerialNumber: this.assetData.tagSerialNumber,name: this.assetData.assetName,workflowTypeId: 'TAT-AS',associationId: this.assetData.id};
    const dialogRef =this.dialog.open(DeviceComponent, {
      data: coasterData,
      panelClass: 'device-popup-container',
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
  fixClick() {
    console.log('')
  }
}
