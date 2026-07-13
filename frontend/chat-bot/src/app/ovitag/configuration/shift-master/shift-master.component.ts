import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../shared';
import { ManageShiftMasterComponent } from './manage-shift-master/manage-shift-master.component';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-shift-master',
  templateUrl: './shift-master.component.html',
  styleUrls: ['./shift-master.component.scss']
})
export class ShiftMasterComponent {

showActions1 = [{ id: 'Create', value: 'Create' }];
   showActions2 = [{ id: 'Modify', value: 'Modify' }];
   public showActions = this.showActions1;
   displayedColumns: string[] = ['ID', 'Name', 'Shift Code','Start Time', 'End Time', 'Status'];
   permissionControl = ['BT_ALLE'];
   sortColumn = [];
   iconHeader = ['ID'];
   iconColumn = ['ID','Status'];
   eventColumn = ['Name'];
   public selectedName: any = null;
   public applyFilterValue: any;
   public selectedView = "table";
   filterValue = null;
   selectDropdown: any;
   public selectedRow: any = null;
   public isloading = false;
   public tableData: any = [];
   pageSize:number =50;
   pageStart:number=0;
   length: number=0;
   timeColumns = ['Start Time', 'End Time']
   public tableVersion: any = null;

   constructor(public dialog: MatDialog, private readonly commonService: CommonService,) { }
  
   ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Name', 'Shift Code','Start Time', 'End Time', 'Status'];
      }
      this.getApi(this.pageStart,this.pageSize)
    }, 500);
   }
 
   getApi(pageStart: number, pageSize: number, name?: string) {
     this.isloading = true;
      this.commonService.getAllShift().subscribe(res => {
       this.tableData = res.results;
       this.length = res.totalRecords
       const Columns = this.tableVersion === 1
         ? ['id','shiftName', 'shiftCode','startTime', 'endTime', 'status']
         : ['shiftName', 'shiftCode','startTime', 'endTime', 'status'];
       for (let i = 0; i <= Columns.length; i++) {
         this.tableData.map(data => {
           data[this.displayedColumns[i]] = data[Columns[i]];
         });
       }
     });
     this.isloading = false;
   }
   applyFilter(filterValue: string) {
     filterValue = filterValue.trim();
     filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
     if (this.applyFilterValue.length > 2) {
       this.getApi(this.pageStart, this.pageSize, this.applyFilterValue);
     } else if (this.applyFilterValue.length == 0) {
       this.getApi(this.pageStart, this.pageSize, null);
     }
   }
   headerEventAction(event) {
     if (event.key === 'applyFilter') {
       this.applyFilter(event.data,);
     } else if (event.data === 'Create') {
       this.createapiKey(null);
     } else if (event.data === 'Modify') {
       this.createapiKey(event.keyVal);
     }else {
       this.selectedName = null;
       this.applyFilterValue = null;
       this.refreshPage();
     }
   }
 
   eventAction(event) {
     if (event.key === 'pagination') {
       this.pageSize = event.data.pageSize;
       this.pageStart = event.data.pageIndex;
       this.getApi(this.pageStart,this.pageSize, this.applyFilterValue);
      }
     }
 
   refreshPage(isAutoRefresh?: boolean) {
     this.showActions = this.showActions1;
     this.filterValue = null;
     if (isAutoRefresh === true) {
       this.applyFilterValue = null;
     }
     this.getApi(this.pageStart,this.pageSize, this.applyFilterValue)
   }
   createapiKey(data: any) {
     this.showActions = null;
     this.selectedName = data;
     const dialogRef = this.dialog.open(ManageShiftMasterComponent, {
       data: data,
       panelClass: ['small-popup'],
       disableClose: true
     });
     dialogRef.afterClosed().subscribe(() => {
       this.refreshPage();
     });
     this.showActions = null;
   }
 
   rowClick(data) {
     this.selectedName = data;
     this.showActions = this.showActions2
     }

  get shiftMasterTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      this.eventColumn, this.timeColumns
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

  get shiftMasterPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
