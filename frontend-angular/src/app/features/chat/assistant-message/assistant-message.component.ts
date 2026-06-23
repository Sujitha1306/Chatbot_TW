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
  showMenu = false;

  constructor(private exportSvc: ExportService, public chat: ChatService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message'] && this.message?.chartSpec) {
      if (!this.hasChart) {
        this.showChart = false;
      }
    }
  }

  get hasChart(): boolean {
    if (!this.message?.chartSpec?.recommendations) return false;
    return this.message.chartSpec.recommendations.some((r: any) => r.type !== 'table');
  }

  doExport(format: 'csv' | 'excel' | 'pdf') {
    if (this.originalQuestion) {
      this.exportSvc.export(this.originalQuestion, format);
    }
    this.showExportMenu = false;
  }
}
