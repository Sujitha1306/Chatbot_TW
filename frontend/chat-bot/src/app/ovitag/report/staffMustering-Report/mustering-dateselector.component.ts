import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef,
  HostListener, NgZone
} from '@angular/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { take } from 'rxjs/operators';

export interface MusteringDateChange {
  periodType: string;
  from: string;
  to:   string;
  apply?: boolean;
}

@Component({
  selector: 'mustering-dateselector',
  templateUrl: './mustering-dateselector.component.html',
  styleUrls: ['./mustering-dateselector.component.scss']
})
export class MusteringDateSelectorComponent implements OnInit, OnChanges {

  constructor(private ngZone: NgZone) {}

  @Input() periodType  = 'Date Range';
  @Input() initialFrom = '';
  @Input() initialTo   = '';
  @Input() mode: 'default' | 'year' = 'default';
  @Output() dateChange = new EventEmitter<MusteringDateChange>();

  @ViewChild('panelRef')   panelRef:   ElementRef;
  @ViewChild('triggerRef') triggerRef: ElementRef;

  // Mat-datepicker refs — used to open the calendar popup in date mode
  @ViewChild('fromDatePicker') fromDatePickerRef?: MatDatepicker<Date>;
  @ViewChild('toDatePicker')   toDatePickerRef?:   MatDatepicker<Date>;

  // Mat-datepicker input directive refs — used to read selected value after close
  @ViewChild('fromDateInput', { read: MatDatepickerInput }) fromInputRef?: MatDatepickerInput<Date>;
  @ViewChild('toDateInput',   { read: MatDatepickerInput }) toInputRef?:   MatDatepickerInput<Date>;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly MAX_DATE_DAYS    = 730;
  readonly MAX_MONTH_MONTHS = 60;
  readonly MAX_YEAR_YEARS   = 10;
  readonly today            = new Date();

  readonly customPeriods = [
    { label: 'Date',  icon: 'calendar_today', value: 'Date'  },
    { label: 'Month', icon: 'calendar_month', value: 'Month' },
    { label: 'Year',  icon: 'event',          value: 'Year'  },
  ];

  readonly quickPresets = [
    { label: 'Yesterday',    icon: 'calendar_today' },
    { label: 'Last 7 Days',  icon: 'date_range'     },
    { label: 'Last 30 Days', icon: 'date_range'     },
    { label: 'This Month',   icon: 'calendar_month' },
    { label: 'Last Month',   icon: 'calendar_month' },
    { label: 'This Year',    icon: 'event'          },
    { label: 'Last Year',    icon: 'event'          },
  ];

  // Month names for the custom month picker grid
  readonly months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  get visibleCustomPeriods() {
    return this.mode === 'year'
      ? this.customPeriods.filter(p => p.value === 'Year')
      : this.customPeriods;
  }

  get visibleQuickPresets() {
    return this.mode === 'year'
      ? this.quickPresets.filter(p => p.label === 'This Year' || p.label === 'Last Year')
      : this.quickPresets;
  }

  quarters: { label: string; range: string; disabled: boolean }[] = [];

  private buildQuarters() {
    const month = new Date().getMonth() + 1;
    this.quarters = [
      { label: 'Q1', range: 'Jan 1 – Mar 31',  disabled: month < 1  },
      { label: 'Q2', range: 'Apr 1 – Jun 30',  disabled: month < 4  },
      { label: 'Q3', range: 'Jul 1 – Sep 30',  disabled: month < 7  },
      { label: 'Q4', range: 'Oct 1 – Dec 31',  disabled: month < 10 },
    ];
  }

