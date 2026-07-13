import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { CommonService, ConfigurationService, HospitalService, WorkflowService } from '../../../shared';
import { MqttClient, connect } from 'mqtt';
import { CommonDialogComponent } from '../../../shared/modules/entry-component/common-dialog-component/common-dialog.component';
import { MatSelectChange } from '@angular/material/select';
import { MusteringHistoryComponent } from './mustering-history/mustering-history.component';
import { AppToastService } from '../../../shared/services/toaster.service';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-staff-mustering',
  templateUrl: './staff-mustering.component.html',
  styleUrls: ['./staff-mustering.component.scss']
})
export class StaffMusteringComponent {
  selectedTabIndex
  assemblyPoints = [];
  private client: MqttClient;
  hide = false;
  enableCard = false
  isInitiated = false;
  initiated = false;
  typeOfEmergency;
  statusText: string = 'Active';
  selectedView: string = 'floors';
  floordetails: any[];
  locationCard: any[] = [];
  public facilityId = localStorage.getItem(btoa('facilityId'));
  routines: any;
  floorTags: Map<number, Set<string>> = new Map();
  blockTags: Map<number, Set<string>> = new Map();
  blockMap: Map<number, any> = new Map();
  tagFloorMap: Map<string, number> = new Map();
  tagLastSeen: Map<string, number> = new Map();
  tagTypeMap = new Map<string, 'EMPLOYEE' | 'VISITOR'>();
  inactiveTimeout = 30000;
  floordetailsMap: Map<number, any> = new Map();
  locationCardMap: Map<number, any> = new Map();
  sapLocationIds: Set<number> = new Set();
  tagLocationMap: Map<string, number> = new Map();
  sapTags: Map<number, Set<string>> = new Map();
  selectedFloorLocations: any[] = [];
  selectedFloorId: number;
  viewMode;
  displayColumns = ["Name", "From Location", "Assembly Point", "Mustering Duration"]
  sapColumns = ["fullName", "srcLocationName", "locationName", "scheduleTime"]
  sapData = []
  routineId;
  blocks: any[] = [];
  selectedBlockFloors: any[] = [];
  selectedBlockId: number = null;
  historyColumns = ["Name", "Requested By", "Start Time", "End Time", "Status"]
  dateTimeColumn = ["Start Time", "End Time"]
  tableData = []
  eventColumn = ["Name"]
  iconHeader = []
  iconColumn = ["Start Time", "End Time"]
  sortColumn = []
  permissionControl = [null];
  selectedblock: any;
  routinesid: any;
  floorData: any = null;
  applyFilterValue: any;
  pageSize = 50;
  pageStart = 0;
  public matTabChangeSub: Subject<any> = new Subject();
  public currentDate = new Date();
  public selectedDate;
  public pageLength;
  parentId: any;
  actualTime: any;

  constructor(public dialog: MatDialog, public commonService: CommonService, public toastr: AppToastService, public hospitalService: HospitalService, public configurationService: ConfigurationService, public datepipe: DatePipe, public worflowService: WorkflowService) {

  }

