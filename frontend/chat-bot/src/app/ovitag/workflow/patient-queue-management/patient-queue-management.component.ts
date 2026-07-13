import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CommonService } from '../../../shared';

@Component({
  selector: 'app-patient-queue-management',
  templateUrl: './patient-queue-management.component.html',
  styleUrls: ['./patient-queue-management.component.scss']
})
export class PatientQueueManagementComponent implements OnInit {
  public matTabIndex: any = 0;
  public selectedTabIndex = 0;
  activate_btn: any;
  enableCountClick = true;
  changeLocation = false;
  enableMultiView = true;
  enableUnmappedTest = true;
  showActiveInactive = true;
  showEnrollPatient = true;
  dynamicConfig = false;
  dqtowerconfig: any = [];

  constructor(private readonly commonService: CommonService){
    this.activate_btn = this.commonService.getActivePermission("button");
  }
  ngOnInit(): void {
    this.getdqtowerconfig()
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.matTabIndex = tabChangeEvent;
  }

  getdqtowerconfig() {
    this.commonService.getConfigFile('dq-tower-config').subscribe(res => {
      if(res.statusCode) {
				this.dynamicConfig = true;
       this.dqtowerconfig = res.results.contentObject.healthcheck;
       if(this.dqtowerconfig.hasOwnProperty('enableCountClick')) {
        this.enableCountClick = this.dqtowerconfig.enableCountClick;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableMultiView')) {
        this.enableMultiView = this.dqtowerconfig.enableMultiView;
       }
       if(this.dqtowerconfig.hasOwnProperty('enableUnmappedTest')) {
        this.enableUnmappedTest = this.dqtowerconfig.enableUnmappedTest;
       }
       if(this.dqtowerconfig.hasOwnProperty('showEnrollPatient')) {
        this.showEnrollPatient = this.dqtowerconfig.showEnrollPatient;
       }
       if(this.dqtowerconfig.hasOwnProperty('showActiveInactive')) {
        this.showActiveInactive = this.dqtowerconfig.showActiveInactive;
       }
       if(this.dqtowerconfig.hasOwnProperty('changeLocation')) {
        this.changeLocation = this.dqtowerconfig.changeLocation;
       }
      }
    });
  }
}
