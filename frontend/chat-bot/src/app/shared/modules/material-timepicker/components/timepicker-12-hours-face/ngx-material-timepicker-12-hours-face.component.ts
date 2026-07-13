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
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxMaterialTimepickerHoursFaceComponent} from '../timepicker-hours-face/ngx-material-timepicker-hours-face.component';
import {TimePeriod} from '../../models/time-period.enum';
import {ClockFaceTime} from '../../models/clock-face-time.interface';
import * as _moment from 'moment';

const moment = _moment;


@Component({
    selector: 'ngx-material-timepicker-12-hours-face',
    templateUrl: 'ngx-material-timepicker-12-hours-face.component.html'
})

export class NgxMaterialTimepicker12HoursFaceComponent extends NgxMaterialTimepickerHoursFaceComponent implements OnChanges {

    @Input() period: TimePeriod;

    constructor() {
        super(12);
    }

    get disabledHours(): ClockFaceTime[] {
        if (this.minTime || this.maxTime) {

            return this.hoursList.map(value => {
                const currentHour = this.period === TimePeriod.AM ? +value.time : +value.time + 12;
                const hour = this.period === TimePeriod.AM && currentHour === 12 ? 0 : currentHour;
                const currentTime = moment().hour(hour);

                return {
                    ...value,
                    disabled: currentTime.isBefore(this.minTime || null, 'hours')
                    || currentTime.isAfter(this.maxTime || null, 'hours')
                };
            });
        }
        return this.hoursList;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['period'] && changes['period'].currentValue) {
            this.hoursList = this.disabledHours;
        }
    }
}
