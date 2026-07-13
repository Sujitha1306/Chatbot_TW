export type TwColumnType =
  | 'text'
  | 'date'
  | 'datetime'
  | 'time'
  | 'number'
  | 'badge'
  | 'select'
  | 'bar'
  | 'icon'
  | 'image'
  | 'status'
  | 'cellColor';

export type TwColumnAlign = 'left' | 'center' | 'right';
export type TwColumnSticky = 'start' | 'end';

// ─── Badge ────────────────────────────────────────────────────────────────────
export interface TwBadgeConfig {
  colorMap: Record<string, string>;
  bgMap?: Record<string, string>;
}

// ─── Header icon ──────────────────────────────────────────────────────────────
export interface TwHeaderIconConfig {
  src?: string;
  matIcon?: string;
  tooltip?: string;
}

// ─── Bar cell ─────────────────────────────────────────────────────────────────
export interface TwBarConfig {
  /** Field on the row whose numeric value drives the bar width (defaults to col.key) */
  valueKey?: string;
  /** Maximum value corresponding to 100% width (default: 100) */
  max?: number;
  /** Bar fill colour (default: var(--tdt-accent)) */
  color?: string;
  /** Show the numeric value label next to the bar */
  showLabel?: boolean;
}

// ─── Icon / image cell ────────────────────────────────────────────────────────
export interface TwCellIconConfig {
  /** Material icon name — static string or function of the row */
  matIcon?: string | ((row: any) => string);
  /** Image src path — static string or function of the row */
  src?: string | ((row: any) => string);
  /** Tooltip — static string or function of the row */
  tooltip?: string | ((row: any) => string);
  /** Icon / image colour — static string or function of the row */
  color?: string | ((row: any) => string);
  /** CSS size for the icon/image (default: 20px) */
  size?: string;
}

// ─── Column definition ────────────────────────────────────────────────────────
export interface TwColumnDef {
  key: string;
  header?: string;
  type?: TwColumnType;
  sortable?: boolean;
  sticky?: TwColumnSticky;
  align?: TwColumnAlign;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  truncate?: boolean;
  clickable?: boolean;
  dateFormat?: string;
  badge?: TwBadgeConfig;
  headerIcon?: TwHeaderIconConfig;
  bar?: TwBarConfig;
  icon?: TwCellIconConfig;
  colorCellMap?: Record<string, string>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface TwPaginationConfig {
  length: number;
  pageSize: number;
  pageIndex?: number;
  pageSizeOptions?: number[];
}

// ─── Events ───────────────────────────────────────────────────────────────────
export interface TwCellAction<T = any> {
  type: 'cell-click' | 'row-click' | 'row-dblclick';
  column: string;
  row: T;
}

export interface TwPageEvent {
  pageIndex: number;
  pageSize: number;
}

export interface TwSortEvent {
  active: string;
  direction: 'asc' | 'desc' | '';
}
