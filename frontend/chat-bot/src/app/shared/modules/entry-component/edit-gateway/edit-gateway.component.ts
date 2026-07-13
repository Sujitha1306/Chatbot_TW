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
import { Component, OnInit, Input, Inject, AfterViewInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormGroup, FormBuilder, Validators, FormControl,  ValidationErrors } from "@angular/forms";
import { DomSanitizer } from '@angular/platform-browser';
import { DateAdapter } from "@angular/material/core";
import { CreateGatewayJobs, CreateFacility, CreateServer, UpdateFacility, EditServer, EditGatewayJobs} from "./edit-gateway.model"
import { CommonService, ConfigurationService } from "../../../services";
import { routerTransition } from "../../../../router.animations";
import { ErrorStateMatcherService } from "../../../services/error-state-matcher.service";
import { GatewayConfigurationComponent } from "../gateway-configuration/gateway-configuration.component";
import { AppToastService } from "../../../services/toaster.service";
import { LookupTermService } from "../../../lookup-term.service";

@Component({
  selector: "app-edit-gateway",
  templateUrl: "./edit-gateway.component.html",
  styleUrls: ["./edit-gateway.component.scss"],
  animations: [routerTransition()],
})

export class EditGatewayComponent implements OnInit, AfterViewInit {
  @Input() max: Date | null;
  today = new Date();

  public jobServerForm: FormGroup;
  public facilityForm: FormGroup;
  public serverForm: FormGroup;
  public gwConfigForm: FormGroup;
  public createFacility: CreateFacility;
  public updateFacility: UpdateFacility;
  public createServer: CreateServer;
  public editServer: EditServer;
  public createJobs: CreateGatewayJobs;
  public editJob: EditGatewayJobs;
  public matcher = new ErrorStateMatcherService();
  public isDisabled = false;
  public facilityListbyCustomer = [];
  public generateGatewayId: string;
  public Id: any;
  public customerId: string;
  public selectedIndex = 0;
  selectedRow = null;
  FCdataSource = new MatTableDataSource();
  SRdataSource = new MatTableDataSource();
  JBdataSource = new MatTableDataSource();
  TKdataSource = new MatTableDataSource();
  dataSource = new MatTableDataSource<any>();
  public facilityTopicTypeList: any = [{ code: 'FTT-FA', value: 'Facility' }, { code: 'FTT-FL', value: 'Floor' }];
  public facilityMenu = [{"name": "Modify", "type": "facility", "value": null}];
  public serverMenu = [{"name": "Modify", "type": "server","value": null },{"name": "Config","type": "serverConfig", "value": "config"}, {"name": "Job", "type": "jobTab", "value": null}];
  public jobMenu = [{"name": "Modify", "type": "job", "value": null}, {"name": "Config","type": "jobConfig", "value": "config"}, {"name": "Task", "type": "taskTab", "value": null}]
  public taskMenu = [{"name": "Task Config","type": "taskConfig", "value": "config"}];
  public facilitys: any = [];
  popHeight: any;
  contentHeight: number;
  selectedTab: any;
  facilityID: any;
  facilityData: any = [];
  serverData: any = [];
  jobData: any = [];
  isEdit = false;
  topicName = 'Facility';
  facilityIdName: any;
  isNameEdit = true;
  gwId = null;
  selectServerList: any = [];
  masterselectionList: any = {
    'MT-APP': [],
    'MT-JOB': [],
    'MT-TASK': [],
  };
  brockerList: any = [];
  cloudList: any = [];
  editServerId = null;
  isServerEdit = false;
  taskData: any = [];
  isJobEdit = false;
  isTaskEdit = false;
  licenseData: any = [];
  configData: any = [];
  mappingId: any;
  pfConfigList: any = [];
  jobType: any = [];
  multiConfig = false;
  configTypeData: any = [];
  jobList: any = [];
  selectedFacility = null;
  multiDataExist: any;
  serverTableData: any=[];
  jobTableData: any=[];
  taskTableData: any=[];
  configDetail = [];
  taskList: any=[];
  selectedServer = [];
  taskId = null;
  height: number;
  facilityList = [];
  selectedActionRow = null;
  selectServerListPrev = [];
  constructor(
    public form: FormBuilder,
    public toastr: AppToastService,
    public snackbar: MatSnackBar,
    public thisDialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    protected sanitizer: DomSanitizer,
    private readonly configurationServices: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly lookupService: LookupTermService
  ) {
    this.today.setDate(this.today.getDate());
    dateAdapter.setLocale("en-in");
    this.customerId = localStorage.getItem("customerId");
  }
  ngAfterViewInit() {
    this.height = window.innerHeight;
  }
  ngOnInit() {
    this.getGatewayIdByFacility();
    this.getselectServer();
    this.getGWmaster('MT-APP', null);
    this.getAllbroker();
    if (this.data.id) {
      this.getAllGwDate(this.data.id);
      this.gwId = this.data.id
      if (this.data.name) {
        this.isNameEdit = false
      }
    } else {
      this.getAllFacilitybyCustId(null);
    }
    this.buildForm();
    this.lookupService.getAppTermsWrapper('GatewayJobType').subscribe((res) => {
      this.jobType = res.GatewayJobType ?? [];
    });
  }
  tabClick(event, index, data) {
    if (index && data) {
      this.selectedTab = index;
      this.selectedIndex = index;
    } else {
      this.selectedTab = event.index;
      this.selectedIndex = event.index;
    }
    if(this.selectedTab === 2 && this.selectedServer?.length === 0) {
      this.getJobServer(this.serverData[0]);
    }
  }

