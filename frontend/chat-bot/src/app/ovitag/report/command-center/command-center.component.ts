import { Component, OnInit, OnDestroy, ViewEncapsulation, Input } from '@angular/core';
import { EChartsOption } from 'echarts';

// Set to false to load data from API instead of the static JSON below
const USE_STATIC_DATA = true;

// Real-time refresh interval (ms) — each tick re-loads the data and rebuilds all widgets
const REFRESH_INTERVAL_MS = 5000;

// ── Static sample data ────────────────────────────────────────────────────────
const STATIC_DATA: any = {
  "staff": {
    "summary": { "totalStaff": 1350, "onDuty": 1248, "checkedInPercentage": 92.4, "sosRaisedToday": 3, "sosChange": 50 },
    "mustering": { "safe": 1148, "missing": 48, "unaccounted": 52 },
    "floorOccupancy": [
      { "floor": "Floor 5", "staff": 128 },
      { "floor": "Floor 4", "staff": 96 },
      { "floor": "Floor 3", "staff": 112 },
      { "floor": "Floor 2", "staff": 104 },
      { "floor": "Floor 1", "staff": 64 }
    ]
  },
  "assets": {
    "summary": { "total": 2145, "inUse": 1284, "available": 678, "maintenance": 112, "missing": 71 },
    "utilization": [
      { "status": "In Use", "percentage": 60 },
      { "status": "Available", "percentage": 32 },
      { "status": "Maintenance", "percentage": 5 },
      { "status": "Reserved", "percentage": 2 },
      { "status": "Missing", "percentage": 1 }
    ],
    "category": [
      { "name": "Medical Devices", "count": 592 },
      { "name": "IT Equipment", "count": 324 },
      { "name": "Mobility", "count": 208 },
      { "name": "General", "count": 160 }
    ]
  },
  "environment": {
    "roomTemperature": {
      "current": 24.6, "change": 1.2,
      "trend": [23.8, 23.5, 23.2, 23.4, 23.3, 23.5, 23.6, 23.5, 23.4, 23.7, 24.0, 24.6]
    },
    "freezerTemperature": {
      "current": -18.2, "change": 0.8,
      "trend": [-18.5, -18.2, -18.8, -19.1, -18.7, -18.9, -18.8, -19.2, -18.9, -18.6, -18.4, -18.2]
    }
  },
  "patients": {
    "movement": { "ER": 342, "OPD": 567, "ICU": 1053, "Ward": 1453, "Radiology": 320, "Lab": 430, "OT": 256, "Discharge": 1176 },
    "bedOccupancy": {
      "overall": 78.6, "change": 4.7, "occupied": 1256, "available": 342,
      "wardWise": [
        { "ward": "ICU", "occupancy": 88 },
        { "ward": "NICU", "occupancy": 72 },
        { "ward": "Ward 3A", "occupancy": 76 },
        { "ward": "Ward 3B", "occupancy": 72 },
        { "ward": "Ward 4A", "occupancy": 65 }
      ]
    },
    "digitalQueue": { "total": 286, "waiting": 96, "inProgress": 128, "completed": 62 }
  },
  "operationTheatre": { "inSurgery": 18, "scheduled": 26, "preOp": 8, "recovery": 6, "completed": 34 },
  "alerts": {
    "summary": { "total": 7, "critical": 2, "high": 3, "medium": 1, "low": 1 },
    "trend": [
      { "hour": "10 AM", "critical": 1, "high": 2, "medium": 1, "low": 0 },
      { "hour": "12 PM", "critical": 8, "high": 5, "medium": 3, "low": 2 },
      { "hour": "2 PM", "critical": 14, "high": 9, "medium": 5, "low": 4 },
      { "hour": "4 PM", "critical": 12, "high": 10, "medium": 7, "low": 5 },
      { "hour": "6 PM", "critical": 18, "high": 12, "medium": 9, "low": 5 },
      { "hour": "8 PM", "critical": 17, "high": 11, "medium": 10, "low": 6 },
      { "hour": "10 PM", "critical": 16, "high": 13, "medium": 10, "low": 6 },
      { "hour": "12 AM", "critical": 22, "high": 15, "medium": 12, "low": 7 },
      { "hour": "2 AM", "critical": 21, "high": 14, "medium": 11, "low": 6 },
      { "hour": "4 AM", "critical": 17, "high": 12, "medium": 10, "low": 5 }
    ],
    "topTypes": [
      { "name": "Infant Safety", "count": 5 },
      { "name": "Environment", "count": 4 },
      { "name": "Nurse Call", "count": 3 },
      { "name": "Patient Tracking", "count": 3 },
      { "name": "Assets", "count": 2 }
    ],
    "locations": [
      { "location": "NICU-3", "count": 3 },
      { "location": "Ward 3A", "count": 2 },
      { "location": "Lab-1", "count": 1 },
      { "location": "ICU-2", "count": 1 }
    ]
  }
};

