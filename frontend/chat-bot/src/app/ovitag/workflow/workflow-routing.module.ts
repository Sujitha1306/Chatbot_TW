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

import { WorkflowComponent } from "./workflow.component";
import { PorterNewComponent } from "./porter/porter.component";
import { AssetComponent } from "./asset-management/asset-management.component";
import { InpatientComponent } from "./inpatient/inpatient.component";
import { OutpatientComponent } from "./outpatient/outpatient.component";
import { InfantComponent } from "./infant/infant.component";
import { HealthCheckupComponent } from "./health-checkup/health-checkup.component";
import { AuthGuard } from "../../shared";
import { MessageCentreComponent } from "./message-centre/message-centre.component";
import { EmployeeComponent } from "./employee/employee.component";
import { TemporaryIdCardComponent } from "./temporary-id-card/temporary-id-card.component";
import { OTComponent } from "./ot/ot.component";
import { ConsumerComponent } from "./consumer/consumer.component";
import { StaffRoutineComponent } from "./staff-routine/staff-routine.component";
import { ResidentComponent } from "./resident/resident.component";
import { MedicalRecordComponent } from './medical-record/medical-record.component';
import { TaskComponent } from "./task/task.component";
import { DayCareComponent } from './day-care/day-care.component';
import { StudentComponent } from './student/student.component';
import { AmbulanceComponent } from './ambulance/ambulance.component';
import {
  AssetManagementResolver,
  ConsumerResolver,
  EmployeeResolver,
  IPResolver,
  HealthCheckupResolver,
  InfantResolver,
  MessageCentreResolver,
  OPResolver,
  OTResolver,
  PorterResolver,
  TempIdCardResolver,
  VisitorResolver,
  StaffResolver,
  StudentResolver,
  ResidentResolver,
  MedicalResolver,
  DayCareResolver,
  MonitorResolver,
  EmergencyCareResolver,
  FormResolver,
  TicketResolver,
  HazmatTrainingResolver,
  ItemMasterResolver,
  SupplierResolver,
  InventoryResolver,
  IntendResolver,
  LocationManagementNewResolver,
  FacilityManagementResolver
} from '../../shared/services/workflow.resolver';
import { MonitorComponent } from "../../shared/modules/entry-component/monitor/monitor.component";
import { EmergencyCareComponent } from "./emergency-care/emergency-care.component";
import { FormComponent } from "./workflow-form/workflow-form.component";
import { TicketComponent } from "./ticket/ticket.component";
import { TruckComponent } from "./truck/truck.component";
import { AdvertisementComponent } from './advertisement/advertisement.component';
import { ExternalUserComponent } from "./external-user/external-user.component";
import { ReviewPostComponent } from "./review-post/review-post.component";
import { AgentManagementComponent } from "./agent-management/agent-management.component";
import { KynLiveRequestComponent } from "./kyn-live-request/kyn-live-request.component";
import { ScheduleRequestComponent } from "./schedule-request/schedule-request.component";
import { TelecastComponent } from "./telecast/telecast.component";
import { HazmatTrainingListComponent } from "./hazmat-training-list/hazmat-training-list.component";
import { AssetTrackComponent } from "./asset-track/asset-track.component";
import { LinenTrackingComponent } from "./linen-tracking/linen-tracking.component";
import { TokenComponent } from "./token/token.component";
import {ItemMasterComponent} from './item-master/item-master.component';
import {IntendManagementComponent} from './intend-management/intend-management.component';
import {SupplierComponent} from './supplier/supplier.component';
import {InventoryComponent} from './inventory/inventory.component';
import { LocationManagementNewComponent } from "./location-management/location-management-new.component";
import { VisitorComponent } from "./visitor/visitor.component";
import { RoutineManagementComponent } from "./routine-management/routine-management.component";
import { StaffMusteringComponent } from "./staff-mustering/staff-mustering.component";
import { PatientQueueManagementComponent } from "./patient-queue-management/patient-queue-management.component";
import { SalesOrderComponent } from "./sales-order/sales-order.component";
import { AssetMaintenanceComponent } from "./asset-maintenance/asset-maintenance.component";
import { SoRoutineComponent } from "./so-routine/so-routine.component";
import { NursecallViewComponent } from "./nursecall-view/nursecall-view.component";
import { TaskManagementComponent } from "./task-management/task-management.component";
import { PortersComponent } from "./porters/porters.component";
import { HygieneComponent } from "./hygiene/hygiene.component";
import { ReaderResolver } from "../../shared/services/configuration.resolver";
import { ApprovalMatrixComponent } from "./approval-matrix/approval-matrix.component";
import { PatientRelationComponent } from "./patient-relation/patient-relation.component";
import { SampleMovementComponent } from "./sample-movement/sample-movement.component";
import { PatientRelationNewComponent } from "./patient-relation-new/patient-relation-new.component";
import { ManageChatBotComponent } from "./manage-chat-bot/manage-chat-bot.component";
import { StaffMusteringV2Component } from "./staff-mustering/staff-mustering-v2/staff-mustering-v2.component";
import { FacilityManagementComponent } from "./facility-management/facility-management.component";
import { LocationTrackComponent } from "./location-track/location-track.component";

