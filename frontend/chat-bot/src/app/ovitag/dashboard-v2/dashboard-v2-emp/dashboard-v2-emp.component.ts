import { Component, OnInit, AfterViewInit, DoCheck, OnDestroy, OnChanges, SimpleChanges, Input, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonService, DashboardService, WorkflowService } from '../../../shared';
import { EchartsAdapterService, ChartSettings } from '../../../shared/services/echarts-adapter.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardWidgetComponent } from '../../../shared/modules/entry-component/dashboard-widget/dashboard-widget.component';
import { ConfirmDialogComponent } from '../../../shared/modules/entry-component/layout-save/layout-save.component';
import { GridStack } from 'gridstack';
import * as echarts from 'echarts';
import { DomSanitizer } from '@angular/platform-browser';

const CELL_HEIGHT = 80;
const HEADER_HEIGHT = 36;

export interface ModelWidgets {
  widgetIds: string;
  layouts: Array<any>;
}

@Component({
  selector: 'app-dashboard-v2-emp',
  templateUrl: './dashboard-v2-emp.component.html',
  styleUrls: ['./dashboard-v2-emp.component.scss']
})
export class DashboardV2EmpComponent implements OnInit, AfterViewInit, DoCheck, OnDestroy, OnChanges {

  @ViewChild('toggleButton') toggleButton: ElementRef;
  @ViewChild('widgetsBtn') widgetsBtn: ElementRef;
  @ViewChild('gridEl') gridEl: ElementRef;

  /**
   * When provided by a parent (embedded mode), V2 uses this pre-loaded dashboard
   * data instead of making its own API calls for the layout structure.
   * Shape: { preResponse: any; dashboardId: any; defaultLayout: string }
   */
  @Input() externalDashboardData: { preResponse: any; dashboardId: any; defaultLayout: string } | null = null;

  public dashboardDetails: any = {};
  public layout: any[] = [];
  public clayout: any[] = [];
  public defaultLayout: string = null;
  public isLayoutChanged = false;
  public currentWidget = new FormControl();
  public userId = localStorage.getItem(btoa('userId'));
  public roleId = localStorage.getItem('userlevel');
  public facilityId = localStorage.getItem(btoa('facilityId'));
  public dashboardId: any = null;
  public screenLock = true;
  public active_btn: any = [];
  public maxHeight = 500;
  public widgetValue: any[] = [];
  public isOpen = false;
  public isOptionOpen = false;
  public isOption: any = null;
  public isUpdateLayout = false;
  public preResponse: any = null;
  public isAutoRefresh = false;
  public autoInterval: any = null;
  public departmentId: any = null;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public subscription: Subscription;
  public subscriptionDept: Subscription;
  public enableEditDashboard = false;
  public existPrivateUser = false;

  private grid: GridStack;
  private chartInstances = new Map<string, any>();

  // GridStack column count — derived from saved layout so x/y positions
  // (authored against gridster's fixedColWidth:80 model) are reproduced faithfully.
  public gridColumns = 6;
  public readonly cellPx = CELL_HEIGHT; // 80px — matches gridster fixedColWidth/fixedRowHeight

  // Per-widget chart settings (legend/labels/grid/etc.), keyed by widget code.
  public chartSettings: { [code: string]: ChartSettings } = {};
  // Code of the widget currently shown in the fullscreen overlay (null = closed).
  public maximizedCode: string | null = null;
  public maximizeInitOpts = { renderer: 'canvas' as const };

