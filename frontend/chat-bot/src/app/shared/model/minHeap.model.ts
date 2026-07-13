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
class MinHeap {
  content: { id: any; distance: any }[];
  scoreFunction: Function;
  idFunction: Function;
  valueProp: string;
  map: Object;

  constructor(scoreFunction: any, idFunction: any, valueProp: any) {
    this.content = [];
    this.scoreFunction = scoreFunction;
    this.idFunction = idFunction;
    this.valueProp = valueProp;
    this.map = {};
  }

  size() {
    return this.content.length;
  }
  exists(elt) {
    return this.map[this.idFunction(elt)] !== undefined;
  }

  push(elt) {
    if (this.map[this.idFunction(elt)] !== undefined) {
      throw new Error(
        'id "' + this.idFunction(elt) + '" already present in heap'
      );
    }
    const obj = {
      id: elt.id,
      distance: elt.distance
    };
    this.content.push(obj);
    this.bubbleUp(this.content.length - 1);
    //let index = this.bubbleUp(this.content.length - 1);
    //this.map[this.idFunction(elt)] = index;
  }

  pop() {
    let result = this.content[0];
    let end = this.content.pop();

    delete this.map[this.idFunction(result)];

    if (this.content.length > 0) {
      this.content[0] = end;
      this.map[this.idFunction(end)] = 0;
      this.sinkDown(0);
      //let index = this.sinkDown(0);
      //this.map[this.idFunction(end)] = index;
    }

    return result;
  }

  bubbleUp(n) {
    let element = this.content[n];
    let score = this.scoreFunction(element);

    while (n > 0) {
      let parentN = Math.floor((n - 1) / 2);
      let parent = this.content[parentN];

      if (this.scoreFunction(parent) < score) {
        break;
      }

      this.map[this.idFunction(element)] = parentN;
      this.map[this.idFunction(parent)] = n;

      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }

    this.map[this.idFunction(element)] = n;

    return n;
  }

  sinkDown(n) {
    let element = this.content[n];
    let score = this.scoreFunction(element);

    while (true) {
      let child2N = (n + 1) * 2;
      let child1N = child2N - 1;
      let swap = null;
      let child1score;

      if (child1N < this.content.length) {
        let child1 = this.content[child1N];
        child1score = this.scoreFunction(child1);
        if (score > child1score) {
          swap = child1N;
        }
      }

      if (child2N < this.content.length) {
        let child2 = this.content[child2N];
        let child2score = this.scoreFunction(child2);
        if ((swap === null ? score : child1score) > child2score) {
          swap = child2N;
        }
      }

      if (swap === null) {
        break;
      }

      this.map[this.idFunction(this.content[swap])] = n;
      this.map[this.idFunction(element)] = swap;

      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }

    this.map[this.idFunction(element)] = n;

    return n;
  }

  decreaseKey(id, value) {
    const n = this.map[id];
    this.content[n][this.valueProp] = value;
    this.bubbleUp(n);
  }
}

export default MinHeap;
export { MinHeap };
