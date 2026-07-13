import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService, CommonService, ConfigurationService, WorkflowService } from '../../../../services';
import { AppToastService } from '../../../../services/toaster.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-tag-associate',
  templateUrl: './tag-associate.component.html',
  styleUrls: ['./tag-associate.component.scss'],
  encapsulation : ViewEncapsulation.None
})
export class TagAssociateComponent implements OnInit {
  public form: FormGroup;
  public tagList: any[] = [];
  public assetList: any[] = [];
  public selectedAsset: any = null;
  public deliveryDetail: any;
  public associationType: string = 'tag';
  public isAssociated: boolean = false;
  public selectedTabIndex: number = 0;
  public enableTracking = false;
  public salesOrderIdentifier: string = '';

  public trackingOptions: any = {
    show: {
      navbar: false,
      navMenu: false,
      blockSelect: true,
      floorSelect: true,
      searchBox: false,
      navBlkImg: false,
      navBlkContent: false,
      navBlkList: false,
      filterOption: false,
      mobileView: false,
      editable: false,
      header: false
    }
  };

  public tagFloorSelect: any = null;
  public tagLocationInfo: { blockName: string; floorName: string; locationName: string } | null = null;

  public today = new Date();
  public fromDate: string;
  public toDate: string;
  public dateHistoryForm: FormGroup;
  public movementData: any[] = [];
  public movementDisplayedColumns: string[] = ['Asset Name', 'Location', 'From Time', 'To Time', 'Duration'];
  public movementLength: number = 0;
  public movementPageSize: number = 50;
  public movementPageStart: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<TagAssociateComponent>,
    private readonly apiService: ApiService,
    private readonly workflowService: WorkflowService,
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    private readonly fb: FormBuilder,
    private readonly dateFormat: DatePipe,
    public toastr: AppToastService
  ) {}

  ngOnInit(): void {
    this.deliveryDetail = this.data?.deliveryDetail || null;
    this.salesOrderIdentifier = this.data?.salesOrderIdentifier || '';
    this.isAssociated = !!(this.deliveryDetail?.tagId || this.deliveryDetail?.assetId);
    this.buildForm();
    this.buildDateForm();
    if (this.isAssociated) {
      this.selectedTabIndex = 0;
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      type: ['tag'],
      tagId: [null],
      assetId: [null],
      assetDisplay: [null]
    });
  }

  private buildDateForm(): void {
    const todayStr = this.dateFormat.transform(new Date(), 'yyyy-MM-dd');
    this.fromDate = todayStr;
    this.toDate = todayStr;
    this.dateHistoryForm = this.fb.group({
      fromDate: [todayStr],
      toDate: [todayStr]
    });
  }

  tabChanged(event: any): void {
    this.selectedTabIndex = event.index;
    if (event.index === 1) {
      this.enableTracking = false;
      this.tagFloorSelect = null;
      this.tagLocationInfo = null;
      const tagId = this.deliveryDetail?.tagId;
      if (tagId) {
        const param = '/cloc=1&tid=' + tagId + '&ttype=TAT-AS';
        this.commonService.getReportData('totaltimebyloc', param).subscribe(
          res => {
            if (res?.results?.statusCode === 200 && res.results?.data?.length) {
              const d = res.results.data[0];
              this.tagFloorSelect = d.floor_id ? parseInt(d.floor_id) : null;
              this.tagLocationInfo = {
                blockName: d.blockName || null,
                floorName: d.floorName || null,
                locationName: d.location_name || null
              };
            }
            setTimeout(() => { this.enableTracking = true; }, 100);
          },
          () => { setTimeout(() => { this.enableTracking = true; }, 100); }
        );
      } else {
        setTimeout(() => { this.enableTracking = true; }, 500);
      }
    }
    if (event.index === 2) {
      this.getMovementHistory();
    }
  }

  setType(type: string): void {
    this.associationType = type;
    this.form.patchValue({ type, tagId: null, assetId: null, assetDisplay: null });
    this.tagList = [];
    this.assetList = [];
    this.selectedAsset = null;
  }

  searchTag(event: any): void {
    const term = (event?.text || event?.target?.value || '').trim();
    if (term.length < 2) {
      this.tagList = [];
      return;
    }
    const url = environment.base_value.search_non_associate_tag + '?tagId=' + term + '&status=Active';
    this.apiService.get(url).subscribe((res: any) => {
      this.tagList = res.results || [];
    });
  }

  onTagSelect(tag: any): void {
    this.form.patchValue({ tagId: tag.tagId });
  }

  searchAsset(event: any): void {
    const term = (event?.text || event?.target?.value || '').trim();
    if (term.length < 2) {
      this.assetList = [];
      return;
    }
    this.workflowService.getAssetLocationDetails(term, 0, 20, null, null, null, null, null, null, null, null, null, true).subscribe(res => {
      this.assetList = res.results || [];
    });
  }

  onAssetSelect(asset: any): void {
    this.selectedAsset = asset;
    this.form.patchValue({
      assetId: asset.id || asset.assetId,
      assetDisplay: asset.assetName + ' (' + (asset.tagSerialNumber || 'No tag') + ')'
    });
  }

  associate(): void {
    if (this.associationType === 'tag' && !this.form.value.tagId) {
      this.toastr.error('Error', 'Please select a tag');
      return;
    }
    if (this.associationType === 'asset' && !this.form.value.assetId) {
      this.toastr.error('Error', 'Please select an asset');
      return;
    }
    const id = this.deliveryDetail?.id || this.data?.id;
    if (!id) {
      this.toastr.error('Error', 'Delivery detail ID not found');
      return;
    }
    const payload: any = {
      itemMasterId: this.deliveryDetail?.itemMasterId || this.data?.itemMasterId
    };
    if (this.associationType === 'tag') {
      payload.tagId = this.form.value.tagId;
    } else {
      payload.assetId = this.form.value.assetId;
      if (this.selectedAsset?.tagSerialNumber) {
        payload.tagId = this.selectedAsset.tagSerialNumber;
      }
    }
    this.workflowService.updateDeliveryDetail(id, payload).subscribe(
      res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', 'Associated successfully');
          this.dialogRef.close('confirm');
        }
      },
      error => this.toastr.error('Error', error.error?.message || 'Failed to associate')
    );
  }

  disassociate(): void {
    const id = this.deliveryDetail?.id || this.data?.id;
    if (!id) {
      this.toastr.error('Error', 'Delivery detail ID not found');
      return;
    }
    this.workflowService.updateDeliveryDetail(id, { tagId: null, assetId: null, itemMasterId: this.deliveryDetail?.itemMasterId || this.data?.itemMasterId }).subscribe(
      res => {
        if (res.statusCode === 1) {
          this.toastr.success('Success', 'Disassociated successfully');
          this.dialogRef.close('confirm');
        }
      },
      error => this.toastr.error('Error', error.error?.message || 'Failed to disassociate')
    );
  }

  getMovementHistory(): void {
    const id = this.deliveryDetail?.id || this.data?.id;
    const identifier = this.deliveryDetail?.assetId || this.deliveryDetail?.tagId;
    if (!identifier) {
      this.movementData = [];
      return;
    }
    const fDate = this.dateHistoryForm?.controls?.fromDate?.value || this.fromDate;
    const tDate = this.dateHistoryForm?.controls?.toDate?.value || this.toDate;
    this.configurationService.getAllMovementHistory(fDate, tDate, identifier, 'TAT-AS', this.movementPageStart, this.movementPageSize).subscribe(res => {
      const records = res?.results?.data?.['Location History'] || res?.results || [];
      this.movementData = (records || []).map((item: any) => ({
        'Asset Name': item['Name'],
        'Location': item['Location Name'],
        'From Time': item['From Date'],
        'To Time': item['To Date'],
        'Duration': item['Duration']
      }));
      this.movementLength = records.length;
    });
  }

  goMovementHistory(): void {
    this.movementPageStart = 0;
    this.getMovementHistory();
  }

  movementEventAction(event: any): void {
    if (event.key === 'pagination') {
      this.movementPageSize = event.data.pageSize;
      this.movementPageStart = event.data.pageIndex;
      this.getMovementHistory();
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
