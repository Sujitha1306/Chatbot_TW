import { Injectable } from '@angular/core';
import { CommonService } from './common.service';

export interface ChartSettings {
  legend: boolean;
  labels: boolean;
  gridLines: boolean;
  axisLabels: boolean;
  tooltip: boolean;
  title: boolean;
  type: string;       // 'bar' | 'line' | 'pie'
  pieRadius?: number; // pie only: % of its region the pie fills (40–100)
  pieGap?: number;    // pie only: px padding between pie and legend / edge
}

@Injectable({ providedIn: 'root' })
export class EchartsAdapterService {

  constructor(private readonly commonService: CommonService) {}

  toOption(chartValue: any, widgetTypeId: string): any {
    switch (widgetTypeId) {
      case 'WT-BAR':   return this.toBarOption(chartValue, false);
      case 'WT-HBAR':  return this.toBarOption(chartValue, true);
      case 'WT-LINE':  return this.toLineOption(chartValue);
      case 'WT-PIE':   return this.toPieOption(chartValue);
      case 'WT-CHART': return this.toDynamicOption(chartValue);
      default:         return this.toBarOption(chartValue, false);
    }
  }

  // ── Bar / HBar ────────────────────────────────────────────────────────────

  toBarOption(chartValue: any, horizontal = false): any {
    const series = this.normalizeSeriesData(chartValue.data).map((d, idx) => ({
      name: d.label || '',
      type: 'bar',
      data: (d.data || []).map(this.toNum),
      itemStyle: this.colorStyle(chartValue, idx)
    }));
    const catAxis = {
      type: 'category',
      data: chartValue.labels || [],
      axisLabel: { rotate: 30, overflow: 'truncate', width: 100 }
    };
    const valAxis = { type: 'value' };
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 4, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series
    };
  }

  // ── Line ──────────────────────────────────────────────────────────────────

  toLineOption(chartValue: any): any {
    const series = this.normalizeSeriesData(chartValue.data).map((d, idx) => {
      const color = chartValue.options?.colorOptions?.[idx]?.borderColor;
      return {
        name: d.label || '',
        type: 'line',
        data: (d.data || []).map(this.toNum),
        smooth: true,
        lineStyle: color ? { color } : {}
      };
    });
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 4, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: chartValue.labels || [], boundaryGap: false },
      yAxis: { type: 'value' },
      series
    };
  }

  // ── Pie ───────────────────────────────────────────────────────────────────

  toPieOption(chartValue: any): any {
    const colorMap: Record<string, string> = chartValue.options?.colorMap || {};
    const bgColors: string[] = chartValue.options?.colorOptions?.[0]?.backgroundColor || [];

    // API returns data as [{label, data: number[]}] — values are in data[0].data
    const rawValues: any = chartValue.data;
    const getVal = (i: number): number => {
      if (!rawValues?.length) { return 0; }
      const first = rawValues[0];
      if (typeof first === 'object' && Array.isArray(first.data)) {
        return this.toNum(first.data[i]);          // [{label, data:[...]}]
      }
      if (typeof first === 'number' || typeof first === 'string') { return this.toNum(rawValues[i]); } // flat array
      return this.toNum(first?.value);
    };

    const pieData = (chartValue.labels || []).map((label: string, i: number) => ({
      name: label,
      value: getVal(i),
      itemStyle: { color: colorMap[label] || bgColors[i] || this.commonService.getRandomColor() }
    }));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { top: 4, type: 'scroll' },
      series: [{
        type: 'pie',
        radius: '60%',
        center: ['50%', '58%'],   // shifted down to clear the top legend on short widgets
        data: pieData,
        emphasis: { itemStyle: { shadowBlur: 10 } }
      }]
    };
  }

  // ── WT-CHART (mixed type, type stored per-dataset) ────────────────────────

  private toDynamicOption(chartValue: any): any {
    const datasets: any[] = Array.isArray(chartValue.datasets) ? chartValue.datasets : [];

    // No datasets — fall back to the .data-based shapes used by WT-BAR/LINE/PIE.
    if (!datasets.length) {
      const ct: string = chartValue.options?.chartType || 'bar';
      if (ct === 'pie')           { return this.toPieOption(chartValue); }
      if (ct === 'line')          { return this.toLineOption(chartValue); }
      if (ct === 'horizontalBar') { return this.toBarOption(chartValue, true); }
      return this.toBarOption(chartValue, false);
    }

    // A pie dataset → render a pie from its values + the chart labels.
    const pieDs = datasets.find(d => d.type === 'pie');
    if (pieDs) {
      return this.toPieOption({ ...chartValue, data: [{ label: pieDs.label, data: pieDs.data }] });
    }

    // Cartesian chart: one ECharts series per dataset, type taken per-dataset.
    const series = datasets.map((d: any, idx: number) => {
      const isLine = d.type === 'line';
      const base: any = {
        name: d.label || '',
        type: isLine ? 'line' : 'bar',
        data: (d.data || []).map(this.toNum),
      };
      if (isLine) {
        const c = chartValue.options?.colorOptions?.[idx]?.borderColor;
        base.smooth = true;
        if (c) { base.lineStyle = { color: c }; base.itemStyle = { color: c }; }
      } else {
        const c = chartValue.options?.colorOptions?.[idx]?.backgroundColor;
        if (c) { base.itemStyle = { color: c }; }
        if (d.barThickness) { base.barMaxWidth = d.barThickness; }
      }
      return base;
    });

    const opts = chartValue.options?.options || {};
    const horizontal = opts.indexAxis === 'y';
    const xTitle = opts.scales?.x?.title?.text || '';
    const yTitle = opts.scales?.y?.title?.text || '';

    const catAxis: any = {
      type: 'category',
      data: chartValue.labels || [],
      name: horizontal ? yTitle : xTitle,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { rotate: 0, overflow: 'truncate', width: 100 }
    };
    const valAxis: any = {
      type: 'value',
      name: horizontal ? xTitle : yTitle,
    };

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 4, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: '8%', top: 40, containLabel: true },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series
    };
  }

  // ── Per-widget settings ────────────────────────────────────────────────────

  /** The primary series type of a built option ('bar' | 'line' | 'pie'). */
  baseSeriesType(baseOption: any): string {
    return baseOption?.series?.[0]?.type || 'bar';
  }

  /** Default toggle state for a freshly built chart. */
  defaultSettings(baseType: string): ChartSettings {
    return {
      legend: true,
      labels: false,
      gridLines: true,
      axisLabels: true,
      tooltip: true,
      title: false,
      type: baseType,
    };
  }

  /**
   * Derive a display option from the base option + user settings.
   * Returns a NEW object so ngx-echarts re-renders on change.
   */
  applySettings(baseOption: any, settings: ChartSettings, titleText = ''): any {
    const d = JSON.parse(JSON.stringify(baseOption));   // options are plain JSON
    const isPie = (d.series?.[0]?.type) === 'pie';

    d.legend = { ...(d.legend || {}), show: settings.legend };
    d.tooltip = { ...(d.tooltip || {}), show: settings.tooltip };

    if (titleText) {
      d.title = {
        text: titleText, show: settings.title,
        left: 'center', top: 4, textStyle: { fontSize: 13, fontWeight: 600 }
      };
      if (settings.title) { d.legend.top = 26; }
    }

    if (isPie) {
      if (d.series?.[0]) {
        d.series[0].label = { show: settings.labels, formatter: '{b}: {c}' };
      }
    } else {
      const horizontal = d.xAxis?.type === 'value';
      [d.xAxis, d.yAxis].forEach((ax: any) => {
        if (!ax) { return; }
        ax.axisLabel = { ...(ax.axisLabel || {}), show: settings.axisLabels };
        if (ax.type === 'value') {
          ax.splitLine = { ...(ax.splitLine || {}), show: settings.gridLines };
        }
      });
      const pos = horizontal ? 'right' : 'top';
      (d.series || []).forEach((se: any) => {
        se.label = { show: settings.labels, position: pos };
        if (settings.type === 'bar' || settings.type === 'line') {
          if (se.type === 'bar' || se.type === 'line') {
            se.type = settings.type;
            if (settings.type === 'line') { se.smooth = true; }
          }
        }
      });
    }
    return d;
  }

  /** Extract tabular data from a built option for CSV export. */
  toCsv(option: any): string {
    const series: any[] = option?.series || [];
    if (series[0]?.type === 'pie') {
      const rows = (series[0].data || []).map((d: any) => `${this.csvCell(d.name)},${this.csvCell(d.value)}`);
      return ['Name,Value', ...rows].join('\n');
    }
    const cats: any[] = option?.xAxis?.data || option?.yAxis?.data || [];
    const header = ['Category', ...series.map(s => s.name || '')].map(c => this.csvCell(c)).join(',');
    const rows = cats.map((cat, i) =>
      [cat, ...series.map(s => s.data?.[i] ?? '')].map(c => this.csvCell(c)).join(','));
    return [header, ...rows].join('\n');
  }

  private csvCell(v: any): string {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Normalise the many possible API data shapes to [{label, data: number[]}]. */
  private normalizeSeriesData(data: any): Array<{ label: string; data: number[] }> {
    if (!data) { return []; }

    // Single series object: { label|name, data: [...] }
    if (!Array.isArray(data)) {
      if (Array.isArray(data.data)) { return [{ label: data.label || data.name || '', data: data.data }]; }
      return [];
    }
    if (!data.length) { return []; }

    const first = data[0];
    if (first && typeof first === 'object') {
      // [{label, data:[...]}] — the common multi-series shape
      if (Array.isArray(first.data)) {
        return data.map((d: any) => ({ label: d.label || d.name || '', data: d.data || [] }));
      }
      // [{label, value}] points — collapse to one series
      if ('value' in first) {
        return [{ label: '', data: data.map((d: any) => d.value) }];
      }
    }
    // Flat number/string array — single unnamed series
    if (typeof first === 'number' || typeof first === 'string') {
      return [{ label: '', data }];
    }
    return data;
  }

  private colorStyle(chartValue: any, idx: number): Record<string, string> {
    const color = chartValue.options?.colorOptions?.[idx]?.backgroundColor;
    return color ? { color } : {};
  }

  /** Coerce API values (often strings) to numbers so ECharts value axes plot them. */
  private toNum = (v: any): number => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  };
}
