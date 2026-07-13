export class ManageActivityRule {
    constructor(
    public activityId: number,
    public ruleActivityId: string,
    public config: JSON,
    public duration: number,
    public identifyingId: number,
    public identifyingType: string,
    public ruleGroupNo: any,
    public stepType: string,
    public type: string,
    public isActive: boolean,
    public description: string,
    public isInclude: boolean,
    public id?: number,
    ) {}
}