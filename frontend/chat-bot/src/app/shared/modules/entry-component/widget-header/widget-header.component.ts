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
import { Component,  Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonService } from '../../../services';
import { Router } from '@angular/router';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-widget-header',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.scss']
})
export class WidgetHeaderComponent {
    @Input() showMinimize: boolean;
    @Input() showMaximize: boolean;
    @Input() title: string;
    @Input() headerStyle: any;
    @Input() name: string;
    @Input() widDetail: any;
    @Input() navigate : any;
    @Output() getWidgetFilter = new EventEmitter<any>();
    @Output() childToParentAction = new EventEmitter<string>();
    @Output() removeWidgets = new EventEmitter<string>();

    constructor(private readonly commonService: CommonService,private readonly router: Router,private readonly dialog: MatDialog) { }


    ngDoCheck() {
        if (this.commonService.floorMap === true) {
            this.sendToParentAction('Minimize');
            this.commonService.floorMap = false;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if(this.widDetail){
            if(changes.widDetail){
                if (changes.widDetail.previousValue !== changes.widDetail.currentValue){
                    setTimeout(() => {
                        for(let i=0;i<this.widDetail.length;i++){
                            if (this.widDetail[i].hasOwnProperty('resData') && this.widDetail[i]['resData'] && this.widDetail[i]['enabled']) {
                                this.widDetail[i]['enableFilter'] = true;
                            } else{
                                this.widDetail[i]['enableFilter'] = false;
                            }
                        }
                    }, 200); 
                }
            }
        }
    }
    
    sendToParentAction(action) {
        if (action === 'Maximize') {
            this.childToParentAction.emit('Maximize');
        } else {
            this.childToParentAction.emit('Minimize');
        }
    }
    sendToLayout(data){
        this.getWidgetFilter.emit(data);
    }
    // Temporarily  D I S A B L E D
    removeWidget(name) {
         this.removeWidgets.emit(name);
    }

    onNavigate(header: any) {
        if(header.type == 'url'){
            const url = header?.url;
            // const queryParams = header.queryParam || {};
            const queryParams = {};

            if (url) {
                this.router.navigate([url], { queryParams });
            }
        }else if(header.type == 'popup'){
            const popup = header?.popup;
            if (popup) {
                let panelClassList = ['medium-popup']
                if(header?.popupData?.panelClass){
                    panelClassList = header?.popupData?.panelClass;
                }
                this.dialog.open(DynamicDialogComponent,
                    { data: header, panelClass: panelClassList, disableClose: true });
            }

        }
        
    }
    fixClick() {
        console.log('')
    }
}
