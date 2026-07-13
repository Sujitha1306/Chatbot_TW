import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../common/material.module';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarMenuModule } from '../sidebar-menu/sidebar-menu.module';
import { NewSidebarMenuComponent } from './new-sidebarMenu.component';

@NgModule({
  declarations: [NewSidebarMenuComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    TranslateModule,
    SidebarMenuModule,
  ],
  exports: [NewSidebarMenuComponent],
})
export class NewSidebarMenuModule { }
