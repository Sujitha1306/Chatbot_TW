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
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent ,ForgotPasswordComponent} from './login.component';
import { MaterialModule } from '../shared';
import {ErrorMsgComponent} from './error-msg/error-msg.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EntryComponentModule } from './../shared/modules/entry-component/entry-component.module';
import {SharedPipesModule} from '../shared/pipes/shared-pipes.module';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { environment } from '../../environments/environment';
import { NgxCaptchaModule } from '@binssoft/ngx-captcha';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MfaComponent } from './mfa/mfa.component';

@NgModule({
    imports: [
      TranslateModule,
      MaterialModule,
      MatProgressSpinnerModule,
      FormsModule, ReactiveFormsModule,
      CommonModule, LoginRoutingModule,
      RecaptchaV3Module,
      NgxCaptchaModule,
      QRCodeModule,
      EntryComponentModule.forRoot(),
      SharedPipesModule.forRoot(),
    ],
    declarations: [
      LoginComponent,
      ErrorMsgComponent,
      ForgotPasswordComponent,
      MfaComponent,
           ],
    providers: [{
    provide: RECAPTCHA_V3_SITE_KEY,
    useValue: environment.sk,
  }],
  
})
export class LoginModule {}
