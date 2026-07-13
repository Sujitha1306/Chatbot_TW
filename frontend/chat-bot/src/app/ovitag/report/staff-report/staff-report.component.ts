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
import {ExcelService, PdfService, CommonService, ChartService,HospitalService, ConfigurationService } from '../../../shared';
import { FormGroup, FormBuilder,  FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-staff-report',
  templateUrl: './staff-report.component.html',
  styleUrls: ['./staff-report.component.scss']
})
export class StaffReportComponent implements OnInit {
 
  public reportForm: FormGroup;
  public date: any = new Date();
  // public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public reportList : any;
  public reportData : any = [];
  public param : any;
  public HCselected = 'staff-summary-rep';
  public selectedReport : any = new FormControl();
  public staffSub : Subject<any> = new Subject();
  public lay = 'h';
  public tempLayout;
  public tempUser;
  public tempRole;
  today = new Date();
  public typelist : any;
  public statuslist : any;
  public batterylist : any;
  type: string = 'Employee';
  validDate: any;
  identifier: any = new FormControl();
  public facilityId = new FormControl();
  public Uhid = new FormControl();
  public regionValue: string;
  public facilityList : any;
  public customInput : any ;
  public Customselected : any = 'no';
  selectedType: any = new FormControl();
  selectedStatus: any = new FormControl();
  selectedBattery: any = new FormControl();
  headercolor: string = '#3f586a';
  bgcolor: string = '#ffffff';
  pagebgcolor: string = '#ffffff';
  public selected : any = {'selectedId': null , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': null, 'facility' : null, 'type':null, 'name':null};
  public userTypes: any[] = [];
  public role_list = [];
  public selectedUserType = new FormControl(null);
  public userList: any[] = [];
  public locationlist: any[];
  public selectedLocation : any = new FormControl(null);
  public locFlag = true;
  public treedata : any = {};
  public selectedRole = new FormControl(null);
  public selectedUser = new FormControl(null);
  public userName = new FormControl('')
  public RoleId = new FormControl('')
  public selectedUserTemp :any;
  public selectedLocTemp :any;
  public selectedToggle = 'user';
  public locationName : any;
  // public selectedrolelistid: any  = new FormControl(null);
  RoleList:any;
  public activate_btn: any = [];
  constructor(public datepipe: DatePipe, public PdfService: PdfService, public configurationService: ConfigurationService,
        public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService,  public hospitalService: HospitalService, public ChartService: ChartService) {
      this.activate_btn = this.CommonService.getActivePermission('button');
      this.today.setDate(this.today.getDate());
      this.typelist = [
        {'id':'All','name':'All'},
        {'id':'Employee','name':'Employee'},
        {'id':'TemporaryIdCard','name':'Temporary ID'},
        {'id':'Visitor','name':'Visitor'}
      ]
      this.statuslist = [
        {'id':'All','name':'All'},
        {'id':'Active','name':'Active'},
        {'id':'Inactive','name':'Inactive'},
      ]
      this.batterylist = [
        {'id':'All','name':'All'},
        {'id':'0','name':'0'},
        {'id':'1-10','name':'1-10'},
        {'id':'11-25','name':'11-25'},
        {'id':'26-100','name':'26-100'},
        {'id':'Custom','name':'Custom'},
      ]
      this.getFacilityList()
    }
  ngOnInit() {
    this.staffSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getUserByType(searchTextValue);
    });    
    // this.userName.valueChanges.subscribe(res=> {
    //   if (res) {
    //     this.CommonService.searchDoctor(res, 'UT_STAFF').subscribe(res => {
    //       if(res.results.length == 0){
    //       }
    //       this.userList = res.results;
    //     });
    //   } else {
    //     this.selectedUser.setValue(null)
    //     this.userList = [];
    //   }
    // })
    this.getReportList();
    // this.CommonService.getRollList().subscribe(res=>    this.RoleList = res.results );
    // this.getAllStaffReports(this.HCselected);
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor     = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
    this.buildForm();
    this.getRoleList();
    // this.getUserTypes();
  }
  public buildForm() {
    this.reportForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : ''],
      });
  }
  getFacilityList(){
    this.facilityId.setValue(localStorage.getItem(btoa('facilityId')))
    this.regionValue = localStorage.getItem('regionId')
    this.hospitalService.getFacilityList(this.regionValue).subscribe(fac => {
      this.facilityList = fac.results;
  });
  }
  getReportList() {
    this.reportList = []
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
    let submenusList = [];
    try {
      submenusList = this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_RESF") ;
    } catch (error) {
      submenusList = JSON.parse(localStorage.getItem('currentMenu'));
    }
    if(submenusList){
      let tempId = submenusList['id'] ? submenusList['id'] : submenusList[0]['id']  ;
      let replist = permissions['dropdown'].filter(res=> res.parentId == tempId);
      if(replist.length){
        this.reportList = replist;
        this.reportList.sort((a, b) => {
          if (a.sequence < b.sequence) return -1;
          if (a.sequence > b.sequence) return 1;
          return 0;
        });
        this.HCselected = this.reportList[0]['link']
         const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
         if (firstSeqReport) {
          this.HCselected = firstSeqReport.code;
         }
        this.getAllStaffReports(this.HCselected);
      }
    }
    // let permissions = JSON.parse(localStorage.getItem('permission'))
    // for (let i = 0; i < reports.length; ++i) {
    //   let checkExist = permissions['widget'].filter(res=> res.code == reports[i].code)
    //   if (checkExist.length) {
    //     this.reportList.push(reports[i])
    //   }
    // }
    // this.HCselected = this.reportList[0].id
    // this.getAllStaffReports(this.HCselected);
  }
  assignvalue(inp: number)
  {
    this.customInput = inp;
    this.filterby();
  }
  filterby(){
    let temp1 : any = [];
    let a: number = 0;
  
    let temp2 : any = [];
    let b: number = 0;
  
    let temp3 : any = [];
    let c: number = 0;
    //Type classification
    if(this.selectedType.value != 'All' && this.selectedType.value != null)
    {
      for(let i = 0 ; i < this.reportData.Table_copy.length ; i++)
      {
        if(this.reportData['Table_copy'][i]['card_type'] == this.selectedType.value)
        {
          temp1[a] = this.reportData['Table_copy'][i];
          a++;
        }
      }
      //Status classification
      if(this.selectedStatus.value != 'All' && this.selectedStatus.value != null)
      {
        for(let i = 0 ; i < temp1.length ; i++)
        {
          if(temp1[i]['status'] == this.selectedStatus.value)
          {
            temp2[b] = temp1[i];
            b++;
          }
        }
        //Battery classification
        if(this.selectedBattery.value != 'All' && this.selectedBattery.value != null)
        {
          let min : number;
          let max : number;
          if(this.selectedBattery.value != 0 && this.selectedBattery.value != 'Custom')
          {
            this.Customselected = 'no';
            if(this.selectedBattery.value == '1-10')
            {
              min = 1; max = 10;
            }
            else if(this.selectedBattery.value == '11-25')
            {
              min = 11; max = 25;
            }
            else if(this.selectedBattery.value == '26-100')
            {
              min = 26; max = 100;
            }
            console.log(min);
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] >= min && temp2[i]['battery_percentage'] <= max)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
          else
          {
            let value : number = 0;
            this.Customselected = 'no';
            if(this.selectedBattery.value == 'Custom')
            {
              this.Customselected = 'yes';
              value = this.customInput;
            }
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] == value)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
        }
        else
        {
          this.Customselected = 'no';
          temp3 = temp2;
        }
      }
      else
      {
        temp2 = temp1;
        //Battery classification
        if(this.selectedBattery.value != 'All' && this.selectedBattery.value != null)
        {
          let min : number;
          let max : number;
          if(this.selectedBattery.value != 0 && this.selectedBattery.value != 'Custom')
          {
            this.Customselected = 'no';
            if(this.selectedBattery.value == '1-10')
            {
              min = 1; max = 10;
            }
            else if(this.selectedBattery.value == '11-25')
            {
              min = 11; max = 25;
            }
            else if(this.selectedBattery.value == '26-100')
            {
              min = 26; max = 100;
            }
            console.log(min);
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] >= min && temp2[i]['battery_percentage'] <= max)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
          else
          {
            let value : number = 0;
            this.Customselected = 'no';
            if(this.selectedBattery.value == 'Custom')
            {
              this.Customselected = 'yes';
              value = this.customInput;
            }
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] == value)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
        }
        else
        {
          this.Customselected = 'no';
          temp3 = temp2;
        }
      }
    }
    else
    {
      temp1 = this.reportData['Table_copy'];
      //Status classification
      if(this.selectedStatus.value != 'All' && this.selectedStatus.value != null)
      {
        for(let i = 0 ; i < temp1.length ; i++)
        {
          if(temp1[i]['status'] == this.selectedStatus.value)
          {
            temp2[b] = temp1[i];
            b++;
          }
        }
        //Battery classification
        if(this.selectedBattery.value != 'All' && this.selectedBattery.value != null)
        {
          let min : number;
          let max : number;
          if(this.selectedBattery.value != 0 && this.selectedBattery.value != 'Custom')
          {
            this.Customselected = 'no';
            if(this.selectedBattery.value == '1-10')
            {
              min = 1; max = 10;
            }
            else if(this.selectedBattery.value == '11-25')
            {
              min = 11; max = 25;
            }
            else if(this.selectedBattery.value == '26-100')
            {
              min = 26; max = 100;
            }
            console.log(min);
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] >= min && temp2[i]['battery_percentage'] <= max)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
          else
          {
            let value : number = 0;
            this.Customselected = 'no';
            if(this.selectedBattery.value == 'Custom')
            {
              this.Customselected = 'yes';
              value = this.customInput;
            }
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] == value)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
        }
        else
        {
          this.Customselected = 'no';
          temp3 = temp2;
        }
      }
      else
      {
        temp2 = temp1;
        //Battery classification
        if(this.selectedBattery.value != 'All' && this.selectedBattery.value != null)
        {let min : number;
          let max : number;
          if(this.selectedBattery.value != 0 && this.selectedBattery.value != 'Custom')
          {
            this.Customselected = 'no';
            if(this.selectedBattery.value == '1-10')
            {
              min = 1; max = 10;
            }
            else if(this.selectedBattery.value == '11-25')
            {
              min = 11; max = 25
            }
            else if(this.selectedBattery.value == '26-100')
            {
              min = 26; max = 100;
            }
            console.log(min);
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] >= min && temp2[i]['battery_percentage'] <= max)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
          else
          {
            let value : number = 0;
            this.Customselected = 'no';
            if(this.selectedBattery.value == 'Custom')
            {
              this.Customselected = 'yes';
              value = this.customInput;
            }
            for(let i = 0 ; i < temp2.length ; i++)
            {
              if(temp2[i]['battery_percentage'] == value)
              {
                temp3[c] = temp2[i];
                c++;
              }
            }
          }
        }
        else
        {
          this.Customselected = 'no';
          temp3 = temp2;
        }
      }
    }
    //this.reportData['Table'] = [];
    this.reportData['Table'] = temp3;
    console.log(this.reportData.Table.length)
    if(this.reportData['Table'].length<=0){
      this.reportData['enableexcel'] = false;
    } else{
      this.reportData.enableexcel = true;
    }
  }
  getAllStaffReports(id) {
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData = [];
    this.userList = [];
    this.reportData.noRecords = false;
    this.reportData.loading = true;
    this.reportData['showTable'] = false;
    this.reportData['showSecondTable'] =  false;
    this.reportData['showCard'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    this.reportData['invalidDate'] = false;
    this.reportData['charts'] = [];
    this.reportData['noError'] = true;
    this.reportData['nullIdentifier'] = false;
    this.reportData['prevselected'] = this.HCselected;
    if(id == 'staff-summary-rep'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        this.reportData['loading']=false;
        if(res.results.statusCode == 200 && res.results.data != null)
        {
          this.reportData['enablepdf']=true;
          this.reportData['excelData'] = [];
          this.reportData['fullData'] = res.results.data;
          this.reportData['empDetails'] = res.results.data['Emp Detail'];
          this.reportData['alert'] = res.results.data['Alert'];
          if(this.reportData['alert'].length > 0){
            this.reportData['alertColumns'] = Object.keys(this.reportData['alert'][0]);
            this.reportData['showSecondTable'] =  true;
          }
          this.reportData['timewise'] = res.results.data['timewise'];
          this.reportData['Table'] = res.results.data['Emp Detail'];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(res.results.data['Emp Detail'][0]);
            this.reportData['showTable'] = true;
          }
          this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':5,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Staff','content':this.reportData['fullData']['Strength'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staffs Absent','content':this.reportData['fullData']['Absent'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'SD Alert Count','content':this.reportData['fullData']['SD Alert Count'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Geofence Alert Count','content':this.reportData['fullData']['Geo Alert Count'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Visitors','content':this.reportData['fullData']['Visitor'][0]['Count']}];
          this.reportData['showCard'] = true;
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'GenderChart','type':'pie','data':this.reportData.fullData.Gender.data,'label': this.reportData.fullData.Gender.label,'title':'Gender','showTitle':true,'barLabel': []});
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'DeviceChart','type':'pie','data':this.reportData.fullData.Tag.data,'label': this.reportData.fullData.Tag.label,'title':'Devices Used','showTitle':true,'barLabel': []});
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'AgeChart','type':'pie','data':this.reportData.fullData.Age.data,'label': this.reportData.fullData.Age.label,'title':'Age Group','showTitle':true,'barLabel': []});
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'DepartmentChart','type':'pie','data':this.reportData.fullData['Emp Type']['data'],'label': this.reportData.fullData['Emp Type']['label'],'title':'By Department','showTitle':true,'barLabel': []});
          // this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'StaffByDept','type':'pie','data':this.reportData.fullData.Department.data,'label': this.reportData.fullData.Department.label,'title':'Staff Present (By Department)','showTitle':true,'barLabel': []});
          this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'inOutCountEmployee','type':'bar','data':this.reportData.fullData.timewise.data.IN,'label': this.reportData.fullData.timewise.label,'title':'Alert Generated (By Hour)','showTitle':true,'barLabel': ['IN']});          
      } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        } 
      },
        error =>{
         this.reportData['loading'] = false;
         this.reportData['noError'] = false;
      })
    }else if (id == 'staff-contact') {
      document.getElementById('treeDiagram').innerHTML='';
      this.selectedDate = this.fromDate;
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.selectedUser.value;
        if (this.selectedUser.value == null || this.selectedUser.value == ''){
          this.reportData['nullIdentifier'] = true;
        }
        this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
          this.reportData['data'] = [];
          this.reportData['tree'] = [];
          this.reportData['clickedId'] = [];
          this.reportData['depth']=[];
          this.reportData['clickedTagType'] = [];
          this.reportData['index'] = 0;
          let location = [];
          this.reportData['loading'] = false;
          if(res.results.statusCode == 200 && res.results.data !=null){
            this.reportData['noRecords'] = false;
            this.reportData['enablepdf'] = false;
            this.reportData['enableexcel'] = true;
            for(let i=0;i<res.results.data['First_Degree_contact: '].length;i++){
              res.results.data['First_Degree_contact: '][i]['From Time'] = this.datepipe.transform(new Date(res.results.data['First_Degree_contact: '][i]['From Time']), 'dd/MM/yyyy HH : mm : ss');
              res.results.data['First_Degree_contact: '][i]['To Time'] = this.datepipe.transform(new Date(res.results.data['First_Degree_contact: '][i]['To Time']), 'dd/MM/yyyy HH : mm : ss');
              for(let j=0;j<res.results.data['First_Degree_contact: '][i]['children'].length;j++){
                res.results.data['First_Degree_contact: '][i]['children'][j]['From Time'] = this.datepipe.transform(new Date(res.results.data['First_Degree_contact: '][i]['children'][j]['From Time']), 'dd/MM/yyyy HH : mm : ss');
                res.results.data['First_Degree_contact: '][i]['children'][j]['To Time'] = this.datepipe.transform(new Date(res.results.data['First_Degree_contact: '][i]['children'][j]['To Time']), 'dd/MM/yyyy HH : mm : ss');
              }
            }
            
            this.reportData['firstDegreeData'] = res.results.data["First_Degree_contact: "];
            this.reportData['clickedId'].push(this.reportData['firstDegreeData'][0]['tag_value']);
            this.reportData['tree'].push({'Name':null,'Contact Name':this.reportData['firstDegreeData'][0]['Name'],'Identifier':1,'parentIdentifier':null,'location Name': "", 'Floor Name' : "",'From Time' : "",'con_tag_value':this.reportData['firstDegreeData'][0]['tag_value'],'Close contact':'No','level':0})
            this.reportData['IdentifierValue'] = 1
            this.reportData['firstDegreeData'].forEach((item) => {
              item.Identifier = this.reportData['IdentifierValue'] + 1;
              item.parentIdentifier = 1;
              item.level = 1;
              this.reportData['IdentifierValue'] = this.reportData['IdentifierValue'] + 1;
            });
            this.reportData['tree'] = this.reportData['tree'].concat(this.reportData['firstDegreeData'])
            this.reportData['tableView'] = true;
            this.reportData['initialised'] = true;
            this.reportData.maxnodes =  this.reportData.tree.length;
          } else{
            this.reportData['noRecords'] = true;
            this.reportData['loading'] = false;
            this.reportData['initialised'] = true;
            this.reportData['tableView'] = true;
          }
        },
          error => {
            this.reportData['loading'] = false;
            this.reportData['noError'] = false;
        });
    } 
  } else if(id == 'staff-ccd-all'){
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        this.reportData['loading'] = false;
        if (res.results.statusCode == 200 && res.results.data.length >= 1) {
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data;
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['From timestamp'] = this.datepipe.transform(this.reportData['Table'][i]['From timestamp'], 'yyyy-MM-dd HH:mm:ss');
            this.reportData['Table'][i]['To timestamp'] = this.datepipe.transform(this.reportData['Table'][i]['To timestamp'], 'yyyy-MM-dd HH:mm:ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = ['EmpId','Name','Contact EmpId','Contact Emp.Name','From timestamp','To timestamp','Duration'];
            this.reportData['showTable'] = true;
          }
        }
        else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      },
      error =>{
       this.reportData['loading'] = false;
       this.reportData['noError'] = false;
      });
    } else if(id == 'staff-attendancebyid'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
      console.log(this.identifier.value);
      this.reportData['param'] =  '/user_id=' + this.selectedUser.value + '&fdt=' + this.fromDate + '&tdt=' + this.toDate;
      if(this.selectedUser.value == null || this.selectedUser.value == ''){
        this.reportData['nullIdentifier'] = true;
      }
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => { 
        this.reportData.loading = false;
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData.noRecords = false;
            this.reportData.enableexcel = true;
            this.reportData['fullData'] = res.results.data;
            // res.results.data['Staff Info'][0]['Join_date'] = this.datepipe.transform(res.results.data['Staff Info'][0]['Join_date'], 'dd/MM/yyyy');
            // for(let i = 0; i < res.results.data['Daywise'].length; i++){
            //   res.results.data['Daywise'][i]['Attendance Date'] = this.datepipe.transform(res.results.data['Daywise'][i]['Attendance Date'], 'dd/MM/yyyy');
            //   res.results.data['Daywise'][i]['Check-in'] = this.datepipe.transform(res.results.data['Daywise'][i]['Check-in'], 'dd/MM/yyyy HH : mm : ss');
            //   res.results.data['Daywise'][i]['Checkout'] = this.datepipe.transform(res.results.data['Daywise'][i]['Checkout'], 'dd/MM/yyyy HH : mm : ss');
            //   res.results.data['Daywise'][i]['Active HRs'] = this.datepipe.transform(res.results.data['Daywise'][i]['Active HRs'], 'HH : mm : ss');
            // }
            this.reportData['Table'] = res.results.data['Daywise'];
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
              this.reportData['showTable'] = true;
            }
          // this.reportData['cardInfo'] = {'width':'100%', 'height':'100px','col':3,'gutterSize':'0px'};
          // this.reportData['tileInfo'] = [
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Leave Taken','content':this.reportData['fullData']['Staff Agg'][0]['strength']},
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Strength','content':this.reportData['fullData']['Staff Agg'][0]['leave_days']},
          // {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average working Hours','content':this.reportData['fullData']['Staff Agg'][0]['avg_hours']}];
          // this.reportData['info'] = res.results.data['Staff Info'][0];
          // this.reportData['showCard'] = true;
          console.log(this.reportData);
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          } 
        },
         error =>{
          this.reportData['loading'] = false;
          this.reportData['noError'] = false;
        });
      }
    } else if(id == 'staff-attendance-all') {
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
      console.log("VALID")
      this.reportData['param'] =  '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        this.reportData.loading = false;
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.enableexcel = true;
          this.reportData.enablepdf = true;
          this.reportData['workingHours'] = res.results.data['Staff Agg'][0]['avg_working_hours'];
          this.reportData['strength'] = res.results.data['Staff Agg'][0]['avg_strength_percent'];
          this.reportData['leaveTotal'] = res.results.data['Staff Agg'][0]['tot_leave'];
          this.reportData['deptLabel'] = res.results.data['Deptwise'].map(value => value.Department);
          this.reportData['deptPresent%'] = res.results.data['Deptwise'].map(value => value['Present%']);
          this.ChartService.drawChart({'canvasId':'deptAttAll','type':'bar','data':this.reportData['deptPresent%'],'label': this.reportData['deptLabel'],'title':'By Location','showTitle':true,'barLabel': ['Dept']});
          this.reportData['Table'] = res.results.data['Daywise'];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(res.results.data['Daywise'][0]);
            this.reportData['showTable'] = true;
          }
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      }, error =>{
        this.reportData['loading'] = false;
        this.reportData['noError'] = false;
      });
      }
    } else if(id == 'staff-battery-summary'){
      this.reportData['param'] = '/fdt=' + this.selectedDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        console.log(res)
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData.enableexcel = true;
          this.reportData.enablepdf = true;
          this.reportData['countData'] = [];
          this.reportData['activeCount'] = [];
          this.reportData['inactiveCount'] = [];
          this.reportData['totalCount'] = res.results.data['Tag Status Detail'];
          if(this.reportData['totalCount'].length > 0){
            this.reportData['secondTabColumns'] = Object.keys(this.reportData['totalCount'][0]);
            this.reportData['showSecondTable'] =  true;
          }
          for(let i=0;i<res.results.data['Tag Status Detail'].length;i++){
            this.reportData.activeCount.push(res.results.data['Tag Status Detail'][i]['active_count']);
            this.reportData.inactiveCount.push(res.results.data['Tag Status Detail'][i]['inactive_count']);
          }
          this.reportData['countData'] = [this.reportData['activeCount'],this.reportData['inactiveCount']];
          // this.ChartService.drawChart({'canvasId':'activecount','id':'battery-summary','type':'grouped','data':this.reportData['countData'],'label':['Employee','TemporaryID','Visitor'],'title':'Tag Status','showTitle':true,'barLabel':['Active','Inactive']});
          this.reportData['percentageData'] = res.results.data['Battery Status Detail'];
          this.reportData['zeroData'] = this.reportData['percentageData'][0]['battery_percentage'];
          this.reportData['percentageCount'] = [this.reportData['percentageData'][0]['battery_percentage'],this.reportData['percentageData'][1]['battery_percentage'],this.reportData['percentageData'][2]['battery_percentage'],this.reportData['percentageData'][3]['battery_percentage']];
          this.reportData['percentageLabel'] = [this.reportData['percentageData'][0]['today_date'],this.reportData['percentageData'][1]['today_date'],this.reportData['percentageData'][2]['today_date'],this.reportData['percentageData'][3]['today_date']];
          this.ChartService.drawChart({'canvasId':'percentagesplit','id':'battery-summary','type':'pie',
          'data':this.reportData['percentageCount'],'label':this.reportData['percentageLabel'],'title':'Battery Level','showTitle':true })
          this.reportData['Table_copy'] = res.results.data['Report Detail'];
          this.reportData['Table'] = this.reportData['Table_copy'];
          this.reportData['TableColumns'] = [];
          this.reportData['TableLength'] = 0;
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['TableLength'] = Object.keys(this.reportData['Table']).length;
            this.reportData['showTable'] = true;
          }
         } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      },
      error =>{
       this.reportData['loading'] = false;
       this.reportData['noError'] = false;
      });
    } else if(id == 'staff-roll-call') {
      this.reportData['param'] = this.facilityId.value + '/fdt=' + this.toDate;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
        // console.log(res);        
        if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData.enableexcel = true;
            this.reportData.enablepdf = true;
            this.reportData.loading = false;
            this.reportData['totalEmployeeIn'] = res.results.data['Tot Emp In'];
            this.reportData['reachedEmployeePoint'] = res.results.data['Reached Assemply Point'];
            this.reportData['empmissing'] = res.results.data['Emp Missing'];
            this.reportData['visitormissing'] = res.results.data['Visitor Missing'];
            this.reportData['eventStartingTime'] = res.results.data['Event StartTime'];
            this.reportData['visitors'] = res.results.data['Visitors'];
            this.reportData['cardInfo'] = {'width':'100%', 'height':'130px','col':5,'gutterSize':'0px'};
            this.reportData['tileInfo'] = [
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staff Present/Assembled','content':this.reportData['totalEmployeeIn']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staff Missing','content':this.reportData['empmissing']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Visitors','content':this.reportData['visitors']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Visitors Missing','content':this.reportData['visitormissing']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Event Start Time','content':this.reportData['eventStartingTime']}];
            this.reportData['showCard'] = true;
            this.reportData['departmentlabel'] = res.results.data.Department.label;
            this.reportData['departmentData'] = [res.results.data.Department.tot,res.results.data.Department.data];
            this.reportData['byDur'] = res.results.data.byDur;
            this.reportData['Table'] = res.results.data.Emp_details;
            for(let i=0;i<this.reportData['Table'].length;i++){
              this.reportData['Table'][i]['Date'] = this.datepipe.transform(this.reportData['Table'][i]['Date'], 'dd/MM/yyyy HH : mm : ss');
            }
            this.reportData['TableColumns'] = ['tag_value', 'Date', 'EmpId', 'Name', 'Gender', 'Emp_Type', 'Arrived Time', 'Arrivedat', 'Floor Name', 'Location Name', 'Last Seen'];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(res.results.data['Emp_details'][0]);
              this.reportData['showTable'] = true;
            }
            this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'durationRollCall','type':'pie','data':this.reportData.byDur.data,'label': this.reportData.byDur.label,'title':'Assembled (By Duration)','showTitle':true,'barLabel': []});
            this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'departmentRollCall','type':'grouped','data':this.reportData.departmentData,'label': this.reportData.departmentlabel,'title':'Assembled (By Department)','showTitle':true,'barLabel': ['Total','Assembled']});
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        },
        error =>{
         this.reportData['loading'] = false;
         this.reportData['noError'] = false;
        });
    } else if (id == 'staff-geofencevio') {
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {  
          if (res.results.statusCode == 200 && res.results.data.length > 0) {
            this.reportData.loading = false;
            this.reportData.enablepdf = true;
            this.reportData.enableexcel = true;
            this.reportData['Table'] = res.results.data;
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            this.reportData['chartData'] = res.results.chart;
            this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'empGeofenceViolation','type':'pie','data':this.reportData.chartData.Data,'label': this.reportData.chartData.Label,'title':'Employee Geofence Violation','showTitle':true,'barLabel': []});
            } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        },
        error =>{
        this.reportData['loading'] = false;
        this.reportData['noError'] = false;
        });
      }
    } else if (id == 'staff-site-nav') {
      // this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&uid=' + this.selectedUser.value ;
      // if(this.selectedUser.value == null || this.selectedUser.value == ''){
      //   this.reportData['nullIdentifier'] = true;
      // }
      if(this.selectedToggle == 'user'){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&uid=' + this.selectedUser.value + '&lay=' + this.lay;
      } else if(this.selectedToggle == 'role'){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&rlid=' + this.selectedRole.value + '&lay=' + this.lay;
      }
      this.tempLayout = this.lay;
      this.tempUser = this.selectedUser.value;
      this.tempRole = this.selectedRole.value;
      this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.enableexcel = true;
          this.reportData['employeeId'] = res.results.data.emp_info[0].EmpId;
          this.reportData['Name'] = res.results.data.emp_info[0].Name;
          this.reportData['gender'] = res.results.data.emp_info[0].Gender;
          this.reportData['Table'] = res.results.data['journey '];
          this.reportData['Table'] = JSON.parse(JSON.stringify(this.reportData['Table']).replace(/\\n/g," "));
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          }
          this.reportData['excelData']=this.reportData['Table'];
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      },
      error => {
        this.reportData['loading'] = false;
        this.reportData['noError'] = false;
      });
    } else if(id == 'visitor-history-byloc'){
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&lid=' + this.selectedLocation.value;
      if(this.selectedLocation.value == null || this.selectedLocation.value == ''){
        this.reportData['nullIdentifier'] = true;
      } else{
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.locFlag = true;
            this.reportData.loading = false;
            this.reportData.enableexcel = true;
            this.reportData['Table'] = res.results.data['journey '];
            this.reportData['TableColumns'] = [];
            for(let i=0;i<this.reportData['Table'].length;i++){
              delete this.reportData['Table'][i]['children']
            }
            if(this.reportData['Table'].length > 0){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
              this.reportData['showTable'] = true;
            }
            this.reportData['excelData']=this.reportData['Table'];
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        });
      }
    }  else if(id == 'cons-visit-hist'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.selectedUserTemp =this.selectedUser.value;
        if(this.selectedUser && this.selectedUser.value!=null){
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&user_id='+ this.selectedUser.value;
        } else {
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        }
        
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if(res.results.statusCode == 200){
            this.reportData.loading = false;
            this.reportData['enableexcel'] = true;
            this.reportData['Table'] = res.results['data']['journey '];
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['prevselected'] = this.HCselected;
              this.reportData['showTable'] = true;
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            }
          }
        });
      }
    } else if(id == 'cons-visit-hist-bywad'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.selectedLocTemp = this.selectedLocation.value;
        if(this.selectedLocation && this.selectedLocation.value!=null){
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate+ '&lid=' + this.selectedLocation.value;
        } else {
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        }
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if(res.results.statusCode == 200){
            this.reportData.loading = false;
            this.reportData['enableexcel'] = true;
            this.reportData['Table'] = res.results['data']['journey '];
            this.reportData['TableColumns'] = [];
            if(this.reportData['Table'].length > 0){
              this.reportData['prevselected'] = this.HCselected;
              this.reportData['showTable'] = true;
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            }
          }
        });
      }
    } else if(id == 'staff-tracking'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          if(res.results.statusCode == 200){
            this.reportData.loading = false;
            this.reportData['enableexcel'] = true;
            this.reportData['Table'] = res.results['data'];
            this.reportData['Table'] = this.reportData['Table'].map(({ PerformerId, ...item }) => item);
            this.reportData['TableColumns'] = [];
            this.reportData['Table'] = this.reportData['Table'].map(object => {
              return {...object, Navigation: ''};
            });
            this.reportData['excelData']=[];
            this.reportData['excelData'][0]= this.reportData['Table'];
            this.reportData['excelData'][1]=[];
            for(let i=0;i<this.reportData['Table'].length;i++){    
              for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
                this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]))
              }
            }
            let attributes = ['floor_id','request_detail_id','Tag type','children','Navigation','location_id'];
            if(this.reportData['excelData'][0].length){
              this.reportData['excelData'][0] = this.reportData['excelData'][0].map((jsonObject) => {
                const updatedObject = { ...jsonObject };
                attributes.forEach((attribute) => delete updatedObject[attribute]);
                return updatedObject;
              });
            }
            if(this.reportData['excelData'][1].length){
              this.reportData['excelData'][1] = this.reportData['excelData'][1].map((jsonObject) => {
                const updatedObject = { ...jsonObject };
                attributes.forEach((attribute) => delete updatedObject[attribute]);
                return updatedObject;
              });
            }
          } else {
            this.reportData.loading = false;
          }
        });
      }
    } else if(id == 'tat-by-shift'){
      this.reportData['showTatTable'] = false;
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.selectedLocTemp = this.selectedLocation.value;
        if(this.selectedLocation && this.selectedLocation.value!=null){
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate+ '&lid=' + this.selectedLocation.value;
        } else {
          this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        }
        this.CommonService.getReportData(id,this.reportData['param']).subscribe(res => {
          this.reportData.loading = false;
          if(res.results.statusCode == 200){
            this.reportData.enableexcel = true;
            this.reportData['data'] = res.results.data;
            this.reportData['tatTableData'] = this.reportData['data']['TAT by Shift'];
            this.reportData['Table'] = this.reportData['data']['Table data'];
            this.reportData['TableColumns'] = [];
            if(this.reportData['tatTableData'].length){
              this.reportData['showTatTable'] = true;
            }
            if(this.reportData['Table'].length){
              this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]); 
              this.reportData['showTable'] = true;
            }
            this.reportData['excelData']=[];
            this.reportData['excelData'][0]=[];
            for(let i=0;i<this.reportData['tatTableData'].length;i++){   
              this.reportData['excelData'][0].push(Object.assign({},this.reportData['tatTableData'][i])); 
            }
            this.reportData['excelData'][1]= this.reportData['Table'];
          }
        })
      }
    }
    let selectedData  = this.reportList.filter(res=> res.link === id);
    this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.identifier.value, 'facility' : this.facilityId.value, 'type':this.type, 'name':selectedData[0].name};
  }
  toggleChange(value){
    this.selectedToggle = value;
  }
  viewClick(value){
    this.lay = value;
  }
  getRoleList(){
    this.CommonService.getAllRoleList().subscribe(res => {
      this.role_list = res.results;
    });
  }
  getLocationlist(id) {
    let searchList = '';
    searchList += id.target.value;
    if (searchList.length >= 2) {
      this.configurationService.getLocationData(id.target.value).subscribe(res => {
        // if(res.results.length == 0){
        // }
        if(this.HCselected == 'tat-by-shift'){
          this.locationlist = res.results.filter(res=> res.locationTypeId == 2);
        } else{
          this.locationlist = res.results;
        }
      });
    } else {
      this.selectedLocation.setValue(null)
      this.locationlist = [];
    }
  }
  setLocationID(id,name,fullName){
    this.locFlag = false;
    this.selectedLocation.setValue(id)
    this.locationlist = [];
    this.locationName = fullName;
  }
  validate(sDate: string, eDate: string){
    this.validDate = true;
    if((sDate != null && eDate !=null) && (eDate < sDate) ){
      this.validDate = false;
      this.reportData['invalidDateMessage'] = "From Date should not be greater than To Date"
    }
    let sdate :any = new Date(sDate);
    let tdate  :any = new Date(eDate);
    if(this.activate_btn.find(data => data === 'BT_RPTDA') === undefined){
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        const diffDays = Math.round(Math.abs((sdate - tdate) / oneDay));
        if(diffDays>10){
        this.validDate = false;
        this.reportData['invalidDateMessage'] = "Please Select Fromdate & Todate between Ten Days. If any Queries Contact Admin"
        }
    }
    return this.validDate;
  }
  getUserTypes(){
    this.CommonService.getAppTerms('UserType').subscribe(res => {
      this.userTypes = res.results.filter(res=> res.groupName == 'UserType')
      if(this.userTypes.length){
        this.selectedUserType.setValue(this.userTypes[0].code)
      }
    })
  }
  getUserByTypeCheck(val) {
    this.staffSub.next(val);
  }
  getUserByType(val){
    let searchList = '';
    searchList += val.target.value;
    if (searchList.length >= 3) {
      this.CommonService.searchDoctor(val.target.value, 'UT_STAFF').subscribe(res => {
        if(res.results.length == 0){
        }
        this.userList = res.results;
      });
    } else {
      this.selectedUser.setValue(null)
      this.userList = [];
    }
  }
  setUserName(id){
    this.selectedUser.setValue(id)
  }
  tagValues(tags){
    this.reportData['excludedTags'] = tags;
    let excludeTags = []
    for(let i in tags){
      excludeTags.push('TAT-EM')
    }
    this.reportData['excludedTagTypes'] = excludeTags;
  }
  // tagType(tagTypes){
  //   console.log(tagTypes)
  //   this.reportData['excludedTagTypes'] = tagTypes;
  // }
  fetchRecords( selectedUhid : string){
    this.reportData['excludedTags'] = this.reportData['excludedTags'].toString()
    this.reportData['excludedTagTypes'] = this.reportData['excludedTagTypes'].toString()
    this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + selectedUhid[0] + '&xids=' + this.reportData['excludedTags'] + '&ptyp=' + 'Employee' +'&xtyps=' + this.reportData['excludedTagTypes'];
    this.CommonService.getReportData(this.selected['selectedId'],this.reportData['param1']).subscribe((res) => {
      if(res.results.statusCode == 200 || res.results.statusCode ==  503){
        for(let i=0;i<res.results.data['First_Degree_contact: '].length;i++){
          res.results.data['First_Degree_contact: '][i]['From Time'] = this.datepipe.transform(res.results.data['First_Degree_contact: '][i]['From Time'], 'dd/MM/yyyy HH : mm : ss');
          res.results.data['First_Degree_contact: '][i]['To Time'] = this.datepipe.transform(res.results.data['First_Degree_contact: '][i]['To Time'], 'dd/MM/yyyy HH : mm : ss');

          for(let j=0;j<res.results.data['First_Degree_contact: '][i]['children'].length;j++){
            res.results.data['First_Degree_contact: '][i]['children'][j]['From Time'] = this.datepipe.transform(res.results.data['First_Degree_contact: '][i]['children'][j]['From Time'], 'dd/MM/yyyy HH : mm : ss');
            res.results.data['First_Degree_contact: '][i]['children'][j]['To Time'] = this.datepipe.transform(res.results.data['First_Degree_contact: '][i]['children'][j]['To Time'], 'dd/MM/yyyy HH : mm : ss');
          }
        }
            this.reportData['data'] = res.results.data['First_Degree_contact: ']
            this.reportData['index'] = 1;
          }
    })
} 
shareRecords(records : any []){
  this.reportData['excelData'] = [];
  this.reportData.excelData[0] = records[0]
  if(records.length > 0){
    for(let i=0;i<records.length;i++){
      if(typeof records[i] !== 'undefined') {
        this.reportData.excelData[i*2] =[]
        this.reportData.excelData[i*2] = records[i];
        let length = this.reportData['excelData'].length;
        let data=[]
        this.reportData.excelData[length] =[]
        if(this.selected['selectedId'] == 'contact-tree'){
          for(let j=0;j<records[i].length;j++){    
            for(let k=0;k<records[i][j].history.length;k++){
                data.push(records[i][j].history[k]);
            }
          }
        } else{
          for(let j=0;j<records[i].length;j++){    
            for(let k=0;k<records[i][j].children.length;k++){ 
               data.push(Object.assign({},records[i][j],records[i][j].children[k]));
            }
          }
        }
        this.reportData.excelData[length] = data;
      }
    }
  }
  }
 
