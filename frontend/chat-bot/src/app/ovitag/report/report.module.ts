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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../../shared/common';
import { ReportRoutingModule } from './report-routing.module';
import { ReportComponent } from './report.component';
import { SidemenuModule } from '../../shared/modules/entry-component/sidemenu/sidemenu.module';
// import { ReaderComponent } from './reader/reader.component';
import { StaffReportComponent } from './staff-report/staff-report.component';
import { StudentReportComponent } from './student-report/student-report.component';
import { AssetReportComponent } from './asset-report/asset-report.component';
import { EnvironmentReportComponent } from './environment-report/environment-report.component';
import { EmployeeReportComponent } from './employee-report/employee-report.component';
import { MaintenanceReportComponent } from './maintenance-report/maintenance-report.component';
import { LocationHistComponent, PorterIdletimeSummaryComponent, PorterReportComponent } from './porter-report/porter-report.component';
import {ReportsComponent} from './reports/reports.component'
import { HealthCheckupReportComponent } from './patient-reports/healthcheckup-report/healthcheckup-report.component';
import { InpatientReportComponent } from './patient-reports/inpatient-report/inpatient-report.component';
import { OperationTheatreReportComponent, OperationTheatreTableComponent } from './patient-reports/operationtheatre-report/optheatre-report.component';
import { EmergencyReportComponent } from './patient-reports/emergency-report/emergency-report.component';
import { MedicalrecordReportComponent } from './patient-reports/medicalrecord-report/medicalrecord-report.component';
import { OutpatientReportComponent } from './patient-reports/outpatient-report/outpatient-report.component';
import { DaycareReportComponent } from './patient-reports/daycare-report/daycare-report.component';
import { AuditlogComponent, AuditLogdataComponent } from './audit-log/auditlog.component';
import { ErrorlogComponent, ErrorLogdataComponent } from './error-log/errorlog.component';
import { ResidentReportComponent } from './resident-report/resident-report.component';
import { PatientSearchComponent } from './patient-search/patient-search.component';
import { NgChartsModule } from 'ng2-charts';
import { NgxGaugeModule } from 'ngx-gauge';
import { EntryComponentModule, NgxMaterialTimepickerModule } from './../../shared';
import {SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { InfantsecurityReportComponent } from './patient-reports/infantsecurity-report/infantsecurity-report.component';
import { TwTableModule } from '../../shared/modules/entry-component/tw-table/tw-table.module';
import { ScheduleReportComponent, CreateScheduleComponent } from './schedule-report/schedule-report.component';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { RoutineReportComponent } from './routine-report/routine-report.component';
import { ambulanceReportComponent } from './ambulance/ambulance-report.component';
import { KynReviewpostManagementComponent } from './kyn-reviewpost-management/kyn-reviewpost-management.component';
import { CdkDetailRowDirective } from './patient-reports/operationtheatre-report/cdk-detail-row.directive';
import {TranslateModule}from"@ngx-translate/core"
import { TwHeaderModule } from '../../shared/modules/entry-component/tw-header/tw-header.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { PorterDateSelectorComponent } from '../../shared/modules/entry-component/ai-date-selector/porter-date-selector.component';
import { PorterV2ReportComponent } from './porter-v2-report/porter-v2-report.component';
import { AiStMustComponent } from './staffMustering-Report/ai-stmust.component';
import { MusteringDateSelectorComponent } from './staffMustering-Report/mustering-dateselector.component';
import { CommandCenterComponent } from './command-center/command-center.component';


@NgModule({
    imports: [
        EntryComponentModule.forRoot(),
        NgxGaugeModule,
        NgChartsModule,
        SidemenuModule,
        CommonModule,
        ReportRoutingModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        NgxMaterialTimepickerModule,
        SharedPipesModule.forRoot(),
        MatProgressSpinnerModule,TwTableModule,
        Ng2GoogleChartsModule,
        TranslateModule,
        TwHeaderModule,
        NgxEchartsModule.forRoot({
          echarts: async () => {
            const echarts = await import('echarts');
            await import('echarts-gl');
            return echarts as any;
          }
        })
    ],
    declarations: [
        CdkDetailRowDirective,
        ReportComponent,
        // ReaderComponent,
        StaffReportComponent,
        StudentReportComponent,
        AssetReportComponent,
        EnvironmentReportComponent,
        MaintenanceReportComponent,
        EmployeeReportComponent,
        PorterReportComponent,
        ambulanceReportComponent,
        ReportsComponent,
        PatientSearchComponent,
        AuditlogComponent,
        AuditLogdataComponent,
        ErrorlogComponent,
        ErrorLogdataComponent,
        HealthCheckupReportComponent,
        InpatientReportComponent,
        OperationTheatreReportComponent,
        OperationTheatreTableComponent,
        EmergencyReportComponent,
        MedicalrecordReportComponent,
        OutpatientReportComponent,
        DaycareReportComponent,
        ResidentReportComponent,
        RoutineReportComponent,
        PorterIdletimeSummaryComponent,
        LocationHistComponent,
     InfantsecurityReportComponent,
     ScheduleReportComponent, CreateScheduleComponent, KynReviewpostManagementComponent,
     PorterDateSelectorComponent,PorterV2ReportComponent,
     AiStMustComponent, MusteringDateSelectorComponent,
     CommandCenterComponent

     ],
     exports: [PorterV2ReportComponent],
})
export class ReportModule { }
