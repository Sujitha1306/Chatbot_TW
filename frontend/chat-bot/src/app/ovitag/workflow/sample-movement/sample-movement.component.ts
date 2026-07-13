import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppToastService } from '../../../shared/services/toaster.service';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../app.module';
import { CommonService } from '../../../shared/services/common.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';

export interface ScannedTube {
  tubeId: string;
  collectedAt: Date;
}

export interface DeliveryLocation {
  id: number;
  locationId: string;
  locationName: string;
  tubes: ScannedTube[];
}

export interface ReceiverTube {
  tubeId: string;
  collectedAt: Date;
  acknowledged: boolean;
  requestDetailId?: number;
  alreadyAcked?: boolean;
}

export interface ReceiverLocation {
  id: string;
  locationName: string;
  tubes: ReceiverTube[];
}

export interface ReceiverDelivery {
  deliveryId: string;
  tBagTagId: string;
  requester: string;
  carrier: string;
  createdAt: Date;
  locations: ReceiverLocation[];
}

@Component({
  selector: 'app-sample-movement',
  templateUrl: './sample-movement.component.html',
  styleUrls: ['./sample-movement.component.scss'],
  providers: [
    DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ]
})
export class SampleMovementComponent implements OnInit, OnDestroy {

  // ─── View state ────────────────────────────────────────────────────────────
  view: 'list' | 'create' | 'receive' | 'modify' = 'list';
  isModifying = false;
  editingRecord: any = null;
  modifyStatus = '';
  createPage: 1 | 2 = 1;
  isSubmitted = false;
  isSubmitting = false;

  // ─── List view ─────────────────────────────────────────────────────────────
  activeTabIndex = 0;
  searchText = '';
  currentDate = new Date();
  selectedDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd');
  pageIndex = 0;
  pageSize = 10;
  listData: any[] = [];
  isListLoading = false;
  totalRecordsCount = 0;

  // ─── Create form ───────────────────────────────────────────────────────────
  sourceLocationId: number | null = null;
  sourceLocationName = '';
  tBagTagId = '';
  tBagTagValid = false;
  tBagSearchResults: any[] = [];
  createdRequestId = '';
  locations: DeliveryLocation[] = [];
  private locationCounter = 0;
  tubeInputMap: { [locId: number]: string } = {};
  selectedPerformerId = '';
  selectedPerformerDisplayName = '';
  performerSearchText = '';
  performerSearchResults: any[] = [];

  locationSearchMap:  { [locId: number]: string  } = {};
  locationResultsMap: { [locId: number]: any[]   } = {};
  locationLoadingMap: { [locId: number]: boolean } = {};

  stepDefs = [
    { number: 1, label: 'T-Bag Tag ID' },
    { number: 2, label: 'Locations & Tubes' },
    { number: 3, label: 'Performer' },
    { number: 4, label: 'Review & Submit' },
  ];

  // ─── Receive flow ──────────────────────────────────────────────────────────
  receivePage: 1 | 2 | 3 = 1;
  receiveTBagId = '';
  receiveTBagValid = false;
  receivedDelivery: ReceiverDelivery | null = null;
  receiveError = '';
  isSubmittingReceive = false;
  acknowledgeType: 'full' | 'partial' = 'full';

  // ─── Modify flow ───────────────────────────────────────────────────────────
  openModify(row: any): void {
    this.commonService.getSampleMovementRequest(row.requestId, 'RQT-SA').subscribe({
      next: (res: any) => {
        const data = Array.isArray(res?.results) ? res.results[0] : null;
        if (!data) { this.toastr.error('Error', 'Could not load request details.'); return; }
        this.resetForm();
        this.editingRecord = data;
        this.modifyStatus = data.status || 'RQ-CR';

        // T-Bag tag (kept for payload but not editable in modify)
        this.tBagTagId = data.remarks || '';
        this.tBagTagValid = this.tBagTagId.length >= 2;

        // Performer
        const performer = Array.isArray(data.performer) ? data.performer[0] : null;
        this.selectedPerformerId = performer ? String(performer.id) : '';
        this.selectedPerformerDisplayName = performer?.name || data.porterNames || '';
        this.performerSearchText = '';

        // Locations + tubes — group nonPerformer entries by location id
        const locMap = new Map<string, { name: string; tubes: string[] }>();
        (data.nonPerformer || []).forEach((np: any) => {
          // TAT-PA: locationId is the actual location; LOC (old): id was the location key
          const locId = String(np.locationId || np.id);
          if (!locMap.has(locId)) {
            locMap.set(locId, { name: np.name || '', tubes: [] });
          }
          if (np.externalIdentifier) {
            // TAT-PA: one tube per record
            locMap.get(locId)!.tubes.push(String(np.externalIdentifier).trim());
          } else if (np.comments) {
            // Old LOC format: comments may be comma-separated barcodes
            String(np.comments).split(',').map((t: string) => t.trim()).filter(Boolean)
              .forEach((t: string) => locMap.get(locId)!.tubes.push(t));
          }
        });
        // Drop locations that ended up with no tubes
        locMap.forEach((val, key) => { if (val.tubes.length === 0) locMap.delete(key); });

        this.locationCounter = 0;
        this.locations = [];
        locMap.forEach((val, locId) => {
          this.locationCounter++;
          const ctr = this.locationCounter;
          this.tubeInputMap[ctr]       = '';
          this.locationSearchMap[ctr]  = val.name;
          this.locationResultsMap[ctr] = [];
          this.locationLoadingMap[ctr] = false;
          this.locations.push({
            id: ctr,
            locationId: locId,
            locationName: val.name,
            tubes: val.tubes.map(tubeId => ({ tubeId, collectedAt: new Date() }))
          });
        });

        this.isModifying = true;
        this.view = 'modify';
        this.createPage = 1;
        this.cdr.detectChanges();
      },
      error: () => this.toastr.error('Error', 'Failed to load request details.')
    });
  }

