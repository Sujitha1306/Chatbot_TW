import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ColorThemeService, CommonService, HospitalService } from '../../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppToastService } from '../../../../services/toaster.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-pwa-request',
  templateUrl: './pwa-request.component.html',
  styleUrls: ['./pwa-request.component.scss'],
  encapsulation: ViewEncapsulation.None
  
})
export class PwaRequestComponent implements OnInit {
  public requestForm: any = FormGroup;
  public LocSub: Subject<any> = new Subject();
  public patientName = null;
  public sourceId = null;
  public requestTypes = [];
  public poolNameList = [];
  public serviceGroupList = [];
  public serviceFilterList = [];
  public assetCategoryList = [];
  public locationList = [];
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd HH:mm:ss');
  public mode: any = 'PR-PA';
  public locationName: any;
  mobileUserId = null;
  configData = {
    porterDestinationId : null,
    userId : null
  };


  constructor(public hospitalService: HospitalService, private commonService: CommonService, public colorThemeService: ColorThemeService, public fb: FormBuilder, public activeRoute: ActivatedRoute,
              public toastr: AppToastService, public datepipe: DatePipe) {
    this.colorThemeService.loadTheme();
  }

  ngOnInit(): void {
    this.getBasicDetail();
    this.LocSub.pipe(debounceTime(300), distinctUntilChanged()).subscribe(value => {
      this.searchLocation(value);
    });
    this.patientName = localStorage.getItem(btoa('patientName'));
    this.buildForm();
  }
  getBasicDetail() {
    this.getAppterms();
    this.getConfig();
    this.activeRoute.queryParams.subscribe(params => {
      if(params.hasOwnProperty('lid')) {
        this.sourceId =  parseInt(params.lid);
        if(this.sourceId) {
          this.getlocationById(this.sourceId)
        }
      }      
    });
    this.buildForm();
  }
  getConfig() {
    this.mobileUserId = localStorage.getItem(btoa('current_user'))
    this.commonService.getConfigFile('pwa-config').subscribe(res => {
      if (res.statusCode === 1) {
        this.configData.porterDestinationId = res.results?.contentObject?.porterDestinationId;
        this.configData.userId = res.results?.contentObject?.userId;
      }
    });
  }

  searchLocation(key: string) {
    if (key && key.length >= 2) {
      this.commonService.getLocationSearch(key).subscribe((res) => {
        this.locationList = res.results;
      });
    } else {
      this.locationList = [];
    }
  }

  getlocationById(locationId) {
    this.hospitalService.getLocationWithChildren(locationId).subscribe(res => {
      if (res.statusCode == 1) {
        this.locationName = res.results?.name;
        this.hospitalService.getLocationWithChildren(res.results.parentId).subscribe(res => {
        if (res.statusCode == 1) {
            this.locationName = this.locationName + ', '+ res.results?.name;
          }
        })
      }
    })
  }

  displayLocationName = (location: any): string => {
    return location ? location.fullName : '';
  };

  getLocationCheck(value: string) {
    this.LocSub.next(value);
  }

  validateSelection() {
    const control = this.requestForm.get('destinationId');
    if (!control) return;

    const value = control.value;

    if (!value || typeof value !== 'object') {
      control.setValue(null);
    }
  }

  getAppterms() {
    this.commonService.getAppTermsLink("RQT-PO", "PorterRequestType").subscribe(res => {
      if(res.statusCode == 1) {
        const appCode = ['PR-AT', 'PR-OT']
        this.requestTypes = res.results.filter(x => !appCode.includes(x.code));
      }
    });
    this.commonService.getAppTermsLink("PR-PA").subscribe(res => {
      if(res.statusCode == 1) {
        const allowedCodes = ['AT-STR', 'AT-WH'];
        this.assetCategoryList = res.results.filter(val => val.groupName == "AssetType"  && allowedCodes.includes(val.code));
      }
    });
    this.commonService.getAppTerms("PoolName,ServiceGroup").subscribe(res => {
      if(res.statusCode == 1) {
        this.poolNameList = res.results.filter(val => ["PN-OPD", "PN-IN", "PN-MB_OT", "PN-EB_OT"].includes(val.code));
        this.serviceGroupList = res.results.filter(val => val.groupName == 'ServiceGroup');
      }
    });
  }
  buildForm() {
    this.requestForm = this.fb.group({
      requestCategory: ["PR-PA"],
      sourceId: [this.sourceId, []],
      destinationId: [null, [Validators.required]],
      assetCategory: [null, []],
      serviceGroupId: [null, []],
      poolName: ['PN-IN', []],
      comments: ["Patient Transport", []],
      status: [null, []],
      patientName: [this.patientName, []],
      mainIdentifier: [null],
      isRoundTrip: [ null, []],
      // isautoAssigned: [ null, []],
      // assetCount: [ null, []],
      // porterId: [ null, []],
      // patientId: [ null, []],
      // assetId: [ null, []],
      // porterCount: [ null, []],
      // cancelReasonId : [ null, []],
      // remarks: [ null, []],
      // rating: [ null, []],
      // duration: ['15'],
      // isRoundTrip: [ null, []],
      // lastModifiedOn: [ null, []],
      
    });
  }

  addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  postPorterRequest() {
    const patitentId = localStorage.getItem('Y3VycmVudF91c2Vy');
    const startTime = new Date(this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss'));
    const endTime = this.addMinutes(startTime, 15);
    let roundTripValue = this.requestForm.get('isRoundTrip').value ?? null
    let createRequest = {
      'requestCategory': this.requestForm.get('requestCategory').value ?? null,
      'sourceId': this.requestForm.get('sourceId').value ?? null,
      'destinationId': this.requestForm.get('destinationId').value?.id ?? null,
      'assetCategory': this.requestForm.get('assetCategory').value ?? 'AT-TO',
      'serviceGroupId': this.requestForm.get('serviceGroupId').value ?? null,
      'poolName': this.requestForm.get('poolName').value ?? null,
      'porterCount': '1',
      'startTime': this.datepipe.transform(startTime, 'yyyy-MM-dd HH:mm:ss'),
      'endTime': this.datepipe.transform(endTime, 'yyyy-MM-dd HH:mm:ss'),
      'isRoundTrip': roundTripValue,
      'type': "RQT-PO",
      'status': 'RQ-WT',
      'userId' : this.configData.userId ? this.configData.userId : null,
      'priority': true,
      'srcIdentifyingId' : this.mobileUserId ? parseInt(this.mobileUserId) : null,
      'srcIdentifyingType' : 'mobile_users',
      'comments' : this.requestForm.get('comments').value ?? null,
            
      'nonPerformer': [{
        'id': null,
        'type': "TAT-PA",
        'name': this.requestForm.get('patientName').value ?? null
      }]
    };

    if (roundTripValue) {
      createRequest['remarks'] = 'Roundtrip';
    }
    // console.log(createRequest)
    // return
    this.commonService.savePorterRequest(createRequest).subscribe(
      (res) => {
        this.toastr.success("Success", `${res.message}`);
        this.requestForm.get('destinationId').setValue(null);
        this.requestForm.get('assetCategory').setValue(null);
        this.requestForm.get('isRoundTrip').setValue(null);
        // this.requestForm.get('poolName').setValue(null);
        this.buildForm();
      }, (error) => {
        this.toastr.error("Error", `${error.error.message}`);
      })

  }

  onRequestCategoryChange(event) {
    this.mode = event.value;
    if (this.mode == 'PR-SE') {
      const serviceInfo = this.serviceGroupList;
      let defaultsValue = serviceInfo?.find(val =>  val.isDefault);
      this.requestForm.get('comments').setValue(null);
      this.requestForm.get('destinationId').setValue(null);
      this.requestForm.get('serviceGroupId').setValue(defaultsValue?.code);
      this.getAvailableServices(defaultsValue?.code);
      this.locationList = [];
    } else {
      this.requestForm.reset();
      this.locationList = [];
      this.buildForm();
    }
  }

  getAvailableServices(code) {
    if (code) {
      this.commonService.getAppTermsLink(code).subscribe((res) => {
        if (res.statusCode === 1) {
          this.serviceFilterList = res.results;
          if (this.serviceFilterList.length) {
            const defaultsList = this.serviceFilterList.find(res => res.isDefault);
            this.requestForm.get('assetCategory').setValue(defaultsList?.code);
            this.getPoolName(defaultsList?.code);
          }
        }
      });
    }
  }

  getPoolName(value) {
    if (value) {
      this.commonService.getAppTermsLink(value).subscribe(res => {
        if (res.statusCode === 1) {
          const porterGroup = res.results.filter(resFilter => resFilter.groupName === 'PoolName');
          if (porterGroup) {
            const defaultsData = porterGroup.find(res => res.isDefault);
            if (defaultsData) {
              this.requestForm.get('poolName').setValue(defaultsData.code);
            } else {
              this.requestForm.get('poolName').setValue(porterGroup[0].code);
            }
          }
        }
      });
    }
  }

}
