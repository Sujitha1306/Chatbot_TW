import { Component } from '@angular/core';
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserScheduleComponent } from '../../../shared/modules/entry-component/create-user-schedule/create-user-schedule.component';
import { CommonService } from '../../../shared/services/common.service';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../shared/services/toaster.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';


@Component({
  selector: 'app-user-schedule',
  templateUrl: './user-schedule.component.html',
  styleUrls: ['./user-schedule.component.scss']
})
export class UserScheduleComponent {

  public displayedColumns: string[] = ['ID', 'Name', 'Shift', 'From Date', 'To Date', 'Status'];
  public showActions1 = [{ id: 'Create', value: 'Create' }];
  public showActions2 = [{ id: 'Modify', value: 'Modify' }];

  public sortColumn = [];
  public iconHeader = ['ID'];
  public iconColumn = ['ID','Status'];
  public eventColumn = ['Name'];
  public dateColumns = ['From Date', 'To Date'];
  public permissionControl = ['BT_ALLE'];

  public selectedName: any = null;
  public filterValue: any = null;
  public selectedRow: any = null;
  public selectedIndex: any = null;
  public selectedToDate: any = null;
  public tableVersion: number = 1;
  public calendarData = null;

  public applyFilterValue: any;
  public selectDropdown: any;

  public selectedView = "table";

  public isloading = false;
  public isDateType = false;

  public tableData: any[] = [];
  public groupFilter: any[] = [];
  public dateList: any[] = [];
  public userList: any[] = [];

  public pageSize: number = 20;
  public pageStart: number = 0;
  public length: number = 0;
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public showActions = this.showActions1;
  

