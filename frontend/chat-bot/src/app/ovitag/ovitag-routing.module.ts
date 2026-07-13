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
import { NgModule,} from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OvitagComponent } from './ovitag.component';
import { AuthGuard } from '../shared';
import { DynamicMenuComponent } from './dynamic-menu/dynamic-menu.component'
import { N8nComponent } from '../shared/modules/entry-component/n8n/n8n.component';

export const routes: Routes = [{
    path: '', component: OvitagComponent, children: [
        { path: 'digital-queue', loadChildren: () => import('./digital-queue/digital-queue.module').then(m => m.DigitalQueueModule), canActivate: [AuthGuard]},
        { path: 'n8n', component : N8nComponent, canActivate: [AuthGuard]},
        { path: 'floor-plan', loadChildren: () => import('./floor-plan/floor-plan.module').then(m => m.FloorPlanModule), canActivate: [AuthGuard]},
        { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard]},
        { path: 'workflow', loadChildren: () => import('./workflow/workflow.module').then(m => m.WorkflowModule), canActivate: [AuthGuard] },
        { path: 'organization', loadChildren: () => import('./hospital/hospital.module').then(m => m.HospitalModule), canActivate: [AuthGuard] },
        { path: 'configuration', loadChildren: () => import('./configuration/configuration.module').then(m => m.ConfigurationModule), canActivate: [AuthGuard] },
        { path: 'analytic-insights', loadChildren: () => import('./report/report.module').then(m => m.ReportModule), canActivate: [AuthGuard] },
        { path: 'dm/:id', component: DynamicMenuComponent, canActivate: [AuthGuard] },
        { path: '', redirectTo: 'dashboard', pathMatch:'prefix'}
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OvitagRoutingModule { }
