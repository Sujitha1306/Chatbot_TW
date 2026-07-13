import { Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../../services';
import { FormBuilder, Validators } from '@angular/forms';
import { CreateAsset } from '../../../../../ovitag/configuration/configuration.model';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
import { MY_FORMATS } from '../../confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-edit-asset',
  templateUrl: './edit-asset.component.html',
  styleUrls: ['./edit-asset.component.scss'],
  providers: [{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
              { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }]
})
export class EditAssetComponent {
  assetForm :any;
  assetTypeList =[];
  assetCategoryList =[];
  userList=[];
  departmentList = [];
  createAsset: CreateAsset;

  constructor(
  public form: FormBuilder,
  public dialogRef: MatDialogRef<EditAssetComponent>,
  public dialog: MatDialog,
  public configurationService: ConfigurationService,
  public commonService: CommonService,
  private readonly _dateFormat: DatePipe,
  public toastr: AppToastService,
  @Inject(MAT_DIALOG_DATA) public data: any
) {}

  ngOnInit(){
    this.getAppTerms();
    this.buildForm();
    const assetCategoryControl = this.assetForm.get('assetCategoryId');
    const category = this.data === '' ? assetCategoryControl?.value : this.data?.assetCategoryId;
    const getAssetTypes = (category: any) => {
    const handleResult = (results) => {
      this.assetTypeList = results.map(({ code, value }) => ({ code, value }));
      if (this.data?.assetTypeId) {
        const match = this.assetTypeList.find(type => type.code === this.data.assetTypeId);
        if (!match) {
          this.assetTypeList.unshift({code: this.data.assetTypeId,value: this.data.assetTypeName || this.data.assetTypeId});
        }
      }
    };
    if (category === null) {
      this.commonService.getAppTerms('AssetType').subscribe(res => handleResult(res.results));
    } else {
      this.commonService.getAppTermsLink(category, 'AssetType').subscribe(res => handleResult(res.results));
    }
    };

    getAssetTypes(category);

    if (assetCategoryControl) {
      assetCategoryControl.valueChanges.subscribe(category => {
        getAssetTypes(category);
        this.assetForm.controls.assetTypeId.setValue(null);
      });
    }
  }

  public buildForm() {
    this.assetForm = this.form.group({
      assetSerialNumber: [this.data?.assetSerialNumber ?? null, [Validators.required, Validators.maxLength(64)]],
      assetName: [this.data?.assetName ?? null, [Validators.required]],
      assetCategoryId: [this.data?.assetCategoryId ?? null],
      assetTypeId: [this.data?.assetTypeId ?? null, [Validators.required]],
      commissionedOn: [this.data?.commissionedOn ? new Date(this.data.commissionedOn) : null],
      manufacturer: [this.data?.manufacturer ?? null, [Validators.maxLength(64)]],
      ownerId:[this.data?.ownerId ? this.data.ownerId : null],
      ownerDepartmentId:[this.data?.ownerDepartmentId ?? null],
    })
  }

  getAppTerms() {
    this.commonService.getAppTermsVerion2('AssetCategory').subscribe(res => {
      const filteredResults = res.results.filter(
        item => item.code !== 'ASC-ALS' && item.code !== 'ASC-BLS'
      );
      this.assetCategoryList = filteredResults.map(({ code, value }) => ({ code, value }));
    });

    this.commonService.getAppTermsVerion2('AssetType').subscribe(res => {
      this.assetTypeList = res.results.map(({ code, value }) => ({ code, value }));
    });

    this.configurationService.getAssetDepartment().subscribe(res => {
      this.departmentList = res.results.map(({ id, name ,departmentType}) => ({ id, name,departmentType }))
    });

    this.configurationService.getTicketUser('', 'RT-US').subscribe(res => {
      this.userList = res.results;
    })
  }

