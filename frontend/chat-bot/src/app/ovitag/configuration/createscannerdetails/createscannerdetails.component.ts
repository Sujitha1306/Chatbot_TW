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

import { Component, OnInit } from '@angular/core';
import { CommonService, ConfigurationService, HospitalService } from '../../../shared';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PWATaskdetailsComponent } from '../pwa-taskdetails/pwa-taskdetails.component';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { PorterRequestNewComponent } from '../../../shared/modules/entry-component/porter-request/porter-request.component';
import { CookieService } from 'ngx-cookie-service';
import { DatePipe } from '@angular/common';
// import { EntityTicketComponent } from '../../../shared/modules/entry-component/entity-ticket/entity-ticket.component';
import { environment } from '../../../../environments/environment';
import { ManagePwaTaskComponent } from '../../../shared/modules/entry-component/pwa/manage-pwa-task/manage-pwa-task.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ManagePwaMaintenanceComponent } from '../../../shared/modules/entry-component/pwa/manage-pwa-maintenance/manage-pwa-maintenance.component';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-createscannerdetails',
  templateUrl: './createscannerdetails.component.html',
  styleUrls: ['./createscannerdetails.component.scss']
})
export class CreatescannerdetailsComponent implements OnInit {

 formTemplateList: any;
 taskList: any;
 public scannerEnabled: boolean = true;
 public information: any;
 public taskManageForm: FormGroup;
 public locId : any;
 public paramLocId : any;
 public assetId : any;
 dataGenerate: any;
 getAssetData : any;
 locData: any;
 dataStatus: any;
 formData: any;
 porterData: any;
 public locDetail = null;
 public assetDetail = null;
 public serviceGroup: any = [];
 public GDAGroup: any = [];
 public porterReq : any;
 gdaData: any;
 patientdata: any;
 closeexpande =false;
 public porterReqData=[];
 public porterReqData1=[];
 public patientId = null;
 public selectedPatient: any = null;
 public patientListItems: any = [];
 public searchPatientlist: any = [];
 public nonPerformerType: any;
 public reqPatientDetails: any;
 public taskLocationId: null;
 public taskLocationEnabled: boolean;
 public toHit: any = false;
 poolLocation: any = [];
 public taskLocationListRes: any;
 public taskLocationList: any;
 gdaExpanded = false;
 public selectedType: any = "PR-OT";
 filterAssetType: any;
 patientDetails = null;
 lastReqId = null;
 guestUser = false;
 guestInfo = null;
 isFloor = false;
 floorChildLoc = [];
 selectedFontSize = 16;
 qrData = null;
 colorDark = "#000000";
 selectedMargins = 4;
 visitParentInfo = null;
 entityType = null;
 maxVisitorLimit: number = 3;
 defaultValue : number = 1;
 visitorDetail = null;
 DEMO_USER_ID = 6639;
 PROD_USER_ID = 14489;
 DEMO_DEST_ID = 22496;
 PROD_DEST_ID = 1387;
 DEMO_PARENT_LOC_ID = 19705;
 PROD_PARENT_LOC_ID = 1366;
 configData = {
    gdaExpandedData: false,
    enableGda: false,
    enableTicket : false,
    porterDestinationId : null,
    userId : null
  };
 
  constructor(public commonService: CommonService,public fb: FormBuilder, public router: Router, public activeRoute : ActivatedRoute,
    public configurationService:ConfigurationService,public dialog: MatDialog, public hospitalService : HospitalService,
    private readonly cookieService: CookieService,public toastr: AppToastService, public datePipe: DatePipe,private readonly bottomSheet: MatBottomSheet,
  ) {
    this.getDynamicData();
   }

