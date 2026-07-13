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
import MinHeapModel from './minHeap.model';

function scoreFunction(e) {
  return e.distance;
}
function idFunction(e) {
  return e.id;
}

class Dijkstra {
  unvisited = new MinHeapModel(scoreFunction, idFunction, 'distance');
  infinity = 99999999;
  run(graph, pathType, source, target) {
    if (!graph.exists(source) || !graph.exists(target)) {
      // console.log(
      //   "%c inside source or target not found ",
      //   "background: salmon; color: black"
      // );
      // console.log("%c source ", "background: salmon; color: black", source);
      return null;
    }
    const ret = {
      source: source,
      target: target,
      dist: source,
      prev: target
    };
    const dist = {}; // distance of the node from source
    const prev = {}; // previous node of the form 'node_id': 'prev_node_id'

    dist[source] = 0; // source is distance 0 from source
    prev[source] = source;

    // console.log("%c dist ", "background: aqua; color: black", dist);
    // console.log("%c prev ", "background: aqua; color: black", prev);

    graph.eachNode(node => {
      if (node.id !== parseInt(source, 10)) {
        prev[node.id] = null; // set previous to null
        dist[node.id] = this.infinity; // set distance to Infinity
      }
      // push node to unvisited with distance Infinity
      this.unvisited.push({
        id: node.id,
        distance: dist[node.id]
      });
    });

    // console.log(
    //   "%c this.unvisited ",
    //   "background: lime; color: black",
    //   this.unvisited
    // );

    // Object.keys(graph).eachNode(node => {
    //   if (graph[node].id !== parseInt(source, 10)) {
    //     prev[graph[node].id] = null; // set previous to null
    //     dist[graph[node].id] = this.infinity; // set distance to Infinity
    //   }
    //   const obj = {
    //     id: graph[node].id,
    //     distance: dist[graph[node].id]
    //   };
    //   this.unvisited.push(obj);
    // });

    // return if source is the same as target (i.e., already there)
    if (source === target) {
      // console.info('Same source and target');
      ret.dist = dist;
      ret.prev = prev;
    }

    while (this.unvisited.size() > 0) {
      const min = this.unvisited.pop(); // get minimum node dist and ID
      const minNode = graph.find(min.id); // get the minimum node

      // stop when we've found the target
      if (minNode.id === target) {
        break;
      }

      // for each neighbor of minNode that is in the unvisited queue
      for (let i = 0; i < minNode.neighbors.length; i++) {
        const n = graph.find(minNode.neighbors[i]); // node for the neighbor

        // ensure node exists, is in unvisited, and it is a valid path (unless it is the target)
        if (!n || !this.unvisited.exists(n) || (n.nType !== pathType && n.id !== parseInt(target, 10))) {
          continue;
          // return;
        }

        // calculate alternative distance
        const alt = min.distance + minNode.weight[i];

        // use this path instead, if alternative distance is shorter
        if (alt < dist[n.id]) {
          dist[n.id] = alt;
          prev[n.id] = min.id;
          this.unvisited.decreaseKey(n.id, alt); // update key
        }
      }
    }

    ret.dist = dist;
    ret.prev = prev;
    // console.log("%c return value  ", "background: aqua; color: black", ret);
    return ret;
  }

  getPath(prevList, target) {
    const path = []; // the path to return
    let t = target;

    // return [] if there was no path
    if (prevList[target] === null) {
      return [];
    }
    // while the previous is not itself (signaling reached the source)
    while (prevList[t] !== t) {
      path.unshift(t);
      t = prevList[t];
    }

    path.unshift(t); // add the source to the path
    // console.log("%c path ", "background: aqua; color: black", path);
    return path;
  }
}

export default Dijkstra;
export { Dijkstra };
