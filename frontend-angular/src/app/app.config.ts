import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { importProvidersFrom } from '@angular/core';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { 
  LucideAngularModule, BarChart2, PieChart, LineChart, ScatterChart,
  Activity, Table, Database, Lightbulb, Clock, Shield, MoreVertical, Check, ChevronDown
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimations(),
    provideToastr(),
    importProvidersFrom(
      PlotlyModule.forRoot(PlotlyJS),
      LucideAngularModule.pick({ 
        BarChart2, PieChart, LineChart, ScatterChart,
        Activity, Table, Database, Lightbulb, Clock, Shield, MoreVertical, Check, ChevronDown
      })
    )
  ]
};
