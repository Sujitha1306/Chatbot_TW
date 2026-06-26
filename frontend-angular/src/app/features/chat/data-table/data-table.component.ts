import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit {
  @Input() data!: Record<string, unknown>[];
  @Input() numericColumns: string[] = [];

  columns: string[] = [];
  search = '';
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 25;

  ngOnInit() {
    this.columns = this.data && this.data.length ? Object.keys(this.data[0]) : [];
  }

  get filtered(): Record<string, unknown>[] {
    if (!this.data) return [];
    let rows = this.data;
    if (this.search) {
      const q = this.search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (this.sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[this.sortCol], bv = b[this.sortCol];
        const cmp = av! < bv! ? -1 : av! > bv! ? 1 : 0;
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  get paged(): Record<string, unknown>[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
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

  sort(col: string) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
  }

  isNumeric(col: string): boolean {
    return this.numericColumns.includes(col);
  }
}
