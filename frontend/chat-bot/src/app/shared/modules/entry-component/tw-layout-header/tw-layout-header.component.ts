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
import { DatePipe } from '@angular/common';
import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../services/common.service';
import { WorkflowService } from '../../../services/workflow.service';
import { Router,  } from '@angular/router';
import { ConfigurationService, ReportService } from '../../../services';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MY_FORMATS } from '../../../../ovitag/configuration/asset/asset.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'tw-layout-header-component',
  templateUrl: './tw-layout-header.component.html',
  styleUrls: ['./tw-layout-header.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class TwLayoutHeaderComponent implements OnChanges, OnInit {
  public activate_btn: any = [];
  public enableAction = false;
  public reportForm: FormGroup;
  public staffSub: Subject<any> = new Subject();
  public userSearchSub: Subject<any[]> = new Subject();
  public today = new Date();
  public todayDateTime =  new Date().toISOString().slice(0, 16);
  public yesterdayDateTime :any;
  public yesterday: any;
  
  public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDateTime = this.datepipe.transform(this.today, 'yyyy-MM-dd 00:00');
  public toDateTime = this.datepipe.transform(this.today, 'yyyy-MM-dd 23:59');
  @Input() layout: any;
  @Input() filterInputs: any = [];
  @Input() reportList: any;
  @Input() enableExcel: any;
  @Input() enablePdf: any;
  @Input() enableRefresh: any;
  @Input() dashboardId: any;
  @Input() pdfConfigSelected: any;
  @Input() headerName;
  @Input() enableInsights : boolean;
  @Output() reportHeaderAction = new EventEmitter<any>();
  menuArray = [];
  selectedMenu = null;
  disabled = true;
  poolNameList: any = [];
  apptermsList: any = [];
  shiftList: any = [];
  deptList: any = [];
  userDeptList: any = [];
  studGradeList: any = [];
  studGroupList : any = [];
  PoolLocationList: any = [];
  scheduleList: any = [];
  locationlist: any = [];
  userList: any = [];
  userInfoList: any = [];
  params = null;
  paramJson = {}
  workflowTypeId = null;
  searchCosterlist: any = [];
  searchAssetList: any = [];
  assetCategory = null;
  searchPatientlist: any = [];
  searchInfantlist: any = [];
  uhidList: any = [];
  eventEmitted = false;
  type: any;
  RoleList: any = [];
  activityCategoryList = null;
  @ViewChild('allCatSelected') private readonly allCatSelected: MatOption;
  @ViewChild('allTaskSelected') private readonly allTaskSelected: MatOption;
  taskActivitiesList: any = [];
  enableTask = false;
  validDate = true;
  isDownloading = false;
  customRange = false;
  dateRangeList = ['Today','This Week','This Month','Last Month','Custom Range'];
  selectedroutine: any;
  routineList: any =[];
customFilterList: any = [];
customFilterOutputMap: { dataKey: string; idKey: string } = { dataKey: '', idKey: '' };

  constructor(private readonly workflowService: WorkflowService,
    public dialog: MatDialog,
    public fb: FormBuilder,
    public datepipe: DatePipe,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    public reportService: ReportService,
    public toastr: AppToastService,
    private readonly router: Router) {
    const now = new Date();
    this.yesterday = new Date(now);
    this.yesterday.setDate(now.getDate() - 1); 
    this.yesterdayDateTime = this.yesterday.toISOString().slice(0, 16);
    this.activate_btn = this.commonService.getActivePermission('button');
    this.commonService.getRollList().subscribe(res => this.RoleList = res.results);
    this.commonService.getAppTermsLink('ROU-TSK').subscribe(res => this.activityCategoryList = res.results);
    this.commonService.getAllShift().subscribe(res => this.shiftList = res.results);
    this.commonService.getAllDepartments().subscribe(res => this.deptList = res.results);
    let userId = localStorage.getItem(btoa('userId'));
    if(userId){
      this.commonService.getUserDepartmentLink(userId).subscribe(res => this.userDeptList = res.results);
    }
  }
  ngOnInit(): void {
    this.getLayoutName()
    if(!this.pdfConfigSelected){
      this.pdfConfigSelected = 'default';
    }
    let apptermGrp = ['PoolName','PoolLocation','StudentGrade','StudentGroup'];
    for(let i=0;i<this.filterInputs.length;i++){
      if(this.filterInputs[i]?.name === 'Appterms'){
        let grpName = this.filterInputs[i]?.groupName;
        if(!apptermGrp.includes(grpName)){
          apptermGrp.push(grpName);
        }
      }
    }
    let appterms = apptermGrp.join(',');
    this.commonService.getAppTerms(appterms).subscribe(res => {
      this.apptermsList = res.results;
      this.poolNameList = res.results.filter(resFilter => resFilter.groupName === 'PoolName');
      this.PoolLocationList = res.results.filter(resFilter => resFilter.groupName === 'PoolLocation');
      this.studGradeList = res.results.filter(resFilter => resFilter.groupName === 'StudentGrade');
      this.studGroupList = res.results.filter(resFilter => resFilter.groupName === 'StudentGroup');
      this.routineList =  res.results.filter(resFilter => resFilter.groupName === 'RoutineType')
    });
    this.commonService.getAuditScheduleData().subscribe(res => {
      this.scheduleList = res.results;
    })
    this.staffSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getUserByType(searchTextValue);
    });
    this.userSearchSub.pipe(debounceTime(600)).subscribe(([searchTextValue,usType]) => {
      this.getUserInfoByType(searchTextValue,usType);
    });
    for (let i = 0; i < this.filterInputs.length; i++) {
      if (this.filterInputs[i]?.name === 'customFilter') {
        this.loadCustomFilterOptions(this.filterInputs[i]);
      }
    }
  }
  getLayoutName() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    if(this.headerName) {
      this.selectedMenu = this.headerName;
      this.reportHeaderActionEvent('refresh', null);
    } else if (permissions && permissions.length !== 0) {
      const menuName = window.location.pathname;
      let menuPath = menuName.replace('en/', '').replace('ar/', '');
      let menuItemsList = permissions['menuItems'];
      menuItemsList.forEach(menu => {
        if (menu.link === menuPath) {
          this.selectedMenu = menu;
        } else {
          if (menu.hasOwnProperty('subMenus') && menu.subMenus.length !== 0) {
            menu.subMenus.forEach(subMenu1 => {
              if (subMenu1.link === menuPath) {
                this.selectedMenu = subMenu1;
              } else {
                if (subMenu1.hasOwnProperty('subMenus') && subMenu1.subMenus.length !== 0) {
                  subMenu1.subMenus.forEach(subMenu2 => {
                    if (subMenu2.link === menuPath) {
                      this.selectedMenu = subMenu2;
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.filterInputs) {
      let dateRangeType = false;
      let fdtIndex = 0;
      let tdtIndex = 0;
      if (this.filterInputs?.length !== 0) {
        this.filterInputs?.forEach(data => {
          if (data.default !== undefined) {
            this[data.name] = data.default;
            if (data.reportName) {
              const list = this.reportList.filter(x => x.name === data.reportName && x.link === data.default);
              this[data.name] = list[0]?.link;
            }
            if (data.name === 'groupBy') {
              this.type = data.default;
            }
          }
          if (data.name === 'dateRangeType') {
            dateRangeType = true;
            fdtIndex = this.filterInputs.findIndex(res=> res.name=='fromDate');
            tdtIndex = this.filterInputs.findIndex(res=> res.name=='toDate');
          }
          if (data.workflowTypeId !== undefined) {
            this.workflowTypeId = data.workflowTypeId
          }
          if (data.assetCategory !== undefined) {
            this.assetCategory = data.assetCategory
          }
        })

        if(dateRangeType){
          // bind fromDate & toDate if dateRangeType is added in config(for custom range option)
          if(fdtIndex == -1){
            this.filterInputs.push(
              {
              "name": "fromDate",
              "id": "fdt",
              "label": "Select From Date",
              "seq": 1,
              "required": true,
              "visibled": true,
              "default": null
          });
          }
          if(tdtIndex == -1){
            this.filterInputs.push(
              {
                "name": "toDate",
                "id": "tdt",
                "label": "Select To Date",
                "seq": 2,
                "required": true,
                "visibled": true,
                "default": null
            }
            );
          }
        }
      }
      this.filterInputs = this.commonService.sortByKey(this.filterInputs, 'seq');
    }
    if(changes.enableInsights){
      if(changes.enableInsights.currentValue){
      this.validDate = true
      }
    }
    this.buildForm();
  }

  buildForm() {
    this.reportForm = this.fb.group({
      reportId: [this['report']]})
    for(let i=0;i<this.filterInputs.length;i++){
      let controlName = this.filterInputs[i]?.name;
      if(this.filterInputs[i]?.name === 'Appterms'){
        controlName = this.filterInputs[i]?.groupName;
      }
      let controlValue = this[controlName] ? this[controlName] : null;
      if(controlValue == null){
        if(this.filterInputs[i]?.name === 'fromDate' || this.filterInputs[i]?.name === 'toDate' || this.filterInputs[i]?.name === 'reportDate'){
          controlValue = this.today;
        }
        if(this.filterInputs[i]?.name === 'fromDateTime'){
          controlValue = this.fromDateTime;
        }
        if(this.filterInputs[i]?.name === 'toDateTime'){
          controlValue = this.toDateTime;
        }
        if (this.filterInputs[i]?.name === 'customFilter') {
          controlName = this.filterInputs[i]?.id || 'customFilter';
          controlValue = this[controlName]
        }
      }
      
      if(controlValue != null && typeof controlValue === 'string' && controlValue.includes(',')){
        controlValue = "All";
      }
      const control = this.fb.control(controlValue);
      // Add the control to the form group
      this.reportForm.addControl(controlName, control);
    }
    // this.reportForm = this.fb.group({
    //   reportId: [this['report']],
    //   fromDate: [this['fromDate'] ? this['fromDate'] : this.today],
    //   toDate: [this['toDate'] ? this['toDate'] : this.today],
    //   fromDateTime: [this['fromDateTime'] ? this['fromDateTime'] : this.fromDateTime],
    //   toDateTime: [this['toDateTime'] ? this['toDateTime'] : this.toDateTime],
    //   reportDate: [this['reportDate'] ? this['reportDate'] : this.today],
    //   poolName: [this['poolName'] ? this['poolName'] : null],
    //   poolNames: [this['poolNames'] ? this['poolNames'] : null],
    //   Shift: [this['Shift'] ? this['Shift'] : null],
    //   Department: [this['Department'] ? this['Department'] : null],
    //   Grade: [this['Grade'] ? this['Grade'] : null],
    //   StdGroup: [this['StdGroup'] ? this['StdGroup'] : null],
    //   poolLocation: [this['poolLocation'] ? this['poolLocation'] : null],
    //   location: [this['location'] ? this['location'] : null],
    //   role: [this['role'] ? this['role'] : null],
    //   user: [this['user'] ? this['user'] : null],
    //   studentSearch: [this['studentSearch'] ? this['studentSearch'] : null],
    //   tagSerialNumber: [this['tagSerialNumber'] ? this['tagSerialNumber'] : null],
    //   asset: [this['asset'] ? this['asset'] : null],
    //   patient: [this['patient'] ? this['patient'] : null],
    //   uhid: [this['mainidentifier'] ? this['mainidentifier'] : null],
    //   activity: [this['activity'] ? this['activity'] : null],
    //   task: [this['task'] ? this['task'] : null]
    // });
  }

  bindChildInputInfo(configData, key, data) {
    this.commonService.getShiftHistory(data, key).subscribe((res) => {
      if (res.statusCode == 1) {
        this.shiftList = res.results;
        this.shiftList = this.shiftList.map(item => {
          item['id'] = item.shiftMasterId;
          return item;
        });
      }
    })
  }
  reportHeaderActionEvent(key, data,groupName?) {
    if (key !== 'fromDate' && key !== 'fromDateTime' && key !== 'toDate' && key !== 'toDateTime' && key !== 'refresh') {
      this.validDate = true;
    }
    if (key === 'fromDate' || key === 'fromDateTime' || key === 'toDate' || key === 'toDateTime') {
      let sDate, eDate;
      if (key === 'fromDateTime') {
        sDate = this.reportForm.controls[key].value;
        eDate = this.reportForm.controls['toDateTime'].value;
      } else if (key === 'fromDate') {
        sDate = this.datepipe.transform(new Date(this.reportForm.controls[key].value), 'yyyy-MM-dd');
        if(this.reportForm.controls.hasOwnProperty('toDate')){
          eDate = this.datepipe.transform(new Date(this.reportForm.controls['toDate'].value), 'yyyy-MM-dd');
        }
      } else if (key === 'toDateTime') {
        sDate = this.reportForm.controls['fromDateTime'].value;
        eDate = this.reportForm.controls[key].value;
      } else if (key === 'toDate') {
        if(this.reportForm.controls.hasOwnProperty('fromDate')){
          sDate = this.datepipe.transform(new Date(this.reportForm.controls['fromDate'].value), 'yyyy-MM-dd');
        }
        eDate = this.datepipe.transform(new Date(this.reportForm.controls[key].value), 'yyyy-MM-dd');
      }
      this.validDation(sDate, eDate);
    }
    if (this.layout === 'dynamic') {
      let value = null;
      if (this.filterInputs.length !== 0) {
        if (key !== 'getInsights' && key !== 'refresh' && key !== 'excel' && key !== 'pdf') {
          this.eventEmitted = false;
        }
        if (key !== 'getInsights' && key !== 'dateRangeType' && !this.eventEmitted) {
          this.disabled = false;
          this.params = null;
          this.filterInputs.forEach(filter => {
            if (filter.name !== 'getInsights') {
             const resolvedControlName = filter.name === 'customFilter' ? filter.id : filter.name === 'Appterms' ? filter.groupName : filter.name;
              if (this.reportForm.get(resolvedControlName)?.value != null){
                if (filter.name === 'fromDate' || filter.name === 'toDate' || filter.name === 'reportDate') {
                  value = this.datepipe.transform(this.reportForm.get(filter.name)?.value, 'yyyy-MM-dd');
                  this[filter.name] = value;
                } else if (filter.name === 'fromDateTime' || filter.name === 'toDateTime') {
                  value = this.datepipe.transform(this.reportForm.get(filter.name)?.value, 'yyyy-MM-dd  HH:mm');
                  this[filter.name] = value;
                } else if (filter.name === 'location' || filter.name === 'user' || filter.name === 'asset' ||
                  filter.name === 'patient' || filter.name === 'tagSerialNumber' || filter.name === 'uhid') {
                  if (data !== null && key === filter.name) {
                    if (filter.name === 'location') {
                      value = data?.id;
                      this[filter.name + 'ID'] = data?.id;
                      this['location'] = data?.name + ',' + data?.fullName;
                    } else if (filter.name === 'patient') {
                      value = data?.id;
                      this[filter.name + 'ID'] = data?.id;
                      this['patient'] = data?.firstName;
                    } else if (filter.name === 'tagSerialNumber') {
                      value = data?.tagId;
                      this[filter.name + 'ID'] = data?.tagId;
                      this['tagSerialNumber'] = data?.tagId;
                    } else if (filter.name === 'uhid') {
                      value = data;
                      this[filter.name + 'ID'] = data;
                      this['mainidentifier'] = data;
                    } else {
                      value = data?.id;
                      this[filter.name + 'ID'] = data?.id;
                      this[filter.name] = data?.name;
                    }
                  } else if (data !== null && this.reportForm.get(filter.name)?.value !== null) {
                    value = this[filter.name + 'ID'];
                  } else {
                    value = null;
                    this[filter.name + 'ID'] = null;
                    this.reportForm.get(filter.name).setValue(null);
                    this[filter.name] = null;
                  }
                } else if (filter.name === 'customFilter') {
                  const cfControlName = filter.id;
                  const cfValue = this.reportForm.get(cfControlName)?.value;
                  value = (cfValue !== null && cfValue !== undefined && cfValue !== '')
                    ? (Array.isArray(cfValue) ? cfValue.join(',') : cfValue)
                    : null;
                   this[cfControlName] = value;
                } else if (filter.name === 'poolName' || filter.name === 'poolNames') {
                  if (data !== null && key === filter.name) {
                    value = data;
                    this[filter.name + 'ID'] = value;
                    this[filter.name] = value;
                  } else if (data !== null && this.reportForm.get(filter.name)?.value !== null) {
                    value = this[filter.name + 'ID'];
                  } else {
                    value = null;
                    this[filter.name + 'ID'] = null;
                    this.reportForm.get(filter.name).setValue(null);
                    this[filter.name] = null;
                  }
                } else if (filter.name === 'Shift' || filter.name === 'Department' || filter.name === 'Grade' || filter.name === 'StdGroup' || filter.name === 'Schedule') {
                  if (data !== null && key === filter.name){
                    this[filter.name] =  data;
                  } 
                  value = this[filter.name];
                } else if(filter.name === 'userDepartmentLink'){
                  if (data !== null && key === filter.name){
                    if(data == 'All'){
                      const deptIds = this.userDeptList.map(item => item.departmentId).join(',');
                      this[filter.name] =  deptIds;
                    }else{
                      this[filter.name] =  data;
                    }
                  } 
                  value = this[filter.name];
                } else if(filter.name === 'studentSearch'){
                  if (key === filter.name){
                    this[filter.name] =  data? data.firstName : null;
                    this[filter.name + 'ID'] = data? data.id : null;
                  }
                  value = this[filter.name + 'ID'];
                } else if(filter.name === 'staffSearch'){
                  if (key === filter.name){
                    this[filter.name] =  data? data.firstName : null;
                    this[filter.name + 'ID'] = data? data.id : null;
                  }
                  value = this[filter.name + 'ID'];
                }else if(filter.name === 'doctorSearch'){
                  if (key === filter.name){
                    this[filter.name] =  data? data.firstName : null;
                    this[filter.name + 'ID'] = data? data.id : null;
                  }
                  value = this[filter.name + 'ID'];
                }else if(filter.name === 'infant'){
                  if (key === filter.name){
                    this[filter.name] =  data? data.patientName : null;
                    this[filter.name + 'ID'] = data? data.patientId : null;
                  }
                  value = this[filter.name + 'ID'];
                } else if(filter.name === 'Appterms'){
                  if (data !== null && key === filter.name && groupName === filter.groupName){
                    this[filter.groupName] =  data;
                  } 
                  value = this[filter.groupName];
                }
                this.paramJson[filter.id] = value
                if (this.params === null && value !== null) {
                  this.params = '?' + filter.id + '=' + value;
                } else if (value !== null) {
                  this.params = this.params + '&' + filter.id + '=' + value;
                }
              }
            }
          });
        }
        else if(key === 'dateRangeType'){
          this.disabled = false;
          let range = this.dateRangeFilter(data);
          this[key] =  data;
          let fromDateIndex = this.filterInputs.findIndex(res => res.name === 'fromDate');
          let toDateIndex = this.filterInputs.findIndex(res => res.name === 'toDate');
          if(range.hasOwnProperty('startDate') && range.hasOwnProperty('endDate')){
            this['fromDate'] = this.datepipe.transform(new Date(range['startDate']), 'yyyy-MM-dd');
            this['toDate'] = this.datepipe.transform(new Date(range['endDate']), 'yyyy-MM-dd');
            this.paramJson['fdt'] = this['fromDate'];
            this.paramJson['tdt'] = this['toDate'];
            if (this.params === null && this['fromDate'] !== null && this['toDate'] != null) {
              this.params = '?' + 'fdt' + '=' + this['fromDate']+ '?' + 'tdt' + '=' + this['toDate'] ;
            } else if (this['fromDate'] !== null && this['toDate'] != null) {
              this.params = this.params + '&' + 'fdt' + '=' + this['fromDate'] + '&' + 'tdt' + '=' + this['toDate'];
            }
            this.filterInputs[fromDateIndex]['visibled'] = false;
            this.filterInputs[toDateIndex]['visibled'] = false;
          }else{
            this.filterInputs[fromDateIndex]['visibled'] = true;
            this.filterInputs[toDateIndex]['visibled'] = true;
          }
          if (this.reportForm.invalid) {
            for (const controlName in this.reportForm.controls) {
              const control = this.reportForm.controls[controlName];
              if (control.invalid) {
                console.log(controlName, control.errors);
              }
            }
          }
        }
        if(groupName === 'RoutineType' ){
          const routine = this.routineList.find(res => res.code === data);
          this.selectedroutine = routine ? routine.value : null;
        }
        if (key === 'getInsights' || key === 'refresh' || key === 'excel' || key === 'pdf') {
          this.eventEmitted = true;
          data = this.params;
          let paramJson = this.paramJson
          let selectedRoutine =this.selectedroutine || null ;
          this.reportHeaderAction.emit({ key, data, paramJson,selectedRoutine });
          this.buildForm();
          this.disabled = true;
        }
      }
    } else {
      this.reportHeaderAction.emit({ key, data });
      this.disabled = true;
    }
    if (key === 'getInsights') {
      this.validDate = false;
    }
  }

  validDation(sDate: string, eDate: string) {
    this.validDate = true;
    if ((sDate != null && eDate != null) && (eDate < sDate)) {
      this.validDate = false;
      this.toastr.warning('Warning', `From Date should not be greater than To Date`);
    }
  }

  reportActionEvent(type, value) {
    if (type === 'activity') {
      if (value) {
        if (this.allCatSelected.selected) {
          this.reportForm.controls['activity']
            .patchValue([...this.activityCategoryList.map(item => item.code), 0]);
          this.allCatSelected.select();
        } else {
          this.reportForm.controls['activity'].patchValue([]);
          this.allCatSelected.deselect();
        }
      }
    } else if (type === 'task') {
      if (value) {
        if (this.allTaskSelected.selected) {
          this.reportForm.controls['task']
            .patchValue([...this.taskActivitiesList.map(item => item.id), 0]);
          this.allTaskSelected.select();
        } else {
          this.reportForm.controls['task'].patchValue([]);
          this.allTaskSelected.deselect();
        }
      }
    }
  }

  openedChange(isOpended, type,filterId?) {
    if (!isOpended) {
      let value;
      if (type === 'customFilter') {
        const controlName = filterId || 'customFilter';
        value = this.reportForm.get(controlName)?.value;
        this.reportHeaderActionEvent('customFilter', value);
      } else if (type === 'poolNames') {
        value = this.reportForm.get('poolNames').value;
      } else if (type === 'activity') {
        value = this.reportForm.get('activity').value;
        if (value !== null) {
          this.getTaskActivity();
        }
      } else if (type === 'task') {
        value = this.reportForm.get('task').value;
      }
      this.reportHeaderActionEvent(type, value)
    }
  }

  getLocationlist(id) {
    let searchList = '';
    searchList += id.target.value;
    if (searchList.length >= 2) {
      this.configurationService.getLocationData(id.target.value).subscribe(res => {
        if (res.results.length == 0) {
        }
        this.locationlist = res.results;
      });
    } else {
      this.locationlist = [];
    }
  }

  getUserByTypeCheck(val) {
    this.staffSub.next(val);
  }
  getUserInfoByTypeCheck(val,usType){
    this.userSearchSub.next([val,usType]);
  }
  getUserInfoByType(searchText,usType){
    let searchName = '';
    searchName += searchText.target.value;
    if(searchName.length >= 2){
      this.commonService.getAssociatedUserByUserType(usType,searchName).subscribe(res => {
        if(res.statusCode == 1){
          this.userInfoList = res.results;
        }else{
          this.userInfoList = [];
        }
      })
    }
  }
  getUserByType(val) {
    let searchList = '';
    searchList += val.target.value;
    if (searchList.length >= 2) {
      this.commonService.searchDoctor(val.target.value, 'UT_PORTER', 'RO-PO').subscribe(res => {
        if (res.results.length == 0) {
        }
        this.userList = res.results;
      });
    } else {
      this.userList = [];
    }
  }

  searchToCoster(event) {
    if (event.target.value?.length >= 2) {
      this.commonService.getAllTagByType(event.target.value, this.workflowTypeId, 'ST-AT').subscribe(res => {
        this.searchCosterlist = res.results;
      });
    } else {
      this.searchCosterlist = [];
    }
  }

  searchAsset(event) {
    if (event.target.value?.length >= 2) {
      this.commonService.searchAssetByCategory(this.assetCategory, event.target.value).subscribe((res) => {
        this.searchAssetList = res.results;
      });
    } else {
      this.searchAssetList = [];
    }
  }

  searchPatient(event) {
    if (event.target.value !== "") {
      let val = event.target.value;
      if (val.length >= 2) {
        this.commonService.searchPatient(event.target.value).subscribe((res) => {
          this.searchPatientlist = res.results.filter(res => res.mainidentifier != null);
        });
      } else {
        this.searchPatientlist = [];
      }
    } else {
      this.searchPatientlist = [];
    }
  }

  searchInfant(event) {
    if (event.target.value !== "") {
      let val = event.target.value;
      if (val.length >= 2) {
        this.commonService.searchPatientsByType(event.target.value,'INFANT').subscribe((res) => {
          this.searchInfantlist = res.results.filter(res => res.uhid != null);
        });
      } else {
        this.searchInfantlist = [];
      }
    } else {
      this.searchInfantlist = [];
    }
  }

  clearUHID(event) {
    if (event.type === 'uhid' && event.target.value === '') {
      this.reportForm.get('uhid').setValue(null);
    }
  }

  getUHID(value) {
    if (value.length >= 2) {
      const uhid = value;
      this.commonService.getUHID(uhid).subscribe(res => {
        if (res.statusCode === 1) {
          this.uhidList = [res.results.mainidentifier];
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
          this.uhidList = [];
          this.reportForm.get('uhid').setValue(null);
        });
    }
  }

  getTaskActivity() {
    if (this.allCatSelected.selected) {
      this.reportService.getTaskByCategory('ROU-TSK').subscribe(res => {
        this.taskActivitiesList = res.results;
        this.enableTask = true;
      });
    } else if (this.reportForm.controls['activity']?.value?.length > 0) {
      this.reportService.getTaskByCategory('ROU-TSK', this.reportForm.controls['activity']?.value).subscribe(res => {
        this.taskActivitiesList = res.results;
        this.enableTask = true;
      });
    }
  }

  serverPdf() {
    if (this.pdfConfigSelected !== "default") {
      let userId = localStorage.getItem(btoa('userId'));
      let customerId = localStorage.getItem('customerId');
      let facilityId = localStorage.getItem(btoa('facilityId'));
      this.isDownloading = true;

      let param = 'did=' + this.dashboardId + '&uid=' + userId + '&fid=' + facilityId + '?iparam=' + encodeURIComponent(JSON.stringify(this.paramJson));
      this.commonService.getServerPdf('pdfreport',param).subscribe(
        (res: ArrayBuffer) => {
          this.downloadFile(res, this.selectedMenu?this.selectedMenu?.name+'.pdf':'report.pdf');
          this.isDownloading = false;
        },
        error => {
          console.error('Error downloading the file', error);
          this.isDownloading = false;
        }
      )

      // window.open('http://ec2-13-233-192-43.ap-south-1.compute.amazonaws.com:8000/pdfreport?did=' + this.dashboardId + '&uid=' + userId + '&fid=' + facilityId + '&iparam=' + JSON.stringify(this.paramJson));
      // const url = environment.serverPdfURL+'pdfreport?did=' + this.dashboardId + '&uid=' + userId + '&fid=' + facilityId + '&iparam=' + JSON.stringify(this.paramJson);

      // fetch(url)
      // .then(response => response.blob())
      // .then(blob => {
      //   // Create a blob URL
      //   const blobUrl = URL.createObjectURL(blob);

      //   // Create a hidden link element
      //   const link = document.createElement('a');
      //   link.href = blobUrl;
      //   link.download = this.selectedMenu?this.selectedMenu?.name:'report'; // Set the filename for the downloaded file
      //   link.style.display = 'none'; // Hide the link

      //   // Add the link to the document body
      //   document.body.appendChild(link);

      //   // Trigger a click event on the link
      //   link.click();

      //   // Clean up: remove the link and revoke the blob URL
      //   document.body.removeChild(link);
      //   URL.revokeObjectURL(blobUrl);
      // })
      // .catch(error => {
      //   console.error('Error fetching PDF:', error);
      // });
    }
  }
  downloadServerExcel(defaultVal?:any){
    let fdt = this.datepipe.transform(this.reportForm.get('fromDate')?.value, 'yyyy-MM-dd');
    let tdt = this.datepipe.transform(this.reportForm.get('toDate')?.value, 'yyyy-MM-dd');
    let param = '/fdt=' + fdt + '&tdt=' + tdt;
    this.validDate = false; //for disable the excel button on click
    this.commonService.getExcelReportData(defaultVal,param).subscribe(
      (res: ArrayBuffer) => {
        this.downloadFile(res, this.selectedMenu?this.selectedMenu?.name+'('+fdt+' - '+tdt+')'+'.xlsx':'report.xlsx');
        this.validDate = true;
      },
      error => {
        console.error('Error downloading the file', error);
      }
    )
  }
  downloadFile(data: ArrayBuffer, filename: string): void {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  dateRangeFilter(data) {
    this.customRange = false;
    const today = new Date();
    if (data === 'Today') {
      return { startDate: today, endDate: today };
    }
    else if (data === 'This Week') {
      const start = new Date(today.setDate(today.getDate() - today.getDay()));
      const end = new Date();
      // const end = new Date(start.getTime());
      // end.setDate(end.getDate() + 6);
      return { startDate: start, endDate: end };
    }
    else if (data === 'This Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      // const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const end = today;  // Use today's date as the end date
      return { startDate: start, endDate: end };
    }
    else if (data === 'Last Month') {
      const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const start = new Date(year, prevMonth, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    }
    else if (data === 'Custom Range') {
      this.customRange = true;
      return false;
    }
  }
  getTodayRange(): { startDate: Date, endDate: Date } {
    const today = new Date();
    return { startDate: today, endDate: today };
  }

  getThisWeekRange(): { startDate: Date, endDate: Date } {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - today.getDay()));
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 6);
    return { startDate: start, endDate: end };
  }

  getThisMonthRange(): { startDate: Date, endDate: Date } {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { startDate: start, endDate: end };
  }

  getLastMonthRange(): { startDate: Date, endDate: Date } {
    const today = new Date();
    const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const start = new Date(year, prevMonth, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { startDate: start, endDate: end };
  }

  loadCustomFilterOptions(filter: any) {
  if (!filter?.queryParam) return;

  let queryParam: any;
  try {
    queryParam = typeof filter.queryParam === 'string'
      ? JSON.parse(filter.queryParam)
      : filter.queryParam;
  } catch (e) {
    console.error('Invalid queryParam JSON for customFilter', e);
    return;
  }

  const filterId = filter.id || 'customFilter';
  const apiName: string = queryParam?.api;
  const inputParams: any = queryParam?.input || {};
  const outputDataKey: string = queryParam?.output?.data;
  const outputIdKey: string = queryParam?.output?.id;

  this.customFilterOutputMap[filterId] = { dataKey: outputDataKey, idKey: outputIdKey };

  if (!apiName) return;

  const queryString = Object.entries(inputParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  this.commonService.getCustomFilterData(apiName, queryString).subscribe(
    (res: any) => {
      this.customFilterList[filterId] = Array.isArray(res) ? res : (res?.results || []);
    },
    (err) => {
      console.error('Error loading custom filter data', err);
      this.customFilterList[filterId] = [];
    }
  );
}

  fixClick() {
    console.log('')
  }

}
