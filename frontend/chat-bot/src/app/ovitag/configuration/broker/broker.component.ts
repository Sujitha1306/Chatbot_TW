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
import { Component, OnInit, Input, Inject } from "@angular/core";
import { MatDialog,MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ErrorStateMatcher,DateAdapter } from "@angular/material/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { CreateBroker, EditBroker } from "./broker.model";
import { AppToastService } from "../../../shared/services/toaster.service";
import { LookupTermService } from "../../../shared/lookup-term.service";
import { TwColumnDef, TwPaginationConfig } from "../../../shared/modules/entry-component/tw-data-table/tw-data-table.models";

@Component({
  selector: "app-broker",
  templateUrl: "./broker.component.html",
  styleUrls: ["./broker.component.scss"],
  animations: [routerTransition()],
})

export class BrokerComponent implements OnInit {
  iconHeader = ['ID'];
  iconColumn = ['ID'];
  sortColumn = ['ID'];
  eventColumn = [];
  permissionControl = ['BT_ALLE'];
  permission = ['BT_ALLC']
  displayedColumns = ['ID', 'Broker Type', 'Mosquitto Host', 'MQTT Port', 'Websocket Port', 'Username', 'Password', 'Is Enable', 'SSL', 'MA'];
  public tableVersion: any = null;
  public brokerLength: number = 0;
  public selectedName = null;
  public rowData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any;
  public tableData: any=[];
  showAction1 = [{ id: 'create', value: 'Create' }];
  showAction2 = [{ id: 'modify', value: 'Modify' }];
  public showActions = this.showAction1;
  isCloudExist = false;

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
        this.displayedColumns = ['Broker Type', 'Mosquitto Host', 'MQTT Port', 'Websocket Port', 'Username', 'Password', 'Is Enable', 'SSL', 'MA'];
      }
      this.tableData = this.route.snapshot.data.broker.results;
      this.brokerLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['ID', 'brokerTypeId', 'host', 'mport', 'wport', 'username', 'password','isActive', 'isSslEnabled', 'isMaEnabled']
        : ['brokerTypeId', 'host', 'mport', 'wport', 'username', 'password','isActive', 'isSslEnabled', 'isMaEnabled'];
      for (let i in Columns) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
          if(data?.brokerTypeId === 'BT-CL') {
            this.isCloudExist = true;
          }
        });
      }
    }, 500);
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createBroker(null);
    } else if (event.data === 'modify') {
      this.createBroker(this.selectedName);
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
    this.getAllBrokers();
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

  createBroker(data) {
    this.showActions = null;
    if (data != null) {
      this.configurationService.getAllBrokers(data.id).subscribe((res) => {
        this.rowData = res.results[0];
        this.rowData['isCloudExist'] = this.isCloudExist;
        const dialogRef = this.dialog.open(CreateBrokerComponent,
        { data: this.rowData, panelClass: ['medium-popup'], disableClose: true });
        dialogRef.afterClosed().subscribe((results) => {
          this.refreshPage();
        });
      });
    } else {
      const data = [];
      data['isCloudExist'] = this.isCloudExist;
      const dialogRef = this.dialog.open(CreateBrokerComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
      dialogRef.afterClosed().subscribe((results) => {
        this.refreshPage();
      });
    }
  }

  getAllBrokers() {
    this.configurationService.getAllBrokers().subscribe((res) => {
      this.tableData = res.results;
      this.brokerLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['ID', 'brokerTypeId', 'host', 'mport', 'wport', 'username', 'password','isActive', 'isSslEnabled', 'isMaEnabled']
        : ['brokerTypeId', 'host', 'mport', 'wport', 'username', 'password','isActive', 'isSslEnabled', 'isMaEnabled'];
      for (let i in Columns) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
          if(data?.brokerTypeId === 'BT-CL') {
            this.isCloudExist = true;
          }
        });
      }
    });
  }

  get brokerTwColumns(): TwColumnDef[] {
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

  get brokerPaginationConfig(): TwPaginationConfig {
    return { length: this.brokerLength, pageSize: 10, pageIndex: 0, pageSizeOptions: [10, 15, 20, 50, 100] };
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
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-create-broker",
  templateUrl: "./create-broker.component.html",
  styleUrls: ["./broker.component.scss"],
  
})

export class CreateBrokerComponent implements OnInit {
  @Input() max: Date | null;
  today = new Date();
  public brokerForm: FormGroup;
  public createBroker: CreateBroker;
  public editBroker: EditBroker;
  matcher = new MyErrorStateMatcher();
  public isDisabled = false;  
  public brokerList: any=[];
  public base64Data: string;
  public base64toTextFile: any;
  checkedLocalssl = false;
  public fileType: any;
  popWidth: any;
  contentHeight: number;
  popHeight: any;
  mqttPorts: any[] = [{
    'id': 1,
    'name': 'mqtt'
  },
  {
    'id': 2,
    'name': 'mqtts'
  }];

