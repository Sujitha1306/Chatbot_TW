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
export class MaintenanceReportModel {
    constructor(
        public MR_CSH: boolean = true,
        public MR_CST: boolean = true,
        public MR_CSR: boolean = true,
        public MR_CSG: boolean = true,
        public MR_ACS: boolean = true,
        public MR_ACS1: boolean = true,
        public MR_ACS2: boolean = true,
        public MR_ACS3: boolean = true,
        public MR_ACS4: boolean = true,
        public MR_ACS5: boolean = true,
        public MR_ARS: boolean = true,
        public MR_ARS1: boolean = true,
        public MR_ARS2: boolean = true,
        public MR_ARS3: boolean = true,
        public MR_ARS4: boolean = true,
        public MR_ARS5: boolean = true,
        public MR_AGD: boolean = false,
        public MR_AGD1: boolean = false,
        public MR_AGD2: boolean = false,
        public MR_AGD3: boolean = false,
        public MR_ATBS: boolean = false
    ) {}
}
export class MaintenanceReportModelCols {
    constructor(
        public MR_CSH: number = 1,
        public MR_CST: number = 1,
        public MR_CSR: number = 1,
        public MR_CSG: number = 1,
        public MR_ACS: number = 4,
        public MR_ACS1: number = 1,
        public MR_ACS2: number = 1,
        public MR_ACS3: number = 1,
        public MR_ACS4: number = 1,
        public MR_ACS5: number = 1,
        public MR_ARS: number = 4,
        public MR_ARS1: number = 1,
        public MR_ARS2: number = 1,
        public MR_ARS3: number = 1,
        public MR_ARS4: number = 1,
        public MR_ARS5: number = 1,
        public MR_AGD: number = 4,
        public MR_AGD1: number = 4,
        public MR_AGD2: number = 2,
        public MR_AGD3: number = 2,
        public MR_ATBS: number = 4
    ) {}
}
export class MaintenanceReportModelRows {
    constructor(
        public MR_CSH: number = 1,
        public MR_CST: number = 1,
        public MR_CSR: number = 1,
        public MR_CSG: number = 1,
        public MR_ACS: number = 2,
        public MR_ACS1: number = 2,
        public MR_ACS2: number = 1,
        public MR_ACS3: number = 1,
        public MR_ACS4: number = 1,
        public MR_ACS5: number = 1,
        public MR_ARS: number = 2,
        public MR_ARS1: number = 1,
        public MR_ARS2: number = 1,
        public MR_ARS3: number = 1,
        public MR_ARS4: number = 1,
        public MR_ARS5: number = 1,
        public MR_AGD: number = 3,
        public MR_AGD1: number = 1,
        public MR_AGD2: number = 3,
        public MR_AGD3: number = 3,
        public MR_ATBS: number = 3
    ) {}
}
export class MaintenanceReportModelId {
    constructor(
        public MR_CSH: string = 'grid-cl-r-1-1',
        public MR_CST: string = 'grid-cl-r-1-1',
        public MR_CSR: string = 'grid-cl-r-1-1',
        public MR_CSG: string = 'grid-cl-r-1-1',
        public MR_ACS: string = 'grid-cl-r-4-2',
        public MR_ACS1: string = 'grid-cl-r-1-1',
        public MR_ACS2: string = 'grid-cl-r-1-1',
        public MR_ACS3: string = 'grid-cl-r-1-1',
        public MR_ACS4: string = 'grid-cl-r-1-1',
        public MR_ACS5: string = 'grid-cl-r-1-1',
        public MR_ARS: string = 'grid-cl-r-4-2',
        public MR_ARS1: string = 'grid-cl-r-1-1',
        public MR_ARS2: string = 'grid-cl-r-1-1',
        public MR_ARS3: string = 'grid-cl-r-1-1',
        public MR_ARS4: string = 'grid-cl-r-1-1',
        public MR_ARS5: string = 'grid-cl-r-1-1',
        public MR_AGD: string = 'grid-cl-r-4-3',
        public MR_AGD1: string = 'grid-cl-r-0-0',
        public MR_AGD2: string = 'grid-cl-r-0-0',
        public MR_AGD3: string = 'grid-cl-r-0-0',
        public MR_ATBS: string = 'grid-cl-r-4-3'
    ) {}
}
