export class CreateSupplier {
    constructor(
    public name: string,
    public status: boolean,
    public taxIdentifier: string,
    public inchargeName: string,
    public inchargeEmail: string,
    public entityAddresses = [],
    public fileAttachments = []
    ){ }
}

export class ModifySupplier {
    constructor(
    public id: number,
    public name: string,
    public status: boolean,
    public taxIdentifier: string,
    public inchargeName: string,
    public inchargeEmail: string,
    public entityAddresses = [],
    public fileAttachments = []
    ){ }
}
