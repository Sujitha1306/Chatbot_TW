import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonService, ConfigurationService, DashboardService } from '../shared';
import { NavigationStart, Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { connect, MqttClient } from 'mqtt';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AppToastService } from '../shared/services/toaster.service';
import { SpeechQueueService } from '../shared/speech-queue.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-room-display',
  templateUrl: './room-display.component.html',
  styleUrls: ['./room-display.component.scss']
})
export class RoomDisplayComponent implements OnInit, AfterViewInit, OnDestroy {

  public selectedLocation = null;
  public locationName = null;
  public locationList = [];
  public waitingList = [];
  public inprogressList = [];
  showOption = false;
  refreshDetail =  {
      'interval' : null,
      'is_active' : true,
      'updateInterval' : 10,
      'lastUpdate' : null
    }
  refreshInterval: any = null;
  facilityId = null;
  private client : MqttClient;
  isMultiLoc = false;
  colCount = 2;
  rowCount = 6;
  multiLocationList: any[];
  rowsPerPage = 1;
  pageSize = 1;
  currentPage = 0;
  isFlipping: boolean = false;
  resizeTimer: any;
  autoFlipInterval = null;
  onLoading = true;
  onLoadFliper = true;
  showUhid = true;
  uhidTextSize = "4.5vh";
  statusTextSize = "3.5vh";
  tokenNumTextSize = "4vh";
  locationTextSize = "3vh";
  billTokenNumTextSize = "10vh";
  billLocationTextSize = "8vh";
  billStatusTextSize = "6vh";
  viewType = 'card';
  isPopupOpen = false;
  public configForm: FormGroup;
  configData: any;
  configDataId: any;
  runningText: string = "We Request you to  kindly return the tag after completing your test in Billing Reception.";
  runTextColor = "#595d60";
  type = null;
  configFacilityId = null;
  title = 'Queue Live';
  isSpeaking = false;
  enableSpeak = false;
  speak = null;
  speechPage = null;
  viewStatus = false;
  mainHeaderColor = "#13c7b7";
  subHeaderColor = '#13c7b7';
  contentBgColor = "white"
  contentTextColor = "#565656"
  contentStatusRGColor = "#00a3c7";
  contentStatusIPColor = "#13c7b7";
  contentTokenBgColor = "#fafdfd";
  isNew = false;
  public visitTypeIds = new FormControl([]);
  visitTypes = [];
  visitTypesList: any=[];
  topicName = null;
  // Speech queue controller
  isProcessingQueue = false;
  speechDedup = new Set<string>();
  mqttUpdateTimer: any = null;
  routerSub: Subscription | null = null;
  newBackgroundColor = '#a28970';
  newColor = '#fff';
  newFooterColor = '#6b584b';
  watermarkLogo = null;
  onlineAppNumber = null;
  helplineLogo = null;
  mainLogo = null;

