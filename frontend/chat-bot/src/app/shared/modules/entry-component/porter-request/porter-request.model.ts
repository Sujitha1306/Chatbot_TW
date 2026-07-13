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
    //    public porterRequestTypeId: number,
    //    public subjectId: number,
    //    public subjectTagId: number,
    //    public locationFromId: number,
    //    public locationToId: number,
    //    public startTime: string,
    //    public endTime: string,
    //    public noOfPorter: number,
    //    public noOfAsset: number,
    //    public porterId: number,
      // public assetId: number,
    //    public isAutoAssigned: boolean,

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
       public lastModifiedOn:any,
       public pfActivityId: number
    ) {}
}
export class EditRequest {
    constructor(
      //  public id: number,
      //  public porterRequestType: number,
      //  public subjectId: number,
      //  public locationFromId: number,
      //  public locationToId: number,
      //  public startTime: string,
      //  public endTime: string,
      //  public noOfPorter: number,
      //  public noOfAsset: number,
      //  public porterId: number,
      // // public assetId: number,
      //  public isAutoAssigned: boolean

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
       public lastModifiedOn:any,
       public cancelReasonId
    ) {}
}
