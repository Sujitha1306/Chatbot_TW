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
export class DigitalQueueModel {
    constructor(
        public DQ_CA: boolean = true, //Common  Area
        public DQ_LA: boolean = true, //Lab
        public DQ_CN: boolean = true, //Consultation
        public DQ_SP: boolean = true, //Speciality
        public DQ_WA: boolean = true, //Waiting
        public DQ_IP: boolean = true, //In Progress
        public DQ_CO: boolean = true, //Completed

    ) {}
}
export class DigitalQueueModelCols {
    constructor(
        public DQ_CA: number = 1,
        public DQ_LA: number = 1,
        public DQ_CN: number = 1,
        public DQ_SP: number = 1,
        public DQ_WA: number = 1,
        public DQ_IP: number = 1,
        public DQ_CO: number = 1
    ) {}
}
export class DigitalQueueModelRows {
    constructor(
        public DQ_CA: number = 19,
        public DQ_LA: number = 19,
        public DQ_CN: number = 19,
        public DQ_SP: number = 19,
        public DQ_WA: number = 19,
        public DQ_IP: number = 19,
        public DQ_CO: number = 19
    ) {}
}
export class DigitalQueueModelId {
    constructor(
        public DQ_CA: string = 'grid-cl-r-1-2',
        public DQ_LA: string = 'grid-cl-r-1-2',
        public DQ_CN: string = 'grid-cl-r-1-2',
        public DQ_SP: string = 'grid-cl-r-1-2',
        public DQ_WA: string = 'grid-cl-r-1-2',
        public DQ_IP: string = 'grid-cl-r-1-2',
        public DQ_CO: string = 'grid-cl-r-1-2'
    ) {}
}

export class CreateManageRoom {
    constructor(
        public gender: string,
        public languages: any,
        public locationId: string,
    ) { }
}
