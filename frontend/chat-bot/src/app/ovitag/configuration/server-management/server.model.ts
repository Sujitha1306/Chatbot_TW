export class CreateServer {
    constructor(
        public name: string,
        public host: string,
        public appVersionId: string,
        public isActive: boolean,
        public osId: string,
        public serverHostId : string,
        public architectureId : string
    ) {}
}

export class EditServer {
    constructor(
        public name: string,
        public host: string,
        public appVersionId: string,
        public isActive: boolean,
        public osId: string,
        public serverHostId : string,
        public architectureId : string
    ) {}
}