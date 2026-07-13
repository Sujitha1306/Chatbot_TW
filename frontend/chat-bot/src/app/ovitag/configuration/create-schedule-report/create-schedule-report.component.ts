import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService, DashboardService, ReportService } from '../../../shared';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PfModelsEditinfoComponent } from '../../../shared/modules/entry-component/pf-models-editinfo/pf-models-editinfo.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../app.module';

@Component({
  selector: 'app-create-schedule-report',
  templateUrl: './create-schedule-report.component.html',
  styleUrls: ['./create-schedule-report.component.scss'],
  providers: [
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
  encapsulation: ViewEncapsulation.None
})
export class CreateScheduleReportComponent {
  public reportForm: FormGroup;
  public scheduleForm: FormGroup;

  public previousDate = new Date(new Date().setDate(new Date().getDate() - 1));
  public selectedIndex = 0;

  public recipientEnabled: boolean = false;
  public isScheduleOpen: boolean = false;
  public isRecipientOpen: boolean = false;
  public isSendMailOpen: boolean = false;
  public isloading: boolean = false;
  
  public recipientTypeList: any;
  public userNameList: any;
  public channelType: any;

  public recipient = null;
  public searchText = null;
  public selectedScheduleId = null;
  public editScheduleInfo = null;
  public scheduleIndex = null;

  public modelList: any[] = [];
  public scheduleList: any[] = [];
  public dataSource: any[] = [];
  public reportGroupList: any[] = []; 
  public scheduleRecipientMap: any [] = [];

  public moreOptions = [{"name": "Edit", "type": "edit", "value": null}, {"name": "Delete", "type": "delete", "value": null}];
  public DisplayColumn = ['Recipient Type', 'Recipient Name', 'Channel Type', 'Action'];
  public DataColumns = ['recipientTypeName', 'recipientName', 'channelName', 'Action'];

  constructor (public form: FormBuilder, public commonService: CommonService, public configurationServices: ConfigurationService,
              @Inject(MAT_DIALOG_DATA) public data: any, public dashboardService: DashboardService, public dialog: MatDialog, 
              public reportService: ReportService, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateScheduleReportComponent>,
              public datepipe: DatePipe) {}

  ngOnInit(): void {
    this.getDataTypes();
    this.buildform();
    if (this.data) {
      this.scheduleList = this.data?.pfSchedule;
    }

    if (this.data.hasOwnProperty('childData') && this.data?.childData) {
      this.scheduleRecipientMap = this.data?.childData;
      this.tabClick({ index: 1 });
      this.getscheduleList(this.data?.childData, this.data?.index);
    }
  }

  buildform() {

    this.reportForm = this.form.group({
      reportName: [this.data?.schedulingName ?? null],
      reportCode: [null],
      reportGroupName: [this.data?.reportGroupType ?? null],
      reportModelId: [this.data?.pfModelId ?? null],
      reportTemplate: [this.data?.template ?? null],
      reportstatus: [this.data?.isActive]
    });

    this.scheduleForm = this.form.group({
      scheduleName: [null, Validators.required],
      parameters: [null, Validators.required],
      time: [null, [Validators.required]],
      monthDay: [null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(31)]],
      month: [null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(12)]],
      weekDay: [null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(7)]],
      status: [null, [Validators.required]],
      recipientName: [null],
      channelType: [null],
      recipientType: [null],
      fromDate: [this.datepipe.transform(this.previousDate, "yyyy-MM-dd") ?? null, Validators.required],
      toDate: [this.datepipe.transform(this.previousDate, "yyyy-MM-dd") ?? null, Validators.required],
      email: [null,Validators.required]
    });

  }

  onScheduleChange(event) {
    if (event) {
        const todate = this.datepipe.transform(event?.value, "yyyy-MM-dd");
        this.scheduleForm.get('toDate').setValue(todate);
    }
  }

  getRecipientName(type) {
    this.recipient = null;
    this.recipient = type;
    this.userNameList = [];
    this.recipientEnabled = false;
    this.scheduleForm.get('recipientName').reset();
    this.scheduleForm.get('channelType').reset();
  }

  getDataTypes() {
    this.isloading = true;
    this.dashboardService.getAllModals().subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.modelList = res.results || [];
      }
    });
            
    this.commonService.getAppTerms('RecipientType,Channel,ReportGrpType').subscribe(res => {
      this.recipientTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType');
      if (this.recipientTypeList.length) {
        this.recipientTypeList = this.recipientTypeList.filter(val => ['RT-RO','RT-US'].includes(val.code));
      }
      this.channelType = res.results.filter(resFilter => resFilter.groupName === 'Channel' && resFilter.code === 'CH-EM');
      this.reportGroupList = res.results.filter(res => res.groupName === 'ReportGrpType');
    });
  }

  searchUserNamelist(id, key?) {
    this.searchText = null;
    this.searchText = id?.text;
    if (this.searchText.length >= 2 && this.recipient != null) {
      if (this.recipient === 'RT-RO') {
        this.configurationServices.getRecipientName(this.searchText, this.recipient).subscribe(res => {
          if (this.dataSource.length && key != 'editData') {
            const recipientIdList = this.dataSource.map(x => x.recipientId);
            this.userNameList = res.results.filter(x => x.id != recipientIdList)
          } else {
            this.userNameList = res.results;
          }
          this.recipientEnabled = true;
        });
      } else {
        this.configurationServices.getRecipientName(this.searchText, this.recipient).subscribe(res => {
          if (this.dataSource.length && key != 'editData') {
            const recipientIdList = this.dataSource.map(x => x.recipientId);
            this.userNameList = res.results.filter(x => x.id != recipientIdList) .map(x => ({...x,name: x.name?.split('(')[0].trim()}));;
          } else {
            this.userNameList = res.results.map(x => ({...x, name: x.name?.split('(')[0].trim() }));;
          }
          this.recipientEnabled = true;
        });
      }
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }

  getRecipientList(id) {
    if (id) {
      const recipient = this as any as { id: string, name: string }[]
      const recipientId = recipient.find(obj => obj.id === id).name;
      return recipientId;
    } else {
      return '';
    }
  }

  editScheduleData(data) {
    this.editScheduleInfo = data;
    if (data) {
      setTimeout(() => {
      this.scheduleForm.get('recipientType').setValue(data.recipientType);
      this.scheduleForm.get('recipientName').setValue(data.recipientId);
      this.scheduleForm.get('channelType')?.setValue(data.channelId);
      },800)
    }
  }

  deleteScheduleData(data: any) {
    const list = this.scheduleRecipientMap[this.selectedScheduleId]?.recipients;

    if (!list) return;

    const index = list.findIndex(x => x === data || x.id === data.id);

    if (index === -1) return;

    if (!data.id) {
      list.splice(index, 1);  
      this.dataSource = [...list];
      return;
    }

    list[index] = {
      ...list[index],
      isDeletable: true
    };
    this.dataSource = list.filter(x => !x.isDeletable);
  }



  addEscalation() {

  if (!this.selectedScheduleId) {
    this.selectedScheduleId = null;
  }

  if (!this.scheduleRecipientMap[this.selectedScheduleId]) {
    this.scheduleRecipientMap[this.selectedScheduleId] = {
      recipients: [],
      details: null
    };
  }

  const recipientNameValue = this.recipientTypeList.find( x => x.code == this.scheduleForm.get('recipientType')?.value);
  const recipientTypeValue = this.userNameList.find( x => x.id == this.scheduleForm.get('recipientName')?.value);
  const channelTypeValue = this.channelType.find( x => x.code == this.scheduleForm.get('channelType')?.value);

  const createSchedule = {
    recipientTypeName: recipientNameValue?.value,
    recipientType: recipientNameValue?.code,
    recipientName: recipientTypeValue?.email ? `${recipientTypeValue?.name} (${recipientTypeValue?.email})` : recipientTypeValue?.name,
    recipientId: recipientTypeValue?.id,
    channelName: channelTypeValue?.value,
    channelId: channelTypeValue?.code,
    id: this.editScheduleInfo?.id || null,
  };

  const list = this.scheduleRecipientMap[this.selectedScheduleId].recipients;

  if (this.editScheduleInfo) {

    const index = list.findIndex(x => x.id === this.editScheduleInfo.id);

    if (index > -1) {
      list[index] = { ...list[index], ...createSchedule };
    }

    this.editScheduleInfo = null;

  } else {

    const alreadyExists = list.some(x => x.recipientId === createSchedule.recipientId && x.recipientType === createSchedule.recipientType &&
                          x.channelId === createSchedule.channelId);

    if (!alreadyExists) {
      list.push(createSchedule);
    }
  }
  this.dataSource = [...list];

  this.scheduleForm.get('recipientType')?.reset();
  this.scheduleForm.get('recipientName')?.reset();
  this.scheduleForm.get('channelType')?.reset();
}

  createSchdeule() {
    const key = this.selectedScheduleId ?? 'null';
    if (!this.scheduleRecipientMap?.[key]) {
      this.scheduleRecipientMap[key] = {
        recipients: [],
        details: null
      };
    }

    this.scheduleRecipientMap[key].details = this.scheduleForm.value;

    const scheduleListData = Object.keys(this.scheduleRecipientMap || {}).filter(id => id === 'null').map(id => {
        const entry = this.scheduleRecipientMap[id];

        return {
          id: null,
          facilityId: this.scheduleList?.[0]?.facilityId ?? null,
          schedule: this.buildCron(entry?.details),
          criteria: JSON.stringify(entry?.details?.parameters ?? {}),
          name: entry?.details?.scheduleName ?? null,

          identifyingId: this.scheduleList?.[0]?.identifyingId ?? null,
          identifyingType: this.scheduleList?.[0]?.identifyingType ?? null,

          isActive: entry?.details?.status ?? true,
          pfScheduleRecipient: entry?.recipients ?? []
        };
      });

    this.scheduleList.push(...scheduleListData);
    this.scheduleList = [...this.scheduleList];
    this.isScheduleOpen = false;
    this.isRecipientOpen = false;
    this.dataSource = [];
    this.selectedScheduleId = null;
  }


  tabClick(event) {
    this.selectedIndex = event?.index;
  }

  getscheduleList(event: any, index: number) {
    this.scheduleIndex = this.scheduleIndex === index ? null : index;

    if (!event) return;

    const key = event.id ?? `idx_${index}`;

    if (this.selectedScheduleId) {
      this.scheduleRecipientMap[this.selectedScheduleId].details = this.scheduleForm.value;
    }

    if (this.selectedScheduleId === key) {
      this.selectedScheduleId = null;
      this.dataSource = [];
      this.isScheduleOpen = false;
      this.isRecipientOpen = false;
      this.isSendMailOpen = false;
      this.scheduleForm.reset();
      return;
    }

    this.selectedScheduleId = key;

    if (!this.scheduleRecipientMap[key]) {
      this.scheduleRecipientMap[key] = {
        recipients: event.pfScheduleRecipient ? [...event.pfScheduleRecipient] : [],
        details: null
      };
    }

    const selectData = this.scheduleRecipientMap[key];

    if (selectData.details) {
      this.scheduleForm.patchValue(selectData.details);
    } else {
      this.bindScheduleForm(event);
    }

    this.dataSource = [...selectData.recipients];

    this.isScheduleOpen = true;
    // this.isRecipientOpen = true;
  }


  
  bindScheduleForm(data) {
    this.patchFromCron(data.schedule);
    this.scheduleForm.get('scheduleName').setValue(data.name);
    this.scheduleForm.get('status').setValue(data.isActive);
    this.scheduleForm.get('parameters').setValue(data.criteria);
  }

  patchFromCron(cron: string) {
    const [sec, min, hour, day, month, week] = cron.split(' ');
    this.scheduleForm.patchValue({
      time: `${hour?.padStart(2, '0')}:${min?.padStart(2, '0')}`,
      monthDay: day,
      month: month,
      weekDay: week
    });
  }

  eventAction(event) {
    if (event.key === 'edit') {
      this.recipient = event?.data.recipientType;
      let searchText = {'text': event?.data?.recipientName.substring(0, 5)};
      this.searchUserNamelist(searchText, 'editData');
      this.editScheduleData(event.data);
    } else if (event.key === 'delete') {
      this.deleteScheduleData(event.data);
    }
  }

  addModel() {
    const dialogRef = this.dialog.open(PfModelsEditinfoComponent, {
      data: null, panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getDataTypes();
    });
  }

  toggleSchedule() {
    this.isScheduleOpen = !this.isScheduleOpen;

    if (this.isScheduleOpen) {
      this.isRecipientOpen = false;
      this.isSendMailOpen = false;
    }
  }

  toggleRecipient() {
    this.isRecipientOpen = !this.isRecipientOpen;

    if (this.isRecipientOpen) {
      this.isScheduleOpen = false;
      this.isSendMailOpen = false;
    }
  }

  toggleSendMail() {
    this.isSendMailOpen = !this.isSendMailOpen;

    if (this.isSendMailOpen) {
      this.isScheduleOpen = false;
      this.isRecipientOpen = false;
    }
  }

    
  saveDetails() {

    const pfScheduleData: any[] = [];
    this.data?.pfSchedule?.forEach((serverSchedule: any) => {
      const scheduleId = serverSchedule?.id;
      const reciptSchedule = this.scheduleRecipientMap?.[scheduleId];
      if (!reciptSchedule) return;
      const schDetails = reciptSchedule?.details ?? this.scheduleForm.value;

      pfScheduleData.push({
        id: scheduleId,
        facilityId: serverSchedule.facilityId,
        identifyingId: serverSchedule.identifyingId,
        identifyingType: serverSchedule.identifyingType,
        isActive: schDetails?.status,
        name: schDetails?.scheduleName,
        criteria: schDetails?.parameters,
        schedule: this.buildCron(schDetails),

        scheduleCreatedDate: serverSchedule.scheduleCreatedDate,

        pfScheduleRecipient: (reciptSchedule.recipients || []).map((r: any) => ({
          id: r.id ?? null,
          pfScheduleId: scheduleId,
          recipientId: r.recipientId,
          recipientName: r.recipientName,
          recipientType: r.recipientType,
          recipientTypeName: r.recipientTypeName,
          channelId: r.channelId,
          channelName: r.channelName,
          facilityId: r.facilityId ?? serverSchedule.facilityId,
          isActive: true,
          isDeletable: r.isDeletable
        }))
      });
    });

    const editData = {

      id: this.data.id,
      name: this.reportForm.get('reportName').value ?? null,
      canSchedule: this.data.canSchedule,
      isActive: this.reportForm.get('reportstatus').value,
      modelInputParam: this.data.modelInputParam,
      modelIsActive: this.data.modelIsActive,
      modelName: this.data.modelName,
      modelOutputParam: this.data.modelOutputParam,
      modelQueryString: this.data.modelQueryString,
      modelTargetDb: this.data.modelTargetDb,
      modelTypeId: this.data.modelTypeId,
      modelUrl: this.data.modelUrl,
      facilityId: this.data.facilityId,

      pfModelId: this.reportForm.get('reportModelId').value,
      retryInterval: this.data.retryInterval,

      reportGroupType: this.reportForm.get('reportGroupName').value,
      reportType: this.data.reportType,
      schedulingName: this.data.schedulingName,

      template: this.reportForm.get('reportTemplate').value,

      pfSchedule: pfScheduleData

    };
    // console.log(editData);
    // return
    this.reportService.updateReportSchedule(this.data.id, editData).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });

  }

  buildCron(d: any): string {
    if (!d?.time) return '';
    const minute = this.extractMinute(d.time);
    const hour = this.extractHour(d.time);
    return `0 ${minute} ${hour} ${d.monthDay} ${d.month} ${d.weekDay}`;
  }

  extractHour(time: string): string {
    const [t, modifier] = time.split(' ');
    let [hours] = t.split(':');
    let h = parseInt(hours, 10);
    if (modifier?.toLowerCase() === 'pm' && h < 12) h += 12;
    if (modifier?.toLowerCase() === 'am' && h === 12) h = 0;
    return h.toString();
  }

  extractMinute(time: string): string {
    const [t] = time?.split(' ');
    const [, minutes] = t?.split(':');
    return parseInt(minutes, 10)?.toString();
  }

  sendMail() {
    let sendmailData = null;
    sendmailData = {
      'emailIds': this.scheduleForm.get('email').value ?? null,
      'fdt': this.datepipe.transform(this.scheduleForm.get('fromDate').value, "yyyy-MM-dd")  ?? null,
      'tdt': this.datepipe.transform(this.scheduleForm.get('toDate').value, "yyyy-MM-dd") ?? null,
      'reportId': this.scheduleList[0].identifyingId,
      'scheduleId': this.selectedScheduleId ?? null
    }
    this.isloading = true;
    this.commonService.updatedMail(sendmailData).subscribe(res => {
      this.isloading = false;
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.isSendMailOpen = false;
      } else {
        this.toastr.warning('Warning', `${res.message}`);
        this.isSendMailOpen = false;
      }
      this.scheduleForm.get('fromDate').reset();
      this.scheduleForm.get('toDate').reset();
      this.scheduleForm.get('email').reset();
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
      this.isloading = false;
    });
  }

  fixClick() {
    console.log('')
  }
}