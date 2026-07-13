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
import { Component, OnInit, ViewChild, Inject, AfterViewInit, Optional, Input, ChangeDetectorRef } from "@angular/core";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { MatInput } from "@angular/material/input";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  ValidationErrors,
  FormArray
} from "@angular/forms";
import { CommonService } from "../../../services/common.service";
import "rxjs/add/observable/interval";
import { CreateRequest, EditRequest } from "./porter-request.model";
import { DatePipe } from "@angular/common";
import { ConfigurationService, HospitalService } from "../../../services";
import { ConfirmationDialog } from "../confirmation-dialog/confirmation-dialog.component";
import { CookieService } from "ngx-cookie-service";
import { PharmacyTaskComponent } from "../pharmacy-task/pharmacy-task.component";
import { ActivatedRoute } from "@angular/router";
import { locale_Json_Details } from "../../../../../localeJson/localeJson";
import { AppToastService } from "../../../services/toaster.service";
import { LookupTermService } from "../../../lookup-term.service";
import { ConfigCacheService } from "../../../config-cache.service";
import { LightboxOnlineMenuDialogComponent } from "../../../../ovitag/configuration/asset/asset.component";
import { CommonDialogComponent } from "../common-dialog-component/common-dialog.component";
import { ConfirmDialogComponent } from "../layout-save/layout-save.component";
import { SessionStorageService } from "../../../services/session.storage.service";

@Component({
  selector: "app-porter-request-new",
  templateUrl: "./porter-request-new.component.html",
  styleUrls: ["./porter-request.component.scss"],
  providers: [DatePipe],
})

export class PorterRequestNewComponent implements OnInit, AfterViewInit {
  public requestForm: FormGroup;
  public reqTypes: any;
  public assetTypes: any;
  public filterAssetType: any=[];
  public autoAssign = true;
  public selectedType: any = null;
  public subTagId: any;
  public locFromId = null;
  public srcLocationTypeId = null;
  public destLocationTypeId = null;
  public srcParentLocationId = null;
  public destParentLocationId = null;
  public locToId = null;
  public patientId: any;

  public porterId: any;
  public subList: any = null;
  public locationName: any = null;

  public searchSourceLocList: any = [];
  public searchDestLocList: any = [];
  public searchPatientlist: any = [];
  public searchPorterList: any = [];
  public searchAssetList: any = [];
  public performerInfo: any = [];
  public nonPerformerInfo: Array<any>;
  public reqPatientDetails: any = null;
  public reqPorterDetails: any = [];
  public reqAssetDetails: any = null;
  public selectedAssetType: any;
  public nonPerformerType = "patient";
  public selectedPorter: any = [];
  public selectedPatient: any = null;
  public selectedAsset: any = null;
  public editAction = false;
  public statusBasedFieldDisabled = true;
  public disableField = false;
  public filterFloorId = null;
  public filterFromTime = null;
  public filterToTime = null;
  public currentDate: any = new Date();
  public scheduleDate: any = new Date();
  public curDate = this._dateFormat.transform(this.currentDate, 'yyyy-MM-ddTHH:mm');
  public dropDate = this._dateFormat.transform(new Date(this.currentDate.getTime() + (15 * 60 * 1000)), 'yyyy-MM-ddTHH:mm');
  public porterRequestType: any = [];
  public rateDetails = [{code: '1', value: '1'}, {code: '2', value: '2'}, {code: '3', value: '3'},
  {code: '4', value: '4'}, {code: '5', value: '5'}];
  public dropTimeDuration = [{code: '15', value: '15'}, {code: '30', value: '30'},
  {code: '45', value: '45'}, {code: '60', value: '60'}];
  public requestStatus: any[] = [];
  public selectedRequestStatus: any[] = [];
  requireAssetMatchVal: any[];
  PRAssetId = null;
  public sourceId = null;
  public destinationId = null;
  requireDestMatchVal: any[];
  requiresourceMatchVal: any[];
  public fromTime: any;
  public defaultType = 'All';
  porterNameCount: number = 0;
  porterCount: number;
  porterDetail: {};
  isChecked: boolean;
  checkedDataDetail: any;
  checkedDataDetails: any = [];
  checkedDetails: any;
  isDeletable: boolean;
  abortStatus: string;
  requirePatientMatchVal: any[];
  existAsset = false;
  existPatient = false;
  locSourceOption = null;
  locDestOption = null;
  patientListItems: any;
  assetListItems: any;
  fromLocValue = '';
  toLocValue='';
  public sourceListItem = [];
  public destListItem = [];
  public porterStatusCheck = false;
  public modifyId = null;
  isPorterAdditionalExpanded = false;
  @ViewChild('comments') commentsInput: MatInput;
  @ViewChild('destinationId') destInput: MatInput;
  @ViewChild('sourceId') srcInput: MatInput;
  @ViewChild('destauto', { read: MatAutocompleteTrigger})
  autoComplete: MatAutocompleteTrigger;
  public assetType = null;
  public activate_btn: any = [];
  requestStatusDetail: any;
  isSaved = false;
  sourceLocName = null;
  initSearchLocList: any = [];
  searchLoc: any = [];
  location: any = [];
  storage: any = [];
  destLocName = null;
  pastPickupTime = false;
  pastDropTime = false;
  isSourceLoc = true;
  isDestinationLoc = true;
  public porterConfigDetail = null;
  public allowScheduledStatus = false;
  public allowHoldStatusforWT = true;
  public maxPorterLimit = 1;
  public maxLocLimit = 10;
  public hideInputs = [];
  public activityCategoryIds = [];
  public cannotAutoComplete = [];
  public cannotAutoCompleteforPool = [];
  public priorityFromLocation = [];
  public priorityToLocation = [];
  public defaultPool: any = [];
  public isAutoComplete = false;
  public checkPriorityConfig = false;
  public diasblePorterGender = false;
  public disablePoolNameId = false;
  public disablePorterPriority = false;
  public disablePorterRoundtrip = false;
  public mandatoryFields = [];
  @ViewChild('availablePorter') porterInput: MatInput;
  assetCount: any;
  porterGroup = [];
  porterGroupGlobal = [];
  allowGlobalPool = false;  
  genderList: any;
  porterValue: number;
  popWidth: any;
  popHeight: any;
  contentHeight: number;
  public poolName = null;
  public gender = null;
  public isPriority = false;
  public isRoundTrip = false;
  countClicked = false;
  public serviceGroup: any = [];
  public poolFloor: any=[];
  fieldAvailablity = null;
  public poolLocationId = null;
  public searchLocItems = [];
  public searchLocList = [];
  public ServiceLocList = [];
  serviceGroupId = null;
  departmentList: any=[];
  departmentId = null;
  showPickup = true;
  showDrop = true;
  sourceChildList: any=[];
  destChildList: any=[];
  fromLocationId = null;
  toLocationId = null;
  locFromChildId = null;
  srcChildLocationId = null;
  sourceChildLocName = null;
  srcChildLocationTypeId = null;
  locToChildId = null;
  destChildLocationId = null;
  destChildLocName = null;
  destChildLocationTypeId = null;
  sourceLocFullname = null;
  destLocFullname = null;
  childList = [];
  sourceChildPrevList: any=[];
  destChildPrevList: any=[];
  sourceParentLocation = null;
  sourceLocation = null;
  destParentLocation = null;
  destLocation = null;
  swap = false;
  PorterFieldMandatory: any=[];
  mandatoryFieldsObject: any=[];
  userId = null;
  public isWaiting = false;
  @Input() header = true;
  @Input() mobheight = false;
  selectFromRoom: boolean = false;  
  selectToRoom: boolean = false;  
  public pharmacyType = 'TAT-PA'
  checkedLabelManual: string;
  checkedLabelAuto: string;
  multiLocationGroup = ['SG-PH', 'SG-MS']
  searchSourceNonBedList: any=[];
  searchSourceBedList: any=[];
  searchDestNonBedList: any=[];
  searchDestBedList: any=[];
  sourceLocConfirmation = false;
  patientSearch = true;
  toLocStatusList = ['RQ-WT','RQ-PLN', 'RQ-SH'];
  fromLocStatusList = ['RQ-WT','RQ-PLN', 'RQ-SH'];
  typesOfPatientName = ["PR-PA"]
  remarks = null;
  sourceBlockId = null;
  destBlockId = null;
  verifyBlock = null;
  blockVerified = false;
  prePoolName = null;
  prevSearchPorterList: any = [];
  pfActivityId = null;
  preSelectedPorter: any=[];
  
