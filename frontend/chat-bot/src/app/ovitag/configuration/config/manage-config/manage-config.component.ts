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
import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ConfigModel,EditConfigModel } from '../../configuration.model';
import { CommonService,ConfigurationService } from '../../../../shared';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
@Component({
  selector: 'app-manage-config',
  templateUrl: './manage-config.component.html',
  styleUrls: ['./manage-config.component.scss']
})
export class ManageConfigComponent implements OnInit {

  public facilitySub: Subject<any> = new Subject();
  public configForm: FormGroup;
  public facilityList: any = [];
  manageConfig: ConfigModel;
  editConfig: EditConfigModel;
  public content: any = [{ "": "" }];
  configIds: any = [];
  public isFacilityChecked: boolean = false;
  public facilitySearch = new FormControl('');
  public facilitySearchList: any[] = []; 

  constructor(
    public dialogRef: MatDialogRef<ManageConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly snackBar: MatSnackBar,
    public fb: FormBuilder,
    private readonly configurationservice: ConfigurationService,
    private readonly commonService: CommonService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.facilitySub.pipe(debounceTime(600)).subscribe(searchTextValue => {
      this.getFacilitylist(searchTextValue);
    });
    this.commonService.getCustomerFacilitylist(null, null, 500, 0).subscribe(res => {
      this.facilityList = res.results.map((item: any) => {
        const names = [item.facilityName, item.regionName, item.customerName]
          .filter(x => !!x)
          .join(', ');

        return {
          ...item,
          displayName: names || ''
        };
      });
      this.facilitySearchList = [...this.facilityList];
      this.facilitySearch.valueChanges.subscribe((searchText: string) => {
        const lower = (searchText || '').toLowerCase();
        this.facilitySearchList = this.facilityList.filter(item =>
          item.displayName?.toLowerCase().includes(lower)
        );
      });
    });
    this.configForm.get('contentData').valueChanges.subscribe(() => {
      this.customValidate(this.configForm.get('contentData'));
    });
  }
  isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  }

   onFilterSearchOpened(opened) {
     if (opened) {
       this.facilitySearchList = this.facilityList;
     }
   }

  initializeForm() {
    let content = this.data ? this.data.content : JSON.stringify({});
    content = this.isJsonString(content) ? JSON.stringify(JSON.parse(content), undefined, 4) :  content;
    this.configForm = this.fb.group({
      ids: [this.data ? this.data.ids : null],
      id: [this.data ? this.data.id : null, [Validators.required]],
      comments: [this.data ? this.data.comments : null],
      contentData: [content, [Validators.required]],
      facilityId: [this.data ? this.data.facilityId : null],
    });
  }

  getFacilitylist(key) {
    let val = key.text;
    if (key.text !== "" && val.length >= 2) {
      if (val.length >= 2) {
        this.commonService.getCustomerFacilitylist('3', val).subscribe(res => {
          this.facilityList = res.results;
        });
      } else {
        this.facilityList = [];
      }
    }
  }


  customValidate(control) {
    let contentValue = control.value;
    if (contentValue !== null && contentValue !== '') {
      try {
        JSON.parse(contentValue);
        control.setErrors(null); 
      } catch (error) {
        control.setErrors({ invalidJson: true });
      }
    }
  }


  clearCache() {
    let data = {}
    this.commonService.clearcache(data).subscribe(res => {
      let msg = 'All cache cleared...'
      console.log(msg);
    }) 
  }

  addConfig() {
    const content = JSON.parse(this.configForm.controls.contentData.value);
    this.manageConfig = new ConfigModel(null, null, null, null);
    this.manageConfig.id = this.configForm.controls.id.value;
    this.manageConfig.comments = this.configForm.controls.comments.value;
    this.manageConfig.contentData = content; 
    this.manageConfig.facilityId = this.configForm.controls.facilityId.value;
    this.configurationservice.saveConfig(this.manageConfig).subscribe(
      (res) => {
        this.dialogRef.close();
        this.clearCache();
        this.showSnackBar(res.message);
      },
      (res) => {
        this.showSnackBar(res.error?.message);
      }
    );
  }

  updateConfig() {
    const content = JSON.parse(this.configForm.controls.contentData.value);

    this.editConfig = new EditConfigModel(null, null, null, null);
    this.editConfig.ids = this.configForm.controls.ids.value;
    this.editConfig.comments = this.configForm.controls.comments.value;
    this.editConfig.contentData = content; 
    this.editConfig.facilityId = this.configForm.controls.facilityId.value;
    this.configurationservice.updateConfig(this.data.id, this.editConfig).subscribe(
      (res) => {
        this.dialogRef.close();
        this.clearCache();
        this.showSnackBar(res.message);
      },
      (res) => {
        this.showSnackBar(res.error?.message);
      }
    );
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top'
    });
  }
}
