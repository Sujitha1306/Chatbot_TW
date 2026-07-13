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

import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppOtNewComponent } from '../app-ot-new/app-ot-new.component';
import { CommonService } from '../../../services';
import { FormControl } from '@angular/forms';
import { PorterRequestNewComponent } from '../porter-request/porter-request.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-card-management',
  templateUrl: './card-management.component.html',
  styleUrls: ['./card-management.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CardManagementComponent implements OnInit {

  @Input() cardData;
  @Input() statusCountInfo;
  @Input() selectedDate;
  @Input() visitTypeId = null;
  @Output() refreshCard = new EventEmitter<any>();;
  othersTowerList = [];
  checkboxSelected = new FormControl(null);
  testCat = new FormControl('all');
  currentStatus = null;
  currentYear = new Date().getFullYear();
  cardHeight: string;
  navfromtime: string; 
  tagDataInfo : any[];

  constructor(private readonly dialog: MatDialog,private readonly commonService: CommonService,private readonly _dateFormat: DatePipe) {
    this.setCardHeight();
   }

  ngOnInit(): void {
    this.getOtPatientQueueByStatus("QS-CO");
    this.checkboxSelected.valueChanges.subscribe((value: boolean) => {
      let status = value?"QS-PE":"QS-CO";
      this.currentStatus = status;
      this.getOtPatientQueueByStatus(status);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDate'] || changes['cardData']) {
      let status = this.checkboxSelected.value?"QS-PE":"QS-CO";
      this.getOtPatientQueueByStatus(status);
    }
  }


  getOtPatientQueueByStatus(status,testCategory?){
    this.othersTowerList = [];
    if(!testCategory){
      testCategory = this.testCat.value;
    }
    if(testCategory == 'all'){
      testCategory = null;
    }
    this.commonService.getOtPatientQueue(this.selectedDate,status,testCategory, this.visitTypeId).subscribe(res=>{
      if(res.statusCode == 1){
        this.othersTowerList = res.results;
        this.othersTowerList.forEach(obj => {
          obj['currentLoc'] = null;
          obj['navFromTime'] = null;
          if (obj.threats && obj.threats.length > 0) {
            obj.threatsTooltip = obj.threats.map((threat) => threat.name).join(",");
          } else {
            obj.threatsTooltip = null;
          }
        })
      }
    })
  }
  setCardHeight() {
    this.cardHeight = window.innerHeight - 212 + 'px'; 
  }

  // Optionally, update height on window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setCardHeight();
  }

  calculateAge(dob){
    let year = new Date(dob).getFullYear();
    return this.currentYear - year;
  }

  getOtCompletedCardInfo(testCategory,status){
    this.commonService.getOtCardSummary(this.selectedDate,testCategory,status).subscribe(res => {
      if(res.statusCode == 1){
        let categoryIndex = res.results.findIndex(res => res.testCategoryId == testCategory);
        if(categoryIndex != -1){
          if(res.results[categoryIndex]['tests'].length){
            let patients = res.results[categoryIndex]['tests'][0]['patients'];
            if(patients.length){
              this.otPatientInfo(patients[0],patients,true)
            }
          }
        }
      }
    });
  }

  otPatientInfo(cardData,patients,sideNav?){
    let data = {'selectedPatient':cardData,'patients':patients,'selectedDate':this.selectedDate,'sideNav':sideNav?sideNav:false, visitTypeId : this.visitTypeId ? this.visitTypeId : cardData.visitEventId}
    const dialogRef = this.dialog.open(AppOtNewComponent, {
      panelClass: ['medium-popup'], disableClose: true, data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshCard.emit();
    });
  }

  getCurrentLoc(tagId,index,indexJ?){
    if(tagId){
      let param = '/cloc=' + 1+'&tid='+tagId;
      this.commonService.getReportData('totaltimebylocv2', param).subscribe(res => {
        this.tagDataInfo = res.results;
          if(res.results.statusCode == 200){
            const timeStamp  = res.results.data[0].nav_fromtime;
            this.navfromtime = this._dateFormat.transform(timeStamp, 'hh:mm a')
            if(indexJ || indexJ == 0){
              this.cardData[index]['tests'][0]['patients'][indexJ]['currentLoc'] = null;
              this.cardData[index]['tests'][0]['patients'][indexJ]['currentLoc'] = res.results?.data[0]?.location_name;
              this.cardData[index]['tests'][0]['patients'][indexJ]['navFromTime'] = this.navfromtime;
              setTimeout(() =>  this.cardData[index]['tests'][0]['patients'][indexJ]['currentLoc'] = null, 7000);
            }else{
              this.othersTowerList[index]['currentLoc']= res.results?.data[0]?.location_name;
              this.othersTowerList[index]['navFromTime']= this.navfromtime;
              setTimeout(() =>  this.othersTowerList[index]['currentLoc'] = null, 7000);
            }
          }
      });
    }
  }

  porterRequestNew(data){ 
    const dialogRef = this.dialog.open(PorterRequestNewComponent, {
      data: { type: "PR-PA", id: data.id, name: data.name,  visitId : data.patientVisitId, visitEventId: data.visitEventId},
      panelClass: ['medium-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshCard.emit();
    });
  }
   fixClick() {
    console.log('')
  } 
}