  submitModify(): void {
    if (!this.editingRecord) return;
    this.isSubmitting = true;
    const rec = this.editingRecord;

    // Locations/tubes not editable in modify — pass original nonPerformer unchanged
    const nonPerformer = (rec.nonPerformer || []).map((np: any) => ({
      requestDetailId: np.requestDetailId,
      id: Number(np.id),
      name: np.name,
      type: np.type || 'TAT-PA',
      priority: np.priority || false,
      comments: np.comments,
      locationId: Number(np.locationId || np.id),
      externalIdentifier: np.externalIdentifier || np.comments
    }));

    const payload = {
      requestId: rec.requestId,
      assetCategory: rec.assetCategory || null,
      assetCount: null,
      comments: rec.comments || null,
      sourceId: rec.sourceId || null,
      destinationId: rec.destinationId || null,
      startTime: rec.startTime || null,
      endTime: rec.endTime || null,
      isTracable: null,
      isautoAssigned: this.selectedPerformerId ? false : true,
      porterCount: 1,
      requestCategory: rec.requestCategory || null,
      type: 'RQT-SA',
      status: this.modifyStatus,
      performer: this.selectedPerformerId
        ? [{ id: Number(this.selectedPerformerId), locationId: null, type: 'TAT-PO' }]
        : [],
      nonPerformer,
      remarks: rec.remarks || null,
      rating: null,
      srcLocationTypeId: 17,
      destLocationTypeId: rec.destLocationTypeId || null,
      srcParentLocationId: rec.srcParentLocationId || null,
      destParentLocationId: rec.destParentLocationId || null,
      poolName: 'PN-SA',
      gender: null,
      isAutoComplete: null,
      priority: false,
      isRoundTrip: false,
      serviceGroupId: rec.serviceGroupId || null,
      poolLocationId: null,
      lastModifiedOn: rec.lastModifiedOn || null,
      cancelReasonId: null,
      isMultiLoaction: true
    };

    this.commonService.updatePorterRequest(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statusCode === 1) {
          this.toastr.success('Success', res.message || 'Request updated.');
          this.doneAction();
        } else {
          this.toastr.error('Error', res?.message || 'Update failed. Please try again.');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Error', 'Update failed. Please try again.');
      }
    });
  }

  submitAction(): void {
    if (this.isModifying) this.submitModify();
    else this.submitDelivery();
  }

  doneAction(): void {
    if (!this.isModifying) this.activeTabIndex = 0;
    this.isModifying = false;
    this.editingRecord = null;
    this.view = 'list';
    this.resetForm();
    this.loadList();
  }

  // ─── Tube scan popup ───────────────────────────────────────────────────────
  scanPopupOpen = false;
  scanInput = '';
  scanSearching = false;

  openScanPopup(): void {
    this.scanPopupOpen = true;
    this.scanInput = '';
    this.scanSearching = false;
    setTimeout(() => (document.getElementById('sm-tube-scan-input') as HTMLInputElement)?.focus(), 100);
  }

  closeScanPopup(): void {
    this.scanPopupOpen = false;
    this.scanInput = '';
    this.scanSearching = false;
  }

  onTubeScanKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && this.scanInput.trim()) this.onTubeScanSearch();
  }

  openCameraForTubeScan(): void {
    this.scanTarget = 'find-request';
    this.startCamera();
  }

  onTubeScanSearch(raw?: string): void {
    const tubeId = (raw ?? this.scanInput).trim().toUpperCase();
    if (!tubeId) return;
    if (this.listData.length === 0) {
      this.toastr.error('Not Found', 'No requests in current view.');
      return;
    }
    this.scanSearching = true;
    const userId = localStorage.getItem(btoa('userId'));
    const loc$ = userId
      ? this.commonService.getUserLocations(userId).pipe(catchError(() => of(null)))
      : of(null);

    loc$.subscribe((locRes: any) => {
      const userLocations = Array.isArray(locRes?.results) ? locRes.results : [];
      const activeLocationIds = userLocations.map((l: any) => Number(l.locationId)).filter(Boolean);
      let found = false;
      let completed = 0;
      const rows = this.listData;

      rows.forEach((row: any) => {
        this.commonService.getSampleMovementDetails(row.requestId).subscribe({
          next: (res: any) => {
            if (found) { completed++; return; }
            const items = Array.isArray(res?.results) ? res.results : [];
            const matchedItem = items.find((np: any) =>
              (np.externalIdentifier || '').trim().toUpperCase() === tubeId
            );
            completed++;
            if (matchedItem && !found) {
              found = true;
              this.scanSearching = false;
              this.closeScanPopup();
              if (activeLocationIds.length > 0 && !activeLocationIds.includes(Number(matchedItem.locationId))) {
                this.toastr.warning('Warning', 'This packet does not belong to your location.');
                return;
              }
              this.openCollectPopup(row);
            } else if (completed === rows.length && !found) {
              this.scanSearching = false;
              this.toastr.error('Not Found', `Tube "${tubeId}" not found in current requests.`);
            }
          },
          error: () => {
            completed++;
            if (!found && completed === rows.length) {
              this.scanSearching = false;
              this.toastr.error('Not Found', `Tube "${tubeId}" not found in current requests.`);
            }
          }
        });
      });
    });
  }

  // ─── Collect popup ─────────────────────────────────────────────────────────
  collectPopupOpen = false;
  collectReadOnly = false;
  collectRequestData: any = null;
  collectAckStateMap = new Map<number, 'partial' | 'full'>();
  collectNonPerformers: any[] = [];
  collectLocations: { locationId: string; locationName: string; items: any[] }[] = [];
  collectAckedIds: Set<string> = new Set();
  isSubmittingCollect = false;
  collectDone = false;
  collectAcknowledgeType: 'full' | 'partial' = 'full';
  collectScanInput = '';
  lastScannedCollectTubeId = '';
  collectUserLocationName = '';
  collectGlobalTotalPending = 0;

  // ─── Ack detail popup ──────────────────────────────────────────────────────
  ackDetailPopupOpen = false;
  ackDetailRow: any = null;
  ackDetailItems: any[] = [];
  isLoadingAckDetail = false;

  // ─── Camera ────────────────────────────────────────────────────────────────
  cameraOpen = false;
  scanTarget: 'tbag' | 'tube' | 'receive-tbag' | 'collect-tube' | 'find-request' = 'tube';
  activeScanLocId: number | null = null;
  private cameraStream: MediaStream | null = null;
  private scanInterval: any = null;

  constructor(
    private toastr: AppToastService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private commonService: CommonService,public datepipe: DatePipe,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void { this.closeCamera(); }

  // ─── List view helpers ─────────────────────────────────────────────────────
  get activeTab(): 'received' | 'history' {
    return this.activeTabIndex === 0 ? 'received' : 'history';
  }

  get totalRecords(): number { return this.activeTabIndex === 0 ? this.listData.length + this.pageIndex * this.pageSize : this.totalRecordsCount; }
  get totalPages(): number { return Math.ceil(this.totalRecordsCount / this.pageSize) || 1; }
  get pageStart(): number { return this.listData.length === 0 ? 0 : this.pageIndex * this.pageSize + 1; }
  get pageEnd(): number { return this.pageIndex * this.pageSize + this.listData.length; }

  loadList(): void {
    this.isListLoading = true;
    const dateStr = this.selectedDate || null;
    const statusIds = this.activeTabIndex === 1 ? 'RQ-CO' : null;
    this.commonService.getPorterRequest(
      dateStr,
      null, null, statusIds,
      'RQT-SA', null, 'PN-SA',
      this.searchText || null,
      this.pageIndex * this.pageSize,
      this.pageSize
    ).subscribe({
      next: (res: any) => {
        const results = Array.isArray(res?.results) ? res.results : [];
        this.listData = this.activeTabIndex === 0 ? results.filter((r: any) => r.status !== 'RQ-CO') : results;
        this.totalRecordsCount = res?.totalRecords || 0;
        this.isListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isListLoading = false; }
    });
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    this.pageIndex = 0;
    this.loadList();
  }

  onSearch(): void { this.pageIndex = 0; this.loadList(); }

  headerEventAction(event: any): void {
    const { key, data } = event;
    if (key === 'applyFilter') { this.searchText = data || ''; this.pageIndex = 0; this.loadList(); }
    else if (key === 'dateFilter') { this.selectedDate = this.datePipe.transform(data, 'yyyy-MM-dd'); this.pageIndex = 0; this.loadList(); }
    else if (key === 'refreshPage') { this.pageIndex = 0; this.loadList(); }
  }

  prevPage(): void { if (this.pageIndex > 0) { this.pageIndex--; this.loadList(); } }
  nextPage(): void { if (this.pageIndex < this.totalPages - 1) { this.pageIndex++; this.loadList(); } }

  // ─── Create flow ───────────────────────────────────────────────────────────
  initiateSample(): void {
    this.resetForm();
    this.view = 'create';
    this.createPage = 1;
    const userId = localStorage.getItem(btoa('userId'));
    if (userId) {
      this.commonService.getUserLocations(userId).subscribe({
        next: (res: any) => {
          const loc = Array.isArray(res?.results) && res.results.length > 0 ? res.results[0] : null;
          if (loc) {
            this.sourceLocationId = loc.locationId ?? null;
            this.sourceLocationName = loc.locationName || loc.fullname || '';
            this.cdr.detectChanges();
          }
        },
        error: () => {}
      });
    }
  }

  backToList(): void {
    this.isModifying = false;
    this.editingRecord = null;
    this.view = 'list';
    this.resetForm();
    this.resetReceiveForm();
  }

  goToReview(): void {
    if (this.locations.length === 0) {
      this.toastr.error('Validation', 'Please add at least one location.');
      return;
    }
    if (this.locations.some(l => !l.locationId)) {
      this.toastr.error('Validation', 'Please select a location for all location cards.');
      return;
    }
    if (this.locations.some(l => l.tubes.length === 0)) {
      this.toastr.error('Validation', 'Each location must have at least one scanned tube.');
      return;
    }
    if (!this.selectedPerformerId) {
      this.toastr.error('Validation', 'Please select a performer / carrier.');
      return;
    }
    this.createPage = 2;
    setTimeout(() => {
      document.querySelector('.sm-create-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  goBack(): void {
    this.createPage = 1;
    setTimeout(() => {
      document.querySelector('.sm-create-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  submitDelivery(): void {
    this.isSubmitting = true;
    const now = new Date();
    const end = new Date(now.getTime() + 15 * 60 * 1000);

    const nonPerformer: any[] = [];
    this.locations.forEach((loc: DeliveryLocation) => {
      loc.tubes.forEach((tube: ScannedTube) => {
        nonPerformer.push({
          id: null,
          name: null,
          type: 'TAT-PA',
          priority: false,
          comments: null,
          locationId: Number(loc.locationId),
          externalIdentifier: tube.tubeId
        });
      });
    });

    const payload = {
      assetCategory: null,
      assetCount: null,
      comments: null,
      sourceId: this.sourceLocationId ?? (this.locations.length > 0 ? Number(this.locations[0].locationId) : null),
      destinationId: null,
      startTime: this.datePipe.transform(now, 'yyyy-MM-dd HH:mm:ss'),
      endTime: this.datePipe.transform(end, 'yyyy-MM-dd HH:mm:ss'),
      isTracable: null,
      isautoAssigned: this.selectedPerformerId ? false : true,
      porterCount: 1,
      requestCategory: null,
      type: 'RQT-SA',
      performer: this.selectedPerformerId
        ? [{ id: Number(this.selectedPerformerId), locationId: null, type: 'TAT-PO' }]
        : null,
      nonPerformer,
      remarks: this.tBagTagId || null,
      status: 'RQ-CR',
      srcLocationTypeId: 17,
      destLocationTypeId: null,
      srcParentLocationId: null,
      destParentLocationId: null,
      poolName: 'PN-SA',
      gender: null,
      isAutoComplete: null,
      priority: false,
      isRoundTrip: false,
      serviceGroupId: null,
      poolLocationId: null,
      lastModifiedOn: null,
      pfActivityId: null,
      isMultiLoaction: true
    };

    this.commonService.savePorterRequest(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statusCode === 1) {
          this.createdRequestId = res?.results?.requestIdentifier || '';
          this.isSubmitted = true;
          this.toastr.success('Success', res.message || 'Sample movement request created.');
        } else {
          this.toastr.error('Error', res?.message || 'Failed to create request. Please try again.');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Error', 'Failed to create sample movement request. Please try again.');
      }
    });
  }

  doneAndGoToList(): void {
    this.view = 'list';
    this.activeTabIndex = 0;
    this.resetForm();
  }

  resetForm(): void {
    this.sourceLocationId = null;
    this.sourceLocationName = '';
    this.tBagTagId = '';
    this.tBagTagValid = false;
    this.tBagSearchResults = [];
    this.createdRequestId = '';
    this.locations = [];
    this.locationCounter = 0;
    this.tubeInputMap = {};
    this.locationSearchMap  = {};
    this.locationResultsMap = {};
    this.locationLoadingMap = {};
    this.selectedPerformerId = '';
    this.selectedPerformerDisplayName = '';
    this.performerSearchText = '';
    this.performerSearchResults = [];
    this.isSubmitted = false;
    this.isSubmitting = false;
    this.createPage = 1;
  }

  // ─── Performer search ──────────────────────────────────────────────────────
  loadAvailablePerformers(): void {
    if (this.performerSearchResults.length > 0) return;
    const now = new Date();
    const fromTime = this.datePipe.transform(now, 'yyyy-MM-dd HH:mm:ss');
    const toTime = this.datePipe.transform(new Date(now.getTime() + 15 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss');
    this.commonService.searchPorter(null, null, fromTime, toTime, 'PN-SA').subscribe((res: any) => {
      this.performerSearchResults = Array.isArray(res?.results) ? res.results : [];
      this.cdr.detectChanges();
    });
  }

  onPerformerTypeHit(event: any): void {
    if (!event || event.keyCode === 13 || event.keyCode === 38 || event.keyCode === 40) return;
    const text: string = event.text || '';
    if (text.length < 2) {
      this.performerSearchResults = [];
      this.selectedPerformerId = '';
      this.selectedPerformerDisplayName = '';
      return;
    }
    if (event.toHit !== true) return;
    const now = new Date();
    const fromTime = this.datePipe.transform(now, 'yyyy-MM-dd HH:mm:ss');
    const toTime = this.datePipe.transform(new Date(now.getTime() + 15 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss');
    this.commonService.searchPorter(text, null, fromTime, toTime, 'PN-SA').subscribe((res: any) => {
      this.performerSearchResults = Array.isArray(res?.results) ? res.results : [];
      this.cdr.detectChanges();
    });
  }

  onPerformerOptionSelected(event: any): void {
    const name: string = event.option.value || '';
    const match = this.performerSearchResults.find((p: any) => p.name === name);
    this.selectedPerformerId = match ? String(match.id) : '';
    this.selectedPerformerDisplayName = name;
    this.performerSearchResults = [];
    // setTimeout needed: mat-autocomplete sets the input value after (optionSelected) fires,
    // so clearing synchronously gets overwritten by Material internally.
    setTimeout(() => {
      this.performerSearchText = '';
      this.cdr.detectChanges();
    }, 0);
  }

  clearPerformer(): void {
    this.selectedPerformerId = '';
    this.selectedPerformerDisplayName = '';
    this.performerSearchText = '';
    this.performerSearchResults = [];
  }

  // ─── T-Bag (create) ────────────────────────────────────────────────────────
  onTBagTypeHit(event: any): void {
    if (!event || event.keyCode === 13 || event.keyCode === 38 || event.keyCode === 40) return;
    const text: string = event.text || '';
    if (text.length < 2) {
      this.tBagSearchResults = [];
      this.tBagTagValid = false;
      return;
    }
    if (event.toHit !== true) return;
    this.commonService.getAllTagByType(text, 'WF-AST', 'ST-AT').subscribe((res: any) => {
      this.tBagSearchResults = Array.isArray(res?.results) ? res.results : [];
      this.cdr.detectChanges();
    });
  }

  onTBagOptionSelected(event: any): void {
    const tagId: string = event.option.value || '';
    this.tBagTagId = tagId;
    this.tBagTagValid = tagId.length >= 2;
    this.tBagSearchResults = [];
  }

  // ─── Locations ─────────────────────────────────────────────────────────────
  addLocation(): void {
    this.locationCounter++;
    const id = this.locationCounter;
    this.locations.push({ id, locationId: '', locationName: '', tubes: [] });
    this.tubeInputMap[id] = '';
    this.locationSearchMap[id]  = '';
    this.locationResultsMap[id] = [];
    this.locationLoadingMap[id] = false;
    setTimeout(() => {
      const cards = document.querySelectorAll('.sm-location-card');
      cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  removeLocation(locId: number): void {
    this.locations = this.locations.filter(l => l.id !== locId);
    delete this.tubeInputMap[locId];
    delete this.locationSearchMap[locId];
    delete this.locationResultsMap[locId];
    delete this.locationLoadingMap[locId];
  }

  // ─── Location search (same pattern as Porter) ────────────────────────────────
  onLocationTypeHit(event: any, locId: number): void {
    if (!event || event.keyCode === 13 || event.keyCode === 38 || event.keyCode === 40) return;
    const query: string = event.text || '';
    this.locationSearchMap[locId] = query;
    const loc = this.locations.find(l => l.id === locId);

    if (query.length < 3) {
      this.locationResultsMap = { ...this.locationResultsMap, [locId]: [] };
      if (loc) { loc.locationId = ''; loc.locationName = ''; }
      return;
    }

    if (event.toHit !== true) return;

    if (loc) { loc.locationId = ''; loc.locationName = ''; }
    this.locationLoadingMap = { ...this.locationLoadingMap, [locId]: true };
    this.commonService.getLocationSearch(query, true).subscribe((res: any) => {
      const arr: any[] = Array.isArray(res) ? res
                       : Array.isArray(res?.results) ? res.results
                       : Array.isArray(res?.data)    ? res.data
                       : [];
      this.locationResultsMap = { ...this.locationResultsMap, [locId]: arr };
      this.locationLoadingMap = { ...this.locationLoadingMap, [locId]: false };
      this.cdr.detectChanges();
    });
  }

  displayLocationFn(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || value.locationName || '';
  }

  onLocationOptionSelected(event: any, locId: number): void {
    const selectedName: string = event.option.value;           // always a string now
    const results: any[] = this.locationResultsMap[locId] || [];
    const match = results.find(r => (r.name || r.locationName || '') === selectedName);
    const loc = this.locations.find(l => l.id === locId);
    if (loc) {
      loc.locationId   = match ? String(match.id ?? match.locationId ?? '') : '';
      loc.locationName = selectedName;
      this.locationSearchMap[locId]  = selectedName;
      this.locationResultsMap = { ...this.locationResultsMap, [locId]: [] };
    }
  }

  selectLocationFromSearch(locId: number, result: any): void {
    const name = result.name || result.locationName || '';
    this.onLocationOptionSelected({ option: { value: name } }, locId);
  }

  clearLocationSearch(locId: number): void {
    const loc = this.locations.find(l => l.id === locId);
    if (loc) { loc.locationId = ''; loc.locationName = ''; }
    this.locationSearchMap[locId]  = '';
    this.locationResultsMap = { ...this.locationResultsMap, [locId]: [] };
  }

  onLocationSearchBlur(locId: number): void {
    setTimeout(() => {
      this.locationResultsMap = { ...this.locationResultsMap, [locId]: [] };
      this.cdr.detectChanges();
    }, 400);
  }

  // ─── Tubes (create) ────────────────────────────────────────────────────────
  scanTube(locId: number): void {
    const tubeId = (this.tubeInputMap[locId] ?? '').trim().toUpperCase();
    if (!tubeId) { this.toastr.error('Validation', 'Please enter a Tube ID to scan.'); return; }
    const isDuplicate = this.locations.some(l => l.tubes.some(t => t.tubeId === tubeId));
    if (isDuplicate) { this.toastr.error('Validation', `Tube ID "${tubeId}" is already scanned.`); return; }
    const loc = this.locations.find(l => l.id === locId);
    if (loc) { loc.tubes.push({ tubeId, collectedAt: new Date() }); this.tubeInputMap[locId] = ''; }
  }

  onTubeKeydown(event: KeyboardEvent, locId: number): void {
    if (event.key === 'Enter') this.scanTube(locId);
  }

  removeTube(locId: number, tubeId: string): void {
    const loc = this.locations.find(l => l.id === locId);
    if (loc) loc.tubes = loc.tubes.filter(t => t.tubeId !== tubeId);
  }

  get totalTubes(): number {
    return this.locations.reduce((sum, l) => sum + l.tubes.length, 0);
  }

  get selectedPerformerName(): string {
    return this.selectedPerformerDisplayName;
  }

  // ─── Stepper (create) ──────────────────────────────────────────────────────
  getStepState(stepNum: number): 'completed' | 'active' | 'next' | 'inactive' {
    if (this.isSubmitted) return 'completed';
    if (this.createPage === 1) {
      if (stepNum === 1) return 'active';
      if (stepNum === 2) return 'next';
      return 'inactive';
    } else {
      if (stepNum <= 3) return 'completed';
      if (stepNum === 4) return 'active';
    }
    return 'inactive';
  }

  // ─── Receive flow ──────────────────────────────────────────────────────────
  receiveSample(): void {
    this.resetReceiveForm();
    this.view = 'receive';
  }

  resetReceiveForm(): void {
    this.receiveTBagId = '';
    this.receiveTBagValid = false;
    this.receivedDelivery = null;
    this.receiveError = '';
    this.isSubmittingReceive = false;
    this.acknowledgeType = 'full';
    this.receivePage = 1;
  }

  onReceiveTBagInput(value: string): void {
    this.receiveTBagId = value.trim().toUpperCase();
    this.receiveTBagValid = this.receiveTBagId.length >= 5;
    this.receiveError = '';
    this.receivedDelivery = null;
  }

  onReceiveTBagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.receiveTBagValid) this.loadReceiverDelivery();
  }

  loadReceiverDelivery(): void {
    this.receiveError = '';
    this.receivedDelivery = null;
    this.commonService.getPorterRequest(null, null, null, null, 'RQT-SA', null, 'PN-SA', this.receiveTBagId, 0, 50)
      .subscribe({
        next: (listRes: any) => {
          const results = Array.isArray(listRes?.results) ? listRes.results : [];
          const match = results.find((r: any) =>
            (r.remarks || '').trim().toUpperCase() === this.receiveTBagId.trim().toUpperCase()
          );
          if (!match) {
            this.receiveError = `No active delivery found for T-Bag "${this.receiveTBagId}".`;
            return;
          }
          this.commonService.getSampleMovementDetails(match.requestId).subscribe({
            next: (detailRes: any) => {
              const items = Array.isArray(detailRes?.results) ? detailRes.results : [];
              const locMap = new Map<string, ReceiverLocation>();
              items.forEach((np: any) => {
                const locKey = np.perfLocFullName || np.porterLocation || 'Unknown';
                if (!locMap.has(locKey)) {
                  locMap.set(locKey, { id: locKey, locationName: locKey, tubes: [] });
                }
                locMap.get(locKey)!.tubes.push({
                  tubeId: np.externalIdentifier || '',
                  collectedAt: np.collectedAt ? new Date(np.collectedAt) : new Date(),
                  acknowledged: !!np.acknowledgeTime,
                  requestDetailId: np.id,
                  alreadyAcked: !!np.acknowledgeTime
                });
              });
              const delivery: ReceiverDelivery = {
                deliveryId: String(match.requestId),
                tBagTagId: this.receiveTBagId,
                requester: match.requestedByName || match.requesterName || '',
                carrier: match.porterNames || '',
                createdAt: match.startTime ? new Date(match.startTime) : new Date(),
                locations: Array.from(locMap.values())
              };
              if (delivery.locations.length === 0) {
                this.receiveError = `No tube data found for T-Bag "${this.receiveTBagId}".`;
                return;
              }
              this.receivedDelivery = delivery;
            },
            error: () => { this.receiveError = `Failed to load delivery details.`; }
          });
        },
        error: () => { this.receiveError = `Failed to search for T-Bag "${this.receiveTBagId}".`; }
      });
  }

  goBackToScan(): void {
    this.receivePage = 1;
    setTimeout(() => {
      document.querySelector('.sm-create-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  goToAcknowledge(): void {
    if (!this.receivedDelivery) {
      this.toastr.error('Validation', 'Please scan or enter a valid T-Bag Tag ID first.');
      return;
    }
    this.receivePage = 2;
    setTimeout(() => {
      document.querySelector('.sm-create-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  getReceiveStepState(stepNum: number): 'completed' | 'active' | 'next' | 'inactive' {
    if (this.receivePage === 3) return 'completed';
    if (this.receivePage === 1) {
      if (stepNum === 1) return 'active';
      if (stepNum === 2) return 'next';
      return 'inactive';
    }
    if (stepNum === 1) return 'completed';
    if (stepNum === 2) return 'active';
    if (stepNum === 3) return 'next';
    return 'inactive';
  }

  toggleTubeAck(locId: string, tubeId: string): void {
    if (!this.receivedDelivery) return;
    const loc = this.receivedDelivery.locations.find(l => l.id === locId);
    if (loc) {
      const tube = loc.tubes.find(t => t.tubeId === tubeId);
      if (tube) tube.acknowledged = !tube.acknowledged;
    }
  }

  acknowledgeAllInLocation(locId: string): void {
    if (!this.receivedDelivery) return;
    const loc = this.receivedDelivery.locations.find(l => l.id === locId);
    if (loc) {
      const allAcked = loc.tubes.every(t => t.acknowledged);
      loc.tubes.forEach(t => t.acknowledged = !allAcked);
    }
  }

  acknowledgeAll(): void {
    if (!this.receivedDelivery) return;
    const allAcked = this.isFullAcknowledgment;
    this.receivedDelivery.locations.forEach(loc => loc.tubes.forEach(t => t.acknowledged = !allAcked));
  }

  get acknowledgedCount(): number {
    if (!this.receivedDelivery) return 0;
    return this.receivedDelivery.locations.reduce(
      (sum, loc) => sum + loc.tubes.filter(t => t.acknowledged).length, 0
    );
  }

  get totalReceiveTubes(): number {
    if (!this.receivedDelivery) return 0;
    return this.receivedDelivery.locations.reduce((sum, loc) => sum + loc.tubes.length, 0);
  }

  get isFullAcknowledgment(): boolean {
    return this.totalReceiveTubes > 0 && this.acknowledgedCount === this.totalReceiveTubes;
  }

  getAckedCount(tubes: ReceiverTube[]): number {
    return tubes.filter(t => t.acknowledged).length;
  }

  allTubesAcked(tubes: ReceiverTube[]): boolean {
    return tubes.length > 0 && tubes.every(t => t.acknowledged);
  }

  submitAcknowledgment(): void {
    if (this.acknowledgedCount === 0) {
      this.toastr.error('Validation', 'Please acknowledge at least one tube before submitting.');
      return;
    }
    const allTubes: ReceiverTube[] = ([] as ReceiverTube[]).concat(
      ...this.receivedDelivery!.locations.map((loc: ReceiverLocation) => loc.tubes)
    );
    const toAck = allTubes.filter((t: ReceiverTube) => t.acknowledged && !t.alreadyAcked);
    if (toAck.length === 0) {
      this.toastr.error('Validation', 'No new items to acknowledge.');
      return;
    }
    const isPartial = !this.isFullAcknowledgment;
    const postData = toAck
      .filter((t: ReceiverTube, i: number, arr: ReceiverTube[]) =>
        arr.findIndex((x: ReceiverTube) => x.requestDetailId === t.requestDetailId) === i)
      .map((t: ReceiverTube) => ({
        acknowledgedComments: null,
        isPartiallyCompleted: isPartial,
        comments: null,
        requestDetailId: t.requestDetailId,
        ackmobileById: null
      }));
    this.isSubmittingReceive = true;
    this.commonService.reqDetailAck(postData).subscribe({
      next: (res: any) => {
        this.isSubmittingReceive = false;
        if (res?.statusCode === 1 || res?.results || res?.status === 'success') {
          this.acknowledgeType = isPartial ? 'partial' : 'full';
          this.receivePage = 3;
        } else {
          this.toastr.error('Error', res?.message || 'Acknowledgment failed. Please try again.');
        }
      },
      error: () => {
        this.isSubmittingReceive = false;
        this.toastr.error('Error', 'Acknowledgment failed. Please try again.');
      }
    });
  }

  doneReceiveAndGoToList(): void {
    this.view = 'list';
    this.activeTabIndex = 1;
    this.resetReceiveForm();
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'RQ-CR': 'status-initiated',   // Created / Assigned
      'RQ-IP': 'status-transit',     // In Progress
      'RQ-CO': 'status-received',    // Completed
      'RQ-CA': 'status-cancelled',   // Cancelled
    };
    return map[status] ?? '';
  }

  getRowAckState(row: any): 'partial' | 'full' {
    if (this.collectAckStateMap.has(row.requestId)) {
      return this.collectAckStateMap.get(row.requestId)!;
    }
    return row.isPartiallyCompleted ? 'partial' : 'full';
  }

  // ─── Collect popup methods ──────────────────────────────────────────────────
  openCollectPopup(row: any, readOnly = false): void {
    this.collectRequestData = row;
    this.collectReadOnly = readOnly;
    const userId = localStorage.getItem(btoa('userId'));
    const details$ = this.commonService.getSampleMovementDetails(row.requestId);
    const loc$ = userId ? this.commonService.getUserLocations(userId).pipe(catchError(() => of(null))) : of(null);
    forkJoin([details$, loc$]).subscribe({
      next: ([detailsRes, locRes]: [any, any]) => {
        const items = Array.isArray(detailsRes?.results) ? detailsRes.results : [];
        if (items.length === 0) {
          this.toastr.error('Error', 'No items found to acknowledge.');
          return;
        }
        const userLocations = Array.isArray(locRes?.results) ? locRes.results : [];
        const activeLocationIds = userLocations.map((l: any) => Number(l.locationId)).filter(Boolean);
        this.collectUserLocationName = userLocations.length > 0
          ? (userLocations[0].locationName || userLocations[0].fullname || '')
          : '';
        const locationFiltered = activeLocationIds.length > 0
          ? items.filter((np: any) => activeLocationIds.includes(Number(np.locationId)))
          : items;
        // Fall back to all items if location filter produced no match (prevents blocking the popup)
        const filtered = locationFiltered.length > 0 ? locationFiltered : items;
        if (filtered.length === 0) {
          this.toastr.error('No Items', 'No packets found for this request.');
          return;
        }
        // Global pending = all unacked across ALL locations (not just this user's)
        this.collectGlobalTotalPending = items.filter((np: any) => !np.acknowledgeTime).length;
        // Each TAT-PA record is one tube; externalIdentifier is the tube barcode
        const expanded = filtered.map((np: any) => ({ ...np, _rowKey: String(np.id) }));
        this.collectNonPerformers = expanded;
        this.buildCollectLocations();
        this.collectAckedIds = new Set(
          expanded.filter((np: any) => np.acknowledgeTime).map((np: any) => np._rowKey)
        );
        this.collectDone = false;
        this.isSubmittingCollect = false;
        this.collectAcknowledgeType = 'full';
        this.collectScanInput = '';
        this.lastScannedCollectTubeId = '';
        this.collectPopupOpen = true;
        if (!readOnly) {
          setTimeout(() => {
            (document.getElementById('sm-collect-scan-input') as HTMLInputElement)?.focus();
          }, 120);
        }
      },
      error: () => this.toastr.error('Error', 'Failed to load request details.')
    });
  }

  closeCollectPopup(): void {
    this.collectPopupOpen = false;
    this.collectReadOnly = false;
    this.collectRequestData = null;
    this.collectNonPerformers = [];
    this.collectLocations = [];
    this.collectAckedIds = new Set();
    this.collectDone = false;
    this.collectScanInput = '';
    this.lastScannedCollectTubeId = '';
    this.collectUserLocationName = '';
    this.collectGlobalTotalPending = 0;
  }

  // ─── Ack detail popup ──────────────────────────────────────────────────────
  openAckDetailPopup(row: any): void {
    this.ackDetailRow = row;
    this.ackDetailItems = [];
    this.isLoadingAckDetail = true;
    this.ackDetailPopupOpen = true;
    this.commonService.getSampleMovementDetails(row.requestId).subscribe({
      next: (res: any) => {
        this.ackDetailItems = Array.isArray(res?.results) ? res.results : [];
        this.isLoadingAckDetail = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingAckDetail = false;
        this.toastr.error('Error', 'Failed to load acknowledgment details.');
      }
    });
  }

  closeAckDetailPopup(): void {
    this.ackDetailPopupOpen = false;
    this.ackDetailRow = null;
    this.ackDetailItems = [];
    this.isLoadingAckDetail = false;
  }

  get ackedDetailItems(): any[] {
    return this.ackDetailItems.filter((np: any) => !!np.acknowledgeTime);
  }

  get pendingDetailItems(): any[] {
    return this.ackDetailItems.filter((np: any) => !np.acknowledgeTime);
  }

  // np.id = requestDetailId, np.perfLocFullName = delivery location, np.comments = tube barcode
  private buildCollectLocations(): void {
    const map = new Map<string, { locationId: string; locationName: string; items: any[] }>();
    for (const np of this.collectNonPerformers) {
      const locKey = np.perfLocFullName || np.porterLocation || 'Unknown';
      if (!map.has(locKey)) map.set(locKey, { locationId: locKey, locationName: locKey, items: [] });
      map.get(locKey)!.items.push(np);
    }
    this.collectLocations = Array.from(map.values());
  }

  toggleCollectItem(rowKey: string, checked?: boolean): void {
    const newSet = new Set(this.collectAckedIds);
    if (checked !== undefined) {
      checked ? newSet.add(rowKey) : newSet.delete(rowKey);
    } else {
      newSet.has(rowKey) ? newSet.delete(rowKey) : newSet.add(rowKey);
    }
    this.collectAckedIds = newSet;
    this.cdr.detectChanges();
  }

  acknowledgeAllCollect(): void {
    const pendingKeys = this.collectNonPerformers
      .filter((np: any) => !np.acknowledgeTime)
      .map((np: any) => np._rowKey);
    const allPendingAcked = pendingKeys.every((k: string) => this.collectAckedIds.has(k));
    if (allPendingAcked) {
      pendingKeys.forEach((k: string) => this.collectAckedIds.delete(k));
    } else {
      pendingKeys.forEach((k: string) => this.collectAckedIds.add(k));
    }
  }

  acknowledgeAllInCollectLoc(locationId: string): void {
    const items = this.collectNonPerformers.filter(
      (np: any) => (np.perfLocFullName || np.porterLocation) === locationId && !np.acknowledgeTime
    );
    const allAcked = items.every((np: any) => this.collectAckedIds.has(np._rowKey));
    if (allAcked) {
      items.forEach((np: any) => this.collectAckedIds.delete(np._rowKey));
    } else {
      items.forEach((np: any) => this.collectAckedIds.add(np._rowKey));
    }
  }

  get collectAcknowledgedCount(): number {
    return this.collectNonPerformers.filter(
      (np: any) => !np.acknowledgeTime && this.collectAckedIds.has(np._rowKey)
    ).length;
  }
  get collectTotalTubes(): number {
    return this.collectNonPerformers.filter((np: any) => !np.acknowledgeTime).length;
  }
  get isCollectFullAck(): boolean {
    return this.collectTotalTubes > 0 && this.collectAcknowledgedCount === this.collectTotalTubes;
  }
  get collectAckedTotalCount(): number {
    return this.collectNonPerformers.filter((np: any) => np.acknowledgeTime).length;
  }

  getCollectAckedCountForLoc(locationId: string): number {
    return this.collectNonPerformers.filter(
      (np: any) => (np.perfLocFullName || np.porterLocation) === locationId
        && !np.acknowledgeTime && this.collectAckedIds.has(np._rowKey)
    ).length;
  }

  allCollectLocTubesAcked(locationId: string): boolean {
    const pending = this.collectNonPerformers.filter(
      (np: any) => (np.perfLocFullName || np.porterLocation) === locationId && !np.acknowledgeTime
    );
    return pending.length > 0 && pending.every((np: any) => this.collectAckedIds.has(np._rowKey));
  }

  submitCollect(): void {
    // Only submit items that are newly checked (not already acknowledged)
    const toAck = this.collectNonPerformers.filter(
      (np: any) => !np.acknowledgeTime && this.collectAckedIds.has(np._rowKey)
    );
    if (toAck.length === 0) {
      this.toastr.error('Validation', 'Please select at least one pending item to acknowledge.');
      return;
    }
    // isPartial must be based on global count (all locations), not just this user's visible packets
    const isPartial = toAck.length < this.collectGlobalTotalPending;
    const allComments = [...new Set(toAck.map((np: any) => np.externalIdentifier).filter(Boolean))].join(',');

    const dialogData = {
      title: 'Send Acknowledgement',
      message: `The package${allComments ? ' (' + allComments + ')' : ''} has been acknowledged as collected.`,
      customMsg: true,
      buttonText: { ok: 'Yes', cancel: 'No' },
      isRemark: 0,
      pharmacyAck: true,
      isPartiallyCompleted: isPartial,
      acknowledgedComments: null,
      ackUser: null,
      isPharmacyOtp: false
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
      height: '460px',
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.confirmButtonText === 'Yes') {
        const deduped = toAck.filter((np: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === np.id) === i);
        const postData = deduped.map((np: any) => ({
          acknowledgedComments: result['acknowledgedComments'],
          isPartiallyCompleted: result['isPartiallyCompleted'],
          comments: result['userName'],
          requestDetailId: np.id,
          ackmobileById: result['ackmobileById'] || null
        }));
        this.isSubmittingCollect = true;
        this.commonService.reqDetailAck(postData).subscribe({
          next: (res: any) => {
            if (res?.statusCode === 1 || res?.results || res?.status === 'success') {
              this.updateCollectRequestStatus(isPartial);
            } else {
              this.isSubmittingCollect = false;
              this.toastr.error('Error', res?.message || 'Acknowledgment failed. Please try again.');
            }
          },
          error: () => {
            this.isSubmittingCollect = false;
            this.toastr.error('Error', 'Acknowledgment failed. Please try again.');
          }
        });
      }
    });
  }

  private updateCollectRequestStatus(isPartial: boolean): void {
    const rec = this.collectRequestData;
    const performer = Array.isArray(rec?.performer) && rec.performer.length > 0 ? rec.performer[0] : null;
    const payload = {
      requestDetailId: performer?.requestDetailId || null,
      status: isPartial ? 'RQ-IP' : 'RQ-CO',
      performerId: performer?.id || null,
      performerType: performer?.tagAssociationTypeId || null,
      lastModifiedOn: rec?.lastModifiedOn || null
    };
    this.commonService.updatePorterRequestStatus(payload, rec.requestId).subscribe({
      next: () => this.onCollectSuccess(isPartial),
      error: () => this.onCollectSuccess(isPartial)
    });
  }

  private onCollectSuccess(isPartial: boolean): void {
    this.isSubmittingCollect = false;
    this.collectAcknowledgeType = isPartial ? 'partial' : 'full';
    if (this.collectRequestData?.requestId) {
      this.collectAckStateMap.set(this.collectRequestData.requestId, isPartial ? 'partial' : 'full');
    }
    this.collectDone = true;
    this.loadList();
  }

  // ─── Collect tube scanner ───────────────────────────────────────────────────
  onCollectTubeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.collectScanInput.trim()) {
      this.findAndAckCollectTube(this.collectScanInput);
    }
  }

  openCameraForCollectTube(): void {
    this.scanTarget = 'collect-tube';
    this.activeScanLocId = null;
    this.startCamera();
  }

  findAndAckCollectTube(raw: string): void {
    const id = raw.trim().toUpperCase();
    const np = this.collectNonPerformers.find(
      (item: any) => (item.externalIdentifier || '').trim().toUpperCase() === id
    );
    if (np) {
      this.collectAckedIds.add(np._rowKey);
      this.lastScannedCollectTubeId = np.externalIdentifier;
      setTimeout(() => {
        if (this.lastScannedCollectTubeId === np.externalIdentifier) this.lastScannedCollectTubeId = '';
      }, 2500);
    } else {
      this.toastr.error('Scanner', `Tube "${id}" not found in this delivery.`);
    }
    this.collectScanInput = '';
  }

  // ─── Camera ────────────────────────────────────────────────────────────────
  openCameraForTBag(): void {
    this.scanTarget = 'tbag';
    this.activeScanLocId = null;
    this.startCamera();
  }

  openCameraForReceiveTBag(): void {
    this.scanTarget = 'receive-tbag';
    this.activeScanLocId = null;
    this.startCamera();
  }

  openCameraForTube(locId: number): void {
    this.scanTarget = 'tube';
    this.activeScanLocId = locId;
    this.startCamera();
  }

  private startCamera(): void {
    this.cameraOpen = true;
    setTimeout(async () => {
      const video = document.getElementById('sm-camera-video') as HTMLVideoElement;
      if (!video) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
        });
        video.srcObject = stream;
        this.cameraStream = stream;
        await video.play();
        this.startBarcodeDetection(video);
      } catch {
        this.cameraOpen = false;
        this.toastr.error('Camera', 'Could not access camera. Check browser permissions.');
      }
    }, 120);
  }

  private startBarcodeDetection(video: HTMLVideoElement): void {
    const BarcodeDetectorAPI = (window as any)['BarcodeDetector'];
    if (!BarcodeDetectorAPI) {
      this.toastr.info('Scanner', 'Camera scanning requires Chrome or Edge. Use an external scanner instead.');
      return;
    }
    const detector = new BarcodeDetectorAPI({
      formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix']
    });
    this.scanInterval = setInterval(async () => {
      try {
        const results = await detector.detect(video);
        if (results.length > 0) this.onBarcodeDetected(results[0].rawValue);
      } catch { /* frame not ready */ }
    }, 250);
  }

  private onBarcodeDetected(raw: string): void {
    const value = raw.trim().toUpperCase();
    this.closeCamera();
    if (this.scanTarget === 'tbag') {
      this.tBagTagId = value;
      this.tBagTagValid = value.length >= 2;
      this.tBagSearchResults = [];
    } else if (this.scanTarget === 'receive-tbag') {
      this.onReceiveTBagInput(value);
      setTimeout(() => this.loadReceiverDelivery(), 80);
    } else if (this.scanTarget === 'collect-tube') {
      setTimeout(() => this.findAndAckCollectTube(value), 50);
    } else if (this.scanTarget === 'find-request') {
      setTimeout(() => this.onTubeScanSearch(value), 50);
    } else if (this.activeScanLocId !== null) {
      const locId = this.activeScanLocId;
      this.tubeInputMap[locId] = value;
      setTimeout(() => this.scanTube(locId), 50);
    }
  }

  closeCamera(): void {
    if (this.scanInterval) { clearInterval(this.scanInterval); this.scanInterval = null; }
    if (this.cameraStream) { this.cameraStream.getTracks().forEach(t => t.stop()); this.cameraStream = null; }
    this.cameraOpen = false;
  }
}