  ngOnInit() {
    this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    const saved = localStorage.getItem('musteringState');
    if (saved) {
      const state = JSON.parse(saved);
      this.isInitiated = state.isInitiated;
      this.enableCard = state.enableCard;
      this.selectedView = state.selectedView;
      this.typeOfEmergency = state.typeOfEmergency;
      this.hide = state.hide,
      this.routinesid = state.routinesid
      this.routines = state.routines
    }

    this.configurationService.getAllSafetyActivities("TAC-SFE").subscribe(res => {
      this.routines = res.results
    })

    this.hospitalService.getsafelocation("ROU-SFE").subscribe(res => {
      this.assemblyPoints = res.results
      this.sapLocationIds.clear();
      res.results.forEach((sap: any) => {
        if (sap?.locationId) {
          this.sapLocationIds.add(Number(sap.locationId));
        }
      });
    })

    this.hospitalService.getBlockWithFloors().subscribe(res => {
      if (res.statusCode === 1) {
        const block = res.results[0]
        const floorId = block.children[0].id
        this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(res => {
          let temp = res.results.children
          this.floordetails = temp.map((floor: any) => ({
            ...floor,
            count: 0
          }));
          this.parentId = floorId

          this.locationCard = this.floordetails.map(floor => ({
            title: floor.name,
            subtitle: 'Floor',
            count: floor.count,
            countLabel: 'People',
            floorId: Number(floor.id),
            buildingName: floor.name,
            parentId: Number(floorId),
             visitorCount:0,
            employeeCount:0
          }));

          this.locationCard.forEach(card => {
            this.locationCardMap.set(Number(card.floorId), card);
          });


        })
      }
    })
      const id = this.routines[0]?.activityCategoryId
      const now = new Date();
      const formatdate = this.datepipe.transform(now, 'yyyy-MM-dd');
      this.configurationService.getMusteringActivities(id, formatdate, this.pageSize, this.pageStart, "RQT-TASK").subscribe(res => {
        if (res?.results?.length > 0) {
          this.sapData = res?.results?.flatMap(r => r.performer) ?? [];
          this.actualTime = res.results[0].actualTime
          this.startEmergencyTimer(res.results[0].actualTime);
        }
    })
      if(false){       
        this.hospitalService.getBlockWithFloors().subscribe(res => {

          let blocks = res?.results || [];

          if (blocks.length > 0) {
            this.selectedView = 'blocks';
            this.blocks = blocks.map((block: any) => ({
              ...block,
              count: 0,
              countLabel: 'People'
            }));

            this.locationCard = this.blocks.map(block => ({
              title: block.name,
              subtitle: 'Block',
              count: 0,
              countLabel: 'People',
              blockId: block.id,
              buildingName : block.name
            }));

            this.locationCard.forEach(card => {
              this.locationCardMap.set(card.blockId, card);
            });

          }

          if (blocks.length === 0) {
            this.selectedView = 'floors';
            this.selectedBlockId = blocks[0].id;
            this.selectedblock = blocks[0]

            let temp = blocks[0]?.children || [];

            this.floordetails = temp.map((floor: any) => ({
              ...floor,
              count: 0
            }));

            this.floordetails.forEach(floor => {
              this.floordetailsMap.set(Number(floor.id), floor);
            });

            this.locationCard = this.floordetails.map(floor => ({
              title: floor.name,
              subtitle: 'Floor',
              count: floor.count,
              countLabel: 'People',
              floorId: Number(floor.id),
              buildingName : floor.name
            }));

            this.locationCard.forEach(card => {
              this.locationCardMap.set(Number(card.floorId), card);
            });
          }
        });
        let param = '/cloc=' + 1 + '&flr=' + 607;
        this.commonService.getReportData('totaltimebylocv2', param).subscribe(res => {
          if (res.results?.statusCode == 200) {
          }
        });

        this.hospitalService.getBlockWithFloors().subscribe(res => {
          console.log(res)
        })
    }
    this.commonService.getmqttBroker().subscribe(res => {
      if (res.results?.length) {
        let brokerInfo = res.results.find((val: any) => val.brokerTypeId == "BT-CL");
        let cloudConnect = {
          protocol: brokerInfo['wprotocol'],
          host: brokerInfo['host'],
          password: brokerInfo['password'],
          username: brokerInfo['username'],
          port: brokerInfo['wport'],
          connectTimeout: 30000,
          keepalive: 60
        };
        this.client = connect(cloudConnect);


        let topicName = 'tw/tag/location_nav/' + localStorage.getItem(btoa('facilityId')) + '/#';
        this.client.subscribe(topicName);

        this.client.on('message', (topic: any, message: any) => {
          try {
            const msg = message.toString();
            const tagDataArr = JSON.parse('[' + msg + ']');
            console.log(tagDataArr)
            const tagData = tagDataArr[0];

            if (tagData?.flr && tagData?.fid === this.facilityId  ) {
              const locationId = Number(tagData.lid) || null;
              console.log(tagData)
              const tagtype = tagData.ttp === "TAT-ST" ? "EMPLOYEE" : "VISITOR"
              this.updateFloorCount(tagData.lid, tagData.tid, locationId, tagData.blk, tagtype);
            }
          } catch (err) {
            console.error("MQTT parse error:", err);
          }
        });

      } else {
        res.message = 'mqtt ' + res.message;
        this.toastr.warning('Warning', `${res.message}`);
      }
    });
  }

  eventAction(event) {
    console.log(event);
    if (event.key === 'Name') {
      const dialogRef = this.dialog.open(MusteringHistoryComponent, { data: event.data, panelClass: ['medium-popup'], disableClose: true });
    }
  }

