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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {connect } from 'mqtt';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../services/common.service';


@Component({
  selector: 'software-update',
  templateUrl: 'software-update.component.html',
})
export class SoftwareUpdateComponent {
  // public cloudConnect:any = environment.cloudNetwork;
  // public cloudConnect: any = JSON.parse(localStorage.getItem(btoa('mqtt')));
  public cloudConnect: any;
  private _client: any;
  public interval;

  // toppings = new FormControl();
  // toppingList: string[] = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];
  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly data: any, public commonService: CommonService,
    private readonly dialogRef: MatDialogRef<SoftwareUpdateComponent>) {
      this.cloudConnect = JSON.parse(commonService._clientMqtt);
  }
  updateSoftware() {
    let publishData = '{"FID" : "' + localStorage.getItem(btoa('facilityId')) + '", "reader": "' + this.data + '", "TYP": "reader", "version": "2.7", "url_path": ""}';
    if ( environment.env_key == 'prod') {
        // this._client = connect(this.cloudConnect[localStorage.getItem(btoa('facilityId'))])
        this._client = connect(this.cloudConnect);
    } else {
        this._client = connect(this.cloudConnect);
    }
    this._client.on('connect', () => {
      console.log(publishData);
      this._client.publish('tw/reader/ota', publishData);
      this.interval = setInterval(val => this.disconnectClient(), 3000);
    });
  }
  disconnectClient() {
    this._client.end(true);
    clearInterval(this.interval);

  }
  onConfirmClick(): void {
    this.dialogRef.close();
  }

}
