import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartSpec, ChartType } from '../../../shared/models/chat.model';
import { ChartRendererComponent } from '../chart-renderer/chart-renderer.component';
import { LucideAngularModule, BarChart2, PieChart, LineChart, ScatterChart } from 'lucide-angular';

@Component({
  selector: 'app-chart-selector',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ChartRendererComponent,
    LucideAngularModule
  ],
  templateUrl: './chart-selector.component.html',
})
export class ChartSelectorComponent implements OnInit, OnChanges {
  @Input() spec!: ChartSpec;
  @Input() data!: Record<string, unknown>[];

  activeType!: ChartType;
  xCol = '';
  yCol = '';
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
    this.sortXAs = rec?.sort_x_as;
  }

  selectType(type: ChartType) {
    this.activeType = type;
    const rec = this.spec.recommendations.find(r => r.type === type);
    if (rec) { 
      this.xCol = rec.x || this.xCol; 
      this.yCol = rec.y || this.yCol; 
      this.sortXAs = rec.sort_x_as;
    }
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