  triggerAction(event: any): void {
    this.taskList = [];
    this.taskTableData = [];

    const key = event.key;
    const keyVal = event.keyVal;
    const data = event.data;

    switch (key) {
      case 'job':
        this.editJobs(key, data);
        if (this.taskId === data?.id) {
          this.getTask(this.taskId);
        }
        break;

      case 'task':
        this.saveTask(data, keyVal);
        break;

      case 'server':
        this.editGwServer(data);
        break;

      case 'facility':
        this.isEdit = true;
        this.editFacility(data);
        break;

      case 'serverTab':
        this.selectedTab = 1;
        this.selectedIndex = 1;
        this.serverForm.controls['twServerId'].setValue(data.id);
        break;

      case 'jobTab':
        this.selectedTab = 2;
        this.selectedIndex = 2;
        this.jobServerForm.controls['gwServer'].setValue(data.id);
        this.getGWmaster('MT-JOB', data.id);
        this.selectedServer = this.serverData.filter(x => x.id === data.id);
        if (this.selectedServer.length > 0) {
          this.getJobServer(this.selectedServer[0]);
        }
        break;

      case 'taskTab':
        this.getGWmaster('MT-JOB', this.jobServerForm.controls['gwServer'].value);
        this.taskId = data.id;
        this.getTask(this.taskId);
        break;

      default:
        if (keyVal === 'config') {
          this.createConfig(key, data);
          const isTaskType = data?.gwMasterSubType?.startsWith('TASKT');
          if (isTaskType || this.taskId === data?.id) {
            this.getTask(this.taskId);
          }
        }
        break;
    }
  }

  getTask(id) {
    console.log(this.taskList, this.mappingId);
    this.configurationServices.getGatewayJobTaskList(id).subscribe((res) => {
      this.taskTableData = res.results;
      if(res.results.tasks?.length !== 0) {
        this.taskList = res.results.tasks;
        for(let i=0; i<this.taskList?.length; i++) {
          const value = JSON.parse(this.taskList[i]['configValue']);
          this.taskList[i]['is_editable'] = value['is_editable'];
          if(this.taskList[i].isActive !== null) {
            this.taskList[i]['is_enable'] = this.taskList[i].isActive;
            this.taskList[i]['is_enable_but'] = this.taskList[i].isActive;
          } else {
            this.taskList[i]['is_enable'] = value['is_enable'];
            this.taskList[i]['is_enable_but'] = value['is_enable'];
          }
        }
      }
    });
  }

  getGatewayIdByFacility(): void {
    if (!this.data) {
      this.configurationServices.getGatewayId().subscribe((res) => {
        this.generateGatewayId = res.results;
        this.buildForm();
      });
    }
  }
  onWindowResized(size) {
    this.popHeight = size;
    this.contentHeight = size - 180;
  }

  onChange(data) { }

