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
import * as _ from 'lodash';
import GraphNodeModel from './graphNode.model';

class Graph {
  nodeCount = 0;
  edgeCount = 0;
  nodes = {};

  constructor(graphMasterData: { nodes: any; edges: any }) {
    for (let i = 0; i < graphMasterData.nodes.length; i++) {
      const nodeVals = graphMasterData.nodes[i];
      const nodeProps = {
        weight: nodeVals.weight,
        nType: nodeVals.nType,
        neighbors: nodeVals.neighbors
      };
      if (this.exists(nodeVals.id)) {
        // update node (was created earlier by a neighbor specification)
        const node = this.find(nodeVals.id);
        nodeProps.neighbors = _.union(node.neighbors, nodeProps.neighbors);
        this.update(nodeVals.id, nodeProps);
      } else {
        this.addNode(nodeVals.id, nodeProps); // create new
      }
    }
    // add each of the edges in the supplied graphMasterData
    for (let i = 0; i < graphMasterData.edges.length; i++) {
      const source = graphMasterData.edges[i][0];
      const target = graphMasterData.edges[i][1];
      this.addOrCreateEdge(source, target);
    }
  }

  find(id) {
    return this.exists(id) ? this.nodes[id] : null;
  }
  exists(id) {
    if (this.nodes[id]) {
      return true;
    }
    return false;
    // return (id in this.nodes) && (this.nodes[id] instanceof GraphNodeModel);
  }

  eachNode(fn) {
    for (const id in this.nodes) {
      const node = this.find(id);
      if (!!node) {
        fn(node);
      } else {
        continue;
      }
    }
  }

  addNode(id, props) {
    props = props || {};
    const weight = props.weight || 0;
    const nType = props.nType || 0;
    const neighbors = props.neighbors || [];

    if (!this.exists(id)) {
      // create & add new node
      const nodeObj = new GraphNodeModel(id, weight, nType, neighbors);
      this.nodes[id] = nodeObj;
      this.nodeCount = this.nodeCount + 1;
    }

    return this.nodes[id];
  }
  update(id, props) {
    props = props || {};
    const weight = props.weight || 0;
    const nType = props.nType || 0;
    const neighbors = props.neighbors || [];

    const foundNodeObj = this.find(id);
    if (!foundNodeObj) {
      return null;
    }
    foundNodeObj.weight = props.weight || foundNodeObj.weight;
    foundNodeObj.nType = props.nType || foundNodeObj.nType;
    foundNodeObj.neighbors = props.neighbors || foundNodeObj.neighbors;
    return foundNodeObj;
  }

  addEdge(source, target) {
    if (source === target) {
      // console.warn('Cannot add self edge in simple graph');
      return false;
    }

    // find the source & target nodes
    const s = this.find(source);
    const t = this.find(target);

    // return if invalid edge (i.e., either source or target does not exist)
    if (!s || !t) {
      return false;
    }

    // do not add redundant edges (but fix edge if inconsistent)
    if (s.neighbors.indexOf(t.id) < 0 && t.neighbors.indexOf(s.id) < 0) {
      // add each node to the other's edge list
      s.neighbors.push(t.id);
      t.neighbors.push(s.id);
      this.edgeCount = this.edgeCount + 1;
    } else if (s.neighbors.indexOf(t.id) < 0) {
      s.neighbors.push(t.id);
    } else if (t.neighbors.indexOf(s.id) < 0) {
      t.neighbors.push(s.id);
    } else {
      return false;
    }
    return true;
  }

  addOrCreateEdge(source, target) {
    // add source/target nodes if necessary
    this.addNode(source, {});
    this.addNode(target, {});
    // add the edge
    return this.addEdge(source, target);
  }
  deleteEdge(source, target) {
    const s = this.find(source); // the node corresponding to source ID
    const t = this.find(target); // the node corresponding to target ID

    // ensure the edge exists (i.e., connected)
    if (!this.connected(source, target)) {
      return false;
    }

    // delete from neighbor arrays
    s.neighbors.splice(s.neighbors.indexOf(target), 1);
    t.neighbors.splice(t.neighbors.indexOf(source), 1);

    --this.edgeCount;

    return true;
  }
  connected(source, target) {
    const s = this.find(source); // get source node
    const t = this.find(target); // get target node
    if (!s || !t) {
      return false; // clearly not connected if does not exist
    }
    return s.neighbors.indexOf(target) >= 0 && t.neighbors.indexOf(source) >= 0;
  }
}

export default Graph;
export { Graph };
