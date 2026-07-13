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
export class WidDashboardModel {
    constructor(
        public WD_DBFP: boolean = false, //Common widget of tracker view
        public WD_DBE: boolean = false,
        public WD_DBPT: boolean = false,
        public WD_DBACP: boolean = false,
        public WD_DBVC: boolean = false,
        public WD_DBPS: boolean = false,
        public WD_DBAA: boolean = false,
        public WD_DBAP: boolean = false,
        public WD_DBAD: boolean = false,
        public WD_DBAN: boolean = false,
        public WD_DBPR: boolean = false,
        public WD_DBSC: boolean = false,
        public WD_DBNA: boolean = false
    ) {}
}
export class WidDashboardModelCols {
    constructor(
        public WD_DBFP: number = 2,
        public WD_DBE: number = 3,
        public WD_DBPT: number = 1,
        public WD_DBACP: number = 1,
        public WD_DBVC: number = 1,
        public WD_DBPS: number = 2,
        public WD_DBAA: number = 1,
        public WD_DBAP: number = 1,
        public WD_DBAD: number = 1,
        public WD_DBAN: number = 1,
        public WD_DBPR: number = 2,
        public WD_DBSC: number = 1,
        public WD_DBNA: number = 3
    ) {}
}
export class WidDashboardModelRows {
    constructor(
        public WD_DBFP: number = 2,
        public WD_DBE: number =  3,
        public WD_DBPT: number = 1,
        public WD_DBACP: number = 1,
        public WD_DBVC: number = 1,
        public WD_DBPS: number = 2,
        public WD_DBAA: number = 1,
        public WD_DBAP: number = 1,
        public WD_DBAD: number = 1,
        public WD_DBAN: number = 1,
        public WD_DBPR: number = 2,
        public WD_DBSC: number = 1,
        public WD_DBNA: number = 3
    ) {}
}
export class WidDashboardModelId {
    constructor(
        public WD_DBFP: string = 'grid-cl-r-2-2',
        public WD_DBE: string = 'grid-cl-r-3-3',
        public WD_DBPT: string = 'grid-cl-r-1-1',
        public WD_DBACP: string = 'grid-cl-r-2-2',
        public WD_DBVC: string = 'grid-cl-r-2-2',
        public WD_DBPS: string = 'grid-cl-r-2-2',
        public WD_DBAA: string = 'grid-cl-r-2-2',
        public WD_DBAP: string = 'grid-cl-r-2-2',
        public WD_DBAD: string = 'grid-cl-r-2-2',
        public WD_DBAN: string = 'grid-cl-r-2-2',
        public WD_DBPR: string = 'grid-cl-r-2-2',
        public WD_DBSC: string = 'grid-cl-r-2-2',
        public WD_DBNA: string = 'grid-cl-r-3-3'
    ) {}
}
