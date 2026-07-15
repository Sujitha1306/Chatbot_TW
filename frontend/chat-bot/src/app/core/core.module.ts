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
import { MaterialModule } from './../shared/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import {MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ToolbarNotificationComponent } from './toolbar-notification/toolbar-notification.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { NavbarComponent } from './navbar/navbar.component'
import { SidebarComponent } from './sidebar/sidebar.component';
import { MainmenuComponent } from './mainmenu/mainmenu.component';
import { SharedDirectivesModule } from './../shared/directive/shared-directives.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EntryComponentModule } from './../shared';
import { GlobalNotificationComponent, TimeAgoPipe } from './global-notification/global-notification.component';
import { NotificationCameraViewComponent } from './global-notification/notification-camera-view/notification-camera-view.component';
import { TranslateModule } from '@ngx-translate/core';
import { ChatBotModule } from '../chat-bot/chat-bot.module';


@NgModule({
    declarations: [
        
        ToolbarNotificationComponent,
        ToolbarComponent,
        NavbarComponent,
        SidebarComponent,
        MainmenuComponent,
        GlobalNotificationComponent,
        TimeAgoPipe,
        NotificationCameraViewComponent
    ],
    imports: [
        TranslateModule,
        EntryComponentModule.forRoot(),
        SharedDirectivesModule.forRoot(),
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatListModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatChipsModule,
        RouterModule,
        FlexLayoutModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatSidenavModule,
        MatTabsModule,
        MatCardModule,
        MatSliderModule,
        MatProgressBarModule,
        MaterialModule,
        ChatBotModule
    ],
    exports: [
        
        ToolbarNotificationComponent,
        ToolbarComponent,
        NavbarComponent,
        SidebarComponent,
        TimeAgoPipe
    ]
})
export class CoreModule { }
