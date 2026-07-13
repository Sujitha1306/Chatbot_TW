import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../../shared';
import { MqttClient, connect } from 'mqtt';
import { CommonDialogComponent } from '../../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { MusteringHistoryV2Component } from './mustering-history-v2/mustering-history-v2.component';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-staff-mustering-v2',
  templateUrl: './staff-mustering-v2.component.html',
  styleUrls: ['./staff-mustering-v2.component.scss']
})
export class StaffMusteringV2Component {

  // ─── UI state ─────────────────────────────────────────────────
  selectedTabIndex: number;
  hide = false;
  enableCard = false;
  isInitiated = false;
  initiated = false;
  typeOfEmergency: string;
  statusText = 'Active';
  selectedView = 'floors';
  emergencyDuration = '00:00:00';

  selectedIncidentLocations: string[] = [];
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
  floorData: any = null;
  actualTime: any;

  // ─── Real-time tag tracking maps ──────────────────────────────
  private client: MqttClient;
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

  // ─── Table column config ──────────────────────────────────────
  displayColumns = ['Name', 'From Location', 'Assembly Point', 'Mustering Duration'];
  sapColumns = ['fullName', 'srcLocationName', 'locationName', 'scheduleTime'];
  historyColumns = ['Name', 'Requested By', 'Start Time', 'End Time', 'Status'];
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
  private startTime!: number;
  selectedFloorId: number;

