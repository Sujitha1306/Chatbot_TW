import { DatePipe } from '@angular/common';
import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../patient/patient.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-create-user-schedule',
  templateUrl: './create-user-schedule.component.html',
  styleUrls: ['./create-user-schedule.component.scss'],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None
})
export class CreateUserScheduleComponent {

  @Input() scheduleInputData: any = null;

  public scheduleForm: FormGroup;
  public poolForm: FormGroup;

  public today = new Date();
  public minDate = this.today.toISOString().split('T')[0];
  public poolminDate = new Date();
  public poolmaxDate = new Date();

  public userNameList: any[] = [];
  public shiftList: any[] = [];
  public poolNameList: any[] = [];
  public poolLocationList: any[] = [];
  public dataSource: any[] = [];
  public scheduleData: any[] = [];
  public userListInfo: any[] = [];

  public selectedIndex = null;
  public editPoolsData = null;
  public selectedScheduleData = null;

  public UserNameEnabled: boolean = false;
  public isCollapsed: boolean = false;
  public isloading: boolean = false;
  public isScheduleOpen: boolean = true;
  public isPoolOpen: boolean = false;

  public moreOptions = [{ "name": "Edit", "type": "edit", "value": null }, { "name": "Delete", "type": "delete", "value": null }];
  public DisplayColumn = ['From Date', 'To Date', 'Pool Name', 'Pool Location', 'Action'];
  public DataColumns = ['fromDate', 'toDate', 'poolName', 'poolLocationName', 'Action'];
  public scheduleDeletepool: any[] = [];

  constructor(public form: FormBuilder, public datepipe: DatePipe, public commonService: CommonService, @Inject(MAT_DIALOG_DATA) public data: any,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateUserScheduleComponent>) { }

  ngOnInit(): void {
    this.getAppTermsData();
    this.buildform();
    if (this.data?.entityId || this.scheduleInputData) {
      this.getuserNamebindData();
      if (this.data?.type === 'user' || this.scheduleInputData?.entityType === 'user') {
        if (this.scheduleInputData) { 
          this.data['entityId'] = this.scheduleInputData?.data?.id;
          this.data['type'] = this.scheduleInputData?.entityType;
          this.getAllUserSchedule(this.data);
          this.scheduleForm.get('userName').setValue(this.scheduleInputData?.data?.fullName);
        } else {
          this.getAllUserSchedule(this.data);
        }
      } else {
        this.onScheduleBind(this.data);
      }
    } else if (this.data?.selectedType === 'date') {
      const selectedDate = this.data?.selectedType === 'date' ? this.data?.selectedFromDate : null;
      this.scheduleForm.get('fromDate').setValue(selectedDate);
      this.scheduleForm.get('toDate').setValue(selectedDate);
      this.scheduleForm.get('userName').setValue(this.data?.selectedEntityName);
      this.getAllUserSchedule(this.data);
      this.onScheduleFromChange(selectedDate, 'edit');
      this.onScheduleToChange(selectedDate, 'edit');
    }
  }

