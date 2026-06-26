import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sql-panel',
  styleUrls: ['./sql-panel.component.scss'],
  template: `
    <div class="sql-panel-container">
      <div class="sql-panel-header">
        <span class="sql-panel-title">SQL Query</span>
        <button (click)="copy()" class="sql-panel-copy-btn">{{ copied ? 'Copied!' : '📋 Copy' }}</button>
      </div>
      <p class="sql-panel-warning">⚠ AI-generated — verify before production use</p>
      <pre class="sql-panel-code">{{ sql }}</pre>
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