  constructor(
    private readonly renderer: Renderer2,
    public dashboardService: DashboardService,
    public datepipe: DatePipe,
    private readonly commonService: CommonService,
    private readonly echartsAdapter: EchartsAdapterService,
    public router: Router,
    private readonly snackbar: MatSnackBar,
    public dialog: MatDialog,
    public workflowService: WorkflowService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.active_btn = this.commonService.getActivePermission('button');
    this.maxHeight = window.innerHeight - 70;
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.isOption === 'widgets') {
        if (this.widgetsBtn && !this.widgetsBtn.nativeElement['innerText'].includes(e.target['innerText']) && e.target['innerText'] !== 'widgets') {
          this.isOption = null;
          this.isOptionOpen = false;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Fires when parent updates the pre-loaded data (e.g. dashboard switch, facility change).
    // Ignore the very first change — ngOnInit already handles it.
    if (changes['externalDashboardData'] && !changes['externalDashboardData'].firstChange) {
      const data = changes['externalDashboardData'].currentValue;
      if (data) {
        this.preResponse = data.preResponse;
        this.dashboardId = data.dashboardId;
        this.defaultLayout = data.defaultLayout;
        this.dashboardDetails['update'] = true;
        this.bindLayout(this.preResponse.layouts);
      }
    }
  }

  ngOnInit() {
    this.existPrivateUser = 'privateUser' in localStorage;
    this.enableEditDashboard = this.active_btn && this.active_btn.indexOf('BT_DSHE') > -1;
    this.enableEditDashboard = this.existPrivateUser ? false : this.enableEditDashboard;

    // ── Embedded mode: parent supplied pre-loaded data ────────────────────────
    if (this.externalDashboardData) {
      this.preResponse = this.externalDashboardData.preResponse;
      this.dashboardId = this.externalDashboardData.dashboardId;
      this.defaultLayout = this.externalDashboardData.defaultLayout;
      this.currentWidget.setValue([]);
      this.dashboardDetails['update'] = true;
      this.bindLayout(this.preResponse.layouts);
      return; // skip standalone subscriptions and API calls
    }
    // ── Standalone mode: route directly to /dashboard-v2 ─────────────────────

    this.subscription = this.commonService.layout.subscribe((layout) => {
      if (layout['id'] !== undefined && !this.existPrivateUser) {
        this.getUserPreference('dashboard', layout['id']);
        this.getDashboardbyId(layout['id']);
        this.isOpen = false;
        this.screenLock = true;
      }
    });

    this.subscriptionDept = this.commonService.department.subscribe((dept) => {
      this.departmentId = dept ? dept : null;
      this.bindLayout(this.layout);
    });

    this.currentWidget.setValue([]);
    localStorage.setItem(btoa('menuCode'), 'MN_DB_V2');

    this.activatedRoute.queryParams.subscribe(queryParams => {
      if (queryParams.hasOwnProperty('id')) {
        this.dashboardId = queryParams['id'];
        this.getDashboardbyId(this.dashboardId);
      } else if (this.existPrivateUser) {
        this.checkUserPreference();
      }
    });

    if (!this.existPrivateUser) {
      this.checkUserPreference();
    }
  }

  ngAfterViewInit() {
    // GridStack is initialized after bindLayout populates clayout
  }

  ngDoCheck() {
    // In embedded mode the parent (DashboardEmpComponent) owns all reloads.
    if (this.externalDashboardData) { return; }
    if (this.facilityId !== localStorage.getItem(btoa('facilityId'))) {
      this.facilityId = localStorage.getItem(btoa('facilityId'));
      this.checkUserPreference();
    }
  }

  ngOnDestroy() {
    clearInterval(this.autoInterval);
    if (this.subscription) { this.subscription.unsubscribe(); }
    if (this.subscriptionDept) { this.subscriptionDept.unsubscribe(); }
    this.destroyGridStack();
  }

  // ─── GridStack ────────────────────────────────────────────────────────────

  private initGridStack() {
    this.destroyGridStack();
    if (!this.gridEl?.nativeElement || !this.clayout.length) { return; }

    this.grid = GridStack.init(
      {
        column: this.gridColumns,
        cellHeight: CELL_HEIGHT,
        margin: 5,
        animate: false,
        float: true,                 // respect saved x/y, don't auto-compact upward
        disableDrag: this.screenLock,
        disableResize: this.screenLock,
        resizable: { handles: 'se,sw,ne,nw' },
      },
      this.gridEl.nativeElement
    );

    // Authoritatively place every widget from the layout data. GridStack's own
    // attribute scan can race with Angular's rendering, so we set positions
    // explicitly by id inside a batch.
    this.grid.batchUpdate(true);
    for (const wid of this.clayout) {
      const el = this.gridEl.nativeElement.querySelector(`.grid-stack-item[gs-id="${wid.code}"]`);
      if (el) {
        this.grid.update(el, {
          x: +wid.x || 0, y: +wid.y || 0,
          w: +wid.cols || 1, h: +wid.rows || 1
        });
      }
    }
    this.grid.batchUpdate(false);

    this.grid.on('resizestop', (_e: Event, el: HTMLElement) => {
      const code = el.getAttribute('gs-id');
      if (code) { setTimeout(() => this.resizeChart(code), 50); }
      this.syncLayoutFromGrid();
    });
    this.grid.on('dragstop', () => this.syncLayoutFromGrid());

    setTimeout(() => this.resizeAllCharts(), 60);
  }

  private destroyGridStack() {
    if (this.grid) {
      try { this.grid.destroy(false); } catch (_) {}
      this.grid = null;
    }
    // Clear any stale GridStack reference so a fresh init re-scans the DOM.
    const el: any = this.gridEl?.nativeElement;
    if (el && el.gridstack) { el.gridstack = null; }
  }

  private syncLayoutFromGrid() {
    if (!this.grid) { return; }
    const nodes: any[] = this.grid.save(false) as any[];
    this.layout = this.layout.map(item => {
      const node = nodes.find((n: any) => n.id === item.code);
      return node ? { ...item, x: node.x, y: node.y, cols: node.w, rows: node.h } : item;
    });
    // keep clayout objects in sync with the grid too
    for (const w of this.clayout) {
      const node = nodes.find((n: any) => n.id === w.code);
      if (node) { w.x = node.x; w.y = node.y; w.cols = node.w; w.rows = node.h; }
    }
    const active = this.layout.filter(r => r.isActive);
    const def = JSON.parse(this.defaultLayout || '[]').filter((r: any) => r.isActive);
    this.isLayoutChanged = JSON.stringify(active) !== JSON.stringify(def);
    this.persistLayout();
  }

  // ─── localStorage persistence ───────────────────────────────────────────────

  private get storageKey(): string {
    return `dashboard-v2-layout-${this.dashboardId ?? 'default'}`;
  }

  /** Save current widget positions/sizes to localStorage. */
  private persistLayout() {
    try {
      const positions = this.clayout.map(w => ({
        code: w.code, x: w.x, y: w.y, cols: w.cols, rows: w.rows
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(positions));
    } catch (_) {}
  }

  /** Override widget positions/sizes from localStorage (if present) before render. */
  private applyStoredLayout() {
    let stored: any[] | null = null;
    try {
      stored = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    } catch (_) { stored = null; }
    if (!stored?.length) { return; }
    const byCode = new Map(stored.map(s => [s.code, s]));
    for (const w of this.clayout) {
      const s = byCode.get(w.code);
      if (s) { w.x = s.x; w.y = s.y; w.cols = s.cols; w.rows = s.rows; }
    }
  }

  /** Clear cached layout for the current dashboard and reload from server. */
  resetLayout() {
    try { localStorage.removeItem(this.storageKey); } catch (_) {}
    this.dashboardDetails['update'] = true;
    this.bindLayout(JSON.parse(this.defaultLayout || '[]'));
  }

  // ─── Per-widget chart settings (legend/labels/etc.) ─────────────────────────

  private get settingsKey(): string {
    return `dashboard-v2-chartsettings-${this.dashboardId ?? 'default'}`;
  }

  private loadChartSettings(code: string): ChartSettings | null {
    try {
      const all = JSON.parse(localStorage.getItem(this.settingsKey) || 'null');
      return all && all[code] ? all[code] : null;
    } catch (_) { return null; }
  }

  private persistChartSettings() {
    try { localStorage.setItem(this.settingsKey, JSON.stringify(this.chartSettings)); } catch (_) {}
  }

  /** Re-derive the display option for a widget from its base + current settings. */
  private rederive(code: string) {
    const dd = this.dashboardDetails[code];
    if (!dd?.baseOption) { return; }
    dd.echartsOption = this.echartsAdapter.applySettings(dd.baseOption, this.chartSettings[code], dd.text || '');
  }

  /** Flip a boolean chart setting, re-render, and persist. */
  toggleSetting(code: string, key: keyof ChartSettings) {
    const s = this.chartSettings[code];
    if (!s) { return; }
    (s as any)[key] = !(s as any)[key];
    this.rederive(code);
    this.persistChartSettings();
  }

  /** Switch a cartesian chart between bar and line. */
  setChartType(code: string, type: 'bar' | 'line') {
    const s = this.chartSettings[code];
    if (!s) { return; }
    s.type = type;
    this.rederive(code);
    this.persistChartSettings();
  }

  isPie(code: string): boolean {
    return this.dashboardDetails[code]?.baseType === 'pie';
  }

  // ─── Export / maximize ──────────────────────────────────────────────────────

  downloadChart(code: string, fmt: 'svg' | 'png' | 'csv') {
    const dd = this.dashboardDetails[code];
    if (!dd) { return; }
    const name = (dd.text || code).replace(/\s+/g, '_');

    if (fmt === 'csv') {
      const csv = this.echartsAdapter.toCsv(dd.echartsOption);
      this.triggerDownload(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), `${name}.csv`, true);
      return;
    }
    if (fmt === 'png') {
      const inst = this.chartInstances.get(code);
      if (!inst) { return; }
      const url = inst.getDataURL({ type: 'png', backgroundColor: '#fff', pixelRatio: 2 });
      this.triggerDownload(url, `${name}.png`);
      return;
    }
    // svg — render off-screen with the SVG renderer (display stays canvas)
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;left:-99999px;width:900px;height:500px;';
    document.body.appendChild(holder);
    let tmp: any;
    try {
      tmp = echarts.init(holder, undefined, { renderer: 'svg', width: 900, height: 500 });
      tmp.setOption(dd.echartsOption);
      const url = tmp.getDataURL({ type: 'svg' });
      this.triggerDownload(url, `${name}.svg`);
    } catch (_) {
    } finally {
      if (tmp) { tmp.dispose(); }
      document.body.removeChild(holder);
    }
  }

  private triggerDownload(url: string, filename: string, revoke = false) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }

  maximize(code: string) { this.maximizedCode = code; }
  closeMaximize() { this.maximizedCode = null; }

  // ─── ECharts instances ────────────────────────────────────────────────────

  onChartInit(code: string, chart: any) {
    this.chartInstances.set(code, chart);
  }

  private resizeChart(code: string) {
    const inst = this.chartInstances.get(code);
    if (!inst) { return; }
    try {
      // Measure the echart-wrap (parent of the echarts host div) from CSS, not from
      // ECharts' own inline-style override, so the chart shrinks correctly on resize.
      const wrapEl = inst.getDom()?.parentElement as HTMLElement | null;
      if (wrapEl && wrapEl.offsetWidth > 0 && wrapEl.offsetHeight > 0) {
        inst.resize({ width: wrapEl.offsetWidth, height: wrapEl.offsetHeight });
      } else {
        inst.resize();
      }
    } catch (_) {}
  }

  private resizeAllCharts() {
    this.chartInstances.forEach((_inst, code) => { this.resizeChart(code); });
  }

  // ─── Dashboard data ───────────────────────────────────────────────────────

  checkUserPreference() {
    const roleId = localStorage.getItem('userlevel');
    const userId = localStorage.getItem(btoa('userId'));
    this.commonService.getPreference(userId, roleId).subscribe(res => {
      this.commonService.userPreference = res.results;
      const preference = res.results;
      if (preference != null && preference.hasOwnProperty('dashboard')) {
        this.dashboardId = preference.dashboard.value;
        this.commonService.setDashboard(this.dashboardId);
        this.getDashboardbyId(this.dashboardId);
      } else {
        this.getDashboardLayout();
      }
      if (preference != null && preference.hasOwnProperty('layoutAutoRefresh')) {
        this.autoRefresh(JSON.parse(preference.layoutAutoRefresh.value));
      }
    });
  }

  getUserPreference(key = 'dashboard', value = this.dashboardId) {
    const preference = this.commonService.userPreference;
    const postData = { key, roleId: localStorage.getItem('userlevel'), userId: localStorage.getItem(btoa('userId')), value };
    if (preference != null && value) {
      if (preference.hasOwnProperty(key)) {
        if (preference[key].value !== value) {
          this.commonService.updateUserPreference(preference[key].id, postData).subscribe(res => {
            this.commonService.userPreference = res.results;
          });
        }
      } else {
        this.commonService.saveUserPreference(postData).subscribe(res => {
          this.commonService.userPreference = res.results;
        });
      }
    }
  }

  getDashboardbyId(dashId: any) {
    this.dashboardDetails['update'] = true;
    const userId = localStorage.getItem(btoa('userId'));
    this.dashboardService.getDashboardbyIds(dashId, userId).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results[0];
        this.preResponse['layouts'].sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
        this.defaultLayout = JSON.stringify(res.results[0].layouts);
        this.dashboardId = res.results[0].dashboardId;
        this.bindLayout(res.results[0].layouts);
      } else {
        this.openSnackbar(res.message, 'warning');
      }
    });
  }

  getDashboardLayout() {
    this.dashboardDetails['update'] = true;
    this.dashboardService.getCurrentDashboard(this.userId, this.roleId).subscribe(res => {
      if (res.statusCode === 1) {
        this.preResponse = res.results;
        this.preResponse['layouts'].sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
        this.defaultLayout = JSON.stringify(res.results.layouts);
        this.dashboardId = res.results.dashboardId;
        this.getUserPreference();
        this.bindLayout(res.results.layouts);
      }
    });
  }

  bindLayout(layout: any[]) {
    this.commonService.setDashboard(this.dashboardId);
    if (this.facilityId === localStorage.getItem(btoa('facilityId'))) {
      this.isLayoutChanged = false;
      if (this.defaultLayout !== JSON.stringify(layout)) {
        this.isLayoutChanged = !this.isUpdateLayout;
      }

      this.layout = [];
      this.clayout = [];
      this.chartInstances.clear();
      this._chartInitOptsCache.clear();

      for (const item of layout) {
        try {
          this.layout.push(item);
          if (item.isActive && item.code !== 'WD_DBAS' && item.code !== 'WD_DBAST') {
            this.clayout.push(item);
            if (this.dashboardDetails['update']) {
              this.dashboardDetails[item.code] = { show: false, loading: true };
              if (item.modelTypeId === 'MT-API') {
                this.dashboardDetails[item.code] = { show: true, type: 'placeholder', placeholderType: item.widgetTypeId || 'MT-API' };
              }
            }
          }
        } catch (e) {
          console.log(item.code + ' widget error', e);
        }
      }

      const filteredLayout = layout.filter(r => r.code !== 'WD_DBAS' && r.code !== 'WD_DBAST');
      const modelLayout = new Map<string, ModelWidgets>();

      for (const item of filteredLayout) {
        if (item.widgetTypeId !== 'WT-FORM' && item.isActive &&
          (item.modelTypeId === 'MT-QRY' || item.modelTypeId === 'MT-RPT')) {
          if (!modelLayout.has(item.modelId)) {
            modelLayout.set(item.modelId, { widgetIds: item.widgetId, layouts: [item] });
          } else {
            modelLayout.get(item.modelId).widgetIds += ',' + item.widgetId;
            modelLayout.get(item.modelId).layouts.push(item);
          }
        } else if (item.isActive && item.widgetTypeId === 'WT-CHART') {
          modelLayout.set(item.widgetId, { widgetIds: item.widgetId, layouts: [item] });
        }
      }

      modelLayout.forEach((value) => this.getDynamicChartData(value));

      // Apply any cached positions/sizes (from drag/resize) over the server layout.
      this.applyStoredLayout();

      // Derive column count from the (possibly cached) layout's max right-edge, min 6.
      this.gridColumns = this.clayout.reduce(
        (max, w) => Math.max(max, (+w.x || 0) + (+w.cols || 1)), 6);

      if (layout.length > 0) {
        this.currentWidget.setValue(this.clayout.map(v => v.code));
        this.widgetValue = this.clayout.map(v => v.code);
      }
      if (this.isUpdateLayout) {
        this.saveWidgets(this.layout, true);
      }

      // Rebuild GridStack after Angular renders new clayout
      setTimeout(() => {
        this.destroyGridStack();
        this.initGridStack();
      }, 0);

    } else {
      this.facilityId = localStorage.getItem(btoa('facilityId'));
      this.checkUserPreference();
    }
  }

  getDynamicChartData(modelWidgets: ModelWidgets) {
    const widIds = modelWidgets.widgetIds ? String(modelWidgets.widgetIds).split(',') : [];
    const widMap = new Map<string, any[]>();
    let widSameParam = '';
    const widSameParamLayouts: any[] = [];

    for (let i = 0; i < widIds.length; i++) {
      const iparam = modelWidgets.layouts[i].inputParams;
      if (iparam && iparam.includes('=')) {
        widMap.set(widIds[i], [modelWidgets.layouts[i]]);
      } else {
        widSameParam = widSameParam ? widSameParam + ',' + widIds[i] : widIds[i];
        widSameParamLayouts.push(modelWidgets.layouts[i]);
      }
    }
    if (widSameParamLayouts.length) { widMap.set(widSameParam, widSameParamLayouts); }

    widMap.forEach((value, key) => {
      const layout = value[0];
      const widgetParam: string[] = [];
      const iparam = layout.inputParams?.includes('=') ? 'inputParams' : 'modelInputParams';
      const inputParam: string[] = layout[iparam] ? layout[iparam].split(',') : [];
      const layoutParam: string[] = layout.widgetParam ? layout.widgetParam.split(',') : [];

      if (layout.inputParams && inputParam.length) {
        for (let i = 0; i < inputParam.length; i++) {
          const p = inputParam[i];
          const prefix = widgetParam.length === 0 ? '' : '&';
          if (p === 'fid' || p === 'facility_id') { widgetParam.push(prefix + p + '=' + localStorage.getItem(btoa('facilityId'))); }
          else if (p === 'fdt') { widgetParam.push(prefix + p + '=' + this.selectedDate); }
          else if (p === 'tdt') { widgetParam.push(prefix + p + '=' + this.selectedDate); }
          else if (p === 'uid') { widgetParam.push(prefix + p + '=' + localStorage.getItem(btoa('userId'))); }
          else if (p === 'role') { widgetParam.push(prefix + p + '=' + localStorage.getItem('userlevel')); }
          else if (p === 'deptId') { widgetParam.push(prefix + p + '=' + this.departmentId); }
          else if (p === 'logId') { widgetParam.push(prefix + p + '=' + localStorage.getItem(btoa('loginId'))); }
          else if (p.includes('=')) { widgetParam.push(prefix + p); }
        }
      }

      if (layout.widgetParam && layoutParam.length) {
        for (const lp of layoutParam) {
          if (lp.includes('=')) {
            const k = lp.split('=')[0];
            const idx = widgetParam.findIndex(v => v.includes(k));
            if (idx !== -1) { widgetParam.splice(idx, 1); }
            widgetParam.push((widgetParam.length === 0 ? '' : '&') + lp);
          }
        }
      }

      const modelInput = widgetParam.toString().replace(/,&/g, '&');
      const widgetFilter = layout.options;

      if (widgetFilter?.filters?.length) {
        this.dashboardDetails[layout.code]['filters'] = widgetFilter['filters'];
        for (const filter in widgetFilter['filters']) {
          this.dashboardDetails[layout.code]['filters'][filter]['widId'] = layout.widgetId;
          this.dashboardDetails[layout.code]['filters'][filter]['modelInput'] = modelInput;
          this.dashboardDetails[layout.code]['filters'][filter]['code'] = layout.code;
          if (this.dashboardDetails[layout.code]['filters'][filter]['resData'] == null &&
            this.dashboardDetails[layout.code]['filters'][filter]['fetch_type'] === 'API') {
            this.commonService.getPfModelData(widgetFilter.filters[filter]['input_value']).subscribe(res => {
              if (res.statusCode === 1) {
                this.dashboardDetails[layout.code]['filters'][filter]['resData'] = res.results;
                widgetFilter['filters'][filter]['resData'] = res.results;
              }
            });
          }
        }
      } else {
        this.dashboardService.getDashboardWidgetDatav2(key, modelInput).subscribe(res => {
          if (res.statusCode === 1) {
            this.processDynamicChartDataRes(modelWidgets, res);
          }
        });
      }
    });
  }

  processDynamicChartDataRes(modelWidgets: ModelWidgets, res: any) {
    for (const item of modelWidgets.layouts) {
      if (!res['results'].hasOwnProperty(item.widgetId)) { continue; }

      this.dashboardDetails[item.code] = { show: false, loading: true };
      const chartValue = res.results[item.widgetId];

      const CHART_TYPES = ['WT-BAR', 'WT-HBAR', 'WT-LINE', 'WT-PIE', 'WT-CHART'];
      if (chartValue && CHART_TYPES.indexOf(item.widgetTypeId) > -1) {
        if (chartValue.options?.styles) { this.dashboardDetails[item.code]['styles'] = chartValue.options.styles; }
        if (chartValue.options?.text)   { this.dashboardDetails[item.code]['text']   = chartValue.options.text; }
        const base = this.echartsAdapter.toOption(chartValue, item.widgetTypeId);
        const baseType = this.echartsAdapter.baseSeriesType(base);
        const settings = this.loadChartSettings(item.code) || this.echartsAdapter.defaultSettings(baseType);
        this.chartSettings[item.code] = settings;
        this.dashboardDetails[item.code]['baseOption'] = base;
        this.dashboardDetails[item.code]['baseType'] = baseType;
        this.dashboardDetails[item.code]['type'] = 'echart';
        this.dashboardDetails[item.code]['echartsOption'] =
          this.echartsAdapter.applySettings(base, settings, this.dashboardDetails[item.code]['text'] || '');
        this.dashboardDetails[item.code]['show'] = true;
      } else if (item.widgetTypeId === 'WT-HDR') {
        this.buildHeaderWidget(item, chartValue || {});
      } else if (item.widgetTypeId === 'WT-TABLE') {
        this.buildTableWidget(item, chartValue);
      } else if (item.widgetTypeId === 'WT-CARD') {
        this.buildCardWidget(item, chartValue, res);
      } else if (chartValue) {
        this.dashboardDetails[item.code]['type'] = 'placeholder';
        this.dashboardDetails[item.code]['placeholderType'] = item.widgetTypeId;
        this.dashboardDetails[item.code]['show'] = true;
      }

      if (chartValue?.redirect) { this.dashboardDetails[item.code]['redirect'] = chartValue['redirect']; }
      this.dashboardDetails[item.code]['loading'] = false;
    }
    setTimeout(() => this.resizeAllCharts(), 150);
  }

  /**
   * WT-HDR header widget — renders either an HTML content template (with ${key}
   * placeholders filled from the model rows) or a styled title bar (mirrors old dashboard).
   */
  private buildHeaderWidget(item: any, headerData: any) {
    const o = headerData?.options?.options || {};
    const title = headerData?.options?.text || headerData?.widgetName || item.widgetName || '';

    this.dashboardDetails[item.code]['type'] = 'header';

    // Optional HTML content template — replace ${col} tokens from the first data row.
    const tpl = headerData?.content ?? headerData?.options?.content ?? null;
    if (tpl) {
      const rows = Array.isArray(headerData.data) ? headerData.data
                 : (headerData.data ? [headerData.data] : []);
      let html = String(tpl);
      const row = rows[0];
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(k => {
          html = html.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), row[k] ?? '');
        });
      }
      this.dashboardDetails[item.code]['content'] = this.sanitizer.bypassSecurityTrustHtml(html);
    } else {
      this.dashboardDetails[item.code]['content'] = null;
    }

    this.dashboardDetails[item.code]['detail'] = [{
      'bg-color': o.backgroundColor || '#b1dafcc9',
      'color': o.color || '#656968',
      'icon': o.icon && o.icon !== '' ? o.icon : '',
      'iconWidth': o.iconWidth,
      'fontSize': o.fontSize || '25px',
      'fontColor': o.fontColor || '#4c4949',
      'fontWeight': (o.fontWeight || '').replace(/!important/g, '').trim() || 'normal',
      'borderRadius': o.borderRadius || '0',
      'justify': (o.alignItem === 'center' || o.alignItems === 'center') ? 'center' : 'flex-start',
      'id': item.code,
      'title': title
    }];
    this.dashboardDetails[item.code]['show'] = true;
  }

  // ─── Layout controls ──────────────────────────────────────────────────────

  refreshLayout() {
    this.dashboardDetails['update'] = true;
    this.bindLayout(this.isLayoutChanged ? JSON.parse(this.defaultLayout) : this.layout);
  }

  autoRefresh(value: boolean) {
    if (value) {
      if (!this.isAutoRefresh) {
        this.isAutoRefresh = true;
        this.autoInterval = setInterval(() => this.refreshLayout(), environment.base_value.layout_autorefresh_time);
      }
    } else {
      clearInterval(this.autoInterval);
      this.isAutoRefresh = false;
    }
    this.getUserPreference('layoutAutoRefresh', String(value));
  }

  alignGrid() {
    if (this.grid) {
      this.grid.compact();
      this.syncLayoutFromGrid();
      this.isLayoutChanged = true;
    }
  }

  toggleLock() {
    this.screenLock = !this.screenLock;
    if (this.grid) {
      this.grid.enableMove(!this.screenLock);
      this.grid.enableResize(!this.screenLock);
    }
  }

  editWidget() {
    const data = this.preResponse;
    data.layouts = this.layout;
    const dialogRef = this.dialog.open(DashboardWidgetComponent, {
      data, panelClass: 'medium-popup', disableClose: true
    });
    dialogRef.componentInstance.widgetShow.subscribe(res => {
      this.dashboardDetails['update'] = true;
      if (res.isFactory) { res.userId = null; res.facilityId = null; }
      else { res.userId = this.userId; res.facilityId = this.facilityId; }
      this.saveCurrentDashboard(res);
    });
  }

  saveWidgets(layout: any[], update = false) {
    this.commonService.setDashboard(this.dashboardId);
    const jsonData = {
      dashboardId: this.dashboardId,
      facilityId: this.facilityId,
      code: this.preResponse.code,
      dashboardName: this.preResponse.dashboardName,
      userId: this.userId,
      layouts: layout,
    };
    if (!this.preResponse.userId) {
      if (this.active_btn.indexOf('BT_DBFAC') === -1) {
        this.refreshLayout();
        this.openSnackbar('You are not Authorized to edit the Factory Layout', 'warning');
      } else {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass: ['confirmation-popup'],
          data: { title: 'Confirmation', message: 'Do you want to update the Factory layout ?', buttonText: { ok: 'Yes', cancel: 'No' } }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result === 'Yes') { this.saveCurrentDashboard(jsonData); }
          else { this.refreshLayout(); this.openSnackbar('Layout changes are reverted', 'warning'); }
        });
      }
    } else {
      this.saveCurrentDashboard(jsonData);
    }
  }

  saveCurrentDashboard(jsonData: any) {
    if (jsonData.dashboardId == null) { jsonData.code = null; }
    this.dashboardService.saveCurrentDashboard(jsonData).subscribe(res => {
      this.preResponse = res.results;
      this.dashboardId = res.results.dashboardId;
      this.getUserPreference();
      this.defaultLayout = JSON.stringify(res.results.layouts);
      this.openSnackbar(res.message, 'success');
      this.bindLayout(res.results.layouts);
    });
    this.isUpdateLayout = false;
  }

  getPopupWidget(data: any[]) {
    for (const item of this.layout) {
      item['isActive'] = !!data.find(v => v.id === item.id);
    }
    this.isUpdateLayout = true;
    this.dashboardDetails['update'] = true;
    this.bindLayout(this.layout);
  }

  openSnackbar(message: string, action: string) {
    this.snackbar.open(message, action, { duration: 3000 });
  }

  private _chartInitOptsCache = new Map<string, any>();

  getChartInitOpts(wid: any): any {
    // Cache by code only (not rows) so that the same object reference is returned
    // after a resize. This prevents ngx-echarts from destroying/recreating the
    // ECharts instance whenever wid.rows changes, which was causing the chart to
    // reinitialise at a stale size and then appear "hidden" inside the smaller tile.
    if (!this._chartInitOptsCache.has(wid.code)) {
      const h = (wid.rows || 1) * CELL_HEIGHT - HEADER_HEIGHT - 8;
      this._chartInitOptsCache.set(wid.code, { height: Math.max(h, 80) });
    }
    return this._chartInitOptsCache.get(wid.code);
  }

  trackByCode(_: number, wid: any) { return wid.code; }


  private buildTableWidget(item: any, tableData: any) {
  if (!tableData) { this.dashboardDetails[item.code]['loading'] = false; return; }
  this.dashboardDetails[item.code]['type'] = 'table';
  this.dashboardDetails[item.code]['data'] = tableData.data;
  this.dashboardDetails[item.code]['column'] = tableData.labels || tableData.label;
  this.dashboardDetails[item.code]['tableStyle'] = tableData.options?.options || {};
  this.dashboardDetails[item.code]['styles'] = tableData.options?.styles || { th: '', tr: '' };
  this.dashboardDetails[item.code]['pagination'] = tableData.options?.pagination || false;
  this.dashboardDetails[item.code]['pageSizeOptions'] = tableData.options?.pageSizeOptions || false;
  this.dashboardDetails[item.code]['enableExcel'] = tableData.options?.enableExcel || false;
  this.dashboardDetails[item.code]['kpiRules'] = tableData.kpi || [];
  this.dashboardDetails[item.code]['label'] = tableData['model-mapping']?.lables?.length ? tableData['model-mapping'].lables : null;
  if (tableData.options?.text) { this.dashboardDetails[item.code]['text'] = tableData.options.text; }
  if (tableData.options?.filters) { this.dashboardDetails[item.code]['filters'] = tableData.options.filters; }
  this.dashboardDetails[item.code]['show'] = true;
}

