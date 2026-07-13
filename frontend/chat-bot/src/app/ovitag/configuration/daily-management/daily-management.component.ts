/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
******************************************************************************/
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { ConfigurationService, CommonService } from '../../../shared';
import { ActivatedRoute } from '@angular/router';
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';
import { EditDailyManagement } from '../../../shared/modules/entry-component/edit-daily-management/edit-daily-management.model';

@Component({
  selector: 'app-daily-management',
  templateUrl: './daily-management.component.html',
  styleUrls: ['./daily-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DailyManagementComponent implements OnInit {

  public activate_btn: any = [];
  public loading = true;

  // Raw data from resolver — flat list of floors with testLocations
  healthTest: Array<any> = [];

  // Grouped for the left nav: [{ blockId, blockName, floors: [...] }]
  navGroups: Array<{ blockId: any; blockName: string; floors: Array<any> }> = [];

  // Summary stats
  totalLocations = 0;
  activeCount = 0;
  inactiveCount = 0;
  consultingDoctorsCount = 0;

  // Selected floor
  selectedFloorId: any = null;
  selectedFloorObj: any = null;

  // Search & status filter
  searchText = '';
  selectedStatus = '';

  // Inline editable rows (current floor)
  editableLocations: Array<any> = [];
  displayedLocations: Array<any> = [];

  // Saving state for the single bottom Save
  saving = false;

  // Lookup data
  genderList: Array<any> = [];

  trackByGroup = (_i: number, g: any) => g.blockId;
  trackByFloor = (_i: number, f: any) => f.floorId;
  trackByRow   = (_i: number, r: any) => r.locationId;

  constructor(
    private readonly configurationService: ConfigurationService,
    public  readonly cdr: ChangeDetectorRef,
    private readonly commonService: CommonService,
    private readonly route: ActivatedRoute,
    private readonly toastr: AppToastService,
    private readonly lookupService: LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.healthTest = this.route.snapshot.data.dailyManagements?.results ?? [];
    this.buildNavGroups();
    this.calculateStats(this.healthTest);
    if (this.healthTest.length > 0) { this.selectFloor(this.healthTest[0]); }
    this.loading = false;

    this.lookupService.getAppTermsWrapper('LocationGender').subscribe(res => {
      this.genderList = res.LocationGender ?? [];
      this.cdr.markForCheck();
    });
  }

  // ── Nav grouping ──────────────────────────────────────────────────────────

  buildNavGroups() {
    const map = new Map<any, { blockId: any; blockName: string; floors: Array<any> }>();
    (this.healthTest || []).forEach(floor => {
      const bid   = floor.blockId   ?? '__none__';
      const bname = floor.blockName ?? 'Floors';
      if (!map.has(bid)) { map.set(bid, { blockId: bid, blockName: bname, floors: [] }); }
      map.get(bid)!.floors.push(floor);
    });
    this.navGroups = Array.from(map.values());
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  calculateStats(data: any[]) {
    this.totalLocations = 0; this.activeCount = 0; this.inactiveCount = 0;
    const doctorSet = new Set<any>();
    (data || []).forEach(floor => {
      (floor.testLocations || []).forEach((loc: any) => {
        this.totalLocations++;
        if (loc.isAvailable) { this.activeCount++; } else { this.inactiveCount++; }
        if (loc.userId) { doctorSet.add(loc.userId); }
      });
    });
    this.consultingDoctorsCount = doctorSet.size;
  }

  getFloorActiveCount(floor: any): number {
    return (floor?.testLocations || []).filter((l: any) => l.isAvailable).length;
  }

  // ── Floor selection ───────────────────────────────────────────────────────

  selectFloor(floor: any) {
    this.selectedFloorId   = floor.floorId;
    this.selectedFloorObj  = floor;
    this.searchText        = '';
    this.selectedStatus    = '';
    this.buildEditableRows(floor.testLocations || []);
    this.applyFilters();
  }

  buildEditableRows(locs: any[]) {
    this.editableLocations = locs.map(loc => ({
      ...loc,
      _isAvailable: loc.isAvailable  ?? false,
      _capacity:    loc.capacity     ?? null,
      _queueLength: loc.queueLength  ?? null,
      _genderId:    loc.genderId     ?? null,
    }));
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  applyFilters() {
    this.displayedLocations = this.editableLocations.filter((row: any) => {
      const matchSearch = !this.searchText ||
        row.locationName?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchStatus = !this.selectedStatus ||
        (this.selectedStatus === 'active' ? row._isAvailable === true : row._isAvailable === false);
      return matchSearch && matchStatus;
    });
    this.cdr.markForCheck();
  }

  onSearchChange(value: string)  { this.searchText     = value; this.applyFilters(); }
  onStatusChange(value: string)  { this.selectedStatus = value; this.applyFilters(); }
  clearFilters() { this.searchText = ''; this.selectedStatus = ''; this.applyFilters(); }

  setStatus(row: any, value: boolean) { row._isAvailable = value; this.cdr.markForCheck(); }

  // ── Save all rows for the current floor ──────────────────────────────────

  saveAll() {
    if (this.saving) { return; }
    this.saving = true;
    this.cdr.markForCheck();

    const rows = [...this.editableLocations];
    const doNext = (index: number) => {
      if (index >= rows.length) {
        this.saving = false;
        this.toastr.success('Success', 'All locations saved.');
        this.refreshData();
        return;
      }
      this.saveRow(rows[index], () => doNext(index + 1));
    };
    doNext(0);
  }

  private saveRow(row: any, onDone: () => void) {
    const editData = new EditDailyManagement(
      null, null, row.alternativeLocationId ?? undefined as any,
      row._queueLength, row._capacity, row.locationId,
      null, null, false, [], row._genderId,
      [row.languageId ?? null], row.userId ?? null
    );
    editData.isAvailable = row._isAvailable;

    this.commonService.updateHealthTestByFloorwise(editData).subscribe(
      () => { onDone(); },
      error => {
        this.saving = false;
        this.cdr.markForCheck();
        this.toastr.error('Error', `${error.error?.message ?? 'Save failed'}`);
      }
    );
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  refreshData() {
    this.loading = true;
    this.cdr.markForCheck();
    this.configurationService.getAllHealthTestsbyFloorwise().subscribe(res => {
      this.healthTest = res.results ?? [];
      this.buildNavGroups();
      this.calculateStats(this.healthTest);
      if (this.selectedFloorId) {
        const fresh = this.healthTest.find((f: any) => f.floorId === this.selectedFloorId);
        if (fresh) {
          this.selectedFloorObj = fresh;
          this.buildEditableRows(fresh.testLocations || []);
          this.applyFilters();
        }
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  onWindowResized(_size: number) {}
}
