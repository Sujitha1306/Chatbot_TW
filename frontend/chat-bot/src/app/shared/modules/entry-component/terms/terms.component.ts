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
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})

export class TermsComponent {

  constructor(private readonly dialog: MatDialog,
    // private fb: FormBuilder,
    // private router: Router,
    // private common: CommonService,
    // private errorService: ErrorService
  ) {
    // this.buildForm();
  }



  termsDialog() {
    this.dialog.open(TermsComponent,
      {
        data: {
        }, panelClass: ['medium-popup'], disableClose: true
      });
    // this.dialog.closeAll();
  }

  public downloadContent() {
    let a = document.body.appendChild(
      document.createElement('a')
    );
    a.download = 'export.html';
    //console.log(document.getElementById("myFrame").innerHTML);
    a.href = 'data:text/html,' + document.getElementById('myFrame').innerHTML;
    a.click();
  }
}

