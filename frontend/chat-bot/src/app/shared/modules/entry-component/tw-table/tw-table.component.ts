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
import { SelectionModel } from '@angular/cdk/collections';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  EventEmitter,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonService } from '../../../services/common.service';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ListLoaderService } from '../../../services/list-loader.service';

@Component({
  selector: 'tw-table-component',
  templateUrl: './tw-table.component.html',
  styleUrls: ['./tw-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TwTableComponent implements OnChanges {
  public showTable = false;
  dataSource = new MatTableDataSource<any>();
  TWDisplayedData: any;
  TWDisplayedColumns: any;
  public userId = localStorage.getItem(btoa('userId'));
  height: number;
  type = null;
  id = null;
  isChecked = false;
  @Input() enableSlicing: boolean = false;
  @Input() enableScroll: boolean = false;
  @Input() tableData: any;
  @Input() columns: any;
  @Input() component: any;
  @Input() subcomponent: any;
  @Input() iconHeader: any;
  @Input() iconColumn: any;
  @Input() eventColumn: any;
  @Input() sortColumn: any;
  @Input() applyFilter: any;
  @Input() page: any = true;
  @Input() rowClick: boolean;
  @Input() rowOver: boolean;
  @Input() selectedName: any;
  @Input() rowDbClick: boolean;
  @Input() rowId: any;
  @Input() permissionControl: any;
  @Input() pagination: any;
  @Input() colColor: any = null;
  @Input() rowColor: any = null;
  @Input() tableClass: any = null;
  @Input() tableSize: any = '190px';
  @Input() dateTimeColumns: any = [];
  @Input() dateColumns: any = [];
  @Input() timeColumns: any = [];
  @Input() fixedColumns: any = [];
  @Input() fixedColumnsAtEnd : any =[];
  @Output() eventAction = new EventEmitter<any>();
  @Output() rowClickAction = new EventEmitter<any>();
  @Output() rowDbClickAction = new EventEmitter<any>();
  @Output() checkBoxAction = new EventEmitter<any>();
  @Output() overEventAction = new EventEmitter<any>();
  @Output() overInterval = new EventEmitter<any>();
  public rowClickId = null;
  public activate_btn: any = [];
  public enableAction = false;
  public matTooltipVal = [];
  public bindedTable = false;
  public mouseOver = false;
  public mouseOverAction: any;
  public mouseOverData: any;
  public dateTimeFormat = "dd MMM yyyy,HH:mm"
  public dateFormat = "dd MMM yyyy"
  public timeFormat = "HH:mm:ss"
  selection = new SelectionModel<any>(true, []);
  public pageLength = null;
  public pageSize = null;
  public pageStart = 0;
  menuTopLeftPosition =  {x: 0, y: 0}
  currentindex: any;
  show ; 
  visibledata: any;
  toggleOptions: any;
  clickedRowId: any;
  eventlistInfo: any[] = [];
  visibleData: any[] = [];
  currentIndex = 0;
  CHUNK = 15;
  ticketStatusFlow = null;
  chartOptions = {};
  menuData: any;
  @ViewChild(MatSort)
  set sort(value: MatSort) {
    if(this.component !== 'staffRoutine' && this.component !== 'student') {
      this.dataSource.sort = value;
    }
  }
  width: any;
  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    this._paginator = value;
    if(this.pagination === null) {
      this.dataSource.paginator = value;
    }
  }
  private _paginator: MatPaginator;
  constructor(public dialog: MatDialog, public commonService: CommonService , public listLoader : ListLoaderService) {
    this.activate_btn = this.commonService.getActivePermission('button');
    this.getChartOptions()
  }

  @ViewChild('clickHoverMenuTrigger') hoverMenu: MatMenuTrigger;

  ngOnInit() {
    const dateConfig = localStorage.getItem('dateFormatConfig');
    if (dateConfig) {
      const format = JSON.parse(dateConfig);
      this.dateFormat = format.dateFormat;
      this.dateTimeFormat = format.dateTimeFormat;
      this.timeFormat = format.timeFormat;
    } else {
      this.commonService.getConfigFile('date-format').subscribe(res => {
        if (res.results) {
          const format = res.results.contentObject;
          this.dateFormat = format.dateFormat;
          this.dateTimeFormat = format.dateTimeFormat;
          this.timeFormat = format.timeFormat;
          localStorage.setItem('dateFormatConfig', JSON.stringify(format));
        }
      });
    }
  }


  // onWindowResized(size) {
  //   if (this.component === 'task') {
  //     this.height = size - 76;
  //   } else if ((this.component === 'medicalRecord' || this.component === 'inpatient' ||
  //     this.component === 'ot' || this.component === 'staffRoutine') && window.innerWidth > 850) {
  //     this.height = size + 32;
  //   } else if (window.innerWidth <= 850) {
  //     if(this.component === 'medicalRecord' || this.component === 'inpatient' || 
  //     this.component === 'ot' || this.component === 'staffRoutine'){
  //      this.height = size + 5;
  //     } else {
  //      this.height = size - 24;
  //     }
  //   } else {
  //     this.height = size;
  //   }
  // }

  ngOnChanges(changes: SimpleChanges) {

    if(this.pagination !== null && this.pagination) {
      this.pageLength = this.pagination[0].length;
      this.pageSize = this.pagination[0].pageSize;
      if (this.pagination[0].hasOwnProperty('pageStart')) {
        this.pageStart = this.pagination[0].pageStart;
        if (this._paginator) {
          this._paginator.pageIndex = this.pageStart;
        }
      }
      this.currentindex = (this.pageStart * this.pageSize)+this.pageSize; 
      const el = document.querySelector('.tw-mat-table-overflow');
      if (el) {
        el.scrollTop = 0;
      }
    }
    this.rowClickId = null;
    const checkPermission = this.permissionControl.filter(item => this.activate_btn.indexOf(item) > -1);
    if (checkPermission.length > 0) {
      this.enableAction = true;
    }
    // if (this.component === 'porter') {
    //   this.height = window.innerHeight - 270;
    // } else if (this.component === 'ot') {
    //   this.height = window.innerHeight - 210;
    // } else if (this.component === 'medicalRecord') {
    //   this.height = window.innerHeight - 230;
    // } else {
    //   this.height = window.innerHeight - 170;
    // }
    // if (window.innerWidth < 1240) {
    //   this.width = window.innerWidth - 50;
    // } else {
    //   this.width = window.innerWidth - 20;
    // }
    if (this.tableData) {
      if (changes.tableData && this.enableSlicing === false && this.enableScroll === false) {
        this.selection.clear()
        this.checkBoxAction.emit(this.selection.selected);
        this.showTable = false;
        if (changes.tableData.previousValue !== changes.tableData.currentValue) {
          if (this.showTable == false) {
            const data = this.tableData;
            this.showTable = true;
            this.dataSource = new MatTableDataSource(data);
            this.TWDisplayedColumns = this.columns;
            if(this.pagination === null) {
              this.dataSource.paginator = this.pagination;
            }
            if(this.component !== 'staffRoutine' && this.component !== 'student') {
              this.dataSource.sort = this.sort;
            }
          }
        }
      }

      if((changes.tableData || changes.pagination) && (this.enableSlicing)) {
        this.listData(this.pageSize,changes,this.pageStart)
       }
       
         if ((changes.tableData || changes.pagination) && this.enableScroll) {
              if (this.enableSlicing) {
                  this.listData(this.pageSize,false,this.pageStart)
              } else {
                    if (this.showTable == false) {
                      this.visibleData= this.tableData.slice(0,15);
                      this.showTable = true;
                      this.dataSource = new MatTableDataSource(this.visibledata);
                      this.dataSource.data =this.visibleData
                      this.TWDisplayedColumns = this.columns;
                      if(this.pagination === null) {
                        this.dataSource.paginator = this.pagination;
                      }
                      this.currentIndex = 15
                 
          }
              const el = document.querySelector('.tw-mat-table-overflow');
              if (el) el.scrollTop = 0;
            }
            return;
         }
       
      if (changes.applyFilter) {
        if (changes.applyFilter.previousValue !== changes.applyFilter.currentValue) {
          if (changes.applyFilter.currentValue !== undefined && changes.applyFilter.currentValue !== null) {
          // if (changes.applyFilter.currentValue !== undefined && changes.applyFilter.currentValue !== null && changes.applyFilter.currentValue.length > 2) {
            this.applyFilter = this.applyFilter.trim();
            this.applyFilter = this.applyFilter.toLowerCase();
            this.applyFilter = this.applyFilter;
            if(this.enableSlicing||this.enableScroll){
            this.visibledata = this.tableData.filter(item => {
                return Object.values(item).some(val =>
                  val !== null &&
                  val !== undefined &&
                  val.toString().toLowerCase().includes(this.applyFilter.toLowerCase())
                );
              });
              this.listData(this.pageSize,true,this.pageStart)
          }else{
             this.dataSource.filter = this.applyFilter;
          }
        }
          else if (changes.applyFilter.currentValue === undefined || changes.applyFilter.currentValue === null || changes.applyFilter.currentValue.length === 0) {
          // else if (changes.applyFilter.currentValue === undefined || changes.applyFilter.currentValue === null || changes.applyFilter.currentValue.length === 0
          //   || changes.applyFilter.currentValue.length <= 2) {
            this.dataSource.filter = null;
          }
        }
      } else if (changes.applyFilter === undefined && this.applyFilter !== undefined && this.applyFilter !== null && this.applyFilter !== '' && this.component === 'medicalRecord') {
          this.applyFilter = this.applyFilter.trim();
          this.applyFilter = this.applyFilter.toLowerCase();
          this.applyFilter = this.applyFilter;
          this.dataSource.filter = this.applyFilter;
      }
    }
    if (this.ticketStatusFlow === null && this.component === 'task') {
      const requestConfig = localStorage.getItem('request-config');
      if (requestConfig) {
        const configData = JSON.parse(requestConfig);
        this.ticketStatusFlow = configData?.['TAC-TKT'] ?? 'Non-Task';
      } else {
        this.commonService.getConfigFile('request-config').subscribe(res => {
          if (res.results) {
            let configData = res.results['contentObject'];
            this.ticketStatusFlow = configData?.['TAC-TKT'] ?? 'Non-Task';
            localStorage.setItem('request-config', JSON.stringify(configData));
          }
        });
      }
    }
    // this.CheckedScroll();
  }
  getChartOptions() { 
    this.chartOptions = { "layout": { "padding": { "top": 0, "left": 0, "right": 0, "bottom": 0 } }, "legend": { "labels": { "usePointStyle": false }, "display": true, "position": "top" }, "scales": { "x": { "grid": { "display": false }, "ticks": { "display": true, "beginAtZero": true }, "title": { "text": "Count", "display": false }, "display": false, "barThickness": 20 }, "y": { "grid": { "display": false }, "ticks": { "display": false, "beginAtZero": true }, "title": { "text": "Weakly", "display": false }, "display": false } }, "plugins": { "zoom": { "pan": { "mode": "x", "enabled": true, "scaleMode": "y" }, "zoom": { "mode": "x", "pinch": { "enabled": true }, "wheel": { "enabled": true }, "scaleMode": "y" } }, "datalabels": { "display": false }, "legend": { "display": true } }, "indexAxis": "y", "animations": { "tension": { "to": 0, "from": 1, "loop": true, "easing": "easeInOutBounce", "duration": 1000 } }, "responsive": true, "maintainAspectRatio": false } 
  }

  eventTrigger(key, data, patientId?: number) {
    if (this.component === 'appterm') {
      this.rowClickId = (data.hasOwnProperty('id') && data.hasOwnProperty('childCode')) || (data.hasOwnProperty('id') && data.hasOwnProperty('languageCode')) ? data?.id : data?.Code;
    }
    this.eventAction.emit({ key, data, patientId });
  }
  matTooltipAction(event, component) {
    this.id = event.assetId;
    this.type = 'Asset';
    this.commonService.getLiveLocation(this.type, this.id).subscribe(res => {
      if (res.results !== null) {
        this.matTooltipVal = res.results;
      }
    });
  }
  rowClickEvent(data) {
    if (
      this.rowClickId !== data[this.rowId] &&
      this.component !== 'asset' &&
      this.component !== 'health-test' &&
      this.component !== 'location-mapping'
    ) {
      this.rowClickId = data[this.rowId];
    } else {
      this.rowClickId = null;
    }
    this.rowClickAction.emit(data);
  }
  rowOverEvent(data,event: MouseEvent){
    if(this.rowOver === true) {
      this.mouseOverData = data;
      this.mouseOver = true;
      this.rowClickId = data[this.rowId];
      this.hoverMenu.openMenu();
      this.getMouseOverList();
      this.menuTopLeftPosition.x = event.clientX;
      this.menuTopLeftPosition.y = event.clientY;
      this.overInterval.emit(true);
    }
  }
  rowHideEvent(data){
    if(this.rowOver === true) {
      this.mouseOver = false;
      this.rowClickId = null;
      this.hoverMenu.closeMenu();
      this.overInterval.emit(false);
    }
  }
  getCellStyles(col: string, element: any, component: string): { [klass: string]: string } {
    const alertTypeColors: any = {
      'Critical': '#ED5135',
      'Reminder': '#288EE9',
      'Warning': '#FF7200',
      'Info': '#4BB1CF'
    };

    const styles: { [klass: string]: string } = {'border' : '1px solid red'};

    // Color
    if (col === 'Alert Type' && element['Alert Type'] && alertTypeColors[element['Alert Type']]) {
      styles['color'] = alertTypeColors[element['Alert Type']];
      styles['font-weight'] = '600';
    }

    // Text Alignment
    if (
      ['Length of stay', 'Porter Count', 'Weightage', 'Report Collected'].includes(col) ||
      (col === 'Location' && component === 'ambulance')
    ) {
      styles['text-align'] = 'center';
    }

    // Padding
    if (col === 'ID') {
      styles['padding-left'] = '5px';
    }

    // Widths
    if (['Gender', 'Age', 'Id'].includes(col)) {
      styles['width'] = '5%';
    } else if ((col === 'Device' && component === 'asset-management') || col === 'ID') {
      styles['width'] = '2%';
    }

    // Min-width
    if (col === 'Nurse Call' && !['staffRoutine', 'student'].includes(component)) {
      styles['min-width'] = '180px';
    } else if (col === 'Alert' && !['staffRoutine', 'student', 'alertInfo'].includes(component)) {
      styles['min-width'] = '160px';
    }

    // Max-width & overflow
    const needsClipping = (
      ((['Description', 'Pickup', 'Drop', 'Remarks', 'Requester'].includes(col)) && component === 'porter') ||
      ((['Pickup', 'Drop'].includes(col)) && component === 'ambulance') ||
      (col === 'Message' && ['alert-management', 'messageCenteroaster'].includes(component)) ||
      (col === 'Surgery Name' && component === 'ot')
    );

    if (needsClipping) {
      styles['max-width'] = 
        (col === 'Requester' && component === 'porter') ? '75px' :
        (col === 'Surgery Name' && component === 'ot') ? '120px' :
        '250px';
      styles['overflow'] = 'hidden';
      styles['text-overflow'] = 'ellipsis';
      styles['white-space'] = 'nowrap';
    }

    // Specific wrap case
    if (col === 'Porter Pool / Location' && component === 'task') {
      styles['white-space'] = 'wrap';
    }

    return styles;
  }

  headerEventTrigger(key, data, keyVal) {
    keyVal = this.mouseOverData;
    this.overEventAction.emit({ key, data, keyVal });
  }
  rowDbClickEvent(data) {
    this.rowDbClickAction.emit(data);
  }
  checkboxEvent(event: MatCheckboxChange, type, row?) {
    this.isChecked = event.checked;
    if(type == 'row') {
        this.selection.toggle(row)
        this.checkBoxAction.emit(this.selection.selected);
    } else if (type == 'all') {
      this.masterToggle();
    }
  }
  isAllSelected() {
    if(this.component === 'layout') {
    let id
    const numSelected = this.selection.selected.length;
    for(let i = 0; i < this.selection.selected.length; i++) {
      id = Array.prototype.map.call(this.selection.selected, gId => gId.id);
      
    }
    this.checkBoxAction.emit(id);
    if (this.dataSource && this.dataSource.data.length) {
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }
    } else {
      const numSelected = this.selection.selected.length;
      this.checkBoxAction.emit(this.selection.selected);
      if (this.dataSource && this.dataSource.data.length) {
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
      }
    }
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
  getCurrentLocation(row) {
    let details = {
      floorId: row.floorId,
      tagSerialNumber: row.tagId,
      tagTypeId: row.tagAssociationTypeId,
      tagAssociatedId : row.mrRequestDetailId,
      type:'globalSearch'
    }

    const dialogRef = this.dialog.open(CommonDialogComponent, {
      data: details,
      panelClass: ["medium-popup"],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
  getMouseOverList() {
    const permissions = JSON.parse(localStorage.getItem('permission'));
    const menuItemsList = permissions['menuItems'].filter(res => res.code === "MN_OT");
    const submenusList = menuItemsList[0]['subMenus'].filter(res => res.code === "MN_OTIP");
    const tempId = submenusList[0]['id'];
    this.mouseOverAction = permissions['dropdown'].filter(res => res.parentId === tempId);
  }
  listData( size, changes,start) {
    const pageStart = start * size
    const pageSize = pageStart + size
    this.selection.clear()
    this.showTable = false;
    if (this.showTable == false) {
      if(changes ===  true ){
       this.visibledata = this.visibledata.slice(pageStart,pageSize) 
      }else{
      this.visibledata = this.tableData.slice(pageStart,pageSize)
      }
      this.showTable = true;
      this.dataSource = new MatTableDataSource(this.visibledata);
      // this.currentindex = this.visibledata.length
      this.TWDisplayedColumns = this.columns;
      if (this.pagination === null) {
        this.dataSource.paginator = this.pagination;
      }
    }
  }

  
  close(event) {
    if(!event) {
      this.rowClickId = null;
      this.rowClickAction.emit(null);
    }
  }


  onTableScroll(event: Event): void {
    if (!this.enableScroll) return;

    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
    if (!atBottom || this.visibleData.length >= this.pageSize) return;

    const nextIndex = Math.min(this.currentIndex + this.CHUNK, this.pageSize);

    const base = this.enableSlicing
      ? this.tableData.slice(this.pageStart * this.pageSize)
      : this.tableData;
    const chunk = base.slice(this.currentIndex, nextIndex);

    this.visibleData = [...this.visibleData, ...chunk]
    this.currentIndex = nextIndex;
    this.dataSource.data = this.visibleData;
  }
  fixClick() {
    console.log('')
  }

  loadingMap: { [key: string]: boolean } = {};

  toggleOption(col: string, element: any,key) {
    const id = element?.id;

    this.loadingMap[id] = true;


    this.syncToggle(col, element,key).then(() => {
      this.loadingMap[id] = false;
    });
  }

  async syncToggle(col: string, element: any,key): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    element[col] = element[col] === 'Close' ? 'Open' : 'Close';
    this.eventAction.emit({ col, element,key});
  }

  canToggle(element: any): boolean {
    return element?.identifyingId === 'ON_ON' || element?.identifyingId === 'OFF_OFF';
  }

  onMenuToggle(value) {
    if (value?.length) {
      this.eventlistInfo = value;
    } else {
      this.eventlistInfo = [];
    }
}

  CheckedScroll() {
    setTimeout(() => {
      // if (this.selectedRowId) {
      //   this.scrollToRow(this.selectedRowId);
      // }
    }, 300);
  }

  scrollToRow(id: any) {
    console.log('id', id)
    const rowIndex = this.tableData.findIndex(x => x.id == id);
    if (rowIndex >= 0) {
      const rowElem = document.getElementById(`row-${id}`);
      rowElem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
showTooltip(event: MouseEvent) {
  const cell = (event.target as HTMLElement).closest('td'); 
  const rect = cell.getBoundingClientRect(); 
  const tooltipHeight = 180;
  const tooltipWidthEstimate = 150;
  let left = rect.left + rect.width / 2 - tooltipWidthEstimate / 2;

  left = Math.max(5, Math.min(left, window.innerWidth - tooltipWidthEstimate - 5));
  document.documentElement.style.setProperty('--cell-left', `${left}px`);

  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < tooltipHeight) {
    document.documentElement.style.setProperty('--cell-top', `${rect.top - tooltipHeight - 10}px`);
  } else {
    document.documentElement.style.setProperty('--cell-top', `${rect.bottom + 5}px`);
  }

  this.show = true;
}

hideTooltip() {
  this.show = false;
}

trackByRowId(index: number, item: any) {
  // console.log(index)
  // console.log(item)
  // console.log(this.rowId)
  return item?.[this.rowId] ?? item?.id;
}


isFixed(col: string): boolean {
  return this.fixedColumns?.includes(col);
}

  resetScroll(data: any[]) {
  this.currentIndex = this.CHUNK;
  this.visibleData = data.slice(0, this.CHUNK);
  this.dataSource.data = this.visibleData;
}


  setMenuData(item: any) {
    this.menuData = item;
  }

}
