import { Component, OnInit } from '@angular/core';
import { CommonService, ConfigurationService, HospitalService } from '../../../../services';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppToastService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-easy-task',
  templateUrl: './easy-task.component.html',
  styleUrls: ['./easy-task.component.scss']
})
export class EasyTaskComponent implements OnInit {
  public locationId = null;
  public locDetail = null;
  public assetId = null;
  public activityCategoryList = [];
  public activityList = [];
  public selectedCategoryId = null;
  public showPopup = false;
  public userName = localStorage.getItem(btoa('current_user'));
  public facilityName = localStorage.getItem(btoa('customer'));
  constructor(public commonService : CommonService, public configurationService : ConfigurationService,
    public router : Router, private readonly dateFormat: DatePipe, public toastr: AppToastService, 
    public hospitalService : HospitalService, public activeRoute : ActivatedRoute) {

  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(params => {  
      this.locationId = params['lid'];
      this.assetId = params['aid'];
      console.log(this.locationId)
      if(this.locationId) {
        this.locationId = parseInt(this.locationId)
        this.getLocationDetail();
        this.getRequestCategory('PR-LC')

      }
    })
  }
  getRequestCategory(code) {
    this.commonService.getAppTermsLink(code, 'ActivityCategory').subscribe(res => {
      if(res.statusCode == 1) {
        this.activityCategoryList = res.results;
      }
    })
  }
  getActivityList(code) {
    let routineTypeId = 'TAC-TKT';
    this.selectedCategoryId = code;
    this.configurationService.getTaskActivities(routineTypeId,code).subscribe(res => {
      if(res.statusCode == 1) {
        this.showPopup = true;
        this.activityList = res.results;
      }
    })
  } 
  closePopup() {
    this.showPopup = false;
    this.selectedCategoryId = null;
  }
  changePage() {
    this.router.navigate(['web/action'], {
      queryParams: {lid: this.locationId}
    });    
  }
  getLocationDetail() {
    this.hospitalService.getLocationWithChildren(this.locationId).subscribe(res => { 
      if(res.statusCode == 1) {
        this.locDetail = res.results;
      }
    });
  }
  private formatScheduleDate(date: any): string | null {
    if (!date) return null;
    const format = 'yyyy-MM-dd HH:mm:ss';
    return this.dateFormat.transform(date, format);
  }
  createTask(activity) {
    let payload = {
      "pfActivityId": activity.id,
      "type": "RQT-TASK",
      "canCreate": true,
      "comments": null,
      "gender": null,
      "startTime": null,
      "requestCategory": "PR-LC",
      "performer": [{ "id": activity.inchargeId, "type": activity.inchargeType }],
      "nonPerformer": [{ "id": this.locationId, "type": "Location" }],
      "destinationId": this.locationId,
      "status": null,
      "isautoAssigned": false,
      "isAutoComplete": false,
      "configValue": null,
      "title": null,
      "attachFiles": [],
      "entityForms": null,
      "statusReasonId": null,
      "scheduleStartTime": this.formatScheduleDate(new Date()),
      "scheduleEndTime": null,
      "scheduleActivityTypeId": "SAT-ATM",
      "priorityLevelId": null
    }
    console.log(payload)
    // return
    this.commonService.saveTask(payload).subscribe(async res => {
      if(res.statusCode == 1) {
        this.showPopup = false;
        this.selectedCategoryId = null;
        this.toastr.success('Success', `${res.message}`);        
      }      
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    })
  }

  get firstLetter(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : '';
  }

}
