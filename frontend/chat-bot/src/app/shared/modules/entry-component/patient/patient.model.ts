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
export class PatientModel {
    constructor(
        public uhid: string,
        public patientName: string,
        public tagId: string,
        public packagePlanId: number,
        public isDetachable: boolean,
        public tagTypeId: string
         ) {}
}

export class ClinicalModel {
    constructor(
        public patientId: string,
        public healthPlanId: string,
        public patientVisitId: string,
        public vipTypeId: string,
        public preferedLanguage: string,
        public isDiabetic: boolean,
        public isFasting: boolean,
        public isVulnerable: boolean,
        public isPregnant: boolean,
        public tagTypeId: string,
        public tagId: string,
        public token: string,
         ) {}
}
export class PatientVitalModelCols {
    constructor(
        public PR_CSH: number = 1,
        public PR_CSIP: number = 1,
        public PR_CSOP: number = 1,
        public PR_CSHC: number = 1,
        public PR_CSPT: number = 1,
        public PR_AH: number = 1,
        public PR_AIT: number = 1,
        public PR_AIPS: number = 1,
        public PR_AISI: number = 1,
        public PR_AILS: number = 1,
        public PR_AIFD: number = 1,
        public PR_AITD: number = 1,
        public PR_AIB: number = 1,
        public PR_PVH: number = 1,
        public PR_PI: number = 1,
        public PR_PVD: number = 3,
        public PR_PE: number = 4,
        public PR_PE1: number = 1,
        public PR_PE2: number = 1,
        public PR_PE3: number = 1,
        public PR_PE4: number = 1,
        public PR_WU: number = 4,
        public PR_WU1: number = 1,
        public PR_WU2: number = 1,
        public PR_WU3: number = 1,
        public PR_WU4: number = 1,
        public PR_PC: number = 2,
        public PR_PR: number = 2,
        public PR_EW: number = 4,
        public PR_EW1: number = 1,
        public PR_EW2: number = 1,
        public PR_EW3: number = 1,
        public PR_EW4: number = 1,
        public PR_EW5: number = 1,
        public PR_PL: number = 4

    ) {}
}
export class PatientVitalModelRows {
    constructor(
        public PR_CSH: number = 1,
        public PR_CSIP: number = 1,
        public PR_CSOP: number = 1,
        public PR_CSHC: number = 1,
        public PR_CSPT: number = 1,
        public PR_AH: number = 1,
        public PR_AIT: number = 1,
        public PR_AIPS: number = 1,
        public PR_AISI: number = 1,
        public PR_AILS: number = 1,
        public PR_AIFD: number = 1,
        public PR_AITD: number = 1,
        public PR_AIB: number = 1,
        public PR_PVH: number = 1,
        public PR_PI: number = 3,
        public PR_PVD: number = 3,
        public PR_PE: number = 5,
        public PR_PE1: number = 1,
        public PR_PE2: number = 1,
        public PR_PE3: number = 1,
        public PR_PE4: number = 1,
        public PR_WU: number = 5,
        public PR_WU1: number = 1,
        public PR_WU2: number = 1,
        public PR_WU3: number = 1,
        public PR_WU4: number = 1,
        public PR_PC: number = 3,
        public PR_PR: number = 3,
        public PR_EW: number = 6,
        public PR_EW1: number = 1,
        public PR_EW2: number = 1,
        public PR_EW3: number = 1,
        public PR_EW4: number = 1,
        public PR_EW5: number = 1,
        public PR_PL: number = 3

    ) {}
}
