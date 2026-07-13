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

import { Component,   Inject,  OnInit, Pipe, PipeTransform,  ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonService, } from '../../../../shared';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { AppToastService } from '../../../../shared/services/toaster.service';

@Component({
  selector: 'app-kyn-user',
  templateUrl: './kyn-user.component.html',
  styleUrls: ['./kyn-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KynUserComponent implements OnInit {
  public profileImg = null;
  public selectedIndex = 1;
  public showTable = false;
  public selectedBtn = 'CON-VID';
  public klips: any = 0;
  public notice: any = 0;
  public post: any = 0;;
  public telekast: any = 0;;
  duration = 2;
  videoContent: any = [];
  PostContent: any = [];
  noticeContent: any = [];
  shortsContent: any = [];
  scheduleContent: any = [];
  LiveContent: any = [];
  onDemandContent: any = [];
  visibilityFilter = [{id: 'created', Value: 'Created'},{id: 'published', Value: 'Published'},{id: 'deleted', Value: 'Deleted'}];
  public contentBtns = [{ 'value': 'Post', 'code': 'CON-PST' }, { 'value': 'Notices', 'code': 'CON-NOT' }, { 'value': 'Telekast', 'code': 'CON-VID' }, { 'value': 'Klips', 'code': 'CON-SHO' },
  { 'value': 'Schedule Request', 'code': 'SCH-RQ' }, { 'value': 'Live Telekast', 'code': 'LIV-RQ' }];
  displayedData = [
    { 'colName': 'thumbnail', 'title': '', 'dataName': 'thumbnailUrl' },
    { 'colName': 'title', 'title': 'Title', 'dataName': 'title' },
    // { 'colName': 'Visibility', 'title': 'Visibility', 'dataName': 'Visibility' },
    { 'colName': 'description', 'title': 'Reason', 'dataName': 'description' },
    { 'colName': 'publishedAt', 'title': 'Date', 'dataName': 'publishedAt' },
    { 'colName': 'viewCount', 'title': 'View', 'dataName': 'viewCount' },
    // { 'colName': 'Action', 'title': '', 'dataName': 'Action' },
  ];
  VideoDisplayedColumns: string[] = this.displayedData.map(res => res.colName);
  ContentDataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  contentData: any[];
  videoType = 'video';
  contentId: any;
  public activate_btn: any = [];
  locationList: any = [];
  categoriesList: any = [];
  locationData: any;
  CategorieData: any;

  constructor(public toastr: AppToastService, public thisDialogRef: MatDialogRef<KynUserComponent>,
    public datepipe: DatePipe, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly commonService: CommonService,) { 
      this.activate_btn = this.commonService.getActivePermission('button');
      console.log(this.activate_btn)
      if(this.activate_btn && this.activate_btn.indexOf('BT_RPDL') > -1) {
        this.displayedData.push({ 'colName': 'Action', 'title': '', 'dataName': 'Action' });
        this.VideoDisplayedColumns = this.displayedData.map(res => res.colName);
      }
    }

  ngOnInit(): void {
    this.getAllContents();
  }

  tabClick(event) {
    this.selectedIndex = event.index;
    if(this.selectedIndex === 0){
      this.getAllOverView();
    } else {
      this.klips = 0;
      this.notice = 0;
      this.post = 0;
      this.telekast = 0;
    }
  }

  applyFilter(filterValue){
    this.ContentDataSource.filter = filterValue.trim().toLowerCase();
  }
  enableTable() {
    this.ContentDataSource = new MatTableDataSource(this.contentData);
    this.ContentDataSource.paginator = this.paginator;
    this.ContentDataSource.sort = this.sort;
    this.showTable = true;
  }
  
  getAllContents() {
    this.contentView(this.selectedBtn, true);
  }
  contentView(code, reload = false) {
    this.selectedBtn = code;
    this.showTable = false;
    if (this.selectedBtn === 'CON-PST') {
      this.commonService.getKynPostContent(this.data.Id).subscribe(res => {
        this.PostContent = res.results.data['value'];
        this.contentData = this.PostContent;
        this.enableTable();
        this.videoType = 'post'
      });
    } else if (this.selectedBtn === 'CON-NOT') {
      this.commonService.getKynNoticeContent(this.data.Id).subscribe(res => {
        this.noticeContent = res.results.data['value'];
        this.contentData = this.noticeContent;
        this.enableTable();
        this.videoType = 'journal'
      });
    } else if (this.selectedBtn === 'CON-VID') {
      this.commonService.getKynVideoContent(this.data.Id).subscribe(res => {
        this.videoContent = res.results.data['value'];
        this.profileImg =  this.videoContent.length ? this.videoContent[0]['userProfile'] : null;
        this.contentData = res.results.data['value'];
        this.enableTable();
        this.videoType = 'video'
      });
    } else if (this.selectedBtn === 'CON-SHO') {
      this.commonService.getKynShortsContent(this.data.Id).subscribe(res => {
        this.shortsContent = res.results.data['value'];
        this.contentData = res.results.data['value'];
        this.enableTable();
        this.videoType = 'shorts'
      });
    } else if (this.selectedBtn === 'SCH-RQ') {
      this.commonService.getScheduleRequest(this.data.Id).subscribe(res => {
        this.scheduleContent = res.results['data'];
        this.contentData = res.results['data'];
        this.enableTable();
      })
      
    } else if (this.selectedBtn === 'LIV-RQ') {
      this.commonService.getLiveRequest(this.data.Id).subscribe(res => {
        this.LiveContent = res.results['data'];
        this.contentData = res.results['data'];
        this.enableTable();
      })
    }
  }

  deleteVideo(id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px', height: '180px', panelClass: 'pop-up-margin',
        data: {
          title: 'Confirmation',
          message: 'Do you want to delete?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'Yes') {
          let type = this.videoType;
          this.commonService.kynVideoDelete(id, type).subscribe(res => {
            this.toastr.success('Success', `${res.message}`);
            this.getAllContents();
          },
            error => {
              this.toastr.error('Error', `${error.error.message}`);
              this.thisDialogRef.close('cancel');
            });
        }
          
      });
  }

  play(data){
    const dialogRef = this.dialog.open(PlayVideoComponent,
      { data: data, panelClass: ['small-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => { });
  }

  onLocationChange(data){
    this.locationData = data
    this.getAllOverView()
  }
  onCategorieChange(data){
    this.CategorieData = data
    this.getAllOverView()
  }

  getAllOverView(){
    let data = {
      // "location": [this.locationData? this.locationData : ''],
      // "category": [this.CategorieData? this.CategorieData : ''],
      "users": [this.data.Id]
    }

    this.commonService.getOverview(data).subscribe(res => {
      let results = res.results.data[0];
      this.klips = results.Klips
      this.notice = results.Notice
      this.post = results.Post
      this.telekast = results.Telekast
    })
  }
  fixClick() {
    console.log('')
  }    
}

@Component({
  selector: 'app-kyn-user',
  templateUrl: './play-video.component.html',
  styleUrls: ['./kyn-user.component.scss'],
})
export class PlayVideoComponent  {
  @ViewChild('videoPlayer') videoPlayer: any;

  constructor(public thisDialogRef: MatDialogRef<PlayVideoComponent>,
   public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any){
    if(data.hasOwnProperty('sourceUrl') && data.sourceUrl.includes('.m3u8')) {
      data.sourceUrl = data.rawDataUrl;
    }
   }

 


}

@Pipe({
  name: 'durationFormat',
  pure: true
})
export class DurationFormatPipe implements PipeTransform {
  transform(duration: string): string {
    if (!duration) {
      return '';
    }

    const timeComponents = duration.split(':');

    if (timeComponents.length === 2) {
      const minutes = parseInt(timeComponents[0], 10);
      const seconds = parseInt(timeComponents[1], 10);
      const totalTimeInSeconds = minutes * 60 + seconds;
      const formattedMinutes = Math.floor(totalTimeInSeconds / 60);
      const formattedSeconds = totalTimeInSeconds % 60;
      return `${formattedMinutes}:${formattedSeconds < 10 ? '0' : ''}${formattedSeconds}`;
    } else if (timeComponents.length === 3) {
      const minutes = parseInt(timeComponents[1], 10);
      const seconds = parseInt(timeComponents[2].split('.')[0], 10);
      const totalTimeInSeconds = minutes * 60 + seconds;
      const formattedMinutes = Math.floor(totalTimeInSeconds / 60);
      const formattedSeconds = totalTimeInSeconds % 60;
      return `${formattedMinutes}:${formattedSeconds < 10 ? '0' : ''}${formattedSeconds}`;
    } else {
      return duration;
    }
  }
}
