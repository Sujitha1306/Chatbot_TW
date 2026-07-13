import { Component, OnInit } from '@angular/core';
import { CommonService, ConfigurationService, WorkflowService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { PushNotificationsService } from '../../../shared/services/push.notification.service';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { SalesOrderManagementComponent } from '../../../shared/modules/entry-component/sales-order-management/sales-order-management.component';
import { AssignTaskComponent } from '../task/task.component';
import { TaskManagmentComponent } from '../../../shared/modules/entry-component/task-managment/task-managment.component';
import { EventStatusTrackingComponent } from '../../../shared/modules/entry-component/event-status-tracking/event-status-tracking.component';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.scss']
})
export class TaskManagementComponent implements OnInit{
  public groupFilter = [];
  public showActions = [];
  public displayedColumns = ['Order No', 'Item Name', 'Identifier', 'Activity', 'Category', 'Requested Date', 'Item Type', 'From Date', 'To Date', 'Assigned Type', 'Assigned To', 'Status', 'Action'];
  public dateTimeColumns = ['Requested Date']
  public dateColumns =['From Date', 'To Date']
  public iconHeader = ['Action']
  public iconColumn = ['From Date', 'To Date', 'Requested Date', 'Assigned Type']
  public eventColumn = ['Order No','Status', 'Assigned To', 'Identifier']
  public tableData = [];
  public sortColumn = ['Order No', 'Activity', 'From Date', 'To Date', 'Status'];
  public permissionControl = ['BT_ALLE']
  public requestId = null
  public applyFilterValue = null;
  public departmentId = parseInt(localStorage.getItem('ZGVwYXJ0bWVudElk'))
  public roleId = parseInt(localStorage.getItem('userlevel'))
  public allTaskFilter = [ 
    {
      id: 'status',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'taskType',
      value: 'Task Type',
      isAll: false,
      selectionType: 'single',
      subFilters: [{ code: 'myDepartment', value: 'My Department' }, { code: 'WD_TMSOT', value: 'All' }],
      disable: false,
      defaultSelected: [],
      dependentFilter: ['itemDepartment'],
    },
    {
      id: 'itemDepartment',
      value: 'Department',
      isAll: false,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: [],
      isLoadSubFilters: true
    },
    {
      id: 'role',
      value: 'Role',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'location',
      value: 'Location',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ]
  length = 0;
  pageSize = 20;
  pageStart = 0;
  cardViewPageStart = 0;
  statusList: any[] = [];
  selectedStatus: any[] = [];
  roleList: any[] = [];
  departmentList: any[] = [];
  selectedDepartmentIds: any[] = [];
  selectedRoleIds: any[] = [];
  selectedLocationId: any[] = [];
  loading = false
  locationFilter: any;
  locationId: any;
  selectedTaskType: any;
  public selectedView = "card";
  public enableMultiView = true;
  constructor(private readonly workflowService: WorkflowService,  public dialog: MatDialog, public configurationService: ConfigurationService,
    public pushNotificationsService: PushNotificationsService, public commonService: CommonService ) {
    if(Number.isNaN(this.departmentId)){
      this.selectedDepartmentIds = [];
      this.departmentId = null
    } else {
      this.selectedDepartmentIds = [this.departmentId]
    }
  }

  ngOnInit(): void {
    this.filterOptions();
    this.checkUserPreference()
  }

  filterOptions() {
    this.commonService.getAppTermsLink('RQT-TASK', 'RequestStatus').subscribe(res => {
      this.statusList = res.results.filter(resFilter => !['RQ-OP', 'RQ-PLN', 'RQ-RAS', 'RQ-CA', 'RQ-PEN'].includes(resFilter.code));
      const status = this.allTaskFilter.find(f => f.id === 'status');
      status.subFilters = this.statusList;
    })
    this.configurationService.getRecipientName('','RT-RO').subscribe(res => {
      this.roleList = res.results;
      const role = this.allTaskFilter.find(f => f.id === 'role');
      role.subFilters = this.roleList.map(({id, name}) => ({
        code: id,
        value: name
      }));
    })
    this.commonService.getAllDepartments().subscribe(res => {
      this.departmentList = res.results;
      const department = this.allTaskFilter.find(f => f.id === 'itemDepartment');
      department.subFilters = this.departmentList.map(({id, name}) => ({code: id, value: name}))
      department.defaultSelected = this.departmentId ? [this.departmentId] : []
    })
    this.commonService.getSpecialityQryStr('locationTypeIds=2').subscribe(res => {
      this.locationFilter = res.results;
      const locationFilter = this.allTaskFilter.find(f => f.id === 'location');
      if (locationFilter) {
        locationFilter.subFilters = this.locationFilter.map(({ id, name }) => ({ code: id, value: name }));
      }
    });
    this.groupFilter = this.allTaskFilter
  }

  checkUserPreference() {
    if(this.commonService.userPreference?.hasOwnProperty('productionTaskFilter')) {
      this.updateFilters()
    } else {
      setTimeout(() => {
        this.updateFilters()
      }, 2000);      
    }
  }
  selectedViewAction(event : any) {
    this.selectedView = event == 'card' ? 'card' : 'table';
  }

  updateFilters() {
    if (this.commonService.userPreference?.hasOwnProperty('productionTaskFilter')) {
      let preferenceData = this.commonService.userPreference.productionTaskFilter.value;
      preferenceData = JSON.parse(preferenceData)
      const status = this.allTaskFilter.find(f => f.id === 'status');
      const role = this.allTaskFilter.find(f => f.id === 'role');
      const department = this.allTaskFilter.find(f => f.id === 'itemDepartment');
      const location = this.allTaskFilter.find(f => f.id === 'location')
      const type = this.allTaskFilter.find(f => f.id === 'taskType')
      this.setDataPreferene(status, role, department, location, type, preferenceData);
      this.selectedStatus = preferenceData.status ?? [];
      setTimeout(() => {
        this.getTaskManagementInfo()
      }, 200)
    } else {
      this.getTaskManagementInfo()
    }
  }

  setDataPreferene(status, role, department, location, type, preferenceData) {
    if (status) {
      status.defaultSelected = preferenceData.status || ['RQ-CO', 'RQ-CR', 'RQ-IP']; 
      this.selectedStatus = preferenceData.status || ['RQ-CO', 'RQ-CR', 'RQ-IP']
    }
    if(role) {
      role.defaultSelected = preferenceData.role || [];
      this.selectedRoleIds = preferenceData.role || []
    }
    if(department) {
      department.defaultSelected = preferenceData.itemDepartment ? preferenceData.itemDepartment : this.departmentId ? [this.departmentId] : [];
      this.selectedDepartmentIds = preferenceData.itemDepartment ? preferenceData.itemDepartment : this.departmentId ? [this.departmentId] : [];
      type.disable = this.departmentId ? false : true;
    }
    if(location) {
      location.defaultSelected = preferenceData.locationId || ['All'];
      this.selectedLocationId = preferenceData.locationId || ['All'];
    }
    if(type) {
      type.defaultSelected = preferenceData.type || ['myDepartment'];
      this.selectedTaskType = preferenceData.type || ['myDepartment']
    }
  }

  applyFilter(filterVal) {
    filterVal = filterVal.trim();
    filterVal = filterVal.toLowerCase();
    this.applyFilterValue = filterVal;
    this.pageStart = 0;
    if (filterVal.length > 2) {
      this.getTaskManagementInfo();
    } else if (this.applyFilterValue.length == 0) {
      this.applyFilterValue = null;
      this.getTaskManagementInfo();
    }
  }

  refresh() {
    this.applyFilterValue = null;
    this.getTaskManagementInfo()
  }

  headerEventAction(event){
    if(event.key === 'applyFilter'){
      this.applyFilter(event.data);
    } else if(event.key === 'groupFilter'){
      this.manageGroupFilter(event.data);
    } else {
      this.refresh();
    }
  }

  manageGroupFilter(event){
    let mytaskStatus = event.filter(filter => filter.id === "status").map(code => code.data);
    let role = event.filter(filter => filter.id === "role").map(code => code.data);
    let department = event.filter(filter => filter.id === "itemDepartment").map(code => code.data);
    let location = event.filter(filter => filter.id === "location").map(code => code.data);
    let type = event.filter(filter => filter.id === "taskType").map(code => code.data);
    this.selectedStatus = mytaskStatus.length ? mytaskStatus : [];
    this.selectedRoleIds = role.length ? role : [];
    this.selectedDepartmentIds = department.length ? department : this.departmentId ? [this.departmentId] : [];
    this.locationId = location.length ? location[0] : [];
    this.selectedTaskType = type.length ? type : [];
    const types = this.allTaskFilter.find(f => f.id === 'taskType') 
    if(types){
      types.defaultSelected = this.selectedDepartmentIds.includes(this.departmentId) ? ['myDepartment'] : [];
    }
    this.saveAssetPreference();
    this.refresh()
  }

  saveAssetPreference(){
    let preferenceData = {};
    preferenceData = {
      "status": this.selectedStatus,
      "itemDepartment": this.selectedDepartmentIds,
      "role": this.selectedRoleIds,
      "taskType": this.selectedTaskType,
      "locationId": this.locationId.length ? this.locationId : null
    };
    let lastData = JSON.stringify(preferenceData)
    this.commonService.validateUserPreference('productionTaskFilter', lastData)
  }

  eventAction(event){
    if (event.key === 'Action') {
      const statusData = {
        "comments": event.data.deliveryRequestComments, "type": "RQT-ROU",
        "status": event.patientId, "userType": event.data.performerType
      }
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: event.patientId === 'RQ-CO' ? 'Complete Task' :
            event.patientId === 'RQ-IP' ? 'Manage Task' : 'Cancel Task',
          message: event.patientId === 'RQ-CO' ? 'Do you want to complete the task ?' :
            event.patientId === 'RQ-IP' ? 'Do you want to inprogress the task ?' : 'Do you want to cancel the task ?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'completeTask': true, 'requestId': event.data.requestId, 'completeData': statusData
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'confirm') {
          this.pushNotificationsService.triggerNotificationRefresh();
          this.refresh()
        }
      })
    } else if(event.key === 'Order No') {
      this.createSaleOrder(event.data)
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.refresh();
    } else if (event.key === 'Assigned To'){
      const data = event?.data;
      data['launchType'] = "isTask"
      const dialogRef = this.dialog.open(AssignTaskComponent, {
      data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.refresh();
      });
    } else if (event.key === 'Identifier' || event.key === 'Status') {
      this.getRequestInfo(event?.data, event?.key);
    }
  }

  getTaskManagementInfo(){
    this.cardViewPageStart = 0;
    this.loading = true;
    let statusId = null;
    let roleId = null;
    let departmentIds = null
    if(this.selectedStatus.length === this.statusList.length) {
      statusId = null;
    } else {
      if(this.selectedStatus.length){
        statusId = this.selectedStatus;
      } else {
        statusId = null;
      }
    }
    if(this.selectedDepartmentIds.length === this.departmentList.length) {
      departmentIds = null;
    } else {
      if(this.selectedDepartmentIds.length){
        departmentIds = this.selectedDepartmentIds
      } else {
        departmentIds = null
      }
    }
    if(this.selectedRoleIds.length === this.roleList.length){
      roleId = null
    } else {
      if(this.selectedRoleIds.length){
        roleId = this.selectedRoleIds;
      } else {
        roleId = null;
      }
    }
    this.workflowService.getSalesOrderRoutine(null,this.pageStart, this.pageSize, departmentIds, statusId, roleId, this.locationId, this.applyFilterValue).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      let columns = ['deliveryRequestIdentifier','itemMasterName', 'requestId', 'activityName','activityCategoryName', 'deliveryRequestDatetime', 'typeName', 'fromDate', 'toDate', 'performerType', 'performerName', 'requestStatusName', 'Action'];
      for (let i = 0; i <= columns.length; i++) {
        this.tableData.map((data) => {
          data[this.displayedColumns[i]] = data[columns[i]];
        });
      }
      this.loading = false;
    })
  }

  handleCardEvent(event: any) {
    if (event.key === 'refresh') {
      this.cardViewPageStart = 0;
      this.refresh();
    }
  }

  loadMoreTasks() {
    this.cardViewPageStart++;
    this.loading = true;
    let statusId = null;
    let roleId = null;
    let departmentIds = null;
    if (this.selectedStatus.length === this.statusList.length) {
      statusId = null;
    } else {
      statusId = this.selectedStatus.length ? this.selectedStatus : null;
    }
    if (this.selectedDepartmentIds.length === this.departmentList.length) {
      departmentIds = null;
    } else {
      departmentIds = this.selectedDepartmentIds.length ? this.selectedDepartmentIds : null;
    }
    if (this.selectedRoleIds.length === this.roleList.length) {
      roleId = null;
    } else {
      roleId = this.selectedRoleIds.length ? this.selectedRoleIds : null;
    }
    const columns = ['deliveryRequestIdentifier','itemMasterName', 'requestId', 'activityName','activityCategoryName', 'deliveryRequestDatetime', 'typeName', 'fromDate', 'toDate', 'performerType', 'performerName', 'requestStatusName', 'Action'];
    this.workflowService.getSalesOrderRoutine(null, this.cardViewPageStart, this.pageSize, departmentIds, statusId, roleId, this.locationId, this.applyFilterValue).subscribe(res => {
      const newData = res.results;
      for (let i = 0; i <= columns.length; i++) {
        newData.forEach(d => d[this.displayedColumns[i]] = d[columns[i]]);
      }
      this.tableData = [...this.tableData, ...newData];
      this.length = res.totalRecords;
      this.loading = false;
    }, () => this.loading = false);
  }

  createSaleOrder(data) {
    data['type'] = "task"
    this.showActions = null;
    const dialogRef = this.dialog.open(SalesOrderManagementComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refresh();
    });
  }

  getRequestInfo(data, key) {
    const requestId = data?.requestId;
    this.workflowService.getTaskById(requestId).subscribe(res => {
      if (res.statusCode === 1) {
        const requestData = res.results[0];
        if (key === 'Status') {
          this.getTaskHistory(requestData);
        } else {
          this.createTask('modify', requestData, '', requestData?.routineTypeId);
        }
      }
    })
  }

  createTask(key, data?: any, keyValue?: any, routineTypeId?: any) {
    if (key === 'modify') {
      data['type'] = key;
      data['permissionTab'] = ['Task List'];
      data['requestedType'] = keyValue ? keyValue : 'RQT-TASK';
      data['routineTypeId'] = routineTypeId;
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent,
      { data: data, panelClass: ['large-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.getTaskManagementInfo();
    });
  }

  getTaskHistory(data) {
    const dialogRef = this.dialog.open(EventStatusTrackingComponent, {
      data: data,
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getTaskManagementInfo();
    });
  }
}