  constructor(
    public fb: FormBuilder,
    public commonService: CommonService,
    private readonly hospitalService: HospitalService,
    @Optional() public thisDialogRef: MatDialogRef<PorterRequestNewComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public toastr: AppToastService,
    private readonly cookieService: CookieService,
    private readonly _dateFormat: DatePipe, public activeRoute : ActivatedRoute, private readonly cdr: ChangeDetectorRef,
    private readonly lookupTermService: LookupTermService, private readonly configCacheService: ConfigCacheService
  ) {
    const locale = localStorage.getItem(btoa('lang'))
    if(locale === 'en-US' || locale === 'en'){
      this.checkedLabelAuto = locale_Json_Details.en.checkAuto;
      this.checkedLabelManual = locale_Json_Details.en.checkManual;
    } else if(locale === 'ar'){
      this.checkedLabelAuto = locale_Json_Details.ar.checkAuto;
      this.checkedLabelManual = locale_Json_Details.ar.checkManual;
    } else if(locale === 'th'){
      this.checkedLabelAuto = locale_Json_Details.th.checkAuto;
      this.checkedLabelManual = locale_Json_Details.th.checkManual;
    } else if(locale === 'id'){
      this.checkedLabelAuto = locale_Json_Details.id.checkAuto;
      this.checkedLabelManual = locale_Json_Details.id.checkManual;
    } else {
      this.checkedLabelAuto = locale_Json_Details.en.checkAuto;
      this.checkedLabelManual = locale_Json_Details.en.checkManual;
    }
    this.activate_btn = this.commonService.getActivePermission('button');
    if(this.data == null) {
      this.data = ''
    }
  }
  ngOnInit() {
    this.lookupTermService.getAppTermsWrapper('ServiceGroup,RequestStatus,PoolName,Gender,AssetType,PorterRequestType').subscribe((res) => {
      console.log(res)
      this.requestStatus = res?.RequestStatus ?? [];
      this.porterGroup = res?.PoolName ?? [];
      this.porterGroupGlobal = res?.PoolName ?? [];
      this.genderList = res?.Gender?.filter(resFilter => resFilter.code === 'Male' || resFilter.code === 'Female') ?? [];
      this.assetTypes = res?.AssetType ?? [];
      this.serviceGroup = res?.ServiceGroup ?? [];
      this.loadData()
    });
  }
  loadData() {
    this.activeRoute.queryParams.subscribe(params => {  
      if(params.hasOwnProperty('id')) {
        this.getRequestById(params.id)
      } else if(params.hasOwnProperty('slid')) {
        this.getLocationById(params.slid)
      } else {
        this.getBasicDetails()
      }
    })    
    this.buildForm();
  }
  getBasicDetails() {
    if(this.data == null) {
      this.data = '';
    }
    if (this.data && this.data.status === 'RQ-CO') {
      this.disableField = true;
    }
    if (this.data) {
      this.modifyId = this.data.requestId;
      this.isWaiting = this.data.status == 'RQ-WT' ? false : true;
      if (this.data.status === 'RQ-PLN') {
        this.statusBasedFieldDisabled = true;
      }
      this.disablePoolNameId = this.data.status != 'RQ-WT' ? true : false;
    }
    this.buildForm();
    this.commonService.validateUserPreference('porterReqType');
    if (this.commonService.userPreference !== null) {
      if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('porterReqType')) {
        this.selectedType = this.commonService.userPreference.porterReqType.value;
      }
    }
    this.commonService.validateUserPreference('serviceGroup');
    if (this.commonService.userPreference !== null) {
      if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('serviceGroup')) {
        if(this.modifyId === null) {
          this.serviceGroupId = this.commonService.userPreference.serviceGroup.value;
        }
      }
    }
    this.commonService.validateUserPreference('department');
    if (this.commonService.userPreference !== null) {
      if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('department')) {
        if(this.modifyId === null) {
          this.departmentId = this.commonService.userPreference.department.value;
        }
      }
    }
    this.commonService.validateUserPreference('isPorterAdditionalExpanded');
    if (this.commonService.userPreference !== null) {
      if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('isPorterAdditionalExpanded')) {
        const expandValue = this.commonService.userPreference.isPorterAdditionalExpanded.value;
        if(expandValue === 'true') {
          this.isPorterAdditionalExpanded = true;
        } else {
          this.isPorterAdditionalExpanded = false;
        }
      }
    }
    this.lookupTermService.getAppTermsLinkWrapper('RQT-PO', 'PorterRequestType').subscribe(res => {
      this.porterRequestType = res?.PorterRequestType ?? [];
      this.porterRequestType.sort((a, b) => 0 - (a.code > b.code ? 1 : -1));
      this.changeTypeName()
    })
    if(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) === null ||
    this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) === '') {
      this.initSearchLocList = [];
    } else {
      this.initSearchLocList = JSON.parse(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
    }

    if(this.cookieService.check('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')))) {
      if(this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== null &&
      this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== '') {
        const data = JSON.parse(this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
        this.sourceId = data.fullName;
        this.locFromId = data.id;
        this.locSourceOption = data.id;
        this.getCurrentLocationDetails(data.id, "pickup");
        this.getAllLocationById(data,'source');
      }
    }

    const sourceData = JSON.parse(sessionStorage.getItem('porter_source_child_loc_'));
    if(sourceData && sourceData !== null) {
      this.showPickup = false;
      this.sourceChildList = sourceData.list;
      this.sourceChildPrevList = sourceData.list;
      this.sourceId = sourceData.location.fullName;
      this.locFromId = sourceData.location.id;
      this.locSourceOption = sourceData.location.id;
      this.sourceLocFullname = sourceData.location.fullName;
      this.srcLocationTypeId = sourceData.location.locationTypeId
      this.sourceLocName = sourceData.location.name;
      this.srcParentLocationId = sourceData.location.parentId;
      this.showPickup = true;
      this.getCurrentLocationDetails(sourceData.location.id, "pickup");
    }

    if(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) != '') {
      this.ServiceLocList = JSON.parse(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
      this.searchLocList = this.ServiceLocList;
    }
    
    this.sourceListItem = this.initSearchLocList;
    this.destListItem = this.initSearchLocList;
    this.searchSourceLocList = this.initSearchLocList;
    this.searchDestLocList = this.initSearchLocList;
    this.configCacheService.getConfig('porter-config').subscribe(res => {
      if (res['porter-config']) {
        this.porterConfigDetail = res['porter-config'];
        this.maxPorterLimit = res['porter-config']?.maxPorterLimit;
        if(res['porter-config'].hasOwnProperty('activityCategoryIds')) {
          this.activityCategoryIds = res['porter-config']?.activityCategoryIds;
        }
        if(res['porter-config'].hasOwnProperty('hideInputs')) {
          this.hideInputs = res['porter-config']?.hideInputs;   
          if (this.hideInputs.indexOf('isautoAssigned') > -1 && this.activate_btn.indexOf('BT_PRAUTOMANUAL') > -1) {
            this.hideInputs = this.hideInputs.filter(i => i !== 'isautoAssigned');
          }
          if (this.hideInputs.indexOf('porterCount') > -1 && this.activate_btn.indexOf('BT_PRSHOWPOCOUNT') > -1) {
            this.hideInputs = this.hideInputs.filter(i => i !== 'porterCount');
          }
        }
        if(res['porter-config']?.hasOwnProperty('maxLocLimit')) {
          this.maxLocLimit = res['porter-config']?.maxLocLimit;       
        }
        if(res['porter-config']?.hasOwnProperty('allowScheduledStatus')) {
          this.allowScheduledStatus = res['porter-config']?.allowScheduledStatus;
        }
        if(res['porter-config']?.hasOwnProperty('allowHoldStatusforWT')) {
          this.allowHoldStatusforWT = res['porter-config']?.allowHoldStatusforWT;
        }
        if(res['porter-config']?.hasOwnProperty('patientSearch')) {
          this.patientSearch = res['porter-config']?.patientSearch;       
        }
        if(res['porter-config']?.hasOwnProperty('toLocStatusList')) {
          this.toLocStatusList = res['porter-config']?.toLocStatusList;       
        }
        if(res['porter-config']?.hasOwnProperty('allowGlobalPool')) {
          this.allowGlobalPool = res['porter-config']?.allowGlobalPool;       
        }
        if(res['porter-config']?.hasOwnProperty('fromLocStatusList')) {
          this.fromLocStatusList = res['porter-config']?.fromLocStatusList;      
        }
        if(res['porter-config']?.hasOwnProperty('typesOfPatientName')) {
          this.typesOfPatientName = res['porter-config']?.typesOfPatientName;      
        }
        this.assetCount = res['porter-config']?.assetCount;
        if (res['porter-config']?.hasOwnProperty('pharmacy') && res['porter-config']?.pharmacy.hasOwnProperty('type')) {
          this.pharmacyType = res['porter-config']?.pharmacy.type;
        }
        if (res['porter-config']?.hasOwnProperty('cannotAutoComplete')) {
          this.cannotAutoComplete = res['porter-config']?.cannotAutoComplete;
        }
        if (res['porter-config']?.hasOwnProperty('cannotAutoCompleteforPool')) {
          this.cannotAutoCompleteforPool = res['porter-config']?.cannotAutoCompleteforPool;
        }
        if (res['porter-config']?.hasOwnProperty('verifyBlock')) {
          this.verifyBlock = res['porter-config']?.verifyBlock;
        }
        if (res['porter-config']?.hasOwnProperty('defaultPool')) {
          this.defaultPool = res['porter-config']?.defaultPool;
          if(!this.modifyId && this.data.hasOwnProperty('visitEventId') && this.porterConfigDetail.hasOwnProperty('OT')) {
            if(this.defaultPool.hasOwnProperty('PR-PA')) {
             this.defaultPool['PR-PA'] = this.porterConfigDetail['OT']['porterPool'];
            }
          } 
          if (this.data && this.data.poolNameId) {
            this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.data.poolNameId);
          } else if (this.defaultPool.hasOwnProperty(this.selectedType)) {
            this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.defaultPool[this.selectedType]);
          } else {
            this.requestForm.get('poolName').setValue(null);
          }
          this.requestForm.get('poolName').updateValueAndValidity();
        }
        if (res['porter-config']?.hasOwnProperty('porterGroups')) {
          this.porterGroup = this.porterGroup.filter((pg) => {
            return res['porter-config']?.porterGroups.some((cpg) => {
              return cpg === pg.code;
            });
          });
        }
        if (res['porter-config']?.hasOwnProperty('priorityFromLocation')) {
          this.priorityFromLocation = res['porter-config']?.priorityFromLocation;
          this.checkPriorityConfig = true;
          this.checkPriority();
        }
        if (res['porter-config']?.hasOwnProperty('priorityToLocation')) {
          this.priorityToLocation = res['porter-config']?.priorityToLocation;
          this.checkPriorityConfig = true;
          this.checkPriority();
        }
        if (res['porter-config']?.hasOwnProperty('diasblePorterGender')) {
          this.diasblePorterGender = res['porter-config']?.diasblePorterGender;
          if (this.diasblePorterGender && this.activate_btn.indexOf('BT_PRENABLEGENDER') > -1) {
            this.diasblePorterGender = false;
          }
        }
        if (res['porter-config']?.hasOwnProperty('disablePoolNameId')) {
          this.disablePoolNameId = res['porter-config']?.disablePoolNameId;
          if (this.disablePoolNameId && this.activate_btn.indexOf('BT_PRENABLEPOOLSELECT') > -1) {
            this.disablePoolNameId = false;
          }
        }
        if (res['porter-config']?.hasOwnProperty('disablePorterPriority')) {
          this.disablePorterPriority = res['porter-config']?.disablePorterPriority;
        }
        if (res['porter-config']?.hasOwnProperty('disablePorterRoundtrip')) {
          this.disablePorterRoundtrip = res['porter-config']?.disablePorterRoundtrip;
        }
        if (res['porter-config']?.hasOwnProperty('mandatoryFields')) {
          this.mandatoryFields = res['porter-config']?.mandatoryFields;
          if (this.requestForm.controls[this.mandatoryFields[0]]) {
            this.requestForm.get("assetCategory").setValidators([Validators.required]);
          } else {
            this.requestForm.get("assetCategory").setValidators(null);
        }
          this.requestForm.get("assetCategory").updateValueAndValidity();
          this.selectFromRoom = this.mandatoryFields.includes('fromLocationId')
                    this.selectToRoom = this.mandatoryFields.includes('toLocationId')
        }
        if (res['porter-config']?.hasOwnProperty('mandatoryFieldsObject')) {
          this.mandatoryFieldsObject = res['porter-config']?.mandatoryFieldsObject;
        }
        if (res['porter-config']?.hasOwnProperty('sourceLocConfirmation')) {
          this.sourceLocConfirmation = res['porter-config']?.sourceLocConfirmation;
        }
        this.changeTypeName()
      }
    });

    if(this.data.type && this.data.id) {
      this.getAvailablePorterType(this.data.type);
    } else if(this.data.requestCategory && this.data.requestId) {
      this.getAvailablePorterType(this.data.requestCategory);
    } else {
      this.getAvailablePorterType(this.selectedType);
    }
  }
  getLocationById(sourceId) {
    this.hospitalService.getLocationWithChildren(sourceId).subscribe(res => {
      if(res.statusCode == 1) {
        let locDetail = res.results;
        let locationDetail = {
          "fullName": locDetail.name,
          "id": locDetail.id,
          "locationTypeId": locDetail.locationTypeId,
          "name": locDetail.name,
          "parentId": locDetail.parentId,
          "blockId": locDetail.blockId
        }
        this.cookieService.set(
          'porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
          JSON.stringify(locationDetail)
        );
        this.getBasicDetails()
      }
    });
  }
  getRequestById(reqId) {
    this.commonService.getPorterReqById(reqId).subscribe(res =>  {
      if(res.statusCode == 1) {
        this.data = res.results[0];
        this.getBasicDetails()
      }
    })
  }
  changeTypeName() {
    let TypeText = {}
    if(this.porterConfigDetail && this.porterConfigDetail.hasOwnProperty('typeText')) {
      TypeText = this.porterConfigDetail.typeText;
    }
    this.porterRequestType = this.porterRequestType.map(item => {
      if (TypeText[item.code]) {
        return { ...item, value: TypeText[item.code] };
      }
      return item;
    });
    if(this.data.hasOwnProperty('infantInfo') && this.data.infantInfo) {
      let index = this.porterRequestType.findIndex(val => val.code == 'PR-PA');
      this.porterRequestType[index]['value'] = 'Infant'
    }
  }
  getAvailablePorterType(code) {
    if(this.porterRequestType.length === 0) {
      this.lookupTermService.getAppTermsLinkWrapper('RQT-PO', 'PorterRequestType').subscribe(res => {
      this.porterRequestType = res?.PorterRequestType ?? [];
        this.porterRequestType?.sort((a, b) => 0 - (a.code > b.code ? 1 : -1));
        this.changeTypeName()
        const type = this.porterRequestType?.filter(res => res.code === code);
        if(type.length === 0) {
          this.selectedType = this.porterRequestType[0]?.code;
        } else {
          this.selectedType = code;
        }
        this.getRequestType();
      });
    } else {
      const type = this.porterRequestType.filter(res => res.code === code);
      if(type.length === 0) {
        this.selectedType = this.porterRequestType[0].code;
      } else {
        this.selectedType = code;
      }
      this.getRequestType();
    }
  }

  getRequestType() {
    if (this.data && this.data.id) {
      if (this.data && this.data.status === 'RQ-PLN' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-CO' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' ||
        rs.code === 'RQ-RTN' || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-RJ' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' ||
        rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-WT' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' ||  (this.allowHoldStatusforWT && rs.code === 'RQ-HLD') || rs.code === this.data.status);
      } else if (this.data && this.data.status === 'RQ-HLD' && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' || rs.code === 'RQ-CR' || rs.code === this.data.status);
      } else if (this.data && this.data.requestId != null) {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === this.data.status);
      } else {
        this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-PLN' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
      }
      this.modifyId =  this.data.requestId;
      if(this.data?.id !== '0' && this.data?.id !== null) {
        this.editAction = Object.keys(this.data).length > 5 ? true : false;
      }
      if (this.selectedType === "PR-PA") {
        this.patientId = this.data.id;
        this.selectedPatient = this.data.name;
        this.existPatient = true;
        this.nonPerformerType = "patient";
        this.reqPatientDetails = this.data;
        if((this.data.hasOwnProperty('infantInfo') || true) && this.data.hasOwnProperty('sourceBedId') && this.data.sourceBedId) {
          this.fromToLocationBinding()
        } else {
        this.commonService.getLiveLocation('Patient', this.patientId).subscribe(res => {
          if (res.results !== null) {
            this.sourceId = res.results.locationName;
            this.locFromId = res.results.locationId;
            this.locSourceOption = res.results.locationId;
            if (this.locFromId !== null) {
            this.getCurrentLocationDetails(this.locFromId, "pickup");
            }
          } else {
            this.sourceId = null;
            this.locFromId = null;
            this.sourceBlockId = null;
            this.locSourceOption = null;
            this.requestForm.controls["sourceId"].setValue(null);
            this.requestForm.controls.sourceId.enable();
            this.requestForm.get("sourceId").updateValueAndValidity();
          }
        });
        }
        if(this.modifyId == undefined) {
          this.getSelectedType(this.selectedType, 'req');
        }
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("comments").setValidators(null);
        this.requestForm.get("comments").setValue(this.data.comments ? this.data.comments :null);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue('AT-TO');
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValidators(null);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
      } else if (this.selectedType === "PR-AT") {
          this.data.assetCategory = this.data.assetTypeId;
          this.nonPerformerType = "asset";
          this.PRAssetId = this.data.id;
          this.reqAssetDetails = this.data;
          this.selectedAsset = this.data.name;
          this.existAsset = true;
          this.commonService.getLiveLocation('Asset', this.PRAssetId).subscribe(res => {
          if (res.results !== null) {
            this.sourceId = res.results.locationName;
            this.locFromId = res.results.locationId;
            this.locSourceOption = res.results.locationId;
            if (this.locFromId !== null) {
              this.getCurrentLocationDetails(this.locFromId, "pickup");
            }
          }
        });
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators([Validators.required]);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("comments").setValidators(null);
        this.requestForm.get("comments").setValue(null);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValidators(null);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
      } else if (this.selectedType === "PR-SE"){
        this.data.assetCategory = this.data.assetTypeId;
        this.nonPerformerType = "service";
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(this.data.serviceGroupId);
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        let filterComments = this.porterRequestType.filter(val => val.code == this.selectedType);
        let comments = ''
        if(filterComments.length) {
          comments = filterComments[0]['value']
        }
        this.requestForm.get('comments').setValue(comments);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue(null);
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValidators([Validators.required]);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators([Validators.required]);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
        if(this.requestForm.controls.sourceId.value !== null &&
          this.requestForm.controls.sourceId.value !== '') {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput.focus();
            this.destListItem = [];
            this.searchDestLocList = [];
            this.searchDestBedList = [];
            this.searchDestNonBedList = [];
          });
        } else {
          setTimeout(() => {
            this.srcInput.focus();
            this.sourceListItem = [];
            this.searchSourceLocList = [];
            this.searchSourceBedList = [];
            this.searchSourceNonBedList = [];
          });
        }
      } else {
        this.data.assetCategory = this.data.assetTypeId;
        this.nonPerformerType = "others";
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get('comments').setValue(this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue('AT-TO');
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        if(this.selectedType == 'PR-OT' && this.departmentList.length) {
        this.requestForm.get("poolLocationId").setValidators([Validators.required]);
        }
        this.requestForm.get("poolLocationId").setValue(this.departmentId);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
        if(this.requestForm.controls.sourceId.value !== null &&
          this.requestForm.controls.sourceId.value !== '') {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput.focus();
            this.destListItem = [];
            this.searchDestLocList = [];
            this.searchDestBedList = [];
            this.searchDestNonBedList = [];
          });
        } else {
          setTimeout(() => {
            this.srcInput.focus();
            this.sourceListItem = [];
            this.searchSourceLocList = [];
            this.searchSourceBedList = [];
            this.searchSourceNonBedList = [];
          });
        }
      }
      if(this.locFromId !== undefined && this.locFromId !== null) {
        this.requestForm.get('sourceId').disable();
      } 
      if(this.locToId != undefined && this.locToId !== null) {
        this.requestForm.get('destinationId').disable();
      }
    } else if (this.data && !this.data.id) {
      this.editAction = true;
      if (this.data && this.data.status === 'RQ-PLN') {
        this.statusBasedFieldDisabled = true;
      }
      if (this.data.nonPerformer.length > 0 || this.data.requestCategory === "PR-SE") {
        if (this.typesOfPatientName.includes(this.data.requestCategory)) {
          this.nonPerformerType = "patient";
          this.patientId = this.data.nonPerformer[0].id;
          if(this.patientSearch) {
          this.selectedPatient = this.data.nonPerformer[0].fullName;
          } else if(this.modifyId && this.typesOfPatientName.includes(this.data.requestCategory)) {
            let patDetail = this.data.nonPerformer.filter(val => val.tagAssociationTypeId == 'TAT-PA');
            if(patDetail.length) {
              this.selectedPatient = patDetail[0]['name'];
            }
          }
          this.existPatient = true;
          this.reqPatientDetails = this.data.nonPerformer[0];
            if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for(let i = 0; i < this.data.performer.length; i++) {
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          this.sourceId = this.data.sourceLocationName;
          if (this.data.sourceBedId !== null) {
            this.locFromId = this.data.sourceBedId;
            this.locSourceOption = this.data.sourceBedId;
            this.getCurrentLocationDetails(this.data.sourceBedId, "pickup");
          } else {
            this.locFromId = this.data.sourceId;
            this.locSourceOption = this.data.sourceId;
            this.getCurrentLocationDetails(this.data.sourceId, "pickup");

          }
          this.destinationId = this.data.destinationLocationName;
          if (this.data.destinationBedId !== null) {
            this.locToId = this.data.destinationBedId;
            this.locDestOption = this.data.destinationBedId;
            this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
          } else {
            this.locToId = this.data.destinationId;
            this.locDestOption = this.data.destinationId;
            this.getCurrentLocationDetails(this.data.destinationId, "drop");
          }
          this.data.startTime = this._dateFormat.transform(
            this.data.startTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.data.endTime = this._dateFormat.transform(
            this.data.endTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(null);
          this.requestForm.get("patientId").setValidators(this.requirePatientMatch.bind(this));
          this.requestForm.get("patientId").updateValueAndValidity();
          this.requestForm.get("assetId").setValidators(null);
          this.requestForm.get("assetId").setValue(null);
          this.requestForm.get("assetId").updateValueAndValidity();
          this.requestForm.get("comments").setValidators(null);
          this.requestForm.get("comments").setValue(null);
          this.requestForm.get("comments").updateValueAndValidity();
          this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
          this.requestForm.get("destinationId").updateValueAndValidity();
          this.requestForm.get("assetCategory").setValidators(null);
          this.requestForm.get("assetCategory").updateValueAndValidity();
          this.requestForm.get("poolLocationId").setValidators(null);
          this.requestForm.get("poolLocationId").updateValueAndValidity();
          this.requestForm.get('serviceGroupId').setValidators(null);
          this.requestForm.get("serviceGroupId").updateValueAndValidity();
        } else if (this.data.requestCategory === "PR-AT") {
          this.nonPerformerType = "asset";
          this.PRAssetId = this.data.nonPerformer[0].id;
          this.reqAssetDetails = this.data.nonPerformer[0];
          this.selectedAsset = this.data.nonPerformer[0].name;
          this.existAsset = true;
          if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for(let i = 0; i < this.data.performer.length; i++) {
              if(this.data.performer[i].hasOwnProperty('status') && ['RQ-NR','RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status']) )   {
                continue
              }
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          this.sourceId = this.data.sourceLocationName;
          if (this.data.sourceBedId !== null) {
            this.locFromId = this.data.sourceBedId;
            this.locSourceOption = this.data.sourceBedId;
            this.getCurrentLocationDetails(this.data.sourceBedId, "pickup");
          } else {
            this.locFromId = this.data.sourceId;
            this.locSourceOption = this.data.sourceId;
            this.getCurrentLocationDetails(this.data.sourceId, "pickup");
          }
          this.destinationId = this.data.destinationLocationName;
          if (this.data.destinationBedId !== null) {
            this.locToId = this.data.destinationBedId;
            this.locDestOption = this.data.destinationBedId;
            this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
          } else {
            this.locToId = this.data.destinationId;
            this.locDestOption = this.data.destinationId;
            this.getCurrentLocationDetails(this.data.destinationId, "drop");
          }
          this.data.startTime = this._dateFormat.transform(
            this.data.startTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.data.endTime = this._dateFormat.transform(
            this.data.endTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(null);
          this.selectedAssetType = this.data.assetCategory;
          this.requestForm.get("patientId").setValidators(null);
          this.requestForm.get("patientId").setValue(null);
          this.requestForm.get("patientId").updateValueAndValidity();
          this.requestForm.get("assetId").setValidators([Validators.required,this.requireAssetMatch.bind(this)]);
          this.requestForm.get("assetId").updateValueAndValidity();
          this.requestForm.get("comments").setValidators(null);
          this.requestForm.get("comments").setValue(null);
          this.requestForm.get("comments").updateValueAndValidity();
          this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
          this.requestForm.get("destinationId").updateValueAndValidity();
          this.requestForm.get("assetCategory").setValidators(null);
          this.requestForm.get("assetCategory").updateValueAndValidity();
          this.requestForm.get("poolLocationId").setValidators(null);
          this.requestForm.get("poolLocationId").updateValueAndValidity();
          this.requestForm.get('serviceGroupId').setValidators(null);
          this.requestForm.get("serviceGroupId").updateValueAndValidity();
        } else if (this.data.requestCategory === "PR-SE"){
          this.nonPerformerType = "service";
          if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for(let i = 0; i < this.data.performer.length; i++) {
              if(this.data.performer[i].hasOwnProperty('status') && ['RQ-NR','RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status']) )   {
                continue
              }
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          this.sourceId = this.data.sourceLocationName;
          if (this.data.sourceBedId !== null) {
            this.locFromId = this.data.sourceBedId;
            this.locSourceOption = this.data.sourceBedId;
            this.getCurrentLocationDetails(this.data.sourceBedId, "pickup");
          } else {
            this.locFromId = this.data.sourceId;
            this.locSourceOption = this.data.sourceId;
            this.getCurrentLocationDetails(this.data.sourceId, "pickup");
          }
          this.destinationId = this.data.destinationLocationName;
          if (this.data.destinationBedId !== null) {
            this.locToId = this.data.destinationBedId;
            this.locDestOption = this.data.destinationBedId;
            this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
          } else {
            this.locToId = this.data.destinationId;
            this.locDestOption = this.data.destinationId;
            this.getCurrentLocationDetails(this.data.destinationId, "drop");
          }
          this.data.startTime = this._dateFormat.transform(
            this.data.startTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.data.endTime = this._dateFormat.transform(
            this.data.endTime,
            "yyyy-MM-ddTHH:mm"
          );
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(this.data.serviceGroupId);
          this.requestForm.get("patientId").setValidators(null);
          this.requestForm.get("patientId").setValue(null);
          this.requestForm.get("patientId").updateValueAndValidity();
          this.requestForm.get("assetId").setValidators(null);
          this.requestForm.get("assetId").setValue(null);
          this.requestForm.get("assetId").updateValueAndValidity();
          this.requestForm.get("comments").updateValueAndValidity();
          this.requestForm.get("assetCategory").setValidators(null);
          this.requestForm.get("assetCategory").updateValueAndValidity();
          this.requestForm.get("poolLocationId").setValidators([Validators.required]);
          this.requestForm.get("poolLocationId").updateValueAndValidity();
          this.requestForm.get('serviceGroupId').setValidators([Validators.required]);
          this.requestForm.get("serviceGroupId").updateValueAndValidity();
        }
      } else {
        this.nonPerformerType = "others";
        if (this.data.performer.length > 0) {
          this.reqPorterDetails = this.data.performer;
          for(let i = 0; i < this.data.performer.length; i++) {
            if(this.data.performer[i].hasOwnProperty('status') && ['RQ-NR','RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status']) )   {
              continue
            }
            if(this.data.performer[i].status !== 'RQ-AB') {
              this.selectedPorter.push(this.data.performer[i].id);
            }
          }
        }
        this.autoAssign = this.data.isAutoAssigned;
        this.sourceId = this.data.sourceLocationName;
        if (this.data.sourceBedId !== null) {
          this.locFromId = this.data.sourceBedId;
          this.locSourceOption = this.data.sourceBedId;
          this.getCurrentLocationDetails(this.data.sourceBedId, "pickup");
        } else {
          this.locFromId = this.data.sourceId;
          this.locSourceOption = this.data.sourceId;
          this.getCurrentLocationDetails(this.data.sourceId, "pickup");
        }
        this.destinationId = this.data.destinationLocationName;
        if (this.data.destinationBedId !== null) {
          this.locToId = this.data.destinationBedId;
          this.locDestOption = this.data.destinationBedId;
          this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
        } else {
          this.locToId = this.data.destinationId;
          this.locDestOption = this.data.destinationId;
          this.getCurrentLocationDetails(this.data.destinationId, "drop");
        }
        this.data.startTime = this._dateFormat.transform(
          this.data.startTime,
          "yyyy-MM-ddTHH:mm"
        );
        this.data.endTime = this._dateFormat.transform(
          this.data.endTime,
          "yyyy-MM-ddTHH:mm"
        );
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.selectedAssetType = this.data.assetCategory;
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("comments").setValue(this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get("assetCategory").setValidators(null);
        this.requestForm.get("assetCategory").updateValueAndValidity();
        if(this.selectedType == 'PR-OT' && this.departmentList.length) {
        this.requestForm.get("poolLocationId").setValidators([Validators.required]);
        }
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
      }
      if(this.locFromId !== undefined && this.locFromId !== null) {
        this.requestForm.get('sourceId').disable();
      } 
      if(this.locToId !== undefined && this.locToId !== null) {
        this.requestForm.get('destinationId').disable();
      }
    } else {
      this.buildForm();
      this.getSelectedType(this.selectedType, 'req');
      this.getPorterCount(null);
    }
    this.setConfigValidator();
  }
  fromToLocationBinding() {
    if (this.data.sourceBedId !== null) {
      this.locFromId = this.data.sourceBedId;
      this.locSourceOption = this.data.sourceBedId;
      this.getCurrentLocationDetails(this.data.sourceBedId, "pickup");
    } else {
      this.locFromId = this.data.sourceId;
      this.locSourceOption = this.data.sourceId;
      this.getCurrentLocationDetails(this.data.sourceId, "pickup");

    }
    this.destinationId = this.data.destinationLocationName;
    if (this.data.destinationBedId !== null) {
      this.locToId = this.data.destinationBedId;
      this.locDestOption = this.data.destinationBedId;
      this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
    } else {
      this.locToId = this.data.destinationId;
      this.locDestOption = this.data.destinationId;
      this.getCurrentLocationDetails(this.data.destinationId, "drop");
    }
  }

  setConfigValidator() {
    if(this.mandatoryFieldsObject.hasOwnProperty(this.selectedType)) {
      const field = this.mandatoryFieldsObject[this.selectedType];
      if (this.requestForm.controls[field[0]]) {
        this[field[0] + this.selectedType] = true;
        if(!this.modifyId){
          // this.requestForm.get(field[0]).setValue(null);
        }
        this.requestForm.get(field[0]).setValidators([Validators.required]);
      } else {
        this[field[0] + this.selectedType] = false;
        this.requestForm.get(field[0]).setValidators(null);
      }
      this.requestForm.get(field[0]).updateValueAndValidity();
    }
  }

  checkPriority() {
    if ((this.priorityFromLocation.length > 0 && this.priorityFromLocation.includes(this.locFromId)) ||
        (this.priorityToLocation.length > 0 && this.priorityToLocation.includes(this.locToId))
    ) {
      this.isPriority = true;
    } else {
      this.isPriority = false;
    }
  }

  isPriorityEvent(value) {
    this.isPriority = value;
  }
  isRoundtripEvent(value) {
    this.isRoundTrip = value;
  }
  statusChange(status) {
    if(this.preSelectedPorter?.length === 0) {
      this.preSelectedPorter = this.selectedPorter;
    }
    if(status === 'RQ-RAS') {
      this.prevSearchPorterList = this.searchPorterList;
      let selectedPorterList = [];
      this.reqPorterDetails.forEach(x => {
        x['status'] = 'RQ-AB'
        this.searchPorterList = this.searchPorterList.filter(a => a.id !== x.id);
        const idsToRemove = this.reqPorterDetails.map(x => x.id);
        selectedPorterList = this.selectedPorter.filter(id => !idsToRemove.includes(id));
      });
      if(this.requestForm.get('isautoAssigned')?.value === false) {
        this.selectedPorter = selectedPorterList;
        this.requestForm.get('porterId')?.setValue(this.selectedPorter);
        this.porterNameCount = 0;
      }
    } else {
      this.selectedPorter = this.preSelectedPorter;
      this.searchPorterList = this.prevSearchPorterList;
      this.requestForm.get('porterId')?.setValue(this.selectedPorter);
      if (this.requestForm.controls['porterId'].value !== null) {
      this.porterNameCount = this.requestForm.controls['porterId'].value.length;
      }
    }
    if(status === 'RQ-CA' || status === 'RQ-CO') {
      this.pastPickupTime = false;
      this.pastDropTime = false;
    }
    if (status === 'RQ-CR') {
      this.editAction = false;
      this.statusBasedFieldDisabled = true;
      if(!this.data?.status) {
        this.requestForm.get('startTime').setValue(this.curDate);
        this.requestForm.get('startTime').updateValueAndValidity();
      }
    } else if (status === 'RQ-PLN') {
      this.editAction = true;
      this.autoAssign = true;
      this.requestForm.get('isautoAssigned').setValue(true);
      this.requestForm.get('isautoAssigned').updateValueAndValidity();
      this.statusBasedFieldDisabled = true;
    } else if (status === 'RQ-CA' || status === 'RQ-CO') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass:['mdm-Confirmation-popup'], height: '280px',
        disableClose: true,
        data: {
          title: 'Porter Request Status',
          message: 'Do you want to change the status?',
          buttonText: { cancel: 'No', ok: 'Yes' },
          status : 'RQ-CA',
          porterReqStatusChange: true,
          isRemark: 1,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'No') {
          this.requestForm.get('status').setValue(this.data.status);
          this.requestForm.get('status').updateValueAndValidity();
        } else {
          this.requestForm.get('cancelReasonId').setValue(result?.reason);
          this.userId = result?.user;
          this.remarks = result?.remarks;
        }
      });
    } else if (status === 'RQ-RTN' || status === 'RQ-RCR') {
      this.editAction = false;
      this.disableField = false;
      this.reqPorterDetails = [];
      this.modifyId = null;
      this.requestForm.get('startTime').setValue(this.curDate);
      this.requestForm.get('startTime').updateValueAndValidity();
      this.requestForm.get('porterId').setValue([]);
      this.requestForm.get('porterId').updateValueAndValidity();
      this.getPorterCount(null);
      if (status === 'RQ-RTN') {
        if (this.data.sourceBedId) {
          this.getCurrentLocationDetails(this.data.sourceBedId, 'drop');
        } else {
          this.getCurrentLocationDetails(this.data.sourceId, 'drop');
        }
        if (this.data.destinationBedId !== null) {
          this.getCurrentLocationDetails(this.data.destinationBedId, 'pickup');
        } else {
          this.getCurrentLocationDetails(this.data.destinationId, 'pickup');
        }
        this.requestForm.get('isautoAssigned')?.setValue(this.data.isAutoAssigned);
        this.requestForm.get('isautoAssigned')?.disable();
      } else {
        this.requestForm.get('isautoAssigned')?.enable();
      }
    } else if (status === 'RQ-CO' || status === 'RQ-RJ') {
      this.editAction = true;
      this.disableField = true;
      this.modifyId =  this.data.requestId;
      this.reqPorterDetails = this.data.performer;
      this.requestForm.get('porterId').setValue(this.selectedPorter);
      this.requestForm.get('porterId').updateValueAndValidity();
      this.requestForm.get('startTime').setValue(this.data.startTime);
      this.requestForm.get('startTime').updateValueAndValidity();
      if (status === 'RQ-CO') {
        if (this.data.sourceBedId !== null) {
          this.getCurrentLocationDetails(this.data.sourceBedId, 'pickup');
        } else {
          this.getCurrentLocationDetails(this.data.sourceId, 'pickup');
        }
        if (this.data.destinationBedId !== null) {
          this.getCurrentLocationDetails(this.data.destinationBedId, 'drop');
        } else {
          this.getCurrentLocationDetails(this.data.destinationId, 'drop');
        }
        this.getPorterCount(null);
      }
    }
  }

  ngAfterViewInit() {
    this.lookupTermService.getAppTermsWrapper('RequestStatus').subscribe((res) => {
      if (this.data && this.data.status === 'RQ-PLN' && this.data.requestId != null) {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-CA' || rs.code === 'RQ-CR' || rs.code === this.data.status) ?? [];
      } else if (this.data && this.data.status === 'RQ-CO' && this.data.requestId != null) {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-RCR' || rs.code === 'RQ-RTN' || rs.code === this.data.status) ?? [];
      } else if (this.data && this.data.status === 'RQ-RJ' && this.data.requestId != null) {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-RCR' || rs.code === 'RQ-CA' || rs.code === this.data.status) ?? [];
      } else if (this.data && this.data.status === 'RQ-WT' && this.data.requestId != null) {
        this.selectedRequestStatus =  res?.RequestStatus?.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' || (this.allowHoldStatusforWT && rs.code === 'RQ-HLD') || rs.code === this.data.status) ?? [];
      } else if (this.data && this.data.status === 'RQ-HLD' && this.data.requestId != null){
        this.selectedRequestStatus =  res?.RequestStatus?.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' || rs.code === 'RQ-CR' || rs.code === this.data.status) ?? [];
      } else if (this.data && (this.data.status === 'RQ-IP' ||this.data.status === 'RQ-AR' || this.data.status === 'RQ-AS') && this.data.requestId != null) {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-CO' || rs.code === 'RQ-CA' || rs.code === this.data.status) ?? [];
      } else if (this.data && this.data.requestId != null) {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-CA' || rs.code === this.data.status) ?? [];
      } else {
        this.selectedRequestStatus = res?.RequestStatus?.filter(rs => rs.code === 'RQ-PLN' || rs.code === 'RQ-CR' || rs.code === this.data.status) ?? [];
      }
      if(this.data && (this.data.status === 'RQ-IP' || this.data.status === 'RQ-CR' || this.data.status === 'RQ-AS')) {
        const status = res?.RequestStatus?.filter(rs => rs.code === 'RQ-RAS');
        if(status?.length > 0) {
          this.selectedRequestStatus.push(status[0]);
        }
      }
      this.cdr.detectChanges();
      if(this.selectedType === 'PR-OT') {
        if(this.requestForm.controls.sourceId.value !== null &&
          this.requestForm.controls.sourceId.value !== '') {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput.focus();
            this.destListItem = [];
            this.searchDestLocList = [];
            this.searchDestBedList = [];
            this.searchDestNonBedList = [];
          });
        } else {
          setTimeout(() => {
            this.srcInput.focus();
            this.sourceListItem = [];
            this.searchSourceLocList = [];
            this.searchSourceBedList = [];
            this.searchSourceNonBedList = [];
          });
        }
      } else {
        if(this.requestForm?.controls?.sourceId.value !== null &&
          this.requestForm?.controls?.sourceId.value !== '') {
          this.requestForm?.controls?.sourceId.disable();
        }
      }
    });
  }

  public buildForm() {
    this.requestForm = this.fb.group({
      requestCategory: [
        this.selectedType ? this.selectedType : null,
        [Validators.required],
      ],
      isautoAssigned: [this.autoAssign ? this.autoAssign : false],
      comments: [this.data.comments ? this.data.comments : null, [Validators.maxLength(16),
        Validators.pattern(/^[a-zA-Z0-9 _<>\(\),]*$/)]],
      assetCategory: [this.data.assetCategory ? this.data.assetCategory :
        this.selectedType === 'PR-AT' ? 'All' : null],
      assetCount: [this.data.assetCount ? this.data.assetCount : null],
      porterId: [this.selectedPorter ? this.selectedPorter : null],
      patientId: [
        this.selectedPatient ? this.selectedPatient : null,
      ],
      assetId: [this.selectedAsset ? this.selectedAsset : null],
      sourceId: [
        this.sourceId ? this.sourceId : null,
        [Validators.required, this.requireSourceLocationMatch.bind(this)],
      ],
      destinationId: [
        this.destinationId ? this.destinationId : null,
        [this.requireDestLocationMatch.bind(this)],
      ],
      porterCount: [this.data.porterCount ? this.data.porterCount : 1,
        [Validators.required, Validators.pattern('[0-9]{1,3}$')]],
      startTime: [
        this.data.startTime ? this.data.startTime : this.curDate,
        [Validators.required],
      ],
      endTime: [this.data.endTime ? this.data.endTime : this.dropDate, [Validators.required]],
      cancelReasonId : [this.data.cancelReasonId ? this.data.cancelReasonId : null],
      status: [this.data.status ? this.data.status : 'RQ-CR'],
      remarks: [this.data.remarks ? this.data.remarks : null, [Validators.maxLength(100)]],
      rating: [this.data.rating ? this.data.rating : null],
      duration: ['15'],
      poolName: [this.data.poolNameId ? this.data.poolNameId : null],
      gender: [this.data.gender ? this.data.gender : null],
      priority: [this.data.priority ? this.data.priority : false],
      isRoundTrip: [this.data.isRoundTrip ? this.data.isRoundTrip : false],
      serviceGroupId: [this.data.serviceGroupId ? this.data.serviceGroupId : this.serviceGroupId],
      poolLocationId: [this.data.poolLocationId ? this.data.poolLocationId : this.selectedType === 'PR-OT' &&
      this.departmentId !== null ?  this.departmentId : null],
      lastModifiedOn: [this.data.lastModifiedOn ? this.data.lastModifiedOn : null],
      locations : this.fb.array([this.getLocations()]),
      fromLocationId: [this.fromLocationId ? this.fromLocationId : null],
      toLocationId: [this.toLocationId ? this.toLocationId : null]
    });
    if(this.modifyId !=null && this.multiLocationGroup?.includes(this.data.serviceGroupId) && this.data.nonPerformer.length) {
      this.bindLocation()
    }
    if(this.data?.status === 'RQ-AR' || this.data?.status === 'RQ-CR' || this.data?.status === 'RQ-IP' || this.data?.status === 'RQ-CO') {
      this.requestForm.get('poolName')?.disable();
      this.requestForm.get('assetCategory')?.disable();
      this.requestForm.get('gender')?.disable();
      this.requestForm.get('isautoAssigned')?.disable();
    } else {
      if(this.disablePoolNameId) {
        this.requestForm.get('poolName')?.disable();
      } else {
        this.requestForm.get('poolName')?.enable();
      }
      this.requestForm.get('assetCategory')?.enable();
      this.requestForm.get('gender')?.enable();
      this.requestForm.get('isautoAssigned')?.enable();
    }
  }
  getLocations() {
    let res = null;
    res = this.fb.group({
      id: [null, this.pharmacyType == 'TAT-PA' && this.selectedType === 'PR-SE' && this.serviceGroupId === 'SG-PH' ? Validators.required : null],
      name: [null],
      type: [this.serviceGroupId === 'SG-PH' ? "TAT-PA" : 'LOC'], 
      priority: [false],
      comments: [null, this.selectedType === 'PR-SE' &&
        this.multiLocationGroup?.includes(this.serviceGroupId) ? Validators.maxLength(30) : null],
      locationId: [null, this.selectedType === 'PR-SE' &&
        this.multiLocationGroup?.includes(this.serviceGroupId) ? Validators.required : null],
      externalIdentifier: [null, this.pharmacyType == 'TAT-PA' && this.selectedType === 'PR-SE' && this.serviceGroupId === 'SG-PH' ? Validators.required : null]
    });
    return res
  }
  private bindLocation() {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.removeAt(0);
    this.data.nonPerformer = this.data.nonPerformer.filter(res => res.tagAssociationTypeId == 'LOC')
    for ( let i = 0; i < this.data.nonPerformer.length; i++) {
      control.push(
        this.fb.group({
          id: [this.data['nonPerformer'][i].id],
          name: [this.data['nonPerformer'][i].name],
          type : ["TAT-PA"],
          priority : [this.data['nonPerformer'][i].priority],
          comments: [this.data['nonPerformer'][i].comments],
          locationId: [this.data['nonPerformer'][i].locationId]
        })
      );
    }
  }
  handleOptionClick(index,option){
    this['pharaPatientId' + index] = option.id;
    const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('id');
    idCtrl?.setErrors(null);
    idCtrl?.markAsTouched();
    if (option.bedId) {
      this['loc1' + index] = option.bedId;
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setErrors(null);
      idCtrl?.markAsTouched();
      (this.requestForm.get('locations') as FormArray).at(index).get('locationId')?.setValue(option.bedId);
      // this.requestForm.controls['locations'].controls[index].controls['locationId'].setValue(option.bedId);
      this.locationName = option.bedName;
    }
  }
  getLocationName(index, selectedId, event){
    let name = '';
    if(this.modifyId != null) {
      name = this.data.nonPerformer[index]['name'];
    } else if(selectedId){
      let selectedLoc = this.searchLocList.filter(res => res.id == selectedId);
      if(selectedLoc.length) {
        name = selectedLoc[0]['name'] +', '+ selectedLoc[0]['fullName'];
        let LocData = {
          'fullName': selectedLoc[0].fullName,
          'id': selectedLoc[0].id,
          'locationTypeId': selectedLoc[0].locationTypeId,
          'name': selectedLoc[0].name,
          'parentId': selectedLoc[0].parentId
        }
        if(this.ServiceLocList.length == 0 || this.ServiceLocList.length && this.ServiceLocList.filter(val => val.id == LocData.id).length == 0) {
          this.ServiceLocList.push(LocData)    
        }
      }
    } 
    if(!name && this.locationName){
      name = this.locationName;
      this.locationName = null;
    }
    return name;
    
  }

  getPatientName(index, selectedId){
    let name = '';
    if(selectedId){
      let selectedIndex = this.searchPatientlist.findIndex(res => res.id == selectedId);
      name = this.searchPatientlist[selectedIndex]['fullName'];
    }
    return name;
  }

  public addLocation() {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.push(this.getLocations());
    this.searchLocList = [];
    if(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) != '') {
      let data = JSON.parse(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
      this.searchLocList = data;
    }    
  }

  public removeLocation(i: number) {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.removeAt(i);
  }

  getLocValidation(value, index) {
    if(value !== null) {
      this['loc1' + index] = value;
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setErrors(null);
      idCtrl?.markAsTouched();
    }
  }

  searchLocation(event, index?) {
    if(this['loc1' + index] === null) {
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setErrors({ requireMatch: true });
      idCtrl?.markAsTouched();
    }
    if (event.type === 'location' && event.text.length >= 2){
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe(res => {
          if(res.statusCode == 1) {
            let preLocList = this.requestForm.controls.locations.value;
            preLocList = preLocList.map(value => parseInt(value.id))
            this.searchLocItems = res.results
            this.searchLocList = this.searchLocItems;
          }
        });
      } else {
        this.searchLocList = this.searchLocItems;
      }
    } else {
      this.searchLocList = [];
    }
  }

  private requirePatientMatch(control: FormControl): ValidationErrors | null {
    if (this.patientSearch && this.selectedPatient === null) {
      if (control.value !== null && control.value !== '') {
      this.requirePatientMatchVal = this.searchPatientlist.filter(resFilter => resFilter.fullName === control.value);
      if (this.requirePatientMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  private requireAssetMatch(control: FormControl): ValidationErrors | null {
    if (this.selectedAsset == null) {
      if (control.value !== null && control.value !== '') {
      this.requireAssetMatchVal = this.searchAssetList.filter(resFilter => resFilter.id === control.value);
      if (this.requireAssetMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getAssetList(id: string) {
    if (id) {
      const assets = this as any as { id: string, name: string, identifier : string }[]
      let assetName = assets.find(obj => obj.id === id)?.name ?? '';
      let assetIdentifier = assets.find(obj => obj.id === id)?.identifier ?? '';
      return assetName + ' (' + assetIdentifier + ')';
    } else {
      return '';
    }
  }
  getPatientList(fullName: string) {
    if (fullName) {
      const patient = this as any as { fullName: string, mainidentifier : string }[]
      if(patient.length) {
        let patientName = patient.find(obj => obj.fullName === fullName).fullName ?? '' ;
        let mainidentifier = patient.find(obj => obj.fullName === fullName).mainidentifier ?? '' ;
        return patientName + ' (' + mainidentifier + ')';
      } else { return ''; }      
    } else {
      return '';
    }
  }
  setPorterCount(value, countClicked) {
    if(value !== null && !countClicked) {
      this.assetCount
      if(this.assetCount.hasOwnProperty(value)) {
        this.requestForm.controls['porterCount'].setValue(this.assetCount[value]);
      } else {
        this.requestForm.controls['porterCount'].setValue(1);
      }
    }
  }
  private requireSourceLocationMatch(control: FormControl): ValidationErrors | null {
    if (this.sourceId == null) {
      if (control.value !== null && control.value !== '') {
      this.requiresourceMatchVal = this.sourceListItem.filter(resFilter => resFilter.id === control.value);
      if (this.requiresourceMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getSourceLocationList(id: number) {
    if (id) {
      const source = this as any as { id: number, name: string, fullName: string }[]
      return source.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }
  private requireDestLocationMatch(control: FormControl): ValidationErrors | null {
    if (this.destinationId == null) {
      if (control.value !== null && control.value !== '') {
      this.requireDestMatchVal = this.destListItem.filter(resFilter => resFilter.id === control.value);
      if (this.requireDestMatchVal.length === 0) {
          return { requireMatch: true };
        }
      }
      return null;
    }
  }
  getDestinationLocationList(id: number) {
    if (id) {
      const dest = this as any as { id: number, name: string, fullName: string }[]
      return dest.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }
  clearChild(type, index?) {
    if(type === 'pharaPatientId') {
      this['pharaPatientId' + index] = null;
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('id');
      idCtrl?.setValue(null);
      idCtrl?.markAsTouched();
    } else if(type === 'loc1') {
      this['loc1' + index] = null;
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setValue(null);
      idCtrl?.markAsTouched();
    } else if(type === 'source') {
      this.locFromId = null;
      this.sourceBlockId = null;
      this.locFromChildId = null;
      this.showPickup = false;
      this.sourceChildList = [];
      this.showPickup = true;;
      this.requestForm.get('fromLocationId').setValue(null);
      this.locSourceOption = null;
    } else {
      this.locToId = null;
      this.destBlockId = null;
      this.locToChildId = null;
      this.showDrop = false;
      this.destChildList = [];
      this.showDrop = true;
      this.requestForm.get('toLocationId').setValue(null);
      this.locDestOption = null;
    }
  }
  getAllLocationById(option, type) {
    if(!this.blockVerified) {
      this.prePoolName = this.requestForm.get('poolName').value;
    }
    if(option.locationTypeId === 2 || option.locationTypeId === 3) {
      this.hospitalService.getLogicalLocationWithChildren(option.id).subscribe(res => {
        if(res.results.hasOwnProperty('children') && res.results.children.length !== 0) {
          if(type === 'source') {
            this.sourceBlockId = option?.blockId;
            this.showPickup = false;
            this.sourceChildPrevList = res.results.children;
            this.sourceChildList = res.results.children;
            this.showPickup = true;
            this.requestForm.get("fromLocationId").setValidators(null);
              if (this.modifyId == null && this.sourceChildList.length && this.selectFromRoom) {
                this.requestForm.get("fromLocationId").setValidators([Validators.required]);
              }
              this.requestForm.get("fromLocationId").updateValueAndValidity();
            
          } else {
            this.destBlockId = option?.blockId;
            this.showDrop = false;
            this.destChildPrevList = res.results.children;
            this.destChildList = res.results.children;
            this.showDrop = true;
            this.requestForm.get("toLocationId").setValidators(null);
            if (this.modifyId == null && this.destChildList.length && this.selectToRoom) {
              this.requestForm.get("toLocationId").setValidators([Validators.required]);
            }
            this.requestForm.get("toLocationId").updateValueAndValidity();
          }
          this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.prePoolName);
        } else {
          if(type === 'source') {
            this.sourceBlockId = option?.blockId;
            this.showPickup = false;
            this.sourceChildList = [];
            this.showPickup = true;
          } else {
            this.destBlockId = option?.blockId;
            this.showDrop = false;
            this.destChildList = [];
            this.showDrop = true;
          }
          this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.prePoolName);
        }
      });
    } else {
      if(type === 'source') {
        this.sourceBlockId = option?.blockId;
          this.showPickup = false;
          this.sourceChildList = [];
          this.showPickup = true;
        } else {
          this.destBlockId = option?.blockId;
          this.showDrop = false;
          this.destChildList = [];
          this.showDrop = true;
      }
      this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.prePoolName);
    }
  }

  setConfigPoolName(sourceBlockId, destBlockId, poolName) {
    if(this.locFromId !== null && this.locToId !== null && sourceBlockId !== destBlockId && 
      (this.verifyBlock !== null && this.verifyBlock?.status === true && this.verifyBlock?.requestType.includes(this.selectedType))) {
      this.blockVerified = true;
      const group = this.porterGroup.filter(x => x.code === this.verifyBlock?.poolName);
      if(group?.length === 0) {
        this.porterGroup.push(this.verifyBlock?.porterGroup);
      }
      this.requestForm.get('poolName').setValue(this.verifyBlock?.poolName);
      this.requestForm.get('poolName').updateValueAndValidity();
    } else {
      this.blockVerified = false;
      this.requestForm.get('poolName').setValue(poolName);
      this.requestForm.get('poolName').updateValueAndValidity();
    }    
  }

  confirmSourceLocation() {
    const source = this.sourceLocFullname !== null ? this.sourceLocFullname : this.requestForm.controls["sourceId"]?.value;
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation', customMsg: true,
        message: 'Do you want to continue with the source location ' + source + ' ?',
        buttonText: { cancel: 'No', ok: 'Yes' },
        checkAvailablePorter: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.SaveRequest()
      }
    });
  }
  public SaveRequest() {
    this.sourceParentLocation = null;
    this.sourceLocation = null;
    this.destParentLocation = null;
    this.destLocation = null;
    this.childList = [];
    const validatePickupTime = this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-ddTHH:mm:ss');
    this.curDate = this._dateFormat.transform(new Date(), 'yyyy-MM-ddTHH:mm:ss');
    if (validatePickupTime < this.curDate) {
      this.requestForm.get('startTime').setValue(this.curDate);
      this.requestForm.get('startTime').updateValueAndValidity();
      this.dateTimeValidation(this.curDate, 'pickup');
    }
    this.isSaved = true;
    const createRequest = new CreateRequest(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    );
    createRequest.pfActivityId = this.pfActivityId;
    createRequest.requestCategory = this.requestForm.controls[
      "requestCategory"
    ].value;
    createRequest.isautoAssigned = this.autoAssign;
    if (this.requestForm.controls["comments"].value !== null) {
      createRequest.comments = this.requestForm.controls["comments"].value.trim();
    } else {
      createRequest.comments = this.requestForm.controls["comments"].value;
    }
    createRequest.poolName = this.requestForm.controls["poolName"].value;
    createRequest.gender = this.requestForm.controls["gender"].value;
    if(this.locFromChildId !== null && this.requestForm.get('fromLocationId').value !== null) {
      createRequest.sourceId = this.locFromChildId;
      createRequest.srcLocationTypeId = this.srcChildLocationTypeId;
      createRequest.srcParentLocationId = this.srcChildLocationId;
      this.sourceParentLocation = {
        'fullName': this.sourceLocFullname,
        'id': this.locFromId,
        'locationTypeId': this.srcLocationTypeId,
        'name': this.sourceLocName,
        'parentId': this.srcParentLocationId,
        'blockId': this.sourceBlockId
      }
      this.childList.push(this.sourceParentLocation);
      this.sourceLocation = {
        'location': this.sourceParentLocation,
        'id': this.locFromChildId,
        'locationTypeId': this.srcChildLocationTypeId,
        'name': this.sourceChildLocName,
        'parentId': this.srcChildLocationId,
        'list': this.sourceChildPrevList
      }
    } else {
      createRequest.sourceId = this.locFromId;
      createRequest.srcLocationTypeId = this.srcLocationTypeId;
      createRequest.srcParentLocationId = this.srcParentLocationId;
    }
    if(((this.fieldAvailablity === 'PF-TO' || this.fieldAvailablity === null) && 
    this.fieldAvailablity !== 'PF-NO' && !this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value))) {
      if(this.locToChildId !== null && this.requestForm.get('toLocationId').value !== null) {
        createRequest.destinationId = this.locToChildId;
        createRequest.destLocationTypeId = this.destChildLocationTypeId;
        createRequest.destParentLocationId = this.destChildLocationId;
        this.destParentLocation = {
          'fullName': this.destLocFullname,
          'id': this.locToId,
          'locationTypeId': this.destLocationTypeId,
          'name': this.destLocName,
          'parentId': this.destParentLocationId,
          'blockId': this.destBlockId
        }
        this.childList.push(this.destParentLocation);
        this.destLocation = {
          'location': this.destParentLocation,
          'id': this.locToChildId,
          'locationTypeId': this.destChildLocationTypeId,
          'name': this.destChildLocName,
          'parentId': this.destChildLocationId,
          'list': this.destChildPrevList
        }
      } else {
        createRequest.destinationId = this.locToId;
        createRequest.destLocationTypeId = this.destLocationTypeId;
        createRequest.destParentLocationId = this.destParentLocationId;
      }
    }
    
    createRequest.startTime = this._dateFormat.transform(
      this.requestForm.controls["startTime"].value,
      "yyyy-MM-dd HH:mm:ss"
    );
    const start = new Date(this.requestForm.controls["startTime"].value);
    this.dropDate = this._dateFormat.transform(new Date(start.getTime() + (15 * 60 * 1000)), 'yyyy-MM-ddTHH:mm');
    if(this.requestForm.get('endTime')?.dirty) {
      createRequest.endTime = this._dateFormat.transform(this.requestForm.controls["endTime"].value, "yyyy-MM-dd HH:mm:ss");
    } else {
      createRequest.endTime = this._dateFormat.transform(this.dropDate, "yyyy-MM-dd HH:mm:ss");
    }
    createRequest.porterCount = this.requestForm.controls["porterCount"].value;
    createRequest.lastModifiedOn = this.requestForm.controls["lastModifiedOn"].value;
    if( this.requestForm.controls["assetCategory"].value === 'All') {
      createRequest.assetCategory = this.assetType;
    } else {
      createRequest.assetCategory = this.requestForm.controls["assetCategory"].value;
    }
    createRequest.assetCount = createRequest.assetCategory ? 1 : 0;
    createRequest.type = "RQT-PO";

    if (this.typesOfPatientName.includes(createRequest.requestCategory) && this.reqPatientDetails != null) {
      this.nonPerformerInfo = [];
      if(this.reqPatientDetails.hasOwnProperty('infantInfo') && this.reqPatientDetails.infantInfo.motherId) {
        this.nonPerformerInfo = [
          {
            id: this.reqPatientDetails.infantInfo.id,
            locationId: this.reqPatientDetails.infantInfo.locationId,
            type: this.reqPatientDetails.infantInfo.tagAssociationTypeId,
          },
          {
            id: this.reqPatientDetails.infantInfo.motherId,
            locationId: null,
            type: 'TAT-PA',
          },
        ];
      } else {
      this.nonPerformerInfo = [
        {
          id: this.reqPatientDetails.id,
          locationId: this.reqPatientDetails.currentLocationId,
          type: 'TAT-PA',
        },
      ];
      }

      if (this.reqPatientDetails.isTagAssociated) {
        createRequest.isTracable = true;
      } else {
        createRequest.isTracable = false;
      }
    } else if(this.typesOfPatientName.includes(createRequest.requestCategory) && !this.patientSearch && this.requestForm.controls["patientId"].value) {
      this.nonPerformerInfo = [{
        id: null,
        locationId: null,
        type: 'TAT-PA',
        name : this.requestForm.controls["patientId"].value
      }];
    }

    if (this.nonPerformerType === "asset" && this.reqAssetDetails != null) {
      this.nonPerformerInfo = [];
      this.nonPerformerInfo = [
        {
          id: this.reqAssetDetails.id,
          locationId: this.reqAssetDetails.currentLocationId,
          type: this.reqAssetDetails.tagAssociationTypeId ? this.reqAssetDetails.tagAssociationTypeId : 'TAT-AS',
        },
      ];

      if (this.reqAssetDetails.tagId != null) {
        createRequest.isTracable = true;
      } else {
        createRequest.isTracable = false;
      }
    }

    if (!this.autoAssign && this.reqPorterDetails) {
      for(let i = 0; i < this.reqPorterDetails.length; i++) {
        if(this.reqPorterDetails[i].id !== null) {
          this.porterDetail = {
            id: this.reqPorterDetails[i].id,
            locationId: this.reqPorterDetails[i].currentLocationId,
            type: this.reqPorterDetails[i].tagAssociationTypeId,
          }
          this.performerInfo.push(this.porterDetail);
        }
      }
      createRequest.performer = this.performerInfo;
    }

    if (this.requestForm.controls["requestCategory"].value !== "PR-OT" || this.typesOfPatientName.includes('PR-OT')) {
      createRequest.nonPerformer = this.nonPerformerInfo;
    } else {
      createRequest.isTracable = false;
    }
    createRequest.remarks = this.requestForm.controls["remarks"].value;
    if(this.isRoundTrip && this.porterConfigDetail && this.porterConfigDetail.hasOwnProperty('roundtripText')) {
      if (createRequest.remarks) {
        createRequest.remarks = this.porterConfigDetail.roundtripText + createRequest.remarks;
      } else {
        createRequest.remarks = this.porterConfigDetail.roundtripText;
      }
    }

    if (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm:ss') >
        this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss') && 
        (this.requestForm.controls['status'].value !== 'RQ-PLN' || 
          (this.requestForm.controls['status'].value == 'RQ-PLN' && this.allowScheduledStatus))) {
      createRequest.status = 'RQ-SH';
    } else if (this.requestForm.controls['status'].value === 'RQ-RCR' ||
      this.requestForm.controls['status'].value === 'RQ-RTN') {
      createRequest.status = 'RQ-CR';
    } else {
      createRequest.status = this.requestForm.controls['status'].value;
    }

    if (this.porterStatusCheck) {
      if (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm:ss') >
          this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss')) {
        createRequest.status = 'RQ-SH';
      } else {
        createRequest.status = 'RQ-WT';
      }
    }
    if (this.cannotAutoComplete.length > 0 &&
      this.cannotAutoComplete.includes(this.requestForm.controls["assetCategory"].value)) {
      createRequest.isAutoComplete = this.isAutoComplete;
    }
    if (this.cannotAutoCompleteforPool.length > 0 &&
      this.cannotAutoCompleteforPool.includes(this.requestForm.controls["poolName"].value)) {
      createRequest.isAutoComplete = this.isAutoComplete;
    }
    createRequest.priority = this.isPriority;
    createRequest.isRoundTrip = this.isRoundTrip;
    createRequest.serviceGroupId = this.requestForm.controls["serviceGroupId"].value;
    createRequest.poolLocationId = this.requestForm.controls["poolLocationId"].value;
    if(this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value)) {
      createRequest['nonPerformer'] = this.requestForm.controls["locations"].value;
      createRequest['isMultiLoaction'] = true;
    }    
    if(createRequest['requestCategory'] === 'PR-PA' && createRequest['comments'] == null) {
      createRequest['comments'] = 'Patient Transfer'
    }    
    if(this.data.hasOwnProperty('visitEventId')) {
      createRequest['nonPerformer'][0]['patientVisitId'] = this.data.visitId;
      createRequest['srcIdentifyingType'] = 'patient_visit_event';
      createRequest['srcIdentifyingId'] = this.data.visitEventId;
    }
    this.commonService.savePorterRequest(createRequest).subscribe(
      (res) => {
        if (res.statusCode === 1) {
          if(this.thisDialogRef) {
            this.thisDialogRef.close(res.results);
            this.getPorterAdditionalExpanded(this.isPorterAdditionalExpanded);
          }
          this.requestForm.reset();
          this.porterNameCount = 0;
          this.porterCount = 1;
          if(this.sourceLocation) {
            sessionStorage.setItem('porter_source_child_loc_', JSON.stringify(this.sourceLocation));
          } else {
            sessionStorage.setItem('porter_source_child_loc_', null);
          }
          if(this.destLocation) {
            sessionStorage.setItem('porter_dest_child_loc_', JSON.stringify(this.destLocation));
          } else {
            sessionStorage.setItem('porter_dest_child_loc_', null);
          }
          if(this.childList.length !== 0) {
            this.cookieService.set(
              'porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
              JSON.stringify(this.childList)
            );
          }
          if(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== null &&
          this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== ''){
            this.storage = JSON.parse(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
          } else {
            this.storage = [];
          }
          const response = res.results;
          if(this.ServiceLocList.length) {
            this.cookieService.set(
              'porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
              JSON.stringify(this.ServiceLocList)
            );
          }          
          if(this.sourceLocName && (this.locFromChildId === null || this.requestForm.get('fromLocationId').value === null)) {
          this.commonService.getLocationSearch(this.sourceLocName).subscribe((result) => {
            const data = result.results.filter(res => res.id === response.sourceId);
            if(data.length !== 0) {
              this.location = {
                'fullName': data[0].fullName,
                'id': data[0].id,
                'locationTypeId': data[0].locationTypeId,
                'name': data[0].name,
                'parentId': data[0].parentId,
                'blockId': data[0].blockId
              }
              this.cookieService.set(
                'porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
                JSON.stringify(this.location)
              );
              if(this.storage.length !== 0) {
                this.searchLoc = this.storage.filter(res => res.id === response.sourceId);
              }
              if(this.searchLoc.length === 0) {
                if(this.storage.length !== 0 && this.storage.length >= 10) {
                  const add = this.storage.splice(0,1);
                }
                this.storage.push(this.location);
                this.cookieService.set(
                  'porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
                  JSON.stringify(this.storage)
                );
              }
            }
          });
          }
          if(this.destLocName && (this.locToChildId === null || this.requestForm.get('toLocationId').value === null)) {
          this.commonService.getLocationSearch(this.destLocName).subscribe((result) => {
            const data = result.results.filter(res => res.id === response.destinationId);
            if(data.length !== 0) {
              this.location = {
                'fullName': data[0].fullName,
                'id': data[0].id,
                'locationTypeId': data[0].locationTypeId,
                'name': data[0].name,
                'parentId': data[0].parentId,
                'blockId': data[0].blockId
              }
              if(this.storage.length !== 0) {
                this.searchLoc = this.storage.filter(res => res.id === response.destinationId);
              }
              if(this.searchLoc.length === 0) {
                if(this.storage.length !== 0 && this.storage.length >= 10) {
                  const add = this.storage.splice(0,1);
                }
                this.storage.push(this.location);
                this.cookieService.set(
                  'porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
                  JSON.stringify(this.storage)
                );
              }
            }
          });
          }
        }
        this.isSaved = false;
        this.toastr.success("Success", `${res.message}`);
      },
      (error) => {
        if (error.error.errorCode === 'TWAPI0029') {
          this.checkAvailablePorter('post');
        } else if (error.error.errorCode === 'TWAPI59') {
          this.restrictRequest(error.error);
        } else {
          this.toastr.error("Error", `${error.error.message}`);
        }
        this.isSaved = false;
      }
    );
  }
  UpdateRequestStatus(data, status) {
    this.isSaved = true;
    console.log(data)
    if(data.performer.length > 0) {
      this.requestStatusDetail = {"requestDetailId": data.performer[0].requestDetailId,"status": status,
      "performerId": data.performer[0].id, "performerType": data.performer[0].tagAssociationTypeId,
      "lastModifiedOn" : this.requestForm.controls["lastModifiedOn"].value
      }
    }
    this.commonService.updatePorterRequestStatus(this.requestStatusDetail, data.requestId).subscribe(
      (res) => {
        this.isSaved = false;
        if (res.statusCode === 1) {
          if(this.thisDialogRef) {
            this.thisDialogRef.close(res.results);
            this.getPorterAdditionalExpanded(this.isPorterAdditionalExpanded);
          }          
          this.requestForm.reset();
          this.porterNameCount = 0;
          this.porterCount = 1;
        }
        this.toastr.success("Success", `${res.message}`);
      },
      (error) => {
        this.isSaved = false;
        if (error.error.errorCode === 'TWAPI0029') {
          this.checkAvailablePorter('post');
        } else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }
  UpdateRequest(id) {
    this.isSaved = true;
    const editRequest = new EditRequest(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    );
    editRequest.requestCategory = this.requestForm.controls[
      "requestCategory"
    ].value;
    editRequest.isautoAssigned = this.autoAssign;
    if (this.requestForm.controls["comments"].value !== null) {
      editRequest.comments = this.requestForm.controls["comments"].value.trim();
    } else {
      editRequest.comments = this.requestForm.controls["comments"].value;
    }
    editRequest.poolName = this.requestForm.controls["poolName"].value;
    editRequest.gender = this.requestForm.controls["gender"].value;
    editRequest.sourceId = this.locFromId;
    editRequest.srcLocationTypeId = this.srcLocationTypeId;
    editRequest.srcParentLocationId = this.srcParentLocationId;
    if(((this.fieldAvailablity === 'PF-TO' || this.fieldAvailablity === null) && 
    this.fieldAvailablity !== 'PF-NO' && (this.requestForm.controls['serviceGroupId'].value == null || this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value)))) {
      editRequest.destinationId = this.locToId;
      editRequest.destLocationTypeId = this.destLocationTypeId;
      editRequest.destParentLocationId = this.destParentLocationId;
    }
    editRequest.startTime = this._dateFormat.transform(
      this.requestForm.controls["startTime"].value,
      "yyyy-MM-dd HH:mm:ss"
    );
    editRequest.endTime = this._dateFormat.transform(
      this.requestForm.controls["endTime"].value,
      "yyyy-MM-dd HH:mm:ss"
    );
    editRequest.porterCount = this.requestForm.controls["porterCount"].value;
    editRequest.lastModifiedOn = this.requestForm.controls["lastModifiedOn"].value;
    editRequest.assetCategory = this.requestForm.controls["assetCategory"].value;
    editRequest.type = "RQT-PO";
    editRequest.requestId = id;

    if (this.nonPerformerType === "patient" && this.reqPatientDetails != null) {
      this.nonPerformerInfo = [];
      this.nonPerformerInfo = [
        {
          id: this.reqPatientDetails.id,
          locationId: this.reqPatientDetails.currentLocationId,
          type: 'TAT-PA',
          requestDetailId: this.reqPatientDetails.requestDetailId,
        },
      ];

      if (this.reqPatientDetails.tagId != null) {
        editRequest.isTracable = true;
      } else {
        editRequest.isTracable = false;
      }
    }

    if (this.nonPerformerType === "asset" && this.reqAssetDetails != null) {
      this.nonPerformerInfo = [];
      this.nonPerformerInfo = [
        {
          id: this.reqAssetDetails.id,
          locationId: this.reqAssetDetails.currentLocationId,
          type: this.reqAssetDetails.tagAssociationTypeId ? this.reqAssetDetails.tagAssociationTypeId : 'TAT-AS',
          requestDetailId: this.reqAssetDetails.requestDetailId,
        },
      ];

      if (this.reqAssetDetails.tagId != null) {
        editRequest.isTracable = true;
      } else {
        editRequest.isTracable = false;
      }
    }

    if (this.reqPorterDetails) {
      for(let i = 0; i < this.reqPorterDetails.length; i++) {
        if(this.reqPorterDetails[i].id !== null) {
          if(this.reqPorterDetails[i].isDeletable === true) {
            this.isDeletable = true;
          } else {
            this.isDeletable = false;
          }
          if(this.reqPorterDetails[i]?.status === 'RQ-AB' && this.requestForm.get('status')?.value === 'RQ-RAS') {
            this.abortStatus = 'RQ-AB';
          } else {
            this.abortStatus = null;
          }
          this.porterDetail = {
            id: this.reqPorterDetails[i].id,
            locationId: this.reqPorterDetails[i].currentLocationId,
            type: this.reqPorterDetails[i].tagAssociationTypeId,
            requestDetailId: this.reqPorterDetails[i].requestDetailId,
            isDeletable: this.isDeletable,
            status: this.abortStatus
          }
          this.performerInfo.push(this.porterDetail);
        }
      }
      editRequest.performer = this.performerInfo;
    }

    if (this.requestForm.controls["requestCategory"].value !== "PR-OT") {
      editRequest.nonPerformer = this.nonPerformerInfo;
    } else {
      editRequest.isTracable = false;
    }
    if(this.requestForm.controls["remarks"].value !== null) {
      console.log(this.requestForm.controls["remarks"].value.trim());
      const remarks = this.requestForm.controls["remarks"].value.trim();
      if(this.remarks !== null) {
        editRequest.remarks = remarks + ', ' + this.remarks;
      } else {
        editRequest.remarks = remarks;
      }
    } else {
      if(this.remarks !== null) {
        editRequest.remarks = this.remarks;
      } else {
        editRequest.remarks = this.requestForm.controls["remarks"].value;
      }
    }
    editRequest.rating = this.requestForm.controls["rating"].value;
    if (this.requestForm.controls["status"].value !== 'RQ-CA' &&
        (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
        this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm'))) {
        editRequest.status = 'RQ-SH';
    } else {
      editRequest.status = this.requestForm.get('status')?.value === "RQ-RAS" ? this.data.status : this.requestForm.controls["status"].value;
    }

    if (this.porterStatusCheck) {
      if (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
          this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm')) {
        editRequest.status = 'RQ-SH';
      } else {
        editRequest.status = 'RQ-WT';
      }
    }

    if (this.cannotAutoComplete.length > 0 &&
      this.cannotAutoComplete.includes(this.requestForm.controls["assetCategory"].value)) {
      editRequest.isAutoComplete = this.isAutoComplete;
    }
    if (this.cannotAutoCompleteforPool.length > 0 &&
      this.cannotAutoCompleteforPool.includes(this.requestForm.controls["poolName"].value)) {
      editRequest.isAutoComplete = this.isAutoComplete;
    }
    
    if(this.requestForm.controls["cancelReasonId"].value === 'RCR-ARCWLS') {
      if(this.userId) {
        editRequest.performer = [
          {
            "id": this.userId,
            "type": "TAT-PO"
          }
        ]
      }
    }
    if(this.requestForm.controls["cancelReasonId"].value) {
      if(!this.userId) {
        editRequest.performer = [];
      }
    }
    editRequest.cancelReasonId = this.requestForm.controls["cancelReasonId"].value;
    editRequest.priority = this.requestForm.controls["priority"].value;
    editRequest.isRoundTrip = this.requestForm.controls["isRoundTrip"].value;
    editRequest.serviceGroupId = this.requestForm.controls["serviceGroupId"].value;
    editRequest.poolLocationId = this.requestForm.controls["poolLocationId"].value;
    if(this.data.sourceBedId) {
      editRequest.srcLocationTypeId = '20';
    }
    if(this.data.destinationBedId) {
      editRequest.destLocationTypeId = '20';
    }
    this.commonService.updatePorterRequest(editRequest).subscribe(
      (result) => {
        this.isSaved = false;
        if (result.statusCode === 1) {
          this.thisDialogRef.close(result.results);
          this.getPorterAdditionalExpanded(this.isPorterAdditionalExpanded);
          this.requestForm.reset();
          this.porterNameCount = 0;
          this.porterCount = 1;
        }
        this.toastr.success("Success", `${result.message}`);
      },
      (error) => {
        this.isSaved = false;
        if (error.error.errorCode === 'TWAPI0045') {
          this.checkAvailablePorter('put');
        } else {
          this.toastr.error("Error", `${error.error.message}`);
        }
      }
    );
  }

  getSubjectDetail(typeId) {
    this.commonService.getPorterRequestSubject(typeId).subscribe((res) => {
      this.subList = res.results.length ? res.results : null;
    });
  }
  searchAssetByCategory(type, data) {
    this.commonService.searchAssetByCategory(type, data).subscribe((res) => {
      this.subList = res.results;
    });
  }
  getSubjectLoc(subId, type) {
    const selectedSub = this.subList.filter((res) => res.id == subId);
    this.locFromId = selectedSub[0].currentLocationId;
    this.locSourceOption = selectedSub[0].currentLocationId;
    this.sourceId =  selectedSub[0].currentLocationName + ", " + selectedSub[0].floorName;
    this.buildForm();
  }

  setFormValue(code, type) {
    if(type === 'request'){
      this.requestForm.get("requestCategory").setValue(code);
      this.requestForm.get("requestCategory").updateValueAndValidity();
    } else if(type === 'assignPorter'){
      this.requestForm.get('isautoAssigned').setValue(code);
      this.requestForm.get("isautoAssigned").updateValueAndValidity();
    } else if(type === 'gender'){
      if(this.requestForm.controls['gender'].value === code){
        this.requestForm.get("gender").setValue(null);
        this.requestForm.get("gender").updateValueAndValidity();
      } else {
        this.requestForm.get("gender").setValue(code);
        this.requestForm.get("gender").updateValueAndValidity();
      }
    }
  }

  private resetLocationsArray(): void {
  const locationsFA = this.requestForm.get('locations') as FormArray;

  if (!locationsFA) {
    return;
  }
  locationsFA.clear();
  locationsFA.push(this.getLocations());
  locationsFA.updateValueAndValidity();
}

  getSelectedType(code, type, ) {
    if (type === "req") {
      this.setServiceGroupPreference(null);
      this.fieldAvailablity = null;
      this.requestForm.get("serviceGroupId").setValue(null);
      this.requestForm.get("serviceGroupId").updateValueAndValidity();
      this.requestForm.controls['porterCount'].setValue(1);
      this.selectedType = code;
      this.resetLocationsArray();
      this.getRequestDetail();
      if (this.defaultPool.hasOwnProperty(this.selectedType)) {
        this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.defaultPool[this.selectedType]);
      } else {
        this.requestForm.get('poolName').setValue(null);
      }
      this.requestForm.get('poolName').updateValueAndValidity();

      if (code === "PR-PA") {
        if(this.data.id && this.data.id !== "0") {
          this.patientId = this.data.id;
          this.selectedPatient = this.data.name;
          this.requestForm.get("patientId").setValue(this.selectedPatient);
        }
        this.requestForm.get("patientId").setValidators([!this.data.patientId ? this.requirePatientMatch.bind(this) : '']);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("comments").setValue(this.data?.comments ? this.data.comments : null);
        this.requestForm.get("comments").setValidators(null);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue('AT-TO');
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("comments").setValue(this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValue(null);
        this.requestForm.get("poolLocationId").setValidators(null);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
        if(this.data.hasOwnProperty('infantInfo') && this.data.infantInfo) {
          this.requestForm.get("comments").setValue(this.data.comments);
          this.requestForm.get("comments").updateValueAndValidity();
          this.requestForm.get('assetCategory').setValue(this.data.assetCategory);
          this.requestForm.get('assetCategory').updateValueAndValidity();
        }
      } else if (code === "PR-AT") {
        this.selectedAssetType = this.defaultType;
        this.requestForm.get("assetCategory").setValue(this.defaultType);
        this.requestForm.get("assetCategory").setValidators(null);
        this.requestForm.get("assetCategory").updateValueAndValidity();
        this.requestForm.get("assetId").setValidators([Validators.required, !this.data.assetId ? this.requireAssetMatch.bind(this) : '']);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("comments").setValue(null);
        if(this.modifyId == null) {
          this.requestForm.get("comments").setValue('Asset Transfer');
        }
        this.requestForm.get("comments").setValidators(null);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValue(null);
        this.requestForm.get("poolLocationId").setValidators(null);
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
      } else if (code === "PR-SE") {
        if(this.swap) {
          this.searchDestLocList = [];
          this.searchDestBedList = [];
          this.searchDestNonBedList = [];
        }
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        let filterComments = this.porterRequestType.filter(val => val.code == code);
        let comments = ''
        if(filterComments.length) {
          comments = filterComments[0]['value']
        }
        this.requestForm.get('comments').setValue(comments);
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue(null);
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("destinationId").setValue(null);
        this.requestForm.get("destinationId").enable();
        this.locToId = null;
        this.destBlockId = null;
        this.requestForm.get("poolLocationId").setValue(null);
        this.requestForm.get("poolLocationId").setValidators([Validators.required]);        
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators([Validators.required]);
        if(this.modifyId == null && this.serviceGroup.length) {
          this.requestForm.get("serviceGroupId").setValue(this.serviceGroupId !== null ? this.serviceGroupId : this.serviceGroup[0]['code']);
          this.getAvailableServices(this.serviceGroupId !== null ? this.serviceGroupId : this.serviceGroup[0]['code'])
        }
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
      } else {
        this.requestForm.get("assetId").setValidators(null);
        this.requestForm.get("assetId").setValue(null);
        this.requestForm.get("assetId").updateValueAndValidity();
        this.requestForm.get("patientId").setValidators(null);
        this.requestForm.get("patientId").setValue(null);
        this.requestForm.get("patientId").updateValueAndValidity();
        this.requestForm.get("comments").setValue(this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        this.requestForm.get("comments").updateValueAndValidity();
        this.requestForm.get('assetCategory').setValue('AT-TO');
        this.requestForm.get('assetCategory').setValidators(null);
        this.requestForm.get('assetCategory').updateValueAndValidity();
        this.requestForm.get("destinationId").setValidators([Validators.required, this.requireDestLocationMatch.bind(this)]);
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.requestForm.get("poolLocationId").setValue(code === 'PR-OT' &&
        this.departmentId !== null ?  this.departmentId : null);
        if(this.selectedType == 'PR-OT' && this.departmentList.length) {
        this.requestForm.get("poolLocationId").setValidators([Validators.required]);
        }
        this.requestForm.get("poolLocationId").updateValueAndValidity();
        this.requestForm.get('serviceGroupId').setValidators(null);
        this.requestForm.get("serviceGroupId").updateValueAndValidity();
        if(this.requestForm.controls.sourceId.value !== null &&
          this.requestForm.controls.sourceId.value !== '') {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput.focus();
            this.destListItem = [];
            this.searchDestLocList = [];
            this.searchDestBedList = [];
            this.searchDestNonBedList = [];
          });
        } else {
          setTimeout(() => {
            this.srcInput.focus();
            this.sourceListItem = [];
            this.searchSourceLocList = [];
            this.searchSourceBedList = [];
            this.searchSourceNonBedList = [];
          });
        }
      }
      this.searchPorter();
      this.setConfigValidator();
    } else if (type === "asset") {
      this.selectedAssetType = code;
      this.searchAssetList = [];
      this.requestForm.get("assetId").setValue(null);
      this.requestForm.get("assetId").updateValueAndValidity();
      this.searchPorter();
      if(code === 'PR-SE') {
        this.getFieldAvailablity(code);
      }
    } else if (type === "assign" && !code) {
      if (this.defaultPool.length > 0 && this.defaultPool.hasOwnProperty(this.selectedType)) {
        this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.defaultPool[this.selectedType]);
      }
      this.isPorterAdditionalExpanded = true;
      this.autoAssign = code;
      this.searchPorter();
      this.getPorterAdditionalExpanded(true);
    } else {
      this.isPorterAdditionalExpanded = true;
      this.autoAssign = code;
      this.getPorterAdditionalExpanded(true);
    }
  }
  getPorterAdditionalExpanded(expandVal) {
    this.commonService.validateUserPreference('isPorterAdditionalExpanded', expandVal);
    if (this.selectedType !== null) {
      this.commonService.validateUserPreference('porterReqType', this.selectedType);
    }
  }
  getPoolName(value) {
    let defaultPool = [];
    let dummyPool = [];
    if(this.porterGroup.length) {
      if(this.defaultPool.hasOwnProperty(this.selectedType)) {
        defaultPool = this.porterGroup.filter(val => val.code == this.defaultPool[this.selectedType])
      }
      dummyPool = this.porterGroup.filter(val => val.code == 'PN-DP');
    }
    let porterGroupRes = [];
    this.lookupTermService.getAppTermsLinkWrapper(value).subscribe(res =>{
      if(res) {
        porterGroupRes = res?.PoolName ?? [];
        if(porterGroupRes?.length == 0 && this.allowGlobalPool) {
          this.porterGroup = this.porterGroupGlobal
        } else {
          if(res && res?.poolName && res.poolName.length > 0) {
            this.porterGroup = res?.PoolName ?? [];
          }
          this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.porterGroup[0]?.code);
        }
        if(defaultPool.length) { 
          this.porterGroup.push(defaultPool[0]) 
        }        
      } else if(defaultPool.length) {
        this.porterGroup = [];
        this.porterGroup.push(defaultPool[0]) 
      }
      if(dummyPool.length) {
        this.porterGroup.push(dummyPool[0]) 
      } 
      if(this.porterGroup.length) {
        let otPool = null
        if(!this.modifyId && this.data.hasOwnProperty('visitEventId') && this.porterConfigDetail.hasOwnProperty('OT')) {
          otPool = this.porterConfigDetail['OT']['porterPool']
        } 
        let selectedPoolGroup = porterGroupRes.length == 0 ? this.porterGroup.findIndex(val => val.code == this.defaultPool[this.selectedType]) != -1 ? this.defaultPool[this.selectedType] : this.porterGroup[0]['code'] : porterGroupRes[0]['code'];
        const pool = otPool ? otPool : selectedPoolGroup;
        this.setConfigPoolName(this.sourceBlockId, this.destBlockId, pool);
      }       
    });
  }
  setServiceGroupPreference(code) {
    if(code !== null) {
      if(this.multiLocationGroup?.includes(code)) {
        let arrays = this.requestForm.get('locations') as FormArray;
        const control = arrays.controls;
        control.forEach(data => {
          let checkPharmacy =  this.pharmacyType == 'TAT-PA';
          if(code === 'SG-MS' ) {
            checkPharmacy = false;
          }
          data['controls']['id'].setValidators( checkPharmacy ? Validators.required : null);
          data['controls']['id'].updateValueAndValidity();
          data['controls']['comments'].setValidators(Validators.maxLength(30));
          data['controls']['comments'].updateValueAndValidity();
        });
      } else {
        let arrays = this.requestForm.get('locations') as FormArray;
        const control = arrays.controls;
        control.forEach(data => {
          data['controls']['id'].setValidators(null);
          data['controls']['id'].updateValueAndValidity();
          data['controls']['comments'].setValidators(null);
          data['controls']['comments'].updateValueAndValidity();
        });
      }
      this.commonService.validateUserPreference('serviceGroup', code);
    } else {
      let arrays = this.requestForm.get('locations') as FormArray;
      const control = arrays.controls;
      control.forEach(data => {
        data['controls']['id'].setValidators(null);
        data['controls']['id'].updateValueAndValidity();
        data['controls']['comments'].setValidators(null);
        data['controls']['comments'].updateValueAndValidity();
      });
    }
  }
  getAvailableServices(code) {
    if(this.selectedType === 'PR-SE' || this.data.requestCategory === 'PR-SE') {
      if(this.modifyId == null) {
        this.requestForm.get('destinationId').enable();
        this.requestForm.get('destinationId').setValue(null);
      }
      if(code !== null && code !== undefined) {
        if(this.multiLocationGroup?.includes(code)) {
          this.requestForm.get('assetCategory').setValue(null);
          this.requestForm.get('destinationId').setValue(null);
          this.requestForm.get('assetCategory').setValidators([]);
          this.requestForm.get('assetCategory').updateValueAndValidity();
          if(code == 'SG-PH') {
            this.requestForm.get('poolLocationId').setValue(null);
            this.requestForm.get('poolLocationId').setValidators([]);
            this.requestForm.get('poolLocationId').updateValueAndValidity();
          }
        }
        this.lookupTermService.getAppTermsLinkWrapper(code).subscribe((res) => {
          if(res !== null) {
            this.filterAssetType = res?.RequestNeed ?? [];
          }
          if (this.data && this.data.requestId && this.data.serviceGroupId === code) {
            this.requestForm.get('assetCategory').setValue(this.data.assetCategory);
            this.requestForm.get('assetCategory').updateValueAndValidity();
            this.getFieldAvailablity(this.data.assetCategory);
          } else {
            const defaultService = this.filterAssetType ? this.filterAssetType.filter(res => res.isDefault === true) : [];
            if(this.filterAssetType !== null && defaultService.length !== 0) {
              this.requestForm.get('assetCategory').setValue(defaultService[0].code);
              this.requestForm.get('assetCategory').updateValueAndValidity();
              this.getFieldAvailablity(defaultService[0].code);
            } else if(this.filterAssetType !== null && defaultService.length === 0 && 
              this.filterAssetType.length === 1) {
              this.requestForm.get('assetCategory').setValue(this.filterAssetType[0].code);
              this.requestForm.get('assetCategory').updateValueAndValidity();
              this.getFieldAvailablity(this.filterAssetType[0].code);
            } else {
              this.requestForm.get('assetCategory').setValue(null);
              this.requestForm.get('assetCategory').updateValueAndValidity();
              this.requestForm.get('poolName').setValue(null);
              this.requestForm.get('poolName').updateValueAndValidity();
              this.requestForm.get('destinationId').setValidators(null);
              this.requestForm.get('destinationId').updateValueAndValidity();
              this.fieldAvailablity = null;
            }
          }
          this.setConfigValidator();
        });
      } else {
        this.filterAssetType = null;
      }
      this.lookupTermService.getAppTermsLinkWrapper(this.selectedType).subscribe((res) => {
        if (res) {
          this.poolFloor = res?.PoolLocation ?? [];
          const activityCategory = res?.ActivityCategory ?? [];
          this.getActivity(activityCategory);
        }
      });
      this.setServiceGroupPreference(code);
    } else {
      if(this.selectedType !== 'PR-SE') {
        this.lookupTermService.getAppTermsLinkWrapper(this.selectedType).subscribe((res) => {
          if(res !== null) {
            this.filterAssetType = res?.AssetType;
            if(this.selectedType === 'PR-PA') {
              this.poolFloor = res?.PoolLocation ?? [];
              if(this.poolFloor.length) {
                this.requestForm.get('poolLocationId').setValidators([Validators.required]);
                this.requestForm.get('poolLocationId').updateValueAndValidity();
              } else {
                this.requestForm.get('poolLocationId').setValidators(null);
                this.requestForm.get('poolLocationId').updateValueAndValidity();
              }
            }
            if(this.selectedType === 'PR-OT') {
              this.departmentList = res?.PoolLocation ?? [];
              if(this.departmentList?.length === 0) {
                this.requestForm.get("poolLocationId").setValidators(null);
                this.requestForm.get("poolLocationId").setValue(null);
                this.requestForm.get("poolLocationId").updateValueAndValidity();
              } else {
                this.requestForm.get("poolLocationId").setValidators([Validators.required]);
                this.requestForm.get("poolLocationId").updateValueAndValidity();
              }
            }
          }
          if(!this.modifyId) { 
            if (this.defaultPool.hasOwnProperty(this.selectedType)) {
              let otPool = null
              if(!this.modifyId && this.data.hasOwnProperty('visitEventId') && this.porterConfigDetail.hasOwnProperty('OT')) {
                otPool = this.porterConfigDetail['OT']['porterPool']
              } 
              const pool = otPool ? otPool : this.defaultPool[this.selectedType];
              this.setConfigPoolName(this.sourceBlockId, this.destBlockId, pool);
              this.checkPoolName(this.data)            
            } else {
              this.requestForm.get('poolName').setValue(null);
            }
            this.requestForm.get('poolName').updateValueAndValidity();
          }
        });
      } else {
        this.filterAssetType = null;
      }
      this.searchPorter();
    }
  }
  getFieldAvailablity(code) {
    let defaultPool = [];
    this.PorterFieldMandatory = [];
    let dummyPool = [];
    if(this.porterGroup.length) {
      if(this.defaultPool.hasOwnProperty(this.selectedType)) {
        defaultPool = this.porterGroup.filter(val => val.code == this.defaultPool[this.selectedType])
      }
      dummyPool = this.porterGroup.filter(val => val.code == 'PN-DP')
    }

    this.lookupTermService.getAppTermsLinkWrapper(code).subscribe((res) => {
      if(res) {
        const porterField = res?.PorterField ?? [];
        const pool = res?.PoolName ?? [];
        this.PorterFieldMandatory = res?.PorterFieldMandatory ?? [];
        if(this.PorterFieldMandatory?.length !== 0) {
          this.requestForm.get('destinationId').setValidators([Validators.required]);
          this.requestForm.get('destinationId').updateValueAndValidity();
        } else {
          this.requestForm.get('destinationId').setValidators(null);
          this.requestForm.get('destinationId').updateValueAndValidity();
        }
        this.porterGroup = pool;
        if(defaultPool.length) { 
          this.porterGroup.push(defaultPool[0]) 
        }        
        if(porterField.length !== 0) {
          this.fieldAvailablity = porterField[0].code;
          if(this.fieldAvailablity === 'PF-LOC') {
            this.requestForm.get('poolLocationId').setValidators([Validators.required]);
            this.requestForm.get('poolLocationId').updateValueAndValidity();
          } else {
            this.requestForm.get('poolLocationId').setValidators(null);
            this.requestForm.get('poolLocationId').updateValueAndValidity();
          }
        } else {
          this.fieldAvailablity = null;
          this.requestForm.get('poolLocationId').setValidators([Validators.required]);
          this.requestForm.get('poolLocationId').updateValueAndValidity();
        }
        if(pool.length !== 0) {
          this.setConfigPoolName(this.sourceBlockId, this.destBlockId, pool[0].code);
          this.searchPorter();
        } else if(defaultPool.length) {
          this.porterGroup = [];
          this.porterGroup.push(defaultPool[0]) 
        } else {
          this.requestForm.get('poolName').setValue(null);
          this.requestForm.get('poolName').updateValueAndValidity();
        }
        if(dummyPool.length) {
          this.porterGroup.push(dummyPool[0]) 
        }
        if(this.porterGroup.length) {        
          this.setConfigPoolName(this.sourceBlockId, this.destBlockId, this.porterGroup[0]['code']);
        }
      } else {
        this.requestForm.get('destinationId').setValidators(null);
        this.requestForm.get('destinationId').updateValueAndValidity();
        this.requestForm.get('poolName').setValue(null);
        this.requestForm.get('poolName').updateValueAndValidity();
        this.fieldAvailablity = null;
        this.requestForm.get('poolLocationId').setValidators([Validators.required]);
          this.requestForm.get('poolLocationId').updateValueAndValidity();
      }
      if(this.multiLocationGroup?.includes(this.requestForm.controls.serviceGroupId.value)) {
        this.requestForm.get('poolLocationId').clearValidators();
        this.requestForm.get('poolLocationId').updateValueAndValidity();
      }
    });
  }

  getActivity(data) {
    this.pfActivityId = null;
    if(this.activityCategoryIds?.length > 0 && data?.length > 0) {
      const categoryId = data?.filter(x => this.activityCategoryIds.includes(x.code));
      if(categoryId?.length > 0) {
        this.commonService.getTaskActivities('TAC-POR', categoryId[0]?.code).subscribe(res =>{
          if(res.results?.length > 0) {
            this.pfActivityId = res.results[0].id;
          }
        });
      }
    }
  }

  getRequestDetail() {
    if(this.selectedType !== 'PR-SE') {
      this.poolFloor = [];
      this.lookupTermService.getAppTermsLinkWrapper(this.selectedType).subscribe((res) => {
        if(res.results !== null) {
          const activityCategory = res?.ActivityCategory ?? [];
          this.getActivity(activityCategory);
          this.filterAssetType = res?.AssetType ?? [];
          if(this.selectedType === 'PR-PA') {
            this.poolFloor = res?.PoolLocation ?? [];
            if(this.poolFloor?.length) {
              this.requestForm.get('poolLocationId').setValidators([Validators.required]);
              this.requestForm.get('poolLocationId').updateValueAndValidity();
            } else {
              this.requestForm.get('poolLocationId').setValidators(null);
              this.requestForm.get('poolLocationId').updateValueAndValidity();
            }
          }
          if(this.selectedType === 'PR-OT') {
            this.departmentList = res?.PoolLocation ?? [];
            if(this.departmentList.length === 0) {
              this.requestForm.get("poolLocationId").setValidators(null);
              this.requestForm.get("poolLocationId").setValue(null);
              this.requestForm.get("poolLocationId").updateValueAndValidity();
            } else {
              this.requestForm.get("poolLocationId").setValidators([Validators.required]);
              this.requestForm.get("poolLocationId").updateValueAndValidity();
            }
          }
        }
      });
    } else {
      this.filterAssetType = null;
    }
    this.lookupTermService.getAppTermsWrapper('PoolName').subscribe((res) => {
      this.porterGroup = res?.PoolName ?? [];
    });
  }

  getCurrentLocationDetails(id, fieldName) {
    if(id) {
    this.commonService.getRequestFromLocation(id).subscribe((res) => {
      if (fieldName === "pickup") {
        this.locFromId = id;
        this.locSourceOption = id;
        this.requestForm.controls["sourceId"].setValue(
          res.results.fullName
        );
        this.requestForm.get("sourceId").updateValueAndValidity();
        this.sourceId = res.results.fullName;
        this.srcLocationTypeId = res.results.locationTypeId;
        this.srcParentLocationId = res.results.parentId;
      } else {
        this.locToId = id;
        this.locDestOption = id;
        this.requestForm.controls["destinationId"].setValue(
          res.results.fullName
        );
        this.requestForm.get("destinationId").updateValueAndValidity();
        this.destinationId = res.results.fullName;
        this.destLocationTypeId = res.results.locationTypeId;
        this.destParentLocationId = res.results.parentId;
      }
    });
    }
  }

  searchFromLocation(event) {
    if (event.type === 'pickup' && event.text.length >= 2  && event.keyCode !== 13 && 
    event.keyCode !== 38 && event.keyCode !== 40) {
      this.swap = false;
      this.locFromId = null;
      this.sourceBlockId = null;
      this.sourceId = null;
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe((res) => {
          this.sourceListItem = res.results;
          const bedLocList = res.results?.filter(b => b?.locationTypeId === 20 && this.locDestOption !== b?.id);
          if(bedLocList?.length > 0) {
            this.searchSourceBedList = bedLocList;
            this.searchSourceLocList = this.searchSourceBedList;
          } else {
            this.searchSourceBedList = [];
            this.searchSourceNonBedList = [];
            this.searchSourceLocList = this.sourceListItem;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const searchSourceLocList = this.searchSourceLocList;
        this.searchSourceLocList = searchSourceLocList;
      } else {
        this.searchSourceLocList = this.sourceListItem;
      }
    } else if (event.type === 'pickup' && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13)) {
      const searchSourceLocList = this.searchSourceLocList;
      this.searchSourceLocList = searchSourceLocList;
    } else {
      this.searchSourceLocList = [];
      this.searchSourceNonBedList = [];
      this.searchSourceBedList = [];
    }
  }

  toggleShowMore(type) {
    if(type === 'pickup') {
      const nonBedLocList = this.sourceListItem?.filter(b => b?.locationTypeId !== 20);
      this.searchSourceNonBedList = nonBedLocList;
      this.searchSourceLocList = this.sourceListItem;
    } else {
      const nonBedLocList = this.destListItem?.filter(b => b?.locationTypeId !== 20);
      this.searchDestNonBedList = nonBedLocList;
      this.searchDestLocList = this.destListItem;
    }
  }

  searchToLocation(event) {
    if(event.type === 'drop' && event.text.length >= 2  && event.keyCode !== 13 && 
    event.keyCode !== 38 && event.keyCode !== 40) {
      this.swap = false;
      this.locToId = null;
      this.destBlockId = null;
      this.destinationId = null;
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe((res) => {
          this.destListItem = res.results;
          const bedLocList = res.results?.filter(b => b?.locationTypeId === 20 && this.locSourceOption !== b?.id);
          if(bedLocList?.length > 0) {
            this.searchDestBedList = bedLocList;
            this.searchDestLocList = this.searchDestBedList;
          } else {
            this.searchDestBedList = [];
            this.searchDestNonBedList = [];
            this.searchDestLocList = this.destListItem;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const searchDestLocList = this.searchDestLocList;
        this.searchDestLocList = searchDestLocList;
      } else {
        this.searchDestLocList = this.destListItem;
      }
    } else if (event.type === 'drop' && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13)) {
      const searchDestLocList = this.searchDestLocList;
      this.searchDestLocList = searchDestLocList;
    } else {
      this.searchDestLocList = [];
      this.searchDestBedList = [];
      this.searchDestNonBedList = [];
    }
  }
  swapLocation() {
    this.swap = true;
    let locFromId = this.locFromId;
    let locToId = this.locToId;
    let source = this.requestForm.get('sourceId').value;
    let dest = this.requestForm.get('destinationId').value;
    let sourceChildId = this.requestForm.get('fromLocationId').value;
    let destChildId = this.requestForm.get('toLocationId').value;
    let sourceList = this.sourceListItem;
    let destList = this.destListItem;
    let sourceChild = this.sourceChildList;
    let destChild = this.destChildList;
    this.sourceListItem = destList;
    this.searchSourceLocList = destList;
    this.destListItem = sourceList;
    this.searchDestLocList = sourceList;
    this.showPickup = false;
    this.showDrop = false;
    this.sourceChildList = destChild;
    this.destChildList = sourceChild;
    this.showPickup = true;
    this.showDrop = true;
    
    const sourceId = this.searchSourceLocList.filter(x => x.id === locToId);
    if(sourceId.length !== 0) {
      this.locFromId = locToId;
      if(sourceId[0].name !== null && sourceId[0].fullName !== null)
      {
        this.requestForm.get('sourceId').setValue(sourceId[0].fullName);
      } else {
        this.requestForm.get('sourceId').setValue(typeof(dest) === 'string' ? dest : null);
      }
    } else {
      if(dest !== null) {
          this.requestForm.get('sourceId').setValue(typeof(dest) === 'string' ? dest : null);
        } else {
          this.locFromId = null;
          this.sourceBlockId = null;
          this.requestForm.get('sourceId').setValue(null);
        }
    }
    const destId = this.searchDestLocList.filter(x => x.id === locFromId);
    if(destId.length !== 0) {
      this.locToId = locFromId;
      if(destId[0].name !== null && destId[0].fullName !== null)
      {
        this.requestForm.get('destinationId').setValue(destId[0].fullName);
      } else {
        this.requestForm.get('destinationId').setValue(typeof(source) === 'string' ? source : null);
      }
    } else {
      if(source !== null) {
        this.requestForm.get('destinationId').setValue(typeof(source) === 'string' ? source : null);
      } else {
        this.locToId = null;
        this.destBlockId = null;
        this.requestForm.get('destinationId').setValue(null);
      }
    }
    this.requestForm.get('fromLocationId').setValue(destChildId);
    this.requestForm.get('toLocationId').setValue(sourceChildId);

    let locSourceOption = this.locSourceOption;
    let srcLocationTypeId = this.srcLocationTypeId;
    let srcParentLocationId = this.srcParentLocationId;
    let sourceLocName = this.sourceLocName;
    let sourceLocFullname = this.sourceLocFullname;

    let locDestOption = this.locDestOption;
    let destLocationTypeId = this.destLocationTypeId;
    let destParentLocationId = this.destParentLocationId;
    let destLocName = this.destLocName;
    let destLocFullname = this.destLocFullname;

    this.locSourceOption = locDestOption;
    this.srcLocationTypeId = destLocationTypeId;
    this.srcParentLocationId = destParentLocationId;
    this.sourceLocName = destLocName;
    this.sourceLocFullname = destLocFullname;

    this.locDestOption = locSourceOption;
    this.destLocationTypeId = srcLocationTypeId;
    this.destParentLocationId = srcParentLocationId;
    this.destLocName = sourceLocName;
    this.destLocFullname = sourceLocFullname;

    let locFromChildId = this.locFromChildId;
    let srcChildLocationTypeId = this.srcChildLocationTypeId;
    let srcChildLocationId = this.srcChildLocationId;
    let sourceChildLocName = this.sourceChildLocName;

    let locToChildId = this.locToChildId;
    let destChildLocationTypeId = this.destChildLocationTypeId;
    let destChildLocationId = this.destChildLocationId;
    let destChildLocName = this.destChildLocName;

    this.locFromChildId = locToChildId;
    this.srcChildLocationTypeId = destChildLocationTypeId;
    this.srcChildLocationId = destChildLocationId;
    this.sourceChildLocName = destChildLocName;

    this.locToChildId = locFromChildId;
    this.destChildLocationTypeId = srcChildLocationTypeId;
    this.destChildLocationId = srcChildLocationId;
    this.destChildLocName = sourceChildLocName;
  }
  getSearchDetails(data, type) {
    if (type === "pickup") {
      this.locFromId = data.id;
      this.locSourceOption = data.id;
      this.srcLocationTypeId = data.locationTypeId;
      this.srcParentLocationId = data.parentId;
      this.searchSourceLocList = [];
      this.searchSourceBedList = [];
      this.searchSourceNonBedList = [];
      this.sourceLocName = data.name;
      this.sourceLocFullname = data.fullName;
      if(this.locFromId === null){
        this.isSourceLoc = false;
        this.requestForm.controls.sourceId.setValue(null);
      } else {
        this.isSourceLoc = true;
      }
      if(this.searchDestBedList?.length > 0) {
        const sourceBed = this.searchDestBedList?.filter(x => x.id !== data.id);
        if(sourceBed?.length === 0) {
          this.searchDestBedList = [];
          this.searchDestNonBedList = [];
        }
      }
      this.checkPriority();
    } else if (type === "drop") {
      this.locToId = data.id;
      this.locDestOption = data.id;
      this.destLocationTypeId = data.locationTypeId;
      this.destParentLocationId = data.parentId;
      this.searchDestLocList = [];
      this.searchDestBedList = [];
      this.searchDestNonBedList = [];
      this.destLocName = data.name;
      this.destLocFullname = data.fullName;
      if(this.locToId === null) {
        this.isDestinationLoc = false;
        this.requestForm.controls.destinationId.setValue(null);
      } else {
        this.isDestinationLoc = true;
      }
      if(this.searchSourceBedList?.length > 0) {
        const sourceBed = this.searchSourceBedList?.filter(x => x.id !== data.id);
        if(sourceBed?.length === 0) {
          this.searchSourceBedList = [];
          this.searchSourceNonBedList = [];
        }
      }
      this.checkPriority();
    } else if (type === "patient") {
      this.nonPerformerType = type;
      this.reqPatientDetails = data;
      if (this.reqPatientDetails.currentLocationId) {
        this.getCurrentLocationDetails(
          this.reqPatientDetails.currentLocationId,
          "pickup"
        );
      }
      this.checkPoolName(data)
      this.patientId = data.id;
    } else if (type === "asset") {
      this.assetType = data.assetTypeId;
      this.nonPerformerType = type;
      this.reqAssetDetails = data;
      if (this.reqAssetDetails.currentLocationId) {
        this.getCurrentLocationDetails(
          this.reqAssetDetails.currentLocationId,
          "pickup"
        );
      }
    } else if (type === "source") {
      if(data !== null) {
        this.locFromChildId = data.id;
        this.srcChildLocationTypeId = data.locationTypeId;
        this.srcChildLocationId = data.parentId;
        this.sourceChildLocName = data.name;
      } else {
        this.locFromChildId = null;
        this.srcChildLocationTypeId = null;
        this.srcChildLocationId = null;
        this.sourceChildLocName = null;
      }
    } else if (type === "dest") {
      if(data !== null) {
        this.locToChildId = data.id;
        this.destChildLocationTypeId = data.locationTypeId;
        this.destChildLocationId = data.parentId;
        this.destChildLocName = data.name;
      } else {
        this.locToChildId = null;
        this.destChildLocationTypeId = null;
        this.destChildLocationId = null;
        this.destChildLocName = null;
      }
    } 
  }
  checkPoolName(data) {
    let dischargePool = this.porterGroup.filter(val => val.code == 'PN-DIS')
    if(dischargePool.length && data.hasOwnProperty('patientVisitStatus') && data.patientVisitStatus == 'VS-DC') {
      this.setConfigPoolName(this.sourceBlockId, this.destBlockId, dischargePool[0]['code']);
    }
  }
  getPorterDetails(data, event) {
    this.isChecked = event.selected;
    if (this.isChecked) {
      this.reqPorterDetails = this.reqPorterDetails.filter(x => x.id !== event.value);
      this.reqPorterDetails.push({
        'currentLocationId': data.currentLocationId,
        'floorId': data.floorId,
        'floorName': data.floorName,
        'fullName': data.fullName,
        'id': data.id,
        'locationName': data.locationName,
        'name': data.name,
        'requestDetailId': data.requestDetailId,
        'status': data.status,
        'tagAssociationTypeId': data.tagAssociationTypeId,
        'tagId': data.tagId,
        'isDeletable': false,
      });;
      this.porterId = data.id;
    } else {
      const locIndex = this.reqPorterDetails.findIndex(res => res.id === event.value);
      if (locIndex !== -1 && this.reqPorterDetails[locIndex].requestDetailId) {
        this.reqPorterDetails[locIndex]['isDeletable'] = true;
        this.checkedDataDetails.push({
          'currentLocationId': this.reqPorterDetails[locIndex].currentLocationId,
          'floorId': this.reqPorterDetails[locIndex].floorId,
          'floorName': this.reqPorterDetails[locIndex].floorName,
          'fullName': this.reqPorterDetails[locIndex].fullName,
          'id': this.reqPorterDetails[locIndex].id,
          'locationName': this.reqPorterDetails[locIndex].locationName,
          'name': this.reqPorterDetails[locIndex].name,
          'requestDetailId': this.reqPorterDetails[locIndex].requestDetailId,
          'status': this.reqPorterDetails[locIndex].status,
          'tagAssociationTypeId': this.reqPorterDetails[locIndex].tagAssociationTypeId,
          'tagId': this.reqPorterDetails[locIndex].tagId,
          'isDeletable': true,
        });
        for (let i=0; i < this.checkedDataDetails.length; i++) {
          this.reqPorterDetails = this.reqPorterDetails.filter(x => x.id !== this.checkedDataDetails[i].id);
          this.reqPorterDetails.push(this.checkedDataDetails[i])
        }
      } else {
        this.reqPorterDetails = this.reqPorterDetails.filter(x => x.id !== event.value);
      }
      this.porterId = data.id;
    }
  }
  onWindowResizedWidth(size) {
    this.popWidth = size;
  }

  onWindowResized(size) {
    this.contentHeight = size - 170;
  }
  getPorterCount(type) {
    this.porterValue = parseInt(this.requestForm.controls['porterCount'].value);
    if(type !== null && type === 'increment') {
      if(this.maxPorterLimit && this.porterValue < this.maxPorterLimit) {
        this.porterValue++;
        this.requestForm.get('porterCount').setValue(this.porterValue);
      }
    } else if(type !== null && type === 'decrement' && this.porterValue !== 1) {
      this.porterValue--;
      this.requestForm.get('porterCount').setValue(this.porterValue);
    }
    if (this.requestForm.controls['porterId'].value !== null) {
    this.porterNameCount = this.requestForm.controls['porterId'].value.length;
    }
    this.porterCount = parseInt(this.requestForm.controls['porterCount'].value);
  }
  searchPatient(event, index?) {
    this.selectedPatient = null;
    if(this['pharaPatientId' + index] == null) {
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('id');
      idCtrl?.setErrors({ requireMatch: true });
      idCtrl?.markAsTouched();
    }
    if (this.patientSearch && event.type === 'patientName' && event.text.length >= 2) {
      if (event.toHit == true) {      
        this.commonService.searchInpatient(event.text).subscribe((res) => {
          this.patientListItems = res.results;
          this.searchPatientlist = this.patientListItems;
        }); 
      } else {
        this.searchPatientlist = this.patientListItems;
      }
    } else {
      this.searchPatientlist = [];
    }
  }
  searchPorter(
    name?: string,
    floorId?: string,
    fromTime?: string,
    toTime?: string,
    poolName?: string,
    gender?: string,
    poolLocationId?: string
  ) {
    if (floorId != null) {
      this.filterFloorId = floorId;
    }

    if (fromTime != null) {
      this.fromTime = fromTime;
      this.filterFromTime = this._dateFormat.transform(
        fromTime,
        "yyyy-MM-dd HH:mm:ss"
      );
    } else {
      this.filterFromTime = this._dateFormat.transform(
        this.curDate,
        "yyyy-MM-dd HH:mm:ss"
      );

    }

    if (toTime != null) {
      this.filterToTime = this._dateFormat.transform(
        toTime,
        "yyyy-MM-dd HH:mm:ss"
      );
    } else {
      this.filterToTime = this._dateFormat.transform(new Date(this.currentDate.getTime() + (15 * 60 * 1000)), "yyyy-MM-dd HH:mm:ss");
    }

    if (poolName == null) {
      this.poolName = this.requestForm.controls['poolName'].value;
    } else {
      this.poolName = poolName;
    }

    if (gender == null) {
      this.gender = this.requestForm.controls['gender'].value
    } else {
      this.gender = gender;
    }

    if (poolLocationId == null) {
      this.poolLocationId = this.requestForm.controls['poolLocationId'].value;
    } else {
      this.poolLocationId = poolLocationId;
      if(this.selectedType === 'PR-OT') {
        this.commonService.validateUserPreference('department', poolLocationId);
      }
    }

    if (!this.autoAssign) {
      this.commonService
        .searchPorter(
          name,
          this.filterFloorId,
          this.filterFromTime,
          this.filterToTime,
          this.poolName,
          this.gender,
          this.poolLocationId
        )
        .subscribe((res) => {
          if (this.data && !this.data.id && this.data.performer.length !== 0) {
            const performer = this.data.performer?.filter( x => x?.status !== 'RQ-AB');
            const performerList = performer?.length > 0 ? this.data.performer : performer;
            this.searchPorterList = [...res.results.filter(i => i.id !== this.data.performer[0].id),...performerList];
          } else {
            this.searchPorterList = res.results;
          }
      });
    }
  }
  dateTimeValidation(value,key) {
    const status = this.requestForm.controls['status'].value;
    if(value !== null && key === 'pickup' && status !== 'RQ-CA' && status !== 'RQ-CO') {
      const fromTime = this._dateFormat.transform(value, 'yyyy-MM-ddTHH:mm');
      if(fromTime < this.curDate) {
        this.pastPickupTime = true;
      } else {
        this.pastPickupTime = false;
      }
    } else if(value !== null && key === 'drop' && status !== 'RQ-CA' && status !== 'RQ-CO') {
      const fromTime = this._dateFormat.transform(value, 'yyyy-MM-ddTHH:mm');
      if(fromTime < this.curDate) {
        this.pastDropTime = true;
      } else {
        this.pastDropTime = false;
      }
    }
  }
  setDropTime(interval, value) {
    let defaultInterval = 15;
    if (interval != null) {
      defaultInterval = interval;
    } else {
      defaultInterval = this.requestForm.controls['duration'].value;
      this.currentDate = new Date(value);
    }
    this.requestForm.get('endTime').setValue(
      this._dateFormat.transform(new Date(this.currentDate.getTime() + (defaultInterval * 60 * 1000)), 'yyyy-MM-ddTHH:mm')
    );
    this.requestForm.get('endTime').updateValueAndValidity();
  }
  getGender() {
    let preValue = this.requestForm.controls.gender.value;
    this.requestForm.controls.gender.setValue(preValue == null ? 'Male' : preValue == 'Male' ? 'Female' : null);
    this.requestForm.controls.gender.updateValueAndValidity();
    console.log(this.requestForm.controls.gender.value)
  }

  pharmacyTask(){
    let data = {};
    if(this.modifyId){
      data['reqId'] = this.modifyId;
    }
    data['type'] = this.pharmacyType;
    const dialogRef = this.dialog.open(PharmacyTaskComponent,{
      panelClass:['small-popup'],
      disableClose: true,
      data:data
    });
  }
  restrictRequest(event) {
    console.log(event)
    let message = event.message + ' Do you want to close the dialog?';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Warning',
        message: message,
        userRequestLimit: true,
        customMsg: true,
        buttonText: { cancel: 'No', ok: 'Yes' },
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.thisDialogRef.close();
      }
    });
  } 
  
  checkAvailablePorter(action) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Do you want to create a request in waitinglist?, A porter will be assigned as soon as they are available',
        buttonText: { cancel: 'No', ok: 'Yes' },
        checkAvailablePorter: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.porterStatusCheck = true;
        if (action === 'post') {
          this.SaveRequest();
        } else {
          this.UpdateRequest(this.data.requestId);
        }
      }
    });
  }

  confirmReassigned() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Do you want to proceed with reassigning this request? The existing porter will be changed and a new porter will be assigned.',
        buttonText: { cancel: 'No', ok: 'Yes' },
        reassignPorter: true,
        isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.UpdateRequest(this.data.requestId);
      }
    });
  }

  searchAsset(event) {
    if (this.selectedAssetType === 'All') {
      this.selectedAssetType = null;
    }
    this.selectedAsset = null;
    if (event.type === 'assetName' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.searchAssetByCategory(this.selectedAssetType, event.text).subscribe((res) => {
            this.assetListItems = res.results;
            this.searchAssetList = this.assetListItems;
        });
      } else {
        this.searchAssetList = this.assetListItems;
      }
    } else {
      this.searchAssetList = [];
    }
  }
  fixClick() {
    console.log('')
  }
}