selectedUhid(Uhid : any []){
  this.reportData['selectedUhid'] =[]
  for(let id=0;id<Uhid.length;id++){
    this.reportData['selectedUhid'][id*2] = Uhid[id]+'-Summary'
    let length = this.reportData['selectedUhid'].length
    this.reportData['selectedUhid'][length] = Uhid[id] + '-Details'
  }
}

treeDiagram(){
  if(this.selected['selectedId'] == 'staff-contact'){
    this.reportData.clickedId=[];
    this.reportData.clickedTagType=[];
    this.reportData.depth = [];
    this.reportData['tableView'] = false;
    // if(!this.treedata.hasOwnProperty('res') 
    // ||(this.treedata.hasOwnProperty('res') && 
    // (this.treedata['res']['from_date']!=this.fromDate || this.treedata['res']['to_date']!=this.toDate || this.treedata['res']['mainidentifier']!=this.Uhid)   
    // )
    // ){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.selectedUser.value;
        this.CommonService.getReportData('staff-tree',this.reportData['param']).subscribe((res) => {
          if(res.statusCode == 1 && res.results.statusCode == 200){
            this.treedata['res'] ={
              'Contact Name': res.results.data['First_Degree_contact: '][0]['UHID'],
              'Contact ID' : res.results.data['First_Degree_contact: '][0]['UHID'],
              'From Time':res.results.data['First_Degree_contact: '][0]['From Time'],
              'Count':res.results.data['First_Degree_contact: '][0]['Count'],
              'Duration':res.results.data['First_Degree_contact: '][0]['Duration'],
              'children':res.results.data['First_Degree_contact: '][0]['children']
            } ;
            this.drawtree();
          } else{
            this.treedata['res'] = {};
            this.drawtree();
          }
        })
      //}
      //  else{
      //   if(this.treedata.hasOwnProperty('res')) {
      //     this.drawtree();
      //   }
      // }  
  // } else if(this.selected['selectedId'] == 'emp-contact'){
  //     this.reportData['tableView'] = false;
  //   document.getElementById('treeDiagram').innerHTML = "";
  //   let maxnodes={};
  //   let maximumNode:any;
  //   this.reportData.tree.forEach(function(item){
  //     maxnodes[item.level]? maxnodes[item.level]++ : maxnodes[item.level]=1;
  //   });
  //   console.log(maxnodes)
  //   maximumNode = Math.max.apply(null, Object.values(maxnodes));
  //   console.log(maximumNode)
  //   let treeData = d3.stratify()
  //     .id(function(d) { return d['Identifier']; })
  //     .parentId(function(d) { return d.parentIdentifier; })
  //     (this.reportData['tree']);

  //   treeData.each(function(d) {
  //       d['Identifier'] = d.data['Identifier'];
  //     });
  //   this.reportData.margin = {top: 30, right: 90, bottom: 30, left: 5};
  //     this.reportData.width = (maximumNode * 80) - this.reportData.margin.left - this.reportData.margin.right;
  //     this.reportData.height = (treeData.height * 180)- this.reportData.margin.top - this.reportData.margin.bottom;
      
  //   let legend = d3.select("#treeDiagram").append("svg")
  //               .attr('width',200)
  //               .attr('height',80)
  //               .attr('transform', "translate(80,20)")
  //   legend.append("circle").attr("cx",20).attr("cy",20).attr("r", 6).style("stroke", "#ff0000").style("stroke-width",'2px').style('fill','white')
  //   legend.append("circle").attr("cx",20).attr("cy",50).attr("r", 6).style("stroke", "#ffa500").style("stroke-width",'2px').style('fill','white')
  //   legend.append("text").attr("x",30).attr("y",20).text("Close Contact").style("font-size", "10px").attr("alignment-baseline","middle")
  //   legend.append("text").attr("x",30).attr("y",50).text("Normal Contact").style("font-size", "10px").attr("alignment-baseline","middle")
  //   this.reportData.svg = d3.select("#treeDiagram").append("svg")
  //   .attr("width", this.reportData.width + this.reportData.margin.right + this.reportData.margin.left)
  //   .attr("height", this.reportData.height + this.reportData.margin.top + this.reportData.margin.bottom)
  //   .append("g")
  //   .attr("transform", "translate("
  //         + ((this.reportData.width/1.5)+5) + "," +((this.reportData.height/8)+8) + ")");
  //   this.reportData.index = 0;
  //   this.reportData.duration = 750;
  //   this.reportData.treemap = d3.tree()
  //     .nodeSize([60,])
  //       .separation(function separation(a, b) {
  //           return a.parent == b.parent ? 1 : 2;
  //       });
  //   this.reportData.root = d3.hierarchy(treeData, function(d) { return d.children; });
  //   this.reportData.root.x0 = this.reportData.height / 2;
  //   this.reportData.root.y0 = 1;
  //   //root.children.forEach(collapse);
  //   this.update(this.reportData.root)   
  // }      
}
}
drawtree(){
    document.getElementById('treeDiagram').innerHTML = "";
      this.reportData['diagonal'] = d3.linkHorizontal().x(d =>  d.y).y(d => d.x)                   
      this.reportData['dx'] = 16
      this.reportData['width'] = 1000;
      this.reportData['dy'] = this.reportData.width/ 6
      this.reportData['tree'] = d3.tree().nodeSize([this.reportData.dx, this.reportData.dy]);
      this.reportData['margin'] = ({top: 10, right: 120, bottom: 10, left: 40})
        this.reportData['root'] = d3.hierarchy(this.treedata.res)
      this.reportData.root.x0 = this.reportData.dy / 2;
      this.reportData.root.y0 = 0;
       this.reportData.root.descendants().forEach((d, i) => {
        d.id = i
       });
      let legend = d3.select("#treeDiagram").append("svg")
                .attr('width',200)
                .attr('height',80)
                .attr('transform', "translate(80,20)")
      legend.append("circle").attr("cx",20).attr("cy",20).attr("r", 6).style("stroke", "#ff0000").style("stroke-width",'2px').style('fill','white')
      legend.append("circle").attr("cx",20).attr("cy",50).attr("r", 6).style("stroke", "#ffa500").style("stroke-width",'2px').style('fill','white')
      legend.append("text").attr("x",30).attr("y",20).text("Close Contact").style("font-size", "10px").attr("alignment-baseline","middle")
      legend.append("text").attr("x",30).attr("y",50).text("Normal Contact").style("font-size", "10px").attr("alignment-baseline","middle")
      this.reportData.svg = d3.select("#treeDiagram").append("svg")
          .attr("viewBox", [-this.reportData.margin.left, -this.reportData.margin.top, this.reportData.width, this.reportData.dx])
          .style("font", "10px sans-serif")
          .style("user-select", "none")
          .style("width", "100%")
          .style("overflow-x",'scroll');
      this.reportData.gLink = this.reportData.svg.append("g")
          .attr("fill", "none")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 2);
      this.reportData.gNode = this.reportData.svg.append("g")
          .attr("cursor", "pointer")
          .attr("pointer-events", "all");
        this.updateTreeDiagram(this.reportData.root);
      return this.reportData.svg.node();
}
collapse(d) {
  if(d.children) {
  d._children = d.children
  d._children.forEach(this.collapse)
  d.children = null
  }
}
updateTreeDiagram(source) {
this.reportData['duration'] = d3.event && d3.event.altKey ? 2500 : 250;
this.reportData['nodes'] = this.reportData.root.descendants().reverse();
this.reportData['links'] = this.reportData.root.links();
// Compute the new tree layout.
this.reportData.tree(this.reportData.root);
let left = this.reportData.root;
let right = this.reportData.root;
this.reportData.root.eachBefore(node => {
  if (node.x < left.x) left = node;
  if (node.x > right.x) right = node;
});
this.reportData.height = right.x - left.x +this.reportData.margin.top + this.reportData.margin.bottom;
this.reportData['transition'] = this.reportData.svg.transition()
    .duration(this.reportData.duration)
    .attr("viewBox", [-this.reportData.margin.left, left.x -this.reportData.margin.top, this.reportData.width, this.reportData.height])
    .tween("resize", window['ResizeObserver'] ? null : () => () => this.reportData.svg.dispatch("toggle"));
this.reportData['node'] = this.reportData.gNode.selectAll("g")
  .data(this.reportData.nodes, d => d.id)
this.reportData['nodeEnter'] = this.reportData.node.enter().append("g")
  .attr("transform", d => `translate(${source.y0},${source.x0})`)
  .attr("fill-opacity", 0)
  .attr("stroke-opacity", 0)
  // .on("click", (d) => {
  //   d.children = d.children ? null : d._children;
  //   this.updateTreeDiagram(d);
  // })
this.reportData.nodeEnter.on("click",this.UpdateNodes.bind(this))
this.reportData.nodeEnter.on("mouseover", this.tooltipmouseover.bind(this))
  this.reportData.nodeEnter.on("mouseout", this.tooltipmouseout.bind(this));
this.reportData.nodeEnter.append("circle")
    .attr("class","circle")
    .attr("r", 6)
    .style("fill", function(d) {
      return d._children ? d.data['Is_CloseContact'] == 'Yes' ? "#ff0000" : "#ffa500" : "#fff";
   })
   .style('stroke',function(d) {
      return d.data['Is_CloseContact'] == 'Yes' ? "#ff0000" : "#ffa500";
   })
    .attr("stroke-width",'2px')
    .attr('cursor', 'pointer');

this.reportData.nodeEnter.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d._children ? -10 : 10)
    .attr("text-anchor", d => d._children ? "end" : "start")
    .text(d => d.data['Contact Name'])
  .clone(true).lower()
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .attr("stroke", "white");
    this.reportData['tooltip'] = d3.select("#treeDiagram").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style('font','10px sans-serif')
    .style('position', 'absolute')
    .style('text-align','left')
    .style('width','190px')
    .style('height','50px')
    .style('padding','2px')
    .style('font','11px sans-serif')
    .style('background','lightsteelblue')
    .style('border','0px')
    .style('border-radius','8px')
    .style('pointer-events','none')
