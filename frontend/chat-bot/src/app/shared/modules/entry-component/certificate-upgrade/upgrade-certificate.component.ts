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
import { Component, } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'upgrade-certificate',
    templateUrl: './upgrade-certificate.component.html',
    styleUrls: ['./upgrade-certificate.component.scss'],
  })
  export class UpgradeCertificateComponent {
    public fileName = "No file Choosen";
    public isEnable = false;
  
    constructor(public dialog: MatDialog,) { }
  

  
    uploadFile(event) {
      if(event.target.files.length !== 0) {
        this.fileName = event.target.files[0].name;
        this.isEnable = true;
      } else {
        this.fileName = "No file Choosen";
        this.isEnable = false;
      }
    }
  
    updateCert() {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['confirmation-popup'], disableClose: true,
        data: {
          title: 'Certificate Update', message: 'selected certificate shall be uploaded to all selected Readers and Gateways. Are you sure?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'isRemark': 1, 'certificateUpdate': true,
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.isEnable = false;
        }
      });
    }
  }