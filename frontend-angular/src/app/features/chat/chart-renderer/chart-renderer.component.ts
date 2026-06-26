import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlotlyModule } from 'angular-plotly.js';
import { ChartType } from '../../../shared/models/chat.model';

const BRAND_COLORS = ['#28A5A0', '#2C3687', '#61DAD3', '#4A5FAF', '#8BC4C1', '#6B7EC4'];

const BASE_LAYOUT: any = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: '#1A1A2E', size: 12 },
  margin: { t: 60, r: 20, b: 60, l: 60 },
  height: 380,
  showlegend: true,
  legend: { orientation: 'h', y: 1.15, x: 0, xanchor: 'left', yanchor: 'bottom' },
  colorway: BRAND_COLORS,
};

@Component({
  selector: 'app-chart-renderer',
  templateUrl: './chart-renderer.component.html',
})
export class ChartRendererComponent implements OnChanges {
  @Input() type: string = 'bar';
  @Input() data: any[] = [];
  @Input() xCol: string = '';
  @Input() yCol: string = '';
  @Input() series?: string[]; // Multiple Y columns to plot
  @Input() sortXAs?: string;
  @Input() sortXBy?: string;
  @Input() spec?: any;

  plotData: any[] = [];
  layout = BASE_LAYOUT;

  private get isHorizontalBar(): boolean {
    if (this.type !== 'bar') return false;
    if (this.series && this.series.length > 1) return false;
    
    // Use robust key extraction
    const xKey = this.getRealKey(this.xCol);
    if (!xKey) return false;
    
    return new Set(this.data.map(d => d[xKey])).size > 12;
  }

  private getRealKey(col: string): string {
    if (!this.data || this.data.length === 0 || !col) return col;
    const keys = Object.keys(this.data[0]);
    if (keys.includes(col)) return col;
    
    // Try fuzzy match: normalize both strings
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCol = normalize(col);
    const match = keys.find(k => normalize(k) === normCol);
    
    // Also try checking if the key contains the column name or vice versa
    if (!match) {
      const partialMatch = keys.find(k => normalize(k).includes(normCol) || normCol.includes(normalize(k)));
      return partialMatch || col;
    }
    
    return match || col;
  }

  ngOnChanges() {
    if (!this.hasValidData || !this.xCol || (!this.yCol && !this.series && this.type !== 'pie')) {
      return;
    }
    this.plotData = this.buildTrace();

    if (this.type === 'pie') {
      const { xaxis, yaxis, ...pieLayout } = BASE_LAYOUT as any;
      this.layout = {
        ...pieLayout,
        showlegend: true,
      };
      return;
    }

    let yTitle = this.formatLabel(this.yCol);
    if (this.series && this.series.length > 1) {
      yTitle = 'Value'; // Generic title since multiple measures share this axis
    }

    if (this.type === 'bar') {
      const horizontal = this.isHorizontalBar;
      
      const dimensionAxisKey = horizontal ? 'yaxis' : 'xaxis';
      const measureAxisKey   = horizontal ? 'xaxis' : 'yaxis';

      this.layout = {
        ...BASE_LAYOUT,
        barmode: 'group',
        [dimensionAxisKey]: {
          title: { text: this.formatLabel(this.xCol), standoff: 20 },
          type: 'category',     // ALWAYS category — this is the true dimension
          automargin: true,
        },
        [measureAxisKey]: {
          title: { text: yTitle, standoff: 20 },
          type: undefined,       // ALWAYS left as a continuous numeric scale —
                                 // NEVER category, regardless of orientation
          automargin: true,
        },
        showlegend: this.plotData.length > 1,
      };
      return;
    }

    this.layout = {
      ...BASE_LAYOUT,
      barmode: 'group',
      showlegend: this.plotData.length > 1,
      xaxis: {
        title: { text: this.formatLabel(this.xCol), standoff: 20 },
        type: this.type === 'scatter' ? undefined : 'category',
        automargin: true,
      },
      yaxis: {
        title: { text: yTitle, standoff: 20 },
        automargin: true,
      },
    };
  }

