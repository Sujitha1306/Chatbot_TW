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

export class CreateConsumer {
    constructor(
    public consumerIdentifier: string,
    public tittleId: string,
    public firstName: string,
    public lastName: string,
    public genderId: string,
    public birthDate: string,
    public gpsLocationCoordinate: string,
    public installationDate: string,
    public addressLine1: string,
    public zoneId: string,
    public districtId: string,
    public cityId: string,
    public stateId: string,
    public pincodeId: string,
    public mobile: string,
    public alternateMobile: string,
    public identityTypeId: string,
    public identityValue: string,
    public consumerTypeId: string,
    ) { }
}
export class EditConsumer {
    constructor(
    public consumerIdentifier: string,
    public tittleId: string,
    public firstName: string,
    public lastName: string,
    public genderId: string,
    public birthDate: string,
    public gpsLocationCoordinate: string,
    public installationDate: string,
    public addressLine1: string,
    public zoneId: string,
    public districtId: string,
    public cityId: string,
    public stateId: string,
    public pincodeId: string,
    public mobile: string,
    public alternateMobile: string,
    public identityTypeId: string,
    public identityValue: string,
    public consumerTypeId: string,
    ) { }
}