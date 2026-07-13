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
        public DQWL_IP: boolean = true, //Inprogress
        public DQWL_WA: boolean = true, //Waiting
        public DQWL_CO: boolean = true, //Completed
        public DQWL_QL: boolean = true, //Queue List
    ) {}
}
export class DigitalQueueModelCols {
    constructor(
        public DQWL_IP: number = 1,
        public DQWL_WA: number = 3,
        public DQWL_CO: number = 1,
        public DQWL_QL: number = 1
    ) {}
}
export class DigitalQueueModelRows {
    constructor(
        public DQWL_IP: number = 19,
        public DQWL_WA: number = 19,
        public DQWL_CO: number = 19,
        public DQWL_QL: number = 1
    ) {}
}
export class DigitalQueueModelId {
    constructor(
        public DQWL_IP: string = 'grid-cl-r-1-2',
        public DQWL_WA: string = 'grid-cl-r-3-2',
        public DQWL_CO: string = 'grid-cl-r-1-2',
        public DQWL_QL: string = 'grid-cl-r-1-1'
    ) {}
}