// ── Palette ───────────────────────────────────────────────────────────────────
const C_BLUE   = '#3b82f6';
const C_GREEN  = '#22c55e';
const C_ORANGE = '#f59e0b';
const C_YELLOW = '#facc15';
const C_RED    = '#ef4444';

// Minimal, smooth animation shared by all charts: short first paint,
// gentle transition on each real-time refresh
const BASE_ANIM: EChartsOption = {
  animation: true,
  animationDuration: 400,
  animationEasing: 'cubicOut',
  animationDurationUpdate: 700,
  animationEasingUpdate: 'cubicInOut'
};

@Component({
  selector: 'app-command-center',
  templateUrl: './command-center.component.html',
  styleUrls: ['./command-center.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class CommandCenterComponent implements OnInit, OnDestroy {
  @Input() showHeader: any = false;

  loading = true;
  noRecords = false;
  data: any = null;
  lastUpdated: Date = new Date();
  private refreshTimer: any = null;

  // Derived values for template binding
  musteringLegend: { label: string; value: number; pct: number; color: string }[] = [];
  categoryLegend:  { label: string; value: number; pct: number; color: string }[] = [];
  queueLegend:     { label: string; value: number; pct: number; color: string }[] = [];
  utilizationBar:  { status: string; percentage: number; color: string }[] = [];
  otStatusList:    { label: string; value: number }[] = [];

  // Chart options
  musteringOpt:    EChartsOption = {};
  floorOpt:        EChartsOption = {};
  categoryOpt:     EChartsOption = {};
  roomTempOpt:     EChartsOption = {};
  freezerTempOpt:  EChartsOption = {};
  movementOpt:     EChartsOption = {};
  bedOccupancyOpt: EChartsOption = {};
  queueOpt:        EChartsOption = {};
  alertTrendOpt:   EChartsOption = {};
  alertLocOpt:     EChartsOption = {};

  ngOnInit(): void {
    this.loadData();
    this.refreshTimer = setInterval(() => this.refreshTick(), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  loadData(): void {
    this.loading = true;
    if (USE_STATIC_DATA) {
      this.data = JSON.parse(JSON.stringify(STATIC_DATA));
      this.buildDashboard();
      this.lastUpdated = new Date();
      this.loading = false;
    } else {
      // TODO: replace with real API call and assign the response to this.data,
      // then call this.buildDashboard(). Keep the same JSON structure as STATIC_DATA.
      this.noRecords = true;
      this.loading = false;
    }
  }

  // ── Real-time refresh ───────────────────────────────────────────────────────
  // Static data is jittered on every tick so the dashboard behaves like a live
  // feed. When a real API is wired in, replace the simulation with a re-fetch.
  private refreshTick(): void {
    if (!this.data) { return; }
    this.data = this.simulateLiveData();
    this.buildDashboard();
    this.lastUpdated = new Date();
  }

  private simulateLiveData(): any {
    const base = STATIC_DATA;
    const d = JSON.parse(JSON.stringify(this.data));
    // Random integer around v (±pct), never below zero
    const jit = (v: number, pct: number) =>
      Math.max(0, Math.round(v + v * (Math.random() * 2 - 1) * pct));

    // Staff
    d.staff.summary.onDuty = Math.min(d.staff.summary.totalStaff, jit(base.staff.summary.onDuty, 0.01));
    d.staff.summary.checkedInPercentage = +((d.staff.summary.onDuty / d.staff.summary.totalStaff) * 100).toFixed(1);
    d.staff.mustering.missing = jit(base.staff.mustering.missing, 0.2);
    d.staff.mustering.unaccounted = jit(base.staff.mustering.unaccounted, 0.2);
    d.staff.mustering.safe = Math.max(0, d.staff.summary.onDuty - d.staff.mustering.missing - d.staff.mustering.unaccounted);
    d.staff.floorOccupancy.forEach((f: any, i: number) => f.staff = jit(base.staff.floorOccupancy[i].staff, 0.08));

    // Assets (total stays fixed; in-use/available shift against each other)
    const inUse = jit(base.assets.summary.inUse, 0.02);
    d.assets.summary.inUse = inUse;
    d.assets.summary.available = Math.max(0,
      base.assets.summary.total - inUse - d.assets.summary.maintenance - d.assets.summary.missing);
    d.assets.category.forEach((c: any, i: number) => c.count = jit(base.assets.category[i].count, 0.04));

    // Environment — roll the trends forward one point
    const roll = (env: any, step: number, decimals = 1) => {
      const last = env.trend[env.trend.length - 1];
      const next = +(last + (Math.random() * 2 - 1) * step).toFixed(decimals);
      env.trend.push(next);
      env.trend.shift();
      env.current = next;
      env.change = +(next - env.trend[0]).toFixed(decimals);
    };
    roll(d.environment.roomTemperature, 0.3);
    roll(d.environment.freezerTemperature, 0.3);

    // Patients
    Object.keys(d.patients.movement).forEach(k =>
      d.patients.movement[k] = jit(base.patients.movement[k], 0.03));
    const bo = d.patients.bedOccupancy;
    bo.occupied = jit(base.patients.bedOccupancy.occupied, 0.02);
    bo.available = Math.max(0, (base.patients.bedOccupancy.occupied + base.patients.bedOccupancy.available) - bo.occupied);
    bo.overall = +((bo.occupied / (bo.occupied + bo.available)) * 100).toFixed(1);
    bo.wardWise.forEach((w: any, i: number) =>
      w.occupancy = Math.min(100, jit(base.patients.bedOccupancy.wardWise[i].occupancy, 0.05)));
    const q = d.patients.digitalQueue;
    q.waiting = jit(base.patients.digitalQueue.waiting, 0.1);
    q.inProgress = jit(base.patients.digitalQueue.inProgress, 0.1);
    q.completed = jit(base.patients.digitalQueue.completed, 0.1);
    q.total = q.waiting + q.inProgress + q.completed;

    // Operation theatre
    Object.keys(d.operationTheatre).forEach(k =>
      d.operationTheatre[k] = jit(base.operationTheatre[k], 0.15));

    // Alerts
    const a = d.alerts.summary;
    a.critical = jit(base.alerts.summary.critical, 0.5);
    a.high = jit(base.alerts.summary.high, 0.5);
    a.medium = jit(base.alerts.summary.medium, 0.5);
    a.low = jit(base.alerts.summary.low, 0.5);
    a.total = a.critical + a.high + a.medium + a.low;
    d.alerts.trend.forEach((t: any, i: number) => {
      t.critical = jit(base.alerts.trend[i].critical, 0.15);
      t.high = jit(base.alerts.trend[i].high, 0.15);
      t.medium = jit(base.alerts.trend[i].medium, 0.15);
      t.low = jit(base.alerts.trend[i].low, 0.15);
    });
    d.alerts.locations.forEach((l: any, i: number) =>
      l.count = jit(base.alerts.locations[i].count, 0.4));

    return d;
  }

  private buildDashboard(): void {
    this.buildStaffWidgets();
    this.buildAssetWidgets();
    this.buildEnvironmentWidgets();
    this.buildPatientWidgets();
    this.buildOtWidgets();
    this.buildAlertWidgets();
  }

  // ── Staff ───────────────────────────────────────────────────────────────────
  private buildStaffWidgets(): void {
    const m = this.data.staff.mustering;
    const total = m.safe + m.missing + m.unaccounted;
    const pct = (v: number) => Math.round((v / total) * 100);

    this.musteringLegend = [
      { label: 'Safe',        value: m.safe,        pct: pct(m.safe),        color: C_GREEN },
      { label: 'Missing',     value: m.missing,     pct: pct(m.missing),     color: C_ORANGE },
      { label: 'Unaccounted', value: m.unaccounted, pct: pct(m.unaccounted), color: C_RED }
    ];

    this.musteringOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['68%', '88%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: this.musteringLegend.map(l => ({ name: l.label, value: l.value, itemStyle: { color: l.color } }))
      }],
      graphic: [{
        type: 'text', left: 'center', top: '40%',
        style: { text: pct(m.safe) + '%', fontSize: 22, fontWeight: 'bold', fill: '#1f2937' }
      }, {
        type: 'text', left: 'center', top: '58%',
        style: { text: 'Safe', fontSize: 12, fill: '#6b7280' }
      }]
    };

    const floors = [...this.data.staff.floorOccupancy];
    this.floorOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 42, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category', inverse: true,
        data: floors.map((f: any) => f.floor),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: floors.map((f: any) => f.staff),
        barWidth: 10,
        itemStyle: { color: C_BLUE, borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#374151', fontSize: 11 }
      }]
    };
  }

  // ── Assets ──────────────────────────────────────────────────────────────────
  private buildAssetWidgets(): void {
    const utilColors: any = {
      'In Use': C_GREEN, 'Available': C_BLUE, 'Maintenance': C_ORANGE,
      'Reserved': C_YELLOW, 'Missing': C_RED
    };
    this.utilizationBar = this.data.assets.utilization.map((u: any) => ({
      ...u, color: utilColors[u.status] || C_BLUE
    }));

    const catColors = [C_RED, C_ORANGE, C_BLUE, C_GREEN];
    const cats = this.data.assets.category;
    const catTotal = cats.reduce((s: number, c: any) => s + c.count, 0);
    this.categoryLegend = cats.map((c: any, i: number) => ({
      label: c.name, value: c.count,
      pct: Math.round((c.count / catTotal) * 100),
      color: catColors[i % catColors.length]
    }));

    this.categoryOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['68%', '88%'],
        label: { show: false },
        data: this.categoryLegend.map(l => ({ name: l.label, value: l.value, itemStyle: { color: l.color } }))
      }],
      graphic: [{
        type: 'text', left: 'center', top: '40%',
        style: { text: this.data.assets.summary.inUse.toLocaleString(), fontSize: 20, fontWeight: 'bold', fill: '#1f2937' }
      }, {
        type: 'text', left: 'center', top: '58%',
        style: { text: 'In Use', fontSize: 12, fill: '#6b7280' }
      }]
    };
  }

  // ── Environment ─────────────────────────────────────────────────────────────
  private buildEnvironmentWidgets(): void {
    const spark = (trend: number[], color: string): EChartsOption => ({
      ...BASE_ANIM,
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].value} °C` },
      grid: { left: 2, right: 2, top: 6, bottom: 2 },
      xAxis: { type: 'category', show: false, data: trend.map((_, i) => i) },
      yAxis: { type: 'value', show: false, scale: true },
      series: [{
        type: 'line', data: trend, smooth: true, symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: { color, opacity: 0.12 }
      }]
    });
    this.roomTempOpt    = spark(this.data.environment.roomTemperature.trend, C_BLUE);
    this.freezerTempOpt = spark(this.data.environment.freezerTemperature.trend, C_BLUE);
  }

  // ── Patients ────────────────────────────────────────────────────────────────
  private buildPatientWidgets(): void {
    const mv = this.data.patients.movement;

    // Sankey: entry points → care areas → outcomes; link values are derived
    // proportionally from the movement counts in the JSON.
    const outs = ['Radiology', 'Lab', 'OT', 'Discharge'];
    const outTotal = outs.reduce((s, o) => s + mv[o], 0);
    const links: any[] = [
      { source: 'ER',  target: 'ICU',  value: Math.round(mv.ER * 0.6) },
      { source: 'ER',  target: 'Ward', value: Math.round(mv.ER * 0.4) },
      { source: 'OPD', target: 'ICU',  value: Math.round(mv.OPD * 0.3) },
      { source: 'OPD', target: 'Ward', value: Math.round(mv.OPD * 0.7) }
    ];
    ['ICU', 'Ward'].forEach(mid => {
      outs.forEach(o => {
        links.push({ source: mid, target: o, value: Math.round(mv[mid] * (mv[o] / outTotal)) });
      });
    });

    const nodeColors: any = {
      ER: '#f87171', OPD: '#93c5fd', ICU: '#a5b4fc', Ward: '#c4b5fd',
      Radiology: '#fca5a5', Lab: '#86efac', OT: '#c084fc', Discharge: '#94a3b8'
    };
    this.movementOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [{
        type: 'sankey',
        left: 6, right: 76, top: 8, bottom: 8,
        nodeWidth: 12,
        nodeGap: 10,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        data: Object.keys(mv).map(k => ({ name: k, itemStyle: { color: nodeColors[k] } })),
        links,
        label: {
          fontSize: 10, color: '#374151',
          formatter: (p: any) => `${p.name}\n${mv[p.name].toLocaleString()}`
        },
        lineStyle: { color: 'gradient', opacity: 0.25, curveness: 0.5 }
      }]
    };

    const wards = this.data.patients.bedOccupancy.wardWise;
    this.bedOccupancyOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
      grid: { left: 8, right: 42, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: 'value', max: 100, show: false },
      yAxis: {
        type: 'category', inverse: true,
        data: wards.map((w: any) => w.ward),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: wards.map((w: any) => ({
          value: w.occupancy,
          itemStyle: {
            color: w.occupancy >= 85 ? C_RED : (w.ward === 'NICU' ? C_ORANGE : C_BLUE),
            borderRadius: [0, 5, 5, 0]
          }
        })),
        barWidth: 8,
        showBackground: true,
        backgroundStyle: { color: '#f1f5f9', borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', formatter: '{c}%', color: '#374151', fontSize: 11 }
      }]
    };

    const q = this.data.patients.digitalQueue;
    this.queueLegend = [
      { label: 'Waiting',     value: q.waiting,    pct: Math.round((q.waiting    / q.total) * 100), color: C_ORANGE },
      { label: 'In Progress', value: q.inProgress, pct: Math.round((q.inProgress / q.total) * 100), color: C_BLUE },
      { label: 'Completed',   value: q.completed,  pct: Math.round((q.completed  / q.total) * 100), color: C_GREEN }
    ];
    this.queueOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['68%', '88%'],
        label: { show: false },
        data: this.queueLegend.map(l => ({ name: l.label, value: l.value, itemStyle: { color: l.color } }))
      }],
      graphic: [{
        type: 'text', left: 'center', top: '40%',
        style: { text: 'Total', fontSize: 12, fill: '#6b7280' }
      }, {
        type: 'text', left: 'center', top: '52%',
        style: { text: String(q.total), fontSize: 20, fontWeight: 'bold', fill: '#1f2937' }
      }]
    };
  }

  // ── Operation Theatre ───────────────────────────────────────────────────────
  private buildOtWidgets(): void {
    const ot = this.data.operationTheatre;
    this.otStatusList = [
      { label: 'Scheduled', value: ot.scheduled },
      { label: 'Pre-Op',    value: ot.preOp },
      { label: 'Recovery',  value: ot.recovery },
      { label: 'Completed', value: ot.completed }
    ];
  }

  // ── Alerts ──────────────────────────────────────────────────────────────────
  private buildAlertWidgets(): void {
    const trend = this.data.alerts.trend;
    const hours = trend.map((t: any) => t.hour);
    const line = (name: string, key: string, color: string) => ({
      name,
      type: 'line' as const,
      data: trend.map((t: any) => t[key]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color, width: 2 },
      itemStyle: { color }
    });

    this.alertTrendOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'axis' },
      legend: {
        bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8,
        textStyle: { fontSize: 11, color: '#4b5563' }
      },
      grid: { left: 8, right: 12, top: 12, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category', data: hours, boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#6b7280', fontSize: 10 }
      },
      series: [
        line('Critical', 'critical', C_RED),
        line('High', 'high', C_ORANGE),
        line('Medium', 'medium', C_YELLOW),
        line('Low', 'low', C_BLUE)
      ]
    };

    const locs = this.data.alerts.locations;
    const locColors = [C_RED, C_ORANGE, C_YELLOW, C_BLUE];
    this.alertLocOpt = {
      ...BASE_ANIM,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 36, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category', inverse: true,
        data: locs.map((l: any) => l.location),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: locs.map((l: any, i: number) => ({
          value: l.count,
          itemStyle: { color: locColors[i % locColors.length], borderRadius: [0, 5, 5, 0] }
        })),
        barWidth: 10,
        label: { show: true, position: 'right', color: '#374151', fontSize: 11 }
      }]
    };
  }
}
