export class CreatePatient {
    constructor(
        public mainidentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public mobileNo: string,
        public birthDate: string,
        public eventDetails : any,
        public patientVisitId : any,
        public otVisitStatusId: any,
        public countryCode: any
    ) {}
}


export class EditPatient {
    constructor(
        public mainidentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public mobileNo: string,
        public birthDate: string,
        public eventDetails: any,
        public scheduleEndTime: string,
        public scheduleStartTime: string,
        public patientVisitEventId: string,
        public delayScheduleEndTime: string,
        public delayScheduleStartTime: string,
        public delayStartReasonId: string,
        public delayEndReasonId: string,
        public delayStartRemarks: string,
        public delayEndRemarks: string,
        public otVisitStatusId: any,
        public tagAssociationType: any,
        public tagAssociationTypeId: any,
        public tagId: any,
        public tagTypeId: any,
        public countryCode: any
    ) {}
}