  constructor(
    public dialog: MatDialog,
    public commonService: CommonService,
    public toastr: AppToastService,
    public hospitalService: HospitalService,
    public configurationService: ConfigurationService,
    public datepipe: DatePipe,
    public worflowService: WorkflowService
  ) {}

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
    }

    // Load emergency activity types
    this.configurationService.getAllSafetyActivities('TAC-SFE').subscribe(res => {
      this.routines = res.results;
    });

    // Load safe assembly points
    this.hospitalService.getsafelocation('ROU-SFE').subscribe(res => {
      this.assemblyPoints = res.results;
      this.sapLocationIds.clear();
      res.results.forEach((sap: any) => {
        if (sap?.locationId) {
          this.sapLocationIds.add(Number(sap.locationId));
        }
      });
    });

    // Load building / floor hierarchy
    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if (res.statusCode === 1) {
        const block = res.results[0];
        const floorId = block.children[0].id;
        this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(inner => {
          let temp = inner.results.children;
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
        });
      }
    });

    // Load active mustering performer data (if emergency already running)
    const id = this.routines?.[0]?.activityCategoryId;
    const now = new Date();
    const formatdate = this.datepipe.transform(now, 'yyyy-MM-dd');
    this.configurationService.getMusteringActivities(id, formatdate, this.pageSize, this.pageStart, 'RQT-TASK').subscribe(res => {
      if (res?.results?.length > 0) {
        this.sapData = res.results.flatMap((r: any) => r.performer) ?? [];
        this.actualTime = res.results[0].actualTime;
        this.startEmergencyTimer(res.results[0].actualTime);
      }
    });

    // Load top summary cards from user-counts API
    this.loadUserCounts();

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
  loadUserCounts(requestId: any = '') {
    this.userCountsLoading = true;
    this.userCountsError = false;

    const fId = this.facilityId || '';
    const rId = requestId || this.routinesid || '';

    this.commonService
      .getUserCounts(rId, fId)  // <-- wire up in your CommonService / HttpClient wrapper
      .subscribe({
        next: (res: any) => {
          this.userCountsLoading = false;
          if (res?.statusCode === 1 && res?.results) {
            const r = res.results;

            // Map to top 4 summary cards
            this.topSummaryCards[0].value = r.total          ?? 0;
            this.topSummaryCards[1].value = r.assemblyPoint  ?? 0;
            this.topSummaryCards[2].value = r.notInDestination ?? 0;
            this.topSummaryCards[3].value = r.visitors        ?? 0;

            // People In Building section
            this.peopleInBuilding.total     = r.total     ?? 0;
            this.peopleInBuilding.visitors  = r.visitors  ?? 0;
            this.peopleInBuilding.employees = r.employees ?? 0;
          } else {
            this.userCountsError = true;
          }
        },
        error: () => {
          this.userCountsLoading = false;
          this.userCountsError = true;
        }
      });
  }

  // ─── MQTT ─────────────────────────────────────────────────────

  private connectMqtt() {
    this.commonService.getmqttBroker().subscribe(res => {
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

        this.client.on('message', (_topic: any, message: any) => {
          try {
            const msg = message.toString();
            const tagDataArr = JSON.parse('[' + msg + ']');
            const tagData = tagDataArr[0];

            if (tagData?.flr && tagData?.fid === this.facilityId) {
              const locationId = Number(tagData.lid) || null;
              const tagtype = tagData.ttp === 'TAT-ST' ? 'EMPLOYEE' : 'VISITOR';
              this.updateFloorCount(tagData.lid, tagData.tid, locationId, tagData.blk, tagtype);
            }
          } catch (err) {
            console.error('MQTT parse error:', err);
          }
        });
      } else {
        res.message = 'mqtt ' + res.message;
        this.toastr.warning('Warning', `${res.message}`);
      }
    });
  }

  // ─── Tab navigation ───────────────────────────────────────────

  tabChanged(event: any) {
    if (event.index === 0) {
      this.getMustering();
    } else if (event.index === 1) {
      this.getHistory();
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    } else if (event.index === 2) {
      this.floorData = {
        content: 'floorplan',
        floorId: this.parentId,
        editable: false,
        header: false
      };
    }
  }

  // ─── Emergency management ─────────────────────────────────────

  eventType(data: any) {
    this.typeOfEmergency = data.name;
    this.routineId = data.id;
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

    this.commonService.saveTask(createRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.routinesid = res.results.requestId;
        this.enableCard = false;
        setTimeout(() => { this.hide = true; }, 400);
        setTimeout(() => { this.isInitiated = true; }, 300);

        const state = {
          isInitiated: true,
          enableCard: false,
          selectedView: this.selectedView,
          typeOfEmergency: this.typeOfEmergency,
          routinesid: this.routinesid,
          hide: true,
          routines: this.routines
        };
        localStorage.setItem('musteringState', JSON.stringify(state));

        const catId = this.routines[0].activityCategoryId;
        const nowDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
        this.configurationService.getMusteringActivities(catId, nowDate, this.pageSize, this.pageStart, 'RQT-TASK').subscribe(inner => {
          if (inner.results) {
            this.sapData = inner.results.flatMap((r: any) => r.performer) ?? [];
            this.actualTime = inner.results[0].actualTime;
            this.startEmergencyTimer(inner.results[0].actualTime);
          }
        });

        this.loadUserCounts(this.routinesid);
      }
    }, error => {
      this.hide = false;
      this.initiated = false;
      this.toastr.error('Error', `${error.error.message}`);
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
        const data = { type: 'RQT-TASK', status: 'RQ-CO', remarks: '' };
        this.commonService.updateTask(this.routinesid, data).subscribe(() => {
          this.enableCard = false;
          this.isInitiated = false;
          this.initiated = false;
          this.hide = false;
          this.selectedIncidentLocations = [];
          this.musterComment = '';
          this.stopEmergencyTimer();
          localStorage.removeItem('musteringState');
          this.loadUserCounts(); // reset counts
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
        const data = { type: 'RQT-TASK', status: 'RQ-CA', remarks: '' };
        this.commonService.updateTask(this.routinesid, data).subscribe(() => {
          this.enableCard = false;
          this.isInitiated = false;
          this.initiated = false;
          this.hide = false;
          this.selectedIncidentLocations = [];
          this.musterComment = '';
          this.stopEmergencyTimer();
          localStorage.removeItem('musteringState');
          this.loadUserCounts(); // reset counts
        });
      }
    });
  }

  // ─── Real-time tracking ───────────────────────────────────────

  updateFloorCount(newFloorId: number, tagId: string, locationId: number, blockId: number, tagType: 'EMPLOYEE' | 'VISITOR') {
    newFloorId = Number(newFloorId);
    tagId = String(tagId);
    blockId = Number(blockId);

    this.tagLastSeen.set(tagId, Date.now());

    const previousFloorId = this.tagFloorMap.get(tagId);
    const previousLocId = this.tagLocationMap.get(tagId);

    if (previousLocId && this.sapLocationIds.has(previousLocId)) {
      const prevSapSet = this.sapTags.get(previousLocId);
      if (prevSapSet?.has(tagId)) {
        prevSapSet.delete(tagId);
        const prevSapObj = this.assemblyPoints.find(s => Number(s.locationId) === previousLocId);
        if (prevSapObj && prevSapObj.count > 0) prevSapObj.count--;
      }
    }

    if (previousFloorId) {
      if (previousFloorId !== newFloorId || (locationId && this.sapLocationIds.has(locationId))) {
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

    if (locationId && this.sapLocationIds.has(locationId)) {
      if (!this.sapTags.has(locationId)) this.sapTags.set(locationId, new Set());
      const sapSet = this.sapTags.get(locationId)!;
      if (!sapSet.has(tagId)) {
        sapSet.add(tagId);
        const sapObj = this.assemblyPoints.find(s => Number(s.locationId) === locationId);
        if (sapObj) sapObj.count = (sapObj.count || 0) + 1;
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

    if (locationId) this.tagLocationMap.set(tagId, locationId);
    this.tagTypeMap.set(tagId, tagType);
    this.updateDashboardCounts();
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
    this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(res => {
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
    this.configurationService.getMusteringHistory(this.selectedDate, this.pageStart, this.pageSize).subscribe(res => {
      this.tableData = res.results;
      const Columns = ['activityName', 'requestedBy', 'startTime', 'endTime', 'status'];
      this.tableData.forEach((data: any) => {
        Columns.forEach((col, index) => { data[this.historyColumns[index]] = data[col]; });
      });
      this.pageLength = this.tableData.length;
    });
  }

  // ─── Mustering refresh ────────────────────────────────────────

  getMustering() {
    this.configurationService.getAllSafetyActivities('TAC-SFE').subscribe(res => {
      this.routines = res.results;
    });

    this.hospitalService.getsafelocation('ROU-SFE').subscribe(res => {
      this.assemblyPoints = res.results;
      this.sapLocationIds.clear();
      res.results.forEach((sap: any) => {
        if (sap?.locationId) this.sapLocationIds.add(Number(sap.locationId));
      });
    });

    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if (res.statusCode === 1) {
        const block = res.results[0];
        const floorId = block.children[0].id;
        this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(inner => {
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
        });
      }
    });

    // Refresh user counts on manual refresh
    this.loadUserCounts(this.routinesid);

    this.connectMqtt();
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
      this.dialog.open(MusteringHistoryV2Component, {
        data: event.data,
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

  // ─── Lifecycle ────────────────────────────────────────────────

  ngOnDestroy() {
    if (this.client) {
      this.client.end(true, () => {});
    }
    this.stopEmergencyTimer();
    const state = {
      isInitiated: this.isInitiated,
      enableCard: this.enableCard,
      selectedView: this.selectedView,
      typeOfEmergency: this.typeOfEmergency,
      hide: this.hide,
      routinesid: this.routinesid,
      routines: this.routines
    };
    localStorage.setItem('musteringState', JSON.stringify(state));
  }
}