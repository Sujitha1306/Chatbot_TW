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
  template: `<plotly-plot [data]="plotData" [layout]="layout" [config]="{responsive: true, displaylogo: false}"></plotly-plot>`,
})
export class ChartRendererComponent implements OnChanges {
  @Input() type!: ChartType;
  @Input() data!: Record<string, unknown>[];
  @Input() xCol!: string;
  @Input() yCol!: string;

  plotData: any[] = [];
  layout = BASE_LAYOUT;

  ngOnChanges() {
    if (!this.data || !this.data.length || !this.xCol || (!this.yCol && this.type !== 'pie')) {
      return;
    }
    this.plotData = this.buildTrace();
  }

  private buildTrace(): any[] {
    const x = this.data.map(d => d[this.xCol]);
    const y = this.data.map(d => d[this.yCol]);

    switch (this.type) {
      case 'bar': {
        const horizontal = new Set(x).size > 12;
        return [{
          type: 'bar',
          x: horizontal ? y : x,
          y: horizontal ? x : y,
          orientation: horizontal ? 'h' : 'v',
          marker: { color: BRAND_COLORS[0] },
        }];
      }
      case 'pie': {
        const top10 = this.topNWithOther(10);
        return [{ type: 'pie', labels: top10.labels, values: top10.values, hole: 0.4 }];
      }
      case 'line': {
        const sorted = [...this.data].sort((a, b) =>
          String(a[this.xCol]).localeCompare(String(b[this.xCol])));
        return [{
          type: 'scatter', mode: 'lines+markers',
          x: sorted.map(d => d[this.xCol]),
          y: sorted.map(d => d[this.yCol]),
          line: { color: BRAND_COLORS[0] },
        }];
      }
      case 'scatter':
        return [{ type: 'scatter', mode: 'markers', x, y, marker: { color: BRAND_COLORS[1] } }];
      default:
        return [];
    }
  }

  private topNWithOther(n: number): { labels: any[]; values: any[] } {
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
