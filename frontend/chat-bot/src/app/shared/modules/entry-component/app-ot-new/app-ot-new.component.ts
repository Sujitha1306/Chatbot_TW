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

import { Component, HostListener, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService, ConfigurationService } from '../../../services';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { ChartType } from 'angular-google-charts';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-ot-new',
  templateUrl: './app-ot-new.component.html',
  styleUrls: ['./app-ot-new.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppOtNewComponent implements OnInit {

  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    this.dataSource.paginator = value;
  }    
  @ViewChild(MatSort)
  set sort(value: MatSort) {
    this.dataSource.sort = value;
  }
  
  patTableColumns: string[] = ['Activity','Location','Status','Start','End','Duration (hh:mm:ss)','Wait Time (hh:mm:ss)'];
  assetTableColumns: string[] = ['Asset Name','Location','Status','Start Time','End Time','Duration (hh:mm)'];
  staffTableColumns: string[] = ['Staff','Location','Start Time','End Time','Duration (hh:mm)'];
  tableColumns: string[] = [...this.patTableColumns];
  public headerName = "Patient Summary";
  public enableSidebar = false;
  public enablePatInfo = true;
  public events = [];
  public patientDetails : any;
  patientSummeryId: any = null;
  currentYear = new Date().getFullYear();
  selection = new SelectionModel<any>(true, []);
  isTimeExceed = false;
  ipTest = {};
  public planDetailForm : FormGroup;
  public visitTypeId = null;
  scheduleInputData = {
      'statusKey': 'TW-AOT',
      'data': {
        'id': this.data.data?.visit_id,
        'patientId': this.data.data?.patientId,
        'workflowTypeId': 'WF-OT',
        'date': this.data.data?.scheduleStartTime,
        'isRefresh': true,
        'visitType': 'VT-IP',
        'visitEvent': 'VE-OT',
        'mainidentifer': this.data.data?.uhid,
        'eventDetails': this.data?.data?.eventDetails,
        'startTime': this.data.data?.scheduleStartTime,
        'endTime': this.data.data?.scheduleEndTime,
        'isActive': true,
        'visitEventId': this.data.data?.visitEventId
      }
    }

chartType = ChartType.Timeline;
columns = [
  { type: 'string', id: 'Name' },
  { type: 'string', id: 'Status' },
  { type: 'date', id: 'Start' },
  { type: 'date', id: 'End' }
];
chartData = [
  ['Colonoscopy', 'Off', new Date(2024, 8, 16, 9, 0, 0), new Date(2024, 8, 16, 11, 0, 0),],
    ['Colonoscopy', 'Idle', new Date(2024, 8, 16, 11, 0, 0), new Date(2024, 8, 16, 13, 0, 0)],
    ['Colonoscopy', 'On', new Date(2024, 8, 16, 13, 0, 0), new Date(2024, 8, 16, 15, 0, 0)],
    ['Colonoscopy', 'Off', new Date(2024, 8, 16, 16, 0, 0), new Date(2024, 8, 16, 18, 0, 0),],

    ['Monitoring', 'Off', new Date(2024, 8, 16, 9, 0, 0), new Date(2024, 8, 16, 11, 0, 0)],
    ['Monitoring', 'Idle', new Date(2024, 8, 16, 11, 0, 0), new Date(2024, 8, 16, 13, 0, 0)],
    ['Monitoring', 'On', new Date(2024, 8, 16, 13, 0, 0), new Date(2024, 8, 16, 17, 0, 0)],

    ['X-Ray', 'Off', new Date(2024, 8, 16, 9, 0, 0), new Date(2024, 8, 16, 11, 0, 0)],
    ['X-Ray', 'Idle', new Date(2024, 8, 16, 11, 0, 0), new Date(2024, 8, 16, 13, 0, 0)],
    ['X-Ray', 'On', new Date(2024, 8, 16, 13, 0, 0), new Date(2024, 8, 16, 17, 0, 0)]
];
options = {};
statusColors = {
  OFF: '#b0bec5',  
  InUSE: '#ff8a65',    
  SLEEP: '#42a5f5'
};

