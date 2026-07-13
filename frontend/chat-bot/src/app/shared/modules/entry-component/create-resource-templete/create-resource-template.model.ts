export class CreateResourceTamplate {
    constructor(
        public code: string,
        public id: string,
        public identifyingType: string,
        public identifyingValue: string,
        public name: string,
        public page: string,
        public templateValue : any,
    ) {}
}