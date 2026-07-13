import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { CreateEntityRoutine } from '../create-manage-routine/create-manage-routine.model';
import { CreateRoutineActivityComponent } from '../create-routine-activity/create-routine-activity.component';
import { DatePipe } from '@angular/common';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { PushNotificationsService } from '../../../services/push.notification.service';
import { AssignTaskComponent } from '../../../../ovitag/workflow/task/task.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-production-management',
  templateUrl: './production-management.component.html',
  styleUrls: ['./production-management.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductionManagementComponent implements OnInit{
  public subOrderList: any;
  public createRoutine: CreateEntityRoutine;
  public today = new Date();
  routineId = new FormControl(null);
  searchControl = new FormControl('');
  routineType = new FormControl(null);
  bannerlabel: any;
  selectedSubIndex: number = 0;
  selectedSubData = null;
  routineList: any[] = []
  activityDatas: any[] = []
  routineMasterList: any[] = [];
  routineTypes: any;
  routineData: any;
  isRoutine: boolean = false;
  isDrawerOpen: boolean = true;
  option1 = [{"name": "Delete", "type": "delete", "value": null}, {"name": "Edit", "type": "edit", "value": null}, {"name": "Duplicate", "type": "duplicate", "value": null}];
  option2 = [{"name": "Edit", "type": "edit", "value": null}];
  moreOptions = this.option1;
  isEditable = false;
  accordionActivities: any[] = [];
  expandedIndex: number = 0;
  categoryItemList: any;
  lastClickedIndex: number | null = null;
  entityActivityData: any;
  isDeliveryDetail: boolean = false;
  isRotating: boolean = false;
  linkedActivity: any;
  loading: boolean = false;

  

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly workflowService: WorkflowService,
    private readonly configurationService: ConfigurationService, private readonly commonService: CommonService,
    public toastr: AppToastService, public dialog: MatDialog, private readonly dateFormat: DatePipe,
    private readonly PushNotificationsService : PushNotificationsService){}

  ngOnInit(): void {
    if(this.data?.id){
      this.bannerData(this.data)
      this.getSalesOrderById(this.data?.id)
    }
  }

  getProgressColor(value: number): 'warn' | 'accent' | 'primary' {
    if (value <= 20) return 'warn';
    else if (value <= 40) return 'accent';
    else if (value <= 70) return 'primary';
    else return 'accent';
  }

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

onPanelOpened(index: number): void {
  setTimeout(() => this.expandedIndex = index);
}

