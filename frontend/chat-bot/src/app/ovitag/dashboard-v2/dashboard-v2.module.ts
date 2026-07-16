import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardV2RoutingModule } from './dashboard-v2-routing.module';
import { DashboardV2Component } from './dashboard-v2.component';
import { DashboardV2EmpModule } from './dashboard-v2-emp/dashboard-v2-emp.module';

@NgModule({
  imports: [
    CommonModule,
    DashboardV2RoutingModule,
    DashboardV2EmpModule,
  ],
  declarations: [
    DashboardV2Component,
  ]
})
export class DashboardV2Module {}
