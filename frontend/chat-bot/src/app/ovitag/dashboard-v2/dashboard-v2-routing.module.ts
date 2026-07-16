import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../shared';
import { DashboardV2Component } from './dashboard-v2.component';
import { DashboardV2EmpComponent } from './dashboard-v2-emp/dashboard-v2-emp.component';

const routes: Routes = [{
  path: '', component: DashboardV2Component,
  children: [
    { path: '', component: DashboardV2EmpComponent, canActivate: [AuthGuard] }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardV2RoutingModule {}
