import { Component,ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import { ConfigurationService, CommonService } from '../../../shared';
import {SoftwareUpdateComponent} from './../../../shared/modules/entry-component/software-update/software-update.component';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { UpgradeCertificateComponent } from '../../../shared/modules/entry-component/certificate-upgrade/upgrade-certificate.component';
import { EntityGroupComponent } from '../../../shared/modules/entry-component/entity-group/entity-group.component';
import { DatePipe } from '@angular/common';
import { StyleLoaderService } from '../../../shared/services/style-loader.service ';
import { AppToastService } from '../../../shared/services/toaster.service';
import { ReaderConfigComponent } from '../../configuration/reader/reader-config/reader-config.component';
import { ConnectivityComponent, ThresholdComponent } from '../../configuration/reader/reader.component';

@Component({
  selector: 'app-hygiene',
  templateUrl: './hygiene.component.html',
  styleUrls: ['./hygiene.component.scss']
})
export class HygieneComponent {
 selection = new SelectionModel<any>(true, []);
  public selectedName = null;
  public maxHeight: any;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = [];
  columnData: string[] = [];
  eventColumn = [];
  iconHeader = [];
  iconColumn = ['Last Updated Date'];
  sortColumn = [];
  private readonly msg: string = '';
  public activate_btn: any = [];
  public hwVersions = null;
  headercolor: string;
  pagebgcolor: string;
  public applyFilterValue: any;
  public type = 'All';
  public typeEnable = false;
  public hwForm: FormGroup;
  isDisabled: boolean = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  swVersionList: any;
  readerId: any;
  height: number;
  width: number;
  tableData: any[] = [];
  permissionControl = ['BT_ALLE','BT_CFRE'];
  selectDropdown: any;
  public selectedView = 'table';
  readerDetails: any[];
  statusInfo: any;
  public selectFilter = [{ id: "type", value: "TYPE" }];
  showAction1 = [
    { id: 'create', value: 'Create' },
    { id: 'connectivity', value: 'Connectivity' },
    { id: 'group', value: 'Group' },
    { id: 'kit', value: 'Kit Group' },
    { id: 'settings', value: 'Threshold Settings' },
    { id: 'changeFloor', value: 'Change Floor' }
  ];
  showAction2 = [
    { id: 'create', value: 'Create' },
    { id: 'connectivity', value: 'Connectivity' },
    { id: 'group', value: 'Group' },
    { id: 'kit', value: 'Kit Group' },
    { id: 'settings', value: 'Threshold Settings' },
    { id: 'changeFloor', value: 'Change Floor' }
  ];
  public showActions = this.showAction1;
  selectedData = null;
  pageSize:number=20;
  pageStart:number=0; 
  length: any = 0;
  pageHit = false;
  public isloading = false;
  dateTimeColumns = ['Last Updated Date',]
  public parentFilter = [
    {
      groupName: 'ReaderHardwareType',
      value: 'Reader HardwareType',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ]
  constructor(
    private readonly styleLoader: StyleLoaderService,
    public dialog: MatDialog,
    public snackbar: MatSnackBar,
    public commonService: CommonService,public toastr: AppToastService, public fb: FormBuilder,
    public configurationService: ConfigurationService, private readonly route: ActivatedRoute, private readonly datePipe: DatePipe) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getHwVersions();



    if(this.activate_btn && (this.activate_btn.indexOf('BT_CFRS') > -1)){
      const syncBtn = {
        id: 'sync',
        value: 'Sync'
      }
      this.showAction1.push(syncBtn);
      this.showAction2.push(syncBtn);
    }
  }

  ngOnInit() {
    this.styleLoader.loadStyleByType('leafletCss');
    this.buildForm();
    this.getDynamicTableColumn()
    this.readerType('type');

    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.pagebgcolor = '#ffffff';
    }

  }
  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('hygiene').subscribe((res) => {
      if (res.statusCode === 1) {
        console.log(res.results)
        const dynamicColumns = res.results.contentObject;
        this.displayedColumns = dynamicColumns.displayedColumns;
        this.columnData = dynamicColumns.columns
        console.log('this.displayedColumns', this.displayedColumns)
        this.iconColumn = dynamicColumns.iconColumn;
        this.eventColumn = dynamicColumns.eventColumn;
        this.sortColumn = dynamicColumns.sortColumn;
        this.iconHeader = dynamicColumns.iconHeader;
        this.pageSize = dynamicColumns.pageSize
      }
      this.getAllReaders(this.type, true, this.pageStart, this.pageSize, this.applyFilterValue, null);
    });
  }
  buildForm() {
    this.hwForm = this.fb.group({
      hardwareType: [this.type ? this.type : null]
    });
  }
  eventTriggers(event){
    this.pageStart = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
  }

  getAllReaders(type, routerEvent ?: boolean, pageStart?: any, pageSize?: any,  sText?: any, id? : any) {
    this.isloading = true;
    this.selection.clear();
    this.typeEnable = false;
    if (routerEvent) {

       this.tableData = this.route.snapshot.data.readers.results.filter(val => val.readerTypeId == 'RT-DS');
       this.readerDetails = this.tableData.map((item) => item.readerName);
       this.length = this.tableData.length;
      for (let i = 0; i <= this.columnData.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[this.columnData[i]];
          const [profit, loss] = this.getTwoPercentages();
          data['labels'] = ['Percentage'];
          data['datasets'] = [ { label: 'Non-complaince', data: [profit], type: 'bar', backgroundColor: '#86efac', borderColor: '#86efac', borderWidth: 1, barThickness: 40, stack: 'total' }, { label: 'Complaince', data: [loss], type: 'bar', backgroundColor: '#fca5a5', borderColor: '#fca5a5', borderWidth: 1, barThickness: 40, stack: 'total' } ];
          data['type'] = "bar";
          data['batteryLevel'] = this.getRandomInRange(30, 90);
          data['liquidLevel'] = this.getRandomInRange(30, 90);
          data['colors'] = [{ "borderColor": "#0073D5", "backgroundColor": "#0073D5", "hoverBorderColor": "#0073D5", "hoverBackgroundColor": "#0073D5" }]
        });
      } 
      this.isloading = false;
       this.pageHit = true;
       if (type !== 'All') {
         this.selection.clear();
         this.typeEnable = true; 
         this.configurationService.getswVersion(type).subscribe(res => {
           if (res.statusCode === 1) {
             this.swVersionList = res.results;
           }
         });
       } else {
         this.buildForm();
       }
       if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
        this.isloading = true;
        this.getReaderStatus();
       }
    } else {
      this.configurationService.getAllNewReaders( id, sText, pageStart, pageSize, type).subscribe(res => {
        this.tableData = res.results.filter(val => val.readerTypeId == 'RT-DS');
        this.length = this.tableData.length;
        this.pageHit = true;
        this.readerDetails = res.results.map((item) => item.readerName);
        for (let i = 0; i <= this.columnData.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[this.columnData[i]];
            const [profit, loss] = this.getTwoPercentages();
            data['labels'] = ['Percentage'];
            data['datasets'] = [ { label: 'Non-complaince', data: [profit], type: 'bar', backgroundColor: '#86efac', borderColor: '#86efac', borderWidth: 1, barThickness: 40, stack: 'total' }, { label: 'Complaince', data: [loss], type: 'bar', backgroundColor: '#fca5a5', borderColor: '#fca5a5', borderWidth: 1, barThickness: 40, stack: 'total' } ];
            data['type'] = "bar";
            data['batteryLevel'] = this.getRandomInRange(30, 90);
            data['liquidLevel'] = this.getRandomInRange(30, 90);
            data['colors'] = [{ "borderColor": "#0073D5", "backgroundColor": "#0073D5", "hoverBorderColor": "#0073D5", "hoverBackgroundColor": "#0073D5" }]
          });
        }
        this.isloading = false;
        if (type !== 'All') {
          this.selection.clear();
          this.typeEnable = true;        
          this.configurationService.getswVersion(type).subscribe(res => {
            if (res.statusCode === 1) {
              this.swVersionList = res.results;
            }
          });
        } else {
          this.buildForm();
        }
        if (this.commonService.tagStatusPreference?.contentObject?.battery_status_database === 'clickhouse') {
          this.isloading = true;
          this.getReaderStatus();
         }
      });
    }
  }

  getHwVersions() {
    this.configurationService.getHardwareVersions().subscribe(res => {
      this.hwVersions = res.results;

    });
  }
  getTwoPercentages(): [number, number] {
    const first = Math.floor(Math.random() * 101);
    const second = 100 - first;
    return [first, second];
  }
  getRandomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getReaderStatus() {
    let locfacility: any;
    locfacility = localStorage.getItem(btoa('facilityId')).split(',');
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const readerStatus = { entityIds: this.readerDetails, facilityList: locfacility, fromDate: currentDate };
    this.commonService.getReaderStatus(readerStatus).subscribe((res) => {
      this.statusInfo = res.results;
      for (let i in this.statusInfo) {        
        let index = this.tableData.findIndex(val => val.readerName == this.statusInfo[i]['entityId']);
        if (this.tableData[index] != null) {
            this.tableData[index]['Status'] = this.statusInfo[i]['statusValue'];
            this.tableData[index]['Last Updated Date'] = this.statusInfo[i]['statusEventDatetime'];
        }
      }
    });
    this.isloading = false;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    if (this.dataSource?.data?.length) {
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }

  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
    this.isConnected = !this.isConnected;
  }

  public isConnected: boolean = true;
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    else {
      const selection = this.selection?.selected;
      if (selection?.length > 0) {
        let val = selection[0].readerConnectivityTypeName
        selection.forEach(x => {
          if (x.readerConnectivityTypeName != val) {
            this.isConnected = false;
          }
          else {
            this.isConnected = true;
          }
        })
      }
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.selectedName = null;
    this.selectedData = null;
    this.type = 'All';
    this.parentFilter = [
      {
        groupName: 'ReaderHardwareType',
        value: 'Reader HardwareType',
        isNoneAll: true,
        selectionType: 'single',
        subFilters: [],
        defaultSelected: ['All']
      }
    ]
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    this.readerType('type');
  }

  readerType(id) {
    if (id === "type") {
      this.commonService.getAppTerms('ReaderHardwareType').subscribe(res => {
        const rowFilter = this.parentFilter.find(filter => filter.groupName === 'ReaderHardwareType'); 
        if (rowFilter) {
          rowFilter.subFilters = res.results.map(({ code, value }) => ({ code, value }));
        }
      });
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length == 0 || this.applyFilterValue.length > 2){
      this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.key === "groupFilter") {
      this.manageWorklist(event.data);
    } else if (event.data === 'create') {
      this. createNewReader('');
    } else if (event.data === 'sync') {
      this.syncReaders();
    } else if (event.data === 'connectivity') {
      this.createActivity();
    } else if (event.data === 'group' || event.data === 'kit' ) {
      this.createGroup(event.data);
    } else if (event.data === 'settings') {
      this.changethreshold(this.selectedData);
    } else if (event.data === 'changeFloor') {
      this.changeFloor();
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
      if (this.applyFilterValue) {
        this.applyFilterValue = this.applyFilterValue.trim();
        this.applyFilterValue = this.applyFilterValue.toLowerCase();
      }
      this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
    }
  }
  manageWorklist(type) {
    this.applyFilterValue = null;
    this.type = type[0].data;
    this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
  }

  createNewReader(rowData: any) {
    this.showActions = null;
    rowData = { ...rowData };
    this.selectedName = rowData.id;
    const dialogRef = this.dialog.open(ReaderConfigComponent,
      { data: rowData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
  changethreshold(data) {
    this.showActions = null;
    data = data || this.selection.selected[0];
    const dialogRef = this.dialog.open(ThresholdComponent,
    { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
  syncReaders(){
    this.showActions = null;
    let data = ''
    let identifyingType = 'Reader'
    this.configurationService.syncReader(identifyingType, data).subscribe(res => {
      this.showActions = this.showAction1;
      this.selectedName = null
      this.toastr.success('Success', `${res.message}`);
    },
    error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  changeVersion(reader, version) {
    this.readerId = Array.prototype.map.call(reader, readerId => readerId.id);
    this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Version Update', message: 'Do you want to update the version',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'isRemark': 1, 'swversionUpdate': true, 'version': version, 'id': this.readerId, 'type': 'newswVerUpdate'
      }
    });

  }
  updateVersion(data) {

    const dialogRef = this.dialog.open(SoftwareUpdateComponent,
      {data: data, panelClass: ['medium-popup'], disableClose: true });

      dialogRef.afterClosed().subscribe(results => {
      if (results === 'confirm') {
        this.getAllReaders(this.type, false, this.pageStart, this.pageSize, this.applyFilterValue, null);
      }
    });
  }

  upgradeCertificate() {
    this.dialog.open(UpgradeCertificateComponent, {
      width: '430px', height: '40%', disableClose: true,
      data: {}
    });
  }

  rowClick(data) {
    if(this.selectedName === data.id) {
      this.selectedName = null;
      this.selectedData = null;
    } else {
      this.selectedName = data.id;
      this.selectedData = data;
    }
  }

  createActivity() {
    this.showActions = null;
    const dialogRef = this.dialog.open(ConnectivityComponent,
      {
        height:'285px',
        width: '45%', disableClose: true,
        data: { name: this.selection.selected, Data: this.tableData },
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  changeFloor() {
    this.showActions = null;
    const dialogRef = this.dialog.open(ReaderConfigComponent,
      {
        panelClass: ["medium-popup"], disableClose: true,
        data: 'multiReader',
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }
  createGroup(entityGroup) {
    this.showActions = null;
    const dialogRef = this.dialog.open(EntityGroupComponent,
      {
        panelClass: ["medium-popup"], disableClose: true,
        data: { type : entityGroup == 'group' ? 'EGTI-READER' : 'EGTI-KIT'},
      });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  fixClick() {
    console.log('')
  }
}