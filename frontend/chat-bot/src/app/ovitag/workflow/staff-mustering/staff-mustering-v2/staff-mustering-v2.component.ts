import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../../shared';
import { MqttClient, connect } from 'mqtt';
import { CommonDialogComponent } from '../../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { AiStMustComponent } from '../../../report/staffMustering-Report/ai-stmust.component';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-staff-mustering-v2',
  templateUrl: './staff-mustering-v2.component.html',
  styleUrls: ['./staff-mustering-v2.component.scss']
})
export class StaffMusteringV2Component {

  // ─── UI state ─────────────────────────────────────────────────
  selectedTabIndex = 0;
  hide = false;
  enableCard = false;
  isInitiated = false;
  initiated = false;
  // Shown over the Initiate Emergency dialog from click until saveTask() responds —
  // same shared spinner (.loading-spinner/.spinnerload) used across the app.
  initiateLoading = false;
  typeOfEmergency: string;
  statusText = 'Active';
  selectedView = 'floors';
  emergencyDuration = '00:00:00';

  selectedIncidentLocations: string[] = [];
  selectedActivityCategoryId: string = '';
  musterComment: string = '';

  // ─── Icon maps for the new UI ──────────────────────────────────
  kpiIcons = ['groups', 'where_to_vote', 'location_off', 'person_pin'];
  emgKpiIcons = ['groups', 'badge', 'person', 'where_to_vote'];

  // ─── Data arrays ──────────────────────────────────────────────
  assemblyPoints: any[] = [];
  floordetails: any[] = [];
  locationCard: any[] = [];
  sapData: any[] = [];
  tableData: any[] = [];
  blocks: any[] = [];
  selectedFloorLocations: any[] = [];
  routines: any;
  routineId: any;
  routinesid: any;
  selectedBlockId: number = null;
  selectedblock: any;
  actualTime: any;

  // ─── Block detail panel ───────────────────────────────────────
  selectedBlock: any = null;
  blockDetailTab: string = 'employees';
  blockDetailLoading = false;
  blockDetails: { employees: any[]; visitors: any[]; total: number; employeeCount: number; visitorCount: number } = { employees: [], visitors: [], total: 0, employeeCount: 0, visitorCount: 0 };

  // ─── Real-time tag tracking maps ──────────────────────────────
  private client: MqttClient;
  // Only these tag types represent people to be counted on the mustering
  // dashboard; TAT-VS is a visitor, this set is everyone else who counts as an
  // employee, and any other tag type (assets, infants, wheelchairs, etc.) is
  // excluded from both counts entirely.
  private readonly EMPLOYEE_TAG_TYPES = new Set(['TAT-US', 'TAT-PO', 'TAT-EM', 'TAT-ID', 'TAT-ST']);
  floorTags: Map<number, Set<string>> = new Map();
  blockTags: Map<number, Set<string>> = new Map();
  blockMap: Map<number, any> = new Map();
  tagFloorMap: Map<string, number> = new Map();
  tagLastSeen: Map<string, number> = new Map();
  tagTypeMap = new Map<string, 'EMPLOYEE' | 'VISITOR'>();
  tagLocationMap: Map<string, number> = new Map();
  floordetailsMap: Map<number, any> = new Map();
  locationCardMap: Map<number, any> = new Map();
  sapLocationIds: Set<number> = new Set();
  sapTags: Map<number, Set<string>> = new Map();
  private readonly tagBlockMap: Map<string, number> = new Map();
  inactiveTimeout = 30000;

  // ─── Location hierarchy (from getLogicalLocationWithChildren) ──
  // Every block-level location id (locationTypeId === 25).
  private blockLocationIds: Set<number> = new Set();
  // Every descendant location id → its logicalParentId, at any depth.
  private locationParentMap: Map<number, number> = new Map();

