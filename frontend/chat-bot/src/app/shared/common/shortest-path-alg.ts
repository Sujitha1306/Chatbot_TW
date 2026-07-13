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
export class ShortestPathAlgorithm {

  constructor() { }

  find_shortest_path(graph, start, end, path = []) {
    // console.log(graph[start]);
    // console.log(start);
    // console.log(end);

    path = path.concat([start]);

    if (start == end) {
        return path;
    }
    let shortest: any = null;
    for (let i = 0; i < graph[start].length; i++) {
      const node = graph[start][i];
      if (path.indexOf(node) <= -1) {
        const newpath = this.find_shortest_path(graph, node, end, path);
        if (newpath) {
          if (!shortest || newpath.length < shortest.length) {
             shortest = newpath;
          }
        }
      }
    }
    return shortest;
  }
}
