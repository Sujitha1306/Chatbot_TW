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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule, FlexLayoutModule } from '@angular/flex-layout';
import { MatTreeModule } from '@angular/material/tree';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, DatePipe } from '@angular/common';
import { MaterialModule } from '../../common/material.module';
import { PorterRequestHistoryComponent, PorterRequestNewComponent } from './porter-request/porter-request.component';
import { NgxMaterialTimepickerModule } from '../material-timepicker/ngx-material-timepicker.module';
import { ManageWidgetComponent } from './manage-widget/manage-widget.component';
import { ManageLayoutComponent } from './manage-layout/manage-layout.component';
import { CommonLayoutComponent } from './common-layout/common-layout.component';
import { GridsterLayoutComponent } from './girdster-layout/gridster-layout.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { editFormComponent, formComponent, tableUpdateComponent } from './form/form.component';
import { PatientComponent, PatientListComponent, PatientInfoComponent } from './patient/patient.component';
import { ManageControlComponent } from './manage-control/manage-control.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { EditDailyManagementComponent } from './edit-daily-management/edit-daily-management.component';
import { TermsComponent } from './terms/terms.component';
import { CreateTicketComponent } from './support-ticket/support-ticket.component';
import { AlertEntryComponent } from './alert-entry/alert-entry.component';
import { CommonMapComponent } from './common-map/common-map.component';
import { CommonSearchComponent } from './common-search/common-search.component';
import { ConfirmationDialog } from './confirmation-dialog/confirmation-dialog.component';
import { SoftwareUpdateComponent } from './software-update/software-update.component';
import { MatCardModule } from '@angular/material/card';
import { SharedPipesModule } from '../../pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../../directive/shared-directives.module';
import { EnrollPatientComponent, EnrollRegisterPatientComponent, CoasterComponent, EnrollRegisterEmployeeComponent, EnrollInfantComponent } from './enroll-patient/enroll-patient.component';
import { MaintenanceViewmoreComponent } from '../entry-component/maintenance-viewmore/maintenance-viewmore.component';
import { TableComponent } from '../entry-component/table/table.component';
import { AngularTableComponent } from '../entry-component/table-angular/angulartable.component';
import { CdkDetailRowDirective } from './table/cdk-detail-row.directive';
import { DashboardWidgetComponent } from './dashboard-widget/dashboard-widget.component';
import { GlobalSearchComponent } from './globalsearch/globalsearch.component';
import { CommonDialogComponent } from './common-dialog-component/common-dialog.component';
import { CommonStylingComponent } from './common-styling-component/common-styling.component';
import { CommonStyleComponent } from './common-style/common-style.component';
import { NavigationDialogComponent } from './navigation-dialog/navigation-dialog.component';
import { LayoutSaveComponent, ConfirmDialogComponent } from './layout-save/layout-save.component';
import { NoSpaceDirective } from './space-directive/no-space.directive';
import { UpgradeCertificateComponent } from './certificate-upgrade/upgrade-certificate.component';
import { WorkflowManagementComponent } from './workflow-management/workflow-management.component';
import { AssetTransferComponent } from './asset-transfer/asset-transfer.component';
import { GatePassComponent } from './gate-pass/gate-pass.component';
import { ConsumerManagementComponent } from './consumer-management/consumer-management.component';
import { RoutineHistoryComponent } from './routine-history/routine-history.component';
import { MedicalRecordDispatchComponent } from './medical-record-dispatch/medical-record-dispatch.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { CardViewComponent } from './card-view/card-view.component';
import { EditTaskComponent } from './edit-task/edit-task.component';
import { EditGatewayComponent } from './edit-gateway/edit-gateway.component';
import { PatientBannerComponent } from './patient-banner/patient-banner.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory} from 'angular-calendar/date-adapters/date-fns';
import { GridsterModule } from 'angular-gridster2';
import { NgChartsModule } from 'ng2-charts';
import { FloorPlanmapComponent } from './floor-plan/floor-plan.component';
import { WidgetHeaderComponent} from './widget-header/widget-header.component';
import { AlertComponent } from './alert/alert.component';
import { MatBadgeModule } from '@angular/material/badge';
import { AmbulanceRequestComponent } from './ambulance-request/ambulance-request.component';
import { GoogleMapComponent, GoogleMapDirectionComponent, GoogleMapMarkerComponent } from './google-map/google-map.component';
import { LightboxOnlineMenuComponent, StatusTrackingComponent } from './status-tracking/status-tracking.component';
import { EntityGroupComponent } from './entity-group/entity-group.component';
import { AcknowledgementComponent } from './acknowledgement/acknowledgement.component';
import { LicenseComponent } from './license/license.component';
import { TwLayoutHeaderComponent } from './tw-layout-header/tw-layout-header.component';
import { GatewayConfigurationComponent } from './gateway-configuration/gateway-configuration.component';
import { KynPopupSliderComponent } from './kyn-popup-slider/kyn-popup-slider.component';
import { HazardTrackComponent } from './hazard-track/hazard-track.component';
import { NgxGaugeModule } from 'ngx-gauge';
import { HazmatTrainingComponent } from './hazmat-training/hazmat-training.component';
import { AlertInfoComponent } from './alert-info/alert-info.component';
import { TwTableModule } from '../entry-component/tw-table/tw-table.module';
import { TwDataTableModule } from './tw-data-table/tw-data-table.module';
import { HazmatMapComponent } from './hazmat-map/hazmat-map.component';
import { HazmatLocationComponent } from './hazmat-location/hazmat-location.component';
import { BreakDialogComponent } from './break-dialog/break-dialog.component';
import { StatusEventComponent } from './status-event/status-event.component';
import { MovementHistoryComponent } from './movement-history/movement-history.component';
import { TrainingSchedulerComponent } from './training-scheduler/training-scheduler.component';
import { AssetAuditComponent } from './asset-audit/asset-audit.component';
import { QRCodeModule } from 'angularx-qrcode';
import { NgxBarcode6Module } from 'ngx-barcode6';
import { CreateSupplierComponent } from './create-supplier/create-supplier.component';
import { ResourceMapComponent } from './resource-map/resource-map.component';
import { FormTableComponent } from './form-table/form-table.component';
import { PharmacyTaskComponent } from './pharmacy-task/pharmacy-task.component';

