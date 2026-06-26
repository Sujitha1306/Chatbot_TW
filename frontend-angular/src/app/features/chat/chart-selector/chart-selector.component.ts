import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartSpec, ChartType } from '../../../shared/models/chat.model';
import { ChartRendererComponent } from '../chart-renderer/chart-renderer.component';
import { DataTableComponent } from '../data-table/data-table.component';

@Component({
  selector: 'app-chart-selector',
  templateUrl: './chart-selector.component.html',
  styleUrls: ['./chart-selector.component.scss']
})
export class ChartSelectorComponent implements OnInit, OnChanges {
  @Input() spec!: ChartSpec;
  @Input() data!: Record<string, unknown>[];

  activeType!: ChartType;
  xCol = '';
  yCol = '';
  series?: string[];
  sortXAs?: string;

  ngOnInit() {
    this.initSelections();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['spec'] && !changes['spec'].firstChange) {
      this.initSelections();
    }
  }

  private initSelections() {
    if (!this.spec) return;
    this.activeType = this.spec.active;
    const rec = this.spec.recommendations.find(r => r.type === this.activeType);
    this.xCol = rec?.x || this.spec.columns.dimensions?.[0] || this.spec.columns.categorical?.[0] || '';
    this.yCol = rec?.y || this.spec.columns.measures?.[0] || this.spec.columns.numeric?.[0] || '';
    this.series = rec?.series;
  }

  formatLabel(col: string): string {
    if (!col) return '';
    if (col === 'porter_user_id') return 'Porter';
    
    return col
      .replace(/_id$/i, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }

  selectType(type: ChartType) {
    this.activeType = type;
    const rec = this.spec.recommendations.find(r => r.type === type);
    if (rec) { 
      this.xCol = rec.x || this.xCol; 
      this.yCol = rec.y || this.yCol; 
      this.series = rec.series;
      this.sortXAs = rec.sort_x_as;
    }
  }

  getMaterialIcon(iconName: string): string {
    if (!iconName) return 'bar_chart';
    // Map common backend-generated Lucide names to Material Design icons
    const map: Record<string, string> = {
      'bar-chart': 'bar_chart',
      'bar-chart-2': 'bar_chart',
      'pie-chart': 'pie_chart',
      'line-chart': 'show_chart',
      'scatter-chart': 'scatter_plot',
      'table': 'table_chart',
      'activity': 'show_chart',
      'trending-up': 'trending_up',
    };
    return map[iconName] || iconName.replace(/-/g, '_');
  }

  get xAxisOptions(): string[] {
    if (!this.spec || !this.spec.columns) return [];
    return this.spec.columns.dimensions || this.spec.columns.categorical || [];
  }

  get yAxisOptions(): string[] {
    if (!this.spec || !this.spec.columns) return [];
    return this.spec.columns.measures || this.spec.columns.numeric || [];
  }
}
