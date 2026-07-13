import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TwCellDefDirective } from './tw-cell-def.directive';
import {
  TwCellAction,
  TwCellIconConfig,
  TwColumnDef,
  TwPageEvent,
  TwPaginationConfig,
  TwSortEvent,
} from './tw-data-table.models';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'tw-data-table',
  templateUrl: './tw-data-table.component.html',
  styleUrls: ['./tw-data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TwDataTableComponent implements OnChanges, AfterContentInit, OnDestroy {
  // ─── Inputs ──────────────────────────────────────────────────────────────
  @Input() data: any[] = [];
  @Input() columns: TwColumnDef[] = [];
  @Input() pagination: TwPaginationConfig | null = null;
  @Input() selectable = false;
  @Input() rowClickable = false;
  @Input() rowDblClickable = false;
  @Input() loading = false;
  @Input() emptyMessage = 'No records found';
  @Input() tableClass = '';
  @Input() tableSize = '190px';
  @Input() rowId = 'id';
  @Input() applyFilter = '';
  @Input() permissionControl: string[] = [];

  /** Optional function returning a CSS colour string for a given row.
   *  Return null/undefined to fall back to the default alternating row colours. */
  @Input() rowColor: ((row: any) => string | null) | null = null;

  // ─── Outputs ─────────────────────────────────────────────────────────────
  @Output() cellAction = new EventEmitter<TwCellAction>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowDblClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<TwPageEvent>();
  @Output() sortChange = new EventEmitter<TwSortEvent>();

  // ─── View children ───────────────────────────────────────────────────────
  @ContentChildren(TwCellDefDirective) private cellDefs!: QueryList<TwCellDefDirective>;

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
      this.cdr.markForCheck();
    }
  }

  @ViewChild(MatPaginator) set matPaginator(pag: MatPaginator) {
    if (pag && !this.pagination) {
      this.dataSource.paginator = pag;
      this.cdr.markForCheck();
    }
  }

  // ─── State ───────────────────────────────────────────────────────────────
  readonly dataSource = new MatTableDataSource<any>();
  readonly selection = new SelectionModel<any>(true, []);

  displayedColumns: string[] = [];
  activeRowId: any = null;
  cellTemplates = new Map<string, TemplateRef<any>>();

  readonly skeletonRows = Array.from({ length: 6 });

  private readonly destroy$ = new Subject<void>();

  dateFormat = 'dd MMM yyyy';
  dateTimeFormat = 'dd MMM yyyy, HH:mm';
  timeFormat = 'HH:mm:ss';

  constructor(private cdr: ChangeDetectorRef, private commonService: CommonService) {
    this.loadDateFormats();
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngAfterContentInit() {
    this.syncCellTemplates();
    this.cellDefs.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.syncCellTemplates();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['columns'] || changes['selectable']) {
      this.buildDisplayedColumns();
    }

    if (changes['data']) {
      this.dataSource.data = this.data ?? [];
      this.clearSelection();
    }

    if (changes['applyFilter']) {
      this.dataSource.filter = this.applyFilter?.trim().toLowerCase() ?? '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Selection ───────────────────────────────────────────────────────────
  get allSelected(): boolean {
    return (
      this.dataSource.data.length > 0 &&
      this.selection.selected.length === this.dataSource.data.length
    );
  }

  get someSelected(): boolean {
    return this.selection.selected.length > 0 && !this.allSelected;
  }

  toggleAll() {
    if (this.allSelected) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
  }

  toggleRow(row: any) {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection.selected);
  }

  // ─── Row interactions ────────────────────────────────────────────────────
  onRowClick(row: any) {
    this.activeRowId = row[this.rowId] === this.activeRowId ? null : row[this.rowId];
    this.rowClick.emit(row);
  }

  onRowDblClick(row: any) {
    this.rowDblClick.emit(row);
  }

  onCellClick(col: TwColumnDef, row: any) {
    if (!col.clickable) return;
    this.cellAction.emit({ type: 'cell-click', column: col.key, row });
  }

  // ─── Row colour ──────────────────────────────────────────────────────────
  getRowBg(row: any): string | null {
    return this.rowColor ? (this.rowColor(row) ?? null) : null;
  }

  // ─── Bar cell helpers ────────────────────────────────────────────────────
  getBarWidth(col: TwColumnDef, row: any): number {
    const val = Number(row[col.bar?.valueKey ?? col.key]) || 0;
    const max = col.bar?.max ?? 100;
    return Math.min(100, Math.max(0, (val / max) * 100));
  }

  getBarLabel(col: TwColumnDef, row: any): string {
    return String(row[col.bar?.valueKey ?? col.key] ?? '');
  }

  // ─── Icon / image cell helpers ────────────────────────────────────────────
  getCellMatIcon(col: TwColumnDef, row: any): string {
    const cfg = col.icon;
    if (!cfg?.matIcon) return '';
    return typeof cfg.matIcon === 'function' ? cfg.matIcon(row) : cfg.matIcon;
  }

  getCellImgSrc(col: TwColumnDef, row: any): string {
    const cfg = col.icon;
    if (!cfg?.src) return '';
    return typeof cfg.src === 'function' ? cfg.src(row) : cfg.src;
  }

  getCellIconColor(col: TwColumnDef, row: any): string {
    const cfg = col.icon;
    if (!cfg?.color) return '';
    return typeof cfg.color === 'function' ? cfg.color(row) : cfg.color;
  }

  getCellIconTooltip(col: TwColumnDef, row: any): string {
    const cfg = col.icon as TwCellIconConfig;
    if (!cfg?.tooltip) return '';
    return typeof cfg.tooltip === 'function' ? cfg.tooltip(row) : cfg.tooltip;
  }

  // ─── Column helpers ──────────────────────────────────────────────────────
  isSticky(col: TwColumnDef): boolean {
    return col.sticky === 'start';
  }

  isStickyEnd(col: TwColumnDef): boolean {
    return col.sticky === 'end';
  }

  getCellTemplate(key: string): TemplateRef<any> | null {
    return this.cellTemplates.get(key) ?? null;
  }

  getBadgeStyle(col: TwColumnDef, row: any): Record<string, string> {
    const val = String(row[col.key] ?? '');
    const color = col.badge?.colorMap?.[val] ?? '#6b7280';
    const bg = col.badge?.bgMap?.[val] ?? `${color}1a`;
    return { color, background: bg, border: `1px solid ${color}33` };
  }

  trackById(index: number, item: any): any {
    return item?.[this.rowId] ?? index;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────
  private buildDisplayedColumns() {
    const keys = this.columns.map(c => c.key);
    this.displayedColumns = this.selectable ? ['__select', ...keys] : keys;
  }

  private syncCellTemplates() {
    this.cellTemplates.clear();
    this.cellDefs.forEach(d => this.cellTemplates.set(d.key, d.template));
  }

  private clearSelection() {
    this.selection.clear();
    this.selectionChange.emit([]);
  }

  private loadDateFormats() {
    const cached = localStorage.getItem('dateFormatConfig');
    if (cached) {
      const fmt = JSON.parse(cached);
      this.dateFormat = fmt.dateFormat ?? this.dateFormat;
      this.dateTimeFormat = fmt.dateTimeFormat ?? this.dateTimeFormat;
      this.timeFormat = fmt.timeFormat ?? this.timeFormat;
    } else {
      this.commonService.getConfigFile('date-format').subscribe(res => {
        if (res?.results?.contentObject) {
          const fmt = res.results.contentObject;
          this.dateFormat = fmt.dateFormat ?? this.dateFormat;
          this.dateTimeFormat = fmt.dateTimeFormat ?? this.dateTimeFormat;
          this.timeFormat = fmt.timeFormat ?? this.timeFormat;
          localStorage.setItem('dateFormatConfig', JSON.stringify(fmt));
          this.cdr.markForCheck();
        }
      });
    }
  }
}
