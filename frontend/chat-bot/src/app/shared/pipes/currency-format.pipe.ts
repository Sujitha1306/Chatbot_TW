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
import {  CurrencyPipe } from '@angular/common';

@Pipe({
    name: 'currencyFormatPipe',
    pure: true
})
export class CurrencyFormatPipe implements PipeTransform {
    constructor(@Inject(LOCALE_ID) protected localeId: string) { }
    currencyPipe = new CurrencyPipe(this.localeId);

    transform(value, code, display = 'symbol', digites = '0.2-2') {
        return this.currencyPipe.transform(value, code, display, digites, this.localeId);
    }
}