  // ─── Table column config ──────────────────────────────────────
  displayColumns = ['Name', 'From Location', 'To Location', 'Mustering Duration'];
  sapColumns = ['performerName', 'sourceLocationName', 'destinationLocationName', 'totalDuration'];
  historyColumns = ['Name', 'Initiated By', 'Start Time', 'End Time', 'Status', 'Comments'];
  dateTimeColumn = ['Start Time', 'End Time'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = ['Start Time', 'End Time'];
  sortColumn = [];
  permissionControl = [null];

  // ─── Pagination / filter ──────────────────────────────────────
  pageSize = 50;
  pageStart = 0;
  pageLength: number;
  applyFilterValue: any;

  // ─── Map maximize/minimize (dashboard tab only) ────────────────
  isMapMaximized = false;

  // ─── Date state ───────────────────────────────────────────────
  public currentDate = new Date();
  public selectedDate: string;
  public parentId: any;

  // ─── User Counts API data (top summary cards) ─────────────────
  userCountsLoading = false;
  userCountsError = false;

  // Top 4 summary cards driven by /api/request/mustering/user-counts
  topSummaryCards = [
    { label: 'Total People',        value: 0, icon: 'groups',       subtitle: 'Across all locations',    meta: 'total' },
    { label: 'Safe Assembly Point', value: 0, icon: 'where_to_vote', subtitle: 'Reached muster point',  meta: 'assemblyPoint' },
    { label: 'Not In Destination',  value: 0, icon: 'location_off', subtitle: 'Yet to reach safe zone',  meta: 'notInDestination' },
    { label: 'Visitors',            value: 0, icon: 'person_pin',   subtitle: 'Visitors on site',        meta: 'visitors' }
  ];

  // People In Building data (from same API)
  peopleInBuilding = {
    total: 0,
    visitors: 0,
    employees: 0
  };

  // Number of People Checked In Today (totalAssociatedTags) — separate from the
  // Visitors card, which also lands on topSummaryCards[3] but for a different field.
  checkedInToday = 0;

  // ─── Evacuation progress (alert-bar "X of Y" + bar) ────────────
  // Numerator mirrors the Safe Assembly Point cards exactly (same sap.count
  // each card renders) so the two never disagree: it's re-summed from
  // assemblyPoints on every read, which already gets refreshed on tab
  // change/refresh (getMustering -> getsafelocation) and updated live by MQTT
  // (updateFloorCount -> applySapCount), same as the cards themselves.
  totalForMuster = 0;

  get musteredCount(): number {
    const raw = this.assemblyPoints.reduce((sum, sap) => sum + (Number(sap.count) || 0), 0);
    // totalForMuster and the per-SAP counts are refreshed by different paths
    // (getUserCounts poll vs. live MQTT), so raw can transiently run ahead of
    // the total — clamp so "X of Y" never shows X > Y.
    return this.totalForMuster > 0 ? Math.min(raw, this.totalForMuster) : raw;
  }

  get musterProgressPct(): number {
    return this.totalForMuster > 0 ? Math.min(100, Math.round(this.musteredCount / this.totalForMuster * 100)) : 0;
  }

  // ─── Assembly Point performance chart (replaces the old static "Mustering
  // Performance" table) — same horizontal-bar style as Porter v2 report's
  // Porter Performance widget, one bar per assembly point showing its live count.
  assemblyPointBarOpt: EChartsOption = {};

  // ─── Dashboard data (emergency KPI row — MQTT driven) ─────────
  dashboardData = [
    { label: 'Total People', value: 0 },
    { label: 'Employees in Campus', value: 0 },
    { label: 'Visitors in Campus', value: 0 },
    { label: 'At Assembly Points', value: 0 }
  ];

  employeedashboardData = [
    { label: 'Total People', value: 0 },
    { label: 'Employees in Campus', value: 0 },
    { label: 'Visitors in Campus', value: 0 }
  ];

  // ─── Facility context ─────────────────────────────────────────
  public facilityId = localStorage.getItem(btoa('facilityId'));

  // ─── Misc ─────────────────────────────────────────────────────
  public matTabChangeSub: Subject<any> = new Subject();
  private timerInterval: any;
  // Throttled (5s) refresh fired only when floorTags/sapTags set sizes actually
  // change; liveRefreshFallbackInterval is a coarse (30s) safety net covering
  // anything MQTT misses (or server-side-only changes, e.g. a new check-in).
  // Replaces a blind "poll every 5s no matter what" — see scheduleLiveRefresh().
  private liveRefreshTimer: any = null;
  private liveRefreshFallbackInterval: any = null;
  private lastLiveSignature = '';
  private startTime!: number;
  selectedFloorId: number;
  // Facility-configured default block/floor for this dashboard (mustering-config),
  // fetched once in ngOnInit and reused by getMustering() on tab reselect.
  private musteringConfig: { blockId?: number; floorId?: number } = null;

  constructor(
    public dialog: MatDialog,
    public commonService: CommonService,
    public toastr: AppToastService,
    public hospitalService: HospitalService,
    public configurationService: ConfigurationService,
    public datepipe: DatePipe,
    public worflowService: WorkflowService
  ) {}

  // Consistent error-toast helper — surfaces the backend's { message } straight
  // to the user (e.g. "Mustering Already Exists"), matching this app's convention.
  private showApiError(error: any, fallback = 'Something went wrong. Please try again.'): void {
    const msg = error?.error?.message || error?.message || fallback;
    this.toastr.error('Error', msg);
  }

  ngOnInit() {
    this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');

    // Restore persisted state
    const saved = localStorage.getItem('musteringState');
    if (saved) {
      const state = JSON.parse(saved);
      this.isInitiated = state.isInitiated;
      this.enableCard = state.enableCard;
      this.selectedView = state.selectedView;
      this.typeOfEmergency = state.typeOfEmergency;
      this.hide = state.hide;
      this.routinesid = state.routinesid;
      this.routines = state.routines;
      this.actualTime = state.actualTime;
      this.selectedActivityCategoryId = state.selectedActivityCategoryId || '';
      this.selectedIncidentLocations = state.selectedIncidentLocations || [];
    }

    // Load emergency activity types
    this.configurationService.getAllSafetyActivities('TAC-SFE').subscribe({
      next: res => { this.routines = res.results; },
      error: error => this.showApiError(error)
    });

    // Load safe assembly points
    this.hospitalService.getsafelocation('ROU-SFE').subscribe({
      next: res => {
        this.assemblyPoints = res.results;
        this.sapLocationIds.clear();
        this.assemblyPoints.forEach((sap: any) => {
          if (sap?.locationId) {
            this.sapLocationIds.add(Number(sap.locationId));
            this.applySapCount(sap);
          }
        });
        this.buildAssemblyPointBar();
      },
      error: error => this.showApiError(error)
    });

    // Load building / floor hierarchy, resolving the default block/floor from
    // facility config (mustering-config) when set, else the first block/floor.
    forkJoin({
      blocks: this.hospitalService.getBlockWithFloors(),
      config: this.commonService.getConfigFile('mustering-config').pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ blocks: res, config }) => {
        if (res.statusCode === 1) {
          this.musteringConfig = config?.results?.contentObject || null;
          const floorId = this.resolveDefaultFloorId(res.results);
          this.selectedFloorId= floorId
          this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe({
            next: inner => {
              this.collectLocationHierarchy(inner.results.children);

              let temp = inner.results.children.filter((r: any) => r.locationTypeId === 25);
              this.floordetails = temp.map((floor: any) => ({ ...floor, count: 0 }));
              this.parentId = floorId;

              this.locationCard = this.floordetails.map(floor => ({
                title: floor.name,
                subtitle: 'Floor',
                count: floor.count,
                countLabel: 'People',
                floorId: Number(floor.id),
                buildingName: floor.name,
                parentId: Number(floorId),
                visitorCount: 0,
                employeeCount: 0
              }));

              this.locationCard.forEach(card => {
                this.locationCardMap.set(Number(card.floorId), card);
              });

              // Seed live counts from the current snapshot, MQTT keeps them updated after this
              this.seedFloorTagCounts();
            },
            error: error => this.showApiError(error)
          });
        }
      },
      error: error => this.showApiError(error)
    });

    // If we came back with an active emergency, confirm it's still actually
    // active server-side before trusting the locally-persisted state.
    this.syncMusteringStatus();

    // Nothing in localStorage (e.g. fresh login on this browser/device) — ask the
    // backend if a mustering is already open for this facility so it can be resumed.
    if (!this.routinesid) {
      this.checkForActiveMustering();
    }

    // Resume timer + assignments table if an emergency is already running (e.g. page refresh)
    if (this.isInitiated && this.routinesid) {
      if (this.actualTime) {
        this.startEmergencyTimer(this.actualTime);
      }
      this.loadMusteringUsers(this.routinesid);
    }

    // Load top summary cards, then keep both it and the assignments table fresh —
    // primarily event-driven off real MQTT location changes (see updateFloorCount),
    // with this as a coarse fallback poll so nothing goes stale between events.
    this.loadUserCounts(this.routinesid);
    this.startLiveRefreshFallback();

