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

import { Component, OnInit, ViewChild,Inject, ViewEncapsulation } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { routerTransition } from "../../../router.animations";
import { DatePipe } from '@angular/common';
import { ReportService, ConfigurationService, CommonService } from './../../../shared';
import { ConfirmationDialog } from '../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { EditSchedule, EditReport } from './schedule-report.model'
import { SelectionModel } from '@angular/cdk/collections';
import cronstrue from 'cronstrue';
import { AppToastService } from '../../../shared/services/toaster.service';
import { CreateScheduleReportComponent } from '../../configuration/create-schedule-report/create-schedule-report.component';

@Component({
  selector: "app-report",
  templateUrl: "./schedule-report.component.html",
  styleUrls: ["./schedule-report.component.scss"],
  animations: [routerTransition()],
  encapsulation: ViewEncapsulation.None,
})

export class ScheduleReportComponent implements OnInit {
  displayedColumns: string[] = ['expand','canSchedule', 'name', 'Template', 'Input Parameters', 'RetryInterval'];
  dataSource: MatTableDataSource<any>;
  permissionControl = ['BT_ALLE'];
  expandedElement: any | null = null;
  childColumns: string[] = ['name','schedule','criteria','isActive'];
  // dataSource = [
  //   { id: 1, name: 'InPatient', time: 1.0079, schedule: '' },
  //   { id: 2, name: 'OP', time: 4.0026, schedule: '' },
  //   { id: 3, name: 'Asset', time: 6.941, schedule: '' },
  //   { id: 4, name: 'HC', time: 9.0122, schedule: '' }
  // ];
  public applyFilterValue: any;
  tableData: any;

  public selectedRow: any;
  public selectedId = null;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(public dialog: MatDialog, private readonly reportService: ReportService) {

  }

  ngOnInit() {
    this.getAllReport();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.applyFilterValue = filterValue;
    this.dataSource.filter = filterValue;
  }

  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
  
  rowClick(data) {
    this.selectedId = data.id
    if (this.selectedRow != null && this.selectedRow.id == data.id) {
      this.selectedRow = null
    } else {
      this.selectedRow = data;
    }
  }

  rowDbClickEvent(event, childData?: any, index?: any) {
    if (event) {
      this.selectedId = event.id
      this.createSchedule(event, childData, index);
    }
  }

  getAllReport() {

    this.reportService.getAllReportSchedule().subscribe(res => {
      this.tableData = res.results;
      this.dataSource = new MatTableDataSource<any>(this.tableData);

      if (this.applyFilterValue != null) {
        this.dataSource.filter = this.applyFilterValue;
      }
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });



  }

  createSchedule(data?: any, childData?: any, index?: any) {
    let rowData = data ? data : this.selectedRow;
    if (childData) { 
      rowData['childData'] = childData;
      rowData['index'] = index;
    }
    const dialogRef = this.dialog.open(CreateScheduleReportComponent,
      { panelClass: ['medium-popup'], data: rowData, disableClose: true });//height:730px
    dialogRef.afterClosed().subscribe(result => {
      this.getAllReport();
    });
  }
  cronRestart() {
    this.reportService.restartScheduleCron().subscribe(res => {
      console.log('schedule restarted...')
    })
  }
  fixClick() {
    console.log('')
  }
}


@Component({
  selector: "app-schedule",
  templateUrl: "./create-schedule.component.html",
  //styleUrls: ["./schedule.component.scss"],
  encapsulation: ViewEncapsulation.None,
})

export class CreateScheduleComponent implements OnInit {

  selectedName: string;
  public reportForm: FormGroup;
  public scheduleForm: FormGroup;
  public defaultTime = null;
  public hr: number; public min: number; public pattern: string;
  schdisplayedColumns = ['schedule', 'isActive', 'scheduleCreatedDate', 'criteria', 'recipient', "Select"];
  public DisplayColumn = ['Recipient Type', 'Recipient Name', 'Channel Type', 'delete'];
  public DataColumns = ['recipientTypeName', 'recipientName', 'channelName', 'delete'];

