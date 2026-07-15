import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, NgZone, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonService, ExcelService } from '../../../shared';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GridStack } from 'gridstack';
import { EChartsOption } from 'echarts';

const USE_TEST_API  = false;
const CELL_HEIGHT   = 80;
const HEADER_H      = 24;
const MARGIN_V      = 5;    // vertical gap between widgets
const MARGIN_H      = 6;    // horizontal gap between widgets

/** Returns YYYY-MM-DD from a datetime string or Date */
function toDateOnly(dt: string): string {
  if (!dt) return '';
  return dt.length >= 10 ? dt.substring(0, 10) : dt;
}


function initOpts(rows: number) {
  return { renderer: 'canvas' as const, height: rows * CELL_HEIGHT - HEADER_H - MARGIN_V * 2 };
}

// â”€â”€ 3-D bar helper (no echarts-gl needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Draws a rectangular bar with a top face and right face to simulate depth.
function make3dBarSeries(name: string, data: number[], color: string, categories: string[], offset = 0, barW = 30, depth = 8) {
  const TOP_COLOR   = shadeColor(color, 30);
  const RIGHT_COLOR = shadeColor(color, -30);
  return {
    name,
    type: 'custom' as const,
    renderItem: (_params: any, api: any) => {
      const categoryIndex = api.value(0);
      const value         = api.value(1);
      const coord         = api.coord([categoryIndex, value]);
      const base          = api.coord([categoryIndex, 0]);
      const x             = coord[0] + offset;
      const y             = coord[1];
      const bY            = base[1];
      const w             = barW;
      const h             = bY - y;
      return {
        type: 'group',
        children: [
          // Front face
          { type: 'rect', shape: { x: x - w / 2, y, width: w, height: h }, style: { fill: color } },
          // Top face (parallelogram)
          { type: 'polygon', shape: { points: [[x - w/2, y],[x - w/2 + depth, y - depth],[x + w/2 + depth, y - depth],[x + w/2, y]] }, style: { fill: TOP_COLOR } },
          // Right face
          { type: 'polygon', shape: { points: [[x + w/2, y],[x + w/2 + depth, y - depth],[x + w/2 + depth, bY - depth],[x + w/2, bY]] }, style: { fill: RIGHT_COLOR } },
        ]
      };
    },
    data: data.map((v, i) => [i, v]),
    encode: { x: 0, y: 1 },
    tooltip: { formatter: (p: any) => `${categories[p.data[0]]}<br>${name}: ${p.data[1]}` }
  };
}

function shadeColor(hex: string, pct: number): string {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (num & 0xff) + pct));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
}


