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
import * as _moment from 'moment';
import {Moment} from 'moment';
import {TimeFormat} from '../models/time-format.enum';

const moment = _moment;

export class TimeAdapter {

    static formatTime(time: string, format = 12): string {
        const timeFormat = format === 24 ? TimeFormat.TWENTY_FOUR : TimeFormat.TWELVE;
        return moment(time, timeFormat).format(timeFormat);
    }

    static convertTimeToMoment(time: string): Moment {
        return moment(time, TimeFormat.TWELVE);
    }

}
