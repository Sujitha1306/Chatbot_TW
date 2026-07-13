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
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    constructor() { }
    
    floorToNearest(amount: number, precision: number) {
        return Math.floor(amount / precision) * precision;
    }

    ceilToNearest(amount: number, precision: number) {
        return Math.ceil(amount / precision) * precision;
    }
    // differenceInMinutes(start, end) {
    //     differenceInMinutes(startOfHour(new Date()),startOfDay(new Date()))
    //     differenceInMinutes(startOfHour(new Date()),startOfDay(new Date()))
    // }

    

}