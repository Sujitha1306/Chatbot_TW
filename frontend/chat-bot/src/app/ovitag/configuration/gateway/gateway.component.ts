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
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormGroup, FormBuilder, Validators} from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { CreateGateway, EditGateway } from "../configuration.model";
import { Router, ActivatedRoute } from "@angular/router";
import { DomSanitizer } from '@angular/platform-browser';
import { DateAdapter } from "@angular/material/core";
import { UpgradeCertificateComponent } from "../../../shared/modules/entry-component/certificate-upgrade/upgrade-certificate.component";
import { ErrorStateMatcherService } from "../../../shared/services/error-state-matcher.service";
import { AppToastService } from "../../../shared/services/toaster.service";
import { LookupTermService } from "../../../shared/lookup-term.service";
import { TwColumnDef, TwPaginationConfig } from "../../../shared/modules/entry-component/tw-data-table/tw-data-table.models";

/*

Description : set the default array values and defne the statuc values.
Date        : Aug 11, 2018
Author      : TrackerWave
Developer   : UI Team

*/

@Component({
  selector: "app-gateway",
  templateUrl: "./gateway.component.html",
  styleUrls: ["./gateway.component.scss"],
  animations: [routerTransition()],
 
})
export class GatewayComponent implements OnInit {
  displayedData = [
    { colName: "gatewayId", title: "Gateway Id", dataName: "gatewayId" },
    { colName: "gatewayName", title: "Name", dataName: "gatewayName" },
    { colName: "softwareVersion", title: "Software Version", dataName: "softwareVersion", },
    { colName: "ipAddress", title: "IP Address", dataName: "ipAddress" },
    { colName: "MQTT Broker (Local)", title: "MQTT Broker (Local)", dataName: "bokerLocalHostName", },
    { colName: "MQTT Broker (Cloud)", title: "MQTT Broker (Cloud)", dataName: "brokerCloudName", },
    { colName: "facilityName", title: "Facility Name", dataName: "facilityName", },
    { colName: "boottime", title: "Boot Time", dataName: "boottime" },
    { colName: "status", title: "Status", dataName: "status" },
  ];
  iconHeader = [];
  iconColumn = [];
  sortColumn = [];
  permissionControl = ['BT_ALLE', 'BT_CFGWE'];
  displayedColumns = this.displayedData.map((res) => res.title);
  public tableVersion: any = null;
  public selectedRow: any;
  public rowData: any = [];
  public gatewayData: any = [];
  public activate_btn: any = [];
  public applyFilterValue: any;
  tableData: any;
  public gatewayLength: number = 0;

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
    setTimeout(() => {
      this.tableVersion = this.commonService.facilityConfig?.twTableVersion ?? 1;
      if (this.tableVersion === 2) {
        this.displayedColumns = this.displayedData.map((res) => res.title).filter(col => col !== 'Gateway Id');
      }
      this.tableData = this.route.snapshot.data.gateways.results;
      this.gatewayLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['gatewayId', 'gatewayName', 'softwareVersion', 'ipAddress', 'bokerLocalHostName', 'brokerCloudName', 'facilityName', 'boottime', 'status']
        : ['gatewayName', 'softwareVersion', 'ipAddress', 'bokerLocalHostName', 'brokerCloudName', 'facilityName', 'boottime', 'status'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    }, 500);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();  
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  createGateway(rowData: any) {
    this.rowData = rowData;
    this.selectedRow = rowData.id;

    if (this.selectedRow != null) {
      this.configurationService
        .getGatewayById(this.selectedRow)
        .subscribe((res) => {
          this.rowData = res.results;
          console.log("", this.rowData);
          const dialogRef = this.dialog.open(CreateGatewayComponent, {
            data: this.rowData,
            panelClass: ['small-popup'],
            disableClose: true,
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result === "confirm") {
               
              this.getAllGateways();
            }
          });
        });
    } else {
      const dialogRef = this.dialog.open(CreateGatewayComponent, {
        data: this.rowData,
        panelClass: ['small-popup'],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((results) => {
        if (results === "confirm") {
         
          this.getAllGateways();
        }
      });
    }
  }

  rowClick(data) {
    console.log(data)
    this.selectedRow = data.id;
  }

  upgradeCertificate(data) {
    const gatewayId = data;
    console.log(gatewayId)
    this.dialog.open(UpgradeCertificateComponent, {
      panelClass: ['small-popup'], disableClose: true,
      data: { gatewayId }
    });
  }
  getAllGateways() {
    this.configurationService.getAllGateways().subscribe((res) => {
      this.tableData = res.results;
      this.gatewayLength = this.tableData?.length || 0;
      const Columns = this.tableVersion === 1
        ? ['gatewayId', 'gatewayName', 'softwareVersion', 'ipAddress', 'bokerLocalHostName', 'brokerCloudName', 'facilityName', 'boottime', 'status']
        : ['gatewayName', 'softwareVersion', 'ipAddress', 'bokerLocalHostName', 'brokerCloudName', 'facilityName', 'boottime', 'status'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  get gatewayTwColumns(): TwColumnDef[] {
    return this.buildTwColumnDefs(
      this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, [null], []
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

  get gatewayPaginationConfig(): TwPaginationConfig {
    return { length: this.gatewayLength, pageSize: 10, pageIndex: 0, pageSizeOptions: [10, 15, 20, 50, 100] };
  }

  onCellAction(event: { column: string; row: any }) {
    console.log(event)
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
  }

  
}

@Component({
  selector: "app-create-gateway",
  templateUrl: "./create-gateway.component.html",
  styleUrls: ["./gateway.component.scss"],
  
})

export class CreateGatewayComponent implements OnInit {
  @Input() max: Date | null;
  today = new Date();

  public gatewayForm: FormGroup;
  public createGateway: CreateGateway;
  public editGateway: EditGateway;
  public ipStatic = true;
  public matcher = new ErrorStateMatcherService();
  public isDisabled = false;
  public base64Data: string;
  public cloud64Data: string;
  public base64Editdata: string;
  public cloud64Editdata: string;
  public isfileSelected: boolean = true;
  public fileName: string = 'x';

  textData: any[] = [];
  public brokerTypes: Array<any> = [];
  public: Array<any> = [];
  public facilityListbyCustomer: Array<any> = [];
  public gatewaySubTypes: Array<any> = [];
  public generateGatewayId: string;
  public Id: any;
  public fileTypes: any[] = null;
  fileType: string;
  checked = true;
  checkedLocalssl = false;
  checkedCloudssl = false;
  public customerId: string;
  public custId: any;
  brokerInfo: Array<any>;
  facilityId: Array<any> = [];
  brokerLocal: any;
  brokerLocal_1: any;
  brokerCloud: any;
  public isSameAsLocalInfo = false;
  public clickhouseInfo: string;
  public host: any;
  public port: any;
  public database: any;
  public username: any;
  public password: any;
  public base64toTextFile: any;
  

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

  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<CreateGatewayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly dateAdapter: DateAdapter<Date>,
    public lookupService: LookupTermService
  ) {
    this.today.setDate(this.today.getDate());
    dateAdapter.setLocale("en-in"); 
    this.customerId = localStorage.getItem("customerId");
  }

  safeUrl(value) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }

  ngOnInit() {
    this.getGatewayId();
    this.getBrokerType();
    this.getGatewaySubType();
    this.getAllFacilitybyCustId();
    this.buildForm();
    if (this.data) {
      this.base64Editdata = this.data.brokerInfo[0].caCertificate;
      this.cloud64Editdata = this.data.brokerInfo[1].caCertificate;
      this.checkedLocalssl = this.data.brokerInfo[0].isSslEnabled;
      this.checkedCloudssl = this.data.brokerInfo[1].isSslEnabled;
      this.isfileSelected = true;
    }
  }

  getGatewayId(): void {
    if (!this.data) {
      this.configurationServices.getGwId().subscribe((res) => {
        this.generateGatewayId = res.results;
        console.log(this.generateGatewayId);
        this.buildForm();
      });
    }
  }

  onChange(data) { }

  getAllFacilitybyCustId(): void {
    this.Id = this.data.id;
    if (this.data.id) {
      this.configurationServices
        .getAllFacilitybyCustomerId(this.customerId, this.Id)
        .subscribe((res) => {
          this.facilityListbyCustomer = res.results;
          console.log("Modify", this.facilityListbyCustomer);
        });
    } else {
      this.configurationServices
        .getAllFacilitybyCustomerId(this.customerId, this.Id)
        .subscribe((res) => {
          this.facilityListbyCustomer = res.results;
          console.log("Create", this.facilityListbyCustomer);
        });
    }
  }
  getBrokerType() {
    this.lookupService.getAppTermsWrapper("BrokerType").subscribe((res) => {
      this.brokerTypes = res.BrokerType ?? [];
    });
  }

  getGatewaySubType() {
    this.lookupService.getAppTermsWrapper("GatewaySubtype").subscribe((res) => {
      this.gatewaySubTypes = res.GatewaySubtype ?? [];
      console.log(this.gatewaySubTypes);
    });
  }

  handleFileSelect(evt) {
    console.log('EVENT', evt);
    const files = evt.target.files;
    if (files.length > 2) {
      this.toastr.warning('Warning', `sorry, you can upload only 1 file!`);
      this.thisDialogRef.close('confirm');
    }

    for (let i in files) {
      const file = files[i];
      if (files && file) {
        this.fileType = file.type;
        const reader = new FileReader();
        reader.onload = this._handleReaderLoaded.bind(this);
        console.log('event value ', evt.target.id);
      }
    }
  }

  _handleReaderLoaded(readerEvt, cid) {
    const binaryString = readerEvt.target.result;
    console.log('binaryString', binaryString);
    this.base64Data = btoa(binaryString);
    this.cloud64Data = btoa(binaryString);
    this.base64Editdata = btoa(binaryString)
    this.cloud64Editdata = btoa(binaryString)
    this.isfileSelected = true;
    console.log('base64Data ---> ' + this.base64Data);
    console.log('cloudbase64Data ---> ' + this.cloud64Data);
    console.log('base64Editdata ---->' + this.base64Editdata)

    this.base64toTextFile = this.safeUrl(atob(this.base64Data))
    console.log('decoded ---> ' + atob(this.base64Data));

    this.base64toTextFile = window.atob(this.base64Data);
  }

  removeLocalFile() {
    this.gatewayForm.get("localbase64Data").reset();
    this.base64Editdata = null;
    this.isfileSelected = false;
  }

  removeCloudFile() {
    this.gatewayForm.get("cloudbase64Data").reset();
    this.cloud64Editdata = null;
    this.isfileSelected = false;
  }

  changelocalValue(value) {
    this.checkedLocalssl = !value;
    if (this.checkedLocalssl === true) {
      this.isfileSelected = false;
    }
    else {
      this.isfileSelected = true;
    }
  }
  changecloudValue(value) {
    this.checkedCloudssl = !value;
    if (this.checkedCloudssl === true) {
      this.isfileSelected = false;
    }
    else {
      this.isfileSelected = true;
    }
  }

  isSameAsLocal(checked) {
    this.isSameAsLocalInfo = checked;
    if (checked === true) {
      this.gatewayForm.controls.cloudHost.setValue(this.gatewayForm.get("localHost").value);
      this.gatewayForm.controls.cloudPort.setValue(this.gatewayForm.get("localPort").value);
      this.gatewayForm.controls.cloudmprotocol.setValue(this.gatewayForm.get("localmprotocol").value);
      this.gatewayForm.controls.cloudwport.setValue(this.gatewayForm.get("localwport").value);
      this.gatewayForm.controls.cloudwprotocol.setValue(this.gatewayForm.get("localwprotocol").value);
      this.gatewayForm.controls.cloudUserName.setValue(this.gatewayForm.get("localUserName").value);
      this.gatewayForm.controls.cloudPassword.setValue(this.gatewayForm.get("localPassword").value);
      this.gatewayForm.controls.cloudIsSslEnabled.setValue(this.gatewayForm.get("localIsSslEnabled").value);
      this.gatewayForm.controls.cloudbase64Data.setValue(this.base64Data);
      if (this.gatewayForm.get("localIsSslEnabled").value === true) {
        this.checkedCloudssl = true;
      }
    } else {
      this.gatewayForm.get("cloudHost").reset();
      this.gatewayForm.get("cloudPort").reset();
      this.gatewayForm.get("cloudmprotocol").reset();
      this.gatewayForm.get("cloudwport").reset();
      this.gatewayForm.get("cloudwprotocol").reset();
      this.gatewayForm.get("cloudUserName").reset();
      this.gatewayForm.get("cloudPassword").reset();
      this.gatewayForm.get("cloudIsSslEnabled").reset();
      this.gatewayForm.get("cloudbase64Data").reset();
      this.checkedCloudssl = false;
    }
    this.gatewayForm.get("cloudHost").updateValueAndValidity();
    this.gatewayForm.get("cloudPort").updateValueAndValidity();
    this.gatewayForm.get("cloudmprotocol").updateValueAndValidity();
    this.gatewayForm.get("cloudwport").updateValueAndValidity();
    this.gatewayForm.get("cloudwprotocol").updateValueAndValidity();
    this.gatewayForm.get("cloudUserName").updateValueAndValidity();
    this.gatewayForm.get("cloudPassword").updateValueAndValidity();
    this.gatewayForm.get("cloudIsSslEnabled").updateValueAndValidity();
    this.gatewayForm.get("cloudbase64Data").updateValueAndValidity();
  }
  
  public buildForm() {
    if (this.data && typeof this.data.clickhouseInfo === 'string') {
      try {
        this.data.clickhouseInfo = JSON.parse(this.data.clickhouseInfo);
      } catch (e) {
        console.error('Invalid JSON in clickhouseInfo:', e);
        this.data.clickhouseInfo = {};
      }
    }

    console.log(this.data);

    const data = this.data || {};
    const brokerInfo = data.brokerInfo || [{}, {}];
    const clickhouse = data.clickhouseInfo || {};

    this.gatewayForm = this.form.group({
      brokerTypeId: [data.brokerTypeId || false],
      facilityIds: [data.facilityIds || null, [Validators.required]],
      gatewayId: [{ value: data.gatewayId || this.generateGatewayId, disabled: true }],
      gatewaySubtype: [data.gatewaySubtype || null, [Validators.required]],
      gatewayName: [data.gatewayName || null, [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      ipAddress: [data.ipAddress || null, [Validators.pattern(/^(?:\d{1,3}\.){3}\d{1,3}$/)]],
      kernelVersion: [data.kernelVersion || null],
      softwareVersion: [data.softwareVersion || null],

      localHost: [brokerInfo[0]?.hostName || null, [Validators.required]],
      localPort: [brokerInfo[0]?.mport || null, [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      localwport: [brokerInfo[0]?.wport || null, [Validators.required]],
      localmprotocol: [brokerInfo[0]?.mprotocol || null, [Validators.required]],
      localwprotocol: [brokerInfo[0]?.wprotocol || null, [Validators.required]],
      localIsSslEnabled: [brokerInfo[0]?.isSslEnabled || null],
      localbase64Data: [brokerInfo[0]?.caCertificate || null],
      localUserName: [brokerInfo[0]?.userName || null, [Validators.required]],
      localPassword: [brokerInfo[0]?.password || null, [Validators.required]],

      cloudHost: [brokerInfo[1]?.hostName || null, [Validators.required]],
      cloudPort: [brokerInfo[1]?.mport || null, [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      cloudwport: [brokerInfo[1]?.wport || null, [Validators.required]],
      cloudmprotocol: [brokerInfo[1]?.mprotocol || null, [Validators.required]],
      cloudwprotocol: [brokerInfo[1]?.wprotocol || null, [Validators.required]],
      cloudUserName: [brokerInfo[1]?.userName || null, [Validators.required]],
      cloudIsSslEnabled: [brokerInfo[0]?.isSslEnabled || null],
      cloudbase64Data: [brokerInfo[0]?.caCertificate || null],
      cloudPassword: [brokerInfo[1]?.password || null, [Validators.required]],

      ssidName: [data.ssidName || null],
      ssidPassword: [data.ssidPassword || null],
      portNumber: [data.portNumber || null, [Validators.pattern(/^\d{4,5}$/)]],

      host: [clickhouse.host || null, [Validators.required]],
      port: [clickhouse.port || null, [Validators.pattern(/^\d{4,5}$/)]],
      database: [clickhouse.database || null, [Validators.required]],
      username: [clickhouse.username || null, [Validators.required]],
      password: [clickhouse.password || null, [Validators.required]],
    });
  }

  private getclickHouseValues() {
    return this.form.group({
      host: [this.gatewayForm.controls["host"].value ? this.gatewayForm.controls["host"].value : null],
      port: [this.gatewayForm.controls["port"].value ? this.gatewayForm.controls["port"].value : null],
      database: [this.gatewayForm.controls["database"].value ? this.gatewayForm.controls["database"].value : null],
      username: [this.gatewayForm.controls["username"].value ? this.gatewayForm.controls["username"].value : null],
      password: [this.gatewayForm.controls["password"].value ? this.gatewayForm.controls["password"].value : null],
    });
  }

  public saveGateway() {
    this.isDisabled = true;
    this.createGateway = new CreateGateway(null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.createGateway.gatewayName = this.gatewayForm.controls["gatewayName"].value;
    this.createGateway.facilityIds = this.gatewayForm.value.facilityIds;
    this.createGateway.gatewayId = this.gatewayForm.controls["gatewayId"].value;
    this.createGateway.gatewaySubtype = this.gatewayForm.controls["gatewaySubtype"].value;
    this.createGateway.ipAddress = this.gatewayForm.controls["ipAddress"].value;
    this.createGateway.kernelVersion = this.gatewayForm.controls["kernelVersion"].value;
    this.createGateway.portNumber = this.gatewayForm.controls["portNumber"].value;
    this.createGateway.softwareVersion = this.gatewayForm.controls["softwareVersion"].value;
    this.createGateway.ssidName = this.gatewayForm.controls["ssidName"].value;
    this.createGateway.ssidPassword = this.gatewayForm.controls["ssidPassword"].value;

    if (this.isSameAsLocalInfo === true) {
      this.brokerInfo = [];
      this.brokerLocal = {
        brokerTypeId: "BT-LO",
        hostName: this.gatewayForm.controls["localHost"].value,
        password: this.gatewayForm.controls["localPassword"].value,
        mport: this.gatewayForm.controls["localPort"].value,
        userName: this.gatewayForm.controls["localUserName"].value,
        mprotocol: this.gatewayForm.controls["localmprotocol"].value,
        wport: this.gatewayForm.controls["localwport"].value,
        wprotocol: this.gatewayForm.controls["localwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["localIsSslEnabled"].value,
        caCertificate: this.base64Data, 
      };
      this.brokerLocal_1 = {
        brokerTypeId: "BT-CL",
        hostName: this.gatewayForm.controls["cloudHost"].value,
        password: this.gatewayForm.controls["cloudPassword"].value,
        mport: this.gatewayForm.controls["cloudPort"].value,
        userName: this.gatewayForm.controls["cloudUserName"].value,
        mprotocol: this.gatewayForm.controls["cloudmprotocol"].value,
        wport: this.gatewayForm.controls["cloudwport"].value,
        wprotocol: this.gatewayForm.controls["cloudwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["cloudIsSslEnabled"].value,
        caCertificate: this.base64Data,
      };
      this.brokerInfo.push(this.brokerLocal);
      this.brokerInfo.push(this.brokerLocal_1); 
    } else {
      this.brokerInfo = [];
      this.brokerLocal = {
        brokerTypeId: "BT-LO",
        hostName: this.gatewayForm.controls["localHost"].value,
        password: this.gatewayForm.controls["localPassword"].value,
        mport: this.gatewayForm.controls["localPort"].value,
        userName: this.gatewayForm.controls["localUserName"].value,
        mprotocol: this.gatewayForm.controls["localmprotocol"].value,
        wport: this.gatewayForm.controls["localwport"].value,
        wprotocol: this.gatewayForm.controls["localwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["localIsSslEnabled"].value,
        caCertificate: this.base64Data, 
      };

      this.brokerCloud = {
        brokerTypeId: "BT-CL",
        hostName: this.gatewayForm.controls["cloudHost"].value,
        password: this.gatewayForm.controls["cloudPassword"].value,
        mport: this.gatewayForm.controls["cloudPort"].value,
        userName: this.gatewayForm.controls["cloudUserName"].value,
        mprotocol: this.gatewayForm.controls["cloudmprotocol"].value,
        wport: this.gatewayForm.controls["cloudwport"].value,
        wprotocol: this.gatewayForm.controls["cloudwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["cloudIsSslEnabled"].value,
        caCertificate: this.cloud64Data
      };
      this.brokerInfo.push(this.brokerLocal);
      this.brokerInfo.push(this.brokerCloud);
    }
    this.createGateway.brokerInfo = this.brokerInfo;
    this.createGateway.clickhouseInfo = JSON.stringify(this.getclickHouseValues().value);
    console.log("create gateway", this.createGateway);
    
    this.configurationServices.saveGateway(this.createGateway).subscribe(
      (res) => {
        if (res.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.toastr.success("Success", `${res.message}`);
        this.thisDialogRef.close("confirm");
      },
      (error) => {
        this.isDisabled = false;
        this.toastr.error("Error", `${error.error.message}`);
      }
    );
  }
  public updateGateway(id) {
    this.isDisabled = true;
    this.editGateway = new EditGateway(null, null, null, null, null, null, null, null, null, null, null, null);

    this.editGateway.gatewayName = this.gatewayForm.controls["gatewayName"].value;
    this.editGateway.facilityIds = this.gatewayForm.controls["facilityIds"].value;
    this.editGateway.gatewayId = this.gatewayForm.controls["gatewayId"].value;
    this.editGateway.gatewaySubtype = this.gatewayForm.controls["gatewaySubtype"].value;
    this.editGateway.ipAddress = this.gatewayForm.controls["ipAddress"].value;
    this.editGateway.kernelVersion = this.gatewayForm.controls["kernelVersion"].value;
    this.editGateway.portNumber = this.gatewayForm.controls["portNumber"].value;
    this.editGateway.softwareVersion = this.gatewayForm.controls["softwareVersion"].value;
    this.editGateway.ssidName = this.gatewayForm.controls["ssidName"].value;
    this.editGateway.ssidPassword = this.gatewayForm.controls["ssidPassword"].value;

    if (this.isSameAsLocalInfo === true) {
      this.brokerInfo = [];
      this.brokerLocal = {
        brokerTypeId: "BT-LO",
        gatewayBrokerId: this.data.brokerInfo[0].gatewayBrokerId,
        hostName: this.gatewayForm.controls["localHost"].value,
        password: this.gatewayForm.controls["localPassword"].value,
        mport: this.gatewayForm.controls["localPort"].value,
        userName: this.gatewayForm.controls["localUserName"].value,
        mprotocol: this.gatewayForm.controls["localmprotocol"].value,
        wport: this.gatewayForm.controls["localwport"].value,
        wprotocol: this.gatewayForm.controls["localwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["localIsSslEnabled"].value,
        caCertificate: this.base64Editdata,
      };
      this.brokerLocal_1 = {
        brokerTypeId: "BT-CL",
        gatewayBrokerId: this.data.brokerInfo[1].gatewayBrokerId,
        hostName: this.gatewayForm.controls["localHost"].value,
        password: this.gatewayForm.controls["localPassword"].value,
        mport: this.gatewayForm.controls["localPort"].value,
        userName: this.gatewayForm.controls["localUserName"].value,
        mprotocol: this.gatewayForm.controls["cloudmprotocol"].value,
        wport: this.gatewayForm.controls["cloudwport"].value,
        wprotocol: this.gatewayForm.controls["cloudwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["cloudIsSslEnabled"].value,
        caCertificate: this.base64Editdata,
      };
      this.brokerInfo.push(this.brokerLocal);
      this.brokerInfo.push(this.brokerLocal_1); 
    } else {
      this.brokerInfo = [];
      this.brokerLocal = {
        brokerTypeId: "BT-LO",
        gatewayBrokerId: this.data.brokerInfo[0].gatewayBrokerId,
        hostName: this.gatewayForm.controls["localHost"].value,
        password: this.gatewayForm.controls["localPassword"].value,
        mport: this.gatewayForm.controls["localPort"].value,
        userName: this.gatewayForm.controls["localUserName"].value,
        mprotocol: this.gatewayForm.controls["localmprotocol"].value,
        wport: this.gatewayForm.controls["localwport"].value,
        wprotocol: this.gatewayForm.controls["localwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["localIsSslEnabled"].value,
        caCertificate: this.base64Editdata,
      };

      this.brokerCloud = {
        brokerTypeId: "BT-CL",
        gatewayBrokerId: this.data.brokerInfo[1].gatewayBrokerId,
        hostName: this.gatewayForm.controls["cloudHost"].value,
        password: this.gatewayForm.controls["cloudPassword"].value,
        mport: this.gatewayForm.controls["cloudPort"].value,
        userName: this.gatewayForm.controls["cloudUserName"].value,
        mprotocol: this.gatewayForm.controls["cloudmprotocol"].value,
        wport: this.gatewayForm.controls["cloudwport"].value,
        wprotocol: this.gatewayForm.controls["cloudwprotocol"].value,
        isSslEnabled: this.gatewayForm.controls["cloudIsSslEnabled"].value,
        caCertificate: this.cloud64Editdata,
      };
      this.brokerInfo.push(this.brokerLocal);
      this.brokerInfo.push(this.brokerCloud);
    }
    this.editGateway.brokerInfo = this.brokerInfo;
    console.log("modify gateway", this.editGateway);
    this.editGateway.id = id;
   
    this.configurationServices.editGateway(this.editGateway).subscribe(
      (result) => {
        if (result.statusCode !== 1) {
          this.isDisabled = false;
        }
        this.toastr.success("Success", `${result.message}`);
        this.thisDialogRef.close("confirm");
      },
      (err) => {
        this.isDisabled = false;
        this.toastr.error("Error", `${err.error.message}`);
      }
    );
  }

  fixClick() {
    console.log("");
  }
}
