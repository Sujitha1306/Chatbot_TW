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
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigurationService, CommonService, DashboardService } from '../../../../shared';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { CreateAlertRule, EditAlertRule } from '../../configuration.model';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { LookupTermService } from '../../../../shared/lookup-term.service';

@Component({
  selector: 'app-create-new-alert-config',
  templateUrl: './create-new-alert-config.component.html',
  styleUrls: ['./create-new-alert-config.component.scss']
})
export class CreateNewAlertConfigComponent implements OnInit {

  public alertRuleForm: FormGroup;
  public createAlertRule: CreateAlertRule;
  public editAlertRule: EditAlertRule;
  public ipStatic = true;
  public matcher = new ErrorStateMatcherService();
  public isDisabled = false;
  public removedAlertConfig = [];
  public ruleTypes: Array<any> = [];
  public alertTypes: Array<any> = [];
  public tagTypeList: Array<any> = [];
  public Gender: Array<any> = [];
  alertConfigRecipients: Array<any>;
  alertConfigRecipientsLocal: any;
  alertConditions: Array<any>=[];
  alertConditionsLocal: any;
  selectedIndex = 0;
  userNameList: any;
  firstName: any;
  id: any;
  RuleAssociate: any;
  EscalationType: any;
  locationList: any;
  rule: any;
  createAlertConfig: any = [];
  createAlert = false;
  public scope_id: any;
  public tag_type_id: any;
  public dynamicFields: any;
  public visit_type: any;
  public visit_event_type: any;
  public location_category: any;
  public event_type: any;
  public location_id: any = [];
  public location_type: any;
  public recipientType: any;
  public channelType: any;
  public pfRuleid = null;
  scopeDetails: any;
  addScopeDetailsCreate: any = [];
  dataFormat: string[];
  selectedTab: any;
  recipient_type: any;
  public alertConfigAidEvent: Array<any>;
  serachText = null;
  recipient = null;
  recipientEnabled = false;
  messageLabel: string;
  messageExist = false;
  public autoClose = [{ code: 'Y', value: 'Yes' }, { code: 'N', value: 'No' }];
  alertName = null;
  alertTypeId = null;
  scopeId = null;
  messageFormat = null;
  params: any;
  value: any;
  locationIdEnabled = false;
  aidDataFormat: any = [];
  pfRule: any = [];
  recipientId: any;
  locationName = null;
  locationId = null;
  removedAlertEscalation: any = [];
  locDetailId = null;
  locDetailType = null;
  removeAidList: any;
  removedAid: any = [];
  requireLocationMatchVal: any = [];
  configDataFormat: any = [];
  movement_type: any = [];
  movementType: any;
  rule_alert_type: any;
  notificationId: any = [];
  deviceDataFormat: any = [];
  removeDeviceList: any = [];
  removedDevice: any = [];
  deviceTypeOption: any = [];
  alertConfigDevice: any = [];
  eventType = null;
  locationType = null;
  outLocationType = null;
  config = {};
  routine_type: any;
  routineType: any;
  routine_alert_type: any;
  routineList: any;
  routine_activityList: any;
  activityList: any;
  isActivity = true;
  isRoutine = true;
  sosAidList: any;
  sosAidOption: any = [];
  locationListItems: any = [];
  recepientListItems: any = [];
  porter_alert_type: any = [];
  porterAlertType: any;
  request_status: any;
  request_type: any;
  visit_status: any;
  queue_status: any;
  recepientFields: any;
  createRecipient: string[];
  disableRecipientType = ["RT-EO","RT-EOSP","RT-EP","RT-EPSP","RT-AS","RT-OW","RT-PRL"];
  roleList: any=[];
  role = 0;
  aidLocationId = null;
  popWidth: any;
  popHeight: any;
  contentHeight: number;
  dqType: any;
  dq_roleList: any=[];
  dq_status: any;
  dq_type: any;
  dq_sub_type: any;
  category_type: any;
  pool_loc_cat: any;
  service_grp: any;
  dq_event_type: any;
  dq_routineList: any;
  dq_activity_groupList: any;
  dq_activityList: any;
  audio_fileList: any;
  audio_volumeList: any;
  audio_loopList: any;
  public audio = new Audio();
  asset_type_idList: any;
  tag_idList: any;
  assetTagIds: any=[];
  tag_idListItems: any=[];
  alert = [];
  dynamicForm = false;
  templateList: any=[];
  recipient_typeList: any;
  alerNoticationData: any[] = [];
  channelName = [];
  templateName = [];
  alerDisplayColumn = ['Channel Name', 'Template Name' ,'Identifying Type', 'Identifying Name', 'Delete'];
  alerDataColumns = ['channelName', 'name', 'identifyingTypeName', 'identifyingName', 'AlertDelete'];
  checkTemplate: any[];
  recipitentTypeName: any;
  selectedRecipientNameId = null;
  pool_loc_catList = [];
  serviceExist = false;
  poolLoc = false;
  category = null;
  modelList = [];
  activityPcList: any = [];

  constructor(
    public form: FormBuilder, public toastr: AppToastService, public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateNewAlertConfigComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationServices: ConfigurationService, private readonly commonService: CommonService, public cdRef:ChangeDetectorRef,
    private readonly dashboardService: DashboardService, private readonly lookupService: LookupTermService) {
  }

  ngOnInit() {

    this.dashboardService.getAllModals().subscribe(res => {
      if (res.statusCode === 1) {
          this.modelList = res.results;
          this.modelList = this.modelList.filter(val => val.actionType == 'Notify')
          this.modelList = this.commonService.sortByKey(this.modelList, 'name');
      }
    });

    this.configurationServices.getAllPfRules().subscribe(res => {
      this.ruleTypes = res.results;
    });

    this.configurationServices.getRecipientName('', 'RT-RO', null, null, null, true).subscribe(res => {
      this.roleList = res.results;
      this.dq_roleList = res.results;
    });

    this.configurationServices.getAllActivities(null, null, 'TAC-PC').subscribe(res => {
      this.activityPcList = res.results;
    });

    this.commonService.getAllLocationType().subscribe(res => {
      this.location_type = res.results;
    });

    this.commonService.getHealthPlanLocations().subscribe(res => {
      this.locationList = res.results;
    });
  
    if (this.data.routineTypeId !== null) {
      this.getRoutineType(this.data.routineTypeId);
    }
    this.getDataTypes();
    this.buildForm();
  }

  filterAssetTagId() {
    this.assetTagIds = [];
    const assetTypes = this.alertRuleForm.controls['asset_type_id'].value;
    if(assetTypes !== null && assetTypes.length !== 0) {
      for(let asset of assetTypes) {
        this.assetTagIds.push(this.tag_idListItems.filter(x => x.additionalInfo.assetType === asset))
      }
      this.tag_idList = this.assetTagIds[0];
    } else {
      this.tag_idList = this.tag_idListItems;
    }
  }

  onWindowResizedWidth(size) {
    this.popWidth = size - 50;
  }

  onWindowResized(size) {
    this.popHeight = size - 10;
    this.contentHeight = size - 250;
  }

  getAlertConfig(id: string): void {
    this.initializeDefaults(id);

    const ruleTypeId = this.pfRule[0]?.ruleTypeId;
    const ruleCategoryId = this.pfRule[0]?.ruleCategoryId;
    if(ruleTypeId === 'RU-NC') {
      this.disableRecipientType.push('RT-PA')
    } else {
      this.disableRecipientType.filter(x => x !== 'RT-PA');
    }
    this.alertRuleForm.get('pfModelId')?.setValidators(ruleCategoryId === 'RC-API' ? Validators.required : null);
    this.alertRuleForm.get('pfModelId')?.updateValueAndValidity();

    const isStaticRule = ['RU-SC', 'RU-SE', 'RU-DEF', 'RU-GO', 'RU-TD', 'RU-DA', 'RU-WO'].includes(ruleTypeId);

    if (isStaticRule) {
      this.handleStaticRules();
    } else if (this.params !== null) {
      this.handleDynamicRules();
    }
  }

  private initializeDefaults(id: string): void {
    this.messageExist = false;
    this.pfRule = this.ruleTypes.filter(res => res.id === id);
    this.alertName = this.alertRuleForm.controls['name'].value;
    this.alertTypeId = this.alertRuleForm.controls['alertTypeId'].value;
    this.pfRuleid = id;
    this.buildForm();

    this.createAlertConfig = [];
    this.addScopeDetailsCreate = [];
    this.configDataFormat = [];
    this.deviceDataFormat = [];
    this.aidDataFormat = [];

    this.alertRuleForm.patchValue({
      name: this.alertName,
      alertTypeId: this.alertTypeId,
      pfRuleid: this.pfRuleid
    });

    this.rule = false;
    this.createAlert = false;
    this.params = this.pfRule[0]?.params;
    this.alert = [];
  }

  private handleStaticRules(): void {
    this.alert = JSON.parse(this.params);
    console.log(this.alert)
    const recipient = this.alert['notification']['recipient_type']?.valid_link;
    this['recipient_typeList'] = this.recipient_type.filter(x => recipient.indexOf(x.code) !== -1);

    if (this.data?.alertConfigRecipients?.length > 0) {
      this.populateAlertRecipients();
    }

    if (this.data) {
      this.setMessageFormat(this.alert);
      this.formatAlertNotificationData();
    } else {
      this.setMessageFormat(this.alert, true);
    }
  }

