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

import { Component, OnInit,  ViewEncapsulation, Inject, EventEmitter, Input, Output} from '@angular/core';
import { FormBuilder, FormControl} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-common-style',
    templateUrl: './common-style.component.html',
    styleUrls: ['./common-style.component.scss'],
    encapsulation: ViewEncapsulation.None
  })

export class CommonStyleComponent implements OnInit {
@Input() currentStyle: any;
@Input() labelName: any;
@Output() updatedStyle = new EventEmitter<any>();
@Output() cancelStyle = new EventEmitter<any>();

public styleList = [];
public cssList = [];
public name = new FormControl(null);
public value = new FormControl(null);
public styleArray = [];
public inputValidate = false;
public lastStyle = '';
public labelStyle = {
  show : false,
  data : {}
};

public selectedOption = new FormControl(null);
public styleProperties = [
  {name:'color',code:'clr'},{name:'background',code:'bgclr'},{name:'transform',code:'tran'}, {name:'font-size',code:'fsize'},
  {name:'font-family',code:'ffam'},{name:'font-weight',code:'fwei'},{name:'margin',code:'mar'}, {name:'margin-left',code:'mar'},
  {name:'margin-right',code:'mar'}, {name:'margin-top',code:'mar'},{name:'margin-bottom',code:'mar'},
  {name:'padding',code:'pad'},{name:'padding-left',code:'pad'},{name:'padding-right',code:'pad'},
  {name:'padding-top',code:'pad'},{name:'padding-bottom',code:'pad'},{name:'opacity',code:'opa'},{name:'white-space',code:'wspa'}
]

public finalStyle: any;
public styleAttr = [];
public isInValidColor = false;

constructor(private readonly form: FormBuilder, private readonly dialog: MatDialog, 
  private readonly thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any) { }
  ngOnInit(){
      this.name.setValue(null);
      this.value.setValue(null);
      this.getallStyles();
      this.getCurentStyle(null);
  }
  
  getCurentStyle(data) {
    let splitData = [];
    if (data == null ) {
      this.styleArray = [];
      if (this.currentStyle != null) {
        splitData = this.currentStyle.split(';');
        for (let i in splitData) {
          if (splitData[i] !== '') {
            const record = splitData[i].split(':');
            const name = record[0], value = record[1];
            this.labelStyle['data'][name] = value;
            this.styleArray.push(splitData[i] + ';');
          }
        }
      }
      this.labelStyle['show'] = true;
    }
  }
  getallStyles() {
    let styleOptions = JSON.parse(JSON.stringify(new Option().style));
    styleOptions = Object.keys(styleOptions);
    styleOptions.forEach(element => {
      const value = {
        key : element,
        name : element.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase())
      };
      this.cssList.push(value);
    });
  }
  rowAction(row) {
    row = row.split(':');
    let name = row[0], value = row[1];
    const styleData = this.cssList.find(res => res.name === name);
    if (styleData !== undefined) {
      this.selectedOption.setValue(styleData);
      this.name.setValue(styleData.name);
    }
    value = value.includes("'") ? value.replace("'",'') : value;
    value = value.includes("'") ? value.replace("'",'') : value;
    value = value.includes(';') ? value.replace(';','') : value;
    this.value.setValue(value);
    this.getInput(this.value.value)
  }
  
  createStyle(event) {
      this.value.setValue(null)
  }
  getStylelist(val) {
    if (val.length > 0) {
      this.styleList = this.cssList.filter(res => res.name.includes(val));
    } else {
      this.styleList = this.cssList;
    }
  }
  setStyleName(css) {
    this.value.setValue(css.name);
  }
  
  getInput(event){
    this.inputValidate = false;
    if (event !== '') {
      const name = this.name.value;
      const styleOptions = new Option().style;
      if (styleOptions.hasOwnProperty(name)) {
        styleOptions[name] = event;
        if (styleOptions[name] !== '' && styleOptions[name] != null) {
          this.inputValidate = true;
        }
      }
    }
  }
  addStyle() {
      this.labelStyle['show'] = false;
      const index = this.styleArray.findIndex(res => res.includes(this.name.value));
      if ( index === -1) {
        this.styleArray.push(this.name.value + ':' + this.value.value + ';');
      } else {
        this.styleArray[index] = this.name.value + ':' + this.value.value + ';';
      }
      this.labelStyle['data'][this.name.value] = this.value.value;
      this.labelStyle['show'] = true;
      this.clearFields();
  }
  removeStyle(event) {
    const index = this.styleArray.findIndex(res => res.includes(event));
    this.styleArray.splice(index, 1);
  }
  applyStyle() {
    const labelStyle = this.styleArray.join('');
    this.clearFields();
    this.updatedStyle.emit(labelStyle);
  }
  clearFields() {
    this.styleList = [];
    this.name.setValue(null);
    this.value.setValue(null);
    this.inputValidate =  false;
    this.selectedOption.setValue(null);
  }

  openPage(){
    window.open('https://www.tutorialrepublic.com/css-reference/css3-properties.php');
  }

  ngDoCheck() {
    if (this.currentStyle !== this.lastStyle) {
      this.lastStyle = this.currentStyle;
      this.clearFields();
      if (this.lastStyle !== '' && this.lastStyle != null){
        this.getCurentStyle(null);
      }
    }
  }
  fixClick() {
    console.log('')
  }
}
