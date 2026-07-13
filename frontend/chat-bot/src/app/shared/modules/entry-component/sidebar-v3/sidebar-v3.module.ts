import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MaterialModule } from '../../../common/material.module';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarMenuModule } from '../sidebar-menu/sidebar-menu.module';
import { SidebarV3Component } from './sidebar-v3.component';

@NgModule({
  declarations: [SidebarV3Component],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    MaterialModule,
    TranslateModule,
    SidebarMenuModule,
  ],
  exports: [SidebarV3Component],
})
export class SidebarV3Module { }