  // ── State ─────────────────────────────────────────────────────────────────
  selectedPeriod        = 'Date Range';
  fromVal               = '';
  toVal                 = '';
  // Staging area: (dateChange) stores here; closedStream applies inside ngZone.run()
  private _pendingFromDate: Date | null = null;
  private _pendingToDate:   Date | null = null;
  errorMsg              = '';
  isPanelOpen           = false;
  isFromPickerOpen      = false;
  isToPickerOpen        = false;
  fromPickerYear        = new Date().getFullYear();
  toPickerYear          = new Date().getFullYear();
  fromPickerDecade      = Math.floor(new Date().getFullYear() / 10) * 10;
  toPickerDecade        = Math.floor(new Date().getFullYear() / 10) * 10;
  private _skipDocClick = false;

  // ── Computed ──────────────────────────────────────────────────────────────
  // Year mode (V5) takes a single year only — internally expanded to Jan 1 – Dec 31 of that year.
  get isRange(): boolean { return this.mode !== 'year'; }

  get inputType(): 'date' | 'month' | 'year' {
    if (this.selectedPeriod === 'Month') return 'month';
    if (this.selectedPeriod === 'Year')  return 'year';
    return 'date';
  }

  get todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  get thisYear():  number { return this.today.getFullYear(); }
  get thisMonth(): number { return this.today.getMonth(); }

  // Year grids for the custom year picker
  get fromDecadeYears(): number[] { return Array.from({ length: 12 }, (_, i) => this.fromPickerDecade + i); }
  get toDecadeYears():   number[] { return Array.from({ length: 12 }, (_, i) => this.toPickerDecade   + i); }

  // ── Mat-datepicker value bindings (date mode only) ────────────────────────
  get fromValDate(): Date | null { return this.strToDate(this.fromVal); }
  get toValDate():   Date | null { return this.strToDate(this.toVal);   }

  private strToDate(val: string): Date | null {
    if (!val) return null;
    const type = this.inputType;
    if (type === 'year') return new Date(parseInt(val, 10), 6, 1);
    if (type === 'month') {
      const [y, m] = val.split('-');
      return new Date(+y, +m - 1, 1);
    }
    // Use local midnight so the Date matches what NativeDateAdapter emits on click,
    // keeping sameDate() comparisons and calendar highlighting consistent.
    const [y, m, d] = val.split('-');
    return new Date(+y, +m - 1, +d);
  }

  // ── Display labels shown in the pill ─────────────────────────────────────
  get displayFrom(): string { return this.formatVal(this.fromVal); }
  get displayTo():   string { return this.formatVal(this.toVal);   }

  private formatVal(val: string): string {
    if (!val) return '—';
    const type = this.inputType;
    if (type === 'year') return val;
    if (type === 'month') {
      const [y, m] = val.split('-');
      return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    const [y, m, d] = val.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Pad a number to 2 digits — used in template active-check expressions
  pad(n: number): string { return String(n).padStart(2, '0'); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.buildQuarters();
    this.selectedPeriod = this.mode === 'year' ? 'Year' : (this.periodType || 'Date');
    const { from, to } = this.resolveDefaults();
    this.fromVal = this.toNativeFormat(from, this.inputType);
    this.toVal   = this.isRange ? this.toNativeFormat(to, this.inputType) : '';
    this.syncPickerNav();
    this.emit();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] && !changes['mode'].firstChange) {
      if (this.mode === 'year') {
        this.selectedPeriod = 'Year';
        const yr = String(new Date().getFullYear());
        this.fromVal = yr;
        this.toVal   = '';
      } else {
        this.selectedPeriod = this.periodType || 'Date';
        const { from, to } = this.resolveDefaults();
        this.fromVal = this.toNativeFormat(from, this.inputType);
        this.toVal   = this.toNativeFormat(to,   this.inputType);
      }
      this.errorMsg = '';
      this.closeAllPickers();
      this.syncPickerNav();
      this.emit(true);
      return;
    }
  }

