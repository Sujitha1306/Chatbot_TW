/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
******************************************************************************/
export class CreateGateway {
    constructor(
        public gatewayName: string,
        public gatewaySubtype: string,
        public ipAddress: string,
        public kernelVersion: string,
        public softwareVersion: string,
        public status: string,
        public portNumber: string,
        public gatewayId: string,
        public facilityIds: string,
        public ssidName: string,
        public ssidPassword: string,
        public clickhouseInfo: string,
        public brokerInfo: any[] = [],
    ) { }
}

export class EditGateway {
    constructor(
        public id: string,
        public gatewayName: string,
        public gatewaySubtype: string,
        public ipAddress: string,
        public kernelVersion: string,
        public softwareVersion: string,
        public status: string,
        public portNumber: string,
        public gatewayId: string,
        public facilityIds: string,
        public ssidName: string,
        public ssidPassword: string,
        public brokerInfo: any[] = []
    ) { }
}

export class CreateSocialDistanceAlert {
    constructor(
        public key: string,
        public facilityId: string,
        public content: string,
        public comments: string,
        public contentData: any = {},
    ) { }
}

export class EditSocialDistanceAlert {
    constructor(
        
        public key: string,
        public facilityId: string,
        public content: string,
        public comments: string,
        public contentData: any = {},
    ) { }
}

export class CreateReader {
    constructor(
        public readerName: string,
        public readerTypeId: number,
        public readerAlgoTypeId: string,
        public coordinate: string,
        public hardwareTypeId: number,
        public macId: number,
        public kernelVer: string,
        public swVer: string,
        public serialNo: string,
        public model: string,
        public locationId: number,
        public configStatusId: boolean,
        public gatewayId: string,
        public readerLocation: string,
        public floorId: string,
        public readerLink: any[] = [],
        public linkedReader: string,
        
    ) { }
}

export class CreateNewReader {
    constructor(
        public readerName: string,
        public gatewayId: string,
        public hardwareTypeId: number,
        public readerTypeId: number,
        public macId: number,
        public serialNo: string,
        public model: string,
        public readerVersionId: number,
        public configStatusId: boolean,
        public floorId: number,
        public readerAlgoTypeId: string,
        public isEnable: boolean,
        public coordinate: string,
        public locationId: number,
        public readerLocation: string,
        public meshTypeId: string,
        public readerLink: Array<any> = [],
        public linkedLocations: string,
        public readerConnectivityTypeId: string,
    ) { }
}
export class UpdateNewReader {
    constructor(
        public readerName: string,
        public gatewayId: string,
        public hardwareTypeId: number,
        public readerTypeId: number,
        public macId: number,
        public serialNo: string,
        public model: string,
        public readerVersionId: string,
        public configStatusId: boolean,
        public floorId: number,
        public readerAlgoTypeId: string,
        public isEnable: boolean,
        public coordinate: string,
        public locationId: number,
        public readerLocation: string,
        public meshTypeId: string,
        public readerLink: Array<any> = [],
        public linkedLocations: string,
        public readerConnectivityTypeId: string,
    ) { }
}

export class EditReader {
    constructor(
        public id: string,
        public readerName: string,
        public readerTypeId: number,
        public readerAlgoTypeId: string,
        public coordinate: string,
        public kernelVer: string,
        public swVer: string,
        public serialNo: string,
        public model: string,
        public locationId: number,
        public gatewayId: string,
        public hardwareTypeId: number,
        public macId: number,
        public configStatusId: boolean,
        public readerLocation: string,
        public floorId: string,
        public linkedReader: string,
        public threshold: string,
        public comments: any,
        public readerLink: any[] = [],

      
    ) { }
}

export class CreateTag {
    constructor(
        public serialNumber: string,
        public tagTypeId: any,
        public macId: any,
        public hwtype: any,
        public manufacturer: any,
        public frequencyRange: any,
        public regulation: any,
        public temperatureRange: any,
        public warnOnPerimeterBreach: any,
        public batteryPercentage: any,
        public batterySerialNumber: any,
        public batteryStatus: any,
        public comments: any,
        public swVersion: any,
        public status: any,
        public stateId: any,
        public deviceAdditionalInfo: any = {},
        public tagCategoryId: any
    ) { }
}

