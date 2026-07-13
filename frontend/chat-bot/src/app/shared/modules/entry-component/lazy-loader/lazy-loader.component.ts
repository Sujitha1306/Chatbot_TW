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
import { ErrorStateMatcherService } from '../../../services/error-state-matcher.service';

@Component({
    selector: 'lazy-loader',
    templateUrl: './lazy-loader.component.html',
    styleUrls: ['./lazy-loader.component.scss'],
  })

  
export class LazyLoader {
  public matcher = new ErrorStateMatcherService();
   @Input() loading: any;
 
   constructor() {}



}
 