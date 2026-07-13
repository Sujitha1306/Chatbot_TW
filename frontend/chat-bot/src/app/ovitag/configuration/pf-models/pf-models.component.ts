import { Component } from '@angular/core';
import { CommonService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { PfModelsEditinfoComponent } from '../../../shared/modules/entry-component/pf-models-editinfo/pf-models-editinfo.component';

@Component({
  selector: 'app-pf-models',
  templateUrl: './pf-models.component.html',
  styleUrls: ['./pf-models.component.scss']
})
export class PfModelsComponent {

  public showActions1: any = [{ id: 'create', value: 'Create' }];
  public displayedColumns: string[] = ['Name', 'Model Type', 'Input Params', 'Output Params', 'Target Database', 'API URL', 'Entity', 'Entity Columns', 'Entity Table', 'Status'];
  public selectedView = "table";
  public permissionControl = ['BT_ALLE'];
  public eventColumn = ['Name'];
  public sortColumn = [];
  public iconHeader = [];
  public iconColumn = ['Status'];

  public tableData: any = [];

  public loading: boolean = false;

  public showActions = this.showActions1;
  public selectedName: any = null;
  public applyFilterValue: any = null;
  public selectDropdown: any;
  public pageSize: number = 50;
  public pageStart: number = 0;
  public length: number = 0;

  constructor(private commonService: CommonService, public dialog: MatDialog,) { }

  ngOnInit(): void {
    this.getPfmodels();
  }

  headerEventAction(event) {
    if (event.data === 'create') {
      this.manageActions();
    } else if (event.key === 'applyFilter') {
      this.applyFilter(event?.data);
    } else {
      this.refreshPage();
    }
  }

  manageActions(data?: any) {

    let rowData = data ? data : null;

    const dialogRef = this.dialog.open(PfModelsEditinfoComponent, {
      data: rowData, panelClass: ['medium-popup'], disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      this.showActions = [];
      this.refreshPage();
    });

  }

  applyFilter(filterValue: string) {

    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();

    this.applyFilterValue = filterValue;
    this.pageStart = 0;

    if (this.applyFilterValue.length > 2) {
      this.getPfmodels();
    } else if (this.applyFilterValue.length == 0) {
      this.getPfmodels();
    }
  }

  eventAction(event) {
    if (event.key === 'Name') {
      this.manageActions(event?.data);
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getPfmodels();
    }
  }

  getPfmodels() {
    this.loading = true;
    this.commonService.getPfmodelList(this.applyFilterValue, this.pageStart, this.pageSize).subscribe(res => {
      this.loading = false;
      this.tableData = res.results;
      this.length = res.totalRecords;
      const Columns = ['name', 'modelTypeName', 'inputParams', 'outputParams', 'targetDb', 'url', 'entity', 'entityColumn', 'entityTable', 'isActive'];
      for (let i in Columns) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  refreshPage() {
    this.pageStart = 0;
    this.showActions = this.showActions1;
    this.selectDropdown = [];
    this.applyFilterValue = null;
    this.selectedName = null;
    this.getPfmodels();
  }

}
