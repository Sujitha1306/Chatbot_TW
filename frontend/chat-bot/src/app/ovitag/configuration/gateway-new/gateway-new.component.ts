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
import { Component, Input, OnInit} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { Router, ActivatedRoute } from "@angular/router";
import { UpgradeCertificateComponent } from "../../../shared/modules/entry-component/certificate-upgrade/upgrade-certificate.component";
import { EditGatewayComponent } from "../../../shared/modules/entry-component/edit-gateway/edit-gateway.component";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { CdkDetailRowDirective } from "./cdk-detail-row.directive";
import { MatTableDataSource } from "@angular/material/table";
/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/

@Component({
  selector: "app-gateway",
  templateUrl: "./gateway-new.component.html",
  styleUrls: ["./gateway-new.component.scss"],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    routerTransition()
  ],

})
export class GatewayNewComponent implements OnInit {
  displayedColumns1 = ['IDs', 'ID', 'Name', 'Master Name', 'Version', 'Status', 'Action'];
  serverDisplayedColumns = ['IDs', 'Server Name', 'Master Selection', 'Status'];
  jobDisplayedColumns = ['IDs', 'Gatway Job', 'Job Type', 'Status'];
  TaskDisplayedColumns = [ 'IDs', 'Selected job', 'Selected Job', 'Status'];
  displayedData = [
    { 'colName': 'IDs', 'title': 'IDs', 'dataName': 'IDs' }, 
    { 'colName': 'id', 'title': 'ID', 'dataName': 'id' }, 
    { 'colName': 'name', 'title': 'Name', 'dataName': 'name' },
    { 'colName': 'gwMasterSubValue', 'title': 'Master Name', 'dataName': 'gwMasterSubValue' },
    { 'colName': 'versionId', 'title': 'Version', 'dataName': 'versionId' },
    { 'colName': 'isActive', 'title': 'Status', 'dataName': 'isActive' },
    { 'colName': 'facilities', 'title': 'Facilities', 'dataName': 'facilities'},
    { 'colName': 'twServerName', 'title': 'Deploy Server', 'dataName': 'twServerName'},
    { 'colName': 'Action', 'title': 'Action', 'dataName': 'Action' }
  ];
  
  displayedColumns = this.displayedData.map(res => res.colName);
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = [];
  permissionControl = ['BT_ALLE', 'BT_CFGWE'];
  permission = ['BT_ALLC'];
  public matcher = new ErrorStateMatcherService();
  public selectedRow = null;
  public rowData: any = [];
  public gatewayData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any;
  public tableData = new MatTableDataSource<any>();
  public serverTableData: any = [];
  public jobTableData: any = [];
  public taskTableData: any = [];
  public selectedPanel = 0;
  public gatewaySection = [{ id: 1, name: 'GATEWAY' }, { id: 2, name: 'SERVER' }, { id: 3, name: 'JOB' }];
  public selectedView = 'table';
  public showAction1 = [
    { id: 'create', value: 'Create' },
  ];
  public showAction2 = [{ id: 'modify', value: 'Modify' }]
  public showActions = this.showAction1;
  public selectedName: any = null;
  public selectDropdown = null;
  height: any;
  selectedRow1 = null;
  selectedRow2 = null;
  cdkData = null
  isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');
  private readonly openedRow: CdkDetailRowDirective;
  @Input() singleChildRowDetail: boolean;
  type = null;
  constructor(
    private readonly configurationService: ConfigurationService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.activate_btn = this.commonService.getActivePermission("button");
   
  }

  ngOnInit() {
     if (parseInt(localStorage.getItem("userlevel")) === 3) {
      this.router.navigate(["/ovitag/configuration/rule"]);
    }
    this.getAllGateways(true);

  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
    this.tableData.filter = this.applyFilterValue
  }

