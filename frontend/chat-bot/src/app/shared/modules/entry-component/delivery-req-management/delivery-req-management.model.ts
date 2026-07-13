export class CreateDeliveryRequest {
    constructor(
        public approvedByUserId: number,
        public comments: string,
        public deliveryDetails = [],
        public deliveryStatusId: string,
        public requestUserDepartmentId: number,
        public requestedByUserId: number,
        public status: boolean
    ){}
}