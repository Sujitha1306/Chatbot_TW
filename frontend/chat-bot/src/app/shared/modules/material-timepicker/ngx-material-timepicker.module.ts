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
import {ModuleWithProviders, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxMaterialTimepickerComponent} from './ngx-material-timepicker.component';
import {StyleSanitizerPipe} from './pipes/style-sanitizer.pipe';
import {NgxMaterialTimepickerMinutesFaceComponent} from './components/timepicker-minutes-face/ngx-material-timepicker-minutes-face.component';
import {NgxMaterialTimepickerService} from './services/ngx-material-timepicker.service';
import {NgxMaterialTimepickerFaceComponent} from './components/timepicker-face/ngx-material-timepicker-face.component';
import {TimeFormatterPipe} from './pipes/time-formatter.pipe';
import {NgxMaterialTimepickerButtonComponent} from './components/timepicker-button/ngx-material-timepicker-button.component';
import {TimepickerDirective} from './directives/ngx-timepicker.directive';
import {OverlayDirective} from './directives/overlay.directive';
import {NgxMaterialTimepickerEventService} from './services/ngx-material-timepicker-event.service';
import {FocusAnchorDirective} from './directives/focus-anchor.directive';
import {NgxMaterialTimepickerToggleComponent} from './components/timepicker-toggle-button/ngx-material-timepicker-toggle.component';
import {NgxMaterialTimepickerToggleIconDirective} from './directives/ngx-material-timepicker-toggle-icon.directive';
import {NgxMaterialTimepicker12HoursFaceComponent} from './components/timepicker-12-hours-face/ngx-material-timepicker-12-hours-face.component';
import {NgxMaterialTimepicker24HoursFaceComponent} from './components/timepicker-24-hours-face/ngx-material-timepicker-24-hours-face.component';

@NgModule({
    imports: [
        CommonModule
    ],
    exports: [
        NgxMaterialTimepickerComponent,
        NgxMaterialTimepickerToggleComponent,
        TimepickerDirective,
        NgxMaterialTimepickerToggleIconDirective
    ],
    declarations: [
        NgxMaterialTimepickerComponent,
        NgxMaterialTimepicker24HoursFaceComponent,
        NgxMaterialTimepicker12HoursFaceComponent,
        NgxMaterialTimepickerMinutesFaceComponent,
        NgxMaterialTimepickerFaceComponent,
        NgxMaterialTimepickerToggleComponent,
        StyleSanitizerPipe,
        TimeFormatterPipe,
        NgxMaterialTimepickerButtonComponent,
        TimepickerDirective,
        OverlayDirective,
        FocusAnchorDirective,
        NgxMaterialTimepickerToggleIconDirective
    ]
})
export class NgxMaterialTimepickerModule {
    static forRoot(): ModuleWithProviders<NgxMaterialTimepickerModule> {
        return {
            ngModule: NgxMaterialTimepickerModule,
            providers: [NgxMaterialTimepickerService, NgxMaterialTimepickerEventService]
        };
    }
}
