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
import {Injectable} from '@angular/core';
import {ClockFaceTime} from '../models/clock-face-time.interface';
import {BehaviorSubject, Observable} from 'rxjs';
import {TimePeriod} from '../models/time-period.enum';
import {TimeAdapter} from './time-adapter';


const DEFAULT_HOUR: ClockFaceTime = {
    time: 12,
    angle: 360
};
const DEFAULT_MINUTE: ClockFaceTime = {
    time: '00',
    angle: 360
};

@Injectable()
export class NgxMaterialTimepickerService {

    private readonly hourSubject = new BehaviorSubject<ClockFaceTime>(DEFAULT_HOUR);
    private readonly minuteSubject = new BehaviorSubject<ClockFaceTime>(DEFAULT_MINUTE);
    private readonly periodSubject = new BehaviorSubject<TimePeriod>(TimePeriod.AM);

    set hour(hour: ClockFaceTime) {
        this.hourSubject.next(hour);
    }

    get selectedHour(): Observable<ClockFaceTime> {
        return this.hourSubject.asObservable();
    }

    set minute(minute: ClockFaceTime) {
        this.minuteSubject.next(minute);
    }

    get selectedMinute(): Observable<ClockFaceTime> {
        return this.minuteSubject.asObservable();
    }

    set period(period: TimePeriod) {
        this.periodSubject.next(period);
    }

    get selectedPeriod(): Observable<TimePeriod> {
        return this.periodSubject.asObservable();
    }

    set defaultTime(time: string) {
        const [hours, minutes] = time.split(':').map(Number);
        const defaultTime = new Date();
        defaultTime.setHours(hours, minutes, 0, 0);
        const isValid = !isNaN(new Date(defaultTime).getTime());
        if (isValid) {
            this.hour = {...DEFAULT_HOUR, time: defaultTime.getHours() === 0 ? '00' : defaultTime.getHours()};
            this.minute = {...DEFAULT_MINUTE, time: defaultTime.getMinutes() === 0 ? '00' : defaultTime.getMinutes()};
            this.period = <TimePeriod>time.substr(time.length - 2).toUpperCase();
        } else {
            this.resetTime();
        }
    }

    getFullTime(format: number): string {
        const hour = this.hourSubject.getValue().time;
        const minute = this.minuteSubject.getValue().time;
        const period = this.periodSubject.getValue();

        return TimeAdapter.formatTime(`${hour}:${minute} ${period}`, format);
    }

    private resetTime(): void {
        this.hour = {...DEFAULT_HOUR};
        this.minute = {...DEFAULT_MINUTE};
        this.period = TimePeriod.AM;
    }
}
