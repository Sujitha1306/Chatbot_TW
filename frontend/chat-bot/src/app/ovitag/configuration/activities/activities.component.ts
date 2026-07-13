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
import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, FormControl, Validators, ValidationErrors } from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { CommonService, ConfigurationService } from "../../../shared";
import { CreateActivities, EditActivities } from "../configuration.model";
import { ActivatedRoute } from "@angular/router";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { HazmatTrainingComponent } from "../../../shared/modules/entry-component/hazmat-training/hazmat-training.component";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { CreateActivityRuleComponent } from "../../../shared/modules/entry-component/create-activity-rule/create-activity-rule.component";
import { ManageActivityRule } from "../../../shared/modules/entry-component/create-activity-rule/create-activity-rule.model";
import { AppToastService } from "../../../shared/services/toaster.service";
import { LookupTermService } from "../../../shared/lookup-term.service";
import { SessionStorageService } from "../../../shared/services/session.storage.service";

@Component({
  selector: "app-activities",
  templateUrl: "./activities.component.html",
  styleUrls: ["./activities.component.scss"],
  animations: [routerTransition()],
})
export class ActivitiesComponent implements OnInit {
  displayedColumns: string[] = ['Scope', 'Type', 'Category', 'Name', 'Routine Type', 'Description', 'Status'];
  eventColumn = ['Name'];
  iconHeader = [];
  iconColumn = ['S.No', 'Status'];
  sortColumn = ['S.No'];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLEN'];

