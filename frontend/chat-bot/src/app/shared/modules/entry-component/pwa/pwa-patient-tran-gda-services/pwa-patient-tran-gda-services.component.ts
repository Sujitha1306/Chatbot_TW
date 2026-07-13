import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService, ConfigurationService, HospitalService } from '../../../..';
import { CookieService } from 'ngx-cookie-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../../services/toaster.service';
import { MatDialog } from '@angular/material/dialog';
import { ManagePwaMaintenanceComponent } from '../manage-pwa-maintenance/manage-pwa-maintenance.component';
import { ManagePwaTaskComponent } from '../manage-pwa-task/manage-pwa-task.component';
import { PWATaskdetailsComponent } from '../../../../../ovitag/configuration/pwa-taskdetails/pwa-taskdetails.component';
import { CommonDialogComponent } from '../../common-dialog-component/common-dialog.component';
import { PorterRequestNewComponent } from '../../porter-request/porter-request.component';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-pwa-patient-tran-gda-services',
  templateUrl: './pwa-patient-tran-gda-services.component.html',
  styleUrls: ['./pwa-patient-tran-gda-services.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PwaPatientTranGDAServicesComponent {

  public taskManageForm: FormGroup;

  public userName: any = null;
  public patientId: any = null;
  public facilityName: any = null;
  public paramLocId: any = null;
  public assetId: any = null;
  public assetDetail: any = null;
  public getAssetData: any = null;
  public patientDetails: any = null;
  public gdaData: any = null;
  public patientdata: any = null;
  public selectedItem: any = null;
  public selectedGDA: any = null;

  public locId: any;
  public dataGenerate: any;
  public locDetail: any;
  public GDAGroup: any;
  public lastReqId: any;
  public floorChildLoc: any;
  public nonPerformerType: any;
  public reqPatientDetails: any;
  public taskLocationId: any;

  public guestUser: boolean = false;
  public isFloor: boolean = false;
  public gdaExpanded = false;
  public closeexpande = false;
  public taskLocationEnabled = false;

  public poolLocation: any = [];
  public formTemplateList: any = [];
  public taskList: any = [];
  public filterAssetType: any = [];
  public porterReqData: any = [];
  public porterReqData1: any = [];
  public searchPatientlist: any = [];
  public patientListItems: any = [];
  public taskLocationListRes: any = [];
  public taskLocationList: any = [];

  private defaultValue: number = 1;
  private maxVisitorLimit: number = 3;
  private DEMO_PARENT_LOC_ID = 19705;
  private PROD_PARENT_LOC_ID = 1366;
  private DEMO_DEST_ID = 22496;
  private PROD_DEST_ID = 1387;


  public configData = {
    gdaExpandedData: false,
    enableGda: false,
    enableTicket: false,
    porterDestinationId: null,
    userId: null,
    verifyLocCategory: false
  };
  iconMap: any = {
    'RN-BTW': '◻️', 'RN-BSC': '🛏️', 'RN-BDP': '🧺', 'RN-BLT': '🛌', 'RN-CLR': '🧹', 'RN-DIS': '🧼', 'RN-GLC': '🥛', 'RN-HDT': '🧣',
    'RN-HLP': '🙋', 'RN-PGN': '👕', 'RN-PL': '🛏️', 'RN-PLC': '🧴', 'RN-SOP': '🧼', 'RN-SPG': '🧽', 'RN-TPR': '🧻', 'RN-TRL': '🧻', 'RN-TVR': '📺',
    'RN-UBE': '🫙', 'RN-WTG': '🥤', 'RN-WFR': '🚰'
  };
  patienticon: any = {
    'AT-WH': '👨‍🦽‍➡️',
    'AT-S/B': '🛏️',
    'AT-OTT': '🛌'
  };

  constructor(
    public router: Router,
    public commonService: CommonService,
    public fb: FormBuilder,
    public activeRoute: ActivatedRoute,
    public configurationService: ConfigurationService,
    public dialog: MatDialog,
    public hospitalService: HospitalService,
    private readonly cookieService: CookieService,
    public toastr: AppToastService,
    public datePipe: DatePipe,
    private readonly bottomSheet: MatBottomSheet,) {
    this.getDynamicData();
    this.facilityName = localStorage.getItem(btoa('customer'));
  }

  ngOnInit() {
    this.patientId = localStorage.getItem(btoa('patientId'));
    if (!this.patientId && localStorage.hasOwnProperty(btoa('guestInfo'))) {
      this.locId = localStorage.getItem('locationId');
      this.dataGenerate = JSON.parse(localStorage.getItem(btoa('guestInfo')))['locationName'];
      this.getAllLocation()
      this.lastReqId = this.cookieService.get('lastReqId')
      this.buildForm();
      this.guestUser = true;
      this.locDetail = {
        id: this.locId,
        locationTypeId: '17',
        parentId: JSON.parse(localStorage.getItem(btoa('guestInfo')))['floorId']
      }
      this.getPatientByLocation()
      this.getAppteams();
      this.commonService.getAppTermsLink('SG-HK').subscribe((res) => {
        this.GDAGroup = res.results.filter(resFilter => resFilter.groupName === 'RequestNeed');
      })
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
      this.commonService.getAppTermsLink('PR-OT').subscribe((res) => {
        this.filterAssetType = res.results.filter(item => item.code === 'AT-WH' || item.code === 'AT-S/B' || item.code === 'AT-OTT');
        console.log(this.filterAssetType)
      });
    }
    this.userName = localStorage.getItem(btoa('current_user'));
  }

  savePatientRequest() {
    let locDetail = this.taskLocationList.filter(val => val.id == this.taskLocationId)
    let detail = {}
    if (locDetail.length) {
      detail["destinationId"] = locDetail[0]['id'];
      detail["destLocationTypeId"] = locDetail[0]['locationTypeId'];
      detail["destParentLocationId"] = locDetail[0]['parentId'];
    }
    if (!this.guestUser) {
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

  onItemCheck(item: any) {
    this.taskManageForm?.controls.remarksgda.reset();
    this.selectedItem = item;
    // if (this.selectedItem === item) {
    //   this.selectedItem = null;
    // } else {
    //   this.selectedItem = item;
    // }
  }

  get firstLetter(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : '';
  }

  openQRCodeDialog() {
    this.router.navigate(['web/qr-scan']);
  }

  getAllLocation() {
    this.activeRoute.queryParams.subscribe(params => {
      this.locId = params['lid'] ?? null;
      this.paramLocId = params['lid'] ?? null;
      this.assetId = params['aid'] ?? null;
    })
    if (this.locId != undefined) {
      this.locDetailsbyId()
    }
    else {
      this.configurationService.getAllAssetv2(this.assetId).subscribe(res => {
        this.dataGenerate = res.results;
        this.assetDetail = res.results[0];
        this.getAssetData = this.dataGenerate[0].assetName;
        this.buildForm();
        let payload = 'qualifier=asset&identifyingType=AssetType&assetTypeId=' + this.dataGenerate[0].assetTypeId;
        this.getFormTemplate(payload);
      })
    }
  }

  getPatientByLocation() {
    this.commonService.getPatientByLocation(this.locId).subscribe(res => {
      if (res.statusCode == 1) {
        this.patientDetails = res.results;
      }
    });
  }

  getAppteams() {
    this.commonService.getAppTerms('ServiceGroup,PorterRequestType').subscribe((res) => {
      if (this.configData.hasOwnProperty('enableGda') && this.configData?.enableGda) {
        this.gdaData = res.results.filter(res => res.code === 'SG-HK');
      }
      this.patientdata = res.results.filter(res => res.code === 'PR-PA' || res.code === 'PR-OT');
      if (this.patientdata.length == 2) {
        this.patientdata = res.results.filter(res => res.code === 'PR-PA');
      }
    })
  }

  changePage() {
    this.router.navigate(['web/easy-task'], {
      queryParams: {lid: this.locId}
    });    
  }

  locDetailsbyId() {
    this.hospitalService.getLocationWithChildren(this.locId).subscribe(res => {
      if (res.statusCode == 1) {
        let dataStatus = res.results;
        this.locDetail = res.results;
        this.dataGenerate = dataStatus.name;
        this.buildForm();
        let payload = 'qualifier=location&identifyingType=LocationCategory&identifyingId=' + this.locDetail.locationCategoryId;
        this.getFormTemplate(payload);
        this.getPoolLocation(this.locDetail.parentId)
        if (this.paramLocId == this.locId && dataStatus?.locationTypeId == 2) {
          this.isFloor = true;
          this.floorChildLoc = dataStatus?.children;
        }
      }
    });
  }

  getPoolLocation(floorId) {
    let parentCode = 'FL-' + floorId;
    this.commonService.getAppTermsLink(parentCode).subscribe((res) => {
      this.poolLocation = res.results.filter(resFilter => resFilter.groupName === 'PoolLocation');
      this.getPoolLocationById(this.locId);
    })
  }

  getFormDetail(item: any, index: number) {
    let formData = { "id": null, "entityId": this.locId, "entityType": "location", "parentId": null, "parentType": null, "pfFormTemplateId": item.entityId, "content": "form", "entityData": this.locDetail };
    if (this.assetId) {
      formData = { "id": null, "entityId": this.assetId, "entityType": "asset", "parentId": null, "parentType": null, "pfFormTemplateId": item.entityId, "content": "form", "entityData": this.assetDetail };
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, {
      maxWidth: '80vh !important',
      data: formData,
      panelClass: ['mob-formdetails-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      formData = null
    });

  }

  getFormTemplate(payload) {
    this.configurationService.getMobileApiPwa(payload).subscribe(res => {
      if (res.statusCode == 1) {
        this.formTemplateList = res.results.forms;
        this.taskList = res.results.tasks;
      }
    })
  }

  getPoolLocationById(locId) {
    this.configurationService.getEntityform(locId, 'location', 'pwaLocation').subscribe(res => {
      if (res.statusCode == 1) {
        let filterPool = res.results.filter(val => val.identifyingType == 'PoolLocation')
        if (filterPool.length) {
          this.poolLocation = [
            { "code": filterPool[0]['identifyingValue'], "value": filterPool[0]['identifyingValueName'] }
          ]
        }
      }
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
        this.configData.verifyLocCategory = res.results?.contentObject?.verifyLocCategory;
      }
    });
  }

  getPorterRequestDet() {
    let currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.commonService.getPorterRequestPwa('RQT-PO', this.patientId, 'mobile_users', currentDate).subscribe((res) => {
      if (res.statusCode == 1) {
        this.porterReqData = res['results'];
        for (let i in this.porterReqData) {
          this.porterReqData[i]['performerName'] = null;
          if (this.porterReqData[i]['performer'].length && this.porterReqData[i]['performer'].filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ').length) {
            this.porterReqData[i]['performerName'] = this.porterReqData[i]['performer'].filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ')[0]['name'];
          }
        }
        this.porterReqData1 = this.porterReqData.filter(val => val.status != 'RQ-CO' && val.status != 'RQ-CA')
      }
    });
  }

  buildForm() {
    this.taskManageForm = this.fb.group({
      locationName: [this.locId ? this.dataGenerate : this.getAssetData],
      patientName: [null],
      remarksgda: [null, [Validators.required]],
      remarks: [null],
      destinationLocation: [null, [Validators.required]],
      assetLoction: ['AT-WH'],
      visitorCount: [this.defaultValue],
      description: [null],
      searchText: [null]
    })
  }

  createMainOpen() {
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

    let Data = { "type": 'create', "tabType": type, "entityType": 'Asset', "entityId": entityId, "entityName": entityName, "entityById": entityId, "entityIdName": entityName };
    const bottomSheetRef = this.bottomSheet.open(ManagePwaMaintenanceComponent, {
      data: Data,
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

      bottomSheetRef.afterDismissed().subscribe(() => { });

    } else {
      const ticketData = {
        id: null,
        entityId: this.dataGenerate[0].id,
        entityDetail: this.dataGenerate[0]
      };
    }
  }

  onItemClick(item: any, index: number): void {
    // this.locData = this.formTemplateList;
    let postDetails = {};
    if (this.locId) {
      postDetails = {
        activityId: item.entityId,
        activityName: item.entityName,
        locationId: this.locId,

        locationName: this.taskManageForm.controls.locationName.value,
        assetId: null
      }
    } else if (this.assetId) {
      postDetails = {
        activityId: item.entityId,
        activityName: item.entityName,
        locationId: this.assetDetail['homeLocationId'],
        locationName: this.assetDetail['homeLocationName'],
        assetId: this.assetDetail.id
      }
    }
    const dialogRef = this.dialog.open(PWATaskdetailsComponent, {
      maxWidth: '80vh !important',
      data: postDetails,
      panelClass: ['mob-costomize-popup'],
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  fixClick() {
    console.log('Enter key pressed');
  }

  searchPatient(event) {
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

  openPorterRqs(item: any, index: number) {
    let porterReq = { id: null, name: null, patientVisitStatus: null, ServiceGroupId: 'PR-SE', type: null }
    if (this.locDetail) {
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
    const dialogRef = this.dialog.open(PorterRequestNewComponent, {
      maxWidth: '80vh !important',
      data: porterReq,
      panelClass: ['mob-costo-popup'],
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  searchFiletr(event) {
    console.log('event')
  }

  buildBaseData(currentTime: string, endTime: string, porterCount: number, type: string, event: any) {
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
      data.poolName = this.patientdata.length && this.patientdata[0]['code'] == 'PR-OT' ? 'PN-OPD' : 'PN-IN';
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

  handleGuestUser(data: any) {
    if (this.guestUser) {
      data["srcIdentifyingId"] = JSON.parse(localStorage.getItem(btoa('guestInfo')))['uid'];
      data["srcIdentifyingType"] = "mobile_users";
      data["remarks"] = this.configData?.gdaExpandedData && this.taskManageForm?.controls.remarksgda.value ?
        this.taskManageForm?.controls.remarksgda.value : this.taskManageForm?.controls.remarks.value;
    }
  }

  handlePatientDetails(data: any, descriptionInfo: string) {
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

  handleNonPerformer(data: any, event: any, type: string) {
    if (type == 'Patient' && event.hasOwnProperty('nonPerformer')) {
      data['nonPerformer'] = event.nonPerformer;
    }
  }

  handleSuccessResponse(res: any, type: string) {
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

  handleErrorResponse(error: any) {
    if (error.error.errorCode == 'TW-PORTER-MAX-REQUEST-EXCEPTION') {
      this.toastr.clear();
      let message = error.error.message;
      this.toastr.warning("Warning", message);
    }
  }

  getPatientName(index, selectedId) {
    let name = '';
    if (selectedId) {
      let selectedIndex = this.searchPatientlist.findIndex(res => res.id == selectedId);
      name = this.searchPatientlist[selectedIndex]['fullName'];
    }
    return name;
  }

  getSearchDetails(data, type) {
    if (type === "patient") {
      this.nonPerformerType = type;
      this.reqPatientDetails = data;
    }
  }

  getTaskLocationID(locationID: any) {
    if (locationID != null) {
      this.taskLocationId = locationID;
    }
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

  getTaskLocationList(id) {
    if (id) {
      const taskLocation = this as any as { id: string, name: string, fullName: string }[]
      return taskLocation.find(obj => obj.id === id).fullName;
    } else {
      return '';
    }
  }

  searchTaskLocationList(event) {
    this.taskLocationId = null;
    this.taskLocationEnabled = true;
    let toHit = event.toHit;
    if (event.type === 'taskLocation' && event.text.length >= 2) {
      this.taskLocationId = null;
      this.taskLocationEnabled = true;
      if (toHit === true) {
        this.configurationService.getLocationData(event.text).subscribe(res => {
          this.taskLocationListRes = res.results;
          this.taskLocationList = this.taskLocationListRes;
        });
      } else {
        this.taskLocationList = this.taskLocationListRes;
      }
    }
  }

  createPorterReq(event?, type?) {
    let today = new Date();
    let poolNameDetail = [];
    if (event) {
      this.commonService.getAppTermsLink(event.code).subscribe((res) => {
        if (res.statusCode == 1) {
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
      if (type == 'GDA' && poolNameDetail.length) {
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
      this.taskManageForm.reset();
    }, 1000);
  }

  closeMenu() {
    this.taskManageForm?.controls.remarksgda.reset();
  }

  openPwaProfile(event) {
    // this.pathName = window.location.pathname
    // if(localStorage.hasOwnProperty(btoa('guestInfo'))) {
    //   let guestInfo = JSON.parse(localStorage.getItem(btoa('guestInfo')))
    //   if(guestInfo.hasOwnProperty('entity') && guestInfo.entity == "VISITOR") {
    //     event = null;
    //   }
    //   if(guestInfo.hasOwnProperty('entity') && guestInfo.entity == "GUEST_USER") {
    //     event = null;
    //   }
    // }
    // if(event){
    //   if(window.location.pathname.includes('profile')) {
    //     this.location.back()
    //   } else {
    //     this.router.navigate(['web/profile'])
    //   }
    // }
  }

}
