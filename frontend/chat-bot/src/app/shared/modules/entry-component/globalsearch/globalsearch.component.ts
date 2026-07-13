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

import { Component, ElementRef, ViewChild, ViewEncapsulation, HostListener, Input } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MatAutocomplete,  MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {  debounceTime } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../services/common.service';
import { DashboardService } from '../../../services/dashboard.service';
import { PatientInfoComponent } from '../patient/patient.component';
import { CommonDialogComponent } from '../../entry-component/common-dialog-component/common-dialog.component';
import { CommonSearchComponent } from '../common-search/common-search.component';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-globalsearch-component',
  templateUrl: './globalsearch.component.html',
  styleUrls: ['./globalsearch.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GlobalSearchComponent {
  /* search bar */
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  seachCtrl = new FormControl();
  filteredKeys: Observable<string[]>;
  public subject: Subject<any> = new Subject();
  keys: any = 'GST-AS';
  @Input() filterOptions: any[] = [];
  selectedKeyCodes: any = { 'All': 'all', 'Today': 'today', 'Patient': 'patient', 'Asset': 'asset', 'User': 'user', 'Infant': 'infant', 'Doctor': 'doctor' };
  passKeys: any[] = [];
  public activate_btn: any = [];
  opened = false;
  @ViewChild('searchValue') searchValue: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  @ViewChild('autocompleteTrigger') matACTrigger: MatAutocompleteTrigger;

  // *********** //
  /* search list*/
  searchlist: any = null;
  public searchClose = false;
  public searchKey = 'All';
  public openAutocom = false;
  public clearSearch = false;
  public typeInput = true;
  public isShowSearch = false;
  public lastSearch = '';
  public isExpanded: boolean = false;
  public isFilterExp: boolean = false;
  isInputFocused: boolean = false;
  isMenuOpen: boolean = false;
  filterOptionsNew: any[];
  isHighlightHovered = false;
  isOpen = false;
  displayValue: any = "Asset";
  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: Event, targetElement: HTMLElement) {

    if (!targetElement) {
      return;
    }
    if (this.filterOptionsNew.includes(event.target['outerText'])) {
      this.seachCtrl.setValue(this.lastSearch)
    } else {
      this.seachCtrl.setValue(null);
      this.lastSearch = '';
    }
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside && this.isShowSearch) {
      this.searchlist = null;
      this.openAutocom = false;
      this.matACTrigger.closePanel();
      this.typeInput = true;
    }
  }

  // *********** //

  constructor(private readonly commonService: CommonService,
    public dialog: MatDialog, private readonly dashboardService: DashboardService,
    private readonly elementRef: ElementRef, public toastr: AppToastService) {
    this.commonService.getAppTerms('GlobalSearchType').subscribe(res => {
      this.filterOptionsNew = res.results;
    })
    this.checkUserPreference();
    this.activate_btn = this.commonService.getActivePermission('button');
    this.filterOptionsNew = this.filterOptions.filter(item => item != 'Today');
  }
  ngOnInit() {
    this.subject.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getSearch(searchTextValue);
    });
  }
  getUserPreference() {
    let preference = this.commonService.userPreference;
    let postData = {
      'key': "globalSearch",
      'roleId': localStorage.getItem('userlevel'),
      'userId': localStorage.getItem(btoa('userId')),
      'value': this.keys
    }
    if (preference != null) {
      if (preference.hasOwnProperty('globalSearch')) {
        let id = preference.globalSearch.id;
        this.commonService.updateUserPreference(id, postData).subscribe(res => {
          this.commonService.userPreference = res.results;
        });
      } else {
        this.commonService.saveUserPreference(postData).subscribe(res => {
          this.commonService.userPreference = res.results;
        });
      }
    }
  }
  checkUserPreference() {
    let roleId = localStorage.getItem('userlevel');
    let userId = localStorage.getItem(btoa('userId'));
    this.commonService.getPreference(userId, roleId).subscribe(res => {
      let preference = res.results;
      if (preference != null && preference.hasOwnProperty('globalSearch')) {
        if (preference.globalSearch.value != null && preference.globalSearch.value != '') {
          let value = preference.globalSearch.value
          this.keys = value;
          const selectedData = this.filterOptionsNew.find(x => x.code === this.keys);
          this.displayValue = selectedData ? selectedData.value : this.displayValue;
          this.selectedKeys()
        }
      }
    });
  }
  openSearch() {
    this.isShowSearch = true;
  }
  remove(key: string): void {
    const index = this.keys.indexOf(key);

    if (index >= 0) {
      this.keys.splice(index, 1);
    }
    this.selectedKeys();
  }

  patientSummaryInfo(data) {
    if(data?.visitTypeId === "VT-HC") {
      data['type'] = '1';
      data['patientId'] = data.id;
      data['patinetVisitId'] = data.patientVisitId;
      this.dialog.open(PatientInfoComponent, { 
        data: data, panelClass: ['medium-popup'], disableClose: true 
      });
    }
  }

  selected(value): void {
    this.keys = value.code;
    const selectedData = this.filterOptionsNew.find(x => x.code === this.keys);
    this.displayValue = selectedData.value
    this.searchValue.nativeElement.value = '';
    this.getUserPreference();

    // keep the autocomplete opened after each item is picked.
    requestAnimationFrame(() => {
      this.openAuto(this.matACTrigger);
    })

  }
  selectedKeys() {
    this.passKeys = [];
    for (let i = 0; i < this.keys.length; i++) {
      let keyCode = this.selectedKeyCodes[this.keys[i]];
      this.passKeys.push(keyCode)
    }
    if (this.lastSearch != '') {
      this.searchInput(this.lastSearch)
    }
  }
  inputText(event) {
    this.subject.next(event);
  }
  getSearch(text) {
    this.searchClose = false;
    this.lastSearch = text;
    if (text === '') {
      this.typeInput = true;
      this.clearSearch = false;
      this.searchlist = null;
    } else {
      this.searchInput(text)
    }
  }
  searchInput(event) {
    if (event.length < 4) {
      this.typeInput = true;
      this.clearSearch = false;
      this.searchlist = null;
      return;
    }

    this.commonService.getGlobalSearchData(this.keys, event).subscribe(res => {
      const resultMap = {
        'GST-AS': 'assets',
        'GST-MR': 'medicalRecords',
        'GST-PA': 'patients',
        'GST-TA': 'tags',
        'GST-US': 'users'
      };

      const resultKey = resultMap[this.keys];
      const results = res.results ? res.results[resultKey] : null;

      if (results && results.length) {
        this.searchlist = results;
        this.clearSearch = false;
        this.typeInput = false;
      } else {
        this.searchlist = 'empty';
        this.clearSearch = true;
        this.typeInput = false;
      }
    });
  }
  openAuto(trigger: MatAutocompleteTrigger) {
    trigger.openPanel();
    this.searchValue.nativeElement.focus();
    this.openAutocom = true
  }
  clearDropdown(value) {
    if (value === '') {
      this.searchlist = 'empty';
      this.clearSearch = true;
    }
    else {
      const searchList = this.searchlist;
      this.searchlist = searchList;
      this.clearSearch = false;
    }
  }
  getSearchResult(data) {
    if (data.category == 'Patient') {
      this.openAutocom = false;
      this.matACTrigger.closePanel();
      data['type'] = '1';
      data['patinetVisitId'] = data.patientVisitId;
      data['patientId'] = data.id;
      data['token_no'] = data.tokenNo;
      if (data.tagSerialNumber != null && data.floorId != null) {
        this.openAutocom = false;
        this.matACTrigger.closePanel();
        data['type'] = 'globalSearch';
        this.dialog.open(CommonDialogComponent,
          { data: data, panelClass: ['medium-popup'], disableClose: true });
      } else {
        this.toastr.warning('Warning', data.category + ` currently not available !!`);
      }
    } else {
      if (data.tagSerialNumber != null && data.floorId != null) {
        this.openAutocom = false;
        this.matACTrigger.closePanel();
        data['type'] = 'globalSearch';
        this.dialog.open(CommonDialogComponent,
          { data: data, panelClass: ['medium-popup'], disableClose: true });
      } else {
        this.toastr.warning('Warning', data.category + ` currently not available !!`);
      }
    }
  }
  patientInfo(data) {
    this.openAutocom = false;
    this.matACTrigger.closePanel();
    data['type'] = '1';
    data['patinetVisitId'] = data.patientVisitId;
    data['patientId'] = data.id;
    data['token_no'] = data.tokenNo;
    this.dialog.open(PatientInfoComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
  }
  assetInfo(data) {
    if (data.tagSerialNumber != null && data.floorId != null) {
      this.openAutocom = false;
      this.matACTrigger.closePanel();
      this.dialog.open(CommonDialogComponent,
        { data: data, panelClass: ['medium-popup'], disableClose: true });
    }
  }
  globalSearch(option) {
    this.openAutocom = false;
    this.matACTrigger.closePanel();
    this.searchlist['keys'] = this.keys;
    if (this.keys.length == 0) {
      let categoryFilter = this.searchlist.filter(res => res.category == "Asset")
      if (categoryFilter.length == this.searchlist.length) {
        this.searchlist['keys'] = ['Asset']
      }
    }
    const dialogRef = this.dialog.open(CommonSearchComponent,
      { data: this.searchlist, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  ngDoCheck() {
    if (this.openAutocom && this.matACTrigger !== undefined) {
      this.matACTrigger.openPanel();
    }
  }

  expandSearchBox() {
    this.isExpanded = !this.isExpanded;
    this.isShowSearch = !this.isShowSearch
    if (this.isExpanded) {
      setTimeout(() => {
        this.isFilterExp = true;
      }, 400);
    } else {
      this.isFilterExp = false;
    }
    this.searchlist = null;
  }

  onInputFocus() {
    this.isInputFocused = true;
  }

  onInputBlur() {
    this.isInputFocused = false;
  }

  onMenuOpen() {
    this.isMenuOpen = true;
    this.isShowSearch = false;
  }

  onMenuClose() {
    this.isMenuOpen = false;
    this.isShowSearch = true;
  }

  onHover(state: boolean): void {
    this.isHighlightHovered = state;
  }

  getCurrentLoc(data,index, ViewType){
    if(data){
      let param = '/cloc=' + 1+'&tid='+data?.tagId;
      this.commonService.getReportData('totaltimebylocv2', param).subscribe(res => {
        if(res.results.statusCode == 200) {
          this.searchlist[index]['currentLoc'] = res.results?.data[0]?.location_name;
          if(ViewType == 'map') {
            data['type'] = 'globalSearch';
            data['tagSerialNumber'] = data?.tagId;
            data['floorId'] = res.results?.data[0]['floor_id'];
            data['tagTypeId'] = this.keys == 'GST-AS' ? 'TAT-AS': this.keys == 'GST-PA'? 'TAT-PA' : data?.tagTypeId; 
            if (data.tagSerialNumber != null && data.floorId != null) {
              this.dialog.open(CommonDialogComponent,
                { data: data, panelClass: ['medium-popup'], disableClose: true });
            }

          } else {
            setTimeout(() => this.searchlist[index]['currentLoc'] = null, 7000);
          }
          }else{
            this.toastr.warning('Warning',data?.tagId + ` not found !!`);
          }
      });
    }
  }
    fixClick() {
    console.log('')
  }
}