import { ItemMasterManagementComponent } from './item-master-management/item-master-management.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
// import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ProfileComponent } from './profile/profile.component';
import { DeliveryReqManagementComponent } from './delivery-req-management/delivery-req-management.component';
import { AppOtNewComponent } from './app-ot-new/app-ot-new.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { AlertManagementComponent } from './alert-management/alert-management.component';
import { TwHeaderModule } from './tw-header/tw-header.module';
import { AlertInformationComponent } from './alert-information/alert-information.component';
import { BannerComponent } from './banner/banner.component';
import { ManagePatientComponent } from './manage-patient/manage-patient/manage-patient.component';
import { FormManagementComponent } from './CAFM/form-management/form-management.component';
import { TicketManagementComponent } from './CAFM/ticket-management/ticket-management.component';
import {  TranslateModule } from '@ngx-translate/core';
import { ManageAssetComponent } from './manage-asset/manage-asset.component';
import { AuditListComponent } from './CAFM/audit-list/audit-list.component';
import { AlertListComponent,AlertDetailsComponent } from './CAFM/alert-list/alert-list.component';
import { CreateDepartmentComponent } from './create-department/create-department.component';
import { TaskManagmentComponent } from './task-managment/task-managment.component';
import { AiComponent } from './ai/ai.component';
import { DocumentManagementComponent } from './CAFM/document-management/document-management.component';
import { IdentifierManagementComponent } from './CAFM/identifier-management/identifier-management.component';
import { ManageSchedulerComponent } from './manage-scheduler/manage-scheduler.component';
import { CreateManageRoutineComponent } from './create-manage-routine/create-manage-routine.component';
import { VisitorHistoryComponent } from './visitor-history/visitor-history.component';
import { CreateRoutineActivityComponent } from './create-routine-activity/create-routine-activity.component';
import { EntityRoutineActivityComponent } from './entity-routine-activity/entity-routine-activity.component';
import { ManageVisitorComponent } from './manage-visitor/manage-visitor.component';
import { VisitEventComponent } from './visit-event/visit-event.component';
import { VisitorTagAssociateComponent } from './visit-event/visitor-tag-associate/visitor-tag-associate.component';
import { EntityRoutineEventsComponent } from './entity-routine-events/entity-routine-events.component';
import { CreateResourceTemplateComponent } from './create-resource-templete/create-resource-template.component';
import { EventStatusTrackingComponent } from './event-status-tracking/event-status-tracking.component';
import { CreateSetResourceComponent } from './create-set-resource/create-set-resource.component';
import { CreatePwaTicketComponent } from './create-pwa-ticket/create-pwa-ticket.component';
import { OnSiteNotificationComponent } from './on-site-notification/on-site-notification.component';
import { TwMeetingComponent } from './tw-meeting/tw-meeting.component';
import { UserLocationComponent } from './CAFM/user-location/user-location.component';
import { ReminderConfigComponent } from './reminder-config/reminder-config.component';
import { CreateRoutineTemplateComponent } from './create-routine-template/create-routine-template.component';
import { DynamicDialogComponent } from './dynamic-dialog/dynamic-dialog.component';
import { PwaTaskComponent} from './pwa/pwa-task/pwa-task.component';
import { PwaAssetComponent } from './pwa/pwa-asset/pwa-asset.component';
import { ManageFilterComponent } from './pwa/manage-filter/manage-filter.component';
import { ManagePwaAssetComponent } from './pwa/manage-pwa-asset/manage-pwa-asset.component';
import { ManagePwaInfoComponent, ManagePwaTaskComponent, PwaUploadTaskComponent } from './pwa/manage-pwa-task/manage-pwa-task.component';
import { DeviceComponent } from './pwa/device/device.component';
import { EditAssetComponent } from './pwa/edit-asset/edit-asset.component';
import { AssignTokenComponent } from './assign-token/assign-token.component';
import { PwaMaintenanceComponent } from './pwa/pwa-maintenance/pwa-maintenance.component';
import { PwaTicketComponent } from './pwa/pwa-ticket/pwa-ticket.component';
import { ManageKpiComponent } from './manage-kpi/manage-kpi.component';
import { ResourceRemarksComponent } from './resource-remarks/resource-remarks.component';
import { ManageEntityAssociationComponent } from './manage-entity-association/manage-entity-association.component';
import { ShareModule } from '../../shared.module';
import { ManagePwaMaintenanceComponent } from './pwa/manage-pwa-maintenance/manage-pwa-maintenance.component';
import { ManageRoutineActivityComponent } from './pwa/manage-routine-activity/manage-routine-activity.component';
import { PwaDocumentComponent, PwaDocumentManagementComponent } from './pwa/pwa-document-management/pwa-document-management.component';
import { PwaFormManagementComponent } from './pwa/pwa-form-management/pwa-form-management.component';
import { auditRemarkscomponent, AuditScheduleManagementComponent } from './CAFM/audit-schedule-management/audit-schedule-management.component';
import { KpiManagementComponent, ManageKpiEntityComponent } from './CAFM/kpi-management/kpi-management.component';
import { SalesOrderManagementComponent } from './sales-order-management/sales-order-management.component';
import { CreateActivityRuleComponent } from './create-activity-rule/create-activity-rule.component';
import { ProductionManagementComponent } from './production-management/production-management.component';
import { ProductionPlanComponent } from './production-management/production-plan/production-plan.component';
import { TagAssociateComponent } from './production-management/tag-associate/tag-associate.component';
import { NewcardViewComponent } from './newcard-view/newcard-view.component';
import { AssetMaintenanceInfoComponent } from './asset-maintenance-info/asset-maintenance-info.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AIPromptFormComponent } from './ai-prompt-form/ai-prompt-form.component';
import { PwaNotificationComponent, TimeAgoPipes } from './pwa/pwa-notification/pwa-notification.component';
import { EditTemplateComponent } from './edit-template/edit-template.component';
import { CommonLeafletComponent } from '../../../ovitag/floor-plan/leaflet/common-leaflet/common-leaflet.component';
import { ManageLocationLeafletComponent } from '../../../ovitag/floor-plan/leaflet/common-leaflet/manage-location-leaflet/manage-location-leaflet.component';
import { PfModelsEditinfoComponent } from './pf-models-editinfo/pf-models-editinfo.component';
import { EasyTaskComponent } from './pwa/easy-task/easy-task.component';
import { MonitorComponent } from './monitor/monitor.component';
import { ThreeMapComponent } from './three-map/three-map.component';
import { PwaRequestComponent } from './pwa/pwa-request/pwa-request.component';
import { MapViewerComponent } from './three-map/components/map-viewer/map-viewer.component';
import { MultiFloorViewerComponent } from './three-map/components/multi-floor-viewer/multi-floor-viewer.component';
import { ThreeMultipleMapComponent } from './three-map/components/multiple-map/multiple-map.component';
import { AiInteractionComponent } from './three-map/components/ai-interaction/ai-interaction.component';
import { IndoorPathComponent } from './three-map/components/indoor-path/indoor-path.component';
import { LiveTrackingComponent } from './three-map/components/live-tracking/live-tracking.component';
import { CreateUserScheduleComponent } from './create-user-schedule/create-user-schedule.component';
import { RequestComponent } from './request/request.component';
import { PwaPatientComponent } from './pwa/pwa-patient/pwa-patient.component';
import { FacilityTransferComponent } from './facility-transfer/facility-transfer.component';
import { N8nComponent } from './n8n/n8n.component';
import { PwaPatientTranGDAServicesComponent } from './pwa/pwa-patient-tran-gda-services/pwa-patient-tran-gda-services.component';
import { ChatBotComponent } from './chat-bot/chat-bot.component';
import { ManagePatientRelationComponent } from './manage-patient-relation/manage-patient-relation.component';
import { PatientAdmitComponent } from './patient-admit/patient-admit.component';
import { PatientRelationManagementComponent } from './patient-relation-management/patient-relation-management.component';
import { AssetOverviewComponent } from './asset-overview/asset-overview.component';
import { BulkIdentifierExportComponent } from './bulk-identifier-export/bulk-identifier-export.component';
import { MapCropComponent } from './map-crop/map-crop.component';
import { MapCropResultDialogComponent } from './map-crop/map-crop-result-dialog.component';
import { NotificationAlertPopupComponent } from './notification-alert-popup/notification-alert-popup.component';


