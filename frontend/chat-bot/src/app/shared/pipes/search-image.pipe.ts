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
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'searchStr',
    pure: true
})
export class SearchImagePipe implements PipeTransform {
    transform(value: string, fallback: string): any {
        let image = '';
        if (value) {
            image = value;
        } else if (fallback == '1') {
           image = '/assets/Alert/common_icons/fav.png';
        }
    }
}

// @Pipe({name: 'reverseStr'})
// export class ReverseStr implements PipeTransform {
//   transform(value: string): string {
//     let newStr: string = "";
//     for (let i = value.length - 1; i >= 0; i--) {
//       newStr += value.charAt(i);
//     }
//     return newStr;
//   }
// }
