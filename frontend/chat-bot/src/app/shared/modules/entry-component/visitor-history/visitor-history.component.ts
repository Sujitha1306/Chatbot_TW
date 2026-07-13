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
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-visitor-history',
  templateUrl: './visitor-history.component.html',
  styleUrls: ['./visitor-history.component.scss']
})
export class VisitorHistoryComponent {
  public tableDataHistory : any =[];
  public applyFilterValue: any;
 public filterKey = new FormControl();

 constructor(public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,) {
    }

headerEventAction(event) {
  if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
  }else {
      this.applyFilterValue = null;
  }
}



applyFilter(filterValue: string) {
  filterValue = filterValue.trim();
  filterValue = filterValue.toLowerCase();
  this.applyFilterValue = filterValue
}
}