export const routes: Routes = [
  {
    path: "",
    component: WorkflowComponent,
    children: [
      {
        path: "asset-management",
        component: AssetComponent,
        canActivate: [AuthGuard],
        resolve: { assetManagements: AssetManagementResolver },
      },
      {
        path: "message-centre",
        component: MessageCentreComponent,
        canActivate: [AuthGuard],
        resolve: { messageCentre: MessageCentreResolver },
      },
      {
        path: "porter",
        component: PorterNewComponent,
        canActivate: [AuthGuard],
        // resolve: { porters: PorterResolver },
      },
      {
        path: "porter-new",
        component: PorterNewComponent,
        canActivate: [AuthGuard],
        // resolve: { porters: PorterResolver },
      },
      {
        path: "inpatient",
        component: InpatientComponent,
        canActivate: [AuthGuard],
        resolve: { IP: IPResolver },
      },
      {
        path: "outpatient",
        component: OutpatientComponent,
        canActivate: [AuthGuard],
        resolve: { OP: OPResolver },
      },
      {
        path: "infant",
        component: InfantComponent,
        canActivate: [AuthGuard],
        // resolve: { infant: InfantResolver },
      },
      {
        path: "health-checkup",
        component: HealthCheckupComponent,
        canActivate: [AuthGuard],
        resolve: { healthCheckup: HealthCheckupResolver },
      },
      {
        path: "truck-tracking",
        component: TruckComponent,
        canActivate: [AuthGuard],
        resolve: { healthCheckup: HealthCheckupResolver },
      },
      {
        path: "employee",
        component: EmployeeComponent,
        canActivate: [AuthGuard],
        resolve: { employee: EmployeeResolver },
      },
      {
        path: "visitors",
        component: VisitorComponent,
        canActivate: [AuthGuard],
        resolve: { visitor: VisitorResolver },
      },
      {
        path: "temporary-id-card",
        component: TemporaryIdCardComponent,
        canActivate: [AuthGuard],
        resolve: { tempIdCard: TempIdCardResolver },
      },
      {
        path: "operation-theatre",
        component: OTComponent,
        canActivate: [AuthGuard],
        resolve: { OT: OTResolver },
      },
      {
        path: "emergency-care",
        component: EmergencyCareComponent,
        canActivate: [AuthGuard],
        resolve: { emergencyCare: EmergencyCareResolver },
      },
      {
        path: "consumer",
        component: ConsumerComponent,
        canActivate: [AuthGuard],
        resolve: { consumer: ConsumerResolver },
      },
      {
        path: "staff-routine",
        component: StaffRoutineComponent,
        canActivate: [AuthGuard],
        resolve: { staff: StaffResolver },
      },
      {
        path: "resident",
        component: ResidentComponent,
        canActivate: [AuthGuard],
        resolve: { resident: ResidentResolver },
      },
      {
        path: "medical-record",
        component: MedicalRecordComponent,
        canActivate: [AuthGuard],
        resolve: { medicalrecord: MedicalResolver },
      },
      {
        path: "task",
        component: TaskComponent,
        canActivate: [AuthGuard],
        // resolve: { task: TaskResolver },
      },
      {
        path: "monitor",
        component: MonitorComponent,
        canActivate: [AuthGuard],
        resolve: { monitor: MonitorResolver },
      },
      {
        path: "token",
        component: TokenComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "day-care",
        component: DayCareComponent,
        canActivate: [AuthGuard],
        resolve: { dayCare: DayCareResolver },
      },
      {
        path: "student",
        component: StudentComponent,
        canActivate: [AuthGuard],
        resolve: { student: StudentResolver },
      },
      {
        path: "ambulance",
        component: AmbulanceComponent,
        canActivate: [AuthGuard],
        // resolve: { ambulance: AmbulanceResolver },
      },
      {
        path: "asset-track",
        component: AssetTrackComponent,
        canActivate: [AuthGuard],
        // resolve: { ambulance: AmbulanceResolver },
      },
      {
        path: "linen-track",
        component: LinenTrackingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "location-track",
        component: LocationTrackComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "form",
        component: FormComponent,
        canActivate: [AuthGuard],
        resolve: { form: FormResolver },
      },
      {
        path: "ticket",
        component: TicketComponent,
        canActivate: [AuthGuard],
        resolve: { ticket: TicketResolver },
      },
      {
        path: "advertisement",
        component: AdvertisementComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "agent",
        component: AgentManagementComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "external-user",
        component: ExternalUserComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "content-moderation",
        component: ReviewPostComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "live-request",
        component: KynLiveRequestComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "schedule-request",
        component: ScheduleRequestComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "telecast",
        component: TelecastComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "",
        component: HealthCheckupComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "hazmat-training",
        component: HazmatTrainingListComponent,
        canActivate: [AuthGuard],
        resolve: { hazmat: HazmatTrainingResolver },
      },
      {
        path: "item-master",
        component: ItemMasterComponent,
        canActivate: [AuthGuard],
        resolve: { item: ItemMasterResolver },
      },
      {
        path: "intend",
        component: IntendManagementComponent,
        canActivate: [AuthGuard],
        resolve: { int: IntendResolver },
      },
      {
        path: "supplier",
        component: SupplierComponent,
        canActivate: [AuthGuard],
        resolve: { supp: SupplierResolver },
      },
      {
        path: "inventory",
        component: InventoryComponent,
        canActivate: [AuthGuard],
        resolve: { invt: InventoryResolver },
      },
      {
        path: "location-management",
        component: LocationManagementNewComponent,
        canActivate: [AuthGuard],
        resolve: { LocationManagementNew: LocationManagementNewResolver },
      },
      {
        path: "routine-management",
        component: RoutineManagementComponent,
        canActivate: [AuthGuard],
        // resolve: {rou: }
      },
      {
        path: "staffmustering",
        component: StaffMusteringV2Component,
        canActivate: [AuthGuard],
      },
      {
        path: "patient-queue",
        component: PatientQueueManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "sales-order",
        component: SalesOrderComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "asset-maintenance",
        component: AssetMaintenanceComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "so-routine",
        component: SoRoutineComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "nursecall-view",
        component: NursecallViewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "manage-task",
        component: TaskManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "porters",
        component: PortersComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "hand-hygiene",
        component: HygieneComponent,
        canActivate: [AuthGuard],
        resolve: { readers: ReaderResolver },
      },
      {
        path: "approval-matrix",
        component: ApprovalMatrixComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "sample-movement",
        component: SampleMovementComponent,
        canActivate: [AuthGuard],
      },{
        path: "patient-relations-old",
        component: PatientRelationComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "patient-relations",
        component: PatientRelationNewComponent,
        canActivate: [AuthGuard],
      },
       {
        path: "msg-conversation",
        component: ManageChatBotComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "facility-management",
        component: FacilityManagementComponent,
        canActivate: [AuthGuard],
        resolve: { facilityManagement: FacilityManagementResolver },
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkflowRoutingModule {}
