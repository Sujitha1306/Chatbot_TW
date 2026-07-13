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
import { MaterialModule } from './../shared';
import { SharedPipesModule } from './../shared/pipes/shared-pipes.module';

import { LocationDialogComponent, RoomDisplayComponent } from './room-display.component';
import { RoomDisplayRoutingModule } from './room-display-routing.module';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EntryComponentModule } from './../shared/modules/entry-component/entry-component.module';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ShareModule } from '../shared/shared.module';
import { SharedDirectivesModule } from '../shared/directive/shared-directives.module';


@NgModule({
  imports: [
    RoomDisplayRoutingModule,
    CommonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    EntryComponentModule,
    SharedPipesModule.forRoot(),    
    TranslateModule,
    ShareModule,     
    SharedDirectivesModule
  ],
  declarations: [
    RoomDisplayComponent, LocationDialogComponent
    ],
})
export class RoomDisplayModule { }