  // Sync the picker's year/decade nav to match the current fromVal/toVal
  private syncPickerNav() {
    if (this.inputType === 'month') {
      if (this.fromVal) this.fromPickerYear = +this.fromVal.split('-')[0];
      if (this.toVal)   this.toPickerYear   = +this.toVal.split('-')[0];
    } else if (this.inputType === 'year') {
      const fy = this.fromVal ? +this.fromVal : new Date().getFullYear();
      const ty = this.toVal   ? +this.toVal   : new Date().getFullYear();
      this.fromPickerDecade = Math.floor(fy / 10) * 10;
      this.toPickerDecade   = Math.floor(ty / 10) * 10;
    }
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  @HostListener('document:click')
  onDocClick() {
    if (this._skipDocClick) { this._skipDocClick = false; return; }
    if (!this.isPanelOpen && !this.isFromPickerOpen && !this.isToPickerOpen) return;
    this.isPanelOpen      = false;
    this.isFromPickerOpen = false;
    this.isToPickerOpen   = false;
  }

  togglePanel() {
    this._skipDocClick = true;
    this.closeAllPickers();
    this.isPanelOpen = !this.isPanelOpen;
  }

  private closeAllPickers() {
    this.isFromPickerOpen = false;
    this.isToPickerOpen   = false;
  }

  selectCustomPeriod(period: string) {
    const oldType = this.detectTypeFromValue(this.fromVal);
    this.selectedPeriod = period;
    const newType = this.inputType;
    const apiFrom = this.toApiDate(this.fromVal, oldType, 'start');
    this.fromVal  = this.toNativeFormat(apiFrom, newType);
    if (this.isRange) {
      const apiTo = this.toApiDate(this.toVal || this.fromVal, oldType, 'end');
      this.toVal  = this.toNativeFormat(apiTo, newType);
      if (this.toVal < this.fromVal) this.toVal = this.fromVal;
    } else {
      this.toVal = '';
    }
    this.errorMsg    = '';
    this.isPanelOpen = false;
    this.closeAllPickers();
    this.syncPickerNav();
    this.emit(true);
  }

  selectQuarter(label: string) {
    const yr = new Date().getFullYear();
    const map: Record<string, { from: string; to: string }> = {
      'Q1': { from: `${yr}-01-01`, to: `${yr}-03-31` },
      'Q2': { from: `${yr}-04-01`, to: `${yr}-06-30` },
      'Q3': { from: `${yr}-07-01`, to: `${yr}-09-30` },
      'Q4': { from: `${yr}-10-01`, to: `${yr}-12-31` },
    };
    const q = map[label];
    if (!q) return;
    this.selectedPeriod = 'Date';
    this.fromVal        = q.from;
    this.toVal          = q.to;
    this.errorMsg       = '';
    this.isPanelOpen    = false;
    this.closeAllPickers();
    this.dateChange.emit({ periodType: 'Date', from: q.from, to: q.to, apply: true });
  }

  selectPreset(preset: string) {
    const today = new Date();
    const fmt  = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fmtM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    switch (preset) {
      case 'Yesterday': {
        const y = new Date(today); y.setDate(today.getDate() - 1);
        this.selectedPeriod = 'Date'; this.fromVal = fmt(y); this.toVal = ''; break;
      }
      case 'Last 7 Days': {
        const f = new Date(today); f.setDate(today.getDate() - 7);
        this.selectedPeriod = 'Date'; this.fromVal = fmt(f); this.toVal = fmt(today); break;
      }
      case 'Last 30 Days': {
        const f = new Date(today); f.setDate(today.getDate() - 30);
        this.selectedPeriod = 'Date'; this.fromVal = fmt(f); this.toVal = fmt(today); break;
      }
      case 'This Month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        this.selectedPeriod = 'Month'; this.fromVal = fmtM(firstDay); this.toVal = fmtM(today); break;
      }
      case 'Last Month': {
        const lm  = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lme = new Date(today.getFullYear(), today.getMonth(), 0);
        this.selectedPeriod = 'Month'; this.fromVal = fmtM(lm); this.toVal = fmtM(lme); break;
      }
      case 'This Year': {
        const yr = String(today.getFullYear());
        this.selectedPeriod = 'Year'; this.fromVal = yr; this.toVal = yr; break;
      }
      case 'Last Year': {
        const ly = String(today.getFullYear() - 1);
        this.selectedPeriod = 'Year'; this.fromVal = ly; this.toVal = ly; break;
      }
    }
    this.errorMsg    = '';
    this.isPanelOpen = false;
    this.closeAllPickers();
    this.syncPickerNav();
    this.emit(true);
  }