@Component({
  selector: "app-porter-request-history",
  templateUrl: "./porter-request-history.component.html",
  styleUrls: ["./porter-request.component.scss"],
  providers: [DatePipe],
})

export class PorterRequestHistoryComponent implements OnInit {

  ACdisplayedColumns: string[] = ["S.No", "name", "statusName", "eventTime", "comments"];
  PHdataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  porterHistory = false;
  public historyType = 'Porter';
  public waitlistReason = null;
  public entityData = {"id":null,"entityId":this.data.requestId,"entityType":'Request','entityDetails':this.data,'entityGroupTypeId':'EGTI-PA'};
  public selectedIndex = 0;
  public selectedTab = null;
  public attachFiles = [];
  public showDocuments = false;
  public formTemplateType = 'FTT-PO';
  public entityId = null;
  public entityType = 'Request';
  public activate_btn = [];
  public tabs = [];

  constructor(
    public commonService: CommonService,
    public thisDialogRef: MatDialogRef<PorterRequestHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public toastr: AppToastService,
    public configurationService:ConfigurationService,
    public hospitalService: HospitalService,
    public sessionService: SessionStorageService,
    private readonly _dateFormat: DatePipe
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }
  ngOnInit() {
    this.tabs = ['History'];
    if (this.activate_btn?.includes('BT_PM_VD')) {
      this.tabs.push('Documents');
    }
    if (this.activate_btn?.includes('BT_PM_VF')) {
      this.tabs.push('Forms');
    }
    if (this.data.hasOwnProperty('historyType') && this.data.historyType !== null) {
      this.historyType = this.data.historyType;
    }
    if(this.data.status === 'RQ-WT'){
      this.getWaitlistReason(this.data.requestId);
    }
    this.selectedIndex = 0;
    this.selectedTab = 'History';
    this.onTabChanged()
  }
  getPorterHistory(id){
    this.commonService.getPorterHistory(id).subscribe((res) => {
      if (res.statusCode === 1) {
        if (res.results.length > 0) {
          this.porterHistory = true;
        } else {
          this.porterHistory = false;
        }
        this.PHdataSource = res.results;
        this.PHdataSource = new MatTableDataSource<any>(res.results);
        this.PHdataSource.sort = this.sort;
      }
    });
  }
  getWaitlistReason(reqId){
    this.commonService.getWaitlistReason(reqId).subscribe((res) =>{
      if (res.statusCode === 1) {
        this.waitlistReason = res.results?.reason;
      }
    })
  }