    // Connect to MQTT broker
    this.connectMqtt();
  }

  // ─── User Counts API ──────────────────────────────────────────

  /**
   * Fetches GET /api/request/mustering/user-counts?requestId=&facilityId=
   * and maps the response to topSummaryCards and peopleInBuilding.
   *
   * requestId: use this.routinesid when an emergency is active,
   *            or pass empty/0 for the normal (pre-emergency) state.
   */
  // Tracks whether the summary card has ever loaded successfully — once true,
  // the 5s auto-refresh updates values in place instead of re-showing the
  // skeleton/error state, so the card no longer blinks on every poll.
  private userCountsLoadedOnce = false;

  loadUserCounts(requestId: any = '') {
    if (!this.userCountsLoadedOnce) {
      this.userCountsLoading = true;
      this.userCountsError = false;
    }

    const fId = this.facilityId || '';
    const rId = requestId || this.routinesid || '';

    this.commonService
      .getUserCounts(rId, fId, this.selectedDate)
      .subscribe({
        next: (res: any) => {
          this.userCountsLoading = false;
          if (res?.statusCode === 1 && res?.results) {
            const r = res.results;

            // Map to top 4 summary cards
            this.topSummaryCards[0].value = r.totalAssociatedTags  ?? 0;
            this.topSummaryCards[1].value = r.totalInAssemblyPoint ?? 0;
            this.topSummaryCards[2].value = (r.total ?? 0) - (r.totalInAssemblyPoint ?? 0);
            this.topSummaryCards[3].value = r.totalVisitors        ?? 0;

            // Number of People Checked In Today
            this.checkedInToday = r.total ?? 0;

            // People In Building section
            this.peopleInBuilding.total     = r.total            ?? 0;
            this.peopleInBuilding.visitors  = r.visitorsInCampus  ?? 0;
            this.peopleInBuilding.employees = r.employeesInCampus ?? 0;

            // Evacuation progress bar denominator; musteredCount (numerator) is
            // derived straight from assemblyPoints, see the getter above.
            this.totalForMuster = r.total ?? 0;

            this.userCountsError = false;
            this.userCountsLoadedOnce = true;
          } else if (!this.userCountsLoadedOnce) {
            this.userCountsError = true;
          }
        },
        error: () => {
          this.userCountsLoading = false;
          // Don't blow away already-displayed good data over a transient
          // background-refresh failure — only surface the error pre-first-load.
          if (!this.userCountsLoadedOnce) {
            this.userCountsError = true;
          }
        }
      });
  }

  // ─── MQTT ─────────────────────────────────────────────────────

  private connectMqtt() {
    if (this.client) {
      // Already connected — MQTT stays live across tab switches / refresh clicks,
      // it should not be re-subscribed each time getMustering() runs.
      return;
    }
    this.commonService.getmqttBroker().subscribe({
      next: res => {
        if (res.results?.length) {
          const brokerInfo = res.results.find((val: any) => val.brokerTypeId === 'BT-CL');
          const cloudConnect = {
            protocol: brokerInfo['wprotocol'],
            host: brokerInfo['host'],
            password: brokerInfo['password'],
            username: brokerInfo['username'],
            port: brokerInfo['wport'],
            connectTimeout: 30000,
            keepalive: 60
          };
          this.client = connect(cloudConnect);

          const topicName = 'tw/tag/location_nav/' + localStorage.getItem(btoa('facilityId')) + '/#';
          this.client.subscribe(topicName);

          const requestCacheTopic = 'tw/cache/gw/' + localStorage.getItem(btoa('facilityId')) + '/request/#';
          this.client.subscribe(requestCacheTopic);

          this.client.on('message', (topic: string, message: any) => {
            try {
              const msg = message.toString();

              if (topic.startsWith('tw/cache/gw/')) {
                this.handleRequestCacheMessage(msg);
                return;
              }

              const tagDataArr = JSON.parse('[' + msg + ']');
              const tagData = tagDataArr[0];

              if (tagData?.flr && tagData?.fid === this.facilityId) {
                const tagtype = this.classifyTagType(tagData.ttp);
                if (tagtype) {
                  const locationId = Number(tagData.lid) || null;
                  this.updateFloorCount(tagData.lid, tagData.tid, locationId, tagData.blk, tagtype);
                }
              }
            } catch (err) {
              console.error('MQTT parse error:', err);
            }
          });
        } else {
          res.message = 'mqtt ' + res.message;
          this.toastr.warning('Warning', `${res.message}`);
        }
      },
      error: error => this.showApiError(error)
    });
  }

  // ─── Tab navigation ───────────────────────────────────────────

  tabChanged(event: any) {
    this.selectedTabIndex = event.index;
    if (event.index === 0) {
      this.getMustering();
      // Tab 0's <app-live-tracking> is *ngIf-gated on selectedTabIndex (only one
      // of the Staff Mustering / Map tabs keeps a live-tracking instance — and its
      // MQTT connection / API calls — alive at a time), so it's freshly (re)created
      // on every visit, not just the first. See the index===2 branch below for why
      // the resize nudge is needed.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 2200);
    } else if (event.index === 1) {
      // Reset the date before fetching — doing it after (as before) meant the
      // date picker (bound to selectedDate) showed today while the table still
      // held whatever date had been picked before switching tabs away.
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      this.getHistory();
    } else if (event.index === 2) {
      // app-live-tracking (ThreeMapBase) sizes its canvas ~2s after creation and
      // only re-measures on a real window 'resize' event after that. Since this tab's
      // <app-live-tracking> is *ngIf-gated (destroyed/recreated on every tab switch,
      // so only one tab's live-tracking is ever active), that initial measurement can
      // land while the mat-tab switch animation/layout hasn't settled, leaving the
      // canvas at 0x0 until something dispatches a resize (e.g. opening devtools).
      // Nudge its own existing listener once, safely after its 2s init.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 2200);
    }
  }

  // ─── Map maximize/minimize ─────────────────────────────────────

  toggleMapMaximize(): void {
    this.isMapMaximized = !this.isMapMaximized;
    // The map card resizes via CSS only — nudge the (untouched) live-tracking
    // component's existing window-resize listener once the layout has settled.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  // ─── Emergency management ─────────────────────────────────────

  eventType(data: any) {
    this.typeOfEmergency = data.name;
    this.routineId = data.id;
    this.selectedActivityCategoryId = data.activityCategoryId || '';
    this.selectedIncidentLocations = [];
    this.musterComment = '';
    this.enableCard = true;
  }

  toggleInitiate() {
    const routine: any = this.routines.find((l: any) => l.id === this.routineId);
    const now = new Date();
    const formattime = this.datepipe.transform(now, 'yyyy-MM-dd HH:mm:ss');
    const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const scheduleEndTime = this.datepipe.transform(endDate, 'yyyy-MM-dd HH:mm:ss');

    const createRoutine = {
      pfActivityId: routine.id,
      type: 'RQT-TASK',
      comments: this.musterComment || null,
      requestCategory: 'PR-GN',
      isautoAssigned: false,
      isAutoComplete: false,
      title: routine.name,
      scheduleStartTime: formattime,
      scheduleEndTime: scheduleEndTime,
      scheduleActivityTypeId: 'SAT-BTM',
      priorityLevelId: routine.priorityLevelId,
      musteringLocations: this.selectedIncidentLocations
    };

    this.initiateLoading = true;
    this.commonService.saveTask(createRoutine).subscribe(res => {
      this.initiateLoading = false;
      if (res.statusCode === 1) {
        this.routinesid = res.results.requestId;
        this.enableCard = false;
        setTimeout(() => { this.hide = true; }, 400);
        setTimeout(() => { this.isInitiated = true; }, 300);

        // Bind the timer straight off the scheduleStartTime we just posted —
        // avoids a redundant follow-up GET just to look up the start time.
        this.actualTime = formattime;
        this.startEmergencyTimer(formattime as string);

        const state = {
          isInitiated: true,
          enableCard: false,
          selectedView: this.selectedView,
          typeOfEmergency: this.typeOfEmergency,
          routinesid: this.routinesid,
          hide: true,
          routines: this.routines,
          actualTime: this.actualTime,
          selectedActivityCategoryId: this.selectedActivityCategoryId,
          selectedIncidentLocations: this.selectedIncidentLocations
        };
        localStorage.setItem('musteringState', JSON.stringify(state));

        this.loadMusteringUsers(this.routinesid);
        this.loadUserCounts(this.routinesid);
      }
    }, error => {
      this.initiateLoading = false;
      this.hide = false;
      this.initiated = false;
      this.showApiError(error);
    });
  }

  completeEmergency() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Complete Emergency',
        message: 'Are you sure you want to Complete the Emergency Action?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 1,
        formStatusEnable: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] === 'Yes') {
        const data = { type: 'RQT-TASK', status: 'RQ-CO', remarks: result['comments'] || '' };
        this.commonService.updateTask(this.routinesid, data).subscribe({
          next: () => this.resetMusteringState(),
          error: error => this.showApiError(error)
        });
      }
    });
  }

  cancelEmergency() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'],
      disableClose: true,
      height: '220px',
      data: {
        title: 'Cancel Emergency',
        message: 'Are you sure you want to cancel the Emergency Action?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 0,
        formStatusEnable: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] === 'Yes') {
        const data = { type: 'RQT-TASK', status: 'RQ-CA', remarks: result['comments'] || '' };
        this.commonService.updateTask(this.routinesid, data).subscribe({
          next: () => this.resetMusteringState(),
          error: error => this.showApiError(error)
        });
      }
    });
  }

  // Clears local emergency state back to "no active emergency" — shared by
  // completeEmergency()/cancelEmergency() (after a successful updateTask) and
  // syncMusteringStatus() (when the backend already shows it closed elsewhere,
  // where we must NOT call updateTask again).
  private resetMusteringState(): void {
    this.enableCard = false;
    this.isInitiated = false;
    this.initiated = false;
    this.hide = false;
    this.selectedIncidentLocations = [];
    this.musterComment = '';
    this.routinesid = null;
    this.actualTime = null;
    this.sapData = [];
    this.stopEmergencyTimer();
    // liveRefreshFallbackInterval is left running — it also keeps the baseline
    // (no-emergency) summary cards fresh, not just the assignments table.
    localStorage.removeItem('musteringState');
    this.loadUserCounts();
  }

  // Confirms the locally-tracked active emergency (routinesid) is still actually
  // open server-side, using the same api/request/all-tasks endpoint the live map
  // uses. If it's already Completed/Cancelled (e.g. closed from another session),
  // this just resets our local state to match — no updateTask call, it's already done.
  private syncMusteringStatus(): void {
    if (!this.routinesid) return;
    this.commonService.getTasksByRequestId(this.routinesid).subscribe({
      next: (res: any) => {
        const statusId = res?.results?.[0]?.statusId;
        if (statusId === 'RQ-CA' || statusId === 'RQ-CO') {
          this.resetMusteringState();
        }
      },
      error: () => {} // Silent — a failed status check shouldn't block the page; next refresh retries.
    });
  }

  // Backend-driven fallback for when musteringState isn't in localStorage (logout/login,
  // a different browser/device, or cleared storage). Looks up any mustering task still
  // open ('RQ-CR') for this facility and, if found, restores the same state fields
  // toggleInitiate()/the localStorage path would have set, so the timer/table/3D map
  // resume exactly like the page-refresh case above does.
  private checkForActiveMustering(): void {
    this.commonService.getOpenMusteringTask(this.selectedDate).subscribe({
      next: (res: any) => {
        const task = res?.results?.[0];
        if (res?.statusCode !== 1 || !task) return;
        this.resumeFromTask(task);
      },
      error: () => {} // Silent — a missed detection just means no auto-resume; next load retries.
    });
  }

  // Shared by checkForActiveMustering() and the MQTT request-cache handler below —
  // both discover an open mustering task by a different route (polling all-tasks
  // vs. a live "create" event) but need to resume the exact same local state from it.
  private resumeFromTask(task: any): void {
    this.routinesid = task.requestId;
    this.actualTime = task.scheduleStartTime;
    this.typeOfEmergency = task.activityName || task.title || '';
    this.selectedActivityCategoryId = task.activityCategoryId || '';
    this.selectedIncidentLocations = (task.incidentLocations || task.musteringLocations || [])
      .map((loc: any) => Number(loc?.id ?? loc));
    this.isInitiated = true;
    this.hide = true;
    this.enableCard = false;

    const state = {
      isInitiated: true,
      enableCard: false,
      selectedView: this.selectedView,
      typeOfEmergency: this.typeOfEmergency,
      routinesid: this.routinesid,
      hide: true,
      routines: this.routines,
      actualTime: this.actualTime,
      selectedActivityCategoryId: this.selectedActivityCategoryId,
      selectedIncidentLocations: this.selectedIncidentLocations
    };
    localStorage.setItem('musteringState', JSON.stringify(state));

    this.startEmergencyTimer(this.actualTime);
    this.loadMusteringUsers(this.routinesid);
    this.loadUserCounts(this.routinesid);
  }

  // Live counterpart to checkForActiveMustering(): fires the instant a mustering
  // task is created/closed anywhere (this session or another), instead of waiting
  // for the next tab switch/poll. See connectMqtt() for the subscription — topic
  // tw/cache/gw/{facilityId}/request/# publishes a cache "create" event per
  // request/status change; we only care about TAC-SFE (mustering) rows.
  private handleRequestCacheMessage(raw: string): void {
    const payload = JSON.parse(raw);
    if (payload?.ctx !== 'Request') return;

    const row = payload?.data?.[0];
    if (!row || row.routineTypeId !== 'TAC-SFE') return;

    if (row.requestStatusId === 'RQ-CR') {
      // A mustering just went active (possibly from another session/device) —
      // resume it here too, same as checkForActiveMustering(), unless we're
      // already tracking one (don't clobber an in-progress local session).
      if (this.routinesid) return;
      this.commonService.getTasksByRequestId(row.requestId).subscribe({
        next: (res: any) => {
          const task = res?.results?.[0];
          if (res?.statusCode !== 1 || !task) return;
          this.resumeFromTask(task);
        },
        error: () => {}
      });
    } else if (row.requestStatusId === 'RQ-CO' || row.requestStatusId === 'RQ-CA') {
      // The mustering currently shown on screen was closed (completed/cancelled)
      // elsewhere — reflect that immediately instead of waiting for the next poll.
      if(String(row.requestId) === String(this.routinesid)){
        this.resetMusteringState();
      }
    }
  }

  // ─── Default block/floor resolution ────────────────────────────

  // Resolves the floor id to load cards for: the facility-configured
  // block/floor from mustering-config if set and present in blockList,
  // otherwise the first block's first floor (existing behavior).
  private resolveDefaultFloorId(blockList: any[]): number {
    const config = this.musteringConfig;
    if (config?.blockId != null && config?.floorId != null) {
      const block = blockList.find((b: any) => Number(b.id) === Number(config.blockId));
      const floor = block?.children?.find((f: any) => Number(f.id) === Number(config.floorId));
      if (floor) return floor.id;
    }
    return blockList[0].children[0].id;
  }

  // ─── Location hierarchy resolution ─────────────────────────────

  // Rebuilds blockLocationIds/locationParentMap from a getLogicalLocationWithChildren
  // response tree (blocks + their nested rooms/entrances/etc., any depth).
  private collectLocationHierarchy(nodes: any[]): void {
    this.blockLocationIds.clear();
    this.locationParentMap.clear();
    this.walkLocationHierarchy(nodes);
  }

  private walkLocationHierarchy(nodes: any[]): void {
    for (const node of nodes || []) {
      const id = Number(node.id);
      if (node.locationTypeId === 25) this.blockLocationIds.add(id);
      if (node.logicalParentId != null) this.locationParentMap.set(id, Number(node.logicalParentId));
      if (node.children?.length) this.walkLocationHierarchy(node.children);
    }
  }

  // A block location resolves to itself; a child (room/entrance/etc.) resolves
  // to its containing block by walking logicalParentId up the tree.
  private resolveBlockId(rawId: number): number {
    let id = rawId;
    const seen = new Set<number>();
    while (!this.blockLocationIds.has(id) && this.locationParentMap.has(id) && !seen.has(id)) {
      seen.add(id);
      id = this.locationParentMap.get(id)!;
    }
    return id;
  }

  // SAP may be configured against the raw (child) location or its resolved block —
  // match whichever one is actually present in sapLocationIds.
  private resolveSapLocationId(rawLocationId: number, resolvedBlockId: number): number | null {
    if (this.sapLocationIds.has(rawLocationId)) return rawLocationId;
    if (this.sapLocationIds.has(resolvedBlockId)) return resolvedBlockId;
    return null;
  }

  // ─── Real-time tracking ───────────────────────────────────────

  // Classifies a raw tag-type code (ttp) for the mustering dashboard counts.
  // Returns null for tag types that aren't a recognized person type — callers
  // must skip counting those entirely rather than defaulting them to employee.
  private classifyTagType(ttp: string): 'EMPLOYEE' | 'VISITOR' | null {
    if (this.EMPLOYEE_TAG_TYPES.has(ttp)) return 'EMPLOYEE';
    if (ttp === 'TAT-VS') return 'VISITOR';
    return null;
  }

  updateFloorCount(newFloorId: number, tagId: string, locationId: number, blockId: number, tagType: 'EMPLOYEE' | 'VISITOR') {
    newFloorId = Number(newFloorId);
    tagId = String(tagId);
    blockId = Number(blockId);
    locationId = locationId != null ? Number(locationId) : null;

    this.tagLastSeen.set(tagId, Date.now());

    // Block-level updates (People-In-Building cards) always use the resolved block,
    // regardless of whether the raw location reported is the block itself or a child of it.
    const resolvedBlockId = this.resolveBlockId(newFloorId);
    newFloorId = resolvedBlockId;
    const currentSapId = locationId != null ? this.resolveSapLocationId(locationId, resolvedBlockId) : null;

    const previousFloorId = this.tagFloorMap.get(tagId);
    const previousLocId = this.tagLocationMap.get(tagId);
    const previousResolvedBlockId = previousLocId != null ? this.resolveBlockId(previousLocId) : null;
    const previousSapId = previousLocId != null ? this.resolveSapLocationId(previousLocId, previousResolvedBlockId) : null;

    // Must be set before any emp/vis count below reads tagTypeMap — a tag's own
    // first-ever message adds it to floorTags/sapTags further down, and those
    // counts are computed by filtering tagTypeMap for every id in the set. Setting
    // this at the end of the function (as it used to be) meant a brand-new tag
    // wasn't classified yet by the time its own arrival was counted, so it fell
    // through to "visitor" — e.g. 10 employee tags loading fresh would show up as
    // 9 employees + 1 visitor, self-correcting only once a later message recomputed
    // the count with tagTypeMap fully populated (which is why a tab switch "fixed" it).
    this.tagTypeMap.set(tagId, tagType);

    // previousSapId !== currentSapId guards against duplicate pings for a tag
    // still sitting at the same assembly point — without it, every repeated MQTT
    // message would delete-then-re-add the tag below and spuriously re-trigger.
    if (previousSapId !== null && previousSapId !== currentSapId) {
      const prevSapSet = this.sapTags.get(previousSapId);
      if (prevSapSet?.has(tagId)) {
        prevSapSet.delete(tagId);
        const prevSapObj = this.assemblyPoints.find(s => Number(s.locationId) === previousSapId);
        if (prevSapObj) this.applySapCount(prevSapObj);
      }
    }

    if (previousFloorId) {
      if (previousFloorId !== newFloorId || currentSapId !== null) {
        const prevSet = this.floorTags.get(previousFloorId);
        if (prevSet?.has(tagId)) {
          prevSet.delete(tagId);
          const emp = Array.from(prevSet).filter(id => this.tagTypeMap.get(id) === 'EMPLOYEE').length;
          const vis = prevSet.size - emp;
          this.updateLocationCardCount(previousFloorId, emp, vis);
        }
      }
    }

    const previousBlockId = this.getBlockIdByTag(tagId);
    if (previousBlockId && previousBlockId !== blockId) {
      const prevBlockSet = this.blockTags.get(previousBlockId);
      if (prevBlockSet?.has(tagId)) prevBlockSet.delete(tagId);
      const block = this.blocks.find(b => b.id === previousBlockId);
      if (block) block.count = this.blockTags.get(previousBlockId)?.size || 0;
    }

    if (currentSapId !== null) {
      if (!this.sapTags.has(currentSapId)) this.sapTags.set(currentSapId, new Set());
      const sapSet = this.sapTags.get(currentSapId)!;
      if (!sapSet.has(tagId)) {
        sapSet.add(tagId);
        const sapObj = this.assemblyPoints.find(s => Number(s.locationId) === currentSapId);
        if (sapObj) this.applySapCount(sapObj);
      }

      const floorSet = this.floorTags.get(newFloorId);
      if (floorSet?.has(tagId)) floorSet.delete(tagId);
      const card = this.locationCardMap.get(newFloorId);
      if (card) card.count = this.floorTags.get(newFloorId)?.size || 0;

      this.tagFloorMap.delete(tagId);
      const blockSet = this.blockTags.get(blockId);
      if (blockSet?.has(tagId)) blockSet.delete(tagId);
    } else {
      if (!this.floorTags.has(newFloorId)) this.floorTags.set(newFloorId, new Set());
      this.floorTags.get(newFloorId)!.add(tagId);

      const set = this.floorTags.get(newFloorId)!;
      const emp = Array.from(set).filter(id => this.tagTypeMap.get(id) === 'EMPLOYEE').length;
      const vis = set.size - emp;
      this.updateLocationCardCount(newFloorId, emp, vis);

      if (!this.blockTags.has(blockId)) this.blockTags.set(blockId, new Set());
      this.blockTags.get(blockId)!.add(tagId);
      const block = this.blocks.find(b => b.id === blockId);
      if (block) block.count = this.blockTags.get(blockId)!.size;

      this.setBlockIdByTag(tagId, blockId);
      this.tagFloorMap.set(tagId, newFloorId);
    }

    if (locationId != null) this.tagLocationMap.set(tagId, locationId);
    this.updateDashboardCounts();

    // Single change-detection point for this whole message: a signature of
    // floorTags/sapTags set sizes (the canonical live-location state, unaffected
    // by which floor/block the user happens to be browsing in the UI). Only a
    // genuine location change — for this tag or any other — makes the signature
    // differ, so repeated MQTT pings for stationary tags never trigger a refresh,
    // no matter how often they're sent. Cheap at scale: cost is O(number of
    // floors + assembly points), not O(number of tags), so it's fine at 3000+ tags.
    let floorSig = '';
    this.floorTags.forEach((set, id) => { floorSig += id + ':' + set.size + ','; });
    let sapSig = '';
    this.sapTags.forEach((set, id) => { sapSig += id + ':' + set.size + ','; });
    const liveSignature = floorSig + '|' + sapSig;
    if (liveSignature !== this.lastLiveSignature) {
      this.lastLiveSignature = liveSignature;
      this.scheduleLiveRefresh();
      this.buildAssemblyPointBar();
    }
  }

  // Safety-events API count wins when it has data; the floor-wise/MQTT-derived
  // live count is only shown as a fallback when the API reports zero — the two
  // must never be summed, since they can both describe the same people.
  private applySapCount(sap: any): void {
    const apiCount = Number(sap.apiCount ?? sap.count ?? 0) || 0;
    sap.apiCount = apiCount;
    const liveCount = this.sapTags.get(Number(sap.locationId))?.size || 0;
    sap.count = apiCount > 0 ? apiCount : liveCount;
  }

  // Horizontal bar, one row per assembly point — same shape as Porter v2 report's
  // buildV2PerfBar (category axis of names, value axis of counts), styled to match
  // this card's green accent. Rebuilt (not mutated) each time so the echarts
  // directive's [options] binding picks up the change; called on initial
  // load/refresh and from the same signature-gated spot that drives
  // scheduleLiveRefresh(), so it updates live but not on every single MQTT tick.
  private buildAssemblyPointBar(): void {
    // Busiest assembly point on top reads better than the raw API order.
    const rows = [...this.assemblyPoints].sort((a, b) => (Number(a.count) || 0) - (Number(b.count) || 0));
    const total = this.totalForMuster;
    const notReached = Math.max(0, total - this.musteredCount);

    // "Not Yet Reached" (total people minus everyone currently at any assembly
    // point) rides the same bars/categories as a distinctly-colored extra row —
    // puts the known total headcount to use instead of only showing per-point
    // counts in isolation, and revives what the old static table's "Not Reached
    // Yet" row used to convey.
    const greenGradient = {
      type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
      colorStops: [{ offset: 0, color: '#4ADE80' }, { offset: 1, color: '#16A34A' }]
    };
    const amberGradient = {
      type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
      colorStops: [{ offset: 0, color: '#FCA5A5' }, { offset: 1, color: '#DC2626' }]
    };

    const points = rows.map(r => ({
      name: r.locationName,
      value: Number(r.count) || 0,
      itemStyle: { borderRadius: [0, 8, 8, 0], color: greenGradient, shadowColor: 'rgba(22,163,74,.25)', shadowBlur: 6 },
      label: { color: '#15803D' }
    }));
    const notReachedPoint = {
      name: 'Not Yet Reached',
      value: notReached,
      itemStyle: { borderRadius: [0, 8, 8, 0], color: amberGradient, shadowColor: 'rgba(220,38,38,.25)', shadowBlur: 6 },
      label: { color: '#B91C1C' }
    };
    // First array item renders at the BOTTOM of an echarts category axis, last
    // renders at the TOP — so "Not Yet Reached" goes first here to land as the
    // last (bottom-most) row, below all the assembly points.
    const names = [notReachedPoint.name, ...points.map(p => p.name)];
    const data = [notReachedPoint, ...points];
    const notReachedIdx = 0;

    this.assemblyPointBarOpt = {
      grid: { left: '32%', right: '14%', top: '4%', bottom: '4%', containLabel: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(22,163,74,.06)' } },
        formatter: (p: any) => {
          const row = p[0];
          if (row.dataIndex === notReachedIdx) {
            return `<b>Not Yet Reached</b><br/>${row.value} of ${total} total personnel`;
          }
          const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
          return `<b>${row.name}</b><br/>${row.value} personnel accounted for (${pct}% of total)`;
        }
      },
      xAxis: {
        type: 'value',
        // Scale the axis to the overall headcount (not just the tallest bar) so
        // every bar's length is readable as a true proportion of the total.
        max: total > 0 ? total : undefined,
        minInterval: 1,
        splitLine: { lineStyle: { color: '#EEF2F7', type: 'dashed' } },
        axisLabel: { fontSize: 10, color: '#94A3B8' }
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { width: 100, overflow: 'truncate', fontSize: 11, fontWeight: 600, color: '#334155' }
      },
      series: [{
        type: 'bar',
        data,
        barMaxWidth: 22,
        barMinHeight: 4,
        label: { show: true, position: 'right', fontSize: 12, fontWeight: 800 },
        animationDuration: 600,
        animationEasing: 'cubicOut'
      }]
    };
  }

  private updateLocationCardCount(floorId: number, empCount: number, visCount: number) {
    const card = this.locationCardMap.get(floorId);
    if (!card) return;
    card.employeeCount = empCount;
    card.visitorCount = visCount;
    card.count = empCount + visCount;
  }

  updateDashboardCounts() {
    let totalPeople = 0, employeeInCampus = 0, visitorInCampus = 0, atSAP = 0;

    this.tagLocationMap.forEach((locId, tagId) => {
      const type = this.tagTypeMap.get(tagId) ?? 'EMPLOYEE';
      totalPeople++;
      if (this.sapLocationIds.has(locId)) {
        atSAP++;
      } else if (type === 'EMPLOYEE') {
        employeeInCampus++;
      } else {
        visitorInCampus++;
      }
    });

    this.dashboardData[0].value = totalPeople;
    this.dashboardData[1].value = employeeInCampus;
    this.dashboardData[2].value = visitorInCampus;
    this.dashboardData[3].value = atSAP;

    this.employeedashboardData[0].value = totalPeople;
    this.employeedashboardData[1].value = employeeInCampus;
    this.employeedashboardData[2].value = visitorInCampus;
  }

  // ─── Floor / block navigation ─────────────────────────────────

  getLocation(floorId: any) {
    this.selectedView = 'locations';
    this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe({
      next: res => {
        if (!res?.results?.children?.length) {
          this.toastr.info('No locations under this floor.');
          return;
        }
        this.selectedFloorLocations = res.results.children.map((loc: any) => ({
          title: loc.name,
          subtitle: loc.locationTypeName || '',
          count: 0,
          countLabel: 'People',
          floorId: loc.id
        }));
        this.selectedFloorLocations.forEach(card => {
          this.locationCardMap.set(Number(card.floorId), card);
        });
      },
      error: error => this.showApiError(error)
    });
  }

  openFloorMap(floorId: number) {
    this.dialog.open(CommonDialogComponent, {
      data: { content: 'floorplan', floorId, editable: false },
      panelClass: ['medium-popup'],
      disableClose: true
    });
  }

  onBlockSelected(blockId: number) {
    this.selectedBlockId = blockId;
    this.selectedView = 'floors';
    const block = this.blocks.find(b => b.id === blockId);
    this.selectedblock = block;
    this.locationCard = [];
    this.locationCardMap.clear();
    if (block?.children) {
      this.locationCard = block.children.map((floor: any) => {
        const fId = Number(floor.id);
        return { title: floor.name, count: this.floorTags.get(fId)?.size || 0, countLabel: 'People', floorId: fId, ...floor };
      });
      this.locationCard.forEach(card => this.locationCardMap.set(card.floorId, card));
    }
  }

  back() {
    if (this.selectedView === 'locations') {
      this.selectedView = 'floors';
    } else if (this.selectedView === 'block-floors') {
      this.selectedView = 'blocks';
      this.selectedBlockId = null;
    }
  }

  onViewChange(event: string) {
    if (event === 'blocks') this.selectedblock = null;
  }

  onClearSelectedBlock(event: MouseEvent) {
    event.stopPropagation();
    this.selectedblock = null;
    this.selectedView = 'blocks';
  }

  getBlockIdByTag(tagId: string): number | null {
    return this.tagBlockMap.get(tagId) || null;
  }

  setBlockIdByTag(tagId: string, blockId: number | null) {
    if (blockId != null) this.tagBlockMap.set(tagId, blockId);
    else this.tagBlockMap.delete(tagId);
  }

  // ─── History ──────────────────────────────────────────────────

  getHistory() {
    this.configurationService.getMusteringHistory(this.selectedDate, this.pageStart, this.pageSize).subscribe({
      next: res => {
        this.tableData = res.results;
        const Columns = ['activityName', 'requestedBy', 'startTime', 'endTime', 'status', 'comments'];
        this.tableData.forEach((data: any) => {
          Columns.forEach((col, index) => { data[this.historyColumns[index]] = data[col]; });
        });
        this.pageLength = this.tableData.length;
      },
      error: error => this.showApiError(error)
    });
  }

  // ─── Mustering refresh ────────────────────────────────────────

  getMustering() {
    this.configurationService.getAllSafetyActivities('TAC-SFE').subscribe({
      next: res => { this.routines = res.results; },
      error: error => this.showApiError(error)
    });

    this.hospitalService.getsafelocation('ROU-SFE').subscribe({
      next: res => {
        this.assemblyPoints = res.results;
        this.sapLocationIds.clear();
        this.assemblyPoints.forEach((sap: any) => {
          if (sap?.locationId) {
            this.sapLocationIds.add(Number(sap.locationId));
            this.applySapCount(sap);
          }
        });
        this.buildAssemblyPointBar();
      },
      error: error => this.showApiError(error)
    });

    this.hospitalService.getBlockWithFloors().subscribe({
      next: res => {
        if (res.statusCode === 1) {
          const floorId = this.resolveDefaultFloorId(res.results);
          this.selectedFloorId = floorId;
          this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe({
            next: inner => {
              this.collectLocationHierarchy(inner.results.children);

              let temp = inner.results.children.filter((r: any) => r.locationTypeId === 25);
              this.floordetails = temp.map((floor: any) => ({ ...floor, count: 0 }));
              this.parentId = floorId;

              this.locationCard = this.floordetails.map(floor => ({
                title: floor.name,
                subtitle: 'Floor',
                count: floor.count,
                countLabel: 'People',
                floorId: Number(floor.id),
                buildingName: floor.name,
                visitorCount: 0,
                employeeCount: 0,
                parentId: Number(floorId)
              }));
              this.locationCard.forEach(card => this.locationCardMap.set(Number(card.floorId), card));

              // Re-seed counts from the current snapshot; MQTT continues to keep them live
              this.seedFloorTagCounts();
            },
            error: error => this.showApiError(error)
          });
        }
      },
      error: error => this.showApiError(error)
    });

    // Refresh user counts and the assignments table on manual refresh / tab reselect
    this.loadUserCounts(this.routinesid);
    if (this.isInitiated && this.routinesid) {
      this.loadMusteringUsers(this.routinesid);
    }

    // Confirm the active emergency (if any) hasn't already been closed elsewhere —
    // or, if nothing's tracked locally, check whether one was started from another
    // session/device/tab while the user was away from this tab. Same reconciliation
    // ngOnInit does, so switching back to this tab behaves like a fresh load.
    if (this.routinesid) {
      this.syncMusteringStatus();
    } else {
      this.checkForActiveMustering();
    }

    // MQTT connects once and stays live — no need to reconnect on every refresh
    this.connectMqtt();
  }

  // ─── Initial / refresh count seeding (totaltimebylocv2) ────────

  private seedFloorTagCounts() {
    if (!this.selectedFloorId) return;

    // One call for the actual building floor (e.g. flr=30229) — not per building card.
    const param = '?cloc=1&flr=' + this.selectedFloorId;

    this.commonService.getReportData('totaltimebylocv2', param).subscribe({
      next: (res: any) => {
        if (res?.results?.statusCode === 200 && res.results.data?.length) {
          res.results.data.forEach((item: any) => {
            const tagType = this.classifyTagType(item.tagtype);
            if (!tagType) return;
            const locationId = (Number(item.location_id) || null) as number;
            // Mirror the MQTT handler: the building-card count is keyed by location_id,
            // not the physical floor id.
            this.updateFloorCount(locationId, item.tagid, locationId, item.blockId, tagType);
          });
        }
      },
      error: error => this.showApiError(error)
    });
  }

  // ─── Mustering Assignments table (mustering-users) ─────────────

  loadMusteringUsers(requestId: any) {
    if (!requestId) return;

    this.commonService.getMusteringUsers(requestId, this.facilityId as string).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 1 && res?.results) {
          this.sapData = res.results.map((row: any) => ({
            ...row,
            performerName: row.performerName?.trim() || '-',
            sourceLocationName: row.sourceLocationName || '-',
            destinationLocationName: row.destinationLocationName || '-'
          }));
        } else {
          this.sapData = [];
        }
      },
      error: error => {
        this.sapData = [];
        this.showApiError(error);
      }
    });
  }

  // Event-driven refresh: fired once (see updateFloorCount's single signature
  // check at the end of the function) only when a tag's location genuinely
  // changed — never on repeated MQTT pings for a tag standing still.
  //
  // Throttled, not debounced: if a timer is already pending, further calls are
  // dropped instead of restarting it. With 3000+ tags live, MQTT can report many
  // genuine location changes per second — a debounce (reset-on-every-call) could
  // get pushed out indefinitely during continuous movement. This guarantees all
  // three refreshes below are hit at most once every 5s no matter how
  // continuously things change. Also refreshes the block detail panel (if open)
  // the same way, so it doesn't sit stale while the user has it open.
  private scheduleLiveRefresh(): void {
    if (this.liveRefreshTimer) return;
    this.liveRefreshTimer = setTimeout(() => {
      this.liveRefreshTimer = null;
      this.loadUserCounts(this.routinesid);
      if (this.isInitiated && this.routinesid) this.loadMusteringUsers(this.routinesid);
      if (this.selectedBlock) this.loadBlockDetails(this.selectedBlock.floorId, false);
    }, 5000);
  }

  // Coarse fallback poll (30s), independent of the event-driven path above — keeps
  // the summary cards and mustering assignments table from going stale during a
  // lull with no MQTT movement, and is a safety net for anything the event-driven
  // refresh might miss (e.g. a server-side-only change with no corresponding
  // location update, like a new tag check-in).
  // Runs for the component's whole lifetime (started once in ngOnInit), not just
  // during an active emergency, since the baseline summary cards need it too.
  private startLiveRefreshFallback(): void {
    if (this.liveRefreshFallbackInterval) return;
    this.liveRefreshFallbackInterval = setInterval(() => {
      this.loadUserCounts(this.routinesid);
      if (this.isInitiated && this.routinesid) this.loadMusteringUsers(this.routinesid);
      if (this.selectedBlock) this.loadBlockDetails(this.selectedBlock.floorId, false);
    }, 30000);
  }

  private stopLiveRefreshFallback(): void {
    if (this.liveRefreshTimer) {
      clearTimeout(this.liveRefreshTimer);
      this.liveRefreshTimer = null;
    }
    if (this.liveRefreshFallbackInterval) {
      clearInterval(this.liveRefreshFallbackInterval);
      this.liveRefreshFallbackInterval = null;
    }
  }

  // ─── Header / filter events ───────────────────────────────────

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') this.applyfilter(event.data);
    if (event.key === 'refreshPage') this.getHistory();
    if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getHistory();
    }
  }

  applyfilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }

  eventAction(event: any) {
    if (event.key === 'Name') {
      this.dialog.open(AiStMustComponent, {
        data: { requestId: event.data.requestId },
        panelClass: ['medium-popup'],
        disableClose: true
      });
    }
  }

  rowClick(event: any) {
    console.log(event);
  }

  // ─── Timer ────────────────────────────────────────────────────

  startEmergencyTimer(actualTime: string) {
    this.stopEmergencyTimer();
    this.startTime = new Date(actualTime.replace(' ', 'T')).getTime();
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const h = Math.floor(elapsed / (1000 * 60 * 60));
      const m = Math.floor((elapsed / (1000 * 60)) % 60);
      const s = Math.floor((elapsed / 1000) % 60);
      this.emergencyDuration = `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
    }, 1000);
  }

  stopEmergencyTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pad(num: number) {
    return num < 10 ? '0' + num : num;
  }

  // ─── Block detail panel ───────────────────────────────────────

  selectLocationBlock(b: any): void {
    if (this.selectedBlock?.floorId === b.floorId) {
      this.selectedBlock = null;
      return;
    }
    this.selectedBlock = b;
    this.blockDetailTab = 'employees';
    this.blockDetails = { employees: [], visitors: [], total: 0, employeeCount: 0, visitorCount: 0 };
    this.loadBlockDetails(b.floorId);
  }

  // Fetches the block detail panel's employee/visitor lists. showLoading is false
  // for the background refreshes fired alongside loadUserCounts/loadMusteringUsers
  // (see scheduleLiveRefresh()/startLiveRefreshFallback()) so the open panel
  // updates in place instead of flashing back to its loading/empty state every
  // refresh cycle while the user is looking at it.
  private loadBlockDetails(floorId: number, showLoading = true): void {
    if (showLoading) this.blockDetailLoading = true;

    this.commonService.getCurrentActiveUsers(this.facilityId, floorId).subscribe({
      next: (res: any) => {
        this.blockDetailLoading = false;
        if (res?.statusCode === 1 && res?.results) {
          const r = res.results;
          const mapPerson = (u: any) => ({
            name: u.name,
            lastLocation: u.locationName,
            updatedAt: this.formatLastSeen(u.lastSeen)
          });
          const locations: any[] = r.userLocations || [];
          this.blockDetails = {
            employees: locations.filter(u => this.classifyTagType(u.tagType) === 'EMPLOYEE').map(mapPerson),
            visitors: locations.filter(u => this.classifyTagType(u.tagType) === 'VISITOR').map(mapPerson),
            total: r.total ?? 0,
            employeeCount: r.employees ?? 0,
            visitorCount: r.visitors ?? 0
          };
        }
      },
      error: error => {
        this.blockDetailLoading = false;
        // Background refreshes stay silent — don't toast-spam an open panel every
        // cycle over a transient failure; the initial open (showLoading) still does.
        if (showLoading) this.showApiError(error);
      }
    });
  }

  closeBlockPanel(): void {
    this.selectedBlock = null;
  }

  // Earthquake affects the whole facility, so every location card is flagged;
  // Fire is localized, so only the card(s) picked as incident location(s) are flagged.
  isIncidentLocation(b: any): boolean {
    if (!this.isInitiated) return false;
    if (this.selectedActivityCategoryId === 'AC-EARTHQUAKE' || this.selectedActivityCategoryId === 'AC-EAQU') {
      return true;
    }
    if (this.selectedActivityCategoryId === 'AC-FIRE') {
      return this.selectedIncidentLocations?.includes(b.floorId);
    }
    return false;
  }

  formatLastSeen(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  ngOnDestroy() {
    if (this.client) {
      this.client.end(true, () => {});
    }
    this.stopEmergencyTimer();
    this.stopLiveRefreshFallback();
    const state = {
      isInitiated: this.isInitiated,
      enableCard: this.enableCard,
      selectedView: this.selectedView,
      typeOfEmergency: this.typeOfEmergency,
      hide: this.hide,
      routinesid: this.routinesid,
      routines: this.routines,
      actualTime: this.actualTime,
      selectedActivityCategoryId: this.selectedActivityCategoryId,
      selectedIncidentLocations: this.selectedIncidentLocations
    };
    localStorage.setItem('musteringState', JSON.stringify(state));
  }
}