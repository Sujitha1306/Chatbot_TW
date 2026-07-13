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
import { Directive, EventEmitter, HostListener, Input,  OnInit, Output } from '@angular/core';

@Directive({
  selector: '[appWindowResize]'
})
export class WindowResizeDirective implements OnInit {
  @Input() component;
  @Input() windowSize;
  @Output() resizedWidth = new EventEmitter<any>();
  @Output() resized = new EventEmitter<any>();
  @Output() resizedCol = new EventEmitter<any>();
  private maxHeight;
  private cols;
  private maxWidth;

  constructor() { }

  ngOnInit() {
    if (this.component === 'porter'  || this.component === 'ambulance') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 400;
      } else {
        this.maxHeight = window.innerHeight - 280;
      }
    } else if (this.component === 'ot' || this.component === 'inpatient'
      || this.component === 'resident' || this.component === 'staffRoutine') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 310;
      } else {
        this.maxHeight = window.innerHeight - 180;
      }
    } else if (this.component === 'medicalRecord') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 350;
      } else {
        this.maxHeight = window.innerHeight - 225;
      }
    } else if (this.component === 'resource') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 310;
      } else {
        this.maxHeight = window.innerHeight - 185;
      }
    } else if (this.component === 'socialDistance') {
      this.maxHeight = window.innerHeight - 80;
    } else if (this.component === 'popup-enroll') {
      if (window.innerHeight  >= 651) {
        this.maxHeight = 0;
      } else {
        this.maxHeight = window.innerHeight;
      }
    } else if(this.component === 'reader-config'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 200;
      } else {
        this.maxHeight = window.innerHeight - 150;
      }
    } else if(this.component === 'infant' || this.component === 'gateway-management'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 250;
      } else {
        this.maxHeight = window.innerHeight - 160;
      }
    } else if(this.component === 'pop-up'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      } else {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      }
    } else if(this.component === 'monitor' || this.component === 'MR'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      } else {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      }
    } else {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 260;
      } else {
        this.maxHeight = window.innerHeight - 150;
      }
    }

    if (this.component === 'dailyManagement' || this.component === 'healthCheck') {
      if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
        this.cols = 8;
      } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
        this.cols = 8;
      } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
        this.cols = 4;
      } else if (window.innerWidth <= 768) {
        this.cols = 2;
      } else {
        this.cols = 8;
      }
    } else if (this.component === 'inpatient' || this.component === 'medicalRecord'
      || this.component === 'resident' || this.component === 'staffRoutine') {
      if (window.innerWidth <= 1920 && window.innerWidth >= 1401) {
        this.cols = 4;
      } else if (window.innerWidth <= 1400 && window.innerWidth >= 1280) {
        this.cols = 4;
      } else if (window.innerWidth <= 1279 && window.innerWidth >= 767) {
        this.cols = 3;
      } else if (window.innerWidth <= 768 && window.innerWidth >= 600) {
        this.cols = 2;
      } else if (window.innerWidth <= 599) {
        this.cols = 1;
      } else {
        this.cols = 4;
      }
    }

    this.resized.emit(this.maxHeight);
    this.resizedWidth.emit(this.maxWidth);
    this.resizedCol.emit(this.cols);
  }

  @HostListener('window:resize', ['$event'])
  onResized(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.component === 'porter' || this.component === 'ambulance') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 400;
      } else {
        this.maxHeight = window.innerHeight - 280;
      }
    } else if (this.component === 'ot' || this.component === 'inpatient'
      || this.component === 'resident' || this.component === 'staffRoutine') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 310;
      } else {
        this.maxHeight = window.innerHeight - 180;
      }
    } else if (this.component === 'medicalRecord') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 350;
      } else {
        this.maxHeight = window.innerHeight - 225;
      }
    } else if (this.component === 'resource') {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 310;
      } else {
        this.maxHeight = window.innerHeight - 185;
      }
    } else if (this.component === 'socialDistance') {
      this.maxHeight = window.innerHeight - 80;
    } else if (this.component === 'popup-enroll') {
      if (window.innerHeight >= 651) {
        this.maxHeight = 0;
      } else {
        this.maxHeight = window.innerHeight;
      }
    } else if(this.component === 'reader-config'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 200;
      } else {
        this.maxHeight = window.innerHeight - 150;
      }
    } else if(this.component === 'infant' || this.component === 'gateway-management'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 250;
      } else {
        this.maxHeight = window.innerHeight - 160;
      }
    } else if(this.component === 'pop-up'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      } else {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      }
    } else if(this.component === 'monitor' || this.component === 'MR'){
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      } else {
        this.maxHeight = window.innerHeight;
        this.maxWidth = window.innerWidth;
      }
    } else {
      if (window.innerWidth <= 640) {
        this.maxHeight = window.innerHeight - 260;
      } else {
        this.maxHeight = window.innerHeight - 150;
      }
    }

    this.resized.emit(this.maxHeight);
    this.resizedWidth.emit(this.maxWidth);

    if (this.component === 'dailyManagement' || this.component === 'healthCheck') {
      if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
        this.cols = 8;
      } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
        this.cols = 8;
      } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
        this.cols = 4;
      } else if (event.target.innerWidth <= 768) {
        this.cols = 2;
      } else {
        this.cols = 8;
      }
    } else if (this.component === 'inpatient' || this.component === 'medicalRecord'
      || this.component === 'resident' || this.component === 'staffRoutine') {
      if (event.target.innerWidth <= 1920 && event.target.innerWidth >= 1401) {
        this.cols = 4;
      } else if (event.target.innerWidth <= 1400 && event.target.innerWidth >= 1280) {
        this.cols = 4;
      } else if (event.target.innerWidth <= 1279 && event.target.innerWidth >= 767) {
        this.cols = 3;
      } else if (event.target.innerWidth <= 768 && event.target.innerWidth >= 600) {
        this.cols = 2;
      } else if (event.target.innerWidth <= 599) {
        this.cols = 1;
      } else {
        this.cols = 4;
      }
    }
    this.resizedCol.emit(this.cols);
  }
}