  private formatLabel(col: string): string {
    if (!col) return '';
    if (col === 'porter_user_id') return 'Porter';
    
    return col
      .replace(/_id$/i, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }

  get hasValidData(): boolean {
    if (!this.data || this.data.length === 0) return false;
    if (this.type === 'table') return true;
    return true;
  }

  private getSortedData(): Record<string, unknown>[] {
    const sortByRaw = this.sortXBy || this.spec?.recommendations?.find((r: any) => r.type === this.type)?.sort_x_by;
    let sorted = [...this.data];
    
    const xKey = this.getRealKey(this.xCol);

    if (sortByRaw) {
      const sortByKey = this.getRealKey(sortByRaw);
      sorted.sort((a, b) => Number(a[sortByKey]) - Number(b[sortByKey]));
      return sorted;
    } 

    if (this.type === 'pie') return sorted;

    const sortAs = this.sortXAs || this.guessDataType(sorted, xKey);
    if (sortAs === 'date') {
      sorted.sort((a, b) => new Date(String(a[xKey])).getTime() - new Date(String(b[xKey])).getTime());
    } else if (sortAs === 'numeric') {
      sorted.sort((a, b) => Number(a[xKey]) - Number(b[xKey]));
    } else {
      sorted.sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey])));
    }
    
    return sorted;
  }

  private guessDataType(data: any[], col: string): 'numeric' | 'date' | 'string' {
    if (!data || data.length === 0) return 'string';
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const val = data[i][col];
      if (val === null || val === undefined) continue;
      if (typeof val === 'number') return 'numeric';
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '' && !isNaN(Number(trimmed))) {
          return 'numeric';
        }
      }
    }
    return 'string';
  }

  private buildTrace(): any[] {
    if (this.series && this.series.length > 1) {
      return this.buildMultiSeriesTrace();
    }

    const sorted = this.getSortedData();
    const xKey = this.getRealKey(this.xCol);
    const yKey = this.getRealKey(this.yCol);

    // Map labels, but for scatter we keep raw values (so plotly scales numeric axes)
    const xLabels = this.type === 'scatter' ? sorted.map((d: any) => d[xKey]) : sorted.map((d: any) => String(d[xKey]));
    const y = sorted.map((d: any) => Number(d[yKey]));
    const x = this.type === 'scatter' ? sorted.map((d: any) => d[xKey]) : xLabels;

    switch (this.type) {
      case 'bar': {
        const horizontal = this.isHorizontalBar;
        return [{
          type: 'bar',
          x: horizontal ? y : xLabels,
          y: horizontal ? xLabels : y,
          orientation: horizontal ? 'h' : 'v',
          marker: { color: BRAND_COLORS[0] },
          name: this.formatLabel(this.yCol),
        }];
      }
      case 'pie': {
        const top10 = this.topNWithOther(10);
        return [{ type: 'pie', labels: top10.labels, values: top10.values, hole: 0.4 }];
      }
      case 'line': {
        return [{
          type: 'scatter', mode: 'lines+markers',
          x: sorted.map(d => d[xKey]),
          y: sorted.map(d => Number(d[yKey])),
          line: { color: BRAND_COLORS[0] },
          connectgaps: false,
          name: this.formatLabel(this.yCol),
        }];
      }
      case 'scatter':
        return [{ type: 'scatter', mode: 'markers', x, y, marker: { color: BRAND_COLORS[1] }, name: `${this.formatLabel(this.xCol)} vs ${this.formatLabel(this.yCol)}` }];
      default:
        return [];
    }
  }

  private buildMultiSeriesTrace(): any[] {
    const sorted = this.getSortedData();
    const xKey = this.getRealKey(this.xCol);
    const x = sorted.map((d: any) => String(d[xKey]));

    return this.series!.map((col, i) => {
      const cKey = this.getRealKey(col);
      return {
        type: this.type === 'line' ? 'scatter' : 'bar',
        mode: this.type === 'line' ? 'lines+markers' : undefined,
        x,
        y: sorted.map((d: any) => Number(d[cKey])),
        name: this.formatLabel(col),
        marker: { color: BRAND_COLORS[i % BRAND_COLORS.length] },
        line: this.type === 'line' ? { color: BRAND_COLORS[i % BRAND_COLORS.length] } : undefined,
      };
    });
  }

  private topNWithOther(n: number): { labels: any[]; values: any[] } {
    if (!this.data?.length || !this.xCol || !this.yCol) {
      return { labels: [], values: [] };
    }
    
    const xKey = this.getRealKey(this.xCol);
    let yKey = this.yCol ? this.getRealKey(this.yCol) : '';

    if (!(xKey in this.data[0])) {
      console.warn(`Pie chart: xCol=${this.xCol} not found in data`, this.data[0]);
      return { labels: [], values: [] };
    }

    // If yCol is not defined for pie, fallback or return empty
    if (!yKey || !(yKey in this.data[0])) {
      // In pie charts, sometimes only xCol (category) is needed if we just count them
      const counts: Record<string, number> = {};
      for (const d of this.data) {
        const val = String(d[xKey]);
        counts[val] = (counts[val] || 0) + 1;
      }
      const sortedFreq = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const topFreq = sortedFreq.slice(0, n);
      const restFreq = sortedFreq.slice(n);
      const otherSumFreq = restFreq.reduce((s, [_, v]) => s + v, 0);
      const labelsFreq = topFreq.map(d => d[0]);
      const valuesFreq = topFreq.map(d => d[1]);
      if (restFreq.length) { labelsFreq.push('Other'); valuesFreq.push(otherSumFreq); }
      return { labels: labelsFreq, values: valuesFreq };
    }

    const sorted = [...this.data].sort((a, b) => Number(b[yKey]) - Number(a[yKey]));
    const top = sorted.slice(0, n);
    const rest = sorted.slice(n);
    const otherSum = rest.reduce((s, d) => s + Number(d[yKey] || 0), 0);
    const labels = top.map(d => String(d[xKey]));
    const values = top.map(d => Number(d[yKey]));
    if (rest.length) { labels.push('Other'); values.push(otherSum); }
    return { labels, values };
  }
}
