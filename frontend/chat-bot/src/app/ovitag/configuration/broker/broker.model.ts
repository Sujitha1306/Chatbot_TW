export class CreateBroker {
    constructor(
        public brokerTypeId: string,
        public twServerId: string,
        public host: string,
        public mport: number,
        public mprotocol: string,
        public wport: number,
        public wprotocol: string,
        public username: string,
        public password: string,
        public isActive: boolean,
        public isSslEnabled: true,
        public certFile: string,
        public isMaEnabled: true,
        public caFile: string,
        public keyFile: string
    ) {}
}

export class EditBroker {
    constructor(
        public brokerTypeId: string,
        public twServerId: string,
        public host: string,
        public mport: number,
        public mprotocol: string,
        public wport: number,
        public wprotocol: string,
        public username: string,
        public password: string,
        public isActive: boolean,
        public isSslEnabled: true,
        public certFile: string,
        public isMaEnabled: true,
        public caFile: string,
        public keyFile: string
    ) {}
}