  // ── Pill click → open picker ──────────────────────────────────────────────
  openFromPicker() {
    if (this.inputType === 'date') {
      if (!this.fromDatePickerRef) return;
      this._pendingFromDate = null;
      // (dateChange) on the hidden input captures the Date into _pendingFromDate.
      // closedStream fires after the animation — we then apply it inside ngZone.run()
      // so Angular CD sees the change and updates the pill display.
      this.fromDatePickerRef.closedStream.pipe(take(1)).subscribe(() => {
        this.ngZone.run(() => {
          const d = this._pendingFromDate;
          this._pendingFromDate = null;
          if (d) {
            const newVal = this.dateToStr(d);
            if (newVal !== this.fromVal) {
              this.fromVal = newVal;
              this.onFromChange();
            }
          }
        });
      });
      this.fromDatePickerRef.open();
      return;
    }
    this._skipDocClick = true;
    this.isToPickerOpen   = false;
    this.isPanelOpen      = false;
    this.isFromPickerOpen = !this.isFromPickerOpen;
    if (this.isFromPickerOpen) { this.syncPickerNav(); }
  }

  openToPicker() {
    if (this.inputType === 'date') {
      if (!this.toDatePickerRef) return;
      this._pendingToDate = null;
      this.toDatePickerRef.closedStream.pipe(take(1)).subscribe(() => {
        this.ngZone.run(() => {
          const d = this._pendingToDate;
          this._pendingToDate = null;
          if (d) {
            const newVal = this.dateToStr(d);
            if (newVal !== this.toVal) {
              this.toVal = newVal;
              this.onToChange();
            }
          }
        });
      });
      this.toDatePickerRef.open();
      return;
    }
    this._skipDocClick = true;
    this.isFromPickerOpen = false;
    this.isPanelOpen      = false;
    this.isToPickerOpen   = !this.isToPickerOpen;
    if (this.isToPickerOpen) { this.syncPickerNav(); }
  }

  // ── Custom month picker selections ────────────────────────────────────────
  selectFromMonth(monthIndex: number) {
    this.fromVal          = `${this.fromPickerYear}-${this.pad(monthIndex + 1)}`;
    this.isFromPickerOpen = false;
    this.onFromChange();
  }

  selectToMonth(monthIndex: number) {
    this.toVal          = `${this.toPickerYear}-${this.pad(monthIndex + 1)}`;
    this.isToPickerOpen = false;
    this.onToChange();
  }

  // ── Custom year picker selections ─────────────────────────────────────────
  selectFromYear(year: number) {
    this.fromVal          = String(year);
    this.isFromPickerOpen = false;
    this.onFromChange();
  }

  selectToYear(year: number) {
    this.toVal          = String(year);
    this.isToPickerOpen = false;
    this.onToChange();
  }

  // ── Mat-datepicker capture handlers ──────────────────────────────────────
  // Called by (dateChange) on the hidden input — just stores the Date.
  // The closedStream subscriber (in openFromPicker/openToPicker) reads it inside ngZone.run().
  captureFromDate(event: MatDatepickerInputEvent<Date>) {
    if (event.value) this._pendingFromDate = event.value;
  }

  captureToDate(event: MatDatepickerInputEvent<Date>) {
    if (event.value) this._pendingToDate = event.value;
  }