  ngOnInit(): void {
    this.patientId=localStorage.getItem(btoa('patientId'));
    if(!this.patientId && localStorage.hasOwnProperty(btoa('guestInfo'))) {
      let guestInfo = JSON.parse(localStorage.getItem(btoa('guestInfo')))
      if(guestInfo.hasOwnProperty('visitor')) {
        this.checkVisitorInfo(guestInfo.visitor)
      } else {
        this.locId = localStorage.getItem('locationId');
        this.dataGenerate = JSON.parse(localStorage.getItem(btoa('guestInfo')))['locationName'];
        this.getAllLocation()
        this.lastReqId = this.cookieService.get('lastReqId')
        this.buildForm();
        this.guestUser = true;
        this.locDetail = {
            id : this.locId,
            locationTypeId : '17',
            parentId : JSON.parse(localStorage.getItem(btoa('guestInfo')))['floorId']
        }
        this.getPatientByLocation()
        this.getAppteams();
        this.commonService.getAppTermsLink('SG-HK').subscribe((res) => {
          this.GDAGroup = res.results.filter(resFilter => resFilter.groupName === 'RequestNeed');
        })      
      }
    } else {
      this.getAllLocation();
      this.buildForm();
      if (this.patientId) {
        this.getPorterRequestDet()
      } else {
        this.getAppteams();
        this.commonService.getAppTermsLink('SG-HK').subscribe((res) => {
          this.GDAGroup = res.results.filter(resFilter => resFilter.groupName === 'RequestNeed');
        })
      }
      this.commonService.getAppTermsLink(this.selectedType).subscribe((res) => {
        this.filterAssetType = res.results.filter(item => item.code === 'AT-WH' || item.code === 'AT-S/B' || item.code === 'AT-OTT');
      });
    }
  }
  getPatientByLocation() {
    this.commonService.getPatientByLocation(this.locId).subscribe(res => {
      if(res.statusCode == 1) {
        this.patientDetails = res.results;        
        console.log(this.patientDetails)
      }
    });
  }
  updateVisitorStatus(event) {
    if(event == 'update') {
      let guestInfo = JSON.parse(localStorage.getItem(btoa('guestInfo')))
      if(guestInfo.hasOwnProperty('visitor')) {
        this.checkVisitorInfo(guestInfo.visitor)
      }
    }
  }
  checkVisitorInfo(visitInfo) {
    this.visitParentInfo = null;
    this.visitorDetail = null;
    this.entityType = 'Visitor';
    this.visitorDetail = visitInfo;
    this.commonService.getVisitorById(this.visitorDetail.id).subscribe(res => { 
      this.visitorDetail = null;
      this.visitorDetail = res.results;
      this.qrData = JSON.stringify({"qrtype":"visitor","id":this.visitorDetail.id,"name":this.visitorDetail.fullName, "status":this.visitorDetail.visitorStatusName,"visitorStatusId":this.visitorDetail.visitorStatusId, "visitorEventStatusId" : this.visitorDetail.visitorEventStatusId})    
      if(visitInfo.identifyingType == "ENT-PA") {
        this.visitParentInfo = {
          'firstName' : visitInfo.entityName,
          'lastName' : '',
          'mainidentifier' : null,
          'gender' : null
        }
        let param = 'isLastVisit=true'
        this.commonService.getPatientInfoById(visitInfo.identifyingId, param).subscribe(res => {
          if(res.statusCode == 1) {
            this.visitParentInfo = res.results;
          }
        })
      }
    })
  }
  visitorUpdate(status) {
    let payload = {
      id : this.visitorDetail.id,
      visitorStatusId : status
    }
    this.commonService.updateRegisterVisitor(payload).subscribe(res => {
      this.visitorDetail['visitorStatusId'] = status;
    })
  }

  getDynamicData() {
    this.commonService.getConfigFile('pwa-config').subscribe(res => {
      if (res.statusCode === 1) {
        this.configData.gdaExpandedData = res.results?.contentObject?.gdaExpanded;
        this.configData.enableGda = res.results?.contentObject?.enableGda;
        this.configData.enableTicket = res.results?.contentObject?.enableTicket;
        this.configData.porterDestinationId = res.results?.contentObject?.porterDestinationId;
        this.configData.userId = res.results?.contentObject?.userId;
      }
    });
  }

  onChangesData(items: any) {
    if (items.expanded) {
      items.expanded = false;
      this.taskManageForm?.controls.remarksgda.reset();
    } else {
      this.GDAGroup.forEach(item => item.expanded = false);
      items.expanded = true;
    }
  }

  gdaClose(event?: any) {
    if (event?.hasOwnProperty('expanded') && event?.expanded) {
      event.expanded = false;
      this.taskManageForm?.controls.remarksgda.reset();
    }
  }
 
