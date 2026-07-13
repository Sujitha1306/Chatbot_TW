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
import { FormBuilder, Validators, FormControl} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-common-styling',
    templateUrl: './common-styling.component.html',
    styleUrls: ['./common-styling.component.scss'],
    encapsulation: ViewEncapsulation.None
  })

export class CommonStylingComponent implements OnInit {
public styleProperties = [{name:'color',code:'clr'},{name:'background',code:'bgclr'},{name:'transform',code:'tran'},{name:'font-size',code:'fsize'},{name:'font-family',code:'ffam'},{name:'font-weight',code:'fwei'},{name:'margin',code:'mar'},{name:'margin-left',code:'mar'},{name:'margin-right',code:'mar'},{name:'margin-top',code:'mar'},{name:'margin-bottom',code:'mar'},{name:'padding',code:'pad'},{name:'padding-left',code:'pad'},{name:'padding-right',code:'pad'},{name:'padding-top',code:'pad'},{name:'padding-bottom',code:'pad'},{name:'opacity',code:'opa'},{name:'white-space',code:'wspa'}]
public styleList = [];
public selectedStyleName = new FormControl(null);
public selectedStyle = new FormControl(null);
public styleInput = new FormControl(null);
public finalStyle = new FormControl('')
public styleAttr = [];
public lastStyle = '';
public isInValidColor = false;
@Input() existStyle: any;
@Input() label: any;
@Output() updatedStyle = new EventEmitter<any>();
@Output() cancelStyle = new EventEmitter<any>();
  constructor(private readonly form: FormBuilder, private readonly dialog: MatDialog, private readonly thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any){
  }
  ngOnInit(){
      this.styleInput.setValue(null)
      this.selectedStyleName.setValue(null)
   }
  createStyle(event){
      this.styleInput.setValue(null)
      if(this.selectedStyle.value == 'fsize' || this.selectedStyle.value == 'mar' || this.selectedStyle.value == 'pad'){
        this.styleInput.setValidators(Validators.pattern(/([0-9]*\.?[0-9]+)(em|px|%)$/))
      }else if(this.selectedStyle.value == 'fwei'){
        this.styleInput.setValidators(Validators.pattern(/^[a-zA-Z0-9]*$/))
      }else if(this.selectedStyle.value == 'ffam'){
        this.styleInput.setValidators(Validators.pattern(/^[a-zA-Z ]*$/))
      }else if(this.selectedStyle.value == 'tran'){
        this.styleInput.setValidators(Validators.pattern(/rotate\((-?\d+(?:\.\d*)?)deg\)/))
      }else if(this.selectedStyle.value == 'opa'){
        this.styleInput.setValidators(Validators.pattern(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/))
      }else if(this.selectedStyle.value == 'wspa'){
        this.styleInput.setValidators(Validators.pattern(/^[a-zA-Z-]*$/))
      }else if(this.selectedStyle.value == 'clr' || this.selectedStyle.value == 'bgclr'){
        this.styleInput.setValidators(null)
      }
  }
  getStylelist(val){
    if(val.length > 0){
      this.styleList = this.styleProperties.filter(res => res.name.includes(val))
    }else{
      this.styleList = []
    }
  }
  setStyleName(code){
    this.selectedStyle.setValue(code);
  }
  getInput(event){
    if(event != '' && (this.selectedStyle.value == 'clr' || this.selectedStyle.value == 'bgclr')){
      let s = new Option().style;
      s.color = event;
      if(s.color != '' && s.color != null){
        this.isInValidColor = false;
      } else{
        this.isInValidColor = true;
      }
    }
  }
  addStyle(){
      let index = this.styleAttr.findIndex(res => res.includes(this.selectedStyleName.value))
      if(this.selectedStyle.value == 'ffam'){
        if(index > -1){
          this.styleAttr[index] = this.selectedStyleName.value + ':' + "'"+this.styleInput.value +"';"
        } else{
          this.styleAttr.push(this.selectedStyleName.value + ':' + "'"+this.styleInput.value +"';")
        }
      } else if(this.selectedStyle.value == 'clr' || this.selectedStyle.value == 'bgclr'){
        let input = this.styleInput.value.includes('(') ? this.styleInput.value.includes(')') ? this.styleInput.value : this.styleInput.value+')' : this.styleInput.value;
        if(index > -1){
          this.styleAttr[index] = this.selectedStyleName.value + ':' + input + ';';
        }else{
          this.styleAttr.push(this.selectedStyleName.value + ':' + input + ';')
        }
      } else{
        if(index > -1){
          this.styleAttr[index] = this.selectedStyleName.value + ':' + this.styleInput.value + ';';
        }else{
          this.styleAttr.push(this.selectedStyleName.value + ':' + this.styleInput.value + ';')
        }
      }
      this.styleList = []
      this.styleInput.setValue(null);
      this.selectedStyleName.setValue(null);
      this.selectedStyle.setValue(null);
  }
  highlightStyle(val){
    val = val.split(':')
    let key = val[0],value = val[1];
    let styleAttribute = this.styleProperties.find(res => res.name == key)
    if(styleAttribute != undefined){
      this.selectedStyle.setValue(styleAttribute.code)
      this.selectedStyleName.setValue(styleAttribute.name)
      this.createStyle(this.selectedStyle.value)
    }
    value = value.includes("'") ? value.replace("'",'') : value;
    value = value.includes("'") ? value.replace("'",'') : value;
    value = value.includes(';') ? value.replace(';','') : value;
    this.styleInput.setValue(value)
  }
  removeStyle(event){
    let index = this.styleAttr.findIndex(res => res.includes(event))
    this.styleAttr.splice(index,1)
  }
  applyStyle(){
    let finalStyle = this.styleAttr.join('');
    if(this.lastStyle !== finalStyle){
      this.clearFields()
    }else{
      this.styleList = [];
      this.styleInput.setValue(null);
      this.selectedStyleName.setValue(null);
      this.selectedStyle.setValue(null);
    }
    this.updatedStyle.emit(finalStyle)
  }
  clearFields(){
    this.styleList = [];
    this.styleAttr = [];
    this.styleInput.setValue(null);
    this.selectedStyleName.setValue(null);
    this.selectedStyle.setValue(null);
  }
  openPage(){
    window.open('https://www.tutorialrepublic.com/css-reference/css3-properties.php');
  }
  ngDoCheck(){
    if((typeof(this.existStyle) != 'object' &&  this.existStyle != this.lastStyle) || (typeof(this.existStyle) == 'object' && this.existStyle?.web != this.lastStyle)){
      this.lastStyle = typeof(this.existStyle) == 'object' ? this.existStyle?.web : this.existStyle;
      this.clearFields()
      if(this.lastStyle != '' && this.lastStyle != null){
        let splitVal = this.lastStyle.split(';')
        for(let i in splitVal){
          if(splitVal[i] != ''){
          this.styleAttr.push(splitVal[i]+";")
          }
        }
      }
    }
  }
  fixClick() {
    console.log('')
  }
}
