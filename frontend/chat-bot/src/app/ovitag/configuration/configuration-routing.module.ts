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
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ConfigurationComponent } from "./configuration.component";
import { AssetComponent } from "./asset/asset.component";
import { GatewayNewComponent } from "./gateway-new/gateway-new.component";
import { HealthcheckComponent } from "./healthcheck/healthcheck.component";
import { ReaderComponent } from "./reader/reader.component";
import { TagsComponent } from "./tags/tags.component";
import { RuleComponent } from "./rule/rule.component";
import { AlertConfigComponent } from "./alert-config/alert-config.component";
import { WidgetComponent } from './widget-management/widget.component';
import { WidgetsComponent } from './widget/widget.component';
import  {LayoutComponent } from './layout/layout.component';
import { FormManagementComponent } from './form-management/form-management.component';
import { PackageComponent } from "./package/package.component";
import { LocationMappingComponent } from "./location-mapping/location-mapping.component";
import { DailyManagementComponent } from "./daily-management/daily-management.component";
import { HealthTestComponent } from "./health-test/health-test.component";
import { AuthGuard } from "../../shared";
import { ResourceComponent } from "./resource/resource.component";
import { ActivitiesComponent } from "./activities/activities.component";
import { RoutineComponent } from "./routine-management/routine.component";
import { ConfigComponent } from "./config/config.component";
import {
  AssetResolver,
  GatewayResolver,
  ReaderResolver,
  DeviceResolver,
  HealthTestResolver,
  DailyManagementResolver,
  LocationMappingResolver,
  PackageResolver,
  RoutineResolver,
  ActiviteResolver,
  AlertResolver,
  RuleResolver,
  HealthCheckResolver,
  GatewayManagementResolver,
  AppTermResolver,
  FormManagementResolver,
  DataItemResolver,
  WidgetsResolver,
  WidgetNewResolver,
  LayoutsResolver,
  BrokerResolver,
  PoeInjectorResolver,
  ServerResolver,
  ConfigResolver,
  AlertManagementComponentResolver,
  PermissionGroupResolver
} from "../../shared/services/configuration.resolver";
import { GatewayComponent } from "./gateway/gateway.component";
import { SchedulerComponent } from "./scheduler/scheduler.component";
import { DataItemComponent } from "./data-item/data-item.component";
import { AppTermsComponent } from "./app-terms/app-terms.component";
import { BarCodeComponent } from "./bar-code/bar-code.component";
import { BrokerComponent } from "./broker/broker.component";
import { PoeInjectorComponent } from "./poe-injector/poe-injector.component";
import { ServerComponent } from "./server-management/server.component";
import { AlertManagementComponent } from "../../shared/modules/entry-component/alert-management/alert-management.component";
import { HolidayComponent } from "./holiday/holiday.component";
import { HolidaySchedulerComponent } from "./holiday-scheduler/holiday-scheduler.component";
import { PermissionComponent } from "./permission/permission.component";
import { RoleManagementComponent } from "./role-management/role-management.component";
import { OtProcedureComponent } from "./ot-procedure/ot-procedure/ot-procedure.component";
import { DepartmentInfoComponent } from "./department-info/department-info.component";
import { ResourceTemplateComponent } from "./resource-template/resource-template.component";
import { SetResourceComponent } from "./set-resource/set-resource.component";
import { ManageEntityGroupComponent } from "./entitygroup-management/manage-entity-group/manage-entity-group.component";
import { KPIComponent} from "./kpi/kpi.component";
import { EntityAssociationComponent } from "./entity-association/entity-association.component";
import { PermissionManagementComponent } from "./permission-management/permission-management.component";
import { ApplicationManagementComponent } from "./application-management/application-management.component";
import { AuditManagementComponent } from "./audit-management/audit-management.component";
import { ActivityRuleComponent } from "./activity-rule/activity-rule.component";
import { DoorControllerComponent } from "./door-controller/door-controller.component";
import { ChannelTemplateComponent } from "./channel-template/channel-template.component";
import { PfModelsComponent } from "./pf-models/pf-models.component";
import { ApiKeyComponent } from "./api-key/api-key.component";
import { UserPreferencesComponent } from "./user-preferences/user-preferences.component";
import { ShiftMasterComponent } from "./shift-master/shift-master.component";
import { UserGuideComponent } from "./user-guide/user-guide.component";
import { MapCropComponent } from "../../shared/modules/entry-component/map-crop/map-crop.component";

