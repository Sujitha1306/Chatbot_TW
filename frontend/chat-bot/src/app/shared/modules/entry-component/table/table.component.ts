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
import { Component, Input, Output, OnChanges, EventEmitter, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CdkDetailRowDirective } from './cdk-detail-row.directive';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../common-dialog-component/common-dialog.component';


@Component({
  selector: 'app-table-component',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('*', style({ height: '*', visibility: 'visible' })),
      transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableComponent implements OnChanges {
    
    dataSource = new MatTableDataSource<any>();
    
    //displayedColumns = ['Location', 'Time']
    private openedRow: CdkDetailRowDirective
    public name : any = [];
    public uhid:any = [];
    public personType : string;
    public noRecords : any = [];
    public allData : any =[];
    public DataSource : any =[];
    public Paginator : any =[];
    public contactData : any =[];
    public header : any =[];
    public rowIndex;
    public selectedRowData;
    public subTableData : any;
    public displayedData = [];
    public subTableDisplayedData = [];
    public displayedColumns : any = [];
    public displayedColumns1 : any =[];
    public displayedColumns2 : any =[];
    public tagValue:any =[];
    public tagType:any = [];
    public selectedName : any ;
    public length = 1;
    @ViewChild('paginator1') paginator: MatPaginator;
    @Input() data: any;
    @Input() tableData : Promise<any>;
    @Input() index : any;
    @Input() id : any;
    @Input() displayedTableData : any;
    @Input() subDisplayedData : any;
    @Input() selectedType : any;
    @Output() shareRecords = new EventEmitter();
    @Output() Uhid = new EventEmitter();
    @Output() selectedUhid = new EventEmitter();
    @Output() selectedTagValue = new EventEmitter();
    @Output() selectedTagType = new EventEmitter();

    
    constructor(private readonly dialog: MatDialog) {
      }
    
    ngAfterViewInit(){
      for(let i=0;i<this.DataSource.length;i++){
        this.DataSource[i].paginator= this.paginator;
      }
    }
    ngOnChanges() {
      this.length = 1;
      if(this.id == 'pat-contact' || this.id == 'contact-tree'){
          if(typeof this.data !== 'undefined'){
            this.allData = [];
            this.name = [];
            this.uhid = [];

            this.contactData =  this.data;
            this.name.push(this.contactData.name);
            this.uhid.push(this.contactData.mainidentifier);
            this.allData.push(this.contactData.children);
            this.displayedData = this.displayedTableData;
            this.displayedColumns = this.displayedData.map(res => res.colName);  
            this.subTableDisplayedData = this.subDisplayedData;
            this.displayedColumns1 = this.subTableDisplayedData.map(res => res.colName);
            this.table();
          }   

      } else if(this.id == 'emp-contact'){
        this.displayedColumns =  ['Contact Name', 'Contact ID','Close contact', 'Gender', 'Mobile No','Event date', 'From Time','To Time', 'Contact Type','Duration', 'Count', 'Floor Name', 'Location Name'];
         this.displayedColumns1 = ['From Time', 'To Time','Duration', 'Location Name','Floor Name','Close Contact'];
        if(this.index < 1){
          if(typeof this.data !== 'undefined'){
            this.allData = [];
            this.name = [];
            this.uhid = [];
            this.tagValue =[];
            this.contactData =  this.data;
            this.name.push(this.contactData[0].Name);
            this.uhid.push(this.contactData[0].UHID);
            this.tagValue.push(this.contactData[0].tag_value)
            if(this.selectedType == 'visitor'){
              this.tagType.push('TAT-VS')
            } else {
              this.tagType.push('TAT-EM')
            }
            this.allData.push(this.contactData);
            this.table();
          }   
        }
        else{
  
          let records = this.tableData;
          this.name[this.rowIndex+1] = this.selectedRowData['Contact Name'];
          // this.uhid[this.rowIndex+1] = this.selectedRowData['Contact UHID'];
          this.uhid[this.rowIndex+1] = this.selectedRowData['Contact ID'];
          this.tagValue[this.rowIndex+1] = this.selectedRowData['con_tag_value'];
          this.tagType[this.rowIndex+1] = this.selectedRowData['Tag Type'];
          this.allData[this.rowIndex+1] = records;
          this.name.length = this.rowIndex+2;
          this.uhid.length = this.rowIndex+2;
          this.tagValue.length = this.rowIndex+2;
          this.tagType.length = this.rowIndex+2;
          this.allData.length = this.rowIndex+2;
          this.table();
        }
      } else if(this.id == 'staff-contact'){
        this.displayedColumns =  ['Contact Name', 'Contact ID','Close contact', 'Gender', 'Mobile No','Event date', 'From Time','To Time', 'Contact Type','Duration', 'Count', 'Floor Name', 'Location Name'];
         this.displayedColumns1 = ['From Time', 'To Time','Duration', 'Location Name','Floor Name','Close Contact'];
        if(this.index < 1){
          if(typeof this.data !== 'undefined'){
            this.allData = [];
            this.name = [];
            this.uhid = [];
            this.tagValue =[];
            this.contactData =  this.data;
            this.name.push(this.contactData[0].Name);
            this.uhid.push(this.contactData[0].UHID);
            this.tagValue.push(this.contactData[0].tag_value)
            // if(this.selectedType == 'visitor'){
            //   this.tagType.push('TAT-VS')
            // } else {
            //   this.tagType.push('TAT-EM')
            // }
            this.allData.push(this.contactData);
            this.table();
          }   
        }
        else{

          let records = this.tableData;
          this.name[this.rowIndex+1] = this.selectedRowData['Contact Name'];
          // this.uhid[this.rowIndex+1] = this.selectedRowData['Contact UHID'];
          this.uhid[this.rowIndex+1] = this.selectedRowData['Contact ID'];
          this.tagValue[this.rowIndex+1] = this.selectedRowData['con_tag_value'];
          this.tagType[this.rowIndex+1] = this.selectedRowData['Tag Type'];
          this.allData[this.rowIndex+1] = records;
          this.name.length = this.rowIndex+2;
          this.uhid.length = this.rowIndex+2;
          this.tagValue.length = this.rowIndex+2;
          this.tagType.length = this.rowIndex+2;
          this.allData.length = this.rowIndex+2;
          this.table();
        }
      }
      else {
          this.allData = [];
          this.contactData =  this.data;
          this.allData.push(this.contactData);
          this.table();
      }
      if(this.id == 'OT-Rep' || this.id == 'DC-utilz' || this.id == 'porter-pharmacy' || this.id == 'multi-porter' || this.id == 'ambulance-conn-devices' || this.id == 'ambulance-conndev-alert' || this.id == 'emp-ccd-agg' || this.id == 'asset-util-patient' || this.id == 'infant-alert' || this.id == 'stf-routin-sumary' || this.id == 'task-activity-compliance' || this.id == 'staff-tracking' || this.id == 'pat-routin-sumary' || this.id == 'ER-Rep-new' || this.id == 'tat-by-shift' || this.id == 'porter-req-det'){
        this.length = 0;
      }
    }
   
    onToggleChange(cdkDetailRow: CdkDetailRowDirective,row) : void {
        if (this.openedRow && this.openedRow.expended && this.id != 'stf-routin-sumary' && this.id != 'task-activity-compliance' && this.id != 'staff-tracking' && this.id != 'pat-routin-sumary') {
          this.openedRow.toggle();      
        } 
        if(!row.close)
        {
          row.close = true;
        } 
        else { 
          row.close = false;
        }
        this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
      }

    rowClick(data,i) {
      if(this.id == 'emp-contact' || this.id == 'pat-contact'){
        this.subTableData = data.children;
        this.selectedName = data['Contact ID'];
        this.rowIndex = i;
        this.selectedRowData = data;
        this.name.length = this.rowIndex+1;
        this.uhid.length = this.rowIndex+1;
        this.allData.length = this.rowIndex+1;
        if(data['Tag Type'] == 'TAT-VS'){
          this.personType = 'visitor';
        } else {
          this.personType = 'Employee';
        }
        this.selectedUhid.emit([data['Contact ID'],this.personType]);
      } else if(this.id == 'staff-contact'){
        this.subTableData = data.children;
        this.selectedName = data['Contact ID'];
        this.rowIndex = i;
        this.selectedRowData = data;
        this.name.length = this.rowIndex+1;
        this.uhid.length = this.rowIndex+1;
        this.allData.length = this.rowIndex+1;
        // if(data['Tag Type'] == 'TAT-VS'){
        //   this.personType = 'visitor';
        // } else {
        //   this.personType = 'Employee';
        // }
        this.selectedUhid.emit([data['Contact ID'],this.personType]);
      } else if(this.id == 'contact-tree'){
        this.subTableData = data.history;
        this.rowIndex = i;
        this.selectedRowData = data;
        this.name.length = this.rowIndex+1;
        this.uhid.length = this.rowIndex+1;
        this.allData.length = this.rowIndex+1;
        this.name[this.rowIndex+1] = this.selectedRowData['name'];
        this.uhid[this.rowIndex+1] = this.selectedRowData['mainidentifier'];
        this.allData[this.rowIndex+1] = data.children;
        this.table();  
      } else if(this.id == 'stf-routin-sumary' || this.id == 'pat-routin-sumary' || this.id == 'task-activity-compliance' || this.id == 'staff-tracking'){
        this.subTableData = data.children;
        if(data.children.length){
          let keyCheck = Object.keys(data.children[0])[0];
          if(keyCheck == 'Routine'){
            this.displayedColumns2 = Object.keys(data.children[0]['children'][0]);
          }
        }
      }else{
        this.subTableData = data.children;
      }  
  }

   table()
   {
       for(let i=0;i<this.uhid.length;i++){
         if(i==0){
          this.header[i] = this.name[i] +'('+this.uhid[i] +')'+ ' ';
         }else{
           this.header[i] = this.header[i-1]+'>>' + this.name[i] + ' '+'('+this.uhid[i]+')'+' '
         }
       }
       this.DataSource = [];
       this.Paginator = [];
       for(let i=0;i<this.allData.length;i++)
       {
         if(typeof this.allData[i] !== 'undefined' && this.allData[i].length > 0){
          if(this.id != 'pat-contact' && this.id != 'contact-tree' && this.id != 'emp-contact' && this.id != 'staff-contact' && this.id != 'emp-ccd-agg' && this.id != 'staff-site-nav' && this.id != 'mov-rep' && this.id != 'stf-routin-sumary' && this.id != 'pat-routin-sumary' && this.id != 'task-activity-compliance' && this.id != 'staff-tracking'){
            this.displayedColumns = Object.keys(this.allData[i][0]);  
            this.displayedColumns.pop();
            if(this.allData[i][0]['children'].length > 0){
              this.displayedColumns1 = Object.keys(this.allData[i][0]['children'][0]);
            }
          } else if(this.id == 'staff-site-nav'){
            this.displayedColumns = Object.keys(this.allData[i][0]);  
            this.displayedColumns.splice(0,1);
            this.displayedColumns.pop();
            this.displayedColumns1 = Object.keys(this.allData[i][0]['children'][0]);
          } else if(this.id == 'mov-rep'){
            this.displayedColumns = Object.keys(this.allData[i][0]);  
            this.displayedColumns.splice(0,1);
            this.displayedColumns.pop();
            this.displayedColumns1 = Object.keys(this.allData[i][0]['children'][0]);
          } else if(this.id == 'emp-ccd-agg'){
            this.displayedColumns = Object.keys(this.allData[i][0]); 
            let index1 = [this.displayedColumns.indexOf('children'), this.displayedColumns.indexOf('Visit start time'), this.displayedColumns.indexOf('close')]
            for(let i = index1.length -1; i >= 0; i--){
              if(index1[i] > -1){
                this.displayedColumns.splice(index1[i], 1)
              }
            }
            this.displayedColumns1 = Object.keys(this.allData[i][0]['children'][0]);
            let index2 = this.displayedColumns1.indexOf('close')
            if(index2 > -1){
              this.displayedColumns1.splice(index2, 1)
            }
          } else if(this.id == 'stf-routin-sumary' || this.id == 'pat-routin-sumary' || this.id == 'task-activity-compliance' || this.id == 'staff-tracking'){
            this.displayedColumns = Object.keys(this.allData[i][0]);  
            this.displayedColumns.pop();
            let childColumn = this.allData[i].filter(val => val['children'].length)
            this.displayedColumns1 = Object.keys(childColumn[0]['children'][0]);
            if(this.id == 'staff-tracking'){
              this.displayedColumns.pop();
              this.displayedColumns.push('Navigation');
              this.displayedColumns = this.displayedColumns.filter(val => val !== 'is_dummy');
              this.displayedColumns = this.displayedColumns.filter(res => res!='floor_id' && res!='request_detail_id' && res!='Tag type');
              this.displayedColumns1 = this.displayedColumns1.filter(res => res!='location_id');
            }
            if(this.id != 'staff-tracking'){
              this.displayedColumns1.pop();
            }
          }
          this.noRecords[i] = false;
          this.dataSource=this.allData[i];
          // this.dataSource.paginator = this.paginator;
          this.DataSource.push(new MatTableDataSource(this.allData[i]));
          // this.DataSource[i].paginator = this.paginator;
          // console.log("this.paginator",this.DataSource[i].paginator);
          // this.Paginator.push(this.allData[i].length);

         }
        else{
          this.noRecords[i] = true;
        }
       }

       if(this.id == 'pat-contact' || this.id == 'contact-tree'){
        this.shareRecords.emit(this.allData);
        this.selectedUhid.emit(this.uhid)
       }
       if(this.id =='emp-contact'){
        this.shareRecords.emit(this.allData);
        this.selectedTagValue.emit(this.tagValue);
        this.Uhid.emit(this.uhid);
        this.selectedTagType.emit(this.tagType);
      }
      if(this.id =='staff-contact'){
        this.shareRecords.emit(this.allData);
        this.selectedTagValue.emit(this.tagValue);
        this.Uhid.emit(this.uhid);
        // this.selectedTagType.emit(this.tagType);
      }
       
   } 
   public eventTrigger(element){
    let data = {
      floorId : element.floor_id,
      blockId : null,
      type : "track",
      data : element
    }
    const dialogRef = this.dialog.open(CommonDialogComponent, { data: data,
      panelClass: ['medium-popup'], disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
    });
   }
  fixClick() {
    console.log('')
  }
}
