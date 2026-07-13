import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { WorkflowService, CommonService, ConfigurationService } from '../../../../services';
import { ManagePwaInfoComponent, ManagePwaTaskComponent } from '../manage-pwa-task/manage-pwa-task.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-pwa-ticket',
  templateUrl: './pwa-ticket.component.html',
  styleUrls: ['./pwa-ticket.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PwaTicketComponent {

  selectedData = null;
  visibleData = [];
  loading = false;
  debounceTimer: any;
  totalRecords = null;
  displayEntityType = null;
  computedAssetName = null;
  taskData = null;
  constructor(
    public dialog: MatDialog,
    public commonService: CommonService,
    public configurationService: ConfigurationService,
    public workflowService : WorkflowService,
    private readonly bottomSheet: MatBottomSheet,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    if (this.data) {
      this.displayEntityType = this.data.entityType || 'Asset';
      this.getEntityTicketDetails(this.data.entityId, this.data.entityType)
    if(this.data.entityType ==='Asset'){
      if (this.data?.entityData?.assetName && this.data?.entityData?.assetSerialNumber) {
        this.computedAssetName = `${this.data.entityData.assetName} (${this.data.entityData.assetSerialNumber})`;
      } else if (this.data?.entityData?.assetName) {
        this.computedAssetName = this.data.entityData.assetName;
      }
    }
    }

  }

  getEntityTicketDetails(id, type) {
    this.loading = true;
    this.commonService.getEntityTicketRequest('RQT-TASK', id, type).subscribe((res: any) => {
      this.totalRecords = res.totalRecords;
      this.visibleData = res.results;
      this.loading = false;
    },
      (err) => {
        console.error('Error fetching data', err);
        this.loading = false;
      }
    );
  }

  editTicket(data) {
    this.workflowService.getTaskById(data.requestId).subscribe((res) => {
      this.taskData = res.results[0];
      const bottomSheetRef = this.bottomSheet.open(ManagePwaInfoComponent, {
        data: [this.taskData],
        panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
      });

      bottomSheetRef.afterDismissed().subscribe(result => {
        this.getEntityTicketDetails(this.data.entityId, this.data.entityType);
      });
    });
  }

  addTask() {
    const type = this.data.entityType.toLowerCase();
    const contextId = this.data.entityType === 'Asset' ? 'PR-AT' : 'PR-LC';
    let Data = {id: null,nonPerformerId: this.data.entityId,entityDetail: this.data.entityData,type: type,contextType: contextId,formTemplateType: this.data.formTemplateType,disableIcon:true};
    Data['requestedType'] = 'RQT-TASK';
    console.log(Data)
    const bottomSheetRef = this.bottomSheet.open(ManagePwaTaskComponent, {
      data:[Data],
      panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
    });

    bottomSheetRef.afterDismissed().subscribe(result => {
      this.getEntityTicketDetails(this.data.entityId, this.data.entityType);
    });
  }
  fixClick() {
    console.log('')
  }
}
