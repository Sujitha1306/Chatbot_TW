import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../common/material.module';
import { SharedPipesModule } from '../../../pipes/shared-pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgChartsModule } from 'ng2-charts';

import { TwDataTableComponent } from './tw-data-table.component';
import { TwCellDefDirective } from './tw-cell-def.directive';

@NgModule({
  declarations: [
    TwDataTableComponent,
    TwCellDefDirective,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedPipesModule.forRoot(),
    TranslateModule,
    NgChartsModule,
  ],
  exports: [
    TwDataTableComponent,
    TwCellDefDirective,
    NgChartsModule,
  ],
})
export class TwDataTableModule {}
