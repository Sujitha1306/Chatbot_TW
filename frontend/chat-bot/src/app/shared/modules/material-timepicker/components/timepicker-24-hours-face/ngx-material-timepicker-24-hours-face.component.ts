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
import {AfterContentInit, Component, Input} from '@angular/core';
import {NgxMaterialTimepickerHoursFaceComponent} from '../timepicker-hours-face/ngx-material-timepicker-hours-face.component';
import {ClockFaceTime} from '../../models/clock-face-time.interface';
import * as _moment from 'moment';

const moment = _moment;

@Component({
    selector: 'ngx-material-timepicker-24-hours-face',
    templateUrl: 'ngx-material-timepicker-24-hours-face.component.html'
})

export class NgxMaterialTimepicker24HoursFaceComponent extends NgxMaterialTimepickerHoursFaceComponent implements AfterContentInit {

    @Input() format: number;

    constructor() {
        super(24);
    }

    get disabledHours(): ClockFaceTime[] {
        if (this.minTime || this.maxTime) {

            return this.hoursList.map(value => {
                const currentTime = moment().hour(+value.time);

                return {
                    ...value,
                    disabled: currentTime.isBefore(this.minTime || null, 'hours')
                    || currentTime.isAfter(this.maxTime || null, 'hours')
                };
            });
        }
        return this.hoursList;
    }

    ngAfterContentInit() {
        this.hoursList = this.disabledHours;
    }
}
