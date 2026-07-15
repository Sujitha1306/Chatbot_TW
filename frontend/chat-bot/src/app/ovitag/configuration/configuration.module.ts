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
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from '../../shared/modules';
import { ConfigurationRoutingModule } from './configuration-routing.module';
import { MaterialModule } from '../../shared/common';
import { ConfigurationComponent } from './configuration.component';
import { AssetComponent, CreateAssetComponent, InformationPopupComponent, LightboxOnlineMenuDialogComponent } from './asset/asset.component';
import { GatewayComponent , CreateGatewayComponent} from './gateway/gateway.component';
import { GatewayNewComponent } from './gateway-new/gateway-new.component';
import { ReaderComponent, ThresholdComponent, ConnectivityComponent } from './reader/reader.component';
import { ReaderConfigComponent } from './reader/reader-config/reader-config.component';
import { TagsComponent, UpgradeVersionComponent, CreateTagComponent } from './tags/tags.component';
import { HealthcheckComponent, CreateHealthcheckComponent, EditHealthcheckComponent } from './healthcheck/healthcheck.component';
import {PackageComponent, EditPackageComponent, CreatePackageComponent} from './package/package.component';
import {LocationMappingComponent, EditLocationMappingComponent} from './location-mapping/location-mapping.component';
import {DailyManagementComponent } from './daily-management/daily-management.component';
import {HealthTestComponent, HealthTestRuleComponent, CreateHealthTestComponent} from './health-test/health-test.component';
import { SidemenuModule } from '../../shared/modules/entry-component/sidemenu/sidemenu.module';
import { RuleComponent } from './rule/rule.component';
import { WidgetComponent, CreateWidgetComponent } from './widget-management/widget.component';
import { WidgetsComponent } from './widget/widget.component';
import { LayoutComponent }from './layout/layout.component';
import { FormManagementComponent } from './form-management/form-management.component';
import { ManageWidgetComponent } from './widget/manage-widget/manage-widget.component'
import { NgChartsModule } from 'ng2-charts';
import { AlertConfigComponent } from './alert-config/alert-config.component';
import {SharedPipesModule} from '../../shared/pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../../shared/directive/shared-directives.module';
import { ResourceComponent, CreateResourceComponent } from './resource/resource.component';
import { ActivitiesComponent, CreateActivityComponent } from './activities/activities.component';
import { RoutineComponent } from './routine-management/routine.component'
import { EntryComponentModule } from './../../shared/modules/entry-component/entry-component.module';
import { TwTableModule } from '../../shared/modules/entry-component/tw-table/tw-table.module';
import {TwHeaderModule} from '../../shared/modules/entry-component/tw-header/tw-header.module';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { CreateDataitem, DataItemComponent } from './data-item/data-item.component';
import { FormBuilderComponent } from './form-management/form-builder/form-builder.component';
import { AppTermsComponent } from './app-terms/app-terms.component';
import { ManageApptermsComponent } from './app-terms/manage-appterms/manage-appterms.component';
import { BarCodeComponent} from './bar-code/bar-code.component';
import { NgxBarcode6Module } from "ngx-barcode6";
import { QRCodeModule } from "angularx-qrcode";
import { BrokerComponent, CreateBrokerComponent } from './broker/broker.component';
import { PoeInjectorComponent, CreatePoeInjectorComponent } from './poe-injector/poe-injector.component';
import { CreateServerComponent, ServerComponent } from './server-management/server.component';
import { ConfigComponent } from './config/config.component';
import { ManageConfigComponent } from './config/manage-config/manage-config.component';
import { CreateNewAlertConfigComponent } from './alert-config/create-new-alert-config/create-new-alert-config.component';
import { DynamicCreateAlertConfigComponent } from './alert-config/dynamic-create-alert-config/dynamic-create-alert-config.component';
import { CdkDetailRowDirective } from './gateway-new/cdk-detail-row.directive';
import { HolidayComponent } from './holiday/holiday.component';
import { HolidaySchedulerComponent } from './holiday-scheduler/holiday-scheduler.component';
import { ManageHolidayComponent } from './holiday/manage-holiday/manage-holiday.component';
import { PermissionComponent } from './permission/permission.component';
import { RoleManagementComponent } from './role-management/role-management.component';
import { MobilescannerComponent } from './mobilescanner/mobilescanner.component';
import { CreatescannerdetailsComponent } from './createscannerdetails/createscannerdetails.component';
import { PWATaskdetailsComponent } from './pwa-taskdetails/pwa-taskdetails.component';
import { OtProcedureComponent } from './ot-procedure/ot-procedure/ot-procedure.component';
import { ManageOtprocedureComponent } from './ot-procedure/manage-otprocedure/manage-otprocedure/manage-otprocedure.component';
import { TranslateModule } from '@ngx-translate/core';
import { DepartmentInfoComponent } from './department-info/department-info.component';
import { ManageEntityGroupComponent } from './entitygroup-management/manage-entity-group/manage-entity-group.component';
import { ResourceTemplateComponent } from './resource-template/resource-template.component';
import { SetResourceComponent } from './set-resource/set-resource.component';
import { KPIComponent } from './kpi/kpi.component';
import { EntityAssociationComponent } from './entity-association/entity-association.component';
import { ShareModule } from '../../shared/shared.module';
import { ManagePermissionComponent, PermissionManagementComponent, PermittedPermissionComponent } from './permission-management/permission-management.component';
import { ApplicationManagementComponent, ManageLicencesComponent } from './application-management/application-management.component';
import { AuditManagementComponent } from './audit-management/audit-management.component';
import { ManageRoleComponent } from './role-management/manage-role/manage-role.component';
import { ActivityRuleComponent } from './activity-rule/activity-rule.component';
import { DoorControllerComponent } from './door-controller/door-controller.component';
import { DoorHistoryComponent } from './door-controller/door-history/door-history.component';
import { ChannelTemplateComponent } from './channel-template/channel-template.component';
import { ManageChanneltemplateComponent } from './channel-template/manage-channeltemplate/manage-channeltemplate.component';
import { PfModelsComponent } from './pf-models/pf-models.component';
import { ApiKeyComponent } from './api-key/api-key.component';
import { ManageApiKeyComponent } from './api-key/manage-api-key/manage-api-key.component';
import { CreateScheduleReportComponent } from './create-schedule-report/create-schedule-report.component';
import { UserPreferencesComponent } from './user-preferences/user-preferences.component';
import { ShiftMasterComponent } from './shift-master/shift-master.component';
import { ManageShiftMasterComponent } from './shift-master/manage-shift-master/manage-shift-master.component';
import { UserGuideComponent, CreateUserGuideComponent } from './user-guide/user-guide.component';
import { TwDataTableModule } from '../../shared/modules/entry-component/tw-data-table/tw-data-table.module';
import { CctvLocationPickerComponent } from './asset/cctv-location-picker/cctv-location-picker.component';


