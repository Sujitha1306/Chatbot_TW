import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sql-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-gray-200 rounded-xl mt-2 overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span class="text-xs font-medium">SQL Query</span>
        <button (click)="copy()" class="text-xs text-brand-primary">{{ copied ? 'Copied!' : '📋 Copy' }}</button>
      </div>
      <p class="text-xs text-amber-600 px-3 pt-2">⚠ AI-generated — verify before production use</p>
      <pre class="text-xs p-3 overflow-x-auto font-mono text-gray-700">{{ sql }}</pre>
    </div>
  `,
})
export class SqlPanelComponent {
  @Input() sql!: string;
  copied = false;

  copy() {
    navigator.clipboard.writeText(this.sql);
    this.copied = true;
    setTimeout(() => this.copied = false, 1500);
  }
}
