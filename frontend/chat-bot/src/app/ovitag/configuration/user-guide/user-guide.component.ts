import { Component, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService, ConfigurationService } from '../../../shared/services';
import { AppToastService } from '../../../shared/services/toaster.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-user-guide',
  templateUrl: './user-guide.component.html',
  styleUrls: ['./user-guide.component.scss'],
  standalone:false
})
export class UserGuideComponent {
  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = ['ID', 'Category', 'Code', 'Document Type', 'Title', 'Language', 'Version', 'URL', 'Published Date', 'Review Date', 'Status'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  eventColumn = ['Title', 'URL'];
  public selectedName: any = null;
  public applyFilterValue: any;
  public selectedView = "table";
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize: number = 50;
  pageStart: number = 0;
  length: number = 0;
  dateTimeColumns = ['Published Date', 'Review Date'];
  public tableVersion: any = null;

  constructor(public dialog: MatDialog, private router: Router, private commonService: CommonService) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      console.log('thiss',this.commonService.facilityConfig?.twTableVersion)
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Category', 'Code', 'Document Type', 'Title', 'Language', 'Version', 'URL', 'Published Date', 'Review Date', 'Status'];
      }
      this.getUserGuideList();
    }, 500);
  }

  getUserGuideList(sText?) {
    this.isloading = true;
    this.commonService.getUserGuideList(null, null, null, null, null, null, sText).subscribe({
      next: (res: any) => {
        this.tableData = res.results || res;
        const Columns = this.tableVersion === 1
          ? ['id', 'category', 'code', 'documentTypeId', 'title', 'language', 'version', 'url', 'publishedDate', 'reviewDate', 'status']
          : ['category', 'code', 'documentTypeId', 'title', 'language', 'version', 'url', 'publishedDate', 'reviewDate', 'status'];
          console.log(Columns)
        for (let i in Columns) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
        this.length = this.tableData.length;
        this.isloading = false;
      },
      error: () => {
        this.isloading = false;
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getUserGuideList(this.applyFilterValue);
    } else if (this.applyFilterValue.length === 0) {
      this.getUserGuideList(null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'Create') {
      this.createUserGuide(null);
    } else if (event.data === 'Modify') {
      this.createUserGuide(this.selectedName);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
    } else if (event.key === 'URL' && event.data?.url) {
      window.open(event.data.url, '_blank');
    } else if (event.key === 'Title') {
      this.createUserGuide(event.data);
    }
  }

  createUserGuide(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(CreateUserGuideComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getUserGuideList();
  }

  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2
  }

  get userGuideTwColumns(): TwColumnDef[] {
    // console.log(this.displayedColumns)
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      this.eventColumn, this.dateTimeColumns
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (timeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  get userGuidePaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}

@Component({
  selector: 'app-create-user-guide',
  templateUrl: './create-user-guide.component.html',
  styleUrls: ['./user-guide.component.scss'],
  providers: [DatePipe],
})
export class CreateUserGuideComponent {
  public userGuideForm: FormGroup;
  public resTypList: any[] = [];
  public resNameList: any[] = [];
  public resourceList: any[] = [];
  public languageList: any[] = [];
  public isFileSelected: boolean = false;
  public base64Data_global: string;
  public fileInfo: string;
  public fileType: string;
  public selectedFileObj: any = null;
  public removeExistingFile: boolean = false;
  private loadingExistingFile = false;

  selectedPreviewDoc: any = null;
  previewSafeUrl: any = null;
  previewFileType: string = '';
  previewLoading = false;
  previewTextContent: string = '';
  isPreviewFullscreen = false;
  zoomLevel = 1;
  private readonly ZOOM_STEP = 0.25;
  private readonly ZOOM_MIN = 0.5;
  private readonly ZOOM_MAX = 4;
  private _wheelAccum = 0;
  private readonly WHEEL_THRESHOLD = 100;
  private _blobUrl: string = '';

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public thisDialogRef: MatDialogRef<CreateUserGuideComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    private readonly dateFormat: DatePipe,
    private sanitizer: DomSanitizer,
  ) {
    this.getAllResource();
  }

  ngOnInit() {
    this.removeExistingFile = false;
    this.commonService.getAppTermsVerion2('ResourceType,FactoryType,ActivityCategory,DocumentType,Language').subscribe(res => {
      this.resTypList = res.results.filter((item: any) => item.groupName === 'ResourceType');
      this.languageList = res.results.filter((item: any) => item.groupName === 'Language');
    });
    this.buildForm();
    if (this.data?.url) {
      this.loadExistingFile(this.data.url);
    }
  }

  private detectMimeFromBytes(blob: Blob): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 8);
        const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        if (hex.startsWith('25504446')) resolve('application/pdf');
        else if (hex.startsWith('89504e47')) resolve('image/png');
        else if (hex.startsWith('ffd8ff')) resolve('image/jpeg');
        else if (hex.startsWith('474946')) resolve('image/gif');
        else if (hex.startsWith('504b34')) resolve('application/zip');
        else if (hex.startsWith('d0cf11e0')) resolve('application/msword');
        else if (hex.startsWith('efbbbf')) resolve('text/plain');
        else resolve(blob.type || 'application/octet-stream');
      };
      reader.onerror = () => resolve(blob.type || 'application/octet-stream');
      reader.readAsArrayBuffer(blob.slice(0, 8));
    });
  }

  private loadExistingFile(url: string): void {
    this.loadingExistingFile = true;
    const token = localStorage.getItem(btoa('user_token')) || '';
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
      .then(async blob => {
        if (!this.loadingExistingFile) return;
        const ext = url.split('.').pop()?.toLowerCase() || '';
        const typeMap = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', txt: 'text/plain', csv: 'text/csv', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
        this.fileType = (blob.type && blob.type !== 'application/octet-stream')
          ? blob.type
          : typeMap[ext] || await this.detectMimeFromBytes(blob);
        const reader = new FileReader();
        reader.onload = () => {
          if (!this.loadingExistingFile) return;
          this.loadingExistingFile = false;
          this.base64Data_global = (reader.result as string).split(',')[1] || reader.result as string;
          this.isFileSelected = true;
          const fileName = url.split('/').pop() || 'Document';
          this.selectedFileObj = { fileName, fileType: this.fileType, fileSize: blob.size, base64Data: this.base64Data_global, fileUrl: null };
          this.fileInfo = `${fileName} (${this.formatBytes(blob.size)})`;
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => { this.loadingExistingFile = false; });
  }

  getAllResource() {
    this.configurationService.getAllResource().subscribe(res => {
      this.resourceList = res.results;
      if (this.data?.category) {
        this.getResourceFilter(this.data.category);
      }
    });
  }

  public buildForm() {
    this.userGuideForm = this.form.group({
      title: [this.data?.title ?? null, [Validators.required]],
      resourceType: [this.data?.category ?? null, [Validators.required]],
      resourceCode: [this.data?.code ?? null, [Validators.required]],
      status: [this.data?.status ?? null],
      preferedLanguage: [this.data?.language ?? null],
      description: [this.data?.description ?? null],
    });
  }

  getResourceFilter(type: string) {
    if (type === 'RST-ACTCAT') {
      this.resNameList = [];
    } else if (type === 'RST-MN') {
      this.resNameList = this.resourceList.filter(res => res.resourceTypeId === type && res.link !== null && (res.link.includes('/dm/') || res.code === 'MN_DB'));
    } else {
      this.resNameList = this.resourceList.filter(res => res.resourceTypeId === type);
    }
    if (this.resNameList.length > 0 && !this.data?.code) {
      this.userGuideForm.controls['resourceCode'].setValue(this.resNameList[0].code);
    }
  }

  handleFileSelect(evt) {
    this.loadingExistingFile = false;
    this.removeExistingFile = false;
    const files = evt.target.files;
    const allowed_types = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed_types.includes(evt.target.files[0].type)) {
      this.toastr.warning('Warning', `Please choose only mentioned file formats!`);
      return;
    }
    for (const file of files) {
      if (file) {
        this.fileType = file.type;
        const reader = new FileReader();
        reader.onload = ((f: File) => {
          return (readerEvt: any) => {
            const binaryString = readerEvt.target.result;
            this.base64Data_global = btoa(binaryString);
            this.isFileSelected = true;
            this.selectedFileObj = { fileName: f.name, fileType: f.type, fileSize: f.size, base64Data: this.base64Data_global, fileUrl: null };
            this.fileInfo = `${f.name} (${this.formatBytes(f.size)})`;
          };
        })(file);
        reader.readAsBinaryString(file);
      }
    }
  }

  formatBytes(bytes: number): string {
    const UNITS = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const factor = 1024;
    let index = 0;
    let size = bytes;
    while (size >= factor) {
      size /= factor;
      index++;
    }
    return `${parseFloat(size.toFixed(2))} ${UNITS[index]}`;
  }

  removeFile(): void {
    this.loadingExistingFile = false;
    this.base64Data_global = null;
    this.isFileSelected = false;
    this.fileInfo = '';
    this.fileType = '';
    this.selectedFileObj = null;
    if (this.data?.url) {
      this.removeExistingFile = true;
    }
    this.closeDocumentPreview();
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(btoa('user_token')) || '';
    return { 'Authorization': `Bearer ${token}` };
  }

  openDocumentPreview(): void {
    if (!this.selectedFileObj) return;
    this.revokePreviewUrl();
    this.selectedPreviewDoc = this.selectedFileObj;
    this.previewFileType = this.selectedFileObj.fileType;
    this.previewSafeUrl = null;
    this.previewTextContent = '';
    this.previewLoading = true;
    this.zoomLevel = 1;

    const mimeType = this.selectedFileObj.fileType || 'application/octet-stream';
    const typeKey = this.previewTypeKey;

    if (this.selectedFileObj.base64Data) {
      if (typeKey === 'text') {
        try { this.previewTextContent = atob(this.selectedFileObj.base64Data); } catch { this.previewTextContent = this.selectedFileObj.base64Data; }
        this.previewLoading = false;
      } else {
        const blob = this.base64ToBlob(this.selectedFileObj.base64Data, mimeType);
        this._blobUrl = window.URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._blobUrl);
        this.previewLoading = false;
      }
    } else if (this.selectedFileObj.fileUrl) {
      const headers = this.getAuthHeaders();
      if (typeKey === 'text') {
        fetch(this.selectedFileObj.fileUrl, { headers })
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(text => { this.previewTextContent = text; this.previewLoading = false; })
          .catch(() => { this.previewLoading = false; });
      } else if (typeKey === 'pdf' || typeKey === 'image') {
        fetch(this.selectedFileObj.fileUrl, { headers })
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
          .then(blob => {
            const typed = blob.type ? blob : new Blob([blob], { type: mimeType });
            this._blobUrl = window.URL.createObjectURL(typed);
            this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._blobUrl);
            this.previewLoading = false;
          })
          .catch(() => { this.previewLoading = false; });
      } else {
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedFileObj.fileUrl);
        this.previewLoading = false;
      }
    } else {
      this.previewLoading = false;
    }
  }

  closeDocumentPreview(): void {
    this.revokePreviewUrl();
    this.selectedPreviewDoc = null;
    this.previewSafeUrl = null;
    this.previewFileType = '';
    this.previewTextContent = '';
    this.previewLoading = false;
    this.zoomLevel = 1;
  }

  private revokePreviewUrl(): void {
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch {}
      this._blobUrl = '';
    }
  }

  get previewTypeKey(): string {
    const t = (this.previewFileType || '').toLowerCase();
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

  get docTypeShortCode(): string {
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
    };
    return extMap[this.fileType] || 'FILE';
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
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;
    if (event.deltaMode === 2) delta *= 600;
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
      const el = document.querySelector('.doc-preview-panel');
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

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  saveUserGuide() {
    const payload: any = {
      category: this.userGuideForm.controls['resourceType'].value,
      code: this.userGuideForm.controls['resourceCode'].value,
      title: this.userGuideForm.controls['title'].value,
      status: this.userGuideForm.controls['status'].value,
      language: this.userGuideForm.controls['preferedLanguage'].value,
      description: this.userGuideForm.controls['description'].value,
      removeExistingFile: this.removeExistingFile || undefined,
      url: this.removeExistingFile && !this.base64Data_global ? null : undefined,
      fileAttachment: this.base64Data_global
        ? {
            base64Data: this.base64Data_global,
            fileType: this.fileType,
            createdOn: this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            createdBy: localStorage.getItem(btoa('userId'))
          }
        : null,
      publishedDate: !this.data?.id
        ? this.dateFormat.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
        : null,
      id: this.data?.id || null
    };
    this.commonService.saveUserGuide(payload).subscribe({
      next: (res: any) => {
        this.toastr.success("Success", `${res.message}`);
        this.thisDialogRef.close("confirm");
      },
      error: (error) => {
        this.toastr.error("Error", `${error.error?.message || error.message}`);
      }
    });
  }
}
