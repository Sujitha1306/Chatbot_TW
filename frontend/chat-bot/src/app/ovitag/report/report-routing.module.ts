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
import { RouterModule, Routes } from '@angular/router';

import { ReportComponent } from './report.component';
// import { ReaderComponent } from './reader/reader.component';
import { HealthCheckupReportComponent } from './patient-reports/healthcheckup-report/healthcheckup-report.component';
import { InpatientReportComponent } from './patient-reports/inpatient-report/inpatient-report.component';
import { OperationTheatreReportComponent } from './patient-reports/operationtheatre-report/optheatre-report.component'
import { EmergencyReportComponent } from './patient-reports/emergency-report/emergency-report.component';
import { MedicalrecordReportComponent } from './patient-reports/medicalrecord-report/medicalrecord-report.component';
import { InfantsecurityReportComponent } from './patient-reports/infantsecurity-report/infantsecurity-report.component';
import { EmployeeReportComponent } from './employee-report/employee-report.component';
import { StaffReportComponent } from './staff-report/staff-report.component';
import { StudentReportComponent } from './student-report/student-report.component';
import { AssetReportComponent } from './asset-report/asset-report.component';
import { EnvironmentReportComponent } from './environment-report/environment-report.component';
import { MaintenanceReportComponent } from './maintenance-report/maintenance-report.component';
import { PorterReportComponent } from './porter-report/porter-report.component';
import { ReportsComponent } from './reports/reports.component';
import { AuthGuard } from '../../shared';
import { AuditlogComponent } from './audit-log/auditlog.component';
import { ErrorlogComponent } from './error-log/errorlog.component';
import { OutpatientReportComponent } from './patient-reports/outpatient-report/outpatient-report.component';
import { DaycareReportComponent } from './patient-reports/daycare-report/daycare-report.component';
import { ScheduleReportComponent } from './schedule-report/schedule-report.component';
import { ResidentReportComponent } from './resident-report/resident-report.component';
import { RoutineReportComponent } from './routine-report/routine-report.component'
import { ambulanceReportComponent } from './ambulance/ambulance-report.component';
import { KynReviewpostManagementComponent } from './kyn-reviewpost-management/kyn-reviewpost-management.component';
import { PorterV2ReportComponent } from './porter-v2-report/porter-v2-report.component';
import { AiStMustComponent } from './staffMustering-Report/ai-stmust.component';
import { CommandCenterComponent } from './command-center/command-center.component';

export const routes: Routes = [{
    path: '', component: ReportComponent, children: [
       { path: 'staff', component: StaffReportComponent, canActivate: [AuthGuard] },
       { path: 'student', component: StudentReportComponent, canActivate: [AuthGuard]},
       { path: 'environment', component: EnvironmentReportComponent, canActivate: [AuthGuard] },
       { path: 'asset', component: AssetReportComponent, canActivate: [AuthGuard] },
       { path: 'maintenance', component: MaintenanceReportComponent, canActivate: [AuthGuard] },
       { path: 'audit-log', component: AuditlogComponent, canActivate: [AuthGuard] },
       { path: 'error-log', component: ErrorlogComponent, canActivate: [AuthGuard] },
       { path: 'patient', component: HealthCheckupReportComponent, canActivate: [AuthGuard] },
       { path: 'patient-hc', component: HealthCheckupReportComponent, canActivate: [AuthGuard] },
       { path: 'patient-healthcheckup', component: HealthCheckupReportComponent, canActivate: [AuthGuard] },
       { path: 'In-patient', component: InpatientReportComponent, canActivate: [AuthGuard] },
       { path: 'medical-record', component: MedicalrecordReportComponent, canActivate: [AuthGuard] },
       { path: 'operation-theatre', component: OperationTheatreReportComponent, canActivate: [AuthGuard]},
       { path: 'emergency', component: EmergencyReportComponent, canActivate: [AuthGuard]},
       { path: 'patient-infant', component: InfantsecurityReportComponent, canActivate: [AuthGuard] },
       { path: 'out-patient', component: OutpatientReportComponent, canActivate: [AuthGuard]},
       { path: 'patient-dc', component: DaycareReportComponent, canActivate: [AuthGuard]},
       { path: 'patient-daycare', component: DaycareReportComponent, canActivate: [AuthGuard]},
       { path: 'employee-summary', component: EmployeeReportComponent, canActivate: [AuthGuard] },
       { path: 'porter', component: PorterReportComponent, canActivate: [AuthGuard] },
       { path: 'ai-porter', component: PorterV2ReportComponent, canActivate: [AuthGuard] },
       { path: 'ai-stmust', component: AiStMustComponent, canActivate: [AuthGuard] },
       { path: 'command-center', component: CommandCenterComponent, canActivate: [AuthGuard] },
       { path: 'reports/:id', component: ReportsComponent, canActivate: [AuthGuard] },
       { path: 'schedule-report',component: ScheduleReportComponent,canActivate: [AuthGuard] },
       { path: 'resident', component: ResidentReportComponent, canActivate: [AuthGuard] },
       { path: 'routine', component: RoutineReportComponent, canActivate: [AuthGuard] },
       { path: 'ambulance', component: ambulanceReportComponent, canActivate: [AuthGuard] },
       { path: 'kyn-analytics', component: KynReviewpostManagementComponent, canActivate: [AuthGuard] },
       { path: '', component: HealthCheckupReportComponent, canActivate: [AuthGuard] }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class ReportRoutingModule {}
