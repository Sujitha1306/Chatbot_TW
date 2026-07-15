import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChildren, QueryList } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { DateRange, MatCalendar } from '@angular/material/datepicker';

/**
 * Reusable, compact header date control with a merged toggle icon.
 *  - Single Date mode (default): single calendar icon · Date label · value · ⌄
 *  - Date Range mode: double calendar icon · From · → · To · ⌄
 *    The range opens a popup with TWO independent month calendars side by side —
 *    the left panel sets From, the right panel sets To (each independent; built
 *    from <mat-calendar>, no extra dependency).
 * Presentational: it emits events; the host maps them to its own logic.
 */
@Component({
  selector: 'app-date-control',
  templateUrl: './date-control.component.html',
  styleUrls: ['./date-control.component.scss'],
  providers: [DatePipe],
})
export class DateControlComponent implements OnChanges {
  @Input() date: any;                       // single / from value
  @Input() toDate: any;                     // to value (range mode)
  @Input() mode: 'single' | 'range' | 'year' = 'single';
  @Input() max: any = null;
  @Input() min: any = null;
  @Input() supportRange = true;
  @Input() supportYear = false;
  @Input() yearList: any[] = [];
  @Input() format = 'dd MMM yyyy';

  @Output() dateChange = new EventEmitter<any>();
  @Output() toDateChange = new EventEmitter<any>();
  @Output() modeChange = new EventEmitter<'single' | 'range' | 'year'>();
  @Output() yearChange = new EventEmitter<any>();
  @Output() prev = new EventEmitter<void>();   // kept for host binding compatibility
  @Output() next = new EventEmitter<void>();   // kept for host binding compatibility

  fromCtrl = new FormControl();
  fromText = '';
  toText = '';

  // Unified two consecutive-month range calendar.
  @ViewChildren(MatCalendar) private calendars!: QueryList<MatCalendar<any>>;
  rangeOpen = false;
  selectedRange: DateRange<any> | null = null;  // start..end (drives range shading)
  month1: any = null;     // left calendar month
  month2: any = null;     // right calendar month (month1 + 1, always)
  rangeLabel = '';        // e.g. "June 2026 - July 2026"
  private rangeStart: any = null;   // first-click value while picking
  private picking = false;          // true after the first click, awaiting the second
  private pendingFrom: any = null;  // completed range, emitted only on close
  private pendingTo: any = null;
  minDate: any = null;    // adapter-normalized min for <mat-calendar>
  maxDate: any = null;    // adapter-normalized max for <mat-calendar>

