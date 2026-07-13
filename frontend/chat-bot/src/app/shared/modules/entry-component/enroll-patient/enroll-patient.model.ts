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
export class CreateRegisterPatient {
    constructor(
        public id: number,
        public mainidentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public age: string,
        public birthDate: string,
        public gender: string,
        public mobileNo: string,
        public packageDate: string,
        public patientVisitId: string,
        public isPkgDateEdited: boolean,
        public tagSerialNumber: string,
        public tagTypeId: string,
        public healthPlanId: string,
        public isDiabetic: boolean,
        public isFasting: boolean,
        public isVulnerable: boolean,
        public isPregnant: boolean,
        public vipTypeId: string,
        public preferedLanguage: string,
        public externalRegionId: string,
        public assignedFloorId: string,
        public visitIdentifier: string,
        public tokenNumberId: string,
        public isNew: boolean,
        public planSourceId: number,
        public tempPatientId :string,
        public packageIdentifier : string,
        public packageName : string,
        public healthTests :string,
        public visitTypeId: string,
        public isCheckOutProcessCounter: boolean
    ) { }
}

export class CreateEnrollPatient {
    constructor(
        public mainidentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public birthDate: string,
        public gender: string,
        public mobileNo: string,
        public tagSerialNumber: string,
        public tagTypeId: string,
        public isDiabetic: boolean,
        public isFasting: boolean,
        public isVulnerable: boolean,
        public isPregnant: boolean,
        public vipTypeId: string,
        public preferedLanguage: string,
        public assignedFloorId: string,
        public bedId: number,
        public doctorId: number,
        public visitTypeId: string,
        public eventType: string,
        public healthPlanId: number,
        public otProcedureId:number,
        public planName: string,
        public locationId: number,
        public visits: any = [],
        public patientVisitId: string,
        public packageDate: string,
        public startDate: string,
        public testId: number,
        public testType: string,
        public isPreBooked: boolean,
        public id: number,
        public checkExisting: boolean,
        public tokenNumberId: any,
        public email: string,
        public userId: number,
        public doctorName: string,
        public surgeryTypeId: string = null,
        public visitEvent: any = {},        
        public tempAmbPatientId : any = null,
        public tempPatientId = null,
        public visitIdentifier = null,
        public packageIdentifier = null,
        public packageName = null,
        public healthTests = null,
        public countryCode: string,
        public isCheckOutProcessCounter: boolean
    ) { }
}
export class UpdateEnrollPatient {
    constructor(
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public birthDate: string,
        public gender: string,
        public mobileNo: string,
        // public tagSerialNumber: string,
        // public tagTypeId: string,
        // public isDiabetic: boolean,
        // public isFasting: boolean,
        // public isVulnerable: boolean,
        // public isPregnant: boolean,
        // public vipTypeId: string,
        // public preferedLanguage: string,
        public assignedFloorId: string,
        public bedId: number,
        public doctorId: number,
        public visitTypeId: string,
        public patientId: string,
        public visitDate: string,
        public patientVisitId: string,
        public locationId: string,
        public scheduleDate: string,
        public mobileNumber: string,
        public healthTestId : number,
        public countryCode: string,
    ) { }
}

export class CreateCoaster {
    constructor(
        public tagAssociationId: number,
        public tagAssociationType: string,
        public tagAssociationTypeId: string,
        public tagSerialNumber: string,
        public comments: string,
        public tagTypeId: string,
        public patientVisitId: string,
        public patientVisitEventId: string,
        public canTagDisassociate: boolean,
    ) { }
}

export class CreateInfant {
    constructor(
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public gender: string,
        public mainidentifier: string,
        public countryCode: string,
        public mobileNo: number,
        public birthDate: string,
        public tagSerialNumber: string,
        public tagTypeId: string,
        public visitTypeId: string,
        public locationId: number,
        public bedId: number,
        public doctorId: number,
        public floorId: string,
        public infantDetails: any[] = [],
        public isChild: boolean,
        public motherId: number,
        public packageDate: string,
        public enrollType: string,
    ) { }
}

export class EditInfant {
    constructor(
        public id: number,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public gender: string,
        public mainidentifier: string,
        public countryCode: string,
        public mobileNo: number,
        public birthDate: string,
        public tagSerialNumber: string,
        public tagTypeId: string,
        public visitTypeId: string,
        public locationId: number,
        public bedId: number,
        public doctorId: number,
        public floorId: string,
        public infantDetails: any[] = [],
        public isChild: boolean,
        public motherId: number,
        public packageDate: string,
        public patientVisitId: number,
    ) { }
}

export class CreateEnrollEmployee {
    constructor(
        public firstName: string,
        public email: string,
        public managerId: string,
        public mainidentifier: string,
        public gender: string,
        public mobileNo: string,
        public birthDate: string,
        public joinDate: string,
        public quarantineStartDate: string,
        public quarantineEndDate: string,
        public tagId: any[] = [],
        public countryCode: string,
    ) { }
}

export class EditEnrollEmployee {
    constructor(
        public id: number,
        public firstName: string,
        public email: string,
        public managerId: string,
        public mainidentifier: string,
        public gender: string,
        public mobileNo: string,
        public birthDate: string,
        public joinDate: string,
        public quarantineStartDate: string,
        public quarantineEndDate: string,
        public tagId: any[] = [],
        public countryCode: string,
    ) { }
}

export class CreateEnrollVisitor {
    constructor(
        public firstName: string,
        public email: string,
        public hostEmployeeId: number,
        public gender: string,
        public phoneNumber: string,
        public tagId: string,
        public comments: string,
        public visitorTypeId: string,
        public facilityId: string,
        public countryCode: string,
    ) { }
}

export class EditEnrollVisitor {
    constructor(
        public id: number,
        public firstName: string,
        public email: string,
        public hostEmployeeId: number,
        public gender: string,
        public phoneNumber: string,
        public tagId: string,
        public comments: string,
        public visitorTypeId: string,
        public countryCode: string,
        public checkoutTime: string
    ) { }
}

export class CreateEnrollTempId {
    constructor(
        public firstName: string,
        public email: string,
        public managerId: string,
        public mainidentifier: string,
        public gender: string,
        public mobileNo: string,
        public isTemporaryTagId: boolean,
        public tagId: any[] = [],
        public countryCode: string,
    ) { }
}

export class EditEnrollTempId {
    constructor(
        public id: number,
        public firstName: string,
        public email: string,
        public managerId: string,
        public mainidentifier: string,
        public gender: string,
        public mobileNo: string,
        public isTemporaryTagId: boolean,
        public tagId: any[] = [],
        public countryCode: string,
    ) { }
}

export class CreateMedicalRecord {
    constructor(
        public mainIdentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public dob: string,
        public gender: string,
        public mobileNo: string,
        public volume: string,
        public deliveryLocationId: number,
        public requestedDoctorId: number,
        public requestedToDate: string,
        public requestedFromDate: string,
        public departmentId: string,
        public requestedDoctor: string,
        public deliveryLocation: string,
    ) { }
}
