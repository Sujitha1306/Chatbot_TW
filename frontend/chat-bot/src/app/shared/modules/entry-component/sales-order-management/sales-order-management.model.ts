export class manageSalesOrder {
    constructor(
        public deliveryRequestTypeId: string,
	    public identifier: any,
        public description: string,
        public purchaser: string,
        public countryCode: string,
        public comments: string,
        public requestUserDepartmentId: number,
        public requestedByUserId: number,
        public deliveryStatusId: string,
        public deliveryDetails: any,
        public deliveredDatetime: string,
    ) { }
}