  //   schDataSource = [
  //   {No: 1, Schedule: '1 45 6 * * *', Status: 'Active'},
  //   {No: 2, Schedule: '12 12 7 * * *', Status: 'Active'},
  //   {No: 3, Schedule: '8 30 12 * * *', Status: 'Active'},
  // ];
  schDataSource = new MatTableDataSource;
  df: any;
  public selectedSchedule = null;
  public selectedId = null;
  public selectedStatus = null;
  public selectedtime = null;
  public selecteddm = null;
  public selectedmon = null;
  public selecteddw = null;
  public editSchedules = false;
  public editSchedule: EditSchedule;
  public editReport: EditReport
  public isDisabled = false;
  public isUpdate = false;
  addSchedule: Array<any> = [];
  selection = new SelectionModel<any>(true, []);
  public selectedIndex = 0;
  selectedTab: any;
  public recipientForm: FormGroup;
  searchText = null;
  recipient = null;
  recipientEnabled = false;
  userNameList: any;
  recipientTypeList: any;
  public channelType: any;
  //firstName: any;
  id: any;
  pfSchedule: Array<any>; pfSch: any;
  pfRecipient: Array<any>; pfSchRec: any;
  public selectedCriteria = null;
  public selectedData = null;
  public arrayName = [];
  public nameArray = [];
  public dataSource: any[] = [];
  public editData: any[] = [];
  isEdit = false;
  updateSchedule: Array<any>;
  scheduleRecipientsLocal: any;
  scheduleRecipients = [];
  scheduleLocal: any;
  firstName: any;
  removedEscalation: any[] = [];
  recipientId: any;public scheduleLabel = []
  newScheduleRecipients = [];



  constructor(public form: FormBuilder, public thisDialogRef: MatDialogRef<CreateScheduleComponent>, public dialog: MatDialog, private readonly commonService: CommonService,
    private readonly dateFormat: DatePipe, @Inject(MAT_DIALOG_DATA) public data: any, private readonly reportService: ReportService, public toastr: AppToastService, private readonly configurationServices: ConfigurationService) {
    this.buildForm();
    if (data) {
      this.addSchedule = this.data.pfSchedule
      for (const item of this.addSchedule) {
        this.editData.push({
          scheduleId: item.id,
          data: item.pfScheduleRecipient
        });
      }
      this.schDataSource = new MatTableDataSource(this.addSchedule);
    }
  }

  ngOnInit() {
    this.defaultTime = '00:00';
    this.getSchedule();
    this.getDataTypes();
  }

