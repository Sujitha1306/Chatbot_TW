import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PwaComponent } from './pwa.component';
import { AuthGuard } from '../shared';
import { NavBarComponent } from '../shared/modules/entry-component/nav-bar/nav-bar.component';
import { MobilescannerComponent } from '../ovitag/configuration/mobilescanner/mobilescanner.component';
import { ProfileComponent } from '../shared/modules/entry-component/profile/profile.component';
import { DynamicMenuComponent } from '../ovitag/dynamic-menu/dynamic-menu.component';
import { PwaAssetComponent } from '../shared/modules/entry-component/pwa/pwa-asset/pwa-asset.component';
import { PwaTaskComponent } from '../shared/modules/entry-component/pwa/pwa-task/pwa-task.component';
import { GatePassComponent } from '../shared/modules/entry-component/gate-pass/gate-pass.component';
import { PwaNotificationComponent } from '../shared/modules/entry-component/pwa/pwa-notification/pwa-notification.component';
import { EasyTaskComponent } from '../shared/modules/entry-component/pwa/easy-task/easy-task.component';
import { PwaRequestComponent } from '../shared/modules/entry-component/pwa/pwa-request/pwa-request.component';
import { PwaPatientComponent } from '../shared/modules/entry-component/pwa/pwa-patient/pwa-patient.component';
import { PwaPatientTranGDAServicesComponent } from '../shared/modules/entry-component/pwa/pwa-patient-tran-gda-services/pwa-patient-tran-gda-services.component';

const routes: Routes = [{
  path: '', component: PwaComponent, children: [
    {
      path: "main",
      component: NavBarComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "profile",
      component: ProfileComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "qr-scan",
      component: MobilescannerComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "action",
      component: PwaPatientTranGDAServicesComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "task",
      component: NavBarComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "easy-task",
      component: EasyTaskComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "porter-request",
      component: DynamicMenuComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "pwa-asset",
      component: PwaAssetComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "pwa-task",
      component: PwaTaskComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "gate-pass",
      component: GatePassComponent,
      canActivate: [AuthGuard]
    },
      {
      path: "pwa-notification",
      component: PwaNotificationComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "request",
      component: PwaRequestComponent,
      canActivate: [AuthGuard]
    },
    {
      path: "wheelchair-request",
      component: PwaPatientComponent,
      canActivate: [AuthGuard]
    },
    { path: '', redirectTo: 'main', pathMatch:'prefix'}
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PwaRoutingModule { }