  public saveAsset() {
    this.createAsset = new CreateAsset(null, null, null, null, null, null, null, null, null, null, null,null,
      null, null, null, null, null, null, null, null, null, null, null, null, null,null, null, null, null,null,null
      ,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, null, null, null);

    this.createAsset.assetTypeId = this.assetForm.controls['assetTypeId'].value;
    this.createAsset.assetName = this.assetForm.controls['assetName'].value;
    this.createAsset.assetSerialNumber = this.assetForm.controls['assetSerialNumber'].value;
    this.createAsset.assetCategoryId = this.assetForm.controls['assetCategoryId'].value;
    this.createAsset.manufacturer = this.assetForm.controls['manufacturer'].value;
    this.createAsset.commissionedOn = this.assetForm.controls['commissionedOn'].value!=null ?this._dateFormat.transform(this.assetForm.controls['commissionedOn'].value, 'yyyy-MM-dd'):null;
    this.createAsset.ownerId = this.assetForm.controls['ownerId'].value
    this.createAsset.ownerDepartmentId = this.assetForm.controls['ownerDepartmentId'].value;

    this.createAsset.endDate = this.data ? (this._dateFormat.transform(this.data.endDate, 'yyyy-MM-dd') ?? null) : null;
    this.createAsset.warrantyStatus = this.data?.warrantyStatus ?? null;
    this.createAsset.locationDescription = this.data?.locationDescription ?? null;
    this.createAsset.locationIdentifier = this.data?.locationIdentifier ?? null;
    this.createAsset.locationId = this.data?.locationId ?? null;
    this.createAsset.warrantyPeriod = this.data?.warrantyPeriod ?? null;
    this.createAsset.softwareVersion = this.data?.softwareVersion ?? null;
    this.createAsset.vendorName = this.data?.vendorName ?? null;
    this.createAsset.costTypeId = this.data?.costTypeId ?? null;
    this.createAsset.nextAmcDue = this.data?.nextAmcDue ?? null;
    this.createAsset.calibrationDue = this.data?.calibrationDue ?? null;
    this.createAsset.warrantyDue = this.data?.warrantyDue ?? null;
    this.createAsset.assetIdentifier = this.data?.assetIdentifier ?? [];
    this.createAsset.pmcDue = this.data?.pmcDue ?? null;
    this.createAsset.criticalityId = this.data?.criticalityId ?? null;
    this.createAsset.calibrationFreqId = this.data?.calibrationFreqId ?? null;
    this.createAsset.prevMainFreqId = this.data?.prevMainFreqId ?? null;
    this.createAsset.warrantyStatusId = this.data?.warrantyStatusId ?? null;
    this.createAsset.depreciationPercent = this.data?.depreciationPercent ?? null;
    this.createAsset.assetCost = this.data?.assetCost ?? null;
    this.createAsset.assetAdminDepartment = this.data?.assignedDepartmentId ?? null;
    this.createAsset.poDate = this.data ? (this._dateFormat.transform(this.data.poDate, 'yyyy-MM-dd') ?? null) : null;
    this.createAsset.modelId = this.data?.modelId ?? null;
    this.createAsset.productSerialNumber = this.data?.productSerialNumber ?? null;
    this.createAsset.vendorEmail = this.data?.vendorEmail ?? null;
    this.createAsset.serviceProviderName = this.data?.serviceProviderName ?? null;
    this.createAsset.depreciationTypeId = this.data?.depreciationTypeId ?? null;
    this.createAsset.accumulatedDepreciation = this.data?.accumulatedDepreciation ?? null;
    this.createAsset.currentBookValue = this.data?.currentBookValue ?? null;
    this.createAsset.fileAttachments = this.data?.attachFiles ?? [];
    this.createAsset.assignedDepartmentId = this.data?.assignedDepartmentId ?? null;
    this.createAsset.assetUserId = this.data?.assetUserId ?? null;
    this.createAsset.assetAdminEmail = this.data?.assetAdminEmail ?? null;
    this.createAsset.assetAdminContactNo = this.data?.assetAdminContactNo ?? null;
    this.createAsset.serviceAddress = this.data?.serviceAddress ?? null;
    this.createAsset.servicePersonEmail = this.data?.servicePersonEmail ?? null;
    this.createAsset.usefulLife = this.data?.usefulLife ?? null;
    this.createAsset.costCenterId = this.data?.costCenterId ?? null;
    this.createAsset.linkedAsset = this.data?.linkedAsset ?? [];
    this.createAsset.vendorContact = this.data?.vendorContact ?? null;
    this.createAsset.serviceContact = this.data?.serviceContact ?? null;
    this.createAsset.comments = this.data?.comments ?? null;
    this.createAsset.assetStatus = this.data?.assetStatus ?? null;
    this.createAsset.assetCategory1Id = this.data?.assetCategory1Id ?? null;
    this.createAsset.assetCategory2Id = this.data?.assetCategory2Id ?? null;
    this.createAsset.assetTransferTypeId = this.data?.assetTransferTypeId ?? null;
    const request = this.data?.id != null ? this.configurationService.editAsset(this.createAsset, this.data.id): this.configurationService.saveAsset(this.createAsset);
    request.subscribe({
      next: (res) => {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close()
      },
      error: (error) => {
        this.toastr.error('Error', `${error.error.message}`);
      }
    });
  }
  fixClick() {
    console.log('')
  }
}