staffChartData = [
  ['StaffA', 'Shift 1', new Date(2024, 8, 25, 9, 0), new Date(2024, 8, 25, 10, 30)],
  ['StaffA', 'Shift 2', new Date(2024, 8, 25, 12, 30), new Date(2024, 8, 25, 14, 30)],
  ['StaffA', 'Shift 3', new Date(2024, 8, 25, 17, 0), new Date(2024, 8, 25, 19, 0)],
  ['StaffB', 'Shift 1', new Date(2024, 8, 25, 10, 0), new Date(2024, 8, 25, 11, 30)],
  ['StaffB', 'Shift 2', new Date(2024, 8, 25, 15, 0), new Date(2024, 8, 25, 17, 0)],
  ['StaffC', 'Shift 1', new Date(2024, 8, 25, 9, 0), new Date(2024, 8, 25, 21, 0)],
  ['StaffD', 'Shift 1', new Date(2024, 8, 25, 13, 0), new Date(2024, 8, 25, 15, 30)],
  ['StaffD', 'Shift 2', new Date(2024, 8, 25, 18, 0), new Date(2024, 8, 25, 21, 0)]
];
assetDisplayedColumns: string[] = ['Device ID','Asset Name','Asset Serial Number','Start Time','End Time','Duration'];
StaffDisplayedColumns: string[] = ['Device ID','Name','Employee ID','Role','Start Time','End Time','Duration'];
iconHeader = [];
iconColumn = [];
sortColumn = [];
eventColumn = [];
permissionControl = [];
public applyFilterValue: any;
tableData: any[] = [];
staffOptions = {};

