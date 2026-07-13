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
import * as Chart from 'chart.js';
import 'chartjs-plugin-datalabels';


@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  public chart: Chart;

  constructor() { }

  createChart(chartType: string, chartData: any, canvasId: any) {
    if (chartType === 'pie') {
      if (this.chart !== undefined || this.chart !== null) {
        this.chart.destroy();
      }
      this.chart = new Chart(canvasId, {

      });
      // SONARQUBE-Two branches in a conditional structure should not have exactly the same implementation
    } else if (chartType === 'line' || chartType === 'bar' || chartType === 'horizontalBar') {
      if (this.chart !== undefined || this.chart !== null) {
        this.chart.destroy();
      }
    }
    // else if (chartType === 'bar') {
    //   if (this.chart !== undefined || this.chart !== null) {
    //     this.chart.destroy();
    //   }
    // } else if (chartType === 'horizontalBar') {
    //   if (this.chart !== undefined || this.chart != null) {
    //     this.chart.destroy();
    //   }
    // }
  }
}