export const routes: Routes = [
  {
    path: "",
    component: ConfigurationComponent,
    children: [
      { path: "", component: GatewayComponent, canActivate: [AuthGuard] },
      //   { path: '', component:  GatewayComponent },
      {
        path: "gateway",
        component: GatewayComponent,
        canActivate: [AuthGuard],
        resolve: { gateways: GatewayResolver },
      },
      {
        path: "gateway-management",
        component: GatewayNewComponent,
        canActivate: [AuthGuard],
        resolve: { gatewayManagement: GatewayManagementResolver },
      },
      {
        path: "broker",
        component: BrokerComponent,
        canActivate: [AuthGuard],
        resolve: { broker: BrokerResolver },
      },
      {
        path: "poe-injector",
        component: PoeInjectorComponent,
        canActivate: [AuthGuard],
        resolve: { poeInjector: PoeInjectorResolver },
      },
      {
        path: "server-management",
        component: ServerComponent,
        canActivate: [AuthGuard],
        resolve: { server: ServerResolver },
      },
      {
        path: "healthcheck",
        component: HealthcheckComponent,
        canActivate: [AuthGuard],
        resolve: { healthchecks: HealthCheckResolver },
      },
      {
        path: "reader",
        component: ReaderComponent,
        canActivate: [AuthGuard],
        resolve: { readers: ReaderResolver },
      },
      {
        path: "device",
        component: TagsComponent,
        canActivate: [AuthGuard],
        resolve: { devices: DeviceResolver },
      },
      {
        path: "asset",
        component: AssetComponent,
        canActivate: [AuthGuard],
        resolve: { assets: AssetResolver },
      },
      {
        path: "config",
        component: ConfigComponent,
        canActivate: [AuthGuard],
        resolve: {config: ConfigResolver},
      },
      {
        path: "rule",
        component: RuleComponent,
        canActivate: [AuthGuard],
        resolve: { rules: RuleResolver },
      },
      {
        path: "alert",
        component: AlertConfigComponent,
        canActivate: [AuthGuard],
        resolve: { alerts: AlertResolver },
      },
      {
        path: "appterms",
        component: AppTermsComponent,
        canActivate: [AuthGuard],
        resolve: { appTerms: AppTermResolver }
      },
      {
        path: "layout",
        component: LayoutComponent,
        canActivate: [AuthGuard],
        resolve: { layouts: LayoutsResolver }
      },
      {
        path: "form-management",
        component: FormManagementComponent,
        canActivate: [AuthGuard],
        resolve: { formManagement: FormManagementResolver }
      },
      {
        path: "dataitem",
        component: DataItemComponent,
        canActivate: [AuthGuard],
        resolve: { dataItem: DataItemResolver }
      },
      {
        path: "widget",
        component: WidgetComponent,
        canActivate: [AuthGuard],
        resolve: { widgets: WidgetsResolver }       
      },
      {
        path: "widget-new",
        component: WidgetsComponent,
        canActivate: [AuthGuard],
        // resolve: { widgetNew: WidgetNewResolver }
      },
      {
        path: "scheduler",
        component: SchedulerComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "holiday",
        component: HolidayComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "holiday-scheduler",
        component: HolidaySchedulerComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "activities",
        component: ActivitiesComponent,
        canActivate: [AuthGuard],
        resolve: { activities: ActiviteResolver },
      },
      {
        path: "routine",
        component: RoutineComponent,
        canActivate: [AuthGuard],
        resolve: { routines: RoutineResolver },
      },
      {
        path: "package",
        component: PackageComponent,
        canActivate: [AuthGuard],
        resolve: { packages: PackageResolver },
      },
      {
        path: "location-mapping",
        component: LocationMappingComponent,
        canActivate: [AuthGuard],
        resolve: { locationMapping: LocationMappingResolver },
      },
      {
        path: "daily-management",
        component: DailyManagementComponent,
        canActivate: [AuthGuard],
        resolve: { dailyManagements: DailyManagementResolver },
      },
      {
        path: "health-test",
        component: HealthTestComponent,
        canActivate: [AuthGuard],
        resolve: { healthTests: HealthTestResolver },
      },
      {
        path: "permission-mapping",
        component: ResourceComponent,
        canActivate: [AuthGuard],
        // resolve: { configModules: ConfigurationService },
      },
      {
        path: "permission",
        component: PermissionComponent,
        canActivate: [AuthGuard],
        resolve: { perm: PermissionGroupResolver },
      },
      {
        path: "bar-code",
        component: BarCodeComponent,
        canActivate: [AuthGuard]        
      },
      {
        path: "alert-management",
        component: AlertManagementComponent,
        canActivate: [AuthGuard],
        resolve: { AlertManagements: AlertManagementComponentResolver },
      },
      {
        path: "role",
        component: RoleManagementComponent,
        canActivate: [AuthGuard],
      },
      {
      path: "ot-procedure",
      component: OtProcedureComponent,
      canActivate: [AuthGuard],
    },
    {
      path: "department",
      component: DepartmentInfoComponent,
      canActivate: [AuthGuard],
    },
    {
      path: "Entity-Template",
      component: ResourceTemplateComponent,
      canActivate: [AuthGuard],
    },
    {
      path: "manage-entity-group",
      component: ManageEntityGroupComponent,
      canActivate: [AuthGuard],
    }, 
    {
      path: "entity-association",
      component: EntityAssociationComponent,
      canActivate: [AuthGuard],
    },
    {
      path: "KPI",
      component: KPIComponent,
      canActivate: [AuthGuard],
    },
    {
      path: "SterlieSet",
      component: SetResourceComponent,
      canActivate: [AuthGuard],
    },
    { path: "permision-mapping", component: ResourceComponent },
    { 
      path: "permission-management", 
      component: PermissionManagementComponent,
      canActivate: [AuthGuard]
    },
    { 
      path: "application-management", 
      component: ApplicationManagementComponent,
      canActivate: [AuthGuard]
    },
    { 
      path: "audit-management", 
      component: AuditManagementComponent,
      canActivate: [AuthGuard]
    },
     { 
      path: "activity-rule", 
      component: ActivityRuleComponent,
      canActivate: [AuthGuard]
    },
     { 
      path: "door-controller", 
      component: DoorControllerComponent,
      canActivate: [AuthGuard]
     },
    {
     path: "channel-template",
     component: ChannelTemplateComponent,
     canActivate: [AuthGuard],
    },
     {
     path: "pf-models",
     component: PfModelsComponent,
     canActivate: [AuthGuard],
    },
    {
     path: "api-key",
     component: ApiKeyComponent,
     canActivate: [AuthGuard],
    },
     {
     path: "user-preferences",
     component: UserPreferencesComponent,
     canActivate: [AuthGuard],
    },
     {
      path: "shift-master",
      component: ShiftMasterComponent,
      canActivate: [AuthGuard],
     },
     {
      path: "user-guide",
      component: UserGuideComponent,
      canActivate: [AuthGuard],
     },
     {
      path: "map-crop",
      component: MapCropComponent,
      canActivate: [AuthGuard],
     }
     ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationRoutingModule {}
