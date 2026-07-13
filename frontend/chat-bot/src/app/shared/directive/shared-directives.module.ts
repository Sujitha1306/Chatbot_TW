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
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebounceClickDirective } from './debounce-click.directive';
import { TooltipDirective } from './tooltip.directive';
import { ResizableDirective } from './resizable.directive';
import { CustomDatePickerComponent } from './custom-date-picker.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WindowResizeDirective } from './window-resize.directive';
import { TypeHitDirective } from './type-hit.directive';
import { KeyupDirectiveService } from './keyup-directive.service';
import { CountUpDirective } from './count-up.directive';
import { MatSelectSearchDirective } from './app-select-search.directive';
import { AutoCompleteDirective } from './auto-complete.directive';

@NgModule({
    imports: [
        CommonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule
    ],
    declarations: [DebounceClickDirective, CustomDatePickerComponent,WindowResizeDirective,TypeHitDirective,KeyupDirectiveService,TooltipDirective, ResizableDirective, CountUpDirective,MatSelectSearchDirective, AutoCompleteDirective],
    exports: [DebounceClickDirective, CustomDatePickerComponent,WindowResizeDirective,TypeHitDirective,KeyupDirectiveService,TooltipDirective, ResizableDirective, CountUpDirective,MatSelectSearchDirective, AutoCompleteDirective]
})
export class SharedDirectivesModule {

    static forRoot(): ModuleWithProviders<SharedDirectivesModule> {
        return {
            ngModule: SharedDirectivesModule,
            providers: [ MatDatepickerModule ],
        };
    }
}
