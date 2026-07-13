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
import { Injectable } from '@angular/core';
@Injectable()
export class NearestTagAlgorithm {

  constructor() { }

  get_distance_request_type(request_type, p, k, points) {
    const distance: any = [];
    let req_type_details: any = [];

    // console.log(request_type, p, k, points);

    for (let i = 0; i < points.length; i++) {
        // Get the request Type
        const group = points[i][0];

        // Get the nearest tag based our x,y co-ordinates
        const tag_points = points[i][1];

        if (group ==  request_type || request_type == 'all') {
            for (let j = 0; j < tag_points.length; j++) {

                // Calculate the euclidean distance of p from training points
                const euclidean_distance = Math.sqrt( Math.pow((tag_points[j]['coordinates'][0] - p[0]), 2) + Math.pow((tag_points[j]['coordinates'][1] - p[1]), 2));

                // push the data (distance, group, tagid) in the distance list
                distance.push(euclidean_distance, group, tag_points[j]['tagid']);
            }
        }
    }

    // Select first k distances
    if (distance.length >= k) {
        req_type_details = distance.sort();
    }
    return req_type_details;

  }
}
