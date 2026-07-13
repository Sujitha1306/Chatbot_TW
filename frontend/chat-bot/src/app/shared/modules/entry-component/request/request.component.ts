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
import { Component, OnInit, Inject, Optional, Input, ViewChild } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators, FormArray } from "@angular/forms";
import { CommonService } from "../../../services/common.service";
import { DatePipe } from "@angular/common";
import { HospitalService } from "../../../services";
import { CookieService } from "ngx-cookie-service";
import { ActivatedRoute } from "@angular/router";
import { AppToastService } from "../../../services/toaster.service";
import { CreateRequest, EditRequest, Location_Config_Detail, LocationConfigDetail, PORTER_CONFIG_DETAIL, PorterConfigDetail } from "./request.model";
import { ConfirmationDialog } from "../confirmation-dialog/confirmation-dialog.component";
import { PharmacyTaskComponent } from "../pharmacy-task/pharmacy-task.component";
import { MatInput } from "@angular/material/input";
import { LookupTermService } from "../../../lookup-term.service";
import { ConfigCacheService } from "../../../config-cache.service";

@Component({
  selector: "app-request",
  templateUrl: "./request.component.html",
  styleUrls: ["./request.component.scss"],
  providers: [DatePipe],
})

export class RequestComponent implements OnInit {
  public requestForm: any = FormGroup;
  public currentDate: any = new Date();
  @Input() header = true;
  activate_btn = [];
  requestStatus = [];
  porterGroup = [];
  genderList = [];
  assetTypes = [];
  searchAssetList = [];
  serviceGroup = [];
  selectedType = 'PR-PA';
  porterConfigDetail: PorterConfigDetail = JSON.parse(JSON.stringify(PORTER_CONFIG_DETAIL));
  locationConfigDetail: LocationConfigDetail = JSON.parse(JSON.stringify(Location_Config_Detail));
  porterRequestType = [];
  selectedRequestStatus = [];
  searchPatientList = [];
  filterAssetType = [];
  modifyId = null;
  editAction = false;
  pastPickupTime = false;
  pastDropTime = false;
  searchPorterList = [];
  swap = false;
  departmentList = [];
  blockVerified = false;
  priorityFromLocation = [];
  priorityToLocation = [];
  isPriority = false;
  isRoundTrip = false;
  porterCount: number;
  porterNameCount = 0;
  visibleFields = [];
  preVisibleFields = [];
  isSaved = false;
  prePoolName = null;
  selectedPatient = null;
  patientListItems = [];
  searchPatientlist = [];
  nonPerformerType = null;
  patientId = null;
  assetType = null;
  reqAssetDetails = null;
  reqPatientDetails = null;
  filterFloorId = null;
  filterFromTime = null;
  filterToTime = null;
  poolName = null;
  gender = null;
  scheduleDate: any = new Date();
  porterDetail: {};
  public performerInfo: any = [];
  public nonPerformerInfo: Array<any>;
  @ViewChild('destinationId') destInput: MatInput;
  @ViewChild('sourceId') srcInput: MatInput;
  public dropTimeDuration = [{ code: '15', value: '15' }, { code: '30', value: '30' }, { code: '45', value: '45' }, { code: '60', value: '60' }];
  curDate = this._dateFormat.transform(this.currentDate, 'yyyy-MM-ddTHH:mm');
  dropDate = this._dateFormat.transform(new Date(this.currentDate.getTime() + (15 * 60 * 1000)), 'yyyy-MM-ddTHH:mm');
  fromTime: any;
  poolLocationId = null;
  autoAssign = true;
  userId = null;
  remarks = null;
  poolFloor = [];
  multiLocationGroup = ['SG-PH', 'SG-MS'];
  fieldAvailablity = null;
  PorterFieldMandatory: any = [];
  mandatoryFieldsObject: any = [];
  selectedAssetType = null;
  isPorterAdditionalExpanded = false;
  porterGroupGlobal = [];
  ServiceLocList = [];
  disableField = false;
  statusBasedFieldDisabled = false;
  isWaiting = false;
  existPatient = false;
  PRAssetId = null;
  selectedAsset = null;
  existAsset = false;
  selectedPorter = [];
  reqPorterDetails = [];
  searchLoc: any = [];
  location: any = [];
  storage: any = [];
  isChecked: boolean;
  checkedDataDetails: any = [];
  serviceGroupId = null;
  departmentId = null;
  defaultType = 'All';
  porterId = null;
  assetListItems = [];
  isAutoComplete = false;
  porterStatusCheck = false;
  isDeletable: boolean;
  requestStatusDetail: any;
  prevSearchPorterList: any=[];
  abortStatus = null;
  pfActivityId = null;

  constructor(
    public fb: FormBuilder, public commonService: CommonService, private readonly hospitalService: HospitalService,
    @Optional() public thisDialogRef: MatDialogRef<RequestComponent>,@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog, public toastr: AppToastService, private readonly cookieService: CookieService,
    private readonly _dateFormat: DatePipe, public activeRoute: ActivatedRoute, private readonly lookupTermService: LookupTermService,
    private readonly configCacheService: ConfigCacheService
  ) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  ngOnInit() {
    this.buildForm();
    this.applyTypeConfig(this.selectedType);
    this.lookupTermService.getAppTermsWrapper('ServiceGroup,RequestStatus,PoolName,Gender,AssetType,PorterRequestType').subscribe((res) => {
      this.requestStatus = res?.RequestStatus ?? [];
      this.porterGroup = res?.PoolName ?? [];
      this.porterGroupGlobal = res?.PoolName ?? [];
      this.genderList = res?.Gender?.filter(resFilter => resFilter.code === 'Male' || resFilter.code === 'Female') ?? [];
      this.assetTypes = res?.AssetType ?? [];
      this.serviceGroup = res?.ServiceGroup ?? [];
      this.loadData();
      this.getSelectedPorterType(this.selectedType);
    });
  }

