import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PwaRoutingModule } from './pwa-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PwaComponent } from './pwa.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MaterialModule } from '../shared/common/material.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [PwaComponent],
  imports: [
    CommonModule,
    PwaRoutingModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    TranslateModule,
    MaterialModule
  ]
})
export class PwaModule { }
