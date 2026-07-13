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
import {Component, ContentChild, Input} from '@angular/core';
import {NgxMaterialTimepickerToggleIconDirective} from '../../directives/ngx-material-timepicker-toggle-icon.directive';
import {NgxMaterialTimepickerComponent} from '../../ngx-material-timepicker.component';

@Component({
    selector: 'ngx-material-timepicker-toggle',
    templateUrl: 'ngx-material-timepicker-toggle.component.html',
    styleUrls: ['ngx-material-timepicker-toggle.component.scss']
})

export class NgxMaterialTimepickerToggleComponent {

    @Input('for') timepicker: NgxMaterialTimepickerComponent;

    @Input()
    get disabled(): boolean {
        return this._disabled === undefined ? this.timepicker.disabled : this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = value;
    }

    private _disabled: boolean;

    @ContentChild(NgxMaterialTimepickerToggleIconDirective) customIcon: NgxMaterialTimepickerToggleIconDirective;

    open(event): void {
        if (this.timepicker) {
            this.timepicker.open();
            event.stopPropagation();
        }
    }
}
