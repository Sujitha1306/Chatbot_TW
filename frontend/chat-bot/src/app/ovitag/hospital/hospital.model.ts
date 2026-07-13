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
export class CreateCustomer {
    constructor(

        public parentId: string,
        public customerTypeId: string,
        public name: string,
        public billAddress: string,
        public gsTin: string,
        public licencePack: string,
        public noOfEmployees: string,
        public noOfDevices: string,
        public noOfBeds: string,
        public bgImage: string,
        public logoImage: string,
        public isMulti: string,
        public contacts: any,
        public regAddress: string,
        public isActive: boolean,
    ) { }
}

export class EditCustomer {
    constructor(
        public id: string,
        public parentId: string,
        public customerTypeId: string,
        public name: string,
        public billAddress: string,
        public gsTin: string,
        public licencePack: string,
        public noOfEmployees: string,
        public noOfDevices: string,
        public noOfBeds: string,
        public bgImage: string,
        public logoImage: string,
        public isMulti: string,
        public contacts: any,
        public regAddress: string,
        public isActive: boolean,
    ) { }
}

export class CreateLocation {
    constructor (
        public name: string,
        public locationTypeId: string,
        public parentId: any,
        public locationDescription: string,
        public imageData: string,
        public aspects: string,
        public coordinates: string,
        public nodePoints: string,
        public locationCategoryId: any,
        public careSettingId: any,
        public logicalParentId: any,
        public locationTypeLevel: any,
        public logicalParentName: string,
    ) {}
}

export class EditLocation {
    constructor (
        public id: string,
        public name: string,
        public locationTypeId: string,
        public parentId: any,
        public locationDescription: string,
        public imageData: string,
        public aspects: string,
        public coordinates: string,
        public nodePoints: string,
        public locationCategoryId: any,
        public careSettingId: any,
        public logicalParentId: any,
        public logicalParentName: string,
    ) {}
}
export class CreateTicket {
    constructor(
        public description: string,
        public locationId: string,
        public address: string,
        public name: any,
        public email: string,
        public phone: any,
        public ticketPriorityId: string,
        public title: any,
        public customerId: string,
        public attachFiles: any[]= []
        
    ) {}
}
export class EditTicket {
    constructor(
        public id: number,
        public description: string,
        public locationId: string,
        public address: string,
        public name: any,
        public ticketPriorityId: string,
        public email: string,
        public phone: any,
        public title: any,
        public customerId: string,
        public attachFiles: any[]= [],
        
    ) {
    }
}

export class CreatePatient {
    constructor(
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public gender: any,
        public mobileNo: any,
        public email: string,
        public motherId: any,
        public address: string,
        public birthDate: string,
        public mainidentifierType: any,
        public mainidentifier: any,
        public primaryIdentifier: any,
        public status: any
    ) {}
}
export class EditPatient {
    constructor(
        public id: number,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public gender: any,
        public mobileNo: any,
        public email: string,
        public motherId: any,
        public address: string,
        public birthDate: string,
        public mainidentifierType: any,
        public mainidentifier: any,
        public primaryIdentifier: any,
        public status: any
    ) {
    }
}