// import { ManageLocationComponent} from './manage-location/manage-location.component';

@NgModule({
    imports: [
        TwHeaderModule,
        QRCodeModule,
        NgxBarcode6Module,
        CoreModule,
        NgChartsModule,
        MatCardModule,
        MatSelectModule,
        MatTreeModule,
        MatToolbarModule,
        CommonModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        InfiniteScrollModule,
        GridsterModule,
        MatBadgeModule,
        NgxGaugeModule,
        TwTableModule,
        TwDataTableModule,
        GoogleChartsModule,
        // ZXingScannerModule,
        NgxMaterialTimepickerModule.forRoot(),
        SharedPipesModule.forRoot(),
        SharedDirectivesModule.forRoot(),
        CalendarModule.forRoot({
            provide : DateAdapter,
            useFactory : adapterFactory
        }),
        TranslateModule,
        ShareModule,
        DragDropModule
    ],
    exports: [
        CommonLeafletComponent,
        ManageLocationLeafletComponent,
        AmbulanceRequestComponent,
        PorterRequestNewComponent,
        ManageVisitorComponent,
        PorterRequestHistoryComponent,
        CalendarComponent,
        PrivacyComponent,
        EditDailyManagementComponent,
        TermsComponent,
        PatientListComponent,
        CreateTicketComponent,
        ManageWidgetComponent,
        ManageLayoutComponent,
        CommonLayoutComponent,
        GridsterLayoutComponent,
        formComponent,
        DynamicFormComponent,
        PatientComponent,
        PatientInfoComponent,
        ManageControlComponent,
        AlertEntryComponent,
        CommonMapComponent,
        CommonSearchComponent,
        ConfirmationDialog,
        SoftwareUpdateComponent,
        EnrollPatientComponent,
        EnrollRegisterPatientComponent,
        CoasterComponent,
        MaintenanceViewmoreComponent,
        TableComponent,
        ThreeMapComponent,
        MapViewerComponent,
        LiveTrackingComponent,
        AngularTableComponent,
        // ManageLocationComponent,
        DashboardWidgetComponent,
        GlobalSearchComponent,
        CommonDialogComponent,
        CommonStylingComponent,
        CommonStyleComponent,
        NavigationDialogComponent,
        EnrollRegisterEmployeeComponent,
        EnrollInfantComponent,
        UpgradeCertificateComponent,
        WorkflowManagementComponent,
        AssetTransferComponent,
        GatePassComponent,
        RoutineHistoryComponent,
        MedicalRecordDispatchComponent,
        CreateUserComponent,
        CardViewComponent,
        EditTaskComponent,
        EditGatewayComponent,
        PatientBannerComponent,
        FloorPlanmapComponent,
        WidgetHeaderComponent,
        AlertComponent,
        GoogleMapComponent,
        GoogleMapDirectionComponent,
        GoogleMapMarkerComponent,
        editFormComponent,
        StatusTrackingComponent,
        EntityGroupComponent,
        AcknowledgementComponent,
        LicenseComponent,
        TwLayoutHeaderComponent,
        KynPopupSliderComponent,
        HazmatTrainingComponent,
        AlertInfoComponent,
        HazmatMapComponent,
        HazmatLocationComponent,
        StatusEventComponent,
        TrainingSchedulerComponent,
        NavBarComponent,
        AlertManagementComponent,
        BannerComponent,
        ManagePatientComponent,
        FormManagementComponent,
        UserLocationComponent,
        TicketManagementComponent,
        ManageAssetComponent,
        AuditListComponent,
        AlertListComponent,
        AlertDetailsComponent,
        CreateDepartmentComponent ,
        DocumentManagementComponent,
        IdentifierManagementComponent,
        ManageSchedulerComponent,
        CreatePwaTicketComponent,
        EntityRoutineActivityComponent,
        ReminderConfigComponent,
        CreateRoutineTemplateComponent,
        AssignTokenComponent,
        KpiManagementComponent,
        NewcardViewComponent,
        AssetMaintenanceInfoComponent,
        ProductionPlanComponent,
        TagAssociateComponent,
        AIPromptFormComponent,
        PwaNotificationComponent,
        TimeAgoPipes,
        ManageEntityAssociationComponent,
        PfModelsEditinfoComponent,
        MonitorComponent,
        CreateUserScheduleComponent,
        RequestComponent,
        ChatBotComponent,
        BulkIdentifierExportComponent,
        MapCropComponent,
        NotificationAlertPopupComponent
    ],
    declarations: [
        CommonLeafletComponent,
        ManageLocationLeafletComponent,
        AmbulanceRequestComponent,
        PorterRequestNewComponent,
        PorterRequestHistoryComponent,
        CalendarComponent,
        PrivacyComponent,
        EditDailyManagementComponent,
        TermsComponent,
        CreateTicketComponent,
        ManageWidgetComponent,
        ManageLayoutComponent,
        CommonLayoutComponent,
        formComponent,
        GridsterLayoutComponent,
        DynamicFormComponent,
        ManageControlComponent,
        AlertEntryComponent,
        PatientComponent,
        PatientInfoComponent,
        PatientListComponent,
        CommonMapComponent,
        CommonSearchComponent,
        ConfirmationDialog,
        SoftwareUpdateComponent,
        EnrollPatientComponent,
        EnrollRegisterPatientComponent,
        CoasterComponent,
        MaintenanceViewmoreComponent,
        TableComponent,
        AngularTableComponent,
        // ManageLocationComponent,
        DashboardWidgetComponent,
        GlobalSearchComponent,
        CommonDialogComponent,
        CommonStylingComponent,
        CommonStyleComponent,
        NavigationDialogComponent,
        CdkDetailRowDirective,
        EnrollRegisterEmployeeComponent,
        EnrollInfantComponent,
        LayoutSaveComponent,
        ConfirmDialogComponent,
        NoSpaceDirective,
        UpgradeCertificateComponent,
        WorkflowManagementComponent,
        AssetTransferComponent,
        GatePassComponent,
        ConsumerManagementComponent,
        RoutineHistoryComponent,
        MedicalRecordDispatchComponent,
        CreateUserComponent,
        CardViewComponent,
        EditTaskComponent,
        EditGatewayComponent,
        PatientBannerComponent,
        FloorPlanmapComponent,
        WidgetHeaderComponent,
        AlertComponent,
        GoogleMapComponent,
        GoogleMapDirectionComponent,
        GoogleMapMarkerComponent,
        editFormComponent,
        StatusTrackingComponent,
        LightboxOnlineMenuComponent,
        EntityGroupComponent,
        AcknowledgementComponent,
        LicenseComponent,
        TwLayoutHeaderComponent,
        GatewayConfigurationComponent,
        KynPopupSliderComponent,
        HazardTrackComponent,
        HazmatTrainingComponent,
        AlertInfoComponent,
        HazmatMapComponent,
        HazmatLocationComponent,
        BreakDialogComponent,
        StatusEventComponent,
        MovementHistoryComponent,
        TrainingSchedulerComponent,
        AssetAuditComponent,
        CreateSupplierComponent,
        ResourceMapComponent,
        FormTableComponent,
        tableUpdateComponent,
        PharmacyTaskComponent,
        ItemMasterManagementComponent,
        NavBarComponent,
        DeliveryReqManagementComponent,
        ProfileComponent,
        AppOtNewComponent,
        AlertManagementComponent,
        AlertInformationComponent,
        BannerComponent,
        ManagePatientComponent,
        FormManagementComponent,
        TicketManagementComponent,
        ManageAssetComponent,
        AuditListComponent,
        AlertListComponent,
        AlertDetailsComponent,
        CreateDepartmentComponent,
        TaskManagmentComponent,
        AiComponent,
        DocumentManagementComponent,
        IdentifierManagementComponent,
        ManageSchedulerComponent,
        CreateManageRoutineComponent,
        VisitorHistoryComponent,
        CreateRoutineActivityComponent,
        EntityRoutineActivityComponent,
        ManageVisitorComponent,
        VisitEventComponent,
        VisitorTagAssociateComponent,
        EntityRoutineEventsComponent,
        CreateResourceTemplateComponent,
        EventStatusTrackingComponent,
        CreateSetResourceComponent,
        CreatePwaTicketComponent,
        OnSiteNotificationComponent,
        TwMeetingComponent,
        UserLocationComponent,
        ReminderConfigComponent,
        CreateRoutineTemplateComponent,
        DynamicDialogComponent,
        PwaTaskComponent,
        PwaAssetComponent,
        ManageFilterComponent,
        ManagePwaAssetComponent,
        ManagePwaTaskComponent,
        PwaUploadTaskComponent,
        DeviceComponent,
        EditAssetComponent,
        ResourceRemarksComponent,
        AssignTokenComponent,
        PwaTicketComponent,
        PwaMaintenanceComponent,
        ManagePwaInfoComponent,
        ManageKpiComponent,
        ManageEntityAssociationComponent,
        ManagePwaMaintenanceComponent,
        ManageRoutineActivityComponent,
        PwaDocumentManagementComponent,
        PwaDocumentComponent,
        PwaFormManagementComponent,
        AuditScheduleManagementComponent,
        auditRemarkscomponent,
        KpiManagementComponent,
        ManageKpiEntityComponent,
        SalesOrderManagementComponent,
        CreateActivityRuleComponent,
        ProductionManagementComponent,
        ProductionPlanComponent,
        TagAssociateComponent,
        NewcardViewComponent,
        AssetMaintenanceInfoComponent,
        AIPromptFormComponent,
        PwaNotificationComponent,
        TimeAgoPipes,
        EditTemplateComponent,
        PfModelsEditinfoComponent,
        EasyTaskComponent,
        MonitorComponent,
        ThreeMapComponent,
        MapViewerComponent,
        MultiFloorViewerComponent,
        ThreeMultipleMapComponent,
        AiInteractionComponent,
        IndoorPathComponent,
        LiveTrackingComponent,
        PwaRequestComponent,
        PwaPatientComponent,
        CreateUserScheduleComponent,
        RequestComponent,
        FacilityTransferComponent,
        N8nComponent,
        PwaPatientTranGDAServicesComponent,
        ChatBotComponent,
        PatientAdmitComponent,
        ManagePatientRelationComponent,
        PatientRelationManagementComponent,
        AssetOverviewComponent,
        BulkIdentifierExportComponent,
        MapCropComponent,
        MapCropResultDialogComponent,
        NotificationAlertPopupComponent
    ],
})
export class EntryComponentModule {
    static forRoot(): ModuleWithProviders<EntryComponentModule> {
        return {
            ngModule: EntryComponentModule,
            providers: [DatePipe]
        };
    }
}
