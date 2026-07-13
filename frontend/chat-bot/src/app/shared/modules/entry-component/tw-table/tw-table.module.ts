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
import { TwTableComponent } from './tw-table.component';
import { SharedDirectivesModule } from '../../../directive/shared-directives.module';
import { SharedPipesModule } from '../../../pipes/shared-pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgChartsModule } from 'ng2-charts';



@NgModule({

    declarations: [
        TwTableComponent
    ],

    imports: [
        CommonModule,
        MaterialModule,
        NgChartsModule,
        RouterModule,
        FlexLayoutModule, 
        SharedDirectivesModule,
        SharedPipesModule.forRoot(),
        TranslateModule
    ],

    exports: [
        TwTableComponent, 
        SharedDirectivesModule
    ],
       
})
export class TwTableModule { }
