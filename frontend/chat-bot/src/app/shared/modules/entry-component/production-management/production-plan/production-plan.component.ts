import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../../services';
import { CreateEntityRoutine } from '../../create-manage-routine/create-manage-routine.model';
import { CreateRoutineActivityComponent } from '../../create-routine-activity/create-routine-activity.component';
import { DatePipe } from '@angular/common';
import { ConfirmationDialog } from '../../confirmation-dialog/confirmation-dialog.component';
import { PushNotificationsService } from '../../../../services/push.notification.service';
import { AssignTaskComponent } from '../../../../../ovitag/workflow/task/task.component';
import { AppToastService } from '../../../../services/toaster.service';
import { TagAssociateComponent } from '../tag-associate/tag-associate.component';
import { ChartType } from 'angular-google-charts';

@Component({
  selector: 'app-production-plan',
  templateUrl: './production-plan.component.html',
  styleUrls: ['./production-plan.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductionPlanComponent implements OnInit {

  // ── List data ──────────────────────────────────────────────────────────────
  public subOrderList: any[] = [];
  public filteredSubOrderList: any[] = [];
  public salesOrderData: any = null;

  // ── Selection state ────────────────────────────────────────────────────────
  selectedSubIndex: number = 0;
  selectedSubData: any = null;

  // ── Routine / activity data ────────────────────────────────────────────────
  public createRoutine: CreateEntityRoutine;
  public today = new Date();
  routineId    = new FormControl(null);
  routineType  = new FormControl(null);
  searchControl      = new FormControl('');
  planSearchControl  = new FormControl('');

  routineList: any[]       = [];
  activityDatas: any[]     = [];
  routineMasterList: any[] = [];
  routineTypes: any;
  routineData: any;
  accordionActivities: any[] = [];
  categoryItemList: any;
  linkedActivity: any;

  // ── UI flags ───────────────────────────────────────────────────────────────
  isRoutine: boolean  = false;
  isEditable: boolean = false;
  isDeliveryDetail: boolean = false;
  isRotating: boolean = false;
  loading: boolean    = false;

  activeTab: string    = 'tasks';
  activeFilter: string = 'all';

  // ── Google Timeline Chart ──────────────────────────────────────────────────
  chartType = ChartType.Timeline;
  timelineChartColumns = [
    { type: 'string', id: 'Task' },
    { type: 'string', id: 'Department' },
    { type: 'string', role: 'style' },
    { type: 'date', id: 'Start' },
    { type: 'date', id: 'End' }
  ];
  timelineChartData: any[][] = [];
  timelineChartOptions: any = {};

  // ── More-options menus ─────────────────────────────────────────────────────
  option1 = [
    { name: 'Delete',    type: 'delete',    value: null },
    { name: 'Edit',      type: 'edit',      value: null },
    { name: 'Duplicate', type: 'duplicate', value: null }
  ];
  option2 = [{ name: 'Edit', type: 'edit', value: null }];
  moreOptions = this.option1;

  private readonly deptColors = ['chip-blue', 'chip-red', 'chip-green', 'chip-purple', 'chip-orange', 'chip-dark'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ProductionPlanComponent>,
    private readonly workflowService: WorkflowService,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    public toastr: AppToastService,
    public dialog: MatDialog,
    private readonly dateFormat: DatePipe,
    private readonly pushNotificationsService: PushNotificationsService
  ) {}

  ngOnInit(): void {
    if (this.data?.id) {
      // Pre-populate banner immediately from dialog data while API loads
      this.salesOrderData = this.data;
      this.getSalesOrderById(this.data.id);
    }
  }

  // ── Computed task helpers ──────────────────────────────────────────────────

  get allTasks(): any[] {
    return this.accordionActivities.reduce((acc, g) => acc.concat(g.groupedActivity || []), [] as any[]);
  }

  get totalTasksCount(): number {
    return this.accordionActivities.reduce((sum, g) => sum + g.totalCount, 0);
  }

  get assignedCount(): number {
    return this.allTasks.filter(t => t.requestStatusId === 'RQ-CR').length;
  }

  get scheduledCount(): number {
    return this.allTasks.filter(t => t.requestStatusId === 'RQ-SH').length;
  }

  get doneCount(): number {
    return this.accordionActivities.reduce((sum, g) => sum + g.completedCount, 0);
  }

  get overallProgress(): string {
    const total = this.totalTasksCount;
    return total ? ((this.doneCount / total) * 100).toFixed(0) : '0';
  }

  get inProgressCount(): number {
    return this.allTasks.filter(t => t.requestStatusId === 'RQ-IP').length;
  }

  get departmentBreakdown(): { name: string; total: number; done: number; pct: number; colorClass: string }[] {
    const map: { [key: string]: { total: number; done: number } } = {};
    this.allTasks.forEach(t => {
      const d = t.departmentName || 'Unassigned';
      if (!map[d]) { map[d] = { total: 0, done: 0 }; }
      map[d].total++;
      if (t.requestStatusId === 'RQ-CO') { map[d].done++; }
    });
    return Object.keys(map).map(name => ({
      name,
      total: map[name].total,
      done: map[name].done,
      pct: map[name].total ? Math.round((map[name].done / map[name].total) * 100) : 0,
      colorClass: this.getDeptColorClass(name)
    }));
  }

  get timelineRange(): { min: Date; max: Date; totalMs: number } | null {
    const times: number[] = [];
    this.allTasks.forEach(t => {
      times.push(this.getTaskStartTime(t).getTime());
      times.push(this.getTaskEndTime(t).getTime());
    });
    if (!times.length) { return null; }
    const minT = times.reduce((a, b) => Math.min(a, b), Infinity);
    const maxT = times.reduce((a, b) => Math.max(a, b), -Infinity);
    const totalMs = maxT - minT || 86400000;
    return { min: new Date(minT), max: new Date(maxT), totalMs };
  }

  get todayMarkerLeft(): string | null {
    const range = this.timelineRange;
    if (!range) { return null; }
    const now = Date.now();
    if (now < range.min.getTime() || now > range.max.getTime()) { return null; }
    return ((now - range.min.getTime()) / range.totalMs * 100).toFixed(1) + '%';
  }

  get timelineMarkers(): { label: string; left: string }[] {
    const range = this.timelineRange;
    if (!range) { return []; }
    const markers: { label: string; left: string }[] = [];
    const days = Math.ceil(range.totalMs / 86400000);
    const step = Math.max(1, Math.ceil(days / 6));
    let cur = new Date(range.min);
    while (cur.getTime() <= range.max.getTime()) {
      const pct = ((cur.getTime() - range.min.getTime()) / range.totalMs * 100).toFixed(1);
      markers.push({ label: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), left: pct + '%' });
      cur = new Date(cur.getTime() + step * 86400000);
    }
    return markers;
  }

  getTaskStartTime(task: any): Date {
    if (task.requestStatusId === 'RQ-CO') {
      if (task.actualStartTime) return new Date(task.actualStartTime);
      if (task.completedTime) return new Date(task.completedTime);
    }
    if (task.scheduleStart) return new Date(task.scheduleStart);
    if (task.fromDate) return new Date(task.fromDate);
    return new Date();
  }

  getTaskEndTime(task: any): Date {
    if (task.requestStatusId === 'RQ-CO') {
      if (task.actualEndTime) return new Date(task.actualEndTime);
      if (task.completedTime) return new Date(task.completedTime);
      if (task.scheduleEnd) return new Date(task.scheduleEnd);
    }
    if (task.scheduleEnd) return new Date(task.scheduleEnd);
    if (task.toDate) return new Date(task.toDate);
    const start = this.getTaskStartTime(task);
    return new Date(start.getTime() + 86400000);
  }

  getTaskBarStyle(task: any): { [key: string]: string } {
    const range = this.timelineRange;
    if (!range) { return { left: '0%', width: '20%' }; }
    const s = this.getTaskStartTime(task).getTime();
    const e = this.getTaskEndTime(task).getTime();
    const left  = Math.max(0, ((s - range.min.getTime()) / range.totalMs) * 100);
    const width = Math.max(2, ((e - s) / range.totalMs) * 100);
    return { left: left.toFixed(1) + '%', width: width.toFixed(1) + '%' };
  }

  getTimelineTooltip(task: any): string {
    const parts: string[] = [task.activityName, task.requestStatusName];
    const s = this.getTaskStartTime(task);
    const e = this.getTaskEndTime(task);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (task.requestStatusId === 'RQ-CO') {
      parts.push('Actual: ' + fmt(s) + ' - ' + fmt(e));
      if (task.scheduleStart || task.scheduleEnd) {
        const ss = task.scheduleStart ? new Date(task.scheduleStart) : null;
        const se = task.scheduleEnd ? new Date(task.scheduleEnd) : null;
        if (ss && se) {
          parts.push('Scheduled: ' + fmt(ss) + ' - ' + fmt(se));
        }
      }
    } else {
      parts.push('Scheduled: ' + fmt(s) + ' - ' + fmt(e));
    }
    return parts.join(' · ');
  }

  getStatusColor(statusId: string): string {
    const map: Record<string, string> = {
      'RQ-CO': '#43a047',
      'RQ-IP': '#fb8c00',
      'RQ-CR': '#1e88e5',
      'RQ-SH': '#90a4ae'
    };
    return map[statusId] || '#9e9e9e';
  }

  buildTimelineChartData(): void {
    const data: any[][] = [];
    this.accordionActivities.forEach(grp => {
      grp.groupedActivity.forEach((task: any) => {
        data.push([
          task.activityName,
          task.departmentName || '',
          this.getStatusColor(task.requestStatusId),
          this.getTaskStartTime(task),
          this.getTaskEndTime(task)
        ]);
      });
    });
    this.timelineChartData = data;
    this.timelineChartOptions = {
      timeline: {
        colorByRowLabel: false,
        showRowLabels: true,
        rowLabelStyle: { fontSize: 12, color: '#333' },
        barLabelStyle: { fontSize: 11, color: '#fff' }
      },
      hAxis: {
        format: 'MMM dd',
        textStyle: { fontSize: 11, color: '#555' },
        position: 'top'
      },
      height: Math.max(200, data.length * 42 + 50),
      tooltip: { isHtml: true }
    };
  }

  markNextTaskDone(): void {
    const next = this.allTasks.find(t => t.requestStatusId !== 'RQ-CO' && t.requestStatusId !== 'RQ-CA');
    if (!next) {
      this.toastr.success('Success', 'All tasks are already completed');
      return;
    }
    this.triggerTaskStatus(next, 'RQ-CO');
  }

  exportTasks(): void {
    if (!this.allTasks.length) {
      this.toastr.error('Error', 'No tasks to export');
      return;
    }
    const headers = ['Task Name', 'Seq Level', 'Department', 'Assigned To', 'Location', 'Status', 'Start Date', 'End Date'];
    const rows = this.allTasks.map(t => [
      t.activityName || '', t.sequenceLevel || '', t.departmentName || '',
      t.performerName || '', t.destinationLocationName || '', t.requestStatusName || '',
      t.scheduleStart ? new Date(t.scheduleStart).toLocaleDateString() : '',
      t.scheduleEnd   ? new Date(t.scheduleEnd).toLocaleDateString()   : ''
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href     = url;
    anchor.download = 'production-plan-' + (this.salesOrderData?.identifier || 'export') + '.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  getDeptColorClass(name: string): string {
    if (!name) return 'chip-neutral';
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return this.deptColors[hash % this.deptColors.length];
  }

  // ── Filter / search ────────────────────────────────────────────────────────

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilterList();
  }

  applyFilterList(): void {
    const base = [...this.subOrderList];
    if (this.activeFilter === 'all') {
      this.filteredSubOrderList = base;
    } else if (this.activeFilter === 'inprogress') {
      this.filteredSubOrderList = base.filter(i => i.routineStatusId === 'RQ-IP');
    } else if (this.activeFilter === 'pending') {
      this.filteredSubOrderList = base.filter(i => !i.routineId || i.routineStatusId === 'RQ-PEN');
    } else if (this.activeFilter === 'done') {
      this.filteredSubOrderList = base.filter(i => i.routineStatusId === 'RQ-CO');
    }
  }

  applyItemSearch(value: string): void {
    const term = (value || '').toLowerCase();
    this.filteredSubOrderList = this.subOrderList.filter(i =>
      i.itemMasterName?.toLowerCase().includes(term)
    );
  }

  applyPlanSearch(value: string): void {
    const term = (value || '').toLowerCase();
    this.routineList = this.routineMasterList.filter(i =>
      i.name?.toLowerCase().includes(term)
    );
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  // ── Sub-order selection ────────────────────────────────────────────────────

  onSelectSubOrder(subData: any, index: number): void {
    if (this.selectedSubIndex === index) return;
    this.selectedSubData    = null;
    this.routineData        = null;
    this.activityDatas      = [];
    this.accordionActivities = [];
    this.isRoutine          = false;
    this.isEditable         = false;
    this.routineType.setValue(null);
    this.routineId.setValue(null);
    this.selectedSubIndex = index;
    this.selectedSubData  = subData;
    this.activeTab        = 'tasks';

    if (!subData.itemMasterRoutineTypeId) {
      this.commonService.getAppTermsLink('RC-PRD', 'RoutineType').subscribe(res => {
        this.routineTypes = res.results;
      });
    }

    if (subData.routineId) {
      this.isRoutine  = true;
      this.isEditable = false;
      this.moreOptions = this.option2;
      if (subData.id) { this.getEntityRoutineData(subData.id); }
      this.getEntityRoutinelink(subData.routineId);
      this.getlinkedActivityRule(subData.routineId);
      this.routineType.setValue(subData.itemMasterRoutineTypeId);
      this.routineId.setValue(subData.routineId);
    } else {
      this.isEditable  = true;
      this.moreOptions = this.option1;
      this.routineType.setValue(subData.itemMasterRoutineTypeId);
      this.getRoutineList(subData.itemMasterRoutineTypeId);
    }
    this.makeCategoryList(subData.deliveryDetails);
  }

  // ── API calls ──────────────────────────────────────────────────────────────

  getSalesOrderById(id: any): void {
    this.workflowService.getAllDeliveryById(id).subscribe(res => {
      const orderData      = res?.results;
      this.salesOrderData  = { ...this.data, ...orderData };
      this.subOrderList    = orderData['deliveryDetails'] || [];
      this.filteredSubOrderList = [...this.subOrderList];

      const sub = this.subOrderList[this.selectedSubIndex];
      if (!sub) return;
      this.selectedSubData = sub;
      this.makeCategoryList(sub.deliveryDetails);

      if (!sub.itemMasterRoutineTypeId) {
        this.commonService.getAppTermsLink('RC-PRD', 'RoutineType').subscribe(r => {
          this.routineTypes = r.results;
        });
      }

      if (sub.routineId) {
        this.isRoutine   = true;
        this.moreOptions = this.option2;
        if (sub.id) { this.getEntityRoutineData(sub.id); }
        this.getEntityRoutinelink(sub.routineId);
        this.getlinkedActivityRule(sub.routineId);
        this.routineType.setValue(sub.itemMasterRoutineTypeId);
        this.routineId.setValue(sub.routineId);
      } else {
        this.isEditable  = true;
        this.moreOptions = this.option1;
        this.routineType.setValue(sub.itemMasterRoutineTypeId);
        this.getRoutineList(sub.itemMasterRoutineTypeId);
      }
    });
  }

  makeCategoryList(detailData: any[]): void {
    if (!detailData) return;
    const grouped = detailData.reduce((acc, obj) => {
      const key = obj.itemMasterActivityCategoryId;
      if (key && key.trim() !== '') {
        if (!acc[key]) acc[key] = [];
        acc[key].push({ id: obj.id, name: obj.itemMasterName });
      }
      return acc;
    }, {} as Record<string, { id: number; name: string }[]>);
    grouped['empty'] = detailData.map(d => ({ id: d.id, name: d.itemMasterName }));
    this.categoryItemList = grouped;
  }

  getRoutineList(type: any): void {
    if (!type) return;
    this.configurationService.getRoutineName('', type).subscribe(res => {
      this.routineList      = res.results;
      this.routineMasterList = [...this.routineList];
    });
  }

  getRoutineActivitys(id: any): void {
    this.configurationService.getRoutineActivities(id).subscribe(res => {
      this.routineData  = res.results[0];
      this.activityDatas = this.routineData?.activities;
    });
  }

  getEntityRoutineData(id: any): void {
    this.loading = true;
    this.workflowService.getSalesOrderRoutine(id).subscribe(res => {
      this.routineData = res.results;
      const groupedMap: { [key: string]: any[] } = this.routineData.reduce(
        (groups: any, activity: any) => {
          const mainLevel = activity?.sequenceLevel?.toString().split('.')[0];
          if (!groups[mainLevel]) groups[mainLevel] = [];
          groups[mainLevel].push(activity);
          return groups;
        }, {}
      );

      this.accordionActivities = Object.keys(groupedMap).map(key => {
        const activities     = groupedMap[key];
        const totalCount     = activities.length;
        const completedCount = activities.filter((f: any) => f.requestStatusId === 'RQ-CO').length;
        let status = 'Assigned';
        if (completedCount === totalCount) status = 'Completed';
        else if (activities.some((f: any) => f.requestStatusId === 'RQ-IP')) status = 'InProgress';
        const titleActivity =
          activities.find((f: any) => f.requestStatusId === 'RQ-CR' || f.requestStatusId === 'RQ-IP') ||
          activities.find((f: any) => f.requestStatusId === 'RQ-SH' || f.requestStatusId === 'RQ-CO') ||
          activities[0];
        return {
          title: titleActivity.itemMasterName,
          mainSequence: key,
          totalCount,
          completedCount,
          progress: totalCount ? ((completedCount / totalCount) * 100).toFixed(1) : 0,
          groupedActivity: activities,
          status
        };
      });

      // Update the current sub-order's counts from actual task data
      const subTotal = this.accordionActivities.reduce((sum, g) => sum + (g.totalCount || 0), 0);
      const subDone  = this.accordionActivities.reduce((sum, g) => sum + (g.completedCount || 0), 0);
      const currentSub = this.subOrderList[this.selectedSubIndex];
      if (currentSub) {
        currentSub.totalCount = subTotal;
        currentSub.completedCount = subDone;
      }

      this.buildTimelineChartData();
      this.loading = false;
    });
  }

  getEntityRoutinelink(id: any): void {
    this.configurationService.getEntityRoutineActivity(id).subscribe(res => {
      this.activityDatas = res.results[0]?.activities;
    });
  }

  getlinkedActivityRule(id: any): void {
    this.configurationService.getAllActivityRule(id).subscribe(res => {
      this.linkedActivity = res.results;
    });
  }

  onRefreshClick(id: string): void {
    this.isRotating = true;
    this.getEntityRoutineData(id);
    setTimeout(() => (this.isRotating = false), 1000);
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────

  editMode(): void {
    this.isEditable = !this.isEditable;
  }

  deliveryDetailCheck(): void {
    if (!this.activityDatas?.length) { this.isDeliveryDetail = false; return; }
    this.isDeliveryDetail = this.activityDatas.every(item => item.deliveryDetailId !== null);
  }

  // ── Table event from edit-mode angular-table-component ────────────────────

  triggerAction(event: any): void {
    if (event.key === 'delete') {
      const idx = this.activityDatas.indexOf(event.data);
      if (idx !== -1) this.activityDatas.splice(idx, 1);
      this.activityDatas = [...this.activityDatas];
    } else if (event.key === 'edit') {
      this.openActivityDialog(event.data, this.activityDatas.indexOf(event.data));
    } else if (event.key === 'select') {
      const idx = this.activityDatas.indexOf(event.data);
      this.activityDatas[idx]['deliveryDetailId'] = parseInt(event.keyVal);
      this.deliveryDetailCheck();
    }
  }

  // ── Task status change (complete / cancel) ─────────────────────────────────

  triggerTaskStatus(task: any, status: string): void {
    const isComplete   = status === 'RQ-CO';
    const isInProgress = status === 'RQ-IP';
    const statusData   = { comments: task.deliveryRequestComments, type: 'RQT-ROU', status, userType: task.performerType };
    const dialogRef    = this.dialog.open(ConfirmationDialog, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: {
        title:   isComplete ? 'Complete Task' : isInProgress ? 'Manage Task' : 'Cancel Task',
        message: isComplete ? 'Do you want to complete the task ?' :
                 isInProgress ? 'Do you want to inprogress the task ?' : 'Do you want to cancel the task ?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        completeTask: true,
        requestId: task.requestId,
        completeData: statusData
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.pushNotificationsService.triggerNotificationRefresh();
        this.getSalesOrderById(this.data?.id);
      }
    });
  }

  // ── Assign-to click (performer link) ──────────────────────────────────────

  editTask(task: any): void {
    if (task.requestStatusId === 'RQ-CO') return;
    const dialogRef = this.dialog.open(AssignTaskComponent, {
      data: { ...task, launchType: 'isTask' },
      height: '250px',
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => this.getSalesOrderById(this.data?.id));
  }

  // ── Tag / Asset association ──────────────────────────────────────────────

  openTagAssociate(subData?: any): void {
    const deliveryDetail = subData || this.selectedSubData;
    if (!deliveryDetail) return;
    const dialogRef = this.dialog.open(TagAssociateComponent, {
      data: { deliveryDetail, salesOrderIdentifier: this.salesOrderData?.identifier },
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.getSalesOrderById(this.data?.id);
      }
    });
  }

  // ── Add / edit activity dialog ─────────────────────────────────────────────

  addTask(): void {
    this.openActivityDialog(null, -1);
  }

  private openActivityDialog(activityData: any, index: number): void {
    const routineInfo = {
      routineType:  this.routineType.value,
      type:         activityData ? 'modify' : 'create',
      contextType:  'RC-PRD',
      activityData: activityData || null,
      scheduleType: activityData?.scheduleTypeId,
      routineId:    this.selectedSubData?.routineId || null
    };
    const ref = this.dialog.open(CreateRoutineActivityComponent, {
      data: routineInfo, panelClass: ['medium-popup'], disableClose: true
    });
    ref.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.getSalesOrderById(this.data?.id);
      } else if (res?.results) {
        if (index !== undefined && index !== -1) {
          this.activityDatas[index] = { ...this.activityDatas[index], ...res.results };
        } else {
          this.activityDatas.push(res.results);
        }
        this.activityDatas = [...this.activityDatas];
      }
    });
  }

  // ── Save (create routine) ──────────────────────────────────────────────────

  saveSalesRoutine(): void {
    this.createRoutine = new CreateEntityRoutine(null, null, null, null, null, null, null, null, null, null);
    this.createRoutine.identifiyingId  = this.selectedSubData.id;
    this.createRoutine.identifyingType = 'DeliveryDetail';
    this.createRoutine.routineId       = this.routineId.value;
    this.createRoutine.routineType     = this.routineType.value;
    this.createRoutine.routineStatusId = 'RQ-CR';
    this.createRoutine.scheduleTypeId  = this.routineData.scheduleTypeId;
    this.createRoutine.fromDate        = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
    this.createRoutine.scheduleStart   = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
    this.createRoutine.scheduleEnd     = this.dateFormat.transform(this.today, 'yyyy-MM-dd 23:59:00');
    this.createRoutine.activities      = this.activityDatas.length ? this.activityDatas : null;

    this.configurationService.createRoutine(this.createRoutine).subscribe(
      res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.getSalesOrderById(this.data?.id);
          this.isEditable = false;
        }
      },
      error => this.toastr.error('Error', `${error.error.message}`)
    );
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
