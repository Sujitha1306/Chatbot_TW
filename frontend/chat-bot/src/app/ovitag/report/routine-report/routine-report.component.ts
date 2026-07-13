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

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { ExcelService, PdfService, CommonService, ChartService, ConfigurationService, ReportService } from '../../../shared';
import { DatePipe } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'app-routine-report',
    templateUrl: './routine-report.component.html',
    styleUrls: ['./routine-report.component.scss']
})

export class RoutineReportComponent implements OnInit {
    public date: any = new Date();
    public fromDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
    public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
    public today = new Date();
    public facilityId = new FormControl();
    public patientSub : Subject<any> = new Subject();
    public RoleId = new FormControl();
    public reportForm: FormGroup;
    public reportList: any;
    public reportData: any = [];
    public patientList: any = [];
    public selectedReport: any = new FormControl();
    public HCselected = 'stf-routin-sumary';
    public selected: any;
    public chartImage: any;
    public validDate: any;
    public param: any;
    public locationlist: any[];
    public selectedLocTemp :any;
    public selectedTempCat :any;
    public selectedTempTask :any;
    public patientId: any = new FormControl();
    public selectedLocation : any = new FormControl(null);
    public selectedCategory : any = new FormControl(null);
    public selectedTask : any = new FormControl(null);
    public activityCategoryList: any=[];
    public taskActivitiesList: any=[];
    public enableTask = false;
    @ViewChild('allCatSelected') private readonly allCatSelected: MatOption;
    @ViewChild('allTaskSelected') private readonly allTaskSelected: MatOption;
    headercolor = '#3f586a';
    RoleList:any;
    public activate_btn: any = [];
    public selectedrolelistid: any  = new FormControl(null);
    filterInputs = [];
    locationName = null;
    patientName = null;
    activityCategory = null;
    activityTask = null;
    HCselectedCode = 'stf-routin-sumary';
    constructor(public datepipe: DatePipe, public PdfService: PdfService,
        public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService,public configurationService: ConfigurationService, public reportService: ReportService) {
            this.activate_btn = this.CommonService.getActivePermission('button');
    }
    ngOnInit() {
        this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
            this.getPatients(searchTextValue);
        });        
        this.filterInputs = [{name:'report', id:'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected, routine: true},
        { name: "fromDate", id: "fdt", label:"From Date", seq : 2, default: this.fromDate},
        { name: "toDate", id: "tdt", label:"To Date", seq : 3, default: this.toDate},
        { name:"role", id: 'roleId', label:"Role", seq : 4, default: this.selectedrolelistid.value},
        { name: "getInsights", id: "gis", label:"Get Insights", seq : 6}];
        this.getReportList();
        this.getRoutineReports(this.HCselected);
        this.buildForm();
        this.getActivityCategory();
    }
    public buildForm() {
        this.reportForm = this.fb.group({
            fromDate: [this.fromDate ? this.fromDate : ''],
            toDate: [this.toDate ? this.toDate : ''],
        });
    }
    getReportList() {
        let permissions = JSON.parse(localStorage.getItem('permission'));
        let menuItemsList = permissions['menuItems'].filter(res => res.code == "MN_RE");
        let submenusList =menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_RERO") : null;
        let menuId = submenusList['id'];
        let menulist = permissions['dropdown'].filter(res => res.parentId == menuId);
        this.reportList = menulist;
         const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
        if (firstSeqReport) {
            this.HCselected = firstSeqReport.code;
        }
    }
    getRoutineReports(id) {
        this.selectedReport.setValue(id)
        this.reportData = [];
        this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd');
        this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd');
        this.reportData['prevselected'] = this.HCselected;
        this.reportData.noRecords = false;
        this.reportData.loading = true;
        this.reportData['showTable'] = false;
        this.reportData['enableexcel'] = false;
        this.reportData['enablepdf'] = false;
        this.reportData['nullIdentifier'] = false;
        if (id == 'stf-routin-sumary') {
            this.validDate = this.validate(this.fromDate, this.toDate);
            this.CommonService.getRollList().subscribe(res=>    this.RoleList = res.results );
            if (!this.validDate) {
                this.reportData['invalidDate'] = true;
                this.reportData['loading'] = false;
                this.reportData['noRecords'] = true;
            } else {
                this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate + '&rlid='+ this.selectedrolelistid.value;
                this.CommonService.getReportData(id, this.param).subscribe(res => {
                    this.reportData['enableexcel'] = true;
                    if (res.results.statusCode == 200 && res.results.data != null) {
                        this.reportData['enablepdf'] = true;
                        this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':4,'gutterSize':'0px'};
                        this.reportData['tileInfo'] = [
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Staff','islist':false,'content':res.results.data['Card']['Total Staff']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Requests(Activities)','islist':false,'content':res.results.data['Card']['Total Request']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Completed','islist':false,'content':res.results.data['Card']['Completed']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Pending','islist':false,'content':res.results.data['Card']['Pending']}
                        ];
                        this.reportData['showCard'] = true;
                        this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'hrlReq','type':'bar','data':res.results.data['Hourly Request']['totreq'],'label': res.results.data['Hourly Request']['hrs'],'title':'Hourly Request Summary','showTitle':true,'barLabel': ['Requests']});
                        this.reportData['categoryTable'] = res.results.data['Categorywise Sum'];
                        this.reportData['catTableCol'] =[];
                        this.reportData['TableColumns'] = [];
                        this.reportData['showCatTable'] = false;
                        if(this.reportData['categoryTable'].length > 0){
                            this.reportData['catTableCol'] = Object.keys(this.reportData['categoryTable'][0]);
                            this.reportData['showCatTable'] = true;
                        }
                        this.reportData['Table'] = res.results.data['Table data'];
                        this.reportData['showTable'] = true;
                        this.reportData['excelData'] = [];
                        this.reportData['excelData'][0] = this.reportData['Table'];
                        this.reportData['excelData'][1] = [];
                        this.reportData['excelData'][2] = [];
                        for (let i = 0; i < this.reportData['Table'].length; i++) {
                            for (let j = 0; j < this.reportData['Table'][i]['children'].length; j++) {
                                this.reportData['excelData'][1].push(Object.assign({}, this.reportData['excelData'][0][i].children[j], this.reportData['excelData'][0][i]))
                                for(let k = 0; k < this.reportData['Table'][i]['children'][j]['children'].length; k++){
                                    this.reportData['excelData'][2].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j],this.reportData['excelData'][0][i]['children'][j].children[k]));
                                }
                            }
                        }
                    }
                });
                this.reportData['loading'] = false;
            }

        } else if (id == 'pat-routin-sumary') {
            this.validDate = this.validate(this.fromDate, this.toDate);
            if (!this.validDate) {
                this.reportData['invalidDate'] = true;
                this.reportData['loading'] = false;
                this.reportData['noRecords'] = true;
            } else {
                if(this.patientId.value){
                    this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate+ '&pid=' + this.patientId.value;
                } else{
                    this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
                }
                this.CommonService.getReportData(id, this.param).subscribe(res => {
                    this.reportData['loading'] = false;
                    this.reportData['enableexcel'] = true;
                    this.reportData['enablepdf'] = true;
                    if (res.results.statusCode == 200 && res.results.data != null) {
                        this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':5,'gutterSize':'0px'};
                        this.reportData['tileInfo'] = [
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Patients','islist':false,'content':res.results.data['Card']['Total Patients']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Staff','islist':false,'content':res.results.data['Card']['Total Staff']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Total Requests(Activities)','islist':false,'content':res.results.data['Card']['Total Request']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Completed','islist':false,'content':res.results.data['Card']['Completed']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Pending','islist':false,'content':res.results.data['Card']['Pending']}
                        ];
                        this.reportData['showCard'] = true;
                        this.ChartService.drawChart({'id':this.selected['selectedId'],'canvasId':'hrlReq','type':'bar','data':res.results.data['Hourly Request']['totreq'],'label': res.results.data['Hourly Request']['hrs'],'title':'Hourly Request Summary','showTitle':true,'barLabel': ['Requests']});
                        this.reportData['categoryTable'] = res.results.data['Categorywise Sum'];
                        this.reportData['catTableCol'] =[];
                        this.reportData['TableColumns'] = [];
                        this.reportData['showCatTable'] = false;
                        if(this.reportData['categoryTable'].length > 0){
                            this.reportData['catTableCol'] = Object.keys(this.reportData['categoryTable'][0]);
                            this.reportData['showCatTable'] = true;
                        }
                        this.reportData['Table'] = res.results.data['Table data'];
                        this.reportData['showTable'] = true;
                        this.reportData['excelData'] = [];
                        this.reportData['excelData'][0] = this.reportData['Table'];
                        this.reportData['excelData'][1] = [];
                        this.reportData['excelData'][2] = [];
                        for (let i = 0; i < this.reportData['Table'].length; i++) {
                            for (let j = 0; j < this.reportData['Table'][i]['children'].length; j++) {
                                this.reportData['excelData'][1].push(Object.assign({}, this.reportData['excelData'][0][i].children[j], this.reportData['excelData'][0][i]))
                                for(let k = 0; k < this.reportData['Table'][i]['children'][j]['children'].length; k++){
                                    this.reportData['excelData'][2].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j],this.reportData['excelData'][0][i]['children'][j].children[k]));
                                }
                            }
                        }
                    }
                });
            }
        } else if(id == 'tasks-bywrd'){
            this.validDate = this.validate(this.fromDate, this.toDate);
            if (!this.validDate) {
                this.reportData['invalidDate'] = true;
                this.reportData['loading'] = false;
                this.reportData['noRecords'] = true;
            } else{
                this.selectedLocTemp = this.selectedLocation.value;
                this.param = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&lid=' + this.selectedLocation.value;
                this.CommonService.getReportData(id, this.param).subscribe(res => {
                    this.reportData['loading'] = false;
                    this.reportData['enableexcel'] = true;
                    if (res.results.statusCode == 200 && res.results.data != null) {
                        this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':3,'gutterSize':'0px'};
                        this.reportData['tileInfo'] = [
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'No.of Tasks','islist':false,'content':res.results.data['Card']['No.of Tasks']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Tasks Completed','islist':false,'content':res.results.data['Card']['Tasks Completed']},
                            // {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT : Scheduled to Start','islist':false,'content':res.results.data['Card']['TAT : Scheduled to Start']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT : Start to Complete','islist':false,'content':res.results.data['Card']['TAT : Start to Complete']}
                        ];
                        this.reportData['showCard'] = true;
                        this.reportData['Table'] = res.results.data['Table Data'];
                        this.reportData['showTable'] = true;
                        if(this.reportData['Table'].length > 0){
                            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                            this.reportData['showTable'] = true;
                          }
                    }
                });
            }
        } else if(id == 'task-activity-compliance'){
            this.validDate = this.validate(this.fromDate, this.toDate);
            if (!this.validDate) {
                this.reportData['invalidDate'] = true;
                this.reportData['loading'] = false;
                this.reportData['noRecords'] = true;
            } else {
                this.param = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
                this.CommonService.getReportData(id, this.param).subscribe(res => {
                    this.reportData['loading'] = false;
                    this.reportData['enableexcel'] = true;
                    if (res.results.statusCode == 200 && res.results.data != null){
                        this.reportData['Table'] = res.results.data['Table data'];
                        this.reportData['showTable'] = true;
                        this.reportData['excelData'] = [];
                        this.reportData['excelData'][0] = this.reportData['Table'];
                        this.reportData['excelData'][1] = [];
                        this.reportData['excelData'][2] = [];
                        for (let i = 0; i < this.reportData['Table'].length; i++) {
                            for (let j = 0; j < this.reportData['Table'][i]['children'].length; j++) {
                                this.reportData['excelData'][1].push(Object.assign({}, this.reportData['excelData'][0][i].children[j], this.reportData['excelData'][0][i]))
                                for(let k = 0; k < this.reportData['Table'][i]['children'][j]['children'].length; k++){
                                    this.reportData['excelData'][2].push(Object.assign({},this.reportData['excelData'][0][i],this.reportData['excelData'][0][i].children[j],this.reportData['excelData'][0][i]['children'][j].children[k]));
                                }
                            }
                        }
                    }
                });
            }
        } else if(id == 'tasks-bycategory'){
            this.validDate = this.validate(this.fromDate, this.toDate);
            if (!this.validDate) {
                this.reportData['invalidDate'] = true;
                this.reportData['loading'] = false;
                this.reportData['noRecords'] = true;
            } else{
                this.selectedTempCat = this.selectedCategory.value;
                this.selectedTempTask = this.selectedTask.value;
                if(this.selectedCategory.value[0]?.indexOf('All') > -1) {
                    this.selectedTempCat = 'All';
                }
                if(this.selectedTask.value[0]?.indexOf('All') > -1) {
                    this.selectedTempTask = 'All';
                }
                // if(this.allCatSelected.selected){
                //     this.selectedTempCat = 'All';
                // }
                // if(this.allTaskSelected && this.allTaskSelected.selected){
                //     this.selectedTempTask = 'All';
                // }
                if(this.selectedCategory.value){
                    this.param = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate + '&ctypes=' + this.selectedTempCat + '&tids=' + this.selectedTempTask;
                } else{
                    this.param = '/fdt=' + this.fromDate+ '&tdt=' + this.toDate;
                }
                this.CommonService.getReportData(id, this.param).subscribe(res => {
                    this.reportData['loading'] = false;
                    this.reportData['enableexcel'] = true;
                    if (res.results.statusCode == 200 && res.results.data != null) {
                        this.reportData['cardInfo'] = {'width':'100%', 'height':'140px','col':3,'gutterSize':'0px'};
                        this.reportData['tileInfo'] = [
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'No.of Tasks','islist':false,'content':res.results.data['Card']['No.of Tasks']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'Tasks Completed','islist':false,'content':res.results.data['Card']['Tasks Completed']},
                            // {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT : Scheduled to Start','islist':false,'content':res.results.data['Card']['TAT : Scheduled to Start']},
                            {'rowspan':1,'colspan':1,'showHeader':true,'header':'TAT : Start to Complete','islist':false,'content':res.results.data['Card']['TAT : Start to Complete']}
                        ];
                        this.reportData['showCard'] = true;
                        this.reportData['Table'] = res.results.data['Table Data'];
                        this.reportData['showTable'] = true;
                        if(this.reportData['Table'].length > 0){
                            this.reportData['TableColumns'] = Object.keys(this.reportData['Table'][0]);
                            this.reportData['showTable'] = true;
                          }
                    }
                });
            }
        }
        let selectedData  = this.reportList.filter(res=> res.link === id);
        this.selected = { 'selectedId': id, 'fromDate': this.fromDate, 'todate': this.toDate, 'name':selectedData[0].name };
    }
    getActivityCategory(){
        this.CommonService.getAppTermsLink('ROU-TSK').subscribe(res => {
            this.activityCategoryList = res.results;
        });
    }
    getPatientsCheck(key) {
        this.patientSub.next(key);
    }        
    getPatients(key){
        if (key.target.value !== "") {
          let val = key.target.value;
          if (val.length >= 2) {
            this.CommonService.searchPatient(key.target.value).subscribe((res) => {
              this.patientList = res.results.filter(res => res.mainidentifier != null);
              this.setPatientName(val);
            });
          } else {
            this.patientList = [];
          }
        } else {
          this.patientList = [];
          this.setPatientName(null);
        }
    }
    setPatientName(id){
        this.patientId.setValue(id);
    }
    getTaskActivity() {
        if(this.allCatSelected.selected){
            this.reportService.getTaskByCategory('ROU-TSK').subscribe(res => {
                this.taskActivitiesList = res.results;
                this.enableTask = true;
            });
        } else if(this.selectedCategory.value.length>0){
            this.reportService.getTaskByCategory('ROU-TSK', this.selectedCategory.value).subscribe(res => {
                this.taskActivitiesList = res.results;
                this.enableTask = true;
            });
        }
      }
    getLocationlist(id) {
        if(id){
          let searchList = '';
          searchList += id.target.value;
          if (searchList.length >= 2) {
            this.configurationService.getLocationData(id.target.value).subscribe(res => {
              if(res.results.length == 0){
              }
              this.locationlist = res.results;
            });
          } else {
            this.selectedLocation.setValue(null)
            this.locationlist = [];
          }
        } else{
            this.selectedLocation.setValue(null)
            this.locationlist = [];
        }
    }
    selectedTaskCategory(value){
        this.enableTask = false;
        this.selectedTask.patchValue([]);
        if(!value){
            this.getTaskActivity();
        }
    }
    setLocationID(id){
        this.selectedLocation.setValue(id)
        this.locationlist = [];
    }
    setrlidID(id){
        this.selectedrolelistid.setValue(id)
     }
    onCategoryChange(value){
        if(value){
            if (this.allCatSelected.selected){
                this.selectedCategory
                    .patchValue([...this.activityCategoryList.map(item => item.code), 0]);
                    this.allCatSelected.select();
            } else{
                this.selectedCategory.patchValue([]);
                this.allCatSelected.deselect();
            }
        }
    }
    onTaskChange(value){
        if(value){
            if (this.allTaskSelected.selected){
                this.selectedTask
                    .patchValue([...this.taskActivitiesList.map(item => item.id), 0]);
                    this.allTaskSelected.select();
            } else{
                this.selectedTask.patchValue([]);
                this.allTaskSelected.deselect();
            }
        }
    }
    validate(sDate: string, eDate: string) {
        this.validDate = true;
        if ((sDate != null && eDate != null) && (eDate < sDate)) {
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
    downloadExcel() {
        let excelData: any;
        let name = this.selected['name'];
        let transpose = false;
        if (this.reportData.length || this.reportData != null) {
            if (this.selected['selectedId'] == 'stf-routin-sumary') {
                excelData = [];
                excelData[0] = this.reportData['excelData'];
                excelData[1] = ['staff-details', 'routine-details','staff-routine-summary'];
            } else if(this.selected['selectedId'] == 'pat-routin-sumary'){
                excelData = [];
                excelData[0] = this.reportData['excelData'];
                excelData[1] = ['patient-details', 'routine-details','patient-routine-summary'];
            } else if(this.selected['selectedId'] == 'task-activity-compliance'){
                excelData = [];
                excelData[0] = this.reportData['excelData'];
                excelData[1] = ['staff-details', 'routine-details','staff-routine-summary'];
            } else{
                excelData = this.reportData['Table'];
            }
        } else {
            excelData = this.reportData['Table'];
        }
        this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['todate'], this.selected['selectedId']);
    }

    downloadPDF() {
        let pdfData : any;
        if (this.reportData.length || this.reportData != null) {
            let chartImage = [];
            let name: string;
            let addInfo : any;
            pdfData=this.reportData;
            if (this.selected['selectedId'] == 'pat-routin-sumary') {
                name = 'Patient Routine Summary';
                chartImage = [document.getElementById('hrlReq')];
                addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
            } else if (this.selected['selectedId'] == 'stf-routin-sumary') {
                name = 'Staff Routine Summary';
                chartImage = [document.getElementById('hrlReq')];
                addInfo ={"fromDate":this.selected['fromDate'],"toDate":this.selected['todate']};
            } else {
                name = this.selected['selectedId'];
            }
            this.PdfService.exportAsPdfFile(pdfData, this.reportData['TableColumns'], name, this.selected['todate'], this.selected['selectedId'], chartImage,addInfo);
        } else {
            pdfData = [];
        }
    }

    reportHeaderAction(event) {
        if(event.key === 'report') {
          this.HCselected = event.data.link;
          this.HCselectedCode = event.data.code;
          this.fromDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');;
          this.toDate = this.datepipe.transform(this.today, 'yyyy-MM-dd');
          this.filterInputs = [{name:'report', id:'reportId', label: 'Analytical Reports', seq: 1, default: this.HCselectedCode, routine: true},
          { name: "getInsights", id: "gis", label:"Get Insights", seq : 6}];
          if(this.HCselected == 'stf-routin-sumary' || this.HCselected == 'pat-routin-sumary' || this.HCselected == 'tasks-bywrd' || this.HCselected == 'tasks-bycategory' || this.HCselected == 'task-activity-compliance') {
            this.filterInputs.push({ name: "fromDate", id: "fdt", label:"From Date", seq : 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')},
            { name: "toDate", id: "tdt", label:"To Date", seq : 3, default: this.datepipe.transform(this.toDate, 'yyyy-MM-dd')});
          } else if(this.HCselected != 'stf-routin-sumary' && this.HCselected != 'pat-routin-sumary' && this.HCselected != 'tasks-bywrd' && this.HCselected != 'tasks-bycategory' && this.HCselected != 'task-activity-compliance') {
            this.filterInputs.push({ name: "reportDate", id: "tdt", label:"Report Date", seq : 2, default: this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')});
          } else {
            this.filterInputs = [{name:'report', id:'reportId', label: 'Analytical Report', seq: 1, default: this.HCselected, routine: true},
            { name: "getInsights", id: "gis", label:"Get Insights", seq : 6}];
          }
        } else if(event.key === 'fromDate') {
          this.fromDate = event.data;
          const from = this.filterInputs.filter(x => x.name === 'fromDate');
          if(from?.length !== 0) {
            this.filterInputs = this.filterInputs.filter(x => x.name !== 'fromDate');
            this.filterInputs.push({ name: "fromDate", id: "fdt", label:"From Date", seq : 2, default: this.datepipe.transform(event.data, 'yyyy-MM-dd')});
          }
          const report = this.filterInputs.filter(x => x.name === 'reportDate');
          if(report?.length !== 0) {
            this.filterInputs = this.filterInputs.filter(x => x.name !== 'reportDate');
            this.filterInputs.push({name: "reportDate", id: "tdt", label:"Report Date", seq : 2, default: this.datepipe.transform(event.data, 'yyyy-MM-dd')});
          }
        } else if(event.key === 'toDate') {
          this.toDate = event.data;
          this.filterInputs = this.filterInputs.filter(x => x.name !== 'toDate');
          this.filterInputs.push({name: "toDate", id: "tdt", label:"To Date", seq : 3, default: this.datepipe.transform(event.data, 'yyyy-MM-dd')});
        } else if(event.key === 'location') {
          if(event.data !== null) {
            this.setLocationID(event.data.id);
            this.locationName = event.data.fullName;
          } else {
            this.locationName = null;
            this.selectedLocation.setValue(null);
          }
        } else if(event.key === 'role') {
            this.setrlidID(event.data);
        } else if(event.key === 'activity') {
            this.activityCategory = event.data;
            this.selectedCategory.patchValue([event.data]);
        } else if(event.key === 'task') {
            this.activityTask = event.data;
            this.selectedTask.patchValue([event.data]);
        } else if(event.key === 'patient') {
          if(event.data !== null) {
            this.setPatientName(event.data.id);
            this.patientName = event.data.firstName;
          } else {
            this.patientName = null;
            this.setPatientName(null);
          }
        } else if(event.key === 'getInsights' || event.key === 'refresh') {
          this.getRoutineReports(this.HCselected);
        } else if(event.key === 'excel') {
          this.downloadExcel();
        } else if(event.key === 'pdf') {
          this.downloadPDF();
        }
        if(this.HCselected == 'stf-routin-sumary') {
          this.filterInputs = this.filterInputs.filter(x => x.name !== 'role');
          this.filterInputs.push({name:"role", id: 'roleId', label:"Role", seq : 4, default: this.selectedrolelistid.value});
        } else if(this.HCselected == 'pat-routin-sumary') {
          this.filterInputs = this.filterInputs.filter(x => x.name !== 'patient');
          this.filterInputs.push({name:"patient", id: 'pid', label:"Patient Name", seq : 4, default: this.patientName});
        } else if(this.HCselected == 'tasks-bywrd') {
          this.filterInputs = this.filterInputs.filter(x => x.name !== 'location');
          this.filterInputs.push({name:"location", id: 'lid', label:"Location", seq : 4, default: this.locationName});
        } else if(this.HCselected == 'tasks-bycategory') {
           this.filterInputs = this.filterInputs.filter(x => x.name !== 'activity');
          if(this.activityCategory !== null) {
            this.filterInputs = this.filterInputs.filter(x => x.name !== 'task');
            this.filterInputs.push({name:"activity", id: 'ctype', label:"Activity Category", seq : 4, default: this.activityCategory},
            {name:"task", id: 'tid', label:"Task", seq : 4, default: this.activityTask});
          } else {
            this.filterInputs.push({name:"activity", id: 'ctype', label:"Activity Category", seq : 4, default: this.activityCategory});
          }
        }
    }
  fixClick() {
    console.log('')
  }    
}
