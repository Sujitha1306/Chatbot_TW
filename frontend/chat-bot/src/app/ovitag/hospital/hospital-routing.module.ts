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
import { RouterModule, Routes } from '@angular/router';
import { HospitalComponent } from './hospital.component';
import { UserManagementComponent, UserManagementResolver } from './user-management/user-management.component';
import { ManageFacilityComponent, ManageFacilityResolver } from './manage-facility/manage-facility.component';
import { ImportSettingComponent } from './import-setting/import-setting.component';
import { BillComponent } from './bill/bill.component';
import { SupportResolver, SupportTicketComponent } from './support/support-ticket.component';
import { AuthGuard } from '../../shared';
import { LocationComponent, LocationsResolver } from './location/location.component';
import { TwMeetingComponent } from '../../shared/modules/entry-component/tw-meeting/tw-meeting.component';
import { FloorPlanComponent } from '../floor-plan/floor-plan.component';
import { ThreeMapComponent } from '../../shared/modules/entry-component/three-map/three-map.component';
import { IndoorPathComponent } from '../../shared/modules/entry-component/three-map/components/indoor-path/indoor-path.component';
import { LiveTrackingComponent } from '../../shared/modules/entry-component/three-map/components/live-tracking/live-tracking.component';
import { UserScheduleComponent } from './user-schedule/user-schedule.component';
import { ManagePatientComponent } from './manage-patient/manage-patient.component';
import { ChatLayoutComponent } from '../../chat-bot/chat/chat-layout/chat-layout.component';
import { ChatThreadComponent } from '../../chat-bot/chat/chat-thread/chat-thread.component';



export const routes: Routes = [{
    path: '', component: HospitalComponent, children: [
        {
            path: '',
            component: ManageFacilityComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'manage-facility',
            component: ManageFacilityComponent,
            canActivate: [AuthGuard],
            resolve: { manageFacilitys:  ManageFacilityResolver}
        },
        {
            path: 'user-management',
            component: UserManagementComponent,
            canActivate: [AuthGuard],
            resolve: { userManagements: UserManagementResolver }
        },
        {
            path: 'import-setting',
            component: ImportSettingComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'location',
            component: LocationComponent,
            canActivate: [AuthGuard],
            resolve: { locations: LocationsResolver }
        },
        {
            path: 'billing',
            component: BillComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'consumable',
            component: FloorPlanComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'floorplan',
            component: FloorPlanComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'floor-plan',
            component: FloorPlanComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'indoor-nav',
            component: FloorPlanComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'support',
            component: SupportTicketComponent,
            canActivate: [AuthGuard],
            resolve: { supports:  SupportResolver}
        },
        {
            path: 'meeting',
            component: TwMeetingComponent,
            canActivate: [AuthGuard]
        },
       {
            path: 'three-map',
            component: ThreeMapComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'indoor-path',
            component: IndoorPathComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'live-tracking',
            component: LiveTrackingComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'user-schedule',
            component: UserScheduleComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'manage-patient',
            component: ManagePatientComponent,
            canActivate: [AuthGuard]
        },
        {
            path: 'chat-bot-AI',
            component: ChatLayoutComponent,
            canActivate: [AuthGuard],
            children: [
                { path: '', component: ChatThreadComponent },
                { path: ':conversationId', component: ChatThreadComponent },
            ]
        },
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class HospitalRoutingModule { }
