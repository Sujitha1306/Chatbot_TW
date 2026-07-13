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
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../../../common/material.module';
import { ViewProfileComponent, ChangePasswordComponent, AddProfileComponent } from './user-menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedDirectivesModule } from '../../../directive/shared-directives.module';
import { TranslateModule } from '@ngx-translate/core';
import { ShareModule } from '../../../shared.module';



@NgModule({

    declarations: [
        
        ViewProfileComponent,
        ChangePasswordComponent,
        AddProfileComponent
    ],

    imports: [
        CommonModule,
        MaterialModule,
        RouterModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        SharedDirectivesModule,
        TranslateModule,
        ShareModule,
    ],

    exports: [
        
        AddProfileComponent,
        ViewProfileComponent,
        ChangePasswordComponent
    ],
  
})
export class UserMenuModule { }