  private handleDynamicRules(): void {
    this.rule = JSON.parse(this.params);
    
    if (this.rule.hasOwnProperty('create')) {
      this.setupDynamicFields();
      this.applyExistingDataToForm();
    } else if (this.isGatewayRule()) {
      this.setMessageFormat(this.rule, true);
      if (this.data) {
        this.buildForm();
        try {
          this.bindData();
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      this.rule = null;
      this.createAlert = false;
      this.createAlertConfig = null;
    }

    if (this.rule?.notification) {
      this.setRecipientFields(this.rule.notification);
    } else {
      const recipient = ['RT-RO', 'RT-US'];
      this.recipient_typeList = this.recipient_type.filter(x => recipient.includes(x.code));
    }
  }

  private populateAlertRecipients(): void {
    this.removeAlertEscalation(0, null);
    const control = <FormArray>this.alertRuleForm.controls['userList'];

    this.data.alertConfigRecipients.forEach((recipient, i) => {
      this.notificationId.push(recipient.pfAlertConfigRecipientId);

      Object.assign(this.data, {
        id: i,
        pfAlertConfigRecipientId: recipient.pfAlertConfigRecipientId,
        identifyingId: recipient.identifyingId,
        firstName: recipient.identifyingName,
        channelType: recipient.channel,
        templateId: null,
        recipient_type: recipient.identifyingType
      });

      control.push(this.editAlertRuleConfig(i));
    });
  }

  private formatAlertNotificationData(): void {
    if (this.data.alertConfigRecipients?.length) {
      this.alerNoticationData = this.data.alertConfigRecipients;
      this.alerNoticationData = [...this.alerNoticationData];
      this.alerDataColumns.forEach((col, i) => {
        this.alerNoticationData.forEach(data => {
          data[col] = col === 'name'
            ? data.channelTemplates?.[0]?.name || null
            : data[col];
        });
      });
    }
  }

  private setMessageFormat(obj: any, setFormControl: boolean = false): void {
    if (obj?.hasOwnProperty('message')) {
      this.messageExist = true;
      if (setFormControl) {
        this.alertRuleForm.controls['messageFormat'].setValue(obj.message.default);
      }
      const label = '<' + obj.message.valid_key.toString() + '>';
      this.messageLabel = label.replace(/,/g, '> <');
    } else {
      this.messageExist = false;
    }
  }

  private setupDynamicFields(): void {
    this.dynamicFields = this.rule['create'];
    this.createAlert = true;
    this.createAlertConfig = Object.keys(this.dynamicFields);

    this.createAlertConfig.forEach(key => {
      const field = this.dynamicFields[key];

      if (field?.valid_link) {
        this[`${key}List`] = this[key]?.filter(x => field.valid_link.includes(x.code || x.id)) || null;
      }

      if (field.mandatory === 'Y') {
        this.alertRuleForm.get(key).setValidators(Validators.required);
      } else if (key === 'location_id') {
        this.alertRuleForm.get(key).setValidators(this.requireLocationMatch.bind(this));
      } else {
        this.alertRuleForm.get(key).clearValidators();
      }
      this.alertRuleForm.get(key).updateValueAndValidity();

      this[`${key}Multiple`] = field.max === null;
    });
  }

  private applyExistingDataToForm(): void {
    if (this.data?.pfRuleid === this.pfRuleid) {
      const typeId = this.data.ruleAlertTypeId || this.data.routineTypeId || this.data.porterAlertTypeId || this.data.dqTypeId || this.data.scopeId;

      if (typeId) {
        this.alertRuleForm.controls[this.getScopeControlName()].setValue(typeId);
        this.getScopeDetails(typeId);
      }

      this.setMessageFormat(this.rule);
    } else {
      this.setMessageFormat(this.rule, true);
    }
  }

  private getScopeControlName(): string {
    if (this.data.ruleAlertTypeId) return 'rule_alert_type';
    if (this.data.routineTypeId) return 'routine_type';
    if (this.data.porterAlertTypeId) return 'porter_alert_type';
    if (this.data.dqTypeId) return 'dq_type';
    return 'scope_id';
  }

  private setRecipientFields(fields: any): void {
    this.recepientFields = fields;
    this.createRecipient = Object.keys(fields);

    this.createRecipient.forEach(key => {
      const field = fields[key];
      if (field?.valid_link) {
        this[`${key}List`] = this[key]?.filter(x => field.valid_link.includes(x.code || x.id)) || null;
      }
    });
  }

  private isGatewayRule(): boolean {
    return ['Gateway', 'RU-WA'].includes(this.pfRule[0]?.ruleName) || ['Gateway', 'RU-WA'].includes(this.data?.pfRuleName || this.data?.ruleTypeId);
  }

  getDQAlertData(type) {
    if ( this.alertRuleForm.controls.dq_type.value === 'DQAT-RQ' && type === 'RQT-OT') {
      this.alertRuleForm.get('category_type').setValidators(null);
      this.alertRuleForm.get('category_type').setValue(null);
      this.alertRuleForm.get('category_type').updateValueAndValidity();
    } else if ( this.alertRuleForm.controls.dq_type.value === 'DQAT-RQ' && type !== 'RQT-OT'){
      this.alertRuleForm.get('category_type').setValidators(Validators.required);
      this.alertRuleForm.get('category_type').updateValueAndValidity();
      this.alertRuleForm.get('dq_activity_group').setValue(null);
      this.alertRuleForm.get('dq_activity_group').setValidators(null);
      this.alertRuleForm.get('dq_activity_group').updateValueAndValidity();
      this.alertRuleForm.get('dq_activity').setValue(null);
      this.alertRuleForm.get('dq_activity').setValidators(null);
      this.alertRuleForm.get('dq_activity').updateValueAndValidity();
    }
    if(type === 'RQT-OT') {
      this.configurationServices.getAlertRoutineActivity('ACTIVITY_GROUP', null).subscribe(res => {
        this.dq_activity_groupList = res.results;
      });
      this.configurationServices.getAlertRoutineActivity('ACTIVITY', null).subscribe(res => {
        this.dq_activityList = res.results;
      });
    }
    if(this.alertRuleForm.controls['dq_type'].value === 'DQAT-RQ') {
      if(type === 'RQT-NC') {
        this['category_typeList'] = this.category_type.filter(x => x.groupName === 'CallEvent');
      } else if(type === 'RQT-PO') {
        this['category_typeList'] = this.category_type.filter(x => x.groupName === 'PorterRequestType');
      } else if(type === 'RQT-TKT') {
        this['category_typeList'] = this.category_type.filter(x => x.groupName === 'AssetMaintenanceType');
      }
      else {
        this['category_typeList'] = [];
      }  
    }
    if(this.alertRuleForm.controls.dq_type.value === 'DQAT-HP') {
      this.configurationServices.getAlertHealthPackage(type).subscribe(res => {
        this.dq_routineList = res.results;
      });
    } else if(this.alertRuleForm.controls.dq_type.value === 'DQAT-RU') {
      this.configurationServices.getAlertRoutine(type).subscribe(res => {
        this.dq_routineList = res.results;
      });
    } else {
      this.dq_routineList = [];
    }
    this.getDQTestActivity(null);
  }
  getDQEvent(value) {
    if((value.indexOf('PR-SE') > -1) === true && (value.indexOf('PR-OT') > -1) === false) {
      this.category = 'PR-SE';
      this.serviceExist = true;
      this.poolLoc = true;
      this.pool_loc_catList = [];
      this.alertRuleForm.get('service_grp').setValidators(Validators.required);
      this.alertRuleForm.get('service_grp').updateValueAndValidity();
      this.alertRuleForm.get('pool_loc_cat').setValidators(Validators.required);
      this.alertRuleForm.get('pool_loc_cat').updateValueAndValidity();
      this.lookupService.getAppTermsLinkWrapper('PR-SE').subscribe((res) => {
        this.pool_loc_catList = res.PoolLocation ?? [];
      });
    } else if((value.indexOf('PR-OT') > -1) === true && (value.indexOf('PR-SE') > -1) === false) {
      this.category = 'PR-OT';
      this.poolLoc = true;
      this.pool_loc_catList = [];
      this.alertRuleForm.get('pool_loc_cat').setValidators(Validators.required);
      this.alertRuleForm.get('pool_loc_cat').updateValueAndValidity();
      this.lookupService.getAppTermsLinkWrapper('PR-OT').subscribe((res) => {
          this.pool_loc_catList = res.PoolLocation ?? [];
      });
    } else {
      this.category = null;
      this.serviceExist = false;
      this.poolLoc = false;
      this.pool_loc_catList = [];
      this.alertRuleForm.get('service_grp').setValue(null);
      this.alertRuleForm.get('service_grp').setValidators(null);
      this.alertRuleForm.get('service_grp').updateValueAndValidity();
      this.alertRuleForm.get('pool_loc_cat').setValue(null);
      this.alertRuleForm.get('pool_loc_cat').setValidators(null);
      this.alertRuleForm.get('pool_loc_cat').updateValueAndValidity();
    }
    if(value === 'DQCT-EV') {
      this.alertRuleForm.get('dq_event_type').setValue(null);
      this.alertRuleForm.get('dq_event_type').setValidators(Validators.required);
      this.alertRuleForm.get('dq_event_type').updateValueAndValidity();
      this.alertRuleForm.get('dq_routine').setValue(null);
      this.alertRuleForm.get('dq_routine').setValidators(null);
      this.alertRuleForm.get('dq_routine').updateValueAndValidity();
      this.alertRuleForm.get('dq_activity_group').setValue(null);
      this.alertRuleForm.get('dq_activity_group').setValidators(null);
      this.alertRuleForm.get('dq_activity_group').updateValueAndValidity();
      this.alertRuleForm.get('dq_activity').setValue(null);
      this.alertRuleForm.get('dq_activity').setValidators(null);
      this.alertRuleForm.get('dq_activity').updateValueAndValidity();
    } else {
      this.alertRuleForm.get('dq_event_type').setValue(null);
      this.alertRuleForm.get('dq_event_type').setValidators(null);
      this.alertRuleForm.get('dq_event_type').updateValueAndValidity();
    }
  }
  openedChange(isOpended)
  {
    if(!isOpended)
    {
      const value = this.alertRuleForm.get('dq_routine').value;
      this.getDQTestActivity(value);
    }
  }
  getDQTestActivity(id?: number) {
    if(this.alertRuleForm.controls.dq_type.value === 'DQAT-HP') {
      this.configurationServices.getAlertHealthTests('health_test_group',id).subscribe(res => {
        this.dq_activity_groupList = res.results;
      });
      this.configurationServices.getAlertHealthTests('health_test',id).subscribe(res => {
        this.dq_activityList = res.results;
      });
    } else if(this.alertRuleForm.controls.dq_type.value === 'DQAT-RU') {
      this.configurationServices.getAlertRoutineActivity('ACTIVITY_GROUP', id).subscribe(res => {
        this.dq_activity_groupList = res.results;
      });
      this.configurationServices.getAlertRoutineActivity('ACTIVITY', id).subscribe(res => {
        this.dq_activityList = res.results;
      });
    } else if(this.alertRuleForm.controls.dq_sub_type.value === 'RQT-OT') {
      this.configurationServices.getAlertRoutineActivity('ACTIVITY_GROUP', null).subscribe(res => {
        this.dq_activity_groupList = res.results;
      });
      this.configurationServices.getAlertRoutineActivity('ACTIVITY', null).subscribe(res => {
        this.dq_activityList = res.results;
      });
    }
  }
  
  getScopeDetails(code) {
    const controls = this.alertRuleForm.controls;
    const values = {
      ruleAlertType: controls['rule_alert_type'].value,
      porterAlertType: controls['porter_alert_type'].value,
      dqType: controls['dq_type'].value,
      routineType: controls['routine_type'].value,
      name: controls['name'].value,
      alertTypeId: controls['alertTypeId'].value,
      pfRuleid: controls['pfRuleid'].value,
      messageFormat: controls['messageFormat'].value,
    };

    const noTypesSelected = !values.ruleAlertType && !values.porterAlertType && !values.dqType && !values.routineType;
    this.scopeId = noTypesSelected ? code : null;

    this.alertName = values.name;
    this.alertTypeId = values.alertTypeId;
    this.pfRuleid = values.pfRuleid;
    this.movementType = values.ruleAlertType;
    this.routineType = values.routineType;
    this.porterAlertType = values.porterAlertType;
    this.dqType = values.dqType;
    this.messageFormat = values.messageFormat;
    this.scopeDetails = null;

    if (code === null) return;

    this.buildForm();

    const data = this.data;
    const isScopeChanged =
      (!data.ruleAlertTypeId && !data.routineTypeId && !data.porterAlertTypeId && !data.dqTypeId && data.scopeId !== code) ||
      (data.ruleAlertTypeId && data.ruleAlertTypeId !== code) ||
      (data.routineTypeId && data.routineTypeId !== code) ||
      (data.porterAlertTypeId && data.porterAlertTypeId !== code) ||
      (data.dqTypeId && data.dqTypeId !== code);

    if (isScopeChanged) this.alertRuleForm.reset();

    this.initializeScopeFlagsAndValidators(code);

    if (!this.scopeDetails?.length) return;

    this.addScopeDetailsCreate = Object.keys(this.scopeDetails[0]);
    this.processScopeDetails(code);

    this.getScopeId(data?.scopeId ?? this.scopeId);

    if (
      data?.scopeId === code ||
      data?.ruleAlertTypeId === code ||
      data?.routineTypeId === code ||
      data?.porterAlertTypeId === code ||
      data?.dqTypeId === code
    ) {
      this.bindData();
    }
  }

  private initializeScopeFlagsAndValidators(code: any): void {
    this.addScopeDetailsCreate = [];
    this.deviceDataFormat = [];
    this.configDataFormat = [];
    this.deviceTypeOption = [];
    this.aidDataFormat = [];
    this.sosAidOption = [];
    this.isActivity = true;
    this.isRoutine = true;

    const controls = this.alertRuleForm.controls;
    this.alertRuleForm.get(this.createAlertConfig).setValidators(Validators.required);
    this.alertRuleForm.get(this.createAlertConfig).updateValueAndValidity();

    controls['name'].setValue(this.alertName);
    controls['alertTypeId'].setValue(this.alertTypeId);
    controls['pfRuleid'].setValue(this.pfRuleid);
    controls['scope_id'].setValue(this.scopeId);
    controls['rule_alert_type'].setValue(this.movementType);
    controls['routine_type'].setValue(this.routineType);
    controls['porter_alert_type'].setValue(this.porterAlertType);
    controls['dq_type'].setValue(this.dqType);
    controls['messageFormat'].setValue(this.messageFormat);
    controls['close'].setValue('Y');

    this.createAlert = true;

    this.scopeDetails = this.dynamicFields['scope_id']?.scope_details ??
      this.dynamicFields['rule_alert_type']?.scope_details ??
      this.dynamicFields['routine_type']?.scope_details ??
      this.dynamicFields['porter_alert_type']?.scope_details ??
      this.dynamicFields['dq_type']?.scope_details ??
      null;

    if (this.scopeDetails) {
      this.scopeDetails = this.scopeDetails.filter(res => res.scope_ids.includes(code));
    }
  }

  private processScopeDetails(code: any): void {
    for (const detail of this.addScopeDetailsCreate) {
      const detailConfig = this.scopeDetails[0][detail];
      if (!detailConfig) continue;

      this.applyValidLinkFilter(detail, detailConfig);
      this.applyValidatorsAndMultiplicity(detail, detailConfig);
      this.applyDataFormat(detail, detailConfig);
      this.applyInitialValue(detail, detailConfig);
    }

    this.cleanDeviceListIfEmpty();
  }

  private applyValidLinkFilter(detail: string, config: any): void {
    if (!('valid_link' in config)) return;

    const sourceList = this[detail];
    this[detail + 'List'] = sourceList
      ? sourceList.filter(x => config['valid_link'].includes(x.code ?? x.id))
      : null;
  }

  private applyValidatorsAndMultiplicity(detail: string, config: any): void {
    if ('mandatory' in config && 'max' in config) {
      this.setValidatorsForDetail(detail, config);
      this[detail + 'Multiple'] = config['max'] === null;
    }
  }

  private applyDataFormat(detail: string, config: any): void {
    if ('data-format' in config) {
      this.processDataFormat(detail, config['data-format']);
    }
  }

  private applyInitialValue(detail: string, config: any): void {
    if ('value' in config) {
      this.alertRuleForm.controls[detail].setValue(config['value'].toString());
    }
  }

  private cleanDeviceListIfEmpty(): void {
    if (this.deviceDataFormat.length <= 0) {
      const control = this.alertRuleForm.controls['deviceList'] as FormArray;
      control.removeAt(0);
    }
  }

  private setValidatorsForDetail(detail: string, config: any): void {
    const control = this.alertRuleForm.get(detail);

    if (config['mandatory'] === 'Y' && detail !== 'aid') {
      control.setValidators(Validators.required);
    } else if (detail === 'location_id') {
      control.setValidators(this.requireLocationMatch.bind(this));
    } else {
      control.setValidators(null);
    }

    control.updateValueAndValidity();
  }

  private processDataFormat(detail: string, formats: any[]): void {
    if (detail === 'sla_alert_config') {
      for (const format of formats) {
        this.configDataFormat.push(format);
        this.alertRuleForm.controls['sla_alert'].setValue(format.sla_time?.alert.alert_value);
        this.alertRuleForm.controls['sla_escalate'].setValue(format.sla_time.escalate?.escalate_value);
        this.alertRuleForm.controls['reminder_alert'].setValue(format.reminder_time.alert?.alert_value);
        this.alertRuleForm.controls['reminder_escalate'].setValue(format.reminder_time?.escalate.escalate_value);
        this.alertRuleForm.controls['prior_dur'].setValue(format.reminder?.value);
      }
    } else if (detail === 'tag_type_id') {
      for (const format of formats) {
        this.deviceDataFormat.push(format);
        const deviceListArray = this.alertRuleForm.get('deviceList') as FormArray;
        deviceListArray.controls[0].patchValue({ device_time: 1 });
      }
      const control = this.alertRuleForm.get(detail);
      control.setValidators(null);
      control.updateValueAndValidity();
    } else if (detail === 'aid') {
      for (const format of formats) {
        this.aidDataFormat.push(format);
      }
    }
  }

  bindData(): void {
    const recipients = this.data.alertConfigRecipients || [];

    if (recipients.length > 0) {
      this.prepareRecipientsList(recipients);
    }

    for (const alertCondition of this.data.alertConditions || []) {
      this.processAlertCondition(alertCondition);
    }
  }

  private prepareRecipientsList(recipients: any[]): void {
    this.alerNoticationData = recipients;
    const columnLength = Math.min(this.alerDataColumns.length, this.alerDisplayColumn.length);

    for (let i = 0; i < columnLength; i++) {
      const column = this.alerDataColumns[i];
      const displayColumn = this.alerDisplayColumn[i];
      recipients.forEach(data => {
        if (column === 'name') {
          const templateName = data.channelTemplates?.[0]?.name ?? null;
          data[column] = data[displayColumn] = templateName;
        } else {
          data[displayColumn] = data[column];
        }
      });
    }
    this.removeAlertEscalation(0, null);

    const control = this.alertRuleForm.controls['userList'] as FormArray;
    recipients.forEach((rec, i) => {
      this.notificationId.push(rec.pfAlertConfigRecipientId);
      Object.assign(this.data, {
        id: i,
        pfAlertConfigRecipientId: rec.pfAlertConfigRecipientId,
        identifyingId: rec.identifyingId,
        firstName: rec.identifyingName,
        channelType: rec.channel,
        templateId: null,
        recipient_type: rec.identifyingType
      });
      control.push(this.editAlertRuleConfig(i));
    });
  }

  private processAlertCondition(alertCondition: any): void {
    const { identifyingType, identifyingValue, identifyingNamePair, pfAlertConditionId } = alertCondition;
    const fieldKey = `${identifyingType}_ConditionId`;
    this[fieldKey] = pfAlertConditionId;

    const handlers = {
      'scope_id': () => this.setSimpleField(identifyingType, identifyingValue),
      'event_type': () => {
        this.setSimpleField(identifyingType, identifyingValue);
        this.eventType = identifyingValue;
        this.getEventType(this.eventType);
      },
      'routine_alert_type': () => {
        this.setSimpleField(identifyingType, identifyingValue);
        this.getRoutineAlertType(identifyingValue);
      },
      'dq_sub_type': () => {
        this.setSimpleField(identifyingType, identifyingValue);
        this.getDQAlertData(identifyingValue);
      },
      'dq_routine': () => {
        const value = JSON.parse(identifyingValue);
        this.setSimpleField(identifyingType, value);
        this.getDQTestActivity(value);
      },
      'routine': () => {
        const value = parseInt(identifyingValue, 10);
        this.setSimpleField(identifyingType, value);
        this.getRoutineActivities(value);
      },
      'device_config': () => this.handleDeviceConfig(identifyingValue),
      'aid_event': () => this.handleAidEvent(identifyingValue, identifyingNamePair),
      'location_id': () => this.handleLocation(identifyingNamePair),
      'location_type': () => this.handleLocationType(identifyingValue),
      'sla_alert': () => this.handleSlaAlert(identifyingValue),
      'prior_dur': () => this.setSimpleField(identifyingType, JSON.parse(identifyingValue)),
      'generate_task': () => this.setSimpleField(identifyingType, identifyingValue === 'Y'),
      'tag_id': () => this.setSimpleField(identifyingType, JSON.parse(identifyingValue)),
      'category_type': () => this.handleCategoryType(identifyingValue, identifyingType),
    };
    const handler = handlers[identifyingType];

    if (typeof handler === 'function') {
      handler();
    } else if (identifyingValue !== undefined && identifyingValue !== null) {
      try {
        this.setSimpleField(identifyingType, JSON.parse(identifyingValue));
      } catch (error) {
        console.warn(`Could not parse value for '${identifyingType}':`, identifyingValue);
      }
    }
  }

  private setSimpleField(field: string, value: any): void {
    this.value = value;
    this.alertRuleForm.controls[field].setValue(value);
  }

  private handleDeviceConfig(value: string): void {
    if (this.data.ruleAlertTypeId === 'RAT-DS' && value) {
      const devices = JSON.parse(value);
      this.removeDeviceList = devices;
      this.removeDevice(0, null);

      const deviceControl = this.alertRuleForm.controls['deviceList'] as FormArray;
      devices.forEach((device, index) => {
        Object.assign(this.data, {
          id: index,
          device_tag_type_id: device.tag_type_id,
          device_time: device.time
        });
        this.deviceTypeOption.push(device.tag_type_id);
        deviceControl.push(this.editDevice(index));
      });
    }
  }

  private handleAidEvent(value: string, namePair: any[]): void {
    if (!value) return;
    const aidDataList = JSON.parse(value);
    this.removeAidList = aidDataList;
    this.removeAid(0, null);

    const aidControl = this.alertRuleForm.controls['sosAidList'] as FormArray;
    aidDataList.forEach((aidData, index) => {
      Object.assign(this.data, { id: index });

      if (this.pfRule?.[0]?.ruleTypeId === 'RU-PC' && namePair?.length) {
        Object.assign(this.data, {
          sosAid: aidData.aid,
          aidLocationId: namePair[index]['id'],
          aidLocation: aidData.location_id
        });
      } else {
        Object.assign(this.data, {
          event: aidData.event_name,
          eventValue: aidData.event_value,
          sosAid: aidData.aid,
          role: aidData.role,
          activityId: aidData.activityId,
          audio_file: aidData.audio_file,
          audio_volume: aidData.audio_volume,
          audio_loop: aidData.audio_loop,
          auto_assign: aidData.auto_assign === 'Y',
          auto_complete: aidData.auto_complete === 'Y'
        });
        this.sosAidOption.push(aidData.event_name);
      }

      aidControl.push(this.editAid(index));
    });
  }

  private handleLocation(namePair: any[]): void {
    if (namePair?.[0]) {
      const location = namePair[0];
      this.locationId = location.id;
      this.locationName = location.name;
      this.alertRuleForm.controls['location_id'].setValue(this.locationName);
    }
  }

  private handleLocationType(value: string): void {
    if (value) {
      const parsed = JSON.parse(value);
      if (this.eventType === 'GET-OUT') {
        this.outLocationType = parsed[0];
        this.alertRuleForm.controls['out_location_type'].setValue(this.outLocationType);
      } else {
        this.locationType = parsed;
        this.alertRuleForm.controls['location_type'].setValue(this.locationType);
      }
    }
  }

  private handleSlaAlert(value: string): void {
    if (!value) return;
    const parsed = JSON.parse(value);
    if ('sla_time' in parsed) {
      this.alertRuleForm.controls['sla_alert'].setValue(parsed.sla_time.alert);
      this.alertRuleForm.controls['sla_escalate'].setValue(parsed.sla_time.escalate);
      this.alertRuleForm.controls['configSla'].setValue(true);
    }
    if ('reminder_time' in parsed) {
      this.alertRuleForm.controls['reminder_alert'].setValue(parsed.reminder_time.alert);
      this.alertRuleForm.controls['reminder_escalate'].setValue(parsed.reminder_time.escalate);
      this.alertRuleForm.controls['configReminder'].setValue(true);
    }
  }

  private handleCategoryType(value: string, type: string): void {
    if (value) {
      const dqType = this.alertRuleForm.controls['dq_type'].value;
      const parsed = dqType === 'DQAT-RQ' ? JSON.parse(value) : value;
      this.alertRuleForm.controls[type].setValue(parsed);
      this.getDQEvent(parsed);
    }
  }

  getScopeId(id) {
    if (!this.data) {
    this.alertRuleForm.controls['visit_type'].setValue(null);
    }
    if (id !== null && id === 'TAT-PA') {
      this.alertRuleForm.get('visit_type').setValidators(Validators.required);
      this.alertRuleForm.get('visit_type').updateValueAndValidity();
    } else {
      this.alertRuleForm.get('visit_type').setValidators(null);
      this.alertRuleForm.get('visit_type').updateValueAndValidity();
    }
  }
  getEventType(value) {
    if (value !== null) {
      this.alertRuleForm.get('location_category').setValue(null);
      this.alertRuleForm.get('location_id').setValue(null);
      if (value === 'GET-IN') {
        this.alertRuleForm.get('out_location_type').setValue(null);
        this.alertRuleForm.get('out_location_type').setValidators(null);
        this.alertRuleForm.get('out_location_type').updateValueAndValidity();
        this.alertRuleForm.get('location_type').setValidators(Validators.required);
        this.alertRuleForm.get('location_type').updateValueAndValidity();
      } else if (value === 'GET-OUT') {
        this.alertRuleForm.get('location_type').setValue(null);
        this.alertRuleForm.get('location_type').setValidators(null);
        this.alertRuleForm.get('location_type').updateValueAndValidity();
        this.alertRuleForm.get('out_location_type').setValidators(Validators.required);
        this.alertRuleForm.get('out_location_type').updateValueAndValidity();
      }
    }
  }
  validateRecipient(channel) {
    let recipientChannel = ['CH-EM', 'CH-FPN', 'CH-NO','CH-SM','CH-WT'];
    this.channelName = []
    this.channelName = this.channelType.filter(x => x.code === channel);
    if(recipientChannel.includes(channel)) {
      this.alertRuleForm.controls['templateId'].setValidators(Validators.required);
      this.alertRuleForm.controls['firstName'].setValidators([Validators.required, this.validateRecipientNameSelection.bind(this)]);
      this.alertRuleForm.controls['recipient_type'].setValidators(Validators.required);
    } else {
      this.alertRuleForm.controls['templateId'].setValidators(null);
      this.alertRuleForm.controls['firstName'].setValidators(this.validateRecipientNameSelection.bind(this));
      this.alertRuleForm.controls['recipient_type'].setValidators(null);
    }
    this.alertRuleForm.controls['templateId'].updateValueAndValidity();
    this.alertRuleForm.controls['firstName'].updateValueAndValidity();
    this.alertRuleForm.controls['recipient_type'].updateValueAndValidity();
    if(this.alertRuleForm.controls['pfRuleid'].value){
      let pfRuleid = this.alertRuleForm.controls['pfRuleid'].value;
      this.getTemplateId(channel, pfRuleid)
    }         
  }
  getRecipientName(type) {
    this.alertRuleForm.controls['firstName'].setValue(null);
    this.recipient = type;
    let recipitentType = this.recipient_typeList.find(item => item.code === type)
    this.recipitentTypeName = recipitentType.value;
    let recipientChannel = ['CH-EM', 'CH-NO','CH-SM','CH-WT'];
    if(recipientChannel.includes(this.alertRuleForm.controls['channelType'].value)) {
      this.alertRuleForm.controls['firstName'].setValidators([Validators.required, this.validateRecipientNameSelection.bind(this)]);
    }
    if (this.recipient === 'RT-RO') {
      this.serachText = '';
      this.configurationServices.getRecipientName(this.serachText, this.recipient).subscribe(res => {
        this.userNameList = res.results;
        this.recipientEnabled = true;
      });
    } else if (this.disableRecipientType.includes(this.recipient)) {
      this.userNameList = [];
      this.recipientEnabled = false;
      this.alertRuleForm.controls['firstName'].setValidators(this.validateRecipientNameSelection.bind(this));
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
    this.alertRuleForm.controls['firstName'].updateValueAndValidity();
  }
  getTemplateId(channelId, ruleId) {
      this.commonService.getAlertTemplate(channelId, ruleId).subscribe(res => {
        this.templateList = res.results;
      });
  }
  
  getTemplateName(event: any): void {
    this.templateName = [];
    this.checkTemplate = [];
    this.templateName = this.templateList.filter(x => x.id === event);
  }

  formatTemplate(template: string): string {
    return template.replace(/\n/g, '<br>');
  }

  setConfigValue(value1, value2, type) {
    if(value1 <= value2) {
      this.alertRuleForm.controls[type].setValue(value2);
    }
  }

  searchUserNamelist(event) {
    if (this.alertRuleForm.controls['recipient_type'].value !== null) {
      this.recipient = this.alertRuleForm.controls['recipient_type'].value;
      this.serachText = event.text;
      if (event.type === 'recipient') {
        if (this.recipient !== 'RT-RO' && this.serachText.length >= 2) {
          if(event.toHit === true) {
            this.configurationServices.getRecipientName(this.serachText, this.recipient, null, null, null, true).subscribe(res => {
              this.recepientListItems = res.results;
              this.userNameList = this.recepientListItems;
              this.recipientEnabled = true;
            });
          } else {
            this.userNameList = this.recepientListItems;
            this.recipientEnabled = true;
          }
        } else {
          this.configurationServices.getRecipientName(this.serachText, this.recipient).subscribe(res => {
            this.userNameList = res.results;
            this.recipientEnabled = true;
          });
        }
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

  getLocationSearch(event) {
    let toHit = event.toHit;
    this.locationIdEnabled = true;
    if (event.type === 'location') {
      if(toHit === true) {
        this.commonService.getLocationSearch(event.text).subscribe(res => {
          this.locationListItems = res.results;
          this.location_id = this.locationListItems;
          this.locationId = null;
        });
      } else {
        this.location_id  = this.locationListItems;
      }
    }
  }
  getLocationIdList(id) {
    if (id) {
      const location = this as any as { id: string, name: string }[]
      const locationId = location.find(obj => obj.id === id).name;
      return locationId;
    } else {
      return '';
    }
  }

  private requireLocationMatch(control: FormControl): ValidationErrors | null {
    if (control.value !== null && control.value !== '' && this.locationIdEnabled) {
      this.requireLocationMatchVal = this.location_id.filter(resFilter => resFilter.id === control.value);
      if (this.requireLocationMatchVal.length === 0) {
        return { requireMatch: true };
      }
    }
    return null;
  }
  getRoutineAlertType(type) {
    if (type === 'RAT-ACT') {
      this.isActivity = true;
      this.isRoutine = false;
      this.alertRuleForm.get('routine').setValue(null);
      this.alertRuleForm.get('routine').updateValueAndValidity();
      this.alertRuleForm.get('routine_activity').setValue(null);
      this.alertRuleForm.get('routine_activity').updateValueAndValidity();
    } else {
      this.isActivity = false;
      this.isRoutine = true;
      this.alertRuleForm.get('activity').setValue(null);
      this.alertRuleForm.get('activity').updateValueAndValidity();
    }
  }
  getRoutineType(type) {
    this.configurationServices.getRoutineName('', type).subscribe(res => {
      this.routineList = res.results;
    });
    this.configurationServices.getActivitiesList(type).subscribe(res => {
      this.activityList = res.results;
    });
  }
  getRoutineActivities(id) {
    this.configurationServices.getRoutineActivities(id).subscribe(res => {
      this.routine_activityList = res.results[0].activities;
    });
  }
  getDataTypes() {

    this.lookupService.getAppTermsWrapper('ServiceGroup,AssetType,AudioFile,AudioVolume,AudioLoop,DQType,HealthPackageType,RequestType,DQCategoryType,CategoryEventType,AlertType,QueueStatus,VisitStatus,PorterAlertType,PorterRequestType,RequestStatus,RuleAlertType,RoutineType,RoutineAlertType,TagType,TagAssociationType,Gender,VisitType,VisitEventType,RecipientType,Channel,LocationCategory,GeoEventType,CallEvent,AssetMaintenanceType')
      .subscribe(res => {
        this.alertTypes = res.AlertType ?? [];
        this.tagTypeList = res.TagType ?? [];
        this.RuleAssociate = res.TagAssociationType ?? [];
        this.Gender = res.Gender ?? [];

        this.service_grp = res.ServiceGroup ?? [];
        this.rule_alert_type = res.RuleAlertType ?? [];
        this.routine_type = res.RoutineType ?? [];
        this.routine_alert_type = res.RoutineAlertType ?? [];
        this.tag_type_id = res.TagType ?? [];
        this.scope_id = res.TagAssociationType ?? [];
        this.visit_type = res.VisitType ?? [];
        this.visit_event_type = res.VisitEventType ?? [];
        this.recipient_type = res.RecipientType ?? [];
        this.channelType = res.Channel ?? [];
        this.location_category = res.LocationCategory ?? [];
        this.event_type = res.GeoEventType ?? [];
        this.sosAidList = res.CallEvent ?? [];
        this.porter_alert_type = res.PorterAlertType ?? [];
        this.request_status = res.RequestStatus ?? [];
        this.request_type = res.PorterRequestType ?? [];
        this.visit_status = res.VisitStatus ?? [];
        this.queue_status = res.QueueStatus ?? [];
        this.dq_type = res.DQType ?? [];
        this.dq_sub_type = [ ...(res.HealthPackageType || []), ...(res.RoutineType || []), ...(res.RequestType || []) ];
        this.category_type = [...(res.CallEvent || []), ...(res.PorterRequestType || []), ...(res.DQCategoryType || []), ...(res.AssetMaintenanceType || []) ];
        this.dq_event_type = res.CategoryEventType ?? [];
        this.dq_status = [...(res.RequestStatus || []), ...(res.QueueStatus || []) ];
        this.audio_fileList = res.AudioFile ?? [];
        this.audio_volumeList = res.AudioVolume ?? [];
        this.audio_loopList = res.AudioLoop ?? [];
        this.asset_type_idList = res.AssetType ?? [];
        if (this.data) {
          if(this.ruleTypes?.length === 0) {
            this.configurationServices.getAllPfRules().subscribe(res => {
              this.ruleTypes = res.results;
              this.getAlertConfig(this.data.pfRuleid);
            });
          } else {
            this.getAlertConfig(this.data.pfRuleid);
          }
        }
      });
  }

  selectTab(index: number): void {
    this.selectedIndex = index;
  }

  filtersosAidOptions(value) {
    if (value !== null) {
      this.sosAidOption.push(value);
    } else {
      this.sosAidOption = [];
    }
  }
  tabClick(event) {
    this.selectedTab = event.index;
    this.selectedIndex = event.index;
  }
  clearTask(event) {
    if (event.checked === false) {
      let aidListArrays = this.alertRuleForm.get('sosAidList') as FormArray;
      for(let i = 0; i < aidListArrays.length; i++) {
      aidListArrays.controls[i].patchValue({ 'role': null, 'activityId': null, auto_assign: false, auto_complete: false });
      }
    }
  }
  
  private getValueOrDefault<T>(value: T | undefined, defaultValue: T | null = null): T | null {
    return value ?? defaultValue;
  }

  private buildDefaultFormValueMap(): Record<string, any> {
    return {
      scope_id: this.getValueOrDefault(this.data.scope_id),
      tag_type_id: this.getValueOrDefault(this.data.tag_type_id),
      visit_event_type: this.getValueOrDefault(this.data.visit_event_type),
      visit_type: this.getValueOrDefault(this.data.visit_type),
      event_type: this.getValueOrDefault(this.data.event_type),
      location_category: this.getValueOrDefault(this.data.location_category),
      location_id: this.getValueOrDefault(this.data.location_id),
      location_type: this.getValueOrDefault(this.data.location_type),
      out_location_type: this.getValueOrDefault(this.data.out_location_type),
      aid: this.getValueOrDefault(this.data.aid),
      time_limit: this.getValueOrDefault(this.data.time_limit),
      ra_time_limit: this.getValueOrDefault(this.data.ra_time_limit),
      temperature_high: this.getValueOrDefault(this.data.temperature_high),
      temperature_low: this.getValueOrDefault(this.data.temperature_low),
      spo2_high: this.getValueOrDefault(this.data.spo2_high),
      spo2_low: this.getValueOrDefault(this.data.spo2_low),
      heartrate_high: this.getValueOrDefault(this.data.heartrate_high),
      heartrate_low: this.getValueOrDefault(this.data.heartrate_low),
      generate_task: this.getValueOrDefault(this.data.generate_task),
      event: this.getValueOrDefault(this.data.event),
      sosAid: this.getValueOrDefault(this.data.sosAid),
      activityId: this.getValueOrDefault(this.data.activityId),
      role: this.getValueOrDefault(this.data.role),
      auto_assign: this.getValueOrDefault(this.data.auto_assign),
      audio_file: this.getValueOrDefault(this.data.audio_file),
      audio_volume: this.getValueOrDefault(this.data.audio_volume),
      audio_loop: this.getValueOrDefault(this.data.audio_loop),
      auto_complete: this.getValueOrDefault(this.data.auto_complete),
      device_time: this.getValueOrDefault(this.data.time),
      device_tag_type_id: this.getValueOrDefault(this.data.device_tag_type_id),
      status: this.getValueOrDefault(this.data.isActive, false),
      rule_alert_type: this.getValueOrDefault(this.data.movementTypeId),
      bed_value: this.getValueOrDefault(this.data.bed_value),
      battery_level: this.getValueOrDefault(this.data.battery_level),
      routine_type: this.getValueOrDefault(this.data.routine_type),
      routine_alert_type: this.getValueOrDefault(this.data.routine_alert_type),
      routine: this.getValueOrDefault(this.data.routine),
      routine_activity: this.getValueOrDefault(this.data.routine_activity),
      activity: this.getValueOrDefault(this.data.activity),
      sla_start: this.getValueOrDefault(this.data.sla_start),
      sla_end: this.getValueOrDefault(this.data.sla_end),
      reminder_time: this.getValueOrDefault(this.data.reminder_time),
      porter_alert_type: this.getValueOrDefault(this.data.porter_alert_type),
      request_status: this.getValueOrDefault(this.data.request_status),
      request_type: this.getValueOrDefault(this.data.request_type),
      sla_alert_config: this.getValueOrDefault(this.data.sla_alert_config),
      dq_type: this.getValueOrDefault(this.data.dq_type),
      dq_sub_type: this.getValueOrDefault(this.data.dq_sub_type),
      category_type: this.getValueOrDefault(this.data.category_type),
      service_grp: this.getValueOrDefault(this.data.service_grp),
      pool_loc_cat: this.getValueOrDefault(this.data.pool_loc_cat),
      dq_event_type: this.getValueOrDefault(this.data.dq_event_type),
      dq_role: this.getValueOrDefault(this.data.dq_role),
      dq_routine: this.getValueOrDefault(this.data.dq_routine),
      dq_activity_group: this.getValueOrDefault(this.data.dq_activity_group),
      dq_activity: this.getValueOrDefault(this.data.dq_activity),
      dq_status: this.getValueOrDefault(this.data.dq_status),
      pfRuleid: [this.getValueOrDefault(this.data.pfRuleid), Validators.required],
      scopeId: this.getValueOrDefault(this.data.scopeId),
      alertTypeId: [this.getValueOrDefault(this.data.alertTypeId, 'AT-AL'), Validators.required],
      pfModelId: this.getValueOrDefault(this.data.pfModelId),
      messageFormat: this.getValueOrDefault(this.data.messageFormat),
      close: 'Y',
      closeTime: this.getValueOrDefault(this.data.autoCloseTime),
      name: [this.getValueOrDefault(this.data.name), Validators.required],

      // dynamic initializations
      aidLocation: null,
      aidLocationId: null,
      configSla: false,
      configReminder: false,
      sla_alert: null,
      sla_escalate: null,
      reminder_alert: null,
      reminder_escalate: null,
      prior_dur: [],
      visit_status: null,
      queue_status: null,
      time_interval: null,
      asset_type_id: null,
      tag_id: null,

      identifyingId: null,
      pfAlertConfigRecipientId: null,
      firstName: [null, this.validateRecipientNameSelection.bind(this)],
      channelType: null,
      templateId: null,
      recipient_type: null,

      // form arrays
      sosAidList: this.form.array([this.editAid(0)]),
      deviceList: this.form.array([this.editDevice(0)]),
      userList: this.form.array([this.editAlertRuleConfig(0)])
    };
  }

  public buildForm(): void {
    const fields = this.buildDefaultFormValueMap();
    this.alertRuleForm = this.form.group(fields);
  }

  private validateRecipientNameSelection(control: FormControl): { [key: string]: any } | null {
    this.selectedRecipientNameId = control.value;
    if (control.value) {
      if (!this.selectedRecipientNameId || !this.userNameList || this.userNameList.length === 0) {
        return { 'invalidRecipientNameSelection': true };
      }
      let selectedRecipient = this.userNameList.find(doctor => doctor.id === this.selectedRecipientNameId);
      if (selectedRecipient === undefined) {
        selectedRecipient = this.userNameList.find(doctor => doctor.name == this.selectedRecipientNameId);
      }
      if (control.value !== null && selectedRecipient === undefined) {
        return { 'invalidRecipientNameSelection': true };
      }
    }
    return null;
  }

  addAid() {
    const control = <FormArray>this.alertRuleForm.controls['sosAidList'];
    control.push(this.getAid());
  }

  removeAid(k: number, type) {
    if (this.data && k !== 0) {
      const locDetail = this.alertRuleForm.controls['sosAidList'].value[k].event;
      const locIndex = this.removeAidList.findIndex(res => res.event_name === locDetail);
      if (locIndex !== -1) {
        if(this.pfRule[0].ruleTypeId === 'RU-PC') {
          this.removeAidList[locIndex]['isDeletable'] = true;
          this.removedAid.push({
            'aid': this.removeAidList[locIndex].aid,
            'location_id':this.removeAidList[locIndex].location_id,
            'isDeletable': true
          });
        } else {
          this.removeAidList[locIndex]['isDeletable'] = true;
          this.removedAid.push({
            'event_name': this.removeAidList[locIndex].event_name,
            'event_value': this.removeAidList[locIndex].event_value,
            'aid': this.removeAidList[locIndex].aid,
            'activityId': this.removeAidList[locIndex].activityId,
            'role': this.removeAidList[locIndex].role,
            'auto_assign': this.removeAidList[locIndex].auto_assign,
            'audio_file': this.removeAidList[locIndex].audio_file,
            'audio_volume': this.removeAidList[locIndex].audio_volume,
            'audio_loop': this.removeAidList[locIndex].audio_loop,
            'auto_complete': this.removeAidList[locIndex].auto_complete,
            'isDeletable': true
          });
        }
      }
    }
    if (this.alertRuleForm.controls['sosAidList'].value[k].hasOwnProperty('event') &&
      this.alertRuleForm.controls['sosAidList'].value[k].event !== null) {
      this.sosAidOption = this.sosAidOption.filter(x => this.alertRuleForm.controls['sosAidList'].value[k].event.indexOf(x) === -1);
    } 
    const control = <FormArray>this.alertRuleForm.controls['sosAidList'];
    control.removeAt(k);
    if (type == 'clear' && control.length <= 0) {
      this.addAid();
    }
  }

  private getAid() {
    return this.form.group({
      id: [null],
      event: [null],
      eventValue: [null],
      sosAid: [null],
      activityId: [null],
      role: [null],
      auto_assign: [null],
      audio_file: [null],
      audio_volume: [null],
      audio_loop:[null],
      auto_complete: [null],
      aidLocation : [null],
      aidLocationId: [null, this.requireLocationMatch.bind(this)],
    });
  }

  private editAid(k) {
    return this.form.group({
      id: [this.data.id],
      event: [this.data.event],
      eventValue: [this.data.eventValue],
      sosAid: [this.data.sosAid],
      activityId: [this.data.activityId],
      role: [this.data.role],
      auto_assign: [this.data.auto_assign],
      audio_file: [this.data.audio_file],
      audio_volume: [this.data.audio_volume],
      audio_loop:[this.data.audio_loop],
      auto_complete: [this.data.auto_complete],
      aidLocation: [this.data.aidLocation],
      aidLocationId: [this.data.aidLocationId, this.requireLocationMatch.bind(this)],
    });
  }

  getEventValue(value, k) {
    let aidListArrays = this.alertRuleForm.get('sosAidList') as FormArray;
    aidListArrays.controls[k].patchValue({ ['eventValue']: value });
  }

  audioPlay(code) {
    this.audio.src = 'assets/audio/' + code + '.wav';
    this.audio.load();
    this.audio.play();
  }

  filterDeviceOptions(value) {
    if (value !== null) {
      this.deviceTypeOption.push(value);
    } else {
      this.deviceTypeOption = [];
    }
  }

  addDevice() {
    const control = <FormArray>this.alertRuleForm.controls['deviceList'];
    control.push(this.getDevice());
  }

  removeDevice(d: number, type) {
    if (this.data && d !== 0) {
      const locDetail = this.alertRuleForm.controls['deviceList'].value[d].device_tag_type_id;
      const locIndex = this.removeDeviceList.findIndex(res => res.tag_type_id === locDetail);
      if (locIndex !== -1) {
        this.removeDeviceList[locIndex]['isDeletable'] = true;
        this.removedDevice.push({
          'tag_type_id': this.removeDeviceList[locIndex].tag_type_id,
          'time': this.removeDeviceList[locIndex].time,
          'isDeletable': true
        });
      }
    }
    if (this.alertRuleForm.controls['deviceList'].value[d].hasOwnProperty('device_tag_type_id') &&
      this.alertRuleForm.controls['deviceList'].value[d].device_tag_type_id !== null) {
      this.deviceTypeOption = this.deviceTypeOption.filter(x => this.alertRuleForm.controls['deviceList'].value[d].device_tag_type_id.indexOf(x) === -1);
    }
    const control = <FormArray>this.alertRuleForm.controls['deviceList'];
    control.removeAt(d);
    if (type == 'clear' && control.length <= 0) {
      this.addDevice();
    }
  }

  private getDevice() {
    return this.form.group({
      id: [null],
      device_tag_type_id: [null],
      device_time: [1],
    });
  }

  private editDevice(d) {
    return this.form.group({
      id: [this.data.id],
      device_tag_type_id: [this.data.device_tag_type_id],
      device_time: [this.data.device_time],
    });
  }

  addAlertEscalation() {
    const control = <FormArray>this.alertRuleForm.controls['userList'];
    control.push(this.getAlertRuleConfig());
  }

  addAlertEscalate() {
    let checkDuplicate = false;
    const allowedTypes = ["RT-US", "RT-RO", "RT-DT"];
    const identifyingName = this.userNameList.find(f => f.id === this.alertRuleForm.controls['firstName'].value)
    let notificationData = {
      identifyingId: this.alertRuleForm.controls['firstName'].value,
      identifyingName: identifyingName ? identifyingName.name : null,
      channel: this.alertRuleForm.controls['channelType'].value,
      channelName: this.channelName.length ? this.channelName[0].value : null,
      channelTemplates: this.alertRuleForm.controls['templateId'].value,
      name: this.templateName.length ? this.templateName[0].name : null,
      identifyingType: this.alertRuleForm.controls['recipient_type'].value,
      identifyingTypeName: this.recipitentTypeName
    }
    checkDuplicate = this.alerNoticationData.some(check => {
      if (check.hasOwnProperty('pfAlertConfigRecipientId'), check.pfAlertConfigRecipientId) {
        const isBasicMatch = check.channel === notificationData.channel &&
          check.channelTemplates[0]?.id === notificationData.channelTemplates &&
          check.identifyingType === notificationData.identifyingType;

        if (allowedTypes.includes(notificationData.identifyingType)) {
          return isBasicMatch && check.identifyingId === notificationData.identifyingId;
        }
        check.identifyingId === notificationData.identifyingId
        return isBasicMatch;
      } else {
        const isBasicMatch = check.channel === notificationData.channel &&
          check.channelTemplates === notificationData.channelTemplates &&
          check.identifyingType === notificationData.identifyingType;

        if (allowedTypes.includes(notificationData.identifyingType)) {
          return isBasicMatch && check.identifyingId === notificationData.identifyingId;
        }
        check.identifyingId === notificationData.identifyingId
        return isBasicMatch;
      }
    })
    console.log(checkDuplicate)
    if (checkDuplicate) {
      this.toastr.warning("This channel notification already exists");
      return;
    } else {
      this.alerNoticationData.push(notificationData);
      this.alerNoticationData = [...this.alerNoticationData];
      this.channelName = [];
      this.templateName = [];
      this.firstName = null;
      this.recipitentTypeName = null;
      this.alertRuleForm.controls['channelType'].setValue(null);
      this.alertRuleForm.controls['channelType'].clearValidators();
      this.alertRuleForm.controls['channelType'].updateValueAndValidity();

      this.alertRuleForm.controls['firstName'].setValue(null);
      this.alertRuleForm.controls['firstName'].clearValidators();
      this.alertRuleForm.controls['firstName'].updateValueAndValidity();

      this.alertRuleForm.controls['recipient_type'].setValue(null);
      this.alertRuleForm.controls['recipient_type'].clearValidators();
      this.alertRuleForm.controls['recipient_type'].updateValueAndValidity();

      this.alertRuleForm.controls['templateId'].setValue(null);
      this.alertRuleForm.controls['templateId'].clearValidators();
      this.alertRuleForm.controls['templateId'].updateValueAndValidity();
    }
  }

  removeAlertEscalation(i: number, type) {
    if (this.data) {
      const locDetail = this.alertRuleForm.controls['userList'].value[i].firstName;
      const resDetail = this.alertRuleForm.controls['userList'].value[i].pfAlertConfigRecipientId;
      const locIndex = this.data.alertConfigRecipients.findIndex(res => res.identifyingName === locDetail && res.pfAlertConfigRecipientId === resDetail);
      if (locIndex !== -1) {
        this.data.alertConfigRecipients[locIndex]['isDeletable'] = true;
        this.removedAlertEscalation.push({
          'channel': this.data.alertConfigRecipients[locIndex].channel,
          'identifyingId': this.data.alertConfigRecipients[locIndex].identifyingId,
          'identifyingType': this.data.alertConfigRecipients[locIndex].identifyingType,
          'pfAlertConfigRecipientId': this.data.alertConfigRecipients[locIndex].pfAlertConfigRecipientId,
          'isDeletable': true
        });
      }
    }

    const control = <FormArray>this.alertRuleForm.controls['userList'];
    if (this.alertRuleForm.controls['userList'].value[i].hasOwnProperty('pfAlertConfigRecipientId') &&
      this.alertRuleForm.controls['userList'].value[i].pfAlertConfigRecipientId !== null) {
      this.notificationId = this.notificationId.filter(x => this.alertRuleForm.controls['userList'].value[i].pfAlertConfigRecipientId !== x)
    }
    control.removeAt(i);
    if (type == 'clear' && control.length <= 0) {
      this.addAlertEscalation();
    }
  }

  eventAction(event){
   if(event.key === 'delete'){
      this.deleteAlertNofication(event.data);
    } else if(event.key === 'undo'){
      this.recipientUndo(event.data);
    }
  }

  recipientUndo(data) {
    if (data.isDeletable) {
      data.isDeletable = false;
    }
    this.alerNoticationData = [...this.alerNoticationData];
  }

  deleteAlertNofication(data) {
    if (data.pfAlertConfigRecipientId) {
      data.isDeletable = true;
    } else {
      this.alerNoticationData = this.alerNoticationData.filter(item => item !== data);
    }
    this.alerNoticationData = [...this.alerNoticationData];
  }

  private getAlertRuleConfig() {
    return this.form.group({
      id: [null],
      identifyingId: [null],
      firstName: [null],
      channelType: [null],
      templateId: [null],
      recipient_type: [null],
      pfAlertConfigRecipientId: [null],
    });
  }

  private editAlertRuleConfig(i) {
    return this.form.group({
      id: [this.data.id],
      identifyingId: [this.data.identifyingId],
      firstName: [this.data.firstName],
      channelType: [this.data.channelType],
      templateId: [null],
      recipient_type: [this.data.recipient_type],
      pfAlertConfigRecipientId: [this.data.pfAlertConfigRecipientId],
    });
  }

  public saveAlertRule() {
    this.isDisabled = true;
    this.createAlertRule = new CreateAlertRule(null, null, null, null, null, null, null, null, null, null);

    const getControlValue = (key: string) => this.alertRuleForm.controls[key]?.value;
    const addAlertCondition = (type: string, value: any, stringify = false) => {
      if (value != null) {
        this.alertConditions.push({
          identifyingType: type,
          identifyingValue: stringify ? JSON.stringify(value) : value,
        });
      }
    };

    const addMultipleAlertConditions = (keys: string[], stringify = false) => {
      keys.forEach(key => addAlertCondition(key, getControlValue(key), stringify));
    };

    const addSlaAndReminder = () => {
      this.config = {};
      if (getControlValue('configSla')) {
        this.config['sla_time'] = {
          alert: getControlValue('sla_alert'),
          escalate: getControlValue('sla_escalate'),
        };
      }
      if (getControlValue('configReminder')) {
        this.config['reminder_time'] = {
          alert: getControlValue('reminder_alert'),
          escalate: getControlValue('reminder_escalate'),
        };
      }
      addAlertCondition('sla_alert', this.config, true);

      if (
        this.pfRule[0].ruleTypeId === 'RU-SC' &&
        getControlValue('alertTypeId') === 'AT-RE'
      ) {
        addAlertCondition('prior_dur', getControlValue('prior_dur'), true);
      }
    };

    const prepareAidEvent = () => {
      this.alertConfigAidEvent = [];
      const aidControl = <FormArray>this.alertRuleForm.controls['sosAidList'];
      const generateTask = getControlValue('generate_task') === true;

      aidControl.controls.forEach((control, k) => {
        const aidItem = control.value;
        const role = aidItem.role ?? 0;
        const activityId = aidItem.activityId ?? 0;
        if (!aidItem.event) return;

        const baseAid = {
          aid: aidItem.sosAid,
          event_name: aidItem.event,
          event_value: aidItem.eventValue,
          audio_file: aidItem.audio_file,
          audio_volume: aidItem.audio_volume,
          audio_loop: aidItem.audio_loop,
          role,
          activityId
        };

        this.alertConfigAidEvent.push({
          ...baseAid,
          auto_assign: generateTask ? 'Y' : 'N',
          auto_complete: generateTask ? 'Y' : 'N',
        });

        if (aidItem.aidLocationId != null) {
          this.alertConfigAidEvent.push({
            aid: aidItem.sosAid,
            location_id: aidItem.aidLocationId,
          });
        }
      });

      if (this.alertConfigAidEvent.length > 0) {
        addAlertCondition('aid_event', this.alertConfigAidEvent, true);
      }
    };

    const prepareDeviceList = () => {
      this.alertConfigDevice = [];
      const deviceControl = <FormArray>this.alertRuleForm.controls['deviceList'];
      if (getControlValue('rule_alert_type') === 'RAT-DS') {
        deviceControl.controls.forEach(control => {
          const { device_tag_type_id, device_time } = control.value;
          this.alertConfigDevice.push({ tag_type_id: device_tag_type_id, time: device_time });
        });
      }
      if (this.alertConfigDevice.length > 0) {
        addAlertCondition('device_config', this.alertConfigDevice, true);
      }
    };

    const prepareRecipients = () => {
      this.alertConfigRecipients = [];
      const recipientChannel = ['CH-EM', 'CH-FPN', 'CH-NO', 'CH-SM', 'CH-WT'];
      this.alerNoticationData.forEach(data => {
        if (
          (data.recipient_type !== null || !recipientChannel.includes(data.channel)) &&
          data.channel !== null
        ) {
          this.alertConfigRecipients.push({
            channel: data.channel,
            channelTemplateId: data.channelTemplates,
            identifyingId: data.identifyingId,
            identifyingType: data.identifyingType,
          });
        }
      });
      this.createAlertRule.alertConfigRecipients = this.alertConfigRecipients;
    };

    this.createAlertRule.name = getControlValue('name');
    this.createAlertRule.pfRuleid = this.pfRuleid;
    this.createAlertRule.pfModelId = getControlValue('pfModelId');
    this.createAlertRule.alertTypeId = getControlValue('alertTypeId');
    this.createAlertRule.messageFormat = getControlValue('messageFormat');
    this.createAlertRule.autoCloseTime = getControlValue('closeTime');
    this.alertConditions = [];

    addMultipleAlertConditions(['rule_alert_type', 'routine_type', 'scope_id', 'event_type']);
    addMultipleAlertConditions([
      'tag_type_id', 'asset_type_id', 'visit_type', 'visit_event_type', 'visit_status', 'queue_status',
      'location_category', 'routine_activity', 'activity', 'request_status', 'request_type',
      'dq_event_type', 'dq_role', 'dq_routine', 'dq_activity_group', 'dq_activity', 'dq_status'
    ], true);

    if (getControlValue('out_location_type') != null && getControlValue('event_type') === 'GET-OUT') {
      addAlertCondition('location_type', [getControlValue('out_location_type')], true);
    } else if (getControlValue('location_type') != null) {
      addAlertCondition('location_type', getControlValue('location_type'), true);
    }

    if (getControlValue('location_id') != null) {
      addAlertCondition('location_id', [getControlValue('location_id')], true);
    }

    addMultipleAlertConditions([
      'aid', 'ra_time_limit', 'time_interval', 'time_limit', 'bed_value', 'battery_level', 'routine_alert_type',
      'routine', 'sla_start', 'sla_end', 'reminder_time', 'porter_alert_type', 'dq_type', 'dq_sub_type',
      'service_grp', 'pool_loc_cat'
    ]);

    const categoryTypeVal = getControlValue('category_type');
    const dqTypeVal = getControlValue('dq_type');
    if (categoryTypeVal != null) {
      addAlertCondition('category_type', categoryTypeVal, dqTypeVal === 'DQAT-RQ');
      this.getDQEvent(categoryTypeVal);
    }

    addSlaAndReminder();
    prepareRecipients();
    prepareDeviceList();
    prepareAidEvent();

    if (getControlValue('generate_task') != null) {
      addAlertCondition('generate_task', getControlValue('generate_task') === true ? 'Y' : 'N');
    }

    this.createAlertRule.alertConditions = this.alertConditions;

    this.configurationServices.saveAlert(this.createAlertRule).subscribe(
      res => {
        this.isDisabled = res.statusCode === 1;
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }
  
  public updateAlertRule(id: any): void {
    this.initializeAlertRule();

    const controls = this.alertRuleForm.controls;

    const simpleConditions = [
      'rule_alert_type', 'routine_type', 'scope_id', 'event_type', 'aid',
      'ra_time_limit', 'time_interval', 'time_limit', 'bed_value', 'battery_level',
      'routine_alert_type', 'routine', 'sla_start', 'sla_end', 'reminder_time',
      'porter_alert_type', 'dq_type', 'dq_sub_type', 'service_grp', 'pool_loc_cat',
      'generate_task'
    ];

    const jsonStringConditions = [
      'tag_type_id', 'asset_type_id', 'visit_type', 'visit_event_type',
      'visit_status', 'request_status', 'request_type', 'routine_activity',
      'activity', 'dq_event_type', 'dq_role', 'dq_routine',
      'dq_activity_group', 'dq_activity', 'dq_status'
    ];

    // Handle standard controls
    simpleConditions.forEach(ctrl => {
      if(ctrl === 'generate_task') {
        this.pushCondition(ctrl, controls[ctrl]?.value ? 'Y' : 'N');
      } else {
        this.pushCondition(ctrl, controls[ctrl]?.value);
      }
    });

    jsonStringConditions.forEach(ctrl => {
      this.pushCondition(ctrl, controls[ctrl]?.value, true);
    });

    // Special handling: location_type
    const eventType = controls['event_type']?.value;
    const locCtrl = eventType === 'GET-OUT' ? 'out_location_type' : 'location_type';
    if (controls[locCtrl]?.value != null) {
      this.pushCondition('location_type', [controls[locCtrl].value], true);
    }

    // Handle location_id
    if (controls['location_id']?.value != null) {
      this.locationId ??= controls['location_id'].value;
      this.pushCondition('location_id', [this.locationId], true);
    }

    // Handle category_type and dq_type special case
    const categoryType = controls['category_type']?.value;
    const dqType = controls['dq_type']?.value;
    if (categoryType != null) {
      const useJson = dqType === 'DQAT-RQ';
      this.pushCondition('category_type', categoryType, useJson);
    }

    // SLA and Reminder Configs
    if (controls['configSla']?.value === true) {
      this.config['sla_time'] = {
        alert: controls['sla_alert'].value,
        escalate: controls['sla_escalate'].value
      };
    }
    if (controls['configReminder']?.value === true) {
      this.config['reminder_time'] = {
        alert: controls['reminder_alert'].value,
        escalate: controls['reminder_escalate'].value
      };
    }

    if (dqType != null || controls['porter_alert_type']?.value != null) {
      this.pushCondition('sla_alert', this.config, true);
      if (this.pfRule[0]?.ruleTypeId === 'RU-SC' && controls.alertTypeId?.value === 'AT-RE') {
        this.pushCondition('prior_dur', controls['prior_dur'].value, true);
      }
    }

    this.editAlertRule.alertConditions = this.alertConditions;
    this.prepareRecipients();
    this.prepareDevices();
    this.prepareAidEvents();

    if (this.alertConfigAidEvent.length > 0) {
      this.pushCondition('aid_event', this.alertConfigAidEvent, true);
    }
    this.editAlertRule.alertConfigRecipients = this.alertConfigRecipients;

    this.configurationServices.updateAlert(this.data.configId, this.editAlertRule).subscribe(
      res => {
        this.isDisabled = false;
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }

  private initializeAlertRule(): void {
    this.editAlertRule = new EditAlertRule(null, null, null, null, null, null, null, null, null, null);
    const controls = this.alertRuleForm.controls;
    this.editAlertRule.isActive = controls['status']?.value;
    this.editAlertRule.name = controls['name']?.value;
    this.editAlertRule.pfRuleid = this.pfRuleid;
    this.editAlertRule.pfModelId = controls['pfModelId']?.value;
    this.editAlertRule.alertTypeId = controls['alertTypeId']?.value;
    this.editAlertRule.messageFormat = controls['messageFormat']?.value;
    this.editAlertRule.autoCloseTime = controls['closeTime']?.value;
    this.alertConditions = [];
    this.alertConfigRecipients = [];
    this.alertConfigDevice = [];
    this.alertConfigAidEvent = [];
    this.config = {};
  }

  private pushCondition(type: string, value: any, stringify: boolean = false): void {
    if (value != null) {
      this.alertConditions.push({
        identifyingType: type,
        identifyingValue: stringify ? JSON.stringify(value) : value,
        pfAlertConditionId: this[`${type}_ConditionId`]
      });
    }
  }

  private prepareRecipients(): void {
    const recipientChannel = ['CH-EM', 'CH-FPN', 'CH-NO','CH-SM','CH-WT'];
    for (const data of this.alerNoticationData) {
      if ((data.identifyingType !== null || !recipientChannel.includes(data.channel)) && data.channel !== null) {
        const recipient = {
          channel: data.channel,
          identifyingId: data.identifyingId,
          identifyingType: data.identifyingType,
          channelTemplateId: data.hasOwnProperty('pfAlertConfigRecipientId') && data.channelTemplates ? (data.channelTemplates.length ? data.channelTemplates[0]?.id : null) : data.channelTemplates,
          isDeletable: !!data.isDeletable
        };
        if (data.pfAlertConfigRecipientId) {
          recipient['pfAlertConfigRecipientId'] = data.pfAlertConfigRecipientId;
        }
        this.alertConfigRecipients.push(recipient);
      }
    }
    this.alertConfigRecipients.push(...this.removedAlertEscalation);
  }

  private prepareDevices(): void {
    const devices = this.alertRuleForm.controls['deviceList'] as FormArray;
    if (this.alertRuleForm.controls['rule_alert_type']?.value === 'RAT-DS') {
      for (const device of devices.value) {
        this.alertConfigDevice.push({
          tag_type_id: device.device_tag_type_id,
          time: device.device_time
        });
      }
    }
    if (this.alertConfigDevice.length > 0) {
      this.pushCondition('device_config', this.alertConfigDevice, true);
    }
  }

  private prepareAidEvents(): void {
    const aidList = <FormArray>this.alertRuleForm.controls['sosAidList'];
    for (const aid of aidList.value) {
      const role = aid.role ?? 0;
      const activityId = aid.activityId ?? 0;
      const eventObj = {
        aid: aid.sosAid,
        event_name: aid.event,
        event_value: aid.eventValue,
        audio_file: aid.audio_file,
        audio_volume: aid.audio_volume,
        audio_loop: aid.audio_loop,
        role,
        activityId,
        auto_assign: aid.auto_assign ? 'Y' : 'N',
        auto_complete: aid.auto_complete ? 'Y' : 'N'
      };
      if (aid.event && this.alertRuleForm.controls['generate_task']?.value) {
        this.alertConfigAidEvent.push(eventObj);
      } else if (aid.event) {
        this.alertConfigAidEvent.push({ ...eventObj, role: 0, activityId: 0, auto_assign: 'N', auto_complete: 'N' });
      }

      const locationId = aid.aidLocation ?? aid.aidLocationId;
      if (aid.aidLocationId != null) {
        this.alertConfigAidEvent.push({
          aid: aid.sosAid,
          location_id: locationId
        });
      }
    }
  }

  footerEventAction(event) {
    this.alertConditions = event.value;
    this.dynamicForm = event.valid;
    if(this.alertRuleForm.controls['name'].invalid || this.alertRuleForm.controls['alertTypeId'].invalid ||
    this.alertRuleForm.controls['pfRuleid'].invalid || this.alertRuleForm.controls['pfModelId'].invalid) {
      this.dynamicForm = false;
    }
  }
  saveDynamicAlertRule() {
    this.isDisabled = true;
    this.createAlertRule = new CreateAlertRule(null, null, null, null, null, null, null, null, null, null);
    this.createAlertRule.name = this.alertRuleForm.controls['name'].value;
    this.createAlertRule.pfRuleid = this.pfRuleid;
    this.createAlertRule.pfModelId = this.alertRuleForm.controls['pfModelId'].value;
    this.createAlertRule.isActive = true;
    if(this.pfRule[0].ruleTypeId === 'RU-SC' || this.pfRule[0].ruleTypeId === 'RU-WO') {
      this['is_entity_routine'] = false;
      this.alertConditions?.forEach( req => {
        if(req?.identifyingType === 'is_entity_routine' && req?.identifyingValue === "Y") {
          this['is_entity_routine'] = true;
        }
      })
      if(this.alertConditions[1].identifyingValue === "RQT-ROU" && this.alertConditions[0].identifyingValue !== 'DQAT-WO') {
        this.createAlertRule.entityType = "DQAT-RU";
      } else if(this.alertConditions[1].identifyingValue === "RQT-ROU" && this.alertConditions[0].identifyingValue === 'DQAT-WO') {
        this.createAlertRule.entityType = "DQAT-WO";
      } else {
        this.createAlertRule.entityType = this.alertConditions[0].identifyingValue;
      }
    }
    this.createAlertRule.alertTypeId = this.alertRuleForm.controls['alertTypeId'].value;
    this.createAlertRule.messageFormat = this.alertRuleForm.controls['messageFormat'].value;
    this.createAlertRule.autoCloseTime = this.alertRuleForm.controls['closeTime'].value === '' ? 0 : this.alertRuleForm.controls['closeTime'].value;
    this.createAlertRule.alertConditions = this.alertConditions;
    this.alertConfigRecipients = [];
    let recipientChannel = ['CH-EM', 'CH-FPN', 'CH-NO','CH-SM','CH-WT'];
    for (let alerNoticationData of this.alerNoticationData) {
      if ((alerNoticationData.identifyingType !== null || !recipientChannel.includes(alerNoticationData.channel)) &&
        alerNoticationData.channel !== null) {
        this.alertConfigRecipientsLocal = {
          'channel': alerNoticationData.channel,
          'channelTemplateId': alerNoticationData.channelTemplates,
          'identifyingId': alerNoticationData.identifyingId,
          'identifyingType': alerNoticationData.identifyingType,
        };
        this.alertConfigRecipients.push(this.alertConfigRecipientsLocal);
      }
    }
    this.createAlertRule.alertConfigRecipients = this.alertConfigRecipients;
    this.configurationServices.saveAlert(this.createAlertRule).subscribe(res => {
      if (res.statusCode !== 1) {
        this.isDisabled = false;
      }
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

  updateDynamicAlertRule(id) {
    this.editAlertRule = new EditAlertRule(null, null, null, null, null, null, null, null, null, null);
    const getFormValue = (key: string) => this.alertRuleForm.controls[key]?.value;

    Object.assign(this.editAlertRule, {
      isActive: getFormValue('status'),
      name: getFormValue('name'),
      pfRuleid: this.pfRuleid,
      pfModelId: getFormValue('pfModelId'),
      alertTypeId: getFormValue('alertTypeId'),
      messageFormat: getFormValue('messageFormat'),
      autoCloseTime: getFormValue('closeTime')
    });

    if (this.pfRule[0].ruleTypeId === 'RU-SC' || this.pfRule[0].ruleTypeId === 'RU-WO') {
      const isEntityRoutine = this.alertConditions?.some(
        cond => cond?.identifyingType === 'is_entity_routine' && cond?.identifyingValue === 'Y'
      );
      if(this.alertConditions[1].identifyingValue === "RQT-ROU" && this.alertConditions[0].identifyingValue !== 'DQAT-WO') {
        this.editAlertRule.entityType = "DQAT-RU";
      } else if(this.alertConditions[1].identifyingValue === "RQT-ROU" && this.alertConditions[0].identifyingValue === 'DQAT-WO') {
        this.editAlertRule.entityType = "DQAT-WO";
      } else {
        this.editAlertRule.entityType = this.alertConditions[0].identifyingValue;
      }
    }

    this.editAlertRule.alertConditions = this.alertConditions;

    const recipientChannel = ['CH-EM', 'CH-FPN', 'CH-NO', 'CH-SM', 'CH-WT'];
    this.alertConfigRecipients = this.alerNoticationData
      .filter(data => (data.identifyingType !== null || !recipientChannel.includes(data.channel)) && data.channel !== null)
      .map(data => this.mapRecipient(data));

    this.alertConfigRecipients.push(...this.removedAlertEscalation);
    this.editAlertRule.alertConfigRecipients = this.alertConfigRecipients;

    this.configurationServices.updateAlert(id, this.editAlertRule).subscribe(
      res => {
        if (res.statusCode === 0) this.isDisabled = false;
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      },
      error => {
        this.isDisabled = false;
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }

  private mapRecipient(data: any) {
    const baseRecipient = {
      channel: data.channel,
      identifyingId: data.identifyingId,
      identifyingType: data.identifyingType,
      isDeletable: !!data.isDeletable
    };

    if (data.hasOwnProperty('pfAlertConfigRecipientId') && data.pfAlertConfigRecipientId !== null) {
      return {
        ...baseRecipient,
        channelTemplateId: data.channelTemplates?.length ? data.channelTemplates[0].id : null,
        pfAlertConfigRecipientId: data.pfAlertConfigRecipientId
      };
    }

    return {
      ...baseRecipient,
      channelTemplateId: data.channelTemplates
    };
  }

  fixClick() {
   console.log('')
  }
}
