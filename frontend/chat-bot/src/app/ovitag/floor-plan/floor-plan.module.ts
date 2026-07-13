import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloorPlanComponent } from './floor-plan.component';
import { EntryComponentModule } from '../../shared/modules/entry-component/entry-component.module';
import { FloorplanRoutingModule } from './floor-plan.routing.module';
import { MaterialModule } from '../../shared/common/material.module';
import { SidemenuModule } from '../../shared/modules/entry-component/sidemenu/sidemenu.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { NgxMaterialTimepickerModule } from '../../shared/modules/material-timepicker/ngx-material-timepicker.module';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../../shared/directive/shared-directives.module';
import { TwTableModule } from '../../shared/modules/entry-component/tw-table/tw-table.module';
import { TwHeaderModule } from '../../shared/modules/entry-component/tw-header/tw-header.module';
import { TranslateModule } from '@ngx-translate/core';
import { ShareModule } from '../../shared/shared.module';
import { CommonLeafletComponent } from '../floor-plan/leaflet/common-leaflet/common-leaflet.component';
import { ManageLocationLeafletComponent } from '../floor-plan/leaflet/common-leaflet/manage-location-leaflet/manage-location-leaflet.component';
import { MatListModule } from '@angular/material/list';



@NgModule({
  imports: [
    CommonModule,
    FloorplanRoutingModule,
    SidemenuModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    CdkTableModule,
    CdkTreeModule,
    NgxMaterialTimepickerModule,
    SharedPipesModule.forRoot(),
    SharedDirectivesModule.forRoot(),
    TwTableModule,
    TwHeaderModule,
    TranslateModule,
    ShareModule,
    MatListModule
  ],

  declarations: [
    FloorPlanComponent,
    CommonLeafletComponent,
    ManageLocationLeafletComponent
  ],

  exports: [
    CommonLeafletComponent,
    ManageLocationLeafletComponent
  ]
})
export class  FloorPlanModule { }
