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
// export class CreateProfile {
//     constructor(
//         public id: number,
//         public firstName: string,
//         public email: string,
//         public address: string,
//         public phoneNumber: string
//     ) {}
// }
export class EditProfile {
    constructor(
        public id: number,
        public firstName: string,
        public email: string,
        public address: string,
        public phoneNumber: string
    ) {
    }
}

export class EditUser {
    constructor(
        public id: number,
        public firstName: string,
        public lastName: string,
        public address: string,
        public gender: any,
        public birthDate: any,
        public email: string,
        public phoneNumber: any,
        public roleIds: any,
        public customerId: string,
        public regionId: string,
        public facilityId: string,
        public entityDepartmentLinks: [],
    ) {
    }
}