import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

// Angular Material Modules
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Third-party
import { ToastrModule } from 'ngx-toastr';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
PlotlyModule.plotlyjs = PlotlyJS;

// Components
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { ChatLayoutComponent } from './features/chat/chat-layout/chat-layout.component';
import { SidebarComponent } from './features/chat/sidebar/sidebar.component';
import { ChatThreadComponent } from './features/chat/chat-thread/chat-thread.component';
import { ChatWelcomeComponent } from './features/chat/chat-welcome/chat-welcome.component';
import { UserMessageComponent } from './features/chat/user-message/user-message.component';
import { AssistantMessageComponent } from './features/chat/assistant-message/assistant-message.component';
import { FacilityFilterComponent } from './features/chat/facility-filter/facility-filter.component';
import { ChartSelectorComponent } from './features/chat/chart-selector/chart-selector.component';
import { ChartRendererComponent } from './features/chat/chart-renderer/chart-renderer.component';
import { SqlPanelComponent } from './features/chat/sql-panel/sql-panel.component';
import { DataTableComponent } from './features/chat/data-table/data-table.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ChatLayoutComponent,
    SidebarComponent,
    ChatThreadComponent,
    ChatWelcomeComponent,
    UserMessageComponent,
    AssistantMessageComponent,
    FacilityFilterComponent,
    ChartSelectorComponent,
    ChartRendererComponent,
    SqlPanelComponent,
    DataTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    
    // Material
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatMenuModule,
    MatTableModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    
    ToastrModule.forRoot(),
    PlotlyModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