  getAllGwDate(id): void {
    this.serverTableData = [];
    this.jobTableData = [];
    this.configurationServices.getAllNewGateways(id).subscribe((res) => {
      this.facilityData = res.results[0]?.facilities;
      this.serverData = res.results[0]?.servers;
      this.serverTableData = this.serverData;
      this.serverTableData.forEach(x=> {
        x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
      })
      if(this.serverTableData?.length > 0) {
        this.selectServerList = this.selectServerList.filter(item1 =>
          this.serverTableData?.findIndex(item2 => item1['id'] === item2['twServerId']) === -1
        );
      }
      this.jobData = [];
      for (let i in this.serverData) {
        for (let j in this.serverData[i].jobs) {
          this.jobData.push(this.serverData[i].jobs[j]);
        }
      }
      this.facilitys = this.facilityData;
      this.getAllFacilitybyCustId(this.data.id);
      if (this.data?.type === 'server') {
        this.selectedTab = 0;
        this.selectedIndex = 0;
        this.editFacility(this.data.selectedData);
      } else if (this.data?.type === 'job') {
        this.selectedTab = 1;
        this.selectedIndex = 1;
        this.editGwServer(this.data.selectedData);
        this.serverTableData = this.serverData.filter(x => x.twServerId === this.data.selectedData?.twServerId);
        this.serverTableData.forEach(x=> {
          x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
        })
        if(this.data?.subType === 'config') {
          this.createConfig('serverConfig', this.data?.selectedData);
        }
      } else {
        this.selectedTab = 2;
        this.selectedIndex = 2;
        this.selectedServer = this.serverData.filter(x => x.id === this.data.selectedData.gwServerId);
        this.getJobServer(this.selectedServer[0]);
        this.editJobs('job', this.data.selectedData);
        this.jobTableData = this.jobData.filter(x => x.gwServerId === this.data.selectedData?.gwServerId);
        this.jobTableData.forEach(x=> {
          x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
        })
        if(this.data?.subType === 'config') {
          this.createConfig('jobConfig', this.data?.selectedData);
        } else if(this.data?.subType === 'task') {
          this.getGWmaster('MT-JOB', this.jobServerForm.controls['gwServer'].value);
          this.taskId = this.data.selectedData.id;
          this.getTask(this.taskId);
        }
      }
      if (this.data?.tab) {
        const event: { [key: string]: any } = {};
        event['data'] = this.data.selectedData;
        event['key'] = this.data.tab;
        this.triggerAction(event);
      }
    });
  }

  getAllFacilitybyCustId(gwId): void {
    this.configurationServices.getNonAssociateFacility().subscribe((res) => {
      this.facilityList = res.results;
      this.facilityListbyCustomer = res.results;
    });
  }

  public buildForm() {
    this.facilityForm = this.form.group({
      id: [null],
      gatewayId: [{ value: this.data.id ? this.data.id : this.generateGatewayId, disabled: true, }, [Validators.required]],
      gatewayName: [this.data.name ? this.data.name : null, [Validators.required]],
      facilityId: [null, [Validators.required, this.checkFacilty.bind(this)]],
      facilityTopicType: ['FTT-FA', [Validators.required]],
    });
    this.serverForm = this.form.group({
      name: [null, [Validators.required]],
      twServerId: [null, [Validators.required]],
      cloudBroker: [null,[Validators.required]],
      localBroker: [null],
      gwMasterId: [null, [Validators.required]],
      isEnabled: [true]
    });
    this.jobServerForm = this.form.group({
      jobId: [null],
      jobName: [null, [Validators.required]],
      gwServer: [null],
      gwJob: [null],
      isEnabled: [true]
    });
    this.gwConfigForm = this.form.group({
      configValue: [null, []],
      configJob: [null, [Validators.required]],
      configId: [null, [Validators.required]],
    });
  }

  private checkFacilty(control: FormControl): ValidationErrors | null {
      if (control.value !== null) {
        for(let i in this.facilitys){
          if(control.value === this.facilitys[i].facilityId && (this.selectedFacility !== control.value)){
            return { requireMatch: true };
          }
        }
    }
  }

  clear(type) {
    if (type == 'facility') {
      this.isEdit = false;
      this.facilityForm.controls.gatewayId.setValue(this.data.id ? this.data.id : this.generateGatewayId);
      this.facilityForm.controls.gatewayName.setValue(this.data.name ? this.data.name : this.facilitys[0].name);
      this.facilityForm.controls.facilityId.reset();
      this.facilityForm.controls.facilityTopicType.setValue('FTT-FA');
      this.getAllFacilitybyCustId(null);
    } else if (type == 'job') {
      this.jobServerForm.reset();
      this.jobServerForm.controls['isEnabled'].setValue(true);
      this.gwConfigForm.reset();
      this.isJobEdit = false;
      this.pfConfigList = [];
      this.configTypeData = [];
      this.getJobServer(this.selectedRow)
    } else if (type == 'server') {
      this.isServerEdit = false
      this.serverForm.reset();
    } else {
      this.isTaskEdit = false
    }
  }

