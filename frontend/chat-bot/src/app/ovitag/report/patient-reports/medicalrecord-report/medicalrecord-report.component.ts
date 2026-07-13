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
import { ExcelService, PdfService, CommonService, ChartService } from '../../../../shared';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import 'chartjs-plugin-datalabels';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-medicalrecord-report',
  templateUrl: './medicalrecord-report.component.html',
  styleUrls: ['./medicalrecord-report.component.scss']
})

export class MedicalrecordReportComponent implements OnInit {

  public reportForm: FormGroup;
  public date: any = new Date();
  public fromDate = this.datepipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  public toDate = this.datepipe.transform(this.date, 'yyyy-MM-dd');
  public facilityId = new FormControl();
  public patientSub : Subject<any> = new Subject();
  public MRfilter: any = [
    { completed: true, color: 'primary', name: 'Medical Record File Summary' },
    { completed: false, color: 'primary', name: 'Active Medical Records' },
    { completed: false, color: 'primary', name: 'Medical Record File Aging' },
    { completed: false, color: 'primary', name: 'Medical records Missing' }
  ]
  public selectedMRValue: any = 'Medical Record File Summary';
  public reportList: any;
  public reportData: any = [];
  public patientList: any = [];
  public selectedSpeciality: any = new FormControl();
  public searchType: any = new FormControl('uhid');
  public patientUhid: any = new FormControl(null);
  public Uhid: any = new FormControl();
  public selectedReport: any = new FormControl();
  public regionValue: string;
  public facilityList: any;
  public HCselected = 'mrfile-summary';
  public vitalParam: any = 'all';
  selectedLocation: any = new FormControl();
  selectedDoctor: any = new FormControl();
  selectedAge: any = new FormControl();
  public selectedFile: any = new FormControl();
  public selected: any;
  public chartImage: any;
  headercolor: string;
  bgcolor: string;
  pagebgcolor: string;
  validDate: any;
  today = new Date();
  public mrLocationList = [];
  public mrDoctorList = [];
  public mrAgeList = [];
  public eventDates: any [];
  public applyFilterValue: any = '';
  public fileIds: any = null;
  public eventDtEnable=false;
  public activate_btn: any = [];
  constructor(public datepipe: DatePipe, public PdfService: PdfService,
    public fb: FormBuilder, public ExcelService: ExcelService, public CommonService: CommonService, public ChartService: ChartService) {
    this.getReportList();
    this.activate_btn = this.CommonService.getActivePermission('button');
  }


