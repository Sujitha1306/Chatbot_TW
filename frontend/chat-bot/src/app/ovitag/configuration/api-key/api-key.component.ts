import { Component } from '@angular/core';
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { MatDialog } from '@angular/material/dialog';
import { ManageApiKeyComponent } from './manage-api-key/manage-api-key.component';

@Component({
  selector: 'app-api-key',
  templateUrl: './api-key.component.html',
  styleUrls: ['./api-key.component.scss']
})
export class ApiKeyComponent {
showActions1 = [{ id: 'Create', value: 'Create' }];
   showActions2 = [{ id: 'Modify', value: 'Modify' }];
   public showActions = this.showActions1;
   displayedColumns: string[] = ['ID', 'Name', 'Type', 'Token','Key Status', 'Status Reason', 'Expired At'];
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
   dateTimeColumns = ['Expired At']
 
 
 
 
   constructor(public dialog: MatDialog, public configurationService: ConfigurationService,) { }
 
   ngOnInit(): void {
     this.getApi(this.pageStart,this.pageSize)
   }
 
 
   getApi(pageStart: number, pageSize: number, name?: string) {
     this.isloading = true;
     this.configurationService.getApiKey().subscribe(res => {
       this.tableData = res.results;
       console.log('this.tableData',this.tableData)
       this.length = res.totalRecords
       const Columns = ['id', 'keyName', 'keyType','token', 'status', 'statusReason', 'expiredAt',];
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
     console.log(event , 'eeeee')
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
     const dialogRef = this.dialog.open(ManageApiKeyComponent, {
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
}
