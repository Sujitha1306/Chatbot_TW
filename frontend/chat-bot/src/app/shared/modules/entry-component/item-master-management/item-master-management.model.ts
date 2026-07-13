export class CreateItems {
    constructor(
        public averageCost: number,
        public comments: string,
        public description: string,
        public itemCategoryId: string,
        public itemNo: number,
        public itemTypeId: string,
        public minimumStockLevel: number,
        public name: string,
        public parentId: number,
        public reorderLevel: number,
        public isActive: boolean,
        public status: string,
        public totalQuantity: number,
        public unitOfMeasure: string,
        public routineTypeId: string,
        public activityCategoryId: string,
        public fileAttachments = []
    ) { }
}

export class ModifyItems {
    constructor(
        public id: number,
        public averageCost: number,
        public comments: string,
        public description: string,
        public itemCategoryId: string,
        public itemNo: number,
        public itemTypeId: string,
        public minimumStockLevel: number,
        public name: string,
        public parentId: number,
        public reorderLevel: number,
        public isActive: boolean,
        public status: string,
        public totalQuantity: number,
        public unitOfMeasure: string,
        public routineTypeId: string,
        public activityCategoryId: string,
        public fileAttachments = [],
        public itemAssetLinks = []
    ) { }
}

export class CreateInventory {
    constructor(
        public batchId: string,
		public comments: string,
		public expiryDate: string,
		public itemMasterId: number,
		public purchaseOrderId: number,
		public quantity: number,
		public supplierId: number,
		public transactionTypeId: string,
		public userId: any,
        public unitCost: number,
        public statusId: string
    ){}
}

export class ModifyInventory {
    constructor(
        public id: number,
        public batchId: string,
		public comments: string,
		public expiryDate: string,
		public itemMasterId: number,
		public purchaseOrderId: number,
		public quantity: number,
		public supplierId: number,
		public transactionTypeId: string,
		public userId: any,
        public unitCost: number,
        public statusId: string
    ){}
}