  constructor(private readonly datePipe: DatePipe, private readonly adapter: DateAdapter<any>) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['date']) {
      this.fromCtrl.setValue(this.date, { emitEvent: false });
      this.fromText = this.formatValue(this.date);
    }
    if (changes['toDate']) {
      this.toText = this.formatValue(this.toDate);
    }
    if (changes['min']) { this.minDate = this.toAdapterDate(this.min); }
    if (changes['max']) { this.maxDate = this.toAdapterDate(this.max); }
  }

  toggleMode(): void {
    if (!this.supportRange && !this.supportYear) { return; }

    let nextMode: 'single' | 'range' | 'year';
    if (this.mode === 'single') {
      if (this.supportRange) {
        nextMode = 'range';
      } else if (this.supportYear) {
        nextMode = 'year';
      } else {
        nextMode = 'single';
      }
    } else if (this.mode === 'range') {
      if (this.supportYear) {
        nextMode = 'year';
      } else {
        nextMode = 'single';
      }
    } else { // year
      nextMode = 'single';
    }

    this.mode = nextMode;
    this.modeChange.emit(this.mode);
  }

  onFromChange(value: any): void {
    this.fromText = this.formatValue(value);
    this.dateChange.emit(value);
  }

  onYearChange(value: any): void {
    this.date = value;
    this.yearChange.emit(value);
  }

  onPrevClick(event: Event): void {
    event.stopPropagation();
    this.prev.emit();
  }

  onNextClick(event: Event): void {
    event.stopPropagation();
    this.next.emit();
  }

  // ── Unified two consecutive-month range calendar ────────────────────────────
  openRange(): void {
    const start = this.toAdapterDate(this.date);
    const end = this.toAdapterDate(this.toDate);
    this.month1 = start || this.adapter.today();
    this.month2 = this.adapter.addCalendarMonths(this.month1, 1);   // always the next month
    this.selectedRange = new DateRange<any>(start, end);            // show the existing range shaded
    this.rangeStart = null;
    this.picking = false;
    this.pendingFrom = null;
    this.pendingTo = null;
    this.updateRangeLabel();
    this.rangeOpen = true;
  }

  closeRange(): void {
    this.rangeOpen = false;
    this.picking = false;
    // Refresh the base page only now — emit the completed range (if any) on close.
    if (this.pendingFrom && this.pendingTo) {
      this.dateChange.emit(this.pendingFrom);
      this.toDateChange.emit(this.pendingTo);
      this.pendingFrom = null;
      this.pendingTo = null;
    }
  }

  onRangePick(picked: any): void {
    // FIRST click → set start only. A single click can never set To.
    if (!this.picking || !this.rangeStart) {
      this.rangeStart = picked;
      this.picking = true;
      this.selectedRange = new DateRange<any>(picked, null);
      return;
    }

    // SECOND click before the start → restart from the earlier date
    if (this.adapter.compareDate(picked, this.rangeStart) < 0) {
      this.rangeStart = picked;
      this.selectedRange = new DateRange<any>(picked, null);
      return;
    }

    // SECOND click on/after the start → complete the range. Update the display now,
    // but defer emitting (the base page refresh) until the calendar closes.
    this.selectedRange = new DateRange<any>(this.rangeStart, picked);
    this.fromText = this.formatValue(this.rangeStart);
    this.toText = this.formatValue(picked);
    this.pendingFrom = this.rangeStart;
    this.pendingTo = picked;
    this.picking = false;
    this.rangeStart = null;
  }

  /** Move both calendars by `delta` months (the shared prev/next nav). */
  shiftMonths(delta: number): void {
    this.month1 = this.adapter.addCalendarMonths(this.month1, delta);
    this.month2 = this.adapter.addCalendarMonths(this.month2, delta);
    this.applyCalendarMonths();
    this.updateRangeLabel();
  }

  /** Jump the view to the current month (+ the next). */
  goToday(): void {
    this.month1 = this.adapter.today();
    this.month2 = this.adapter.addCalendarMonths(this.month1, 1);
    this.applyCalendarMonths();
    this.updateRangeLabel();
  }

  private applyCalendarMonths(): void {
    const cals = this.calendars ? this.calendars.toArray() : [];
    if (cals[0]) { cals[0].activeDate = this.month1; }
    if (cals[1]) { cals[1].activeDate = this.month2; }
  }

  private updateRangeLabel(): void {
    this.rangeLabel = `${this.formatMonth(this.month1)} - ${this.formatMonth(this.month2)}`;
  }

  private formatMonth(value: any): string {
    const d = this.toJsDate(value);
    return d ? (this.datePipe.transform(d, 'MMMM yyyy') || '') : '';
  }

  /** Normalize Date / moment / string to the active DateAdapter's type. */
  private toAdapterDate(value: any): any {
    if (!value) { return null; }
    // If it's a number (year), we don't convert it to adapter date
    if (typeof value === 'number' || (typeof value === 'string' && /^\d{4}$/.test(value))) {
      return null;
    }
    const d = this.adapter.deserialize(value);
    return d && this.adapter.isValid(d) ? d : null;
  }

  /** Normalize Date / moment / string to a JS Date for display formatting. */
  private toJsDate(value: any): Date | null {
    if (!value) { return null; }
    // If it's a number (or string that is a 4-digit number), it's likely a year
    if (typeof value === 'number' || (typeof value === 'string' && /^\d{4}$/.test(value))) {
      return null;
    }
    if (value instanceof Date) { return value; }
    if (typeof value.toDate === 'function') { return value.toDate(); } // moment
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatValue(value: any): string {
    if (this.mode === 'year') {
      return value ? String(value) : '';
    }
    const date = this.toJsDate(value);
    return date ? (this.datePipe.transform(date, this.format) || '') : '';
  }
}
