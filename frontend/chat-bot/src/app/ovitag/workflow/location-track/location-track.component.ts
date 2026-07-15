import { Component, OnDestroy, ViewChild, AfterViewInit, Input, ChangeDetectorRef, DoCheck } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuTrigger } from '@angular/material/menu';
import { routerTransition } from '../../../router.animations';
import { CommonService, HospitalService } from '../../../shared';
import { LookupTermService } from '../../../shared/lookup-term.service';
import { forkJoin } from 'rxjs';
import { MqttService, IMqttMessage } from '../../../shared/modules/entry-component/three-map/services/mqtt.service';

@Component({
  selector: 'app-location-track',
  templateUrl: './location-track.component.html',
  styleUrls: ['./location-track.component.scss'],
  animations: [routerTransition()]
})
export class LocationTrackComponent implements OnDestroy, AfterViewInit, DoCheck {

public isCardtoggle = true;
public displayColumns: string[] = ['Location Name', 'Name', 'Tag Type', 'Role Name' ,'Last Seen'];
public responseColumns: string[] = ['locationName', 'tagAssociatedName', 'typeOfUser', 'roleOfUser','lastSeen'];
public sortColumns = ['locationName', 'tagAssociatedName', 'typeOfUser', 'roleOfUser', 'lastSeen'];
public iconColumns = ['tagAssociatedName'];
public dateTimeColumns = ['lastSeen']
public pageSizeOptions = [10, 30, 50, 100, 300, 500,1000,3000,5000,10000];

get currentPageSizeOptions() {
  if (this.viewMode === 'card') {
    return [30, 60, 90, 150, 300, 450, 600, 900, 1200];
  }
  return this.pageSizeOptions;
}
public tagAssociationTypeMap: Record<string, string> = {};
public roleMap: Record<string, string> = {};
public locCategoryCodeToName: Record<string, string> = {};
public dataSource = new MatTableDataSource<any>([]);
public loading = false;
public isRefreshing = false;
public locationList: string[] = [];
public selectedLocations: string[] = [];
public tempSelectedLocations: string[] = [];
public locSearchTerm = '';
public blockSearchTerm = '';
public floorSearchTerm = '';
public tagTypeSearchTerm = '';
public locShowAll = false;
public selectedBlockId: number | string | null = null;
public blockList: any[] = [];
public floorList: any[] = [];
public selectedFloorId: number | string | null = null;
public tempSelectedBlockId: number | string | null = null;
public tempSelectedFloorId: number | string | null = null;
public tempFloorList: any[] = [];
public searchText = '';
public userPreferenceKey = 'locationTrackPrefs';
public showCardsRow = true;
public isInitialLoad = true;
public allFloorTags: any[] = [];
public mqttVirtualTable: any[] = [];
public tagTypes: string[] = [];
public selectedTagTypes: string[] = [];
public tempSelectedTagTypes: string[] = [];
  public mqttSubscriptions: any[] = [];
  public subscribedFacilityId: string | null = null;
  public hasLoadedOnce = false;
  public cacheDataNull = false;
  public isMqttConnected = false;
  public skipMqttRequest = false;
  public pageSize = 50;
  public lastUpdatedTime: Date = new Date();
  public autoSlideInterval: any = null;
  public viewMode: 'list' | 'card' = 'list';
  public recentlyUpdatedTags = new Set<string>();
  private _sort: MatSort;
  private _paginator: MatPaginator;

@ViewChild(MatSort) set sort(value: MatSort) {
  this._sort = value;
  if (value) this.dataSource.sort = value;
}

@ViewChild(MatPaginator) set paginator(value: MatPaginator) {
  this._paginator = value;
  if (value) {
    this.dataSource.paginator = value;
    if (this.pageSize) {
      value.pageSize = this.pageSize;
    }
    setTimeout(() => {
      this.syncPaginatorLength();
    });
  }
}

@ViewChild('filterTrigger', { read: MatMenuTrigger }) filterMenuTrigger: MatMenuTrigger;

get sort() { return this._sort; }
get paginator() { return this._paginator; }

get tableData() { return this.dataSource.data; }
set tableData(val) {
  this.dataSource.data = val;
  this.lastUpdatedTime = new Date();
  this.syncPaginatorLength();
}

trackByTag(index: number, item: any): string {
  return item?.raw?.tagid || item?.raw?.tid || item?.tagAssociatedName || String(index);
}

get selectedBlockName() {
  if (String(this.selectedBlockId) === 'All') {
    return 'All';
  }
  const block = this.blockList.find(b => String(b.id) === String(this.selectedBlockId));
  return block ? block.name : '';
}

get selectedFloorName() {
  if (String(this.selectedFloorId) === 'All') {
    return 'All';
  }
  const floor = this.floorList.find(f => String(f.id) === String(this.selectedFloorId));
  return floor ? floor.name : '';
}

get selectedLocationName() {
  if (!this.selectedLocations.length || !this.locationList.length || this.selectedLocations.length === this.locationList.length) {
    return 'All';
  }
  return this.selectedLocations.join(', ');
}

get typeCounts() {
  const data = this.dataSource?.filteredData || [];
  const counts: Record<string, number> = {};
  
  this.tagTypes.forEach(t => {
    counts[t] = 0;
  });

  for (const item of data) {
    const type = item[this.responseColumns[2]];
    if (type) {
      counts[type] = (counts[type] || 0) + 1;
    }
  }

  const result = [{ label: 'Total', count: data.length }];
  this.tagTypes.forEach(t => {
    result.push({ label: t, count: counts[t] || 0 });
  });

  // Also include any other active types in data not present in tagTypes
  Object.keys(counts).forEach(key => {
    if (!this.tagTypes.includes(key) && key !== 'Total') {
      result.push({ label: key, count: counts[key] });
    }
  });

  return result;
}

get isTableEmpty() {
  return !this.dataSource || !this.dataSource.filteredData || this.dataSource.filteredData.length === 0;
}

get filteredLocations() {
  if (!this.locSearchTerm) return this.locationList;
  const term = this.locSearchTerm.toLowerCase();
  return this.locationList.filter(locName =>
    locName.toLowerCase().includes(term)
  );
}

get displayedLocations() {
  const sorted = [...this.filteredLocations].sort((a, b) => {
    const aSelected = this.tempSelectedLocations.includes(a);
    const bSelected = this.tempSelectedLocations.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });
  if (this.locSearchTerm) return sorted;
  return this.locShowAll ? sorted : sorted.slice(0, 15);
}

get hiddenLocCount() {
  return Math.max(0, this.filteredLocations.length - 15);
}

get filteredBlocks() {
  if (!this.blockSearchTerm) return this.blockList;
  const term = this.blockSearchTerm.toLowerCase();
  return this.blockList.filter(b => b.name?.toLowerCase().includes(term));
}

get filteredFloors() {
  const floors = this.tempFloorList.slice(1);
  if (!this.floorSearchTerm) return floors;
  const term = this.floorSearchTerm.toLowerCase();
  return floors.filter(f => f.name?.toLowerCase().includes(term));
}

get filteredTagTypes() {
  let list = this.tagTypes;
  if (this.tagTypeSearchTerm) {
    const term = this.tagTypeSearchTerm.toLowerCase();
    list = this.tagTypes.filter(t => t.toLowerCase().includes(term));
  }
  return [...list].sort((a, b) => {
    const aSelected = this.tempSelectedTagTypes.includes(a);
    const bSelected = this.tempSelectedTagTypes.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });
}

get isFilterActive() {
  return (String(this.selectedFloorId) !== 'All' && this.selectedLocations.length < this.locationList.length) ||
         this.selectedTagTypes.length < this.tagTypes.length;
}

get selectedLocNames() {
  return this.selectedLocations;
}

get activeFilterSummary() {
  const parts: string[] = [];
  if (String(this.selectedFloorId) !== 'All' && this.selectedLocations.length < this.locationList.length) {
    parts.push(`${this.selectedLocations.length} Locations`);
  }
  if (this.selectedTagTypes.length < this.tagTypes.length) {
    parts.push(`${this.selectedTagTypes.length} TagTypes`);
  }
  return parts.join(' · ') || '';
}

constructor(
  public commonService: CommonService,
  public hospitalService: HospitalService,
  public lookupTermService: LookupTermService,
  private readonly mqttService: MqttService,
  private readonly cdr: ChangeDetectorRef
) {
  const roleId = localStorage.getItem('userlevel');
  const userId = localStorage.getItem(btoa('userId'));

  const localPrefsStr = localStorage.getItem(this.userPreferenceKey);
  let localPrefsRestored = false;
  if (localPrefsStr) {
    try {
      const localPrefs = JSON.parse(localPrefsStr);
      const facilityId = localStorage.getItem(btoa('facilityId'));
      if (localPrefs && localPrefs.facilityId === facilityId) {
        this.applyPrefs(localPrefs);
        localPrefsRestored = true;
      }
    } catch {}
  }

  if (localPrefsRestored) {
    this.loadInitialData();
  } else if (userId && roleId) {
    if (this.commonService.userPreference) {
      this.restoreUserPreferences(this.commonService.userPreference);
      this.loadInitialData();
    } else {
      this.loading = true;
      this.commonService.getPreference(userId, roleId).subscribe({
        next: (res) => {
          if (res.results) {
            this.commonService.userPreference = res.results;
            this.restoreUserPreferences(res.results);
          }
          this.loadInitialData();
        },
        error: () => {
          this.loadInitialData();
        }
      });
    }
  } else {
    this.loadInitialData();
  }
}

ngAfterViewInit() {
  this.dataSource.filterPredicate = this.createFilterPredicate();
  this.startAutoSlide();
}

ngDoCheck() {
  if (this.commonService.contextChanged === true) {
    this.hasLoadedOnce = false;
    this.selectedBlockId = 'All';
    this.selectedFloorId = 'All';
    this.selectedLocations = [];
    this.tableData = [];
    this.allFloorTags = [];
    this.mqttVirtualTable = [];
    this.loadInitialData();
    this.commonService.contextChanged = false;
  }
}

ngOnDestroy() {
  this.mqttSubscriptions.forEach(sub => sub.unsubscribe());
  this.mqttSubscriptions = [];
  this.stopAutoSlide();
}

isSortable(colName) {
  return this.sortColumns.includes(colName);
}

hasIcon(colName) {
  return this.iconColumns.includes(colName);
}

isDateTimeColumn(colName) {
  return this.dateTimeColumns.includes(colName);
}

getTypeIndex(type) {
  return this.typeCounts.findIndex(c => c.label === type);
}

trackByLabel(_index, item) {
  return item.label;
}

tagTypeMatIcon(label) {
  const map: Record<string, string> = {
    Patient: 'personal_injury',
    Asset: 'medical_services',
    MedicalRecord: 'assignment',
    'Medical Record': 'assignment',
    User: 'person_pin',
    Infant: 'child_friendly',             /* Baby stroller/carriage icon */
    Wheelchair: 'accessible',
    'Asset Utilization': 'insights',
    AssetUtilization: 'insights',
    'Care Provider': 'health_and_safety', /* Medical safety shield */
    CareProvider: 'health_and_safety',
    Consumer: 'person',                   /* Direct client silhouette */
    Employee: 'badge',                    /* Staff badge ID card */
    'Temporary Id Card': 'assignment_ind',/* Temp holder info badge */
    TemporaryIdCard: 'assignment_ind',
    porter: 'transfer_within_a_station',
    Porter: 'transfer_within_a_station',
    'Raw Customer': 'person_outline',     /* Outline silhouette for unregistered client */
    RawCustomer: 'person_outline',
    Staff: 'groups',
    Visitor: 'meeting_room',
    Total: 'bar_chart'                    /* Stats report bar chart */
  };
  return map[label] || 'help_outline';
}

tagTypeBadgeClass(label) {
  const map: Record<string, string> = {
    Patient: 'lt-badge--patient',
    Asset: 'lt-badge--asset',
    MedicalRecord: 'lt-badge--mr',
    'Medical Record': 'lt-badge--mr',
    User: 'lt-badge--user',
    Infant: 'lt-badge--infant',
    Wheelchair: 'lt-badge--wheelchair',
    'Asset Utilization': 'lt-badge--asset-util',
    AssetUtilization: 'lt-badge--asset-util',
    'Care Provider': 'lt-badge--care-provider',
    CareProvider: 'lt-badge--care-provider',
    Consumer: 'lt-badge--consumer',
    Employee: 'lt-badge--employee',
    'Temporary Id Card': 'lt-badge--temp-id',
    TemporaryIdCard: 'lt-badge--temp-id',
    porter: 'lt-badge--porter',
    Porter: 'lt-badge--porter',
    'Raw Customer': 'lt-badge--raw-customer',
    RawCustomer: 'lt-badge--raw-customer',
    Staff: 'lt-badge--staff',
    Visitor: 'lt-badge--visitor'
  };
  return map[label] || 'lt-badge--default';
}

tagTypeCardClass(label) {
  const map: Record<string, string> = {
    Patient: 'lt-card--patient',
    Asset: 'lt-card--asset',
    MedicalRecord: 'lt-card--mr',
    'Medical Record': 'lt-card--mr',
    User: 'lt-card--user',
    Infant: 'lt-card--infant',
    Wheelchair: 'lt-card--wheelchair',
    'Asset Utilization': 'lt-card--asset-util',
    AssetUtilization: 'lt-card--asset-util',
    'Care Provider': 'lt-card--care-provider',
    CareProvider: 'lt-card--care-provider',
    Consumer: 'lt-card--consumer',
    Employee: 'lt-card--employee',
    'Temporary Id Card': 'lt-card--temp-id',
    TemporaryIdCard: 'lt-card--temp-id',
    porter: 'lt-card--porter',
    Porter: 'lt-card--porter',
    'Raw Customer': 'lt-card--raw-customer',
    RawCustomer: 'lt-card--raw-customer',
    Staff: 'lt-card--staff',
    Visitor: 'lt-card--visitor'
  };
  return map[label] || 'lt-card--default';
}

tagTypeIconClass(label) {
  const map: Record<string, string> = {
    Patient: 'lt-tagicon--patient',
    Asset: 'lt-tagicon--asset',
    MedicalRecord: 'lt-tagicon--mr',
    'Medical Record': 'lt-tagicon--mr',
    User: 'lt-tagicon--user',
    Infant: 'lt-tagicon--infant',
    Wheelchair: 'lt-tagicon--wheelchair',
    'Asset Utilization': 'lt-tagicon--asset-util',
    AssetUtilization: 'lt-tagicon--asset-util',
    'Care Provider': 'lt-tagicon--care-provider',
    CareProvider: 'lt-tagicon--care-provider',
    Consumer: 'lt-tagicon--consumer',
    Employee: 'lt-tagicon--employee',
    'Temporary Id Card': 'lt-tagicon--temp-id',
    TemporaryIdCard: 'lt-tagicon--temp-id',
    porter: 'lt-tagicon--porter',
    Porter: 'lt-tagicon--porter',
    'Raw Customer': 'lt-tagicon--raw-customer',
    RawCustomer: 'lt-tagicon--raw-customer',
    Staff: 'lt-tagicon--staff',
    Visitor: 'lt-tagicon--visitor'
  };
  return map[label] || 'lt-tagicon--default';
}

private colorMap: Record<string, { bg: string; border: string; text: string }> = {
  Patient: { bg: '#fff1f2', border: '#fecdd3', text: '#fb7185' },
  Asset: { bg: '#f0f9ff', border: '#bae6fd', text: '#38bdf8' },
  MedicalRecord: { bg: '#faf5ff', border: '#e9d5ff', text: '#c084fc' },
  'Medical Record': { bg: '#faf5ff', border: '#e9d5ff', text: '#c084fc' },
  User: { bg: '#ecfeff', border: '#c5f6fa', text: '#22d3ee' },
  Infant: { bg: '#ecfdf5', border: '#a7f3d0', text: '#34d399' },
  Wheelchair: { bg: '#f8fafc', border: '#cbd5e1', text: '#94a3b8' },
  'Asset Utilization': { bg: '#eef2ff', border: '#c7d2fe', text: '#818cf8' },
  AssetUtilization: { bg: '#eef2ff', border: '#c7d2fe', text: '#818cf8' },
  'Care Provider': { bg: '#ecfeff', border: '#a5f3fc', text: '#22d3ee' },
  CareProvider: { bg: '#ecfeff', border: '#a5f3fc', text: '#22d3ee' },
  Consumer: { bg: '#fafaf9', border: '#e7e5e4', text: '#a8a29e' },
  Employee: { bg: '#eff6ff', border: '#bfdbfe', text: '#60a5fa' },
  'Temporary Id Card': { bg: '#fffbeb', border: '#fef3c7', text: '#fbbf24' },
  TemporaryIdCard: { bg: '#fffbeb', border: '#fef3c7', text: '#fbbf24' },
  porter: { bg: '#fef2f2', border: '#fecaca', text: '#f87171' },
  Porter: { bg: '#fef2f2', border: '#fecaca', text: '#f87171' },
  'Raw Customer': { bg: '#f0fdfa', border: '#ccfbf1', text: '#2dd4bf' },
  RawCustomer: { bg: '#f0fdfa', border: '#ccfbf1', text: '#2dd4bf' },
  Staff: { bg: '#fdf4ff', border: '#f5d0fe', text: '#e879f9' },
  Visitor: { bg: '#fff7ed', border: '#ffedd5', text: '#fb923c' },
  Total: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' }
};

getCardBgColor(index, label) {
  return this.colorMap[label]?.bg || '#f8fafc';
}

getCardBorderColor(index, label) {
  return this.colorMap[label]?.border || '#e2e8f0';
}

getCardTextColor(index, label) {
  return this.colorMap[label]?.text || '#64748b';
}

getCardLabelColor(index, label) {
  return this.colorMap[label]?.text || '#64748b';
}

private restoreUserPreferences(preference) {
  if (preference && preference.hasOwnProperty('locationTrackPrefs')) {
    try {
      const prefs = JSON.parse(preference.locationTrackPrefs.value);
      if (prefs) {
        this.applyPrefs(prefs);
      }
    } catch { }
  }
}

private applyPrefs(prefs) {
  const facilityId = localStorage.getItem(btoa('facilityId'));
  if (prefs.facilityId !== facilityId) {
    this.commonService.validateUserPreference('locationTrackPrefs', JSON.stringify(null));
    localStorage.removeItem(this.userPreferenceKey);
    return;
  }
  this.selectedBlockId = prefs.blockId !== undefined ? prefs.blockId : (prefs.blockIds && prefs.blockIds.length ? prefs.blockIds[0] : 'All');
  this.selectedFloorId = prefs.floorId !== undefined ? prefs.floorId : (prefs.floorIds && prefs.floorIds.length ? prefs.floorIds[0] : 'All');
  this.searchText = prefs.searchText || '';
  this.selectedLocations = prefs.selectedLocations || [];
  this.selectedTagTypes = prefs.selectedTagTypes || [];
  this.showCardsRow = prefs.hasOwnProperty('showCardsRow') ? prefs.showCardsRow : true;
  this.viewMode = prefs.viewMode || 'list';
  if (prefs.pageSize) {
    this.pageSize = prefs.pageSize;
  }
}

private saveUserPreferences() {
  const roleId = localStorage.getItem('userlevel');
  const userId = localStorage.getItem(btoa('userId'));
  const facilityId = localStorage.getItem(btoa('facilityId'));
  const prefs = {
    facilityId,
    blockId: this.selectedBlockId,
    floorId: this.selectedFloorId,
    searchText: this.searchText,
    selectedLocations: this.selectedLocations,
    selectedTagTypes: this.selectedTagTypes,
    showCardsRow: this.showCardsRow,
    viewMode: this.viewMode,
    pageSize: this.pageSize
  };

  localStorage.setItem(this.userPreferenceKey, JSON.stringify(prefs));

  if (userId && roleId) {
    this.commonService.validateUserPreference('locationTrackPrefs', JSON.stringify(prefs));
  }
}

toggleCardsRow() {
  this.showCardsRow = !this.showCardsRow;
  this.saveUserPreferences();
}



loadInitialData() {
  this.loading = true;
  forkJoin({
    blocks: this.hospitalService.getBlockWithFloors(),
    terms: this.lookupTermService.getAppTermsWrapper('TagAssociationType'),
    roles: this.commonService.getAllRole()
  }).subscribe({
    next: (res) => {
      if (res.terms?.TagAssociationType) {
        res.terms.TagAssociationType.forEach(item => {
          this.tagAssociationTypeMap[item.code] = item.value;
        });
        this.tagTypes = res.terms.TagAssociationType
          .map(item => item.value)
          .sort();
        if (!this.selectedTagTypes.length) {
          this.selectedTagTypes = [...this.tagTypes];
        }
      }
      if (res.roles?.results) {
        res.roles.results.forEach(r => { this.roleMap[r.id] = r.name; });
      }
      const rawBlocks = res.blocks.results?.blocks || res.blocks.results || [];
      this.blockList = rawBlocks.filter(resValue => (resValue.imageUrl != null) && (resValue.hasOwnProperty('children')));

      if (this.blockList.length > 0) {
        let resolvedBlockId = null;
        let resolvedFloorId = null;
        let resolvedFloorList = [];

        if (this.selectedBlockId != null) {
          resolvedBlockId = this.selectedBlockId;
        } else {
          resolvedBlockId = this.blockList[0].id;
        }

        let floors = [];
        if (String(resolvedBlockId) === 'All') {
          this.blockList.forEach(b => {
            const bf = b.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
            floors.push(...bf);
          });
        } else {
          const block = this.blockList.find(b => String(b.id) === String(resolvedBlockId));
          floors = block?.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
        }
        this.floorList = [{ id: 'All', name: 'All' }, ...floors];

        if (this.selectedFloorId != null) {
          resolvedFloorId = this.selectedFloorId;
        } else {
          resolvedFloorId = 'All';
        }

        this.selectedBlockId = resolvedBlockId;
        this.selectedFloorId = resolvedFloorId;

        if (String(this.selectedFloorId) !== 'All') {
          this.loadLocationsForFloor(Number(this.selectedFloorId));
        }

        this.loading = true;
        this.loadTagData(false);
      } else {
        this.loading = false;
      }
    },
    error: () => {
      this.loading = false;
    }
  });
}


loadLocationsForFloor(floorId: number, callback?: () => void) {
  this.locationList = [];
  this.hospitalService.getLocationWithChildren(floorId).subscribe({
    next: (res) => {
      if (res.statusCode === 1 && res.results?.children) {
        this.locationList = res.results.children.map(c => c.name).filter(Boolean).sort();
      } else {
        this.locationList = [];
      }
      if (callback) {
        callback();
      }
    },
    error: () => {
      this.locationList = [];
      if (callback) {
        callback();
      }
    }
  });
}

onBlockSelectChange(blockId) {
  this.selectedBlockId = blockId;
  let floors = [];
  if (blockId === 'All') {
    this.blockList.forEach(b => {
      const bf = b.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
      floors.push(...bf);
    });
  } else {
    const block = this.blockList.find(b => String(b.id) === String(blockId));
    floors = block?.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
  }
  this.floorList = [{ id: 'All', name: 'All' }, ...floors];
  this.selectedFloorId = 'All';
  this.locationList = [];
  this.selectedLocations = [];
  this.loading = true;
  this.loadTagData(false);
  this.saveUserPreferences();
  if (this._paginator) this._paginator.firstPage();
}

onBlockChange(blockId) {
  this.onBlockSelectChange(blockId);
}

loadTagData(isAutoRefresh = false) {
  if (!this.selectedBlockId || !this.selectedFloorId) { this.tableData = []; this.allFloorTags = []; this.mqttVirtualTable = []; this.loading = false; return; }
  if (isAutoRefresh) {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
  } else {
    this.loading = true;
  }

  let param = '/cloc=1';
  if (String(this.selectedFloorId) !== 'All') {
    param += '&flr=' + this.selectedFloorId;
  }

  this.commonService.getReportData('totaltimebylocv2', param).subscribe({
    next: (res) => {
      if (res.results?.statusCode === 200 && res.results?.data?.length) {
        const rawData = res.results.data;
        // console.log(rawData)
        const mappedData = rawData.map((item, i) => {
          const isUserType = item.tagtype === 'TAT-US' || item.tagtype === 'TAT-STD' || item.tagtype === 'TAT-STF';
          const mappedTagType = isUserType ? 'User' : (this.tagAssociationTypeMap[item.tagtype] || item.tagtype);
          let timeVal = this.getTimestampValue(item);
          timeVal = this.parseToTimestamp(timeVal);
          return {
            [this.responseColumns[0]]: item.location_name,
            [this.responseColumns[1]]: item.tagAssociatedName,
            [this.responseColumns[2]]: mappedTagType,
            [this.responseColumns[3]]: this.roleMap[item.role_id] || item.role_id,
            [this.responseColumns[4]]: timeVal,
            blockId: item.block_id || item.blockId,
            floorId: item.floor_id || item.floorId,
            raw: item
          };
        });

        // Merge live MQTT records to avoid overwriting newer locations/timestamps with old DB values
        const mergedData = [...mappedData];
        this.mqttVirtualTable.forEach(liveItem => {
          const liveId = liveItem.raw?.tagid || liveItem.raw?.tid || liveItem[this.responseColumns[1]];
          const liveTime = this.parseToTimestamp(liveItem[this.responseColumns[4]]);
          
          const idx = mergedData.findIndex(apiItem => {
            const apiId = apiItem.raw?.tag_id || apiItem.raw?.tagid || apiItem.raw?.tid || apiItem[this.responseColumns[1]];
            return apiId === liveId;
          });

          if (idx > -1) {
            const apiTime = this.parseToTimestamp(mergedData[idx][this.responseColumns[4]]);
            if (liveTime > apiTime) {
              mergedData[idx] = liveItem;
            }
          } else {
            if (String(liveItem.floorId) === String(this.selectedFloorId) || String(this.selectedFloorId) === 'All') {
              mergedData.push(liveItem);
            }
          }
        });

        this.allFloorTags = mergedData;
        this.tableData = mergedData;
        this.mqttVirtualTable = [...mergedData];

        const facilityId = localStorage.getItem(btoa('facilityId'));
        if (!this.hasLoadedOnce || this.subscribedFacilityId !== facilityId) {
          this.hasLoadedOnce = true;
          this.skipMqttRequest = true;
          this.setupMqtt();
        }
      } else {
        this.allFloorTags = [];
        this.tableData = [];
        this.mqttVirtualTable = [];
      }
      this.isInitialLoad = false;
      this.applyGroupFilters();
      this.isRefreshing = false;
      this.loading = false;
      this.startAutoSlide();
    },
    error: () => {
      this.allFloorTags = [];
      this.tableData = [];
      this.mqttVirtualTable = [];
      this.isInitialLoad = false;
      this.isRefreshing = false;
      this.loading = false;
    }
  });
}

onSearchInput(text) {
  this.searchText = text?.trim() || '';
  this.applyGroupFilters();
  this.saveUserPreferences();
  if (this._paginator) this._paginator.firstPage();
}

private applyGroupFilters() {
  const filters: any = {};
  if (this.searchText?.length > 0) {
    filters.searchText = this.searchText.toLowerCase();
  }
  if (String(this.selectedFloorId) !== 'All' && this.selectedLocations.length < this.locationList.length) {
    filters.locations = this.selectedLocations;
  }
  if (this.selectedTagTypes.length < this.tagTypes.length) {
    filters.tagTypes = this.selectedTagTypes;
  }
  if (String(this.selectedBlockId) !== 'All') {
    filters.blockId = this.selectedBlockId;
  }
  if (String(this.selectedFloorId) !== 'All') {
    filters.floorId = this.selectedFloorId;
  }
  this.dataSource.filter = Object.keys(filters).length ? JSON.stringify(filters) : '';
  this.syncPaginatorLength();
}

private createFilterPredicate() {
  return (data: any, filter: string): boolean => {
    try {
      const f = JSON.parse(filter);
      if (f.searchText) {
        const txt = f.searchText;
        const match = this.responseColumns
          .map(col => data[col])
          .some(val => val != null && String(val).toLowerCase().includes(txt));
        if (!match) return false;
      }
      if (f.hasOwnProperty('locations')) {
        if (!data.locationName || !f.locations.includes(data.locationName)) return false;
      }
      if (f.hasOwnProperty('tagTypes')) {
        const val = data[this.responseColumns[2]];
        if (!val || !f.tagTypes.includes(val)) return false;
      }
      if (f.hasOwnProperty('blockId')) {
        if (data.blockId != null && Number(data.blockId) !== Number(f.blockId)) return false;
      }
      if (f.hasOwnProperty('floorId')) {
        if (data.floorId != null && Number(data.floorId) !== Number(f.floorId)) return false;
      }
      return true;
    } catch { return true; }
  };
}

onLocSearchInput() {
  this.locShowAll = false;
}

onFilterMenuOpen() {
  this.locSearchTerm = '';
  this.blockSearchTerm = '';
  this.floorSearchTerm = '';
  this.tagTypeSearchTerm = '';
  this.locShowAll = false;
  this.tempSelectedTagTypes = [...this.selectedTagTypes];
  this.tempSelectedBlockId = this.selectedBlockId;
  this.tempSelectedFloorId = this.selectedFloorId;
  this.updateTempFloorList();
  
  if (String(this.tempSelectedFloorId) !== 'All') {
    this.loadLocationsForFloor(Number(this.tempSelectedFloorId), () => {
      const isSameFloor = this.selectedFloorId === this.tempSelectedFloorId;
      if (isSameFloor && this.selectedLocations.length > 0) {
        this.tempSelectedLocations = this.selectedLocations.filter(loc => this.locationList.includes(loc));
      } else {
        this.tempSelectedLocations = [...this.locationList];
      }
    });
  } else {
    this.locationList = [];
    this.tempSelectedLocations = [];
  }
}

onTempBlockChange(blockId) {
  this.tempSelectedBlockId = blockId;
  this.updateTempFloorList();
  this.tempSelectedFloorId = 'All';
  this.locationList = [];
  this.tempSelectedLocations = [];
}

private updateTempFloorList() {
  let floors = [];
  if (String(this.tempSelectedBlockId) === 'All') {
    this.blockList.forEach(b => {
      const bf = b.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
      floors.push(...bf);
    });
  } else {
    const block = this.blockList.find(b => String(b.id) === String(this.tempSelectedBlockId));
    floors = block?.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
  }
  this.tempFloorList = [{ id: 'All', name: 'All' }, ...floors];
}

onLocationFilterChange(loc) {
  const idx = this.tempSelectedLocations.indexOf(loc);
  if (loc === 'All') {
    this.tempSelectedLocations = this.tempSelectedLocations.length < this.locationList.length ? [...this.locationList] : [];
  } else if (idx >= 0) {
    this.tempSelectedLocations.splice(idx, 1);
  } else {
    this.tempSelectedLocations.push(loc);
  }
}

onTagTypeFilterChange(type) {
  const idx = this.tempSelectedTagTypes.indexOf(type);
  if (type === 'All') {
    this.tempSelectedTagTypes = this.tempSelectedTagTypes.length < this.tagTypes.length ? [...this.tagTypes] : [];
  } else if (idx >= 0) {
    this.tempSelectedTagTypes.splice(idx, 1);
  } else {
    this.tempSelectedTagTypes.push(type);
  }
}

onFloorFilterChange(floorId) {
  this.tempSelectedFloorId = floorId;
  if (floorId === 'All') {
    this.locationList = [];
    this.tempSelectedLocations = [];
  } else {
    this.loadLocationsForFloor(Number(floorId), () => {
      this.tempSelectedLocations = [...this.locationList];
    });
  }
}

applyFilters() {
  this.selectedLocations = [...this.tempSelectedLocations];
  this.selectedTagTypes = [...this.tempSelectedTagTypes];
  const blockChanged = this.selectedBlockId !== this.tempSelectedBlockId;
  const floorChanged = this.selectedFloorId !== this.tempSelectedFloorId;
  if (blockChanged || floorChanged) {
    this.selectedBlockId = this.tempSelectedBlockId;
    this.selectedFloorId = this.tempSelectedFloorId;
    let floors = [];
    if (String(this.selectedBlockId) === 'All') {
      this.blockList.forEach(b => {
        const bf = b.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
        floors.push(...bf);
      });
    } else {
      const block = this.blockList.find(b => String(b.id) === String(this.selectedBlockId));
      floors = block?.children?.filter(f => f.imageUrl != null || f.locationTypeId === 23) || [];
    }
    this.floorList = [{ id: 'All', name: 'All' }, ...floors];
    this.loading = true;
    this.loadTagData(false);
  } else {
    this.applyGroupFilters();
  }
  this.saveUserPreferences();
  if (this._paginator) this._paginator.firstPage();
  if (this.filterMenuTrigger) {
    this.filterMenuTrigger.closeMenu();
  }
}

refreshPage() {
  this.loadTagData(true);
  this.requestCurrentTags();
}

private setupMqtt() {
  const currentFacilityId = localStorage.getItem(btoa('facilityId'));
  
  if (this.mqttSubscriptions.length && this.subscribedFacilityId === currentFacilityId) {
    return;
  }

  if (this.subscribedFacilityId && this.subscribedFacilityId !== currentFacilityId) {
    try {
      this.mqttService.unsubscribe(`tw/cache/gw/${this.subscribedFacilityId}/#`);
      this.mqttService.unsubscribe(`tw/cache/gw/${this.subscribedFacilityId}`);
      this.mqttService.unsubscribe(`tw/tag/location_nav/${this.subscribedFacilityId}/#`);
    } catch (e) {
      // console.log('Error unsubscribing old MQTT topics', e);
    }
  }

  this.mqttSubscriptions.forEach(sub => sub.unsubscribe());
  this.mqttSubscriptions = [];
  this.subscribedFacilityId = currentFacilityId;

  const clientConnected = (this.mqttService as any).client?.connected || false;
  
  const performSubscriptions = (facilityId: string) => {
    if (!facilityId) return;
    this.mqttService.subscribe(`tw/cache/gw/${facilityId}/#`);
    this.mqttService.subscribe(`tw/cache/gw/${facilityId}`);
    this.mqttService.subscribe(`tw/tag/location_nav/${facilityId}/#`);
    if (this.skipMqttRequest) {
      this.skipMqttRequest = false;
    } else {
      this.requestCurrentTags();
    }
  };

  if (clientConnected) {
    this.isMqttConnected = true;
    if (currentFacilityId) {
      performSubscriptions(currentFacilityId);
    }
  }

  const brokerSub = this.commonService.getmqttBroker().subscribe({
    next: (res) => {
      if (!res?.results?.length) return;
      const brokerInfo = res.results.find((b: any) => b.brokerTypeId === 'BT-CL');
      if (!brokerInfo) return;

      if (!clientConnected) {
        this.mqttService.connect({
          hostname: brokerInfo.host,
          port: Number(brokerInfo.wport),
          protocol: brokerInfo.wprotocol === 'wss' ? 'wss' : 'ws',
          path: brokerInfo.wpath || '',
          username: brokerInfo.username,
          password: brokerInfo.password,
          clientId: 'client_' + Math.random().toString(16).substr(2, 8)
        } as any);
      }

      this.isMqttConnected = (this.mqttService as any).client?.connected || false;
      const connSub = this.mqttService.isConnected$.subscribe(connected => {
        this.isMqttConnected = connected;
        if (connected && this.subscribedFacilityId) {
          performSubscriptions(this.subscribedFacilityId);
        }
      });
      this.mqttSubscriptions.push(connSub);

      const msgSub = this.mqttService.messages$.subscribe((msg: IMqttMessage) => {
        // console.log(msg)
        if (this.searchText && this.searchText.trim() !== '') {
          return;
        }
        if (msg.topic.includes('tw/tag/location_nav')) {
          if (!this.subscribedFacilityId || !msg.topic.includes(`tw/tag/location_nav/${this.subscribedFacilityId}`)) {
            return;
          }
          try {
            let jsonData = msg.payload;
            if (typeof jsonData === 'string') {
              jsonData = JSON.parse(jsonData);
            } else if (jsonData && (jsonData instanceof Uint8Array || jsonData.constructor?.name === 'Buffer')) {
              jsonData = JSON.parse(jsonData.toString());
            }
            if (jsonData) {
              this.handleMqttLiveTag(jsonData);
            }
          } catch (e) {
            // console.log('Error parsing live tag MQTT payload', e);
          }
          return;
        }
        if (!this.subscribedFacilityId || !msg.topic.includes(`tw/cache/gw/${this.subscribedFacilityId}`)) return;
        try {
          let jsonData = msg.payload;
          if (typeof jsonData === 'string') {
            jsonData = JSON.parse(jsonData);
          } else if (jsonData && (jsonData instanceof Uint8Array || jsonData.constructor?.name === 'Buffer')) {
            jsonData = JSON.parse(jsonData.toString());
          }
          if (jsonData?.ctx !== 'current_location') return;
          if (jsonData?.data?.length) {
            this.cacheDataNull = false;
            const mappedData = jsonData.data.map(item => {
              const isUserType = item.tagtype === 'TAT-US' || item.tagtype === 'TAT-STD' || item.tagtype === 'TAT-STF';
              const mappedTagType = isUserType ? 'User' : (this.tagAssociationTypeMap[item.tagtype] || item.tagtype);
              let timeVal = this.getTimestampValue(item);
              timeVal = this.parseToTimestamp(timeVal);
              return {
                [this.responseColumns[0]]: item.location_name,
                [this.responseColumns[1]]: item.tagAssociatedName,
                [this.responseColumns[2]]: mappedTagType,
                [this.responseColumns[3]]: this.roleMap[item.role_id] || item.role_id,
                [this.responseColumns[4]]: timeVal,
                blockId: item.block_id || item.blockId,
                floorId: item.floor_id || item.floorId,
                raw: item
              };
            });

            const cacheMap = new Map<string, any>();
            mappedData.forEach(cacheItem => {
              const cacheId = cacheItem.raw?.tagid || cacheItem.raw?.tid || cacheItem[this.responseColumns[1]];
              if (cacheId) {
                cacheMap.set(String(cacheId).trim(), cacheItem);
              }
            });

            const newTableData: any[] = [];
            this.allFloorTags.forEach(dbItem => {
              const dbId = dbItem.raw?.tag_id || dbItem.raw?.tagid || dbItem.raw?.tid || dbItem[this.responseColumns[1]];
              const cleanDbId = String(dbId).trim();
              if (cacheMap.has(cleanDbId)) {
                const cacheItem = cacheMap.get(cleanDbId);
                const updatedItem = {
                  ...dbItem,
                  [this.responseColumns[0]]: cacheItem[this.responseColumns[0]], // locationName
                  [this.responseColumns[4]]: cacheItem[this.responseColumns[4]], // lastSeen
                  floorId: cacheItem.floorId,
                  blockId: cacheItem.blockId,
                  raw: { ...dbItem.raw, ...cacheItem.raw }
                };
                newTableData.push(updatedItem);
                cacheMap.delete(cleanDbId);
              }
            });

            cacheMap.forEach(cacheItem => {
              if (String(cacheItem.floorId) === String(this.selectedFloorId) || String(this.selectedFloorId) === 'All') {
                newTableData.push(cacheItem);
              }
            });

            this.mqttVirtualTable = newTableData;
            this.allFloorTags = [...newTableData];
            this.tableData = [...newTableData];
            this.applyGroupFilters();
          } else {
            // Cache returned null/empty data — show message, do NOT wipe the table
            this.cacheDataNull = true;
          }
          this.loading = false;
        } catch {
          this.loading = false;
        }
      });
      this.mqttSubscriptions.push(msgSub);
      this.mqttSubscriptions.push(brokerSub);
    },
    error: () => { }
  });
}

private requestCurrentTags() {
  const facilityId = localStorage.getItem(btoa('facilityId'));
  if (!facilityId) return;
  
  let floorIds = [];
  if (String(this.selectedFloorId) !== 'All') {
    floorIds = [Number(this.selectedFloorId)];
  }
  let blockIds = [];
  if (String(this.selectedBlockId) !== 'All') {
    blockIds = [Number(this.selectedBlockId)];
  }
  const data = {
    topic: 'tw/cache/gw/<fid>',
    message: {
      typ: 'cache',
      ctx: 'current_location',
      operation: '',
      dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      data: [
        {
          facility_id: facilityId,
          floor_id: floorIds,
          block_id: blockIds
        }
      ],
      event: {}
    }
  };
  this.commonService.savePublisMqtt(data).subscribe();
}

private handleMqttLiveTag(data) {
  if (!data?.tid || !data?.ttp) return;

  const tidString = String(data.tid);
  this.recentlyUpdatedTags.add(tidString);
  setTimeout(() => {
    this.recentlyUpdatedTags.delete(tidString);
    this.cdr.detectChanges();
  }, 3000);

  let ttp = data.ttp;
  if (ttp === 'TAT-AS' && data.sat === 'AT-WH') ttp = 'TAT-WH';
  if (ttp === 'TAT-US' && data.ust) {
    ttp = data.ust === 'UT_STUDENT' ? 'TAT-STD' : data.ust === 'UT_STAFF' ? 'TAT-STF' : 'TAT-US';
  }
  if (ttp === 'TAT-CO' || ttp === 'TT-CO') ttp = 'TAT-PA';

  if (!this.selectedFloorId) return;
  const belongsToSelectedFloors = String(this.selectedFloorId) === 'All' || String(data.flr) === String(this.selectedFloorId);

  const existingIndex = this.mqttVirtualTable.findIndex(t => (t.raw?.tagid === data.tid || t.raw?.tid === data.tid));

  if (belongsToSelectedFloors) {
    const isUserType = ttp === 'TAT-US' || ttp === 'TAT-STD' || ttp === 'TAT-STF';
    const mappedTagType = isUserType ? 'User' : (this.tagAssociationTypeMap[ttp] || ttp);
    let timeVal = this.getTimestampValue(data);
    const parsedTime = this.parseToTimestamp(timeVal);
    timeVal = parsedTime > 0 ? parsedTime : new Date().getTime();
    const mappedTag = {
      [this.responseColumns[0]]: data.lnm || data.location_name || '',
      [this.responseColumns[1]]: data.tan || data.tagAssociatedName || '',
      [this.responseColumns[2]]: mappedTagType,
      [this.responseColumns[3]]: this.roleMap[data.ust] || data.role_id || '',
      [this.responseColumns[4]]: timeVal,
      blockId: data.blk || data.blockId,
      floorId: data.flr || data.floorId,
      raw: {
        ...data,
        tagid: data.tid,
        tagtype: ttp
      }
    };

    if (existingIndex > -1) {
      this.mqttVirtualTable[existingIndex] = mappedTag;
    } else {
      this.mqttVirtualTable.push(mappedTag);
    }
  } else {
    if (existingIndex > -1) {
      this.mqttVirtualTable.splice(existingIndex, 1);
    }
  }

  this.allFloorTags = [...this.mqttVirtualTable];
  this.tableData = [...this.allFloorTags];

  this.applyGroupFilters();
  this.startAutoSlide();
}

startAutoSlide(force = false) {
  if (!force && this.autoSlideInterval) {
    return;
  }
  this.stopAutoSlide();
  this.autoSlideInterval = setInterval(() => {
    if (this._paginator) {
      const pageCount = this._paginator.getNumberOfPages();
      if (pageCount > 1) {
        if (this._paginator.hasNextPage()) {
          this._paginator.nextPage();
        } else {
          this._paginator.firstPage();
        }
        this.cdr.detectChanges();
      }
    }
  }, 10000);
}

stopAutoSlide() {
  if (this.autoSlideInterval) {
    clearInterval(this.autoSlideInterval);
    this.autoSlideInterval = null;
  }
}

toggleViewMode() {
  this.viewMode = this.viewMode === 'list' ? 'card' : 'list';
  
  const cardOptions = [30, 60, 90, 150, 300, 450, 600, 900, 1200];
  const listOptions = [10, 30, 50, 100, 300, 500, 1000, 3000, 5000, 10000];
  
  if (this.viewMode === 'card') {
    if (!cardOptions.includes(this.pageSize)) {
      this.pageSize = cardOptions.reduce((prev, curr) => 
        Math.abs(curr - this.pageSize) < Math.abs(prev - this.pageSize) ? curr : prev
      );
    }
  } else {
    if (!listOptions.includes(this.pageSize)) {
      this.pageSize = listOptions.reduce((prev, curr) => 
        Math.abs(curr - this.pageSize) < Math.abs(prev - this.pageSize) ? curr : prev
      );
    }
  }
  
  if (this._paginator) {
    this._paginator.pageSize = this.pageSize;
  }
  
  this.saveUserPreferences();
  this.startAutoSlide();
  setTimeout(() => {
    this.syncPaginatorLength();
  });
}

getPaginatedCardData(): any[] {
  const data = this.dataSource?.filteredData || [];
  if (this._paginator) {
    const start = this._paginator.pageIndex * this._paginator.pageSize;
    const end = start + this._paginator.pageSize;
    return data.slice(start, end);
  }
  return data;
}

isRecentlyUpdated(row: any): boolean {
  if (!row) return false;
  const id = row.raw?.tagid || row.raw?.tid || row[this.responseColumns[1]];
  if (id && this.recentlyUpdatedTags.has(String(id))) {
    return true;
  }
  const timeVal = this.parseToTimestamp(row[this.responseColumns[4]]);
  if (timeVal > 0) {
    const now = new Date().getTime();
    return (now - timeVal) < 120000; // 2 minutes
  }
  return false;
}

isNewChange(row: any): boolean {
  if (!row) return false;
  const timeVal = this.parseToTimestamp(row[this.responseColumns[4]]);
  if (timeVal > 0) {
    const now = new Date().getTime();
    return (now - timeVal) < 60000; // 1 minute
  }
  return false;
}

getUpdateAgeStatus(row: any): 'new' | 'recent' | 'old' {
  if (!row) return 'old';
  const id = row.raw?.tagid || row.raw?.tid || row[this.responseColumns[1]];
  if (id && this.recentlyUpdatedTags.has(String(id))) {
    return 'new';
  }
  const timeVal = this.parseToTimestamp(row[this.responseColumns[4]]);
  if (timeVal > 0) {
    const now = new Date().getTime();
    const diff = now - timeVal;
    if (diff < 60000) {
      return 'new';
    } else if (diff < 300000) {
      return 'recent';
    }
  }
  return 'old';
}



onPageEvent(event) {
  this.pageSize = event.pageSize;
  this.saveUserPreferences();
}

syncPaginatorLength() {
  if (this._paginator) {
    this._paginator.length = this.dataSource?.filteredData?.length || 0;
  }
}

parseToTimestamp(val: any): number {
  if (val == null) return 0;
  const num = Number(val);
  if (!isNaN(num)) {
    return num < 1e11 ? Math.round(num * 1000) : Math.round(num);
  }
  const dateVal = new Date(val).getTime();
  return isNaN(dateVal) ? 0 : dateVal;
}

getTimestampValue(item: any): any {
  if (!item) return null;
  return item.lastseen !== undefined ? item.lastseen :
         item.lastSeen !== undefined ? item.lastSeen :
         item.last_seen !== undefined ? item.last_seen :
         item.fromtime !== undefined ? item.fromtime :
         item.fromTime !== undefined ? item.fromTime :
         item.tms !== undefined ? item.tms :
         item.dateTime !== undefined ? item.dateTime :
         item.ctm !== undefined ? item.ctm :
         item.etm !== undefined ? item.etm : null;
}
}
