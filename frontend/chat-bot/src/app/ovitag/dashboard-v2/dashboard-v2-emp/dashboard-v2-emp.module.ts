import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { EntryComponentModule } from '../../../shared/modules/entry-component/entry-component.module';
import { SharedPipesModule } from '../../../shared/pipes/shared-pipes.module';
import { DashboardV2EmpComponent } from './dashboard-v2-emp.component';

@NgModule({
  declarations: [DashboardV2EmpComponent],
  exports: [DashboardV2EmpComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    EntryComponentModule.forRoot(),
    SharedPipesModule.forRoot(),
  ],
})
export class DashboardV2EmpModule {}
