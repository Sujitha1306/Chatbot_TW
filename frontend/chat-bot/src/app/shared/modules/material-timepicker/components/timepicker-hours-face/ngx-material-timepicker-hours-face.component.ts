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
import { EventEmitter, HostListener, Input, Output, Directive } from '@angular/core';
import {ClockFaceTime} from '../../models/clock-face-time.interface';
import {Moment} from 'moment';


@Directive()
export abstract class NgxMaterialTimepickerHoursFaceComponent {

    @Input() selectedHour: ClockFaceTime;
    @Input() minTime: Moment;
    @Input() maxTime: Moment;
    @Output() hourChange = new EventEmitter<ClockFaceTime>();
    @Output() hourSelected = new EventEmitter<null>();

    hoursList: ClockFaceTime[] = [];

    constructor(hours: number) {
        this.initHours(hours);
    }

    abstract get disabledHours(): ClockFaceTime[]

    @HostListener('touchend')
    @HostListener('click')
    onClick() {
        this.hourSelected.next();
    }

    initHours(hours: number): void {
        const angleStep = 30;

        this.hoursList = Array(hours).fill(1).map((v, i) => {
            const time = v + i;
            return {time: time === 24 ? '00' : time, angle: angleStep * time};
        });
    }
}
