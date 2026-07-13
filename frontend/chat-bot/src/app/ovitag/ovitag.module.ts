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
import { OvitagComponent } from './ovitag.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import { OvitagRoutingModule } from './ovitag-routing.module';
import { CoreModule } from '../core/core.module';
import { SidemenuModule } from '../shared/modules/entry-component/sidemenu/sidemenu.module';
import { SidebarMenuModule } from '../shared/modules/entry-component/sidebar-menu/sidebar-menu.module';
import { EntryComponentModule } from '../shared/modules/entry-component/entry-component.module';
import { FormsModule } from '@angular/forms';
import { SharedDirectivesModule } from '../shared/directive/shared-directives.module';
import { UserMenuModule } from '../shared/modules/entry-component/user-menu/user-menu.module';
import { DynamicMenuComponent } from './dynamic-menu/dynamic-menu.component'
import { TranslateModule } from '@ngx-translate/core';
import { NewSidebarMenuModule } from '../shared/modules/entry-component/new-sidebarMenu/new-sidebarMenu.module';
import { SidebarV3Module } from '../shared/modules/entry-component/sidebar-v3/sidebar-v3.module';
@NgModule({
    imports: [
        MatTooltipModule,
        CommonModule,
        OvitagRoutingModule,
        MatToolbarModule,
        SidemenuModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        CoreModule,
        MatSidenavModule,
        SidebarMenuModule,
        EntryComponentModule.forRoot(),
        FormsModule,
        SharedDirectivesModule,
        UserMenuModule,TranslateModule,
        NewSidebarMenuModule,
        SidebarV3Module,
    ],
    declarations: [OvitagComponent, DynamicMenuComponent],
   
})
export class OvitagModule { }
