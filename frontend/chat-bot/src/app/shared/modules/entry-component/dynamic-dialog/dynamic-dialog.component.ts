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

import { Component, ViewChild, ViewContainerRef, Inject, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AssetComponent } from '../../../../ovitag/configuration/asset/asset.component';

@Component({
  selector: 'app-dynamic-dialog',
  templateUrl: './dynamic-dialog.component.html',
  styleUrls: ['./dynamic-dialog.component.scss']
})
export class DynamicDialogComponent implements AfterViewInit {
  public headerName = "";
  @ViewChild('dynamicContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

  componentMap: { [key: string]: any } = {
    'AssetListView': AssetComponent
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngAfterViewInit(): void {
    const popup = this.data?.popup;
    this.headerName = this.data?.popupData?.headerName;
    const componentToLoad = this.componentMap[popup];
    if (componentToLoad) {
      this.container.clear();
      const componentRef =  this.container.createComponent(componentToLoad);
    }
  }
}
