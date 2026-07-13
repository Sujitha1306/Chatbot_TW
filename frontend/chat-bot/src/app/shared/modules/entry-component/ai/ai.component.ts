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

import { Component, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ai',
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss']
})
export class AiComponent {
  public aiUrl: SafeResourceUrl;

    constructor(private readonly sanitizer: DomSanitizer, @Optional() public dialogRef: MatDialogRef<AiComponent>) {
        this.aiUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://genai.trackerwave.com/');
        
        dialogRef.keydownEvents().subscribe(result => {
          if (result.key === "Escape") {
            dialogRef.close()
          }
        });
    }
}
