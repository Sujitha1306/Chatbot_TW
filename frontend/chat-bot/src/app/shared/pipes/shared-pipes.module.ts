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
import { SearchImagePipe } from './search-image.pipe';
import { SecureImagePipe } from './secure-image.pipe';
import { AgeFormatPipe, DateFormatPipe } from './date-format.pipe';
import { SafeUrlSanitizerPipe } from './safe-url.pipe';
import { NumberFormatPipe } from './number-format.pipe';
import {CurrencyFormatPipe} from './currency-format.pipe';
import { MaskDataPipe } from './mask-data.pipe';
import {MaskPipe, SplitCapitalPipe} from './mask.pipe';
import { AgeToYrsPipe } from './age-to-yrs.pipe';
import { TimeAgoPipe } from './timeFormat.pipe';
import { SmartCapitalizePipe } from './smart-capital.pipe';
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [SearchImagePipe, SecureImagePipe, DateFormatPipe, AgeFormatPipe, SafeUrlSanitizerPipe, NumberFormatPipe, CurrencyFormatPipe, MaskDataPipe, MaskPipe, SplitCapitalPipe, AgeToYrsPipe, TimeAgoPipe, SmartCapitalizePipe],
    exports: [SearchImagePipe, SecureImagePipe, DateFormatPipe, AgeFormatPipe, NumberFormatPipe, CurrencyFormatPipe,MaskDataPipe,MaskPipe, SplitCapitalPipe, AgeToYrsPipe, TimeAgoPipe, SmartCapitalizePipe]
})
export class SharedPipesModule {

    static forRoot(): ModuleWithProviders<SharedPipesModule> {
        return {
            ngModule: SharedPipesModule,
            providers: [],
        };
    } }
