import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
import { MY_FORMATS } from '../../../app.module';
import { ConfigurationService } from '../../../shared/services/configuration.service';
import { CommonService } from '../../../shared/services/common.service';
import { MatDialog } from '@angular/material/dialog';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CreateAssetComponent } from '../../configuration/asset/asset.component';
import { WorkflowService } from '../../../shared/services/workflow.service';
import { AssignTaskComponent } from '../task/task.component';
import { PrintStickerComponent } from '../print-sticker/print-sticker.component';
import { CreateManageRoutineComponent } from '../../../shared/modules/entry-component/create-manage-routine/create-manage-routine.component';
import { TaskManagmentComponent } from '../../../shared/modules/entry-component/task-managment/task-managment.component';
import { LookupTermService } from '../../../shared/lookup-term.service';
import { ExcelService } from '../../../shared/services/excel.service';
// import { ManageAstROUMaintennaceComponent } from '../../../shared/modules/entry-component/manage-ast-rou-maintennace/manage-ast-rou-maintennace.component';

@Component({
  selector: 'app-asset-maintenance',
  templateUrl: './asset-maintenance.component.html',
  styleUrls: ['./asset-maintenance.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE], useFactory: adapterFactory  },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class AssetMaintenanceComponent {

  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  public selectedToDate = null;
  public selectedView = "table";
  public enableMultiView = true;
  public ipView = null;
  public calendarData = null;
  public applyFilterValue: any = null;
  public selectDropdown: any;
  public selectedName: any[] = [];
  public length = 0;
  public pageSize: number = 50;
  public pageStart: number = 0;
  public loading = signal(false);
  public isDateType: boolean = false;
  public isloadDepartmentBasedAssetType: boolean = false;
  public isloadDepartmentBasedAssetCategory: boolean = false;
  public calendarUserpreference: boolean = true;
  public configPreferenceData = null
  public isYearly: boolean = false;
  public departmentId: any[] = null;
  public assetTypeIds: any[] = null;
  public assetCategoryIds: any[] = null;
  public activityCategoryIds: any[] = null;
  public frequencyIds: any[] = null;
  public assetstatus: any[] = null;
  public statusList: any[] = null;
  public isOwnedDepartment = null;
  public isAssignedDepartment  = null;
  public dynamicColumns = null;
  public identitydata = null;
  public isMyAsset = null;
  public isMyDepartment= null;
  public responseColumns: any[] = [];
  public tableData: any[] = [];
  public maintenanceCode: any[] = [
    { "key": "AC-AMC", "name": "AMC" },
    { "key": "AC-CAL", "name": "Calibration" },
    { "key": "AC-COR", "name": "Corrective" },
    { "key": "AC-EST", "name": "Electrical Safety Test" },
    { "key": "AC-PMS", "name": "PMS" }
  ];
  public showActions1 = [{ id: 'manageAsset', value: 'Manage Asset'},{id: 'createMaintenance', value: 'Create Maintenance'}]; //{ id: 'manageMaintenance', value: 'Manage Maintenance'}
  public showActions2 = [];
  public showAction3 =  [{id: 'createMaintenance', value: 'Create Maintenance'}]; // {id: 'manageMaintenance', value: 'Manage Maintenance'}
  public showActions = [];
  public iconHeader = ['select'];
  public iconColumn = ['select', 'AMC', 'PMS', 'Calibration', 'Corrective'];
  public sortColumn = [];
  public eventColumn = ['Asset Name'];
  public permissionControl = ['BT_ALLE'];
  public displayedColumns: string[] = ['select', 'Asset Type', 'Major Type', 'Minor Type', 'Asset Category', 'Asset Serial No', 'Asset Name', 'Owned Department', 'Used By Department', 'Location', 'Status', 'AMC', 'PMS', 'Calibration', 'Corrective'];
  public fixedColumns = [];
  public parentFilter = [
    {
      id: 'asset',
      value: 'ASSET',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myAsset', value: 'My Asset' }, { code: 'myDepartment', value: 'My Department' }],
      defaultSelected: ['myDepartment' ],
      showLabel: true,
      dependentFilter:['my department','ownership']
    },
    {
      id: 'assetType',
      value: 'ASSET TYPE',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'activitycategory',
      value: 'ACTIVITY CATEGORY',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'frequency',
      value: 'FREQUENCY',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
     {
      id: 'status',
      value: 'STATUS',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
    },
    {
      id: 'assetcategory',
      value: 'ASSET CATEGORY',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
     {
      id: 'assetstatus',
      value: 'ASSET STATUS',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
    }
  ];
  excelDisplayedColumns: any;
  excelResponseColumns: any[];



  constructor(public datepipe: DatePipe, public configurationService: ConfigurationService, public commonService: CommonService,  public dialog: MatDialog,
              public WorkflowService: WorkflowService, public lookupService : LookupTermService ,  private readonly excelService: ExcelService) {
    this.getPermissionDropDown();
    this.getDynamicTableColumn();
  }

  getFilterData() {


    let departmentFilter, ownershipFilter;
    ownershipFilter = this.parentFilter.find(filter => filter.id === 'ownership');
    const userId = localStorage.getItem('dXNlcklk');
    this.commonService.getUserDepartmentLink(userId).subscribe(res => {
      if (res.statusCode === 1 && Array.isArray(res.results) && res.results.length > 0) {
        const myDepartmentFilter = {
          id: 'my department',
          value: 'MY DEPARTMENT',
          isAll: false,
          selectionType: 'multi',
          subFilters: [],
          defaultSelected: [],
          enableEmpty: false,
          dependentFilter :[],
          showLabel:false
        };
        const ownershipFilter = {
          id: 'ownership',
          value: 'OWNERSHIP',
          isAll: false,
          selectionType: 'multi',
          subFilters: [{ code: 'owned', value: 'Owned' }, { code: 'assigned', value: 'Assigned' }],
          defaultSelected: ['owned', 'assigned'],
          enableEmpty: false
        };
        this.parentFilter.splice(1, 0, myDepartmentFilter, ownershipFilter);
        departmentFilter = this.parentFilter?.find(filter => filter.id === 'my department');
        departmentFilter.subFilters = res.results?.map(({ departmentId, departmentName }) => ({ code: departmentId, value: departmentName }));
      }
      if (this.departmentId != null) {
        departmentFilter.defaultSelected = this.departmentId;
        if (this.isOwnedDepartment) {
          ownershipFilter?.defaultSelected.push('owned');
        }
        if (this.isAssignedDepartment) {
          ownershipFilter?.defaultSelected.push('assigned');
        }
      } else {
        departmentFilter.defaultSelected = departmentFilter?.subFilters.map(item => item.code);
        this.departmentId = departmentFilter?.subFilters.map(item => item.code);
        if (ownershipFilter) {
          ownershipFilter.defaultSelected = ownershipFilter?.subFilters.map(item => item.code);
        }
        this.isOwnedDepartment = true;
        this.isAssignedDepartment = true;
      }
       if (this.isloadDepartmentBasedAssetType) {
        departmentFilter.dependentFilter.push('assetType');
        departmentFilter.isLoadSubFilters = true;
      }

       if (this.isloadDepartmentBasedAssetCategory) {
        departmentFilter.dependentFilter.push('assetCategory');
        departmentFilter.isLoadSubFilters = true;
      }
    });
    // setTimeout(() => { this.getEntityMaintenance()}, 500)
    this.checkUserPreference();
  }

  loadAssetTypeFilter() {
    return new Promise<void>((resolve) => {
      const departmentIds = localStorage.getItem(btoa('departmentIds'));
      const assetTypeFilter = this.parentFilter.find(filter => filter.id === 'assetType');
      if (!assetTypeFilter) return resolve();
      const applyDefaultSelection = () => {
        if (this.assetTypeIds != null) {
          assetTypeFilter.defaultSelected = this.assetTypeIds;
        }
      };
      if (departmentIds && this.isloadDepartmentBasedAssetType) {
        this.configurationService.getEntityform(departmentIds, 'department', 'Filter').subscribe(res => {
          assetTypeFilter.subFilters = res?.results?.filter(u => u?.identifyingType === 'AssetType').map(u => ({ code: u?.identifyingValue,value: u?.identifyingValueName })) || [];
          applyDefaultSelection();
          resolve();
        });
      } else {
        this.lookupService.getAppTermsWrapper('AssetType').subscribe(res => {
          assetTypeFilter.subFilters = res?.AssetType?.map(({ code, value }) => ({ code, value })) || [];
          applyDefaultSelection();
          resolve();
        });
      }
    });
  }

  loadAssetCategoryFilter() {
    return new Promise<void>((resolve) => {
      const departmentIds = localStorage.getItem(btoa('departmentIds'));
      const assetCategoryFilter = this.parentFilter.find(filter => filter.id === 'assetcategory');
      const activateCategoryFilter = this.parentFilter.find(filter => filter.id === 'activitycategory');
      const statusListFilter = this.parentFilter.find(filter => filter.id === 'status');
      const frequencyFilter = this.parentFilter.find(filter => filter.id === 'frequency');
      const assetstatusFilter = this.parentFilter.find(filter => filter.id === 'assetstatus')
      if (!activateCategoryFilter || !assetCategoryFilter || !statusListFilter || !frequencyFilter || !assetstatusFilter) {
        resolve();
        return;
      }
      const applyDefaultSelection = () => {
        if (this.assetCategoryIds != null) {
          assetCategoryFilter.defaultSelected = this.assetCategoryIds;
        }
         if (this.activityCategoryIds != null) {
          activateCategoryFilter.defaultSelected = this.activityCategoryIds;
        }
        if (this.statusList != null) {
          statusListFilter.defaultSelected = this.statusList;
        }
        if (this.frequencyIds != null) {
          frequencyFilter.defaultSelected = this.frequencyIds;
        }
        if (this.assetstatus != null) {
          assetstatusFilter.defaultSelected = this.assetstatus;
        }
      };
      if (departmentIds && this.isloadDepartmentBasedAssetCategory) {
        this.configurationService.getEntityform(departmentIds, 'department', 'Filter').subscribe(res => {
          assetCategoryFilter.subFilters = res?.results?.filter(u => u?.identifyingType === 'assetcategory').map(u => ({ code: u?.identifyingValue, value: u?.identifyingValueName })) || [];
          applyDefaultSelection();
          resolve();
        });
      } else {
        this.lookupService.getAppTermsWrapper('AssetCategory').subscribe(res => {
          const assetCategoryFilter = this.parentFilter.find(filter => filter.id === 'assetcategory');
          if (assetCategoryFilter) {
            assetCategoryFilter.subFilters = res.AssetCategory.map(({ code, value }) => ({ code, value }));
            applyDefaultSelection();
            resolve();
          }
        });
        this.lookupService.getAppTermsWrapper('RequestStatus').subscribe(res => {
          const statusFilter = this.parentFilter.find(filter => filter.id === 'status');
          if (statusFilter) {
            const statusCode = ["RQ-CR" , "RQ-PEN", "RQ-CO", "RQ-SH", "RQ-CA"]
            const statusFilterList = res.RequestStatus.filter(res => statusCode.includes(res.code) )
            statusListFilter.subFilters = statusFilterList.map(({ code, value }) => ({ code, value }));
            applyDefaultSelection();
            resolve();
          }
        });

        this.lookupService.getAppTermsWrapper('ScheduleType').subscribe(res => {
          const frequencyFilter = this.parentFilter.find(filter => filter.id === 'frequency');
          if (frequencyFilter) {
            frequencyFilter.subFilters = res.ScheduleType.map(({ code, value }) => ({ code, value }));
            applyDefaultSelection();
            resolve();
          }
        });

        this.lookupService.getAppTermsWrapper('AssetStatus').subscribe(res => {
          const assetStatusFilter = this.parentFilter.find(filter => filter.id === 'assetstatus');
          if (assetStatusFilter) {
            assetStatusFilter.subFilters = res.AssetStatus.map(({ code, value }) => ({ code, value }));
            applyDefaultSelection();
            resolve();
          }
        });

        if (activateCategoryFilter) {
          activateCategoryFilter.subFilters = this.maintenanceCode.map(({ key, name }) => ({ code : key, value : name }));
          applyDefaultSelection();
          resolve();
        }
      }
    })
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('assetmaintenance').subscribe(res => {
      if (res.statusCode === 1) {
        const roleId = localStorage.getItem('roleId');
        if (roleId && res?.results?.contentObject?.role && res.results.contentObject.role[roleId]) {
          this.dynamicColumns = res.results.contentObject.role[roleId];
        } else {
          this.dynamicColumns = res.results.contentObject;
        }
        this.displayedColumns = this.dynamicColumns.displayedColumns;
        this.iconColumn = this.dynamicColumns.iconColumn;
        this.eventColumn = this.dynamicColumns.eventColumn;
        this.sortColumn = this.dynamicColumns.sortColumn;
        this.iconHeader = this.dynamicColumns.iconHeader;
        this.responseColumns = this.dynamicColumns.dataColumns;
        this.maintenanceCode = this.dynamicColumns.maintenanceCode;
        this.isloadDepartmentBasedAssetType = this.dynamicColumns.isLoadDepartmentBasedAssetType;
        this.isloadDepartmentBasedAssetCategory = this.dynamicColumns.isLoadDepartmentBasedAssetCategory;
        this.fixedColumns = this.dynamicColumns.fixedColumns;  
        this.calendarUserpreference = this.dynamicColumns.calendarUserpreference;
        if(this.dynamicColumns?.excel) {
          this.excelDisplayedColumns = this.dynamicColumns?.excel?.displayedColumns;
          this.excelResponseColumns =this.dynamicColumns?.excel?.dataColumns;
        } else {
          this.excelDisplayedColumns = this.dynamicColumns?.displayedColumns;
          this.excelResponseColumns = this.dynamicColumns?.dataColumns;
        } 
      }
      this.loadAssetTypeFilter();
      this.loadAssetCategoryFilter();
    });
    this.checkUserPreference();
    this.getFilterData();
  }

  getChangeColums() {
    if (!this.isYearly) {
      this.displayedColumns = this.dynamicColumns.displayedColumns;
      this.iconColumn = this.dynamicColumns.iconColumn;
      this.eventColumn = this.dynamicColumns.eventColumn;
      this.sortColumn = this.dynamicColumns.sortColumn;
      this.iconHeader = this.dynamicColumns.iconHeader;
      this.responseColumns = this.dynamicColumns.dataColumns;
      this.maintenanceCode = this.dynamicColumns.maintenanceCode;
      this.isloadDepartmentBasedAssetType = this.dynamicColumns.isLoadDepartmentBasedAssetType;
      this.isloadDepartmentBasedAssetCategory = this.dynamicColumns.isLoadDepartmentBasedAssetCategory;
      this.fixedColumns = this.dynamicColumns.fixedColumns;
      if(this.dynamicColumns?.excel) {
        this.excelDisplayedColumns = this.dynamicColumns?.excel?.displayedColumns;
        this.excelResponseColumns =this.dynamicColumns?.excel?.dataColumns;
      } else {
        this.excelDisplayedColumns = this.dynamicColumns?.displayedColumns;
        this.excelResponseColumns = this.dynamicColumns?.dataColumns;
      } 
    } else {
      this.displayedColumns = this.dynamicColumns.yearsDisplayedColumns;
      this.iconColumn = this.dynamicColumns.iconColumn;
      this.eventColumn = this.dynamicColumns.eventColumn;
      this.sortColumn = this.dynamicColumns.sortColumn;
      this.iconHeader = this.dynamicColumns.iconHeader;
      this.responseColumns = this.dynamicColumns.yearsdataColumns;
      this.maintenanceCode = this.dynamicColumns.maintenanceCode;
      this.isloadDepartmentBasedAssetType = this.dynamicColumns.isLoadDepartmentBasedAssetType;
      this.isloadDepartmentBasedAssetCategory = this.dynamicColumns.isLoadDepartmentBasedAssetCategory;
      this.fixedColumns = this.dynamicColumns.fixedColumns;
      if(this.dynamicColumns?.excel) {
        this.excelDisplayedColumns = this.dynamicColumns?.excel?.yearsDisplayedColumns;
        this.excelResponseColumns =this.dynamicColumns?.excel?.yearsdataColumns;
      } else {
        this.excelDisplayedColumns = this.dynamicColumns?.yearsDisplayedColumns;
        this.excelResponseColumns = this.dynamicColumns?.yearsdataColumns;
      } 
    }
  }

  getPermissionDropDown(){
    const permission = JSON.parse(localStorage.getItem('permission'));
    const dropdown = permission?.dropdown || [];
    const printerStickerActions = dropdown?.filter(item => item.code ==='WD_AL_PS')
    const mapAction = (list) =>list.map(x => ({ id: x.code, value: x.name }));
    this.showActions2.push(...mapAction(printerStickerActions));
    this.showActions = this.showActions2;
  }

  headerEventAction(event) {
    if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      if (event.keyValue === 'single') {
        this.selectedToDate = null;
      }
      this.isYearly = false;
      this.saveUserPreference();
       if (this.selectedView === 'table') {
        this.getChangeColums();
        this.getEntityMaintenance();
      } else {
        this.getCalendarViewData();
      }
    } else if (event.key === 'manageView') {
      this.selectedView = event.keyVal;
      if (event?.keyVal === 'calendarView') {
      // this.getCalendarViewData();
      }
    } else if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.key === 'manageAction') {
      if (event.data === 'WD_AL_PS') {
        this.stickerView();
      } else if (event.data === 'manageAsset' && event.keyVal.length === 1) {
        this.manageViewAction(this.selectedName[0]);
      } else if (event.data === 'manageMaintenance') {
        // this.manageMaintenance(event.keyVal);
      } else {
        this.createRoutinData(event.keyVal, event.data);
      }
    } else if (event.key === 'multiDate') {
      if (this.isYearly) {
        this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
      }
      this.isYearly = false;
      this.selectedToDate = !event?.data ? this.getMonthDateChange(this.selectedDate) : null;
      this.saveUserPreference();
      if (this.selectedView === 'table') {
        this.getChangeColums();
        this.getEntityMaintenance();
      } else {
        this.getCalendarViewData();
      }
    } else if (event.key === 'toDateFilter') {
      this.selectedToDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.saveUserPreference();
       if (this.selectedView === 'table') {
          this.getChangeColums();
          this.getEntityMaintenance();
        } else {
          this.getCalendarViewData();
        }
    } else if (event.key === 'yearFilter') {
      this.isYearly = true;
      let year = event.data;
      const { start, end } = this.getYearDates(year);
      this.selectedDate = this.datepipe.transform(start, 'yyyy-MM-dd');
      this.selectedToDate = this.datepipe.transform(end, 'yyyy-MM-dd');
      this.saveUserPreference();
       if (this.selectedView === 'table') {
          this.getChangeColums();
          this.getEntityMaintenance();
        } else {
          this.getCalendarViewData();
        }

    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else if(event.key === 'downloadExcel') {
        this.downloadExcel();
    } else {
      this.refreshPage();
    }
  }

  manageGroupFilter(event) {
    let filterInfo = event.data
    let department = filterInfo.filter(filter => filter.id === 'my department').map(code => code.data);
    let asset = filterInfo.filter(filter => filter.id === 'asset').map(code => code.data);
    let assetType = filterInfo.filter(filter => filter.id === 'assetType').map(code => code.data);
    let ownership = filterInfo.filter(filter => filter.id === 'ownership').map(code => code.data);
    let status = filterInfo.filter(filter => filter.id === 'status').map(code => code.data);
    this.statusList = status ?? null;
    let assetcategory = filterInfo.filter(filter => filter.id === 'assetcategory').map(code => code.data);
    let activityCategory = filterInfo.filter(filter => filter.id === 'activitycategory').map(code => code.data);
    let frequency = filterInfo.filter(filter => filter.id === 'frequency').map(code => code.data);
    let assetstatus = filterInfo.filter(filter => filter.id === 'assetstatus').map(code => code.data);
    this.assetstatus = assetstatus.length ? assetstatus : null;
    this.frequencyIds = frequency.length ? frequency : null;
    this.assetCategoryIds = assetcategory.length ? assetcategory : null;
    this.activityCategoryIds = activityCategory.length ? activityCategory : null;
    this.isOwnedDepartment = ownership.includes('owned') ? true : null;
    this.isAssignedDepartment = ownership.includes('assigned') ? true : null;
    this.isMyAsset = asset.includes('myAsset') ? true : null;
    this.assetTypeIds = assetType.length ? assetType : null;
    let departmentIds = department.filter(val => val !== 'owned' && val !== 'assigned');
    this.departmentId = departmentIds.map(id => parseInt(id, 10));
    this.isMyDepartment = asset.includes('myDepartment') && departmentIds?.length > 0 ? true : null;
    if (this.selectedView === 'table') {
      setTimeout(() => { this.getEntityMaintenance() }, 500);
    } else {
      setTimeout(() => { this.getCalendarViewData('filter') }, 500);
    }

    if ((this.selectedView === 'calendarView' && this.calendarUserpreference) || (this.selectedView === 'table' && !this.calendarUserpreference)) {
      this.saveUserPreference();
    }
  }

  stickerView() {
    this.showActions = null;
    const printData = {
      groupFilterData: {
        isMyAsset: this.isMyAsset,
        isMyDepartment: this.isMyDepartment,
        assetTypeIds: this.assetTypeIds,
        isOwnedDepartment: this.isOwnedDepartment,
        isAssignedDepartment: this.isAssignedDepartment,
        departmentId: this.departmentId,
        assetCategoryIds: this.assetCategoryIds,
        activityCategoryIds: this.activityCategoryIds,
        frequency: this.frequencyIds,
        assetstatus: this.assetstatus,
        statusList: this.statusList,
        selectedDate: this.selectedDate,
        selectedToDate: this.selectedToDate,
        pageSize: null,
        pageStart: null,
        isYearly : this.isYearly
      },
      type: 'AssetMaintenance'
    };
    const dialogRef = this.dialog.open(PrintStickerComponent,
      { data: printData, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  createRoutinData(data, key) {
    const newData = data.map(item => ({ ...item, select: true, startDate: this.selectedDate }));
    data = newData;
    let dataInfo = {
      entityById: null,
      entityData: data ?? [],
      isMulti: true,
      routineTypeId: 'ROU-ASM',
      tabType: 'Asset',
      dynamicHeader: key === 'manageMaintenance' ? 'Manage Maintenance' : 'Create Maintenance',
      dynamicLabel: true
    };
    const dialogRef = this.dialog.open(CreateManageRoutineComponent,
      { data: dataInfo, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
    });
  }

  saveUserPreference() {
    let preferenceData = {
      "isMyAsset": this.isMyAsset,
      "isMyDepartment": this.isMyDepartment,
      "assetTypeIds": this.assetTypeIds,
      "isOwnedDepartment": this.isOwnedDepartment,
      "isAssignedDepartment": this.isAssignedDepartment,
      "assetcategory": this.assetCategoryIds,
      "activityCategory": this.activityCategoryIds,
      "departmentIds": this.departmentId,
      "frequency": this.frequencyIds,
      "assetstatus": this.assetstatus,
      "status": this.statusList,
      "selectedToDate": this.selectedToDate
    };
    let lastData = JSON.stringify(preferenceData);
    this.commonService.validateUserPreference('AssetMaintenance', lastData)
  }

  checkUserPreference() {
    if (this.commonService.userPreference?.hasOwnProperty('AssetMaintenance')) {
      this.updateFilters()
    } else {
      this.commonService.validateUserPreference('AssetMaintenance');
      setTimeout(() => { this.updateFilters() }, 2000);
    }
  }

  updateFilters() {
    if (this.commonService.userPreference?.hasOwnProperty('AssetMaintenance')) {
      let preferenceData = this.commonService.userPreference.AssetMaintenance.value;
      preferenceData = JSON.parse(preferenceData);
      this.isMyAsset = preferenceData?.isMyAsset;
      this.isMyDepartment = preferenceData?.isMyDepartment;
      this.assetTypeIds = preferenceData?.assetTypeIds;
      this.isOwnedDepartment = preferenceData?.isOwnedDepartment;
      this.isAssignedDepartment = preferenceData?.isAssignedDepartment;
      this.assetCategoryIds = preferenceData?.assetcategory;
      this.statusList = preferenceData?.status;
      this.activityCategoryIds = preferenceData?.activityCategory;
      this.frequencyIds = preferenceData?.frequency;
      this.assetstatus = preferenceData?.assetstatus;
      this.departmentId = preferenceData?.departmentIds;
      this.selectedToDate = preferenceData?.selectedToDate;;
      if (this.selectedToDate) {
        this.selectedToDate = null;
        // this.selectedToDate = this.datepipe.transform(this.selectedToDate, 'yyyy-MM-dd');
        // this.isDateType = false;
      } else {
        this.selectedToDate = null;
      }
      this.setFilterDefaultSelection(preferenceData);
    }
    setTimeout(() => {
      if (this.selectedView === 'table') {
        this.getEntityMaintenance();
      } else {
        this.getCalendarViewData();
      }
    }, 1000);
  }

  setFilterDefaultSelection(preferenceData: any) {
    const filtersBy = ['asset', 'my department', 'assetType', 'ownership', 'assetcategory', 'activitycategory', 'status', 'frequency', 'assetstatus'];

    filtersBy.forEach(filterKey => {
      const index = this.parentFilter.findIndex(f => f.id === filterKey);
      if (index === -1) return;

      if (filterKey === 'asset') {
        this.parentFilter[index].defaultSelected = preferenceData?.isMyDepartment ? ['myDepartment'] : ['myAsset'];
      }
      else if (filterKey === 'my department') {
        this.parentFilter[index].defaultSelected = preferenceData?.departmentIds ?? [];
      }
      else if (filterKey === 'ownership') {
        const selected: string[] = [];
        if (preferenceData?.isOwnedDepartment) selected.push('owned');
        if (preferenceData?.isAssignedDepartment) selected.push('assigned');
        this.parentFilter[index].defaultSelected = selected;
      }
      else if (filterKey === 'assetType') {
        this.parentFilter[index].defaultSelected = preferenceData?.assetTypeIds ?? [];
      }
      else if (filterKey === 'assetcategory') {
        this.parentFilter[index].defaultSelected = preferenceData?.assetcategory ?? [];
      }  else if (filterKey === 'activitycategory') {
        this.parentFilter[index].defaultSelected = preferenceData?.activityCategory ?? [];
      } else if (filterKey === 'status') {
        this.parentFilter[index].defaultSelected = preferenceData?.status ?? [];
      } else if (filterKey === 'frequency') {
        this.parentFilter[index].defaultSelected = preferenceData?.frequency ?? [];
      } else if (filterKey === 'assetstatus') {
        this.parentFilter[index].defaultSelected = preferenceData?.assetstatus ?? [];
      }
    });
    this.parentFilter = [...this.parentFilter];
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (filterValue.length > 2) {
      this.getEntityMaintenance();
    } else if (this.applyFilterValue.length == 0) {
      this.applyFilterValue = null;
      this.getEntityMaintenance();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getEntityMaintenance();
    } else if (event.key === 'Asset Name') {
      this.manageViewAction(event.data);
    } else if (event.key === 'assignTo') {
      this.assignTo(event.data[0]);
    } else if (event.key === 'createMaintenance') {
      this.createRoutinData([event.data], event.key);
    } else if (event.key === 'Identifier') {
      this.openTicket(event.data);
    }
  }

  manageViewAction(data: any) {
    this.loading.set(true);
    let rowData = null
    this.configurationService.getAllAsset(data.id).subscribe(res => {
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
        this.loading.set(false);
      }
      const dialogRef = this.dialog.open(CreateAssetComponent, {
        data: rowData,
        panelClass: ['large-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.refreshPage();
      });
    })
  }

  // manageMaintenance(data) {
  //   let rowData = {};
  //   if (data?.length) {
  //     let filterData = data.map(item => {
  //       const maintenanceTypes = this.maintenanceCode.filter(code => item[code.name]).map(code => ({ key: code.key, name: code.name }));
  //       return {...item, maintenances: maintenanceTypes };
  //     });
  //     rowData = {
  //       'data': [...filterData],
  //       'permission': [...this.maintenanceCode]
  //     }
  //     console.log(rowData);
  //   }

  //   const dialogRef = this.dialog.open(ManageAstROUMaintennaceComponent, {
  //     data: rowData, height: '350px', panelClass: ['mdm-Confirmation-popup'],
  //   });
  //   dialogRef.afterClosed().subscribe((result) => {
  //     this.refreshPage();
  //   });

  // }

  selectedViewAction(key) {
    if (key !== null) {
      this.selectedView = key;
      if (key === 'table') {
        if (!this.calendarUserpreference) {
          this.setFilterDefaultSelection(this.configPreferenceData);
        } else {
          this.getEntityMaintenance();
        }
      } else {
        this.checkedToUserpreference();
        this.getCalendarViewData();
      }
    }
  }

  assignTo(data) {
    this.WorkflowService.getTaskById(data.requestId).subscribe(res => {
      if (res.statusCode == 1) {
        const dataInfo = res.results[0];
        dataInfo['launchType'] = "isTask";
        dataInfo['selectedTabIndex'] = null;
        const dialogRef = this.dialog.open(AssignTaskComponent, {
          data: dataInfo, height: '250px', panelClass: ['mdm-Confirmation-popup'],
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((result) => { 
          this.refreshPage();
        });
      }
    });
  }

  getEntityMaintenance() {
    this.loading.set(true);
    this.activityCategoryIds = this.parentFilter.find(filter => filter.id === 'activitycategory')?.subFilters?.length  ===  this.activityCategoryIds?.length  ? null : this.activityCategoryIds;
    this.assetCategoryIds = this.parentFilter.find(filter => filter.id === 'assetcategory')?.subFilters?.length  ===  this.assetCategoryIds?.length  ? null : this.assetCategoryIds;
    this.assetTypeIds =  this.parentFilter.find(filter => filter.id === 'assetType')?.subFilters?.length  === this.assetTypeIds?.length ? null : this.assetTypeIds;
    this.commonService.getAssetMaintenanceSummary(this.identitydata, this.applyFilterValue, this.selectedDate, this.selectedToDate, this.isMyAsset, this.isMyDepartment, this.assetTypeIds, this.isOwnedDepartment, this.isAssignedDepartment, this.departmentId, this.statusList, this.assetCategoryIds, this.activityCategoryIds, this.frequencyIds, this.assetstatus, this.isYearly, this.pageSize, this.pageStart).subscribe(res => {
      this.loading.set(false);
      if (res.statusCode === 1) {
        const transformed = res.results.map(asset => {
          const baseData = {
            id: asset?.id ?? null,
            'Asset Name': asset?.name ?? null,
            'Serial Number': asset?.serialNumber ?? null,
            'Asset Type': asset?.assetTypeName ?? null,
            'Asset Category': asset?.assetCategoryName ?? null,
            'Major Type': asset?.majorCategoryName ?? null,
            'Minor Type': asset?.minorCategoryName ?? null,
            'AssetStatus': asset?.assetStatusName ?? null,
            'ownerDepartmentName' : asset?.ownerDepartmentName ?? null,
            'assignedDepartmentName' : asset?.assignedDepartmentName ?? null,
            'assetLocationName' : asset?.homeLocationName ?? null,
            'isRoutine' : asset?.isRoutine,
            'amcTotal' : asset?.totalSummaryCount?.['AC-AMC'],
            'pmsTotal' : asset?.totalSummaryCount?.['AC-PMS'],
            'correctiveTotal' : asset?.totalSummaryCount?.['AC-COR'],
            'calibrationTotal': asset?.totalSummaryCount?.['AC-CAL'],
            'totalschedule' : asset?.totalSummaryCount?.['total']
          }
          const dynamicMaintenanceData: any = {};

          if (!this.isYearly) {
            this.maintenanceCode.forEach(item => {
              dynamicMaintenanceData[item.name] = asset?.maintenances?.[item.key] ?? null;
            });
          } else {
            const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
            months.forEach(month => {
              const monthData: any = {};
              this.maintenanceCode.forEach(item => {
                const yearlyData = asset?.yearlyMaintenance?.[month]?.[item.key];
                if (Array.isArray(yearlyData) && yearlyData.length > 0) {
                  monthData[item.name] = yearlyData;
                }
              });
              if (Object.keys(monthData).length) {
                dynamicMaintenanceData[month] = monthData;
              }
            });
          }
           return { ...baseData, ...dynamicMaintenanceData };
        });
        this.tableData = transformed;
        this.length = res.totalRecords;

        let Columns = ['select', 'Asset Type', 'Major Type', 'Minor Type','Asset Category', 'Serial Number', 'Asset Name', 'ownerDepartmentName', 'assignedDepartmentName', 'assetLocationName', 'AssetStatus', 'AMC', 'PMS', 'Calibration', 'Corrective' ];

        if (this.responseColumns?.length) {
          Columns = this.responseColumns;
        }
        for (let i = 0; i <= Columns.length; i++) {
          this.tableData.map(data => {
            data[this.displayedColumns[i]] = data[Columns[i]];
          });
        }
      }
    });
  }

  checkBoxAction(event) {
    this.selectedName = event;
    this.showActions = null;
    if (event.length > 1) {
      this.showActions = this.showAction3;
    } else if (event.length === 1) {
      this.showActions = this.showActions1;
    } else {
      this.showActions = this.showActions2;
    }
  }

  getMonthDateChange(dateValue: any) {
    const date = new Date(dateValue);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const formattedDate = this.datepipe.transform(endOfMonth, 'yyyy-MM-dd');
    return formattedDate;
  }

  getCalendarViewData(key?: any) {
    let selectedCalenderDate = null;
    if (this.selectedToDate == null) {
      selectedCalenderDate = this.getMonthDateChange(this.currentDate);
    }

    let groupFilterData = {
      isMyAsset : this.isMyAsset,
      isMyDepartment : this.isMyDepartment,
      assetTypeIds : this.assetTypeIds,
      isOwnedDepartment : this.isOwnedDepartment,
      isAssignedDepartment : this.isAssignedDepartment,
      departmentId : this.departmentId,
      assetCategoryIds : this.assetCategoryIds,
      activityCategoryIds : this.activityCategoryIds,
      assetstatus: this.assetstatus,
      frequency : this.frequencyIds,
      statusList : this.statusList,
      filterData : key === 'filter' ? true : false
    }

    this.calendarData = {};
    this.calendarData = {
      "entityId": null,
      "entityType": 'CAL-AMC',
      'fromDate': this.selectedDate,
      'toDate': this.selectedToDate ? this.selectedToDate : selectedCalenderDate,
      'fromTime': null,
      'toTime': null,
      'status': null,
      'options': {},
      'refresh': null,
      'data' : null,
      'type': 'Asset',
      'groupFilter': groupFilterData
    }
  }

  calendarUpdatedData(data) {
    if (data.selectedData) {
      const calEmitData = data?.selectedData;
      this.selectedView = 'table';
      this.selectedDate = this.datepipe.transform(data?.selectedDate, 'yyyy-MM-dd');
      // this.identitydata = calEmitData.entityId;
      this.getEntityMaintenance();
    }
  }

  getYearDates(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return {
      start: startDate,
      end: endDate
    };
  }

  openTicket(data) {
      this.loading.set(true);
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
      this.loading.set(false);
      dialogRef.afterClosed().subscribe((result) => { 
        this.refreshPage();
      });
  }

  refreshPage() {
    this.applyFilterValue = null;
    this.selectDropdown = null;
    this.selectedName = [];
    this.showActions = this.showActions2;
    if (this.selectedView === "table") {
      this.getEntityMaintenance();
    } else {
      this.getCalendarViewData();
    }
  }

  downloadExcel() {
    this.loading.set(true);
    const applyFilter = this.applyFilterValue || null;
    const activityCategoryIds =this.parentFilter.find(f => f.id === 'activitycategory')?.subFilters?.length === this.activityCategoryIds?.length? null : this.activityCategoryIds;
    const assetCategoryIds =this.parentFilter.find(f => f.id === 'assetcategory')?.subFilters?.length === this.assetCategoryIds?.length? null : this.assetCategoryIds;
    const assetTypeIds =this.parentFilter.find(f => f.id === 'assetType')?.subFilters?.length === this.assetTypeIds?.length? null : this.assetTypeIds;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const maintenanceKeyMap = {
      'AMC': 'AC-AMC',
      'PMS': 'AC-PMS',
      'Calibration': 'AC-CAL',
      'Corrective': 'AC-COR'
    };

    this.commonService.getAssetMaintenanceSummary(this.identitydata,applyFilter,this.selectedDate,this.selectedToDate,this.isMyAsset,this.isMyDepartment,assetTypeIds,this.isOwnedDepartment,this.isAssignedDepartment,this.departmentId,this.statusList,assetCategoryIds,activityCategoryIds,this.frequencyIds,this.assetstatus,this.isYearly,null,null).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.statusCode !== 1 || !res?.results?.length) {
          return;
        }
        const excelData = res.results.map(asset => {
          const row: any = {};
          this.excelDisplayedColumns.forEach((header, i) => {
            const key = this.excelResponseColumns[i];
            let value = null;
            if (!this.isYearly && maintenanceKeyMap[header]) {
              const data = asset?.maintenances?.[maintenanceKeyMap[header]];
              if (!data) {
                value = null;
              }else {
                const statusMap: any = {};
                if (Array.isArray(data?.events) && data.events.length) {
                  data.events.forEach(event => {
                    const status = event?.statusName || 'Unknown';
                    statusMap[status] = (statusMap[status] || 0) + 1;
                  });
                }else if (data?.statusName) {
                  statusMap[data.statusName] = 1;
                }
                value = Object.entries(statusMap).map(([status, count]) => `${count}-${status}`).join(', ');
              }
            } else if (this.isYearly && months.includes(header)) {
              const monthData = asset?.yearlyMaintenance?.[header];

              if (!monthData) {
                value = null;
              } else {
                const typeMap: any = {};
                const maintenanceTypeMap = {
                  'AC-AMC': 'AMC',
                  'AC-PMS': 'PMS',
                  'AC-CAL': 'Calibration',
                  'AC-COR': 'Corrective'
                };

                Object.keys(monthData).forEach(k => {
                  const arr = monthData[k];

                  if (Array.isArray(arr) && arr.length) {
                    const typeName = maintenanceTypeMap[k] || k;
                    typeMap[typeName] = arr.length;
                  }
                });
                value = Object.entries(typeMap)
                  .map(([type, count]) => `${type}-${count}`)
                  .join(', ');
              }
            } else if (this.isYearly && header.includes('Total')) {
              const totalMap = {
                'AMC Total': 'AC-AMC',
                'PMS Total': 'AC-PMS',
                'Calibration Total': 'AC-CAL',
                'Corrective Total': 'AC-COR',
                'Total Schedule': 'total'
              };
              value = asset?.totalSummaryCount?.[totalMap[header]] ?? null;
            } else if (!this.isYearly && [
              'Last PMS Done',
              'Last Calibration Done',
              "Next PMS Due",
              "Next Calibration Due",
              "Next PMS Performer",
              "Next Calibration Performer"
            ].includes(header)) {

            const maint = asset?.maintenances || {};

            switch (header) {

              case 'Last PMS Done':
                value = maint['AC-PMS']?.prevCompletedTime || null;
                break;

              case 'Last Calibration Done':
                value = maint['AC-CAL']?.prevCompletedTime || null;
                break;

              case 'Next PMS Due':
                value = maint['AC-PMS']?.nextDueStartTime || null;
                break;

              case 'Next Calibration Due':
                value = maint['AC-CAL']?.nextDueStartTime || null;
                break;

              case 'Next PMS Performer':
                value = maint['AC-PMS']?.events?.[0]?.nextDuePerformerName || null;
                break;

              case 'Next Calibration Performer':
                value = maint['AC-CAL']?.events?.[0]?.nextDuePerformerName || null;
                break;
            }
           } else {
              value = asset?.[key] ?? null;
            }
            row[header] = value;
          });
          return row;
        });
        this.downloadDynamicExcelData(excelData);
      },

      error: () => {
        this.loading.set(false);
      }
    });
  }

  downloadDynamicExcelData(excelData) {
    const date = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    this.excelService.exportAsExcelFile(excelData,'Maintenance',false,date,'report1',this.excelDisplayedColumns);
  }

  checkedToUserpreference() {
    if (!this.calendarUserpreference) {
      this.configPreferenceData = JSON.parse(this.commonService?.userPreference?.AssetMaintenance.value);
      let preferenceInfo = {
        activityCategory: null,
        assetTypeIds: null,
        assetcategory: [],
        assetstatus: null,
        departmentIds: [],
        frequency: null,
        isAssignedDepartment: null,
        isMyAsset: true,
        isMyDepartment: null,
        isOwnedDepartment: null,
        selectedToDate: null,
        status: []
      };
      this.activityCategoryIds = preferenceInfo.activityCategory;
      this.assetCategoryIds = preferenceInfo.assetcategory;
      this.assetTypeIds = preferenceInfo.assetTypeIds;
      this.assetstatus = preferenceInfo.assetstatus;
      this.departmentId = preferenceInfo.departmentIds;
      this.frequencyIds = preferenceInfo.frequency;
      this.isAssignedDepartment = preferenceInfo.isAssignedDepartment;
      this.isMyAsset = preferenceInfo.isMyAsset;
      this.isMyDepartment = preferenceInfo.isMyDepartment;
      this.isOwnedDepartment = preferenceInfo.isOwnedDepartment;
      this.selectedToDate = preferenceInfo.selectedToDate;
      this.statusList = preferenceInfo.status

      this.setFilterDefaultSelection(preferenceInfo);
    }
  }
}