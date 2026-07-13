export class GroupMapping {
    constructor(
        public id: number,
        public name: string,
        public facilityId: string,
        public isActive: boolean,
        public resourceMap: any[]
    ) { }
}

export class ResourcesGroupMap {
    constructor(
        public identifyingId: number,
        public identifyingType: string,
        public mapping: any[],
    ) { }
}