private buildCardWidget(item: any, cardData: any, res: any) {
  if (!cardData) { this.dashboardDetails[item.code]['loading'] = false; return; }
  this.dashboardDetails[item.code]['type'] = 'card';
  this.dashboardDetails[item.code]['data'] = cardData.data;
  this.dashboardDetails[item.code]['options'] = cardData.options;
  if (cardData.options?.text) { cardData.widgetName = cardData.options.text; this.dashboardDetails[item.code]['text'] = cardData.options.text; }

  // HTML content path (repeatable or static template)
  if (cardData['model-mapping']?.repeatable) {
    const loopKey = (cardData['model-mapping']?.loopKey || '').split(',').map(k => k.trim()).filter(k => k);
    let rawHtml = cardData.content;
    if (loopKey.length) {
      loopKey.forEach(lk => {
        const loopBlock = this.extractFullDiv(rawHtml, lk);
        if (loopBlock) {
          let repeated = '';
          (cardData.data[lk] || cardData.data || []).forEach((itm: any) => {
            let card = loopBlock.block;
            Object.keys(itm).forEach(k => { card = card.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), itm[k]); });
            repeated += card;
          });
          rawHtml = rawHtml.slice(0, loopBlock.start) + repeated + rawHtml.slice(loopBlock.end);
        }
      });
    } else {
      let combined = cardData.options?.text ? `<div style='display:flex;flex-wrap:wrap;gap:16px;'><h3 style="width:100%;">${cardData.options.text}</h3>` : `<div style='display:flex;flex-wrap:wrap;gap:16px;'>`;
      (cardData.data || []).forEach((itm: any) => {
        let card = rawHtml;
        Object.keys(itm).forEach(k => { card = card.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), itm[k]); });
        combined += card;
      });
      rawHtml = combined + '</div>';
    }
    this.dashboardDetails[item.code]['content'] = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  } else if (cardData.content || cardData.options?.content) {
    const tpl = cardData.content || cardData.options.content;
    this.dashboardDetails[item.code]['content'] = this.sanitizer.bypassSecurityTrustHtml(tpl);
  } else {
    // Style-driven card
    this.dashboardDetails[item.code]['content'] = null;
    this.dashboardDetails[item.code]['cardStyle'] = cardData.options?.style;
    const o = cardData.options?.options || {};
    if (o.backgroundColor) {
      this.dashboardDetails[item.code]['maxCol'] = o.col;
      this.dashboardDetails[item.code]['detail'] = [{ type: 'text', col: o.col, 'bg-color': o.backgroundColor, color: o.color, icon: o.icon || '', iconWidth: o.iconWidth, fontSize: o.fontSize, fontColor: o.fontColor, id: item.code, title: cardData.widgetName, data: o.icon === '' ? { data: cardData.data, label: cardData.labels } : cardData.data[0], label: cardData.labels?.[0] }];
    } else {
      this.dashboardDetails[item.code]['maxCol'] = 3;
      this.dashboardDetails[item.code]['detail'] = [{ type: 'text', col: 3, 'bg-color': '#58edd7', color: '#656968', icon: '', fontSize: '25px', fontColor: '#4c4949', id: item.code, title: cardData.widgetName, data: { data: cardData.data, label: cardData.labels } }];
    }
  }
  this.dashboardDetails[item.code]['show'] = true;
}

private extractFullDiv(template: string, loopKey: string): { block: string, start: number, end: number } | null {
  const startMatch = template.match(new RegExp(`<div[^>]+id=['"]${loopKey}['"][^>]*>`, 'i'));
  if (!startMatch) { return null; }
  let openCount = 0, i = startMatch.index;
  while (i < template.length) {
    if (template.slice(i).startsWith('<div')) { openCount++; }
    else if (template.slice(i).startsWith('</div>')) { if (--openCount === 0) { return { block: template.slice(startMatch.index, i + 6), start: startMatch.index, end: i + 6 }; } }
    i++;
  }
  return null;
}
}