@Component({
  selector: 'app-porter-v2-report',
  templateUrl: './porter-v2-report.component.html',
  styleUrls: ['./porter-v2-report.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class PorterV2ReportComponent  implements OnInit, AfterViewInit, OnDestroy {
  @Input() showHeader: any = false;
  filterInputs: any[] = [];
  reportList:   any[] = [];
  reportData:   any   = {};

  // AI date selector state
  aiPeriodType = 'Date';
  aiDateFrom   = '';
  aiDateTo     = '';
  // Today's data isn't available yet — latest selectable date is yesterday.
  maxSelectableDate = new Date(new Date().setDate(new Date().getDate() - 1));

  // Keep these as computed getters so all existing fetch methods work unchanged
  get fromDateTime(): string { return this.aiDateFrom; }
  set fromDateTime(v: string) { this.aiDateFrom = v; }
  get toDateTime(): string { return this.aiDateTo; }
  set toDateTime(v: string) { this.aiDateTo = v; }

  // Chart options
  tatBarOpt:         EChartsOption = {};
  createAssignOpt:   EChartsOption = {};
  createAcceptOpt:   EChartsOption = {};
  acceptArriveOpt:   EChartsOption = {};
  arriveCompleteOpt: EChartsOption = {};
  histOpt:           EChartsOption = {};
  scatterOpt:        EChartsOption = {};
  poolBarOpt:        EChartsOption = {};
  categoryBarOpt:    EChartsOption = {};
  heatmapOpt:        EChartsOption = {};
  peakHourOpt:       EChartsOption = {};
  manualTrendOpt:    EChartsOption = {};
  weekdayOpt:        EChartsOption = {};

  // Table data
  porterScorecard:     any[] = [];
  porterScorecardCols: string[] = [];
  delayLocations:      any[] = [];
  delayLocationsCols:  string[] = [];

  // Summary cards
  summaryCards: { label: string; value: any }[] = [];

  // Drilldown panel
  drillPanel = false;
  drillLoading = false;
  drillTitle   = '';
  drillRows:   any[] = [];
  drillCols:   string[] = [];
  drillTrendOpt: EChartsOption = {};
  drillShowTrend = false;
  private drillParams: any = {};   // fdt/tdt saved for drilldown calls

  // initOpts
  io5  = initOpts(5);
  io4  = initOpts(4);
  io6  = initOpts(6);

  // â”€â”€ Layout selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // layouts = [
  //   { key: 'v1', label: 'V1' },
  //   { key: 'v2', label: 'V2' },
  //   { key: 'v3', label: 'V3' },
  //   { key: 'v4', label: 'V4' },
  //   { key: 'v5', label: 'V5' },
  // ];
  layouts = [
    { key: 'v4', label: 'Porter Summary' },
    { key: 'v5', label: 'Porter Yearly Summary' },
  ];
  selectedLayout = 'v4';

  // â”€â”€ V2 data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  v2KpiCards:   any[] = [];
  v2BottomKpi:  any[] = [];
  v2FunnelOpt:       EChartsOption = {};
  v2WaitlistHeatOpt: EChartsOption = {};
  v2HourlyAreaOpt:   EChartsOption = {};
  v2TreemapOpt:      EChartsOption = {};
  v2DrillBarOpt:     EChartsOption = {};
  v2RadarOpt:        EChartsOption = {};
  v2PerfBarOpt:      EChartsOption = {};
  v2IdleHeatOpt:     EChartsOption = {};
  v2TimelineOpt:     EChartsOption = {};
  v2RadarTable:      any[] = [];
  v2RadarCols:       string[] = [];
  v2DrillLevel  = 'pool';   // 'pool' | 'location'
  v2DrillPool   = '';
  private v2DrillData: any = {};
  v2DataReady   = false;

  // â”€â”€ V3 data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  v3Bar3dOpt:   any = {};
  v3Insights:   any = null;
  v3KpiSummary: any = null;
  v3DataReady   = false;

  // â”€â”€ V4 data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  v4KpiCards:      any[] = [];
  v4GaugeOpt:      EChartsOption = {};
  v4PerfMetrics:   any = null;
  v4TrendOpt:      EChartsOption = {};
  v4HeatmapOpt:    EChartsOption = {};
  v4GaugeZoneColor   = '#f59e0b';
  v4GaugeStatus      = '';
  v4PoolStatus3dOpt:     any   = {};
  v4PoolStatusInsights:  any[] = [];
  v4HourlyMovOpt:    EChartsOption = {};
  v4ServiceOpt:      EChartsOption = {};
  v4FloorMovement:   { source: any[]; destination: any[] } = { source: [], destination: [] };
  v4PorterPerfOpt:   EChartsOption = {};
  v4HeatmapInsights:  any[]         = [];
  // Row-2 redesigned widgets (HTML panels/tables, no ECharts)
  v4CompletionRate   = 0;
  v4StatusTotal      = 0;
  v4StatusCards:     any[] = [];   // [{name,value,pct,color,icon}]
  v4StatusDonutOpt:  any   = {};
  v4PoolDist:        any[] = [];   // [{pool,total,share,avg_tat,comp_rate}]
  v4PoolTotals:      any   = {};   // {total,share,avg_tat,comp_rate}
  v4CatPerf:         any[] = [];   // [{category,total,share,avg_tat,icon}]
  private v4RawData:  any           = {};
  v4DataReady        = false;

  // ── V5 data ───────────────────────────────────────────────────────────────
  v5KpiCards:        any[] = [];
  v5YoyInsights:     any[] = [];
  v5CompletionPct    = 0;
  get v5CompletionColor(): string {
    return this.v5CompletionPct >= 70 ? '#22c55e' : this.v5CompletionPct >= 30 ? '#f59e0b' : '#ef4444';
  }
  v5MonthlyTrendOpt: EChartsOption = {};
  v5DeptBarOpt:      EChartsOption = {};
  v5StatusDonutOpt:  EChartsOption = {};
  v5TimeSlotOpt:     EChartsOption = {};
  v5MonthlyTable:    any[] = [];
  v5YoySummary:      any[] = [];
  v5PeriodLabels:    any   = {};
  v5DataReady        = false;

  v3LegendBands = [
    { color: '#b71c1c', label: '200 and above' },
    { color: '#e65100', label: '150 â€“ 200' },
    { color: '#f9a825', label: '100 â€“ 150' },
    { color: '#2e7d32', label: '50 â€“ 100' },
    { color: '#0097a7', label: '10 â€“ 50' },
    { color: '#1a237e', label: 'Below 10' },
  ];
  io3 = initOpts(3);

  onLayoutChange(key: string) {
    this.selectedLayout = key;
    if (key === 'v2' && !this.v2DataReady) {
      this.fetchV2();
    } else if (key === 'v3' && !this.v3DataReady) {
      this.fetchV3();
    } else if (key === 'v4' && !this.v4DataReady) {
      this.fetchV4();
    } else if (key === 'v5' && !this.v5DataReady) {
      this.fetchV5();
    } else {
      this.cdr.detectChanges();
      Promise.resolve().then(() => {
        this.cdr.detectChanges();
        setTimeout(() => { this.initGridStack(); this.resizeAllCharts(); }, 50);
      });
    }
  }

  private fetchV2() {
    this.reportData = { loading: true, noRecords: false };
    const fdt = toDateOnly(this.fromDateTime);
    const tdt = toDateOnly(this.toDateTime);
    const param = `/fdt=${fdt}&tdt=${tdt}`;
    this.CommonService.getReportData('ai-porter-v2-summary', param).subscribe(
      res  => this.zone.run(() => { this.reportData.loading = false; this.handleV2Response(res.results); }),
      _err => { this.reportData.loading = false; this.reportData.noRecords = true; }
    );
  }

  private handleV2Response(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data;
    this.v2KpiCards   = d.kpi_cards;
    this.v2BottomKpi  = d.bottom_kpi;
    this.v2DrillData  = d.drilldown_data;
    this.buildV2Funnel(d.funnel);
    this.buildV2WaitlistHeatmap(d.hourly_waitlist_heatmap);
    this.buildV2HourlyArea(d.hourly_by_status);
    this.buildV2Treemap(d.location_treemap);
    this.buildV2DrillBar(d.drilldown_data.pools, 'pool');
    this.buildV2Radar(d.porter_radar);
    this.buildV2PerfBar(d.porter_performance);
    this.buildV2IdleHeatmap(d.porter_idle_heatmap);
    this.buildV2Timeline(d.porter_timeline);
    this.v2DataReady = true;
    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  // V2 drill for poolâ†’location chart
  v2DrillDown(poolName: string) {
    this.v2DrillPool  = poolName;
    this.v2DrillLevel = 'location';
    const locs = this.v2DrillData.locations
      .filter((l: any) => l.pool === poolName)
      .map((l: any) => ({ name: l.location, value: l.count }));
    this.buildV2DrillBar(locs, 'location');
    setTimeout(() => this.resizeAllCharts(), 50);
  }

  v2DrillUp() {
    this.v2DrillLevel = 'pool';
    this.v2DrillPool  = '';
    this.buildV2DrillBar(this.v2DrillData.pools, 'pool');
    setTimeout(() => this.resizeAllCharts(), 50);
  }

  // â”€â”€ V2 chart builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private buildV2Funnel(rows: any[]) {
    this.v2FunnelOpt = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'funnel', left: '5%', width: '60%', sort: 'descending',
        label: { show: true, position: 'right', formatter: (p: any) => `${p.name}\n${p.value} (${rows.find(r=>r.stage===p.name)?.pct||0}%)` },
        data: rows.map((r, i) => ({ name: r.stage, value: r.count, itemStyle: { color: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de'][i] } }))
      }]
    };
  }

  private buildV2WaitlistHeatmap(rows: any[]) {
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dMap  = new Map(rows.map(r => [`${r.day}_${r.hour}`, r.count]));
    const data: any[] = [];
    days.forEach((d, di) => hours.forEach(h => data.push([h, di, dMap.get(`${d}_${h}`) || 0])));
    const maxV = Math.max(...rows.map(r => r.count), 1);
    this.v2WaitlistHeatOpt = {
      tooltip: { formatter: (p: any) => `${days[p.data[1]]} ${p.data[0]}:00 â€” ${p.data[2]} waitlisted` },
      grid: { left: '10%', right: '8%', bottom: '12%', top: '3%' },
      xAxis: { type: 'category', data: hours.map(h=>`${h}`), axisLabel: { formatter: (v: string) => +v % 3 === 0 ? v+':00' : '' } },
      yAxis: { type: 'category', data: days },
      visualMap: { min: 0, max: maxV, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: ['#ffffcc','#fd8d3c','#bd0026'] } },
      series: [{ type: 'heatmap', data, label: { show: false } }]
    };
  }

  private buildV2HourlyArea(rows: any[]) {
    const hours    = Array.from({ length: 24 }, (_, i) => i);
    const statuses = ['Completed','InProgress','Waitlisted','Cancelled'];
    const colors   = ['#91cc75','#5470c6','#fac858','#ee6666'];
    const map = new Map(rows.map(r => [`${r.hour}_${r.status}`, r.count]));
    this.v2HourlyAreaOpt = {
      tooltip: { trigger: 'axis' },
      legend: { data: statuses, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: hours.map(h => `${h}:00`), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: 'Requests' },
      series: statuses.map((s, i) => ({
        name: s, type: 'line', smooth: true, stack: 'total',
        areaStyle: { opacity: 0.4 },
        itemStyle: { color: colors[i] },
        data: hours.map(h => map.get(`${h}_${s}`) || 0)
      }))
    };
  }

  private buildV2Treemap(rows: any[]) {
    const maxTat = Math.max(...rows.map(r => r.avg_tat), 1);
    this.v2TreemapOpt = {
      tooltip: { formatter: (p: any) => `${p.name}<br>Requests: ${p.value}<br>Avg TAT: ${p.data.avg_tat} min` },
      visualMap: { show: true, min: 0, max: maxTat, dimension: 2,
        inRange: { color: ['#91cc75','#fac858','#ee6666'] }, orient: 'horizontal', left: 'center', bottom: 0 },
      series: [{
        type: 'treemap', roam: false, nodeClick: false,
        label: { show: true, formatter: (p: any) => `${p.name}\n${p.value}` },
        data: rows.map(r => ({ name: r.name, value: r.value, avg_tat: r.avg_tat }))
      }]
    };
  }

  private buildV2DrillBar(rows: any[], level: string) {
    const cats = rows.map(r => r.name);
    const vals = rows.map(r => r.value);
    this.v2DrillBarOpt = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
      xAxis: { type: 'category', data: cats, axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', name: 'Requests' },
      series: [{
        type: 'bar',
        data: vals.map((v, i) => ({ value: v, itemStyle: { color: this.palette[i % this.palette.length] } })),
        label: { show: true, position: 'top' }
      }]
    };
  }

  private buildV2Radar(rows: any[]) {
    const maxVal = 100;
    this.v2RadarOpt = {
      legend: { data: rows.map(r => r.porter), bottom: 0, type: 'scroll' },
      radar: {
        indicator: [
          { name: 'Completion %', max: maxVal },
          { name: 'Acceptance %', max: maxVal },
          { name: 'Rejection %',  max: 50 },
          { name: 'Avg Arrive',   max: 60 },
          { name: 'Avg Complete', max: 60 },
        ]
      },
      series: [{
        type: 'radar',
        data: rows.slice(0, 5).map((r, i) => ({
          name: r.porter,
          value: [r.completion, r.acceptance, r.rejection, r.avg_arrive, r.avg_complete],
          lineStyle: { color: this.palette[i] }, areaStyle: { opacity: 0.1 }
        }))
      }]
    };
    this.v2RadarTable = rows.slice(0, 5).map((r, i) => ({
      '#': i + 1, 'Porter': r.porter,
      'Efficiency Score': Math.round((r.completion + r.acceptance) / 2)
    }));
    this.v2RadarCols = this.v2RadarTable.length ? Object.keys(this.v2RadarTable[0]) : [];
  }

  private buildV2PerfBar(rows: any[]) {
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    this.v2PerfBarOpt = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value}%` },
      grid: { left: '20%', right: '8%', top: '5%', bottom: '5%', containLabel: false },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: { type: 'category', data: rows.map(r => r.porter).reverse(), axisLabel: { width: 100, overflow: 'truncate' } },
      series: [{
        type: 'bar', data: rows.map(r => r.score).reverse(),
        label: { show: true, position: 'right', formatter: '{c}%' },
        itemStyle: { color: (p: any) => p.data >= avg ? '#91cc75' : '#5470c6' },
        markLine: { data: [{ xAxis: avg, label: { formatter: `Avg: ${avg}%` }, lineStyle: { color: '#f5a623', type: 'dashed' } }] }
      }]
    };
  }

  private buildV2IdleHeatmap(rows: any[]) {
    const porters = Array.from(new Set(rows.map(r => r.porter)));
    const hours   = Array.from({ length: 24 }, (_, i) => i);
    const dMap    = new Map(rows.map(r => [`${r.porter}_${r.hour}`, r.idle]));
    const data: any[] = [];
    porters.forEach((p, pi) => hours.forEach(h => data.push([h, pi, dMap.get(`${p}_${h}`) || 0])));
    const maxV = Math.max(...rows.map(r => r.idle), 1);
    this.v2IdleHeatOpt = {
      tooltip: { formatter: (p: any) => `${porters[p.data[1]]} ${p.data[0]}:00 â€” ${p.data[2]} min` },
      grid: { left: '15%', right: '8%', bottom: '12%', top: '3%' },
      xAxis: { type: 'category', data: hours.map(h => `${h}:00`), axisLabel: { rotate: 30 } },
      yAxis: { type: 'category', data: porters },
      visualMap: { min: 0, max: maxV, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: ['#ffffcc','#fc8d59','#d73027'] } },
      series: [{ type: 'heatmap', data }]
    };
  }

  private buildV2Timeline(rows: any[]) {
    // Gantt-style: porter Ã— time segments from start_timeâ†’end_time
    const porters = Array.from(new Set(rows.map(r => r.porter)));
    const colors  = ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4'];
    const locations = Array.from(new Set(rows.map(r => r.from)));

    this.v2TimelineOpt = {
      tooltip: { formatter: (p: any) => `${p.data[0]}: ${p.data[2]} â†’ ${p.data[3]}<br>${p.data[4]} â†’ ${p.data[5]}` },
      legend: { data: locations.slice(0, 8), bottom: 0, type: 'scroll' },
      grid: { left: '15%', right: '3%', top: '3%', bottom: '12%' },
      xAxis: { type: 'time', axisLabel: { formatter: '{HH}:{mm}' } },
      yAxis: { type: 'category', data: porters },
      series: locations.slice(0, 8).map((loc, li) => ({
        name: loc, type: 'custom', renderItem: (_p: any, api: any) => {
          const yIndex = api.value(0);
          const start  = api.coord([api.value(1), yIndex]);
          const end    = api.coord([api.value(2), yIndex]);
          const h      = Math.max(api.size([0, 1])[1] - 4, 8);
          return { type: 'rect', shape: { x: start[0], y: start[1] - h/2, width: Math.max(end[0]-start[0],4), height: h },
            style: { fill: colors[li % colors.length], opacity: 0.8 } };
        },
        dimensions: ['porterIdx','startTime','endTime','from','to'],
        data: rows.filter(r => r.from === loc).map(r => [
          porters.indexOf(r.porter),
          new Date(r.start).getTime(),
          new Date(r.end).getTime(),
          r.from, r.to
        ]).filter(d => !isNaN(d[1] as number))
      }))
    };
  }

  private chartInstances = new Map<string, any>();
  private grid: GridStack;
  private resizeObserver: ResizeObserver | null = null;
  private rafPending = false;

  readonly palette = ['#1e8fc8','#f5a623','#7ed321','#d0021b','#9b59b6','#2ecc71','#e74c3c','#34495e','#1abc9c','#e67e22'];

  constructor(
    private fb: FormBuilder,
    private CommonService: CommonService,
    private ExcelService: ExcelService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    if(this.showHeader){
       const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.aiDateFrom   = localToday;
      this.aiDateTo     = localToday;
      this.fetchV4()
    }else{
    const d = this.maxSelectableDate;
    const localYesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.aiDateFrom   = localYesterday;
    this.aiDateTo     = localYesterday;
    this.aiPeriodType = 'Date';
    }
  }

  // ── AI Date Selector handler ──────────────────────────────────────────────
  onAiDateChange(event: { periodType: string; from: string; to: string; apply?: boolean }) {
    this.aiPeriodType = event.periodType;
    this.aiDateFrom   = event.from;
    this.aiDateTo     = event.to;
    // Presets / quarters auto-apply — refresh the active dashboard immediately
    if (event.apply) {
      this.refreshActiveLayout();
    }
  }

  refreshActiveLayout() {
    switch (this.selectedLayout) {
      case 'v1': this.getReports(); break;
      case 'v2': this.v2DataReady = false; this.fetchV2(); break;
      case 'v3': this.v3DataReady = false; this.fetchV3(); break;
      case 'v4': this.v4DataReady = false; this.fetchV4(); break;
      case 'v5': this.v5DataReady = false; this.fetchV5(); break;
      default:   this.fetchV4(); break;  // safe fallback — never show V1 unless explicitly on v1
    }
  }

  ngAfterViewInit() {}
  ngOnDestroy() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    this.destroyGridStack();
  }

  // â”€â”€ GridStack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private waitForGridAndInit(retries = 20) {
    const el = document.querySelector('.ai-porter-grid');
    if (el) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.initGridStack();
          setTimeout(() => this.resizeAllCharts(), 60);
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
    }, '.ai-porter-grid');
    this.attachResizeObserver();
  }

  private destroyGridStack() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    if (this.grid) { this.grid.destroy(false); this.grid = null; }
    const el = document.querySelector('.ai-porter-grid') as any;
    if (el && el.gridstack) el.gridstack = null;
  }

  // Observe every .echart-wrap so charts resize on every pixel change during drag
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
    document.querySelectorAll('.echart-wrap').forEach(el => {
      this.resizeObserver!.observe(el);
    });
  }

  onChartInit(key: string, inst: any) {
    this.chartInstances.set(key, inst);
    // Observe the chart's own container immediately on init
    const el = inst.getDom?.()?.parentElement;
    if (el && this.resizeObserver) this.resizeObserver.observe(el);
  }

  private resizeAllCharts() {
    this.chartInstances.forEach(i => { try { i.resize(); } catch (_) {} });
  }

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  reportHeaderAction(event: any) {
    switch (event.key) {
      case 'fromDateTime': this.fromDateTime = event.data; break;
      case 'toDateTime':   this.toDateTime   = event.data; break;
      case 'getInsights':
      case 'refresh':
        if (event.paramJson) {
          this.fromDateTime = event.paramJson['fdt'] || this.fromDateTime;
          this.toDateTime   = event.paramJson['tdt'] || this.toDateTime;
        }
        this.getReports(); break;
      case 'excel':
        if (this.selectedLayout === 'v4') this.downloadV4Excel(); break;
      case 'pdf':
        if (this.selectedLayout === 'v4') this.downloadV4Pdf(); break;
    }
  }

  // ── V4 Export ─────────────────────────────────────────────────────────────
  downloadV4Excel() {
    const d = this.v4RawData;
    const dateStr = toDateOnly(this.toDateTime) || new Date().toISOString().slice(0,10);

    const kpiRows = (d.kpi_cards || []).map((c: any) => ({ Label: c.label, Value: c.value, Unit: c.unit || '' }));
    const statusRows = (this.v4StatusCards || []).map((c: any) => ({ Status: c.name, Count: c.value, 'Share %': c.pct }));
    const poolRows = [
      ...(this.v4PoolDist || []).map((r: any) => ({ Pool: r.pool, Requests: r.total, 'Share %': r.share, 'Avg TAT (min)': r.avg_tat, 'Completion %': r.comp_rate })),
      { Pool: 'Total', Requests: this.v4PoolTotals.total, 'Share %': this.v4PoolTotals.share, 'Avg TAT (min)': this.v4PoolTotals.avg_tat, 'Completion %': this.v4PoolTotals.comp_rate },
    ];
    const catRows = (this.v4CatPerf || []).map((r: any) => ({ Category: r.category, Requests: r.total, 'Share %': r.share, 'Avg TAT (min)': r.avg_tat }));
    const svcRows = (d.service_summary || []).map((r: any) => ({ Service: r.service, Total: r.total, Completed: r.completed, 'Avg TAT (min)': r.avg_tat }));
    const srcRows = (this.v4FloorMovement.source || []).map((r: any) => ({ Location: r.location, Total: r.total, Completed: r.completed, 'In Progress': r.inprogress, Cancelled: r.cancelled, 'Avg TAT (min)': r.avg_tat, 'Completion Rate (%)': r.comp_rate }));
    const dstRows = (this.v4FloorMovement.destination || []).map((r: any) => ({ Location: r.location, Total: r.total, Completed: r.completed, 'In Progress': r.inprogress, Cancelled: r.cancelled, 'Avg TAT (min)': r.avg_tat, 'Completion Rate (%)': r.comp_rate }));
    const porRows = (d.porter_performance || []).map((r: any) => ({ Porter: r.porter, 'Total Requests': r.total, 'Avg TAT (min)': r.avg_tat }));

    this.ExcelService.multiSheet(
      [kpiRows, statusRows, poolRows, catRows, svcRows, srcRows, dstRows, porRows],
      ['KPI Summary', 'Status Overview', 'Poolwise Distribution', 'Category Performance', 'Service Summary', 'Source Floors', 'Destination Floors', 'Porter Performance'],
      `Porter-AI-V4-${dateStr}`,
      dateStr
    );
  }

  async downloadV4Pdf() {
    const d = this.v4RawData;
    if (!d) return;

    const pdf   = new (jsPDF as any)({ orientation: 'landscape', format: 'a3' });
    const pageW = pdf.internal.pageSize.getWidth();   // ~420
    let y = 10;

    // ── helpers ───────────────────────────────────────────────────────────────
    const hex2rgb = (hex: string): [number,number,number] => {
      const n = parseInt(hex.replace('#',''), 16);
      return [(n>>16)&255, (n>>8)&255, n&255];
    };

    const sectionHeader = (text: string, sub?: string) => {
      pdf.setFillColor(29, 78, 216);
      pdf.roundedRect(10, y, pageW - 20, 8, 1, 1, 'F');
      pdf.setFontSize(10); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica','bold');
      pdf.text(text, 14, y + 5.5);
      pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
      y += 11;
      if (sub) {
        pdf.setFontSize(8); pdf.setTextColor(100,116,139);
        pdf.text(sub, 14, y); y += 5;
        pdf.setTextColor(0,0,0);
      }
    };

    const chartCard = (key: string, title: string, w: number, h: number, x: number) => {
      // card border
      pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, w, h + 8, 2, 2, 'S');
      // card header bar
      pdf.setFillColor(248, 250, 252);
      pdf.rect(x, y, w, 6, 'F');
      pdf.setFontSize(8); pdf.setTextColor(55, 65, 81); pdf.setFont('helvetica','bold');
      pdf.text(title, x + 3, y + 4);
      pdf.setFont('helvetica','normal');
      // chart image
      const inst = this.chartInstances.get(key);
      if (inst?.getDataURL) {
        try {
          const img = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
          pdf.addImage(img, 'PNG', x + 1, y + 7, w - 2, h - 1);
        } catch (_) {}
      }
    };

    const kpiCards = (cards: any[], cols: number, cardH: number) => {
      const cardW = (pageW - 20) / cols - 2;
      let cx = 10;
      cards.forEach((c: any, i: number) => {
        if (i > 0 && i % cols === 0) { y += cardH + 4; cx = 10; }
        const [r,g,b] = hex2rgb(c.color || '#3b82f6');
        pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.3);
        pdf.roundedRect(cx, y, cardW, cardH, 2, 2, 'S');
        pdf.setFillColor(r, g, b);
        pdf.rect(cx, y, cardW, 1.5, 'F');
        pdf.setFontSize(7.5); pdf.setTextColor(107, 114, 128);
        pdf.text(c.label, cx + 3, y + 7, { maxWidth: cardW - 6 });
        pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(17, 24, 39);
        pdf.text(`${c.value}${c.unit ? ' ' + c.unit : ''}`, cx + 3, y + 17);
        pdf.setFont('helvetica','normal');
        cx += cardW + 2;
      });
      y += cardH + 5;
    };

    const dataTable = (head: string[], rows: any[][], opts: any = {}) => {
      (pdf as any).autoTable({
        head: [head], body: rows, startY: y,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        ...opts
      });
      y = (pdf as any).lastAutoTable.finalY + 8;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — KPI cards + Donut + Gauge + Performance metrics
    // ══════════════════════════════════════════════════════════════════════════
    pdf.setFontSize(16); pdf.setFont('helvetica','bold'); pdf.setTextColor(29, 78, 216);
    pdf.text('Porter Operations — AI Dashboard (V4)', 10, y); y += 5;
    pdf.setFontSize(8); pdf.setFont('helvetica','normal'); pdf.setTextColor(100,116,139);
    pdf.text(`${toDateOnly(this.fromDateTime)} → ${toDateOnly(this.toDateTime)}`, 10, y); y += 7;
    pdf.setTextColor(0,0,0);

    sectionHeader('Key Performance Indicators');
    kpiCards(d.kpi_cards || [], 5, 22);

    sectionHeader('Completion Rate  ·  Performance Metrics');
    const rowY = y;
    chartCard('v4gauge', 'Completion Rate',           130, 75, 10);

    // Performance metrics as mini cards
    const pm = d.performance_metrics || {};
    const metrics = [
      { label: 'Avg Completion Time', value: `${pm.avg_completion_time} min`, color: '#22c55e' },
      { label: 'Avg Response Time',   value: `${pm.avg_response_time} min`,   color: '#3b82f6' },
      { label: 'Acceptance Rate',     value: `${pm.acceptance_rate}%`,         color: '#8b5cf6' },
    ];
    const mX = 256, mW = (pageW - mX - 10) / 3 - 2;
    metrics.forEach((m, i) => {
      const [r,g,b] = hex2rgb(m.color);
      const mx = mX + i * (mW + 2);
      pdf.setDrawColor(229,231,235); pdf.setLineWidth(0.3);
      pdf.roundedRect(mx, rowY, mW, 36, 2, 2, 'S');
      pdf.setFillColor(r,g,b); pdf.rect(mx, rowY, mW, 1.5, 'F');
      pdf.setFillColor(r,g,b,0.08); pdf.roundedRect(mx+3, rowY+5, 12, 12, 2, 2, 'F');
      pdf.setFontSize(7); pdf.setTextColor(r,g,b); pdf.text('●', mx+6, rowY+13);
      pdf.setFontSize(7.5); pdf.setTextColor(107,114,128);
      pdf.text(m.label, mx+3, rowY+22, { maxWidth: mW-6 });
      pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(17,24,39);
      pdf.text(m.value, mx+3, rowY+32);
      pdf.setFont('helvetica','normal');
    });
    y = rowY + 82;

    sectionHeader('Request Status Overview');
    dataTable(['Status', 'Count', 'Share %'],
      (this.v4StatusCards || []).map((c: any) => [c.name, c.value, c.pct + '%']));

    sectionHeader('Poolwise Request Distribution');
    dataTable(['Pool', 'Requests', 'Share %', 'Avg TAT (min)', 'Completion %'],
      [
        ...(this.v4PoolDist || []).map((r: any) => [r.pool, r.total, r.share + '%', r.avg_tat, r.comp_rate + '%']),
        ['Total', this.v4PoolTotals.total, this.v4PoolTotals.share + '%', this.v4PoolTotals.avg_tat, this.v4PoolTotals.comp_rate + '%'],
      ]);

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 2 — Trend + Heatmap + Hourly Movement
    // ══════════════════════════════════════════════════════════════════════════
    pdf.addPage(); y = 10;
    sectionHeader('Hourly Analytics');
    const p2y = y;
    chartCard('v4trend',   'Request Volume Trend (Hourly)',        195, 75, 10);
    chartCard('v4heat',    'Volume Heatmap (Hourly × Day)',         195, 75, 215);
    y = p2y + 83;
    chartCard('v4hourmov', 'Avg Hourly Movement & Cancellation',   195, 75, 10);
    y += 81;

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 3 — Category + Service charts then tables
    // ══════════════════════════════════════════════════════════════════════════
    pdf.addPage(); y = 10;
    sectionHeader('Service Analysis');
    const p3y = y;
    chartCard('v4svc', 'Request by Service (Pool)', 195, 75, 10);
    y = p3y + 83;

    sectionHeader('Category Performance — Data Table');
    dataTable(['Category','Requests','Share %','Avg TAT (min)'],
      (this.v4CatPerf || []).map((r: any) => [r.category, r.total, r.share + '%', r.avg_tat]));
    sectionHeader('Service Summary — Data Table');
    dataTable(['Service','Total','Completed','Avg TAT (min)'],
      (d.service_summary || []).map((r: any) => [r.service, r.total, r.completed, r.avg_tat]));

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 4 — Porter Performance
    // ══════════════════════════════════════════════════════════════════════════
    pdf.addPage(); y = 10;
    sectionHeader('Porter Performance');
    chartCard('v4portperf', 'Performance by Request Count + Avg TAT', pageW - 20, 90, 10);
    y += 96;
    sectionHeader('Porter Performance — Data Table');
    dataTable(['Porter','Total Requests','Avg TAT (min)'],
      (d.porter_performance || []).map((r: any) => [r.porter, r.total, r.avg_tat]));

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 5 — Floor Movement Tables
    // ══════════════════════════════════════════════════════════════════════════
    pdf.addPage(); y = 10;
    sectionHeader('Movement Summary — Source Locations (From Floor)');
    dataTable(
      ['Location','Total','Completed','In Progress','Cancelled','Avg TAT (min)','Completion %'],
      (this.v4FloorMovement.source || []).map((r: any) =>
        [r.location, r.total, r.completed, r.inprogress, r.cancelled, r.avg_tat, r.comp_rate+'%'])
    );
    sectionHeader('Movement Summary — Destination Locations (To Floor)');
    dataTable(
      ['Location','Total','Completed','In Progress','Cancelled','Avg TAT (min)','Completion %'],
      (this.v4FloorMovement.destination || []).map((r: any) =>
        [r.location, r.total, r.completed, r.inprogress, r.cancelled, r.avg_tat, r.comp_rate+'%'])
    );

    const dateStr = toDateOnly(this.toDateTime) || new Date().toISOString().slice(0,10);
    pdf.save(`Porter-AI-V4-${dateStr}.pdf`);
  }

  // â”€â”€ Main fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getReports() {
    this.reportData = { loading: true, noRecords: false };
    this.drillPanel = false;

    if (!this.fromDateTime || !this.toDateTime) return;
    const fdt = toDateOnly(this.fromDateTime);
    const tdt = toDateOnly(this.toDateTime);
    this.drillParams = { fdt, tdt };
    const param = `/fdt=${fdt}&tdt=${tdt}`;
    this.CommonService.getReportData('ai-porter-req-summary-v1', param).subscribe(
      res  => { this.reportData.loading = false; this.handleResponse(res.results); },
      _err => { this.reportData.loading = false; this.reportData.noRecords = true; }
    );
  }

  private handleResponse(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data;
    this.buildSummaryCards(d);
    this.buildTatStackedBar3D(d.tat_breakdown);
    this.buildTrendLine('createAssignOpt',   d.create_assign_trend,   'Avg Createâ†’Assign (min)');
    this.buildTrendLine('createAcceptOpt',   d.create_accept_trend,   'Avg Createâ†’Accept (min)');
    this.buildTrendLine('acceptArriveOpt',   d.accept_arrive_trend,   'Avg Acceptâ†’Arrive (min)');
    this.buildTrendLine('arriveCompleteOpt', d.arrive_complete_trend, 'Avg Arriveâ†’Complete (min)');
    this.buildHistogram(d.completion_dist);
    this.buildScatter(d.volume_tat_scatter);
    this.buildPorterScorecard(d.porter_scorecard);
    this.buildPoolBar3D(d.pool_performance);
    this.buildCategoryBar3D(d.category_performance);
    this.buildHeatmap(d.location_heatmap);
    this.buildPeakHour(d.peak_hour);
    this.buildDelayLocations(d.delay_locations);
    this.buildManualTrend(d.manual_trend);
    this.buildWeekday3D(d.weekday_dist);
    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  // â”€â”€ Drilldown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drilldown(type: string, key: string) {
    this.drillPanel   = true;
    this.drillLoading = true;
    this.drillRows    = [];
    this.drillCols    = [];
    this.drillShowTrend = false;

    const p = this.drillParams;
    const param = `/fdt=${p.fdt}&tdt=${p.tdt}&drill_type=${type}&drill_key=${encodeURIComponent(key)}`;
    this.CommonService.getReportData('ai-porter-drilldown-v1', param).subscribe(
      res  => this.zone.run(() => { this.drillLoading = false; this.handleDrillResponse(res.results); }),
      _err => { this.drillLoading = false; }
    );
  }

  private handleDrillResponse(res: any) {
    if (res?.statusCode !== 200) return;
    const d = res.data;
    this.drillTitle = d.title || '';
    this.drillRows  = d.rows  || [];
    this.drillCols  = this.drillRows.length ? Object.keys(this.drillRows[0]) : [];

    if (d.trend && d.trend.length) {
      this.drillShowTrend = true;
      const isBar = d.trend[0].hasOwnProperty('count') && !d.trend[0].hasOwnProperty('avg_tat');
      const labels = d.trend.map((r: any) => r.date);
      const vals   = d.trend.map((r: any) => r.count);
      this.drillTrendOpt = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: labels, axisLabel: { rotate: 20 } },
        yAxis: { type: 'value' },
        series: [{ type: isBar ? 'bar' : 'line', smooth: true, data: vals, itemStyle: { color: '#1e8fc8' }, areaStyle: { opacity: 0.2 } }]
      };
    }
    setTimeout(() => this.resizeAllCharts(), 60);
  }

  closeDrill() { this.drillPanel = false; }

  onChartClick(type: string, event: any) {
    let key = '';
    if (type === 'hour' || type === 'location') {
      key = event.name || String(event.data?.[0] ?? '');
      if (type === 'hour') key = key.replace(':00','');
    } else {
      key = event.name || event.data?.name || String(event.data ?? '');
    }
    if (key) this.drilldown(type, key);
  }

  // â”€â”€ Chart builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private buildSummaryCards(d: any) {
    const total  = d.statuswise_count.reduce((s: number, r: any) => s + r.count, 0);
    const done   = d.statuswise_count.find((r: any) => r.status === 'Completed')?.count || 0;
    const avgTat = d.tat_breakdown.length
      ? Math.round(d.tat_breakdown.reduce((s: number, r: any) => s + (r.arrive_to_complete || 0), 0) / d.tat_breakdown.length) : 0;
    this.summaryCards = [
      { label: 'Total Requests',          value: total },
      { label: 'Completed',               value: done },
      { label: 'Completion Rate',         value: total ? Math.round(done/total*100)+'%' : '0%' },
      { label: 'Avg Arriveâ†’Complete (min)', value: avgTat },
      ...d.statuswise_count.map((r: any) => ({ label: r.status, value: r.count }))
    ];
  }

  private buildTatStackedBar3D(rows: any[]) {
    const dates  = rows.map(r => r.date);
    const keys   = ['create_to_assigned','create_to_accept','accept_to_arrive','arrive_to_complete'];
    const labels = ['Createâ†’Assign','Createâ†’Accept','Acceptâ†’Arrive','Arriveâ†’Complete'];
    this.tatBarOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: labels, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: 'Minutes' },
      series: keys.map((key, i) => ({
        name: labels[i], type: 'bar', stack: 'tat',
        data: rows.map(r => r[key] || 0),
        itemStyle: { color: this.palette[i] },
        emphasis: { focus: 'series' }
      }))
    };
  }

  private buildTrendLine(prop: string, rows: any[], label: string) {
    (this as any)[prop] = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => r.date), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: 'Min' },
      series: [{ name: label, type: 'line', smooth: true, data: rows.map(r => r.value),
        itemStyle: { color: '#1e8fc8' }, areaStyle: { opacity: 0.15 } }]
    };
  }

  private buildHistogram(rows: any[]) {
    this.histOpt = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => r.bucket+' min') },
      yAxis: { type: 'value', name: 'Requests' },
      series: [{ type: 'bar', data: rows.map((r,i) => ({ value: r.count, itemStyle: { color: this.palette[i % this.palette.length] } })),
        label: { show: true, position: 'top' } }]
    };
  }

  private buildScatter(rows: any[]) {
    this.scatterOpt = {
      tooltip: { trigger: 'item', formatter: (p: any) => `Hour ${p.data[0]}:00<br>Volume: ${p.data[1]}<br>Avg TAT: ${p.data[2]} min` },
      grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: 'Hour', min: 0, max: 23 },
      yAxis: { type: 'value', name: 'Avg TAT (min)' },
      visualMap: { show: true, dimension: 1, min: 0, max: Math.max(...rows.map(r => r.volume), 1), inRange: { color: ['#91d5ff','#1e8fc8'] } },
      series: [{ type: 'scatter', symbolSize: (d: number[]) => Math.max(8, d[1] / 5),
        data: rows.map(r => [r.hour, r.volume, r.avg_tat]) }]
    };
  }

  private buildPorterScorecard(rows: any[]) {
    this.porterScorecard = rows.map(r => ({
      'Porter': r.porter, 'Total': r.total, 'Completed': r.completed,
      'Cancelled': r.cancelled, 'Avg TAT (min)': r.avg_tat,
      'Avg Arrive (min)': r.avg_arrive, 'Avg Complete (min)': r.avg_complete
    }));
    this.porterScorecardCols = this.porterScorecard.length ? Object.keys(this.porterScorecard[0]) : [];
  }

  // 3D Pool bar
  private buildPoolBar3D(rows: any[]) {
    const cats = rows.map(r => r.pool);
    this.poolBarOpt = {
      tooltip: { show: true },
      legend: { data: ['Total Requests'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: cats, axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', name: 'Count' },
      series: [ make3dBarSeries('Total Requests', rows.map(r => r.total), '#1e8fc8', cats) ]
    } as any;
  }

  // 3D Category bar
  private buildCategoryBar3D(rows: any[]) {
    const cats = rows.map(r => r.category);
    this.categoryBarOpt = {
      tooltip: { show: true },
      legend: { data: ['Total'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: cats, axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', name: 'Count' },
      series: [ make3dBarSeries('Total', rows.map(r => r.total), '#7ed321', cats) ]
    } as any;
  }

  private buildHeatmap(rows: any[]) {
    const locations = Array.from(new Set(rows.map(r => r.location)));
    const hours     = Array.from({ length: 24 }, (_, i) => i);
    const dataMap   = new Map(rows.map(r => [`${r.location}_${r.hour}`, r.avg_ata]));
    const data: any[] = [];
    locations.forEach((loc, li) => hours.forEach(hr => data.push([hr, li, dataMap.get(`${loc}_${hr}`) || 0])));
    const maxVal = Math.max(...rows.map(r => r.avg_ata), 1);
    this.heatmapOpt = {
      tooltip: { formatter: (p: any) => `${locations[p.data[1]]} | ${p.data[0]}:00<br>Avg Arrive: ${p.data[2]} min` },
      grid: { left: '15%', right: '10%', bottom: '10%', top: '5%' },
      xAxis: { type: 'category', data: hours.map(h => `${h}:00`), splitArea: { show: true } },
      yAxis: { type: 'category', data: locations, splitArea: { show: true } },
      visualMap: { min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: ['#e0f3ff','#1e8fc8','#d0021b'] } },
      series: [{ type: 'heatmap', data, label: { show: false } }]
    };
  }

  private buildPeakHour(rows: any[]) {
    this.peakHourOpt = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => `${r.hour}:00`) },
      yAxis: { type: 'value', name: 'Requests' },
      series: [{ type: 'line', smooth: true, data: rows.map(r => r.count),
        areaStyle: { opacity: 0.4, color: { type: 'linear', x:0, y:0, x2:0, y2:1,
          colorStops: [{offset:0, color:'#1e8fc8'},{offset:1, color:'rgba(30,143,200,0.05)'}] } },
        itemStyle: { color: '#1e8fc8' } }]
    };
  }

  private buildDelayLocations(rows: any[]) {
    this.delayLocations = rows.map(r => ({
      'From Location': r.location, 'Total Requests': r.total,
      'Avg Acceptâ†’Arrive (min)': r.avg_arrive, 'Avg Arriveâ†’Complete (min)': r.avg_complete
    }));
    this.delayLocationsCols = this.delayLocations.length ? Object.keys(this.delayLocations[0]) : [];
  }

  private buildManualTrend(rows: any[]) {
    this.manualTrendOpt = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Total','Manual Completions'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => r.date), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: 'Count' },
      series: [
        { name: 'Total', type: 'line', smooth: true, data: rows.map(r => r.total), itemStyle: { color: '#1e8fc8' } },
        { name: 'Manual Completions', type: 'line', smooth: true, data: rows.map(r => r.manual_count),
          itemStyle: { color: '#d0021b' }, areaStyle: { opacity: 0.2 } }
      ]
    };
  }

  // 3D Weekday bar
  private buildWeekday3D(rows: any[]) {
    const days = rows.map(r => r.day);
    this.weekdayOpt = {
      tooltip: { show: true },
      grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: 'Requests' },
      series: [
        make3dBarSeries('Weekday', rows.filter(r => !r.is_weekend).map(r => r.count),
          '#1e8fc8', days),
        make3dBarSeries('Weekend', rows.filter(r => r.is_weekend).map(r => r.count),
          '#f5a623', days)
      ]
    } as any;
  }

  // â”€â”€ V3 fetch + builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private fetchV3() {
    this.reportData = { loading: true, noRecords: false };
    const fdt = toDateOnly(this.fromDateTime);
    const tdt = toDateOnly(this.toDateTime);
    const param = `/fdt=${fdt}&tdt=${tdt}`;
    this.CommonService.getReportData('ai-porter-v3-summary', param).subscribe(
      res  => this.zone.run(() => { this.reportData.loading = false; this.handleV3Response(res.results); }),
      _err => { this.reportData.loading = false; this.reportData.noRecords = true; }
    );
  }

  private handleV3Response(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data;
    this.v3Insights   = d.insights;
    this.v3KpiSummary = d.kpi_summary;
    this.buildV3Bar3D(d.bar3d_data, d.locations);
    this.v3DataReady = true;
    // detectChanges renders the *ngIf DOM, then a microtask tick ensures paint
    // before GridStack scans for .ai-porter-grid
    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  private buildV3Bar3D(data: any[], locations: string[]) {
    const seriesData = data.map(r => [r.hour, locations.indexOf(r.location), r.count]);
    const maxCount   = Math.max(...data.map(r => r.count), 1);

    this.v3Bar3dOpt = {
      backgroundColor: '#0d1117',
      tooltip: { show: true },
      grid3D: {
        boxWidth: 200, boxDepth: 80, boxHeight: 80,
        viewControl: { alpha: 20, beta: 40, distance: 250, rotateSensitivity: 1 },
        axisLine:  { lineStyle: { color: '#4a5568' } },
        axisLabel: { textStyle: { color: '#a0aec0' } },
        splitLine: { lineStyle: { color: '#2d3748', opacity: 0.8 } },
        light:     { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
      },
      xAxis3D: {
        type: 'category', name: 'Hour of Day',
        nameTextStyle: { color: '#63b3ed' },
        axisLabel: { textStyle: { color: '#a0aec0' } },
        data: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
      },
      yAxis3D: {
        type: 'category', name: 'Location',
        nameTextStyle: { color: '#63b3ed' },
        axisLabel: { textStyle: { color: '#a0aec0' } },
        data: locations
      },
      zAxis3D: {
        type: 'value', name: 'Request Count',
        nameTextStyle: { color: '#a0aec0' },
        axisLabel: { textStyle: { color: '#a0aec0' } }
      },
      visualMap: {
        show: false, max: maxCount,
        inRange: { color: ['#1a237e','#0097a7','#2e7d32','#f9a825','#e65100','#b71c1c'] }
      },
      series: [{
        type: 'bar3D', data: seriesData, shading: 'lambert',
        itemStyle: { opacity: 0.85 }, label: { show: false },
        emphasis: { itemStyle: { opacity: 1 } }
      }]
    };
  }

  // â”€â”€ V4 fetch + builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private fetchV4() {
    this.reportData = { loading: true, noRecords: false };
    const fdt = toDateOnly(this.fromDateTime);
    const tdt = toDateOnly(this.toDateTime);
    const param = `/fdt=${fdt}&tdt=${tdt}`;
    this.CommonService.getReportData('ai-porter-v4-summary', param).subscribe(
      res  => this.zone.run(() => { this.reportData.loading = false; this.handleV4Response(res.results); }),
      _err => { this.reportData.loading = false; this.reportData.noRecords = true; }
    );
  }

  private handleV4Response(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data;
    this.v4KpiCards    = d.kpi_cards;
    this.v4PerfMetrics = d.performance_metrics;
    this.buildV4StatusOverview(d.donut_data || [], d.completion_rate);
    this.buildV4Gauge(d.completion_rate);
    this.buildV4Trend(d.hourly_trend);
    this.buildV4Heatmap(d.day_hour_heatmap);
    this.buildV4HeatmapInsights(d.hourly_trend, d.day_hour_heatmap);
    this.buildV4PoolStatus3D(d.pool_status_3d || []);
    this.buildV4PoolDist(d.service_summary || []);
    this.buildV4HourlyMovement(d.hourly_movement || []);
    this.buildV4CatPerf(d.category_summary || []);
    this.buildV4ServiceSummary(d.service_summary || []);
    this.v4FloorMovement = d.floor_movement || { source: [], destination: [] };
    this.buildV4PorterPerf(d.porter_performance || []);
    this.v4RawData = d;
    this.v4DataReady = true;
    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  // ── Row-2 Widget 1: Request Status Overview ────────────────────────────────
  private static readonly STATUS_COLOR: { [k: string]: string } = {
    'Completed':   '#22c55e',
    'Cancelled':   '#ef4444',
    'Waitlisted':  '#f59e0b',
    'In Progress': '#8b5cf6',
    'Accepted':    '#3b82f6',
  };
  private static readonly STATUS_ICON: { [k: string]: string } = {
    'Completed':   'check_circle',
    'Cancelled':   'cancel',
    'Waitlisted':  'schedule',
    'In Progress': 'autorenew',
    'Accepted':    'how_to_reg',
  };

  private buildV4StatusOverview(rows: any[], rate: number) {
    this.v4CompletionRate = Math.round((rate || 0) * 10) / 10;
    const total = rows.reduce((s, r) => s + (r.value || 0), 0) || 1;
    this.v4StatusTotal = rows.reduce((s, r) => s + (r.value || 0), 0);
    this.v4StatusCards = rows.map(r => {
      const pct = r.pct != null ? r.pct : Math.round((r.value / total) * 1000) / 10;
      return {
        name:  r.name,
        value: r.value,
        pct,
        color: PorterV2ReportComponent.STATUS_COLOR[r.name] || '#94a3b8',
        icon:  PorterV2ReportComponent.STATUS_ICON[r.name]  || 'fiber_manual_record',
      };
    });
    this.v4StatusDonutOpt = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['52%', '80%'],
        center: ['50%', '50%'],
        data: this.v4StatusCards.map(c => ({ name: c.name, value: c.value, itemStyle: { color: c.color } })),
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
      }]
    };
  }

  get v4CrColor(): string {
    return this.v4CompletionRate >= 70 ? '#22c55e' : this.v4CompletionRate >= 30 ? '#f59e0b' : '#ef4444';
  }

  private buildV4Gauge(rate: number) {
    const zColor = rate >= 70 ? '#22c55e' : rate >= 30 ? '#f59e0b' : '#ef4444';
    const zWord  = rate >= 70 ? 'EXCELLENT' : rate >= 30 ? 'AVERAGE' : 'POOR';
    this.v4GaugeZoneColor = zColor;
    this.v4GaugeStatus    = rate >= 70 ? '✔ Green Zone  ·  HIGH PERFORMANCE'
                          : rate >= 30 ? '⚠ Average Zone'
                          : '✖ Poor Zone';

    const rateStr = (Math.round(rate * 10) / 10).toString();

    this.v4GaugeOpt = {
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge',
        startAngle: 210, endAngle: -30,           // 240° sweep, balanced open bottom
        min: 0, max: 100,
        radius: '96%',
        center: ['50%', '56%'],
        // light rounded track
        axisLine: {
          roundCap: true,
          lineStyle: { width: 16, color: [[1, '#eef2f7']] }
        },
        // coloured progress arc on top of the track
        progress: {
          show: true, width: 16, roundCap: true,
          itemStyle: { color: zColor }
        },
        pointer:   { show: false },
        axisTick:  { show: false },
        splitLine: { show: false },
        axisLabel: {
          show: true, distance: -2, color: '#94a3b8', fontSize: 10,
          formatter: (v: number) => (v === 0 || v === 100 ? v.toString() : '')
        },
        anchor:    { show: false },
        title:     { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '6%'],
          formatter: [`{val|${rateStr}%}`, `{word|${zWord}}`].join('\n'),
          rich: {
            val:  { fontSize: 30, fontWeight: 'bold' as any, color: zColor, lineHeight: 32 },
            word: { fontSize: 11, fontWeight: 'bold' as any, color: '#94a3b8', letterSpacing: 1.5, lineHeight: 18 }
          }
        },
        data: [{ value: rate }]
      } as any]
    };
  }

  private buildV4Trend(rows: any[]) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const map   = new Map(rows.map(r => [r.hour, r.count]));
    this.v4TrendOpt = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name} â€” ${p[0].value} requests` },
      grid: { left: '3%', right: '3%', top: '8%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: hours.map(h => `${String(h).padStart(2,'0')}:00`),
        boundaryGap: false, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' } },
      series: [{
        type: 'line', smooth: true,
        data: hours.map(h => map.get(h) || 0),
        itemStyle: { color: '#3b82f6' },
        lineStyle: { color: '#3b82f6', width: 2 },
        symbol: 'circle', symbolSize: 6,
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1,
          colorStops: [{ offset:0, color:'rgba(59,130,246,0.2)' },{ offset:1, color:'rgba(59,130,246,0)' }] } }
      }]
    };
  }

  private buildV4Heatmap(rows: any[]) {
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const hours = [0,3,6,9,12,15,18,21];
    const dMap  = new Map(rows.map(r => [`${r.day}_${r.hour}`, r.count]));
    const data: any[] = [];
    days.forEach((d, di) => {
      for (let h = 0; h < 24; h++) {
        const cnt = rows.filter(r => r.day === d && r.hour === h).reduce((s, r) => s + r.count, 0)
                  || dMap.get(`${d}_${h}`) || 0;
        data.push([h, di, cnt]);
      }
    });
    const maxV = Math.max(...rows.map(r => r.count), 1);
    this.v4HeatmapOpt = {
      tooltip: { formatter: (p: any) => `${days[p.data[1]]} ${p.data[0]}:00 â€” ${p.data[2]} requests` },
      grid: { left: '8%', right: '5%', top: '5%', bottom: '15%' },
      xAxis: { type: 'category', data: Array.from({length:24}, (_,i) => i % 3 === 0 ? `${i===0?'12 AM':i<12?i+' AM':i===12?'12 PM':(i-12)+' PM'}` : ''),
        axisLabel: { color: '#6b7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
      yAxis: { type: 'category', data: days, axisLabel: { color: '#6b7280' },
        axisLine: { lineStyle: { color: '#e5e7eb' } } },
      visualMap: { show: true, min: 0, max: maxV, orient: 'horizontal', left: 'center', bottom: '0%',
        text: ['High','Low'], textStyle: { color: '#6b7280', fontSize: 10 },
        inRange: { color: ['#dbeafe','#93c5fd','#3b82f6','#1d4ed8'] } },
      series: [{ type: 'heatmap', data, label: { show: false } }]
    };
  }

  private buildV4HourlyMovement(rows: any[]) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const tMap  = new Map(rows.map(r => [r.hour, r.total]));
    const cMap  = new Map(rows.map(r => [r.hour, r.cancelled]));
    this.v4HourlyMovOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Total Movement', 'Cancellation'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: hours.map(h => `${String(h).padStart(2,'0')}:00`), axisLabel: { rotate: 45, fontSize: 9 } },
      yAxis: { type: 'value', name: 'Requests' },
      series: [
        { name: 'Total Movement', type: 'bar', data: hours.map(h => tMap.get(h) || 0), itemStyle: { color: '#3b82f6' } },
        { name: 'Cancellation',   type: 'bar', data: hours.map(h => cMap.get(h) || 0), itemStyle: { color: '#ef4444' } }
      ]
    };
  }

  // ── Row-2 Widget 3: Category Performance (table, no SLA column) ─────────────
  private static readonly CATEGORY_ICON: { [k: string]: string } = {
    'Patient Transport': 'airline_seat_flat',
    'Services':          'handyman',
    'OPD':               'local_hospital',
    'Sample Collection': 'science',
  };

  private buildV4CatPerf(rows: any[]) {
    const total = rows.reduce((s, r) => s + (r.total || 0), 0) || 1;
    this.v4CatPerf = rows.map(r => ({
      category: r.category,
      total:    r.total,
      share:    Math.round((r.total / total) * 1000) / 10,
      avg_tat:  r.avg_tat,
      icon:     PorterV2ReportComponent.CATEGORY_ICON[r.category] || 'local_shipping',
    }));
  }

  private buildV4ServiceSummary(rows: any[]) {
    this.v4ServiceOpt = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Total', 'Completed', 'Avg TAT (min)'], bottom: 0 },
      grid: { left: '3%', right: '5%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => r.service), axisLabel: { rotate: 20, fontSize: 9 } },
      yAxis: [{ type: 'value', name: 'Count' }, { type: 'value', name: 'TAT (min)' }],
      series: [
        { name: 'Total',         type: 'bar',  data: rows.map(r => r.total),     itemStyle: { color: '#8b5cf6' } },
        { name: 'Completed',     type: 'bar',  data: rows.map(r => r.completed), itemStyle: { color: '#22c55e' } },
        { name: 'Avg TAT (min)', type: 'line', yAxisIndex: 1, smooth: true, data: rows.map(r => r.avg_tat), itemStyle: { color: '#f59e0b' } }
      ]
    };
  }


  private buildV4HeatmapInsights(hourly: any[], dayHour: any[]) {
    if (!hourly.length) { this.v4HeatmapInsights = []; return; }
    const fmt = (h: number) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
    const peak = hourly.reduce((a, b) => b.count > a.count ? b : a);
    const idle = hourly.reduce((a, b) => b.count < a.count ? b : a);
    const avg  = Math.round(hourly.reduce((s, r) => s + r.count, 0) / hourly.length);
    const dayTotals: Record<string,number> = {};
    dayHour.forEach(r => { dayTotals[r.day] = (dayTotals[r.day] || 0) + r.count; });
    const busiest = Object.entries(dayTotals).sort((a,b) => b[1]-a[1])[0];
    const quietest = Object.entries(dayTotals).sort((a,b) => a[1]-b[1])[0];
    this.v4HeatmapInsights = [
      { icon: 'trending_up', label: 'Peak Hour',    value: fmt(peak.hour),       sub: `${peak.count} requests` },
      { icon: 'bedtime',     label: 'Idle Hour',    value: fmt(idle.hour),       sub: `${idle.count} requests` },
      { icon: 'bar_chart',   label: 'Avg / Hour',   value: `${avg}`,             sub: 'requests' },
      { icon: 'today',       label: 'Busiest Day',  value: busiest?.[0]  || '-', sub: `${busiest?.[1]  || 0} requests` },
      { icon: 'nights_stay', label: 'Quietest Day', value: quietest?.[0] || '-', sub: `${quietest?.[1] || 0} requests` },
    ];
  }

  // ── Row-2 Widget 2: Poolwise Request Distribution (table) ──────────────────
  private buildV4PoolDist(rows: any[]) {
    const sumTotal = rows.reduce((s, r) => s + (r.total || 0), 0) || 1;
    const sumComp  = rows.reduce((s, r) => s + (r.completed || 0), 0);
    this.v4PoolDist = rows.map(r => ({
      pool:      r.service,
      total:     r.total,
      share:     Math.round((r.total / sumTotal) * 1000) / 10,
      avg_tat:   r.avg_tat,
      comp_rate: r.total ? Math.round((r.completed / r.total) * 1000) / 10 : 0,
    }));
    const totalTat = rows.reduce((s, r) => s + (r.avg_tat || 0) * (r.total || 0), 0);
    this.v4PoolTotals = {
      total:     sumTotal,
      share:     100,
      avg_tat:   Math.round((totalTat / sumTotal) * 10) / 10,   // request-weighted avg
      comp_rate: Math.round((sumComp / sumTotal) * 1000) / 10,
    };
  }

  private buildV4PorterPerf(rows: any[]) {
    const reversed = [...rows].reverse();
    const avgTat   = rows.length ? +(rows.reduce((s, r) => s + r.avg_tat, 0) / rows.length).toFixed(1) : 0;
    this.v4PorterPerfOpt = {
      tooltip: { trigger: 'axis', formatter: (p: any) =>
        `<b>${p[0].name}</b><br/>Requests: ${p[0].value}<br/>Avg TAT: ${p[1]?.value} min` },
      legend: { data: ['Request Count', 'Avg TAT (min)'], bottom: 0 },
      grid: { containLabel: true, right: '6%', top: '5%', bottom: '12%' },
      xAxis: [
        { type: 'value', name: 'Requests' },
        { type: 'value', name: 'TAT (min)', position: 'top' }
      ],
      yAxis: { type: 'category', data: reversed.map(r => r.porter), axisLabel: { fontSize: 10 } },
      series: [
        {
          name: 'Request Count', type: 'bar', xAxisIndex: 0,
          data: reversed.map(r => r.total),
          label: { show: true, position: 'right', fontSize: 9 },
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Avg TAT (min)', type: 'line', xAxisIndex: 1,
          smooth: true, data: reversed.map(r => r.avg_tat),
          itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 5,
          markLine: { data: [{ xAxis: avgTat, label: { formatter: `Avg: ${avgTat}` }, lineStyle: { color: '#f59e0b', type: 'dashed' } }] }
        }
      ]
    };
  }

  private buildV4PoolStatus3D(rows: any[]) {
    const pools    = Array.from(new Set(rows.map(r => r.pool))).sort();
    const statuses = Array.from(new Set(rows.map(r => r.status))).sort();
    const dMap = new Map(rows.map(r => [`${r.pool}|${r.status}`, r.count]));

    const seriesData: any[] = [];
    pools.forEach((pool, pi) =>
      statuses.forEach((status, si) => {
        const color = PorterV2ReportComponent.STATUS_COLOR[status as string] || '#94a3b8';
        seriesData.push({ value: [pi, si, dMap.get(`${pool}|${status}`) || 0], itemStyle: { color, opacity: 0.88 } });
      })
    );

    this.v4PoolStatus3dOpt = {
      backgroundColor: '#ffffff',
      tooltip: {
        show: true,
        formatter: (p: any) => {
          const v      = Array.isArray(p.data) ? p.data : p.data.value;
          const pool   = pools[v[0]]    || v[0];
          const status = statuses[v[1]] || v[1];
          const count  = v[2];
          return `<b>Pool:</b> ${pool}<br/><b>Status:</b> ${status}<br/><b>Count:</b> ${count}`;
        }
      },
      grid3D: {
        boxWidth: 180, boxDepth: 70, boxHeight: 70,
        viewControl: { alpha: 20, beta: 40, distance: 280, rotateSensitivity: 1 },
        axisLine:  { lineStyle: { color: '#d1d5db' } },
        axisLabel: { textStyle: { color: '#6b7280' } },
        splitLine: { lineStyle: { color: '#e5e7eb', opacity: 0.8 } },
        light:     { main: { intensity: 1.2 }, ambient: { intensity: 0.4 } }
      },
      xAxis3D: {
        type: 'category', name: 'Pool Name',
        nameTextStyle: { color: '#374151', fontSize: 11 },
        axisLabel: { textStyle: { color: '#6b7280', fontSize: 9 } },
        data: pools
      },
      yAxis3D: {
        type: 'category', name: 'Status',
        nameTextStyle: { color: '#374151', fontSize: 11 },
        axisLabel: { textStyle: { color: '#6b7280', fontSize: 9 } },
        data: statuses
      },
      zAxis3D: {
        type: 'value', name: 'Count',
        nameTextStyle: { color: '#374151', fontSize: 11 },
        axisLabel: { textStyle: { color: '#6b7280' } }
      },
      series: [{
        type: 'bar3D', data: seriesData, shading: 'lambert',
        label: { show: false },
        emphasis: { itemStyle: { opacity: 1 } }
      }]
    };
    this.buildV4PoolStatusInsights(rows);
  }

  private buildV4PoolStatusInsights(rows: any[]) {
    if (!rows.length) { this.v4PoolStatusInsights = []; return; }
    // Group by pool → map of status→count
    const poolMap: Record<string, Record<string, number>> = {};
    rows.forEach(r => {
      if (!poolMap[r.pool]) poolMap[r.pool] = {};
      poolMap[r.pool][r.status] = (poolMap[r.pool][r.status] || 0) + r.count;
    });
    const statusOrder = ['Completed', 'In Progress', 'Waitlisted', 'Cancelled', 'Accepted'];
    this.v4PoolStatusInsights = Object.entries(poolMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([pool, statusMap]) => ({
        pool,
        stats: statusOrder
          .filter(s => statusMap[s])
          .map(s => ({ name: s, count: statusMap[s], color: PorterV2ReportComponent.STATUS_COLOR[s] || '#94a3b8' })),
      }));
  }

  // ── V5 fetch + builders ───────────────────────────────────────────────────
  private fetchV5() {
    this.reportData = { loading: true, noRecords: false };
    const fdt = toDateOnly(this.fromDateTime);
    const tdt = toDateOnly(this.toDateTime);
    const param = `/fdt=${fdt}&tdt=${tdt}`;
    this.CommonService.getReportData('ai-porter-v5-summary', param).subscribe(
      res  => this.zone.run(() => { this.reportData.loading = false; this.handleV5Response(res.results); }),
      _err => { this.reportData.loading = false; this.reportData.noRecords = true; }
    );
  }

  private buildV5YoyInsights(kpi: any[]) {
    const total = kpi[0]?.value || 0;
    const comp  = kpi[1]?.value || 0;
    const canc  = kpi[2]?.value || 0;
    this.v5CompletionPct = total ? Math.round((comp / total) * 1000) / 10 : 0;
    const cancChg = kpi[2];
    this.v5YoyInsights = [
      { icon: 'assignment',   label: 'Total Requests',   value: `${total.toLocaleString()}`,         sub: `${kpi[0]?.change_pct > 0 ? '+' : ''}${kpi[0]?.change_pct}% vs last yr` },
      { icon: 'check_circle', label: 'Completed',        value: `${comp.toLocaleString()}`,          sub: `${kpi[1]?.change_pct > 0 ? '+' : ''}${kpi[1]?.change_pct}% vs last yr` },
      { icon: 'cancel',       label: 'Cancelled',        value: `${canc.toLocaleString()}`,          sub: `${cancChg?.change_pct > 0 ? '+' : ''}${cancChg?.change_pct}% vs last yr` },
      { icon: 'schedule',     label: 'Avg Response',     value: `${kpi[3]?.value || 0} min`,         sub: `${kpi[3]?.change_pct > 0 ? '+' : ''}${kpi[3]?.change_pct}% vs last yr` },
      { icon: 'calendar_today',label:'Per Day',          value: `${kpi[4]?.value || 0}`,             sub: `${kpi[4]?.change_pct > 0 ? '+' : ''}${kpi[4]?.change_pct}% vs last yr` },
    ];
  }

  private handleV5Response(res: any) {
    if (res?.statusCode !== 200) { this.reportData.noRecords = true; return; }
    const d = res.data;
    this.v5KpiCards     = d.kpi_cards      || [];
    this.v5MonthlyTable = d.monthly_table  || [];
    this.v5YoySummary   = d.yoy_summary    || [];
    this.v5PeriodLabels = d.period_labels  || {};
    this.buildV5MonthlyTrend(d.monthly_trend   || []);
    this.buildV5DeptBar(d.poolwise_comparison   || []);
    this.buildV5StatusDonut(d.status_donut      || {});
    this.buildV5TimeSlot(d.time_slot            || []);
    this.buildV5YoyInsights(this.v5KpiCards);
    this.v5DataReady = true;
    setTimeout(() => this.waitForGridAndInit(), 0);
  }

  private buildV5MonthlyTrend(rows: any[]) {
    const cur  = rows.map(r => r.current);
    const prev = rows.map(r => r.previous);
    const labels = rows.map(r => r.month.slice(0, 7));
    const curLabel  = this.v5PeriodLabels.current  || 'Current';
    const prevLabel = this.v5PeriodLabels.previous || 'Previous';
    this.v5MonthlyTrendOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [curLabel, prevLabel], bottom: 0 },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30, fontSize: 9 } },
      yAxis: { type: 'value', name: 'Requests' },
      series: [
        { name: curLabel,  type: 'bar', data: cur,  itemStyle: { color: '#3b82f6' }, label: { show: true, position: 'top', fontSize: 9 } },
        { name: prevLabel, type: 'bar', data: prev, itemStyle: { color: '#d1d5db' }, label: { show: true, position: 'top', fontSize: 9 } }
      ]
    };
  }

  private buildV5DeptBar(rows: any[]) {
    const curLabel  = this.v5PeriodLabels.current  || 'Current';
    const prevLabel = this.v5PeriodLabels.previous || 'Previous';
    rows = rows.slice(0, 10);
    const depts = rows.map(r => r.poolName);
    this.v5DeptBarOpt = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [curLabel, prevLabel], bottom: 0 },
      grid: { containLabel: true, right: '5%', bottom: '10%', top: '5%' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: [...depts].reverse(), axisLabel: { fontSize: 10 } },
      series: [
        { name: curLabel,  type: 'bar', data: rows.map(r => r.current).reverse(),  itemStyle: { color: '#3b82f6' }, label: { show: true, position: 'right', fontSize: 9 } },
        { name: prevLabel, type: 'bar', data: rows.map(r => r.previous).reverse(), itemStyle: { color: '#d1d5db' }, label: { show: true, position: 'right', fontSize: 9 } }
      ]
    };
  }

  private buildV5StatusDonut(data: any) {
    this.v5StatusDonutOpt = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['55%','80%'],
        label: { show: true, formatter: (p: any) => `${p.name}\n${p.value} (${p.percent}%)`, fontSize: 10 },
        data: [
          { name: 'Completed', value: data.completed || 0, itemStyle: { color: '#22c55e' } },
          { name: 'Cancelled', value: data.cancelled || 0, itemStyle: { color: '#ef4444' } },
        ]
      }]
    };
  }

  private buildV5TimeSlot(rows: any[]) {
    const curLabel  = this.v5PeriodLabels.current  || 'Current';
    const prevLabel = this.v5PeriodLabels.previous || 'Previous';
    this.v5TimeSlotOpt = {
      tooltip: { trigger: 'axis' },
      legend: { data: [curLabel, prevLabel], bottom: 0 },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: rows.map(r => r.slot), axisLabel: { rotate: 40, fontSize: 8 } },
      yAxis: { type: 'value', name: 'Requests' },
      series: [
        { name: curLabel,  type: 'line', smooth: true, data: rows.map(r => r.current),  itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 5, label: { show: true, fontSize: 8 } },
        { name: prevLabel, type: 'line', smooth: true, data: rows.map(r => r.previous), itemStyle: { color: '#9ca3af' }, symbol: 'circle', symbolSize: 5, label: { show: true, fontSize: 8 } }
      ]
    };
  }

  // Drilldown from porter scorecard row click
  onPorterRowClick(row: any) {
    const porter = row['Porter'];
    if (porter) this.drilldown('porter', porter);
  }

  // Drilldown from delay location row click
  onLocationRowClick(row: any) {
    const loc = row['From Location'];
    if (loc) this.drilldown('location', loc);
  }
}