isAssetChartLoading: boolean = true;
isStaffChartLoading: boolean = true;
selectedTab = 'Patient';
fieldEnable = false;
preparationSla = null;
surgerySla = null;
recoverySla = null;
formTemplateId = new FormControl(null);
formTemplateList: any=[];
public vipList: Array<any> = [];
public languageList: Array<any> = [];
public threatList: Array<any> = [];
formBuilderSource : any =[];
public threatsIncluded = false;
bannerlabel = {
      'banners': {
        'bannerFirstRow': this.data.selectedPatient,
        'bannerFirstRowLable': '',
        'bannerFisrtRowIcon': [{code: 'warning', value: 'warning'}],
        'bannerFirstLocRow': this.data?.data?.eventLocationName,
        'bannerFirstLocRowLable': '',
        'bannerSecondRow': this.data.selectedPatient,
        'bannerSeconRowLable': [{code: 'id', value: 'ID'}, {code: 'surgeon', value: 'Surgeon'}, {code: 'surgeryName', value: 'Surgery Name'}, {code: 'PackageName',  value:'Package Name'},
           {code: 'ScheduleStartTime', value: 'Schedule Start Time'}, { code: 'TokenNo', value: 'Token No' }]
      }
    }


  constructor(public thisDialogRef: MatDialogRef<AppOtNewComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public commonService: CommonService,public datepipe: DatePipe,public dialog: MatDialog,public toastr: AppToastService,private readonly form: FormBuilder,private readonly configurationServices: ConfigurationService) { 
    this.enableSidebar = data['sideNav'];
  }

  ngOnInit(): void {
    if (this.data['selectedPatient'].hasOwnProperty('name') == false) {
      this.data['selectedPatient']['name'] = this.data['selectedPatient']['patientName']
      this.data['selectedPatient']['id'] = this.data['selectedPatient']['patientId']
      this.data['selectedPatient']['mainIdentifier'] = this.data['selectedPatient']['uhid']
      this.data['selectedPatient']['birthDate'] = this.data['selectedPatient']['dob']
      this.data['selectedPatient']['threats'] = this.data['selectedPatient']['threats'].length ? this.data['selectedPatient']['threats'] : null;
    }
    if(this.data.hasOwnProperty('visitTypeId')) {
      this.visitTypeId = this.data.visitTypeId
    }
    this.buildForm();
    this.getFormTemplate();
    this.getFormDetails();
    this.commonService.getAppTerms('Language,VipType,PatientThreat').subscribe((res) => {
      this.vipList = res.results.filter(resFilter => resFilter.groupName === 'VipType');
      this.languageList = res.results.filter(resFilter => resFilter.groupName === 'Language');
      this.threatList = res.results.filter(resFilter => resFilter.groupName === 'PatientThreat');
      this.threatList = this.threatList.map(item => ({
        ...item,
        isSelected: false
      }));
    });
    this.getPatientStatusInfo();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.thisDialogRef.close();
  }

  buildForm(){
    this.planDetailForm = this.form.group({
      isDiabetic: [false],
      isFasting: [false],
      isVulnerable: [false],
      isPregnant: [false],
      vipTypeId: [''],
      preferedLanguage: ['']
    });
  }
  
  getPatientStatusInfo(){
    this.dataSource.data = [];
    this.ipTest = {};
    this.commonService.getProcedureInfo(this.data['selectedPatient'].otProcedureId).subscribe(res =>{
      if(res.statusCode == 1){
        if(res.results.length){
          this.preparationSla = res.results[0]['preparationSla'];
          this.surgerySla = res.results[0]['surgerySla'];
          this.recoverySla = res.results[0]['recoverySla'];
        }
      }else{
        this.preparationSla = null;
        this.surgerySla = null;
        this.recoverySla = null;
      }
    })
    this.commonService.getPatientTestStatusDetails(this.data['selectedPatient'].id,this.data['selectedPatient'].patientVisitId,this.data['selectedPatient'].visitEventId).subscribe(res => {
      if(res.statusCode == 1){
        this.events= res.results.testStatuses;
        this.patientDetails = res.results;
        this.bannerlabel = {
          'banners': {
            'bannerFirstRow': this.data.selectedPatient,
            'bannerFirstRowLable': '',
            'bannerFisrtRowIcon': [{code: 'warning', value: 'warning'}],
            'bannerFirstLocRow': this.data?.data?.eventLocationName,
            'bannerFirstLocRowLable': '',
            'bannerSecondRow':{...this.data.selectedPatient, patientfromTime: this.patientDetails['fromTime']},
            'bannerSeconRowLable': [{ code: 'id', value: 'ID' }, { code: 'surgeon', value: 'Surgeon' }, { code: 'surgeryName', value: 'Surgery Name' }, { code: 'PackageName', value: 'Package Name' }, { code: 'ScheduleStartTime', value: 'Schedule Start Time' }, { code: 'TokenNo', value: 'Token No' }]
          }
        }
        let threats = this.patientDetails.threats;
        this.planDetailForm.controls['isDiabetic'].setValue(this.patientDetails.isDiabetic);
        this.planDetailForm.controls['isFasting'].setValue(this.patientDetails.isFasting);
        this.planDetailForm.controls['isVulnerable'].setValue(this.patientDetails.isVulnerable);
        this.planDetailForm.controls['isPregnant'].setValue(this.patientDetails.isPregnant);
        this.planDetailForm.controls['vipTypeId'].setValue(this.patientDetails.vipTypeId);
        this.planDetailForm.controls['preferedLanguage'].setValue(this.patientDetails.preferedLanguage);
        if(res.results.currentStatusId == 'QS-IP') {
          this.ipTest = {
              "patientStatusId": res.results['currentStatusId'],
              "patientStatusName": res.results['currentStatusName'],
              "healthTestId": res.results['healthTestId'],
              "healthTestName": res.results['healthTestName'],
              "time": res.results['time'],
              "locationId": res.results['locationId'],
              "locationName": res.results['locationName'],
              "inTime": res.results['inTime'],
              "toTime": null,
              "completedTime": null,
              "consultTime": null,
              "waitTime": null,
              "testType": res.results['testType'],
              "patientQueueId": res.results['patientQueueId'],
              "reasonCode": null,
              "reasonCodeName": null,
              "floorId": res.results['floorId'],
              "floorName": res.results['floorName'],
              "floorShortName": null,
              "consultantId": res.results['consultantId'],
              "consultantName": res.results['consultantName'],
              "testShortName": null,
              "locationShortName": null,
              "entityStartDatetime": null,
              "entityEndDatetime": null,
              "isAutoCompleted": null,
              "reviewDate": null,
              "Activity": null, 
              "entityFormList": res.results['entityFormList'],  
              "testCategoryId": res.results['testCategoryId'],  
              "formTemplateId" : res.results['formTemplateId'],        
          }
          this.events.push(this.ipTest)
        }
        for(let i=0;i<threats.length;i++){
          let index = this.threatList.findIndex(res => res.code == threats[i]['id']);
          if(index != -1){
            this.threatList[index]['isSelected'] = true;
          }
        }
        this.timeExceedCheck();
        this.events.sort((a, b) => {
            const dateA = a.patientQueueId
            const dateB = b.patientQueueId
            return dateA - dateB;
        });
        const Columns = ['healthTestName', 'locationName', 'patientStatusName', 'inTime','toTime','consultTime', 'waitTime'];
        let tableData=[...this.events];
        for (let i = 0; i <= Columns.length; i++) {
          tableData.map(data => {
            if(this.patTableColumns[i] !== 'select'){
              if(data[Columns[i]] && (this.patTableColumns[i] == 'Start' || this.patTableColumns[i] == 'End')){
                data[Columns[i]] = this.datepipe.transform(new Date(data[Columns[i]]), 'HH:mm')
              }
              if(data['patientStatusId'] == 'QS-PE' && (Columns[i] == 'consultTime' || Columns[i] == 'waitTime')){
                data[Columns[i]] = null;
              }
              data[this.patTableColumns[i]] = data[Columns[i]];
            }
            
          });
        }
        this.dataSource.data = tableData;
      }
    })
  }
  setThreatsIncluded(threat: any): boolean {
    if (threat.isSelected) {
      this.threatsIncluded = true;
      return true;
    }
    return false;
  }
  patientSummary(patient){
    this.data['selectedPatient'] = patient;
    this.getPatientStatusInfo();
    if(this.selectedTab == 'Asset'){
      this.tableColumns = this.assetTableColumns;
      this.patientSummeryId = patient?.visitEventId ? patient.visitEventId : null;
      this.getAssetStaffStatusInfo(this.selectedTab);
      this.loadAssetChartData();
    }else if(this.selectedTab == 'Staff'){
      this.tableColumns = this.staffTableColumns;
      this.patientSummeryId = patient?.visitEventId ? patient.visitEventId : null;
      this.getAssetStaffStatusInfo(this.selectedTab)
      this.loadStaffChartData();
    }else if(this.selectedTab == 'Form'){
      this.getFormTemplate();
      this.getFormDetails();
    }
  }
  reloadTab(){
    if(this.selectedTab == 'Patient'){
      this.getPatientStatusInfo();
    }else if(this.selectedTab == 'Asset'){
      this.tableColumns = this.assetTableColumns;
      this.loadAssetChartData();
    }else if(this.selectedTab == 'Staff'){
      this.tableColumns = this.staffTableColumns;
      this.loadStaffChartData();
    }
  }

  discharge() {
    let msg = 'Tag will be disassociated. Do you want to discharge ?'
    if (this.data['selectedPatient'].tagId == null) {
      msg = 'Do you want to discharge ?'
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass: ['confirmation-popup'], disableClose: true,
      data: {
        title: 'Discharge', message: msg,
        'patientId': this.data['selectedPatient'].id, 'patientVisitId': this.data['selectedPatient'].patientVisitId,
        'visitType': "VT-IP", 'tagId': this.data['selectedPatient'].tagId,
        buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, 'discharge': true
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.thisDialogRef.close('confirm');
      }
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
  selectRow(row: any) {
    this.selection.toggle(row);
  }
  getChartData(){
    let param = '/fdt=' + this.data.selectedDate+ '&tdt=' + this.data.selectedDate +'&pid='+this.data['selectedPatient']['id'];
    this.commonService.getReportData('ot-util-bypat',param).subscribe(res =>{
      if(res?.results?.data.hasOwnProperty('OT Detail') && res?.results?.data['OT Detail'].length){
        let otDetail = res.results.data['OT Detail'][0];
        let selectedDate1 = new Date(this.data.selectedDate);
        let year = selectedDate1.getFullYear();
        let month = selectedDate1.getMonth();
        let day = selectedDate1.getDate(); 
        if(this.selectedTab == 'Asset'){
          if(otDetail['Asset'].length){
            let assetData = [...otDetail['Asset']];

            const Columns = ['Name', 'Location','Status','Start time','End time','Duration'];
            for(let i=0; i<= Columns.length; i++){
              assetData.map(data => {
                data[this.assetTableColumns[i]] = data[Columns[i]];
              });
            }

            this.dataSource.data = assetData;
            let assetArray = otDetail['Asset'].map(asset => [
              asset["Name"],
              asset["Status"],
              new Date(asset["Start time"]),
              new Date(asset["End time"]),
            ]);
            this.chartData = assetArray;
            const uniqueStatuses = [...new Set(assetArray.map(asset => 
              typeof asset[1] === 'string' ? asset[1] : ''
            ))].filter((status): status is string => status !== '');
            
            const colors = uniqueStatuses.map(status => this.statusColors[status] || '#000000');

            this.options = {
              timeline: { colorByRowLabel: false },
              backgroundColor: '#ffffff',
              colors: colors,
              hAxis: {
                format: 'HH:mm', 
                textStyle: {
                  fontSize: 12, 
                  color: '#333'
                },
                minValue: new Date(year, month, day, 0, 0),
                maxValue: new Date(year, month, day, 23, 59)
              }
            }
          }
        }
        
        if(this.selectedTab == 'Staff'){
          if(otDetail['Careprovider'].length){
            let cpData = [...otDetail['Careprovider']];

            const Columns = ['Name', 'Location','Start time','End time','Duration'];
            for(let i=0; i<= Columns.length; i++){
              cpData.map(data => {
                data[this.staffTableColumns[i]] = data[Columns[i]];
              });
            }

            this.dataSource.data = cpData;
            let cpArray = otDetail['Careprovider'].map(cp => [
              cp["Name"],
              cp["Location"],
              new Date(cp["Start time"]),
              new Date(cp["End time"])
            ]);
            this.staffChartData = cpArray;
            this.staffOptions = {
              timeline: { colorByRowLabel: true },
              colors: ['#1f78b4', '#ffbb33'],
              hAxis: {
                format: 'HH:mm',
                textStyle: {
                  fontSize: 12,
                  color: '#333'
                },
                minValue: new Date(year, month, day, 0, 0),
                maxValue: new Date(year, month, day, 23, 59)
              },
              vAxis: { title: 'Staffs' }
            }
          }
        }
        
      }
    })
  }
  loadAssetChartData() {
    this.chartData = [];
    this.dataSource.data = [];
    this.getChartData();
    this.isAssetChartLoading = true;
    setTimeout(() => {
      this.isAssetChartLoading = false;
    }, 1000); 
  }

  loadStaffChartData(){
    this.staffChartData = [];
    this.dataSource.data = [];
    this.getChartData();
    this.isStaffChartLoading = true;
    setTimeout(() => {
      this.isStaffChartLoading = false;
    }, 1000); 
  }

  onTabChange(event){
    this.selectedTab = event.tab.textLabel;
    if(this.selectedTab == 'Patient'){
      this.tableColumns = this.patTableColumns;
      this.getPatientStatusInfo();
    }else if(this.selectedTab == 'Asset'){
      this.getAssetStaffStatusInfo(this.selectedTab);
    }else if(this.selectedTab == 'Staff'){
      this.getAssetStaffStatusInfo(this.selectedTab);
    }else if(this.selectedTab == 'Form'){
      this.getFormTemplate();
      this.getFormDetails();
    } else if (this.selectedTab == 'Resources') {
      // This determines the Resources event console.log(event);
    }
  }

  getAssetStaffStatusInfo(type) {
    let id = null;
    this.isAssetChartLoading = true;
    this.isStaffChartLoading = true;
    const dataType = type?.toLowerCase() === 'asset' ? 'ASSET' : 'USER';
    if (this.patientSummeryId !== null && this.patientSummeryId !== undefined) {
      id = this.patientSummeryId;
    } else {
      id = this.data.sideNav ? this.data.visitTypeId : this.data?.data?.visitEventId;
    }
    this.commonService.getBookedEntities(dataType, id).subscribe(res => {
      this.isAssetChartLoading = false;
      this.isStaffChartLoading = false;
      if (res.statusCode === 1) {
        if (res.results.assets != null) {
          this.tableData = res.results.assets;
          const Columns = ['tagId','assetName','assetSerialNumber','startTime','endTime','duration'];
          for (let i = 0; i <= Columns.length; i++) {
            this.tableData.map(data => {
              data[this.assetDisplayedColumns[i]] = data[Columns[i]];
            });
          }
        } else {
          this.tableData = res.results.users;
          const Columns = ['tagId','name','employeeId','roleName','startTime','endTime','duration'];
          for (let i = 0; i <= Columns.length; i++) {
            this.tableData.map(data => {
              data[this.StaffDisplayedColumns[i]] = data[Columns[i]];
            });
          }
        }
      }
    })
  };

  rowClick(event) {
    // This determines the rowClick event console.log(event)
  }


  calculateAge(dob){
    let year = new Date(dob).getFullYear();
    return this.currentYear - year;
  }

  timeExceedCheck(){
    if(this.ipTest.hasOwnProperty('inTime')){
      const specificTime = new Date(this.ipTest['inTime']);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - specificTime.getTime();
      const minutesDifference = Math.floor(timeDifference / (1000 * 60));

      if(this.ipTest['healthTestName'] && this.ipTest['healthTestName'].toLowerCase().includes("preparation")) {
        if(minutesDifference>this.preparationSla){
          this.isTimeExceed = true;
        }
      } else if(this.ipTest['healthTestName'] && this.ipTest['healthTestName'].toLowerCase().includes("surgery")) {
        if(minutesDifference>this.surgerySla){
          this.isTimeExceed = true;
        }
      } else if(this.ipTest['healthTestName'] && this.ipTest['healthTestName'].toLowerCase().includes("recovery")){
        if(minutesDifference>this.recoverySla){
          this.isTimeExceed = true;
        }
      }
    }
  }

  getFormTemplate() {
    this.commonService.getFormTemplate('FTT-OT').subscribe(res => {
      if(res.statusCode == 1) {
        this.formTemplateList = res.results.filter(val => val.formStatusId == 'FS-PU');
      }
    });
  }
  getFormDetails() {
    this.formBuilderSource = [];
    this.commonService.getFormDetails(this.data?.selectedPatient?.visitEventId, 'patient_visit_event').subscribe(res => {
      if (res.statusCode == 1) {
        let result = res.results.filter(res => res.status);
        this.formBuilderSource = result.reverse();
        this.formBuilderSource.sort = this.sort;
      }
    });
  }
  formBuilder(entityData,formTempId?,formId?) {
    let formData = null
    let entityId= this.data?.selectedPatient?.visitEventId;
    let parentId = this.data?.selectedPatient?.id;
    if(entityData == null && formTempId && formTempId != null){
      entityData = {};
      entityData['id'] = formId;
      entityData['pfFormTemplateId'] = formTempId;
      let formEntityIndex = this.formBuilderSource.findIndex(res => res.id == formId);
      if(formEntityIndex !== -1){
        entityData['entityFormStatusId'] = this.formBuilderSource[formEntityIndex]['entityFormStatusId'];
      }
    }
    if(entityData != null){
      formData = { "id" : entityData['id'] , "entityId" : entityId , "entityType" : "patient_visit_event" ,"parentId":parentId,"parentType":"patient", "pfFormTemplateId" : entityData['pfFormTemplateId'], "content" : "form","entityData": this.data?.selectedPatient,"entityFormStatus":entityData['entityFormStatusId']};
    }else if(this.formTemplateList.length){
      formData = { "id" : null , "entityId" : entityId , "entityType" : "patient_visit_event" ,"parentId":parentId,"parentType":"patient", "pfFormTemplateId" : this.formTemplateId.value, "content" : "form","entityData": this.data?.selectedPatient,"entityFormStatus":null};
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      formData = null;
      this.getFormDetails();
      this.getPatientStatusInfo();
      this.formTemplateId.setValue(null);
    });
  }
  getFormTemplateInfo(){
    this.configurationServices.getFormTemplates(this.formTemplateId.value).subscribe(res =>{
      if(res.statusCode === 1){
        let formEntityIndex = -1;
        let formTempData = res.results[0];
        let jsonValue = JSON.parse(formTempData.jsonValue);
        if(jsonValue.hasOwnProperty('dataScope') && jsonValue['dataScope'] == 'type'){
          formEntityIndex = this.formBuilderSource.findIndex(res => res.pfFormTemplateId == this.formTemplateId.value);
        }
        if(formEntityIndex != -1){
          let entityData = this.formBuilderSource[formEntityIndex];
          this.formBuilder(entityData);
        }else{
          this.formBuilder(null);
        }
        
      }
    })
  }
  triggerAction(event){
    if(event.key === 'preview'){
      this.formBuilder(event.data)  
    }else if(event.key === 'view'){
      this.viewHistory(event.data)
    }else if (event.key === 'delete') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass:'confirmation-popup',
         data: {
         title: 'Confirmation', message: 'Are you sure you want to delete?',
         buttonText: { ok: 'Yes', cancel: 'No' }
         }
     });
       dialogRef.afterClosed().subscribe(result => {
         if (result == "Yes") {
          let formTempId = event.data?.id;
          let formIndex = this.formBuilderSource.findIndex(res => res.id == formTempId);
          this.formBuilderSource[formIndex]['status'] = false;
          this.configurationServices.updateEntiryFormTemplates(formTempId, this.formBuilderSource[formIndex]).subscribe(res => {
            if (res.statusCode === 1) {
              this.getFormDetails();
            }
          })
        }
      })
    }
  }

  viewHistory(data){
    let formData = { "id" : data.id , "entityId" : this.data?.selectedPatient?.visitEventId , "entityType" : "patient","parentId":this.data.id,"parentType":'patient' , "pfFormTemplateId" : data.pfFormTemplateId, "content" : "form","entityData": this.data?.selectedPatient,"entityFormStatus":data['entityFormStatusId'],"sideBar":true};
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: formData,
      panelClass: ['fullscreen-form-dialog'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getFormDetails();
    });
  }
  updateClinicalDetails(){
    const selectedThreats = this.threatList
    .filter(item => item.isSelected) // Filter items where isSelected is true
    .map(item => item.code);  
    let clinicalDetails = {patientId: this.data?.selectedPatient?.id?(this.data.selectedPatient.id).toString():null,
       healthPlanId: this.data?.selectedPatient?.packageId?(this.data.selectedPatient.packageId).toString():null,
       patientVisitId: this.data?.selectedPatient?.patientVisitId,
       vipTypeId: this.planDetailForm.controls['vipTypeId'].value,
       preferedLanguage: this.planDetailForm.controls['preferedLanguage'].value,
       isDiabetic: this.planDetailForm.controls['isDiabetic'].value,
       isFasting: this.planDetailForm.controls['isFasting'].value,
       isVulnerable: this.planDetailForm.controls['isVulnerable'].value,
       isPregnant: this.planDetailForm.controls['isPregnant'].value,
       tagId: this.data?.selectedPatient?.tagId,
       threats: selectedThreats?selectedThreats:[]}
    this.commonService.updateClinicalDetails(clinicalDetails).subscribe(res => {


      this.toastr.success('<i>Success</i>', `${res.message}`);
      this.thisDialogRef.close('confirm');
    },
      error => {
        this.toastr.error('<i>Error</i>', `${error.message}`);
      });

  }
   fixClick() {
    console.log('')
  } 
}