  createPorterReq(event?, type?) {
    let today = new Date();
    let poolNameDetail = [];
    if(event) {
      this.commonService.getAppTermsLink(event.code).subscribe((res) => {
        if(res.statusCode ==1) {
          poolNameDetail = res.results.filter(val => val.groupName == 'PoolName');
        }
      });
    }
    setTimeout(() => {
    let currentTime = this.datePipe.transform(today, 'yyyy-MM-dd HH:mm:ss');
    today.setMinutes(today.getMinutes() + 15);
    let endTime = this.datePipe.transform(today, 'yyyy-MM-dd HH:mm:ss');
    let porterCount = this.taskManageForm.controls['visitorCount'].value;
    let descriptionInfo = this.taskManageForm.controls['description'].value;

    if (typeof descriptionInfo === 'string' && descriptionInfo.trim() === '') {
      this.taskManageForm.controls['description'].setValue(null);
      descriptionInfo = null;
    }

    let data = this.buildBaseData(currentTime, endTime, porterCount, type, event);


    if (data["poolName"] == 'PN-OPD' && environment.env_key == 'twlive' && localStorage.getItem(btoa('facilityId')) == '0184') {
      data["poolName"] = 'PN-IN';
    }
    if(type == 'GDA' && poolNameDetail.length) {
      data['poolName'] = poolNameDetail[0]['code']
    }

    this.handleGuestUser(data);
    this.handlePatientDetails(data, descriptionInfo);
    this.handleNonPerformer(data, event, type);

    let guestUser = localStorage.hasOwnProperty(btoa('guestInfo'));
    if (event?.hasOwnProperty('expanded') && event?.expanded && this.configData?.gdaExpandedData) {
      event.expanded = false;
      this.taskManageForm?.controls.remarksgda.reset();
    }
    this.commonService.savePwaRequest(data, guestUser).subscribe((res) => {
      this.handleSuccessResponse(res, type);
    }, error => {
      this.handleErrorResponse(error);
    });
    }, 1000);
  }

  private buildBaseData(currentTime: string, endTime: string, porterCount: number, type: string, event: any) {
    const isGDA = type === 'GDA';
    const isPatient = type === 'Patient';
    const isDemo = environment.env_key === 'demo';
    const facilityId = localStorage.getItem(btoa('facilityId'));
    const isTwlive = environment.env_key === 'twlive';

    const data: any = {
      type: 'RQT-PO',
      isTracable: null,
      isautoAssigned: true,
      porterCount,
      remarks: this.patientId ? `${localStorage.getItem(btoa('current_user'))} (${localStorage.getItem(btoa('mobileNo'))})` : this.configData?.gdaExpandedData && this.taskManageForm?.controls.remarksgda.value ? 
      this.taskManageForm?.controls.remarksgda.value : this.taskManageForm?.controls.remarks.value ? this.taskManageForm?.controls.remarks.value : null,
      status: 'RQ-WT',
      gender: null,
      isAutoComplete: null,
      priority: false,
      isRoundTrip: false,
      performer: null,
      startTime: currentTime,
      endTime: endTime,
      sourceId: this.locDetail.id,
      srcLocationTypeId: this.locDetail.locationTypeId,
      srcParentLocationId: this.locDetail.parentId,
      lastModifiedOn: null,
      assetCount: 1,
      serviceGroupId: isGDA ? 'SG-HK' : null,
      poolLocationId: isGDA && this.poolLocation.length ? this.poolLocation[0]['code'] : null,
    };

    // assetCategory
    if (isGDA) {
      data.assetCategory = event.code;
    } else if (this.patientId) {
      data.assetCategory = this.taskManageForm.controls['assetLoction'].value;
    } else {
      data.assetCategory = 'AT-WH';
    }

    // comments
    data.comments = isGDA ? 'Services' : 'Patient Transfer';

    // requestCategory
    if (isGDA) {
      data.requestCategory = 'PR-SE';
    } else if (this.patientId || isPatient) {
      data.requestCategory = 'PR-PA';
    } else {
      data.requestCategory = 'PR-OT';
    }

    // destinationId
    if (!isGDA) {
      if (isPatient) {
        data.destinationId = event.destinationId;
      } else {
        data.destinationId = this.configData.porterDestinationId ? this.configData.porterDestinationId : isDemo ? this.DEMO_DEST_ID : this.PROD_DEST_ID;
      }
    } else {
      data.destinationId = null;
    }

    // destLocationTypeId
    data.destLocationTypeId = isGDA ? null : isPatient ? event.destLocationTypeId : 17;

    // destParentLocationId
    if (!isGDA) {
      if (isPatient) {
        data.destParentLocationId = event.destParentLocationId;
      } else {
        data.destParentLocationId = isDemo ? this.DEMO_PARENT_LOC_ID : this.PROD_PARENT_LOC_ID;
      }
    } else {
      data.destParentLocationId = null;
    }

    // poolName
    if (isGDA) {
      data.poolName = 'PN-HK';
    } else if (this.patientId) {
      data.poolName = isTwlive && facilityId === '0206' ? 'PN-ENT' : 'PN-OPD';
    } else {
      data.poolName = this.patientdata.length && this.patientdata[0]['code'] == 'PR-OT' ? 'PN-OPD': 'PN-IN';
    }

    // Override poolName if specific condition is met
    if (data.poolName === 'PN-OPD' && isTwlive && facilityId === '0184') {
      data.poolName = 'PN-IN';
    }

    // srcIdentifyingId / Type
    if (isGDA || isPatient) {
      data.srcIdentifyingId = null;
      data.srcIdentifyingType = null;
    } else {
      data.srcIdentifyingId = this.patientId;
      data.srcIdentifyingType = 'mobile_users';
    }

    return data;
  }