  public buildForm() {
    this.reportForm = this.form.group({
      reportName: [this.data.name ? this.data.name : null],
      formTemplate: [this.data.template ? this.data.template : null],

    });
    let criteria1 = '{"fdt":"","tdt":""}';

    this.scheduleForm = this.form.group({

      formCriteria: [this.selectedCriteria ? this.selectedCriteria : criteria1, [Validators.required]],
      monthDay: [this.selecteddm ? this.selecteddm : null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(31)]],
      month: [this.selectedmon ? this.selectedmon : null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(12)]],
      weekDay: [this.selecteddw ? this.selecteddw : null, [Validators.required, Validators.pattern("^[0-9*,-/]*$"), Validators.min(1), Validators.max(7)]], duration: [''],
      time: [this.selectedtime ? this.selectedtime : null, [Validators.required]],
      status: [this.selectedStatus ? this.selectedStatus : this.selectedStatus, [Validators.required]],
      recipientName: [null],
      channelType: [null],
      recipientType: [null],
    });
  }

  rowClick(data) {
    this.selectedId = data.id
    //this.selectedData = data
    if (this.selectedData != null && this.selectedData.id == data.id) {
      this.selectedData = null
    } else {
      this.selectedData = data;
    }
  }


  getSchedule() {

    this.reportService.getAllReportSchedule().subscribe(res => {
      let reportData = res.results.filter(resFilter => resFilter.id === this.data.id)
      this.addSchedule = reportData[0].pfSchedule

      this.schDataSource = new MatTableDataSource<any[]>(this.addSchedule)
      for (let i = 0; i < this.addSchedule.length; i++) {
        this.scheduleLabel.push(cronstrue.toString(this.addSchedule[i].schedule, { locale: "en" }))
        let criteria1 = JSON.parse(this.addSchedule[i].criteria);
        delete criteria1.fid;
        criteria1 = JSON.stringify(criteria1);
        this.addSchedule[i]['criteria'] = criteria1;
        if (this.addSchedule[i].pfScheduleRecipient != null) {
          for (let j = 0; j < this.addSchedule[i].pfScheduleRecipient.length; j++) {
            this.arrayName.push(this.addSchedule[i].pfScheduleRecipient[j].recipientName)
          }
        }
        this.addSchedule[i]['pattern'] = this.scheduleLabel[i]
        this.addSchedule[i]['recipient'] = this.arrayName.toString();
        this.arrayName = [];
      }
    })
  }

  editReportSchedule(data) {
    this.dataSource = [];
    this.selectedId = data.id;
    this.selectedSchedule = data.schedule;
    this.selectedStatus = data.isActive;
    let ss = this.selectedSchedule.split(" ");
    this.selecteddm = (parseInt(ss[3]) ? parseInt(ss[3]) : '*');
    this.selectedmon = (parseInt(ss[4]) ? parseInt(ss[4]) : '*');
    this.selecteddw = (parseInt(ss[5]) ? parseInt(ss[5]) : '*');
    let hr = parseInt(ss[2])
    let min = parseInt(ss[1])
    let date = new Date();
    date.setHours(hr, min)
    // console.log(date)
    this.selectedtime = date;
    this.selectedCriteria = data.criteria;
    this.editSchedules = true;
    this.buildForm();
    this.getRecipient(data);
    this.isEdit = true;
    this.isUpdate = true;
  }

  deleteSchedule(data) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      panelClass:['confirmation-popup'], disableClose: true,
      data: {
        title: 'Remove schedule', message: 'Are you sure?',
        buttonText: { ok: 'Yes', cancel: 'No' },
        'isRemark': 1,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getSchedule();
    });
    this.isUpdate = false
  }

  updateReport() {
    let isActive = this.scheduleForm.controls['status'].value
    let criteria = JSON.parse(this.scheduleForm.controls['formCriteria'].value)
    criteria["fid"] = localStorage.getItem(btoa('facilityId'))
    criteria = JSON.stringify(criteria);
    let identifyingId = this.data.id

    let md = this.scheduleForm.controls['monthDay'].value;
    let mon = this.scheduleForm.controls['month'].value;
    let wd = this.scheduleForm.controls['weekDay'].value;
    let tm = this.scheduleForm.controls['time'].value;
    let time = null
    if (tm.length <= 8) {
      const date = this.dateFormat.transform(new Date(), 'yyyy-MM-dd');
      time = date + ' ' + tm;
    } else {
      time = (tm)
    }
    const datef = this.dateFormat.transform(time, 'yyyy-MM-dd HH:mm:ss');
    this.df = new Date(datef)
    this.hr = this.df.getHours();
    this.min = this.df.getMinutes();
    this.pattern = "0" + " " + this.min + " " + this.hr + " " + md + " " + mon + " " + wd;

    if (this.isEdit == true) {
      this.scheduleRecipients = []
      
      let updateTableId = this.addSchedule.findIndex(res => res.id == this.selectedId)
      this.addSchedule[updateTableId]['schedule'] = this.pattern;
      this.addSchedule[updateTableId]['isActive'] = this.scheduleForm.controls['status'].value;
      this.addSchedule[updateTableId]['criteria'] = this.scheduleForm.controls['formCriteria'].value;

      let editList = this.editData?.find(res => res.scheduleId === this.selectedId);
      let index = this.editData?.findIndex(res => res.scheduleId === this.selectedId);
      this.scheduleRecipients = this.editData[index].data;
      const editFilterList = editList?.data.filter(x => x.isDeletable !== true);

      for(const item of editFilterList) {
        this.arrayName.push(item.recipientName)
      }

      this.addSchedule[updateTableId]['recipient'] = this.arrayName.toString();
      this.scheduleForm.reset();
    }
    else {
      this.isEdit = false
      let editList = this.editData?.find(res => res.scheduleId === this.selectedId);
      let index = this.editData?.findIndex(res => res.scheduleId === this.selectedId);
      this.scheduleRecipients = index > -1 ? this.editData[index].data : this.newScheduleRecipients;
      const editFilterList = editList?.data?.filter(x => x.isDeletable !== true) || [];

      for(const item of editFilterList) {
        this.arrayName?.push(item.recipientName)
      }

      this.addSchedule.push({
        schedule: this.pattern,
        isActive: this.scheduleForm.controls['status'].value,
        scheduleCreatedDate: new Date(),
        criteria: this.scheduleForm.controls['formCriteria'].value,
        recipient: this.arrayName.toString()

      })
      this.schDataSource = new MatTableDataSource<any[]>(this.addSchedule)

    }

    this.editSchedule = new EditSchedule(null, null, null, null);
    this.editSchedule.criteria = this.scheduleForm.controls['formCriteria'].value;
    this.editSchedule.isActive = this.scheduleForm.controls['status'].value;
    this.editSchedule.schedule = this.pattern;
    this.editSchedule.pfScheduleRecipient = this.scheduleRecipients;
    this.updateSchedule = []

    if (this.selectedData != null) {
      for (let i = 0; i < this.addSchedule.length; i++) {
        this.scheduleLocal = {
          'id': this.selectedId,
          'identifyingType': this.selectedData.identifyingType,
          'identifyingId': identifyingId,
          'facilityId': localStorage.getItem(btoa('facilityId')),
          'scheduleCreatedDate': this.selectedData.scheduleCreatedDate,
          'criteria': criteria,
          'isActive': isActive,
          'schedule': this.pattern,
          'pfScheduleRecipient': this.editSchedule.pfScheduleRecipient
        };

      } this.updateSchedule.push(this.scheduleLocal)
    } else {
      for (let i = 0; i < this.addSchedule.length; i++) {
        this.scheduleLocal = {

          'id': null,
          'identifyingType': "report",
          'identifyingId': identifyingId,
          'facilityId': localStorage.getItem(btoa('facilityId')),
          //'scheduleCreatedDate': this.selectedData.scheduleCreatedDate,
          'criteria': criteria,
          'isActive': isActive,
          'schedule': this.pattern,
          'pfScheduleRecipient': this.editSchedule.pfScheduleRecipient
        };

      } this.updateSchedule.push(this.scheduleLocal)
    }
    this.editReport = new EditReport(null, null, null);
    this.editReport.name = this.reportForm.controls['reportName'].value;
    this.editReport.template = this.reportForm.controls['formTemplate'].value;
    this.editReport.pfSchedule = this.updateSchedule
    this.scheduleForm.reset();
    // console.log(this.editReport)
    // return
    this.reportService.updateReportSchedule(this.data.id, this.editReport).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.isDisabled = true;
        this.thisDialogRef.close('confirm');
      }
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      });

  }

  cancelReportSchedule() {
    this.editSchedules = false;
    this.scheduleForm.reset();
    this.isUpdate = false
  }

  selectTab(index: number): void {
    this.selectedIndex = index;
  }

  tabClick(event) {
    this.selectedTab = event.index;
  }

  getDataTypes() {

    this.commonService.getAppTerms('RecipientType,Channel').subscribe(res => {
      this.recipientTypeList = res.results.filter(resFilter => resFilter.groupName === 'RecipientType');
      if(this.recipientTypeList.length) {
        this.recipientTypeList = this.recipientTypeList.filter(val => ['RT-RO','RT-US'].includes(val.code));
      }
      this.channelType = res.results.filter(resFilter => resFilter.groupName === 'Channel' && resFilter.code === 'CH-EM');
    });
  }

  getRecipientName(type) {
    this.recipient = null;
    this.recipient = type;
    this.userNameList = [];
    this.recipientEnabled = false;
    this.scheduleForm.get('recipientName').reset();
    this.scheduleForm.get('channelType').reset();
  }

  searchUserNamelist(id) {
    this.searchText = null;
    this.searchText = id?.text;
    if (this.searchText.length >= 2 && this.recipient != null) {
      if (this.recipient === 'RT-RO') {
        this.configurationServices.getRecipientName(this.searchText, this.recipient).subscribe(res => {
          this.userNameList = res.results;
          this.recipientEnabled = true;
        });
      } else {
        this.configurationServices.getRoleUser(this.searchText, null, null).subscribe(res => {
          this.userNameList = res.results;
          this.recipientEnabled = true;
        });
      }
    } else {
      this.userNameList = [];
      this.recipientEnabled = false;
    }
  }

  getRecipientList(id) {
    if (id) {
      const recipient = this as any as { id: string, name: string }[]
      const recipientId = recipient.find(obj => obj.id === id).name;
      return recipientId;
    } else {
      return '';
    }
  }


  addEscalation() {
    this.isUpdate = true;
   const recipientType = this.scheduleForm.get('recipientType').value;
   const recipientName = this.scheduleForm.get('recipientName').value;
   const channelType = this.scheduleForm.get('channelType').value;
   const recipientTypeData = this.recipientTypeList.find(x => x.code === recipientType);
   const recipientNameData = this.userNameList.find(x => x.id === recipientName);
   const channelTypeData = this.channelType.find(x => x.code === channelType);
   let addRecipientData = {
    'channelId': channelTypeData.code,
    'channelName': channelTypeData.value,
    'recipientId': recipientNameData.id,
    'recipientName': recipientNameData.name,
    'recipientType' : recipientTypeData.code,
    'recipientTypeName': recipientTypeData.value,
    'id': null
   }
    const index = this.editData.findIndex( obj => obj.scheduleId === this.selectedId );

    if(this.editData?.length !== 0 && this.selectedId !== null) {
      if (index !== -1) {
        this.editData[index].data.push(addRecipientData);
        }
    } else {
      this.newScheduleRecipients.push(addRecipientData);
    }

    this.dataSource.push(addRecipientData);
    this.dataSource = [...this.dataSource];
    this.scheduleForm.get('recipientType').reset();
    this.scheduleForm.get('recipientName').reset();
    this.scheduleForm.get('channelType').reset();
    this.scheduleForm.get('time').setValue('00:00');
  }

  getRecipient(data) {
      if (!this.editData.length) {
       this.editData = []
      }
      const selecedData = this.editData.find(obj => obj.scheduleId === this.selectedId);
      this.dataSource?.push(...selecedData?.data?.filter(x => x.isDeletable !== true));
      this.dataSource = [...this.dataSource];
  }

  clearForm() {
    this.thisDialogRef.close();
  }

  fixClick() {
    console.log('')
  }

  eventAction(event) {
    if (event?.key === 'delete') {
      this.removeDataInfo(event.data);
    }
  }

  removeDataInfo(data) {
    if (data) {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        panelClass: ['confirmation-popup'], disableClose: true,
        data: {
          title: 'Confirm Delete', message: 'Are you sure you want to delete?',
          buttonText: { ok: 'Yes', cancel: 'No' }, 'isRemark': 1, formStatusEnable: true
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        if (res.confirmButtonText === 'Yes') {
          const indexData = this.editData.findIndex(obj => obj.scheduleId === this.selectedId)
          const deleteData = this.editData.find(obj => obj.scheduleId === this.selectedId);
          let dataSourceInfo = [];
          let index = null;
          if (deleteData && data?.id) {
            index = deleteData.data.findIndex(item => item.id === data.id);
            if (index > -1) {
              deleteData.data[index].isDeletable = true;
            }
            dataSourceInfo = this.dataSource.filter(res => res.id !== data.id);
            
          } else {
            deleteData.data = deleteData?.data?.filter(x => !(x.id == null && x.channelId == data.channelId && x.recipientId == data.recipientId && x.recipientType == data.recipientType) );
            dataSourceInfo = this.dataSource?.filter(res => !(res.id == null && res.channelId == data.channelId && res.recipientId == data.recipientId && res.recipientType == data.recipientType));
            this.editData[indexData] = deleteData;
          }
          this.editData[indexData] = deleteData;
          this.dataSource = dataSourceInfo.filter(x => x.isDeletable !== true);
        }
      });
    }
  }
}