export class EditTag {
    constructor(
        public serialNumber: string,
        public tagTypeId: any,
        public macId: any,
        public hwtype: any,
        public manufacturer: any,
        public frequencyRange: any,
        public regulation: any,
        public temperatureRange: any,
        public warnOnPerimeterBreach: any,
        public batteryPercentage: any,
        public batterySerialNumber: any,
        public batteryStatus: any,
        public comments: any,
        public swVersion: any,
        public tagCategoryId: any,
        public status: any,
        public stateId : any,
        public deviceAdditionalInfo: any = {},

    ) { }
}

export class CreateAssociateTag {
    constructor(
        public tagSerialNumber: string,
        public tagAssociationId: number,
        public tagAssociationType: string,
        public patientVisitId: number,
        public tagAssociationTypeId: string,
        public comments: string,
        public tagAssociationById: number,
        public tagAssociationDttm: string,
    ) { }
}

export class EditAssociateTag {
    constructor(
      
        public facilityId: string,
        public comments: string,
        public tagSerialNumber: string,
        public tagAssociationId: number,
        public tagAssociationType: string,

        
    ) { }
}


export class CreateAsset {
    constructor(
        public assetSerialNumber: string,
        public assetTypeId: string,
        public assetName: string,
        public manufacturer: string,
        public commissionedOn: string,
        public warrantyStatus: string,
        public assetTransferTypeId: string,
        public locationDescription: string,
        public endDate: string,
        public softwareVersion: string,
        public vendorName: string,
        public locationId: number,
        public comments: string,
        public warrantyPeriod: string,
        public costTypeId: string,
        public nextAmcDue: string,
        public ownerId : string,
        public ownerDepartmentId: string,
        public assignedDepartmentId: string,
        public assetUserId : string,
        public assetAdminEmail: string,
        public assetAdminContactNo: string,
        public serviceContact: string,
        public serviceAddress: string,
        public servicePersonEmail: string,
        public costCenterId :string,
        public usefulLife :string,
        public assetIdentifier: any[] = [],
        public fileAttachments: any[] = [],
        public linkedAsset: any[] = [],
        public documentName: string,
        public documentTypeId: string,
        public assetCategoryId: string,
        public calibrationDue: string,
        public pmcDue: string,
        public criticalityId: string,
        public pmsDue:string,
        public warrantyStatusId:string,
        public commissionedOnServive:string,
        public prevMainFreqId:string,
        public calibrationFreqId:string,
        public warrantyDue:string,
        public depreciationPercent:string,
        public assetCost:any,
        public assetAdminDepartment:string,
        public purchaseOrderNumber: string,
        public poDate: string,
        public expectedArrivingDate: string,
        public deliveryDate: string,
        public modelId : string,
        public productSerialNumber : string,
        public locationIdentifier : string,
        public serviceProviderName : string,
        public vendorContact :string,
        public vendorEmail : string,
        public depreciationTypeId : BigInteger,
        public accumulatedDepreciation : BigInteger,
        public currentBookValue : BigInteger,
        public assetStatus :string,
        public assetCategory1Id :string,
        public assetCategory2Id :string,
        public guaranteeStatusId :string,
        public oracleId : string,
        public oracleDescription : string,
        public biomedTagId : string,
        public riskClassificationId : string,
        public isNetwork : boolean,
        public assetConnectivityDto :any ,
        public coordinates : any
    ) { }
}




export class CreateRule {
    constructor(
        public createdBy: string,
        public modifiedBy: string,
        public createdOn: string,
        public modifiedOn: string,
        public ruleName: string,
        public description: string,
        public params: string,
        public isActive: boolean,
    ) { }
}

export class EditRule {
    constructor(
        public id: string,
        public ruleScopeId: string,
        public name: string,
        public careSettingId: string,
        public ruleTypeId: string,
        public description: string,
    ) { }
}

export class CreateAlertRule {
    constructor(
        public pfRuleid: number,
        public name: string,
        public isActive: boolean,
        public entityType: string,
        public pfModelId: number,
        public alertTypeId: string,
        public messageFormat: string,
        public alertConfigRecipients: any[] = [],
        public alertConditions: any[] = [],
        public autoCloseTime : any
    ) { }
}

