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
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { EntryComponentModule } from '../../shared/modules/entry-component/entry-component.module';
import { MaterialModule } from '../../shared';
import { NgxGaugeModule } from 'ngx-gauge';
import { NgChartsModule } from 'ng2-charts';
import { DigitalQueueComponent, RegisterPatientComponent} from './digital-queue.component';
import { DigitalQueueRoutingModule } from './digital-queue-routing.module';
import { ListMenuComponent} from './list-menu/list-menu.component';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import { WorklistComponent } from './worklist/worklist.component';
import { SharedDirectivesModule } from '../../shared/directive/shared-directives.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { TranslateModule } from '@ngx-translate/core';
import { ShareModule } from '../../shared/shared.module';
@NgModule({
  imports: [
    TranslateModule,
    DigitalQueueRoutingModule,
    NgChartsModule,
    NgxGaugeModule,
    MaterialModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatCardModule,
    EntryComponentModule.forRoot(),
    SharedPipesModule.forRoot(),
    SharedDirectivesModule.forRoot(),
    WorkflowModule,
    ShareModule
  ],
  declarations: [
    DigitalQueueComponent,
    RegisterPatientComponent,
    ListMenuComponent,
    WorklistComponent
    ],
})
export class DigitalQueueModule { }