  tabChanged(event) {
    console.log(event);
    if (event.index === 0) {
       this.getMustering()
    } else if (event.index === 1) {
      this.getHistory()
      this.selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    } else if (event.index === 2) {
      this.floorData = {
        content: 'floorplan',
        floorId: this.parentId,
        editable: false,
        header : false 
      };
    }
  }

  getHistory() {
    this.configurationService.getMusteringHistory(this.selectedDate, this.pageStart, this.pageSize).subscribe(res => {
      this.tableData = res.results
      const Columns = ['activityName', 'requestedBy', 'startTime', 'endTime', 'status']
      this.tableData.map(data => {
        Columns.forEach((col, index) => {
          data[this.historyColumns[index]] = data[col]
        })
      })
      this.pageLength = this.tableData.length
      console.log(this.pageLength)
    })
  }

  dashboardData = [
    { label: 'Total People', value: 0, },
    { label: 'Employees in Campus', value: 0 },
    { label: 'Visitors in Campus', value: 0 },
    { label: 'At Assembly Points', value: 0 }
  ];

  employeedashboardData = [
    { label: 'Total people', value: 0, },
    { label: 'Employees in Campus', value: 0 },
    { label: 'Visitors in Campus', value: 0 }
  ];

  buildingWiseData = [
  ];

  eventType(data: any) {
    this.typeOfEmergency = data.name
    this.routineId = data.id
    this.enableCard = true
  }


  updateFloorCount(newFloorId: number, tagId: string, locationId, blockId, tagType: 'EMPLOYEE' | 'VISITOR') {
    newFloorId = Number(newFloorId);
    tagId = String(tagId);
    blockId = Number(blockId);

    this.tagLastSeen.set(tagId, Date.now());

    const previousFloorId = this.tagFloorMap.get(tagId);
    const previousLocId = this.tagLocationMap.get(tagId);

    if (previousLocId && this.sapLocationIds.has(previousLocId)) {
      const prevSapSet = this.sapTags.get(previousLocId);
      if (prevSapSet && prevSapSet.has(tagId)) {
        prevSapSet.delete(tagId);
        const prevSapObj = this.assemblyPoints.find(s => Number(s.locationId) === previousLocId);
        if (prevSapObj && prevSapObj.count > 0) prevSapObj.count--;
      }
    }


    if (previousFloorId) {
      if (previousFloorId !== newFloorId || (locationId && this.sapLocationIds.has(locationId))) {
        const prevSet = this.floorTags.get(previousFloorId);
        if (prevSet?.has(tagId)) {
          prevSet.delete(tagId);

          const emp = Array.from(prevSet).filter(
            id => this.tagTypeMap.get(id) === 'EMPLOYEE'
          ).length;

          const vis = prevSet.size - emp;

          this.updateLocationCardCount(previousFloorId, emp, vis);
        }

      }
    }
    const previousBlockId = this.getBlockIdByTag(tagId);
    if (previousBlockId && previousBlockId !== blockId) {
      const prevBlockSet = this.blockTags.get(previousBlockId);
      if (prevBlockSet?.has(tagId)) prevBlockSet.delete(tagId);

      const block = this.blocks.find(b => b.id === previousBlockId);
      if (block) block.count = this.blockTags.get(previousBlockId)?.size || 0;
    }

    if (locationId && this.sapLocationIds.has(locationId)) {
      if (!this.sapTags.has(locationId)) this.sapTags.set(locationId, new Set());
      const sapSet = this.sapTags.get(locationId)!;



      if (!sapSet.has(tagId)) {
        sapSet.add(tagId);
        const sapObj = this.assemblyPoints.find(s => Number(s.locationId) === locationId);
        if (sapObj) sapObj.count = (sapObj.count || 0) + 1;
      }

      const floorSet = this.floorTags.get(newFloorId);
      if (floorSet && floorSet.has(tagId)) floorSet.delete(tagId);

      const floor = this.floordetailsMap.get(newFloorId);
      if (floor) floor.count = this.floorTags.get(newFloorId)?.size || 0;

      const card = this.locationCardMap.get(newFloorId);
      if (card) card.count = this.floorTags.get(newFloorId)?.size || 0;

      this.tagFloorMap.delete(tagId);
      const blockSet = this.blockTags.get(blockId);
      if (blockSet?.has(tagId)) blockSet.delete(tagId);
    } else {

      if (!this.floorTags.has(newFloorId)) {
        this.floorTags.set(newFloorId, new Set());
      }
      this.floorTags.get(newFloorId)!.add(tagId);

      const set = this.floorTags.get(newFloorId)!;

      const emp = Array.from(set).filter(
        id => this.tagTypeMap.get(id) === 'EMPLOYEE'
      ).length;

      const vis = set.size - emp;

      this.updateLocationCardCount(newFloorId, emp, vis);


      if (!this.blockTags.has(blockId)) this.blockTags.set(blockId, new Set());
      this.blockTags.get(blockId)!.add(tagId);

      const block = this.blocks.find(b => b.id === blockId);
      if (block) block.count = this.blockTags.get(blockId)!.size;

      this.setBlockIdByTag(tagId, blockId);
      this.tagFloorMap.set(tagId, newFloorId);
    }

    if (locationId) {
      this.tagLocationMap.set(tagId, locationId);
    }
    this.tagTypeMap.set(tagId, tagType);
    this.updateDashboardCounts();
  }


