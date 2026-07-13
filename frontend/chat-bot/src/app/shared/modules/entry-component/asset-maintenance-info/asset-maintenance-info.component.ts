import { DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { CommonService, ConfigurationService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MY_FORMATS } from '../confirmation-dialog/confirmation-dialog.component';
import { FormControl } from '@angular/forms';
import { CreateAssetComponent } from '../../../../ovitag/configuration/asset/asset.component';
import { TaskManagmentComponent } from '../task-managment/task-managment.component';
import { EventStatusTrackingComponent } from '../event-status-tracking/event-status-tracking.component';
import { WorkflowService } from '../../../services/workflow.service';
import { AssignTaskComponent } from '../../../../ovitag/workflow/task/task.component';

@Component({
  selector: 'app-asset-maintenance-info',
  templateUrl: './asset-maintenance-info.component.html',
  styleUrls: ['./asset-maintenance-info.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE], useFactory: adapterFactory },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class AssetMaintenanceInfoComponent {

  public filter = new FormControl();
  public applyFilterValue: any = null;
  public length = 0;
  public pageSize: number = 50;
  public pageStart: number = 0;

  public tableData: any[] = [];
  public sortColumn = [];
  public eventColumn = ['Name', 'Identifier', 'Status', 'Assign To'];
  public iconHeader = [];
  public iconColumn = ['Schedule Start', 'Schedule End'];
  public permissionControl = ['BT_ALLE'];
  public displayedColumns: string[] = [ 'Identifier', 'Type', 'Name', 'Serial No', 'Category', 'Schedule Type', 'Assign Type', 'Assign To', 'Schedule Start', 'Schedule End', 'Status'];

  public onLoading: boolean = false;

  constructor(public datepipe: DatePipe, public configurationService: ConfigurationService, public commonService: CommonService, public dialog: MatDialog,
              @Inject(MAT_DIALOG_DATA) public data: any, public WorkflowService: WorkflowService) { }


  ngOnInit() {
    this.getMaintenanceInfo(this.data);
  }

  applyFilter(filterValue?: string) {
    this.pageStart = 0;
    if (filterValue != null && filterValue != undefined) {
      filterValue = filterValue?.trim();
      filterValue = filterValue?.toLowerCase();
      this.applyFilterValue = filterValue;
    } else {
      this.filter.setValue(null);
      this.applyFilterValue = null;
    }
  }

  getMaintenanceInfo(data?: any) {
    this.tableData = this.data;
    this.length = this.data.length;
    if (this.applyFilterValue !== null) {
      this.applyFilterValue = this.applyFilterValue + ' ';
    }

    let Columns = ['requestIdentifier', 'assetTypeName', 'entityName', 'entityIdentifier', 'activityCategoryName', 'scheduleTypeName', 'performerTypeName', 'performerName', 'scheduleStartTime', 'scheduleEndTime', 'statusName'];

    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }

  }

  eventAction(event) {
    if (event.key === 'Identifier') {
      this.openTicket(event.data);
    } else if (event.key === 'Status') {
      this.getTaskHistory(event.data);
    } else if (event.key === 'Assign To' && ['RQ-CR', 'RQ-PEN', 'RQ-SH'].includes(event.data.statusId)) {
      this.assignTo(event.data);
    } else if (event.key === 'Name') { 
      this.eventOnChanges(event.data);
    }
  }

  assignTo(data) {
    this.onLoading = true;
    this.WorkflowService.getTaskById(data.requestId).subscribe(res => {
      this.onLoading = false;
      if (res.statusCode == 1) {
        const dataInfo = res.results[0];
        dataInfo['launchType'] = "isTask";
        dataInfo['selectedTabIndex'] = null;
        const dialogRef = this.dialog.open(AssignTaskComponent, {
          data: dataInfo, height: '250px', panelClass: ['mdm-Confirmation-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => { });
      }
    });
  }

  getTaskHistory(data) {
    this.onLoading = true;
    this.WorkflowService.getTaskById(data.requestId).subscribe(res => {
      this.onLoading = false;
      if (res.statusCode == 1) {
        const dataInfo = res.results[0];
        this.dialog.open(EventStatusTrackingComponent, {
          data: dataInfo,
          panelClass: ['medium-popup'],
          disableClose: true,
        });
      }
    });
  }

  eventOnChanges(event) {
    if (event) {
      this.manageViewAction(event);
    }
  }

  manageViewAction(data) {
    this.onLoading = true;
    let rowData = null;
    this.configurationService.getAllAsset(data?.entityId).subscribe(res => {
      this.onLoading = false;
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
      }
      const dialogRef = this.dialog.open(CreateAssetComponent, {
        data: rowData,
        panelClass: ['large-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
      });
    })
  }

  openTicket(data) {
    this.onLoading = true;
    const ticketData = {
      requestId: data?.requestId,
      type: 'modify',
      requestedType: 'RQT-TKT'
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent, {
      data: ticketData,
      panelClass: ['large-popup'],
      disableClose: true,
    });
    this.onLoading = false;
    dialogRef.afterClosed().subscribe((result) => {});
  }

  fixClick() {
    console.log('')
  }

}
