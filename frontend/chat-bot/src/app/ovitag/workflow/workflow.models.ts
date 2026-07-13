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
        public mainidentifier: string,
        public firstName: string,
        public lastName: string,
        public age: string,
        public birthDate: string,
        public gender: string,
        public mobileNo: string,
    ) { }
}

export class CreateMergeRecord {
    constructor(
        public firstName: string,
        public lastName : string,
        public middleName: string,
        public birthDate : string,
        public mobileNo: number,
        public tokenNo: number,
        public patientId: number,
        public tempPatientId: number
    ) { }
}

export class CreateMessageCentre {
    constructor(
        public tagAssociationType: string,
        public sendTolist= [],
        public name: string,
        public sendTo: string,
        public subject: string,
        public message: string,
        public response: string,
    ) { }
}

export class AssignToTask {
    constructor(
        public entityId: number,
        public identifyingId: number,
        public entityBookingId: number,
        public entityType: string,
        public identifyingType: string,
    ) { }
}


export class createOrderDetails {
    constructor(
        public roNumber: number,
        public clientTypeId : string,
        public billingTypeId: string,
        public budgetAmount: number,
        public campaignDetails = [],
        public dealTypeId: string,
        public endDatetime: string,
        public startDatetime: string,
        public entityAddressId: string,
        public notes: string,
        public paymentTerms: string,
        public roDate: string,
        public status: string,
        public agencyId: string,
        public clientId: string,
        public employeeId: number,
        public pfWorkflows = [],
    ) { }
}

export class editOrderDetails {
    constructor(
        public roNumber: number,
        public clientTypeId : string,
        public billingTypeId: string,
        public budgetAmount: number,
        public campaignDetails = [],
        public dealTypeId: string,
        public endDatetime: string,
        public startDatetime: string,
        public entityAddressId: string,
        public notes: string,
        public paymentTerms: string,
        public roDate: string,
        public status: string,
        public agencyId: string,
        public clientId: string,
        public employeeId: number,
        public pfWorkflows = [],
    ) { }
}

export class CreateAgents {
    constructor(
        public clientTypeId: string,
        public name: string,
        public taxTypeId: string,
        public taxNumber: number,
        public verticalId: string,
    ) { }
}

export class EditAgents {
    constructor(
        public clientTypeId: string,
        public name: string,
        public taxTypeId: string,
        public taxNumber: number,
        public verticalId: string,
    ) { }
}

export class createVisitor {
    constructor(
        public firstName: any,
        public lastName: any,
        public phoneNumber: any,
        public gender: any,
        public countryCode: any,
        public visitorTypeId: any,
        public email: any,
        public birthDate: any,
        public address: any,
        public scheduleTime: any,
        public purpose: any,
        public visitorStatusId: any,
        public identifyingId: any,
        public identifyingType: any,
        public userId : any,
        public documentId :any,
        public documentTypeId :any,
        public organizationName : any,
        // public isInclude : any,
        public addVisitorCount : any ,
        public duration : any ,
        public endTime : any ,
        public scheduleTypeId : any,
        public dateTime : any,
        public isSingle : any,
        public schedules : any [],
        public attachFiles : any[],
        public locationId : any,
        public isTechnicalAccess :any,
        public state :any,
        public pfEntityGroupId :any,
        public organizationLocationId :any,
        public middleName :any,
        public depatureDatetime :any,
        public departmentId :any,
        public birthCountryId :any,
        public citizenshipCountryId :any,
        
    ) { }
}
export class editVisitor {
    constructor(
        public id: number,
        public firstName: any,
        public lastName: any,
        public phoneNumber: any,
        public gender: any,
        public countryCode: any,
        public visitorTypeId: any,
        public email: any,
        public birthDate: any,
        public address: any,
        public scheduleTime: any,
        public purpose: any,
        public visitorStatusId: any,
        public identifyingId: any,
        public identifyingType: any,
        public userId : any,
        public documentId :any,
        public documentTypeId :any,
        public organizationName : any,
        public isInclude : any,
        public addVisitorCount : any ,
        public duration : any ,
        public endTime : any ,
        public dayPattern : any,
        public dateTime : any,
        public isSingle : any,
        public schedules : any [],
        public attachFiles : any[],
        public scheduleTypeId : any,
        public locationId : any,
        public isTechnicalAccess :any,
        public state :any,
        public pfEntityGroupId :any,
        public organizationLocationId :any,
        public middleName :any,
        public depatureDatetime :any,
        public departmentId :any,
        public birthCountryId :any,
        public citizenshipCountryId :any,
        
    ) { }
}