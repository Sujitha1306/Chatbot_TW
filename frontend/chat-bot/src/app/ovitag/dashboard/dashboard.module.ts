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
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { EntryComponentModule } from './../../shared/modules/entry-component/entry-component.module';
import { MaterialModule } from '../../shared';
import { NgxGaugeModule } from 'ngx-gauge';
import { NgChartsModule } from 'ng2-charts';
import {SharedPipesModule} from '../../shared/pipes/shared-pipes.module';
import { DashboardEmpComponent } from './dashboard-emp/dashboard-emp.component';
import { GridsterModule } from 'angular-gridster2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardV2EmpModule } from '../dashboard-v2/dashboard-v2-emp/dashboard-v2-emp.module';
import { ReportModule } from '../report/report.module';

@NgModule({
  imports: [
    TranslateModule,
    NgChartsModule,
    NgxGaugeModule,
    MaterialModule,
    CommonModule,
    DashboardRoutingModule,
    FlexLayoutModule,
    MatCardModule,
    GridsterModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardV2EmpModule,
    EntryComponentModule.forRoot(),
    SharedPipesModule.forRoot(),
    ReportModule
  ],
  declarations: [
    DashboardComponent,
    DashboardEmpComponent
    ]
})
export class DashboardModule { }
