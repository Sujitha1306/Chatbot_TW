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
import { NgModule, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../../shared/common';
import { WorkflowRoutingModule } from './workflow-routing.module';
import { WorkflowComponent } from './workflow.component';
import { SidemenuModule } from '../../shared/modules/entry-component/sidemenu/sidemenu.module';
import { PorterNewComponent } from './porter/porter.component';
import { AssetComponent, SensorComponent } from './asset-management/asset-management.component';
import { CommingSoonComponent } from './comming-soon/comming-soon.component';
import { NgxMaterialTimepickerModule, EntryComponentModule } from '../../shared';
import { OutpatientComponent } from './outpatient/outpatient.component';
import { InfantComponent } from './infant/infant.component';
import { InpatientComponent } from './inpatient/inpatient.component';
import { CdkDetailRowDirective } from './infant/cdk-detail-row.directive';
import { HealthCheckupComponent, MergeRecordComponent, GetAllMergeDataComponent } from './health-checkup/health-checkup.component';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../../shared/directive/shared-directives.module';
import { MessageCentreComponent, CreateMessageCentreComponent } from './message-centre/message-centre.component';
import { EmployeeComponent } from './employee/employee.component';
import { VisitorsComponent } from './visitors/visitors.component';
import { TemporaryIdCardComponent } from './temporary-id-card/temporary-id-card.component';
import { OTComponent } from './ot/ot.component';
import { ConsumerComponent } from './consumer/consumer.component';
import { ConfigurationModule } from '../configuration/configuration.module';
import { TwTableModule } from '../../shared/modules/entry-component/tw-table/tw-table.module';
import { TwHeaderModule } from '../../shared/modules/entry-component/tw-header/tw-header.module';
import { TwDataTableModule } from '../../shared/modules/entry-component/tw-data-table/tw-data-table.module';
import { StaffRoutineComponent } from './staff-routine/staff-routine.component';
import { ResidentComponent } from './resident/resident.component';
import { MedicalRecordComponent } from './medical-record/medical-record.component';
import { AssignTaskComponent, TaskComponent } from './task/task.component';
import { DayCareComponent } from './day-care/day-care.component';
import { LazyLoaderModule } from '../../shared/modules/entry-component/lazy-loader/lazy-loader.module';
import { StudentComponent } from './student/student.component';
import { EmergencyCareComponent } from './emergency-care/emergency-care.component';
import { AmbulanceComponent } from './ambulance/ambulance.component';
import { CreateFormComponent, FormComponent } from './workflow-form/workflow-form.component';
import { TicketComponent } from './ticket/ticket.component';
import { TruckComponent } from './truck/truck.component';
import { AdvertisementComponent, CreateAdvActivityComponent, CreateAdvertiesComponent, RupeesPipe } from './advertisement/advertisement.component';
import { EditUserComponent, ExternalUserComponent } from './external-user/external-user.component';
import { ReviewPostComponent } from './review-post/review-post.component';
import { DurationFormatPipe, KynUserComponent, PlayVideoComponent } from './external-user/kyn-user/kyn-user.component';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule } from '@angular-material-components/moment-adapter';
import { KynMediaReportsComponent } from './review-post/kyn-media-reports/kyn-media-reports.component';
import { AgentManagementComponent, CreateAgentComponent } from './agent-management/agent-management.component';
import { KynLiveRequestComponent } from './kyn-live-request/kyn-live-request.component';
import { ScheduleRequestComponent } from './schedule-request/schedule-request.component';
import { TelecastComponent } from './telecast/telecast.component';
import { UploadScheduleComponent } from './telecast/upload-schedule/upload-schedule.component';
import { ApprovedRequestComponent } from './telecast/approved-request/approved-request.component';
import { CreateLiveRequestComponent } from './kyn-live-request/create-live-request/create-live-request.component';
import { HazmatTrainingListComponent } from './hazmat-training-list/hazmat-training-list.component';
import { AssetTrackComponent } from './asset-track/asset-track.component';
import { LinenTrackingComponent } from './linen-tracking/linen-tracking.component';
import { TokenComponent } from './token/token.component';
import { EnrollTokenComponent } from './token/enroll-token/enroll-token.component';
import { NgxBarcode6Module } from "ngx-barcode6";
import { ItemMasterComponent } from './item-master/item-master.component';
import { InventoryComponent } from './inventory/inventory.component';
import { SupplierComponent } from './supplier/supplier.component';
import { IntendManagementComponent } from './intend-management/intend-management.component';
import { CardManagementComponent } from '../../shared/modules/entry-component/card-management/card-management.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { EditLocationManagementComponent, LocationManagementNewComponent } from './location-management/location-management-new.component';
import { TranslateModule} from '@ngx-translate/core';
import { VisitorComponent } from './visitor/visitor.component';
import { RoutineManagementComponent } from './routine-management/routine-management.component';
import { GoogleDirectionsComponent } from './google-directions/google-directions.component';
import { PrintStickerComponent, PrintStickerScreenComponent } from './print-sticker/print-sticker.component';
import { ShareModule } from '../../shared/shared.module';
import { StaffMusteringComponent } from './staff-mustering/staff-mustering.component';
import { PatientQueueManagementComponent } from './patient-queue-management/patient-queue-management.component';
import { PatientWorkListQueueComponent } from './patient-queue-management/patient-worklist-queue/patient-worklist-queue.component';
import { QueueStatusListComponent } from './patient-queue-management/queue-status-list/queue-status-list.component';
import { OverallQueueComponent } from './patient-queue-management/overall-queue/overall-queue.component';
import { SalesOrderComponent } from './sales-order/sales-order.component';
import { AssetMaintenanceComponent } from './asset-maintenance/asset-maintenance.component';
import { SoRoutineComponent } from './so-routine/so-routine.component';
import { NursecallViewComponent } from './nursecall-view/nursecall-view.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { TaskManagementCardViewComponent } from './task-management/task-management-card-view/task-management-card-view.component';
import { ReworkDialogComponent } from './task-management/task-management-card-view/rework-dialog.component';
import { MusteringHistoryComponent } from './staff-mustering/mustering-history/mustering-history.component';
import { ListMenuComponent } from './token/list-menu/list-menu.component';
import { FloorPlanModule } from '../floor-plan/floor-plan.module';
import { LinkedAssetComponent } from './asset-management/linked-asset/linked-asset.component';
import { PortersComponent } from './porters/porters.component';
import { HygieneComponent } from './hygiene/hygiene.component';
import { QRCodeModule } from 'angularx-qrcode';
import { StreamPlayerComponentComponent } from './ambulance/stream-player-component/stream-player-component.component';
import { ApprovalMatrixComponent } from './approval-matrix/approval-matrix.component';
import { PatientRelationComponent } from './patient-relation/patient-relation.component';
import { SampleMovementComponent } from './sample-movement/sample-movement.component';
import { PatientRelationNewComponent } from './patient-relation-new/patient-relation-new.component';
import { PatientRelationDetailComponent } from './patient-relation-new/patient-relation-detail/patient-relation-detail.component';
import { PatientDeviceAssociateComponent } from './patient-relation-new/patient-device-associate/patient-device-associate.component';
import { ManageChatBotComponent } from './manage-chat-bot/manage-chat-bot.component';
import { StaffMusteringV2Component } from './staff-mustering/staff-mustering-v2/staff-mustering-v2.component';
import { MusteringHistoryV2Component } from './staff-mustering/staff-mustering-v2/mustering-history-v2/mustering-history-v2.component';
@NgModule({
    imports: [
        TranslateModule,
        NgxMaterialTimepickerModule.forRoot(),
        SidemenuModule,
        CommonModule,
        WorkflowRoutingModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        SharedPipesModule.forRoot(),
        SharedDirectivesModule.forRoot(),
        EntryComponentModule.forRoot(),
        // AzureStorageModule,
        ConfigurationModule,
        TwTableModule,
        TwHeaderModule,
        TwDataTableModule,
        // InfiniteScrollModule,
        LazyLoaderModule,
        NgxMatDatetimePickerModule,
        NgxMatTimepickerModule,
        NgxMatNativeDateModule,
        NgxMatMomentModule,
        NgxBarcode6Module,
        QRCodeModule,
        GoogleChartsModule,
        ShareModule,
        FloorPlanModule
    ],
    declarations: [WorkflowComponent,
        PorterNewComponent,
        AssetComponent,
        MessageCentreComponent,
        CommingSoonComponent,
        InpatientComponent,
        OutpatientComponent,
        InfantComponent,
        CdkDetailRowDirective,
        HealthCheckupComponent,
        CreateMessageCentreComponent,
        MergeRecordComponent,
        GetAllMergeDataComponent,
        EmployeeComponent,
        VisitorsComponent,
        TemporaryIdCardComponent,
        OTComponent,
        EmergencyCareComponent,
        ConsumerComponent,
        StaffRoutineComponent,
        ResidentComponent,
        MedicalRecordComponent,
        TaskComponent,
        DayCareComponent,
        AssignTaskComponent,
        StudentComponent,
        AmbulanceComponent,
        AssetTrackComponent,
        SensorComponent,
        FormComponent,
        CreateFormComponent,
        TicketComponent,
        TruckComponent,
        AdvertisementComponent,
        ExternalUserComponent,
        ReviewPostComponent,
        CreateAdvertiesComponent,
        CreateAdvActivityComponent,
        KynUserComponent,
        DurationFormatPipe,
        RupeesPipe,
        PlayVideoComponent,
        EditUserComponent,
        KynMediaReportsComponent,
        AgentManagementComponent,
        CreateAgentComponent,
        KynLiveRequestComponent,
        ScheduleRequestComponent,
        TelecastComponent,
        UploadScheduleComponent,
        ApprovedRequestComponent,
        CreateLiveRequestComponent,
        HazmatTrainingListComponent,
        LinenTrackingComponent,
        TokenComponent,
        EnrollTokenComponent,
        ItemMasterComponent,
        InventoryComponent,
        SupplierComponent,
        IntendManagementComponent,
        CardManagementComponent,
        LocationManagementNewComponent,
        EditLocationManagementComponent,
        VisitorComponent,
        RoutineManagementComponent,
        GoogleDirectionsComponent,
        PrintStickerComponent,
        PrintStickerScreenComponent,
        StaffMusteringComponent,
        PatientWorkListQueueComponent,
        PatientQueueManagementComponent,
        QueueStatusListComponent,
        OverallQueueComponent,
        SalesOrderComponent,
        AssetMaintenanceComponent,
        SoRoutineComponent,
        NursecallViewComponent,
        TaskManagementComponent,
        TaskManagementCardViewComponent,
        ReworkDialogComponent,
        MusteringHistoryComponent,
        ListMenuComponent,
        LinkedAssetComponent,
        PortersComponent,
        HygieneComponent,
        StreamPlayerComponentComponent,
        ApprovalMatrixComponent,
        PatientRelationComponent,
        SampleMovementComponent,
        PatientRelationNewComponent,
        PatientRelationDetailComponent,
        PatientDeviceAssociateComponent,
        ManageChatBotComponent,
        StaffMusteringV2Component,
        MusteringHistoryV2Component        ],

    exports: [HealthCheckupComponent, TwTableModule, TwHeaderModule, TwDataTableModule, TruckComponent],
})


export class WorkflowModule {
}

