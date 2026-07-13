export class CreatePatient{
    constructor(
        public id: string,
        public mainidentifier: string,
        public firstName: string,
        public middleName: string,
        public lastName: string,
        public birthDate: string,
        public gender: string,
        public mobileNo: string,
        public canCreatePatientLogin: string,
        public password: string,
        public email: string,
        public countryCode: string
    ) { }
}