  onTabChanged(event?){
    this.showDocuments = true;
    this.selectedIndex = event?.index ?? this.selectedIndex;
    this.selectedTab = event?.tab?.textLabel ?? this.tabs[this.selectedIndex];

    if(this.selectedTab === 'History'){
      this.getPorterHistory(this.data.requestId);
    }else if(this.selectedTab === 'Documents'){
      this.entityData = {"id":null,"entityId":this.data.requestId,"entityType":'Request','entityDetails':this.data,'entityGroupTypeId':'EGTI-PA'};
    }else if(this.selectedTab === 'Forms'){
      this.formTemplateType = 'FTT-PO';
      this.entityType = 'Request';
      this.entityId = this.data?.requestId;
    }
  }

  onDialogClose(){ // To trigger delete existing data in angular service 
    this.sessionService.deleteAttachFiles();
  }

  handleDocumentEvent(event) {
    const files = event?.attachFiles ?? [];
    if (!files.length) return;
    this.attachFiles = files.map(item => ({
      ...item,
      entityId: this.data?.requestId ?? null,
      entityType: 'Request',
      parentId: null,
      parentType: null
    }));

    this.commonService.saveFile(this.attachFiles).subscribe({next: (res) => {
        refreshTab();
      },
      error: (err) => {
        refreshTab();
      }
    })

    const refreshTab = () => {
      this.onDialogClose();
      if (this.selectedTab === 'Documents') {
        this.showDocuments = false;
        setTimeout(() => {
          this.showDocuments = true;
        });
      }
    }
  }

  fixClick() {
    console.log('')
  }
}