this.reportData['nodeUpdate'] = this.reportData.node.merge(this.reportData.nodeEnter).transition(this.reportData.transition)
    .attr("transform", d => `translate(${d.y},${d.x})`)
    .attr("fill-opacity", 1)
    .attr("stroke-opacity", 1);
this.reportData['nodeExit'] = this.reportData.node.exit().transition(this.reportData.transition).remove()
    .attr("transform", d => `translate(${source.y},${source.x})`)
    .attr("fill-opacity", 0)
    .attr("stroke-opacity", 0);

// Update the links…
this.reportData['link'] = this.reportData.gLink.selectAll("path")
  .data(this.reportData.links, d => d.target.id)

// Enter any new links at the parent's previous position.
this.reportData['linkEnter'] = this.reportData.link.enter().append("path")
    .attr("d", d => {
      const o = {x: source.x0, y: source.y0};
      return this.reportData.diagonal({source: o, target: o});
    });


// Transition links to their new position.
this.reportData.link.merge(this.reportData.linkEnter).transition(this.reportData.transition)
    .attr("d", this.reportData.diagonal);

// Transition exiting nodes to the parent's new position.
this.reportData.link.exit().transition(this.reportData.transition).remove()
    .attr("d", d => {
      const o = {x: source.x, y: source.y};
      return this.reportData.diagonal({source: o, target: o});
    });

