import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DashboardService } from '../../../services/dashboard.service';
import { AppToastService } from '../../../services/toaster.service';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-pf-models-editinfo',
  templateUrl: './pf-models-editinfo.component.html',
  styleUrls: ['./pf-models-editinfo.component.scss']
})
export class PfModelsEditinfoComponent {

  public pfModelsForm: FormGroup;

  public targetDbList = [{ name: 'DB-CLICK-HOUSE', code: 'DB-CLICK-HOUSE' }, { name: 'DB-MYSQL', code: 'DB-MYSQL' }];
  public apptermsList = [{ name: 'Yes', code: 'true' }, { name: 'No', code: 'false' }];
  public selectedModelType: any = 'MT-QRY';

  public modelTypes: any = [];

  constructor(public form: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, public dashboardService: DashboardService,
    public toastr: AppToastService, public thisDialogRef: MatDialogRef<any>, public commonService: CommonService) { }


  ngOnInit(): void {

    if (this.data) {
      this.getModelTypeData(this.data.modelTypeId);
    }

    this.commonService.getAppTerms('ModelType').subscribe(res => {
      this.modelTypes = this.data ? res.results : res.results.filter(m => m.code !== 'MT-RPT');
    });

    this.buildForm();
  }

  public buildForm() {
    this.pfModelsForm = this.form.group({
      pfname: [this.data?.name ?? null, Validators.required],
      modelTypeName: [this.data?.modelTypeId ?? 'MT-QRY', Validators.required],
      entity: [this.data?.entity ?? null],
      entityColumn: [this.data?.entityColumn ?? null],
      entityTable: [this.data?.entityTable ?? null],
      targetDb: [this.data?.targetDb ?? null],
      inputParams: [this.data?.inputParams ?? null],
      outputParams: [this.data?.outputParams ?? null],
      queryString: [this.data?.queryString ?? null],
      pfurl: [this.data?.url ?? null],
      isAppTerm: [this.data?.isAppterm ?? true],
      configKeyId: [this.data?.configKeyId ?? null],
      actionType: [this.data?.actionType ?? null]
    });
  }

  getModelTypeData(data) {
    this.selectedModelType = data;
  }


  savePfModel() {
    const modelType = this.modelTypes.find(m => m.code === this.pfModelsForm.value.modelTypeName);
    let createData = {
      "entity": this.pfModelsForm.value.entity,
      "entityColumn": this.pfModelsForm.value.entityColumn,
      "entityTable": this.pfModelsForm.value.entityTable,
      "id": null,
      "inputParams": this.pfModelsForm.value.inputParams,
      "isActive": true,
      "isAppterm": true,
      "modelTypeId": modelType?.code,
      "modelTypeName": modelType?.value,
      "name": this.pfModelsForm.value.pfname,
      "outputParams": this.pfModelsForm.value.outputParams,
      "queryString": this.pfModelsForm.value.queryString,
      "targetDb": this.pfModelsForm.value.targetDb,
      "url": this.pfModelsForm.value.pfurl
    }
    this.dashboardService.saveNewModel(createData).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', res.message);
      } else {
        this.toastr.error('Error', res.message);
      }
      this.thisDialogRef.close('confirm');
    });
  }

  updatedPfModel() {
    const modelType = this.modelTypes.find(m => m.code === this.pfModelsForm.value.modelTypeName);
    let updatedData = {
      "entity": this.pfModelsForm.value.entity,
      "entityColumn": this.pfModelsForm.value.entityColumn,
      "entityTable": this.pfModelsForm.value.entityTable,
      "id": this.data?.id ? this.data.id : null,
      "inputParams": this.pfModelsForm.value.inputParams,
      "isActive": true,
      "isAppterm": true,
      "modelTypeId": modelType?.code,
      "modelTypeName": modelType?.value,
      "name": this.pfModelsForm.value.pfname,
      "outputParams": this.pfModelsForm.value.outputParams,
      "queryString": this.pfModelsForm.value.queryString,
      "targetDb": this.pfModelsForm.value.targetDb,
      "url": this.pfModelsForm.value.pfurl
    }
    this.dashboardService.saveupdatedModel(updatedData).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', res.message);
      } else {
        this.toastr.error('Error', res.message);
      }
      this.thisDialogRef.close('confirm');
    });
  }

}
