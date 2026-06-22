import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../shared/models/chat.model';
import { SqlPanelComponent } from '../sql-panel/sql-panel.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ChartSelectorComponent } from '../chart-selector/chart-selector.component';
import { ExportService } from '../../../core/services/export.service';
import { ChatService } from '../../../core/services/chat.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-assistant-message',
  standalone: true,
  imports: [CommonModule, SqlPanelComponent, DataTableComponent, ChartSelectorComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assistant-message.component.html',
})
export class AssistantMessageComponent implements OnChanges {
  @Input() message!: ChatMessage;
  @Input() originalQuestion: string = '';
  @Output() followupClick = new EventEmitter<string>();

  showChart = true;
  showData = false;
  showSql = false;
  showExportMenu = false;

  constructor(private exportSvc: ExportService, public chat: ChatService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message'] && this.message?.chartSpec) {
      // If there are 1 or fewer chart recommendations (meaning only 'table' or nothing),
      // default to showing the data table and hiding the chart view.
      if (this.message.chartSpec.recommendations && this.message.chartSpec.recommendations.length <= 1) {
        this.showChart = false;
        this.showData = true;
      }
    }
  }

  doExport(format: 'csv' | 'excel' | 'pdf') {
    if (this.originalQuestion) {
      this.exportSvc.export(this.originalQuestion, format);
    }
    this.showExportMenu = false;
  }
}
