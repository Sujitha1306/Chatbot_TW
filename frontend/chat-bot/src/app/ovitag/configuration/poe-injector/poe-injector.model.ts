export class CreatePoeInjector {
    constructor(
        public serialNumber: string | null,
        public macAddress: string | null,
        public ipAddress: string | null,
        public model: string | null,
        public totalPorts: number | null,
        public status: string | null,
        public locationId: number | null,
        public floorId: number | null,
        public coordinate: string | null
    ) {}
}

export class EditPoeInjector {
    constructor(
        public serialNumber: string | null,
        public macAddress: string | null,
        public ipAddress: string | null,
        public model: string | null,
        public totalPorts: number | null,
        public status: string | null,
        public locationId: number | null,
        public floorId: number | null,
        public coordinate: string | null
    ) {}
}