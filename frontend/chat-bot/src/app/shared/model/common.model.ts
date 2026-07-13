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
export class LoginModel {
    constructor(
        public username: string,
        public password: string,
        public isUserPreference: boolean,
        public recaptchaResponse?: string
    ) { }
}
export class ResetModel {
    constructor(
        public oldPassword: string,
        public newPassword: string,
    ) { }
}
export class ForgetModel {
    constructor(
        public email: string,
        public otpCode: string,
        public newPassword: string,
    ) { }
}
export class ForgotPasswordModel {
    constructor(
        public username: string,
        public newPassword: string,
        public code: string,

    ) { }
}

export class UpdateForgotPasswordModel {
    constructor(
        public code: string,
        public username: string,
        public password: string,
        public newPassword: string,
    ) { }
}
export class UpdatePasswordModel {
    constructor(
        public oldPassword: string,
        public newPassword: string,
        public otpCode: string,
        public email: string,
    ) { }
}
