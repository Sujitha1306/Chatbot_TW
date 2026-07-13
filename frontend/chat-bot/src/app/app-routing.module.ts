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
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared';
import { NotFoundComponent } from './static/not-found/not-found.component';
import { AppComponent } from './app.component';
const routes: Routes = [
  // { path: '', loadChildren: './login/login.module#LoginModule', canActivate: [AuthGuard] },
  // { path: 'leaflet', loadChildren: './login/login.module#LoginModule' },
  // { path: 'not-found', loadChildren: './not-found/not-found.module#NotFoundModule' },
  { path: '', component: AppComponent, canActivate: [AuthGuard] },
  { path: 'pwa', loadChildren: () => import('./web/web.module').then(m => m.WebModule), canActivate: [AuthGuard]},
  { path: 'room-display', loadChildren: () => import('./room-display/room-display.module').then(m => m.RoomDisplayModule), canActivate: [AuthGuard]},
  { path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
  { path: 'ovitag', loadChildren: () => import('./ovitag/ovitag.module').then(m => m.OvitagModule), canActivate: [AuthGuard] },
  { path: 'web', loadChildren: () => import('./pwa/pwa.module').then(m => m.PwaModule), canActivate: [AuthGuard] },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', redirectTo: 'not-found', pathMatch: 'prefix'},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