  getAppTermsData() {
    this.isloading = true;
    this.commonService.getAppTermsVerion2('PoolName,PoolLocation').subscribe(res => {
      if (res.statusCode === 1) {
        this.poolNameList = res.results.filter(x => x.groupName === 'PoolName');
        this.poolLocationList = res.results.filter(x => x.groupName === 'PoolLocation');
      }
    });

    this.commonService.getAllShift().subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.shiftList = res.results?.map(item => ({ code: item.id, value: item.shiftName }));
      }
    });

    this.commonService.getAllUser().subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.userListInfo = res.results?.map(item => ({ code: item.id, value: item.fullName }));
      }
    })
  }

  getAllUserSchedule(data) {
    this.isloading = true;
    const entityId = data.entityId ? data.entityId : data.selectedEntityId;
    const type = data.type === 'user' ?  data.type : 'user'
    this.commonService.getEntityShifts(entityId, type, data?.selectedFromDate, data?.selectedToDate, null, null, null).subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        const listData = res.results;
        this.onScheduleBind(listData, data?.selectedIndexOpen);
      }
    });
  }

  onScheduleBind(data, selectedIndexOpen?) {
    const listSchedule = Array.isArray(data) ? data : [data];

    let scheduleDataList = listSchedule.map(item => ({
      entityScheduleId: item.entityScheduleId,
      entityId: item.entityId,
      entityName: item.entityName,
      entityType: item.entityType,
      shiftMasterId: item.shiftMasterId,
      shiftMasterName: item.shiftMasterName,

      startDate: this.datepipe.transform(item?.startDate, 'yyyy-MM-dd'),
      endDate: this.datepipe.transform(item?.endDate, 'yyyy-MM-dd'),

      status: item.status,

      userPools: item.userPools?.map(pool => ({
        id: pool.id,
        poolName: pool.poolName,
        poolNameId: pool.poolNameId,
        fromDate: this.datepipe.transform(pool.fromDate, 'yyyy-MM-dd'),
        toDate: this.datepipe.transform(pool.toDate, 'yyyy-MM-dd'),
        poolLocationId: pool.poolLocationId,
        poolLocationName: pool.poolLocationName,
        isDeletable: pool.isDeletable ?? null
      }))
    }));
    this.scheduleData.push(...scheduleDataList);
    this.scheduleData = [...this.scheduleData];
    if (selectedIndexOpen) {
      const index = this.scheduleData.findIndex(x => x.entityScheduleId === this.data?.entityScheduleId);
      this.getscheduleList(this.scheduleData[index], index);
    }
  }

  buildform() {

    this.scheduleForm = this.form.group({
      userName: [null, Validators.required],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      shiftId: [null, Validators.required],
      status: [true, Validators.required]
    });

    this.poolForm = this.form.group({
      poolName: [null, Validators.required],
      poolLocation: [null],
      poolFromDate: [null],
      poolToDate: [null,]
    })

  }

  addEscalation() {

    const fromDateValue = this.poolForm.get('poolFromDate')?.value;
    const toDateValue = this.poolForm.get('poolToDate')?.value;
    const poolNameValue = this.poolNameList.find(x => x.code == this.poolForm.get('poolName')?.value);
    const poolLocationValue = this.poolLocationList.find(x => x.code == this.poolForm.get('poolLocation')?.value);

    const createPool = {
      poolNameId: poolNameValue?.code ?? null,
      poolName: poolNameValue?.value ?? null,
      poolLocationId: poolLocationValue?.code ?? null,
      poolLocationName: poolLocationValue?.value ?? null,
      fromDate: fromDateValue ?? null,
      toDate: toDateValue ?? null,
      id: this.editPoolsData?.id || null,
      isDeletable: this.editPoolsData?.isDeletable ?? null
    };

    const list = this.dataSource;

    if (this.editPoolsData) {

      const index = list.findIndex(x => x.id === this.editPoolsData.id);

      if (index > -1) {
        list[index] = { ...list[index], ...createPool };
      }

      this.editPoolsData = null;

    } else {
      const alreadyExists = list.some(x => x.poolNameId === createPool.poolNameId && x.poolLocationId === createPool.poolLocationId
        && x.fromDate === createPool.fromDate && x.toDate === createPool.toDate);

      if (!alreadyExists) {
        list.push(createPool);
      }
    }

    this.dataSource = [...list];
    this.editPoolsData = null;
    this.poolForm.get('poolName')?.reset();
    this.poolForm.get('poolLocation')?.reset();
    const setFromDate = this.datepipe.transform(this.poolminDate, 'yyyy-MM-dd');
    const setToDate = this.datepipe.transform(this.poolmaxDate, 'yyyy-MM-dd');
    this.poolForm.get('poolFromDate')?.setValue(setFromDate);
    this.poolForm.get('poolToDate')?.setValue(setToDate);
  }

  createSchedule() {

    const userNameData = !this.data?.entityId ? (this.scheduleForm.get('userName')?.value && this.data?.selectedEntityId) ? this.data?.selectedEntityId :  this.scheduleForm.get('userName')?.value : this.data?.entityId;
    const userNameValue = this.userListInfo.find(obj => obj.code === userNameData);
    const shiftValue = this.shiftList.find(obj => obj.code === this.scheduleForm.get('shiftId')?.value);
    const scheduleFromDate = this.scheduleForm.get('fromDate')?.value;
    const scheduleToDate = this.scheduleForm.get('toDate')?.value;

    const createSchedule = {
      entityId: userNameValue?.code ?? null,
      entityName: userNameValue?.value ?? null,
      entityType: 'User',
      shiftMasterId: shiftValue?.code ?? null,
      shiftMasterName: shiftValue?.value ?? null,
      entityScheduleId: this.selectedScheduleData?.entityScheduleId ?? null,
      status: this.scheduleForm.get('status').value ?? true,
      startDate: scheduleFromDate ?? null,
      endDate: scheduleToDate ?? null,
      id: this.selectedScheduleData?.id ?? null,
      userPools: this.dataSource.map((item: any) => ({
        id: item.id ?? null,
        poolName: item.poolName,
        poolNameId: item.poolNameId,
        poolLocationName: item?.poolLocationName,
        poolLocationId: item?.poolLocationId,
        fromDate: item.fromDate,
        toDate: item.toDate,
        isDeletable: item.isDeletable ?? null
      }))
    };

    const list = this.scheduleData;

    if (this.selectedScheduleData) {

      const index = list.findIndex(x => x.id === this.selectedScheduleData.id);

      if (index > -1) {
        list[index] = { ...list[index], ...createSchedule };
      }
      this.selectedScheduleData = null;
    } else {
      const alreadyExists = list.some(
        x =>
          x.entityId === createSchedule.entityId &&
          x.shiftMasterId === createSchedule.shiftMasterId &&
          x.startDate === createSchedule.startDate &&
          x.endDate === createSchedule.endDate
      );
      if (!alreadyExists) {
        list.push(createSchedule);
      }
    }
    this.scheduleData = [...list];
    this.dataSource = [];
    this.selectedIndex = null;
    this.isScheduleOpen = true;
    this.isPoolOpen = false;

    this.selectedScheduleData = null;
    this.scheduleForm.reset();
    this.getuserNamebindData();
  }


  getscheduleList(data, index) {
    this.selectedIndex = this.selectedIndex === index ? null : index;
    if (this.selectedIndex === null) {
      this.selectedScheduleData = null;
      this.dataSource = [];
      this.isScheduleOpen = true;
      this.isPoolOpen = false;
      this.scheduleForm.reset();
      this.poolForm.reset();
      this.getuserNamebindData();
      return;
    }
    this.selectedScheduleData = data;
    if (data) {
      this.schedulebindData(data);
      this.onScheduleFromChange(data.startDate, 'edit');
      this.onScheduleToChange(data.endDate, 'edit')
    }
  }

  schedulebindData(data) {
    if (!this.data.entityId && !this.data.selectedEntityId) {
      this.scheduleForm.get('userName').setValue(data?.entityId);
    } else {
      this.scheduleForm.get('userName').setValue(data?.entityName);
    }
    this.scheduleForm.get('fromDate').setValue(data?.startDate);
    this.scheduleForm.get('toDate').setValue(data?.endDate);
    this.scheduleForm.get('shiftId').setValue(data.shiftMasterId);
    this.scheduleForm.get('status').setValue(data.status);
    this.dataSource = data?.userPools;
    this.isScheduleOpen = true;
    this.isPoolOpen = true;
  }

  getuserNamebindData() {
    if (!this.data.entityId) {
      this.scheduleForm.get('userName').setValue(this.data?.entityId);
    } else {
      this.scheduleForm.get('userName').setValue(this.data?.entityName);
    }
  }

  searchUserNamelist(event) {
    if (event?.text.length >= 2) {
      this.commonService.getAllUserSearch(event.text).subscribe(res => {
        this.userNameList = res.results.map(item => ({ code: item.id, value: item.fullName }));
        this.UserNameEnabled = true;
      });
    }
  }

  getUsersList(id) {
    if (id) {
      const userInfo = this as any as { code: string, value: string }[]
      const userId = userInfo?.find(obj => obj.code === id)?.value;
      return userId;
    } else {
      return '';
    }
  }

  onScheduleFromChange(event, key?) {
    if (key === 'edit') {
      this.poolminDate = event;
      const setFromDate = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.poolForm.get('poolFromDate').setValue(setFromDate);
    } else {
      const fromdate = event.target.value;
      this.poolminDate = fromdate;
      const setFromDate = this.datepipe.transform(fromdate, 'yyyy-MM-dd');
      this.poolForm.get('poolFromDate').setValue(setFromDate);
    }

  }

  onScheduleToChange(event, key?) {
    if (key == 'edit') {
      this.poolmaxDate = event;
      const setToDate = this.datepipe.transform(event, 'yyyy-MM-dd');
      this.poolForm.get('poolToDate').setValue(setToDate);
    } else {
      const todate = event.target.value;
      this.poolmaxDate = todate;
      const setToDate = this.datepipe.transform(todate, 'yyyy-MM-dd');
      this.poolForm.get('poolToDate').setValue(setToDate);
    }
  }


  toggleSchedule() {
    this.isScheduleOpen = !this.isScheduleOpen;
  }

  togglePool() {
    this.isPoolOpen = !this.isPoolOpen;
  }

  togglePanel() {
    this.isCollapsed = !this.isCollapsed;
  }

  eventAction(event) {
    if (event.key === 'edit') {
      this.updatedPools(event.data);
    } else if (event.key === 'delete') {
      this.removedPools(event.data);
    }
  }

  updatedPools(data) {
    this.editPoolsData = data;
    if (data) {
      this.poolForm.get('poolName').setValue(data?.poolNameId);
      this.poolForm.get('poolLocation').setValue(data?.poolLocationId);
      this.poolForm.get('poolFromDate').setValue(data?.fromDate);
      this.poolForm.get('poolToDate').setValue(data?.toDate);
    }

  }

  removedPools(data: any) {

    const list = this.dataSource;

    if (data?.id == null) {
      this.dataSource = list.filter(x => x !== data);
      return;
    }
    const index = list.findIndex(x => x.id === data.id);
    if (index > -1) {
      const updatedPool = {
        ...list[index],
        isDeletable: true
      };

      const scheduleIndex = this.scheduleData.findIndex(
        x => x.entityScheduleId === this.selectedScheduleData?.entityScheduleId);

      if (scheduleIndex > -1) {

        const pools = this.scheduleData[scheduleIndex].userPools || [];

        const poolIndex = pools.findIndex(p => p.id === data.id);

        if (poolIndex > -1) {
          pools[poolIndex] = updatedPool;
        }

        this.scheduleData[scheduleIndex] = {
          ...this.scheduleData[scheduleIndex],
          userPools: [...pools]
        };
      }
      const deletablePools = this.scheduleData?.[scheduleIndex]?.userPools ?.filter(pool => pool.isDeletable).map(item => ({...item, scheduleId: this.scheduleData?.[scheduleIndex].entityId}));
      if (deletablePools?.length) {
        deletablePools.forEach(pool => {
          const exists = this.scheduleDeletepool.some(x => x.id === pool.id);
          if (!exists) {
            this.scheduleDeletepool.push(pool);
          }
        });
      }
      this.dataSource = list.filter(x => x.id !== data.id);
    }
  }


  saveDetails() {
    this.isloading = true;
    if (this.scheduleDeletepool.length) {
      this.scheduleData.forEach(schedule => {
        const matchedPools = this.scheduleDeletepool.filter( pool => pool.scheduleId === schedule.entityId );
        if (matchedPools.length) {
          schedule.userPools.push(...matchedPools);
        }
      });
    }

    let createShifts = this.scheduleData.map(schedule => ({
      endDate: this.datepipe.transform(schedule.endDate, 'yyyy-MM-dd HH:mm:ss'),
      entityId: schedule.entityId,
      entityType: schedule.entityType,
      shiftMasterId: schedule.shiftMasterId,
      startDate: this.datepipe.transform(schedule.startDate, 'yyyy-MM-dd HH:mm:ss'),
      status: schedule.status,
      id: schedule.entityScheduleId,

      userPools: schedule.userPools.map(pool => ({
        id: pool.id ?? null,
        fromDate: this.datepipe.transform(pool.fromDate, 'yyyy-MM-dd HH:mm:ss'),
        toDate: this.datepipe.transform(pool.toDate, 'yyyy-MM-dd HH:mm:ss'),
        poolLocationId: pool.poolLocationId,
        poolNameId: pool.poolNameId,
        isDeletable: pool.isDeletable ?? null
      }))
    }));
    // console.log(createShifts)
    // return
    this.commonService.updateShifts(createShifts).subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.isloading = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

}