  getLocation(floorId) {
    this.selectedView = 'locations'
    this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(res => {
      if (!res || !res.results || res.results.children.length === 0) {
        this.toastr.info('No locations under this floor.');
        return;
      }

      let temp = res.results.children
      this.selectedFloorLocations = temp.map(
        (loc: any) => ({
          title: loc.name,
          subtitle: loc.locationTypeName || '',
          count: 0,
          countLabel: 'People',
          floorId: loc.id
        }));

      this.selectedView = 'locations';

      this.selectedFloorLocations.forEach(card => {
        this.locationCardMap.set(Number(card.floorId), card);
      });
    });

  }


  toggleInitiate() {
    const routine: any = this.routines.find(l => l.id === this.routineId)
    const now = new Date();
    const formattime = this.datepipe.transform(now, 'yyyy-MM-dd HH:mm:ss');
    const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const scheduleEndTime = this.datepipe.transform(endDate, 'yyyy-MM-dd HH:mm:ss');
    const createRoutine = {
      "pfActivityId": routine.id,
      "type": "RQT-TASK",
      "comments": null,
      "requestCategory": "PR-GN",
      "isautoAssigned": false,
      "isAutoComplete": false,
      "title": routine.name,
      "scheduleStartTime": formattime,
      "scheduleEndTime": scheduleEndTime,
      "scheduleActivityTypeId": "SAT-BTM",
      "priorityLevelId": routine.priorityLevelId
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true, height: '220px',
      data: {
        title: 'Confirm Emergency',
        message: 'Are you sure you want to proceed with emergency mustering?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 0,
        formStatusEnable: true,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] == 'Yes') {
        this.commonService.saveTask(createRoutine).subscribe(res => {
          if (res.statusCode === 1) {
            this.routinesid = res.results.requestId
            setTimeout(() => {
              this.hide = true
            }, 400);
            setTimeout(() => {
              this.isInitiated = true;
            }, 300);
            // this.startEmergencyTimer()
            const state = {
              isInitiated: true,
              enableCard: this.enableCard,
              selectedView: this.selectedView,
              typeOfEmergency: this.typeOfEmergency,
              routinesid: this.routinesid,
              hide: true,
              routines:this.routines
            };
            localStorage.setItem('musteringState', JSON.stringify(state));
            const id = this.routines[0].activityCategoryId
            const now = new Date();
            const formatdate = this.datepipe.transform(now, 'yyyy-MM-dd');
            this.configurationService.getMusteringActivities(id, formatdate, this.pageSize, this.pageStart, "RQT-TASK").subscribe(res => {
              if (res.results) {
                this.sapData = res?.results?.flatMap(r => r.performer) ?? [];
                console.log(res.results.actualTime)
                console.log(this.emergencyDuration)
                this.actualTime = res.results[0].actualTime
                this.startEmergencyTimer(res.results[0].actualTime);
              }
            })
          }
        }, error => {
          this.hide = false;
          this.initiated = false;
          this.toastr.error('Error', `${error.error.message}`);
        })
      } else {
        this.enableCard = false
      }
    });
  }

  completeEmergency() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        title: 'Complete Emergency',
        message: 'Are you sure you want to Complete the Emergency Action?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 1,
        formStatusEnable: true,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] == 'Yes') {
        const data = {
          "type": "RQT-TASK",
          "status": "RQ-CO",
          "remarks": ""
        }
        this.commonService.updateTask(this.routinesid, data).subscribe((res) => {
          this.enableCard = false
          this.isInitiated = false
          this.initiated = false
          this.hide = false
          localStorage.removeItem('musteringState');
        })
      }
    });
  }

  cancelEmergency() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true, height: '220px',
      data: {
        title: 'Cancel Emergency',
        message: 'Are you sure you want to cancel the Emergency Action?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        isRemark: 0,
        formStatusEnable: true,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result['confirmButtonText'] == 'Yes') {
        const data = {
          "type": "RQT-TASK",
          "status": "RQ-CA",
          "remarks": ""
        }
        this.commonService.updateTask(this.routinesid, data).subscribe((res) => {
          this.enableCard = false
          this.isInitiated = false
          this.initiated = false
          this.hide = false
          localStorage.removeItem('musteringState');
        })
      }
    });
  }

  ngOnDestroy(): void {
    if (this.client) {
      this.client.end(true, () => {
        /** determines the mqtt client console.log('MQTT client disconnected cleanly');*/
      });
    }

    const state = {
      isInitiated: this.isInitiated,
      enableCard: this.enableCard,
      selectedView: this.selectedView,
      typeOfEmergency: this.typeOfEmergency,
      hide: this.hide,
      routinesid: this.routinesid,
      routines : this.routines
    };
    localStorage.setItem('musteringState', JSON.stringify(state));

  }



 updateDashboardCounts() {
  let totalPeople = 0;

  let employeeTotal = 0;
  let employeeInCampus = 0;
  let employeeAtSAP = 0;

  let visitorTotal = 0;
  let visitorInCampus = 0;
  let visitorAtSAP = 0;

  this.tagLocationMap.forEach((locId, tagId) => {
    const type = this.tagTypeMap.get(tagId) ?? 'EMPLOYEE';

    totalPeople++;

    if (type === 'EMPLOYEE') {
      employeeTotal++;
      if (this.sapLocationIds.has(locId)) {
        employeeAtSAP++;
      } else {
        employeeInCampus++;
      }
    }

    if (type === 'VISITOR') {
      visitorTotal++;
      if (this.sapLocationIds.has(locId)) {
        visitorAtSAP++;
      } else {
        visitorInCampus++;
      }
    }
  });


  this.dashboardData[0].value = totalPeople;                 
  this.dashboardData[1].value = employeeInCampus;           
  this.dashboardData[2].value = visitorInCampus;             
  this.dashboardData[3].value = employeeAtSAP + visitorAtSAP;
 
  this.employeedashboardData[0].value = totalPeople;        
  this.employeedashboardData[1].value = employeeInCampus;    
  this.employeedashboardData[2].value = visitorInCampus;     
}



  openFloorMap(floorId: number) {
    let data = {}
    data['content'] = 'floorplan';
    data['floorId'] = floorId;
    data['editable'] = false;

    this.dialog.open(CommonDialogComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
  }

  getTotalPeople(): number {
    return Object.keys(this.tagLocationMap).length;
  }

  onBlockSelected(blockId: number) {
    this.selectedBlockId = blockId;
    this.selectedView = 'floors';

    const block = this.blocks.find(b => b.id === blockId);
    this.selectedblock = block


    this.locationCard = [];
    this.locationCardMap.clear();

    if (block && block.children) {
      this.locationCard = block.children.map((floor: any) => {
        const floorId = Number(floor.id);
        const count = this.floorTags.get(floorId)?.size || 0;

        return {
          title: floor.name,
          count: count,
          countLabel: 'People',
          floorId: floorId,
          ...floor
        };
      });

      this.locationCard.forEach(card => {
        this.locationCardMap.set(card.floorId, card);
      });
    }
  }


  back() {
    if (this.selectedView === 'locations') {
      this.selectedView = 'floors';
    } else if (this.selectedView === 'block-floors') {
      this.selectedView = 'blocks';
      this.selectedBlockId = null;
      this.selectedBlockFloors = [];
    }
  }
  private readonly tagBlockMap: Map<string, number> = new Map();

  getBlockIdByTag(tagId: string): number | null {
    return this.tagBlockMap.get(tagId) || null;
  }

  setBlockIdByTag(tagId: string, blockId: number | null) {
    if (blockId != null) {
      this.tagBlockMap.set(tagId, blockId);
    } else {
      this.tagBlockMap.delete(tagId);
    }
  }
  onViewChange(event) {
    if (event === 'blocks') {
      this.selectedblock = null
    }
  }

  headerEventAction(event) {
    if (event.key === 'applyFilter') {
      this.applyfilter(event.data)
    }
    if (event.key === 'refreshPage') {
      this.getHistory()
    }
    if (event.key === 'dateFilter') {
      this.selectedDate = this.datepipe.transform(event.data, 'yyyy-MM-dd');
      this.getHistory()
    }
  }
  applyfilter(filterValue) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  rowClick(event) {
    console.log(event)
  }

  onClearSelectedBlock(event: MouseEvent) {
    event.stopPropagation();
    this.selectedblock = null;
    this.selectedView = 'blocks';

  }

  emergencyDuration: string = "00:00:00";
  private timerInterval: any;
  private startTime!: number;

  startEmergencyTimer(actualTime: string) {
  this.stopEmergencyTimer(); // avoid multiple intervals
    console.log(actualTime)
  // ORIGINAL start time (never changes)
  this.startTime = new Date(actualTime.replace(' ', 'T')).getTime();
  this.timerInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - this.startTime;

    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const seconds = Math.floor((elapsed / 1000) % 60);

    this.emergencyDuration =
      `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }, 1000);
}
stopEmergencyTimer() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
}

 pad(num: number) {
  return num < 10 ? '0' + num : num;
}


  private updateLocationCardCount(
    floorId: number,
    empCount: number,
    visCount: number
  ) {
    const card = this.locationCardMap.get(floorId);
    if (!card) return;

    card.employeeCount = empCount;
    card.visitorCount = visCount;
    card.count = empCount + visCount;
  }


  getMustering(){
     console.log("this is calling ")
      this.configurationService.getAllSafetyActivities("TAC-SFE").subscribe(res => {
        this.routines = res.results
      })

      this.hospitalService.getsafelocation("ROU-SFE").subscribe(res => {
        this.assemblyPoints = res.results
        this.sapLocationIds.clear();
        res.results.forEach((sap: any) => {
          if (sap?.locationId) {
            this.sapLocationIds.add(Number(sap.locationId));
          }
        });
      })

      this.hospitalService.getBlockWithFloors().subscribe(res => {
        if (res.statusCode === 1) {
          const block = res.results[0]
          const floorId = block.children[0].id
          this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(res => {
            let temp = res.results.children
            temp = temp.filter(res => res.locationTypeId === 25)
            this.floordetails = temp.map((floor: any) => ({
              ...floor,
              count: 0
            }));

            this.parentId = floorId
            this.locationCard = this.floordetails.map(floor => ({
              title: floor.name,
              subtitle: 'Floor',
              count: floor.count,
              countLabel: 'People',
              floorId: Number(floor.id),
              buildingName: floor.name,
              visitorCount:0,
              employeeCount:0,
              parentId : Number(floorId)
            }));

            this.locationCard.forEach(card => {
              this.locationCardMap.set(Number(card.floorId), card);
            });


          })
        }
      })
      
      this.commonService.getmqttBroker().subscribe(res => {
      if (res.results?.length) {
        let brokerInfo = res.results.find((val: any) => val.brokerTypeId == "BT-CL");
        let cloudConnect = {
          protocol: brokerInfo['wprotocol'],
          host: brokerInfo['host'],
          password: brokerInfo['password'],
          username: brokerInfo['username'],
          port: brokerInfo['wport'],
          connectTimeout: 30000,
          keepalive: 60
        };
        this.client = connect(cloudConnect);


        let topicName = 'tw/tag/location_nav/' + localStorage.getItem(btoa('facilityId')) + '/#';
        this.client.subscribe(topicName);

        this.client.on('message', (topic: any, message: any) => {
          try {
            const msg = message.toString();
            const tagDataArr = JSON.parse('[' + msg + ']');
            // console.log(tagDataArr)
            const tagData = tagDataArr[0];

            if (tagData?.flr && tagData?.fid === this.facilityId  ) {
              const locationId = Number(tagData.lid) || null;
              // console.log(tagData)
              const tagtype = tagData.ttp === "TAT-ST" ? "EMPLOYEE" : "VISITOR"
              this.updateFloorCount(tagData.lid, tagData.tid, locationId, tagData.blk, tagtype);
            }
          } catch (err) {
            console.error("MQTT parse error:", err);
          }
        });

      } else {
        res.message = 'mqtt ' + res.message;
        this.toastr.warning('Warning', `${res.message}`);
      }
    });
  }

}
