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
import { Component,  Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-maintenance-viewmore',
  templateUrl: './maintenance-viewmore.component.html',
  styleUrls: ['./maintenance-viewmore.component.scss']
})
export class MaintenanceViewmoreComponent {

  public status: any = [];
  public count: any = [];
  public showTable = false;
  public table : any = [];
  public page = false;

  constructor(@Inject(MAT_DIALOG_DATA) private readonly data: any,
  private readonly dialogRef: MatDialogRef<MaintenanceViewmoreComponent>) {
    if (data) {
      let key = Object.keys(data[0]).toString();
      let label = Object.keys(data[0]);
      if(label.length > 1){
        this.status = label;
        this.table = data;
        this.showTable = true;
        this.page = true;
      } else {
        this.status = Object.keys(data[0][key]);
        this.table.push(this.data[0][key]);
        this.showTable = true;
        this.page = false;
      }  
    }

  }



}
