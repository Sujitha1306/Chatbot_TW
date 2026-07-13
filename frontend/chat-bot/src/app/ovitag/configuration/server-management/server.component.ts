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
import { Component, OnInit, Input, Inject, ViewChild, ElementRef } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { CreateServer, EditServer } from "./server.model";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS } from "../asset/asset.component";
import { DatePipe } from "@angular/common";
import { AppToastService } from "../../../shared/services/toaster.service";
import { TwColumnDef, TwPaginationConfig } from "../../../shared/modules/entry-component/tw-data-table/tw-data-table.models";

@Component({
  selector: "app-server",
  templateUrl: "./server.component.html",
  styleUrls: ["./server.component.scss"],
  animations: [routerTransition()],
})

export class ServerComponent implements OnInit {
  iconHeader = ['ID'];
  iconColumn = ['ID','Status'];
  sortColumn = ['ID'];
  eventColumn = [];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLC']
  displayedColumns = ['ID', 'Name', 'Host', 'Hosted On', 'OS Type', 'Processor Architecture', 'OS Version', 'Status'];
  public tableVersion: any = null;
  public serverLength: number = 0;
  public selectedName = null;
  public rowData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any;
  public tableData: any=[];
  showAction1 = [{ id: 'create', value: 'Create' }];
  showAction2 = [{ id: 'modify', value: 'Modify' }];
  public showActions = this.showAction1;

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
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = ['Name', 'Host', 'Hosted On', 'OS Type', 'Processor Architecture', 'OS Version', 'Status'];
      }
      this.tableData = this.route.snapshot.data.server.results;
      this.serverLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['ID', 'name', 'host', 'serverHostName', 'osName', 'architectureName', 'appVersion', 'isActive']
        : ['name', 'host', 'serverHostName', 'osName', 'architectureName', 'appVersion', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    }, 500);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createServer(null);
    } else if (event.data === 'modify') {
      this.createServer(event.keyVal);
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();  
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }
  
  refreshPage() {
    this.selectedName = null;
    this.applyFilterValue = null;
    this.showActions = this.showAction1;
    this.getAllServers();
  }

  rowClick(data) {
    if (this.selectedName && data.id == this.selectedName.id) {
      this.selectedName = null;
      this.showActions = this.showAction1;
    } else {
      this.selectedName = data;
      this.showActions = this.showAction2;
    }
  }

  createServer(data) {
    this.showActions = null;
    if (data != null) {
      const dialogRef = this.dialog.open(CreateServerComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe((results) => {
        this.refreshPage();
      });
    } else {
      const dialogRef = this.dialog.open(CreateServerComponent,
      { data: '', panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe((results) => {
        this.refreshPage();
      });
    }
  }

  getAllServers() {
    this.configurationService.getAllServers().subscribe((res) => {
      this.tableData = res.results;
      this.serverLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['ID', 'name', 'host', 'serverHostName', 'osName', 'architectureName', 'appVersion', 'isActive']
        : ['name', 'host', 'serverHostName', 'osName', 'architectureName', 'appVersion', 'isActive'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  get serverTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, this.eventColumn, []
    );
  }

  buildTwColumnDefs(
    displayedCols: string[],
    sortCols: string[] = [],
    iconCols: string[] = [],
    iconHeader: string[] = [],
    eventCols: string[] = [],
    timeCols: string[] = [],
  ): TwColumnDef[] {
    return (displayedCols ?? []).map(key => {
      const def: TwColumnDef = { key };
      if (sortCols.includes(key)) def.sortable = true;
      if (eventCols.includes(key)) def.clickable = true;
      if (iconCols.includes(key)) def.icon = { matIcon: '' };
      if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
      if (timeCols.includes(key)) def.type = 'datetime';
      return def;
    });
  }

  get serverPaginationConfig(): TwPaginationConfig {
    return { length: this.serverLength, pageSize: 10, pageIndex: 0, pageSizeOptions: [10, 15, 20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
  }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form?.submitted;
    return !!(
      control?.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-create-server",
  templateUrl: "./create-server.component.html",
  styleUrls: ["./server.component.scss"],
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class CreateServerComponent implements OnInit {
  @Input() max: Date | null;
  today = new Date();
  public serverForm: FormGroup;
  public createServer: CreateServer;
  public editServer: EditServer;
  matcher = new MyErrorStateMatcher();
  public isDisabled = false;  
  public serverList: any=[];
  popWidth: any;
  contentHeight: number;
  popHeight: any;
  public softwareList = [];
  public softwareVersionList = [];
  public softwareProcessList = [];
  @ViewChild('scrolltop', { static: true }) private readonly myScrollContainer: ElementRef;
  licenseData: any=[];

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateServerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly dateAdapter: DateAdapter<Date>
  ) {
    this.today.setDate(this.today.getDate());
    dateAdapter.setLocale("en-in"); 
  }

  ngOnInit() {
    if(this.data) {
      this.licenseData['type'] = 'server';
      this.licenseData['data'] = this.data;
      this.commonService.getAppVersion(this.data.appVersionId, null, null).subscribe((res) => {
        this.softwareVersionList = res.results;
      });
      this.commonService.getAppVersion(null, this.data?.serverHostId, 'AVT-OS').subscribe((res) => {
        this.softwareList = res.results;
      });
      this.commonService.getAppVersion(null, this.data?.osId, 'AVT-OS-PT').subscribe((res) => {
        this.softwareProcessList = res.results;
      });
      this.commonService.getAppVersion(null, this.data?.architectureId, 'AVT-OS-VER').subscribe((res) => {
        this.softwareVersionList = res.results;
      });
    }
    this.getServerType();
    this.buildForm();
  }

  onWindowResizedWidth(size) {
    this.popWidth = size;
  }

  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 180;
  }

  scrollToTop() {
    this.myScrollContainer.nativeElement.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  getServerType() {
    this.commonService.getAppVersion(null, null, 'AVT-SER').subscribe((res) => {
      this.serverList = res.results;
    });
  }

  getOsType(data) {
    if(data !== null) {
      if(this.serverForm.get('serverId').value !== data.id) {
        this.softwareList = [];
        this.softwareProcessList = [];
        this.softwareVersionList = [];
      }
      this.commonService.getAppVersion(null, data.id, 'AVT-OS').subscribe((res) => {
        this.softwareList = res.results;
      });
    }
  }

  getOsProcessType(data) {
    if(data !== null) {
      if(this.serverForm.get('softwareId').value !== data.id) {
        this.softwareProcessList = [];
        this.softwareVersionList = [];
      }
      this.commonService.getAppVersion(null, data.id, 'AVT-OS-PT').subscribe((res) => {
        this.softwareProcessList = res.results;
      });
    }
  }

  getOsVersion(data) {
    if(data !== null) {
      if(this.serverForm.get('softwareProcessId').value !== data.id) {
        this.softwareVersionList = [];
      }
      this.commonService.getAppVersion(null, data.id, 'AVT-OS-VER').subscribe((res) => {
        this.softwareVersionList = res.results;
      });
    }
  }

  public buildForm() {
    this.serverForm = this.form.group({
      serverName: [this.data.name ? this.data.name : null, [Validators.required]],
      hostName: [this.data.host ? this.data.host : null, [Validators.required]],
      serverId: [this.data.serverHostId ? this.data.serverHostId : null, [Validators.required]],
      softwareId: [this.data.osId ? this.data.osId : null, [Validators.required]],
      softwareProcessId: [this.data.architectureId ? this.data.architectureId : null, [Validators.required]],
      softwareVersion: [this.data.appVersionId ? this.data.appVersionId : null, [Validators.required]],
    });
  }

  saveServer(){
    this.createServer = new CreateServer(null, null, null, null, null, null, null);
    this.createServer.name = this.serverForm.controls['serverName'].value;
    this.createServer.host = this.serverForm.controls['hostName'].value;
    this.createServer.appVersionId = this.serverForm.controls['softwareVersion'].value;
    this.createServer.isActive = true;
    this.createServer.osId = this.serverForm.controls['softwareId'].value;
    this.createServer.serverHostId = this.serverForm.controls['serverId'].value;
    this.createServer.architectureId = this.serverForm.controls['softwareProcessId'].value;
    this.configurationServices.createServer(this.createServer).subscribe(
      (res) => {
        if (res.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.toastr.success("Success", `${res.message}`);
        this.thisDialogRef.close("confirm");
      },
      (error) => {
        this.isDisabled = false;
        if (error.error.errorCode === 'TWAPI54') {
          this.toastr.error('Error', `${error.error.message}`);
        }  else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }

  public updateServer() {
    this.editServer = new EditServer(null, null, null, null, null, null, null);
    this.editServer.name = this.serverForm.controls['serverName'].value;
    this.editServer.host = this.serverForm.controls['hostName'].value;
    this.editServer.appVersionId = this.serverForm.controls['softwareVersion'].value;
    this.editServer.isActive = true;
    this.editServer.osId = this.serverForm.controls['softwareId'].value;
    this.editServer.serverHostId = this.serverForm.controls['serverId'].value;
    this.editServer.architectureId = this.serverForm.controls['softwareProcessId'].value;
    this.configurationServices.updateServer(this.editServer, this.data.id).subscribe(
      (res) => {
        if (res.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.toastr.success("Success", `${res.message}`);
        this.thisDialogRef.close("confirm");
      },
      (error) => {
        this.isDisabled = false;
        if (error.error.errorCode === 'TWAPI54') {
          this.toastr.error('Error', `${error.error.message}`);
        }  else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }
  fixClick() {
    console.log('')
  }    
}