export class EditAlertRule {
    constructor(
        public pfRuleid: number,
        public name: string,
        public isActive: boolean,
        public entityType: string,
        public pfModelId: number,
        public alertTypeId: string,
        public messageFormat: string,
        public alertConfigRecipients: any[] = [],
        public alertConditions: any[] = [],
        public autoCloseTime : any
    ) { }
}

export class CreateHealthcheck {
    constructor(
        public testId: string,
        public testName: string,
        public healthPlanId: string,
        public statusId: string,
        public minDuration: string,
        public maxDuration: string,
        public checkInInterval: string,
        public checkOutInterval: string,
        public testLocations: any[] = [],
        public capacity: string,
        public floorId: string,
        public sequence: string,
    ) { }
}

export class EditHealthcheck {
    constructor(
        public id: string,
        public testId: string,
        public testName: string,
        public healthPlanId: string,
        public statusId: string,
        public minDuration: string,
        public maxDuration: string,
        public checkInInterval: string,
        public checkOutInterval: string,
        public testLocations: any[] = [],
        public capacity: string,
        public floorId: string,
        public sequence: string,
    ) { }
}

export class UpdateLocation {
    constructor(
        public id: number,
        public capacity: string,
        public healthPlanName: string,
        public statusName: string,
    ) { }
}

export class EditPackage {
    constructor(
    public healthTestId: number,
    public healthPlanId: number,
    public sequence: number,
    public minDuration: number,
    public maxDuration: number,
    ) { }
}

export class EditLocationMapping {
    constructor(
    public id: number,
    public testName: string,
    public testLocations: any[] = [],
    ) { }
}
export class UpdateWidgetModel {
    constructor(
    public configKeyId: string,
    public facilityId: string,
    public id: number,
    public inputParams: string,
    public isActive: boolean,
    public modelTypeId: string,
    public name: string,
    public outputParams: string,
    public queryString: string,
    public targetDb: string,
    public url: string
    ){}
}


export class CreateHealthTestRule {
    constructor(
    public ruleTestTypeId: string,
    public testTypeId: string,
    public testId: string,
    public ruleTestId: string,
    public isBefore: string,
    public duration: string,
    public gender: string,
    public isDiabetic: string,
    public ruleHealthTestId: string,
    public ruleGroup: string
    ) { }
}
export class CreateHealthTest{
    constructor(
        public name: string,
        public shortName: string,
        public planTypeId: string,
        public testCategoryId: string,
        public shortNotes: string,
        public longNotes: string,
        public minDuration: number,
        public maxwaitDuration: number,
        public sequence: number,
        public priority: number,
        public isDiabetic: boolean,
    ) { }
} 

