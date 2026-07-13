import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '../../../../shared';
import { PatientInfoComponent } from '../../../../shared/modules/entry-component/patient/patient.component';
import { MatDialog } from '@angular/material/dialog';
import { CookieService } from 'ngx-cookie-service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-overall-queue',
  templateUrl: './overall-queue.component.html',
  styleUrls: ['./overall-queue.component.scss'],
  encapsulation: ViewEncapsulation.None
  
})
export class OverallQueueComponent implements OnInit, OnDestroy {

  @Input() type: string;
  @Input() matTabIndex: number;
  @Input() enableCountClick = true;
  floorId = new FormControl('');
  locationQueue: Array<any> = [];
  digitalQueueList_new: Array<any> = [];
  floorData: Array<any> = [];
  public overall_interval: any;
  public selectedFloor = null;
  public floor_interval: any;
  floorList: any;

  constructor(private readonly dashboardService: DashboardService, private readonly dialog: MatDialog, private readonly cookieService: CookieService,){ }
  
  ngOnInit(): void {
    if(this.matTabIndex === 0){
      this.getAllDigitalQueueData()
      clearInterval(this.floor_interval);
    } else if (this.matTabIndex === 1) {
      clearInterval(this.overall_interval);
      this.getFloorList();
    } else {
      clearInterval(this.floor_interval);
      clearInterval(this.overall_interval);
    }
  }

  getAllDigitalQueueData() {
    if (this.matTabIndex === 0) {
      clearInterval(this.overall_interval);
      this.overall_interval = setInterval(val => this.getAllDigitalQueueData(), 30000);
    }
    this.dashboardService.getDigitalQueueSummary().subscribe(res => {
      this.digitalQueueList_new = res.results;
      this.locationQueue = this.digitalQueueList_new
    }, error => {
      clearInterval(this.overall_interval);
    });
  }

  locationInfo(id, name, status, testId, count, testType, visitStatusId, planTypeId) {
    if (this.enableCountClick) {
      if (count > 0) {
        const dialogRef = this.dialog.open(PatientInfoComponent, {
          data: { 'id': id, 'name': name, 'status': status, 'testId': testId, 'testType': testType, 'visitStatusId': visitStatusId, 'planTypeId': planTypeId },
          panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          if(this.matTabIndex){
            this.refreshoverall();
          }
        });
      }
    }
  }

  refreshoverall() {
    this.getAllDigitalQueueData();
  }

  refreshfloor() {
    if (this.selectedFloor == null && this.floorList.length > 0) {
      this.getFloorDetail(this.floorList[0].id);
    } else {
      this.getFloorDetail(this.selectedFloor);
    }
  }

  getFloorList() {
    this.dashboardService.getFloorList().subscribe(res => {
      this.floorList = res.results;
      if (this.floorList.length > 0) {
        if (this.cookieService.check(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        } else {
          this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
          this.cookieService.set(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
            this.selectedFloor
          );
          if (this.floorList[0].hasOwnProperty('id')) {
            this.selectedFloor = this.floorList[0].id;
          }
        }
        this.getFloorDetail(this.selectedFloor);
      }
    });
  }

  getFloorDetail(id) {
    this.selectedFloor = id;
    if (this.selectedFloor != null) {
      this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
      this.cookieService.set(
        'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
        this.selectedFloor
      );

      if (this.cookieService.check(
        'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
      )) {
        this.selectedFloor = this.cookieService.get(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        );
      } else {
        this.cookieService.delete('DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')));
        this.cookieService.set(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId')),
          this.selectedFloor
        );

        if (this.cookieService.check(
          'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
        )) {
          this.selectedFloor = this.cookieService.get(
            'DQ_Floor_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))
          );
        }
      }
      if (typeof (id) === 'string') {
        id = parseInt(id, 10);
      }

      if (this.matTabIndex === 1) {
        clearInterval(this.floor_interval);
        this.floor_interval = setInterval(val => this.getFloorDetail(this.selectedFloor), 30000);
      }
      this.dashboardService.getPatientByFloorId(this.selectedFloor).subscribe(res => {
        this.floorData = res.results;
        this.locationQueue = this.floorData;
      });
      const filterFloor = this.floorList.filter(res => res.id === id);
      this.filterFloor(filterFloor);
    }
  }

  filterFloor(filterFloor) {
    if (filterFloor.length > 0) {
      let updateFloorId = filterFloor[0].id;
      this.floorId.setValue(updateFloorId ? updateFloorId : null)
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.overall_interval);
    clearInterval(this.floor_interval);
  }

  fixClick() {
    console.log('')
  }
}
