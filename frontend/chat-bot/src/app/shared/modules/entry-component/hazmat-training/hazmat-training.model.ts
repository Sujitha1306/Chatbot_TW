export class CreateActivities {
    constructor(
    public routineTypeId: string,
    public name: string,
    public isActive: boolean,
    public activityCategoryId: string, 
    public activitySubTypeId: string,
    public configValue: string,
    public roleIds = []
    ) { }
}
export class EditActivities {
    constructor(
        public id: number,
        public routineTypeId: string,
        public name: string,
        public isActive: boolean,
        public activityCategoryId: string,
        public configValue: string,
        public activitySubTypeId: string,
        public roleIds = []
    ) { }
}