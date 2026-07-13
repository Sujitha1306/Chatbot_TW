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

import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { CommonService, ConfigurationService } from "../../../services";
import { MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { AppToastService } from "../../../services/toaster.service";


@Component({
  selector: 'app-reminder-config',
  templateUrl: './reminder-config.component.html',
  styleUrls: ['./reminder-config.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReminderConfigComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dialogType: string;
  @Input() activityData: any;
  @Input() type: string;
  @Input() entityConfigType: string;
  @Output() validityChange = new EventEmitter<any>();
  @Output() slaTempData = new EventEmitter<any>();
  public reminderForm: FormGroup;
  public notificationConfigForm: FormGroup;
  public expandedPanel: string = '';
  public channelType: any;
  public templateData: any
  public recipientType: any;
  public escalationType: any;
  public mode: any;
  public reminderNotifi: any[] = [];
  public slaNotifi: any[] = [];
  public slaReminderNotifi: any[] = [];
  public escalationL1Notifi: any[] = [];
  public escalationL2Notifi: any[] = [];
  public scheduledNotifi: any[] = [];
  public alertNotification = [];
  public previous
  inchargeList: any;
  inchargeEnabled: boolean = false;
  toHit: any = false;
  roleList: any;
  roleListEsc1: any;
  roleListEsc2: any;
  departmentList: any;
  departmentListEsc1: any;
  departmentListEsc2: any;
  channelName: any;
  escalationL1Enabled: boolean = false;
  escalationL1List: any;
  escalationL2List: any;
  escalationL2Enabled: boolean =false;
  slaData: any = null;
  panelToTypeMap: Record<string, string> = {
    'reminder': 'NT-RM',
    'sla': 'NT-SLA',
    'slaReminder': 'NT-SLR',
    'escalationLevel1': 'NT-ES1',
    'escalationLevel2': 'NT-ES2',
    'scheduleReminder': 'NT-SRM'
  };
  defaultNotificationData = [{
    channel: 'CH-NO',
    channelName: 'Notification',
    identifyingId: null,
    identifyingName: null,
    identifyingType: 'RT-EO',
    identifyingTypeName: 'Entity Owner',
    notificationTypeId: null,
    notificationTypeName: null,
    channelTemplateId: null,
    templateName: null
  }, {
    channel: 'CH-NO',
    channelName: 'Notification',
    identifyingId: null,
    identifyingName: null,
    identifyingType: 'RT-EP',
    identifyingTypeName: 'Entity Performer',
    notificationTypeId: null,
    notificationTypeName: null,
    channelTemplateId: null,
    templateName: null
  }, {
    channel: 'CH-EM',
    channelName: 'Email',
    identifyingId: null,
    identifyingName: null,
    identifyingType: 'RT-EO',
    identifyingTypeName: 'Entity Owner',
    notificationTypeId: null,
    notificationTypeName: null,
    channelTemplateId: null,
    templateName: null
  }, {
    channel: 'CH-EM',
    channelName: 'Email',
    identifyingId: null,
    identifyingName: null,
    identifyingType: 'RT-EP',
    identifyingTypeName: 'Entity Performer',
    notificationTypeId: null,
    notificationTypeName: null,
    channelTemplateId: null,
    templateName: null
  }]
  dublicateNotification: boolean = false;
  currentType = 'NT-RM';
  identifyingId = null;
  notificationConfigFormDirty: boolean = false;
  private formSubscription: Subscription;
  public defaultAlertRecipients = [
    {
      "channel": "CH-NO",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EO",
      "identifyingTypeName": "Entity Owner",
      "channelName": "Notification",
      "channelTemplateName": "Reminder",
      "notificationTypeId": "NT-RM",
      "notificationTypeName": "Reminder",
    },
    {
      "channel": "CH-NO",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EP",
      "identifyingTypeName": "Entity Performer",
      "channelName": "Notification",
      "channelTemplateName": "Reminder",
      "notificationTypeId": "NT-RM",
      "notificationTypeName": "Reminder",
    },
    {
      "channel": "CH-EM",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EO",
      "identifyingTypeName": "Entity Owner",
      "channelName": "Email",
      "channelTemplateName": "Reminder",
      "notificationTypeId": "NT-RM",
      "notificationTypeName": "Reminder",
    },
    {
      "channel": "CH-EM",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EP",
      "identifyingTypeName": "Entity Performer",
      "channelName": "Email",
      "channelTemplateName": "Reminder",
      "notificationTypeId": "NT-RM",
      "notificationTypeName": "Reminder",
    },
    {
      "channel": "CH-NO",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EO",
      "identifyingTypeName": "Entity Owner",
      "channelName": "Notification",
      "channelTemplateName": "SLA",
      "notificationTypeId": "NT-SLA",
      "notificationTypeName": "Sla",
    },
    {
      "channel": "CH-NO",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EP",
      "identifyingTypeName": "Entity Performer",
      "channelName": "Notification",
      "channelTemplateName": "SLA",
      "notificationTypeId": "NT-SLA",
      "notificationTypeName": "Sla",
    },
    {
      "channel": "CH-EM",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EO",
      "identifyingTypeName": "Entity Owner",
      "channelName": "Email",
      "channelTemplateName": "SLA",
      "notificationTypeId": "NT-SLA",
      "notificationTypeName": "Sla",
    },
    {
      "channel": "CH-EM",
      "identifyingId": null,
      "identifyingName": null,
      "identifyingType": "RT-EP",
      "identifyingTypeName": "Entity Performer",
      "channelName": "Email",
      "channelTemplateName": "SLA",
      "notificationTypeId": "NT-SLA",
      "notificationTypeName": "Sla",
    }
  ]
  notificationChannel: any;
  emailChannel: any;
  constructor(public fb: FormBuilder, private readonly commonService: CommonService, private readonly configurationService: ConfigurationService,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>, private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.buildForm()
    this.commonService.getAppTerms('Channel,RecipientType').subscribe(res => {
      this.channelType = res.results.filter(resFilter => resFilter.groupName === 'Channel');
      this.recipientType = res.results.filter(resFilter => resFilter.groupName === 'RecipientType' && (resFilter.code !== 'RT-AS' && resFilter.code !== 'RT-PA'));
      this.escalationType = this.recipientType.filter(resFilter => resFilter.code === 'RT-US' || resFilter.code === 'RT-RO' || resFilter.code === 'RT-DT')
    })
    this.commonService.getAlertTemplate('CH-NO', null, 'RU-NO').subscribe(res => {
      this.notificationChannel = res.results;
      this.defaultAlertRecipients = this.defaultAlertRecipients.map(recipient => {
        const matchedChannel = this.notificationChannel.find(
          (template: any) =>
            (template.channelId === recipient.channel &&
            template.code === recipient.notificationTypeId)
        );
        if (matchedChannel) {
          return {
            ...recipient,
            channelTemplateId: matchedChannel.id,
            // channelTemplate: matchedChannel.name
          };
        }
        return recipient;
      });
    });

    this.commonService.getAlertTemplate('CH-EM', null, 'RU-NO').subscribe(res => {
      this.emailChannel = res.results;
      this.defaultAlertRecipients = this.defaultAlertRecipients.map(recipient => {
        const matchedChannel = this.emailChannel.find(
          (template: any) =>
            (template.channelId === recipient.channel &&
            template.code === recipient.notificationTypeId)
        );
        if (matchedChannel) {
          return {
            ...recipient,
            channelTemplateId: matchedChannel.id,
            // channelTemplate: matchedChannel
          };
        }
        return recipient;
      });
    });
    if (this.entityConfigType === 'pf_activity' && this.type === 'create') {
      this.getAllSla(null, this.entityConfigType)
    }
    this.validityChange.emit({'formValidation': this.reminderForm.invalid, 'editValidation': this.reminderForm.dirty});
    this.notificationConfigForm.valueChanges.subscribe(() => {
      if (this.currentType) {
        this.dublicateNotification = this.checkDuplicateNotification(this.currentType);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activityData) {
      if (this.activityData && this.type === 'create' && (this.reminderForm?.dirty || this.notificationConfigFormDirty)) {
        if (this.activityData.dataType === 'create' && this.type === 'create') {
          this.saveReminderNotification();
        } else if (this.activityData.dataType === 'update' && this.type === 'create') {
          this.saveReminderNotification();
        } else if (this.activityData.dataType === 'slaCollect' && this.type === 'create') {
          this.saveReminderNotification();
        }
      } else if(this.activityData && this.type === 'create' && this.entityConfigType === 'pf_activity') {
        if(this.activityData.hasOwnProperty('nonType') && this.activityData.nonType === 'create'){
          this.saveReminderNotification();
        }
      }
      if (this.activityData?.dataType === 'update' && this.type === 'modify' && (this.reminderForm?.dirty || this.notificationConfigFormDirty)) {
        if(this.slaData.identifyingType == this.entityConfigType){
          this.updateReminderNotification();
        } else {
          this.saveReminderNotification();
        }
      } else if((this.activityData?.dataType === 'create' || this.activityData?.dataType === 'slaCollect') && this.type === 'modify' && (this.reminderForm?.dirty || this.notificationConfigFormDirty)){
        if(this.slaData.identifyingType != this.entityConfigType){
          this.saveReminderNotification();
        }
      }
      if (this.activityData && this.activityData.hasOwnProperty('dataType')) {
        if (this.activityData?.dataType === 'get') {
          this.getAllSla(this.activityData.id, this.entityConfigType)
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }
  

  buildForm() {
    const formatDuration = (minutes: number | null): string | null => {
      if (minutes === null || isNaN(minutes)) return null;    
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const paddedHrs = hrs.toString().padStart(2, '0');
      const paddedMins = mins.toString().padStart(2, '0');    
      return `${paddedHrs}:${paddedMins}`;
    };
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.reminderForm = this.fb.group({
      reminder: [this.slaData?.reminder != null ? this.slaData?.reminder : true],
      remindType: [this.slaData?.reminderType ? this.slaData?.reminderType : 'Automatic'],
      remindThresholdStart: [this.slaData?.reminderByTime !== null ? this.slaData?.reminderByTime === 0 ? '00:00' : formatDuration(this.slaData?.reminderByTime) : '00:30',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
      remindThresholdRepeat: [this.slaData?.reminderByTimeRepeat !== null ? this.slaData?.reminderByTimeRepeat === 0 ? '00:00' : formatDuration(this.slaData?.reminderByTimeRepeat) : '00:15',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
      remindAnytimeBegin: [this.slaData?.reminderAnyTime ? this.slaData?.reminderAnyTime : '10:00'],
      remindAnytimeRepeat: [this.slaData?.reminderAnyTimeRepeat !== null ? this.slaData?.reminderAnyTimeRepeat === 0 ? '00:00' : formatDuration(this.slaData?.reminderAnyTimeRepeat) : '00:15',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
  
      sla: [this.slaData?.sla != null ? this.slaData?.sla : true],
      slaType: [this.slaData?.slaType ? this.slaData?.slaType : 'Automatic'],
      slaThreshold: [this.slaData?.slaThreshold !== null ? this.slaData?.slaThreshold === 0 ? '00:00' : formatDuration(this.slaData?.slaThreshold) : '00:15',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
  
      slaReminder: [this.slaData?.slaReminder != null ? this.slaData?.slaReminder : false],
      slaRemindType: [this.slaData?.slaReminderType ? this.slaData?.slaReminderType : 'Automatic'],
      slaRemindthreshold: [this.slaData?.slaReminderThreshold !== null ? this.slaData?.slaReminderThreshold ? '00:00' : formatDuration(this.slaData?.slaReminderThreshold) : '00:15',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
  
      escalationLevel1: [this.slaData?.escalationL1 != null ? this.slaData?.escalationL1 : false],
      esc1Type: [this.slaData?.escalationL1AssignType ? this.slaData?.escalationL1AssignType : null],
      esc1Id: [this.slaData?.escalationL1AssignName ? this.slaData?.escalationL1AssignName : null, [this.validateEscL1Selection.bind(this)]],
      esc1Threshold: [this.slaData?.escalationL1Threshold !== null ? this.slaData?.escalationL1Threshold == 0 ? '00:00' : formatDuration(this.slaData?.escalationL1Threshold) : '00:30',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
      escalationL1Anytime: [this.slaData?.escalationL1Anytime ? this.slaData?.escalationL1Anytime : '10:00'],
  
      escalationLevel2: [this.slaData?.escalationL2 != null ? this.slaData?.escalationL2 : false],
      esc2Type: [this.slaData?.escalationL2AssignType ? this.slaData?.escalationL2AssignType : null],
      esc2Id: [this.slaData?.escalationL2AssignName ? this.slaData?.escalationL2AssignName : null, [this.validateEscL2Selection.bind(this)]],
      esc2Threshold: [this.slaData?.escalationL2Threshold !== null ? this.slaData?.escalationL2Threshold === 0 ? '00:00' : formatDuration(this.slaData?.escalationL2Threshold) : '00:30',[Validators.pattern(/^\d{1,3}:[0-5][0-9]$/)]],
      escalationL2Anytime: [this.slaData?.escalationL2Anytime ? this.slaData?.escalationL2Anytime : '10:00'],
  
      scheduleReminder: [this.slaData?.scheduleReminder != null ? this.slaData?.scheduleReminder : false],
      scheduleType: [this.slaData?.scheduleReminderType ? this.slaData?.scheduleReminderType : 'Automatic'],
      scheduleDays: [this.slaData?.scheduleReminderDays ? this.slaData?.scheduleReminderDays : null],
    });

    this.notificationConfigForm = this.fb.group({
      channelId: [null, [Validators.required]],
      templateId: [null, [Validators.required]],
      recipientTypeId: [null, [Validators.required]],
      recipientId: [null, [this.validateInchargeSelection.bind(this)]],
    })
    this.formSubscription = this.reminderForm.valueChanges.subscribe(() => {
      this.validityChange.emit({'formValidation': this.reminderForm.invalid, 'editValidation': this.reminderForm.dirty});
    });
    this.initReminderDynamicValidation();
  }

  initReminderDynamicValidation(): void {
    const toggles = [
      { key: 'reminder', controls: ['remindType', 'remindThresholdStart', 'remindThresholdRepeat', 'remindAnytimeBegin', 'remindAnytimeRepeat'] },
      { key: 'sla', controls: ['slaType', 'slaThreshold'] },
      { key: 'slaReminder', controls: ['slaRemindType', 'slaRemindthreshold'] },
      { key: 'escalationLevel1', controls: ['esc1Type', 'esc1Id', 'esc1Threshold', 'escalationL1Anytime'] },
      { key: 'escalationLevel2', controls: ['esc2Type', 'esc2Id', 'esc2Threshold', 'escalationL2Anytime'] },
      { key: 'scheduleReminder', controls: ['scheduleType', 'scheduleDays'] }
    ];
  
    toggles.forEach(section => {
      const toggleControl = this.reminderForm.get(section.key);
      if (!toggleControl) return;
  
      this.setSectionValidators(section.controls, toggleControl.value);
  
      toggleControl.valueChanges.subscribe(enabled => {
        this.setSectionValidators(section.controls, enabled);
      });
    });
  }

  setValidators(key: string, type: string): void {
    this.reminderForm.controls[type].setValue(key);

    const typeToControlsMap: Record<string, string[]> = {
      remindType: [
        'remindThresholdStart',
        'remindThresholdRepeat',
        'remindAnytimeRepeat'
      ],
      slaType: ['slaThreshold'],
      slaRemindType: ['slaRemindthreshold'],
      scheduleType: ['scheduleDays']
    };

    const controls = typeToControlsMap[type] || [];

    this.setSectionValidators(controls, true);

    this.validityChange.emit({
      formValidation: this.reminderForm.invalid,
      editValidation: this.reminderForm.dirty
    });
  }
  
  private setSectionValidators(controlNames: string[], enable: boolean): void {
    const timePattern = '^\\d{1,3}:[0-5][0-9]$';
    const dayListPattern = '^([1-9]|[12][0-9]|3[01])(,([1-9]|[12][0-9]|3[01]))*$';
    const remindPatternControls = [
      'remindThresholdStart',
      'remindThresholdRepeat',
      'remindAnytimeRepeat'
    ];
    const slaPatternControls = ['slaThreshold'];
    const slaRemindPatternControls = ['slaRemindthreshold'];
    const schedulePatternControls = ['scheduleDays'];
    const escPatternControls = ['esc1Threshold', 'esc2Threshold'];

    const form = this.reminderForm;

    controlNames.forEach(name => {
      const control = form.get(name);
      if (!control) {
        return;
      }

      if (!enable) {
        control.clearValidators();
        control.updateValueAndValidity();
        return;
      }

      const validators = [Validators.required];

      if (
        remindPatternControls.includes(name) ||
        slaPatternControls.includes(name) ||
        slaRemindPatternControls.includes(name) ||
        escPatternControls.includes(name)
      ) {
        validators.push(Validators.pattern(timePattern));
      }else if(schedulePatternControls.includes(name)){
        validators.push(Validators.pattern(dayListPattern));
      }

      let typeValue: string | null = null;

      if (remindPatternControls.includes(name)) {
        typeValue = form.controls['remindType']?.value;
      } else if (slaPatternControls.includes(name)) {
        typeValue = form.controls['slaType']?.value;
      } else if (slaRemindPatternControls.includes(name)) {
        typeValue = form.controls['slaRemindType']?.value;
      } else if (schedulePatternControls.includes(name)) {
        typeValue = form.controls['scheduleType']?.value;
      }

      if (typeValue === 'Automatic') {
        control.setValidators(null);
      } else {
        control.setValidators(validators);
      }

      control.updateValueAndValidity();
    });
  }


  private validateInchargeSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.inchargeList || this.inchargeList.length === 0) {
        return { invalidIncharge: true };
      }

      let selectedUsers = this.inchargeList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedUsers) {
        return { invalidIncharge: true };
      }
    }
    return null;
  }

  private validateEscL1Selection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.escalationL1List || this.escalationL1List.length === 0) {
        return { invalidInchargeL1: true };
      }

      let selectedUsers = this.escalationL1List.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedUsers) {
        return { invalidInchargeL1: true };
      }
    }
    return null;
  }

  private validateEscL2Selection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.escalationL2List || this.escalationL2List.length === 0) {
        return { invalidInchargeL2: true };
      }

      let selectedUsers = this.escalationL2List.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedUsers) {
        return { invalidInchargeL2: true };
      }
    }
    return null;
  }

  getAllSla(id, type) {
    if(this.activityData.hasOwnProperty('reminderSla') && this.activityData.reminderSla !== null){
      this.slaData = this.activityData.reminderSla;
      if (this.slaData?.identifyingId !== null) {
        this.type = 'modify'
      } else {
        this.type = 'create'
      }
      this.alertNotification = this.slaData?.alertConfigRecipients;
      if (this.alertNotification) {
        this.reminderNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-RM');
        this.slaNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SLA');
        this.slaReminderNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SLR');
        this.escalationL1Notifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-ES1');
        this.escalationL2Notifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-ES2');
        this.scheduledNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SRM');
      }
      if (this.slaData && this.slaData?.escalationL1AssignId) {
        if (this.slaData.escalationL1AssignType === 'RT-US') {
          this.configurationService.getRoleUser(null, null, null, this.slaData.escalationL1AssignId).subscribe(res => {
            this.escalationL1List = res.results;
          })
        } else if (this.slaData.escalationL1AssignType === 'RT-RO') {
          this.configurationService.getRecipientName('', 'RT-RO').subscribe(res => {
            this.escalationL1List = res.results;
            if (this.slaData?.escalationL2AssignType) {
              this.escalationL2List = res.results
            }
          })
        } else {
          this.commonService.getAllDepartments().subscribe(res => {
            this.escalationL1List = res.results;
            if (this.slaData?.escalationL2AssignType) {
              this.escalationL2List = res.results;
            }
          })
        }
      }
      this.cdr.detectChanges;
      if (this.slaData && this.slaData?.escalationL2AssignId) {
        this.configurationService.getRoleUser(null, null, null, this.slaData.escalationL2AssignId).subscribe(res => {
          this.escalationL2List = res.results
        })
      }
        this.buildForm()
    } else {
      this.configurationService.getSlaReminder(id, type).subscribe(res => {
        this.slaData = res.results;
        if (this.slaData !== null && this.slaData?.identifyingId !== null) {
          this.type = 'modify'
        } else {
          this.type = 'create'
        }
        if(this.slaData){
          this.alertNotification = this.slaData?.alertConfigRecipients;
        } else {
          this.alertNotification = this.defaultAlertRecipients
        }
        let notificationTypeToPanelMap: Record<string, string> = {
          'NT-RM': 'reminder',
          'NT-SLA': 'sla',
          'NT-SLR': 'slaReminder',
          'NT-ES1': 'escalationLevel1',
          'NT-ES2': 'escalationLevel2',
          'NT-SRM': 'scheduleReminder'
        };

        let openRecip = this.alertNotification[0]?.notificationTypeId;
        this.expandedPanel = notificationTypeToPanelMap[openRecip];
        this.currentType = openRecip;
        
        if (this.alertNotification) {
          this.reminderNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-RM');
          this.slaNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SLA');
          this.slaReminderNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SLR');
          this.escalationL1Notifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-ES1');
          this.escalationL2Notifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-ES2');
          this.scheduledNotifi = this.alertNotification.filter(filt => filt.notificationTypeId === 'NT-SRM');
        }
        if (this.slaData && this.slaData?.escalationL1AssignId) {
          if (this.slaData.escalationL1AssignType === 'RT-US') {
            this.configurationService.getRoleUser(null, null, null, this.slaData.escalationL1AssignId).subscribe(res => {
              this.escalationL1List = res.results;
            })
          } else if (this.slaData.escalationL1AssignType === 'RT-RO') {
            this.configurationService.getRecipientName('', 'RT-RO').subscribe(res => {
              this.escalationL1List = res.results;
              if (this.slaData?.escalationL2AssignType) {
                this.escalationL2List = res.results
              }
            })
          } else {
            this.commonService.getAllDepartments().subscribe(res => {
              this.escalationL1List = res.results;
              if (this.slaData?.escalationL2AssignType) {
                this.escalationL2List = res.results;
              }
            })
          }
        }
        this.cdr.detectChanges;
        if (this.slaData && this.slaData?.escalationL2AssignId) {
          this.configurationService.getRoleUser(null, null, null, this.slaData.escalationL2AssignId).subscribe(res => {
            this.escalationL2List = res.results
          })
        }
        setTimeout(() => {
          this.buildForm()
        }, 2000)
      })
    }
  }

  getTemplateData(event){
    let channelId = event.value
    const chanelInfo = this.channelType.find(f => f.code === channelId)
    this.channelName = chanelInfo.value
    this.commonService.getAlertTemplate(channelId, null, 'RU-NO').subscribe(res => {
      if(this.currentType){
        this.templateData = res.results.filter(filt => filt.code === this.currentType);
      }
    })
  }

  togglePanel(checked: boolean | 'click', panel: string) {
    let typeId = '';
    typeId = this.panelToTypeMap[panel];
    this.currentType = typeId
    if (checked === 'click') {
      this.expandedPanel = panel;
    } else if (checked === true) {
      this.expandedPanel = panel;
      this.defaultNotification(true, typeId);
    } else {
      this.expandedPanel = '';
      if(panel === 'sla' && this.reminderForm.controls['slaReminder'].value){
        this.reminderForm.get('slaReminder').setValue(false);
        this.defaultNotification(false, 'slaReminder');
      }
      if(panel === 'escalationLevel1' && this.reminderForm.controls['escalationLevel2'].value){
        this.reminderForm.get('escalationLevel2').setValue(false);
        this.defaultNotification(false, 'escalationLevel2')
      }
      this.defaultNotification(false, typeId);
    } 
    this.templateData = [];
    this.notificationConfigForm.reset();
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

  getEscalationL1List(id) {
    if (id) {
      const escalationL1 = this as any as { id: string, name: string }[]
      const escalationL1Id = escalationL1.find(obj => obj.id === id).name;
      return escalationL1Id;
    } else {
      return '';
    }
  }

  getEscalationL2List(id) {
    if (id) {
      const escalationL2 = this as any as { id: string, name: string }[]
      const escalationL2Id = escalationL2.find(obj => obj.id === id).name;
      return escalationL2Id;
    } else {
      return '';
    }
  }

  defaultNotification(checked: boolean, type: string) {
    console.log(type)
    const typeNames = {
      'NT-RM': 'Reminder',
      'NT-SLA': 'Sla',
      'NT-SLR': 'Sla Reminder',
      'NT-ES1': 'Escalation level 1',
      'NT-ES2': 'Escalation level 2',
      'NT-SRM': 'Schedule Reminder'
    };

    const channelNotifiMap: Record<string, number> = {};
    const channelEmailMap: Record<string, number> = {};

    this.notificationChannel.forEach(channel => {
      channelNotifiMap[channel.code] = channel.id;
    });

    this.emailChannel.forEach(channel => {
      channelEmailMap[channel.code] = channel.id;
    })

    this.alertNotification = Array.isArray(this.alertNotification) ? this.alertNotification : [];
  
    const ensureArray = (arr) => Array.isArray(arr) ? arr : [];
    const typeMap = {
      'NT-RM': ensureArray(this.reminderNotifi),
      'NT-SLA': ensureArray(this.slaNotifi),
      'NT-SLR': ensureArray(this.slaReminderNotifi),
      'NT-ES1': ensureArray(this.escalationL1Notifi),
      'NT-ES2': ensureArray(this.escalationL2Notifi),
      'NT-SRM': ensureArray(this.scheduledNotifi)
    };
  
    if (checked) {
      this.defaultNotificationData.forEach(fe => {
        const alreadyInTypeMap = typeMap[type].some(item =>
          (item.identifyingType === fe.identifyingType &&
          item.notificationTypeId === type &&
          item.channelTemplateId === (fe.channel === 'CH-NO' ? channelNotifiMap[type] : channelEmailMap[type]) &&
          item.channel === fe.channel)
        );
  
        const alreadyInAlert = this.alertNotification.some(item =>
          (item.identifyingType === fe.identifyingType &&
          item.notificationTypeId === type &&
          item.channelTemplateId === (fe.channel === 'CH-NO' ? channelNotifiMap[type] : channelEmailMap[type]) && 
          item.channel === fe.channel)
        );
        console.log(typeMap[type])
        console.log(alreadyInAlert)
  
        if (!alreadyInTypeMap) {
          typeMap[type].push({
            channel: fe.channel,
            channelName: fe.channelName,
            identifyingId: null,
            identifyingName: null,
            identifyingType: fe.identifyingType,
            identifyingTypeName: fe.identifyingTypeName,
            notificationTypeId: type,
            notificationTypeName: typeNames[type],
            channelTemplateId: fe.channel === 'CH-NO' ? channelNotifiMap[type] : channelEmailMap[type],
            templateName: typeNames[type]
          });
        }
  
        if (!alreadyInAlert) {
          this.alertNotification.push({
            channel: fe.channel,
            identifyingId: fe.identifyingId,
            identifyingType: fe.identifyingType,
            notificationTypeId: type,
            channelTemplateId: fe.channel === 'CH-NO' ? channelNotifiMap[type] : channelEmailMap[type]
          });
        }
      });
      console.log(this.alertNotification)
      this.alertNotification = this.alertNotification.map(item => {
        if (item.notificationTypeId === type && 'isDeletable' in item) {
          const { isDeletable, ...rest } = item;
          return rest;
        }
        return item;
      });
  
    } else {
      this.alertNotification = this.alertNotification
      .filter(item => {
        if (item.notificationTypeId === type) {
          return item?.hasOwnProperty('pfAlertConfigRecipientId') &&
                item?.pfAlertConfigRecipientId !== null;
        }
        return true;
      })
      .map(item => {
        if (item.notificationTypeId === type) {
          return { ...item, isDeletable: true };
        }
        return item;
      });
    }
  }
  
  checkDuplicateNotification(type: string): boolean {
    const form = this.notificationConfigForm.controls;
    const recipientTypeId = form['recipientTypeId'].value;
    const templateId = form['templateId'].value;
    const channelId = form['channelId'].value;
    const recipientId = form['recipientId'].value;
    const typeMap = {
      'NT-RM': this.reminderNotifi,
      'NT-SLA': this.slaNotifi,
      'NT-SLR': this.slaReminderNotifi,
      'NT-ES1': this.escalationL1Notifi,
      'NT-ES2': this.escalationL2Notifi,
      'NT-SRM': this.scheduledNotifi
    };
  
    return typeMap[type]?.some(item => {
      console.log(recipientId)
      const idMatches =
        ['RT-US', 'RT-RO', 'RT-DT'].includes(recipientTypeId)
          ? item.identifyingId == recipientId
          : item.identifyingId == null;
      return (
        idMatches &&
        item.identifyingType === recipientTypeId &&
        item.channelTemplateId === templateId &&
        item.channel === channelId
      );
    });
  }

  selectNotificationType(type: string) {
    this.dublicateNotification = this.checkDuplicateNotification(type);
  }

  addNotificationConfig(type: string) {
    this.currentType = type;
    const form = this.notificationConfigForm.controls;
    const typeNames: Record<string, string> = {
      'NT-RM': 'Reminder',
      'NT-SLA': 'Sla',
      'NT-SLR': 'Sla Reminder',
      'NT-ES1': 'Escalation level 1',
      'NT-ES2': 'Escalation level 2',
      'NT-SRM': 'Schedule Reminder'
    };
    const typeMap = {
      'NT-RM': this.reminderNotifi,
      'NT-SLA': this.slaNotifi,
      'NT-SLR': this.slaReminderNotifi,
      'NT-ES1': this.escalationL1Notifi,
      'NT-ES2': this.escalationL2Notifi,
      'NT-SRM': this.scheduledNotifi
    };
    const template = this.templateData.find(t => t.id === form['templateId'].value);
    const recipientType = this.recipientType.find(r => r.code === form['recipientTypeId'].value);
    const recipientId = form['recipientId'].value;
    const recipient = ['RT-US', 'RT-RO', 'RT-DT'].includes(form['recipientTypeId'].value)
      ? this.inchargeList.find(r => r.id === recipientId)
      : null;

    const alreadyExists = this.checkDuplicateNotification(type);
    this.dublicateNotification = this.checkDuplicateNotification(type);
    if (!alreadyExists) {
      const allData = {
        channel: form['channelId'].value,
        channelName: this.channelName,
        identifyingId: recipientId,
        identifyingName: recipient?.name ?? null,
        identifyingType: form['recipientTypeId'].value,
        identifyingTypeName: recipientType?.value,
        notificationTypeId: type,
        notificationTypeName: typeNames[type],
        channelTemplateId: form['templateId'].value,
        templateName: template?.name,
      };
      const alertData = {
        channel: form['channelId'].value,
        identifyingId: recipientId,
        identifyingType: form['recipientTypeId'].value,
        notificationTypeId: type,
        channelTemplateId: form['templateId'].value
      };
      typeMap[type].push(allData);
      this.alertNotification = [...this.alertNotification, alertData];
    }
    this.notificationConfigFormDirty = true;
    this.notificationConfigForm.reset()
    this.dublicateNotification = false;
  }

  deleteNotificationConfig(type: string, data: any) {
    const typeMap: Record<string, keyof this> = {
      'NT-RM': 'reminderNotifi',
      'NT-SLA': 'slaNotifi',
      'NT-SLR': 'slaReminderNotifi',
      'NT-ES1': 'escalationL1Notifi',
      'NT-ES2': 'escalationL2Notifi',
      'NT-SRM': 'scheduledNotifi'
    };
  
    const arrayKey = typeMap[type];
    if (arrayKey && Array.isArray(this[arrayKey])) {
      const targetArray = this[arrayKey] as any[];
  
      const indexToRemove = targetArray.findIndex(item =>
        item.notificationTypeId === type &&
        item.channelTemplateId === data.channelTemplateId &&
        item.channel === data.channel &&
        item.identifyingId === data.identifyingId &&
        item.identifyingType === data.identifyingType
      );
  
      if (indexToRemove !== -1) {
        targetArray.splice(indexToRemove, 1);
      }
    }
  
    if (data && data.hasOwnProperty('pfAlertConfigRecipientId')) {
      const alertItem = this.alertNotification.find(item =>
        item.notificationTypeId === type &&
        item.pfAlertConfigRecipientId === data.pfAlertConfigRecipientId
      );
  
      if (alertItem) {
        if (alertItem.isDeletable) {
          delete alertItem.isDeletable;
        } else {
          alertItem.isDeletable = true;
        }
      }
    } else {
      const alertIndex = this.alertNotification.findIndex(item =>
        item.notificationTypeId === type &&
        item.channelTemplateId === data.channelTemplateId &&
        item.channel === data.channel &&
        item.identifyingId === data.identifyingId &&
        item.identifyingType === data.identifyingType
      );
  
      if (alertIndex !== -1) {
        this.alertNotification.splice(alertIndex, 1);
      }
    }
    this.notificationConfigFormDirty = true;
  }
  
  getIncharge(type, selection?) {
    if(selection === 'esc1'){
      this.reminderForm.get('esc1Id').setValue(null)
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.escalationL1List = res.results;
          this.roleListEsc1 = res.results;
          this.escalationL1Enabled = true;
        });
      } else if (type === 'RT-DT') {
        this.commonService.getAllDepartments().subscribe(res => {
            this.escalationL1List = res.results;
            this.departmentListEsc1 = res.results;
            this.escalationL1Enabled = true;
        });
      } else if(type === 'RT-US'){
        this.configurationService.getRoleUser('',null, null).subscribe(res => {
          this.escalationL1List = res.results;
          this.escalationL1Enabled = true;
        })
      } else {
        this.escalationL1List = [];
        this.roleListEsc1 = [];
        this.departmentListEsc1 = [];
        this.escalationL1Enabled = false;
      }
    } else if(selection === 'esc2'){
      this.reminderForm.get('esc2Id').setValue(null)
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.escalationL2List = res.results;
          this.escalationL2Enabled = true 
        });
      } else if (type === 'RT-DT') {
        this.commonService.getAllDepartments().subscribe(res => {
            this.escalationL2List = res.results;
            this.roleListEsc2 = res.results;
            this.escalationL2Enabled = true;
        });
      } else if(type === 'RT-US'){
        this.configurationService.getRoleUser('',null, null).subscribe(res => {
          this.escalationL2List = res.results;
          this.departmentListEsc2 = res.results;
          this.escalationL2Enabled = true;
        })
      } else {
        this.escalationL2List = [];
        this.roleListEsc2 = [];
        this.departmentListEsc2 = [];
        this.escalationL2Enabled = false;
      }
    } else {
      this.notificationConfigForm.get('recipientId').setValue(null);
      if(['RT-RO', 'RT-US', 'RT-DT'].includes(type)){
        this.notificationConfigForm.get('recipientId').setValidators([Validators.required, this.validateInchargeSelection.bind(this)]);
      } else {
        this.notificationConfigForm.get('recipientId').setValidators(null);
      }
      this.notificationConfigForm.get('recipientId').updateValueAndValidity();
      if (type === 'RT-RO') {
        this.configurationService.getRecipientName('', type).subscribe(res => {
          this.inchargeList = res.results;
          this.roleList = res.results;
          this.inchargeEnabled = true;
        });
      } else if (type === 'RT-DT') {
        this.commonService.getAllDepartments().subscribe(res => {
            this.inchargeList = res.results;
            this.departmentList = res.results;
            this.inchargeEnabled = true;
        });
      } else {
        this.inchargeList = [];
        this.inchargeEnabled = false;
      }
    }
    this.dublicateNotification = false;
    if(!['RT-RO', 'RT-US', 'RT-DT'].includes(type)){
      this.selectNotificationType(this.currentType);
    }
  }

  searchUserNamelist(event) {
    this.dublicateNotification = false;
    this.toHit = event.toHit;
    const type = this.notificationConfigForm.controls['recipientTypeId'].value 
    if (type === 'RT-US') {
      if (this.toHit === true && event.text.length >= 2) {
        this.configurationService.getRoleUserByText(event.text).subscribe(res => {
          this.inchargeList = res.results;
          this.inchargeEnabled = true;
        });
      }
    } else if (type === 'RT-RO') {
      this.inchargeList = this.roleList;
      this.inchargeEnabled = true;
    } else if (type === 'RT-DT') {
      this.inchargeList = this.departmentList;
      this.inchargeEnabled = true;
    } else {
      this.inchargeList = [];
      this.inchargeEnabled = false;
    }
    this.selectNotificationType(this.currentType);
  }

  escalationL1UserNames(event) {
    let toHit = event.toHit;
    const type = this.reminderForm.controls['esc1Type'].value; 
    if (type === 'RT-US') {
      if (toHit === true && event.text.length >= 2) {
        this.configurationService.getRoleUserByText(event.text).subscribe(res => {
          this.escalationL1List = res.results;
          this.escalationL1Enabled = true;
        });
      } else {
        this.escalationL1List = [];
        this.escalationL1Enabled = false;
      }
    } else if (type === 'RT-RO') {
      this.escalationL1List = this.roleListEsc1;
      this.escalationL1Enabled = true;
    } else if (type === 'RT-DT') {
      this.escalationL1List = this.departmentListEsc1;
      this.escalationL1Enabled = true;
    } else {
      this.escalationL1List = [];
      this.escalationL1Enabled = false;
    }
  }

  escalationL2UserNames(event) {
    let toHit = event.toHit;
    const type = this.reminderForm.controls['esc2Type'].value;
    if (type === 'RT-US') {
      if (toHit === true && event.text.length >= 2) {
        this.configurationService.getRoleUserByText(event.text).subscribe(res => {
          this.escalationL2List = res.results;
          this.escalationL2Enabled = true;
        });
      } else {
        this.escalationL2List = [];
        this.escalationL2Enabled = false;
      }
    } else if (type === 'RT-RO') {
      this.escalationL2List = this.roleList;
      this.escalationL2Enabled = true;
    } else if (type === 'RT-DT') {
      this.escalationL2List = this.departmentList;
      this.escalationL2Enabled = true;
    } else {
      this.escalationL2List = [];
      this.escalationL2Enabled = false;
    }
  }

  saveReminderNotification(){
    const parseDuration = (time: string | null): number | null => {
      if (!time) return null;
      const [hrs, mins] = time.split(':').map(Number);
      return hrs * 60 + mins;
    };
    const to24Hour = (time: string | null): string | null => {
      if (!time) return null;
      const parts = time.trim().split(' ');
      const t = parts[0];
      const mod = parts[1]?.toLowerCase() ?? 'am';

      const [hStr, mStr] = t.split(':');
      if (!hStr || !mStr) return null;

      let h = Number(hStr);
      const m = Number(mStr);

      if (isNaN(h) || isNaN(m)) return null;

      if (mod === 'pm' && h !== 12) h += 12;
      if (mod === 'am' && h === 12) h = 0;
      const hours = h.toString().padStart(2, '0');
      const minutes = m.toString().padStart(2, '0');
      const seconds = '00';

      return `${hours}:${minutes}:${seconds}`;
    };
    const form = this.reminderForm.controls;
    const escalationL1Threshold = form['esc1Threshold'].value ?  parseDuration(this.reminderForm.controls['esc1Threshold'].value) : null;
    const escalationL2Threshold = form['esc2Threshold'].value ? parseDuration(this.reminderForm.controls['esc2Threshold'].value) : null;
    const reminderAnyTimeRepeat = form['remindAnytimeRepeat'].value ? parseDuration(this.reminderForm.controls['remindAnytimeRepeat'].value) : null;
    const remindThresholdStart = form['remindThresholdRepeat'].value ? parseDuration(this.reminderForm.controls['remindThresholdStart'].value) : null;
    const reminderByTimeRepeat = form['remindThresholdRepeat'].value ? parseDuration(this.reminderForm.controls['remindThresholdRepeat'].value) : null;
    const slaThreshold = form['slaThreshold'].value ? parseDuration(this.reminderForm.controls['slaThreshold'].value) : null;
    const slaReminderThreshold = form['slaRemindthreshold'].value ? parseDuration(this.reminderForm.controls['slaRemindthreshold'].value) : null;
    let reminder = this.reminderForm.controls['reminder'].value;
    let sla = this.reminderForm.controls['sla'].value;
    let slaReminder = this.reminderForm.controls['slaReminder'].value;
    let escalationL1 = this.reminderForm.controls['escalationLevel1'].value;
    let escalationL2 = this.reminderForm.controls['escalationLevel2'].value;
    let scheduleReminder = this.reminderForm.controls['scheduleReminder'].value;
    let reminderType  = this.reminderForm.controls['remindType'].value;
    let slaType = this.reminderForm.controls['slaType'].value;
    let slaReminderType = this.reminderForm.controls['slaRemindType'].value;
    let scheduleType = this.reminderForm.controls['scheduleType'].value;
    let reminderData = {
      "alertConfigRecipients": this.alertNotification,
      "escalationL1": this.reminderForm.controls['escalationLevel1'].value,
      "escalationL1AssignId": escalationL1 ? this.reminderForm.controls['esc1Id'].value ? typeof this.reminderForm.controls['esc1Id'].value === 'string' ? 
                              this.slaData?.escalationL1AssignId : this.reminderForm.controls['esc1Id'].value : null : null,
      "escalationL1AssignType": escalationL1 ? this.reminderForm.controls['esc1Type'].value : null,
      "escalationL1Threshold": escalationL1 ? escalationL1Threshold : null,
      "escalationL1Anytime": escalationL1 ? to24Hour(this.reminderForm.controls['escalationL1Anytime'].value) : null,
      "escalationL2": this.reminderForm.controls['escalationLevel2'].value,
      "escalationL2AssignId": escalationL2 ? this.reminderForm.controls['esc2Id'].value ? typeof this.reminderForm.controls['esc2Id'].value === 'string' ? 
                              this.slaData?.escalationL2AssignId : this.reminderForm.controls['esc2Id'].value : null : null,
      "escalationL2AssignType": escalationL2 ? this.reminderForm.controls['esc2Type'].value : null,
      "escalationL2Threshold": escalationL2 ? escalationL2Threshold : null,
      "escalationL2Anytime": escalationL2 ? to24Hour(this.reminderForm.controls['escalationL2Anytime'].value) : null,
      "identifyingId": this.activityData?.id,
      "identifyingType": this.entityConfigType,
      "reminder": this.reminderForm.controls['reminder'].value,
      "reminderAnyTime": reminder ? (reminderType !== 'Automatic' ? to24Hour(this.reminderForm.controls['remindAnytimeBegin'].value) : null) : null,
      "reminderAnyTimeRepeat": reminder ? (reminderType !== 'Automatic' ? reminderAnyTimeRepeat : null) : null,
      "reminderByTime": reminder ? (reminderType !== 'Automatic' ? remindThresholdStart : null) : null,
      "reminderByTimeRepeat": reminder ? (reminderType !== 'Automatic' ? reminderByTimeRepeat : null) : null,
      "reminderType": reminder ? this.reminderForm.controls['remindType'].value : null,
      "scheduleReminder": this.reminderForm.controls['scheduleReminder'].value,
      "scheduleReminderDays":  scheduleReminder ? (scheduleType !== 'Automatic' ? this.reminderForm.controls['scheduleDays'].value : null) : null,
      "scheduleReminderType": scheduleReminder ? this.reminderForm.controls['scheduleType'].value : null,
      "sla": this.reminderForm.controls['sla'].value,
      "slaReminder": this.reminderForm.controls['slaReminder'].value,
      "slaReminderThreshold": slaReminder ? (slaReminderType !== 'Automatic' ? slaReminderThreshold : null) : null,
      "slaReminderType": slaReminder ? this.reminderForm.controls['slaRemindType'].value : null,
      "slaThreshold": sla ? (slaType !== 'Automatic' ?  slaThreshold : null) : null,
      "slaType": sla ? this.reminderForm.controls['slaType'].value : null
    }
    if(this.activityData?.dataType !== 'slaCollect'){
      this.configurationService.saveSlaReminder(reminderData).subscribe(res =>{
        if(res.statusCode == 1){
          this.toastr.success('Success', `${res.message}`);
          // this.thisDialogRef.close('confirm');
        }
      })
    } else {
      this.slaTempData.emit(reminderData)
      this.toastr.success('Success', `${'SLA Notification Add successfully'}`);
    }
  }

  updateReminderNotification(){
    const parseDuration = (time: string | null): number | null => {
      if (!time) return null;
      const [hrs, mins] = time.split(':').map(Number);
      return hrs * 60 + mins;
    };
     const to24Hour = (time: string | null): string | null => {
      if (!time) return null;
      const parts = time.trim().split(' ');
      const t = parts[0];
      const mod = parts[1]?.toLowerCase() ?? 'am';

      const [hStr, mStr] = t.split(':');
      if (!hStr || !mStr) return null;

      let h = Number(hStr);
      const m = Number(mStr);

      if (isNaN(h) || isNaN(m)) return null;

      if (mod === 'pm' && h !== 12) h += 12;
      if (mod === 'am' && h === 12) h = 0;
      const hours = h.toString().padStart(2, '0');
      const minutes = m.toString().padStart(2, '0');
      const seconds = '00';

      return `${hours}:${minutes}:${seconds}`;
    };
    const form = this.reminderForm.controls;
    const escalationL1Threshold = form['esc1Threshold'].value ?  parseDuration(this.reminderForm.controls['esc1Threshold'].value) : null;
    const escalationL2Threshold = form['esc2Threshold'].value ? parseDuration(this.reminderForm.controls['esc2Threshold'].value) : null;
    const reminderAnyTimeRepeat = form['remindAnytimeRepeat'].value ? parseDuration(this.reminderForm.controls['remindAnytimeRepeat'].value) : null;
    const remindThresholdStart = form['remindThresholdRepeat'].value ? parseDuration(this.reminderForm.controls['remindThresholdStart'].value) : null;
    const reminderByTimeRepeat = form['remindThresholdRepeat'].value ? parseDuration(this.reminderForm.controls['remindThresholdRepeat'].value) : null;
    const slaThreshold = form['slaThreshold'].value ? parseDuration(this.reminderForm.controls['slaThreshold'].value) : null;
    const slaReminderThreshold = form['slaRemindthreshold'].value ? parseDuration(this.reminderForm.controls['slaRemindthreshold'].value) : null;
    let reminder = this.reminderForm.controls['reminder'].value;
    let sla = this.reminderForm.controls['sla'].value;
    let slaReminder = this.reminderForm.controls['slaReminder'].value;
    let escalationL1 = this.reminderForm.controls['escalationLevel1'].value;
    let escalationL2 = this.reminderForm.controls['escalationLevel2'].value;
    let scheduleReminder = this.reminderForm.controls['scheduleReminder'].value;
    let reminderType  = this.reminderForm.controls['remindType'].value;
    let slaType = this.reminderForm.controls['slaType'].value;
    let slaReminderType = this.reminderForm.controls['slaRemindType'].value;
    let scheduleType = this.reminderForm.controls['scheduleType'].value;
    let updateReminderData = {
      "alertConfigRecipients": this.alertNotification,
      "escalationL1": this.reminderForm.controls['escalationLevel1'].value,
      "escalationL1AssignId": escalationL1 ? this.reminderForm.controls['esc1Id'].value ? typeof this.reminderForm.controls['esc1Id'].value === 'string' ? 
                              this.slaData?.escalationL1AssignId : this.reminderForm.controls['esc1Id'].value : null : null,
      "escalationL1AssignType": escalationL1 ? this.reminderForm.controls['esc1Type'].value : null,
      "escalationL1Threshold": escalationL1 ? escalationL1Threshold : null,
      "escalationL1Anytime": escalationL1 ? to24Hour(this.reminderForm.controls['escalationL1Anytime'].value) : null,
      "escalationL2": this.reminderForm.controls['escalationLevel2'].value,
      "escalationL2AssignId": escalationL2 ? this.reminderForm.controls['esc2Id'].value ? typeof this.reminderForm.controls['esc2Id'].value === 'string' ? 
                              this.slaData?.escalationL2AssignId : this.reminderForm.controls['esc2Id'].value : null : null,
      "escalationL2AssignType": escalationL2 ? this.reminderForm.controls['esc2Type'].value : null,
      "escalationL2Threshold": escalationL2 ? escalationL2Threshold : null,
      "escalationL2Anytime": escalationL2 ? to24Hour(this.reminderForm.controls['escalationL2Anytime'].value) : null,
      "identifyingId": this.activityData?.id,
      "identifyingType": this.entityConfigType,
      "reminder": this.reminderForm.controls['reminder'].value,
      "reminderAnyTime": reminder ? (reminderType !== 'Automatic' ? to24Hour(this.reminderForm.controls['remindAnytimeBegin'].value) : null) : null,
      "reminderAnyTimeRepeat": reminder ? (reminderType !== 'Automatic' ? reminderAnyTimeRepeat : null) : null,
      "reminderByTime": reminder ? (reminderType !== 'Automatic' ? remindThresholdStart : null) : null,
      "reminderByTimeRepeat": reminder ? (reminderType !== 'Automatic' ? reminderByTimeRepeat : null) : null,
      "reminderType": reminder ? this.reminderForm.controls['remindType'].value : null,
      "scheduleReminder": this.reminderForm.controls['scheduleReminder'].value,
      "scheduleReminderDays":  scheduleReminder ? (scheduleType !== 'Automatic' ? this.reminderForm.controls['scheduleDays'].value : null) : null,
      "scheduleReminderType": scheduleReminder ? this.reminderForm.controls['scheduleType'].value : null,
      "sla": this.reminderForm.controls['sla'].value,
      "slaReminder": this.reminderForm.controls['slaReminder'].value,
      "slaReminderThreshold": slaReminder ? (slaReminderType !== 'Automatic' ? slaReminderThreshold : null) : null,
      "slaReminderType": slaReminder ? this.reminderForm.controls['slaRemindType'].value : null,
      "slaThreshold": sla ? (slaType !== 'Automatic' ?  slaThreshold : null) : null,
      "slaType": sla ? this.reminderForm.controls['slaType'].value : null
    }
    this.configurationService.updateSlaReminder(this.slaData?.id,updateReminderData).subscribe(res =>{
      if(res.statusCode == 1){
        this.toastr.success('Success', `${res.message}`);
        // this.thisDialogRef.close('confirm');
      }
    })
  }
  fixClick() {
    console.log('')
  }
}