// Stash the old positions for transition.
this.reportData.root.eachBefore(d => {
  d.x0 = d.x;
  d.y0 = d.y;
});
}
// setrlidID(id){
//   this.selectedrolelistid.setValue(id)
//   console.log(id)
//   this.CommonService.getRollListid(id).subscribe(res => { console.log(res)})
// }
// public selectedvalue:any
// resetValue(value){
//   this.selectedvalue = value 
// }
public UpdateNodes(clicked){
  if(this.reportData['clickedId'].indexOf(clicked.data['tag_value']) < 0){
    this.reportData['clickedId'].push(clicked.data['tag_value']) 
    this.reportData['clickedTagType'].push(clicked.data['Tag Type'])
    this.reportData['depth'].push(clicked.depth)
    let excludedId = this.reportData['clickedId'].toString(); 
    let excludedTagTypes = this.reportData['clickedTagType'].toString();
    let level = this.reportData.depth.toString();
    this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + this.selectedUser.value + '&xids=' + excludedId  +'&xtyps=' + excludedTagTypes + '&depth=' + level;
    this.CommonService.getReportData('staff-tree',this.reportData['param1']).subscribe((res) => {
      if(res.results.statusCode == 200 && res.results.data != null){
        this.treedata['res'] ={
          'Contact Name': res.results.data['First_Degree_contact: '][0]['UHID'],
          'Contact ID' : res.results.data['First_Degree_contact: '][0]['UHID'],
          'children':res.results.data['First_Degree_contact: '][0]['children']
        } ;
        this.drawtree();
      }
    })  
  }
  else{
    this.click(clicked)
  }
  }
