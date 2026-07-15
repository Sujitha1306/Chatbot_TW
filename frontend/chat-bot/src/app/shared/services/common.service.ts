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
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { connect } from 'mqtt';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as Crypto from 'crypto-js';
import {encode} from 'js-base64';
import { Router } from '@angular/router';
import { UrlBuilderService } from './url-builder-service.service';
import { AppToastService } from './toaster.service';

@Injectable()
export class CommonService {
  public tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));
  public menuCode=null;
  public _clientMqtt: string;
  public contextChanged = false;
  public floorMap = false;
  public changeAlert = false;
  public changeSummary = false;
  public changeNotify = false;
  public interval;
  public audio = new Audio();
  status: Array<string> = [];
  private _client: any;
  public menuOpen = true;
  public userPreference = null;
  public tagStatusPreference = null;
  public facilityConfig = null;
  // public cloudConnect: any = environment.cloudNetwork;
  // public cloudConnect: any = JSON.parse(localStorage.getItem(btoa('mqtt')));
  facilityId = localStorage.getItem(btoa('facilityId'));
  private readonly alertNotify = new BehaviorSubject([])
  private readonly notifySub = new BehaviorSubject([])
  currentMessage = this.alertNotify.asObservable()
  notifyMsg = this.notifySub.asObservable()
  private readonly dashboardLayout = new BehaviorSubject([])
  layout = this.dashboardLayout.asObservable()
  private readonly dashboardLayoutDept = new BehaviorSubject([])
  department = this.dashboardLayoutDept.asObservable()
  private readonly dashboardId = new BehaviorSubject([])
  dashboard = this.dashboardId.asObservable() 
  private readonly dynamicTableMenu = new BehaviorSubject([])
  dynamicMenu = this.dynamicTableMenu.asObservable() 

  constructor(public toastr: AppToastService, public http: HttpClient,
    private readonly apiService: ApiService, private readonly router: Router, public urlBuilder: UrlBuilderService) {
  }
  cancelRequests() {
    this.apiService.cancelRequests()
  }  
  getDistinctValues<T, K extends keyof T>(array: T[], key: K): T[K][] {
    const values = array.map(item => item[key]);
    return Array.from(new Set(values));
  }
  alertNotification(message) {
    this.alertNotify.next(message)
  }
  notificationMsg(message) {
    this.notifySub.next(message)
  }
  setLayout(message) {
    this.dashboardLayout.next(message)
  }
  setDashboardDept(message) {
    this.dashboardLayoutDept.next(message)
  }
  setDashboard(message) {
    this.dashboardId.next(message)
  }
  shareEditedData(data) {
    this.dynamicTableMenu.next(data)
  }
  getFacilityConfig() {
    this.facilityConfig = null;
    this.apiService.get(environment.base_value.config_url + '/' + 'facility-config')
    .toPromise().then(res => {
      if(res.results){
        this.facilityConfig = res.results.contentObject;
        console.log(res.results.contentObject);
      }
    });
  }
  getUTCNowFormatted(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google && (window as any).google.maps) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src + `&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        (window as any).initMap = () => {
            resolve();
        };
        script.onerror = (error) => reject(error);
    });
  }
  encryptData(data) {
    let result = data
    if(environment.pwd_check) {
      let txt1 = encode(environment.env_key);
      let txt2 = encode(environment.ck);
      let ek = txt1 + txt2 + environment.base_value.lk;
      ek = ek.slice(0,32);
      result = Crypto.AES.encrypt(data, Crypto.enc.Utf8.parse(ek), {
        mode: Crypto.mode.ECB,
        padding: Crypto.pad.Pkcs7
      }).toString(Crypto.Hex);
    }
    return result
  }
  firstTime: boolean = true;
  playAudio(src, volume, loop) {
    if (!this.audio.ended && !this.firstTime) {
      return;
    }
    this.firstTime = false;
    this.audio.src = src;
    this.audio.volume = volume;
    this.audio.load();
    this.audio.play();
    this.audio.loop=loop;
  }
  playAudioCode(srcCode, volumeCode, loopCode) {
    //src Code AUD-F1
    this.audio.src = "assets/audio/" + srcCode + ".wav";
    //volume Code AUD-V1
    const vol = volumeCode.replace("AUD-V", '');
    this.audio.volume = vol / 5;
    //loop Code  AUD-L1 
    this.audio.loop = loopCode === 'AUD-L1';
    this.audio.play();
    // setTimeout(() => { this.audio.loop = false }, 60 * 1000);
  }
 stopAudio() {
      this.audio.loop=false;
      // this.audio.pause();
    }
  mqttConnect() {
    if (environment.env_key === 'prod') {
      // this._client = connect(environment.cloudNetwork[localStorage.getItem(btoa('facilityId'))]);
      // this._client = connect(JSON.parse(localStorage.getItem(btoa('mqtt'))));
      this._client = connect(JSON.parse(this._clientMqtt));
    } else {
      // this._client = connect(environment.cloudNetwork);
      // this._client = connect(JSON.parse(localStorage.getItem(btoa('mqtt'))));
      this._client = connect(JSON.parse(this._clientMqtt));
      return this._client;
    }
  }
  mqttPublish(msg, topic) {
    this._client.on('connect', () => {
      console.log(this._client);
      this._client.publish(topic, msg);
      this.interval = setInterval(val => this.disconnectClient(), 3000);
    });
  }
  disconnectClient() {
    // console.log(this._client)
    this._client.end(true);
    // console.log(this._client)
    clearInterval(this.interval);
  }

  // Component: Mainmenu
  getMenu() {
    return this.getActivePermission('main_menu');
  }
  getMenuItems() {
    this.apiService.get(environment.base_value.menu_item_list)
      .toPromise()
      .then(res => {
        localStorage.setItem(btoa('menuItems'), JSON.stringify(res.results));
      })
      .catch(err => { console.log(err); });
  }
  getMQTTDetails() {
    // return this.apiService.get(environment.base_value.config_url + '/' + 'mqtt-' + environment.env_key);
    this.apiService.get(environment.base_value.config_url + '/' + 'mqtt-' + environment.env_key)
      .toPromise()
      .then(res => {
        if(res.results) {
          this._clientMqtt = JSON.stringify(res.results.contentObject);
        }
        // localStorage.setItem(btoa('mqtt'), JSON.stringify(res.results.contentObject));
      })
      .catch(err => { console.log(err); });
  }
  getRandomCode() {
    let userId = localStorage.getItem(btoa('userId'));
    return this.apiService.post(environment.base_value.user_random_code + '/' + userId, {});
  }

  getMqttCred() {
    return this.apiService.get(environment.base_value.config_url + '/' + 'mqtt-' + environment.env_key);
  }
  getmqttBroker() {
    return this.apiService.get(environment.base_value.get_broker);   
  }
  getTagRequest(queryParam) {
    return this.apiService.get(environment.base_value.get_tag_request + '?' + queryParam);   
  }
  getAllLicense(id, type) {
    return this.apiService.get(environment.base_value.get_all_license + '?identifyingId=' + id + '&identifyingType=' + type);   
  }
  getAppVersion(id?: number, parentId?: number, type?: string) {
    if(parentId !== null && type !== null) {
      return this.apiService.get(environment.base_value.get_app_version + '?parentId=' + parentId + '&type=' + type);
    } else if(type !== null) {
      return this.apiService.get(environment.base_value.get_app_version + '?type=' + type);
    } else {
      return this.apiService.get(environment.base_value.get_app_version + '?id=' + id);
    }
  }
  createLicense(data) {
    return this.apiService.post(environment.base_value.get_all_license, data);
  }
  updateLicense(data, id) {
    return this.apiService.put(environment.base_value.get_all_license + '/' + id, data);
  }
  // Component: Toolbar
  getSearchData(key: string, searchType: string) {
    if (searchType === 'Today') {
      return this.apiService.get(environment.base_value.global_search_today + '/' + key);
    } else {
      return this.apiService.get(environment.base_value.search_all_details + '/' + key);
    }
  }
  getSearchDataWithKey(name, key){
    if(key != ''){
      return this.apiService.get(environment.base_value.global_search_by_key + '?name=' + name + '&filterBy=' + key + '&pageStart=1&pageSize=10')
    }
    return this.apiService.get(environment.base_value.global_search_by_key + '?name=' + name + '&pageStart=1&pageSize=10')
  }

  // new global Search
  getGlobalSearchData(key, text){
    return this.apiService.get(environment.base_value.global_search_v2 + '/' + key + '?limit=' + 10 + '&sText=' + text);
  }
  // Server Sent Event
  // Component: Toolbar Notification
  observeMessages(eventUrl: string): Observable<string> {
    return new Observable<string>(observer => {
      const eventsource = new EventSource(eventUrl + '?facilityId=' + this.facilityId);
      eventsource.addEventListener('message', (event: MessageEvent) => { // 'MessageEvent' is nothing but event type
        observer.next(event.data);
      });
    });
  }
  getNotify() {
    return this.apiService.get(environment.base_value.alert_api+'?isForCurrentUser=true&isActive=true');
  }
  ackAlertById(data) {
    return this.apiService.put(environment.base_value.ack_alert, data);
  }
  assignAlertById(data) {
    return this.apiService.post(environment.base_value.assign_alert, data);
  }
  getMotherInfantAlerts(pageStart, pageSize, date?:any) {
    if(date !== null) {
      return this.apiService.get(environment.base_value.get_mother_infant_alerts +'?fromDate=' + date + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
    } else {
      return this.apiService.get(environment.base_value.get_mother_infant_alerts + '?pageStart=' + pageStart + '&pageSize=' + pageSize); 
    }
  }
  getAlertbyId(type, id, startDate?: string, endDate?: string) {
    let url = environment.base_value.alert_api + '?identifyingId=' + id + '&identifyingType=' + type;
    if (startDate) url += '&startDate=' + startDate;
    if (endDate)   url += '&endDate='   + endDate;
    return this.apiService.get(url);
  }
  cancelAlert(data) {
    return this.apiService.put(environment.base_value.close_alert_api, data);
  }
  dischargePatient(data) {
    return this.apiService.post(environment.base_value.ip_discharge_patient, data);
  }
  dayCarePatient(data) {
    return this.apiService.post(environment.base_value.day_care_check_in, data);
  }

  // To get the Current User
  // Component: User Menu
  getCurrentUser() {
    return this.apiService.get(environment.base_value.get_current_user);
  }
  getUserLocationById(id) {
    return this.apiService.get(environment.base_value.get_user_by_id + '?userId=' + id);
  }
  public createUser(postData) {
    return this.apiService.post(environment.base_value.createuser, postData);
  }
  // Component: Login
  public login(postData) {
    return this.apiService.post(environment.base_value.user_login, postData);
  }
  forgetPassword(username: string) {
    return this.apiService.get(environment.base_value.forget_password + '?username=' + username);
  }
  resetPassword(data) {
    return this.apiService.put(environment.base_value.reset_password, data);
  }
  changePassword(data) {
    return this.apiService.post(environment.base_value.change_password, data);
  }
  public basicLogin(postData) {
    return this.apiService.post(environment.base_value.basic_login, postData);
  }
  infantAuthorized(data) {
    return this.apiService.post(environment.base_value.infant_event, data);
  }
  resetPasswordData(id){
    return this.apiService.put(environment.base_value.user_resetpassword, id);
  }
  // Component: App
  public loginToken(postData) {
    if(postData.hasOwnProperty('code')) {
      return this.apiService.post(environment.base_value.qr_login, postData);
    } else {
      return this.apiService.post(environment.base_value.login_token, postData);
    }
  }

  // Location tracking master set boundary
  public getLocationBoundary(associatedId = '1', associatedType = 'TAT-PA', isCurrent = 'true') {
    let url = environment.base_value.location_track + '?associationId=' + associatedId +'&associationType=' + associatedType +'&isCurrent='+ isCurrent;
    console.log(url)
    return this.apiService.get(url)
  }
  public saveLocationBoundary(data) {
    return this.apiService.post(environment.base_value.location_track, data)
  }
  public removeLocationBoundary(id, data) {
    return this.apiService.put(environment.base_value.location_track + '/'+ id, data)
  }
  

  // Component: Dashboard-hc, Dashboard-ip, Dashboard-op
  // Entry Component: Manage Widget
  getPermissionDetails(key: string) {
    return [
      {
        'user':
        {
          'username': 'Venkatesh',
          'role': 'admin'
        },
        'token':
        {
          'access_toekn': '',
          'refresh_token': '',
          'token_id': ''
        },
        'permission':
        {
          'menu':
            [
              'MN_DB',
              'MN_HP',
              'MN_CF',
              'MN_RE',
              'MN_OT',
              'MN_HPMF',
              'MN_HPMU',
              'MN_HPML',
              'MN_HPBL',
              'MN_HPCS',
              'MN_HPMP',
              'MN_HPIS',
              'MN_CFGW',
              // "MN_CFR",
              // "MN_CFT",
              // "MN_CFA",
              'MN_CFRR',
              'MN_CFTG',
              'MN_CFAS',
              'MN_CFRS',
              'MN_CFAC',
              'MN_CFHK',
              'MN_OTPM',
              'MN_OTAM',
              'MN_OTIP',
              'MN_OTOP',
              'MN_OTIF',
              'MN_OTT',
              'MN_REEM',
              // "MN_RERR",
              'MN_REPT',
              'MN_RESF',
              'MN_REEN',
              'MN_REAS',
              'MN_REMN'
            ],
          'widget':
            [
              { 'id': 'WD_DBFP', 'CS': 'OP', 'description': 'Floor Plan' },
              { 'id': 'WD_DBE', 'CS': 'OP', 'description': 'Events' },
              { 'id': 'WD_DBPC', 'CS': 'OP', 'description': 'Patient Count' },
              { 'id': 'WD_DBACT', 'CS': 'OP', 'description': 'Avg. wait time to provider' },
              { 'id': 'WD_DBAWT', 'CS': 'OP', 'description': 'Average Wait Time' },
              //  { 'id':"WD_DBPR", 'CS': 'OP', 'description':"Patient Ratio" },
              //  { 'id':"WD_DBOPV", 'CS': 'OP', 'description':"Outpatient Visit"},
              //  { 'id':"WD_DBPTAT", 'CS': 'OP', 'description':"Patient Turn Around Time"},
              { 'id': 'WD_DBPVC', 'CS': 'OP', 'description': 'Patient Visit Count' },
              { 'id': 'WD_DBPIT', 'CS': 'OP', 'description': 'Patient In Time' },
              { 'id': 'WD_DBPS', 'CS': 'OP', 'description': 'Patient Status' },
              { 'id': 'WD_DBFP', 'CS': 'IP', 'description': 'Floor Plan' },
              { 'id': 'WD_DBE', 'CS': 'IP', 'description': 'Events' },
              { 'id': 'WD_DBBOS', 'CS': 'IP', 'description': 'Bed occupancy status' },
              { 'id': 'WD_DBACT', 'CS': 'IP', 'description': 'Avg. wait time to provider' },
              { 'id': 'WD_DBAS', 'CS': 'IP', 'description': 'Asset status' },
              { 'id': 'WD_DBIPAWT', 'CS': 'IP', 'description': 'Inpatient Average Waiting Time' }
            ],
          'button':
            [
              'BT_OTPMC',
              'BT_OTPME',
              'BT_OTPMD',
              'BT_OTAMC',
              'BT_OTAME',
              'BT_HPMFC',
              'BT_HPMFE',
              'BT_HPMUC',
              'BT_HPMUE',
              'BT_HPMPC',
              'BT_HPMPE',
              'BT_HPMLC',
              'BT_HPMLE',
              'BT_HPISDR',
              'BT_HPISUR',
              'BT_HPISDP',
              'BT_HPISUP',
              'BT_HPISDT',
              'BT_HPISUT',
              'BT_HPISDA',
              'BT_HPISUA',
              'BT_HPISDG',
              'BT_HPISUG',
              'BT_HPISDU',
              'BT_HPISUU',
              'BT_CFGWC',
              'BT_CFGWE',
              'BT_CFTC',
              'BT_CFTE',
              'BT_CFRC',
              'BT_CFRE',
              'BT_CFAC',
              'BT_CFAE',
              'BT_MCFE', // MANAGE CONTROL
              'BT_MCRE',
              'BT_MCCE',
            ],
          'list':
            [
              'LS_CFGW',
              'LS_CFTG',
              'LS_CFRE',
              'LS_CFAS',
              'LS_HPMF',
              'LS_HPMU',
              'LS_HPML',
              'LS_HPIS',
              'LS_HPBL',
              'LS_HPCS',
              'LS_OTPM',
              'LS_OTAS',
              'LS_OTIP',
              'LS_OTOP',
              'LS_OTIF',
              'LS_DBWD',
              'LS_REEM',
              'LS_RERR'
            ]
        }
      }
    ];
  }
  // Used in ALL
  getActivePermission(permission_ctrl: string) {
    let active_menu_list = [];
    let common_menu_list: any;

    // let get_permission_details = this.getPermissionDetails(localStorage.getItem(btoa('current_user'))); // Y3VycmVudF91c2Vy current_user
    // let active_menu = get_permission_details[0].permission.menu;
    // let active_btn = get_permission_details[0].permission.button;

    const permission = JSON.parse(localStorage.getItem('permission'));
    if(permission) {
    const active_menu = permission.menuItems;
    const active_btn = permission.button;
    const activeDropdown = permission.dropdown;

    // get sub menu list for ovitag modules

    const sub_menu_items = JSON.parse(localStorage.getItem(btoa('menuItems')));

    if (permission_ctrl === 'main_menu') {
      common_menu_list = active_menu;
      if (parseInt(localStorage.getItem('userlevel')) === 8) {
        for (let m = 0; m < common_menu_list.length; m++) {
          if (common_menu_list[m].name === 'Hospital') {
            common_menu_list[m].name = 'Organization';
          }
        }
      }
      if (parseInt(localStorage.getItem('userlevel')) === 10) {
        for (let m = 0; m < common_menu_list.length; m++) {
          if (common_menu_list[m].name === 'Hospital') {
            common_menu_list[m].name = 'Facility';
          }
        }
      }
    }

    if (permission_ctrl === 'button') {
      active_menu_list = active_btn;
    } else if (permission_ctrl === 'dropdown') {
      active_menu_list = activeDropdown.map(res => res.code);
      return active_menu_list;
    } else {
      // active_menu_list = common_menu_list
      active_menu_list = common_menu_list;
    }

    return active_menu_list;
    } else {
      if(window.location.pathname.includes('web/') || localStorage.hasOwnProperty(btoa('guestInfo'))) {
        return [];
      } else {
        localStorage.clear();
        this.router.navigate(['/login']);
        return [];
      }
    }
  }

  getPermissionbyId(roleId, userId) {
    return this.apiService.get(environment.base_value.permission_by_id  + '/' + roleId +'?userId='+ userId);
  }
  // Component: Message Centre
  getPatientList(tagtype, typeid) {
    return this.apiService.get(environment.base_value.tag_management_filter1 + '?tagAssociationType=' + tagtype + '&tagTypeId=' + typeid);
  }
  getCoasterResponse() {
    return this.apiService.get(environment.base_value.get_coaster_response + '/' + 'CoasterResponse');
  }
  saveMessage(savedData) {
    return this.apiService.post(environment.base_value.save_message, savedData);
  }
  getCoasterMessage() {
    return this.apiService.get(environment.base_value.get_coaster_message);
  }
  getLocationList() {
    return this.apiService.get(environment.base_value.get_location_list);
  }
  getRoleList() {
    return this.apiService.get(environment.base_value.get_role_list);
  }
  getAllRoleList() {
    return this.apiService.get(environment.base_value.get_role_list1);
  }
  getAllTag() {
    return this.apiService.get(environment.base_value.get_all_tag);
  }
  getRandomColor() {
    // let color = Math.floor(0x1000000 * Math.random()).toString(16); // method 1 anycolor
    // return '#' + ('000000' + color).slice(-6);
    
    // let color = "hsl(" + Math.random() * 360 + ", 100%, 75%)"; // method 2 opacity restricted
    // return color;
    
    let letters = 'BCDEF'.split(''); // method3 color code restricted
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  }
  // Componenet: Dashboard-hc, Report >> Employee-report, Porter-report, Staff-report
  getReportData(id, param) {
    if (id != 'roll-call' && id != 'staff-roll-call') {
      let reportName = environment.base_value.baseUrl + id;
      let url = reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + param;
      return this.apiService.get(url);
    } else {
      let reportName = environment.base_value.baseUrl + id;
      let url = reportName + '/0/0/' + param;
      return this.apiService.get(url);
    }
  }
  // calendar Operation Theatre  timelime table ///
  getEntityTimeline(fromDate?: any, type?: any, location?: any){
    if(location !== undefined && location !== null) {
      return this.apiService.get(environment.base_value.get_entity_timeLine + '?fromDate=' + fromDate + '&type=' + type + '&wardIds=' + location);
    } else {
      return this.apiService.get(environment.base_value.get_entity_timeLine + '?fromDate=' + fromDate + '&type=' + type); 
    }
  }
  getExcelReportData(id, param){
    let reportName = environment.base_value.baseUrl + id;
    let url = reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + param;
    
    return this.apiService.getFile(url,{ responseType: 'arraybuffer' });
  }
  
  getServerPdf(id, param){
    let reportName = environment.base_value.nodeWrapperBaseUrl + id;
    let url = reportName+'/' + param;
    
    return this.apiService.getFile(url,{ responseType: 'arraybuffer' });
  }

  // Component: Location Mapping
  // Entry Component: Porter Request
  getLocationSearch(id, checkLocType = false) {
    return this.apiService.get(environment.base_value.get_to_location_search + '/' + id + "?checkLocType=" + checkLocType);
  }
  getReaderByLocation(id) {
    return this.apiService.get(environment.base_value.get_reader_by_location + '?locationId=' + id);
  }
  getSensorDetails(floorId) {
    return this.apiService.get(environment.base_value.sound_sensor + '/' + floorId);
  }
  generateLink(readerId, min, max, hazard, units, hazardType, rssiRange, mrssiRange, alarmLevel) {
    if(units !== null && units !== undefined) {
      units = units.replace( '/','~fs~' ).replace('\\','~bs~').replace('μ','~mi~').replace('µ','~mi~');
    }
    if(alarmLevel !== null && alarmLevel !== undefined) {
      alarmLevel = alarmLevel.replace('/', ',').replace('\\',',');
    }
    return this.apiService.get(environment.base_value.get_hazard_reader_config + localStorage.getItem(btoa('facilityId'))+'/rid=' + readerId + 
    '&min=' + min + '&max=' + max + '&haz=' + hazard + '&unit=' + units + '&htyp=' + hazardType + '&rssi=' + rssiRange + '&mrssi=' + mrssiRange + '&lvl=' + alarmLevel);
  }
  getAmbulanceLocation(id) {
    return this.apiService.get(environment.base_value.get_ambulance_location + '?customerId=' + id);
  }
  getNearestAmbFacility(fdt,lat,lng, isAmb, isFacility, unit) {
    return this.apiService.get(environment.base_value.get_nearest_amb_facility + '?fromTime=' + fdt+ '&isFacility=' + isFacility + '&isAmbulance=' +isAmb + '&unit=' +unit + '&lat1=' +lat + '&lng1='+lng);
  }
  getRoleName(text, roleCode?: string) {
    return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text + '&roleCode=' + roleCode);
  }
  // Component: Reader, Location Management, Common Map, Floor Map, Health Checkup
  // To publish in MQTT [ this service to be called from Reader / Tags & Location Management ]
  sendMessage(context, cloud, type) {

    let publishData: any = null;
    let publishTopic: any = null;

    if (type === 'CACHE') {
      publishTopic = environment.base_value.topic_gw_cache;
      publishData = '{"fid" : "' + localStorage.getItem(btoa('facilityId')) + '", "ctx": "' + context + '", "typ": "CACHE"}';
    } else {
      publishTopic = environment.base_value.topic_sw_update;
      publishData = context;
    }

    if (environment.env_key === 'prod') {
      // this._client = connect(cloud[localStorage.getItem(btoa('facilityId'))]);
      this._client = connect(cloud);
    } else {
      this._client = connect(cloud);
    }

    this._client.on('connect', () => {
      // console.log(this._client);
      if (environment.env_key === 'dev') {
        console.log(publishData);
      }
      this._client.publish(publishTopic, publishData);
      this.interval = setInterval(val => this.disconnectClient(), 3000);
    });
  }
  // Entry Component: Common-map, Floor-map
  getFloorList() {
    return this.apiService.get(environment.base_value.get_floor_list);
  }
  // used in both Reader, Location Management, Health Checkup, Monitor
  getAllLocation() {
    return this.apiService.get(environment.base_value.get_all_location);
  }
  getAllLogicalLocation() {
    return this.apiService.get(environment.base_value.get_all_logical_location);
  }
  getLogicalLoction () {
    return this.apiService.get(environment.base_value.get_logical_location);
  }
  getAllFloorLocations(locationTypeId) {
    return this.apiService.get(environment.base_value.get_all_floor_locations + '?locationTypeId=' + locationTypeId);
  }
  getPorterRequestById(id) {
    return this.apiService.get(environment.base_value.get_porter_request_details + '/' + id);
  }
  getShortestPath(src, dist, floor) {
    return this.apiService.get(environment.base_value.get_shortestpath + localStorage.getItem(btoa('facilityId')) + '/srclid=' + src + '&tarlid=' + dist + '&flr=' + floor);
  }
  getReaderValidation() {
    return this.apiService.get(environment.base_value.config_url + '/' + 'reader-validation');
  }
  getMonitorResolution() {
    return this.apiService.get(environment.base_value.config_url + '/' + 'monitor-resolution');
  }
  // used in both Reader, Location Management, Common-map, Floor-map
  getAllLocationById(id) {
    return this.apiService.get(environment.base_value.get_all_location_by_id + '/' + id);
  }

  // Component: Asset, Support Ticket
  getEnumTerms(FileType) {
    return this.apiService.get(environment.base_value.enum_terms + '/' + FileType);
  }

  //Component: Resource, Support Ticket, User Management
  getAllRole() {
    return this.apiService.get(environment.base_value.get_role);
  }

  // Component: Health Checkup, Package, Worklist
  // Entry Component: Edit Daily Management, Enroll Patient, Confirmation Dialog, Common Search, Patient
  // used in both Health Checkup and Package
  getPackageHealthPlan(planTypeIds?: string, name?: string, pageStart?: number, pageSize?: number) {
    const params = { planTypeIds, name, pageStart, pageSize };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_ot_health_plan, params);
    return this.apiService.get(url);
  }
  getAllHealthPlan() {
    return this.apiService.get(environment.base_value.get_all_health_plan);
  }
  // used in both Worklist, Health Checkup, Edit Daily Management, Enroll Patient, Confirmation Dialog
  getConfigFile(data) {
    return this.apiService.get(environment.base_value.config_url + '/' + data);
  }
  saveConfigFile(data) {
    return this.apiService.post(environment.base_value.save_config_file, data);
  }
  updateConfigFile(data) {
    return this.apiService.put(environment.base_value.config_file + '/' + data.id, data);
  }
  getAlertCount(id){
    id = id == 'All' || id == null ? '' : id;
    return this.apiService.get(environment.base_value.get_alert_task_count + '?locationId='+id);
  }
  getAlertTemplate(channelId, ruleId, ruleTypeId?){
    let param = '?channelId=' + channelId;
    if(ruleId !== null){
      param += '&ruleId=' + ruleId;
    }
    if(ruleTypeId !== null && ruleTypeId !== undefined){
      param += '&ruleTypeId=' + ruleTypeId;
    }
    return this.apiService.get(environment.base_value.get_alert_rule_template + param);
  }
  // used in both Health Checkup, Common Search, Patient
  getHcPatientList(date, planTypeId?: string, location?: any, name?: string,visitEventStatuses?: any ) {
    if (this.tokenEnrollFlow === null) {
      this.tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));
    }
    if (this.tokenEnrollFlow === true) {
      // return this.apiService.get(environment.base_value.hc_patientlist_with_billed + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
      let baseUrl = environment.base_value.hc_patientlist_with_billed;
      let url = `${baseUrl}?fromDate=${date}`;
      if (planTypeId != null && (planTypeId === 'HP-OT' || planTypeId === 'HP-EC')) {
        url += `&planTypeId=${planTypeId}`;
        if(planTypeId === 'HP-EC') {
          url += `&includeAmbulancePatient=true`;
        }

        if(location !== undefined && location !== null) {
          url += `&locationIds=${location}`;
        }
        
        if (visitEventStatuses !== undefined && visitEventStatuses !== null) {
          url += `&visitEventStatuses=${visitEventStatuses}`;
        }
      }
      if (name !== undefined && name !== null && name?.trim().length >0) {
        url += `&sText=${encodeURIComponent(name?.trim())}`;
      }
      return this.apiService.get(url);
    } else {
      return this.apiService.get(environment.base_value.hc_patientlist + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
    }
  }
  getDQAllWaitList(date) {
    return this.apiService.get(environment.base_value.hc_patientlist_with_billed + '?fromDate=' + date + '&visitTypeIds=VT-OP,VT-HC');
  }
  getHCPatientListByWaitTime(fromDate) {
    return this.apiService.get(environment.base_value.get_hc_patient_by_wait_time + '?fromDate=' + fromDate);
  }
  getFollowUp(date, pageStart, pageSize, sText) {
    let param = '?date=' + date;
    if(pageStart !== null && pageStart !== undefined){
      param = param + '&pageStart=' + pageStart;
    }
    if(pageSize !== null && pageSize !== undefined){
      param = param + '&pageSize=' + pageSize;
    } 
    if(sText !== null && sText !== undefined){
      param = param + '&sText=' + sText;
    }
    return this.apiService.get(environment.base_value.get_follow_up + param);
  }
  // used in both Health Checkup, Patient
  saveMergeRecord(data) {
    return this.apiService.post(environment.base_value.save_merge_record, data);
  }
  // used in both Health Checkup, Enroll Patient
  getRegisteredPatients(id,type) {
    return this.apiService.get(environment.base_value.registered_patients + '/' + id +'?visitTypeId=' +type);
  }
  getEnrollVisitOption(patientId, visitId) {
    return this.apiService.get(environment.base_value.get_enroll_visit_option + '/' + patientId + '/' + visitId);
  }

  phoneValidate(code, phone?: number) {
    if(phone) {
      return this.apiService.get(environment.base_value.phone_validate + `?code=${encodeURIComponent(code)}` + '&phone=' + phone);
    } else {
      return this.apiService.get(environment.base_value.phone_validate + `?code=${encodeURIComponent(code)}`);
    }
  }

  searchToken(text, visitTypeId?: any) {
    if (visitTypeId !== null) {
      return this.apiService.get(environment.base_value.search_token + text + '/available?visitTypeId=' + visitTypeId);
    } else {
      return this.apiService.get(environment.base_value.search_token + text + '/available');
    }
}
  // used in both Health Checkup, Patient, Enroll Patient
  saveRegisteredPatients(data) {
    return this.apiService.post(environment.base_value.registered_patients, data);
  }
  updateRegisteredPatients(data) {
    return this.apiService.put(environment.base_value.get_ip_patient_list  + '/' + data.patientId, data);
  }
  createMedicalRecordRequest(data) {
    return this.apiService.post(environment.base_value.mr_create_request, data);
  }

  // Component: Porter
  // Entry Component: Live Tag Details
  getCreatedPorterRequest() {
    return this.apiService.get(environment.base_value.get_all_created_request);
  }
  getRequestDetail(type, date, locId, status,serviceGroupId?, sText?: any, pagestart?: any, pagesize?: any) {
    let param = '?performerType='+type;
    if(status) {
      param = param + '&statusIds='+status
    }
    if(date) {
      param = param + '&fromDate='+date+'&toDate='+date
    }
    if(serviceGroupId){
      param = param + '&serviceGroupId='+serviceGroupId
    }
    if(sText !== null && sText !== undefined){
      param = param + '&sText=' + encodeURIComponent(sText);
    }
    if(pagestart !== null && pagestart !== undefined){
      param = param + '&pageStart=' + pagestart;
    }
    if(pagesize !== null && pagesize !== undefined){
      param = param + '&pageSize=' + pagesize;
    } 

    // if(locId) {
    //   param = param + '&performerIds='+locId
    // }
    return this.apiService.get(environment.base_value.get_request_detail+param);
  }
  getPharmacyRequestDetails(performerType,requestId,serviceGroupId){
    let param = '?performerType='+performerType;
    if(requestId){
      param = param +'&requestId='+requestId;
    }
    if(serviceGroupId){
      param = param + '&serviceGroupId='+serviceGroupId
    }
    return this.apiService.get(environment.base_value.get_request_detail+param);
  }
  cancelBreak(postdata) {
    return this.apiService.post(environment.base_value.cancel_break, postdata);
  }
  reqDetailAck(postdata) {
    let param ='/'+localStorage.getItem(btoa('userId'))
    return this.apiService.put(environment.base_value.request_detail_ack + param, postdata);
  }
  getPorterReqById(id) {
    return this.apiService.get(environment.base_value.get_all_porter_request + '?requestId='+id);
  }
  getPorterRequest(date, userRole, locationId, statusIds?: any, reqType?: string, customerId?: any, poolNames?: any,name?: any, pagestart?: any, pagesize?: any,srcIdentifyingType?: any,isfetchPharmacy?:boolean, toDate?: any) {
    // if (date !== null) {
    //   return this.apiService.get(environment.base_value.get_all_porter_request + '?date=' + date);
    // } else if (userRole) {
    //   return this.apiService.get(environment.base_value.get_all_porter_request + '?isCreatedUser=' + userRole);
    // } else if (locationId !== null) {
    //   return this.apiService.get(environment.base_value.get_all_porter_request + '?locationId=' + locationId);
    // } else {
    //   return this.apiService.get(environment.base_value.get_all_porter_request);
    // }

    if (locationId === null) {
      locationId = '';
    }

    let get_porter_request = '?locationId=' + locationId;
    if (date !== null) {
      get_porter_request = get_porter_request + '&date=' + date;
    }
     if (toDate !== null && toDate != undefined &&  toDate != '') {
      get_porter_request = get_porter_request + '&toDate=' + toDate;
    }
    if (userRole) {
      get_porter_request = get_porter_request + '&isCreatedUser=' + userRole;
    }
    if (statusIds !== null) {
      get_porter_request = get_porter_request + '&statusIds=' + statusIds;
    }
    if (reqType !== null && reqType !== undefined) {
      get_porter_request = get_porter_request + '&requestType=' + reqType;
    }
    if (customerId !== null && customerId !== undefined) {
      get_porter_request = get_porter_request + '&customerId=' + customerId;
    }
    if (poolNames !== null && poolNames !== undefined) {
      get_porter_request = get_porter_request + '&poolNames=' + poolNames;
    }
    if(name !== null && name !== undefined){
      get_porter_request = get_porter_request + '&name=' + encodeURIComponent(name);
    }
    if(pagestart !== null && pagestart !== undefined){
      get_porter_request = get_porter_request + '&pageStart=' + pagestart;
    }
    if(pagesize !== null && pagesize !== undefined){
      get_porter_request = get_porter_request + '&pageSize=' + pagesize;
    } 
    if(srcIdentifyingType !== null && srcIdentifyingType !== undefined){
      get_porter_request = get_porter_request + '&srcIdentifyingType=' + srcIdentifyingType;
    } 
    if(isfetchPharmacy !== null && isfetchPharmacy !== undefined){
      get_porter_request = get_porter_request + '&isFetchPharmacy=' + isfetchPharmacy;
    } 
    if(reqType === 'RQT-AMB') {
      return this.apiService.get(environment.base_value.amb_request + get_porter_request);
    } else {
      return this.apiService.get(environment.base_value.get_all_porter_request + get_porter_request);
    }
  }
  getSampleMovementRequest(requestId: number, requestType: string) {
    return this.apiService.get(
      environment.base_value.get_all_porter_request +
      '?requestId=' + requestId + '&requestType=' + requestType
    );
  }
  getSampleMovementDetails(requestId: number) {
    return this.apiService.get(
      environment.base_value.get_request_detail + '?performerType=TAT-PA&requestId=' + requestId
    );
  }

  getPorterRequestPwa(requestType,srcIdentifyingId?,srcIdentifyingType?, selectedDate?){
    let param = '?requestType='+requestType
    if(srcIdentifyingId){
      param = param + '&srcIdentifyingId='+srcIdentifyingId
    }
    if(srcIdentifyingType){
      param = param + '&srcIdentifyingType='+srcIdentifyingType
    }
    if(selectedDate) {
      param = param + '&date='+selectedDate
    }
    param = param + '&pageStart=0&pageSize=50';
    return this.apiService.get(environment.base_value.get_all_porter_request + param);
  }
  getRequestById(data){
    return this.apiService.get(environment.base_value.get_all_porter_request + '?requestId=' + data.requestId + '&requestType=' + data.type);
  }
  getAllAmbulance() {
    return this.apiService.get(environment.base_value.get_all_ambulance);
  }
  getAmbulanceRequestById(id,reqType) {
    return this.apiService.get(environment.base_value.amb_request+'?'+'requestId='+id+'&requestType='+reqType);
  }
  getAllLinen(categoryId, statuses, pageStart?, pagesize?) {
    let params = new URLSearchParams();
    if (statuses != null) params.append('statuses', statuses);
    if (categoryId != null) params.append('categoryId', categoryId);
    if (pageStart != null) params.append('pageStart', pageStart);
    if (pagesize != null) params.append('pagesize', pagesize);
    const queryString = params.toString();
    return this.apiService.get(environment.base_value.get_linen + (queryString ? '?' + queryString : ''));
  }
  getTagDetails(id) {
    return this.apiService.get(environment.base_value.get_tag_detail_by_serial + '/' + id);
  }
  disengageAlarm(data) {
    return this.apiService.put(environment.base_value.disengage + '/' + data.associatedTagSerialNumber + '?isEngage=' + data.isEngage, data);
  }
  getGeoLocation(id) {
    return this.apiService.get(environment.base_value.get_geo_location + localStorage.getItem(btoa('facilityId')) + '/tid=' + id);
  }
  getGeoPath(actualTime, actualDropTime, id, arrivalTime, points) {
    return this.apiService.get(environment.base_value.get_geo_path + localStorage.getItem(btoa('facilityId')) + '/fdt=' + actualTime + '&mdt=' + arrivalTime + '&tdt=' + actualDropTime + '&astid=' + id + '&pts=' + points);
  }
  getGeoAmbulanceLocation() {
      return this.apiService.get(environment.base_value.get_geo_ambulance_location);
  }
  getCompletedPath(actualTime, actualDropTime, id) {
    return this.apiService.get(environment.base_value.get_geo_path + localStorage.getItem(btoa('facilityId')) + '/fdt=' + actualTime + '&tdt=' + actualDropTime + '&astid=' + id);
  }
  // getGeoAmbulanceLocation(id) {
  //   return this.apiService.get(environment.base_value.get_geo_location + localStorage.getItem(btoa('facilityId')) + '/ttype=' + id);
  // }
  // Component: Tag Tracking
  getTagTrack() {
    return this.apiService.get(environment.base_value.tag_track);
  }

  getRecipientNamelist(stext?: any, recipientTypeId?: any, departmentId?: any) {
    const params = {stext, recipientTypeId, departmentId };
    const url = this.urlBuilder.buildUrl(environment.base_value.search_name_by_recipient_type, params);
    return this.apiService.get(url);
  }
  
   getUserRollDepartment(sText?, departmentId?, entityType?) {
    let params = {sText, departmentId, entityType};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_user_department_links, params);
    return this.apiService.get(url); 
  }

  associateAssetByUser(data) {
    return this.apiService.post(environment.base_value.associate_asset_by_user, data);
  }
  disassociateAssetByUser(data) {
    return this.apiService.post(environment.base_value.disassociate_asset_by_user, data);
  }
  getAssetUserDetails(id) {
    return this.apiService.get(environment.base_value.get_all_ambulance + '?assetId=' + id);
  }
  getTagHistory(id: string) {
    // console.log('common service: ' + id);

    if (id === 'Wheel') {
      return [
        {
          id: 1,
          location: 'Ward A',
          startTime: '10:00 AM',
          endTime: '10:30 AM'
        }, {
          id: 2,
          location: 'Ward B',
          startTime: '10:30 AM',
          endTime: '11:30 AM'
        }, {
          id: 3,
          location: 'ICU',
          startTime: '11:31 AM',
          endTime: '12:30 PM'
        }, {
          id: 4,
          location: 'Ward B',
          startTime: '01:00 PM',
          endTime: '03:30 PM'
        }, {
          id: 5,
          location: 'Ward A',
          startTime: '03:31 PM',
          endTime: '04:00 PM'
        }];
    } else if (id === 'TAG002') {
      return [
        {
          id: 1,
          location: 'General Ward',
          startTime: '10:00 AM',
          endTime: '10:30 AM'
        }, {
          id: 2,
          location: 'OP Ward',
          startTime: '10:31 AM',
          endTime: '11:30 AM'
        }, {
          id: 3,
          location: 'ICU',
          startTime: '11:31 AM',
          endTime: '12:30 PM'
        }, {
          id: 4,
          location: 'OP Ward',
          startTime: '01:00 PM',
          endTime: '03:30 PM'
        }, {
          id: 5,
          location: 'Ward B',
          startTime: '03:31 PM',
          endTime: '04:00 PM'
        }, {
          id: 6,
          location: 'General Ward',
          startTime: '04:31 PM',
          endTime: '05:00 PM'
        }];
    } else if (id === 'TAG003') {
      return [
        {
          id: 1,
          location: 'ICU',
          startTime: '10:00 AM',
          endTime: '12:30 PM'
        }, {
          id: 2,
          location: 'OP Ward',
          startTime: '12:31 PM',
          endTime: '04:30 PM'
        }];
    } else if (id === 'TAG004') {
      return [
        {
          id: 1,
          location: 'Ward A',
          startTime: '10:00 AM',
          endTime: '10:30 AM'
        }, {
          id: 2,
          location: 'Ward C',
          startTime: '10:31 AM',
          endTime: '11:30 AM'
        }, {
          id: 3,
          location: 'ICU',
          startTime: '11:31 AM',
          endTime: '12:30 PM'
        }, {
          id: 4,
          location: 'Ward C',
          startTime: '01:00 PM',
          endTime: '03:30 PM'
        }, {
          id: 5,
          location: 'Ward A',
          startTime: '03:31 PM',
          endTime: '04:00 PM'
        }];
    } else if (id === 'TAG005') {
      return [
        {
          id: 1,
          location: 'OP Ward',
          startTime: '10:00 AM',
          endTime: '10:30 AM'
        }, {
          id: 2,
          location: 'Ward A',
          startTime: '10:31 AM',
          endTime: '11:30 AM'
        }, {
          id: 3,
          location: 'ICU',
          startTime: '11:31 AM',
          endTime: '12:30 PM'
        }, {
          id: 4,
          location: 'Ward B',
          startTime: '01:00 PM',
          endTime: '01:30 PM'
        }, {
          id: 5,
          location: 'Ward A',
          startTime: '01:31 PM',
          endTime: '02:00 PM'
        }, {
          id: 6,
          location: 'Ward B',
          startTime: '02:31 PM',
          endTime: '03:00 PM'
        }, {
          id: 7,
          location: 'Ward A',
          startTime: '03:31 PM',
          endTime: '04:00 PM'
        }];
    }
  }
  getBasicInfo(id){
    return this.apiService.get(environment.base_value.get_basic_info  +id);
  }

  getVendorDetails(id) {
    return this.apiService.get(environment.base_value.get_vendor_details+'?assetId='+id);
  }

   //Entry Component: gate-pass
   getLinkedAssets(assetId){
    return this.apiService.get(environment.base_value.  get_all_transfered_linked_assets +assetId);
  }

  // Entry Component: Floor Map
  getAllNodePoints() {
    return this.apiService.get(environment.base_value.get_node);
  }
  getLocationWithBed(floorId) {
    let facilityId = localStorage.getItem(btoa('facilityId'))
    return this.apiService.get(environment.base_value.get_bed_occupency + facilityId + '/flr=' + floorId);
  }

  // Entry Component: Common Map
  getLocationById(id) {
    return this.apiService.get(environment.base_value.get_location_by_id + '/' + id);
  }
  getAllReaderTempFloor(id) {
    const url = 'api/python-wrapper/reports/envdetails/0/0/' + localStorage.getItem(btoa('facilityId')) + '/env=TEMP&flr=' + id;
    return this.http.get(url);
  }

  // Entry Component: Patient
  getAllRegisterPlan() {
    return this.apiService.get(environment.base_value.get_all_health_plan);
  }
  getHealthTestAvailableLocation(testType, testId?,testCategory?) {
    let param=''
    param= testType != null ?param +'?healthTestOption=' + testType : param;
    param = testId != null ? param + '&healthTestId=' + testId : param;
    param = testCategory != null ? param + '&testCategory=' + testCategory : param;
    return this.apiService.get(environment.base_value.get_health_test_available_locations + param);
  }
  updateClinicalDetails(data) {
    return this.apiService.post(environment.base_value.update_clinical_details, data);
  }
  sendPatientWelcomeMessage(patientId, patientVisitId, visitTypeId) {
    let params = '?patientId=' + patientId + '&patientVisitId=' + patientVisitId + '&visitTypeId=' + visitTypeId;
    return this.apiService.get(environment.base_value.send_patient_welcome_message + params);
  }
  publishTestStatusToCoaster(data) {
    return this.apiService.post(environment.base_value.publish_test_status, data);
  }
  quickPatientRegistration(postData) {
    return this.apiService.post(environment.base_value.save_quick_registration, postData);
  }
  getAllpatientByLocation(id, status, testId, testType, visitStatusId, planTypeId) {
    // return this.apiService.get(environment.base_value.check_health_plan + '/Today/' + id + '/' + status + '/' + testId);
    let get_patient_test = '?checkUpDayOption=Today';
    if (id !== '' && id !== 0 && id !== null) {
      get_patient_test = get_patient_test + '&locationId=' + id;
    }
    if (status !== '') {
      get_patient_test = get_patient_test + '&statusId=' + status;
    }
    if (testId !== '' && testId !== null) {
      get_patient_test = get_patient_test + '&healthTestId=' + testId;
    }
    if (testType !== '' && testType !== null) {
      get_patient_test = get_patient_test + '&testType=' + testType;
    }
    if (visitStatusId !== '' && visitStatusId !== null) {
      get_patient_test = get_patient_test + '&visitStatusId=' + visitStatusId;
    }
    if (planTypeId !== '' && planTypeId !== null) {
      get_patient_test = get_patient_test + '&planTypeId=' + planTypeId;
    }

    return this.apiService.get(environment.base_value.check_health_plan + get_patient_test);
    // return this.apiService.get(environment.base_value.check_health_plan + '?checkUpDayOption=Today&locationId=' +
    //  id + '&statusId=' + status + '&healthTestId=' + testId);
  }
  getPatientTestDetail(id, patientVisitId, isTempPatient, visitType, visitEventTypeId, visitEventId, workflow?: string) {
    return this.apiService.get(environment.base_value.get_ippatient_info + '?patientId=' + id + '&patientVistId=' + patientVisitId + '&isTempPatient=' + isTempPatient);    
  }
  getPatientInfo(id, patientVisitId, isTempPatient, visitType, visitEventTypeId, visitEventId, workflow?: string) {
    if (visitType === 'VT-OP') {
      return this.apiService.get(environment.base_value.get_outpatient_info + '?patientId=' + id + '&patientVistId=' + patientVisitId +
        '&isTempPatient=' + isTempPatient);
    } else if (visitType === 'VT-IP' && workflow !== 'DayCare') {
      if (visitEventTypeId === 'VE-OT') {
        return this.apiService.get(environment.base_value.get_patient_info + '?patientId=' + id + '&patientVistId=' + patientVisitId +
          '&visitEventId=' + visitEventId + '&isTempPatient=' + isTempPatient);
      } else {
        return this.apiService.get(environment.base_value.get_ip_patient_info + '?patientId=' + id + '&patientVistId=' + patientVisitId);
      }
    } else {
      return this.apiService.get(environment.base_value.get_patient_info + '?patientId=' + id + '&patientVistId=' + patientVisitId +
        '&isTempPatient=' + isTempPatient);
    }
  }
  getPatientTestStatusDetails(id,visitId?,visitEventId?){
    let param = '?patientId=' + id;
    if(visitId){
      param = param + '&patientVistId=' + visitId;
    }
    if(visitEventId){
      param = param + '&visitEventId=' + visitEventId;
    }
    return this.apiService.get(environment.base_value.get_patient_info + param);
  }
  getRequestBooking() {
    return this.apiService.get(environment.base_value.get_request_booking)
  }  
  getBookedEntities(entityType?:string, patientVisitEventId?:number) {
    return this.apiService.get(environment.base_value.get_booked_entities + '?entityType=' + entityType + '&patientVisitEventId=' + patientVisitEventId)
  }
  getProcedureInfo(procedureId){
    let param = '';
    if(procedureId){
      param = param + '?id='+procedureId;
    }
    return this.apiService.get(environment.base_value.get_ot_procedure+param);
  }
  getHealthCheckupList(date) {
    return this.apiService.get(environment.base_value.check_health_plan + '/' + date);
  }
  getHealthTestGroup(id, planId, patientQueueId?) {
    return this.apiService.get(environment.base_value.get_health_test_group + '/' + id + '/' + planId + '?patientQueueId=' + (patientQueueId ? patientQueueId : ''));
  }
  getPatientQueueStatusCount(selectedDate?, visitTypeId?){
    let param = '';
    if(selectedDate){
      param = param + '?date='+selectedDate;
    }
    if(visitTypeId) {
      param = param + '&visitTypeId='+visitTypeId;
    }
    return this.apiService.get(environment.base_value.queue_status_count+param);
  }
  getOtPatientQueue(selectedDate?,status?,testCategory?, visitTypeId?){
    let param = '';
    if(selectedDate){
      param = param + '?date='+selectedDate;
    }
    if(status){
      param = param + '&status='+status;
    }
    if(testCategory){
      param = param + '&testCategoryIds='+testCategory;
    }
    if(visitTypeId){
      param = param + '&visitTypeId='+visitTypeId;
    }
    if(visitTypeId == 'VT-EC') {
      return this.apiService.get(environment.base_value.get_ec_patient_queue + param);
    } else {
      return this.apiService.get(environment.base_value.get_ot_patient_queue + param);
    }
  }
  searchPatient(data) {
    return this.apiService.get(environment.base_value.search_patient + '/' + data);
  }
  searchInpatient(name, patientId?) {
    if(patientId !== null && patientId !== undefined){
      return this.apiService.get(environment.base_value.search_inpatient + '?id=' + patientId);
    } else {
      return this.apiService.get(environment.base_value.search_inpatient + '?name=' + name);
    }
  }
  getBedByMotherId(id) {
    return this.apiService.get(environment.base_value.get_bed_by_mother_id + '/' + id);
  }
  searchPatients(data,infant?: boolean) {
    if(infant === true)
      return this.apiService.get(environment.base_value.search_patients + '?name=' + data + '&isInfant=true');
    else
      return this.apiService.get(environment.base_value.search_patients + '?name=' + data );
  }
  searchPatientsByType(data,type) {
    return this.apiService.get(environment.base_value.search_patients + '?name=' + data + '&type='+type);
  }
  searchPorter(name, floorId, fromTime, toTime, poolName?: string, gender?: string, poolLocationId?: string, requestType?: string, entityType?: string) {
    let searchPorter = null;
    if (name != null) {
      if (searchPorter === null) {
        searchPorter = '?name=' + name;
      } else {
        searchPorter = searchPorter + '&name=' + name;
      }
    }
    if (floorId != null) {
      if (searchPorter === null) {
        searchPorter = '?floorId=' + floorId;
      } else {
        searchPorter = searchPorter + '&floorId=' + floorId;
      }
    }
    if (fromTime != null) {
      if (searchPorter === null) {
        searchPorter = '?fromTime=' + fromTime;
      } else {
        searchPorter = searchPorter + '&fromTime=' + fromTime;
      }
    }
    if (toTime != null) {
      if (searchPorter === null) {
        searchPorter = '?toTime=' + toTime;
      } else {
        searchPorter = searchPorter + '&toTime=' + toTime;
      }
    }
    if (poolName != null) {
      if (searchPorter === null) {
        searchPorter = '?poolName=' + poolName;
      } else {
        searchPorter = searchPorter + '&poolName=' + poolName;
      }
    }
    if (gender != null) {
      if (searchPorter === null) {
        searchPorter = '?gender=' + gender;
      } else {
        searchPorter = searchPorter + '&gender=' + gender;
      }
    }
    if (poolLocationId != null && poolLocationId != undefined) {
      if (searchPorter === null) {
        searchPorter = '?poolLocationId=' + poolLocationId;
      } else {
        searchPorter = searchPorter + '&poolLocationId=' + poolLocationId;
      }
    }
    if (requestType != null && requestType !== undefined) {
      if (searchPorter === null) {
        searchPorter = '?requestType=' + requestType;
      } else {
        searchPorter = searchPorter + '&requestType=' + requestType;
      }
    }

    if (entityType != null && entityType !== undefined) {
      if (searchPorter === null) {
        searchPorter = '?entityType=' + entityType;
      } else {
        searchPorter = searchPorter + '&entityType=' + entityType;
      }
    }
    if (searchPorter != null) {
      if (requestType === 'RQT-AMB') {
        return this.apiService.get(environment.base_value.search_available_amb + searchPorter);
      } else {
        return this.apiService.get(environment.base_value.search_available_porter + searchPorter);
      }
    } else {
      if (requestType === 'RQT-AMB') {
        return this.apiService.get(environment.base_value.search_available_amb);
      } else {
        return this.apiService.get(environment.base_value.search_available_porter);
      }
    }
  }
  getAssociatedUser(role, name) {
    if(role !== null) {
      if(name !== null) {
        return this.apiService.get(environment.base_value.get_user_list + '?roleTypeId=' + role + '&name=' + name);
      } else {
        return this.apiService.get(environment.base_value.get_user_list + '?roleTypeId=' + role);
      }
    } else {
      return this.apiService.get(environment.base_value.get_user_list + '?name=' + name);
    }
  }
  getAssociatedTags() {
    let param = '?isAssociated=true&facilityIds=' + localStorage.getItem(btoa('facilityId'));
    return this.apiService.get(environment.base_value.get_tag_filter + param);
  }

  getAssociatedUserByUserType(userType, name){
    if(userType !== null) {
      if(name !== null) {
        return this.apiService.get(environment.base_value.get_user_list + '?userTypeId=' + userType + '&name=' + name);
      } else {
        return this.apiService.get(environment.base_value.get_user_list + '?userTypeId=' + userType);
      }
    } else {
      return this.apiService.get(environment.base_value.get_user_list + '?name=' + name);
    }
  }

  getUserCounts(requestId: string | number, facilityId: string | number, fromDate: string): Observable<any> {
  return this.apiService.get(
    `${environment.base_value.get_user_count}?fromDate=${fromDate}&facilityId=${facilityId}&requestId=${requestId}`
  );
}

  getMusteringUsers(requestId: string | number, facilityId: string | number): Observable<any> {
    return this.apiService.get(
      `${environment.base_value.get_mustering_users}?requestId=${requestId}&facilityId=${facilityId}`
    );
  }

  getCurrentActiveUsers(facilityId: string | number, locationId: string | number = null, pageStart: number = 0, pageSize: number = 0): Observable<any> {
    let url = `${environment.base_value.get_current_active_users}?facilityId=${facilityId}&pageStart=${pageStart}&pageSize=${pageSize}`;
    if (locationId != null) url += `&locationId=${locationId}`;
    return this.apiService.get(url);
  }

 getPatientUserList(pageStart: number, pageSize: number, search: string = '',id?) {
  if(id){
    return this.apiService.get(environment.base_value.get_patient_user+'?userId='+id)
  }else{
  let url = `${environment.base_value.get_patient_user}?pageStart=${pageStart}&pageSize=${pageSize}`;
  if (search && search.trim() !== '') {
    url += `&sText=${search}`; 
  }
  return this.apiService.get(url);
  }
}

  // Entry Component: Confirmation Dialog
  getAllHeathTestWithoutAdminTest(data, planTypeId?) {
    return this.apiService.get(environment.base_value.get_all_health_test + '?isIgnoreAdmin=true&sText=' + data + (planTypeId ? '&planTypeId=' + planTypeId : ''));
  }
  saveAssignDefaultFloor(data) {
    return this.apiService.post(environment.base_value.assign_default_floor, data);
  }
  managePatientTest(data) {
    return this.apiService.post(environment.base_value.manage_patient_test, data);
  }
  updateHealthCheckConsultantName(data){
    return this.apiService.put(environment.base_value.healthcheck_visit_update + '/' + data.patientVisitId,data);
  }
  updatePatientDiabetic(data) {
    return this.apiService.put(environment.base_value.update_patient_diabetic + '/' + data.id, data);
  }
  updatePatientTestLocation(data) {
    return this.apiService.put(environment.base_value.update_queue_status_location, data);
  }

  // Component: Digital Queue, Confirmation Dialog, Edit Daily Management
  checkMqttDetails() {
    return this.apiService.get(environment.base_value.config_url + '/' + 'mqtt-' + environment.env_key);
  }
  // used in both Digital Queue, Edit Daily Management
  getAllTestsByLocation(id) {
    return this.apiService.get(environment.base_value.get_all_test_by_location + '?locationId=' + id);
  }
  getAllHealthTestLocation(id) {
    return this.apiService.get(environment.base_value.get_all_health_test_location + '?locationIds=' + id);
  }
  getAllUnMappedTestLocation(sText?:any) {

    if(sText){
      return this.apiService.get(environment.base_value. get_all_unmapped_test + '?sText=' + sText);
    } else{
      return this.apiService.get(environment.base_value. get_all_unmapped_test );
    }
  }
  getAvailableLocationByLocId(data) {
    return this.apiService.get(environment.base_value.get_available_location_by_loc_id + '?locationId=' + data);
  }
  // used in both Digital Queue, Confirmation Dialog, Edit Daily Management
  updateHealthTestByFloorwise(data) {
    return this.apiService.put(environment.base_value.update_health_test_location_availability + '/' + data.locationId, data);
  }
  updateBulkLocationStatus(data) {
    return this.apiService.put(environment.base_value.update_bulk_location_status, data);
  }

  // Entry Component: Enroll Patient, Patient
  // used in both Enroll Patient, Patient
  getUHID(uhid,tempPatientId?, visitEventTypeId?, fromDate?,visitTypeId?) {
    let url = `${environment.base_value.get_uhid}/${uhid}`;
    const queryParams: string[] = [];
    if(tempPatientId) {
      queryParams.push(`tempPatientId=${tempPatientId}`);
    }
    if(visitEventTypeId) {
      queryParams.push(`visitEventTypeId=${visitEventTypeId}`);
    }
    if (visitTypeId) {
      queryParams.push(`visitTypeId=${visitTypeId}`);
    }
    if (fromDate) {
      queryParams.push(`fromDate=${fromDate}`);
    }
    if (queryParams.length) {
      url += `?${queryParams.join('&')}`;
    }
    return this.apiService.get(url);
  }
  getAllTagCoster(tagId) {
    return this.apiService.get(environment.base_value.get_tag_costers + '?tagId=' + tagId);
  }

  getAllDepartments(searchText?: string, pageSize?: any, pageStart?: any) {
    const params = { searchText, pageSize, pageStart};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_all_departments, params);
    return this.apiService.get(url);    
  }
  getUserDepartmentLink(userId){
    return this.apiService.get(environment.base_value.get_user_department_links + '?userId=' + userId);
  }
  getUserLocations(userId: any) {
    return this.apiService.get(environment.base_value.get_user_locations + '/' + userId);
  }
  getDepartmentLink(departmentId){
    return this.apiService.get(environment.base_value.get_user_department_links + '?departmentId=' + departmentId + '&entityType=Role');
  }
  getAssetandReaderbyId(id, type) {
    return this.apiService.get(environment.base_value.asset_alert + '?assetId=' + id + '&alertIdentifyingType=' + type);
  }
  getAllTagByType(tagId, type, status) {
    return this.apiService.get(environment.base_value.get_all_tag_by_type + '?tagId=' + tagId + '&workflowTypeId=' + type + '&status=' + status);
  }
  getMRTag(tagId, type) {
    return this.apiService.get(environment.base_value.get_MR_tag + '?tagId=' + tagId + '&assetTypeId=' + type);
  }
  searchMother(name) {
    return this.apiService.get(environment.base_value.search_mother + '?name=' + name + '&gender=Female&type=MOTHER');
  }
  searchTagAssociate(tagId, type, status?: string) {
    return this.apiService.get(environment.base_value.search_non_associate_tag + '?tagId=' + tagId + '&tagTypeId=' + type + '&status=' + status);
  }
  searchByMainidentifer(mainidentifer) {
    return this.apiService.get(environment.base_value.search_by_mainidentifer + '?mainidentifier=' + mainidentifer);
  }
  createRegisterVisitor(data) {
    return this.apiService.post(environment.base_value.visitor_controller, data);
  }
  createRegisterEmployee(data) {
    return this.apiService.post(environment.base_value.employee_controller, data);
  }
  updateRegisterEmployee(data) {
    return this.apiService.put(environment.base_value.employee_controller + '/' + data.id, data);
  }
  updateRegisterVisitor(data) {
    return this.apiService.put(environment.base_value.visitor_controller + '/' + data.id, data);
  }
  getVisitorById(id) {
    return this.apiService.get(environment.base_value.visitor_controller + '/' + id);
  }
  schedule(data){
    return this.apiService.post(environment.base_value.schedule_visitor, data);
  }
  updateSchedule(id,data){
    return this.apiService.put(environment.base_value.schedule_visitor+ '/' + id , data);
  }
  getAuditScheduleData(){
    return this.apiService.get(environment.base_value.schedule_info);
  }

  getVisitorEvent(id) {
    return this.apiService.get(environment.base_value.visitor_Events + '?visitorId=' + id)
  }

  updateVisitoryStatus(id, data){
    return this.apiService.put(environment.base_value.visitor_Events + '?visitorId=' + id, data)
  }

  getvisitorEventHistory(size, start, id){
    return this.apiService.get(environment.base_value.visitor_EventList + '?pageSize=' + size + '&pageStart=' + start + '&visitorId=' + id )
  }

  createKpi(data) {
    return this.apiService.post(environment.base_value.get_kpi, data);
  }

  // Component: Alert Config, Asset, Gateway, Reader, tags, Location Management, Support Ticket, Employee, Porter, Dashboard >> Alert
  // Entry Component: Alert Entry, Support Ticket, Enroll Patient
  getAppTerms(data) {
    return this.apiService.get(environment.base_value.get_bulk_app_terms + '/' + data);
  }

  getApptermsData(data?, facilityId?) {
    if (facilityId) {
      return this.apiService.get(environment.base_value.get_app_terms_data + '?groupName=' + data + '&facilityId=' + facilityId);
    } else {
      return this.apiService.get(environment.base_value.get_app_terms_data + '?groupName=' + data);
    }
  }
  createAppterms(data) {
    return this.apiService.post(environment.base_value.get_app_terms_data, data);
  }
  getApptermsFilterData(data,facilityId?){
    if(facilityId){
      return this.apiService.get(environment.base_value.get_app_terms_filter_data + '?groupName=' + data +'&facilityId='+facilityId);
    } else{
      return this.apiService.get(environment.base_value.get_app_terms_filter_data + '?groupName=' + data);
    }
  }
  getAllShift() {
    return this.apiService.get(environment.base_value.get_all_shift);
  }
  getDynamicTableColumn(type? : string){
    return this.apiService.get(environment.base_value.config_url + '/' + 'grid-config-' + type);
  }
  validateApptermsCode(code){
    return this.apiService.get(environment.base_value.validate_app_terms_code + '?code=' + code);
  }
  getAppTermsLink(type, groupName?: string) {
    if (groupName !== null && groupName !== undefined) {
      return this.apiService.get(environment.base_value.get_reader_type + '?apptermCode=' + type + '&groupName=' + groupName);
    } else {
      return this.apiService.get(environment.base_value.get_reader_type + '?apptermCode=' + type);
    }
  }
  getPatientByLocation(locationId) {
    return this.apiService.get(environment.base_value.get_patient_by_location + '/' + locationId);
  } 
  getHealthPlanLocations() {
    return this.apiService.get(environment.base_value.get_all_health_test_locations);
  }
  getFormTemplate(type) {
    return this.apiService.get(environment.base_value.get_form_template + '?type=' + type);
  }
  getFormDetails(id, type, parentId?, parentType?) {
    let queryParams = `?entityId=${id}&entityType=${type}`;
     if (parentId) queryParams += `&parentId=${parentId}`;
     if (parentType) queryParams += `&parentType=${parentType}`;
    return this.apiService.get(environment.base_value.entity_form + queryParams);
  }
  
  getEntityDetailbyForm(formId) {
    return this.apiService.get(environment.base_value.entity_detail_by_form + '?pfFormTemplateId=' + formId);
  }
  getKynPost() {
    return this.apiService.get('api/python-wrapper/kyn-data/user-live-request/0/0/0/tgt=kyn&flt=1');
  }
  getAllReportedPost(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/post-report/0/0/0/tgt=kyn&flt=1', postData);
  }
  getAllReportedNotice(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/notice-report/0/0/0/tgt=kyn&flt=1', postData);
  }
  getAllReportedVideo(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/video-report/0/0/0/tgt=kyn&flt=1', postData);
  }
  getAllReportedShorts(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/shorts-report/0/0/0/tgt=kyn&flt=1', postData);
  }
  getAllReportedUser(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/user-report/0/0/0/tgt=kyn&flt=1', postData);
  }
  getReviewByReported(type, postData, start, size){
    return this.apiService.post('api/python-wrapper/kyn-trans/report-reason/0/0/0/'+ 'pageStart=' + start + '&pageSize=' + size + '&typ=' +  type, postData);
  }
  getPostReport(id){
    return this.apiService.get('api/python-wrapper/kyn-data/report-post-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getPreviewReportPost(id){
    return this.apiService.get('api/python-wrapper/kyn-data/post-id/0/0/0/tgt=kyn&flt=1' + '&uid=' +  id);
  }
  getPreviewReportNotice(id){
    return this.apiService.get('api/python-wrapper/kyn-data/journal-id/0/0/0/tgt=kyn&flt=1' + '&uid=' +  id);
  }
  getPreviewReportVideo(id){
    return this.apiService.get('api/python-wrapper/kyn-data/video-id/0/0/0/tgt=kyn&flt=1' + '&uid=' +  id);
  }
  getPreviewReportShorts(id){
    return this.apiService.get('api/python-wrapper/kyn-data/shorts-id/0/0/0/tgt=kyn&flt=1' + '&uid=' +  id);
  }
  getNoticeReport(id){
    return this.apiService.get('api/python-wrapper/kyn-data/report-journal-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getVideoReport(id){
    return this.apiService.get('api/python-wrapper/kyn-data/report-video-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getShortsReport(id){
    return this.apiService.get('api/python-wrapper/kyn-data/report-shorts-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getUserReport(id){
    return this.apiService.get('api/python-wrapper/kyn-data/report-user-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  // createTelecastSchedule(postData) {
  //   return this.apiService.post('api/python-wrapper/kyn-trans/create/0/0/0/flt=0&typ=telecastSchedule', postData);
  // }
  createTelecastSchedule(postData) {
    return this.apiService.post('api/python-wrapper/kyn-trans/tele-schedule/0/0/0/flt=0', postData);
  }
  createTelecastScheduleDetail(postData) {
    return this.apiService.post('api/python-wrapper/kyn-trans/create/0/0/0/flt=0&typ=telecastScheduleDetail', postData);
  }
  modifyTelecastScheduleDetail(id, postData) {
    return this.apiService.post('api/python-wrapper/kyn-trans/update/0/0/0/flt=0&typ=telecastScheduleDetail' + '&rid=' + id, postData);
  }
  schedulePostDelete(id){
    let data = {}
    return this.apiService.post('api/python-wrapper/kyn-trans/delete-data/0/0/0/' + 'uid='+ id +'&tgt=kyn&flt=0&typ=telecastScheduleDetail', data);
  }
  createNewLiveRequest(postData) {
    return this.apiService.post('api/python-wrapper/kyn-trans/create/0/0/0/flt=0&typ=userLiveRequest', postData);
  }
  getLiveRequest(id){
    if(id){
      return this.apiService.get('api/python-wrapper/kyn-data/user-live-request/0/0/0/tgt=kyn&flt=1'+ '&uid=' + id);
    } else {
      return this.apiService.get('api/python-wrapper/kyn-data/user-live-request/0/0/0/tgt=kyn&flt=1');
    }
  }
  getScheduleRequest(id){
    if(id){
      return this.apiService.get('api/python-wrapper/kyn-data/user-schedule-request/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
    } else {
      return this.apiService.get('api/python-wrapper/kyn-data/user-schedule-request/0/0/0/tgt=kyn&flt=1');
    }
  }
  getKynUser() {
    return this.apiService.get('api/python-wrapper/kyn-data/get-all-users/0/0/0/tgt=kyn&flt=1');
  }
  getKynPostContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-post/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getKynNoticeContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-journal/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getKynVideoContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-video/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getKynShortsContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-shorts/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getKynScheduleContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-schedule/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  getKynLiveContent(id) {
    return this.apiService.get('api/python-wrapper/kyn-data/user-live-request-by-id/0/0/0/tgt=kyn&flt=1' + '&uid=' + id);
  }
  kynVideoDelete(id, type) {
    let data = {}
    return this.apiService.post('api/python-wrapper/kyn-trans/delete-data/0/0/0/' + 'uid=' + id + '&tgt=kyn&flt=0' + '&typ=' + type, data);
  }
  kynReportDelete(id, type){
    let data = {}
    return this.apiService.post('api/python-wrapper/kyn-trans/delete-data/0/0/0/' + 'uid=' + id + '&tgt=kyn&flt=0' + '&typ=' + type, data);
  }
  kynReportByDelete(id, type, data){
    return this.apiService.post('api/python-wrapper/kyn-trans/report-action/0/0/0/flt=0' + '&typ=' + type + '&rid=' + id, data);
  }
  updateRole(id, data){
    return this.apiService.post('api/python-wrapper/kyn-trans/update-role-user-id/0/0/0/tgt=kyn&flt=0&' + 'uid=' + id , data);
  }
  getTelecastLookUp(){
    return this.apiService.get('api/python-wrapper/kyn-data/lookup/0/0/0/rid=StreamType');
  }
  getAnalyticsLocation(){
    return this.apiService.get('api/python-wrapper/kyn-data/localities/0/0/0/tgt=kyn&flt=1');
  }
  getAnalyticsCategories(){
    return this.apiService.get('api/python-wrapper/kyn-data/categories/0/0/0/tgt=kyn&flt=1');
  }
  getOverview(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/analytics-report/0/0/0/tgt=kyn&flt=1', data);
  }
  getReportVideo(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/content-filter/0/0/0/tgt=kyn&flt=1&typ=video', data);
  }
  getReportShorts(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/content-filter/0/0/0/tgt=kyn&flt=1&typ=shorts', data);
  }
  getReportJournal(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/content-filter/0/0/0/tgt=kyn&flt=1&typ=journal', data);
  }
  getReportPost(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/content-filter/0/0/0/tgt=kyn&flt=1&typ=post', data);
  }
  kynAproval(type, id, data){
    return this.apiService.post('api/python-wrapper/kyn-trans/user-approval/0/0/0/tgt=kyn&flt=1' + '&typ=' + type + '&uid=' + id, data);
  }
  getAssetAlerts(floorId, isAssociated) {
    return this.apiService.get(environment.base_value.asset_with_alerts + '?floorId=' + floorId + '&isAssociated=' + isAssociated);
  }
  getLatestTransferDetail(id){
    return this.apiService.get(environment.base_value.latest_transfer_detail + id);
  }

  getAssetOpenItems(id){
    return this.apiService.get(environment.base_value.get_asset_Overview + '?assetId=' +id)
  }
  
  getAssetTransfer(id,pageStart,pageSize) {
    return this.apiService.get(environment.base_value.asset_transfer_history + '?assetId=' + id + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
  }
  getAssetAudit(id,type, pageStart, pageSize) {
    return this.apiService.get(environment.base_value.get_audit_details + '?entityId=' + id + '&entityType=' +type+ '&pageStart=' + pageStart + '&pageSize=' + pageSize);
  }
  getInventoryDetails(id){
    return this .apiService.get(environment.base_value.get_inventory_details_assetId+ '?assetId=' + id );
  }
  getTicketInventoryDetails(id){
    return this .apiService.get(environment.base_value.get_inventory_details_ticketId+ '?requestId=' + id );
  }
  getTicketExpensesDetails(id){
    return this .apiService.get(environment.base_value.get_inventory_details_ticketId+ '?assetId=' + id );
  }
  updateticketremarks(data,id){
    return this.apiService.put(environment.base_value.ticket_remarks +"/"+  id  , data);
  }
  getInventoryItemDetails(id,modelNo){
    let params = new URLSearchParams();
    if(id != null) params.append('assetTypeId', id);
    if(modelNo != null) params.append('modelNumber', modelNo);
    const queryString = params.toString();
    return this .apiService.get(environment.base_value.get_item_details_assetId +  (queryString ? '?' + queryString : ''));
  }
  getAssetTransferDetails(id,type){
    return this.apiService.get(environment.base_value.get_asset_transfer_events +'?assetId=' +id +'&transferStatusId='+type);
  }
  getEntityFormHistory(id) {
    return this.apiService.get(environment.base_value.get_entity_form_history + '/' + id);
  }
  getTodayTeleShedu(date){
    return this.apiService.get('api/python-wrapper/kyn-data/tele-get-schedule-detail/0/0/0/flt=1' + '&fdt=' + date)
  }
  getOverAllTeleShedu(data){
    return this.apiService.post('api/python-wrapper/kyn-trans/tele-schedule-data/0/0/0/flt=0', data)
  }
  getAllAproveLiveList(postData){
    return this.apiService.post('api/python-wrapper/kyn-trans/user-live-request/0/0/0/flt=1&rid=Approved', postData)
  }
  getTagId(facilityIds, tagTypes?:any, tagAssociationTypes?:string) {
    if(tagTypes !== undefined && tagTypes !== null) {
      return this.apiService.get(environment.base_value.get_tag_id + '?facilityIds=' + facilityIds + '&tagTypes=' + tagTypes + '&tagAssociationTypes=' + tagAssociationTypes);
    } else {
      return this.apiService.get(environment.base_value.get_tag_id + '?facilityIds=' + facilityIds + '&tagAssociationTypes=' + tagAssociationTypes);
    }
  }
  getWorkflowFrom(date, formStatusIds,formTypes) {

    let get_workflow_from ='?date=' + date + '&toDate=' + date;
    
    if (formStatusIds !== null) {
      get_workflow_from = get_workflow_from + '&formStatusIds=' + formStatusIds;
    }
    if (formTypes !== null) {
      get_workflow_from = get_workflow_from + '&formTypes=' + formTypes;
    }
    return this.apiService.get(environment.base_value.entity_form + get_workflow_from);
  }
  // Component: Health Test, Health Check, Reader, Resource, Digital Queue, Manage Facility, Patient, Support Ticket, User Management, Health Checkup
  // Entry Component: Confirmation Dialog, Edit Daily Management, Enroll Patient, Patient
  getAppTermsVerion2(data) {
    return this.apiService.get(environment.base_value.get_app_terms_v2 + '/' + data);
  }
  getAppTermFacility(data) {
    return this.apiService.get(environment.base_value.get_app_term_facility + '/' + data);
  }
  getAppTermsWithoutLogin(data) {
    return this.apiService.get(environment.base_value.get_app_terms + '/' + data);
  }

  getOTHealthPlan(key, name?: string) {
    return this.apiService.get(environment.base_value.get_ot_health_plan + '?planTypeId=' + key + '&name=' + name);
  }
  getOTProcedure(name?: string) {
    if (name) {
      return this.apiService.get(environment.base_value.get_search_ot_procedure + '?name=' + name);
    }
    return this.apiService.get(environment.base_value.get_search_ot_procedure);
  }

  getDigitalQueueSummary(selectedDate?) {
    let param = '?planTypeId=HP-OT'
    if(selectedDate){
      param = param + '&fromDate='+selectedDate;
    }
     return this.apiService.get(environment.base_value.get_dq_patient_by_floor + param);
  }

  getOtCardSummary(selectedDate?,testCategory?,status?, location?: any, visitTypeId?){
    let param = '';
    if(selectedDate){
      param = param + '?date='+selectedDate;
    }
    if(testCategory){
      param = param + '&testCategory='+testCategory;
    }
    if(status){
      param = param + '&status='+status;
    }
    if(location !== undefined && location !== null) {
      param = param + '&wardIds=' + location;
    }
    if(visitTypeId){
      param = param + '&visitTypeId='+visitTypeId;
    }
     return this.apiService.get(environment.base_value.get_ot_card + param);
  }
  getECDigitalQueueSummary() {
    return this.apiService.get(environment.base_value.get_dq_patient_by_floor + '?planTypeId=HP-EC');
  }

  getAllLocationType() {
      return this.apiService.get(environment.base_value.get_all_location_type);
  }

  // Entry Component: Confirmation Dialog
  cancleBilling(data) {
    return this.apiService.post(environment.base_value.cancel_billing, data);
  }
  // Ambulance Workflow
  saveAmbulanceRequest(data) {
    return this.apiService.post(environment.base_value.amb_request, data);
  }
  updateAmbulanceRequest(data) {
    return this.apiService.put(environment.base_value.amb_request + '/' + data.requestId, data);
  }
  updateAmbulanceRequestStatus(data, id) {
    return this.apiService.put(environment.base_value.update_amb_request_status + '/' + id, data);
  }
  
  // Porter Workflow
  savePorterRequest(data) {
    return this.apiService.post(environment.base_value.save_porter_request, data);
  }
  savePwaRequest(data, isGuest) {
    let url = environment.base_value.save_porter_request
    if(isGuest) {
      url = environment.base_value.pwa_porter_request;
    }
    return this.apiService.post(url, data);
  }
  
  updatePorterRequest(data) {
    return this.apiService.put(environment.base_value.save_porter_request + '/' + data.requestId, data);
  }
  updatePorterRequestStatus(data, id) {
    return this.apiService.put(environment.base_value.update_porter_request_status + '/' + id, data);
  }
  searchAssetByCategory(type, data) {
    if(type !== null) {
      return this.apiService.get(environment.base_value.search_asset_by_categoryId + '?assetTypeId=' + type + '&name=' + data);
    } else {
      return this.apiService.get(environment.base_value.search_asset_by_categoryId + '?name=' + data);
    }
  }
  searchAssetByName(data){
    return this.apiService.get(environment.base_value.search_assey_by_name + '/' + data);
  }
  getPorterRequestType() {
    return this.apiService.get(environment.base_value.get_app_terms + '/PorterRequestType');
  }
  getPorterHistory(id) {
    return this.apiService.get(environment.base_value.get_porter_history + '?requestId=' + id);
  }
  getWaitlistReason(id) {
    return this.apiService.get(environment.base_value.get_waitlist_reason + id);
  }
  getPorterRequestSubject(type: any) {
    return this.apiService.get(environment.base_value.porter_request_subject + '/' + type);
  }
  getRequestFromLocation(id) {
    return this.apiService.get(environment.base_value.get_from_location_id + '/' + id);
  }

  searchBedLocation(name, fromDate, toDate) {
    return this.apiService.get(environment.base_value.get_bed_location_search + '?searchText=' + name + '&fromDate=' + fromDate + '&toDate=' + toDate);
  }

  searchInfantBedLocation(type, name, workflowTypeId) {
    return this.apiService.get(environment.base_value.get_bed_location_search + '?locationCategory=' + type + '&searchText=' + name + '&workFlowId=' + workflowTypeId);
  }
  getAllUser(){
    return this.apiService.get(environment.base_value.get_user_v2)
  }
  searchDoctor(name, userType?: string, roleType?: string) {
    if (roleType != null) {
      return this.apiService.get(environment.base_value.search_doctor + '?name=' + name + '&roleTypes=' + roleType);
    } else {
      return this.apiService.get(environment.base_value.search_doctor + '?name=' + name + '&userTypeId=' + userType);
    }
  }
  searchEntityAvailablity(categoryId?: string,entityType?: string,fromDate?: any,name?: string,roleTypes?: string,toDate?: any) {
    const params = { categoryId, entityType, fromDate, name, roleTypes, toDate };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_entity_availablity_list, params);
    return this.apiService.get(url);
  }
  // getRollListid(rlid){
  //   return this.apiService.get(environment.base_value.roleid + '?rlid=' + rlid);
  // }
  cancelPatientVist(data) {
    return this.apiService.post(environment.base_value.cencel_patient_visits, data);
  }

  getAllUserSearch(name?: any, pageStart?, pageSize?) {
    const params = { name, pageStart, pageSize };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_user_list, params);
    return this.apiService.get(url);
  }
  
  getInfantDets(id: any) {
    const params = { id };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_all_mother, params);
    return this.apiService.get(url)
  }

  getEntityShifts(entityId?: any, entityType?: any, fromDate?: any, toDate?: any, sText?: any, pageSize?: any, pageStart?: any) {
    const params = { entityId, entityType, fromDate, toDate, sText, pageSize, pageStart };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_entity_shifts, params);
    return this.apiService.get(url);
  }

  getDateWishShifts(fromDate?: any, toDate?: any, pageStart?: any, pageSize?: any, sText?: any, roleCode?: any) {
    const params = { fromDate, toDate, pageStart, pageSize, sText, roleCode };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_date_wish_shifts, params);
    return this.apiService.get(url);
  }

  updateShifts(data) {
    return this.apiService.post(environment.base_value.update_shifts, data);
  }

  getRollList(){
    return this.apiService.get("api/all/auth/get-all-roles");
  }
  getRollConfigList(stext?: any, pageStart?: any, pageSize?: any){
    const params = { stext, pageStart, pageSize };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_roll_list, params);
    return this.apiService.get(url);
  }
  getAlertHistory(id) {
    return this.apiService.get(environment.base_value.ip_alert_history + '?patientId=' + id);
  }
  getVisitHistory(id) {
    return this.apiService.get(environment.base_value.visit_history + '?patientId=' + id);
  }
  getRoutineHistory(id) {
    return this.apiService.get(environment.base_value.ip_routine_history + '?patientId=' + id);
  }
  getRoutineEventDetails(id, type, filterDate?: string, pageStart?: any, pageSize?: any) {
    if (filterDate != null) {
      return this.apiService.get(environment.base_value.routine_event_details + '?identifyingId=' + id + '&identifyingType=' + type +
      '&date=' + filterDate + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
    } else {
      return this.apiService.get(environment.base_value.routine_event_details + '?identifyingId=' + id + '&identifyingType=' + type +
      '&pageStart=' + pageStart + '&pageSize=' + pageSize);
    }
  }
  getCustomerInfo(id) {
    return this.apiService.get(environment.base_value.customer_info + '/' + id);
  }
  getCustomerFacilitylist(customerTypeId? : string, sText?: string, pageSize?: number, pageStart?: number) {
    const params = { customerTypeId, sText, pageSize,  pageStart};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_custom_facility, params);
    return this.apiService.get(url);
  }
  getInpatientListByVisitId(id) {
    return this.apiService.get(environment.base_value.get_ip_patient_info_by_id + '/' + id);
  }
  assetTransfer(data) {
    return this.apiService.post(environment.base_value.save_asset_transfer, data );
  }
  getFacilityList(reg_id) {
      return this.apiService.get(environment.base_value.get_facility_list + '/' + reg_id);
  }
  getSpecialityQryStr(qryStr?: any){
    return this.apiService.get(environment.base_value.get_ip_speciality_loc + '?' + qryStr);
  }
  getLocationByReaderType(type){
    return this.apiService.get(environment.base_value.locations_by_readerType + '?readerType=' + type);
  }
  getOTSpecialty(){
    return this.apiService.get(environment.base_value.get_ot_specialty);
  }
  getSpecialityLoc(careSettingIds?: string, categoryIds?: string, text?: string, workFlowId?: string) {
    let searchLoc = null;
    if (careSettingIds !== null) {
      if (searchLoc === null) {
        searchLoc = '?careSettingIds=' + careSettingIds + '&locationTypeIds=3';
      } else {
        searchLoc = searchLoc + '&careSettingIds=' + careSettingIds + '&locationTypeIds=3';
      }
    }
    if (categoryIds !== null) {
      if (searchLoc === null) {
        searchLoc = '?categoryIds=' + categoryIds;
      } else {
        searchLoc = searchLoc + '&categoryIds=' + categoryIds;
      }
    }
    if (text !== null && text !== undefined) {
      if (searchLoc === null) {
        searchLoc = '?stext=' + text;
      } else {
        searchLoc = searchLoc + '&stext=' + text;
      }
    }
    if (workFlowId !== null && workFlowId !== undefined) {
      if (searchLoc === null) {
        searchLoc = '?workFlowId=' + workFlowId;
      } else {
        searchLoc = searchLoc + '&workFlowId=' + workFlowId;
      }
    }
    if (searchLoc !== null) {
      return this.apiService.get(environment.base_value.get_ip_speciality_loc + searchLoc);
    } else {
      return this.apiService.get(environment.base_value.get_ip_speciality_loc);
    }
  }
  getSpecialityTypeBasedLoc(id, text) {
    return this.apiService.get(environment.base_value.get_ip_speciality_loc + '?categoryIds=' + id + '&stext=' + text);
  }
  getLocations() {
    return this.apiService.get(environment.base_value.get_ip_speciality_loc);
  }
  assetStatusChange(assetData, id) {
      return this.apiService.put(environment.base_value.edit_asset + '/' + id, assetData);
  }
  getIdentifier(id,type) {
    return this.apiService.get(environment.base_value.get_asset_identifier + '?entityId=' + id + '&entityType=' + type);
  }
  getAssetAttachFile(assetId) {
    return this.apiService.get(environment.base_value.get_asset_attach_file + '?assetId=' + assetId);
  }
  getAssetSerialNumber(assetCategory, assetType?){
    return this.apiService.get(environment.base_value.get_category_id+ '?category=' + assetCategory +'&assetType=' + assetType)
  }
  getLinkedAsset(assetId){
    return this.apiService.get(environment.base_value.get_linked_asset+ assetId)
  }
  getAssetSearch(id,sText,ownerId?,departmentIds?){
    const params = {id,sText,ownerId,departmentIds};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_asset_search, params);
    return this.apiService.get(url);
  }
  getAssetlist(assetTypeId?: any, sText?:any ) {
    const params = { assetTypeId, sText };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_asset_search, params);
    return this.apiService.get(url);
  }

  getEntitybookingPatinet(userId?:any, date?: any, pagination?: any) {
    const params = { userId, date, pagination };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_entity_booking_patinet, params);
    return this.apiService.get(url);
  }

  getAssetSensorSummary(id, history, filter, pageStart, pageSize,date) {
    let sensorDetails = '?assetId=' + id +'&fromDate='+date+'&toDate='+date+ '&isHistory=' + history + '&pageStart=' + pageStart + '&pageSize=' + pageSize;
    if (filter !== null) {
      sensorDetails += '&identifyingType=' + filter;
    }
    return this.apiService.get(environment.base_value.sensor_summary + sensorDetails);
  }
  getItemSearch(id, modelNo, name?) {
    let params = new URLSearchParams();
    if (id != null) {
      params.append('assetTypeId', id);
    }

    if (modelNo != null) {
      params.append('modelNumber', modelNo);
    }
    if (name != null) {
      params.append('sText', name);
    }
    const url = `${environment.base_value.get_item_search}?${params.toString()}`;
    return this.apiService.get(url);
  }


  getAssetConnectivity(id){
    return this.apiService.get(environment.base_value.get_asset_connectivity +"?assetId="+id )
  }

  getConnectivityAssets(locationId: number) {
    return this.apiService.get(`${environment.base_value.get_connectivity_assets}?locationId=${locationId}&pageStart=0&pageSize=50`);
  }

  getConnectivityAssetsByFloor(floorId: number) {
    return this.apiService.get(`${environment.base_value.get_connectivity_assets}?floorId=${floorId}&pageStart=0&pageSize=50`);
  }

  saveEntityItems(data){
    return this.apiService.post(environment.base_value.get_entity_items,data)
  }

  saveEntityPatient(data) {
    return this.apiService.post(environment.base_value.save_entity_booking_patinet, data)
  }

  updateEntityItems(id,data){
    return this.apiService.put(environment.base_value.get_entity_items + '/' +id ,data)
  }
  
  getEntityItems(id,type){
    return this.apiService.get(environment.base_value.get_entity_items + "?entityId=" + id +"&entityType=" +type )
  }
  searchEnittyItems(pageSize,pageStart,text){
    return this.apiService.get(environment.base_value.get_entity_items +"?pageSize="+pageSize+"&pageStart=" + pageStart + "&sText=" + text)
  }
  getItemType(id){
    return this.apiService.get(environment.base_value.get_item_search+ '?itemId=' + id)
  }

  
  isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  }

  // Component: Consumer
  getAllConsumers() {
    return this.apiService.get(environment.base_value.consumer_details);
  }
  saveConsumer(data) {
    return this.apiService.post(environment.base_value.consumer_details, data);
  }
  updateConsumer(data, id) {
    return this.apiService.put(environment.base_value.consumer_details + '/' + id, data);
  }
  getDeviceHistory(id, type) {
    return this.apiService.get(environment.base_value.consumer_device_history + '?tagAssociationId=' + id + '&tagAssociationTypeId=' + type);
  }

  // Commponent: Medical Record
  generateVolume(data) {
    return this.apiService.post(environment.base_value.generate_volume, data);
  }
  getVolume(id) {
    return this.apiService.get(environment.base_value.get_volume + '?patientId=' + id);
  }
  getAllVolumeDetails(id) {
    return this.apiService.get(environment.base_value.get_all_volume + '?requestId=' + id);
  }
  dispatchVolume(data) {
    return this.apiService.post(environment.base_value.dispatch_volume, data);
  }
  receiveVolume(data) {
    return this.apiService.post(environment.base_value.receive_volume, data);
  }
  sendMessageCenter(data) {
    return this.apiService.post(environment.base_value.send_Message, data);
  }
  MRReqStatusChange(data, id) {
    return this.apiService.put(environment.base_value.get_medical_record + '/' + id, data);
  }
  //Ticket
  saveTicketRequest(isNotifyAssetOwner,data) {
    return this.apiService.post(environment.base_value.save_ticket_request + '?isNotifyAssetOwner=' + isNotifyAssetOwner, data);
  }
  updateTicketRequest(isNotifyAssetOwner,data) {
    return this.apiService.put(environment.base_value.update_ticket_request + '/' + data.ticketId + '?isNotifyAssetOwner=' + isNotifyAssetOwner,data);
  }
  getTicketRequest(date, reqType?: string, reqId?:any) {
    let quaryParam = '?date=' + date + '&requestType=' + reqType;
    if(reqId) {
      quaryParam = '?requestId=' + reqId + '&requestType=' + reqType;
    }
    return this.apiService.get(environment.base_value.get_all_ticket_request + quaryParam);
  }
  getEntityTicketRequest(reqType?: string, Id?:any, Type?: string ,currentStatus?, parentId?) {
    let status = currentStatus !== 'all' ? currentStatus : null;
    let url = environment.base_value.get_all_ticket_request + '?entityId=' + Id + '&entityType=' + Type;
    if (status) {
      url += '&statusIds=' + status;
    }
    if(parentId) {
      url += '&parentId=' + parentId;
    }
    return this.apiService.get(url);
  }
  getTicketHistory(id) {
    return this.apiService.get(environment.base_value.get_porter_history + '?requestId=' + id);
  }
  getAttachment(id, type) {
    return this.apiService.get(environment.base_value.get_all_attachment + '/' + id + '?type=' + type);
  }
  //Task
  getUserDetailByLocId(data) {
    if(data.parentId !== null && data.locationTypeId !== null) {
      return this.apiService.get(environment.base_value.get_user_detail_by_locId + '?locationId=' + data.id + '&parentId=' + data.parentId + '&locationTypeId=' + data.locationTypeId);   
    } else {
      return this.apiService.get(environment.base_value.get_user_detail_by_locId + '?locationId=' + data.id);   
    }
  }
  saveTask(data) {
    return this.apiService.post(environment.base_value.save_task, data);
   }

   editTask(reqId, putData){
    return this.apiService.put(environment.base_value.save_task + '/' + reqId, putData);
   }
   
  getTask(id, type) {
    return this.apiService.get(environment.base_value.save_task + '?entityId=' + id + '&entityType=' + type);
  }

  getTasksByRequestId(requestId: any) {
    return this.apiService.get(environment.base_value.get_all_new_task + '?requestId=' + requestId);
  }

  // Facility-scoped "is a mustering currently open" check (facility itself is resolved
  // server-side from the session, same as the other mustering calls in this service) —
  // used on load so an active mustering (started before a logout, or from another
  // session/device) can be restored even when musteringState isn't in localStorage.
  getOpenMusteringTask(fromDate: string) {
    return this.apiService.get(
      environment.base_value.get_all_new_task +
      '?requestType=RQT-TASK&statusList=RQ-CR&routineTypes=TAC-SFE&fromDate=' + fromDate +
      '&pageStart=0&pageSize=50'
    );
  }
  getHistoryTask(id, type, date, pageSize, pageStart) {
    if (date !== null) {
      let url = environment.base_value.task_history + '?entityId=' + id + '&entityType=' + type + '&startDate=' + date;
      if(pageSize) {
        url = url + '&pageSize=' + pageSize + '&pageStart=' + pageStart 
      }
      return this.apiService.get(url);
    } else {
      let url = environment.base_value.task_history + '?entityId=' + id + '&entityType=' + type;
      if(pageSize) {
        url = url + '&pageSize=' + pageSize + '&pageStart=' + pageStart
      }
      return this.apiService.get(url);
    }
  }
  updateTask(requestId, data) {
    return this.apiService.put(environment.base_value.save_porter_request + '/' + requestId, data);
  }
  updateTaskRoutinestatus(id, data) {
    return this.apiService.put(environment.base_value.update_task_routine_status + '/' + id, data);
  }
  undoTaskRoutine(id, data) {
    return this.apiService.put(environment.base_value.undo_task_routine + '/' + id, data);
  }
  getActivitySearch(text, activityType, routineType) {
    return this.apiService.get(environment.base_value.get_all_activities + '?searchText=' + text + '&activityType=' + activityType + '&routineType=' + routineType);
  }
  getAttendanceEvent(date, pageStart, pageSize, userId) {
    return this.apiService.get(environment.base_value.get_attendance_event + '?date=' + date + '&pageStart=' + pageStart + '&pageSize=' + pageSize + '&userId=' + userId);
  }
  getTaskReport(fdt, rqid) {
    return this.apiService.get(environment.base_value.get_task_report + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt + '&rqid=' + rqid);
  }
  getActivityTaskDetails() {
    return this.apiService.get(environment.base_value.get_activity_task_details + '?requestType=' + 'RQT-OT');
  }
  getItemAttachment(id, type){
    return this.apiService.get(environment.base_value.get_item_master_attachment + '?id=' + id + '&type=' + type)
  }
  getAllAttachments(id, type, parentId?, parentType?) {
    let params = `?id=${id}&type=${type}`;  
    if (parentId !=null) params += `&parentId=${parentId}`;
    if (parentType !=null) params += `&parentType=${parentType}`;
    return this.apiService.get(environment.base_value.get_item_master_attachment + params);
  }
  getAttachement(id,type){
    return this.apiService.get(environment.base_value.get_item_master_attachment + '?parentId=' + id + '&parentType=' + type)
  }
  deleteItemAttachment(attachmentId) {
    return this.apiService.delete(environment.base_value.delete_item_attachment + '?id=' + attachmentId); 
  }
  getCategoryTaskList(categoryId, id){
    return this.apiService.get(environment.base_value.categoryBased_event_task_history + '?categoryId=' + categoryId + '&requestId=' + id);
  }
  // resources map

  createGroupReso(data){
    return this.apiService.post(environment.base_value.group_resource, data)
  }
  getGroupedResources(id){
    return this.apiService.get(environment.base_value.get_map_resource + '?groupId=' + id)
  }
  getMappedGroupRole(id, type){
    if(type === 'role') {
      return this.apiService.get(environment.base_value.get_mapped_role_resource + '?roleId=' + id)
    } else {
      let roleId = localStorage.getItem('userlevel')
      return this.apiService.get(environment.base_value.get_mapped_role_resource + '?roleId=' + roleId + '&userId=' + id)
    }
  }
  getMapResourcse(id){
    return this.apiService.get(environment.base_value.get_resource + '/' + id)
  }
  getResourceMap(userId, roleId, departmentId) {
    let params = '?as=1'
    if(userId) {
      params = params + '&userId=' + userId
    }
    if(roleId) {
      params = params + '&roleId=' + roleId
    }
    if(departmentId) {
      params = params + '&departmentId=' + departmentId
    }
    return this.apiService.get(environment.base_value.get_mapped_role_resource + params)
    
  }
  createMapGroup(data){
    return this.apiService.post(environment.base_value.map_group, data)
  }

  public sortByKey(array, key) {
    if (array && array.length) {
      let filterData = array.filter(val => val[key])
      let res1 = filterData.sort(function (a, b) {
        let x = a[key];
        let y = b[key];
        if (typeof (a[key]) === 'string') {
          x = a[key].toUpperCase();
          y = b[key].toUpperCase();
        }
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });
      if (array.filter(val => val[key] == null).length) {
        let nullValue = array.filter(val => val[key] == null)
        res1 = res1.concat(nullValue)
      }
      return res1
    } else {
      return array
    }
  }
  getTaskActivities(routineType, activityCategory) {
    return this.apiService.get(environment.base_value.get_all_activities + '?routineType=' + routineType + '&activityCategoryIds=' + activityCategory);
  }
  // Not in Use
  // getEditRequestId(id: any) {
  //   return [{
  //     id: 153,
  //     porterRequestType: 2,
  //     subjectId: 1,
  //     locationFromId: 117,
  //     locationToId: 116,
  //     startTime: '12:10 PM',
  //     endTime: '12:50 PM',
  //     noOfPorter: 2,
  //     noOfAsset: 2,
  //     isAutoAssigned: true,
  //     porterId: 1
  //   }];
  // }
  // getRequestType() {
  //   return [{ id: 1, name: 'Patient' },
  //   { id: 2, name: 'Asset' },
  //   { id: 3, name: 'Others' }];
  // }
  // getAssetList() {
  //   return [{ slno: 1, assetId: '1111', assetName: 'X-Ray' },
  //   { id: 2, assetId: '1112', assetName: 'Infusion Pump' },
  //   { id: 3, assetId: '1113', assetName: 'ECG Monitor' },
  //   { id: 4, assetId: '1114', assetName: 'Infusion Stand' },
  //   { id: 5, assetId: '1115', assetName: 'X-Ray Unit' },
  //   { id: 6, assetId: '1116', assetName: 'Infant weighing scale' },
  //   { id: 7, assetId: '1117', assetName: 'X-Ray Unit1' },
  //   { id: 8, assetId: '1118', assetName: 'X-Ray Unit2' }
  //   ];
  // }
  // updatePorterRequestById(id, status) {
  //   return this.apiService.put(environment.base_value.porter_request_status_update + id + '/' + status, status);
  // }
  // getLocationSearch(id) {
  //   return this.apiService.get(environment.base_value.get_to_location_search + '/' + id);
  // }
  // getCreatedPorterRequest() {
  //   return this.apiService.get(environment.base_value.get_all_created_request);
  // }

  // Not in Use
  // getGlobalSearchData() {
  //   const url = 'api/python-wrapper/reports/taglocation/0/0/' + localStorage.getItem(btoa('facilityId')) + '?fdt=2019-03-18&tid=T2';
  //   return this.apiService.get(url);
  // }
  // getCommonMenu() {
  //   return [{
  //     state: '/ovitag/dashboard',
  //     name: 'Dashboard',
  //     icon: 'dashboard',
  //     referMenu: 'MN_DB',
  //     url: 'M_dashboard'
  //   },
  //   {
  //     state: '/ovitag/workflow',
  //     name: 'Ovitag',
  //     icon: 'track_changes',
  //     referMenu: 'MN_OT',
  //     url: 'M_ovitag'
  //   },
  //   {
  //     state: '/ovitag/hospital',
  //     name: 'Hospital',
  //     icon: 'add_box',
  //     referMenu: 'MN_HP',
  //     url: 'M_hospital'
  //   },
  //   {
  //     state: '/ovitag/configuration',
  //     name: 'Configuration',
  //     icon: 'settings',
  //     referMenu: 'MN_CF',
  //     url: 'M_configuration'
  //   },
  //   {
  //     state: '/ovitag/analytic-insights',
  //     name: 'Analytic Insights',
  //     icon: 'pie_chart',
  //     referMenu: 'MN_RE',
  //     url: 'M_report'
  //   }
  //     // ,
  //     // {
  //     //   state : 'maps',
  //     //   name: 'Floor Plan',
  //     //   icon: 'pie_chart',
  //     //  }
  //   ];
  // }
  // getRefreshToken(refreshToken) {
  //   return this.apiService.post(environment.base_value.get_renew_token, refreshToken);
  // }
  // getAuthToken() {
  //   return localStorage.getItem(btoa('user_token'));
  // }
  // getAppTerms(data) {
  //   return this.apiService.get(environment.base_value.get_app_terms + '/' + data);
  // }
  // showSuccess() {
  //   this.toastr.successToastr('This is success toast.', 'Success!');
  // }
  // showError() {
  //   this.toastr.errorToastr('This is error toast.', 'Oops!');
  // }
  // showWarning() {
  //   this.toastr.warningToastr('This is warning toast.', 'Alert!');
  // }
  // showInfo() {
  //   this.toastr.infoToastr('This is info toast.', 'Info');
  // }
  // showToast(position: any = 'top-left') {
  //   this.toastr.infoToastr('This is a toast.', 'Toast', {
  //     position: position
  //   });
  // }
  deleteUserPreferenceId(key) {
    return this.apiService.delete(environment.base_value.user_preferences + '?key=' + key);
  }

  deleteUserPreference(id) {
    this.apiService.delete(environment.base_value.user_preferences + '/' + id)
      .toPromise()
    .then(res => {
      this.userPreference = res.results;
    })
    .catch(err => { console.log(err); });
  }
  // User Preferences
  getUserPreference(userId, roleId) {
    if(this.userPreference === null) {
      if (userId != null && roleId != null ) {
      this.apiService.get(environment.base_value.user_preferences + '?userId=' + userId + '&roleId=' + roleId)
       .toPromise()
       .then(res => {
         this.userPreference = res.results;
       })
       .catch(err => { console.log(err); });
      }
    }
  }
  getPreference(userId, roleId) {
    if (userId != null && roleId != null ) {
      return this.apiService.get(environment.base_value.user_preferences + '?userId=' + userId + '&roleId=' + roleId)
    } 
  }
  loggedOut() {
    return this.apiService.put(environment.base_value.user_logout, {});
  }

  validateUserPreference(key, value ?: any, isFacility: Boolean = true) {
    if (key != null && value != null) {
      const postData = {
        'key': key,
        'roleId': localStorage.getItem('userlevel'),
        'userId': localStorage.getItem(btoa('userId')),
        'value': value,
        'facilityId': isFacility ? localStorage.getItem(btoa('facilityId')) : null
      };
      if (this.userPreference != null && key != null && this.userPreference.hasOwnProperty(key)) {
        if (this.userPreference[key]['value'] !== value) {
          this.updateUserPreference(this.userPreference[key].id, postData).subscribe(res => {
            this.userPreference = res.results;
          });
        }
      } else {
        this.saveUserPreference(postData).subscribe(res => {
          this.userPreference = res.results;
        });
      }
    } else {
      this.getUserPreference(localStorage.getItem(btoa('userId')), localStorage.getItem('userlevel'));
    }
  }
  userPreferenceValidate(key, value = null) {
    const preference = this.userPreference;
    const postData = {
      'key': key,
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value': value
    };
    if (preference != null && value) {
      if (preference.hasOwnProperty(key)) {
        if (preference[key]['value'] !== value) {
          const id = preference[key]['value'];
          this.updateUserPreference(id, postData).subscribe(res => {
            this.userPreference = res.results;
          });
        }
      } else {
        this.saveUserPreference(postData).subscribe(res => {
          this.userPreference = res.results;
        });
      }
    }
  }

  saveUserPreference(data) {
    return this.apiService.post(environment.base_value.user_preferences, data);
  }

  updateUserPreference(id, data) {
    return this.apiService.put(environment.base_value.user_preferences + '/' + id, data);
  }
  getRecipientName(text, type) {
    return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text + '&recipientTypeId=' + type);
  }
  // TW TABLE
  getLiveLocation(type, id) {
    return this.apiService.get(environment.base_value.get_tag_associated_details + '?type=' + type + '&associateId=' + id);
  }
  commonMqttPublish(data){
    const topic = data.topic;
    return this.apiService.post(environment.base_value.publish_mqtt + '?topic=' + topic , data.message)
  }
  savePublisMqtt(data){
    //return this.apiService.post(environment.base_value.publish_mqtt,data)
   // console.log("Date ===="+JSON.stringify(data));
    const topic = 'tw/cache/gw/<fid>';
    return this.apiService.post(environment.base_value.publish_mqtt + '?topic=' + topic , data.message)
  }
  getEntityGroup(type?,pageStart?, pageSize?)
  {
    let param = "";
    param = type != null ? param + '?entityTypeIds=' + type : param;
    param = pageStart != null  ? param + '&pageStart=' + pageStart : param;
    param = pageSize != null  ? param + '&pageSize=' + pageSize : param;
    return this.apiService.get(environment.base_value.entity_group + param);
   }
  saveEntityGroup(postData) {
    return this.apiService.post(environment.base_value.entity_group, postData)
  }
  UpdateEntityGroup(id, postData) {
    return this.apiService.put(environment.base_value.entity_group + '/' + id, postData)
  }
  getEntityGroupMapping() {
    return this.apiService.get(environment.base_value.entity_group + '?skipGroupMapping=true')
  }
  getVisitorGroupMapping() {
    return this.apiService.get(environment.base_value.entity_group + '?entityTypeIds=EGTI-LOC&skipGroupMapping=true')
  }
  updatePfEntityGroupMapping(id, data) {
    if(id !== null) {
      return this.apiService.put(environment.base_value.pf_entity_group + '?id=' + id, data)
    } else {
      return this.apiService.put(environment.base_value.pf_entity_group, data)
    }
  }

  // Advertisement
  getAllReleaseOrders(){
    return this.apiService.get(environment.base_value.get_all_RO);
  }
  saveWorkflowbyEntity(data) {
    if (data.some(res => res.entityId)) {
      return this.apiService.post(environment.base_value.get_pf_workflow + '?entityId=' + data[0].entityId + '&entityTypeId=' + data[0].entityType, data);
    } else {
      return this.apiService.post(environment.base_value.get_pf_workflow, data);
    }
  }
  getworkflowbyEntity(entityTypeId, entityId?){
    const params = {entityTypeId , entityId}
    const url = this.urlBuilder.buildUrl(environment.base_value.get_pf_workflow, params);
    return this.apiService.get(url);
    // return this.apiService.get(environment.base_value.get_pf_workflow + '?entityTypeId=' + entityTypeName);
  }
  getEntityWorkFlow(entityId,entityType){
    let params = new URLSearchParams();
    if(entityId != null) params.append('entityId', entityId);
    if(entityType != null) params.append('entityType', entityType);
    const queryString = params.toString();
    return this .apiService.get(environment.base_value.get_entity_workFlows +  (queryString ? '?' + queryString : ''));
  }
  saveReleaseOrderEntry(postdata) {
    return this.apiService.post(environment.base_value.create_order_Entry, postdata);
  }
  saveRoActivtiy(id, postdata) {
    return this.apiService.post(environment.base_value.create_RO_Activity + '?campaignDetailId=' + id, postdata);
  }
  updateRoActivtiy(id, data) {
    return this.apiService.put(environment.base_value.edit_RO_Activity + '/' + id, data);
  }
  updateOrderEntry(id, data) {
    return this.apiService.put(environment.base_value.edit_order_entry + '/' + id, data);
  }
  getAllcampaign(id) {
    return this.apiService.get(environment.base_value.get_all_campaign + '?id=' + id);
  }
  getAllActivity(id) {
    return this.apiService.get(environment.base_value.get_all_RO_activity + '?id=' + id);
  }
  createAgents(postdata) {
    return this.apiService.post(environment.base_value.creat_agent, postdata);
  }
  editAgents(id,data) {
    return this.apiService.put(environment.base_value.update_agent + '/' + id, data);
  }
  saveAgentAddress(postData) {
    return this.apiService.post(environment.base_value.createAgent_address, postData);
  }
  updateAgentAddress(data) {
    return this.apiService.put(environment.base_value.editAgent_address, data);
  }
  getAgent(id){
    if(id && id !== 'All'){
    return this.apiService.get(environment.base_value.get_all_agent + "?type=" + id)
    } else {
    return this.apiService.get(environment.base_value.get_all_agent)
    }
  }
  getSearchAgent(type, text){
    return this.apiService.get(environment.base_value.get_all_agent +"?type=" + type + '&sText=' + text)
  }
  getAllAgentInfo(id, type){
    return this.apiService.get(environment.base_value.get_all_agent_address +"?entityId=" + id + '&entityType=' + type);
  }
  getApiWithUrl(url) {
    return this.apiService.get(url);
  }
  clearcache(data, name?){
    let url = name ? environment.base_value.clear_cache + '?name='+name : environment.base_value.clear_cache;
    return this.apiService.post(url, data);
  }
  getAllAlertInfo(ruletype,selectedDate) {
    return this.apiService.get(environment.base_value.alert_api+"?ruleTypeId="+ruletype+"&startDate="+selectedDate+"&endDate="+selectedDate);
    // return this.apiService.get(environment.base_value.alert_api+"?isActive="+isActive+"&isForCurrentUser="+isForCurrentUser+"&ruleTypeId="+ruletype);
  }
  addBreak(data){
    return this.apiService.post(environment.base_value.add_break, data);
  }
  getTagBatteryStatus(data) {
    return this.apiService.post(environment.base_value.get_tag_battery_status, data);
  }
  getMotherInfantAlertCount() {
    return this.apiService.get(environment.base_value.get_mother_infant_alert_count);
  }
  getReaderStatus(data){
    return this.apiService.post(environment.base_value.get_reader_status, data);
  }
  scheduleUser(data) {
    return this.apiService.post(environment.base_value.schedule_user, data);
  }
  getScheduleUser(date) {
    return this.apiService.get(environment.base_value.scheduled_user + '?date=' + date);
  }
  getActivityPerformer(activityId, date) {
    return this.apiService.get(environment.base_value.get_activity_performer + '/' + activityId + '?date=' + date);
  }
  getPfModelData(modelId) {
    return this.apiService.get(environment.base_value.get_pf_mode_data + '/' +modelId);
 }
 getShiftHistory(id, type) {
  return this.apiService.get(environment.base_value.get_shift + '?entityId=' + id + '&entityType=' + type);
 }
 // supplier

 createSupplier(data){
  return this.apiService.post(environment.base_value.manage_supplier, data)
 }

 editSupplier(id, data){
  return this.apiService.put(environment.base_value.manage_supplier + '/' + id, data)
 }

 getSupplierById(id?, name?){
  let url = environment.base_value.get_supplier
  if(id !== null){
    url += '?id=' + id 
  }
  if(name !== null && name !== undefined && name !== ""){
    url += '?name=' + name;
  }
  return this.apiService.get(url)
 }

 //Intend
 createRequestDelivery(postData){
  return this.apiService.post(environment.base_value.delivery_request, postData)
 }
 modifyRequestDelivery(id, postData){
  return this.apiService.put(environment.base_value.delivery_request + '/' + id, postData)
 }

 getBatchId(itemId){
  return this.apiService.get(environment.base_value.get_by_batch_Id + '?itemId=' + itemId)
 }
 
  getmsgnotification(date, identifyingType, pageStart, pageSize, id, recipientType) {
    return this.apiService.get(environment.base_value.get_Message + '?date=' + date + '&identifyingType=' + identifyingType + '&pageStart=' + pageStart + '&pageSize=' + pageSize
      + '&recipientId=' + id + '&recipientType=' + recipientType);
  }
  sendOTP(name,phoneNumber, facilityId) {
    return this.apiService.get(environment.base_value.send_Otp  + '?name=' + name + '&phoneNumber=' + phoneNumber + '&userType=' + 'UNREGISTERED_PATIENT' + '&facilityId='+ facilityId);
  }
  verifyOTP(otpcode,phoneNumber) {
    return this.apiService.get(environment.base_value.verify_Otp + '?otpcode=' + otpcode + '&phone=' + phoneNumber + '&isAccess=true');
  }
  getGuestInfo(payload) {
    return this.apiService.post(environment.base_value.guest_user, payload);
  }

  //notifications

  getAllNotifications(userId, start, size, clear, type, unRead, alertTypeId, startDate ?, ruleTypeId ?){
    let url = environment.base_value.get_notifications + '/' + userId + '?pageStart=' + start + '&pageSize=' + size +
     '&isCleared=' + clear + '&isActive=true'
    if(type) {
      url += '&notiIdentifyingType=' + type
    }

    if(alertTypeId) {
      url += '&alertTypeId=' + alertTypeId
    }

    if(unRead) {
      url += '&isSeen=' + unRead;
    }

    if(startDate){
      url += '&startDate=' + startDate;
    }

    if(ruleTypeId !== 'all' && ruleTypeId !== null && ruleTypeId !== undefined){
      url += '&ruleTypeId=' + ruleTypeId;
    }
    
    return this.apiService.get(url);
  }

  updateNotification(data){
    return this.apiService.put(environment.base_value.notification_update, data)
  }

  getNotificationCount(userId){
    return this.apiService.get(environment.base_value.notification_count + '/' + userId)
  }

  sentOtpPatient(name,mobileNo,facilityId){
    return this.apiService.get(environment.base_value.send_Otp+"?name="+name +'&phoneNumber='+mobileNo +'&userType=' +'USER' +'&facilityId='+facilityId )
  }
  
  sentOtpPharamacy(name,mobileNo,facilityId){
    return this.apiService.get(environment.base_value.send_Otp+"?name="+name +'&phoneNumber='+mobileNo +'&userType=' +'UNREGISTERED_USER' +'&facilityId='+facilityId )
  }
  //taskcount
  getTaskCount(date, includeMy, reqType, dep){
    let param = '?fromDate=' + date
    if(includeMy != undefined && includeMy !== null) {
      param = param + '&includeMyRequest=' + includeMy;
    } 
    if(reqType !== null) {
      param = param + '&requestType=' + reqType;
    }
    if(dep !== undefined && dep !== null){
      param = param + '&departmentIds=' + dep;
    }
    return this.apiService.get(environment.base_value.get_task_count + param )
  }
  getPatientInfoById(patientId, params) {
    return this.apiService.get(environment.base_value.get_all_patient_details + '/' + patientId + '?' +params);
  }
  getAllpatientDetailedList(id,visitType, visitEvent, visitEventId?: any, date?: any, isModified?: boolean) {
    let param = ""; 
    param = id != null ? param + '/' + id : param;
    param = visitType != null ? param + '?visitTypeId=' + visitType : param;
    param = visitEvent != null ? param + '&visitEventTypeId=' + visitEvent : param;
    param = visitEventId != null && visitEventId != undefined ? param + '&visitEventId=' + visitEventId : param;
    param = date != null && date != undefined ? param + '&date=' + date : param;
    param = isModified != null && isModified != undefined ? param + '&isModified=' + isModified : param;
    return this.apiService.get(environment.base_value.get_all_patient_details + param);
  }

  getHealthPlanTemplate(page?, identifyingValues?, identifyingType?, fromDate?, toDate?) {
    if (page && identifyingValues && identifyingType) {
      return this.apiService.get(environment.base_value.get_health_Plan_templates + '?page=' + page + '&identifyingValues=' + identifyingValues + 
        '&identifyingType=' + identifyingType + '&fromDate=' + fromDate + '&toDate=' + toDate)
    }
    return this.apiService.get(environment.base_value.get_health_Plan_templates)
  }

  getResourceTemplate(name?: string, pageSize?: number, pageStart?: number) {
    let resource_list = '';
    if (name !== null && name !== undefined) {
      resource_list = resource_list + '&name=' + name;
    }
    if (pageSize !== null && pageSize !== undefined || pageStart !== null && pageStart !== undefined) {
      resource_list = resource_list +  '?pageStart=' + pageStart + '&pageSize=' + pageSize;
    }
    return this.apiService.get(environment.base_value.get_health_Plan_templates + resource_list)
  }

  getSterlieSetList(name?: string, pageSize?: number, pageStart?: number, id?:any, code?:any) {
    let sterlieset_list = '';
    if (name !== null && name !== undefined) {
      sterlieset_list = sterlieset_list + '?name=' + name;
    }
    if (pageSize !== null && pageSize !== undefined || pageStart !== null && pageStart !== undefined) {
      sterlieset_list = sterlieset_list + '?pageStart=' + pageStart + '&pageSize=' + pageSize;
    }
    if(id !== null && id !== undefined) {
      sterlieset_list = sterlieset_list + '?id=' + id;
    }
    if(code !== null && code !== undefined){
      sterlieset_list = sterlieset_list + '?codes=' + code;
    }
    return this.apiService.get(environment.base_value.get_sterlieset_list + sterlieset_list)
  }

  getSetRequestList(){
    return this.apiService.get(environment.base_value.get_set_resquest_list)
  }

  getAssetNamelist(assetTypeId?) {
    if (assetTypeId != null && assetTypeId != undefined) {
      return this.apiService.get(environment.base_value.get_all_assets + '?assetTypeId=' + assetTypeId)
    }
    return this.apiService.get(environment.base_value.get_all_assets)
  }

  getAssetSerialNumList(assetSerialNumber?: any){
    return this.apiService.get(environment.base_value.get_all_assets+ '?assetSerialNumber=' + assetSerialNumber)
  }

  saveSterliesetsResource(data) {
    return this.apiService.post(environment.base_value.save_sterlieset_list, data)
  }

  updateSterlieSetresource(id, data) {
    return this.apiService.put(environment.base_value.save_sterlieset_list + '/' + id, data);
  }

  saveResourceTamplate(data) {
    return this.apiService.put(environment.base_value.save_resource_tamplate, data);
  }
  
  updateAllpatientDetails(data) {
    return this.apiService.put(environment.base_value.update_all_patient_details + '/' + data.patientId, data);
  }

  getAllLocationList(pageStart, pageSize, location, status, sText,isIncludeGroup?,entityGroupId?) {
      const params: any = {};
      if (pageStart !== null && pageStart !== undefined) params.pageStart = pageStart;
      if (pageSize !== null && pageSize !== undefined) params.pageSize = pageSize;
      if (location !== null && location !== undefined) params.locationTypeIds = location;
      if (status !== null && status !== undefined) params.statusList = status;
      if (sText !== null && sText !== undefined) params.sText = sText;
      if (isIncludeGroup !== null && isIncludeGroup !== undefined) params.isIncludeGroup = isIncludeGroup;
      if (entityGroupId !== null && entityGroupId !== undefined) params.entityGroupId = entityGroupId;
      const queryString = new URLSearchParams(params).toString();
      const url = `${environment.base_value.get_all_location_list}${queryString ? '?' + queryString : ''}`;
      return this.apiService.get(url);
  }

  getAllLocationData(locationIdentifier? : any){
    return this.apiService.get(environment.base_value.get_all_location_list + '?locationIdentifier=' + locationIdentifier);
  }

  getAuditLocationList(scheduleId,isAudit,pageStart, pageSize,locationCategory?,locationType?,sText?){
      const params: any = {};
      if (scheduleId !== null && scheduleId !== undefined) params.scheduleId = scheduleId;
      if (isAudit !== null && isAudit !== undefined) params.isAudit = isAudit;
      if (pageStart !== null && pageStart !== undefined) params.pageStart = pageStart;
      if (pageSize !== null && pageSize !== undefined) params.pageSize = pageSize;
      if (locationCategory !== null && locationCategory !== undefined) params.locationCategory = locationCategory;
      if (locationType !== null && locationType !== undefined) params.locationTypeIds = locationType;
      if (sText !== null && sText !== undefined) params.sText = sText;
      const queryString = new URLSearchParams(params).toString();
      const url = `${environment.base_value.get_all_location_list}${queryString ? '?' + queryString : ''}`;
      return this.apiService.get(url);
  }

  getAssetcatagory(assetCategoryId?, sText?){
    if(assetCategoryId && sText){
      return this.apiService.get(environment.base_value.get_asset_search + '?assetCategoryId=' + assetCategoryId + '&sText=' + sText )
    } else if(!assetCategoryId && sText){
      return this.apiService.get(environment.base_value.get_asset_search+'?sText='+ sText )
    } else {
      return this.apiService.get(environment.base_value.get_asset_search )
    }
  }
  saveDepartment(data){
    return this.apiService.post(environment.base_value.post_department, data);
  }
  updateDepartment(data, id){
    return this.apiService.put(environment.base_value.put_departemnt + '/' + id, data);
  }
  searchMobileUser(name,type){
    return this.apiService.get(environment.base_value.get_user_details_name + '?searchName=' +name +'&type='+type)
  }
  
  saveFile(file){
    return this.apiService.post(environment.base_value.save_attach_file,file)
  }
  
  
  //meetings
  pushNotification(data){
    return this.apiService.post(environment.base_value.push_notification,data)
  }

  inviteUser(data){
    return this.apiService.post(environment.base_value.inviteUser,data)
  }

  getUser(data,id){
    return this.apiService.get(environment.base_value.userList+"/"+data+"/"+id)
  }

  userStatus(channelName,id,data){
    return this.apiService.put(environment.base_value.userStatus+"/"+channelName+"/"+id,data)
  }

  // tagConfig status or batteryStatus

  getTagConfi(data) {
    if(this.tagStatusPreference === null) {
       this.apiService.get(environment.base_value.config_url + '/' + data).toPromise().then(res => {
        if(res.statusCode === 1){
          this.tagStatusPreference = res.results;
        }
       }).catch(err => { console.log(err) });
    }
  }
  
  //To convert an Object to a String
  convertObjectToString(styleObj: { [key: string]: any }){
  if (!styleObj || typeof styleObj !== 'object') return '';
  return Object.entries(styleObj).map(([key, value]) => `${key}: ${value}`).join('; ');
  }

  //To convert a String to an Object
  convertStringToObject(styleStr): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    if (!styleStr) return result;
    styleStr.split(';').forEach(part => {
      const [key, value] = part.split(':').map(s => s?.trim());
      if (key && value) {
        result[key] = value;
      }
    });
    return result;
  }

  //user (multiple department link to an user)
  saveDepartmentData(data){
    return this.apiService.post(environment.base_value.get_user_department_links ,data);
  }

  updateDepartmentData(data){
    return this.apiService.put(environment.base_value.get_user_department_links ,data);
  }
     
  //additionalcost (depreciation)
  saveAdditionalCost(data){
    return this.apiService.post(environment.base_value.additional_cost ,data);
  }
  getDepreciationSchedule(data){
    return this.apiService.get(environment.base_value.get_depreciation_schedule+'/'+data);
  }
  getAdditionalCost(data){
    return this.apiService.get(environment.base_value.get_additional_cost+'/'+data);
  }

  // Asset maintenance summary //

  getAssetMaintenanceSummary(id?: any, sText? : string, fromDate? : any, toDate? : any, isMyAsset?: any, isMyDepartment?: any , assetTypeIds?, isOwnedDepartment?, isAssignedDepartment?, departmentIds?, statusList?,assetCategoryIds?, activityCategoryIds?, scheduleTypes?, assetStatusList?, isYearly?, pageSize? : number, pageStart? : number) {
    const params = {id, sText, fromDate, toDate, isMyAsset, isMyDepartment, assetTypeIds, isOwnedDepartment, isAssignedDepartment, departmentIds, statusList, assetCategoryIds,activityCategoryIds, scheduleTypes, assetStatusList, isYearly, pageSize, pageStart};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_all_asset_maintance, params);
    return this.apiService.get(url);
  }

  getAssetMaintenanceCalendar(sText?: any, fromDate?: any, toDate?: any, assetTypeIds?: any, departmentIds?: any, isOwnedDepartment?: any, isAssignedDepartment?: any, activityCategoryIds?: any, statusIds?:any, pageStart?: any, pageSize?: any) {
    const params = {sText, fromDate, toDate, assetTypeIds, departmentIds, isOwnedDepartment, isAssignedDepartment, activityCategoryIds, statusIds, pageStart, pageSize};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_all_asset_maintence_calendar, params);
    return this.apiService.get(url)
  }

  getAssetMaintenanceCount(fromDate?: any, toDate?: any, assetTypeIds?: any, departmentIds?: any, isOwnedDepartment?: any, ownerId?: any, activityCategoryIds?: any, isAssignedDepartment?: any, statusIds?:any, scheduleTypes?: any ) {
    const params = {fromDate, toDate, assetTypeIds, departmentIds, isOwnedDepartment, ownerId, activityCategoryIds,isAssignedDepartment, statusIds, scheduleTypes};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_all_asset_maintenance_count, params);
    return this.apiService.get(url)
  }

  getEnityKpiDetails(entityId, entityType) {
    return this.apiService.get(environment.base_value.get_entity_kpi_details +'?entityId=' + entityId + '&entityType=' + entityType );
  }
  getEntityDetail(entityType, entityId, tagId){ 
    return this.apiService.get(environment.base_value.get_entity_detail + '?entityId=' +  entityId + '&entityType=' + entityType + '&tagId=' + tagId)
  }
  
  getEntityKpiTemaplates(){
    return this.apiService.get(environment.base_value.get_entity_kpi_templates)
  }
  postKpiTemplate(data) {
  return this.apiService.post(environment.base_value.get_entity_kpi_details, data);
  }
  updateKpiTemplate(id,data) {
  return this.apiService.put(environment.base_value.get_entity_kpi_details + '/' + id, data);
  }
  getDeliveryRequest(deliveryRequestTypeId, sText?: string) {
    let params = '?deliveryRequestTypeId=' + deliveryRequestTypeId;
    if(sText != undefined && sText != null) {
      params = params + '&sText=' + sText;
    }
    return this.apiService.get(environment.base_value.delivery_request + params)
  }

  //Activity-Rule
  saveActivityRule(postData){
    return this.apiService.post(environment.base_value.all_activity_rule, postData)
  }

  getActivityRule(id?){
    if(id !== null && id !== undefined) {
      return this.apiService.get(environment.base_value.get_all_activity_rule + '/' + id)
    } else {
      return this.apiService.get(environment.base_value.get_all_activity_rule)
    }
  }
  getChannelTemplate(){
    return this.apiService.get(environment.base_value.get_alert_rule_template);
  }
  
  n8ntemplate(data) {
    return this.apiService.n8nPost(environment.base_value.n8n_create_from, data)
  }

  saveFormGeneration(data) {
     return this.apiService.n8nPost(environment.base_value.n8n_form_generation, data)
  }
      saveChannelTemplate(data){
    return this.apiService.put(environment.base_value.get_alert_rule_template,data);
  }

  getCustomFilterData(apiName: string, queryString: string): Observable<any> {
    if(queryString){
    return this.apiService.get(`${apiName}?${queryString}`);
    }else{
    return this.apiService.get(`${apiName}`);
    }
  }

  getAssociationData(sText?: any, qualifiers?: any, entityId?: any, entityType?: any, pageStart?: any, pageSize?: any) {
    const params = {sText, qualifiers, entityId, entityType, pageStart, pageSize};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_entity_association, params);
    return this.apiService.get(url)
  }

  getUniqueAssociations(sText?: any, pageStart?: any, pageSize?: any) {
    const params = {sText, pageStart, pageSize};
    const url = this.urlBuilder.buildUrl(environment.base_value.get_unique_entity_associations, params);
    return this.apiService.get(url);
  }

  getManufacturerList(stext?) {
    let url = environment.base_value.search_manufacturer;
    if (stext) {
      url += `?sText=${encodeURIComponent(stext)}`;
    }
    return this.apiService.get(url);
  }

  getModelNumberList(type, stext?) {
    let url = `${environment.base_value.search_modelNo}?idType=${encodeURIComponent(type)}`;
    if (stext) {
      url += `&sText=${encodeURIComponent(stext)}`;
    }
    return this.apiService.get(url);
  }

  getPfmodelList(sText?: any, pageStart?: any, pageSize?: any) {
    const params = { sText, pageStart, pageSize };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_pf_models, params);
    return this.apiService.get(url);
  }

  get_group_appterms(groupName,pageStart, pageSize) {
    return this.apiService.get(environment.base_value.get_group_appterms + '?groupName='+ groupName + '&lang=en' + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
  }

  findMenuByCode(list: any[], code: string): any | null {
      if (!Array.isArray(list)) return null;
      
      const directMatch = list.find(item => item?.code === code);
      if (directMatch) {
        return directMatch;
      }
      for (const item of list) {
        if (item?.subMenus?.length) {
          const found = this.findMenuByCode(item.subMenus, code);
          if (found) return found;
        }
      }
      return null;
    }
  
  updatedMail(data) {
    return this.apiService.post(environment.base_value.updated_by_mail, data);
  }
  
  
  // chat-bot

  saveChatConversation(data) {
    return this.apiService.post(environment.base_value.chat_conversation, data);
  }

  getChatHistory(id: number, page: number, size: number) {
    const url = `${environment.base_value.chat_conversation}/${id}/messages?page=${page}&size=${size}`;
    return this.apiService.get(url);
  }

  sendChatMessage(conversationId: number, payload: any) {
    const url = `${environment.base_value.chat_conversation}/${conversationId}/messages`;
    return this.apiService.post(url, payload);
  }

  getAllChatConversations(userId: any, entityType: any, page?: number, size?: number) {
    let params = { userId, entityType, page, size };
    const url = this.urlBuilder.buildUrl(environment.base_value.chat_user_conversations, params);
    return this.apiService.get(url);
  }

  markChatAsRead(conversationId: number, userId: number) {
    const url = `${environment.base_value.chat_conversation}/${conversationId}/messages/mark-read?userId=${userId}`;
    return this.apiService.put(url,'');
  }

  postPatientRelations(data,id?){
    if(id){
      return this.apiService.put(environment.base_value.save_patient_relation +"/"+id,data)
    }else{
      return this.apiService.post(environment.base_value.save_patient_relation,data)}
  }
  
  putPatientRelations(data){
      return this.apiService.put(environment.base_value.put_patient_relation,data)
  }
  getPatientRelations(id?){
    if(id){
      return this.apiService.get(environment.base_value.get_patient_relation+"?patientId="+id)
    }else{
       return this.apiService.get(environment.base_value.get_patient_relation)
    }
  }
  //Approval Matrix
  getApprovalMatrix(pageStart, pageSize, types?, statuses?, sText?, fromDate?, toDate?,isLoggedIn?) {
    let params: any = { pageStart, pageSize, types, statuses, sText, fromDate, toDate, ...(isLoggedIn ? { userId: localStorage.getItem(btoa('userId')), roleId: localStorage.getItem('userlevel'), departmentIds: localStorage.getItem(btoa('departmentIds')) } : { currentUserId: localStorage.getItem(btoa('userId')) }) };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_approval_matrix, params);
    return this.apiService.get(url);
  }

  
  //User Guide
  getUserGuideList(code?, category?, documentTypeId?, status?, language?, isActive?, sText?) {
    let params: any = { code, category, documentTypeId, status, language, isActive, sText };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_user_guide_list, params);
    return this.apiService.get(url);
  }

  saveUserGuide(data) {
    if (data?.id) {
      return this.apiService.put(environment.base_value.save_user_guide + '/' + data.id, data);
    } else {
      return this.apiService.post(environment.base_value.save_user_guide, data);
    }
  }

  getGuideByCode(code?, id?) {
    const params: any = { code, id };
    const url = this.urlBuilder.buildUrl(environment.base_value.get_user_guide_code, params);
    return this.apiService.get(url);
  }
}

