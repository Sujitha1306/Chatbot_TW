import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../services';
import { ManageActivityRule } from './create-activity-rule.model';
import { error } from 'console';
import { AppToastService } from '../../../services/toaster.service';
import { LookupTermService } from '../../../lookup-term.service';

@Component({
  selector: 'app-create-activity-rule',
  templateUrl: './create-activity-rule.component.html',
  styleUrls: ['./create-activity-rule.component.scss']
})
export class CreateActivityRuleComponent implements OnInit {
  public activityRuleGroup: ManageActivityRule[] = [];
  public activityRule: ManageActivityRule | null = null;
  public actRuleForm: FormGroup
  public activityList: any[];
  public activityRuleList: any[];
  public stepTypeList = [{ 'code': 'before', 'value': 'Before' }, { 'code': 'after', 'value': 'After' }, { 'code': 'failover', 'value': 'failover' }];
  public statusList = [{ 'code': true, 'value': 'Active' }, { 'code': false, 'value': 'In Active' }];
  public activitySubType: any[];
  public activityRuleData: any[] = [];
  public editingIndex: number | null = null;
  pfActivitesList: any;
  isEdit: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, private readonly commonService: CommonService,
    public configurationService: ConfigurationService, public toastr: AppToastService, public dialogRef: MatDialogRef<CreateActivityRuleComponent>,
    private readonly lookupService: LookupTermService) { }

  ngOnInit(): void {
    this.lookupService.getAppTermsWrapper('ActivitySubType').subscribe(res => {
      this.activitySubType = res.ActivitySubType ?? [];
    })
    this.getPfActivities()
    if(this.data){
      this.buildForm(this.data)
    } else {
      this.buildForm(null)
    }
    if(this.data.view === 'activityRule'){
      this.actRuleForm.get('pfActivityId').setValidators([Validators.required])
      this.actRuleForm.get('pfActivityId').updateValueAndValidity()
    }
  }

  buildForm(data?) {
    this.actRuleForm = this.form.group({
      type: [data?.type ? data.type : null],
      pfActivityId: [data?.activityId ? data.activityId : null],
      activityRuleId: [data?.ruleActivityId ? data.ruleActivityId : null, [Validators.required]],
      stepType: [data?.stepType ? data.stepType : null],
      ruleGroupNo: [data?.ruleGroupNo ? data.ruleGroupNo : null, [Validators.pattern(/^\d+(\.\d+)*$/)]],
      config: [data?.config ? data.config : null],
      duration: [data?.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : null],
      description: [data?.description ? data.description : null],
      isActive: [data?.isActive ? data.isActive : true],
      isInclude: [data?.isInclude !== null ? data.isInclude : true],
    })
  }

  getByIdActivityRule(id) {
    this.commonService.getActivityRule(id).subscribe(res => {
      this.activityRuleData = res.results;
    })
  }

  getPfActivities() {
    this.configurationService.getAllActivities(null).subscribe(res => {
      this.pfActivitesList = res.results;
      if(this.data?.type){
        this.selectedTypeActivity(this.data.type)
      }
    })
  }

  selectedTypeActivity(value) {
    this.activityList = this.pfActivitesList.filter(fil => fil.activitySubTypeId === value);
  }

  triggerAction(event) {
    if (event.key === 'edit') {
      this.editRule(event.data)
    }
  }

  parseDurationToMinutes(time: string | null): number | null {
    if (!time) return null;
    const [hrs, mins] = time.split(':').map(Number);
    return (hrs * 60) + mins;
  }

  addActivityRule() {
    const scopeType = this.actRuleForm.controls['type'].value
    const pfActivityId = this.actRuleForm.controls['pfActivityId'].value;
    const ruleId = this.actRuleForm.controls['activityRuleId'].value
    let scopeName = this.activitySubType.find(f => f.code === scopeType);
    let activitieName = this.pfActivitesList.find(f => f.id === pfActivityId);
    let activitieRuleName = this.pfActivitesList.find(f => f.id === ruleId);
    const ruleData = {
      type: this.actRuleForm.controls['type'].value,
      value: scopeName ? scopeName.value : null,
      identifyingId: this.actRuleForm.controls['pfActivityId'].value,
      identifyingType: this.data.identifyingType,
      identifyingName: activitieName ? activitieName.name : null,
      ruleActivityName: activitieRuleName ? activitieRuleName.name : null,
      ruleActivityId: this.actRuleForm.controls['activityRuleId'].value,
      ruleGroupNo: this.actRuleForm.controls['ruleGroupNo'].value,
      duration: this.actRuleForm.controls['duration'].value ? this.parseDurationToMinutes(this.actRuleForm.controls['duration'].value) : null,
      stepType: this.actRuleForm.controls['stepType'].value,
      config: this.actRuleForm.controls['config'].value,
      description: this.actRuleForm.controls['description'].value,
      isActive: this.actRuleForm.controls['isActive'].value,
      isInclude: this.actRuleForm.controls['isInclude'].value
    }
    if (ruleData.identifyingId !== null) {
      if (this.editingIndex !== null) {
        this.activityRuleData[this.editingIndex] = ruleData;
        this.editingIndex = null;
      } else {
        this.activityRuleData.push(ruleData);
      }
      this.activityRuleData = [...this.activityRuleData];
      this.editingIndex = null;
      scopeName = null;
      activitieName = null;
      this.actRuleForm.reset();
      this.actRuleForm.get('isActive')?.setValue(true);
      this.actRuleForm.get('duration')?.setValue(null);
      this.isEdit = false;
    } else {
       const data = {success: true, message: "Activity Added Successfully.", results: ruleData}
        this.toastr.success('Success', `${'Activity Rule Add successfully.'}`);
        this.dialogRef.close(data)
    }
  }

  clear() {
    this.actRuleForm.reset();
    this.actRuleForm.get('isActive')?.setValue(true);
    this.actRuleForm.get('duration')?.setValue(null)
  }

  editRule(data) {
    this.isEdit = true;
    const index = this.activityRuleData.findIndex(
      item => item === data
    );
    this.editingIndex = index;
    this.buildForm(data)
  }

  saveActivityRule() {
    this.activityRuleGroup = this.activityRuleData.map(item => new ManageActivityRule(
      item.activityId,
      item.ruleActivityId,
      item.config,
      item.duration,
      item.identifyingId,
      item.identifyingType,
      item.ruleGroupNo,
      item.stepType,
      item.type,
      item.isActive,
      item.description,
      item.isInclude
    ));
    this.commonService.saveActivityRule(this.activityRuleGroup).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  activityRuleSave() {
    this.activityRule = new ManageActivityRule(null, null, null, null, null, null, null, null, null, null, null, null);
    this.activityRule.activityId = this.actRuleForm.controls['pfActivityId'].value;
    this.activityRule.ruleActivityId = this.actRuleForm.controls['activityRuleId'].value;
    this.activityRule.config = this.actRuleForm.controls['config'].value;
    this.activityRule.duration = this.actRuleForm.controls['duration'].value ? this.parseDurationToMinutes(this.actRuleForm.controls['duration'].value) : null;
    this.activityRule.identifyingId = this.data.identifyingId ? this.data.identifyingId : this.actRuleForm.controls['pfActivityId'].value;
    this.activityRule.ruleGroupNo = this.actRuleForm.controls['ruleGroupNo'].value;
    this.activityRule.stepType = this.actRuleForm.controls['stepType'].value;
    this.activityRule.type = this.actRuleForm.controls['type'].value;
    this.activityRule.isActive = this.actRuleForm.controls['isActive'].value;
    this.activityRule.description = this.actRuleForm.controls['description'].value;
    this.activityRule.isInclude = this.actRuleForm.controls['isInclude'].value;
    this.activityRule.identifyingType = this.data.identifyingType;
    this.commonService.saveActivityRule([this.activityRule]).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateActivityRule() {
    this.activityRule = new ManageActivityRule(null,null,null,null,null,null,null,null,null,null,null,null);
    this.activityRule.ruleActivityId = this.actRuleForm.controls['activityRuleId'].value;
    this.activityRule.config = this.actRuleForm.controls['config'].value;
    this.activityRule.duration = this.actRuleForm.controls['duration'].value ? this.parseDurationToMinutes(this.actRuleForm.controls['duration'].value) : null;
    this.activityRule.identifyingId = this.data.identifyingId;
    this.activityRule.identifyingType = this.data.identifyingType;
    this.activityRule.ruleGroupNo = this.actRuleForm.controls['ruleGroupNo'].value;
    this.activityRule.stepType = this.actRuleForm.controls['stepType'].value;
    this.activityRule.type = this.actRuleForm.controls['type'].value;
    this.activityRule.isActive = this.actRuleForm.controls['isActive'].value;
    this.activityRule.description = this.actRuleForm.controls['description'].value;
    this.activityRule.isInclude = this.actRuleForm.controls['isInclude'].value;
    this.activityRule.id = this.data?.id;
    this.commonService.saveActivityRule([this.activityRule]).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

}
