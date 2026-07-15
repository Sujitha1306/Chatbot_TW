import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, NgZone, Optional, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService, CommonService } from '../../../shared';
import { GridStack } from 'gridstack';
import { EChartsOption } from 'echarts';
import { environment } from '../../../../environments/environment';

/**
 * Staff Mustering analytics dashboard (AI Staff Mustering).
 * Mirrors the AI OT dashboard pattern: GridStack 12-col layout, ECharts widgets,
 * ResizeObserver-driven chart resizing.
 *
 * Activity selection: the dropdown is populated from the `ai-mustering-events`
 * analytics API (events for the selected date + facility). Selecting one loads
 * its summary from `ai-mustering-summary`.
 */

/** When true, calls twanalytics directly (localhost:8000) instead of via CommonService. */
const localTesting  = true;   // call twanalytics directly (localhost:8000), like the OT dashboard
const LOCAL_API_BASE = environment.base_value;

const CELL_HEIGHT = 80;
const HEADER_H    = 24;
const MARGIN_V    = 5;   // vertical gap between widgets
const MARGIN_H    = 6;   // horizontal gap between widgets

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Returns YYYY-MM-DD from a datetime string. */
function toDateOnly(dt: string): string {
  if (!dt) return '';
  return dt.length >= 10 ? dt.substring(0, 10) : dt;
}

