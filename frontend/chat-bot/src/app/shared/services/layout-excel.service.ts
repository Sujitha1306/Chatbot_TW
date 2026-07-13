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
import * as FileSaver from 'file-saver';
import * as excel from "exceljs/dist/exceljs.min.js";

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class LayoutExcelService {
    constructor() { }
    public exportAsExcelFile(json): void {
      let workbook = new excel.Workbook();
      let sheetName:any = [];
      let jsondata: any =[];
      let sheet : any =[];
      const title = 'Report Title';
      jsondata = json['tableData']
      sheetName =json['sheetName']
      for(let num=0;num<jsondata.length;num++)
      {
         sheet[num] = workbook.addWorksheet(sheetName[num]);
        //  sheet[num].mergeCells('C1', 'J2');
        //  sheet[num].getCell('C1').value = 'Client List'
        //  sheet[num].title([title]);

        // Set font, size and style in title row.
        // titleRow.font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };

        // sheet[num].addRow([]);

        //Add row with current date
        // let subTitleRow = sheet[num].addRow(['Date : ' + json['fromDate']]);
      }
      for(let sheetnum=0;sheetnum<sheet.length;sheetnum++){

        // Set font, size and style in title row.
        // titleRow.font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };

        if(jsondata[sheetnum].length) {
          sheet[sheetnum].addRow([title]);
          let key= Object.keys(jsondata[sheetnum][0])
          for(let i=0;i<key.length;i++)
          {
            sheet[sheetnum].getColumn(i+1).header=key[i].toUpperCase()
          }
          for(let i=0;i<jsondata[sheetnum].length;i++)
          {
            sheet[sheetnum].addRow(Object.values(jsondata[sheetnum][i]))
          }
          for(let i=0;i<key.length;i++)
          {
            let data=[]
            data=sheet[sheetnum].getColumn(i+1).values.filter(Boolean);
            if(typeof data[1] != 'string')
            {
              sheet[sheetnum].getColumn(i+1).width= data[0].length;
            }
            else{
              sheet[sheetnum].getColumn(i+1).width=(data.reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+5;
            } 
          }
          sheet[sheetnum].getRow(1).font={bold:true}
        }
      }
      if(json['fromDate'] && json['toDate']){
        workbook.xlsx.writeBuffer()
        .then(buffer => FileSaver.saveAs(new Blob([buffer]), json['excelFileName'] + '_' + json['fromDate'] + '-' + json['toDate'] + EXCEL_EXTENSION))
        .catch(err => console.log('Error writing excel export', err));
      }else{
        workbook.xlsx.writeBuffer()
        .then(buffer => FileSaver.saveAs(new Blob([buffer]), json['excelFileName']+ EXCEL_EXTENSION))
        .catch(err => console.log('Error writing excel export', err));
      }
      
    }
}
