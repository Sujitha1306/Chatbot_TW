import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { WorkflowService, CommonService, ConfigurationService } from '../../../../shared';
import { PushNotificationsService } from '../../../../shared/services/push.notification.service';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { AssignTaskComponent } from '../../task/task.component';
import { CommonDialogComponent } from '../../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { SalesOrderManagementComponent } from '../../../../shared/modules/entry-component/sales-order-management/sales-order-management.component';
import { LookupTermService } from '../../../../shared/lookup-term.service';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { SessionStorageService } from '../../../../shared/services/session.storage.service';
import QrScanner from 'qr-scanner';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { ReworkDialogComponent } from './rework-dialog.component';

@Component({
  selector: 'app-task-management-card-view',
  templateUrl: './task-management-card-view.component.html',
  styleUrls: ['./task-management-card-view.component.scss']
})
export class TaskManagementCardViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tableData: any[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Output() cardEventAction = new EventEmitter<any>();
  @Output() loadMore = new EventEmitter<void>();
  @ViewChild('qrVideo', { static: false }) qrVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('taskListScroll', { static: false }) taskListScrollRef!: ElementRef<HTMLDivElement>;
  @ViewChild('previewPanel', { static: false }) previewPanelRef!: ElementRef<HTMLElement>;

  selectedTask: any = null;
  taskDetail: any = null;
  filteredTasks: any[] = [];
  detailLoading = false;
  isMenuCollapsed = false;
  loadMoreLoading = false;

  documents: any[] = [];
  documentsLoading = false;
  forms: any[] = [];
  formsLoading = false;

  activeTab: 'summary' | 'document' | 'forms' | 'activity' = 'summary';
  entityData: any = null;
  formTemplates: any[] = [];
  selectedFormTemplateId: any = null;

  /** Set true once we've triggered a "load more" at the current scroll bottom.
   *  Reset only when the user scrolls away from the bottom. Prevents re-trigger
   *  loops while still allowing the user to scroll up → down to load the next page. */
  private triggeredAtBottom = false;

  /** Number of items in tableData BEFORE the most recent load-more request.
   *  Used to scroll the first newly loaded item into view after data arrives. */
  private preLoadCount = 0;

  activityLog: any[] = [];
  activityLogExpanded = false;
  activityLogLoading = false;

  showQrScanner = false;
  qrScannerInstance: QrScanner | null = null;
  qrScanSuccess = false;
  qrScanLoading = false;

  // ── Document Preview Properties ─────────────────────────────────────────────
  selectedPreviewDoc: any = null;
  previewSafeUrl: SafeResourceUrl | null = null;
  previewFileType: string = '';
  previewLoading = false;
  previewTextContent: string = '';
  private _blobUrl: string = '';
  isPreviewFullscreen = false;
  zoomLevel = 1;
  private readonly ZOOM_STEP = 0.25;
  private readonly ZOOM_MIN = 0.5;
  private readonly ZOOM_MAX = 4;
  private _wheelAccum = 0;
  private readonly WHEEL_THRESHOLD = 100;

  // ── Document Add Properties ─────────────────────────────────────────────────
  showDocForm = false;
  documentTypes: any[] = [];
  newDocType: string | null = null;
  newDocName: string = '';
  selectedFile: File | null = null;
  docBase64Data: string = '';
  docFileInfo: string = '';
  docFileMimeType: string = '';
  docFileSize: number = 0;
  isFileSelected = false;
  attachFiles: any[] = [];

  constructor(
    private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public pushNotificationsService: PushNotificationsService,
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    private readonly sanitizer: DomSanitizer,
    private readonly lookupService: LookupTermService,
    private readonly toastr: AppToastService,
    private readonly dateFormat: DatePipe,
    private readonly sessionService: SessionStorageService
  ) {}

  ngOnInit(): void {
    this.filteredTasks = [...this.tableData];
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableData']) {
      const prevLen = changes['tableData'].previousValue?.length || 0;
      const newLen = this.tableData.length;
      const isAppend = newLen > prevLen && this.preLoadCount > 0;
      this.loadMoreLoading = false;
      this.filteredTasks = [...this.tableData];
      if (this.selectedTask) {
        const updated = this.tableData.find(t => t.requestId === this.selectedTask.requestId);
        if (updated) this.selectTask(updated);
      }
      if (isAppend && this.preLoadCount > 0) {
        setTimeout(() => this.scrollToIndex(this.preLoadCount), 50);
      }
      if (!isAppend) this.preLoadCount = 0;
      this.autoLoadIfNeeded();
    }
  }

  /** Scroll the n-th task card to the top of the visible area. */
  private scrollToIndex(index: number): void {
    const el = this.taskListScrollRef?.nativeElement;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('.task-card');
    if (index < cards.length) {
      cards[index].scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }

  /** After new data arrives, if the entire set fits without scrolling and more
   *  items exist on server, load the next page automatically. */
  private autoLoadIfNeeded(): void {
    setTimeout(() => {
      const el = this.taskListScrollRef?.nativeElement;
      if (!el || this.loadMoreLoading || this.loading) return;
      const fitsWithoutScroll = el.scrollHeight <= el.clientHeight;
      if (fitsWithoutScroll && this.filteredTasks.length < this.totalCount) {
        this.triggeredAtBottom = false;
        this.loadMoreLoading = true;
        this.preLoadCount = this.tableData.length;
        this.loadMore.emit();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.exitFullscreen();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.stopQrScanner();
    this.revokePreviewUrl();
  }

  private revokePreviewUrl(): void {
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch {}
      this._blobUrl = '';
    }
  }

  onTaskListScroll(): void {
    const el = this.taskListScrollRef?.nativeElement;
    if (!el || this.loadMoreLoading || this.loading) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

    if (atBottom && this.filteredTasks.length < this.totalCount) {
      if (!this.triggeredAtBottom) {
        this.triggeredAtBottom = true;
        this.loadMoreLoading = true;
        this.preLoadCount = this.tableData.length;
        this.loadMore.emit();
      }
    } else {
      this.triggeredAtBottom = false;
      this.loadMoreLoading = false;
    }
  }

  selectTask(task: any): void {
    this.selectedTask = task;
    this.taskDetail = null;
    this.activityLogExpanded = false;
    this.activityLog = [];
    this.documents = [];
    this.forms = [];
    this.activeTab = 'summary';
    this.formTemplates = [];
    this.selectedFormTemplateId = null;
    this.closeDocumentPreview();
    this.resetDocForm();
    if (task.deliveryRequestId) {
      this.detailLoading = true;
      this.workflowService.getAllDeliveryById(task.deliveryRequestId).subscribe(res => {
        this.taskDetail = res?.results;
        this.detailLoading = false;
      }, () => {
        this.detailLoading = false;
      });
    }
    if (task.requestId) {
      this.entityData = {
        entityId: task.requestId,
        entityType: 'Request',
        parentId: null,
        parentType: null,
        entityGroupTypeId: 'EGTI-LOC'
      };
      this.loadActivityLog();
      this.loadFormTemplates();
      this.loadDocuments(task.requestId);
      this.loadDocumentTypes();
      this.loadForms(task.requestId);
    }
  }

  getStatusClass(task: any): string {
    const code = task?.requestStatusCode || task?.requestStatusId || '';
    const map: Record<string, string> = {
      'RQ-CO': 'status-complete',
      'RQ-IP': 'status-inprogress',
      'RQ-CR': 'status-created',
      'RQ-CA': 'status-cancelled',
    };
    return map[code] || 'status-default';
  }

  passTask(): void {
    if (!this.selectedTask) return;
    const statusData = {
      comments: this.selectedTask.deliveryRequestComments,
      type: 'RQT-ROU',
      status: 'RQ-CO',
      userType: this.selectedTask.performerType
    };
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Complete Task',
        message: 'Do you want to complete the task?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        completeTask: true,
        requestId: this.selectedTask.requestId,
        completeData: statusData
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.pushNotificationsService.triggerNotificationRefresh();
        this.resetSelection();
        this.cardEventAction.emit({ key: 'refresh' });
      }
    });
  }

  reworkTask(): void {
    if (!this.selectedTask) return;
    const dialogRef = this.dialog.open(ReworkDialogComponent, {
      panelClass: ['medium-popup'],
      disableClose: true,
      data: {
        task: this.selectedTask,
        allTasks: this.tableData
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.pushNotificationsService.triggerNotificationRefresh();
        this.resetSelection();
        this.cardEventAction.emit({ key: 'refresh' });
      }
    });
  }

  reassignTask(): void {
    if (!this.selectedTask) return;
    const data = { ...this.selectedTask, launchType: 'isTask' };
    const dialogRef = this.dialog.open(AssignTaskComponent, {
      data,
      height: '250px',
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.cardEventAction.emit({ key: 'refresh' });
    });
  }

  openSalesOrder(): void {
    if (!this.selectedTask) return;
    const data = { ...this.selectedTask, type: 'task' };
    this.dialog.open(SalesOrderManagementComponent, {
      data,
      panelClass: ['medium-popup'],
      disableClose: true
    });
  }

  resetSelection(): void {
    this.selectedTask = null;
    this.taskDetail = null;
    this.activityLog = [];
    this.activityLogExpanded = false;
    this.documents = [];
    this.forms = [];
    this.entityData = null;
    this.formTemplates = [];
    this.selectedFormTemplateId = null;
    this.closeDocumentPreview();
    this.resetDocForm();
    this.showDocForm = false;
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  toggleActivityLog(): void {
    this.activityLogExpanded = !this.activityLogExpanded;
    if (this.activityLogExpanded && this.activityLog.length === 0 && this.selectedTask) {
      this.loadActivityLog();
    }
  }

  switchToActivityTab(): void {
    this.activeTab = 'activity';
    if (this.activityLog.length === 0 && this.selectedTask) {
      this.loadActivityLog();
    }
  }

  loadActivityLog(): void {
    if (!this.selectedTask?.requestId) return;
    this.activityLogLoading = true;
    this.commonService.getPorterHistory(this.selectedTask.requestId).subscribe(res => {
      if (res.statusCode === 1) {
        this.activityLog = res.results;
      }
      this.activityLogLoading = false;
    }, () => {
      this.activityLogLoading = false;
    });
  }

  loadDocuments(requestId: number): void {
    this.documentsLoading = true;
    this.commonService.getAllAttachments(requestId, 'Request').subscribe(res => {
      const results = res?.results || [];
      this.documents = results;
      this.attachFiles = [...results];
      this.documentsLoading = false;
    }, () => {
      this.documentsLoading = false;
    });
  }

  loadDocumentTypes(): void {
    if (!this.entityData) return;
    this.lookupService.getAppTermsLinkWrapper(this.entityData.entityGroupTypeId, 'DocumentType').subscribe(res => {
      this.documentTypes = res?.DocumentType ?? [];
    });
  }

  // ── Document Preview ──────────────────────────────────────────────────────────

  get previewTypeKey(): string {
    const t = (this.previewFileType || '').toLowerCase();
    if (t === 'link') return 'link';
    if (t === 'application/pdf') return 'pdf';
    if (t.startsWith('image/')) return 'image';
    if (t === 'text/plain' || t === 'text/csv') return 'text';
    if (t.includes('spreadsheet') || t.includes('excel') || t === 'application/vnd.ms-excel') return 'excel';
    if (t.includes('word') || t.includes('document') || t === 'application/msword') return 'word';
    if (t.includes('powerpoint') || t.includes('presentation')) return 'ppt';
    if (t.startsWith('video/')) return 'video';
    if (t.startsWith('audio/')) return 'audio';
    return 'other';
  }

  openDocumentPreview(doc: any): void {
    this.revokePreviewUrl();
    this.selectedPreviewDoc = doc;
    this.previewFileType = doc.fileType || '';
    this.previewSafeUrl = null;
    this.previewTextContent = '';
    this.previewLoading = true;
    this.zoomLevel = 1;

    if (doc.fileType === 'Link' && doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
      this.selectedPreviewDoc = null;
      this.previewLoading = false;
      return;
    }

    const mimeType = doc.fileType || 'application/octet-stream';
    const typeKey = this.previewTypeKey;

    if (doc.base64Data) {
      if (typeKey === 'text') {
        try { this.previewTextContent = atob(doc.base64Data); } catch { this.previewTextContent = doc.base64Data; }
        this.previewLoading = false;
      } else {
        const blob = this.base64ToBlob(doc.base64Data, mimeType);
        this._blobUrl = window.URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._blobUrl);
        this.previewLoading = false;
      }
    } else if (doc.image) {
      this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        typeof doc.image === 'string' ? doc.image : ''
      );
      this.previewLoading = false;
    } else if (doc.fileUrl) {
      if (typeKey === 'text') {
        fetch(doc.fileUrl)
          .then(r => r.text())
          .then(text => { this.previewTextContent = text; this.previewLoading = false; })
          .catch(() => { this.previewLoading = false; });
      } else if (typeKey === 'pdf' || typeKey === 'image') {
        fetch(doc.fileUrl)
          .then(r => r.blob())
          .then(blob => {
            const typed = blob.type ? blob : new Blob([blob], { type: mimeType });
            this._blobUrl = window.URL.createObjectURL(typed);
            this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._blobUrl);
            this.previewLoading = false;
          })
          .catch(() => { this.previewLoading = false; });
      } else {
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.fileUrl);
        this.previewLoading = false;
      }
    } else {
      this.previewLoading = false;
    }
  }

  closeDocumentPreview(): void {
    this.exitFullscreen();
    this.revokePreviewUrl();
    this.selectedPreviewDoc = null;
    this.previewSafeUrl = null;
    this.previewFileType = '';
    this.previewTextContent = '';
    this.previewLoading = false;
    this.zoomLevel = 1;
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.ZOOM_MAX, parseFloat((this.zoomLevel + this.ZOOM_STEP).toFixed(2)));
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.ZOOM_MIN, parseFloat((this.zoomLevel - this.ZOOM_STEP).toFixed(2)));
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  onPreviewWheel(event: WheelEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();

    // Normalise to pixels so mouse wheel and trackpad feel consistent
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;   // DOM_DELTA_LINE
    if (event.deltaMode === 2) delta *= 600;  // DOM_DELTA_PAGE

    this._wheelAccum += delta;

    if (Math.abs(this._wheelAccum) >= this.WHEEL_THRESHOLD) {
      this._wheelAccum < 0 ? this.zoomIn() : this.zoomOut();
      this._wheelAccum = 0;
    }
  }

  togglePreviewFullscreen(): void {
    if (this.isPreviewFullscreen) {
      this.exitFullscreen();
    } else {
      const el = this.previewPanelRef?.nativeElement;
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    }
  }

  private exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  private onFullscreenChange = (): void => {
    this.isPreviewFullscreen = !!document.fullscreenElement;
  };

  // ── Document Add ──────────────────────────────────────────────────────────────
  onDocFileSelect(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.docFileMimeType = file.type;
    this.docFileSize = file.size;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.docBase64Data = btoa(e.target.result);
      this.isFileSelected = true;
    };
    reader.readAsBinaryString(file);

    this.docFileInfo = `${file.name} (${this.formatBytes(file.size)})`;
  }

  get canAddDoc(): boolean {
    return !!this.newDocType && (this.isFileSelected || this.newDocType === 'DT-LI');
  }

  addDocument(): void {
    if (!this.canAddDoc || !this.entityData) return;

    const typeName = this.documentTypes.find(dt => dt.code === this.newDocType)?.value || '';
    const docEntry: any = {
      documentTypeId: this.newDocType,
      fileName: this.newDocName || typeName,
      documentTypeName: typeName,
      fileType: this.newDocType === 'DT-LI' ? 'Link' : this.docFileMimeType,
      base64Data: this.docBase64Data || null,
      attachmentId: null,
      image: null,
      fileUrl: null,
      fileSize: this.docFileSize,
      createdBy: localStorage.getItem(btoa('current_user')),
      createdOn: this.dateFormat.transform(new Date(), 'YYYY-MM-dd HH:mm:ss'),
      modifiedOn: null,
      modifyByName: null,
      entityType: 'Request',
      entityId: this.entityData.entityId,
      entityGroupTypeId: this.entityData.entityGroupTypeId,
    };

    this.commonService.saveFile([docEntry]).subscribe({
      next: (res) => {
        this.toastr.success('Success', 'Document saved successfully');
        this.loadDocuments(this.entityData.entityId);
        this.sessionService.setAttachFiles(this.attachFiles);
        this.resetDocForm();
      },
      error: () => {
        this.toastr.error('Error', 'Failed to save document');
      }
    });
  }

  private resetDocForm(): void {
    this.showDocForm = false;
    this.newDocType = null;
    this.newDocName = '';
    this.selectedFile = null;
    this.docBase64Data = '';
    this.docFileInfo = '';
    this.docFileMimeType = '';
    this.docFileSize = 0;
    this.isFileSelected = false;
  }

  // ── Document Download ─────────────────────────────────────────────────────────
  downloadDocument(element: any): void {
    const extensionMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'text/plain': '.txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };

    const extension = extensionMap[element.fileType] || '';
    const filename = (element.fileName || 'document') + extension;
    const mimeType = element.fileType || 'application/octet-stream';

    if (element.fileUrl && element.fileType !== 'Link') {
      fetch(element.fileUrl)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          this.triggerDownload(blobUrl, filename);
        })
        .catch(error => console.error('Download failed from URL:', error));

    } else if (element.base64Data) {
      const blob = this.base64ToBlob(element.base64Data, mimeType);
      const blobUrl = window.URL.createObjectURL(blob);
      this.triggerDownload(blobUrl, filename);
    } else if (element.textContent) {
      const blob = new Blob([element.textContent], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);
      this.triggerDownload(blobUrl, filename);
    } else {
      console.warn('No downloadable content found');
    }
  }

  private triggerDownload(blobUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  getDocTypeShortCode(doc: any): string {
    if (doc.fileType === 'Link') return 'LINK';
    const extMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPG', 'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/svg+xml': 'SVG',
      'image/webp': 'WEBP',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'video/mp4': 'VID', 'video/webm': 'VID', 'video/ogg': 'VID',
      'audio/mpeg': 'AUD', 'audio/wav': 'AUD', 'audio/ogg': 'AUD',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR',
      'application/octet-stream': 'BIN',
    };
    return extMap[doc.fileType] || (doc.documentTypeId ? doc.documentTypeId.replace('DT-', '') : 'FILE');
  }

  getDocTypeClass(doc: any): string {
    const code = this.getDocTypeShortCode(doc);
    const map: Record<string, string> = {
      'PDF': 'ext-pdf',
      'JPG': 'ext-img', 'PNG': 'ext-img', 'GIF': 'ext-img', 'SVG': 'ext-img', 'WEBP': 'ext-img',
      'XLS': 'ext-xls', 'XLSX': 'ext-xls', 'CSV': 'ext-xls',
      'DOC': 'ext-doc', 'DOCX': 'ext-doc',
      'PPT': 'ext-ppt', 'PPTX': 'ext-ppt',
      'TXT': 'ext-txt',
      'LINK': 'ext-link',
      'VID': 'ext-vid',
      'AUD': 'ext-aud',
      'SCH': 'ext-sch',
      'ZIP': 'ext-zip', 'RAR': 'ext-zip',
    };
    return map[code] || 'ext-file';
  }

  getDocSizeText(doc: any): string {
    if (!doc.fileSize) return '';
    return this.formatBytes(doc.fileSize);
  }

  getPerformerTypeName(type: string): string {
    const map: Record<string, string> = {
      'RT-RO': 'Role',
      'RT-US': 'User',
      'RT-DT': 'Department'
    };
    return map[type] || type || '—';
  }

  private formatBytes(bytes: number): string {
    if (!bytes) return '';
    const units = ['Bytes', 'kB', 'MB', 'GB'];
    let index = 0;
    let size = bytes;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index++; }
    return `${parseFloat(size.toFixed(1))} ${units[index]}`;
  }

  // ── Document Delete ───────────────────────────────────────────────────────────
  deleteDocument(doc: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        isRemark : 1,
        buttonText: { ok: 'Yes', cancel: 'No' },
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== 'Yes' && result !== 'confirm') return;
      if (doc.attachmentId) {
        this.commonService.deleteItemAttachment(doc.attachmentId).subscribe({
          next: (res: any) => {
            if (res.statusCode === 1) {
              const index = this.attachFiles.findIndex(d => d === doc);
              if (index > -1) {
                this.attachFiles.splice(index, 1);
                this.documents = [...this.attachFiles];
                this.sessionService.setAttachFiles(this.attachFiles);
              }
              if (this.selectedPreviewDoc === doc) {
                this.closeDocumentPreview();
              }
              this.toastr.success('Success', 'Document removed successfully');
            } else {
              this.toastr.error('Error', res.message || 'Failed to delete document');
            }
          },
          error: () => {
            this.toastr.error('Error', 'Failed to delete document');
          }
        });
      } else {
        const index = this.attachFiles.findIndex(d => d === doc);
        if (index > -1) {
          this.attachFiles.splice(index, 1);
          this.documents = [...this.attachFiles];
          this.sessionService.setAttachFiles(this.attachFiles);
        }
        if (this.selectedPreviewDoc === doc) {
          this.closeDocumentPreview();
        }
        this.toastr.success('Success', 'Document removed successfully');
      }
    });
  }

  loadForms(requestId: number): void {
    this.formsLoading = true;
    this.commonService.getFormDetails(requestId, 'request').subscribe(res => {
      if (res.statusCode === 1) {
        this.forms = res.results.filter((f: any) => f.status);
      }
      this.formsLoading = false;
    }, () => {
      this.formsLoading = false;
    });
  }

  loadFormTemplates(): void {
    this.configurationService.getEntityAssociatedForms('FS-PU', 'FTT-PROD').subscribe(res => {
      if (res.statusCode === 1) {
        this.formTemplates = res.results;
      }
    });
  }

  addForm(): void {
    if (!this.selectedFormTemplateId || !this.selectedTask?.requestId) return;
    this.configurationService.getFormTemplates(
      this.selectedFormTemplateId,
      this.selectedTask.requestId,
      'request'
    ).subscribe(res => {
      if (res.statusCode === 1) {
        const formData = {
          id: null,
          parentId: null,
          parentType: null,
          entityId: this.selectedTask.requestId,
          entityType: 'request',
          pfFormTemplateId: this.selectedFormTemplateId,
          content: 'form',
          entityData: null
        };
        const dialogRef = this.dialog.open(CommonDialogComponent, {
          data: formData,
          panelClass: ['medium-popup'],
          disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.selectedFormTemplateId = null;
            this.loadForms(this.selectedTask.requestId);
          }
        });
      }
    });
  }

  openForm(form: any): void {
    if (!this.selectedTask?.requestId) return;
    const formData = {
      id: form.id,
      parentId: form.parentId,
      parentType: form.parentType,
      entityId: form.entityId || this.selectedTask.requestId,
      entityType: 'request',
      pfFormTemplateId: form.pfFormTemplateId,
      content: 'form',
      entityData: null,
      entityFormStatus: form.entityFormStatusId
    };
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: formData,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadForms(this.selectedTask.requestId);
      }
    });
  }

  viewFormHistory(form: any): void {
    if (!this.selectedTask?.requestId) return;
    const formData = {
      id: form.id,
      parentId: form.parentId,
      parentType: form.parentType,
      entityId: form.entityId || this.selectedTask.requestId,
      entityType: 'request',
      pfFormTemplateId: form.pfFormTemplateId,
      content: 'form',
      entityData: null,
      entityFormStatus: form.entityFormStatusId,
      sideBar: true
    };
    this.dialog.open(CommonDialogComponent, {
      data: formData,
      panelClass: ['fullscreen-form-dialog'],
      disableClose: true
    }).afterClosed().subscribe(() => {
      if (this.selectedTask?.requestId) {
        this.loadForms(this.selectedTask.requestId);
      }
    });
  }

  deleteForm(form: any): void {
    if (!this.selectedTask?.requestId) return;
    form.status = false;
    this.configurationService.updateEntiryFormTemplates(form.id, form).subscribe(res => {
      if (res.statusCode === 1) {
        this.loadForms(this.selectedTask.requestId);
      }
    });
  }

  handleDocumentEvent(event: any): void {
    if (this.selectedTask?.requestId) {
      this.loadDocuments(this.selectedTask.requestId);
    }
  }

  toggleQrScanner(): void {
    this.showQrScanner = !this.showQrScanner;
    if (this.showQrScanner) {
      setTimeout(() => this.startQrScanner(), 100);
    } else {
      this.stopQrScanner();
    }
  }

  startQrScanner(): void {
    if (!this.qrVideo?.nativeElement) return;
    this.stopQrScanner();
    this.qrScanSuccess = false;
    this.qrScannerInstance = new QrScanner(
      this.qrVideo.nativeElement,
      result => this.handleQrResult(result.data),
      { highlightScanRegion: true, highlightCodeOutline: true }
    );
    this.qrScannerInstance.start().catch(err => console.error('QR scanner start error', err));
  }

  stopQrScanner(): void {
    if (this.qrScannerInstance) {
      this.qrScannerInstance.destroy();
      this.qrScannerInstance = null;
    }
  }

  handleQrResult(data: string): void {
    if (this.qrScanSuccess) return;
    this.qrScanSuccess = true;
    this.stopQrScanner();
    this.showQrScanner = false;
    this.qrScanLoading = true;
    setTimeout(() => {
      this.findAndSelectTask(data.trim());
      this.qrScanLoading = false;
    }, 600);
  }

  findAndSelectTask(identifier: string): void {
    const task = this.tableData.find(t =>
      t.deliveryRequestIdentifier === identifier ||
      t.requestId?.toString() === identifier
    );
    if (task) {
      this.selectTask(task);
    }
  }
}
