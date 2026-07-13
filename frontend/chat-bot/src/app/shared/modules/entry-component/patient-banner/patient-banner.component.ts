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
import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { FormBuilder, } from '@angular/forms';

@Component({
  selector: 'app-patient-banner',
  templateUrl: './patient-banner.component.html',
  styleUrls: ['./patient-banner.component.scss'],
})
export class PatientBannerComponent implements OnInit {
 @Input() patientDetail;
    detail: any;

  constructor(private readonly commonService: CommonService, private readonly form: FormBuilder) {

  }

  ngOnInit() {
      this.detail = this.patientDetail;
  }
}
