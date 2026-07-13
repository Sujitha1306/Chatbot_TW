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
import { CommonService } from './common.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  excelHeaderConfig : any;
  userId = localStorage.getItem(btoa('userId'));
  reportGeneratedBy: any;
  reportFrom: any;
  reportTo : any ;
  fileName: any;
  selectedRoutine: any;
  constructor(public commonService : CommonService, ){ 
    this.loadReportGeneratedBy();  
    this.loadExcelHeaderConfig();
 }

  public exportAsExcelFile(json: any[], excelFileName: string, transpose, selectedDate : string , id : string, excelColumn?, sheetOrderConfig?,fromDate?,toDate?): void {
    this.reportFrom =fromDate
    this.reportTo = toDate
    this.fileName =excelFileName
    let workbook = new excel.Workbook();
    if(id!='pat-contact' && id!='site-nav' &&id!='contact-tree' && id!= 'emp-contact' && id != 'staff-contact' && id!='newborn-summary' && id!='asset-transfer' && id!='emp-attendance-rep' && id!='employee_summary' && id!='tat-all-rep' && id!= 'tat-all-rep-ot' && id!='OT-Rep' && id!='DC-utilz' && id!='porter-pharmacy' && id!='multi-porter' && id!='ambulance-conn-devices' && id !='ambulance-conndev-alert' && id!='staff-tracking' && id!='ER-Rep-new' && id!='othreq-move' && id!='porter-req-summary' && id!='porter-req-summary-bycat' && id!='ambulance-summary' && id!='nurse-call-sum' && id != 'mrfile-daily-status' && id!='patientmove' && id!='porter-ind-perf' && id!='porter-selfreq-summary' && id!='dc-pat-tat'
    && id!='porter-daily-tat' && id !='porter-delay-byloc' && id!='porter-byloc' && id!='porter-jb-dtat' && id!='porter-jb-wtat' && id!='tat-by-shift' && id!='porter-waitlist' && id!='hk-summary' && id!='porter-req-det' && id!='bk-summary' && id!='sc-summary' && id!='infant-alert' && id!='asset-util-patient' && id!= 'pat-mrid-list' && id!='emp-ccd-agg' && id!='asset-utiby-byid' && id!='stf-routin-sumary' && id!='pat-routin-sumary' && id!='task-activity-compliance')
    {
      let sheetName = selectedDate;
      let sheet = workbook.addWorksheet(sheetName);
      const tableStartRow = this.addStaticHeaderToSheet(sheet);
      if(!transpose)
      {
        let key : any;
        if(id == 'report1'){
            let data = json;
            let column = excelColumn ? excelColumn : Object.keys(json[0]);
            key= column;
             this.addColumnHeaderRow(sheet, tableStartRow, key, sheet.name);
            for(let i=0;i<data.length;i++)
            {
              let cell2 = [];
              for(let j=0;j<column.length;j++){
              if(Object.keys(data[i][j] == column[j]))
              {
              cell2.push(data[i][column[j]])
              }
            }
              sheet.addRow(cell2)
            }
            for (let i=2;i<=sheet.rowCount;i++) {
              sheet.getRow(i).eachCell(function (cell) {
                if (cell._column._number >= 13) {
                  const header = cell._column?.values?.[1];
                  const rowData = data[i - 2];

                  if (!header || !rowData) return;

                  const compareValue = rowData[header + 'isnormal'];
                  if (cell._column.values[1] == compareValue) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'ff0000' }
                    };
                    cell.font = { name: 'Calibri', size: 11, bold: false };
                    cell.border = {
                      top: { style: "thin" },
                      left: { style: "thin" },
                      bottom: { style: "thin" },
                      right: { style: "thin" }
                    };
                  }
                }
              });
            }
        }else if(id == 'emp-ccd-all' || id == 'emp-ccd-all-byd' || id == 'staff-ccd-all'){
          let data = json;
          let column;
          if(id == 'emp-ccd-all' || id == 'staff-ccd-all'){
            column = ['EmpId','Name','Contact EmpId','Contact Emp.Name','From timestamp','To timestamp','Duration'];
          } else if(id == 'emp-ccd-all-byd'){
            column = ['EmpId','Name','Contact EmpId','Contact Emp.Name','From timestamp','To timestamp','Duration', 'Event date'];
          }

          key= column;
           this.addColumnHeaderRow(sheet, tableStartRow, key, sheet.name);
            for (let i = 0; i < json.length; i++) {
              sheet.addRow(
                this.shouldAddSerialNo(sheet.name)
                  ? [null, ...Object.values(json[i])]
                  : Object.values(json[i])
              );
            }

            if (!transpose && this.shouldAddSerialNo(sheet.name)) {
              this.populateSerialNo(sheet, tableStartRow);
            }
          for(let i=0;i<data.length;i++)
          {
            let cell2 = [];
            for(let j=0;j<column.length;j++){
            if(Object.keys(data[i][j] == column[j]))
            {
            cell2.push(data[i][column[j]])
            }
          }
          sheet.addRow(cell2)
          }
        }
        else{
        key= Object.keys(json[0])
        this.addColumnHeaderRow(sheet, tableStartRow, key, sheet.name);
        for (let i = 0; i < json.length; i++) {
          sheet.addRow(
            this.shouldAddSerialNo(sheet.name)
              ? [null, ...Object.values(json[i])]
              : Object.values(json[i])
          );
        }

        if (!transpose && this.shouldAddSerialNo(sheet.name)) {
          this.populateSerialNo(sheet, tableStartRow);
        }
        for(let i=0;i<json.length;i++)
        {
          sheet.addRow(Object.values(json[i]))
        }
        }
        for(let i=0;i<key.length;i++)
        {
          const colIndex = this.shouldAddSerialNo(sheet.name) ? i + 2 : i + 1;
          let data=[]
          data=sheet.getColumn(colIndex).values.filter(Boolean);
          if(id == 'emp-ccd-all-byd'){
            if(sheet.getRow(tableStartRow).getCell(i + 1).value === 'EVENT DATE'){
              sheet.getColumn(colIndex).eachCell(function(cell){
                if(cell.row != 1 && cell.value != undefined){
                  cell.numFmt = 'YYYY-MM-DD';
                  cell.value = new Date(cell.value)
                }
              })
            }
          }
          if(typeof data[1] != 'string')
          {
            sheet.getColumn(colIndex).width= data[0].length;
          }
          else{
            sheet.getColumn(colIndex).width=(data.reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+5;
          }   
        }
        sheet.getRow(1).font={bold:true}   

      }
      else{
        let it=[]
        let fullData = []
        let loc : number = 0;
        let len : number = 0;
        for(let i=0;i<json.length;i++)
        {
          if(len<Object.keys(json[i]).length)
          {
            len=Object.keys(json[i]).length;
            loc = i;
          }
        }
        it.push(Object.keys(json[loc]));
        fullData.push(Object.keys(json[loc]));
        for(let i=0;i<json.length;i++)
          {
            it.push(Object.values(json[i]))
            fullData.push(Object.values(json[i]))
          }
        // for(let i=0;i<it.length;i++){
        //   it[i].splice(7,1)
        // }
        console.log(fullData)
        for(let i=0;i<it.length;i++){
          const colIndex = this.shouldAddSerialNo(sheet.name) ? i + 2 : i + 1;
          sheet.getColumn(colIndex).values=it[i];
          sheet.getColumn(colIndex).width = (it[i].reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+2;
          }
          console.log(fullData)
        sheet.getColumn(1).font = {bold:true}
        for(let i=2;i<=sheet.columnCount;i++){
          let j=0;
          sheet.getColumn(i).eachCell(function(cell) {
            if(cell._row._number >= 8){
              if(j<fullData[i-1][7].length)
              {
                if(fullData[i-1][7][j] == 'RED'){
                  console.log(it[i-1][7][j])
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor:{ argb:'ff0000'}
                  };
                  cell.font = { name: 'Calibri', size: 11, bold:false};
                              cell.border = {
                      top: { style: "thin" },
                      left: { style: "thin" },
                      bottom: { style: "thin" },
                      right: { style: "thin" }
                    };
                  }
                  j = j+1;
                }
              }
            });
          }
      } 
    }
    else
    {
      let sheetName:any = [];
      let jsondata: any =[];
      // console.log(json)
      if(id == 'pat-contact' || id == 'contact-tree' || id == 'emp-contact' || id == 'staff-contact' || id == 'site-nav' || id == 'tat-all-rep' || id == 'tat-all-rep-ot' || id == 'OT-Rep' || id == 'DC-utilz' || id == 'porter-pharmacy' || id == 'multi-porter' || id == 'ambulance-conn-devices' || id == 'ambulance-conndev-alert' || id == 'staff-tracking' || id == 'ER-Rep-new' || id == 'othreq-move' || id == 'porter-req-summary' || id == 'porter-req-summary-bycat' ||  id =='ambulance-summary'|| id == 'nurse-call-sum' || id == 'mrfile-daily-status' || id == 'patientmove' || id == 'porter-ind-perf' || id == 'porter-selfreq-summary' || id == 'dc-pat-tat' || id == 'porter-waitlist' || id == 'hk-summary' || id == 'porter-req-det' || id == 'bk-summary' || id == 'sc-summary' || id == 'infant-alert' || id == 'asset-util-patient' || id == 'asset-utiby-byid' || id == 'pat-mrid-list' || id == 'emp-ccd-agg' || id == 'stf-routin-sumary' || id == 'pat-routin-sumary' || id == 'task-activity-compliance')
      { 
        if(json[0][(json[0].length)-1] != undefined && json[0][(json[0].length)-1].length == 0){
          json[0].pop();
        }
        jsondata = json[0]
        sheetName =json[1]
      } else if(id == 'porter-daily-tat' || id == 'tat-by-shift' || id == 'porter-delay-byloc' || id == 'porter-byloc' || id == 'porter-jb-dtat' || id == 'porter-jb-wtat'){
        jsondata = json[0];
        sheetName.push(json[1]);
        // console.log(json);
      }
      else
      {
        jsondata = json[0];
        sheetName=json[1]
        sheetName.push(json[1])
      }
      let sheet : any =[];
      if(id == 'porter-daily-tat'){
        sheet[0] = workbook.addWorksheet('Porter_Daily_TAT');
        // for(let num=0;num<jsondata.length;num++)
        // {
        //   if(jsondata[num].length){
        //     sheet[0].addTable({name: sheetName[num],columns: jsondata[num]});
        //   }
        // }
        transpose = true;
      } else if (id == 'porter-delay-byloc' || id == 'porter-byloc' || id == 'porter-jb-dtat' || id == 'porter-jb-wtat') {
        if(id == 'porter-jb-dtat' || id == 'porter-jb-wtat') {
          sheet[0] = workbook.addWorksheet(excelFileName);
        } else {
          sheet[0] = workbook.addWorksheet(id);
        }
        transpose = true;
      } else if(id == 'tat-by-shift'){
        sheet[0] = workbook.addWorksheet(excelFileName);
        sheet[1] = workbook.addWorksheet('Summary Type');
        transpose = true;
      } else{
        for(let num=0;num<jsondata.length;num++)
        {
          sheet[num] = workbook.addWorksheet(sheetName[num]);
          sheet[num]._tableStartRow = this.addStaticHeaderToSheet(sheet[num],num);   
        }
      }
      if(transpose == false)
      {
        for(let sheetnum=0;sheetnum<sheet.length;sheetnum++)
        {
          if(jsondata[sheetnum] != undefined && jsondata[sheetnum].length) {
            let key = Object.keys(jsondata[sheetnum][0]);

            if (sheet[sheetnum].name.toLowerCase() === 'movement summary') {
              const reqIndex = key.findIndex(k => k.toLowerCase() === 'requestid');
              if (reqIndex > -1) {
                const reqKey = key.splice(reqIndex, 1)[0];
                key.unshift(reqKey);
              }
            }
            if(sheetnum == 2 && (id == 'tat-all-rep' || id == 'tat-all-rep-ot'))
            {
              let it=[]
              let fullData = []
              let loc : number = 0;
              let len : number = 0;
              for(let i=0;i<jsondata[sheetnum].length;i++)
              {
                if(len<Object.keys(jsondata[sheetnum][i]).length)
                {
                  len=Object.keys(jsondata[sheetnum][i]).length;
                  loc = i;
                }
              }
              it.push(Object.keys(jsondata[sheetnum][loc]));
              fullData.push(Object.keys(jsondata[sheetnum][loc]));
              for(let i=0;i<jsondata[sheetnum].length;i++)
                {
                  it.push(Object.values(jsondata[sheetnum][i]))
                  fullData.push(Object.values(jsondata[sheetnum][i]))
                }
              for(let i=0;i<it.length;i++){
                it[i].splice(7,1)
              }
              for(let i=0;i<it.length;i++){
                const colIndex = this.shouldAddSerialNo(sheet.name) ? i + 2 : i + 1;
                sheet[sheetnum].getColumn(colIndex).values=it[i];
                sheet[sheetnum].getColumn(colIndex).width = (it[i].reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+2;
                }
              sheet[sheetnum].getColumn(1).font = {bold:true}
              sheet[sheetnum].spliceRows(9,1)
            } else{
              this.addColumnHeaderRow(
                sheet[sheetnum],
                sheet[sheetnum]._tableStartRow,
                key,
                sheet[sheetnum].name
              );
              for(let i=0;i<jsondata[sheetnum].length;i++)
              {
                sheet[sheetnum].addRow(
                  key.map(k => jsondata[sheetnum][i][k])
                )
              }
              if (this.shouldAddSerialNo(sheet[sheetnum].name)) {
                sheet[sheetnum].eachRow((row, rowNumber) => {
                  if (rowNumber > sheet[sheetnum]._tableStartRow) {
                    const values = row.values as any[];
                    values.splice(1, 0, null); 
                    row.values = values;
                  }
                });

                this.populateSerialNo(
                  sheet[sheetnum],
                  sheet[sheetnum]._tableStartRow
                );
              }
              for(let i=0;i<key.length;i++)
              {
                let data=[]
                const colIndex = this.shouldAddSerialNo(sheet.name) ? i + 2 : i + 1;
                data=sheet[sheetnum].getColumn(colIndex).values.filter(Boolean);
                if(id == 'emp-contact'){
                if (sheet.getRow(sheet[sheetnum]._tableStartRow).getCell(i + 1).value === 'EVENT DATE') {
                  sheet[sheetnum].getColumn(i+1).eachCell(function(cell){
                    if(cell.row != 1 && cell.value != undefined){
                      cell.numFmt = 'YYYY-MM-DD';
                      cell.value = new Date(cell.value)
                    }
                  })
                }
              } else if(id == 'staff-contact'){
                if (sheet.getRow(sheet[sheetnum]._tableStartRow).getCell(i + 1).value === 'EVENT DATE') {
                  sheet[sheetnum].getColumn(colIndex).eachCell(function(cell){
                    if(cell.row != 1 && cell.value != undefined){
                      cell.numFmt = 'YYYY-MM-DD';
                      cell.value = new Date(cell.value)
                    }
                  })
                }
              }else if(id == 'emp-ccd-agg'){
                if(sheet[sheetnum].getColumn(colIndex)._header == "EVENTDATE"){
                  sheet[sheetnum].getColumn(colIndex).eachCell(function(cell){
                    if(cell.row != 1 && cell.value != undefined){
                      cell.numFmt = 'YYYY-MM-DD';
                      cell.value = new Date(cell.value)
                    }
                  })
                }
              }
                if(typeof data[1] != 'string')
                {
                  sheet[sheetnum].getColumn(colIndex).width= data[0].length;
                }
                else{
                  sheet[sheetnum].getColumn(colIndex).width=(data.reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+5;
                }   
              }
                sheet[sheetnum].getRow(1).font={bold:true}
            }     
            // to remove children column in emp con tracing
            if (id == 'contact-tree' || id == 'emp-contact') {
              console.log(sheetnum%2)
              if((sheetnum%2) == 0){
                sheet[sheetnum].spliceColumns(8, 1)
                sheet[sheetnum].spliceColumns(14, 2)
              } else{
                  sheet[sheetnum].spliceColumns(6, 1)
                  sheet[sheetnum].spliceColumns(7, 1)
                  sheet[sheetnum].spliceColumns(13, 1)
              }
              }
              if (id == 'staff-contact') {
                console.log(sheetnum%2)
                if((sheetnum%2) == 0){
                  sheet[sheetnum].spliceColumns(8, 1)
                  sheet[sheetnum].spliceColumns(14, 2)
                } else{
                    sheet[sheetnum].spliceColumns(6, 1)
                    sheet[sheetnum].spliceColumns(7, 1)
                    sheet[sheetnum].spliceColumns(13, 1)
                }
                }
            if (id == 'pat-contact') {
              sheet[sheetnum].spliceColumns(14, 1) 
            }
          }
        }  
        if(id == 'site-nav'){
          sheet[0].spliceColumns(8, 2)
          sheet[1].spliceColumns(7, 2)
          sheet[1].spliceColumns(8, 1)
        }   
        if(id == 'stf-routin-sumary' || id == 'pat-routin-sumary' || id == 'task-activity-compliance') {
          sheet[0].spliceColumns(4, 1)
          sheet[1].spliceColumns(4, 1)
          sheet[2].spliceColumns(4, 1)
        }
        if(id == 'ER-Rep-new'){
          sheet[0].spliceColumns(7,1)
        } 
        if(id == 'asset-util-patient'){
          sheet[0].spliceColumns(5,1)
        }
        if(id == 'emp-ccd-agg'){
          sheet[1].spliceColumns(1,1)
          sheet[1].spliceColumns(6,1)
          sheet[0].spliceColumns(1,1)
          sheet[0].spliceColumns(6,2)
        } 
        if(id == 'infant-alert'){
          sheet[0].spliceColumns(3,1)
        }  
    } else if(id == 'porter-daily-tat' || id == 'porter-delay-byloc' || id == 'porter-byloc' || id == 'porter-jb-dtat' || id == 'porter-jb-wtat'){
      for(let i=0;i<jsondata.length;i++){
        if(jsondata[i].length) {
          sheet[0].addRow([sheetName[0][i]]);
          sheet[0].lastRow.font = {bold: true};
          let key= Object.keys(jsondata[i][0]);
          sheet[0].addRow(key);
          sheet[0].lastRow.font = {bold: true};
          // for(let j=0;j<key.length;j++)
          // {
          //   sheet[0].getColumn(j+1).header=key[j].toUpperCase()
          // }
          for(let j=0;j<jsondata[i].length;j++)
          {
            sheet[0].addRow(Object.values(jsondata[i][j]))
          }
          sheet[0].addRow();
          // sheet[0].addPageBreak();
        }
      }
      let rows = sheet[0].lastRow;
      sheet[0].columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
      });
    } else if(id == 'tat-by-shift'){
      sheet[0].mergeCells('A1','K1');
      sheet[0].getCell('A1').value = excelFileName;
      sheet[0].getCell('A1').alignment = { horizontal:'center'} ;
      sheet[0].mergeCells('A2','K2');
      sheet[0].getCell('A2').value = json[2];
      sheet[0].getCell('A2').alignment = { horizontal:'center'} ;
      for(let i=0;i<jsondata.length;i++){
        if(jsondata[i].length) {
          let key= Object.keys(jsondata[i][0]);
          if(key.includes('children')){
            let dataIndex = key.indexOf('children')
            key.splice(dataIndex, 1);
            jsondata[i].forEach((element ,index)=> {
              let childrenData = element['children'];
              delete element['children'];
              for (const key in element) {
                element[key] = key +":"+ element[key];
              }
              sheet[i].addRow(Object.values(element));
              sheet[i].lastRow.font = {bold: true};
              let chidDataKeys = Object.keys(childrenData[0]);
              let index2 = chidDataKeys.indexOf('close')
              if(index2 > -1){
                chidDataKeys.splice(index2, 1)
              }
              sheet[i].addRow(chidDataKeys);
              sheet[i].lastRow.font = {bold: true};
              childrenData.forEach(childData => {
                delete childData.close; 
                sheet[i].addRow(Object.values(childData));
              });
            });
          } else{
            sheet[i].addRow(key);
            sheet[i].lastRow.font = {bold: true};
            for(let j=0;j<jsondata[i].length;j++)
            {
              sheet[i].addRow(Object.values(jsondata[i][j]))
            }
            sheet[i].addRow();
          }
        }
      } 
    }

    }

      if (sheetOrderConfig && sheetOrderConfig.length) {
        sheetOrderConfig.forEach((name, index) => {
          const ws = workbook.getWorksheet(name);
          if (ws) {
            ws.orderNo = index + 1;
          }
        });
      }
      
    workbook.worksheets.forEach(ws => {
      ws.getColumn(1).width = 20;
      ws.getCell('A1').value = ws.getCell('A1').value || ' ';

      ws.getColumn(2).width = 18;
      ws.getColumn(2).eachCell((cell, row) => {
        if (row > 1) {
          cell.numFmt = '@'; // prevent Excel numeric alignment
          cell.alignment = { horizontal: 'left' };
        }
      });

    });

      workbook.xlsx.writeBuffer()
        .then(buffer => FileSaver.saveAs(new Blob([buffer]), excelFileName + '_' + selectedDate + EXCEL_EXTENSION))
        .catch(err => console.log('Error writing excel export', err));
  
  }
  public multiSheet(arrayList, sheetList, fileName, startDate, tableColumns?,sheetOrderConfig ?,selectedRoutine ?,paramjson ?) {
    this.fileName = fileName
    this.selectedRoutine =selectedRoutine
    this.reportFrom = paramjson?.fdt
    this.reportTo = paramjson?.tdt
    let workbook = new excel.Workbook();
    let worksheet : any =[];
    for(let i in sheetList) {
      let objCols = [];
      let sheetCols = []
      worksheet[i] = workbook.addWorksheet(sheetList[i]);
      const tableStartRow = this.addStaticHeaderToSheet(worksheet[i], Number(i));
      if(arrayList[i].length) {
        if(tableColumns && tableColumns?.length && tableColumns[i]?.length){
          objCols = tableColumns[i];
        }else{
          objCols = Object.keys(arrayList[i][0]);
        }
        const sheetName = worksheet[i].name;
        this.addColumnHeaderRow(
          worksheet[i],
          tableStartRow,
          objCols,
          sheetName
        );
        worksheet[i].columns = objCols.map(col => ({
          key: col
        }));
      }
      worksheet[i].columns = sheetCols;
      let columnsToMerge = [];
      let columnsToPopulate = [];
      for(let index=0;index<sheetCols.length;index++){
        if(Array.isArray(arrayList[i][0][sheetCols[index]['header']])){
          columnsToPopulate.push(sheetCols[index]['header'])
        }else{
          columnsToMerge.push(sheetCols[index]['header'])
        }
      }
      for(let j=0; j < arrayList[i].length; j++) {
        if(columnsToPopulate.length){
          let maxLength = arrayList[i][j][columnsToPopulate[0]].length;
          let startRow = worksheet[i].rowCount + 1;
          for (let k = 0; k < maxLength; k++) {
            let newRow = {}
            if (k === 0) {
              for(let mergeIndex=0;mergeIndex<columnsToMerge.length;mergeIndex++){
                newRow[columnsToMerge[mergeIndex]] = arrayList[i][j][columnsToMerge[mergeIndex]]
              }
            } 
            for(let populateIndex=0;populateIndex<columnsToPopulate.length;populateIndex++){
              newRow[columnsToPopulate[populateIndex]] = arrayList[i][j][columnsToPopulate[populateIndex]][k] || ""
            }
            worksheet[i].addRow(newRow);
          }
          let endRow = startRow + maxLength - 1;

          columnsToMerge.forEach((header) => {
            let colIndex = worksheet[i].columns.findIndex(col => col.key === header) + 1; // Find the index of the header
            if (colIndex > 0) {
              worksheet[i].mergeCells(startRow, colIndex, endRow, colIndex);
            }
          });
        }else{
          worksheet[i].addRow(arrayList[i][j])
        }
      }              
      // worksheet[i].getColumn(i+1).width=(data.reduce(function (a, b) { return a.length > b.length ? a : b; }).length)+5;
      worksheet[i].getRow(1).font={bold:true}
      worksheet[i].columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
      });
    
    }

    if (sheetOrderConfig && sheetOrderConfig.length) {
      sheetOrderConfig.forEach((name, index) => {
        const ws = workbook.getWorksheet(name);
        if (ws) {
          ws.orderNo = index + 1;
        }
      });
  }
    workbook.xlsx.writeBuffer()
      .then(buffer => FileSaver.saveAs(new Blob([buffer]), fileName + '_' + startDate + EXCEL_EXTENSION))
      .catch(err => console.log('Error writing excel export', err));
  }

  public singleSheet(arrayList, sheetName, fileName, startDate) {
    let workbook = new excel.Workbook();
    let sheetCols = [];
    let worksheet = workbook.addWorksheet(sheetName);
    if (arrayList.length) {
      let objCols = Object.keys(arrayList[0]);
      for (let col in objCols) {
        sheetCols.push({ header: objCols[col], key: objCols[col], width: 35 });
      }
    }
    worksheet.columns = sheetCols;
    for (let j = 0; j < arrayList.length; j++) {
      worksheet.addRow(arrayList[j]);
    }
    worksheet.getRow(1).font = { bold: true };
    workbook.xlsx.writeBuffer()
      .then(buffer => FileSaver.saveAs(new Blob([buffer]),fileName + '_' + startDate + EXCEL_EXTENSION))
      .catch(err => console.log('Error writing excel export', err));
  }

  loadReportGeneratedBy() {
    if (!this.userId) {
      this.reportGeneratedBy = '-';
      return;
    }
    this.commonService.getUserLocationById(this.userId).subscribe({
      next: (res) => {
        this.reportGeneratedBy =
          res?.results?.userName || '';
      },
      error: () => {
        this.reportGeneratedBy = '-';
      }
    });
  }

  private addStaticHeaderToSheet(sheet: excel.Worksheet,sheetIndex: number = 0) {
    const config = this.excelHeaderConfig;

    if (!config || Object.keys(config).length === 0) {
      return 1;
    }

    const isFirstPageOnly = config.isFirstPageOnly === true;

    if (isFirstPageOnly && sheetIndex !== 0) {
      return 1;
    }

    Object.entries(config).filter(([key]) => key !== 'isFirstPageOnly' && key !== 'serialNoSheets').forEach(([label, value]) => {
      const row = sheet.addRow([label, value ?? '-']);
      row.getCell(1).font = { bold: true };
    });
    const headerRows: any[] = [
      ['Report Name', this.fileName],
      ['Report generated by', this.reportGeneratedBy || '-'],
      ['Report generated on', new Date().toLocaleString()]
    ];
    if(this.selectedRoutine){
      headerRows.push(['Report for Routine',this.selectedRoutine])
    }
    if (this.reportFrom) {
      headerRows.push(['Report for the Period From', this.reportFrom]);
    }
    if (this.reportTo) {
      headerRows.push(['Report for the Period till', this.reportTo]);
    }
    headerRows.forEach(rowData => {
      const row = sheet.addRow(rowData);
      row.getCell(1).font = { bold: true };
    });

    sheet.addRow([]);
    return sheet.rowCount + 1;
  }


  addColumnHeaderRow(sheet: excel.Worksheet, tableStartRow: number, headers: string[], sheetName?: string) {
    let finalHeaders = headers.map(h => h.toUpperCase());
    if (sheetName && this.shouldAddSerialNo(sheetName)) {
      finalHeaders = ['S.NO', ...finalHeaders];
    }
    sheet.spliceRows(tableStartRow, 0, finalHeaders);
    sheet.getRow(tableStartRow).font = { bold: true };
  }
  
  loadExcelHeaderConfig(){
    this.commonService.getConfigFile('excelHeader-config').subscribe({
        next: (res) => {
          this.excelHeaderConfig = res?.results?.contentObject || {};
          this.loadReportGeneratedBy()
        },
        error: () => {
          this.excelHeaderConfig = {};
        }
      });
    }

  private shouldAddSerialNo(sheetName: string): boolean {
    if (!sheetName || !this.excelHeaderConfig?.serialNoSheets) return false;

    return this.excelHeaderConfig.serialNoSheets
      .map((s: string) => s.trim().toLowerCase())
      .includes(sheetName.trim().toLowerCase());
  }

 private populateSerialNo(sheet: excel.Worksheet, tableStartRow: number) {
  let serial = 1;

  for (let i = tableStartRow + 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    if (row.values && row.values.length > 1) {
      const cell = row.getCell(1);
      cell.value = serial++;
      cell.alignment = { horizontal: 'left' };
    }
  }
}
}
