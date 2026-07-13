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
import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule, isDevMode } from "@angular/core";
import { AppComponent } from "./app.component";
import { NotFoundComponent } from "./static/not-found/not-found.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ToastrModule } from "ngx-toastr";
import { CoreModule } from "./core/core.module";
import { SidebarMenuModule } from "./shared/modules/entry-component/sidebar-menu/sidebar-menu.module";
import { AppRoutingModule } from "./app-routing.module";
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import { Http_Interceptor } from "./../app/http-interceptor";
import { BnNgIdleService } from "bn-ng-idle"; // import bn-ng-idle service
import {  DateAdapter } from "@angular/material/core";
import { DateFormat } from "./../app/shared/modules/entry-component/date-format";
import {TranslateLoader, TranslateModule}from"@ngx-translate/core"
import{TranslateHttpLoader}from"@ngx-translate/http-loader"
import {
  AuthGuard,
  ErrorService,
  ApiService,
  CommonService,
  //  HttpService,
  ConfigurationService,
  HospitalService,
  DashboardService,
  ReportService,
  WorkflowService,
  CookieConsentService,
  // AssetService,  CustomValidators, ShortestPathAlgorithm,
  // NearestTagAlgorithm, Globals
} from "./shared";

import {
  AssetResolver,
  GatewayResolver,
  GatewayManagementResolver,
  ReaderResolver,
  DeviceResolver,
  SocialDistanceResolver,
  AlertManagementComponentResolver,
  HealthTestResolver,
  DailyManagementResolver,
  LocationMappingResolver,
  PackageResolver,
  RoutineResolver,
  ActiviteResolver,
  AlertResolver,
  AppTermResolver,
  LayoutsResolver,
  FormManagementResolver,
  DataItemResolver,
  WidgetsResolver,
  WidgetNewResolver,
  RuleResolver,
  HealthCheckResolver,
  BrokerResolver,
  ServerResolver,
  ConfigResolver,
  PermissionGroupResolver
} from "./shared/services/configuration.resolver";
import {
  AssetManagementResolver,
  ConsumerResolver,
  EmployeeResolver,
  IPResolver,
  ResidentResolver,
  StaffResolver,
  StudentResolver,
  HealthCheckupResolver,
  InfantResolver,
  MessageCentreResolver,
  OPResolver,
  OTResolver,
  PorterResolver,
  TempIdCardResolver,
  VisitorResolver,
  MedicalResolver,
  TaskResolver,
  DayCareResolver,
  MonitorResolver,
  EmergencyCareResolver,
  AmbulanceResolver,
  FormResolver,
  TicketResolver,
  HazmatTrainingResolver,
  SupplierResolver,
  ItemMasterResolver,
  InventoryResolver,
  IntendResolver,
  LocationManagementNewResolver
} from "./shared/services/workflow.resolver";
import { SharedPipesModule } from "./shared/pipes/shared-pipes.module";
import { CookieService } from "ngx-cookie-service";
import { DatePipe } from "@angular/common";
import { PushNotificationsService } from "./shared/services/push.notification.service";
import { VersionCheckService } from './shared/services/version-check.service';
import { LocationsResolver } from "./ovitag/hospital/location/location.component";
import { ManageFacilityResolver } from "./ovitag/hospital/manage-facility/manage-facility.component";
import { UserManagementResolver } from "./ovitag/hospital/user-management/user-management.component";
import { SupportResolver } from "./ovitag/hospital/support/support-ticket.component";
import { GlobalErrorHandler } from "./shared/services/global-error-handler";
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {ReactiveFormsModule} from '@angular/forms';
import { NgxCaptchaModule } from '@binssoft/ngx-captcha'
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { ShareModule } from "./shared/shared.module";
import { NetworkInterceptorInterceptor } from "./network/network.interceptor";
// import { AzureStorageModule } from "./azure-storage/azure-storage/azure-storage.module";

export const MY_FORMATS = {
  parse: {
    dateInput: "DD/MM/YYYY",
  },
  display: {
    dateInput: "DD/MM/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};
export function HttpLoaderFactory(http:HttpClient){
  return new TranslateHttpLoader(http,'./assets/i18n/','.json');
}

@NgModule({
  declarations: [AppComponent, NotFoundComponent],
  imports: [
    ReactiveFormsModule.withConfig({callSetDisabledState: 'whenDisabledForLegacyCode'}),
    BrowserModule,
    HttpClientModule,
    CoreModule,SidebarMenuModule,
    BrowserAnimationsModule,
    NgxCaptchaModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      toastClass: 'custom-toastr',
      messageClass: 'toast-massage',
      enableHtml: true,
      progressBar: true,
    }),
    SharedPipesModule.forRoot(),
    // AzureStorageModule,
    AppRoutingModule,
    // ServiceWorkerModule.register('ngsw-worker.js', {
    //   enabled: environment.serviceWorker ? !isDevMode() : false,
    //   registrationStrategy: 'registerWhenStable:30000'
    // }),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireMessagingModule,
    ShareModule
  ],
  providers: [
    // {provide: ErrorHandler, useClass: GlobalErrorHandler},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Http_Interceptor,
      multi: true,
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: NetworkInterceptorInterceptor,
    //   multi: true
    // },
    { provide: DateAdapter, useClass: DateFormat },

    DatePipe,
    DashboardService,
    CookieService,
    AuthGuard,
    ErrorService,
    CommonService,
    ApiService,
    // CustomValidators, ShortestPathAlgorithm, NearestTagAlgorithm, AssetService,  Globals,
    // HttpService,
    ConfigurationService,
    HospitalService,
    ReportService,
    CookieConsentService,
    BnNgIdleService,
    WorkflowService,
    AssetResolver,
    GatewayResolver,
    GatewayManagementResolver,
    BrokerResolver,
    ServerResolver,
    ReaderResolver,
    DeviceResolver,
    SocialDistanceResolver,
    HealthTestResolver,
    DailyManagementResolver,
    LocationMappingResolver,
    PackageResolver,
    RoutineResolver,
    ActiviteResolver,
    AlertResolver,
    AppTermResolver,
    LayoutsResolver,
    FormManagementResolver,
    DataItemResolver,
    WidgetsResolver,
    WidgetNewResolver,
    RuleResolver,
    HealthCheckResolver,
    AssetManagementResolver,
    ConsumerResolver,
    EmployeeResolver,
    IPResolver,
    ResidentResolver,
    StaffResolver,
    StudentResolver,
    HealthCheckupResolver,
    InfantResolver,
    MessageCentreResolver,
    OPResolver,
    OTResolver,
    EmergencyCareResolver,
    PorterResolver,
    TempIdCardResolver,
    VisitorResolver,
    MedicalResolver,
    TaskResolver,
    DayCareResolver,
    PushNotificationsService,
    MonitorResolver,
    VersionCheckService,
    AmbulanceResolver,
    FormResolver,
    TicketResolver,
    LocationsResolver,
    ManageFacilityResolver,
    UserManagementResolver,
    SupportResolver,
    ConfigResolver,
    PermissionGroupResolver,
    AlertManagementComponentResolver,
    HazmatTrainingResolver,
    ItemMasterResolver,
    SupplierResolver,
    InventoryResolver,
    IntendResolver,
    LocationManagementNewResolver
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
