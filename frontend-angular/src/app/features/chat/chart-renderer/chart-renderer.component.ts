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
  @Input() type!: ChartType;
  @Input() data!: Record<string, unknown>[];
  @Input() xCol!: string;
  @Input() yCol!: string;
  @Input() sortXAs?: string;
  @Input() spec?: any;

  plotData: any[] = [];
  layout = BASE_LAYOUT;

  ngOnChanges() {
    if (!this.hasValidData || !this.xCol || (!this.yCol && this.type !== 'pie')) {
      return;
    }
    this.plotData = this.buildTrace();

    if (this.type === 'pie') {
      this.layout = {
        ...BASE_LAYOUT,
        xaxis: undefined,
        yaxis: undefined,
        title: { text: `${this.formatLabel(this.yCol)} by ${this.formatLabel(this.xCol)}`, font: { size: 13 } },
      };
    } else {
      const horizontal = this.type === 'bar' && new Set(this.data.map(d => d[this.xCol])).size > 12;

      this.layout = {
        ...BASE_LAYOUT,
        xaxis: { 
          title: { text: this.formatLabel(horizontal ? this.yCol : this.xCol) }, 
          type: horizontal ? undefined : 'category',
          automargin: true 
        },
        yaxis: { 
          title: { text: this.formatLabel(horizontal ? this.xCol : this.yCol) }, 
          type: horizontal ? 'category' : undefined,
          automargin: true 
        },
        title: undefined,
      };
    }
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

    const yValues = this.data.map(d => Number(d[this.yCol])).filter(v => !isNaN(v));
    if (yValues.length === 0) return false;
    if (this.type !== 'pie' && new Set(yValues).size === 1 && yValues[0] === 0) return false; // all-zero

    return true;
  }

  private getSortedData(): Record<string, unknown>[] {
    const sortBy = this.spec?.recommendations?.find((r: any) => r.type === this.type)?.sort_x_by;
    if (!sortBy) return this.data;
    return [...this.data].sort((a, b) => Number(a[sortBy]) - Number(b[sortBy]));
  }

  private buildTrace(): any[] {
    const sortedData = (this.type === 'bar' || this.type === 'line') ? this.getSortedData() : this.data;
    const x = sortedData.map(d => d[this.xCol]);
    const y = sortedData.map(d => d[this.yCol]);

    switch (this.type) {
      case 'bar': {
        const horizontal = new Set(x).size > 12;
        const xLabels = x.map(v => String(v));

        return [{
          type: 'bar',
          x: horizontal ? y : xLabels,
          y: horizontal ? xLabels : y,
          orientation: horizontal ? 'h' : 'v',
          marker: { color: BRAND_COLORS[0] },
        }];
      }
      case 'pie': {
        const top10 = this.topNWithOther(10);
        return [{ type: 'pie', labels: top10.labels, values: top10.values, hole: 0.4 }];
      }
      case 'line': {
        const sortAs = this.sortXAs || 'string';
        let sorted = [...sortedData];

        if (sortAs === 'date') {
          sorted.sort((a, b) => new Date(String(a[this.xCol])).getTime() - new Date(String(b[this.xCol])).getTime());
        } else if (sortAs === 'numeric') {
          sorted.sort((a, b) => Number(a[this.xCol]) - Number(b[this.xCol]));
        } else if (!this.spec?.recommendations?.find((r: any) => r.type === 'line')?.sort_x_by) {
          // Only use fallback string sort if no sort_x_by was applied
          sorted.sort((a, b) => String(a[this.xCol]).localeCompare(String(b[this.xCol])));
        }

        return [{
          type: 'scatter', mode: 'lines+markers',
          x: sorted.map(d => d[this.xCol]),
          y: sorted.map(d => d[this.yCol]),
          line: { color: BRAND_COLORS[0] },
          connectgaps: false,
        }];
      }
      case 'scatter':
        return [{ type: 'scatter', mode: 'markers', x, y, marker: { color: BRAND_COLORS[1] } }];
      default:
        return [];
    }
  }

  private topNWithOther(n: number): { labels: any[]; values: any[] } {
    if (!this.data.length || !(this.xCol in this.data[0])) {
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
