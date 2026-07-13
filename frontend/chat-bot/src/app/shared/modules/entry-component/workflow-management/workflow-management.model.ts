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

export class CreateRoutine {
    constructor(
    public name: string,
    public routineTypeId: string,
    public routineContextId: string,
    public specialityId: string,
    public description: string,
    public scheduleTypeId: string,
    ) { }
}
export class EditRoutine {
    constructor(
    public name: string,
    public routineTypeId: string,
    public routineContextId: string,
    public specialityId: string,
    public description: string,
    public scheduleTypeId: string,
    ) { }
}
export class AddRoutine {
    constructor(
        public fromDate: string,
        public identifiyingId: number,
        public routineId: number,
        public identifyingType: string,
        public routineStatusId: string,
        public routineType: string,
        public tagId: string,
        public patientVisitId: number,
        public scheduleStart: string,
        public scheduleEnd: string,
        public scheduleTypeId: string,
        ) { }
}
export class UpdateEntityRoutine {
    constructor(
        public fromDate: string,
        public identifiyingId: number,
        public routineId: number,
        public identifyingType: string,
        public routineStatusId: string,
        public routineType: string,
        public tagId: string,
        public patientVisitId: number,
        public scheduleStart: string,
        public scheduleEnd: string,
        public scheduleTypeId: string,
        ) { }
}
export class ActivateRoutine {
    constructor(
        public entityRoutineEventId: number
        ) { }
}
export class CreateRoutineActivity {
    constructor(
    public activities: any[] = [],
    public routineId: string,
    ) { }
}
export class CreateRoleRoutineActivity {
    constructor(
        public activities: any[] = [],
        public entityRoutineId: string,
    ) { }
}
export class EditRoutineActivity {
    constructor(
    public activities: any[] = [],
    public routineId: string,
    ) { }
}
export class EditRoleRoutineActivity {
    constructor(
        public activities: any[] = [],
        public entityRoutineId: string,
    ) { }
}
export class CreateActivities {
    constructor(
    public name: string,
    public esculateToId: string,
    public description: string,
    ) { }
}
export class EditActivities {
    constructor(
    public id: string,
    public name: string,
    public esculateToId: string,
    public description: string,
    ) { }
}
export class CreateTask {
    constructor(
    public pfActivityId: number,
    public type: string,
    public comments: string,
    public gender: string,
    public startTime: string,
    public requestCategory: string,
    public performer: any[] = [],
    public nonPerformer: any[] = [],
    public destinationId: string,
    public status: string,
    public isautoAssigned: boolean,
    public isAutoComplete: boolean,
    public remarks: string,
    public configValue: string,
    public title: string,
    public attachFiles:any[],
    public entityForms:any[],
    public ticketId:string,
    public statusReasonId?: string,
    public scheduleStartTime?: string,
    public scheduleEndTime?: string,
    public scheduleActivityTypeId?: string,
    public srcIdentifyingType? : string,
    public srcIdentifyingId? : number,
    public priorityLevelId?: string,
    public parentId?: string,
    public canCreate?: boolean,
    public acknowledgedById ?: number,
    ) { }
}
export class CreateTaskEasyPick {
    constructor(
    public pfActivityId: number,
    public type: string,
    public comments: string,
    public gender: string,
    public startTime: string,
    public requestCategory: string,
    public performer: any[] = [],
    public nonPerformer: any[] = [],
    public destinationId: string,
    public status: string,
    public isautoAssigned: boolean,
    public isAutoComplete: boolean,
    public remarks: string,
    public configValue: string,
    ) { }
}
