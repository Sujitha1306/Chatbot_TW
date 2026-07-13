/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
 ******************************************************************************/

import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ViewEncapsulation, ElementRef, ChangeDetectorRef, Injectable, Inject, Input, Output, EventEmitter, OnChanges, SimpleChanges, Optional, TemplateRef } from '@angular/core';
import { isSameDay, isSameMonth, addDays, endOfMonth, format, startOfMonth, addHours, } from 'date-fns';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarEventTitleFormatter, CalendarView, } from 'angular-calendar';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { AppOtNewComponent } from '../app-ot-new/app-ot-new.component';
import { MaskDataPipe } from '../../../pipes/mask-data.pipe';
import { DateRange } from '@angular/material/datepicker';
import { ManagePatientComponent } from '../manage-patient/manage-patient/manage-patient.component';
import { CalDetailModel, calendarBoolen, CalendarConfig, CalendarEvents, CalendarInputModel, CalendarModel, EntityDataModel, TableDetailModel } from '../../../model/calendar.model';
import { PrintStickerComponent } from '../../../../ovitag/workflow/print-sticker/print-sticker.component';
import { CreateUserScheduleComponent } from '../create-user-schedule/create-user-schedule.component';
import { AppToastService } from '../../../services/toaster.service';

@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
  weekTooltip(event: CalendarEvent, title: string) {
    if (!event.meta.tmpEvent) {
      return super.weekTooltip(event, title);
    }
  }

  dayTooltip(event: CalendarEvent, title: string) {
    if (!event.meta.tmpEvent) {
      return super.dayTooltip(event, title);
    }
  }
}

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class CalendarComponent implements OnInit,OnChanges {

  @ViewChild('scrollContainer') scrollContainer: ElementRef<HTMLElement>;
  @ViewChild('scrollContainerOt') scrollContainerOt: ElementRef;
  @ViewChild('eventsDetails') eventsDetails!: TemplateRef<any>;

  @Input() calendarInput : any = new CalendarInputModel();
  @Output() calendarUpdatedData = new EventEmitter();

  public calendarModel: CalendarModel;
  public CalendarView = CalendarView;
  public calDetail = new CalDetailModel();
  public entityData: EntityDataModel = new EntityDataModel();
  public tableDetails: TableDetailModel[] = [];
  public calendarGroup: FormGroup;
  public actions: CalendarEventAction[] = [];
  public calendarEvents = new CalendarEvents();
  public externalEvents: CalendarEvent[] = this.calendarEvents.externalEvents;
  public selectedDateRange: DateRange<Date>;
  public calendarConfi: CalendarConfig = new CalendarConfig();
  public calendarBoolen: calendarBoolen = new calendarBoolen();
  private readonly eventClickSubject = new Subject<any>();

  public currentDate = this.datePipe.transform(new Date(), 'MMMM d, y');
  public entitySelectedDate = this.datepipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
  public entityEndDate = this.entitySelectedDate;

  public usersDetails = [];
  public eventsExp = [];
  public weekRange: any [] =[];
  public weekends : any[] = [];
  public events : any [] = [];
  public eventlistInfo: any[] = [];
  public eventsInfo: any[] = [];
  public isEventSelectedId: any[] = [];
  public holidayData: any[] = [];
  public holidayDetails: any[] = [];
  public scheduleData: any[] = [];
  public maintenanceCode: any = [];
  public scheduleList: any[] = [];
  
  public view = 'Day';
  public start = null;
  public end = null;
  public selectedIndex = null;
  public filterValue = null;
  public entityTooleTipData : any;
  private eventClickSubscription: any;

  public monthStartDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  public monthEndDate = this.datePipe.transform( new Date(new Date().getFullYear() + 1, 11, 31),'yyyy-MM-dd');

  public entityList = [{code: 'asset', value: 'Asset'}, {code: 'location', value: 'Location'}, {code: 'staff', value: 'Staff'}];
  public groupFilter = [{ id: 'entity', value: 'Entity', isAll: true, selectionType: 'multi', subFilters: this.entityList, defaultSelected: ['All'] }];

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog,
    public datepipe: DatePipe, private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly fb: FormBuilder,
    private readonly maskData: MaskDataPipe,
    private readonly workflowService: WorkflowService,
    private toastr: AppToastService ) {

    this.calendarModel = new CalendarModel();
    this.getDynamicColor();
  }
 
  ngOnInit(): void {
    
    if (this.data) {
      const entityType = this.data?.resourseType;
      this.groupFilter[0]['defaultSelected'] = [entityType];
    }

    this.eventClickSubscription = this.eventClickSubject.pipe(debounceTime(300)).subscribe((events) => {
        this.manageAction('edit', events.event, true);
      });
      
    if (this.calendarInput.entityType === 'CAL-OT') {

      if (this.calendarInput.status === 'CAL-TL') {
      } else {
        this.calendarBoolen.resourceExpand = false;
        this.getOperationData();
      }

    } else if (this.calendarInput.entityType === 'CAL-AMC') {
        setTimeout(() => {this.getDynamicTableColumn()},100)
    } else if (this.calendarInput.entityType === 'CAL-US') {
      this.calDetail.view = CalendarView.Week;
      this.checkView('Week')
      this.getUserSchedulesData();

    } else {
      this.getEventData();
      this.getEntityException();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['calendarInput'] && changes['calendarInput'].currentValue) {
      const onChangeinfo = changes['calendarInput'].currentValue;
      if (onChangeinfo.entityType === 'CAL-OT') {
        this.calDetail.selectedDate = new Date(onChangeinfo.toDate);
        if (onChangeinfo.status === 'CAL-TL') {
          this.getTimeLineData();
          this.getUtilizationData();
        } else {
          this.calendarBoolen.resourceExpand = false;
          this.getOperationData();
        }
      } else if (onChangeinfo.status === 'CAL-MS') {
        this.calDetail.view = CalendarView.Month;
        this.scheduleData = onChangeinfo.data;
        setTimeout(() => { this.getDataMonthView(this.calDetail.selectedDate) }, 500);
      } else if (this.calendarInput.entityType === 'CAL-AMC') {
        if (onChangeinfo.groupFilter?.filterData) {
          onChangeinfo.fromDate = this.currentDate;
        }
        this.getAssetMaintenance();
      } else if (this.calendarInput.entityType === 'CAL-US') {
        // this.view = 'Week'
      }
    }
  }

  getDynamicTableColumn() {
    this.calDetail.view = CalendarView.Month;
    this.view = 'Month';
    this.commonService.getDynamicTableColumn('assetmaintenance').subscribe(res => {
      if (res.statusCode === 1) {
        const dynamicColumns = res.results.contentObject;
        this.maintenanceCode = dynamicColumns.maintenanceCode;
      }
    });
    this.getAssetMaintenance();
  }

  buildForm(data){
    this.calendarGroup = this.fb.group({
      'name' : [data ? data.name : null],
      'startDate' : [data ? this.datepipe.transform(data.start, 'yyyy-MM-dd HH:mm') : null],
      'endDate' :  [data ? this.datePipe.transform (data.end, 'yyyy-MM-dd HH:mm') : null],
      'status' : [data ? data.status : null]
    });
  }
  
  // getAssetMaintenance(date?: any) {
  //   this.calendarBoolen.isloading = true;
  //   let toDate = null;
  //   const rawDate = date || this.calendarInput?.fromDate;
  //   if (!rawDate) return;

  //   const fromDate = new Date(rawDate);
  //   if (isNaN(fromDate.getTime())) return;

  //   this.calDetail.selectedDate = fromDate;
  //   this.entitySelectedDate = this.datePipe.transform(fromDate, 'yyyy-MM-dd');

  //   if (this.calDetail.view === CalendarView.Month) {
  //     this.currentDate = this.datePipe.transform(fromDate, 'MMMM, y');
  //     const {start, end} = this.getVisibleMonthRange(fromDate);
  //     this.calendarInput.fromDate = this.datepipe.transform(start, 'yyyy-MM-dd');
  //     toDate = this.datepipe.transform(end, 'yyyy-MM-dd');
  //   } else {
  //     this.calendarInput.fromDate = this.datepipe.transform(fromDate, 'yyyy-MM-dd');
  //     if (this.view === 'Week') {
  //       toDate = new Date(fromDate);
  //       toDate.setDate(fromDate.getDate() + 6);
  //     } else if (this.view === '3Days') {
  //       toDate = new Date(fromDate);
  //       toDate.setDate(fromDate.getDate() + 2);
  //     } else {
  //       toDate = fromDate;
  //     }
  //     toDate = this.datepipe.transform(toDate, 'yyyy-MM-dd');
  //   }

  //   this.commonService.getAssetMaintenanceCalendar(this.calendarInput.fromDate, toDate,this.calendarInput?.groupFilter?.assetTypeIds, this.calendarInput.groupFilter?.departmentId, this.calendarInput.groupFilter?.isOwnedDepartment, null, this.calendarInput.groupFilter?.activityCategoryIds, this.calendarInput.groupFilter?.statusList ).subscribe(res => {
  //     this.calendarBoolen.isloading = false;
  //     let assetCategoryIds = ['AC-AMC', 'AC-PMS', 'AC-CAL', 'AC-COR'];
  //     if (this.maintenanceCode.length > 0) {
  //       assetCategoryIds = this.maintenanceCode.map(item => item.key);
  //     }
  //     this.entityData['CAL_AMC'] = res.results.filter((res: any) => assetCategoryIds.includes(res.activityCategoryId));

  //       this.events = this.entityData['CAL_AMC'].map((data, i) => {
  //         let color =  this.calendarConfi.dynamicColosData?.maintenanceEvent ? this.calendarConfi.dynamicColosData?.maintenanceEvent : {primary: '#cfcfcf', secondary: '#ffffff'};
  //         const statusClass = data?.isOverDue && data?.isNextDue ? 'isoverNextDue' : data?.isOverDue? 'isOverDue' : data?.isNextDue ? 'isNextDue' : 'schedule';

  //         const title = `<div class="ovi-font-family calen-title-12">
  //                           <div class="tw-asset-title-1">
  //                             <img src="${ data.activityCategoryId === 'AC-AMC' ? 'assets/icons/AMC_02.svg' : data.activityCategoryId === 'AC-PMS' ? 'assets/icons/PMC_01.svg'
  //                               : data.activityCategoryId === 'AC-CAL' ? 'assets/icons/calibrate1.svg' : data.activityCategoryId === 'AC-COR' ? 'assets/icons/Corrective1_clipboard-check-outline.svg'
  //                               : '/assets/Alert/common_icons/asset_due_date.svg'}" class="tw-img-width tw-asset-status ${statusClass}">
  //                             <span>${data?.entityName} <span class="ovi-prmry-clr">(${data?.entityId})</span></span>
  //                           </div>
  //                           <div class="calen-title-sub">
  //                             <span>${data?.scheduleTypeName}</span>
  //                           </div>
  //                         </div>`;

  //         return {
  //           start: new Date(data.scheduleStartTime),
  //           end: new Date(data.scheduleEndTime),
  //           title: title,
  //           scheduleStartTime: data.scheduleStartTime,
  //           scheduleEndTime: data.scheduleEndTime,
  //           entityName: data.entityName,
  //           entityId: data.entityId,
  //           entityType: data.entityType,
  //           statusName: data.statusName,
  //           statusId: data.statusId,
  //           requestId: data.requestId,
  //           scheduleTypeId: data.scheduleTypeId,
  //           scheduleTypeName: data.scheduleTypeName,
  //           scheduleTime: data.scheduleTime,
  //           activityCategoryId: data.activityCategoryId,
  //           activityCategoryName: data.activityCategoryName,
  //           activityId: data.activityId,
  //           activityName: data.activityName,
  //           assetTypeName: data.assetTypeName,
  //           isOverDue: data?.isOverDue,
  //           isNextDue: data?.isNextDue,
  //           requestIdentifier: data?.requestIdentifier,
  //           performerTypeId: data?.performerTypeId,
  //           performerTypeName: data?.performerTypeName,
  //           performerId: data?.performerId,
  //           performerName: data?.performerName,
  //           entityIdentifier: data?.entityIdentifier,
  //           nextDueStartTime: data?.nextDueStartTime,
  //           nextDueEndTime: data?.nextDueEndTime,
  //           overDueStartTime: data?.overDueStartTime,
  //           overDueEndTime: data?.overDueEndTime,
  //           color: color,
  //           actions: [],
  //           draggable: false,
  //           allDay: false
  //         };
  //       });
  //       this.events = [...this.events];
  //       this.cdr.detectChanges();
  //       this.scrollToCurrentView(this.entityData['booking'][0]?.scheduleStartTime);
  //     });
  // }

  getUserSchedulesData(date?: any, entityId?:any) {
    let toDate = null;
    const rawDate = date || this.calendarInput?.fromDate;
    if (!rawDate) return;

    const fromDate = new Date(rawDate);
    if (isNaN(fromDate.getTime())) return;

    this.calDetail.selectedDate = fromDate;
    this.entitySelectedDate = this.datePipe.transform(fromDate, 'yyyy-MM-dd');

    if (this.calDetail.view === CalendarView.Month) {
      this.currentDate = this.datePipe.transform(fromDate, 'MMMM, y');
      const {start, end} = this.getVisibleMonthRange(fromDate);
      this.calendarInput.fromDate = this.datepipe.transform(start, 'yyyy-MM-dd');
      toDate = this.datepipe.transform(end, 'yyyy-MM-dd');
    } else {
      this.currentDate = this.datePipe.transform(fromDate, 'MMMM d, y');
      this.calendarInput.fromDate = this.datepipe.transform(fromDate, 'yyyy-MM-dd');
      if (this.view === 'Week') {
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6);
      } else if (this.view === '3Days') {
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 2);
      } else {
        toDate = fromDate;
      }
      toDate = this.datepipe.transform(toDate, 'yyyy-MM-dd');
      this.calDetail.selectedEndDate = toDate;
    }
    const uesrdata = this.calendarInput;
    this.calendarBoolen.isloading = true;
    const selectedEntityId = entityId ?? null
    this.commonService.getEntityShifts(selectedEntityId, uesrdata?.type, uesrdata.fromDate, toDate).subscribe(res => {
      this.calendarBoolen.isloading = false;

      if (res.statusCode !== 1) return;

      this.entityData.CAL_US = res.results;

      if (!entityId) {
        this.scheduleList = this.entityData.CAL_US;
        this.filterValue = null;
      }

      this.events = [];

      const viewStart = new Date(uesrdata.fromDate);
      const viewEnd = new Date(toDate);

      viewStart.setHours(0, 0, 0, 0);
      viewEnd.setHours(23, 59, 59, 999);

      const baseStartHour = this.calDetail.dayStartHour ?? 4;

      const intervalMinutes = 60;
      const gapMinutes = 20;

      let slotTracker: Record<string, { hour: number; minute: number }> = {};

      this.entityData.CAL_US.forEach(data => {

        const dataStart = new Date(data.startDate);
        const dataEnd = new Date(data.endDate);

        if (dataEnd < viewStart || dataStart > viewEnd) return;

        let currentDate = new Date(dataStart);

        while (currentDate <= dataEnd) {

          if (currentDate > viewEnd) break;

          if (currentDate >= viewStart) {

            const dateKey = currentDate.toDateString();

            if (!slotTracker[dateKey]) {
              slotTracker[dateKey] = {
                hour: baseStartHour,
                minute: 0
              };
            }
            const { hour, minute } = slotTracker[dateKey];
            const start = new Date(currentDate);
            start.setHours(hour, minute, 0, 0);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + intervalMinutes);
            const color = this.calendarConfi.dynamicColosData?.scheduleEvent ? this.calendarConfi.dynamicColosData?.scheduleEvent : { primary: '#cfcfcf', secondary: '#ffffff' };
            const poolNames = data?.userPools?.length ? data.userPools.map(p => p.poolName).join(', ') : '';
           const title = ` <div class="cal-event-card">
                            <div class="cal-event-name">
                              ${data?.entityName ?? ''}
                            </div>

                            <div class="cal-us-event-pool">
                              ${poolNames ? `<span>${poolNames}</span>` : '&nbsp;'}
                            </div>

                              <div class="cal-event-shift-row">
                                <div class="cal-event-shift">
                                  ${data?.shiftMasterName ?? ''}
                                </div>
                              </div>

                            </div>`;
            this.events.push({
              start,
              end,
              title: title,
              meta: data,
              color: color
            });

            const next = new Date(end);
            next.setMinutes(next.getMinutes() + gapMinutes);

            slotTracker[dateKey] = {
              hour: next.getHours(),
              minute: next.getMinutes()
            };
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
      this.cdr.detectChanges();
    });

  }

  getAssetMaintenance(date?:any) {
    this.calendarBoolen.isloading = true;
    let toDate = null;
    const rawDate = date || this.calendarInput?.fromDate;
    if (!rawDate) return;

    const fromDate = new Date(rawDate);
    if (isNaN(fromDate.getTime())) return;

    this.calDetail.selectedDate = fromDate;
    this.entitySelectedDate = this.datePipe.transform(fromDate, 'yyyy-MM-dd');

    if (this.calDetail.view === CalendarView.Month) {
      this.currentDate = this.datePipe.transform(fromDate, 'MMMM, y');
      const {start, end} = this.getVisibleMonthRange(fromDate);
      this.calendarInput.fromDate = this.datepipe.transform(start, 'yyyy-MM-dd');
      toDate = this.datepipe.transform(end, 'yyyy-MM-dd');
    } else {
      this.currentDate = this.datePipe.transform(fromDate, 'MMMM d, y');
      this.calendarInput.fromDate = this.datepipe.transform(fromDate, 'yyyy-MM-dd');
      if (this.view === 'Week') {
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6);
      } else if (this.view === '3Days') {
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 2);
      } else {
        toDate = fromDate;
      }
      toDate = this.datepipe.transform(toDate, 'yyyy-MM-dd');
    }
    this.commonService.getAssetMaintenanceCount(this.calendarInput.fromDate, toDate,this.calendarInput?.groupFilter?.assetTypeIds,this.calendarInput.groupFilter?.departmentId, 
      this.calendarInput.groupFilter?.isOwnedDepartment, null, this.calendarInput.groupFilter?.activityCategoryIds, this.calendarInput.groupFilter?.isAssignedDepartment, this.calendarInput.groupFilter?.statusList, 
      this.calendarInput.groupFilter?.frequency).subscribe(res => {
      this.calendarBoolen.isloading = false;
      if (res.statusCode === 1) {
        let assetCategoryIds = ['AC-AMC', 'AC-PMS', 'AC-CAL', 'AC-COR'];

        if (this.maintenanceCode?.length > 0) {
          assetCategoryIds = this.maintenanceCode.map(item => item.key);
        }
        this.entityData['CAL_AMC'] = [].concat(...res.results.map(entry => (entry.maintenance || [])
          .filter(m => assetCategoryIds.includes(m.categoryId)).map(item => ({
            ...item,
            date: entry.date
          })))
        );
        const intervalMinutes = 25;
        const gapMinutes = 10;
        let previousDate: string | null = null;
        let currentHour = this.calDetail.dayStartHour ?? 0;
        let currentMinute = 0;

        this.events = this.entityData['CAL_AMC'].map((data, i) => {
          const color = this.calendarConfi.dynamicColosData?.maintenanceEvent ? this.calendarConfi.dynamicColosData?.maintenanceEvent : { primary: '#cfcfcf', secondary: '#ffffff' };
          let baseDate: Date;
          if (data.date.includes('-')) {
            const parts = data.date.split('-');
            if (parts[0].length === 4) {
              const [year, month, day] = parts.map(Number);
              baseDate = new Date(year, month - 1, day);
            } else {
              const [day, month, year] = parts.map(Number);
              baseDate = new Date(year, month - 1, day);
            }
          } else {
            baseDate = new Date(data.date);
          }
          const dateKey = baseDate.toDateString();
          if (previousDate !== dateKey) {
            currentHour = this.calDetail.dayStartHour ?? 0;
            currentMinute = 0;
            previousDate = dateKey;
          }

          const start = new Date(baseDate);
          start.setHours(currentHour, currentMinute, 0);
          const end = new Date(start);
          end.setMinutes(start.getMinutes() + intervalMinutes);
          const next = new Date(end);
          next.setMinutes(end.getMinutes() + gapMinutes);
          currentHour = next.getHours();
          currentMinute = next.getMinutes();
            
            const title = `<div class="ovi-font-family calen-title-12">
                             <div class="tw-asset-title-1">
                               <span class="calen-title-3"> ${data?.categoryName} : </span>
                               <span  class="tw-Amc-tooltip-row-2">  ${data?.count} </span>
                             </div>
                          </div>`;
            return {
              start: start,
              end: end,
              title: title,
              categoryName: data.categoryName,
              categoryId: data.categoryId,
              counts: data.count,
              color: color
            };
          });
        }
        this.events = [...this.events];
        this.cdr.detectChanges();
      });
  }

  getDateChange(date?: any, datepicker?: any) {
    this.weekRange = [];
    if(this.calDetail.view === 'week' && !this.calendarBoolen.threeDaysExist) {
      this.calDetail.selectedDate = date;
      let date1 = new Date();
      date1.setDate(date.getDate() + 6);
      this.selectedDateRange = new DateRange(
        date, date1
      );
      this.calDetail.selectedEndDate = date1;
      this.start = this.datePipe.transform(this.selectedDateRange.start, 'MMMM d, y');
      this.end = this.datePipe.transform(this.selectedDateRange.end, 'MMMM d, y');
      const start1 = this.datePipe.transform(this.calDetail.selectedDate, 'YYYY-MM-dd 12:00:00');
      const end1 = this.datePipe.transform(this.selectedDateRange.end, 'YYYY-MM-dd 23:59:00');
      this.entityEndDate = this.datepipe.transform(this.selectedDateRange.end, 'yyyy-MM-dd');
      for (let d = new Date(start1); d <= new Date(end1); d.setDate(d.getDate() + 1)) {
        let dateKey = d.toISOString().split("T")[0];
        this.weekRange.push(dateKey);
      }
    } else if(this.calDetail.view === 'week' && this.calendarBoolen.threeDaysExist) {
      this.calDetail.selectedDate = date;
      let date1 = new Date();
      date1.setDate(date.getDate() + 2);
      this.selectedDateRange = new DateRange(
        date, date1
      );
      this.calDetail.selectedEndDate = date1;
      this.start = this.datePipe.transform(this.selectedDateRange.start, 'MMMM d, y');
      this.end = this.datePipe.transform(this.selectedDateRange.end, 'MMMM d, y');
      const start1 = this.datePipe.transform(this.calDetail.selectedDate, 'YYYY-MM-dd 12:00:00');
      const end1 = this.datePipe.transform(this.selectedDateRange.end, 'YYYY-MM-dd 23:59:00');
      this.entityEndDate = this.datepipe.transform(this.selectedDateRange.end, 'yyyy-MM-dd');
      for (let d = new Date(start1); d <= new Date(end1); d.setDate(d.getDate() + 1)) {
        let dateKey = d.toISOString().split("T")[0];
        this.weekRange.push(dateKey);
      }
    } else if (this.calDetail.view === 'month') {
      const ctrlValue = this.calDetail.selectedDate || new Date();
      ctrlValue.setMonth(date?.getMonth());
      ctrlValue.setFullYear(date?.getFullYear());
      this.calDetail.selectedDate = new Date(ctrlValue);
      this.currentDate = this.datePipe.transform(this.calDetail.selectedDate, 'MMMM, y');
      this.entitySelectedDate = this.datePipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
      datepicker?.close();
    } else {
      this.entityEndDate = null;
    }
    if (this.calDetail.selectedDate != null && this.calDetail.selectedDate != undefined) {
      this.entitySelectedDate = this.datePipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
      this.currentDate = this.datePipe.transform(this.calDetail.selectedDate, 'MMMM d, y');
      if (this.entitySelectedDate != null && this.entitySelectedDate != undefined) {
        this.tableDetails = [];
        this.events = [];
        if (this.data) {
          this.data['fromDate'] = this.entitySelectedDate;
          this.data['toDate'] = this.entityEndDate;
        }
        if (this.calendarInput?.entityType === 'CAL-AMC') {
         this.getAssetMaintenance(this.calDetail.selectedDate);
        } else if (this.data?.status === 'CAL-TL') {
          this.getEventData();
        } else if (this.calendarInput?.entityType === 'CAL-US') {
           this.getUserSchedulesData(this.calDetail.selectedDate);
        } else {
          if (!this.data) {
            this.getEventData();
          }
          this.getEntityException();
        }
      }
    }
  }

  getMonthDateChange(dateValue: any) {
    const date = new Date(dateValue);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const formattedDate = this.datepipe.transform(endOfMonth, 'yyyy-MM-dd');
    return formattedDate;
  }

  getDataMonthView(data, id?) {
    this.events = [];
    this.weekends = [];
    this.entityData['CAL-MS'] = [];
    if (id == 'TW-MON') {
      if (data > this.monthEndDate) {
        this.monthEndDate = data;
      }
    }
    this.workflowService.getHolidays(this.monthStartDate, this.monthEndDate).subscribe(res => {
      if (res.statusCode != 0) {
        this.holidayDetails = res.results?.filter(x => x.isActive === true);
        this.holidayData = this.holidayDetails;
        const weeklyData = [...this.holidayData.filter(x => x.typeId === 'HT-WKL'), ...this.scheduleData.filter(x => x.typeId === 'HT-WKL')]
        this.getCurrentMonthWeekends(weeklyData, data);
        const validPatternIds = this.scheduleData.map(s => s.holidayPatternId).filter(Boolean);
        this.weekends = this.weekends.filter(h => validPatternIds.includes(h.holidayPatternId));
        const holidayDateInfo = [...this.holidayData, ...this.weekends, ...this.scheduleData];
        this.entityData['CAL-MS'] = holidayDateInfo.filter(res => res.startDate != null || res.endDate != null);
        let eventsData = [];
        eventsData = this.entityData['CAL-MS'].map((data) => {
          if (data.endDate == null) {
            data.endDate = data.startDate
          }
          let startDate = data.startDate ? this.formatDate(data.startDate) : null;
          let endDate = data.endDate ? this.formatDate(data.endDate) : null;
          if (!startDate || !endDate || data?.id === null) return [];
          const uniqueDates = new Set(startDate);
          const weekendDates = new Set();
          let start = new Date(startDate);
          let end = new Date(endDate);
          let eventList = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            let dateKey = d.toISOString().split("T")[0];
            let isWeekend = d.getDay() === 6 || d.getDay() === 0;
            if (uniqueDates.has(dateKey)) continue;
            if (isWeekend) {
              if (weekendDates.has(dateKey)) continue;
              weekendDates.add(dateKey);
            } else {
              uniqueDates.add(dateKey);
            }
            eventList.push({
              start: new Date(d),
              end: new Date(d),
              title: data.name,
              color: this.calendarModel.colors.default,
              cssClass: data.typeId === 'HT-WKL' ? 'ovi-event-royal-gray' : data?.statusId && data?.statusId === 'ORD-LEV' ? 'ovi-event-royal-orange' : data.statusId === 'ORD-WRK' ? 'ovi-event-royal-blue' : 'ovi-event-royal-red',
            });
          }
          return eventList;
        }).reduce((acc, val) => acc.concat(val), []);
        const uniqueEvents = eventsData.reverse().filter((event, index, self) =>
          index === self.findIndex(e => e.start.getTime() === event.start.getTime() && e.end.getTime() === event.end.getTime())).reverse();
        this.events = uniqueEvents;
        this.refreshView();
      }
    })
  }

  formatDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  getCurrentMonthWeekends(data, date) {
    const startDate = new Date(startOfMonth(date).setDate(startOfMonth(date).getDate() - 1));
    const endDate = new Date(endOfMonth(date).setDate(endOfMonth(date).getDate() - 1));
    const daysOfWeek = ['DAY1-SUN', 'DAY2-MON', 'DAY3-TUE', 'DAY4-WED', 'DAY5-THU', 'DAY6-FRI', 'DAY7-SAT'];
    let currentDate = startDate;
    let visibleDays: Date[] = [];
 
    while (currentDate <= endDate) {
      visibleDays.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    for(let i = 1; i <= visibleDays?.length; i++) {
      const allDates = new Date(startDate.setDate(startDate.getDate() + 1));
      const dayIndex = new Date(allDates).getDay();
      const index = daysOfWeek[dayIndex];
    for (const entry of data) {
      if (entry.holidayPatternId === index) {
            const formattedDate = format(allDates, 'dd-MM-yyyy');
            this.weekends.push({ ...entry, startDate: formattedDate, endDate: formattedDate });
        }
      }
    }
    return this.weekends;
  }

  getEventData(){
    if(this.data?.hasOwnProperty('fromDate') && this.data?.fromDate) {
      if (this.calDetail.view === CalendarView.Month) { 
        this.currentDate = this.datePipe.transform(this.data?.fromDate, 'MMMM, y' )
      } else {
        this.currentDate = this.datePipe.transform(this.data?.fromDate, 'MMMM d, y' )
      }
      this.calDetail.selectedDate = new Date(this.data?.fromDate);
      this.entitySelectedDate = this.datepipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
    }
    const entityType = this.data?.resourseType
    let entityData: any = {};
    const hasEntity = this.data?.entityId || entityType;
    let todate: any;
    let formdate : any;
    if (!this.data) {
      if (this.view === 'Month') {
        todate = this.getMonthDateChange(this.currentDate);
        formdate = this.datePipe.transform(this.entitySelectedDate, 'yyyy-MM-dd')
      } else if (this.view === 'Day') {
        todate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')
        formdate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')
      } else {
        todate = this.datePipe.transform(this.entityEndDate, 'yyyy-MM-dd');
        formdate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd');
      }
    }
   
    entityData = {
       entities: hasEntity ? [{ entityType: entityType, entityIds: [this.data.entityId]}] : null,
      "fromDate": this.data?.fromDate ?  this.datepipe.transform(this.data?.fromDate, 'yyyy-MM-dd') : formdate,
      "identifyingType": null,
      "toDate":  this.data?.toDate ? this.datepipe.transform(this.data?.toDate, 'yyyy-MM-dd') : todate,
    }
    if(this.data?.resourseType === 'RT-US') {
      entityData['entities'][0]['roleCodes'] = [this.data?.roleCode]
    }
    this.configurationService.checkEntityBooking(entityData).toPromise().then((res) => {
      if(this.data) {
        this.entityData['booking'] = res.results?.length !== 0 ? res.results : [{}];
        this.entityData['booking'][0]['entityType'] = entityType;
        this.entityData['booking'][0]['entityId'] = this.data?.entityId;
        this.entityData['booking'][0]['entityIcon'] = this.data?.entityIcon;
        this.entityData['booking'][0]['entityCategory'] = this.data?.resourseCategory?.charAt(0).toUpperCase() + this.data?.resourseCategory?.substr(1).toLowerCase();
        this.entityData['booking'][0]['entityName'] = this.data?.entityName;
        this.tableDetails = this.entityData['booking'].map((item) => ({
          name: item.entityName,
          frequency: null,
          birthDate: null,
          date : null,
          assign : null,
          calId: item.identifyingId,
          startTime: item.startDatetime,
          endTime: item.endDateTime,
          gender: null,
          id : item.entityId,
          entityType: item.entityType,
          entityIcon: this.data?.entityIcon
        }))
        this.events = this.entityData['booking'].map((data) => {
          if(data?.id !== null) {
           const startDate = new Date(data.startDatetime);
           const endDate = new Date(startDate.getTime() + 3 *60 *60 * 1000);
           let dataColors = this.calendarConfi.dynamicColosData ? this.calendarConfi.dynamicColosData.scheduleEvent :  {primary: '#cfcfcf', secondary: '#ededed'};
           const startTime = this.datepipe.transform(data?.startDatetime, 'HH:mm');
           const endTime = this.datepipe.transform(data?.endDatetime, 'HH:mm');
           const surgeryIcon = `<img class="calen-title-9" alt="icon" src="../../../../../assets/Menus/surgery.svg">`;
           const timeIcon = `<img class="calen-title-8" alt="Emergency" src="../../../../../assets/icons/icon-time.svg"/>`;
           const procedureData = data.entityValues?.find(x => x.entityType === 'ot_procedure');
           const patientName = data.entityValues?.find(x => x.entityType === 'Patient');
            let totalMins = null;
            let delayText = null;
            let startDelay = null;
            let endDelay = null;
            const getMinutesDiff = (actual: any, delay: any): number => {
              if (!actual || !delay) return 0;
              const date1 = new Date(this.datePipe.transform(actual, 'yyyy-MM-dd HH:mm:ss')!);
              const date2 = new Date(this.datePipe.transform(delay, 'yyyy-MM-dd HH:mm:ss')!);
              return Math.abs(Math.round((date1.getTime() - date2.getTime()) / 60000));
            };
            const hasStart = data.delayScheduleStartTime != null;
            const hasEnd = data.delayScheduleEndTime != null;
            if (hasStart || hasEnd) {
              startDelay = hasStart ? getMinutesDiff(data.startDatetime, data.delayScheduleStartTime) : 0;
              endDelay = hasEnd ? getMinutesDiff(data.endDatetime, data.delayScheduleEndTime) : 0;
              totalMins = startDelay + endDelay;
              delayText = startDelay && endDelay ? `Document Start & End delays (${totalMins}m)` :
                    startDelay ? `Document Start delays (${totalMins}m)` :
                    endDelay ? `Document End delays (${totalMins}m)` : '';
            } 
            let delaystartDuration = '';
            let delayEndDuration = '';
            let eventClassName = '';
            let eventPatientHeader ='';
            let eventpaitentFooter = '';
            if (totalMins != null) {
              const endDateTime = data.delayScheduleEndTime == null ? data.endDatetime : data.delayScheduleEndTime != null ?  data.delayScheduleEndTime : endDate;
              let eventStartTime = null;
              let eventEndTime = null;
              let eventTolmins = null;
              let finalValue = null;
              const eventTotalTime = getMinutesDiff(data.startDatetime, endDateTime);
              if (startDelay && !endDelay) {
                eventStartTime = eventTotalTime - startDelay;
              }
              if (endDelay && !startDelay) {
                eventEndTime = eventTotalTime - endDelay;
              }
              if (startDelay && endDelay) {
                eventTolmins = (eventTotalTime) - (totalMins);
                finalValue = Math.floor(totalMins / 2);
              }
              const eventTime = eventStartTime && !eventEndTime ? eventStartTime : !eventStartTime && eventEndTime ? eventEndTime : eventTolmins ? eventTolmins : 100;
              eventClassName = `calen-title-10-${eventTime}`;
              const eventStyleId = `dynamic-event-style-${eventTime}`;
              if (!document.getElementById(eventStyleId)) {
                const style = document.createElement('style');
                style.id = eventStyleId;
                style.innerHTML = `.${eventClassName} { height: ${eventTime}px !important; }`;
                document.head.appendChild(style);
              }
              const heightInPx = startDelay && !endDelay ? startDelay  : !startDelay && endDelay ? endDelay : startDelay && endDelay ? finalValue : null  ;

              if (heightInPx != null) {
                const className = `custom-height-${heightInPx}`;
                const styleId = `dynamic-height-style-${heightInPx}`;
                if (!document.getElementById(styleId)) {
                  const style = document.createElement('style');
                  style.id = styleId;
                  style.innerHTML = `.${className} { height: ${heightInPx}px !important; }`;
                  document.head.appendChild(style);
                }
                delaystartDuration = startDelay ? `<div class="ovi-font-family calen-title-15 ${className}">
                <div class="calen-title-17">
                <div class="calen-entity-icon">
                  <div>${surgeryIcon} </div>
                  <div>
                    <div class="calen-title-2">
                      <span>${procedureData?.entityName}</span>
                    </div>
                    <div class="calen-title-sub">
                      <span>${patientName?.entityName} (${patientName?.entityId})</span>
                    </div>
                  </div>
                </div>
              </div></div>` : '';
                delayEndDuration = endDelay ? `<div class="ovi-font-family calen-title-16 ${className}">
                 <div class="calen-title-footer1">
                <div class="calen-time-icon">${timeIcon}</div>
                 <span class="calen-footer-time">${startTime} to ${endTime}</span>
              </div>
                </div>` : '';
              }
              if (!delayEndDuration && startDelay) {
                eventpaitentFooter = `<div class="ovi-font-family calen-title-footer">
                <div class="calen-time-icon">${timeIcon}</div>
                 <span calss="calen-footer-time">${startTime} to ${endTime}</span>
              </div>`;
              }

              if (!delaystartDuration && endDelay) {
                eventPatientHeader = `<div class="ovi-font-family calen-title-12">
              <div class="calen-entity-icon">
                  <div>${surgeryIcon} </div>
              <div>
                <div class="calen-title-2">
                  <span>${procedureData?.entityName}</span>
                </div>
                  <div class="calen-title-sub">
                    <span>${patientName?.entityName} (${patientName?.entityId})</span>
                  </div>
                </div>
              </div>
              </div>`;
              }
            } else {
              eventClassName = `calen-title-10-`;
              const eventStyleId = `dynamic-event-style-100%`;
              if (!document.getElementById(eventStyleId)) {
                const style = document.createElement('style');
                style.id = eventStyleId;
                style.innerHTML = `.${eventClassName} { height: 100% !important; }`;
                document.head.appendChild(style);
              }
              eventPatientHeader = `<div class="ovi-font-family calen-title-12">
              <div class="calen-entity-icon">
                  <div>${surgeryIcon} </div>
              <div>
                <div class="calen-title-2">
                  <span>${procedureData?.entityName}</span>
                </div>
                  <div class="calen-title-sub">
                    <span>${patientName?.entityName} (${patientName?.entityId})</span>
                  </div>
                </div>
              </div>
              </div>`;
              eventpaitentFooter = ` <div class="ovi-font-family calen-title-footer">
                <div class="calen-time-icon">${timeIcon}</div>
                 <span>${startTime} to ${endTime}</span>
              </div>`;
            }
            let title = `<div>${delaystartDuration}</div> 
           <div class="calen-title-10 ${eventClassName}"> 
           <div class="calen-title-11"></div>
           <div class="calen-title-top"> ${eventPatientHeader} ${eventpaitentFooter}
             </div>
            </div>
            <div>${delayEndDuration}</div>`;
            return {
              start:  new Date(data.startDatetime),
              end: data.delayScheduleEndTime == null ? new Date(data.endDatetime) : data.delayScheduleEndTime != null ?  new Date(data.delayScheduleEndTime) : endDate,
              title: title,
              name: data.entityName,
              status: data.status,
              color: dataColors,
              actions: '',
              draggable: false,
              patientName: patientName?.entityName,
              patientId: patientName?.entityId,
              surgeryName: procedureData?.entityName,
              delayScheduleEndTime: data.delayScheduleEndTime,
              delayScheduleStartTime: data.delayScheduleStartTime,
              totalMins: totalMins,
            }
          }
        });
        this.refreshView()
      } else {
        this.entityData['booking'] = res.results;
        this.tableDetails = this.entityData['booking'].map((item) => ({
          name: item.entityName,
          frequency: null,
          birthDate: null,
          date : null,
          assign : null,
          calId: item.identifyingId,
          startTime: item.startDatetime,
          endTime: null,
          gender: null,
          id : item.id,
          entityType: item.entityType
        }))
        this.events = this.entityData['booking'].map((data) => {
          if(data?.id !== null) {
           const startDate = new Date(data.startDatetime);
           const endDate = new Date(startDate.getTime() + 3 *60 *60 * 1000);
            return {
              start: new Date(data.startDatetime),
              end: data.endDatetime ? new Date(data.endDatetime) : endDate,
              title: data? data.entityName : null,
              name: data.entityName,
              status: data.status,
              color: this.calendarModel.getcolors('default'),
              actions: this.actions,
              draggable: true
            };
          }
        });
        this.refreshView()
      }
      this.cdr.detectChanges(); 
      this.scrollToCurrentView(this.entityData['booking'][0]?.startDatetime);
    });
  }

  getEntityException() {
    const type = this.data?.resourseType === 'RT-US' ? 'user' : this.data?.resourseType?.toLowerCase();
    this.workflowService.getEntityScheduleExceptions(type, this.data?.entityId).subscribe((res) =>{
      if(res.statusCode == 1){
        this.weekends = [];
        const schedule = res.results;
        schedule[0].exceptions.map((data) => {
          let start = new Date(schedule[0].startTime);
          let end = new Date(schedule[0].toTime);
          const startDate = new Date(startOfMonth(start).setDate(startOfMonth(start).getDate() - 1));
          const endDate = new Date(endOfMonth(end).setDate(endOfMonth(end).getDate() - 1));
          const daysOfWeek = ['DAY1-SUN', 'DAY2-MON', 'DAY3-TUE', 'DAY4-WED', 'DAY5-THU', 'DAY6-FRI', 'DAY7-SAT'];
          let currentDate = startDate;
          let visibleDays: Date[] = [];

          while (currentDate <= endDate) {
            visibleDays.push(currentDate);
            currentDate = addDays(currentDate, 1);
          }
          for(let i = 1; i <= visibleDays?.length; i++) {
            const allDates = new Date(startDate.setDate(startDate.getDate() + 1));
            const dayIndex = new Date(allDates).getDay();
            const index = daysOfWeek[dayIndex];
            if (data.holidayPatternId === index) {
                const startFormattedDate = this.datePipe.transform(allDates, 'YYYY-MM-dd 00:00:00');
                const endFormattedDate = this.datePipe.transform(allDates, 'YYYY-MM-dd 23:59:00');
                this.weekends.push({ ...data, startDate: startFormattedDate, endDate: endFormattedDate, title: 'Week Off' });
            }
          }
          if(data.overrideStatusId === 'ORD-LEV' && data.holidayPatternId === 'HPT-DAY') {
            const startFormattedDate = this.datePipe.transform(data?.startTime, 'YYYY-MM-dd 00:00:00');
            let endFormattedDate = this.datePipe.transform(data?.startTime, 'YYYY-MM-dd 23:59:00');
            if(data.toTime !== null) {
              endFormattedDate = this.datePipe.transform(data?.toTime, 'YYYY-MM-dd 23:59:00');
            }
            this.weekends.push({ ...data, startDate: startFormattedDate, endDate: endFormattedDate, title: 'Leave' });
          } else if(data.overrideStatusId === 'ORD-LEV' && data.holidayPatternId === 'HPT-DRG') {
            const startTime = new Date(data?.startTime);
            const toTime = new Date(data?.toTime);
            let currentDate = startTime;
            let visibleDays: Date[] = [];
            while (currentDate <= toTime) {
              visibleDays.push(currentDate);
              currentDate = addDays(currentDate, 1);
            }
            for(let i = 1; i < visibleDays?.length; i++) {
              const allDates = new Date(startTime.setDate(startTime.getDate() + 1));
              const startFormattedDate = this.datePipe.transform(allDates, 'YYYY-MM-dd 00:00:00');
              const endFormattedDate = this.datePipe.transform(allDates, 'YYYY-MM-dd 23:59:00');
              const duplicate = this.weekends.filter(x => x.startDate === startFormattedDate);
              if(duplicate?.length === 0) {
                this.weekends.push({ ...data, startDate: startFormattedDate, endDate: endFormattedDate, title: 'Leave' });
              }
            }
            const startFormattedDate = this.datePipe.transform(data?.startTime, 'YYYY-MM-dd 00:00:00');
            const endFormattedDate = this.datePipe.transform(data?.startTime, 'YYYY-MM-dd 23:59:00');
            const duplicate = this.weekends.filter(x => x.startDate === startFormattedDate);
            if(duplicate?.length === 0) {
              this.weekends.push({ ...data, startDate: startFormattedDate, endDate: endFormattedDate, title: 'Leave' });
            }
          }
        });
        let dataColors = { primary: 'white', secondary: '#e1e1e1'};
         this.eventsExp = this.weekends.map((data) => {
          let title = `<div class="calen-title-top">
              <div class="calen-title-1">
                <div class="calen-entity-icon">
                  <div>${data.title}</div>
                </div>
              </div>
            </div>`
            return {
              start: new Date(data.startDate),
              end: new Date(data.endDate),
              title: title,
              color: dataColors,
              cssClass: this.calDetail.view === 'month' ? 'ovi-event-royal-gray-event' : 'ovi-event-royal-gray'
            };
        });
        this.refreshView();
      }
    });
  }

  getOperationData(){
    this.commonService.getHcPatientList(this.calendarInput.fromDate, 'HP-OT').subscribe((res) => {
        const patientData = res.results;
        this.entityData['CAL-OT'] = patientData.data.filter((res) => res.eventLocationName );
        this.tableDetails = patientData.data.map((item) => ({
          name: item.name,
          birthDate: item.birthDate,
          calId: item.uhid,
          startTime: item.visitEventFrmTime,
          gender: item.gender,
          id : item.patientId
        }))
        this.events = this.entityData['CAL-OT'].map((data) => {
          if(data?.patientId !== null) {
            const startDate = new Date(data.visitEventFrmTime); 
            const endDate = startDate.getTime() + 2 * 60 * 60 * 1000;
            return {
              start: startDate,
              end: endDate,
              title: data.eventLocationName ? data.eventLocationName : null,
              color: this.calendarModel.colors.red,
              actions: this.actions,
              draggable: true,
            };
          }
        });
        this.refreshView();
    });
  }

  getDynamicColor() {
    this.commonService.getConfigFile('calendar-color-config').subscribe(res => {
      if (res.statusCode === 1) {
        this.calendarConfi.dynamicColosData = res.results.contentObject;
      }
    });
    this.commonService.getConfigFile('calendar-config').subscribe(res => {
      if (res.statusCode === 1) {
        this.calendarConfi.dynamicConfigData = res.results.contentObject;
        this.calDetail.dayEndHour = this.calendarConfi.dynamicConfigData.dayEndHour;
        this.calDetail.dayStartHour = this.calendarConfi.dynamicConfigData.dayStartHour;
        this.calDetail.hourSegments = this.calendarConfi.dynamicConfigData.hourSegments;
      }
    })
  }

  getTimeLineData() {
    this.calendarBoolen.loading = true;
    const type = 'Location';
    const formDate = this.datepipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
    this.commonService.getEntityTimeline(formDate, type, this.calendarInput?.location).subscribe(res => {
      this.calendarBoolen.loading = false;
      this.entityTooleTipData = res.results;
      if (res.results.length !== 0) {
        const timeLinefilterData = res.results.filter(x => x.visitStatusId !== "VS-CL");
        this.entityTooleTipData = timeLinefilterData;
        this.usersDetails = Array.from(new Set(timeLinefilterData.map(p => p.locationName)));
        this.events = timeLinefilterData.map((data, index) => {
          let startDate = {}
          let endDate = {}
          let totalMins = null;
          let startDelay = null;
          let endDelay = null;
          let eventStartTime = null;
          let eventEndTime = null;
          let eventTolmins = null;
          let eventClassName = '';
          let delaystartDuration = '';
          let delayEndDuration = '';
          let eventsText = '';
          if (data?.healthPlanId !== null) {
            startDate = new Date(data.fromTime);
            endDate = new Date(data.toTime);
            if (data.patientQueueStatusId === 'QS-IP') {
              endDate = new Date();
            } else if (data.patientQueueStatusId === 'QS-PE') {
              if (data.visitStatusId == 'VS-SH') {
                startDate = data.delayScheduleStartTime != null ? new Date(data.delayScheduleStartTime) : new Date(data.scheduleStartTime);
                endDate = data.delayScheduleEndTime != null ? new Date(data.delayScheduleEndTime) : new Date(data.scheduleEndTime);
              }
            }
            let dataColors = {};
            if (data?.patientQueueStatusId === 'QS-CO') {
              dataColors = this.calendarConfi.dynamicColosData ? this.calendarConfi.dynamicColosData.completed : { primary: '	#84d9a5', secondary: ' #baffc9' };
            } else if (data?.patientQueueStatusId === 'QS-IP') {
              dataColors = this.calendarConfi.dynamicColosData ? this.calendarConfi.dynamicColosData.inprogress : { primary: '#89c4f4', secondary: '#bae1ff' };
            } else if (data?.patientQueueStatusId === 'QS-PE') {
              if (data.visitStatusId == 'VS-SH') {
                dataColors = this.calendarConfi.dynamicColosData ? this.calendarConfi.dynamicColosData.schedule : { primary: '#cfcfcf', secondary: '#ededed' };
              }
            } else {
              dataColors = this.calendarModel.colors.red;
            }
            const emergencyIcon = data.surgeryTypeId === 'SGT-EM' ? `<img class="calen-title-5" alt="Emergency" src="../../../../../assets/icons/emergency.png"/>` : '';
            const waringYellowIcon = data.threadId !== null ? `<i class="material-icons calen-title-7">warning</i>` : '';
            const waringRedIcon = data.isVulnerable === true ? `<i class="material-icons calen-title-6">warning</i>` : '';
            const maskedPatientName = this.maskData.transform(data.patientName, data.vipTypeId === null || data.vipTypeId === 'General');
            let dynamicClass = data.patientQueueStatusId === 'QS-CO' ? 'calen-title-14' : 'calen-title-21';
            let delaydesClass = data.patientQueueStatusId === 'QS-CO' ? 'calen-title-18' : 'calen-title-20';
            let eventContent = `<div class="calen-title-1">
                                  <div class="calen-title-2">
                                     <span >${maskedPatientName}</span>
                                        <span class="calen-title-3">(${data.mainIdentifier ? data.mainIdentifier : ''})</span>
                                        <span>${data.patientGender ? '|' + data.patientGender : ''}</span>
                                     <span> ${data.patientAge ? '|' + data.patientAge + 'Yrs' : ''}</span>
                                  </div>
                                <div class="calen-title-2">
                                     <span>${data.otProcedureNames} ${emergencyIcon} ${waringYellowIcon} ${waringRedIcon}</span>
                                      <span>| ${data.doctorName}</span></div>
                                </div>
                                </div>`;
            if (data.delayScheduleStartTime != null || data.delayScheduleEndTime != null) {
              const getMinutesDiff = (actual: any, delay: any): number => {
                if (!actual || !delay) return 0;
                const date1 = new Date(this.datePipe.transform(actual, 'yyyy-MM-dd HH:mm:ss')!);
                const date2 = new Date(this.datePipe.transform(delay, 'yyyy-MM-dd HH:mm:ss')!);
                return Math.abs(Math.round((date1.getTime() - date2.getTime()) / 60000));
              };
              const hasStart = data.delayScheduleStartTime != null;
              const hasEnd = data.delayScheduleEndTime != null;
              if (hasStart || hasEnd) {
                startDelay = hasStart ? getMinutesDiff(data.scheduleStartTime, data.delayScheduleStartTime) : 0;
                endDelay = hasEnd ? getMinutesDiff(data.scheduleEndTime, data.delayScheduleEndTime) : 0;
                totalMins = startDelay + endDelay;
              }
              let finalValue = null;
              if (totalMins != null) {
                const eventTotalTime = getMinutesDiff(startDate, endDate);
                const actualEventTime = eventTotalTime > 50 ? eventTotalTime : 50;
                if (startDelay && !endDelay) {
                  eventStartTime = actualEventTime - startDelay;
                }
                if (endDelay && !startDelay) {
                  eventEndTime = actualEventTime - endDelay;
                }
                if (startDelay && endDelay) {
                  eventTolmins = (actualEventTime) - (totalMins);
                  finalValue = Math.floor(totalMins / 2);
                }
                const eventTime = eventStartTime && !eventEndTime ? eventStartTime : !eventStartTime && eventEndTime ? eventEndTime : eventTolmins ? eventTolmins : 100;
                eventClassName = `${dynamicClass}-${eventTime}`;
                const eventStyleId = `dynamic-event-style-${eventTime}`;
                if (!document.getElementById(eventStyleId)) {
                  const style = document.createElement('style');
                  style.id = eventStyleId;
                  style.innerHTML = `.${eventClassName} { height: ${eventTime}px !important; }`;
                  document.head.appendChild(style);
                }
                const heightInPx = startDelay && !endDelay ? startDelay : !startDelay && endDelay ? endDelay : startDelay && endDelay ? finalValue : null;
                if (heightInPx != null) {
                  const className = `custom-height-${heightInPx}`;
                  const styleId = `dynamic-height-style-${heightInPx}`;
                  if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.innerHTML = `.${className} { height: ${heightInPx}px !important; }`;
                    document.head.appendChild(style);
                  }
                  delaystartDuration = startDelay ? `<div class="ovi-font-family ${delaydesClass} ${className}">
                                                      <div class="calen-title-19">
                                                        <div class="calen-title-2">
                                                          <span >${maskedPatientName}</span>
                                                            <span class="calen-title-3">(${data.mainIdentifier ? data.mainIdentifier : ''})</span>
                                                              <span>${data.patientGender ? '|' + data.patientGender : ''}</span>
                                                            <span> ${data.patientAge ? '|' + data.patientAge + 'Yrs' : ''}</span>
                                                         </div>
                                                              <div class="calen-title-2">
                                                                   <span>${data.otProcedureNames} ${emergencyIcon} ${waringYellowIcon} ${waringRedIcon}</span>
                                                                   <span>| ${data.doctorName}</span>
                                                              </div>
                                                           </div>
                                                        </div> 
                                                    </div>` : '';
                  delayEndDuration = endDelay ? `<div class="ovi-font-family ${delaydesClass} ${className}"></div>` : '';
                }
              }
              let eventPatientHeader = eventEndTime > 50 ? 'calen-title-1' : 'calen-title-22';
              eventsText = endDelay && !startDelay ? `<div class="${eventPatientHeader}">
                                                        <div class="calen-title-2">
                                                          <span>${maskedPatientName}</span>
                                                            <span class="calen-title-3">(${data.mainIdentifier ? data.mainIdentifier : ''})</span>
                                                              <span>${data.patientGender ? '|' + data.patientGender : ''}</span>
                                                            <span>${data.patientAge ? '|' + data.patientAge + 'Yrs' : ''}</span>
                                                        </div>
                                                        <div class="calen-title-2">
                                                          <span>${data.otProcedureNames} ${emergencyIcon} ${waringYellowIcon} ${waringRedIcon}</span>
                                                            <span>| ${data.doctorName}</span>
                                                        </div>
                                                      </div>` : '';
            } else {
              const getMinutesDiff = (actual: any, delay: any): number => {
                if (!actual || !delay) return 0;
                const date1 = new Date(this.datePipe.transform(actual, 'yyyy-MM-dd HH:mm:ss')!);
                const date2 = new Date(this.datePipe.transform(delay, 'yyyy-MM-dd HH:mm:ss')!);
                return Math.abs(Math.round((date1.getTime() - date2.getTime()) / 60000));
              };
              const eventTotalTime = getMinutesDiff(startDate, endDate);
              const actualEventTime = eventTotalTime > 50 ? eventTotalTime : 50;
              eventClassName = `${dynamicClass}-${actualEventTime}`;
              const eventStyleId = `dynamic-event-style-${actualEventTime}`;
              if (!document.getElementById(eventStyleId)) {
                const style = document.createElement('style');
                style.id = eventStyleId;
                style.innerHTML = `.${eventClassName} { height: ${actualEventTime}px !important; }`;
                document.head.appendChild(style);
              }
              eventsText = delaystartDuration != null ? `${eventContent}` : '';
            }
            let title = `<div>${delaystartDuration}<div>
                            <div class="calen-title-13"> 
                              <div class="${eventClassName} ${dynamicClass}"></div>
                               ${eventsText}
                             </div>
                          <div>${delayEndDuration}</div>`;
            return {
              start: startDate,
              end: endDate,
              title: title,
              color: dataColors,
              duration: data.duration,
              actions: '',
              meta: {
                user: this.usersDetails[index % this.usersDetails.length],
              },
              draggable: false,
              doctorName: data.doctorName,
              otProcedureNames: data.otProcedureNames,
              patientName: data.patientName,
              gender: data.patientGender,
              locationName: data.locationName,
              patientAge: data.patientAge,
              patientQueueStatusName: data.patientQueueStatusName,
              surgeryTypeName: data.surgeryTypeName,
              mainIdentifier: data.mainIdentifier,
              scheduleStartTime: data.scheduleStartTime,
              patientId: data.patientId,
              vipTypeId: data.vipTypeId,
              patientQueueStatusId: data.patientQueueStatusId,
              threadId: data.threadId,
              isVulnerable: data.isVulnerable,
              surgeryTypeId: data.surgeryTypeId,
              delayScheduleEndTime: data.delayScheduleEndTime,
              delayScheduleStartTime: data.delayScheduleStartTime,
              totalMins: totalMins,
            }
          }
        });
      } else {
        this.events = [];
        this.usersDetails = [];
      }
      this.cdr.detectChanges();
      this.scrollToCurrentView(this.entityTooleTipData[0]?.scheduleStartTime);
    });
  }

  getUtilizationData() {    // NOT USED
    this.tableDetails = [];
    if (this.entityTooleTipData){
      this.tableDetails = this.entityTooleTipData.map((item) => ({
        name: item.patientName,
        birthDate: item.birthDate,
        calId: item.locationId,
        startTime: item.fromTime,
        endTime: item.toTime,
        gender: item.patientGender,
        id: item.locationId,
        duration: item.duration,
        patientAge: item.patientAge
      }))
    }
  }

  getEventsForUser(user: string): any[] {
    return this.events.filter(event => event.locationName === user);
  }

  calculateAge(dob){ // NOT USED
    let year = new Date(dob).getFullYear();
    return new Date().getFullYear() - year;
  }
  
  viewDetails(selectedData) { // NOT USED
    this.events = [];
    if (this.calendarInput.entityType === 'CAL-OT') {
      const patientInfo = this.entityData['CAL-OT'].find((x) => x.patientId === selectedData.id);
      const startDate = patientInfo.visitEventFrmTime ? new Date(patientInfo.visitEventFrmTime) : null;
      const endDate = patientInfo.visitEventFrmTime ? startDate.getTime() + 3 * 60 * 60 * 1000 : null;
      const patientsDetails = {
        start: startDate,
        end: endDate,
        title: patientInfo.otProcedureNames,
        color: this.calendarModel.getcolors('green'),
        actions: this.actions,
        draggable: true,
        id: patientInfo.patientId
      };
      const patientEvnts = this.eventsInfo.findIndex((x) => x.id === selectedData.id);
      if (patientEvnts !== -1) {
        this.eventsInfo.splice(patientEvnts, 1);
      } else {
        this.eventsInfo.push(patientsDetails);
      }
      this.events = [...this.eventsInfo];
    } else if (this.calendarInput.entityType === 'CAL-AMC') {
      const maintenanceInfo = this.entityData['CAL-AMC'].find((x) => x.id === selectedData.id);
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
      localStorage.setItem('startDate', startDate.toISOString());
      localStorage.setItem('endDate', endDate.toISOString());
      const maintenanceDetails = {
        start: new Date(localStorage.getItem('startDate')),
        end: new Date(localStorage.getItem('endDate')),
        title: maintenanceInfo.statusName,
        color: this.calendarModel.getcolors('green'),
        actions: this.actions,
        draggable: true,
        id: maintenanceInfo.id
      }
      const maintenanceEvents = this.eventsInfo.findIndex((x) => x.id === selectedData.id);
      if (maintenanceEvents !== -1) {
        this.eventsInfo.splice(maintenanceEvents, 1);
      } else {
        this.eventsInfo.push(maintenanceDetails);
      }
      this.events = [...this.eventsInfo];
    } else {
      const entityInfo = this.entityData['booking'].find((x) => x.id === selectedData.id);
      const eventDetails = {
        start: new Date(entityInfo.startDatetime),
        end: new Date(entityInfo.endDatetime),
        title: entityInfo.comments,
        color: this.calendarModel.getcolors('green'),
        actions: this.actions,
        draggable: true,
        id: entityInfo.id,
      };
      const existingEventIndex = this.eventsInfo.findIndex((x) => x.id === selectedData.id);
      if (existingEventIndex !== -1) {
        this.eventsInfo.splice(existingEventIndex, 1);
      } else {
        this.eventsInfo.push(eventDetails);
      }
      this.events = [...this.eventsInfo];
    }
  }

  isEventActive(calId: any) { // NOT USED
    const index = this.isEventSelectedId.indexOf(calId);
    if (index == -1) {
      this.isEventSelectedId.push(calId);
    } else {
      this.isEventSelectedId.splice(index, 1)
    }
  }

  expandSide() {
    this.calendarBoolen.resourceExpand = !this.calendarBoolen.resourceExpand;
    this.calendarBoolen.resourceExpandRight = false;
  }

  closeDrawer() {
    this.calendarBoolen.resourceExpandRight = false;
  }


  scrollToCurrentView(fromDate?: any) {
    if (this.calDetail.view === CalendarView.Week || this.calDetail.view === CalendarView.Day) {
      setTimeout(() => {
        const targetTime = fromDate != undefined && fromDate != null ? new Date(fromDate) : new Date();
        const minutesSinceStartOfDay = targetTime.getHours() * 60 + targetTime.getMinutes();
        const headerHeight = this.calDetail.view === CalendarView.Week ? 60 : 0;
        const scrollPos = minutesSinceStartOfDay + headerHeight;
        if (this.scrollContainer?.nativeElement) {
          const height = this.scrollContainer.nativeElement.clientHeight;
          const scrollPos1 = scrollPos - height + 196;
          this.scrollContainer.nativeElement.scrollTop = scrollPos1;
        } else if (this.scrollContainerOt?.nativeElement) {
          const height = this.scrollContainerOt.nativeElement.clientHeight;
          const scrollPos2 = scrollPos - height + 196;
          this.scrollContainerOt.nativeElement.scrollTop = scrollPos2;
        }
      }, 500)
      this.cdr.detectChanges();
    }
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.calDetail.selectedDate = date;
    this.calDetail.view = CalendarView.Day;
    if (isSameMonth(date, this.calDetail.selectedDate)) {
      if (
        (isSameDay(this.calDetail.selectedDate, date) && this.calendarBoolen.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.calendarBoolen.activeDayIsOpen = false;
      } else {
        this.calendarBoolen.activeDayIsOpen = true;
      }
      this.calDetail.selectedDate = date;
    }
  }

  eventTimesChanged({event, newStart, newEnd, }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return { ...event, start: newStart, end: newEnd, };
      }
      return iEvent;
    });
    this.manageAction('Dropped or resized', event);
  }

  onEventClicked(eventWrapper: { event: any; sourceEvent?: any }) {
    const event = eventWrapper?.event;
    const targetEl = eventWrapper?.sourceEvent?.target as HTMLElement;
    if (targetEl.classList.contains("calen-title-2") || targetEl.classList.contains("calen-title-3")) {
      this.eventClickSubject.next(eventWrapper);
    } else {
      this.dialog.open(this.eventsDetails, {
        data: event,
        panelClass: 'custom-tooltip-dialog',
      });
    }
  }

  manageAction(action: string, event, sideNav?): void {
    if (action == 'edit') {
      if (event.patientQueueStatusId === 'QS-PE') {
        const selectedDate = this.datePipe.transform(event?.scheduleStartTime, 'yyyy-MM-dd')
        this.commonService.getHcPatientList(selectedDate, 'HP-OT').subscribe((res) => {
          if (res.statusCode === 1) {
            const selectedData = res.results.data.find(x => x.patientId === event?.patientId);
            const dialogRef = this.dialog.open(ManagePatientComponent, {
              data: {
                'id': selectedData?.visit_id, 'patientId': selectedData?.patientId, 'workflowTypeId': 'WF-OT', 'date': selectedDate,
                'isRefresh': true, 'visitType': 'VT-IP', 'visitEvent': 'VE-OT', 'mainidentifer': selectedData?.uhid, 'eventDetails': selectedData.eventDetails,
                'startTime': selectedData.scheduleStartTime, 'endTime': selectedData.scheduleEndTime, 'isActive': true, 'visitEventId': selectedData.visitEventId
              },
              panelClass: ['medium-popup'], disableClose: true
            });
            dialogRef.afterClosed().subscribe(result => {
              this.dialog.closeAll();
            });
          }
        });
      } else {
        let currentTime = this.datePipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
        this.commonService.getPatientTestStatusDetails(event.patientId).subscribe(res => {
          if (res.statusCode) {
            res.results['surgeryTypeId'] = res.results['surgeryTypeId'] ? res.results['surgeryTypeId'] : event['surgeryTypeId'];
            res.results['otProcedureNames'] = res.results['otProcedureNames'] ? res.results['otProcedureNames'] : event['otProcedureNames'];
            if (res.results.threats && res.results.threats.length > 0) {
              res.results.threatsTooltip = res.results.threats.map((threat) => threat.value).join(",");
            } else {
              res.results.threatsTooltip = null;
            }
            let patientDetails = [res.results];
            let data = { 'selectedPatient': res.results, 'patients': patientDetails, 'selectedDate': currentTime, 'sideNav': sideNav ? sideNav : false, 'visitTypeId': patientDetails[0].patientVisitEventId }
            const dialogRef = this.dialog.open(AppOtNewComponent, {
              panelClass: ['medium-popup'], disableClose: true, data: data
            });
            dialogRef.afterClosed().subscribe(result => {
            });
          }
        });
      }
    }
    this.buildForm(event);
  }

  segmentClicked(action, event: any) {
    let maintenanceData = {'startDatetime': event};
    if (action == 'clicked') { // To create new event
      this.refreshView()
    }
  }

  setView(view: CalendarView) {
      this.calDetail.view = view;
  }

  checkView(value) {
    let date = new Date(this.entitySelectedDate);
    this.view = value;
    if(value === '3Days') {
      this.calendarBoolen.threeDaysExist = true;
    } else {
      this.calendarBoolen.threeDaysExist = false;
    }
    this.getDateChange(date);
  }

  closeOpenMonthViewDay() {
    this.calendarBoolen.activeDayIsOpen = false;
    if (this.view === '3Days') {
      const date = new Date(this.calDetail.selectedDate);
      const currentDate = new Date(this.currentDate);
      if (date > currentDate) {
        this.calDetail.selectedDate.setDate(date.getDate() - 4);
      } else {
        this.calDetail.selectedDate.setDate(date.getDate() + 4);
      }
    }
    const dateInfo  = this.calDetail.selectedDate;
    this.currentDate = this.datePipe.transform(dateInfo, 'MMMM d, y')
    const id = 'TW-MON';
    if (this.data?.entityType != 'CAL-OT' && (this.calendarInput.hasOwnProperty('status') && this.calendarInput?.status != 'CAL-OT') && 
    (this.calendarInput?.entityType !== 'CAL-AMC' && this.calendarInput?.type !== 'Asset') && (this.calendarInput?.entityType !== 'CAL-US' && this.calendarInput?.type !== 'user') ) {
    this.getDataMonthView(dateInfo,id);
    this.getEventData();
    } else if (this.calendarInput?.entityType === 'CAL-AMC') { 
      this.getAssetMaintenance(dateInfo);
    } else if (this.calendarInput?.entityType === 'CAL-US') {
      this.selectedIndex = null;
      this.getUserSchedulesData(dateInfo)
    }
  }

  refreshView() {
    if (this.eventsExp?.length !== 0) {
      this.events = [...this.eventsExp, ...this.events];
    } else {
      this.events = [...this.events];
    }
    this.cdr.detectChanges();
  }

  reloading() {
    this.isEventSelectedId = [];
    if (this.calendarInput?.entityType === 'CAL-OT') {
      this.calendarBoolen.resourceExpand = true;
      this.getOperationData();
    } else if (this.calendarInput?.entityType === 'CAL-AMC') {
      this.getAssetMaintenance();
    } else if (this.calendarInput?.entityType === 'CAL-US') {
      this.getUserSchedulesData(null);
    } else {
      this.getEventData();
      this.getEntityException();
    }
  }

  eventDropped({ event, newStart, newEnd, allDay, }: CalendarEventTimesChangedEvent): void {
    const externalIndex = this.externalEvents.indexOf(event);
    if (typeof allDay !== 'undefined') {
      event.allDay = allDay;
    }
    if (externalIndex > -1) {
      this.externalEvents.splice(externalIndex, 1);
      this.events.push(event);
    }
    event.start = newStart;
    if (newEnd) {
      event.end = newEnd;
    }
    if (this.calDetail.view === 'month') {
      this.calDetail.selectedDate = newStart;
      this.calendarBoolen.activeDayIsOpen = true;
    }
    this.events = [...this.events];
  }

  externalDrop(event: CalendarEvent) {
    if (this.externalEvents.indexOf(event) === -1) {
      this.events = this.events.filter((iEvent) => iEvent !== event);
      this.externalEvents.push(event);
    }
  }

  ngOnDestroy() {
    this.eventClickSubscription.unsubscribe();
  }

  onDayClick(event){
    const selectedDate = event.day.date;
    this.emitCalendarData(selectedDate)
  } 

  private emitCalendarData(value?: any, date?: any) {
    this.calendarUpdatedData.emit({
      selectedData: value,
      selectedDate: date
    });
  }

  fixClick() {
    console.log('')
  }

  onChangeOpenpop(data?: any) {
    // return
    if (this.calendarInput.entityType != 'CAL-US') {
      const permission = JSON.parse(localStorage.getItem('permission'));
      const dropdown = permission?.dropdown || [];
      const allowPrintSticker = dropdown?.some(item => item.code === 'WD_AL_PS');
      if (allowPrintSticker) {
        const fromDate = this.datePipe.transform(data[0].start, 'yyyy-MM-dd');
        const dataCodeInfo = data.map(x => x.categoryId);
        const activityCategoryIds = dataCodeInfo;
        this.calendarInput.groupFilter['selectedDate'] = fromDate;
        this.calendarInput.groupFilter['activityCategoryIds'] = activityCategoryIds;
        const filterDataInfo = this.calendarInput.groupFilter;
        const printData = {
          groupFilterData: {
            isMyAsset: filterDataInfo?.isMyAsset,
            isMyDepartment: filterDataInfo.isMyDepartment,
            assetTypeIds: filterDataInfo.assetTypeIds,
            isOwnedDepartment: filterDataInfo.isOwnedDepartment,
            isAssignedDepartment: filterDataInfo.isAssignedDepartment,
            departmentId: filterDataInfo.departmentId,
            activityCategoryIds: filterDataInfo.activityCategoryIds,
            statusList: filterDataInfo.statusList,
            selectedDate: filterDataInfo.selectedDate,
            selectedToDate: filterDataInfo.selectedToDate ?? filterDataInfo.selectedDate,
            pageSize: null,
            pageStart: null
          },
          type: 'AssetMaintenance'
        };
        const dialogRef = this.dialog.open(PrintStickerComponent,
          { data: printData, panelClass: ['medium-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
        });
      }
    } else {
      let dataInfo = data[0]?.meta;
      dataInfo['type'] = 'user';
      dataInfo['selectedFromDate'] = this.datePipe.transform(data[0].start, 'yyyy-MM-dd');
      dataInfo['selectedToDate'] = this.datePipe.transform(data[0].end, 'yyyy-MM-dd');
      dataInfo['selectedIndexOpen'] = true;
      const dialogRef = this.dialog.open(CreateUserScheduleComponent, {
        data: dataInfo, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        const entityId = this.selectedIndex != null ? dataInfo?.entityId : null;
        this.getUserSchedulesData(null, entityId);
      });
    }
  }

  onMenuToggle(value) {
    // if (value?.length) {
    //   this.eventlistInfo = value;
    // } else {
    //   this.eventlistInfo = [];
    // }
    // console.log(value);
  }

  getEventAction(event) {
    if (event != null && event != undefined) {
      this.calDetail.view = CalendarView.Day;
      this.view = 'Day'
      this.calDetail.selectedDate = new Date(event?.start);
      this.currentDate = this.datePipe.transform(this.calDetail.selectedDate, 'yyyy-MM-dd');
      this.calendarBoolen.activeDayIsOpen = true;
      const dayEvents = this.events?.filter(x => x.requestId === event?.requestId);
      this.events = [...dayEvents];
      this.cdr.detectChanges();
      this.scrollToCurrentView(dayEvents[0]?.start);
    }
  }

  eventAction(event) {

    if (!event?.date) return;

    const clickedDate = new Date(event.date);
    const today = new Date();
    clickedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (clickedDate > today) {

      const dataInfo: any = {
        selectedFromDate: this.datePipe.transform(clickedDate, 'yyyy-MM-dd'),
        selectedType: 'date',
        selectedEntityId: this.entityData['CAL_US'][0]?.entityId,
        selectedEntityName: this.entityData['CAL_US'][0]?.entityName,
      };

      const dialogRef = this.dialog.open(CreateUserScheduleComponent, {
        data: dataInfo, panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(() => {
        const entityId = this.selectedIndex != null ? dataInfo?.selectedEntityId : null;
        this.getUserSchedulesData(null, entityId);
      });

    } else {
      this.toastr.warning('You cannot schedule for past dates.','Invalid Date');
    }
  }

   getVisibleMonthRange(viewDate: Date) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const calendarStart = new Date(firstDayOfMonth);
    const dayOfWeekStart = calendarStart.getDay();
    const diffToMonday = (dayOfWeekStart + 6) % 7;
    calendarStart.setDate(firstDayOfMonth.getDate() - diffToMonday);
    const calendarEnd = new Date(lastDayOfMonth);
    const dayOfWeekEnd = calendarEnd.getDay();
    const diffToSunday = (7 - dayOfWeekEnd) % 7;
    calendarEnd.setDate(lastDayOfMonth.getDate() + diffToSunday);

    return { start: calendarStart, end: calendarEnd };
  }

  getscheduleList(data, index) {
    this.selectedIndex = this.selectedIndex === index ? null : index;
    if (this.selectedIndex === null) {
      this.getUserSchedulesData();
    } else {
      this.getUserSchedulesData(null, data.entityId);
    }
  }

  applyFilter(event: any) {
    const searchValue = event.toLowerCase().trim();

    if (searchValue.length > 2) {
      this.scheduleList = this.entityData.CAL_US.filter(user =>
        user.entityName?.toLowerCase().includes(searchValue));
    } else {
      this.scheduleList = this.entityData.CAL_US;
    }
  }
}

// dragDrop event for exception //

// calEvents = {
//     dragToCreateActive: false,
//   }

// startDragToCreate(segment: WeekViewHourSegment, event: MouseEvent, segmentElement: HTMLElement): void {
//     event.preventDefault();
//     const segmentPosition = segmentElement.getBoundingClientRect();
//     const dragToSelectEvent: CalendarEvent = {
//       id: this.events.length + 1,
//       title: 'New event',
//       start: segment.date,
//       actions: this.actions,
//       resizable: {
//         beforeStart: true,
//         afterEnd: true,
//       },
//       draggable: true,
//       meta: {
//         tmpEvent: true,
//       },
//     };
  
//     this.events = [...this.events, dragToSelectEvent];
//     this.calEvents.dragToCreateActive = true;
  
//     const endOfView = endOfWeek(this.calDetail.selectedDate, {
//       weekStartsOn: this.weekStartsOn,
//     });  
//     fromEvent(document, 'mousemove')
//       .pipe(
//         takeUntil(fromEvent(document, 'mouseup')),
//         finalize(() => {
//           delete dragToSelectEvent.meta.tmpEvent;
//           this.calEvents.dragToCreateActive = false;
//           this.refreshView();
//         })
//       )
//       .subscribe((mouseMoveEvent: MouseEvent) => {
//         const minutesDiff = this.calendarService.ceilToNearest(
//           mouseMoveEvent.clientY - segmentPosition.top,
//           30
//         );
//         const daysDiff =
//           this.calendarService.floorToNearest(
//             mouseMoveEvent.clientX - segmentPosition.left,
//             segmentPosition.width
//           ) / segmentPosition.width;
//         const newEnd = addDays(
//           addMinutes(segment.date, minutesDiff),
//           daysDiff
//         );
  
//         if (newEnd > segment.date && newEnd < endOfView) {
//           dragToSelectEvent.end = newEnd;
//         }
//         this.refreshView();
//       });
//   }