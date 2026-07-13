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

import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { LightboxOnlineMenuDialogComponent } from '../../../../../ovitag/configuration/asset/asset.component';
import { CommonService } from '../../../../services';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss']
})
export class AuditListComponent {
   @Input() entityData: any;
   public  auditSource : any=[];
   public auditdisplayedColumns=[];
   public auditHeaders =[];
   public totalRecords :number;
      constructor(
        public dialog: MatDialog,
        public commonService: CommonService,
      ) {}
    
      ngOnInit(): void {
        if (this.entityData.entityType =='Asset'){
         this.auditHeaders =['Schedule','Type','Department','Audit Date','Performed By','Mode','Comments','Attachments']
         this.auditdisplayedColumns=['auditScheduleName','auditType','department', 'auditDateTime', 'auditedBy', 'mode', 'remarks', 'attachments']
        }else if (this.entityData.entityType =='Location'){
          this.auditHeaders =['Schedule','Type','Location Category','Audit Date','Performed By','Mode','Comments','Attachments']
          this.auditdisplayedColumns =['auditScheduleName','auditType','locationCategoryName', 'auditDateTime', 'auditedBy', 'mode', 'remarks', 'attachments']
        }
        this.getAuditDetails(0, 10);
      }
    
      onPageChange(event: PageEvent) {
        const pageIndex = event.pageIndex;
        const pageSize = event.pageSize;
        this.getAuditDetails(pageIndex, pageSize);
      }
    
      getAuditDetails(pageStart: number, pageSize: number){
        this.commonService.getAssetAudit(this.entityData.entityId,this.entityData.entityType, pageStart, pageSize).subscribe(res =>{
          this.auditSource = res.results;
          this.totalRecords = res.totalRecords;
        });
      }
    
        getFileDownload(element){
          const dialogRef = this.dialog.open(LightboxOnlineMenuDialogComponent,
            { maxWidth: '100vw', width: '100vw', height: '100vh', data: element, panelClass: 'custom-preview-dialog-container', disableClose: true });
          dialogRef.afterClosed().subscribe(result => {
          });
        }
  fixClick() {
    console.log('')
  }  
}