  private handleGuestUser(data: any) {
    if (this.guestUser) {
      data["srcIdentifyingId"] = JSON.parse(localStorage.getItem(btoa('guestInfo')))['uid'];
      data["srcIdentifyingType"] = "mobile_users";
      data["remarks"] = this.configData?.gdaExpandedData && this.taskManageForm?.controls.remarksgda.value ? 
        this.taskManageForm?.controls.remarksgda.value : this.taskManageForm?.controls.remarks.value;
    }
  }

  private handlePatientDetails(data: any, descriptionInfo: string) {
    if (this.patientId) {
      data["userId"] = this.configData.userId ? this.configData.userId : environment.env_key == 'demo' ? 6639 : 14489;
      data["comments"] = descriptionInfo ? descriptionInfo : data["comments"];
    }

    if (this.patientDetails) {
      data["nonPerformer"] = [{
        id: this.patientDetails.id,
        locationId: null,
        type: 'TAT-PA'
      }];
    }
  }

  private handleNonPerformer(data: any, event: any, type: string) {
    if (type == 'Patient' && event.hasOwnProperty('nonPerformer')) {
      data['nonPerformer'] = event.nonPerformer;
    }
  }

  private handleSuccessResponse(res: any, type: string) {
    if (res.statusCode == 1) {
      this.lastReqId = res.results.requestId;
      this.cookieService.set('lastReqId', this.lastReqId);
      this.taskManageForm.controls.remarks.reset();
      this.toastr.success("Success", `${res.message}`);

      if (type == 'GDA') {
        this.gdaExpanded = !this.gdaExpanded;
      }

      if (!this.guestUser) {
        this.getPorterRequestDet();
      }
    }
  }

  private handleErrorResponse(error: any) {
    if (error.error.errorCode == 'TW-PORTER-MAX-REQUEST-EXCEPTION') {
      this.toastr.clear();
      let message = error.error.message;
      this.toastr.warning("Warning", message);
    }
  }
  
