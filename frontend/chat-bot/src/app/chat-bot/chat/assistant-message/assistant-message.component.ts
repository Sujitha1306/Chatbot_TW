import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { ChatMessage } from '../../models/chat.model';
import { ExportService } from '../../services/export.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-assistant-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assistant-message.component.html',
  styleUrls: ['./assistant-message.component.scss']
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
    if (changes['message']) {
      const msg = this.message;
      if (msg) {
        const canShowChart = msg.chartSpec && !msg.chartSpec.single_value && this.hasChart;
        if (canShowChart) {
          this.showChart = true;
        } else if (msg.chartSpec && !this.hasChart) {
          this.showChart = false;
        }
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