  onPanelOpen(x) {
    this.selectedPanel = x;
  }
  onWindowResized(size) {
    this.height = size;
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createGateway('');
    } else if (event.data === 'modify') {
      if(this.selectedName !== null && this.selectedName !== '') {
        this.selectedName['type'] = this.type;
        this.selectedName['selectedData'] = this.selectedRow;
      }
      this.createGateway(this.selectedName, this.selectedRow);
    } else {
      this.selectedName = null;
      this.refreshPage();
    }
  }

  refreshPage(isAutoRefresh?: boolean) {
    this.showActions = this.showAction1;
    this.serverTableData = [];
    this.selectedName = null;
    this.selectedRow1 = null;
    this.selectedRow2 = null;
    this.jobTableData = [];
    if (isAutoRefresh === true) {
      this.applyFilterValue = null;
    }
    this.getAllGateways();
  }

  createGateway(rowData: any, selectedData?: any, tab?: any, type?: any, subType?: any) {
    if (type !== 'modify') {
      this.modifyGateway(rowData, selectedData);
      return;
    }

    if (subType === 'server') {
      this.getGatewayDetails(selectedData?.id, selectedData, tab, subType);
      return;
    }

    if ((subType === 'job' || subType === 'task') && this.selectedName?.id !== selectedData?.gatewayId) {
      this.getGatewayDetails(selectedData?.gatewayId, selectedData, tab, subType);
      return;
    }
    this.modifyGateway(this.selectedName, selectedData, tab, subType);
  }

  getGatewayDetails(id, selectedData, tab, subType) {
    this.configurationService.getAllNewGateways(id).subscribe((res) => {
      this.selectedName = res.results[0];
      if(this.selectedName?.length !== 0) {
        this.modifyGateway(this.selectedName, selectedData, tab, subType);
      }
    });
  }

  modifyGateway(rowData, selectedData, tab?: any, type?: any) {
    if(rowData !== null || rowData === '') {
      this.showActions = null;
      if(rowData !== null && rowData !== '') {
        rowData['type'] = type;
        rowData['selectedData'] = selectedData;
        if(tab === 'jobTab') {
          rowData['tab'] = tab;
        } else {
          rowData['subType'] = tab;
        }
      }
      const dialogRef = this.dialog.open(EditGatewayComponent, {
      data: rowData, panelClass: ['medium-popup'], disableClose: true,
      });
      dialogRef.afterClosed().subscribe((results) => {
      this.refreshPage();
      });
    }
  }

  cdkRowData(event: MouseEvent, data, column){
    const id = data?.gatewayId ? data?.gatewayId : data?.id;
    if (!data.close && column === 'IDs') {
      data.close = true;
    } else if (data.close && column === 'IDs'){
      data.close = false;
      this['gwId' + id]['close'] = false;
    }
    if(column == 'IDs' && data?.close){
      this.cdkData = data;
      this['gwId' + id] = data;
    } else if (column !== 'IDs') {
      this.cdkData = null;
      event.stopPropagation();
    }
  }
  rowClick(data, type) {
    this.type = type;
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedRow = this.selectedName;
      this.selectDropdown = null;
      this.showActions = this.showAction1;
    } else {
      this.showActions = this.showAction2;
      this.selectedRow = data;
      if (type === 'server') {
        this.configurationService.getAllNewGateways(data.id).subscribe((res) => {
          this.selectedName = res.results[0];
        });
      }
    }
  }

  upgradeCertificate(data) {
    const gatewayId = data;
    this.dialog.open(UpgradeCertificateComponent, {
      width: '430px', height: '265px', disableClose: true,
      data: { gatewayId }
    });
  }
  getAllGateways(routerEvent?: boolean) {
    const mapIsActive = (item: any) => {
      if (typeof item?.isActive === 'boolean') {
        item.isActive = item.isActive ? 'Active' : 'Inactive';
      }
    };

    const processTasks = (tasks: any[]) => {
      if (Array.isArray(tasks)) {
        tasks.forEach(mapIsActive);
      }
    };

    const processJobs = (jobs: any[]) => {
      if (Array.isArray(jobs)) {
        jobs.forEach(job => {
          mapIsActive(job);
          processTasks(job.tasks);
        });
      }
    };

    const processServers = (servers: any[]) => {
      if (Array.isArray(servers)) {
        servers.forEach(server => {
          mapIsActive(server);
          processJobs(server.jobs);
        });
      }
    };

    const transformData = (dataList: any[]) => {
      dataList.forEach(data => {
        data.close = false;
        mapIsActive(data);
        processServers(data.servers);
      });
      return dataList;
    };

    const processColumns = (tableData: any[]) => {
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['IDs', 'id', 'name', null, null, 'isActive', 'facilities', null, 'Action'];
      for (let i = 0; i < Columns.length; i++) {
        tableData.forEach(data => {
          if (Columns[i] === 'facilities') {
            const facilityName: string[] = [];
            data[Columns[i]]?.forEach((x: any) => {
              facilityName.push(x.facilityName);
            });
            data[Columns[i]] = facilityName;
          }
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
      this.setJobGwId(tableData);
    };

    if (routerEvent) {
      const gatewayResults = this.route.snapshot.data.gatewayManagement?.results || [];
      this.tableData = new MatTableDataSource<any>(transformData(gatewayResults));
      processColumns(transformData(gatewayResults));
    } else {
      this.configurationService.getAllNewGateways(null).subscribe((res) => {
        if (res.statusCode !== 0) {
          this.tableData = new MatTableDataSource<any>(transformData(res.results || []));
          processColumns(transformData(res.results || []));
        }
      });
    }
  }

  setJobGwId(tableData) {
    tableData.forEach(data => {
      if(data['servers']?.length > 0) {
        data['servers']?.forEach((x: any) => {
          if(x['jobs']?.length > 0) {
            x['jobs']?.forEach((y: any) =>{
              y['gatewayId'] = data?.id;
            })
          }
        });
      }
    });
  }

  fixClick() {
    console.log("")
  }
}
