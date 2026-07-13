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
import { Component, OnInit} from '@angular/core';
import { ExcelService, CommonService, PdfService, ChartService, HospitalService } from '../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as d3 from 'd3';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-employee-report',
  templateUrl: './employee-report.component.html',
  styleUrls: ['./employee-report.component.scss']
})

export class EmployeeReportComponent implements OnInit {
  public reportForm: FormGroup;
  public date: any = new Date();
  public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  //public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  //public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public currentDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public selectedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public Uhid = new FormControl();
  public facilityId = new FormControl();
  public reportList : any;
  public typelist : any;
  public statuslist : any;
  public batterylist : any;
  public Customselected : any = 'no';
  public customInput : any ;
  public reportData : any = [];
  public treedata : any = {};
  selectedType: any = new FormControl();
  selectedStatus: any = new FormControl();
  selectedBattery: any = new FormControl();
  public regionValue: string;
  public facilityList : any;
  public HCselected = 'emp-summary-rep';
  type: string = 'Employee' ;
  contactType : string = 'Employee';
  today = new Date();
  public selected : any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  identifier: any = new FormControl();
  selectedReport: any = new FormControl();
  public reportType: string = 'Employee';
  public activate_btn: any = [];
  dateType = "reportDate";
  constructor(public datepipe: DatePipe, private readonly commonService: CommonService, private readonly activeRoute : ActivatedRoute,
    public fb: FormBuilder, public excelService: ExcelService, public pdfService: PdfService, public chartService : ChartService, public hospitalService : HospitalService) {
      this.activate_btn = this.commonService.getActivePermission('button');
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
      this.getReportList();
      this.activeRoute.queryParams.subscribe(params => {
        if(params.hasOwnProperty('report')) {
          this.HCselected = params['report'];
          this.Uhid = params['id'];
          this.contactType = params['type'];
          this.fromDate = params['fdt']
          this.selectedReport.setValue(this.HCselected);
          this.identifier.setValue(params['id']);
          this.reportType = params['type'];
        }
      });
      this.getFacilityList();
    }
  ngOnInit() {
    this.getEmployeeReports(this.HCselected);
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
  let permissions = JSON.parse(localStorage.getItem('permission'));
  let menuItemsList = permissions['menuItems'].filter(res=> res.code == "MN_RE");
  let submenusList =menuItemsList ? this.commonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIES") : null;
  let tempId = submenusList['id'];
  let empReplist = permissions['dropdown'].filter(res=> res.parentId == tempId);
  this.reportList = empReplist;
   const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
      if (firstSeqReport) {
        this.HCselected = firstSeqReport.code;
      }
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

getEmployeeReports(id){
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData = {};
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
    if(id == 'emp-summary-rep'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if(res.results.statusCode == 200 && res.results.data != null)
        {
          this.reportData['loading']=false;
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
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Strength','content':this.reportData['fullData']['Strength'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Staffs Absent','content':this.reportData['fullData']['Absent'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'SD Alert Count','content':this.reportData['fullData']['SD Alert Count'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Geofence Alert Count','content':this.reportData['fullData']['Geo Alert Count'][0]['Count']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Visitors','content':this.reportData['fullData']['Visitor'][0]['Count']}];
          this.reportData['showCard'] = true;
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'GenderChart','type':'pie','data':this.reportData.fullData.Gender.data,'label': this.reportData.fullData.Gender.label,'title':'Gender','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'DeviceChart','type':'pie','data':this.reportData.fullData.Tag.data,'label': this.reportData.fullData.Tag.label,'title':'Devices Used','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'AgeChart','type':'pie','data':this.reportData.fullData.Age.data,'label': this.reportData.fullData.Age.label,'title':'Age Group','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'DepartmentChart','type':'pie','data':this.reportData.fullData['Emp Type']['data'],'label': this.reportData.fullData['Emp Type']['label'],'title':'By Department','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'StaffByDept','type':'pie','data':this.reportData.fullData.Department.data,'label': this.reportData.fullData.Department.label,'title':'Staff Present (By Department)','showTitle':true,'barLabel': []});
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'inOutCountEmployee','type':'bar','data':this.reportData.fullData.timewise.data.IN,'label': this.reportData.fullData.timewise.label,'title':'Alert Generated (By Hour)','showTitle':true,'barLabel': ['IN']});          
      } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        } 
      },
        error =>{
         this.reportData['loading'] = false;
         this.reportData['noError'] = false;
      })
    } else if(id == 'emp-attendance'){
      console.log(this.toDate); 
      console.log(this.fromDate);  
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
      console.log(this.identifier.value);
      this.reportData['param'] =  '/user_id=' + this.identifier.value + '&fdt=' + this.fromDate + '&tdt=' + this.toDate;
      if(this.identifier.value == null || this.identifier.value == ''){
        this.reportData['nullIdentifier'] = true;
      }
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => { 
        console.log(res.results.data)
          if (res.results.statusCode == 200 && res.results.data != null) {
            this.reportData.loading = false;
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
          this.reportData['cardInfo'] = {'width':'100%', 'height':'100px','col':3,'gutterSize':'0px'};
          this.reportData['tileInfo'] = [
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Leave Taken','content':this.reportData['fullData']['Staff Agg'][0]['strength']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average Strength','content':this.reportData['fullData']['Staff Agg'][0]['leave_days']},
          {'rowspan':1,'colspan':1,'showHeader':true,'header':'Average working Hours','content':this.reportData['fullData']['Staff Agg'][0]['avg_hours']}];
          this.reportData['info'] = res.results.data['Staff Info'][0];
          this.reportData['showCard'] = true;
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
    } else if(id == 'emp-attendance-all') {   
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
      console.log("VALID")
      this.reportData['param'] =  '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res)
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.enableexcel = true;
          this.reportData.enablepdf = true;
          this.reportData['workingHours'] = res.results.data['Staff Agg'][0]['avg_working_hours'];
          this.reportData['strength'] = res.results.data['Staff Agg'][0]['avg_strength_percent'];
          this.reportData['leaveTotal'] = res.results.data['Staff Agg'][0]['tot_leave'];
          this.reportData['deptLabel'] = res.results.data['Deptwise'].map(value => value.Department);
          this.reportData['deptPresent%'] = res.results.data['Deptwise'].map(value => value['Present%']);
          this.chartService.drawChart({'canvasId':'deptAttAll','type':'bar','data':this.reportData['deptPresent%'],'label': this.reportData['deptLabel'],'title':'By Department','showTitle':true,'barLabel': ['Dept']});
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
    } else if(id == 'battery-summary'){
      this.reportData['param'] = '/fdt=' + this.selectedDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        console.log(res)
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData.enableexcel = true;
          this.reportData.enablepdf = true;
          this.reportData['countData'] = [];
          this.reportData['activeCount'] = [];
          this.reportData['inactiveCount'] = [];
          for(let i=0;i<res.results.data['Tag Status Detail'].length;i++){
            this.reportData.activeCount.push(res.results.data['Tag Status Detail'][i]['active_count']);
            this.reportData.inactiveCount.push(res.results.data['Tag Status Detail'][i]['inactive_count']);
          }
          this.reportData['countData'] = [this.reportData['activeCount'],this.reportData['inactiveCount']];
          this.chartService.drawChart({'canvasId':'activecount','id':'battery-summary','type':'grouped','data':this.reportData['countData'],'label':['Employee','TemporaryID','Visitor'],'title':'Tag Status','showTitle':true,'barLabel':['Active','Inactive']});
          this.reportData['percentageData'] = res.results.data['Battery Status Detail'];
          this.reportData['zeroData'] = this.reportData['percentageData'][0]['battery_percentage'];
          this.reportData['percentageCount'] = [this.reportData['percentageData'][0]['battery_percentage'],this.reportData['percentageData'][1]['battery_percentage'],this.reportData['percentageData'][2]['battery_percentage'],this.reportData['percentageData'][3]['battery_percentage']];
          this.reportData['percentageLabel'] = [this.reportData['percentageData'][0]['today_date'],this.reportData['percentageData'][1]['today_date'],this.reportData['percentageData'][2]['today_date'],this.reportData['percentageData'][3]['today_date']];
          this.chartService.drawChart({'canvasId':'percentagesplit','id':'battery-summary','type':'pie',
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
    }else if(id == 'sensr-raw'){
      console.log(id);
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data.length >= 1) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data;
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['Receivedtime'] = this.datepipe.transform(this.reportData['Table'][i]['Receivedtime'], 'HH:mm:ss');
            this.reportData['Table'][i]['Fromtime'] = this.datepipe.transform(this.reportData['Table'][i]['Fromtime'], 'HH:mm:ss');
            this.reportData['Table'][i]['Totime'] = this.datepipe.transform(this.reportData['Table'][i]['Totime'], 'HH:mm:ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
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
    } else if(id == 'roll-call') {
      this.reportData['param'] = this.facilityId.value + '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {  
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
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Employees Present/Assembled','content':this.reportData['totalEmployeeIn']/this.reportData['reachedEmployeePoint']},
            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Number Of Employees Missing','content':this.reportData['empmissing']},
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
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'durationRollCall','type':'pie','data':this.reportData.byDur.data,'label': this.reportData.byDur.label,'title':'Assembled (By Duration)','showTitle':true,'barLabel': []});
            this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'departmentRollCall','type':'grouped','data':this.reportData.departmentData,'label': this.reportData.departmentlabel,'title':'Assembled (By Department)','showTitle':true,'barLabel': ['Total','Assembled']});
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        },
        error =>{
         this.reportData['loading'] = false;
         this.reportData['noError'] = false;
        });
    } else if (id == 'emp-geofencevio') {
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {  
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
          this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'empGeofenceViolation','type':'pie','data':this.reportData.chartData.Data,'label': this.reportData.chartData.Label,'title':'Employee Geofence Violation','showTitle':true,'barLabel': []});
          } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      },
      error =>{
       this.reportData['loading'] = false;
       this.reportData['noError'] = false;
      });
    } else if (id == 'site-nav') {
      this.reportData['param'] = '/fdt=' + this.toDate +'&ptyp=' + this.type + '&uid=' + this.identifier.value;
      if(this.identifier.value == null || this.identifier.value == ''){
        this.reportData['nullIdentifier'] = true;
      }
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res);
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData.loading = false;
          this.reportData.enableexcel = true;
          this.reportData['employeeId'] = res.results.data.emp_info[0].EmpId;
          this.reportData['Name'] = res.results.data.emp_info[0].Name;
          this.reportData['gender'] = res.results.data.emp_info[0].Gender;
          this.reportData['Table'] = res.results.data['journey '];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
          }
          this.reportData['excelData']=[];
          this.reportData['excelData'][0]= this.reportData['Table'];
          this.reportData['excelData'][1]=[];
          for(let i=0;i<this.reportData['Table'].length;i++){    
            for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
              this.reportData['excelData'][1].push(Object.assign({},this.reportData['excelData'][0][i].children[j],this.reportData['excelData'][0][i]))
            }
            }
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      },
      error => {
        this.reportData['loading'] = false;
        this.reportData['noError'] = false;
      });
    } else if (id == 'visitor-summary') {
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexcel'] = false;
          this.reportData['totalVisitors'] = res.results.data['Visitor Total'];
          this.reportData['avgTime'] = res.results.data['Avg.Time'];
          this.reportData['sdAlert'] = res.results.data['SD Alert'];
          this.reportData['geoAlert'] = res.results.data['Geo Alert'];
          this.reportData['visitpurpose'] = res.results.data['Visit Purpose'];
          // this.reportData['tile'] = {'tile1colspan': 3,'tile2colspan':3};
          // this.reportData['listItems'] = [{'heading': 'Total Visitors','value':res.results.data['Visitor Total'] },
          // {'heading': 'Average Time', 'value':res.results.data['Avg.Time']},
          // {'heading': 'SD Alerts', 'value':res.results.data['SD Alert']},
          // {'heading':'Geo Alerts', 'value':res.results.data['Geo Alert']}]
          this.reportData['Table'] = res.results.data['Visitor Detail'];
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['Checkin Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkin Time'], 'HH:mm:ss');
            this.reportData['Table'][i]['Checkout Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkout Time'], 'HH:mm:ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
            this.reportData['showTable'] = true;
          }
          //this.chartService.drawChart({'id':this.selected['selectedId'],'canvasId':'visitPurpose','type':'pie','data':this.reportData.visitpurpose.data,'label': this.reportData.visitpurpose.data,'title':'Visit Purpose','showTitle':true,'barLabel': []});

        } else {
          this.reportData['noRecords'] = true;
          this.reportData['loading'] = false;
        }
      },
      error =>{
       this.reportData['loading'] = false;
       this.reportData['noError'] = false;
      });
    } else if(id == 'temp-id-summary'){
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data['Employee Detail'];
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['Checkin Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkin Time'], 'HH:mm:ss');
            this.reportData['Table'][i]['Checkout Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkout Time'], 'HH:mm:ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
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
    }else if (id == 'temporary-staff-summary') {
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe(res => {
        console.log(res)
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = true;
          this.reportData['enableexxcel'] = true;
          this.reportData['totalTempStaff'] = res.results.data['TempStaff Total'];
          this.reportData['avgTime'] = res.results.data['Avg.Time'];
          this.reportData['sdAlert'] = res.results.data['SD Alert'];
          this.reportData['geoAlert'] = res.results.data['Geo Alert'];
          //this.reportData['visitpurpose'] = res.results.data['Visit Purpose'];
          this.reportData['Table'] = res.results.data['TempStaff Detail'];
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['Checkin Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkin Time'], 'HH:mm:ss');
            this.reportData['Table'][i]['Checkout Time'] = this.datepipe.transform(this.reportData['Table'][i]['Checkout Time'], 'HH:mm:ss');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
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
    }else if (id == 'contact-tree') {
      this.selectedDate = this.fromDate;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.identifier.value + '&type=' + this.contactType;
      if (this.identifier.value != null){
        this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
          console.log(res)
          if(res.statusCode == 1 && res.results.statusCode == 200){
            this.reportData['loading'] = false;
            this.reportData['noRecords'] = false;
            this.reportData['enablepdf'] = false;
            this.reportData['enableexcel'] = true;
            this.reportData['displayedData'] = [
              {'colName': 'CONTACT NAME', 'title': 'CONTACT NAME', 'dataName': 'name'},
              {'colName': 'CONTACT ID', 'title': 'CONTACT ID', 'dataName': 'mainidentifier'},
              {'colName': 'CLOSE CONTACT', 'title': 'CLOSE CONTACT', 'dataName': 'is_close_contact'},
              {'colName': 'GENDER', 'title': 'GENDER', 'dataName': 'gender'},
              {'colName': 'MOBILE NUMBER', 'title': 'MOBILE NUMBER', 'dataName': 'mobile_no'},
              {'colName': 'CONTACT TYPE', 'title': 'CONTACT TYPE', 'dataName': 'tag_type_name'},
              {'colName': 'FROM TIME', 'title': 'FROM TIME', 'dataName': 'start_time'},
              {'colName': 'TO TIME', 'title': 'TO TIME', 'dataName': 'end_time'},
              {'colName': 'DURATION', 'title': 'DURATION', 'dataName': 'duration'},
              {'colName': 'COUNT', 'title': 'COUNT', 'dataName': 'contact_count'},
              {'colName': 'FLOOR NAME', 'title': 'FLOOR NAME', 'dataName': 'floor_name'},
              {'colName': 'LOCATION NAME', 'title': 'LOCATION NAME', 'dataName': 'location_name'}
              ];
              this.reportData['subTableDisplayedData']=[
                {'colName': 'FROM TIME', 'title': 'FROM TIME', 'dataName': 'start_time'},
                {'colName': 'TO TIME', 'title': 'TO TIME', 'dataName': 'end_time'},
                {'colName': 'DURATION', 'title': 'DURATION', 'dataName': 'duration'},
                {'colName': 'CLOSE CONTACT', 'title': 'CLOSE CONTACT', 'dataName': 'is_close_contact'}
              ]
            this.reportData['firstDegreeData'] = res.results.data;
            this.reportData['tableView'] = true;
            this.reportData['initialised'] = true;
          } else{
            this.reportData['noRecords'] = false;
            this.reportData['loading'] = false;
            this.reportData['initialised'] = true;

          }
        },
          error => {
            this.reportData['loading'] = false;
            this.reportData['noError'] = false;
        });
      } else{
        this.reportData['nullIdentifier'] = true;
        this.reportData['loading'] = false;
        this.reportData['initialised'] = true;
      }

    } else if (id == 'emp-contact') {
      document.getElementById('treeDiagram').innerHTML='';
      this.selectedDate = this.fromDate;
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.identifier.value + '&ptyp=' + this.contactType;
        if (this.identifier.value == null || this.identifier.value == ''){
          this.reportData['nullIdentifier'] = true;
        }
        this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
          console.log(res)
          this.reportData['data'] = [];
          this.reportData['tree'] = [];
          this.reportData['clickedId'] = [];
          this.reportData['depth']=[];
          this.reportData['clickedTagType'] = [];
          this.reportData['index'] = 0;
          let location = [];
          if(res.results.statusCode == 200 && res.results.data !=null){
            this.reportData['loading'] = false;
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
            if(this.contactType == 'visitor'){
              this.reportData['clickedTagType'].push('TAT-VS');
            } else {
              this.reportData['clickedTagType'].push('TAT-EM');
            }
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
  }else if(id == 'emp-loc-rep'){
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['tableData'] = res.results.data;
          this.reportData['charts']=[];
          for(let i=0;i<this.reportData['tableData'].length;i++){
            this.reportData['charts'].push({'id':this.selected['selectedId'],'canvasId':this.reportData['tableData'][i]['Hourly Contacts'],'type':'bar','data':this.reportData['tableData'][i]['data'],'label': this.reportData['tableData'][i]['label'],'title':'','showTitle':false,'barLabel': ['Count']});
          }
          this.reportData['Table'] = this.reportData['tableData'];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = ['Location','Number of Events','Hourly Contacts'];
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
    } else if(id == 'emp-ccd-all'){
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data.length >= 1) {
          this.reportData['loading'] = false;
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
    }else if(id == 'emp-ccd-all-byd'){
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data.length >= 1) {
          this.reportData['loading'] = false;
          this.reportData['noRecords'] = false;
          this.reportData['enablepdf'] = false;
          this.reportData['enableexcel'] = true;
          this.reportData['Table'] = res.results.data;
          for (let i = 0; i < this.reportData['Table'].length; i++) {
            this.reportData['Table'][i]['From timestamp'] = this.datepipe.transform(this.reportData['Table'][i]['From timestamp'], 'yyyy-MM-dd HH:mm:ss');
            this.reportData['Table'][i]['To timestamp'] = this.datepipe.transform(this.reportData['Table'][i]['To timestamp'], 'yyyy-MM-dd HH:mm:ss');
            this.reportData['Table'][i]['Event date'] = this.datepipe.transform(this.reportData['Table'][i]['Event date'], 'yyyy-MM-dd');
          }
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = ['EmpId','Name','Contact EmpId','Contact Emp.Name','From timestamp','To timestamp','Duration','Event date'];
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
    } else if(id == 'emp-ccd-agg'){
      this.validDate=this.validate(this.fromDate,this.toDate);
      if(!this.validDate){
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      }
      else{
      this.reportData['showTable'] = false;
      this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
      this.commonService.getReportData(id,this.reportData['param']).subscribe((res) => {
        if (res.results.statusCode == 200 && res.results.data != null) {
          this.reportData['loading']=false;
          this.reportData['enableexcel']=true;
          this.reportData['excelData'] = [];
          this.reportData['fullData'] = res.results.data;
          this.reportData['closeContact'] = res.results.data['close contacts'];
          for (let i = 0; i < res.results.data['close contacts'].length; i++) {
            res.results.data['close contacts'][i]['Visit start time'] = this.datepipe.transform(res.results.data['close contacts'][i]['Visit start time'], 'dd/MM/yyyy HH:mm:ss');
          }
          this.reportData['Table'] = res.results.data['close contacts'];
          this.reportData['TableColumns'] = [];
          if(this.reportData['Table'].length > 0){
            this.reportData['TableColumns'] = Object.keys(this.reportData['closeContact'][0]);
            this.reportData['tableView'] = true;
            this.reportData['initialised'] = true;
          }
          this.reportData['excelData']=[];
          this.reportData['excelData'][0]= this.reportData['Table'];
          this.reportData['excelData'][1]=[];
          this.reportData['childData']=[];
          for(let i=0;i<this.reportData['Table'].length;i++){    
            for(let j=0;j<this.reportData['Table'][i]['children'].length;j++){
              this.reportData['childData'].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j]))
              //delete this.reportData['excelData'][0][i]['children']
            }
          }
          for(let i=0; i < this.reportData['childData'].length; i++){
            let splitVal = this.reportData['childData'][i]['Event Date'].split(',')
            let splitDate = this.reportData['childData'][i]['Duration'].split(',')
            for(let j=0; j< splitVal.length; j++){
              this.reportData['excelData'][1].push(Object.assign({},this.reportData['childData'][i],  {EventDate: splitVal[j]},{Duration: splitDate[j]}))
            }
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
      }
    }

 this.selected={'selectedId': id , 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.identifier.value, 'facility' : this.facilityId.value, 'type':this.type, 'contactType':this.contactType};
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
public resetValue(value){
  console.log("resetvalue")
  this.contactType = value;
  if(this.contactType != this.selected['contactType']){
    this.identifier.setValue('');
  }else{
    this.identifier.setValue(this.selected['Uhid']);
  }
}
tagValues(tags){
  this.reportData['excludedTags'] = tags;
}
tagType(tagTypes){
  this.reportData['excludedTagTypes'] = tagTypes;
}

fetchRecords( selectedUhid : string){
    this.reportData['excludedTags'] = this.reportData['excludedTags'].toString()
    this.reportData['excludedTagTypes'] = this.reportData['excludedTagTypes'].toString()
    this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + selectedUhid[0] + '&xids=' + this.reportData['excludedTags']+ '&ptyp=' + selectedUhid[1] +'&xtyps=' + this.reportData['excludedTagTypes'];
    this.commonService.getReportData(this.selected['selectedId'],this.reportData['param1']).subscribe((res) => {
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
    console.log(this.reportData['excelData'])
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
  if(this.selected['selectedId'] == 'emp-contact'){
    this.reportData.clickedId=[];
    this.reportData.clickedTagType=[];
    this.reportData.depth = [];
    this.reportData['tableView'] = false;
    // if(!this.treedata.hasOwnProperty('res') 
    // ||(this.treedata.hasOwnProperty('res') && 
    // (this.treedata['res']['from_date']!=this.fromDate || this.treedata['res']['to_date']!=this.toDate || this.treedata['res']['mainidentifier']!=this.Uhid)   
    // )
    // ){
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate +'&uid=' + this.identifier.value+ '&ptyp=' + this.contactType;
        this.commonService.getReportData('emp-tree',this.reportData['param']).subscribe((res) => {
          console.log(res)
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
public UpdateNodes(clicked){
  if(this.reportData['clickedId'].indexOf(clicked.data['tag_value']) < 0){
    this.reportData['clickedId'].push(clicked.data['tag_value']) 
    this.reportData['clickedTagType'].push(clicked.data['Tag Type'])
    this.reportData['depth'].push(clicked.depth)
    let excludedId = this.reportData['clickedId'].toString(); 
    let excludedTagTypes = this.reportData['clickedTagType'].toString();
    let level = this.reportData.depth.toString();
    this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + this.identifier.value + '&xids=' + excludedId  +'&xtyps=' + excludedTagTypes + '&depth=' + level;
    this.commonService.getReportData('emp-tree',this.reportData['param1']).subscribe((res) => {
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
  this.reportData['param1'] = '/fdt=' + this.selectedDate + '&tdt=' + this.toDate + '&uid=' + clicked.data.data['Contact ID'] + '&xids=' + excludedId +'&ptyp='+ this.contactType +'&xtyps=' + excludedTagTypes;
  this.reportData['clickedId'].push(clicked.data.data['con_tag_value']) 
  this.reportData['clickedTagType'].push(clicked.data.data['Tag Type'])
  this.commonService.getReportData('emp-tree',this.reportData['param1']).subscribe((res) => {
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
  let name = '';
  let transpose = false;
  if (this.reportData.length || this.reportData != null) {
    name = name+this.selected['selectedId'];
    console.log(name)
    if (this.selected['selectedId'] == 'emp-summary')
    {
      let data=[this.reportData['Table'],this.reportData['socialDistancingAlert']];
      let sheetNames = ['Employee Details','Social Distancing Alerts']
      excelData = [data,sheetNames];
    } else if (this.selected['selectedId'] == 'contact-tree') {

      name = 'Employee Contact Tracing';
      // let del = ['UHID', 'Name', 'Identifier', 'Is_CloseContact', 'con_tag_value', 'parentIdentifier', 'tag_value','AtRisk','level'];
      // let data = this.reportData['excelData'];
      // for(let i=0;i<data.length;i++){
      //   data[i].map(function(item) { 
      //   for(let j=0;j<del.length;j++)
      //     delete item[del[j]]; 
      //   return item;    
      //   });
      // }
      this.reportData['fullExcelDetails'] = [];
      this.reportData['fullExcelDetails'].push(this.reportData.excelData);
      this.reportData['fullExcelDetails'].push(this.reportData['selectedUhid']);
      excelData = this.reportData['fullExcelDetails'];
    } else if (this.selected['selectedId'] == 'emp-contact') {
      name = 'Employee Contact Tracing';
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
      console.log(this.reportData.selectedUhid)
      this.reportData['fullExcelDetails'].push(this.reportData['selectedUhid']);
      excelData = this.reportData['fullExcelDetails'];
      console.log(excelData)
      this.getEmployeeReports('emp-contact')
    } else if(this.selected['selectedId'] == 'emp-attendance-all' || this.selected['selectedId'] == 'emp-attendance'){
        name=name+this.fromDate+" TO "+this.toDate;
        excelData =  this.reportData['Table']; 
    }else if(this.selected['selectedId'] == 'temp-id-summary'){
        name = 'Temporary ID Summary';
        excelData = this.reportData['Table'];
    }else if(this.selected['selectedId'] == 'site-nav'){
      name='Sitevisit and navigation report';
      excelData=[];
      excelData[0] =  this.reportData['excelData'];
      excelData[1] = ['sitevisit-summary','sitevisit-details']
      this.selected['todate'] = this.toDate;
      this.getEmployeeReports('site-nav')
    }else if(this.selected['selectedId'] == 'emp-geofencevio'){
      name='Employee Geofence Violation Report';
      excelData =  this.reportData['Table'];
      this.selected['todate'] = this.toDate;
    }
    else if(this.selected['selectedId'] == 'temporary-staff-summary'){
      name=name+this.toDate;
      excelData =  this.reportData['Table']; 
    }else if(this.selected['selectedId'] == 'emp-ccd-all'){
        name='Employee Close Contact Report'
        excelData =  this.reportData['Table']; 
    }else if(this.selected['selectedId'] == 'emp-ccd-all-byd'){
      name='Employee Total Duration Contact Per Day Report'
      excelData =  this.reportData['Table']; 
    }else if(this.selected['selectedId'] == 'emp-ccd-agg'){
      name = 'Employee Close Contact By Location'
      excelData = []
      excelData[0] = this.reportData['excelData'];
      for(let i=0;i<excelData[0][0].length;i++){
        delete excelData[0][0][i]['children']
      }
      for(let i=0;i<excelData[0][1].length;i++){
        delete excelData[0][1][i]['children']
        delete excelData[0][1][i]['Event Date']
      }
      excelData[1] = ['Location Summary', 'Location Details']
      this.getEmployeeReports('emp-ccd-agg')
    }else if(this.selected['selectedId'] == 'battery-summary'){
      name = 'Battery Summary';
      excelData = this.reportData['Table'];
    }else if(this.selected['selectedId'] == 'sensr-raw'){
      name = 'Sensor Details';
      excelData = this.reportData['Table'];
    }else if(this.selected['selectedId'] == 'roll-call'){
    name='Roll Call Report'
    excelData =  this.reportData['Table']; 
} else if (this.selected['selectedId'] == 'emp-contact') {
  name = 'Employee Contact Tracing';
  let del = ['UHID', 'Name', 'Identifier', 'Is_CloseContact', 'con_tag_value', 'parentIdentifier', 'tag_value','AtRisk','level'];
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
}
else {
      excelData =  this.reportData['Table'];      
    }
    this.excelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
  } 
}
downloadPDF() {
  let pdfData : any;
  if (this.reportData.length || this.reportData != null) {
    let chartImage = [];
    let name: string;
    pdfData=this.reportData;
    if (this.selected['selectedId'] == 'emp-geofencevio') {
      name = 'Employee Geo Fence Violation Report - '+this.selected['todate'];
      chartImage = [document.getElementById('empGeofenceViolation')];
    } else if (this.selected['selectedId'] == 'site-nav') {
      name = 'Site Visit and Navigation Report';
    } else if(this.selected['selectedId'] == 'roll-call'){
      name = 'Roll Call Report';
      chartImage = [document.getElementById('durationRollCall'),document.getElementById('departmentRollCall')];
    } else if(this.selected['selectedId'] == 'emp-attendance'){
      name = 'Employee Attendance Report';
    } else if(this.selected['selectedId'] == 'emp-attendance-all'){
      name = 'All Employee Attendance Report';
      chartImage=[document.getElementById('deptAttAll')];
    } else if(this.selected['selectedId'] == 'battery-summary'){
      name = 'Battery Summary';
      chartImage=[document.getElementById('activecount'),document.getElementById('percentagesplit')];
    } else if(this.selected['selectedId'] == 'emp-summary-rep'){
      name = 'Employee Summary';
      chartImage=[document.getElementById('GenderChart'),document.getElementById('DeviceChart'),document.getElementById('AgeChart'),document.getElementById('DepartmentChart'),document.getElementById('StaffByDept'),document.getElementById('inOutCountEmployee')];
    } else if( this.selected['selectedId'] == 'visitor-summary'){
      name = 'Visitor Summary'
      //chartImage=[document.getElementById('visitPurpose')];
    } else {
      name = this.selected['selectedId'];
    }
    console.log(this.selected['todate']);
    this.pdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage);
  } 
}
reportHeaderAction(event) {
  if(event.key === 'report') {
    this.HCselected = event.data.link;
    if(this.HCselected !== 'battery-summary' && this.HCselected !== 'emp-attendance' && this.HCselected !== 'emp-attendance-all' && 
      this.HCselected !== 'contact-tree' && this.HCselected !== 'emp-contact' && this.HCselected !== 'emp-ccd-all' && 
      this.HCselected !== 'emp-ccd-all-byd' && this.HCselected !== 'emp-ccd-agg' && this.HCselected !== 'sensr-raw') {
      this.dateType = "reportDate";
    } else if (this.HCselected === 'emp-attendance' || this.HCselected === 'emp-attendance-all' || this.HCselected === 'contact-tree' || 
      this.HCselected === 'emp-contact' || this.HCselected === 'emp-ccd-all' || this.HCselected === 'emp-ccd-all-byd' || this.HCselected === 'emp-ccd-agg') {
      this.dateType = "multipleDate";
    } else if (this.HCselected === 'sensr-raw') {
      this.dateType = "fromDate";
    } else {
      this.dateType = null;
    }
  } else if(event.key === 'fromDate') {
    this.fromDate = event.data;
  } else if(event.key === 'toDate') {
    this.toDate = event.data;
  } else if(event.key === 'getInsights' || event.key === 'refresh') {
    this.getEmployeeReports(this.HCselected);
  } else if(event.key === 'excel') {
    this.downloadExcel();
  } else if(event.key === 'pdf') {
    this.downloadPDF();
  }
}
  fixClick() {
    console.log('')
  }
}
