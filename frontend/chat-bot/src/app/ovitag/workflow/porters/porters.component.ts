import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, HospitalService } from '../../../shared';
import { BreakDialogComponent } from '../../../shared/modules/entry-component/break-dialog/break-dialog.component';
import { CreateUserComponent } from '../../../shared/modules/entry-component/create-user/create-user.component';
import { CoasterComponent } from '../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';

@Component({
  selector: 'app-porters',
  templateUrl: './porters.component.html',
  styleUrls: ['./porters.component.scss']
})
export class PortersComponent {
  showActions1 = [{ id: 'Create', value: 'Create' }];
  showActions2 = [{ id: 'Modify', value: 'Modify' }];
  public showActions = this.showActions1;
  displayedColumns: string[] = ['Device', 'Name', 'Porter ID', 'Role', 'Current Location', 'Schedule', 'Porter Pool / Location', 'Status', 'Break Status'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['Device'];
  iconColumn = ['Device'];
  eventColumn = ['Schedule', 'Device', 'Name'];
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
  genderList: any;
  userPoolList: any[];
  locationPoolList: any;
  selectedGender = ['All'];
  selectedPool = ['All'];
  selectedPoolLoc = ['All'];
  parentFilter = [
    {
      id: 'porterGender',
      value: 'Gender',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'porterPool',
      value: 'Porter Pool',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    },
    {
      id: 'poolLocation',
      value: 'Pool Location',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ];

  constructor(public dialog: MatDialog, public hospitalService: HospitalService, public commonService: CommonService,) { }

  ngOnInit(): void {
    this.getUser();
    this.getMTeamFilterOpt();
  }

  getUser(name?: string) {
    let selectedPool = null;
    let selectedPoolLoc = null;
    let selectGender = null
    this.isloading = true;
    if(this.selectedGender[0] === 'All') {
      selectGender = null;
    } else {
      selectGender = this.selectedGender[0];
    }
    if(this.selectedPool[0] === 'All'){
      selectedPool = null;
    } else {
      selectedPool = this.selectedPool[0]
    }

    if(this.selectedPoolLoc[0] === 'All'){
      selectedPoolLoc = null;
    } else {
      selectedPoolLoc = this.selectedPoolLoc[0]
    }

    this.hospitalService.getAllUsers(null, 'RO-PO', this.applyFilterValue, this.pageStart, this.pageSize,  selectGender, selectedPool, selectedPoolLoc).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords
      const Columns = ['tagId', 'fullName', 'id', 'roleName', 'currentLocationName', 'shiftName', 'poolNameLocation', 'requestDetailStatusValue', 'breakId'];
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
      this.getUser(this.applyFilterValue);
    } else if (this.applyFilterValue.length == 0) {
      this.getUser(null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
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
      this.getUser(this.applyFilterValue);
    } else if (event.key == "addBreak") {
      this.addBreak(event);
    } else if (event.key === 'Schedule') {
      event['data']['selectedTab'] = 'Schedule';
      this.createUser(event);
    } else if (event?.key === 'Name') {
      this.createUser(event);
    } else if (event.key === "Device") {
      this.manageCoster(event.data);
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showActions1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getUser(this.applyFilterValue)
  }


  rowClick(data) {
    this.selectedName = data;
    this.showActions = this.showActions2
  }
  getMTeamFilterOpt(){
    this.commonService.getAppTermsVerion2('Gender').subscribe(res => {
      this.genderList  = res.results;
      const genderFilter = this.parentFilter.find(f => f.id === 'porterGender')
      if(genderFilter){
        genderFilter.subFilters = this.genderList;
      }
    });
    this.commonService.getAppTermsVerion2('PoolName').subscribe(res => {
      this.userPoolList = res.results;
      const poolNameFilter = this.parentFilter.find(f => f.id === 'porterPool')
      if(poolNameFilter){
        poolNameFilter.subFilters = this.userPoolList
      }
    });
    this.commonService.getAppTermsVerion2('PoolLocation').subscribe(res => {
      this.locationPoolList = res.results;
      const poolLocFilter = this.parentFilter.find(f => f.id === 'poolLocation')
      if(poolLocFilter){
        poolLocFilter.subFilters = this.locationPoolList
      }
    });
  }

  manageGroupFilter(event) {
      let mtFilterData = event.data
      this.selectedGender = mtFilterData.filter(item => item.id === 'porterGender').map(code => code.data);
      this.selectedPool = mtFilterData.filter(item => item.id === 'porterPool').map(code => code.data);
      this.selectedPoolLoc = mtFilterData.filter(item => item.id === 'poolLocation').map(code => code.data);
      this.getUser()
  }
  addBreak(event) {
    let data = event.data;
    const dialogRef = this.dialog.open(BreakDialogComponent, {
      panelClass: ['mdm-Confirmation-popup'], disableClose: true,
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage()
    });
  }
  createUser(event) {
    const data = event.data;
    data['type'] = 'user';
    data['sizeType'] = 'medium';
    const dialogRef = this.dialog.open(CreateUserComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.selectDropdown = null;
      this.refreshPage();
    });
  }
  manageCoster(data) {
    data['workflowTypeId'] = 'WF-STF';
    data['associationId'] = data.id;
    data['associationTypeId'] = data.associationTypeId ? data.associationTypeId : 'TAT-PO';
    data['associatedName'] = data.associationTypeId == 'TAT-PO' ? 'Porter' : 'User';
    data['tag_type_name'] = data.associationTypeId == 'TAT-PO' ? 'Porter' : 'User';
    const dialogRef = this.dialog.open(CoasterComponent, {
      data: data,
      panelClass: ["small-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === "confirm") {
        this.refreshPage();
      }
    });
  }
}