public tooltipmouseover(p){
  this.reportData.tooltip.transition()
      .duration(200)
      .style("opacity", .9);
  if(p.depth != 0){
    p.data['From Time'] = this.datepipe.transform(p.data['From Time'], 'yyyy-MM-dd HH:mm:ss');
    this.reportData.tooltip.style('height','50px');
      this.reportData.tooltip.style('width','190px');
    this.reportData.tooltip.html('UHID : '+ "<b>"+p.data['Contact ID']+"<br/>"+'Number Of times Contacted : ' + "<b>"+p.data['Count']+"</b>"+ "<br/>" +'Duration Of Contact : ' +"<b>"+ p.data['Duration']+"</b>" + "<br/>" + 'Contact Time : ' + "<b>"+p.data['From Time']+"</b>")
       .style("left", d3.event.pageX+40 + "px")
       .style("top", d3.event.pageY-145 + "px");
    } else if(p.depth == 0) {
      this.reportData.tooltip.style('height','20px');
      this.reportData.tooltip.style('width','100px');
      this.reportData.tooltip.html('UHID : '+ "<b>"+p.data['Contact ID'])
       .style("left", d3.event.pageX+40 + "px")
       .style("top", d3.event.pageY-145 + "px");
    }
}
public tooltipmouseout(){
  this.reportData.tooltip.transition()
      .duration(200)
      .style("opacity", 0);
}
public update(source){
  console.log(source)
  this.reportData.svg.selectAll('svg')
  .attr("width", this.reportData.width + this.reportData.margin.right + this.reportData.margin.left)
  .attr("height", this.reportData.height + this.reportData.margin.top + this.reportData.margin.bottom)
  this.reportData.treemap = d3.tree()
  .size([this.reportData.height, this.reportData.width])
  .nodeSize([60,])
  .separation(function separation(a, b) {
      return a.parent == b.parent ? 1 : 2;
  });

let treeData = this.reportData.treemap(this.reportData.root);
let nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);
nodes.forEach(function(d){ d.y = d.depth * 100});
let node = this.reportData.svg.selectAll('g.node')
    .data(nodes, function(d) {return d.Identifier || (d.Identifier = ++this.index); });
let nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", function(d) {
      return "translate(" + source.x0 + "," + source.y0 + ")";
  });

// nodeEnter.on('click', function(d){
//     this.clicked = d['Contact UHID']
//   }) 
nodeEnter.on('click',this.UpdateTree.bind(this))
nodeEnter.on("mouseover", function(p) {
    div.transition()
      .duration(200)
      .style("opacity", .9);
      div.html('Number Of times Contacted : ' + "<b>"+p.data.data['Count']+"</b>"+ "<br/>" +'Duration Of Contact : ' +"<b>"+ p.data.data['Duration']+"</b>" + "<br/>" + 'Contact Time : ' + "<b>"+p.data.data['From Time']+"</b>")
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 20) + "px");
    })
nodeEnter.on("mouseout", function(d) {
    div.transition()
      .duration(200)
      .style("opacity", 0);
    });
nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style("fill", function(d) {
      console.log(d)
        return d.data['Is_CloseContact'] == 'Yes' ? "#ff0000" : "#ffa500";
    });
nodeEnter.append('text')
    .attr("dy", ".35em")
    .attr("y", function(d) {
        return d.children || d._children ? -18 : 18;
    })
    .attr("text-anchor", "middle")
    .text(function(d) { 
      return d.data['Contact Name']; })
    .style('font','12px sans-serif')
    

