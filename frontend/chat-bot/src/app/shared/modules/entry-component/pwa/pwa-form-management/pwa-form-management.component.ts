import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { ConfirmDialogComponent } from '../../layout-save/layout-save.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { take } from 'rxjs/operators';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-pwa-form-management',
  templateUrl: './pwa-form-management.component.html',
  styleUrls: ['./pwa-form-management.component.scss']
})
export class PwaFormManagementComponent {
  selectedData = null;
  formTemplateList = [];
  formBuilderSource: any[] = [];   
  allData: any[] = [];            
  loading = false;
  totalRecords = 0;
  pageSize = 20;               
  currentIndex = 0;                
  displayEntityType = null;
  computedAssetName = null;
  public formTemplate: FormGroup;
  public formData = null;

  constructor(
    public form: FormBuilder,
    public dialog: MatDialog,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    public toastr: AppToastService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    if (this.data) {
      this.getFormDetails();
      this.getFormTemplate();
      this.buildForm();
      this.displayEntityType = this.data.entityType;
      if (this.data.entityType === 'Asset') {
        if (this.data?.entityData?.assetName && this.data?.entityData?.assetSerialNumber) {
          this.computedAssetName = `${this.data.entityData.assetName} (${this.data.entityData.assetSerialNumber})`;
        } else if (this.data?.entityData?.assetName) {
          this.computedAssetName = this.data.entityData.assetName;
        }
      }
    }
  }

  public buildForm() {
    this.formTemplate = this.form.group({
      formTemplateId: [null],
    });
  }

  getFormDetails() {
    this.commonService.getFormDetails(this.data.entityId, this.data.entityType?.toLowerCase(),this.data.entityId, this.data.entityType?.toLowerCase()).subscribe(res => {
        if (res.statusCode === 1) {
          this.allData = res.results.reverse();
          this.formBuilderSource = this.allData.slice(0, this.pageSize);
          this.currentIndex = this.pageSize;
        }
      });
  }

  loadMore() {
    const nextIndex = this.currentIndex + this.pageSize;
    this.formBuilderSource = [
      ...this.formBuilderSource,
      ...this.allData.slice(this.currentIndex, nextIndex)
    ];
    this.currentIndex = nextIndex;
  }

  hasMore(): boolean {
    return this.currentIndex < this.totalRecords;
  }

  getFormTemplate() {
    const departmentValue = localStorage.getItem(btoa('departmentId'));
    const departmentId = departmentValue !== null && departmentValue !== "null" ? Number(departmentValue) : null;
    const identifyingType = this.data.formTemplateType == 'FTT-LOC' ? 'categoryId' : 'assetType';
    const identifyingValue = this.data.formTemplateType == 'FTT-LOC' ? this.data.categoryId : this.data.assetTypeId;

    this.configurationService.getEntityAssociatedForms('FS-PU',this.data.formTemplateType,'QLF-ASG',departmentId,identifyingType,identifyingValue).subscribe(res => {
      if (res.statusCode == 1) {
        this.formTemplateList = res.results;
      }
    });
  }

  getFormTemplateInfo() {
    this.configurationService.getFormTemplates(this.formTemplate.controls['formTemplateId'].value).subscribe(res => {
        if (res.statusCode === 1) {
          let formEntityIndex = -1;
          let formTempData = res.results[0];
          let jsonValue = JSON.parse(formTempData.jsonValue);
          let entityFormStatusId = 'EFS-DR';

          if (jsonValue.hasOwnProperty('status') && jsonValue.status.length) {
            let statusList = this.commonService.sortByKey(jsonValue.status, 'level');
            entityFormStatusId = statusList[0]['code'];
          }

          if (jsonValue.hasOwnProperty('dataScope') && jsonValue['dataScope'] == 'type') {
            formEntityIndex = this.formBuilderSource.findIndex(res => res.pfFormTemplateId == this.formTemplate.controls['formTemplateId'].value);
          }

          if (formEntityIndex != -1) {
            let entityData = this.formBuilderSource[formEntityIndex];
            this.formBuilder(entityData);
          } else {
            this.formBuilder(null);
            this.formTemplate.reset();
          }
        }
      });
  }

  formBuilder(data) {
    if (data !== null) {
      this.formData = {
        "id": data.id,
        "entityId": this.data.entityId ?? this.data.id,
        "entityType": this.data.entityType?.toLowerCase(),
        "pfFormTemplateId": data.pfFormTemplateId,
        "content": "form",
        "entityData": this.data,
        "entityFormStatus": data['entityFormStatusId']
      };
    } else {
      const pfFormTemplateId = this.formTemplate.controls['formTemplateId'].value;
      this.formData = {
        "id": null,
        "entityId": this.data.entityId ?? this.data.id,
        "entityType": this.data.entityType?.toLowerCase(),
        "pfFormTemplateId": pfFormTemplateId,
        "content": "form",
        "entityData": this.data
      };
    }

    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: this.formData,
      panelClass: ['medium-popup'],
      height:'100%', width:'100%', maxWidth: '100%',  
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      this.formTemplate.reset();
      this.formData = null;
      this.getFormDetails();
    });
  }

  viewHistory(data) {
    this.formData = {
      "id": data.id,
      "entityId": this.data.entityId ?? this.data.id,
      "entityType": this.data.entityType?.toLowerCase(),
      "pfFormTemplateId": data.pfFormTemplateId,
      "content": "form",
      "entityData": this.formTemplate.value,
      "entityFormStatus": data['entityFormStatusId'],
      "sideBar": true
    };

    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: this.formData,
      panelClass: ['fullscreen-form-dialog'],
      height:'100%', width:'100%', maxWidth: '100%',  
      disableClose: true
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      this.formData = null;
      this.getFormDetails();
    });
  }

  deleteForm(data) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirmation-popup',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete?',
        buttonText: { ok: 'Yes', cancel: 'No' }
      }
    });

    dialogRef.afterClosed().pipe().subscribe(result => {
      if (result === "Yes") {
        let formTempId = data?.id;
        let formIndex = this.formBuilderSource.findIndex(res => res.id == formTempId);
        if (formIndex !== -1) {
          this.formBuilderSource[formIndex]['status'] = false;
          this.configurationService.updateEntiryFormTemplates(formTempId, this.formBuilderSource[formIndex])
            .subscribe(res => {
              if (res.statusCode === 1) {
                this.toastr.success('Form deleted successfully');
                this.getFormDetails();
              }
            });
        }
      }
    });
  }

  fixClick() {
    console.log('');
  }
}