onPanelClosed(index: number): void {
  if (this.expandedIndex === index) {
    this.expandedIndex = -1;
  }
}

  editMode(){
    this.isEditable = !this.isEditable;
  }

  bannerData(details) {
    this.bannerlabel = {
      'banners': {
        "bannerInfo": details,
        "bannerFirstRow": {
          "name": details.identifier,
          "tokenNo": details.purchaseOrderId,
          "vipTypeId": null,
        },
        "bannerFirstRowLable": [{ code: 'name', value: 'Name'}],
        "bannerSeconRowLable": [{ code: 'purchase', value: 'Purchaser'},{ code: 'department', value: 'Requested Department'}, { code: 'users', value: 'Requested User' }, 
          {code: 'deliveredDatetime', value: 'Expected Date'}, {code: 'status', value: 'Delivery Status'}],
        "bannerSecondRow": {
          "purchase": details.purchaser,
          "department": details.requestUserDepartmentName,
          "users": details.requestedByUserName,
          "deliveredDatetime": details.deliveredDatetime,
          "status": details.deliveryStatusName
        }
      }
    }
  }

  applySearch(data): void {
    const filterValue = (data || '').toLowerCase();
    this.subOrderList = this.routineMasterList.filter(item =>
      item.name?.toLowerCase().includes(filterValue)
    );
  }

  onRefreshClick(id: string) {
  this.isRotating = true;
  this.getEntityRoutineData(id);
  setTimeout(() => {
    this.isRotating = false;
  }, 1000);
}

  triggerAction(event: any) {
    if (event.key === 'delete') {
      const index = this.activityDatas.indexOf(event.data);
      if (index !== -1) {
        this.activityDatas.splice(index, 1);
      }
      this.activityDatas = [...this.activityDatas];
    } else if(event.key === 'edit') {
      const index = this.activityDatas.indexOf(event.data);
      this.addActivity(event.data, index)
    } else if(event.key === 'select') {
      const index = this.activityDatas.indexOf(event.data);
      this.activityDatas[index]['deliveryDetailId'] = parseInt(event.keyVal);
      this.deliveryDetailCheck();
    }
  }

  triggerActionGroup(event: any) {
    if (event.key === 'status') {
      const statusData = {
        "comments": event.data.deliveryRequestComments, "type": "RQT-ROU",
        "status": event.keyVal, "userType": event.data.performerType
      }
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], disableClose: true,
        data: {
          title: event.keyVal === 'RQ-CO' ? 'Complete Task' : 
          event.keyVal === 'RQ-IP' ? 'Manage Task': 'Cancel Task', 
          message: event.keyVal === 'RQ-CO' ? 'Do you want to complete the task ?' : 
          event.keyVal === 'RQ-IP' ? 'Do you want to inprogress the task ?' : 'Do you want to cancel the task ?',
          buttonText: { ok: 'Yes', cancel: 'No' },
          'completeTask': true, 'requestId': event.data.requestId, 'completeData': statusData
        }
      });
      dialogRef.afterClosed().subscribe(result => {
         if (result == 'confirm') {
           this.PushNotificationsService.triggerNotificationRefresh();
           this.getSalesOrderById(this.data?.id);
         }
      })
    } else if (event.key === 'Assigned To' && event.data['requestStatusId'] !== 'RQ-CO'){
      const data = event?.data;
      data['launchType'] = "isTask"
      const dialogRef = this.dialog.open(AssignTaskComponent, {
      data: data, height: '250px', panelClass: ['mdm-Confirmation-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.getSalesOrderById(this.data?.id);
      });
    }
  }

  onSelectSubOrder(subData, index) {
    this.selectedSubData = [];
    this.routineData = [];
    this.activityDatas = [];
    this.isRoutine = false;
    this.routineType.setValue(null)
    this.routineId.setValue(null)
    this.selectedSubIndex = index;
    this.selectedSubData = subData;
    if(this.selectedSubData.itemMasterRoutineTypeId === null){
      this.commonService.getAppTermsLink('RC-PRD', 'RoutineType').subscribe(res => {
        this.routineTypes = res.results;
      })
    }
    if(this.selectedSubData.routineId){
      this.isRoutine = true;
      this.isEditable = false;
      this.moreOptions = this.option2;
      let deliveryDetailId = this.selectedSubData.id
      if(deliveryDetailId){
        this.getEntityRoutineData(deliveryDetailId)
      }
      this.getEntityRoutinelink(this.selectedSubData.routineId);
      this.getlinkedActivityRule(this.selectedSubData.routineId)
      this.routineType.setValue(this.selectedSubData.itemMasterRoutineTypeId);
      this.routineId.setValue(this.selectedSubData.routineId);
    } else {
      this.isEditable = true;
      this.routineType.setValue(this.selectedSubData?.itemMasterRoutineTypeId)
      this.getRoutineList(subData.itemMasterRoutineTypeId);
    }
    this.makeCategoryList(subData.deliveryDetails);
  }

  getSalesOrderById(id) {
    this.workflowService.getAllDeliveryById(id).subscribe(res => {
    let orderData = res?.results;
    this.subOrderList = orderData['deliveryDetails'];
    this.selectedSubData = orderData['deliveryDetails'][this.selectedSubIndex];
    this.makeCategoryList(this.selectedSubData.deliveryDetails);
    if(this.selectedSubData.itemMasterRoutineTypeId === null){
      this.commonService.getAppTermsLink('RC-PRD', 'RoutineType').subscribe(res => {
        this.routineTypes = res.results;
      })
    }
    if(this.selectedSubData.routineId){
      this.isRoutine = true;
      this.moreOptions = this.option2;
      let deliveryDetailId = this.selectedSubData.id;
      if(deliveryDetailId){
        this.getEntityRoutineData(deliveryDetailId);
      }
      this.getEntityRoutinelink(this.selectedSubData.routineId);
      this.getlinkedActivityRule(this.selectedSubData.routineId)
      this.routineType.setValue(this.selectedSubData.itemMasterRoutineTypeId);
      this.routineId.setValue(this.selectedSubData.routineId);
    } else {
      this.isEditable = true
      this.moreOptions = this.option1;
      this.routineType.setValue(this.selectedSubData?.itemMasterRoutineTypeId)
      this.getRoutineList(this.selectedSubData?.itemMasterRoutineTypeId);
    }
  })
}

  makeCategoryList(detailData: any[]) {
    this.categoryItemList = null;
    const groupedResult = detailData.reduce((acc, obj) => {
      const key = obj.itemMasterActivityCategoryId;

      if (key && key.trim() !== '') {
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          id: obj.id,
          name: obj.itemMasterName,
        });
      }

      return acc;
    }, {} as Record<string, { id: number; name: string }[]>);

    groupedResult['empty'] = detailData.map(d => ({
      id: d.id,
      name: d.itemMasterName,
    }));

    this.categoryItemList = groupedResult;
    return groupedResult;
  }


  getRoutineList(type){
    this.configurationService.getRoutineName('', type).subscribe(res => {
      this.routineList = res.results;
      this.routineMasterList = [...this.routineList];
    });
  }

  getRoutineActivitys(id) {
    this.configurationService.getRoutineActivities(id).subscribe(res =>{
      this.routineData = res.results[0];
      this.activityDatas = this.routineData?.activities;
    })
  }

  getEntityRoutineData(id) {
    this.loading = true
    this.workflowService.getSalesOrderRoutine(id).subscribe(res => {
      this.routineData = res.results;
      let groupedMap = this.routineData.reduce((groups, activity) => {
        const mainLevel = activity?.sequenceLevel?.toString().split('.')[0];
        if (!groups[mainLevel]) {
          groups[mainLevel] = [];
        }
        groups[mainLevel].push(activity);
        return groups;
      }, {} as { [key: string]: any[] });
      let groupedActivityList = Object.keys(groupedMap).map(key => {
        const activities = groupedMap[key];
        const totalCount = activities.length || 0;
        const completedCount = activities.filter(f => f.requestStatusId === 'RQ-CO').length || 0;
        let status = 'Assigned';
        if (completedCount === totalCount) {
          status = 'Completed';
        } else if (activities.some(f => f.requestStatusId === 'RQ-IP')) {
          status = 'InProgress';
        }
        const titleActivity = activities.filter(f => f.requestStatusId === 'RQ-CR' || f.requestStatusId === 'RQ-IP')[0] ||
          activities.filter(f => f.requestStatusId === 'RQ-SH' || f.requestStatusId === 'RQ-CO')[0] ||
          activities[0];
        const title = `${titleActivity.itemMasterName}`;
        return {
          title: title,
          mainSequence: key,
          totalCount,
          completedCount,
          progress: totalCount ? ((completedCount / totalCount) * 100).toFixed(1) : 0,
          groupedActivity: activities,
          status
        };
      });
      this.accordionActivities = groupedActivityList;
      this.loading = false
    })
  }

  getEntityRoutinelink(id){
     this.configurationService.getEntityRoutineActivity(id).subscribe(res => {
      let entityRoutineData = res.results[0]
      this.activityDatas = entityRoutineData?.activities
     })
  }

  getlinkedActivityRule(id) {
    this.configurationService.getAllActivityRule(id).subscribe(res => {
      this.linkedActivity = res.results;
    })
  }

  deliveryDetailCheck() {
  if (!this.activityDatas || this.activityDatas.length === 0) {
    this.isDeliveryDetail = false;
    return;
  }
  const nullClear = this.activityDatas.every(item => item.deliveryDetailId !== null);
  this.isDeliveryDetail = nullClear;
}

  addActivity(data?, index?: number) {
    let routineInfo = {
      routineType: this.routineType.value,
      type: data ? 'modify' : 'create',
      contextType: 'RC-PRD',
      activityData: data === '' ? null : data,
      scheduleType: data.scheduleTypeId,
      routineId: this.selectedSubData.routineId ? this.selectedSubData.routineId : null,
    }
    const dialogRef = this.dialog.open(CreateRoutineActivityComponent,
      { data: routineInfo, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.getSalesOrderById(this.data?.id)
      } else {
        if (res?.results) {
          if (index !== undefined && index !== -1) {
            this.activityDatas[index] = {
              ...this.activityDatas[index],
              ...res.results
            };
          } else {
            this.activityDatas.push(res.results);
          }
          this.activityDatas = [...this.activityDatas];
        }
      }
    });
  }

  saveSalesRoutine() {
    this.createRoutine = new CreateEntityRoutine(null, null, null, null, null, null, null, null, null, null);
    this.createRoutine.identifiyingId = this.selectedSubData.id
    this.createRoutine.identifyingType = 'DeliveryDetail';
    this.createRoutine.routineId = this.routineId.value;
    this.createRoutine.routineType = this.routineType.value;
    this.createRoutine.routineStatusId = 'RQ-CR';
    this.createRoutine.scheduleTypeId = this.routineData.scheduleTypeId;
    this.createRoutine.fromDate = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss')
    this.createRoutine.scheduleStart = this.dateFormat.transform(this.today, 'yyyy-MM-dd HH:mm:ss');
    this.createRoutine.scheduleEnd = this.dateFormat.transform(this.today, 'yyyy-MM-dd 23:59:00');
    this.createRoutine.activities = this.activityDatas.length ? this.activityDatas : null;
    this.configurationService.createRoutine(this.createRoutine).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.getSalesOrderById(this.data?.id);
        this.isEditable = false;
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  fixClick() {
    console.log('')
  }

}
