export class CreateKpi {
    constructor(
        public name: string,
        public categoryId: string,
        public frequencyId: string,
        public formula: string, 
        public unitOfMeasure: string,
        public valueType: string,
        public target: number,
        public description: string,
        public config : any,
        public pfModelId: any
    ) { }
}
export class EditKpi {
    constructor(
        public id: number,
        public name: string,
        public categoryId: string,
        public frequencyId: string,
        public formula: string, 
        public unitOfMeasure: string,
        public valueType: string,
        public target: number,
        public description: string,
        public config : any,
        public pfModelId: any
    ) { }
}