  public activate_btn: any = [];
  public applyFilterValue = null;
  today = new Date();
  public floorList: any;
  tableData: any;
  selectedName: any = null;
  public selectedView = 'table';
  selectDropdown: any;
  showAction1 = [
    { id: 'create', value: 'Create' },
    { id: 'hazmat', value: 'Create Hazmat' }
  ];
  public showActions = this.showAction1;
  filterValue = null;
  public parentFilter = [
    {
      id: 'RoutineType',
      value: 'Type',
      isNoneAll: true,
      selectionType: 'single',
      subFilters: [],
      defaultSelected: ['All']
    }
  ];
  routineType: any;
  pageSize = 50;
  pageStart = 0;
  length = 0;
  loading = false;
  constructor(
    private readonly configurationService: ConfigurationService, public dialog: MatDialog, public sessionService: SessionStorageService,
    public fb: FormBuilder, public commonService: CommonService, private readonly route: ActivatedRoute, private readonly lookupService: LookupTermService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.tableData = this.route.snapshot.data.activities.results;
    this.length = this.route.snapshot.data.activities.totalRecords;
    const Columns = ['activitySubTypeName', 'routineTypeName', 'activityCategoryName', 'name', 'routineTypeName', 'description', 'isActive'];
    for (let i = 0; i <= Columns.length; i++) {
      this.tableData.map(data => {
        data[this.displayedColumns[i]] = data[Columns[i]];
      });
    }
    this.getFloorList();
    this.routineTypeFilter();
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllActivities();
  }
  routineTypeFilter() {
    this.lookupService.getAppTermsWrapper('RoutineType,TaskActivityType').subscribe(res => {
      const routineType = this.parentFilter.find(resFilter => resFilter.id === 'RoutineType');
      if (routineType) {
        routineType.subFilters = [ ...(res.RoutineType), ...(res.TaskActivityType) ].map(({ code, value }) => ({ code, value }));
      }
    });
  }
  getFloorList() {
    this.commonService.getFloorList().subscribe(res => {
      this.floorList = res.results;
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getAllActivities();
    } else if (this.applyFilterValue.length == 0) {
      this.getAllActivities();
    }
  }
  getAllActivities() {
    this.loading = true;
    this.configurationService.getAllActivities(this.pageStart, this.pageSize, this.routineType,this.applyFilterValue).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      this.loading = false;
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['activitySubTypeName', 'routineTypeName', 'activityCategoryName', 'name', 'routineTypeName', 'description', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }
  eventAction(event) {
    if (event.key === 'Name') {
      if (event.data?.configValue?.hasOwnProperty("kitId")) {
        this.createHazmat(event.data);
      } else {
        this.createActivity(event.data);
      }
    } else if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getAllActivities();
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.data === 'create') {
      this.createActivity('');
    } else if (event.data === 'hazmat') {
      this.createHazmat('');
    } else if (event.key === 'groupFilter') {
      this.routineType = event.data[0].data;
      if(this.routineType === 'All'){
        this.routineType = null
      }
      this.getAllActivities();
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  createActivity(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(CreateActivityComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.sessionService.deleteAttachFiles()
      this.refreshPage();
      this.selectDropdown = null;
    });
  }

  createHazmat(data) {
    this.showActions = null;
    const dialogRef = this.dialog.open(HazmatTrainingComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
}

@Component({
  selector: 'app-create-activity',
  templateUrl: './create-activity.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class CreateActivityComponent implements OnInit {
  public activityRule: ManageActivityRule[] = [];
  public matcher = new ErrorStateMatcherService();
  public activitiesForm: FormGroup;
  public createActivities: CreateActivities;
  public editActivities: EditActivities;
  AssignToList: any;
  genderList: any;
  statusList: any;
  categoryList: any;
  typeList: any;
  inchargeTypeList: any;
  height: number;
  inchargeList: any = [];
  inchargeEnabled = false;
  inchargeId = null;
  requireInchargeMatchVal: any;
  toHit = false;
  inchargeListRes: any = [];
  hazardList = [{ code: 'min', value: 'Min' }, { code: 'max', value: 'Max' }];
  requireLocationMatchVal: any = [];
  locationListItems: any = [];
  locationIdEnabled = false;
  public locationDetails: any = [];
  public enableLink = false;
  public isHazardCategory = false;
  public hazardConfigDetails: any;
  locationId = null;
  minExceed = false;
  maxExceed = false;
  alarmExceed = false;
  alarmLevel: any;
  alarmLevelExceed = false;
  public meters;
  public mrssi: number;
  activitySubType: any = [];
  activityNameList: any = [];
  selectedScope = 'AST-RQ';
  taskActivityType: any = [];
  roleList: any = [];
  departmentList: any = [];
  patientCall: any = [];
  originalInchargeTypeList: any[] = [];
  isTargetingExp: boolean = false;
  routineTypeList: any[];
  totalMinutes: number;
  public selectedTabIndex = 0;
  duration: string = "00:30";
  activityData: any[] = [];
  configType = 'create';
  entityConfigType = "pf_activity"
  isReminderFormValid: boolean = false;
  priorityLevel: any;
  activityRuleData: any[] = [];
  isReminderEdited: boolean = false;
  public matrixForm: FormGroup;
  public recipientTypeList:any;
  public departmentappList: any;
  public appEditData: any = null;
  public channelList:any;
  public userNameList = [];
  public recipientEnabled = false;
  recepientListItems: any = [];
  public formStatusData: any[] = [];
  public pfworkflowData: any[] = [];
  public pfWorkDeletData: any[] = [];
  public approvalStatusList: any [] = [];
  public approvalStatusTypeList: any [] = [];
  public parentEntityStatus: any[] = [];
  userNameData: any;
  public requestStatusList:any [] = [];
  public options: any = { 'status': {}}
  isRecipient: boolean = false;
  enableTabChange = false;
  levelList = [{code: 1, value:'Level 1'}, {code: 2, value:'Level 2'}, {code: 3, value:'Level 3'}, {code: 4, value:'Level 4'}, {code: 5, value:'Level 5'}, {code: 6, value:'Level 6'},{code: 7, value:'Level 7'}, {code: 8, value:'Level 8'},{code: 9, value:'Level 9'}, {code: 10, value:'Level 10'}];
  approvelDisplayColumn = ['Recipient Type', 'Department Name', 'Recipient Name', 'Name of Approval', 'Approval Status', 'Options', 'Level', 'Actions'];
  approvelDataColumns = ['identifyingTypeName', 'departmentName', 'identifyingValue','description', 'entityStatusName', 'options', 'workflowLevelId', ''];
  public entityData = {"id": null,"entityId": this.data.id,"entityType": 'PfActivity','entityDetails': this.data,'entityGroupTypeId': 'EGTI-AS','entityTypeId':'TAT-AS','formTemplateType' :'FTT-ACT'};
  public attachFiles: any[] = [];
  public formTemplateType = 'FTT-ACT';
  public entityType = 'pf_activity';
  public getpfworkflowData : any[] = [];
  constructor(public form: FormBuilder, public toastr: AppToastService, public thisDialogRef: MatDialogRef<CreateActivityComponent>, public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, private readonly configurationService: ConfigurationService, private readonly commonService: CommonService,
    private readonly lookupService: LookupTermService) {
      if(this.data){
        this.selectedScope = this.data.activitySubTypeId;
      }
     }
     
  ngOnInit() {
    this.height = window.innerHeight - 207;
    if (this.data) {
      this.inchargeId = this.data.inchargeId;
      this.locationId = this.data.destinationId;
      if (this.data.activityCategoryId === 'AC-HAZ') {
        this.isHazardCategory = true;
      }
      let data = this.data
      data['dataType'] = 'get'
      this.activityData = data
      this.configType = 'modify';
      this.getActivityByLink();
    }
    this.lookupService.getAppTermsWrapper('UserType').subscribe(res => {
      this.AssignToList = res.UserType ?? [];
    });
    this.lookupService.getAppTermsWrapper('RecipientType,Gender,Status,ActivitySubType,TaskActivityType,ActivityCategory,AssetMaintenanceType,LocationMaintenanceType,HazardType,RoutineType,PriorityLevel,Channel,RequestStatus').subscribe(res => {
      this.originalInchargeTypeList = res.RecipientType.filter(resFilter => (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT'));
      this.genderList = res.Gender.filter(resFilter => resFilter.code === 'Male' || resFilter.code === 'Female');
      this.statusList = res.Status.filter(resFilter => resFilter.code === 'ST-AT' || resFilter.code === 'ST-IA');
      this.activitySubType = res.ActivitySubType ?? [];
      this.taskActivityType = res.TaskActivityType ?? [];
      this.routineTypeList = res.RoutineType ?? [];
      this.priorityLevel = res.PriorityLevel ?? [];
      this.recipientTypeList = res.RecipientType.filter(resFilter => (resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-EO' || resFilter.code === 'RT-OW'));
      this.channelList = res.Channel.filter(resFilter => (resFilter.code == 'CH-EM' || resFilter.code == 'CH-NO'));
      this['requestStatusInfo'] = res.RequestStatus ?? [];
      this.requestStatusList = res.RequestStatus ?? [];
      this.approvalStatusList = res.RequestStatus.filter(res => res.code === 'RQ-RTN' || res.code === 'RQ-WFA' || res.code === 'RQ-RJ');
      this.approvalStatusTypeList = res.RequestStatus;
      this.parentEntityStatus = res.RequestStatus;
      this.typeList = this.taskActivityType;
      if (this.data.routineTypeId) {
          this.lookupService.getAppTermsLinkWrapper(this.data.routineTypeId, 'ActivityCategory').subscribe(res => {
            this.categoryList = res.ActivityCategory;
          })
      }
      if(this.data.Scope === "Routine"){
        this.typeList = this.routineTypeList;
      } else {
        this.typeList = this.taskActivityType;
      }
      if (this.data?.activitySubTypeId) {
        if (this.data?.roleIds?.length || this.data?.departmentIds?.length) {
          let filteredList: any[] = [];
          if (this.data?.roleIds?.length) {
            filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
          }
          if (this.data?.departmentIds?.length) {
            filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
          }
          this.inchargeTypeList = [...new Set(filteredList)];
        }
      }
    });
    this.configurationService.getRecipientName('', 'RT-RO').subscribe(res => {
      this.roleList = res.results;
    });
    this.commonService.getAllDepartments().subscribe(res => {
      this.departmentList = res.results;
    });
    if (this.data?.minDuration) {
      this.duration = this.data?.minDuration
        ? `${Math.floor(this.data.minDuration / 60).toString().padStart(2, '0')}:${(this.data.minDuration % 60).toString().padStart(2, '0')}`
        : '00:30';
    }
    this.buildForm();
    this.activitiesForm.controls['activitySubTypeId'].valueChanges.subscribe(value => {
      this.selectedScope = value;
      this.inchargeTypeList = []
      if (value === 'AST-ROU') {
        this.updateInchargeTypeList([], [])
      }
      if (value !== 'AST-RQ') {
        this.activitiesForm.get('duration').setValidators([Validators.required, Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]);
        this.activitiesForm.get('duration').updateValueAndValidity();
      } else {
        this.activitiesForm.get('duration').setValidators([Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]);
        this.activitiesForm.get('duration').updateValueAndValidity();
      }
    });

    this.activitiesForm.get('roleIds').valueChanges.subscribe(roleValues => {
      this.updateInchargeTypeList(roleValues, this.activitiesForm.get('departmentIds').value);
    });

    this.activitiesForm.get('departmentIds').valueChanges.subscribe(departmentValues => {
      this.updateInchargeTypeList(this.activitiesForm.get('roleIds').value, departmentValues);
    });

    if (this.data.inchargeType) {
      this.updateAssignList(this.data.inchargeType, this.data.inchargeName);
    }
    if (this.selectedScope !== 'AST-RQ') {
      this.activitiesForm.get('duration').setValidators([Validators.required, Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]);
      this.activitiesForm.get('duration').updateValueAndValidity();
    } else {
      this.activitiesForm.get('duration').setValidators([Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]);
      this.activitiesForm.get('duration').updateValueAndValidity();
    }
    this.matrixForm.get('recipientType').valueChanges.subscribe(value => {
      this.updateFormValidation(value)
    })
  }
  updateAssignList(type, name) {
    const selectedRole = this.data.roleIds?.map(str => Number(str));
    const selctedDepartment = this.data.departmentIds?.map(str => Number(str));
    if (type === 'RT-US') {
      let roles = this.activitiesForm.controls['roleIds'].value.join(',');
      const departmentValues = this.activitiesForm.controls['departmentIds'].value;
      const departments = Array.isArray(departmentValues) ? departmentValues.join(',') : null;
      this.configurationService.getRoleUser(null, roles, departments, this.inchargeId).subscribe(res => {
        this.inchargeList = res.results.filter(data => data.id === this.inchargeId);
        this.inchargeEnabled = true;
        this.activitiesForm.get('inchargeId').setValue(this.inchargeList[0].name)
        this.activitiesForm.get('inchargeId').updateValueAndValidity();
      });
    } else if (type === 'RT-RO') {
      this.configurationService.getRecipientName('', type).subscribe(res => {
        if(selectedRole){
          this.inchargeList = res.results.filter(item => selectedRole.includes(item.id));
          this.inchargeList = this.inchargeList.filter(data => data.id === this.inchargeId);
          this.inchargeEnabled = true;
          this.activitiesForm.get('inchargeId').updateValueAndValidity();
        }
      });
    } else if (type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        if(selctedDepartment){
          this.inchargeList = res.results.filter(item => selctedDepartment.includes(item.id));
          this.inchargeList = this.inchargeList.filter(data => data.id === this.inchargeId);
          this.inchargeEnabled = true;
          this.activitiesForm.get('inchargeId').updateValueAndValidity();
        }
      });
    }
  }

  private updateInchargeTypeList(selectedRoles: any[], selectedDepartments: any[]) {
      let filteredList: any[] = [];
    if (selectedRoles?.length) {
      filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-RO' || resFilter.code === 'RT-US'));
    }
    if (selectedDepartments?.length) {
      filteredList.push(...this.originalInchargeTypeList.filter(resFilter => resFilter.code === 'RT-DT'));
    }
    this.inchargeTypeList = [...new Set(filteredList)];
  }

  private validateInchargeSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;

    if (selectedId && this.inchargeList) {
      const selectedIncharger = this.inchargeList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedIncharger) {
        return { requireMatch: true };
      }
    }
    return null;
  }

  public buildForm() {
    let isActiveStatus;
    if (this.data.hasOwnProperty('isActive') && this.data.isActive !== null) {
      isActiveStatus = this.data.isActive ? 'ST-AT' : 'ST-IA';
    } else {
      isActiveStatus = 'ST-AT';
    }
    this.activitiesForm = this.form.group({
      routineTypeId: [this.data?.routineTypeId ?? null, [Validators.required]],
      name: [this.data?.name ?? null, [Validators.required]],
      inchargeType: [this.data?.inchargeType ?? null],
      inchargeId: [this.data?.inchargeName ?? null, [this.validateInchargeSelection.bind(this)]],
      // minDuration: [this.data.minDuration ? this.data.minDuration : null, [Validators.maxLength(3)]],
      duration:[this.data.minDuration ? this.duration : '00:30', [Validators.required, Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
      isActive: [isActiveStatus],
      sequence: [this.data?.sequence ?? null],
      priority: [this.data?.priority ?? null],
      activityGroupId: [this.data?.activityGroupId ?? null],
      allowPartial: [this.data?.allowPartial ?? false],
      minInterval: [this.data?.minInterval ?? null, [Validators.maxLength(3)]],
      gender: [this.data?.gender ?? null],
      autoComplete: [this.data?.autoComplete ?? false],
      isAdmin: [this.data?.isAdmin ?? false],
      isExternal: [this.data?.isExternal ?? false],
      isInBatch: [this.data?.isInBatch ?? false],
      activityCategoryId: [this.data?.activityCategoryId ?? null, [Validators.required]],
      isDiabetic: [this.data?.isDiabetic ?? false],
      isForLater: [this.data?.isForLater ?? false],
      canAutoAllocate: [this.data?.canAutoAllocate ?? false],
      isRecurring: [this.data?.isRecurring ?? false],
      description: [this.data?.description ?? null],
      locationId: [this.data?.destinationName ?? null, this.requireLocationMatch.bind(this)],
      activitySubTypeId: [this.data?.activitySubTypeId ?? 'AST-RQ', [Validators.required]],
      isIssue: [this.data?.isIssue ?? null],
      roleIds: [this.data.roleIds?.length ? this.data.roleIds.map(str => Number(str)) : null, [Validators.required]],
      departmentIds: [this.data.departmentIds?.length ? this.data.departmentIds.map(str => Number(str)) : null],
      priorityLevel: [this.data?.priorityLevelId ?? null]
      
    });
    this.matrixForm = this.form.group({
      recipientType: [null ,[Validators.required]],
      recipientName: [null,[Validators.required,this.invalidOptionValidator.bind(this)]],
      level: [null,[Validators.required]],
      description: [null,[Validators.required]],
      channelId: ['CH-NO'],
      entityStatusId: [null,[Validators.required]],
      appdepartmentId: [null,[Validators.required]],
      approvalStatus: [null],
      approvalStatusType: [null],
      approvalStatusLevel:[null],
      parentEntityStatusId: [null],
      radiologyId: [false]
    });
    this.centimeterChanged()
  }
  centimeterChanged() {
    this.meters = this.activitiesForm.value.rssiRange / 100;
    this.mrssi = this.activitiesForm.value.mrssiRange / 100;
  }
  getRoutineType(event) {
    this.activitiesForm.reset()
    this.activitiesForm.get('activitySubTypeId').setValue(event.value);
    this.activitiesForm.get('isActive').setValue('ST-AT');
    this.activitiesForm.get('duration').setValue('00:30')
    this.categoryList = [];
    const key = this.activitiesForm.controls['activitySubTypeId'].value;
    this.selectedScope = key;
    if (key === 'AST-RQ') {
      this.typeList = this.taskActivityType;
    } else {
      this.typeList = this.routineTypeList;
    }
  }
  getCategoryType(code) {
    let type = code.value;
    this.lookupService.getAppTermsLinkWrapper(type, 'ActivityCategory').subscribe(res => {
      this.categoryList = res.ActivityCategory ?? [];
    })
  }

  getDepatmentIds(event) {
    this.activitiesForm.get('inchargeType').setValue(null)
    this.activitiesForm.get('inchargeId').setValue(null)
  }

  getRoleIds(event) {
    this.activitiesForm.get('inchargeType').setValue(null)
    this.activitiesForm.get('inchargeId').setValue(null)
  }

  getIncharge(type) {
    this.inchargeId = null;
    this.activitiesForm.controls['inchargeId'].setValue(null);
    if (type === 'RT-RO') {
      this.configurationService.getRecipientName('', type).subscribe(res => {
        let selectedRoles = this.activitiesForm.controls['roleIds']?.value || [];
        this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
        this.inchargeEnabled = true;
      });
    } else if (type === 'RT-DT') {
      this.commonService.getAllDepartments().subscribe(res => {
        let selectedDepartments = this.activitiesForm.controls['departmentIds']?.value || [];
        this.inchargeList = res.results.filter(dep => selectedDepartments.includes(dep.id));
        this.inchargeEnabled = true;
      });
    } else if (type === 'RT-US') {
      let departmentsString = this.activitiesForm.controls['departmentIds'].value || [];
      let roles = this.activitiesForm.controls['roleIds'].value.join(',');
      let departments = Array.isArray(departmentsString) ? departmentsString.join(',') : null;
      departments = departments == '' || departments == null ? null : departments;
      this.configurationService.getRoleUser(null, roles, departments).subscribe(res => {
        this.inchargeList = res.results
        this.inchargeListRes = res.results;
        this.inchargeEnabled = true;
      });
    } else {
      this.inchargeList = [];
      this.inchargeEnabled = false;
    }
  }
  searchUserNamelist(event) {
    this.toHit = event.toHit;
    this.inchargeId = null;
    const type = this.activitiesForm.controls['inchargeType'].value;
    if (event.type === 'incharge' && type === 'RT-US') {
      if (this.toHit === true && event.text.length >= 2) {
        let roles = this.activitiesForm.controls['roleIds'].value.join(',');
        let departments = this.activitiesForm.controls['departmentIds'].value.join(',');
        this.configurationService.getRoleUser(event.text, roles, departments).subscribe(res => {
          this.inchargeList = res.results;
          this.inchargeEnabled = true;
        });
      } else {
        this.inchargeList = this.inchargeListRes;
        this.inchargeEnabled = true;
      }
    } else {
      let selectedRoles = this.activitiesForm.controls['roleIds'].value;
      let selectedDepartments = this.activitiesForm.controls['departmentIds'].value;
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          if (selectedRoles !== null) {
            this.inchargeList = res.results.filter(role => selectedRoles.includes(role.id));
            this.inchargeEnabled = true;
          }
        });
      } else if (type === 'RT-DT') {
        this.inchargeList = this.departmentList.filter(dep => selectedDepartments.includes(dep.id));
        this.inchargeEnabled = true;
      } else {
        this.inchargeList = [];
        this.inchargeEnabled = false;
      }
    }
  }
  getInchargeList(id) {
    if (id) {
      const incharge = this as any as { id: string, name: string }[]
      const inchargeId = incharge.find(obj => obj.id === id).name;
      return inchargeId;
    } else {
      return '';
    }
  }

  getLocationSearch(event) {
    this.locationId = null;
    if (event.type === 'locationSearch' && event.text.length >= 2) {
      if (event.toHit === true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.locationListItems = res.results;
          this.locationDetails = this.locationListItems;
          this.locationIdEnabled = true;
        });
      } else {
        this.locationDetails = this.locationListItems;
        this.locationIdEnabled = true;
      }
    } else {
      this.locationDetails = [];
      this.locationIdEnabled = false;
    }
  }
  getLocationIdList(id) {
    if (id !== null) {
      const location = this as any as { id: string, name: string, fullName: string }[]
      const locationId = location.find(obj => obj.id === id).fullName;
      return locationId;
    } else {
      return '';
    }
  }

  private requireLocationMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '' && this.locationIdEnabled) {
      this.requireLocationMatchVal = this.locationDetails.filter(resFilter => resFilter.id === control.value);
      if (this.requireLocationMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }
  minMaxValidation(type) {
    const min = parseInt(this.activitiesForm.get('min').value);
    const max = parseInt(this.activitiesForm.get('max').value);

    if (type === 'min' && min >= max) {
      this.minExceed = true;
      this.maxExceed = false;
    } else if (type !== 'min' && min >= max) {
      this.minExceed = false;
      this.maxExceed = true;
    }
  }
  validateAlarm(value) {
    const level = value.split(',');
    this.alarmLevel = level;
    if (this.alarmLevel && ((parseInt(this.alarmLevel[0]) > this.activitiesForm.controls['max'].value ||
      parseInt(this.alarmLevel[1]) > this.activitiesForm.controls['max'].value ||
      parseInt(this.alarmLevel[2]) > this.activitiesForm.controls['max'].value ||
      parseInt(this.alarmLevel[3]) > this.activitiesForm.controls['max'].value) ||
      (parseInt(this.alarmLevel[0]) < this.activitiesForm.controls['min'].value ||
        parseInt(this.alarmLevel[1]) < this.activitiesForm.controls['min'].value ||
        parseInt(this.alarmLevel[2]) < this.activitiesForm.controls['min'].value ||
        parseInt(this.alarmLevel[3]) < this.activitiesForm.controls['min'].value))) {
      this.alarmLevelExceed = true;
    } else {
      this.alarmLevelExceed = false;
    }
    if (level.length > 4) {
      this.alarmExceed = true;
    } else {
      this.alarmExceed = false;
    }
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    if (this.enableTabChange) return;
     this.enableTabChange = true;
    this.selectedTabIndex = tabChangeEvent.index;
    setTimeout(() => this.enableTabChange = false, 300);
    if(this.selectedTabIndex === 3){
      if (this.data?.id) {
        this.getPfWorkflow();
      }
    }
  }

  checkNotifiValidityChange(valid: boolean){
    this.isReminderFormValid = valid['formValidation'];
    this.isReminderEdited = valid['editValidation'];
  }

  saveActivity() {
    const duration: string = this.activitiesForm.controls['duration'].value;
    if (duration) {
    const [hrs, mins] = duration.split(':').map(Number);
    this.totalMinutes = hrs * 60 + mins;
    }
    this.createActivities = new CreateActivities(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null);
    this.createActivities.routineTypeId = this.activitiesForm.controls['routineTypeId'].value;
    this.createActivities.name = this.activitiesForm.controls['name'].value;
    this.createActivities.inchargeType = this.activitiesForm.controls['inchargeType'].value;
    this.createActivities.inchargeId = this.activitiesForm.controls['inchargeId'].value;
    this.createActivities.minDuration = this.totalMinutes;
    if (this.activitiesForm.controls['isActive'].value == 'ST-AT') {
      this.createActivities.isActive = true;
    } else {
      this.createActivities.isActive = false;
    }
    this.createActivities.sequence = parseInt(this.activitiesForm.controls['sequence'].value);
    this.createActivities.priority = parseInt(this.activitiesForm.controls['priority'].value);
    this.createActivities.activityGroupId = this.activitiesForm.controls['activityGroupId'].value;
    this.createActivities.allowPartial = this.activitiesForm.controls['allowPartial'].value;
    this.createActivities.minInterval = parseInt(this.activitiesForm.controls['minInterval'].value);
    this.createActivities.gender = this.activitiesForm.controls['gender'].value;
    this.createActivities.autoComplete = this.activitiesForm.controls['autoComplete'].value;
    this.createActivities.isAdmin = this.activitiesForm.controls['isAdmin'].value;
    this.createActivities.isExternal = this.activitiesForm.controls['isExternal'].value;
    this.createActivities.isInBatch = this.activitiesForm.controls['isInBatch'].value;
    this.createActivities.activityCategoryId = this.activitiesForm.controls['activityCategoryId'].value;
    this.createActivities.isDiabetic = this.activitiesForm.controls['isDiabetic'].value;
    this.createActivities.isForLater = this.activitiesForm.controls['isForLater'].value;
    this.createActivities.canAutoAllocate = this.activitiesForm.controls['canAutoAllocate'].value;
    this.createActivities.isRecurring = this.activitiesForm.controls['isRecurring'].value;
    this.createActivities.description = this.activitiesForm.controls['description'].value;
    this.createActivities.destinationId = this.activitiesForm.controls['locationId'].value;
    this.createActivities.activitySubTypeId = this.activitiesForm.controls['activitySubTypeId'].value;
    this.createActivities.isIssue = this.activitiesForm.controls['isIssue'].value;
    this.createActivities.roleIds = this.activitiesForm.controls['roleIds'].value;
    this.createActivities.departmentIds = this.activitiesForm.controls['departmentIds'].value;
    this.createActivities.priorityLevelId = this.activitiesForm.controls['priorityLevel'].value;

    if (this.activitiesForm.controls['locationId'].value == '') {
      this.createActivities.destinationId = null;
    }
    this.configurationService.saveActivities(this.createActivities).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
        res.results['dataType'] = 'create';
        res.results['nonType'] = 'create'
        this.activityData = res.results
        if(this.activityRuleData.length){
          let identifiyingId = res.results.id
          this.saveActivityRule(identifiyingId)
        }
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }
  updateActivity(type?: string) {
    const duration: string = this.activitiesForm.controls['duration'].value;
    if (duration) {
    const [hrs, mins] = duration.split(':').map(Number);
    this.totalMinutes = hrs * 60 + mins;
    }
    this.editActivities = new EditActivities(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    if (type !== 'duplicate') {
      this.editActivities.id = this.data.id;
      this.editActivities.name = this.activitiesForm.controls['name'].value;
    } else {
      this.editActivities.name = this.activitiesForm.controls['name'].value + ' (copy)';
    }
    this.editActivities.routineTypeId = this.activitiesForm.controls['routineTypeId'].value;
    this.editActivities.inchargeType = this.activitiesForm.controls['inchargeType'].value;
    if (this.inchargeId !== null) {
      this.editActivities.inchargeId = this.inchargeId;
    } else {
      this.editActivities.inchargeId = this.activitiesForm.controls['inchargeId'].value;
    }
    this.editActivities.minDuration = this.totalMinutes;
    if (this.activitiesForm.controls['isActive'].value == 'ST-AT') {
      this.editActivities.isActive = true;
    } else {
      this.editActivities.isActive = false;
    }
    this.editActivities.sequence = parseInt(this.activitiesForm.controls['sequence'].value);
    this.editActivities.priority = parseInt(this.activitiesForm.controls['priority'].value);
    this.editActivities.activityGroupId = this.activitiesForm.controls['activityGroupId'].value;
    this.editActivities.allowPartial = this.activitiesForm.controls['allowPartial'].value;
    this.editActivities.minInterval = parseInt(this.activitiesForm.controls['minInterval'].value);
    this.editActivities.gender = this.activitiesForm.controls['gender'].value;
    this.editActivities.autoComplete = this.activitiesForm.controls['autoComplete'].value;
    this.editActivities.isAdmin = this.activitiesForm.controls['isAdmin'].value;
    this.editActivities.isExternal = this.activitiesForm.controls['isExternal'].value;
    this.editActivities.isInBatch = this.activitiesForm.controls['isInBatch'].value;
    this.editActivities.activityCategoryId = this.activitiesForm.controls['activityCategoryId'].value;
    this.editActivities.isDiabetic = this.activitiesForm.controls['isDiabetic'].value;
    this.editActivities.isForLater = this.activitiesForm.controls['isForLater'].value;
    this.editActivities.description = this.activitiesForm.controls['description'].value;
    this.editActivities.canAutoAllocate = this.activitiesForm.controls['canAutoAllocate'].value;
    this.editActivities.isRecurring = this.activitiesForm.controls['isRecurring'].value;
    this.editActivities.activitySubTypeId = this.activitiesForm.controls['activitySubTypeId'].value;
    this.editActivities.isIssue = this.activitiesForm.controls['isIssue'].value;
    this.editActivities.roleIds = this.activitiesForm.controls['roleIds'].value;
    this.editActivities.departmentIds = this.activitiesForm.controls['departmentIds'].value;
    this.editActivities.priorityLevelId = this.activitiesForm.controls['priorityLevel'].value;
    if (this.locationId !== null) {
      this.editActivities.destinationId = this.locationId;
    } else {
      this.editActivities.destinationId = this.activitiesForm.controls['locationId'].value;
    }
    if (this.activitiesForm.controls['locationId'].value == '') {
      this.editActivities.destinationId = null;
    }
    if (this.pfWorkDeletData.length) {
      this.pfworkflowData.push(...this.pfWorkDeletData);
    }
     if (this.pfworkflowData.length) {
      this.pfworkflowData.forEach(item => {
        item['entityId'] = this.data?.id ?? null;
        item['entityType'] = "pf_activity"; 
        item['entityStatusId'] = item['entityStatusId'] ?? null;
        item['identifyingType'] = item['identifyingType'];
        item['identifyingId'] = item['identifyingId'];
        item['workflowLevelId'] = String(item['workflowLevelId']);
        item['description'] = item['description'];
        item['isActive'] = item['isActive'] === false ? false : true;   
        delete item['channelName']  
      })
    }
    if (type === 'duplicate') {
      this.configurationService.saveActivities(this.editActivities).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
    else {
      if (this.pfworkflowData.length && this.selectedTabIndex === 3) {
        if (this.pfWorkDeletData.length) {
          this.pfworkflowData = [...this.pfWorkDeletData];
        }
        this.commonService.saveWorkflowbyEntity(this.pfworkflowData).subscribe(res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', `${res.message}`);
          this.thisDialogRef.close('confirm');
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        }); 
      }
      this.configurationService.updateActivities(this.editActivities).subscribe(result => {
        if (result.statusCode === 1) {
          this.toastr.success('Success', `${result.message}`);
          this.thisDialogRef.close('confirm');
          result.results['dataType'] = 'update';
          this.activityData = result.results
        }
      },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
    }
  }

  getActivityByLink(){
    this.configurationService.getRuleLinkActivity( this.data.id, 'pf_Activity').subscribe(res =>{
      this.activityRuleData = res.results
    })
  }

  triggerAction(event) {
    if (event.key === 'edit') {
      const index = this.activityRuleData.indexOf(event.data);
      this.openActivityRule(event.data, index)
    }
  }

  openActivityRule(data, index?){
    if(data === '') {
      data = {
        type: this.activitiesForm.controls['activitySubTypeId'].value,
        modeType: 'create',
        identifyingType: 'pf_activity',
        identifyingId: this.data ? this.data.id : null,
        view: 'pfActivity'
      }
    } else {
       data['modeType'] = 'modify';
       data['type'] = this.activitiesForm.controls['activitySubTypeId'].value;
       data['view'] = 'pfActivity'
    }
    const dialogRef = this.dialog.open(CreateActivityRuleComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(res => {
      if (res.results) {
        if (index !== undefined && index !== -1) {
          this.activityRuleData[index] = {
            ...this.activityRuleData[index],
            ...res.results
          };
        } else {
          this.activityRuleData.push(res.results)
        }
        this.activityRuleData = [...this.activityRuleData]
        if(this.data.id){
          this.getActivityByLink()
        }
      }
    });
  }

  saveActivityRule(identifyingId) {
    this.activityRule = this.activityRuleData.map(item => new ManageActivityRule(
      item.activityId,
      item.ruleActivityId,
      item.config,
      item.duration,
      identifyingId,
      item.identifyingType,
      item.ruleGroupNo,
      item.stepType,
      item.type,
      item.isActive,
      item.description,
      item.isInclude
    ));
    this.commonService.saveActivityRule(this.activityRule).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }


  getRecipientName(type) {
    this.matrixForm.get('appdepartmentId').reset();
    this.matrixForm.get('recipientName').reset();
    if (type) {
      this.commonService.getAllDepartments().subscribe(res => {
        this.departmentappList = res.results.map(res => ({ ...res, code: res.id, value: res.name }));
      });
      this.userNameList = [];
      this.commonService.getRecipientNamelist(null, type).subscribe(res => {
        this.recepientListItems = res?.results?.filter(res => res.name != null);
        this.userNameList = this.recepientListItems;
        this.recipientEnabled = true;
      });
    } else {
      this.departmentList = [];
    }
  }

  searchUserNamelistmatrix(event) {
    if (this.matrixForm.controls['recipientType'].value !== null) {
      this.recipientEnabled = false;
      let recipient = this.matrixForm.controls['recipientType'].value;
      let departmentIds = this.matrixForm.get('appdepartmentId').value ?? null;
      let serachText = event.text;
      this.userNameList = [];
      if (serachText.length >= 2) {
          if (departmentIds) {
            let recipientType = recipient === 'RT-RO' ? 'Role' : 'User';
            this.commonService.getUserRollDepartment(serachText, departmentIds, recipientType).subscribe(res => {
              this.userNameList = res.results.map(res => ({ ...res, id: res.id, name: res.entityName }));
              this.recepientListItems = this.userNameList;
              this.recipientEnabled = true;
            });
          } else {
            this.commonService.getRecipientNamelist(serachText, recipient).subscribe(res => {
              this.recepientListItems = res.results;
              this.userNameList = this.recepientListItems;
              this.recipientEnabled = true;
            });
          }
      }
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }

  getUsername(selectedUserId) {
    if (selectedUserId) {
      let selectedUser = this.userNameList?.find(res => res.id == selectedUserId);
      return selectedUser? selectedUser.name : '';
    } else {
      return '';
    }
  }

  addApprovelData() {
    let userData = null;
    if (typeof this.matrixForm.get('recipientName').value === 'string') {
      const rawRecipient = this.matrixForm.get('recipientName').value;
      const recipient = rawRecipient?.replace(/\s+/g, '');
      userData = this.userNameData?.find(x => x?.name?.trim() && x.name.replace(/\s+/g, '') === recipient);
    } else {
      userData = this.userNameList?.find(x => x.id === this.matrixForm.get('recipientName').value);
    }
    const channelData = this.channelList?.find(x => x.code === this.matrixForm.get('channelId').value);
    const entitystatus = this.requestStatusList?.find(x => x.code === this.matrixForm.get('entityStatusId').value);
    const departmentInfo = this.departmentappList?.find(x => x.code === this.matrixForm.get('appdepartmentId').value);
    const recipitentType =  this.recipientTypeList?.find(x => x.code === this.matrixForm.get('recipientType').value);
    const type = this.matrixForm.get('recipientType')?.value;
    let request = {
      'identifyingType': recipitentType.code,
      'identifyingTypeName' : recipitentType.value,
      'identifyingValue': type === 'RT-EO' ? 'Requestor' : type === 'RT-OW' ? 'Owner' : userData?.entityName ?? userData?.name,
      'identifyingId': type !== 'RT-EO' && type !== 'RT-OW' ? userData?.entityId ?? userData?.id : null,
      'departmentId': departmentInfo?.code ?? null,
      'departmentName': departmentInfo?.value ?? null,
      "description": this.matrixForm.get('description').value,
      'workflowLevelId': this.matrixForm.get('level').value,
      'channelName': channelData?.value,
      'channelId': channelData?.code,
      'entityStatusId': entitystatus?.code,
      'entityStatusName':entitystatus?.value,
      'id': this.appEditData != null && this.appEditData != undefined && this.appEditData.hasOwnProperty('id') ? this.appEditData.id : null,
      'isActive': true,
      'options' : this.options ?? null
    }
    if (request != null && request != undefined) {
      if (this.appEditData != null && this.appEditData != undefined) {
        let index = null;
        if (this.appEditData.id != null && this.appEditData != undefined) {
          index = this.pfworkflowData.findIndex(x => x.id === this.appEditData.id);
        } else {
          index = this.pfworkflowData.findIndex(x => x.identifyingType === this.appEditData.identifyingType && x.channelId == this.appEditData.channelId &&
            x.entityStatusId == this.appEditData.entityStatusId && x.identifyingId == this.appEditData.identifyingId && x.workflowLevelId == this.appEditData.workflowLevelId);
        }
        if (index !== -1) {
          this.pfworkflowData[index] = request;
          this.pfworkflowData = [...this.pfworkflowData];
        }
      } else {
        this.pfworkflowData.push(request);
        this.pfworkflowData = [...this.pfworkflowData];
      }
    }
    this.pfworkflowData.sort((a, b) => a.workflowLevelId - b.workflowLevelId);
    this.appEditData = null;
    this.matrixForm.get('recipientType').reset();
    this.matrixForm.get('recipientName').reset();
    this.matrixForm.get('level').reset();
    this.matrixForm.get('description').reset();
    // this.matrixForm.get('channelId').reset();
    this.matrixForm.get('entityStatusId').reset();
    this.matrixForm.get('appdepartmentId').reset();
    this.matrixForm.get('approvalStatus').reset()
    this.matrixForm.get('approvalStatusType').reset();
    this.options = { 'status': {}};
    let appstatuslist = this.requestStatusList
    this.approvalStatusList = appstatuslist.filter(res => res.code === 'RQ-RTN' || res.code === 'RQ-WFA' || res.code === 'RQ-RJ');

  }
  approvelEditData(data) {
    this.options = { 'status': {}};
    const levelNumber = Number(data?.workflowLevelId);
    this.appEditData = data;
    let recipientName = null;
    const serachText = '';
    const recipient = this.appEditData.identifyingType;
     this.commonService.getAllDepartments().subscribe(res => {
        this.departmentappList = res.results.map(res => ({ ...res, code: res.id, value: res.name }));
      })
    if (data?.departmentId) {
      let recipientType = recipient === 'RT-RO' ? 'Role' : 'User';
      this.commonService.getUserRollDepartment(serachText, data?.departmentId, recipientType).subscribe(res => {
        this.userNameList = [];
        this.userNameList = res.results.map(res => ({ id: res.entityId, name: res.entityName }));
        this.userNameData = this.userNameList;
        this.recipientEnabled = true;
        if (res.statusCode === 1) {
          this.matrixForm.get('recipientName').setValue(recipientName);
        }
      });

    } else {
      this.commonService.getRecipientNamelist(serachText, recipient, data?.departmentId).subscribe(res => {
        this.userNameList = [];
        this.userNameData = res.results;
        this.userNameList = this.userNameData;
        this.recipientEnabled = true;
        if (res.statusCode === 1) {
          this.matrixForm.get('recipientName').setValue(recipientName);
        }
      })
    }
    
    if (data.hasOwnProperty('id') && data.id != null) {
      if (!this.isRecipient) {
        this.isRecipient = true;
        recipientName = data.identifyingValue;
      } else {
        recipientName = data.identifyingId != null && data.identifyingId != undefined ? data.identifyingId : data.identifyingId;
      }
    } else {
      recipientName = data.identifyingId;
    }
    this.options = data.options;
    const requestListData = this.requestStatusList;
    const allowedList = requestListData.filter(res => ['RQ-RTN', 'RQ-WFA', 'RQ-RJ'].includes(res.code));
    this.approvalStatusList = allowedList.filter(res => !Object.keys(this.options.status).includes(res.code));
    this.matrixForm.get('recipientType').setValue(data.identifyingType);
    this.matrixForm.get('recipientName').setValue(data.identifyingValue);
    this.matrixForm.get('level').setValue(levelNumber);
    this.matrixForm.get('description').setValue(data.description);
    this.matrixForm.get('channelId').setValue(data.channelId);
    this.matrixForm.get('entityStatusId').setValue(data.entityStatusId);
    this.matrixForm.get('appdepartmentId').setValue(data?.departmentId)
    if (this.isRecipient) {
      setTimeout(() => { this.getUsername(this.matrixForm.get('recipientName').value) }, 500);
    }
  }

  approvelDeleteData(data) {
    if (data.hasOwnProperty('id') && data.id != null && data.id != undefined) {
      const appDeleteData = this.pfworkflowData.filter(x => x.id === data.id).map(item => ({ ...item, isActive: false }));
      this.pfWorkDeletData.push(...appDeleteData);
      this.pfWorkDeletData = [...this.pfWorkDeletData];
      this.pfworkflowData = this.pfworkflowData.filter(x => x.id != data.id);
    } else {
      this.pfworkflowData = this.pfworkflowData.filter(x => !(x.identifyingType === data.identifyingType && x.identifyingId === data.identifyingId && x.channelId === data.channelId));
    }
    this.pfworkflowData = [...this.pfworkflowData];
  }

  eventAction(event) {
    let data = event.data;
    if (event.key === 'appEdit') {
      this.approvelEditData(data);
    } else if (event.key === "appDelete") {
      this.approvelDeleteData(data);
    }
  }
  
  getPfWorkflow() {
    this.commonService.getworkflowbyEntity('pf_activity', this.data?.id).subscribe((res) => {
      if (res.statusCode == 1) {
        this.pfworkflowData = res.results.filter(res => res.isActive).sort((a, b) => Number(a.workflowLevelId) - Number(b.workflowLevelId));
      }
    });
  }

  getDepartmentName(event) {
     this.matrixForm.get('recipientName').reset();
    if (event) {
      let recipientType = this.matrixForm.get('recipientType').value === 'RT-RO' ? 'Role' : 'User';
      this.commonService.getUserRollDepartment(null, event, recipientType).subscribe(res => {
        this.userNameList = res.results.map(res => ({...res, id: res.id, name: res.entityName}));
        this.recipientEnabled = true;
      });
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }
  
  invalidOptionValidator(control: any) {
    const value = control.value;
    if (value && typeof value === 'string') {
      return { invalidOption: true };
    }
    return null;
  }

  updateFormValidation(value) {
    const recipientNameCtrl = this.matrixForm.get('recipientName');
    const deptCtrl = this.matrixForm.get('appdepartmentId');

    if (value === 'RT-EO' || value === 'RT-OW') {
      recipientNameCtrl?.clearValidators();
      deptCtrl?.clearValidators();
      recipientNameCtrl?.setValue(null);
      deptCtrl?.setValue(null);
    } else {
      recipientNameCtrl?.setValidators([Validators.required]);
      deptCtrl?.setValidators([Validators.required]);
    }
    this. matrixForm.updateValueAndValidity();
  }

  getApprovalStatus(event) {
    if (event === 'RQ-RJ') {
      this.matrixForm.get('approvalStatusType').setValue('RQ-CA');
    } else if (event === 'RQ-RTN') {
      this.matrixForm.get('approvalStatusType').setValue('RQ-OP');
    } else if (event === 'RQ-WFA') {
      this.matrixForm.get('approvalStatusType').setValue('RQ-NEW');
    }
  }

  onAddStatus() {
    const approvalStatus = this.approvalStatusList.find(res => res.code === this.matrixForm.get('approvalStatus')?.value);
    const approvalStatusType = this.approvalStatusTypeList.find(res => res.code === this.matrixForm.get('approvalStatusType')?.value);
    const parentEntityStatus = this.parentEntityStatus?.find(res => res.code === this.matrixForm.get('parentEntityStatusId')?.value);
    const approvalStatusLevel = this.matrixForm.get('approvalStatusLevel')?.value;
    const isradiology = this.matrixForm.get('radiologyId')?.value;

    if (!approvalStatus || !approvalStatusType) return;

    this.options = this.options || { status: {} };

    if (this.options.status[approvalStatus.code]) {
      return;
    }

    if (!this.options) {
      this.options = { status: {} };
    }
    if (!this.options.status) {
      this.options.status = {};
    }

    this.options.status[approvalStatus.code] = {
      entityStatus: approvalStatusType.code,
      level: approvalStatusLevel ?? null,
      isRadiology: isradiology,
      parentEntityStatus: parentEntityStatus?.code ?? null
    };
    if (this.data?.routineTypeId !== 'TAC-WOR') {
      delete this.options?.status[approvalStatus.code]?.parentEntityStatus;
    }
    const requestListData = this.requestStatusList;

    const allowedList = requestListData.filter(res => ['RQ-RTN', 'RQ-WFA', 'RQ-RJ'].includes(res.code));

    this.approvalStatusList = allowedList.filter(res => !Object.keys(this.options.status).includes(res.code));

    this.matrixForm.get('approvalStatus')?.reset();
    this.matrixForm.get('approvalStatusType')?.reset();
    this.matrixForm.get('approvalStatusLevel')?.reset();
    this.matrixForm.get('parentEntityStatusId')?.reset();
    this.matrixForm.get('radiologyId')?.reset();

  }

  clearOptions() {
    this.options = { 'status': {}};
    const requestListData = this.requestStatusList;
    const allowedList = requestListData.filter(res => ['RQ-RTN', 'RQ-WFA', 'RQ-RJ'].includes(res.code));
    this.approvalStatusList = allowedList;
  }

  formatMappings(): string {
    if (!this.options?.status) return '';
    return Object.entries(this.options.status)
      .map(([key, val]: any) => {
        const status = val?.status ?? '';
        const level = val?.level != null ? ` (L${val.level})` : '';
        return `${key} → ${status}${level}`;
      }).join(', ');
  }

  hasStatusOptions(){
    return !!this.options?.status && Object.keys(this.options.status).length > 0;
  }

  handleDocumentEvent(event) {
    this.attachFiles = [];
    const files = event.attachFiles;
    if (files?.length) {
      this.attachFiles = files.filter(item => item.attachmentId == null).map(item => ({
        ...item,
        entityId: this.data?.id ?? null,
        entityType: 'PfActivity',
        parentId: null,
        parentType: null
      }));
      this.commonService.saveFile(this.attachFiles).subscribe({
        next: (res) => {
          this.toastr.success('Success', `${res.message}`);
        },
        error: (err) => {
          this.toastr.error('Error', `${err.message}`);
        }
      })
    }
  }

}