  private dateToStr(d: any): string {
    const date = d instanceof Date ? d : new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // ── Date input change delegates ───────────────────────────────────────────
  onFromChange() {
    if (this.isRange && this.toVal && this.toVal < this.fromVal) {
      this.toVal = this.fromVal;
    }
    this.emit(false, true);
  }

  onToChange() {
    if (this.toVal < this.fromVal) this.toVal = this.fromVal;
    this.emit(false, true);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  private validate(): boolean {
    this.errorMsg = '';
    const type    = this.inputType;

    if (this.fromVal && this.toApiDate(this.fromVal, type, 'start') > this.todayStr) {
      this.errorMsg = 'Selected date cannot be in the future.';
      return false;
    }

    if (this.isRange && this.toVal) {
      const fromApi = this.toApiDate(this.fromVal, type, 'start');
      const toApi   = this.toApiDate(this.toVal,   type, 'end');

      if (this.toVal < this.fromVal) { this.errorMsg = 'End date must be on or after start date.'; return false; }

      const days = (new Date(toApi).getTime() - new Date(fromApi).getTime()) / 86400000;
      if (type === 'date'  && days > this.MAX_DATE_DAYS)    { this.errorMsg = `Date range cannot exceed ${this.MAX_DATE_DAYS / 365} years.`; return false; }
      if (type === 'month' && this.monthDiff(fromApi, toApi) > this.MAX_MONTH_MONTHS) { this.errorMsg = `Month range cannot exceed ${this.MAX_MONTH_MONTHS} months.`; return false; }
      if (type === 'year'  && (parseInt(this.toVal) - parseInt(this.fromVal)) > this.MAX_YEAR_YEARS) { this.errorMsg = `Year range cannot exceed ${this.MAX_YEAR_YEARS} years.`; return false; }
    }
    return true;
  }

  private monthDiff(f: string, t: string): number {
    const fd = new Date(f), td = new Date(t);
    return (td.getFullYear() - fd.getFullYear()) * 12 + (td.getMonth() - fd.getMonth());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private resolveDefaults(): { from: string; to: string } {
    const localFmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = localFmt(new Date());
    return { from: this.initialFrom || today, to: this.initialTo || today };
  }

  private detectTypeFromValue(val: string): 'date' | 'month' | 'year' {
    if (!val) return 'date';
    if (/^\d{4}$/.test(val.trim()))       return 'year';
    if (/^\d{4}-\d{2}$/.test(val.trim())) return 'month';
    return 'date';
  }

  private toNativeFormat(apiDate: string, type: 'date' | 'month' | 'year'): string {
    if (!apiDate) return '';
    if (type === 'date')  return apiDate.slice(0, 10);
    if (type === 'month') return apiDate.slice(0, 7);
    if (type === 'year')  return apiDate.slice(0, 4);
    return apiDate.slice(0, 10);
  }

  private toApiDate(val: string, type: 'date' | 'month' | 'year', end: 'start' | 'end'): string {
    if (!val) return end === 'start'
      ? new Date(new Date().setDate(new Date().getDate()-1)).toISOString().slice(0,10)
      : new Date().toISOString().slice(0,10);
    if (type === 'date')  return val.slice(0, 10);
    if (type === 'month') {
      const [y, m] = val.split('-').map(Number);
      if (end === 'start') return `${y}-${String(m).padStart(2,'0')}-01`;
      return `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`;
    }
    if (type === 'year') {
      const y = val.trim();
      return end === 'start' ? `${y}-01-01` : `${y}-12-31`;
    }
    return val.slice(0, 10);
  }

  private emit(force = false, applyOverride = force) {
    if (!force && !this.validate()) return;
    const type = this.inputType;
    this.dateChange.emit({
      periodType: this.selectedPeriod,
      from: this.toApiDate(this.fromVal, type, 'start'),
      to:   this.isRange
        ? this.toApiDate(this.toVal || this.fromVal, type, 'end')
        : this.toApiDate(this.fromVal, type, 'end'),
      apply: applyOverride
    });
  }
}
