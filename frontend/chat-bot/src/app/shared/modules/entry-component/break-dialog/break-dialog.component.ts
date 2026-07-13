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

import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../../services';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-break-dialog',
  templateUrl: './break-dialog.component.html',
  styleUrls: ['./break-dialog.component.scss']
})
export class BreakDialogComponent  {

  public durationList = [{code:'10min',value:10},{code:'15min',value:15},{code:'20min',value:20},{code:'25min',value:25},{code:'30min',value:30},{code:'45min',value:45},{code:'60min',value:60}];
  public breakForm: FormGroup;
  public duration: any = new FormControl(15);
  public breakType: any = new FormControl('BKT-BRK');
  constructor(public thisDialogRef: MatDialogRef<BreakDialogComponent>,public fb: FormBuilder,public dialog: MatDialog,@Inject(MAT_DIALOG_DATA) public data: any,public commonService: CommonService, public toastr: AppToastService) { 
  }




  addBreak(){
    const postBreakData = {
      "breakDuration": Number(this.duration.value),
      "breakType": this.breakType.value,
      "tagId": this.data.tagId,
      "userId": this.data.id
    };
    this.commonService.addBreak(postBreakData).subscribe(res => {
      if (res.statusCode === 1) { 
        this.toastr.success('Success', `${res.message}`); 
      }
      this.thisDialogRef.close('confirm');
    })
  }
}
