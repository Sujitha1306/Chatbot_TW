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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WebRoutingModule } from './web-routing.module';
import { WebComponent } from './web.component';
import { MaterialModule } from '../shared';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EntryComponentModule } from './../shared/modules/entry-component/entry-component.module';
import {SharedPipesModule} from '../shared/pipes/shared-pipes.module';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { environment } from '../../environments/environment';
import { NgxCaptchaModule } from '@binssoft/ngx-captcha';
import { TranslateModule } from '@ngx-translate/core';
import { SharedDirectivesModule } from '../shared/directive/shared-directives.module';

@NgModule({
    imports: [
      TranslateModule,
      MaterialModule,
      MatProgressSpinnerModule,
      FormsModule, ReactiveFormsModule,
      CommonModule, WebRoutingModule,
      RecaptchaV3Module,
      NgxCaptchaModule,
      EntryComponentModule.forRoot(),
      SharedPipesModule.forRoot(),
      TranslateModule,
      SharedDirectivesModule
    ],
    declarations: [
      WebComponent,
      
    ],
    providers: [{
    provide: RECAPTCHA_V3_SITE_KEY,
    useValue: environment.sk,
  }],
  
})
export class WebModule {}