@NgModule({
    imports: [
        CommonModule,
        ConfigurationRoutingModule,
        MaterialModule,
        SidemenuModule,
        FormsModule,
        MatSelectModule,
        NgChartsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        NgxMaterialTimepickerModule,
        SharedPipesModule.forRoot(),
        SharedDirectivesModule.forRoot(),
        EntryComponentModule.forRoot(),
        TwTableModule,
        TwHeaderModule,
        NgxBarcode6Module,
        QRCodeModule,
        TranslateModule,
        ShareModule,
        TwDataTableModule
        // ZXingScannerModule
    ],
    declarations: [ConfigurationComponent, GatewayNewComponent, GatewayComponent, HealthcheckComponent, CreateHealthcheckComponent, EditHealthcheckComponent,
                    ReaderComponent, CreateGatewayComponent,ConnectivityComponent, ThresholdComponent, TagsComponent, CreateTagComponent, UpgradeVersionComponent, AssetComponent,
                    CreateAssetComponent, LightboxOnlineMenuDialogComponent,
                    RuleComponent,WidgetComponent,CreateWidgetComponent, AlertConfigComponent, PackageComponent,
                    WidgetsComponent, ManageWidgetComponent, 
                    EditPackageComponent, LocationMappingComponent, EditLocationMappingComponent, DailyManagementComponent,
                    HealthTestComponent, HealthTestRuleComponent, CreateHealthTestComponent, ResourceComponent, CreateResourceComponent,
                    ReaderConfigComponent, ActivitiesComponent, RoutineComponent, CreateActivityComponent, CreatePackageComponent, LayoutComponent, FormManagementComponent, SchedulerComponent,
                    DataItemComponent, CreateDataitem, FormBuilderComponent, AppTermsComponent, ManageApptermsComponent,BarCodeComponent,
                    BrokerComponent, CreateBrokerComponent, PoeInjectorComponent, CreatePoeInjectorComponent, ServerComponent, CreateServerComponent, ConfigComponent, ManageConfigComponent, CreateNewAlertConfigComponent,  DynamicCreateAlertConfigComponent,
                    CdkDetailRowDirective, HolidayComponent, HolidaySchedulerComponent, ManageHolidayComponent, PermissionComponent, RoleManagementComponent, MobilescannerComponent,
                    MobilescannerComponent,
                    CreatescannerdetailsComponent,
                    PWATaskdetailsComponent,
                    OtProcedureComponent,
                    ManageOtprocedureComponent,DepartmentInfoComponent,ManageEntityGroupComponent, ResourceTemplateComponent,SetResourceComponent, EntityAssociationComponent,KPIComponent,InformationPopupComponent,
                    PermissionManagementComponent, PermittedPermissionComponent,ManagePermissionComponent, ApplicationManagementComponent, ManageLicencesComponent, AuditManagementComponent, ManageRoleComponent, ActivityRuleComponent, DoorControllerComponent, DoorHistoryComponent, ChannelTemplateComponent, ManageChanneltemplateComponent, PfModelsComponent, ApiKeyComponent, ManageApiKeyComponent, CreateScheduleReportComponent, UserPreferencesComponent, ShiftMasterComponent, ManageShiftMasterComponent, UserGuideComponent, CreateUserGuideComponent,
                    CctvLocationPickerComponent
                   ],
   
    exports: [CreateAssetComponent, TwTableModule, CreateScheduleReportComponent],
})

export class ConfigurationModule { }
