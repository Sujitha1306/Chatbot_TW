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
export class CreateTicket {
    constructor(
        public description: string,
        public locationId: string,
        public address: string,
        public name: any,
        public email: string,
        public phone: any,
        public ticketPriorityId: any,
        public title: any,
        public customerId: string,
        public attachFiles: any[]= [],
        public facilityName: any,
        public locationName: any
        // public base64Data: string,
        // public filetype: any,
    ) {}
}