  getPorterRequestDet(){
    let currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.commonService.getPorterRequestPwa('RQT-PO',this.patientId,'mobile_users', currentDate).subscribe((res)=>{
      if(res.statusCode == 1){
        this.porterReqData = res['results'];
        for(let i in this.porterReqData) {
          this.porterReqData[i]['performerName'] = null;
          if(this.porterReqData[i]['performer'].length && this.porterReqData[i]['performer'].filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ').length) {
            this.porterReqData[i]['performerName'] = this.porterReqData[i]['performer'].filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ')[0]['name'];
          }
        }
        this.porterReqData1 = this.porterReqData.filter(val => val.status != 'RQ-CO' && val.status != 'RQ-CA')
      }
    });
  }
  searchPatient(event) {
    this.selectedPatient = null;
    if (event.type === 'patientName' && event.text.length >= 2) {
      if (event.toHit === true) {      
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
  getPatientName(index, selectedId){
    let name = '';
    if(selectedId){
      let selectedIndex = this.searchPatientlist.findIndex(res => res.id == selectedId);
      name = this.searchPatientlist[selectedIndex]['fullName'];
    }
    return name;
  }
  getSearchDetails(data, type) {
    /* This determines the function based on type drop
    if (type === "drop") {
      // this.swap = false;
      this.locToId = data.id;
      this.locDestOption = data.id;
      this.destLocationTypeId = data.locationTypeId;
      this.destParentLocationId = data.parentId;
      this.searchDestLocList = [];
      this.destLocName = data.name;
      this.destLocFullname = data.fullName;
      if(this.locToId === null) {
        this.isDestinationLoc = false;
        this.requestForm.controls.destinationId.setValue(null);
      } else {
        this.isDestinationLoc = true;
      }
      this.checkPriority();
    } else */
    if (type === "patient") {
      this.nonPerformerType = type;
      this.reqPatientDetails = data;
      /* This determines the current location detail based on id
      this.getCurrentLocationDetails(17940);
      this.patientId = data.id; */
    } 
    /* This determines the function based on type source
    else if (type === "source") {
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
    } */ 
  }
  searchTaskLocationList(event) {
    this.taskLocationId = null;
    this.taskLocationEnabled = true;
    this.toHit = event.toHit;
    if (event.type === 'taskLocation' && event.text.length >= 2) {
      this.taskLocationId = null;
      this.taskLocationEnabled = true;  
      if (this.toHit === true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.taskLocationListRes = res.results;
          this.taskLocationList = this.taskLocationListRes;
        });
      } else {
        this.taskLocationList = this.taskLocationListRes;
      }
    }
  }
  getTaskLocationID(locationID: any) {
    if(locationID != null){
      this.taskLocationId = locationID;
    }
  }
  getTaskLocationList(id) {
    if (id) {
      const taskLocation = this as any as { id: string, name: string, fullName: string }[]
      return taskLocation.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }
  savePatientRequest() {
    let locDetail = this.taskLocationList.filter(val => val.id == this.taskLocationId)
    let detail = {}
    if(locDetail.length) {
      detail["destinationId"] = locDetail[0]['id'];
      detail["destLocationTypeId"] = locDetail[0]['locationTypeId'];
      detail["destParentLocationId"] = locDetail[0]['parentId'];
    }
    if(!this.guestUser) {
    detail["nonPerformer"] = [{
      id: this.reqPatientDetails ? this.reqPatientDetails.id : null,
      locationId: null,
      type: 'TAT-PA',
    }]
    }
    this.taskLocationId = null;
    this.taskLocationEnabled = false;
    this.taskLocationList = [];
    this.taskLocationListRes = [];
    this.reqPatientDetails = null;
    this.nonPerformerType = null;
    this.taskManageForm.controls.patientName.reset();
    this.taskManageForm.controls.destinationLocation.reset();
    this.closeexpande = !this.closeexpande;
    this.createPorterReq(detail, 'Patient')
    
  }
  public buildForm(){
    this.taskManageForm = this.fb.group({
      locationName : [this.locId ? this.dataGenerate : this.getAssetData],
      patientName : [null],
      remarksgda: [null, [Validators.required]],
      remarks : [null],
      destinationLocation :  [null,[Validators.required]],
      assetLoction :  ['AT-WH'],
      visitorCount : [this.defaultValue],
      description : [null]
    })
  }
  getPoolLocationById(locId) {
    this.configurationService.getEntityform(locId, 'location', 'pwaLocation').subscribe( res => {
      if(res.statusCode == 1) {
        let filterPool = res.results.filter(val => val.identifyingType == 'PoolLocation')
        if(filterPool.length) {
          this.poolLocation = [
            { "code" : filterPool[0]['identifyingValue'], "value" : filterPool[0]['identifyingValueName']  }
          ]
        }
      }
    })
  }
  getFormTemplate(payload) {
    this.configurationService.getMobileApiPwa(payload).subscribe( res => {
      if(res.statusCode == 1) {
        this.formTemplateList = res.results.forms;
        this.taskList = res.results.tasks;
      }
    })
  }
  getAllLocation() {
    this.activeRoute.queryParams.subscribe(params => {  
      this.locId = params['lid'];
      this.paramLocId = params['lid'];
      this.assetId = params['aid'];
    })
    if(this.locId != undefined) {
      this.locDetailsbyId()
    }
    else {
      this.configurationService.getAllAssetv2(this.assetId).subscribe(res => {
        this.dataGenerate = res.results;
        this.assetDetail = res.results[0];
        this.getAssetData  = this.dataGenerate[0].assetName;
        this.buildForm();
        let payload = 'qualifier=asset&identifyingType=AssetType&assetTypeId=' + this.dataGenerate[0].assetTypeId;
        this.getFormTemplate(payload);        
      })
    }
  }
  locDetailsbyId() {
    this.hospitalService.getLocationWithChildren(this.locId).subscribe(res => {
      if(res.statusCode == 1) {
        this.dataStatus = res.results;
        this.locDetail = res.results;
        this.dataGenerate = this.dataStatus.name;
        this.buildForm();
        let payload = 'qualifier=location&identifyingType=LocationCategory&identifyingId='+this.locDetail.locationCategoryId;
        this.getFormTemplate(payload);
        this.getPoolLocation(this.locDetail.parentId)
        if(this.paramLocId == this.locId && this.dataStatus?.locationTypeId == 2){
          this.isFloor = true;
          this.floorChildLoc = this.dataStatus?.children;
        }
      }
    });
  }
  updateLocation(name){
    const selectedLocation = this.floorChildLoc.find(data => data.name === name);
    this.locId = selectedLocation['id'];
    this.locDetailsbyId()
  }
  getPoolLocation(floorId) {
    let parentCode = 'FL-'+floorId;
    this.commonService.getAppTermsLink(parentCode).subscribe((res) => {
      this.poolLocation = res.results.filter(resFilter => resFilter.groupName === 'PoolLocation');
      this.getPoolLocationById(this.locId);
    })
  }
  onSelect(code: string) {
    this.taskManageForm.get('statusFrom')?.setValue(code);
  }
  getFormDetail(item: any, index: number) {
      this.formData = { "id" : null , "entityId" : this.locId , "entityType" : "location" , "parentId" : null, "parentType" : null, "pfFormTemplateId" : item.entityId, "content" : "form","entityData": this.locDetail};
      if(this.assetId) {
        this.formData = { "id" : null , "entityId" : this.assetId , "entityType" : "asset" , "parentId" : null, "parentType" : null, "pfFormTemplateId" : item.entityId, "content" : "form","entityData": this.assetDetail};
      }
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        maxWidth: '80vh !important',
        data: this.formData,
        panelClass:['mob-formdetails-popup'],
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.formData = null
      });

  }
  onItemClick(item: any, index: number): void {
    this.locData = this.formTemplateList;
    let postDetails = {};
    if(this.locId) {
      postDetails = {
        activityId : item.entityId,
        activityName : item.entityName,
        locationId : this.locId,
        
        locationName : this.taskManageForm.controls.locationName.value,
        assetId : null
      }
    } else if(this.assetId) {
      postDetails = {
        activityId : item.entityId,
        activityName : item.entityName,
        locationId : this.assetDetail['homeLocationId'],
        locationName : this.assetDetail['homeLocationName'],
        assetId : this.assetDetail.id
      }
    }
    const dialogRef = this.dialog.open(PWATaskdetailsComponent, {
    maxWidth: '80vh !important',
    data: postDetails,
    panelClass:['mob-costomize-popup'],
    disableClose: false
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  openPorterRqs(item: any, index: number){
   this.porterData = this.serviceGroup?.filter((item, i) => i === index);
   if(this.porterData[0].groupName === 'PorterRequestType'){
    this.porterReq = {id: null, name: null, patientVisitStatus : null, ServiceGroupId :'PR-PA', type: this.porterData[0].code}
   } else {
    this.porterReq = {id: null, name: null, patientVisitStatus : null, ServiceGroupId : 'PR-SE', type: this.porterData[0].code}
   }
    if(this.locDetail) {
      let locationDetail = {
          "fullName": this.locDetail.name,
          "id": this.locDetail.id,
          "locationTypeId": this.locDetail.locationTypeId,
          "name": this.locDetail.name,
          "parentId": this.locDetail.parentId
      }
      this.cookieService.set(
        'porter_source_loc_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
        JSON.stringify(locationDetail)
      );
    }
    const dialogRef = this.dialog.open(PorterRequestNewComponent,{
      maxWidth: '80vh !important',
      data: this.porterReq,
      panelClass:['mob-costo-popup'],
      disableClose: true
      });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
   
  getAppteams(){
    this.commonService.getAppTerms('ServiceGroup,PorterRequestType').subscribe((res) => {
    /* This determines the ServiceGroup 
    this.serviceGroup =  res.results.filter(res => res.code === 'SG-BT' || res.code === 'SG-PH'); */
    if(this.configData.hasOwnProperty('enableGda') && this.configData?.enableGda) {
      this.gdaData = res.results.filter(res => res.code === 'SG-HK');
    }
    this.patientdata = res.results.filter(res => res.code === 'PR-PA' || res.code === 'PR-OT');
    if(this.patientdata.length == 2) {
    this.patientdata = res.results.filter(res => res.code === 'PR-PA');
    }
    })
  }
  toggleExpand(item: any) {
    item.expanded = !item.expanded;
  }
  toggleboxExpand(items: any) {
    this.closeexpande = !this.closeexpande;
  }
  createMainOpen(){
    const entityId = this.dataGenerate[0]?.id;
    let type = '';
    let entityName = '';

    if (this.assetId) {
      type = 'Asset';
      entityName = this.dataGenerate[0]?.assetName || '';
    } else if (this.locId) {
      type = 'Location';
      entityName = this.dataGenerate?.name || '';
    }

    let Data ={"type":'create',"tabType":type,"entityType":'Asset',"entityId":entityId,"entityName":entityName,"entityById": entityId,"entityIdName": entityName};
    const bottomSheetRef = this.bottomSheet.open(ManagePwaMaintenanceComponent, {
      data:Data,
      panelClass: ['custom-bottom-sheet-small', 'bottom-sheet-background']
    });
  
    bottomSheetRef.afterDismissed().subscribe(result => {
    });
  }
  createTicketOpen() {
    const userId = localStorage.getItem(btoa('userId'));
    const roleId = localStorage.getItem('userlevel');

    if (userId || roleId) {
      const entityId = this.dataGenerate[0].id;
      const entityDetail = this.dataGenerate[0];

      let type = '';
      let contextId = '';
      let formTemplateType = '';

      if (this.assetId) {
        type = 'asset';
        contextId = 'PR-AT';
        formTemplateType = 'FTT-AT';
      } else if (this.locId) {
        type = 'location';
        contextId = 'PR-LOC';
        formTemplateType = 'FTT-LOC';
      }

      const taskData = [{
        id: null,
        nonPerformerId: entityId,
        entityDetail: entityDetail,
        type: type,
        contextType: contextId,
        formTemplateType: formTemplateType,
        requestedType: 'RQT-TASK',
        permissionTab: ['Task', 'Easy Pick']
      }];

      const bottomSheetRef = this.bottomSheet.open(ManagePwaTaskComponent, {
        data: taskData,
        panelClass: 'custom-bottom-sheet'
      });

      bottomSheetRef.afterDismissed().subscribe(() => {
        // no logic here per original
      });

    } else {
      const ticketData = {
        id: null,
        entityId: this.dataGenerate[0].id,
        entityDetail: this.dataGenerate[0]
      };

      console.log(ticketData);

      // const dialogRef = this.dialog.open(EntityTicketComponent, {
      //   maxWidth: '80vh !important',
      //   data: ticketData,
      //   panelClass: ['mob-costomize-popup'],
      //   disableClose: false
      // });

      // dialogRef.afterClosed().subscribe(() => {
      //   // no logic here per original
      // });
    }
  }
  
  openQRCodeDialog() {
    this.router.navigate(['web/qr-scan']);
  }
  changePage() {
    this.router.navigate(['web/easy-task'], {
      queryParams: {lid: this.locId}
    });    
  }

  updateVisitorCount(action: string): void {
    let currentCount = this.taskManageForm.controls['visitorCount'].value;

    if (action === 'increment' && currentCount < this.maxVisitorLimit) {
      this.taskManageForm.controls['visitorCount'].setValue(currentCount + 1);
    } 
    else if (action === 'decrement' && currentCount > 1) {
      this.taskManageForm.controls['visitorCount'].setValue(currentCount - 1);
    }
  }
  fixClick() {
    console.log('')
  }
}
