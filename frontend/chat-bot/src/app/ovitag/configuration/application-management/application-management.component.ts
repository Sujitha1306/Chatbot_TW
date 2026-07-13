import { Component, Inject, OnInit } from '@angular/core';
import { ConfigurationService } from '../../../shared';
import { MatTableDataSource } from '@angular/material/table';
import { routerTransition } from '../../../router.animations';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-application-management',
  templateUrl: './application-management.component.html',
  styleUrls: ['./application-management.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    routerTransition()
  ],
})
export class ApplicationManagementComponent implements OnInit {

  public permission = ['BT_ALLC'];
  public showActions = [];
  public selectDropdown = null;
  public selectedName: any = null;
  public cdkData = null
  public tableData = new MatTableDataSource<any>();
  displayedData = [
    { 'colName': 'IDs', 'title': 'IDs', 'dataName': 'IDs' }, 
    { 'colName': 'id', 'title': 'ID', 'dataName': 'id' }, 
    { 'colName': 'name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'gwMasterSubValue', 'title': 'Master Name', 'dataName': 'gwMasterSubValue' },
    { 'colName': 'versionId', 'title': 'Version', 'dataName': 'versionId' },
    { 'colName': 'isActive', 'title': 'Status', 'dataName': 'isActive' },
    { 'colName': 'twServerName', 'title': 'Deploy Server', 'dataName': 'twServerName'},
    { 'colName': 'Action', 'title': 'Action', 'dataName': 'Action' }
  ];
  displayedColumns = this.displayedData.map(res => res.colName);
  type = null;
  selectedRow = null;
  applyFilterValue: string;

  constructor(private readonly configurationService: ConfigurationService,  public dialog: MatDialog,){}

  ngOnInit(): void {
    this.getApplicationJobList(); 
  }

  cdkRowData(event: MouseEvent, data, column){
    const id = data?.gatewayId ? data?.gatewayId : data?.id;
    if (!data.close && column === 'IDs') {
      data.close = true;
    } else if (data.close && column === 'IDs'){
      data.close = false;
      this['gwId' + id]['close'] = false;
      this.selectedRow = null
    }
    if(column == 'IDs' && data?.close){
      this.cdkData = data;
      this['gwId' + id] = data;
    } else if (column !== 'IDs') {
      this.cdkData = null;
      event.stopPropagation();
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.tableData.filter = this.applyFilterValue
  }

  headerEventAction(event){
    if(event.key === "applyFilter"){
      this.applyFilter(event.data);
    } else {
      this.refreshPage()
    }
  }

  refreshPage(){
    this.selectedRow = null
    this.getApplicationJobList()
  }
  
  rowClick(data, type) {
    this.type = type;
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedRow = this.selectedName;
      this.selectDropdown = null;
    } else {
      this.selectedRow = data;
    }
    if(type === 'server'){
      if(!this.selectedRow['close']){
        this.selectedRow = null;
      }
    }
  }

  viewLicences(data) {
    const dialogRef = this.dialog.open(ManageLicencesComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true,
    });
    dialogRef.afterClosed().subscribe((results) => {
      this.refreshPage();
    });
  }

  getApplicationJobList() {
    const mapIsActive = (item: any) => {
      if (typeof item?.isActive === 'boolean') {
        item.isActive = item.isActive ? 'Active' : 'Inactive';
      }
    };

    const processTasks = (tasks: any[]) => {
      tasks.forEach(mapIsActive);
    };

    const processJobs = (jobs: any[]) => {
      jobs.forEach(job => {
        mapIsActive(job);
        if (Array.isArray(job.tasks)) {
          processTasks(job.tasks);
        }
      });
    };

    const processServers = (servers: any[]) => {
      servers.forEach(server => {
        mapIsActive(server);
        if (Array.isArray(server.jobs)) {
          processJobs(server.jobs);
        }
      });
    };

    const transformData = (dataList: any[]) => {
      dataList.forEach(data => {
        data.close = false;
        mapIsActive(data);

        if (Array.isArray(data.servers)) {
          processServers(data.servers);
        }
      });

      return dataList;
    };

    this.configurationService.getApplicationServer().subscribe(res => {
      this.tableData = new MatTableDataSource<any>(
        transformData(res.results || [])
      );
    });
  }

  fixClick() {
    console.log('');
  }

}

@Component({
  selector: 'app-manage-licences',
  templateUrl: './manage-licences.component.html',
  styleUrls: ['./application-management.component.scss'],
})
export class ManageLicencesComponent implements OnInit {
  public licenseData = []

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,){}

  ngOnInit(): void {
    this.licenseData['type'] = 'GwServer';
    this.licenseData['data'] = this.data;
  }
  
}
