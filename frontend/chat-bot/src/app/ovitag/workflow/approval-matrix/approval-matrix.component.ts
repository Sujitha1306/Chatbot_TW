import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService, WorkflowService } from '../../../shared';
import { TaskManagmentComponent } from '../../../shared/modules/entry-component/task-managment/task-managment.component';
import { ManageAssetComponent } from '../../../shared/modules/entry-component/manage-asset/manage-asset.component';
import { GatePassComponent } from '../../../shared/modules/entry-component/gate-pass/gate-pass.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { TwColumnDef, TwPaginationConfig } from '../../../shared/modules/entry-component/tw-data-table/tw-data-table.models';
import { CreateAssetComponent } from '../../configuration/asset/asset.component';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/internal/operators/finalize';

@Component({
  selector: 'app-approval-matrix',
  templateUrl: './approval-matrix.component.html',
  styleUrls: ['./approval-matrix.component.scss']
})
export class ApprovalMatrixComponent implements OnInit {
  displayedColumns: string[] = ['ID', 'Type', 'Reference', 'Subject', 'Category', 'Approval Steps', 'My Level', 'Approval Status', 'Requested By', 'Due Date', 'Actions'];
  permissionControl = ['BT_ALLE'];
  sortColumn = [];
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  eventColumn = ['Subject'];
  dateTimeColumns = ["Due Date"]
  public selectedName: any = null;
  public applyFilterValue: any;
  public selectedView = "table";
  filterValue = null;
  selectDropdown: any;
  public selectedRow: any = null;
  public tableVersion: any = null;
  public isloading = false;
  public tableData: any = [];
  pageSize: number = 50;
  pageStart: number = 0;
  length: number = 0;
  public requestStatus: any[] = [];
  public selectedIndex = 0;
  public requestStatusList: [] = [];
  public requstTypelList: [] = [];
  selectedType = [];
  selectedStatus = [];
  selectedTabIndex = 0;
  public loginUserId = localStorage.getItem('dXNlcklk');
  parentFilter = [
    {
      id: 'requestType',
      value: 'Type',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    },
    {
      id: 'requestStatus',
      value: 'Status',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: []
    }
  ];
  responseColumns: any[] = ['requesterId', 'requestTypeName', 'requestIdentifier', 'activityName', 'activityCategoryName', 'currentApprovalLevel', 'totalWorkflowLevels', 'approvalStatusName', 'requesterName', 'dueDate', 'Actions'];
  activate_btn: any[];
  viewApproval =  true;
  constructor(
      public dialog: MatDialog, private readonly commonService: CommonService, public configurationService: ConfigurationService,
      public workflowService: WorkflowService, public toastr: AppToastService) { 
      this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      this.getDynamicTableColumn();
      this.getMTeamFilterOpt();
    }, 300);
  }

  getMTeamFilterOpt() {
    forkJoin([
      this.commonService.getAppTerms("RequestStatus"),
      this.commonService.getAppTerms("RequestType")
    ]).subscribe(([statusRes, typeRes]) => {
      this.requestStatusList = statusRes.results.filter(res => res.code === 'RQ-PEN' || res.code === 'RQ-RJ' || res.code === 'RQ-AR');
      const requestStatus = this.parentFilter.find(f => f.id === 'requestStatus')
      if (requestStatus) {
        requestStatus.subFilters = this.requestStatusList;
      }
      this.requstTypelList = typeRes.results.filter(res => res.code === 'RQT-TKT'|| res.code === 'RQT-TASK' || res.code === 'RQT-WRK');
      const requestType = this.parentFilter.find(f => f.id === 'requestType')
      if (requestType) {
        requestType.subFilters = this.requstTypelList
      }
      this.checkUserPreference();
    });
  }

  checkUserPreference() {
    if (this.commonService.userPreference?.hasOwnProperty('approvalMatrix')) {
      let preferenceData = this.commonService.userPreference.approvalMatrix.value;
      preferenceData = JSON.parse(preferenceData)
      const requestType = this.parentFilter.find(f => f.id === 'requestType');
      const requestStatus = this.parentFilter.find(f => f.id === 'requestStatus');
      this.viewApproval = preferenceData.view === 'myApproval' ? true : null;
      this.selectedTabIndex = this.viewApproval ? 0 : 1;
      this.selectedType = preferenceData.requestType ?? [];
      this.selectedStatus = preferenceData.requestStatus ?? [];
      if (requestType) {
        requestType.defaultSelected = this.selectedType;
      }
      if (requestStatus) {
        requestStatus.defaultSelected = this.selectedStatus;
      }
    } else {
      this.commonService.validateUserPreference('approvalMatrix');
    }
    this.getApi()
  }

  saveUserPreference(selectedType, selectedStatus, viewApproval) {
    const typeFilter = this.parentFilter.find(f => f.id === 'requestType');
    const statusFilter = this.parentFilter.find(f => f.id === 'requestStatus');
    let appPreferenceData = {
      "requestType": typeFilter?.subFilters?.length === selectedType?.length ? [] : selectedType,
      "requestStatus": statusFilter?.subFilters?.length === selectedStatus?.length ? [] : selectedStatus,
      "view": viewApproval ? 'myApproval' : 'All'
    };
    let lastData = JSON.stringify(appPreferenceData)
    this.commonService.validateUserPreference('approvalMatrix', lastData)
  }

  manageGroupFilter(event) {
    let mtFilterData = event.data
    this.selectedType = mtFilterData.filter(item => item.id === 'requestType').map(code => code.data);
    this.selectedStatus = mtFilterData.filter(item => item.id === 'requestStatus').map(code => code.data);
    this.saveUserPreference(this.selectedType, this.selectedStatus, this.viewApproval);
    this.getApi()
  }

  getApi() {
    this.isloading = true;
    let selectedType = this.parentFilter.find(f => f.id === 'requestType')?.subFilters?.length === this.selectedType?.length ? null : this.selectedType;
    let selectedStatus = this.parentFilter.find(f => f.id === 'requestStatus')?.subFilters?.length === this.selectedStatus?.length ? null : this.selectedStatus;
    this.commonService.getApprovalMatrix(this.pageStart, this.pageSize, selectedType, selectedStatus,this.applyFilterValue,null,null,this.viewApproval).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords
      const Columns = this.responseColumns;
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.isloading = false;
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    if (this.applyFilterValue.length > 2) {
      this.getApi();
    } else if (this.applyFilterValue.length == 0) {
      this.getApi();
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data,);
    } else if (event.key === 'groupFilter') {
      this.manageGroupFilter(event);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  eventAction(event) {
    if (event.key === 'pagination') {
      this.pageSize = event.data.pageSize;
      this.pageStart = event.data.pageIndex;
      this.getApi();
    } else if(event.key === 'Reference'){
       this.createApprovalInfo(event.data);    
    } else if (event.key === 'Asset Name'){
       this.manageAsset(event.data);
    } else if(event.key === 'Approve' || event.key === 'Reject'){
       this.manageApproval(event.key,event.data);
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.filterValue = null;
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getApi()
  }

  manageAsset(data) {
    this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
      next: (res) => {
        if (res.results && res.results.length > 0) {
          let rowData = res.results[0];
          const dialogRef = this.dialog.open(CreateAssetComponent, {
            data: rowData,
            panelClass: ['large-popup'],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe(() => {
            this.refreshPage();
            this.selectDropdown = null;
            this.selectedName = null;
          });
        } else {
          this.toastr.warning('Warning', 'No Data Found');
        }
      }
    })
  }

  manageApproval(key,data){
    data['type'] = key;
    data['approval'] = true;
    let message = key === 'Approve' ? 'Are you sure you want to Approve?' : 'Are you sure you want to Reject?';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        ...data,
        title: 'Confirmation',
        message: message,
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 0,
      }
    })
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'No' || !result) { this.isloading = false; this.refreshPage(); this.selectDropdown = null; this.selectedName = null; return; }
      this.isloading = true;
      const isApprove = data.type === 'Approve';
      const isRejectAction = data.type === 'Reject';
      const rejectMapping = data?.options?.status?.['RQ-RJ'];
      let statusId = data?.requestStatus ?? null;
      let selectedWorkflow = null;
      if (isRejectAction && rejectMapping) {
        statusId = rejectMapping?.entityStatus;
        selectedWorkflow = rejectMapping.level != null ? Number(rejectMapping.level) : null;
      }
      if (isApprove) {
        selectedWorkflow = data.currentApproverLevel != null ? Number(data.currentApproverLevel) : null;
      }
      const levelComments = data?.approvalComments || '';
      const formComments = result?.comments ||'';
      const remarks = [levelComments?.trim(), formComments?.trim()].filter(Boolean).join(' - ');
      const createTask: any = {
        ticketId: data.requestId,
        status: isApprove ? data?.requestStatus : statusId,
        remarks: remarks,
        workflowLevelId: isApprove ? (data.currentApproverLevel != null ? Number(data.currentApproverLevel) : null) : selectedWorkflow || null,
        approval: {
          statusId: isApprove ? data?.requestStatus: statusId,
          id: data.entityWorkflowId,
          identifyingType: 'RT-US',
          identifyingId: this.loginUserId,
          comments: data?.approvalComments ?? null,
        }
      }
      this.commonService.editTask(data.requestId, createTask).pipe(
        finalize(() => {
          this.isloading = false;
          this.refreshPage();
          this.selectDropdown = null;
          this.selectedName = null;
        })
      ).subscribe({
        next: (res) => {
          if (res.statusCode === 1) {
            this.toastr.success('Success', `${res.message}`);
          }
        },
        error: (error) => {
          this.toastr.error('Error', `${error.error?.message}`);
        }
      })
    })
  }

  rowClick(data) {
    this.selectedName = data;
  }

  tabChanged(event) {
    this.selectedTabIndex = event.index;
    this.viewApproval = this.selectedTabIndex === 0 ? true : null;
    this.saveUserPreference(this.selectedType, this.selectedStatus, this.viewApproval);
    this.getApi();
  }

  getDynamicTableColumn() {
    this.commonService.getDynamicTableColumn('approval-matrix').subscribe(res => {
      if (res.statusCode === 1 && res.results?.contentObject) {
        const roleId = localStorage.getItem('roleId');
        const config = roleId && res.results.contentObject.role?.[roleId] ? res.results.contentObject.role[roleId] : res.results.contentObject;
        this.displayedColumns = config.displayedColumns ?? this.displayedColumns;
        this.responseColumns = config.columns ?? this.responseColumns;
        this.eventColumn = config.eventColumn ?? this.eventColumn;
        this.iconColumn = config.iconColumn ?? this.iconColumn;
        this.iconHeader = config.iconHeader ?? this.iconHeader;
        this.dateTimeColumns = config.dateTimeColumns ?? this.dateTimeColumns;
        this.sortColumn = config.sortColumn ?? this.sortColumn;
      }
    });
  }

  createApprovalInfo(data) {
    const requestId = data?.requestId ?? parseInt(data.requestIdentifier.replace(/\D/g, ''), 10)
    this.workflowService.getTaskById(requestId).subscribe(res => {
      if (res.statusCode === 1) {
        const requestData = res.results[0];
        this.createTask('modify', requestData, '', requestData?.routineTypeId);
      }
    })
  }

  createTask(key, data?, keyValue?, routineTypeId?) {
    if (key === 'modify') {
      if (this.commonService.facilityConfig?.isNavigateToAssetTransferPopup && this.commonService.facilityConfig?.isNavigateToAssetTransferPopup === true) {
        if ((data?.activityCategoryId === 'AC-QCAP' || data?.activityCategoryId === 'AC-REAP') && !keyValue) {
          this.navigateToTransfer(data);
          return
        }
        if ((data?.activityCategoryId == 'AC-GEXP' || data?.activityCategoryId == 'AC-GPENP') && !keyValue) {
          this.navigateToGatepass(data);
          return
        }
      }
      data['type'] = key;
      data['permissionTab'] = ['Task List'];
      data['requestedType'] = keyValue ? keyValue : 'RQT-TASK';
      data['routineTypeId'] = routineTypeId;

    } else {
      const data = { 'requestedType': 'RQT-TASK' };
      data['routineTypeId'] = routineTypeId;
    }
    const dialogRef = this.dialog.open(TaskManagmentComponent,
      { data: data, panelClass: ['large-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
      this.selectedName = null;
    });
  }

  navigateToTransfer(data) {
    let categoryAssignedDepartment = data?.departmentIds ?? [];
    if (data?.requestCategoryId == 'PR-AT' && data?.nonPerformerId && data.statusId == 'RQ-CR') {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results[0];
          const returnStatus = ['ATT-BRR', 'ATT-LRT', 'ATT-SRT', 'ATT-TRT'];
          const isReturnStatus = returnStatus.includes(assetData.assetTransferTypeId);
          const permission1 = isReturnStatus ? this.activate_btn.includes('BT_AM_RAT') : this.activate_btn.includes('BT_AM_AT');
          const permission2 = isReturnStatus ? this.activate_btn.includes('BT_AM_RATA') : this.activate_btn.includes('BT_AM_ATA');
          this.commonService.getLatestTransferDetail(assetData.id).subscribe(department => {
            const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
            const transfer = ['ATT-BRD', 'ATT-SV', 'ATT-RR', 'ATT-RT', 'ATT-BRR', 'ATT-SRT'];
            const isStatus = transfer.includes(assetData.assetTransferTypeId);
            const statusId = department?.results?.eventStatusId ?? null;
            assetData['transferEventStatusId'] = statusId;
            if (statusId === 'ATE-COM' || statusId == null) {
              this.toastr.warning('Warning', 'The Request is Already Completed');
              return
            }
            let userId = Number(localStorage.getItem(btoa('userId')));
            let allowedUserforApproval = (assetData?.ownerId === userId) || (data?.userId === userId);
            const approved = department?.results?.transferType === "TRT-DEP" ? (isStatus || departmentIds.includes(Number(department.results.sourceTransferId))) : true;
            const pending = department?.results?.transferType === "TRT-DEP"
              ? (Array.isArray(categoryAssignedDepartment) && categoryAssignedDepartment.length > 0 && (isStatus || categoryAssignedDepartment.includes(Number(department.results.transferId))))
              : department?.results?.transferType === "TRT-LOC" ? allowedUserforApproval : true;
            const isApprovedStatus = statusId === 'ATE-INI' && approved;
            const isPendingStatus = (statusId === 'ATE-PEN' || statusId === 'ATE-GENP') && pending;
            if (isApprovedStatus || isPendingStatus) {
              const targetStatus = isApprovedStatus ? 'ATE-PEN' : 'ATE-COM';
              const permission = isApprovedStatus ? permission1 : permission2;
              this.commonService.getLatestTransferDetail(assetData.id).subscribe(latest => {
                let sourceId = latest.results.transferType == "TRT-DEP" ? assetData.ownerDepartmentId : latest.results.transferType == "TRT-FAC" ? localStorage.getItem(btoa('facilityId')) : assetData?.homeLocationId;
                const jsondata = {
                  transferType: latest.results.transferType,
                  transferId: latest.results.transferId,
                  sourceIdentifier: sourceId,
                  destinationIdentifier: latest.results.transferId,
                  assetTransferType: assetData.assetTransferTypeId,
                  eventId: 'ATT-ACEV',
                  eventStatusId: targetStatus,
                  id: assetData.id,
                  isExcludeParent: false,
                  linkedAssets: [],
                  comments: null
                };
                if (permission) {
                  this.getAssetTransferDetails(assetData, jsondata);
                } else {
                  this.toastr.warning('Warning', 'User does not have Permission to Acknowledge Asset');
                  this.refreshPage();
                }
              });
            } else {
              this.toastr.warning('Warning', 'The User doesnot have Permission to acknowledge Asset');
              this.refreshPage();
            }
          });
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
      this.refreshPage();
    }
  }

  getAssetTransferDetails(event, jsondata) {
    this.commonService.getAssetTransferDetails(event.id, event.assetTransferTypeId).subscribe(details => {
      const dialogRef = this.dialog.open(ManageAssetComponent, {
        panelClass: ['small-popup'],
        disableClose: true,
        data: {
          assetdata: jsondata,
          assetInfo: event,
          transferData: details.results
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
      });
    });
  }

  navigateToGatepass(data) {
    if (data?.requestCategoryId === 'PR-AT' && data?.nonPerformerId && (data.statusId === 'RQ-CR' || data.statusId === 'RQ-CO')) {
      this.configurationService.getAllAsset(data.nonPerformerId).subscribe({
        next: (res) => {
          const assetData = res.results?.[0];
          assetData['gatePassStatusId'] = data.activityCategoryId == 'AC-GEXP' ? 'ATE-GISD' : data.activityCategoryId == 'AC-GPENP' ? data.statusId === 'RQ-CR' ? 'ATE-GEXP' : data.statusId === 'RQ-CO' ? 'ATE-GENP' : null : null;
          assetData['hideButton'] = data?.statusId === 'RQ-CO' ? true : false;
          this.manageEventGatePass(assetData);
        }
      });
    } else {
      let warningMessage = 'The User doesnot have Permission to acknowledge Asset';
      if (data?.nonPerformerId == null) {
        warningMessage = 'The Request is not linked to Asset';
      }
      if (data?.statusId !== 'RQ-CR') {
        const statusId = data.statusId;
        if (statusId === 'RQ-CO') {
          warningMessage = 'The Request is Already Completed';
        } else if (statusId === 'RQ-CA') {
          warningMessage = 'The Request is Already Cancelled';
        }
      }
      this.toastr.warning('Warning', warningMessage);
      this.refreshPage();
    }
  }

  manageEventGatePass(data) {
    this.commonService.getLatestTransferDetail(data.id).subscribe(department => {
      const departmentIds: any = localStorage.getItem(btoa('departmentIds') || '[]');
      const isApproved = department?.results?.transferType === "TRT-DEP" ? departmentIds.includes(Number(department.results.sourceTransferId)) : true;
      if (!isApproved) {
        this.toastr.warning('Warning', 'User does not have permission to authorize Gatepass for this asset');
        return;
      }
      this.manageGetAllAsset(data, department);
    })
  }

  manageGetAllAsset(data, department) {
    let rowData = null
    this.configurationService.getAllAsset(data.id).subscribe(res => {
      if (res.results && res.results.length > 0) {
        rowData = res.results[0];
      }
      const isTransfer = data.assetTransferTypeId === 'ATT-TR';
      let sourceId = department.results.sourceTransferId;
      let source = department.results.sourceTransferName;
      let destinationId = department.results.transferId;
      let destination = department.results.transferName;
      rowData['transferType'] = department.results.transferType,
      rowData['sourceIdentifier'] = isTransfer ? sourceId : destinationId;
      rowData['destinationIdentifier'] = isTransfer ? destinationId : sourceId;
      rowData['assignedLocationName'] = isTransfer ? destination : source;
      rowData['homeLocationName'] = isTransfer ? source : destination;
      rowData['isGatePassIssued'] = true;
      rowData['hideButton'] = data.hideButton;
      rowData['gatePassStatusId'] = data.gatePassStatusId ?? null;
      const dialogRef = this.dialog.open(GatePassComponent, {
        data: rowData,
        panelClass: 'medium-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage();
      });
    });
  }

  get approvalTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn,
      this.eventColumn
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    eventCols: string[] = ['Reference'],
    timeCols: string[] = [],
    dateTimeCols: string[] = ['Due Date'],
    alignmentCols: string[] = ['Total Approval Level', 'Current Approval Level']
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (timeCols.includes(key)) def.type = 'time';
      else if (dateTimeCols.includes(key)) def.type = 'datetime';
      if (alignmentCols.includes(key)) def.align = 'center';
      return def;
    });
  }

  get approvalPaginationConfig(): TwPaginationConfig {
    return { length: this.length, pageSize: this.pageSize, pageIndex: this.pageStart, pageSizeOptions: [20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    this.eventAction({ key: event.column, data: event.row });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.eventAction({ key: 'pagination', data: event });
  }
}