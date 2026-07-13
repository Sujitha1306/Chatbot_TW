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

export class CreateUser {
    constructor(
        public firstName: string,
        public lastName: string,
        public address: string,
        public gender: any,
        public email: string,
        public phoneNumber: any,
        public birthDate: any,
        public status: any,
        public roleIds: any,
        public customerId: string,
        public userName: string,
        public isLdapUser: string,
        public password: string,
        public managerId: string,
        public locationId: string,
        public sourceId: string,
        public poolNameId: string,
        public poolLocationId: string,
        public parents: any,
        public departmentId: any,
        public userTypeId : any
    ) {}
}
export class EditUser {
    constructor(
        public id: number,
        public firstName: string,
        public lastName: string,
        public address: string,
        public gender: any,
        public birthDate: any,
        public status: any,
        public email: string,
        public phoneNumber: any,
        public roleIds: any,
        public customerId: string,
        public userName: string,
        public isLdapUser: string,
        public managerId: string,
        public locationId: string,
        public sourceId: string,
        public poolNameId: string,
        public poolLocationId: string,
        public departmentId: number,
        public userTypeId : any
    ) {
    }
}

export class CreateShift {
    constructor(
        public entityId: number,
        public entityType: string,
        public shiftMasterId: number,
        public startDate: any,
        public endDate: any,
        public status: true
    ) {}
}

export class EditShift {
    constructor(
        public entityId: number,
        public entityType: string,
        public shiftMasterId: number,
        public startDate: any,
        public endDate: any,
        public status: true
    ) {}
}

export class CreateStudent {
  studentstartDate: string;
  constructor(
    public mainidentifier: string,
    public firstName: string,
    public lastName: string,
    public birthDate: string,
    public gender: string,
    public address: string,
    public email: string,
    public phoneNumber: string,
    public customerId: string,
    public userTypeId: string,
    public departmentId: number,
    public isCreateUserOnly: boolean,
    public isLdapUser: boolean,
    public startDate: string,
    public endDate: string,
    public locationId: number,
    public studentGradeId: string,
    public studentGroupId: string,
    public title: string,
    public userStatusId: string,
    public designationId: string,
  ) { }
}

export class EditStudent {
    studentstartDate: string;
    constructor(
      public id: number,
      public mainidentifier: string,
      public firstName: string,
      public lastName: string,
      public birthDate: string,
      public gender: string,
      public address: string,
      public email: string,
      public phoneNumber: string,
      public customerId: string,
      public userTypeId: string,
      public departmentId: number,
      public isCreateUserOnly: boolean,
      public startDate: string,
      public endDate: string,
      public locationId: number,
      public studentGradeId: string,
      public studentGroupId: string,
      public title: string,
      public userStatusId: string,
      public designationId: string
    ) { }
  }