/** "2024-05-19" -> "19 May 2024" (falls back to input on parse failure). */
function formatReportDate(dt: string): string {
  if (!dt) return '';
  const d = toDateOnly(dt);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

function initOpts(rows: number) {
  return { renderer: 'canvas' as const, height: rows * CELL_HEIGHT - HEADER_H - MARGIN_V * 2 };
}

interface MusteringActivity {
  id: string;
  label: string;
  date: string;
  type: string;
}

@Component({
  selector: 'app-ai-stmust',
  templateUrl: './ai-stmust.component.html',
  styleUrls: ['./ai-stmust.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AiStMustComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Layout selector ───────────────────────────────────────────────────────
  layouts = [
    { key: 'mustering-summary', label: 'Mustering Summary' },
    { key: 'mustering-events',  label: 'Mustering Events' },
  ];
  selectedLayout = 'mustering-summary';

  // When opened as a popup (e.g. from the Staff Mustering history tab), a single
  // event's report is shown directly and the date/activity/layout header is hidden.
  isPopup = false;

  onLayoutChange(key: string) {
    this.destroyGridStack();
    this.selectedLayout = key;
    if (key === 'mustering-summary') {
      this.fetchOverallSummary();
    }
    this.cdr.detectChanges();
    Promise.resolve().then(() => {
      this.cdr.detectChanges();
      if (key === 'mustering-events' && this.dataReady) {
        setTimeout(() => this.waitForGridAndInit(), 50);
      }
    });
  }

  // ── Mustering Summary (overall across all events) ─────────────────────────
  summaryDataReady = false;
  summaryKpiCards: { label: string; value: any; sub: string; icon: string; iconClass: string; valueClass: string }[] = [];
  summaryStatusLegend: { name: string; value: number; pct: number; color: string }[] = [];
  summaryEventsBarOpt: EChartsOption = {};
  summaryStatusDonutOpt: EChartsOption = {};
  summaryZonePerfOpt: EChartsOption = {};
  summaryComplianceOpt: EChartsOption = {};
  summaryActivityRows: { name: string; date: string; personnel: number; mustered: number; efficiency: number; duration: string }[] = [];

  // ── Summary activity table pagination ─────────────────────────────────────
  summaryPage = 1;
  readonly summaryPageSize = 10;

  get summaryPagedRows() {
    const start = (this.summaryPage - 1) * this.summaryPageSize;
    return this.summaryActivityRows.slice(start, start + this.summaryPageSize);
  }

  get summaryTotalPages() {
    return Math.ceil(this.summaryActivityRows.length / this.summaryPageSize) || 1;
  }

  get summaryStartRow() { return (this.summaryPage - 1) * this.summaryPageSize + 1; }
  get summaryEndRow()   { return Math.min(this.summaryPage * this.summaryPageSize, this.summaryActivityRows.length); }

  get summaryPageNumbers(): (number | '...')[] {
    const total = this.summaryTotalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const cur = this.summaryPage;
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  goToSummaryPage(page: number | '...') {
    if (typeof page !== 'number') return;
    this.summaryPage = Math.max(1, Math.min(page, this.summaryTotalPages));
  }

  // ── AI date selector state ──────────────────────────────────────────────
  aiPeriodType = 'Date';
  aiDateFrom   = '';
  aiDateTo     = '';

  // ── Activity selector (combo) ─────────────────────────────────────────────
  // Populated from the ai-mustering-events analytics API for the selected date.
  activities: MusteringActivity[] = [];
  selectedActivityId = '';
  eventsLoading = false;
  // Browser timezone passed to the analytics API (?tz=) for day-window + display conversion.
  private readonly tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  reportData: any = {};
  dataReady = false;
  reportTitle = '';
  reportSub   = '';

  // ── KPI cards ───────────────────────────────────────────────────────────
  kpiCards: {
    label: string; value: any; sub?: string; badge?: string; badgeClass?: string;
    icon: string; iconClass: string; valueClass: string; small?: boolean;
  }[] = [];

  // ── Mustering status distribution (donut + custom legend) ────────────────
  statusDonutOpt: EChartsOption = {};
  statusLegend: { name: string; value: number; pct: number; color: string }[] = [];
  statusTotal = 0;

  // ── Event timeline ────────────────────────────────────────────────────────
  timeline: { time: string; label: string; type: string; icon: string }[] = [];

  // ── Safe-zone population over time ──────────────────────────────────────────
  populationTrendOpt: EChartsOption = {};
  populationEmpty = false;

  // ── Zone performance (avg mustering time) ───────────────────────────────────
  zonePerfOpt: EChartsOption = {};
  zoneEmpty = false;

  // ── Most congested zones ────────────────────────────────────────────────────
  congestedZones: { zone: string; density: number; level: string; levelClass: string }[] = [];

  // ── Mustering route analysis (Sankey flow) ──────────────────────────────────
  routeFlowOpt: EChartsOption = {};

  // ── Incident details (key/value panel) ──────────────────────────────────────
  incidentRows: { label: string; value: string; valueClass?: string }[] = [];

  // ── Mustering efficiency (gauge) ─────────────────────────────────────────────
  efficiencyOpt: EChartsOption = {};
  efficiencyLabel = '';

  // ── Mustering funnel ─────────────────────────────────────────────────────────
  funnelOpt: EChartsOption = {};

  io2 = initOpts(2);
  io4 = initOpts(4);
  io3 = initOpts(3);
  io5 = initOpts(5);
  io6 = initOpts(6);

  // ── Personnel mustering table ───────────────────────────────────────────────
  personnelRows: any[] = [];
  personnelCols = [
    { key: 'emp_id',      label: 'ID' },
    { key: 'name',        label: 'Name' },
    { key: 'zone',        label: 'Zone / Location' },
    { key: 'muster_time', label: 'Mustering Time' },
    { key: 'status',      label: 'Status' },
  ];
  // ── Personnel table search + sort ───────────────────────────────────────────
  searchTerm = '';
  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';

  readonly STATUS_COLOR: { [k: string]: string } = {
    'Mustered':    '#2E7D32',
    'In Progress': '#1976D2',
    'Not Reached': '#EF5350',
    'Visitors':    '#7E57C2',
  };

  private chartInstances = new Map<string, any>();
  private grid: GridStack;
  private resizeObserver: ResizeObserver | null = null;
  private rafPending = false;

  constructor(
    private CommonService: CommonService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,private readonly apiService: ApiService,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {}

  ngOnInit() {
    // Default date = today (mustering is reviewed same-day).
    const today = new Date().toISOString().slice(0, 10);
    this.aiDateFrom   = today;
    this.aiDateTo     = today;
    this.aiPeriodType = 'Date';

    // Opened as a popup for a specific mustering event (e.g. from the history
    // tab) — go straight to that event's report, skip the events dropdown.
    if (this.dialogData?.requestId) {
      this.isPopup = true;
      this.selectedLayout = 'mustering-events';
      this.selectedActivityId = String(this.dialogData.requestId);
      // Scope the fdt/tdt window to the event's own date — the summary API
      // filters by date range, so defaulting to "today" returns an empty/zero
      // report for any event that didn't occur today.
      if (this.dialogData.date) {
        const eventDate     = toDateOnly(this.dialogData.date);
        this.aiDateFrom = eventDate;
        this.aiDateTo   = eventDate;
      }
      this.fetchEventReport(this.selectedActivityId);
      return;
    }

    // Load mustering events; for mustering-summary layout this also triggers fetchOverallSummary.
    this.fetchMusteringEvents();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    this.destroyGridStack();
  }

  get selectedActivity(): MusteringActivity | undefined {
    return this.activities.find(a => a.id === this.selectedActivityId);
  }

  // ── AI Date Selector handler ──────────────────────────────────────────────
  onAiDateChange(event: { periodType: string; from: string; to: string; apply?: boolean }) {
    // Manual date edits emit apply=false; presets/quarters emit apply=true.
    // Re-fetch events whenever the date actually changes (skips the duplicate
    // emit on initial load where the date matches what ngOnInit already fetched).
    const changed = event.from !== this.aiDateFrom || event.to !== this.aiDateTo;
    this.aiPeriodType = event.periodType;
    this.aiDateFrom   = event.from;
    this.aiDateTo     = event.to;
    if (event.apply || changed) {
      this.destroyGridStack();
      this.fetchMusteringEvents();
    }
  }

  // ── Activity change handler ───────────────────────────────────────────────
  onActivityChange() {
    this.destroyGridStack();
    this.getReports();
  }

  /** Fetches staff-mustering events for the selected date + facility from the
   *  ai-mustering-events analytics API, populates the dropdown, auto-selects the
   *  first event, and loads its summary. Events are resolved server-side as
   *  request.type='RQT-TASK' + pf_activity.routine_type_id='TAC-SFE'. */
  private fetchMusteringEvents() {
    this.eventsLoading      = true;
    this.activities         = [];
    this.selectedActivityId = '';
    this.dataReady          = false;
    this.reportData         = { loading: true, noRecords: false };

    const date = toDateOnly(this.aiDateFrom);

    const onEvents = (events: any[]) => this.zone.run(() => {
      this.eventsLoading = false;
      this.activities = (events || []).map(e => ({
        id: String(e.event_id),
        label: this.eventLabel(e),
        date,
        type: e.status_name || '',
      }));
      this.selectedActivityId = this.activities.length ? this.activities[0].id : '';
      if (this.selectedLayout === 'mustering-summary') {
        this.fetchOverallSummary();
      } else if (this.selectedActivityId) {
        this.getReports();
      } else {
        this.reportData = { loading: false, noRecords: true };
      }
    });
    const onError = () => this.zone.run(() => {
      this.eventsLoading = false;
      this.reportData = { loading: false, noRecords: true };
    });

    const fdt = toDateOnly(this.aiDateFrom);
    const tdt = toDateOnly(this.aiDateTo);
    const param = `?fdt=${fdt}&tdt=${tdt}&tz=${encodeURIComponent(this.tz)}`;
    if (localTesting) {
      // apiService.get() still returns the { statusCode, results, message } envelope.
      const facilityId = localStorage.getItem(btoa('facilityId'));
      const url = `api/python-wrapper/reports/ai-mustering-events/0/0/${facilityId}${param}`;
      this.apiService.get(url).subscribe((res: any) => onEvents(res?.results?.data?.events), onError);
    } else {
      this.CommonService.getReportData('ai-mustering-events', param).subscribe(
        (res: any) => onEvents(res?.results?.data?.events),
        onError
      );
    }
  }

  /** "Fire Drill – 24 Jun 2026, 10:24 AM" from an event row (day = selected IST date). */
  private eventLabel(e: any): string {
    const day  = formatReportDate(toDateOnly(this.aiDateFrom));
    const time = this.formatTime(e.event_time);
    const name = e.activity_name || e.request_identifier || 'Mustering Event';
    return time ? `${name} – ${day}, ${time}` : `${name} – ${day}`;
  }

  /** Formats a datetime to local "h:mm AM/PM" (empty on parse failure). */
  private formatTime(dt: string): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  getReports() {
    if (this.selectedLayout === 'mustering-summary') {
      this.fetchOverallSummary();
      return;
    }
    const act = this.selectedActivity;
    if (!act) { this.reportData = { loading: false, noRecords: true }; this.dataReady = false; return; }
    this.fetchEventReport(act.id);
  }

  /** Fetches ai-mustering-summary for a single event id — used both for the
   *  events-dropdown flow and the direct popup (history tab) flow. */
  private fetchEventReport(eventId: string) {
    this.reportData = { loading: true, noRecords: false };
    this.dataReady  = false;

    const onSuccess = (res: any) => this.zone.run(() => {
      this.reportData.loading = false;
      this.handleResponse(res?.results);
    });
    const onError = () => this.zone.run(() => {
      this.reportData.loading = false;
      this.reportData.noRecords = true;
    });

    const fdt = toDateOnly(this.aiDateFrom);
    const tdt = toDateOnly(this.aiDateTo);
    const param = `/eventId=${eventId}&fdt=${fdt}&tdt=${tdt}`;
    if (localTesting) {
      const facilityId = localStorage.getItem(btoa('facilityId'));
      const url = `api/python-wrapper/reports/ai-mustering-summary/0/0/${facilityId}${param}`;
      this.apiService.get(url).subscribe(onSuccess, onError);
    } else {
      this.CommonService.getReportData('ai-mustering-summary', param).subscribe(onSuccess, onError);
    }
  }

  private fetchOverallSummary() {
    this.reportData = { loading: true, noRecords: false };
    this.summaryDataReady = false;

    const fdt = toDateOnly(this.aiDateFrom);
    const tdt = toDateOnly(this.aiDateTo);
    const param = `/fdt=${fdt}&tdt=${tdt}`;

    const onSuccess = (res: any) => this.zone.run(() => {
      this.reportData.loading = false;
      this.buildSummaryFromApiResponse(res);
    });
    const onError = () => this.zone.run(() => {
      this.reportData = { loading: false, noRecords: true };
    });

    if (localTesting) {
      const facilityId = localStorage.getItem(btoa('facilityId'));
      const url = `api/python-wrapper/reports/ai-mustering-overall-summary/0/0/${facilityId}${param}`;
      this.apiService.get(url).subscribe((res: any) => onSuccess(res?.results), onError);
    } else {
      this.CommonService.getReportData('ai-mustering-overall-summary', param).subscribe(
        (res: any) => onSuccess(res?.results),
        onError
      );
    }
  }

  private buildSummaryFromApiResponse(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data || {};

    const k = d.kpi || {};
    this.summaryKpiCards = [
      { label: 'Total Events',     value: k.total_events     || 0,        sub: 'This period',       icon: 'event',         iconClass: 'blue',   valueClass: 'blue'   },
      { label: 'Total Personnel',  value: k.total_personnel  || 0,        sub: 'Across all events', icon: 'groups',        iconClass: 'teal',   valueClass: 'teal'   },
      { label: 'Avg Efficiency',   value: k.avg_efficiency   || '0%',     sub: 'Mustering rate',    icon: 'speed',         iconClass: 'green',  valueClass: 'green'  },
      { label: 'Avg Duration',     value: k.avg_duration     || '—',      sub: 'Per event',         icon: 'timer',         iconClass: 'orange', valueClass: 'orange' },
      { label: 'Drills Completed', value: k.drills_completed || 0,        sub: 'Completed drills',  icon: 'verified_user', iconClass: 'green',  valueClass: 'green'  },
    ];

    const evtByDay: { date: string; count: number }[] = d.events_per_day || [];
    this.summaryEventsBarOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 36, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'category', data: evtByDay.map(r => r.date), axisLabel: { color: '#718096', fontSize: 10 }, axisLine: { lineStyle: { color: '#E2E8F0' } } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#718096', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF2F7', type: 'dashed' } } },
      series: [{
        type: 'bar', barWidth: '26%', barMaxWidth: 28,
        data: evtByDay.map(r => ({ value: r.count, itemStyle: { color: '#1565C0', borderRadius: [4, 4, 0, 0] } })),
        label: { show: true, position: 'top', fontSize: 10, color: '#1565C0', fontWeight: 'bold' },
      }],
    };

    const statusData: { name: string; value: number; color?: string }[] = d.status_distribution || [];
    const statusTotal = statusData.reduce((s, r) => s + (r.value || 0), 0);
    this.summaryStatusLegend = statusData.map(r => ({
      name: r.name, value: r.value,
      color: r.color || this.STATUS_COLOR[r.name] || '#999',
      pct: statusTotal ? Math.round(r.value / statusTotal * 100) : 0,
    }));
    this.summaryStatusDonutOpt = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [{
        type: 'pie', radius: ['50%', '72%'], center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: true, position: 'center', formatter: `${statusTotal}\nTotal`, fontSize: 13, fontWeight: 'bold', color: '#1A202C', lineHeight: 20 },
        labelLine: { show: false },
        data: this.summaryStatusLegend.map(r => ({ name: r.name, value: r.value, itemStyle: { color: r.color } })),
      }],
    };

    const zoneRows: { zone: string; avg_sec: number }[] = d.zone_performance || [];
    const fmtSec = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
    const zoneColor = (v: number) => v >= 240 ? '#C62828' : v >= 180 ? '#E65100' : v >= 120 ? '#1565C0' : '#2E7D32';
    this.summaryZonePerfOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>Avg: <b>${fmtSec(p[0].value)}</b>` },
      grid: { left: 100, right: 64, top: 10, bottom: 24 },
      xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${Math.round(v / 60)}m`, color: '#718096', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF2F7' } } },
      yAxis: { type: 'category', data: zoneRows.map(r => r.zone), axisLabel: { color: '#4A5568', fontSize: 11, fontWeight: 'bold' }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#E2E8F0' } } },
      series: [{
        type: 'bar', barWidth: '55%',
        data: zoneRows.map(r => ({ value: r.avg_sec, itemStyle: { color: zoneColor(r.avg_sec), borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', formatter: (p: any) => fmtSec(p.value), fontSize: 10, color: '#4A5568', fontWeight: 'bold' },
      }],
    };

    const compRows: { event_label: string; pct: number }[] = d.compliance_trend || [];
    this.summaryComplianceOpt = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>Compliance: <b>${p[0].value}%</b>` },
      grid: { left: 40, right: 16, top: 16, bottom: 50 },
      xAxis: { type: 'category', data: compRows.map(r => r.event_label), axisLabel: { color: '#718096', fontSize: 9, rotate: 30 }, axisLine: { lineStyle: { color: '#E2E8F0' } } },
      yAxis: { type: 'value', min: 60, max: 100, axisLabel: { formatter: '{value}%', color: '#718096', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF2F7', type: 'dashed' } } },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        data: compRows.map(r => r.pct),
        label: { show: false },
        itemStyle: { color: '#2E7D32' },
        lineStyle: { width: 2, color: '#2E7D32' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(46,125,50,0.2)' }, { offset: 1, color: 'rgba(46,125,50,0.02)' }] } },
      }],
    };

    this.summaryActivityRows = (d.activity_rows || []).map((r: any) => ({
      name:       r.name       || r.activity_name || '',
      date:       r.date       || '',
      personnel:  r.personnel  || 0,
      mustered:   r.mustered   || 0,
      efficiency: r.efficiency || 0,
      duration:   r.duration   || '—',
    }));

    this.summaryPage = 1;
    this.summaryDataReady = this.summaryKpiCards.length > 0 || this.summaryActivityRows.length > 0;
    if (!this.summaryDataReady) { this.reportData.noRecords = true; }
  }

  private handleResponse(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data || {};
    this.reportTitle = d.title || '';
    this.reportSub   = d.subtitle || '';
    this.buildKpiCards(d.kpi);
    this.buildStatusDonut(d.status_distribution || []);
    this.buildTimeline(d.timeline || []);
    this.buildPopulationTrend(d.population_trend || []);
    this.buildZonePerformance(d.zone_performance || []);
    this.buildCongestedZones(d.congested_zones || []);
    this.buildRouteFlow(d.route_flow || {});
    this.incidentRows = d.incident || [];
    this.buildEfficiency(d.efficiency || {});
    this.buildFunnel(d.funnel || []);
    this.personnelRows = d.personnel || [];
    this.searchTerm    = '';
    this.sortKey       = '';
    this.sortDir       = 'asc';

    this.dataReady = this.kpiCards.length > 0 || this.personnelRows.length > 0;
    if (!this.dataReady) { this.reportData.noRecords = true; return; }

    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  // ── Widget builders ─────────────────────────────────────────────────────
  private buildKpiCards(k: any) {
    if (!k) { this.kpiCards = []; return; }
    const total    = k.total_personnel || 0;
    const mustered = k.safely_mustered || 0;
    const pct = total ? Math.round(mustered / total * 100) : 0;
    this.kpiCards = [
      { label: 'Total Personnel',        value: total,                          sub: 'TAT-US staff',           icon: 'groups',        iconClass: 'blue',   valueClass: 'blue' },
      { label: 'Safely Mustered',        value: mustered,    badge: `(${pct}%)`, badgeClass: 'badge-green',     icon: 'verified_user', iconClass: 'green',  valueClass: 'green' },
      { label: 'In Progress',            value: k.in_progress || 0,             sub: 'Currently mustering',    icon: 'directions_run', iconClass: 'orange', valueClass: 'orange' },
      { label: 'Not Reached',            value: k.not_reached || 0,             sub: 'Yet to muster',          icon: 'error_outline', iconClass: 'red',    valueClass: 'red' },
      { label: 'Assembly Point Reached', value: (k.assembly_reached_pct || 0) + '%', sub: `${mustered} / ${total}`, icon: 'pin_drop', iconClass: 'teal',  valueClass: 'teal' },
    ];
  }

  private buildStatusDonut(rows: { name: string; value: number; color?: string }[]) {
    const total = rows.reduce((s, r) => s + (r.value || 0), 0);
    this.statusTotal = total;
    this.statusLegend = rows.map(r => ({
      name: r.name, value: r.value,
      pct: total ? Math.round(r.value / total * 100) : 0,
      color: r.color || this.STATUS_COLOR[r.name] || '#999',
    }));
    this.statusDonutOpt = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [{
        type: 'pie',
        radius: ['52%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true, position: 'center',
          formatter: `${total}\nTotal`,
          fontSize: 14, fontWeight: 'bold', color: '#1A202C', lineHeight: 20,
        },
        labelLine: { show: false },
        data: this.statusLegend.map(r => ({
          name: r.name, value: r.value, itemStyle: { color: r.color },
        })),
      }],
    };
  }

  private buildTimeline(rows: { time: string; label: string; type: string }[]) {
    const icon = (t: string) =>
      t === 'detection' ? 'local_fire_department' :
      t === 'alarm'     ? 'notifications_active' :
      t === 'started'   ? 'directions_run' :
      t === 'progress'  ? 'groups' :
      t === 'complete'  ? 'check_circle' : 'circle';
    this.timeline = rows.map(r => ({ ...r, icon: icon(r.type) }));
  }

  private buildPopulationTrend(rows: { bucket: string; value: number }[]) {
    this.populationEmpty = !rows.length;
    this.populationTrendOpt = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>Mustered: <b>${p[0].value}</b>` },
      grid: { left: '7%', right: '6%', top: '14%', bottom: '14%', containLabel: true },
      xAxis: {
        type: 'category', boundaryGap: false, data: rows.map(r => r.bucket),
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#718096', fontSize: 10 },
      },
      yAxis: {
        type: 'value', min: 0,
        axisLabel: { color: '#718096', fontSize: 10 },
        splitLine: { lineStyle: { color: '#EDF2F7', type: 'dashed' } },
      },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
        data: rows.map(r => r.value),
        label: { show: true, position: 'top', fontSize: 10, color: '#2E7D32', fontWeight: 'bold' },
        itemStyle: { color: '#2E7D32' },
        lineStyle: { width: 2, color: '#2E7D32' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(46,125,50,0.25)' },
              { offset: 1, color: 'rgba(46,125,50,0.02)' },
            ],
          },
        },
      }],
    };
  }

  private buildZonePerformance(rows: { zone: string; avg_sec: number }[]) {
    this.zoneEmpty = !rows.length;
    // Ascending sort so the slowest zone sits at the top of the horizontal bars.
    const sorted = [...rows].sort((a, b) => (a.avg_sec || 0) - (b.avg_sec || 0));
    const maxSec = Math.max(0, ...sorted.map(r => r.avg_sec || 0));
    const color = (v: number) =>
      v >= 240 ? '#C62828' : v >= 180 ? '#E65100' : v >= 120 ? '#1565C0' : '#2E7D32';
    const fmt = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
    this.zonePerfOpt = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: any) => `${p[0].name}<br/>Avg Time: <b>${fmt(p[0].value)}</b>`,
      },
      grid: { left: 90, right: 60, top: 10, bottom: 24 },
      xAxis: {
        type: 'value', max: Math.ceil((maxSec * 1.15) / 60) * 60,
        axisLabel: { formatter: (v: number) => `${Math.round(v / 60)}m`, color: '#718096', fontSize: 10 },
        splitLine: { lineStyle: { color: '#EDF2F7' } },
      },
      yAxis: {
        type: 'category', data: sorted.map(r => r.zone),
        axisLabel: { color: '#4A5568', fontSize: 11, fontWeight: 'bold' },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
      },
      series: [{
        type: 'bar', barWidth: '55%',
        data: sorted.map(r => ({
          value: r.avg_sec,
          itemStyle: { color: color(r.avg_sec), borderRadius: [0, 4, 4, 0] },
        })),
        label: { show: true, position: 'right', formatter: (p: any) => fmt(p.value), fontSize: 11, color: '#4A5568', fontWeight: 'bold' },
      }],
    };
  }

  private buildCongestedZones(rows: { zone: string; density: number }[]) {
    const level = (d: number) => d >= 0.7 ? 'High' : d >= 0.45 ? 'Medium' : 'Low';
    const cls   = (d: number) => d >= 0.7 ? 'lvl-high' : d >= 0.45 ? 'lvl-med' : 'lvl-low';
    this.congestedZones = [...rows]
      .sort((a, b) => (b.density || 0) - (a.density || 0))
      .map(r => ({ zone: r.zone, density: r.density, level: level(r.density), levelClass: cls(r.density) }));
  }

  private buildRouteFlow(rf: { nodes?: string[]; links?: { source: string; target: string; value: number }[] }) {
    const nodes = (rf.nodes || []).map(n => ({ name: n }));
    this.routeFlowOpt = {
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [{
        type: 'sankey',
        left: 6, right: 64, top: 8, bottom: 8,
        nodeWidth: 12, nodeGap: 8,
        emphasis: { focus: 'adjacency' },
        data: nodes,
        links: rf.links || [],
        label: { fontSize: 9, color: '#4A5568' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.45 },
        itemStyle: { borderWidth: 0 },
      }],
    };
  }

  private buildEfficiency(e: { value?: number; label?: string }) {
    const val = e.value || 0;
    this.efficiencyLabel = e.label || '';
    const color = val >= 85 ? '#2E7D32' : val >= 60 ? '#E65100' : '#C62828';
    this.efficiencyOpt = {
      series: [{
        type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100,
        radius: '92%', center: ['50%', '56%'],
        progress: { show: true, width: 10, itemStyle: { color } },
        axisLine: { lineStyle: { width: 10, color: [[1, '#E2E8F0']] } },
        pointer: { show: false },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        detail: { valueAnimation: true, formatter: '{value}%', fontSize: 18, fontWeight: 'bold', color, offsetCenter: [0, '0%'] },
        title: { show: false },
        data: [{ value: val }],
      }],
    };
  }

  private buildFunnel(rows: { name: string; value: number }[]) {
    this.funnelOpt = {
      color: ['#0D47A1', '#1565C0', '#1976D2', '#42A5F5', '#90CAF9'],
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: [{
        type: 'funnel',
        left: 4, right: 4, top: 10, bottom: 10,
        minSize: '24%', maxSize: '100%',
        sort: 'descending', gap: 2,
        label: { show: true, position: 'inside', fontSize: 9, color: '#fff', formatter: '{c}' },
        labelLine: { show: false },
        itemStyle: { borderWidth: 0 },
        data: rows.map(r => ({ name: r.name, value: r.value })),
      }],
    };
  }

  // ── Personnel table search + sort ─────────────────────────────────────────
  /** Search-filtered then sorted rows (full set — table scrolls, no pagination). */
  get filteredPersonnel(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    let rows = this.personnelRows;
    if (term) {
      rows = rows.filter(r =>
        this.personnelCols.some(c => String(r[c.key] ?? '').toLowerCase().includes(term)));
    }
    if (this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a[this.sortKey], bv = b[this.sortKey];
        const an = typeof av === 'number', bn = typeof bv === 'number';
        if (an && bn) return (av - bv) * dir;
        return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir;
      });
    }
    return rows;
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  sortIcon(key: string): string {
    if (this.sortKey !== key) return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  statusClass(status: string): string {
    if (status === 'Mustered')    return 'status-completed';
    if (status === 'In Progress') return 'status-inprogress';
    if (status === 'Not Reached') return 'status-cancelled';
    if (status === 'Visitors')    return 'status-visitor';
    return 'status-inprogress';
  }
  statusDot(status: string): string {
    if (status === 'Mustered')    return '●';
    if (status === 'In Progress') return '◉';
    if (status === 'Not Reached') return '✕';
    return '●';
  }

  // ── GridStack ─────────────────────────────────────────────────────────────
  private waitForGridAndInit(retries = 20) {
    const el = document.querySelector('.ai-stmust-grid');
    if (el) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.initGridStack();
          setTimeout(() => this.resizeAllCharts(), 60);
          setTimeout(() => this.resizeAllCharts(), 300);
        });
      });
    } else if (retries > 0) {
      setTimeout(() => this.waitForGridAndInit(retries - 1), 30);
    }
  }

  private initGridStack() {
    this.destroyGridStack();
    this.grid = GridStack.init({
      column: 12, cellHeight: CELL_HEIGHT, margin: `${MARGIN_V}px ${MARGIN_H}px`,
      animate: false, float: true,
      disableDrag:   true,
      disableResize: true,
    }, '.ai-stmust-grid');
    this.attachResizeObserver();
  }

  private destroyGridStack() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    if (this.grid) { this.grid.destroy(false); this.grid = null; }
    const el = document.querySelector('.ai-stmust-grid') as any;
    if (el && el.gridstack) el.gridstack = null;
    this.chartInstances.clear();
  }

  private attachResizeObserver() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.rafPending) return;
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.resizeAllCharts();
        this.rafPending = false;
      });
    });
    document.querySelectorAll('.echart-wrap').forEach(el => this.resizeObserver!.observe(el));
  }

  onChartInit(key: string, inst: any) {
    this.chartInstances.set(key, inst);
    const el = inst.getDom?.()?.parentElement;
    if (el && this.resizeObserver) this.resizeObserver.observe(el);
  }

  private resizeAllCharts() {
    this.chartInstances.forEach(i => { try { i.resize(); } catch (_) {} });
  }
}
