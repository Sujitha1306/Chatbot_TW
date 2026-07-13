export class CreateLicense {
    constructor(
        public fromDate: string,
        public toDate: string,
        public identifyingId: string,
        public identifyingType: string,
        public isActive: boolean
    ) {}
}

export class EditLicense {
    constructor(
        public fromDate: string,
        public toDate: string,
        public identifyingId: string,
        public identifyingType: string,
        public isActive: boolean
    ) {}
}