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
export class CreateRequest {
  constructor(
    public assetCategory: string,
    public assetCount: number,
    public comments: string,
    public sourceId: number,
    public destinationId: number,
    public startTime: string,
    public endTime: string,
    public isTracable: boolean,
    public isautoAssigned: boolean,
    public porterCount: number,
    public requestCategory: string,
    public type: string,
    public performer: any[] = [],
    public nonPerformer: any[] = [],
    public remarks: string,
    public status: string,
    public srcLocationTypeId: string,
    public destLocationTypeId: string,
    public srcParentLocationId: string,
    public destParentLocationId: string,
    public poolName: string,
    public gender: string,
    public isAutoComplete: boolean,
    public priority: boolean,
    public isRoundTrip: boolean,
    public serviceGroupId: string,
    public poolLocationId: string,
    public lastModifiedOn: any,
    public pfActivityId: number
  ) { }
}
export class EditRequest {
  constructor(
    public requestId: number,
    public assetCategory: string,
    public assetCount: number,
    public comments: string,
    public destinationId: number,
    public endTime: string,
    public isTracable: boolean,
    public isautoAssigned: boolean,
    public porterCount: number,
    public requestCategory: string,
    public sourceId: number,
    public startTime: string,
    public type: string,
    public status: string,
    public performer: any[] = [],
    public nonPerformer: any[] = [],
    public remarks: string,
    public rating: string,
    public srcLocationTypeId: string,
    public destLocationTypeId: string,
    public srcParentLocationId: string,
    public destParentLocationId: string,
    public poolName: string,
    public gender: string,
    public isAutoComplete: boolean,
    public priority: boolean,
    public isRoundTrip: boolean,
    public serviceGroupId: string,
    public poolLocationId: string,
    public lastModifiedOn: any,
    public cancelReasonId
  ) { }
}

export interface PorterConfigDetail {
  maxPorterLimit: number;
  hideInputs: any[];
  maxLocLimit: number;
  allowScheduledStatus: boolean;
  patientSearch: boolean;
  fromLocStatusList: string[];
  toLocStatusList: string[];
  allowGlobalPool: boolean;
  typesOfPatientName: string[];
  assetCount: any;
  pharmacyType: string;
  cannotAutoComplete: any[];
  defaultPool: any;
  priorityFromLocation: any[];
  priorityToLocation: any[];
  checkPriorityConfig: boolean;
  diasblePorterGender: boolean;
  disablePoolNameId: boolean;
  disablePorterPriority: boolean;
  disablePorterRoundtrip: boolean;
  mandatoryFields: any[];
  mandatoryFieldsObject: any[];
  sourceLocConfirmation: boolean;
  selectFromRoom: boolean;
  selectToRoom: boolean;
  verifyBlock: any
  typeConfig: any;
  activityCategoryIds: any[]
}

export const PORTER_CONFIG_DETAIL: PorterConfigDetail = {
  maxPorterLimit: 1,
  hideInputs: [],
  maxLocLimit: 10,
  allowScheduledStatus: false,
  patientSearch: true,
  fromLocStatusList: ['RQ-WT', 'RQ-PLN', 'RQ-SH'],
  toLocStatusList: ['RQ-WT', 'RQ-PLN', 'RQ-SH'],
  allowGlobalPool: false,
  typesOfPatientName: ['PR-PA'],
  assetCount: {},
  pharmacyType: 'TAT-PA',
  cannotAutoComplete: [],
  defaultPool: {},
  priorityFromLocation: [],
  priorityToLocation: [],
  checkPriorityConfig: false,
  diasblePorterGender: false,
  disablePoolNameId: false,
  disablePorterPriority: false,
  disablePorterRoundtrip: false,
  mandatoryFields: [],
  mandatoryFieldsObject: [],
  sourceLocConfirmation: false,
  selectFromRoom: false,
  selectToRoom: false,
  verifyBlock: null,
  typeConfig: {
    "PR-PA": {
      "nonPerformerType": "patient",
      "from": {
        "label": "From",
        "mandatory": true,
        "formControlName": 'sourceId',
        "defaultValue": null
      },
      "to": {
        "label": "To",
        "mandatory": true,
        "formControlName": 'destinationId',
        "defaultValue": null
      },
      "patientName": {
        "label": "Patient Name",
        "mandatory": false,
        "formControlName": 'patientId',
        "defaultValue": null
      },
      "service": {
        "label": "Service",
        "mandatory": true,
        "formControlName": 'assetId',
        "defaultValue": 'AT-TO'
      },
      "floor": {
        "label": "Floor",
        "mandatory": true,
        "formControlName": 'poolLocationId',
        "defaultValue": null
      }
    },

    "PR-SE": {
      "nonPerformerType": "service",
      "from": {
        "label": "From",
        "mandatory": true,
        "formControlName": 'sourceId',
        "defaultValue": null
      },
      "to": {
        "label": "To",
        "mandatory": true,
        "formControlName": 'destinationId',
        "defaultValue": null
      },
      "serviceGroup": {
        "label": "Service Group",
        "mandatory": true,
        "formControlName": 'serviceGroupId',
        "defaultValue": null
      },
      "service": {
        "label": "Service",
        "mandatory": true,
        "formControlName": 'assetId',
        "defaultValue": 'AT-TO'
      },
      "floor": {
        "label": "Floor",
        "mandatory": true,
        "formControlName": 'poolLocationId',
        "defaultValue": null
      }
    },

    "PR-AT": {
      "nonPerformerType": "asset",
      "from": {
        "label": "From",
        "mandatory": true,
        "formControlName": 'sourceId',
        "defaultValue": null
      },
      "to": {
        "label": "To",
        "mandatory": true,
        "formControlName": 'destinationId',
        "defaultValue": null
      },
      "assetType": {
        "label": "Asset Type",
        "mandatory": false,
        "formControlName": 'assetCategory',
        "defaultValue": null
      },
      "assetName": {
        "label": "Asset Name",
        "mandatory": true,
        "formControlName": 'assetId',
        "defaultValue": null
      },
      "floor": {
        "label": "Floor",
        "mandatory": false,
        "formControlName": 'poolLocationId',
        "defaultValue": null
      }
    },

    "PR-OT": {
      "nonPerformerType": "others",
      "from": {
        "label": "From",
        "mandatory": true,
        "formControlName": 'sourceId',
        "defaultValue": null
      },
      "to": {
        "label": "To",
        "mandatory": true,
        "formControlName": 'destinationId',
        "defaultValue": null
      },
      "service": {
        "label": "Asset Needed",
        "mandatory": false,
        "formControlName": 'assetId',
        "defaultValue": null
      },
      "department": {
        "label": "Department",
        "mandatory": true,
        "formControlName": 'poolLocationId',
        "defaultValue": null
      }
    }
  },
  activityCategoryIds: []
};

