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
//NO SONAR

import { Injectable } from '@angular/core';
import { CalendarEvent, CalendarView } from 'angular-calendar';

@Injectable({
    providedIn: 'root'
})

export class CalendarModel {

    public colors = {
        default: { primary:  'var(--quinary-color)', secondary:  'var(--tertiary-color)' },
        red: { primary: '#ad2121', secondary: '#FAE3E3' },
        blue: { primary: '#1e90ff', secondary: '#D1E8FF' },
        yellow: { primary: '#e3bc08', secondary: '#FDF1BA' },
    };

    constructor() { }

    getcolors(params?: string) {
        if (params && this.colors[params]) {
            return this.colors[params];
        }
        return this.colors.default;
    }

}

export class CalendarEvents {
    externalEvents: CalendarEvent[] = [
        {
            title: 'Doctor Task 1',
            color: null,
            start: new Date(),
            draggable: true,
        },
        {
            title: 'Doctor Task 2',
            color: null,
            start: new Date(),
            draggable: true,
        },
    ];
}

export class CalendarInputModel {
    constructor(
        public entityId: number | null = null,
        public entityType: string | null = null,
        public fromDate: Date | null = null,
        public toDate: Date | null = null,
        public fromTime: string | null = null,
        public toTime: string | null = null,
        public status: string | null = null,
        public options: any = {},
        public refresh: boolean | null = null,
        public data: any = null,
        public location: string | null = null,
        public groupFilter: any = null
    ) { }
}

export class CalDetailModel {
    constructor(
        public view: CalendarView = CalendarView.Day,
        public selectedDate: Date = new Date(),
        public selectedEndDate: Date = new Date(),
        public dayStartHour: number = 9,
        public dayEndHour: number = 20,
        public hourSegments: number = 2,
        public weekStartsOn: 1 = 1
    ) { }
}

export class EntityDataModel {
    constructor(
        public CAL_AMC: any[] = [],
        public CAL_AS: any[] = [],
        public CAL_PA: any[] = [],
        public CAL_US: any[] = [],
        public CAL_LOC: any[] = [],
        public CAL_PO: any[] = [],
        public CAL_OT: any[] = [],
        public booking: any[] = [],
        public CAL_MS: any[] = []
    ) { }
}

export class TableDetailModel {
    constructor(
        public name: string,
        public frequency: string,
        public birthDate: string,
        public date: any,
        public assign: string,
        public calId: any,
        public startTime: any,
        public endTime: any,
        public gender: any,
        public id: any
    ) { }
}

export class CalendarConfig {
    dynamicColosData: any;
    dynamicConfigData: any;
}

export class calendarBoolen {
    activeDayIsOpen: boolean = false;
    resourceExpandRight: boolean = false;
    threeDaysExist: boolean = false;
    resourceExpand: boolean = true;
    loading: boolean = false;
    isloading: boolean = false;
}