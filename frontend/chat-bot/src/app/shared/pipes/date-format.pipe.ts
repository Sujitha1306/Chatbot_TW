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
import { formatDate } from '@angular/common';
import { Pipe, PipeTransform, LOCALE_ID, Inject  } from '@angular/core';

@Pipe({
  name: 'dateFormatPipe',
  pure: true
})
export class DateFormatPipe implements PipeTransform {
    constructor(@Inject(LOCALE_ID) protected localeId: string) { }

    transform(value: any, format: string): any  {

        if (!value) { return ''; }
        if (!format) { format = 'yyyy/MM/dd'; }

        return formatDate(value, format, this.localeId);
    }
}

@Pipe({
  name: 'ageFormat',
  pure: true
})
export class AgeFormatPipe implements PipeTransform {

  transform(age: number): string {
    if (age === null || age === undefined) return '';

    if (age === 0) {
      return 'Just born';
    } 
    else if (age < 30) {
      return `${age} Days`;
    }
    else if (age < 365) {
      const months = Math.floor(age / 30);
      return `${months} Month${months > 1 ? 's' : ''}`;
    }
    else {
      const years = Math.floor(age / 365);
      return `${years} Year${years > 1 ? 's' : ''}`;
    }
  }
}
