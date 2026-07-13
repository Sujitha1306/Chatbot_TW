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

export class MetaField {
    constructor(
        public label: string,
        public value: string
    ) { }
}

export class AssetOverviewData {
    constructor(
        public basicInfo: AssetBasicInfo,
        public workflow?: AssetWorkflowBanner,
        public tickets?: TicketSummary,
        public workOrders?: WorkOrderSummary,
        public maintenance?: MaintenanceItem[],
        public costs?: CostSummary,
        public metaFields?: MetaField[],
    ) { }
}

export class AssetBasicInfo {
    constructor(
        public assetId: string,
        public assetName: string,
        public assetIcon: string,
        public status: string,
        public statusClass: string,
        public badges: AssetBadge[],
        public HomeLocation: string,
        public Manufacturer: string,
        public model: string,
        public serialNo: string,
        public installedDate: string,
        public custodian: string,
        public lastUpdated: string
    ) { }
}

export class AssetBadge {
    constructor(
        public label: string,
    ) { }
}

export class AssetWorkflowBanner {
    constructor(
        public title: string,
        public subtitle: string,
        public steps: WorkflowStep[],
        public currentStep: number,
        public totalSteps: number,
        public dismissible: boolean
    ) { }
}

export class WorkflowStep {
    constructor(
        public label: string,
        public status: 'done' | 'active' | 'todo'
    ) { }
}

export class TicketSummary {
    constructor(
        public total: number = 0,
        public completed: number = 0,
        public cancelled: number = 0,
        public closed: number = 0,
    ) { }
}

export class WorkOrderSummary {
    constructor(
        public total: number = 0,
        public completed: number = 0,
        public cancelled: number = 0,
        public closed: number = 0,
    ) { }
}

export class MaintenanceItem {
    constructor(
        public name: string,
        public description: string,
        public status: string,
        public statusClass: string,
        public icon: string,
        public iconBg: string,
        public iconColor: string,
        public dueDate: string
    ) { }
}

export class CostSummary {
    constructor(
        public purchaseValue: string,
        public depreciationInfo?: string,
        public usefulLife?: string,
    ) { }
}

