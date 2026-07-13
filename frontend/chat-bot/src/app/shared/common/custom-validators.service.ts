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
import {  FormGroup, } from '@angular/forms';
@Injectable()
export class CustomValidators {
  

  static validateOption(value,list:any[],key:string){
    console.log(value,list,key)
    console.log("service is used")
    const valid = list.some(O => O.get(key) === value);
    return valid;
  }

  static validateField(form: FormGroup, fieldName: string, list: any[], key: string): boolean {
    const control = form.get(fieldName);
    if (!control) return false;
    const enteredValue = control.value;
    const isValid = list.some(item => item[key] === enteredValue);
    return isValid;
  }
}
