import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ManagePatientRelationComponent } from '../../../shared/modules/entry-component/manage-patient-relation/manage-patient-relation.component';
import { CommonService } from '../../../shared';
import { PatientAdmitComponent } from '../../../shared/modules/entry-component/patient-admit/patient-admit.component';
import { PatientRelationDetailComponent } from './patient-relation-detail/patient-relation-detail.component';
import { PatientDeviceAssociateComponent } from './patient-device-associate/patient-device-associate.component';

@Component({
  selector: 'app-patient-relation-new',
  templateUrl: './patient-relation-new.component.html',
  styleUrls: ['./patient-relation-new.component.scss'],
  standalone:false
})
export class PatientRelationNewComponent implements OnInit {
  showAction1 = [
    { id: 'create', value: 'Create Patient Relation' },
    { id: 'createPatient', value: 'Create Patient' }
  ];
  public showActions = this.showAction1;
  tableData: any[] = [];
  selectedName: any = null;
  selectDropdown: any;
  searchText = null;

  // ── Grid config (grid-config-patientrelation) ──
  displayedColumns: string[] = [];
  columnData: string[] = [];
  iconColumn = [];
  iconHeader = [];
  eventColumn = [];

  // ── Sorting ──
  sortColumn: string = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // ── Server-side pagination ──
  prnCurrentPage = 1;
  prnPageSize = 10;
  prnPageSizeOptions = [10, 25, 50];
  prnTotalCount = 0;
  prnTotalPages = 1;

  get prnPageFrom() { return this.prnTotalCount === 0 ? 0 : (this.prnCurrentPage - 1) * this.prnPageSize + 1; }
  get prnPageTo()   { return Math.min(this.prnCurrentPage * this.prnPageSize, this.prnTotalCount); }
  get prnPages()    { return Array.from({ length: this.prnTotalPages }, (_, i) => i + 1); }

  constructor(public dialog: MatDialog, public commonService: CommonService) {}

  ngOnInit() {
    this.getDynamicTableColumn();
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('patientrelation').subscribe((res) => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.columnData = dynamicColumns.columns;
        this.iconColumn = dynamicColumns.iconColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.eventColumn = dynamicColumns.eventColumn;
        if (dynamicColumns.pageSize) {
          this.prnPageSize = dynamicColumns.pageSize;
        }
        if (dynamicColumns.pageSizeOptions) {
          this.prnPageSizeOptions = dynamicColumns.pageSizeOptions;
        }
      }
      this.loadPage();
    });
  }

  loadPage() {
    const pageStart = this.prnCurrentPage - 1;
    this.commonService.getPatientUserList(pageStart, this.prnPageSize, this.searchText).subscribe(res => {
      this.tableData = (res.results || []).map((row: any) => ({
        ...row,
        isRelation: row.isRelationShip,
        alerts: row.alertsList || []
      }));
      this.prnTotalCount = res.totalRecords ?? this.tableData.length;
      this.prnTotalPages = Math.max(1, res.totalPage ?? Math.ceil(this.prnTotalCount / this.prnPageSize));
    });
  }
  onSearch(searchValue: string) {
    console.log(searchValue)
  this.searchText = searchValue;
  this.prnCurrentPage = 1;
  this.loadPage();
}
  prnPrevPage() {
    if (this.prnCurrentPage > 1) { this.prnCurrentPage--; this.loadPage(); }
  }

  prnNextPage() {
    if (this.prnCurrentPage < this.prnTotalPages) { this.prnCurrentPage++; this.loadPage(); }
  }

  prnGoToPage(p: number) { this.prnCurrentPage = p; this.loadPage(); }

  prnOnPageSizeChange() { this.prnCurrentPage = 1; this.loadPage(); }

  // ── Unified popup entry point ──
  openPopup(row: any, initialTab: number) {
    this.showActions = null;
    this.selectedName = null;
    const dialogRef = this.dialog.open(PatientRelationDetailComponent, {
      data: { ...row, initialTab },
      panelClass: ['large-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadPage();
      this.showActions = this.showAction1;
    });
  }

  headerEventAction(event) {
    console.log(event)
    if (event.data === 'create') {
      this.createRelation();
    } else if (event.key === 'refreshPage') {
      this.loadPage();
    } else if (event.data === 'createPatient') {
      this.openPatient();
    } else if (event.key === 'applyFilter') {     
       this.onSearch(event.data);
    }
  }

  createRelation() {
    this.showActions = null;
    this.selectedName = null;
    const dialogRef = this.dialog.open(ManagePatientRelationComponent, {
      data: null, panelClass: ['large-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadPage();
      this.showActions = this.showAction1;
    });
  }

  openPatient() {
    this.showActions = null;
    this.selectedName = null;
    const dialogRef = this.dialog.open(PatientAdmitComponent, {
      panelClass: ['large-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadPage();
      this.showActions = this.showAction1;
    });
  }

  openDevice(row: any) {
    this.showActions = null;
    this.selectedName = null;
    const dialogRef = this.dialog.open(PatientDeviceAssociateComponent, {
      data: row,
      panelClass: ['small-popup'], height : '545px', width : '600px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') { this.loadPage(); }
      this.showActions = this.showAction1;
    });
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.tableData = [...this.tableData].sort((a, b) => {
      const valA = (a[column] ?? '').toString().toLowerCase();
      const valB = (b[column] ?? '').toString().toLowerCase();
      return this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  getAlertTooltip(alerts: any[]): string {
    if (!alerts?.length) return '';
    return alerts[0].message;
}
}
