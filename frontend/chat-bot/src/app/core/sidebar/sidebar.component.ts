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
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {CommonService } from '../../shared';

@Component({
  selector: 'cdk-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

    @Input() sidebar;
   @Output() valueChange = new EventEmitter();
    counter = '';

    @Input() menuName;
    public menu: any;
    @Input() arrow;
    constructor( private readonly common: CommonService) { }

  ngOnInit() {
    
    this.menu = this.common.getActivePermission('main_menu');
  }
  arrowChange() {
    this.arrow = false;
  }
  menuClick(menuName) {
    this.counter = menuName;
   
    this.valueChange.emit(this.counter);
  }
  today: number = Date.now();
  
    events = [
          {
            id: 'id',
            title: 'Business Meeting',
            time: '05:00 PM',
            state: 'state'
        },
        {
            id: 'id',
            title: 'Ask for a Vacation',
            time: '05:00 PM',
            state: 'state'
        },
        {
            id: 'id',
            title: 'Dinner with Micheal',
            time: '05:00 PM',
            state: 'state'
        },
        {
            id: 'id',
            title: 'Deadline for Project ABC',
            time: '05:00 PM',
            state: 'state'
        },
    ];

    todolists = [
          {
            id: 'id',
            title: 'Get to know Angular more',
            time: 'Added:4 days ago',
        },
        {
            id: 'id',
            title: 'Configure new Router',
            time: 'Added:4 days ago',
        },
        {
            id: 'id',
            title: 'Invite Joy to play Carroms',
            time: 'Added:4 days ago',
        },
        {
            id: 'id',
            title: 'Check SRS of Project X',
            time: 'Added:4 days ago',
        },
    ];

    messages = [
        {from: 'Catherin', subject: 'Shopping', content: 'hi there??'},
        {from: 'Jack', subject: 'Function', content: 'yes'},
        {from: 'Karina', subject: 'Get together', content: 'nice'},
        {from: 'Micheal', subject: 'Trip', content: 'ya.. I will'},
        {from: 'Ashik', subject: 'Meeting', content: 'Time??'},
        {from: 'Joy', subject: 'Party', content: 'Lets enjoy'},
    ];
}
