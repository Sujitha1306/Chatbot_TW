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
import { Pipe, PipeTransform, LOCALE_ID, Inject } from '@angular/core';
import { formatNumber } from '@angular/common';

@Pipe({
    name: 'numberFormatPipe',
    pure: true
})
export class NumberFormatPipe implements PipeTransform {
    constructor(@Inject(LOCALE_ID) protected localeId: string) { }

    transform(value: any, format: string): any  {

        if (!value) { return ''; }
        if (!format) { format = '2.2-3'; }

        return formatNumber(value, this.localeId, format);
    }
}