  createConfig(type, event){
    let configType = '';
    let identifyingType = '';

    if (type === 'serverConfig') {
      configType = 'CFT-SC';
      identifyingType = 'CIT-GS';
    } else if (type === 'jobConfig') {
      configType = 'CFT-JC';
      identifyingType = 'CIT-GJ';
    } else {
      configType = 'CFT-TC';
      identifyingType = 'CIT-GT';
    }

    let data = {
      gwId: this.gwId,
      groupTypeId: 'CGT-MAS',
      groupConfigId: 'CGT-CON',
      configType: configType,
      identifyingType: identifyingType,
      identifyingId: event.id,
      masterIdentifyingId: event.gwMasterId,
    };
    let taskDetails = null;
    if(data?.identifyingId === null) {
      taskDetails = {"gwServerId": this.selectedRow.id, //server table id
      "gwMasterId": data.masterIdentifyingId, //task Id
      "parentId": this.taskId, //job table id
      "isActive": event?.is_enable_but
      }
      data['taskDetails'] = taskDetails;
    }
    const dialogRef = this.dialog.open(GatewayConfigurationComponent, {
      data: data, panelClass: ['medium-popup'], disableClose: true,
    });
    dialogRef.afterClosed().subscribe((results) => {
      this.getGWmaster('MT-JOB', this.jobServerForm.controls['gwServer'].value);
      this.getTask(this.taskId);
    });
  }

