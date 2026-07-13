import { Component } from '@angular/core';
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../shared';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';

@Component({
  selector: 'app-user-preferences',
  templateUrl: './user-preferences.component.html',
  styleUrls: ['./user-preferences.component.scss']
})
export class UserPreferencesComponent {
showActions1 = [{ id: 'Create', value: 'Create' }];
   showActions2 = [{ id: 'Modify', value: 'Modify' }];
   public showActions = this.showActions1;
   displayedColumns: string[] = [ 'ID', 'Key Name', 'Value', 'CreatedOn', 'ModifiedOn','Action'];
   permissionControl = ['BT_ALLE'];
   sortColumn = [];
   iconHeader = ['ID'];
   iconColumn = ['ID','Status','Action'];
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
    dateTimeColumns = ['CreatedOn','ModifiedOn',]
    public tableVersion: any = null;

    constructor(public dialog: MatDialog, public configurationService: ConfigurationService,private readonly commonService: CommonService,public  toastr: AppToastService) { }
  
    ngOnInit(): void {
      setTimeout(() => {
        this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
        if (this.tableVersion === 2) {
          this.displayedColumns = ['Key Name', 'Value', 'CreatedOn', 'ModifiedOn', 'Action'];
        }
        this.getUserPreference()
      }, 500);
    }
    getUserPreference() {
      this.isloading = true;
      let roleId = localStorage.getItem('userlevel');
      let userId = localStorage.getItem(btoa('userId'));
      this.commonService.getPreference(userId, roleId).subscribe(res => {
        const dataMap = (item: any) => {
          const obj: any = {
            'Key Name': item.key,
            'Value': item.value.value,
            'CreatedOn': item.value.createdOn,
            'ModifiedOn': item.value.modifiedOn
          };
          if (this.tableVersion === 1) {
            obj['ID'] = item.value.id;
          }
          return obj;
        };
        this.tableData = Object.entries(res.results)
          .filter(([_, value]: any) => typeof value === 'object' && value !== null)
          .map(([key, value]: any) => dataMap({ key, value }));

        this.length = this.tableData.length;
      });
      this.isloading = false;
    }

   applyFilter(filterValue: string) {
     filterValue = filterValue.trim();
     filterValue = filterValue.toLowerCase();
     this.applyFilterValue = filterValue;
     this.pageStart = 0;
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
      this.getUserPreference();
    } else if (event.key === 'Delete') {
      this.deleteUserPref(event.data)
    }
  }
 
   refreshPage(isAutoRefresh?: boolean) {
     this.showActions = this.showActions1;
     this.filterValue = null;
     if (isAutoRefresh === true) {
       this.applyFilterValue = null;
     }
     this.getUserPreference()
   }
   createapiKey(data: any) {
     this.showActions = null;
     this.selectedName = data;
    //  const dialogRef = this.dialog.open(ManageApiKeyComponent, {
    //    data: data,
    //    panelClass: ['small-popup'],
    //    disableClose: true
    //  });
    //  dialogRef.afterClosed().subscribe(() => {
    //    this.refreshPage();
    //  });
     this.showActions = null;
   }
 
   rowClick(data) {
     this.selectedName = data;
     this.showActions = this.showActions2
     }

  get userPreferencesTwColumns(): TwColumnDef[] {
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

  get userPreferencesPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }

  deleteUserPref(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        title: "Confirm Delete", message: "Are you sure you want to delete?",
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] == 'Yes') {
        this.commonService.deleteUserPreferenceId(data['Key Name']).subscribe({
          next: (res: any) => {
            this.toastr.success(res.message)
          },
          error: (err: any) => {
            this.toastr.error(err.message)
          }
        });
        this.getUserPreference();
      }
    });
  }
}
