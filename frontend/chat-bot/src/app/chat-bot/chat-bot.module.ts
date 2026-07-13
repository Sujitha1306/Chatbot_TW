import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ChatLayoutComponent } from './chat/chat-layout/chat-layout.component';
import { SidebarComponent } from './chat/sidebar/sidebar.component';
import { ChatWelcomeComponent } from './chat/chat-welcome/chat-welcome.component';
import { ChatThreadComponent } from './chat/chat-thread/chat-thread.component';
import { UserMessageComponent } from './chat/user-message/user-message.component';
import { AssistantMessageComponent } from './chat/assistant-message/assistant-message.component';
import { SqlPanelComponent } from './chat/sql-panel/sql-panel.component';
import { DataTableComponent } from './chat/data-table/data-table.component';
import { ChartRendererComponent } from './chat/chart-renderer/chart-renderer.component';
import { ChartSelectorComponent } from './chat/chart-selector/chart-selector.component';
import { FacilityFilterComponent } from './chat/facility-filter/facility-filter.component';

@NgModule({
  declarations: [
    ChatLayoutComponent,
    SidebarComponent,
    ChatWelcomeComponent,
    ChatThreadComponent,
    UserMessageComponent,
    AssistantMessageComponent,
    SqlPanelComponent,
    DataTableComponent,
    ChartRendererComponent,
    ChartSelectorComponent,
    FacilityFilterComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
  ],
  exports: [
    ChatLayoutComponent,
  ],
})
export class ChatBotModule { }