  getFacility(data) {
    this.facilityID = data.facilityId;
    this.facilityIdName = data.facilityName;
  }
  getTopicType(data) {
    this.topicName = data.value;
  }
  saveFacility() {
    this.isEdit = false;
    this.selectedFacility = null;
    let facilityDetails = JSON.parse(JSON.stringify(this.facilitys))
    this.facilitys = [];
    const data = {
      'id': null,
      'facilityId': this.facilityForm.controls['facilityId'].value,
      'facilityName': this.facilityIdName,
      'name': this.facilityForm.controls['gatewayName'].value,
      'facilityTopicTypeName': this.topicName,
      "facilityTopicType": this.facilityForm.controls['facilityTopicType'].value,
      "identifyingId": this.facilityForm.controls['gatewayId'].value,
      "isActive": true
    };
    if(this.facilityForm.controls['id'].value) {
      facilityDetails = facilityDetails.filter(x => x.id !== this.facilityForm.controls['id'].value);
    }
    facilityDetails.push(data)
    if (facilityDetails.length) {
      this.isNameEdit = false;
    }
    this.facilityForm.controls.gatewayId.setValue(this.data.id ? this.data.id : this.generateGatewayId);
    this.facilityForm.controls.gatewayName.setValue(this.data.name ? this.data.name : facilityDetails[0].name);
    this.facilityForm.controls.id.setValue(null);
    this.facilityForm.controls.facilityId.reset();
    this.facilityForm.controls.facilityTopicType.setValue('FTT-FA');
    this.facilityIdName = null;
    this.facilitys = facilityDetails;
    this.facilityListbyCustomer = this.facilityListbyCustomer.filter(x => data.facilityId !== x.facilityId);
  }
  updatesFacility(id) {
    this.isEdit = false;
    this.selectedFacility = null;
    this.facilitys = [];
    this.updateFacility = new UpdateFacility(null, null, null, null);
    this.updateFacility.facility = [
      {
        'id': this.facilityForm.controls['id'].value,
        'facilityId': this.facilityForm.controls['facilityId'].value,
        'facilityName': this.facilityIdName,
        'name': this.facilityForm.controls['gatewayName'].value,
        'facilityTopicTypeName': this.topicName,
        "facilityTopicType": this.facilityForm.controls['facilityTopicType'].value,
        "identifyingId": this.facilityForm.controls['gatewayId'].value,
        "isActive": true
      }
    ]
    this.updateFacility.id = this.facilityForm.controls['gatewayId'].value;
    this.updateFacility.name = this.facilityForm.controls['gatewayName'].value;
    this.updateFacility.isActive = true;
    this.configurationServices.updateGatewayFacility(this.facilityForm.controls['gatewayId'].value, this.updateFacility).subscribe((res) => {
      if (res.statusCode === 1) {
        this.isEdit = false;
        this.data['type'] = 'server';
        this.getAllGwDate(res.id);
      }
      this.facilityForm.reset();
      this.facilityForm.controls.facilityId.reset();
      this.facilityForm.controls.facilityTopicType.setValue('FTT-FA');
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
  editFacility(data) {
    this.facilityForm.reset();
    this.facilityListbyCustomer = this.facilityListbyCustomer.filter(x => x.facilityId !== this.selectedFacility);
    this.facilityIdName = data.facilityName
    this.isNameEdit = true;
    this.selectedFacility = data.facilityId;
    this.facilityListbyCustomer.push({facilityId: data.facilityId, facilityName: data.facilityName});
    this.facilityForm.controls.id.setValue(data.id);
    this.facilityForm.controls.gatewayName.setValue(this.data.name ? this.data.name : data.name);
    this.facilityForm.controls.gatewayId.setValue(this.data.id ? this.data.id : data.identifyingId);
    this.facilityForm.controls.facilityId.setValue(data.facilityId);
    this.facilityForm.controls.facilityTopicType.setValue(data.facilityTopicType);
  }
  public createAllFacility() {
    let facilityInfo = []
    this.createFacility = new CreateFacility(null, null, null, null);
    for (let facilitys of this.facilitys) {
      const facData = {
        'id': facilitys.id,
        'facilityId': facilitys.facilityId,
        'facilityTopicType': facilitys.facilityTopicType,
        'identifyingId': facilitys.identifyingId,
        'isActive': true,
      }
      facilityInfo.push(facData);
    }
    this.createFacility.facility = facilityInfo;
    this.createFacility.id = this.facilityForm.controls['gatewayId'].value;
    this.createFacility.name = this.facilitys[0].name;
    this.createFacility.isActive = true;
    this.configurationServices.createGatewayFacility(this.createFacility).subscribe((res) => {
      if (res.statusCode === 1) {
        this.facilityData = res.results.facility;
        this.gwId = res.results.id;
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
  updateAllFacility(id) {
    let facilityInfo = []
    this.updateFacility = new UpdateFacility(null, null, null, null);
    for (let facilitys of this.facilitys) {
      const facData = {
        'id': facilitys.id,
        'facilityId': facilitys.facilityId,
        'facilityTopicType': facilitys.facilityTopicType,
        'identifyingId': facilitys.identifyingId,
        'isActive': true,
      }
      facilityInfo.push(facData);
    }
    this.updateFacility.facility = facilityInfo;
    this.updateFacility.id = this.facilityForm.controls['gatewayId'].value;
    this.updateFacility.name = this.facilityForm.controls['gatewayName'].value;
    this.updateFacility.isActive = true;
    this.configurationServices.updateGatewayFacility(id, this.updateFacility).subscribe((res) => {
      if (res.statusCode === 1) {
        this.data.name = res.results?.name;
        this.data['type'] = 'server';
        this.getAllGwDate(res?.results?.id);
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.toastr.error("Error", `${error.error.message}`);
    });
  }

  // server Tab

  getselectServer() {
    this.configurationServices.getAllServers().subscribe((res) => {
      this.selectServerListPrev = res.results;
      this.selectServerList = res.results;
    });
  }
  getJobServer(server) {
    this.taskList = [];
    this.taskTableData = [];
    this.selectedServer = [server];
    if(this.selectedRow == null || this.selectedRow.id != server.id) {
      this.jobServerForm.reset()
      this.jobServerForm.controls['isEnabled'].setValue(true);
      this.gwConfigForm.reset();
      this.selectedRow = server;
      this.jobServerForm.controls.gwServer.setValue(server.id);
      this.jobList = server.jobs;
      this.jobTableData = this.jobList;
      this.jobTableData.forEach(x=> {
        x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
      })
      this.isJobEdit = false;
      this.getGWmaster('MT-JOB', server.id)
    }
  }

  getGWmaster(type, id) {
    let gwMasterId = null;
    if (id != null) {
      let masterData = type == 'MT-JOB' ? this.serverData.filter(val => val.id == id) : this.jobData.filter(val => val.id == id)
      if (type == 'MT-JOB') {
        this.jobList = masterData[0].jobs
      }
      if (type == 'MT-TASK') {
        this.taskData = masterData[0].tasks
      }
      gwMasterId = masterData[0]['gwMasterId']
    }
    this.configurationServices.getAllGatewayMaster(type, gwMasterId).subscribe((res) => {
      this.masterselectionList[type] = res.results;
    });
  }
  getAllbroker() {
    this.configurationServices.getAllGatewayBrocker().subscribe((res) => {
      this.brockerList = res.results.filter(resFilter => resFilter.brokerTypeId === 'BT-LO');
      this.cloudList = res.results.filter(resFilter => resFilter.brokerTypeId === 'BT-CL');
    });
  }

  saveServer() {
    let brokerIds = [this.serverForm.controls['cloudBroker'].value];
    if (this.serverForm.controls['localBroker'].value) {
      brokerIds.push(this.serverForm.controls['localBroker'].value)
    }
    this.createServer = new CreateServer(null, null, null, null, null, null);
    this.createServer.name = this.serverForm.controls['name'].value;
    this.createServer.gatewayId = this.gwId;
    this.createServer.gwMasterId = this.serverForm.controls['gwMasterId'].value;
    this.createServer.twServerId = this.serverForm.controls['twServerId'].value;
    this.createServer.brokerIds = brokerIds;
    this.createServer.isActive = this.serverForm.controls['isEnabled'].value;
    this.configurationServices.createGatewayServer(this.createServer).subscribe((res) => {
      if (res.statusCode === 1) {
        if(this.data === '') {
          this.data = res.results;
          this.data['type'] = 'job';
        } else {
        this.data['type'] = 'job';
        }
        this.getAllGwDate(this.gwId)
        this.serverForm.reset()
      } else {
        this.isDisabled = false;
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
  editGwServer(data) {
    if (data) {
      if(data?.hasOwnProperty('isEnable')) {
        data['isEnable'] = data['isEnable'] ? data['isEnable'] : false;
      }
      this.licenseData = [];
      this.licenseData['type'] = 'GwServer';
      this.licenseData['data'] = data;
    }
    if (data) {
      if(data?.hasOwnProperty('isEnable')) {
        data['isEnable'] = data['isEnable'] ? data['isEnable'] : false;
      }
      this.configData['type'] = 'server';
      this.configData['data'] = data;
    }
    this.isServerEdit = !!data?.twServerId;
    const [firstValue, secondValue] = data.brokerIds;
    this.editServerId = data.id;
    const list = this.selectServerListPrev?.filter(x => x.id === data?.twServerId);
    this.selectServerList = [...this.selectServerList,...list];
    this.serverForm.patchValue({
      name: data.name,
      twServerId: data.twServerId,
      cloudBroker: firstValue,
      localBroker: secondValue,
      gwMasterId: data.gwMasterId,
      isEnabled: data.isActive === true || data.isActive === 'Active',
    })
  }
  updateServer(id) {
    let brokerIds = [this.serverForm.controls['cloudBroker'].value];
    if (this.serverForm.controls['localBroker'].value) {
      brokerIds.push(this.serverForm.controls['localBroker'].value)
    }
    this.editServer = new EditServer(null, null, null, null, null, null);
    this.editServer.name = this.serverForm.controls['name'].value;
    this.editServer.gatewayId = this.gwId;
    this.editServer.gwMasterId = this.serverForm.controls['gwMasterId'].value;
    this.editServer.twServerId = this.serverForm.controls['twServerId'].value;
    this.editServer.brokerIds = brokerIds;
    this.editServer.isActive = this.serverForm.controls['isEnabled'].value
    this.configurationServices.UpdateGatewayServer(id, this.editServer,).subscribe((res) => {
      if (res.statusCode === 1) {
        this.data['type'] = 'job';
        this.getAllGwDate(this.gwId)
        this.serverForm.reset()
        this.isServerEdit = false;
      } else {
        this.isDisabled = false;
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
  getJobConfig(id, type) {
    this.configDetail = [];
    this.configurationServices.getAllPfConfig(id, type).subscribe((res) => {
      if(res.statusCode == 1) {
        this.configDetail = res.results; 
        let configDetail = JSON.parse(res.results[0]['configValue']);
        this.gwConfigForm.controls.configJob.setValue(configDetail.type);
        this.selectedTypConfig(configDetail.type);
        setTimeout(() => {console.log('sleep');}, 2000);  
        if(configDetail.type == 'GJT-FA') {
          let fid = configDetail['value'][0]['facilityId']
          this.gwConfigForm.controls.configId.setValue(fid);
        } else if(configDetail.type == 'GJT-MF') {
          let fid = [];
          configDetail['value'].forEach(x => {
            fid.push(x['facilityId']);
          })
          this.gwConfigForm.controls.configId.setValue(fid);
        }
      }
    });
  }
  getpfConfig(id) {
    this.configurationServices.getAllPfConfig(id, 'CGT-MAS').subscribe((res) => {
      let topic = this.facilityData.map(facility => facility.facilityTopicTypeName).includes('Floor');
      let ConfigList = this.jobType;
      let configValue = res.statusCode === 1 ? JSON.parse(res.results[0]['configValue']) : []
      if (!topic) {
        if(this.facilityData.length > 1) {
          this.pfConfigList = this.jobType.filter(val => ['GJT-FA', 'GJT-MF'].includes(val.code));
        } else {
          this.pfConfigList = this.jobType.filter(val => ['GJT-FA'].includes(val.code));
        }
      } else {
        this.pfConfigList = ConfigList.filter(val => configValue.includes(val.code));
      }
    });
  }

  selectedTypConfig(data) {
    this.gwConfigForm.controls['configId'].setValue(null);
    let code = data;
    if (code === 'GJT-FA' || code === 'GJT-MF') {
      if (code === 'GJT-MF') {
        this.multiConfig = true;
      } else {
        this.multiConfig = false;
      }
      this.configTypeData = this.facilityData.filter(val => val.facilityTopicType === 'FTT-FA');
    } else if (code === 'GJT-FL' || code === 'GJT-MFL') {
      if (code === 'GJT-MFL') {
        this.multiConfig = true;
      } else {
        this.multiConfig = false;
      }
      this.configurationServices.getAllFloorBlock('2').subscribe((res) => {
        this.configTypeData = res.results;
      });
    } else if (code === 'GJT-BL' || code === 'GJT-MB') {
      if (code === 'GJT-MB') {
        this.multiConfig = true;
      } else {
        this.multiConfig = false;
      }
      this.configurationServices.getAllFloorBlock('1').subscribe((res) => {
        this.configTypeData = res.results;
      });
    }
  }
  selectedConfig(data, isMulti) {
    this.gwConfigForm.controls.configValue.setValue(null);
    let configValue = {"type": this.gwConfigForm.controls.configJob.value, "value":[]}
    data = isMulti ? data : [data];
    if(isMulti && data?.length < 2) {
      this.multiDataExist = false;
    } else {
      this.multiDataExist = true;
    }
    for(let value of data) {
      let filterData = this.configTypeData.filter(val => this.gwConfigForm.controls.configJob.value == 'GJT-FA' || this.gwConfigForm.controls.configJob.value == 'GJT-MF' ? val.facilityId == value : val.id == value);
      if(this.gwConfigForm.controls.configJob.value == "GJT-FA" || this.gwConfigForm.controls.configJob.value == "GJT-MF") {
        configValue.value.push({"facilityId" : filterData[0]?.['facilityId']})
      }      
      if(this.gwConfigForm.controls.configJob.value == "GJT-BL" || this.gwConfigForm.controls.configJob.value == "GJT-MB") {
        configValue.value.push({"facilityId" : filterData[0]?.['facilityId'], "blockId" : filterData[0]?.['id']})
      }
      if(this.gwConfigForm.controls.configJob.value == "GJT-FL" || this.gwConfigForm.controls.configJob.value == "GJT-MFL") {
        configValue.value.push({"facilityId" : filterData[0]?.['facilityId'], "blockId" : filterData[0]?.['parentId'], "floorId" : filterData[0]?.['id']})
      }
    }
    if(configValue.value.length) {
      this.gwConfigForm.controls.configValue.setValue(JSON.stringify(configValue))
    }
  }
  manageConfig(id) {
    let configData = []
    let data = {
    configType: 'CFT-JT',
    configValue: this.gwConfigForm.controls['configValue'].value,
    identifyingId: id,
    identifyingType: 'CIT-GJ',
    groupTypeId: 'CGT-CON',
    isActive: true
    }
    configData.push(data);
    if(this.configDetail.length && this.configDetail[0]['identifyingId'] == id) {
      this.configurationServices.updateJobConfig(this.configDetail[0]['id'], configData[0]).subscribe((res) => {
      })
    } else {
      this.configurationServices.createJobConfig(configData).subscribe((res) => {
      })
    }
  }

  saveJob(type) {
    if (type === 'job') {
      const isEnable = this.jobServerForm.controls['isEnabled'].value !== null ? this.jobServerForm.controls['isEnabled'].value : false;
      this.createJobs = new CreateGatewayJobs(null, null, null, null, null, null);
      this.createJobs.name = this.jobServerForm.controls['jobName'].value;
      this.createJobs.gwMasterId = this.jobServerForm.controls['gwJob'].value; //job id
      this.createJobs.gwServerId = this.jobServerForm.controls['gwServer'].value; //server table id
      this.createJobs.isActive = isEnable;
    }
    this.configurationServices.createGatewayJob(this.createJobs).subscribe((res) => {
      if (res.statusCode === 1) {
        if (type === 'job') {
          let id = res.results.id
          this.manageConfig(id);
        }
        this.jobServerForm.reset()
        this.jobServerForm.controls['isEnabled'].setValue(true);
        const data = this.selectedServer[0];
        this.selectedRow = null;
        this.getJobServer(data);
        this.isJobEdit = false;
        this.pfConfigList = [];
        this.configTypeData = [];
        this.serverTableData = [];
        this.jobTableData = [];
        this.configurationServices.getAllNewGateways(this.gwId).subscribe((res) => {
          this.facilityData = res.results[0]?.facilities;
          this.serverData = res.results[0]?.servers;
          this.serverTableData = this.serverData;
          this.serverTableData.forEach(x=> {
            x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
          })
          this.jobData = [];
          for (let i in this.serverData) {
            for (let j in this.serverData[i].jobs) {
              this.jobData.push(this.serverData[i].jobs[j]);
            }
          }
          this.facilitys = this.facilityData;
          this.getAllFacilitybyCustId(this.data.id);
          this.selectedServer = this.serverData.filter(x => x.id === data?.id);
          this.jobTableData = this.jobData.filter(x => x.gwServerId === data?.id);
          this.jobTableData.forEach(x=> {
            x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
          })
        });
      } else {
        this.isDisabled = false;
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
saveTask(data, value) {
  this.createJobs = new CreateGatewayJobs(null, null, null, null, null, null);
  this.createJobs.gwServerId = this.selectedRow.id; //server table id
  this.createJobs.gwMasterId = data.gwMasterId; //task Id
  this.createJobs.parentId = this.taskId; //job table id
  this.createJobs.isActive = value;
  if(data?.id !== null) {
    this.configurationServices.updateGatewayJob(data.id, this.createJobs).subscribe((res) => {
      this.toastr.success("Success", `${res.message}`);
      this.getGWmaster('MT-JOB', this.jobServerForm.controls['gwServer'].value);
      this.getTask(this.taskId);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  } else {
    this.configurationServices.createGatewayJob(this.createJobs).subscribe((res) => {
      this.toastr.success("Success", `${res.message}`);
      this.getGWmaster('MT-JOB', this.jobServerForm.controls['gwServer'].value);
      this.getTask(this.taskId);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
}
  filterTable(id, type) {
    if(id) {
      if(type === 'server') {
        this.serverTableData = this.serverData?.filter(x => x.twServerId === id);
        this.serverTableData.forEach(x=> {
          x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
        })
      } else if (type === 'job') {
        this.jobTableData = this.jobData?.filter(x => x.gwMasterId === id);
        this.jobTableData.forEach(x=> {
          x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
        })
      }
    }
  }

  editJobs(type, data) {
    console.log(data)
    this.mappingId = data.id;
    if (type == 'job') {
      this.clear('job');
      this.isJobEdit = true;
      this.jobServerForm.patchValue({
        'jobId': data.id,
        'jobName': data.name,
        'gwServer': data.gwServerId,
        'gwJob': data.gwMasterId,
        'isEnabled': data.isActive === true || data.isActive === 'Active',
      });
      this.getpfConfig(data.gwMasterId);
      this.getGWmaster('MT-JOB', data.gwServerId);
      this.getJobConfig(data.id, 'CGT-CON');
    } else {
      this.isTaskEdit = true;
      this.getGWmaster('MT-JOB', data.gwServerId);
      this.getGWmaster('MT-TASK', data.gwJobId);
    }
  }

  updateJob(type, id) {
    if (type === 'job') {
      this.editJob = new EditGatewayJobs(null, null, null, null, null, null);
      this.editJob.id = this.jobServerForm.controls['jobId'].value;
      this.editJob.gwMasterId = this.jobServerForm.controls['gwJob'].value;
      this.editJob.gwServerId = this.jobServerForm.controls['gwServer'].value;
      this.editJob.name = this.jobServerForm.controls['jobName'].value
      this.editJob.isActive = this.jobServerForm.controls['isEnabled'].value;
      this.editJob.parentId = this.jobServerForm.controls['jobId'].value
    }
    this.configurationServices.updateGatewayJob(id, this.editJob).subscribe((res) => {
      if (res.statusCode === 1) {
        const data = this.selectedServer[0];
        this.selectedRow = null;
        this.manageConfig(id)
        this.getJobServer(data);
        this.isJobEdit = false;
        this.pfConfigList = [];
        this.configTypeData = [];
        this.serverTableData = [];
        this.jobTableData = [];
        this.configurationServices.getAllNewGateways(this.gwId).subscribe((res) => {
          this.facilityData = res.results[0]?.facilities;
          this.serverData = res.results[0]?.servers;
          this.serverTableData = this.serverData;
          this.serverTableData.forEach(x=> {
            x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
          })
          this.jobData = [];
          for (let i in this.serverData) {
            for (let j in this.serverData[i].jobs) {
              this.jobData.push(this.serverData[i].jobs[j]);
            }
          }
          this.facilitys = this.facilityData;
          this.getAllFacilitybyCustId(this.data.id);
          this.selectedServer = this.serverData.filter(x => x.id === data?.gwServerId);
          this.jobTableData = this.jobData.filter(x => x.gwServerId === data?.id);
          this.jobTableData.forEach(x=> {
            x['isEnable'] = x['isActive'] ? 'Enable' : 'Disable';
          })
        });
      } else {
        this.isDisabled = false;
      }
      this.toastr.success("Success", `${res.message}`);
    }, (error) => {
      this.isDisabled = false;
      this.toastr.error("Error", `${error.error.message}`);
    });
  }
  fixClick() {
    console.log("")
  }
}