let div = d3.select("#treeDiagram").append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style('font','10px sans-serif')
.style('position', 'absolute')
.style('text-align','left')
.style('width','190px')
.style('height','50px')
.style('padding','2px')
.style('font','11px sans-serif')
.style('background','lightsteelblue')
.style('border','0px')
.style('border-radius','8px')
.style('pointer-events','none')
let nodeUpdate = nodeEnter.merge(node);
nodeUpdate.transition()
  .duration(this.reportData['duration'])
  .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")";
   });

nodeUpdate.select('circle.node')
  .attr('r', 8)
  .style("fill", function(d) {
     return d._children ? d.data.data['Is_CloseContact'] == 'Yes' ? "#ff0000" : "#ffa500" : "#fff";
  })
  .style('stroke',function(d) {
     return d.data.data['Is_CloseContact'] == 'Yes' ? "#ff0000" : "#ffa500";
  })
  .style('stroke-width','3px')
  .attr('cursor', 'pointer');
let nodeExit = node.exit().transition()
    .duration(this.reportData['duration'])
    .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();
nodeExit.select('circle')
  .attr('r', 1e-6);
nodeExit.select('text')
  .style('fill-opacity', 1e-6);
let link = this.reportData.svg.selectAll('path.link')
    .data(links, function(d) { return d.Identifier; });
let linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('d', function(d){
      console.log(d)
      let o = {x: source.x0, y: source.y0}
      // return "M" + o.x + "," + o.y + "V" + o.y + "H" + o.x;
      return "M" + o.x + "," + o.y + "V" + o.y + "H" + o.x;
      })
    .style('fill','none')
    .style('stroke','#ccc')
    .style('stroke-width','2px')
    
let linkUpdate = linkEnter.merge(link);

linkUpdate.transition()
    .duration(this.reportData['duration'])
    //.attr('d', function(d){return "M" + d.x + "," + d.y + "H" + d.parent.x + "V" + d.parent.y;});
    .attr('d',function(d){
      return "M" + d.parent.x + "," + d.parent.y+ "H" + d.x + "V" + d.y;})
// let linkExit = link.exit().transition()
//     .duration(this.reportData['duration'])
//     .attr('d', function(d) {
//       let o = {x: source.x, y: source.y}
//       return "M" + o.x + "," + o.y + "V" + o.y + "H" + (o.x-2);
//       //return "M" + o.x + "," + o.y + "V" + o.y + "H" + (o.x-0);
//     })
    .remove();
nodes.forEach(function(d){
  d.x0 = d.x;
  d.y0 = d.y;
});

}
public click(d) {
  if (d.children) {
      d._children = d.children;
      d.children = null;
      let index=this.reportData['clickedId'].indexOf(d.data['tag_value']);
      this.reportData.clickedId.splice(index, 1);
      this.reportData.clickedTagType.splice(index, 1);
      this.reportData.depth.splice(index, 1);
    } else {
      d.children = d._children;
      d._children = null;
    }
  this.tooltipmouseout();
  this.updateTreeDiagram(d);
}
public UpdateTree(clicked){
if(this.reportData['clickedId'].indexOf(clicked.data.data['con_tag_value']) < 0){
  let excludedId = this.reportData['clickedId'].toString(); 
  let excludedTagTypes = this.reportData['clickedTagType'].toString();
  this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + clicked.data.data['Contact ID'] + '&xids=' + excludedId +'&xtyps=' + excludedTagTypes;
  this.reportData['clickedId'].push(clicked.data.data['con_tag_value']) 
  this.reportData['clickedTagType'].push(clicked.data.data['Tag Type'])
  this.CommonService.getReportData('staff-tree',this.reportData['param1']).subscribe((res) => {
    if(res.results.statusCode == 200 && res.results.data != null){
      let i = this.reportData['tree'].length;
      console.log(clicked.data.data.Identifier)
      res.results.data['First_Degree_contact: '].forEach((item) => {
        item.parentIdentifier = clicked.data.data.Identifier
        item.Identifier = i+1
        item.level = clicked.data.data.level + 1
        i = i+1
       });
      this.reportData['tree'] = this.reportData['tree'].concat(res.results.data['First_Degree_contact: '])
      console.log(this.reportData['tree']) 
      this.treeDiagram();
    }
  })

}
else{
  this.click(clicked)
}

}
  downloadExcel() {
    let excelData : any;
    let name = this.selected['name'];
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
      if(this.selected['selectedId'] == 'staff-attendancebyid') {
        excelData =  this.reportData['Table'];      
      } else if(this.selected['selectedId'] == 'staff-attendance-all' || this.selected['selectedId'] == 'staff-attendancebyid'){
        excelData =  this.reportData['Table']; 
      }else if (this.selected['selectedId'] == 'staff-contact') {
        let del = ['UHID', 'Name', 'Identifier', 'Is_CloseContact', 'con_tag_value', 'parentIdentifier', 'tag_value','AtRisk','level','close'];
        let data = this.reportData['excelData'];
        for(let i=0;i<data.length;i++){
          data[i].map(function(item) { 
            for(let j=0;j<del.length;j++)
              delete item[del[j]]; 
            return item; 
        });
        }
        this.reportData['fullExcelDetails'] = [];
        this.reportData['fullExcelDetails'].push(data);
        this.reportData['fullExcelDetails'].push(this.reportData['selectedUhid']);
        excelData = this.reportData['fullExcelDetails'];
        this.getAllStaffReports('staff-contact')
      }else if(this.selected['selectedId'] == 'staff-ccd-all'){
        excelData =  this.reportData['Table']; 
      }else if(this.selected['selectedId'] == 'staff-site-nav'){
        excelData =  this.reportData['excelData'];
        for(let i=0;i<excelData.length;i++){
          delete excelData[i]['children'];
          delete excelData[i]['EmployeeId'];
          delete excelData[i]['close'];
        }
        this.selected['todate'] = this.toDate;
      }else if(this.selected['selectedId'] == 'staff-geofencevio'){
        excelData =  this.reportData['Table'];
        this.selected['todate'] = this.toDate;
      }else if(this.selected['selectedId'] == 'staff-battery-summary'){
        excelData = this.reportData['Table'];
      }else if(this.selected['selectedId'] == 'staff-roll-call'){
      excelData =  this.reportData['Table']; 
      } else if(this.selected['selectedId'] == 'visitor-history-byloc'){
        excelData =  this.reportData['Table']; 
      } else if(this.selected['selectedId'] == 'cons-visit-hist'){
        excelData =  this.reportData['Table']; 
      } else if(this.selected['selectedId'] == 'cons-visit-hist-bywad'){
        excelData =  this.reportData['Table']; 
      } else if(this.selected['selectedId'] == 'staff-tracking'){
        excelData=[];
        excelData[0] =  this.reportData['excelData'];
        excelData[1] = ['staff-details', 'staff-tracking-details'];
      } else if(this.selected['selectedId'] == 'tat-by-shift'){
        excelData=[];
        excelData[0] =  this.reportData['excelData'];
        excelData[1] = [this.selected['name'], 'Summary Type'];
        excelData[2] = this.locationName;
      } else {
        excelData =  this.reportData['Table'];      
      }
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
    } else {
      excelData = [];
    }
  }
  downloadPDF() {
    let pdfData : any;
    if (this.reportData.length || this.reportData != null) {
      let chartImage = [];
      let name = this.selected['name'];
      pdfData=this.reportData;
      if (this.selected['selectedId'] == 'staff-geofencevio') {
        chartImage = [document.getElementById('empGeofenceViolation')];
      } else if(this.selected['selectedId'] == 'staff-roll-call'){
        chartImage = [document.getElementById('durationRollCall'),document.getElementById('departmentRollCall')];
      } else if(this.selected['selectedId'] == 'staff-attendance-all'){
        chartImage=[document.getElementById('deptAttAll')];
      } else if(this.selected['selectedId'] == 'staff-battery-summary'){
        chartImage=[document.getElementById('percentagesplit')];
      } else if(this.selected['selectedId'] == 'staff-summary-rep'){
        chartImage=[document.getElementById('GenderChart'),document.getElementById('DeviceChart'),document.getElementById('AgeChart'),document.getElementById('DepartmentChart'),document.getElementById('inOutCountEmployee')];
      }
      this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage);
    } else {
      pdfData = [];
    }
  }
  fixClick() {
    console.log('')
  }  
}
