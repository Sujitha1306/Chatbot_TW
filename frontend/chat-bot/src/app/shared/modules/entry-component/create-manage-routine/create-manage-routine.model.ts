export class CreateEntityRoutine {
    constructor(
        public fromDate: string,
        public identifiyingId: number,
        public routineId: number,
        public identifyingType: string,
        public routineType: string,
        public patientVisitId: number,
        public scheduleStart: string,
        public scheduleEnd: string,
        public scheduleTypeId: string,
        public routineStatusId: string,
        public activities = []
        ) { }
}

export class UpdateEntityRoutine {
    constructor(
        public fromDate: string,
        public identifiyingId: number,
        public routineId: number,
        public identifyingType: string,
        public routineStatusId: string,
        public routineType: string,
        public patientVisitId: number,
        public scheduleStart: string,
        public scheduleEnd: string,
        public scheduleTypeId: string,
        ) { }
}