  webSocketProtocols: any[] = [{
    'id': 1,
    'text': 'ws'
  },
  {
    'id': 2,
    'text': 'wss'
  }];
  base64SSLdata: string;
  base64MAdata: string;
  base64MAKeydata: string
  isSSLfileSelected = false;
  isMAfileSelected = false;
  isMAKeyfileSelected = false;
  selectServerList = [];

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateBrokerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly lookupService: LookupTermService,
  ) {
    this.today.setDate(this.today.getDate());
    dateAdapter.setLocale("en-in"); 
  }

  ngOnInit() {
    console.log(this.data)
    if(this.data?.id) {
      if(this.data.certFile !== null) {
        this.base64SSLdata = this.data.certFile;
        this.isSSLfileSelected = true;  
        this.base64toTextFile = this.safeUrl(atob(this.data.certFile))
        this.base64toTextFile = window.atob(this.data.certFile);  
      } 
      if (this.data.caFile !== null) {
        this.base64MAdata = btoa(this.data.caFile);
        this.isMAfileSelected = true;
        this.base64toTextFile = this.safeUrl(atob(this.data.caFile))
        this.base64toTextFile = window.atob(this.data.caFile);    
      } 
      if (this.data.keyFile !== null) {
        this.base64MAKeydata = btoa(this.data.keyFile)
        this.isMAKeyfileSelected = true;
        this.base64toTextFile = this.safeUrl(atob(this.data.keyFile))
        this.base64toTextFile = window.atob(this.data.keyFile);   
      }
    }
    this.getBrokerType();
    this.getselectServer();
    this.buildForm();
  }

  onWindowResizedWidth(size) {
    this.popWidth = size;
  }

  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 180;
  }

  getBrokerType() {
    this.lookupService.getAppTermsWrapper("BrokerType").subscribe((res) => {
      this.brokerList = res.BrokerType ?? [];
      if(this.data?.isCloudExist && this.data?.brokerTypeId !== 'BT-CL') {
        this.brokerList = this.brokerList.filter(data => data.code !== 'BT-CL');
      }
    });
  }

  getselectServer() {
    this.configurationServices.getNonMappedServer().subscribe((res) => {
      this.selectServerList = res.results;
      if(this.data?.id && this.data?.twServerId !== null) {
        this.selectServerList.push({id: this.data?.twServerId, name: this.data?.twServerName});
      }
    });
  }
  
  enableMA(event) {
    if(event.checked === true) {
      this.brokerForm.get('sslEnabled').setValue(true);
    }
  }

  handleFileSelect(evt, type) {
    const files = evt.target.files;
    if (files.length > 2) {
      this.toastr.warning('Warning', `sorry, you can upload only 1 file!`);
      this.thisDialogRef.close('confirm');
    }

    for (const file of files) {
      if (files && file) {
        this.fileType = file.type;
        const reader = new FileReader();
        reader.onload = this._handleReaderLoaded.bind(this, type);
        reader.readAsArrayBuffer(file);
      }
    }
  }

  _handleReaderLoaded(type, readerEvt) {
    const binaryString = readerEvt.target.result;
    const base64 = btoa(binaryString);
    this.base64Data = base64;
    if(type === 'SSL') {
      this.base64SSLdata = base64;
      this.isSSLfileSelected = true;  
    } else if (type === 'MA') {
      this.base64MAdata = base64;
      this.isMAfileSelected = true;  
    } else {
      this.base64MAKeydata = base64;
      this.isMAKeyfileSelected = true;
    }
    this.base64toTextFile = this.safeUrl(atob(this.base64Data))
    this.base64toTextFile = window.atob(this.base64Data);
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
  
  removeLocalFile(type) {
    if(type === 'SSL') {
      this.brokerForm.get("sslEnabledFile").reset();
      this.base64SSLdata = null;
      this.isSSLfileSelected = false;
    } else if (type === 'MA') {
      this.brokerForm.get("maEnabledFile").reset();
      this.base64MAdata = null;
      this.isMAfileSelected = false;
    } else {
      this.brokerForm.get("maEnabledKeyFile").reset();
      this.base64MAKeydata = null;
      this.isMAKeyfileSelected = false;
    }
  }

  changelocalValue(value, type) {
    this.checkedLocalssl = value._checked;
    if (!this.checkedLocalssl) {
      if(type === 'SSL') {
        this.brokerForm.get("sslEnabledFile").reset();
        this.base64SSLdata = null;
        this.isSSLfileSelected = false;
      } else if (type === 'MA') {
        this.brokerForm.get("maEnabledFile").reset();
        this.base64MAdata = null;
        this.isMAfileSelected = false;
        this.brokerForm.get("maEnabledKeyFile").reset();
        this.base64MAKeydata = null;
        this.isMAKeyfileSelected = false;
      }
    } else {
      const localType = type;
      if(localType === 'SSL') {
        this.isSSLfileSelected = true;
      } else if (localType === 'MA') {
        this.isMAfileSelected = true;
      } else {
        this.isMAKeyfileSelected = true;
      }
    }
  }

  public buildForm() {
    this.brokerForm = this.form.group({
      brokerId: [this.data.brokerTypeId ? this.data.brokerTypeId : null, [Validators.required]],
      mosquittoHost: [this.data.host ? this.data.host : null, [Validators.required]],
      mqttPort: [this.data.mport ? this.data.mport : null, [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      mqttProtocol: [this.data.mprotocol ? this.data.mprotocol : null, [Validators.required]],
      websocketPort: [this.data.wport ? this.data.wport : null],
      websocketProtocol: [this.data.wprotocol ? this.data.wprotocol : null],
      facilityUserName: [this.data.username ? this.data.username : null, [Validators.required]],
      facilityPassword: [this.data.password ? this.data.password : null, [Validators.required]],
      isActive: [this.data.isActive ? this.data.isActive : true],
      sslEnabled: [this.data.isSslEnabled ? this.data.isSslEnabled : false],
      sslEnabledFile: [this.data.certFile ? this.data.certFile : null],
      maEnabled: [this.data.isMaEnabled ? this.data.isMaEnabled : false],
      maEnabledFile: [this.data.caFile ? this.data.caFile : null],
      maEnabledKeyFile: [this.data.keyFile ? this.data.keyFile : null],
      twServerId: [this.data.twServerId ? this.data.twServerId : null]
    });
  }

  saveBroker(){
    this.createBroker = new CreateBroker(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createBroker.brokerTypeId = this.brokerForm.controls['brokerId'].value;
    this.createBroker.twServerId = this.brokerForm.controls['twServerId'].value;
    this.createBroker.host = this.brokerForm.controls['mosquittoHost'].value;
    this.createBroker.mport = parseInt(this.brokerForm.controls['mqttPort'].value);
    this.createBroker.mprotocol = this.brokerForm.controls['mqttProtocol'].value;
    this.createBroker.wport = parseInt(this.brokerForm.controls['websocketPort'].value);
    this.createBroker.wprotocol = this.brokerForm.controls['websocketProtocol'].value;
    this.createBroker.username = this.brokerForm.controls['facilityUserName'].value;
    this.createBroker.password = this.brokerForm.controls['facilityPassword'].value;
    this.createBroker.isActive = this.brokerForm.controls['isActive'].value;
    this.createBroker.isSslEnabled = this.brokerForm.controls['sslEnabled'].value;
    this.createBroker.certFile = this.base64SSLdata;
    this.createBroker.isMaEnabled = this.brokerForm.controls['maEnabled'].value;
    this.createBroker.caFile = this.base64MAdata;
    this.createBroker.keyFile = this.base64MAKeydata;
    this.configurationServices.createBroker(this.createBroker).subscribe(
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

  public updateBroker() {
    this.editBroker = new EditBroker(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.editBroker.brokerTypeId = this.brokerForm.controls['brokerId'].value;
    this.editBroker.twServerId = this.brokerForm.controls['twServerId'].value;
    this.editBroker.host = this.brokerForm.controls['mosquittoHost'].value;
    this.editBroker.mport = parseInt(this.brokerForm.controls['mqttPort'].value);
    this.editBroker.mprotocol = this.brokerForm.controls['mqttProtocol'].value;
    this.editBroker.wport = parseInt(this.brokerForm.controls['websocketPort'].value);
    this.editBroker.wprotocol = this.brokerForm.controls['websocketProtocol'].value;
    this.editBroker.username = this.brokerForm.controls['facilityUserName'].value;
    this.editBroker.password = this.brokerForm.controls['facilityPassword'].value;
    this.editBroker.isActive = this.brokerForm.controls['isActive'].value;
    this.editBroker.isSslEnabled = this.brokerForm.controls['sslEnabled'].value;
    this.editBroker.certFile = this.base64SSLdata;
    this.editBroker.isMaEnabled = this.brokerForm.controls['maEnabled'].value;
    this.editBroker.caFile = this.base64MAdata;
    this.editBroker.keyFile = this.base64MAKeydata;
    this.configurationServices.updateBroker(this.editBroker, this.data.id).subscribe(
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