export interface LocationConfigDetail {
  searchSourceLocList: any[];
  searchSourceBedList: any[];
  searchSourceNonBedList: any[];
  searchDestinationLocList: any[];
  searchDestinationBedList: any[];
  searchDestinationNonBedList: any[]
  sourceBlockId: any;
  destBlockId: any;
  sourceListItem: any[];
  destListItem: any[];
  locSourceOption: any[];
  locDestinationOption: any[];
  locFromId: any;
  srcLocationTypeId: any;
  srcParentLocationId: any;
  locToId: any;
  destinationLocationTypeId: any;
  destinationParentLocationId: any;
  isDestinationLoc: boolean;
  isSourceLoc: boolean;
  sourceChildPrevList: any[];
  sourceChildList: any[];
  selectFromRoom: boolean;
  destinationChildList: any[];
  destChildPrevList: any[];
  selectToRoom: boolean;
  locToChildId: any;
  destinationChildLocationTypeId: any;
  destinationChildLocationId: any;
  srcChildLocationId: any;
  srcChildLocationTypeId: any;
  locFromChildId: any;
  destinationChildLocName: any;
  sourceChildLocName: any;
  destLocFullname: any;
  destLocName: any;
  sourceLocFullname: any;
  sourceLocName: any;
  destLocationTypeId: any;
  destParentLocationId: any;
  childList: any[];
  searchLocList: any[];
  searchLocItems: any[];
  initSearchLocList: any[];
  fromLocationId: any;
  toLocationId: any;
  locationName: any;
  sourceParentLocation: any;
  sourceLocation: any;
  destParentLocation: any;
  destLocation: any;
}

export const Location_Config_Detail: LocationConfigDetail = {
  searchSourceLocList: [],
  searchSourceBedList: [],
  searchSourceNonBedList: [],
  searchDestinationLocList: [],
  searchDestinationBedList: [],
  searchDestinationNonBedList: [],
  sourceBlockId: null,
  destBlockId: null,
  sourceListItem: [],
  destListItem: [],
  locSourceOption: [],
  locDestinationOption: [],
  locFromId: null,
  srcLocationTypeId: null,
  srcParentLocationId: null,
  locToId: null,
  destinationLocationTypeId: null,
  destinationParentLocationId: null,
  isDestinationLoc: true,
  isSourceLoc: true,
  sourceChildPrevList: [],
  sourceChildList: [],
  selectFromRoom: false,
  destinationChildList: [],
  destChildPrevList: [],
  selectToRoom: false,
  locToChildId: null,
  destinationChildLocationTypeId: null,
  destinationChildLocationId: null,
  srcChildLocationId: null,
  srcChildLocationTypeId: null,
  locFromChildId: null,
  destinationChildLocName: null,
  sourceChildLocName: null,
  destLocFullname: null,
  destLocName: null,
  sourceLocFullname: null,
  sourceLocName: null,
  destLocationTypeId: null,
  destParentLocationId: null,
  childList: [],
  searchLocList: [],
  searchLocItems: [],
  initSearchLocList: [],
  fromLocationId: null,
  toLocationId: null,
  locationName: null,
  sourceParentLocation: null,
  sourceLocation: null,
  destParentLocation: null,
  destLocation: null,
}