  getPorterConfig() {
    this.configCacheService.getConfig('porter-config').subscribe(res => {
      const config = res['porter-config'];
      if (!config) return;
      this.porterConfigDetail = { ...this.porterConfigDetail, ...config };
      if (this.porterConfigDetail.hideInputs?.includes('isautoAssigned') &&
        this.activate_btn?.includes('BT_PRAUTOMANUAL')) {
        this.porterConfigDetail.hideInputs = this.porterConfigDetail.hideInputs.filter(i => i !== 'isautoAssigned');
      }
      this.porterConfigDetail.pharmacyType = config?.pharmacy?.type || this.porterConfigDetail.pharmacyType;
      const dp = this.porterConfigDetail.defaultPool;// Default Pool Logic
      if (!this.modifyId && this.data?.visitEventId && this.porterConfigDetail['OT']['porterPool'] && dp?.['PR-PA']) {
        dp['PR-PA'] = this.porterConfigDetail['OT']['porterPool'];
      }
      if (this.data?.poolNameId) {
        this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.data.poolNameId);
      } else if (dp?.[this.selectedType]) {
        this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, dp[this.selectedType]);
      } else {
        this.updateValue('poolName', null);
      }
      const mf = this.porterConfigDetail.mandatoryFields;      // Mandatory Fields
      if (mf?.length) {
        const assetCtrl = this.requestForm.get('assetCategory');
        assetCtrl?.setValidators(this.requestForm.controls[mf[0]] ? [Validators.required] : null);
        assetCtrl?.updateValueAndValidity();
        this.porterConfigDetail.selectFromRoom = mf.includes('fromLocationId');
        this.porterConfigDetail.selectToRoom = mf.includes('toLocationId');
      }
      if (config?.porterGroups?.length) {//porter group filter
        this.porterGroup = this.porterGroup.filter(pg =>config.porterGroups.includes(pg.code));
      }
      if (config?.priorityFromLocation || config?.priorityToLocation) {//Priority
        this.porterConfigDetail.checkPriorityConfig = true;
        this.checkPriority();
      }
      this.changeTypeName();
    });
  }

  setRating(value: number) {
    if (this.requestForm.get('rating')?.value >= value) {
      this.updateValue('rating', value - 1)
    } else {
      this.updateValue('rating', value)
    }
  }

  setConfigPoolName(sourceBlockId, destBlockId, poolName) {
    if (this.requestForm.get('sourceId')?.value !== null && this.requestForm.get('destinationId')?.value !== null && sourceBlockId !== destBlockId &&
      (this.porterConfigDetail.verifyBlock !== null && this.porterConfigDetail.verifyBlock?.status === true && this.porterConfigDetail.verifyBlock?.requestType.includes(this.selectedType))) {
      this.blockVerified = true;
      const group = this.porterGroup.filter(x => x.code === this.porterConfigDetail.verifyBlock?.poolName);
      if (group?.length === 0) {
        this.porterGroup.push(this.porterConfigDetail.verifyBlock?.porterGroup);
      }
      this.updateValue('poolName',this.porterConfigDetail.verifyBlock?.poolName);
    } else {
      this.blockVerified = false;
      this.updateValue('poolName',poolName);
    }
  }

  loadData() {
    this.lookupTermService.getAppTermsLinkWrapper('RQT-PO', 'PorterRequestType').subscribe(res => {
      this.porterRequestType = res?.PorterRequestType ?? [];
      this.porterRequestType.sort((a, b) => 0 - (a.code > b.code ? 1 : -1));
      this.changeTypeName();
    });
    this.getStatusDetail();
    this.activeRoute.queryParams.subscribe(params => {
      if (params.hasOwnProperty('id')) {
        this.getRequestById(params.id)
      } else if (params.hasOwnProperty('slid')) {
        this.getLocationById(params.slid)
      } else {
        this.getBasicDetails()
      }
    });
    this.buildForm();
  }

  getStatusDetail() {
    if (this.data && this.data.status === 'RQ-PLN' && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
    } else if (this.data && this.data.status === 'RQ-CO' && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' ||
        rs.code === 'RQ-RTN' || rs.code === this.data.status);
    } else if (this.data && this.data.status === 'RQ-RJ' && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-RCR' || rs.code === this.data.status);
    } else if (this.data && this.data.status === 'RQ-WT' && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' || rs.code === 'RQ-HLD' || rs.code === this.data.status);
    } else if (this.data && this.data.status === 'RQ-HLD' && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' ||
        rs.code === 'RQ-CO' || rs.code === 'RQ-CR' || rs.code === this.data.status);
    } else if (this.data && this.data.requestId != null) {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-CA' || rs.code === this.data.status);
    } else {
      this.selectedRequestStatus = this.requestStatus.filter(rs => rs.code === 'RQ-PLN' ||
        rs.code === 'RQ-CR' || rs.code === this.data.status);
    }
    if(this.data && (this.data.status === 'RQ-IP' || this.data.status === 'RQ-CR' || this.data.status === 'RQ-AS')) {
      const status = this.requestStatus?.filter(rs => rs.code === 'RQ-RAS');
      if(status?.length > 0) {
        this.selectedRequestStatus.push(status[0]);
      }
    }
  }

  validateUserPreference(key: string) {
    this.commonService.validateUserPreference(key);
    if (this.commonService.userPreference && this.commonService.userPreference?.hasOwnProperty(key)) {
      return this.commonService.userPreference[key].value;
    }
    return null;
  }

  getBasicDetails() {
    if (this.data == null) {
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
      this.porterConfigDetail.disablePoolNameId = this.data.status != 'RQ-WT' ? true : false;
    }
    this.buildForm();
    this.selectedType = this.validateUserPreference('porterReqType');
    if (this.modifyId === null) {
      this.serviceGroupId = this.validateUserPreference('serviceGroup');
      this.departmentId = this.validateUserPreference('department');
    }
    const expandValue = this.validateUserPreference('isPorterAdditionalExpanded');
    this.isPorterAdditionalExpanded = expandValue === 'true';
    this.lookupTermService.getAppTermsLinkWrapper('RQT-PO', 'PorterRequestType').subscribe(res => {
      this.porterRequestType = res?.PorterRequestType ?? [];
      this.porterRequestType.sort((a, b) => 0 - (a.code > b.code ? 1 : -1));
      this.changeTypeName()
    })
    if (this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) === null ||
      this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) === '') {
      this.locationConfigDetail.initSearchLocList = [];
    } else {
      this.locationConfigDetail.initSearchLocList = JSON.parse(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
    }
    if (this.cookieService.check('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')))) {
      if (this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== null &&
        this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== '') {
        const data = JSON.parse(this.cookieService.get('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
        this.locationConfigDetail.sourceLocFullname = data.fullName;
        this.updateLocationDetails(data.id, data.fullName, "pickup")
        this.getAllLocationById(data, 'source');
      }
    }
    const sourceData = JSON.parse(sessionStorage.getItem('porter_source_child_loc_'));
    if (sourceData && sourceData !== null) {
      this.locDataValueAssign({sourceChildList: sourceData.list, sourceChildPrevList: sourceData.list, sourceLocFullname: sourceData.location.fullName, 
        srcLocationTypeId: sourceData.location.locationTypeId, sourceLocName: sourceData.location.name, srcParentLocationId: sourceData.location.parentId});
      this.updateLocationDetails(sourceData.location.id, sourceData.location.fullName, "pickup")
    }
    if (this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) != '') {
      this.ServiceLocList = JSON.parse(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
      this.locationConfigDetail.searchLocList = this.ServiceLocList;
    }
    this.locDataValueAssign({sourceListItem: this.locationConfigDetail.initSearchLocList, destListItem: this.locationConfigDetail.initSearchLocList, 
      searchSourceLocList: [...this.locationConfigDetail.initSearchLocList], searchDestinationLocList: [...this.locationConfigDetail.initSearchLocList]});
    this.getPorterConfig();
    if (this.data.type && this.data.id) {
      this.getAvailablePorterType(this.data.type);
    } else if (this.data.requestCategory && this.data.requestId) {
      this.getAvailablePorterType(this.data.requestCategory);
    } else {
      this.getAvailablePorterType(this.selectedType);
    }
  }

  setFormValue(code, type) {
    if (type === 'request') {
      this.updateValue('requestCategory', code);
    } else if (type === 'assignPorter') {
      this.updateValue('isautoAssigned', code);
    } else if (type === 'gender') {
      if (this.requestForm.controls['gender'].value === code) {
        this.updateValue('gender', null);
      } else {
        this.updateValue('gender', code);
      }
    }
  }

  getLocationById(sourceId) {
    this.hospitalService.getLocationWithChildren(sourceId).subscribe(res => {
      if (res.statusCode == 1) {
        let locDetail = res.results;
        let locationDetail = {
          "fullName": locDetail.name,
          "id": locDetail.id,
          "locationTypeId": locDetail.locationTypeId,
          "name": locDetail.name,
          "parentId": locDetail.parentId,
          "blockId": locDetail.blockId
        }
        this.cookieService.set('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),JSON.stringify(locationDetail));
        this.getBasicDetails()
      }
    });
  }

  getRequestById(reqId) {
    this.commonService.getPorterReqById(reqId).subscribe(res => {
      if (res.statusCode == 1) {
        this.data = res.results[0];
        this.getBasicDetails()
      }
    })
  }

  changeTypeName() {
    let TypeText = {}
    if (this.porterConfigDetail && this.porterConfigDetail.hasOwnProperty('typeText')) {
      TypeText = this.porterConfigDetail['typeText'];
    }
    this.porterRequestType = this.porterRequestType.map(item => {
      if (TypeText[item.code]) {
        return { ...item, value: TypeText[item.code] };
      }
      return item;
    });
    if (this.data.hasOwnProperty('infantInfo') && this.data.infantInfo) {
      let index = this.porterRequestType.findIndex(val => val.code == 'PR-PA');
      this.porterRequestType[index]['value'] = 'Infant'
    }
  }

  getAvailablePorterType(code) {
    if (this.porterRequestType.length === 0) {
      this.lookupTermService.getAppTermsLinkWrapper('RQT-PO', 'PorterRequestType').subscribe((res) => {
        this.porterRequestType = res?.PorterRequestType ?? [];
        this.porterRequestType.sort((a, b) => 0 - (a.code > b.code ? 1 : -1));
        this.changeTypeName()
        const type = this.porterRequestType.filter(res => res.code === code);
        if (type.length === 0) {
          this.selectedType = this.porterRequestType[0]?.code;
        } else {
          this.selectedType = code;
        }
        this.getRequestType();
      });
    } else {
      const type = this.porterRequestType.filter(res => res.code === code);
      if (type.length === 0) {
        this.selectedType = this.porterRequestType[0].code;
      } else {
        this.selectedType = code;
      }
      this.getRequestType();
    }
  }

  locDataValueAssign(data: { [key: string]: any }) {
    Object.keys(data).forEach(key => {this.locationConfigDetail[key] = data[key];});
  }

  getRequestType() {
    this.applyTypeConfig(this.selectedType);
    if (this.data && this.data.id) {
      this.getStatusDetail();
      this.modifyId = this.data.requestId;
      if (this.data?.id !== '0' && this.data?.id !== null) {
        this.editAction = Object.keys(this.data).length > 5 ? true : false;
      }
      if (this.selectedType === "PR-PA") {
        this.patientId = this.data.id;
        this.selectedPatient = this.data.name;
        this.existPatient = true;
        this.nonPerformerType = "patient";
        this.reqPatientDetails = this.data;
        if ((this.data.hasOwnProperty('infantInfo') || true) && this.data.hasOwnProperty('sourceBedId') && this.data.sourceBedId) {
          this.fromToLocationBinding()
        } else {
          this.commonService.getLiveLocation('Patient', this.patientId).subscribe(res => {
            if (res.results !== null) {
              this.updateLocationDetails(res.results.locationId, res.results.locationName, "pickup")
            } else {
              this.locDataValueAssign({locFromId: null, sourceBlockId: null, locSourceOption: null});
              this.requestForm.patchValue({ sourceId: null});
              this.requestForm.controls.sourceId.enable();
              this.requestForm.get("sourceId").updateValueAndValidity();
            }
          });
        }
        if (this.modifyId == null) {
          this.getSelectedType(this.selectedType, 'req');
        }
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.updateValue('comments', this.data.comments ? this.data.comments : null);
        this.updateValue('assetCategory', 'AT-TO');
      } else if (this.selectedType === "PR-AT") {
        this.data.assetCategory = this.data.assetTypeId;
        this.nonPerformerType = "asset";
        this.PRAssetId = this.data.id;
        this.reqAssetDetails = this.data;
        this.selectedAsset = this.data.name;
        this.existAsset = true;
        this.commonService.getLiveLocation('Asset', this.PRAssetId).subscribe(res => {
          if (res.results !== null) {
            this.updateLocationDetails(res.results.locationId, res.results.locationName, "pickup");
          }
        });
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
      } else if (this.selectedType === "PR-SE") {
        this.data.assetCategory = this.data.assetTypeId;
        this.nonPerformerType = "service";
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(this.data.serviceGroupId);
        let filterComments = this.porterRequestType.filter(val => val.code == this.selectedType);
        let comments = ''
        if (filterComments.length) {
          comments = filterComments[0]['value']
        }
        this.updateValue('comments', comments);
        if (this.locationConfigDetail.locFromId !== null) {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput?.focus();
            this.locDataValueAssign({destListItem: [], searchDestinationLocList: [], searchDestinationBedList: [], searchDestinationNonBedList: []});
          });
        } else {
          setTimeout(() => {
            this.srcInput?.focus();
            this.locDataValueAssign({sourceListItem: [], searchSourceLocList: [], searchSourceBedList: [], searchSourceNonBedList: []});
          });
        }
      } else {
        this.data.assetCategory = this.data.assetTypeId;
        this.nonPerformerType = "others";
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.updateValue('comments', this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        this.updateValue('assetCategory', 'AT-TO');
        if (this.selectedType == 'PR-OT' && this.departmentList.length) {
          this.updateValidator("poolLocationId",[Validators.required]);
        }
        this.updateValue("poolLocationId",this.departmentId);
        if (this.locationConfigDetail.locFromId !== null) {
          this.requestForm.controls.sourceId.disable();
          setTimeout(() => {
            this.destInput?.focus();
            this.locDataValueAssign({destListItem: [], searchDestinationLocList: [], searchDestinationBedList: [], searchDestinationNonBedList: []});
          });
        } else {
          setTimeout(() => {
            this.srcInput?.focus();
             this.locDataValueAssign({sourceListItem: [], searchSourceLocList: [], searchSourceBedList: [], searchSourceNonBedList: []});
          });
        }
      }
      if (this.locationConfigDetail.locFromId !== undefined && this.locationConfigDetail.locFromId !== null) {
        this.requestForm.get('sourceId').disable();
      }
      if (this.locationConfigDetail.locToId != undefined && this.locationConfigDetail.locToId !== null) {
        this.requestForm.get('destinationId').disable();
      }
    } else if (this.data && !this.data.id) {
      this.editAction = true;
      if (this.data && this.data.status === 'RQ-PLN') {
        this.statusBasedFieldDisabled = true;
      }
      if (this.data.nonPerformer.length > 0 || this.data.requestCategory === "PR-SE") {
        if (this.porterConfigDetail.typesOfPatientName.includes(this.data.requestCategory)) {
          this.nonPerformerType = "patient";
          this.patientId = this.data.nonPerformer[0].id;
          if (this.porterConfigDetail.patientSearch) {
            this.selectedPatient = this.data.nonPerformer[0].fullName;
          } else if (this.modifyId && this.porterConfigDetail.typesOfPatientName.includes(this.data.requestCategory)) {
            let patDetail = this.data.nonPerformer.filter(val => val.tagAssociationTypeId == 'TAT-PA');
            if (patDetail.length) {
              this.selectedPatient = patDetail[0]['name'];
            }
          }
          this.existPatient = true;
          this.reqPatientDetails = this.data.nonPerformer[0];
          if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for (let i = 0; i < this.data.performer.length; i++) {
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          if (this.data.sourceBedId !== null) {
            this.updateLocationDetails(this.data.sourceBedId, this.data.sourceLocationName, "pickup");
          } else {
            this.updateLocationDetails(this.data.sourceId, this.data.sourceLocationName, "pickup");
          }
          if (this.data.destinationBedId !== null) {
            this.updateLocationDetails(this.data.destinationBedId, this.data.destinationLocationName, "drop");
          } else {
            this.updateLocationDetails(this.data.destinationId, this.data.destinationLocationName, "drop");
          }
          this.data.startTime = this._dateFormat.transform(this.data.startTime,"yyyy-MM-ddTHH:mm");
          this.data.endTime = this._dateFormat.transform(this.data.endTime,"yyyy-MM-ddTHH:mm");
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(null);
        } else if (this.data.requestCategory === "PR-AT") {
          this.nonPerformerType = "asset";
          this.PRAssetId = this.data.nonPerformer[0].id;
          this.reqAssetDetails = this.data.nonPerformer[0];
          this.selectedAsset = this.data.nonPerformer[0].name;
          this.existAsset = true;
          if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for (let i = 0; i < this.data.performer.length; i++) {
              if (this.data.performer[i].hasOwnProperty('status') && ['RQ-NR', 'RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status'])) {
                continue
              }
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          if (this.data.sourceBedId !== null) {
            this.updateLocationDetails(this.data.sourceBedId, this.data.sourceLocationName, "pickup");
          } else {
            this.updateLocationDetails(this.data.sourceId, this.data.sourceLocationName, "pickup");
          }
          if (this.data.destinationBedId !== null) {
            this.getCurrentLocationDetails(this.data.destinationBedId, "drop");
            this.updateLocationDetails(this.data.destinationBedId, this.data.destinationLocationName, "drop");
          } else {
            this.updateLocationDetails(this.data.destinationId, this.data.destinationLocationName, "drop");
          }
          this.data.startTime = this._dateFormat.transform(this.data.startTime,"yyyy-MM-ddTHH:mm");
          this.data.endTime = this._dateFormat.transform(this.data.endTime, "yyyy-MM-ddTHH:mm");
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(null);
          this.selectedAssetType = this.data.assetCategory;
        } else if (this.data.requestCategory === "PR-SE") {
          this.nonPerformerType = "service";
          if (this.data.performer.length > 0) {
            this.reqPorterDetails = this.data.performer;
            for (let i = 0; i < this.data.performer.length; i++) {
              if (this.data.performer[i].hasOwnProperty('status') && ['RQ-NR', 'RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status'])) {
                continue
              }
              if(this.data.performer[i].status !== 'RQ-AB') {
                this.selectedPorter.push(this.data.performer[i].id);
              }
            }
          }
          this.autoAssign = this.data.isAutoAssigned;
          if (this.data.sourceBedId !== null) {
            this.updateLocationDetails(this.data.sourceBedId, this.data.sourceLocationName, "pickup");
          } else {
            this.updateLocationDetails(this.data.sourceId, this.data.sourceLocationName, "pickup");
          }
          if (this.data.destinationBedId !== null) {
            this.updateLocationDetails(this.data.destinationBedId, this.data.destinationLocationName, "drop");
          } else {
            this.updateLocationDetails(this.data.destinationId, this.data.destinationLocationName, "drop");
          }
          this.data.startTime = this._dateFormat.transform(this.data.startTime,"yyyy-MM-ddTHH:mm");
          this.data.endTime = this._dateFormat.transform(this.data.endTime,"yyyy-MM-ddTHH:mm" );
          this.buildForm();
          this.getPorterCount(null);
          this.getAvailableServices(this.data.serviceGroupId);
        }
      } else {
        this.nonPerformerType = "others";
        if (this.data.performer.length > 0) {
          this.reqPorterDetails = this.data.performer;
          for (let i = 0; i < this.data.performer.length; i++) {
            if (this.data.performer[i].hasOwnProperty('status') && ['RQ-NR', 'RQ-CA', 'RQ-RJ'].includes(this.data.performer[i]['status'])) {
              continue
            }
            if(this.data.performer[i].status !== 'RQ-AB') {
              this.selectedPorter.push(this.data.performer[i].id);
            }
          }
        }
        this.autoAssign = this.data.isAutoAssigned;
        if (this.data.sourceBedId !== null) {
          this.updateLocationDetails(this.data.sourceBedId, this.data.sourceLocationName, "pickup");
        } else {
          this.updateLocationDetails(this.data.sourceId, this.data.sourceLocationName, "pickup");
        }
        if (this.data.destinationBedId !== null) {
          this.updateLocationDetails(this.data.destinationBedId, this.data.destinationLocationName, "drop");
        } else {
          this.updateLocationDetails(this.data.destinationId, this.data.destinationLocationName, "drop");
        }
        this.data.startTime = this._dateFormat.transform(this.data.startTime,"yyyy-MM-ddTHH:mm");
        this.data.endTime = this._dateFormat.transform(this.data.endTime,"yyyy-MM-ddTHH:mm");
        this.buildForm();
        this.getPorterCount(null);
        this.getAvailableServices(null);
        this.selectedAssetType = this.data.assetCategory;
        this.updateValue("comments",this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
        if (this.selectedType == 'PR-OT' && this.departmentList.length) {
          this.updateValidator("poolLocationId",[Validators.required]);
        }
      }
      if (this.locationConfigDetail.locFromId !== undefined && this.locationConfigDetail.locFromId !== null) {
        this.requestForm.get('sourceId').disable();
      }
      if (this.locationConfigDetail.locToId !== undefined && this.locationConfigDetail.locToId !== null) {
        this.requestForm.get('destinationId').disable();
      }
    } else {
      this.buildForm();
      this.getSelectedType(this.selectedType, 'req');
      this.getPorterCount(null);
    }
    this.setConfigValidator();
    this.getSelectedPorterType(this.selectedType);
  }

  fromToLocationBinding() {
    if (this.data.sourceBedId !== null) {
      this.updateLocationDetails(this.data.sourceBedId, this.data.sourceLocationName, "pickup");
    } else {
      this.updateLocationDetails(this.data.sourceId, this.data.sourceLocationName, "pickup");

    }
    if (this.data.destinationBedId !== null) {
      this.updateLocationDetails(this.data.destinationBedId, this.data.destinationLocationName, "drop");
    } else {
      this.updateLocationDetails(this.data.destinationId, this.data.destinationLocationName, "drop");
    }
  }

  public buildForm() {
    this.requestForm = this.fb.group({
      requestCategory: [this.selectedType ? this.selectedType : null, [Validators.required]],
      isautoAssigned: [this.autoAssign ? this.autoAssign : false],
      comments: [this.data.comments ? this.data.comments : null, [Validators.maxLength(16), Validators.pattern(/^[a-zA-Z0-9 _<>\(\),]*$/)]],
      assetCategory: [this.data.assetCategory ? this.data.assetCategory : this.selectedType === 'PR-AT' ? 'All' : null],
      assetCount: [this.data.assetCount ? this.data.assetCount : null],
      porterId: [this.selectedPorter ? this.selectedPorter : null],
      patientId: [this.selectedPatient ? this.selectedPatient : null],
      assetId: [this.selectedAsset ? this.selectedAsset : null],
      sourceId: [this.locationConfigDetail.locFromId ? this.locationConfigDetail.locFromId : null,[Validators.required]],
      destinationId: [this.locationConfigDetail.locToId ? this.locationConfigDetail.locToId : null],
      porterCount: [this.data.porterCount ? this.data.porterCount : 1,[Validators.required, Validators.pattern('[0-9]{1,3}$')]],
      startTime: [this.data.startTime ? this.data.startTime : this.curDate,[Validators.required]],
      endTime: [this.data.endTime ? this.data.endTime : this.dropDate, [Validators.required]],
      cancelReasonId: [this.data.cancelReasonId ? this.data.cancelReasonId : null],
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
        this.departmentId !== null ? this.departmentId : null],
      lastModifiedOn: [this.data.lastModifiedOn ? this.data.lastModifiedOn : null],
      locations: this.fb.array([this.getLocations()]),
      fromLocationId: [this.locationConfigDetail.fromLocationId ? this.locationConfigDetail.fromLocationId : null],
      toLocationId: [this.locationConfigDetail.toLocationId ? this.locationConfigDetail.toLocationId : null]
    });
    if (this.data?.status === 'RQ-AR' || this.data?.status === 'RQ-CR' || this.data?.status === 'RQ-IP' || this.data?.status === 'RQ-CO') {
      this.requestForm.get('poolName')?.disable();
      this.requestForm.get('assetCategory')?.disable();
      this.requestForm.get('gender')?.disable();
      this.requestForm.get('isautoAssigned')?.disable();
    } else {
      if (this.porterConfigDetail?.disablePoolNameId) {
        this.requestForm.get('poolName')?.disable();
      } else {
        this.requestForm.get('poolName')?.enable();
      }
      this.requestForm.get('assetCategory')?.enable();
      this.requestForm.get('gender')?.enable();
      this.requestForm.get('isautoAssigned')?.enable();
    }
    if (this.modifyId != null && this.multiLocationGroup?.includes(this.data.serviceGroupId) && this.data.nonPerformer.length) {
      this.bindLocation()
    }
    setTimeout(() => {
      this.requestForm.patchValue({ sourceId: this.locationConfigDetail.locFromId });
      this.requestForm.patchValue({ destinationId: this.locationConfigDetail.locToId });
    });
  }

  getLocations() {
    let res = null;
    res = this.fb.group({
      id: [null, this.porterConfigDetail.pharmacyType == 'TAT-PA' && this.selectedType === 'PR-SE' && this.serviceGroupId === 'SG-PH' ? Validators.required : null],
      name: [null],
      type: [this.serviceGroupId === 'SG-PH' ? "TAT-PA" : 'LOC'],
      priority: [false],
      comments: [null, this.selectedType === 'PR-SE' &&
        this.multiLocationGroup?.includes(this.serviceGroupId) ? Validators.maxLength(30) : null],
      locationId: [null, this.selectedType === 'PR-SE' &&
        this.multiLocationGroup?.includes(this.serviceGroupId) ? Validators.required : null],
      externalIdentifier: [null, this.porterConfigDetail?.pharmacyType == 'TAT-PA' && this.selectedType === 'PR-SE' && this.serviceGroupId === 'SG-PH' ? Validators.required : null]
    });
    return res
  }

  private bindLocation() {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.removeAt(0);
    this.data.nonPerformer = this.data.nonPerformer.filter(res => res.tagAssociationTypeId == 'LOC')
    for (let i = 0; i < this.data.nonPerformer.length; i++) {
      control.push(
        this.fb.group({
          id: [this.data['nonPerformer'][i].id],
          name: [this.data['nonPerformer'][i].name],
          type: ["TAT-PA"],
          priority: [this.data['nonPerformer'][i].priority],
          comments: [this.data['nonPerformer'][i].comments],
          locationId: [this.data['nonPerformer'][i].locationId]
        })
      );
      this.locationConfigDetail.searchLocList = [...this.locationConfigDetail.searchLocList, { id: this.data['nonPerformer'][i].id, fullName: this.data['nonPerformer'][i].name }]
    }
  }

  handleOptionClick(index, option) {
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
      this.locationConfigDetail.locationName = option.bedName;
    }
  }

  getLocationName(index, selectedId, event) {
    let name = '';
    if (this.modifyId != null) {
      name = this.data.nonPerformer[index]['name'];
    } else if (selectedId) {
      let selectedLoc = this.locationConfigDetail.searchLocList.filter(res => res.id == selectedId);
      if (selectedLoc.length) {
        name = selectedLoc[0]['name'] + ', ' + selectedLoc[0]['fullName'];
        let LocData = {
          'fullName': selectedLoc[0].fullName,
          'id': selectedLoc[0].id,
          'locationTypeId': selectedLoc[0].locationTypeId,
          'name': selectedLoc[0].name,
          'parentId': selectedLoc[0].parentId
        }
        if (this.ServiceLocList.length == 0 || this.ServiceLocList.length && this.ServiceLocList.filter(val => val.id == LocData.id).length == 0) {
          this.ServiceLocList.push(LocData)
        }
      }
    }
    if (!name && this.locationConfigDetail.locationName) {
      name = this.locationConfigDetail.locationName;
      this.locationConfigDetail.locationName = null;
    }
    return name;
  }

  getPatientName(index, selectedId) {
    let name = '';
    if (selectedId) {
      let selectedIndex = this.searchPatientlist.findIndex(res => res.id == selectedId);
      name = this.searchPatientlist[selectedIndex]['fullName'];
    }
    return name;
  }

  public addLocation() {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.push(this.getLocations());
    this.locationConfigDetail.searchLocList = [];
    if (this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) != '') {
      let data = JSON.parse(this.cookieService.get('porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
      this.locationConfigDetail.searchLocList = data;
    }
  }

  public removeLocation(i: number) {
    const control = <FormArray>this.requestForm.controls['locations'];
    control.removeAt(i);
  }

  getLocValidation(value, index) {
    if (value !== null) {
      this['loc1' + index] = value;
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setErrors(null);
      idCtrl?.markAsTouched();
    }
  }

  searchLocation(event, index?) {
    if (this['loc1' + index] === null) {
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('locationId');
      idCtrl?.setErrors({ requireMatch: true });
      idCtrl?.markAsTouched();
    }
    if (event.type === 'location' && event.text.length >= 2) {
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe(res => {
          if (res.statusCode == 1) {
            let preLocList = this.requestForm.controls.locations.value;
            preLocList = preLocList.map(value => parseInt(value.id))
            this.locationConfigDetail.searchLocItems = res.results
            this.locationConfigDetail.searchLocList = this.locationConfigDetail.searchLocItems;
          }
        });
      } else {
        this.locationConfigDetail.searchLocList = this.locationConfigDetail.searchLocItems;
      }
    } else {
      this.locationConfigDetail.searchLocList = [];
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
      });
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
        for (let i = 0; i < this.checkedDataDetails.length; i++) {
          this.reqPorterDetails = this.reqPorterDetails.filter(x => x.id !== this.checkedDataDetails[i].id);
          this.reqPorterDetails.push(this.checkedDataDetails[i])
        }
      } else {
        this.reqPorterDetails = this.reqPorterDetails.filter(x => x.id !== event.value);
      }
      this.porterId = data.id;
    }
  }

  getPorterCount(type) {
    let porterValue = parseInt(this.requestForm.controls['porterCount'].value);
    if (type !== null && type === 'increment') {
      if (porterValue < this.porterConfigDetail?.maxPorterLimit) {
        porterValue++;
        this.updateValue('porterCount',porterValue);
      }
    } else if (type !== null && type === 'decrement' && porterValue !== 1) {
      porterValue--;
      this.updateValue('porterCount',porterValue);
    }
    if (this.requestForm.controls['porterId'].value !== null) {
      this.porterNameCount = this.requestForm.controls['porterId'].value.length;
    }
    this.porterCount = parseInt(this.requestForm.controls['porterCount'].value);
  }

  applyTypeConfig(type: string): void {
    const sourceList = this.locationConfigDetail.locFromId !== null ? [{ id: this.locationConfigDetail.locFromId, fullName: this.locationConfigDetail.sourceLocFullname }] : [];
    const destinationList = this.locationConfigDetail.locToId !== null ? [{ id: this.locationConfigDetail.locToId, fullName: this.locationConfigDetail.destLocFullname }] : [];
    this.locationConfigDetail.searchSourceLocList = sourceList;
    this.locationConfigDetail.searchDestinationLocList = destinationList;
    const config = this.porterConfigDetail?.typeConfig?.[type];
    this.nonPerformerType = config?.nonPerformerType;
    if (!config) {
      this.visibleFields = [];
      return;
    }
    this.visibleFields = Object.keys(config);
    this.preVisibleFields = Object.keys(config);
    Object.keys(this.requestForm.controls).forEach(controlName => {
      if (controlName !== 'locations') {
        const control = this.requestForm.get(controlName);
        const fieldConfig: any = Object.values(config).find((field: any) => typeof field === 'object' && field?.formControlName === controlName);
        if (fieldConfig) {
          if (fieldConfig.mandatory) {
            control?.setValidators(Validators.required);
          } else {
            control?.clearValidators();
          }
          if (fieldConfig.defaultValue !== undefined &&
            (!this.data || this.data === null || this.data?.id === '0')) {
            control?.setValue(fieldConfig.defaultValue);
          } else {
            const data = this.data;
            if (data && data !== null && data?.id !== '0') {
              control?.setValue(this.data?.[controlName]);
              if (controlName === 'priority') {
                this.isPriority = this.data?.[controlName];
              }
              if (controlName === 'isRoundTrip') {
                this.isRoundTrip = this.data?.[controlName];
              }
            }
          }
        } else {
          control?.clearValidators();
          if (this.data && this.data !== null && this.data?.id !== '0') {
            control?.setValue(this.data?.[controlName]);
            if (controlName === 'priority') {
              this.isPriority = this.data?.[controlName];
            }
            if (controlName === 'isRoundTrip') {
              this.isRoundTrip = this.data?.[controlName];
            }
          }
        }
        control?.updateValueAndValidity();
      }
    });
  }

   updateValue(field: string, value?: any): void {
    const control = this.requestForm.get(field);
    if (!control) {return;}
    if (value !== undefined) {
      this.requestForm.get(field).setValue(value);
    }
    control.updateValueAndValidity();
  }

  updateValidator(field: string, validators?: any[], value?: any): void {
    const control = this.requestForm?.get(field);
    if (!control) {return;}
    if (validators) {
      control?.setValidators(validators);
    } else {
      control?.clearValidators();
    }
    control?.updateValueAndValidity();
  }

  getSelectedType(code, type) {
    if (type === "req") {
      if(this.modifyId == null) {
        if (code === "PR-PA") {
          if (this.data.id && this.data.id !== "0") {
            this.patientId = this.data.id;
            this.selectedPatient = this.data.name;
            this.updateValue("patientId",this.selectedPatient);
          }
          this.updateValue("comments",this.data?.comments ? this.data.comments : null);
          this.updateValue('assetCategory','AT-TO');
          this.updateValue("comments",this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
          if (this.data.hasOwnProperty('infantInfo') && this.data.infantInfo) {
            this.updateValue("comments",this.data.comments);
            this.updateValue('assetCategory',this.data.assetCategory);
          }
        } else if (code === "PR-AT") {
          this.selectedAssetType = this.defaultType;
          this.updateValue("assetCategory",this.defaultType);
          this.updateValue("comments",this.data?.comments ? this.data.comments : 'Asset Transfer');
        } else if (code === "PR-SE") {
          if (this.swap) {
             this.locDataValueAssign({searchDestinationLocList: [], searchDestinationBedList: [], searchDestinationNonBedList: []});
          }
          let filterComments = this.porterRequestType.filter(val => val.code == code);
          let comments = ''
          if (filterComments.length) {
            comments = filterComments[0]['value']
          }
          this.updateValue('comments',comments);
          this.requestForm.get("destinationId").enable();
          this.locationConfigDetail.locToId = null;
          this.locationConfigDetail.destBlockId = null;
          if (this.modifyId == null && this.serviceGroup.length) {
            this.updateValue("serviceGroupId",this.serviceGroupId !== null ? this.serviceGroupId : this.serviceGroup[0]['code']);
            this.getAvailableServices(this.serviceGroupId !== null ? this.serviceGroupId : this.serviceGroup[0]['code'])
          }
        } else {
          this.updateValue("comments",this.data && this.data.comments ? this.data.comments : 'Patient Transfer');
          this.updateValue('assetCategory','AT-TO');
          this.updateValue("poolLocationId",code === 'PR-OT' &&
            this.departmentId !== null ? this.departmentId : null);
          if (this.selectedType == 'PR-OT' && this.departmentList.length) {
            this.updateValidator("poolLocationId",[Validators.required]);
          }
          if (this.locationConfigDetail.locFromId !== null) {
            this.requestForm.controls.sourceId.disable();
            if(this.locationConfigDetail.locToId === null) {
              setTimeout(() => {
                this.destInput?.focus();
                this.locDataValueAssign({destListItem: [], searchDestinationLocList: [], searchDestinationBedList: [], searchDestinationNonBedList: []});
              });
            }
          } else {
            setTimeout(() => {
              this.srcInput?.focus();
              this.locDataValueAssign({sourceListItem: [], searchSourceLocList: [], searchSourceBedList: [], searchSourceNonBedList: []});
            });
          }
        }
        this.searchPorter();
        this.setConfigValidator();
        this.getRequestDetail();
      }
    } else if (type === "asset") {
      this.selectedAssetType = code;
      this.searchAssetList = [];
      this.updateValue("assetId",null);
      this.searchPorter();
      if (code === 'PR-SE') {
        this.getFieldAvailablity(code);
      }
    } else if (type === "assign" && !code) {
      if (this.porterConfigDetail?.defaultPool.length > 0 && this.porterConfigDetail?.defaultPool.hasOwnProperty(this.selectedType)) {
        this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.porterConfigDetail?.defaultPool[this.selectedType]);
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

  statusChange(status) {
    if(status === 'RQ-RAS') {
      this.prevSearchPorterList = this.searchPorterList;
      this.reqPorterDetails.forEach(x => {
        x['status'] = 'RQ-AB'
        this.searchPorterList = this.searchPorterList.filter(a => a.id !== x.id);
      });
      if(this.requestForm.get('isautoAssigned')?.value === false) {
        this.requestForm.get('porterId')?.setValue(null);
      }
    } else {
      this.searchPorterList = this.prevSearchPorterList;
    }
    if (status === 'RQ-CA' || status === 'RQ-CO') {
      this.pastPickupTime = false;
      this.pastDropTime = false;
    }
    if (status === 'RQ-CR') {
      this.editAction = false;
      this.statusBasedFieldDisabled = true;
      if (!this.data?.status) {
        this.updateValue('startTime',this.curDate);
      }
    } else if (status === 'RQ-PLN') {
      this.editAction = true;
      this.autoAssign = true;
      this.updateValue('isautoAssigned',true);
      this.statusBasedFieldDisabled = true;
    } else if (status === 'RQ-CA' || status === 'RQ-CO') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['mdm-Confirmation-popup'], height: '280px',
        disableClose: true,
        data: {
          title: 'Porter Request Status', message: 'Do you want to change the status?',
          buttonText: { cancel: 'No', ok: 'Yes' }, status: 'RQ-CA', porterReqStatusChange: true, isRemark: 1,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'No') {
          this.updateValue('status',this.data.status);
        } else {
          this.updateValue('cancelReasonId',result?.reason);
          this.userId = result?.user;
          this.remarks = result?.remarks;
        }
      });
    } else if (status === 'RQ-RTN' || status === 'RQ-RCR') {
      this.editAction = false;
      this.disableField = false;
      this.reqPorterDetails = [];
      this.modifyId = null;
      this.updateValue('startTime',this.curDate);
      this.updateValue('porterId',[]);
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
        this.updateValue('isautoAssigned',this.data.isAutoAssigned);
        this.requestForm.get('isautoAssigned')?.disable();
      } else {
        this.requestForm.get('isautoAssigned')?.enable();
      }
    } else if (status === 'RQ-CO' || status === 'RQ-RJ') {
      this.editAction = true;
      this.disableField = true;
      this.modifyId = this.data.requestId;
      this.reqPorterDetails = this.data.performer;
      this.updateValue('porterId',this.selectedPorter);
      this.updateValue('startTime',this.data.startTime);
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

  getPorterAdditionalExpanded(expandVal) {
    this.commonService.validateUserPreference('isPorterAdditionalExpanded', expandVal);
    if (this.selectedType !== null) {
      this.commonService.validateUserPreference('porterReqType', this.selectedType);
    }
  }

  getPoolName(value) {
    let defaultPool = [];
    if (this.porterGroup.length && this.porterConfigDetail?.defaultPool.hasOwnProperty(this.selectedType)) {
      defaultPool = this.porterGroup.filter(val => val.code == this.porterConfigDetail?.defaultPool[this.selectedType])
    }
    let porterGroupRes = [];
    this.lookupTermService.getAppTermsLinkWrapper(value).subscribe(res => {
      if (res) {
        porterGroupRes = res?.PoolName ?? [];
        if (porterGroupRes.length == 0 && this.porterConfigDetail?.allowGlobalPool) {
          this.porterGroup = this.porterGroupGlobal
        } else {
          this.porterGroup = res?.PoolName ?? [];
          this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.porterGroup[0]?.code);
        }
        if (defaultPool.length) {
          this.porterGroup.push(defaultPool[0])
        }
      } else if (defaultPool.length) {
        this.porterGroup = [];
        this.porterGroup.push(defaultPool[0])
      }
      if (this.porterGroup.length) {
        let otPool = null
        if (!this.modifyId && this.data.hasOwnProperty('visitEventId') && this.porterConfigDetail.hasOwnProperty('OT')) {
          otPool = this.porterConfigDetail['OT']['porterPool']
        }
        let selectedPoolGroup = porterGroupRes.length == 0 ? this.porterGroup.findIndex(val => val.code == this.porterConfigDetail?.defaultPool[this.selectedType]) != -1 ? this.porterConfigDetail.defaultPool[this.selectedType] : this.porterGroup[0]['code'] : porterGroupRes[0]['code'];
        const pool = otPool ? otPool : selectedPoolGroup;
        this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, pool);
      }
    });
  }

  checkPriority() {
    if ((this.priorityFromLocation.length > 0 && this.priorityFromLocation.includes(this.locationConfigDetail.locFromId)) ||
      (this.priorityToLocation.length > 0 && this.priorityToLocation.includes(this.locationConfigDetail.locToId))
    ) {
      this.isPriority = true;
    } else {
      this.isPriority = false;
    }
  }

  isPriorityEvent() {
    if (this.isPriority !== true) {
      this.updateValue('priority',true);
      this.isPriority = true;
    } else {
      this.updateValue('priority',false);
      this.isPriority = false;
    }
  }

  isRoundtripEvent() {
    if (this.isRoundTrip !== true) {
      this.updateValue('isRoundTrip',true);
      this.isRoundTrip = true;
    } else {
      this.updateValue('isRoundTrip',false);
      this.isRoundTrip = false;
    }
  }

  getSelectedPorterType(code) {
    this.buildForm();
    if (!this.data || this.data === null || this.data?.id === '0') {
      this.applyTypeConfig(code);
    }
    this.setServiceGroupPreference(null);
    this.fieldAvailablity = null;
    if (!this.data || this.data === null || this.data?.id === '0') {
      this.updateValue("serviceGroupId",null);
      this.updateValue('porterCount',1);
      this.resetLocationsArray();
    }
    this.selectedType = code;
    if (this.porterConfigDetail.defaultPool.hasOwnProperty(this.selectedType)) {
      this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.porterConfigDetail.defaultPool[this.selectedType]);
    } else {
      this.updateValue('poolName',null);
    }
    this.getSelectedType(code, 'req');
    if (this.selectedType === 'PR-SE') {
      const type = this.requestForm.get('serviceGroupId')?.value !== null ? this.requestForm.get('serviceGroupId')?.value : 'SG-AL';
      this.getServiceAssetType('RequestNeed', type);
    } else {
      this.getServiceAssetType('AssetType', this.selectedType)
    }
  }

  resetLocationsArray(): void {
    const locationsFA = this.requestForm.get('locations') as FormArray;
    if (!locationsFA) { return; }
    locationsFA.clear();
    locationsFA.push(this.getLocations());
    locationsFA.updateValueAndValidity();
  }

  getActivity(data) {
    this.pfActivityId = null;
    if(this.porterConfigDetail?.activityCategoryIds?.length > 0 && data?.length > 0) {
      const categoryId = data?.filter(x => this.porterConfigDetail?.activityCategoryIds.includes(x.code));
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
    if (this.selectedType !== 'PR-SE') {
      this.poolFloor = [];
      this.lookupTermService.getAppTermsLinkWrapper(this.selectedType).subscribe((res) => {
        if (res !== null) {
          const activityCategory = res?.ActivityCategory ?? [];
          this.getActivity(activityCategory);
          this.filterAssetType = res?.AssetType ?? [];
          if (this.selectedType === 'PR-PA') {
            this.poolFloor = res?.PoolLocation ?? [];
            if (this.poolFloor.length) {
              this.updateValidator("poolLocationId",[Validators.required]);
            } else {
              this.updateValidator("poolLocationId");
            }
          }
          if (this.selectedType === 'PR-OT') {
            this.departmentList = res?.PoolLocation;
            if (this.departmentList) {
              this.updateValidator("poolLocationId");
              this.updateValue("poolLocationId",null);
            } else {
              this.updateValidator("poolLocationId",[Validators.required]);
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

  getServiceAssetType(code, type) {
    this.lookupTermService.getAppTermsLinkWrapper(type).subscribe((res) => {
      if (res !== null) {
        this.filterAssetType = res[code] ?? [];
      }
    });
  }

  updateLocationDetails(id, name, type) {
    if(type === 'pickup') {
      this.locDataValueAssign({locFromId: id, locSourceOption: id, searchSourceLocList: [...this.locationConfigDetail.searchSourceLocList, { id: id, fullName: name }]});
      if(this.locationConfigDetail.locFromId !== null) {
        this.getCurrentLocationDetails(id, "pickup");
      }
    } else {
      this.locDataValueAssign({locToId: id, locDestinationOption: id, searchDestinationLocList: [...this.locationConfigDetail.searchDestinationLocList, { id: id, fullName: name }]});
      if(this.locationConfigDetail.locToId !== null) {
        this.getCurrentLocationDetails(id, "drop");
      }
    }
  }

  searchFromLocation(event) {
    this.locationConfigDetail.isSourceLoc = false;
    if (event.type === 'pickup' && event.text.length >= 2 && event.keyCode !== 13 && event.keyCode !== 38 && event.keyCode !== 40) {
      this.swap = false;
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe((res) => {
          this.locationConfigDetail.sourceListItem = res.results;
          const bedLocList = res.results?.filter(b => b?.locationTypeId === 20 && this.locationConfigDetail.locDestinationOption !== b?.id);
          if (bedLocList?.length > 0) {
            this.locationConfigDetail.searchSourceBedList = bedLocList;
            this.locationConfigDetail.searchSourceLocList = this.locationConfigDetail.searchSourceBedList;
          } else {
            this.locationConfigDetail.searchSourceBedList = [];
            this.locationConfigDetail.searchSourceNonBedList = [];
            this.locationConfigDetail.searchSourceLocList = this.locationConfigDetail.sourceListItem;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const searchSourceLocList = this.locationConfigDetail.searchSourceLocList;
        this.locationConfigDetail.searchSourceLocList = searchSourceLocList;
      } else {
        this.locationConfigDetail.searchSourceLocList = this.locationConfigDetail.sourceListItem;
      }
    } else if (event.type === 'pickup' && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13)) {
      const searchSourceLocList = this.locationConfigDetail.searchSourceLocList;
      this.locationConfigDetail.searchSourceLocList = searchSourceLocList;
    } else {
      this.locationConfigDetail.searchSourceLocList = [];
      this.locationConfigDetail.searchSourceNonBedList = [];
      this.locationConfigDetail.searchSourceBedList = [];
    }
  }

  searchToLocation(event) {
    this.locationConfigDetail.isDestinationLoc = false;
    if (event.type === 'drop' && event.text.length >= 2 && event.keyCode !== 13 && event.keyCode !== 38 && event.keyCode !== 40) {
      this.swap = false;
      if (event.toHit == true) {
        this.commonService.getLocationSearch(event.text, true).subscribe((res) => {
          this.locationConfigDetail.destListItem = res.results;
          const bedLocList = res.results?.filter(b => b?.locationTypeId === 20 && this.locationConfigDetail.locSourceOption !== b?.id);
          if (bedLocList?.length > 0) {
            this.locationConfigDetail.searchDestinationBedList = bedLocList;
            this.locationConfigDetail.searchDestinationLocList = this.locationConfigDetail.searchDestinationBedList;
          } else {
            this.locationConfigDetail.searchDestinationBedList = [];
            this.locationConfigDetail.searchDestinationNonBedList = [];
            this.locationConfigDetail.searchDestinationLocList = this.locationConfigDetail.destListItem;
          }
        });
      } else if (event.keyCode == 38 || event.keyCode == 40) {
        const searchDestinationLocList = this.locationConfigDetail.searchDestinationLocList;
        this.locationConfigDetail.searchDestinationLocList = searchDestinationLocList;
      } else {
        this.locationConfigDetail.searchDestinationLocList = this.locationConfigDetail.destListItem;
      }
    } else if (event.type === 'drop' && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13)) {
      const searchDestinationLocList = this.locationConfigDetail.searchDestinationLocList;
      this.locationConfigDetail.searchDestinationLocList = searchDestinationLocList;
    } else {
      this.locationConfigDetail.searchDestinationLocList = [];
      this.locationConfigDetail.searchDestinationBedList = [];
      this.locationConfigDetail.searchDestinationNonBedList = [];
    }
  }

  swapLocation() {
    this.swap = true;
    let source = this.requestForm.get('sourceId').value;
    let destination = this.requestForm.get('destinationId').value;
    let sourceId = this.locationConfigDetail.locFromId;
    let destinationId = this.locationConfigDetail.locToId;
    let destLocFullname = this.locationConfigDetail.destLocFullname;
    let destLocName = this.locationConfigDetail.destLocName;
    let sourceLocFullname = this.locationConfigDetail.sourceLocFullname;
    let sourceLocName = this.locationConfigDetail.sourceLocName;
    const sourceList = this.locationConfigDetail.searchSourceLocList?.length > 0 ? [...this.locationConfigDetail.searchSourceLocList] : [{ id: source, fullName: sourceLocFullname }];
    const destinationList = this.locationConfigDetail.searchDestinationLocList?.length > 0 ? [...this.locationConfigDetail.searchDestinationLocList] : [{ id: destination, fullName: destLocFullname }];
    this.locDataValueAssign({locFromId: sourceId, locToId: destinationId, destLocFullname: sourceLocFullname, sourceLocFullname: destLocFullname, 
      destLocName: sourceLocName, sourceLocName: destLocName, searchSourceLocList: destinationList, searchDestinationLocList: sourceList});
    setTimeout(() => {
      this.requestForm.patchValue({ sourceId: destination });
      this.requestForm.patchValue({ destinationId: source });
    });
  }

  clearChild(type) {
    if (type === 'source') {
      this.requestForm.get('sourceId')?.setValue(null)
      this.requestForm.get('fromLocationId').setValue(null);
      this.locDataValueAssign({locFromId: null, sourceBlockId: null, sourceChildList: [], locSourceOption: null});
    } else {
      this.requestForm.get('destinationId')?.setValue(null)
      this.requestForm.get('toLocationId').setValue(null);
      this.locDataValueAssign({locToId: null, destBlockId: null, destinationChildList: [], locDestinationOption: null});
    }
  }

  toggleShowMore(type) {
    if (type === 'pickup') {
      const nonBedLocList = this.locationConfigDetail.sourceListItem?.filter(b => b?.locationTypeId !== 20);
      this.locDataValueAssign({searchSourceNonBedList: nonBedLocList, searchSourceLocList: this.locationConfigDetail.sourceListItem});
    } else {
      const nonBedLocList = this.locationConfigDetail.destListItem?.filter(b => b?.locationTypeId !== 20);
      this.locDataValueAssign({searchDestinationNonBedList: nonBedLocList, searchDestinationLocList: this.locationConfigDetail.destListItem});
    }
  }

  getSearchDetails(data, type) {
    if (type === "pickup") {
      this.locDataValueAssign({locFromId: data.id, locSourceOption: data.id, srcLocationTypeId: data.locationTypeId, srcParentLocationId: data.parentId, 
      searchSourceLocList: [], searchSourceBedList: [], searchSourceNonBedList: [], sourceLocName: data.name, sourceLocFullname: data.fullName});
      if (this.locationConfigDetail.locFromId === null) {
        this.locationConfigDetail.isSourceLoc = false;
        this.updateValue('sourceId',null);
      } else {
        this.locationConfigDetail.isSourceLoc = true;
      }
      if (this.locationConfigDetail.searchDestinationBedList?.length > 0) {
        const sourceBed = this.locationConfigDetail.searchDestinationBedList?.filter(x => x.id !== data.id);
        if (sourceBed?.length === 0) {
          this.locDataValueAssign({searchDestinationBedList: [], searchDestinationNonBedList: []});
        }
      }
      this.checkPriority();
    } else if (type === "drop") {
      this.locDataValueAssign({locToId: data.id,locDestinationOption: data.id,destinationLocationTypeId: data.locationTypeId,destinationParentLocationId: data.parentId,
      searchDestinationLocList: [],searchDestinationBedList: [],searchDestinationNonBedList: [],destLocName: data.name,destLocFullname: data.fullName});
      if (this.locationConfigDetail.locToId === null) {
        this.locationConfigDetail.isDestinationLoc = false;
        this.updateValue('destinationId',null);
      } else {
        this.locationConfigDetail.isDestinationLoc = true;
      }
      if (this.locationConfigDetail.searchSourceBedList?.length > 0) {
        const sourceBed = this.locationConfigDetail.searchSourceBedList?.filter(x => x.id !== data.id);
        if (sourceBed?.length === 0) {
          this.locDataValueAssign({searchSourceBedList: [], searchSourceNonBedList: []});
        }
      }
      this.checkPriority();
    } else if (type === "patient") {
      this.nonPerformerType = type;
      this.reqPatientDetails = data;
      if (this.reqPatientDetails.currentLocationId) {
        this.getCurrentLocationDetails(this.reqPatientDetails.currentLocationId,"pickup");
      }
      this.checkPoolName(data)
      this.patientId = data.id;
    } else if (type === "asset") {
      this.assetType = data.assetTypeId;
      this.nonPerformerType = type;
      this.reqAssetDetails = data;
      if (this.reqAssetDetails.currentLocationId) {
        this.getCurrentLocationDetails(this.reqAssetDetails.currentLocationId,"pickup");
      }
    } else if (type === "source") {
      if (data !== null) {
        this.locDataValueAssign({locFromChildId: data.id, srcChildLocationTypeId: data.locationTypeId, 
          srcChildLocationId: data.parentId,sourceChildLocName: data.name});
      } else {
        this.locDataValueAssign({locFromChildId: null, srcChildLocationTypeId: null, srcChildLocationId: null, sourceChildLocName: null});
      }
    } else if (type === "dest") {
      if (data !== null) {
        this.locDataValueAssign({locToChildId: data.id, destinationChildLocationTypeId: data.locationTypeId,
        destinationChildLocationId: data.parentId, destinationChildLocName: data.name});
      } else {
        this.locDataValueAssign({locToChildId: null, destinationChildLocationTypeId: null,
        destinationChildLocationId: null, destinationChildLocName: null});
      }
    }
  }

  getCurrentLocationDetails(id, fieldName) {
    if (id) {
      this.commonService.getRequestFromLocation(id).subscribe((res) => {
        if (fieldName === "pickup") {
          this.requestForm.patchValue({ sourceId: id});
          this.requestForm.get("sourceId").updateValueAndValidity();
          this.locDataValueAssign({locFromId: id, locSourceOption: id, srcLocationTypeId: res.results.locationTypeId, srcParentLocationId: res.results.parentId,
          searchSourceLocList: [...this.locationConfigDetail.searchSourceLocList, { id: id, fullName: res.results.fullName }]});
        } else {
          this.requestForm.patchValue({ destinationId: id});
          this.requestForm.get("destinationId").updateValueAndValidity();
          this.locDataValueAssign({locToId: id, locDestinationOption: id, destLocationTypeId: res.results.locationTypeId, destParentLocationId: res.results.parentId, 
          searchDestinationLocList: [...this.locationConfigDetail.searchDestinationLocList, { id: id, fullName: res.results.fullName }]});
        }
      });
    }
  }

  checkPoolName(data) {
    let dischargePool = this.porterGroup.filter(val => val.code == 'PN-DIS')
    if (dischargePool.length && data.hasOwnProperty('patientVisitStatus') && data.patientVisitStatus == 'VS-DC') {
      this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, dischargePool[0]['code']);
    }
  }

  getAllLocationById(option, type) {
    if (!this.blockVerified) {
      this.prePoolName = this.requestForm.get('poolName').value;
    }
    if (option.locationTypeId === 2 || option.locationTypeId === 3) {
      this.hospitalService.getLogicalLocationWithChildren(option.id).subscribe(res => {
        if (res.results.hasOwnProperty('children') && res.results.children.length !== 0) {
          if (type === 'source') {
            this.locDataValueAssign({sourceBlockId: option?.blockId, sourceChildPrevList: res.results.children, sourceChildList: res.results.children});
            this.updateValidator("fromLocationId");
            if (this.modifyId == null && this.locationConfigDetail.sourceChildList.length && this.porterConfigDetail.selectFromRoom) {
              this.updateValidator("fromLocationId",[Validators.required]);
            }
          } else {
            this.locDataValueAssign({destBlockId: option?.blockId, destChildPrevList: res.results.children, destinationChildList: res.results.children});
            this.updateValidator("toLocationId");
            if (this.modifyId == null && this.locationConfigDetail.destinationChildList.length && this.porterConfigDetail.selectToRoom) {
              this.updateValidator("toLocationId",[Validators.required]);
            }
          }
          this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.prePoolName);
        } else {
          if (type === 'source') {
            this.locDataValueAssign({sourceBlockId: option?.blockId, sourceChildList: []});
          } else {
            this.locDataValueAssign({destBlockId: option?.blockId, destinationChildList: []});
          }
          this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.prePoolName);
        }
      });
    } else {
      if (type === 'source') {
        this.locDataValueAssign({sourceBlockId: option?.blockId, sourceChildList: []});
      } else {
        this.locDataValueAssign({destBlockId: option?.blockId, destinationChildList: []});
      }
      this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.prePoolName);
    }
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

  searchPatient(event, index?) {
    this.selectedPatient = null;
    if (this['pharaPatientId' + index] == null) {
      const idCtrl = (this.requestForm.get('locations') as FormArray)?.at(index)?.get('id');
      idCtrl?.setErrors({ requireMatch: true });
      idCtrl?.markAsTouched();
    }
    if (this.porterConfigDetail?.patientSearch && event.type === 'patientName' && event.text.length >= 2) {
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

  searchPorter(name?: string,floorId?: string,fromTime?: string,toTime?: string,poolName?: string,gender?: string,poolLocationId?: string) {
    if (floorId != null) {
      this.filterFloorId = floorId;
    }
    if (fromTime != null) {
      this.fromTime = fromTime;
      this.filterFromTime = this._dateFormat.transform(fromTime,"yyyy-MM-dd HH:mm:ss");
    } else {
      this.filterFromTime = this._dateFormat.transform(this.curDate,"yyyy-MM-dd HH:mm:ss");
    }
    if (toTime != null) {
      this.filterToTime = this._dateFormat.transform(toTime,"yyyy-MM-dd HH:mm:ss");
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
      if (this.selectedType === 'PR-OT') {
        this.commonService.validateUserPreference('department', poolLocationId);
      }
    }
    if (!this.autoAssign) {
      this.commonService.searchPorter(name,this.filterFloorId,this.filterFromTime,this.filterToTime,this.poolName,this.gender,this.poolLocationId).subscribe((res) => {
          if (this.data && !this.data.id && this.data.performer.length !== 0) {
            const performer = this.data.performer?.filter( x => x?.status !== 'RQ-AB');
            this.searchPorterList = [...res.results.filter(i => i.id !== this.data.performer[0].id), ...performer];
          } else {
            this.searchPorterList = res.results;
          }
        });
    }
  }

  setServiceGroupPreference(code) {
    if (code !== null) {
      if (this.selectedType === 'PR-SE' && (this.fieldAvailablity === 'PF-TO' || this.fieldAvailablity === null) &&
        this.fieldAvailablity !== 'PF-NO' && !this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value)) {
        this.visibleFields.push('to');
      } else {
        this.visibleFields = this.preVisibleFields.filter(field => field !== 'to');
      }
      if (this.multiLocationGroup?.includes(code)) {
        let checkPharmacy = this.porterConfigDetail?.pharmacyType == 'TAT-PA';
        if (code === 'SG-MS') {
          checkPharmacy = false;
        }
        this.updateLocationValidators('id', checkPharmacy ? [Validators.required] : null);
        this.updateLocationValidators('comments', [Validators.maxLength(30)]);
      } else {
        let arrays = this.requestForm.get('locations') as FormArray;
        const control = arrays.controls;
        control.forEach(data => {
          this.updateLocationValidators('id');
          this.updateLocationValidators('comments');
        });
      }
      this.commonService.validateUserPreference('serviceGroup', code);
    } else {
      this.updateLocationValidators('id');
      this.updateLocationValidators('comments');
    }
  }

  updateLocationValidators(field: string, validators?: any[]): void {
    let arrays = this.requestForm.get('locations') as FormArray;
      const control = arrays.controls;
      control.forEach(data => {
        if (validators) {
          data['controls'][field].setValidators(validators);
        } else {
          data['controls'][field].clearValidators();
        }
      data['controls'][field].updateValueAndValidity();
    });
  }

  getAvailableServices(code) {
    if (this.selectedType === 'PR-SE' || this.data.requestCategory === 'PR-SE') {
      if (code !== null && code !== undefined) {
        if (this.multiLocationGroup?.includes(code)) {
          this.updateValue('assetCategory',null);
          this.updateValue('destinationId',null);
          this.updateValidator("assetCategory",[]);
          if (code == 'SG-PH') {
            this.updateValue('poolLocationId',null);
            this.updateValidator("poolLocationId",[]);
          }
        }
        this.lookupTermService.getAppTermsLinkWrapper(code).subscribe((res) => {
          if (res !== null) {
            this.filterAssetType = res?.RequestNeed ?? [];
          }
          if (this.data && this.data.requestId && this.data.serviceGroupId === code) {
            this.updateValue('assetCategory',this.data.assetCategory);
            this.getFieldAvailablity(this.data.assetCategory);
          } else {
            const defaultService = this.filterAssetType ? this.filterAssetType.filter(res => res.isDefault === true) : [];
            if (this.filterAssetType !== null && defaultService.length !== 0) {
              this.updateValue('assetCategory',defaultService[0].code);
              this.getFieldAvailablity(defaultService[0].code);
            } else if (this.filterAssetType !== null && defaultService.length === 0 &&
              this.filterAssetType.length === 1) {
              this.updateValue('assetCategory',this.filterAssetType[0].code);
              this.getFieldAvailablity(this.filterAssetType[0].code);
            } else {
              this.updateValue('assetCategory',null);
              this.updateValue('poolName',null);
              this.updateValidator("destinationId");
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
      if (this.selectedType !== 'PR-SE') {
        this.lookupTermService.getAppTermsLinkWrapper(this.selectedType).subscribe((res) => {
          if (res !== null) {
            this.filterAssetType = res?.AssetType ?? [];
            if (this.selectedType === 'PR-PA') {
              this.poolFloor = res?.PoolLocation ?? [];
              if (this.poolFloor.length) {
                this.updateValidator("poolLocationId",[Validators.required]);
              } else {
                this.updateValidator("poolLocationId");
              }
            }
            if (this.selectedType === 'PR-OT') {
              this.departmentList = res?.PoolLocation ?? [];
              if (this.departmentList.length === 0) {
                this.updateValidator("poolLocationId");
                this.updateValue("poolLocationId",null);
              } else {
                this.updateValidator("poolLocationId",[Validators.required]);
              }
            }
          }
          if (!this.modifyId) {
            if (this.porterConfigDetail?.defaultPool.hasOwnProperty(this.selectedType)) {
              let otPool = null
              if (!this.modifyId && this.data.hasOwnProperty('visitEventId') && this.porterConfigDetail.hasOwnProperty('OT')) {
                otPool = this.porterConfigDetail['OT']['porterPool']
              }
              const pool = otPool ? otPool : this.porterConfigDetail?.defaultPool[this.selectedType];
              this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, pool);
              this.checkPoolName(this.data)
            } else {
              this.updateValue('poolName',null);
            }
          }
        });
      } else {
        this.filterAssetType = null;
      }
      this.searchPorter();
    }
  }

  setConfigValidator() {
    if (this.mandatoryFieldsObject.hasOwnProperty(this.selectedType)) {
      const field = this.mandatoryFieldsObject[this.selectedType];
      if (this.requestForm.controls[field[0]]) {
        this[field[0] + this.selectedType] = true;
        this.requestForm.get(field[0]).setValidators([Validators.required]);
      } else {
        this[field[0] + this.selectedType] = false;
        this.requestForm.get(field[0]).setValidators(null);
      }
      this.requestForm.get(field[0]).updateValueAndValidity();
    }
  }

  getFieldAvailablity(code) {
    let defaultPool = [];
    this.PorterFieldMandatory = [];
    if (this.porterGroup.length && this.porterConfigDetail?.defaultPool.hasOwnProperty(this.selectedType)) {
      defaultPool = this.porterGroup.filter(val => val.code == this.porterConfigDetail?.defaultPool[this.selectedType])
    }
    this.lookupTermService.getAppTermsLinkWrapper(code).subscribe((res) => {
      if (res) {
        const porterField = res?.PorterField ?? [];
        const pool = res?.PoolName ?? [];
        this.PorterFieldMandatory = res?.PorterFieldMandatory ?? [];
        if (this.PorterFieldMandatory.length !== 0) {
          this.updateValidator("destinationId",[Validators.required]);
        } else {
          this.updateValidator("destinationId");
        }
        this.porterGroup = pool;
        if (defaultPool.length) {
          this.porterGroup.push(defaultPool[0])
        }
        if (porterField.length !== 0) {
          this.fieldAvailablity = porterField[0].code;
          if (this.fieldAvailablity === 'PF-LOC') {
            this.updateValidator("poolLocationId",[Validators.required]);
          } else {
            this.updateValidator("poolLocationId");
          }
        } else {
          this.fieldAvailablity = null;
          this.updateValidator("poolLocationId",[Validators.required]);
        }
        if (pool.length !== 0) {
          this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, pool[0].code);
          this.searchPorter();
        } else if (defaultPool.length) {
          this.porterGroup = [];
          this.porterGroup.push(defaultPool[0])
        } else {
          this.updateValue('poolName',null);
        }
        if (this.porterGroup.length) {
          this.setConfigPoolName(this.locationConfigDetail.sourceBlockId, this.locationConfigDetail.destBlockId, this.porterGroup[0]['code']);
        }
      } else {
        this.updateValidator("destinationId");
        this.updateValue('poolName',null);
        this.fieldAvailablity = null;
        this.updateValidator("poolLocationId",[Validators.required]);
      }
      if (this.multiLocationGroup?.includes(this.requestForm.controls.serviceGroupId.value)) {
        this.updateValidator("poolLocationId");
      }
    });
  }

  dateTimeValidation(value, key) {
    const status = this.requestForm.controls['status'].value;
    if (value !== null && key === 'pickup' && status !== 'RQ-CA' && status !== 'RQ-CO') {
      const fromTime = this._dateFormat.transform(value, 'yyyy-MM-ddTHH:mm');
      if (fromTime < this.curDate) {
        this.pastPickupTime = true;
      } else {
        this.pastPickupTime = false;
      }
    } else if (value !== null && key === 'drop' && status !== 'RQ-CA' && status !== 'RQ-CO') {
      const fromTime = this._dateFormat.transform(value, 'yyyy-MM-ddTHH:mm');
      if (fromTime < this.curDate) {
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
    this.updateValue('endTime',this._dateFormat.transform(new Date(this.currentDate.getTime() + (defaultInterval * 60 * 1000)), 'yyyy-MM-ddTHH:mm'));
  }
  
  pharmacyTask() {
    let data = {};
    if (this.modifyId) {
      data['reqId'] = this.modifyId;
    }
    data['type'] = this.porterConfigDetail?.pharmacyType;
    this.dialog.open(PharmacyTaskComponent, {
      panelClass: ['small-popup'], disableClose: true, data: data
    });
  }

  restrictRequest(event) {
    let message = event.message + ' Do you want to close the dialog?';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Warning', message: message, userRequestLimit: true, customMsg: true, buttonText: { cancel: 'No', ok: 'Yes' }, isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.thisDialogRef.close();
      }
    });
  }

  setPorterCount(value, countClicked) {
    if(value !== null && !countClicked) {
      this.porterConfigDetail.assetCount
      if(this.porterConfigDetail.assetCount.hasOwnProperty(value)) {
        this.updateValue('porterCount',this.porterConfigDetail.assetCount[value]);
      } else {
        this.updateValue('porterCount',1);
      }
    }
  }

  checkAvailablePorter(action) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation',
        message: 'Do you want to create a request in waitinglist?, A porter will be assigned as soon as they are available',
        buttonText: { cancel: 'No', ok: 'Yes' }, checkAvailablePorter: true, isRemark: 1,
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

  confirmSourceLocation() {
    const source = this.locationConfigDetail.sourceLocFullname !== null ? this.locationConfigDetail.sourceLocFullname : this.requestForm.controls["sourceId"]?.value;
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'],
      disableClose: true,
      data: {
        title: 'Confirmation', customMsg: true,
        message: 'Do you want to continue with the source location ' + source + ' ?',
        buttonText: { cancel: 'No', ok: 'Yes' }, checkAvailablePorter: true, isRemark: 1,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        this.SaveRequest()
      }
    });
  }

  public SaveRequest() {
    this.locDataValueAssign({sourceParentLocation: null, sourceLocation: null, destParentLocation: null, destLocation: null, childList: []});
    const validatePickupTime = this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-ddTHH:mm');
    this.curDate = this._dateFormat.transform(new Date(), 'yyyy-MM-ddTHH:mm');
    if (validatePickupTime < this.curDate) {
      this.updateValue('startTime',this.curDate);
      this.dateTimeValidation(this.curDate, 'pickup');
    }
    this.isSaved = true;
    const createRequest = new CreateRequest(null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
      createRequest.pfActivityId = this.pfActivityId;
    createRequest.requestCategory = this.requestForm.controls["requestCategory"].value;
    createRequest.isautoAssigned = this.autoAssign;
    if (this.requestForm.controls["comments"].value !== null) {
      createRequest.comments = this.requestForm.controls["comments"].value.trim();
    } else {
      createRequest.comments = this.requestForm.controls["comments"].value;
    }
    createRequest.poolName = this.requestForm.controls["poolName"].value;
    createRequest.gender = this.requestForm.controls["gender"].value;
    if (this.locationConfigDetail.locFromChildId !== null && this.requestForm.get('fromLocationId').value !== null) {
      createRequest.sourceId = this.locationConfigDetail.locFromChildId;
      createRequest.srcLocationTypeId = this.locationConfigDetail.srcChildLocationTypeId;
      createRequest.srcParentLocationId = this.locationConfigDetail.srcChildLocationId;
      this.locationConfigDetail.sourceParentLocation = {
        'fullName': this.locationConfigDetail.sourceLocFullname,
        'id': this.locationConfigDetail.locFromId,
        'locationTypeId': this.locationConfigDetail.srcLocationTypeId,
        'name': this.locationConfigDetail.sourceLocName,
        'parentId': this.locationConfigDetail.srcParentLocationId,
        'blockId': this.locationConfigDetail.sourceBlockId
      }
      this.locationConfigDetail.childList.push(this.locationConfigDetail.sourceParentLocation);
      this.locationConfigDetail.sourceLocation = {
        'location': this.locationConfigDetail.sourceParentLocation,
        'id': this.locationConfigDetail.locFromChildId,
        'locationTypeId': this.locationConfigDetail.srcChildLocationTypeId,
        'name': this.locationConfigDetail.sourceChildLocName,
        'parentId': this.locationConfigDetail.srcChildLocationId,
        'list': this.locationConfigDetail.sourceChildPrevList
      }
    } else {
      createRequest.sourceId = this.locationConfigDetail.locFromId;
      createRequest.srcLocationTypeId = this.locationConfigDetail.srcLocationTypeId;
      createRequest.srcParentLocationId = this.locationConfigDetail.srcParentLocationId;
    }
    if (((this.fieldAvailablity === 'PF-TO' || this.fieldAvailablity === null) &&
      this.fieldAvailablity !== 'PF-NO' && !this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value))) {
      if (this.locationConfigDetail.locToChildId !== null && this.requestForm.get('toLocationId').value !== null) {
        createRequest.destinationId = this.locationConfigDetail.locToChildId;
        createRequest.destLocationTypeId = this.locationConfigDetail.destinationChildLocationTypeId;
        createRequest.destParentLocationId = this.locationConfigDetail.destinationChildLocationId;
        this.locationConfigDetail.destParentLocation = {
          'fullName': this.locationConfigDetail.destLocFullname,
          'id': this.locationConfigDetail.locToId,
          'locationTypeId': this.locationConfigDetail.destLocationTypeId,
          'name': this.locationConfigDetail.destLocName,
          'parentId': this.locationConfigDetail.destParentLocationId,
          'blockId': this.locationConfigDetail.destBlockId
        }
        this.locationConfigDetail.childList.push(this.locationConfigDetail.destParentLocation);
        this.locationConfigDetail.destLocation = {
          'location': this.locationConfigDetail.destParentLocation,
          'id': this.locationConfigDetail.locToChildId,
          'locationTypeId': this.locationConfigDetail.destinationChildLocationTypeId,
          'name': this.locationConfigDetail.destinationChildLocName,
          'parentId': this.locationConfigDetail.destinationChildLocationId,
          'list': this.locationConfigDetail.destChildPrevList
        }
      } else {
        createRequest.destinationId = this.locationConfigDetail.locToId;
        createRequest.destLocationTypeId = this.locationConfigDetail.destLocationTypeId;
        createRequest.destParentLocationId = this.locationConfigDetail.destParentLocationId;
      }
    }
    createRequest.startTime = this._dateFormat.transform(this.requestForm.controls["startTime"].value,"yyyy-MM-dd HH:mm:ss");
    const start = new Date(this.requestForm.controls["startTime"].value);
    this.dropDate = this._dateFormat.transform(new Date(start.getTime() + (15 * 60 * 1000)), 'yyyy-MM-ddTHH:mm');
    if (this.requestForm.get('endTime')?.dirty) {
      createRequest.endTime = this._dateFormat.transform(this.requestForm.controls["endTime"].value, "yyyy-MM-dd HH:mm:ss");
    } else {
      createRequest.endTime = this._dateFormat.transform(this.dropDate, "yyyy-MM-dd HH:mm:ss");
    }
    createRequest.porterCount = this.requestForm.controls["porterCount"].value;
    createRequest.lastModifiedOn = this.requestForm.controls["lastModifiedOn"].value;
    if (this.requestForm.controls["assetCategory"].value === 'All') {
      createRequest.assetCategory = this.assetType;
    } else {
      createRequest.assetCategory = this.requestForm.controls["assetCategory"].value;
    }
    createRequest.assetCount = createRequest.assetCategory ? 1 : 0;
    createRequest.type = "RQT-PO";
    if (this.porterConfigDetail?.typesOfPatientName.includes(createRequest.requestCategory) && this.reqPatientDetails != null) {
      this.nonPerformerInfo = [];
      if (this.reqPatientDetails.hasOwnProperty('infantInfo') && this.reqPatientDetails.infantInfo.motherId) {
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
    } else if (this.porterConfigDetail?.typesOfPatientName.includes(createRequest.requestCategory) && !this.porterConfigDetail?.patientSearch && this.requestForm.controls["patientId"].value) {
      this.nonPerformerInfo = [{
        id: null,
        locationId: null,
        type: 'TAT-PA',
        name: this.requestForm.controls["patientId"].value
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
      for (let i = 0; i < this.reqPorterDetails.length; i++) {
        if (this.reqPorterDetails[i].id !== null) {
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
    if (this.requestForm.controls["requestCategory"].value !== "PR-OT" || this.porterConfigDetail?.typesOfPatientName.includes('PR-OT')) {
      createRequest.nonPerformer = this.nonPerformerInfo;
    } else {
      createRequest.isTracable = false;
    }
    createRequest.remarks = this.requestForm.controls["remarks"].value;
    if (this.isRoundTrip && this.porterConfigDetail && this.porterConfigDetail.hasOwnProperty('roundtripText')) {
      if (createRequest.remarks) {
        createRequest.remarks = this.porterConfigDetail['roundtripText'] + createRequest.remarks;
      } else {
        createRequest.remarks = this.porterConfigDetail['roundtripText'];
      }
    }
    if (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
      this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm') &&
      (this.requestForm.controls['status'].value !== 'RQ-PLN' ||
        (this.requestForm.controls['status'].value == 'RQ-PLN' && this.porterConfigDetail?.allowScheduledStatus))) {
      createRequest.status = 'RQ-SH';
    } else if (this.requestForm.controls['status'].value === 'RQ-RCR' ||
      this.requestForm.controls['status'].value === 'RQ-RTN') {
      createRequest.status = 'RQ-CR';
    } else {
      createRequest.status = this.requestForm.controls['status'].value;
    }

    if (this.porterStatusCheck) {
      if (this._dateFormat.transform(this.requestForm.controls['startTime'].value, 'yyyy-MM-dd HH:mm') >
        this._dateFormat.transform(this.scheduleDate.getTime() + (10 * 60 * 1000), 'yyyy-MM-dd HH:mm')) {
        createRequest.status = 'RQ-SH';
      } else {
        createRequest.status = 'RQ-WT';
      }
    }
    if (this.porterConfigDetail?.cannotAutoComplete.length > 0 &&
      this.porterConfigDetail?.cannotAutoComplete.includes(this.requestForm.controls["assetCategory"].value)) {
      createRequest.isAutoComplete = this.isAutoComplete;
    }
    createRequest.priority = this.isPriority;
    createRequest.isRoundTrip = this.isRoundTrip;
    createRequest.serviceGroupId = this.requestForm.controls["serviceGroupId"].value;
    createRequest.poolLocationId = this.requestForm.controls["poolLocationId"].value;
    if (this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value)) {
      createRequest['nonPerformer'] = this.requestForm.controls["locations"].value;
      createRequest['isMultiLoaction'] = true;
    }
    if (createRequest['requestCategory'] === 'PR-PA' && createRequest['comments'] == null) {
      createRequest['comments'] = 'Patient Transfer'
    }
    if (this.data.hasOwnProperty('visitEventId')) {
      createRequest['nonPerformer'][0]['patientVisitId'] = this.data.visitId;
      createRequest['srcIdentifyingType'] = 'patient_visit_event';
      createRequest['srcIdentifyingId'] = this.data.visitEventId;
    }
    this.commonService.savePorterRequest(createRequest).subscribe(
      (res) => {
        if (res.statusCode === 1) {
          if (this.thisDialogRef) {
            this.thisDialogRef.close(res.results);
            this.getPorterAdditionalExpanded(this.isPorterAdditionalExpanded);
          }
          this.requestForm.reset();
          this.porterNameCount = 0;
          this.porterCount = 1;
          if (this.locationConfigDetail.sourceLocation) {
            sessionStorage.setItem('porter_source_child_loc_', JSON.stringify(this.locationConfigDetail.sourceLocation));
          } else {
            sessionStorage.setItem('porter_source_child_loc_', null);
          }
          if (this.locationConfigDetail.destLocation) {
            sessionStorage.setItem('porter_dest_child_loc_', JSON.stringify(this.locationConfigDetail.destLocation));
          } else {
            sessionStorage.setItem('porter_dest_child_loc_', null);
          }
          if (this.locationConfigDetail.childList.length !== 0) {
            this.cookieService.set('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),JSON.stringify(this.locationConfigDetail.childList));
          }
          if (this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== null &&
            this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) !== '') {
            this.storage = JSON.parse(this.cookieService.get('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
          } else {
            this.storage = [];
          }
          const response = res.results;
          if (this.ServiceLocList.length) {
            this.cookieService.set(
              'porter_service_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
              JSON.stringify(this.ServiceLocList));
          }
          if (this.locationConfigDetail.sourceLocName && (this.locationConfigDetail.locFromChildId === null || this.requestForm.get('fromLocationId').value === null)) {
            this.commonService.getLocationSearch(this.locationConfigDetail.sourceLocName).subscribe((result) => {
              const data = result.results.filter(res => res.id === response.sourceId);
              if (data.length !== 0) {
                this.location = {
                  'fullName': data[0].fullName,
                  'id': data[0].id,
                  'locationTypeId': data[0].locationTypeId,
                  'name': data[0].name,
                  'parentId': data[0].parentId,
                  'blockId': data[0].blockId
                }
                this.cookieService.set('porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),JSON.stringify(this.location));
                if (this.storage.length !== 0) {
                  this.searchLoc = this.storage.filter(res => res.id === response.sourceId);
                }
                if (this.searchLoc.length === 0) {
                  if (this.storage.length !== 0 && this.storage.length >= 10) {
                    const add = this.storage.splice(0, 1);
                  }
                  this.storage.push(this.location);
                  this.cookieService.set('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),JSON.stringify(this.storage));
                }
              }
            });
          }
          if (this.locationConfigDetail.destLocName && (this.locationConfigDetail.locToChildId === null || this.requestForm.get('toLocationId').value === null)) {
            this.commonService.getLocationSearch(this.locationConfigDetail.destLocName).subscribe((result) => {
              const data = result.results.filter(res => res.id === response.destinationId);
              if (data.length !== 0) {
                this.location = {
                  'fullName': data[0].fullName,
                  'id': data[0].id,
                  'locationTypeId': data[0].locationTypeId,
                  'name': data[0].name,
                  'parentId': data[0].parentId,
                  'blockId': data[0].blockId
                }
                if (this.storage.length !== 0) {
                  this.searchLoc = this.storage.filter(res => res.id === response.destinationId);
                }
                if (this.searchLoc.length === 0) {
                  this.storage.push(this.location);
                  this.cookieService.set('porter_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')), JSON.stringify(this.storage));
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
    if (data.performer.length > 0) {
      this.requestStatusDetail = {
        "requestDetailId": data.performer[0].requestDetailId, "status": status,
        "performerId": data.performer[0].id, "performerType": data.performer[0].tagAssociationTypeId,
        "lastModifiedOn": this.requestForm.controls["lastModifiedOn"].value
      }
    }
    this.commonService.updatePorterRequestStatus(this.requestStatusDetail, data.requestId).subscribe(
      (res) => {
        this.isSaved = false;
        if (res.statusCode === 1) {
          if (this.thisDialogRef) {
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
    const editRequest = new EditRequest(null, null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    editRequest.requestCategory = this.requestForm.controls["requestCategory"].value;
    editRequest.isautoAssigned = this.autoAssign;
    if (this.requestForm.controls["comments"].value !== null) {
      editRequest.comments = this.requestForm.controls["comments"].value.trim();
    } else {
      editRequest.comments = this.requestForm.controls["comments"].value;
    }
    editRequest.poolName = this.requestForm.controls["poolName"].value;
    editRequest.gender = this.requestForm.controls["gender"].value;
    editRequest.sourceId = this.locationConfigDetail.locFromId;
    editRequest.srcLocationTypeId = this.locationConfigDetail.srcLocationTypeId;
    editRequest.srcParentLocationId = this.locationConfigDetail.srcParentLocationId;
    if (((this.fieldAvailablity === 'PF-TO' || this.fieldAvailablity === null) &&
      this.fieldAvailablity !== 'PF-NO' && (this.requestForm.controls['serviceGroupId'].value == null || this.multiLocationGroup?.includes(this.requestForm.controls['serviceGroupId'].value)))) {
      editRequest.destinationId = this.locationConfigDetail.locToId;
      editRequest.destLocationTypeId = this.locationConfigDetail.destLocationTypeId;
      editRequest.destParentLocationId = this.locationConfigDetail.destParentLocationId;
    }
    editRequest.startTime = this._dateFormat.transform(this.requestForm.controls["startTime"].value,"yyyy-MM-dd HH:mm:ss");
    editRequest.endTime = this._dateFormat.transform(this.requestForm.controls["endTime"].value,"yyyy-MM-dd HH:mm:ss");
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
      for (let i = 0; i < this.reqPorterDetails.length; i++) {
        if (this.reqPorterDetails[i].id !== null) {
          if (this.reqPorterDetails[i].isDeletable === true) {
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
    if (this.requestForm.controls["remarks"].value !== null) {
      const remarks = this.requestForm.controls["remarks"].value.trim();
      if (this.remarks !== null) {
        editRequest.remarks = remarks + ', ' + this.remarks;
      } else {
        editRequest.remarks = remarks;
      }
    } else {
      if (this.remarks !== null) {
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
    if (this.porterConfigDetail?.cannotAutoComplete.length > 0 &&
      this.porterConfigDetail?.cannotAutoComplete.includes(this.requestForm.controls["assetCategory"].value)) {
      editRequest.isAutoComplete = this.isAutoComplete;
    }
    if (this.requestForm.controls["cancelReasonId"].value === 'RCR-ARCWLS') {
      if (this.userId) {
        editRequest.performer = [
          {
            "id": this.userId,
            "type": "TAT-PO"
          }
        ]
      }
    }
    if (this.requestForm.controls["cancelReasonId"].value) {
      if (!this.userId) {
        editRequest.performer = [];
      }
    }
    editRequest.cancelReasonId = this.requestForm.controls["cancelReasonId"].value;
    editRequest.priority = this.requestForm.controls["priority"].value;
    editRequest.isRoundTrip = this.requestForm.controls["isRoundTrip"].value;
    editRequest.serviceGroupId = this.requestForm.controls["serviceGroupId"].value;
    editRequest.poolLocationId = this.requestForm.controls["poolLocationId"].value;
    if (this.data.sourceBedId) {
      editRequest.srcLocationTypeId = '20';
    }
    if (this.data.destinationBedId) {
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

  fixClick() {
    console.log('');
  }
}