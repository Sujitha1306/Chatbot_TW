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
import { Component, Input, ViewChild, ViewChildren,  ViewEncapsulation,OnChanges, EventEmitter, Output, SimpleChanges, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {ChartService } from '../../../services/chart.service';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';
import { DatePipe } from '@angular/common';
import { ExcelService } from '../../../services';
import { ListLoaderService } from '../../../services/list-loader.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDatepicker } from '@angular/material/datepicker';


@Component({
  selector: 'angular-table-component',
  templateUrl: './angulartable.component.html',
  styleUrls: ['./angulartable.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AngularTableComponent implements OnChanges {
    public showTable = false;
    dataSource = new MatTableDataSource<any>();
    HCDisplayedData : any;
    HCDisplayedLabel : any;
    HCDisplayedColumns : any;
    public isSearch : boolean = false;
    reviewDate: any;
    selectedRow = null;
    selectedRowId: any | null = null;
    selectedHeaderCol: any = null;
    pageIndex: any;
    @ViewChild(MatPaginator)
    set paginator(value: MatPaginator) {
      this.dataSource.paginator = value;
    }    
    @ViewChild(MatSort)
    set sort(value: MatSort) {
      this.dataSource.sort = value;
    }
    @Input() title: any;
    @Input() headerStyle: any;
    @Input() tableData : any;
    @Input() tableLabel : any;
    @Input() columns : any;
    @Input() columnData : any;
    @Input() type : any = null;
    @Input() page : any = true;
    @Input() enableExcel : any = true;
    @Input() filters : any = null;
    @Input() pageSizeOptions : any = [50,100, 200, 300, 400, 500];
    @Input() chartData : any;
    @Input() id : any;
    @Input() styles: any;
    @Input() tableStyle: any;
    @Input() applyFilter: any;
    @Input() menuButton: any;
    @Input() tableSliceEnable: any;
    @Input() pageSize: any;
    @Input() enableScroll: boolean;
    @Input() component: any;
    @Input() selectionOption: any;
    @Input() ispaginator: boolean = true;
    @Input() editMenuData: any;
    @Input() isTableEditColumn: boolean = false;
    @Input() identifyingKey: string;
    @Output() checkBoxAction = new EventEmitter<any>();
    private kpiRules: any[] = [];
    @Input()
    set kpi(value: any[]) {
      if (value && value.length) {
        this.kpiRules = value;
        this.convertKPIRulesObj();
      }
    }
    @Output() triggerAction = new EventEmitter<any>();
    @Output() locationBoundaryId = new EventEmitter<string>();
    @Output() porterDetail = new EventEmitter<string>();
    @Output() getWidgetFilter = new EventEmitter<any>();
    @Output() rowDbClickAction = new EventEmitter<any>();
    @Output() rowClickAction = new EventEmitter<any>();
    @ViewChildren('empSD') allMyCanvas: any;  // Observe #mycharts 
    
    pageLength = 0;
    displayedColumns = [];
    displayedData = [];
    dublicateTableData = []
    public enableedit = false;
    idCheck = null;
    currentindex: any;
    visibledata: any;
    kpiRulesObj : any = {};
    selection = new SelectionModel<any>(true, []);
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.edit-col')) {
        this.selectedRow = null;
      }
    }
    constructor(public ChartService : ChartService,public dialog: MatDialog, public datepipe: DatePipe,
      public ExcelService: ExcelService,public listLoader : ListLoaderService) {
      }

    ngAfterViewInit(){
      if(this.tableSliceEnable && this.pageSize){
        this.HCDisplayedColumns = this.columns;
        this.dataSource = new MatTableDataSource<any>(this.tableData.slice(0, this.pageSize));
        this.pageLength = this.tableData.length;
      }

      if (this.id === 'entityAssetList') {
        this.selection.clear();
        this.selection.select(...this.dataSource.data);
      }
    }

    onPageChange(event: any): void {
      this.pageIndex = event.pageIndex;
      if((this.tableSliceEnable && this.pageSize) ){
        this.dataSource.data = this.tableData.slice((event.pageIndex * event.pageSize), ((event.pageIndex + 1)* event.pageSize));
      }else if(this.enableScroll){
        this.visibledata = this.tableData.slice((event.pageIndex * event.pageSize), ((event.pageIndex + 1)* event.pageSize))
        this.dataSource = this.visibledata
        this.currentindex = (this.pageIndex * this.pageSize) + this.pageSize; 
        const el = document.querySelector('.tw-mat-table-overflow');
      if (el) {
        el.scrollTop = 0;
      }
      }
    }
    ngOnChanges(changes : SimpleChanges) {
      if(this.tableData){
        if(this.tableData.length >= 0) {
          this.showTable = false;
          if(this.type === 'ng-table') {
            this.displayedColumns = this.columns;
            this.displayedData  = this.columnData;
            this.dublicateTableData = this.tableData;
            this.dataSource = new MatTableDataSource(this.tableData);
            this.dataSource.paginator = this.paginator;
            this.showTable = true;
          } else {
          
          if(this.chartData){
              setTimeout(() => this.getCharts(this.allMyCanvas,this.chartData), 5000); 
          }
            let data = this.tableData;
            this.dublicateTableData = this.tableData;
            if(this.enableScroll){
              if(this.HCDisplayedColumns){
                this.pageLength = this.tableData.length;
              }
              let CHUNK_SIZE
              if(this.pageSize){
                CHUNK_SIZE = this.pageSize
              }else{
                CHUNK_SIZE=50
              }
              this.visibledata = this.tableData.slice(0, CHUNK_SIZE)
              this.currentindex =this.visibledata.length
              this.dataSource = this.visibledata;
              this.pageLength = this.tableData.length;
              this.pageSize = CHUNK_SIZE
            }else  if(this.tableSliceEnable && this.pageSize){
              this.dataSource = new MatTableDataSource<any>(this.tableData.slice(0, this.pageSize));
            }else{
              // this.dataSource = new MatTableDataSource(data);
              this.setupDataSource(data);
            }
            if(this.id == 'dashWid'){
              this.HCDisplayedData = this.columns;
              this.HCDisplayedLabel = this.tableLabel;
              if(this.HCDisplayedLabel == null || this.HCDisplayedLabel.length == 0)
                this.HCDisplayedLabel = this.HCDisplayedData;
              this.HCDisplayedColumns = this.HCDisplayedData;
            } 
            if(this.id != 'report2'){
              this.HCDisplayedData = this.columns;
              this.HCDisplayedColumns = this.HCDisplayedData;
            } else {
              this.HCDisplayedData = this.tableData;
              this.HCDisplayedColumns = this.columns;
            }
            if(this.columns == undefined) {
              this.HCDisplayedData = this.tableData;
              this.HCDisplayedColumns = Object.keys(this.tableData[0]);
            }            
            this.dataSource.paginator = this.paginator;
            if(this.HCDisplayedColumns[0]=='Active' || this.HCDisplayedColumns[0]=='Inactive'){
              this.page = false;
            }
            this.showTable = true;
            if (this.id == 'mrfile-missing' && this.applyFilter !== undefined && this.applyFilter !== null && this.applyFilter !== '') {
              this.applyFilter = this.applyFilter.trim(); // Remove whitespace
              this.applyFilter = this.applyFilter.toLowerCase(); // Datasource defaults to lowercase matches
              this.applyFilter = this.applyFilter;
              this.dataSource.filter = this.applyFilter;
          }
          }
           if (this.applyFilter !== undefined && this.applyFilter !== null && this.applyFilter !== '') {
              this.applyFilter = this.applyFilter.trim(); 
              this.applyFilter = this.applyFilter.toLowerCase(); 
              this.applyFilter = this.applyFilter;
              this.dataSource.filter = this.applyFilter;
          }

          if (this.id === 'entityAssetList') {
            this.selection.clear();
            let activeData = this.dataSource.data.filter(asset => asset.select !== false);
            activeData.forEach(item => this.selection.select(item));
          }
        }
      }
    } 
     convertKPIRulesObj(){
      if(this.kpiRules && this.kpiRules.length){
        // Convert array to object keyed by column
        this.kpiRulesObj = this.kpiRules.reduce((acc, curr) => {
          acc[curr.column] = { ...curr };   
          // delete acc[curr.column].column;   
          return acc;
        }, {} as Record<string, any>);
      }
    }
    setupDataSource(data: any[]) {
      // const hasKpiKeys = this.kpiRules.some(
      //   rule => data.length && data[0].hasOwnProperty(rule.key)
      // );
      const hasKpiKeys = data.length > 0 && Object.keys(data[0]).some(
        key => this.kpiRulesObj.hasOwnProperty(key)
      );
      let computedData = data;
      if (hasKpiKeys) {
        computedData = this.computeKpiValidation(data);
        // console.log(computedData)
      }
      this.dataSource = new MatTableDataSource<any>(computedData.slice(0, this.pageSize));
      this.pageLength = computedData.length;
    }
    filterTable(filterVal : string){
      filterVal = filterVal.trim(); // Remove whitespace
      filterVal = filterVal.toLowerCase(); // Datasource defaults to lowercase matches
      filterVal = filterVal;
      this.dataSource.filter = filterVal;
    }
    sendToLayout(fetchType) {
      this.showTable = false;
      for(let i=0;i<this.filters.length;i++){
        if(this.filters[i]['enabled'] && this.filters[i]['fetch_type'] === fetchType && fetchType === 'dataSource' && this.dublicateTableData.length) {
          if(this.filters[i]['selected_value'] != '') {
            this.tableData = this.dublicateTableData.filter(val => val[this.filters[i]['key']] == this.filters[i]['selected_value'])
          } else {
            this.tableData = this.dublicateTableData          
          }
          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
          this.showTable = true;
        } else if(this.filters[i]['enabled'] && this.filters[i]['fetch_type'] === fetchType && fetchType === 'API'){
          this.getWidgetFilter.emit(this.filters);
        }
      }
      
    }
    downloadExcel() {
      const startDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
      const sheetName = this.title;
      const fileName = this.title;
      const data = this.tableData;
      this.ExcelService.singleSheet(data, sheetName, fileName, startDate);
    }
    getLastLocation(data){
      let details = {
        floorId: data['floor_id'],
        tagSerialNumber: data['Tag serial no'],
        tagTypeId: "TAT-MR",
        type: "globalSearch"
      }
      const dialogRef = this.dialog.open(CommonDialogComponent, {
        data: details,
        panelClass: ["medium-popup"],
        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
      });
    }
    getCharts(chartArray, chartData) {
      let canvasCharts = chartArray._results;  // Get array with all canvas
      canvasCharts.map((myCanvas1, i) => {
        chartData[i]['canvasId'] = myCanvas1.nativeElement.getContext('2d'); 
        let chart = this.ChartService.drawChart(chartData[i]);
      }); 
    }
    removeLocationBoundary(selectedId) {
      this.locationBoundaryId.emit(selectedId);
    }
    viewLocationHistory(porterDet){
      this.porterDetail.emit(porterDet);
    }

    editIconClick(data){
      this.enableedit = !this.enableedit
      this.idCheck = data.healthTestId;
      this.reviewDate = data.reviewDate;
    }

    actionTrigger(key, data, keyVal) {
      this.selectedRow = null;
      this.triggerAction.emit({key, data, keyVal});
    }

    deleteTrigger(data , index){
      this.triggerAction.emit({index:index,data:data})
    }

    rowClick(data,index, key?) {
      if(data && data !== null && data !== '') {
        this.selectedRow = data;
        this.selectedRowId = data[this.identifyingKey];
        this.selectedHeaderCol = key;
      } else {
        this.selectedRow = null;
        this.selectedRowId = null;
        this.selectedHeaderCol = null;
      }
      this.rowClickAction.emit({data,index});
    }

    rowDbClickEvent(data) {
      this.rowDbClickAction.emit(data);
    }
  fixClick() {
    console.log('')
  }

  onTableScroll(event: Event): void {
  const element = event.target as HTMLElement;

  const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
  if (!atBottom || this.currentindex >= this.tableData.length || ((this.pageIndex+1) * this.currentindex) >= this.tableData.length) return;

  const CHUNK_SIZE =this.pageSize || 50;

  const { updatedVisibleData, newIndex } = this.listLoader.loadNextChunk(
    this.tableData,
    this.visibledata,
    this.currentindex,
    CHUNK_SIZE
  );

  if (newIndex === this.currentindex) return;
  this.visibledata = updatedVisibleData;
  this.dataSource=  new MatTableDataSource<any>(this.visibledata);
  this.currentindex = newIndex;
  this.pageSize = this.visibledata.length
  }

   // Convert hh:mm:ss or numeric to minutes
  getDurationInMinutes(duration: any): number {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string' && duration.includes(':')) {
      const [hh, mm, ss] = duration.split(':').map(Number);
      return hh * 60 + mm + (ss || 0) / 60;
    }
    return 0;
  }

  computeKpiColor(value: any, rule: any): string | null {
    let numericValue = 0;

    if (rule.type === 'duration') {
      numericValue = this.getDurationInMinutes(value);
    } else if (rule.type === 'number') {
      numericValue = Number(value);
    } else if (rule.type === 'string') {
      numericValue = value;
    }

    const exceeded =
      (rule.condition === 'Less Than or Equal' && numericValue > rule.value) ||
      (rule.condition === 'Greater Than' && numericValue <= rule.value) ||
      (rule.condition === 'Less Than' && numericValue >= rule.value) ||
      (rule.condition === 'Greater Than or Equal' && numericValue < rule.value) ||
      (rule.condition === 'Equal To' && numericValue != rule.value) ||
      (rule.condition === 'Not Equal To' && numericValue == rule.value);

    // return exceeded ? rule?.style || null : null;
    if (exceeded && rule?.style) {
      try {
        // Safely convert string to object
        const styleStr = rule.style.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
        return JSON.parse(styleStr);
      } catch {
        console.log("unable to parse json")
        return null;
      }
    }
    return null;
  }

  computeKpiValidation(data: any[]): any[] {
    if (!this.kpiRulesObj) return data;

    return data.map(row => {
      const styleMap: any = {};
      Object.keys(this.kpiRulesObj).forEach(key => {
        styleMap[key] = this.computeKpiColor(row[key], this.kpiRulesObj[key]);
      });
      return { ...row, kpiStyle: styleMap };
    });
  }

  checkboxEvent(event: MatCheckboxChange, type, row?) {
    if (type == 'row') {
      this.selection.toggle(row)
      this.checkBoxAction.emit(this.selection.selected);
    } else if (type == 'all') {
      this.masterToggle(event);
    }
  }

  masterToggle(event: MatCheckboxChange) {
  if (event.checked) {
    this.dataSource.data.forEach(row => this.selection.select(row));
  } else {
    this.selection.clear();
  }
  this.checkBoxAction.emit(this.selection.selected);
}

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  onMenuClosed() {
    this.editMenuData = null;
    this.selectedRowId = null;
  }

  openDatepicker(picker: MatDatepicker<any>) {
    picker.open();
  }

  getTableStyle(col: string, value: any) {
    if (!this.tableStyle) return {};
    if (Array.isArray(this.tableStyle)) {
      const config = this.tableStyle.find((x: any) => x.colName === col);
      if (!config) return {};
      return config.colValue?.[value] || config.colValue?.[String(value)]
        ? { color: config.colValue[value] ?? config.colValue[String(value)] }
        : { color: config.colColor };
    }

    if (this.tableStyle.colName) {
      if (this.tableStyle.colName !== col) return {};
      return this.tableStyle.colValue?.[value] || this.tableStyle.colValue?.[String(value)]
        ? { color: this.tableStyle.colValue[value] ?? this.tableStyle.colValue[String(value)] }
        : { color: this.tableStyle.colColor };
    }

    if (Array.isArray(this.tableStyle.options)) {
      const config = this.tableStyle.options.find((x: any) => x.colName === col);
      if (!config) return {};
      return config.colValue?.[value] || config.colValue?.[String(value)]
        ? { color: config.colValue[value] ?? config.colValue[String(value)] }
        : { color: config.colColor };
    }
    return {};
  }
}
