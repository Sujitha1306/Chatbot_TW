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
export class EnvironmentReportModel {
    constructor(
        public ER_CSH: boolean = true,
        public ER_CSM: boolean = true,
        public ER_CSBT: boolean = false,
        public ER_CSBH: boolean = false,
        public ER_CSBP: boolean = false,
        public ER_AH: boolean = true,
        public ER_ALDD: boolean = true,
        public ER_ADDD: boolean = true,
        public ER_AFTD: boolean = true,
        public ER_AGIB: boolean = true,
        public ER_ART: boolean = true,
        public ER_ARP: boolean = true,
        public ER_ARH: boolean = true,
        public ER_ARA: boolean = true,
    ) {}
}
export class EnvironmentReportModelCols {
    constructor(
        public ER_CSH: number = 1,
        public ER_CSM: number = 2,
        public ER_CSBT: number = 1,
        public ER_CSBH: number = 1,
        public ER_CSBP: number = 1,
        public ER_AH: number = 1,
        public ER_ALDD: number = 1,
        public ER_ADDD: number = 1,
        public ER_AFTD: number = 1,
        public ER_AGIB: number = 1,
        public ER_ART: number = 4,
        public ER_ARP: number = 4,
        public ER_ARH: number = 4,
        public ER_ARA: number = 4
    ) {}
}
export class EnvironmentReportModelRows {
    constructor(
        public ER_CSH: number = 1,
        public ER_CSM: number = 2,
        public ER_CSBT: number = 2,
        public ER_CSBH: number = 2,
        public ER_CSBP: number = 2,
        public ER_AH: number = 1,
        public ER_ALDD: number = 1,
        public ER_ADDD: number = 1,
        public ER_AFTD: number = 1,
        public ER_AGIB: number = 1,
        public ER_ART: number = 2,
        public ER_ARP: number = 2,
        public ER_ARH: number = 2,
        public ER_ARA: number = 2,
    ) {}
}
export class EnvironmentReportModelId {
    constructor(
        public ER_CSH: string = 'grid-cl-r-1-1',
        public ER_CSM: string = 'grid-cl-r-2-2',
        public ER_CSBT: string = 'grid-cl-r-1-2',
        public ER_CSBH: string = 'grid-cl-r-1-2',
        public ER_CSBP: string = 'grid-cl-r-1-2',
        public ER_AH: string = 'grid-cl-r-1-1',
        public ER_ALDD: string = 'grid-cl-r-1-1',
        public ER_ADDD: string = 'grid-cl-r-1-1',
        public ER_AFTD: string = 'grid-cl-r-1-1',
        public ER_AGIB: string = 'grid-cl-r-1-1',
        public ER_ART: string = 'grid-cl-r-4-2',
        public ER_ARP: string = 'grid-cl-r-4-2',
        public ER_ARH: string = 'grid-cl-r-4-2',
        public ER_ARA: string = 'grid-cl-r-4-2',
    ) {}
}
