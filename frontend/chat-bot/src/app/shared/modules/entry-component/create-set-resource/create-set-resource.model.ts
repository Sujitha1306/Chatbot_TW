export class CreateSetResource {
    constructor(
        public code: string,
        public description: string,
        public sterileSetDetails: any,
        public isActive: boolean
    ) { }
}

export class EditSetResource {
    constructor(
        public description: string,
        public code: string,
        public sterileStatusId: string,
        public sterileSetDetails: any,
        public isActive: boolean
    ) { }
}