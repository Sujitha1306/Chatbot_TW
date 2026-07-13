export class CreateFacility {
    constructor(
        public facility: any[] = [],
        public id: number,
        public isActive : any,
        public name: string,
    ) { }
}

export class UpdateFacility {
    constructor(
        public facility: any[] = [],
        public id: number,
        public isActive : any,
        public name: string,
    ) { }
}

export class EditGatewayManagement {
    constructor(
        public id: string,
        public gatewayName: string,
        public gatewaySubtype: string,
        public ipAddress: string,
        public kernelVersion: string,
        public softwareVersion: string,
        public status: string,
        public portNumber: string,
        public gatewayId: string,
        public facilityIds: string,
        public ssidName: string,
        public ssidPassword: string,
        public brokerInfo: any[] = []
    ) { }
}
// export class CreateBroker {
//     constructor(
//         public brokerTypeId: string,
//         public caFile: string,
//         public certFile: string,
//         public gatewayId: string,
//         public hostName: string,
//         public isMaEnabled: true,
//         public isSslEnabled: true,
//         public keyFile: string,
//         public mport: number,
//         public mprotocol: string,
//         public password: string,
//         public userName: string,
//         public wport: number,
//         public wprotocol: string,
//     ) {}
// }
export class CreateServer {
    constructor(
        public brokerIds = [],
        public gatewayId: string,
        public gwMasterId: string,
        public isActive: boolean,
        public name: string,
        public twServerId: string
    ){}
}

export class EditServer {
    constructor(
        public brokerIds = [],
        public gatewayId: string,
        public gwMasterId: string,
        public isActive: boolean,
        public name: string,
        public twServerId: string
    ){}
}

export class CreateGatewayJobs {
    constructor(
        public gwServerId: string,
        public gwMasterId: string,
        public jobType: string,
        public isActive: boolean,
        public name: string,
        public parentId: string,
    ) {}
}

export class EditGatewayJobs {
    constructor(
        public gwMasterId: string,
        public name: string,
        public isActive: boolean,
        public id: string,
        public gwServerId: string,
        public parentId: string,
    ) {}
}