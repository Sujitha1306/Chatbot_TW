import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private auth: AuthService) {}

  async export(question: string, format: 'csv' | 'excel' | 'pdf'): Promise<void> {
    const res = await fetch(`${environment.apiUrl}/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.auth.getToken()}`,
      },
      body: JSON.stringify({ question }),
    });
    
    if (!res.ok) {
      console.error('Failed to export', res.statusText);
      return;
    }
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackerwave_export.${format === 'excel' ? 'xlsx' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