  constructor(public dialog: MatDialog, public configurationService: ConfigurationService, public commonService: CommonService, public datepipe: DatePipe,
              public toastr: AppToastService ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns =  ['Name', 'Shift', 'From Date', 'To Date', 'Status'];
      }
      this.getUserSchedule()
    }, 400)
  }

  getUserSchedule() {
    this.isloading = true;
    this.commonService.getEntityShifts(null, 'user', this.selectedDate, null, this.applyFilterValue, this.pageSize, this.pageStart).subscribe(res => {
      this.isloading = false;
      this.tableData = res.results;
      this.length = res.totalRecords;
      let columns = null;
      if (this.tableVersion === 2) {
        columns = ['entityName', 'shiftMasterName', 'startDate', 'endDate', 'status'];
      } else {
        columns = ['id', 'entityName', 'shiftMasterName', 'startDate', 'endDate', 'status'];
      }
      for (let i = 0; i <= columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[columns[i]];
        });
      }
    });
  }

  getDateWishShifts() {
    this.isloading = true;
    this.commonService.getDateWishShifts(this.selectedDate, this.selectedToDate, this.pageStart, this.pageSize, this.applyFilterValue, 'RO-PO').subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.userList = res.results;
        this.length = res.totalRecords;
      }
    })
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getCheckingApiCall();
    } else if (this.applyFilterValue.length == 0) {
      this.applyFilterValue = null;
      this.getCheckingApiCall();
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'Create') {
      this.createUserschedule(null);
    } else if (event.data === 'Modify') {
      this.createUserschedule(event.keyVal, 'user');
    } else if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getUserSchedule();
      if (this.selectedView === 'listView') {
        this.dateList = this.getWeekDates(this.selectedDate);
        this.selectedDate = this.dateList[0].fullDate;
        this.selectedToDate = this.dateList[6].fullDate;
      };
    } else if (event?.key === 'multiDate') {
      if (event?.data === true) {
        this.selectedToDate = null;
      } else {
        this.selectedToDate = this.datepipe.transform(this.selectedDate, 'yyyy-MM-dd');
        this.updateWeekFromEndDate(this.selectedToDate);
      }
    } else if (event?.key === 'toDateFilter') {
      this.selectedToDate = this.datepipe.transform(event?.data, 'yyyy-MM-dd')
       if (this.selectedView === 'listView') {
        this.updateWeekFromEndDate(this.selectedToDate);
      }
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
      this.getUserSchedule();
    } else if (event.key === 'Name') {
      this.createUserschedule(event.data, 'user');
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.selectDropdown = null;
    this.selectedName = null;
    this.filterValue = null;
    this.showActions = this.showActions1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getCheckingApiCall();
  }

  createUserschedule(data: any, key?) {
    if (data) {
      data['type'] = key ?? null
    }
    const dialogRef = this.dialog.open(CreateUserScheduleComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.refreshPage();
    });
    this.showActions = null;
  }

  rowClick(data) {
    if (this.selectedName && this.selectedName?.entityId === data?.entityId) {
      this.selectedName = null;
      this.showActions = this.showActions1;
    } else {
      this.showActions = this.showActions2;
      this.selectedName = data;
    }
  }

  tabClick(event) {
    this.selectedIndex = event?.tab.textLabel;
    if (this.selectedIndex === 'Schedule') {
      this.selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
      this.selectedView = 'table';
      this.isDateType = false;
      this.applyFilterValue = null;
      this.getUserSchedule();
    } else if (this.selectedIndex === 'Roaster') {
      this.isDateType = true;
      this.selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
      this.dateList = this.getWeekDates(this.selectedDate);
      this.selectedToDate = this.dateList[6].fullDate;
      this.showActions = this.showActions1;
      this.selectedView = 'listView';
      this.applyFilterValue = null;
      this.getDateWishShifts();
    } else {
      this.showActions = this.showActions1;
      this.selectedView = 'calendarView';
      this.getCalendarData();
    }
  }

  getCalendarData() {
    this.calendarData = {
      "entityId": null,
      "entityType": 'CAL-US',
      'fromDate': this.selectedDate,
      'toDate': this.selectedDate,
      'fromTime': null,
      'toTime': null,
      'status': null,
      'options': {},
      'refresh': null,
      'data' : null,
      'type': 'user',
      'groupFilter': null
    }
    this.selectedDate = null;
  }

  calendarUpdatedData(data) {
    console.log(data)
  }

  updateWeekFromEndDate(endDateValue: string) {
    if (!endDateValue) return;
    const endDate = new Date(endDateValue);
    endDate.setDate(endDate.getDate() - 6);
    this.dateList = this.getWeekDates(endDate);
    this.selectedDate = this.dateList[0]?.fullDate;
    this.selectedToDate = this.dateList[6]?.fullDate;
  }

  getWeekDates(dateValue: any) {
    const startDate = new Date(dateValue);
    const dateList: any[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);
      dateList.push({
        day: this.datepipe.transform(nextDate, 'dd'),
        weekDay: this.datepipe.transform(nextDate, 'EEEE'),
        fullDate: this.datepipe.transform(nextDate, 'yyyy-MM-dd')
      });

    }
    return dateList;
  }

  onCellClick(crew: any, date: any) {
    if (!date?.fullDate) return;

    const clickedDate = new Date(date.fullDate);
    const today = new Date();

    clickedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (clickedDate >= today) {

      const dataInfo: any = {
        selectedFromDate: this.datepipe.transform(clickedDate, 'yyyy-MM-dd'),
        selectedToDate: this.datepipe.transform(clickedDate, 'yyyy-MM-dd'),
        selectedType: 'date',
        selectedEntityId: crew?.userId,
        selectedEntityName: crew?.userName
      };

      const dialogRef = this.dialog.open(CreateUserScheduleComponent, {
        data: dataInfo,
        panelClass: ['medium-popup'],
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(() => {
        this.getDateWishShifts();
      });

    } else {
      this.toastr.warning('You cannot schedule for past dates.','Invalid Date' );
    }
  }

  changeWeek(isNext: boolean) {
    let baseDate: Date;
    if (isNext) {
      baseDate = new Date(this.selectedToDate);
      baseDate.setDate(baseDate.getDate() + 1);
    } else {
      baseDate = new Date(this.selectedDate);
      baseDate.setDate(baseDate.getDate() - 7);
    }
    this.dateList = this.getWeekDates(baseDate);
    this.selectedDate = this.dateList[0].fullDate;
    this.selectedToDate = this.dateList[6].fullDate;
    this.getDateWishShifts();
  }

  eventTrigger(key, data) {
    if (key === 'pagination') {
      this.pageSize = data.pageSize;
      this.pageStart = data.pageIndex;
      this.getDateWishShifts();
    }
  }

  getCheckingApiCall() {
    if (this.selectedIndex === 'Roaster') {
      this.userList = [];
      this.getDateWishShifts();
    } else {
      this.getUserSchedule();
    }
  }

  get scheduleTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader,
      this.eventColumn
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    typeCols: string[] = ['From Date', 'To Date', 'Status'],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (typeCols.includes(key)) def.type = key === 'Status' ? 'status' : 'date';
      return def;
    });
  }

  get schedulePaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}
