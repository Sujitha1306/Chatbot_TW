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
export const charts = {
    'complaint' : {
        type : 'line',
        flag : { legend : true, datalabels : true},
        name : {x : 'Department', y : 'Count', label : 'Complaints'},
        color : [{background : 'yellow', borderColor : null, }]
    },
    'nonComplaint' : {
        type : 'line',
        flag : { legend : true, datalabels : true},
        name : {x : 'Department', y : 'Count', label : 'Non-Complaints'},
        color : [{background : 'green', borderColor : null, }]
    },
    'quarantined' : {
        type : 'line',
        flag : { legend : true, datalabels : true},
        name : {x : 'Department', y : 'Count', label : 'Quarantined'},
        color : [{background : 'red', borderColor : null, }]
    },
    'headCount' : {
        type : 'bar',
        flag : { legend : true, datalabels : true},
        name : {x : 'Department', y : 'Count', label : 'Head Count by Department'},
        color : [{background : null, borderColor : null, }]
    },
    'sdAlert' : {
        type : 'bar',
        flag : { legend : true, datalabels : true},
        name : {x : 'Department', y : 'Count', label : 'Head Count by Department'},
        color : [{background : null, borderColor : null, }]
    }
};

export class WidDashboardModel {
    constructor(
        public WD_DBFP: boolean = true, // TRACKER VIEW
        public WD_DBE: boolean = false, // EVENTS
        public WD_DBPC: boolean = false, // PATIENT COUNT
        public WD_DBACT: boolean = false, // AVERAGE CONTACT TIME
        public WD_DBAWT: boolean = false, // AVERAGE WAIT TIME
        public WD_DBAWT1: boolean = false, // AVERAGE WAIT TIME FOR "From Registration to Nursing Assessment"
        public WD_DBAWT2: boolean = false, // AVERAGE WAIT TIME FOR "From Nursing Assessment to Care Area"
        public WD_DBAWT3: boolean = false, // AVERAGE WAIT TIME FOR "From Care Area to Scan Area"
        public WD_DBAWT4: boolean = false, // AVERAGE WAIT TIME FOR "From Scan Area to XRay"
        public WD_DBAWT5: boolean = false, // AVERAGE WAIT TIME FOR "From XRay to Billing"
        public WD_DBPR: boolean = false, // PATIENT RATIO
        public WD_DBOPV: boolean = false, // OUTPATIENT VISIT
        public WD_DBPTAT: boolean = false, // PATIENT TURN AROUND TIME
        public WD_DBPVC: boolean = false, // PATIENT VISIT COUNT
        public WD_DBPIT: boolean = false, // AVERAGE LENGTH OF STAY
        public WD_DBPS: boolean = false, // PATIENT STATUS
        public WD_DBBOS: boolean = false, // BED OCCUPANCY STATUS
        public WD_DBAS: boolean = false, // ASSET STATUS
        public WD_DBIPAWT: boolean = false, // Average waiting time to board and MD to Discharge

        public WD_DBHCS: boolean = true, // Health Check Summary
        public WD_DBHCPS: boolean = true, // Health Check Plan Summary
        public WD_DBHCTS: boolean = true, // Health Check Test Summary
        public WD_DBHCLC: boolean = true, // Health Check Location Utilization

        public WD_DBEMPS: boolean = false, // Employee summary
        public WD_DBEMPHD: boolean = false, // employee head by department
        public WD_DBEMPSD: boolean = false, // employee social distancing
        public WD_DBEMPSDS: boolean = false // employee social distancing summary

    ) {}
}
export class WidDashboardModelCols {
    constructor(
        public WD_DBFP: number = 3,
        public WD_DBE: number = 2,
        public WD_DBPC: number = 2,
        public WD_DBACT: number = 2,
        public WD_DBAWT: number = 5,
        public WD_DBAWT1: number = 1,
        public WD_DBAWT2: number = 1,
        public WD_DBAWT3: number = 1,
        public WD_DBAWT4: number = 1,
        public WD_DBAWT5: number = 1,
        public WD_DBPR: number = 4,
        public WD_DBOPV: number = 3,
        public WD_DBPTAT: number = 4,
        public WD_DBPVC: number = 5,
        public WD_DBPIT: number = 7,
        public WD_DBPS: number = 2,
        public WD_DBBOS: number = 2,
        public WD_DBAS: number = 3,
        public WD_DBIPAWT: number = 2,
        public WD_DBHCS: number = 2, // Health Check Summary
        public WD_DBHCPS: number = 3, // Health Check Plan Summary
        public WD_DBHCTS: number = 4, // Health Check Test Summary
        public WD_DBHCLC: number = 2, // Health Check Location Utilization
        public WD_DBEMPS: number = 2, // Employee summary
        public WD_DBEMPHD: number = 4, // employee head by department
        public WD_DBEMPSD: number = 3 // employee social distancing


    ) {}
}
export class WidDashboardModelRows {
    constructor(
        public WD_DBFP: number = 3,
        public WD_DBE: number =  3,
        public WD_DBPC: number =  4,
        public WD_DBACT: number = 3,
        public WD_DBAWT: number = 2,
        public WD_DBAWT1: number = 2,
        public WD_DBAWT2: number = 2,
        public WD_DBAWT3: number = 2,
        public WD_DBAWT4: number = 2,
        public WD_DBAWT5: number = 2,
        public WD_DBPR: number = 3,
        public WD_DBOPV: number = 3,
        public WD_DBPTAT: number = 3,
        public WD_DBPVC: number = 2,
        public WD_DBPIT: number = 3,
        public WD_DBPS: number = 2,
        public WD_DBBOS: number = 3,
        public WD_DBAS: number = 2,
        public WD_DBIPAWT: number = 2,
        public WD_DBHCS: number = 3, // Health Check Summary
        public WD_DBHCPS: number = 3, // Health Check Plan Summary
        public WD_DBHCTS: number = 3, // Health Check Test Summary
        public WD_DBHCLC: number = 3, // Health Check Location Utilization
        public WD_DBEMPS: number = 3, // Employee summary
        public WD_DBEMPHD: number = 3, // employee head by department
        public WD_DBEMPSD: number = 3 // employee social distancing


    ) {}
}
export class WidDashboardModelId {
    constructor(
        public WD_DBFP: string = 'grid-cl-r-3-3',
        public WD_DBE: string = 'grid-cl-r-2-3',
        public WD_DBPC: string = 'grid-cl-r-2-4',
        public WD_DBACT: string = 'grid-cl-r-2-3',
        public WD_DBAWT: string = 'grid-cl-r-5-2',
        public WD_DBAWT1: string = 'grid-cl-r-1-2',
        public WD_DBAWT2: string = 'grid-cl-r-1-2',
        public WD_DBAWT3: string = 'grid-cl-r-1-2',
        public WD_DBAWT4: string = 'grid-cl-r-1-2',
        public WD_DBAWT5: string = 'grid-cl-r-1-2',
        public WD_DBPR: string = 'grid-cl-r-4-3',
        public WD_DBOPV: string = 'grid-cl-r-3-3',
        public WD_DBPTAT: string = 'grid-cl-r-4-3',
        public WD_DBPVC: string = 'grid-cl-r-5-2',
        public WD_DBPIT: string = 'grid-cl-r-2-2',
        public WD_DBPS: string = 'grid-cl-r-2-2',
        public WD_DBBOS: string = 'grid-cl-r-2-3',
        public WD_DBAS: string = 'grid-cl-r-3-2',
        public WD_DBIPAWT: string = 'grid-cl-r-2-2',
        public WD_DBHCS: string = 'grid-cl-r-2-3', // Health Check Summary
        public WD_DBHCPS: string = 'grid-cl-r-2-3', // Health Check Plan Summary
        public WD_DBHCTS: string = 'grid-cl-r-3-3', // Health Check Test Summary
        public WD_DBHCLC: string = 'grid-cl-r-2-3', // Health Check Location Utilization
        public WD_DBEMPS: string = 'grid-cl-r-2-3', // Employee summary
        public WD_DBEMPHD: string = 'grid-cl-r-4-3', // employee head by department
        public WD_DBEMPSD: string = 'grid-cl-r-3-3' // employee social distancing

    ) {}
}
export class WidDashboardModelFuncation {
    constructor(
        public WD_DBFP: boolean = false,
        public WD_DBE: boolean = true,
        public WD_DBPC: boolean = false,
        public WD_DBACT: boolean = false,
        public WD_DBAWT: boolean = false,
        public WD_DBPR: boolean = false,
        public WD_DBOPV: boolean = false,
        public WD_DBPTAT: boolean = false,
        public WD_DBPVC: boolean = false,
        public WD_DBPIT: boolean = true,
        public WD_DBPS: boolean = false,
        public WD_DBBOS: boolean = false,
        public WD_DBAS: boolean = false,
        public WD_DBIPAWT: boolean = false,
        public WD_DBHCS: boolean = true, // Health Check Summary
        public WD_DBHCPS: boolean = true, // Health Check Plan Summary
        public WD_DBHCTS: boolean = true, // Health Check Test Summary
        public WD_DBHCLC: boolean = true, // Health Check Location Utilization
        public WD_DBEMPS: boolean = true, // Employee summary
        public WD_DBEMPHD: boolean = true, // employee head by department
        public WD_DBEMPSD: boolean = true // employee social distancing

    ) {}
}
