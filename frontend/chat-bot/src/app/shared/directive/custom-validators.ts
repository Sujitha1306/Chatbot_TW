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

import { ValidatorFn, AbstractControl } from '@angular/forms';

export function customValidator(maxlength: number, min: number, max: number, minchar: number, maxchar: number, numberOnly: boolean, charOnly: boolean, specialCharacter: boolean): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {

        /* Note: 
          maxlength - can be number or character;
          min - minimum value; 
          max - maximum value; 
          minchar - minimum character; 
          maxchar - maximum character;*/

        let number_pattern = /^[0-9]+$/;
        let white_space = /^\S$|^\S[\s\S]*\S$/;
        let char_pattern = /^[a-zA-Z\s]+$/;
        let special_character = /^[^`~!@#$%\^&*()_+={}|[\]\\:';"<>?,./]*$/;

        if (control.value != null && control.value != '') {

            if (String(control.value).length > maxlength) {
                return { maxLength: true };                    // If validation fails, it returns an object, which has key and a value
            }

            if (!specialCharacter && !special_character.test(control.value)) {
                return { specialCharacterValidation: true };
            }

            if (!white_space.test(control.value)) {
                return { whitespacevalidation: true };
            }

            if (numberOnly && control.value !=0) {
                if (!number_pattern.test(control.value)) {
                    return { numberPattern: true };
                }

                if (control.value !== undefined && (control.value < min || control.value > max)) {
                    return { numberRange: true };
                }
            }
            else if (charOnly) {
                if (!char_pattern.test(control.value)) {
                    return { characterPattern: true };
                }

                if (control.value !== undefined && !(Number(String(control.value).length) >= minchar && Number(String(control.value).length) <= maxchar)) {
                    return { characterRange: true };
                }
            }
            else {
                if (control.value !== undefined && !(Number(String(control.value).length) >= minchar && Number(String(control.value).length) <= maxchar)) {
                    return { characterLength: true };
                }
            }
            return null;                             // If validation passes it returns null
        }
    }
}