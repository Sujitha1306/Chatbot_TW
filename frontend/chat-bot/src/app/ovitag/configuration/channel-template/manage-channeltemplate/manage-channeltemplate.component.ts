import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfigurationService, CommonService, DashboardService } from '../../../../shared';
import { ManageOtprocedureComponent } from '../../ot-procedure/manage-otprocedure/manage-otprocedure/manage-otprocedure.component';
import { Createchnltemp } from '../../configuration.model';
import { jsonStructureValidator } from '../../../../shared/services/arrayformatvalidators.service';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { LookupTermService } from '../../../../shared/lookup-term.service';

@Component({
  selector: 'app-manage-channeltemplate',
  templateUrl: './manage-channeltemplate.component.html',
  styleUrls: ['./manage-channeltemplate.component.scss']
})
export class ManageChanneltemplateComponent {
  public channelTemplateForm: FormGroup;
  public createchnltemp: Createchnltemp;
  // codeType: any;
  channelList: any;
  pfRuleList: any;
  pfModelList: any;
  facilityList: any;
  public ruleTypeSearch = new FormControl('');
  public ruleTypeSearchList: any[] = []; 
  public modelSearch = new FormControl('');
  public modelSearchList: any[] = []; 
 
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: AppToastService, public configurationService: ConfigurationService,
    public thisDialogRef: MatDialogRef<ManageOtprocedureComponent>, public dashboardService: DashboardService, private readonly commonService: CommonService,
    private readonly lookupService: LookupTermService) { }

  ngOnInit(): void {
    this.buildForm()
    this.lookupService.getAppTermsWrapper('NotificationType,Channel').subscribe(res => {
      // this.codeType = res.results.filter(resFilter => resFilter.groupName === 'NotificationType');
      this.channelList = res.Channel ?? [];
    });
    this.dashboardService.getAllModals().subscribe(res => {
      if (res.statusCode === 1) {
        this.pfModelList = res.results;
      }
      this.modelSearchList = [...this.pfModelList];
      this.modelSearch.valueChanges.subscribe(searchText => {
        const lower = (searchText || '').toLowerCase();
        this.modelSearchList = this.pfModelList.filter(model => model.name?.toLowerCase().includes(lower)
        );
      });
    });
    this.configurationService.getAllPfRules().subscribe(res => {
      if (res.statusCode === 1) {
        this.pfRuleList = res.results;
      }
      this.ruleTypeSearchList = [...this.pfRuleList];
      this.ruleTypeSearch.valueChanges.subscribe(searchText => {
        const lower = (searchText || '').toLowerCase();
        this.ruleTypeSearchList = this.pfRuleList.filter(model => model.ruleName?.toLowerCase().includes(lower)
        );
      });
    });
    this.commonService.getCustomerFacilitylist(null, null, 500, 0).subscribe(res => {
      if (res.statusCode === 1) {
        this.facilityList = res.results.map((item: any) => {
          const names = [item.facilityName, item.regionName, item.customerName]
            .filter(x => !!x)
            .join(', ');

          return {
            ...item,
            displayName: names || ''
          };
        });
      }
    });

  }

  isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  public buildForm() {
    let payload = this.data ? this.data.payload : null;
    payload = payload ? JSON.stringify(payload, undefined, 4) : payload;
    let schema = this.data ? this.data.schema : null;
    schema = schema ? JSON.stringify(schema, undefined, 4) : schema;

    this.channelTemplateForm = this.form.group({
      channelId: [this.data?.channelId ? this.data.channelId : null, [Validators.required]],
      // code: [this.data?.code ? this.data.code : null],
      facilityId: [this.data?.facilityId ? this.data.facilityId : null],
      status: [this.data?.isActive ? this.data.isActive : null],
      name: [this.data?.name ? this.data.name : null, [Validators.required]],
      paramCount: [this.data?.paramCount ? this.data.paramCount : null],
      payload: [payload],
      pfRuleTypeId: [this.data ? this.data.pfRuleTypeId : null],
      pfModelId: [this.data ? this.data.pfModelId : null],
      schema: [schema],
      subTypeId: [this.data ? this.data.subTypeId : null],
      templateFormat: [this.data ? this.data.templateFormat : null], 
      templateSample: [this.data ? this.data.templateSample : null],
      templateSourceId: [this.data ? this.data.templateSourceId : null],
      templateValue: [this.data ? this.data.templateValue : null, [jsonStructureValidator()]],
      value: [this.data ? this.data.value : null],
      vendorId: [this.data ? this.data.vendorId : null],
    });
  }

  saveChannelTemp() {
    const payload = JSON.parse(this.channelTemplateForm.controls.payload.value);
    const schema = JSON.parse(this.channelTemplateForm.controls.schema.value);
    this.createchnltemp = new Createchnltemp(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createchnltemp.channelId = this.channelTemplateForm.controls['channelId'].value;
    // this.createchnltemp.code = this.channelTemplateForm.controls['code'].value;
    this.createchnltemp.facilityId = this.channelTemplateForm.controls['facilityId'].value;
    this.createchnltemp.name = this.channelTemplateForm.controls['name'].value;
    this.createchnltemp.paramCount = this.channelTemplateForm.controls['paramCount'].value;
    this.createchnltemp.isActive = this.channelTemplateForm.controls['status'].value;
    this.createchnltemp.payload = payload;
    this.createchnltemp.pfRuleTypeId = this.channelTemplateForm.controls['pfRuleTypeId'].value;
    this.createchnltemp.pfModelId = this.channelTemplateForm.controls['pfModelId'].value;
    this.createchnltemp.schema = schema
    this.createchnltemp.subTypeId = this.channelTemplateForm.controls['subTypeId'].value;
    this.createchnltemp.templateFormat = this.channelTemplateForm.controls['templateFormat'].value;
    this.createchnltemp.templateSample = this.channelTemplateForm.controls['templateSample'].value;
    this.createchnltemp.templateSourceId = this.channelTemplateForm.controls['templateSourceId'].value;
    this.createchnltemp.templateValue = this.channelTemplateForm.controls['templateValue'].value;
    this.createchnltemp.vendorId = this.channelTemplateForm.controls['vendorId'].value;
    if (this.data?.id) {
      this.createchnltemp.id = this.data.id;
    }
    this.commonService.saveChannelTemplate([this.createchnltemp]).subscribe(result => {
      this.toastr.success('Success', `${result.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });
  }

}