export class EditHealthTest{
    constructor(
        public id: string,
        public name: string,
        public shortName: string,
        public planTypeId: string,
        public testCategoryId: string,
        public shortNotes: string,
        public longNotes: string,
        public minDuration: number,
        public maxwaitDuration: number,
        public sequence: number,
        public priority: number,
        public isDiabetic: boolean,
    ) { }
}
export class CreateRoutine {
    constructor(
    public name: string,
    public routineTypeId: string,
    public specialityId: string,
    public description: string,
    ) { }
}
export class EditRoutine {
    constructor(
    public name: string,
    public routineTypeId: string,
    public specialityId: string,
    public description: string,
    ) { }
}
export class CreateRoutineActivity {
    constructor(
    public activities: any[] = [],
    public routineId: string,
    ) { }
}
export class EditRoutineActivity {
    constructor(
    public activities: any[] = [],
    public routineId: string,
    ) { }
}
export class CreateActivities {
    constructor(
    public routineTypeId: string,
    public name: string,
    public inchargeType: string,
    public inchargeId: number,
    public minDuration: number,
    public isActive: boolean,
    public sequence: number,
    public priority: number,
    public activityGroupId: number,
    public allowPartial: boolean, 
    public minInterval: number,
    public gender: string,
    public autoComplete: boolean,
    public isAdmin: boolean,
    public isExternal: boolean,
    public isInBatch: boolean,
    public activityCategoryId: string, 
    public isDiabetic: boolean,
    public shortName: boolean,
    public isForLater: boolean,
    public description: string,
    public canAutoAllocate: string,
    public isRecurring: string,
    public destinationId: string,
    public readerId: string,
    public configValue: string,
    public activitySubTypeId: string,
    public isIssue: boolean,
    public priorityLevelId: string,
    public sequenceLevel: string,
    public roleIds = [],
    public departmentIds = []
    ) { }
}
export class EditActivities {
    constructor(
        public id: number,
        public routineTypeId: string,
        public name: string,
        public inchargeType: string,
        public inchargeId: number,
        public minDuration: number,
        public isActive: boolean,
        public sequence: number,
        public priority: number,
        public activityGroupId: number,
        public allowPartial: boolean, 
        public minInterval: number,
        public gender: string,
        public autoComplete: boolean,
        public isAdmin: boolean,
        public isExternal: boolean,
        public isInBatch: boolean,
        public activityCategoryId: string, 
        public isDiabetic: boolean,
        public shortName: boolean,
        public isForLater: boolean,
        public description: string,
        public canAutoAllocate: string,
        public isRecurring: string,
        public destinationId: string,
        public readerId: string,
        public configValue: string,
        public activitySubTypeId: string,
        public isIssue: boolean,
        public priorityLevelId: string,
        public sequenceLevel: string,
        public roleIds = [],
        public departmentIds = []
    ) { }
}
export class CreatePackage {
    constructor(
    public name: string,
    public description: string,
    public sourceId: string,
    public gender: string,
    public healthPlanDetails: any[],
    public isActive: boolean,
    public planTypeId: string,
    ) { }
}
export class NewEditPackage {
    constructor(
    public name: string,
    public description: string,
    public sourceId: string,
    public gender: string,
    public healthPlanDetails: any[],
    public isActive: boolean,
    public planTypeId: string,
    ) { }
}
export class ConfigModel {
    constructor(
    public id: string,
    public comments: string,
    public contentData: {},
    public facilityId: string
    ){}
}
export class EditConfigModel {
    constructor(
    public ids: number,
    public comments: string,
    public contentData: {},
    public facilityId: string
    ){}
}
export class CreateOtProc{
    constructor(
        public healthPlanId: string,
        public name: string,
        public codeCategoryId: string,
        public specialtyId: string,
        public codeTypeId: string,
        public codeValue: string,
        public preparationSla: string,
        public preparationSlaEnd: string,
        public surgerySla: string,
        public surgerySlaEnd: string,
        public recoverySla: string,
        public recoverySlaEnd: string,
        public description: string,
    ) { }
} 
export class EditOtProc{
    constructor(
        public id: string,
        public healthPlanId: string,
        public name: string,
        public codeCategoryId: string,
        public specialtyId: string,
        public codeTypeId: string,
        public codeValue: string,
        public preparationSla: string,
        public preparationSlaEnd: string,
        public surgerySla: string,
        public surgerySlaEnd: string,
        public recoverySla: string,
        public recoverySlaEnd: string,
        public description: string,
    ) { }
}
export class CreateRole{
    constructor(
        public id: string,
        public code: string,
        public name: string,
        public status: string,
    ) { }
}
export class Createchnltemp{
    constructor(
        public id: string,
        public channelId: string,
        public code: string,
        public facilityId: string,
        public isActive: string,
        public name: string,
        public paramCount: number,
        public payload: {},
        public pfRuleTypeId: string,
        public pfModelId: string,
        public schema: {},
        public subTypeId: string,
        public templateFormat: string,
        public templateSample: string,
        public templateSourceId: string,
        public templateValue: string,
        public value: string,
        public vendorId: string,
    ) { }
}
export class createapikey{
    constructor(
        public id: string,
        public keyName: string,
        public facilityId: string,
        public keyType: string,
        public token: string,
        public content: {},
        public status: number,
        public statusReason: string,
        public expiredAt: string,
        public roleId: string
    ) { }
}
export class createShiftMaster{
    constructor(
        public id: string,
        public shiftName: string,
        public startTime: string,
        public endTime: string,
        public shiftCode: number,
        public status:  string,
    ) { }
}