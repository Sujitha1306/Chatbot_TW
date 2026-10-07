import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ChatMessage } from '../../models/chat.model';
import { ExportService } from '../../services/export.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-assistant-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assistant-message.component.html',
  styleUrls: ['./assistant-message.component.scss']
})
export class AssistantMessageComponent implements OnChanges, OnInit, OnDestroy {
  @Input() message!: ChatMessage;
  @Input() originalQuestion: string = '';
  @Output() followupClick = new EventEmitter<string>();

  showChart = true;
  showData = false;
  showSql = false;
  showExportMenu = false;
  showMenu = false;
  
  timeElapsed: number = 0;
  /* When true the time/token line stays on screen after the answer finishes.
     When false it behaves as before and is shown only while streaming. */
  /* The server decides which metrics may be shown (GET /chat/metrics-config),
     so these are read from ChatService rather than the Angular build. That
     makes them changeable with an API restart instead of a rebuild. */
  get alwaysShowMetrics(): boolean { return this.chat.metricsConfig.alwaysVisible; }
  get showTime(): boolean { return this.chat.metricsConfig.showTime; }
  get showOutput(): boolean { return this.chat.metricsConfig.showOutput; }
  get showTotal(): boolean { return this.chat.metricsConfig.showTotal; }

  /* True when at least one enabled figure actually has a value to print, so an
     empty bracket never renders. */
  get hasMetrics(): boolean {
    return (this.showTime && this.timeElapsed > 0)
        || (this.showOutput && this.message?.outputTokens !== undefined)
        || (this.showTotal && this.message?.tokensUsed !== undefined);
  }

  private timer: any;
  private startTime: number = 0;

  constructor(private exportSvc: ExportService, public chat: ChatService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.message?.timestamp) {
      this.startTime = new Date(this.message.timestamp).getTime();
    } else {
      this.startTime = Date.now();
    }
    if (this.message?.status === 'pending' || this.message?.status === 'streaming') {
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.cdr.markForCheck();
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      if (this.startTime) {
        this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
      }
      this.cdr.markForCheck();
    }
  }

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

        // The data table is hidden for now, so nothing auto-opens it. When the
        // panel is restored in the template, re-add:
        //   if (this.hasTable && msg.status === 'complete') {
        //     this.showData = !canShowChart;   // collapsed if a chart is shown
        //   }
      }
      
      if (this.message?.status === 'complete' || this.message?.status === 'error') {
        this.stopTimer();
      } else if (!this.timer && (this.message?.status === 'pending' || this.message?.status === 'streaming')) {
        this.startTimer();
      }
    }
  }

  get hasChart(): boolean {
    if (!this.message?.chartSpec?.recommendations) return false;
    return this.message.chartSpec.recommendations.some((r: any) => r.type !== 'table');
  }

  /**
   * A result is worth tabulating when it has more than one row — a breakdown
   * such as shift-by-porter reads far better as a table than as prose.
   * Single-row results are already fully stated in the summary sentence.
   */
  get hasTable(): boolean {
    const rows = this.message?.data;
    return Array.isArray(rows) && rows.length > 1 && Object.keys(rows[0] || {}).length > 1;
  }

  get tableRowLabel(): string {
    const shown = this.message?.data?.length ?? 0;
    const total = this.message?.totalRowCount;
    return total && total > shown ? `${shown} of ${total.toLocaleString()}` : `${shown}`;
  }

  doExport(format: 'csv' | 'excel' | 'pdf') {
    if (this.originalQuestion) {
      this.exportSvc.export(this.originalQuestion, format);
    }
    this.showExportMenu = false;
  }

  private lastClickTime = 0;

  handleFollowupClick(text: string) {
    const now = Date.now();
    if (now - this.lastClickTime < 400) {
      // Double tap/click
      this.lastClickTime = 0;
      this.followupClick.emit(text);
    } else {
      // Single tap/click
      this.lastClickTime = now;
      this.chat.fillInput(text);
    }
  }
}
