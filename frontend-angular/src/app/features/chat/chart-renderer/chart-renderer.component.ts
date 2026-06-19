import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlotlyModule } from 'angular-plotly.js';
import { ChartType } from '../../../shared/models/chat.model';

const BRAND_COLORS = ['#28A5A0', '#2C3687', '#61DAD3', '#4A5FAF', '#8BC4C1', '#6B7EC4'];

const BASE_LAYOUT: any = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: '#1A1A2E', size: 12 },
  margin: { t: 40, r: 20, b: 60, l: 60 },
  height: 380,
  showlegend: true,
  legend: { orientation: 'h', y: -0.25 },
  colorway: BRAND_COLORS,
};

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule, PlotlyModule],
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
    return new Set(this.data.map(d => d[this.xCol])).size > 12;
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
        title: { text: `${this.formatLabel(this.yCol)} by ${this.formatLabel(this.xCol)}`, font: { size: 13 } },
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
          title: { text: this.formatLabel(this.xCol) },
          type: 'category',     // ALWAYS category — this is the true dimension
          automargin: true,
        },
        [measureAxisKey]: {
          title: { text: yTitle },
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
        title: { text: this.formatLabel(this.xCol) },
        type: this.type === 'scatter' ? undefined : 'category',
        automargin: true,
      },
      yaxis: {
        title: { text: yTitle },
        automargin: true,
      },
    };
  }

  private formatLabel(col: string): string {
    if (!col) return '';
    return col
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  get hasValidData(): boolean {
    if (!this.data || this.data.length === 0) return false;
    if (this.type === 'table') return true;
    return true;
  }

  private getSortedData(): Record<string, unknown>[] {
    const sortBy = this.sortXBy || this.spec?.recommendations?.find((r: any) => r.type === this.type)?.sort_x_by;
    let sorted = [...this.data];

    if (sortBy) {
      sorted.sort((a, b) => Number(a[sortBy]) - Number(b[sortBy]));
    } else if (this.type === 'line') {
      const sortAs = this.sortXAs || 'string';
      if (sortAs === 'date') {
        sorted.sort((a, b) => new Date(String(a[this.xCol])).getTime() - new Date(String(b[this.xCol])).getTime());
      } else if (sortAs === 'numeric') {
        sorted.sort((a, b) => Number(a[this.xCol]) - Number(b[this.xCol]));
      } else {
        sorted.sort((a, b) => String(a[this.xCol]).localeCompare(String(b[this.xCol])));
      }
    }
    
    return sorted;
  }

  private buildTrace(): any[] {
    if (this.series && this.series.length > 1) {
      return this.buildMultiSeriesTrace();
    }

    const sorted = this.getSortedData();

    // Map labels, but for scatter we keep raw values (so plotly scales numeric axes)
    const xLabels = this.type === 'scatter' ? sorted.map((d: any) => d[this.xCol]) : sorted.map((d: any) => String(d[this.xCol]));
    const y = sorted.map((d: any) => Number(d[this.yCol]));
    const x = this.type === 'scatter' ? sorted.map((d: any) => d[this.xCol]) : xLabels;

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
          x: sorted.map(d => d[this.xCol]),
          y: sorted.map(d => d[this.yCol]),
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
    const x = sorted.map((d: any) => String(d[this.xCol]));

    return this.series!.map((col, i) => ({
      type: this.type === 'line' ? 'scatter' : 'bar',
      mode: this.type === 'line' ? 'lines+markers' : undefined,
      x,
      y: sorted.map((d: any) => Number(d[col])),
      name: this.formatLabel(col),
      marker: { color: BRAND_COLORS[i % BRAND_COLORS.length] },
      line: this.type === 'line' ? { color: BRAND_COLORS[i % BRAND_COLORS.length] } : undefined,
    }));
  }

  private topNWithOther(n: number): { labels: any[]; values: any[] } {
    if (!this.data?.length || !this.xCol || !this.yCol) {
      return { labels: [], values: [] };
    }
    if (!(this.xCol in this.data[0]) || !(this.yCol in this.data[0])) {
      console.warn(`Pie chart: xCol=${this.xCol} or yCol=${this.yCol} not found in data`, this.data[0]);
      return { labels: [], values: [] };
    }

    // If yCol is not defined for pie, fallback or return empty
    if (!this.yCol) {
      // In pie charts, sometimes only xCol (category) is needed if we just count them
      // But the spec assumes yCol has the metric. If no yCol, let's just count frequencies of xCol
      const counts: Record<string, number> = {};
      for (const d of this.data) {
        const val = String(d[this.xCol]);
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

    const sorted = [...this.data].sort((a, b) => Number(b[this.yCol]) - Number(a[this.yCol]));
    const top = sorted.slice(0, n);
    const rest = sorted.slice(n);
    const otherSum = rest.reduce((s, d) => s + Number(d[this.yCol] || 0), 0);
    const labels = top.map(d => d[this.xCol]);
    const values = top.map(d => Number(d[this.yCol]));
    if (rest.length) { labels.push('Other'); values.push(otherSum); }
    return { labels, values };
  }
}
