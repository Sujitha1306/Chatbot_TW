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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import {CdkTableModule} from '@angular/cdk/table';
import {CdkTreeModule} from '@angular/cdk/tree';
import {CdkDetailRowDirective} from './manage-facility/cdk-detail-row.directive';

import {MatTreeModule} from '@angular/material/tree';
import { HospitalRoutingModule } from './hospital-routing.module';
import { HospitalComponent } from './hospital.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { MaterialModule } from '../../shared/common';
import { SidemenuModule } from '../../shared/modules/entry-component/sidemenu/sidemenu.module';
import { ManageFacilityComponent} from './manage-facility/manage-facility.component';
import {ImportSettingComponent} from './import-setting/import-setting.component';
import { SupportTicketComponent} from './support/support-ticket.component';


import { NodePointsGenerator  } from './location/nodepoint-generator/nodepoint-generator.component';
import { ManageLocationComponent } from './location/manage-location/manage-location.component'
import { BillComponent } from './bill/bill.component';
import { LocationComponent } from './location/location.component';

import {SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import { EntryComponentModule, NgxMaterialTimepickerModule } from './../../shared';
import { SharedDirectivesModule } from '../../shared/directive/shared-directives.module';
import { CreateSupportTicketComponent } from './support/create-support-ticket/create-support-ticket.component';
import { CreateCustomerComponent } from './manage-facility/create-customer/create-customer.component';
import { EditCustomerComponent } from './manage-facility/edit-customer/edit-customer.component';
import { ManageLocationViewComponent } from './location/manage-location/manage-location-view/manage-location-view.component';
import { TwTableModule } from '../../shared/modules/entry-component/tw-table/tw-table.module';
import { TwHeaderModule } from '../../shared/modules/entry-component/tw-header/tw-header.module';
import { TranslateModule } from '@ngx-translate/core';
import { ShareModule } from '../../shared/shared.module';
import { FloorPlanModule } from '../floor-plan/floor-plan.module';
import { UserScheduleComponent } from './user-schedule/user-schedule.component';
import { ManagePatientComponent } from './manage-patient/manage-patient.component';
import { TwDataTableModule } from '../../shared/modules/entry-component/tw-data-table/tw-data-table.module';
import { ChatBotModule } from '../../chat-bot/chat-bot.module';



@NgModule({
    imports: [
        EntryComponentModule.forRoot(),
        MatTreeModule,
        CommonModule,
        HospitalRoutingModule,
        SidemenuModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        CdkTableModule,
        CdkTreeModule,
        NgxMaterialTimepickerModule,
        SharedPipesModule.forRoot(),
        SharedDirectivesModule.forRoot(),
        TwTableModule,
        TwDataTableModule,
        TwHeaderModule,
        TranslateModule,
        ShareModule,
        FloorPlanModule,
        ChatBotModule
    ],
   
    declarations: [ NodePointsGenerator,
    LocationComponent,
    HospitalComponent, UserManagementComponent,
    ManageFacilityComponent,
    ImportSettingComponent,
    SupportTicketComponent,
    CreateCustomerComponent,
    EditCustomerComponent,
    CdkDetailRowDirective,
    ManageLocationComponent,
    BillComponent,
    CreateSupportTicketComponent,
    ManageLocationViewComponent,
    UserScheduleComponent,
    ManagePatientComponent,
    ],

    exports:[TwTableModule, TwHeaderModule],
})
export class HospitalModule { }