  constructor(public dashboardService: DashboardService, private readonly router: Router, public dialog: MatDialog, public commonService : CommonService, private cdr: ChangeDetectorRef,
    public form: FormBuilder, private readonly configurationService: ConfigurationService, public toastr: AppToastService, private speechQueue: SpeechQueueService, private routers: Router) {
    let userId = localStorage.getItem(btoa('userId'));
    let roleId = localStorage.getItem('userlevel');
    this.facilityId = localStorage.getItem(btoa('facilityId'));
    this.commonService.getUserPreference(userId, roleId);
  }
  @HostListener('document:click', ['$event', '$event.target'])	
	onClick(event: MouseEvent, targetElement: HTMLElement) {
      if(event?.target['alt'] !== "vertical-icon") {
        this.showOption = false;
      }
    }
  private beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    this.speechQueue.clear();
    try {
      window.speechSynthesis?.cancel();
    } catch (e) {
      console.warn('Error cancelling speech on unload', e);
    }
  };
  ngOnInit(): void {
    this.commonService.getAppTermsVerion2('VisitType').subscribe(res => {
      this.visitTypesList = res.results;
    });
    this.getInterval();
    this.getAllLocation();
    this.buildForm();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.routerSub = this.routers.events
    .pipe(filter(e => e instanceof NavigationStart))
    .subscribe((e: NavigationStart) => {
      if (e.url !== this.router.url) {
        this.speechQueue.clear();
        try {
          window.speechSynthesis?.cancel();
        } catch (err) {
          console.warn('Error cancelling speech on navigation', err);
        }
      }
    });
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculatePageSize();
    }, 100);
  }

  getSelectedCount(): number {
    return this.visitTypeIds?.value?.length || 0;
  }

  isSelected(code: string): boolean {
    return this.visitTypeIds?.value?.includes(code);
  }

  onMenuClose() {
    this.getMultiLocList();
  }

  onCheckboxChange(event: any, code: any) {
    let selected = this.visitTypeIds.value || [];
    if (event.checked) {
      selected = [...selected, code];
    } else {
      selected = selected.filter((item: any) => item !== code);
    }
    this.visitTypeIds.setValue(selected);
  }

  buildForm(){
    this.configForm = this.form.group({
      title: [this.title],
      column: [this.colCount],
      row: [this.rowCount],
      runningText: [this.runningText]
    })
  }

  autoSlide(){
    this.autoFlipInterval = setInterval(() => {
      if(this.isSpeaking) {
        return;
      }
      if (this.totalPages > 1) {
        const nextPage = (this.currentPage + 1) % this.totalPages;
        if(nextPage === 0){
          this.getMultiLocList();
        }
        this.goToPage(nextPage);
      } else {
        this.getMultiLocList();
      }
    }, 10000);
  }

  onResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.calculatePageSize(), 100);
  }

  calculatePageSize() {
  setTimeout(() => {
    const cardEl = document.querySelector('.loc-card-box') as HTMLElement;
    const topBar = document.querySelector('.top-bar') as HTMLElement;
    const footer = document.querySelector('.footer') as HTMLElement;

    // Default fallback heights if elements aren't rendered yet
    const topBarHeight = topBar?.offsetHeight || (window.innerHeight * 0.10);
    const footerHeight = footer?.offsetHeight || (window.innerHeight * 0.08);
    const availableHeight = window.innerHeight - topBarHeight - footerHeight - 25;
    if (cardEl) {
      const cardHeight = cardEl.offsetHeight + 15; // include margin/gap buffer between cards
      const rowsPerPage = Math.floor(availableHeight / cardHeight);

      this.rowsPerPage = rowsPerPage > 0 ? rowsPerPage : 1;
      this.pageSize = this.colCount * this.rowsPerPage;
    }
    if(this.viewType === 'list'){
      this.pageSize = this.colCount * this.rowCount;
    }
  }, 20);
}

  getUserPreference(key = 'displayLocation', value = this.selectedLocation) {
    const preference = this.commonService.userPreference;
    const postData = {
      'key': key,
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value': JSON.stringify({
        'locationId' : value,
        'multiLocation' : this.isMultiLoc}
      )      
    };
    if (preference != null && value) {
      if (preference.hasOwnProperty(key)) {
        if (preference[key].value !== value) {
          const id = preference[key].id;
          this.commonService.updateUserPreference(id, postData).subscribe(res => {
            this.commonService.userPreference = res.results;
            this.checkInterval();
          });
        } else {
          this.checkInterval();
        }
      } else {
        this.savePreference(postData);
      }
    } else {
      this.savePreference(postData);
    }
  }
  savePreference(postData) {
    if(postData.value == null) {
      this.selectedLocation = this.locationList[0].id;
      this.locationName = this.locationList.filter(val => val.id == this.selectedLocation)[0].name;
      postData.value = this.selectedLocation;
    }
    this.commonService.saveUserPreference(postData).subscribe(res => {
      this.commonService.userPreference = res.results;
      this.getLocationDetails();
    });
  }
  getMqtt() {
    if(this.client) {
        this.client.end(true);
    }
    this.commonService.getmqttBroker().subscribe(res=> {
      if (res.results != null && res.results.length) {
          let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
          let cloudConnect = {
              protocol        : brokerInfo[0]['wprotocol'],
              host            : brokerInfo[0]['host'],
              password        : brokerInfo[0]['password'],
              username        : brokerInfo[0]['username'],
              port            : brokerInfo[0]['wport'],
              connectTimeout  : 30000,
              keepalive       : 60
          }
          this.client = connect(cloudConnect);
          this.mqttSubscribe()
      } else {
          res.message = 'mqtt ' + res.message;
      }
    })
  }
  mqttSubscribe() {
    if(this.type !== 'token') {
      if (this.selectedLocation != null && !this.isMultiLoc) {
        if(this.topicName) {
          this.client.unsubscribe(this.topicName)
        }
        this.topicName = 'tw/tag/queue/' + this.facilityId + '/' + this.selectedLocation + '/#';
        this.client.subscribe(this.topicName)
        this.client.on('message', (topic, message) => {
          const msg = message.toString();
          const jsonData = JSON.parse(msg);
          this.checkInterval()
        })
      }
      if (this.isMultiLoc) {
        if(this.topicName) {
          this.client.unsubscribe(this.topicName)
        }
        this.topicName = 'tw/tag/queue/' + this.facilityId + '/#';
        this.client.subscribe(this.topicName);
        this.client.on('message', (topic, message) => {
          const msg = message.toString();
          const jsonData = JSON.parse(msg);
          if (!jsonData) return;

          const tokenCacheData = this.multiLocationList.find(f => f.id === jsonData.patient_id);
          if (!tokenCacheData) return;

          if (jsonData.location_id) {
            const cacheLocation = this.locationList.find(f => f.id === jsonData.location_id)
            if (cacheLocation) {
              tokenCacheData.locationName = cacheLocation.name;
            }
          }
          tokenCacheData.visitStatusId = jsonData.status;
          tokenCacheData.queueStatusId = jsonData.status;

          this.multiLocationList = [...this.multiLocationList];
        })
      }       
    } else if (this.type === 'token') {
      if(this.topicName) {
        this.client.unsubscribe(this.topicName)
      }
      this.topicName = 'tw/cache/gw/' + this. facilityId + '/#';
      this.client.subscribe(this.topicName)
      this.client.on('message', (topic, message) => {
        const msg = message.toString();
        const jsonData = JSON.parse(msg);
        if(jsonData?.ctx === 'Token') {
          this.scheduleRefreshFromMqtt()
        }
      })
    }
  }

  private scheduleRefreshFromMqtt() {
  if (this.mqttUpdateTimer) return;
  this.mqttUpdateTimer = setTimeout(() => {
    this.mqttUpdateTimer = null;
    this.getMultiLocList();
  }, 300); // tune debounce as needed
}

  getAllLocation() {
    this.dashboardService.getHealthPlanLocations().subscribe(res => {
      if (res.statusCode === 1) {
        this.locationList = res.results;
        let preference = this.commonService.userPreference;
        this.onLoading = false;
        if(preference) {
          if (preference.hasOwnProperty('displayLocation')) {
            if (preference['displayLocation']['value'].includes('multiLocation')) {
              let jsonValue = JSON.parse(preference['displayLocation']['value']);
              this.isMultiLoc = jsonValue['multiLocation'];
              if (jsonValue.locationId == null) {
                this.selectedLocation = this.locationList[0].id;
                this.locationName = this.locationList[0].name;
              } else {
                this.selectedLocation = jsonValue['locationId'];
              }
              if (this.isMultiLoc) {
                this.getMultiLocList();
              } else {
                this.getLocationDetails();
              }
            }
            else {
              this.selectedLocation = preference['displayLocation'].value;
            }
            this.locationName = this.locationList.filter(val => val.id == this.selectedLocation)[0]?.name;
          } else {
            this.selectedLocation = this.locationList[0].id;
            this.locationName = this.locationList[0].name;
          }
        }
        this.getMqtt();
        this.getUserPreference();        
      }
    });

  }
  getLocationDetails() {
    this.waitingList = [];
    this.inprogressList = [];
    this.dashboardService.getHpLocationDetailbyIds(this.selectedLocation).subscribe(res => {
      if(res.statusCode === 1) {
        this.onLoading = false;
        if(res.results.hasOwnProperty('Waiting') == false) {
          res.results.Waiting = [];
        }
        this.refreshDetail.lastUpdate = new Date();
        if (res.results.Inprogress.length == 0) {
          if (res.results.Waiting.filter(val => val.patientStatusId == "QS-RG").length == 1) {
            this.waitingList = res.results.Waiting.filter(val => val.patientStatusId != "QS-RG");
            this.inprogressList = res.results.Waiting.filter(val => val.patientStatusId === "QS-RG");
          } else if (res.results.Waiting.filter(val => val.patientStatusId == "QS-RG").length >= 1) {
            this.inprogressList = [res.results.Waiting.filter(val => val.patientStatusId === "QS-RG")[0]];
            this.waitingList = res.results.Waiting.filter(val => val.uhid != this.inprogressList[0].uhid);
          }
        } else {
          if(res.results.Inprogress.length == 1) {
            this.inprogressList = res.results.Inprogress;
            this.waitingList = res.results.Waiting;
          } else {
            this.inprogressList = [res.results.Inprogress[0]];
            this.waitingList = [...res.results.Inprogress.slice(res.results.Inprogress.length - 1), ...res.results.Waiting];
          }
          
        }
      }
    });
  }
  
  getMultiLocList() {
    this.dashboardService.getAllmultipleLocationDQ(this.type, this.visitTypeIds?.value).subscribe(res => {
      const allPatients = res.results;
      const sortedByVisitToken = allPatients.sort((a, b) => {
        return Number(a.visitTokenNo) - Number(b.visitTokenNo);
      });
      this.multiLocationList = sortedByVisitToken
      setTimeout(() => {
        this.refreshDetail.lastUpdate = new Date();
        this.calculatePageSize()
        const list = this.paginatedList();
        this.playAudioStatus(list);
        if(this.onLoadFliper){
          this.autoSlide()
        }
        this.onLoadFliper = false
      }, 50);
    });
  }
  refresh() {
    this.showOption = false;
    this.speechPage = null;
    if(!this.isMultiLoc){
      this.getLocationDetails();
    } else {
      this.getMultiLocList();
    }
  }
  getInterval() {
    this.commonService.getConfigFile('ui-refresh').subscribe(res => {
      let menuCode = 'MN_DQRD';
      if (res && res.results ) {
        const contentData = JSON.parse(res.results.content);
        this.configDataId = res.results['ids']
        this.configData = contentData
        this.configFacilityId = res.results.facilityId
        if (contentData.hasOwnProperty(menuCode)){
          if(contentData[menuCode].hasOwnProperty('visitTypeFilter')) {
            const visitType = contentData[menuCode]['visitTypeFilter'];
            this.visitTypes = this.visitTypesList.filter(x => visitType.includes(x.code));
          } else {
            this.visitTypes = this.visitTypesList;
          }
          if(contentData[menuCode].hasOwnProperty('isNewVersion')) {
            this.isNew = contentData[menuCode]['isNewVersion'];
          }
          if (contentData[menuCode].hasOwnProperty('newVersion')) {
            const newVersion = contentData[menuCode]['newVersion'];

            if (newVersion.hasOwnProperty('newBackgroundColor')) {
              this.newBackgroundColor = newVersion['newBackgroundColor'];
            }
            if (newVersion.hasOwnProperty('newColor')) {
              this.newColor = newVersion['newColor'];
            }
            if (newVersion.hasOwnProperty('newFooterColor')) {
              this.newFooterColor = newVersion['newFooterColor'];
            }
            if (newVersion.hasOwnProperty('onlineAppNumber')) {
              this.onlineAppNumber = newVersion['onlineAppNumber'];
            }
            if (newVersion.hasOwnProperty('watermarkLogo')) {
              this.watermarkLogo = newVersion['watermarkLogo']; // will be null here — correct per this payload
            }
            if (newVersion.hasOwnProperty('mainLogo')) {
              this.mainLogo = newVersion['mainLogo'];
            }
            if (newVersion.hasOwnProperty('helplineLogo')) {
              this.helplineLogo = newVersion['helplineLogo'];
            }
          }
          if(contentData[menuCode].hasOwnProperty('colCount')){
            this.colCount = contentData[menuCode]['colCount']
          }
          if(contentData[menuCode].hasOwnProperty('rowCount')){
            this.rowCount = contentData[menuCode]['rowCount']
          }
          if(contentData[menuCode].hasOwnProperty('runText')){
            this.runningText = contentData[menuCode]['runText']
          }
          if(contentData[menuCode].hasOwnProperty('viewType')){
            this.viewType = contentData[menuCode]['viewType']
          }
          if(contentData[menuCode].hasOwnProperty('runTextColor')){
            this.runTextColor = contentData[menuCode]['runTextColor'];
          }
          if(contentData[menuCode].hasOwnProperty('centralViewType')){
            this.type = contentData[menuCode]['centralViewType'];
          }
          if(contentData[menuCode].hasOwnProperty('mainHeaderColor')){
            this.mainHeaderColor = contentData[menuCode]['mainHeaderColor'];
          }
          if(contentData[menuCode].hasOwnProperty('subHeaderColor')){
            this.subHeaderColor = contentData[menuCode]['subHeaderColor'];
          }
          if(contentData[menuCode].hasOwnProperty('contentBgColor')){
            this.contentBgColor = contentData[menuCode]['contentBgColor'];
          }
          if(contentData[menuCode].hasOwnProperty('contentTextColor')){
            this.contentTextColor = contentData[menuCode]['contentTextColor'];
          }
          if(contentData[menuCode].hasOwnProperty('contentStatusRGColor')){
            this.contentStatusRGColor = contentData[menuCode]['contentStatusRGColor'];
          }
          if(contentData[menuCode].hasOwnProperty('contentStatusIPColor')){
            this.contentStatusIPColor = contentData[menuCode]['contentStatusIPColor'];
          }
          if(contentData[menuCode].hasOwnProperty('contentTokenBgColor')){
            this.contentTokenBgColor = contentData[menuCode]['contentTokenBgColor'];
          }
          if(contentData[menuCode].hasOwnProperty('tokenNumTextSize')){
            this.tokenNumTextSize = contentData[menuCode]['tokenNumTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('locationTextSize')){
            this.locationTextSize = contentData[menuCode]['locationTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('statusTextSize')){
            this.statusTextSize = contentData[menuCode]['statusTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('billTokenNumTextSize')){
            this.billTokenNumTextSize = contentData[menuCode]['billTokenNumTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('billLocationTextSize')){
            this.billLocationTextSize = contentData[menuCode]['billLocationTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('billStatusTextSize')){
            this.billStatusTextSize = contentData[menuCode]['billStatusTextSize'];
          }
          if(contentData[menuCode].hasOwnProperty('viewStatus')){
            this.viewStatus = contentData[menuCode]['viewStatus'];
            if(this.viewStatus && this.type === 'token') {
              this.billTokenNumTextSize = "7vh";
              this.billLocationTextSize = "6vh";
            }
          }
          if(contentData[menuCode].hasOwnProperty('title')){
            this.title = contentData[menuCode]['title'];
          }
          if(contentData[menuCode].hasOwnProperty('speak')){
            this.speak = contentData[menuCode]['speak'];
            this.enableSpeak = contentData[menuCode]['speak']['enableSpeak'];
          }
          if(this.viewType === 'card'){
            if (contentData[menuCode].hasOwnProperty('showUhid')) {
            this.showUhid = contentData[menuCode]['showUhid']
            if(this.showUhid){
              this.rowCount = 3
            }
          }
          if (this.colCount === 5) {
            this.uhidTextSize = "4vh";
            this.statusTextSize = "4vh";
          } else if (this.colCount === 6) {
            this.uhidTextSize = "4vh";
            this.statusTextSize = "3.5vh";
            this.tokenNumTextSize = "4.5vh";
          }
          }
          if(this.colCount === 3) {
            this.locationTextSize = "2.7vh"
          }
          this.refreshDetail['is_active'] = contentData[menuCode].is_active;
          this.refreshDetail['interval'] = contentData[menuCode].interval * 1000;
          this.refreshDetail['updateInterval'] = contentData[menuCode].updateInterval;
          this.refreshDetail['lastUpdate'] = null;
          this.buildForm()          
          this.checkInterval();
        }
        } else {
          // this.getAllLocation()
        }
    });
  }

  checkInterval() {
    if(this.refreshDetail.interval) {      
      this.refreshInterval = setInterval(val =>  {
        if(this.refreshDetail.lastUpdate != null && (this.refreshDetail.updateInterval > Math.floor((new Date().getTime())/1000- Math.floor( this.refreshDetail.lastUpdate.getTime() / 1000)))) {
          console.log(this.refreshDetail.updateInterval, Math.floor((new Date().getTime())/1000 - this.refreshDetail.lastUpdate));          
          return
        }
        if(!this.isMultiLoc) {
          this.getLocationDetails()
        }
      }, this.refreshDetail.interval);
    }
  }

  changeRoom() {
    if (this.autoFlipInterval) {
      clearInterval(this.autoFlipInterval);
      this.autoFlipInterval = null;
    }
    this.isMultiLoc = false;
    this.showOption = false;
    let dialogData  = {
      'locationId' : parseInt(this.selectedLocation),
      locationList : this.locationList
    }
    const dialogRef = this.dialog.open(LocationDialogComponent, {
      data: dialogData,
      panelClass: ["loc-dlg-popup"], width: '350px', height: '250px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => { 
      if(result) {
        this.selectedLocation = result;
        this.locationName = this.locationList.filter(val => val.id == this.selectedLocation)[0].name;
        this.getLocationDetails()
        this.getUserPreference();
        this.mqttSubscribe();
      }
    });

  }

  multiLocationView(){
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null
    }
    this.isMultiLoc = true;
    this.showOption = false;
    this.onLoadFliper = true;
    this.getUserPreference()
    this.getMultiLocList()
    this.mqttSubscribe();
  }

  updatedConfig() {
    this.isPopupOpen = false;
    this.title = this.configForm.controls['title'].value;
    this.colCount = this.configForm.controls['column'].value;
    this.rowCount = this.configForm.controls['row'].value;
    this.runningText = this.configForm.controls['runningText'].value;
    this.configData['MN_DQRD']['title'] = this.title;
    this.configData['MN_DQRD']['colCount'] = this.colCount;
    this.configData['MN_DQRD']['rowCount'] = this.rowCount;
    this.configData['MN_DQRD']['runText'] = this.runningText;
    let confiData = {
      contentData: this.configData,
      ids: this.configDataId,
      facilityId: this.configFacilityId
    }
    this.configurationService.updateConfig('ui-refresh', confiData).subscribe(res =>{
      if(res.statusCode === 1){
        this.toastr.success('Success', `${res.message}`);
        this. clearCache()
      }
    },error => {
        this.toastr.error('Error', `${error.error.message}`);
    });
  }

  clearCache() {
    let data = {}
    this.commonService.clearcache(data).subscribe(res => {
      let msg = 'All cache cleared...'
    }) 
  }

  get totalPages(): number {
    return Math.ceil(this.multiLocationList?.length / this.pageSize);
  }

  paginatedList(): any[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.multiLocationList?.slice(start, end);
  }

  get pageLabel() {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.multiLocationList?.length);
    return `${start}–${end} of ${this.multiLocationList?.length}`;
  }

  get pageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  goToPage(index: number): void {
    if (index < 0 || index * this.pageSize >= this.multiLocationList?.length) return;
    this.currentPage = index;
    this.isFlipping = false;
    setTimeout(() => {
      const list = this.paginatedList();
      this.playAudioStatus(list);
      this.isFlipping = true;
    }, 10);
  }

  playAudioAgain(list?) {
  this.speechPage?.forEach(x => {
    if (x.tokenNo !== list[0]?.tokenNo) {
      this[list[0]?.tokenNo] = true;
    }
    const token = x.tokenNo.split('').join(' ').replace(/\s+/g, ' ').trim();
    const speakText = this.speak['text']
      .replace(/<tokenNo>/g, token)
      .replace(/<queueStatusName>/g, x.queueStatusName)
      .replace(/<locationName>/g, x.locationName ?? '');

    for (let i = 0; i < (this.speak?.repeat || 1); i++) {
      this.speechQueue.enqueue({
        id: `${x.tokenNo}-${Date.now()}-${i}`,
        tokenNo: x.tokenNo,
        text: speakText
      });
    }
  });
}

playAudioStatus(list?) {
  let uniqueInArray1 = [];
  if(this.speechPage != null) {
    this.speechPage = this.speechPage.filter(item1 => {
      const matched = list.find(item2 => item2.tokenNo === item1.tokenNo);
      return matched && matched.queueStatusId === item1.queueStatusId;
    });
    uniqueInArray1 = list.filter(obj1 => !this.speechPage.some(obj2 => obj1.tokenNo === obj2.tokenNo && obj1.queueStatusId === this.speak?.status));
  } else {
    uniqueInArray1 = list;
  }
  if (uniqueInArray1?.length > 0 && this.type === 'token' && this.enableSpeak) {
    const textToSpeak = this.speak['text'];
    const repeat = this.speak?.repeat || 1;
    this.speechPage = list;

    uniqueInArray1.forEach(x => {
      if (x?.queueStatusId === this.speak?.status) {
        const token = x.tokenNo.split('').join(' ').replace(/\s+/g, ' ').trim();
        const speakText = this.speak['text']
          .replace(/<tokenNo>/g, token)
          .replace(/<queueStatusName>/g, x.queueStatusName)
          .replace(/<locationName>/g, x.locationName ?? '');

        for (let i = 0; i < (this.speak?.repeat || 1); i++) {
          this.speechQueue.enqueue({
            id: `${x.tokenNo}-${Date.now()}-${i}`,
            tokenNo: x.tokenNo,
            text: speakText,
            speed: this.speak?.speed,
            voice: this.speak?.voice
          });
        }
      }
    });
  }
}
  
  getMask(value, start=5, end=5, maskChar = '*') {
    if (!value || value.length <= start + end) {
        return value;
      }

      const startStr = value.slice(0, start);
      const endStr = value.slice(-end);
      const maskLength = value.length - (start + end);
      const maskedStr = maskChar.repeat(maskLength);

      return `${startStr}${maskedStr}${endStr}`;
  }
  logout() {
    const lang = localStorage.getItem(btoa('locale'))
    const enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
    localStorage.clear();
    localStorage.setItem(btoa('locale'),lang)
    localStorage.setItem('cookiesAccepted',enabledCookie)    
    this.router.navigate(['/login']);
  }

  updateColCount(change: number, type): void {
    const control = this.configForm.get(type === 'row' ? 'row' : 'column');
    let current = control?.value || 0;
    const updated = current + change;
    if (updated < 0) return;
    control?.setValue(updated);
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
    if (this.client !== undefined) {
      this.client.end(true);
      console.log('MQTT client disconnected');
    }
    clearInterval(this.refreshInterval);
    clearTimeout(this.resizeTimer);
    if (this.autoFlipInterval) {
    clearInterval(this.autoFlipInterval);
    }
  }
  fixClick() {
    console.log('')
  }  
}

@Component({
  selector: 'app-loc-dialog',
  templateUrl: './location-dialog.component.html',
  styleUrls: ['./location-dialog.component.scss']
})
export class LocationDialogComponent implements OnInit {
    public selectedLocation = new FormControl([]);
    searchControl = new FormControl('');
    locationList = [];
    filterLocations = [];

  constructor( @Inject(MAT_DIALOG_DATA) public dialogData: any,
      private readonly dialogRef: MatDialogRef<any>) { 
    // You can inject any services you need here
    if(dialogData && dialogData.locationList) {
      this.locationList = dialogData.locationList;
      this.filterLocations = dialogData.locationList
    }
  }
  ngOnInit(): void {
    this.selectedLocation.setValue(this.dialogData.locationId);
  }

  applyFilter(text: string) {
    const filterValue = text.toLowerCase();
    this.filterLocations = this.locationList.filter(location =>
      location.name.toLowerCase().includes(filterValue) || location.floorName.includes(filterValue)
    );
  }
  openedChange(event) {
    // console.log(event)
  }
  action(type) {
    if(type == 'save') {
      this.dialogRef.close(this.selectedLocation.value);
    } else {
      this.dialogRef.close(null);
    }
  }

}