  ngOnInit() {
    this.patientSub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getPatients(searchTextValue);
    });        
    this.getMedicalReports(this.HCselected);
    if ('userColor' in localStorage || 'userBgColor' in localStorage || 'userPageBgColor' in localStorage) {
      this.headercolor = localStorage.getItem('userColor');
      this.bgcolor = localStorage.getItem('userBgColor');
      this.pagebgcolor = localStorage.getItem('userPageBgColor');
    } else {
      this.headercolor = '#3f586a';
      this.bgcolor = '#ffffff';
      this.pagebgcolor = '#ffffff';
    }
    this.buildForm();
  }
  getReportList() {
    let permissions = JSON.parse(localStorage.getItem('permission'));
    let menuItemsList = permissions['menuItems'].filter(res => res.code == "MN_RE");
    let submenusList = menuItemsList[0]['subMenus'].filter(res => res.code == "MN_AIPTS");
    let submenus = menuItemsList ? this.CommonService.findMenuByCode(menuItemsList[0].subMenus, "MN_AIPTMR") : null;
    let tempId = submenus['id'];
    let replist = permissions['dropdown'].filter(res => res.parentId == tempId);
    this.reportList = replist;
     const firstSeqReport = this.reportList.filter(r => r.sequence != null).reduce( (m, c) => Number(c.sequence) < Number(m.sequence) ? c : m,this.reportList[0] ) ?? this.reportList[0];
      if (firstSeqReport) {
        this.HCselected = firstSeqReport.code;
      }
  }
  public buildForm() {
    this.reportForm = this.fb.group({
      fromDate: [this.fromDate ? this.fromDate : ''],
      toDate: [this.toDate ? this.toDate : ''],
    });
  }
  filterMRby() {
    let tempdata: any = [];
    if (this.reportData['Table_copy'].length) {
      tempdata = JSON.parse(JSON.stringify(this.reportData['Table_copy']));
      if (this.selectedLocation.value != null) {
        if (this.selectedLocation.value == 'All') {
          tempdata = tempdata;
        } else {
          tempdata = tempdata.filter(res => res['Lastseen location'] == this.selectedLocation.value);
        }
      }
      if (this.selectedDoctor.value != null) {
        if (this.selectedDoctor.value == 'All') {
          tempdata = tempdata;
        } else {
          tempdata = tempdata.filter(res => res['Requested doctor'] == this.selectedDoctor.value);
        }
      }
      if (this.selectedAge.value != null) {
        if (this.selectedAge.value == 'All') {
          tempdata = tempdata;
        } else {
          tempdata = tempdata.filter(res => res['Fileage'] == this.selectedAge.value);
        }
      }
    }
    this.reportData['Table'] = tempdata;
  }
  getMedicalReports(id) {
    this.selectedReport.setValue(id);
    this.fromDate = this.datepipe.transform(this.fromDate, 'yyyy-MM-dd')
    this.toDate = this.datepipe.transform(this.toDate, 'yyyy-MM-dd')
    this.reportData = {};
    this.reportData.noRecords = false;
    this.reportData.loading = true;
    this.reportData['showTable'] = false;
    this.reportData['showSecondTable'] = false;
    this.reportData['showCard'] = false;
    this.reportData['enableexcel'] = false;
    this.reportData['enablepdf'] = false;
    this.reportData['invalidDate'] = false;
    this.reportData['nullIdentifier'] = false;
    this.reportData['tableView'] = false;
    this.reportData['initialised'] = false;
    this.reportData['prevselected'] = this.HCselected;
    this.reportData['charts'] = [];
    this.patientList = [];
    this.selectedLocation.setValue(null)
    this.selectedDoctor.setValue(null)
    this.selectedAge.setValue(null)
    if (id == 'pat-mrid-list') {
      // this.validDate=this.validate(this.fromDate,this.toDate);
      // if(!this.validDate){
      //   this.reportData['invalidDate'] = true;
      //   this.reportData['loading'] = false;
      //   this.reportData['noRecords'] = true;
      // }else{
      this.reportData['param'] = '/fdt=' + this.toDate;
      this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
        console.log(res)
        this.reportData.loading = false;
        if (res.results.statusCode == 200) {
          this.reportData['fullData'] = res.results;
          this.reportData['totalTags'] = res.results.Aggregate.card['Total tags'];
          this.reportData['Medical Record File Summary'] = res.results['Medical Record File Summary'];
          this.reportData['Active Medical Records'] = res.results['Active Medical Records'];
          this.reportData['Medical Record File Aging'] = res.results['Medical Record File Aging'];
          this.reportData['Medical records Missing'] = res.results['Medical records Missing'];
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'tagStatusMR', 'type': 'pie', 'data': res.results.Aggregate.chart.data, 'label': res.results.Aggregate.chart.label, 'title': 'Request Status', 'showTitle': true });
          // this.ChartService.drawChart({'id':id,'canvasId':'locationMR','type':'pie','data':res.results.Aggregate.location.data,'label':res.results.Aggregate.location.label,'title':'Location','showTitle':true});
          // this.ChartService.drawChart({'id':id,'canvasId':'doctorMR','type':'pie','data':res.results.Aggregate.Doctor.data,'label':res.results.Aggregate.Doctor.label,'title':'Doctor','showTitle':true});
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'ageMR', 'type': 'pie', 'data': res.results.Aggregate.age.data, 'label': res.results.Aggregate.age.label, 'title': 'File Age', 'showTitle': true });
          this.mrLocationList = ['All', ...res.results.Aggregate.location.label];
          this.mrDoctorList = ['All', ...res.results.Aggregate.Doctor.label];
          this.mrAgeList = ['All', ...res.results.Aggregate.age.label];
          let selectedMR = this.MRfilter.find(res => res.completed == true)
          if (selectedMR == undefined) {
            this.MRfilter[0].completed = true;
            selectedMR = this.MRfilter[0];
          }
          this.reportData['Table_copy'] = this.reportData[selectedMR.name]
          this.reportData['Table'] = this.reportData['Table_copy'];
          this.reportData['TableColumns'] = [];
          if (this.reportData['Table'].length > 0) {
            this.reportData['TableColumns'] = Object.keys(this.reportData[selectedMR.name][0]);
            if (selectedMR.name == 'Medical records Missing') {
              this.reportData['TableColumns'].splice(this.reportData['TableColumns'].findIndex(res => res == 'floor_id'), 1)
            }
            this.reportData['showTable'] = true;
          }
          this.reportData['enableexcel'] = true;
          // this.reportData['enablepdf']=true;
          this.reportData['excelData'] = [];
          this.reportData['excelData'][0] = JSON.parse(JSON.stringify(this.reportData['Medical Record File Summary']));
          this.reportData['excelData'][1] = JSON.parse(JSON.stringify(this.reportData['Active Medical Records']));
          this.reportData['excelData'][2] = JSON.parse(JSON.stringify(this.reportData['Medical Record File Aging']));
          this.reportData['excelData'][3] = JSON.parse(JSON.stringify(this.reportData['Medical records Missing']));
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      })
      // }
    } else if (id == 'mrfile-age') {
      this.reportData['param'] = '';
      this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
        this.reportData.loading = false;
        if (res.results.statusCode == 200) {
          this.reportData['fullData'] = res.results;
          // this.mrLocationList = ['All', ...res.results.MRFileage.location.label];
          this.mrLocationList.push('All');
          this.mrDoctorList = ['All', ...res.results.MRFileage.Doctor.label];
          this.mrAgeList = ['All', ...res.results.MRFileage.age.label];
          this.reportData['Table_copy'] = res.results.MRFileage.tabledata;
          this.reportData['Table'] = this.reportData['Table_copy'];
          this.reportData['TableColumns'] = [];
          if (this.reportData['Table'].length > 0) {
            this.reportData['TableColumns'] = Object.keys(res.results.MRFileage.tabledata[0]);
            this.reportData['showTable'] = true;
          }
          for (let i = 0; i < this.reportData['Table_copy'].length; i++) {
            if (this.mrLocationList.find(e => e === this.reportData['Table_copy'][i]['Lastseen location']) == undefined) {
              this.mrLocationList.push(this.reportData['Table_copy'][i]['Lastseen location']);
            }
          }
          this.reportData['enableexcel'] = true;
          this.reportData['excelData'] = JSON.parse(JSON.stringify(res.results.MRFileage.tabledata));
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      })
    } else if (id == 'mrfile-missing') {
      this.reportData['param'] = '';
      this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
        console.log(res)
        this.reportData.loading = false;
        if (res.results.statusCode == 200) {
          this.reportData['fullData'] = res.results;
          this.reportData['Table'] = res.results.MRFilemissing;
          this.reportData['TableColumns'] = [];
          if (this.reportData['Table'].length > 0) {
            this.reportData['TableColumns'] = Object.keys(res.results.MRFilemissing[0]);
            this.reportData['showTable'] = true;
          }
          this.reportData['enableexcel'] = true;
          this.reportData['excelData'] = JSON.parse(JSON.stringify(res.results.MRFilemissing));
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      })
    } else if (id == 'mrfile-status') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
          console.log(res)
          this.reportData.loading = false;
          if (res.results.statusCode == 200) {
            this.reportData['fullData'] = res.results;
            this.reportData['Table'] = res.results.mrfilestatus;
            this.reportData['TableColumns'] = [];
            if (this.reportData['Table'].length > 0) {
              this.reportData['TableColumns'] = Object.keys(res.results.mrfilestatus[0]);
              this.reportData['showTable'] = true;
            }
            this.reportData['enableexcel'] = true;
            this.reportData['excelData'] = JSON.parse(JSON.stringify(res.results.mrfilestatus));
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        })
      }
    } else if (id == 'mrfile-loc-history') {
        let param;
        if (this.fileIds == null || this.fileIds == '' || this.fileIds == undefined) {
          param = '/uid=' + this.patientUhid.value;
        } else {
          param = '/fileIds=' + this.fileIds ;
        }
        this.reportData['param'] = param;
        this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
          this.reportData.loading = false;
          if (res.results.statusCode == 200) {
            if(this.fileIds == null || this.fileIds == '' || this.fileIds == undefined){
              this.eventDates= res.results.data['table data'];
              this.eventDtEnable = true;
            } else{
              if (this.patientUhid.value == null || this.patientUhid.value == '') {
                this.reportData['patientId'] = null;
                this.reportData['patientName'] = null;
              } else {
                this.reportData['patientId'] = res.results.data['Location History'][0]['UHID'];
                this.reportData['patientName'] = res.results.data['Location History'][0]['Name'];
              }
              this.reportData['fullData'] = res.results;
              this.reportData['Table'] = res.results.data['Location History'];
              this.reportData['TableColumns'] = [];
              if (this.reportData['Table'].length > 0) {
                if (this.patientUhid.value == null || this.patientUhid.value == '') {
                  this.reportData['TableColumns'] = ["Event Date", "Name", "UHID", "Volume", "Status", "Serial Number", "From Date", "To Date", "Location Name", "Floor Name"];
                } else {
                  this.reportData['TableColumns'] = ["Event Date", "Volume", "Status", "Serial Number", "From Date", "To Date", "Location Name", "Floor Name"];
                }
                this.reportData['showTable'] = true;
              }
              // if(this.reportData['Table'].length > 0){
              //   this.reportData['TableColumns'] = Object.keys(res.results.mrfilestatus[0]);
              //   this.reportData['showTable'] = true;
              // }
              this.reportData['showTable'] = true;
              this.reportData['enableexcel'] = true;
              this.reportData['excelData'] = JSON.parse(JSON.stringify(res.results.data['Location History']));
          }
          } else {
            this.reportData.noRecords = true;
            this.reportData.loading = false;
          }
        })
    } else if (id == 'mrfile-summary') {
      this.reportData['param'] = '';
      this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
        this.reportData.loading = false;
        if (res.results.statusCode == 200) {
          this.reportData['fullData'] = res.results;
          this.reportData['avgTats'] = res.results.Summary.card['Avg tats'];
          this.reportData['totalTags'] = res.results.Summary.card['Total tags'];
          this.reportData['totalReq'] = res.results.Summary.card['Total reqs'];
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'tagStatusMRsum', 'type': 'pie', 'data': res.results.Summary.status_chart.data, 'label': res.results.Summary.status_chart.label, 'title': 'Request Status', 'showTitle': true });
          this.ChartService.drawChart({ 'id': id, 'canvasId': 'ageMRsum', 'type': 'pie', 'data': res.results.Summary.age_chart.data, 'label': res.results.Summary.age_chart.label, 'title': 'File Age', 'showTitle': true });
          this.reportData['Table'] = res.results.Summary['table data'];
          this.reportData['TableColumns'] = [];
          if (this.reportData['Table'].length > 0) {
            this.reportData['TableColumns'] = Object.keys(res.results.Summary['table data'][0]);
            this.reportData['showTable'] = true;
          }
          this.reportData['enableexcel'] = true;
          this.reportData['excelData'] = JSON.parse(JSON.stringify(res.results.Summary['table data']));
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      })
      // }
    } else if (id == 'mrtag-status') {
      this.reportData['param'] = '';
      this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
        this.reportData.loading = false;
        if (res.results.statusCode == 200) {
          this.reportData['fullData'] = res.results.data;
          this.reportData['Table'] = this.reportData['fullData']['tabledata'];
          this.reportData['TableColumns'] = [];
          if (this.reportData['Table'].length > 0) {
            this.reportData['TableColumns'] = Object.keys(this.reportData['fullData']['tabledata'][0]);
            this.reportData['showTable'] = true;
          }
          this.reportData['enableexcel'] = true;
        } else {
          this.reportData.noRecords = true;
          this.reportData.loading = false;
        }
      })
    } else if (id == 'mrfile-daily-status') {
      this.validDate = this.validate(this.fromDate, this.toDate);
      if (!this.validDate) {
        this.reportData['invalidDate'] = true;
        this.reportData['loading'] = false;
        this.reportData['noRecords'] = true;
      } else {
        this.reportData['param'] = '/fdt=' + this.fromDate + '&tdt=' + this.toDate;
        this.CommonService.getReportData(id, this.reportData['param']).subscribe(res => {
          this.reportData.loading = false;
          if (res.results.statusCode == 200) {
            this.reportData['enableexcel'] = true;
            this.reportData['showCard'] = true;
            this.reportData['cardInfo'] = { 'width': '100%', 'height': '130px', 'col': 7, 'gutterSize': '0px' };
            this.reportData['tileInfo'] = [
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Total Requests', 'content': res.results.mrfilestatus.card['Total Requests'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Request Created in Medmantra', 'content': res.results.mrfilestatus.card['Request Created in MM'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Request Created in Trackerwave', 'content': res.results.mrfilestatus.card['Request Created in TWave'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Dispatched', 'content': res.results.mrfilestatus.card['Dispatched'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Received', 'content': res.results.mrfilestatus.card['Received'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Pending', 'content': res.results.mrfilestatus.card['Pending'] },
              { 'rowspan': 1, 'colspan': 1, 'showHeader': true, 'header': 'Medmantra Used Request', 'content': res.results.mrfilestatus.card['Dispatched MM request'] }];
            this.reportData['CardTable'] = [res.results.mrfilestatus.card];
            this.reportData['DispatchedTable'] = res.results.mrfilestatus.Dispatched.Children;
            this.reportData['DispatchTblCol'] = [];
            this.reportData['ReceivedTable'] = res.results.mrfilestatus.Received.Children;
            this.reportData['RecTblCol'] = [];
            this.reportData['PendingTable'] = res.results.mrfilestatus['Pending Request']['Children'];
            this.reportData['PendingTblCol'] = [];
            if (this.reportData['DispatchedTable'].length > 0) {
              this.reportData['DispatchTblCol'] = Object.keys(this.reportData['DispatchedTable'][0]);
              this.reportData['showDisTable'] = true;
            }
            if (this.reportData['ReceivedTable'].length > 0) {
              this.reportData['RecTblCol'] = Object.keys(this.reportData['ReceivedTable'][0]);
              this.reportData['showRecTable'] = true;
            }
            if (this.reportData['PendingTable'].length > 0) {
              this.reportData['PendingTblCol'] = Object.keys(this.reportData['PendingTable'][0]);
              this.reportData['showPenTable'] = true;
            }
            this.reportData['excelData'] = [];
            this.reportData['excelData'][0] = this.reportData['CardTable'];
            this.reportData['excelData'][1] = this.reportData['DispatchedTable'];
            this.reportData['excelData'][2] = this.reportData['ReceivedTable'];
            this.reportData['excelData'][3] = this.reportData['PendingTable'];
          }
        })
      }

    }
    this.selected = { 'selectedId': id, 'fromDate': this.fromDate, 'todate': this.toDate, 'Uhid': this.patientUhid.value };
  }
  openedChange(event){
    if(!event){
      if(this.selectedFile.value.length){
        this.fileIds = this.selectedFile.value.toString();
      } else{
        this.fileIds = null;
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
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }
  toggleChange(val) {
    this.searchType.setValue(val)
  }
  clearUhid(){
    this.patientUhid.setValue(null);
    this.eventDtEnable = false;
  }
  getPatientsCheck(key) {
    this.patientSub.next(key);
  }  
  getPatients(key) {
    if (key.target.value !== "" && this.searchType.value == 'name') {
      let val = key.target.value;
      if (val.length >= 2) {
        this.CommonService.searchPatient(key.target.value).subscribe((res) => {
          this.patientList = res.results.filter(res => res.mainidentifier != null);
        });
      }
    } else if (key.target.value !== "" && this.searchType.value == 'uhid') {
      this.patientUhid.setValue(key.target.value)
    } else {
      this.patientList = [];
      this.patientUhid.setValue(null)
    }
  }
  setPatientName(id) {
    this.patientUhid.setValue(id)
    this.fileIds = '';
    this.eventDtEnable = false;
  }
  filterBySelected(event) {
    if (event.completed) {
      this.MRfilter.forEach(t => {
        if (t.name != event.name) {
          t.completed = false;
        }
      });
      this.selectedMRValue = event.name;
      this.selectedLocation.setValue(null)
      this.selectedDoctor.setValue(null)
      this.selectedAge.setValue(null)
      this.reportData['Table_copy'] = this.reportData[event.name]
      this.reportData['Table'] = this.reportData['Table_copy']
      this.reportData['TableColumns'] = [];
      if (this.reportData['Table'].length > 0) {
        this.reportData['TableColumns'] = Object.keys(this.reportData[event.name][0]);
        if (event.name == 'Medical records Missing') {
          this.reportData['TableColumns'].splice(this.reportData['TableColumns'].findIndex(res => res == 'floor_id'), 1)
        }
        this.reportData['showTable'] = true;
      }
    }
  }
  downloadExcel() {
    let excelData: any;
    let name = '';
    let transpose = false;
    if (this.reportData.length || this.reportData != null) {
      name = name + this.selected['selectedId'];
      excelData = this.reportData['Table'];
      if (this.selected['selectedId'] == 'pat-mrid-list') {
        name = 'Medical Record Files report'
        excelData = [];
        excelData[0] = this.reportData['excelData'];
        for (let i = 0; i < excelData[0][3].length; i++) {
          delete excelData[0][3][i]['floor_id']
        }
        excelData[1] = ['Medical Record File Summary', 'Active Medical Records', 'Medical Record File Aging', 'Medical records Missing']
      } else if (this.selected['selectedId'] == 'mrfile-summary') {
        name = 'MRD Summary Report'
        excelData = this.reportData['excelData'];
      } else if (this.selected['selectedId'] == 'mrfile-age') {
        name = 'MRD File Aging Report'
        excelData = this.reportData['excelData'];
        for (let i = 0; i < excelData.length; i++) {
          delete excelData[i]['floor_id']
        }
      } else if (this.selected['selectedId'] == 'mrfile-missing') {
        name = 'MRD Missing Report'
        excelData = this.reportData['excelData'];
        for (let i = 0; i < excelData.length; i++) {
          delete excelData[i]['floor_id']
        }
      } else if (this.selected['selectedId'] == 'mrfile-status') {
        name = 'MRD Status Report'
        excelData = this.reportData['excelData'];
      } else if (this.selected['selectedId'] == 'mrfile-loc-history') {
        name = 'MRD Location History'
        excelData = this.reportData['excelData'];
        for (let i in excelData) {
          delete excelData[i]['tag_value']
        }
      } else if (this.selected['selectedId'] == 'mrtag-status') {
        name = 'MRD Tag Status';
        this.selected['fromDate'] = this.datepipe.transform(this.date, 'yyyy-MM-dd');
      } else if (this.selected['selectedId'] == 'mrfile-daily-status') {
        name = 'MRD Daily File Status';
        excelData = [];
        excelData[0] = this.reportData['excelData'];
        excelData[1] = ['Summary', 'Dispatched', 'Received', 'Pending Request'];
      }
      this.ExcelService.exportAsExcelFile(excelData, name, transpose, this.selected['fromDate'], this.selected['selectedId']);
    } else {
      excelData = [];
    }
  }
  fixClick() {
    console.log('')
  }
}
